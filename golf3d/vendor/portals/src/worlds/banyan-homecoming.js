// World "banyan-homecoming": The Tree That Is a Forest.
// Sunrise over a misty Indian river plain, flown as one flying fox among thousands, home to a single banyan a
// kilometre across: over the dome, down through the hole in its heart and away through a hall of root pillars
// barred with low gold light. The hero (src/parts/banyan-homecoming.js) is the tree, its light and its colony; this
// file adds the plain outside (fields, river, mist, acacias, hills, sky), our own wings and the squadron round us,
// the langurs, peafowl, chital and parakeets, the seeded variations and the rare event.
//
// Beats (u): 0-0.19 over the plain and the dome (60 m sinking to 40, the dark well ahead) with the squadron, the bat
// funnel on the axis; 0.19-0.29 the dive through the oculus; 0.29-0.31 pull out over the courtyard; 0.32-0.385 low over
// the rain pool north of it, the pillars and the shafts doubled in still water (parakeets 0.345); 0.40 chital in a glade
// on the left; 0.425-0.44 a fanned peacock close on the right; 0.515-0.525 a second cock on the right; 0.535-0.56 three
// langurs bound along a bough across the way; 0.59-0.73 the mother grove under a higher roof: a giant on the left at
// 0.61-0.63, the elder dead ahead from 0.64 and passed close on the right at 0.70-0.72, bats landing overhead (rare: at
// 0.58-0.62 four langurs bound barking along the bat bough and the hung colony lets go in a wave); 0.74-0.83 the run to the clearing, its column
// of gold ahead, a cock gliding down across the way at 0.77-0.82; 0.837-0.888 through the sunlit west side of the
// courtyard under the open sky, the colony pouring down the well on our left, parakeets at 0.87, the ring ahead from
// 0.85; 0.89-1 the avenue to the arch and the ring. The look-at for each subject leaves the line of flight and settles
// on it as it comes up (gaze()). We fly as one of the squadron: all forty neighbours keep station 2 to 7 m from us, and on
// each downstroke our own wings bring a leading edge, a thumb claw and a wedge of amber membrane into the lower corners.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/banyan-homecoming.js';

const TAU = Math.PI * 2;
const PALETTE = ['#F3D9B8', '#FFC766', '#E8892B', '#CFC3A8', '#5E8F3A', '#173A26', '#0E6F8E'];

// membrane of a bat wing in (s, c): s along the span (wrist at .45), c from leading edge 0 to trailing edge 1.
// wingCut() says where the scalloped trailing edge ends; wingBone() is the distance to the nearest arm or finger bone.
const GL_WING = /* glsl */`
float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.); return length(pa - ba * h); }
float wingCut(float s){
  float e;
  if (s < .52) e = 1. - .2 * sin(3.1416 * s / .52);
  else if (s < .7) e = 1. - .2 * sin(3.1416 * (s - .52) / .18);
  else if (s < .9) e = 1. - .22 * sin(3.1416 * (s - .7) / .2);
  else e = 1. - .9 * (s - .9) / .1;
  return e;
}
float wingBone(vec2 q){
  vec2 k = vec2(1., .36); vec2 p = q * k, W = vec2(.45, .05) * k;
  float d = segD(p, vec2(0., .1) * k, W);
  d = min(d, segD(p, W, vec2(1., .12) * k));
  d = min(d, segD(p, W, vec2(.9, 1.) * k));
  d = min(d, segD(p, W, vec2(.7, 1.) * k));
  d = min(d, segD(p, W, vec2(.52, 1.) * k));
  return d;
}`;

// a disc of rings in the XZ plane
function discGeo(radii, seg, y) {
  const pos = [], idx = [];
  for (let r = 0; r < radii.length; r++) for (let i = 0; i <= seg; i++) { const a = (i / seg) * TAU; pos.push(Math.cos(a) * radii[r], y, Math.sin(a) * radii[r]); }
  const w = seg + 1;
  for (let r = 0; r < radii.length - 1; r++) for (let i = 0; i < seg; i++) { const a = r * w + i; idx.push(a, a + 1, a + w + 1, a, a + w + 1, a + w); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
  return g;
}

const RING_GAZE = 0.815;      // where along the flight the ring ahead takes the eye

export default {
  id: 'banyan-homecoming',
  name: 'The Tree That Is a Forest',
  category: 'wilderness',
  weirdness: 0.3,
  media: ['air', 'interior'],
  async build(ctx) {
    // ---- which visit is this: hour, season, weather, cast --------------------------------------------------
    const lr = ctx.rng.fork('look'), r1 = lr(), r2 = lr(), r3 = lr(), r4 = lr();
    const vary = ctx.vary || {}, vh = vary.hour || 'any', mood = vary.mood ?? r1;
    const hour = vh === 'night' ? 'night' : vh === 'day' ? 'day' : (vh === 'dawn' || vh === 'golden') ? 'sunrise'
      : mood < 0.5 ? 'sunrise' : mood < 0.8 ? 'day' : 'night';
    const season = r4 < 0.45 ? 'flush' : r4 < 0.72 ? 'figs' : 'monsoon';
    const weather = r2 > 0.5 ? 'clear' : r2 > 0.25 ? 'fog' : 'shower';
    const macaques = r1 > 0.6, mynas = r3 > 0.55;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const detail = ctx.quality?.detail ?? 1;
    const night = hour === 'night', day = hour === 'day';
    const rng = ctx.rng.fork('banyan-world'), noise = ctx.noise;
    const xw = (label) => makeRng(hashSeed('banyan-w-' + label + ':' + ctx.seed));      // later additions draw from their own generators
    await ctx.yield();

    // ---- the tree -------------------------------------------------------------------------------------------
    const hero = await buildHero(ctx, { palette: PALETTE, hour, season, weather, density: clamp(density, 0.8, 1.2) });
    await ctx.yield();
    const A = hero.anchors, sh = hero.shared, U = sh.U, mk = sh.mkMat;
    const path = makePath(A.flyThrough);
    const scene = new THREE.Scene();
    const sunDir = A.sunDir.clone(), sunH = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize();
    const RX = A.bounds.rx, RZ = A.bounds.rz;

    // ---- sky and air ------------------------------------------------------------------------------------------
    const fogHex = night ? '#182a48' : day ? '#cbd6d0' : '#e6cba8';
    const skyOpts = night
      ? { preset: 'night', ground: fogHex, horizon: '#1d3760', bake: true, renderer: ctx.renderer, clouds: { coverage: 0.2 },
          bodies: [{ direction: sunDir, size: 2.5, phase: 1, intensity: 1.15, dark: 0.03, glow: 0.3, glowColor: '#9db8ff' }], key: 0 }
      : day
        ? { preset: 'day', zenith: '#3d83c4', mid: '#8fbbd8', horizon: '#dde5da', ground: fogHex, sunDirection: sunDir, sunColor: '#fff0d2',
            sunSize: 1.4, sunIntensity: 11, clouds: false, clouds2: { coverage: 0.5, opacity: 0.4, stretch: 1 } }
        : { preset: 'dawn', zenith: '#2f80ac', mid: '#8fcdc2', horizon: '#f6cc9e', ground: fogHex, horizonPow: 5.5, midPow: 1.15, stars: 0,
            scatterColor: '#ffb872', scatter: 0.6, scatterPow: 4, sunDirection: sunDir, sunColor: '#ffd49a', sunSize: 1.7, sunIntensity: 11, sunGlow: 0.75,
            clouds: false, clouds2: { coverage: 0.55, lit: '#ffd2c2', shade: '#c4aab8', opacity: 0.5, stretch: 1, wind: [0.006, 0.002] } };
    const sky = makeSky({ rng: ctx.rng, ...skyOpts });
    scene.add(sky.object);
    const fogCol = new THREE.Color(fogHex);
    scene.fog = new THREE.FogExp2(fogCol, 0.00032);
    scene.add(hero.object);
    await ctx.yield();

    const VS_W = /* glsl */`
      varying vec3 vP, vN, vC; varying vec2 vUv;
      ${sh.GL_FOG_V}
      void main(){
        vP = position; vN = normal; vUv = uv;
        #ifdef USE_COLOR
          vC = color;
        #else
          vC = vec3(1.);
        #endif
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
    const mistAmt = (day ? 0.22 : 1) * (weather === 'fog' ? 1.3 : 1);
    const mistCol = night ? new THREE.Color(0.1, 0.16, 0.27) : day ? new THREE.Color(0.8, 0.84, 0.82) : new THREE.Color('#F3D9B8').multiplyScalar(0.98);
    const green = season === 'monsoon' ? 1 : season === 'figs' ? 0.45 : 0.25;
    const OU = {
      uOut: { value: new THREE.Vector4(mistAmt, night ? 1 : 0, weather === 'shower' ? 1 : 0, green) },
      uDome: { value: new THREE.Vector2(RX, RZ) }, uMistC: { value: mistCol }, uSkyC: { value: sky.horizonColor.clone() },
    };

    // ---- the plain: fallow fields, grass, the river with its sand bars, the tree's own long shadow ----------------
    {
      const g = discGeo([0, 300, 420, 560, 760, 1050, 1500, 2200, 3300, 5000, 8200], 64, -0.25);
      const m = mk({
        uniforms: { ...OU },
        vertexShader: VS_W,
        fragmentShader: /* glsl */`
          varying vec3 vP, vN, vC; varying vec2 vUv;
          uniform vec4 uOut; uniform vec2 uDome; uniform vec3 uMistC, uSkyC;
          ${sh.GL_COMMON}
          ${sh.GL_FOG_F}
          float inDome(vec2 q, float k){ return 1. - smoothstep(k - .08, k, length(q / uDome)); }
          void main(){
            vec2 p = vP.xz; float rr = length(p / uDome);
            if (rr < .9) discard;
            vec3 v = vP - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
            float nd = 1. - smoothstep(70., 320., d);
            // fields on a warped lattice, half of them split into strips
            vec2 w = p + (vec2(vnoise(p * .0035), vnoise(p * .0035 + 7.3)) - .5) * 240.;
            vec2 g = w / 185.; vec2 gi = floor(g), gf = fract(g);
            float split = step(.5, hash21(gi + 3.7));
            float id = fract(hash21(gi) + step(.5, gf.x) * split * .37);
            float e = min(min(gf.y, 1. - gf.y), min(gf.x, 1. - gf.x)); e = min(e, mix(1., abs(gf.x - .5), split));
            vec3 a = mix(vec3(.23, .16, .10), vec3(.36, .29, .15), smoothstep(.2, .3, id));          // fallow earth, stubble
            a = mix(a, vec3(.15, .21, .08), smoothstep(.5, .58, id));                                   // rough grass
            a = mix(a, vec3(.09, .19, .07), smoothstep(.8, .86, id));                                   // young crop
            a = mix(a, vec3(.12, .22, .07) * (.8 + .4 * id), uOut.w * .6);                              // after rain everything greens
            float fur = sin((gf.x * cos(id * 6.28) + gf.y * sin(id * 6.28)) * 190.) * step(id, .3);    // plough lines, near only
            a *= 1. + .12 * fur * nd;
            a = mix(a, vec3(.05, .09, .04), (1. - smoothstep(.012, .05, e)) * .7);                      // bunds and hedges
            a *= .68 + .64 * fbm2(p * .011);
            a *= 1. + nd * ((vnoise(p * .33) - .5) * .7 + (vnoise(p * 1.6) - .5) * .4);                 // tussocks under the wings
            a = mix(a, vec3(.17, .21, .08) * (.7 + .6 * vnoise(p * .06)), 1. - smoothstep(1.04, 1.45, rr));   // rank grass round the tree
            // the river
            float zc = -1560. + 170. * sin(p.x / 640.) + 60. * sin(p.x / 210. + 1.3);
            float rv = abs(p.y - zc);
            float bars = smoothstep(.42, .6, fbm2(vec2(p.x * .004, (p.y - zc) * .013) + 5.));
            float water = (1. - smoothstep(125., 150., rv)) * (1. - bars * .9);
            a = mix(a, vec3(.5, .42, .3), (1. - smoothstep(165., 215., rv)) * .85);
            // light: low sun raking rough ground, the dome's shadow thrown far across the fields
            float sl = 1. / max(uSunDir.y / max(length(uSunDir.xz), .05), .06);
            float shd = max(max(inDome(p + uSunH.xz * 8. * sl, 1.), inDome(p + uSunH.xz * 16. * sl, .96)), inDome(p + uSunH.xz * 25. * sl, .86));
            float sunK = clamp(uSunDir.y + .17, 0., .6) * (.75 + .5 * vnoise(p * .045));
            vec3 lit = uSunCol * sunK * (1. - shd * .92) + uSkyAmb * .95 + uShade * .3;
            vec3 col = a * lit * mix(vec3(1.), vec3(.14, .2, .35), uOut.y);                              // by night the fields are dim blue-grey
            vec3 R = reflect(vd, vec3(0., 1., 0.));
            float gl = max(dot(R, uSunDir), 0.); gl *= gl; gl *= gl; gl *= gl; gl *= gl;
            vec3 wcol = uSkyC * .82 + uSunCol * gl * gl * 1.5;
            col = mix(col, wcol, water);
            // mist lying in bands on the fields, thickest over the water
            float mb = smoothstep(.34, .72, fbm2(p * vec2(.0017, .0042) + vec2(uHall.z * .007, 3.)));
            mb = max(mb, (1. - smoothstep(100., 420., rv)) * .8);
            float ma = uOut.x * mb * smoothstep(70., 520., d) * .62;
            col = mix(col, uMistC * (1. + .25 * max(dot(vd, uSunH), 0.)), min(ma, .85));
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      const plain = new THREE.Mesh(g, m); plain.frustumCulled = false; scene.add(plain);
    }
    await ctx.yield();

    // ---- low blue hills on the horizon ------------------------------------------------------------------------
    {
      const seg = 160, pos = [], col = [], idx = [];
      const far = fogCol.clone(), blue = night ? new THREE.Color(0.03, 0.06, 0.13) : day ? new THREE.Color(0.42, 0.55, 0.66) : new THREE.Color(0.5, 0.52, 0.6);
      for (let L = 0; L < 2; L++) {
        const R = L ? 5600 : 7000, base = pos.length / 3, off = rng.range(0, 100);
        const c = far.clone().lerp(blue, L ? 0.62 : 0.4);
        for (let i = 0; i <= seg; i++) {
          const a = (i / seg) * TAU, x = Math.cos(a) * R, z = Math.sin(a) * R;
          const n = noise.fbm2(Math.cos(a) * 2.2 + off, Math.sin(a) * 2.2 - off, 4);
          const h = (L ? 60 : 110) + (L ? 150 : 210) * Math.max(0, n + 0.25) + 30 * noise.n2(a * 9 + off, 1.5);
          pos.push(x, -20, z, x, Math.max(8, h), z);
          col.push(far.r, far.g, far.b, c.r, c.g, c.b);
          if (i < seg) { const k = base + i * 2; idx.push(k, k + 2, k + 3, k, k + 3, k + 1); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3)); g.setIndex(idx);
      const hills = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
      hills.frustumCulled = false; scene.add(hills);
    }

    // ---- mist: three thin sheets lying over the fields, drifting ------------------------------------------------
    {
      const geos = [2.6, 5.6, 9.5].map((y) => discGeo([330, 520, 800, 1300, 2200, 3800], 48, y));
      const pos = [], lay = [], idx = []; let base = 0;
      geos.forEach((g, L) => {
        const p = g.attributes.position.array, ix = g.index.array;
        for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); lay.push(L); }
        for (let i = 0; i < ix.length; i++) idx.push(ix[i] + base);
        base += p.length / 3; g.dispose();
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('aL', new THREE.BufferAttribute(new Float32Array(lay), 1)); g.setIndex(idx);
      const m = mk({
        fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...OU },
        vertexShader: /* glsl */`
          attribute float aL; varying vec3 vP; varying float vL;
          void main(){ vP = position; vL = aL; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          varying vec3 vP; varying float vL;
          uniform vec4 uOut; uniform vec2 uDome; uniform vec3 uMistC;
          ${sh.GL_COMMON}
          void main(){
            vec2 p = vP.xz; vec3 v = vP - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
            float t = uHall.z;
            float n = fbm2(p * vec2(.0021, .0052) + vec2(t * .009 + vL * 3.1, vL * 7.7 - t * .003));
            float n2 = vnoise(p * .019 + vec2(-t * .03, vL * 5.));
            float band = smoothstep(.36 + .05 * vL, .7, n) * (.6 + .4 * n2);
            float a = uOut.x * band * (.34 - .07 * vL);
            a *= smoothstep(1.03, 1.3, length(p / uDome));                       // none inside the tree
            a *= smoothstep(18., 80., d) * (1. - smoothstep(2400., 3700., length(p)));
            a *= smoothstep(.0, .12, abs(vd.y));                                  // a sheet seen edge-on is not a line
            vec3 col = uMistC * (1.02 + .3 * max(dot(vd, uSunH), 0.)) + uSunCol * .03;
            gl_FragColor = vec4(col, clamp(a, 0., .7));
          }`,
      });
      const mist = new THREE.Mesh(g, m); mist.frustumCulled = false; mist.renderOrder = 3; scene.add(mist);
    }
    await ctx.yield();

    // ---- thorn scrub and flat-topped acacias on the plain, each with its long shadow -----------------------------
    const tanEl = Math.max(0.1, sunDir.y / Math.max(0.05, Math.hypot(sunDir.x, sunDir.z)));
    const plainSet = [];          // the trees and scrub of the plain: not drawn while we are deep under the roof, where none of it can be seen
    const lathe = (S, ox, oy, oz, sc, prof, seg, colf, lump) => {
      const base = S.count, w = seg + 1;
      for (let i = 0; i < prof.length; i++) {
        const pr = prof[Math.max(0, i - 1)], nx = prof[Math.min(prof.length - 1, i + 1)];
        let nr = -(nx[1] - pr[1]), ny = nx[0] - pr[0]; const nl = Math.hypot(nr, ny) || 1; nr /= nl; ny /= nl;
        for (let j = 0; j <= seg; j++) {
          const a = ((j % seg) / seg) * TAU, k = 1 + lump(i, j % seg), r = prof[i][0] * k * sc, c = colf(i, j % seg);
          S.v(ox + Math.cos(a) * r, oy + prof[i][1] * sc, oz + Math.sin(a) * r, Math.cos(a) * nr, ny, Math.sin(a) * nr, 0, prof[i][1], c[0], c[1], c[2]);
        }
      }
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < seg; j++) { const a = base + i * w + j; S.quad(a, a + 1, a + w + 1, a + w); }
    };
    const floraMat = mk({
      vertexColors: true, side: THREE.DoubleSide, uniforms: { ...OU },
      vertexShader: /* glsl */`
        uniform vec4 uHall;
        varying vec3 vP, vN, vC; varying float vH;
        ${sh.GL_FOG_V}
        void main(){
          vec4 wp = instanceMatrix * vec4(position, 1.);
          vec3 org = instanceMatrix[3].xyz; float sc = length(instanceMatrix[1].xyz);
          float sw = uv.y * uv.y * sc;
          wp.x += sin(uHall.z * 1.3 + org.x * .13 + org.z * .11 + uv.y * 2.) * .03 * sw;
          wp.z += cos(uHall.z * 1.1 + org.z * .17 + position.x * 3.) * .022 * sw;
          vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-4, 0.));
          vC = color * (.75 + .5 * fract(org.x * .37 + org.z * .71)); vH = uv.y;
          vec4 mvPosition = modelViewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN, vC; varying float vH;
        uniform vec4 uOut; uniform vec3 uMistC;
        ${sh.GL_COMMON}
        ${sh.GL_FOG_F}
        void main(){
          vec3 v = vP - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
          vec3 N = normalize(vN);
          float n = vnoise(vP.xz * 1.9 + vP.y * 1.3), n2 = vnoise(vP.xz * 6.3 + vP.y * 4.1);
          float cr = step(.79, vH), cl = vnoise(vP.xz * .85 + 3.) * .65 + vnoise(vP.xz * 2.4 + 8.) * .35;      // the flat crown is sprays of small leaf with gaps between: dappled, ragged, not a disc
          if (cr > .5 && d < 420. && cl < .34) discard;
          vec3 a = vC * (.62 + .5 * n + .3 * n2 * (1. - smoothstep(40., 140., d))) * ${day ? '.7' : '1.'} * mix(1., .42 + 1.05 * cl, cr);
          a = mix(a, a * vec3(.3, .5, .8), uOut.y);
          float dif = clamp(dot(N, uSunDir) * .75 + .25, 0., 1.);
          float thru = max(dot(vd, uSunDir), 0.);
          vec3 lit = uSunCol * (dif * .8 + .45 * thru * thru * step(.7, vH)) + uSkyAmb * (.5 + .4 * N.y) + uShade * .3;
          vec3 col = a * lit * mix(.4, 1., smoothstep(0., .45, vH));
          float m = uOut.x * (1. - smoothstep(.5, 8.5, vP.y)) * smoothstep(50., 380., d) * .7;
          col = mix(col, uMistC, m);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    {
      const SA = new sh.Store(), kc = [0, 0, 0];
      const bark = (t, a) => { const m = 0.8 - 0.3 * Math.sin(a); kc[0] = 0.075 * m; kc[1] = 0.052 * m; kc[2] = 0.036 * m; return kc; };
      sh.loft(SA, (t, o) => { o[0] = 0.06 * Math.sin(t * 2.4); o[1] = t * 0.82; o[2] = 0.03 * t; }, (t) => 0.036 * (1 - 0.5 * t) + 0.02 * Math.exp(-t * 9), [0, 0.2, 0.6, 1], 5, bark, 0, 0.82);
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + 0.4, ex = Math.cos(a) * 0.34, ez = Math.sin(a) * 0.34;
        sh.loft(SA, (t, o) => { o[0] = lerp(0.055, ex, t); o[1] = lerp(0.46, 0.84, Math.sqrt(t)); o[2] = lerp(0.016, ez, t); }, (t) => 0.016 * (1 - 0.4 * t), [0, 0.5, 1], 4, bark, 0, 0.8);
      }
      const leafG = green > 0.6 ? [0.07, 0.17, 0.04] : [0.11, 0.165, 0.05];
      const crown = (i) => { const k = i < 3 ? 1 : i < 4 ? 0.62 : 0.3; kc[0] = leafG[0] * k; kc[1] = leafG[1] * k; kc[2] = leafG[2] * k; return kc; };
      const prof = [[0.02, 1.0], [0.24, 0.988], [0.42, 0.955], [0.56, 0.895], [0.52, 0.835], [0.3, 0.8], [0.02, 0.81]];
      const lump = (o) => (i, j) => 0.2 * noise.n2(i * 1.7 + o, j * 2.3 - o);
      lathe(SA, 0, 0, 0, 1, prof, 8, crown, lump(1));
      lathe(SA, 0.36, 0.33, 0.2, 0.56, prof, 6, crown, lump(7));
      const acGeo = SA.geometry();
      const SB = new sh.Store();
      const bcol = (i) => { const k = i < 2 ? 1 : i < 3 ? 0.55 : 0.25; kc[0] = 0.085 * k; kc[1] = 0.12 * k; kc[2] = 0.05 * k; return kc; };
      lathe(SB, 0, 0, 0, 1, [[0.03, 1], [0.5, 0.82], [0.66, 0.42], [0.42, 0.02]], 6, bcol, (i, j) => 0.3 * noise.n2(i * 2.1 + 3, j * 1.9));
      const buGeo = SB.geometry();
      await ctx.yield();

      const nAc = Math.round(170 * (0.5 + 0.5 * detail)), nBu = Math.round(620 * detail);
      const nEntry = Math.round(18 * (0.5 + 0.5 * detail));          // the plain under the way in carries more of them (the same seeded rule, more draws)
      const ac = new THREE.InstancedMesh(acGeo, floraMat, nAc + nEntry), bu = new THREE.InstancedMesh(buGeo, floraMat, nBu);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      const p0 = path.pointAt(0);
      const spot = (kind, out, rg = rng) => {       // kind 0 round the rim, 1 under the approach, 2 anywhere on the plain
        for (let tries = 0; tries < 20; tries++) {
          let x, z;
          if (kind === 0) { const a = rg.range(0, TAU), k = 1.035 + 0.5 * rg() * rg(); x = Math.cos(a) * RX * k; z = Math.sin(a) * RZ * k; }
          else if (kind === 1) { x = p0.x + rg.range(-150, 190); z = p0.z + rg.range(-260, 60); }
          else { const a = rg.range(0, TAU), r = 380 + 1500 * rg(); x = Math.cos(a) * r * 1.25; z = Math.sin(a) * r; }
          if (sh.rho(x, z) < 1.035) continue;
          if (kind === 2 && noise.n2(x * 0.004, z * 0.004) < -0.15) continue;
          out[0] = x; out[1] = z; return true;
        }
        return false;
      };
      const o2 = [0, 0], shq = [];
      let na = 0;
      for (let i = 0; i < nAc; i++) {
        if (!spot(i % 4 === 0 ? 1 : i % 4 === 1 ? 0 : 2, o2)) continue;
        const h = rng.range(5.5, 10.5), wd = rng.range(0.95, 1.5);
        Q.setFromAxisAngle(Y, rng.range(0, TAU)); Sv.set(h * wd, h, h * wd); Pv.set(o2[0], -0.3, o2[1]);
        if (Math.hypot(o2[0], o2[1]) > 950) continue;            // too far off to be seen from our low way in
        ac.setMatrixAt(na++, M.compose(Pv, Q, Sv));
        shq.push(o2[0], o2[1], h, 0.5 * h * wd);
      }
      {       // more acacias on the plain under the way in, their shadows long across the grass: the tree behind them is a hundred times their size
        const er = xw('entry');
        for (let i = 0; i < nEntry; i++) {
          if (!spot(1, o2, er)) continue;
          const h = er.range(5.2, 8.2), wd = er.range(1.05, 1.45);
          Q.setFromAxisAngle(Y, er.range(0, TAU)); Sv.set(h * wd, h, h * wd); Pv.set(o2[0], -0.3, o2[1]);
          ac.setMatrixAt(na++, M.compose(Pv, Q, Sv)); shq.push(o2[0], o2[1], h, 0.5 * h * wd);
        }
      }
      ac.count = na; ac.instanceMatrix.needsUpdate = true; ac.frustumCulled = false; scene.add(ac); plainSet.push(ac);
      let nb = 0;
      for (let i = 0; i < nBu; i++) {
        if (!spot(i % 3 === 0 ? 1 : i % 3 === 1 ? 0 : 2, o2)) continue;
        const h = rng.range(0.9, 2.6), wd = rng.range(1.1, 2.2);
        Q.setFromAxisAngle(Y, rng.range(0, TAU)); Sv.set(h * wd, h, h * wd); Pv.set(o2[0], -0.3, o2[1]);
        if (Math.hypot(o2[0], o2[1]) > 950) continue;
        bu.setMatrixAt(nb++, M.compose(Pv, Q, Sv));
        if (i % 2 === 0) shq.push(o2[0], o2[1], h * 0.7, 0.6 * h * wd);
      }
      bu.count = nb; bu.instanceMatrix.needsUpdate = true; bu.frustumCulled = false; scene.add(bu); plainSet.push(bu);
      await ctx.yield();
      // shadows: one soft ellipse per crown, thrown far by the low sun
      const n = shq.length / 4, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
      const lx = -sunH.x, lz = -sunH.z, wx = -lz, wz = lx;
      for (let i = 0; i < n; i++) {
        const x = shq[i * 4], z = shq[i * 4 + 1], h = shq[i * 4 + 2], r = shq[i * 4 + 3];
        const c = Math.min(0.9 * h / tanEl, 70), hl = r + Math.min(0.12 * h / tanEl, 12) + c * 0.5, cx = x + lx * c * 0.5, cz = z + lz * c * 0.5;
        const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        for (let k = 0; k < 4; k++) {
          pos[(i * 4 + k) * 3] = cx + lx * hl * q[k][1] + wx * r * q[k][0]; pos[(i * 4 + k) * 3 + 1] = 0.12; pos[(i * 4 + k) * 3 + 2] = cz + lz * hl * q[k][1] + wz * r * q[k][0];
          uv[(i * 4 + k) * 2] = q[k][0]; uv[(i * 4 + k) * 2 + 1] = q[k][1];
        }
        idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendEquation: THREE.AddEquation,
        uniforms: { uCam: U.uCam, uK: { value: night ? 0.3 : day ? 0.5 : 0.62 } },
        vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying vec3 vP; uniform vec3 uCam; uniform float uK;
          void main(){
            float tr = (1. - smoothstep(.04, .16, abs(vUv.x))) * step(vUv.y, .2) * .8;          // the trunk's line
            float cr = 1. - smoothstep(.45, 1., length(vec2(vUv.x, (vUv.y - .45) * 1.8)));          // the crown's pool
            float a = max(tr, cr) * uK * (1. - smoothstep(500., 1500., length(vP - uCam)));
            gl_FragColor = vec4(mix(vec3(1.), vec3(.36, .46, .56), a), 1.);
          }`,
      });
      const shadows = new THREE.Mesh(g, m); shadows.frustumCulled = false; shadows.renderOrder = 1; scene.add(shadows);
    }
    await ctx.yield();

    // the route at every second metre, for finding where along it a thing in the world stands
    const RT = { n: Math.floor(path.length / 2) + 1, x: null, y: null, z: null };
    {
      RT.x = new Float32Array(RT.n); RT.y = new Float32Array(RT.n); RT.z = new Float32Array(RT.n); const v = new THREE.Vector3();
      for (let i = 0; i < RT.n; i++) { path.posAtDist(Math.min(i * 2, path.length), v); RT.x[i] = v.x; RT.y[i] = v.y; RT.z[i] = v.z; }
    }
    // metres along the route of the point on it nearest (x, z), looked for between two distances; rtD.d is how far off it is
    const rtD = { d: 0, i: 0 };
    const routeAt = (x, z, d0 = 0, d1 = path.length) => {
      let best = 1e18, bi = 0;
      for (let i = Math.max(0, Math.floor(d0 / 2)), i1 = Math.min(RT.n - 1, Math.ceil(d1 / 2)); i <= i1; i++) { const dx = RT.x[i] - x, dz = RT.z[i] - z, q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } }
      rtD.d = Math.sqrt(best); rtD.i = bi; return bi * 2;
    };
    // heads that follow us: each animal's head turns toward where we fly as far as its neck allows, when we are near enough to matter
    const watchers = [];
    const watch = (attr, i, x, z, yaw, lim) => watchers.push({ attr, i, x, z, yaw, lim, cur: 0 });
    function updateWatchers(dt, cx, cz) {
      const k = 1 - Math.exp(-dt * 3.5);
      for (let j = 0; j < watchers.length; j++) {
        const w = watchers[j], dx = cx - w.x, dz = cz - w.z, d = Math.hypot(dx, dz), dl = w.yaw - Math.atan2(-dz, dx);
        const a = clamp(Math.atan2(Math.sin(dl), Math.cos(dl)), -w.lim, w.lim), near = 1 - smoothstep(55, 80, d);
        w.cur += (a - w.cur) * (dt > 0 ? k : 1);
        w.attr.array[w.i * 4 + 2] = w.cur; w.attr.array[w.i * 4 + 3] = near; w.attr.needsUpdate = true;
      }
    }
    // what stands in the hall is drawn while it can be seen from where the lens is: with the lens under the roof and within
    // 160 m of the thing (by then the hall's haze has closed over it). Each thing is entered here with the places it
    // occupies; its middle and its reach are worked out from them
    const hallThings = [];
    const placed = (objs, pts) => {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, r = 0;
      for (const q of pts) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); }
      const x = (x0 + x1) / 2, z = (z0 + z1) / 2;
      for (const q of pts) r = Math.max(r, Math.hypot(q.x - x, q.z - z));
      const h = { o: objs, x, z, r: r + 3 }; hallThings.push(h); return h;
    };
    const instPts = (mesh, n) => { const out = [], e = mesh.instanceMatrix.array; for (let i = 0; i < n; i++) out.push({ x: e[i * 16 + 12], z: e[i * 16 + 14] }); return out; };
    // ---- flying foxes close to: the squadron round us, and our own wings ---------------------------------------
    const amberC = new THREE.Color(PALETTE[2]), mantleC = new THREE.Color(0.42, 0.22, 0.06);
    if (night) amberC.set(0.15, 0.19, 0.29);
    const GL_BATFRAG = /* glsl */`
      vec3 membrane(vec3 P, vec3 N, vec3 vd, vec2 sc, float sv, float own){
        float bone = 1. - smoothstep(.011, .03, wingBone(sc));
        bone = max(bone, 1. - smoothstep(.03, .1, sc.y + .25 * max(sc.x - .45, 0.)));
        float vein = vnoise(sc * vec2(46., 15.)) * .6 + vnoise(sc * vec2(13., 5.) + 3.) * .4;
        float th = max(dot(vd, uSunDir), 0.); th = th * mix(sqrt(th), th, own);         // a wing between us and the sun glows
        vec3 amb = uSkyAmb * .55 + uShade * .6 + uBounce * .3;
        vec3 col = vec3(.03, .022, .018) * (amb + uSunCol * sv * .35 * max(dot(N, uSunDir), 0.));
        // our own hand: the fingers fan from the wrist, the web between them is brightest midway
        float ray = abs(fract(atan(sc.y * .36 - .02, sc.x - .45 + 1e-4) * 2.6 + .15) - .5);
        bone = max(bone, (1. - smoothstep(.025, .075, ray)) * step(.47, sc.x) * own);
        float skin = (1. - bone) * (.72 + .5 * vein) * mix(1., (.3 + .8 * smoothstep(0., .5, ray)) * (.6 + .9 * vein), own);
        col += uAmberC * uSunCol * sv * skin * (.015 + .85 * th);                 // dark wings; amber only where the wing stands between us and the sun
        col += vec3(.2, .13, .09) * (uSkyAmb + uShade) * .22 * skin;              // away from it the skin is dusky brown, the bones darker in it
        float rimM = 1. - abs(dot(N, vd));
        col += (uSkyAmb * .5 + uSunCol * .5) * uWx.w * (bone * .07 + rimM * rimM * rimM * .16);          // by night: a cold silver edge
        return col;
      }`;
    const batUni = { uAmberC: { value: amberC }, uSq: { value: new THREE.Vector3(0, 0, 1) } };
    const NSQ = 40, NFOX = 11, squad = [];
    let squadMesh, batGeo, batFrag;
    {
      const P = [], N = [], C = [], W = [], idx = []; let n = 0;
      const v = (x, y, z, nx, ny, nz, r, g, b, s, sd, c, part) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(r, g, b); W.push(s, sd, c, part); return n++; };
      const rings = [[-0.19, 0.004, 0], [-0.165, 0.022, 0], [-0.13, 0.036, 0], [-0.095, 0.03, 0], [-0.05, 0.052, 1], [0.0, 0.058, 1], [0.06, 0.05, 2], [0.115, 0.03, 2], [0.15, 0.006, 2]];
      const cols = [[0.16, 0.08, 0.035], [mantleC.r, mantleC.g, mantleC.b], [0.035, 0.027, 0.022]], sides = 7;
      rings.forEach((r, i) => {
        for (let j = 0; j <= sides; j++) {
          const a = (j / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a), c = cols[r[2]], k = sa < -0.3 ? 0.5 : 1;
          v(ca * r[1] * 1.1, sa * r[1] * 0.9 + (i < 4 ? 0.012 : 0), r[0], ca, sa, 0, c[0] * k, c[1] * k, c[2] * k, 0, 0, 0, 0);
        }
      });
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) { const a = i * (sides + 1) + j; idx.push(a, a + 1, a + sides + 2, a, a + sides + 2, a + sides + 1); }
      for (const sd of [-1, 1]) {
        const a = v(sd * 0.018, 0.04, -0.125, 0, 1, 0, 0.05, 0.03, 0.02, 0, 0, 0, 0), b = v(sd * 0.036, 0.082, -0.112, 0, 1, 0, 0.05, 0.03, 0.02, 0, 0, 0, 0), c = v(sd * 0.042, 0.032, -0.098, 0, 1, 0, 0.05, 0.03, 0.02, 0, 0, 0, 0);
        idx.push(a, b, c);
      }
      const NSP = 9, NC = 3;
      for (const sd of [-1, 1]) {
        const base = n;
        for (let i = 0; i <= NSP; i++) for (let j = 0; j <= NC; j++) {
          const s = i / NSP, c = j / NC;
          const lead = -0.05 - 0.085 * Math.sin(Math.min(s / 0.45, 1) * Math.PI / 2) + Math.max(0, s - 0.45) * 0.3, trail = 0.14 - 0.1 * s;
          v(sd * (0.04 + s * 0.61), 0.012, lerp(lead, trail, c), 0, 1, 0, 0.03, 0.022, 0.018, s, sd, c, 1);
        }
        for (let i = 0; i < NSP; i++) for (let j = 0; j < NC; j++) { const a = base + i * (NC + 1) + j; idx.push(a, a + NC + 1, a + NC + 2, a, a + NC + 2, a + 1); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(W), 4)); g.setIndex(idx);
      // the squadron: forty neighbours and one law for all of them. Each holds a station in the ROUTE's own frame (metres
      // ahead of us along the route's tangent where we are, metres to its right, metres above), dealt once from the
      // squadron's own stream: 2.4 to 7 m from us, three in four of them ahead of us so that we see their backs and tails.
      // Those ahead fly as a wedge that opens from our own place (the further ahead, the wider and deeper it spreads), the
      // rest on our flanks and behind; no bat flies in another's wake or in ours (stations at least 1.15 m apart across
      // the line of flight, and 1.3 m off our own line, also when the formation closes up under the roof). Each beats on
      // its own phase and drifts round its station on its own two clocks. Under the roof proper a quarter of those ahead
      // (by draw) fall back to fly behind us in file between the pillars.
      const aI = new Float32Array((NSQ + NFOX) * 4), sq = xw('squadron');
      for (let i = 0; i < NSQ; i++) {
        let st = null;
        for (let tries = 0; !st; tries++) {
          const flank = i % 4 === 3, ahead = flank ? sq.range(-3.2, 0.6) : sq.range(2.6, 6.8), wide = flank ? 5.2 : 0.2 + 0.56 * ahead, deep = flank ? 2.6 : 0.15 + 0.34 * ahead;
          const side = sq.range(-wide, wide), up = sq.range(-deep, deep);
          const r = Math.hypot(ahead, side, up), apart = 1.15 * Math.pow(0.985, tries);
          if (r < 2.4 || r > 7 || Math.hypot(side, up * 0.6) < 1.3 || Math.hypot(ahead, Math.min(Math.abs(side), 2.3 + 0.36 * Math.abs(side)), up * 0.6) < 2.1) continue;
          let ok = true;
          for (let j = 0; j < squad.length && ok; j++) { const o = squad[j]; if (Math.abs(o.ahead - ahead) < 3.2 && Math.hypot(o.side - side, o.up - up) < apart) ok = false; }
          if (ok) st = [ahead, side, up];
        }
        squad.push({ ahead: st[0], side: st[1], up: st[2], back: -sq.range(0.9, 3.1), open: st[0] > 0.6 && sq.chance(0.25) ? 1 : 0, give: 0,
          dA: sq.range(0.4, 1.1), dS: sq.range(0.3, 0.65), dU: sq.range(0.25, 0.5), tilt: sq.range(0.08, 0.36),
          w1: sq.range(0.35, 0.8), p1: sq.range(0, TAU), w2: sq.range(0.25, 0.6), p2: sq.range(0, TAU) });
        aI.set([sq(), sq.range(2.3, 3.0), sq(), sq.range(0.94, 1.2)], i * 4);
      }
      // eleven more belong to the incoming stream (its lowest lane, close over the crowns: the scale of the tree)
      { const fb = xw('foxbeats'); for (let i = NSQ; i < NSQ + NFOX; i++) aI.set([fb(), fb.range(2.3, 3.0), fb(), 1.3], i * 4); }
      g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
      const m = mk({
        vertexColors: true, side: THREE.DoubleSide, uniforms: batUni,
        defines: { SQUADRON: 1 },          // (the squadron's own material: the hung bats, which borrow its fragment shader below, are lit as they were)
        vertexShader: /* glsl */`
          attribute vec4 aW, aI;
          uniform vec4 uHall; uniform vec3 uSq;
          varying vec3 vP, vN, vC; varying vec4 vW;
          ${sh.GL_FOG_V}
          void main(){
            float t = uHall.z, sd = aI.x, wt = t * 6.2832 * aI.y + sd * 40.;
            float gl = max(smoothstep(.6, .92, sin(t * .6 + sd * 31.)), uSq.y);
            float amp = .78 * (1. - .82 * gl) * (1. - .6 * uSq.x);
            float a1 = .12 + amp * sin(wt), a2 = amp * .8 * sin(wt - 1.) - .22 - .45 * uSq.x;
            vec3 p = position, n = normal;
            if (aW.w > .5) {
              float fold = 1. - .2 * uSq.x, dd = aW.x * .61 * fold, L1 = .27 * fold;
              float r1 = min(dd, L1), r2 = max(dd - L1, 0.), ao = a1 + a2;
              p.x = aW.y * (.04 + r1 * cos(a1) + r2 * cos(ao)); p.y = .012 + r1 * sin(a1) + r2 * sin(ao);
              p.z += uSq.x * aW.x * .1;
              float an = dd > L1 ? ao : a1; n = vec3(-aW.y * sin(an), cos(an), 0.);
            } else p.y -= .02 * amp * sin(wt);
            p *= aI.w;
            vec4 wp = instanceMatrix * vec4(p, 1.);
            vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * n + vec3(0., 1e-4, 0.)); vC = color; vW = aW;
            vec4 mvPosition = modelViewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP, vN, vC; varying vec4 vW; uniform vec3 uAmberC, uSq;
          ${sh.GL_COMMON}
          ${GL_WING}
          ${GL_BATFRAG}
          ${sh.GL_FOG_F}
          void main(){
            vec3 v = vP - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
            float above = smoothstep(15., 24., vP.y), sv = mix(sunVis(vP), 1., above);
            sv = max(sv, (1. - smoothstep(uOc.z - 4., uOc.z + 2., length(vP.xz - uOc.xy))) * smoothstep(6., 12., vP.y));      // in the well, above the rim's shadow
            vec3 N = normalize(vN); if (dot(N, vd) > 0.) N = -N;
            vec3 col;
            if (vW.w > .5) {
              if (vW.z > wingCut(vW.x)) discard;
              col = membrane(vP, N, vd, vW.xz, sv, 0.);
            } else {
              float dif = clamp(dot(N, uSunDir) * .7 + .3, 0., 1.), rim = 1. - max(dot(N, -vd), 0.);
              col = max(vC, vec3(0.)) * (uSkyAmb * .7 + uShade * .7 + uSunCol * sv * (dif + rim * rim * rim * .9)) + uSkyAmb * uWx.w * rim * rim * .6;
            }
            #ifdef SQUADRON
            // the squadron under the roof is never plain black (the design, light: shade 'lifted by warm bounce off the leaf floor,
            // never black'). Where the bat itself is under the roof (by its own height, the measure this shader reads the hall's
            // shade and the hall's haze by: 'above', just over this) the bounce off the litter reaches it from below at the
            // hall's own strength (uBounce, as on a face that looks down in hallLight, in sun and in shade alike): on the fur
            // by the fur's own colour, so the mantle shows chestnut; through the thin skin of the web by the skin's own dusky
            // brown (as membrane() has it), the finger bones staying dark in it, so a wing in the hall's shade is dark brown
            float under = 1. - above;
            col += (vW.w > .5 ? vec3(.2, .13, .09) * smoothstep(.011, .03, wingBone(vW.xz)) : max(vC, vec3(0.))) * uBounce * under;
            #endif
            col = mix(hallHaze(col, vP), col, above);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      squadMesh = new THREE.InstancedMesh(g, m, NSQ + NFOX); squadMesh.frustumCulled = false; scene.add(squadMesh);
      batGeo = g; batFrag = m.fragmentShader;
    }
    // the same animal with fewer facets, for the hundreds that hang (and let go) 6 m and more from the lens
    const batLod = (() => {
      const P = [], N = [], C = [], W = [], idx = []; let n = 0;
      const v = (x, y, z, nx, ny, nz, r, g, b, s, sd, c, part) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(r, g, b); W.push(s, sd, c, part); return n++; };
      const rings = [[-0.19, 0.004, 0], [-0.13, 0.036, 0], [-0.095, 0.03, 0], [-0.05, 0.052, 1], [0.0, 0.058, 1], [0.06, 0.05, 2], [0.15, 0.006, 2]];
      const cols = [[0.16, 0.08, 0.035], [mantleC.r, mantleC.g, mantleC.b], [0.035, 0.027, 0.022]], sides = 6;
      rings.forEach((r, i) => {
        for (let j = 0; j <= sides; j++) {
          const a = (j / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a), c = cols[r[2]], k = sa < -0.3 ? 0.5 : 1;
          v(ca * r[1] * 1.1, sa * r[1] * 0.9 + (i < 3 ? 0.012 : 0), r[0], ca, sa, 0, c[0] * k, c[1] * k, c[2] * k, 0, 0, 0, 0);
        }
      });
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) { const a = i * (sides + 1) + j; idx.push(a, a + 1, a + sides + 2, a, a + sides + 2, a + sides + 1); }
      for (const sd of [-1, 1]) {
        const a = v(sd * 0.018, 0.04, -0.125, 0, 1, 0, 0.05, 0.03, 0.02, 0, 0, 0, 0), b = v(sd * 0.036, 0.082, -0.112, 0, 1, 0, 0.05, 0.03, 0.02, 0, 0, 0, 0), c = v(sd * 0.042, 0.032, -0.098, 0, 1, 0, 0.05, 0.03, 0.02, 0, 0, 0, 0);
        idx.push(a, b, c);
      }
      const NSP = 6, NC = 2;
      for (const sd of [-1, 1]) {
        const base = n;
        for (let i = 0; i <= NSP; i++) for (let j = 0; j <= NC; j++) {
          const s = i / NSP, c = j / NC;
          const lead = -0.05 - 0.085 * Math.sin(Math.min(s / 0.45, 1) * Math.PI / 2) + Math.max(0, s - 0.45) * 0.3, trail = 0.14 - 0.1 * s;
          v(sd * (0.04 + s * 0.61), 0.012, lerp(lead, trail, c), 0, 1, 0, 0.03, 0.022, 0.018, s, sd, c, 1);
        }
        for (let i = 0; i < NSP; i++) for (let j = 0; j < NC; j++) { const a = base + i * (NC + 1) + j; idx.push(a, a + NC + 1, a + NC + 2, a, a + NC + 2, a + 1); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(W), 4)); g.setIndex(idx);
      return g;
    })();
    await ctx.yield();

    // ---- our own wings: on each downstroke the dark leading edge (forearm, wrist with its thumb claw, the long finger)
    //      comes up out of each lower corner, with a narrow wedge of thin membrane under it: amber where the sun stands
    //      behind it, the finger bones dark in it, dusky and half see-through where it does not. The two corners are
    //      mirror images on one beat (each under 1.5% of the frame); folded small in the dive; held out flat, outside the
    //      frame, while the route bends hard. Two cards in the camera's own space; hidden through a portal.
    const wingU = { uWf: { value: new THREE.Vector4(1, 0.6, 0.9, 1) }, uWk: { value: new THREE.Vector4(0, 0, 0, 0) }, uWingM: { value: new THREE.Matrix4() }, uAmberC: batUni.uAmberC };
    let ownWings;
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -1, 1, 0, -1, 1, 1, -1, 0, 1, -1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1]), 3));
      g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
      const m = mk({
        side: THREE.DoubleSide, transparent: true, depthWrite: false, depthTest: false, uniforms: wingU,
        vertexShader: /* glsl */`
          uniform vec4 uWf, uWk; uniform mat4 uWingM;
          varying vec2 vQ; varying vec3 vPw; varying float vS;
          void main(){
            // measured in frame heights (of a 16:9 frame's, on a tall screen) from the corner: x in from the side edge, y up
            // from the bottom edge. The wing comes in along its own arm on the downstroke and goes back out along it on the upstroke
            float sd = position.z, k = uWk.x, unit = uWf.w * .5625, sc = 1. - .42 * uWk.z;
            vec2 q = position.xy * vec2(.36, .24) - vec2(.04, .03);
            vec2 at = (q * sc - (1. - k) * vec2(.33, .21)) * unit;
            vec3 cs = vec3(sd * (uWf.x - at.x), at.y - uWf.y, -uWf.z);
            vQ = q; vS = sd; vPw = (uWingM * vec4(cs, 1.)).xyz;
            gl_Position = projectionMatrix * vec4(cs, 1.);
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vQ; varying vec3 vPw; varying float vS; uniform vec3 uAmberC;
          ${sh.GL_COMMON}
          float segW(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.); return length(pa - ba * h); }
          void main(){
            // the forearm comes up out of the corner to the wrist (W) with its thumb claw; the long finger runs on from it, two
            // lesser fingers fan below; the web is only the narrow wedge under that leading edge, scalloped from tip to tip
            vec2 W = vec2(.11, .105), q = vQ - W;
            float rho = length(q), ph = atan(q.y, q.x + 1e-5);
            float dArm = segW(vQ, W, vec2(-.05, -.03));
            float d1 = segW(vQ, W, vec2(.272, .13)), d2 = segW(vQ, W, vec2(.25, .055)), d3 = segW(vQ, W, vec2(.172, -.03));
            float dClaw = min(segW(vQ, W, W + vec2(.006, .03)), segW(vQ, W + vec2(.006, .03), W + vec2(.024, .039)));
            float a1 = .155, a2 = -.343, a3 = -1.14, aArm = -2.44, t, edge;
            if (ph > a2) { t = clamp((a1 - ph) / (a1 - a2), 0., 1.); edge = mix(.164, .149, t) * (1. - .17 * sin(3.1416 * t)); }
            else if (ph > a3) { t = (a2 - ph) / (a2 - a3); edge = mix(.149, .2, t) * (1. - .2 * sin(3.1416 * t)); }
            else edge = 9.;
            float web = smoothstep(aArm, aArm + .04, ph) * (1. - smoothstep(a1 - .03, a1, ph)) * (1. - smoothstep(edge - .004, edge, rho));
            float taper = 1. - .55 * clamp(rho / .16, 0., 1.);
            float bone = max(1. - smoothstep(.0075, .0105, dArm), 1. - smoothstep(.0052 * taper, .0052 * taper + .0028, d1));
            bone = max(bone, 1. - smoothstep(.003 * taper, .003 * taper + .0024, min(d2, d3)));
            bone = max(bone, max(1. - smoothstep(.0028, .005, dClaw), 1. - smoothstep(.0105, .013, rho)));
            if (max(bone, web) < .02) discard;
            float vein = vnoise(vQ * vec2(95., 140.) + 3.) * .55 + vnoise(vQ * vec2(210., 120.)) * .45;
            float mid = smoothstep(0., .016, min(min(d1, d2), d3)) * smoothstep(0., .02, dArm) * smoothstep(0., .02, edge - rho);       // the web is thinnest between the bones and inside its hem
            vec3 v = vPw - uCam; vec3 vd = v / max(length(v), 1e-3);
            float sv = mix(sunVis(uCam), 1., smoothstep(15., 24., uCam.y));
            sv = max(sv, (1. - smoothstep(uOc.z - 4., uOc.z + 2., length(uCam.xz - uOc.xy))) * smoothstep(6., 12., uCam.y));
            float th = max(dot(vd, uSunDir), 0.); th *= sqrt(th);
            vec3 amb = uSkyAmb * .6 + uShade * .65 + uBounce * .4;
            vec3 cb = vec3(.028, .021, .017) * (amb + uSunCol * sv * .3);
            vec3 cw = vec3(.17, .105, .07) * amb * (.3 + .3 * vein) + uAmberC * uSunCol * sv * th * (.4 + .6 * mid) * (.6 + .6 * vein);
            float aw = web * mix(.7, .46, mid) * (.9 + .2 * vein);
            gl_FragColor = vec4(mix(cw, cb, bone), max(bone, aw));
          }`,
      });
      ownWings = new THREE.Mesh(g, m); ownWings.frustumCulled = false; ownWings.renderOrder = 8; ownWings.visible = false; scene.add(ownWings);
    }
    // how we are flying, read off the route itself where we are: the dive from its pitch, the held glide from how hard it
    // bends (the tightest weaving); the same two numbers fold and still the squadron's wings
    const fly = { dive: 0, glide: 0, bend: 0, pitch: 0 };
    const flyAt = (dist) => {
      path.tangentAtDist(Math.max(0, dist - 8), sqA); path.tangentAtDist(Math.min(path.length, dist + 8), sqB);
      fly.bend = Math.atan2(sqA.x * sqB.z - sqA.z * sqB.x, sqA.x * sqB.x + sqA.z * sqB.z) / 16;          // radians a metre, positive to the right
      path.tangentAtDist(dist, sqA); fly.pitch = sqA.y;
      fly.dive = smoothstep(0.2, 0.4, -sqA.y); fly.glide = smoothstep(0.0135, 0.017, Math.abs(fly.bend)) * (1 - fly.dive);
    };
    await ctx.yield();

    // ---- the pour: ONE stream of bats down the light well. It comes in over the north-east eave, swings round the well by
    //      the north and the west as it drops (over our line of flight, then down our left side and under us) and goes out low
    //      under the eastern eave; while we dive the hero hides the scattered foot of its funnel, so this ribbon is the pour.
    let pourMesh;
    {
      // each bat: a body card (dark head with ears, chestnut-gold mantle, dark rump) and two wings of two panels each, bent at the wrist
      const NP = Math.round(640 * (0.6 + 0.4 * detail)), pr = xw('pour'), NV = NP * 20;
      const pos = new Float32Array(NV * 3), aQ = new Float32Array(NV * 4), uv = new Float32Array(NV * 2), idx = new Uint32Array(NP * 30);
      for (let i = 0; i < NP; i++) {
        const sd = pr(), lat = (pr() + pr() + pr() - 1.5) / 1.5, ver = (pr() + pr() - 1);
        for (let w = 0; w < 5; w++) for (let c = 0; c < 4; c++) {
          const o = (i * 5 + w) * 4 + c, wing = w < 4, outer = w & 1, x0 = wing ? (outer ? -0.1 : -1) : -1, x1 = wing ? (outer ? 1 : -0.1) : 1;
          pos[o * 3] = lat; pos[o * 3 + 1] = ver; pos[o * 3 + 2] = wing ? 0 : 1;
          aQ[o * 4] = sd; aQ[o * 4 + 1] = w < 2 ? -1 : 1; aQ[o * 4 + 2] = lat; aQ[o * 4 + 3] = ver;
          uv[o * 2] = c === 0 || c === 3 ? x0 : x1; uv[o * 2 + 1] = c < 2 ? -1 : 1;
        }
        for (let w = 0; w < 5; w++) { const q = (i * 5 + w) * 4; idx.set([q, q + 1, q + 2, q, q + 2, q + 3], (i * 5 + w) * 6); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.BufferAttribute(aQ, 4)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = mk({
        side: THREE.DoubleSide, uniforms: { uAmberC: batUni.uAmberC, uMantleC: { value: night ? new THREE.Color(0.2, 0.17, 0.14) : new THREE.Color(0.62, 0.36, 0.1) } },
        vertexShader: /* glsl */`
          attribute vec4 aQ;
          uniform vec4 uHall, uOc; uniform vec3 uCam;
          varying vec3 vP, vW;
          ${sh.GL_FOG_V}
          const float PR[10] = float[10](58., 41., 28., 18.5, 15., 15.5, 17.5, 22., 33., 50.);
          const float PY[10] = float[10](30., 21., 14.5, 11.2, 9.8, 8.6, 7.6, 7.2, 7.6, 8.6);
          float crom(float a, float b, float c, float d, float t){ return b + .5 * t * (c - a + t * (2. * a - 5. * b + 4. * c - d + t * (3. * (b - c) + d - a))); }
          vec3 pourAt(float s){
            float f = clamp(s, 0., 1.) * 9.; int i = int(min(floor(f), 8.)); float t = f - float(i);
            int i0 = max(i - 1, 0), i3 = min(i + 2, 9);
            float r = crom(PR[i0], PR[i], PR[i + 1], PR[i3], t), y = crom(PY[i0], PY[i], PY[i + 1], PY[i3], t);
            float th = -.35 - 5.76 * s;
            return vec3(uOc.x + cos(th) * r, y, uOc.y + sin(th) * r);
          }
          void main(){
            float sd = aQ.x, t = uHall.z;
            float s = fract(sd * 7.31 + t * .05 * (.85 + .3 * fract(sd * 13.7)));
            s = s * (.62 + .38 * s);
            vec3 p0 = pourAt(s), p1 = pourAt(s + .012);
            vec3 A = p1 - p0; A = A / max(length(A), 1e-4);
            vec3 Rl = vec3(-A.z, 0., A.x); Rl = Rl / max(length(Rl), 1e-3); vec3 D = cross(Rl, A);
            // (the stream is some nine metres wide and five deep: a column of separate animals, not a rope)
            float wid = 4.6 + 1.2 * (1. - smoothstep(0., .07, s)) + 2.2 * smoothstep(.8, 1., s);
            vec3 F = p0 + Rl * (aQ.z * wid + .5 * sin(t * .9 + sd * 40.)) + D * (aQ.w * wid * .56 + .35 * sin(t * 1.3 + sd * 70.));
            float vis = smoothstep(0., .04, s) * (1. - smoothstep(.9, 1., s));
            float wt = t * (15. + 4. * sd) + sd * 100.;
            float gl = smoothstep(.55, .9, sin(t * .8 + sd * 31.)), amp = .85 * (1. - .75 * gl);
            float a1 = .12 + amp * sin(wt), a2 = a1 + amp * .75 * sin(wt - 1.1) - .25;
            vec3 P;
            if (position.z < .5) {
              float s01 = uv.x * .5 + .5, r1 = min(s01, .45), r2 = max(s01 - .45, 0.);
              P = F + A * (-uv.y * .2 - .07 * s01) + ((Rl * aQ.y * cos(a1) + D * sin(a1)) * r1 + (Rl * aQ.y * cos(a2) + D * sin(a2)) * r2) * .68;
              vW = vec3(s01, uv.y, 0.);
            } else {
              vec3 Wd = cross(A, F - uCam); Wd = Wd / max(length(Wd), 1e-3);
              P = F + A * (uv.y * .2 + .03) + Wd * uv.x * .09 - D * .02 * amp * sin(wt);
              vW = vec3(uv.x, uv.y, 1.);
            }
            float dc = length(uCam - F);
            P = F + (P - F) * vis * smoothstep(3., 6.5, dc) * 1.15 * clamp(dc / 34., 1., 1.25);
            vP = P;
            vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP, vW; uniform vec3 uAmberC, uMantleC;
          ${sh.GL_COMMON}
          ${sh.GL_FOG_F}
          void main(){
            vec3 v = vP - uCam; vec3 vd = v / max(length(v), 1e-3);
            float above = smoothstep(15., 24., vP.y), sv = mix(sunVis(vP), 1., above);
            sv = max(sv, (1. - smoothstep(uOc.z - 4., uOc.z + 2., length(vP.xz - uOc.xy))) * smoothstep(6., 12., vP.y));
            vec3 amb = uSkyAmb * .6 + uShade * .6, col;
            vec3 Ng = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0., 1e-7, 0.));
            if (vW.z > .5) {
              // the body from above or below: head and muzzle forward, two ears, the mantle across the shoulders
              float x = abs(vW.x), y = vW.y;
              float trunk = 1. - (y + .3) * (y + .3) / .56 - x * x / .62;
              float head = 1. - (y - .66) * (y - .66) / .075 - x * x / .34;
              float ear = 1. - (y - .84) * (y - .84) / .02 - (x - .46) * (x - .46) / .03;
              if (max(max(trunk, head), ear) < 0.) discard;
              float mant = smoothstep(-.08, .1, y) * (1. - smoothstep(.36, .5, y)) * step(head, trunk + .2);
              vec3 alb = mix(vec3(.07, .04, .025), uMantleC, mant);
              alb = mix(alb, vec3(.02, .016, .014), smoothstep(.42, .56, y));
              float round = 1. - x * x * .7;
              col = alb * (amb * 1.1 + uSunCol * sv * (.25 + .75 * round));
            } else {
              float sp = vW.x, c = vW.y;
              float lead = -.9 + .55 * abs(sp - .42), trail = .8 - .5 * sp - .24 * abs(sin(sp * 7.854));
              if (c < lead || c > trail || sp > .985) discard;
              float armB = 1. - smoothstep(.02, .16, c - lead);
              float ang = atan(c + .62, sp - .42 + 1e-4);
              float fing = (1. - smoothstep(.03, .1, abs(fract(ang * 1.9 + .25) - .5))) * step(.42, sp);
              float bone = max(armB, fing);
              float th = max(dot(vd, uSunDir), 0.); th *= sqrt(th);
              // the web is thin skin: where the sun stands on the far side of it from us it glows through, amber, the
              // bones dark in it; where the sun is on our side it is dusky brown
              float nv = dot(Ng, -vd), ns = dot(Ng, uSunDir), thru = step(nv * ns, 0.) * abs(ns);
              col = vec3(.024, .019, .017) * (amb + uSunCol * sv * (.35 + .5 * abs(ns) * (1. - step(nv * ns, 0.))));
              col += (1. - bone) * (uAmberC * uSunCol * sv * (.065 + .85 * th + .8 * thru) + vec3(.2, .13, .09) * amb * .26);
              col += bone * vec3(.34, .2, .1) * uSunCol * sv * .1 * abs(ns);                // the arm and fingers catch the sun as a rim
            }
            col = mix(hallHaze(col, vP), col, above);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      pourMesh = new THREE.Mesh(g, m); pourMesh.frustumCulled = false; scene.add(pourMesh);
    }
    // eleven more of the incoming stream fly its lowest lanes, close over the crowns: lines fixed in the world, along the
    // colony's own stream (the hero's, A.stream: the axis its bats on the wing fly in to the well), from far out over the
    // dome to the lip of the well, flown round and round on time. Each bat has a lane of its own: its place across the
    // stream is drawn from the bats' own stream over STREAM_W (where it reaches the well the stream is as wide as the
    // well's own mouth)
    const FX = { a: new THREE.Vector3(), d: new THREE.Vector3(), b: new THREE.Vector3(), len: 430, off: [] };
    {
      const oc = A.oculus, fr = xw('foxes'), STREAM_W = 2 * oc.radius;
      FX.d.subVectors(A.stream.to, A.stream.from).setY(0).normalize();          // the way the stream flies
      FX.b.set(-FX.d.z, 0, FX.d.x);
      FX.a.copy(oc.center).addScaledVector(FX.d, -(oc.radius + 4 + FX.len)); FX.a.y = oc.rimY + 8.5;
      for (let i = 0; i < NFOX; i++) FX.off.push([(i < 4 ? 0 : i < 8 ? 1 : 2) * FX.len / 3 + fr.range(-11, 11), fr.range(-STREAM_W / 2, STREAM_W / 2), fr.range(-1.3, 1.3), fr.range(0.4, 0.9), fr.range(0, TAU)]);
    }
    await ctx.yield();

    // ---- langurs (or bonnet macaques): sitting on buttresses, the bough and the feet of the arch; three bound along the bough
    const tube = (S, parts, id, pts, radii, sides, colf, shag = 0) => {
      const n = pts.length, ts = pts.map((_, i) => i / (n - 1)), a0 = S.count;
      const at = (arr, t, k) => { const f = clamp(t, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)); return lerp(arr[i][k], arr[i + 1][k], f - i); };
      const axis = (t, o) => { o[0] = at(pts, t, 0); o[1] = at(pts, t, 1); o[2] = at(pts, t, 2); };
      const rad0 = (t) => { const f = clamp(t, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)); return lerp(radii[i], radii[i + 1], f - i); };
      const rad = shag ? (t, a) => rad0(t) * (1 + shag * Math.sin(a * 3 + t * 17) + 0.6 * shag * Math.sin(a * 5 - t * 29)) : rad0;
      sh.loft(S, axis, rad, ts, sides, colf, 1, 1);
      for (let i = a0; i < S.count; i++) parts.push(id);
    };
    const finish = (S, parts) => { const g = S.geometry(); g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(parts), 1)); return g; };
    const kc2 = [0, 0, 0], setc = (c, m = 1) => { kc2[0] = c[0] * m; kc2[1] = c[1] * m; kc2[2] = c[2] * m; return kc2; };
    const fur = macaques ? [0.24, 0.16, 0.09] : [0.2, 0.2, 0.19], pale = macaques ? [0.4, 0.31, 0.2] : [0.46, 0.44, 0.38], skin = macaques ? [0.4, 0.2, 0.15] : [0.022, 0.02, 0.02];
    const tailL = macaques ? 0.6 : 1.05;
    const creatureMat = (extraV, uniforms = {}, extraF = '') => mk({
      vertexColors: true, side: THREE.DoubleSide, uniforms,
      vertexShader: /* glsl */`
        attribute float aPart; attribute vec4 aI;
        uniform vec4 uHall;
        varying vec3 vP, vN, vC, vO; varying float vRim, vPart;
        ${sh.GL_FOG_V}
        vec2 rot2(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(p.x * c - p.y * s, p.x * s + p.y * c); }
        void main(){
          float t = uHall.z, sd = aI.x; vec3 p = position, n = normal; vRim = 0.; vO = position; vPart = aPart;
          ${extraV}
          vec4 wp = instanceMatrix * vec4(p, 1.);
          vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * n + vec3(0., 1e-4, 0.)); vC = color;
          vec4 mvPosition = modelViewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN, vC, vO; varying float vRim, vPart;
        ${sh.GL_COMMON}
        ${sh.GL_FOG_F}
        void main(){
          vec3 v = vP - uCam; vec3 vd = v / max(length(v), 1e-3);
          vec3 N = normalize(vN); if (dot(N, vd) > 0.) N = -N;
          float fl = .8 + .4 * vnoise(vP.xz * 43. + vP.y * 31.);
          float rim = 1. - max(dot(N, -vd), 0.); rim *= rim;
          float sv = sunVis(vP);
          vec3 alb = max(vC, vec3(0.));
          ${extraF}
          vec3 col = alb * fl * (hallLight(vP, N, 1.) * 1.15 + uSunCol * sv * rim * .7 + (uSkyAmb + uShade) * rim * .35);
          // a bounding langur: its shade side takes the blue-grey of the hall's air, its sun side is silver, its outline is lit
          col += vRim * alb * fl * (uSkyAmb * .3 + uHazeCol * .3 + uShade * .2);
          col += vRim * rim * (.3 + .7 * max(N.y, 0.)) * (uSunCol * .05 + uSkyAmb * .22 + uHazeCol * .36);
          col = hallHaze(col, vP);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const langurMat = creatureMat(/* glsl */`
      vRim = aI.y;
      if (aPart > .5 && aPart < 1.5) {                       // tail: hangs and swings when sitting, streams when leaping
        float w = uv.y * uv.y;
        if (aI.y < .5) { p.z += (sin(t * 1.7 + sd * 20. - uv.y * 2.) * .15 + sin(t * 7.3 + sd * 9.) * .03 * smoothstep(.6, 1., sin(t * .4 + sd * 30.))) * w; p.x += cos(t * 1.3 + sd * 11.) * .07 * w; }
        else { p.y += sin(t * 9. + sd * 7. - uv.y * 4.) * .1 * w; p.z += cos(t * 7. - uv.y * 3.) * .05 * w; }
      } else if (aPart > 1.5 && aI.y < .5) {                 // head: looks about; turns to us and follows us when we are near
        float a = mix(.75 * sin(t * .45 + sd * 17.) * smoothstep(-.2, .7, sin(t * .21 + sd * 5.)), aI.z + .1 * sin(t * .8 + sd * 17.), aI.w);
        p.xz = rot2(p.xz - vec2(.1, 0.), a) + vec2(.1, 0.); n.xz = rot2(n.xz, a);
      }`);
    const leapers = [], underRoof = [];          // (underRoof: what sits under the leaf roof and cannot be seen from over the crown)
    let leapMesh, sitCount = 0;
    {
      const S1 = new sh.Store(), p1 = [];
      // the sitter: a round grey trunk, pale down its front; the black face set in a pale ruff under a grey crown; long
      // limbs round in section and shaggy (the thigh thick, the shin and forearm slender), black hands hung over the
      // knees and black feet flat on the perch; the tail hangs a metre
      const body = (t, a) => setc(Math.cos(a) > 0.25 ? pale : fur, 0.85 + 0.15 * Math.cos(a));
      const hair = (t, a) => setc(fur, 0.84 + 0.16 * Math.cos(a * 2 + t * 5)), ruffS = (t, a) => setc(pale, 0.86 + 0.1 * Math.sin(a * 5));
      const limb = (t, a) => (t > 0.93 ? setc(skin) : setc(fur, 0.8 + 0.14 * Math.cos(a * 2 + t * 7)));
      const black = () => setc(skin, 1.5);
      tube(S1, p1, 0, [[-0.02, 0.1, 0], [0.01, 0.22, 0], [0.05, 0.38, 0], [0.09, 0.5, 0], [0.11, 0.57, 0]], [0.1, 0.135, 0.125, 0.105, 0.06], 9, body, 0.05);
      tube(S1, p1, 2, [[0.035, 0.6, 0], [0.085, 0.632, 0], [0.13, 0.648, 0], [0.168, 0.646, 0]], [0.05, 0.1, 0.105, 0.04], 9, ruffS, 0.1);
      tube(S1, p1, 2, [[0.05, 0.63, 0], [0.1, 0.645, 0], [0.16, 0.65, 0], [0.215, 0.63, 0], [0.25, 0.61, 0]], [0.02, 0.078, 0.086, 0.06, 0.028], 8, (t, a) => (t > 0.5 && (Math.cos(a) < 0.75 || t > 0.72) ? setc(skin) : t > 0.5 ? setc(fur) : setc(pale, 0.95)));
      for (const s of [-1, 1]) {
        tube(S1, p1, 0, [[0, 0.1, s * 0.09], [0.14, 0.22, s * 0.13], [0.25, 0.3, s * 0.14]], [0.084, 0.07, 0.05], 8, hair, 0.07);
        tube(S1, p1, 0, [[0.25, 0.3, s * 0.14], [0.27, 0.14, s * 0.135], [0.27, 0.035, s * 0.13]], [0.048, 0.037, 0.03], 8, limb, 0.05);
        tube(S1, p1, 0, [[0.262, 0.04, s * 0.13], [0.33, 0.018, s * 0.133], [0.39, 0.014, s * 0.138], [0.415, 0.01, s * 0.14]], [0.03, 0.033, 0.026, 0.01], 6, black);
        tube(S1, p1, 0, [[0.1, 0.47, s * 0.115], [0.15, 0.34, s * 0.16], [0.17, 0.26, s * 0.165]], [0.052, 0.042, 0.035], 8, hair, 0.07);
        tube(S1, p1, 0, [[0.17, 0.26, s * 0.165], [0.23, 0.29, s * 0.15], [0.29, 0.315, s * 0.14]], [0.036, 0.03, 0.025], 8, limb, 0.05);
        tube(S1, p1, 0, [[0.285, 0.314, s * 0.14], [0.322, 0.305, s * 0.137], [0.35, 0.272, s * 0.134], [0.357, 0.24, s * 0.133]], [0.022, 0.027, 0.022, 0.008], 6, black);
      }
      const tp = [], tr = [];
      for (let i = 0; i <= 7; i++) { const t = i / 7; tp.push([-0.1 - 0.1 * Math.sin(t * 2.4), 0.07 - t * tailL + 0.05 * Math.sin(t * 3.14), 0]); tr.push(i === 7 ? 0.012 : 0.03 - 0.008 * t + (i === 6 ? 0.012 : 0)); }
      tube(S1, p1, 1, tp, tr, 6, (t) => setc(t > 0.85 ? pale : fur, 0.9));
      const sitGeo = finish(S1, p1);

      const S2 = new sh.Store(), p2 = [];
      // the bounding ones: a grey coat (silver where the sun is on it), a black face in a pale ruff, long limbs thick at
      // the thigh and shoulder with black hands and feet, the tail a metre long streaming behind
      const coat = (t, a) => setc(fur, 0.82 + 0.14 * Math.cos(a * 2 + t * 5)), ruffC = (t, a) => setc(pale, 1.05 + 0.1 * Math.sin(a * 5));
      const limb2 = (t, a) => (t > 0.76 ? setc(skin) : setc(fur, 0.64 + 0.1 * Math.cos(a)));
      tube(S2, p2, 0, [[-0.32, 0, 0], [-0.14, 0.05, 0], [0.08, 0.06, 0], [0.27, 0.035, 0], [0.36, 0.05, 0]], [0.1, 0.135, 0.145, 0.125, 0.085], 9, coat, 0.07);
      tube(S2, p2, 0, [[0.3, 0.06, 0], [0.35, 0.085, 0], [0.4, 0.1, 0], [0.445, 0.1, 0]], [0.07, 0.13, 0.138, 0.05], 9, ruffC, 0.1);
      tube(S2, p2, 0, [[0.36, 0.085, 0], [0.42, 0.1, 0], [0.47, 0.1, 0], [0.52, 0.088, 0], [0.555, 0.075, 0]], [0.03, 0.08, 0.092, 0.07, 0.034], 8, (t, a) => (t > 0.36 ? setc(skin) : ruffC(t, a)));
      for (const s of [-1, 1]) {
        // (reaching down and forward, and down and back: a bound, not a dive)
        tube(S2, p2, 0, [[0.24, -0.01, s * 0.1], [0.4, -0.18, s * 0.14], [0.52, -0.29, s * 0.13], [0.62, -0.335, s * 0.12]], [0.075, 0.058, 0.044, 0.04], 6, limb2, 0.06);
        tube(S2, p2, 0, [[-0.25, -0.01, s * 0.09], [-0.37, -0.19, s * 0.15], [-0.52, -0.24, s * 0.14], [-0.68, -0.34, s * 0.12]], [0.1, 0.08, 0.052, 0.042], 6, limb2, 0.06);
      }
      const tp2 = [], tr2 = [];
      for (let i = 0; i <= 7; i++) { const t = i / 7; tp2.push([-0.34 - t * tailL, 0.03 + 0.2 * Math.sin(t * 2.6), 0]); tr2.push(i === 7 ? 0.016 : 0.04 - 0.01 * t + (i === 6 ? 0.016 : 0)); }
      tube(S2, p2, 1, tp2, tr2, 5, (t) => setc(t > 0.85 ? pale : fur, t > 0.85 ? 1.0 : 0.9));
      const leapGeo = finish(S2, p2);
      await ctx.yield();

      // where they sit: on the bounding bough by its poles, on buttresses, along the great root and on the low limb, by
      // seeded draw from the troop's own stream. A sitter sits ACROSS its perch (the tail hangs free behind), facing by the
      // troop's habit: most toward the more open side of the perch (the aisle, not the next pillar), some toward the sun
      // to warm their fronts, each with a turn of its own; one of the root's party is its sentinel and watches the other way
      const seats = [];   // x y z yaw size
      const bg = A.bough, bAt = (s, o) => o.set(lerp(bg.a.x, bg.b.x, s), lerp(bg.a.y, bg.b.y, s) - bg.sag * Math.sin(Math.PI * s) + bg.r * 0.9, lerp(bg.a.z, bg.b.z, s));
      const tv = new THREE.Vector3(), lr = xw('troop'), pil = A.pillars;
      // the room on one side of a perch: from a point 5 m out on that side to the nearest pillar
      const room = (x, z, nx, nz) => { const px = x + nx * 5, pz = z + nz * 5; let m = 30; for (const q of pil) m = Math.min(m, Math.hypot(q.x - px, q.z - pz) - q.r); return m; };
      const faceAcross = (x, z, ax, az, turn, sentinel) => {
        let nx = -az, nz = ax; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
        const k = lr.chance(0.3) ? nx * sunH.x + nz * sunH.z : room(x, z, nx, nz) - room(x, z, -nx, -nz);
        if ((k < 0) !== !!sentinel) { nx = -nx; nz = -nz; }
        return Math.atan2(-nz, nx) + turn;
      };
      for (const s of [0.03, 0.97]) { bAt(s, tv); seats.push(tv.x, tv.y - 0.06, tv.z, faceAcross(tv.x, tv.z, bg.b.x - bg.a.x, bg.b.z - bg.a.z, lr.range(-0.4, 0.4), false), lr.range(1.15, 1.3)); }
      {
        // two on buttresses: of the near columns whose flank stands in a bar of sun, two by draw; each sits on the flank
        // the sun reaches, its back to the column
        const cand = [];
        for (const c of A.columns) {
          if (c.pole || c.ghost || c.r <= 0.75) continue;
          let best = 0, ba = 0; const R = c.r * 1.52 + 0.06;
          for (let k = 0; k < 8; k++) {
            const a = k * TAU / 8, x = c.x + Math.cos(a) * R, z = c.z + Math.sin(a) * R;
            const l = A.litAt(x, sh.floorY(x, z) + 1.5, z) * (0.55 + 0.45 * Math.max(0, Math.cos(a) * sunH.x + Math.sin(a) * sunH.z));
            if (l > best) { best = l; ba = a; }
          }
          if (best > 0.45) cand.push([c.x + Math.cos(ba) * R, c.z + Math.sin(ba) * R, ba]);
        }
        lr.shuffle(cand);
        for (let k = 0; k < Math.min(2, cand.length); k++) { const [x, z, a] = cand[k]; seats.push(x, sh.floorY(x, z) + 1.12, z, -a + lr.range(-0.3, 0.3), lr.range(1.1, 1.3)); }
      }
      {
        const FE = A.feats, sen = lr.int(0, FE.rootSeats.length - 1), young = lr.int(0, FE.rootSeats.length - 1);
        FE.rootSeats.forEach((q, i) => {
          const sz = i === young ? 0.7 : lr.range(1.18, 1.3);
          seats.push(q.x, q.y - 0.1 * sz, q.z, faceAcross(q.x, q.z, q.ax, q.az, q.turn, i === sen), sz);
        });
        const L = FE.langurLimb, ts = [];
        while (ts.length < 4) { const t = lr.range(0.24, 0.78); if (ts.every((o) => Math.abs(o - t) > 0.09)) ts.push(t); }
        ts.forEach((t, i) => {
          const sz = i === 2 ? 0.7 : lr.range(1.18, 1.3);
          L.at(t, tv);
          seats.push(tv.x, tv.y + L.r * 0.8 - 0.1 * sz, tv.z, faceAcross(tv.x, tv.z, L.b.x - L.a.x, L.b.z - L.a.z, lr.range(-0.5, 0.5), false), sz);
        });
      }
      const fc = A.portalSeat.facing;
      for (const f of A.archFeet) {
        const ix = A.portalSeat.position.x - f.x, iz = A.portalSeat.position.z - f.z, il = Math.hypot(ix, iz) || 1;
        let dx = fc.x * 0.8 + (ix / il) * 0.6, dz = fc.z * 0.8 + (iz / il) * 0.6; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
        const x = f.x + dx * 1.95, z = f.z + dz * 1.95;
        seats.push(x, sh.floorY(x, z) + 1.3, z, Math.atan2(-dz, dx), 1.3);
      }
      sitCount = seats.length / 5;
      const sit = new THREE.InstancedMesh(sitGeo, langurMat, sitCount), aI = new Float32Array(sitCount * 4);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < sitCount; i++) {
        const s = seats[i * 5 + 4]; Q.setFromAxisAngle(Y, seats[i * 5 + 3]); Sv.set(s, s, s); tv.set(seats[i * 5], seats[i * 5 + 1], seats[i * 5 + 2]);
        sit.setMatrixAt(i, M.compose(tv, Q, Sv)); aI.set([lr(), 0, 0, 0], i * 4);
      }
      const sitI = new THREE.InstancedBufferAttribute(aI, 4);
      sitGeo.setAttribute('aI', sitI);
      for (let i = 0; i < sitCount; i++) watch(sitI, i, seats[i * 5], seats[i * 5 + 2], seats[i * 5 + 3], 1.35);
      sit.instanceMatrix.needsUpdate = true; sit.frustumCulled = false; scene.add(sit); underRoof.push(sit);
      leapMesh = new THREE.InstancedMesh(leapGeo, langurMat, 3);
      leapGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0.1, 1, 0, 0, 0.5, 1, 0, 0, 0.83, 1, 0, 0]), 4));
      leapMesh.frustumCulled = false; scene.add(leapMesh); placed([leapMesh], [bg.a, bg.b]);
      // three bound along the bough across our way, in file: mid-bough when we are at the brief's beat (u 0.55)
      { const lp = xw('leapers'); for (let k = 0; k < 3; k++) leapers.push({ u0: 0.531 + 0.0042 * k, hops: 6, hopH: lp.range(0.8, 1.1) }); }
    }
    const lpA = new THREE.Vector3(), lpB = new THREE.Vector3(), lpX = new THREE.Vector3(), lpY = new THREE.Vector3(), lpZ = new THREE.Vector3(), lpM = new THREE.Matrix4();
    function leapAt(L, u, out) {      // position of a bounding langur on the bough
      const bg = A.bough, q = clamp((u - L.u0) / 0.03, 0, 1), h = q * L.hops, i = Math.min(L.hops - 1, Math.floor(h)), f = h - i;
      const e = f * f * (3 - 2 * f) * 0.55 + f * 0.45, s = lerp(0.1, 0.9, (i + e) / L.hops);
      out.set(lerp(bg.a.x, bg.b.x, s), lerp(bg.a.y, bg.b.y, s) - bg.sag * Math.sin(Math.PI * s) + bg.r + 0.44 + 4 * L.hopH * f * (1 - f), lerp(bg.a.z, bg.b.z, s));
      return q;
    }
    function updateLeapers(u) {
      for (let k = 0; k < 3; k++) {
        const L = leapers[k]; leapAt(L, u, lpA); leapAt(L, u + 0.0012, lpB);
        lpX.subVectors(lpB, lpA);
        if (lpX.lengthSq() < 1e-8) lpX.subVectors(A.bough.b, A.bough.a);
        lpX.normalize(); lpZ.set(-lpX.z, 0, lpX.x).normalize(); lpY.crossVectors(lpZ, lpX);
        lpM.makeBasis(lpX, lpY, lpZ).scale(lpB.set(1.3, 1.3, 1.3)).setPosition(lpA); leapMesh.setMatrixAt(k, lpM);
      }
      leapMesh.instanceMatrix.needsUpdate = true;
    }
    await ctx.yield();

    // ---- peafowl: two cocks displaying in their light bars, hens pecking round them, one cock gliding down ---------
    const blue = [0.006, 0.17, 0.3], bronze = [0.1, 0.17, 0.05], buff = [0.3, 0.25, 0.15], henBrown = [0.2, 0.155, 0.1], henPale = [0.46, 0.41, 0.31], horn = [0.34, 0.3, 0.22];
    const peaBody = (hen) => {
      const S = new sh.Store(), parts = [];
      tube(S, parts, 0, [[-0.3, 0.5, 0], [-0.18, 0.56, 0], [0.0, 0.6, 0], [0.14, 0.62, 0], [0.24, 0.66, 0]], [0.05, 0.13, 0.16, 0.14, 0.075], 8, (t, a) => {
        if (hen) return setc(Math.cos(a) < -0.2 ? henPale : henBrown, 0.8 + 0.3 * Math.abs(Math.sin(a * 3 + t * 9)));
        return t > 0.62 ? setc(blue, 1.1) : Math.abs(Math.sin(a)) > 0.55 && Math.cos(a) > -0.6 ? setc(buff, 0.6 + 0.6 * Math.abs(Math.sin(t * 40))) : setc(bronze);
      });
      tube(S, parts, 2, [[0.2, 0.68, 0], [0.275, 0.8, 0], [0.235, 0.95, 0], [0.27, 1.06, 0]], hen ? [0.072, 0.046, 0.036, 0.034] : [0.09, 0.06, 0.042, 0.038], 8, (t, a) => (hen ? setc(t > 0.45 ? [0.07, 0.2, 0.12] : henBrown) : setc(blue, 1.3 + 0.5 * Math.cos(a))));
      tube(S, parts, 3, [[0.235, 1.07, 0], [0.28, 1.09, 0], [0.33, 1.085, 0], [0.38, 1.07, 0], [0.425, 1.06, 0]], [0.018, 0.04, 0.043, 0.022, 0.005], 7, (t, a) => (t > 0.72 ? setc(horn) : t > 0.3 && Math.abs(Math.sin(a)) > 0.7 ? setc([0.7, 0.7, 0.64]) : setc(hen ? henBrown : blue, 1.2)));
      for (let k = -1; k <= 1; k++) {           // crest
        const a = S.v(0.275, 1.12, 0, 1, 0, 0, 0, 1, ...setc(hen ? henBrown : blue, 0.9)), b = S.v(0.25 + k * 0.03, 1.25, k * 0.035 - 0.012, 1, 0, 0, 0, 1, ...setc(hen ? henBrown : blue, 1.4)), c = S.v(0.25 + k * 0.03, 1.25, k * 0.035 + 0.012, 1, 0, 0, 0, 1, ...setc(hen ? henBrown : blue, 1.4));
        S.i.push(a, b, c); parts.push(3, 3, 3);
      }
      for (const s of [-1, 1]) tube(S, parts, 0, [[0.0, 0.5, s * 0.07], [0.03, 0.26, s * 0.075], [0.0, 0.03, s * 0.08], [0.08, 0.0, s * 0.08]], [0.032, 0.016, 0.014, 0.011], 4, () => setc(horn, 0.8));
      if (!hen) {
        // the breast pushed out, the wings dropped and trailing either side of it, the stiff grey tail that props the fan
        tube(S, parts, 0, [[0.1, 0.5, 0], [0.19, 0.57, 0], [0.26, 0.66, 0], [0.26, 0.76, 0]], [0.07, 0.125, 0.115, 0.07], 8, () => setc(blue, 1.35));
        for (const s of [-1, 1]) tube(S, parts, 0, [[0.14, 0.64, s * 0.12], [0.0, 0.57, s * 0.19], [-0.18, 0.46, s * 0.2], [-0.34, 0.33, s * 0.16]], [0.04, 0.085, 0.07, 0.02], 6,
          (t, a) => (t > 0.6 ? setc([0.4, 0.17, 0.05], 0.9) : setc(buff, 0.35 + 0.95 * Math.abs(Math.sin(t * 34 + a * 2)))));
        tube(S, parts, 0, [[-0.22, 0.55, 0], [-0.34, 0.74, 0], [-0.4, 0.98, 0]], [0.1, 0.12, 0.02], 6, () => setc([0.16, 0.14, 0.12], 0.9));
      }
      if (hen) tube(S, parts, 0, [[-0.26, 0.52, 0], [-0.45, 0.47, 0], [-0.64, 0.4, 0]], [0.08, 0.055, 0.015], 5, () => setc(henBrown, 0.8));
      return finish(S, parts);
    };
    const peaMat = creatureMat(/* glsl */`
      float pk = aI.y * smoothstep(.15, .85, sin(t * 1.1 + sd * 30.)) * (.82 + .18 * sin(t * 9. + sd * 5.));
      float nod = (1. - aI.y) * .12 * sin(t * .9 + sd * 12.);
      if (aPart > 1.5) {                                      // neck and head: pecking (hens) or the proud slow nod (cocks)
        float w = aPart > 2.5 ? 1. : uv.y;
        float a = -(pk * 1.85 + nod) * w;
        p.xy = rot2(p.xy - vec2(.2, .68), a) + vec2(.2, .68); n.xy = rot2(n.xy, a);
      }
      if (position.y > .4) { p.xy = rot2(p.xy - vec2(0., .5), -pk * .5) + vec2(0., .5); n.xy = rot2(n.xy, -pk * .5); }`);
    // the fan (and the glider's train): a pleated card with the eye spots drawn in the fragment shader
    const fanMat = mk({
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aI; attribute float aK;
        uniform vec4 uHall;
        varying vec3 vP, vN; varying vec2 vUv; varying float vK;
        ${sh.GL_FOG_V}
        void main(){
          float t = uHall.z, sd = aI.x; vec3 p = position;
          if (aK < .5) p.x += .02 * uv.y * sin(t * 31. + uv.x * 60.) * (.35 + .65 * smoothstep(.1, .8, sin(t * .7 + sd * 9.)));     // the shiver
          else { p.y += sin(t * 7. - uv.y * 5.) * .07 * uv.y; p.z += sin(t * 4.3 - uv.y * 4.) * .05 * uv.y; }                    // the train streams
          vec4 wp = instanceMatrix * vec4(p, 1.);
          vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-4, 0.)); vUv = uv; vK = aK;
          vec4 mvPosition = modelViewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN; varying vec2 vUv; varying float vK;
        ${sh.GL_COMMON}
        ${sh.GL_FOG_F}
        void main(){
          float rho = vUv.y, x = vUv.x;
          if (rho > .985 - .03 * abs(sin(x * 88.)) * step(vK, .5)) discard;
          vec3 v = vP - uCam; float dist = length(v); vec3 vd = v / max(dist, 1e-3);
          float barb = abs(fract(x * 56.) - .5) * 2.;
          vec3 alb = mix(vec3(.02, .16, .06), vec3(.13, .2, .03), smoothstep(.2, .9, rho) * (.5 + .5 * vnoise(vec2(x * 30., rho * 9.))));
          alb *= .72 + .36 * barb;
          float k = floor(rho * 6. - .3), rk = (k + .8) / 6.;
          float nn = 8. + 4. * k, cell = fract(x * nn + .5 * mod(k, 2.)) - .5;
          vec2 q = vec2(cell / nn * 3.5 * rk, (rho - rk) * .75) / .043;
          float e = length(q) * step(.5, k + .6);
          e += 4. * step(k, -.5);
          alb = mix(alb, vec3(.42, .22, .03), 1. - smoothstep(.85, 1.2, e));                   // bronze halo
          alb = mix(alb, vec3(.0, .42, .4), 1. - smoothstep(.55, .72, e));                     // turquoise ring
          alb = mix(alb, vec3(.01, .02, .3), 1. - smoothstep(.3, .42, length(q + vec2(0., .12))));    // the blue eye
          alb = mix(alb, vec3(.01, .05, .09), 1. - smoothstep(.12, .28, rho));
          vec3 N = normalize(vN); if (dot(N, vd) > 0.) N = -N;
          float sv = sunVis(vP), thru = max(dot(vd, uSunDir), 0.);
          float sheen = max(dot(reflect(vd, N), uSunDir), 0.); sheen *= sheen;
          vec3 col = alb * (hallLight(vP, N, 1.) * .9 + uSunCol * sv * (.1 + .5 * thru * thru + .35 * sheen) + (uSkyAmb + uShade) * .3);
          col = hallHaze(col, vP);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const cocks = [];
    let cockMesh, fanMesh, glideBody, glideTrain;
    {
      const rng = xw('peafowl');
      const cockGeo = peaBody(false), henGeo = peaBody(true);
      // fan
      // (a dish, not a card: it leans back as it rises and its two sides come forward round the bird; pleated)
      const NA = 40, RR = [0.08, 0.26, 0.44, 0.62, 0.8, 0.93, 1.0], FR = 1.16, fp = [], fn = [], fu = [], fi = [];
      for (let j = 0; j <= NA; j++) for (let r = 0; r < RR.length; r++) {
        const th = (j / NA - 0.5) * 3.7, rho = RR[r];
        fp.push(-0.3 + 0.22 * rho * rho + 0.024 * rho * (j % 2 ? 1 : -1) + 0.2 * rho * (1 - Math.cos(th)), 0.62 + rho * FR * Math.cos(th), rho * FR * Math.sin(th));
        fn.push(1, 0, 0); fu.push(j / NA, rho);
      }
      for (let j = 0; j < NA; j++) for (let r = 0; r < RR.length - 1; r++) { const a = j * RR.length + r; fi.push(a, a + 1, a + RR.length + 1, a, a + RR.length + 1, a + RR.length); }
      const fanGeo = new THREE.BufferGeometry();
      fanGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fp), 3)); fanGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(fn), 3));
      fanGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(fu), 2)); fanGeo.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(fu.length / 2), 1)); fanGeo.setIndex(fi);
      fanGeo.computeVertexNormals();
      fanGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0.2, 0, 0, 0, 0.7, 0, 0, 0]), 4));
      await ctx.yield();
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      cockMesh = new THREE.InstancedMesh(cockGeo, peaMat, 2); fanMesh = new THREE.InstancedMesh(fanGeo, fanMat, 2);
      cockGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0.2, 0, 0, 0, 0.7, 0, 0, 0]), 4));
      const henSpots = [];
      for (const key of ['peacockB', 'peacockA']) {
        const st = A.stations[key], n = path.nearestXZ(st.x, st.z), pr = path.pointAt(Math.max(0, n.u - 0.016));
        let yaw = Math.atan2(-(pr.z - st.z), pr.x - st.x);
        // turned a third of the way from facing us toward facing the sun, so the fan we see is the lit one
        const dy = Math.atan2(Math.sin(Math.atan2(-sunH.z, sunH.x) - yaw), Math.cos(Math.atan2(-sunH.z, sunH.x) - yaw)); yaw += 0.33 * clamp(dy, -1.4, 1.4);
        // the second stands up on a root knuckle in his bar of light, and is the bigger bird
        if (key === 'peacockA') cocks.push({ x: A.feats.perchA.x, y: A.feats.perchA.y - 0.04, z: A.feats.perchA.z, yaw, sd: rng.range(0, TAU), s: 1.25 });
        else cocks.push({ x: st.x, y: sh.floorY(st.x, st.z) - 0.02, z: st.z, yaw, sd: rng.range(0, TAU), s: 1.2 });
        for (let k = 0; k < 3; k++) {
          const a = yaw + (k - 1) * 1.5 + rng.range(-0.4, 0.4) + Math.PI * 0.15, d = rng.range(2.6, 4.0), x = st.x + Math.cos(a) * d, z = st.z - Math.sin(a) * d;
          henSpots.push(x, sh.floorY(x, z) - 0.02, z, rng.range(0, TAU), rng.range(1.0, 1.15));
        }
      }
      const nh = henSpots.length / 5, hens = new THREE.InstancedMesh(henGeo, peaMat, nh), hI = new Float32Array(nh * 4);
      for (let i = 0; i < nh; i++) {
        const s = henSpots[i * 5 + 4]; Q.setFromAxisAngle(Y, henSpots[i * 5 + 3]); Sv.set(s, s, s); Pv.set(henSpots[i * 5], henSpots[i * 5 + 1], henSpots[i * 5 + 2]);
        hens.setMatrixAt(i, M.compose(Pv, Q, Sv)); hI.set([rng(), 1, 0, 0], i * 4);
      }
      henGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(hI, 4));
      hens.instanceMatrix.needsUpdate = true;
      for (const o of [cockMesh, fanMesh, hens]) { o.frustumCulled = false; scene.add(o); }
      placed([cockMesh, fanMesh], cocks); placed([hens], instPts(hens, nh));
      await ctx.yield();

      // the glider: body level, neck out, wings spread, the long train streaming behind
      const S = new sh.Store(), parts = [];
      tube(S, parts, 0, [[-0.3, 0, 0], [-0.15, 0.02, 0], [0.05, 0.02, 0], [0.2, 0.03, 0], [0.3, 0.05, 0]], [0.06, 0.13, 0.15, 0.11, 0.06], 8, (t) => (t > 0.6 ? setc(blue, 1.1) : setc(bronze)));
      tube(S, parts, 0, [[0.28, 0.05, 0], [0.45, 0.11, 0], [0.6, 0.14, 0], [0.68, 0.15, 0], [0.75, 0.14, 0]], [0.06, 0.04, 0.035, 0.042, 0.006], 7, (t) => (t > 0.9 ? setc(horn) : setc(blue, 1.25)));
      for (const s of [-1, 1]) {
        const b0 = S.count;
        for (let i = 0; i <= 4; i++) for (let j = 0; j <= 2; j++) {
          const sp = i / 4, c = j / 2, col = sp > 0.45 ? [0.42, 0.17, 0.05] : (j === 1 ? [0.1, 0.09, 0.07] : buff);
          S.v(0.22 - c * (0.5 - 0.2 * sp) - sp * 0.1, 0.06 + 0.16 * sp, s * (0.1 + sp * 0.78), 0, 1, 0, sp, sp, col[0], col[1], col[2]); parts.push(4);
        }
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const a = b0 + i * 3 + j; S.quad(a, a + 3, a + 4, a + 1); }
      }
      const gGeo = finish(S, parts);
      gGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0.4, 0, 0, 0]), 4));
      const glideMat = creatureMat(/* glsl */`
        if (aPart > 3.5) { float w = uv.y; p.y += w * w * (.1 + .22 * sin(t * 11.) * smoothstep(.3, .9, sin(t * 1.3))); }`);
      glideBody = new THREE.InstancedMesh(gGeo, glideMat, 1); glideBody.frustumCulled = false; scene.add(glideBody);
      const tp = [], tn = [], tu = [], tk = [], ti = [], NT = 10;
      for (let v = 0; v < 2; v++) for (let i = 0; i <= NT; i++) for (let j = 0; j < 3; j++) {
        const t = i / NT, w = lerp(0.08, 0.3, smoothstep(0, 0.7, t)) * (1 - 0.45 * smoothstep(0.8, 1, t)) * (v ? 0.9 : 1);
        tp.push(-0.28 - t * 2.3, (v ? (j - 1) * w : 0) - 0.14 * t, v ? 0 : (j - 1) * w); tn.push(0, v ? 0 : 1, v ? 1 : 0); tu.push(0.36 + j * 0.14 + v * 0.03, 0.16 + 0.82 * t); tk.push(1);
      }
      for (let v = 0; v < 2; v++) for (let i = 0; i < NT; i++) for (let j = 0; j < 2; j++) { const a = v * (NT + 1) * 3 + i * 3 + j; ti.push(a, a + 3, a + 4, a, a + 4, a + 1); }
      const tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tp), 3)); tGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(tn), 3));
      tGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(tu), 2)); tGeo.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(tk), 1)); tGeo.setIndex(ti);
      tGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0.4, 0, 0, 0]), 4));
      glideTrain = new THREE.InstancedMesh(tGeo, fanMat, 1); glideTrain.frustumCulled = false; scene.add(glideTrain);
    }
    const ckM = new THREE.Matrix4(), ckQ = new THREE.Quaternion(), ckS = new THREE.Vector3(1.38, 1.38, 1.38), ckP = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    function updateCocks(time) {
      for (let i = 0; i < 2; i++) {
        const c = cocks[i];
        ckQ.setFromAxisAngle(UP, c.yaw + 0.3 * Math.sin(time * 0.33 + c.sd) + 0.06 * Math.sin(time * 2.1 + c.sd));
        ckM.compose(ckP.set(c.x, c.y, c.z), ckQ, ckS.set(c.s, c.s, c.s)); cockMesh.setMatrixAt(i, ckM); fanMesh.setMatrixAt(i, ckM);
      }
      cockMesh.instanceMatrix.needsUpdate = true; fanMesh.instanceMatrix.needsUpdate = true;
    }
    const gA = new THREE.Vector3(), gB = new THREE.Vector3(), gT = new THREE.Vector3(), gR = new THREE.Vector3(), gX = new THREE.Vector3(), gY = new THREE.Vector3(), gZ = new THREE.Vector3(), gM = new THREE.Matrix4();
    // the gliding cock: down from his night bough north of the way, across it from left to right a dozen metres ahead of us,
    // side on and banked so the spread wings show, in front of the clearing's column of gold at u 0.78; then down to the
    // litter on the far side. He crosses on a fixed line (chosen clear of the pillars), so we see the whole bird and train
    const GL = { u0: 0.752, uX: 0.78, c: new THREE.Vector3(), r: new THREE.Vector3() };
    {
      await ctx.yield();
      let best = -1e9; const c = new THREE.Vector3(), t = new THREE.Vector3(), r = new THREE.Vector3();
      path.posAtDist(GL.uX * path.length + 12, c);
      const nearP = A.pillars.filter((q) => Math.hypot(q.x - c.x, q.z - c.z) < 34 + q.r);      // only the pillars that could stand near the line
      for (const ahead of [12, 11, 13, 10, 14]) for (const yaw of [0, 0.12, -0.12, 0.24, -0.24]) {
        path.posAtDist(GL.uX * path.length + ahead, c); path.tangentAtDist(GL.uX * path.length + ahead, t);
        r.set(-t.z, 0, t.x).normalize().applyAxisAngle(UP, yaw);
        let clear = 1e9;
        for (let lat = -12; lat <= 13; lat++) { const x = c.x + r.x * lat, z = c.z + r.z * lat; for (const q of nearP) clear = Math.min(clear, Math.hypot(x - q.x, z - q.z) - q.r); }
        clear = Math.min(clear, 2.2) - Math.abs(yaw) - Math.abs(ahead - 12) * 0.2;
        if (clear > best) { best = clear; GL.c.copy(c); GL.r.copy(r); }
      }
    }
    function gliderAt(u, out) {
      const uu = clamp(u, GL.u0, 0.83);
      out.copy(GL.c).addScaledVector(GL.r, Math.min(2.5 + 470 * (uu - GL.uX), 13));
      out.y = sh.floorY(out.x, out.z) + lerp(12, 0.75, smoothstep(GL.u0, 0.812, uu));
    }
    function updateGlider(u) {
      gliderAt(u, gA); gliderAt(u + 0.003, gB);
      gX.subVectors(gB, gA); if (gX.lengthSq() < 1e-6) gX.copy(GL.r); gX.normalize();
      gZ.set(-gX.z, 0, gX.x).normalize(); gY.crossVectors(gZ, gX);
      const ph = 0.6 * (1 - smoothstep(0.795, 0.812, u)) * smoothstep(GL.u0, GL.u0 + 0.008, u);
      gB.copy(gY).multiplyScalar(Math.cos(ph)).addScaledVector(gZ, Math.sin(ph)); gZ.multiplyScalar(Math.cos(ph)).addScaledVector(gY, -Math.sin(ph)); gY.copy(gB);
      gM.makeBasis(gX, gY, gZ).scale(gB.set(1.3, 1.3, 1.3)).setPosition(gA);
      glideBody.setMatrixAt(0, gM); glideTrain.setMatrixAt(0, gM);
      glideBody.instanceMatrix.needsUpdate = true; glideTrain.instanceMatrix.needsUpdate = true;
    }
    await ctx.yield();

    // ---- the courtyard floor: pale grasses and seedling figs where the mother trunk stood (the only undergrowth) ----
    {
      const rng = xw('tufts');
      const nT = Math.round(2600 * (0.5 + 0.5 * detail)), tv3 = new THREE.Vector3(), tg3 = new THREE.Vector3(), pos = new Float32Array(nT * 24), aT = new Float32Array(nT * 32), uv = new Float32Array(nT * 16), idx = new Uint32Array(nT * 12);
      const oc = A.courtyard.center, R0 = A.courtyard.radius;
      for (let i = 0; i < nT; i++) {
        let x, z;
        if (i % 5 < 3) {          // thick along the line we pull out on, and along the way we cross the clearing later
          const uu = i % 5 < 2 ? rng.range(0.262, 0.31) : rng.range(0.836, 0.89), lat = rng.sign() * (0.3 + 18 * rng() * rng()) + rng.range(-1.5, 1.5); path.pointAt(uu, tv3); path.tangentAt(uu, tg3);
          x = tv3.x - tg3.z * lat; z = tv3.z + tg3.x * lat;
        } else { const a = rng.range(0, TAU), d = (R0 + 5) * Math.sqrt(rng()); x = oc.x + Math.cos(a) * d; z = oc.z + Math.sin(a) * d; }
        const y = sh.floorY(x, z) - 0.03, clump = noise.n2(x * 0.11, z * 0.11), sap = 0, h = rng.range(0.6, 1.25) * (0.6 + 0.65 * Math.max(0, clump + 0.25)) * 2.1, yaw = rng.range(0, Math.PI), sd = rng();
        for (let w = 0; w < 2; w++) for (let c = 0; c < 4; c++) {
          const o = (i * 2 + w) * 4 + c;
          pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z;
          aT[o * 4] = yaw + w * 1.571; aT[o * 4 + 1] = h; aT[o * 4 + 2] = sd; aT[o * 4 + 3] = sap;
          uv[o * 2] = c === 0 || c === 3 ? -1 : 1; uv[o * 2 + 1] = c < 2 ? 0 : 1;
        }
        for (let w = 0; w < 2; w++) { const q = (i * 2 + w) * 4; idx.set([q, q + 1, q + 2, q, q + 2, q + 3], (i * 2 + w) * 6); }
        if ((i & 1023) === 0) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 4)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = mk({
        side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aT; uniform vec4 uHall;
          varying vec3 vP; varying vec2 vUv; varying vec2 vK;
          ${sh.GL_FOG_V}
          void main(){
            float h = aT.y, sd = aT.z, t = uHall.z;
            vec3 r = vec3(cos(aT.x), 0., sin(aT.x));
            float gust = sin(dot(position.xz, vec2(.21, .17)) - t * 1.4) * .5 + .5;
            vec3 P = position + r * uv.x * h * mix(.55, .42, aT.w) + vec3(0., uv.y * h, 0.);
            P.xz += vec2(sin(t * 2.1 + sd * 40.), cos(t * 1.7 + sd * 23.)) * uv.y * uv.y * h * (.05 + .1 * gust);
            vP = P; vUv = uv; vK = vec2(aT.w, sd);
            vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP; varying vec2 vUv; varying vec2 vK;
          ${sh.GL_COMMON}
          ${sh.GL_FOG_F}
          void main(){
            float x = vUv.x, y = vUv.y; vec3 alb;
            {                                                  // a tussock: blades fanning from the root, straw-pale at the tips
              float far = smoothstep(10., 34., length(vP - uCam));                                  // far off the blades close up into one tuft: no speckle
              float bl = x / max(.25 + .75 * y, 1e-3) * 2.6 + vK.y * 7.;
              float w = abs(fract(bl) - .5), hgt = mix(.5 + .5 * hash11(floor(bl) + vK.y * 31.), .92, far * .7);
              if (w > mix(.34, .56, far) * (1. - y / hgt) || y > hgt || abs(x) > .25 + .75 * y) discard;
              alb = mix(vec3(.08, .12, .04), vec3(.4, .32, .14), smoothstep(.08, .8, y / hgt) * (.5 + .5 * fract(vK.y * 5.7)));
              alb *= (.8 + .4 * hash11(floor(bl) * 1.7 + vK.y * 3.)) * (.45 + .55 * smoothstep(0., .35, y));       // dark at the root
            }
            vec3 v = vP - uCam; vec3 vd = v / max(length(v), 1e-3);
            float thru = max(dot(vd, uSunDir), 0.);
            vec3 col = alb * (hallLight(vP, vec3(0., 1., 0.), .45 + .55 * y) * 1.15 + uSunCol * sunVis(vP) * (.22 + .42 * thru * thru)) * ${day ? '.6' : '1.'};      // straw must not bleach under a high sun
            col = mix(col, col * vec3(.5, .74, .86), (1. - courtSun(vP)) * (1. - smoothstep(uOc.z - 2., uOc.z + 3., length(vP.xz - uOc.xy))));      // in the rim's shadow the grass is cool
            col = hallHaze(col, vP);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      const tufts = new THREE.Mesh(g, m); tufts.frustumCulled = false; scene.add(tufts);
    }
    await ctx.yield();

    // ---- the chital party of the second glade: two stags and their does standing in a shaft; a doe and fawn at the hollow --
    {
      const rufous = [0.34, 0.19, 0.085], cream = [0.62, 0.57, 0.47], dark = [0.09, 0.06, 0.04], bone = [0.5, 0.42, 0.3];
      const deerGeo = (stag) => {
        const S = new sh.Store(), parts = [], c0 = () => setc(rufous);
        tube(S, parts, 0, [[-0.56, 0.8, 0], [-0.34, 0.82, 0], [0, 0.79, 0], [0.3, 0.82, 0], [0.47, 0.88, 0]], [0.09, 0.2, 0.215, 0.2, 0.11], 9, c0);
        tube(S, parts, 2, [[0.4, 0.86, 0], [0.52, 1.03, 0], [0.6, 1.2, 0], [0.64, 1.28, 0]], stag ? [0.14, 0.1, 0.08, 0.07] : [0.12, 0.08, 0.065, 0.06], 8, c0);
        tube(S, parts, 3, [[0.6, 1.29, 0], [0.68, 1.32, 0], [0.78, 1.29, 0], [0.88, 1.24, 0], [0.935, 1.215, 0]], [0.04, 0.078, 0.066, 0.042, 0.02], 8, c0);
        for (const s of [-1, 1]) {
          const a = S.v(0.64, 1.37, s * 0.05, 0, 0, s, 0, 0, ...setc(rufous, 0.9)), b = S.v(0.58, 1.5, s * 0.16, 0, 0, s, 0, 1, ...setc(cream, 0.8)), c = S.v(0.68, 1.45, s * 0.15, 0, 0, s, 1, 1, ...setc(rufous, 0.8));
          S.i.push(a, b, c); parts.push(3, 3, 3);
          tube(S, parts, 0, [[0.33, 0.74, s * 0.1], [0.34, 0.44, s * 0.1], [0.32, 0.2, s * 0.1], [0.34, 0, s * 0.1]], [0.075, 0.042, 0.028, 0.03], 5, c0);
          tube(S, parts, 0, [[-0.4, 0.76, s * 0.11], [-0.36, 0.46, s * 0.11], [-0.47, 0.24, s * 0.11], [-0.43, 0, s * 0.11]], [0.11, 0.052, 0.03, 0.03], 5, c0);
          if (stag) {
            tube(S, parts, 5, [[0.63, 1.37, s * 0.05], [0.55, 1.62, s * 0.17], [0.58, 1.88, s * 0.24], [0.7, 2.05, s * 0.17]], [0.026, 0.022, 0.016, 0.006], 4, () => setc(bone));
            tube(S, parts, 5, [[0.62, 1.42, s * 0.07], [0.74, 1.5, s * 0.1], [0.8, 1.58, s * 0.11]], [0.017, 0.013, 0.004], 4, () => setc(bone));
            tube(S, parts, 5, [[0.565, 1.75, s * 0.205], [0.47, 1.9, s * 0.22], [0.44, 2.0, s * 0.2]], [0.015, 0.012, 0.004], 4, () => setc(bone));
          }
        }
        tube(S, parts, 1, [[-0.55, 0.84, 0], [-0.64, 0.74, 0], [-0.66, 0.6, 0]], [0.03, 0.04, 0.012], 5, c0);
        // the coat, by where each point is: belly, throat and legs pale, a dark line down the back, dark muzzle and hooves
        for (let i = 0; i < S.count; i++) {
          if (parts[i] > 4.5) continue;
          const x = S.p[i * 3], y = S.p[i * 3 + 1], ny = S.n[i * 3 + 1]; let c = rufous, m = 0.86 + 0.22 * ny;
          if (parts[i] < 0.5 && y < 0.5) { c = y < 0.06 ? dark : cream; m = y < 0.06 ? 1 : 0.62; }
          else if (ny < -0.5 && parts[i] < 2.5) { c = cream; m = 0.8; }
          else if (parts[i] < 0.5 && ny > 0.9) m = 0.6;
          else if (parts[i] > 2.5 && x > 0.87) { c = dark; m = 1; }
          else if (parts[i] > 0.5 && parts[i] < 1.5 && ny < 0.2) { c = cream; m = 1; }
          S.c[i * 3] = c[0] * m; S.c[i * 3 + 1] = c[1] * m; S.c[i * 3 + 2] = c[2] * m;
        }
        return finish(S, parts);
      };
      const deerMat = creatureMat(/* glsl */`
        float gz = aI.y * (1. - .92 * smoothstep(.72, .95, sin(t * .23 + sd * 20.)));
        if (aPart > 1.5) {
          float w = aPart > 2.5 ? 1. : smoothstep(.86, 1.25, position.y);
          float a = -1.75 * gz * w;
          p.xy = rot2(p.xy - vec2(.42, .9), a) + vec2(.42, .9); n.xy = rot2(n.xy, a);
          float tn = (1. - gz) * mix(.6 * sin(t * .37 + sd * 17.) * smoothstep(-.3, .6, sin(t * .19 + sd * 5.)), aI.z, aI.w) * w;
          p.xz = rot2(p.xz - vec2(.45, 0.), tn) + vec2(.45, 0.); n.xz = rot2(n.xz, tn);
        } else if (aPart > .5) {
          p.z += sin(t * 11. + sd * 30.) * .07 * smoothstep(.55, .9, sin(t * .8 + sd * 4.)) * (.84 - position.y) * 4.;
        }`, {}, /* glsl */`
          if (vPart < .5 && vO.y > .52) {
            vec2 sg = vec2(vO.x * 10. + floor(vO.y * 12.) * .37, vO.y * 12.);
            vec2 sc = fract(sg) - .5; float sh1 = hash11(dot(floor(sg), vec2(7.1, 13.7)));
            float spot = (1. - smoothstep(.13, .23, length(sc + (sh1 - .5) * .28))) * step(.22, sh1);
            alb = mix(alb, vec3(.66, .6, .5), spot * smoothstep(.25, .55, vO.y - .52 + .3));
          }`);
      await ctx.yield();
      const stagGeo = deerGeo(true), doeGeo = deerGeo(false), dr = xw('chital2');
      // dealt in the world from a stream of the party's own: PARTY_N animals, each at a place drawn within PARTY_R metres of
      // the party's middle (its station, under its own gap in the roof) and no nearer than PARTY_GAP to another (a deer's
      // own length); each of a size drawn from PARTY_SIZE; two of them, by draw, the antlered stags (the design, fauna:
      // 'sixteen with two antlered stags'), whose heads are up (the design, journey: 'stags' heads up'); of the does one
      // in two, by draw, grazes (three of the six, as the party was first set out). Each stands facing its own way; those
      // not grazing lift their heads and follow us with them as we come by
      const st = A.stations.chital2, pd = xw('chital2party'), PARTY_N = 8, PARTY_R = 4, PARTY_GAP = 1.6, PARTY_SIZE = [0.87, 1.0];
      const spot = (x, z, scale, graze, stag) => ({ x, z, y: sh.floorY(x, z) - 0.01, yaw: dr.range(0, TAU), s: scale, g: graze, stag });
      const party = [];
      {
        const stagA = pd.int(0, PARTY_N - 1), stagB = (stagA + 1 + pd.int(0, PARTY_N - 2)) % PARTY_N;
        for (let i = 0; i < PARTY_N; i++) {
          let x = st.x, z = st.z;
          for (let tries = 0; tries < 200; tries++) {
            const a = pd.range(0, TAU), r = PARTY_R * Math.sqrt(pd());
            x = st.x + Math.cos(a) * r; z = st.z + Math.sin(a) * r;
            if (party.every((q) => Math.hypot(q.x - x, q.z - z) >= PARTY_GAP)) break;
          }
          const stag = i === stagA || i === stagB ? 1 : 0;
          party.push(spot(x, z, pd.range(PARTY_SIZE[0], PARTY_SIZE[1]), stag ? 0 : pd.chance(0.5) ? 1 : 0, stag));
        }
      }
      {
        // a doe with her fawn at the mouth of the mother's hollow: on the mouth's own axis, standing across it, the fawn at her flank
        const G = A.giants[1], mA = G.mouth, sgn = dr.chance(0.5) ? 1 : -1, ux = Math.cos(mA), uz = Math.sin(mA), fx = -uz * sgn, fz = ux * sgn;
        const hx = G.x + ux * G.r * 1.85, hz = G.z + uz * G.r * 1.85, yaw = Math.atan2(-fz, fx) + dr.range(-0.25, 0.25);
        party.push({ x: hx, z: hz, y: sh.floorY(hx, hz) - 0.01, yaw, s: 0.92, g: 0, stag: 0 });
        const kx = hx - fx * 0.9 + ux * 1.0, kz = hz - fz * 0.9 + uz * 1.0;
        party.push({ x: kx, z: kz, y: sh.floorY(kx, kz) - 0.01, yaw: yaw + dr.range(0.3, 0.7), s: 0.54, g: 1, stag: 0 });
      }
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      for (const [geo, list] of [[stagGeo, party.filter((q) => q.stag)], [doeGeo, party.filter((q) => !q.stag)]]) {
        const mesh = new THREE.InstancedMesh(geo, deerMat, list.length), aI = new Float32Array(list.length * 4);
        const dI = new THREE.InstancedBufferAttribute(aI, 4);
        list.forEach((q, i) => { Q.setFromAxisAngle(Y, q.yaw); mesh.setMatrixAt(i, M.compose(Pv.set(q.x, q.y, q.z), Q, Sv.set(q.s, q.s, q.s))); aI.set([dr(), q.g, 0, 0], i * 4); watch(dI, i, q.x, q.z, q.yaw, 1.3); });
        geo.setAttribute('aI', dI);
        mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; scene.add(mesh); placed([mesh], list);
      }
    }
    await ctx.yield();

    // ---- the roost nave: flying foxes hung thick along the bat bough and along every low bough that crosses our way through
    //      the grove (the hero's roost boughs), in knots under the limbs between them; and six that come in to land, one to
    //      each bough, each when we are 30 m short of where it will hang
    const landers = [];
    let landMesh, landAI;
    // rare: the langurs' alarm. Four of the troop bound barking along the bough that crosses our way just short of the great
    // root where the troop sits, and the colony lets go ahead of us, the bats of that bough first: the start of the wave
    // that runs along the ceiling (the hero's hung colony and the wave bats below follow it)
    const alarm = { mesh: null, base: [], bough: null, dA: 0, uR: 0 };
    const roostSets = [];
    {
      const B = A.feats.batBough, br = xw('batbough'), NB = 110, NR = 110, NH = NB + NR, g2 = batLod.clone(), g3 = batGeo.clone();
      const Bm = B.at(0.5, new THREE.Vector3()), dB = routeAt(Bm.x, Bm.z, 0.5 * path.length, 0.78 * path.length);
      const rs0 = A.feats.rootSeats[2], dRoot = routeAt(rs0.x, rs0.z, 0.5 * path.length, 0.78 * path.length);
      alarm.uR = dRoot / path.length;
      const hangMat = mk({
        vertexColors: true, side: THREE.DoubleSide, uniforms: batUni,
        vertexShader: /* glsl */`
          attribute vec4 aW, aI;
          uniform vec4 uHall;
          varying vec3 vP, vN, vC; varying vec4 vW;
          ${sh.GL_FOG_V}
          void main(){
            // aI: seed, how far the wings are out (0 hung and wrapped, 1 flying), whether it is one that fans itself, size
            float t = uHall.z, sd = aI.x;
            float fan = aI.z * smoothstep(.5, .9, sin(t * .5 + sd * 23.));
            float o = clamp(aI.y + .6 * fan, 0., 1.);
            float wt = t * (5. + 10. * aI.y) + sd * 40.;
            vec3 p = position, n = normal;
            if (aW.w > .5) {
              float s = aW.x, c = aW.z;
              float a = mix(-.9, .1, aI.y) + (.25 + .5 * aI.y) * sin(wt - s * 1.2);
              vec3 po = vec3(aW.y * (.04 + s * .61 * cos(a)), .012 + s * .61 * sin(a), position.z);
              vec3 pf = vec3(aW.y * (.05 + .045 * c), .025 - .075 * c, mix(-.21, .1, s));
              p = mix(pf, po, o);
              n = normalize(mix(vec3(aW.y * .8, .6, 0.), vec3(-aW.y * sin(a), cos(a), 0.), o) + vec3(0., 1e-4, 0.));
            }
            p *= aI.w;
            p.x += (1. - aI.y) * .1 * sin(t * 1.3 + sd * 50.) * (.15 * aI.w - p.z);
            vec4 wp = instanceMatrix * vec4(p, 1.);
            vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * n + vec3(0., 1e-4, 0.)); vW = aW;
            vC = aW.w > .5 ? vec3(o, 0., 0.) : color * 1.2;          // (a wing carries how far it is spread, not a colour)
            vec4 mvPosition = modelViewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        // under the roof a wing is not black: the hall's lit haze shows through the skin and rims it, and where a shaft
        // stands behind it the whole web is amber
        fragmentShader: batFrag.replace('col = membrane(vP, N, vd, vW.xz, sv, 0.);', `col = membrane(vP, N, vd, vW.xz, sv, 0.);
              float webK = smoothstep(-.12, 0., vW.z - wingCut(vW.x)), skinK = smoothstep(.02, .06, wingBone(vW.xz)), openK = clamp(vC.r, 0., 1.);
              float svB = max(sunVis(vP + vd * 4.), sunVis(vP + vd * 10.));          // a shaft standing behind the wing, seen through it
              col += skinK * (vec3(.62, .4, .24) * (uSkyAmb * .26 + uHazeCol * .55) * (.75 + .5 * webK) * (.6 + .9 * openK)
                + uAmberC * uSunCol * (sv * (.2 + .25 * max(dot(vd, uSunDir), 0.)) + svB * .17 * openK));`),
      });
      const M = new THREE.Matrix4(), X = new THREE.Vector3(), Yb = new THREE.Vector3(), Z = new THREE.Vector3(0, 1, 0), Pv = new THREE.Vector3(), tv = new THREE.Vector3();
      const ax = B.b.clone().sub(B.a).setY(0).normalize(), acr = new THREE.Vector3(-ax.z, 0, ax.x);
      const hung = new THREE.InstancedMesh(g2, hangMat, NH), aI = new Float32Array(NH * 4);
      // a bat hung under a bough: bq is the bough, t the place along it, off how far to one side of its middle line
      const hangOn = (bq, t, off, size, yaw, out) => {
        bq.at(t, tv); Yb.set(Math.cos(yaw), 0, Math.sin(yaw)); X.crossVectors(Yb, Z);
        Pv.set(tv.x + acr.x * off, tv.y - bq.r * 0.9 - 0.15 * size, tv.z + acr.z * off);
        return out.makeBasis(X, Yb, Z).setPosition(Pv);
      };
      const hangAt = (t, off, size, yaw, out) => hangOn(B, t, off, size, yaw, out);
      for (let i = 0; i < NB; i++) {
        const t = i < 80 ? br.range(0.2, 0.8) : br.range(0.07, 0.93), size = br.range(1.05, 1.3);
        hung.setMatrixAt(i, hangAt(t, br.range(-0.16, 0.16), size, br.range(0, TAU), M));
        aI.set([br(), 0, br.chance(0.3) ? 1 : 0, size], i * 4);
      }
      {       // the knots along the nave: under real limbs 3 to 11 m off our line and 3 to 9 m over it
        const lp = A.limbUnder, nl = lp.length / 4, nr = xw('naveroost'); let k = NB;
        const hangKnot = (x, y, z) => {
          const yaw0 = nr.range(0, TAU), dx = Math.cos(yaw0), dz = Math.sin(yaw0);
          for (let c = 0, cl = 3 + nr.int(0, 3); c < cl && k < NH; c++, k++) {
            const size = nr.range(1.05, 1.3), o = (c - (cl - 1) / 2) * 0.34, yaw = nr.range(0, TAU);
            Yb.set(Math.cos(yaw), 0, Math.sin(yaw)); X.crossVectors(Yb, Z);
            hung.setMatrixAt(k, M.makeBasis(X, Yb, Z).setPosition(x + dx * o, y - 0.15 * size, z + dz * o));
            aI.set([nr(), 0, nr.chance(0.3) ? 1 : 0, size], k * 4);
          }
        };
        for (let tries = 0; tries < 2600 && k < NH - 60 && nl; tries++) {
          const j = nr.int(0, nl - 1) * 4, x = lp[j], y = lp[j + 1], z = lp[j + 2];
          if (Math.abs(x - Bm.x) + Math.abs(z - Bm.z) > 260) continue;
          const d = routeAt(x, z, dRoot - 26, dB + 8), off = rtD.d, over = y - RT.y[rtD.i];
          if (d <= dRoot - 26 || d >= dB + 8 || off < 3 || off > 11 || over < 3 || over > 9) continue;
          hangKnot(x, y, z);
        }
        // and where no limb comes near, from the twigs of the leaf roof itself, wherever it is low over our way
        // (thickest over the troop's root, where the alarm will start)
        for (let tries = 0; tries < 4000 && k < NH; tries++) {
          const i = clamp(Math.round((nr.chance(0.55) ? nr.range(dRoot - 22, dRoot + 34) : nr.range(dRoot - 22, dB + 6)) / 2), 0, RT.n - 2), tx = RT.x[i + 1] - RT.x[i], tz = RT.z[i + 1] - RT.z[i], tl = Math.hypot(tx, tz) || 1;
          const lat = nr.sign() * nr.range(3, 9.5), x = RT.x[i] - (tz / tl) * lat, z = RT.z[i] + (tx / tl) * lat, y = sh.ceilY(x, z) - 0.3, over = y - RT.y[i];
          if (over < 3.5 || over > (rare ? 15.5 : 11.5)) continue;
          hangKnot(x, y, z);
        }
        hung.count = k;
      }
      g2.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
      hung.instanceMatrix.needsUpdate = true; hung.computeBoundingSphere(); hung.boundingSphere.radius += 2;
      hung.frustumCulled = !rare; scene.add(hung);
      roostSets.push({ mesh: hung, aI, n: hung.count, gone: 1e9, at: placed([hung], instPts(hung, hung.count)) });
      await ctx.yield();
      // the rows under the roost boughs: thick about the place where each bough's lander will hang, thinner out to its
      // poles; bigger animals than the knots (the old males keep the low boughs), one in three fanning itself
      const roost = A.feats.roost, rw = xw('roostrows'), own = roost.filter((r) => r.own);
      for (let q = 0; q < own.length; q += 2) {
        const pair = own.slice(q, q + 2), cnt = pair.map(() => 30 + rw.int(0, 8)), n = cnt.reduce((a, b) => a + b, 0);
        const gq = batLod.clone(), mesh = new THREE.InstancedMesh(gq, hangMat, n), aq = new Float32Array(n * 4); let k = 0;
        pair.forEach((r, j) => {
          acr.set(-(r.b.z - r.a.z), 0, r.b.x - r.a.x).normalize();
          for (let c = 0; c < cnt[j]; c++, k++) {
            let t = c < cnt[j] * 0.6 ? r.hangT + rw.range(-0.17, 0.17) : rw.range(0.1, 0.9); const size = rw.range(1.15, 1.42);
            if (Math.abs(t - r.hangT) < 0.014) t += 0.03;
            mesh.setMatrixAt(k, hangOn(r, clamp(t, 0.08, 0.92), rw.range(-0.17, 0.17), size, rw.range(0, TAU), M));
            aq.set([rw(), 0, rw.chance(0.5) ? 1 : 0, size], k * 4);
          }
        });
        gq.setAttribute('aI', new THREE.InstancedBufferAttribute(aq, 4));
        mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 2;
        mesh.frustumCulled = !rare; scene.add(mesh);
        roostSets.push({ mesh, aI: aq, n, gone: 1e9, at: placed([mesh], instPts(mesh, n)) });
      }
      acr.set(-ax.z, 0, ax.x);
      await ctx.yield();
      if (rare) {
        const ar = xw('alarm'), Pb = new THREE.Vector3(), Qb = new THREE.Quaternion(), Sb = new THREE.Vector3();
        const Ral = roost.find((r) => r.alarm) || own[0] || { a: B.a, b: B.b, r: B.r, at: B.at, d: dB };
        alarm.bough = Ral; alarm.dA = Ral.d;
        // each bat lets go when the alarm reaches it. Those of the troop's own bough go as the langurs come along it (the
        // brief's beat: 'bounds along the boughs at u 0.6 and that sets off the wave'); from there the wave runs up the nave
        // ahead of us, a little faster than we fly, and back down it behind us
        const ab = new THREE.Vector3().subVectors(Ral.b, Ral.a), abl = ab.lengthSq() || 1;
        for (const set of roostSets) for (let i = 0; i < set.n; i++) {
          set.mesh.getMatrixAt(i, M); M.decompose(Pb, Qb, Sb);
          const d = routeAt(Pb.x, Pb.z, Math.min(dRoot, alarm.dA) - 30, dB + 40), lat = rtD.d, tOn = clamp(Pv.subVectors(Pb, Ral.a).dot(ab) / abl, 0, 1);
          const onIt = Math.abs(d - alarm.dA) < 9 && Pv.set(lerp(Ral.a.x, Ral.b.x, tOn) - Pb.x, 0, lerp(Ral.a.z, Ral.b.z, tOn) - Pb.z).length() < 1.2;
          const go = onIt ? (0.572 + 0.036 * clamp((tOn + 0.02) / 0.86, 0, 1.2)) * path.length + ar.range(0, 3)
            : d >= alarm.dA ? 0.596 * path.length + (d - alarm.dA) * 0.84 + ar.range(0, 9) : 0.594 * path.length + (alarm.dA - d) * 0.3 + ar.range(0, 6);
          alarm.base.push({ set, i, d, p: Pb.clone(), q: Qb.clone(), size: set.aI[i * 4 + 3], fan: set.aI[i * 4 + 2], go,
            side: (ar.chance(0.5) ? 1 : -1) * ar.range(3.4, 7.5), clear: ar.range(2.8, 5.4), sp: ar.range(0.42, 0.8), ph: ar.range(0, TAU), lat0: lat });
        }
        for (const set of roostSets) { set.gone = 0; for (const b of alarm.base) if (b.set === set) set.gone = Math.max(set.gone, b.go + Math.min(72, Math.max(0, b.d - b.go + 12) / (1 - b.sp))); }
        const g4 = leapMesh.geometry.clone();
        g4.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0.27, 1, 0, 0, 0.61, 1, 0, 0, 0.93, 1, 0, 0, 0.42, 1, 0, 0]), 4));
        alarm.mesh = new THREE.InstancedMesh(g4, langurMat, 4); alarm.mesh.frustumCulled = false; scene.add(alarm.mesh); placed([alarm.mesh], [Ral.a, Ral.b]);
      }
      // the six that come in: one to each roost bough, to the place on it that hangs 4 m to one side of our way. Each is
      // timed by how far short of its own hang point we are: it comes in from beyond the bough and to the side, low, when
      // we are 30 m short; brakes, swings its feet up and catches hold as we come to 8 m short; hangs there with its
      // wings still out, beating to steady itself, and folds them as we pass under
      landAI = new Float32Array(roost.length * 4);
      const lr6 = xw('landers'), tan = new THREE.Vector3();
      roost.forEach((r, k) => {
        const size = 1.3, L = { d: routeAt(r.hang.x, r.hang.z, 0.5 * path.length, 0.8 * path.length), to: new THREE.Vector3(), from: new THREE.Vector3(), qHang: new THREE.Quaternion(), p: new THREE.Vector3(), side: r.side };
        path.tangentAtDist(L.d, tan); tan.y = 0; tan.normalize();
        acr.set(-(r.b.z - r.a.z), 0, r.b.x - r.a.x).normalize();
        hangOn(r, r.hangT, 0, size, Math.atan2(tan.z, tan.x) + Math.PI + 0.4 * r.side, M);
        L.to.setFromMatrixPosition(M); L.qHang.setFromRotationMatrix(M);
        L.from.copy(L.to).addScaledVector(tan, lr6.range(15, 19)).addScaledVector(acr.set(-tan.z, 0, tan.x), r.side * lr6.range(2.2, 3.4)); L.from.y -= 1.2;
        L.p.copy(L.to); L.p.y -= 0.25;
        landers.push(L); landAI.set([lr6(), 1, 0, size], k * 4);
      });
      g3.setAttribute('aI', new THREE.InstancedBufferAttribute(landAI, 4));
      landMesh = new THREE.InstancedMesh(g3, hangMat, Math.max(1, landers.length)); landMesh.count = landers.length; landMesh.frustumCulled = false; scene.add(landMesh);
      if (landers.length) placed([landMesh], landers.flatMap((Ld) => [Ld.from, Ld.to]));
    }
    const ldP = new THREE.Vector3(), ldX = new THREE.Vector3(), ldY = new THREE.Vector3(), ldZ = new THREE.Vector3(), ldM = new THREE.Matrix4(), ldQ = new THREE.Quaternion(), ldS = new THREE.Vector3();
    function updateLanders(dist) {
      for (let k = 0; k < landers.length; k++) {
        const L = landers[k], s = L.d - dist, q = clamp((30 - s) / 22, 0, 1), e = q * (2 - q), up = smoothstep(0.62, 1, q);
        ldP.copy(L.from).lerp(L.to, e); ldP.y -= 1.5 * Math.sin(Math.PI * q) * (1 - 0.5 * q);
        ldZ.copy(L.from).sub(L.to).setY(0).normalize().multiplyScalar(1 - 0.75 * up); ldZ.y = -0.1 - 0.85 * up; ldZ.normalize();
        ldX.set(0, 1, 0).cross(ldZ).normalize(); ldY.crossVectors(ldZ, ldX);
        // (it comes in banked, its underside turned to our way, and levels as it brakes)
        const roll = L.side * 0.8 * (1 - up) * smoothstep(0, 0.2, q), cr = Math.cos(roll), sr = Math.sin(roll);
        ldS.copy(ldX); ldX.multiplyScalar(cr).addScaledVector(ldY, sr); ldY.multiplyScalar(cr).addScaledVector(ldS, -sr);
        ldM.makeBasis(ldX, ldY, ldZ); ldQ.setFromRotationMatrix(ldM).slerp(L.qHang, smoothstep(0.88, 1, q));
        const sc = q <= 0 || rare ? 0.001 : 1;            // (on the day of the alarm nothing comes in to land here)
        landMesh.setMatrixAt(k, ldM.compose(ldP, ldQ, ldS.set(sc, sc, sc)));
        landAI[k * 4 + 1] = smoothstep(-4, 3, s);
      }
      landMesh.instanceMatrix.needsUpdate = true; landMesh.geometry.attributes.aI.needsUpdate = true;
    }
    const alQ = new THREE.Quaternion(), alP = new THREE.Vector3(), alB = new THREE.Vector3(), alT = new THREE.Vector3();
    // where the k-th langur of the alarm is on its bough at u: in file from the near pole's head to the far pole's, the
    // troop across our way at the brief's beat (u 0.6); returns its place along the bough
    function alarmAt(k, u, out) {
      const s0 = -0.12 + 0.86 * (u - 0.568) / 0.036 - 0.06 * k, len = alarm.bough.a.distanceTo(alarm.bough.b);
      const Rb = alarm.bough, s = clamp(s0 < 0.62 ? s0 : 0.62 + (s0 - 0.62) * 2.1, 0, 1);         // (past the middle of the bough they bolt for the far pole)
      const h = s * len / 2.3, f = h - Math.floor(h);
      Rb.at(s, out); out.y += Rb.r + 0.44 + 2.6 * f * (1 - f);
      return s;
    }
    function updateAlarm(u, time) {
      const L = path.length, dist = u * L;
      for (let k = 0; k < 4; k++) {
        const s = alarmAt(k, u, lpA); alarmAt(k, u + 0.0009, lpB);
        lpX.subVectors(lpB, lpA); if (lpX.lengthSq() < 1e-8) lpX.subVectors(alarm.bough.b, alarm.bough.a); lpX.normalize();
        lpZ.set(-lpX.z, 0, lpX.x).normalize(); lpY.crossVectors(lpZ, lpX);
        const sc = s < 0.035 || s > 0.965 ? 0.001 : 1.3;          // (out of the near pole's head, along the bough, in behind the far one's)
        lpM.makeBasis(lpX, lpY, lpZ).scale(lpB.set(sc, sc, sc)).setPosition(lpA); alarm.mesh.setMatrixAt(k, lpM);
      }
      alarm.mesh.instanceMatrix.needsUpdate = true;
      // the colony: each bat lets go as the alarm reaches it, drops to a few metres over our line, opens its wings and
      // flies up the nave slower than we do, weaving, so that we come up through the swirl; it is gone once we are past it
      for (let j = 0; j < alarm.base.length; j++) {
        const b = alarm.base[j], A2 = b.set.aI, i = b.i, tau = dist - b.go;
        if (tau <= 0) { ldM.compose(b.p, b.q, ldS.set(1, 1, 1)); A2[i * 4 + 1] = 0; A2[i * 4 + 2] = b.fan; A2[i * 4 + 3] = b.size; }
        else {
          const dn = Math.min(b.d + tau * b.sp, L - 4), fi = dn / 2, i0 = Math.min(RT.n - 2, Math.floor(fi)), f = fi - i0;
          const rx = lerp(RT.x[i0], RT.x[i0 + 1], f), ry = lerp(RT.y[i0], RT.y[i0 + 1], f), rz = lerp(RT.z[i0], RT.z[i0 + 1], f);
          alT.set(RT.x[i0 + 1] - RT.x[i0], 0, RT.z[i0 + 1] - RT.z[i0]).normalize(); alB.set(-alT.z, 0, alT.x);
          const open = smoothstep(0, 3.5, tau), sw = Math.sin(tau * 0.19 + b.ph), k = smoothstep(0, 16, tau), kd = smoothstep(0, 5 + 0.5 * b.clear, tau);
          const lat = b.side + 1.5 * sw;
          alP.set(lerp(b.p.x, rx + alB.x * lat, k), lerp(b.p.y, ry + b.clear + 0.7 * Math.cos(tau * 0.13 + b.ph), kd) + 0.25 * Math.sin(time * 2.1 + b.ph) + 5 * smoothstep(50, 72, tau), lerp(b.p.z, rz + alB.z * lat, k));
          // (it stoops nose-down and then flies on banking from side to side, so we see the spread of its wings and not their edge)
          const roll = 0.8 * Math.cos(tau * 0.19 + b.ph), pit = -0.6 * smoothstep(0, 3, tau) * (1 - smoothstep(7, 15, tau));
          ldX.copy(alB).multiplyScalar(Math.cos(roll)); ldX.y = Math.sin(roll);
          ldZ.copy(alT).multiplyScalar(-Math.cos(pit)); ldZ.y = -Math.sin(pit);
          ldY.crossVectors(ldZ, ldX).normalize(); ldX.crossVectors(ldY, ldZ).normalize();
          ldM.makeBasis(ldX, ldY, ldZ); alQ.setFromRotationMatrix(ldM); ldQ.copy(b.q).slerp(alQ, smoothstep(0, 2.6, tau));
          const sc = Math.max(0.001, (1 - smoothstep(6, 12, dist - dn)) * (1 - smoothstep(58, 72, tau)));
          ldM.compose(alP, ldQ, ldS.set(sc, sc, sc)); A2[i * 4 + 1] = open; A2[i * 4 + 2] = 0; A2[i * 4 + 3] = lerp(b.size, 1.3, open);
        }
        b.set.mesh.setMatrixAt(i, ldM);
      }
      for (let j = 0; j < roostSets.length; j++) {
        const set = roostSets[j]; set.mesh.instanceMatrix.needsUpdate = true; set.mesh.geometry.attributes.aI.needsUpdate = true;
      }
    }
    await ctx.yield();

    // ---- kit wildlife: chital in their glade, parakeets (or mynas) in volleys, hornbills in the fig glut ----------
    const DUR = 52;
    const sunN = A.sunColor.clone(); sunN.multiplyScalar(1 / Math.max(sunN.r, sunN.g, sunN.b, 1e-3));
    const hallLight = {
      sunDir: sunDir.clone(), sunColor: sunN, sunIntensity: night ? 1.5 : day ? 2.0 : 1.7,
      sky: U.uShade.value.clone().lerp(U.uSkyAmb.value, 0.45), skyIntensity: night ? 2.2 : 1.35,
      ground: U.uBounce.value.clone().multiplyScalar(night ? 3 : 1.6), groundIntensity: 1,
    };
    const fauna = F.makeFauna(scene, { light: hallLight });
    {
      const st = A.stations.chital;
      fauna.add(F.makeHerd({
        // the kit's own spotted deer: passing a coat colour thins its spots to almost nothing, so the preset coat is kept
        rng: xw('chital'), species: 'deer', preset: { ...F.HERD_PRESETS.deer, h: 0.95 }, pattern: 'spots', varieties: 0.2,
        count: Math.round(clamp(13 * density, 10, 16)), center: [st.x, 0, st.z], radius: 8, roam: 0.5, path, clear: 6.2, heightAt: sh.floorY, shadowOpacity: 0.5,
      }), { always: true });
      await ctx.yield();
      const pk = mynas
        ? { body: '#3a2a1d', belly: '#4a372a', wingC: '#2a1e16', tip: '#e8e4da', head: '#121010', beak: '#f2c21e', tailC: '#1a1410' }
        : { body: '#4fae3a', belly: '#86cc4c', wingC: '#2f8f3a', tip: '#1d6a4a', head: '#5cc050', beak: '#d2322a', tailC: '#3aa2a6' };
      // THE BIRDS KEEP CLEAR OF OUR LINE. Each of the three flocks below is handed a wander of its own (of [a, b, c, rate] the kit makes a box of
      // 1.5 a sideways, b up and down and c along about each bird's place), maxSigma 3 (the kit holds every bell-curve draw of a dealt place
      // within three sigma either side, at the bound, drawing no more and no fewer numbers) and keepClear with each: after its deal and
      // with no draw the kit leaves the course where it is laid and moves every member that (at its dealt offset, with its wander at its
      // furthest and its body) would come within dist of the path between the shares from and to, the path taken every step metres, by
      // what it alone lacks, away from the path and never downward (up); every other member stays as dealt. Each course is laid over the
      // path by about that much, so that few members lack anything. makeFlockAsync makes the same flock as makeFlock and hands the
      // clearing back to the page in slices.
      // (the volley's course is laid by the kit level, about a point 5.2 m over the path's point 36 m past u 0.8, and passes over the
      // path twice: where we pull out of the dive and where we cross the clearing; from and to hold both)
      fauna.add(await F.makeFlockAsync({
        rng: xw('parakeets'), species: 'parrots', count: season === 'figs' ? 110 : 60, size: mynas ? 1.3 : 1.5, spread: [10, 1.28, 24], wander: [0.3, 0.25, 0.3, 0.6], maxSigma: 3, ...pk,
        keepClear: { path, dist: 2.1, up: true, each: true, from: 0.24, to: 0.89, step: 2 },
        cross: { path, u: 0.8, lead: 36, angle: 75, side: -1, height: 5.2, span: 170, duration: DUR },          // the brief's volley: across our way from right to left
      }, ctx.yield), { always: true });
      await ctx.yield();
      // a second volley keeps its own beat in the world: back and forth over the rain pool, across its short axis, round on time
      if (!mynas) {
        const pa = A.pool.a, pb = A.pool.b, mx = (pa.x + pb.x) / 2, mz = (pa.z + pb.z) / 2, al = Math.hypot(pb.x - pa.x, pb.z - pa.z) || 1, nx = -(pb.z - pa.z) / al, nz = (pb.x - pa.x) / al, line = [];
        for (let k = -3; k <= 3; k++) line.push([mx + nx * k * 18, A.pool.y + 4.4 + 0.5 * Math.cos(k), mz + nz * k * 18]);
        // (its course crosses our path over the pool, 3.2 m over the heights of `line`)
        fauna.add(await F.makeFlockAsync({ rng: xw('parakeets2'), species: 'parrots', count: 24, size: 1.5, spread: [6, 0.96, 16], wander: [0.3, 0.25, 0.3, 0.6], maxSigma: 3, ...pk,
          keepClear: { path, dist: 2.1, up: true, each: true, from: 0.32, to: 0.4, step: 2 }, route: line.map(([x, y, z]) => [x, y + 3.2, z]), closed: false, speed: 13 }, ctx.yield), { always: true });
      }
      await ctx.yield();
      // in the fig glut two hornbills ply between the two great trunks, beside them, round on time
      if (season === 'figs') {
        const g0 = A.giants[0], g1 = A.giants[1], gl = Math.hypot(g1.x - g0.x, g1.z - g0.z) || 1, dx = (g1.x - g0.x) / gl, dz = (g1.z - g0.z) / gl, line = [];
        for (let k = 0; k <= 5; k++) { const t = -45 + (gl + 90) * k / 5; line.push([g0.x + dx * t - dz * (g0.r + 7), 8.5 + 0.8 * Math.sin(k * 1.3), g0.z + dz * t + dx * (g0.r + 7)]); }
        // (their course runs with our path up the grove and rises over it: the first four knots of `line` are lifted by 1.5, 2.5, 6 and 2.5 m)
        fauna.add(await F.makeFlockAsync({
          rng: xw('hornbills'), species: 'crows', count: 2, size: 2.7, spread: [3, 1, 5], wander: [0.4, 0.3, 0.4, 0.4], maxSigma: 3, body: '#8b8880', belly: '#b9b4a6', wingC: '#6e6b64', tip: '#2a2826', head: '#8b8880', beak: '#d9c06a', tailC: '#8b8880',
          keepClear: { path, dist: 2.1, up: true, each: true, from: 0.57, to: 0.72, step: 2 },
          route: line.map(([x, y, z], k) => [x, y + [1.5, 2.5, 6, 2.5, 0, 0][k], z]), closed: false, speed: 11,
        }, ctx.yield), { always: true });
      }
    }
    await ctx.yield();

    // ---- rare: the hung colony lets go in a wave that runs along the ceiling ahead of us ---------------------------
    let waveMat = null;
    if (rare) {
      const rng = xw('wave');
      const nW = Math.round(3400 * (0.6 + 0.4 * detail)), pos = new Float32Array(nW * 24), aQ = new Float32Array(nW * 32), uv = new Float32Array(nW * 16), idx = new Uint32Array(nW * 12);
      const pv = new THREE.Vector3(), tg = new THREE.Vector3(), hangs = [];
      for (let i = 0; i < nW; i++) {
        const uu = rng.range(0.55, 0.9), lat = rng.gauss() * 17;
        path.pointAt(uu, pv); path.tangentAt(uu, tg);
        let x = pv.x - tg.z * lat, z = pv.z + tg.x * lat;
        { const od = sh.ocDist(x, z), oc = A.courtyard.center; if (od < A.courtyard.radius + 3) { const kk = (A.courtyard.radius + 3) / Math.max(od, 1); x = oc.x + (x - oc.x) * kk; z = oc.z + (z - oc.z) * kk; } }
        const top = sh.ceilY(x, z) - rng.range(0.4, 1.8);
        if ((i & 15) === 0) hangs.push({ x, z });
        const room = top - (pv.y + (Math.abs(lat) < 7 ? 3.6 : 0.5)), drop = Math.max(0.6, Math.min(rng.range(1.2, 7.5), room - 1.3));
        const sd = rng(), rad = rng.range(2, 7.5);
        for (let w = 0; w < 2; w++) for (let c = 0; c < 4; c++) {
          const o = (i * 2 + w) * 4 + c;
          pos[o * 3] = x; pos[o * 3 + 1] = top; pos[o * 3 + 2] = z;
          aQ[o * 4] = sd; aQ[o * 4 + 1] = w ? 1 : -1; aQ[o * 4 + 2] = rad; aQ[o * 4 + 3] = drop;
          uv[o * 2] = c === 0 || c === 3 ? -1 : 1; uv[o * 2 + 1] = c < 2 ? -1 : 1;
        }
        for (let w = 0; w < 2; w++) { const q = (i * 2 + w) * 4; idx.set([q, q + 1, q + 2, q, q + 2, q + 3], (i * 2 + w) * 6); }
        if ((i & 511) === 0) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.BufferAttribute(aQ, 4)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      waveMat = mk({
        side: THREE.DoubleSide, uniforms: { ...batUni, uWaveDir: { value: new THREE.Vector3(0, 0, 1) } },
        vertexShader: /* glsl */`
          attribute vec4 aQ;
          uniform vec4 uHall, uWave; uniform vec3 uCam, uWaveDir;
          varying vec3 vP, vW;
          ${sh.GL_FOG_V}
          void main(){
            float sd = aQ.x, t = uHall.z; vec3 H = position;
            float a = 1. - smoothstep(uWave.w * .55, uWave.w, length(H - uWave.xyz) + (sd - .5) * uWave.w * .3);
            float dir = sd > .5 ? 1. : -1.;
            float ang = dir * t * (1.0 + .9 * sd) + sd * 60.;
            float r = aQ.z * a;
            vec3 F = H + vec3(cos(ang) * r, -aQ.w * a - .9 * a * sin(ang * .7 + sd * 9.), sin(ang) * r) + uWaveDir * a * (5. + 4. * sin(t * .5 + sd * 20.));
            vec3 A = dir * vec3(-sin(ang), 0., cos(ang));
            vec3 Rl = vec3(-A.z, 0., A.x), D = vec3(0., 1., 0.);
            float fl = sin(t * (15. + 4. * sd) + sd * 100.);
            float phi = .15 + .8 * fl, s01 = uv.x * .5 + .5, ph2 = phi * (1. + .5 * s01);
            vec3 arm = Rl * aQ.y * cos(ph2) + D * sin(ph2);
            vec3 P = F + A * (.3 - uv.y * .22 - .1 * s01) + arm * s01 * .66;
            float dc = length(uCam - F);
            float vis = smoothstep(.02, .3, a) * smoothstep(3., 7., dc);
            P = F + (P - F) * vis * clamp(dc / 70., 1., 2.2);
            vP = P; vW = vec3(s01, uv.y, 0.);
            vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP, vW; uniform vec3 uAmberC;
          ${sh.GL_COMMON}
          ${sh.GL_FOG_F}
          void main(){
            float sp = vW.x, c = vW.y;
            float lead = -.9 + .55 * abs(sp - .42), trail = .8 - .5 * sp - .24 * abs(sin(sp * 7.854));
            if (c < lead || c > trail || sp > .985) discard;
            float armB = 1. - smoothstep(.02, .16, c - lead);
            float ang = atan(c + .62, sp - .42 + 1e-4);
            float fing = (1. - smoothstep(.03, .1, abs(fract(ang * 1.9 + .25) - .5))) * step(.42, sp);
            float bone = max(max(armB, fing), 1. - smoothstep(.04, .16, sp));
            vec3 v = vP - uCam; vec3 vd = v / max(length(v), 1e-3);
            float sv = sunVis(vP), th = max(dot(vd, uSunDir), 0.); th = th * sqrt(th);
            vec3 col = vec3(.024, .019, .017) * (uSkyAmb * .6 + uShade * .6 + uSunCol * sv * .3);
            col += uAmberC * uSunCol * sv * (1. - bone) * (.24 + .6 * th);
            col += (1. - bone) * vec3(.62, .4, .24) * (uSkyAmb * .26 + uHazeCol * .55) * (.75 + .5 * smoothstep(-.1, .3, c - lead - .5 * (trail - lead)));
            col = hallHaze(col, vP);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      const wave = new THREE.Mesh(g, waveMat); wave.frustumCulled = false; scene.add(wave);
      placed([wave], hangs);          // (they hang under the hall's ceiling: a thing of the hall like the rest)
    }
    await ctx.yield();

    // ---- after a shower: drops still falling through the hall, glinting ---------------------------------------------
    if (weather === 'shower') {
      const rng = xw('drips');
      const nD = Math.round(900 * detail), pos = new Float32Array(nD * 3), aD = new Float32Array(nD * 3), pv = new THREE.Vector3(), tg = new THREE.Vector3();
      for (let i = 0; i < nD; i++) {
        const uu = rng.range(0.28, 1), lat = rng.range(-18, 18); path.pointAt(uu, pv); path.tangentAt(uu, tg);
        const x = pv.x - tg.z * lat, z = pv.z + tg.x * lat;
        pos[i * 3] = x; pos[i * 3 + 1] = sh.floorY(x, z); pos[i * 3 + 2] = z; aD[i * 3] = rng(); aD[i * 3 + 1] = sh.ceilY(x, z); aD[i * 3 + 2] = rng.range(0.5, 0.8);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aD', new THREE.BufferAttribute(aD, 3));
      const m = mk({
        fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec3 aD; uniform vec4 uHall; uniform float uPx; varying float vA;
          void main(){
            float f = fract(uHall.z * aD.z + aD.x * 9.); vec3 P = position; P.y = mix(aD.y, position.y, f * f);
            vec4 mv = modelViewMatrix * vec4(P, 1.); float dist = max(-mv.z, .1), ideal = .06 * uPx / dist;
            gl_PointSize = clamp(ideal, 1.5, 5.);
            vA = min(1., ideal / 1.5) * smoothstep(2., 6., dist) * exp(-dist * uHall.y) * (.5 + .5 * fract(aD.x * 7.3));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          varying float vA; uniform vec3 uSunCol, uSkyAmb;
          void main(){ vec2 q = gl_PointCoord - .5; float a = max(1. - dot(q, q) * 4., 0.); gl_FragColor = vec4((uSkyAmb * 1.2 + uSunCol * .35) * a * a * vA, 1.); }`,
      });
      const drips = new THREE.Points(g, m); drips.frustumCulled = false; drips.renderOrder = 7; scene.add(drips);
    }
    await ctx.yield();

    // ---- flight, gaze, grade ------------------------------------------------------------------------------------
    // gaze: ONE rule for every subject of the hall. Each stands at its own place along the route (found from where it is in
    // the world); it begins to pull the eye when it is 62 m ahead of us and pulls fully from 40 m; it HOLDS the eye for as
    // long as it is ahead of us, and is let go by its bearing alone: once it has swung more than 70 degrees off our heading
    // (abeam) the pull eases out over the next 7 m of flight. The target is the road 22 m ahead, drawn toward each subject
    // in turn, the nearest last, so the pulls are never added together.
    const stC = A.stations.chital, aheadV = new THREE.Vector3(), gzV = new THREE.Vector3(), gzC = new THREE.Vector3(), gzT = new THREE.Vector3(), lgP = new THREE.Vector3();
    const cockP = cocks.map((c) => new THREE.Vector3(c.x, c.y + 1.05 * c.s, c.z)), chitP = new THREE.Vector3(stC.x, 1.0, stC.z);
    const gP = A.giants.map((g, i) => new THREE.Vector3(g.x, i ? 7.5 : 10, g.z));
    const st2 = A.stations.chital2, chit2P = new THREE.Vector3(st2.x, sh.floorY(st2.x, st2.z) + 1.2, st2.z);
    const rs = A.feats.rootSeats[2], troopP = new THREE.Vector3(rs.x, rs.y + 0.5, rs.z);
    const boughP = A.feats.batBough.at(0.5, new THREE.Vector3()); boughP.y -= 0.6;
    const limbP = A.feats.langurLimb.at(0.5, new THREE.Vector3()); limbP.y += 0.5;
    const hall0 = 0.28 * path.length, hall1 = 0.8 * path.length;          // (the hall's own stretch of the route: its first pass, not the way back through the clearing)
    const lgQ = new THREE.Vector3();
    // (the place a lander hangs is a subject too: the row is thickest there. On the day of the alarm the troop's own bough
    // is watched where the troop is on it)
    const troopOn = (u) => { const s = alarmAt(1, u, lgQ); alarm.bough.at(clamp(s, 0.3, 0.7), lgQ); lgQ.y += 0.6; return lgQ; };
    const subjects = [[chitP, 0.9], [cockP[0], 1], [chit2P, 1], [cockP[1], 1], [A.bough.mid, 1, (u) => { leapAt(leapers[1], u, lgP); return lgP; }],
      [troopP, rare ? 0 : 0.9], [limbP, 1], [boughP, 0.5], [gP[0], 0.45], [gP[1], 1],
      ...landers.map((Ld, k) => (rare && A.feats.roost[k] === alarm.bough ? [Ld.p, 1, troopOn] : [Ld.p, 0.7]))].filter((q) => q[1] > 0).map(([p, w, live]) => ({ p, w, live, d: routeAt(p.x, p.z, hall0, hall1), off: 0 }));
    // (the nearest last; where a lesser subject stands within 8 m of a greater one along the route, the greater has the last word)
    const gzKey = (sb) => sb.d - (sb.w >= 0.9 ? 8 : 0);
    subjects.sort((a, b) => gzKey(b) - gzKey(a));
    const COS_ABEAM = Math.cos(70 * Math.PI / 180), EASE = 7;
    for (const sb of subjects) {          // the last metre of the route at which the subject is still within 70 degrees of our heading
      sb.off = sb.d - 62;
      for (let dd = Math.min(sb.d + 14, path.length - 1); dd > sb.d - 62; dd -= 0.5) {
        path.posAtDist(dd, gzC); path.tangentAtDist(dd, gzT);
        gzV.subVectors(sb.live ? sb.live(dd / path.length) : sb.p, gzC);
        if (gzV.dot(gzT) / (gzV.length() || 1) >= COS_ABEAM) { sb.off = dd; break; }
      }
    }
    await ctx.yield();
    const subjectGaze = (time, u) => {
      const dist = u * path.length;
      path.posAtDist(Math.min(dist + 22, path.length), aheadV); path.posAtDist(dist, gzC); path.tangentAtDist(dist, gzT);
      for (let i = 0; i < subjects.length; i++) {
        const sb = subjects[i], ahead = sb.d - dist;
        if (ahead > 62 || dist > sb.off + EASE) continue;
        const p = sb.live ? sb.live(u) : sb.p;
        gzV.subVectors(p, gzC); const l = gzV.length() || 1, cosA = gzV.dot(gzT) / l;
        const hold = dist <= sb.off ? smoothstep(0.105, 0.309, cosA) : 1 - smoothstep(0, EASE, dist - sb.off);
        aheadV.lerp(p, sb.w * (1 - smoothstep(40, 62, ahead)) * hold);
      }
      return aheadV;
    };
    const gz0 = (subjects.reduce((m, sb) => Math.min(m, sb.d), 1e9) - 75) / path.length, gz1 = gz0 + (subjects.reduce((m, sb) => Math.max(m, sb.off + EASE), 0) / path.length - gz0) / (1 - 0.08);
    const ringGaze = RING_GAZE;         // from here the ring ahead takes the eye
    const apA = new THREE.Vector3(-10, 0, 300), apB = new THREE.Vector3(-8, 8, 150), apC = new THREE.Vector3(2, 0, 116), apV = new THREE.Vector3();
    const pois = [
      // the approach: first the rim running away ahead with the plain beside it, then the near lip of the well over the crown tops, then down the well itself
      { at: (time, u) => apV.copy(apA).lerp(apB, smoothstep(0.03, 0.075, u)).lerp(apC, smoothstep(0.115, 0.155, u)), from: -0.2, to: 0.215, weight: 0.8, fade: 0.14 },
      { at: new THREE.Vector3(12, 9, -42), from: 0.3, to: 0.4, weight: 0.45 },            // over the pool the eye rests on the far shore
      { at: subjectGaze, from: gz0, to: gz1, weight: 0.8, fade: 0.08 },
      { at: new THREE.Vector3(A.courtyard.center.x, 9, A.courtyard.center.z), from: 0.725, to: 0.845, weight: 0.4 },
      { at: A.portalSeat.position.clone(), from: ringGaze, to: 0.93, weight: 0.6 },
    ];
    // a little quicker over the dome and through the dive (the plunge should feel like one); slower over the pool, past
    // the fanned cocks and the langurs, slowest round the giants; quicker on the run to the clearing, slower across it;
    // unhurried at the arch
    const pace = (u) => 1.0 + 0.1 * (1 - smoothstep(0.14, 0.2, u)) + 0.3 * smoothstep(0.18, 0.23, u) * (1 - smoothstep(0.27, 0.31, u))
      - 0.12 * smoothstep(0.31, 0.33, u) * (1 - smoothstep(0.37, 0.4, u)) - 0.18 * smoothstep(0.4, 0.43, u) * (1 - smoothstep(0.56, 0.59, u))
      - 0.24 * smoothstep(0.59, 0.62, u) * (1 - smoothstep(0.71, 0.75, u)) + 0.12 * smoothstep(0.73, 0.76, u) * (1 - smoothstep(0.8, 0.83, u))
      - 0.14 * smoothstep(0.83, 0.85, u) * (1 - smoothstep(0.87, 0.9, u));
    const post = night
      ? { exposure: 1.75, bloom: { strength: 0.4, radius: 0.7, threshold: 0.8 }, grade: { saturation: 1.0, contrast: 1.0, tint: '#eef2ff', shadowTint: '#0a1226', vignette: 0.26, grain: 0.03 } }
      : day
        ? { exposure: weather === 'fog' ? 0.82 : 0.86, bloom: { strength: 0.28, radius: 0.6, threshold: 0.95 }, grade: { saturation: weather === 'fog' ? 1.12 : 1.04, contrast: 1.05, tint: weather === 'fog' ? '#fff3e0' : '#fffaf2', shadowTint: '#04120e', vignette: 0.3, grain: 0.02 } }
        : { exposure: 1.0, bloom: { strength: 0.36, radius: 0.62, threshold: 0.92 }, grade: { saturation: 1.08, contrast: 1.05, tint: '#fff4e6', shadowTint: '#04140f', vignette: 0.3, grain: 0.022 } };

    // the exit ring's light in the hall's haze: a warm disc round it, seen between the pillars from the far side of the clearing
    const haloMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uCol: { value: night ? new THREE.Color(0.3, 0.42, 0.7) : new THREE.Color(0.95, 0.66, 0.3) }, uK: { value: 0 } },
      vertexShader: /* glsl */`
        varying vec2 vQ;
        void main(){ vQ = position.xy / 17.; 
          // the glow is in the haze this side of the ring: drawn 45 m nearer along the line of sight (same place, same size on screen), so the pillars that flank the ring are lit by it
          vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.); float k = max(1. - 45. / max(length(mv.xyz), 1.), .25);
          mv.xyz *= k; mv.xy += position.xy * k; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; uniform float uK; varying vec2 vQ;
        void main(){
          float r = length(vQ), g = 1. - smoothstep(.45, 1., r);
          g = g * g * smoothstep(.36, .46, r);                // round the ring, not over the view through it
          gl_FragColor = vec4(uCol * g * uK, 1.);
        }`,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), haloMat);
    halo.position.copy(A.portalSeat.position); halo.frustumCulled = false; halo.renderOrder = 6; scene.add(halo);
    // what the squadron gives way to: where every animal of the hall stands, each with its own breadth
    const stand = [[chitP, 8], [cockP[0], 1.5], [chit2P, 5], [cockP[1], 1.5], [troopP, 4], [limbP, 3], [boughP, 1], [A.bough.mid, 4], ...landers.map((Ld) => [Ld.p, 0, 3])].map(([p, r, g = 6]) => ({ x: p.x, y: p.y, z: p.z, r, g }));
    { const G = A.giants[1]; stand.push({ x: G.x + Math.cos(G.mouth) * G.r * 1.85, y: 1, z: G.z + Math.sin(G.mouth) * G.r * 1.85, r: 2, g: 6 }); }
    const sqN = new THREE.Vector3();
    const sqP = new THREE.Vector3(), sqT = new THREE.Vector3(), sqR = new THREE.Vector3(), sqU = new THREE.Vector3(), sqM = new THREE.Matrix4(), sqZ = new THREE.Vector3(), sqA = new THREE.Vector3(), sqB = new THREE.Vector3(), sqC = new THREE.Vector3(), sqS = new THREE.Vector3();
    const wvP = new THREE.Vector3(), wvT = new THREE.Vector3();
    const entP = path.pointAt(0), entT = path.tangentAt(0);         // the plane of the entry: through the route's first point, across the way in
    function update(dt, time, camera, u) {
      u = u || 0;
      hero.setProgress(u); hero.update(dt, time, camera);
      sky.update(dt, time, camera);
      // the squadron keeps station in the route's own frame where we are (so it is there in the portal preview too). How it
      // flies is read off the world: how high the route runs (over the dome or under the roof), how steeply it falls, how
      // far we are from the well and from the ring; and each bat gives way to a standing animal by its distance to it
      const dist = u * path.length;
      flyAt(dist);
      path.posAtDist(dist, sqA); path.tangentAtDist(dist, sqC);
      const ry = sqA.y, dWell = Math.hypot(sqA.x - A.oculus.center.x, sqA.z - A.oculus.center.z), dRing = sqA.distanceTo(A.portalSeat.position);
      const inHall = 1 - smoothstep(11, 30, ry);
      // under the roof proper: not over the dome, not in the well, not on the avenue within 125 m of the ring
      const roofK = inHall * smoothstep(52, 66, dWell) * smoothstep(125, 160, dRing);
      sqN.set(-sqC.z, 0, sqC.x).normalize(); sqB.crossVectors(sqN, sqC).normalize();
      const kg = dt > 0 ? 1 - Math.exp(-dt * 3) : 1;
      for (let i = 0; i < NSQ; i++) {
        const b = squad[i], w1 = Math.sin(time * b.w1 + b.p1), w2 = Math.sin(time * b.w2 + b.p2);
        const sgn = b.side < 0 ? -1 : 1, as = Math.abs(b.side);
        // under the roof the formation closes up between the pillars: narrower and lower
        const sideS = lerp(b.side, sgn * Math.min(as, 2.3 + 0.36 * as), inHall), upS = b.up * lerp(1, 0.6, inHall);
        {
          // giving way: a bat whose station comes within 6 m of an animal (of the edge of a herd or a troop; 3 m of a bat
          // coming in to hang) lets us go first: it drops back behind our own station and a little out and up, and comes
          // forward again when the animal is behind it. The rest of the formation flies on in its places
          let give = 0;
          const nx = sqA.x + sqC.x * b.ahead + sqN.x * sideS + sqB.x * upS, ny = sqA.y + sqC.y * b.ahead + sqB.y * upS, nz = sqA.z + sqC.z * b.ahead + sqN.z * sideS + sqB.z * upS;
          for (let j = 0; j < stand.length; j++) {
            const q = stand[j], dx = nx - q.x, dy = ny - q.y, dz = nz - q.z;
            give = Math.max(give, 1 - smoothstep(q.g + q.r, q.g * 1.5 + q.r, Math.sqrt(dx * dx + dy * dy + dz * dz)));
          }
          b.give += (give - b.give) * kg;
        }
        const part = Math.max(b.give, b.open * roofK);
        const ahead = lerp(b.ahead, Math.min(b.ahead, b.back), part) + b.dA * w2;
        const side = sideS + b.dS * w1 + sgn * 2.4 * part, up = upS + b.dU * Math.sin(time * b.w2 * 1.3 + b.p1) + 0.9 * part;
        sqP.copy(sqA).addScaledVector(sqC, ahead).addScaledVector(sqN, side).addScaledVector(sqB, up);
        // each rides a little nose-up in the open air (the wind off the crown), level under the roof; and banks on its own clock
        const tl = b.tilt * (1 - inHall), bank = 0.22 * Math.cos(time * b.w1 + b.p1);
        sqT.copy(sqC).multiplyScalar(Math.cos(tl)).addScaledVector(sqB, Math.sin(tl)).normalize();
        sqR.copy(sqN); sqU.crossVectors(sqR, sqT).normalize();
        sqR.multiplyScalar(Math.cos(bank)).addScaledVector(sqU, Math.sin(bank)); sqU.crossVectors(sqR, sqT).normalize();
        sqM.makeBasis(sqR, sqU, sqZ.copy(sqT).negate());
        // a bat is drawn or not by its own place: not while it is itself behind the plane of the entry (the portal's plane
        // would slice it there), drawn once it has crossed it
        if ((sqP.x - entP.x) * entT.x + (sqP.y - entP.y) * entT.y + (sqP.z - entP.z) * entT.z < 0) sqM.scale(sqS.set(0.001, 0.001, 0.001));
        sqM.setPosition(sqP);
        squadMesh.setMatrixAt(i, sqM);
      }
      {       // the eleven on the stream's lowest lane over the crowns
        for (let i = 0; i < NFOX; i++) {
          const o = FX.off[i], m = (time * 12.5 + o[0] + 1.2 * Math.sin(time * o[3] + o[4]) + 2 * FX.len) % FX.len, bank = 0.2 * Math.sin(time * o[3] + o[4]);
          sqP.copy(FX.a).addScaledVector(FX.d, m).addScaledVector(FX.b, o[1]); sqP.y += o[2] + 0.5 * Math.sin(time * o[3] * 1.7 + o[4]) - 3.5 * smoothstep(FX.len - 150, FX.len, m);
          sqR.copy(FX.b).multiplyScalar(Math.cos(bank)); sqR.y = Math.sin(bank); sqU.crossVectors(sqR, FX.d).normalize();
          sqM.makeBasis(sqR, sqU, sqZ.copy(FX.d).negate());
          const sc = Math.max(0.001, smoothstep(0, 30, m) * (1 - smoothstep(FX.len - 14, FX.len, m)));         // they come out of the distance and go down into the well
          if (sc < 1) sqM.scale(sqS.set(sc, sc, sc));
          sqM.setPosition(sqP); squadMesh.setMatrixAt(NSQ + i, sqM);
        }
      }
      squadMesh.instanceMatrix.needsUpdate = true;
      batUni.uSq.value.set(fly.dive, fly.glide * 0.85, 1);
      {       // our own wings: 2.6 beats a second at the mean speed, tied to the distance flown; in on the downstroke, gone on the upstroke
        const e = camera.projectionMatrix.elements, dW = 0.9, hh = dW / Math.max(e[5], 1e-3), hw = dW / Math.max(e[0], 1e-3);
        wingU.uWf.value.set(hw, hh, dW, Math.min(2 * hw, (2 * hh * 16) / 9));
        wingU.uWingM.value.copy(camera.matrixWorld);
        const kf = smoothstep(-0.2, 0.75, Math.sin(u * 135.2 * TAU)) * (1 - fly.glide);
        wingU.uWk.value.set(lerp(kf, 0.74 + 0.08 * Math.sin(time * 7.3), fly.dive), 0, fly.dive, 0);
        ownWings.visible = u > 0;
      }
      path.posAtDist(dist, sqA);
      {       // what cannot be seen from where we are is not drawn: the plain from under the roof, the pour from far down the hall
        const plainOn = sqA.y > 24, scrubOn = plainOn && sh.rho(sqA.x, sqA.z) > 0.6, pourOn = sqA.y > 14 || Math.hypot(sqA.x - A.oculus.center.x, sqA.z - A.oculus.center.z) < 110;
        plainSet[0].visible = plainOn; plainSet[1].visible = scrubOn;          // (the scrub is under a pixel from the middle of the dome)
        for (let i = 0; i < underRoof.length; i++) underRoof[i].visible = !plainOn;
        pourMesh.visible = pourOn;
        updateWatchers(dt, sqA.x, sqA.z);
      }
      {
        const e = camera.matrixWorld.elements, hp = A.portalSeat.position;
        haloMat.uniforms.uK.value = 0.6 * smoothstep(60, 130, Math.hypot(e[12] - hp.x, e[14] - hp.z)) * (1 - smoothstep(14, 24, e[13])) * smoothstep(0.3, 0.6, u);
      }
      updateLeapers(u); updateCocks(time); updateGlider(u); updateLanders(dist);
      {       // the things of the hall: each drawn while the lens is under the roof within 160 m of it
        const e = camera.matrixWorld.elements, lx = e[12], lz = e[14], under = e[13] < 21;
        for (let i = 0; i < hallThings.length; i++) {
          const h = hallThings[i], v = under && Math.hypot(lx - h.x, lz - h.z) < h.r + 160;
          for (let j = 0; j < h.o.length; j++) h.o[j].visible = v;
        }
        // (on the day of the alarm a row is not drawn once the last of its bats has flown and been overtaken)
        if (rare) for (let i = 0; i < roostSets.length; i++) { const set = roostSets[i]; if (dist > set.gone) set.mesh.visible = false; }
      }
      fauna.update(dt, time, camera, u);
      if (rare) {
        updateAlarm(u, time);
        const R = 62 * smoothstep(alarm.uR - 0.026, alarm.uR + 0.002, u) * (1 - smoothstep(0.8, 0.87, u));
        path.pointAt(Math.min(u + 0.03, 0.95), wvP); path.tangentAt(u, wvT);
        hero.setWave(wvP.x, 13, wvP.z, R); waveMat.uniforms.uWaveDir.value.set(wvT.x, 0, wvT.z);
      }
    }
    hero.setWake(night ? 0.3 : 0.55);
    update(0, 0, new THREE.PerspectiveCamera(), 0);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 62, near: 0.5, far: 9000, lookAhead: 22, sway: 0.7, bank: 0.75 },
      pois,
      portal: { shape: 'circle', radius: 7.3, color: night ? '#a9c4ff' : '#ffd58a', glow: 1.25, revealDistance: 320 },
      post,
      ride: 'none',
      update,
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};
