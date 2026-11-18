// THE UMBRELLA FOREST (dragons-blood-fog). A monsoon morning on an island plateau, flown as an Egyptian
// vulture: dragon's-blood trees combing a river of fog that pours off a limestone escarpment, over the lip
// with it, round a pinnacle in the bay, and a stoop down the face of the Fogfall to turquoise pools.
//
// SPACE  The hero (src/parts/dragons-blood-fog.js) sits at the origin unrotated, so world space is its local
//        space: rim at y = 300, canyon floor at y = 0, the cliff faces +Z (south), fog flows -Z to +Z.
// LIGHT  No scene lights. Every material here is self-lit from the hero's uniforms (sun, sky, bounce, the
//        cap cloud and its sun break, the fog slab), so the hero and the world are lit by one rig.
// BEATS  (u) 0 entry low in the fog, one great dark umbrella on the axis against the sun break (we pass under
//        its crown at ~0.03); ~0.12-0.2 the climb out over violet pearl-grey fog under the cap cloud, looking
//        down into the white-gold sun break ahead (its curved edge crosses the middle of the frame at 0.16, each
//        crown in it throwing a round blue-violet shadow); ~0.24 starlings flush;
//        0.303 the scarred trunk abeam on the left (the weave before it is tuned per seed so it is 7 m off at
//        u 0.30); 0.357 over the lip heading south-east, an escort slewing across the bow (0.30-0.43);
//        0.43-0.447 the sunning vulture, standing wings-out on the pinnacle before a fin of dark rock, held near
//        the middle of the frame 18 to 21 m off; 0.447-0.49 a glance down at the pool chain and the
//        portal; ~0.46 five vultures on a thermal at our height in front of the west wall; 0.47-0.58 the gaze
//        sweeps from the west wall round to the fall (one aim, so it never points straight down);
//        0.52-0.58 right-hand sweep round the pinnacle's south side;
//        0.58-0.655 the level leg north, face-on to the whole Fogfall, three of the kettle crossing at 0.60;
//        0.655-0.896 the stoop down the wall; 0.9-1 pools, boulders, the portal between two buttresses.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero } from '../parts/dragons-blood-fog.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2;
const PALETTE = ['#E9E6DE', '#D9C19A', '#2E4A34', '#6C7690', '#3DB5AC', '#B3122A', '#E8799C'];
const dirOf = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return new V3(Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)).normalize(); };

// looks: hour x weather x season, chosen by seed (ctx.vary.hour wins when the viewer asks for one)
const HOURS = {
  morning: { sky: ['#3f78c4', '#a9c4de', '#e6e2d2'], cap: ['#f1eee6', '#8f97ad'], haze: '#9db7da', fog: 0.0007, exposure: 1.0, bloom: 0.3, sat: 1.08, tint: '#fffaf2', shadow: '#0a0e1c', glow: '#fff2d8', sea: '#2f6f93', night: 0 },
  dawn: { sky: ['#5a6fb0', '#e9a98f', '#ffd9b0'], cap: ['#ffc7a6', '#6f7499'], haze: '#c9a6a4', fog: 0.00072, exposure: 1.02, bloom: 0.36, sat: 1.1, tint: '#fff1ea', shadow: '#141230', glow: '#ffb884', sea: '#56608c', night: 0, sunDir: dirOf(104, 9) },
  evening: { sky: ['#3f66b0', '#b9b4c6', '#ffdcae'], cap: ['#ffe3bd', '#7d83a6'], haze: '#c8b2a8', fog: 0.00056, exposure: 1.0, bloom: 0.34, sat: 1.1, tint: '#fff3de', shadow: '#12102a', glow: '#ffcf8a', sea: '#44688a', night: 0, sunDir: dirOf(110, 20) },
  // moonlit: a big low moon in the west-south-west (ahead of us across the whole plateau, on the left of the Fogfall
  // as we face it), silver light and deep blue shade, and the trees' own red: glowing sap, ember-lit crown undersides
  night: { sky: ['#060a1e', '#15224c', '#333f6e'], cap: ['#6d7aa6', '#141b34'], haze: '#1f2c50', fog: 0.0005, exposure: 1.5, bloom: 0.42, sat: 1.05, tint: '#eef0ff', shadow: '#070a26', glow: '#b9c8ff', sea: '#0e1c36', night: 1, sunDir: dirOf(253, 11) },
};

export default {
  id: 'dragons-blood-fog',
  name: 'The Umbrella Forest',
  category: 'wilderness',
  weirdness: 0.25,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();

    // ---- the look of this visit
    const pick = rng();
    let hour = pick < 0.14 ? 'night' : pick < 0.34 ? 'dawn' : pick < 0.56 ? 'evening' : 'morning';
    if (vary.hour === 'dawn') hour = 'dawn'; else if (vary.hour === 'day') hour = 'morning'; else if (vary.hour === 'golden') hour = 'evening'; else if (vary.hour === 'night') hour = 'night';
    const pw = rng(), ps = rng();
    let weather = pw < 0.5 ? 'fog' : pw < 0.76 ? 'thin' : 'drizzle';
    let season = ps < 0.5 ? 'feb' : ps < 0.74 ? 'november' : 'summer';
    // a moonlit visit keeps its moon and its umbrellas: no drizzle deck over it, and never the summer fog that drowns
    // the crowns (by moonlight that left a bare pale plain); it comes with the bottle trees in flower
    if (hour === 'night') { if (weather === 'drizzle') weather = 'fog'; if (season === 'summer') season = 'feb'; }
    const rare = !!vary.rare, dens = clamp(vary.density ?? 1, 0.7, 1.3), altCast = rng() > 0.72;
    const H = HOURS[hour], night = H.night;
    scene.fog = new THREE.FogExp2(new THREE.Color(H.haze), H.fog * (weather === 'drizzle' ? 1.25 : 1));
    const wv = rng.range(-3, 3), wx = rng.range(-6, 6);

    // ---- the plateau route, laid for the hero so that its avenue, resin trunk and pinnacle follow it.
    //      Entry heading WSW with one great umbrella dead on the axis (the path bends round it), a climb out of
    //      the fog, the rim grove heading west, the scarred trunk dead ahead and then 5.5 m to the right, a long
    //      left turn and over the lip heading south-east with the pinnacle ahead on the right.
    const G = {};
    const route = ({ L, rim }) => {
      const cx = L.cx, zl = -L.depth;
      const W = (x, Z, h) => new V3(cx + x, rim + h, zl + Z);
      const WL = (x, g, h) => new V3(cx + x, rim + h, L.z(cx + x) - g);
      const d0 = new V3(-0.955, 0, 0.297).normalize(), lf = new V3(0.297, 0, 0.955).normalize();
      const A0 = W(319, -156, 6.5).addScaledVector(d0, -42);
      const at = (a, l, h) => A0.clone().addScaledVector(d0, a).addScaledVector(lf, l).setY(rim + h);
      const resinAt = WL(-46, 42, 5.7), lipAt = WL(-73.6, 0, 6.2);
      // the bay's west wall stands nearer on some seeds: slide the pinnacle and everything flown round it east until the
      // stoop's outer turn keeps 50 m from where that wall's face will be
      const faceX = (Z) => { for (let x = 0; x > -400; x -= 2) if (L.z(cx + x) + 28 > zl + Z) return x; return -400; };
      const E = clamp(Math.max(faceX(82) + 50 + 162, faceX(114) + 50 + 172, faceX(150) + 50 + 166, 0), 0, 70);
      // the entry stays 6.5 m up: the camera that draws this world inside a far-off portal stands behind and
      // below the entry, and from a lower start it skimmed the pavement, its stones looming in the opening
      const lay = (g) => [at(0, 0, 6.5), at(20, 0, 7.3), at(34, -0.6, 7.9), at(48, -5.2, 8.0), at(62, -10.5, 7.4), at(84, -12, 6.8), at(120, 0, 7), at(166, 21, 7), W(140 + wx, -74, 19), W(95 + wx, -59, 22.5),
        WL(66, 58, 13.5), WL(30, g, 7.6), WL(-6, 43 - wv * 0.5, 6.4), resinAt, WL(-68, 42, 5.9), WL(-82.1, 36.1, 6.1), WL(-88, 22, 6.3), WL(-82.1, 7.9, 6.4), WL(-71, -2.6, 6.0),
        W(-52 + E * 0.3, 22, 3.0), W(-30 + E * 0.7, 60, -1.5)];
      // the weave before the scarred trunk is drawn out or in until the trunk stands the same distance down the
      // path on every seed (the lip's line moves the points; the trunk must be abeam at u 0.30)
      const reach = (g) => { const q = lay(g); let d = 0; for (let i = 1; i <= 12; i++) d += q[i].distanceTo(q[i - 1]); return d; };
      let gLo = 50, gHi = 96; for (let k = 0; k < 16; k++) { const gm = (gLo + gHi) / 2; if (reach(gm) > 413.8) gHi = gm; else gLo = gm; }
      const pts = lay((gLo + gHi) / 2);
      const tree = at(48, 2, 0), shR = at(96, -27, 0), shL = at(104, 20, 0);
      Object.assign(G, { cx, zl, W, WL, rim, plateau: pts, axisTree: tree, d0, at, apex: pts[9], flockAt: pts[11], lipAt, resinAt, A0, E, shL, shR });
      // moonlit visits: old, big umbrellas stand along the bay's rim, their crowns out over the edge, so that from the
      // bay the top of the Fogfall is a row of ember-lit undersides against the sky (none in the corridor where we
      // cross the lip); and the one tree that the turn to the lip cropped at the corner of the frame is taken out
      const giants = [], clear = [];
      if (night) {
        const gr = ctx.core.makeRng(ctx.core.hashSeed('rim-giants:' + ctx.seed));
        for (let x = -338 + gr.range(0, 20), k = 0; x <= 338; x += gr.range(33, 50), k++) {
          const s = gr.range(1.75, 2.5), g = gr.range(5, 8.5), v = gr.int(0, 2);
          if (x > -114 && x < -42) continue;
          giants.push({ x: cx + x, z: L.z(cx + x) - g, s, variant: v, tint: gr.range(0.1, 0.5) });
        }
        clear.push({ x: cx - 75, z: L.z(cx - 75) - 21, r: 8.5 });
        // and one great umbrella stands alone at the brink west of where we cross, at full detail: on the turn to the
        // lip it is whole in the frame, forty metres off, its red underside against the moon
        const mt = { x: cx - 120, z: L.z(cx - 120) - 8, s: 2.25, variant: 0, tint: 0.3, lod: 0 };
        for (let i = giants.length - 1; i >= 0; i--) if (Math.abs(giants[i].x - mt.x) < 34) giants.splice(i, 1);
        clear.push({ x: mt.x, z: mt.z, r: 21 }, { x: mt.x + 22, z: mt.z - 16, r: 13 });
        giants.push(mt); G.moonTree = mt;
      }
      return {
        giants, clear,
        points: pts, resinAt, resinSide: -1, avenue: 28, pinnacle: { x: cx - 42 + E, z: zl + 105, top: rim - 10, slim: 0.78 },
        axisTrees: [{ x: tree.x, z: tree.z, s: 2.8, variant: 1, tint: -2.0, scarTo: A0, keep: 0.88 }, { x: shR.x, z: shR.z, s: 1.5, variant: 2, keep: 0.35 }, { x: shL.x, z: shL.z, s: 1.6, variant: 0, keep: 0.35 }],
      };
    };
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: PALETTE.map((h, i) => (i === 1 ? '#D0B48C' : h)), hour, weather, season, density: dens, sunDir: H.sunDir, route, hiTris: 90000, midCount: 96 });
    scene.add(hero.object);
    await ctx.yield();
    const U = hero.uniforms, L = hero.lip, RIM = G.rim, cx = G.cx, zl = G.zl, W = G.W;
    const sunDir = U.uSunDir.value.clone();
    if (hour === 'morning') { U.uFogLit.value.multiply(new THREE.Color(1.03, 1.06, 1.12)); U.uFogShade.value.multiply(new THREE.Color(0.86, 0.93, 1.12)); }   // white-gold in the sun, blue-violet in the shade
    // the river out of the sun: pearl-grey with a violet cast by day, mauve at dawn and dusk, silver under the moon (never navy stripes)
    const capLift = night ? 0.1 : hour === 'morning' ? 0.03 : 0.2, softK = night ? 1 : 0;
    if (!night) { U.uSkyCol.value.multiplyScalar(1.3).multiply(new THREE.Color(0.84, 0.93, 1.2)); U.uBounce.value.multiplyScalar(1.5); }
    if (hour === 'morning') { U.uSkyCol.value.multiply(new THREE.Color(0.88, 0.94, 1.14)); U.uBounce.value.multiply(new THREE.Color(0.7, 0.8, 1.08)); U.uSunCol.value.multiply(new THREE.Color(1.07, 1.0, 0.88)); }   // warm sun, violet shade: not one beige   // blue-violet shade: the canyon is full of sky
    const thinW = weather === 'thin';
    const fogInside = thinW ? U.uFogP.value.w : night ? 0.036 : 0.05, fogAbove = thinW ? U.uFogP.value.w : 0.11;      // above it the river is mist: thin enough to look down into from close by
    const fogLip = U.uFogP.value.y, fogBack = U.uFogP.value.z;
    const fogTopAt = (x, z) => { const g = L.z(x) - z; return RIM + lerp(fogLip, fogBack, smoothstep(105, 235, g)) * lerp(0.55, 1, smoothstep(0, 24, g)); };
    // a lull in the sheet round the scarred trunk, so the scar stands clear and the pavement shows through
    if (hero.anchors.resinTrunk && !thinW) { const rp = hero.anchors.resinTrunk.position; U.uHole.value.set(rp.x + 1, rp.z - 3, 1 / 42, 0.7); G.lull = { x: rp.x + 1, z: rp.z - 3 }; }

    // ---- the whole path: plateau, lip, past the pinnacle (on our right), a right-hand sweep round its south
    //      side, a level leg north facing the whole Fogfall, then the stoop: a left-hand spiral down the wall
    // the stoop and the canyon run keep clear of the wall and of the pinnacle's base on every seed: read the hero's
    // rock and slide the run east if the default line comes within 24 m of stone that is not well below it
    let SH = 0; const endZ = 372, E = G.E, PIN_OFF = -25;
    // (the stoop: a wing-over to the left off the level leg, 67 m and more from the bay's back wall, then down the middle
    //  of the bay in one shallow S, 100 m and more from its west wall, so that the wall, the fall on it, the floor and
    //  the pinch with its ring are one picture; it comes back over the stream from the east as it levels out. Heights
    //  follow one eased profile along the line: level off the leg, 55 degrees at the steepest, 30 at the pull-out)
    const STOOP = [[-95, 80, 0], [-108, 67, 0.3], [-124, 72, 0.6], [-131, 96, 0.8], [-126, 126, 1], [-118, 152, 1], [-118, 178, 1], [-131, 200, 1], [-152, 216, 1]];
    const lowerPts = (sh) => {
      const q = STOOP.map(([x, Z, k]) => [x + sh * k, Z]), cum = []; let px = -90, pz = 105, acc = 0;
      for (const [x, Z] of q) { acc += Math.hypot(x - px, Z - pz); cum.push(acc); px = x; pz = Z; }
      return q.map(([x, Z], i) => { const t = cum[i] / acc; return [x, Z, -39 - 248 * (0.5 * t + 0.5 * t * t * (3 - 2 * t))]; })
        .concat([[-160 + sh, 244, -291.5], [-152 + sh, 300, -292], [-152 + sh, endZ, -292]]).map(([x, Z, h]) => [x + E, Z, h]);
    };
    { const P = hero.object.children.find((m) => m.material === hero.materials.rock).geometry.attributes.position, near = [];
      for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > 262) continue; const x = P.getX(i) - cx, z = P.getZ(i) - zl; if (x > -300 && x < 20 && z > 0 && z < endZ + 30) near.push(x, y - RIM, z); }
      const clearOf = (sh) => {
        const pts = lowerPts(sh); let b = 1e9;
        for (let sg = 0; sg < pts.length - 1; sg++) for (let k = 0; k < 8; k++) {
          const f = k / 8, x = lerp(pts[sg][0], pts[sg + 1][0], f), Z = lerp(pts[sg][1], pts[sg + 1][1], f), h = lerp(pts[sg][2], pts[sg + 1][2], f);
          for (let i = 0; i < near.length; i += 3) { const dy = near[i + 1] - h; if (dy < -7) continue; const dx = near[i] - x, dz = near[i + 2] - Z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; }
        }
        return Math.sqrt(b);
      };
      await ctx.yield();
      let best = clearOf(0); G.clear0 = best;
      for (const sh of [8, 16, 24, 32, 40]) { if (best >= 26) break; await ctx.yield(); const d = clearOf(sh); if (d > best + 0.5) { best = d; SH = sh; } }
      G.clear = best;
    }
    const PX = -152 + SH + E, PXW = cx + PX;
    await ctx.yield();
    const PERCH_BACK = 0.03, pinPass = W(PIN_OFF + E, 105, -7.5), turnAt = W(-34 + E, 222, -24), leg0 = W(-90 + E, 214, -36), leg1 = W(-90 + E, 105, -39), stoopEnd = W(PX, 216, -287);
    const pathPts = G.plateau.concat([pinPass, W(-17 + E, 160, -13), turnAt, W(-62 + E, 246, -30), W(-85 + E, 236, -34), leg0, W(-90 + E, 160, -37), leg1],
      lowerPts(SH).map(([x, Z, h]) => W(x, Z, h)));
    const path = makePath(pathPts, { samples: 480 });
    const PL = path.length, portalPos = path.end.clone();
    await ctx.yield();
    const uOf = (p) => { let b = 1e9, bu = 0; const q = new V3(); for (let i = 0; i <= 900; i++) { const d = path.pointAt(i / 900, q).distanceToSquared(p); if (d < b) { b = d; bu = i / 900; } } return bu; };
    const uApex = uOf(G.apex), uResin = hero.anchors.resinTrunk ? uOf(hero.anchors.resinTrunk.viewFrom) : uOf(G.resinAt), uLip = uOf(G.lipAt);
    await ctx.yield();
    const uPin = uOf(pinPass), uTurn = uOf(turnAt), uLeg0 = uOf(leg0), uFace = uOf(leg1), uStoopEnd = uOf(stoopEnd), uFlock = uOf(G.resinAt) - 0.062;
    const pin = hero.pinnacle, pinLean = 5 * Math.sin(pin.top * 0.011 + pin.ph);
    const pinTop = new V3(pin.x + pinLean, pin.top + 1.2, pin.z + pinLean * 0.5);
    await ctx.yield();

    // ---- shared shader pieces: the hero's uniforms and fog slab, one light function
    const disposables = [];
    G.shadows = [];
    const LIGHT = /* glsl */`
      vec3 lightIt(vec3 alb, vec3 N, vec3 wp, float ao, float wrap){
        float m = sunMask(wp); float ndl = dot(N, uSunDir);
        float d = mix(clamp(ndl, 0., 1.), clamp(ndl * 0.6 + 0.4, 0., 1.), wrap);
        return alb * (uSunCol * d * m * mix(0.3, 1., ao) + uSkyCol * (0.55 + 0.45 * N.y) * (0.35 + 0.65 * ao) + uBounce * (0.6 - 0.4 * N.y) * ao);
      }`;
    const mat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...o,
    });
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
    const PAL = PALETTE.map((h) => col(h));

    // ---- sky: blue paling to cream beyond the rim, a pearl cap cloud over the plateau that ends at the lip
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uZen: { value: col(H.sky[0], night ? 1.5 : 1) }, uMid: { value: col(H.sky[1], night ? 1.22 : 1) }, uHor: { value: col(H.sky[2]) }, uHaze: { value: col(H.haze) },
        uCapLit: { value: col(H.cap[0], night ? 0.5 : 0.92) }, uCapShade: { value: col(H.cap[1], night ? 0.6 : 0.9) }, uGlow: { value: col(H.glow) }, uNight: { value: night }, uDeck: { value: weather === 'drizzle' ? 1 : 0 },
        uMoonC: { value: new THREE.Color(0.98, 0.84, 0.6) } },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 5000., 1.);
          if (abs(p.w) < 1e-4) p.w = 1e-4; p.z = p.w * 0.99995; gl_Position = p; }`,
      fragmentShader: /* glsl */`
        varying vec3 vDir;
        uniform vec3 uZen, uMid, uHor, uHaze, uCapLit, uCapShade, uGlow, uCamL, uMoonC; uniform float uNight, uDeck;
        ${hero.glsl}
        void main(){
          vec3 d = normalize(vDir + vec3(0., 1e-5, 0.)); float y = d.y;
          vec3 c = mix(uHaze, uHor, smoothstep(0., 0.07, y)); c = mix(c, uMid, smoothstep(0.03, 0.26, y)); c = mix(c, uZen, smoothstep(0.18, 0.8, y));
          float sd = max(dot(d, uSunDir), 0.); float sd2 = sd * sd, sd8 = sd2 * sd2 * sd2 * sd2;
          c += uGlow * (sd8 * 0.16 + sd8 * sd8 * sd8 * sd8 * 0.3) * (1. - uNight);
          float disc = smoothstep(mix(0.9993, 0.9986, uNight), mix(0.9997, 0.9990, uNight), sd);
          if (uNight > 0.5) {
            vec3 q = d * 210.; vec3 ci = floor(q); float hh = fract(sin(dot(ci, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
            vec3 f = fract(q) - 0.5; c += vec3(0.75, 0.82, 1.) * step(0.992, hh) * (1. - smoothstep(0.05, 0.32, length(f))) * smoothstep(0.02, 0.2, y) * (0.5 + 0.5 * sin(uTime * 2.3 + hh * 90.)) * 1.3;
          }
          float t = (uFogP.x + 330. - min(uCamL.y, uFogP.x + 200.)) / max(y, 0.012); vec2 P = uCamL.xz + d.xz * t;
          float g = lipZf(P.x) - P.y; vec2 w = vec2(0., uTime * uCap.y * 0.45);
          float lod = clamp(log2(max(t, 1.) / 500.), 0., 7.);
          float n = textureLod(uNoise, (P - w) * 0.0007, max(lod - 2., 0.)).r, n2 = textureLod(uNoise, (P - w * 1.3) * 0.0023, lod).g, n3 = textureLod(uNoise, (P - w * 0.7) * 0.00031, 0.).a;
          float soft = uNight * t * 0.3;                                       // (by night the cloud's far edge, a ruled line toward the horizon, is drawn soft, and the cloud keeps north of the moon)
          float cov = smoothstep(-220. - soft, 260. + soft, g - uNight * 620. + (n - 0.5) * 520. + (n2 - 0.5) * 110. + uDeck * 420.);
          vec3 cap = mix(uCapShade, uCapLit, clamp(0.3 + 0.55 * n3 + 0.3 * (n - 0.5) + 0.22 * (n2 - 0.5) + 0.5 * sd8, 0., 1.)) * (1. - 0.25 * uDeck);
          c = mix(c, cap, cov * mix(0.9, 0.97, uDeck));
          c += uGlow * disc * 5. * (1. - uNight) * (1. - 0.8 * cov);
          c += uGlow * sd8 * sd8 * 0.22 * cov * (1. - uNight);
          // the moon: a big low disc, ivory with grey seas and a darkened limb, a tight warm corona, a wide cool halo,
          // a dusky rose band low on the horizon under it and a silver lining on the cloud near it
          vec3 moonDisc = vec3(0.);
          if (uNight > 0.5) {
            vec3 mu = normalize(vec3(uSunDir.z, 0., -uSunDir.x) + vec3(1e-5, 0., 0.)), mv = cross(mu, uSunDir);
            vec2 mp = vec2(dot(d, mu), dot(d, mv)) / 0.05;
            float mr = length(mp), front = step(0., dot(d, uSunDir));
            float limb = sqrt(max(1. - min(mr * mr, 1.), 0.));
            float mare = smoothstep(0.4, 0.62, textureLod(uNoise, mp * 0.09 + vec2(0.37, 0.61), 0.).r) * 0.4 + smoothstep(0.48, 0.7, textureLod(uNoise, mp * 0.23 + 0.2, 0.).g) * 0.18;
            float md = (1. - smoothstep(0.92, 1.02, mr)) * front;
            moonDisc = uMoonC * 1.3 * (0.6 + 0.4 * limb) * (1. - mare) * md * (1. - 0.75 * cov);
            float sd16 = sd8 * sd8, sd64 = sd16 * sd16 * sd16 * sd16;
            c += (vec3(1., 0.84, 0.6) * (sd64 * sd64 * 0.22 + sd64 * 0.1) + vec3(0.45, 0.58, 1.) * (sd16 * 0.1 + sd2 * sd2 * 0.05)) * (1. - md) * mix(1., 0.55, cov);
            c += vec3(0.75, 0.36, 0.3) * 0.11 * exp(-max(y, 0.) * 11.) * sd2 * sd2;
            c += vec3(0.8, 0.78, 0.74) * 0.16 * sd16 * cov * (1. - cov) * 4.;
            // (and thin bars of cloud lie low over the sea, silver toward the moon, slate away from it)
            float baz = atan(d.x, d.z + 1e-5 * step(abs(d.x) + abs(d.z), 1e-5)) * 0.4775;
            float bars = textureLod(uNoise, vec2(baz, y * 4.5 + 0.3), 0.).a * 0.65 + textureLod(uNoise, vec2(baz * 2. + 0.4, y * 11.), 0.).r * 0.35;
            bars = smoothstep(0.54, 0.72, bars) * smoothstep(0.015, 0.06, y) * (1. - smoothstep(0.12, 0.24, y)) * (1. - cov) * (1. - md);
            c = mix(c, vec3(0.1, 0.125, 0.21) + vec3(0.5, 0.5, 0.52) * (0.14 * sd2 + 0.5 * sd16), bars * 0.5);
            c += moonDisc;
          }
          float gc = lipZf(uCamL.x) - uCamL.z; float top = fogTop(uCamL.xz);
          float len = max(top - uCamL.y, 0.) / max(y, 0.03);
          float fin = max(1. - exp(-uFogP.w * len), smoothstep(0.4, 3.2, top - uCamL.y) * (1. - smoothstep(0.02, 0.35, uFogP.w))) * step(0., gc + 3.);
          // (an eye at the very top of the river still sees no blue sliver of horizon under the cap: it showed as a dashed line between far crowns)
          fin = max(fin, (1. - smoothstep(0.6, 1., uView.y)) * (1. - smoothstep(0., 0.06, y)) * step(0., gc + 3.));
          c = mix(c, pearl(uCamL, d), fin);
          c += moonDisc * fin * 0.8;                                          // from inside the river the disc still shows, dimmed, in its bloom
          gl_FragColor = vec4(max(c, vec3(0.)), 1.);
        }`,
      side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), skyMat);
    sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

    // ---- the sea beyond the lowlands
    const seaMat = mat(/* glsl */`
      varying vec3 vWp;
      #include <fog_pars_vertex>
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec3 vWp; uniform vec3 uSea, uSkyRef, uCamL;
      #include <fog_pars_fragment>
      ${hero.glsl}
      void main(){
        vec3 Vd = uCamL - vWp; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-3);
        vec2 q = vWp.xz * 0.004 + vec2(uTime * 0.006, uTime * 0.004);
        float n = texture2D(uNoise, q).r + 0.5 * texture2D(uNoise, q * 3.1 - uTime * 0.004).g;
        float fr = pow(1. - clamp(V.y, 0., 1.), 4.);
        vec3 c = mix(uSea * (0.7 + 0.3 * n), uSkyRef, 0.25 + 0.6 * fr);
        vec3 R = reflect(-V, normalize(vec3((n - 0.75) * 0.25, 1., (n - 0.75) * 0.2)));
        float mk = max(dot(R, uSunDir), 0.), mk2 = mk * mk, mk8 = mk2 * mk2 * mk2 * mk2;
        c += uSunCol * 0.5 * mk8 * mk8 * mk8 * mk8 * mk8 * mk8 * mk8 * mk8 * mk8 * mk8 * mk8;
        // night: the sea is never black: the moon lays a broad sheen on it, broken into glitter under the moon itself
        float glit = smoothstep(0.5, 0.78, texture2D(uNoise, vWp.xz * 0.021 + vec2(uTime * 0.02, 0.)).g);
        c += uRim * (0.5 * mk2 * mk2 + 1.1 * mk8 * mk8 * (0.35 + 0.65 * glit) + 0.16 * fr) * (0.7 + 0.3 * n);
        gl_FragColor = vec4(max(c, vec3(0.)), 1.);
        #include <fog_fragment>
        gl_FragColor.rgb = applySlab(gl_FragColor.rgb, vWp, uCamL);       // from inside the fog river the sea is lost in the pearl, like all the land beyond the lip
        gl_FragColor.rgb = mix(gl_FragColor.rgb, pearl(uCamL, -V), (1. - smoothstep(0.6, 1., uView.y)) * step(0., lipZf(uCamL.x) - uCamL.z + 3.));
      }`, { uSea: { value: col(H.sea, night ? 0.85 : 0.7) }, uSkyRef: { value: col(H.sky[2], night ? 0.6 : 0.95) } });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(26000, 26000, 1, 1).rotateX(-Math.PI / 2), seaMat);
    sea.position.set(cx, -15, 1800); scene.add(sea);
    await ctx.yield();

    // ---- the land outside the hero block: canyon floor with pool basins, the west promontory, the low east
    //      spur, the lowlands running to the sea, and the plateau carrying on north, east and west
    const xp = portalPos.x, zp = portalPos.z, WL0 = 0.3;                  // pinch; water level
    const promLine = [[cx - 520, 6], [cx - 436, 36], [xp - 27, zp - 16], [xp - 22, zp + 40], [xp - 70, zp + 300], [xp - 210, zp + 900], [xp - 260, zp + 2400]];
    const spurLine = [[xp + 64, zp + 16], [cx + 60, zp + 56], [cx + 300, zp - 14], [cx + 480, 44], [cx + 900, 70]];
    const segDist = (line, x, z) => {
      let b = 1e18, sg = 1;
      for (let i = 0; i < line.length - 1; i++) {
        const ax = line[i][0], az = line[i][1], dx = line[i + 1][0] - ax, dz = line[i + 1][1] - az;
        const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), ex = x - ax - dx * t, ez = z - az - dz * t, d = ex * ex + ez * ez;
        if (d < b) { b = d; sg = dx * (z - az) - dz * (x - ax) > 0 ? 1 : -1; }
      }
      return Math.sqrt(b) * sg;
    };
    const terr = (f, steps) => { const s = f * steps, i = Math.floor(s), fr = s - i; return (i + smoothstep(0.55, 1, fr)) / steps; };
    // pools: a chain joined by riffles under the last run of the path, and loose ones across the bay floor
    const pools = [], chain = [];
    { const pr = rng.fork ? rng.fork('pools') : rng; let z = zl + 118, k = 0;
      while (z < zp + 90) {
        const r = pr.range(6, 10.5) * (season === 'november' ? 1.2 : 1), el = pr.range(1.3, 2.0), p = { x: PXW + 9 * Math.sin(k * 1.9 + wv) + pr.range(-3, 3), z, r, el };
        if (Math.abs(z - zp) < 30) { p.x = xp; p.z = zp - 4; p.r = 10.5; p.el = 1.9; z = p.z; }
        pools.push(p); chain.push(p); z += p.r * p.el * 2 + pr.range(9, 16); k++;
      }
      for (let i = 0; i < 160 && pools.length < chain.length + 12; i++) {
        const x = cx + pr.range(-250, 190), z = zl + pr.range(95, 300), r = pr.range(9, 19) * 0.66;
        if (Math.hypot(x - pin.x, z - pin.z) < 82 || Math.abs(x - PXW) < 34 || z - L.z(x) < 96 || segDist(promLine, x, z) > -70 || Math.abs(segDist(spurLine, x, z)) < 150) continue;
        if (pools.some((p) => Math.hypot(p.x - x, p.z - z) < (p.r + r) * 1.6 + 8)) continue;
        pools.push({ x, z, r, el: pr.range(1, 1.5) });
      } }
    const floorH = (x, z) => {
      let dip = 0;
      for (const p of pools) { const dx = x - p.x, dz = (z - p.z) / p.el; if (Math.abs(dx) < p.r * 1.3 && Math.abs(dz) < p.r * 1.3) { const d = smoothstep(1, 0.2, Math.hypot(dx, dz) / p.r * (1 + 0.24 * noise.n2(x * 0.17 + p.x, z * 0.17))) * 1.5; if (d > dip) dip = d; } }
      if (Math.abs(x - PXW) < 26 && dip < 0.42) for (let i = 0; i < chain.length - 1; i++) {
        const a = chain[i], b = chain[i + 1]; if (z < a.z - 4 || z > b.z + 4) continue;
        const t = clamp((z - a.z) / (b.z - a.z), 0, 1), d = Math.hypot(x - lerp(a.x, b.x, t) - 1.6 * Math.sin(z * 0.3), z - lerp(a.z, b.z, t)); dip = Math.max(dip, 0.42 * smoothstep(3.6, 1.2, d));
      }
      return 0.56 + 0.34 * noise.fbm2(x * 0.03, z * 0.03, 3) - dip;
    };
    const landH = (x, z) => {
      const lip = L.z(x), inX = Math.abs(x - cx) <= 432;
      if (z < lip - 1) return inX && z > hero.zBack ? -6 : 299.3;
      if (inX && z < lip + 6) return -6;
      const lowMix = smoothstep(zp + 30, zp + 260, z);
      let h = floorH(x, z);
      if (lowMix > 0) h = lerp(h, 8 + 30 * noise.fbm2(x / 520, z / 520, 4) + 14 * noise.ridged2(x / 300, z / 300) - Math.max(0, z - zp - 300) * 0.055, lowMix);
      const dp = segDist(promLine, x, z);
      if (dp > -30) {
        const topH = (150 + 136 * smoothstep(xp - 20, cx - 420, x)) * (1 - 0.62 * smoothstep(zp + 120, zp + 1300, z)) + 9 * noise.fbm2(x / 90, z / 90, 3);
        const rise = 46 + 0.26 * topH, f = smoothstep(-8, rise, dp + 9 * noise.n2(x / 37, z / 37));
        h = Math.max(h, topH * terr(f, 9) + 7 * smoothstep(-20, 0, dp) * (1 - f));
      }
      const ds = Math.abs(segDist(spurLine, x, z));
      if (ds < 130) {
        const topS = lerp(40, 122, smoothstep(xp + 70, xp + 270, x)) + 6 * noise.fbm2(x / 70, z / 70, 3);
        const wS = lerp(46, 96, smoothstep(xp + 70, xp + 300, x)), f = 1 - smoothstep(22, wS, ds + 6 * noise.n2(x / 31, z / 31) * smoothstep(xp + 60, xp + 160, x));
        h = Math.max(h, topS * terr(f, 5) + 3 * (1 - smoothstep(wS, wS + 15, ds)) * (1 - f));
      }
      if (!inX) h = Math.max(h, 300 * terr(1 - smoothstep(0, 150, z - lip + 12 * noise.n2(x / 60, z / 60)), 10));
      return h;
    };
    await ctx.yield();
    // how near a pool or a riffle a point of the floor is: 1 in and beside the water, 0 a quarter of a radius out
    const poolProx = (x, z) => {
      let best = 9;
      for (const p of pools) { const dx = x - p.x, dz = (z - p.z) / p.el; if (Math.abs(dx) < p.r * 1.5 && Math.abs(dz) < p.r * 1.5) { const d = Math.hypot(dx, dz) / p.r; if (d < best) best = d; } }
      let k = 1 - smoothstep(0.98, 1.3, best);
      if (Math.abs(x - PXW) < 30 && k < 1) for (let i = 0; i < chain.length - 1; i++) {
        const a = chain[i], b = chain[i + 1]; if (z < a.z - 4 || z > b.z + 4) continue;
        const t = clamp((z - a.z) / (b.z - a.z), 0, 1), d = Math.hypot(x - lerp(a.x, b.x, t) - 1.6 * Math.sin(z * 0.3), z - lerp(a.z, b.z, t)); k = Math.max(k, 1 - smoothstep(3.4, 5.2, d));
      }
      return k;
    };
    // the foot of each wall lies in its own soft shade (never the last pools before the portal)
    const wallShade = (x, z) => {
      const dp = segDist(promLine, x, z), ds = Math.abs(segDist(spurLine, x, z)), wS = lerp(46, 96, smoothstep(xp + 70, xp + 300, x));
      const pinch = smoothstep(zp - 110, zp - 50, z) * (1 - smoothstep(34, 60, Math.abs(x - xp)));
      return 1 - 0.55 * Math.max(smoothstep(-42, -10, dp), 1 - smoothstep(wS + 4, wS + 40, ds)) * (1 - pinch);
    };
    const lowCol = (x, z, h, out, k) => { out[k] = (0.62 + 0.38 * smoothstep(-0.6, 0.6, h)) * wallShade(x, z); out[k + 1] = 1 - smoothstep(zp + 40, zp + 200, z); };
    {
      const NX = 138, NZ = 134, xs = new Float32Array(NX), zs = new Float32Array(NZ);
      for (let i = 0; i < NX; i++) { const t = i / (NX - 1) * 2 - 1, a = Math.abs(t); xs[i] = cx - 60 + Math.sign(t) * (430 * a + 1500 * a * a * a * a); }
      for (let j = 0; j < NZ; j++) { const t = j / (NZ - 1) * 2 - 1, a = Math.abs(t); zs[j] = zl + 190 + Math.sign(t) * (390 * a + 1700 * a * a * a * a); }
      const pos = new Float32Array(NX * NZ * 3), colr = new Float32Array(NX * NZ * 3), idx = [];
      for (let j = 0; j < NZ; j++) {
        for (let i = 0; i < NX; i++) {
          const x = xs[i], z = zs[j], h = landH(x, z), k = (j * NX + i) * 3;
          pos[k] = x; pos[k + 1] = h; pos[k + 2] = z;
          if (h < 3) lowCol(x, z, h, colr, k);
          else colr[k] = (0.84 + 0.16 * noise.n2(x / 260, z / 260)) * (1 - 0.4 * smoothstep(zp + 30, zp + 260, z) * (h < 70 ? 1 : 0));
        }
        await ctx.yield();
      }
      // the floor under the last run and round every pool is laid again at a metre or two: the pools' basins, shores
      // and riffles are real ground there (the wide mesh, at 7 m and more, turned every pool into a blob). The cells
      // it replaces are left out of the wide mesh, and its outer edge follows their straight sides exactly
      const CX = NX - 1, CZ = NZ - 1, mark = new Uint8Array(CX * CZ);
      const lowC = (i, j) => { const y = pos[(j * NX + i) * 3 + 1]; return y < 2.5 && y > -5; };
      const markBox = (x0, x1, z0, z1) => {
        for (let j = 0; j < CZ; j++) { if (zs[j + 1] < z0 || zs[j] > z1) continue;
          for (let i = 0; i < CX; i++) { if (xs[i + 1] < x0 || xs[i] > x1) continue; if (lowC(i, j) && lowC(i + 1, j) && lowC(i, j + 1) && lowC(i + 1, j + 1)) mark[j * CX + i] = 1; } }
      };
      for (const p of pools) { markBox(p.x - p.r * 1.3 - 1.5, p.x + p.r * 1.3 + 1.5, p.z - p.r * p.el * 1.3 - 1.5, p.z + p.r * p.el * 1.3 + 1.5); await ctx.yield(); }
      markBox(PXW - 13, PXW + 13, zl + 112, zp + 24);
      await ctx.yield();
      for (let j = 0; j < CZ; j++) for (let i = 0; i < CX; i++) {
        const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
        if (mark[j * CX + i] || (pos[a * 3 + 1] === -6 && pos[b * 3 + 1] === -6 && pos[c * 3 + 1] === -6 && pos[d * 3 + 1] === -6)) continue;
        idx.push(a, c, b, b, c, d);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(colr, 3)); geo.setIndex(idx);
      await ctx.yield(); geo.computeVertexNormals();
      scene.add(new THREE.Mesh(geo, hero.materials.rock));
      await ctx.yield();
      // the fine floor
      const nxOf = new Uint8Array(CX), nzOf = new Uint8Array(CZ), ox = new Int32Array(CX + 1), oz = new Int32Array(CZ + 1);
      for (let i = 0; i < CX; i++) { const w = xs[i + 1] - xs[i]; nxOf[i] = Math.min(Math.max(Math.round(w / (xs[i + 1] > PXW - 26 && xs[i] < PXW + 26 ? 1.7 : 3.2)), 1), 24); ox[i + 1] = ox[i] + nxOf[i]; }
      for (let j = 0; j < CZ; j++) { const w = zs[j + 1] - zs[j]; nzOf[j] = Math.min(Math.max(Math.round(w / 2.1), 1), 24); oz[j + 1] = oz[j] + nzOf[j]; }
      const marked = (i, j) => i >= 0 && j >= 0 && i < CX && j < CZ && mark[j * CX + i] === 1;
      const fp = [], fc = [], fi = [], ids = new Map(), GW = ox[CX] + 1; let nf = 0, cells = 0;
      const vert = (i, a, j, b) => {
        const key = (oz[j] + b) * GW + ox[i] + a; let id = ids.get(key); if (id !== undefined) return id;
        const fx = a / nxOf[i], fz = b / nzOf[j], x = lerp(xs[i], xs[i + 1], fx), z = lerp(zs[j], zs[j + 1], fz);
        const cy = (ii, jj) => pos[(jj * NX + ii) * 3 + 1];
        let h;
        const onX = a === 0 || a === nxOf[i], onZ = b === 0 || b === nzOf[j], ii = a === 0 ? i - 1 : i + 1, jj = b === 0 ? j - 1 : j + 1;
        if (onX && onZ) h = cy(a === 0 ? i : i + 1, b === 0 ? j : j + 1);
        else if (onX && !marked(ii, j)) h = lerp(cy(a === 0 ? i : i + 1, j), cy(a === 0 ? i : i + 1, j + 1), fz);
        else if (onZ && !marked(i, jj)) h = lerp(cy(i, b === 0 ? j : j + 1), cy(i + 1, b === 0 ? j : j + 1), fx);
        else h = landH(x, z);
        fp.push(x, h, z); const k = fc.length; fc.push(0, 0, 0); lowCol(x, z, h, fc, k); fc[k + 2] = poolProx(x, z);
        id = nf++; ids.set(key, id); return id;
      };
      const skirt = [];
      for (let j = 0; j < CZ; j++) {
        for (let i = 0; i < CX; i++) {
          if (!mark[j * CX + i]) continue; cells++;
          const nx = nxOf[i], nz = nzOf[j], row = [];
          for (let b = 0; b <= nz; b++) { const r = []; for (let a = 0; a <= nx; a++) r.push(vert(i, a, j, b)); row.push(r); }
          for (let b = 0; b < nz; b++) for (let a = 0; a < nx; a++) { const v0 = row[b][a], v1 = row[b][a + 1], v2 = row[b + 1][a], v3 = row[b + 1][a + 1]; fi.push(v0, v2, v1, v1, v2, v3); }
          if (!marked(i - 1, j)) for (let b = 0; b < nz; b++) skirt.push(row[b][0], row[b + 1][0]);
          if (!marked(i + 1, j)) for (let b = 0; b < nz; b++) skirt.push(row[b + 1][nx], row[b][nx]);
          if (!marked(i, j - 1)) for (let a = 0; a < nx; a++) skirt.push(row[0][a + 1], row[0][a]);
          if (!marked(i, j + 1)) for (let a = 0; a < nx; a++) skirt.push(row[nz][a], row[nz][a + 1]);
          await ctx.yield();                                             // a marked cell is up to 25 by 25 points of ground
        }
      }
      await ctx.yield();
      if (nf) {
        const fgeo = new THREE.BufferGeometry();
        fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fgeo.setAttribute('color', new THREE.Float32BufferAttribute(fc, 3)); fgeo.setIndex(fi);
        await ctx.yield(); fgeo.computeVertexNormals(); await ctx.yield();
        const fineM = new THREE.Mesh(fgeo, hero.materials.rock); scene.add(fineM); G.fineMeshes = [fineM];
        // a skirt under its outer edge, so that no pinhole opens where its many small sides meet one long one
        const sp = [], sc = [], si = []; let ns = 0;
        for (let k = 0; k < skirt.length; k += 2) {
          for (const v of [skirt[k], skirt[k + 1]]) for (const dy of [0, -0.7]) { sp.push(fp[v * 3], fp[v * 3 + 1] + dy, fp[v * 3 + 2]); sc.push(fc[v * 3], fc[v * 3 + 1], 0); }
          si.push(ns, ns + 1, ns + 2, ns + 2, ns + 1, ns + 3, ns, ns + 2, ns + 1, ns + 2, ns + 3, ns + 1); ns += 4;
        }
        const sgeo = new THREE.BufferGeometry();
        sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sgeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
        sgeo.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(sp.length).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3)); sgeo.setIndex(si);
        const skirtM = new THREE.Mesh(sgeo, hero.materials.rock); scene.add(skirtM); G.fineMeshes.push(skirtM);
        G.fineTris = (fi.length + si.length) / 3;
      }
      hero.materials.rock.uniforms.uWL.value = WL0;
    }
    await ctx.yield();

    // ---- the fog river beyond the hero's block: the hero's own fog material on a wide sheet, so it is one river
    {
      const NC = 66, gaps = [0, 28, 64, 110, 180, 290, 460, 720, 1150, 1900, 3100], NR = gaps.length;
      const p = [], n = [], uv = [], f = [], tt = [], ll = [], sd = [], idx = [];
      for (let r = 0; r < NR; r++) for (let i = 0; i < NC; i++) {
        const t = i / (NC - 1) * 2 - 1, a = Math.abs(t), x = cx + Math.sign(t) * (520 * a + 2900 * a * a * a), g = 24 + gaps[r], z = L.z(x) - g;
        p.push(x, RIM + fogLip, z); n.push(0, 1, 0); uv.push(x, -g / 24); f.push(0, -g, r === 0 || r === NR - 1 || i === 0 || i === NC - 1 ? 0 : 1, 0); tt.push(1, 0); ll.push(x, z); sd.push(0);
      }
      for (let r = 0; r < NR - 1; r++) for (let i = 0; i < NC - 1; i++) { const a = r * NC + i, b = a + 1, c = a + NC, d = c + 1; idx.push(a, b, c, b, d, c); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
      geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('aF', new THREE.Float32BufferAttribute(f, 4));
      geo.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 2)); geo.setAttribute('aL', new THREE.Float32BufferAttribute(ll, 2)); geo.setAttribute('aSide', new THREE.Float32BufferAttribute(sd, 1));
      geo.setIndex(idx);
      const farSheet = new THREE.Mesh(geo, hero.materials.fog); farSheet.frustumCulled = false; farSheet.renderOrder = 1; scene.add(farSheet);
    }
    await ctx.yield();

    // ---- one material for everything solid the world adds (rocks, bottle trees, shrubs, far crowns)
    //      aK = (wind weight, kind: 0 rock, 1 bark, 2 leaf / petal / blade)
    const PROP_VS = /* glsl */`
      attribute vec2 aK;
      varying vec3 vCol; varying vec3 vN; varying vec3 vWp; varying vec3 vOp; varying vec2 vK;
      #include <fog_pars_vertex>
      ${hero.glsl}
      void main(){
        vec4 wp = vec4(position, 1.); vec3 n = normal; float ph = 0.;
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n; ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.29;
        #endif
        float gust = 0.6 + 0.4 * sin(uTime * 0.7 + wp.x * 0.05 + wp.z * 0.03);
        wp.z += aK.x * (0.10 + 0.07 * sin(uTime * 2.1 + ph)) * gust; wp.x += aK.x * 0.05 * sin(uTime * 2.7 + ph * 1.3) * gust;
        wp.xyz += aK.x * step(1.5, aK.y) * 0.03 * gust * vec3(sin(uTime * 11. + position.x * 9. + ph), sin(uTime * 13. + position.z * 8.), sin(uTime * 9. + position.y * 7.));
        vCol = color;
        #ifdef USE_INSTANCING_COLOR
          vCol *= instanceColor;
        #endif
        vN = n; vWp = wp.xyz; vOp = position; vK = aK;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
    const PROP_FS = /* glsl */`
      varying vec3 vCol; varying vec3 vN; varying vec3 vWp; varying vec3 vOp; varying vec2 vK;
      uniform vec3 uCamL;
      #include <fog_pars_fragment>
      ${hero.glsl}
      ${LIGHT}
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); float kind = vK.y, leafy = step(1.5, kind);
        vec3 Vd = uCamL - vWp; vec3 V = Vd / max(length(Vd), 1e-3);
        if (leafy > 0.5 && dot(N, V) < 0.) N = -N;
        vec3 alb = vCol;
        if (kind < 0.5) {
          float g = texture2D(uNoise, vWp.xz * 0.23 + vWp.y * 0.19).b, bed = texture2D(uNoise, vec2((vWp.x + vWp.z) * 0.012, vWp.y * 0.11)).g, fine = texture2D(uNoise, vWp.xy * 0.9 + vWp.z * 0.7).b;
          float wr = texture2D(uNoise, vWp.xz * 0.021).r, crack = 1. - smoothstep(0., 0.07, abs(fract(vWp.y * 0.23 + wr * 0.9) - 0.5));
          alb *= (0.64 + 0.5 * bed) * (0.8 + 0.3 * g) * (0.86 + 0.26 * fine) * (1. - 0.42 * crack * (1. - smoothstep(0.5, 0.9, abs(N.y))));
          alb = mix(alb, alb * vec3(1.1, 0.92, 0.75), smoothstep(0.5, 0.8, bed) * 0.5);
          // close to: pits and solution hollows, grey lichen on the weather side, a dark damp foot
          float nearR = 1. - smoothstep(18., 60., length(Vd));
          float pit = texture2D(uNoise, vWp.xz * 1.7 + vWp.y * 1.3).b, pit2 = texture2D(uNoise, vWp.zy * 0.61 + vWp.x * 0.43).r;
          alb *= 1. - 0.45 * nearR * smoothstep(0.62, 0.8, pit) - 0.3 * nearR * (1. - smoothstep(0., 0.06, abs(pit2 - 0.5)));
          alb = mix(alb, vec3(0.3, 0.32, 0.29) * (0.7 + 0.6 * fine), smoothstep(0.52, 0.7, texture2D(uNoise, vWp.xz * 0.19 + 0.3).g) * smoothstep(0.1, 0.7, N.y) * 0.6);
          // a boulder (its own space, vOp): a dark crevice or two where a break runs through it, a dark damp foot
          float cvA = abs(dot(vOp, vec3(0.52, 0.31, 0.8)) - 0.06 + (g - 0.5) * 0.18), cvB = abs(dot(vOp, vec3(-0.7, 0.2, 0.55)) + 0.2 + (fine - 0.5) * 0.14);
          float crev = max(1. - smoothstep(0.012, 0.05, cvA), (1. - smoothstep(0.01, 0.036, cvB)) * 0.75);
          alb *= 1. - 0.82 * crev;
          alb *= mix(0.3, 1., smoothstep(0.14, 0.62, vOp.y));
          N = normalize(N + vec3((pit - 0.5) * 0.5 * nearR, (g - 0.5) * 0.5 - crev * 0.4, (fine - 0.5) * 0.4 + (pit2 - 0.5) * 0.4 * nearR));
        } else if (kind < 1.5) {
          float g = texture2D(uNoise, vec2(vOp.x + vOp.z, vOp.y * 0.6) * 0.8).b, r = texture2D(uNoise, vec2(vOp.x - vOp.z, vOp.y) * 2.7).b;
          alb *= (0.84 + 0.3 * g) * (0.92 + 0.16 * r);
          // swollen bark: wrinkles ringing the trunk, paler and pinker where the skin is stretched
          float wrk = sin(vOp.y * 23. + (g - 0.5) * 9. + (r - 0.5) * 3.);
          float crease = smoothstep(0.72, 0.97, wrk);
          alb *= 1. - 0.34 * crease;
          alb = mix(alb, alb * vec3(1.14, 0.95, 0.93), smoothstep(0.45, 0.7, texture2D(uNoise, vec2(vOp.x * 0.7 - vOp.z * 0.5, vOp.y * 0.4) + 0.3).g) * 0.7);
          N = normalize(N + vec3(0., -0.45 * crease + 0.25 * wrk * (1. - crease), 0.) + vec3((r - 0.5) * 0.3, 1e-4, (g - 0.5) * 0.3));
        }
        vec3 c = lightIt(alb, N, vWp, 1., leafy);
        // rock and bark in the open take the light the sunlit ground throws back: no trunk or boulder has a dead black side
        c += alb * uSunCol * 0.17 * sunMask(vWp) * clamp(0.62 - 0.5 * N.y, 0., 1.) * (1. - leafy) * mix(0.3, 1., step(0.5, kind));
        c += alb * (uSkyCol * 0.3 + uFogLit * 0.62) * (1. - sunMask(vWp)) * leafy * clamp(0.6 + 0.4 * N.y, 0., 1.) * step(0., uSunDir.y);   // under the cap the pearl sky lights the crowns
        float thru = max(dot(-V, uSunDir), 0.);
        c += alb * uSunCol * sunMask(vWp) * 0.3 * thru * thru * leafy;
        c += alb * uRim * moonRim(N, V) * mix(2.6, 1.4, leafy);              // night: a silver edge on whatever stands against the moon
        c += alb * uRim * vec3(0.6, 0.8, 1.3) * (0.16 + 0.62 * max(N.y, 0.)) * (1. - leafy);   // and the tops of stones and trunks take the moonlit sky: no boulder is a black lump
        c += alb * glowAt(vWp, N) * 2.4;
        c += uEmber * (0.55 * clamp(kind - 2., 0., 1.) + 0.3 * smoothstep(1.1, 1.2, kind) * (1. - step(1.5, kind)));   // and the far umbrellas glow underneath like the near ones
        c = applySlab(c, vWp, uCamL);
        gl_FragColor = vec4(max(c, vec3(0.)), 1.);
        #include <fog_fragment>
        gl_FragColor.rgb = farPearl(gl_FragColor.rgb, vWp, uCamL);
      }`;
    const propMat = mat(PROP_VS, PROP_FS, {}, { vertexColors: true, side: THREE.DoubleSide });
    const mk = () => ({ p: [], n: [], c: [], k: [], i: [], nv: 0 });
    const vx = (g, x, y, z, nx, ny, nz, c, m, w, kind) => { g.p.push(x, y, z); g.n.push(nx, ny, nz); g.c.push(c.r * m, c.g * m, c.b * m); g.k.push(w, kind); return g.nv++; };
    const fin = (g, normals) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3)); geo.setAttribute('aK', new THREE.Float32BufferAttribute(g.k, 2));
      geo.setIndex(g.i); if (normals) geo.computeVertexNormals();
      return geo;
    };
    const _t = new V3(), _a = new V3(), _b = new V3(), _n = new V3(), _q = new V3();
    // tube through pts; rad(ring, angle) and shade(ring, angle) are functions
    const tube = (g, pts, rad, sides, c, shade, wts, kind) => {
      let prev = -1;
      for (let r = 0; r < pts.length; r++) {
        _t.subVectors(pts[Math.min(pts.length - 1, r + 1)], pts[Math.max(0, r - 1)]).normalize();
        if (Math.abs(_t.y) < 0.92) _a.set(0, 1, 0); else _a.set(1, 0, 0);
        _a.cross(_t).normalize(); _b.crossVectors(_t, _a);
        const first = g.nv;
        for (let s = 0; s <= sides; s++) {
          const an = (s % sides) / sides * TAU, ca = Math.cos(an), sa = Math.sin(an), rr = rad(r, an);
          _n.set(_a.x * ca + _b.x * sa, _a.y * ca + _b.y * sa, _a.z * ca + _b.z * sa);
          vx(g, pts[r].x + _n.x * rr, pts[r].y + _n.y * rr, pts[r].z + _n.z * rr, _n.x, _n.y, _n.z, c, shade(r, an), wts ? wts[r] : 0, kind);
        }
        if (prev >= 0) for (let s = 0; s < sides; s++) g.i.push(prev + s, prev + s + 1, first + s, prev + s + 1, first + s + 1, first + s);
        prev = first;
      }
    };
    // a blade or petal: base, direction, side vector, length, width; two triangles
    const kite = (g, bx, by, bz, d, sd, len, wid, c0, m0, c1, m1, w) => {
      _n.crossVectors(sd, d).normalize(); if (_n.y < 0) _n.negate();
      const a = vx(g, bx, by, bz, _n.x, _n.y, _n.z, c0, m0, w * 0.2, 2);
      const b = vx(g, bx + d.x * len * 0.4 + sd.x * wid, by + d.y * len * 0.4 + sd.y * wid, bz + d.z * len * 0.4 + sd.z * wid, _n.x, _n.y, _n.z, c1, (m0 + m1) * 0.5, w * 0.6, 2);
      const e = vx(g, bx + d.x * len * 0.4 - sd.x * wid, by + d.y * len * 0.4 - sd.y * wid, bz + d.z * len * 0.4 - sd.z * wid, _n.x, _n.y, _n.z, c1, (m0 + m1) * 0.5, w * 0.6, 2);
      const t = vx(g, bx + d.x * len, by + d.y * len, bz + d.z * len, _n.x, _n.y, _n.z, c1, m1, w, 2);
      g.i.push(a, b, t, a, t, e);
    };
    // boulder: a lump of limestone broken along a dozen flat fracture planes (each plane keeps its own normal, so the
    // faces are flat and the edges between them worn), with a dark, flattened base
    let bSeq = 0;
    const boulderGeo = (r, det, c) => {
      const src = mergeVertices(new THREE.IcosahedronGeometry(1, det).deleteAttribute('uv').deleteAttribute('normal')), P = src.attributes.position, g = mk();
      const ox = r() * 50, oy = r() * 50, sx = r.range(0.85, 1.25), sz = r.range(0.8, 1.2);
      const br = ctx.core.makeRng(ctx.core.hashSeed('boulder:' + ctx.seed + ':' + (bSeq++))), planes = [], np = det >= 2 ? 12 : 8;
      for (let k = 0; k < np; k++) { const u = br.range(-0.3, 0.95), a = br() * TAU, s = Math.sqrt(1 - u * u); planes.push([s * Math.cos(a), u, s * Math.sin(a), br.range(0.5, 0.8)]); }
      planes.push([0.12, 0.98, 0.1, br.range(0.56, 0.74)]);
      const cut = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        let x = P.getX(i), y = P.getY(i), z = P.getZ(i); const y0 = y;
        const d = 1 + 0.3 * noise.fbm3(x * 1.1 + ox, y * 1.1 + oy, z * 1.1, 3) + 0.08 * noise.n3(x * 3 + ox, y * 3, z * 3);
        x *= d; y *= d; z *= d;
        let best = 0;
        for (let pass = 0; pass < 2; pass++) for (const [px, py, pz, pd] of planes) {
          const t = x * px + y * py + z * pz - pd; if (t <= 0) continue;
          x -= px * t; y -= py * t; z -= pz * t; if (t > best) { best = t; cut[i * 3] = px / sx; cut[i * 3 + 1] = py / 0.8; cut[i * 3 + 2] = pz / sz; }
        }
        const yy = y < -0.25 ? -0.25 + (y + 0.25) * 0.25 : y * 0.8;
        vx(g, x * sx, yy + 0.3, z * sz, 0, 1, 0, c, (0.5 + 0.5 * smoothstep(-0.3, 0.35, y0)) * (0.9 + 0.2 * r()), 0, 0);
      }
      for (let i = 0; i < src.index.count; i++) g.i.push(src.index.getX(i));
      src.dispose();
      const geo = fin(g, true), Nn = geo.attributes.normal;
      for (let i = 0; i < P.count; i++) {
        const cxn = cut[i * 3], cyn = cut[i * 3 + 1], czn = cut[i * 3 + 2], l = Math.hypot(cxn, cyn, czn); if (l < 1e-6) continue;
        _n.set(cxn / l, cyn / l, czn / l).multiplyScalar(0.82).add(_q.set(Nn.getX(i), Nn.getY(i), Nn.getZ(i)).multiplyScalar(0.18)).normalize(); Nn.setXYZ(i, _n.x, _n.y, _n.z);
      }
      return geo;
    };
    const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), sv = new V3(), pv = new V3(), tc = new THREE.Color();
    const instance = (geo, list, withColor) => {
      const mesh = new THREE.InstancedMesh(geo, propMat, Math.max(list.length, 1)); mesh.count = list.length;
      list.forEach((o, i) => {
        eu.set(o.rx || 0, o.ry || 0, o.rz || 0); qt.setFromEuler(eu); m4.compose(pv.set(o.x, o.y, o.z), qt, sv.set(o.sx ?? o.s, o.sy ?? o.s, o.sz ?? o.s)); mesh.setMatrixAt(i, m4);
        if (withColor) mesh.setColorAt(i, o.c || tc.setRGB(1, 1, 1));
      });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere(); scene.add(mesh); return mesh;
    };
    const limestone = col('#D0B48C').lerp(col('#f2ead8'), 0.2).multiplyScalar(0.86), greenC = PAL[2];
    const pr2 = rng.fork ? rng.fork('props') : rng;
    await ctx.yield();

    // ---- crowns to the horizon: the forest beyond the hero's block, cushions on short trunks
    {
      const g = mk(), dark = greenC.clone().multiplyScalar(1.0).multiply(new THREE.Color(0.85, 0.97, 1.08)), lite = dark.clone().multiplyScalar(1.3), bark = col('#a89f92');
      const top = vx(g, 0, 8.6, 0, 0, 1, 0, lite, 1, 0.3, 2), ring = [];
      for (let s = 0; s < 7; s++) { const an = s / 7 * TAU, rr = 5 * (s % 2 ? 1.08 : 0.9); ring.push(vx(g, Math.cos(an) * rr, 6.5 + (s % 2 ? 0.25 : -0.2), Math.sin(an) * rr, Math.cos(an) * 0.7, 0.7, Math.sin(an) * 0.7, dark, 0.9 + 0.25 * (s % 3) * 0.5, 0.3, 2)); }
      const under = vx(g, 0, 5.2, 0, 0, -1, 0, dark, 0.35, 0, 3);
      for (let s = 0; s < 7; s++) { g.i.push(top, ring[(s + 1) % 7], ring[s]); g.i.push(under, ring[s], ring[(s + 1) % 7]); }
      const t0 = [vx(g, -0.45, 0, 0, -1, 0, 0, bark, 0.8, 0, 1.25), vx(g, 0.45, 0, 0, 1, 0, 0, bark, 0.8, 0, 1.25), vx(g, -0.5, 5.6, 0, -1, 0, 0, bark, 0.5, 0, 1.25), vx(g, 0.5, 5.6, 0, 1, 0, 0, bark, 0.5, 0, 1.25)];
      const t1 = [vx(g, 0, 0, -0.45, 0, 0, -1, bark, 0.8, 0, 1.25), vx(g, 0, 0, 0.45, 0, 0, 1, bark, 0.8, 0, 1.25), vx(g, 0, 5.6, -0.5, 0, 0, -1, bark, 0.5, 0, 1.25), vx(g, 0, 5.6, 0.5, 0, 0, 1, bark, 0.5, 0, 1.25)];
      g.i.push(t0[0], t0[1], t0[2], t0[1], t0[3], t0[2], t1[0], t1[1], t1[2], t1[1], t1[3], t1[2]);
      const list = [], want = Math.round(1100 * detail * dens);
      for (let i = 0; i < want * 3 && list.length < want; i++) {
        const far = pr2() < 0.45, x = cx + (far ? pr2.range(-2100, 2100) : pr2.range(-900, 900)), z = far ? pr2.range(hero.zBack - 1700, 30) : pr2.range(hero.zBack - 480, 30);
        const gp = L.z(x) - z; if (gp < 6) continue;
        if (Math.abs(x - cx) < 426 && z > hero.zBack + 6) continue;
        if (gp > 150 && pr2() > 0.62) continue;
        list.push({ x, y: RIM - 0.3, z, s: pr2.range(0.8, 1.2), ry: pr2() * TAU });
      }
      for (let i = 0; i < 1400 && list.length < want + 170; i++) {
        const x = cx + pr2.range(-900, -150), z = pr2.range(20, zp + 700), h = landH(x, z);
        if (h < 120 || Math.abs(landH(x + 4, z) - h) > 1.2 || Math.abs(landH(x, z + 4) - h) > 1.2) continue;
        list.push({ x, y: h - 0.3, z, s: pr2.range(0.8, 1.2), ry: pr2() * TAU });
      }
      // a row of crowns along the bay's rim, so that from below the Fogfall's top edge is a dark band of umbrellas
      for (let x = cx - 310; x < cx + 310; x += 9) {
        const xx = x + pr2.range(-2.5, 2.5), z = L.z(xx) - pr2.range(4.5, 9), s = pr2.range(0.85, 1.15);
        if (path.distanceTo(xx, RIM + 6, z) < 80 || hero.anchors.trees.some((t) => Math.abs(t.x - xx) < 7.5 && Math.abs(t.z - z) < 7.5)) continue;
        list.push({ x: xx, y: RIM - 0.3, z, s, ry: pr2() * TAU });
      }
      instance(fin(g, false), list, false);
      G.farCrowns = night ? list.filter((t) => (Math.abs(t.x - cx) < 620 && t.z > hero.zBack - 120 && L.z(t.x) - t.z < 60) || t.y < RIM - 5) : [];
    }
    await ctx.yield();

    // ---- ground cover on the karst pavement along the low stretches of the route, and on the canyon floor
    const tussockGeo = (() => {
      const g = mk(), straw = col('#cdbf92'), d = new V3(), sd = new V3();
      for (let i = 0; i < 13; i++) {
        const a = i * 2.39996 + pr2() * 0.5, tilt = pr2.range(0.25, 1.0), len = pr2.range(0.45, 0.95);
        d.set(Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt)); sd.set(-Math.sin(a), 0, Math.cos(a));
        kite(g, Math.cos(a) * 0.07, 0, Math.sin(a) * 0.07, d, sd, len, 0.035, straw, 0.4, straw, pr2.range(0.8, 1.05), 1);
      }
      return fin(g, false);
    })();
    await ctx.yield();
    const shrubGeo = (() => {
      const src = mergeVertices(new THREE.IcosahedronGeometry(1, 1).deleteAttribute('uv').deleteAttribute('normal')), P = src.attributes.position, g = mk();
      const c0 = greenC.clone().lerp(col('#5f6b44'), 0.5).multiplyScalar(0.8), c1 = col('#74805a', 0.8);
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i), dd = 1 + 0.3 * noise.n3(x * 2.1, y * 2.1 + 9, z * 2.1), yy = Math.max(y, -0.15) * 0.62;
        tc.copy(c0).lerp(c1, 0.5 + 0.5 * noise.n3(x * 3 + 4, y * 3, z * 3));
        vx(g, x * dd, yy * dd + 0.08, z * dd, x, 0.5 + y, z, tc, 0.45 + 0.6 * smoothstep(-0.2, 0.9, y), 0.25 * Math.max(y, 0), 2);
      }
      for (let i = 0; i < src.index.count; i++) g.i.push(src.index.getX(i));
      src.dispose();
      const d = new V3(), sd = new V3();
      for (let i = 0; i < 7; i++) { const a = pr2() * TAU, t = pr2.range(0.2, 1.1); d.set(Math.cos(a) * Math.sin(t), Math.cos(t), Math.sin(a) * Math.sin(t)); sd.set(-Math.sin(a), 0, Math.cos(a)); kite(g, d.x * 0.5, 0.3 + d.y * 0.2, d.z * 0.5, d, sd, pr2.range(0.5, 0.8), 0.07, c0, 0.7, c1, 1.1, 1); }
      return fin(g, true);
    })();
    await ctx.yield();
    const stoneGeo = boulderGeo(pr2, 1, limestone.clone().lerp(col('#8f8c86'), 0.55));
    await ctx.yield();
    const rockHi = boulderGeo(pr2, 2, limestone);
    await ctx.yield();
    const rockLo = boulderGeo(pr2, 1, limestone);
    await ctx.yield();
    {
      const tus = [], shr = [], sto = [], q = new V3(), tg = new V3();
      const scatter = (n, u0, u1, y0, fn) => {
        for (let i = 0; i < n; i++) {
          const u = pr2.range(u0, u1), sgn = pr2() < 0.5 ? -1 : 1, k = pr2(), off = sgn * (2.2 + k * k * 36);
          path.pointAt(u, q); path.tangentAt(u, tg);
          const x = q.x - tg.z * off + pr2.range(-2, 2), z = q.z + tg.x * off + pr2.range(-2, 2);
          if (y0 > 100 && L.z(x) - z < 2.5) continue;
          fn(x, z, Math.abs(off));
        }
      };
      const groveU0 = uApex + 0.035, strawC = () => new THREE.Color().setRGB(pr2.range(0.8, 1.05), pr2.range(0.8, 1.0), pr2.range(0.7, 1.0)).lerp(col(season === 'november' ? '#7fbf62' : '#ffffff'), season === 'november' ? 0.6 : 0);
      for (const [n, a, b] of [[300, 0, uApex - 0.06], [330, groveU0, uLip]]) {
        scatter(Math.round(n * detail), a, b, RIM, (x, z) => tus.push({ x, y: RIM - 0.12, z, s: pr2.range(0.8, 1.5), ry: pr2() * TAU, c: strawC() }));
        await ctx.yield();
        scatter(Math.round(n * 0.42 * detail), a, b, RIM, (x, z) => shr.push({ x, y: RIM - 0.2, z, sx: pr2.range(0.6, 1.4), sy: pr2.range(0.5, 1.1), sz: pr2.range(0.6, 1.4), ry: pr2() * TAU, c: new THREE.Color().setRGB(pr2.range(0.8, 1.15), pr2.range(0.85, 1.1), pr2.range(0.75, 1.1)) }));
        await ctx.yield();
        scatter(Math.round(n * 0.3 * detail), a, b, RIM, (x, z) => sto.push({ x, y: RIM - 0.12, z, sx: pr2.range(0.25, 0.8), sy: pr2.range(0.2, 0.5), sz: pr2.range(0.25, 0.8), ry: pr2() * TAU }));
        await ctx.yield();
      }
      await ctx.yield();
      // canyon floor: tussocks, shrubs, pebbles by the last run; rushes at the pools
      const uF = uStoopEnd - 0.02;
      scatter(Math.round(260 * detail), uF, 1, 0, (x, z) => { const h = floorH(x, z); if (h > WL0 + 0.12 && landH(x, z) < 2) tus.push({ x, y: h - 0.05, z, s: pr2.range(0.9, 1.7), ry: pr2() * TAU, c: strawC() }); });
      await ctx.yield();
      scatter(Math.round(120 * detail), uF, 1, 0, (x, z) => { const h = floorH(x, z); if (h > WL0 + 0.15 && landH(x, z) < 2) shr.push({ x, y: h - 0.1, z, sx: pr2.range(0.7, 1.6), sy: pr2.range(0.6, 1.2), sz: pr2.range(0.7, 1.6), ry: pr2() * TAU, c: new THREE.Color().setRGB(pr2.range(0.8, 1.1), pr2.range(0.9, 1.15), pr2.range(0.75, 1.0)) }); });
      await ctx.yield();
      scatter(Math.round(170 * detail), uF, 1, 0, (x, z) => { const h = floorH(x, z); if (landH(x, z) < 2) sto.push({ x, y: h - 0.1, z, sx: pr2.range(0.3, 1.1), sy: pr2.range(0.25, 0.6), sz: pr2.range(0.3, 1.1), ry: pr2() * TAU }); });
      await ctx.yield();
      let pi = 0;
      for (const p of pools) {
        const n = Math.round((chain.includes(p) ? 26 : 9) * detail), endA = (pi++ % 3 === 1 ? -1 : 1) * Math.PI / 2;     // rushes crowd one end of each pool
        for (let i = 0; i < n; i++) {
          const a = endA + (pr2() - 0.5) * 2.3, rr = p.r * pr2.range(0.7, 1.05), x = p.x + Math.cos(a) * rr, z = p.z + Math.sin(a) * rr * p.el, h = floorH(x, z);
          if (h < 0.02 || h > 0.6 || path.distanceTo(x, h + 1.5, z) < 6.5) continue;
          tus.push({ x, y: h - 0.05, z, sx: pr2.range(1, 1.6), sy: pr2.range(2.2, 3.4), sz: pr2.range(1, 1.6), ry: pr2() * TAU, c: new THREE.Color().setRGB(pr2.range(0.35, 0.55), pr2.range(0.75, 0.95), pr2.range(0.3, 0.45)) });
        }
      }
      // the pinnacle's crown: read the top rings of the hero's rock so that everything added sits on the stone
      await ctx.yield();
      const pinRocks = [];
      { const rm = hero.object.children.find((m) => m.material === hero.materials.rock), P = rm.geometry.attributes.position, ring0 = [], ring1 = []; let y1 = -1e9;
        for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y > pin.top - 16 && y < pin.top - 0.5 && Math.hypot(P.getX(i) - pinTop.x, P.getZ(i) - pinTop.z) < 40 && y > y1) y1 = y; }
        for (let i = 0; i < P.count; i++) {
          const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if (Math.hypot(x - pinTop.x, z - pinTop.z) > 40) continue;
          if (Math.abs(y - pin.top) < 0.01) ring0.push(new V3(x, y, z)); else if (Math.abs(y - y1) < 0.01) ring1.push(new V3(x, y, z));
        }
        const cap = new V3(pinTop.x, pin.top + 1.6, pinTop.z), n0 = ring0.length, n1 = ring1.length;
        // the sunning vulture's perch: on the side of the top that we come at, so the bird stands ahead of us and faces
        // us as we close; nothing is set between it and the route, and two bottle trees stand behind its shoulders
        { const from = path.pointAt(uPin - PERCH_BACK, new V3()); G.perchDir = new V3(from.x - pinTop.x, 0, from.z - pinTop.z).normalize().multiplyScalar(0.8).add(new V3(pinPass.x - pinTop.x, 0, pinPass.z - pinTop.z).normalize().multiplyScalar(0.6)).normalize(); }
        G.perch = pinTop.clone().addScaledVector(G.perchDir, 4.3); G.perch.y = pin.top + 1.45;
        const pd = G.perchDir, pa = Math.atan2(pd.z, pd.x);
        const keepOff = [[G.perch.x, G.perch.z, 3.6], [G.perch.x + pd.x * 3, G.perch.z + pd.z * 3, 3.2]];
        for (let i = 0; i < 2; i++) { const a = pa + (i ? -2.1 : 2.1), rr = 4.3; keepOff.push([pinTop.x + Math.cos(a) * rr, pinTop.z + Math.sin(a) * rr, 2.4]); }
        // (the shared stream is run once against the old clearings and its results dropped, so that everything laid
        // after this keeps the layout it had; the crown itself is laid from a stream of its own)
        const crown = (r, keep, emit) => {
          if (n0 > 3) for (let i = 0; i < 46; i++) {
            const k = r.int(0, n0 - 1), f = r(), a = ring0[k], b = ring0[(k + 1) % n0], kind = r();
            q.lerpVectors(a, b, r());
            if (kind < 0.5 && n1 === n0) q.lerp(tg.lerpVectors(ring1[k], ring1[(k + 1) % n1], r()), f * 0.8); else q.lerp(cap, f * 0.75);
            const out = Math.hypot(q.x - pinTop.x, q.z - pinTop.z);
            if (keep.some(([kx, kz, kr]) => Math.hypot(q.x - kx, q.z - kz) < kr)) continue;
            if (kind < 0.62) { const s = r.range(0.6, 1.5) * (1 + 1.3 * r() * r()); if (path.distanceTo(q.x, q.y + s * 0.5, q.z) > 7.5 + s) { const o = { x: q.x, y: q.y - 0.3 * s, z: q.z, sx: s * r.range(0.9, 1.4), sy: s * r.range(0.55, 0.95), sz: s * r.range(0.9, 1.4), ry: r() * TAU, big: s > 1.25 }; if (emit) pinRocks.push(o); } }
            else if (kind < 0.84) { const o = { x: q.x, y: q.y - 0.15, z: q.z, sx: r.range(0.6, 1.3), sy: r.range(0.5, 1.0), sz: r.range(0.6, 1.3), ry: r() * TAU, c: new THREE.Color().setRGB(r.range(0.8, 1.15), r.range(0.85, 1.1), r.range(0.75, 1.1)) }; if (emit) shr.push(o); }
            else if (out < 9) { const o = { x: q.x, y: q.y - 0.05, z: q.z, s: r.range(1.0, 1.7), ry: r() * TAU, c: emit ? new THREE.Color().setRGB(r.range(0.8, 1.05), r.range(0.8, 1.0), r.range(0.7, 1.0)) : strawC() }; if (emit) tus.push(o); }
          }
        };
        { const od = new V3(pinPass.x - pinTop.x, 0, pinPass.z - pinTop.z).normalize(), oa = Math.atan2(od.z, od.x), old = [[pinTop.x + od.x * 4.6, pinTop.z + od.z * 4.6, 3.4]];
          for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.9 + oa, rr = i === 0 ? 3.2 : 4.4; old.push([pinTop.x + Math.cos(a) * rr, pinTop.z + Math.sin(a) * rr, 2.4]); }
          crown(pr2, old, false); }
        crown(ctx.core.makeRng(ctx.core.hashSeed('pin-crown:' + ctx.seed)), keepOff, true);
        // on the top itself, where we pass within twenty metres: cushion shrubs on the side we come at, tussocks in
        // the grikes, a fig or two glued to the rock, and blossom fallen from the bottle trees
        G.pinFigs = [];
        await ctx.yield();
        if (n0 > 3) {
          const er = ctx.core.makeRng(ctx.core.hashSeed('pin-top:' + ctx.seed));
          const spot = (fMin, fMax, side) => {
            for (let t = 0; t < 30; t++) {
              const k = er.int(0, n0 - 1); q.lerpVectors(ring0[k], ring0[(k + 1) % n0], er()).lerp(cap, er.range(fMin, fMax));
              const dx = q.x - pinTop.x, dz = q.z - pinTop.z;
              if (side > -1 && dx * pd.x + dz * pd.z < side * Math.hypot(dx, dz)) continue;
              if (Math.hypot(q.x - G.perch.x, q.z - G.perch.z) < 2.9) continue;
              return true;
            }
            return false;
          };
          for (let i = 0; i < 5; i++) if (spot(0.08, 0.6, 0.15)) shr.push({ x: q.x, y: q.y - 0.12, z: q.z, sx: er.range(0.8, 1.5), sy: er.range(0.55, 0.9), sz: er.range(0.8, 1.5), ry: er() * TAU, c: new THREE.Color().setRGB(er.range(0.85, 1.1), er.range(0.9, 1.1), er.range(0.75, 1.0)) });
          for (let i = 0; i < 10; i++) if (spot(0.05, 0.8, -2)) tus.push({ x: q.x, y: q.y - 0.04, z: q.z, s: er.range(0.9, 1.5), ry: er() * TAU, c: new THREE.Color().setRGB(er.range(0.8, 1.05), er.range(0.8, 1.0), er.range(0.7, 1.0)) });
          for (let i = 0; i < 2; i++) if (spot(0.12, 0.5, 0.3)) G.pinFigs.push(q.clone());
          const pg = mk(), dP = new V3(), sP = new V3(), deepP = col('#c23f72');
          if (season !== 'summer') for (let i = 0; i < 110; i++) {
            if (!spot(0.04, 0.94, -2)) continue;
            const a = er() * TAU; dP.set(Math.cos(a), 0.06, Math.sin(a)).normalize(); sP.set(-Math.sin(a), 0, Math.cos(a));
            kite(pg, q.x, q.y + 0.05, q.z, dP, sP, er.range(0.16, 0.27), er.range(0.05, 0.08), deepP, 0.9, PAL[6], er.range(0.9, 1.15), 0);
          }
          if (pg.nv) scene.add(new THREE.Mesh(fin(pg, false), propMat));
        } }
      await ctx.yield();
      instance(tussockGeo, tus, true); await ctx.yield(); instance(shrubGeo, shr, true); instance(stoneGeo, sto, false);
      await ctx.yield();
      // boulders: detailed ones beside the last run, plainer ones across the bay floor; no two the same tone
      const hi = [], lo = [], tr = ctx.core.makeRng(ctx.core.hashSeed('rock-tint:' + ctx.seed));
      const rockTint = (grey) => { const k = tr.range(0.76, 1.1), gsel = tr(); return grey ? new THREE.Color(0.47 * k, 0.57 * k, 0.78 * k) : gsel > 0.6 ? new THREE.Color(0.74 * k, 0.77 * k, 0.84 * k) : gsel > 0.22 ? new THREE.Color(k, 0.97 * k, 0.92 * k) : new THREE.Color(1.04 * k, 0.88 * k, 0.72 * k); };
      const topOf = (geo) => { const P = geo.attributes.position; let t = 0; for (let i = 0; i < P.count; i++) if (Math.hypot(P.getX(i), P.getZ(i)) < 0.35) t = Math.max(t, P.getY(i)); return t || 0.9; };
      for (let i = 0; i < 400 && hi.length < 56; i++) {
        const u = pr2.range(uStoopEnd - 0.01, 1.01), sgn = pr2() < 0.5 ? -1 : 1, k = pr2(), off = sgn * (8 + k * 44), s = pr2.range(0.7, 1) * (1 + 2.6 * k * pr2());
        path.pointAt(Math.min(u, 1), q); path.tangentAt(Math.min(u, 1), tg);
        const x = q.x - tg.z * off, z = q.z + tg.x * off + (u > 1 ? (u - 1) * PL : 0), h = floorH(x, z);
        if (landH(x, z) > 2.5 || path.distanceTo(x, h + s * 0.6, z) < 6.5 + s * 1.3 || hi.some((o) => Math.hypot(o.x - x, o.z - z) < (o.s + s) * 1.2)) continue;
        hi.push({ x, y: h - 0.15 * s, z, s, sx: s * pr2.range(0.9, 1.3), sy: s * pr2.range(0.6, 1.0), sz: s * pr2.range(0.9, 1.3), ry: pr2() * TAU, c: rockTint(false) });
      }
      await ctx.yield();
      for (let i = 0; i < 900 && lo.length < Math.round(150 * detail); i++) {
        const x = cx + pr2.range(-330, 330), z = zl + pr2.range(60, 330), s = pr2.range(1.2, 2.4) * (1 + 2.5 * pr2() * pr2());
        if (z - L.z(x) < 55 || landH(x, z) > 2.5 || path.distanceTo(x, s, z) < 8 + s * 1.4) continue;
        lo.push({ x, y: floorH(x, z) - 0.2 * s, z, sx: s * pr2.range(0.9, 1.4), sy: s * pr2.range(0.55, 1.0), sz: s * pr2.range(0.9, 1.4), ry: pr2() * TAU, c: rockTint(false) });
      }
      await ctx.yield();
      // what stands on the canyon floor throws a soft shadow down-sun (laid as discs once the bottle trees are placed)
      for (const o of hi) G.shadows.push({ x: o.x, z: o.z, r: Math.max(o.sx, o.sz) * 1.05, hgt: o.sy * 0.75 });
      for (const o of lo) G.shadows.push({ x: o.x, z: o.z, r: Math.max(o.sx, o.sz) * 1.05, hgt: o.sy * 0.75 });
      // the perch itself: a flat-topped block whose top is exactly under the bird's feet
      hi.push({ x: G.perch.x, y: pin.top + 0.2, z: G.perch.z, sx: 2.4, sy: 1.27 / topOf(rockHi), sz: 2.4, ry: 1.3, c: rockTint(true) });
      for (const o of pinRocks) { o.c = rockTint(true); (o.big ? hi : lo).push(o); }
      instance(rockHi, hi, true); await ctx.yield(); instance(rockLo, lo, true);
      // on the pinnacle the rock shader itself shades the foot of whatever stands on it
      { const bl = hero.materials.rock.uniforms.uBlob.value; let nb = 0;
        const addB = (x, z, r, y) => { if (nb < 12) bl[nb++].set(x, z, r, y); };
        const pd = G.perchDir, pa = Math.atan2(pd.z, pd.x);
        addB(G.perch.x, G.perch.z, 2.7, pin.top + 0.8);
        addB(G.perch.x - pd.x * 2.9, G.perch.z - pd.z * 2.9, 2.9, pin.top + 1.2);
        for (let i = 0; i < 2; i++) { const a = pa + (i ? -2.1 : 2.1); addB(pinTop.x + Math.cos(a) * 4.3, pinTop.z + Math.sin(a) * 4.3, 1.7, pin.top + 0.6); }
        for (const o of pinRocks.slice().sort((a, b) => b.sx * b.sz - a.sx * a.sz).slice(0, 8)) addB(o.x, o.z, Math.max(o.sx, o.sz) * 1.0, o.y + 0.3 * Math.max(o.sx, o.sz) * 0.8); }
      // a weathered fin of dark rock behind the perch: the white bird is read against it, not against the pale fall
      { const pd = G.perchDir, ry = Math.atan2(-pd.x, -pd.z), dk = new THREE.Color().setRGB(0.36, 0.35, 0.4);
        instance(rockHi, [{ x: G.perch.x - pd.x * 2.9, y: pin.top + 1.5, z: G.perch.z - pd.z * 2.9, sx: 3.5, sy: 2.5, sz: 1.5, ry, c: dk },
          { x: G.perch.x - pd.x * 3.3 - pd.z * 2.6, y: pin.top + 0.9, z: G.perch.z - pd.z * 3.3 + pd.x * 2.6, sx: 2.2, sy: 1.6, sz: 1.5, ry: ry + 0.5, c: dk },
          { x: G.perch.x - pd.x * 2.5 + pd.z * 3.1, y: pin.top + 1.3, z: G.perch.z - pd.z * 2.5 - pd.x * 3.1, sx: 2.6, sy: 2.3, sz: 1.5, ry: ry - 0.45, c: dk }], true); }
    }
    await ctx.yield();

    // ---- bottle trees (desert rose): a swollen trunk, stubby forking arms, blossom at every tip; cucumber
    //      trees are the same build grown taller with a thin drooping green crown
    const bottleTree = (r, hi, mode, cucumber) => {
      const g = mk(), Ht = cucumber ? r.range(5.2, 6.4) : r.range(3.1, 4.2), R0 = cucumber ? r.range(0.7, 0.9) : r.range(0.8, 1.05);
      const bark = cucumber ? col('#b3aea6') : col('#c8aca8'), pinkC = PAL[6], deep = col('#c23f72'), leafC = greenC.clone().lerp(col('#7da05a'), 0.55);
      const prof0 = [[0, 1.12], [0.05, 1.26], [0.16, 1.22], [0.3, 1.02], [0.44, 0.78], [0.56, 0.56], [0.66, 0.42], [0.74, 0.36]];
      const lx = r.range(-0.5, 0.5), lz = r.range(-0.5, 0.5), ph = r() * TAU, lobes = r.int(2, 4);
      // the near specimens: twice the sections, each ring swollen or pinched a little, folds running down the bulge
      const prof = hi && !cucumber ? Array.from({ length: 13 }, (_, k) => {
        const f = 0.74 * k / 12; let j = 0; while (j < prof0.length - 2 && prof0[j + 1][0] < f) j++;
        const t = clamp((f - prof0[j][0]) / (prof0[j + 1][0] - prof0[j][0]), 0, 1);
        return [f, lerp(prof0[j][1], prof0[j + 1][1], t * t * (3 - 2 * t)) * (1 + 0.05 * Math.sin(k * 2.3 + ph) + 0.03 * Math.sin(k * 5.1 + ph * 2))];
      }) : prof0;
      const pts = prof.map(([f]) => new V3(lx * f * f, Ht * f, lz * f * f));
      tube(g, pts, (i, an) => R0 * prof[i][1] * (1 + 0.1 * Math.sin(an * lobes + ph + i * (hi ? 0.25 : 0.5)) * (1 - prof[i][0]) + 0.05 * Math.sin(an * 5 + ph * 2) + (hi ? 0.03 * Math.sin(an * 9 + i * 1.7) : 0)), hi ? 14 : 8, bark,
        (i, an) => (0.5 + 0.5 * smoothstep(0, 0.2, prof[i][0])) * (0.9 + 0.12 * Math.sin(an * lobes + ph + 1)), null, 1);
      const top = pts[pts.length - 1], nb = cucumber ? r.int(4, 6) : r.int(4, 5), d = new V3(), sd = new V3(), up = new V3(0, 1, 0), e = new V3(), pdv = new V3(), psv = new V3();
      const blossom = (p, dir, n, spread) => {
        for (let k = 0; k < n; k++) {
          e.set(r.range(-1, 1), r.range(-0.3, 1), r.range(-1, 1)).normalize().multiplyScalar(spread * r.range(0.3, 1)); _q.copy(p).add(e);
          d.copy(dir).multiplyScalar(0.5).add(e.normalize()).normalize();
          if (mode === 1) continue;
          if (cucumber || (mode === 2 && r() < 0.7)) { sd.crossVectors(d, up).normalize(); d.y -= cucumber ? 1.1 : 0.2; d.normalize(); kite(g, _q.x, _q.y, _q.z, d, sd, cucumber ? r.range(0.7, 1.2) : r.range(0.3, 0.5), cucumber ? 0.06 : 0.08, leafC, 0.6, leafC, 1.1, 1); continue; }
          sd.crossVectors(d, Math.abs(d.y) < 0.9 ? up : _a.set(1, 0, 0)).normalize(); _b.crossVectors(d, sd);
          if (hi) {
            // a flower of five separate petals round a deep throat, facing d
            const rad = r.range(0.2, 0.3), a0 = r() * TAU, fx = _q.x, fy = _q.y, fz = _q.z;
            for (let s = 0; s < 5; s++) {
              const an = a0 + s / 5 * TAU;
              pdv.copy(sd).multiplyScalar(Math.cos(an)).addScaledVector(_b, Math.sin(an)).addScaledVector(d, 0.32).normalize(); psv.crossVectors(d, pdv).normalize();
              kite(g, fx, fy, fz, pdv, psv, rad, rad * 0.3, deep, 0.8, pinkC, r.range(0.9, 1.15), 1);
            }
            continue;
          }
          const rad = r.range(0.16, 0.24), c0 = vx(g, _q.x, _q.y, _q.z, d.x, d.y, d.z, deep, 0.85, 0.6, 2), np = 3, a0 = r() * TAU, ring = [];
          for (let s = 0; s < np; s++) { const an = a0 + s / np * TAU, ca = Math.cos(an) * rad, sa = Math.sin(an) * rad; ring.push(vx(g, _q.x + sd.x * ca + _b.x * sa + d.x * rad * 0.35, _q.y + sd.y * ca + _b.y * sa + d.y * rad * 0.35, _q.z + sd.z * ca + _b.z * sa + d.z * rad * 0.35, d.x, d.y, d.z, pinkC, r.range(0.85, 1.12), 1, 2)); }
          for (let s = 0; s < np; s++) g.i.push(c0, ring[s], ring[(s + 1) % np]);
        }
      };
      // four or five stubby arms, each as thick as the neck it leaves, each forking once into two blunt stubs
      const thin = cucumber ? 0.6 : 1;
      for (let b = 0; b < nb; b++) {
        const a = b / nb * TAU + r.range(-0.3, 0.3), el = cucumber ? r.range(0.5, 1.0) : r.range(0.35, 0.8), len = r.range(0.9, 1.4) * (cucumber ? 1.3 : 1);
        d.set(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
        const p0 = top.clone().addScaledVector(up, -0.3), p1 = p0.clone().addScaledVector(d, len * 0.5), p2 = p0.clone().addScaledVector(d, len); p1.y += len * 0.04; p2.y += len * 0.16;
        tube(g, [p0, p1, p2], (i, an) => [0.33, 0.27, 0.2][i] * R0 * thin * (1 + 0.06 * Math.sin(an * 3 + b)), hi ? 7 : 4, bark, (i) => 0.72 + 0.12 * i, [0, 0.12, 0.3], 1);
        const dir0 = d.clone();
        for (let s = 0; s < 2; s++) {
          const a2 = a + (s ? 0.8 : -0.8) + r.range(-0.3, 0.3), l2 = r.range(0.4, 0.7);
          e.set(Math.cos(a2) * 0.72, r.range(0.5, 0.9), Math.sin(a2) * 0.72).normalize();
          const q1 = p2.clone().addScaledVector(e, l2), q2 = q1.clone().addScaledVector(e, 0.07 * R0);
          tube(g, [p2.clone(), q1, q2], (i) => [0.18, 0.115, 0.02][i] * R0 * thin, hi ? 6 : 3, bark, () => 0.9, [0.3, 0.7, 0.75], 1);
          blossom(q1, e.clone(), hi ? 5 : 4, hi ? 0.46 : 0.34);
          if (hi) blossom(p2.clone().lerp(q1, 0.5), e.clone(), 1, 0.3);
        }
        if (hi) blossom(p2, dir0, 2, 0.34);
      }
      return fin(g, false);
    };
    const flowerMode = season === 'summer' ? 1 : season === 'november' ? 2 : 0;
    const btHi = [bottleTree(pr2, true, flowerMode, false)];
    await ctx.yield();
    btHi.push(bottleTree(pr2, true, flowerMode, false));
    await ctx.yield();
    const btLo = bottleTree(pr2, false, flowerMode, false), cuke = bottleTree(pr2, false, 0, true);
    await ctx.yield();

    // ---- the pinch: two water-polished buttresses with a shoulder each, the portal between them
    const blossomSpots = [];
    const buttress = (bx, bz, baseR, Hh, shoulderF, towards) => {
      const g = mk(), NS = 28, NRr = 28, ph = pr2() * TAU, pts = [];
      for (let j = 0; j <= NRr; j++) pts.push(new V3(bx + 2.5 * Math.sin(j * 0.4 + ph) * (j / NRr), -1.5 + (Hh + 1.5) * Math.pow(j / NRr, 0.9), bz));
      const radF = (j, an) => {
        const f = j / NRr, step = f > shoulderF ? 0.66 : 1, cap = Math.sqrt(Math.max(1 - Math.pow(f, 5), 0.02));
        const bedJ = (j % 5 < 2 ? 0.065 : 0) + (j % 7 === 3 ? 0.04 : 0);
        return baseR * (1.2 - 0.34 * Math.pow(f, 0.7)) * step * cap * (1 + bedJ + 0.1 * Math.sin(an * 3 + ph + f * 2.2) + 0.06 * Math.sin(an * 7 + f * 9 + ph) + 0.035 * Math.sin(an * 13 + ph * 3 + f * 4) + 0.05 * noise.n3(Math.cos(an) * 2.2 + bx, f * 6, Math.sin(an) * 2.2 + bz));
      };
      tube(g, pts, radF, NS, limestone, (j, an) => (0.5 + 0.5 * smoothstep(0, 0.14, j / NRr)) * (j % 5 === 2 ? 0.6 : j % 5 < 2 ? 1.04 : 0.9) * (0.9 + 0.1 * Math.sin(an * 7 + j)) * (1 - 0.3 * smoothstep(0.08, 0.02, j / NRr)), null, 0);
      const geo = fin(g, true); scene.add(new THREE.Mesh(geo, propMat));
      const js = Math.ceil(shoulderF * NRr), an = Math.atan2(towards.z - bz, towards.x - bx), y = pts[js].y;
      return { x: pts[js].x + Math.cos(an) * baseR * 0.72, y: y + 0.2, z: bz + Math.sin(an) * baseR * 0.72 };
    };
    const shW = buttress(xp - 28.5, zp + 1, 15.5, 52, 0.36, { x: xp + 4, z: zp - 30 });
    const shE = buttress(xp + 26.5, zp - 2, 13, 31, 0.42, { x: xp - 4, z: zp - 30 });
    await ctx.yield();
    {
      const hiA = [], hiB = [], lo = [], ck = [];
      hiA.push({ x: shW.x, y: shW.y - 0.3, z: shW.z, s: 1.75, ry: 0.4 }); hiB.push({ x: shE.x, y: shE.y - 0.3, z: shE.z, s: 1.65, ry: 2.1 });
      blossomSpots.push(new V3(shW.x, shW.y + 6, shW.z), new V3(shE.x, shE.y + 5.6, shE.z));
      for (let i = 0; i < 2; i++) { const a = Math.atan2(G.perchDir.z, G.perchDir.x) + (i ? -2.1 : 2.1), rr = 4.3; (i % 2 ? hiA : hiB).push({ x: pinTop.x + Math.cos(a) * rr, y: pin.top + 0.35, z: pinTop.z + Math.sin(a) * rr, s: pr2.range(1.05, 1.25), ry: pr2() * TAU }); }
      pr2(); pr2();     // (there used to be a third: the stream keeps its place)
      const q = new V3(), tg = new V3();
      for (let i = 0; i < 60 && hiA.length + hiB.length < 9; i++) {
        const u = pr2.range(uStoopEnd + 0.02, 0.97), off = (pr2() < 0.5 ? -1 : 1) * pr2.range(13, 24); path.pointAt(u, q); path.tangentAt(u, tg);
        const x = q.x - tg.z * off, z = q.z + tg.x * off, h = floorH(x, z);
        if (h < WL0 + 0.2 || landH(x, z) > 2 || hiA.concat(hiB).some((o) => Math.hypot(o.x - x, o.z - z) < 14)) continue;
        (i % 2 ? hiA : hiB).push({ x, y: h - 0.2, z, s: pr2.range(1.5, 1.95), ry: pr2() * TAU });
      }
      await ctx.yield();
      // on the terraces of the promontory and the spur, and loose on the bay floor
      for (let i = 0; i < 1500 && lo.length < 46; i++) {
        const x = cx + pr2.range(-470, 430), z = zl + pr2.range(70, 470), h = landH(x, z);
        if (h < 0 || z - L.z(x) < 60 || path.distanceTo(x, h + 2, z) < 12) continue;
        const sl = Math.max(Math.abs(landH(x + 2.5, z) - h), Math.abs(landH(x, z + 2.5) - h));
        if (sl > 1.1 || (h < 3 && (pr2() > 0.12 || floorH(x, z) < WL0 + 0.2)) || h > 235) continue;
        (pr2() < 0.24 ? ck : lo).push({ x, y: h - 0.25, z, s: pr2.range(0.9, 1.5), ry: pr2() * TAU });
      }
      await ctx.yield();
      for (const o of hiA.concat(hiB)) if (o.y < 5) G.shadows.push({ x: o.x, z: o.z, r: 1.3 * o.s, hgt: 3.2 * o.s });
      (G.pinFigs || []).forEach((f, i) => (i % 2 ? hiA : hiB).push({ x: f.x, y: f.y - 0.08, z: f.z, s: 0.42 + 0.08 * i, ry: 1.7 + i * 2.3 }));    // the figs glued to the pinnacle's top
      instance(btHi[0], hiA, false); instance(btHi[1], hiB, false); instance(btLo, lo, false); instance(cuke, ck, false);
    }
    await ctx.yield();
    // ---- moonlit visits: one dragon's-blood tree stands on the pinnacle's crown behind the roosting birds, its red
    //      underside over them, and lights the stone and the birds beneath it (uGlowP: the one ember light the rock,
    //      the boulders and the birds take)
    if (night) {
      const pd = G.perchDir; let back = 4.6, sc = 1.0;
      const at = () => new V3(pinTop.x - pd.x * back, pin.top + 0.55, pinTop.z - pd.z * back);
      while (sc > 0.7 && path.distanceTo(at().x, pin.top + 7 * sc, at().z) < 9 + 4.8 * sc) { sc -= 0.06; back += 0.3; }
      const p = at(), pt = { x: p.x, y: p.y, z: p.z, s: sc, lod: 0, variant: 1, rot: 0.7, phase: 2.1, tint: 0.3 };
      hero.addTrees([pt]); G.pinTree = pt;
      U.uGlowP.value.set(p.x, p.y + 4.6 * sc, p.z, 6.5 * sc);
      await ctx.yield();
    }
    // ---- moonlit visits: the glow goes down into the canyon with us. Old dragon's-blood trees (the hero's own build)
    //      stand beside the pools of the chain on alternate banks, loose on the bay floor and on the ledges of both
    //      walls; each lights the ground under it red, and those by the water lay a red streak across it
    G.canyon = []; G.canyonMeshes = []; G.glowT = Array.from({ length: 8 }, () => new THREE.Vector4(0, -1000, 0, 0));
    if (night) {
      const cr = ctx.core.makeRng(ctx.core.hashSeed('canyon-trees:' + ctx.seed)), list = G.canyon;
      const free = (x, z, r, gap) => !G.shadows.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r) && !list.some((o) => Math.hypot(o.x - x, o.z - z) < gap);
      let sgn = cr() < 0.5 ? -1 : 1;
      for (let i = 0; i < chain.length; i++) {
        const p = chain[i]; if (p.z > zp - 44) break;
        for (let t = 0; t < 10; t++) {
          const s = cr.range(1.25, 1.7), keep = 17.5 + 4.7 * s;
          let x = p.x + sgn * (p.r * 1.2 + cr.range(3, 8)); const z = p.z + cr.range(-0.7, 0.7) * p.r * p.el;
          if (Math.abs(x - PXW) < keep) x = PXW + sgn * (keep + cr.range(0, 2.5));
          const h = floorH(x, z), pn = path.nearestXZ(x, z), up = pn.y - h;
          if (up > 11 && up < 50 && pn.dist < 44) break;                 // (not where we pull out low over the floor: a crown under the wing is cropped by the frame's corner)
          if (h < WL0 + 0.25 || landH(x, z) > 2.2 || path.distanceTo(x, h + 8, z) < keep - 1 || !free(x, z, 2.5, 15)) continue;
          list.push({ x, y: h - 0.25, z, s, lod: 0, variant: cr.int(0, 2), rot: cr() * TAU, phase: cr() * TAU, tint: cr.range(0.1, 0.5), water: 1 });
          sgn = -sgn; break;
        }
        if (list.length >= 8) break;
      }
      await ctx.yield();
      for (let i = 0, n = 0; i < 400 && n < 6; i++) {
        if ((i & 7) === 7) await ctx.yield();
        const x = PXW + cr.range(-110, 170), z = cr.range(zl + 105, zp - 30), h = floorH(x, z), s = cr.range(1.2, 1.9);
        if (h < WL0 + 0.3 || landH(x, z) > 2.2 || z - L.z(x) < 75 || path.distanceTo(x, h + 8, z) < 42 || !free(x, z, 3, 26)) continue;
        list.push({ x, y: h - 0.25, z, s, lod: 1, variant: cr.int(0, 2), rot: cr() * TAU, phase: cr() * TAU, tint: cr.range(0.1, 0.5) }); n++;
      }
      await ctx.yield();
      for (let i = 0, n = 0; i < 1600 && n < 14; i++) {
        if ((i & 7) === 7) await ctx.yield();
        const x = PXW + cr.range(-210, 170), z = cr.range(zl + 150, zp + 60), h = landH(x, z), s = cr.range(1.3, 2.1);
        if (h < 6 || h > 125 || z - L.z(x) < 80) continue;
        if (Math.abs(landH(x + 6, z) - h) > 1.1 || Math.abs(landH(x - 6, z) - h) > 1.1 || Math.abs(landH(x, z + 6) - h) > 1.1 || Math.abs(landH(x, z - 6) - h) > 1.1) continue;
        if (path.distanceTo(x, h + 8, z) < 34 || list.some((o) => Math.hypot(o.x - x, o.z - z) < 24)) continue;
        list.push({ x, y: h - 0.7, z, s, lod: 1, variant: cr.int(0, 2), rot: cr() * TAU, phase: cr() * TAU, tint: cr.range(0.1, 0.5), ledge: 1 }); n++;
      }
      await ctx.yield();
      // and along the promontory's edge above the canyon, big ones, far off against the sky and the sea
      for (let i = 0, n = 0; i < 1600 && n < 9; i++) {
        if ((i & 7) === 7) await ctx.yield();
        const x = cx + cr.range(-430, PX - 30), z = cr.range(zl + 215, zp + 160), h = landH(x, z), s = cr.range(2.0, 2.9);
        if (h < 125 || landH(x + 26, z + 8) > h - 14) continue;          // on the brink: the land falls away to the east of it
        if (Math.abs(landH(x - 7, z) - h) > 1.5 || Math.abs(landH(x, z + 7) - h) > 1.5 || Math.abs(landH(x, z - 7) - h) > 1.5) continue;
        if (list.some((o) => Math.hypot(o.x - x, o.z - z) < 38)) continue;
        list.push({ x, y: h - 0.8, z, s, lod: 1, variant: cr.int(0, 2), rot: cr() * TAU, phase: cr() * TAU, tint: cr.range(0.1, 0.5), ledge: 1 }); n++;
      }
      await ctx.yield();
      G.canyonMeshes = hero.addTrees(list);
      await ctx.yield();
      list.filter((t) => t.water).slice(0, 8).forEach((t, i) => G.glowT[i].set(t.x, t.y + 0.6 * t.h, t.z, 1));
      for (const t of list) if (!t.ledge) G.shadows.push({ x: t.x, z: t.z, r: t.r * 0.7, hgt: t.h * 0.6 });
      // the light each lays on the ground: a small soft pool of red at the trunk's foot, a crown and a half wide (seen
      // from above, a wide one ringed the dark crown and the tree read as a glowing pit)
      const n = list.length, A = new Float32Array(n * 4);
      list.forEach((t, i) => A.set([t.x, t.y + (t.ledge ? 1.1 : 0.55), t.z, t.r * 1.6], i * 4));
      const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
      geo.setAttribute('aE', new THREE.InstancedBufferAttribute(A, 4)); geo.instanceCount = n;
      const lightPools = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        uniforms: { uEmber: U.uEmber, uTime: U.uTime },
        vertexShader: /* glsl */`
          attribute vec4 aE; varying vec2 vUv; varying float vPh;
          void main(){ vUv = position.xy * 2.; vPh = aE.x * 0.37 + aE.z * 0.23; gl_Position = projectionMatrix * viewMatrix * vec4(aE.xyz + vec3(position.x, 0., position.y) * aE.w * 2., 1.); }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying float vPh; uniform vec3 uEmber; uniform float uTime;
          void main(){ float r2 = dot(vUv, vUv); float g = max(exp(-r2 * 3.4) - 0.034, 0.);
            gl_FragColor = vec4(uEmber * g * 0.46 * (0.85 + 0.15 * sin(uTime * 0.9 + vPh)), 1.); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }));
      lightPools.frustumCulled = false; lightPools.renderOrder = 0.6; scene.add(lightPools); G.canyonMeshes.push(lightPools);
      await ctx.yield();
    }
    // ---- soft shadows on the canyon floor under every boulder and bottle tree, thrown down-sun: nothing floats
    {
      const shadeMat = new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uCol: { value: col('#1d1a33', night ? 0.5 : 1) }, uA: { value: night ? 0.34 : 0.5 } },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          #include <fog_pars_vertex>
          void main(){ vUv = position.xz * 2.; vec4 mvPosition = viewMatrix * instanceMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; uniform vec3 uCol; uniform float uA;
          #include <fog_pars_fragment>
          void main(){ float a = 1. - smoothstep(0.3, 1., length(vUv)); gl_FragColor = vec4(uCol, a * a * (3. - 2. * a) * uA);
            #include <fog_fragment>
          }`,
        transparent: true, depthWrite: false, fog: true,
      });
      const sh = Math.hypot(sunDir.x, sunDir.z) || 1, dx = -sunDir.x / sh, dz = -sunDir.z / sh, tn = Math.max(sunDir.y / sh, 0.2), ang = Math.atan2(dx, dz);
      const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadeMat, Math.max(G.shadows.length, 1)); mesh.count = G.shadows.length;
      G.shadows.forEach((o, i) => {
        const across = o.r * 1.12, along = Math.min(across + 0.5 * o.hgt / tn, across * 3), off = (along - across) * 0.85, x = o.x + dx * off, z = o.z + dz * off;
        eu.set(0, ang, 0); qt.setFromEuler(eu); m4.compose(pv.set(x, floorH(o.x, o.z) + 0.08, z), qt, sv.set(across * 2, 1, along * 2)); mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.renderOrder = 0.5; scene.add(mesh);
    }
    await ctx.yield();

    // ---- pools and riffles: one sheet per pool, depth-tinted from the same floor function as the land
    const waterMat = mat(/* glsl */`
      attribute vec3 aD; varying vec3 vWp; varying vec3 vD;
      #include <fog_pars_vertex>
      void main(){ vWp = position; vD = aD; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec3 vWp; varying vec3 vD; uniform vec3 uTurq, uZen, uHor, uCamL; uniform vec4 uGlowT[8]; uniform float uMoonW;
      #include <fog_pars_fragment>
      ${hero.glsl}
      void main(){
        // (the shore is the real ground cutting the sheet; vD = depth of water, flow 0 still | 1 pool in the chain | 2 riffle, edge of the sheet)
        if (vD.x < -0.3) discard;
        float depth = max(vD.x, 0.);
        vec2 q = vWp.xz, fl = vec2(0.03, 0.5) * uTime * vD.y;
        vec3 a = texture2D(uNoise, q * 0.11 + vec2(uTime * 0.021, uTime * 0.017) - fl * 0.11).rgb;
        vec3 b = texture2D(uNoise, q * 0.31 - vec2(uTime * 0.03, -uTime * 0.024) - fl * 0.31).rgb;
        float shallow = 1. - smoothstep(0., 0.32, depth);
        vec2 sl = ((a.rg - 0.5) * 0.2 + (b.gb - 0.5) * 0.13) * (1. + 2. * shallow * vD.y);
        vec3 N = normalize(vec3(sl.x, 1., sl.y));
        vec3 Vd = uCamL - vWp; vec3 V = Vd / max(length(Vd), 1e-3);
        float fr = 0.03 + 0.97 * pow(1. - clamp(dot(N, V), 0., 1.), 5.);
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        vec3 skyc = mix(uHor, uZen, clamp(R.y * 1.4, 0., 1.));
        float fsh = floorShade(vWp);                                         // the drifting shade of the dissolving cloud crosses the water too
        vec3 lit = uSunCol * 0.45 * max(uSunDir.y, 0.12) * (1. - 0.45 * fsh) + uSkyCol;
        vec3 body = mix(vec3(0.4, 0.5, 0.42) * lit, uTurq * 1.2 * lit * (0.8 + 0.3 * a.b), smoothstep(0.02, 0.6, depth));
        body = mix(body, uTurq * vec3(0.45, 0.72, 0.9) * lit * 0.85, smoothstep(0.6, 1.25, depth));      // the deep middle darker and bluer
        vec3 c = mix(body, skyc, fr * 0.7);
        float sp = pow(max(dot(R, uSunDir), 0.), 220.);
        // glints: small hard sparks sliding over the ripples (they are what blooms; the water itself stays below it)
        // (the lookups are warped by a slow swell and the second is turned, so the sparks never line up in rows; they
        //  gather on the ripples' crests and twinkle)
        vec2 qw = q + (texture2D(uNoise, q * 0.043 + vec2(uTime * 0.008, 0.3)).ra - 0.5) * 4.2;
        float gA = texture2D(uNoise, qw * 0.53 + vec2(uTime * 0.07, -uTime * 0.05)).r, gB = texture2D(uNoise, mat2(0.74, 0.67, -0.67, 0.74) * qw * 0.91 - vec2(uTime * 0.06, uTime * 0.04) + 0.5).g;
        float gC = texture2D(uNoise, mat2(0.31, -0.95, 0.95, 0.31) * qw * 2.3 + vec2(-uTime * 0.11, uTime * 0.09)).b;
        float crest = smoothstep(0.46, 0.7, a.g + (b.b - 0.5) * 0.5);
        float glint = smoothstep(0.62, 0.8, gA * gB * 2. * (0.55 + 0.9 * gC)) * crest * (0.45 + 0.55 * sin(uTime * 5. + gC * 43. + gA * 17.)) * step(0.02, uSunDir.y) * smoothstep(0.05, 0.3, depth);
        c += uSunCol * (sp * 2.2 + max(glint, 0.) * mix(0.8, 1.5, uMoonW)) * (1. - 0.6 * fsh);
        // moonlit visits: the pools are pale mirrors of the moon's side of the sky, and each glowing tree that stands by
        // the water lays a broken red streak across it
        c += vec3(0.16, 0.2, 0.34) * uMoonW * (0.25 + 0.75 * fr) * (0.7 + 0.6 * a.r) * smoothstep(0.02, 0.4, depth);
        vec3 red = vec3(0.);
        for (int i = 0; i < 8; i++) {
          vec3 gd = uGlowT[i].xyz - vWp; float gl = length(gd);
          float cg = max(dot(R, gd / max(gl, 1e-3)), 0.), c4 = cg * cg; c4 *= c4; float c16 = c4 * c4; c16 *= c16;
          red += vec3(1., 0.07, 0.05) * uGlowT[i].w * (c16 * c16 * 1.1 + c16 * 0.3 + c4 * 0.04) * (1. - smoothstep(50., 150., gl));
        }
        c += red * uMoonW;
        // riffles: white water streaking down the channels between the pools
        float fo = texture2D(uNoise, q * vec2(0.5, 0.16) - vec2(0., uTime * 0.55)).b, fo2 = texture2D(uNoise, q * vec2(1.3, 0.3) - vec2(0., uTime * 0.9)).g;
        float riff = smoothstep(1.2, 1.8, vD.y);
        float foam = shallow * (0.2 * min(vD.y, 1.) + riff) * smoothstep(0.4, 0.68, fo * 0.6 + fo2 * 0.5);
        c = mix(c, vec3(0.8) * lit, clamp(foam, 0., 1.) * 0.8);
        // the riffles sparkle as well: hard sparks half a metre across that ride down the channels with the water and
        // twinkle, so the light runs along the whole stream, not only on the pools (sharp lookups: far off they flicker)
        vec2 qr = q * vec2(1., 0.62) - vec2(0., uTime * 1.5);
        float rA = texture2D(uNoise, qr * 0.47 + 0.3, -1.5).g, rB = texture2D(uNoise, mat2(0.8, 0.6, -0.6, 0.8) * qr * 0.81 + vec2(uTime * 0.19, 0.4), -1.5).r;
        float spark = smoothstep(0.64, 0.82, rA * rB * 2.4) * (0.5 + 0.5 * sin(uTime * 6.5 + rA * 37. + rB * 23.)) * riff * step(0.02, uSunDir.y);
        c += uSunCol * max(spark, 0.) * mix(1., 1.5, uMoonW) * (1. - 0.6 * fsh) * smoothstep(0., 0.7, vD.z);
        float alpha = mix(0.6, 0.95, smoothstep(0., 0.45, depth)) * smoothstep(0., 0.7, vD.z);
        alpha = max(alpha, clamp(max(foam, spark * riff), 0., 1.) * 0.8 * smoothstep(0., 0.7, vD.z));
        gl_FragColor = vec4(max(c, vec3(0.)), clamp(alpha, 0., 1.));
        #include <fog_fragment>
      }`, { uTurq: { value: PAL[4].clone() }, uZen: { value: col(H.sky[0], night ? 0.5 : 0.85) }, uHor: { value: col(H.sky[2], night ? 0.3 : 0.85) },
        uGlowT: { value: G.glowT }, uMoonW: { value: night ? 1 : 0 } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    {
      const p = [], dd = [], idx = []; let nv = 0;
      const put = (x, z, flow, edge) => { p.push(x, WL0, z); dd.push(WL0 - floorH(x, z), flow, edge); return nv++; };
      for (const pl of pools) {
        const NRg = 7, NSg = 18, flow = chain.includes(pl) ? 1 : 0, c0 = put(pl.x, pl.z, flow, 1), rings = [];
        for (let r = 1; r <= NRg; r++) { rings.push(nv); for (let s = 0; s < NSg; s++) { const an = s / NSg * TAU, rr = pl.r * 1.3 * r / NRg; put(pl.x + Math.cos(an) * rr, pl.z + Math.sin(an) * rr * pl.el, flow, r === NRg ? 0 : 1); } }
        for (let s = 0; s < NSg; s++) idx.push(c0, rings[0] + (s + 1) % NSg, rings[0] + s);
        for (let r = 0; r < NRg - 1; r++) for (let s = 0; s < NSg; s++) { const a = rings[r] + s, b = rings[r] + (s + 1) % NSg, c = rings[r + 1] + s, d = rings[r + 1] + (s + 1) % NSg; idx.push(a, b, c, b, d, c); }
      }
      for (let i = 0; i < chain.length - 1; i++) {
        // a riffle: shallow water draped over the channel's own bed, so it runs even where the bed stands above the pools
        const a = chain[i], b = chain[i + 1], t0 = a.r * a.el * 0.7 / (b.z - a.z), t1 = 1 - b.r * b.el * 0.7 / (b.z - a.z), base = nv, NT = 18, NK = 3, NW = NK * 2 + 1;
        if (t1 <= t0) continue;
        for (let j = 0; j <= NT; j++) { const t = lerp(t0, t1, j / NT), z = lerp(a.z, b.z, t), xc = lerp(a.x, b.x, t) + 1.6 * Math.sin(z * 0.3);
          for (let k = -NK; k <= NK; k++) { const x = xc + k * 0.95, bed = floorH(x, z); p.push(x, Math.max(WL0, bed + 0.07), z); dd.push(Math.max(WL0 - bed, 0.07), 2, Math.abs(k) === NK || j === 0 || j === NT ? 0 : 1); nv++; } }
        for (let j = 0; j < NT; j++) for (let k = 0; k < NW - 1; k++) { const q0 = base + j * NW + k; idx.push(q0, q0 + NW, q0 + 1, q0 + 1, q0 + NW, q0 + NW + 1); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('aD', new THREE.Float32BufferAttribute(dd, 3)); geo.setIndex(idx);
      const water = new THREE.Mesh(geo, waterMat); water.renderOrder = 1; scene.add(water);
    }
    await ctx.yield();

    // ---- birds. One shader: wings hinge at the shoulder, beat or soar, and fold for a stoop.
    //      aW = (span 0..1, side -1 | 0 | 1, 0); per bird aB = (phase, beat amplitude, dark 0..1, fold 0..1)
    const BIRD_VS = /* glsl */`
      attribute vec3 aW; attribute vec4 aB;
      uniform float uBeat; uniform vec3 uDark;
      varying vec3 vCol; varying vec3 vN; varying vec3 vWp;
      #include <fog_pars_vertex>
      ${hero.glsl}
      void main(){
        vec3 p = position; float s = aW.x, side = aW.y;
        float ang = (aB.y * sin(uTime * uBeat + aB.x) * (0.55 + 0.75 * s) + 0.07 + 0.03 * sin(uTime * 1.3 + aB.x)) * abs(side);
        float dx = p.x - side * 0.09, c = cos(ang), sn = sin(ang);
        p.x = side * 0.09 + dx * c * (1. - 0.6 * aB.w * s); p.y += abs(dx) * sn - 0.1 * aB.w * s; p.z -= aB.w * s * s * 0.55 * abs(side);
        vec3 n = normal; n.xy = vec2(n.x * c - n.y * sn * side, n.y * c + n.x * sn * side);
        vec4 wp = instanceMatrix * vec4(p, 1.);
        vN = mat3(instanceMatrix) * n; vWp = wp.xyz;
        float lum = dot(color, vec3(0.3, 0.5, 0.2));
        vCol = mix(color, uDark * (0.35 + 0.9 * lum), aB.z);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
    const BIRD_FS = /* glsl */`
      varying vec3 vCol; varying vec3 vN; varying vec3 vWp; uniform vec3 uCamL;
      #include <fog_pars_fragment>
      ${hero.glsl}
      ${LIGHT}
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 Ve = uCamL - vWp; if (dot(N, Ve) < 0.) N = -N;
        vec3 c = lightIt(vCol, N, vWp, 0.75 + 0.25 * N.y, 0.45);
        c += vCol * uRim * moonRim(N, Ve / max(length(Ve), 1e-3)) * 2.2;
        c += vCol * glowAt(vWp, N) * 1.6;
        // low over the canyon's sunlit floor a bird is lit from beneath by the pale stone: its underside glows warm
        c += vCol * uSunCol * vec3(0.95, 0.85, 0.68) * 0.8 * (0.5 - 0.5 * N.y) * (1. - smoothstep(70., 170., vWp.y)) * (1. - uView.z);
        c = applySlab(c, vWp, uCamL);
        gl_FragColor = vec4(max(c, vec3(0.)), 1.);
        #include <fog_fragment>
        gl_FragColor.rgb = farPearl(gl_FragColor.rgb, vWp, uCamL);
      }`;
    const birdGeo = (big) => {
      const g = { p: [], n: [], c: [], w: [], i: [], nv: 0 };
      const v = (x, y, z, nx, ny, nz, c, s, side) => { g.p.push(x, y, z); g.n.push(nx, ny, nz); g.c.push(c.r, c.g, c.b); g.w.push(s, side, 0); return g.nv++; };
      const white = col('#e9e2d2', 0.92), black = col('#17171b'), face = col('#e2a53a'), chest = col('#4a2a1c'), dusk = col('#24222a');
      if (big) {
        const prof = [[-0.42, 0.03], [-0.3, 0.09], [-0.1, 0.14], [0.1, 0.15], [0.25, 0.11], [0.33, 0.062], [0.38, 0.068], [0.44, 0.034], [0.52, 0.008]], NS = 7; let prev = -1;
        prof.forEach(([z, r], j) => {
          const first = g.nv, c = j >= 5 ? (j === 8 ? dusk : face) : white;
          for (let s = 0; s <= NS; s++) { const an = (s % NS) / NS * TAU, ca = Math.cos(an), sa = Math.sin(an); v(ca * r, sa * r * 0.85 - 0.01, z, ca, sa, 0, c, 0, 0); }
          if (prev >= 0) for (let s = 0; s < NS; s++) g.i.push(prev + s, first + s, prev + s + 1, prev + s + 1, first + s, first + s + 1);
          prev = first;
        });
        const t = [v(-0.06, 0.01, -0.34, 0, 1, 0, white, 0, 0), v(0.06, 0.01, -0.34, 0, 1, 0, white, 0, 0), v(-0.13, 0.01, -0.58, 0, 1, 0, white, 0, 0), v(0.13, 0.01, -0.58, 0, 1, 0, white, 0, 0), v(0, 0.01, -0.78, 0, 1, 0, white, 0, 0)];
        g.i.push(t[0], t[1], t[2], t[1], t[3], t[2], t[2], t[3], t[4]);
        for (const side of [-1, 1]) {
          const st = [[0, 0.2, -0.24], [0.18, 0.22, -0.22], [0.36, 0.23, -0.2], [0.54, 0.25, -0.17], [0.7, 0.22, -0.15], [0.84, 0.17, -0.12]]; let pr = null;
          for (const [s, le, te] of st) {
            const x = side * (0.09 + s * 1.06), mid = lerp(le, te, 0.52);
            const row = [v(x, 0.02, le, 0, 1, 0, white, s, side), v(x, 0.03, mid, 0, 1, 0, white, s, side), v(x, 0.03, mid, 0, 1, 0, black, s, side), v(x, 0.015, te, 0, 1, 0, black, s, side)];
            if (pr) { g.i.push(pr[0], row[0], pr[1], pr[1], row[0], row[1], pr[2], row[2], pr[3], pr[3], row[2], row[3]); }
            pr = row;
          }
          for (let f = 0; f < 5; f++) {
            const z0 = lerp(0.15, -0.1, f / 4), a = lerp(-0.5, 0.5, f / 4), len = lerp(0.3, 0.2, Math.abs(f - 1.5) / 2.5), x0 = side * (0.09 + 0.83 * 1.06), x1 = x0 + side * len * Math.cos(a), z1 = z0 - len * Math.sin(a);
            const q = [v(x0, 0.02, z0 + 0.03, 0, 1, 0, black, 0.84, side), v(x0, 0.02, z0 - 0.03, 0, 1, 0, black, 0.84, side), v(x1, 0.03, z1 + 0.012, 0, 1, 0, black, 1, side), v(x1, 0.03, z1 - 0.012, 0, 1, 0, black, 1, side)];
            g.i.push(q[0], q[2], q[1], q[1], q[2], q[3]);
          }
        }
      } else {
        const b = [v(0, 0, 0.11, 0, 0, 1, black, 0, 0), v(0, 0.035, 0, 0, 1, 0, black, 0, 0), v(0.03, -0.02, 0, 1, 0, 0, black, 0, 0), v(-0.03, -0.02, 0, -1, 0, 0, black, 0, 0), v(0, 0, -0.13, 0, 0, -1, black, 0, 0)];
        g.i.push(b[0], b[1], b[2], b[0], b[3], b[1], b[0], b[2], b[3], b[4], b[2], b[1], b[4], b[1], b[3], b[4], b[3], b[2]);
        for (const side of [-1, 1]) {
          const w = [v(side * 0.02, 0.01, 0.05, 0, 1, 0, black, 0, side), v(side * 0.02, 0.01, -0.05, 0, 1, 0, black, 0, side), v(side * 0.12, 0.01, 0.04, 0, 1, 0, black, 0.5, side), v(side * 0.12, 0.01, -0.045, 0, 1, 0, chest, 0.5, side), v(side * 0.24, 0.01, -0.03, 0, 1, 0, chest, 1, side)];
          g.i.push(w[0], w[2], w[1], w[1], w[2], w[3], w[2], w[4], w[3]);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(g.w, 3)); geo.setIndex(g.i);
      return geo;
    };
    const makeBirds = (geo, n, beat, dark) => {
      const m = mat(BIRD_VS, BIRD_FS, { uBeat: { value: beat }, uDark: { value: dark } }, { vertexColors: true, side: THREE.DoubleSide });
      const mesh = new THREE.InstancedMesh(geo, m, n), aB = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
      aB.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aB', aB); mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false; scene.add(mesh);
      return { mesh, aB };
    };
    // vultures: the kettle, two escorts, two that cross our bows, one sunning on the pinnacle
    const NK = Math.round(lerp(18, 40, (dens - 0.7) / 0.6)), NTH = 5, NV = NK + 6 + NTH, VS_SCALE = 1.4;
    const vult = makeBirds(birdGeo(true), NV, 2.6, altCast ? col('#6b4a2e') : col('#3d2f26'));
    const kettle = [];
    { const kr = rng.fork ? rng.fork('kettle') : rng;
      for (let i = 0; i < NK; i++) {
        const hiBand = kr() < 0.42, eye = i % 3 === 1;
        kettle.push({ r: eye ? kr.range(40, 70) : kr.range(30, 100), y: RIM + (eye ? kr.range(-30, 5) : hiBand ? kr.range(14, 44) : kr.range(-112, -40)), a: kr() * TAU, sp: kr.range(9, 13) * (kr() < 0.8 ? 1 : -1), ph: kr() * TAU, dark: i < 4 ? 1 : 0 });
        vult.aB.setXYZW(i, kr() * TAU, 0.02, i < 4 ? 1 : 0, 0);
      }
      for (let i = NK; i < NV; i++) vult.aB.setXYZW(i, kr() * TAU, 0.03, i === NK + 3 || i === NK + 5 ? 1 : (altCast && i < NK + 2 ? 0.85 : 0), 0);
    }
    // the kettle off our own line, by place (no draw is made, nothing but a height is changed). By day each bird's
    // middle is found, over the visits, at every point of a ring about the pinnacle: its level circle of radius k.r at
    // every height from k.y - SWING to k.y + SWING (the swing of its law in update(); turn and swing have different
    // periods and the entry clock is free). Its skin is nowhere further from its middle than `reach`: the furthest
    // vertex of the vulture's own geometry with the wing at any angle of its shoulder hinge (0.09 of the model out,
    // as the bird shader has it), at the kettle's scale; the bound is for the wing unfolded, and the kettle's fold
    // (aB.w) is 0 by day. SWING, the hinge's 0.09 and the ring's middle (pin) are written here a second time: whoever
    // changes them in update() or in the bird shader changes them here. A circle whose ring stands 2.0 m, that reach
    // and half a step of the table (below) clear of every point of the table of the route's whole line is left as
    // dealt. Any other has its height, and nothing else, moved up or down, whichever is
    // the lesser move (up when they are equal), by the least that clears: every point of the line nearer to the circle
    // in plan than the clearance forbids a span of heights about its own, and the height walks from span to span until
    // it stands in none. The line is read as a table of points STEP metres apart; no point of the line is further than
    // half a step from one of them, and that half step is added to the clearance asked of the table's points.
    // The land has one say in it. The circles reach in plan to the wall under the lip, and a move down can put a ring
    // into rock. So where down is the lesser move the land is read along the circle, every STEP metres of arc or
    // less: the highest, over each point, of the hero's own rock as drawn (its wall, plateau top and pinnacle are one
    // geometry: the triangles over the point, found through cells of plan CELL metres wide that are there for speed
    // alone) and of the world's land beyond it (landH). If the ring's lowest skin (its height less the swing less the
    // reach) stands clear of that land all round as dealt and would stand under it somewhere after the move down, the
    // move is up (a move up puts the lowest skin under no land it stood clear of). A ring that is under the land
    // somewhere as dealt (the deal lays some of its widest low circles through the wall) is moved by the lesser, as
    // the others are. The work is handed back between its pieces: every ten thousand triangles, every circle.
    // (not by night: the vultures roost and no circle is flown)
    if (!night) {
      const STEP = 0.5, SWING = 5, CELL = 8, vg = vult.mesh.geometry.attributes; let reach = 0;
      for (let j = 0; j < vg.position.count; j++) { const sd = vg.aW.getY(j), x = vg.position.getX(j), y = vg.position.getY(j), z = vg.position.getZ(j); reach = Math.max(reach, sd ? Math.hypot(Math.hypot(0.09, y) + Math.abs(x - sd * 0.09), z) : Math.hypot(x, y, z)); }
      const CLEAR = 2.0 + reach * VS_SCALE + STEP / 2, low = SWING + reach * VS_SCALE, nL = Math.ceil(PL / STEP), lr = new Float64Array(nL + 1), ly = new Float64Array(nL + 1), lp = new V3();
      for (let j = 0; j <= nL; j++) { path.posAtDist(Math.min(j * STEP, PL), lp); lr[j] = Math.hypot(lp.x - pin.x, lp.z - pin.z); ly[j] = lp.y; }
      const rock = hero.object.children.find((m) => m.material === hero.materials.rock).geometry, rp = rock.attributes.position.array, ri = rock.index.array;
      const RK = kettle.reduce((m, k) => Math.max(m, k.r), 0), NCL = Math.floor(2 * RK / CELL) + 1, cells = Array.from({ length: NCL * NCL }, () => []);
      for (let t = 0; t < ri.length; t += 3) {
        if (t % 30000 === 0) await ctx.yield();
        const a = ri[t] * 3, b = ri[t + 1] * 3, c = ri[t + 2] * 3;
        const i0 = Math.max(0, Math.floor((Math.min(rp[a], rp[b], rp[c]) - pin.x + RK) / CELL)), i1 = Math.min(NCL - 1, Math.floor((Math.max(rp[a], rp[b], rp[c]) - pin.x + RK) / CELL)); if (i0 > i1) continue;
        const j0 = Math.max(0, Math.floor((Math.min(rp[a + 2], rp[b + 2], rp[c + 2]) - pin.z + RK) / CELL)), j1 = Math.min(NCL - 1, Math.floor((Math.max(rp[a + 2], rp[b + 2], rp[c + 2]) - pin.z + RK) / CELL));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) cells[j * NCL + i].push(t);
      }
      // (the land over a plan point where it stands higher than g, else g)
      const landOver = (x, z, g) => {
        g = Math.max(g, landH(x, z)); const i = Math.floor((x - pin.x + RK) / CELL), j = Math.floor((z - pin.z + RK) / CELL);
        if (i >= 0 && j >= 0 && i < NCL && j < NCL) for (const t of cells[j * NCL + i]) {
          const a = ri[t] * 3, b = ri[t + 1] * 3, c = ri[t + 2] * 3; if (rp[a + 1] <= g && rp[b + 1] <= g && rp[c + 1] <= g) continue;
          const ex = x - rp[c], ez = z - rp[c + 2], det = (rp[b + 2] - rp[c + 2]) * (rp[a] - rp[c]) + (rp[c] - rp[b]) * (rp[a + 2] - rp[c + 2]);
          const l1 = ((rp[b + 2] - rp[c + 2]) * ex + (rp[c] - rp[b]) * ez) / det, l2 = ((rp[c + 2] - rp[a + 2]) * ex + (rp[a] - rp[c]) * ez) / det;
          if (l1 >= 0 && l2 >= 0 && l1 + l2 <= 1) g = Math.max(g, l1 * rp[a + 1] + l2 * rp[b + 1] + (1 - l1 - l2) * rp[c + 1]);
        }
        return g;
      };
      for (const k of kettle) {
        await ctx.yield();
        const lo = [], hi = [];
        for (let j = 0; j <= nL; j++) { const d = Math.abs(lr[j] - k.r); if (d < CLEAR) { const h = SWING + Math.sqrt(CLEAR * CLEAR - d * d); lo.push(ly[j] - h); hi.push(ly[j] + h); } }
        let up = k.y, dn = k.y;
        for (let moved = true; moved;) { moved = false; for (let j = 0; j < lo.length; j++) if (lo[j] < up && up < hi[j]) { up = hi[j]; moved = true; } }
        for (let moved = true; moved;) { moved = false; for (let j = 0; j < lo.length; j++) if (lo[j] < dn && dn < hi[j]) { dn = lo[j]; moved = true; } }
        if (up === k.y) continue;
        let goUp = up - k.y <= k.y - dn;
        if (!goUp) {
          const n = Math.ceil(TAU * k.r / STEP); let top = dn - low;
          for (let j = 0; j < n && top <= k.y - low; j++) { const a = j / n * TAU; top = landOver(pin.x + Math.cos(a) * k.r, pin.z + Math.sin(a) * k.r, top); }
          goUp = top > dn - low && top <= k.y - low;
        }
        k.y = goUp ? up : dn;
      }
    }
    // the sunning vulture: a standing figure of its own. Upright on the perch, belly to us, the arms held out from
    // the shoulders and the hands half drooped from the wrist: white underwing coverts in shingled rows over black
    // secondaries, five separate black primaries hanging fanned from each wrist, a ruff of hackles, the bare yellow face
    const standGeo = () => {
      const g = { p: [], n: [], c: [], w: [], i: [], nv: 0 };
      const white = col('#e9e2d2', 0.92), black = col('#17171b'), face = col('#e2a53a'), dusk = col('#2a2830'), leg = col('#c9a08c');
      // authored upright: X across the wings, Y up, Z toward the belly (the shader's bird has its body along z, back along y)
      const v = (X, Y, Z, nX, nY, nZ, c, k, s, side) => { g.p.push(X, -Z, Y); g.n.push(nX, -nZ, nY); g.c.push(c.r * k, c.g * k, c.b * k); g.w.push(s, side, 0); return g.nv++; };
      const prof = [[0.10, 0.045, 0], [0.15, 0.1, 0.01], [0.26, 0.135, 0.02], [0.4, 0.145, 0.03], [0.52, 0.125, 0.03], [0.6, 0.095, 0.02], [0.655, 0.085, 0.015], [0.69, 0.06, 0.03], [0.74, 0.062, 0.045], [0.79, 0.045, 0.05], [0.815, 0.012, 0.05]];
      const NS = 10; let prev = -1;
      prof.forEach(([Y, r, zo], j) => {
        const first = g.nv, c = j >= 7 ? face : white;
        for (let s = 0; s <= NS; s++) { const an = (s % NS) / NS * TAU, ca = Math.cos(an), sa = Math.sin(an); v(ca * r, Y, sa * r * 0.9 + zo, ca, 0.15, sa, c, (j >= 7 ? 1 : 0.86 + 0.14 * (j % 2)) * (0.82 + 0.18 * sa), 0, 0); }
        if (prev >= 0) for (let s = 0; s < NS; s++) g.i.push(prev + s, first + s, prev + s + 1, prev + s + 1, first + s, first + s + 1);
        prev = first;
      });
      { const b0 = v(-0.022, 0.77, 0.1, -1, 0, 0.3, face, 1, 0, 0), b1 = v(0.022, 0.77, 0.1, 1, 0, 0.3, face, 1, 0, 0), b2 = v(0, 0.74, 0.1, 0, -1, 0.3, face, 0.8, 0, 0), b3 = v(0, 0.785, 0.1, 0, 1, 0.3, face, 1, 0, 0), t = v(0, 0.722, 0.2, 0, -0.3, 1, dusk, 1, 0, 0);
        g.i.push(b0, b3, t, b3, b1, t, b1, b2, t, b2, b0, t); }
      for (let k = 0; k < 11; k++) { const an = k / 11 * TAU, ca = Math.cos(an), sa = Math.sin(an), r0 = 0.08, r1 = 0.135;
        const a = v(ca * r0 - sa * 0.022, 0.68, sa * r0 * 0.9 + ca * 0.022 + 0.015, ca, 0.3, sa, white, 0.92, 0, 0), b = v(ca * r0 + sa * 0.022, 0.68, sa * r0 * 0.9 - ca * 0.022 + 0.015, ca, 0.3, sa, white, 0.92, 0, 0), t = v(ca * r1, 0.575 - 0.02 * (k % 3), sa * r1 * 0.9 + 0.02, ca, 0.3, sa, white, 1.06, 0, 0);
        g.i.push(a, b, t); }
      { const a = v(-0.07, 0.2, -0.1, 0, 0, -1, white, 0.85, 0, 0), b = v(0.07, 0.2, -0.1, 0, 0, -1, white, 0.85, 0, 0), c2 = v(-0.1, 0.02, -0.17, 0, 0, -1, white, 0.95, 0, 0), d = v(0.1, 0.02, -0.17, 0, 0, -1, white, 0.95, 0, 0), t = v(0, -0.1, -0.2, 0, 0, -1, white, 1, 0, 0);
        g.i.push(a, b, c2, b, d, c2, c2, d, t); }
      for (const sx of [-1, 1]) { const a = v(sx * 0.05 - 0.016, 0.14, 0.03, 0, 0, 1, leg, 0.9, 0, 0), b = v(sx * 0.05 + 0.016, 0.14, 0.03, 0, 0, 1, leg, 0.9, 0, 0), c2 = v(sx * 0.055 - 0.012, -0.03, 0.04, 0, 0, 1, leg, 0.7, 0, 0), d = v(sx * 0.055 + 0.012, -0.03, 0.04, 0, 0, 1, leg, 0.7, 0, 0); g.i.push(a, b, c2, b, d, c2); }
      // a feather: a rounded blade of seven vertices lying in the wing's plane
      const FP = [[0, -0.5], [0, 0.5], [0.45, -1], [0.45, 1], [0.84, -0.74], [0.84, 0.74], [1, 0]];
      const feather = (bx, by, bz, dx, dy, len, hw, c0, k0, c1, k1, s0, s1, side) => {
        const i0 = g.nv, wx = -dy, wy = dx;
        for (const [fa, fb] of FP) { tc.copy(c0).lerp(c1, smoothstep(0.1, 0.7, fa)); v(bx + dx * len * fa + wx * hw * fb, by + dy * len * fa + wy * hw * fb, bz - 0.014 * fa + 0.006 * fb, 0.25 * fb * side, 0, 1, tc, lerp(k0, k1, fa) * (1 - 0.14 * Math.abs(fb) * (1 - fa)), lerp(s0, s1, fa), side); }
        g.i.push(i0, i0 + 2, i0 + 1, i0 + 1, i0 + 2, i0 + 3, i0 + 2, i0 + 4, i0 + 3, i0 + 3, i0 + 4, i0 + 5, i0 + 4, i0 + 6, i0 + 5);
      };
      for (const side of [-1, 1]) {
        const Sx = side * 0.1, Sy = 0.56, Wx = side * 0.53, Wy = 0.61;
        for (let k = 0; k < 7; k++) {     // black secondaries hanging from the arm
          const t = (k + 0.5) / 7, th = (4 + 20 * t) * Math.PI / 180;
          feather(lerp(Sx, Wx, t), lerp(Sy, Wy, t) - 0.02, 0.03 + 0.002 * k, side * Math.sin(th), -Math.cos(th), 0.37 + 0.06 * t, 0.048, dusk, 1.2, black, 1, 0.1 + 0.45 * t, 0.2 + 0.5 * t, side);
        }
        for (let row = 0; row < 2; row++) for (let k = 0; k < 8; k++) {     // white coverts in two shingled rows
          const t = (k + (row ? 0.5 : 0.25)) / 8, th = (6 + 22 * t) * Math.PI / 180;
          feather(lerp(Sx, Wx, t), lerp(Sy, Wy, t) + (row ? 0.035 : 0.0), 0.045 + 0.012 * row + 0.001 * k, side * Math.sin(th), -Math.cos(th), row ? 0.12 : 0.2, row ? 0.034 : 0.04, white, row ? 0.84 : 0.76, white, row ? 0.98 : 1.04, 0.1 + 0.45 * t, 0.12 + 0.48 * t, side);
        }
        { const a = v(Sx, Sy + 0.045, 0.06, 0, 1, 0.5, white, 0.9, 0.05, side), b = v(Sx, Sy + 0.005, 0.062, 0, 0, 1, white, 0.82, 0.05, side), c2 = v(Wx + side * 0.02, Wy + 0.05, 0.06, 0, 1, 0.5, white, 1.0, 0.6, side), d = v(Wx + side * 0.02, Wy + 0.01, 0.062, 0, 0, 1, white, 0.9, 0.6, side); g.i.push(a, b, c2, b, d, c2); }   // the arm's leading edge
        for (let f = 0; f < 5; f++) {      // five primaries fanned from the wrist, from nearly level to hanging
          const ph = (9 + 19 * f) * Math.PI / 180, dx = side * Math.cos(ph), dy = -Math.sin(ph), bx = Wx - side * 0.012 * f, by = Wy - 0.024 * f;
          feather(bx, by, 0.028 + 0.003 * f, dx, dy, 0.54 - 0.03 * f, 0.037, dusk, 1.3, black, 1, 0.62, 1, side);
          feather(bx - dx * 0.02, by - dy * 0.02, 0.05 + 0.002 * f, dx, dy, 0.19, 0.036, white, 0.8, white, 1.03, 0.6, 0.72, side);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(g.w, 3)); geo.setIndex(g.i);
      return geo;
    };
    const STAND_S = 3.4, sunner = (() => {
      const geo = standGeo(), mesh = new THREE.InstancedMesh(geo, vult.mesh.material, 1), aB = new THREE.InstancedBufferAttribute(new Float32Array([1.7, night ? 0.01 : 0.05, 0, night ? 1 : 0]), 4);
      geo.setAttribute('aB', aB); mesh.frustumCulled = false; scene.add(mesh);
      return mesh;
    })();
    // starlings (or sparrows): 160 that flush from the crowns as one flock; swifts along the cliff (bats at night)
    const NSTAR = 160, NSW = 20, NPACK = 9;
    const small = makeBirds(birdGeo(false), NSTAR + NSW, 46, altCast ? col('#4a3f33') : col('#141418'));
    const flock = [];
    { const fr = rng.fork ? rng.fork('flock') : rng, tl = hero.anchors.trees, q = path.pointAt(uFlock, new V3()), tg = path.tangentAt(uFlock, new V3());
      const near = tl.filter((t) => { const dx = t.x - q.x, dz = t.z - q.z; return Math.hypot(dx, dz) < 46 && (-tg.z * dx + tg.x * dz) > 3; });
      for (let i = 0; i < NSTAR; i++) {
        const t = near.length ? near[fr.int(0, near.length - 1)] : { x: q.x - tg.z * 14, z: q.z + tg.x * 14, r: 4, h: 8 }, a = fr() * TAU, rr = fr() * (t.r || 4) * 0.8;
        flock.push({ sx: t.x + Math.cos(a) * rr, sy: RIM + (t.h || 8) - 0.5, sz: t.z + Math.sin(a) * rr, ox: fr.gauss() * 0.5, oy: fr.gauss() * 0.5, oz: fr.gauss() * 0.5, d: fr() * 0.3, ph: fr() * TAU });
        small.aB.setXYZW(i, fr() * TAU, 0.95, altCast ? 0.8 : 0, 0);
      }
      for (let i = 0; i < NSW; i++) { flock.push({ ph: fr() * TAU, a: fr.range(0.6, 1.3), b: fr.range(0.25, 0.42), y: fr.range(-205, -60), zo: fr.range(22, 44) }); small.aB.setXYZW(NSTAR + i, fr() * TAU, 0.55, 1, 0.25); }
    }
    await ctx.yield();

    // ---- flecks: shed petals, dragonflies over the pools, sunbirds at the blossom. One instanced draw.
    const viewH = { value: 1080 };
    const fleckMat = mat(/* glsl */`
      attribute vec4 aP; attribute vec4 aQ; uniform float uViewH; uniform float uTime;
      varying vec2 vUv; varying vec3 vQ;
      #include <fog_pars_vertex>
      void main(){
        float t = uTime, ph = aP.w, kind = aQ.x; vec3 p = aP.xyz;
        if (kind < 0.5) { float f = fract(t * 0.09 + ph); p += vec3(sin(t * 0.9 + ph * 40.) * 0.8 + f * 1.5, -f * aQ.z, f * f * 6. + cos(t * 0.7 + ph * 31.) * 0.8); }
        else if (kind < 1.5) p += vec3(sin(t * 0.9 + ph * 20.) * aQ.z + 0.35 * sin(t * 6. + ph * 50.), 0.35 * sin(t * 1.7 + ph * 9.), cos(t * 0.7 + ph * 33.) * aQ.z + 0.35 * cos(t * 5. + ph * 70.));
        else p += vec3(sin(t * 2.3 + ph * 20.) * 0.7 + 0.08 * sin(t * 31. + ph), 0.4 * sin(t * 1.9 + ph * 13.), cos(t * 1.7 + ph * 11.) * 0.7);
        vec4 mvPosition = viewMatrix * vec4(p, 1.);
        float px = 2. * max(-mvPosition.z, 0.) / max(uViewH * projectionMatrix[1][1], 1.);
        float sz = max(aQ.y, px * 2.2);
        float sp = kind < 0.5 ? t * 3. + ph * 60. : 0.; vec2 q = position.xy; q = vec2(q.x * cos(sp) - q.y * sin(sp), q.x * sin(sp) + q.y * cos(sp));
        // the shed petals are a medium we fly through, so they take the near law of the kit's own particles (makeParticles:
        // smoothstep(uNear.x, uNear.y, dist), dist the true distance of the piece's middle from the lens) with the two
        // figures of the kit's petals preset (near: [0.6, 2.5]). This draw is opaque, so the law is on the petal's size:
        // inside 0.6 m of the lens a petal has no size and is not drawn, from 2.5 m it is whole. It reads the true
        // distance from the eye and nothing else (the lines above and below it, which keep a fleck at 2.2 pixels or more
        // and lay the sheet in the lens's plane, read the eye too and are as they were); the dragonflies and sunbirds of
        // this draw are not touched by it
        if (kind < 0.5) q *= smoothstep(0.6, 2.5, length(mvPosition.xyz));
        mvPosition.xy += q * sz; vUv = position.xy * 2.; vQ = vec3(kind, aQ.w, aQ.y / sz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec2 vUv; varying vec3 vQ; uniform vec3 uPink, uTurq;
      #include <fog_pars_fragment>
      ${hero.glsl}
      void main(){
        float kind = vQ.x; vec2 a = abs(vUv); float sh; vec3 c; vec3 lit = uSunCol * 0.55 + uSkyCol;
        if (kind < 0.5) { sh = 1. - smoothstep(0.7, 1., length(vUv * vec2(1., 1.7))); c = uPink * lit * (0.8 + 0.3 * vQ.y); }
        else if (kind < 1.5) { sh = max(step(a.x, 0.1) * step(a.y, 0.95), step(a.y - 0.3 * step(0., vUv.y), 0.2) * step(a.x, 0.95) * step(0.2, a.x) * step(0., vUv.y + 0.15)); c = mix(uTurq * 1.6, vec3(0.9, 0.25, 0.12), step(0.7, vQ.y)) * lit + uSunCol * 0.25 * step(0.2, a.x); }
        else { sh = 1. - smoothstep(0.6, 0.95, length(vUv * vec2(1.6, 1.))); c = mix(vec3(0.03, 0.05, 0.04), vec3(0.2, 0.5, 0.25) * lit, smoothstep(0.1, 0.5, vUv.y)); }
        if (sh < 0.5) discard;
        gl_FragColor = vec4(max(c, vec3(0.)), 1.);
        #include <fog_fragment>
      }`, { uViewH: viewH, uPink: { value: PAL[6].clone() }, uTurq: { value: PAL[4].clone() } }, { side: THREE.DoubleSide });
    {
      const fr = rng.fork ? rng.fork('flecks') : rng, P = [], Q = [];
      const petalsAt = (c, n, rad, fall) => { for (let i = 0; i < n; i++) { P.push(c.x + fr.range(-rad, rad), c.y + fr.range(-0.5, 1), c.z + fr.range(-rad, rad), fr()); Q.push(0, 0.09, fall * fr.range(0.7, 1), fr()); } };
      if (season !== 'summer') {
        for (const b of blossomSpots) petalsAt(b, Math.round(46 * detail), 3.5, b.y - 0.5);
        petalsAt(new V3(pinTop.x, pin.top + 4, pinTop.z), Math.round(40 * detail), 5, 30);
        petalsAt(new V3(xp, 9, zp - 26), Math.round(40 * detail), 16, 9);
      }
      if (!night) {
        for (let i = 0; i < Math.round(44 * detail); i++) { const p = chain[fr.int(Math.max(0, chain.length - 7), chain.length - 1)]; P.push(p.x + fr.range(-0.3, 0.3) * p.r, WL0 + fr.range(0.5, 2.0), p.z + fr.range(-0.3, 0.3) * p.r, fr()); Q.push(1, 0.2, p.r * 0.5, fr()); }
        for (let i = 0; i < 6; i++) { const b = blossomSpots[i % 2]; P.push(b.x + fr.range(-1.6, 1.6), b.y + fr.range(-1, 0.8), b.z + fr.range(-1.6, 1.6), fr()); Q.push(2, 0.22, 0, fr()); }
      }
      const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
      geo.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4)); geo.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(Q), 4));
      geo.instanceCount = P.length / 4;
      const flecks = new THREE.Mesh(geo, fleckMat); flecks.frustumCulled = false; scene.add(flecks);
    }

    // ---- wisps: soft ribbons of fog streaming south round the eye while it is in or near the sheet
    const wispU = { uIn: { value: 1 }, uMode: { value: 0 } };
    const wispMat = mat(/* glsl */`
      attribute vec4 aW; uniform vec3 uCamL; uniform float uMode;
      varying vec2 vUv; varying vec3 vWp; varying float vThin; varying float vLip;
      #include <fog_pars_vertex>
      ${hero.glsl}
      void main(){
        vec3 box = vec3(110., 1., 130.);
        vec3 o = vec3(aW.x, 0., aW.z + uTime * uCap.y * (0.7 + 0.5 * fract(aW.w * 7.31)));
        vec3 c = uCamL + mod(o - uCamL + box * 0.5, box) - box * 0.5;
        float top = fogTop(c.xz);
        // inside the fog: long ribbons streaming past the eye. Above it: short tongues that stand on the river's crests,
        // lean downwind as they lift and tear away (none over a hole or in a wake)
        float lenA = 2.8 + 3.2 * fract(aW.w * 3.7), htA = 3.2 + 6. * fract(aW.w * 11.3) * fract(aW.w * 5.1 + 0.4);
        htA *= mix(0.5, 1., deepK());
        float len = mix(14. + 16. * fract(aW.w * 3.7), lenA, uView.y), ht = mix(1.4 + 2.2 * fract(aW.w * 11.3), htA, uView.y);
        float gl = lipZf(c.x) - c.z;
        float rl = relief(c.xz, 3.) * mix(0.32, 1., smoothstep(10., 34., gl));
        // the tongues that lift off the bend: a wisp carried to within 18 m of the edge stands on the lip's own line,
        // grows as it is drawn out over the drop, leans away and tears off
        float onLip = (1. - smoothstep(13., 19., gl)) * step(-9., gl) * uView.y * (1. - uMode);
        float prog = clamp((17. - gl) / 26., 0., 1.);
        c.z = mix(c.z, lipZf(c.x) - 0.4 - 2.6 * fract(aW.w * 13.7) + 2.2 * prog * prog, onLip);
        top = mix(top, fogTop(vec2(c.x, lipZf(c.x) - 1.)), onLip);
        float htL = (1.5 + 2.6 * fract(aW.w * 11.3)) * (0.45 + 0.75 * prog) * mix(0.6, 1., deepK());
        ht = mix(ht, htL, onLip); len = mix(len, 2.6 + 2.4 * fract(aW.w * 3.7), onLip);
        c.y = mix(uFogP.x + 0.8 + aW.y * max(top - uFogP.x - 0.6, 0.5) * 1.1, mix(top + rl - 0.7 + 0.5 * htA, top - 0.5 + 0.5 * htL, onLip), uView.y);
        vThin = fogThin(c.xz) * uView.y * (1. - onLip);
        vLip = onLip * smoothstep(-9., -3., gl) * (1. - 0.6 * smoothstep(0.75, 1., prog));
        vec3 wp = c + vec3(0.12 * position.x * len, position.y * ht, position.x * len + (position.y + 0.5) * ht * (0.45 + 0.75 * fract(aW.w * 17.7) + 0.8 * prog * onLip) * uView.y);
        if (uMode > 0.5) {
          // the bay's mist: where the fall tears apart, 120 to 250 m down, it gathers into slow billows along the foot of
          // the wall; each sinks, swells and is replaced from above (they keep to the wall: none drifts round the eye)
          float life = fract(uTime * (0.012 + 0.008 * fract(aW.w * 7.31)) + aW.y);
          float bxx = uLipA.w + (aW.x / 110. * 2. - 1.) * 330.;
          float out0 = 16. + 46. * fract(aW.w * 5.3) + 22. * life;
          c = vec3(bxx, uFogP.x - 122. - 128. * life, lipZf(bxx) + out0);
          vec3 toC = uCamL - c; toC /= max(length(toC), 1e-3); vec3 rg = cross(vec3(0., 1., 0.), toC); rg /= max(length(rg), 1e-3); vec3 upp = cross(toC, rg);
          float sz = (30. + 30. * fract(aW.w * 3.7)) * (0.7 + 0.6 * life);
          wp = c + rg * position.x * sz + upp * position.y * sz * 0.62; vThin = smoothstep(0., 0.14, life) * (1. - smoothstep(0.7, 1., life)); vLip = fract(aW.w * 9.1);
        }
        vUv = position.xy * 2.; vWp = wp;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, /* glsl */`
      varying vec2 vUv; varying vec3 vWp; varying float vThin; varying float vLip; uniform vec3 uCamL; uniform float uIn, uMode;
      #include <fog_pars_fragment>
      ${hero.glsl}
      void main(){
        float dist = distance(vWp, uCamL);
        float n = texture2D(uNoise, vec2(vWp.z - uTime * uCap.y, vWp.y * 3. + vWp.x) * 0.02).g;
        float a = (1. - vUv.x * vUv.x) * (1. - vUv.y * vUv.y); a *= a * smoothstep(0.25, 0.75, n + 0.25);
        // above the sheet a tongue is thick at its foot, torn and thin at its top
        float up01 = vUv.y * 0.5 + 0.5, n2 = texture2D(uNoise, vec2(vWp.x * 0.11 + vWp.z * 0.05, vWp.y * 0.21 - uTime * 0.5)).r;
        float aT = (1. - vUv.x * vUv.x) * (1. - vUv.x * vUv.x) * (1. - smoothstep(0.4, 1., up01)) * smoothstep(0., 0.24, up01) * smoothstep(0.1 + 0.45 * up01, 0.42 + 0.45 * up01, n * 0.6 + n2 * 0.6) * (1. - vThin);
        a = mix(a, aT * mix(3.2 + 1.3 * (1. - uView.z), 4.4, vLip), uView.y);
        float farT = uView.y * (1. - uView.z);                                 // by day the tongues are seen further off, against the trunks and the base of the crown band
        a *= smoothstep(3., 12., dist) * (1. - smoothstep(mix(34., 46., uView.y) + 30. * vLip + 30. * farT, mix(62., 84., uView.y) + 40. * vLip + 48. * farT, dist)) * mix(smoothstep(-2., 14., lipZf(vWp.x) - vWp.z), 1., vLip) * uIn;
        // (a ribbon that streams past the eye inside the fog takes the sun break softly: the pool's crisp edge would rule a line down it)
        vec2 eb = (vWp.xz - uBreak.xy) * uBreak.zw;
        float m = mix(mix(uCap.x, 1., 1. - smoothstep(0.3, 1.7, dot(eb, eb))), sunMask(vWp), uView.y * (1. - uMode));
        a *= 1. - 0.1 * uView.z * uView.y;
        float bLit = 0., lowS = 1. - smoothstep(0.36, 0.48, uSunDir.y);
        if (uMode > 0.5) {
          // a billow: a round body eaten at its edge by two sizes of noise, its upper side lit, its underside in shade
          float r2 = dot(vUv, vUv);
          float nA = texture2D(uNoise, vWp.xy * 0.013 + vec2(vWp.z * 0.009 + vLip, uTime * 0.012)).r, nB = texture2D(uNoise, vWp.xy * 0.041 + vec2(vWp.z * 0.023, -uTime * 0.02) + vLip).g;
          float nC = texture2D(uNoise, vWp.xy * 0.11 + vec2(vWp.z * 0.07, -uTime * 0.03) + vLip * 3.).b;
          float body = 1. - r2 * 1.1 - (nA - 0.3) * 1.25 - (nB - 0.5) * 0.7 - (nC - 0.5) * 0.3;
          a = smoothstep(0.02, 0.62, body) * vThin * smoothstep(40., 105., dist) * (1. - smoothstep(700., 1200., dist)) * mix(1.45, 2.2, uView.z);
          bLit = clamp(0.5 + 0.6 * vUv.y + (nA - 0.5) * 0.9 + (nB - 0.5) * 0.5, 0., 1.) * smoothstep(0.0, 0.5, body);
          a *= mix(1., 0.35 + 0.65 * bLit, lowS);                             // (by night and under a low sun its dim underside is thin: no billow is a dark blob on the bright fall)
        }
        float litK = mix(0.55 + 0.45 * m, (0.2 + 0.8 * max(smoothstep(uCap.x, 0.95, m), sunK(m))) * (0.55 + 0.45 * up01), uView.y * (1. - uMode));
        vec3 wc = mix(mix(uFogShade, uFogLit, uView.w * uView.y), uFogLit, litK) * 1.06;
        // a tongue standing on the river has form: a violet foot and lee, a bright torn top
        wc = mix(wc, uFogShade * 0.92, uView.y * (1. - uMode) * (1. - smoothstep(0.1, 0.6, up01 + (n2 - 0.5) * 0.3)) * 0.46);
        // night: inside the river a ribbon is dark blue away from the moon, like the mist round it, and the mist
        // between the eye and the moon glows warm silver
        float fwd = max(dot((vWp - uCamL) / max(dist, 1e-3), uSunDir), 0.); fwd *= fwd;
        wc *= mix(1., mix(0.46 + 0.7 * fwd, 1., uView.y), uView.z); fwd *= fwd;
        wc += uHalo * 0.55 * fwd * fwd;
        if (uMode > 0.5) {
          // (its shade takes the hour: blue-violet under a high sun; mauve-rose at dawn and dusk and lifted toward the lit colour, as it is by night)
          vec3 shB = mix(uFogShade * vec3(0.78, 0.86, 1.08), uFogLit * mix(vec3(1.), vec3(1.1, 0.94, 0.98), 1. - uView.z), 0.4 * lowS);
          wc = mix(shB, uFogLit * 1.02, bLit * (0.55 + 0.45 * sunMask(vWp))) + uRim * 0.7 * bLit * bLit + uHalo * 0.4 * fwd * fwd;
        }
        gl_FragColor = vec4(wc, clamp(a * mix(0.34, 0.42, uView.y), 0., mix(1., 0.76, uView.y)));
        #include <fog_fragment>
      }`, wispU, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    {
      // (by day sixty more, from a stream of their own so that everything laid after keeps its place: more tongues on the river)
      const fr = rng.fork ? rng.fork('wisps') : rng, n0 = Math.round(150 * detail), n = n0 + (night ? 0 : Math.round(130 * detail)), A = new Float32Array(n * 4), fx = ctx.core.makeRng(ctx.core.hashSeed('tongues-more:' + ctx.seed));
      for (let i = 0; i < n; i++) { const r = i < n0 ? fr : fx; A.set([r() * 110, r(), r() * 130, r()], i * 4); }
      const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
      geo.setAttribute('aW', new THREE.InstancedBufferAttribute(A, 4)); geo.instanceCount = n;
      const wisps = new THREE.Mesh(geo, wispMat); wisps.frustumCulled = false; wisps.renderOrder = 5; scene.add(wisps);
      const n2 = Math.round(80 * detail), A2 = new Float32Array(n2 * 4);
      for (let i = 0; i < n2; i++) A2.set([fr() * 110, fr(), fr() * 130, fr()], i * 4);
      const geo2 = new THREE.InstancedBufferGeometry(); geo2.setAttribute('position', geo.getAttribute('position')); geo2.setIndex([0, 1, 2, 1, 3, 2]);
      geo2.setAttribute('aW', new THREE.InstancedBufferAttribute(A2, 4)); geo2.instanceCount = n2;
      const mist = new THREE.Mesh(geo2, mat(wispMat.vertexShader, wispMat.fragmentShader, { uIn: { value: 1 }, uMode: { value: 1 } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      mist.frustumCulled = false; mist.renderOrder = 6; scene.add(mist);
    }
    // ---- tongues on the lip: where the river pours over, puffs of mist lift a metre or three off the bend, lean out
    // over the drop, sag and tear away, so the edge is never a ruled line (they ride round the eye along the lip)
    const tongueU = { uIn: { value: 1 } };
    {
      const tr = ctx.core.makeRng(ctx.core.hashSeed('tongues:' + ctx.seed)), n = Math.round(46 * detail), A = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) A.set([(i + tr()) / n * 320, tr(), tr(), tr()], i * 4);
      const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
      geo.setAttribute('aW', new THREE.InstancedBufferAttribute(A, 4)); geo.instanceCount = n;
      const tongues = new THREE.Mesh(geo, mat(/* glsl */`
        attribute vec4 aW; uniform vec3 uCamL;
        varying vec2 vUv; varying vec3 vWp; varying float vA; varying float vSeed;
        #include <fog_pars_vertex>
        ${hero.glsl}
        void main(){
          float bx = 320.;
          float x = uCamL.x + mod(aW.x - uCamL.x + bx * 0.5, bx) - bx * 0.5;
          float edge = 1. - smoothstep(0.78, 1., abs(x - uCamL.x) / (bx * 0.5));
          float life = fract(uTime * (0.06 + 0.05 * aW.y) + aW.w);
          float z0 = lipZf(x), top = fogTop(vec2(x, z0 - 1.));
          float k = mix(0.55, 1., deepK());
          float wid = (6. + 9. * aW.z) * k, ht = (2.8 + 3.6 * fract(aW.w * 11.3)) * k;
          vec3 c = vec3(x, top - 0.9 + ht * 0.4 + 1.5 * sin(life * 3.1416) * k - 5.5 * life * life, z0 - 3. + 11. * life);
          vec2 toC = uCamL.xz - c.xz; toC /= max(length(toC), 1e-3);
          vec3 wp = c + vec3(toC.y, 0., -toC.x) * position.x * wid * (0.7 + 0.6 * life) + vec3(0., position.y * ht * (0.75 + 0.5 * life), (position.y + 0.5) * ht * 0.9);
          vA = edge * smoothstep(0., 0.22, life) * (1. - smoothstep(0.5, 1., life)) * uView.y;
          vSeed = aW.w; vUv = position.xy * 2.; vWp = wp;
          vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`, /* glsl */`
        varying vec2 vUv; varying vec3 vWp; varying float vA; varying float vSeed; uniform vec3 uCamL; uniform float uIn;
        #include <fog_pars_fragment>
        ${hero.glsl}
        void main(){
          float dist = distance(vWp, uCamL), up01 = vUv.y * 0.5 + 0.5;
          float n = texture2D(uNoise, vec2(vWp.x * 0.05 + vWp.z * 0.04 + vSeed, vWp.y * 0.1 - uTime * 0.1)).r * 0.6 + texture2D(uNoise, vec2(vWp.x * 0.16 + vWp.z * 0.12, vWp.y * 0.27 - uTime * 0.25) + vSeed).g * 0.4;
          float shp = (1. - vUv.x * vUv.x) * (1. - vUv.x * vUv.x) * smoothstep(0., 0.16, up01) * (1. - smoothstep(0.3, 1., up01));
          float a = shp * smoothstep(0.24 + 0.36 * up01, 0.56 + 0.36 * up01, n + 0.3 * shp);
          a *= vA * uIn * smoothstep(7., 22., dist) * (1. - 0.1 * uView.z);
          float lit = sunK(sunMask(vWp));
          vec3 wc = mix(uFogShade * vec3(0.82, 0.86, 1.02), uFogLit * 1.05, clamp((0.22 + 0.78 * lit) * (0.3 + 0.75 * up01 + (n - 0.5) * 0.7), 0., 1.));
          float fwd = max(dot((vWp - uCamL) / max(dist, 1e-3), uSunDir), 0.); fwd *= fwd; fwd *= fwd;
          wc += uHalo * 0.5 * fwd * fwd + uRim * 0.55 * up01 * (0.4 + 0.6 * n);
          gl_FragColor = vec4(wc, clamp(a * 1.7, 0., 0.86));
          #include <fog_fragment>
        }`, tongueU, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      tongues.frustumCulled = false; tongues.renderOrder = 5; scene.add(tongues);
    }
    await ctx.yield();
    // ---- moonlit visits: an ember of light in the mist under every umbrella (the blood of the tree, glowing): one soft
    //      additive disc per tree at its fork, slow-breathing, dimmed by the river it stands in, faded near the eye
    if (night) {
      const tl = hero.anchors.trees, fc = G.farCrowns || [], cn = G.pinTree ? G.canyon.concat([G.pinTree]) : G.canyon, n = tl.length + fc.length + cn.length, A = new Float32Array(n * 4), B = new Float32Array(n * 2), er = ctx.core.makeRng(ctx.core.hashSeed('embers:' + ctx.seed));
      for (let i = 0; i < tl.length; i++) { const t = tl[i]; A.set([t.x, RIM + (t.h || 8) * 0.6, t.z, (t.r || 4.5) * 1.7], i * 4); B.set([er() * TAU, er.range(0.55, 1) * (t.giant ? 1.5 : 1)], i * 2); }
      // (the far umbrellas along the rims and on the promontory, and the canyon's own trees: the red runs the whole flight)
      for (let j = 0, i = tl.length; j < fc.length; j++, i++) { const t = fc[j]; A.set([t.x, t.y + 6.2 * t.s, t.z, 9.5 * t.s], i * 4); B.set([(j * 2.399) % TAU, 1.5 + 0.6 * ((j * 0.618) % 1)], i * 2); }
      for (let j = 0, i = tl.length + fc.length; j < cn.length; j++, i++) { const t = cn[j]; A.set([t.x, t.y + t.h * 0.4, t.z, t.r * 1.05], i * 4); B.set([(j * 1.7) % TAU, 1.3], i * 2); }   // (the canyon's trees: a small glow round the trunk, under the crown)
      const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
      geo.setAttribute('aE', new THREE.InstancedBufferAttribute(A, 4)); geo.setAttribute('aG', new THREE.InstancedBufferAttribute(B, 2)); geo.instanceCount = n;
      const embers = new THREE.Mesh(geo, mat(/* glsl */`
        attribute vec4 aE; attribute vec2 aG;
        varying vec2 vUv; varying vec3 vWp; varying float vG;
        ${hero.glsl}
        void main(){
          vec4 mv = viewMatrix * vec4(aE.xyz, 1.);
          mv.xy += position.xy * aE.w * 2.;
          vUv = position.xy * 2.; vWp = aE.xyz; vG = aG.y * (0.8 + 0.2 * sin(uTime * 0.9 + aG.x));
          gl_Position = projectionMatrix * mv;
        }`, /* glsl */`
        varying vec2 vUv; varying vec3 vWp; varying float vG; uniform vec3 uCamL;
        ${hero.glsl}
        void main(){
          float g = max(exp(-dot(vUv, vUv) * 3.2) - 0.041, 0.);
          float dist = distance(vWp, uCamL);
          float k = g * vG * smoothstep(7., 20., dist) * (1. - smoothstep(420., 900., dist)) * (1. - 0.8 * slabFog(vWp, uCamL));
          gl_FragColor = vec4(uEmber * k * 0.26, 1.);
        }`, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      embers.frustumCulled = false; embers.renderOrder = 4.5; scene.add(embers);
      await ctx.yield();
    }

    // ---- our own body: an Egyptian vulture at 2.4 times life built round the camera. White wrists and five
    //      slotted black primaries lie at the lower corners of the frame, a tuft of nape hackles at bottom centre.
    //      aM = (side -1 | 0 | 1, flex 0..1, kind 0 arm, 1 primary, 2 hackle)
    const flap = { value: new V3(0, 0, 0) }, tallU = { value: 0 };
    const mountMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uFlap: flap, uTall: tallU },
      vertexShader: /* glsl */`
        attribute vec3 aM; uniform vec3 uFlap; uniform float uTall; uniform float uTime;
        varying vec3 vCol; varying vec3 vN; varying vec3 vWp;
        void main(){
          vec3 p = position, n = normal; float side = aM.x;
          if (abs(side) > 0.5) {
            vec3 sh = vec3(side * 0.3, -1.3, -1.25); vec3 d = p - sh;
            float ang = side * uFlap.x * (0.7 + 0.3 * aM.y), c = cos(ang), s = sin(ang);
            d.xy = vec2(c * d.x - s * d.y, s * d.x + c * d.y); n.xy = vec2(c * n.x - s * n.y, s * n.x + c * n.y);
            d.z += uFlap.y * (1.6 + 1.2 * aM.y); d.x *= 1. - 0.45 * uFlap.y; d.y -= 0.7 * uFlap.y;
            p = sh + d;
            p.y += step(0.5, aM.z) * aM.y * aM.y * (0.035 * sin(uTime * 7. + position.x * 3. + position.z * 2.) + uFlap.z * 0.2);
          } else {
            p.x += aM.y * 0.02 * sin(uTime * 9. + position.x * 40.); p.y += aM.y * 0.014 * sin(uTime * 11. + position.x * 30.) - 0.25 * uFlap.y - 0.5 * uTall; p.z += 0.12 * uTall;
          }
          vec4 wp = modelMatrix * vec4(p, 1.);
          vWp = wp.xyz; vN = mat3(modelMatrix) * n; vCol = color;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vCol; varying vec3 vN; varying vec3 vWp; uniform vec3 uCamL;
        ${hero.glsl}
        ${LIGHT}
        void main(){
          vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(N, uCamL - vWp) < 0.) N = -N;
          gl_FragColor = vec4(max(lightIt(vCol, N, vWp, 1., 0.5), vec3(0.)), 1.);
        }`,
      vertexColors: true, side: THREE.DoubleSide, fog: false,
    });
    const mount = (() => {
      const g = { p: [], n: [], c: [], m: [], i: [], nv: 0 }, mr = rng.fork ? rng.fork('mount') : rng;
      const v = (p, n, c, k, side, flex, kind) => { g.p.push(p.x, p.y, p.z); g.n.push(n.x, n.y, n.z); g.c.push(c.r * k, c.g * k, c.b * k); g.m.push(side, flex, kind); return g.nv++; };
      const white = col('#e6dfcf', 0.8), black = col('#2b2927'), cream = col('#eadfc4', 0.8), up = new V3(0, 1, 0.12).normalize(), a = new V3(), b = new V3(), c = new V3(), w = new V3(), d = new V3(), nn = new V3();
      // a feather: a rounded blade of seven vertices, darker at its base where the row above overlaps it
      const FP = [[0, -0.5], [0, 0.5], [0.45, -1], [0.45, 1], [0.84, -0.74], [0.84, 0.74], [1, 0]], e = new V3();
      const feather = (B, dir, wd, len, hw, nr, cA, kA, cB, kB, side, flex, kind, droop) => {
        const i0 = g.nv, tw = mr.range(-0.12, 0.12);
        for (const [fa, fb] of FP) {
          e.copy(B).addScaledVector(dir, len * fa).addScaledVector(wd, hw * fb).addScaledVector(nr, hw * fb * tw - droop * fa * fa);
          tc.copy(cA).lerp(cB, smoothstep(0.1, 0.7, fa));
          v(e, nr, tc, lerp(kA, kB, smoothstep(0, 0.8, fa)) * (1 - 0.16 * Math.abs(fb) * (1 - fa)) * (fb < 0 ? 0.93 : 1), side, flex, kind);
        }
        g.i.push(i0, i0 + 2, i0 + 1, i0 + 1, i0 + 2, i0 + 3, i0 + 2, i0 + 4, i0 + 3, i0 + 3, i0 + 4, i0 + 5, i0 + 4, i0 + 6, i0 + 5);
      };
      const grey = col('#8d8a86'), slate = col('#3a383b'), A = new V3(), C = new V3(), Nw = new V3(), B0 = new V3(), dd = new V3(), ww = new V3();
      for (const side of [-1, 1]) {
        // the arm rises from under the eye to the wrist at the lower corner. Its upper side is tilted to the eye and
        // shingled like the bird's: rows of white coverts over black secondaries with pale edges
        const Sh = new V3(side * 0.5, -1.3, -1.25), Wr = new V3(side * 1.72, -0.97, -2.22);
        A.subVectors(Wr, Sh).normalize(); C.set(0, -0.52, 0.86); C.addScaledVector(A, -C.dot(A)).normalize();
        Nw.crossVectors(A, C); if (Nw.y < 0) Nw.negate(); Nw.normalize();
        // rows from the trailing edge up, so that each row lies over the one behind it: [chord, length, half width, count, colour]
        const ROWS = [[0.56, 0.62, 0.088, 9, 2], [0.36, 0.4, 0.082, 10, 1], [0.2, 0.3, 0.07, 11, 0], [0.07, 0.24, 0.06, 12, 0], [-0.04, 0.19, 0.05, 13, 0]];
        ROWS.forEach(([cc, len, hw, n, kindC], ri) => {
          for (let k = 0; k < n; k++) {
            const t = lerp(0.3, 1.03, (k + (ri % 2 ? 0.5 : 0) + mr.range(-0.12, 0.12)) / (n - 0.5)), taper = lerp(1.1, 0.8, t);
            B0.lerpVectors(Sh, Wr, t).addScaledVector(C, cc * taper).addScaledVector(Nw, 0.012 * ri + 0.006 * (k % 2));
            dd.copy(C).addScaledVector(A, 0.12 + 0.5 * t * t).addScaledVector(Nw, -0.04).normalize(); ww.crossVectors(Nw, dd).normalize();
            const kk = mr.range(0.9, 1.06);
            if (kindC === 2) feather(B0, dd, ww, len * taper * mr.range(0.92, 1.06), hw, Nw, slate, 1.5 * kk, black, 1.0 * kk, side, t * 0.5, 0, 0.05);
            else if (kindC === 1) feather(B0, dd, ww, len * taper * mr.range(0.92, 1.06), hw, Nw, grey, 0.9 * kk, white, 1.0 * kk, side, t * 0.5, 0, 0.03);
            else feather(B0, dd, ww, len * taper * mr.range(0.9, 1.1), hw, Nw, cream, 0.74 * kk, white, 1.04 * kk, side, t * 0.5, 0, 0.02);
          }
        });
        // five slotted primaries fan outward from the wrist, nearly level, so they read as slim dark slats
        const Wp = new V3(side * 1.76, -0.95, -2.27), TS = [0, 0.25, 0.5, 0.7, 0.85, 0.95, 1];
        for (let f = 0; f < 5; f++) {
          const phi = (52 - 13 * f) * Math.PI / 180, len = 1.3 - 0.07 * Math.abs(f - 1);
          d.set(side * Math.cos(phi), 0.02, -Math.sin(phi)).normalize();
          w.set(side * Math.sin(phi), 0.3, Math.cos(phi)).normalize(); nn.crossVectors(d, w); if (nn.y < 0) nn.negate();
          const st = []; a.copy(Wp).addScaledVector(w, (f - 2) * -0.05);
          for (let s = 0; s < TS.length; s++) { const t = TS[s], hw = 0.075 * Math.sqrt(Math.max(1 - Math.pow(t, 6), 0.03)); c.copy(a).addScaledVector(d, len * t); c.y += 0.12 * t * t;
            st.push(v(b.copy(c).addScaledVector(w, hw), nn, black, 2.6 - 0.7 * t, side, 0.5 + 0.5 * t, 1), v(b.copy(c).addScaledVector(w, -hw), nn, black, 0.95, side, 0.5 + 0.5 * t, 1)); }
          for (let s = 0; s < TS.length - 1; s++) g.i.push(st[s * 2], st[s * 2 + 2], st[s * 2 + 1], st[s * 2 + 1], st[s * 2 + 2], st[s * 2 + 3]);
          // a white primary covert over the root of each
          a.addScaledVector(d, -0.05).addScaledVector(nn, 0.02);
          feather(a, d, w, 0.36 + 0.03 * f, 0.07, nn, cream, 0.78, white, 1.03, side, 0.5, 0, 0.0);
        }
      }
      for (let i = 0; i < 17; i++) {
        const x = (i / 16 - 0.5) * 0.56 + mr.range(-0.012, 0.012), len = mr.range(0.36, 0.52) * (1 - 0.5 * Math.abs(x) / 0.28);
        a.set(x, -0.8 - 0.25 * Math.abs(x), -0.86); d.set(x * 0.55, mr.range(0.2, 0.32), -1).normalize(); w.set(1, mr.range(-0.2, 0.2), 0).normalize(); nn.crossVectors(w, d); if (nn.y < 0) nn.negate();
        const k = mr.range(0.82, 1.05);
        const i0 = v(a, nn, cream, 0.55 * k, 0, 0, 2), i1 = v(b.copy(a).addScaledVector(d, len * 0.5).addScaledVector(w, 0.03), nn, cream, 0.8 * k, 0, 0.5, 2), i2 = v(b.copy(a).addScaledVector(d, len * 0.5).addScaledVector(w, -0.03), nn, cream, 0.75 * k, 0, 0.5, 2), i3 = v(b.copy(a).addScaledVector(d, len), nn, cream, k, 0, 1, 2);
        g.i.push(i0, i1, i3, i0, i3, i2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.n, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(g.c, 3)); geo.setAttribute('aM', new THREE.Float32BufferAttribute(g.m, 3)); geo.setIndex(g.i);
      const m = new THREE.Mesh(geo, mountMat); m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = 8; m.visible = false; scene.add(m);
      return m;
    })();
    // our shadow, riding the fog top (or the canyon floor) down-sun of the eye
    const shadowMat = new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0 }, uSoft: { value: 0.2 }, uCol: { value: col(H.cap[1], 0.5) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: /* glsl */`varying vec2 vUv; uniform float uA, uSoft; uniform vec3 uCol;
        void main(){ vec2 q = vUv; float body = length(q * vec2(5., 1.5)); float wing = length(vec2(q.x * 1.05, (q.y - 0.12 + 0.25 * q.x * q.x) * 5.5));
          float a = max(1. - smoothstep(1. - uSoft, 1. + uSoft, body), 1. - smoothstep(1. - uSoft, 1. + uSoft, wing));
          gl_FragColor = vec4(uCol, clamp(a * uA, 0., 1.)); }`,
      transparent: true, depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2).rotateX(-Math.PI / 2), shadowMat); shadow.renderOrder = 4; shadow.frustumCulled = false; scene.add(shadow);
    await ctx.yield();
    // the shadows of the birds that fly the canyon with us (the two escorts and the vultures that soar over its floor),
    // sliding over the lit floor: one instanced draw; aA = (opacity, softness) per bird, set every frame
    const NBS = 2 + NTH, bsA = new THREE.InstancedBufferAttribute(new Float32Array(NBS * 2), 2); bsA.setUsage(THREE.DynamicDrawUsage);
    const birdShadows = (() => {
      const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); geo.setAttribute('aA', bsA);
      const m = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({
        uniforms: { uCol: { value: new THREE.Color(0.1, 0.115, 0.2) } },   // (what is left of the floor's light in a shadow: a share of the sky's blue; the floor is several times brighter than white, so this still shows as a mid violet)
        vertexShader: /* glsl */`
          attribute vec2 aA; varying vec2 vUv; varying vec2 vA;
          void main(){ vUv = uv * 2. - 1.; vA = aA; gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying vec2 vA; uniform vec3 uCol;
          void main(){ vec2 q = vUv; float body = length(q * vec2(5., 1.5)); float wing = length(vec2(q.x * 1.05, (q.y - 0.12 + 0.25 * q.x * q.x) * 3.3));
            float a = max(1. - smoothstep(1. - vA.y, 1. + vA.y, body), 1. - smoothstep(1. - vA.y, 1. + vA.y, wing));
            gl_FragColor = vec4(mix(vec3(1.), uCol, clamp(a * vA.x, 0., 1.)), 1.);
          }`,
        // (the shadow multiplies what is under it: the floor is far brighter than white, and a dark veil over it stayed pale)
        transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      }), NBS);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.renderOrder = 4; m.name = 'birdShadows'; scene.add(m);
      return m;
    })();
    // where the soaring vultures turn once we are in the canyon: each circles 14 to 24 m over the floor, up-sun of a
    // spot on the floor, so that its shadow circles that spot, and never within 9 m of our own line (none by night:
    // the vultures roost)
    const SOAR = [];
    if (!night) {
      const sr = ctx.core.makeRng(ctx.core.hashSeed('soar:' + ctx.seed)), sunH = Math.hypot(sunDir.x, sunDir.z) || 1, hMax = Math.min(24, 62 * sunDir.y / sunH);
      const line = [], sp0 = new V3(), sp1 = new V3(); for (let k = 0; k <= 40; k++) line.push(path.pointAt(lerp(uFace + 0.03, 0.99, k / 40), new V3()));
      for (let i = 0; i < NTH; i++) {
        let S = null;
        for (let t = 0; t < 12 && !S; t++) {
          // (the spot its shadow circles lies on the floor under our own line through the pull-out, a few metres to one
          //  side: we fly over each shadow in turn, and the bird itself wheels 25 to 40 m off on the sun's side)
          const hgt = hMax * sr.range(0.6, 1), ui = lerp(uStoopEnd - 0.09, 0.955, (i + sr.range(0.2, 0.8)) / NTH), r = sr.range(7, 11), lat = sr.range(3, 11) * (sr() < 0.7 ? 1 : -1);
          path.pointAt(ui, sp0); path.tangentAt(ui, sp1); const hy = Math.hypot(sp1.x, sp1.z) || 1, fx = sp0.x - sp1.z / hy * lat, fz = sp0.z + sp1.x / hy * lat;
          const bx0 = fx + sunDir.x / Math.max(sunDir.y, 0.12) * hgt, bz0 = fz + sunDir.z / Math.max(sunDir.y, 0.12) * hgt;
          let ok = hgt > 5.5;
          for (let k = 0; k < 8 && ok; k++) { const a = k / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a); if (landH(bx0 + ca * (r + 5), bz0 + sa * (r + 5) * 1.25) > hgt - 4.5 || landH(fx + ca * r, fz + sa * r * 1.25) > 2.3) ok = false; }
          for (const c of line) { if (!ok) break; const dx = c.x - bx0, dz = (c.z - bz0) / 1.25, d = Math.hypot(dx, dz) - r; if (Math.hypot(d, c.y - hgt) < 9) ok = false; }
          if (ok) S = { cx: bx0, cz: bz0, h: hgt, r, w: (sr() < 0.5 ? -1 : 1) * sr.range(0.4, 0.56), a0: sr() * TAU };
        }
        SOAR.push(S);
      }
    }
    await ctx.yield();
    // ---- the tails of the fall: streamers torn off the falling cloud drift on south down the canyon, 40 to 70 m over
    //      its floor on the west side, drawn out and eaten away as they sink (theirs is the shade that slides over the
    //      floor). Soft ribbons turned to the eye: thick at the middle, frayed to threads, gone within a dozen seconds
    {
      const tr = ctx.core.makeRng(ctx.core.hashSeed('tails:' + ctx.seed)), TA = [], TV = [], want = Math.round(18 * (0.6 + 0.4 * detail));
      for (let i = 0; i < 900 && TA.length < want * 4; i++) {
        const z = tr.range(zp - 250, zp - 26), x = PXW - tr.range(12, 82), y = tr.range(40, 72), sd = tr();
        if (landH(x, z - 30) > y + 2 || landH(x, z) > y - 9 || landH(x - 9, z + 12) > y - 12 || landH(x + 3, z + 33) > y - 22) continue;   // clear of the wall along its whole drift
        TA.push(x, y, z, sd); TV.push(tr.range(26, 44), tr.range(5, 9.5), tr.range(9, 15), tr());
      }
      const n = TA.length / 4, geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); geo.setIndex([0, 1, 2, 1, 3, 2]);
      geo.setAttribute('aT', new THREE.InstancedBufferAttribute(new Float32Array(TA), 4)); geo.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(TV), 4)); geo.instanceCount = n;
      const tails = new THREE.Mesh(geo, mat(/* glsl */`
        attribute vec4 aT; attribute vec4 aV; uniform vec3 uCamL;
        varying vec2 vUv; varying vec3 vWp; varying vec3 vL;
        #include <fog_pars_vertex>
        ${hero.glsl}
        void main(){
          float life = fract(uTime / aV.z + aV.w);
          vec3 dir = normalize(vec3(0.14 * sin(aT.w * 40.), -0.5, 1.));
          vec3 c = aT.xyz + dir * (life - 0.5) * 34.;
          vec3 toC = uCamL - c; toC /= max(length(toC), 1e-3);
          vec3 sd = cross(dir, toC); sd /= max(length(sd), 1e-3);
          vec3 wp = c + dir * position.y * aV.x * (0.7 + 0.5 * life) + sd * position.x * aV.y * (0.7 + 0.8 * life);
          vUv = position.xy * 2.; vWp = wp; vL = vec3(life, aT.w, dot(sd, uSunDir));
          vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`, /* glsl */`
        varying vec2 vUv; varying vec3 vWp; varying vec3 vL; uniform vec3 uCamL;
        #include <fog_pars_fragment>
        ${hero.glsl}
        void main(){
          float life = vL.x, dist = distance(vWp, uCamL), along = vUv.y * 0.5 + 0.5;
          vec2 nq = vec2(vUv.x * 0.8 + vL.y * 7., vUv.y * 0.3 - uTime * 0.04 + vL.y * 3.);
          float n = texture2D(uNoise, nq * 0.5).r * 0.6 + texture2D(uNoise, nq * vec2(1.9, 0.8) + 0.37).g * 0.4;
          float shp = 1. - vUv.x * vUv.x; shp *= shp * smoothstep(0., 0.3, along) * (1. - smoothstep(0.5, 1., along));
          float er = mix(0.2, 0.6, life);                                    // it is eaten away as it ages
          float a = shp * smoothstep(er, er + 0.3, n + 0.4 * shp) * smoothstep(0., 0.14, life) * (1. - smoothstep(0.62, 1., life));
          a *= smoothstep(20., 52., dist) * (1. - smoothstep(520., 900., dist));
          float side = vL.z > 0. ? 1. : -1.;
          float lit = clamp(0.56 + 0.4 * vUv.x * side + (n - 0.5) * 0.9, 0., 1.);
          float lowS = (1. - smoothstep(0.36, 0.48, uSunDir.y)) * (1. - uView.z);
          vec3 shC = mix(uFogShade * vec3(0.8, 0.88, 1.08), uFogLit * mix(vec3(1.), vec3(1.1, 0.94, 0.98), lowS), mix(0.12, 0.4, max(lowS, uView.z)));
          float fwd = max(dot((vWp - uCamL) / max(dist, 1e-3), uSunDir), 0.); fwd *= fwd; fwd *= fwd;
          vec3 wc = mix(shC, uFogLit * 1.03, lit) + uRim * 0.8 * lit * lit + uHalo * 0.4 * fwd * fwd;
          gl_FragColor = vec4(max(wc, vec3(0.)), clamp(a * 0.9, 0., 0.82));
          #include <fog_fragment>
        }`, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      tails.frustumCulled = false; tails.renderOrder = 5; scene.add(tails); G.tails = n;
    }
    await ctx.yield();

    // ---- an apron of pavement round the entry corner of the hero's block: the land mesh steps down there, and
    //      the camera that draws this world inside a far-off portal stands some 60 m behind the entry
    {
      const g = mk(), pc = col('#5c5852'), y = RIM - 0.06, x0 = 100, x1 = 428, x2 = 640, zb = hero.zBack, z0 = zb - 130, z1 = L.z(430) - 45;   // the hero's block ends at x = 430 in its own space, not cx + 430
      const quad = (xa, za, xb, zc) => { const a = vx(g, xa, y, za, 0, 1, 0, pc, 1, 0, 0), b = vx(g, xb, y, za, 0, 1, 0, pc, 1, 0, 0), c = vx(g, xa, y, zc, 0, 1, 0, pc, 1, 0, 0), d = vx(g, xb, y, zc, 0, 1, 0, pc, 1, 0, 0); g.i.push(a, c, b, b, c, d); };
      quad(x0, z0, x2, zb + 1.5); quad(x1, zb + 1.5, x2, z1);
      scene.add(new THREE.Mesh(fin(g, false), propMat));
    }

    // ---- gaze, pace, per-frame life
    const fallAim = W(-70 + E, 6, -72), groveAim = G.WL(-40, 22, 3), perchAim = G.perch.clone().setY(G.perch.y + 0.46 * STAND_S), bayAim = W(60 + E, 100, -30), pinAim = new V3(), aheadQ = new V3();
    const scar = hero.anchors.resinTrunk ? hero.anchors.resinTrunk.position.clone() : G.WL(-42, 61.5, 5.3);
    const resinAim = new V3(), aheadP = new V3(), sweepAim = new V3(), climbAim = new V3(), wallAim = W(-215 + E, 148, -52), poolAim = W(PX + 4, 366, -296), stoopAim = W(PX, 900, -185);
    // the gaze rests just beyond the scar, so the trunk stands right of centre
    const scarAim = scar.clone(); if (hero.anchors.resinTrunk) { const o = scar.clone().sub(hero.anchors.resinTrunk.viewFrom).setY(0).normalize(); scarAim.addScaledVector(o, 3.2); }
    // the stoop's gaze is one slow pan, given as a heading and a pitch along the path: off the fall (north), left across
    // the bay's west wall with the cloud pouring down it (face-on from a hundred metres and more), and on round to the
    // canyon, where it rests on the floor, the stream and the ring in the pinch while the wall slides by on the right
    const stoopAt = new V3(), stoopDir = new V3();
    const stoopGaze = (t, u) => {
      path.pointAt(clamp(u, 0, 1), stoopAt);
      const k1 = smoothstep(uFace - 0.04, uFace + 0.035, u), k2 = smoothstep(uFace + 0.035, uFace + 0.13, u);
      const az = lerp(lerp(365, 200, k1), 188, k2) * Math.PI / 180, pt = lerp(lerp(-9, -20, k1), -15, k2) * Math.PI / 180;
      return stoopAt.add(stoopDir.set(Math.sin(az) * Math.cos(pt), Math.sin(pt), -Math.cos(az) * Math.cos(pt)).multiplyScalar(300));
    };
    const moonAim = G.moonTree ? new V3(G.moonTree.x - 3.5, RIM + 8.5, G.moonTree.z - 4.9) : new V3();
    const bayAimU = night ? W(-125 + E, 230, -70) : bayAim, perchAimU = perchAim.clone();
    if (night) { const from = path.pointAt(uPin - 0.022, new V3()), v = perchAim.clone().sub(from).setY(0), d = v.length(); v.normalize(); perchAimU.addScaledVector(new V3(-v.z, 0, v.x), d * 0.48).y -= d * 0.07; }
    const pois = [
      // the climb out of the fog: the gaze tips down onto the river ahead, so the sun break's edge and the crowns'
      // shadows fill the middle of the frame and the cap cloud only its top third
      { at: (t, u) => { path.pointAt(Math.min(u + 90 / PL, 1), climbAim); climbAim.y = RIM - 8; return climbAim; }, from: uApex - 0.1, to: uApex + 0.045, weight: 0.75, fade: 0.3 },
      // the scarred trunk: held until it is abeam, then the gaze slides back down the route
      { at: (t, u) => { path.pointAt(Math.min(u + 34 / PL, 1), aheadP); return resinAim.copy(scarAim).lerp(aheadP, smoothstep(uResin + 0.001, uResin + 0.018, u)); }, from: uResin - 0.075, to: uResin + 0.03, weight: 0.74, fade: 0.3 },
      // over the lip the gaze rests on the bay just left of the pinnacle, so it stands right of centre; then it settles on the sunning bird
      // (by moonlight the turn to the lip is held on the great umbrella at the brink, the moon beside its crown; then
      //  the gaze drops into the canyon and its red trees, not out to the dark sea, and rests a little right of the
      //  roosting birds so that the pinnacle's glowing tree, the fall and the lit canyon are one picture)
      ...(night ? [{ at: moonAim, from: uResin + 0.004, to: uLip + 0.006, weight: 0.82, fade: 0.3 }] : []),
      { at: (t, u) => { path.pointAt(Math.min(u + 40 / PL, 1), aheadQ); return pinAim.copy(bayAimU).lerp(perchAimU, smoothstep(uLip + 0.02, uPin - 0.035, u)).lerp(aheadQ, smoothstep(uPin - 0.004, uPin + 0.022, u)); }, from: uLip - (night ? 0.03 : 0.07), to: uPin + 0.035, weight: 0.64, fade: night ? 0.3 : 0.2 },
      // the sunning vulture: the gaze stays on it until it is abeam
      { at: perchAimU, from: uPin - 0.05, to: uPin + 0.02, weight: 0.62, fade: 0.3 },
      // past the pinnacle a glance down the bay to the pools and the pinch, 300 m below
      { at: poolAim, from: uPin + 0.004, to: uPin + 0.047, weight: 0.45, fade: 0.3 },
      // the run south past the pinnacle: the gaze swings right to the bay's west wall and the cloud pouring off it,
      // then leads the turn round to the whole Fogfall (never a snap from south to north)
      { at: (t, u) => sweepAim.copy(wallAim).lerp(fallAim, smoothstep(uTurn - 0.012, uTurn + 0.045, u)), from: uPin + 0.028, to: uFace + 0.035, weight: 0.76, fade: 0.12 },
      // the stoop: the gaze leads the spiral out and down the canyon to its chain of pools, so the falling cloud keeps
      // to the right of the frame and the floor, the stream and the far pinch are the picture (looked straight down
      // along, the wall and the fall were streaks fanning out from under the eye)
      { at: stoopGaze, from: uFace - 0.05, to: uStoopEnd - 0.02, weight: 0.9, fade: 0.2 },
      { at: portalPos, from: uStoopEnd - 0.13, to: 0.99, weight: 0.56 },
    ];
    const bellU = (u, a, b, f = 0.25) => { const w = (b - a) * f; return smoothstep(a, a + w, u) * (1 - smoothstep(b - w, b, u)); };
    // linger at the scarred trunk and on the level leg that faces the Fogfall, hurry down the stoop
    const pace = (u) => 0.86 + 0.08 * smoothstep(0.1, 0.17, u) - 0.3 * bellU(u, uResin - 0.07, uResin + 0.03, 0.35) + 0.1 * bellU(u, uLip + 0.03, uTurn, 0.3) + 0.42 * bellU(u, uPin + 0.008, uTurn + 0.03, 0.3)
      - 0.3 * bellU(u, uLeg0 - 0.03, uFace + 0.012, 0.3) + 0.34 * smoothstep(uFace + 0.005, uFace + 0.07, u) * (1 - smoothstep(uStoopEnd - 0.06, uStoopEnd + 0.01, u));

    const cp = new V3(), q0 = new V3(), q1 = new V3(), tg = new V3(), rt = new V3(), fw = new V3(), upv = new V3(), bx = new V3(), by = new V3(), YUP = new V3(0, 1, 0), size = new THREE.Vector2();
    const bm = new THREE.Matrix4(), bs = new V3();
    const place = (mesh, i, pos, f, upRef, s) => {
      bx.crossVectors(upRef, f); if (bx.lengthSq() < 1e-6) bx.set(1, 0, 0); bx.normalize(); by.crossVectors(f, bx);
      bm.makeBasis(bx, by, f).scale(bs.set(s, s, s)).setPosition(pos); mesh.setMatrixAt(i, bm);
    };
    const pathFrame = (u) => { const uu = clamp(u, 0, 1); path.pointAt(uu, q0); if (u > 1) q0.addScaledVector(path.endTangent, (u - 1) * PL); path.tangentAt(uu, tg); rt.set(-tg.z, 0, tg.x); if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0); rt.normalize(); };
    // the sunning bird never leaves its perch: upright, belly to the approach and a little to the sun, wings held out
    { const sx = new V3(sunDir.x, 0, sunDir.z).normalize(), face = G.perchDir.clone().addScaledVector(sx, night ? 0 : 0.3).normalize();
      const f = new V3(0, 1, 0).addScaledVector(face, 0.1).normalize(), un = face.clone().negate();
      place(sunner, 0, q0.copy(G.perch).addScaledVector(YUP, 0.03 * STAND_S), f, un, STAND_S); sunner.instanceMatrix.needsUpdate = true;
      place(vult.mesh, NK + 4, q0.copy(G.perch), f, un, 1e-4); }
    const ZERO = 1e-4;

    // three of the kettle cross between us and the Fogfall on the level leg, close, banked so the upper wing shows:
    // [instance, progress at the reference frame, length in u, screen x from, to, screen y from, to, metres off]
    const uRef = clamp(0.6, uLeg0 - 0.008, uFace - 0.03), fwT = new V3(), upT = new V3(), rtT = new V3(), fwC = new V3(), rtC = new V3();
    const CROSS = [[NK + 3, 0.4, 0.14, -1.3, 0.7, 0.02, -0.1, 15], [NK + 2, 0.54, 0.13, 1.25, -1.25, -0.42, -0.3, 19], [NK + 5, 0.45, 0.1, 1.3, -1.3, 0.2, 0.1, 13]];
    const breakAt0 = G.at(128, 0, 0), uSee = uApex - 0.037, breakA = path.pointAt(uSee, new V3()), BRX = 125, BRZ = 80;
    { const d = path.pointAt(Math.min(uSee + 90 / PL, 1), new V3()).sub(breakA).setY(0).normalize();
      breakA.addScaledVector(d, 56 + 0.96 / Math.sqrt((d.x / BRX) * (d.x / BRX) + (d.z / BRZ) * (d.z / BRZ))); }
    // five of the kettle turn in a thermal beside the run south from the pinnacle, at our own height, between us and
    // the west wall: [radius, angle at u46, height]. Their turn is keyed to u so the nearest two are 18 to 22 m off at u46
    const u46 = uPin + 0.017, thC = new V3(), thE1 = new V3(), thE2 = new V3();
    { path.pointAt(u46, thC); path.tangentAt(u46, tg); tg.setY(0).normalize(); thE2.copy(tg).negate(); thE1.set(tg.z, 0, -tg.x); thC.addScaledVector(tg, 22).addScaledVector(thE1, -13); }
    const THERM = [[7.5, 1.04, -1.0], [7, 0.2, 2.0], [5, 1.7, 3.5], [7.5, 3.6, -3.0], [6, 5.2, 0.5]];

    const update = (dt, time, camera, u) => {
      camera.getWorldPosition(cp);
      rtT.setFromMatrixColumn(camera.matrixWorld, 0); upT.setFromMatrixColumn(camera.matrixWorld, 1); fwT.setFromMatrixColumn(camera.matrixWorld, 2).negate();
      fwC.copy(fwT).setY(0); if (fwC.lengthSq() < 1e-6) fwC.set(0, 0, -1); fwC.normalize(); rtC.set(-fwC.z, 0, fwC.x);
      let aspect = 16 / 9;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); viewH.value = size.y; aspect = size.x / Math.max(size.y, 1); }
      tallU.value = smoothstep(1.25, 0.8, aspect);                       // a phone held upright: the nape hackles sink out of the way
      // inside the fog the near field is clear and the pearl closes in by 60 to 80 m; above it the fog is a surface
      const north = L.z(cp.x) - cp.z, top = fogTopAt(cp.x, cp.z), above = thinW ? 1 : north > -3 ? smoothstep(-1.2, 2.6, cp.y - top) : 1;
      U.uFogP.value.w = fogInside * Math.pow(fogAbove / fogInside, above);
      U.uView.value.set(thinW ? 0 : lerp(34, 16, smoothstep(0.01, 0.09, u)) * (1 - above), above, softK, capLift);
      // by day, over the grove, a lull in the river travels just ahead of the eye: within thirty metres the mist is half
      // see-through and the pavement, the tussocks and the trunks' feet ghost through it; it settles on the scarred trunk
      if (G.lull && !night) { const k = smoothstep(0.15, 0.185, u) * (1 - smoothstep(uResin - 0.05, uResin - 0.018, u));
        U.uHole.value.set(lerp(G.lull.x, cp.x + fwC.x * 17, k), lerp(G.lull.z, cp.z + fwC.z * 17, k), lerp(1 / 42, 1 / 560, k), lerp(0.7, 0.66, k)); }
      U.uDive.value = smoothstep(uFace + 0.008, uFace + 0.04, u);        // in the stoop the fall beside us is drawn as billows, not folds
      wispU.uIn.value = lerp(1, lerp(0.5, 1, bellU(u, uApex - 0.09, uLip + 0.085, 0.12)), above) * lerp(0.5, lerp(0.85, 1, smoothstep(0.1, 0.14, u)), smoothstep(0.004, 0.07, u));
      // the sun break: at the entry it lies just behind the umbrella on the axis, then slides over the grove as we
      // climb out of the fog, then on over the lip
      //      (from the climb it lies ahead over the rim grove, its edge crossing the middle distance; we fly into it by the starlings)
      { const k = smoothstep(0.03, 0.11, u), k2 = smoothstep(uApex + 0.005, uResin - 0.02, u);
        hero.setSunBreak(lerp(breakAt0.x, lerp(breakA.x, cx - 40, k2), k), lerp(breakAt0.z, lerp(breakA.z, zl - 56, k2), k) + 70 * smoothstep(0.33, 0.5, u) + 6 * Math.sin(time * 0.2), lerp(80, lerp(BRX, 165, k2), k), lerp(36, lerp(BRZ, 104, k2), k)); }
      if (rare) hero.setSupply(1 - 0.6 * smoothstep(uFace - 0.012, uStoopEnd, u) - 0.15 * smoothstep(uStoopEnd, 1, u));   // the tablecloth: the supply fails as we leave the level leg, and we out-stoop the last curtain
      hero.update(dt, time, camera);

      // our wings: four beats on the climb, a glide through the grove, folded in the stoop, two beats at the pull-out
      // (the wings open as the pull-out begins, with braking beats that shiver: they are back in the frame's corners over the canyon floor)
      const e1 = bellU(u, uApex - 0.08, uApex + 0.004, 0.2), e2 = bellU(u, uStoopEnd - 0.075, uStoopEnd + 0.035, 0.25);
      const fold = smoothstep(uFace + 0.004, uFace + 0.04, u) * (1 - smoothstep(uStoopEnd - 0.092, uStoopEnd - 0.042, u));
      const beat = e1 * 0.42 * Math.sin((u - (uApex - 0.08)) / 0.084 * 4 * TAU) + e2 * 0.36 * Math.sin((u - uStoopEnd + 0.075) / 0.11 * 2 * TAU);
      flap.value.set(beat + 0.025 * Math.sin(time * 1.1) + 0.012 * Math.sin(time * 2.7) + 0.05 * e2 * Math.sin(time * 4.4), fold, beat * 0.6);
      mount.visible = u > 0.0015; mount.matrix.copy(camera.matrixWorld);
      // (the finely modelled canyon floor cannot be seen from the plateau: it is drawn only once the lip is near)
      if (G.fineMeshes) for (const fm of G.fineMeshes) fm.visible = u > 0.3;
      for (const cm of G.canyonMeshes) cm.visible = u > uLip - 0.012;
      // our shadow
      //      (over the plateau it rides the fog top under us; in the canyon it lies on the floor wherever the sun throws it,
      //       from as high as 130 m up, and is dropped where that is a wall)
      { const sy = Math.max(sunDir.y, 0.15); let yT = top + 0.3, hgt = cp.y - yT, t = hgt / sy, ok = hgt > 1 && hgt < 60 && u > 0.0015, uA = 0;
        if (north > 0) { if (ok) uA = 0.42 * (1 - smoothstep(25, 60, hgt)) * above * (1 - fold); }
        else {
          hgt = cp.y - 0.5; t = hgt / sy; ok = hgt > 1 && cp.y < 135 && u > 0.0015;
          if (ok) { const lh = landH(cp.x - sunDir.x * t, cp.z - sunDir.z * t); if (lh < 2.5) { yT = Math.max(lh, WL0) + 0.2; uA = 0.42 * (1 - 0.45 * smoothstep(25, 120, hgt)) * (1 - 0.5 * fold); } }
        }
        shadowMat.uniforms.uA.value = uA;
        shadowMat.uniforms.uSoft.value = 0.12 + 0.012 * Math.min(Math.max(hgt, 0), north > 0 ? 1e3 : 24);
        pathFrame(u); shadow.position.set(cp.x - sunDir.x * t, yT, cp.z - sunDir.z * t); shadow.rotation.y = Math.atan2(tg.x, tg.z); }
      // a bird's shadow on the canyon floor: instance k of the shadow draw, from the bird's place and heading
      const sunY = Math.max(sunDir.y, 0.12), inCanyon = north < -20 && !night;
      const birdShadow = (k, pos, head, size) => {
        let a = 0; const hgt = pos.y - 0.5, t = hgt / sunY, sx = pos.x - sunDir.x * t, sz = pos.z - sunDir.z * t; let y = 0;
        if (inCanyon && size > 0.01 && hgt > 0.5 && hgt < 140) {
          // (it lies level, just over the highest ground under it: the floor rolls by a hand's breadth and dips at the stream)
          const lh = landH(sx, sz), e = size * 0.36;
          if (lh < 2.5) { y = Math.max(lh, landH(sx + e, sz), landH(sx - e, sz), landH(sx, sz + e), landH(sx, sz - e), WL0) + 0.42; a = y < 3.4 ? 1 - 0.4 * smoothstep(30, 130, hgt) : 0; }
        }
        eu.set(0, Math.atan2(-head.x, -head.z), 0); qt.setFromEuler(eu); m4.compose(pv.set(sx, y, sz), qt, sv.set(size, 1, size)); birdShadows.setMatrixAt(k, m4);
        bsA.setXY(k, a, 0.1 + 0.006 * Math.min(hgt, 24));
      };

      // vultures: the kettle circling the pinnacle
      const vm = vult.mesh;
      for (let i = 0; i < NK; i++) {
        const k = kettle[i];
        if (night) { const a = k.a, rr = 3 + (i % 5) * 1.1; fw.set(Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3).normalize(); upv.set(-Math.cos(a), 0.3, -Math.sin(a)).normalize();
          place(vm, i, q1.set(pinTop.x + Math.cos(a) * rr, pin.top + 1.0 + (i % 3) * 0.2, pinTop.z + Math.sin(a) * rr), fw, upv, i < 9 ? VS_SCALE : ZERO); vult.aB.setW(i, 1); continue; }
        const a = k.a + time * k.sp / k.r, sg = Math.sign(k.sp), ca = Math.cos(a), sa = Math.sin(a);
        q1.set(pin.x + ca * k.r, k.y + 5 * Math.sin(time * 0.13 + k.ph), pin.z + sa * k.r);
        fw.set(-sa * sg, 0.04 * Math.cos(time * 0.13 + k.ph), ca * sg).normalize(); upv.set(-ca * 0.34, 1, -sa * 0.34).normalize();
        place(vm, i, q1, fw, upv, VS_SCALE);
      }
      // two escorts join on the left before the lip and stay with us to the pools, banked so that the white
      // upper wing and its black flight feathers face us
      //      (through the stoop the first holds low on the left and the second higher and further in, never one behind the
      //       other; as the pull-out begins both open their wings, climb a little in our view to stand pale against the
      //       spur's shaded face, and row with slow beats until they peel away before the portal)
      const join = smoothstep(uLip - 0.105, uLip - 0.04, u), leave = smoothstep(0.9, 0.975, u), hold = bellU(u, uFace + 0.012, 0.955, 0.17);
      const pull = smoothstep(uStoopEnd - 0.135, uStoopEnd - 0.098, u), escB = bellU(u, uStoopEnd - 0.14, uStoopEnd + 0.04, 0.2), axs = clamp(aspect, 0.56, 1.78) / 1.78;
      for (let j = 0; j < 2; j++) {
        const show = j === 0 ? bellU(u, uLip - 0.062, uLip + 0.072, 0.25) : bellU(u, uPin - 0.004, uPin + 0.05, 0.3), psi = 1.05 * show;      // over the lip the near escort slews across our bow, back toward us
        pathFrame(u + (11 + j * 14) / PL); fw.copy(tg).multiplyScalar(Math.cos(psi)).addScaledVector(rt, Math.sin(psi)); fw.y *= 1 - 0.6 * fold; fw.normalize();
        const side = 6.5 + j * 6 + (1 - join) * 46 + leave * 30 + (j === 0 ? 3.5 * (1 - smoothstep(uLip - 0.03, uLip + 0.045, u)) : 0), lift = -1.2 - j * 2.3 + (1 - join) * 20 + leave * 15;
        q1.copy(q0).addScaledVector(rt, -side - 0.8 * Math.sin(time * 0.6 + j * 2)).addScaledVector(YUP, lift + 0.5 * Math.sin(time * 0.47 + j)).addScaledVector(tg, -(1 - join) * 34);
        path.tangentAt(clamp(u + (40 + j * 11) / PL, 0, 1), q0); const turn = tg.z * q0.x - tg.x * q0.z;
        if (show > 0) { q0.copy(cp).addScaledVector(fwC, 12 + j * 9).addScaledVector(rtC, -5.5 - j * 2.5).addScaledVector(YUP, -1.3 - j); q1.lerp(q0, show); }   // held in our view, not on the path's line
        upv.copy(YUP).multiplyScalar(0.8).addScaledVector(rt, 0.5 + clamp(turn * 1.2, -0.25, 0.25) + 0.06 * Math.sin(time * 0.5 + j * 1.7)).normalize();
        if (show > 0) { q0.copy(cp).sub(q1).setY(0).normalize(); upv.lerp(bx.copy(YUP).multiplyScalar(0.62).addScaledVector(q0, 0.78), show).normalize(); }
        // through the stoop they hold station in our own view, low on the left, pale against the shaded side of the canyon
        if (hold > 0) {
          const fd = j ? lerp(21, 18, pull) : lerp(13, 12.5, pull), rg = (j ? lerp(-14.5, -5.6, pull) : lerp(-5.7, -6.9, pull)) * axs, uu = j ? lerp(4.6, 6.4, pull) : lerp(-2.0, 3.6, pull);   // (before the pull-out the second flies a wingspan further left and higher, smaller in our view: two birds, never one tangled shape)
          by.copy(cp).addScaledVector(fwT, fd).addScaledVector(rtT, rg + 0.5 * Math.sin(time * 0.6 + j * 2)).addScaledVector(upT, uu + (0.35 + 0.3 * pull) * Math.sin(time * 0.47 + j)); q1.lerp(by, hold);
        }
        // (in the pull-out they bank away from us, toward the sun: we see the whole underside, white with black
        //  flight feathers, lit from beneath by the floor)
        if (pull > 0) upv.lerp(bx.copy(YUP).multiplyScalar(0.62).addScaledVector(rtT, -0.74 + 0.1 * Math.sin(time * 0.5 + j * 1.7)), pull * hold).normalize();
        const es = VS_SCALE * (1 + 0.22 * j * hold * pull);
        place(vm, NK + j, q1, fw, upv, es); vult.aB.setY(NK + j, 0.03 + 0.38 * Math.max(e2, escB) + 0.3 * (1 - join)); vult.aB.setW(NK + j, fold * 0.5 * (1 - pull));   // (the escorts fly by night too: pale birds low over the silver river)
        birdShadow(j, q1, fw, 4.4 * es / VS_SCALE);
      }
      for (const [idx, s0, du, x0, x1, y0, y1, dd] of CROSS) {
        const sc = s0 + (u - uRef) / du, dir = Math.sign(x1 - x0), xs = dd * 0.6 * clamp(aspect, 0.56, 1.78), wob = time * 0.5 + idx;
        q1.copy(cp).addScaledVector(fwT, dd).addScaledVector(rtT, lerp(x0, x1, sc) * xs).addScaledVector(upT, lerp(y0, y1, sc) * dd * 0.6 + 0.4 * Math.sin(wob));
        fw.copy(rtC).multiplyScalar(dir * 0.8).addScaledVector(fwC, -0.42).normalize();
        upv.copy(YUP).multiplyScalar(0.8).addScaledVector(fwC, -0.5).addScaledVector(rtC, dir * 0.1 * Math.sin(wob * 1.3)).normalize();
        place(vm, idx, q1, fw, upv, sc > 0 && sc < 1 && !night ? VS_SCALE : ZERO);
      }
      for (let i = 0; i < NTH; i++) {
        const r = THERM[i][0], th = THERM[i][1] + 26 * (u - u46) + 0.25 * Math.sin(time * 0.23 + i * 1.7), ct = Math.cos(th), st = Math.sin(th);
        q1.copy(thC).addScaledVector(thE1, ct * r).addScaledVector(thE2, st * r); q1.y += THERM[i][2] + 0.6 * Math.sin(time * 0.31 + i);
        fw.copy(thE1).multiplyScalar(-st).addScaledVector(thE2, ct);
        upv.copy(YUP).multiplyScalar(0.77).addScaledVector(thE1, -ct * 0.64).addScaledVector(thE2, -st * 0.64);
        const S = SOAR[i], soarK = S ? smoothstep(uFace + 0.036, uFace + 0.052, u) : 0, thK = 1 - smoothstep(uFace + 0.02, uFace + 0.034, u);
        if (soarK > 0) {
          // once we are in the stoop the five turn low over the canyon floor instead, each up-sun of the stream, so
          // that its shadow circles on the lit floor beside the water
          const a = S.a0 + time * S.w, ca = Math.cos(a), sa = Math.sin(a), sg = Math.sign(S.w);
          q1.set(S.cx + ca * S.r, S.h + 1.2 * Math.sin(time * 0.31 + i * 1.9), S.cz + sa * S.r * 1.25);
          fw.set(-sa * sg, 0.03 * Math.cos(time * 0.31 + i * 1.9), ca * 1.25 * sg).normalize(); upv.set(-ca * 0.36, 1, -sa * 0.36).normalize();
          place(vm, NK + 6 + i, q1, fw, upv, VS_SCALE * 1.15 * soarK); birdShadow(2 + i, q1, fw, 8 * soarK); vult.aB.setZ(NK + 6 + i, 1);   // (dark birds here: brown backs over the pale floor)
        } else { place(vm, NK + 6 + i, q1, fw, upv, night ? ZERO : Math.max(VS_SCALE * thK, ZERO)); birdShadow(2 + i, q1, fw, 0); vult.aB.setZ(NK + 6 + i, 0); }
      }
      birdShadows.instanceMatrix.needsUpdate = true; bsA.needsUpdate = true;
      vm.instanceMatrix.needsUpdate = true; vult.aB.needsUpdate = true;

      // starlings flush from the crowns as one flock and wheel away over the lip; swifts scythe along the cliff
      const sm = small.mesh, s = (u - (uFlock - 0.036)) / 0.085;
      for (let i = 0; i < NSTAR; i++) {
        const b = flock[i], si = s - b.d * 0.5;
        if (si <= 0 || si > 3.2) { place(sm, i, q1.set(b.sx, b.sy, b.sz), fw.set(0, 0, 1), YUP, ZERO); continue; }   // (by night they are bats, black across the moonlit river)
        const ub = u - b.d * 0.012, c = clamp(si, 0, 1), ex = Math.max(si - 1, 0), wob = time * 1.7 + b.ph;
        pathFrame(ub + 16 / PL);
        q1.copy(q0).addScaledVector(rt, lerp(15, -19, smoothstep(0, 1, c)) - ex * 30).addScaledVector(YUP, lerp(-2.6, 5.5, c) + ex * 12).addScaledVector(tg, ex * 26);
        const sp = 1 + 0.8 * ex;
        q1.addScaledVector(rt, (b.ox * 7 + 0.9 * Math.sin(wob)) * sp).addScaledVector(YUP, (b.oy * 2.4 + 0.6 * Math.sin(wob * 1.3)) * sp).addScaledVector(tg, (b.oz * 6 + 0.9 * Math.cos(wob)) * sp);
        const lift = smoothstep(0, 0.3, si); q1.x = lerp(b.sx, q1.x, lift); q1.y = lerp(b.sy, q1.y, lift); q1.z = lerp(b.sz, q1.z, lift);
        fw.copy(tg).multiplyScalar(0.55).addScaledVector(rt, -0.8 + 0.15 * Math.sin(wob)).addScaledVector(YUP, 0.16 + 0.1 * Math.cos(wob)).normalize();
        upv.copy(YUP).addScaledVector(rt, 0.3 * Math.sin(wob * 0.7)).normalize();
        place(sm, i, q1, fw, upv, 1.6 * smoothstep(0, 0.06, si));
      }
      // (nine of the swifts leave the cliff in the stoop and hunt over the canyon floor as a loose pack: wheeling
      //  figures of eight, 14 to 28 m ahead of us, that cross the frame from right to left through the pull-out)
      const packK = smoothstep(uStoopEnd - 0.135, uStoopEnd - 0.112, u) * (1 - smoothstep(0.925, 0.945, u)), cliffK = 1 - smoothstep(uFace + 0.05, uFace + 0.07, u);
      const PD = 21, lat = clamp(lerp(1.0, -1.15, (u - (uStoopEnd - 0.125)) / 0.15), -1.3, 1.3) * PD * 0.6 * clamp(aspect, 0.56, 1.78);
      for (let i = 0; i < NSW; i++) {
        const b = flock[NSTAR + i], t1 = time * b.b + b.ph, wide = night ? 150 : 120;
        if (i < NPACK && cliffK <= 0) {
          const sg = i % 2 ? 1 : -1, w = (1.25 + 1.2 * b.b) * sg, an = time * w + b.ph, A = 5 + 5 * b.a, C = 3 + 3 * b.a, sA = Math.sin(an), cA = Math.cos(an);
          q1.copy(cp).addScaledVector(fwT, PD + C * cA).addScaledVector(rtT, lat + A * sA).addScaledVector(upT, -0.1 * PD * 0.6 + (i - 4) * 0.5 + 1.7 * Math.sin(an * 2 + b.ph * 3));
          fw.copy(rtT).multiplyScalar(A * w * cA).addScaledVector(fwT, -C * w * sA).addScaledVector(upT, 3.4 * w * Math.cos(an * 2 + b.ph * 3)).normalize();
          upv.copy(YUP).multiplyScalar(0.6).addScaledVector(fwT, -0.62).addScaledVector(rtT, -0.5 * sA * sg).normalize();   // (banked in every turn, backs tipped toward us: sickles, never edge-on)
          place(sm, NSTAR + i, q1, fw, upv, Math.max(3.1 * packK, ZERO));
          continue;
        }
        q1.set(cx - 45 + wide * Math.sin(t1 * b.a), RIM + b.y + 18 * Math.sin(t1 * 0.6 + b.ph * 2), zl + b.zo + 10 * Math.sin(t1 * 1.7 * b.a));
        fw.set(wide * b.a * Math.cos(t1 * b.a), 10.8 * Math.cos(t1 * 0.6 + b.ph * 2), 17 * b.a * Math.cos(t1 * 1.7 * b.a)).normalize();
        upv.copy(YUP).addScaledVector(fw, -fw.y).normalize();
        place(sm, NSTAR + i, q1, fw, upv, i < NPACK ? Math.max(2.3 * cliffK, ZERO) : 2.3);
      }
      sm.instanceMatrix.needsUpdate = true;
    };
    update(0, 0, { getWorldPosition: (v) => v.copy(path.start), matrixWorld: path.frameAt(0, new THREE.Matrix4()) }, 0);
    await ctx.yield();

    return {
      scene, path, duration: 50, pace,
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 30, sway: 0.8, bank: 0.2 },
      pois,
      portal: { shape: 'circle', radius: 7, color: night ? '#b9d2ff' : '#c8f4ea', glow: 1, revealDistance: 320 },
      post: { exposure: H.exposure, bloom: { strength: H.bloom, radius: 0.6, threshold: 0.95 },
        grade: { saturation: H.sat, contrast: 1.05, tint: H.tint, shadowTint: H.shadow, vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      // facts for the offline probe (tools outside the piece): marks along the path and where the named things stand
      info: { cx, zl, U, look: { hour, weather, season, rare, fineTris: G.fineTris || 0, shadows: G.shadows.length, SH, E: Math.round(G.E), clear0: Math.round(G.clear0), clear: Math.round(G.clear) }, us: { uApex, uFlock, uResin, uLip, uPin, uTurn, uLeg0, uFace, uStoopEnd },
        lipZ: (x) => L.z(x), pts: { scar, axis: G.axisTree.clone().setY(RIM + 12), axisTop: G.axisTree.clone().setY(RIM + 25.2), axisBase: G.axisTree.clone().setY(RIM), shL: G.shL.clone().setY(RIM + 9), shR: G.shR.clone().setY(RIM + 9), pin: pinTop, perch: perchAim, perchTop: G.perch.clone().setY(G.perch.y + 0.85 * STAND_S), perchFoot: G.perch.clone(), bt0: new V3(pinTop.x + Math.cos(Math.atan2(G.perchDir.z, G.perchDir.x) + 2.1) * 4.3, pin.top + 2.5, pinTop.z + Math.sin(Math.atan2(G.perchDir.z, G.perchDir.x) + 2.1) * 4.3), bt1: new V3(pinTop.x + Math.cos(Math.atan2(G.perchDir.z, G.perchDir.x) - 2.1) * 4.3, pin.top + 2.5, pinTop.z + Math.sin(Math.atan2(G.perchDir.z, G.perchDir.x) - 2.1) * 4.3), rim: W(-42 + E, 0, 0), aim: fallAim, portal: portalPos },
        trees: hero.anchors.trees, rimY: RIM, breakA: [breakA.x, breakA.z, BRX, BRZ] },
      dispose() { for (const d of disposables) d.dispose(); if (hero.dispose) hero.dispose(); },
    };
  },
};
