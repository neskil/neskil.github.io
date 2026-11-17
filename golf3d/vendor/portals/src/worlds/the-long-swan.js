// THE LONG SWAN: a steamboat race seen as the judge's photo-finish strip, built in the round.
// +Z is the course and is also time. Whatever stood on the line is a ribbon of constant section running to the
// vanishing point (levees, willows, sheds, bunting, clouds, a skiff that never ends); whatever raced is modelled
// whole (our steamer, the rival, kingfisher dashes) and its length is film speed over its own speed; turning
// things curl (spokes are commas); and a swan that dawdled over the line is a white ridge half a kilometre long.
// Seven flat inks, no light, no tone map (post.flat): the style kit is exported by ../parts/the-long-swan.js.
// The steamer is the world's own mesh, placed from u (ride: 'none'). Scripted events are functions of u; only the
// streaming of the wobbles and the wheels use time.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeStyle, stripMaterial, hairMaterial, StripGeo, sweep, hairGeoY, STYLE_GLSL, INK, FLOW, filmSwell } from '../parts/the-long-swan.js';

const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const HX = 8, HZ = 540, LINE_Z = 930, POSTX = 23, RIVALX = -56;          // the swan's place; the finish line
const LIV = 9, TRIM = 10;                       // crosser inks chosen per boat: stack livery, wheel trim

const PALETTES = {
  june: ['#FBFAF4', '#6DB7E8', '#4E8C86', '#D9BC6E', '#35704A', '#D9382C', '#23262B'],
  october: ['#FBFAF4', '#7FBCE2', '#587C8C', '#D9BC6E', '#C79A2B', '#D9382C', '#23262B'],
  poster: ['#FBFAF4', '#E6C96E', '#2C5C9C', '#7CC0EA', '#35704A', '#D9382C', '#23262B'],
};

// rings along z: spacing d, always landing on both ends
// a polyline cut into pieces no longer than d, so a hairline's pixel width is worked out near where it is seen
const subdiv = (L, d) => { const P = L.pts, out = [P[0]]; for (let k = 1; k < P.length; k++) { const a = P[k - 1], b = P[k], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / d)); for (let m = 1; m <= n; m++) out.push([a[0] + (b[0] - a[0]) * m / n, a[1] + (b[1] - a[1]) * m / n, a[2] + (b[2] - a[2]) * m / n]); } return { ...L, pts: out }; };
const rings = (z0, z1, d) => { const n = Math.max(1, Math.round((z1 - z0) / d)), a = []; for (let i = 0; i <= n; i++) a.push(z0 + (z1 - z0) * i / n); return a; };

export default {
  id: 'the-long-swan',
  name: 'The Long Swan',
  category: 'bizarre',
  weirdness: 0.7,
  media: ['water', 'open'],
  async build(ctx) {
    const vary = ctx.vary || {}, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const vr = ctx.rng.fork ? ctx.rng.fork('edition') : ctx.rng;
    // ---- the edition, chosen once
    const wRoll = vr(), cRoll = vr(), castRoll = vr(), craftRoll = vr(), livRoll = vr();
    const weather = wRoll < 0.46 ? 'fair' : wRoll < 0.74 ? 'breeze' : 'overcast';
    const colourway = cRoll < 0.45 ? 'june' : (cRoll < 0.53 || cRoll > 0.84) ? 'october' : 'poster';
    const golden = vary.hour === 'golden' || (vary.hour !== 'day' && vary.hour !== 'dawn' && vr() < 0.22);
    const sternWheel = castRoll < 0.3, craft = craftRoll < 0.45 ? 'skiff' : craftRoll < 0.75 ? 'punt' : 'raft';
    const rivalLivery = livRoll < 0.5 ? INK.red : livRoll < 0.75 ? INK.straw : INK.teal;
    const rare = !!vary.rare;
    const pal = PALETTES[colourway];
    const paleHex = golden ? '#F3EAD0' : weather === 'overcast' ? '#EDF0EE' : '#EEF4F1';
    const style = makeStyle(pal, { pale: paleHex, far: weather === 'overcast' ? 760 : 950, wobble: weather === 'breeze' ? 1.75 : 1 });
    const rng = ctx.rng.fork ? ctx.rng.fork('strip') : ctx.rng;
    const scene = new THREE.Scene();
    scene.background = style.pale.clone();
    // Everything is designed with the swan on the +X side of the lane; looking down +Z, +X is the viewer's LEFT, and the
    // brief has the flank to starboard, so the whole design is mirrored once here and the path is mirrored to match.
    const root = new THREE.Group(); root.name = 'long-swan-world'; root.scale.x = -1; scene.add(root);

    // ---- the hero: 500 m of swan along the middle of the river
    const hero = await buildHero(ctx, { palette: pal, detail, zWorld: HZ, style, autoGust: false, rise: rare });
    hero.object.position.set(HX, 0, HZ); root.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, crownW = A.underNeck.x + HX;   // world x of the lane under the neck (about -14)

    // ---- the path: almost straight, 930 m, upper deck 11.6 m, bow 6.5 m, 8 m under the neck and through the hoop
    const path = makePath([   // design coordinates; x is mirrored into world space just below
      [-17, 11.6, 0], [-17, 11.6, 70], [-17, 11.6, 150], [-17, 11.6, 205], [-16.8, 11.3, 234], [-16.4, 8.7, 263], [-16, 6.7, 292],
      [-15.6, 6.5, 330], [-14.8, 6.5, 430], [-13.5, 6.5, 550], [-13.5, 6.5, 690], [(crownW - 13.5) / 2, 7.1, 728], [crownW, 8, 759],
      [crownW, 8, 840], [crownW, 8, 885], [crownW, 8, LINE_Z],
    ].map((q) => [-q[0], q[1], q[2]]));
    const _p = new THREE.Vector3();
    const camAt = (u) => { path.pointAt(sat(u), _p); _p.x = -_p.x; return _p; };   // the camera in design space
    // our steamer: camera at her stern rail at u 0, at her bow from u 0.31, off it at u 0.785
    const bowRel = (u) => 8.6 + 48.4 * Math.pow(1 - sat(u / 0.31), 1.15) - 70 * sstep(0.785, 0.9, u) * sstep(0.785, 0.9, u);
    const boatOff = (u) => lerp(-3.35, -1.3, sstep(0.22, 0.33, u)) - 0.65 * sstep(0.015, 0.05, u) * (1 - sstep(0.105, 0.15, u));   // her centreline, from the camera's x; she edges to port under us while the wheel passes, so we stand at the gangway's lip
    // the rival: her bow slips back at a steady rate while she tires and her length (film speed over own speed) grows
    const rivalLen = (u) => lerp(1, 2.08, sstep(0.1, 0.34, u));
    const rivalBowRel = (u) => 150 - 110 * u + 22 * sstep(0.33, 0.43, u) - 2200 * Math.max(0, u - 0.45) ** 2;

    const strip = stripMaterial(style, { zOffset: 0 });
    const hair = hairMaterial(style);
    const hairs = [];                         // world scratches, gathered and built once
    const B = () => new StripGeo();
    const addStrip = async (b, name) => { const m = new THREE.Mesh(await b.buildY(ctx), strip); m.name = name; m.frustumCulled = false; root.add(m); return m; };
    const info = { weather, colourway, golden, sternWheel, craft, rare, black: hero.info.black };

    // ---- material 2, the river: one plane, sine-edged bands of three tones drawn in the fragment shader
    const GUST_GLSL = /* glsl */`
      float gustAt(float z) { float g = 0.0; for (int i = 0; i < 4; i++) { float d = (z - uGust[i].x) / max(uGust[i].z, 1.0); g += uGust[i].y * exp(-d * d); } return g; }`;
    const riverMat = new THREE.ShaderMaterial({
      uniforms: { uTime: style.uniforms.uTime, uFlow: style.uniforms.uFlow, uWobble: style.uniforms.uWobble, uGust: style.uniforms.uGust,
        uInk: style.uniforms.uInk, uDeep: style.uniforms.uDeep, uPale: style.uniforms.uPale, uFar: style.uniforms.uFar, uSeed: { value: rng.range(0, 50) } },
      vertexShader: /* glsl */`
        varying vec3 vW; varying float vDist;
        void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vDist = distance(wp.xyz, cameraPosition); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uFlow, uWobble, uSeed; uniform vec3 uInk[9]; uniform vec3 uDeep[9]; uniform vec3 uGust[4];
        varying vec3 vW; varying float vDist;
        ${STYLE_GLSL.fragment}
        ${GUST_GLSL}
        float h1(float n) { return fract(sin(n * 127.1 + uSeed) * 43758.5453); }
        void main() {
          float fw = fwidth(vW.x) * 0.75 + 1e-4, zz = vW.z + uFlow * uTime, dist = distance(vW, cameraPosition);
          float x = vW.x + gustAt(vW.z) * 2.6;
          float wide = 1.0 + dist / 300.0;
          vec3 col = uInk[2];
          for (int i = 0; i < 6; i++) {            // the broad bands: where the current ran
            float fi = float(i);
            float c = -104.0 + 41.0 * fi + 10.0 * (h1(fi + 3.0) - 0.5) + (2.5 + 3.5 * h1(fi)) * uWobble * sin(zz * 6.2831853 / (70.0 + 60.0 * h1(fi + 9.0)) + 6.2831853 * h1(fi + 5.0));
            float hw = (1.6 + 3.6 * h1(fi + 17.0)) * wide * (0.72 + 0.28 * sin(zz * 6.2831853 / (130.0 + 50.0 * h1(fi + 2.0)) + fi));
            float a = 1.0 - smoothstep(hw - fw, hw + fw, abs(x - c));
            float m = mod(fi, 3.0);
            vec3 tone = m < 0.5 ? uDeep[2] : (m < 1.5 ? uInk[8] : mix(uInk[2], uDeep[2], 0.55));
            col = mix(col, tone, a);
          }
          // ripple lozenges: short bands that begin and end, one per 9 m lane of water, plain water between them
          float cell = floor(x / 6.5), hc = h1(cell * 1.7 + 40.0), hd = h1(cell * 2.3 + 71.0);
          float rc = (cell + 0.5) * 6.5 + 2.4 * (hc - 0.5) + 0.7 * uWobble * sin(zz * 6.2831853 / (26.0 + 30.0 * hd) + 6.2831853 * hc);
          float life = max(0.0, sin(zz * 6.2831853 / (70.0 + 90.0 * hc) + 6.2831853 * hd) - 0.05) / 0.95;
          float rw = (0.28 + 0.6 * hd) * wide * sqrt(life);
          float ra = (1.0 - smoothstep(rw - fw, rw + fw, abs(x - rc))) * step(1e-3, life) * (1.0 - smoothstep(380.0, 800.0, dist));
          col = mix(col, hc < 0.55 ? uInk[8] : uDeep[2], ra);
          gl_FragColor = vec4(stripFar(col, dist), 1.0);
        }`,
    });
    const river = new THREE.Mesh(new THREE.PlaneGeometry(262, 2900, 1, 1).rotateX(-Math.PI / 2), riverMat);
    river.position.set(0, 0, 1000); river.frustumCulled = false; river.name = 'river'; root.add(river);

    // ---- material 6, the sky: one flat poster blue, paling only toward the horizon as everything far does
    const skyCol = new THREE.Color(pal[1]); if (weather === 'overcast') skyCol.lerp(style.pale, 0.45);   // quieter, but still a ground a white bird stands on
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uSky: { value: skyCol }, uPale: style.uniforms.uPale, uFar: style.uniforms.uFar },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() { vDir = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSky; varying vec3 vDir;
        ${STYLE_GLSL.fragment}
        void main() {
          float e = vDir.y / max(length(vDir), 1e-4);
          float d = 22.0 / max(e, 0.006);     // the pale band hugs the vanishing line, so the ridge and the neck stand on flat blue
          gl_FragColor = vec4(e > 0.0 ? stripFar(uSky, max(d - 330.0, 0.0) * 1.15) : uPale, 1.0);
        }`,
      side: THREE.BackSide, depthWrite: false, depthTest: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 24, 16), skyMat);
    sky.renderOrder = -1; sky.frustumCulled = false; sky.name = 'sky'; scene.add(sky);
    await ctx.yield();

    // ---- material 1, the strip: every still thing is a profile swept along z (world coordinates)
    const rib = (b, bands, z0, z1, o = {}) => sweep(b, bands, rings(z0, z1, o.step ?? 6), { zWorld: 0, ...o });
    const mirror = (bands) => bands.map((bd) => ({ ...bd, pts: bd.pts.map((p) => [-p[0], p[1]]).reverse() }));
    const W = (ax, ay, lam, ph) => [ax, ay, lam, ph ?? rng.range(0, TAU)];
    // levees and the fields behind them: plain, broad, in two greens and straw
    {
      const b = B();
      const left = [
        { pts: [[-1500, 2.2], [-640, 2.6]], ink: INK.straw }, { pts: [[-640, 2.6], [-380, 3]], ink: INK.willow },
        { pts: [[-380, 3], [-262, 3.2]], ink: INK.straw }, { pts: [[-262, 3.2], [-172, 3.4]], ink: INK.willow },
        { pts: [[-172, 3.4], [-140, 8]], ink: INK.willow }, { pts: [[-140, 8], [-130.5, 8]], ink: INK.straw },
        { pts: [[-130.5, 8], [-124.5, 3.4]], ink: INK.willow }, { pts: [[-124.5, 3.4], [-119.5, -0.6]], ink: INK.straw },
      ];
      rib(b, left, -400, 2400, { step: 50, taper0: 0, taper1: 0, zWorld: null });
      rib(b, mirror(left), -400, 2400, { step: 50, taper0: 0, taper1: 0, zWorld: null });
      await addStrip(b, 'levees');
      for (const sg of [-1, 1]) {
        hairs.push({ pts: rings(-300, 1500, 60).map((z) => [sg * 130.9, 9.15, z]), width: 0.24, ink: INK.white, ground: INK.willow });
        hairs.push({ pts: rings(-300, 1500, 60).map((z) => [sg * 130.4, 8.02, z]), width: 0.12, ink: INK.soot, ground: INK.straw });
        hairs.push({ pts: rings(-300, 1500, 60).map((z) => [sg * 119.6, 0.06, z]), width: 0.14, ink: INK.soot, ground: INK.teal });
      }
    }
    await ctx.yield();
    // the crowd: two low awnings of hat and shirt stripes; someone sitting down is a step, someone leaving a taper.
    // Its own instance of the strip material, so the bump of raised arms can keep level with our bow.
    const crowdMat = stripMaterial(style, { zOffset: 0 });
    {
      const b = B(), shirts = [INK.white, INK.red, INK.white, INK.sky, INK.soot, INK.white, INK.straw];
      for (const sg of [-1, 1]) for (let k = 0; k < 7; k++) {
        const x = sg * (131.6 + k * 1.15 + rng.range(-0.2, 0.2)), y0 = 8.05 + (k % 3) * 0.5, wdt = rng.range(0.55, 0.85), sh = shirts[(k + (sg > 0 ? 3 : 0)) % 7];
        let z = rng.range(-60, 40);
        while (z < LINE_Z + 60) {
          const L = rng.range(90, 320), seat = rng.chance(0.3) ? rng.range(z + 30, z + L - 30) : 1e9;
          const shift = (zz) => [0, -0.55 * sstep(seat - 2, seat + 2, zz)];
          const hat = rng.chance(0.6) ? INK.straw : rng.chance(0.5) ? INK.white : INK.soot;
          const lift = W(0, rng.range(0.1, 0.16), rng.range(40, 90));
          rib(b, [{ pts: [[x - wdt, y0], [x - wdt, y0 + 1.25], [x + wdt, y0 + 1.25], [x + wdt, y0]], ink: sh, wob: lift }], z, z + L, { taper: 5, shift, about: [x, y0], step: 10 });
          rib(b, [{ pts: [[x - wdt * 1.2, y0 + 1.3], [x - wdt * 0.6, y0 + 1.95], [x + wdt * 0.6, y0 + 1.95], [x + wdt * 1.2, y0 + 1.3]], ink: hat, wob: [0, lift[1] * 1.6, lift[2], lift[3]] }], z + 1, z + L - 1, { taper: 5, shift, about: [x, y0 + 1.3], step: 10 });
          z += L + rng.range(4, 40);
        }
        if (k % 2 === 1) await ctx.yield();
      }
      const m = new THREE.Mesh(await b.buildY(ctx), crowdMat); m.name = 'crowd'; m.frustumCulled = false; root.add(m);
    }
    await ctx.yield();

    // willows: scalloped loaves (each scallop bulges, so its underside takes the deeper green), a fringe of withies
    // as hanging sheets that sway, a soot trunk sheet. Where the wind tossed a crown the ribbon swells for 40 m.
    const willowBands = (cx, base, hw, hgt, seedPh) => {
      const bands = [], n = 5;
      for (let k = 0; k < n; k++) {
        const f = (k + 0.5) / n * 2 - 1, r = hw / n * 1.45 * (1 + 0.25 * Math.sin(seedPh + k * 2.1)), ax = cx + f * (hw - r * 0.6);
        const ay = base + (hgt - base - r) * Math.pow(Math.max(0, 1 - f * f), 0.6) + r * 0.35, pts = [];
        const a0 = Math.PI + 0.75 - 0.5 * (f + 1) * 0.5, a1 = -0.75 + 0.5 * (1 - f) * 0.5;
        for (let i = 0; i <= 7; i++) { const a = lerp(a0, a1, i / 7); pts.push([ax + r * Math.cos(a), ay + r * Math.sin(a)]); }
        bands.push({ pts, ink: INK.willow, wob: W(0.12, 0.2, rng.range(45, 80)) });
      }
      bands.push({ pts: [[cx + hw * 0.92, base + 1.2], [cx + hw * 0.5, base], [cx - hw * 0.5, base], [cx - hw * 0.92, base + 1.2]], ink: INK.willow });
      return bands;
    };
    const willow = async (b, cx, hw, hgt, z0, z1, o = {}) => {
      const base = hgt * 0.42, toss = [rng.range(z0, z1), rng.range(z0, z1), rng.range(z0, z1)];
      const scale = (z) => 1 + 0.2 * Math.exp(-(((z - toss[0]) / 20) ** 2)) - 0.13 * Math.exp(-(((z - toss[1]) / 20) ** 2)) + 0.16 * Math.exp(-(((z - toss[2]) / 26) ** 2));
      const oo = { taper: 28, about: [cx, base], scale, step: 7, ...o };
      rib(b, willowBands(cx, base, hw, hgt, rng.range(0, TAU)), z0, z1, oo);
      await ctx.yield();
      const nf = 7;
      for (let k = 0; k < nf; k++) {     // the fringe: each withy is a sheet, light and dark alternately
        const fx = cx + (k / (nf - 1) * 2 - 1) * hw * 0.9, top = base + 0.6, bot = Math.max(3.6, base - rng.range(2.5, 5.5)), ph = rng.range(0, TAU), lam = rng.range(28, 55);
        rib(b, [{ pts: [[fx, top], [fx + 0.25, (top + bot) / 2], [fx, bot]], ink: k % 3 === 1 ? INK.straw : INK.willow,
          wob: (i) => [0.25 + 0.75 * i, 0.12 * i, lam, ph] }], z0 + 6, z1 - (o.taper1 === 0 ? 0 : 6), { ...oo, about: [fx, top], scale: null });
      }
      rib(b, [{ pts: [[cx - 0.5, 0], [cx - 0.35, base + 1]], ink: INK.soot }, { pts: [[cx - 0.35, base + 1], [cx + 0.35, base + 1]], ink: INK.soot }, { pts: [[cx + 0.35, base + 1], [cx + 0.5, 0]], ink: INK.soot }], z0 + 10, z1 - (o.taper1 === 0 ? 0 : 10), { ...oo, about: [cx, 0], scale: null, zWorld: null });
    };
    {
      const b = B();
      await willow(b, -163, 11, 19, 60, LINE_Z, { taper1: 0 });   // these two end at the line in their own trees
      await ctx.yield();
      await willow(b, 160, 10, 17, 420, LINE_Z, { taper1: 0 });
      await willow(b, -110.5, 7.5, 16, 560, LINE_Z, { taper1: 0 });   // a third stands in the port shallows, inside the line frame
      await ctx.yield();
      await willow(b, -186, 13, 22, -160, 300); await ctx.yield(); await willow(b, -204, 12, 16, 380, 860); await willow(b, -226, 14, 21, 140, 620);
      await ctx.yield();
      await willow(b, 163, 11, 20, -200, 330); await ctx.yield(); await willow(b, 192, 13, 22, 150, 700); await willow(b, 224, 12, 18, 560, 1180);
      await ctx.yield();
      await addStrip(b, 'willows');
    }
    await ctx.yield();
    const flagY = (x) => 44.5 + 8.5 * ((x + 44) / 72) ** 2;      // the sagging line the bunting hangs from
    // sheds: gabled bars behind the right levee; the nearest ends at the line in its own gable
    {
      const b = B();
      const shed = (cx, hw, wall, ridge, z0, z1, roof, o = {}) => rib(b, [
        { pts: [[cx - hw, 3], [cx - hw, wall]], ink: INK.white }, { pts: [[cx - hw - 0.8, wall - 0.4], [cx, ridge]], ink: roof },
        { pts: [[cx, ridge], [cx + hw + 0.8, wall - 0.4]], ink: roof }, { pts: [[cx + hw, wall], [cx + hw, 3]], ink: INK.skyTint },
      ], z0, z1, { taper: 10, about: [cx, 3], step: 12, ...o });
      shed(181, 7, 8.5, 12.6, 360, LINE_Z, INK.red, { taper1: 0 });
      shed(200, 9, 8, 12, 40, 250, INK.soot); shed(214, 8, 9, 13.2, 700, 1100, INK.straw); shed(-262, 10, 8, 12.5, 500, 900, INK.red);
      // the bunting: triangular bars hanging point down from a sagging line over the port side only, a few and well
      // apart with sky between, none white, so the swan's side of the sky stays one clean ground. A flag hoisted is a
      // ramp: every other bar begins late, and more are hoisted near the line.
      const flagInks = colourway === 'october' ? [INK.red, INK.soot, INK.straw] : colourway === 'poster' ? [INK.red, INK.teal, INK.willow] : [INK.red, INK.straw, INK.teal];
      const flags = [], NFL = 9;
      for (let k = 0; k < NFL; k++) {
        const main = k % 2 === 0, x = -44 - 8 * k, yl = flagY(x), hw = main ? 0.9 : 0.7, dp = main ? rng.range(2.4, 2.8) : rng.range(1.7, 2.1), ink = flagInks[((k >> 1) + (main ? 0 : 1)) % flagInks.length];
        const z0 = main ? ((k >> 1) % 3 === 1 ? rng.range(150, 330) : -260) : rng.range(640, 840), lam = rng.range(26, 46), ph = rng.range(0, TAU);
        const tip = [0.6, 0.1, lam, ph], hd = [0.06, 0.03, lam, ph];
        rib(b, [{ pts: [[x - hw, yl], [x + hw, yl]], ink, wob: hd }, { pts: [[x + hw, yl], [x, yl - dp]], ink, wob: (i) => (i ? tip : hd) },
          { pts: [[x, yl - dp], [x - hw, yl]], ink, wob: (i) => (i ? hd : tip) }], z0, LINE_Z, { taper0: main ? 30 : 46, taper1: 0, about: [x, yl], step: 8 });
        b.grid(2, 2, (i, j, o) => { o[0] = x + (i ? hw : -hw) * (1 - j); o[1] = yl - dp * j; o[2] = LINE_Z; }, ink, (i, j) => (j ? tip : hd));
        flags.push([x, yl]);
        if (k % 4 === 3) await ctx.yield();
      }
      info.flags = flags;
      await addStrip(b, 'sheds-bunting');
    }
    await ctx.yield();

    // the sky's still things: lozenge clouds (flat slabs parallel to the river, bulging where the cloud grew) and
    // the sun's band, which tapers out well short of the vanishing point
    {
      // No cloud stands in the strip of sky behind the swan's ridge and neck: to port they keep 220 m out and end
      // before they could close on the vanishing point, to starboard only a few lie far out and high, so the white
      // bird has flat sky for its ground.
      const b = B(), nC = weather === 'overcast' ? 0 : Math.round(30 * Math.min(1, dens));
      for (let k = 0; k < nC; k++) {
        const stb = k % 4 === 3, x = stb ? 620 + 380 * rng() : -(220 + 710 * Math.pow(rng(), 1.3)), y = stb ? rng.range(450, 540) : rng.range(250, 500), L = stb ? rng.range(300, 700) : rng.range(300, 800), z0 = stb ? rng.range(-500, 500) : rng.range(-500, 600);
        const hw = rng.range(15, 44), th = rng.range(4, 9), zb = z0 + L * rng.range(0.25, 0.75), bw = rng.range(50, 110), ba = rng.range(0.25, 0.6);
        const top = [], bot = [];
        for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI; top.push([x - hw * Math.cos(a), y + th * Math.sin(a) * 0.8]); bot.push([x + hw * Math.cos(a), y - th * 0.3 * Math.sin(a)]); }
        rib(b, [{ pts: top, ink: INK.white }, { pts: bot, ink: INK.white }], z0, z0 + L, { taper: L * 0.3, about: [x, y], step: 45, scale: (z) => 1 + ba * Math.exp(-(((z - zb) / bw) ** 2)) });
      }
      if (weather !== 'overcast') {
        const sx = golden ? -640 : 430, sy = golden ? 250 : 745, sink = colourway === 'poster' ? INK.white : INK.straw;
        rib(b, [{ pts: [[sx - 26, sy], [sx, sy + 5], [sx + 26, sy]], ink: sink }, { pts: [[sx + 26, sy], [sx, sy - 3], [sx - 26, sy]], ink: sink }], -500, 640, { taper: 420, about: [sx, sy], step: 60 });
      } else {
        // high overcast: the pale band lies in the quiet sky as three long lozenges at their own heights, bulging where
        // the cloud grew and tapering at both ends, well out to the sides: none reaches the vanishing point or the bird
        for (const [x, y, hw, z0, z1, zb] of [[-700, 540, 78, -700, 1500, 420], [-1350, 430, 120, -300, 1900, 900], [980, 660, 105, -800, 1150, 150]]) {
          const top = [], bot = [];
          for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI; top.push([x - hw * Math.cos(a), y + 9 * Math.sin(a)]); bot.push([x + hw * Math.cos(a), y - 4 * Math.sin(a)]); }
          rib(b, [{ pts: top, ink: INK.white }, { pts: bot, ink: INK.white }], z0, z1, { taper: (z1 - z0) * 0.42, about: [x, y], step: 55, scale: (z) => 1 + 0.55 * Math.exp(-(((z - zb) / 190) ** 2)) - 0.2 * Math.exp(-(((z - zb - 430) / 160) ** 2)) + 0.3 * Math.exp(-(((z - zb + 480) / 150) ** 2)) });
        }
      }
      await addStrip(b, 'clouds');
    }
    await ctx.yield();
    // on the water: the slow craft that never ends, lilies (a lily closing is a taper), reeds, dragonflies
    {
      const b = B(), sx = -80;
      if (craft === 'skiff') {
        rib(b, [{ pts: [[sx - 1.0, 0.62], [sx + 1.0, 0.62]], ink: INK.straw }, { pts: [[sx + 1.0, 0.62], [sx + 0.6, -0.1], [sx - 0.6, -0.1], [sx - 1.0, 0.62]], ink: INK.straw },
          { pts: [[sx - 0.32, 0.62], [sx - 0.32, 1.6], [sx + 0.32, 1.6], [sx + 0.32, 0.62]], ink: INK.white, wob: W(0.05, 0.03, 60) },
          { pts: [[sx - 1.5, 2.25], [sx - 0.8, 2.75], [sx, 2.95], [sx + 0.8, 2.75], [sx + 1.5, 2.25]], ink: INK.red, wob: W(0.1, 0.12, 48) },
          { pts: [[sx + 1.5, 2.25], [sx, 2.45], [sx - 1.5, 2.25]], ink: INK.red, wob: W(0.1, 0.12, 48, 0) }], 150, 850, { taper: 16, about: [sx, 0.3], step: 7 });
      } else if (craft === 'punt') {
        rib(b, [{ pts: [[sx - 0.9, 0.45], [sx + 0.9, 0.45]], ink: INK.straw }, { pts: [[sx + 0.9, 0.45], [sx + 0.8, -0.1], [sx - 0.8, -0.1], [sx - 0.9, 0.45]], ink: INK.soot },
          { pts: [[sx - 0.3, 0.45], [sx - 0.3, 2.0], [sx + 0.3, 2.0], [sx + 0.3, 0.45]], ink: INK.red, wob: W(0.06, 0.04, 70) },
          { pts: [[sx + 0.8, 0.3], [sx + 1.25, 4.6]], ink: INK.soot, wob: W(0.18, 0.05, 52) }], 150, 850, { taper: 16, about: [sx, 0.3], step: 7 });
      } else {
        for (let k = 0; k < 5; k++) { const cx = sx - 3 + k * 1.5, pts = []; for (let i = 0; i <= 5; i++) { const a = Math.PI * (1 - i / 5); pts.push([cx + 0.72 * Math.cos(a), 0.05 + 0.6 * Math.sin(a)]); }
          rib(b, [{ pts, ink: k % 2 ? INK.straw : INK.soot }], 150 + rng.range(0, 40), 850 - rng.range(0, 40), { taper: 9, about: [cx, 0], step: 12 }); }
        rib(b, [{ pts: [[sx - 0.3, 0.6], [sx - 0.3, 2.1], [sx + 0.3, 2.1], [sx + 0.3, 0.6]], ink: INK.red, wob: W(0.06, 0.04, 70) }], 200, 800, { taper: 8, about: [sx, 0.6], step: 12 });
      }
      for (const sg of [-1, 1]) hairs.push({ pts: rings(170, 830, 30).map((z) => [sx + sg * 0.7, 0.07, z]), width: 0.1, ink: INK.white, ground: INK.teal });
      const nL = Math.round(16 * dens * detail);
      for (let k = 0; k < nL; k++) {       // lilies: pale pads with a red stripe where a flower was open
        const near = k % 3 !== 2, x = near ? rng.range(-47, -30) : rng.range(-77, -71), hw = rng.range(0.45, 1.2), z0 = rng.range(0, 800), L = rng.range(50, 190);
        const ink = k % 4 === 0 ? INK.willow : k % 2 ? INK.riverTint : INK.white, lam = rng.range(40, 80), w = W(0.1, 0, lam);
        rib(b, [{ pts: [[x - hw, 0.09], [x + hw, 0.09]], ink, wob: w }], z0, z0 + L, { taper: 18, about: [x, 0.09], step: 8 });
        if (k % 2 === 0) { const zr = z0 + rng.range(18, L * 0.6); rib(b, [{ pts: [[x - 0.2, 0.2], [x, 0.34], [x + 0.2, 0.2]], ink: INK.red, wob: w }], zr, zr + rng.range(14, 40), { taper: 6, about: [x, 0.2], step: 6 }); }
      }
      for (let k = 0; k < 26; k++) {       // reeds at the levee foot
        const sg = k % 2 ? 1 : -1, x = sg * rng.range(113, 118.5), h = rng.range(1.4, 3.4), z0 = rng.range(-100, 1000), ph = rng.range(0, TAU), lam = rng.range(22, 40);
        rib(b, [{ pts: [[x, 0], [x + 0.2, h * 0.6], [x, h]], ink: k % 3 ? INK.straw : INK.willow, wob: (i) => [0.3 * i, 0.05 * i, lam, ph] }], z0, z0 + rng.range(60, 260), { taper: 12, about: [x, 0], step: 7 });
      }
      await ctx.yield();
      // dragonflies hovered on the line: a hair-thin blue ribbon with a pale sine band either side for wings
      const body = colourway === 'poster' ? INK.straw : INK.sky;
      const dragon = (x, y, z0, L, lam, ph) => {
        hairs.push({ pts: rings(z0, z0 + L, 10).map((z) => [x, y + 0.12, z]), width: 0.16, ink: body, ground: INK.teal });
        for (const sg of [-1, 1]) rib(b, [{ pts: [[x + sg * 0.25, y + 0.08], [x + sg * 0.95, y + 0.22]], ink: INK.white, wob: (i) => [0.02, 0.1 + 0.34 * i, lam, ph + (sg > 0 ? 0 : Math.PI)] }], z0 + 2, z0 + L - 2, { taper: 6, about: [x + sg * 0.25, y + 0.08], step: 1.1, zWorld: null, flip: sg < 0 });
      };
      const nD = Math.round(12 * dens * detail);
      for (let k = 0; k < nD; k++) {
        dragon(lerp(-40, -27, rng()), lerp(1.2, 2.8, rng()), lerp(330, 760, rng()), rng.range(60, 200), rng.range(9, 15), rng.range(0, TAU));
        if (k % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      // toward the line the water fills up: lily stripes that end in their own lilies (a notched pad and an open
      // flower, whole), and the last dragonflies, each ribbon ending where the insect hung
      const slotsP = [-43, -32.5, -28.3, -24.6, -41, -30.4], slotsS = [-6.3, -2.2, 2.0, 5.3];
      for (let k = 0; k < 10; k++) {
        const stb = k % 3 === 2, x = (stb ? slotsS[(k / 3 | 0) % 4] : slotsP[(k - (k / 3 | 0)) % 6]) + rng.range(-0.5, 0.5), ze = stb ? rng.range(838, 900) : rng.range(826, 908);
        const L = Math.min(ze - 803, stb ? rng.range(30, 70) : rng.range(50, 130)), hw = rng.range(0.7, 1.25), R = hw * 1.55, zc = ze + R * 0.75;
        const ink = k % 4 === 1 ? INK.willow : k % 2 ? INK.riverTint : INK.white, w = W(0.1, 0, rng.range(40, 80));
        rib(b, [{ pts: [[x - hw, 0.09], [x + hw, 0.09]], ink, wob: w }], ze - L, ze, { taper0: 18, taper1: 0, about: [x, 0.09], step: 8 });
        b.grid(17, 2, (i, j, o) => { const a = 0.3 + i / 16 * (TAU - 0.6); o[0] = x + (j ? R * Math.sin(a) : 0); o[1] = 0.1; o[2] = zc + (j ? R * Math.cos(a) : 0); }, ink, w, true);
        const zr = ze - rng.range(16, 40);
        rib(b, [{ pts: [[x - 0.2, 0.2], [x, 0.34], [x + 0.2, 0.2]], ink: INK.red, wob: w }], zr, zc, { taper0: 6, taper1: 0, about: [x, 0.2], step: 6 });
        b.grid(13, 2, (i, j, o) => { const a = i / 12 * TAU, r = j ? (i % 2 ? 0.34 : 0.78) * hw : 0; o[0] = x + r * Math.sin(a); o[1] = j ? 0.22 : 0.85 * hw; o[2] = zc + r * Math.cos(a); }, INK.red, w, true);
        b.grid(13, 2, (i, j, o) => { const a = (i + 0.5) / 12 * TAU, r = j ? (i % 2 ? 0.16 : 0.34) * hw : 0; o[0] = x + r * Math.sin(a); o[1] = (j ? 0.74 : 1.0) * hw; o[2] = zc + r * Math.cos(a); }, INK.white, w, true);
      }
      await ctx.yield();
      for (let k = 0; k < 10; k++) {     // chevrons on the lane before the hoop: what the winners' bows left on the film
        const zc = 800 + k * 12.5 + rng.range(-2, 2), x0 = crownW + (k % 2 ? 2.6 : -2.6) + rng.range(-0.8, 0.8), sp = rng.range(1.5, 2.3), len = rng.range(18, 26), w = W(0.04, 0, rng.range(45, 70));
        for (const sg of [-1, 1]) b.grid(2, 8, (i, j, o) => { const q = j / 7, hw = 0.24 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * q)), 0.7); o[0] = x0 + sg * (0.1 + sp * Math.pow(q, 0.8)) + (i ? hw : -hw); o[1] = 0.07; o[2] = zc + len * (0.5 - q); }, INK.white, w);
      }
      await ctx.yield();
      for (let k = 0; k < 6; k++) dragon(k % 3 === 2 ? rng.range(-6, 4.5) : rng.range(-34, -21.5), rng.range(1.5, 4.6), k % 3 === 2 ? rng.range(802, 840) : rng.range(765, 835), rng.range(45, 85), rng.range(9, 15), rng.range(0, TAU));
      // off the starboard bow, where the look goes after the wheel: two dragonfly ribbons and two lily stripes at arm's length
      dragon(4, 3.1, 150, 112, 11, 0.7); dragon(-4.6, 2.2, 176, 96, 13.5, 2.9);
      rib(b, [{ pts: [[8 - 0.9, 0.09], [8 + 0.9, 0.09]], ink: INK.white, wob: [0.1, 0, 55, 1.1] }], 138, 222, { taper: 18, about: [8, 0.09], step: 8 });
      rib(b, [{ pts: [[8 - 0.2, 0.2], [8, 0.34], [8 + 0.2, 0.2]], ink: INK.red, wob: [0.1, 0, 55, 1.1] }], 160, 190, { taper: 6, about: [8, 0.2], step: 6 });
      rib(b, [{ pts: [[-0.4 - 0.6, 0.09], [-0.4 + 0.6, 0.09]], ink: INK.riverTint, wob: [0.1, 0, 68, 4.0] }], 172, 262, { taper: 18, about: [-0.4, 0.09], step: 8 });
      await ctx.yield();
      // FIX ROUND 11 (III): the river's own life by one rule down its whole length, in the bands of OPEN WATER between the
      // tracks the crossers ran, from streams of their own. A steamer's track is her lane and WHEELS metres either side (her
      // wheels' outer faces stand 9.6 m from her centreline, and 2.4 m of clear water); the slow craft's ribbon keeps 4 m
      // either side; the shallows end 2.5 m from each levee's foot (x 119.5 either side). The tracks, from this file's own
      // numbers: the racers at x 36, -90 and 84 ("others", below), the rival at RIVALX, the slow craft at sx, ourselves
      // from x -17 - 3.35 (her centreline on the deck) to x -13.5 - 1.3 (along the flank). The bands, in metres of x:
      // far port -117 to -102, port -76 to -68, near port -44 to -32.35, bow water -2.8 to 24, starboard 48 to 72 and
      // far starboard 96 to 117. Where the bird sits, the water from the slow craft's ribbon across to her far flank holds what
      // the film already laid there, and nothing of this rule is added abreast of her in it. Everything ends where the hoop's
      // own ribbon begins (its lowest stave, 69 m before the line).
      { const WHEELS = 12, SHORE = 119.5 - 2.5, RACERS = [36, -90, 84], OURS = [-17 - 3.35 - WHEELS, -13.5 - 1.3 + WHEELS], ZEND = LINE_Z - 69;
        // the bird's water begins 6 m astern of her tail tips and runs past where this rule ends (her far end, HZ + 256, lies beyond ZEND - 70)
        const BIRD_Z = HZ + A.tailTips.reduce((m, t) => Math.min(m, t.z), 0) - 6;
        // each band: x from, x to, and whether it lies in the bird's own water (between the slow craft and her far flank)
        const FAR = [[-SHORE, RACERS[1] - WHEELS, 0], [RACERS[0] + WHEELS, RACERS[2] - WHEELS, 0], [RACERS[2] + WHEELS, SHORE, 0]];
        const NEAR = [[sx + 4, RIVALX - WHEELS, 1], [RIVALX + WHEELS, OURS[0], 1], [OURS[1], RACERS[0] - WHEELS, 1]];
        const rFly = ctx.core.makeRng(ctx.core.hashSeed('long-swan-dragonflies:' + ctx.seed)), rLily = ctx.core.makeRng(ctx.core.hashSeed('long-swan-lilies:' + ctx.seed));
        // dragonflies in every band, each ribbon as long as the insect hung there (live's own dragon(), as it is). In a band of
        // the bird's own water a ribbon is asked first how long it is: one that would reach her water (with 4 m to spare) is
        // not there, and that band ends with it (nothing more is drawn for it)
        let nFly = 0;
        for (const [xa, xb, birds] of [...FAR, ...NEAR]) for (let z = rFly.range(-40, 120); z < ZEND - 70;) {
          const L = Math.min(rFly.range(60, 200), ZEND - z);
          if (birds && z + L + 4 > BIRD_Z) break;
          const x = rFly.range(xa, xb), y = rFly.range(1.2, 4.6), gap = rFly.range(50, 240) / (dens * detail), lam = rFly.range(9, 15), ph = rFly.range(0, TAU);
          dragon(x, y, z, L, lam, ph); nFly++; if (nFly % 2 === 0) await ctx.yield();
          z += L + gap;
        }
        // lilies only in the three bands where none of the film's own sixteen can lie: a pale stripe, and where a flower was
        // open its red heart with a white petal stripe either side
        const lily = (x, hw, z0, L, ink, flower, w) => {
          rib(b, [{ pts: [[x - hw, 0.09], [x + hw, 0.09]], ink, wob: w }], z0, z0 + L, { taper: 18, about: [x, 0.09], step: 8 });
          if (flower > 0) { const zr = z0 + flower; rib(b, [{ pts: [[x - 0.2, 0.2], [x, 0.34], [x + 0.2, 0.2]], ink: INK.red, wob: w }], zr, zr + Math.min(40, L * 0.3), { taper: 6, about: [x, 0.2], step: 6 });
            for (const sg of [-1, 1]) rib(b, [{ pts: [[x + sg * 0.22, 0.16], [x + sg * 0.62, 0.3]], ink: INK.white, wob: w }], zr + 2, zr + 16, { taper: 5, about: [x + sg * 0.22, 0.16], step: 6, flip: sg < 0 }); } };
        let nLily = 0;
        for (const [xa, xb] of FAR) for (let z = rLily.range(-60, 40); z < ZEND - 50;) {
          const hw = rLily.range(0.45, 1.2), x = rLily.range(xa + hw, xb - hw), L = Math.min(rLily.range(50, 190), ZEND - z), gap = rLily.range(20, 150) / (dens * detail), pick = rLily(), fl = pick * 7 % 1 < 0.5 ? rLily.range(18, L * 0.6) : 0, lam = rLily.range(40, 80), ph = rLily.range(0, TAU);
          // (the flower's place is drawn only for a lily whose flower was open)
          lily(x, hw, z, L, pick < 0.25 ? INK.willow : pick < 0.6 ? INK.riverTint : INK.white, fl, [0.1, 0, lam, ph]); nLily++;
          z += L + gap;
          if (nLily % 6 === 5) await ctx.yield();
        }
      }
      await addStrip(b, 'water-life');
    }
    await ctx.yield();

    // ---- material 3, the crossers: the steamer, modelled whole (stern z 0, bow z 60, water y 0). She is true
    // because she is racing; a tired rival is the same model with a z stretch about her bow.
    const sb = B(), fx = [], boatHairs = [];
    const padFx = (a = 0, b2 = 0, c = 0, d = 0) => { for (let n = sb.pos.length / 3 - fx.length / 4; n > 0; n--) fx.push(a, b2, c, d); };
    const face = (P, ink, wob) => sb.grid(2, 2, (i, j, o) => { const q = P[j * 2 + i]; o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; }, ink, wob || null);
    const box = (x0, x1, y0, y1, z0, z1, side, top, o = {}) => {
      face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z0], [x0, y1, z1]], o.left ?? side); face([[x1, y0, z0], [x1, y0, z1], [x1, y1, z0], [x1, y1, z1]], side);
      face([[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0]], o.end ?? side); face([[x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]], o.end ?? side);
      face([[x0, y1, z0], [x1, y1, z0], [x0, y1, z1], [x1, y1, z1]], top ?? side); if (o.bottom != null) face([[x0, y0, z0], [x1, y0, z0], [x0, y0, z1], [x1, y0, z1]], o.bottom);
    };
    const hullW = (z) => 6.5 * (z < 5 ? 0.82 + 0.18 * Math.sin(Math.max(0, z) / 5 * Math.PI / 2) : z > 42 ? Math.pow(Math.max(0.0006, 1 - Math.pow((z - 42) / 18, 1.8)), 0.8) : 1);
    const DECK = 2.2, UP = 10, UW = 4.4, CW = 4.0, GANG = [11.2, 43.85], hz = []; for (let z = 0; z <= 42; z += 6) hz.push(z); for (let k = 1; k <= 14; k++) hz.push(42 + 18 * (1 - Math.pow(1 - k / 14, 1.6)));
    for (const sg of [-1, 1]) {
      sb.grid(hz.length, 2, (i, j, o) => { o[0] = sg * hullW(hz[i]) * (j ? 1 : 0.9); o[1] = j ? 0.6 : -0.7; o[2] = hz[i]; }, INK.red);
      sb.grid(hz.length, 2, (i, j, o) => { o[0] = sg * hullW(hz[i]); o[1] = j ? DECK : 0.6; o[2] = hz[i]; }, INK.white);
      // FIX ROUND 11 (II c): portholes along the hull, round on a true boat
      for (let zc = 4.5; zc < 56; zc += 3) sb.grid(13, 2, (i, j, o) => { const a = i / 12 * TAU, r = j ? 0.43 : 0; o[2] = zc + r * Math.sin(a); o[1] = 1.42 + r * Math.cos(a); o[0] = sg * (hullW(o[2]) + 0.04); }, INK.soot);
      boatHairs.push({ pts: hz.map((z) => [sg * (hullW(z) + 0.03), DECK - 0.02, z]), width: 0.07 });
      boatHairs.push({ pts: hz.map((z) => [sg * (hullW(z) + 0.03), 0.62, z]), width: 0.06 });
    }
    sb.grid(hz.length, 2, (i, j, o) => { o[0] = (j ? 1 : -1) * hullW(hz[i]); o[1] = DECK; o[2] = hz[i]; }, INK.white);          // main deck
    face([[-5.3, -0.7, 0], [5.3, -0.7, 0], [-5.35, DECK, 0], [5.35, DECK, 0]], INK.white);                                        // transom
    box(-CW, CW, DECK, UP - 0.3, 4, 42, INK.skyTint, INK.skyTint);                                                               // the cabin, in the deck's shade
    // FIX ROUND 11 (II a): the wheel is seen to be carried: the main deck is built out abreast of each wheel as a guard (white
    // planking with a soot edge, a sky-tint skirt, faired into the hull fore and aft) and on it stands the soot bearing block
    // of the shaft, on two raking legs between two rails. MEND 11: they stand only where a wheel is: they carry a mark of
    // their own (aFx 4), and on a boat whose wheel the shader sets at her stern the same switch closes them to nothing
    padFx(0, 0, 0, 0);
    for (const sg of [-1, 1]) { const G0 = 6.4, G1 = 7.8, ga = 18.9, gb = 31.1, fa = 15.4, fb = 34.6;
      sb.grid(2, 4, (i, j, o) => { o[0] = sg * (i ? [G0 + 0.02, G1, G1, G0 + 0.02][j] : G0); o[1] = DECK + 0.01; o[2] = [fa, ga, gb, fb][j]; }, INK.white);
      sb.grid(2, 4, (i, j, o) => { o[0] = sg * [G0 + 0.02, G1, G1, G0 + 0.02][j]; o[1] = i ? DECK + 0.01 : DECK - 0.75; o[2] = [fa, ga, gb, fb][j]; }, INK.skyTint);
      boatHairs.push({ pts: [[sg * (G0 + 0.04), DECK + 0.03, fa], [sg * (G1 + 0.02), DECK + 0.03, ga], [sg * (G1 + 0.02), DECK + 0.03, gb], [sg * (G0 + 0.04), DECK + 0.03, fb]], width: 0.07 });
      boatHairs.push({ pts: [[sg * 7.1, DECK + 0.03, 17.2], [sg * 7.1, DECK + 0.03, 32.8]], width: 0.035 });
      box(Math.min(sg * 7.0, sg * 7.5), Math.max(sg * 7.0, sg * 7.5), 4.9 - 0.4, 4.9 + 0.4, 25 - 0.4, 25 + 0.4, INK.soot, INK.soot, { bottom: INK.soot });
      for (const dz of [-3.4, 3.4]) { face([[sg * 7.25, DECK, 25 + dz - 0.3], [sg * 7.25, DECK, 25 + dz + 0.3], [sg * 7.25, 4.9 + 0.4, 25 + dz * 0.1 - 0.3], [sg * 7.25, 4.9 + 0.4, 25 + dz * 0.1 + 0.3]], INK.soot); }
      face([[sg * 7.25, DECK, 25 - 3.7], [sg * 7.25, DECK, 25 + 3.7], [sg * 7.25, DECK + 0.45, 25 - 3.7], [sg * 7.25, DECK + 0.45, 25 + 3.7]], INK.soot);
      face([[sg * 7.25, 3.45, 25 - 2.0], [sg * 7.25, 3.45, 25 + 2.0], [sg * 7.25, 3.8, 25 - 2.0], [sg * 7.25, 3.8, 25 + 2.0]], INK.soot); }
    padFx(4, 0, 0, 0);
    box(-UW, UW, UP - 0.3, UP, 1, 44, INK.white, INK.white, { bottom: INK.white });                                               // upper deck
    for (const sg of [-1, 1]) {
      for (let k = 0; k < 15; k++) {                // two rows of windows, a door every fifth
        const z = 6 + k * 2.4, x = sg * (CW + 0.04), door = k % 5 === 2;
        face([[x, door ? 6.0 : 6.5, z], [x, door ? 6.0 : 6.5, z + 1.2], [x, 8.5, z], [x, 8.5, z + 1.2]], INK.soot);
        face([[x, door ? DECK + 0.1 : 3.1, z], [x, door ? DECK + 0.1 : 3.1, z + 1.5], [x, 5.0, z], [x, 5.0, z + 1.5]], k % 5 === 0 ? INK.straw : INK.soot);
      }
      for (let k = 0; k < 15; k++) { const z = 1.6 + k * 3; face([[sg * (UW - 0.14), DECK, z], [sg * (UW - 0.14), DECK, z + 0.2], [sg * (UW - 0.14), UP - 0.3, z], [sg * (UW - 0.14), UP - 0.3, z + 0.2]], INK.white); }
      boatHairs.push({ pts: [[sg * (UW + 0.03), UP, 1], [sg * (UW + 0.03), UP, 44]], width: 0.08 }, { pts: [[sg * (UW + 0.03), UP - 0.3, 1], [sg * (UW + 0.03), UP - 0.3, 44]], width: 0.06 });
      boatHairs.push({ pts: [[sg * (CW + 0.05), DECK + 0.02, 4], [sg * (CW + 0.05), DECK + 0.02, 42]], width: 0.06, ground: INK.skyTint }, { pts: [[sg * (CW + 0.05), 5.75, 4], [sg * (CW + 0.05), 5.75, 42]], width: 0.1, ground: INK.skyTint });
      for (let x = CW + 0.5; x < 6.3; x += 0.45) boatHairs.push({ pts: [[sg * x, DECK + 0.012, 5], [sg * x, DECK + 0.012, 42]], width: 0.035 });   // the main deck's side planking
    }
    for (let k = 0; k < 3; k++) face([[-3.0 + k * 2.4, 6.3, 3.96], [-1.8 + k * 2.4, 6.3, 3.96], [-3.0 + k * 2.4, 8.4, 3.96], [-1.8 + k * 2.4, 8.4, 3.96]], INK.soot);
    box(-1.3, 1.3, UP, UP + 0.95, 6, 20, INK.white, INK.skyTint);                                                                // skylight
    for (const sg of [-1, 1]) for (let k = 0; k < 5; k++) { const z = 6.9 + k * 2.6, x = sg * 1.33, xh = sg * 1.36;
      face([[x, UP + 0.25, z], [x, UP + 0.25, z + 1.6], [x, UP + 0.75, z], [x, UP + 0.75, z + 1.6]], k === 2 ? INK.straw : INK.soot);
      for (const dz of [0.4, 0.8, 1.2]) boatHairs.push({ pts: [[xh, UP + 0.25, z + dz], [xh, UP + 0.75, z + dz]], width: 0.045, ink: INK.white, ground: INK.soot });
      boatHairs.push({ pts: [[xh, UP + 0.5, z], [xh, UP + 0.5, z + 1.6]], width: 0.035, ink: INK.white, ground: INK.soot });
      boatHairs.push({ pts: [[xh, UP + 0.2, z - 0.06], [xh, UP + 0.8, z - 0.06], [xh, UP + 0.8, z + 1.66], [xh, UP + 0.2, z + 1.66], [xh, UP + 0.2, z - 0.06]], width: 0.035 }); }
    for (const sg of [-1, 1]) boatHairs.push({ pts: [[sg * 1.34, UP + 0.1, 6], [sg * 1.34, UP + 0.1, 20]], width: 0.03 });
    for (const x of [-0.87, -0.43, 0, 0.43, 0.87]) boatHairs.push({ pts: [[x, UP + 0.962, 6], [x, UP + 0.962, 20]], width: x === 0 ? 0.06 : 0.03, ground: INK.skyTint });
    boatHairs.push({ pts: [[-1.32, UP + 0.955, 6], [1.32, UP + 0.955, 6], [1.32, UP + 0.955, 20], [-1.32, UP + 0.955, 20], [-1.32, UP + 0.955, 6]], width: 0.07, ground: INK.skyTint });
    await ctx.yield();
    const circ = (n, fn) => Array.from({ length: n + 1 }, (_, i) => fn(i / n * TAU));
    for (const [vx, vz, vs] of [[-0.5, 5.1, 0.72], [0, 21.4, 1]]) {     // cowl ventilators: a white stalk and hood edged in soot, the mouth turned aft: a flat red ring, the deeper red inside
      const top = UP + 1.5 * vs, my = top + 0.5 * vs, mz = vz - 0.5 * vs, R = 0.62 * vs;
      sb.grid(9, 2, (i, j, o) => { const a = i / 8 * TAU; o[0] = vx + 0.2 * vs * Math.cos(a); o[1] = j ? top : UP; o[2] = vz + 0.2 * vs * Math.sin(a); }, INK.white);
      sb.grid(13, 3, (i, j, o) => { const a = i / 12 * TAU, t = j / 2, r = vs * [0.2, 0.36, 0.62][j], tl = [0, 0.55, 1][j];     // the hood: from the stalk's top round to the mouth
        o[0] = vx + r * Math.cos(a); o[1] = lerp(top, my, [0, 0.62, 1][j]) + r * Math.sin(a) * tl; o[2] = lerp(vz, mz, [0, 0.45, 1][j]) + r * Math.sin(a) * (1 - tl); }, INK.white);
      sb.grid(17, 2, (i, j, o) => { const a = i / 16 * TAU, r = j ? R * 0.66 : R; o[0] = vx + r * Math.cos(a); o[1] = my + r * Math.sin(a); o[2] = mz - 0.01; }, INK.red);
      sb.grid(17, 2, (i, j, o) => { const a = i / 16 * TAU, r = j ? 0 : R * 0.66; o[0] = vx + r * Math.cos(a); o[1] = my + r * Math.sin(a) - (j ? 0.1 * vs : 0); o[2] = mz - 0.01 + (j ? 0.34 * vs : 0); }, INK.red);   // the throat: its roof turns downward and takes the deeper red
      boatHairs.push({ pts: circ(20, (a) => [vx + R * Math.cos(a), my + R * Math.sin(a), mz - 0.03]), width: 0.04 }, { pts: circ(16, (a) => [vx + R * 0.66 * Math.cos(a), my + R * 0.66 * Math.sin(a), mz - 0.035]), width: 0.03, ground: INK.red });
      for (const [dx, dz] of [[-0.2, 0], [0.2, 0], [0, -0.2], [0, 0.2]]) boatHairs.push({ pts: [[vx + dx * vs * 1.04, UP, vz + dz * vs * 1.04], [vx + dx * vs * 1.04, top, vz + dz * vs * 1.04]], width: 0.03 });
      boatHairs.push({ pts: [[vx, top + 0.2 * vs, vz + 0.2 * vs], [vx, top + 0.62 * vs, vz + 0.12 * vs], [vx, my + R, mz]], width: 0.03 });
      boatHairs.push({ pts: [[vx - 0.22, UP + 0.02, vz - 0.22], [vx + 0.22, UP + 0.02, vz - 0.22], [vx + 0.22, UP + 0.02, vz + 0.22], [vx - 0.22, UP + 0.02, vz + 0.22], [vx - 0.22, UP + 0.02, vz - 0.22]], width: 0.04 }); }
    const COILS = [[2.25, 10.4], [-2.4, 15]], COILR = 0.86;
    for (const [cx0, cz0] of COILS) {   // a coiled line lying on the planking: three straw turns on a white ground, the seams stop at its rim
      sb.grid(21, 2, (i, j, o) => { const a = i / 20 * TAU, rr = j ? COILR : 0; o[0] = cx0 + rr * Math.cos(a); o[1] = UP + 0.04; o[2] = cz0 + rr * Math.sin(a); }, INK.white);
      sb.grid(97, 2, (i, j, o) => { const t = i / 96, a = t * 3.2 * TAU, rr = 0.07 + 0.6 * t + (j ? 0.115 : 0); o[0] = cx0 + rr * Math.cos(a); o[1] = UP + 0.07; o[2] = cz0 + rr * Math.sin(a); }, INK.straw);     // one line, three turns and a bit
      sb.grid(2, 5, (i, j, o) => { const t = j / 4; o[0] = cx0 + 0.67 + 0.115 * i + 0.5 * t * t; o[1] = UP + 0.07; o[2] = cz0 + 0.95 + 1.1 * t; }, INK.straw);     // its free end
      boatHairs.push({ pts: circ(24, (a) => [cx0 + COILR * Math.cos(a), UP + 0.075, cz0 + COILR * Math.sin(a)]), width: 0.035 }); }
    { const bx = 1.75, bz = 6.6;     // a fire bucket: red, a white band, a rim line and a bail handle
      const ring = (r0, r1, y0, y1, ink) => sb.grid(13, 2, (i, j, o) => { const a = i / 12 * TAU, r = j ? r1 : r0; o[0] = bx + r * Math.cos(a); o[1] = UP + (j ? y1 : y0); o[2] = bz + r * Math.sin(a); }, ink);
      ring(0.19, 0.215, 0, 0.2, INK.red); ring(0.215, 0.235, 0.2, 0.32, INK.white); ring(0.235, 0.26, 0.32, 0.5, INK.red);
      for (const y of [0.2, 0.32]) boatHairs.push({ pts: circ(12, (a) => [bx + (0.2 + 0.12 * y) * 1.03 * Math.cos(a), UP + y, bz + (0.2 + 0.12 * y) * 1.03 * Math.sin(a)]), width: 0.02 });
      boatHairs.push({ pts: circ(14, (a) => [bx + 0.265 * Math.cos(a), UP + 0.5, bz + 0.265 * Math.sin(a)]), width: 0.035 });
      boatHairs.push({ pts: Array.from({ length: 11 }, (_, i) => { const a = i / 10 * Math.PI; return [bx + 0.26 * Math.cos(a), UP + 0.5 + 0.3 * Math.sin(a), bz]; }), width: 0.03 }); }
    await ctx.yield();
    // the pilot house, abaft the stacks so nothing stands between the forward promenade and the rival: boarded walls,
    // barred windows all round, a door aft, a nameboard on the eaves
    { const P0 = 24.6, P1 = 28.8, PW = 1.6, PH = UP + 2.6;
      box(-PW, PW, UP, PH, P0, P1, INK.white, INK.white);
      for (const sg of [-1, 1]) {
        const x = sg * (PW + 0.03);
        face([[x, UP + 1.2, P0 + 0.3], [x, UP + 1.2, P1 - 0.3], [x, UP + 2.2, P0 + 0.3], [x, UP + 2.2, P1 - 0.3]], INK.soot);
        for (let k = 1; k < 5; k++) { const z = lerp(P0 + 0.3, P1 - 0.3, k / 5); boatHairs.push({ pts: [[x + sg * 0.02, UP + 1.2, z], [x + sg * 0.02, UP + 2.2, z]], width: 0.07, ink: INK.white, ground: INK.soot }); }
        boatHairs.push({ pts: [[x + sg * 0.02, UP + 1.7, P0 + 0.3], [x + sg * 0.02, UP + 1.7, P1 - 0.3]], width: 0.05, ink: INK.white, ground: INK.soot });
        for (const y of [0.3, 0.6, 0.9]) boatHairs.push({ pts: [[x, UP + y, P0], [x, UP + y, P1]], width: 0.03 });
        // FIX ROUND 11 (II b; the wall beside the walk; brief: crossers carry "crisp small detail (stanchions, planks, spokes)"):
        // each light of the window is a sky-tint pane in its soot frame; a door at the wall's forward end (a straw leaf with a
        // pane of its own, a soot frame, a lock rail and a knob); a lifebuoy hung under the windows; a seam between the boards above them
        { const xp = x + sg * 0.04, xd = x + sg * 0.05, W0 = P0 + 0.3, DZ0 = P1 - 1.25, DZ1 = P1 - 0.4, BAY = (DZ0 - 0.1 - W0) / 4;
          for (let k = 0; k < 4; k++) for (const [ya, yb] of [[1.26, 1.66], [1.74, 2.14]]) face([[xp, UP + ya, W0 + k * BAY + 0.07], [xp, UP + ya, W0 + (k + 1) * BAY - 0.07], [xp, UP + yb, W0 + k * BAY + 0.07], [xp, UP + yb, W0 + (k + 1) * BAY - 0.07]], INK.skyTint);
          face([[xp, UP + 0.04, DZ0 - 0.1], [xp, UP + 0.04, DZ1 + 0.1], [xp, UP + 2.3, DZ0 - 0.1], [xp, UP + 2.3, DZ1 + 0.1]], INK.white);
          face([[xd, UP + 0.08, DZ0], [xd, UP + 0.08, DZ1], [xd, UP + 1.15, DZ0], [xd, UP + 1.15, DZ1]], INK.straw);
          face([[xd, UP + 1.26, DZ0 + 0.08], [xd, UP + 1.26, DZ1 - 0.08], [xd, UP + 2.14, DZ0 + 0.08], [xd, UP + 2.14, DZ1 - 0.08]], INK.skyTint);
          boatHairs.push({ pts: [[xd + sg * 0.02, UP + 0.06, DZ0], [xd + sg * 0.02, UP + 2.22, DZ0], [xd + sg * 0.02, UP + 2.22, DZ1], [xd + sg * 0.02, UP + 0.06, DZ1]], width: 0.045 }, { pts: [[xd + sg * 0.02, UP + 1.2, DZ0], [xd + sg * 0.02, UP + 1.2, DZ1]], width: 0.05 });
          boatHairs.push({ pts: circ(8, (a) => [xd + sg * 0.03, UP + 1.02 + 0.045 * Math.cos(a), DZ0 + 0.12 + 0.045 * Math.sin(a)]), width: 0.04 });
          const bz = W0 + 1.15, by = UP + 0.62;
          for (let k = 0; k < 8; k++) { const a0 = (k >> 1) * TAU / 4 + (k & 1 ? 0.3 : -0.3), a1 = (k >> 1) * TAU / 4 + (k & 1 ? TAU / 4 - 0.3 : 0.3);
            sb.grid(5, 2, (i, j, o) => { const a = lerp(a0, a1, i / 4), r = j ? 0.4 : 0.22; o[0] = xd; o[1] = by + r * Math.sin(a); o[2] = bz + r * Math.cos(a); }, k & 1 ? INK.red : INK.white); }
          for (const r of [0.4, 0.22]) boatHairs.push({ pts: circ(20, (a) => [xd + sg * 0.02, by + r * Math.sin(a), bz + r * Math.cos(a)]), width: 0.03 });
          boatHairs.push({ pts: [[x, UP + 2.42, P0], [x, UP + 2.42, P1]], width: 0.03 }); }
        boatHairs.push({ pts: [[x, UP + 1.14, P0], [x, UP + 1.14, P1]], width: 0.06 }, { pts: [[x, UP + 2.27, P0], [x, UP + 2.27, P1]], width: 0.05 });
        face([[sg * (PW + 0.63), PH - 0.06, P0 + 0.4], [sg * (PW + 0.63), PH - 0.06, P1 - 0.4], [sg * (PW + 0.63), PH + 0.36, P0 + 0.4], [sg * (PW + 0.63), PH + 0.36, P1 - 0.4]], INK.soot);   // the nameboard
        for (let k = 0; k < 7; k++) { const z = P0 + 0.9 + k * 0.4 + (k > 3 ? 0.25 : 0); boatHairs.push({ pts: [[sg * (PW + 0.66), PH + 0.04, z], [sg * (PW + 0.66), PH + 0.27, z + (k % 2 ? 0.0 : 0.14)]], width: 0.06, ink: INK.white, ground: INK.soot }); }
      }
      for (const [z, sgz] of [[P1 + 0.03, 1], [P0 - 0.03, -1]]) {
        face([[-PW + 0.25, UP + 1.2, z], [PW - 0.25, UP + 1.2, z], [-PW + 0.25, UP + 2.2, z], [PW - 0.25, UP + 2.2, z]], INK.soot);
        for (const xx of [-0.45, 0.45]) boatHairs.push({ pts: [[xx, UP + 1.2, z + sgz * 0.02], [xx, UP + 2.2, z + sgz * 0.02]], width: 0.07, ink: INK.white, ground: INK.soot });
      }
      face([[0.5, UP + 0.05, P0 - 0.05], [1.3, UP + 0.05, P0 - 0.05], [0.5, UP + 1.1, P0 - 0.05], [1.3, UP + 1.1, P0 - 0.05]], INK.straw);     // the door's lower panel
      boatHairs.push({ pts: [[0.5, UP + 0.05, P0 - 0.07], [0.5, UP + 1.1, P0 - 0.07], [1.3, UP + 1.1, P0 - 0.07], [1.3, UP + 0.05, P0 - 0.07]], width: 0.04 });
      box(-PW - 0.6, PW + 0.6, PH, PH + 0.3, P0 - 0.6, P1 + 0.6, INK.straw, INK.straw, { bottom: INK.straw });
      boatHairs.push({ pts: [[-PW - 0.62, PH, P0 - 0.62], [PW + 0.62, PH, P0 - 0.62], [PW + 0.62, PH, P1 + 0.62], [-PW - 0.62, PH, P1 + 0.62], [-PW - 0.62, PH, P0 - 0.62]], width: 0.05, ground: INK.straw }); }
    const tube = (cx, cz, r0, r1, y0, y1, ink, n = 10) => sb.grid(n + 1, 2, (i, j, o) => { const a = i / n * TAU, r = j ? r1 : r0; o[0] = cx + r * Math.cos(a); o[1] = j ? y1 : y0; o[2] = cz + r * Math.sin(a); }, ink);
    { const by = UP + 2.9, bz = 26.7;                                                                                           // the bell in its frame, on the pilot house roof
      tube(0, bz, 0.3, 0.1, by + 0.25, by + 0.75, INK.straw, 8);
      boatHairs.push({ pts: [[-0.42, by, bz], [-0.42, by + 1.0, bz], [0.42, by + 1.0, bz], [0.42, by, bz]], width: 0.06 }, { pts: [[0, by + 1.0, bz], [0, by + 0.75, bz]], width: 0.04 }); }
    for (const bx of [-2.7, 1.1]) {      // lifebuoys on the forward rail: red and white segments meeting in hard edges, a soot hairline round each
      for (let k = 0; k < 8; k++) { const a0 = (k >> 1) * TAU / 4 + (k & 1 ? 0.3 : -0.3), a1 = (k >> 1) * TAU / 4 + (k & 1 ? TAU / 4 - 0.3 : 0.3);
        sb.grid(5, 2, (i, j, o) => { const a = lerp(a0, a1, i / 4), r = j ? 0.4 : 0.22; o[0] = bx + r * Math.cos(a); o[1] = UP + 0.56 + r * Math.sin(a); o[2] = 43.8; }, k & 1 ? INK.red : INK.white); }
      for (const r of [0.4, 0.22]) boatHairs.push({ pts: circ(20, (a) => [bx + r * Math.cos(a), UP + 0.56 + r * Math.sin(a), 43.78]), width: 0.03 }); }
    const STACKS = [[-2.4, 31.5], [-1.2, 36.8]];    // the stacks: slim, one before the other and to port, so that
    for (const [sx, sz] of STACKS) {                // both show from astern and neither stands before the forward promenade's view
      tube(sx, sz, 0.44, 0.43, UP, 12.3, LIV); tube(sx, sz, 0.45, 0.45, 12.3, 12.9, INK.white); tube(sx, sz, 0.45, 0.45, 12.9, 13.25, TRIM); tube(sx, sz, 0.43, 0.4, 13.25, 16.6, LIV); tube(sx, sz, 0.45, 0.45, 16.6, 17.5, INK.white); tube(sx, sz, 0.4, 0.38, 17.5, 21.4, LIV);
      tube(sx, sz, 0.38, 0.72, 21.4, 22.1, LIV);
      for (const gy of [15.2, 19.2]) boatHairs.push({ pts: [[sx, gy, sz], [-3.9, UP + 0.1, sz]], width: 0.035, ground: INK.sky });   // guy wires, to port
    }
    // the bow: capstan, hatch, bollards, jack-staff and its pennant (which snaps: a short travelling wave)
    tube(0, 53.5, 0.55, 0.4, DECK, DECK + 1.0, INK.soot, 8); tube(0, 53.5, 0.7, 0.7, DECK + 1.0, DECK + 1.2, INK.soot, 8);
    box(-1.6, 1.6, DECK, DECK + 0.3, 46.5, 50.5, INK.straw, INK.straw);
    for (const sg of [-1, 1]) box(sg * 2.3 - 0.15, sg * 2.3 + 0.15, DECK, DECK + 0.55, 51.6, 51.9, INK.soot, INK.soot);
    box(-0.06, 0.06, DECK, 4.25, 58.5, 58.62, INK.soot, INK.soot);
    sb.grid(8, 2, (i, j, o) => { const t = i / 7, h = (0.4 * (1 - t) + 0.03) * (j ? 1 : -1); o[0] = h * 0.75; o[1] = 3.8 + h - 0.15 * t; o[2] = 58.45 - 2.5 * t; }, TRIM,
      (i, j) => [0.36 * (i / 7), 0.15 * (i / 7), 3.0, 0.4]);
    for (const sg of [-1, 1]) face([[sg * (UW - 0.34), UP + 0.006, 1], [sg * UW, UP + 0.006, 1], [sg * (UW - 0.34), UP + 0.006, 44], [sg * UW, UP + 0.006, 44]], INK.skyTint);     // the covering board along each edge of the upper deck
    padFx(0, 0, 0, 0);
    await ctx.yield();
    // the wheels: open, 9.4 m across, standing clear of the hull on their shafts so that the whole turning face shows
    // from the promenade. The outer face carries the sixteen spokes (thin: drawn from a centre line and a side, and
    // held to a pixel and a half in the shader), the inner one only its rims; sixteen straw floats between them.
    // Turned (and curled) in the shader.
    const HUBY = 4.9, HUBZ = 25, WR = 5.2, wfx = [];
    const wgrid = (nu, nv, fn, ink, w) => { sb.grid(nu, nv, (i, j, o) => fn(i, j, o), ink); for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) wfx.push(w ? w(i, j) : 0); };
    for (const sg of [-1, 1]) {
      const xs = [sg * 8.7, sg * 9.6];
      const ring = (x, r, hw) => wgrid(49, 2, (i, j, o) => { const a = i / 48 * TAU; o[0] = x; o[1] = HUBY + r * Math.cos(a); o[2] = HUBZ + r * Math.sin(a); }, TRIM, (i, j) => (j ? 1 : -1) * (2 + hw));
      ring(xs[0], WR - 0.08, 0.08); ring(xs[1], WR - 0.26, 0.26); ring(xs[1], WR * 0.57, 0.11);
      wgrid(13, 2, (i, j, o) => { const a = i / 12 * TAU, r = j ? 1.05 : 0; o[0] = xs[1] + (j ? 0 : sg * 0.3); o[1] = HUBY + r * Math.cos(a); o[2] = HUBZ + r * Math.sin(a); }, TRIM);
      for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, ca = Math.cos(a), sa = Math.sin(a);
        // a spoke is a comma: a thin tail out of the hub ending in a round head just inside the rim (curled in the shader)
        wgrid(18, 2, (i, j, o) => { const r = 0.9 + (WR - 1.72) * Math.pow(i / 17, 0.85); o[0] = xs[1]; o[1] = HUBY + r * ca; o[2] = HUBZ + r * sa; }, TRIM, (i, j) => { const t = Math.pow(i / 17, 0.85); return (j ? 1 : -1) * (1 + (0.07 + 0.07 * t * t + 0.31 * Math.exp(-(((t - 0.9) / 0.075) ** 2))) * (i === 17 ? 0.45 : 1)); }); }
      for (let k = 0; k < 16; k++) { const a = (k + 0.5) / 16 * TAU, ca = Math.cos(a), sa = Math.sin(a);
        wgrid(2, 2, (i, j, o) => { const r = WR - 0.66 + 0.7 * j; o[0] = xs[i]; o[1] = HUBY + r * ca; o[2] = HUBZ + r * sa; }, INK.straw, () => 3); }   // short floats on the outer rim, so the spoke face shows from the deck
      wgrid(9, 2, (i, j, o) => { const a = i / 8 * TAU; o[0] = j ? xs[1] + sg * 0.25 : sg * 6.5; o[1] = HUBY + 0.13 * Math.cos(a); o[2] = HUBZ + 0.13 * Math.sin(a); }, TRIM);
    }
    for (const w of wfx) fx.push(1, HUBY, HUBZ, w);
    // FIX ROUND 11 (II d), MEND 11: the floats throw white water, as marks of the strip. Astern of each wheel's foot one foam
    // stripe lies on the water: as wide as the wheel is thick (its two faces, WF) just astern of the foot, tapering to nothing
    // FOAM metres astern, its line wavering as the ripple bands' lines do. And slim pointed dashes leave the water where the
    // floats come up out of it (FOOT metres astern of the hub): each lies along the course, five to nine times as long as it
    // is wide, flies its own arc below the hub and closes to nothing as it lands (in the shader, on world time only, as the
    // brief allows the wheels). Dealt from a stream of its own: first the two stripes' wavering, then the dashes. On a boat
    // whose wheel is at her stern the stripe and the dashes go there with the wheel.
    const FOOT = Math.sqrt(WR * WR - HUBY * HUBY);
    { const NFL = Math.round(28 * detail), rSpray = ctx.core.makeRng(ctx.core.hashSeed('long-swan-spray:' + ctx.seed));
      const WF = [8.7, 9.6], FOAM = 30, fz = [0, 0.5, 1.2, 2.2, ...rings(4, FOAM, 2)], foamW = (s) => (WF[1] - WF[0]) / 2 * Math.sqrt(sstep(0, 2.2, s)) * (1 - s / FOAM);
      for (const sg of [-1, 1]) { const lam = rSpray.range(26, 56), ph = rSpray.range(0, TAU);
        sb.grid(2, fz.length, (i, j, o) => { o[0] = sg * ((WF[0] + WF[1]) / 2 + (i ? 1 : -1) * foamW(fz[j])); o[1] = 0.07; o[2] = HUBZ - fz[j]; }, INK.white, (i, j) => [0.35 * sstep(0, 12, fz[j]), 0, lam, ph]);
        padFx(5, 0, 0, 0); }
      for (const sg of [-1, 1]) for (let k = 0; k < NFL; k++) {
        const ph = (k + rSpray()) / NFL, x0 = rSpray.range(WF[0], WF[1]), hw = rSpray.range(0.07, 0.15), hl = hw * rSpray.range(5, 9), hh = rSpray();
        sb.grid(2, 3, (i, j, o) => { const w = j === 1 ? (i ? hw : -hw) : 0; o[0] = sg * x0 + w; o[1] = w * 0.7; o[2] = HUBZ - FOOT + (j - 1) * hl; }, INK.white);
        for (let v = 0; v < 6; v++) fx.push(3, ph, hh, x0);
      } }

    await ctx.yield();
    // smoke: two flat ribbons trailing back from the stacks, tied in loose knots every 20 m (built in the shader
    // from s = metres back along the ribbon, so the knots can slide back along it)
    const NSM = 250, DS = 0.78;
    for (const sg of [-1, 1]) {
      sb.grid(2, NSM + 1, (i, j, o) => { const st = STACKS[sg > 0 ? 1 : 0]; o[0] = st[0]; o[1] = 22.1; o[2] = st[1]; }, INK.soot);
      for (let j = 0; j <= NSM; j++) for (let i = 0; i < 2; i++) fx.push(2, j * DS, i ? 1 : -1, sg > 0 ? 0.31 : 0.83);
    }
    // FIX ROUND 11 (II f): the smoke reads as smoke: a second pair of ribbons in the same plane, with the same knots and
    // the same slide. MEND 11: it is the first ribbon's own width through every knot, so the loop stands open, and between
    // two knots it swells into two rounded lobes, SMOKE_W times as wide at their fullest (in the shader); three vertices across
    const SMOKE_W = 2.0;
    for (const sg of [-1, 1]) {
      sb.grid(3, NSM + 1, (i, j, o) => { const st = STACKS[sg > 0 ? 1 : 0]; o[0] = st[0]; o[1] = 22.1; o[2] = st[1]; }, INK.soot);
      for (let j = 0; j <= NSM; j++) for (let i = 0; i < 3; i++) fx.push(2, j * DS, (i - 1) * SMOKE_W, sg > 0 ? 0.31 : 0.83);
    }
    await ctx.yield();
    // scratches on the boat: plank seams, rails and stanchions at arm's length
    for (let x = -4.05; x <= 4.06; x += 0.45) { let z = 1.1;
      for (const [cx0, cz0] of [...COILS].sort((a, b2) => a[1] - b2[1])) { const dx = x - cx0; if (Math.abs(dx) < COILR) { const h = Math.sqrt(COILR * COILR - dx * dx); boatHairs.push({ pts: [[x, UP + 0.012, z], [x, UP + 0.012, cz0 - h]], width: 0.035 }); z = cz0 + h; } }
      boatHairs.push({ pts: [[x, UP + 0.012, z], [x, UP + 0.012, 43.9]], width: 0.035 }); }
    { let pk = 0; for (let x = -4.05; x < 4.0; x += 0.45, pk++) for (let z = 2.2 + (pk * 2.3) % 4.6; z < 43.5; z += 4.6) {     // butt joints, staggered plank by plank
        if (COILS.some(([cx0, cz0]) => Math.hypot(x + 0.22 - cx0, z - cz0) < COILR + 0.3) || (Math.abs(x + 0.22) < 1.9 && ((z > 5.3 && z < 20.7) || (z > 24 && z < 29.4))) || (z > 30.5 && z < 38 && x < -0.3 && x > -3.4)) continue;
        boatHairs.push({ pts: [[x + 0.02, UP + 0.012, z], [x + 0.43, UP + 0.012, z]], width: 0.03 }); } }
    for (const sg of [-1, 1]) {     // the covering board's inner seam
      boatHairs.push({ pts: [[sg * (UW - 0.34), UP + 0.014, 1.1], [sg * (UW - 0.34), UP + 0.014, 43.9]], width: 0.04, ground: INK.skyTint }); }
    for (let x = -5.85; x <= 5.86; x += 0.45) {
      let lo = 42, hi = 60; for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (hullW(m) > Math.abs(x) + 0.12) lo = m; else hi = m; }
      if (lo > 43) boatHairs.push({ pts: [[x, DECK + 0.012, 42.05], [x, DECK + 0.012, lo]], width: 0.035 });
    }
    const railRun = (P, y0, h, gap) => {       // top rail, mid rail and stanchions along a polyline on a deck
      boatHairs.push({ pts: P.map((p) => [p[0], y0 + h, p[1]]), width: 0.075 }, { pts: P.map((p) => [p[0], y0 + h * 0.5, p[1]]), width: 0.04 });
      for (let k = 0; k < P.length - 1; k++) { const a = P[k], c = P[k + 1], n = Math.max(1, Math.round(Math.hypot(c[0] - a[0], c[1] - a[1]) / gap));
        for (let m = 0; m < n; m++) { const x = lerp(a[0], c[0], m / n), z = lerp(a[1], c[1], m / n); boatHairs.push({ pts: [[x, y0, z], [x, y0 + h, z]], width: 0.05 }); } }
    };
    railRun([[1.9, 43.85], [-UW + 0.05, 43.85], [-UW + 0.05, 1.15], [UW - 0.05, 1.15], [UW - 0.05, GANG[0]]], UP, 1.05, 1.5);
    for (let k = 0; k < 6; k++) { const z0 = lerp(GANG[0], GANG[1], k / 6), z1 = lerp(GANG[0], GANG[1], (k + 1) / 6);     // the gangway: slim posts and two chains (hairlines)
      boatHairs.push({ pts: [[UW - 0.05, UP, z1], [UW - 0.05, UP + 1.05, z1]], width: 0.04 }); if (!k) boatHairs.push({ pts: [[UW - 0.05, UP, z0], [UW - 0.05, UP + 1.05, z0]], width: 0.05 });
      for (const [cy, sag] of [[1.02, 0.22], [0.56, 0.16]]) boatHairs.push({ pts: Array.from({ length: 9 }, (_, i) => { const t = i / 8; return [UW - 0.05, UP + cy - sag * 4 * t * (1 - t), lerp(z0, z1, t)]; }), width: 0.02 }); }
    for (const sg of [-1, 1]) railRun(hz.filter((z) => z >= 44 && z < 59.2).map((z) => [sg * (hullW(z) - 0.06), z]), DECK, 0.95, 1.4);
    const crossMat = new THREE.ShaderMaterial({
      uniforms: { uTime: style.uniforms.uTime, uFlow: style.uniforms.uFlow, uWobble: style.uniforms.uWobble, uGust: style.uniforms.uGust, uInk: style.uniforms.uInk,
        uDeep: style.uniforms.uDeep, uPale: style.uniforms.uPale, uFar: style.uniforms.uFar, uViewH: style.uniforms.uViewH, uZOff: { value: 0 } },
      vertexShader: /* glsl */`
        attribute float aInk; attribute vec4 aWob; attribute vec4 aFx; attribute vec4 aBoat;   // aBoat: stretch, livery + 16 * trim, wheel phase, stern wheel
        uniform vec3 uInk[9]; uniform vec3 uDeep[9]; uniform float uViewH;
        varying vec3 vInk; varying vec3 vDeep; varying float vNy; varying float vDist;
        ${STYLE_GLSL.vertex}
        void main() {
          float trim = floor(aBoat.y / 16.0 + 1e-3), liv = aBoat.y - trim * 16.0;
          float fi = aInk > 9.5 ? trim : (aInk > 8.5 ? liv : aInk);
          int ii = int(clamp(fi, 0.0, 8.0) + 0.5);
          vInk = uInk[ii]; vDeep = uDeep[ii];
          vec3 p = position, n = normal;
          if (aFx.x > 0.5 && aFx.x < 1.5) {
            // rule five: turning things curl. Each wheel vertex turns about its hub by an angle that grows with its
            // z offset (z is time), so a straight spoke is a comma; the z stretch below draws commas out into hooks.
            float sw = aBoat.w, sx = p.x > 0.0 ? 1.0 : -1.0;
            vec2 q = p.yz - aFx.yz;
            float aw = abs(aFx.w), kind = floor(aw + 1e-3), ql = max(length(q), 1e-3);
            if (kind > 0.5 && kind < 2.5) {      // a spoke (1: widened across) or a rim (2: widened along the radius), never under 1.5 px
              vec4 wc = modelMatrix * instanceMatrix * vec4(p.x, aFx.y, aFx.z + q.y * aBoat.x, 1.0);
              float hw = max(aw - kind, 0.8 * distance(wc.xyz, cameraPosition) / max(projectionMatrix[1][1] * uViewH * 0.5, 1.0));
              q += sign(aFx.w) * hw * (kind > 1.5 ? q / ql : vec2(-q.y, q.x) / ql);
            }
            q *= mix(1.0, 0.82, sw);
            float th = uTime * 1.55 + aBoat.z, c = cos(th), s = sin(th);
            q = vec2(q.x * c - q.y * s, q.x * s + q.y * c);
            float rr = kind > 2.5 ? 0.94 : length(q) / 5.2, t2 = (kind > 2.5 ? 0.0 : 0.1 * q.y) - 1.25 * rr * rr * rr, c2 = cos(t2), s2 = sin(t2);   // (a float turns as one board)   // and every spoke curls the same way toward the rim: a comma
            q = vec2(q.x * c2 - q.y * s2, q.x * s2 + q.y * c2);
            p.yz = mix(aFx.yz, vec2(3.9, -4.6), sw) + q;
            p.x = mix(p.x, (p.x - sx * 8.7) * 5.9 + sx * 0.1, sw);
            n = kind > 2.5 ? vec3(0.0, -q.y, q.x) * sx : vec3(sx, 0.0, 0.0);     // a float is a board: its own facing, so its underside takes the deeper shade
          } else if (aFx.x > 4.5) {
            // MEND 11: the foam stripe astern of a wheel's foot goes where the wheel is (the wheel's own switch, as above)
            float sw = aBoat.w, sx = p.x > 0.0 ? 1.0 : -1.0;
            p.z += mix(0.0, -29.6, sw); p.x = mix(p.x, (p.x - sx * 8.7) * 5.9 + sx * 0.1, sw);
          } else if (aFx.x > 3.5) {
            // MEND 11: the guard, the bearing block and its legs stand where a side wheel is; with the wheel at the stern they close to nothing
            p = mix(p, vec3(0.0, 1.0, 25.0), aBoat.w);
          } else if (aFx.x > 2.5) {
            // FIX ROUND 11, MEND 11: a dash of white water thrown astern where the floats come up: it leaves the water as a
            // point, opens, flies its own arc (vy m/s up: vy * vy / 19.6 m high, 2.8 m at most, under the hub) and closes
            // to nothing as it lands vy / 4.9 s later; then it waits, closed, for its next turn
            float sw = aBoat.w, sx = p.x > 0.0 ? 1.0 : -1.0, h = aFx.z, vy = 2.2 + 5.2 * h, tl = vy / 4.9;
            vec3 c = vec3(sx * aFx.w, 0.0, ${(HUBZ - FOOT).toFixed(3)}), d = p - c;
            float t = min(fract(uTime * 0.6 + aFx.y) / 0.6, tl), s = t / tl;
            c.z -= (5.0 + 6.0 * fract(h * 7.3)) * t; c.x += sx * (0.2 + 0.9 * fract(h * 13.1)) * t;
            c.y = vy * t - 4.9 * t * t;
            c.z += mix(0.0, -29.6, sw); c.x = mix(c.x, (c.x - sx * 8.7) * 5.9 + sx * 0.1, sw);
            p = c + d * clamp(6.0 * s, 0.0, 1.0) * clamp(4.0 * (1.0 - s), 0.0, 1.0);
          } else if (aFx.x > 1.5) {
            float sm = aFx.y, lat = aFx.z;
            float fr = fract((sm - 7.0 * uTime) / 20.0 + aFx.w), q = clamp((fr - 0.32) / 0.36, 0.0, 1.0), e = q * q * (3.0 - 2.0 * q);
            // MEND 11: the broad ribbon (its edges are dealt wider than 1) keeps the slim ribbon's width through the knot and
            // swells between two knots into two rounded lobes (v runs 0 to 1 from the end of one knot to the next knot's beginning)
            if (abs(lat) > 1.5) { float v = min(fract(fr + 0.32) / 0.64, 1.0), sl = sin(6.2831853 * v); sl *= sl; lat = sign(lat) * (1.0 + (abs(lat) - 1.0) * sl * (2.0 - sl)); }
            float tw = 3.14159265 * e + 0.35 * sin(sm * 0.05 + aFx.w * 20.0);
            float hw = mix(0.4, 1.3, smoothstep(0.0, 24.0, sm)) * (1.0 - smoothstep(150.0, 194.0, sm));
            p.x += (aFx.w - 0.57) * sm * 0.035 + 0.5 * sin(sm * 0.045 + aFx.w * 9.0) + lat * hw * cos(tw);
            p.y += 9.5 * (1.0 - exp(-sm / 24.0)) + 0.7 * sin(sm * 0.08 + aFx.w * 5.0) - 1.5 * (1.0 - cos(6.2831853 * q)) + lat * hw * sin(tw);
            p.z += -sm + 2.3 * sin(6.2831853 * q);
            n = vec3(-sin(tw), cos(tw), 0.0);
            // FIX ROUND 11 (II e): the gust kinks the smoke too, at its own world z (the boat's place plus the ribbon's, drawn out as the boat is)
            float gz = instanceMatrix[3].z + 60.0 + (p.z - 60.0) * aBoat.x, gg = 0.0;
            for (int i = 0; i < 4; i++) { float d = (gz - uGust[i].x) / max(uGust[i].z, 1.0); gg += uGust[i].y * exp(-d * d); }
            p.x += 5.0 * gg; p.y += 0.6 * gg;
          }
          p = stripWarp(p, aWob, 60.0, aBoat.x);
          vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
          vNy = n.y / max(length(n), 1e-4);
          vDist = distance(wp.xyz, cameraPosition);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vInk; varying vec3 vDeep; varying float vNy; varying float vDist;
        ${STYLE_GLSL.fragment}
        void main() {
          float ny = gl_FrontFacing ? vNy : -vNy, fw = fwidth(vNy) * 0.75;
          gl_FragColor = vec4(stripFar(stripInk(vInk, vDeep, ny, fw), vDist), 1.0);
        }`,
      side: THREE.DoubleSide,
    });
    await ctx.yield();
    const NBOAT = 5, boatGeo = await sb.buildY(ctx);
    boatGeo.setAttribute('aFx', new THREE.Float32BufferAttribute(fx, 4));
    const boatAttr = new THREE.InstancedBufferAttribute(new Float32Array(NBOAT * 4), 4); boatAttr.setUsage(THREE.DynamicDrawUsage);
    const liveries = [INK.soot + 16 * INK.red, rivalLivery + 16 * (rivalLivery === INK.red ? INK.red : INK.red), INK.straw + 16 * INK.soot, INK.teal + 16 * INK.red, INK.white + 16 * INK.straw];
    for (let k = 0; k < NBOAT; k++) boatAttr.setXYZW(k, 1, liveries[k], k * 1.3, k > 1 && sternWheel ? 1 : 0);   // the rival keeps her side wheels: her spokes must be seen drawing out
    boatGeo.setAttribute('aBoat', boatAttr);
    const boats = new THREE.InstancedMesh(boatGeo, crossMat, NBOAT); boats.frustumCulled = false; boats.name = 'steamers'; root.add(boats);
    boats.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    await ctx.yield();
    const boatHairGeo = await hairGeoY(boatHairs.map((L) => subdiv(L, 1.5)), ctx);
    const ourHair = new THREE.Mesh(boatHairGeo, hairMaterial(style, { pivot: 60 })); ourHair.frustumCulled = false; root.add(ourHair);
    const rivalHair = new THREE.Mesh(boatHairGeo, hairMaterial(style, { pivot: 60 })); rivalHair.frustumCulled = false; root.add(rivalHair);
    await ctx.yield();

    // ---- kingfishers and their kind crossed fast, so each is a dash: blue with a straw underline, facing the line
    const dashGeo = new THREE.BufferGeometry();
    { const P = [], K = [], I = [];
      const tri = (a, b2, c, k) => { const b0 = P.length / 3; for (const p of [a, b2, c]) { P.push(p[0], p[1], p[2]); K.push(k); } I.push(b0, b0 + 1, b0 + 2); };
      const T = [0, 0.5, -0.5], Bk = [0, 0.5, 0.5], body = [T, [0, 1, -0.22], [0, 1, 0.12], Bk, [0, 0, 0.12], [0, 0, -0.22]];
      for (let k = 1; k < 5; k++) tri(body[0], body[k], body[k + 1], 0);                     // a dart: blunt behind, a beak in front
      tri(T, [-0.55, 0.5, -0.28], Bk, 0); tri(T, Bk, [0.55, 0.5, -0.28], 0);                        // the same seen from above
      tri([0, -0.2, -0.45], [0, -0.62, -0.45], [0, -0.4, 0.34], 1); tri([-0.22, -0.4, -0.45], [0.22, -0.4, -0.45], [0, -0.4, 0.34], 1);   // the straw underline
      dashGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); dashGeo.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1)); dashGeo.setIndex(I); }
    const dashMat = new THREE.ShaderMaterial({
      uniforms: { uTime: style.uniforms.uTime, uInk: style.uniforms.uInk, uPale: style.uniforms.uPale, uFar: style.uniforms.uFar, uViewH: style.uniforms.uViewH,
        uBody: { value: colourway === 'poster' ? INK.straw : INK.sky }, uUnder: { value: colourway === 'poster' ? INK.white : INK.straw } },
      vertexShader: /* glsl */`
        attribute float aKind; attribute vec4 aDash;     // speed over the film's (m/s past the strip), length, thickness, bob phase
        uniform float uTime, uViewH, uBody, uUnder; uniform vec3 uInk[9];
        varying vec3 vInk; varying float vDist;
        void main() {
          vec3 c = instanceMatrix[3].xyz;
          c.z = aDash.x == 0.0 ? c.z : -260.0 + mod(c.z + aDash.x * uTime, 1560.0);
          c.y += 0.25 * sin(uTime * 2.3 + aDash.w) * step(0.001, abs(aDash.x));
          float dist = distance((modelMatrix * vec4(c, 1.0)).xyz, cameraPosition);
          float th = aDash.y > 0.0 ? max(aDash.z, 3.2 * dist / max(projectionMatrix[1][1] * uViewH, 1.0)) : 0.0;     // a dash of no length is not laid (the rule below): every corner at its centre, no triangle
          vec3 p = vec3(position.x * th * 0.9, position.y * th, position.z * aDash.y);
          vec4 wp = modelMatrix * vec4(c + p, 1.0);
          vInk = uInk[int(clamp(aKind > 0.5 ? uUnder : uBody, 0.0, 8.0) + 0.5)]; vDist = dist;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`varying vec3 vInk; varying float vDist; ${STYLE_GLSL.fragment}
        void main() { gl_FragColor = vec4(stripFar(vInk, vDist), 1.0); }`,
      side: THREE.DoubleSide,
    });
    // THE RULE OF THIS PLACE (hand mend 12d): THE LANE IS KEPT CLEAR OF THE DASHES BY PLACE. A dash is a body, and the eye on
    // its route must have 2.0 m of clear air to its skin at every clock. A dash's REACH is all the room its skin can take up
    // at any clock: the whole line it slides along (the program above: z from -260 to 1300, the wrap included, at its own
    // x), its bob (0.25 m up and down), grown by its own size about its centre (0.495 of its thickness either side, its
    // thickness above and 0.62 of it below, half its length fore and aft); no weather moves a dash. The thickness is the
    // dealt one: the program's floor on it (a few pixels of the picture) tells only far from the lens, never near it.
    // The ROUTE is the path as the eye flies it (the engine stands the eye on path.posAtDist(d), from at most 0.45 m
    // before the path's beginning to its end), walked in metres, a point every 0.25 m, made once. A dash whose reach
    // comes within 2.0 m of a point of the route (and 0.05 m more for the sampling) is NOT LAID: it takes every draw as
    // the others do and keeps its slot, and is given no length and no thickness, and the program draws a dash of no
    // length as nothing. The test reads places in metres only: no camera, no u, no clock, no seed, no detail, no picture size.
    await ctx.yield();
    const ROUTE = [], RX = [1e9, -1e9];     // in design space, as the dashes are dealt; RX: the route's least and greatest x
    for (let d = -0.5; d < path.length + 0.25; d += 0.25) { path.posAtDist(d, _p); ROUTE.push(-_p.x, _p.y, _p.z); RX[0] = Math.min(RX[0], -_p.x); RX[1] = Math.max(RX[1], -_p.x); if (ROUTE.length % 1500 === 0) await ctx.yield(); }
    await ctx.yield();
    const DASH_TH = 0.13, DASH_AIR = 2.0 + 0.05;
    const offRoute = (x, y, len) => { const hx = 0.495 * DASH_TH, y0 = y - 0.25 - 0.62 * DASH_TH, y1 = y + 0.25 + DASH_TH, z0 = -260 - len / 2, z1 = 1300 + len / 2;
      if (x + hx <= RX[0] - DASH_AIR || x - hx >= RX[1] + DASH_AIR) return true;     // wide of the whole route: no point of it can be that near (saves the walk)
      for (let i = 0; i < ROUTE.length; i += 3) { const dx = Math.max(0, Math.abs(ROUTE[i] - x) - hx); if (dx >= DASH_AIR) continue;
        const dy = Math.max(0, y0 - ROUTE[i + 1], ROUTE[i + 1] - y1), dz = Math.max(0, z0 - ROUTE[i + 2], ROUTE[i + 2] - z1);
        if (dx * dx + dy * dy + dz * dz < DASH_AIR * DASH_AIR) return false; }
      return true; };
    const NDASH = Math.round(150 * detail * dens), _m = new THREE.Matrix4();
    const mkDashes = (n, fill) => { const g = dashGeo.clone(), a = new Float32Array(n * 4), mesh = new THREE.InstancedMesh(g, dashMat, n);
      for (let k = 0; k < n; k++) { const d = fill(k); mesh.setMatrixAt(k, _m.makeTranslation(d[0], d[1], d[2])); a.set(d.slice(3), k * 4); }
      g.setAttribute('aDash', new THREE.InstancedBufferAttribute(a, 4)); mesh.frustumCulled = false; root.add(mesh); return mesh; };
    mkDashes(NDASH, (k) => { const far = k % 3 === 0; let x = far ? rng.range(-118, 118) : rng.range(-75, -26);
      if (x > -9 && x < 26) x += 34; const d = [x, rng.range(0.6, far ? 9 : 4.5), rng.range(0, 1560), rng.range(-9, 14) + (rng.chance(0.5) ? 9 : -6), rng.range(1.0, 1.5), DASH_TH, rng.range(0, TAU)];
      if (!offRoute(d[0], d[1], d[4])) d[4] = d[5] = 0; return d; });     // not laid: its draws taken, its slot kept, no size
    const kf = mkDashes(3, (k) => [0, -50, 0, 0, k ? 2.2 : 2.3, k ? 0.36 : 0.42, 0]); kf.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    await ctx.yield();

    // ---- the line: here the ribbons stop and the things themselves stand, whole
    {
      const b = B(), cap = (P, ink) => b.grid(2, 2, (i, j, o) => { const q = P[j * 2 + i]; o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; }, ink);
      const still = { zWorld: null, step: 3 };
      for (const [cx, hw, hgt] of [[-163, 11, 19], [160, 10, 17], [-110.5, 7.5, 16]]) {      // one whole willow on each bank, one in the shallows
        const base = hgt * 0.42;
        rib(b, willowBands(cx, base - 0.6, hw * 1.12, hgt * 1.1, 1.0), LINE_Z - hw * 1.2, LINE_Z + hw * 1.2, { ...still, taper: hw * 1.2, about: [cx, base] });
        cap([[cx - 0.6, 0, LINE_Z], [cx + 0.6, 0, LINE_Z], [cx - 0.45, base + 2, LINE_Z], [cx + 0.45, base + 2, LINE_Z]], INK.soot);
        cap([[cx, 0, LINE_Z - 0.6], [cx, 0, LINE_Z + 0.6], [cx, base + 2, LINE_Z - 0.45], [cx, base + 2, LINE_Z + 0.45]], INK.soot);
      }
      { const cx = 181, hw = 7.6, wall = 9, ridge = 13.4, z0 = LINE_Z - 8, z1 = LINE_Z + 10;      // the shed and its gable
        rib(b, [{ pts: [[cx - hw, 3], [cx - hw, wall]], ink: INK.white }, { pts: [[cx - hw - 0.9, wall - 0.4], [cx, ridge]], ink: INK.red },
          { pts: [[cx, ridge], [cx + hw + 0.9, wall - 0.4]], ink: INK.red }, { pts: [[cx + hw, wall], [cx + hw, 3]], ink: INK.skyTint }], z0, z1, { ...still, taper0: 0, taper1: 0, step: 18 });
        for (const z of [z0, z1]) { cap([[cx - hw, 3, z], [cx + hw, 3, z], [cx - hw, wall, z], [cx + hw, wall, z]], INK.white); cap([[cx - hw, wall, z], [cx + hw, wall, z], [cx, ridge - 0.3, z], [cx, ridge - 0.3, z]], INK.white);
          cap([[cx - 1.6, 3, z - 0.05], [cx + 1.6, 3, z - 0.05], [cx - 1.6, 7.4, z - 0.05], [cx + 1.6, 7.4, z - 0.05]], INK.soot); } }
      const bx = (x0, x1, y0, y1, z0, z1, ink, top) => { cap([[x0, y0, z0], [x0, y0, z1], [x0, y1, z0], [x0, y1, z1]], ink); cap([[x1, y0, z0], [x1, y0, z1], [x1, y1, z0], [x1, y1, z1]], ink);
        cap([[x0, y0, z0], [x1, y0, z0], [x0, y1, z0], [x1, y1, z0]], ink); cap([[x0, y0, z1], [x1, y0, z1], [x0, y1, z1], [x1, y1, z1]], ink); cap([[x0, y1, z0], [x1, y1, z0], [x0, y1, z1], [x1, y1, z1]], top ?? ink); cap([[x0, y0, z0], [x1, y0, z0], [x0, y0, z1], [x1, y0, z1]], ink); };
      bx(-128.6 - 0.35, -128.6 + 0.35, 7, 58, LINE_Z - 0.35, LINE_Z + 0.35, INK.soot);     // the mast that carries the bunting; its other end is the port finish post
      hairs.push({ pts: [[crownW - POSTX, 46.6, LINE_Z], ...info.flags.map((f) => [f[0], f[1] + 0.05, LINE_Z]), [-128.6, flagY(-128.6), LINE_Z]], width: 0.12, ink: INK.soot, ground: INK.sky });
      // the judge's box on stilts with its one dark slit, and the ribbon it left: it never moved
      const jx = 20, jy = 14;
      bx(jx - 3, jx + 3, jy, jy + 4.2, LINE_Z - 3, LINE_Z + 3, INK.white); bx(jx - 3.7, jx + 3.7, jy + 4.2, jy + 4.8, LINE_Z - 3.7, LINE_Z + 3.7, INK.straw);
      cap([[jx - 2.4, jy + 2.3, LINE_Z - 3.05], [jx + 2.4, jy + 2.3, LINE_Z - 3.05], [jx - 2.4, jy + 3.0, LINE_Z - 3.05], [jx + 2.4, jy + 3.0, LINE_Z - 3.05]], INK.soot);
      for (const sx of [-2.6, 2.6]) for (const sz of [-2.6, 2.6]) bx(jx + sx - 0.2, jx + sx + 0.2, 0, jy, LINE_Z + sz - 0.2, LINE_Z + sz + 0.2, INK.soot);
      // FIX ROUND 11 (IV): it reads as a hut on its legs: a straw floor seen from below, a pitched straw roof whose white gable
      // faces down the course, and the slit, larger, on the face toward us and round the corner on the port face
      cap([[jx - 3.02, jy - 0.04, LINE_Z - 3.02], [jx + 3.02, jy - 0.04, LINE_Z - 3.02], [jx - 3.02, jy - 0.04, LINE_Z + 3.02], [jx + 3.02, jy - 0.04, LINE_Z + 3.02]], INK.straw);
      for (const e of [-1, 1]) { cap([[jx + e * 3.7, jy + 4.8, LINE_Z - 3.7], [jx + e * 3.7, jy + 4.8, LINE_Z + 3.7], [jx, jy + 6.0, LINE_Z - 3.7], [jx, jy + 6.0, LINE_Z + 3.7]], INK.straw);
        cap([[jx - 3.7, jy + 4.8, LINE_Z + e * 3.7], [jx + 3.7, jy + 4.8, LINE_Z + e * 3.7], [jx, jy + 6.0, LINE_Z + e * 3.7], [jx, jy + 6.0, LINE_Z + e * 3.7]], INK.white); }
      cap([[jx - 2.75, jy + 1.9, LINE_Z - 3.07], [jx + 2.75, jy + 1.9, LINE_Z - 3.07], [jx - 2.75, jy + 3.2, LINE_Z - 3.07], [jx + 2.75, jy + 3.2, LINE_Z - 3.07]], INK.soot);
      cap([[jx - 3.07, jy + 1.9, LINE_Z - 2.75], [jx - 3.07, jy + 1.9, LINE_Z + 2.75], [jx - 3.07, jy + 3.2, LINE_Z - 2.75], [jx - 3.07, jy + 3.2, LINE_Z + 2.75]], INK.soot);
      rib(b, [{ pts: [[jx - 2.8, jy + 0.2], [jx - 2.8, jy + 4]], ink: INK.white }, { pts: [[jx - 3.4, jy + 4.1], [jx, jy + 4.6], [jx + 3.4, jy + 4.1]], ink: INK.straw },
        { pts: [[jx + 2.8, jy + 4], [jx + 2.8, jy + 0.2]], ink: INK.skyTint }, { pts: [[jx + 2.8, jy + 0.2], [jx - 2.8, jy + 0.2]], ink: INK.white },
], 806, LINE_Z - 2.9, { zWorld: null, step: 12, taper0: 30, taper1: 0, about: [jx, jy] });
      hairs.push({ pts: rings(832, LINE_Z - 3.1, 20).map((z) => [jx - 2.85, jy + 2.65, z]), width: 0.55, ink: INK.soot, ground: INK.white });
      info.lineGeo = b;
    }
    await ctx.yield();
    // the finish post with its red hoop, and the hoop's own ribbon: a red tube 15 m across pointing back at us
    const HOOP = new THREE.Vector3(crownW, 8, LINE_Z), TR = 7.62;
    {
      const b = info.lineGeo;
      // FIX ROUND 11 (the designer's amendment; this replaces the closed clapboard wall of the rounds before): the
      // judge's hoop is a ring of red staves lashed round a rim with daylight between them, and its ribbon is those staves
      // drawn back toward us round a circle, with slots between. Twelve staves; each covers six tenths of its twelfth of the
      // circle and the slot beside it four tenths, at one width from the end of its beginning to the rim (only the film's
      // swell moves them). A stave is a board with real section (inner face, back, two sides, a soot strip along each edge;
      // no end face), so those overhead turn downward and take the deeper red. It begins as the world's ribbons begin
      // ("Ribbons begin and end: a flag hoisted is a ramp"): its whole section is drawn out of nothing over its first
      // RAMP metres, by one rule for all twelve. The brief: "we enter it at 37.5 s and fly its last 60 m": the staves begin
      // 60 m before the line, the lower ones a few metres earlier.
      const NST = 12, COVER = 0.6, TH = 0.45, RAMP = 7, WRAP_END = 1.5, swl = (z) => filmSwell(z) / filmSwell(LINE_Z), HA = COVER * Math.PI / NST;
      const staveMouth = (a) => LINE_Z - 60 - 4.5 * (1 - Math.sin(a));
      const staveMid = (a) => (Math.floor(((a % TAU) + TAU) % TAU / TAU * NST) % NST + 0.5) / NST * TAU;
      const grow = (d) => Math.sqrt(sstep(0, RAMP, d));
      const still = (z) => 1 - sstep(LINE_Z - 16, LINE_Z - 1, z);
      const onWall = (o, a, r, z) => { const rr = r * swl(z); o[0] = HOOP.x + rr * Math.cos(a); o[1] = HOOP.y + rr * Math.sin(a); o[2] = z; };
      // on a stave: the dealt angle a brought onto the stave whose twelfth of the circle holds it, no nearer its edge than m metres
      const onStave = (a, m) => { const ac = staveMid(a), room = Math.max(0, HA - m / TR); return [ac, ac + Math.max(-room, Math.min(room, a - ac))]; };
      // the staves' own marks (a white line on the odd staves, a white lashing band on the even ones) are dealt from a stream of their own
      const rStave = ctx.core.makeRng(ctx.core.hashSeed('long-swan-staves:' + ctx.seed));
      for (let k = 0; k < NST; k++) { const ac = (k + 0.5) / NST * TAU, z0 = staveMouth(ac), zs2 = [z0, z0 + 0.3, z0 + 0.9, z0 + 1.8, z0 + 3, z0 + 4.5, ...rings(z0 + 6, LINE_Z + 1.2, 4)], nz = zs2.length, g = (j) => grow(zs2[j] - z0);
        await ctx.yield();
        b.grid(5, nz, (i, j, o) => onWall(o, ac + HA * g(j) * (i / 2 - 1), TR, zs2[j]), INK.red);
        b.grid(2, nz, (i, j, o) => onWall(o, ac + HA * g(j) * (1 - 2 * i), TR + TH * g(j), zs2[j]), INK.red);
        for (const e of [-1, 1]) b.grid(2, nz, (i, j, o) => onWall(o, ac + e * HA * g(j), TR + (i ? TH * g(j) : 0), zs2[j]), INK.red, null, e > 0);
        for (const e of [-1, 1]) b.grid(2, nz, (i, j, o) => onWall(o, ac + e * (HA - (i ? 0.1 : 0) / TR) * g(j), TR - 0.02, zs2[j]), INK.soot);
        if (k % 2) { const off = rStave.range(-0.55, 0.55) * HA, wd = rStave.range(0.16, 0.24), zb = z0 + rStave.range(2, 22), zl = rings(zb, LINE_Z - 0.6, 4);
          b.grid(2, zl.length, (i, j, o) => onWall(o, ac + off * grow(zl[j] - z0) + (i ? wd : -wd) * 0.5 * Math.sqrt(sstep(0, 8, zl[j] - zb)) / TR, TR - 0.035, zl[j]), INK.white);
        } else { const hw = rStave.range(0.32, 0.5), zb = z0 + rStave.range(1.5, 12), zl = rings(zb, LINE_Z - 0.3, 1.5), lam = rStave.range(15, 22), ph = rStave.range(0, TAU);
          b.grid(3, zl.length, (i, j, o) => onWall(o, ac + (i - 1) * hw * Math.sqrt(sstep(0, 10, zl[j] - zb)) * grow(zl[j] - z0) / TR, TR - 0.06, zl[j]), INK.white, (i, j) => [-Math.sin(ac) * 0.17 * still(zl[j]) * grow(zl[j] - z0), Math.cos(ac) * 0.17 * still(zl[j]) * grow(zl[j] - z0), lam, ph]);
        }
        // the white wrap lies on its stave only (the stave's own width) and ends WRAP_END metres short of the line, clear of the rim and its lip
        b.grid(5, 2, (i, j, o) => onWall(o, ac + HA * (i / 2 - 1), TR - 0.07, LINE_Z - WRAP_END - 1.1 + j * 1.1), INK.white);
        if (k % 6 === 5) await ctx.yield();
      }
      // eight streamers, one in every second sixteenth of the round (k = 0, 2, ... 14), each on its stave
      for (let k = 0; k < 16; k += 2) { const ad = (k + rng.range(0.1, 0.9)) / 16 * TAU, hw = rng.range(0.12, 0.42) * 0.55, r = TR - 0.24, lead = rng.range(1, 10);
        const ink = [INK.white, INK.straw, INK.white, INK.soot, INK.skyTint][k % 5], amp = rng.range(0.3, 0.62) * 0.5, lam = rng.range(14, 24), ph = rng.range(0, TAU), [ac, a] = onStave(ad, hw + amp + 0.14), zm = staveMouth(ac), z0 = zm + lead, zs2 = rings(z0, LINE_Z - 0.5, 0.6);
        await ctx.yield();
        b.grid(2, zs2.length, (i, j, o) => { const e = Math.sqrt(sstep(0, 1, (zs2[j] - z0) / 9)), gz = grow(zs2[j] - zm); onWall(o, ac + (a - ac) * gz + (i ? hw : -hw) * e * gz / TR, r, zs2[j]); }, ink, (i, j) => { const gz = grow(zs2[j] - zm); return [-Math.sin(ac) * amp * gz, Math.cos(ac) * amp * gz, lam, ph]; }); }
      await ctx.yield();
      b.grid(49, 2, (i, j, o) => { const a = i / 48 * TAU, r = TR + (j ? 0.95 : 0); o[0] = HOOP.x + r * Math.cos(a); o[1] = HOOP.y + r * Math.sin(a); o[2] = LINE_Z + (j ? 0.3 : 0); }, INK.red);
      b.grid(49, 2, (i, j, o) => { const a = i / 48 * TAU, r = j ? TR + 0.02 : 6.85; o[0] = HOOP.x + r * Math.cos(a); o[1] = HOOP.y + r * Math.sin(a); o[2] = LINE_Z + 0.16; }, INK.red);     // the hoop's inner lip, just behind the opening, so its rim is red all round
      // MEND 11: the hoop is one firm red ring: a flat band of the rim's red in the hoop's own plane, from the rim's outer
      // edge (TR + 0.95, at LINE_Z + 0.3) outward by BAND metres, the same all round, behind the staves; it does not move
      { const BAND = 1.6, R0 = TR + 0.95;
        b.grid(49, 2, (i, j, o) => { const a = i / 48 * TAU, r = R0 + (j ? BAND : 0); o[0] = HOOP.x + r * Math.cos(a); o[1] = HOOP.y + r * Math.sin(a); o[2] = LINE_Z + 0.3; }, INK.red); }
      // nine hairlines: of fourteen places round the circle every third is left bare (asked before anything is drawn for it)
      for (let k = 0; k < 14; k++) { if (k % 3 === 0) continue; const ad = (k + rng.range(0.2, 0.8)) / 14 * TAU, r = TR - 0.05, lead = rng.range(1, 14), wd = rng.range(0.05, 0.16); const [ac, a] = onStave(ad, 0.22), zm = staveMouth(ac); hairs.push({ pts: rings(zm + lead, LINE_Z, 8).map((z) => { const az = ac + (a - ac) * grow(z - zm); return [HOOP.x + r * swl(z) * Math.cos(az), HOOP.y + r * swl(z) * Math.sin(az), z]; }), width: wd * 0.7, ink: INK.white, ground: INK.red }); }
      // two banded posts stand wide of the tube's mouth, 27 m tall, each with the arms that hold the hoop, a soot topmast
      // (the port one carries the bunting line, the other a pennant) and the banded sheet it left running back toward us
      for (const sgp of [-1, 1]) { const qx = crownW + sgp * POSTX, NB = 9, BH = 3, top = sgp < 0 ? 47 : 39;
        for (let k = 0; k < NB; k++) { const y0 = k * BH, ink = k % 2 ? INK.white : INK.red;
          b.grid(2, 2, (i, j, o) => { o[0] = qx + (i ? 0.6 : -0.6); o[1] = y0 + j * BH; o[2] = LINE_Z; }, ink); b.grid(2, 2, (i, j, o) => { o[0] = qx; o[1] = y0 + j * BH; o[2] = LINE_Z + (i ? 0.6 : -0.6); }, ink); }
        b.grid(2, 2, (i, j, o) => { o[0] = qx + (i ? 0.16 : -0.16); o[1] = NB * BH + j * (top - NB * BH); o[2] = LINE_Z; }, INK.soot);
        b.grid(2, 2, (i, j, o) => { o[0] = qx; o[1] = NB * BH + j * (top - NB * BH); o[2] = LINE_Z + (i ? 0.16 : -0.16); }, INK.soot);
        b.grid(2, 2, (i, j, o) => { o[0] = lerp(qx, crownW + sgp * 7.1, i); o[1] = lerp(23.2, 13.0, i) + j * 0.55; o[2] = LINE_Z + 0.2; }, INK.soot);
        b.grid(2, 2, (i, j, o) => { o[0] = lerp(qx, crownW + sgp * 8.5, i); o[1] = 7.75 + j * 0.5; o[2] = LINE_Z + 0.2; }, INK.soot);
        if (sgp > 0) b.grid(2, 2, (i, j, o) => { o[0] = qx + i * 5.2; o[1] = top - 0.2 - j * 2.3 * (1 - i); o[2] = LINE_Z; }, INK.red, (i) => [0, 0.25 * i, 9, 0.7]);
        const z0 = sgp < 0 ? 858 : 899, bands = [];
        for (let k = 0; k < NB; k++) bands.push({ pts: [[qx, k * BH], [qx, k * BH + BH]], ink: k % 2 ? (sgp < 0 ? INK.white : INK.skyTint) : INK.red });
        rib(b, bands, z0, LINE_Z, { zWorld: null, step: 6, taper0: sgp < 0 ? 40 : 22, taper1: 0, about: [qx, 0] }); }
      await ctx.yield();
      await addStrip(b, 'the-line'); info.lineGeo = null; info.flags = null;
    }
    // slit scratches running the whole length of the film
    for (let k = 0; k < 7; k++) { const x = [-29, -8.5, -50, -71, 34, 61, 95][k] + rng.range(-2, 2); hairs.push({ pts: rings(-300, 1700, 100).map((z) => [x, 0.05, z]), width: rng.range(0.07, 0.16), ink: k % 3 === 2 ? INK.soot : INK.white, ground: INK.teal }); }
    await ctx.yield();
    const hairMesh = new THREE.Mesh(await hairGeoY(hairs.map((L) => subdiv(L, 20)), ctx), hair); hairMesh.frustumCulled = false; hairMesh.name = 'scratches'; root.add(hairMesh);
    await ctx.yield();

    // ---- life keyed to u
    const gustU = weather === 'breeze' ? [0.075, 0.26, 0.45, 0.565, 0.72] : [0.075, 0.45, 0.565];     // the third crosses while the gaze is up the river at the neck
    const _cam = new THREE.Vector3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _c = new THREE.Vector3();
    const others = [[36, 150, 0], [-90, 335, -150], [84, 430, -150]];    // x, bow ahead of us at u 0, drift per u
    const racerBow = (u) => 150 - 58 * sstep(0, 0.17, u) + 140 * Math.max(0, u - 0.17);     // the first one: a subject off our starboard bow at u 0.16, then she runs down the swan's far side, smoke over the ridge
    const act = [0, 0, 0, 0], az = [0, 0, 0, 0];
    const place = (u) => {
      const c = camAt(u); _c.copy(c);
      const bx = _c.x + boatOff(u), bz = _c.z + bowRel(u);
      boats.setMatrixAt(0, _m.makeTranslation(bx, 0, bz - 60));
      const rl = rivalLen(u), rz = _c.z + rivalBowRel(u);
      boats.setMatrixAt(1, _m.makeTranslation(RIVALX, 0, rz - 60)); boatAttr.setX(1, rl);
      for (let k = 0; k < 3; k++) boats.setMatrixAt(2 + k, _m.makeTranslation(others[k][0], 0, _c.z + (k ? others[k][1] + others[k][2] * u : racerBow(u)) - 60));
      boats.instanceMatrix.needsUpdate = true; boatAttr.needsUpdate = true;
      ourHair.position.set(bx, 0, bz - 60); rivalHair.position.set(RIVALX, 0, rz - 60); rivalHair.material.uniforms.uStretch.value = rl;
      crowdMat.uniforms.uBump.value.set(bz, 9, 24);
      // kingfishers: one overtakes along the rail, two more skim the flank
      const z2 = 600 * (u - 0.537), z3 = 600 * (u - 0.596);     // metres ahead of us: they come up low on the water under our eye and rise ahead
      const kd = Math.max(0, 0.25 - u);     // it overtakes over our port rail, dives across the bow and is caught as a dash on plain water under the rival at u 0.25
      kf.setMatrixAt(0, _m.makeTranslation(_c.x - 3.1 - 100 * kd + 30 * Math.max(0, u - 0.25), u > 0.17 && u < 0.34 ? Math.max(1.2, _c.y - 2.1 + 60 * kd - 40 * Math.max(0, u - 0.25)) : -50, _c.z + 5.4 + 190 * (u - 0.25)));
      kf.setMatrixAt(1, _m.makeTranslation(_c.x + 5.6, z2 > -30 && z2 < 90 ? 2.6 + 0.05 * Math.max(0, z2) : -50, _c.z + z2));
      kf.setMatrixAt(2, _m.makeTranslation(_c.x - 9.0, z3 > -30 && z3 < 80 ? 2.2 + 0.05 * Math.max(0, z3) : -50, _c.z + z3));
      kf.instanceMatrix.needsUpdate = true;
      act.fill(0); az.fill(0);
      for (let i = 0; i < gustU.length; i++) { const q = (u - gustU[i]) / 0.075; if (q > 0 && q < 1) { act[i & 3] = Math.sin(Math.PI * q) * (weather === 'breeze' ? 1.25 : 1); az[i & 3] = _c.z + lerp(420, -70, q); } }
      for (let i = 0; i < 4; i++) style.setGust(i, az[i], act[i], 26);
    };
    place(0);
    // the gaze, shot by shot (degrees: yaw to starboard, pitch up; the vault as a point in the bird's space)
    const GZ = { wheelYaw: 64, wheelPitch: -28.5, bow: [31, -5], wide: [-4, 6], close: [50, -4], lane: [-38, -6], vault: [crownW + 5, 30, 218], head: [2, 5.5, 0.78] };
    // the gaze: the wheel; the rival's wheel and stacks once our own stacks are astern; the tail tips rising to starboard;
    // the flank and the foot that is fanning open ahead at the closest pass; up to the neck; the head as we come under it
    const P = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(() => new THREE.Vector3()), HEADW = [-(HX + A.head.x), A.head.y, HZ + A.head.z];
    const RAD = Math.PI / 180;
    // a look given as a bearing from the camera: yaw in degrees to starboard of the course, pitch in degrees up
    const aim = (out, u, yaw, pitch) => { const c = camAt(u), cp = Math.cos(pitch * RAD); return out.set(-(c.x + 90 * Math.sin(yaw * RAD) * cp), c.y + 90 * Math.sin(pitch * RAD), c.z + 90 * Math.cos(yaw * RAD) * cp); };
    const pois = [
      // the wheel, seen from astern with the river and the horizon behind it: the look follows its hub but never drops so far that the horizon leaves the frame
      { at: (time, u) => { const c = camAt(u), dx = boatOff(u) + 9.6 + 1.3, dz = Math.max(0.5, bowRel(u) - 60 + HUBZ), dy = HUBY + 0.9 - c.y;
        return aim(P[0], u, Math.min(GZ.wheelYaw, Math.atan2(dx, dz) / RAD), Math.max(GZ.wheelPitch, Math.atan2(dy, Math.hypot(dx, dz)) / RAD)); }, from: 0.015, to: 0.128, weight: 0.93, fade: 0.2 },
      { at: (time, u) => aim(P[7], u, GZ.bow[0], GZ.bow[1]), from: 0.108, to: 0.2, weight: 0.85, fade: 0.2 },                                                     // out over the starboard bow: the racer, the bird beyond her
      { at: (time, u) => { const c = camAt(u); return P[1].set(-RIVALX, 8, c.z + Math.max(22, rivalBowRel(u) - 36 * rivalLen(u))); }, from: 0.188, to: 0.33, weight: 0.62 },
      { at: (time, u) => { const c = camAt(u); return P[2].set(1, 1.5, c.z + 28); }, from: 0.3, to: 0.368, weight: 0.65 },                                       // the tail feathers rising
      { at: (time, u) => { const c = camAt(u); return P[6].set(-RIVALX, 8, c.z + Math.max(30, rivalBowRel(u) - 32 * rivalLen(u))); }, from: 0.352, to: 0.418, weight: 0.6 },   // the rival drawn out
      { at: (time, u) => aim(P[8], u, GZ.wide[0], GZ.wide[1]), from: 0.402, to: 0.5, weight: 0.7, fade: 0.27 },                                                   // the wide picture: the rival to port, the back running away to the neck, smoke over the ridge
      { at: (time, u) => aim(P[3], u, GZ.close[0], GZ.close[1]), from: 0.47, to: 0.592, weight: 0.85, fade: 0.3 },                                              // the closest pass: turned to the flank, boards and one foot
      { at: (time, u) => aim(P[9], u, GZ.lane[0], GZ.lane[1]), from: 0.56, to: 0.668, weight: 0.6, fade: 0.33 },                                                 // back to the lane and the river: the gust, the dash, the chevrons
      { at: (time, u) => P[4].set(-GZ.vault[0], GZ.vault[1], HZ + GZ.vault[2]), from: 0.652, to: 0.762, weight: 0.62, fade: 0.25 },                                // the neck vault, whole
      { at: (time, u) => P[5].set(HEADW[0] - GZ.head[0], HEADW[1] + GZ.head[1], HEADW[2]), from: 0.735, to: 0.818, weight: GZ.head[2] },                          // the head
    ];
    Object.defineProperty(info, 'dbg', { value: { A, HUBY, HUBZ, camAt, boatOff, bowRel, racerBow, rivalBowRel, rivalLen, HX, HZ, crownW }, enumerable: false });     // for shots/the-long-swan/tmp/f3/proj.mjs (where things fall in the frame, no render)
    return {
      scene, path, duration: 40,
      pace: (u) => lerp(lerp(1.16, 0.9, sstep(0.28, 0.36, u)), 1.0, sstep(0.78, 0.88, u)),
      title: hero.info.black ? 'The Long Black Swan' : 'The Long Swan',
      camera: { fov: 62, near: 0.25, far: 4200, lookAhead: 30, sway: 0.25, bank: 0.2 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FBFAF4', veil: paleHex, style: 'ring', glow: 0, halo: false, revealDistance: 320, tilt: false },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      info,
      update(dt, time, camera, u) {
        const uu = sat(u || 0);
        hero.setProgress(uu);
        place(uu);
        hero.update(dt, time, camera);
        camera.getWorldPosition(_cam); sky.position.copy(_cam);
      },
      dispose() { hero.dispose(); dashGeo.dispose(); },
    };
  },
};
