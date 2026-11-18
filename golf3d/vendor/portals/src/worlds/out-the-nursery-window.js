// OUT THE NURSERY WINDOW. Out of a dark nursery over starlit chimney pots, down to a moonlit sea, through a band of
// first light and a white cloud bank to a small crammed island at its endless sundown, low across its lagoon, through
// a ring of seven great trunks, up a well in the leaves and down a shaded creek to a ring of light on the moon's road.
//
// WHAT STANDS WHERE. The hours are places and never pass. Four skies stand over four stretches of the map, the same
// for every visitor at every moment: NIGHT over the town and the first water as far as the line z -86 (under the
// place the dive levels); a band of FIRST LIGHT that never rises, from there to the cloud's foot (z -140); WHITE DAY
// without a disc in the cloud bank, to its far edge (z -196); beyond it ONE SUNDOWN THAT NEVER ENDS. At each line
// two skies cross over 40 m (20 either side): colours and strengths only.
// A LIT THING TAKES ITS SKY BY WHERE IT STANDS, never by where the eye is: every lit surface (room, town, fins,
// birds, island, leaves) weighs the four lamps and fills by its own z against the three lines (the shade patch of
// the part). So the town stands in its night, the sleepers in white day and the island gold and violet under its
// low sun and low moon from every water and at every moment; from the night sea it is seen far off, small and lit.
// A CLOUD IS A LIT THING TOO: every puff weighs the same three lines by its own z, so the bank stands in white day
// (lit from above) from every water, a tower within 20 m of a line takes the two skies across it, and the island's
// shower clouds stand rose-grey under the low sun always. No puff's skin comes within 4 m of the line.
// THE EYE'S PLACE WEIGHS ONLY THE AIR AND THE WATER THE EYE IS IN: the dome (four fixed glows, no disc travels), the
// fog (and with it the haze a far cloud is seen through), the sea's colours with its one glow and glitter; and the
// drawing rules of the things we pass through (a medium thins inside 0.6 to 2.5 m of the lens, a far glint keeps a
// least angle, flat streaks face the eye; the bow's law of light is the angle of sight to its plane). Nothing else
// reads the eye. Four lamps stand on four fixed bearings for ever (the low sun, the first moon, the day from above,
// the low moon); none turns. The island stands in one state (see the part): its shade line, its lights and its hour
// are fixed on the map, and only the route's going round brings us from its gold side to its dark side.
// In the room the window stands wide open, its leaves stirring and its curtains blowing in on the clock; the three
// night-lights dip, gutter and catch again on one round of the clock, a third of a round apart, never all dark; the
// smallest star beats three quick beats and rests, for ever. The furniture stands 1.2 m and more to its own side of
// the line; the kennel stands by the window against the right wall, in a second pool of the second bed's night-light
// laid at its door (written in the room's own material from that light's place). The town is always drawn. The spindrift lies
// always on the cold water. Gold lights live in their haunts on the world clock (the part: one about the nursery, a
// few among the stacks, the lane over the sea, the island's own); none keeps a station on anyone.
//
// NO COMPANION: nothing flies with the visitor, leads her or waits for her; ride and companion are 'none'.
// NO PACING BY THE METRES FLOWN BUT THESE TWO (neither begins, turns or ends anything):
//  THE PACE by place, ramps between places of the route: 0.75 in the nursery to the window; 1 from the first ridge to
//   the quay's line; 1.3 from the dive's middle to where it levels; 1 from the cloud's foot to the head of the drop
//   round the reef's southern end; 0.85 at the low place by the surf; 0.8 at the north-east point; 0.7 from abeam the
//   bow's east foot to the beach; 0.5 from the ring to the canopy's top; 1 from abeam the brig to the end.
//  THE LOOKS, each aimed at a place of the world from one place of the route until another, handed over across
//   40 m; one whose subject stands so near that the gaze would swing over 30 degrees a second at abeam (weight x
//   pace there / its distance) lets go 1.5 s earlier at the pace there (the house and the lamp):
//   1 the cleft's far mouth on the water, from the quay's line to the cloud's foot;
//   2 the island's middle, from the cloud's foot until the reef's southern end is abeam;
//   3 the east cliff's top (half-way between the cliff's two third points), from there until it is abeam;
//   4 the peak, from there until the north-east point is abeam;
//   5 the game between the bow's feet, from there until the bow's east foot is abeam;
//   6 the rock, from there until it is abeam;
//   7 the red house in the leaves, from there until it is abeam, less that turn;
//   8 the brig's green lamp, from there until it is abeam, less that turn.
//
// BEHIND THE ENTRY the room's shell ends at the entry plane: behind it is open night air, the town's ground 44 m below.
//
// MAP OF THIS FILE: sky keys and the dome -> build(): streams, the route and its places, lamps, the island (the hero
// part), the sea, the air's skies by the eye's place, the nursery and the town, pace, looks, cloud and birds, fins,
// the gold lights, update().
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import * as Water from '../kit/water.js';
import { makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, routePoints, PLACES, townToWorld, stackStands, sunHeight, makeShade, makeMesher, mat, NEAR, mistNear, goldNursery, goldStacks, goldLane, goldIsle, makeGoldLights } from '../parts/out-the-nursery-window.js';

const DUR = 48, TAU = Math.PI * 2, DEG = Math.PI / 180;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
// a direction of the sky: elevation above the horizon, azimuth clockwise from -Z (90 looks down +X), both in degrees
const skyDir = (el, az) => [Math.cos(el * DEG) * Math.sin(az * DEG), Math.sin(el * DEG), -Math.cos(el * DEG) * Math.cos(az * DEG)];

// ---------------------------------------------------------------- the sky's keys
// One state of the sky and its light is a flat list of colours and strengths, so the skies cross by one loop. FIELDS
// names the slots. A state holds no direction: every glow and lamp of a sky stands on a fixed bearing (see build).
const FIELDS = { zen: 0, mid: 3, hor: 6, scat: 9, sunCol: 15, key: 21, hemiSky: 24, hemiGnd: 27, fog: 30, cloudLit: 33, cloudShade: 36,
  scatK: 39, scatPow: 40, midPow: 41, horPow: 42, disc: 43, stars: 44, moon1: 45, moon2: 46, hemiI: 47, fogD: 48, glint: 49, seaAmb: 50, N: 51 };
function skyState(o) {
  const s = new Float32Array(FIELDS.N);
  for (const k of ['zen', 'mid', 'hor', 'scat', 'sunCol', 'key', 'hemiSky', 'hemiGnd', 'fog', 'cloudLit', 'cloudShade']) { const c = lin(o[k]), m = o[k + 'I'] ?? 1; s.set([c[0] * m, c[1] * m, c[2] * m], FIELDS[k]); }
  for (const k of ['scatK', 'scatPow', 'midPow', 'horPow', 'disc', 'stars', 'moon1', 'moon2', 'hemiI', 'fogD', 'glint']) s[FIELDS[k]] = o[k];
  s[FIELDS.seaAmb] = o.seaAmb ?? 1;
  return s;
}
function blendState(a, b, t, out) { for (let i = 0; i < FIELDS.N; i++) out[i] = a[i] + (b[i] - a[i]) * t; return out; }
const MOON1 = skyDir(24, 0), MOON2 = skyDir(PLACES.moonEl, PLACES.moonAz);
const KEY_NIGHT = () => skyState({ zen: '#121c50', mid: '#243672', hor: '#566eb8', scat: '#8fa6d6', scatK: 0.4, scatPow: 9, midPow: 1.4, horPow: 4.5,
  sunCol: '#b9c8ee', sunColI: 2.4, disc: 0, stars: 1, moon1: 1, moon2: 0, key: '#8fa6d6', keyI: 2.4, hemiSky: '#8a9ee0', hemiGnd: '#5e6ca2', hemiI: 3.4,
  fog: '#26356e', fogD: 0.0034, cloudLit: '#b6c6ee', cloudShade: '#46568e', glint: 1, seaAmb: 3.0 });
// the band of first light: it never rises; pale stars, the first moon paler
const KEY_FIRST = () => skyState({ zen: '#1c2c66', mid: '#5c6098', hor: '#f0a284', scat: '#f8b882', scatK: 0.75, scatPow: 3.5, midPow: 1.5, horPow: 3.2,
  sunCol: '#ffc8a0', sunColI: 1.3, disc: 0, stars: 0.25, moon1: 0.5, moon2: 0, key: '#e2c2c6', keyI: 1.75,
  hemiSky: '#8494d0', hemiGnd: '#52465e', hemiI: 2.5, fog: '#b0888e', fogD: 0.005, cloudLit: '#f8dad0', cloudShade: '#8a86b8', glint: 0.8, seaAmb: 1.75 });
// white day in the cloud bank: no disc, the light from above; its air is thin, so what lies beyond the bank stands whole
const KEY_DAY = () => skyState({ zen: '#3f78c9', mid: '#86b4ea', hor: '#dbe9f6', scat: '#fff6e0', scatK: 0.25, scatPow: 5, midPow: 1.5, horPow: 4,
  sunCol: '#fff4dc', sunColI: 2.6, disc: 0, stars: 0, moon1: 0, moon2: 0, key: '#fff4e2', keyI: 3.0, hemiSky: '#b9d0f4', hemiGnd: '#8c93b8', hemiI: 2.8,
  fog: '#d6e2f2', fogD: 0.0013, cloudLit: '#fffaf2', cloudShade: '#8c90c4', glint: 1 });
// the low sun at one height el (degrees): from deep gold through red to the afterglow. A visit takes ONE of these
// and keeps it; the low moon stands with it always.
const SUN_KEYS = [
  { el: 9, seaAmb: 1.0, zen: '#26407f', mid: '#7183b6', hor: '#f9c080', scat: '#ffc660', scatK: 0.8, scatPow: 5, disc: 11, sunCol: '#ffb040', sunColI: 3.2, key: '#ffb44a', keyI: 3.2, hemiSky: '#8fa4dc', hemiGnd: '#7a6a60', hemiI: 2.4, fog: '#e8b888', fogD: 0.0009, stars: 0, cloudLit: '#ffe2b0', cloudShade: '#8c84b0' },
  { el: 2.5, seaAmb: 1.9, zen: '#1f2f6e', mid: '#6c629c', hor: '#f4a070', scat: '#ff9c4c', scatK: 0.88, scatPow: 5, disc: 10, sunCol: '#ff8a34', sunColI: 2.6, key: '#ff9440', keyI: 2.4, hemiSky: '#8a98d6', hemiGnd: '#6a6068', hemiI: 2.8, fog: '#d99a80', fogD: 0.001, stars: 0, cloudLit: '#ffc49a', cloudShade: '#7a6c9c' },
  { el: 0.5, seaAmb: 2.6, zen: '#1a2862', mid: '#5e558e', hor: '#ee8f6a', scat: '#ff8244', scatK: 0.85, scatPow: 5, disc: 9, sunCol: '#ff6a2a', sunColI: 1.8, key: '#ff7a38', keyI: 1.5, hemiSky: '#8f9fdc', hemiGnd: '#5a6070', hemiI: 3.4, fog: '#c88878', fogD: 0.001, stars: 0.05, cloudLit: '#ffa890', cloudShade: '#6c6092' },
  { el: -3, seaAmb: 3.0, zen: '#151f54', mid: '#4a447e', hor: '#dc7c6c', scat: '#f48a6c', scatK: 0.7, scatPow: 4.5, disc: 0, sunCol: '#f08a70', sunColI: 0.9, key: '#f08a70', keyI: 0.25, hemiSky: '#8fa8e0', hemiGnd: '#4a6a6a', hemiI: 4.6, fog: '#9a6a78', fogD: 0.0011, stars: 0.25, cloudLit: '#f09a90', cloudShade: '#58528a' },
  { el: -8, seaAmb: 3.0, zen: '#0c1338', mid: '#2c2e66', hor: '#96607c', scat: '#d87a80', scatK: 0.55, scatPow: 4, disc: 0, sunCol: '#c87a8a', sunColI: 0.5, key: '#c87a8a', keyI: 0, hemiSky: '#8aa6e0', hemiGnd: '#466664', hemiI: 5.0, fog: '#4a3c64', fogD: 0.0012, stars: 0.6, cloudLit: '#b07a90', cloudShade: '#3c3c70' },
];
function sunKey(el) {
  const mk = (K) => skyState({ ...K, midPow: 1.5, horPow: 3.4, moon1: 0, moon2: 1, glint: 1 });
  if (el >= SUN_KEYS[0].el) return mk(SUN_KEYS[0]);
  for (let i = 1; i < SUN_KEYS.length; i++) if (el >= SUN_KEYS[i].el) return blendState(mk(SUN_KEYS[i]), mk(SUN_KEYS[i - 1]), (el - SUN_KEYS[i].el) / (SUN_KEYS[i - 1].el - SUN_KEYS[i].el), new Float32Array(FIELDS.N));
  return mk(SUN_KEYS[SUN_KEYS.length - 1]);
}
// ---------------------------------------------------------------- the dome: one sky for the four that stand
// The gradient is the same formula the sea reflects, so sky and water agree. Each of the four skies has a glow of its
// own on a fixed bearing (lobes: the first moon's, the band of first light, the day's from above, the low sun's): only
// their strengths change, by where the eye stands. Under the sundown the side of the sky away from the sun stands
// violet with stars (uAnti). Stars keep to one common brightness; the one that signals stands at uStar and only its
// light changes (uT.y), never its size.
function makeDome(lobes, sunDir, sunAway) {
  const U = { uZen: { value: new THREE.Vector3() }, uMid: { value: new THREE.Vector3() }, uHor: { value: new THREE.Vector3() },
    uLobeDir: { value: lobes.map((d) => new THREE.Vector3(...d)) }, uLobeCol: { value: lobes.map(() => new THREE.Vector3()) }, uLobe: { value: lobes.map(() => new THREE.Vector2(0, 4)) },
    uAnti: { value: new THREE.Vector3(sunAway[0], sunAway[1], 0) }, uSunDir: { value: new THREE.Vector3(...sunDir) }, uSunCol: { value: new THREE.Vector3() },
    uMoon1: { value: new THREE.Vector3(...MOON1) }, uMoon2: { value: new THREE.Vector3(...MOON2) }, uStar: { value: new THREE.Vector3(...skyDir(14, -49)) },
    uP: { value: new THREE.Vector4(1.5, 4, 0, 0) }, uB: { value: new THREE.Vector4(0, 1, 1, 0) }, uT: { value: new THREE.Vector4(0, 0, 0, 0) } };
  const material = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = position; vec4 p = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZen, uMid, uHor, uSunDir, uSunCol, uMoon1, uMoon2, uStar, uAnti;
      uniform vec3 uLobeDir[4], uLobeCol[4]; uniform vec2 uLobe[4];
      uniform vec4 uP, uB, uT;
      varying vec3 vDir;
      vec3 h33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        float a = h33(vec3(i, 1.)).x, b = h33(vec3(i + vec2(1., 0.), 1.)).x, c = h33(vec3(i + vec2(0., 1.), 1.)).x, d = h33(vec3(i + vec2(1., 1.), 1.)).x;
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
      vec3 atmo(vec3 d){ float inv = 1. - clamp(d.y, 0., 1.);
        vec3 c = mix(uZen, uMid, pow(clamp(inv, 1e-4, 1.), uP.x)); c = mix(c, uHor, pow(clamp(inv, 1e-4, 1.), uP.y));
        for (int i = 0; i < 4; i++) { float sc = pow(clamp(.5 + .5 * dot(d, uLobeDir[i]), 0., 1.), uLobe[i].y) * mix(.14, 1., inv * inv * inv);
          c = mix(c, uLobeCol[i], clamp(sc * uLobe[i].x, 0., 1.)); }
        return c; }
      float starLayer(vec3 d, float scale, float t, float px){
        vec3 p = d * scale, i = floor(p), f = fract(p) - .5, h = h33(i);
        vec3 o = (h33(i + 17.) - .5) * .6;
        float r = max(.085, px * scale * .85), tw = .6 + .4 * sin(t * (1.1 + 2.7 * h.y) + h.z * 60.);
        return step(.7, h.x) * smoothstep(r, r * .3, length(f - o)) * tw * (.65 + .35 * h.z) * clamp(.085 / r, 0., 1.); }
      vec3 moon(vec3 d, vec3 m, float amt, float px){
        float c = dot(d, m), ang = acos(clamp(c, -1., 1.)), R = .042;
        vec3 ax = normalize(cross(m, vec3(0., 1., 0.))), ay = cross(ax, m);
        vec2 q = vec2(dot(d, ax), dot(d, ay)) / R;
        float maria = .78 + .22 * smoothstep(.3, .7, vn(q * 1.7 + 4.) * .6 + vn(q * 3.9) * .4);
        float disc = smoothstep(R + px, R - px, ang), limb = .75 + .25 * sqrt(clamp(1. - dot(q, q), 0., 1.));
        float glow = pow(clamp(c, 0., 1.), 700.) * .5 + pow(clamp(c, 0., 1.), 90.) * .12 + pow(clamp(c, 0., 1.), 12.) * .03;
        float rq = (ang - .21) / .014, ring = uT.z * .1 * exp(-min(rq * rq, 40.));
        return amt * (vec3(.9, .94, 1.) * 2.4 * disc * maria * limb + vec3(.56, .65, .9) * (glow + ring)); }
      void main(){
        vec3 d = normalize(vDir); float px = length(fwidth(d));
        vec3 c = atmo(d);
        // the side away from the low sun: violet at the sea's line, deep blue overhead, and the stars are out there
        float away = uAnti.z * smoothstep(.25, -.5, dot(d.xz, uAnti.xy));
        c = mix(c, mix(vec3(.2, .15, .4), vec3(.035, .05, .17), pow(clamp(d.y, 0., 1.), .55)), away * .8);
        c = mix(c, uHor * .5, .7 * smoothstep(0., -.3, d.y));
        float up = smoothstep(-.01, .1, d.y);
        float st = starLayer(d, 64., uT.x, px) + .8 * starLayer(d.zxy, 97., uT.x * 1.27, px);
        float rs = max(.0014, px * .85), sig = smoothstep(rs, rs * .3, length(d - uStar)) * clamp(.0014 / rs, 0., 1.) * .8 * (1. + uT.y);
        c += vec3(.82, .88, 1.) * (st * 2.4 + sig * 2.4) * max(uB.y, away * .9) * up;
        c += moon(d, uMoon1, uB.z, px) * up + moon(d, uMoon2, uB.w, px) * up;
        float sa = clamp(dot(d, uSunDir), 0., 1.), ang = acos(sa), R = .03, above = smoothstep(-.004, .004, d.y);
        float disc = smoothstep(R + px, R - px, ang) * (.8 + .2 * sqrt(clamp(1. - ang * ang / (R * R), 0., 1.)));
        c += uSunCol * uB.x * above * (disc + pow(clamp(sa, 0., 1.), 1200.) * .25 + pow(clamp(sa, 0., 1.), 160.) * .05 + pow(clamp(sa, 0., 1.), 24.) * .012);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const object = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), material);
  object.frustumCulled = false; object.renderOrder = -1;
  // s: the blended state; lobeK[i]: the strength of sky i's glow; sundown: how much of the sundown sky stands here
  const apply = (s, lobeK, sundown, sunCol, time, beat, ring) => {
    U.uZen.value.fromArray(s, FIELDS.zen); U.uMid.value.fromArray(s, FIELDS.mid); U.uHor.value.fromArray(s, FIELDS.hor);
    for (let i = 0; i < 4; i++) U.uLobe.value[i].x = lobeK[i];
    U.uAnti.value.z = sundown; U.uSunCol.value.fromArray(sunCol);
    U.uP.value.set(s[FIELDS.midPow], s[FIELDS.horPow], 0, 0);
    U.uB.value.set(s[FIELDS.disc], s[FIELDS.stars], s[FIELDS.moon1], s[FIELDS.moon2]);
    U.uT.value.set(time, beat, ring, 0);
  };
  return { object, material, uniforms: U, apply };
}

export default {
  id: 'out-the-nursery-window',
  name: 'Out the Nursery Window',
  category: 'books',
  placeKind: 'sky',
  book: 'Peter Pan',
  author: 'J. M. Barrie, 1860 to 1937',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const hourWish = vary.hour || 'any';
    // the weather of this visit, by thirds of the seed's mood: clear, showery, gold haze
    const mood = (vary.mood ?? 0.2) < 1 / 3 ? 'clear' : (vary.mood ?? 0.2) < 2 / 3 ? 'showery' : 'haze';
    // ---- every stream of the world outside the island, each made from the seed and a name, all taken here
    const S = {};
    for (const name of ['sea', 'town', 'roofs', 'smoke', 'cloud', 'birds', 'fins', 'wisps', 'flamingos', 'spindrift', 'lamps', 'cat', 'stars', 'mist',
      'nightlights', 'star', 'windows', 'flock', 'gold', 'goldroom', 'goldstacks', 'goldlane', 'goldisle', 'toys', 'seabirds', 'room', 'seawin', 'dormers'])
      S[name] = makeRng(hashSeed('nw-' + name + ':' + ctx.seed));
    const scene = new THREE.Scene();

    // ---- the route and its places, in metres from the start
    const path = makePath(routePoints()), LEN = path.length;
    await ctx.yield();
    const route = (() => { const a = [], p = new THREE.Vector3(); for (let m = 0; m <= LEN; m += 0.5) { path.posAtDist(m, p); a.push(p.x, p.y, p.z); } return new Float32Array(a); })();
    // metres flown at the point of the route nearest to a place of the world
    const mAt = (x, y, z) => { let best = 1e18, bi = 0; for (let i = 0; i < route.length / 3; i++) { const dx = route[i * 3] - x, dy = route[i * 3 + 1] - y, dz = route[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } } return bi * 0.5; };
    const AT = {
      window: mAt(...townToWorld(0, 47.8, -37)), ridge: mAt(...townToWorld(8, 53.5, -98)), quay: mAt(0, 70.5, -12.6), dive: mAt(0, 40.9, -50.5), level: mAt(0, 11.3, -88.4), cloudFoot: mAt(0, 9, -140), cloudEdge: mAt(1.2, 34.6, -196),
      // dropHead: the route's own knot where the high leg ends and the drop round the reef's southern end begins
      dropHead: mAt(46, 27, -316), surf: mAt(56, 4.5, -380), northEast: mAt(30.5, 6.6, -470), beach: mAt(-112, 8, -482), ring: mAt(-130, 8, -448), top: mAt(-160, 41.5, -405.5),
    };
    await ctx.yield();

    // ---- the four skies, and the fixed bearings on which their glows and lamps stand (nothing here ever turns)
    const sunEl = sunHeight(hourWish), J = PLACES.joins, SKIES = [KEY_NIGHT(), KEY_FIRST(), KEY_DAY(), sunKey(sunEl)];
    const LOBE = [MOON1, skyDir(-2, 0), skyDir(60, 12), skyDir(Math.max(sunEl, -6), PLACES.sunAz)];
    const LAMP = [skyDir(30, 0), skyDir(68, 12), skyDir(20, PLACES.moonAz)], SUN = skyDir(Math.max(sunEl, 7), PLACES.sunAz), DISC = skyDir(sunEl, PLACES.sunAz);
    const SEA_SUN = new THREE.Vector3(DISC[0], Math.max(DISC[1], 0.03), DISC[2]).normalize().toArray(), LOW_MOON = lin('#a4b4e6').map((c) => c * 1.7);
    const dome = makeDome(LOBE, DISC, [Math.sin(PLACES.sunAz * DEG), -Math.cos(PLACES.sunAz * DEG)]); scene.add(dome.object);
    SKIES.forEach((K, i) => { dome.uniforms.uLobeCol.value[i].fromArray(K, FIELDS.scat); dome.uniforms.uLobe.value[i].y = K[FIELDS.scatPow]; });
    scene.fog = new THREE.FogExp2(0x1b2756, 0.0009);
    // five lights, never switched or moved: a fill (its colours are the four skies' fills, weighed in the shade patch)
    // and four lamps on four fixed bearings in this order: the low sun (the scene's first lamp), the first moon's,
    // the day's from above, the low moon's. Each is weighed in the shade patch by the sky the lit surface itself stands under (its own z).
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1); scene.add(hemi);
    for (const [dir, colour, f] of [[SUN, SKIES[3], FIELDS.key], [LAMP[0], SKIES[0], FIELDS.key], [LAMP[1], SKIES[2], FIELDS.key], [LAMP[2], LOW_MOON, 0]]) {
      const lamp = new THREE.DirectionalLight(0xffffff, 1); lamp.color.fromArray(colour, f); lamp.position.fromArray(dir).multiplyScalar(600); scene.add(lamp, lamp.target);
    }
    const fills = (sh) => sh.skies(SKIES.map((K) => [0, 1, 2].map((c) => K[FIELDS.hemiSky + c] * K[FIELDS.hemiI])), SKIES.map((K) => [0, 1, 2].map((c) => K[FIELDS.hemiGnd + c] * K[FIELDS.hemiI])),
      [0, 1, 2].map((c) => SKIES[1][FIELDS.key + c] / SKIES[0][FIELDS.key + c]), LOW_MOON.map((c) => c * 1.2));

    // ---- the island (the hero part), then the sea that knows its depths
    const shade = makeShade(); fills(shade);
    const hero = await buildHero(ctx, { path, shade, mood, hourWish, rare });
    // handles of everything a stream deals, for the check that builds the world on many seeds (no cost: names only)
    const dealt = { hero: hero.dealt }; scene.userData.dealt = dealt;
    scene.add(hero.object);
    await ctx.yield();
    const L = Water.waterLight({ preset: 'night' });
    const ocean = Water.makeOcean({ rng: S.sea, light: L, preset: 'swell', height: 0.95, spread: 0.75, foam: 0, contrast: 0.3, detail: 0.6, radius: 3200, windAngle: S.sea.range(-0.5, 0.5) + Math.PI * 0.5,
      depthAt: (x, z) => -hero.land.height(x, z), depthRect: [-340, -610, 130, -260], depthRes: 72, shoalDepth: 4, shoalWidth: 14, shoreDamp: 0.14, shallowColor: '#3cc0b0', deep: '#12506e' });
    scene.add(ocean.object);
    await ctx.yield();

    // ---- what the four skies do to the dome, the air and the sea, from where the eye stands in the world (its z).
    // W: how much of each sky stands there (two at most, across a line's 40 m). si: the sky on whose side of the
    // lines the eye is. zone: the bearing the sea's glitter stands on there. A thing with one direction takes the
    // strength of its own side only, and that is nothing on the line. The air is the fog; the haze that takes a far
    // cloud is that same fog's colour. Nothing that stands (no cloud, no lit surface) takes anything here.
    const state = new Float32Array(FIELDS.N), lobeK = [0, 0, 0, 0], seaSun = new THREE.Color(), eye = new THREE.Vector3();
    const edge = (z, j) => smoothstep(J[j] + 20, J[j] - 20, z), near = (d) => smoothstep(0, 20, Math.abs(d));
    const SUN_COL = new THREE.Vector3().fromArray(SKIES[3], FIELDS.sunCol).normalize().toArray();
    const mix3 = (out, a, b, t, k, f) => out.setRGB(lerp(a[f], b[f], t) * k, lerp(a[f + 1], b[f + 1], t) * k, lerp(a[f + 2], b[f + 2], t) * k);
    // the smallest star: three quick beats (each to twice its own light and back), then a rest of 6 to 9 s, for ever
    const starRound = S.star.range(7, 10), starStart = S.star() * starRound;
    const applySky = (z, time) => {
      const t0 = edge(z, 0), t1 = edge(z, 1), t2 = edge(z, 2), W = [1 - t0, t0 * (1 - t1), t1 * (1 - t2), t2];
      state.fill(0); for (let k = 0; k < 4; k++) if (W[k] > 0) { const K = SKIES[k]; for (let i = 0; i < FIELDS.N; i++) state[i] += W[k] * K[i]; }
      const si = z > J[0] ? 0 : z > J[1] ? 1 : z > J[2] ? 2 : 3, zone = z > J[1] ? 0 : z > J[2] ? 1 : 2;
      const kLobe = near(Math.min(Math.abs(z - J[0]), Math.abs(z - J[1]), Math.abs(z - J[2]))), kLamp = (zone === 2 ? 1 : near(z - J[1])) * (zone === 0 ? 1 : near(z - J[2]));
      for (let i = 0; i < 4; i++) lobeK[i] = W[i] * SKIES[i][FIELDS.scatK];
      const tau = (time + starStart) % starRound; let beat = 0; for (const c of [0.35, 0.7, 1.05]) { const q = (tau - c) / 0.1; beat += Math.exp(-q * q); }
      dome.apply(state, lobeK, W[3], SUN_COL, time, Math.min(beat, 1), mood === 'haze' ? 1 : 0);
      scene.fog.color.setRGB(state[FIELDS.fog], state[FIELDS.fog + 1], state[FIELDS.fog + 2]); scene.fog.density = state[FIELDS.fogD] * (mood === 'haze' ? 1 + 0.5 * W[3] : 1);
      // the water mirrors a sky a little lighter overhead than the dome's, so steep wave faces do not go to ink
      L.zenith.setRGB(lerp(state[0], state[3], 0.8), lerp(state[1], state[4], 0.8), lerp(state[2], state[5], 0.8)); L.mid.setRGB(state[3], state[4], state[5]); L.horizon.setRGB(state[6], state[7], state[8]);
      L.scatterColor.fromArray(SKIES[si], FIELDS.scat); L.scatDir.fromArray(LOBE[si]);
      L.sunDir.fromArray(zone === 2 ? SEA_SUN : LAMP[zone]);
      if (zone === 0) mix3(seaSun, SKIES[0], SKIES[1], t0, kLamp, FIELDS.sunCol); else seaSun.fromArray(SKIES[zone + 1], FIELDS.sunCol).multiplyScalar(kLamp);
      L.sunColor.copy(seaSun);
      L.skyP.set(state[FIELDS.midPow], state[FIELDS.horPow], SKIES[si][FIELDS.scatK] * kLobe, SKIES[si][FIELDS.scatPow]); L.skyQ.set(0.14, 3, state[FIELDS.glint], 0);
      L.ambient.setRGB(state[0] * 0.3 + state[3] * 0.4 + state[6] * 0.3, state[1] * 0.3 + state[4] * 0.4 + state[7] * 0.3, state[2] * 0.3 + state[5] * 0.4 + state[8] * 0.3);
      L.ambient.multiplyScalar(state[FIELDS.seaAmb]); L.fogColor.copy(scene.fog.color);
      // the haze between the eye and a far cloud is the eye's own air: the fog's colour (the cloud's light is the cloud's: see the bank)
      clouds.uniforms.uHazeSun.value.copy(scene.fog.color); clouds.uniforms.uHazeAway.value.copy(scene.fog.color);
    };


    // ---- the town, one group on its own axes (x across the nursery, -z out of its window), five times life size
    const town = new THREE.Group(); town.position.set(70, 0, 160); town.rotation.y = Math.atan2(0.6, 0.8); scene.add(town);
    // the room never sees the moon's key except through its window: its materials take the sky's fill and the lamps only
    const roomShade = makeShade(); roomShade.room(); fills(roomShade);
    // The sky's fill reaches the room only through its window, so in here it is cut to four tenths; in its place every
    // surface takes the moon's light thrown back off the floor where its patch lies: by its distance from the patch's
    // middle (1.5 m over the boards) and by how it faces it. No light of the scene is spent on it. uRoomMoon: the
    // patch's middle in world metres, and how strong. The three night-lights are the room shade's three small lamps.
    // THE KENNEL'S POOL. No night-light hangs within its 7.5 m of the kennel by the window, and the journey asks the
    // kennel in a pool. So the night-light of the second bed, which hangs on the kennel's wall, throws a second pool
    // down that wall: every surface of the room within uRoomPool.w metres of the kennel's door (uRoomPool.xyz, world
    // metres) takes that light's own colour as it burns at that moment (it dips and gutters with it), by the pool's
    // law of the three lamps (the square of what is left of the reach) and by how the surface faces THE NIGHT-LIGHT'S
    // OWN PLACE, three tenths of it on a face turned away (the floor's and the wall's glow back). No light of the
    // scene is spent on it and nothing of it reads the eye.
    // THE WINDOW WALL'S WASH. The night-light nearest the window (the third bed's, on the left wall) throws a warm
    // wash on the window wall: every surface of the room within uRoomWash.w metres of the window's middle
    // (uRoomWash.xyz, world metres: the frame, the curtains' folds, the paper beside them) takes that light's own
    // colour as it burns at that moment, by what is left of that reach, by the square of what is left of the light's
    // own long reach (WASH_REACH: from the night-light to the window wall's far top corner) and by how the surface
    // faces the night-light's own place (three tenths on a face turned away). Nothing of it reads the eye.
    // THE ROOM'S DRESS is written in the same material by each surface's OWN PLACE on the room's axes (vRmP, metres;
    // vRmN): the walls' paper between the rails (a trellis of diamonds a metre across in a lighter tone of the wall's
    // blue, at each diamond's middle by turns a small four-petalled sprig, ivory with a darker blue heart, and a
    // dot), the floor's boards (half a metre wide, their ends 6.5 m apart, each a little lighter or darker), the
    // rug's woven border and weave by the metres in from its edge, and the curtains' hem and darker lining (cloth:
    // uRoomKind 1). Where a line of the pattern would be finer than the eye's grain it fades to the plain colour.
    const ROOM_DRESS = /* glsl */`
        { vec3 rmN = normalize(vRmN); float rmFine = fwidth(vRmP.x) + fwidth(vRmP.y) + fwidth(vRmP.z);
          if (uRoomKind.x > 0.5) {
            // the cloth (its own axes: 15.4 m of drop about its middle): a hem 0.9 m deep at the foot under a line of stitching; its far side is the lining
            diffuseColor.rgb *= (1.0 - 0.2 * step(vRmP.y, -6.8)) * (1.0 + 0.35 * smoothstep(0.08, 0.03, abs(vRmP.y + 6.8)));
            if (!gl_FrontFacing) diffuseColor.rgb *= vec3(0.5, 0.52, 0.7);
          } else {
            // the paper: on a side wall's face (x 15 either way) from the dado rail to the picture rail, on the window wall's (z -36) to the cornice
            float rmSide = step(0.9, abs(rmN.x)) * step(abs(abs(vRmP.x) - 15.0), 0.02), rmWin = step(0.9, abs(rmN.z)) * step(abs(vRmP.z + 36.0), 0.02);
            float rmPaper = max(rmSide * step(vRmP.y, 53.0), rmWin * step(vRmP.y, 55.0)) * step(42.2, vRmP.y);
            float rmS = rmSide > 0.5 ? vRmP.z : vRmP.x, rmKeep = clamp(1.6 - rmFine * 14.0, 0.0, 1.0);
            vec2 rmQ = vec2(rmS + vRmP.y, rmS - vRmP.y), rmC = fract(rmQ) - 0.5;
            float rmLine = smoothstep(0.06, 0.025, 0.5 - max(abs(rmC.x), abs(rmC.y)));
            vec2 rmD = vec2(rmC.x + rmC.y, rmC.x - rmC.y) * 0.5; float rmR2 = dot(rmD, rmD), rmR = sqrt(rmR2), rmC2 = (rmD.x * rmD.x - rmD.y * rmD.y) / max(rmR2, 1.0e-5);
            float rmOdd = mod(floor(rmQ.x) + floor(rmQ.y), 2.0);
            float rmPetal = smoothstep(0.02, 0.0, rmR - 0.17 * (0.3 + 0.7 * rmC2 * rmC2)) * (1.0 - rmOdd), rmDot = smoothstep(0.06, 0.04, rmR) * rmOdd;
            vec3 rmCol = diffuseColor.rgb * (1.0 + 0.3 * rmLine);
            rmCol = mix(rmCol, vec3(0.8, 0.77, 0.68), 0.75 * rmPetal); rmCol = mix(rmCol, diffuseColor.rgb * 0.6, max(rmPetal * smoothstep(0.05, 0.03, rmR), rmDot));
            diffuseColor.rgb = mix(diffuseColor.rgb, rmCol, rmPaper * rmKeep);
            // the boards (the floor's top stands at 38 m) and the rug that lies on them (its top at 38.07; 14 m by 22 m about x 0, z -18)
            float rmUp = step(0.9, rmN.y), rmFloor = rmUp * step(abs(vRmP.y - 38.0), 0.03), rmRug = rmUp * step(abs(vRmP.y - 38.07), 0.02);
            float rmBi = floor(vRmP.x / 0.5), rmBz = vRmP.z / 6.5 + fract(sin(rmBi * 12.9898) * 43758.5453);
            float rmBt = fract(sin((rmBi + floor(rmBz) * 57.0) * 78.233) * 43758.5453), rmFx = fract(vRmP.x / 0.5), rmFz = fract(rmBz);
            float rmJoint = max(smoothstep(0.045, 0.015, min(rmFx, 1.0 - rmFx)), smoothstep(0.006, 0.002, min(rmFz, 1.0 - rmFz)));
            diffuseColor.rgb *= mix(1.0, (0.84 + 0.3 * rmBt) * (1.0 - 0.45 * rmJoint), rmFloor * rmKeep);
            vec2 rmE2 = vec2(7.0 - abs(vRmP.x), 11.0 - abs(vRmP.z + 18.0)); float rmE = min(rmE2.x, rmE2.y), rmA = rmE2.x < rmE2.y ? vRmP.z : vRmP.x;
            float rmBand = step(0.6, rmE) * step(rmE, 1.7), rmT = clamp((rmE - 0.6) / 1.1, 0.0, 1.0), rmTri = abs(fract(rmA / 0.9) - 0.5) * 2.0;
            float rmIvory = max(max(smoothstep(0.07, 0.04, abs(rmE - 0.5)), smoothstep(0.07, 0.04, abs(rmE - 1.8))), rmBand * smoothstep(0.16, 0.08, abs(rmT - (0.2 + 0.6 * rmTri))));
            float rmWeave = abs(step(0.5, fract(vRmP.x / 0.16)) - step(0.5, fract(vRmP.z / 0.16)));
            vec3 rmRugC = mix(diffuseColor.rgb * (0.96 + 0.08 * rmWeave * step(1.9, rmE)), vec3(0.16, 0.2, 0.36), 0.7 * rmBand);
            rmRugC = mix(rmRugC, vec3(0.7, 0.66, 0.56), 0.8 * rmIvory) * (1.0 - 0.45 * smoothstep(0.22, 0.18, rmE));
            diffuseColor.rgb = mix(diffuseColor.rgb, rmRugC, rmRug * clamp(1.6 - rmFine * 5.0, 0.0, 1.0));
          } }
        `;
    const roomMoon = { value: new THREE.Vector4(...townToWorld(-7, 39.5, -20), 1.5) }, roomPool = { value: new THREE.Vector4(0, -900, 0, 1) }, roomWash = { value: new THREE.Vector4(...townToWorld(0, 48, -36.5), 14) };
    const WASH_REACH = Math.hypot(15 + 13.9, 55.5 - 44.95, 36 - 23.4);
    const roomBounce = (material, cloth = 0) => {
      const old = material.onBeforeCompile, oldKey = material.customProgramCacheKey;
      material.onBeforeCompile = (shader, renderer) => {
        if (old) old.call(material, shader, renderer);
        shader.uniforms.uRoomMoon = roomMoon; shader.uniforms.uRoomPool = roomPool; shader.uniforms.uRoomWash = roomWash; shader.uniforms.uRoomKind = { value: new THREE.Vector2(cloth, WASH_REACH) };
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRmP, vRmN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRmP = position; vRmN = normal;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec4 uRoomMoon, uRoomPool, uRoomWash; uniform vec2 uRoomKind; varying vec3 vRmP, vRmN;')
          .replace('#include <specularmap_fragment>', ROOM_DRESS + '#include <specularmap_fragment>')
          .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          { vec3 nwTo = uRoomMoon.xyz - vNwW; float nwD2 = clamp(dot(nwTo, nwTo), 0.01, 1.0e5);
            vec3 nwL = normalize((viewMatrix * vec4(nwTo, 0.0)).xyz);
            float nwF = 0.4 + 0.6 * max(dot(normal, nwL), 0.0);
            reflectedLight.indirectDiffuse = reflectedLight.indirectDiffuse * 0.4 + diffuseColor.rgb * vec3(0.8, 0.86, 1.0) * (uRoomMoon.w * nwF / (1.0 + nwD2 * 0.014)); }
          { vec3 nwL = normalize((viewMatrix * vec4(uNwLamp[1].xyz - vNwW, 0.0)).xyz);
            float nwP = 1.0 - clamp(distance(vNwW, uRoomPool.xyz) / uRoomPool.w, 0.0, 1.0);
            reflectedLight.directDiffuse += diffuseColor.rgb * uNwLampCol[1] * (0.3 * nwP * nwP * (0.3 + 0.7 * max(dot(normal, nwL), 0.0))); }
          { vec3 nwTo = uNwLamp[2].xyz - vNwW; float nwD = length(nwTo);
            vec3 nwL = normalize((viewMatrix * vec4(nwTo, 0.0)).xyz);
            float nwP = 1.0 - clamp(distance(vNwW, uRoomWash.xyz) / uRoomWash.w, 0.0, 1.0), nwF = 1.0 - clamp(nwD / uRoomKind.y, 0.0, 1.0);
            reflectedLight.directDiffuse += diffuseColor.rgb * uNwLampCol[2] * (1.6 * nwP * nwF * nwF * (0.3 + 0.7 * max(dot(normal, nwL), 0.0))); }`);
      };
      material.customProgramCacheKey = () => (oldKey ? oldKey.call(material) : material.type) + '-room';
      return material;
    };
    const roomMat = roomBounce(roomShade.patch(new THREE.MeshLambertMaterial({ vertexColors: true })));
    const ROOM = { floor: 38, ceil: 55.5, wall: 15, win: -36, sill: 42, head: 54, half: 5 };
    {
      const M = makeMesher(), B = (w, h, d, x, y, z, col, ry = 0, rx = 0, rz = 0) => M.box(w, h, d, mat(x, y, z, ry, rx, rz), col);
      // shell: floor, ceiling, side walls, and the window wall in four pieces round its opening. It ends at the entry
      // plane (the town's z 0): nothing of it stands behind the entry.
      for (let k = 0; k < 20; k++) B(1.5, 0.6, 38, -14.25 + k * 1.5, ROOM.floor - 0.3, -19, k % 2 ? '#7a5c40' : '#6e5238');
      B(30.5, 0.6, 38, 0, ROOM.ceil + 0.3, -19, '#8f8a96'); B(30.5, 0.5, 0.5, 0, ROOM.ceil - 0.25, -35.7, '#b9b2b0');
      // walls papered in two close shades in upright stripes, a dark dado below a rail, a picture rail above
      for (const sd of [-1, 1]) {
        for (let k = 0; k < 19; k++) B(0.6, 13.6, 2, sd * 15.3, 48.7, -38 + k * 2 + 1, k % 2 ? '#7c84a6' : '#727a9c');
        B(0.7, 3.9, 38, sd * 15.25, 39.95, -19, '#565470'); B(0.9, 0.35, 38, sd * 15.15, 42, -19, '#b9b2b0'); B(0.8, 0.3, 38, sd * 15.2, 53.2, -19, '#b9b2b0'); B(0.8, 0.5, 38, sd * 15.2, 38.25, -19, '#b9b2b0');
      }
      for (const sd of [-1, 1]) { for (let k = 0; k < 5; k++) B(2, 13.6, 2, sd * (6 + k * 2), 48.7, -37, k % 2 ? '#7c84a6' : '#727a9c'); B(10, 3.9, 2.1, sd * 10, 39.95, -37, '#565470'); B(10, 0.35, 2.3, sd * 10, 42, -37, '#b9b2b0'); }
      B(10, 4, 2, 0, 40, -37, '#565470'); B(10, 1.5, 2, 0, 54.75, -37, '#727a9c'); B(11.4, 0.45, 3, 0, 41.9, -36.8, '#d8d2c4');
      for (const sd of [-1, 1]) B(0.5, 12.6, 2.5, sd * 5.2, 48.1, -36.9, '#d8d2c4'); B(10.9, 0.5, 2.5, 0, 54.2, -36.9, '#d8d2c4');
      B(14, 0.06, 22, 0, ROOM.floor + 0.04, -18, '#6a4a52');
      // THE MOULDINGS: each rail is a moulding of three members, none standing further out from its wall than the
      // rail it dresses: a pale bead along its upper edge (the lit edge), the rail, and a darker fillet set back
      // under it; the skirting carries the bead alone. On both side walls and on the window wall's dado rail.
      for (const sd of [-1, 1]) {
        B(0.7, 0.1, 38, sd * 15.2, 38.55, -19, '#eae4d8');
        B(0.9, 0.06, 38, sd * 15.15, 42.205, -19, '#eae4d8'); B(0.74, 0.12, 38, sd * 15.15, 41.765, -19, '#9c96a0');
        B(0.8, 0.05, 38, sd * 15.2, 53.375, -19, '#eae4d8'); B(0.68, 0.1, 38, sd * 15.2, 53.0, -19, '#9c96a0');
        B(10, 0.06, 2.3, sd * 10, 42.205, -37, '#eae4d8'); B(10, 0.12, 2.14, sd * 10, 41.765, -37, '#9c96a0');
      }
      // THE SILL IS MOULDED: a bead along its front edge (no higher than the sill's own top), a cove under its nose
      // and an apron board against the wall below it
      B(11.6, 0.16, 0.16, 0, 42.04, -35.24, '#eae4d8'); B(11.2, 0.14, 0.5, 0, 41.6, -35.6, '#c2bcb0'); B(10.6, 0.5, 0.12, 0, 41.42, -35.94, '#c9c2b6');
      // THREE FRAMED PICTURES on the side walls, each a soft landscape and nothing else (a pale sky in two tones,
      // a line of far hills, a field): one over the toy shelf between two beds, one over the chest of drawers, one
      // between the second bed and the kennel. Each is 3.4 m by 2.6 m (five times life) in a dark wooden frame that
      // stands no further from its wall than the dado rail; its hills are its own (three fixed lines, by its place).
      { const face = new THREE.PlaneGeometry(1, 1), COLS = 24;
        for (const [sd, pz, py, a, b] of [[-1, -19.5, 48.4, 0.6, 2.1], [1, -8, 49.4, 2.9, 0.4], [1, -26.2, 48.4, 4.4, 5.2]]) {
          const w = 3.4, h = 2.6, x = sd * 14.89;
          for (const [dy, dz, fw, fh] of [[h / 2 + 0.11, 0, w + 0.44, 0.22], [-h / 2 - 0.11, 0, w + 0.44, 0.22], [0, w / 2 + 0.11, 0.22, h], [0, -w / 2 - 0.11, 0.22, h]]) B(0.22, fh, fw, x, py + dy, pz + dz, '#4e3828');
          for (let c = 0; c < COLS; c++) { const u = (c + 0.5) / COLS, far = 0.44 + 0.07 * Math.sin(u * 5.1 + a) + 0.035 * Math.sin(u * 11.3 + b), near = 0.24 + 0.05 * Math.sin(u * 3.7 + b);
            for (const [v0, v1, col] of [[0, near, '#74907c'], [near, far, '#8a96bc'], [far, far + (1 - far) * 0.45, '#d6dcd6'], [far + (1 - far) * 0.45, 1, '#b4c2dc']])
              M.add(face, mat(sd * 14.96, py + (v0 + v1 - 1) * h / 2, pz + (u - 0.5) * w * sd, -sd * Math.PI / 2, 0, 0, w / COLS, (v1 - v0) * h, 1), col); } } }
      await ctx.yield();
      const roomToys = []; dealt.toys = roomToys;
      const CLEAR = 1.2, aside = (x, half) => Math.sign(x) * Math.max(Math.abs(x), CLEAR + half);
      // three beds, heads to the side walls: bedstead, mattress, pillow, and the hump of a sleeper under the blanket
      const beds = [[-9.5, -12, '#5a6a9a'], [9.5, -19, '#9a5a62'], [-9.5, -27, '#5a7a66']];
      for (const [x0, z, blanket] of beds) {
        const x = aside(x0, 5.3), sd = Math.sign(x);
        B(10, 2.2, 5, x, 39.1, z, '#8c6646'); B(0.5, 5.5, 5.2, x + sd * 5, 40.8, z, '#8c6646'); B(0.4, 3.6, 5.2, x - sd * 5, 39.8, z, '#8c6646');
        B(9.4, 1.3, 4.6, x, 40.85, z, '#d8d2c4'); B(2.2, 0.7, 3.4, x + sd * 3.4, 41.8, z, '#efeadf');
        B(6.6, 0.3, 4.8, x - sd * 1.3, 41.6, z, blanket);
        M.add(new THREE.SphereGeometry(1, 12, 8), mat(x - sd * 0.6, 41.6, z, 0, 0, 0, 2.9, 0.95, 1.25), blanket);
        // the night-light's stand at the head
        B(1.6, 6.2, 1.6, x + sd * 4.4, 41.1, z + 3.6, '#7a5a40'); M.add(new THREE.CylinderGeometry(0.5, 0.36, 0.5, 8), mat(x + sd * 4.4, 44.35, z + 3.6), '#b9a070');
      }
      await ctx.yield();
      // THE ROOM'S RULE OF PLACE, for every piece of furniture alike (the shell and the rug that lies on its floor are
      // not furniture): nothing stands within CLEAR (1.2 m) of the line or under it between the entry and the window:
      // every piece takes its place across the room through `aside`, which gives its middle such that its nearest
      // edge is CLEAR or more to its own side of the line. And the design's own: in the room's last 15 m before the
      // window wall nothing taller than a bed (its head board stands to 43.55) is within 11 m of the line.
      // THE KENNEL stands where the design puts it: by the window against the right wall, its middle at (12.5, -31)
      // on the room's axes, 5 m long down the room, its door toward the room. It is lower than a bed's head (walls to
      // 41.2, the ridge of its small pitched roof at 43.3) and its nearest eave is 10.1 m from the line. A gable
      // closes each end under the roof and a pale board caps the ridge, so that it stands whole.
      // the kennel, the chest of drawers with one drawer open, the hearth with its guard
      const KENNEL = [aside(12.5, 2.4), -31]; roomPool.value.set(...townToWorld(KENNEL[0] - 1, 40, KENNEL[1] + 2.5), 9);
      { const [kx, kz] = KENNEL, gable = new THREE.Shape(); gable.moveTo(-2.1, 0); gable.lineTo(2.1, 0); gable.lineTo(0, 1.7); gable.closePath();
        B(4.2, 3.2, 5, kx, 39.6, kz, '#a07a54'); for (const sd of [-1, 1]) B(3.2, 0.3, 5.6, kx + sd * 1.15, 42.1, kz, '#86603f', 0, 0, -sd * 0.72);
        M.add(new THREE.ExtrudeGeometry(gable, { depth: 5, bevelEnabled: false }).translate(0, 0, -2.5), mat(kx, 41.2, kz), '#a07a54'); B(0.36, 0.26, 5.7, kx, 43.2, kz, '#c2a67c');
        B(1.9, 2.3, 0.1, kx, 39.2, kz + 2.54, '#1a1414'); }
      B(3.2, 7.4, 6.4, 13.2, 41.7, -8, '#8c6646'); for (let k = 0; k < 4; k++) B(0.12, 0.1, 5.8, 11.58, 39.5 + k * 1.75, -8, '#3a2a20');
      B(2.6, 1.3, 5.6, 11.4, 43.1, -8, '#9a7450'); B(2.2, 0.5, 5, 11.5, 43.6, -8, '#e8e2d6');
      B(1.2, 7, 7, -14.6, 41.5, -4, '#4a4654'); B(1.6, 0.5, 7.6, -14.4, 45.2, -4, '#c9c0b0'); B(0.3, 4.6, 4.4, -14.1, 40.3, -4, '#141014');
      for (let k = 0; k < 7; k++) B(0.1, 3.6, 0.1, -12.6, 39.8, -6.1 + k * 0.7, '#2a2630'); B(0.12, 0.12, 4.8, -12.6, 41.6, -4, '#2a2630'); B(0.12, 0.12, 4.8, -12.6, 38.2, -4, '#2a2630');
      await ctx.yield();
      // a rocking horse on the rug's far end, a low shelf with toys between two beds, a chair with clothes thrown
      // over it, and a few toys left on the rug (five times life, like all the room; none stands as tall as a bed's head)
      // (the horse's ground: 2.5 m to either side of its middle across the room, 2.0 m along it)
      const HORSE = { x: aside(-1.8, 2.5), z: -16.5 }; dealt.horse = HORSE;
      { const hx = HORSE.x - 0.4, hz = HORSE.z, ry = 0.5;
        for (const sd of [-1, 1]) M.add(new THREE.TorusGeometry(2.6, 0.14, 5, 14, 1.5), mat(hx + 0.4 + sd * 0.22, 40.75, hz + sd * 0.4, ry, 0, Math.PI * 1.5 - 0.75), '#7a3c34');
        M.add(new THREE.SphereGeometry(1, 10, 8), mat(hx + 0.4, 40.5, hz, ry, 0, 0, 1.5, 0.7, 0.6), '#b9a890'); B(0.5, 1.5, 0.5, hx + 1.55, 41.3, hz - 0.85, '#b9a890', ry, 0, -0.5); B(1.1, 0.55, 0.45, hx + 2.15, 42.0, hz - 1.15, '#b9a890', ry, 0, 0.5);
        for (const [ax, az] of [[-0.7, 0.35], [-0.7, -0.35], [1.0, 0.35], [1.0, -0.35]]) B(0.22, 1.6, 0.22, hx + 0.4 + ax * Math.cos(ry) + az * Math.sin(ry), 39.4, hz - ax * Math.sin(ry) + az * Math.cos(ry), '#b9a890');
        B(0.5, 0.2, 0.9, hx + 0.3, 41.25, hz + 0.05, '#8a3a3a', ry); }
      B(1.5, 3.0, 6.4, -14.1, 39.5, -19.5, '#86603f'); B(1.7, 0.2, 6.6, -14.0, 41.1, -19.5, '#9a7450');
      for (let k = 0; k < 6; k++) { const w = S.toys.range(0.5, 1.1); B(0.9, S.toys.range(0.6, 1.3), w, -14.0, 41.6, -22.2 + k * 1.05, S.toys.pick(['#8a3a3a', '#3a5a8a', '#c9b070', '#4a7a5a', '#b9b2b0'])); }
      B(2.4, 0.3, 2.4, 12.6, 40.3, -13.8, '#8c6646'); B(0.3, 4.6, 2.4, 13.7, 40.3, -13.8, '#8c6646'); for (const [ax, az] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B(0.25, 2.2, 0.25, 12.6 + ax, 39.1, -13.8 + az, '#8c6646');
      B(2.2, 0.35, 2.0, 12.5, 40.65, -13.8, '#d8d2c4', 0.2); B(0.25, 2.6, 2.1, 13.45, 41.6, -13.7, '#5a6a9a', 0, 0, 0.12);
      // the rug's toys: each dealt to one side of the line, its middle 1.9 to 3.5 m off it (its own half width, 0.65,
      // inside CLEAR on the near side and short of the beds' feet on the far side); one dealt onto the horse's ground
      // lies at the same distance on the other side of the line, and one dealt onto an earlier toy steps 1.5 m up the rug
      { const laid = roomToys, onHorse = (x, z) => Math.abs(x - HORSE.x) < 3.2 && Math.abs(z - HORSE.z) < 2.7;
        for (let k = 0; k < 5; k++) { const x0 = S.toys.range(-5.5, 5.5), c0 = S.toys.range(-27, -13), c = S.toys.pick(['#8a3a3a', '#3a5a8a', '#c9b070', '#4a7a5a']);
          let x = Math.sign(x0 || 1) * lerp(CLEAR + 0.7, 3.5, Math.abs(x0) / 5.5), z = c0;
          if (onHorse(x, z)) x = -x;
          for (let n = 0; n < 9 && laid.some(([lx, lz]) => Math.hypot(lx - x, lz - z) < 1.5); n++) { z += 1.5; if (z > -13) z -= 14; if (onHorse(x, z)) x = -x; }
          laid.push([x, z]);
          if (k % 2) M.add(new THREE.SphereGeometry(0.65, 10, 8), mat(x, 38.75, z), c); else B(0.9, 0.9, 0.9, x, 38.55, z, c, S.toys() * 3); } }
      town.add(new THREE.Mesh(M.build(), roomMat));
    }
    await ctx.yield();


    // ---- the room's living parts: the window's two leaves, the curtains, the three night-lights and their pools, the
    // embers, and the moon's patch on the floor. All of it stands or goes on the world clock: the leaves stand wide
    // open and stir a few degrees, the curtains blow in at one strength, each night-light dips twice, gutters nearly
    // out and catches again on one round of 9 to 14 s (the three a third of a round apart, a little uneven, so never
    // all dark together).
    const outMat = shade.patch(new THREE.MeshLambertMaterial({ vertexColors: true }), false, false);
    const roomU = { uNL: { value: new THREE.Vector3(1, 1, 1) }, uTime: { value: 0 }, uOpen: { value: 1 }, uMoon: { value: 1 } };
    const leaves = [];
    {
      for (const sd of [-1, 1]) {
        const M = makeMesher(), w = 5 * -sd;
        for (const x of [0.15, 2.5, 4.85]) M.box(0.3, 12, 0.3, mat(x * -sd, 48, 0), '#d8d2c4');
        for (const y of [42.15, 45, 48, 51, 53.85]) M.box(5, y === 42.15 || y === 53.85 ? 0.3 : 0.18, 0.3, mat(w / 2, y, 0), '#d8d2c4');
        // the glazing bars' rebates: a narrow bead a shade darker along every side of every pane's opening, set
        // inside the bars' own depth and the leaf's own outline
        for (const x of [0.335, 2.315, 2.685, 4.665]) M.box(0.07, 11.4, 0.12, mat(x * -sd, 48, 0), '#a9a39a');
        for (const y of [42.335, 44.875, 45.125, 47.875, 48.125, 50.875, 51.125, 53.665]) M.box(4.4, 0.07, 0.12, mat(w / 2, y, 0), '#a9a39a');
        const leaf = new THREE.Mesh(M.build(), outMat); leaf.position.set(sd * 5, 0, -37.9); town.add(leaf); leaves.push(leaf);
      }
      // curtains: 3.5 m of cloth outside each jamb, hung from above the head in folds three quarters of a metre apart
      // (their shading is dyed into the cloth), blowing in on the night air
      const cloth = roomBounce(roomShade.patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })), 1);
      const curtains = [-1, 1].map((sd) => { const g = new THREE.PlaneGeometry(3.5, 15.4, 20, 12), q = g.attributes.position, cc = new Float32Array(q.count * 3);
        for (let k = 0; k < q.count; k++) { const f = 0.62 + 0.28 * Math.cos(q.getX(k) * 8.4 + sd); cc.set([0.64 * f, 0.58 * f, 0.54 * f], k * 3); }
        g.setAttribute('color', new THREE.BufferAttribute(cc, 3));
        const c = new THREE.Mesh(g, cloth); c.position.set(sd * 6.75, 46.9, -35.5); town.add(c); return { g, base: q.array.slice(), sd }; });
      // pools of the night-lights (on the wall behind each head and on the bed), the embers, and the moon's patch
      const pos = [], uvk = [], idx = [];
      const quad = (c, a, b, kind, which) => { const n = pos.length / 3; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(c[0] + a[0] * u + b[0] * v, c[1] + a[1] * u + b[1] * v, c[2] + a[2] * u + b[2] * v); uvk.push(u, v, kind, which); } idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
      [[-9.5, -12], [9.5, -19], [-9.5, -27]].forEach(([x, z], i) => { const sd = Math.sign(x);
        quad([sd * 14.93, 45.5, z + 3.2], [0, 0, 53.05 - 45.5], [0, 53.05 - 45.5, 0], 0, i); quad([x + sd * 1.5, 42.62, z + 0.8], [5.5, 0, 0], [0, 0, 4.5], 0, i); quad([x + sd * 4.4, 44.95, z + 3.6], [0.55, 0, 0], [0, 0.75, 0], 3, i); quad([x + sd * 4.4, 44.95, z + 3.6], [0, 0, 0.55], [0, 0.75, 0], 3, i); });
      quad([-13.9, 38.9, -4], [0, 0, 1.9], [0, 0.8, 0], 1, 0); quad([-12.4, 38.08, -4], [2.2, 0, 0], [0, 0, 3.0], 1, 1);
      quad([0, 38.07, -18.5], [15, 0, 0], [0, 0, 18.5], 2, 0); quad([-14.93, 46.75, -18.5], [0, 0, 18.5], [0, 8.75, 0], 2, 1);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uvk, 4)); g.setIndex(idx);
      const lit = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: roomU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`attribute vec4 aUv; varying vec4 vUv; varying vec3 vP; void main(){ vUv = aUv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`
          uniform vec3 uNL; uniform float uTime, uOpen, uMoon; varying vec4 vUv; varying vec3 vP;
          float bar(float x, float c, float w){ return smoothstep(w, w * .4, abs(x - c)); }
          void main(){
            float r = length(vUv.xy), kind = vUv.z, k = vUv.w < .5 ? uNL.x : vUv.w < 1.5 ? uNL.y : uNL.z;
            vec3 c = vec3(0.);
            if (kind < .5) c = vec3(1., .66, .3) * .5 * k * smoothstep(1., 0., r) * smoothstep(1., .3, r);
            else if (kind < 1.5) c = vec3(1., .36, .1) * (vUv.w < .5 ? 1.2 : .3) * smoothstep(1., .2, r) * (.7 + .3 * sin(uTime * 2.3 + vP.z * 5.) * sin(uTime * 1.7 + vP.z * 3.1));
            else if (kind < 2.5) {
              // the moon comes down through the window at 24 degrees, 37 degrees from the right: trace each point back to the window's plane
              vec3 d = vec3(-.548, -.407, .731); float t = (vP.z + 37.) / d.z; vec2 w = vP.xy - d.xy * t;
              float inside = smoothstep(5., 4.7, abs(w.x)) * smoothstep(42., 42.3, w.y) * smoothstep(54., 53.7, w.y);
              float bars = max(max(bar(w.x, 0., .4), max(bar(w.x, -2.5, .22), bar(w.x, 2.5, .22))), max(bar(w.y, 45., .2), max(bar(w.y, 48., .2), bar(w.y, 51., .2))));
              c = vec3(.5, .62, .95) * .42 * inside * (1. - bars * (1. - uOpen)) * uMoon;
            } else c = vec3(1., .8, .45) * 1.6 * k * smoothstep(1., .1, r) * (.85 + .15 * sin(uTime * 9. + vUv.w * 3.));
            gl_FragColor = vec4(c, 1.);
          }` }));
      lit.renderOrder = 2; town.add(lit);
      town.userData.curtains = curtains;
    }
    // how bright night-light i burns at clock t: two dips, a gutter nearly out for a tenth of the round, a quick catch
    const NL_ROUND = S.nightlights.range(9, 14), NL_PH = S.nightlights(), NL_START = [0, 1, 2].map((i) => (i + S.nightlights.range(-0.08, 0.08)) / 3 + NL_PH);
    const NL_AT = [[-9.5, -12], [9.5, -19], [-9.5, -27]].map(([x, z]) => townToWorld(x + Math.sign(x) * 4.4, 44.95, z + 3.6));
    const nightLight = (i, t) => { const p = (((t / NL_ROUND + NL_START[i]) % 1) + 1) % 1, bump = (c, w) => Math.exp(-(((p - c) / w) ** 2));
      return (1 - 0.55 * bump(0.5, 0.022) - 0.7 * bump(0.6, 0.026)) * (1 - 0.9 * smoothstep(0.7, 0.78, p) * (1 - smoothstep(0.86, 0.885, p))); };
    // EACH NIGHT-LIGHT'S POOL REACHES the wall behind its bed up to the picture rail (its glow on the wall ends at the
    // rail's lower edge, 53.05) and the floor as far as the rug's nearest edge (7 m from the room's middle): its reach
    // is a quarter more than its distance to that edge, so that a twenty-fifth of its light is left there.
    const NL_REACH = 1.25 * Math.hypot(13.9 - 7, 44.95 - 38.07);
    NL_AT.forEach((q, i) => roomShade.lamp(i, q[0], q[1], q[2], NL_REACH));
    // the room's own airs (the leaves' stir, the curtains' blowing, the hearth's flicker) begin where their stream deals
    const ROOM_PH = S.room() * 60;
    const roomAt = (clock) => {
      const time = clock + ROOM_PH;
      leaves[0].rotation.y = 1.9 + 0.05 * Math.sin(time * 0.7); leaves[1].rotation.y = -1.9 - 0.05 * Math.sin(time * 0.6 + 2);
      const nl = roomU.uNL.value.set(nightLight(0, time), nightLight(1, time), nightLight(2, time)); roomU.uTime.value = time;
      [nl.x, nl.y, nl.z].forEach((k, i) => { const f = k * (0.9 + 0.1 * Math.sin(time * 9 + i * 3)); roomShade.lampColor(i, 5.2 * f, 3.0 * f, 1.15 * f); });
      for (const c of town.userData.curtains) {
        const a = c.g.attributes.position.array, b = c.base;
        for (let k = 0; k < a.length; k += 3) { const hang = (7.7 - b[k + 1]) / 15.4, inner = 0.5 - c.sd * b[k] / 3.5; a[k + 2] = hang * 1.4 * (1.1 + Math.sin(time * 1.4 + b[k + 1] * 0.5 + b[k] * 0.9 * c.sd)) * (0.4 + inner) + 0.22 * Math.sin(b[k] * 8.4 + c.sd); }
        c.g.attributes.position.needsUpdate = true;
      }
    };
    await ctx.yield();


    // ---- the town's roofs: terraces in rows across the window's axis, each house 12 m wide under one ridge, a chimney
    // stack 8 m wide every 24 m with four pots, the rows nearer the water lower; nothing is built past the quay's line
    const townMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.12 });
    // every slope is slated and every wall and stack is brick: courses half a metre of height apart on the slopes (a
    // metre along the slope: slates at five times life), 0.4 m on the walls, each slate or brick a little lighter or
    // darker than the next, alternate courses half a length along. Far off, where a course is under two pixels, the
    // joints fade out and the plain colour is left.
    // THE TOWN'S SEA FRONT IS SOOT-DARK: every face of the town that looks down the nursery's axis out to sea (a
    // wall's far side, a roof's far slope, the far face of a stack or a pot, the quay wall's sea face: by the face's
    // own bearing on the mesh's axes, from 3 degrees of lean on, whole from 20) is soot, whatever its brick or
    // slate. From the island's waters the town is then a low dark mass under its night with a scatter of warm
    // windows on those walls (below), its stacks and roofs dark against the sky, taken into the haze as all else.
    // THE SLATES UNDER THE MOON: the lower edge of every slate (a narrow band of its course, just over the dark of
    // its joint) is a rounded arris that runs along the roof: it catches the first moon's lamp by the usual mirror
    // law of a thin rounded edge (how near the half-way direction between the moon and the eye stands to square
    // across the course's run: vTwT), by the moon's place and the strength of the night where the slate stands. So
    // a road of small glints lies on the roofs under the moon. The soot-dark sea front takes none.
    // GLASS is known by its colour as built (blue over three times its red; a pane of a wall, on the walls' own
    // grid of 6 m by 8 m, also carries green): it takes no brick or slate, stands night-dark and, on the grid, has a
    // pale sash round it and a glazing cross.
    // THE STREET LAMPS' GLOW: every surface of the town takes each of the eleven gas lamps' warm light by its own
    // distance from that lamp's flame (uTwLamp, world metres; the square of what is left of a reach of 26 m, a
    // little over half the street's width, so a lamp washes the wall of its own pavement) and by how it faces it.
    const twLamp = { value: Array.from({ length: 11 }, () => new THREE.Vector3(0, -900, 0)) };
    townMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTwLamp = twLamp;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTwP; varying vec3 vTwN; varying vec3 vTwT;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTwP = position; vTwN = normal; vTwT = normalize(normalMatrix * (abs(normal.x) > abs(normal.z) ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)));');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTwP; varying vec3 vTwN; varying vec3 vTwT; uniform vec3 uTwLamp[11]; float twEdge = 0.0;')
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { vec3 twL = directionalLights[1].direction, twHalf = normalize(normalize(vViewPosition) + twL);
          float twAcross = clamp(1.0 - dot(twHalf, vTwT) * dot(twHalf, vTwT), 0.0, 1.0), twS = twAcross * twAcross; twS *= twS; twS *= twS;
          reflectedLight.directSpecular += nwK1 * directionalLights[1].color * (0.7 * twEdge * twS * smoothstep(-0.2, 0.3, dot(normal, twL)));
          float twE = 0.0;
          for (int twI = 0; twI < 11; twI++) { vec3 twTo = uTwLamp[twI] - vNwW; float twD = max(length(twTo), 1.0e-3), twF = 1.0 - clamp(twD / 26.0, 0.0, 1.0);
            twE += twF * twF * max(dot(normal, (viewMatrix * vec4(twTo / twD, 0.0)).xyz), 0.0); }
          reflectedLight.directDiffuse += diffuseColor.rgb * vec3(1.0, 0.56, 0.2) * (2.2 * twE); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
        { float twUp = abs(vTwN.y), twRoof = smoothstep(0.2, 0.3, twUp) * (1.0 - smoothstep(0.96, 0.99, twUp)), twWall = 1.0 - smoothstep(0.1, 0.2, twUp);
          float twRun = abs(vTwN.x) > abs(vTwN.z) ? vTwP.z : vTwP.x;
          float twH = mix(0.4, 0.5, twRoof), twL = mix(1.1, 1.3, twRoof);
          float twRow = floor(vTwP.y / twH), twFy = fract(vTwP.y / twH);
          float twAx = twRun / twL + 0.5 * mod(twRow, 2.0), twCol = floor(twAx), twFx = fract(twAx);
          float twTone = fract(sin(dot(vec2(twRow, twCol), vec2(12.9898, 78.233))) * 43758.5453);
          float twKeep = clamp(1.5 - fwidth(vTwP.y / twH) * 2.2, 0.0, 1.0) * clamp(twRoof + twWall, 0.0, 1.0);
          float twJoint = max(smoothstep(0.14, 0.0, twFy), 0.7 * smoothstep(0.05, 0.0, twFx));
          float twGlass = step(diffuseColor.r * 3.0 + 1.0e-4, diffuseColor.b), twGrid = step(diffuseColor.b * 0.25, diffuseColor.g);
          twKeep *= 1.0 - twGlass;
          twEdge = twKeep * twRoof * smoothstep(0.1, 0.16, twFy) * smoothstep(0.36, 0.22, twFy) * (1.0 - smoothstep(0.05, 0.35, -vTwN.z));
          diffuseColor.rgb *= mix(1.0, (0.9 + 0.2 * twTone) * (1.0 - 0.38 * twJoint), twKeep);
          { vec2 twG = vec2(vTwP.x - 3.0 - 6.0 * floor((vTwP.x - 3.0) / 6.0 + 0.5), vTwP.y - 14.0 - 8.0 * floor((vTwP.y - 14.0) / 8.0 + 0.5)) / vec2(1.3, 2.1);
            float twSash = twGrid * max(max(step(0.84, abs(twG.x)), step(0.9, abs(twG.y))), max(step(abs(twG.x), 0.07), step(abs(twG.y - 0.1), 0.045)));
            diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.012, 0.02, 0.05), vec3(0.2, 0.2, 0.22), twSash), twGlass); }
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.022, 0.02, 0.03), smoothstep(0.05, 0.35, -vTwN.z)); }`);
    };
    townMat.customProgramCacheKey = () => 'nw-town'; shade.patch(townMat, false, false);
    const pots = [], lampAt = [], litWin = [], seaWin = [], litPanes = [];
    {
      const M = makeMesher(), B = (w, h, d, x, y, z, col, ry = 0, rx = 0, rz = 0) => M.box(w, h, d, mat(x, y, z, ry, rx, rz), col);
      const GROUND = 3, onLand = (x, z) => townToWorld(x, 0, z)[2] > -2;
      const walls = ['#7a6a6c', '#857478', '#74666e', '#8a7672'], slates = ['#66728e', '#6e7a98', '#5e6884'];
      // rows: ridge line (z), eaves, ridge, stack top, where the stacks stand (x of one of them)
      const rows = [[-24, 58, 66, 76, 14], [-98, 36, 44, 54, -4], [-138, 52, 60, 72, 10], [-178, 30, 38, 46, 2], [-218, 24, 31, 38, 14], [-258, 20, 27, 34, 6], [-298, 17, 23, 29, 18], [-338, 15, 20, 26, 10]];
      // a house stands on the ground: the face it stands on is not built (one box without it, sized for each house)
      const HOUSE = (() => { const g = new THREE.BoxGeometry(1, 1, 1); g.setIndex(Array.from(g.index.array).filter((_, i) => i < 18 || i > 23)); return g.toNonIndexed(); })();
      // THE ROOFS' DRESS, every house of every row alike (stream nw-dormers deals what differs; no older stream is
      // touched): a lead-grey ridge with a roll along it and a metre of lead tile down either slope; at each eaves
      // a fascia board and a gutter; every third to fifth house of a row a dormer (lead cheeks and flat lead roof,
      // its pane toward the nursery) or a skylight lying in the slope, on the slope the row turns to the nursery,
      // 3 m to one side of the house's middle. A stack has two oversailing courses under its cap and lead flashing
      // on both slopes at its foot; of its pots one in four is tall and slim and one in four wears a cowl.
      const D = S.dormers, LEAD = '#585c68', FACE = new THREE.PlaneGeometry(1, 1).toNonIndexed(), ROLL = new THREE.CylinderGeometry(0.32, 0.32, 1, 6, 1, true).toNonIndexed(), COWL = new THREE.ConeGeometry(0.8, 0.7, 6, 1, true).toNonIndexed();
      // the eaves' member, a metre long (x), its back against the wall's face (z 0), the eaves' line at y 0: a
      // fascia's front, and the gutter's top, front and underside
      const EAVE = (() => { const g = new THREE.BufferGeometry(), p = [], n = [], quad = (a, b, c, d, nn) => { for (const v of [a, b, c, a, c, d]) { p.push(...v); n.push(...nn); } };
        quad([-0.5, -0.5, 0.12], [0.5, -0.5, 0.12], [0.5, 0.02, 0.12], [-0.5, 0.02, 0.12], [0, 0, 1]);
        quad([-0.5, -0.22, 0.5], [0.5, -0.22, 0.5], [0.5, 0.06, 0.5], [-0.5, 0.06, 0.5], [0, 0, 1]);
        quad([-0.5, 0.06, 0.5], [0.5, 0.06, 0.5], [0.5, 0.06, 0.12], [-0.5, 0.06, 0.12], [0, 1, 0]);
        quad([-0.5, -0.22, 0.12], [0.5, -0.22, 0.12], [0.5, -0.22, 0.5], [-0.5, -0.22, 0.5], [0, -1, 0]);
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); return g; })();
      // every pane a row turns to the nursery (rows across the street to the quay): [x, y, z, half width, half height, the slope it lies in]
      const panes = [];
      let ri = -1; const stands = new Map();
      for (const [zr, eaves, ridge, stackTop, sx] of rows) {
        ri++; await ctx.yield();
        let toDormer = D.int(1, 5);
        for (let x = -342; x <= 342; x += 12) {
          if (x === -6 || x === -174 || x === 162) await ctx.yield();
          if (ri === 0 && Math.abs(x) < 20) continue;
          if (!onLand(x - 6, zr - 14) || !onLand(x + 6, zr - 14) || !onLand(x - 6, zr + 14) || !onLand(x + 6, zr + 14)) continue;
          const jit = S.roofs.range(-1, 1), rise = ridge - eaves + jit * 0.6, len = Math.hypot(14, rise) + 0.7, pitch = Math.atan2(rise, 14);
          M.add(HOUSE, mat(x, (eaves + jit + GROUND) / 2, zr, 0, 0, 0, 12, eaves - GROUND + jit, 28), S.roofs.pick(walls)); stands.set(ri + ':' + x, [eaves + jit, rise]);
          const slate = S.roofs.pick(slates);
          for (const sd of [-1, 1]) B(12.1, 0.4, len, x, eaves + jit + rise / 2 + 0.1, zr + sd * 7, slate, 0, sd * pitch);
          // (top: the slates' surface at the ridge; at: its height z0 metres down the near slope)
          const top = eaves + jit + rise + 0.1 + 0.2 / Math.cos(pitch), at = (z0) => top - z0 * Math.tan(pitch);
          M.add(ROLL, mat(x, top + 0.1, zr, 0, 0, Math.PI / 2, 1, 12.1, 1), LEAD);
          for (const sd of [-1, 1]) {
            M.add(FACE, mat(x, top - 0.5 * Math.sin(pitch) + 0.06, zr + sd * 0.5 * Math.cos(pitch), sd > 0 ? 0 : Math.PI, pitch - Math.PI / 2, 0, 12.1, 1, 1), LEAD);
            M.add(EAVE, mat(x, eaves + jit, zr + sd * 14, sd > 0 ? 0 : Math.PI, 0, 0, 12, 1, 1), sd > 0 ? '#3c3e4c' : LEAD);
          }
          if (--toDormer > 0) continue;
          toDormer = D.int(3, 5);
          const dx = D.pick([-3, 3]), dormer = D.chance(0.5);
          if (dormer) { const deep = 2.6 / Math.tan(pitch) + 0.3, y0 = at(9);
            B(3, 3.6, deep, x + dx, y0 + 0.8, zr + 9 - deep / 2, LEAD); B(3.4, 0.14, deep + 0.3, x + dx, y0 + 2.67, zr + 9.15 - deep / 2, '#6a6e7a');
            M.add(FACE, mat(x + dx, y0 + 1.35, zr + 9.03, 0, 0, 0, 2.2, 1.9, 1), '#0000a0'); if (ri > 0) panes.push([x + dx, y0 + 1.35, zr + 9.03, 1.1, 0.95, 0]);
          } else { const y0 = at(7) + 0.12 / Math.cos(pitch);
            B(2.4, 0.24, 3, x + dx, y0 - 0.12 / Math.cos(pitch), zr + 7, LEAD, 0, pitch);
            M.add(FACE, mat(x + dx, y0 + 0.02, zr + 7, 0, pitch - Math.PI / 2, 0, 2, 2.6, 1), '#0000a0'); if (ri > 0) panes.push([x + dx, y0 + 0.02, zr + 7, 1, 1.3, pitch]); }
        }
        await ctx.yield();
        for (let x = sx - 24 * 15; x <= 342; x += 24) {
          if (ri === 0 && Math.abs(x) < 20) continue;
          if (!stackStands(x, zr)) continue;
          B(8, stackTop - ridge + 4, 3, x, (stackTop + ridge - 4) / 2, zr, '#8a6a62');
          B(8.6, 0.6, 3.6, x, stackTop - 0.3, zr, '#9a8078'); B(8.3, 0.35, 3.3, x, stackTop - 0.775, zr, '#927468');
          // flashing: on each house the stack stands on, 0.9 m of lead up either slope from the stack's foot
          for (const hx of new Set([12 * Math.floor((x - 4.5) / 12) + 6, 12 * Math.floor((x + 4.5) / 12) + 6])) { const h = stands.get(ri + ':' + hx);
            if (!h) continue;
            const p = Math.atan2(h[1], 14), x0 = Math.max(x - 4.5, hx - 6), x1 = Math.min(x + 4.5, hx + 6), y = h[0] + h[1] + 0.1 + 0.2 / Math.cos(p) - 1.95 * Math.tan(p) + 0.05;
            for (const sd of [-1, 1]) M.add(FACE, mat((x0 + x1) / 2, y, zr + sd * 1.95, sd > 0 ? 0 : Math.PI, p - Math.PI / 2, 0, x1 - x0, 0.9 / Math.cos(p), 1), LEAD); }
          for (const px of [-2.7, -0.9, 0.9, 2.7]) {
            // (0, 1: a plain pot; 2: a pot with a cowl over it; 3: a tall slim pot)
            const h0 = 3.2 + S.roofs.range(0, 0.8), kind = D.int(0, 3), h = kind === 3 ? h0 * 1.5 : h0;
            M.add(new THREE.CylinderGeometry(kind === 3 ? 0.45 : 0.55, kind === 3 ? 0.62 : 0.75, h, 7), mat(x + px, stackTop + h / 2, zr), '#b07a60');
            if (kind === 2) M.add(COWL, mat(x + px, stackTop + h + 0.4, zr), '#6a5a56');
            if (Math.abs(x) < 190 && ri > 0 && ri < 5 && S.smoke.chance(0.6)) pots.push([x + px, stackTop + h + (kind === 2 ? 0.75 : 0), zr]);
          }
        }
      }
      await ctx.yield();
      // the street between our row and the next: eleven gas lamps 15 m tall, 30 m apart, on alternate pavements
      for (let k = 0; k < 11; k++) { const x = -150 + k * 30, z = k % 2 ? -45 : -77; M.add(new THREE.CylinderGeometry(0.25, 0.4, 14, 6), mat(x, GROUND + 7, z), '#20222c'); B(1.4, 1.8, 1.4, x, GROUND + 14.9, z, '#2a2c38'); lampAt.push([x, GROUND + 14.9, z]); }
      lampAt.forEach((q, i) => twLamp.value[i].set(...townToWorld(q[0], q[1], q[2])));
      // two lit windows in the row across the street, by the seed
      for (let k = 0; k < 2; k++) litWin.push([(k ? 1 : -1) * 12 * S.town.int(1, 5) + S.town.range(-2.5, 2.5), S.town.pick([14, 22, 30]), -83.9]);
      // and a dozen or so warm windows under the eaves of the lower rows toward the water, where someone is still up
      for (let k = S.windows.int(12, 16); k > 0; k--) {
        const [zr, eaves] = rows[S.windows.int(3, 7)], x = 12 * S.windows.int(-9, 13) + S.windows.pick([-3, 3]);
        if (onLand(x - 9, zr - 14) && onLand(x + 9, zr - 14)) litWin.push([x, eaves - 3.4 - S.windows.range(0, 0.6), zr + 14.1]);
      }
      // THE SEA FRONT (see the town's material): the rows are cut off askew by the quay, so the last house of a row
      // shows its side wall to the sea: that wall is tarred against the weather (a soot-dark boarding, one sheet a
      // hand's breadth off the whole side of every house, in every row but the nursery's own, that has no neighbour
      // on its quay side).
      // And a scatter of warm windows where someone is still up, ten dealt to each of those rows (stream nw-seawin):
      // a house of the row, left or right of its middle; one in three in the sea wall's top storey, the others an
      // attic window standing in the far slope (half-way to three quarters down it, wholly under the ridge). One
      // dealt to a house that does not stand (past the quay's line) is not lit.
      for (let r = 1; r < rows.length; r++) {
        const zr = rows[r][0];
        for (let x = -342; x <= 342; x += 12) { const h = stands.get(r + ':' + x); if (h && !stands.has(r + ':' + (x + 12))) M.add(new THREE.PlaneGeometry(28.2, h[0] - GROUND).rotateY(Math.PI / 2), mat(x + 6.3, (h[0] + GROUND) / 2, zr), '#0c0b10'); }
        for (let k = 0; k < 10; k++) {
          const x = 12 * S.seawin.int(-29, 28) + 6, side = S.seawin.pick([-3, 3]), up = S.seawin.range(0, 0.6), attic = S.seawin.int(0, 2) > 0, f = S.seawin.range(0.5, 0.75), h = stands.get(r + ':' + x);
          if (!h) continue;
          if (attic) seaWin.push([x + side, h[0] + h[1] * (1 - f) + 1.45, zr - 14 * f - 0.05, 1.1]); else seaWin.push([x + side, h[0] - 3.4 - up, zr - 14.4, 2.1]);
        }
      }
      dealt.seaWin = seaWin;
      // THE WALLS' PANES, rows across the street to the quay: in the wall each house turns to the nursery, a pane
      // (2.6 m by 4.2 m, five times life) 3 m either side of the house's middle on every storey: the first at 14 m,
      // one every 8 m above it while a pane stands whole 1.6 m under the lowest eaves of its row. Where a lit window
      // of the older deals stands, no pane is set over it.
      // OF ALL THESE PANES AND THE NEAR SLOPES' (dormers, skylights) ONE IN FOUR TO SIX IS WARMLY LIT, steady: walking
      // them in the order they are built, the next lit one is the fourth to sixth on (stream nw-dormers), in one of
      // three warm tones, with a glazing cross or a half-drawn blind. None is keyed to anyone.
      for (let r = 1; r < rows.length; r++) {
        const zr = rows[r][0], low = rows[r][1] - 1;
        await ctx.yield();
        for (let x = -342; x <= 342; x += 12) { if (!stands.has(r + ':' + x)) continue;
          for (let y = 14; y + 2.1 + 1.6 <= low; y += 8) for (const dx of [-3, 3]) {
            if (litWin.some((w) => Math.abs(w[2] - zr - 14.1) < 0.5 && Math.abs(w[0] - x - dx) < 3 && Math.abs(w[1] - y) < 4.6)) continue;
            M.add(FACE, mat(x + dx, y, zr + 14.05, 0, 0, 0, 2.6, 4.2, 1), '#0060a0'); panes.push([x + dx, y, zr + 14.05, 1.3, 2.1, 0]); } }
      }
      let toLit = D.int(4, 6);
      for (const p of panes) if (--toLit === 0) { toLit = D.int(4, 6); litPanes.push([...p, 3 + 2 * D.int(0, 2) + (D.chance(0.5) ? 1 : 0)]); }
      Object.assign(dealt, { panes, litPanes });
      town.add(new THREE.Mesh(M.build(), townMat));
      await ctx.yield();
      // the land the town stands on and the quay wall along the water, on the world's own axes
      const W = makeMesher();
      W.box(1500, 3, 900, mat(0, GROUND - 1.5, 437), '#565a70'); W.box(1500, 6, 5, mat(0, 0.6, -10.5), '#6c6e80'); W.box(1500, 0.5, 9, mat(0, GROUND + 0.2, -8), '#7a7c8e');
      // a few craft moored along it: low hulls and bare masts
      for (let k = 0; k < 6; k++) {
        const x = (k < 3 ? -1 : 1) * (45 + (k % 3) * 62 + S.town.range(0, 30)), z = -26 - S.town.range(0, 10), ry = S.town.range(-0.2, 0.2), h = S.town.range(22, 32);
        W.box(6, 3.4, 26, mat(x, 1.0, z, ry), '#2a2630'); W.box(4, 2.2, 6, mat(x, 2.4, z - 13 * Math.cos(ry), ry), '#2a2630');
        for (const off of [-6, 5]) { const mx = x + Math.sin(ry) * off, mz = z + Math.cos(ry) * off; W.add(new THREE.CylinderGeometry(0.16, 0.3, h, 6), mat(mx, 2.6 + h / 2, mz), '#3a3440'); for (const yy of [0.45, 0.7]) W.add(new THREE.CylinderGeometry(0.12, 0.12, h * 0.36, 5), mat(mx, 2.6 + h * yy, mz, ry, 0, Math.PI / 2), '#3a3440'); }
      }
      const shoreMesh = new THREE.Mesh(W.build(), townMat); scene.add(shoreMesh); town.userData.shore = shoreMesh;
    }
    await ctx.yield();


    // ---- the town's lights and life: the lamps' flames and their pools on the street, two lit windows, smoke leaning
    // from six pots in ten, a cat walking a ridge
    // the pots' smoke stands in the town's own night: the night's cloud shade, a third of the way to its lit colour
    const townU = { uTime: { value: 0 }, uSmoke: { value: new THREE.Color().fromArray(SKIES[0], FIELDS.cloudShade).lerp(new THREE.Color().fromArray(SKIES[0], FIELDS.cloudLit), 0.35) } };
    const lampGlow = fx.makeGlows({ rng: S.lamps, positions: lampAt.map((p) => townToWorld(p[0], p[1], p[2])), color: '#ffc070', size: 7, intensity: 2.4, flicker: 0.22, halo: 1, fogAmount: 0.4 });
    scene.add(lampGlow.object);
    {
      const pos = [], uvk = [], idx = [];
      const quad = (c, a, b, kind) => { const n = pos.length / 3; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(c[0] + a[0] * u + b[0] * v, c[1] + a[1] * u + b[1] * v, c[2] + a[2] * u + b[2] * v); uvk.push(u, v, kind); } idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
      for (const [x, y, z] of lampAt) quad([x, 3.12, z], [15, 0, 0], [0, 0, 15], 0);
      for (const [x, y, z] of litWin) { quad([x, y, z], [1.3, 0, 0], [0, 2.1, 0], 1); quad([x, 3.14, z + 7], [6, 0, 0], [0, 0, 7], 0); }
      // the sea front's windows (kind 2) are seen across the water: their light is thinned by the air between, as
      // the fog thins every surface (the scene's own fog law and density; the lamps and near windows are as they
      // were); they are panes in a wall or a slope, so they show from their sea side only
      for (const [x, y, z, hh] of seaWin) quad([x, y, z], [-1.3, 0, 0], [0, hh, 0], 2);
      // the lit panes of the walls and near slopes (kinds 3 to 8: tone and cross): each lies a hand's breadth over
      // its own pane, in the wall's face or in the slope; thinned by the air and shown from its own side, as kind 2
      for (const [x, y, z, hw, hh, p, kind] of litPanes) quad(p ? [x, y + 0.05 * Math.cos(p), z + 0.05 * Math.sin(p)] : [x, y, z + 0.05], [hw, 0, 0], p ? [0, hh * Math.sin(p), -hh * Math.cos(p)] : [0, hh, 0], kind);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uvk, 3)); g.setIndex(idx);
      const lit = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...townU, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
        vertexShader: /* glsl */`attribute vec3 aUv; uniform float fogDensity; varying vec3 vUv; varying vec3 vP; varying float vAir;
          void main(){ vUv = aUv; vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vAir = aUv.z > 1.5 ? exp(-min(fogDensity * fogDensity * mv.z * mv.z, 40.)) : 1.; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform float uTime; varying vec3 vUv; varying vec3 vP; varying float vAir;
          void main(){ float r = length(vUv.xy), fl = .86 + .14 * sin(uTime * 6.1 + vP.x * .7) * sin(uTime * 3.7 + vP.x * 1.3);
            vec3 c = vUv.z < .5 ? vec3(1., .62, .26) * .4 * smoothstep(1., 0., r) * smoothstep(1., .25, r) * fl
              : vec3(1., .7, .34) * 1.5 * (1. - .5 * max(smoothstep(.06, .0, abs(vUv.x)), smoothstep(.04, .0, abs(vUv.y - .1))));
            if (vUv.z > 2.5) { float tone = floor((vUv.z - 3.) * .5 + .01), cross = vUv.z - 3. - 2. * tone;
              c = (tone < .5 ? vec3(1., .7, .34) : tone < 1.5 ? vec3(1., .84, .52) : vec3(1., .54, .22)) * .85
                * mix(.72 + .28 * smoothstep(.55, .15, vUv.y), 1. - .5 * max(smoothstep(.06, .0, abs(vUv.x)), smoothstep(.04, .0, abs(vUv.y - .1))), step(.5, cross))
                * smoothstep(1., .9, abs(vUv.x)) * smoothstep(1., .94, abs(vUv.y)); }
            if (vUv.z > 1.5 && !gl_FrontFacing) discard;
            gl_FragColor = vec4(c * vAir, 1.); }` }));
      lit.renderOrder = 2; town.add(lit);
      // smoke: five puffs a pot, each rising 12 m and leaning down the wind as it goes, on the clock
      const NP = pots.length * 5, base = new THREE.PlaneGeometry(1, 1), sg = new THREE.InstancedBufferGeometry(); sg.index = base.index; sg.setAttribute('position', base.attributes.position); sg.setAttribute('uv', base.attributes.uv);
      const src = new Float32Array(NP * 4);
      pots.forEach((p, i) => { for (let k = 0; k < 5; k++) src.set([p[0], p[1], p[2], k / 5 + S.smoke() * 0.2 + i * 0.37], (i * 5 + k) * 4); });
      sg.setAttribute('aSrc', new THREE.InstancedBufferAttribute(src, 4)); sg.instanceCount = NP;
      const smoke = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: townU, transparent: true, depthWrite: false, fog: false,
        vertexShader: /* glsl */`attribute vec4 aSrc; uniform float uTime; varying vec2 vUv; varying float vA;
          void main(){ float age = fract(uTime * .09 + aSrc.w); vUv = uv * 2. - 1.;
            vec3 p = aSrc.xyz + vec3(1., 0., -.25) * (age * age * 16. + sin(age * 9. + aSrc.w * 30.) * .6) + vec3(0., age * 12., 0.);
            vec4 mv = modelViewMatrix * vec4(p, 1.0); mv.xy += position.xy * (1.6 + 6.5 * age);
            vA = sin(3.14159 * sqrt(clamp(age, 0., 1.))) * .34; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform vec3 uSmoke; varying vec2 vUv; varying float vA;
          void main(){ float r = length(vUv); float a = smoothstep(1., .2, r) * vA; gl_FragColor = vec4(uSmoke * (1.15 - .35 * vUv.y), a); }` }));
      smoke.frustumCulled = false; smoke.renderOrder = 3; town.add(smoke);
    }
    // the cat: a small dark shape walking the ridge across the street, away from the stack by our way
    const cat = (() => { const M = makeMesher();
      M.box(2.4, 0.9, 0.7, mat(0, 1.25, 0), '#17151c'); M.box(0.8, 0.8, 0.75, mat(1.45, 1.75, 0), '#17151c');
      for (const sd of [-1, 1]) { M.add(new THREE.ConeGeometry(0.16, 0.4, 4), mat(1.6, 2.3, sd * 0.24), '#17151c'); for (const lx of [-0.9, 0.9]) M.box(0.2, 0.9, 0.2, mat(lx, 0.45, sd * 0.2), '#17151c'); }
      M.box(0.16, 1.5, 0.16, mat(-1.25, 2.0, 0, 0, 0, 0.35), '#17151c');
      const c = new THREE.Mesh(M.build(), townMat); c.rotation.y = Math.PI; town.add(c); return c; })();
    const catPh = S.cat() * 40;
    await ctx.yield();

    // ---- THE PACE BY PLACE (the first of the two declared pacings): slow in the nursery, fast in the dive, slow over
    // the lagoon and in the leaves. Each ramp runs from one place of the route to the next: the window, the first ridge,
    // the quay's line, the dive's middle, the place it levels, the cloud's foot, the head of the drop round the reef's
    // southern end, the low place by the surf, the north-east point, abeam the bow's east foot, the beach, the ring,
    // the canopy's top, abeam the brig.
    const A = hero.anchors, abeam = (v) => mAt(v.x, v.y, v.z), mBowEast = abeam(A.bowEast);
    const paceKeys = [[0, 0.75], [AT.window, 0.75], [AT.ridge, 1], [AT.quay, 1], [AT.dive, 1.3], [AT.level, 1.3], [AT.cloudFoot, 1], [AT.dropHead, 1], [AT.surf, 0.85], [AT.northEast, 0.8], [mBowEast, 0.7],
      [AT.beach, 0.7], [AT.ring, 0.5], [AT.top, 0.5], [abeam(A.brig), 1], [LEN, 1]];
    const pace = (u) => { const m = u * LEN; let i = 1; while (i < paceKeys.length - 1 && paceKeys[i][0] < m) i++; const a = paceKeys[i - 1], b = paceKeys[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], m)); };
    // metres a second flown at m metres: the pace there, scaled as the engine scales it so that the flight lasts DUR
    const paceScale = (() => { let inv = 0; for (let i = 0; i < 64; i++) inv += 2 / (pace(i / 64) + pace((i + 1) / 64)); return inv / 64; })();
    const speedAt = (m) => pace(m / LEN) * paceScale * LEN / DUR;

    // ---- THE LOOKS (the second declared pacing): one after another, each aimed at a PLACE of the world, each from one
    // place of the route until another. A place of the route is the point of it nearest to a place of the world
    // (`abeam`), or where it crosses a line of the map. Each gives way over the same 40 m, 20 either side of its two
    // places. A look that ends on its own subject holds until the subject is abeam. THE TURN: where the subject stands
    // so near the line that the gaze would then swing faster than the camera may turn (the look's weight x the metres
    // a second flown there / the subject's distance from the line, over SWING = 30 degrees a second), the look lets
    // go TURN = a second and a half earlier, worked out from the pace flown there (the least time a turn may take).
    const rp = (m, out) => path.posAtDist(clamp(m, 0, LEN), out);
    const pA = new THREE.Vector3(), pB = new THREE.Vector3();
    const TURN = 1.5, SWING = 30 * Math.PI / 180;
    const letGo = (v, weight) => { const m = abeam(v); rp(m, pA); return weight * speedAt(m) / Math.max(pA.distanceTo(v), 1) > SWING ? m - TURN * speedAt(m) : m; };
    const gameMid = new THREE.Vector3((A.bowWest.x + A.bowEast.x) / 2, 6, (A.bowWest.z + A.bowEast.z) / 2), farMouth = new THREE.Vector3(0, 2, J[2]);
    // THE EAST CLIFF'S TOP: the cliff runs from the reef's southern end to the north-east point; at each of its two
    // third points the highest ground within 14 m of where the land first stands 9 m high, coming in from the sea; the
    // look takes the place half-way between the two (one look, since the two points come abeam within one hand-over)
    const reefEnd = new THREE.Vector3(PLACES.reef[0][0], 0, PLACES.reef[0][1]), northEast = new THREE.Vector3(PLACES.northEast[0], 0, PLACES.northEast[1]);
    const cliffTop = (z) => { let x = reefEnd.x + 4; while (x > -60 && hero.land.height(x, z) < 9) x -= 1; let bx = x, bh = -1e9; for (let k = 0; k <= 14; k++) { const h = hero.land.height(x - k, z); if (h > bh) { bh = h; bx = x - k; } } return new THREE.Vector3(bx, bh + 2, z); };
    const cliff = cliffTop(lerp(reefEnd.z, northEast.z, 1 / 3)).lerp(cliffTop(lerp(reefEnd.z, northEast.z, 2 / 3)), 0.5);
    const peak = new THREE.Vector3(PLACES.peak[0], hero.land.height(PLACES.peak[0], PLACES.peak[1]), PLACES.peak[1]);
    const mNorthEast = abeam(northEast), mWell = abeam(hero.well.pts[0]);
    const mReefEnd = abeam(reefEnd), mCliff = letGo(cliff, 0.42), mRock = letGo(A.rock, 0.6), mHouse = letGo(A.redHouse, 0.35), mLamp = letGo(A.lamp, 0.4);
    // (the turns' arithmetic kept for the report: name, abeam, pace, distance, swing in degrees a second, where it lets go)
    scene.userData.looksAt = { mReefEnd, mCliff, mNorthEast, mBowEast, mRock, mWell, mHouse, mLamp, house: A.redHouse, wellTop: abeam(hero.well.pts[2]) };
    scene.userData.turns = [['cliff', cliff, 0.42], ['rock', A.rock, 0.6], ['house', A.redHouse, 0.35], ['lamp', A.lamp, 0.4]].map(([n, v, w]) => { const m = abeam(v); rp(m, pA); return [n, m, speedAt(m), pA.distanceTo(v), w * speedAt(m) / Math.max(pA.distanceTo(v), 1) * 180 / Math.PI, letGo(v, w)]; });
    const pois = [], EASE = 40;
    const look = (m0, m1, weight, at) => { if (m1 >= m0 + EASE) pois.push({ at, weight, from: (m0 - EASE * 0.5) / LEN, to: (m1 + EASE * 0.5) / LEN, fade: Math.min(0.5, EASE / (m1 - m0 + EASE)) }); };
    // 1. the far mouth of the cleft, on the water: from the quay's line (the sea opens) to the cloud's foot (it holds the gaze up in the dive)
    look(AT.quay, AT.cloudFoot, 0.5, farMouth);
    // 2. the island's middle: from the cloud's foot (the cleft opens the view to it; it holds the gaze on the climb
    //    through the cleft) until the reef's southern end is abeam (it holds the gaze on the drop)
    look(AT.cloudFoot, mReefEnd, 0.55, hero.center);
    // 3. the east cliff's top: from abeam the reef's southern end until it is abeam itself
    look(mReefEnd, mCliff, 0.42, cliff);
    // 4. the peak, along the east shore: from where the cliff's top is abeam until the north-east point is abeam
    look(mCliff, mNorthEast, 0.4, peak);
    // 5. the game between the bow's feet: from where the north-east point is abeam until the bow's east foot is
    //    abeam (the line turns 70 degrees in 80 m at the point; the peak's look before it has the gaze inland
    //    already, so the eased camera keeps under 30 degrees a second there at this weight)
    look(mNorthEast, mBowEast, 0.72, gameMid);
    // 6. the rock: from abeam the bow's east foot until the rock is abeam
    look(mBowEast, mRock, 0.6, A.rock);
    // 7. the red house in the leaves: from abeam the rock (over the beach, through the ring and up the well) until it
    //    is abeam, less the turn. Not from the well's foot (mWell, where the line has risen 12 m over the grove's
    //    floor): from there to where this look must let go is under half a hand-over, so a look begun there would
    //    never reach its weight and by the rule above would be left out.
    look(mRock, mHouse, 0.35, A.redHouse);
    // 8. the brig's green lamp: from there (over the canopy's top and down the fall to the creek) until it is abeam, less the turn
    look(mHouse, mLamp, 0.4, A.lamp);


    await ctx.yield();
    // ---- the cloud: nine towers (twelve on a day visit) either side of the straight between z -130 and -192, their
    // nearest flanks 15 to 25 m from the line before the gate and GATE.off from it in the gate (the last two are the
    // narrowest and stand in the gate, so the bank ends where the sundown begins), their bases 4 to 8 m over the sea, so the bank stands on the water and closes the view under it; and the shower's
    // own cloud over the lagoon, its base 40 m up where the rain begins (on a showery visit a second, wider one over
    // the far shower out at sea). They do not drift.
    // THE BANK OPENS AS A GATE: from the line across the sea 45 m before the bank's far edge (GATE.z) on, a tower
    // stands off so that its main heap's flank is GATE.off metres from the flight line (not 15 to 25), and no puff's
    // skin stands within GATE.off of the line in plan there (see the rule of the puffs below). A rule of the map: it
    // reads a tower's own z and the line as it lies. A flank is dealt for every tower but the last two, before its z is
    // known; for a tower that falls in the gate the dealt flank is not used. THE DRAW IS KEPT, so stream nw-cloud deals
    // width, flank, height and z in the same order whether or not a tower stands in the gate.
    const towers = [], NT = hourWish === 'day' ? 12 : 9, GATE = { z: J[2] + 45, off: 45, size: 0.45 };
    for (let i = 0; i < NT; i++) {
      const w = i >= NT - 2 ? S.cloud.range(52, 64) : S.cloud.range(60, 110), flank = i >= NT - 2 ? GATE.off : S.cloud.range(15, 25), side = i % 2 ? 1 : -1;
      const y = S.cloud.range(4, 8), z = -130 - 62 * i / (NT - 1) + S.cloud.range(-3, 3);
      towers.push([side * ((z <= GATE.z ? GATE.off : flank) + w * 0.5), y, z, w]);
    }
    towers.push([A.shower.x, A.shower.y, A.shower.z, 50]); if (A.showerFar) towers.push([A.showerFar.x, A.showerFar.y, A.showerFar.z, 90]);
    // the lane through the bank is a cleft open down to the sea: no puff stands within 12 m of the flight line's plan at
    // 12 m over the line, widening to 20 m at the water, from 36 m before the cloud's foot to 24 m past its far edge; so the towers stand
    // as walls on both hands, nothing hangs as a veil across the way and nothing round sits in front of what lies beyond.
    // THE WORLD KEEPS THIS LANE ITSELF (the rule of the puffs below): the kit is handed no lane, so it shrinks and
    // fades nothing; a puff that would reach into the lane is not there at all.
    const lane = [];
    for (let m = AT.cloudFoot - 36; m <= AT.cloudEdge + 24; m += 10) { rp(m, pA); lane.push([pA.x, pA.y + 12, pA.z, 12, 0, 20]); }
    const clouds = makeCloudField({ rng: S.cloud, mode: 'cumulus', at: towers, height: 1.12, puffs: Math.round(lerp(30, 46, detail)), wind: [0, 0, 0], hazeColor: '#d6e2f2', opacity: 0.86, sunDirection: [0, 1, 0], sunColor: '#ffffff', litColor: '#ffffff', shadeColor: '#9ea6cc', fogFade: 0.5, nearFade: [NEAR[0] / 110, NEAR[1] / 110] });
    // CLOUD IS A MEDIUM: a puff thins only inside NEAR (0.6 to 2.5 m) of the eye, in true metres. The kit's law takes
    // its range times each puff's own size, so the range is given here in metres as a law of this bank (where the kit's
    // line is not found, the range above, divided by the widest tower, stands). No puff's skin is on the line at all:
    // the lane above keeps every one 12 m and more from it.
    { const m = clouds.material, kit = 'smoothstep(size*uFade.x, size*uFade.y, dist)';
      if (m.vertexShader.includes(kit)) { m.vertexShader = m.vertexShader.replace(kit, 'smoothstep(uFade.x, uFade.y, dist)'); clouds.uniforms.uFade.value.x = NEAR[0]; clouds.uniforms.uFade.value.y = NEAR[1]; } }
    // A CLOUD IS LIT WHERE IT STANDS, never by where the eye is. Each puff weighs the four skies by ITS OWN z against
    // the three lines of the map (the same 40 m, 20 either side, as every lit surface: the shade patch of the part).
    // Its lit and shade colours are the four skies' own cloud colours by those weights; its light comes from three
    // lamps on three fixed bearings (the first moon's over the night and the first light, the day's from above, the
    // low sun's), each by the strength of its own sky at the puff: only strengths cross, no bearing is blended. So
    // the bank stands in white day from every water and at every moment, the towers at its two ends take the first
    // light and the sundown by where they stand, and the island's shower clouds stand under the low sun always. The
    // kit's own shader lights every puff by one lamp: its lines are replaced here (if one of them is not found,
    // the whole field keeps the day's fixed light instead: still nothing of the eye's).
    // A CLOUD HAS A LIT SIDE AND A SHADED FOOT, by the sky each puff stands in: its tone runs from that sky's cloud
    // shade at the foot of its heap and tower to that sky's lit colour at the crown, and a puff on the side of its
    // tower turned from that sky's lamp stands in the shade's colour. Height and side are the puff's own in its
    // tower (what the kit deals it); nothing of the eye's. This is the law of a tower that STANDS ON THE SEA (its
    // flat foot under uNwFoot, 12 m: the bank's are dealt 4 to 8 m); the shower's cloud, whose base hangs 40 m and
    // more over the lagoon, keeps its light as it was.
    { const m = clouds.material, cu = clouds.uniforms, col = (f, k = 1) => SKIES.map((K) => new THREE.Vector3().fromArray(K, f).multiplyScalar(k));
      Object.assign(cu, { uNwJoin: { value: new THREE.Vector3(...J) }, uNwLamp: { value: [LAMP[0], LAMP[1], SUN].map((d) => new THREE.Vector3(...d)) },
        uNwKey: { value: col(FIELDS.key, 0.35) }, uNwLit: { value: col(FIELDS.cloudLit) }, uNwShd: { value: col(FIELDS.cloudShade) }, uNwFoot: { value: 12 } });
      const VARY = 'varying vec4 vNwW; varying vec3 vNwRim, vNwDir;';
      const swaps = [[0, 'void main(){', 'uniform vec3 uNwJoin, uNwLamp[3], uNwKey[4]; uniform float uNwFoot; ' + VARY + /* glsl */`
        // one fixed lamp S of strength k and colour C on a puff seen along V: what it adds to the puff's tone, to how
        // far it is seen against the light, to the folds' light and to the rim
        void nwLampOn(vec3 S, float k, vec3 C, vec3 V, vec3 n, float sil, float crest, inout float tone, inout float back, inout vec2 rim){
          float m = dot(V, S), b = max(m, 0.); b *= b; float b6 = b*b*b, b36 = b6*b6*b6; b36 *= b36;
          float tg = (b6*.24 + b36*b6*1.3)*(.12 + .88*sil)*(.35 + .65*crest), br = .215/pow(max(1.16 - .8*m, .3), 1.5)*(.1 + .9*sil)*crest;
          tone += k*cloudTone(n, b, S); back += k*b; vNwDir += S*(k*(1. - .7*b)); vNwRim += C*(br*.56 + tg);
          float l = dot(C, vec3(.3333)); rim += l*vec2(tg, br*.56 + tg); }
        void main(){`],
        [0, 'vData = vec4(seed, big, iData.z*fade, iData.w);', /* glsl */`{
          float nwT0 = 1. - smoothstep(uNwJoin.x - 20., uNwJoin.x + 20., c.z), nwT1 = 1. - smoothstep(uNwJoin.y - 20., uNwJoin.y + 20., c.z), nwT2 = 1. - smoothstep(uNwJoin.z - 20., uNwJoin.z + 20., c.z);
          vNwW = vec4(1. - nwT0, nwT0*(1. - nwT1), nwT1*(1. - nwT2), nwT2); vNwDir = vec3(0.); vNwRim = vec3(0.);
          float nwTone = 0.; vec2 nwRim = vec2(0.); back = 0.;
          nwLampOn(uNwLamp[0], vNwW.x + vNwW.y, vNwW.x*uNwKey[0] + vNwW.y*uNwKey[1], V, iNrm.xyz, sil, crest, nwTone, back, nwRim);
          nwLampOn(uNwLamp[1], vNwW.z, vNwW.z*uNwKey[2], V, iNrm.xyz, sil, crest, nwTone, back, nwRim);
          nwLampOn(uNwLamp[2], vNwW.w, vNwW.w*uNwKey[3], V, iNrm.xyz, sil, crest, nwTone, back, nwRim);
          // a lit side and a shaded foot: nwUp is how high the puff sits (in its own heap, by the kit's own deal of its
          // shade, and in its whole tower, by its place in it), nwSide how it is turned to the lamp of its own sky
          float nwSide = dot(iNrm.xyz, uNwLamp[0])*(vNwW.x + vNwW.y) + dot(iNrm.xyz, uNwLamp[1])*vNwW.z + dot(iNrm.xyz, uNwLamp[2])*vNwW.w;
          float nwUp = mix(clamp(1. - iData.y/.22, 0., 1.), clamp(.38 + .62*iNrm.y, 0., 1.), .5);
          float nwBank = step(iData.w, uNwFoot);
          big = max(mix(nwTone - iData.y, mix(.1, 1.08, smoothstep(0., .85, nwUp))*mix(.55, 1., smoothstep(-.5, .4, nwSide)), nwBank), mix(uLight.x, .1, nwBank)); broad = 0.; tight = .08*nwRim.x/max(nwRim.y, 1e-4); }
          vData = vec4(seed, big, iData.z*fade, iData.w);`],
        [1, 'uniform sampler2D uNoise;', 'uniform sampler2D uNoise; uniform vec3 uNwLit[4], uNwShd[4]; ' + VARY],
        [1, 'dot(N, uSunDir)*.3*vAux.x', 'dot(N, vNwDir)*.3'],
        [1, 'vec3 col = mix(mix(uBottom, uShade, smoothstep(-.5, .7, vNrm.y + N.y*.5)), uLit, light);', /* glsl */`vec3 nwLit = vNwW.x*uNwLit[0] + vNwW.y*uNwLit[1] + vNwW.z*uNwLit[2] + vNwW.w*uNwLit[3], nwShd = vNwW.x*uNwShd[0] + vNwW.y*uNwShd[1] + vNwW.z*uNwShd[2] + vNwW.w*uNwShd[3];
          vec3 col = mix(mix(nwShd*.8, nwShd, smoothstep(-.5, .7, vNrm.y + N.y*.5)), nwLit, light);`],
        [1, 'col += uSunColor*(uSilver*rim);', 'col += vNwRim*(uSilver*(thin*smoothstep(-.1, .75, dot(vUv, vOut)/(r + .05)) + vLit.y));']];
      const src = [m.vertexShader, m.fragmentShader];
      if (swaps.every(([k, a]) => src[k].split(a).length === 2)) { for (const [k, a, b] of swaps) src[k] = src[k].replace(a, b); m.vertexShader = src[0]; m.fragmentShader = src[1]; }
      else { cu.uSunDir.value.fromArray(LAMP[1]); cu.uSunColor.value.setRGB(...cu.uNwKey.value[2].toArray()); cu.uLit.value.setRGB(...cu.uNwLit.value[2].toArray()); cu.uShade.value.setRGB(...cu.uNwShd.value[2].toArray()); cu.uBottom.value.copy(cu.uShade.value).multiplyScalar(0.8); }
      dealt.cloudLit = m.vertexShader.includes('nwLampOn'); }
    // THE RULE OF THE PUFFS, measured once at build, every puff against the line as it lies (never the eye):
    // A PUFF IS WHOLE OR IT IS NOT THERE: one whose skin (0.78 of its size at its breath's large end, the kit's own
    // measure of a puff) would reach into the lane above is taken out; none is shrunk to fit the lane, none faded.
    // THE GATE: a puff of the bank whose skin reaches the gate's stretch (z <= GATE.z) stands, skin and all,
    // GATE.off metres and more from the line in plan, or it is taken out; and none there is larger than GATE.size
    // of its own least distance from the line (a larger one is dealt down to that size).
    // NO PUFF'S SKIN WITHIN 4 M OF THE LINE, anywhere on it (the towers' outer puffs reach as far as the dive): each
    // puff is measured at build against the whole line (its skin: three quarters of its size, with its breathing),
    // and one that would reach nearer is made as much smaller as keeps 4 m of clear air; one that would be left under
    // a third of its size is taken out. A rule of the place: it reads the line as it lies, never the eye.
    // NO CARD ALONE: a puff of the bank that is left with no puff of its own tower within its own size of it (centre
    // to centre) is taken out too, and so on until none stands alone. A rule of the heap, not of any view.
    // THE KIT SORTS ITS PUFFS FOR EVERY FRAME out of a copy it keeps to itself and writes the drawn ones anew, sizes
    // and all: so each cut puff is kept here by its own place with its size by the rule (trims), and the size is
    // written to that puff again after every sort (trimPuffs, in lifeAt).
    await ctx.yield();
    const trims = [], puffAt = clouds.puffs.geometry.attributes.iPos, puffOut = { lane: 0, gate: 0, less: 0, line: 0, lone: 0 };
    const trimPuffs = () => { if (!trims.length) return; for (let i = 0, n = puffAt.count; i < n; i++) { const x = puffAt.getX(i); for (const t of trims) if (t[0] === x && t[1] === puffAt.getY(i) && t[2] === puffAt.getZ(i)) puffAt.setW(i, t[3]); } };
    clouds.object.traverse((o) => { const at = o.geometry && o.geometry.attributes && o.geometry.attributes.iPos; if (!at) return;
      // (the line is read every 4 m first; only a puff that could reach it is measured against every half metre)
      const nearest = (x, y, z, step) => { let best = 1e18; for (let j = 0; j < route.length; j += step) { const dx = route[j] - x, dy = route[j + 1] - y, dz = route[j + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
      // the line in plan, read every metre; and the room a place has to the lane's upright cones (the kit's own measure)
      const plan = (x, z) => { let best = 1e18; for (let j = 0; j < route.length; j += 6) { const dx = route[j] - x, dz = route[j + 2] - z, d = dx * dx + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
      const laneRoom = (x, y, z) => { let room = 1e9;
        for (const [ax, top, az, rTop, bot, rBot] of lane) { const t = clamp((top - y) / Math.max(top - bot, 1e-3), 0, 1), dxz = Math.hypot(x - ax, z - az) - lerp(rTop, rBot, t), dy = Math.max(y - top, bot - y); room = Math.min(room, dy > 0 ? Math.hypot(Math.max(dxz, 0), dy) : dxz); }
        return room; };
      // a puff's tower is known by its flat base's height (the tower's own y); only the bank's towers have a gate and heaps here
      const base = o.geometry.attributes.iData, bank = new Map(towers.slice(0, NT).map((t, k) => [Math.fround(t[1]), k])), heaps = towers.slice(0, NT).map(() => []);
      const fin = new Float32Array(at.count);
      for (let i = 0; i < at.count; i++) { const x = at.getX(i), y = at.getY(i), z = at.getZ(i), size = at.getW(i), skin = 0.78 * 1.045 * size, k = bank.get(base.getW(i));
        if (laneRoom(x, y, z) < skin) { puffOut.lane++; continue; }
        let s = size;
        if (k !== undefined && z - skin <= GATE.z) { if (plan(x, z) - skin < GATE.off) { puffOut.gate++; continue; } s = Math.min(size, GATE.size * nearest(x, y, z, 6)); }
        const reach = 0.75 * 1.045 * s;
        if (nearest(x, y, z, 24) - 6 < reach) { const room = nearest(x, y, z, 3) - 4; if (room < reach) s = room < reach * 0.34 ? 0 : s * room / reach; }
        fin[i] = s; if (s !== size) puffOut[s ? 'less' : 'line']++;
        if (s > 0 && k !== undefined) heaps[k].push(i); }
      for (const heap of heaps) for (let again = true; again;) { again = false;
        for (let a = heap.length - 1; a >= 0; a--) { const i = heap[a], x = at.getX(i), y = at.getY(i), z = at.getZ(i);
          if (!heap.some((j) => j !== i && Math.hypot(at.getX(j) - x, at.getY(j) - y, at.getZ(j) - z) < fin[i])) { fin[i] = 0; heap.splice(a, 1); puffOut.lone++; again = true; } } }
      for (let i = 0; i < at.count; i++) if (fin[i] !== at.getW(i)) { trims.push([at.getX(i), at.getY(i), at.getZ(i), fin[i]]); at.setW(i, fin[i]); }
      if (at.data) at.data.needsUpdate = true; else at.needsUpdate = true; });
    scene.add(clouds.object);
    await ctx.yield();
    // thin wisps in the dive, between the quay and the place the dive levels: we fall past them. A wisp stands where
    // it is dealt (they do not drift), and none stands nearer the route's line than half the widest wisp (11 m): one
    // dealt nearer is stepped straight away from the line to that distance. So none is on the line or opens before us.
    const wispAt = [], WISP = [10, 22];
    for (let m = AT.quay + 14; m < AT.level - 8; m += 9) {
      rp(m, pA); const a = S.wisps() * TAU, r = S.wisps.range(9, 26), w = [pA.x + Math.cos(a) * r, pA.y + S.wisps.range(-6, 6), pA.z + Math.sin(a) * r * 0.6];
      for (let k = 0; k < 4; k++) { rp(mAt(w[0], w[1], w[2]), pB); const dx = w[0] - pB.x, dy = w[1] - pB.y, dz = w[2] - pB.z, d = Math.hypot(dx, dy, dz), need = WISP[1] * 0.5; if (d >= need || d < 1e-3) break; const f = (need + 0.05) / d; w[0] = pB.x + dx * f; w[1] = pB.y + dy * f; w[2] = pB.z + dz * f; }
      wispAt.push(w);
    }
    const wisps = fx.makeMist({ rng: S.wisps, positions: wispAt, count: wispAt.length, size: WISP, color: '#9fb0dc', opacity: 0.07, flatten: 0.75, fog: false, near: mistNear(WISP) });
    scene.add(wisps.object); Object.assign(dealt, { wispAt, WISP, clouds, cloudLane: lane, cloudTrims: trims, cloudOut: puffOut, cloudGate: GATE, cloudTowers: towers });
    await ctx.yield();
    // spindrift: a low white layer torn flat off the crests on the cold water before the cloud; it lies there always
    const spindrift = fx.makeMist({ rng: S.spindrift, count: 90, area: [170, 1.2, 100], center: [0, 1.3, -114], size: [4, 9], color: '#eef2ff', opacity: 0.07, drift: [9, 0, 3], flatten: 0.12, floorFade: 0, near: mistNear([4, 9]) });
    scene.add(spindrift.object);
    await ctx.yield();
    // ---- fins: three to six of them, each cutting a ring of its own beside the place where the dive levels out, the
    // whole ring between 9 and 40 m to one side of the route's line (never under it); each 1.9 m out of the water,
    // with a pale wake behind it, its wet side taking the moon. Rings, sides, starts and speeds are dealt by their stream.
    const finList = [], finMesh = (() => {
      const sh = new THREE.Shape(); sh.moveTo(-0.9, 0); sh.quadraticCurveTo(-0.5, 1.3, 0.55, 1.75); sh.quadraticCurveTo(0.25, 0.8, 0.7, 0); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false }).translate(0, 0, -0.08); g.rotateY(-Math.PI / 2); g.scale(1.4, 1.4, 1.4);
      // NO RING CROSSES ANOTHER (two fins never meet): a ring dealt across an earlier one, or with less than 3 m of
      // water between them, is dealt again (up to 30 times); one that finds no free water is left out
      const n = S.fins.int(3, 6), free = (r, cx, cz) => finList.every((f) => { const d = Math.hypot(f.cx - cx, f.cz - cz); return d >= f.r + r + 3 || d <= Math.abs(f.r - r) - 3; });
      for (let i = 0; i < n; i++) for (let k = 0; k < 30; k++) { const r = S.fins.range(6, 13), side = S.fins.sign(), cx = side * (r + 9 + S.fins.range(0, 5)), cz = J[0] - 14 + S.fins.range(-16, 16);
        if (!free(r, cx, cz)) continue;
        finList.push({ r, cx, cz, ph: S.fins() * TAU, dir: S.fins.sign(), sp: S.fins.range(2.2, 3.4), dip: S.fins() * TAU }); break; }
      const mesh = new THREE.InstancedMesh(g, shade.patch(new THREE.MeshStandardMaterial({ color: '#2a3040', roughness: 0.28, metalness: 0.3 }), false, false), finList.length); mesh.frustumCulled = false; scene.add(mesh); return mesh; })();
    const wakeMesh = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.6, 0.9, 0, 5, 0.25, 0, 4.2, -0.9, 0, 5, -0.25, 0, 4.2], 3)); g.setIndex([0, 2, 1, 0, 3, 4]);
      const mesh = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: '#8fa0d0', transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }), finList.length); mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh); return mesh; })();
    await ctx.yield();
    // ---- white sea birds over the dark water, wheeling on a loop of their own 26 to 42 m to one side of the route
    const seaBirds = (() => { const side = S.seabirds.sign(), z0 = (J[0] - 12.6) / 2;
      const route = [0, 1, 2, 3, 4, 5].map((k) => { const a = k / 6 * TAU; return [side * (34 + Math.cos(a) * 8), 15 + 4 * Math.sin(a * 2), z0 + Math.sin(a) * 28]; });
      dealt.seaBirdLoop = route;
      return F.makeFlock({ rng: S.seabirds, species: 'gulls', count: 7, closed: true, spread: [7, 3, 7], color: '#f2f2f6', route }); })();
    scene.add(seaBirds.object);
    Object.assign(dealt, { fins: finList, finMesh });
    await ctx.yield();
    // ---- fourteen great white birds asleep on spread wings in the cloud's gap, 12 to 20 m from the route, rocking: thick
    // in the body, the wings white above and shaded lilac toward the tips
    const sleepers = [], sleeperMesh = (() => {
      const M = makeMesher();
      M.add(new THREE.SphereGeometry(1, 10, 8), mat(0, -0.05, 0, 0, 0, 0, 0.52, 0.44, 1.1), '#f4f2ee'); M.add(new THREE.SphereGeometry(0.3, 8, 6), mat(0.14, 0.3, 0.42), '#f4f2ee');
      M.add(new THREE.ConeGeometry(0.26, 0.8, 5), mat(0, 0.02, -1.2, 0, -Math.PI / 2, 0, 1, 1, 0.3), '#e4e2de');
      // a wing: a long tapering blade, a little raised toward a dark tip
      const blade = (a, b, c) => { const sh = new THREE.Shape(); sh.moveTo(0, 0.42); sh.lineTo(a, 0.3); sh.quadraticCurveTo(a * 0.9, -0.3 * b, 0, -0.45 * c); sh.closePath(); return new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }).rotateX(Math.PI / 2); };
      for (const sd of [-1, 1]) { M.add(blade(sd * 2.1, 1, 1), mat(sd * 0.2, 0.12, 0.05, 0, 0, sd * 0.14), '#f4f2ee'); M.add(blade(sd * 2.0, 0.7, 0.75), mat(sd * 2.2, 0.42, 0.02, sd * -0.1, 0, sd * 0.04), '#cfc8e4'); M.add(blade(sd * 1.1, 0.4, 0.5), mat(sd * 4.1, 0.5, -0.12, sd * -0.2, 0, sd * -0.06), '#9a94b8'); }
      const from = AT.cloudFoot - 12, to = AT.cloudEdge + 6;
      for (let i = 0; i < 14 * (hourWish === 'day' ? 2 : 1); i++) {
        const m = lerp(from, to, (i + S.birds.range(0.1, 0.9)) / (14 * (hourWish === 'day' ? 2 : 1))); rp(m, pA); rp(m + 3, pB);
        const hx = pB.x - pA.x, hz = pB.z - pA.z, l = Math.hypot(hx, hz) || 1;
        let side = S.birds.sign(), d = S.birds.range(12, 20), y = pA.y + S.birds.range(-4, 5); const yaw = S.birds() * TAU, ph = S.birds() * TAU, sc = S.birds.range(0.9, 1.25);
        // NO SLEEPER LIES IN ANOTHER'S WINGS: two whose spans would meet in plan (half span 5.2 m at size 1) lie 4.5 m
        // and more apart in height (each rocks 0.7 m and rolls its tips 1.3 m); one dealt otherwise is dealt its side,
        // distance and height again (up to 20 times), and one that finds no free air is left out
        const at = () => [pA.x + side * hz / l * d, y, pA.z - side * hx / l * d], free = ([x, yy, z]) => sleepers.every((o) => Math.hypot(o.x - x, o.z - z) >= 5.2 * (o.sc + sc) || Math.abs(o.y - yy) >= 4.5);
        let p = at(); for (let k = 0; k < 20 && !free(p); k++) { side = S.birds.sign(); d = S.birds.range(12, 20); y = pA.y + S.birds.range(-4, 5); p = at(); }
        if (free(p)) sleepers.push({ x: p[0], y: p[1], z: p[2], yaw, ph, sc });
      }
      // white feathers send the bank's light on from every side: a wing in its own shade stands lilac, never dark
      const birdMat = shade.patch(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#5a5274' }), false, false);
      const mesh = new THREE.InstancedMesh(M.build(), birdMat, sleepers.length); mesh.frustumCulled = false; scene.add(mesh); return mesh; })();
    await ctx.yield();
    // ---- flamingoes crossing the lagoon at 12 to 22 m, round and round one long loop: two or three groups, spaced
    // round the loop by their stream (each group's place on the loop at clock 0 is dealt, not typed)
    const flamingos = (() => { const n = S.flock.int(2, 3), first = S.flock(), total = hourWish === 'day' ? 52 : 26, out = [];
      const loop = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = k / 8 * TAU; return [-38 + Math.cos(a) * 78, 17 + 4.5 * Math.sin(a * 2), -506 + Math.sin(a) * 26]; });
      for (let g = 0; g < n; g++) { const f = F.makeFlock({ rng: g ? S.flock : S.flamingos, species: 'flamingos', count: Math.round(total / n), closed: true, route: loop, start: (first + (g + S.flock.range(-0.12, 0.12)) / n) % 1 }); scene.add(f.object); out.push(f); }
      dealt.flamingoLoop = loop; return out; })();
    Object.assign(dealt, { sleepers, sleeperMesh, flamingos, seaBirds });
    await ctx.yield();
    // in a gold haze a low mist lies on the lagoon between the reef and the beach: a sheet on the water whose puffs
    // (14 to 30 m across, a tenth as thick) top out 3.3 m over it, under the route's lane (4 m and more over the lagoon)
    const lagoonMist = mood === 'haze' ? fx.makeMist({ rng: S.mist, count: 70, area: [150, 0.4, 70], center: [PLACES.rock[0] + 20, 0.7, PLACES.rock[1] - 6], size: [14, 30], color: '#ffd9b0', opacity: 0.09, drift: [0.5, 0, 0.2], flatten: 0.1, floorFade: 0, near: mistNear([14, 30]) }) : null;
    if (lagoonMist) scene.add(lagoonMist.object);
    // the portal's own light on the water under it: a pale gold pool 30 m across, drawn out toward the creek; like
    // everything else it is taken by the haze that stands over the water (the scene's own fog law)
    const poolU = { uTime: { value: 0 }, uHaze: { value: 0.001 } };
    const portalPool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: poolU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv * 2. - 1.; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform float uTime, uHaze; varying vec2 vUv; varying vec3 vW;
        void main(){ float r = clamp(length(vUv), 0., 1.), k = (1. - r) * (1. - r);
          float rip = .7 + .3 * sin(vW.x * 1.9 + uTime * 1.7) * sin(vW.z * 2.3 - uTime * 1.3);
          float hz = distance(cameraPosition, vW) * uHaze, air = exp(-hz * hz);
          gl_FragColor = vec4(vec3(1., .9, .66) * k * rip * .5 * air, 1.); }` }));
    { const [px, , pz] = PLACES.portalSeat, [dx, dz] = PLACES.creekDir; portalPool.scale.set(46, 1, 30); portalPool.position.set(px - dx * 6, 0.6, pz - dz * 6); portalPool.rotation.y = Math.atan2(-dz, dx); portalPool.renderOrder = 4; scene.add(portalPool); }
    const lifeAt = (dt, time, camera) => {
      finList.forEach((f, i) => { const a = f.ph + f.dir * time * f.sp / f.r, x = f.cx + Math.cos(a) * f.r, z = f.cz + Math.sin(a) * f.r, y = ocean.heightAt(x, z, time), yaw = -a + (f.dir > 0 ? Math.PI : 0);
        finMesh.setMatrixAt(i, mat(x, y - 0.6 + 0.25 * Math.sin(time * 0.5 + f.dip), z, yaw, 0, 0.12 * Math.sin(time * 1.3 + f.dip))); wakeMesh.setMatrixAt(i, mat(x, y + 0.12, z, yaw)); });
      finMesh.instanceMatrix.needsUpdate = true; wakeMesh.instanceMatrix.needsUpdate = true;
      sleepers.forEach((b, i) => sleeperMesh.setMatrixAt(i, mat(b.x, b.y + 0.7 * Math.sin(time * 0.6 + b.ph), b.z, b.yaw + 0.1 * Math.sin(time * 0.23 + b.ph), 0.07 * Math.sin(time * 0.8 + b.ph * 2), 0.2 * Math.sin(time * 0.7 + b.ph), 0.62 * b.sc)));
      sleeperMesh.instanceMatrix.needsUpdate = true;
      clouds.update(dt, time, camera); trimPuffs(); wisps.update(dt, time, camera); spindrift.update(dt, time, camera); for (const f of flamingos) f.update(dt, time, camera); seaBirds.update(dt, time, camera);
      if (lagoonMist) lagoonMist.update(dt, time, camera); poolU.uTime.value = time; poolU.uHaze.value = scene.fog.density;
    };

    // ---- the gold lights: they live in their haunts on the world clock (the part builds each course from places and
    // tests it whole against the whole route): one about the nursery, three to five among the stacks, seven or eight
    // on the lane over the sea, a dozen or two on the island. None takes the metres flown or the eye; no look is
    // pulled to any of them.
    const haunts = [goldNursery(S.goldroom, hero.lane), goldStacks(S.goldstacks, hero.lane)];
    await ctx.yield();
    haunts.push(goldLane(S.goldlane, hero.lane, hero.land));
    await ctx.yield();
    haunts.push(goldIsle(S.goldisle, hero.lane, hero.laneFrom, hero.crowns, hero.well));
    hero.wellGlow(haunts[3].glow); dealt.wellGlow = haunts[3].glow;
    await ctx.yield();
    const gold = makeGoldLights(haunts.flatMap((h) => h.lights), S.gold);
    // for the count: how many lights each haunt holds and the least room any course leaves (8 is the rule)
    gold.object.userData.gold = { counts: haunts.map((h) => h.lights.length), least: haunts.map((h) => h.least) };
    scene.add(gold.object);
    await ctx.yield();

    path.posAtDist(0, eye); applySky(eye.z, 0); roomAt(0);

    return {
      scene, path, duration: DUR,
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 24, sway: 0.5, bank: 0.3 },
      pois,
      pace,
      portal: { shape: 'circle', radius: 8, color: '#ffe9b0', glow: 1.1, revealDistance: 240 },
      post: { exposure: 1.0, bloom: { strength: 0.5, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.06, contrast: 1.04, vignette: 0.3, grain: 0.02 } },
      ride: 'none', companion: 'none',
      update(dt, time, camera) {
        // everything here goes by the world clock and by where the eye stands; nothing takes the route's parameter
        camera.getWorldPosition(eye);
        applySky(eye.z, time);
        roomAt(time); townU.uTime.value = time; lampGlow.update(dt, time); gold.update(dt, time, camera); lifeAt(dt, time, camera);
        // the cat keeps to the ridge between two stacks, walking to the one and back to the other
        { const p = ((time * 1.2 + catPh) % 26 + 26) % 26, w = p < 13 ? p : 26 - p; cat.position.set(-9.5 - w, 44.1 + 0.06 * Math.abs(Math.sin(time * 6)), -98); cat.rotation.y = p < 13 ? Math.PI : 0; }
        ocean.update(dt, time, camera);
        hero.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
