// Back to Us Above the Fog: a Baltic headland in late winter, three hours stacked by height, after Caspar David Friedrich.
// +Z is the course and the axis, port is +x, y 0 the sea, the abbey snow y 4. Everything is unlit: tone is distance, the fog is
// a level slab integrated along the true eye ray, and the planes are real geometry at real distances (see the part file's header
// for the style routines; this file shades everything with them and adds the sky, the fog deck, the sea and the far planes).
// The designer's ruling of 05:17 UTC 7 Oct and its second word of 07:43 amend the design in four places, each kept inside its limits
// here: the steep drop from z 250 to the low pass through the abbey (level at y 15 to 17 from about z 336 to the lancet), five rock
// teeth in the lesser reef, the fir islands (60 m and more from the route) and the pinnacle passed 18 m off its centre, its flank
// toward the route in the stack's own beds. Every margin is metres from the route.
import * as THREE from 'three';
import { makePath, makeNoise, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  buildHero, STYLE, STYLE_GLSL, STYLE_FRAG_GLSL, PALETTE, mixHex, fzMaterial, FzGeo, fzRibbonMaterial, ribbonGeometry,
  fzMistMaterial, mistGeometry, mistGround, buildOak, ravenGeometry, soloBird,
} from '../parts/back-to-us-above-the-fog.js';

const lin = (hex) => new THREE.Color(hex);
const TAU = Math.PI * 2;

export default {
  id: 'back-to-us-above-the-fog',
  name: 'Back to Us Above the Fog',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Caspar David Friedrich, 1774 to 1840',
  weirdness: 0.3,
  media: ['air', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), vary = ctx.vary || {};
    const [UMBER, FIR, SLATE, BLUE, PEARL, STRAW, ROSE] = PALETTE;

    // ---------------------------------------------------------------- the edition, chosen once
    const er = ctx.rng.fork('edition');
    const hour = vary.hour === 'golden' ? 'evening' : vary.hour === 'night' ? 'night' : 'morning';
    const ed = er();
    const highFog = ed > 0.42 && ed < 0.68 || ed > 0.9, autumn = ed >= 0.68;
    const nWatchers = er.chance(0.5) ? 3 : 2;
    const rare = !!vary.rare;
    const SLAB0 = 64, SLAB1 = highFog ? 92 : 80, LIFT = SLAB1 - 80;       // the slab; LIFT raises the skim and the reefs with it
    const OCHRE = mixHex(mixHex(UMBER, STRAW, 0.62), ROSE, 0.35), RUSSET = mixHex(mixHex(UMBER, STRAW, 0.42), ROSE, 0.45);
    // pigments of the hour (mixtures between the seven only)
    const H = {
      morning: { fogHi: PEARL, fogLo: SLATE, band: STRAW, over: ROSE, mid: PEARL, high: BLUE, zen: SLATE, ridge: BLUE, ridgeFar: PEARL,
        gap: STRAW, gapOver: ROSE, gapW: 1, bank: SLATE, snow: PEARL, sea: mixHex(SLATE, UMBER, 0.18), bar: SLATE, moonUp: 0 },
      evening: { fogHi: mixHex(PEARL, ROSE, 0.3), fogLo: mixHex(SLATE, ROSE, 0.12), band: mixHex(STRAW, OCHRE, 0.45), over: ROSE, mid: mixHex(ROSE, PEARL, 0.5), high: mixHex(SLATE, BLUE, 0.5), zen: SLATE,
        ridge: SLATE, ridgeFar: mixHex(SLATE, ROSE, 0.5), gap: mixHex(STRAW, ROSE, 0.5), gapOver: ROSE, gapW: 1.8, bank: SLATE, snow: mixHex(PEARL, ROSE, 0.2), sea: mixHex(SLATE, UMBER, 0.2), bar: mixHex(SLATE, ROSE, 0.15), moonUp: 0 },
      night: { fogHi: mixHex(PEARL, SLATE, 0.62), fogLo: mixHex(SLATE, UMBER, 0.38), band: mixHex(STRAW, SLATE, 0.3), over: mixHex(SLATE, ROSE, 0.3), mid: mixHex(SLATE, BLUE, 0.3), high: mixHex(SLATE, UMBER, 0.3), zen: mixHex(SLATE, UMBER, 0.55),
        ridge: mixHex(SLATE, UMBER, 0.2), ridgeFar: mixHex(SLATE, PEARL, 0.25), gap: mixHex(STRAW, SLATE, 0.25), gapOver: mixHex(SLATE, ROSE, 0.3), gapW: 0.8, bank: mixHex(SLATE, UMBER, 0.4), snow: mixHex(PEARL, SLATE, 0.45), sea: mixHex(SLATE, UMBER, 0.45), bar: mixHex(SLATE, UMBER, 0.4), moonUp: 1 },
    }[hour];

    // ---------------------------------------------------------------- this world's own copy of the style uniforms
    // (the part's STYLE is module-wide; two copies of this world can be alive at once, one seen through the other's portal)
    const S = {};
    for (const k in STYLE) { const v = STYLE[k].value; S[k] = { value: v && v.clone ? v.clone() : v }; }
    S.uFogHi.value.set(H.fogHi); S.uFogLo.value.set(H.fogLo); S.uSplit.value = (SLAB0 + SLAB1) / 2;
    S.uSlab.value.set(SLAB0 - 5.5, SLAB1, 0.08, 0);                         // the fog thins out over 5.5 m under the cloud bank's drawn underside (uHaze is set each frame in update)
    S.uSnowCol.value.set(H.snow); S.uSnowLo.value.copy(lin(mixHex(H.snow, H.fogLo, 0.55))); S.uSnow.value = autumn ? 0 : 1;
    S.uDrift.value.set(0, 6, 0.55);
    const own = (m) => { for (const k in S) if (m.uniforms[k]) m.uniforms[k] = S[k]; return m; };   // hand a part-made material this world's uniforms
    const mat = (o) => own(fzMaterial(o));
    const mesh = (geo, m, order = 0) => { const q = new THREE.Mesh(geo, m); q.frustumCulled = false; q.renderOrder = order; scene.add(q); return q; };

    // ---------------------------------------------------------------- the path: one straight axis, one swerve past his shoulder
    const SK = 88 + LIFT;                                                  // the skim, 8 m over the fog
    // z 0 to 60 level over the crag: the one swerve goes out to starboard so that no part of him is nearer the eye than 9 m, and
    // comes back inside 12 degrees; z 60 to 150 down to the skim; past the pinnacle 18 m off its centre; from z 250 the steep drop
    // down the pinnacle's fir flank and through the slab to the pass's height by about z 336 (the designer's second word, 07:43 on
    // 7 Oct: the design's picture before its numbers, an eye already low among the oaks with the wall dark ahead); then level at
    // y 15 to 17 through the oaks, through the lancet at z 400 at y 17 with the port jamb's nearest stone (its shaft ring) at 2 m, and down the nave to the sea.
    const DY = (t) => lerp(SK - 3, 18.5, t);
    const path = makePath([
      [0, 123.5, 0], [-0.5, 123.5, 3], [-2.2, 123.5, 6], [-4.7, 123.5, 9.5], [-7.4, 123.5, 12.5], [-9, 123.5, 15.5], [-9.5, 123.5, 19], [-9.4, 123.5, 25], [-8.6, 123.5, 34], [-7, 123.5, 47], [-5, 123.2, 60],
      [-3, lerp(123.2, SK, 0.29), 86], [-2, lerp(123.2, SK, 0.65), 117], [1, SK + 1.2, 145], [4, SK, 165], [10, SK, 205], [15, SK, 233], [18, SK - 3, 250],
      [17, DY(0.25), 266], [12.5, DY(0.62), 288], [8, DY(0.9), 310], [4.5, 17.5, 330], [3, 15.5, 348], [2.5, 15, 370], [2.5, 16, 390], [2.36, 17, 400],
      [1.5, 17, 414], [0.6, 14.6, 436], [0, 12, 460], [0, 8.8, 495], [0, 7.4, 530], [0, 7, 560], [0, 7, 640], [0, 7, 760], [0, 7, 880], [0, 7, 1000],
    ]);
    const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _t = new THREE.Vector3();
    // places are world coordinates; their u comes from the path (z is monotonic along it)
    const uAtZ = (z) => { let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (path.pointAt(m, _p).z < z) a = m; else b = m; } return (a + b) / 2; };
    const U = { abbey0: uAtZ(330), ravens: uAtZ(350), near0: uAtZ(360), owl: uAtZ(380), near1: uAtZ(395), lancet: uAtZ(400), abbey1: uAtZ(470), shore: uAtZ(560) };
    // pace: 0.7 over the whole crag, 1.05 over the fog, the abbey's (0.59), 1.1 at sea, 1 for the last tenth. Each change lies
    // between two places: the crag's tip and its lip's far side (z 45 to 75), under the slab in the drop (z 290 to 314),
    // from the choir arch's far side to the shore (z 487 to 520), and from 150 to 100 m short of the bar (z 850 to 900).
    // K6: THE LONGER FILM (the designer's third word, b, and its fourth, 6; the owner's word of 08:58). The paces are the picture
    // and the duration is what the route's length gives at them. One unit of pace is PACE1 metres a second: what it was in the
    // version called o2 (its route of 1,038.59 m flown in its 45 s by its own table), so the crag goes at 17.8, the fog at 26.8,
    // the sea at 28.0 and the last tenth at 25.5 m a second as they did there and no faster; the abbey's pace is the one at which
    // the eye goes at the design's 15 m a second from z 330 to z 470, the place to linger (the two changes beside it end and
    // begin one of the engine's 64 parts of the route short of z 330 and past z 470). The film lasts as long as this route
    // then takes (the engine reads pace at 65 points of u, clamps it to 0.35 to 2.5 and scales the film to its duration; the
    // same sum is made here): 45.4 s, and 45.7 s in the edition whose higher fog makes the route 4.6 m longer.
    const PW = [[45, 75], [290, 314], [487, 520], [850, 900]].map(([z0, z1]) => [uAtZ(z0), uAtZ(z1)]);
    const paceBy = (u, abbey) => {
      let p = lerp(0.7, 1.05, smoothstep(PW[0][0], PW[0][1], u));
      p = lerp(p, abbey, smoothstep(PW[1][0], PW[1][1], u));
      p = lerp(p, 1.1, smoothstep(PW[2][0], PW[2][1], u));
      return lerp(p, 1, smoothstep(PW[3][0], PW[3][1], u));
    };
    const PACE1 = 25.49, PA = 15 / PACE1;
    const pace = (u) => paceBy(u, PA);
    let DUR = 0; { let inv = 0, a = clamp(pace(0), 0.35, 2.5); for (let i = 1; i <= 64; i++) { const b = clamp(pace(i / 64), 0.35, 2.5); inv += 2 / (a + b); a = b; } DUR = path.length * inv / 64 / PACE1; }
    // time on the film's clock at u (for things that travel at a speed but must be a function of u): the integral of 1 / pace
    const TU = new Float32Array(257); { let s = 0; for (let i = 1; i <= 256; i++) { s += 1 / pace((i - 0.5) / 256); TU[i] = s; } for (let i = 0; i <= 256; i++) TU[i] *= DUR / s; }
    const tAtU = (u) => { const f = clamp(u, 0, 1) * 256, i = Math.min(255, Math.floor(f)); return lerp(TU[i], TU[i + 1], f - i); };
    const noise = makeNoise(Math.floor(ctx.rng() * 1e9));
    await ctx.yield();

    // ---------------------------------------------------------------- two skies in one dome, mixed by the eye's height
    // dawn above the slab (straw band on the axis, rose, pearl, far blue, violet zenith); dusk below it (the lit gap: straw on
    // the horizon, rose over it, the small straw moon in an ochre halo 12 degrees up on the axis). No sun disc, no glow.
    const uBelow = { value: 0 }, uAbove = { value: 1 };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { ...S, uBelow, uBand: { value: lin(H.band) }, uOver: { value: lin(H.over) }, uMid: { value: lin(H.mid) }, uHigh: { value: lin(H.high) }, uZen: { value: lin(H.zen) },
        uGap: { value: lin(H.gap) }, uGapOver: { value: lin(H.gapOver) }, uGapW: { value: H.gapW }, uBank: { value: lin(H.bank) }, uOchre: { value: lin(OCHRE) }, uMoon: { value: lin(STRAW) }, uMoonUp: { value: H.moonUp }, uSea: { value: lin(H.sea) } },
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
${STYLE_GLSL}
uniform float uBelow; uniform vec3 uBand; uniform vec3 uOver; uniform vec3 uMid; uniform vec3 uHigh; uniform vec3 uZen;
uniform vec3 uGap; uniform vec3 uGapOver; uniform float uGapW; uniform vec3 uBank; uniform vec3 uOchre; uniform vec3 uMoon; uniform float uMoonUp; uniform vec3 uSea;
varying vec3 vD;
vec3 moonOn(vec3 c, vec3 d, float amt){
  vec3 m = vec3(0., 0.2079, 0.9781);                                     // 12 degrees up on the axis
  float ang = degrees(acos(clamp(dot(d, m), -1., 1.)));
  c = fzMix(c, uOchre, 0.55 * (1. - smoothstep(0.75, 3., ang)) * amt);   // ochre halo, 6 degrees across
  return mix(c, uMoon, (1. - smoothstep(0.7, 0.8, ang)) * amt); }       // the small disc, 1.5 degrees
void main(){
  float l = length(vD); vec3 d = l > 1e-5 ? vD / l : vec3(0., 1., 0.);
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float az = (abs(d.x) + abs(d.z)) < 1e-5 ? 0. : abs(degrees(atan(d.x, d.z)));
  // dawn
  float a = (1. - smoothstep(5., 24., az)) * (1. - smoothstep(0.6, 5.5, el));
  vec3 roseOff = fzMix(uOver, uMid, 0.75 * smoothstep(25., 110., az));
  vec3 c = fzMix(roseOff, uBand, a);
  c = fzMix(c, uMid, smoothstep(4., 13., el)); c = fzMix(c, uHigh, smoothstep(13., 38., el)); c = fzMix(c, uZen, smoothstep(36., 84., el));
  // K7: THE STRAW BAND IS A BAND (the designer's fifth word, 2, and its word of 09:23): on the dawn sky alone. Full flat straw
  // from the axis out to 20 degrees either side (the design's 40) and from the horizon up to 8 degrees; beyond 20 degrees it
  // falls away over the 19 degrees it fell away over before; over it the rose, reached at 12 degrees by a passage as soft as
  // before (a little over 4 degrees), then the pearl, which under the band comes on from 12 degrees as it came on from 4 (over
  // 9 degrees) and off the band where it always did. Angles of the dome about the axis and above the horizon. No glow, no disc.
  { float sw = 1. - smoothstep(20., 39., az); a = sw * (1. - smoothstep(8., 12., el));
    c = fzMix(roseOff, uBand, a); c = fzMix(c, uMid, smoothstep(mix(4., 12., sw), mix(13., 21., sw), el)); c = fzMix(c, uHigh, smoothstep(13., 38., el)); c = fzMix(c, uZen, smoothstep(36., 84., el)); }
  c = moonOn(c, d, uMoonUp);
  c = mix(c, uFogHi, smoothstep(0., -1.5, el));
  // dusk
  float g = (1. - smoothstep(6., 46. * uGapW, az));
  vec3 hz = fzMix(fzMix(uGapOver, uBank, 0.55), uGap, g);
  vec3 k = fzMix(hz, fzMix(uGapOver, uBank, 0.6 * smoothstep(30., 120., az)), smoothstep(0.8, 5. * uGapW, el));
  k = fzMix(k, uBank, smoothstep(5. * uGapW, 17. * uGapW, el));
  k = fzMix(k, fzMix(uBank, FZ_UMBER, 0.13), smoothstep(22., 70., el));   // the bank darkens overhead by a mix of violet slate toward umber
  k = moonOn(k, d, 1.);
  k = mix(k, fzMix(uSea, hz, 0.5), smoothstep(0., -1.2, el));
  c = mix(c, k, uBelow);
  // inside the slab the sky is seen through the fog still to cross
  float ey = cameraPosition.y, inside = smoothstep(uSlab.x - 0.5, uSlab.x + 0.5, ey) * (1. - smoothstep(uSlab.y - 0.5, uSlab.y + 0.5, ey));
  float len = d.y > 0. ? (uSlab.y - clamp(ey, uSlab.x, uSlab.y)) / max(d.y, 1e-3) : (clamp(ey, uSlab.x, uSlab.y) - uSlab.x) / max(-d.y, 1e-3);
  c = fzMix(c, fzVeil(fzFogCol(ey), cameraPosition, d, 1000.), (1. - exp(-uSlab.z * len)) * inside);
  gl_FragColor = vec4(c, 1.);
}`, depthWrite: false, depthTest: false, side: THREE.BackSide });
    mesh(new THREE.SphereGeometry(100, 48, 32), skyMat, -20);

    // ---------------------------------------------------------------- the fog deck: an opaque level sea of fog to the horizon
    // Its colour at the lens is the fog colour of its height, so it vanishes as the eye crosses it. It follows the eye in x and z;
    // its swell is drawn from world coordinates sliding toward the light, and lies flat within 30 m of the lens.
    const deckGeo = new THREE.BufferGeometry();
    { const NR = 110, NS = 128, pos = new Float32Array((NR + 1) * NS * 3), idx = [];
      for (let k = 0; k <= NR; k++) { const r = k === 0 ? 0 : 1.5 * Math.pow(26000 / 1.5, k / NR);
        for (let j = 0; j < NS; j++) { const a = j / NS * TAU, o = (k * NS + j) * 3; pos[o] = Math.cos(a) * r; pos[o + 1] = 0; pos[o + 2] = Math.sin(a) * r; } }
      for (let k = 0; k < NR; k++) for (let j = 0; j < NS; j++) { const a = k * NS + j, b = k * NS + (j + 1) % NS; idx.push(a, b, a + NS, b, b + NS, a + NS); }
      deckGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); deckGeo.setIndex(idx); }
    S.uDeckHol.value.set(mixHex(H.fogHi, mixHex(H.high, SLATE, 0.6), 0.62)); S.uDeckFar.value.set(mixHex(H.fogHi, H.high, 0.4));
    const deckMat = new THREE.ShaderMaterial({
      uniforms: { ...S },
      vertexShader: /* glsl */`
${STYLE_GLSL}
varying vec3 vW;
void main(){
  vec3 w = vec3(position.x + cameraPosition.x, 0., position.z + cameraPosition.z);
  w.y = fzDeckY(w.xz, length(position.xz));                              // long level swells, billows nearer the lens
  vW = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
      fragmentShader: /* glsl */`
${STYLE_GLSL}
varying vec3 vW;
void main(){
  // seen from inside the slab it is veiled like everything else; from under the cloud bank it is not there at all
  // (far swells tilt more than the grazing angle, so their upper sides would show in the lit gap)
  // nor from underneath: an eye inside the slab looks up through the fog itself at the firs and the sky, not at a lid
  if (cameraPosition.y < uSlab.x + 5.5 || cameraPosition.y < vW.y) discard;
  gl_FragColor = vec4(fzDeckCol(vW, cameraPosition), 1.);
}`, side: THREE.DoubleSide });
    mesh(deckGeo, deckMat, -5);

    // the slab's underside: a violet cloud bank for a ceiling, ending seaward in a scalloped bar at z 620
    const ceilGeo = new THREE.BufferGeometry();
    { const xs = []; for (let x = -9000; x <= 9000;) { xs.push(x); x += Math.abs(x) < 700 ? 9 : Math.abs(x) < 2500 ? 60 : 500; }
      const zs = [-9000, -2000, 0, 300, 480, 560, 600, 1], pos = [], idx = [];
      for (const x of xs) { const edge = 620 + 16 * Math.abs(Math.sin(x / 47)) + noise.n2(x * 0.004, 2.2) * 22 * smoothstep(10, 80, Math.abs(x)) + Math.min(Math.abs(x) * 0.02, 60);   // on the axis the bar stands at z 620 whatever the seed: there the moon comes clear of it as the eye crosses the sill
        for (const z of zs) pos.push(x, 0, z === 1 ? edge : Math.min(z, edge - 4)); }
      const M = zs.length; for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < M; j++) { const a = i * M + j, b = a + M; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      ceilGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ceilGeo.setIndex(idx); }
    const ceilMat = new THREE.ShaderMaterial({
      uniforms: { ...S, uBank: { value: lin(H.bar) }, uBankLo: { value: lin(mixHex(H.bar, UMBER, 0.22)) }, uLit: { value: lin(mixHex(H.bar, H.gapOver, 0.4)) }, uRose: { value: lin(mixHex(H.gapOver, H.bar, 0.12)) } },
      vertexShader: /* glsl */`
${STYLE_GLSL}
varying vec3 vW; void main(){ vW = vec3(position.x, uSlab.x + 5.5, position.z); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
      fragmentShader: /* glsl */`
${STYLE_GLSL}
uniform vec3 uBank; uniform vec3 uBankLo; uniform vec3 uLit; uniform vec3 uRose; varying vec3 vW;
void main(){
  float d = distance(cameraPosition, vW); vec2 q = vW.xz - uDrift.xy * uTime * 0.6;
  // an eye still in the fog under the bank has no lid at arm's length over it (the lens would cut one open in a straight line):
  // within the 34 m at which this fog leaves a fifteenth of anything, the underside is not drawn and the fog itself is seen
  if (d < 34. * smoothstep(uSlab.x, uSlab.x + 3.5, cameraPosition.y)) discard;
  float roll = fzNoise(vec3(q.x * 0.004, 5., q.y * 0.022)) * 0.6 + fzNoise(vec3(q.x * 0.013, 9., q.y * 0.06)) * 0.4;
  vec3 c = fzMix(uBank, uBankLo, smoothstep(0.3, 0.7, roll));
  c = fzMix(c, uLit, smoothstep(470., 640., vW.z) * (0.35 + 0.65 * smoothstep(0.35, 0.65, roll)));
  c = fzMix(uFogLo, c, smoothstep(6., 90., d));
  c = fzFog(c, cameraPosition, vW);
  // to an eye in the fog the underside is no surface: the fog goes on above it, so it takes what the sky takes on the same ray
  // (the dome's own veil, to the slab's top), and the edge of the opening over the lens cannot be told from the fog
  vec3 rr = vW - cameraPosition; vec3 rd = rr / max(length(rr), 1e-4); float ey = cameraPosition.y;
  float inBox = smoothstep(uSlab.x - 0.5, uSlab.x + 0.5, ey) * (1. - smoothstep(uSlab.y - 0.5, uSlab.y + 0.5, ey));
  c = fzMix(c, fzVeil(fzFogCol(ey), cameraPosition, rd, 1000.), (1. - exp(-uSlab.z * (uSlab.y - clamp(ey, uSlab.x, uSlab.y)) / max(rd.y, 1e-3))) * inBox);
  // the bank's seaward underside takes the gap's rose: low in the sky ahead the cloud is seen through lit air, so the rose
  // stands over the straw to about 14 degrees and the wall's head and the oak claws cut dark against it
  vec3 r = vW - cameraPosition; float el = degrees(atan(max(r.y, 0.), max(length(r.xz), 1e-3)));
  float lit = (1. - smoothstep(4.5, 15., el)) * smoothstep(30., 150., r.z) * (0.62 + 0.38 * smoothstep(0.25, 0.7, roll))
    * (1. - smoothstep(uSlab.x - 4., uSlab.x + 1., cameraPosition.y));     // nothing of it shows through the fog: it comes up over the 5 m after the eye is out under the bank, not as a slit of light at its skin
  c = fzMix(c, uRose, lit);
  gl_FragColor = vec4(c, 1.);
}`, side: THREE.BackSide });
    mesh(ceilGeo, ceilMat, -4);
    await ctx.yield();

    // ---------------------------------------------------------------- past the fog gap: pale flat planes at their true distances
    // cone to port and mesa to starboard at 3 km, seven ridges at 3 to 18 km, six level cloud bars at 2 to 6 km. Flat colour,
    // top edge melting with distance; all of the dawn, so they fade out with it (uAbove) inside the slab.
    const farMat = new THREE.ShaderMaterial({
      uniforms: { uAbove },
      vertexShader: /* glsl */`attribute vec3 aCol; attribute float aEdge; varying vec3 vC; varying float vE;
void main(){ vC = aCol; vE = aEdge; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`uniform float uAbove; varying vec3 vC; varying float vE;
void main(){ float a = smoothstep(0., 1., clamp(vE, 0., 1.)) * uAbove; gl_FragColor = vec4(vC, a); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const fr = ctx.rng.fork('far');
    const farBuild = () => { const o = { pos: [], col: [], edge: [], idx: [] }; o.v = (x, y, z, c, e) => { o.pos.push(x, y, z); o.col.push(c.r, c.g, c.b); o.edge.push(e); return o.pos.length / 3 - 1; }; return o; };
    const farGeo = (o) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(o.pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(o.col, 3)); g.setAttribute('aEdge', new THREE.Float32BufferAttribute(o.edge, 1)); g.setIndex(o.idx); return g; };
    // a vertical profile plane at distance z: rows foot (in the fog), waist, soft line, top
    const profile = (o, z, x0, x1, n, hfn, hex, soft) => {
      const c = lin(hex), foot = lin(mixHex(hex, H.fogHi, 0.75)), waist = lin(mixHex(hex, H.fogHi, 0.3)), base = o.pos.length / 3;
      for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), h = Math.max(hfn(x, i / n), 2), end = Math.min(i, n - i) === 0 ? 0 : 1;
        o.v(x, 40, z, foot, 3); o.v(x, SLAB1 + h * 0.3, z, waist, 3 * end); o.v(x, SLAB1 + Math.max(h - soft, h * 0.5), z, c, end); o.v(x, SLAB1 + h, z, c, 0); }
      for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { const a = base + i * 4 + j, b = a + 4; o.idx.push(a, b, a + 1, a + 1, b, b + 1); }
    };
    const FAR = farBuild();
    const ridgeD = [18000, 14500, 11500, 9000, 7000, 5200, 3900];            // drawn far to near
    // the four nearer planes are 8 km long and sink toward the axis (their slopes slant in to the straw band, as the cone's and the
    // mesa's do); each farther one stands a step higher and a step paler, so they show stacked on either side of the two hills
    // and over their lower slopes; the three farthest are short and stand in the V on the axis
    const ridgeE = [2.5, 2.15, 1.8, 6.4, 5.4, 4.4, 3.4];                      // crest elevation in degrees from the crag, far to near
    ridgeD.forEach((d, k) => {
      const f1 = fr.range(0.45, 1), f2 = fr.range(0.05, 0.3), f3 = fr.range(0.028, 0.05), sd = fr.range(0, 99), near = k >= 3;
      const LL = near ? 8000 : clamp(d * 0.45, 2000, 8000) * (0.85 + 0.15 * f1), cx = (k % 2 ? 1 : -1) * f2 * d * (near ? 0.05 : 0.12);
      const hgt = d * Math.tan(ridgeE[k] * Math.PI / 180) * (0.92 + f3 * 3);
      profile(FAR, d, cx - LL / 2, cx + LL / 2, 110, (x, t) => { const az = Math.abs(Math.atan2(x, d)) * 180 / Math.PI, dip = near ? lerp(0.3, 1, smoothstep(2.5, 10, az)) : 1;
        return hgt * dip * Math.pow(Math.sin(Math.PI * t), near ? 0.3 : 0.6) * (0.74 + 0.26 * noise.n2(x / (d * 0.07), sd) + 0.1 * noise.n2(x / (d * 0.02), sd + 7)); },
        mixHex(H.ridge, H.ridgeFar, near ? 0.62 - (k - 3) * 0.18 : 0.8 - k * 0.12), d * 0.004);
    });
    // the cone to port and the mesa to starboard, their inner slopes slanting in to the axis
    const coneX = 1150 + fr.range(-80, 80), mesaX = -1250 + fr.range(-80, 80), nearHex = mixHex(H.ridge, SLATE, 0.22);
    profile(FAR, 3000, coneX - 1250, coneX + 900, 70, (x) => { const t = (x - coneX) / (x < coneX ? 1250 : 900); return 395 * Math.pow(Math.max(1 - Math.abs(t), 0), 1.25) + noise.n2(x * 0.004, 31) * 9; }, nearHex, 7);
    profile(FAR, 3050, mesaX - 900, mesaX + 1200, 70, (x) => { const t = (x - mesaX) / (x < mesaX ? 900 : 1200), a = Math.abs(t); return 255 * (1 - smoothstep(0.34, 1, a)) * (1 - 0.08 * smoothstep(0.1, 0.34, a)) + noise.n2(x * 0.006, 47) * 7; }, mixHex(nearHex, H.fogHi, 0.1), 7);
    mesh(farGeo(FAR), farMat, -10);
    // cloud bars: level, thin, violet with straw undersides
    const BAR = farBuild(), barTop = lin(mixHex(H.zen, H.mid, 0.35)), barLow = lin(mixHex(H.band, H.over, 0.35));
    for (let k = 0; k < 6; k++) {
      const el = lerp(6, 20, k / 5) + fr.range(-0.8, 0.8), d = fr.range(2000, 6000), y = 123 + d * Math.tan(el * Math.PI / 180), len = fr.range(1500, 4200) * d / 4000, th = fr.range(26, 60) * d / 4000;
      const cx = fr.range(-0.3, 0.3) * d, NX = 14, base = BAR.pos.length / 3, sd = fr.range(0, 50);
      for (let i = 0; i <= NX; i++) { const t = i / NX, x = cx + (t - 0.5) * len, w = th * Math.pow(Math.sin(Math.PI * clamp(t, 0.03, 0.97)), 0.5) * (0.75 + 0.25 * noise.n2(t * 5, sd)), e = Math.min(i, NX - i) === 0 ? 0 : 1;
        BAR.v(x, y - w, d, barLow, 0); BAR.v(x, y - w * 0.45, d, barLow, e); BAR.v(x, y + w * 0.3, d, barTop, e); BAR.v(x, y + w, d, barTop, 0); }
      for (let i = 0; i < NX; i++) for (let j = 0; j < 3; j++) { const a = base + i * 4 + j, b = a + 4; BAR.idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const bars = mesh(farGeo(BAR), farMat, -9);
    await ctx.yield();

    // ---------------------------------------------------------------- rock: the crag with its two shoulders, and the pinnacle
    // heightfields on a jittered grid (facets of 2 to 6 m), shaded by the part's 'rock' mode; feet go down into the fog
    const pathD = (x, z) => path.nearestXZ(x, z);
    const cragTop = (x, z) => {
      const W = lerp(27, 3.2, smoothstep(6, 20, z)) + noise.n2(z * 0.11, 4.4) * 1.6 + (z < 6 ? noise.n2(z * 0.05, 8.1) * 5 : 0);
      const outS = Math.min((Math.hypot((x + 17) / 9, (z - 12) / 14) - 1) * 9, (Math.hypot((x - 17) / 9, (z - 12) / 14) - 1) * 9);
      const outM = Math.min(Math.max(Math.abs(x) - W, z - 21.6 - noise.n2(x * 0.3, 1.3) * 0.8, -52 - z), outS), finR = Math.hypot((x + 20.5) / 4.6, (z - 29) / 10);
      const out = Math.max(Math.min(outM, (finR - 1) * 4.6), 0);            // the starboard shoulder runs on past the tip in a low fin
      let top = 118.9 + noise.n2(x * 0.16, z * 0.16) * 0.9 + noise.n2(x * 0.5, z * 0.5) * 0.35 + 1.1 * smoothstep(9, 18, z);
      for (const sx of [-17, 17]) { const dx = (x - sx) / 7.5, dz = (z - 12) / 15; top = Math.max(top, 132 - (dx * dx + dz * dz) * 11 + noise.n2(x * 0.3, z * 0.3 + sx) * 1.5); }
      if (outM > 0) top = Math.min(top, lerp(120.6 - finR * finR * 2.2 + noise.n2(x * 0.4, z * 0.4 + 5) * 1.1, top, smoothstep(0, -3, outM)));
      const knoll = 2.3 * Math.exp(-((Math.abs(x) - 7.5) ** 2) / 8 - ((z - 7) ** 2) / 14); top += knoll;
      const pd = pathD(x, z); if (pd.dist < 10 && z > -6) top = Math.min(top, pd.y - 3.5 + Math.max(0, pd.dist - 4.5) * 2.6);
      if (Math.hypot(x, z - 18) < 2.2) top = lerp(120, top, smoothstep(0.8, 2.2, Math.hypot(x, z - 18)));
      return top - 85 * smoothstep(0, 6.5, out) - out * 1.5 + (out > 0 ? noise.n2(x * 0.2, z * 0.2 + 9) * 4 * smoothstep(0, 3, out) : 0);
    };
    const PIN = { x: 0, z: 250, top: 106 };
    // The stack, 22 m thick, and its flank toward the route. NEAR: the designer's 3 to 8 m for the nearest rock where the eye is
    // abreast; the eye passes at 27 m a second, where a joint 3.8 m off is through the outer half of the frame in 0.2 s and one
    // 8 m off in 0.42 s (1.41 d / v), so the far end of the range: the rock's line is drawn 7.4 m from the route and its nearest
    // facet stands 7 to 8 m off (never past 8) by the play of one cell of the rock's own jittered grid. Where the route passes abreast (9 m
    // either way of z 250) the stack's own beds are grown out or held back to that line by the stack's own broken outline: the
    // summit, two narrow beds, and a snow ledge 4 m over the fog and under the eye. From that lip, on the whole flank the route
    // passes and drops down (the bearings of the route from z 238 to z 276), the rock goes on down in beds of 4.6 m, level ledges
    // 2.6 m wide, through the slab to its underside: the fir flank, on whose ledges the firs of the drop stand. No sheer cut:
    // one rock, in its beds.
    const NEAR = 7.4, NR2 = (NEAR + 0.3) * (NEAR + 0.3), BED0 = SLAB1 - 1.5, BEDH = 4.6, BEDW = 2.6, NBED = Math.floor((BED0 - SLAB0) / BEDH) + 1;
    const pinTop = (x, z) => {
      const a = Math.atan2(z - PIN.z, x - PIN.x), r = Math.hypot(x - PIN.x, z - PIN.z);
      let R = 10.6 + noise.n2(Math.cos(a) * 1.7, Math.sin(a) * 1.7 + 6) * 2.2 + Math.cos(a * 3 + 1.3) * 1.3 + noise.n2(Math.cos(a) * 5.1 + 3, Math.sin(a) * 5.1) * 0.8, wz = 0, flank = false;
      if (x > 3) { let bd = 1e9, bq = null; for (const q of PINR) { const d = Math.abs(q[3] - a); if (d < bd) { bd = d; bq = q; } }      // the route's point on this bearing from the stack
        if (bd < 0.05) { const lim = bq[4] - NEAR - 0.2; wz = 1 - smoothstep(6, 12, Math.abs(bq[2] - PIN.z)); flank = bq[2] >= PIN.z - 12 && bq[2] <= PIN.z + 26;
          R = lerp(Math.min(R, lim), lim - 1.8 * clamp(0.5 + 0.5 * noise.n2(Math.cos(a) * 3.1 + 11, Math.sin(a) * 3.1), 0, 1), wz); } }
      const q = r / R, lip = SLAB1 + 4, led = wz > 0.3 ? (PIN.top - lip) / 3 * (q < 0.35 ? 0 : q < 0.48 ? 1 : q < 0.6 ? 2 : 3) : q < 0.55 ? 0 : q < 0.8 ? 7.5 : 15;   // two ledges for the firs; toward the route two narrow beds and the snow ledge, two fifths of the stack's radius wide and level
      let top = PIN.top - led + noise.n2(x * 0.3, z * 0.3) * (wz > 0.3 && q >= 0.6 ? 0.4 : 1.1);
      if (flank && r > R) { const k = Math.floor(Math.max(r - R + noise.n2(x * 0.22 + 7, z * 0.22) * 0.8, 0) / BEDW);                    // the fir flank: beds down through the slab, then the stack's own fall
        top = Math.min(top, BED0 - BEDH * Math.min(k, NBED - 1) + noise.n2(x * 0.3, z * 0.3) * 0.4) - 70 * smoothstep(R + NBED * BEDW, R + NBED * BEDW + 4.5, r); }
      else top += -70 * smoothstep(R, R + 4.5, r) - Math.max(r - R, 0) * 1.2;
      // no rock within NEAR of the route, measured in the round (the route goes down steeply here): a bed that would stand nearer
      // under it lies as many beds lower as keeps it off (NR2: the line with 0.3 m for the slant of a facet)
      if (x > 6) { let cap = 1e9; for (const q of PINR) { const d = (q[0] - x) * (q[0] - x) + (q[2] - z) * (q[2] - z); if (d < NR2) cap = Math.min(cap, q[1] - Math.sqrt(NR2 - d)); }
        if (top > cap) top = BED0 - BEDH * Math.ceil((BED0 - cap) / BEDH); }
      return top;
    };
    const PINR = []; for (let s = uAtZ(226) * path.length, s1 = uAtZ(292) * path.length; s <= s1; s += 0.5) { path.posAtDist(s, _p); PINR.push([_p.x, _p.y, _p.z, Math.atan2(_p.z - PIN.z, _p.x - PIN.x), Math.hypot(_p.x - PIN.x, _p.z - PIN.z)]); }   // the route past the stack, a point every half metre: place, bearing and distance from the stack
    // snowOn(ny, y, x, z): how much snow a facet whose normal looks up by ny takes (whole facets: none takes snow by halves)
    // a field's corners: the jittered grid and the height at each corner (kept for the pinnacle, so that a fir's foot can be asked
    // of the rock as it is drawn, facet by facet, and not of the rule behind it)
    const gridOf = async (x0, x1, z0, z1, cell, hfn) => {
      const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell), P = new Float32Array((nx + 1) * (nz + 1) * 3);
      for (let j = 0; j <= nz; j++) { for (let i = 0; i <= nx; i++) { const jx = (noise.n2(i * 7.7, j * 3.3) * 0.38) * cell, jz = (noise.n2(i * 2.9 + 40, j * 6.1) * 0.38) * cell, x = x0 + i * cell + jx, z = z0 + j * cell + jz, o = (j * (nx + 1) + i) * 3; P[o] = x; P[o + 1] = hfn(x, z); P[o + 2] = z; }
        if (j % 8 === 7) await ctx.yield(); }
      return { x0, z0, cell, nx, nz, P };
    };
    const field = async (G, x0, x1, z0, z1, cell, hfn, minY, snowOn = null, pre = null) => {
      const { nx, nz, P } = pre || await gridOf(x0, x1, z0, z1, cell, hfn);
      const at = (i, j) => { const o = (j * (nx + 1) + i) * 3; return [P[o], Math.max(P[o + 1], minY - 6), P[o + 2]]; };
      const tri = (a, b, c, v) => { let s = 0; if (snowOn) { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], nxx = uy * vz - uz * vy, nyy = uz * vx - ux * vz, nzz = ux * vy - uy * vx;
          s = snowOn(Math.abs(nyy) / (Math.hypot(nxx, nyy, nzz) || 1), (a[1] + b[1] + c[1]) / 3, (a[0] + b[0] + c[0]) / 3, (a[2] + b[2] + c[2]) / 3); } G.tri(a, b, c, v, s); };
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
        if (Math.max(a[1], b[1], c[1], d[1]) < minY) continue;
        const v = noise.n2(i * 1.3, j * 1.7) * 0.25; if ((i + j) & 1) { tri(a, d, b, v); tri(b, d, c, -v); } else { tri(a, d, c, v); tri(a, c, b, -v); } }
    };
    // the route, a point every 2.5 m of its own length: every margin in this world is metres from these
    const ROUTE = []; for (let s = 0; s <= path.length; s += 2.5) { path.posAtDist(s, _p); ROUTE.push([_p.x, _p.y, _p.z]); }
    const routeD = (x, z) => { let b = 1e9; for (const q of ROUTE) { const d = (q[0] - x) * (q[0] - x) + (q[2] - z) * (q[2] - z); if (d < b) b = d; } return Math.sqrt(b); };
    const routeD3 = (x, y, z) => { let b = 1e9; for (const q of ROUTE) { const d = (q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y) + (q[2] - z) * (q[2] - z); if (d < b) b = d; } return Math.sqrt(b); };
    const routeX = (z) => path.pointAt(uAtZ(z), _p).x;

    // the pinnacle's rock as it is drawn: its corners once, and the height of its facets over any place (under its lowest row: none)
    const PINMIN = 40, PG = await gridOf(PIN.x - 22, PIN.x + 31, PIN.z - 22, PIN.z + 29, 1.5, pinTop);
    const rockY = (x, z) => { const { x0, z0, cell, nx, nz, P } = PG, ci = Math.floor((x - x0) / cell), cj = Math.floor((z - z0) / cell); let best = -1e9;
      const at = (i, j) => (j * (nx + 1) + i) * 3, hit = (a, b, c) => { const ax = P[a], az = P[a + 2], bx = P[b], bz = P[b + 2], cx = P[c], cz = P[c + 2], d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-9) return;
        const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, l3 = 1 - l1 - l2; if (l1 < 0 || l2 < 0 || l3 < 0) return;
        if (Math.max(P[a + 1], P[b + 1], P[c + 1]) >= PINMIN) best = Math.max(best, l1 * Math.max(P[a + 1], PINMIN - 6) + l2 * Math.max(P[b + 1], PINMIN - 6) + l3 * Math.max(P[c + 1], PINMIN - 6)); };
      for (let j = Math.max(cj - 1, 0); j <= Math.min(cj + 1, nz - 1); j++) for (let i = Math.max(ci - 1, 0); i <= Math.min(ci + 1, nx - 1); i++) { const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
        if (Math.max(P[a + 1], P[b + 1], P[c + 1], P[d + 1]) < PINMIN) continue; if ((i + j) & 1) { hit(a, d, b); hit(b, d, c); } else { hit(a, d, c); hit(a, c, b); } }
      return best; };

    // five rock teeth breaking the fog in the lesser reef, between the crag and the pinnacle (the sea of fog he painted has
    // them): the crag's own sandstone in beds, each a fin lying across the course. Each stands where no rock of it is nearer the
    // route than 10 m nor within 6 m of the axis: one that cannot is moved outward along its own x until it can.
    const toothH = (T, x, z, top) => { const dx = x - T.x, dz = z - T.z, a = Math.atan2(dz, dx), r = Math.hypot(dx * 0.8, dz * 1.15 + dx * 0.3), RR = T.R * (0.75 + 0.4 * noise.n2(Math.cos(a) * 2.6 + T.k * 9.7, Math.sin(a) * 2.6));
      const h0 = top - 12 * Math.pow(r / RR, 1.15) + noise.n2(x * 0.16 + 3, z * 0.16) * 2.2, bed = Math.floor(h0 / 2.4) * 2.4 + 1.2;   // beds of 2.4 m: level ledges, sheer risers
      return lerp(h0, bed, 0.75) + noise.n2(x * 0.45, z * 0.45 + T.k * 9.7) * 0.5 - 40 * smoothstep(RR, RR + 2.5, r); };
    const TEETH = [[-15, 160, 3.6, 6.5], [-12, 202, 4.6, 8.5], [-22, 228, 3.4, 6], [-11.5, 131, 3.2, 6.5], [-7, 186, 3, 6]].map(([x, z, R, up], k) => ({ x, z, R, up, k }));
    for (const T of TEETH) { const ex = T.R * 1.15 / 0.8 + 4, ez = T.R * 1.15 / 1.15 + 6;
      const by = ROUTE.filter((q) => Math.abs(q[2] - T.z) < ez + 14), dR = (x, z) => { let b = 1e9; for (const q of by) b = Math.min(b, (q[0] - x) * (q[0] - x) + (q[2] - z) * (q[2] - z)); return Math.sqrt(b); };
      const ok = () => { for (let x = T.x - ex; x <= T.x + ex; x += 1) for (let z = T.z - ez; z <= T.z + ez; z += 1) if (toothH(T, x, z, SLAB1 + T.up) > SLAB1 - 13 && (dR(x, z) < 12.5 || Math.abs(x) < 8)) return false; return true; };   // the margins over 10 m and 6 m are the cell of the rock's own grid
      for (let n = 0; n < 80 && !ok(); n++) T.x -= 0.5; }
    await ctx.yield();

    // ---------------------------------------------------------------- firs: symmetric spires, whorl by whorl (too symmetric, as he drew them)
    // one spire: NW whorls of NS drooping boughs each, a skirt from the stem (aVS.y 0) to the bough tips (aVS.y -1); the 'fir' mode
    // draws the rest from that coordinate (an umber core, needle ribs, a toothed hanging edge). Two cuts of the same drawing:
    // nine whorls of six for a spire that stands within 45 m of the route, seven of five for one that never comes nearer.
    const firGeoOf = (NW, NS) => { const G = new FzGeo();
      for (let w = 0; w < NW; w++) { const t = w / (NW - 1), y = lerp(0.9, 0.09, t), r = lerp(0.032, 0.2, Math.pow(t, 0.85)) * (w & 1 ? 1.06 : 0.94), drop = lerp(0.055, 0.1, t), top = [], rim = [];
        for (let j = 0; j < NS; j++) { const a = (j + (w & 1) * 0.5) / NS * TAU, a2 = a + TAU / NS / 2;
          top.push([Math.cos(a) * 0.012, y + 0.035, Math.sin(a) * 0.012, 0, 0], [Math.cos(a2) * 0.012, y + 0.035, Math.sin(a2) * 0.012, 0, 0]);
          rim.push([Math.cos(a) * r, y - drop, Math.sin(a) * r, 0, -1], [Math.cos(a2) * r * 0.6, y - drop * 0.3, Math.sin(a2) * r * 0.6, 0, -1]); }
        G.rings([top, rim], true); }
      G.tri([-0.012, 0.9, 0], [0.012, 0.9, 0], [0, 1, 0], 0, 0); G.tri([0, 0.9, -0.012], [0, 0.9, 0.012], [0, 1, 0], 0, 0);                 // the leading shoot, a needle
      G.quad([-0.012, -0.3, 0], [0.012, -0.3, 0], [0.012, 0.9, 0], [-0.012, 0.9, 0], 0, 0); G.quad([0, -0.3, -0.012], [0, -0.3, 0.012], [0, 0.9, 0.012], [0, 0.9, -0.012], 0, 0);   // the stem, down into the fog
      return G.build(); };
    // the land under the fog (heights only; its mesh is made further down): the pinnacle's flank, the abbey yard, the shore
    const shoreZ = (x) => 546 + noise.n2(x * 0.012, 3.1) * 10 - (x / 230) * (x / 230) * 55;
    const landH = (x, z) => {
      const r = Math.hypot(x, z - 412);
      let h = lerp(3.72, 4.35 + noise.n2(x * 0.03, z * 0.03) * 0.3, smoothstep(92, 112, r)) + noise.n2(x * 0.011, z * 0.011 + 7) * 0.7 * smoothstep(110, 260, r);
      h += 68 * Math.pow(smoothstep(312, 246, z), 1.2) * Math.exp(-(x / 150) * (x / 150));
      const sz = shoreZ(x); return lerp(h, -1.4, smoothstep(sz - 30, sz + 4, z));
    };
    // ONE FIR RULE for the whole world: about five hundred spires of 12 to 25 m. A fir is [x, y of the crown's foot, z, height,
    // width factor, turn]. Each population is dealt from a stream of its own, named for it, and every value of a try (place,
    // height, width, turn) is drawn before the route, the rock or the crag is asked: a try that is refused draws what a try that
    // stands draws. No crown stands across the flight (none of its whorls is within 4 m of the route). Past z 250 (the designer's
    // second word, F2) a fir stands whole with its foot on the pinnacle's rock, at y 64 or higher, or it is not planted: none
    // ends in the air, and nothing green is seen from below the fog.
    const firs = [], UNDER = SLAB0;
    { const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)), nOf = (k) => Math.round(k * detail), F = { x: 0, z: 0, nx: 1, nz: 0 };
      const put = (x, y, z, h, w, turn) => { const rad = 0.2 * h * w;
        // K3: THE STACK SHOWS ITS ROCK AND THE TWO BACKS (the designer's fourth word, 3, and its fifth, 1). Three rules of the
        // stack, the same from every eye. The clearing: no fir's stem stands on the crag's side of the cross's foot (z less than
        // the cross's) within K3_CLEAR m of it, nor anywhere within K3_ROUND m of it. Both were found once, by places: the
        // farthest place of the stack where the tallest and widest fir its rules could plant would cut a straight line from the
        // route between z 150 and z 240 (an eye every 2 m, seeds 1 to 40) to the head, middle or feet of either of the two
        // figures at the summit's brink lies 19.0 m from the cross's foot on the crag's side and 3.0 m from it beyond; a metre
        // to spare on each. Above the fog's top a fir of the stack stands only on a bed's snow top: on the
        // drawn rock, on a facet that takes the ledges' snow (looking up by more than 0.86, more than 6.5 m from the route). And
        // no two firs of the stack whose beds are above the fog's top stand nearer each other than one and a half times the
        // wider one's bough width (boughs reach 0.2 h w from the stem: the width is twice that); a fir whose bed is inside the
        // slab is a ghost in the fog and is not spaced. The stack: within 40 m of the cross's foot.
        { const K3_CLEAR = 20, K3_ROUND = 4, dC = Math.hypot(x - PIN.x, z - PIN.z), top = y + 0.5 >= SLAB1;
          if ((z < PIN.z && dC < K3_CLEAR) || dC < K3_ROUND) return false;
          if (dC < 40 && top) { const g = rockY(x, z), gx = (rockY(x + 0.3, z) - rockY(x - 0.3, z)) / 0.6, gz = (rockY(x, z + 0.3) - rockY(x, z - 0.3)) / 0.6;
              if (Math.abs(g - y - 0.5) > 0.6 || 1 / Math.hypot(gx, gz, 1) <= 0.86 || routeD(x, z) <= 6.5) return false;
              for (const f of firs) { if (f[1] + 0.5 < SLAB1 || Math.hypot(f[0] - PIN.x, f[2] - PIN.z) >= 40) continue;
                const need = 1.5 * 0.4 * Math.max(h * w, f[3] * f[4]); if ((f[0] - x) * (f[0] - x) + (f[2] - z) * (f[2] - z) < need * need) return false; } } }
        if (z > 250) { const g = rockY(x, z); if (y < UNDER || y > g || g <= landH(x, z)) return false; }   // past z 250: its foot in the pinnacle's bare rock as it is drawn, not under y 64
        if (routeD(x, z) < 5.5 + rad) for (let t = 0; t <= 1; t += 0.2) if (routeD3(x, y + t * h, z) < 4 + rad * (1 - t)) return null;   // no whorl within 4 m of the eye (null: the place would bear it, the flight refuses it)
        firs.push([x, y, z, h, w, turn]); return true; };
      const reefY = (z, k, j) => SLAB1 - 9 + noise.n2(z * 0.03, k) * 4 + j;               // a reef's firs: the crown's foot 9 m under the fog's top (j: its own 2 m either way), the spire just clearing it
      const offPin = (x, z) => Math.hypot(x - PIN.x, z - PIN.z) > 19;                        // the pinnacle's rock has its own ledge firs
      const frame = (s) => { path.posAtDist(s, _p); path.posAtDist(s + 1, _q); const tx = _q.x - _p.x, tz = _q.z - _p.z, l = Math.hypot(tx, tz) || 1; F.x = _p.x; F.z = _p.z; F.nx = tz / l; F.nz = -tx / l; };   // (nx, nz): to port
      const side = (f) => (f[0] - F.x) * F.nx + (f[2] - F.z) * F.nz, along = (f) => (f[2] - F.z) * F.nx - (f[0] - F.x) * F.nz, sAt = (z) => uAtZ(z) * path.length;
      const abeam = (lat, fwd) => [F.x + F.nx * lat - F.nz * fwd, F.z + F.nz * lat + F.nx * fwd];
      // the crag's two shoulders, 17 m to either side: fir teeth up the sides. A hundred sites on the rock at y 110 or higher;
      // a site whose crown would stand across the flight stays empty and is not made up for (so the flight shifts no other fir)
      { const r = stream('firs-shoulders');
        for (let i = 0, n = 0; n < nOf(100) && i < 4000; i++) { const x = r.sign() * r.range(9, 30), z = r.range(-46, 17), h = r.range(12, 19), w = r.range(0.85, 1.15), turn = r.range(0, TAU), y = cragTop(x, z); if (y >= 110 && put(x, y - 0.6, z, h, w, turn) !== false) n++; } }
      { const r = stream('firs-fin'); put(-18.2, cragTop(-18.2, 30.5) - 8, 30.5, 12, 1.05, r.range(0, TAU)); }   // the fin's one fir tooth
      // the fir reef to port, z 112 to 246: boughs 10 m from the route and a body 24 m deep behind them
      { const r = stream('firs-reef');
        for (let i = 0; i < nOf(140); i++) { const z = r.range(112, 246), h = r.range(12, 25), w = r.range(0.85, 1.15), deep = Math.pow(r(), 1.7) * 24, j = r.range(-2, 2), turn = r.range(0, TAU), x = routeX(z) + 10 + 0.2 * h * w + deep; if (offPin(x, z)) put(x, reefY(z, 5, j), z, h, w, turn); } }
      // its front: wherever no tall crown stands with its boughs within 12.5 m of the route in 5 m up or down the course, one is set there
      { const r = stream('firs-front');
        for (let s = sAt(120), s1 = sAt(240); s <= s1; s += 2.5) { const h = r.range(19, 25), w = r.range(0.85, 1.1), out = r.range(0, 1.5), fwd = r.range(-1, 1), j = r.range(-2, 2), turn = r.range(0, TAU); frame(s);
          if (firs.some((f) => f[3] >= 17 && Math.abs(along(f)) < 5 && side(f) > 0 && side(f) - 0.2 * f[3] * f[4] < 12.5)) continue;
          const q = abeam(10 + 0.2 * h * w + out, fwd); if (offPin(q[0], q[1])) put(q[0], reefY(F.z, 5, j), q[1], h, w, turn); } }
      // the lesser reef, 30 m to starboard, z 118 to 242
      { const r = stream('firs-lesser');
        for (let i = 0; i < nOf(80); i++) { const z = r.range(118, 242), h = r.range(12, 25), w = r.range(0.85, 1.15), deep = Math.pow(r(), 1.5) * 26, j = r.range(-2, 2), turn = r.range(0, TAU), x = routeX(z) - 30 - deep; if (offPin(x, z)) put(x, reefY(z, 15, j), z, h, w, turn); } }
      // one at the foot of each rock tooth, on its seaward side
      { const r = stream('firs-teeth');
        for (const T of TEETH) { const dx = r.range(-2, 2), dz = r.range(0, 1.5), h = r.range(13, 18), w = r.range(0.85, 1.15), j = r.range(-2, 2), turn = r.range(0, TAU); put(T.x + dx, reefY(T.z, 15, j), T.z + T.R * 0.9 + 2.5 + dz, h, w, turn); } }
      await ctx.yield();
      // clumps of tall or of short spires with plain fog between: behind the port front (16 to 42 m), in the lesser reef (30 to 60 m),
      // and the glance's fir islands out in the fog sea on either hand, never nearer the route than 60 m (so always a tone step
      // paler than the reefs). The islands are tried where a fir may stand, from before the reef to the stack (z 90 to z 250), one
      // clump to about 47 m of the course on either hand
      for (const [name, n, z0, z1, lat0, lat1, sgn, k, far] of [['firs-clumps-port', nOf(10), 116, 244, 16, 42, 1, 5, 0], ['firs-clumps-starboard', nOf(8), 120, 242, 30, 60, -1, 15, 0],
        ['firs-islands-port', nOf((250 - 90) / 47), 90, 250, 68, 135, 1, 25, 60], ['firs-islands-starboard', nOf((250 - 90) / 47), 90, 250, 68, 135, -1, 35, 60]]) { const r = stream(name);
        for (let c = 0; c < n; c++) { const zc = r.range(z0, z1), lat = sgn * r.range(lat0, lat1), hc = r.range(14, 23), m = 3 + Math.floor(r() * 4), set = [];
          for (let i = 0; i < 6; i++) set.push([r.range(0, TAU), r.range(0, 7), r.range(-3, 3), r.range(0.85, 1.15), r.range(-2, 2), r.range(0, TAU)]);   // six tries' values to a clump, of which its 3 to 6 are used
          frame(sAt(zc));
          for (let i = 0; i < m; i++) { const [a, d, dh, w, j, turn] = set[i], h = clamp(hc + dh, 12, 25), q = abeam(lat + Math.cos(a) * d, Math.sin(a) * d);
            if (offPin(q[0], q[1]) && routeD(q[0], q[1]) - 0.2 * h * w >= far) put(q[0], reefY(F.z, k, j), q[1], h, w, turn); } } }
      await ctx.yield();
      // THE STACK. First one fir on the face the eye passes: on the snow ledge, on the stack's bearing to the route's nearest point
      // (the first try of twenty-four that the ledge, the stack's rules and the 4 m of the flight allow); a stream of its own. It stands on the middle of the
      // ledge, 1.4 to 2.4 m in from its lip (the ledge is 3.8 m wide; the lip's facet and the riser's at its back, a cell of the
      // drawn rock each, slope)
      const off4 = (x, y, z, h, w) => { for (let t = 0; t <= 1.001; t += 0.1) { const lim = 4.1 + 0.2 * h * w * (1 - t); for (const q of PINR) if ((q[0] - x) * (q[0] - x) + (q[1] - y - t * h) * (q[1] - y - t * h) + (q[2] - z) * (q[2] - z) < lim * lim) return false; } return true; };   // no whorl within 4 m of the eye, asked of the route every half metre
      { const ff = stream('facefir'), tries = []; for (let i = 0; i < 24; i++) tries.push([ff.range(-0.25, 0.25), ff.range(1.4, 2.4), ff.range(12, 15), ff.range(0.85, 1.05), ff.range(0, TAU)]);
        let near = PINR[0]; for (const q of PINR) if (q[4] < near[4]) near = q;
        for (const [da, inl, h, w, turn] of tries) { const a = near[3] + da; let R = 0; for (let rr = 4; rr < 16; rr += 0.25) if (Math.abs(pinTop(PIN.x + Math.cos(a) * rr, PIN.z + Math.sin(a) * rr) - (SLAB1 + 4)) < 1.2) R = rr;   // the ledge's lip on this bearing
          const x = PIN.x + Math.cos(a) * (R - inl), z = PIN.z + Math.sin(a) * (R - inl), y = pinTop(x, z); if (R > 0 && Math.abs(y - (SLAB1 + 4)) < 1.2 && off4(x, y - 0.5, z, h, w) && put(x, y - 0.5, z, h, w, turn)) break; } }
      // the pinnacle's ledges: forty sites on its rock 4 m and more over the fog that the stack's own rules allow, or as many as it holds
      { const r = stream('firs-ledges');
        for (let i = 0, n = 0; n < nOf(40) && i < 3000; i++) { const a = r.range(0, TAU), rr = r.range(6.3, 12.5), h = r.range(12, 15), w = r.range(0.85, 1.15), turn = r.range(0, TAU), x = PIN.x + Math.cos(a) * rr, z = PIN.z + Math.sin(a) * rr, y = pinTop(x, z); if (y >= 84 + LIFT && put(x, y - 0.5, z, h, w, turn) !== false) n++; } }
      await ctx.yield();
      // the fir flank of the drop: the firs stand on the ledges of the pinnacle's flank that the route goes down, inside the slab
      // (the fir ghosts beside the eye as it goes down through are these). A stream of their own. A foot stands on a level ledge
      // of bare rock: not on a riser, not in the snow of the land.
      { const fr = stream('dropfirs');
        const ledge = (x, z, y) => [[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]].every(([dx, dz]) => Math.abs(pinTop(x + dx, z + dz) - y) < 1.2);
        // K4: THE GHOSTS IN THE SLAB (the designer's third word, e, and its fourth, 4). The tries fall evenly by the square metre
        // over the whole ground of the flank's beds (the stack's rock to port of x 3, as far as it is built), so that a bed ahead
        // of the route carries firs as thickly as one abeam: 0.26 tries to the square metre, which is what the beds had on the
        // mean when the tries were dealt evenly by bearing and radius about the cross (150 on the 629 square metres of the
        // sector they fell in, thicker near the stack). Each foot on a level bed of bare rock inside the slab, at y 64 or higher.
        { const X0 = PIN.x + 3, X1 = PIN.x + 31, Z0 = PIN.z - 22, Z1 = PIN.z + 29;
          for (let i = 0, n = nOf((X1 - X0) * (Z1 - Z0) * 0.26); i < n; i++) { const x = fr.range(X0, X1), z = fr.range(Z0, Z1), h = fr.range(12, 20), w = fr.range(0.85, 1.15), turn = fr.range(0, TAU), y = pinTop(x, z);
            if (y < SLAB1 + 2 && y - 0.5 >= UNDER && y > landH(x, z) + 0.5 && ledge(x, z, y) && off4(x, y - 0.5, z, h, w)) put(x, y - 0.5, z, h, w, turn); } }
      }
    }
    await ctx.yield();

    // one umber-black mass in two close values: umber, and umber less than a fifth of the way to violet slate (5 percent off; no straw, no rose). Snow
    // lies whole on the level ledges of the pinnacle and of the teeth, nowhere on the crag he stands on.
    const rockMat = mat({ mode: 'rock', col: UMBER, col2: mixHex(UMBER, SLATE, 0.18), snow: 0, body: 0.6, centers: true, side: THREE.DoubleSide });
    const RK = new FzGeo(); RK.center = [0, 120, 8];
    await field(RK, -46, 46, -58, 44, 2.2, cragTop, 58);
    await ctx.yield();
    const ledgeSnow = (ny, y, x, z) => (ny > 0.86 && y > SLAB1 - 1 && routeD(x, z) > 6.5 ? 1 : 0);     // on the level ledges; not on the cut beside the route
    RK.center = [PIN.x, PIN.top, PIN.z];
    await field(RK, PIN.x - 22, PIN.x + 31, PIN.z - 22, PIN.z + 29, 1.5, pinTop, PINMIN, ledgeSnow, PG);     // the flank's beds reach further to port and seaward, and go down to the land under the slab
    // a tooth's top stands no higher out of the fog than the tallest spire of the lesser reef within 30 m of it
    for (const T of TEETH) { let tip = 0; for (const f of firs) if (f[0] < routeX(f[2]) - 12 && Math.hypot(f[0] - T.x, f[2] - T.z) < 30) tip = Math.max(tip, f[1] + f[3]);
      const top = Math.min(SLAB1 + T.up, tip - 1.5); RK.center = [T.x, top, T.z];
      await field(RK, T.x - T.R * 1.5 - 5, T.x + T.R * 1.5 + 5, T.z - T.R - 6, T.z + T.R + 6, 1.5, (x, z) => toothH(T, x, z, top), SLAB1 - 7, ledgeSnow); }
    mesh(RK.build(), rockMat).name = 'rock';
    await ctx.yield();

    // ---------------------------------------------------------------- figures: backs only, stiff and small
    // a standing or seated back in a cloak or coat: rings from the hem up; facing +Z (away from the eye)
    const backFigure = (G, x, y, z, h, o = {}) => {
      const k = h / 1.8, N = 10, hem = o.hem ?? 0.5, wide = o.wide ?? 1;
      const sec = (yy, rx, rz, dz, v) => { const ring = []; for (let j = 0; j < N; j++) { const a = j / N * TAU; ring.push([x + Math.cos(a) * rx * k * wide, y + yy * k, z + (Math.sin(a) * rz + dz) * k, v + (j % 3 === 0 ? -0.4 : 0), 0]); } return ring; };
      G.rings([sec(hem, 0.3, 0.21, -0.03, -0.3), sec(hem + 0.02, 0.31, 0.22, -0.03, 0), sec(1.0, 0.24, 0.17, -0.01, 0.1), sec(1.38, 0.27, 0.15, 0, 0.2), sec(1.5, 0.2, 0.13, 0, 0), sec(1.55, 0.07, 0.07, 0.01, -0.4)], true);
      if (!o.seated) for (const m of [-1, 1]) { const lx = x + m * 0.13 * k * wide, lz = z + (o.stride ?? 0) * m * k; G.rings([[[lx - 0.09 * k, y, lz - 0.1 * k, -0.5, 0], [lx + 0.09 * k, y, lz - 0.1 * k, -0.5, 0], [lx + 0.09 * k, y, lz + 0.14 * k, -0.5, 0], [lx - 0.09 * k, y, lz + 0.14 * k, -0.5, 0]],
        [[lx - 0.08 * k, y + (hem + 0.1) * k, z - 0.08 * k, -0.2, 0], [lx + 0.08 * k, y + (hem + 0.1) * k, z - 0.08 * k, -0.2, 0], [lx + 0.08 * k, y + (hem + 0.1) * k, z + 0.08 * k, -0.2, 0], [lx - 0.08 * k, y + (hem + 0.1) * k, z + 0.08 * k, -0.2, 0]]], true); }
      for (const m of [-1, 1]) { const ax = x + m * 0.3 * k * wide; G.rings([[[ax - 0.06 * k, y + 1.36 * k, z - 0.07 * k, 0, 0], [ax + 0.06 * k, y + 1.36 * k, z - 0.07 * k, 0, 0], [ax + 0.06 * k, y + 1.36 * k, z + 0.07 * k, 0, 0], [ax - 0.06 * k, y + 1.36 * k, z + 0.07 * k, 0, 0]],
        [[ax - 0.05 * k + m * 0.03 * k, y + 0.82 * k, z, -0.3, 0], [ax + 0.05 * k + m * 0.03 * k, y + 0.82 * k, z, -0.3, 0], [ax + 0.05 * k + m * 0.03 * k, y + 0.82 * k, z + 0.1 * k, -0.3, 0], [ax - 0.05 * k + m * 0.03 * k, y + 0.82 * k, z + 0.1 * k, -0.3, 0]]], true); }
    };
    const headOn = (G, x, y, z, h, o = {}) => {                              // head and hair (or a beret), seen from behind
      const k = h / 1.8, N = 8, sec = (yy, r, v, dz = 0) => { const ring = []; for (let j = 0; j < N; j++) { const a = j / N * TAU; ring.push([x + Math.cos(a) * r * k, y + yy * k, z + (Math.sin(a) * r * 1.1 + dz) * k, v, 0]); } return ring; };
      if (o.beret) G.rings([sec(1.55, 0.085, -0.2), sec(1.68, 0.1, 0), sec(1.72, 0.16, 0.2), sec(1.76, 0.15, 0.1), sec(1.79, 0.03, 0.1)], true);
      else G.rings([sec(1.54, 0.075, -0.3), sec(1.6, 0.1, 0, -0.01), sec(1.7, 0.115, 0.3, -0.01), sec(1.78, 0.085, 0.5), sec(1.81, 0.02, 0.5)], true);
    };
    await ctx.yield();

    // the wanderer on the tip: bottle-green coat that hangs, red-blond hair that stirs, a stick; alone, back to us
    const figMat = mat({ mode: 'lines', col: UMBER, grain: 7, snow: 0, body: 0.25, centers: true, side: THREE.DoubleSide });
    const WAN = { x: 0, z: 18, h: 1.85 }; WAN.y = cragTop(WAN.x, WAN.z) - 0.05;
    { const G = new FzGeo(); G.center = [WAN.x, WAN.y, WAN.z]; backFigure(G, WAN.x, WAN.y, WAN.z, WAN.h, { hem: 0.6, stride: 0.16 });
      mesh(G.build(), mat({ mode: 'lines', col: FIR, col2: mixHex(FIR, SLATE, 0.2), grain: 9, snow: 0, body: 0.3, centers: true, side: THREE.DoubleSide })).name = 'wanderer'; }
    const hair = (() => { const G = new FzGeo(), k = WAN.h / 1.8; headOn(G, 0, -1.66 * k, 0, WAN.h);
      for (let j = 0; j < 7; j++) { const a = j / 7 * TAU, c = Math.cos(a), s = Math.sin(a); G.tri([c * 0.1 * k, 0.06 * k, s * 0.1 * k], [c * 0.16 * k, 0.13 * k, s * 0.16 * k], [Math.cos(a + 0.7) * 0.1 * k, 0.1 * k, Math.sin(a + 0.7) * 0.1 * k], 0.6, 0); }
      const m = mesh(G.build(), mat({ mode: 'plain', col: mixHex(mixHex(UMBER, STRAW, 0.5), ROSE, 0.4), col2: mixHex(STRAW, ROSE, 0.4), grain: 30, snow: 0, lift: 0.5, side: THREE.DoubleSide }));
      m.position.set(WAN.x, WAN.y + 1.66 * k, WAN.z); return m; })();
    const thin = [];                                                         // every ribbon of the upper world: his stick, the summit cross
    { const k = WAN.h / 1.8; thin.push(WAN.x + 0.34 * k, WAN.y + 0.95 * k, WAN.z + 0.06, WAN.x + 0.52 * k, WAN.y - 0.05, WAN.z + 0.3, 0.035); thin.cen = [WAN.x, WAN.y, WAN.z]; }
    // the summit cross to y 118 and the two small backs at its foot, facing the light
    const pinY = pinTop(PIN.x, PIN.z);
    thin.push(PIN.x, pinY - 0.5, PIN.z, PIN.x, 118, PIN.z, 0.3, PIN.x - 2.3, 114.6, PIN.z, PIN.x + 2.3, 114.6, PIN.z, 0.26); thin.cen.push(PIN.x, pinY, PIN.z, PIN.x, pinY, PIN.z);
    mesh(ribbonGeometry(thin), own(fzRibbonMaterial({ col: UMBER, centers: true })));
    const BACKS = [];                                                        // O7: the two backs where the lines below stand them: [x, y of the feet, z, height, breadth factor]
    const FG = new FzGeo();
    { const a = [PIN.x - 1.0, PIN.z - 1.5], b = [PIN.x + 0.9, PIN.z - 1.3];
      // K3: THE TWO BACKS ARE SEEN (the designer's fifth word, 1): where they stood, 1.5 m behind the cross, the summit's own
      // ledge stood between them and the route below. They stand at the brink of the summit's ledge, 0.3 m in from it, on the
      // bearing from the cross's foot that lies midway between the route's points at z 150 and z 240, one 12 degrees to either
      // side of it, their feet on the rock as it is drawn: a place of the stack, found from the rock and the route's line.
      { const b0 = Math.atan2(150 - PIN.z, routeX(150) - PIN.x), b1 = Math.atan2(240 - PIN.z, routeX(240) - PIN.x);
        [a, b].forEach((q, k) => { const th = (b0 + b1) / 2 + (k ? 0.21 : -0.21); let r = 0; for (let t = 0.25; t <= 9; t += 0.25) { if (rockY(PIN.x + Math.cos(th) * t, PIN.z + Math.sin(th) * t) < pinY - 1.6) break; r = t; }
          r = Math.max(r - 0.3, 0); q[0] = PIN.x + Math.cos(th) * r; q[1] = PIN.z + Math.sin(th) * r; q[2] = rockY(q[0], q[1]) - 0.05; }); }
      const ya = a[2] ?? pinTop(a[0], a[1]) - 0.05, yb = b[2] ?? pinTop(b[0], b[1]) - 0.05;
      FG.center = [PIN.x, pinY, PIN.z]; backFigure(FG, a[0], ya, a[1], 1.78, { hem: 0.45 }); headOn(FG, a[0], ya, a[1], 1.78, { beret: true });
      BACKS.push([a[0], ya, a[1], 1.78, 1], [b[0], yb, b[1], 1.62, 1.1]);   // O7
      backFigure(FG, b[0], yb, b[1], 1.62, { hem: 0.02, wide: 1.1, seated: true }); headOn(FG, b[0], yb, b[1], 1.62); }

    // ---------------------------------------------------------------- THE STACK'S NEW FIRS (the designer's words of 10:30, 12:39 and 13:03 UTC on 7 Oct)
    // Every fir above is live's, dealt by its own stream under its own rules, and is untouched. These are added after them, from one
    // stream of their own, by the rules the designer gave for new firs of the stack (the pinnacle's rock within 40 m of the cross's
    // foot, above the fog and down through the slab to y 64). The tries fall evenly by the square metre over the whole field the
    // stack's rock is drawn on, 0.52 to the square metre (the designer's one number for every seed, 12:39, 3); every value of a try
    // (place, the height it has on a ledge above the fog, 12 to 15 m as the ledge firs, the height it has on a bed in the slab, 12
    // to 20 m as the drop's firs, width, turn) is drawn before the rock, the route or another fir is asked. Then, by places only:
    // 1  WHERE: THE BED FUNCTION. The beds' own height (pinTop) is a level ledge by live's test for the drop's firs: the four
    //    places 0.55 m off lie within 1.2 m of it. The facets as drawn are not asked where.
    // 2  THE BARE NEVER: no trunk nearer to another trunk of the stack, live's or new, than half the wider one's bough reach
    //    (the reach is 0.2 h w).
    // 4  THE FOOT IN THE ROCK THE EYE SEES (rockY, the facets as drawn). The crown's foot is set 0.5 m under the lowest point
    //    of the drawn rock under the stem's own width (the stem below it runs 0.3 h further down): flat facets have their lowest
    //    point under a disc on its edge or at a facet's corner inside it, so the rock is asked at the stem's centre, at sixteen
    //    places round its edge (0.012 h w out), at every corner of the drawn grid within it, wherever an edge between two facets
    //    leaves it, and on its edge straight down the slope of every facet near. No foot under y 64, none where the land's snow
    //    lies over that rock. The boughs fall where they fall, as live's ledge firs' do.
    // (c) THE CROSS AND THE TWO BACKS: no stem within 4 m of the cross's foot nor within 2 m of a figure; and no part of the
    //     crown or stem as built (the nine-whorl and the seven-whorl cut, whichever reaches further at a height), widened by half
    //     the figure's own breadth, on a straight line from an eye of the route between z 150 and z 240 (an eye to every metre of
    //     the route's length) to a figure's head, middle or feet, nor on that line carried on beyond its head or middle to the
    //     end of the stack.
    // And live's rules for every fir: no whorl within 4 m of the eye anywhere on the route (both of live's tests). Nothing else.
    { const r = ctx.core.makeRng(ctx.core.hashSeed('stackfirs:' + ctx.seed));
      const X0 = PG.x0, X1 = PG.x0 + PG.nx * PG.cell, Z0 = PG.z0, Z1 = PG.z0 + PG.nz * PG.cell, STACK = 40;
      // how far the crown reaches from the stem at a height (both in the spire's own units), from the whorls as firGeoOf builds them
      const ENV = []; for (let i = 0; i <= 102; i++) { const yl = -0.01 + i * 0.01; let m = 0.012;
        for (const NW of [9, 7]) for (let k = 0; k < NW; k++) { const t = k / (NW - 1), yy = lerp(0.9, 0.09, t), rr = lerp(0.032, 0.2, Math.pow(t, 0.85)) * (k & 1 ? 1.06 : 0.94), top = yy + 0.035, rim = yy - lerp(0.055, 0.1, t);
          if (yl >= rim - 0.01 && yl <= top + 0.01) m = Math.max(m, lerp(0.012, rr, clamp((top - yl) / (top - rim), 0, 1))); }
        ENV.push(m); }
      // the lines of (c): [eye x, y, z, unit direction x, y, z, length, half the figure's breadth]
      const LINES = [], s1 = uAtZ(240) * path.length, eyeS = []; for (let s = uAtZ(150) * path.length; s < s1; s += 1) eyeS.push(s); eyeS.push(s1);
      for (const s of eyeS) { path.posAtDist(s, _p);
        for (const [fx, fy, fz, fh, wide] of BACKS) { const k = fh / 1.8, half = (0.3 * wide + 0.06) * k;
          for (const [up, on] of [[1.68 * k, STACK + 6], [0.9 * k, STACK + 6], [0, 0]]) { const dx = fx - _p.x, dy = fy + up - _p.y, dz = fz - _p.z, l = Math.hypot(dx, dy, dz); LINES.push([_p.x, _p.y, _p.z, dx / l, dy / l, dz / l, l + on, half]); } } }
      const crossed = (x, y, z, h, w) => { const hw = h * w;
        for (const q of LINES) { const R = 0.212 * hw + q[7], ex = x - q[0], ez = z - q[2], dh = q[3] * q[3] + q[5] * q[5], t0 = (ex * q[3] + ez * q[5]) / dh, perp = ex * ex + ez * ez - t0 * t0 * dh;
          if (perp >= R * R) continue; const half = Math.sqrt((R * R - perp) / dh);
          for (let t = Math.max(t0 - half, 0), t1 = Math.min(t0 + half, q[6]); t <= t1; t += 0.1) { const yl = (q[1] + q[4] * t - y) / h; if (yl < -0.01 || yl > 1) continue;
            const f = (yl + 0.01) * 100, i = Math.min(101, Math.floor(f)); if (Math.hypot(q[0] + q[3] * t - x, q[2] + q[5] * t - z) < Math.max(ENV[i], ENV[i + 1]) * hw + q[7]) return true; } }
        return false; };
      const off = (x, y, z, h, w) => { const rad = 0.2 * h * w;                 // live's two tests of the 4 m (in put, and off4 of the stack's streams)
        if (routeD(x, z) < 5.5 + rad) for (let t = 0; t <= 1; t += 0.2) if (routeD3(x, y + t * h, z) < 4 + rad * (1 - t)) return false;
        for (let t = 0; t <= 1.001; t += 0.1) { const lim = 4.1 + rad * (1 - t); for (const q of PINR) if ((q[0] - x) * (q[0] - x) + (q[1] - y - t * h) * (q[1] - y - t * h) + (q[2] - z) * (q[2] - z) < lim * lim) return false; }
        return true; };
      const apart = (x, z, reach) => { for (const f of firs) { if (Math.hypot(f[0] - PIN.x, f[2] - PIN.z) >= STACK) continue;
          const need = 0.5 * Math.max(reach, 0.2 * f[3] * f[4]); if ((f[0] - x) * (f[0] - x) + (f[2] - z) * (f[2] - z) < need * need) return false; } return true; };
      // 4: the lowest drawn rock under the stem's own width (none: the rock is not drawn there)
      const under = (x, z, rad) => { let lo = rockY(x, z); for (let k = 0; k < 16; k++) lo = Math.min(lo, rockY(x + Math.cos(k * TAU / 16) * rad, z + Math.sin(k * TAU / 16) * rad));
        const { x0, z0, cell, nx, nz, P } = PG, ci = Math.round((x - x0) / cell), cj = Math.round((z - z0) / cell);
        for (let j = Math.max(cj - 1, 0); j <= Math.min(cj + 1, nz); j++) for (let i = Math.max(ci - 1, 0); i <= Math.min(ci + 1, nx); i++) { const o = (j * (nx + 1) + i) * 3; if ((P[o] - x) * (P[o] - x) + (P[o + 2] - z) * (P[o + 2] - z) <= rad * rad) lo = Math.min(lo, rockY(P[o], P[o + 2])); }
        const cut = (a, b) => { const ax = P[a] - x, az = P[a + 2] - z, ex = P[b] - P[a], ez = P[b + 2] - P[a + 2], A = ex * ex + ez * ez, B = ax * ex + az * ez, D = B * B - A * (ax * ax + az * az - rad * rad); if (D < 0 || A < 1e-12) return;   // where a facet's edge leaves the stem's width
          for (const s of [(-B - Math.sqrt(D)) / A, (-B + Math.sqrt(D)) / A]) if (s >= 0 && s <= 1) lo = Math.min(lo, rockY(P[a] + ex * s, P[a + 2] + ez * s)); };
        const dip = (a, b, c) => { const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2], ny = uz * vx - ux * vz; if (Math.abs(ny) < 1e-9) return;   // the place on the stem's edge straight down a facet's own slope
          const gx = -(uy * vz - uz * vy) / ny, gz = -(ux * vy - uy * vx) / ny, l = Math.hypot(gx, gz); if (l > 1e-9) lo = Math.min(lo, rockY(x - gx / l * rad, z - gz / l * rad)); };
        for (let j = Math.max(cj - 2, 0); j <= Math.min(cj + 1, nz - 1); j++) for (let i = Math.max(ci - 2, 0); i <= Math.min(ci + 1, nx - 1); i++) { const a = (j * (nx + 1) + i) * 3, b = a + 3, d = a + (nx + 1) * 3, c = d + 3; cut(a, b); cut(a, d); if ((i + j) & 1) { cut(b, d); dip(a, d, b); dip(b, d, c); } else { cut(a, c); dip(a, d, c); dip(a, c, b); } }
        return lo; };
      for (let i = 0, n = Math.round((X1 - X0) * (Z1 - Z0) * 0.52 * detail); i < n; i++) {
        const x = r.range(X0, X1), z = r.range(Z0, Z1), hLedge = r.range(12, 15), hBed = r.range(12, 20), w = r.range(0.85, 1.15), turn = r.range(0, TAU);
        if (i % 8 === 7) await ctx.yield();
        const dC = Math.hypot(x - PIN.x, z - PIN.z); if (dC >= STACK) continue;
        const bed = pinTop(x, z); if (![[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]].every(([dx, dz]) => Math.abs(pinTop(x + dx, z + dz) - bed) < 1.2)) continue;
        const h = bed < SLAB1 + 2 ? hBed : hLedge, lo = under(x, z, 0.012 * h * w), y = lo - 0.5; if (y < UNDER || lo <= landH(x, z)) continue;
        if (dC < 4 || BACKS.some((b) => Math.hypot(x - b[0], z - b[2]) < 2)) continue;
        if (!apart(x, z, 0.2 * h * w) || !off(x, y, z, h, w) || crossed(x, y, z, h, w)) continue;
        firs.push([x, y, z, h, w, turn]); } }
    await ctx.yield();

    // ---------------------------------------------------------------- the land under the fog: the pinnacle's flank, the abbey yard, the shore
    const heathA = mixHex(UMBER, RUSSET, 0.06), heathB = mixHex(UMBER, RUSSET, 0.24);   // late autumn: dark drawn umber heath; the pale is the mist lying on it
    { const G = new FzGeo(), xs = [], zs = []; for (let x = -620; x <= 620;) { xs.push(x); x += Math.abs(x) < 150 ? 6 : Math.abs(x) < 300 ? 15 : 40; } for (let z = 232; z <= 600; z += 5.5) zs.push(z);
      const rs = []; for (let j = 0; j < zs.length; j++) { const ring = []; for (const x of xs) { const jx = noise.n2(x * 3.1, zs[j] * 1.7) * 1.6, z = zs[j] + noise.n2(x * 1.3 + 9, zs[j] * 2.3) * 1.6, h = landH(x + jx, z); ring.push([x + jx, h, z, clamp(noise.n2(x * 0.05, z * 0.05) * 0.8, -1, 1), 0]); } rs.push(ring); if (j % 12 === 11) await ctx.yield(); }
      G.rings(rs, false); const g = G.build(); g.setAttribute('aC', g.getAttribute('position').clone());     // tone steps by each place's own distance
      mesh(g, mat({ mode: 'snow', col: autumn ? heathA : H.snow, col2: autumn ? heathB : SLATE, centers: true, side: THREE.DoubleSide })); }
    await ctx.yield();

    // ---------------------------------------------------------------- the hero: the window, at world (0, 4, 400), already turned to the course
    const hero = await buildHero(ctx, { palette: PALETTE, detail, courseZ: true, standalone: false, oaks: 3, groundRadius: 110, snow: !autumn, leaves: autumn ? 3.2 : 1, ravens: 24 });
    hero.object.position.set(0, 4, 400); scene.add(hero.object);
    hero.object.traverse((o) => { if (o.material && o.material.uniforms) { own(o.material); const un = o.material.uniforms; if (un.uMode && un.uMode.value === 5) {         // the hero's snow patch: tone by each place's own distance, as the land round it
          o.geometry.setAttribute('aC', o.geometry.getAttribute('position').clone()); o.material.defines = { ...(o.material.defines || {}), FZ_CENTER: 1 };
          if (autumn) { un.uCol.value.set(heathA); un.uCol2.value.set(heathB); } } } });
    let flockU = null; hero.object.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uAway) flockU = o.material.uniforms; });
    const away0 = flockU ? flockU.uAway.value.clone() : new THREE.Vector3();
    const A = {}; for (const k of ['owlPerch', 'ravenOak']) A[k] = hero.anchors[k].clone().add(hero.object.position);
    await ctx.yield();

    // thirteen more oaks (sixteen in all, z 330 to 470): claws over the wall's shoulders, nothing across the axis or the flight
    const oakXZ = [];                                                        // where the thirteen boles stand (the mist fades against them)
    // each oak is dealt from a stream of its own (by its number), so a bough pruned on one shifts nothing on another
    { const Bk = new FzGeo(), Tw = [];
      const keepOut = (p) => path.distanceTo(p.x, p.y, p.z) < 7 || (p.z < 402 && Math.abs(p.x - 1) < 7.5) || (p.z >= 402 && Math.abs(p.x) < 10) || (Math.abs(p.z - 400) < 3.2 && Math.abs(p.x) < 19 && p.y < 48) || p.y > 60;
      const sites = [[-15, 336], [17, 340], [-30, 352], [33, 358], [-23, 373], [28, 381], [-39, 392], [43, 398], [-31, 428], [30, 436], [-17, 452], [18, 462], [-44, 466]];
      for (let i = 0; i < sites.length; i++) { const r = ctx.core.makeRng(ctx.core.hashSeed('oak' + i + ':' + ctx.seed)), [sx, sz] = sites[i];
        const x = sx + r.range(-2, 2), z = clamp(sz + r.range(-2.5, 2.5), 331, 469), h = r.range(30, 38), lean = r.range(0.05, 0.2); oakXZ.push([x, z]);
        buildOak(Bk, Tw, r, { x, y: landH(x, z) - 0.3, z, h, lean, twigs: detail, leaves: autumn ? 3.2 : 1, keepOut }); await ctx.yield(); }
      mesh(Bk.build(), mat({ mode: 'bark', col: UMBER, leaf: mixHex(mixHex(UMBER, STRAW, 0.55), ROSE, 0.3), body: 0.6, snow: 1, centers: true, side: THREE.DoubleSide })).name = 'oakWood';
      mesh(ribbonGeometry(Tw), own(fzRibbonMaterial({ col: UMBER, centers: true }))).name = 'oakTwigs'; }
    await ctx.yield();

    // ---------------------------------------------------------------- the shore, z 520 to 560: seven boulders, the watchers' backs, two stocked anchors
    // The watchers' boulder and the anchors lie 12 m to port; the other six boulders are erratics of a man's height and more,
    // none with its rock nearer the axis than 6 m.
    const SH = new FzGeo(), sr = ctx.rng.fork('shore');
    const boulder = (G, x, y, z, rx, ry, rz, sd) => { const N = 11, rs = []; G.center = [x, y, z];
      for (let k = 0; k <= 6; k++) { const t = k / 6, yy = -0.25 + t * 1.25, rad = Math.sqrt(Math.max(1 - Math.pow(Math.abs(t * 1.9 - 0.75) / 1.2, 2.2), 0.02)), ring = [];
        for (let j = 0; j < N; j++) { const a = j / N * TAU + k * 0.3, n = 0.78 + 0.3 * noise.n3(Math.cos(a) * 1.3 + sd, t * 2.2, Math.sin(a) * 1.3); ring.push([x + Math.cos(a) * rx * rad * n, y + yy * ry, z + Math.sin(a) * rz * rad * n, noise.n2(j * 3.3 + sd, k * 2.1) * 0.5, 0]); } rs.push(ring); }
      G.rings(rs.slice(0, 6), true); G.rings([rs[5], rs[6]].map((ring) => ring.map((q) => [q[0], q[1], q[2], q[3], 1])), true);                 // snow lies on its crown only: the body is dark
      const top = rs[6]; for (let j = 1; j + 1 < N; j++) G.tri(top[0], top[j + 1], top[j], 0.2, 1); };
    const shoreY = (x, z) => Math.max(landH(x, z), 0.3);                       // a boulder past the water's edge stands in the shallows, not under them
    const WB = { x: 12.6, z: 540, ry: 2.6 }; WB.y = shoreY(WB.x, WB.z);
    boulder(SH, WB.x, WB.y, WB.z, 3.9, WB.ry, 2.6, 1.7);
    for (let k = 0; k < 6; k++) { const rx = sr.range(1.8, 3.4), ry = sr.range(2.2, 4), rz = sr.range(1.6, 3), x = (k % 2 ? -1 : 1) * (6.6 + rx * 1.1 + Math.pow(sr(), 1.6) * 20), z = sr.range(520, 552);
      const xs = Math.hypot(x - WB.x, (z - WB.z) * 1.4) < 7 + rx ? -x : x;                             // not against the watchers' own: it lies to starboard instead
      boulder(SH, xs, shoreY(xs, z), z, rx, ry, rz, 3 + k * 5.1); }
    mesh(SH.build(), mat({ mode: 'rock', col: UMBER, col2: mixHex(UMBER, SLATE, 0.22), snow: 0, centers: true, side: THREE.DoubleSide })).name = 'boulders';
    // the watchers in berets and cloaks, seated on the boulder, backs to us (two or three by the cast)
    FG.center = [WB.x, WB.y + 2, WB.z];
    for (let k = 0; k < nWatchers; k++) { const x = WB.x + (k - (nWatchers - 1) / 2) * 1.05 + sr.range(-0.1, 0.1), z = WB.z + 0.25 + sr.range(-0.15, 0.15), h = sr.range(1.25, 1.4);
      backFigure(FG, x, WB.y + WB.ry * 0.9, z, h, { hem: 0.02, wide: 1.25, seated: true }); headOn(FG, x, WB.y + WB.ry * 0.9, z, h, { beret: true }); }
    mesh(FG.build(), figMat).name = 'figures';
    // two stocked bower anchors, half sunk and leaning, a shank of 5 m each
    { const G = new FzGeo(), e = new THREE.Euler(), K = 1.4;
      for (const [x, z, ry, rz] of [[10.4, 550, 0.5, 0.42], [14.6, 555.5, -0.9, -0.3]]) { const y = Math.max(landH(x, z), 0) - 0.35; G.center = [x, y, z];
        G.mat = new THREE.Matrix4().makeRotationFromEuler(e.set(0.18, ry, rz)).scale(new THREE.Vector3(K, K, K)).setPosition(x, y, z);
        G.box(-0.13, 0.13, 0, 3.6, -0.11, 0.11, 0, 0.6);                                           // shank
        G.box(-0.16, 0.16, 3.05, 3.35, -1.7, 1.7, 0.25, 1);                                        // the wooden stock, square to the arms
        for (const sz of [-1.1, -0.45, 0.45, 1.1]) G.box(-0.19, 0.19, 3.02, 3.38, sz - 0.05, sz + 0.05, -1, 0);   // its iron hoops
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, b = (k + 1) / 8 * TAU; G.quad([Math.cos(a) * 0.3, 3.85 + Math.sin(a) * 0.3, -0.04], [Math.cos(b) * 0.3, 3.85 + Math.sin(b) * 0.3, -0.04], [Math.cos(b) * 0.2, 3.85 + Math.sin(b) * 0.2, 0.04], [Math.cos(a) * 0.2, 3.85 + Math.sin(a) * 0.2, 0.04], 0.1, 0); }   // ring
        for (const m of [-1, 1]) { let px = 0, py = 0.05; for (let k = 0; k < 5; k++) { const a = 0.25 + k * 0.3, nx = px + m * Math.cos(a) * 0.42, ny = py + Math.sin(a) * 0.42, w = 0.14 - k * 0.012;
            G.hexa([[px, py - w, -0.1], [px, py - w, 0.1], [nx, ny - w, 0.1], [nx, ny - w, -0.1]], [[px, py + w, -0.1], [px, py + w, 0.1], [nx, ny + w, 0.1], [nx, ny + w, -0.1]], -0.1, 0.5); px = nx; py = ny; }
          G.tri([px - m * 0.1, py - 0.5, 0], [px + m * 0.42, py - 0.05, 0], [px - m * 0.02, py + 0.42, 0], 0.15, 0); }   // fluke
        G.mat = null; }
      mesh(G.build(), mat({ mode: 'plain', col: UMBER, col2: mixHex(UMBER, SLATE, 0.22), grain: 4, snow: autumn ? 0 : 0.8, lift: 0.4, centers: true, side: THREE.DoubleSide })).name = 'anchors'; }
    await ctx.yield();

    // ---------------------------------------------------------------- the sea: dull violet slate, level, thin straw dashes under the moon
    const seaGeo = new THREE.BufferGeometry();
    { const xs = [-30000, -4000, -600, -60, 0, 60, 600, 4000, 30000], zs = [-4000, 400, 520, 600, 800, 1100, 1600, 4000, 30000], pos = [], idx = [];
      for (const z of zs) for (const x of xs) pos.push(x, 0, z);
      for (let j = 0; j + 1 < zs.length; j++) for (let i = 0; i + 1 < xs.length; i++) { const a = j * xs.length + i, b = a + xs.length; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      seaGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); seaGeo.setIndex(idx); }
    const seaMat = new THREE.ShaderMaterial({
      uniforms: { ...S, uShip: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector3(0, 0, -9000)) }, uFleetZ: { value: 0 }, uSea: { value: lin(H.sea) }, uSea2: { value: lin(mixHex(H.sea, H.fogLo, 0.5)) }, uGlow: { value: lin(mixHex(H.gap, H.fogLo, 0.45)) }, uDash: { value: lin(STRAW) }, uMist: { value: lin(mixHex(mixHex(H.snow, H.fogLo, 0.27), H.gapOver, 0.15)) } },
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
${STYLE_GLSL}
${STYLE_FRAG_GLSL}
uniform vec3 uSea; uniform vec3 uSea2; uniform vec3 uGlow; uniform vec3 uDash; uniform vec3 uMist; varying vec3 vW;
uniform vec3 uShip[5]; uniform float uFleetZ;   // each brig's keel x and her stern's z before the fleet moves
float dashes(vec2 p, float per, float fwz){
  float row = floor(p.y / per), zr = fract(p.y / per), fw = clamp(fwz / per, 1e-4, 1.);
  float line = 1. - smoothstep(0.1 - fw * 0.5, 0.1 + fw * 0.5, abs(zr - 0.5));
  float xc = p.x / (per * 5.5) + fzHash(vec3(row, 3., 1.)) * 9., cell = floor(xc), xf = fract(xc);
  float on = smoothstep(0.42, 0.54, fzNoise(vec3(cell * 1.7, row * 1.3, uTime * 2.3 + cell)));
  float ends = smoothstep(0.04, 0.2, xf) * (1. - smoothstep(0.75, 0.96, xf));
  return mix(line * on * ends, 0.09, smoothstep(0.35, 0.8, fw)); }
void main(){
  float d = distance(cameraPosition, vW), fwz = max(fwidth(vW.z), 1e-5);
  float rip = fzLine(vW.z * 0.8 + fzNoise(vec3(vW.x * 0.25, uTime * 0.25, vW.z * 0.6)) * 1.6, 0.07) * (1. - smoothstep(45., 90., d));
  vec3 c = fzMix(uSea, uSea2, rip * 0.5 + 0.42 * fzNoise(vec3(vW.x * 0.02, 2., vW.z * 0.05 - uTime * 0.3)));
  float ax1 = vW.x / (30. + d * 0.2), ax2 = vW.x / (5.5 + d * 0.075); float axis = exp(-ax1 * ax1);
  c = fzMix(c, uGlow, smoothstep(40., 1500., d) * (0.25 + 0.6 * axis));
  // level mist lies on the water in long bands across the course and slides seaward
  vec2 mq = vec2(vW.x, vW.z - uTime * 9.); float mfw = fwz * 0.16;
  float mb = fzNoise(vec3(mq.x * 0.011, 3., mq.y * 0.09)) * 0.62 + fzNoise(vec3(mq.x * 0.03, 9., mq.y * 0.22)) * 0.38;
  float band = mix(smoothstep(0.43, 0.57, mb), 0.4, smoothstep(0.3, 0.9, mfw)) * smoothstep(6., 22., d) * smoothstep(548., 580., vW.z);
  c = fzMix(c, uMist, band * 0.9);
  // each brig glides seaward and draws her wake: two thin broken lines opening astern of her, in the mist's pale slate
  float wk = 0., fwx = max(fwidth(vW.x), 1e-5);
  for (int i = 0; i < 5; i++) { vec2 l = vec2(vW.x - uShip[i].x, uShip[i].z + uFleetZ - vW.z);
    float arm = abs(abs(l.x) - (2.8 + l.y * 0.2)), w = 0.12 + l.y * 0.012;
    wk = max(wk, smoothstep(-3., 1., l.y) * (1. - smoothstep(4., 26., l.y)) * (1. - smoothstep(w, w + max(fwx, 0.15), arm))); }
  c = fzMix(c, uMist, wk * 0.45 * smoothstep(0.3, 0.6, fzNoise(vec3(vW.x * 1.3, uTime * 0.6, vW.z * 0.45))));
  float l = log2(max(d, 6.) / 12.), f = fract(l), per = 0.5 * exp2(floor(l));
  float ds = mix(dashes(vW.xz, per, fwz), dashes(vW.xz, per * 2., fwz), f);
  float env = exp(-ax2 * ax2) * smoothstep(545., 575., vW.z) * (1. - smoothstep(900., 6000., d) * 0.6);
  c = mix(c, uDash, clamp(ds * env, 0., 1.));
  c = fzFog(c, cameraPosition, vW);
  gl_FragColor = vec4(c, 1.);
}` });
    mesh(seaGeo, seaMat, -3);
    await ctx.yield();

    // ---------------------------------------------------------------- ships: five brigs under full sail, sterns to us; two smacks aground
    // Each a drawn thing in umber and one close second value: a planked hull with two wales, a transom with a row of unlit
    // lights, taffrail, rudder, a deck with its houses and a boat on chocks; lower masts, tops, topmasts; yards with lifts and
    // footropes; set sails bellied away from us with seams, reef bands and reef points; shrouds with ratlines, backstays,
    // braces, stays, jibs, a spanker. Masts, yards and rigging are ribbons with the 1.5 pixel floor.
    const hullHalf = (B, t) => B / 2 * (t < 0.4 ? lerp(0.8, 1, smoothstep(0, 0.4, t)) : Math.sqrt(Math.max(1 - Math.pow((t - 0.4) / 0.6, 2.4), 0.0009)));
    const hullInto = (G, L, B, D, o = {}) => {       // local: stern at z -L/2, bow at +L/2, waterline y 0
      const NS = o.stations ?? 12, rs = [], kl = o.keel ?? 1;
      for (let k = 0; k <= NS; k++) { const t = k / NS, z = -L / 2 + L * t, b = hullHalf(B, t);
        const d = D * (0.82 + 0.5 * Math.pow(Math.abs(t - 0.42) * 1.7, 2)) * (o.low ?? 1), side = [[0.05, -0.9 * kl, -0.5], [0.55, -0.7 * kl, -0.3], [0.92, 0, -0.5], [1, d * 0.3, 0.1], [1, d * 0.55, -0.25], [0.97, d * 0.8, 0.1], [0.93, d, -0.3], [0.9, d + 0.5, 0.3], [0.82, d + 0.5, 0.3], [0.82, d - 0.1, -0.6]];
        const ring = side.map(([f, y, v]) => [b * f, y, z, v, 0]).concat(side.slice().reverse().map(([f, y, v]) => [-b * f, y, z, v, 0])); rs.push(ring); }
      G.rings(rs, true);
      const st = rs[0], n = st.length / 2;                                   // the transom
      for (let j = 0; j + 1 < n; j++) G.quad(st[j], st[j + 1], st[2 * n - 2 - j], st[2 * n - 1 - j], j % 2 ? -0.15 : 0.12, 0);
      if (!o.plain) { const d = D * 0.95, zt = -L / 2 - 0.03, nw = o.lights ?? 5;
        for (let w = 0; w < nw; w++) { const xw = (w - (nw - 1) / 2) * B * 0.75 / nw, hw = B * 0.26 / nw;       // unlit lights, each with its glazing bars
          G.quad([xw - hw, d * 0.52, zt], [xw + hw, d * 0.52, zt], [xw + hw, d * 0.8, zt], [xw - hw, d * 0.8, zt], -1.5, 0);
          G.quad([xw - 0.03, d * 0.52, zt - 0.02], [xw + 0.03, d * 0.52, zt - 0.02], [xw + 0.03, d * 0.8, zt - 0.02], [xw - 0.03, d * 0.8, zt - 0.02], 0.6, 0);
          G.quad([xw - hw, d * 0.65, zt - 0.02], [xw + hw, d * 0.65, zt - 0.02], [xw + hw, d * 0.68, zt - 0.02], [xw - hw, d * 0.68, zt - 0.02], 0.6, 0); }
        G.quad([-B * 0.4, d * 0.86, zt], [B * 0.4, d * 0.86, zt], [B * 0.38, d * 0.93, zt], [-B * 0.38, d * 0.93, zt], 0.5, 0);
        G.quad([-B * 0.39, d * 0.4, zt], [B * 0.39, d * 0.4, zt], [B * 0.39, d * 0.45, zt], [-B * 0.39, d * 0.45, zt], 0.5, 0);
        G.box(-B * 0.41, B * 0.41, D + 0.5, D + 0.74, -L / 2 - 0.14, -L / 2 + 0.12, 0.3, 0);                      // taffrail
        for (const m of [-1, 1]) G.box(Math.min(m * B * 0.36, m * B * 0.43), Math.max(m * B * 0.36, m * B * 0.43), d * 0.36, D + 0.5, -L / 2 - 0.1, -L / 2 + 0.5, -0.3, 0);   // quarter pieces
        G.box(-0.14, 0.14, -1, d * 0.5, -L / 2 - 0.5, -L / 2, -0.4, 0);     // rudder
        for (const m of [-1, 1]) for (const [wy, wh] of [[D * 0.36, 0.34], [D * 0.84, 0.2]]) { const ws = [];                 // two wales, proud of the planking
          for (let k = 0; k <= NS; k++) { const t = k / NS, z = -L / 2 + L * t, b = hullHalf(B, t), dy = (D * (0.82 + 0.5 * Math.pow(Math.abs(t - 0.42) * 1.7, 2)) - D * 0.82) * (wy / D);
            ws.push([[m * (b * 0.99), wy + dy - 0.02, z, -1.5, 0], [m * (b + 0.1), wy + dy, z, -1.5, 0], [m * (b + 0.1), wy + dy + wh, z, -1.5, 0], [m * (b * 0.99), wy + dy + wh + 0.02, z, -1.5, 0]]); }
          G.rings(ws, false); } }
    };
    // a square sail between two yards (wb = foot width factor); returns its surface point at (across 0..1, up 0..1)
    const sailInto = (G, x0, x1, yb, yt, z, wb, belly) => {
      const NX = 6, NY = 4, rs = [], pt = (u, v, off = 0) => { const w = lerp(wb, 1, v); return [lerp(x0, x1, 0.5 + (u - 0.5) * w), lerp(yb, yt, v) + (1 - v) * Math.pow(Math.abs(u - 0.5) * 2, 2) * 0.5, z + off + belly * Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + 0.85 * (1 - v)))]; };
      for (let j = 0; j <= NY; j++) { const ring = []; for (let i = 0; i <= NX; i++) { const q = pt(i / NX, j / NY); ring.push([q[0], q[1], q[2], (i & 1) ? 0.12 : -0.1, 0]); } rs.push(ring); }
      G.rings(rs, false); return pt;
    };
    const seg = (R, a, b, w, c) => { R.push(a[0], a[1], a[2], b[0], b[1], b[2], w); R.cen.push(c[0], c[1], c[2]); };
    const brigInto = (G, GS, GP, R, x, z, V) => {    // G planked wood, GS square sails (seams run up them), GP fore-and-aft canvas, R ribbons        // V: her own cut (length, royals, lights, a stern boat, the spanker set or brailed)
      const c = [x, 6, z], L = 30 * V.len, B = 7.6, D = 4.2; G.center = c; GS.center = c; GP.center = c;
      const M = new THREE.Matrix4().setPosition(x, 0, z); G.mat = M; hullInto(G, L, B, D, { stations: 16, lights: V.lights });
      G.box(-0.9, 0.9, D - 0.1, D + 1.3, -L * 0.31, -L * 0.23, 0.2, 0); G.box(-0.55, 0.55, D - 0.1, D + 0.65, -L * 0.17, -L * 0.1, -0.2, 0);          // companion, skylight
      G.box(-1.25, 1.25, D - 0.1, D + 1.5, 9.4, 12, 0.1, 0); G.box(-1.5, 1.5, D - 0.1, D + 0.75, L * 0.36, L * 0.385, -0.3, 0);                         // galley, windlass
      G.box(-0.5, 0.5, D - 0.1, D + 1.15, -L * 0.42, -L * 0.4, -0.2, 0);                                                                              // the wheel's box
      G.mat = new THREE.Matrix4().setPosition(x, D + 0.75, z + 2.4); hullInto(G, 5.6, 1.9, 0.75, { plain: true, keel: 0.3, stations: 6 });              // the longboat on its chocks
      if (V.boat) { G.mat = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(x, D - 0.5, z - L / 2 - 1.5); hullInto(G, 4.6, 1.6, 0.6, { plain: true, keel: 0.3, stations: 6 }); }   // a boat hung across the stern
      G.mat = null;
      const P = (lx, ly, lz) => [x + lx, ly, z + lz];
      if (V.boat) for (const m of [-1, 1]) { seg(R, P(m * 1.7, D + 0.7, -L / 2 + 0.4), P(m * 1.7, D + 1.6, -L / 2 - 1.6), 0.15, c); seg(R, P(m * 1.7, D + 1.6, -L / 2 - 1.5), P(m * 1.7, D + 0.1, -L / 2 - 1.5), 0.03, c); }   // davits and falls
      else { seg(R, P(0, D + 0.6, -L / 2), P(0, D + 4.4, -L / 2 - 1.3), 0.09, c);                                                                      // or an ensign staff, the ensign hanging
        const fs = []; for (let j = 0; j <= 4; j++) { const t = j / 4; fs.push([[x - 0.08 - 0.5 * t * (1 - t), D + 4.3 - t * 2.4, z - L / 2 - 1.3 + t * 0.3, -0.1, 0], [x + 0.3 + 0.35 * t, D + 4.2 - t * 2.5, z - L / 2 - 1.32 + t * 0.2, 0.12, 0]]); } GS.rings(fs, false); }
      for (const [mz, mh0, f] of [[-3.5, 31, 1], [7.5, 28.5, 0.92]]) { const mh = mh0 * V.rig, top = mh * 0.44, cross = mh * 0.76;
        seg(R, P(0, D, mz), P(0, top + 1.6, mz), 0.56, c); seg(R, P(0, top, mz + 0.3), P(0, cross + 1.2, mz + 0.3), 0.36, c); seg(R, P(0, cross, mz), P(0, mh, mz), 0.2, c);
        G.box(x - 1.15, x + 1.15, top, top + 0.14, z + mz - 0.9, z + mz + 0.7, 0.2, 0); seg(R, P(-0.8, cross, mz), P(0.8, cross, mz), 0.12, c);   // the top and the crosstrees
        const yards = [[8.3, 6.6], [15.6, 5.5], [21.8, 4.3], [26.6, 3.2]].concat(V.royals ? [[30.3, 2.3]] : []).map(([y, hw]) => [y * mh0 / 31 * (V.royals ? 0.94 : 1) * V.rig + 0.6, hw * f]);
        yards.forEach(([y, hw], k) => { seg(R, P(-hw, y, mz), P(hw, y, mz), 0.26 - k * 0.035, c);
          const foot = k === 0 ? D + 1.6 : yards[k - 1][0] + 0.35, fw = k === 0 ? 0.96 : yards[k - 1][1] / hw;
          const pt = sailInto(GS, x - hw * 0.97, x + hw * 0.97, foot, y - 0.12, z + mz + 0.25, Math.min(fw, 1.25), 1.5 - k * 0.2);
          // K1: THE NEAR BRIG IS DRAWN (the designer's fourth word, 1): a bolt rope round each square sail, of the reef bands' own
          // 9 cm (a pixel and a half of the working look at 20 m), in umber on the cloth's second value; and snow on the upper
          // side of the yard, a cap 8 cm thick whose underside is dark
          for (let i = 0; i < 6; i++) for (const e of [0, 1]) seg(R, pt(i / 6, e, -0.05), pt((i + 1) / 6, e, -0.05), 0.09, c);
          for (let j = 0; j < 4; j++) for (const e of [0, 1]) seg(R, pt(e, j / 4, -0.05), pt(e, (j + 1) / 4, -0.05), 0.09, c);
          { const yw = (0.26 - k * 0.035) / 2, y0 = y + yw - 0.02, y1 = y0 + 0.08, a = [x - hw, z + mz - yw], b = [x + hw, z + mz + yw];
            G.quad([a[0], y1, a[1]], [b[0], y1, a[1]], [b[0], y1, b[1]], [a[0], y1, b[1]], 0, 1); G.quad([a[0], y0, a[1]], [b[0], y0, a[1]], [b[0], y1, a[1]], [a[0], y1, a[1]], 0, 1);
            G.quad([a[0], y0, b[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, b[1]], 0, 1); G.quad([a[0], y0, a[1]], [b[0], y0, a[1]], [b[0], y0, b[1]], [a[0], y0, b[1]], 0, 0); }
          for (const vb of k === 0 ? [0.8] : k === 1 ? [0.62, 0.8] : []) for (let i = 0; i < 12; i++) { seg(R, pt(i / 12, vb, -0.05), pt((i + 1) / 12, vb, -0.05), 0.09, c); seg(R, pt((i + 0.5) / 12, vb, -0.06), pt((i + 0.5) / 12, vb - 0.07, -0.08), 0.035, c); }   // reef bands and points
          for (const m of [-1, 1]) { seg(R, P(m * hw, y, mz), P(m * B * 0.5, D + 0.6, mz - 6.5), 0.045, c);                                           // brace, aft to the rail
            seg(R, P(m * hw, y, mz), P(0, y + hw * 0.42, mz), 0.035, c); seg(R, P(m * hw, y - 0.05, mz - 0.12), P(m * hw * 0.5, y - 0.75, mz - 0.12), 0.03, c); seg(R, P(m * hw * 0.5, y - 0.75, mz - 0.12), P(0, y - 0.3, mz - 0.12), 0.03, c); } });   // lift, footrope
        for (const m of [-1, 1]) { const a0 = P(m * B * 0.49, D + 0.4, mz - 0.5), a1 = P(m * B * 0.49, D + 0.4, mz - 3.3), b0 = P(m * 0.75, top, mz - 0.1), b1 = P(m * 0.75, top, mz - 0.6);
          const on = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
          for (let s = 0; s < 5; s++) seg(R, on(a0, a1, s / 4), on(b0, b1, s / 4), 0.055, c);                                                        // shrouds
          for (let j = 1; j <= 13; j++) seg(R, on(a0, b0, j / 14), on(a1, b1, j / 14), 0.028, c);                                                    // ratlines
          const t0 = P(m * 1.1, top + 0.1, mz - 0.1), t1 = P(m * 1.1, top + 0.1, mz - 0.8), u0 = P(m * 0.25, cross, mz), u1 = P(m * 0.25, cross, mz - 0.2);
          for (let s = 0; s < 3; s++) seg(R, on(t0, t1, s / 2), on(u0, u1, s / 2), 0.045, c); for (let j = 1; j <= 7; j++) seg(R, on(t0, u0, j / 8), on(t1, u1, j / 8), 0.025, c);   // topmast shrouds
          seg(R, P(m * B * 0.47, D + 0.4, mz - 4.2), P(0, cross, mz), 0.04, c); seg(R, P(m * B * 0.46, D + 0.4, mz - 5), P(0, mh * 0.98, mz), 0.035, c); }   // backstays
      }
      const mhM = 31 * V.rig, mhF = 28.5 * V.rig, jb = P(0, D + 5.2, L / 2 + 8.5);
      seg(R, P(0, D + 1.2, L / 2 - 0.5), P(0, D + 3.6, L / 2 + 4.5), 0.34, c); seg(R, P(0, D + 3.4, L / 2 + 3.5), jb, 0.2, c);                       // bowsprit, jibboom
      seg(R, P(0, mhF * 0.76, 7.5), jb, 0.045, c); seg(R, P(0, mhF * 0.44, 7.5), P(0, D + 3.6, L / 2 + 4.5), 0.05, c); seg(R, P(0, mhM * 0.44, -3.5), P(0, D + 1, 6.6), 0.05, c); seg(R, P(0, mhM * 0.76, -3.5), P(0, mhF * 0.44, 7.5), 0.04, c); seg(R, P(0, mhM, -3.5), P(0, mhF * 0.76, 7.5), 0.035, c);   // stays
      GP.tri(P(0, D + 4.4, L / 2 + 6), jb, P(0, mhF * 0.7, 8.2), -0.1, 0); GP.tri(P(0, D + 3.2, L / 2 + 1.5), P(0, D + 4.1, L / 2 + 5.4), P(0, mhF * 0.42, 8), 0.12, 0);   // jibs, edge on to us
      seg(R, P(0, 12.5, -3.9), P(0, 16.5, -12), 0.2, c); seg(R, P(0, 5.6, -3.9), P(0, 5.9, -L / 2 - 0.4), 0.22, c); seg(R, P(0, 16.5, -12), P(0, mhM * 0.76, -3.5), 0.04, c);   // gaff, boom, peak halyard
      if (V.spanker) GP.quad(P(0, 12.3, -4.1), P(0, 16.3, -11.9), P(0, 6.2, -L / 2 - 0.2), P(0, 6, -4.1), -0.1, 0);                                    // the spanker, edge on to us (or brailed up)
      // K1: the fore-and-aft canvas is drawn too: a bolt rope round each jib and round the spanker, and the spanker's reef band
      // a quarter of the way up it; the ropes lie 6 cm off the cloth on the side toward the axis, where the eye passes
      { const o = x > 0 ? -0.06 : 0.06, Q = (lx, ly, lz) => [x + o, ly, z + lz], on = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], round = (q) => q.forEach((a, i) => seg(R, a, q[(i + 1) % q.length], 0.09, c));
        round([Q(0, D + 4.4, L / 2 + 6), [jb[0] + o, jb[1], jb[2]], Q(0, mhF * 0.7, 8.2)]); round([Q(0, D + 3.2, L / 2 + 1.5), Q(0, D + 4.1, L / 2 + 5.4), Q(0, mhF * 0.42, 8)]);
        if (V.spanker) { const q = [Q(0, 12.3, -4.1), Q(0, 16.3, -11.9), Q(0, 6.2, -L / 2 - 0.2), Q(0, 6, -4.1)]; round(q); seg(R, on(q[3], q[0], 0.25), on(q[2], q[1], 0.25), 0.09, c); } }
      { const rs = []; for (let k = 0; k <= 5; k++) { const w = 0.34 * (1 - k / 6.5); rs.push([[x - w, mhM - k * 0.7, z - 3.5, (k & 1) ? 0.12 : -0.1, 0], [x + w, mhM - k * 0.7, z - 3.5, (k & 1) ? 0.12 : -0.1, 0]]); } GS.rings(rs, false); }   // her pennant, hanging
    };
    const tPassOf = (z) => tAtU(uAtZ(z)), T0 = tAtU(U.abbey0), SHIP_V = 5;
    // a brig every 80 m, by turns to port and starboard (port +), 8 to 20 m off; the one the eye draws level with at z 720 is 8 m to starboard.
    // K2: THE BRIGS' TURNS, NEARER (the designer's fourth word, 2). The opening is the lit pointed arch between the two smacks'
    // masts (feet 10.07 m to either side of the axis at y 2.18, hounds 4.07 m at y 15.81, tops 0.38 m at y 24.22, in the plane
    // z 998.5). A brig the eye draws level with past z 800 stands as near the axis as keeps the opening clear: her keel's
    // distance is ONE number, found once in a print and typed here. For every eye on the route from z 800 until she is abeam
    // (every 2 m of route, seeds 1 to 40, her own cut and her glide at 5 m a second) each point of her hull, yards and sails was
    // carried along its line from the eye to the arch's plane; the least keel distance at which none falls inside the arch's
    // inner outline is 9.55 m for the fourth brig and 12.15 m for the fifth (the far eye at z 800 asks most); a metre to spare,
    // rounded up to the decimetre, inside the design's 8 to 20 m. Nothing is read in flight.
    const BRIGS = [[13, 640], [-8, 720], [18, 800], [-10.6, 880], [13.2, 960]];   // x of her keel, and the z where the eye draws level with her stern
    const bq = ctx.core.makeRng(ctx.core.hashSeed('brigs:' + ctx.seed));
    const HG = new FzGeo(), HS = new FzGeo(), HP = new FzGeo(), HR = []; HR.cen = [];
    const brigAt = BRIGS.map(([x, zp]) => [x, zp - SHIP_V * (tPassOf(zp) - T0)]);                 // where each lies before the fleet moves
    for (const [x, z] of brigAt) { brigInto(HG, HS, HP, HR, x, z + 15, { len: bq.range(0.93, 1.05), rig: bq.range(0.95, 1.05), royals: bq.chance(0.5), lights: bq.chance(0.5) ? 5 : 7, boat: bq.chance(0.5), spanker: bq.chance(0.6) }); await ctx.yield(); }   // z + 15: the keel's middle lies half a hull ahead of the stern
    brigAt.forEach(([x, z], i) => seaMat.uniforms.uShip.value[i].set(x, 0, z));
    const hullMat = mat({ mode: 'plank', col: UMBER, col2: mixHex(UMBER, SLATE, 0.2), snow: 0, lift: 0.3, body: 0.55, centers: true, side: THREE.DoubleSide });
    const smackMat = mat({ mode: 'plain', col: UMBER, col2: mixHex(UMBER, SLATE, 0.2), grain: 2.5, snow: 0, lift: 0.3, centers: true, side: THREE.DoubleSide });
    const sailMat = mat({ mode: 'lines', col: UMBER, col2: mixHex(UMBER, SLATE, 0.26), grain: 1.1, snow: 0, lift: 0.5, body: 0.75, centers: true, side: THREE.DoubleSide });
    sailMat.uniforms.uSway.value.set(0.22, 0.8);                          // hung canvas stirs, slowly
    const rigMat = own(fzRibbonMaterial({ col: UMBER, centers: true }));
    const fleet = new THREE.Group(); scene.add(fleet);
    const canvasMat = mat({ mode: 'canvas', col: UMBER, col2: mixHex(UMBER, SLATE, 0.26), grain: 1.1, snow: 0, body: 0.7, centers: true, side: THREE.DoubleSide });   // K1: the 'canvas' mode with the square sails' cloth width (it was mode 'plain', grain 0.6: a faint grain, no seam)
    for (const m of [new THREE.Mesh(HG.build(), hullMat), new THREE.Mesh(HS.build(), sailMat), new THREE.Mesh(HP.build(), canvasMat), new THREE.Mesh(ribbonGeometry(HR), rigMat)]) { m.frustumCulled = false; fleet.add(m); }
    await ctx.yield();

    // the exit: a sand bar at z 1000 and two fishing smacks aground on it, heeled together so that masts, gaffs and hung sails
    // make a pointed arch 24 m high with the horizon's light in it. The portal stands level between the two masts.
    const portal = { shape: 'arch', width: 12, height: 17, blendDistance: 25, veil: '#EFE0A0', color: '#EFE0A0', glow: 0, halo: false };
    const EX = path.pointAt(1, new THREE.Vector3());
    { const G = new FzGeo(), rs = []; G.center = [0, 0, EX.z];
      for (let k = 0; k <= 9; k++) { const t = k / 9, ring = []; for (let j = 0; j < 40; j++) { const a = j / 40 * TAU, n = 0.8 + 0.3 * noise.n2(Math.cos(a) * 2 + 3, Math.sin(a) * 2); ring.push([Math.cos(a) * 52 * t * n, 1.05 * (1 - t * t) - 0.45 + noise.n2(j * 0.9, k * 1.3) * 0.1, EX.z + 1 + Math.sin(a) * 17 * t * n, noise.n2(j * 1.7, k * 2.3) * 0.5, 0]); } rs.push(ring); }
      G.rings(rs, true); mesh(G.build(), mat({ mode: 'plain', col: UMBER, col2: mixHex(UMBER, SLATE, 0.3), grain: 3, snow: autumn ? 0 : 0.5, lift: 0.5, body: 0.7, centers: true, side: THREE.DoubleSide })); }
    { const G = new FzGeo(), GS = new FzGeo(), R = []; R.cen = []; const c = [0, 8, EX.z - 3], th = 0.416, v3 = new THREE.Vector3();
      for (const m of [1, -1]) {
        const M = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, m * 0.1, m * th)).setPosition(m * 10.75, 0.35, EX.z - 3);
        const W = (x, y, z) => { v3.set(x, y, z).applyMatrix4(M); return [v3.x, v3.y, v3.z]; };
        G.center = c; GS.center = c; G.mat = M; hullInto(G, 14, 4.6, 2.1, { plain: true }); G.box(-0.1, 0.1, -0.8, 1.2, -7.4, -7, -0.4, 0); G.mat = null;
        const foot = W(0, 2, 1.2), junc = W(0, 16.9, 1.2), top = W(0, 26.1, 1.2);
        seg(R, foot, junc, 0.36, c); seg(R, junc, top, 0.26, c);   // mast, topmast (the two tips meet: the arch's point), the gaff let down
        seg(R, W(0, 2.6, 1), W(0, 3.4, -8.5), 0.2, c); seg(R, W(0, 2.2, 6.5), W(0, 3.2, 11.5), 0.2, c);              // boom, bowsprit
        seg(R, top, W(0, 3.2, 11.5), 0.04, c); seg(R, W(0, 16, 1.2), W(0, 2.4, 7), 0.04, c);
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) seg(R, W(s * 2.2, 2.3, 0.6 - k * 0.7), W(0, 16, 1.2), 0.045, c);
        // hung sails: the spandrel between gaff and topmast, and the mainsail let down in folds on the outer side
        const rs = []; for (let j = 0; j <= 5; j++) { const t = j / 5, ring = []; for (let i = 0; i <= 6; i++) { const u = i / 6, a = W(0, lerp(4.2, 18.4, t), 1.0), out = m * (0.5 + 6.6 * u * (1 - 0.3 * t)) ;
            ring.push([a[0] + out, a[1] - u * (2.2 + 2.5 * t) + Math.sin(u * 9 + t * 3) * 0.25, a[2] - u * 1.4 + Math.sin(u * 7 + j) * 0.3, (i & 1) ? 0.14 : -0.12, 0]); } rs.push(ring); }
        GS.rings(rs, false);
        // the point of the arch: a sail hung from each mast toward the other, its inner leech an arc that springs 4 m over the sea
        // at the opening's own half width and meets its fellow at the opening's crown; above the crown the two close the V of the
        // masts. It hangs between the masts' plane and the opening, a metre before it, so the horizon's light is cut to a tall point
        // by dark canvas whatever stands behind. The way through at the eye's height keeps 5.6 m either side of the axis.
        { const hw = portal.width / 2, crown = EX.y + portal.height / 2, spring = 4, rise = crown - spring, cx = (rise * rise - hw * hw) / (2 * hw), rs2 = [], NY = 12, NX = 5;
          const leech = (y) => (y >= crown ? 0 : y <= spring ? hw : Math.sqrt(Math.max((hw + cx) * (hw + cx) - (y - spring) * (y - spring), 0)) - cx);
          for (let j = 0; j <= NY; j++) { const y = lerp(3.1, 23.2, Math.pow(j / NY, 0.9)), mp = W(0, (y - 0.35) / Math.cos(th), 1.2), xl = leech(y), ring = [];
            for (let i = 0; i <= NX; i++) { const u = i / NX, x = lerp(Math.min(xl, Math.abs(mp[0]) - 0.05), Math.abs(mp[0]), u);
              ring.push([m * x, y - Math.sin(u * Math.PI) * 0.35 * (y < crown ? 1 : 0.3), lerp(EX.z - 1.0, mp[2], u) + Math.sin(u * 8 + j * 1.3) * 0.18, (i & 1) ? 0.14 : -0.12, 0]); } rs2.push(ring); }
          GS.rings(rs2, false); }
      }
      mesh(G.build(), smackMat); mesh(GS.build(), sailMat); mesh(ribbonGeometry(R), rigMat); }
    await ctx.yield();

    // the far arch carries the horizon's straw at its full value, flat, as the horizon band beside it does: under the cloud bank the
    // sky is not veiled by the thin haze and the ground mist, and neither is the opening (the designer's second word: as bright as
    // the horizon, the brightest value on the axis). Only the slab's own fog lies over it, as it lies over the horizon band in the
    // sky's own rule: to an eye inside the slab or above it (in the blind, and over the wall) it is the fog that is seen, not a
    // straw dot; as the eye comes out under the slab the band and the opening come clear together.
    { const hx = portal.width / 2, hy = portal.height / 2, sh = new THREE.Shape(); sh.moveTo(-hx, -hy); sh.lineTo(hx, -hy); sh.lineTo(hx, hy - hx); sh.absarc(0, hy - hx, hx, 0, Math.PI, false); sh.lineTo(-hx, -hy);
      const g = new THREE.ShapeGeometry(sh, 24); g.rotateY(Math.PI); g.translate(EX.x, EX.y, EX.z - 0.6);                   // the opening's own outline
      const m = new THREE.ShaderMaterial({
        uniforms: { ...S },
        vertexShader: /* glsl */`varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
${STYLE_GLSL}
varying vec3 vW;
void main(){
  vec3 dv = vW - cameraPosition; float L = length(dv);
  float f = smoothstep(uSlab.x - 0.5, uSlab.x + 0.5, cameraPosition.y);       // the slab's fog over the horizon, as the sky has it: whole to an eye in the slab or over it, none under it
  float a = f * smoothstep(25., 60., L);
  if (a < 0.004) discard;
  float ov = min(max(cameraPosition.y, vW.y), uSlab.y) - max(min(cameraPosition.y, vW.y), uSlab.x);
  float yc = mix(mix(cameraPosition.y, vW.y, 0.6), clamp(cameraPosition.y, uSlab.x, uSlab.y), smoothstep(0., 1.5, ov));
  gl_FragColor = vec4(fzVeil(fzFogCol(yc), cameraPosition, dv / max(L, 1e-4), L), a);     // the slab's fog on this ray, laid over the opening
}`, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      mesh(g, m, 30).name = 'archFog'; }

    // ---------------------------------------------------------------- level mist: at our feet on the crag, over the yard, the shore and the water
    let seaMist = null;
    { const r = ctx.rng.fork('mist'), n = (k) => Math.round(k * detail * clamp(vary.density ?? 1, 0.7, 1.3)), a = [], b = [], c = [];
      for (let k = 0; k < n(46); k++) { const x = (r.chance(0.5) ? 1 : -1) * r.range(8, 34), z = r.range(-45, 70); a.push({ x, y: Math.max(cragTop(x, clamp(z, -40, 20)), 112) + r.range(0.4, 2.2), z, w: r.range(9, 20), h: r.range(1, 2.6), speed: r.range(4, 9), opacity: r.range(0.25, 0.45), seed: r() }); }   // never a pale sheet behind his back
      // the yard's sheets: most lie low; a few hang at the sill's height and slide through the lancet
      for (let k = 0; k < n(110); k++) { const x = r.range(-70, 70), z = r.range(318, 545), ty = (r.range(0.8, 3.6) - 0.8) / 2.8; b.push({ x, y: landH(x, 420) + 0.8 + 8 * ty * ty, z, w: r.range(12, 30), h: r.range(1.4, 3.8), speed: r.range(2.5, 6), opacity: r.range(0.4, 0.75), seed: r() }); }
      for (let k = 0; k < n(125); k++) { const x = r.range(-150, 150) * (0.3 + 0.7 * r()), z = r.range(556, 1040); c.push({ x, y: r.range(0.5, 2.8), z, w: r.range(26, 70), h: r.range(1.4, 3.4), speed: r.range(4, 9), opacity: r.range(0.38, 0.68), seed: r() }); }
      // each field's ground map: a sheet fades to nothing over whatever solid it would meet (the crag's rock; the yard's snow, wall,
      // piers and boles, with the lancet and the door left open; the shore, the smacks on their bar, and the brigs' hulls, which travel)
      const gA = await mistGround({ x0: -46, x1: 46, z0: -50, z1: 76, nx: 32, nz: 44, h0: 96, hs: 40, soft: 2 }, (x, z, f) => { f[0] = cragTop(x, z); }, ctx.yield);
      const gB = await mistGround({ x0: -84, x1: 84, z0: 312, z1: 552, nx: 72, nz: 102, h0: 3, hs: 14, soft: 1.3 }, (x, z, f) => { hero.solidAt(x, z - 400, f);
        f[0] += 4; if (f[2] != null) f[2] += 4; f[1] = 3; for (const [ox, oz] of oakXZ) if (Math.abs(x - ox) < 2.4 && Math.hypot(x - ox, z - oz) < 2.4) f[0] = 99; }, ctx.yield);
      const gC = await mistGround({ x0: -60, x1: 60, z0: 540, z1: 1060, nx: 48, nz: 208, h0: -2, hs: 10, soft: 1 }, (x, z, f) => {
        f[0] = z < 572 ? Math.max(landH(x, z), 0) : 0; if (Math.abs(z - EX.z + 3) < 9 && Math.abs(Math.abs(x) - 12) < 7) f[0] = 99;      // the smacks and their hung sails
        for (const [bx, bz] of brigAt) if (Math.abs(x - bx) < 4.8 && Math.abs(z - bz - 15) < 17.5) f[1] = 99; }, ctx.yield);
      mesh(mistGeometry(a), own(fzMistMaterial({ z0: -45, z1: 70, nearFade: 7, ground: gA })), 5);
      mesh(mistGeometry(b), own(fzMistMaterial({ z0: 318, z1: 545, nearFade: 4, tint: H.snow, tintAmt: 0.4, ground: gB })), 5);
      seaMist = mesh(mistGeometry(c), own(fzMistMaterial({ z0: 556, z1: 1040, nearFade: 5, tint: mixHex(H.gapOver, H.snow, 0.4), tintAmt: 0.3, ground: gC })), 5); }

    // two cuts of the one spire by each fir's own distance from the route; one material
    { const firMat = mat({ mode: 'fir', col: FIR, col2: mixHex(FIR, UMBER, 0.8), snow: 0, side: THREE.DoubleSide });
      const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), ps = new THREE.Vector3();
      const nearF = firs.filter((f) => routeD(f[0], f[2]) < 45), farF = firs.filter((f) => routeD(f[0], f[2]) >= 45);
      for (const [list, geo] of [[nearF, firGeoOf(9, 6)], [farF, firGeoOf(7, 5)]]) { if (!list.length) continue;
        const im = new THREE.InstancedMesh(geo, firMat, list.length);
        list.forEach((f, i) => { m4.compose(ps.set(f[0], f[1], f[2]), qq.setFromAxisAngle(up, f[5]), sc.set(f[3] * f[4], f[3], f[3] * f[4])); im.setMatrixAt(i, m4); });
        im.frustumCulled = false; im.name = 'firs'; scene.add(im); } }
    await ctx.yield();

    // ---------------------------------------------------------------- the raven that beats beside the eye, and the rare owl
    const nearRaven = soloBird(ravenGeometry(), { col: UMBER }); own(nearRaven.material); scene.add(nearRaven);
    const owlGeo = (() => { const G = new FzGeo(), wing = [];
      const body = (z, r, y) => { const ring = []; for (let j = 0; j < 6; j++) { const a = j / 6 * TAU; ring.push([Math.cos(a) * r, y + Math.sin(a) * r * 0.9, z, j % 2 ? -0.3 : 0.1, 0]); } return ring; };
      G.rings([body(-0.2, 0.03, 0), body(-0.1, 0.1, 0), body(0.08, 0.13, 0), body(0.2, 0.12, 0.01), body(0.27, 0.125, 0.02), body(0.34, 0.1, 0.02), body(0.39, 0.02, 0.01)], true);
      G.quad([-0.1, 0, -0.12], [0.1, 0, -0.12], [0.12, 0, -0.3], [-0.12, 0, -0.3], -0.3, 0);
      while (wing.length < G.n) wing.push(0);
      for (const m of [-1, 1]) { const P = (x, z) => [m * x, 0.03, z], add = (pts, v) => { pts.length === 4 ? G.quad(pts[0], pts[1], pts[2], pts[3], v, 0) : G.tri(pts[0], pts[1], pts[2], v, 0); for (const q of pts) wing.push(q[0]); };
        add([P(0.06, 0.2), P(0.3, 0.24), P(0.3, -0.14), P(0.06, -0.16)], 0.1); add([P(0.3, 0.24), P(0.52, 0.2), P(0.54, -0.1), P(0.3, -0.14)], -0.12);
        for (let f = 0; f < 5; f++) { const z = 0.19 - f * 0.065; add([P(0.52, z + 0.03), P(0.7 - f * 0.025, z - 0.03), P(0.53, z - 0.06)], f & 1 ? 0.15 : -0.2); } }
      const g = G.build(); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1)); return g; })();
    const owl = soloBird(owlGeo, { col: UMBER, grain: 2 }); own(owl.material); scene.add(owl);
    owl.material.uniforms.uAmp.value = 0.85;
    await ctx.yield();

    // ---------------------------------------------------------------- gaze: one straight axis, the horizon at two fifths of the frame
    // a point far down the axis, 4 degrees up, always: the eye comes down to the wall, the gaze does not sink to it
    const gaze = new THREE.Vector3();
    const gazeAt = (time, u) => {
      path.pointAt(u, _p);
      const D = 320, up = Math.tan(4 * Math.PI / 180) * D;
      gaze.set(0, _p.y + up, _p.z + D);
      return gaze;
    };
    const pois = [{ at: gazeAt, from: -0.5, to: 1.5, fade: 0.05, weight: 0.9 }];

    const eye = new THREE.Vector3(), size = new THREE.Vector2(), rp = new THREE.Vector3(), rp2 = new THREE.Vector3(), rp3 = new THREE.Vector3();
    // windows of the life, each between two places on the route
    const UZ = { monks0: uAtZ(290), go1: uAtZ(431), owl1: uAtZ(411), flock1: uAtZ(412), sea1: uAtZ(960) }, AHEAD = 4 / path.length;   // AHEAD: 4 m further on, for a heading
    const oakHome = A.ravenOak.clone();
    // where the near raven is at u: out of the oak, beside the eye 4 m to port from z 360 to z 395, then first through the lancet
    const ravenAt = (u, time, out) => {
      const s = u * path.length, go = smoothstep(U.near1, UZ.go1, u), lead = 6.6 + 95 * go * go;
      path.posAtDist(s + lead, out); out.x += lerp(4, -1.2, smoothstep(0, 0.35, go));
      out.y = lerp(path.posAtDist(s, rp3).y + 0.4, out.y + 3, smoothstep(0, 0.3, go));     // beside the eye it flies level with it (the eye is coming down the low pass); then it goes ahead along the route
      const b = smoothstep(U.ravens, U.near0, u);
      if (b < 1) { rp2.set(oakHome.x + Math.cos(time * 0.8) * 3, oakHome.y - 4 + Math.sin(time * 1.1) * 0.8, oakHome.z + Math.sin(time * 0.8) * 3); out.lerpVectors(rp2, out, b); }
      return out;
    };
    const owlAt = (u, out) => {
      const g = smoothstep(U.owl, UZ.owl1, u), s = u * path.length, lead = 9.5 + 420 * Math.pow(smoothstep(UZ.go1, U.shore, u), 2);
      path.posAtDist(s + lead, out); out.x = lerp(out.x, 0, 0.7); out.y -= 4.2;
      out.lerpVectors(A.owlPerch, out, g); out.y -= Math.sin(g * Math.PI) * 5;
      return g;
    };

    const update = (dt, time, camera, u) => {
      camera.getWorldPosition(eye);
      ctx.renderer.getDrawingBufferSize(size);
      S.uTime.value = time; S.uViewH.value = Math.max(64, size.y);
      // the fog breathes 5 m in 9 s; the two hours are mixed by the eye's height, and the swap happens inside the slab
      const top = SLAB1 + 2.5 * Math.sin(time * TAU / 9);
      S.uSlab.value.y = top;
      const below = 1 - smoothstep(SLAB0 + 1, SLAB1 - 6, eye.y);
      uBelow.value = below; uAbove.value = smoothstep(top - 3, top + 0.5, eye.y);
      // the ground mist lies thickest in the yard; out on the open water (past the shore, z 500 to 580) it is half as thick, so a brig stands dark at 60 m
      S.uHaze.value.set(lerp(0.00035, 0.0007, below), lerp(0.035, 0.022 * lerp(1, 0.5, smoothstep(500, 580, eye.z)), below), lerp(top, 4, below), lerp(2.5, 5, below));
      S.uTone.value.z = lerp(0.17, 0.22, below);
      // the abbey: monks pace to the door, ravens lift as the eye passes z 350 and go through the lancet ahead of us
      hero.setProgress(smoothstep(UZ.monks0, U.shore, u));
      hero.setRavens(smoothstep(U.ravens, UZ.flock1, u));
      hero.update(dt, time, camera);
      // they outrun us: the point they make for runs out to sea at 30 m/s against our 15 (local frame: the course is its -z)
      if (flockU) { const lead = lerp(70, 125, smoothstep(U.shore, UZ.sea1, u)), run = Math.max(Math.min(30 * Math.max(0, tAtU(u) - tAtU(U.near1)), path.pointAt(u, _p).z + lead - 520), -60);
        flockU.uAway.value.set(away0.x, away0.y + Math.max(run, 0) * 0.012 - 2 * smoothstep(U.abbey1, U.shore, u), away0.z + (Math.sign(away0.z) || 1) * run); }
      ravenAt(u, time, rp); _q.copy(ravenAt(u + AHEAD, time + 0.2, _t));
      nearRaven.position.copy(rp); if (_q.distanceToSquared(rp) > 1e-6) nearRaven.lookAt(_q);
      nearRaven.scale.setScalar(1.8); nearRaven.material.uniforms.uPhase.value = time * 9.5;
      // the rare owl: on the tracery stump, back to us, until the eye passes z 380; then it drops and flies low ahead down the nave
      if (rare) { const g = owlAt(u, rp); owlAt(u + AHEAD, _q);
        owl.position.copy(rp); owl.scale.setScalar(2.3);
        if (g < 0.02) owl.rotation.set(-1.4, 0, 0); else if (_q.distanceToSquared(rp) > 1e-6) owl.lookAt(_q);
        owl.material.uniforms.uFold.value = 1 - smoothstep(0, 0.12, g); owl.material.uniforms.uPhase.value = time * 5.5;
      } else { owl.position.set(0, -40, 400); owl.scale.setScalar(0.001); }
      // ships glide seaward at 5 m/s on the film's clock at u (they weigh as the eye comes under the fog)
      fleet.position.z = SHIP_V * Math.max(0, tAtU(u) - T0); seaMist.material.uniforms.uGH.value.z = fleet.position.z; seaMat.uniforms.uFleetZ.value = fleet.position.z;
      // his hair stirs; the cloud bars creep
      hair.rotation.z = Math.sin(time * 1.3) * 0.05; hair.rotation.x = Math.sin(time * 0.9 + 1) * 0.03; hair.scale.x = 1 + Math.sin(time * 2.1) * 0.05;
      bars.position.x = Math.sin(time * 0.02) * 500;
    };

    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 60, near: 1, far: 45000, nearThrough: 1, lookAhead: 60, sway: 0.25, bank: 0 },
      pois, portal,
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() {},
    };
  },
};
