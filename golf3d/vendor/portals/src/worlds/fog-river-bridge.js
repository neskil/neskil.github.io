// The Bridge in the Fog River
// A cold clear morning at a Pacific strait. We are one brown pelican in a gliding line of seven. The flight
// starts blind inside the fog beside a container ship's superstructure (her windows, the deck lamps and the
// floodlit tower warm in the cool fog), climbs in a right-hand turn and bursts into the light of a low sun
// above a river of fog (warm crests, blue-violet troughs, the cables' shadows lying across it) with a vermilion
// Art Deco suspension bridge standing in it, flies THROUGH the first tower under its top strut, comes down INSIDE
// the bridge (ten metres under the two main cables, between the two curtains of suspenders, the roadway far below),
// out over the cable where it nears the deck, dives past the painters' cradle, runs low beside and below the truss
// as a ship comes through the fog valley (funnel, mast and wheelhouse; her steam blowing away), rounds her stern,
// pulls up over the cable and flies down the roadway to a portal between the legs of the second tower.
// Far: a headland with a fog-fall pouring over its saddle, a wooded island, city hilltops and tower tops as
// islands in the white, a second bridge's tower tips. Near: a craggy lighthouse island on the bay side and a
// wooded hill with a mast on the sun side break through the river beside the main span.
//
// World space is the hero's space (src/parts/fog-river-bridge.js): the bridge runs along X, the journey
// runs toward -X, the fog flows toward -Z (the bay), the sun stands to the left (+Z) and a little behind.
// From inside the fog the hero's sheet is not drawn; a camera-following gradient dome stands in for it and
// every surface drowns in the hero's analytic slab fog (FOG_GLSL), so scene.fog stays a light horizon haze.
//
// The line of six flies ahead as an echelon that changes sides and height as the flight goes (see update) and closes on
// the centre for the portal; it flies below the line of flight wherever there is room, so the eye sees backs and upper
// wing surfaces, not edge-on sticks. The whole flock is ahead of the eye (no wingtips of our own: a wing cut by the
// frame's corner reads as a flaw). Ship 0 is placed by the world
// (hero.setShip, shipZ(u)): we cross her line astern of the funnel, upwind of her steam. Its shadows
// (and those of the far lines) lie on the fog, or on the road where the deck stands clear. One far line is a companion: it
// keeps station ahead and to the sun side of the route for the dive, low over the fog, so its shadows are in frame.
// The fog-fall is a bank behind the saddle, a soft
// sheet down the lee slope and puffs tumbling down it. Ship 0 trails a steam plume (kit) from her funnel.
// At the far landfall, to the sun side of the bridge's line and never across it, stands a wooded headland of its own
// (two shoulders at most 350 m over the water, a saddle 200 m over the river's top) and through that saddle the river
// pours as one slow heavy body down the lee slope toward the bridge: the flight's far subject from the cable ride on.
//
// The fog river near the eye: the hero's sheet carries real heads (hero.fog.surfaceAt) and is lit as a scatterer (soft
// terminators, a pale luminous shade, no ruled edge anywhere). On it stand soft fog heads (one instanced call): big ones
// round the valley under the main span and where we burst out, a lattice of half-transparent tufts that drifts with the
// flow and wraps round the camera, and wisps: thin streaks drawn out down the wind that run faster than the river, one band
// across the route in the valley (between the eye and the truss, never higher than the truss's foot), one beside the whole
// bridge just above the river's top (no streak reaches over the deck: the sight line down it to the portal stays clear,
// and the portal is an arch that fills the bay between the second tower's legs: its light lies on the road, on the
// fog under it (hero uPG) and in the tower's bay, and a line of kerb lights runs to it). Valleys are cooler, their heads
// still reach the sun. The kit mist is only a few thin wisps over the top and none in the valley (a layer of it under the
// eye reads as dunes). The valley floor beside the eye carries a finer lattice of small tufts and wisps that peel off it. The sun stands
// at bearing 156-162: to the left and a little behind, so each tower shows one lit and one shaded face on every approach
// and the towers', cables' and suspenders' shadows lie across the fog ahead (further behind the eye the fog goes flat).
//
// The river is torn open in four large rifts (hero.setRift, uniforms uRift / uRiftK): two beside the main span, two beside
// the second tower. In them the sheet falls away in veils to dark water (one mesh, makeWaterMat: ripples, wind streaks,
// sun glints, five analytic wakes) with ferries, a tug and barge, a pilot boat, sailing boats and a stone fort with its
// pier and lamps on a rock; ship 0's wake runs through the rift on the sun side. No fog head stands inside a rift.
// The rifts open while the eye is still blind in the fog and are closed while the world is seen through a portal (u = 0).
// Seen through the previous portal (u = 0) the fog is thin and the sky shows through it, so the opening holds the floodlit
// vermilion tower over pale fog; it thickens over the first 3% of the flight.
//
// Looks (ctx.vary.hour, else by seed): morning (cold blue and white), first light (peach and lavender, long
// tower shadows, lamps on), amber evening, moonlit night (floodlit towers over silver fog). Also by seed:
// winter frost, fog height, sun bearing, tower style and paint (hero), the headland's shape, one or two
// fog-falls, where the far pelican lines fly. Rare (ctx.vary.rare): a four-masted barque passes under the
// deck instead of the container ship, only its royals, mastheads and pennants above the fog.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, FOG_GLSL, DOME_GLSL, deckY, cableY } from '../parts/fog-river-bridge.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const LIN = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const bell = (x, c, w) => Math.exp(-((x - c) / w) * ((x - c) / w));

const LOOKS = {
  morning: {
    hour: 'day', title: 'The Bridge in the Fog River',
    sky: { preset: 'day', zenith: '#1a54b0', mid: '#4f90d8', horizon: '#dfe2e6', ground: '#d7dfea', clouds: false, clouds2: { coverage: 0.47, opacity: 0.66, lit: '#fff1dc' } },
    sunEl: [9.5, 13], sunCol: '#ffdcb0', sunI: 3.4, hemiSky: '#98b6f0', hemiGround: '#cdd3e2', hemiI: 1.0,
    fogLit: '#ffdcae', fogShade: '#5f79c8', haze: '#d6e0ee', hazeD: 0.00017, exposure: 1.0, bloom: 0.3,
    tint: '#f9faff', shadow: '#0a1230', sat: 1.08, glow: 0, portal: '#fff1d6', shadowA: 0.62, shadeK: 1, relief: 1,
  },
  dawn: {
    hour: 'dawn', title: 'The Bridge in the Fog River, first light',
    sky: { preset: 'dawn', zenith: '#33508f', mid: '#8d8fc0', horizon: '#ffc7a6', ground: '#e9c3b4', clouds: false, clouds2: { coverage: 0.5, opacity: 0.7, lit: '#ffd9c0' } },
    sunEl: [8, 12], sunCol: '#ffb486', sunI: 3.0, hemiSky: '#8f9fdc', hemiGround: '#d9b9b4', hemiI: 0.95,
    fogLit: '#ffd9c4', fogShade: '#6670b0', haze: '#f0c6b4', hazeD: 0.00019, exposure: 0.98, bloom: 0.42,
    tint: '#fff6f2', shadow: '#0c1030', sat: 1.02, glow: 0.5, portal: '#ffe0c0', shadowA: 0.5, shadeK: 0.8, relief: 0.9,
  },
  golden: {
    hour: 'golden', title: 'The Bridge in the Fog River, amber evening',
    sky: { preset: 'goldenHour', zenith: '#2a5aa6', mid: '#86a0c8', horizon: '#ffd08c', ground: '#eec99c', clouds: false, clouds2: { coverage: 0.5, opacity: 0.7, lit: '#ffdfae' } },
    sunEl: [10, 15], sunCol: '#ffb25e', sunI: 3.1, hemiSky: '#93a8dc', hemiGround: '#dcc09a', hemiI: 0.95,
    fogLit: '#ffdca6', fogShade: '#6f6aa6', haze: '#f2cd9c', hazeD: 0.00019, exposure: 1.02, bloom: 0.42,
    tint: '#fff8ee', shadow: '#120e2c', sat: 1.02, glow: 0.3, portal: '#ffe2b0', shadowA: 0.52, shadeK: 0.8, relief: 0.9,
  },
  night: {
    hour: 'night', title: 'The Bridge in the Fog River, moonlight',
    sky: { preset: 'night', clouds: false, clouds2: false, bake: true, milkyWay: 0.07, milkyAngle: 205, milkyCore: '#7f93c8' },      // a faint band only: its bright dusty core read as a smoke blotch over the headland, so it is turned behind us
    sunEl: [34, 42], sunCol: '#a9bcff', sunI: 1.5, hemiSky: '#4860a6', hemiGround: '#28324e', hemiI: 1.0,
    fogLit: '#8fa4d2', fogShade: '#2a3962', haze: '#141d38', hazeD: 0.00016, exposure: 1.25, bloom: 0.5,
    tint: '#eef2ff', shadow: '#040818', sat: 1.05, glow: 1, portal: '#cfe0ff', shadowA: 0.32, shadeK: 0, relief: 0.3,
  },
};

// ---------- a plain indexed accumulator for everything far and static (land, trees, buildings, the barque) ----------
class Acc {
  constructor() { this.P = []; this.N = []; this.C = []; this.E = []; this.I = []; }
  get n() { return this.P.length / 3; }
  v(x, y, z, nx, ny, nz, c, e = 0) { this.P.push(x, y, z); this.N.push(nx, ny, nz); this.C.push(c[0], c[1], c[2]); this.E.push(e); return this.P.length / 3 - 1; }
  quad(a, b, c, d, col, e = 0) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i = this.n;
    for (const p of [a, b, c, d]) this.v(p[0], p[1], p[2], nx, ny, nz, col, e);
    this.I.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  tri(a, b, c, col, e = 0) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i = this.n;
    for (const p of [a, b, c]) this.v(p[0], p[1], p[2], nx, ny, nz, col, e);
    this.I.push(i, i + 1, i + 2);
  }
  // cloth: per-vertex flutter weights w (stored as negative aE); the material moves them along the normal
  quadW(a, b, c, d, col, w) { const i = this.n; this.quad(a, b, c, d, col, 0); for (let k = 0; k < 4; k++) this.E[i + k] = -w[k]; }
  triW(a, b, c, col, w) { const i = this.n; this.tri(a, b, c, col, 0); for (let k = 0; k < 3; k++) this.E[i + k] = -w[k]; }
  // upright box turned by `rot` about Y, standing on y0 (no bottom); roofCol optional
  box(cx, y0, cz, sx, sy, sz, rot, col, e = 0, roofCol = null) {
    const c = Math.cos(rot), s = Math.sin(rot), hx = sx / 2, hz = sz / 2, y1 = y0 + sy;
    const k = (lx, lz, y) => [cx + lx * c + lz * s, y, cz - lx * s + lz * c];
    const A = k(-hx, -hz, y0), B = k(hx, -hz, y0), C = k(hx, hz, y0), D = k(-hx, hz, y0), A1 = k(-hx, -hz, y1), B1 = k(hx, -hz, y1), C1 = k(hx, hz, y1), D1 = k(-hx, hz, y1);
    this.quad(B, A, A1, B1, col, e); this.quad(C, B, B1, C1, col, e); this.quad(D, C, C1, D1, col, e); this.quad(A, D, D1, A1, col, e);
    this.quad(D1, C1, B1, A1, roofCol || col, 0);
  }
  // a square beam between two points
  beam(a, b, w, col, e = 0) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    let sx = -dz, sz = dx; const sl = Math.hypot(sx, sz); if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
    let tx = -sz * dy / L, ty = (sz * dx - sx * dz) / L, tz = sx * dy / L; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const h = w / 2, q = (p, i, j) => [p[0] + (sx * i + tx * j) * h, p[1] + ty * j * h, p[2] + (sz * i + tz * j) * h];
    const A = [q(a, -1, -1), q(a, 1, -1), q(a, 1, 1), q(a, -1, 1)], B = [q(b, -1, -1), q(b, 1, -1), q(b, 1, 1), q(b, -1, 1)];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad(A[i], A[j], B[j], B[i], col, e); }
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(this.E, 1));
    g.setIndex(this.I); g.computeBoundingSphere();
    return g;
  }
  // toGeometry() for the big far-land mesh, handing the frame back between the attribute copies (the same geometry)
  async toGeometrySteps(ctx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); await ctx.yield();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); await ctx.yield();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(this.E, 1)); await ctx.yield();
    g.setIndex(this.I); await ctx.yield();
    // the bounding sphere in the same arithmetic as three's computeBoundingSphere() (box of the points, its centre, the
    // furthest point from it), in steps that hand the frame back
    const P = g.attributes.position.array, n = P.length / 3, STEP = 2000;
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let a = 0; a < n; a += STEP) {
      for (let i = a * 3, e = Math.min(a + STEP, n) * 3; i < e; i += 3) {
        const x = P[i], y = P[i + 1], z = P[i + 2];
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); z0 = Math.min(z0, z); x1 = Math.max(x1, x); y1 = Math.max(y1, y); z1 = Math.max(z1, z);
      }
      await ctx.yield();
    }
    const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5, cz = (z0 + z1) * 0.5;
    let r2 = 0;
    for (let a = 0; a < n; a += STEP) {
      for (let i = a * 3, e = Math.min(a + STEP, n) * 3; i < e; i += 3) {
        const dx = cx - P[i], dy = cy - P[i + 1], dz = cz - P[i + 2];
        r2 = Math.max(r2, dx * dx + dy * dy + dz * dz);
      }
      await ctx.yield();
    }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
    return g;
  }
}

// the hero's fog uniforms, shared by reference with every shader of the world that includes FOG_GLSL
const fogShare = (U) => ({ uFN: U.uFN, uFg: U.uFg, uFg2: U.uFg2, uGap: U.uGap, uGap2: U.uGap2, uShip: U.uShip, uFlow: U.uFlow, uShipDip: U.uShipDip, uFogLit: U.uFogLit, uFogShade: U.uFogShade, uCam: U.uCam, uCamH: U.uCamH, uRift: U.uRift, uRiftK: U.uRiftK, uInK: U.uInK });

// lit vertex-colour material for the far world: sun + sky, lamp-lit windows (aE), drowned in the fog slab
// win: [cell width, cell height] (m) of real windows, taken in the object's own space, for things seen from close by (the
// vessels, the fort); null: the far city's 9 x 7 m lit cells
function makeFarMat(U, LU, side = THREE.FrontSide, lapK = 0.78, slabK = 1, vegK = 1, win = null) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU, uLapK: { value: lapK }, uSlabK: { value: slabK }, uVegK: { value: vegK }, uWin: { value: new THREE.Vector2(win ? win[0] : 9, win ? win[1] : 7) }, uWinK: { value: win ? 1 : 0 } }, fog: true, side,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float aE; uniform float uTime;
      varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying float vE; varying vec3 vOp; varying vec3 vOn;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.); vN = mat3(modelMatrix) * normal; vCol = color; vE = max(aE, 0.); vOp = position; vOn = normal;
        float fl = max(-aE, 0.);                  // cloth: sails belly and pump, pennants stream
        wp.xyz += (vN / max(length(vN), 1e-4)) * ((sin(uTime * 2.1 + wp.z * .3 + wp.y * .45) * .5 + sin(uTime * 5.3 + wp.y * 1.3 + wp.z * .9) * .2) * fl);
        vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying float vE; varying vec3 vOp; varying vec3 vOn;
      uniform vec3 uSunDir; uniform vec3 uSunL; uniform vec3 uSkyL; uniform vec3 uGroundL; uniform vec3 uWarmL; uniform float uLamp; uniform float uLapK; uniform float uSlabK; uniform float uVegK; uniform vec2 uWin; uniform float uWinK;
      ${FOG_GLSL}
      #include <fog_pars_fragment>
      void main() {
        vec3 n = vN / max(length(vN), 1e-4);
        if (!gl_FrontFacing) n = -n;
        float d = dot(n, uSunDir), ndl = max(d, 0.);
        vec3 tex = frbN(vWp.xz * .021 + vWp.y * .013);
        vec3 alb = vCol * (.84 + .32 * tex.r);
        float veg = smoothstep(.42, .66, frbN(vWp.xz * .0085 + 3.3).g * .55 + frbN(vWp.xz * .034 + 1.9).b * .45);
        alb *= mix(1., .58, uVegK * veg * step(vE, .01) * smoothstep(.35, .6, n.y) * step(110., length(vWp.xz)));        // darker scrub and wood in patches
        vec3 col = alb * (uSunL * (ndl * .92 + .08 * (d * .5 + .5)) + mix(uGroundL, uSkyL, n.y * .5 + .5) * 1.3);
        if (vE > .01) {
          vec3 on = vOn / max(length(vOn), 1e-4);
          vec2 w = vec2(dot(vOp.xz, vec2(on.z, -on.x)) / max(uWin.x, .1), vOp.y / max(uWin.y, .1));
          float lit = step(.5, frbN(floor(w) + 17.).g);
          vec2 fc = fract(w);
          float win = mix(1., step(.22, fc.x) * step(fc.x, .78) * step(.3, fc.y) * step(fc.y, .74), uWinK);      // a window in each cell (near things)
          col *= 1. - mix(.22 * lit, .55 * win, uWinK) * step(vE, 1.5);
          col += uWarmL * (uLamp * min(vE, 1.) * lit * win);
          if (vE > 1.5) col += uWarmL * (vE - 1.) * (.25 + uLamp);
        }
        float lapW = mix(95., 48., smoothstep(900., 2500., distance(vWp.xz, uCam.xz)));          // a deeper band of mist on the near shore
        lapW *= 1. - .62 * step(.002, vE) * step(vE, .009);                                       // (the near islands stand crisp out of it)
        float lap = 1. - smoothstep(0., 1., (vWp.y - frbH(vWp.xz) + (tex.g - .5) * 26.) / lapW);
        col = mix(col, mix(uFogShade, uFogLit, .72), lap * uLapK);        // mist lapping up the slopes: no ruled line where land meets fog
        col = mix(col, frbFogColor(), frbFogAmount(vWp) * uSlabK);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// the fog pouring over the headland: a thick bank standing behind the saddle (r < 0) and a soft sheet draped down the
// lee slope (r 0..1) that thins to nothing where it meets the river
function makeFallMat(U, LU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU }, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aSR;                       // x across -1..1, y downstream -1..1, z thickness (m)
      attribute vec4 aT;                        // the sheet's frame on the ground: xy across, zw downstream (unit, world xz)
      uniform float uTime;
      varying vec3 vWp; varying vec3 vN; varying vec3 vSR; varying vec4 vT;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        float w = sin(aSR.y * 15. - uTime * .9 + aSR.x * 2.6) + .6 * sin(aSR.y * 31. - uTime * 1.5 - aSR.x * 4.1);
        p.y += w * aSR.z * .09 * smoothstep(-.6, .2, aSR.y);
        vWp = p; vN = normal; vSR = aSR; vT = aT;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vWp; varying vec3 vN; varying vec3 vSR; varying vec4 vT;
      uniform vec3 uSunDir; uniform float uTime;
      ${FOG_GLSL}
      ${DOME_GLSL}
      #include <fog_pars_fragment>
      void main() {
        float fl = vSR.y - uTime * .09;
        float n = frbN(vec2(vSR.x * 3.2, fl * 4.4)).r * .5 + frbN(vec2(vSR.x * 7. + 3.1, fl * 10.)).g * .3 + frbN(vec2(vSR.x * 16. + 1.7, fl * 23.)).b * .2;
        // the river's cauliflower carried onto the pour: two scales of heads rolling down with the flow
        vec2 fp = vec2(vSR.x * 6., fl * 14.) + (frbN(vec2(vSR.x * 2.1 + 6.6, fl * 3.)).rg - .5) * .9;
        vec3 d1 = frbDome(fp), d2 = frbDome(fp * 2.6 + 7.3);
        float head = d1.x * .62 + d2.x * .38;
        float e = 1. - abs(vSR.x);
        float pour = max(vSR.y, 0.);
        float body = smoothstep(0., .4, e) * smoothstep(-1., -.72, vSR.y) * (1. - smoothstep(.7, 1., vSR.y));
        float notch = (head - .55) * (.45 * (1. - smoothstep(0., .22, abs(vSR.y))) + .95 * smoothstep(.4, .95, vSR.y) + .5 * (1. - smoothstep(.1, .5, e)));   // the lip, the foot and the sides break into heads
        float a = smoothstep(0., 1.25, body * (.78 + 1.1 * n) - .2 * pour + notch) * (1. - smoothstep(.7, 1., vSR.y));
        vec3 N = vN / max(length(vN), 1e-4);
        vec2 g = d1.yz * 2.4 + d2.yz * 1.5;                                   // uphill on the heads, in sheet space
        vec3 Nb = N - vec3(vT.x, 0., vT.y) * g.x - vec3(vT.z, 0., vT.w) * g.y; Nb = Nb / max(length(Nb), 1e-4);
        float lit = smoothstep(-.6, .7, dot(Nb, uSunDir) + (n - .5) * .3) * mix(.6, 1., smoothstep(.15, .7, head));
        float streak = frbN(vec2(vSR.x * 9. + 5.5, fl * 2.6)).r * .6 + frbN(vec2(vSR.x * 21. + 2.2, fl * 6.)).g * .4;       // drawn out down the pour
        vec3 col = mix(mix(uFogShade, uFogLit, .45) * .9, uFogLit * .9, lit * (.6 + .55 * streak));
        col = mix(col, frbFogColor(), .5 * frbFogAmount(vWp));
        gl_FragColor = vec4(col, a * .9);
        #include <fog_fragment>
      }`,
  });
}

// soft fog heads standing on the river near the route, and wisps peeling off it (instanced billboards; aP = centre + radius,
// aQ = fade, height / width, seed). A head is shaded as a lumpy dome from the sun's side and its foot melts into the sheet it
// stands on; a wisp (aQ.y negative) is a thin streak drawn out down the wind, which the eye may fly through.
function makeHeadMat(U, LU, HV) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU, uHeadVis: HV }, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aP; attribute vec3 aQ;
      uniform vec3 uSunDir; uniform vec2 uFlow;
      varying vec2 vUv; varying vec4 vQ; varying vec3 vLs; varying vec2 vH;
      #include <fog_pars_vertex>
      void main() {
        float wk = step(aQ.y, 0.), asp = abs(aQ.y);
        vUv = position.xy; vQ = vec4(aQ.x, asp, aQ.z, wk); vH = vec2(aP.y, aP.w * asp);
        vLs = mat3(viewMatrix) * uSunDir;
        vec4 mvPosition = viewMatrix * vec4(aP.xyz, 1.);
        float dist = length(mvPosition.xyz);
        vQ.x *= mix(smoothstep(aP.w * .8, aP.w * 2.4, dist), smoothstep(5., 24., dist), wk);      // never a face full of head; a wisp may brush past
        vec2 fd = (mat3(viewMatrix) * vec3(uFlow.x, 0., uFlow.y)).xy; float fl = length(fd);
        fd = mix(vec2(1., 0.), fd / max(fl, 1e-3), wk * step(1e-3, fl));                           // a wisp lies along the wind as the eye sees it
        vec2 off = position.xy * vec2(mix(1., mix(.45, 1., min(fl, 1.)), wk), asp) * aP.w;
        mvPosition.xy += fd * off.x + vec2(-fd.y, fd.x) * off.y;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec4 vQ; varying vec3 vLs; varying vec2 vH;
      uniform float uHeadVis; uniform float uTime;
      ${FOG_GLSL}
      ${DOME_GLSL}
      #include <fog_pars_fragment>
      void main() {
        float r2 = dot(vUv, vUv);
        float hh = clamp((vH.x + vUv.y * vH.y - uFg.z) / max(uFg.x - uFg.z, 1.), 0., 1.2);
        float open = smoothstep(.08, .95, hh);                                  // 0 down in a valley of the river .. 1 on its top
        vec3 shadeC = mix(uFogShade, uFogLit, .26 + .14 * open) * .9;
        vec3 col; float a;
        if (vQ.w > .5) {
          vec2 sp = vec2(vUv.x * 1.1 - uTime * .05, vUv.y * 2.1) + vQ.z * 53.;
          float n = frbN(sp).r * .55 + frbN(sp * vec2(2.3, 3.1) + 4.7).g * .3 + frbN(sp * vec2(5.1, 7.3) + 9.2).b * .15;
          float env = (1. - vUv.x * vUv.x) * (1. - vUv.y * vUv.y);
          a = smoothstep(0., .6, env * env * (.3 + 1.5 * n) - .26) * vQ.x * uHeadVis * mix(.7, .62, smoothstep(.3, .5, open));
          if (a < .004) discard;
          // down in a valley a wisp is a layer of its own over the floor: its upper edge in the sun, its underside in cool shade
          float lw = mix(.5, 1., smoothstep(.25, .8, n)) * mix(mix(.3, .7, open), 1., smoothstep(-.5, .45, vUv.y)) * mix(.84, 1., open);
          col = mix(shadeC * mix(.7, 1., open), uFogLit * 1.04, lw);
        } else {
          vec2 sp = vUv * 1.5 + vQ.z * 37.;
          vec3 na = frbN(sp + vec2(uTime * .012, 0.)), nb = frbN(sp * 2.7 + 5.1 - vec2(0., uTime * .018));
          float n = na.r * .62 + nb.g * .38;
          // lobes: a small scale of cells (about 3.8 m) breaks the outline into cauliflower and models the body
          float R = vH.y / max(vQ.y, .05);
          vec3 cd = frbDome(vec2(vUv.x, vUv.y * vQ.y) * clamp(R / 3.8, 1.7, 3.3) + (na.rg - .5) * .9 + vQ.z * 91. + vec2(uTime * .012, 0.));      // three to six lobes across, warped
          float lobe = smoothstep(.1, .7, cd.x);
          a = smoothstep(0., mix(.24, .4, open), (1. - r2) * (.5 + 1.15 * n) - .3 + (lobe - .62) * .16);
          float foot = smoothstep(-.6, .05, vUv.y + (n - .5) * .5);               // seated: the foot melts into the sheet
          a *= foot * vQ.x * uHeadVis;
          if (a < .004) discard;
          float z = sqrt(max(1. - r2, 0.));
          vec2 bump = (na.gb - .5) * 1.5 + (nb.rb - .5) * .9 - cd.yz * .6;
          vec3 N = vec3(vUv * vec2(1., 1.2) + bump * (.35 + .65 * z), z + .2); N = N / max(length(N), 1e-4);
          float rise = smoothstep(-.45, .55, vUv.y + (n - .5) * .4);
          float lit = smoothstep(-.5, .6, dot(N, vLs)) * mix(.4, 1., smoothstep(.25, .75, n)) * mix(mix(.18, .42, open), 1., smoothstep(mix(-.3, -.55, open), mix(.6, .5, open), vUv.y + (nb.b - .5) * .5));      // lit from the side and from above: a bright crown over a body in shade (most of all down in a valley, where the heads stand in one another's shade)
          lit *= mix(mix(.55, 1., open), 1., rise * .9) * mix(.8, 1.05, lobe);                       // its foot takes the sheet's tone (cooler in a hollow), its top rises into the sun
          col = mix(shadeC * mix(.64, 1., open), uFogLit, smoothstep(0., .85, lit));      // down in a valley its body stands in a deeper cool shade under a bright crown
          col += uFogLit * .12 * (1. - smoothstep(.0, .7, a)) * rise;            // light through its thin crown
        }
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
}

// big soft puffs tumbling down the fog-fall (instanced billboards; aP = centre + size, aQ = fade, turn, seed)
function makeTumbleMat(U, LU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU }, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aP; attribute vec3 aQ;
      varying vec2 vUv; varying vec3 vQ;
      #include <fog_pars_vertex>
      void main() {
        vUv = position.xy; vQ = aQ;
        vec4 mvPosition = viewMatrix * vec4(aP.xyz, 1.);
        float c = cos(aQ.y), s = sin(aQ.y);
        mvPosition.xy += vec2(position.x * c - position.y * s, (position.x * s + position.y * c) * .62) * aP.w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vQ;
      ${FOG_GLSL}
      #include <fog_pars_fragment>
      void main() {
        float r2 = dot(vUv, vUv);
        float n = frbN(vUv * 2.3 + vQ.z * 37.).r * .6 + frbN(vUv * 5.6 + vQ.z * 11.).g * .4;
        float a = smoothstep(.0, .75, (1. - r2) * (.45 + 1.1 * n) - .3) * vQ.x;
        vec3 col = mix(mix(uFogShade, uFogLit, .3), uFogLit, clamp(.35 + .5 * vUv.y + .5 * n, 0., 1.));
        gl_FragColor = vec4(col, a * .6);
        #include <fog_fragment>
      }`,
  });
}

// the landfall headland: lit vertex colours like the far land (sun + sky, scrub and wood in patches), mist lapping up its
// foot in a band of one depth, drowned in the fog slab like every surface of the world
function makeHeadlandMat(U, LU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU }, fog: true,
    vertexShader: /* glsl */`
      attribute vec3 color;
      varying vec3 vWp; varying vec3 vN; varying vec3 vCol;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.); vN = mat3(modelMatrix) * normal; vCol = color; vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vWp; varying vec3 vN; varying vec3 vCol;
      uniform vec3 uSunDir; uniform vec3 uSunL; uniform vec3 uSkyL; uniform vec3 uGroundL;
      ${FOG_GLSL}
      #include <fog_pars_fragment>
      void main() {
        vec3 n = vN / max(length(vN), 1e-4);
        float d = dot(n, uSunDir), ndl = max(d, 0.);
        vec3 tex = frbN(vWp.xz * .021 + vWp.y * .013), fine = frbN(vWp.xz * .083 + vWp.y * .05 + 4.1);
        vec3 alb = vCol * (.8 + .26 * tex.r + .14 * fine.g);
        float veg = smoothstep(.4, .64, frbN(vWp.xz * .0085 + 7.9).g * .55 + frbN(vWp.xz * .034 + 5.3).b * .45);
        alb *= mix(1., .62, veg * smoothstep(.5, .72, n.y));                                    // darker scrub and wood in patches
        vec3 col = alb * (uSunL * (ndl * .92 + .08 * (d * .5 + .5)) + mix(uGroundL, uSkyL, n.y * .5 + .5) * 1.9);      // (its shade is lit by the sky and by the bright river under it)
        col = mix(col, fogColor, .05);                                           // (it stands back a little in the look's haze)
        float lap = 1. - smoothstep(0., 1., (vWp.y - uFg.x - uFg.y * .4 + (tex.g - .5) * 30.) / 58.);
        col = mix(col, mix(uFogShade, uFogLit, .72), lap * .8);        // mist lapping up the slopes from the river's mean top: no ruled line where land meets fog
        col = mix(col, frbFogColor(), frbFogAmount(vWp));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// the great fog-fall at the landfall: ONE heavy body of fog. A bank stands level behind the headland's saddle (r < 0), bends
// over a soft lip and lies draped down the lee slope (r 0..1), thick in the middle of the saddle and thin toward its sides,
// down its lower half and between its heads, where the rock and the scrub show through it; at the foot it lands on the
// river and rolls out as a low bank that sinks into the river's top and drowns in the same slab fog as every surface.
// Its pattern is broad soft rolls, wider than long, and the whole of it rides downstream at one speed (uPour.w m/s): no
// streaks, no strands. Its light is the look's own: the bank, the lip and the upper fall take the lit fog colour on the
// sides of the rolls that lean to the sun, the folds and the lower fall the shade colour, and where it has rolled out on
// the river it stands in the sun again like the river round it (uTone: how far the shade is lifted toward the lit colour,
// its gain, the lit colour's gain; uLev: the heights between which the fall goes from its foot's tone to its crest's)
function makePourMat(U, LU, PU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU, ...PU }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aSR;                       // x across -1..1, y downstream -1..1, z thickness (m)
      attribute vec4 aT;                        // the sheet's frame on the ground: xy across, zw downstream (unit, world xz)
      uniform float uTime; uniform vec4 uPour;  // half width, length behind the lip, length down the lee (m), speed (m/s)
      uniform sampler2D uFN;
      varying vec3 vWp; varying vec3 vN; varying vec3 vSR; varying vec4 vT; varying vec2 vF;
      #include <fog_pars_vertex>
      vec3 pourN(vec2 p) { vec2 i = floor(p), f = p - i; f = f * f * (3. - 2. * f); return textureLod(uFN, (i + f + .5) / 64., 0.).rgb; }
      void main() {
        vec3 p = position;
        float dn = aSR.y * mix(uPour.y, uPour.z, step(0., aSR.y));
        vF = vec2(aSR.x * uPour.x, dn - uTime * uPour.w);                                        // metres across, metres of pattern downstream
        float b = pourN(vF / vec2(96., 70.)).r * .6 + pourN(vF / vec2(43., 33.) + 3.7).g * .4;   // rolls with real height, riding down
        float k = smoothstep(-1., -.5, aSR.y) * (1. - smoothstep(.9, 1., aSR.y));
        p += normal * ((b - .45) * min(aSR.z, 30.) * .6 * k);
        vWp = p; vN = normal; vSR = aSR; vT = aT;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vWp; varying vec3 vN; varying vec3 vSR; varying vec4 vT; varying vec2 vF;
      uniform vec3 uSunDir; uniform vec3 uTone; uniform vec2 uLev; uniform float uGlow;
      ${FOG_GLSL}
      ${DOME_GLSL}
      #include <fog_pars_fragment>
      void main() {
        float e = 1. - abs(vSR.x), pour = max(vSR.y, 0.);
        float n = frbN(vF / 140.).r * .55 + frbN(vF / 56. + 3.1).g * .45;
        vec2 wq = vF + (frbN(vF / 180. + 6.6).rg - .5) * 44.;
        vec3 d1 = frbDome(wq / vec2(88., 64.)), d2 = frbDome(wq / vec2(60., 45.) + 7.3);        // rolling heads: broad, wider than long
        float head = d1.x * .64 + d2.x * .36;
        float side = smoothstep(0., .22, e + (n - .5) * .26 + (head - .5) * .1);
        float ends = smoothstep(-1., -.72, vSR.y) * (1. - smoothstep(.8, 1., pour + (head - .5) * .2));
        float thick = vSR.z * (.3 + 1.25 * head);                                                 // thin between the heads, toward the sides and down the slope: the rock shows through
        float a = side * ends * max(smoothstep(1., 18., thick), .08 * smoothstep(0., 8., vSR.z));      // (a soft body: a thin veil lies over the rock where the fall is thin, with no hard-edged holes)
        if (a < .004) discard;
        vec3 N = vN / max(length(vN), 1e-4);
        if (N.y < 0.) N = -N;
        vec2 g = d1.yz * 3.0 + d2.yz * 1.6;                                   // uphill on the heads, in sheet space
        vec3 Nb = N - vec3(vT.x, 0., vT.y) * g.x - vec3(vT.z, 0., vT.w) * g.y; Nb = Nb / max(length(Nb), 1e-4);
        float sunK = dot(Nb, uSunDir) + (n - .5) * .25;
        float top = smoothstep(uLev.x, uLev.y, vWp.y);                        // 0 at the river .. 1 at the lip and the bank
        float landed = smoothstep(.62, .84, pour);                            // rolled out on the river: in the sun again, like the river round it
        float sunny = max(top, landed);
        float fold = smoothstep(.2, .75, head);
        float lit = smoothstep(-.62, .5, sunK) * mix(.26, 1., sunny) * mix(.6, 1., fold) + uGlow * top * fold;
        vec3 shadeC = mix(uFogShade, uFogLit, uTone.x) * uTone.y;
        vec3 col = mix(shadeC, uFogLit * (uTone.z * (1. + .16 * top * fold)), clamp(lit, 0., 1.));      // (the heads of the bank and the lip glow in the look's light)
        col = mix(col, frbFogColor(), mix(.55, 1., landed) * frbFogAmount(vWp));                         // (on the river it drowns in the slab like the river's own heads)
        gl_FragColor = vec4(col, a * .97);
        #include <fog_fragment>
      }`,
  });
}

// dark water at the bottom of the rifts torn in the river: ripples, long streaks of ruffled and slick water drawn out down
// the wind, glints that flash (most toward the sun), the wakes of up to five vessels (uBoat: xz + unit heading; uBoatD: half
// width at the stern, length, strength) and the portal's light. Outside a rift's footprint it drowns in the slab like all else.
function makeWaterMat(U, LU, WTU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU, ...WTU, uPG: U.uPG, uPGc: U.uPGc }, fog: true, transparent: true, depthWrite: true,
    vertexShader: /* glsl */`
      varying vec3 vWp;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vWp;
      uniform vec3 uSunDir; uniform vec3 uSunL; uniform float uTime;
      uniform vec3 uDeep; uniform vec3 uSkyRef; uniform vec3 uFoam; uniform vec4 uBoat[5]; uniform vec4 uBoatD[5]; uniform vec4 uPG; uniform vec3 uPGc; uniform vec4 uSea;
      ${FOG_GLSL}
      #include <fog_pars_fragment>
      void main() {
        vec2 p = vWp.xz; vec3 toCam = uCam - vWp; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
        // where the water shows: open in a rift; dark under the river in a wide skirt round each rift (through the thin veils of
        // a rift's wall the eye looks in under the fog: water there, not a pale void); and round the blind arrival (uSea), where
        // only distance drowns it. Everywhere else it is not drawn.
        vec2 qs = vec2(dot(p, vec2(-uFlow.y, uFlow.x)), dot(p, uFlow));
        float paw = frbN(qs * vec2(.018, .0045) + 4.4 + uTime * .004).r * .6 + frbN(qs * vec2(.05, .012) + 1.3).g * .4;
        float rkW = frbRift(p, p - uFlow * (uFg.w * uFg2.w));
        float open = smoothstep(.02, .17, rkW + (paw - .5) * .1 * smoothstep(0., .05, rkW));
        float sk = 0.;
        for (int i = 0; i < 4; i++) { vec2 d = (p - uRift[i].xy) / max(uRift[i].zw, vec2(1.)); sk = max(sk, 1. - smoothstep(1.05, 2.1, length(d) + (paw - .5) * .3)); }
        float cin = clamp((uCamH - uCam.y + 4.) / 10., 0., 1.), fin = 1. - exp(-uFg2.z * dist);
        float seaK = uSea.w * (1. - smoothstep(.5, 1., length(p - uSea.xy) / max(uSea.z, 1.)));
        float vis = max(max(open, sk * uRiftK) * (1. - cin * fin), seaK * (1. - fin));
        if (vis < .012) discard;
        vec2 fl = uFlow * uTime;
        float lod = 1. - smoothstep(260., 720., dist);
        vec3 n1 = frbN(p * .085 + fl * .3), n2 = frbN(p * .29 - fl * .45 + 3.1), n3 = frbN(p * .9 + fl * .9 + 1.7);
        vec2 sl = (n1.rg - .5) * .34 + ((n2.gb - .5) * .26 + (n3.rb - .5) * .2) * lod;
        vec3 N = vec3(-sl.x, 1., -sl.y); N = N / max(length(N), 1e-4);
        float nv = max(dot(N, V), 0.), om = 1. - nv, fres = .025 + .975 * om * om * om * om * om;
        float ruf = smoothstep(.36, .72, paw);
        float lightK = mix(.22, 1., open) * (1. - cin);                         // under the fog: no sun, a dim sky
        vec3 refl = mix(uSkyRef * mix(.3, 1., open), frbFogColor() * .7, cin);  // from inside the fog the water mirrors the fog
        vec3 col = mix(uDeep * (.7 + .6 * n1.b), refl, clamp(fres * (.4 + .8 * ruf) + .04 * ruf, 0., 1.));
        vec3 Hv = V + uSunDir; Hv = Hv / max(length(Hv), 1e-4);
        float nh = max(dot(N, Hv), 0.), nh2 = nh * nh, nh8 = nh2 * nh2 * nh2 * nh2, nh32 = nh8 * nh8 * nh8 * nh8;
        float sunK = max(dot(vec3(-V.x, V.y, -V.z), uSunDir), 0.); sunK *= sunK; sunK *= sunK;
        float tw = frbN(p * .55 + fl * 1.1).g * frbN(p * 1.3 - fl * 1.7 + 5.5).r;
        float glint = smoothstep(.47, .6, tw) * (.3 + .7 * ruf) * lod;
        col += uSunL * ((glint * (.34 + 2.8 * sunK) + nh32 * nh32 * 1.6 + nh8 * .05 * ruf) * lightK);      // the specks gather into a path under the sun and thin out elsewhere
        float foam = 0.;
        for (int i = 0; i < 5; i++) {
          vec2 r = p - uBoat[i].xy, d = uBoat[i].zw;
          float al = -dot(r, d), la = dot(r, vec2(-d.y, d.x)), w0 = max(uBoatD[i].x, .5);
          float w = w0 + max(al, 0.) * .14, t = (abs(la) - w * 1.3) / (w * .3 + .8);
          float f = smoothstep(-w0 * 2., w0, al) * exp(-max(al, 0.) / max(uBoatD[i].y, 1.)) * uBoatD[i].z;
          foam = max(foam, (.9 * exp(-la * la / (w * w * .45)) + .75 * exp(-t * t)) * f);
        }
        float fnz = frbN(p * .21 - fl * .2 + 8.8).b * .55 + n3.g * .45;
        col = mix(col, uFoam, smoothstep(.22, .8, foam * (.5 + 1.0 * fnz)));
        { vec2 pg = (p - uPG.xy) / max(uPG.z, 1.); col += uPGc * (uPG.w * 1.3 * exp(-dot(pg, pg)) * (.3 + .9 * n1.r)); }
        col = mix(col, mix(uFogShade, uFogLit, .3), .42 * (1. - open) * (1. - cin));      // under the river the water lies in a blue shade of mist
        col = mix(col, frbFogColor(), cin * fin);
        gl_FragColor = vec4(col, vis);
        #include <fog_fragment>
      }`,
  });
}

// a small vessel's hull into an accumulator: bow toward -Z, waterline y = 0 (length, beam, freeboard; drawn double-sided)
function hullInto(B, L, bm, fb, hullC, deckC, ox = 0, oz = 0) {
  const st = [-0.5, -0.36, -0.12, 0.3, 0.46, 0.5], hb = [0.04, 0.34, 0.5, 0.5, 0.42, 0.3];
  for (let i = 0; i < 5; i++) {
    const z0 = oz + st[i] * L, z1 = oz + st[i + 1] * L, b0 = hb[i] * bm, b1 = hb[i + 1] * bm;
    for (const s of [-1, 1]) B.quad([ox + s * b0 * 0.8, -0.8, z0], [ox + s * b1 * 0.8, -0.8, z1], [ox + s * b1, fb, z1], [ox + s * b0, fb, z0], hullC, 0);
    B.quad([ox - b0, fb, z0], [ox - b1, fb, z1], [ox + b1, fb, z1], [ox + b0, fb, z0], deckC, 0);
  }
  B.quad([ox - hb[5] * bm, fb, oz + 0.5 * L], [ox + hb[5] * bm, fb, oz + 0.5 * L], [ox + hb[5] * bm * 0.8, -0.8, oz + 0.5 * L], [ox - hb[5] * bm * 0.8, -0.8, oz + 0.5 * L], hullC, 0);
}
// a white harbour ferry (46 m): two decks of windows, a wheelhouse, a buff funnel, a mast light
function ferryGeometry() {
  const B = new Acc(), white = LIN('#e9e5da'), deck = LIN('#9c988c'), navy = LIN('#1f3552'), buff = LIN('#c9a35a'), roof = LIN('#b9b5aa');
  hullInto(B, 46, 11, 3.0, navy, deck);
  B.box(0, 3.0, 1, 9.6, 2.7, 31, 0, white, 0.8, roof); B.box(0, 5.7, 0.5, 8.4, 2.5, 23, 0, white, 0.8, roof);
  B.box(0, 8.2, -6.5, 6.2, 2.3, 5.6, 0, white, 0.9, roof); B.box(0, 8.2, 4.5, 2.6, 4.4, 3.6, 0, buff, 0, LIN('#20242a'));
  B.beam([0, 10.5, -6.5], [0, 15.5, -6.5], 0.35, white, 0); B.box(0, 15.5, -6.5, 0.6, 0.6, 0.6, 0, [1, 0.85, 0.6], 2.6);
  for (const s of [-1, 1]) B.box(s * 4.2, 5.7, 14, 1.4, 1.0, 5.2, 0, LIN('#d8742a'), 0);      // lifeboats
  return B.toGeometry();
}
// a black harbour tug with a buff house, towing a sand barge on a short line (the barge 46 m astern, in the same mesh)
function tugGeometry(barge) {
  const B = new Acc(), black = LIN('#1c2126'), deck = LIN('#6a6258'), buff = LIN('#d6c59c'), rust = LIN('#7a4a36'), sand = LIN('#cdb98a'), roof = LIN('#8f8a80');
  hullInto(B, 25, 8.4, 2.3, black, deck);
  B.box(0, 2.3, -1.5, 5.6, 2.6, 9, 0, buff, 0.8, roof); B.box(0, 4.9, -3, 4.2, 2.4, 4.4, 0, buff, 0.9, roof);
  B.box(0, 4.9, 1.6, 1.8, 3.6, 2.2, 0, black, 0); B.beam([0, 7.3, -3], [0, 11, -3], 0.3, buff, 0); B.box(0, 11, -3, 0.5, 0.5, 0.5, 0, [1, 0.85, 0.6], 2.6);
  if (barge) {
    hullInto(B, 44, 13, 2.0, rust, deck, 0, 48);
    for (let k = 0; k < 4; k++) { const z = 34 + k * 9.4; B.quad([-5, 2, z - 4.2], [5, 2, z - 4.2], [0.5, 5.2 - 0.4 * (k % 2), z], [-0.5, 5.2 - 0.4 * (k % 2), z], sand, 0); B.quad([-5, 2, z + 4.2], [5, 2, z + 4.2], [0.5, 5.2 - 0.4 * (k % 2), z], [-0.5, 5.2 - 0.4 * (k % 2), z], sand, 0);
      B.tri([-5, 2, z - 4.2], [-5, 2, z + 4.2], [-0.5, 5.2 - 0.4 * (k % 2), z], sand, 0); B.tri([5, 2, z - 4.2], [5, 2, z + 4.2], [0.5, 5.2 - 0.4 * (k % 2), z], sand, 0); }
    B.beam([0, 2.6, 11], [0, 2.4, 27], 0.25, black, 0);      // the tow line
  }
  return B.toGeometry();
}
// six small sailing boats (one mesh): white hulls, a mainsail and a jib each (cloth), scattered round the origin
function sailboatsGeometry(R) {
  const B = new Acc(), white = LIN('#efece4'), sail = LIN('#f6efe0'), sailB = LIN('#e6d9c0'), spar = LIN('#7a6348'), deck = LIN('#b0a48c');
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + R.range(-0.4, 0.4), r = R.range(18, 62), ox = Math.cos(a) * r * 1.5, oz = Math.sin(a) * r * 0.7, L = R.range(9, 13), h = L * 1.25, lean = R.range(0.6, 1.6);
    hullInto(B, L, L * 0.3, 0.9, white, deck, ox, oz);
    B.beam([ox, 0.9, oz - L * 0.1], [ox + lean, h, oz - L * 0.1], 0.22, spar, 0);
    B.triW([ox, 1.6, oz - L * 0.08], [ox + lean * 0.9, h * 0.94, oz - L * 0.09], [ox + 0.5, 1.9, oz + L * 0.42], k % 2 ? sail : sailB, [0, 0, 0.3]);
    B.triW([ox, 1.4, oz - L * 0.47], [ox + lean * 0.8, h * 0.8, oz - L * 0.12], [ox + 0.4, 1.5, oz - L * 0.14], k % 2 ? sailB : sail, [0, 0.1, 0.25]);
  }
  return B.toGeometry();
}
// the waterfront in the far rift, into the land accumulator's twin (its own mesh): a pale stone fort on a rock with a lantern
// turret and a flag, a timber pier on piles with three sheds, boats moored along it. Returns the lamp positions.
function waterfrontInto(B, R, cx, cz) {
  const rock = LIN('#4a463f'), wet = LIN('#2c2f31'), stone = LIN('#c9bfa8'), stoneD = LIN('#a89e88'), slate = LIN('#5c5a58'), white = LIN('#ece7da'), timber = LIN('#6e5a44'), flagC = LIN('#e8e2d2');
  const pastel = ['#d9cdb4', '#b9c4c8', '#d2b7a2'].map(LIN), lamps = [];
  const fx0 = cx - 62, fz0 = cz + 12, rot = 0.22;
  B.box(fx0, -1.5, fz0, 96, 3.0, 70, rot, wet, 0); B.box(fx0, -1, fz0, 82, 5.2, 58, rot + 0.1, rock, 0); B.box(fx0 - 6, -1, fz0 + 3, 64, 6.6, 44, rot - 0.12, rock, 0);
  B.box(fx0, 4.2, fz0, 50, 13.5, 38, rot, stone, 0.85, slate);                                            // the fort: three tiers of casemates
  B.box(fx0, 3, fz0, 54, 2.4, 42, rot, stoneD, 0);                                                        // its battered plinth
  for (const y of [8.75, 13.25]) B.box(fx0, y, fz0, 51.5, 0.6, 39.5, rot, stoneD, 0);                     // a string course between the tiers
  const c = Math.cos(rot), s = Math.sin(rot), at = (lx, lz) => [fx0 + lx * c + lz * s, fz0 - lx * s + lz * c];
  for (const [lx, lz] of [[-25, -19], [25, -19], [25, 19], [-25, 19]]) { const q = at(lx, lz); B.box(q[0], 3, q[1], 9, 16.5, 9, rot, stone, 0, slate); B.box(q[0], 19.5, q[1], 9.8, 0.9, 9.8, rot, stoneD, 0); }      // four corner bastions
  for (const [lx, lz, sx, sz] of [[0, -18.2, 51, 1.6], [0, 18.2, 51, 1.6], [-24.7, 0, 1.6, 38], [24.7, 0, 1.6, 38]]) { const q = at(lx, lz); B.box(q[0], 17.7, q[1], sx, 1.5, sz, rot, stoneD, 0); }      // the parapet
  { const q = at(0, 0); B.box(q[0], 17.7, q[1], 20, 0.5, 11, rot, LIN('#3d3b3a'), 0); }                   // the courtyard's well of shade
  { const q = at(19, -13); B.box(q[0], 17.7, q[1], 5.4, 9, 5.4, rot, white, 0); B.box(q[0], 26.7, q[1], 3.6, 3.2, 3.6, rot, [1, 0.9, 0.7], 2.6, slate); lamps.push([q[0], 28.3, q[1]]); }
  { const q = at(-20, 14); B.beam([q[0], 17.7, q[1]], [q[0], 32, q[1]], 0.35, white, 0);
    B.quadW([q[0], 31.8, q[1]], [q[0], 27.6, q[1]], [q[0] + 0.3, 27.8, q[1] - 7.5], [q[0] + 0.3, 31.6, q[1] - 7.5], flagC, [0, 0, 1.1, 1.1]); }
  // the pier, running toward the bridge
  const px0 = cx - 20, px1 = cx + 62, pz = cz - 8;
  B.box((px0 + px1) / 2, 2.6, pz, px1 - px0, 0.8, 8, 0, timber, 0, LIN('#8a7a62'));
  for (let x = px0 + 4; x < px1; x += 9) for (const dz of [-3.2, 3.2]) B.box(x, -1, pz + dz, 0.9, 3.6, 0.9, 0, LIN('#3a3028'), 0);
  for (let k = 0; k < 3; k++) { const x = px0 + 12 + k * 21; B.box(x, 3.4, pz - 0.6, 15, 5.4, 6.2, 0, pastel[k], 0.85, slate); B.box(x, 8.8, pz - 0.6, 15.6, 1.2, 3.2, 0, slate, 0); }
  for (let x = px0 + 3; x <= px1; x += 15.5) { B.beam([x, 3.4, pz + 3.6], [x, 8.4, pz + 3.6], 0.2, slate, 0); B.box(x, 8.4, pz + 3.6, 0.7, 0.7, 0.7, 0, [1, 0.8, 0.5], 2.4); lamps.push([x, 9, pz + 3.6]); }
  for (let k = 0; k < 6; k++) {
    const L = R.range(9, 15), x = px0 + 8 + k * 12 + R.range(-2, 2), z = pz + (k % 3 === 2 ? -1 : 1) * (5.5 + L * 0.5);
    hullInto(B, L, L * 0.3, 1.0, k % 2 ? white : LIN('#27405a'), LIN('#b0a48c'), x, z);
    if (k % 2 === 0) B.beam([x, 1, z], [x, 9 + L * 0.3, z], 0.2, timber, 0);
  }
  return lamps;
}

// ---------- brown pelicans ----------
// model space: nose toward -Z, wings along +-X, +Y up. aW = (signed span position in m, flap weight 0..1)
function pelicanGeometry() {
  const P = [], N = [], C = [], W = [];
  const BROWN = LIN('#8f7a64'), DARK = LIN('#5a4c40'), SILVER = LIN('#c2b6a4'), BELLY = LIN('#6a584a'), HEAD = LIN('#f0e4c2'), NAPE = LIN('#8a5230'), BILL = LIN('#cdb98c'), POUCH = LIN('#6a5a4c');
  const tri = (a, b, c, col, wa = [0, 0], wb = wa, wc = wa) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const ws = [wa, wb, wc]; let k = 0;
    for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); C.push(col[0], col[1], col[2]); W.push(ws[k][0], ws[k][1]); k++; }
  };
  const quad = (a, b, c, d, col, wa, wb, wc, wd) => { tri(a, b, c, col, wa, wb, wc); tri(a, c, d, col, wa, wc, wd); };
  // body: a loft of six-sided rings from the tail to the folded neck
  const rings = [[0.52, 0.0, 0.03, 0.02], [0.34, 0.0, 0.1, 0.07], [0.1, -0.01, 0.17, 0.14], [-0.14, 0.0, 0.175, 0.15], [-0.3, 0.07, 0.125, 0.125], [-0.38, 0.17, 0.085, 0.095], [-0.47, 0.2, 0.035, 0.045]];
  const ring = (r) => { const o = []; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; o.push([Math.cos(a) * r[2], r[1] + Math.sin(a) * r[3], r[0]]); } return o; };
  for (let i = 0; i < rings.length - 1; i++) {
    const A = ring(rings[i]), B = ring(rings[i + 1]);
    for (let k = 0; k < 6; k++) {
      const j = (k + 1) % 6, top = k < 3, col = i >= 4 ? (top ? HEAD : NAPE) : (top ? BROWN : BELLY);
      quad(A[k], A[j], B[j], B[k], col);
    }
  }
  // the long bill, carried low, with the dark pouch under it
  const b0 = [0, 0.185, -0.44], b1 = [0, 0.03, -0.9];
  quad([-0.04, b0[1] + 0.022, b0[2]], [0.04, b0[1] + 0.022, b0[2]], [0.018, b1[1] + 0.01, b1[2]], [-0.018, b1[1] + 0.01, b1[2]], BILL);
  quad([-0.028, b0[1] + 0.022, b0[2]], [-0.012, b1[1] + 0.01, b1[2]], [0, b1[1] - 0.012, b1[2]], [0, b0[1] - 0.07, b0[2] - 0.04], POUCH);
  quad([0.028, b0[1] + 0.022, b0[2]], [0, b0[1] - 0.07, b0[2] - 0.04], [0, b1[1] - 0.012, b1[2]], [0.012, b1[1] + 0.01, b1[2]], POUCH);
  // tail fan
  tri([-0.09, 0.0, 0.42], [0.09, 0.0, 0.42], [0, 0.0, 0.7], DARK); tri([-0.09, 0.0, 0.42], [0, 0.0, 0.7], [-0.19, 0.005, 0.64], DARK); tri([0.09, 0.0, 0.42], [0.19, 0.005, 0.64], [0, 0.0, 0.7], DARK);
  // wings: five stations, leading panel (silvery coverts) and trailing panel (dark flight feathers)
  const st = [[0.1, 0.07, -0.22, 0.24], [0.45, 0.26, -0.3, 0.22], [0.86, 0.2, -0.27, 0.2], [1.17, 0.1, -0.13, 0.19], [1.34, 0.0, 0.02, 0.13]];
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    const a = st[i], b = st[i + 1], wa = [s * a[0], a[0] / 1.34], wb = [s * b[0], b[0] / 1.34];
    const midA = (a[2] + a[3]) / 2 - 0.03, midB = (b[2] + b[3]) / 2 - 0.03;
    const la = [s * a[0], a[1], a[2]], lb = [s * b[0], b[1], b[2]], ma = [s * a[0], a[1] + 0.035, midA], mb = [s * b[0], b[1] + 0.035, midB], ta = [s * a[0], a[1] - 0.02, a[3]], tb = [s * b[0], b[1] - 0.02, b[3]];
    if (s > 0) { quad(la, ma, mb, lb, SILVER, wa, wa, wb, wb); quad(ma, ta, tb, mb, i === 3 ? DARK : BROWN, wa, wa, wb, wb); }
    else { quad(lb, mb, ma, la, SILVER, wb, wb, wa, wa); quad(mb, tb, ta, ma, i === 3 ? DARK : BROWN, wb, wb, wa, wa); }
  }
  // slotted primaries: four dark fingers past each wingtip, drooping
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    const z0 = -0.02 + k * 0.045, tipx = 1.34 + 0.24 - 0.035 * k, tipz = 0.02 + k * 0.085, wa = [s * 1.3, 0.97], wb = [s * tipx, 1.12];
    const a = [s * 1.3, 0.02, z0 - 0.02], b = [s * 1.3, 0.02, z0 + 0.03], c = [s * tipx, -0.07 - 0.012 * k, tipz];
    if (s > 0) tri(a, b, c, DARK, wa, wa, wb); else tri(b, a, c, DARK, wa, wa, wb);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 2));
  return g;
}

function makePelicanMat(U, LU) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...fogShare(U), ...LU }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec2 aW; attribute vec2 aI;      // aI: phase, flap gain
      uniform float uTime;
      varying vec3 vWp; varying vec3 vN; varying vec3 vCol;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position; float a = abs(aW.x);
        float cyc = fract(uTime * .1 + aI.x);
        float env = smoothstep(0., .06, cyc) * (1. - smoothstep(.3, .42, cyc)) * aI.y;
        float ph = uTime * 9.4 + aI.x * 40.;
        float th = .03 + env * .38 * sin(ph - a * 1.2) - env * .05;
        p.y += a * th - a * a * (.035 + .04 * env * cos(ph - a));
        p.x *= 1. - .1 * env * abs(sin(ph));
        mat4 im = mat4(1.);
        #ifdef USE_INSTANCING
        im = instanceMatrix;
        #endif
        vec4 wp = modelMatrix * (im * vec4(p, 1.));
        vWp = wp.xyz; vN = mat3(modelMatrix) * (mat3(im) * (normal + vec3(-sign(aW.x) * th * step(.01, a), 0., 0.))); vCol = color;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vWp; varying vec3 vN; varying vec3 vCol;
      uniform vec3 uSunDir; uniform vec3 uSunL; uniform vec3 uSkyL; uniform vec3 uGroundL;
      ${FOG_GLSL}
      #include <fog_pars_fragment>
      void main() {
        vec3 n = vN / max(length(vN), 1e-4);
        if (!gl_FrontFacing) n = -n;
        float d = dot(n, uSunDir);
        vec3 col = vCol * (uSunL * (max(d, 0.) * .85 + .12 * (d * .5 + .5)) + mix(uGroundL, uSkyL, n.y * .5 + .5) * 1.15);
        col = frbSlab(col, vWp);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// the line's shadows on the fog top: flat bird-shaped blots, one instance per bird (aA = strength)
function makeShadowMat(LU) {
  return new THREE.ShaderMaterial({
    uniforms: { uShadeCol: LU.uShadeCol }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aA; varying vec2 vP; varying vec2 vA;      // strength, softness
      void main() {
        vP = position.xz; vA = aA;
        mat4 im = mat4(1.);
        #ifdef USE_INSTANCING
        im = instanceMatrix;
        #endif
        gl_Position = projectionMatrix * (viewMatrix * (modelMatrix * (im * vec4(position, 1.))));
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vP; varying vec2 vA; uniform vec3 uShadeCol;
      void main() {
        float ax = abs(vP.x);
        float wing = (1. - smoothstep(.06, .2, abs(vP.y + .16 - .3 * ax * (1. - ax)) - .1 * (1. - ax * ax))) * (1. - smoothstep(.7, .98, ax));
        float body = exp(-(vP.x * vP.x * 46. + vP.y * vP.y * 7.));
        float blot = exp(-(vP.x * vP.x * 3.2 + vP.y * vP.y * 9.));                 // from high up the shadow is a soft bar
        float a = clamp(mix(max(wing, body), blot, vA.y), 0., 1.) * vA.x * (1. - smoothstep(.8, 1., max(abs(vP.x), abs(vP.y))));
        gl_FragColor = vec4(uShadeCol, a);
      }`,
  });
}

// the view from inside the fog: a luminous gradient with slow wisps, in place of the sky and the sheet
function makeInFogDome(DU) {
  const mat = new THREE.ShaderMaterial({
    uniforms: DU, side: THREE.BackSide, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = position; vec4 p = projectionMatrix * (viewMatrix * (modelMatrix * vec4(position, 1.))); gl_Position = p; }`,
    fragmentShader: /* glsl */`
      varying vec3 vDir;
      uniform vec3 uTopC; uniform vec3 uMidC; uniform vec3 uLowC; uniform vec3 uGlowC; uniform vec3 uSunDir; uniform vec3 uDrift; uniform float uImm;
      ${fx.GLSL_HASH}
      ${fx.GLSL_VALUE_NOISE}
      void main() {
        vec3 d = vDir / max(length(vDir), 1e-4);
        vec3 col = mix(uMidC, uTopC, smoothstep(-.05, .8, d.y));
        col = mix(col, uLowC, smoothstep(.12, .9, -d.y));
        float w = vnoise(d * 2.6 + uDrift) * .6 + vnoise(d * 6.1 + uDrift * 2.3) * .4;
        float w2 = vnoise(vec3(d.x * 1.1, d.y * 2.4, d.z * 1.1) + uDrift * .55);           // broad bands of thicker and thinner fog streaming past
        float w3 = vnoise(vec3(d.x * 2.3, d.y * 7.5, d.z * 2.3) + uDrift * 1.1);                                // thin layers sliding past
        col *= (.86 + .28 * w) * (.6 + .8 * smoothstep(.3, .7, w2)) * (.9 + .22 * smoothstep(.3, .75, w3));
        float s = max(dot(d, uSunDir), 0.), s2 = s * s, s8 = s2 * s2 * s2 * s2;
        col += uGlowC * (s2 * s * .5 + s8 * .9);
        col += uTopC * .16 * smoothstep(.0, .9, d.y) * (.6 + .4 * w2);                     // the sunlit top of the fog glowing through from above
        gl_FragColor = vec4(col, uImm);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(4200, 24, 14), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -2;
  return mesh;
}

// the kit sky's 256x256 noise texture, made here by the same generator and with the same settings as makeSkyNoise() in
// src/kit/sky.js but in steps that hand the frame back, and passed to makeSky as noiseTexture: the same sky, a shorter call
async function skyNoiseSteps(ctx) {
  const S = 256, d = new Uint8Array(S * S * 4); let a = 0x2545f491;
  const r = () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) & 255; };
  for (let y = 0; y < S; y++) { for (let i = y * S, e = i + S; i < e; i++) { d[i * 4] = r(); d[i * 4 + 2] = r(); d[i * 4 + 3] = 255; } if (y % 32 === 31) await ctx.yield(); }
  for (let y = 0; y < S; y++) { for (let x = 0; x < S; x++) d[(y * S + x) * 4 + 1] = d[(((y + 17) & 255) * S + ((x + 37) & 255)) * 4]; if (y % 32 === 31) await ctx.yield(); }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

export default {
  id: 'fog-river-bridge',
  name: 'The Bridge in the Fog River',
  category: 'city',
  media: ['air'],
  weirdness: 0.05,
  async build(ctx) {
    return buildWorld(ctx);
  },
};

// the world itself, called by build() above (a function expression in parentheses: the browser compiles it while it loads
// the file, not at the first call)
const buildWorld = (async function buildWorld(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.6, 1.4), mood = vary.mood ?? 0.5, rare = !!vary.rare, duration = 50;
    // ---- what this visit is: every draw up front, in a fixed order
    const lookPick = rng(), winterPick = rng(), fogPick = rng(), sunAzPick = rng(), sunElPick = rng(), fallsPick = rng();
    const rj = [rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)];
    const Rland = rng.fork('land'), Rbird = rng.fork('birds'), Rfx = rng.fork('fx'), Rship = rng.fork('barque'), Rfall = rng.fork('fall');
    const hr = vary.hour || 'any';
    const lookId = hr === 'night' ? 'night' : hr === 'dawn' ? 'dawn' : hr === 'golden' ? 'golden' : hr === 'day' ? 'morning'
      : (lookPick < 0.4 ? 'morning' : lookPick < 0.64 ? 'dawn' : lookPick < 0.88 ? 'golden' : 'night');
    const look = LOOKS[lookId], night = lookId === 'night', winter = winterPick < 0.25;
    const fogTop = lerp(77, 89, fogPick), fogAmp = lerp(8.5, 12.5, mood);
    // the sun stands to the left and only a little behind: the tower faces toward us take raking light, the far flanks cool shade
    // (bearing 156-162: to the left and behind, so the towers', cables' and suspenders' long shadows and our own line's lie
    // across the fog ahead and to the right, inside the frame, while the heads still show a lit and a shaded side)
    const sunAz = lerp(156, 162, sunAzPick), sunEl = lerp(look.sunEl[0], look.sunEl[1], sunElPick);

    // ---- sky, light, haze
    const scene = new THREE.Scene();
    const skyOpts = { rng, ...look.sky, lightColor: look.sunCol, lightIntensity: look.sunI, ambientColor: look.hemiSky, groundLight: look.hemiGround, ambientIntensity: look.hemiI, renderer: ctx.renderer };
    if (night) skyOpts.bodyOverrides = { 0: { elevation: sunEl, azimuth: sunAz } }; else { skyOpts.sunElevation = sunEl; skyOpts.sunAzimuth = sunAz; }
    await ctx.yield();
    skyOpts.noiseTexture = await skyNoiseSteps(ctx);
    await ctx.yield();
    const sky = makeSky(skyOpts); scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(new THREE.Color(look.haze), look.hazeD);
    const rig = makeLightRig(sky, { bounce: 0.3 }); scene.add(rig.object);
    const SUN = sky.lightDirection.clone().normalize();
    await ctx.yield();

    // ---- the bridge in its fog river
    // under the low warm suns the full vermilion clips to one hot fill on near steel: a slightly greyed paint keeps the plates and flutes
    const warmLook = lookId === 'dawn' || lookId === 'golden';
    const hero = await buildHero(ctx, { hour: look.hour, season: winter ? 'winter' : 'summer', fogTop, fogAmp, sunDir: [SUN.x, SUN.y, SUN.z], ships: 2,
      palette: [warmLook ? '#ba5c3d' : '#cb552d', '#f6f1e8', '#8da2c6', '#b3ada0', '#1c2530', '#ffb24a', '#ff3b28'] });
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    const sunC = new THREE.Color(look.sunCol), skyC = new THREE.Color(look.hemiSky), gndC = new THREE.Color(look.hemiGround);
    hero.setLight({ sunDir: SUN, sun: night ? sunC.clone().multiplyScalar(0.3) : sunC, sky: night ? skyC.clone().multiplyScalar(0.35) : skyC, fogLit: look.fogLit, fogShade: look.fogShade });
    HU.uShadeK.value = look.shadeK; HU.uRelief.value = look.relief;
    HU.uFg2.value.z = 0.022;                               // thinner inside, so the ship and the tower loom from further off
    HU.uFg.value.z = Math.min(HU.uFg.value.z, 26);         // the valley floor keeps its billows (hero), so it lies a little lower: the under-deck pass stays in clear air
    const gapThr = HU.uFg2.value.x; HU.uFg2.value.x = 2;   // no chance gaps round the blind start; they open as we fly (update)
    if (!night) HU.uLamps.value.x *= 0.7;
    const lampZ0 = HU.uLamps.value.z, lampX0 = HU.uLamps.value.x, lampY0 = HU.uLamps.value.y;
    if (!rare) HU.uShipDip.value = 31;                       // she lies in the valley floor, not under a mound of it: her upper tiers, bridge wings, wheelhouse, funnel and mast stand out of the fog and the tops of her tallest stacks show through it (the hero fades them into it)
    if (rare && hero.ships[0]) { hero.ships[0].visible = false; HU.uShipDip.value = 27; }      // the barque takes its place (and keeps its wake); the fog stands lower round her, at her upper topsails
    await ctx.yield();

    // light for the world's own shaders (Lambert under the same lights: colour x intensity / pi)
    const T = { value: 0 }, IPI = 1 / Math.PI;
    const LU = {
      uTime: T, uSunDir: { value: SUN.clone() },
      uSunL: { value: sunC.clone().multiplyScalar(look.sunI * IPI) }, uSkyL: { value: skyC.clone().multiplyScalar(look.hemiI * IPI) },
      uGroundL: { value: gndC.clone().multiplyScalar(look.hemiI * IPI) }, uWarmL: { value: new THREE.Color('#ffb060').multiplyScalar(0.95) },
      uLamp: { value: look.glow }, uShadeCol: { value: new THREE.Color(look.fogShade).multiplyScalar(0.3) },
    };

    // ---- the route (hero space is world space)
    // Climb in a right-hand turn to the first tower and fly THROUGH it, between its legs under the top strut; down inside
    // the bridge, about ten metres below the two cables (they run out to the upper corners of the frame, both curtains of
    // suspenders wall the view, the far tower dead ahead and the roadway below); out over the +Z cable where it comes down
    // toward the deck; a dive to the painters' cradle; on beside the truss and below its bottom chord, nine metres out
    // (the truss a diagonal across the upper right, the sun raking in under it, never a roof over the eye) as the ship
    // comes through; out round her stern (funnel, mast and wheelhouse standing in the valley, her steam blowing away
    // from us); a pull-up over the cable and down the roadway.
    // the portal is an arch 18.5 m wide and 25 m tall that fills the bay between the legs of the second tower from 3.4 m
    // over the road: the tower itself is the gate, and the eye comes down to 16 m over the road for it
    const cradleX = A.cradle.x, pY = deckY(-640) + 3.4 + 12.5, SX = -190, dkC = deckY(cradleX);
    const yT = hero.look.style === 0 ? 205.5 : 198;        // the middle of the towers' upper opening (the corbels under the top strut reach down to 211 / 209)
    const path = makePath([
      [912, 46, 318], [871, 56, 271], [800, 122, 150], [790, 162, 84], [764, 192, 36], [722, yT - 2, 10], [682, yT, 2], [640, yT, 0],
      [585, cableY(585) - 9, 0], [512, cableY(512) - 10, 0], [420, cableY(420) - 10, 5.5], [340, cableY(340) - 6, 4], [220, cableY(220) + 8, 15], [140, 80, 36],
      [cradleX + 32, 64.5, 25.5], [cradleX - 10, dkC - 8, 26], [cradleX - 45, dkC - 12, 25], [cradleX - 88, dkC - 12.5, 25], [SX + 70, dkC - 12, 30], [SX + 6, 62, 53], [-252, 96, 31],
      [-312, 117.5, 14], [-378, 111, 3], [-450, 97, 1], [-535, pY + 1.2, 0], [-640, pY, 0]]);
    const Ltot = path.length;
    // the fog valley: open from where the route drops under the deck to beyond the ship, so her mast and funnel stand in it
    const shipX = SX, gx0 = cradleX + 25, gx1 = Math.min(shipX - 30, -150);
    const gap = { x: -20, z: 30, r: 420 };                 // open from where we come out over the cable (x 250) to beyond the pull-up

    // ---- the far world: a headland with its fog-fall ridge, a wooded island, city hills, a second bridge
    const farMat = makeFarMat(HU, LU);
    const mkRidge = (ax, az, bx, bz, h, wl, ww, sT, sD, sW, seed) => {
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
      return { ax, az, dx, dz, L2: L * L, nx: -dz / L, nz: dx / L, tx: dx / L, tz: dz / L, L, h, wl, ww, sT, sD, sW, seed };
    };
    // lee normal (nx, nz) of the first ridge points toward +X and -Z: its fog-fall faces the bridge
    const ridges = [
      mkRidge(-1260 + rj[0] * 40, 1010 + rj[1] * 70, -2380 + rj[2] * 80, 170 + rj[3] * 90, 318, 470, 760, 0.47 + rj[4] * 0.05, 92, 0.15, 3.1),
      mkRidge(-1650, 2250, -3500, 700, 420, 620, 900, 0.3, 60, 0.2, 7.7),
      mkRidge(-1380, -900, -2900, -1750 + rj[5] * 120, 215, 420, 520, 0.6, 40, 0.2, 11.3),
      mkRidge(-2500, -500, -4200, -900, 330, 600, 700, 0.5, 30, 0.3, 17.9),
    ];
    const crestOf = (R, tt) => R.h * (0.84 + 0.3 * noise.fbm2(tt * 2.3 + R.seed, R.seed * 1.7, 3)) - R.sD * Math.exp(-((tt - R.sT) / R.sW) * ((tt - R.sT) / R.sW));
    const ridgeAt = (R, x, z) => {
      const tt = ((x - R.ax) * R.dx + (z - R.az) * R.dz) / R.L2, tc = clamp(tt, 0, 1);
      const px = R.ax + R.dx * tc, pz = R.az + R.dz * tc, rad = Math.hypot(x - px, z - pz);
      const d = (x - px) * R.nx + (z - pz) * R.nz, w = d > 0 ? R.wl : R.ww, q = rad / w;
      return crestOf(R, tc) * Math.exp(-q * q * 1.15) * (1 - 0.5 * smoothstep(0, 0.2, Math.abs(tt - tc)));
    };
    const landBase = (x, z) => {
      let h = 0, sum = 0;
      for (let i = 0; i < ridges.length; i++) { const v = ridgeAt(ridges[i], x, z); if (v > h) h = v; sum += v; }
      return h + (sum - h) * 0.3;
    };
    const landH = (x, z) => {
      let h = landBase(x, z);
      const k = smoothstep(40, 190, h);
      h += (noise.ridged2(x / 330, z / 330, 3) - 0.42) * 44 * k + noise.fbm2(x / 130 + 9, z / 130, 2) * 9 * k;
      h += (noise.ridged2(x / 118 + 7, z / 118 + 3, 2) - 0.5) * 26 * k - Math.abs(noise.n2(x / 210 + 5, z / 210)) * 16 * k;      // gullies cut into the slopes, knuckles on the skyline
      return lerp(-30, h, smoothstep(-1110, -1330, x)) - 22;
    };
    const landSm = (x, z) => lerp(-30, landBase(x, z), smoothstep(-1110, -1330, x)) - 22;      // the same land without its roughness
    const cGold = LIN(winter ? '#7c8448' : '#a8935a'), cGreen = LIN(winter ? '#4f6a34' : '#66713c'), cScrub = LIN('#2f3a26'), cRock = LIN('#8c7f6d'), cTree = LIN('#2a3a24');
    const landCol = (x, z, h, ny, lap, out) => {
      const g = clamp(0.5 + 0.9 * noise.fbm2(x / 520 + 31, z / 520, 3), 0, 1), sc = clamp(lap * 0.09 + 0.25 + 0.5 * noise.fbm2(x / 170, z / 170 + 5, 2), 0, 1);
      const rk = 1 - smoothstep(0.62, 0.8, ny), ao = clamp(1 - lap * 0.035, 0.62, 1.12);
      for (let c = 0; c < 3; c++) out[c] = lerp(lerp(lerp(cGold[c], cGreen[c], g), cScrub[c], sc * 0.8), cRock[c], rk) * ao;
      return out;
    };
    const land = new Acc(), keepY = fogTop - 26;
    {
      const NX = 84, NZ = 140, xs = new Float32Array(NX + 1), zs = new Float32Array(NZ + 1), H = new Float32Array((NX + 1) * (NZ + 1)), col = [0, 0, 0];
      for (let i = 0; i <= NX; i++) xs[i] = -1100 - (i * 25 + i * i * 0.13);
      for (let j = 0; j <= NZ; j++) { const k = j - NZ / 2; zs[j] = 300 + Math.sign(k) * (Math.abs(k) * 29 + k * k * 0.23); }
      for (let j = 0; j <= NZ; j++) { for (let i = 0; i <= NX; i++) H[j * (NX + 1) + i] = landH(xs[i], zs[j]); await ctx.yield(); }
      const at = (i, j) => H[clamp(j, 0, NZ) * (NX + 1) + clamp(i, 0, NX)];
      for (let j = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++) {
          const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, NX), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, NZ), h = at(i, j);
          const sx = (at(i1, j) - at(i0, j)) / (xs[i1] - xs[i0]), sz = (at(i, j1) - at(i, j0)) / (zs[j1] - zs[j0]), l = Math.hypot(sx, 1, sz);
          const lap = (at(i0, j) + at(i1, j) + at(i, j0) + at(i, j1)) * 0.25 - h;
          landCol(xs[i], zs[j], h, 1 / l, lap, col);
          land.v(xs[i], h, zs[j], -sx / l, 1 / l, -sz / l, col, 0);
        }
        await ctx.yield();
      }
      for (let j = 0; j < NZ; j++) {
        for (let i = 0; i < NX; i++) {
          const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
          if (Math.max(H[a], H[b], H[c], H[d]) < keepY) continue;
          land.I.push(a, b, c, b, d, c);          // x decreases with i and z grows with j: this winding faces up
        }
        if (j % 20 === 19) await ctx.yield();
      }
      await ctx.yield();
    }
    // islands in the white: a wooded island and two city hills (radial bells with a little roughness)
    const isles = [
      { x: -1320 + rj[1] * 90, z: -2150 + rj[2] * 120, r: 620, h: 250, city: 0 },
      { x: 560 + rj[3] * 120, z: -3350 + rj[4] * 150, r: 980, h: 205, city: 1 },
      { x: 1620 + rj[5] * 100, z: -2650 + rj[0] * 120, r: 760, h: 230, city: 1 },
      // two that stand close, breaking through the river beside the main span: a craggy lighthouse island on the bay side and
      // a wooded hill with a mast on the sun side (the middle of the flight has land, depth and a scale beside the bridge)
      { x: -340 + rj[2] * 40, z: -620 + rj[4] * 40, r: 320, h: 176, city: 0, near: 1 },
      { x: 170 + rj[0] * 50, z: 770 + rj[3] * 40, r: 410, h: 208, city: 0, near: 2 },
    ];
    const isleH = (I, x, z) => {
      const q = Math.hypot(x - I.x, z - I.z) / I.r; let h = I.h * Math.exp(-q * q * 2.2) * (0.86 + 0.3 * noise.fbm2(x / 260 + I.h, z / 260, 3)) - 14;
      if (I.near) h += ((noise.ridged2(x / 95 + I.h, z / 95, 3) - 0.45) * 30 + noise.fbm2(x / 38, z / 38 + I.h, 2) * 7) * smoothstep(15, 95, h);      // crags and gullies
      return h;
    };
    const nearIsleY = (x, z) => Math.max(isleH(isles[3], x, z), isleH(isles[4], x, z));
    for (const I of isles) {
      const RS = I.near ? 20 : 12, SG = I.near ? 46 : 30, i0 = land.n, col = [0, 0, 0], eI = I.near ? 0.005 : 0;
      for (let r = 0; r <= RS; r++) {
        for (let s = 0; s < SG; s++) {
          const rr = (r / RS) * I.r * 0.92, a = (s / SG) * Math.PI * 2, x = I.x + Math.cos(a) * rr, z = I.z + Math.sin(a) * rr, h = isleH(I, x, z), e = 14;
          const sx = (isleH(I, x + e, z) - h) / e, sz = (isleH(I, x, z + e) - h) / e, l = Math.hypot(sx, 1, sz);
          landCol(x, z, h, 1 / l, 0, col);
          if (I.city) for (let c = 0; c < 3; c++) col[c] = lerp(col[c], 0.3, 0.45);
          land.v(x, h, z, -sx / l, 1 / l, -sz / l, col, eI);
        }
        await ctx.yield();
      }
      for (let r = 0; r < RS; r++) for (let s = 0; s < SG; s++) { const a = i0 + r * SG + s, b = i0 + r * SG + (s + 1) % SG, c = a + SG, d = b + SG; land.I.push(a, b, c, b, d, c); }
      await ctx.yield();
    }
    // cypress and eucalyptus on the ridges and the island: dark four-sided spires, thinned by quality
    {
      const want = Math.round(1500 * detail), tree = (x, h, z, R = Rland, e = 0) => {
        const th = R.range(13, 25), w = th * R.range(0.16, 0.24), k = R.range(0.75, 1.25), c = [cTree[0] * k, cTree[1] * k * 1.05, cTree[2] * k], top = [x + R.range(-1, 1), h + th, z + R.range(-1, 1)];
        const b = [[x - w, h - 1.5, z - w], [x + w, h - 1.5, z - w], [x + w, h - 1.5, z + w], [x - w, h - 1.5, z + w]];
        for (let q = 0; q < 4; q++) land.tri(b[(q + 1) % 4], b[q], top, c, e);
      };
      var treeAt = tree;
      let made = 0;
      for (let k = 0; k < want * 6 && made < want; k++) {
        const x = Rland.range(-3600, -1200), z = Rland.range(-2300, 2700), m = noise.fbm2(x / 260 + 4, z / 260 + 2, 2);
        if (k % 25 === 24) await ctx.yield();
        if (m < 0.08) continue;
        const h = landH(x, z); if (h < fogTop + 10) continue;
        tree(x, h, z); made++;
      }
      const I = isles[0];
      for (let k = 0; k < Math.round(420 * detail); k++) {
        const a = Rland.range(0, 6.283), r = I.r * 0.55 * Math.sqrt(Rland()), x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r, h = isleH(I, x, z);
        if (h > fogTop + 6 && noise.fbm2(x / 200, z / 200 + 8, 2) > -0.15) tree(x, h, z);
        if (k % 50 === 49) await ctx.yield();
      }
      await ctx.yield();
    }
    // the city: low pastel blocks on the hilltops, downtown towers standing straight out of the white
    const cityGlows = [];
    {
      const pastel = ['#e6dfd2', '#d6ccbc', '#c6d0d6', '#e0c7b6', '#ccd6c2', '#eee8de', '#d9d2c8'].map(LIN), glass = ['#8c9aa8', '#d4d4ce', '#5a6470', '#a7b4bd', '#c8b8a4'].map(LIN), roof = LIN('#6a6660');
      for (const I of isles) {
        if (!I.city) continue;
        const rot0 = Rland.range(0, 1.5), n = Math.round(170 * density * detail);
        for (let k = 0; k < n; k++) {
          const a = Rland.range(0, 6.283), r = I.r * 0.62 * Math.pow(Rland(), 0.7), x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r, h = isleH(I, x, z);
          const sx = Rland.range(22, 48), sz = Rland.range(22, 48), sy = Rland.range(12, 30) + 22 * Math.max(0, 1 - r / (I.r * 0.3)) * Rland(), c = Rland.pick(pastel), e = Rland.range(0.5, 1);
          if (h < fogTop - 34) continue;
          land.box(x, h - 5, z, sx, sy + 5, sz, rot0 + (Rland.chance(0.5) ? 0 : Math.PI / 2), [c[0] * 0.8, c[1] * 0.8, c[2] * 0.8], e, roof);
          if (k % 40 === 39) await ctx.yield();
        }
        cityGlows.push([I.x, fogTop + 30, I.z]);
        await ctx.yield();
      }
      const D = isles[1], dcx = D.x - D.r * 0.42, dcz = D.z + D.r * 0.3, nT = Math.round(38 * density);
      for (let k = 0; k < nT; k++) {
        const x = dcx + Rland.gauss() * 170, z = dcz + Rland.gauss() * 150, w = Rland.range(30, 54), ht = Rland.range(120, 230) + (k < 4 ? 80 : 0), c = Rland.pick(glass), e = Rland.range(0.7, 1), rot = 0.3 + (Rland.chance(0.5) ? 0 : Math.PI / 2);
        const cc = [c[0] * 0.78, c[1] * 0.78, c[2] * 0.78];
        land.box(x, 10, z, w, ht * 0.72, w * Rland.range(0.7, 1.1), rot, cc, e, roof);
        land.box(x, 10 + ht * 0.72, z, w * 0.74, ht * 0.2, w * 0.7, rot, cc, e, roof);
        land.box(x, 10 + ht * 0.92, z, w * 0.42, ht * 0.1, w * 0.4, rot, cc, e, roof);
        if (k < 6) land.box(x, 10 + ht * 1.02, z, 3, ht * 0.16, 3, rot, cc, 2.2);
      }
      cityGlows.push([dcx, fogTop + 20, dcz]);
      await ctx.yield();
      // the second bridge: three grey towers face-on, receding down the bay
      const steelC = LIN('#aab3bd');
      for (let k = 0; k < 3; k++) {
        const x = 260 - k * 150, z = -5150 - k * 560, ht = 262;
        for (const s of [-1, 1]) land.box(x + s * 30, 0, z, 17, ht, 17, 0, steelC, 0);
        for (const y of [118, 172, 226, 252]) land.box(x, y, z, 60, 11, 12, 0, steelC, 0);
        land.box(x, ht, z, 4, 16, 4, 0, steelC, 2.4);
      }
    }
    await ctx.yield();
    // the near islands' woods, the lighthouse and its keeper's houses, the mast on the hill (their own random stream,
    // forked after every other draw of the land)
    const nearLamps = [];
    {
      const Rn = Rland.fork('near'), white = LIN('#e9e4d8'), roofR = LIN('#8a4a3a'), grey = LIN('#9aa3ad');
      for (const I of [isles[3], isles[4]]) {
        const n = Math.round((I.near === 2 ? 460 : 300) * detail);
        for (let k = 0; k < n; k++) {
          const a = Rn.range(0, 6.283), r = I.r * 0.5 * Math.sqrt(Rn()), x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r, h = isleH(I, x, z);
          if (h > fogTop - 4 && noise.fbm2(x / 120 + 3, z / 120 + I.h, 2) > (I.near === 2 ? -0.3 : 0.02) && Math.hypot(x - I.x, z - I.z) > 26) treeAt(x, h, z, Rn, 0.005);
          if (k % 40 === 39) await ctx.yield();
        }
        const top = isleH(I, I.x, I.z);
        if (I.near === 1) {
          land.box(I.x, top - 4, I.z, 8.5, 12, 8.5, 0.4, white, 0.005, roofR); land.box(I.x, top + 8, I.z, 6.4, 20, 6.4, 0.4, white, 0.005); land.box(I.x, top + 28, I.z, 8, 1, 8, 0.4, grey, 0.005);
          land.box(I.x, top + 29, I.z, 4.4, 4.2, 4.4, 0.4, [1, 0.9, 0.7], 2.6, roofR);
          for (const [dx, dz, w] of [[-17, 6, 13], [14, -11, 11], [20, 9, 9]]) land.box(I.x + dx, isleH(I, I.x + dx, I.z + dz) - 3, I.z + dz, w, 9, w * 0.7, 0.4, white, 0.8, roofR);
          nearLamps.push([I.x, top + 31, I.z]);
        } else {
          land.beam([I.x, top - 3, I.z], [I.x, top + 62, I.z], 2.4, grey, 0.005);
          for (const y of [20, 40, 60]) land.box(I.x, top + y, I.z, 5, 0.8, 5, 0, grey, 0.005);
          land.box(I.x, top + 62, I.z, 1.6, 1.6, 1.6, 0, [1, 0.25, 0.15], 2.6);
          land.box(I.x + 12, isleH(I, I.x + 12, I.z + 5) - 3, I.z + 5, 12, 8, 9, 0.2, white, 0.8, roofR);
          nearLamps.push([I.x, top + 63, I.z]);
        }
        await ctx.yield();
      }
    }
    const landMesh = new THREE.Mesh(await land.toGeometrySteps(ctx), farMat); landMesh.name = 'far-land'; scene.add(landMesh);
    await ctx.yield();

    // ---- the landfall headland: the bridge's far end comes ashore in low ground (the road's col, under the river's top),
    // and the high ground stands to the sun side of that line, never across it: a steep wooded ridge some 1.1 km long, its
    // lee slope facing the bridge, two shoulders either side of a broad saddle 200 m over the river's top (crests at most
    // about 350 m over the water: the towers stay the measure of the place). Behind the far tower, seen from the route up to
    // about its last 100 to 120 m (where the tower's own span is wider than any gap), are sky and fog as before. Land of its own, in front of the first far ridge (which stands as it stood, with its
    // own fall pouring into the trough behind this one): its own mesh, its own woods, its own random stream. The great
    // fog-fall pours through its saddle (below). Its nearest ground above the river lies over 600 m from the route.
    const Rhl = makeRng(hashSeed('landfall:' + ctx.seed));
    const HL = (() => {
      const ax = -1180 + Rhl.range(-24, 24), az = 775 + Rhl.range(-24, 24), bx = -1860 + Rhl.range(-24, 24), bz = 440 + Rhl.range(-16, 24);
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
      return { ax, az, dx, dz, L, L2: L * L, tx: dx / L, tz: dz / L, nx: -dz / L, nz: dx / L, sT: 0.5 + Rhl.range(-0.03, 0.03), sW: 0.29, hE: 322 + Rhl.range(-5, 5), hW: 316 + Rhl.range(-5, 5),
        wl: 330, ww: 380, bow: 55, seed: Rhl.range(0, 40), sY: fogTop + 200 };      // sY: the saddle's floor, 200 m over the river's mean top
    })();
    const hlCrest = (t) => {
      const ends = smoothstep(-0.44, 0.04, t) * (1 - smoothstep(0.94, 1.24, t));                     // both ends run down into the river
      const q = (t - HL.sT) / HL.sW, q2 = q * q;
      return lerp(lerp(HL.hE, HL.hW, smoothstep(0.25, 0.75, t)), HL.sY, Math.exp(-q2 * q2)) * ends;      // two shoulders and a flat-floored saddle some 440 m wide
    };
    const hlPar = (x, z, o) => {      // along the crest line (0..1 between its two ends) and across it (m, positive down the lee)
      const t = ((x - HL.ax) * HL.dx + (z - HL.az) * HL.dz) / HL.L2, g = (t - HL.sT) / 0.5;
      o[0] = t; o[1] = (x - HL.ax) * HL.nx + (z - HL.az) * HL.nz + HL.bow * Math.exp(-g * g);      // (the crest bows back at the saddle: the fall lies in a shallow bowl)
      return o;
    };
    const hlQ = [0, 0], hlCap = (h) => (h > 326 ? 326 + 14 * (1 - Math.exp(-(h - 326) / 14)) : h);      // no ground over 340 m
    const hlSm = (x, z) => { hlPar(x, z, hlQ); const q = hlQ[1] / (hlQ[1] > 0 ? lerp(HL.wl, 220, smoothstep(0.6, 0.9, hlQ[0])) : HL.ww); return hlCrest(hlQ[0]) * Math.exp(-q * q * 1.15); };      // the headland without its roughness
    let hlS = 0;      // (the smooth height under the last point hlH was asked for)
    const hlH = (x, z) => {
      let h = hlSm(x, z); hlS = h;
      const t = hlQ[0], d = hlQ[1], k = smoothstep(30, 170, h), bed = pourBed(x, z), open = 1 - 0.85 * bed;
      // (in the bed of the fall the ground is rounded knolls, with no sharp ridges and no gullies: what stands through the
      // fall's thin parts is knuckles of rock and scrub, never a line down the slope)
      h += (noise.ridged2(x / 300 + 21, z / 300 + 4, 2) - 0.42) * 30 * k * open + noise.fbm2(x / 120 + 3, z / 120 + 17, 2) * (8 + 9 * bed) * k;
      h += (noise.ridged2(x / 105 + 13, z / 105 + 8, 2) - 0.5) * 18 * k * open;                                      // knuckles on the skyline, crags
      h -= Math.abs(noise.n2(t * HL.L / 150 + HL.seed, d / 560 + 3)) * 26 * k * smoothstep(-40, 120, d) * (1 - bed);            // gullies running down the lee
      return hlCap(h);
    };
    // the fall's bed: the saddle's floor and the slope under it, out to where the fall has rolled out on the river
    const POUR = { hw: 290, Lu: 190, Lf: 470 };
    POUR.cx = HL.ax + HL.dx * HL.sT - HL.nx * HL.bow; POUR.cz = HL.az + HL.dz * HL.sT - HL.nz * HL.bow;
    const pourW = (r) => POUR.hw * (1 - 0.12 * smoothstep(0, 0.5, r) + 0.04 * smoothstep(0.55, 1, r) + 0.2 * Math.max(-r, 0));      // it gathers a little down the bowl and lands on the river no broader than its lip
    const pourBed = (x, z) => { const rm = (x - POUR.cx) * HL.nx + (z - POUR.cz) * HL.nz, s = ((x - POUR.cx) * HL.tx + (z - POUR.cz) * HL.tz) / pourW(rm / POUR.Lf); return (1 - smoothstep(0.94, 1.28, Math.abs(s))) * smoothstep(-POUR.Lu, -POUR.Lu + 80, rm); };
    const inPour = (x, z) => { const rm = (x - POUR.cx) * HL.nx + (z - POUR.cz) * HL.nz, s = ((x - POUR.cx) * HL.tx + (z - POUR.cz) * HL.tz) / pourW(rm / POUR.Lf); return Math.abs(s) < 0.84 && rm > -POUR.Lu && rm < POUR.Lf * 0.72; };
    {
      // the mesh, written straight into its typed arrays (the grid's vertices first, then four faces a tree)
      const NT = 116, NW = 5, ND = 44, t0 = -0.46, t1 = 1.24, W = NT + 1, NG = W * (ND + 1), keepH = fogTop - 40, nTree = Math.round(4200 * detail);
      const cRockD = LIN('#5f584e'), cRockL = LIN('#8f8371');
      const dAt = (j) => (j < NW ? -180 + 36 * j : 470 * Math.pow((j - NW) / (ND - NW), 1.1));
      const X = new Float32Array(NG), Z = new Float32Array(NG), H = new Float32Array(NG);
      const VP = new Float32Array((NG + nTree * 12) * 3), VN = new Float32Array((NG + nTree * 12) * 3), VC = new Float32Array((NG + nTree * 12) * 3), VI = [];
      for (let j = 0; j <= ND; j++) {
        for (let i = 0; i <= NT; i++) {
          const t = lerp(t0, t1, i / NT), g = (t - HL.sT) / 0.5, d = dAt(j) - HL.bow * Math.exp(-g * g), o = j * W + i;
          X[o] = HL.ax + HL.dx * t + HL.nx * d; Z[o] = HL.az + HL.dz * t + HL.nz * d; H[o] = hlH(X[o], Z[o]);
        }
        if (j % 2 === 1) await ctx.yield();
      }
      const at = (A, i, j) => A[clamp(j, 0, ND) * W + clamp(i, 0, NT)];
      for (let j = 0; j <= ND; j++) {
        const dl = dAt(j), leeK = 0.3 * smoothstep(10, 130, dl);
        for (let i = 0; i <= NT; i++) {
          const o = j * W + i, h = H[o], x = X[o], z = Z[o];
          // the surface normal from the two grid directions (the grid is skewed by the bow: a cross product of its tangents)
          const ux = at(X, i + 1, j) - at(X, i - 1, j), uy = at(H, i + 1, j) - at(H, i - 1, j), uz = at(Z, i + 1, j) - at(Z, i - 1, j);
          const vx = at(X, i, j + 1) - at(X, i, j - 1), vy = at(H, i, j + 1) - at(H, i, j - 1), vz = at(Z, i, j + 1) - at(Z, i, j - 1);
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1, sg = ny < 0 ? -1 : 1; nx *= sg / l; ny *= sg / l; nz *= sg / l;
          const lap = (at(H, i - 1, j) + at(H, i + 1, j) + at(H, i, j - 1) + at(H, i, j + 1)) * 0.25 - h;
          // grass on the tops, dark scrub and wood down the lee and in the hollows, rock where it is steep (strata across the
          // faces), darker in the gullies
          const g = clamp(0.5 + 0.9 * noise.fbm2(x / 480 + 11, z / 480 + 7, 2), 0, 1), sc = clamp(lap * 0.09 + 0.3 + 0.5 * noise.fbm2(x / 150 + 2, z / 150 + 9, 2) + leeK, 0, 1);
          const rk = 1 - smoothstep(0.64, 0.77, ny), ao = clamp(1 - lap * 0.04, 0.6, 1.12), st = 0.5 + 0.5 * noise.n2(h / 11 + x / 380, z / 380 + 6), q = o * 3;
          VP[q] = x; VP[q + 1] = h; VP[q + 2] = z; VN[q] = nx; VN[q + 1] = ny; VN[q + 2] = nz;
          for (let c = 0; c < 3; c++) VC[q + c] = lerp(lerp(lerp(cGold[c], cGreen[c], g), cScrub[c] * 1.2, sc * 0.8), lerp(cRockD[c], cRockL[c], st), rk) * ao;
        }
        if (j % 2 === 1) await ctx.yield();
      }
      for (let j = 0; j < ND; j++) {
        for (let i = 0; i < NT; i++) {
          const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
          if (Math.max(H[a], H[b], H[c], H[d]) < keepH) continue;
          VI.push(a, c, b, b, c, d);
        }
        if (j % 16 === 15) await ctx.yield();
      }
      await ctx.yield();
      // its woods: dark cypress spires in stands down the lee slope, over the shoulders and on both ends, thinner on the grass
      // of the tops; none on the steep rock, none in the bed of the fall (they stand along its thin sides). A tree's ground
      // is read from the grid it stands on.
      const jOf = (d) => (d < 0 ? (d + 180) / 36 : NW + (ND - NW) * Math.pow(d / 470, 1 / 1.1)), SX4 = [-1, 1, 1, -1], SZ4 = [-1, -1, 1, 1];
      let nv = NG;
      for (let k = 0; k < nTree; k++) {
        const t = Rhl.range(-0.4, 1.2), dl = Rhl.range(-150, 400), th = Rhl.range(11, 22), w = th * Rhl.range(0.17, 0.25), kc = Rhl.range(0.72, 1.2), jx = Rhl.range(-1, 1), jz = Rhl.range(-1, 1);
        if (k % 60 === 59) await ctx.yield();
        const fi = clamp((t - t0) / (t1 - t0) * NT, 0, NT - 1.001), fj = clamp(jOf(dl), 0, ND - 1.001), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j, o = j * W + i;
        const h = lerp(lerp(H[o], H[o + 1], a), lerp(H[o + W], H[o + W + 1], a), b); if (h < fogTop + 12) continue;
        if (Math.abs(H[o + 1] - H[o]) / Math.hypot(X[o + 1] - X[o], Z[o + 1] - Z[o]) + Math.abs(H[o + W] - H[o]) / Math.hypot(X[o + W] - X[o], Z[o + W] - Z[o]) > 1.05) continue;      // (not on the steep rock)
        const x = lerp(lerp(X[o], X[o + 1], a), lerp(X[o + W], X[o + W + 1], a), b), z = lerp(lerp(Z[o], Z[o + 1], a), lerp(Z[o + W], Z[o + W + 1], a), b);
        if (noise.n2(x / 190 + 14, z / 190 + 6) < lerp(0.12, -0.3, smoothstep(0, 90, dl)) || inPour(x, z)) continue;
        const cr = cTree[0] * kc * 1.1, cg = cTree[1] * kc * 1.2, cb = cTree[2] * kc * 1.1, ny = w / Math.hypot(w, th), nh = th / Math.hypot(w, th);
        for (let q = 0; q < 4; q++) {      // four faces: two corners of the foot and the tip
          const q1 = (q + 1) % 4, mx = (SX4[q] + SX4[q1]) * 0.5, mz = (SZ4[q] + SZ4[q1]) * 0.5;
          for (let c = 0; c < 3; c++) {
            const p = nv * 3;
            if (c === 0) { VP[p] = x + SX4[q1] * w; VP[p + 1] = h - 1.5; VP[p + 2] = z + SZ4[q1] * w; }
            else if (c === 1) { VP[p] = x + SX4[q] * w; VP[p + 1] = h - 1.5; VP[p + 2] = z + SZ4[q] * w; }
            else { VP[p] = x + jx; VP[p + 1] = h + th; VP[p + 2] = z + jz; }
            VN[p] = mx * nh; VN[p + 1] = ny; VN[p + 2] = mz * nh; VC[p] = cr; VC[p + 1] = cg; VC[p + 2] = cb;
            VI.push(nv++);
          }
        }
      }
      await ctx.yield();
      const hg = new THREE.BufferGeometry();
      hg.setAttribute('position', new THREE.BufferAttribute(VP.subarray(0, nv * 3), 3)); hg.setAttribute('normal', new THREE.BufferAttribute(VN.subarray(0, nv * 3), 3)); hg.setAttribute('color', new THREE.BufferAttribute(VC.subarray(0, nv * 3), 3));
      await ctx.yield();
      hg.setIndex(VI);
      hg.boundingSphere = new THREE.Sphere(V3(HL.ax + HL.dx * 0.4, 150, HL.az + HL.dz * 0.4), 1080);      // (the whole grid lies within 1 km of this point)
      const hlMesh = new THREE.Mesh(hg, makeHeadlandMat(HU, LU)); hlMesh.name = 'landfall-headland'; scene.add(hlMesh);
      await ctx.yield();
    }

    // ---- the fog-fall: fog banked behind the ridge, pouring through its saddle and down the lee slope
    const fallMat = makeFallMat(HU, LU); fallMat.side = THREE.DoubleSide;
    const falls = [], tumble = [], fallMist = [], TK = 12;
    const buildFall = async (R, sT, halfW, Lf) => {
      const NS = 26, NU = 14, NR = 58, Lu = 430, cx = R.ax + R.dx * sT, cz = R.az + R.dz * sT, saddleY = Math.max(landH(cx, cz), landSm(cx, cz));
      const P = new Float32Array((NS + 1) * (NR + 1) * 3), SR = new Float32Array((NS + 1) * (NR + 1) * 3), Nn = new Float32Array((NS + 1) * (NR + 1) * 3), TT = new Float32Array((NS + 1) * (NR + 1) * 4), I = [];
      const dome = (s) => Math.pow(Math.max(1 - s * s, 0), 0.35);      // a broad brow, not a point
      const topAt = (s, r, x, z) => {
        const th = 36 * dome(s) * (1 - 0.5 * smoothstep(0.15, 1, r)) + 2;
        const bank = saddleY + 5 + 11 * dome(s) - 9 * smoothstep(-0.45, -1, r);            // the bank stands 10-16 m over the saddle and sags upstream
        return [Math.max(landSm(x, z) + th + 10, landH(x, z) + 2.5, lerp(bank, -1e4, smoothstep(-0.03, 0.2, r)), fogTop - 5), r < 0 ? 30 : th];
      };
      let o = 0;
      for (let j = 0; j <= NR; j++) {
        const r = j < NU ? -1 + j / NU : (j - NU) / (NR - NU), rm = r > 0 ? r * Lf : r * Lu;
        for (let i = 0; i <= NS; i++) {
          const s = (i / NS) * 2 - 1, hw = halfW * (0.8 + 0.6 * Math.max(r, 0) + 0.7 * Math.max(-r, 0)), x = cx + R.nx * rm + R.tx * s * hw, z = cz + R.nz * rm + R.tz * s * hw;
          const t = topAt(s, r, x, z);
          P[o] = x; P[o + 1] = t[0]; P[o + 2] = z; SR[o] = s; SR[o + 1] = r; SR[o + 2] = t[1];
          { const q = (o / 3) * 4; TT[q] = R.tx; TT[q + 1] = R.tz; TT[q + 2] = R.nx; TT[q + 3] = R.nz; }
          o += 3;
        }
        await ctx.yield();
      }
      const idx = (i, j) => (clamp(j, 0, NR) * (NS + 1) + clamp(i, 0, NS)) * 3;
      for (let j = 0; j <= NR; j++) for (let i = 0; i <= NS; i++) {
        const a = idx(i - 1, j), b = idx(i + 1, j), c = idx(i, j - 1), d = idx(i, j + 1);
        const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[d] - P[c], vy = P[d + 1] - P[c + 1], vz = P[d + 2] - P[c + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1, sg = ny < 0 ? -1 : 1;
        const k = idx(i, j); Nn[k] = nx / l * sg; Nn[k + 1] = ny / l * sg; Nn[k + 2] = nz / l * sg;
      }
      await ctx.yield();
      for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i, b = a + 1, c = a + NS + 1, d = c + 1; I.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('aSR', new THREE.BufferAttribute(SR, 3)); g.setAttribute('aT', new THREE.BufferAttribute(TT, 4));
      g.setIndex(I); g.computeBoundingSphere(); g.boundingSphere.radius += 40;
      const m = new THREE.Mesh(g, fallMat); m.renderOrder = 1; m.name = 'fog-fall'; scene.add(m); falls.push(m);
      await ctx.yield();
      // tracks for the puffs that tumble down it: TK points from the lip to the foot, a little proud of the sheet
      for (let q = 0; q < 28; q++) {
        const s = Rfall.range(-0.62, 0.62), tr = new Float32Array(TK * 3);
        for (let k = 0; k < TK; k++) {
          const r = -0.06 + 1.0 * (k / (TK - 1)), hw = halfW * (0.8 + 0.6 * Math.max(r, 0)), x = cx + R.nx * r * Lf + R.tx * s * hw, z = cz + R.nz * r * Lf + R.tz * s * hw;
          tr[k * 3] = x; tr[k * 3 + 1] = topAt(s, r, x, z)[0] + 6; tr[k * 3 + 2] = z;
        }
        tumble.push({ tr, ph: Rfall(), rate: Rfall.range(0.03, 0.045), size: Rfall.range(60, 120), turn: Rfall.range(-1, 1), seed: Rfall() });
        if (q % 7 === 6) await ctx.yield();
      }
      await ctx.yield();
      // a billowing bank along the lip (it overhangs the saddle against the sky) and where the pour meets the river
      for (let k = 0; k < 14; k++) {
        const s = -0.86 + 1.72 * (k / 13), r = -0.07 + 0.1 * Math.sin(k * 2.4), hw = halfW * (0.8 + 0.7 * Math.max(-r, 0) + 0.6 * Math.max(r, 0)), x = cx + R.nx * r * Lf + R.tx * s * hw, z = cz + R.nz * r * Lf + R.tz * s * hw;
        fallMist.push([x, topAt(s, r, x, z)[0] + 8, z]);
      }
      for (let k = 0; k < 8; k++) {
        const s = -0.85 + 1.7 * (k / 7), r = 0.8 + 0.08 * Math.sin(k * 1.9), hw = halfW * (0.8 + 0.6 * r), x = cx + R.nx * r * Lf + R.tx * s * hw, z = cz + R.nz * r * Lf + R.tz * s * hw;
        fallMist.push([x, Math.max(topAt(s, r, x, z)[0], fogTop) + 22, z]);
      }
      await ctx.yield();
      return V3(cx + R.nx * Lf * 0.3, saddleY - 40, cz + R.nz * Lf * 0.3);
    };
    const fallAt = await buildFall(ridges[0], ridges[0].sT, 215, 540);
    if (fallsPick > 0.45) await buildFall(ridges[1], ridges[1].sT, 260, 520);
    await ctx.yield();
    // ---- the great fog-fall: the river stands banked behind the landfall headland, bends over the soft lip of its saddle
    // and lies down the lee slope toward the bridge as one heavy body, some 200 m of fall and close on 600 m wide,
    // thin at its sides and between its heads (rock and woods show through), and rolls out in a bank where it lands on the
    // river. Everything of it is drawn from streams of its own; the first ridge's fall and its puffs stand as they stood.
    const PU = {
      uPour: { value: new THREE.Vector4(POUR.hw, POUR.Lu, POUR.Lf, 8) },
      uTone: { value: night ? new THREE.Vector3(0.5, 1, 1.08) : warmLook ? new THREE.Vector3(0.45, 1.0, 1.12) : new THREE.Vector3(0.45, 1.0, 1.08) },
      uGlow: { value: night ? 0.3 : 0.5 },      // (by day the lip and the bank glow more than under the moon)
      uLev: { value: new THREE.Vector2(fogTop + 25, fogTop + 205) },
    };
    const pourPuffs = [], PK = 10;
    {
      const NS = 40, NU = 6, NR = 58, cx = POUR.cx, cz = POUR.cz, Lu = POUR.Lu, Lf = POUR.Lf, W = NS + 1;
      const bankY = HL.sY + 22;                                          // the bank stands level behind the crest, 22 m over the saddle's floor
      const P = new Float32Array(W * (NR + 1) * 3), SR = new Float32Array(W * (NR + 1) * 3), Nn = new Float32Array(W * (NR + 1) * 3), TT = new Float32Array(W * (NR + 1) * 4), I = [];
      const dome = (s) => Math.pow(Math.max(1 - s * s, 0), 0.35);      // a broad brow, not a point
      // ... so it is thickest where the saddle is lowest and runs out to nothing against the shoulders
      const lipTh = (s) => clamp(bankY - hlSm(cx + HL.tx * s * POUR.hw, cz + HL.tz * s * POUR.hw), 0, 30);
      const liftAt = (s, r) => (9 + 13 * bell(r, 0.72, 0.1)) * (1 - smoothstep(0.78, 1, r)) * (0.5 + 0.5 * dome(s)) - 7 * smoothstep(0.8, 1, r);      // the bank where it has landed: how high over the river's mean top (it ends under it)
      const topAt = (s, r, x, z, o, lt = lipTh(s)) => {
        const gr = hlH(x, z), g = hlS, th = lt * (1 - 0.52 * smoothstep(0.04, 0.56, r)) + 2.5;      // it thins as it runs down: crags stand through its lower half
        let y = Math.max(g + th, gr + 1, fogTop + liftAt(s, r));
        if (r < 0.16) y = Math.max(y, lerp(bankY + 3 * dome(s) - 22 * smoothstep(-0.3, -1, r), -1e4, smoothstep(-0.02, 0.16, r)));
        // (its depth over the rock, running out to nothing at its sides on the slope: no strand of it lies in a gully beside
        // the fall; where the ground has gone under the river it is a bank on the river)
        o[0] = y; o[1] = lerp(clamp(y - gr, 0, 34) * (1 - smoothstep(0.7, 0.96, Math.abs(s)) * smoothstep(-0.1, 0.08, r)), 30, smoothstep(fogTop + 34, fogTop + 4, gr));
        return o;
      };
      const tq = [0, 0], LT = new Float32Array(W);
      for (let i = 0; i <= NS; i++) LT[i] = lipTh((i / NS) * 2 - 1);
      let o = 0;
      for (let j = 0; j <= NR; j++) {
        const r = j < NU ? -1 + j / NU : (j - NU) / (NR - NU), rm = r > 0 ? r * Lf : r * Lu, hw = pourW(r);
        for (let i = 0; i <= NS; i++) {
          const s = (i / NS) * 2 - 1, x = cx + HL.nx * rm + HL.tx * s * hw, z = cz + HL.nz * rm + HL.tz * s * hw, q = o / 3;
          topAt(s, r, x, z, tq, LT[i]);
          P[o] = x; P[o + 1] = tq[0]; P[o + 2] = z; SR[o] = s; SR[o + 1] = r; SR[o + 2] = tq[1];
          TT[q * 4] = HL.tx; TT[q * 4 + 1] = HL.tz; TT[q * 4 + 2] = HL.nx; TT[q * 4 + 3] = HL.nz;
          o += 3;
        }
        await ctx.yield();
      }
      const idx = (i, j) => clamp(j, 0, NR) * W + clamp(i, 0, NS);
      for (let j = 0; j <= NR; j++) {
        for (let i = 0; i <= NS; i++) {
          const a = idx(i - 1, j), b = idx(i + 1, j), c = idx(i, j - 1), d = idx(i, j + 1);
          const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[d * 3] - P[c * 3], vy = P[d * 3 + 1] - P[c * 3 + 1], vz = P[d * 3 + 2] - P[c * 3 + 2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1, sg = ny < 0 ? -1 : 1;
          const k = idx(i, j) * 3; Nn[k] = nx / l * sg; Nn[k + 1] = ny / l * sg; Nn[k + 2] = nz / l * sg;
        }
        if (j % 24 === 23) await ctx.yield();
      }
      await ctx.yield();
      for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; I.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('aSR', new THREE.BufferAttribute(SR, 3)); g.setAttribute('aT', new THREE.BufferAttribute(TT, 4));
      g.setIndex(I); g.computeBoundingSphere(); g.boundingSphere.radius += 60;
      const m = new THREE.Mesh(g, makePourMat(HU, LU, PU)); m.renderOrder = 1; m.name = 'landfall-fog-fall'; scene.add(m);
      await ctx.yield();
      // the soft heads along its lip (no ruled edge against the sky) and where it rolls out on the river: each rides a short
      // track at the body's own pace and is born and dies softly on its loop
      // (a track: PK points from r0 to r1 at s across the fall, `up` (in head sizes) proud of the sheet)
      const Rp = makeRng(hashSeed('pour:' + ctx.seed));
      const track = (s, r0, r1, size, up) => {
        const tr = new Float32Array(PK * 3);
        for (let k = 0; k < PK; k++) {
          const r = lerp(r0, r1, k / (PK - 1)), hw = pourW(r), rm = r > 0 ? r * Lf : r * Lu, x = cx + HL.nx * rm + HL.tx * s * hw, z = cz + HL.nz * rm + HL.tz * s * hw;
          topAt(s, r, x, z, tq);
          tr[k * 3] = x; tr[k * 3 + 1] = tq[0] + size * up; tr[k * 3 + 2] = z;
        }
        return tr;
      };
      // (the pace: `span` of the fall's length at about v m/s)
      const rate = (span, v) => v / Math.max(span * Lf, 1);
      for (let q = 0; q < 34; q++) {      // along the lip, against the sky
        const s = Rp.range(-0.8, 0.8), size = Rp.range(28, 46) * (0.45 + 0.55 * lipTh(s) / 22), r0 = Rp.range(-0.2, -0.05), span = Rp.range(0.22, 0.3);
        pourPuffs.push({ tr: track(s, r0, r0 + span, size, 0.3), ph: Rp(), rate: rate(span, Rp.range(5.5, 7)), size, grow: 0.2, turn: Rp.range(-0.3, 0.3), seed: Rp() });
        if (q % 8 === 7) await ctx.yield();
      }
      for (let q = 0; q < 30; q++) {      // rolling out over the river at the foot
        const s = Rp.range(-0.92, 0.92), size = Rp.range(34, 60), r0 = Rp.range(0.6, 0.78), span = Rp.range(0.12, 0.2);
        pourPuffs.push({ tr: track(s, r0, r0 + span, size, 0.16), ph: Rp(), rate: rate(span, Rp.range(3, 4.5)), size, grow: 0.3, turn: Rp.range(-0.25, 0.25), seed: Rp() });
        if (q % 8 === 7) await ctx.yield();
      }
      await ctx.yield();
    }
    const NTU = tumble.length, tuP = new Float32Array(NTU * 4), tuQ = new Float32Array(NTU * 3), tuGeo = new THREE.InstancedBufferGeometry();
    tuGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); tuGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const tuPA = new THREE.InstancedBufferAttribute(tuP, 4), tuQA = new THREE.InstancedBufferAttribute(tuQ, 3);
    tuPA.setUsage(THREE.DynamicDrawUsage); tuQA.setUsage(THREE.DynamicDrawUsage);
    tuGeo.setAttribute('aP', tuPA); tuGeo.setAttribute('aQ', tuQA); tuGeo.instanceCount = NTU;
    const tumbleMesh = new THREE.Mesh(tuGeo, makeTumbleMat(HU, LU)); tumbleMesh.frustumCulled = false; tumbleMesh.renderOrder = 1.2; tumbleMesh.name = 'fog-fall-puffs'; scene.add(tumbleMesh);
    const putTumble = (time) => {
      for (let i = 0; i < NTU; i++) {
        const Q = tumble[i], t = (Q.ph + time * Q.rate) % 1, f = t * (TK - 1), k = Math.min(Math.floor(f), TK - 2), w = f - k, a = k * 3;
        tuP[i * 4] = lerp(Q.tr[a], Q.tr[a + 3], w); tuP[i * 4 + 1] = lerp(Q.tr[a + 1], Q.tr[a + 4], w); tuP[i * 4 + 2] = lerp(Q.tr[a + 2], Q.tr[a + 5], w);
        tuP[i * 4 + 3] = Q.size * (0.6 + 0.7 * t);
        tuQ[i * 3] = smoothstep(0, 0.14, t) * (1 - smoothstep(0.62, 1, t)); tuQ[i * 3 + 1] = Q.seed * 6.283 + time * 0.12 * Q.turn; tuQ[i * 3 + 2] = Q.seed;
      }
      tuPA.needsUpdate = true; tuQA.needsUpdate = true;
    };
    // the great fall's heads: one instanced call with the first fall's puff material, moved along their tracks on the world's clock
    const NPP = pourPuffs.length, ppP = new Float32Array(NPP * 4), ppQ = new Float32Array(NPP * 3), ppGeo = new THREE.InstancedBufferGeometry();
    ppGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); ppGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const ppPA = new THREE.InstancedBufferAttribute(ppP, 4), ppQA = new THREE.InstancedBufferAttribute(ppQ, 3);
    ppPA.setUsage(THREE.DynamicDrawUsage); ppQA.setUsage(THREE.DynamicDrawUsage);
    ppGeo.setAttribute('aP', ppPA); ppGeo.setAttribute('aQ', ppQA); ppGeo.instanceCount = NPP;
    const pourMesh = new THREE.Mesh(ppGeo, tumbleMesh.material); pourMesh.frustumCulled = false; pourMesh.renderOrder = 1.25; pourMesh.name = 'landfall-fog-fall-heads'; scene.add(pourMesh);
    const putPour = (time) => {
      for (let i = 0; i < NPP; i++) {
        const Q = pourPuffs[i], t = (Q.ph + time * Q.rate) % 1, f = t * (PK - 1), k = Math.min(Math.floor(f), PK - 2), w = f - k, a = k * 3;
        ppP[i * 4] = lerp(Q.tr[a], Q.tr[a + 3], w); ppP[i * 4 + 1] = lerp(Q.tr[a + 1], Q.tr[a + 4], w); ppP[i * 4 + 2] = lerp(Q.tr[a + 2], Q.tr[a + 5], w);
        ppP[i * 4 + 3] = Q.size * (1 + Q.grow * t);
        ppQ[i * 3] = smoothstep(0, 0.22, t) * (1 - smoothstep(0.62, 1, t)); ppQ[i * 3 + 1] = Q.seed * 6.283 + time * 0.05 * Q.turn; ppQ[i * 3 + 2] = Q.seed;
      }
      ppPA.needsUpdate = true; ppQA.needsUpdate = true;
    };
    await ctx.yield();

    // ---- rare: a four-masted barque under the deck, only her royals, mastheads and pennants out of the fog
    let barque = null;
    if (rare) {
      const B = new Acc(), hull = LIN('#16191d'), spar = LIN('#8a6a45'), sail = LIN('#f4e2b8'), sailB = LIN('#e0c896'), pen = LIN('#b3261c');
      const Z0 = 74, hz = [-50, -42, -20, 20, 40, 48], hb = [0.4, 4.2, 6.6, 6.6, 5.2, 3.6];
      for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
        B.quad([s * hb[i] * 0.6, -2, Z0 + hz[i]], [s * hb[i + 1] * 0.6, -2, Z0 + hz[i + 1]], [s * hb[i + 1], 7, Z0 + hz[i + 1]], [s * hb[i], 7, Z0 + hz[i]], hull);
      }
      for (let i = 0; i < 5; i++) B.quad([-hb[i], 7, Z0 + hz[i]], [hb[i], 7, Z0 + hz[i]], [hb[i + 1], 7, Z0 + hz[i + 1]], [-hb[i + 1], 7, Z0 + hz[i + 1]], spar);
      const masts = [[-33, 55.5], [-11, 56.5], [11, 55.5], [33, 49]], yards = [[19, 13.5], [28, 12], [36.5, 10.5], [44, 9], [50.5, 7.4]];
      // the yards are braced round 36 degrees (a quartering wind): from abeam, where we pass her, every square sail shows its face
      const cb = Math.cos(0.63), sb = Math.sin(0.63), yd = (x, y, dz, z) => [x * cb + dz * sb, y, z - x * sb + dz * cb];
      masts.forEach(([mz, top], mi) => {
        const z = Z0 + mz;
        B.beam([0, 7, z], [0, top, z], 0.8, spar);
        { const pl = 6 + Rship.range(0, 1.5); B.triW([0, top, z], [0, top - 1.6, z], [0.2, top - 1.0, z + pl * 0.5], pen, [0, 0, 0.5]); B.triW([0, top - 0.3, z + pl * 0.45], [0, top - 1.5, z + pl * 0.45], [0.2, top - 0.9, z + pl], pen, [0.45, 0.45, 1.3]); }
        B.box(0, top, z, 0.5, 0.5, 0.5, 0, [1, 0.8, 0.5], 2.5);
        if (mi < 3) {
          for (const [y, hw] of yards) B.beam(yd(-hw, y, -0.6, z), yd(hw, y, -0.6, z), 0.5, spar);
          for (let k = 0; k < yards.length; k++) {
            const y0 = k === 0 ? 9.5 : yards[k - 1][0] + 0.5, y1 = yards[k][0] - 0.3, w0 = k === 0 ? yards[0][1] * 0.98 : yards[k - 1][1] * 0.98, w1 = yards[k][1] * 0.96, nu = 6;
            for (let a = 0; a < nu; a++) {
              const u0 = a / nu * 2 - 1, u1 = (a + 1) / nu * 2 - 1, bel = (u) => -0.6 - 1.7 * (1 - u * u), c = a % 2 ? sail : sailB;
              const ym = (y0 + y1) / 2, wm = (w0 + w1) / 2;
              const f0 = 1 - u0 * u0, f1 = 1 - u1 * u1;
              B.quadW(yd(u0 * w0, y0, bel(u0) * 0.5, z), yd(u1 * w0, y0, bel(u1) * 0.5, z), yd(u1 * wm, ym, bel(u1) * 1.35, z), yd(u0 * wm, ym, bel(u0) * 1.35, z), c, [0.1 * f0, 0.1 * f1, 0.8 * f1, 0.8 * f0]);
              B.quadW(yd(u0 * wm, ym, bel(u0) * 1.35, z), yd(u1 * wm, ym, bel(u1) * 1.35, z), yd(u1 * w1, y1, bel(u1) * 0.5, z), yd(u0 * w1, y1, bel(u0) * 0.5, z), c, [0.8 * f0, 0.8 * f1, 0.1 * f1, 0.1 * f0]);
            }
          }
          B.triW([0.3, top - 3, z - 1], [0.3, 22, z - 1], [0.3, 12, z - 19], sailB, [0, 0.5, 0]);       // staysail down to the next mast forward
        } else {
          B.beam([0, 30, z], [0, 36, z + 15], 0.45, spar); B.beam([0, 10, z], [0, 10.6, z + 17], 0.5, spar);
          B.quadW([0.2, 10.5, z + 0.6], [0.2, 10.9, z + 16.6], [0.2, 35.6, z + 14.6], [0.2, 30, z + 0.6], sail, [0, 0.2, 0.6, 0]);
          B.tri([0.2, 31, z + 0.6], [0.2, 36.6, z + 14.4], [0.2, top - 1.5, z + 0.6], sailB);
        }
      });
      B.beam([0, 9, Z0 - 49], [0, 15, Z0 - 68], 0.6, spar);
      for (let k = 0; k < 3; k++) B.tri([0.2, 12 + k * 1.2, Z0 - 60 + k * 4], [0.2, 40 + k * 4, Z0 - 34], [0.2, 11 + k, Z0 - 38 + k * 2], k % 2 ? sail : sailB);
      await ctx.yield();
      barque = new THREE.Mesh(B.toGeometry(), makeFarMat(HU, LU, THREE.DoubleSide, 0.06, 0.45)); barque.name = 'barque'; barque.frustumCulled = false; scene.add(barque);
      await ctx.yield();
    }

    // ---- rifts: the river is torn open in four large holes down to dark water (it stays a sea: fog stands between and round
    // them, and their rims wander with the flow). One on the sun side of the main span, across ship 0's wake (a pilot boat
    // follows her, sailing boats beyond); one on the bay side under the dive between the cables (a ferry crossing, sailing
    // boats); two at the portal tower, either side of the last run down the roadway: a stone fort on a rock with its pier,
    // sheds and lamps on the sun side (a ferry coming in), a tug with a sand barge on the bay side.
    const Rrift = Rship.fork('rift');
    const RIFTS = [
      [-200 + rj[0] * 12, 215 + rj[1] * 8, 330, 160],
      [120 + rj[2] * 14, -245 + rj[3] * 10, 245, 128],
      [-770, 185, 190, 135],
      [-455 + rj[4] * 10, -170, 170, 120],      // (short of the second tower: its long shadow lies on the fog beyond this rift's rim)
    ];
    RIFTS.forEach((r, i) => hero.setRift(i, r[0], r[1], r[2], r[3]));
    const WTU = {
      uDeep: { value: night ? new THREE.Color(0.01, 0.016, 0.036) : lookId === 'morning' ? new THREE.Color(0.014, 0.043, 0.066) : new THREE.Color(0.024, 0.036, 0.068) },
      uSkyRef: { value: skyC.clone().lerp(new THREE.Color(look.haze), night ? 0 : warmLook ? 0.4 : 0.15).multiplyScalar(night ? 0.22 : 0.4) },
      uFoam: { value: new THREE.Color(look.fogLit).multiplyScalar(night ? 0.5 : 0.8) },
      uSea: { value: new THREE.Vector4(840, 250, 720, 1) },
      uBoat: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(1e5, 1e5, 0, -1)) }, uBoatD: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(1, 1, 0, 0)) },
    };
    const water = (() => {
      // one sheet under the whole strait; its shader draws it only in and round the rifts and round the blind arrival
      const P = [-1260, 0, -570, 1580, 0, -570, 1580, 0, 980, -1260, 0, 980], I = [0, 2, 1, 0, 3, 2];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, makeWaterMat(HU, LU, WTU)); m.name = 'rift-water'; m.frustumCulled = false; m.renderOrder = -1.5;      // after the in-fog dome, before the fog sheet
      return m;
    })();
    scene.add(water);
    await ctx.yield();
    const boatMat = makeFarMat(HU, LU, THREE.DoubleSide, 0, 1, 0, [2.6, 2.6]), frontMat = makeFarMat(HU, LU, THREE.DoubleSide, 0, 1, 0, [3.2, 4.5]);
    const mkBoat = (geo, name, sc = 1, mat = boatMat) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; m.scale.setScalar(sc); m.visible = false; scene.add(m); return m; };
    const ferryGeo = ferryGeometry();
    await ctx.yield();
    const tugGeo = tugGeometry(true), pilotGeo = tugGeometry(false);
    await ctx.yield();
    const ferryA = mkBoat(ferryGeo, 'ferry-a'), ferryB = mkBoat(ferryGeo, 'ferry-b'), tug = mkBoat(tugGeo, 'tug'), pilot = mkBoat(pilotGeo, 'pilot', 1.15);
    const sailGeo = sailboatsGeometry(Rrift);
    const sailSets = [[RIFTS[1][0] - 10, RIFTS[1][1] - 12], [RIFTS[3][0] - 4, RIFTS[3][1] - 26], [RIFTS[0][0] - 95, RIFTS[0][1] + 18]].map((q, i) => { const m = mkBoat(sailGeo, 'sailing-boats' + i); m.position.set(q[0], 0, q[1]); m.rotation.y = i * 2.1; m.userData.q = q; return m; });
    await ctx.yield();
    const front = new Acc(), frontLamps = waterfrontInto(front, Rrift, RIFTS[2][0], RIFTS[2][1]);
    const frontMesh = mkBoat(front.toGeometry(), 'waterfront', 1, frontMat);
    const riftThings = [ferryA, ferryB, tug, pilot, frontMesh, ...sailSets];
    await ctx.yield();
    // place a vessel and its wake (heading 0 = bow toward -Z; stern: how far astern of her middle the wake starts)
    const setBoat = (i, m, x, z, heading, time, w0, len, stern = 0) => {
      const dx = -Math.sin(heading), dz = -Math.cos(heading);
      if (m) { m.position.set(x, 0.12 * Math.sin(time * 0.9 + i * 1.7), z); m.rotation.set(0.012 * Math.sin(time * 0.7 + i), heading, 0.025 * Math.sin(time * 0.53 + i * 2.3)); }
      WTU.uBoat.value[i].set(x - dx * stern, z - dz * stern, dx, dz); WTU.uBoatD.value[i].set(w0, len, 1, 0);
    };

    // ---- the pelicans: the line of six ahead of us, more lines far off over the fog, and their shadows
    const NL = 6, NG = 7, groups = Math.max(1, Math.round(3 * density)), NB = NL + groups * NG;
    const pelGeo = pelicanGeometry(), aI = new Float32Array(NB * 2);
    for (let i = 0; i < NB; i++) { aI[i * 2] = i < NL ? i * 0.045 : Rbird(); aI[i * 2 + 1] = 1; }
    pelGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 2));
    const pelicans = new THREE.InstancedMesh(pelGeo, makePelicanMat(HU, LU), NB);
    pelicans.frustumCulled = false; pelicans.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pelicans.name = 'pelicans'; scene.add(pelicans);
    const far = [], skimY = new Float32Array(NG), skimBase = fogTop + fogAmp * 0.45 + 9;
    for (let g = 0; g < groups; g++) {
      const sgn = g % 2 ? -1 : 1, ang = Rbird.range(-0.12, 0.12) + (g === 1 ? Math.PI : 0);
      far.push({ cx: Rbird.range(-400, 400), cz: sgn * Rbird.range(210, 480), dx: -Math.cos(ang), dz: Math.sin(ang), v: Rbird.range(13, 16), off: Rbird.range(0, 2400), alt: fogTop + fogAmp * 0.8 + 6 + Rbird.range(3, 9), side: Rbird.chance(0.5) ? 1 : -1 });
    }
    const NS = NL + 1 + groups * NG, shGeo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), shA = new Float32Array(NS * 2);
    shGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(shA, 2)); shGeo.getAttribute('aA').setUsage(THREE.DynamicDrawUsage);
    const shadows = new THREE.InstancedMesh(shGeo, makeShadowMat(LU), NS);
    shadows.frustumCulled = false; shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage); shadows.renderOrder = 0.5; shadows.name = 'pelican-shadows'; scene.add(shadows);
    await ctx.yield();

    // ---- inside the fog: the gradient dome and drifting droplets
    const fogIn = new THREE.Color(look.fogShade).multiplyScalar(0.82).add(new THREE.Color(look.fogLit).multiplyScalar(0.1));
    const fogOut = new THREE.Color(look.fogShade).lerp(new THREE.Color(look.fogLit), 0.66), fogLitC = new THREE.Color(look.fogLit), fogShadeC = new THREE.Color(look.fogShade);
    const DU = {
      uTopC: { value: fogIn.clone() }, uMidC: { value: fogIn.clone() }, uLowC: { value: fogIn.clone() }, uGlowC: { value: sunC.clone().multiplyScalar(night ? 0.16 : 0.62) },
      uSunDir: LU.uSunDir, uDrift: { value: V3(0, 0, 0) }, uImm: { value: 1 },
    };
    const glowC = DU.uGlowC.value.clone();
    const dome = makeInFogDome(DU); dome.name = 'in-fog'; scene.add(dome);
    await ctx.yield();
    const set = fx.fxGroup(); scene.add(set.object);
    const drops = set.add(fx.makeParticles({ rng: Rfx, preset: 'dust', time: T, count: Math.round(2600 * detail), box: [46, 28, 46], size: [0.02, 0.07], colors: night ? ['#8fa4d2', '#6f84b8', '#b8c6ea'] : ['#ffffff', '#e2eaf3', '#fff2e0'] }));
    await ctx.yield();
    const flow = hero.look.flow, flowV = HU.uFg2.value.w;
    const mist = set.add(fx.makeMist({ rng: Rfx, time: T, count: Math.round(84 * detail), area: [520, 16, 520], center: [0, fogTop + 4, 0], size: [22, 64], color: new THREE.Color(look.fogLit).multiplyScalar(0.95), opacity: 0.2, drift: [flow[0] * flowV, 0, flow[1] * flowV], follow: true }));
    await ctx.yield();
    const steam = set.add(fx.makeSmokeColumn({ rng: Rfx, time: T, position: [A.shipTrack[0].x, 53.4, 0], height: 30, radius: [0.8, 4.6], size: [2.2, 8.5], count: Math.round(44 * detail), color: night ? '#7c8cb4' : warmLook ? '#' + new THREE.Color(look.fogLit).multiplyScalar(0.72).getHexString() : '#eef0f2', colorTop: night ? '#9aa8cc' : warmLook ? look.fogLit : '#ffffff', shadowColor: warmLook ? '#' + new THREE.Color(look.fogShade).lerp(new THREE.Color(look.fogLit), 0.55).getHexString() : night ? look.fogShade : '#' + new THREE.Color(look.fogShade).lerp(new THREE.Color(look.fogLit), 0.2).getHexString(), ambient: night ? '#2a3350' : warmLook ? '#' + new THREE.Color(look.fogShade).lerp(new THREE.Color(look.fogLit), 0.4).getHexString() : '#8e98ac', opacity: night ? 0.42 : 0.5, rate: 0.085, wind: [flow[0] * 1.8, 0, flow[1] * 1.8], bend: 0.75, sunDir: SUN }));
    if (rare) steam.object.visible = false;
    steam.object.traverse((o) => { o.frustumCulled = false; });
    const FT = A.funnelTop;
    await ctx.yield();

    // ---- fog heads: soft domes standing on the river round the valley under the main span and where we burst out of the
    // fog, drifting with the flow, so the near field has rolling walls and not a carpet (one call)
    const Rhead = Rfx.fork('heads'), NBIG = Math.round(112 * detail), NTF = Math.round(340 * detail), NTV = Math.round(360 * detail), NWV = Math.round(120 * detail), NWC = Math.round(130 * detail), NWR = 4 * Math.round(24 * detail), NWS = 14;
    const I1 = NBIG + NTF, I2 = I1 + NTV, I3 = I2 + NWV, NHD = I3 + NWC + NWR + NWS, HV = { value: 1 }, heads = [], TUL = 440, TVL = 220;
    const HB = [
      { x0: -450, x1: 260, z0: -410, z1: 440, ax: 260, az: 25, bx: -250, bz: 28, e0: 60, e1: 104, s0: 24, s1: 55 },      // beyond x = -195 the route climbs over the deck: the deck band keeps it clear
      { x0: 590, x1: 960, z0: 62, z1: 430, ax: 912, az: 318, bx: 716, bz: 66, e0: 40, e1: 70, s0: 13, s1: 27 },
    ];
    for (const B of HB) { const dx = B.bx - B.ax, dz = B.bz - B.az; B.l2 = dx * dx + dz * dz; B.dx = dx; B.dz = dz; }
    for (let i = 0; i < NBIG; i++) {
      const B = HB[i < NBIG * 0.74 ? 0 : 1];
      heads.push({ B, fx: Rhead(), fz: Rhead(), s: lerp(B.s0, B.s1, Math.pow(Rhead(), 1.6)), seed: Rhead(), up: Rhead.range(0.36, 0.52), asp: 0.74 });
    }
    // tufts: small soft tops all over the sheet within 200 m of the eye (a lattice that drifts with the flow and wraps round
    // the camera), so every nearby crest has a broken, fleecy outline
    for (let i = 0; i < NTF; i++) heads.push({ B: null, fx: Rhead(), fz: Rhead(), s: lerp(10, 28, Math.pow(Rhead(), 1.7)), seed: Rhead(), up: Rhead.range(0.26, 0.44), asp: Rhead.range(0.5, 0.7) });
    // fleece on the valley floor: a second, finer lattice of small tufts that only stands in the valley under the main span,
    // from a few metres outboard of the route (and beyond the deck), so the floor beside the eye is overlapping heads, not a skin
    for (let i = 0; i < NTV; i++) heads.push({ B: null, fx: Rhead(), fz: Rhead(), s: lerp(6, 15, Math.pow(Rhead(), 1.4)), seed: Rhead(), up: Rhead.range(0.3, 0.5), asp: Rhead.range(0.55, 0.8) });
    // wisps: thin streaks torn off the heads, running down the wind faster than the river itself. In the valley under the
    // main span one band peels off the floor on the eye's outboard side and under it, one hangs higher and crosses the route
    // between the eye and the truss; a third lies along the whole bridge just above the river's top (long low veils that
    // stream through the low sweep of the cables and round the towers' legs)
    // ... and two more: long veils pouring over the deck and through both curtains of suspenders where the river's top
    // breaks into the valley (we come down between the cables right over them), and streaks blowing past the second tower
    // at road level, outboard of both cables (near things on both sides of the last run; none crosses the roadway)
    const WB = [{ x0: -290, x1: 200, z0: 18, z1: 150, valley: true, floor: true }, { x0: -290, x1: 200, z0: -14, z1: 84, valley: true, floor: false }, { x0: -730, x1: 730, z0: -80, z1: 124, valley: false, floor: false },
      { x0: 230, x1: 450, z0: -90, z1: 90, valley: false, floor: false, pour: true }, { x0: -800, x1: -380, z0: -170, z1: 170, valley: false, floor: false, legs: true }];
    for (let i = 0; i < NWV + NWC; i++) {
      const W = WB[i < NWV / 2 ? 0 : i < NWV ? 1 : i < NWV + NWC * 0.18 ? 3 : i < NWV + NWC * 0.44 ? 4 : 2], sz = (r) => W.valley ? lerp(16, 38, r) : W.pour ? lerp(90, 170, r) : W.legs ? lerp(38, 66, r) : lerp(40, 95, r);
      heads.push({ W, fx: Rhead(), fz: Rhead(), s: sz(Rhead()), seed: Rhead(), up: Rhead(), asp: -Rhead.range(0.2, 0.34) * (W.valley ? 1 : W.pour ? 0.3 : 0.5), v: Rhead.range(1.2, 1.7) });
    }
    // ... veils over the rifts: thin streaks that hang over each rift's lip, pour down its wall and drift low over the edge of
    // the open water (the dark water shows through them: the river's edge is vapour, not a shore), and a few that stream
    // along ship 0's sides at the level the fog stands round her, so her hull fades into it (their own random stream)
    { const Rv = Rfall.fork('veils');
      for (let r = 0; r < 4; r++) {
        const R = RIFTS[r], W = { x0: R[0] - R[2] * 1.12, x1: R[0] + R[2] * 1.12, z0: R[1] - R[3] * 1.12, z1: R[1] + R[3] * 1.12, rift: true };
        for (let k = 0; k < NWR / 4; k++) heads.push({ W, fx: Rv(), fz: Rv(), s: lerp(20, 46, Rv()), seed: Rv(), up: Rv(), asp: -Rv.range(0.1, 0.19), v: Rv.range(0.5, 0.9) });
      }
      const W = { x0: 0, x1: 1, z0: 0, z1: 1, ship: true };
      for (let k = 0; k < NWS; k++) heads.push({ W, fx: Rv(), fz: Rv(), s: lerp(20, 36, Rv()), seed: Rv(), up: Rv(), asp: -Rv.range(0.09, 0.15), v: Rv.range(0.8, 1.4) });
    }
    const hdP = new Float32Array(NHD * 4), hdQ = new Float32Array(NHD * 3), hdGeo = new THREE.InstancedBufferGeometry();
    hdGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); hdGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const hdPA = new THREE.InstancedBufferAttribute(hdP, 4), hdQA = new THREE.InstancedBufferAttribute(hdQ, 3);
    hdPA.setUsage(THREE.DynamicDrawUsage); hdQA.setUsage(THREE.DynamicDrawUsage);
    hdGeo.setAttribute('aP', hdPA); hdGeo.setAttribute('aQ', hdQA); hdGeo.instanceCount = NHD;
    const headMesh = new THREE.Mesh(hdGeo, makeHeadMat(HU, LU, HV)); headMesh.frustumCulled = false; headMesh.renderOrder = 1.1; headMesh.name = 'fog-heads'; scene.add(headMesh);
    const wrap01 = (v) => v - Math.floor(v), floorK = look.relief < 0.5 ? 0.63 : 1.05;      // (under the moon the floor's streaks close into a pale ruled band)
    // no head stands in a rift or on its wall, none on the strip of valley floor between the route and the sun-side rift
    // (seen edge-on from the low run they closed into one pale blanket over the water), none round the ship's house or on
    // the sight line to it from the east: her funnel, wheelhouse and decks stand clear of the floor
    const R1far = RIFTS[0][1] + RIFTS[0][3] * 0.95; let houseZ = 0;
    const offRift = (x, z, s = 99) => {      // s: the head's size (the smallest tufts may stand on the lane and near the ship: they are too low to close over the water or her decks)
      const lane = smoothstep(-270, -215, x) * (1 - smoothstep(-5, 45, x)) * smoothstep(6, 26, z) * (1 - smoothstep(R1far - 30, R1far + 20, z));
      const ex = (x - SX - 50) / 135, ez = (z - houseZ - 5) / 62, win = 1 - smoothstep(0.7, 1.1, Math.hypot(ex, ez));
      const k = (1 - lane * (s < 9 ? 0.15 : s < 13 ? 0.45 : s < 17 ? 0.8 : 1)) * (1 - win * (s < 9 ? 0.3 : s < 14 ? 0.55 : 1));
      return k > 0 ? k * (1 - smoothstep(0.1, 0.32, hero.fog.riftAt(x, z))) : 0;      // (they stand on a rift's rim: its top edge is a row of heads against the water)
    };
    const putHeads = (time, u, ia = 0, ib = NHD, thirds = 7) => {      // ia..ib: build() asks for them part by part (in steps that hand the frame back), update() for the tuft lattices alone while the eye is deep in the fog; thirds: bits 0..2, only those thirds of the two tuft lattices (they drift at the river's pace: a lag of three sixtieths of a second cannot be seen)
      const ox = flow[0] * flowV * time, oz = flow[1] * flowV * time;
      const valleyU = smoothstep(0.45, 0.5, u) * (1 - smoothstep(0.68, 0.74, u));      // the eye is down in the valley
      houseZ = shipZ(u) + 86;
      const shipOn = smoothstep(0.5, 0.56, u) * (1 - smoothstep(0.75, 0.8, u));
      // a head whose fade is nought is written with no width: its quad closes to a point and nothing of it is shaded (at its
      // size its whole face would be shaded and thrown away, wherever the depth test let it through)
      for (let i = Math.max(I2, ia), e = Math.min(NHD, ib); i < e; i++) {
        const Q = heads[i], W = Q.W, wxl = W.x1 - W.x0, wzl = W.z1 - W.z0;
        if (W.ship) {
          // beside her hull, from her bow cargo to her stern, sliding forward along her (the wind outruns her)
          const uz = wrap01(Q.fz - time * 0.022 * Q.v), side = Q.fx < 0.5 ? -1 : 1, x = SX + side * lerp(17, 36, Math.abs(Q.fx * 2 - 1)), z = houseZ + lerp(-150, 46, uz);
          const fade = shipOn * 0.74 * smoothstep(0, 0.18, uz) * (1 - smoothstep(0.8, 1, uz));
          hdP[i * 4] = x; hdP[i * 4 + 1] = fade > 0 ? hero.fog.surfaceAt(x, z) + 2 + 9.5 * Q.up * Q.up + 0.6 * Math.sin(time * 0.23 + Q.seed * 40) : 0; hdP[i * 4 + 2] = z; hdP[i * 4 + 3] = fade > 0 ? Q.s : 0;
          hdQ[i * 3] = fade; hdQ[i * 3 + 1] = Q.asp; hdQ[i * 3 + 2] = Q.seed;
          continue;
        }
        const ux = wrap01(Q.fx + ox * Q.v / wxl), uz = wrap01(Q.fz + oz * Q.v / wzl), x = W.x0 + ux * wxl, z = W.z0 + uz * wzl;
        let fade = smoothstep(0, 0.1, ux) * (1 - smoothstep(0.9, 1, ux)) * smoothstep(0, 0.14, uz) * (1 - smoothstep(0.86, 1, uz));
        // the long veils are thin, and none reaches across the sight line down the roadway to the portal (a streak is 2 s wide);
        // the streaks that hang in the valley stay below the truss, so the climb out of it looks down the bridge to the portal
        const bob = Math.sin(time * 0.23 + Q.seed * 40) * 1.5, asp = W.valley ? -Math.min(-Q.asp, 6.5 / Q.s) : Q.asp;      // down in the valley a streak is never thicker than 13 m
        let y = 0;
        if (W.rift) {
          const rk = fade > 0 ? hero.fog.riftAt(x, z) : 0;
          fade *= 0.66 * smoothstep(0.03, 0.26, rk) * (1 - 0.72 * smoothstep(0.5, 0.92, rk));
          if (fade > 0) y = lerp(hero.fog.surfaceAt(x, z) + 1.5 + 5 * Q.up, 6 + 20 * Q.up, smoothstep(0.22, 0.66, rk)) + bob;
        } else if (W.pour) {
          if (fade > 0) { y = Math.min(hero.fog.surfaceAt(x, z) + 5 + 12 * Q.up + bob, cableY(x) - 6 + Q.s * Q.asp); fade *= 0.5 * smoothstep(3, 11, camPos.y - (y - Q.s * Q.asp)); }      // its upper edge stays under the eye
        } else if (W.legs) {
          fade *= 0.8 * smoothstep(Q.s + 17, Q.s + 30, Math.abs(z)); y = deckY(x) + 1 + 13 * Q.up + bob;
        } else {
        if (!W.valley) fade *= 0.58 * (1 - (1 - smoothstep(-130, -60, x)) * (1 - smoothstep(Q.s + 24, Q.s + 38, Math.abs(z))));
        if (fade > 0) {
          const off = offRift(x, z);      // asked first: where it is nought (on the lane, round the ship's house, in a rift) the streak is unseen, and the sheet under it is not sampled
          if (!(off > 0)) fade = 0;
          else if (W.valley) {
            // a streak that dips into a head is cut along the sheet's facets (straight creases): it hovers clear of the highest
            // ground under its length, and its upper edge stays under the truss's foot and under the eye
            const hh = -Q.s * asp, ex = flow[0] * Q.s * 0.6, ez = flow[1] * Q.s * 0.6;
            const gnd = Math.max(hero.fog.surfaceAt(x, z), hero.fog.surfaceAt(x + ex, z + ez), hero.fog.surfaceAt(x - ex, z - ez)) + 1 + 0.85 * hh;
            const cap = deckY(x) - (W.floor ? 14 + hh : 16 + 0.8 * hh);
            y = Math.min(Math.max(W.floor ? gnd + 6 * Q.up + bob * 0.5 : deckY(x) - 30 + 14 * Q.up + bob, gnd), cap);
            fade *= (1 - smoothstep(0, 5, gnd - cap)) * off;
          } else { fade *= off; y = hero.fog.surfaceAt(x, z) + 2 + 11 * Q.up * Q.up + bob; }
        }
        }
        hdP[i * 4] = x; hdP[i * 4 + 1] = y; hdP[i * 4 + 2] = z; hdP[i * 4 + 3] = fade > 0 ? Q.s : 0;
        hdQ[i * 3] = W.floor ? fade * floorK : fade; hdQ[i * 3 + 1] = asp; hdQ[i * 3 + 2] = Q.seed;
      }
      for (let i = Math.max(NBIG, ia), e = Math.min(I1, ib); i < e; i++) {
        if (!(thirds >> i % 3 & 1)) continue;
        const Q = heads[i];
        let dx = Q.fx * TUL + ox - camPos.x, dz = Q.fz * TUL + oz - camPos.z; dx -= TUL * Math.round(dx / TUL); dz -= TUL * Math.round(dz / TUL);
        const x = camPos.x + dx, z = camPos.z + dz;
        // clear of the deck and of the route; in the valley they stand from a few metres outboard of the route
        const inV = x > -290 && x < 290, clr = inV ? smoothstep(Q.s * 0.8 + 7, Q.s * 0.8 + 22, valD(x, z)) * smoothstep(20, 36, Math.abs(x - SX)) : 1;
        const outb = smoothstep(Q.s * 0.8 + 5, Q.s * 0.8 + 17, z - 25) * smoothstep(-235, -160, x) * (1 - smoothstep(230, 290, x));
        // between the cables, where we come down the sweep high over the river's top, the small ones stand right under the flight
        const inCor = Q.s < 17 ? smoothstep(290, 345, x) * (1 - smoothstep(560, 620, x)) : 0;
        let fade = (1 - smoothstep(0.36, 0.49, Math.abs(dx) / TUL)) * (1 - smoothstep(0.36, 0.49, Math.abs(dz) / TUL)) * Math.max(smoothstep(Q.s + 17, Q.s + 32, Math.abs(z)), outb, inCor) * clr;
        if (fade > 0) fade *= offRift(x, z, Q.s);
        const ty = fade > 0 ? hero.fog.surfaceAt(x, z) + Q.s * Q.up : 0;
        hdP[i * 4] = x; hdP[i * 4 + 1] = ty; hdP[i * 4 + 2] = z; hdP[i * 4 + 3] = fade > 0 ? Q.s : 0;
        hdQ[i * 3] = fade * lerp(0.55, 0.85, valleyU); hdQ[i * 3 + 1] = Q.asp; hdQ[i * 3 + 2] = Q.seed;
      }
      for (let i = Math.max(I1, ia), e = Math.min(I2, ib); i < e; i++) {
        if (!(thirds >> i % 3 & 1)) continue;
        const Q = heads[i];
        let fade = 0, x = 0, z = 0;
        if (valleyU > 0) {
          let dx = Q.fx * TVL + ox - camPos.x, dz = Q.fz * TVL + oz - camPos.z; dx -= TVL * Math.round(dx / TVL); dz -= TVL * Math.round(dz / TVL);
          x = camPos.x + dx; z = camPos.z + dz;
          fade = valleyU * (1 - smoothstep(0.36, 0.49, Math.abs(dx) / TVL)) * (1 - smoothstep(0.36, 0.49, Math.abs(dz) / TVL)) * smoothstep(-330, -262, x) * (1 - smoothstep(140, 205, x))
            * Math.max(smoothstep(Q.s + 17, Q.s + 27, -z), smoothstep(Q.s + 6, Q.s + 14, z - 25), Q.s < 10 ? 0.92 : 0) * (Q.s < 9 ? 1 : smoothstep(Q.s * 0.5 + 2, Q.s * 0.5 + 10, valD(x, z))) * (Q.s < 10 ? smoothstep(0.85, 1.25, Math.hypot((x - SX) / 31, (z - houseZ - 6) / 40)) : smoothstep(21, 34, Math.abs(x - SX)));      // (the small ones stand over her fore deck and astern of her too: only her house stands clear)      // (the small ones stand under the route too: their tops are 8 m under the eye)
          if (fade > 0) fade *= offRift(x, z, Q.s);
        }
        hdP[i * 4] = x; hdP[i * 4 + 1] = fade > 0 ? hero.fog.surfaceAt(x, z) + Q.s * Q.up : 0; hdP[i * 4 + 2] = z; hdP[i * 4 + 3] = fade > 0 ? Q.s : 0;
        hdQ[i * 3] = fade; hdQ[i * 3 + 1] = Q.asp; hdQ[i * 3 + 2] = Q.seed;
      }
      for (let i = Math.max(0, ia), e = Math.min(NBIG, ib); i < e; i++) {
        const Q = heads[i], B = Q.B, wxl = B.x1 - B.x0, wzl = B.z1 - B.z0;
        const ux = wrap01(Q.fx + ox / wxl), uz = wrap01(Q.fz + oz / wzl), x = B.x0 + ux * wxl, z = B.z0 + uz * wzl;
        const tt = clamp(((x - B.ax) * B.dx + (z - B.az) * B.dz) / B.l2, 0, 1), dl = Math.hypot(x - B.ax - B.dx * tt, z - B.az - B.dz * tt);
        const edge = smoothstep(0, 0.1, ux) * (1 - smoothstep(0.9, 1, ux)) * smoothstep(0, 0.1, uz) * (1 - smoothstep(0.9, 1, uz));
        const zc = Q.s * 1.5 + 14 + 80 * smoothstep(-110, -230, x);
        let fade = edge * smoothstep(B.e0, B.e1, dl) * smoothstep(zc, zc + 26, Math.abs(z));      // clear of the route, of the deck, and of the sight line to the portal tower
        if (B === HB[0]) fade *= smoothstep(Q.s + 30, Q.s + 62, valD(x, z)) * smoothstep(Q.s * 0.6 + 20, Q.s * 0.6 + 50, Math.abs(x - SX));      // ... of the swing round the ship, and of her lane
        if (fade > 0) fade *= offRift(x, z, Q.s);
        hdP[i * 4] = x; hdP[i * 4 + 1] = fade > 0 ? hero.fog.surfaceAt(x, z) + Q.s * Q.up : 0; hdP[i * 4 + 2] = z; hdP[i * 4 + 3] = fade > 0 ? Q.s : 0;
        hdQ[i * 3] = fade; hdQ[i * 3 + 1] = Q.asp; hdQ[i * 3 + 2] = Q.seed;
      }
      hdPA.needsUpdate = true; hdQA.needsUpdate = true;
    };
    await ctx.yield();
    // mist standing along the near headland's shore, where the land rises out of the river
    {
      const pts = [];
      for (let k = 0; k < 15; k++) {
        const z = 240 + k * 62 + Rhead.range(-18, 18), y = fogTop + Rhead.range(-4, 10); let x = -1120, q = 0;
        for (; q < 40 && landH(x, z) < fogTop + 6; q++) x -= 22;
        if (q < 40) pts.push([x + 30, y, z]);
        if (k % 5 === 4) await ctx.yield();
      }
      if (pts.length) set.add(fx.makeMist({ rng: Rhead, time: T, positions: pts, size: [90, 170], color: new THREE.Color(look.fogLit).multiplyScalar(0.93), opacity: 0.5, flatten: 0.36 }));
      await ctx.yield();
      set.add(fx.makeMist({ rng: Rhead, time: T, positions: fallMist, size: [140, 250], color: new THREE.Color(look.fogLit).multiplyScalar(0.92), opacity: 0.5, flatten: 0.34 }));
      await ctx.yield();
    }
    // the portal as a beacon between the legs of the second tower, from the moment its clearing opens
    const beacon = set.add(fx.makeGlows({ positions: [[A.portalSeat.position.x + 2, pY, 0]], color: look.portal, size: 80, intensity: 0, time: T, core: 0.3, fogAmount: 0.2 }));
    await ctx.yield();
    // the gate's light lies on the road before it: a pool on the asphalt that the lane lines and the traffic run into
    // (added light: on the dark road it shows, and the cars stand in it)
    const dgU = { uCol: { value: new THREE.Color(look.portal).multiplyScalar(night ? 0.2 : 0.12) }, uK: { value: 0 } };      // (a pool on the last 40 m before the sill: the asphalt stays dark, the lines crisp)
    const deckGlow = new THREE.Mesh(new THREE.PlaneGeometry(150, 26).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: dgU, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `precision highp float; varying vec2 vP; uniform vec3 uCol; uniform float uK;
        void main() { float dx = (vP.x + 75.) / 24.; float a = exp(-dx * dx) * (1. - smoothstep(8.5, 12.8, abs(vP.y)));
          gl_FragColor = vec4(uCol * (a * uK), 1.); }`,
    }));
    deckGlow.position.set(A.portalSeat.position.x + 75, deckY(-600) + 0.45, 0); deckGlow.renderOrder = 0.4; deckGlow.name = 'gate-light-on-road';
    deckGlow.updateMatrixWorld(); scene.add(deckGlow);
    await ctx.yield();
    // ... the bay between the legs is lit round the opening, from the road to the first strut (blended, not added: light added
    // to white fog shows nothing): from 600 m the tower's foot is a lit doorway
    const bayU = { uCol: { value: night ? new THREE.Color(look.portal).multiplyScalar(1.25) : new THREE.Color('#ffb04a').multiplyScalar(0.95) }, uK: { value: 0 } };
    const bay = new THREE.Mesh(new THREE.PlaneGeometry(21.4, 31), new THREE.ShaderMaterial({
      uniforms: bayU, transparent: true, depthWrite: false, fog: false,
      vertexShader: `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `precision highp float; varying vec2 vP; uniform vec3 uCol; uniform float uK;
        void main() { float a = (1. - smoothstep(9., 10.7, abs(vP.x))) * (1. - smoothstep(13., 15.5, abs(vP.y)));
          gl_FragColor = vec4(uCol, clamp(a * uK, 0., 1.)); }`,
    }));
    bay.position.set(A.portalSeat.position.x + 0.9, deckY(-640) + 15.6, 0); bay.rotation.y = Math.PI / 2; bay.renderOrder = -0.62; bay.name = 'portal-bay';
    bay.updateMatrixWorld(); scene.add(bay);
    await ctx.yield();
    // kerb lights down both sides of the last 300 m of roadway, closer set and brighter toward the gate, and the lamps of
    // the fort, its pier and the sheds down in the rift
    // the arrival: the first tower's floodlights stand in the fog as a warm halo (it fades as we climb out of the fog)
    const floodGlow = set.add(fx.makeGlows({ positions: [[640, 92, 0], [640, 150, 0], [640, 206, 0]], sizes: [1, 0.8, 0.55], color: night ? '#ffc890' : '#ffb070', size: 250, intensity: 0, time: T, core: 0.12, fogAmount: 0.1 }));
    await ctx.yield();
    const kerb = [], kerbS = [];
    for (let x = -628; x < -330; x += 11.5) for (const z of [-12.7, 12.7]) { kerb.push([x, deckY(x) + 0.55, z]); kerbS.push(lerp(1.25, 0.7, (x + 628) / 298)); }
    const kerbGlow = set.add(fx.makeGlows({ positions: kerb, sizes: kerbS, color: night ? '#ffe2b0' : '#ffc27a', size: 3.4, intensity: 0, time: T, core: 0.8, fogAmount: 0.2 }));
    await ctx.yield();
    const frontGlow = set.add(fx.makeGlows({ positions: frontLamps, color: '#ffc27a', size: 10, intensity: night ? 2.2 : 0.8 + 1.2 * look.glow, time: T, core: 0.6, fogAmount: 0.25 }));
    await ctx.yield();
    HU.uPGc.value.set(look.portal).multiplyScalar(night ? 0.5 : 0.42);
    // the lighthouse's lamp and the mast's beacon
    const nearGlow = set.add(fx.makeGlows({ positions: nearLamps, colors: ['#fff0c4', '#ff4a30'], sizes: [1, 0.6], size: 46, intensity: 1.2, time: T, core: 0.5, fogAmount: 0.3 }));
    await ctx.yield();
    if (look.glow > 0) {
      set.add(fx.makeGlows({ positions: cityGlows, color: '#ffb46a', size: 640, intensity: 0.5 * look.glow, time: T, core: 0.2, fogAmount: 0.35 }));
      await ctx.yield();
    }

    // ---- gulls wheeling round both tower tops (kit)
    const faunaLight = F.lightFrom(scene);
    await ctx.yield();
    const fauna = F.makeFauna(scene, { light: faunaLight });
    await ctx.yield();
    // gullsA, the wheel round the first tower's top, which the route flies through, is kept off the flown line by place: the ring stands 16 m
    // over the line's top, its scatter in height is 8 m (a low wheel), it has a small wander of its own, maxSigma 3, and keepClear
    // with the route over the stretch round the tower. gullsB (the gate's tower) passes 84 m from the line and hands nothing
    const gullsA = fauna.add(F.makeFlock({ rng: Rbird, species: 'gulls', count: Math.max(8, Math.round(20 * density)), center: [640, 222, 8], radius: 74, spread: [34, 8, 210], lod: 'low', size: 3.8,
      wander: [2, 1.2, 2, 0.35], maxSigma: 3, keepClear: { path, dist: 2, step: 2, from: 0.15, to: 0.4 } }));
    await ctx.yield();
    const gullsB = fauna.add(F.makeFlock({ rng: Rbird, species: 'gulls', count: Math.max(8, Math.round(16 * density)), center: [-640, 200, 0], radius: 66, spread: [30, 20, 190], lod: 'low', size: 3.8 }));
    await ctx.yield();

    // ---- the flight
    const shipHouse = V3(840, 40, 276), ship0House = V3(-150, 50, 0), cradleP = A.cradle.clone();
    const uCr = clamp(path.nearestXZ(cradleX, 25).u, 0.45, 0.7);            // where we pass under the painters' cradle
    const uS = clamp(path.nearestXZ(SX + 6, 53).u, uCr + 0.04, 0.76);       // where we round the ship's stern
    const shipZ = (u) => -68 + (uS - u) * 220;                               // her funnel is 27 m short of our line as we cross it (we pass astern of it, upwind of her steam), the wheelhouse and mast already under the deck
    // the two gaze targets that move, as functions of u (the same places update() gives the two ships), so that a pose
    // reached by a jump looks where a flown one does
    const gazeA = V3(0, 0, 0), gazeB = V3(0, 0, 0);
    const shipHouseAt = (u) => { const D = 350 * u + 22; return gazeA.set(839.6 - 0.12 * D, 42, 275.9 - 0.993 * D); };
    const ship0HouseAt = (u) => (hero.ships[0] ? gazeB.set(SX, 55, shipZ(u) + 86) : gazeB.copy(ship0House));
    // the valley part of the route as a polyline, for keeping heads off it
    const VR = [];
    { const d0 = path.nearestXZ(250, 15).u * Ltot, d1 = path.nearestXZ(-252, 31).u * Ltot, q = V3(0, 0, 0);
      for (let k = 0; k <= 44; k++) { path.posAtDist(lerp(d0, d1, k / 44), q); VR.push(q.x, q.z); } }
    const valD = (x, z) => { let b = 1e9; for (let k = 0; k < VR.length; k += 2) { const dx = VR[k] - x, dz = VR[k + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const pace = (u) => {
      const p = 1.08 - 0.26 * (1 - smoothstep(0, 0.09, u)) + 0.14 * bell(u, 0.38, 0.1) - 0.5 * bell(u, uCr - 0.006, 0.06) - 0.2 * bell(u, uS - 0.02, 0.035);
      return lerp(p, 1, smoothstep(0.84, 0.92, u));
    };
    const camPos = V3(0, 0, 0), camFwd = V3(-1, 0, 0), prevFwd = V3(-1, 0, 0), bp = V3(0, 0, 0), bt = V3(0, 0, 0), br = V3(0, 0, 0), bu = V3(0, 0, 0), bb = V3(0, 0, 0), gp = V3(0, 0, 0);
    const wx = V3(0, 0, 0), wy = V3(0, 0, 0), wz = V3(0, 0, 0), wi = V3(0, 0, 0), wt = V3(0, 0, 0), M = new THREE.Matrix4(), ML = new THREE.Matrix4(), Y = V3(0, 1, 0);
    let bank = 0, pull = 0, first = true, mistY = fogTop + 4, shImm = 0, building = true, headU = -1, headT = -1e9;
    const hazeC = new THREE.Color(look.haze);
    const hx = Math.max(Math.hypot(SUN.x, SUN.z), 1e-3), shFade = smoothstep(0.1, 0.3, SUN.y);
    const putBird = (i, p, t, roll, sc) => {
      br.crossVectors(t, Y); if (br.lengthSq() < 1e-6) br.set(0, 0, -1); br.normalize();
      bu.crossVectors(br, t).normalize();
      bu.multiplyScalar(Math.cos(roll)).addScaledVector(br, Math.sin(roll)); br.crossVectors(t, bu).normalize();
      bb.copy(t).multiplyScalar(-1);
      M.makeBasis(br, bu, bb); if (sc !== 1) M.scale(wt.set(sc, sc, sc)); M.setPosition(p);
      pelicans.setMatrixAt(i, M);
    };
    const putShadow = (i, p, t, strength, size = 1.9) => {
      let a = 0, h = fogTop, hgt = 0, sx = p.x, sz = p.z, y = 0;
      for (let k = 0; k < 2; k++) { const s = Math.max(p.y - h, 0) / SUN.y; sx = p.x - SUN.x * s; sz = p.z - SUN.z * s; h = hero.fog.heightAt(sx, sz); }
      hgt = p.y - h; y = h + hero.fog.liftAt(sx, sz) + 2.2;
      let seen = (1 - shImm) * smoothstep(6, 25, camPos.y - y);
      const dk = deckY(p.x);
      if (p.y > dk + 0.5) {                                   // over the roadway the shadow lies on the road, where the deck stands clear of the fog
        const s = (p.y - dk) / SUN.y, dx = p.x - SUN.x * s, dz = p.z - SUN.z * s;
        if (Math.abs(dz) < 14.4 && Math.abs(dx) < 1350 && hero.fog.heightAt(dx, dz) < deckY(dx) - 1) { sx = dx; sz = dz; y = deckY(dx) + 0.22; hgt = p.y - dk; seen = smoothstep(2.5, 8, camPos.y - y); }
      }
      if (hgt > 0.5 && strength > 0) a = look.shadowA * shFade * strength * seen * (1 - smoothstep(60, 220, hgt)) / (1 + hgt * 0.006);
      shA[i * 2] = a; shA[i * 2 + 1] = smoothstep(10, 110, hgt);
      const sc = a > 0 ? size * (1 + hgt * 0.022) : 0;
      br.set(-t.z, 0, t.x); if (br.lengthSq() < 1e-6) br.set(0, 0, 1); br.normalize(); bb.set(-br.z, 0, br.x);
      M.makeBasis(br, Y, bb).scale(wt.set(sc, 1, sc)); M.setPosition(sx, y, sz);
      shadows.setMatrixAt(i, M);
    };

    function update(dt, time, camera, u) {
      const onPath = u > 0, dist = u * Ltot;
      T.value = time;
      camPos.setFromMatrixPosition(camera.matrixWorld);
      camFwd.set(0, 0, -1).transformDirection(camera.matrixWorld);

      // the bridge, its fog valley, both ships
      const D = 350 * u + 22;                                  // (22 m further on than she lay: her funnel stands whole inside the first frames, not cut by their edge)
      hero.setShip(1, 830.7 - 0.12 * D, 202.4 - 0.993 * D, 0.12);
      shipHouse.set(839.6 - 0.12 * D, 42, 275.9 - 0.993 * D);
      hero.setProgress(u);
      hero.setShip(0, SX, shipZ(u), 0);
      hero.setGap(gap.x, gap.z, gap.r, smoothstep(0.16, 0.4, u));
      HU.uFg2.value.x = lerp(1.05, gapThr, smoothstep(0.1, 0.36, u));
      hero.setGap2(-480, 5, 330, smoothstep(0.44, 0.62, u));                  // the clearing round the portal tower opens early: the portal is a beacon for the last third
      // thin for the first seconds: the ship and the first tower loom as silhouettes. Thinner and warmer still while the
      // world is only seen through the portal before it (u = 0), so the opening shows vermilion, beacons and a sun patch
      HU.uFg2.value.z = lerp(lerp(0.0011, 0.0034, smoothstep(0.004, 0.034, u)), 0.022, smoothstep(0.038, 0.085, u));
      // the rifts open while we are still blind in the fog (closed while the world is only seen through the portal before it)
      { const rk = onPath ? smoothstep(0.02, 0.06, u) : 0, on = rk > 0.001; HU.uRiftK.value = rk; for (const m of riftThings) m.visible = on; }
      // the arrival is warm against cool: the tower's floodlights, the ship's windows and the deck lamps burn through the
      // fog for the first seconds (all three ease back to the look's own levels before we climb out of it)
      { const k = 1 - smoothstep(0.03, 0.085, u);
        HU.uLamps.value.z = lampZ0 + (u > 0 ? 1.7 : 2.2) * (1 - smoothstep(0.0, 0.075, u));
        HU.uLamps.value.x = lampX0 * (1 + 1.6 * k); HU.uLamps.value.y = lampY0 + (night ? 0.3 : 1.1) * k; }
      DU.uGlowC.value.copy(glowC).multiplyScalar(lerp(1.7, 1, smoothstep(0, 0.05, u)));
      // ... and cool against warm: for the blind seconds the fog is a deeper blue under a luminous top, the tower's floodlights a halo in it
      const inK = 1 - 0.3 * smoothstep(0.012, 0.045, u) * (1 - smoothstep(0.055, 0.085, u));
      HU.uInK.value = inK; floodGlow.uniforms.uIntensity.value = (night ? 0.6 : 0.85) * (1 - smoothstep(0.035, 0.085, u));
      { const hd = Math.abs(camPos.x - A.portalSeat.position.x), seen = smoothstep(uS - 0.05, uS + 0.03, u), close = smoothstep(60, 240, hd);
        beacon.uniforms.uIntensity.value = (night ? 1 : 0.5) * (0.55 + 0.75 * (1 - smoothstep(0.72, 0.84, u))) * smoothstep(0.5, 0.62, u) * (1 - smoothstep(0.9, 0.97, u));
        bayU.uK.value = 0.85 * smoothstep(uS - 0.02, uS + 0.05, u) * smoothstep(120, 420, hd);
        dgU.uK.value = seen; kerbGlow.uniforms.uIntensity.value = (night ? 2.4 : 1.5) * seen * (0.85 + 0.15 * Math.sin(time * 2.1));
        HU.uPG.value.set(A.portalSeat.position.x, 0, 175, 0.75 * seen * (0.5 + 0.5 * close)); }
      { const fl = Math.max(Math.sin(time * 0.8), 0), f2 = fl * fl; nearGlow.uniforms.uIntensity.value = (night ? 2.2 : 1.1) * (0.35 + 0.65 * f2 * f2) * (1 - smoothstep(0.3, 0.8, hero.fog.immersion)); }
      hero.update(dt, time, camera);
      const imm = hero.fog.immersion, s0 = hero.ships[0]; shImm = imm;
      if (s0) { ship0House.set(s0.position.x, 55, s0.position.z + 86); const ch = Math.cos(s0.rotation.y), sh = Math.sin(s0.rotation.y); steam.uniforms.uBase.value.set(s0.position.x + FT.x * ch + FT.z * sh, FT.y, s0.position.z - FT.x * sh + FT.z * ch); }
      if (s0) {
        setBoat(0, null, s0.position.x, s0.position.z, s0.rotation.y, time, 15, 300, 118);
      }
      setBoat(2, pilot, lerp(RIFTS[0][0] + 110, RIFTS[0][0] - 120, smoothstep(0.42, 0.8, u)), RIFTS[0][1] - 30, Math.PI / 2, time, 3.6, 62, 7);
      setBoat(1, ferryA, lerp(RIFTS[1][0] + 120, RIFTS[1][0] - 130, smoothstep(0.2, 0.6, u)), RIFTS[1][1] + 30, Math.PI / 2, time, 4.6, 85, 18);
      setBoat(3, tug, lerp(RIFTS[3][0] + 62, RIFTS[3][0] - 50, smoothstep(0.6, 1, u)), RIFTS[3][1] + 24, Math.PI / 2, time, 3.4, 60, 6);      // (every vessel keeps to the open water: under a rift's wall it would hang in the veils)
      WTU.uSea.value.w = 1 - smoothstep(0.1, 0.16, u);
      setBoat(4, ferryB, lerp(RIFTS[2][0] + 112, RIFTS[2][0] + 46, smoothstep(0.55, 1, u)), RIFTS[2][1] - 40, Math.PI / 2 - 0.12, time, 4.6, 85, 18);
      if (u < 0.13) { const s1 = hero.ships[1]; setBoat(4, null, s1 ? s1.position.x : 1e5, s1 ? s1.position.z : 1e5, 0.12, time, 15, 260, 118); }      // ... but while we are beside ship 1 the slot draws her wake (the ferry at the gate is far out of sight)
      for (let i = 0; i < sailSets.length; i++) { const m = sailSets[i], q = m.userData.q; m.position.set(q[0] + 7 * Math.sin(time * 0.05 + i * 2), 0.1 * Math.sin(time * 0.8 + i), q[1] + 5 * Math.sin(time * 0.037 + i)); m.rotation.z = 0.03 * Math.sin(time * 0.6 + i * 1.3); }
      if (barque && s0) { barque.position.copy(s0.position); barque.rotation.set(Math.sin(time * 0.31) * 0.012, 0, Math.sin(time * 0.43 + 1) * 0.02); }

      sky.update(dt, time, camera); rig.update(dt, time, camera);
      fauna.update(dt, time, camera, u);
      const gullsOn = imm < 0.7; gullsA.object.visible = gullsOn; gullsB.object.visible = gullsOn;

      // inside the fog
      const sunny = smoothstep(-16, 6, camPos.y - HU.uCamH.value);
      DU.uMidC.value.lerpColors(fogIn, fogOut, sunny).multiplyScalar(lerp(inK, 1, sunny));
      DU.uTopC.value.lerpColors(DU.uMidC.value, fogLitC, 0.75 + 0.1 * sunny);
      DU.uLowC.value.lerpColors(DU.uMidC.value, fogShadeC, 0.3).multiplyScalar(lerp(1, 0.62, smoothstep(0.012, 0.045, u)));
      DU.uImm.value = smoothstep(0.1, 0.9, imm) * lerp(0.62, 1, smoothstep(0.022, 0.055, u));
      DU.uDrift.value.set(camPos.x * 0.03 + time * 0.5, camPos.y * 0.03, camPos.z * 0.03 + time * 0.34);
      scene.fog.color.lerpColors(hazeC, DU.uMidC.value, DU.uImm.value);
      { const valley = smoothstep(0.43, 0.48, u) * (1 - smoothstep(0.69, 0.74, u));
        const mt = lerp(Math.min(hero.fog.heightAt(camPos.x + camFwd.x * 70, camPos.z + camFwd.z * 70) + 5, camPos.y - 9), camPos.y - 7, valley) - 22 * smoothstep(0.72, 0.8, u), md = mt - mistY;
        mistY = dt > 0 ? mistY + md * (1 - Math.exp(-dt * (1.5 + Math.abs(md) * 0.2))) : mt; }   // wisps on the fog ahead, never above the eye
      mist.uniforms.uCenter.value.y = mistY; mist.object.visible = imm < 0.5;
      mist.uniforms.uOpacity.value = 0.2 * (1 - smoothstep(0.41, 0.47, u) * (1 - smoothstep(0.7, 0.76, u)));
      dome.position.copy(camPos);
      drops.setOpacity(1.1 * imm);
      set.update(dt, time, camera);
      putTumble(time); putPour(time);
      HV.value = 1 - smoothstep(0.08, 0.5, imm);
      if (!building) {                       // build() places them itself, in steps, right after its one call of update()
        const jump = Math.abs(u - headU) > 0.004 || Math.abs(time - headT) > 0.25;      // a held frame or a cut: every one of them, at once
        // the tuft lattices take turns by the clock, a third to each sixtieth of a second: the thirds whose turn has passed since
        // the last frame (one a frame at 60 frames a second, all three at 20, none on some frames of a faster screen), and
        // every one of them while the clock stands (they are functions of the time, the place and the eye: nothing moves);
        // the turn changes half a sixtieth off the whole ones: a clock that began at 0 and steps by whole sixtieths never stands on the change
        const n0 = Math.floor(headT * 60 + 0.5), n1 = Math.floor(time * 60 + 0.5), due = n1 - n0, m = (n1 % 3 + 3) % 3;
        headU = u; headT = time;
        // while the eye is so deep in the fog that the heads' shader draws none of them (it multiplies every one by HV) only the
        // two tuft lattices are asked for, so that they keep their turns; the wisps, the veils and the big heads are placed whole
        // on every call and keep nothing from one frame to the next: they lie unplaced until the first frame that can show one
        putHeads(time, u, HV.value === 0 ? NBIG : 0, HV.value === 0 ? I2 : NHD, jump || !(dt > 0) || due < 0 || due > 2 ? 7 : due === 0 ? 0 : due === 1 ? 1 << m : 7 ^ 1 << (m + 1) % 3);
      }

      // the line ahead: strung out along the route and to the left, threading the portal before us
      // it changes sides as the flight goes (right of us in the fog and between the cables, left along the truss and past
      // the ship, right again down the roadway), rides above the eye line between the cables and drops back below it, and
      // runs further ahead on the long reaches: never the same place in the frame for long
      const between = smoothstep(0.26, 0.32, u) * (1 - smoothstep(0.44, 0.5, u)), roadU = smoothstep(0.76, 0.82, u);
      const sideU = 1 - 2 * smoothstep(0.075, 0.13, u) + 2 * smoothstep(0.3, 0.36, u) - 2 * smoothstep(0.455, 0.51, u) + 2 * smoothstep(0.7, 0.76, u);      // (it keeps to the left through the first tower: beside the far tower, not on it)
      const aheadU = 14 + 5 * between + 7 * smoothstep(0.54, 0.6, u) * (1 - smoothstep(0.7, 0.76, u)) + 9 * smoothstep(0.72, 0.8, u) * (1 - smoothstep(0.88, 0.95, u));
      const towerK = smoothstep(0.15, 0.19, u) * (1 - smoothstep(0.29, 0.33, u)), lowU = smoothstep(0.56, 0.6, u) * (1 - smoothstep(0.7, 0.74, u));
      const tight = 1 - Math.max(0.68 * between, 0.55 * smoothstep(0.68, 0.74, u), 0.9 * towerK);          // close in through the tower and inside the bridge (the line stays between the two curtains of suspenders)
      for (let i = 0; i < NL; i++) {
        const d = dist + aheadU + i * 8.5, ub = d / Ltot, latK = (1 - 0.9 * smoothstep(0.88, 0.96, ub)) * tight;
        path.posAtDist(d, bp); path.tangentAtDist(d, bt);
        br.crossVectors(bt, Y).normalize();
        bp.addScaledVector(br, sideU * ((5 - 1 * towerK) * (1 - 0.95 * smoothstep(0.84, 0.93, ub)) + (4.2 + 2.3 * i) * latK) + 0.7 * Math.sin(time * 0.31 + i * 1.3));      // an echelon to one side, off the axis: the line recedes toward where we are going
        bp.y += lerp(-1.3 - 2.2 * towerK - (2.1 + 0.42 * i) * latK - 0.1 * i, -6 - 0.4 * i, between) - 3.5 * lowU - 3 * roadU * (1 - smoothstep(0.93, 0.985, ub)) + 2.5 * smoothstep(0.72, 0.75, u) * (1 - smoothstep(0.79, 0.82, u)) + 0.45 * Math.sin(time * 0.7 - i * 0.8);      // ahead and below: their backs to the eye
        if (lowU > 0) bp.y = Math.max(bp.y, hero.fog.surfaceAt(bp.x, bp.z) + 3 - 30 * (1 - lowU));      // past the ship the line rides low and outboard, skimming the valley floor's heads
        const sc = 1.3 * (1 - smoothstep(Ltot - 9, Ltot - 1.5, d));
        putBird(i, bp, bt, 0.14 * Math.sin(time * 0.5 - i * 0.8), sc);
        putShadow(i, bp, bt, Math.min(sc, 1));
      }
      putShadow(NL, camPos, camFwd, onPath ? 1 : 0);
      // the first far line keeps us company: it flies the length of the bridge on our left, low over the river, a little
      // slower than we dive, so that we draw level with it along the cable and its seven shadows race over the heads between
      // it and the eye (our own shadow falls behind the deck all the way). Placed by u, so it is there on every visit.
      path.posAtDist(dist, gp);
      const gAhead = lerp(150, 70, smoothstep(0.2, 0.45, u)) + 400 * smoothstep(0.47, 0.9, u), gLat = lerp(60, 34, smoothstep(0.2, 0.45, u)) + 150 * smoothstep(0.47, 0.8, u);
      for (let g = 0; g < groups; g++) {
        const G = far[g], s = ((time * G.v + G.off) % 2400) - 1200;
        if (g === 0) bt.set(-1, 0, 0); else bt.set(G.dx, 0, G.dz);
        for (let k = 0; k < NG; k++) {
          const a = s - k * 7.5, l = k * 2.4 * G.side, bobY = 0.9 * Math.sin(time * 0.5 + k * 0.6 + g);
          if (g === 0) {
            // skimming: 8 m over whatever head is under each bird, so its shadow lies close beside it
            const bx = gp.x - gAhead + k * 7.5 + 1.2 * Math.sin(time * 0.21 + k), bz = 23 + gLat + k * 2.6 + 1.5 * Math.sin(time * 0.17 + k * 0.9);
            const yT = Math.max(skimBase, hero.fog.surfaceAt(bx, bz) + 8);
            skimY[k] = dt > 0 && skimY[k] > 0 ? skimY[k] + (yT - skimY[k]) * (1 - Math.exp(-dt * 2.2)) : yT;
            bp.set(bx, skimY[k] + 0.5 * bobY, bz);
          } else { bp.set(G.cx + G.dx * a - G.dz * l, G.alt + bobY, G.cz + G.dz * a + G.dx * l); bp.y = Math.max(bp.y, nearIsleY(bp.x, bp.z) + 16); }
          putBird(NL + g * NG + k, bp, bt, 0.1 * Math.sin(time * 0.4 + k), 1.3);
          putShadow(NL + 1 + g * NG + k, bp, bt, g === 0 ? 1.3 : 1, g === 0 ? 2.6 : 1.9);
        }
      }
      pelicans.instanceMatrix.needsUpdate = true; shadows.instanceMatrix.needsUpdate = true; shGeo.getAttribute('aA').needsUpdate = true;

    }
    const cam0 = new THREE.PerspectiveCamera(62, ctx.aspect || 16 / 9, 0.4, 9000);
    path.frameAt(0, cam0.matrix); cam0.matrix.decompose(cam0.position, cam0.quaternion, cam0.scale); cam0.updateMatrixWorld(true);
    await ctx.yield();
    update(0, 0, cam0, 0);
    for (let i = 0; i < NHD; i += 100) { await ctx.yield(); putHeads(0, 0, i, i + 100); }
    building = false;
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration, pace,
      title: (rare ? 'A Barque under ' : '') + look.title,
      ride: 'none',
      camera: { fov: 62, near: 0.4, far: 9000, lookAhead: 40, sway: 0.7, bank: 0.5 },
      pois: [
        { at: (time, u) => shipHouseAt(u), from: 0.0, to: 0.06, weight: 0.55 },
        { at: V3(640, 156, 0), from: 0.09, to: 0.19, weight: 0.5 },
        { at: V3(-640, 120, 0), from: 0.24, to: 0.385, weight: 0.3 },
        { at: V3(nearLamps[0][0], nearLamps[0][1] - 30, nearLamps[0][2]), from: 0.385, to: 0.475, weight: 0.55 },      // a look out through the bay-side curtain of suspenders at the lighthouse island
        { at: cradleP, from: uCr - 0.085, to: uCr + 0.012, weight: 0.7 },
        { at: (time, u) => ship0HouseAt(u), from: uCr + 0.025, to: uS - 0.004, weight: 0.6 },
        { at: V3(-640, 92, 0), from: uS + 0.02, to: 0.88, weight: 0.8 },
      ],
      portal: { shape: 'arch', width: 18.5, height: 25, color: look.portal, glow: 1, revealDistance: 900 },
      post: {
        exposure: look.exposure,
        bloom: { strength: look.bloom, radius: 0.6, threshold: 0.9 },
        grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadow, vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); sky.dispose(); },
    };
});
