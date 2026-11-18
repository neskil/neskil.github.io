// WHAT THE OCEAN BUILDS, the hero: a mirror-symmetric hall of calcified froth that the living ocean throws up, 610 m long,
// born as a tower of froth, grown bay by bay ahead of the lens, and lost again. Everything here is a function of one
// progress value, the lens's way along the hall's axis: setProgress(v). Viewed alone it loops birth to fall in 20 s.
//
// MAP OF THIS FILE
//   0. the deal      FORKS, takeForks, dealWorld: every generator and every seeded variation, by shares
//   1. timeline      vAt, camZ, TL, frontZ, birthAtZ: the windows of the story, each a place of the lens in metres
//   2. makeShared    the one set of light / fog / progress uniforms every shader of this world reads (two analytic suns)
//   3. GLSL          W_COMMON (noise, the direction-tinted fog, froth lighting), W_SKY, W_RIB (the rib curve: one formula
//                    for ribs, films and tip puffs)
//   4. layout        every rib of the hall as plain records (main arches, gallery chains, legs), wall films, webs;
//                    planSeat; 4b. the route through it and its clearance test (routePoints, obstacles, chooseRoute)
//   5. meshes        ribs (3 instanced meshes, one material), films, tip puffs, the froth masses (tower, front, rain,
//                    falling pieces, the collar round the portal), the dome
//   6. buildHero     puts them together; anchors: portalSeat, axis
// Space: the hall's gate is at the origin, its axis runs down -Z, x = 0 is the mirror plane, y = 0 the sea.
import * as THREE from 'three';

export const DOME = { r: 66, w: 132, h: 62 };      // the dome at its full swell: radius, width and height, m
export const TOWER = { H: 330, r: 46 };            // the tower of froth: its full height and the radius of its column, m
// THE STAND-OFF, a rule of the place: until the tower has reached its full height the route keeps two thirds of that
// height between the lens and the tower's axis (220 m for a tower of 330 m), so that the thing is met from far enough
// off to be taken in from foot to head. The route's entry lies one dome-width before that place: half of that stretch
// for the dome's swelling and splitting, half for the tower's climb. Nothing of the froth is sized by this; the ROUTE
// stands off
export const STANDOFF = TOWER.H * 2 / 3;
const Z0 = STANDOFF + DOME.w;
// z0: where the route enters (m before the gate); flight: the measure v is counted in (the entry to 8 m past the hall's end)
export const HALL = { length: 610, bays: 12, crown: 150, half: 30, z0: Z0, flight: Z0 + 610 + 8 };
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- 0. the deal
// EVERY generator of this world is a fork of ctx.rng, taken here in ONE fixed list before anything is drawn, one per
// kind of thing: deal (the variations below), hall (the skins of main ribs and gallery arches), legs, films (wall
// films), webs, tips (the froth on growing and dying ends), lumps (tower and front), rain (froth thrown off the
// tower), pieces (of the fall), collar (the froth round the portal: a rejection loop over the last arch's opening),
// older (further far structures: a loop whose count is dealt), far (the Station's and the swelling's phases), banks,
// wisps, flakes (the kit's mist and particles), wind (its heading), clock (where the world's clock starts).
export const FORKS = ['deal', 'hall', 'legs', 'films', 'webs', 'tips', 'lumps', 'rain', 'pieces', 'collar', 'older', 'far', 'banks', 'wisps', 'flakes', 'wind', 'clock'];
export function takeForks(rng) { const F = {}; for (const k of FORKS) F[k] = rng.fork(k); return F; }
// one of several, by shares that add up to 1: x is one draw, shares is [[share, what], ...]
export function byShare(x, shares) { let acc = 0; for (const [share, what] of shares) { acc += share; if (x < acc) return what; } return shares[shares.length - 1][1]; }
// THE VARIATIONS, each one draw of the 'deal' fork, in this order, by these shares
export function dealWorld(r) {
  const hourKey = byShare(r(), [[1 / 2, 'dusk'], [1 / 4, 'dawn'], [1 / 4, 'both']]);      // which sun sets and which rises, or both up
  const sideA = byShare(r(), [[3 / 4, -1], [1 / 4, 1]]);                                  // sun A stands on this side of the heading (x sign)
  const heavy = byShare(r(), [[1 / 4, true], [3 / 4, false]]) && hourKey !== 'both';      // heavy air (never with both suns up)
  const ratio = byShare(r(), [[2 / 3, 0.95], [1 / 3, 0.93]]);                             // each bay is this much of the one before
  const tiers = byShare(r(), [[2 / 3, [0.25, 0.5, 0.75]], [1 / 3, [0.3, 0.62]]]);          // three galleries or two
  const frothKey = byShare(r(), [[1 / 2, 'rose'], [1 / 4, 'ivory'], [1 / 4, 'pearl']]);
  const structures = byShare(r(), [[1 / 3, 1], [1 / 3, 2], [1 / 3, 3]]);                  // older structures far off
  const swellSide = byShare(r(), [[1 / 2, -1], [1 / 2, 1]]);                              // the long swelling lies on this side
  return { hourKey, sideA, heavy, ratio, tiers, frothKey, structures, swellSide };
}

// ---------------------------------------------------------------- 1. timeline
// THE ONE PACING OF THE OCEAN'S WORK: it is paced to the flight. Everything the ocean does here is a pure function of
// v, the lens's way along the axis: v = (z0 - z of the lens) / flight (0 at the entry, about 0.99 at the portal). The
// world works v out from its route, so the tower, the front and the galleries keep their place relative to the lens
// whatever the route does above the axis.
export const vAt = (z) => (HALL.z0 - z) / HALL.flight;                      // the progress at which the lens is level with z
export const camZ = (v) => HALL.z0 - HALL.flight * v;
const BAY = HALL.length / HALL.bays;                                        // a mean bay, 50.8 m
export const axisM = (m) => m / HALL.flight;                                // so many metres of the lens's way along the axis, as progress
// the froth front runs down the axis ahead of the lens and outruns it: three bays ahead at the gate, seven at the far
// end (it gains four bays over the hall's twelve: 4/3 m for every metre of the lens), so every arch is whole long before
// the lens is under it and the last ones close while the lens is still over the middle of the hall. Until the lens is
// three bays from the gate the front waits there, inside the tower
const FRONT_GAIN = 1 + 4 / HALL.bays;
const lead = (z) => BAY * (3 + 4 * sat(-z / HALL.length));
export const frontZ = (v) => { const z = camZ(v); return Math.max(-HALL.length - 20, Math.min(0, z - lead(z))); };
export function birthAtZ(z) {                                               // the progress at which the front passes z (for the gate: at which it leaves it)
  let a = 0, b = 1; for (let i = 0; i < 30; i++) { const m = 0.5 * (a + b); if (frontZ(m) >= z) a = m; else b = m; } return 0.5 * (a + b);
}
// THE WINDOWS. Every one is a place of the lens on the axis in metres from the gate (z 0; the entry is at z 250), or a
// distance between the front and an arch, with its reason; none is typed as a fraction of the flight
export const TL = {
  gone: vAt(1.5 * BAY),   // the tower has fallen away when the gate arch has closed: the front leaves the gate with the lens three bays short, and an arch closes in a bay and a half of the lens's way (below), so the lens is a bay and a half short of the gate; we never enter the tower
  up: vAt(STANDOFF),      // it stands at its full height when the lens is at the stand-off place
  burst: vAt(STANDOFF + DOME.r),      // the dome bursts a dome's radius of the lens's way before that: the froth climbs five metres for each metre the lens flies
  arch: axisM(2 * BAY / FRONT_GAIN),      // an arch closes, horn to horn, while the front runs two bays past its plane (two arches are always growing behind the front): 76 m of the lens's way
  end: vAt(-HALL.length), // the lens is at the portal
  last: 0,                // the last arch is born when the front reaches the far end (worked out below from the front's run)
  fall: 0,                // the fall begins when the front has run two thirds of the hall's length (407 m from the gate): from there on the ocean builds at the far end and lets go at once, so the making and the unmaking are seen together; it has begun to build elsewhere (the new swellings rise from this moment)
};
TL.last = birthAtZ(-HALL.length); TL.fall = birthAtZ(-HALL.length * 2 / 3);
// THE FALL is the ocean's work too and is paced to the flight like the growth: its progress follows the lens's way along
// the axis from the place where the front has run two thirds of the hall (the lens is then 191 m past the gate, still
// climbing inside the hall, a bay or so short of the open vault it leaves by) to the portal, fastest at first (the
// froth that set last is the softest), with
// no hold in it. Bay by bay it runs back from the far end, which is furthest from where the froth comes from: the
// share of the fall a bay has had is sagOfBay (the same formula is written in the rib, film and tip shaders). The last
// bays are laid while they already fail: they come up thin, without their outer arcs, and their horns never meet
// the tower at v: [how far it has climbed 0..1, how far it has sloughed off 0..1]. It climbs between the burst and the
// stand-off place and sloughs off from there until just before the place where it is gone (a tenth of a bay short)
export const towerAt = (v) => [sstep(TL.burst, TL.up, v), sstep(TL.up, TL.gone - axisM(0.1 * BAY), v)];
export const sagAt = (v) => { const x = sat((v - TL.fall) / (TL.end - TL.fall)); return x * (1.6 - 0.6 * x); };
export const SAG_RUN = 1.3, SAG_LAG = 0.6;      // a bay's fall = the fall x 1.3 - 0.6 x (its place from the far end, 0..1): the bays we dive through are already failing, the far ones are stumps when we level out

// ---------------------------------------------------------------- 2. shared uniforms
export function makeShared() {
  const v3 = (x, y, z) => ({ value: new THREE.Vector3(x, y, z) }), c3 = (h) => ({ value: new THREE.Color(h) });
  return {
    uU: { value: 0 }, uTime: { value: 0 }, uSag: { value: 0 }, uFogDen: { value: 0.00055 }, uBank: { value: 1 },
    uSunA: v3(-0.61, 0.1, -0.79), uSunB: v3(0.61, -0.07, -0.79), uAzA: { value: new THREE.Vector2(-0.61, -0.79) }, uAzB: { value: new THREE.Vector2(0.61, -0.79) },
    uSunACol: c3('#FF4A38'), uSunBCol: c3('#BCD4FF'), uAmbLo: c3('#1C1216'), uAmbHi: c3('#262A36'),
    uFogA: c3('#5A1E2C'), uFogB: c3('#3A4C86'), uFogMid: c3('#2A1838'),
    uFroth: c3('#F4E6E2'), uRose: c3('#E8A0A8'), uPulseCol: c3('#FFE3E6'), uFill: v3(0.085, 0.09, 0.115),      // uFill: cool sky light in the shadows
    // the sky (dome of the world, mirrored by the sea and by the glass bubble): zenith, the horizon toward each sun and between
    uZen: c3('#0A0A18'), uHorA: c3('#A8242E'), uHorB: c3('#121A3E'), uHorMid: c3('#1C0C1E'),
    uRadA: { value: new THREE.Vector4(0.91, 0.2, 0.165, 6) }, uRadB: { value: new THREE.Vector4(0.81, 0.88, 1.0, 12) },      // disc colour, radiance
    uDisc: { value: new THREE.Vector4(2.2, 0.5, 1, 1) },                                                                      // radius of A, of B (degrees), how much of A, of B is up
  };
}

// ---------------------------------------------------------------- 3. GLSL
export const W_COMMON = /* glsl */`
uniform float uU, uTime, uSag, uFogDen, uBank;
uniform vec3 uSunA, uSunB, uSunACol, uSunBCol, uAmbLo, uAmbHi, uFogA, uFogB, uFogMid, uFroth, uRose, uPulseCol, uFill;
uniform vec2 uAzA, uAzB;
float wH(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y)*p.z); }
float wH2(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float wN(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(wH(i), wH(i + vec3(1,0,0)), f.x), mix(wH(i + vec3(0,1,0)), wH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wH(i + vec3(0,0,1)), wH(i + vec3(1,0,1)), f.x), mix(wH(i + vec3(0,1,1)), wH(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float wN2(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(wH2(i), wH2(i + vec2(1.,0.)), f.x), mix(wH2(i + vec2(0.,1.)), wH2(i + vec2(1.,1.)), f.x), f.y);
}
// the air: exponential haze whose colour depends on where one looks (toward sun A, toward sun B, violet between),
// thicker in the low banks that lie on the sea
vec3 wFogCol(vec3 vd){
  vec2 h = vd.xz/max(length(vd.xz), 1e-3);
  float a = clamp(dot(h, uAzA)*0.5 + 0.5, 0.0, 1.0), b = clamp(dot(h, uAzB)*0.5 + 0.5, 0.0, 1.0);
  a *= a; b *= b;
  vec3 c = mix(uFogMid, uFogA, a*a); c = mix(c, uFogB, b*b);
  return c*(1.0 - 0.35*clamp(vd.y*3.0, 0.0, 1.0));
}
float wFogAmt(vec3 wp){
  vec3 v = wp - cameraPosition; float d = length(v);
  float low = exp(-max(0.5*(wp.y + cameraPosition.y), 0.0)/12.0);
  return 1.0 - exp(-d*uFogDen*(0.25 + 4.5*uBank*low));      // clear air aloft; the haze lies low on the sea
}
vec3 wFog(vec3 col, vec3 wp){ vec3 v = wp - cameraPosition; return mix(col, wFogCol(v/max(length(v), 1e-3)), wFogAmt(wp)); }
// calcified froth: matte, pale, wrapped light from both suns, wine from below and violet from above, and a soft
// back-glow through thin edges in the colour of the sun behind them. V points from the eye to the surface
// what a sun's light does on set froth: the matter is near white under either sun, so the light's colour is taken half
// way to its own grey before it falls on it (rose only where the red sun strikes; the shade is the sky's cool violet)
vec3 wPale(vec3 c){ float l = dot(c, vec3(0.3, 0.5, 0.2)); return mix(vec3(l), c, 0.34); }
// lit matter, never matter that shines: above 0.7 the light on froth rises only a fifth as fast (nothing reaches the bloom)
vec3 wKnee(vec3 c){ return min(c, 0.7 + 0.2*(c - 0.7)); }
vec3 wFrothLight(vec3 alb, vec3 N, vec3 V, float thin){
  float da = clamp(dot(N, uSunA)*0.85 + 0.15, 0.0, 1.0), db = clamp(dot(N, uSunB)*0.85 + 0.15, 0.0, 1.0);
  da *= 0.4 + 0.6*da; db *= 0.4 + 0.6*db;                                                             // hard light, a short soft edge
  vec3 amb = mix(uAmbLo*0.7, uAmbHi, clamp(N.y*0.5 + 0.5, 0.0, 1.0)) + uFill*(1.05 + 0.4*N.y);       // the shade is the sky's cool grey-violet
  vec3 la = wPale(uSunACol), lb = wPale(uSunBCol);
  vec3 c = alb*(amb + 0.56*(la*da + lb*db));                                                         // each sun lights its own side; the shade between is plainly darker
  float rim = 1.0 - clamp(dot(N, -V), 0.0, 1.0); rim *= rim;
  float ta = clamp(dot(V, uSunA), 0.0, 1.0), tb = clamp(dot(V, uSunB), 0.0, 1.0);
  return c + alb*thin*(0.06 + 0.94*rim)*(la*ta*ta + lb*tb*tb)*0.4;
}
// the crust of bubbles: x = how deep in a hollow (0 on a bubble's top .. 1 between bubbles), yzw = offset for the normal
vec4 wBubbles(vec3 p){
  vec3 b = floor(p - 0.5), f = p - b; float d1 = 9.0; vec3 dv = vec3(0.0);
  for (int k = 0; k < 8; k++) {
    vec3 o = vec3(float(k & 1), float((k >> 1) & 1), float((k >> 2) & 1));
    vec3 c = b + o; vec3 r = o + vec3(wH(c), wH(c + 7.3), wH(c + 13.7))*0.8 + 0.1 - f;
    float d = dot(r, r); if (d < d1) { d1 = d; dv = r; }
  }
  d1 = sqrt(max(d1, 0.0));
  return vec4(smoothstep(0.25, 0.7, d1), -dv*smoothstep(0.0, 0.5, d1));
}
`;

// the sky as a function of direction: the horizon takes each sun's colour on its side, a dark clear zenith, a thin haze line
export const W_SKY = /* glsl */`
uniform vec3 uZen, uHorA, uHorB, uHorMid; uniform vec4 uRadA, uRadB, uDisc;
vec3 wSky(vec3 d){
  vec2 h = d.xz/max(length(d.xz), 1e-3);
  float a = clamp(dot(h, uAzA)*0.5 + 0.5, 0.0, 1.0), b = clamp(dot(h, uAzB)*0.5 + 0.5, 0.0, 1.0);
  vec3 hor = mix(uHorMid, uHorA, a*a*a); hor = mix(hor, uHorB, b*b*b);
  float e = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(hor, uZen, 1.0 - exp(-e*4.2));
  return mix(c, wFogCol(d), exp(-e*30.0)*0.8);                 // the haze line the far sea fades into
}`;

// One formula for every rib: part of an arch that springs from A, lands on B and rises R above the chord. sh = (R, t0,
// t1, ease), k = how steep the legs are (a catenary's parameter). tn 0..1 runs along this rib. sag lowers and droops it.
export const W_RIB = /* glsl */`
#define W_SAG_RUN ${SAG_RUN.toFixed(2)}
#define W_SAG_LAG ${SAG_LAG.toFixed(2)}
vec3 wRib(vec3 A, vec3 B, vec4 sh, float k, float tn, float sag){
  float q = clamp(2.0*mix(sh.y, sh.z, tn) - 1.0, -1.0, 1.0);
  float qq = sign(q)*(1.0 - pow(max(1.0 - abs(q), 0.0), sh.w));
  float c = 1.0 - (cosh(k*qq) - 1.0)/(cosh(k) - 1.0);
  vec3 p = mix(A, B, 0.5 + 0.5*qq);
  p.y += sh.x*c*(1.0 - 0.08*sag - 0.18*sag*c*c);
  return p;
}
float wGrown(float birth, float dur){ float g = clamp((uU - birth)/max(dur, 1e-3), 0.0, 1.0); return g*g*(3.0 - 2.0*g); }
`;
// the same curve in JS (layout, clearance, anchors)
export function ribPoint(r, tn, sag = 0, out = [0, 0, 0]) {
  const q = Math.min(1, Math.max(-1, 2 * mix(r.t0, r.t1, tn) - 1));
  const qq = Math.sign(q) * (1 - Math.pow(Math.max(1 - Math.abs(q), 0), r.p));
  const c = 1 - (Math.cosh(r.k * qq) - 1) / (Math.cosh(r.k) - 1), m = 0.5 + 0.5 * qq;
  out[0] = mix(r.A[0], r.B[0], m); out[1] = mix(r.A[1], r.B[1], m) + r.R * c * (1 - 0.08 * sag - 0.18 * sag * c * c); out[2] = mix(r.A[2], r.B[2], m);
  return out;
}
const tnAtHeight = (r, y) => { let a = 0, b = 1; for (let i = 0; i < 26; i++) { const m = 0.5 * (a + b); if (ribPoint(r, m)[1] < y) a = m; else b = m; } return 0.5 * (a + b); };

// ---------------------------------------------------------------- 4. layout
// opts: ratio (each bay is this much of the last), tiers (heights of the galleries as fractions of a pier's height)
export function layout(opts = {}) {
  const ratio = opts.ratio ?? 0.95, tiers = opts.tiers ?? [0.25, 0.5, 0.75], N = HALL.bays;
  const L0 = HALL.length * (1 - ratio) / (1 - Math.pow(ratio, N));
  const arches = [], main = [], gal = [], leg = [], bigFilms = [], webs = [];
  for (let i = 0; i <= N; i++) {
    const s = Math.pow(ratio, i), z = -L0 * (1 - s) / (1 - ratio);
    arches.push({ i, z, H: HALL.crown * s, w: HALL.half * s, s, birth: birthAtZ(z), dur: TL.arch, last: i === N });
  }
  const bands = [...tiers, tiers.length < 3 ? 0.84 : 0.9];
  for (const a of arches) for (const side of [-1, 1]) {
    const m = { A: [side * a.w, -3, a.z], B: [-side * a.w, -3, a.z], R: a.H + 3, t0: 0, t1: 0.5, p: 2, k: 2.5, r0: 4 * a.s, r1: 1.25 * a.s,
      birth: a.birth, dur: a.dur, bay: a.i, sagW: a.last ? 0 : 1, side, kind: 0 };      // the last arch holds, with the collar round the portal
    m.index = main.length; main.push(m);
    m.tierTn = bands.map((f) => tnAtHeight(m, f * a.H));
    // galleries: from this pier, at each tier, a chain of four arches straight out sideways, each half the span of the
    // one before and landing half as high; one leg goes down from every landing, three from the outermost (the buttresses)
    const reach = 260 * a.s; m.gal = [];
    tiers.forEach((f, ti) => {
      let P = ribPoint(m, m.tierTn[ti]).slice(); const D1 = (reach - Math.abs(P[0])) / 1.875; const chain = [];
      for (let j = 0; j < 4; j++) {
        const D = D1 * Math.pow(0.5, j), Q = [P[0] + side * D, P[1] * 0.5, a.z], rg = 2.3 * a.s * Math.pow(0.66, j);
        // a chain starts when its pier has grown past its tier; each further link when the link before it is seven tenths
        // grown; a link (a far smaller arch) closes in 0.58 of the time its pier's arch takes; its web starts when it is four
        // tenths grown, its leg when it is nine tenths grown
        const linkDur = 0.58 * a.dur, birth = a.birth + a.dur * (0.35 + 0.6 * f) + j * 0.7 * linkDur;
        const g = { A: P, B: Q, R: 0.3 * D, t0: 0, t1: 1, p: 1.4, k: 1.8, r0: rg, r1: rg * 0.8, birth, dur: linkDur, bay: a.i, sagW: a.last ? 0.25 : 1, side, kind: 1, tier: ti, j };
        g.index = gal.length; gal.push(g); chain.push(g);
        if (j < 2) webs.push({ a: g, b: { ...g, R: 0.3 * g.R }, tn0: 0, tn1: 1, birth: birth + 0.4 * linkDur, dur: 1.2 * linkDur, bay: a.i, band: ti, web: 1, j });
        const feet = [[Q[0] + side * 0.25 * D, -2, a.z + 0.3 * D], [Q[0] + side * 0.25 * D, -2, a.z - 0.3 * D], [Q[0] + side * 0.45 * D, -2, a.z]];
        // one leg under each landing, three (the buttress) under the outermost
        (j < 3 ? feet.slice(2) : feet).forEach((F, fi) => leg.push({ outer: j === 3 && fi < 2, A: Q, B: F, R: 0.12 * (Q[1] + 2), t0: 0, t1: 1, p: 1.2, k: 1.5, r0: rg * 0.55, r1: rg * 0.75, birth: birth + 0.9 * linkDur, dur: 0.7 * linkDur,
          bay: a.i, sagW: a.last ? 0.25 : 1, side, kind: 2, j }));
        P = Q;
      }
      m.gal.push(chain);
    });
  }
  // wall films: between neighbouring piers of one side, one per band; a film starts when the nearer arch has closed and
  // the further one has grown past the band's top, and spreads in about half the time an arch takes to close
  for (let i = 0; i < N; i++) for (const sd of [0, 1]) {
    const a = main[i * 2 + sd], b = main[(i + 1) * 2 + sd];
    for (let bi = 0; bi < bands.length - 1; bi++) if (bi < 2 || tiers.length < 3) bigFilms.push({ a, b, tn0: a.tierTn[bi], tn1: a.tierTn[bi + 1], birth: Math.max(a.birth + a.dur, b.birth + b.dur * (0.3 + 0.6 * bands[bi + 1])), dur: 0.52 * b.dur, bay: i, band: bi });
  }
  return { ratio, tiers, arches, main, gal, leg, bigFilms, webs, L0 };
}

// The portal's seat and the collar round it are sized from the LAST ARCH OF THIS LAYOUT: the seat at 0.45 of its height,
// where it is wide; the collar from the portal's rim (radius 7 + 1.3) out to that arch's ribs
export function planSeat(plan) {
  const last = plan.arches[plan.arches.length - 1], endRib = plan.main[plan.main.length - 1];
  plan.seat = new THREE.Vector3(0, 0.45 * last.H, last.z);
  plan.collar = { rIn: 8.3, xRib: Math.abs(ribPoint(endRib, tnAtHeight(endRib, plan.seat.y))[0]) - endRib.r0 };
  return plan.seat;
}

// ---------------------------------------------------------------- 4b. the route through it
// THE ROUTE is worked out from the hall's own arches (plan.arches: z, crown height H, half width w), never typed:
// level at 7 m from the entry (the stand-off place plus one dome-width) past the place where the dome bursts and the
// stand-off place itself, down to one dome-width before the gate -> LOW into the hall: through the gate and under the
// first arches at yLow, well under the lower edge of the wall films (0.6 of that edge's height at arch 2), o metres off
// the mirror plane, as far as arch j -> ONE climb from there, back onto the mirror plane, under arch 3 and out
// through the open vault, CROWN_CLEAR over the crown of arch 4 -> the top of the flight over arch 5, TOP_CLEAR over its
// crown and ARC metres to one side of the spine, the whole mirrored thing below and ahead between the two suns, its
// front still running -> on over the crowns at CROWN_CLEAR over each, curving back onto the mirror plane -> THE DIVE,
// one straight line on the mirror plane: c metres over the crown of arch k - 1 and under arch k at f of its height,
// begun a little before that crown and held a third of the way on toward the seat's level, then run out level at the
// height of the portal's seat -> the last 60 m straight and level. j and o (the climb) and k, c and f (the dive) are
// CHOSEN by the clearance tests below, on this layout. side: which way the arc goes.
// CROWN_CLEAR, a rule of the place: the route passes over a crown at ten times the crown's own thickness (2.5 m with
// its crust): 25 m. From there a crown is a small whole arc far below, never a hump under the lens. TOP_CLEAR: 30 m, at
// the one place where the route is furthest from the spine and the nearest crown is no longer straight under it
export const CROWN_CLEAR = 25, TOP_CLEAR = 30;
// LAST_CLEAR, 12 m (about five crown thicknesses), was round 3's height over the crown before the dive. Since fix 4 the
// fall has parted that crown before the lens is there: the dive's line passes c metres over the place where it stood
// (c is chosen by the search between 18 and -12) and the rule that holds is DIVE_CLEAR from what is really there.
// LAST_CLEAR is only the c the climb's candidates are drawn with (they are measured no further than arch 5)
export const LAST_CLEAR = 12;
// ARC: over arch 5 the route is 24 m from the spine, over the edge of the open nave (NAVE_OPEN, the same 24 m)
export const ARC = 24;
// THE DIVE'S RULES: no rib, film, fringe or web nearer than DIVE_CLEAR (10 m to its surface) from the top of the flight
// to the seat; nowhere steeper than DIVE_STEEP (45 degrees)
export const DIVE_CLEAR = 10, DIVE_STEEP = 45;
export function routePoints(plan, side, k, f, j = 1, o = 0, c = LAST_CLEAR) {
  const A = plan.arches, seat = plan.seat, yLow = 0.6 * plan.tiers[0] * A[2].H, yTop = A[4].H + CROWN_CLEAR;
  const line = (z) => yLow + (yTop - yLow) * (A[j].z - z) / (A[j].z - A[4].z);
  const pts = [[0, 7, HALL.z0], [0, 7, STANDOFF + DOME.r], [-3 * side, 7.5, STANDOFF], [0, 8, DOME.w], [0.5 * o * side, 0.5 * (8 + yLow), DOME.r], [o * side, yLow, 0]];
  for (let i = 1; i <= j; i++) pts.push([o * side, yLow, A[i].z]);
  for (let i = j + 1; i < 4; i++) pts.push([o * side * (3 - i) / (3 - j), line(A[i].z), A[i].z]);
  // above the crowns the route is an arc: out through the vault on the mirror plane, the top of the flight ARC metres
  // to one side of the spine, and back onto the plane over the arch before the dive
  pts.push([0, yTop, A[4].z], [ARC * side, A[5].H + TOP_CLEAR, A[5].z]);
  for (let i = 6; i < k - 1; i++) pts.push([ARC * side * (A[i].z - A[k - 1].z) / (A[5].z - A[k - 1].z), A[i].H + CROWN_CLEAR, A[i].z]);
  // the dive: the line through (crown of arch k - 1, c over it) and (arch k, f of its height). It is taken up before
  // the crown as far back as the route is still above it (at most half a bay), so the lens is already on the line when
  // it passes the crown, and is held past arch k for three tenths of the way down to the seat's level
  const prev = pts[pts.length - 1], yC = A[k - 1].H + c, yK = Math.max(seat.y, f * A[k].H), run = A[k - 1].z - A[k].z, m = Math.max((yC - yK) / run, 0.05);
  const lead = Math.min(0.5 * run, 0.9 * (prev[1] - yC) / m, 0.5 * (prev[2] - A[k - 1].z));
  if (lead > 3) pts.push([prev[0] * lead / (prev[2] - A[k - 1].z), yC + m * lead, A[k - 1].z + lead]);
  pts.push([0, yC, A[k - 1].z], [0, yK, A[k].z]);
  const D = (yK - seat.y) / m;      // the metres in which the line would come to the seat's level
  if (D > 12) pts.push([0, yK - 0.3 * D * m, A[k].z - 0.3 * D], [0, seat.y + 0.1 * (yK - seat.y), A[k].z - D]);
  if (A[k].z - 1.7 * D > seat.z + 75) pts.push([0, seat.y, A[k].z - 1.7 * D]);
  pts.push([0, seat.y, seat.z + 60], [0, seat.y, seat.z]);
  return pts;
}
// Everything solid near the axis, for the clearance test, in bins of 8 m along z (each record in every bin within
// RIB_REACH, 12 m, of it: the dive's test measures up to 12 m). Ribs, gallery arches and built legs
// as chains of straight pieces (capsules) at five stages of their sag; wall films and webs as balls on a grid over the
// whole sheet (belly out, half a grid cell added) at three stages of their droop. Each record: kind (0 capsule, 1 ball),
// a.xyz, b.xyz, r, lo, hi; lo..hi is the span of the fall (uSag) in which the thing can be at that stage: the test takes
// it only while the lens is there in that span ("for the u at which the camera is there", as the brief asks). A record
// lies in every bin its z-extent plus 8 m touches, so whatever is within 8 m of a point is in that point's bin.
const BIN = 8, BIN_Z0 = 24, BIN_N = Math.ceil((HALL.length + 2 * BIN_Z0) / BIN), NEAR = 30, RIB_REACH = 12;
function binPut(bins, zlo, zhi, rec, reach = RIB_REACH) {
  for (let i = Math.max(0, Math.floor((BIN_Z0 - zhi - reach) / BIN)); i <= Math.min(BIN_N - 1, Math.floor((BIN_Z0 - zlo + reach) / BIN)); i++) bins[i].push(...rec);
}
function filmsInto(bins, films, n, reach = RIB_REACH) {
  for (const t of [0, 0.5, 1]) for (const p of filmSamples(films, n, t, true)) if (Math.abs(p[0]) < NEAR) binPut(bins, p[2] - p[3], p[2] + p[3], [1, p[0], p[1], p[2], p[0], p[1], p[2], p[3], t === 0 ? -1 : (t - 0.25) / FILM_TEAR, t === 1 ? 2 : (t + 0.75) / FILM_TEAR, 1], reach);
}
export async function obstacles(plan, tick = async () => {}) {
  const bins = Array.from({ length: BIN_N }, () => []), a = [0, 0, 0], b = [0, 0, 0];
  for (const sg of [0, 0.25, 0.5, 0.75, 1]) {
    for (const set of [plan.main, plan.gal, plan.legs]) for (const r of set) {
      const n = r.kind === 0 ? 28 : 8;
      for (let j = 0; j < n; j++) {
        ribPoint(r, j / n, sg * r.sagW, a); ribPoint(r, (j + 1) / n, sg * r.sagW, b);
        if (Math.min(Math.abs(a[0]), Math.abs(b[0])) > NEAR) continue;
        // a main rib loses its upper end in the fall (0.36 of its length when its bay has fallen, as in the shader): at
        // this stage what can still be there is what stands at the least sag of the stage's span
        if (r.kind === 0 && j / n >= 1 - 0.36 * Math.max(sg - 0.25, 0) * r.sagW) continue;
        const rad = mix(r.r0, r.r1, j / n) * 1.2 + 0.2;
        // the span of the fall in which this bay's own share of it (fall x SAG_RUN - lag, as in the shaders) is within a
        // quarter of this stage: the stages are a quarter apart, so the spans OVERLAP and a rib is always tested at the
        // two stages its sag lies between; the standing stage is seen from the first metre and the fallen one to the last
        const lag = SAG_LAG * (1 - r.bay / HALL.bays), lo = sg === 0 ? -1 : (sg - 0.25 + lag) / SAG_RUN, hi = sg === 1 ? 2 : (sg + 0.25 + lag) / SAG_RUN;
        binPut(bins, Math.min(a[2], b[2]) - rad, Math.max(a[2], b[2]) + rad, [0, a[0], a[1], a[2], b[0], b[1], b[2], rad, lo, hi, 0]);
      }
      await tick();
    }
  }
  for (let i = 0; i < plan.bigFilms.length; i += 2) { filmsInto(bins, plan.bigFilms.slice(i, i + 2), 10); await tick(); }
  for (let i = 0; i < plan.webs.length; i += 6) { filmsInto(bins, plan.webs.slice(i, i + 6), 8); await tick(); }
  return bins.map((v) => new Float32Array(v));
}
// the skins alone (wall films and webs, standing), in bins that reach SKIN_REACH, for the climb's test
const SKIN_REACH = 24;
export async function skins(plan, tick = async () => {}) {
  const bins = Array.from({ length: BIN_N }, () => []);
  for (let i = 0; i < plan.bigFilms.length; i += 2) { for (const p of filmSamples(plan.bigFilms.slice(i, i + 2), 10, 0)) if (Math.abs(p[0]) < NEAR + SKIN_REACH) binPut(bins, p[2] - p[3], p[2] + p[3], [1, p[0], p[1], p[2], p[0], p[1], p[2], p[3], -1, 2, 1], SKIN_REACH); await tick(); }
  for (let i = 0; i < plan.webs.length; i += 6) { for (const p of filmSamples(plan.webs.slice(i, i + 6), 8, 0)) if (Math.abs(p[0]) < NEAR + SKIN_REACH) binPut(bins, p[2] - p[3], p[2] + p[3], [1, p[0], p[1], p[2], p[0], p[1], p[2], p[3], -1, 2, 1], SKIN_REACH); await tick(); }
  return bins.map((v) => new Float32Array(v));
}
// the least distance from a path to those, walked in even steps of 2 m of route, and the steepest pitch on the way
// (degrees). Distances over reach (8 m) are not measured (the result is then reach). where, if given, is filled with the place on
// the route and the thing: x, y, z, x, y, z, r; zFrom: measure only where the route is beyond this z (the pitch is
// taken over all of it); tick, if given, is called every 16 steps (the world yields there)
export async function clearance(path, bins, where, zFrom = 1e9, reach = 8, tick = null, zTo = -1e9, nearAt = 0) {
  const P = new THREE.Vector3(), steps = Math.ceil(path.length / 2); let least = reach, steep = 0, steepIn = 0, py = 0, pz = 0, px = 0, near = 0;
  for (let i = 0; i <= steps; i++) {
    if (tick && i % 16 === 15) await tick();
    path.pointAt(i / steps, P);
    const pitch = i ? Math.abs(Math.atan2(P.y - py, Math.hypot(P.x - px, P.z - pz))) * 57.2958 : 0;
    px = P.x; py = P.y; pz = P.z;
    if (P.z < zTo) continue;
    steep = Math.max(steep, pitch);
    if (P.z > zFrom) continue;
    steepIn = Math.max(steepIn, pitch);
    const fall = sagAt(vAt(P.z)), v = bins[Math.min(BIN_N - 1, Math.max(0, Math.floor((BIN_Z0 - P.z) / BIN)))]; let here = reach;
    for (let j = 0; j < v.length; j += 11) {
      if (fall < v[j + 8] || fall > v[j + 9]) continue;
      let qx = v[j + 1], qy = v[j + 2], qz = v[j + 3];
      if (v[j] < 0.5) { const ex = v[j + 4] - qx, ey = v[j + 5] - qy, ez = v[j + 6] - qz, t = sat(((P.x - qx) * ex + (P.y - qy) * ey + (P.z - qz) * ez) / Math.max(ex * ex + ey * ey + ez * ez, 1e-6)); qx += ex * t; qy += ey * t; qz += ez * t; }
      const d = Math.hypot(P.x - qx, P.y - qy, P.z - qz) - v[j + 7];
      if (d < here) here = d;
      if (d < least) { least = d; if (where) where.splice(0, 7, P.x, P.y, P.z, qx, qy, qz, v[j + 7]); }
    }
    if (here < nearAt) near += path.length / steps;
  }
  return { least, steep, near, steepIn };      // near: metres of route with something nearer than nearAt; steepIn: the steepest pitch of the measured stretch alone
}
// THE CLIMB AND THE DIVE ARE CHOSEN BY TEST on this layout, each walked in even steps of 2 m of route.
// The climb (from the gate to the vault exit over arch 4). Candidates: the climb begins under arch 2 or arch 1 (until
// there the route runs low, under the wall films), each with the low stretch 9, 6, 3 or 0 m off the mirror plane.
// A candidate stands if it keeps 6 m from every rib, SKIN_LEAST from every wall film and web, and is nowhere steeper
// than CLIMB_STEEP. Of those that stand, the one that flies the fewest metres with a skin within SKIN_NEAR is taken
// (so that no skin hangs close beside the lens for long); among equals the one furthest off the mirror plane,
// then the later climb. If none stands, the one that keeps furthest from the skins.
// The dive. Candidates: the two furthest arches that are at least 110 m short of the seat, each with the line 16, 8,
// 0 or -8 m over the place where the crown before it stood (by then that crown has sagged and parted: the 12 m over it
// that round 3 kept has given way to the 10 m from what is really there) and at six depths under its own crown (0.9
// to 0.5 of its height in steps of 0.08). A candidate whose bare line is over 45 degrees or under 24 is not walked.
// The others are walked from the top of the flight to the level run before the seat (the last 60 m are fixed by the
// seat, not chosen) against every rib (each at the two stages its bay's sag lies between where the lens is, without
// the upper end it has lost by then), film, fringe and web. A candidate STANDS if nothing is nearer than DIVE_CLEAR
// and the walk is nowhere steeper than DIVE_STEEP; of those that stand the least steep is taken (within half a degree,
// the one that keeps furthest). If none stands the search goes on arch by arch toward the middle; if still none, the
// 45 degrees are kept, the candidate that keeps furthest is taken, and the search looks round it twice in finer steps
// (4 m and 0.04, then 2 m and 0.02). What it then keeps is in the result (stands, dive).
// makePath: the kit's; tick: called between steps of the work (the world yields there)
// SKIN_LEAST: 8 m, a third more than is kept from a rib, because a skin bellies and trembles; SKIN_NEAR: 20 m, two
// thirds of a wall film's own height (about 30 m); CLIMB_STEEP: no climb steeper than 46 degrees
export const SKIN_NEAR = 20, SKIN_LEAST = 8, CLIMB_STEEP = 46;
export async function chooseRoute(plan, side, makePath, tick = async () => {}) {
  const A = plan.arches, bins = await obstacles(plan, tick), skinBins = await skins(plan, tick), depths = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];
  let k0 = A.length - 1; while (k0 > 7 && A[k0].z < plan.seat.z + 110) k0--;
  // the climb: every candidate is measured from the gate's approach to the top of the flight (arch 5)
  let climb = null, far = null;
  for (const j of [2, 1]) for (const o of [9, 6, 3, 0]) {
    const path = makePath(routePoints(plan, side, k0, depths[0], j, o));
    const rib = await clearance(path, bins, null, 1e9, 8, tick, A[5].z), skin = await clearance(path, skinBins, null, 1e9, SKIN_REACH, tick, A[5].z, SKIN_NEAR); await tick();
    const c = { j, o, rib: rib.least, skin: skin.least, near: skin.near, steep: rib.steep };
    if (!far || c.skin > far.skin) far = c;
    if (c.rib >= 6 && c.skin >= SKIN_LEAST && c.steep <= CLIMB_STEEP && (!climb || c.near < climb.near - 1)) climb = c;
  }
  const cl = climb || far;
  // the dive: every candidate is the same curve as far as the top of the flight, so that part is measured once, at the end
  let best = null, ok = null, any = null;
  const tryOne = async (k, c, f) => {
    const m = (A[k - 1].H + c - f * A[k].H) / (A[k - 1].z - A[k].z);
    if (m > 1 || m < 0.45) return;      // the bare line is over 45 degrees, or so flat that it is no dive: not walked
    const where = [], path = makePath(routePoints(plan, side, k, f, cl.j, cl.o, c)), r = await clearance(path, bins, where, A[5].z, RIB_REACH, tick, plan.seat.z + 60); await tick();
    const cand = { path, clear: r.least, dive: r.least, steep: r.steepIn, k, f, c, where };
    if (!any || cand.clear > any.clear) any = cand;
    if (cand.steep <= DIVE_STEEP && (!best || cand.clear > best.clear)) best = cand;
    if (cand.clear >= DIVE_CLEAR && cand.steep <= DIVE_STEEP && (!ok || cand.steep < ok.steep - 0.5 || (cand.steep < ok.steep + 0.5 && cand.clear > ok.clear))) ok = cand; };
  const all = async (k) => { for (const c of [16, 8, 0, -8]) for (const f of depths) await tryOne(k, c, f); };
  for (const k of [k0, k0 - 1]) await all(k);
  for (let k = k0 - 2; !ok && k >= 7; k--) await all(k);
  // none stands on the coarse grid: look round the one that keeps furthest, twice, each time in steps half as large
  for (const [dc, df] of [[4, 0.04], [2, 0.02]]) if (!ok && best) { const b = best; for (const [sc, sf] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) await tryOne(b.k, b.c + sc * dc, b.f + sf * df); }
  const got = ok || best || any, where = [], whole = await clearance(got.path, bins, where, 1e9, 8, tick); await tick();
  got.stands = !!ok; got.diveSteep = got.steep;
  if (whole.least < got.clear) { got.clear = whole.least; got.where = where; }
  got.steep = whole.steep; got.climb = cl;
  return got;
}

// ---------------------------------------------------------------- 4c. the ocean builds elsewhere
// Two swellings of the sea beside the hall. rng: a stream of their own ('ocean-elsewhere'). Each is placed CLEAR OF THE
// HALL AS BUILT AT ITS OWN DEPTH: the outermost point of any rib, gallery arch or leg (with its thickness) whose z is
// within the swelling's radius plus ELSE_MARGIN of the swelling's own z, plus the swelling's full radius, plus
// ELSE_MARGIN (15 m: half a wall film's height, so its foam and first ring are clear of the feet too), plus 0 to 60 m
// more of its own draw; where the hall is not (past its far end) the hall's own width at the gate (60 m) stands in for
// it, so no swelling lies on the axis behind the portal. The first: its side, its depth (beside the hall's last tenth
// or past its far end, as far as 1.35 of its length: the ocean goes on beyond what it built), its radius (22 to 32
// m). The second from its own draws: its side, its radius, and a depth anywhere from 0.45 to 1.35 of the hall's length
// EXCEPT within ELSE_APART (120 m) of the first's depth, so the two are never opposite each other across the hall
// and never overlap. WHEN: the first begins to rise when the fall begins (the ocean lets go here as it begins there);
// the second when the fall has taken the outermost arcs of the far end back into the sea (the far bay's share of the
// fall is then 1/4.4, the stage at which its outermost gallery arch is gone: the fall is 1/(4.4 x SAG_RUN) = 0.175):
// what the hall gives back the ocean takes up elsewhere. Each rises from nothing over ELSE_RISE (0.4) of the fall to
// ELSE_HIGH (0.3) of its radius
export const ELSE_MARGIN = 15, ELSE_APART = 120, ELSE_RISE = 0.4, ELSE_HIGH = 0.3;
export function elsewhere(plan, rng) {
  const L = HALL.length, q = [0, 0, 0];
  const outer = (z, r) => { let m = 0;
    for (const set of [plan.main, plan.gal, plan.leg || plan.legs || []]) for (const rib of set) for (let i = 0; i <= 8; i++) { ribPoint(rib, i / 8, 0, q); if (Math.abs(q[2] - z) <= r + ELSE_MARGIN) m = Math.max(m, Math.abs(q[0]) + Math.max(rib.r0, rib.r1 || 0)); }
    return m; };
  const place = (side, z, r, more) => ({ x: side * (Math.max(outer(z, r), 2 * HALL.half) + r + ELSE_MARGIN + 60 * more), z, r });
  const s1 = rng() < 0.5 ? -1 : 1, z1 = -L * (0.9 + 0.45 * rng()), r1 = 22 + 10 * rng(), a = place(s1, z1, r1, rng());
  // the second's depth: the stretch from 0.45 of the hall to 1.35 of it, less the 240 m round the first's depth
  const lo = 0.45 * L, hi = 1.35 * L, c0 = Math.max(lo, -z1 - ELSE_APART), c1 = Math.min(hi, -z1 + ELSE_APART), free = (c0 - lo) + (hi - c1);
  const s2 = rng() < 0.5 ? -1 : 1, r2 = 22 + 10 * rng(), t = rng() * free, z2 = -(t < c0 - lo ? lo + t : c1 + (t - (c0 - lo))), b = place(s2, z2, r2, rng());
  a.from = 0; b.from = 1 / (4.4 * SAG_RUN); a.ph = 6.2832 * rng(); b.ph = 6.2832 * rng();
  return [a, b];
}

// ---------------------------------------------------------------- 5. meshes
// THE GLASS MIRRORS THE HALL (polish 1, Q3 a). The hall's own ribs and films are drawn a second time as the glass shows
// them: every point at height y above the glass is seen, by the law of reflection, where the straight line from the eye
// to the point y BELOW the glass crosses the glass. That crossing is where the image is drawn (flat on the glass, after
// the sea and before everything that stands on it), so the image is the same true mirror image for every eye; the
// image is bent only a little (third part, P1: the rib's own curve, soft at its sides, never a curling thread), and it is laid
// on with the lighter-of-the-two blend, so froth lying on the glass breaks it. DECLARED: the law of reflection needs
// the eye's place (where the image lies on the glass, and the glass's own law of how much it gives back at a grazing
// look); nothing else of the image reads it. vM: where on the glass (x, z), the point's height, and how much of the
// image the air lets through: the world's own fog (wFogAmt, called) for the image point, the point as deep under
// the glass as the thing stands above it, which is as far from the eye as the light's way is long
const W_MIRROR_VS = /* glsl */`
#ifdef W_MIRROR
varying vec4 vM;
vec4 wMirrorAt(vec3 wp){
  float hy = max(wp.y, 0.0), cy = max(cameraPosition.y, 0.5), s = cy/(cy + hy);
  vec2 q = cameraPosition.xz + (wp.xz - cameraPosition.xz)*s;
  q += hy*0.006*(vec2(wN2(q/41.0 + vec2(uTime*0.03, 0.0)), wN2(q/41.0 + vec2(5.0, -uTime*0.025))) - 0.5);      // (third part, P1) bent a little by the glass's slow swell: 0.6 m to 100 m of height
  vM = vec4(q, hy, 1.0 - wFogAmt(vec3(wp.x, -hy, wp.z)));
  return projectionMatrix*viewMatrix*vec4(q.x, 0.0, q.y, 1.0);
}
#endif
`;
// THE DISC OF GLASS, given out once (the sea part's wGlass and the image in the glass both call it): how far the place
// p of the sea lies from the disc's middle, 1 at its rim. Centre (0, -300), 330 by 430 m
export const W_GLASS_DISC = /* glsl */`
float wGlassR(vec2 p){ return length((p - vec2(0.0, -300.0))/vec2(330.0, 430.0)); }
`;
// what the dark glass gives back of a pale thing: a quarter of it seen from straight above, two fifths at a grazing
// look (the glass's own law, as on the sea), dimmed by the world's own fog on the light's way (vM.w), tinted by the
// glass, only on the disc of glass (wGlassR). It shows what stands: nothing in it goes by the fall
const W_MIRROR_FS = /* glsl */`
#ifdef W_MIRROR
varying vec4 vM;
${W_GLASS_DISC}
vec4 wMirrorOut(vec3 col){
  float glass = 1.0 - smoothstep(0.8, 1.0, wGlassR(vM.xy));
  vec2 e = cameraPosition.xz - vM.xy;
  float om = 1.0 - clamp(cameraPosition.y/max(length(vec3(e.x, cameraPosition.y, e.y)), 1e-3), 0.0, 1.0);
  float k = (0.24 + 0.14*om*om*om)*glass*clamp(vM.w, 0.0, 1.0)/(1.0 + max(vM.z, 0.0)/16.0);      // (third part, P1: 0.24 to 0.38; U5: the world's fog, no haze of its own; fourth part, D4: the image of what stands high is blurred away by the swell: half at 16 m of height, a fifth at 64 m, so a trunk's image is whole at its foot and no thin bright line lies far out on the glass)
  return vec4(col*k*vec3(1.0, 0.84, 0.9), 1.0);
}
#endif
`;
const MIRROR_RIB_FS = /* glsl */`
${W_COMMON}
${W_MIRROR_FS}
varying vec3 vW, vN; varying vec4 vI; varying vec3 vA; varying float vPulse;
void main(){
  vec3 N = vN/max(length(vN), 1e-4);
  float fA = clamp(dot(N, uSunA)*0.6 + 0.4, 0.0, 1.0), fB = clamp(dot(N, uSunB)*0.6 + 0.4, 0.0, 1.0);
  float grain = 0.8 + 0.4*wN(vW*0.35);
  vec3 col = uFroth*grain*(uAmbHi + uFill + 0.5*(wPale(uSunACol)*fA*fA + wPale(uSunBCol)*fB*fB));
  vec3 Vm = vW - vec3(cameraPosition.x, -cameraPosition.y, cameraPosition.z); Vm /= max(length(Vm), 1e-3);
  gl_FragColor = wMirrorOut(wKnee(col)*(0.22 + 0.78*clamp(vA.y, 0.0, 1.0))*smoothstep(0.0, 0.7, abs(dot(N, Vm))));      // (third part, P1) soft-edged: a rib's image fades out toward its two sides
}`;
const RIB_VS = /* glsl */`
#define W_OLD ${(1.7 * TL.arch).toFixed(5)}
${W_COMMON}
${W_RIB}
${W_MIRROR_VS}
attribute vec3 aA, aB; attribute vec4 aSh, aGrow, aMisc;      // aGrow: r0, r1, birth, dur; aMisc: bay, sag weight + 10 x place in chain, kind + seed, k
varying vec3 vW, vN; varying vec4 vI;                         // vI: tn, crown weight, bay, growing-tip glow
varying vec3 vA; varying float vPulse;                        // vA: age 0 fresh .. 1 set, how much of its width is real (far, thin ribs), how thin; vPulse: its share of the light pulse
void main(){
  float tn = position.x, ang = position.y, kind = floor(aMisc.z + 0.001), seed = fract(aMisc.z);
  float graw = clamp((uU - aGrow.z)/max(aGrow.w, 1e-3), 0.0, 1.0), g = graw*graw*(3.0 - 2.0*graw);
  float ord = floor(aMisc.y/10.0 + 0.001), sagW = aMisc.y - 10.0*ord;
  float sag = clamp(uSag*W_SAG_RUN - W_SAG_LAG*(1.0 - aMisc.x/12.0), 0.0, 1.0)*sagW;      // this bay's share of the fall: the far bays first
  float tc = min(tn, g);
  // the fall: every rib is lost from its far end back toward where it springs. A main rib loses its crown first; a gallery
  // chain goes from the outside in (its fourth arch first), and the legs under a landing go with it. Nothing is left hanging
  float stage = clamp(sag*4.4 - (3.0 - ord), 0.0, 1.0);
  float lim = kind < 0.5 ? 1.0 - 0.36*sag : 1.0 - stage;
  if (kind < 1.5) tc = min(tc, lim);
  float taper = kind < 1.5 ? mix(1.0, sqrt(clamp((lim - tc)/0.1, 0.0, 1.0)), smoothstep(0.0, 0.05, 1.0 - lim)) : 1.0 - smoothstep(0.0, 0.3, stage);      // a soft round end
  float falling = smoothstep(0.0, 0.05, 1.0 - lim);
  vec3 P = wRib(aA, aB, aSh, aMisc.w, tc, sag);
  vec3 Pa = wRib(aA, aB, aSh, aMisc.w, max(tc - 0.006, 0.0), sag), Pb = wRib(aA, aB, aSh, aMisc.w, min(tc + 0.006, 1.0), sag);
  float droop = kind > 0.5 && kind < 1.5 ? stage*0.45*length(aB - aA) : 0.0;      // what is left of a gallery arch wilts
  P.y -= droop*tc*tc; Pa.y -= droop*max(tc - 0.006, 0.0)*max(tc - 0.006, 0.0); Pb.y -= droop*min(tc + 0.006, 1.0)*min(tc + 0.006, 1.0);
  vec3 T = Pb - Pa; T /= max(length(T), 1e-4);
  vec3 Nz = cross(aB - aA, vec3(0.0, 1.0, 0.0)); Nz /= max(length(Nz), 1e-4);
  vec3 N1 = cross(Nz, T); N1 /= max(length(N1), 1e-4);
  float r = mix(aGrow.x, aGrow.y, tn);
  r *= 0.86 + 0.3*wN(P*0.11 + vec3(cos(ang), sin(ang), seed*9.0)*1.3);            // lumpy, never a turned column
  float growing = 1.0 - smoothstep(0.86, 1.0, graw);                               // the swollen tip sinks back into the rib as it completes
  float dt = (tn - g)/0.08, bulb = growing*exp(-dt*dt);
  float rTrue = r, rMin = 0.0026*length(P - cameraPosition);                     // a far rib keeps a least width (it never breaks into dots or scribble) ...
  r = max(r, rMin);                                                              // ... and what it is given beyond its own is paid for by fading into the haze (vA.y)
  if (kind < 0.5) r *= 1.0 - 0.55*sag*smoothstep(0.45, 1.0, tn);                 // in the fall a crown thins before it parts
  r *= (1.0 + 0.8*bulb)*smoothstep(0.0, 0.05, graw)*taper;
  float cap = clamp((tn - g)/0.03, 0.0, 1.0)*1.5708*growing;                      // the unborn part folds into a round tip
  vec3 dir = cos(ang)*N1 + sin(ang)*Nz;
  vec3 wp = P + dir*r*cos(cap) + T*r*sin(cap);
  float cw = kind < 0.5 ? tn : (kind < 1.5 ? 1.0 - abs(2.0*tn - 1.0) : 0.0);
  vA = vec3((uU - aGrow.z - aGrow.w*tn)/W_OLD, rTrue/max(rMin, 1e-4), 1.0 - smoothstep(0.7, 2.6, rTrue));
  vPulse = kind < 0.5 ? 1.0 : (kind < 1.5 ? 0.3 : 0.0);
  vW = wp; vN = dir*cos(cap) + T*sin(cap); vI = vec4(tn, cw, aMisc.x, max(bulb, falling*(1.0 - taper)));
#ifdef W_MIRROR
  gl_Position = wMirrorAt(wp);
#else
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
#endif
}`;
const RIB_FS = /* glsl */`
${W_COMMON}
varying vec3 vW, vN; varying vec4 vI; varying vec3 vA; varying float vPulse;
void main(){
  vec3 Vv = vW - cameraPosition; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-3);
  vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
  float nearK = 1.0 - smoothstep(30.0, 110.0, dist), midK = 1.0 - smoothstep(140.0, 400.0, dist);
  // THE SKIN TELLS ITS AGE. Fresh (behind the front): wet froth, deep bubbles from fist to barrel size, rose in every
  // hollow and in broad stains. Set (the lens has come 130 m since): plaster white and smooth, the bubbles only a shallow
  // relief, rose left in thin seams, and a soft sheen of each sun sliding over it
  float age = clamp(vA.x, 0.0, 1.0), fresh = 1.0 - age, wet = clamp(vI.w, 0.0, 1.0);
  float pick = smoothstep(0.38, 0.62, wN(vW*0.19 + 11.0));
  vec4 b1 = wBubbles(vW*0.42), b2 = wBubbles(vW*1.5 + 5.0), b3 = wBubbles(vW*4.6 + 9.0);
  vec4 bb = mix(mix(b1, b2, pick), b2, 0.7*fresh);
  // FROM NEAR (inside 60 m, whole inside 18 m) a rib is a surface, not a pale pole: the set froth's own cells stand in
  // relief, some have burst into pits, and long cracks run up it with rose in them
  float closeK = 1.0 - smoothstep(18.0, 60.0, dist);
  float relief = (mix(0.2, 0.8, fresh) + 0.5*closeK*age)*(1.0 - 0.7*wet);
  float pit = (1.0 - smoothstep(0.1, 0.42, b2.x))*smoothstep(0.52, 0.7, wN(vW*0.9 + 21.0))*closeK;
  float crack = (1.0 - smoothstep(0.0, 0.035, abs(wN(vW*vec3(0.55, 0.13, 0.55) + 31.0) - 0.5)))*smoothstep(0.3, 0.6, wN(vW*0.07 + 17.0))*closeK;
  vec3 Nb = N + (0.5*midK*bb.yzw + 0.3*nearK*b3.yzw)*relief; Nb /= max(length(Nb), 1e-4);
  float seamNew = max(0.6*bb.x*bb.x*midK*(1.0 - 0.7*nearK), 0.5*b3.x*b3.x*nearK), seamOld = max(smoothstep(0.9, 1.0, b2.x)*midK, 0.7*smoothstep(0.9, 1.0, b3.x)*nearK);      // set froth keeps its rose only in the fine cracks of the crust
  float hollow = max(mix(seamNew, 0.7*seamOld, age), max(0.8*pit, crack))*(1.0 - 0.8*wet);
  float blotch = wN(vW*0.045 + 3.0);                                                // broad rose stains while it is fresh
  vec3 alb = mix(uFroth*mix(0.86, 1.0, age), uRose*0.66, clamp(mix(0.7, 0.45, age)*hollow + fresh*(0.04 + 0.22*smoothstep(0.45, 0.85, blotch)), 0.0, 1.0));
  // a collar of fresh froth creeps up the foot of every main pier, rising and sinking on the 5.2 s breath
  float collar = clamp(2.0*vPulse - 1.0, 0.0, 1.0)*(1.0 - smoothstep(3.0, 8.0, vW.y + 4.0*wN(vW*0.35) - 1.5*sin(uTime*1.2083 + vI.z)));
  alb = mix(alb, uFroth*0.9, 0.85*collar); hollow *= 1.0 - 0.7*collar;
  // the foot stands in the sea: darker and wet as high as the swell throws its water (5 to 13 m, ragged)
  float foot = (1.0 - smoothstep(5.0, 13.0, vW.y + 4.0*wN(vW*0.3 + 7.0)))*(1.0 - 0.85*collar);
  alb *= 1.0 - 0.36*foot;
  // (polish 1, Q3 d) FROTH THAT SET, STILL WET: a bubbled grain that reads from the vault too (cells of 2 to 6 m, pale
  // heads and shaded hollows), and further down a wet sheen: the sky's colour at a glancing look, a broad soft light of
  // each sun, strongest low on the rib where the sea's water climbs it
  float grainB = wN(vW*0.5 + 5.0), grainS = wN(vW*1.7 + 13.0);
  alb *= 0.8 + 0.3*grainB + 0.12*(grainS - 0.5)*(1.0 - smoothstep(0.15, 0.6, max(length(dFdx(vW)), length(dFdy(vW)))));      // (the fine grain goes over into its mean by the pixel's footprint: the declared footprint fade)
  float thin = clamp(vA.z, 0.0, 1.0);                                               // a thin rib is glassy: the sun behind it comes through
  vec3 col = wFrothLight(alb, Nb, V, mix(0.5, 1.6, thin))*(1.0 - 0.5*hollow*mix(0.5, 1.0, fresh));
  vec3 R = reflect(V, Nb); float sa = clamp(dot(R, uSunA), 0.0, 1.0), sb = clamp(dot(R, uSunB), 0.0, 1.0);
  col += (wPale(uSunACol)*pow(sa, 22.0) + wPale(uSunBCol)*pow(sb, 22.0))*(0.1*age + 0.25*foot)*(1.0 - hollow)*(1.0 - collar);
  // a lit side and a shade side: each sun lays its own colour on the flank that faces it; the flank that faces neither
  // is left to the sky, darker from near
  float fA = clamp(dot(Nb, uSunA), 0.0, 1.0), fB = clamp(dot(Nb, uSunB), 0.0, 1.0);
  col += alb*(uSunACol*fA*fA + uSunBCol*fB*fB)*0.2;
  col *= 1.0 - 0.3*closeK*(1.0 - fA)*(1.0 - fB);
  { float glance = 1.0 - clamp(dot(Nb, -V), 0.0, 1.0); glance *= glance;
    float low = 0.45 + 0.55*(1.0 - smoothstep(4.0, 26.0, vW.y));
    col += (wFogCol(R)*0.34*glance + (wPale(uSunACol)*sa*sa*sa*sa*sa*sa + wPale(uSunBCol)*sb*sb*sb*sb*sb*sb)*0.09)*low*(1.0 - 0.6*hollow)*(0.7 + 0.6*grainB); }
  // the pulse: one band of light climbs every rib each 5.2 s, a little later in each bay, so a slow wave runs down the hall
  float ph = fract(uTime/5.2 - vI.z*0.085)*1.5 - 0.2, d = (vI.x - ph)/0.045;
  col += uPulseCol*0.3*clamp(vPulse, 0.0, 1.0)*exp(-min(d*d, 30.0))*(0.3 + 0.7*(1.0 - hollow));      // a faint band: lit matter, not a lamp
  col *= 1.0 + 0.12*wet; col += alb*uFill*0.8*wet;            // a growing tip is fresh wet froth: brighter, lit by the whole sky
  col = wFog(wKnee(col), vW);
  gl_FragColor = vec4(mix(wFogCol(V), col, 0.22 + 0.78*clamp(vA.y, 0.0, 1.0)), 1.0);      // a rib too thin for its distance goes into the haze
}`;

function tubeGeometry(segS, segR) {
  const pos = [], idx = [];
  for (let i = 0; i <= segS; i++) for (let j = 0; j <= segR; j++) pos.push(i / segS, (j / segR) * Math.PI * 2, 0);
  for (let i = 0; i < segS; i++) for (let j = 0; j < segR; j++) { const a = i * (segR + 1) + j, b = a + segR + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  return { pos: new Float32Array(pos), idx };
}
function ribAttributes(g, ribs) {
  const n = ribs.length, A = new Float32Array(n * 3), B = new Float32Array(n * 3), Sh = new Float32Array(n * 4), Gr = new Float32Array(n * 4), Mi = new Float32Array(n * 4);
  ribs.forEach((r, i) => {
    A.set(r.A, i * 3); B.set(r.B, i * 3); Sh.set([r.R, r.t0, r.t1, r.p], i * 4); Gr.set([r.r0, r.r1, r.birth, r.dur], i * 4);
    Mi.set([r.bay, r.sagW + 10 * (r.j || 0), r.kind + r.seed * 0.98, r.k], i * 4);      // sag weight + 10 x place in its gallery chain
  });
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3));
  g.setAttribute('aSh', new THREE.InstancedBufferAttribute(Sh, 4)); g.setAttribute('aGrow', new THREE.InstancedBufferAttribute(Gr, 4));
  g.setAttribute('aMisc', new THREE.InstancedBufferAttribute(Mi, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, -300), 900);
  return g;
}
function makeRibMesh(ribs, segS, segR, material) {
  const t = tubeGeometry(segS, segR), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(t.pos, 3)); g.setIndex(t.idx);
  const m = new THREE.Mesh(ribAttributes(g, ribs), material); m.frustumCulled = false; return m;
}

// FILMS: skins of set froth. Two kinds, one mesh: a WALL film is stretched between two neighbouring piers like a hide
// between two posts (fast along both piers, its upper and lower edges free and drawn into a curve); a WEB hangs under a
// gallery arch (fast along the arch, its lower edge free). Each vertex blends two rib curves (for a web the second is the
// same arch drawn flatter), so a film follows growth and sag for nothing. It spreads from where it is fast, has three
// openings, a lit lip on every free edge and round every opening, a deep belly, free edges that hang in torn scallops,
// and in the fall its openings widen until the skin is gone. Near the mirror plane it is only a fringe on its rib.
// The films' sheets in JS (the same blend of two rib curves as FILM_VS; the belly is added to the radius), for the
// world's clearance test: [x, y, z, r] on an n x n grid of every film, r = belly + half a grid cell; tear: how far it
// has drooped in the fall (0..1)
const FILM_TEAR = 2.6;        // a film's tear runs at 2.6 times the fall: the skins go first
// A FILM'S CLOCK, given out once (third part, U6): the fall times FILM_TEAR, less half the film's dealt lag (0..1).
// 0..1 the tear; 1..2 the tatters; past 2 what hangs on the ribs goes. The films call it with their own lag; the
// sea part calls it for the rags that fall from the films and for the share of the hall's shadow the films give
export const W_FILM_CLOCK = /* glsl */`
float wFilmClock(float lag){ return uSag*${FILM_TEAR.toFixed(1)} - 0.5*lag; }
`;
const FILM_BELLY = 0.17;      // the belly's depth as a share of the sheet's shorter side (the shader's 0.15 plus its tremble)
// THE NAVE CLOSES LAST (a rule of growth): films grow from the outer rim of a bay inward; within NAVE_OPEN metres of
// the mirror plane (measured to the film's own surface) a film is only a fringe clinging to its rib, FRINGE metres
// deep at the most and torn to nothing in places
export const NAVE_OPEN = 24, FRINGE = 4;      // 24: the 22 m kept clear round the route's line plus the 2 m the route itself swings off the plane inside the nave
// fine: the fringe is given where it is, in the film's own surface: two rows of balls of 1.6 m, 1.5 and 3.2 m in from
// the rib, every quarter of a grid step along it, instead of balls of half a grid cell on the rib: the dive's test
// measures to it; the climb's test (skins) keeps the coarse, larger balls
export function filmSamples(films, n = 12, tear = 0, fine = false) {
  const out = [], p1 = [0, 0, 0], p2 = [0, 0, 0], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (const f of films) {
    const tm = 0.5 * (f.tn0 + f.tn1), a0 = ribPoint(f.a, f.tn0).slice(), a1 = ribPoint(f.a, f.tn1).slice(), am = ribPoint(f.a, tm).slice(), bm = ribPoint(f.b, tm).slice();
    const lb = d(a0, a1), la = d(am, bm), mn = Math.min(la, lb), cell = 0.5 * Math.max(la, lb) / n;
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      const a = i / n, b = j / n, tn = mix(f.tn0, f.tn1, b); ribPoint(f.a, tn, 0, p1); ribPoint(f.b, tn, 0, p2);
      const belly = Math.sin(Math.PI * a) * Math.sin(Math.PI * b), x = mix(p1[0], p2[0], a);
      const dA = (f.web ? a : Math.min(a, 1 - a)) * la;
      if (Math.abs(x) < NAVE_OPEN && dA > FRINGE) continue;      // the nave closes last: nothing there but the fringe on the rib
      if (fine && Math.abs(x) < NAVE_OPEN) {
        if (i === 0 || (i === n && !f.web)) for (let q = 0; q < (j < n ? 4 : 1); q++) { const t2 = mix(f.tn0, f.tn1, (j + q / 4) / n); ribPoint(f.a, t2, 0, p1); ribPoint(f.b, t2, 0, p2);
          for (const dd of [1.5, 3.2]) { const a2 = i === 0 ? dd / la : 1 - dd / la; out.push([mix(p1[0], p2[0], a2), mix(p1[1], p2[1], a2), mix(p1[2], p2[2], a2), 1.6]); } }
        continue;
      }
      out.push([x, mix(p1[1], p2[1], a) - tear * belly * 0.25 * mn, mix(p1[2], p2[2], a), FILM_BELLY * mn * belly + cell]);
    }
  }
  return out;
}
const FILM_VS = /* glsl */`
#define W_FILM_OLD ${(4 * TL.arch).toFixed(5)}
${W_COMMON}
${W_FILM_CLOCK}
${W_RIB}
${W_MIRROR_VS}
attribute vec3 aA1, aB1, aA2, aB2; attribute vec4 aSh1, aSh2, aF, aM;      // aF: tn0, tn1, birth, dur; aM: bay, sag weight of rib 2 (+ 2 for a web), k + 10 x place in chain, seed
varying vec3 vW, vN; varying vec4 vUv; varying vec4 vK;                      // vUv: a, b, width across, length along (m); vK: spread, tear, seed, web
varying float vCut;                                                          // > 0 where the ribs that carry this part still stand
attribute vec3 aH0, aH1, aH2;                                                // its openings: place across, place along, radius (shares of the sheet)
varying vec3 vH0, vH1, vH2; varying float vAge;                              // vAge: 0 when it has just spread .. 1 when the lens has come four arch-closings further
varying float vX;                                                            // metres from the mirror plane, of the surface itself
varying vec2 vT;                                                             // the film's clock past its tear: x the tatters (0..1), y what is left on the ribs going (0..1)
void main(){
  vH0 = aH0; vH1 = aH1; vH2 = aH2; vAge = clamp((uU - aF.z - aF.w)/W_FILM_OLD, 0.0, 1.0);
  float a = position.x, b = position.y, tn = mix(aF.x, aF.y, b), ordF = floor(aM.z/10.0 + 0.001), kf = aM.z - 10.0*ordF;
  float web = step(1.5, aM.y), w2 = aM.y - 2.0*web;
  float s1 = clamp(uSag*W_SAG_RUN - W_SAG_LAG*(1.0 - aM.x/12.0), 0.0, 1.0)*mix(1.0, w2, web);
  float s2 = mix(clamp(uSag*W_SAG_RUN - W_SAG_LAG*(1.0 - (aM.x + 1.0)/12.0), 0.0, 1.0)*w2, s1, web);
  vec3 P1 = wRib(aA1, aB1, aSh1, kf, tn, s1), P2 = wRib(aA2, aB2, aSh2, kf, tn, s2);
  vec3 Q1 = wRib(aA1, aB1, aSh1, kf, min(tn + 0.02, 1.0), s1), Q0 = wRib(aA1, aB1, aSh1, kf, max(tn - 0.02, 0.0), s1);
  float stage = web*clamp(s1*4.4 - (3.0 - ordF), 0.0, 1.0), droop = stage*0.45*length(aB1 - aA1)*tn*tn;      // a web wilts with its arch
  P1.y -= droop; P2.y -= droop;
  vec3 across = P2 - P1, along = (Q1 - Q0)*((aF.y - aF.x)/0.04);
  float la = max(length(across), 1e-3), lb = max(length(along), 1e-3);
  vec3 N = cross(across, along); N /= max(length(N), 1e-4);
  float belly = sin(3.14159*a)*sin(3.14159*b);
  float tr = 0.5*sin(uTime*2.3 + aM.w*40.0 + a*9.0) + 0.35*sin(uTime*3.7 + b*11.0 + aM.w*17.0) + 0.3*sin(uTime*5.9 + (a + b)*14.0);
  // THE FILM'S CLOCK (one clock, the live one: 2.6 times the fall, less the film's own dealt delay). 0..1 THE TEAR: it
  // sags to its full depth and splits. 1..2 THE TATTERS (polish 1, Q5): they begin when the film's sag has reached its
  // full depth (clock = 1) and run for one more turn of the same clock. Past 2 what hangs on the ribs goes
  float clockF = wFilmClock(wH2(vec2(aM.x, aM.w*31.0))), tear = clamp(clockF, 0.0, 1.0);        // the skins go first: in tatters while the ribs only droop
  vT = vec2(clamp(clockF - 1.0, 0.0, 1.0), clamp(clockF - 2.0, 0.0, 1.0));
  float hb = min(la, lb)*(0.15 + 0.012*tr);                                         // a skin bellies between its ribs, both ways
  vec3 wp = mix(P1, P2, a) + N*belly*hb - vec3(0.0, 1.0, 0.0)*tear*belly*0.25*min(la, lb);
  // the belly's own slope tilts the surface: the light shows the curve
  vec3 Nb = N - (across/la)*(hb*3.14159*cos(3.14159*a)*sin(3.14159*b)/la) - (along/lb)*(hb*3.14159*sin(3.14159*a)*cos(3.14159*b)/lb);
  N = Nb/max(length(Nb), 1e-4); vX = abs(wp.x);
  // a film is lost with the part of its ribs that the fall has taken
  float lim = mix(1.0 - 0.36*max(s1, s2), 1.0 - stage, web);
  vCut = lim - tn - 0.04;
  vW = wp; vN = N; vUv = vec4(a, b, la, lb); vK = vec4(wGrown(aF.z, aF.w), tear, aM.w, web);
#ifdef W_MIRROR
  gl_Position = wMirrorAt(wp);
#else
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
#endif
}`;
const FILM_FS = /* glsl */`
#define W_NAVE_OPEN ${NAVE_OPEN.toFixed(1)}
#define W_FRINGE ${FRINGE.toFixed(1)}
${W_COMMON}
${W_SKY}
${W_MIRROR_FS}
varying vec3 vW, vN; varying vec4 vUv; varying vec4 vK; varying float vCut;
varying vec3 vH0, vH1, vH2; varying float vAge; varying float vX; varying vec2 vT;
// metres outside a TEAR. A film does not open in rounds: it tears along a cord. h: where the tear began (place across,
// place along, size, as shares of the sheet); it runs along the cord nearest to that place (q: the fragment's place
// along the rib with the cords' own wander in it; per: the cords' spacing), 1.6 to 2.8 times as long as its size and
// 0.14 to 0.3 as wide as long, blunt at the end where it began and running out to a point at the other, its edge
// ragged by rag (-1..1). grow: what age and the fall add
// (polish 1, Q1: a tear is a SPLIT: a lens that lies between two cords, widest in the middle and closing to a point at
// both ends, never wider than the cords let it; its line wanders a little (rag), it has no teeth)
float wTear(vec3 h, vec2 uv, vec2 dim, float mn, float grow, float q, float per, float rag){
  float open = step(1e-3, h.z), L = max(min((h.z*(1.0 + 0.5*vAge) + grow)*mn*(1.6 + 1.2*fract(h.x*7.3)), dim.x*(0.2 + 0.2*fract(h.x*7.3))), 1e-3);
  float W = min(L*(0.14 + 0.16*fract(h.y*5.7)), per*(0.3 + 0.14*fract(h.y*9.1)));
  float dx = (uv.x - h.x)*dim.x, dy = q - (floor(h.y*dim.y/per) + 0.5)*per + 0.4*rag, ux = clamp(dx/L, -1.0, 1.0);
  return mix(1e3, max(abs(dy) - W*(1.0 - ux*ux), abs(dx) - L), open);
}
void main(){
  vec2 uv = clamp(vUv.xy, 0.0, 1.0); float la = vUv.z, lb = vUv.w, mn = max(min(la, lb), 1e-3), web = vK.w;
  vec2 dim = vec2(la, lb), fp = uv*dim;                                             // the sheet's own metres: the same on both sides of the mirror plane
  float n1 = wN(vec3(fp*0.09, vK.z*20.0)), n2 = wN(vec3(fp*0.4, 7.0 + vK.z*3.0));
  // metres to the nearest edge where it is fast (the ribs) and to the nearest free edge. A wall film's free edges lie
  // close along its neighbours above and below (a seam between them, no gap)
  // a free edge hangs in a deep scallop between its two ribs and is torn: never a straight run of more than a few metres
  float scal = (0.1 + 0.07*n1)*sin(3.14159*uv.x);
  float dAtt = mix(min(uv.x, 1.0 - uv.x), uv.x, web)*la;
  float torn = 1.6*(wN(vec3(fp*0.33, vK.z*11.0)) - 0.5) + 0.7*(n2 - 0.5);
  float dFree = mix(min(uv.y - scal, 1.0 - scal - uv.y)*lb, (1.0 - uv.x*(1.0 + 0.12*sin(3.14159*uv.y)))*la, web) + torn;
  // the nave closes last: within NAVE_OPEN of the mirror plane only a fringe on the rib, torn, thinning to nothing
  float fr = W_FRINGE*smoothstep(0.3, 0.75, wN(vec3(fp.y*0.21, vK.z*23.0, 3.0)))*(0.6 + 0.4*n2)*(1.0 - smoothstep(0.3, 1.0, vK.y));      // (polish 1) the fringe draws back into its rib while the film sags and is gone when the sag is at its full depth, where live's tatters had taken it: the nave is bare for the dive, as in live
  // the wing's free edge hangs in a scallop from rib to rib (3.5 m further out at mid span) and wanders: it lies between
  // 24.1 and 31.4 m from the plane, never nearer. What is left: the wing outside it, the fringe on the rib
  float dNave = max(vX - W_NAVE_OPEN - 0.5 - 3.0*n1 - 3.5*sin(3.14159*uv.x)*(1.0 - web), fr - dAtt) + 0.35*torn;
  dFree = min(dFree, dNave);
  float e = mix(min(uv.x, 1.0 - uv.x)*2.0, uv.x, web);                              // 0 where it is fast .. 1 furthest from it
  float spread = vK.x*1.35 - e - 0.2*(n1 - 0.5) - 0.1;                              // > 0 where the skin has formed
  // its openings: several, of differing size, at differing heights; they widen a little with age and tear open in the fall
  float grow = vK.y*0.5, rag = 2.0*wN(vec3(fp*0.25, vK.z*13.0)) - 1.0;
  // the cords' spacing and wander (used by the tears here and by the cords below)
  float per = 6.0 + 4.0*fract(vK.z*37.0), q = fp.y + 2.6*(wN(vec3(fp*0.12, vK.z*17.0)) - 0.5) + 0.9*(n2 - 0.5);
  float hole = min(wTear(vH0, uv, dim, mn, grow, q, per, rag), min(wTear(vH1, uv, dim, mn, grow, q, per, rag), wTear(vH2, uv, dim, mn, grow, q, per, rag)));
  vec3 eye = cameraPosition;                                                        // (what is open and what is skin is weighed below, with the splits)
#ifdef W_MIRROR
  eye.y = -eye.y;                                                                   // the glass shows the film as an eye as far below the glass would see it
#endif
  vec3 Vv = vW - eye; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-3);
  vec3 N = vN/max(length(vN), 1e-4); if (dot(N, V) > 0.0) N = -N;
  // THE FILM HAS A BODY. Thick where it is fast (a fillet that runs out of the rib over 3 m, never a line), thick in a
  // curled lip round every opening and along every free edge, thick in the cords; thin and clear in the middle of each cell
  float lip = max(1.0 - smoothstep(0.1, 1.3, hole), 1.0 - smoothstep(0.05, 1.0, dFree));
  float fil = 1.0 - smoothstep(0.0, 3.2, dAtt); fil *= fil;
  // cords: they leave the rib square to it, one every 6 to 10 m of its length, stout at the rib (0.5 m) and fine at mid
  // span; 3 m in each forks in two, and the forks draw apart to a third of the way to the next cord
  float qm = abs(mod(q + 0.5*per, per) - 0.5*per), cw = 0.1 + 0.42*exp(-min(dAtt, 40.0)/8.0);
  float fork = abs(qm - per*0.33*smoothstep(3.0, 13.0, dAtt));
  float cord = max(1.0 - smoothstep(0.45*cw, cw, qm), 1.0 - smoothstep(0.3*cw, 0.7*cw, fork));      // the cords are there from the first: the film spreads between them
  float v1 = cord;
  // THE FALL TAKES A FILM BY SPLITS (polish 1, Q1 and Q5; this replaces the patches of live, cut by a noise at a tear of
  // 0.55). The film lies in CELLS between its cords. THE TEAR (the film's clock 0..1): in a few of its cells (three in
  // ten, dealt by the cell and the film's own seed) the skin first thins and sags in a long patch that lets the light
  // through, then SPLITS there: a lens along the cords, widest in the middle, pointed at both ends, 0.3 to 0.8 of the
  // sheet long, never wider than its cell. THE TATTERS (the clock 1..2; they begin when the film's sag has reached its
  // full depth): cell after cell the split opens to the cords on both sides and runs out between them toward the ribs;
  // three cords in ten stay strung across their stripped cell for a while, whole, and then go whole; what is left is a
  // few rags by the ribs (second part, P2: most of a hoop is bare), and they shrink while the clock runs on past 2
  float px = max(length(dFdx(fp)), length(dFdy(fp)));
  float cellI = floor(q/per), dqc = q - (cellI + 0.5)*per;
  float h1 = wH2(vec2(cellI + 3.0, vK.z*57.0 + 1.0)), h2 = wH2(vec2(cellI*1.7 + 11.0, vK.z*91.0 + 2.0)), h3 = wH2(vec2(cellI*2.3 + 5.0, vK.z*23.0 + 7.0));
  float early = step(h1, 0.3), s0 = 0.12 + 0.6*h2, o1 = early*clamp((vK.y - s0)/0.3, 0.0, 1.0);
  float t0 = 0.35*h3*(1.0 - 0.5*early), o2 = clamp((vT.x - t0)/0.35, 0.0, 1.0); o2 = o2*o2*(3.0 - 2.0*o2);
  float xF = (0.25 + 0.5*h3)*la, LF = (0.15 + 0.25*h2)*la, WF = per*(0.14 + 0.28*fract(h1*7.0));
  // what the stripped cells leave on a rib: one hem of skin, 0.4 to 3.5 m deep, its edge a slack curve that runs on from
  // cell to cell (the split's ends go square as it runs out: no teeth); it shrinks to a quarter while the tatters end
  // and goes on shrinking past them. Within the open nave nothing is left: the fringe there goes with its cell, as in live
  // (second part, P2) most of a hoop is BARE; here and there a rag hangs on (a quarter of a rib's length carries one),
  // a few of them long (up to 9 m), each cell's of its own length, its end ragged
  float hemL = smoothstep(0.66, 0.92, wN(vec3(q*0.13, vK.z*19.0, 5.0)));      // (third part, P5: a rag on about a seventh of a rib's length)
  float hem = 9.0*hemL*hemL*(0.08 + 0.92*h2*h2)*(1.0 - 0.6*smoothstep(0.5, 1.0, vT.x))*(1.0 - 0.8*vT.y)*smoothstep(W_NAVE_OPEN - 4.0, W_NAVE_OPEN + 8.0, vX);
  float mid = mix(0.5, 1.0, web)*la;                                                // a web is fast along its arch only: its cells are stripped out to its free edge
  float dqq = dqc - 0.22*per*(h2 - 0.5)*(1.0 - o2) - 0.3*sin(fp.x*0.45 + 6.283*h3), dx = fp.x - mix(xF, mid + (h3 - 0.5)*1.4*hem*(1.0 - web), o2) + 0.9*o2*(wN(vec3(q*0.9, fp.x*0.25, vK.z*7.0)) - 0.5)*step(0.05, hem);
  float Lh = max(mix(LF*(0.3 + 0.7*o1), mid - hem, o2), 1e-3), Wh = mix(WF*o1, 0.5*per + 0.25, o2);
  float ux = clamp(dx/Lh, -1.0, 1.0), Wloc = Wh*(1.0 - pow(abs(ux), mix(2.0, 26.0, smoothstep(0.0, 0.3, o2))));
  float dS = mix(1e3, max(abs(dqq) - Wloc, abs(dx) - Lh), step(1e-3, o1 + o2));      // metres outside the split
  // before it splits the skin thins there: a long translucent patch
  float uF = clamp((fp.x - xF)/max(LF, 1e-3), -1.0, 1.0);
  float thinning = mix(smoothstep(t0 - 0.3, t0, vK.y + vT.x - 1.0), smoothstep(s0 - 0.3, s0, vK.y), early);
  float thinP = thinning*(1.0 - smoothstep(-0.4, 0.5, max(abs(dqq) - 1.25*max(WF, 0.3*per)*(1.0 - uF*uF), abs(fp.x - xF) - LF)));
  // threads still strung across the gap where it is narrow (each parts when the gap is wider than its own length);
  // they bow and stir on the world's clock
  float inGap = step(dS, 0.0), across = clamp(dqq/max(Wloc, 1e-3), -1.0, 1.0);
  float xt = fp.x + 0.14*(1.0 - across*across)*sin(uTime*1.7 + fp.x*0.9 + cellI), tid = floor(xt/1.3), tho = wH2(vec2(tid + 7.0*cellI, vK.z*77.0 + 3.0));
  float thread = inGap*step(0.4, tho)*step(Wloc, 0.25 + 2.4*fract(tho*9.0))*(1.0 - smoothstep(0.012, 0.02 + px, abs(xt - (tid + 0.5)*1.3)))*min(0.05/max(px, 1e-3) + 0.15, 1.0);
  // shreds hang from the upper lip into the gap and from the lower lip down over the skin, pointed, unlike in length,
  // stirring on the world's clock (a wall film's cords lie level; a web's stand, so a web has none)
  float dUp = Wloc - dqq, dLow = -Wloc - dqq;
  float sway = 0.3*sin(uTime*1.3 + fp.x*0.7 + 2.0*cellI);
  float tg1 = max(wN(vec3((fp.x + sway*clamp(dUp/1.5, 0.0, 1.0))*1.1, cellI*3.7, vK.z*29.0)) - 0.42, 0.0)/0.58;
  float tg2 = max(wN(vec3((fp.x + sway*clamp(dLow/1.5, 0.0, 1.0))*1.3, cellI*5.1 + 9.0, vK.z*31.0)) - 0.45, 0.0)/0.55;
  float len1 = min(1.7*Wloc, 2.6)*tg1*sqrt(max(tg1, 0.0)), len2 = 1.1*tg2*sqrt(max(tg2, 0.0))*step(abs(dx), Lh)*step(1e-3, o1 + o2);
  float shred = inGap*(1.0 - web)*(1.0 - o2)*(1.0 - smoothstep(len1 - 0.04 - px, len1, dUp));      // (second part, P2: no shreds in a stripped cell)
  float flap = (1.0 - web)*step(0.0, dLow)*(1.0 - smoothstep(len2 - 0.04 - px, len2, dLow));
  // three cords in ten stay strung across a stripped cell for a while
  float hc = wH2(vec2(floor(q/per + 0.5) + 31.0, vK.z*63.0)), parted = 1.0 - smoothstep(0.3, 0.6, vT.x + 0.3*(hc - 0.5));      // (second part, P2: a strung cord stays whole, then goes whole: no stub is left pointing from a rib)
  float strung = cord*step(0.85, fract(hc*7.3))*parted*step(0.0, min(hole, dFree));      // (second part, P2; third part, P5: three cords in twenty; the others go with their cell, so no even row of stubs stands on a hoop)
  // no hard edge: the skin ends over 5 cm of its own surface (or one pixel's worth, from far)
  float cov = max(smoothstep(0.0, 0.05 + px, min(min(hole, dFree), dS)), max(max(thread, shred), strung*inGap));
  if (spread < 0.0 || vCut + 0.03*(n1 - 0.5) < 0.0 || cov < 0.02) discard;
  // the torn edge is a skin's edge: thick and curled back
  float rimD = min(hole, dS), rim = max((1.0 - smoothstep(0.0, 0.3 + 0.15*(1.0 - o2), rimD))*step(0.0, rimD), max(max(thread, shred), flap));
  lip = max(lip, rim);
  // set froth drawn thin: small cells with fine raised walls (sharp from near), larger plates over them
  vec4 c1 = wBubbles(vec3(fp*1.7, vK.z*9.0)), c2 = wBubbles(vec3(fp*0.42, vK.z*5.0 + 3.0));
  float nearK = 1.0 - smoothstep(14.0, 50.0, dist);
  float wall = max(smoothstep(0.78, 0.98, c1.x)*nearK, 0.35*smoothstep(0.86, 1.0, c2.x));
  float thick = clamp(max(max(lip, fil*(1.0 - 0.75*o2)), max(0.85*cord, 0.4*wall)), 0.0, 1.0)*(1.0 - 0.75*thinP*(1.0 - lip)), thin = 1.0 - thick;      // where it is about to split it is thinner than anywhere
  N.y -= 0.3*thinP; N /= max(length(N), 1e-4);                                      // and it sags there
  // the cords and the lip stand proud: the light finds their sides
  N += 0.22*c1.yzw*nearK + 0.12*c2.yzw + (0.3*(v1 - 0.5) + 0.2*(lip - 0.5))*vec3(0.0, 1.0, 0.0); N /= max(length(N), 1e-4);
  float fres = 1.0 - clamp(dot(N, -V), 0.0, 1.0); fres *= fres;
  // matter: the clear film is pale; cords are darker and denser; the fillet is milk; rose only a breath in the cords
  vec3 alb = uFroth*1.04*(0.74 + 0.26*thin + 0.22*max(fil, lip))*(1.0 - 0.2*cord*(1.0 - lip));
  // (1) LIT FROM THE EYE'S SIDE: pale, with a soft sheen where the sun's light glances off it
  vec3 col = wFrothLight(alb, N, V, 0.0)*(0.92 + 0.3*lip) + alb*uFill*0.5;
  vec3 hA = uSunA - V, hB = uSunB - V; hA /= max(length(hA), 1e-3); hB /= max(length(hB), 1e-3);
  float shA = clamp(dot(N, hA), 0.0, 1.0), shB = clamp(dot(N, hB), 0.0, 1.0);
  shA *= shA; shA *= shA; shA *= shA; shB *= shB; shB *= shB; shB *= shB;
  col += (wPale(uSunACol)*shA*step(0.0, dot(N, uSunA)) + wPale(uSunBCol)*shB*step(0.0, dot(N, uSunB)))*0.22*(0.4 + 0.6*thin);
  col += wSky(vec3(V.x, abs(V.y) + 0.05, V.z)/max(length(vec3(V.x, abs(V.y) + 0.05, V.z)), 1e-3))*0.12*fres*thin;
  col = mix(vec3(dot(col, vec3(0.3, 0.5, 0.2))), col, 0.6);                         // chalk: a dried skin on milk takes little colour of its own
  // (2) BETWEEN THE EYE AND A SUN it is a stained membrane: the sun's own colour comes through, most where the film
  // is thin, least through cord, fillet and lip (they stand dark in it); brighter the nearer the look is to the sun
  float bA = smoothstep(-0.35, 0.4, -dot(N, uSunA)), bB = smoothstep(-0.35, 0.4, -dot(N, uSunB));      // a membrane scatters: grazing light comes through too
  float ta = clamp(dot(V, uSunA), 0.0, 1.0), tb = clamp(dot(V, uSunB), 0.0, 1.0);
  float through = 0.16 + 0.84*thin*thin;
  vec3 glow = (uSunACol*bA*(0.5 + 1.1*ta*ta*ta) + uSunBCol*bB*(0.5 + 1.1*tb*tb*tb))*through*(0.8 + 0.2*n2);
  col += (wPale(uSunACol)*ta*ta + wPale(uSunBCol)*tb*tb)*alb*0.4*fres*lip;          // the curled lip catches the sun behind it
  float al = clamp(mix(0.46 + 0.25*fres, 1.0, thick), 0.0, 1.0)*(1.0 - 0.4*thinP*(1.0 - lip));
  // the rim takes the suns' light through it: rose on the side of the opening that faces the red sun, blue-white on
  // the side that faces the blue one (gr: the way from the opening into the skin, in the world)
  { vec3 gx = dFdx(vW), gy = dFdy(vW);
    vec3 gr = gx*(dFdx(rimD)/max(dot(gx, gx), 1e-8)) + gy*(dFdy(rimD)/max(dot(gy, gy), 1e-8)); gr /= max(length(gr), 1e-4);
    vec3 nA = uSunACol/max(max(uSunACol.r, uSunACol.g), max(uSunACol.b, 1e-3)), nB = uSunBCol/max(max(uSunBCol.r, uSunBCol.g), max(uSunBCol.b, 1e-3));
    float wa = clamp(0.5 - 0.5*dot(gr.xz, uAzA), 0.0, 1.0), wb = clamp(0.5 - 0.5*dot(gr.xz, uAzB), 0.0, 1.0);
    col += rim*alb*(mix(vec3(0.7), nA, 0.7)*uDisc.z*(0.2 + 0.8*wa*wa) + mix(vec3(0.85), nB, 0.7)*uDisc.w*(0.2 + 0.8*wb*wb))*0.42; }
  col = wKnee(col + glow/al);                                                       // what comes through is not thinned with the film
  al *= mix(smoothstep(0.0, 0.3, spread), 1.0, smoothstep(0.8, 1.0, vK.x));              // while it forms it is a veil that thickens from where it is fast
  al *= smoothstep(6.0, 10.0, dist);                                                // the climb keeps 8 m from every film and the dive 10 m where the layout allows (chooseRoute); this only guards the lens itself: nothing of a film is drawn within 6 m of it
#ifdef W_MIRROR
  gl_FragColor = wMirrorOut(col*al*cov);
#else
  gl_FragColor = vec4(wFog(col, vW)*al*cov, al*cov);
#endif
}`;
function makeFilmMesh(films, seg, material) {
  const pos = [], idx = [];
  for (let i = 0; i <= seg; i++) for (let j = 0; j <= seg; j++) pos.push(i / seg, j / seg, 0);
  for (let i = 0; i < seg; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
  films = films.slice().sort((p, q) => (q.bay + (q.web ? 0 : 0.5)) - (p.bay + (p.web ? 0 : 0.5)));      // far bays first (we fly from bay 0 on): the blend needs no other sorting
  const n = films.length, f3 = () => new Float32Array(n * 3), f4 = () => new Float32Array(n * 4);
  const A1 = f3(), B1 = f3(), A2 = f3(), B2 = f3(), S1 = f4(), S2 = f4(), F = f4(), M = f4(), H = new Float32Array(n * 9);
  films.forEach((f, i) => {
    A1.set(f.a.A, i * 3); B1.set(f.a.B, i * 3); A2.set(f.b.A, i * 3); B2.set(f.b.B, i * 3);
    S1.set([f.a.R, f.a.t0, f.a.t1, f.a.p], i * 4); S2.set([f.b.R, f.b.t0, f.b.t1, f.b.p], i * 4);
    F.set([f.tn0, f.tn1, f.birth, f.dur], i * 4); M.set([f.bay, f.b.sagW + (f.web ? 2 : 0), f.a.k + 10 * (f.a.j || 0), f.seed], i * 4);
    H.set(f.holes, i * 9);
  });
  const HB = new THREE.InstancedInterleavedBuffer(H, 9);
  for (let k = 0; k < 3; k++) g.setAttribute('aH' + k, new THREE.InterleavedBufferAttribute(HB, 3, k * 3));
  const I = (arr, k) => new THREE.InstancedBufferAttribute(arr, k);
  g.setAttribute('aA1', I(A1, 3)); g.setAttribute('aB1', I(B1, 3)); g.setAttribute('aA2', I(A2, 3)); g.setAttribute('aB2', I(B2, 3));
  g.setAttribute('aSh1', I(S1, 4)); g.setAttribute('aSh2', I(S2, 4)); g.setAttribute('aF', I(F, 4)); g.setAttribute('aM', I(M, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, -300), 900);
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.renderOrder = 2; return m;
}

// froth puffs: lumps of boiling froth as cut-out sprites that write depth (so the mass is solid and needs no sorting).
// Two vertex shaders, one fragment shader: a cluster on every growing rib tip, and the masses (tower, running front).
const PUFF_FS = /* glsl */`
${W_COMMON}
varying vec3 vW, vC; varying vec2 vQ; varying vec2 vS;      // vC: the lump's middle; vS: seed, size (m)
varying vec3 vM;                                         // outward normal of the mass this lump belongs to (zero for a lone one)
varying float vL;                                        // light of the portal on the rim of froth round it
#ifdef W_DEPTH
varying vec4 vZW;                                        // clip z, w of the lump's centre and of its nearest point: each lump is drawn as a ball
#endif
void main(){
  vec2 q = clamp(vQ, -1.0, 1.0); float r2 = dot(q, q), r = sqrt(max(r2, 0.0));
  // a billow: a round body with a lobed outline that boils slowly (three, five and nine lobes, the lump's own phases)
  float ang = atan(q.y, q.x + 1e-5), sd = vS.x*6.2832;
  float lob = 0.8 + 0.1*sin(ang*3.0 + sd*7.0 + uTime*0.31) + 0.06*sin(ang*5.0 - sd*13.0 - uTime*0.47) + 0.035*sin(ang*9.0 + sd*29.0);
  float e = lob - r, px = max(fwidth(r), 1e-4);
#ifdef W_DEPTH
  // a mass is solid: its edge is crisp, dithered over a pixel and a half only (no blending, so no sorting)
  float dth = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (e < px*1.5*(dth - 0.5)) discard;
#else
  float edge = smoothstep(0.0, 0.22, e);
  if (edge < 0.012) discard;
#endif
  float h = sqrt(clamp(1.0 - r2/max(lob*lob, 1e-3), 0.0, 1.0));      // the billow's roundness: 1 in its middle, 0 at its edge
  float t = uTime*0.25;
  vec2 b = vec2(wN(vec3(q*2.6 + sd, t)), wN(vec3(q*2.6 - sd, t + 7.0))) - 0.5;      // smaller billows on it
  float fine = wN(vec3(q*clamp(vS.y, 0.5, 40.0)*0.8 + sd, t*0.7));
  vec3 nv = vec3(q/max(lob, 0.3) + 0.55*b*h, h + 0.15);
  vec3 f = cameraPosition - vC; f /= max(length(f), 1e-3);                          // the card's own frame: toward the eye's place, the world's up
  vec3 rt = vec3(f.z, 0.0, -f.x); rt /= max(length(rt), 1e-3); vec3 up = cross(f, rt);
  vec3 N = rt*nv.x + up*nv.y + f*nv.z; N /= max(length(N), 1e-4);
  float body = step(0.01, dot(vM, vM));
  N = N + 0.5*vM; N /= max(length(N), 1e-4);                                        // each billow has its own lit side; the mass turns them a little
  vec3 Vv = vW - cameraPosition; vec3 V = Vv/max(length(Vv), 1e-3);
  float cleft = 1.0 - smoothstep(0.0, 0.6, h), dimple = 1.0 - smoothstep(0.3, 0.5, fine);
  vec3 alb = mix(uFroth*0.94, uRose*0.72, clamp(0.3*cleft + 0.12*dimple, 0.0, 1.0));   // white; rose only down in the clefts
  // wet froth scatters: each sun's light wraps round a billow from its own side, the whole sky fills the rest
  float wa = clamp(dot(N, uSunA)*0.5 + 0.5, 0.0, 1.0), wb = clamp(dot(N, uSunB)*0.5 + 0.5, 0.0, 1.0);
  vec3 sA = mix(uSunACol, wPale(uSunACol), 0.45), sB = mix(uSunBCol, wPale(uSunBCol), 0.45);      // fresh froth takes more of a sun's own colour on the face it strikes than set froth does
  vec3 col = wFrothLight(alb, N, V, 0.0) + alb*(uFill*2.3 + uAmbHi*0.6 + vL*vec3(0.3, 0.36, 0.5) + 0.46*(sA*wa*wa*wa + sB*wb*wb*wb));
  col *= mix(0.5 - 0.22*body, 1.0, smoothstep(0.0, 0.7, h))*(0.95 + 0.1*fine);     // shadowed hollows between the billows, deep between the lobes of a mass
  // a mass has two flanks: each sun lays a hard light of its own colour on the one that faces it (the mass's own
  // outward normal, so the edge of the light is the mass's, not each billow's); what faces neither is left dark
  float mA = smoothstep(0.1, 0.55, dot(vM, uSunA))*body, mB = smoothstep(0.1, 0.55, dot(vM, uSunB))*body;
  col += alb*(uSunACol*mA*(0.35 + 0.65*wa) + uSunBCol*mB*(0.35 + 0.65*wb))*0.55;
  col *= 1.0 - 0.3*body*(1.0 - mA)*(1.0 - mB);
  // the mass's outline against the sky: lumps on its flank take the sun that stands behind them on their rims
  float flank = 1.0 - body*abs(dot(vM, V)); flank *= flank;
  float rim = 1.0 - h; rim *= rim;
  float ta = clamp(dot(V, uSunA), 0.0, 1.0), tb = clamp(dot(V, uSunB), 0.0, 1.0);
  col += alb*flank*rim*(sA*ta*ta + sB*tb*tb)*0.8;
  // the light under the glass's skin shows in the clefts near the foot: warm and dim (lit matter, never a lamp)
  col += mix(uRose, uFroth, 0.5)*0.1*cleft*exp(-min(max(vW.y, 0.0)/70.0, 30.0))*(1.0 - clamp(vL, 0.0, 1.0));
  col = wKnee(col);
#ifdef W_DEPTH
  gl_FragDepth = clamp(0.5*mix(vZW.x, vZW.z, h)/max(mix(vZW.y, vZW.w, h), 1e-4) + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(wFog(col, vW), 1.0);
#else
  float al = edge*0.94;
  gl_FragColor = vec4(wFog(col, vW)*al, al);
#endif
}`;
// a lump's card faces the eye's PLACE with the world's up: its outline does not turn when the lens rolls
const PUFF_BILL = /* glsl */`
vec3 wBill(vec3 C, float size, vec2 corner){
  vec3 f = cameraPosition - C; f /= max(length(f), 1e-3);
  vec3 rt = vec3(f.z, 0.0, -f.x); rt /= max(length(rt), 1e-3);
  return C + (rt*corner.x + cross(f, rt)*corner.y)*size;
}`;
const TIP_VS = /* glsl */`
${W_COMMON}
${W_RIB}
${PUFF_BILL}
attribute vec3 aA, aB, aOff; attribute vec4 aSh, aGrow, aMisc;       // the rib's own attributes + aOff: offset (unit), aMisc.z seed
varying vec3 vW, vC; varying vec2 vQ; varying vec2 vS; varying vec3 vM; varying float vL;
void main(){
  vM = vec3(0.0); vL = 0.0;
  float graw = clamp((uU - aGrow.z)/max(aGrow.w, 1e-3), 0.0, 1.0), g = graw*graw*(3.0 - 2.0*graw), seed = fract(aMisc.z), kind = floor(aMisc.z + 0.001);
  // froth boils on a rib's end while it grows, and again on the end that is being lost in the fall (as in the rib shader)
  float ord = floor(aMisc.y/10.0 + 0.001), sagW = aMisc.y - 10.0*ord;
  float sag = clamp(uSag*W_SAG_RUN - W_SAG_LAG*(1.0 - aMisc.x/12.0), 0.0, 1.0)*sagW;
  float lim = kind < 0.5 ? 1.0 - 0.36*sag : 1.0 - clamp(sag*4.4 - (3.0 - ord), 0.0, 1.0);
  float dying = kind < 1.5 ? smoothstep(0.0, 0.05, 1.0 - lim)*(1.0 - smoothstep(0.9, 1.0, 1.0 - lim)) : 0.0;
  // (fourth part, D2 and D3) THE FROTH ON A RIB'S END IS LIVE'S: it sits at the end, on a growing end and on a stump
  // alike, 2.0 to 3.6 radii to a lump, spread 1.6 radii round the end (the second part's small lumps strung down a
  // stump and the third part's small knot are gone). The guard's rule F1 stands in what live did not have: A GROWING
  // END IS INSIDE FROTH until the rib has met its mate or reached its landing (its own growth complete: the rib's own
  // birth and time of growing), and only then the froth thins away, over three tenths of that time again; and round
  // a growing end the lumps are drawn 2.9 radii nearer, so the swollen end (1.8 radii) does not cut them. Every lump
  // is at least 2.0 radii in radius and its middle at most 1.6 radii from the end: the end is inside every one
  float tt = min(g, lim);
  float after = clamp((uU - aGrow.z - aGrow.w)/max(0.3*aGrow.w, 1e-3), 0.0, 1.0); after = after*after*(3.0 - 2.0*after);
  vec3 C = wRib(aA, aB, aSh, aMisc.w, tt, sag);
  if (kind > 0.5 && kind < 1.5) C.y -= clamp(sag*4.4 - (3.0 - ord), 0.0, 1.0)*0.45*length(aB - aA)*tt*tt;
  float r = mix(aGrow.x, aGrow.y, tt);
  float live = max(smoothstep(0.0, 0.03, graw)*(1.0 - after), 0.8*dying)*smoothstep(12.0, 30.0, length(cameraPosition - C));      // none of it at the lens: gone at 12 m (twice the rib clearance), whole from 30 m (as the films)
  vec3 wob = vec3(sin(uTime*1.3 + seed*40.0), sin(uTime*1.7 + seed*23.0), sin(uTime*1.1 + seed*61.0));
  C += (aOff + 0.25*wob)*r*1.6;
  float size = r*(2.0 + 1.6*fract(seed*7.3))*live;
  vec3 wp = wBill(C, size, position.xy);
  vW = wp; vC = C; vQ = position.xy; vS = vec2(seed, size);
  vec4 mv = viewMatrix*vec4(wp, 1.0), cp = projectionMatrix*mv, cb = projectionMatrix*(mv + vec4(0.0, 0.0, r*mix(2.9, 1.3, dying), 0.0));
  gl_Position = vec4(cp.xy, cb.z*cp.w/max(cb.w, 1e-4), cp.w);      // where it is; its depth as if 1.3 radii nearer (2.9 round a growing end: the swollen end and the lump's own place inside it), so the rib's own end does not cut it
}`;
// the masses: aP = four seeds, aK = kind: 0 the tower's column, 1 the running front, 2 froth raining off the tower,
// 3 pieces that drop from the crowns in the fall, 4 the rim of froth round the portal, 5 the skirt of foam round the
// tower's foot. uTower = (height now, slough 0..1, strength, the column's radius), uFront = (z, strength,
// half width, height)
const MASS_VS = /* glsl */`
${W_COMMON}
${W_RIB}
${PUFF_BILL}
uniform vec3 uHornA, uHornB; uniform vec4 uHornSh, uHornG;      // the first arch's rib (polish 1, Q4): its ends, its shape; uHornG: steepness, birth, how long it grows, its radius at the foot
uniform vec4 uTower; uniform vec4 uFront; uniform vec4 uSeat;      // uSeat: where the portal sits, and how far the collar round it has grown
attribute vec4 aP; attribute float aK;
varying vec3 vW, vC; varying vec2 vQ; varying vec2 vS; varying vec3 vM; varying vec4 vZW; varying float vL;
void main(){
  vec3 C; float size; vM = vec3(0.0); vL = 0.0;
  if (aK < 0.5) {
    // the tower: froth streams up a straight column 45 m in radius, ragged at the top, with a core inside so that it is
    // a body from every side; then it sloughs off, from the top down and from the mirror plane outward, into the sea
    float yf = fract(aP.y + uU*2.2), th = aP.x*6.2832 + 0.6*sin(uTime*0.5 + aP.z*20.0), core = step(aP.z, 0.3);
    float head = smoothstep(0.7, 0.95, yf);
    float rad = 41.0 + 9.0*fract(aP.z*5.3) + 5.0*head + 18.0*(1.0 - smoothstep(0.0, 0.08, yf));
    rad += 6.0*sin(th*3.0 + yf*9.0 + uU*30.0);                                                        // billows
    rad *= 1.0 + 0.26*smoothstep(0.3, 0.5, yf)*(1.0 - smoothstep(0.52, 0.7, yf))*max(dot(vec2(cos(th), sin(th)), uAzA), 0.0);      // one shoulder, a third of the way up, on the side the first sun (A) warms: the froth rises fastest there; the outline is not a cone
    rad *= mix(1.0, 0.45, core)*(1.0 - 0.6*smoothstep(0.55, 1.0, yf)*smoothstep(0.55, 1.0, yf));       // a round head at every height it has reached, torn and uneven
    C = vec3(cos(th)*rad, yf*uTower.x*(0.9 + 0.1*aP.w), sin(th)*rad*0.9);
    vM = vec3(cos(th), 0.25, sin(th)); vM /= max(length(vM), 1e-3);
    // the head boils unevenly: it stands higher on one bearing than another and the high side wanders as it climbs
    C.y *= 1.0 - 0.2*smoothstep(0.45, 1.0, yf)*(0.5 + 0.5*sin(th*2.0 + 1.7 + 26.0*uU))*(0.6 + 0.4*sin(th*5.0 - 17.0*uU));
    // what lets go slumps from the head down and spreads outward all round, as ONE mass: no bearing goes before another
    float rel = clamp((uTower.y*1.6 - 0.6*(1.0 - yf) - 0.1*aP.w)/0.4, 0.0, 1.0);
    C.x += cos(th)*rel*rel*(14.0 + 26.0*aP.w); C.z += sin(th)*rel*rel*(12.0 + 22.0*aP.w); C.y -= rel*rel*(80.0 + 140.0*aP.w)*yf;
    size = (6.5 + 9.0*aP.w)*mix(1.0, 1.7, core)*smoothstep(0.0, 0.03, yf)*(1.0 - smoothstep(0.96, 1.0, yf))*uTower.z*(1.0 - smoothstep(0.05, 0.6, rel))*smoothstep(-6.0, 4.0, C.y);
  } else if (aK < 1.5) {
    // the front: a bank of boiling froth across the axis, running ahead of the lens; the piers rise out of it
    float bob = sin(uTime*0.9 + aP.w*30.0);
    C = vec3((aP.x - 0.5)*2.0*uFront.z, aP.y*aP.y*uFront.w + 2.0*bob, uFront.x + (aP.z - 0.5)*80.0);
    C.y *= 1.0 - 0.6*abs(aP.x - 0.5)*2.0;
    C.y = C.y*uFront.y - 9.0*(1.0 - uFront.y);                                      // the bank wells up out of the sea as one heap (nothing hangs in the air)
    vM = vec3((aP.x - 0.5)*1.2, 0.55 + 0.4*aP.y, 0.7); vM /= max(length(vM), 1e-3);
    size = (5.0 + 8.0*aP.w)*smoothstep(0.0, 0.3, uFront.y)*(0.85 + 0.15*bob)*smoothstep(-7.0, 0.0, C.y);
  } else if (aK < 2.5) {
    // froth rain: lumps thrown from the column and its head fall in long arcs into the sea, for as long as the tower stands
    float T = 5.5 + 3.5*aP.z, ph = fract(uTime/T + aP.y), tt = ph*T, th = aP.x*6.2832;
    float v = 7.0 + 17.0*aP.w, h0 = uTower.x*(0.45 + 0.5*fract(aP.z*7.3));
    C = vec3(cos(th), 0.0, sin(th)*0.9)*(46.0 + v*tt);
    C.y = h0 + (6.0 + 10.0*aP.w)*tt - 7.0*tt*tt;
    size = (0.5 + 1.5*aP.w*aP.w)*uTower.z*smoothstep(0.0, 0.06, ph)*(1.0 - smoothstep(0.86, 1.0, ph))*smoothstep(-1.0, 2.5, C.y)*smoothstep(20.0, 110.0, uTower.x);
  } else if (aK > 5.5) {
    // (polish 1, Q4) PIECES STILL SLIDE FROM THE TWO FIRST HORNS: lumps of froth let go at the growing tip of the first
    // arch's two ribs and slide down their outer flanks into the tower's raft, each on the world's clock from its own
    // dealt phase (6 to 12 s a slide), for as long as the two horns grow and by nothing else (the rib's own growth, the
    // ribs' own function: when the arch has closed there is no end left to let go from); each ends by its own slide,
    // in the sea (aP: side, phase, pace, size)
    float sgn = aP.x < 0.5 ? 1.0 : -1.0, s = fract(uTime/(6.0 + 6.0*aP.z) + aP.y), g = wGrown(uHornG.y, uHornG.z), tn = g*(1.0 - s);
    vec3 Q = wRib(uHornA, uHornB, uHornSh, uHornG.x, tn, 0.0); float rr = mix(uHornG.w, 0.31*uHornG.w, tn);
    C = vec3(sgn*(Q.x - 1.15*rr - 0.6), Q.y, Q.z + (fract(aP.x*7.3) - 0.5)*1.6*rr);
    float act = smoothstep(0.08, 0.3, g)*(1.0 - smoothstep(0.8, 1.0, g));      // (third part, U4: the tower's fall is not read)
    size = (1.3 + 2.4*aP.w)*act*smoothstep(0.0, 0.08, s)*(1.0 - smoothstep(0.9, 1.0, s))*smoothstep(-1.0, 2.0, C.y);
  } else if (aK > 4.5) {
    // the skirt: where the froth meets the sea it boils out in a ragged ring of foam and spray, widest while the tower
    // stands, drawn back in as it falls away (aP: bearing, phase, how far out, size)
    float th = aP.x*6.2832, out2 = aP.z*aP.z, hop = abs(sin(uTime*(0.7 + 0.8*aP.w) + aP.y*40.0));
    float rad = uTower.w + 4.0 + 46.0*out2*(1.0 - 0.6*uTower.y);
    C = vec3(cos(th)*rad, (1.0 + 7.0*(1.0 - out2))*hop*(0.4 + 0.6*aP.w) - 0.5, sin(th)*rad*0.9);
    vM = vec3(cos(th)*0.5, 0.85, sin(th)*0.5);
    size = (2.0 + 4.5*aP.w)*(1.0 - 0.5*out2)*uTower.z*(1.0 - smoothstep(0.55, 0.95, uTower.y));
  } else if (aK > 3.5) {
    // the collar: a ragged mass of froth that fills the last arch round the portal (aP: offset from the seat, size)
    C = uSeat.xyz + aP.xyz + vec3(0.0, 0.25*sin(uTime*0.9 + aP.x*3.0 + aP.y), 0.0);
    vM = vec3(aP.xy*0.05, 1.0); vM /= max(length(vM), 1e-3); vL = exp(-max(length(aP.xy) - 8.0, 0.0)/9.0);
    size = aP.w*uSeat.w*(0.94 + 0.06*sin(uTime*1.2083 + aP.y*0.7));
  } else {
    // the fall: pieces let go of the crowns and galleries and drop into the floor. One per 30 m cell of the floor; the
    // sea shader draws the crown each one raises from the same cell numbers (wH2 of the cell)
    vec2 cell = aP.xy; float T = 5.0 + 4.0*wH2(cell + 9.2), ph = fract(uTime/T + wH2(cell + 2.9));
    float act = smoothstep(0.0, 0.06, uSag - 0.5*wH2(cell + 6.6));
    float x = (cell.x + 0.5)*30.0 + (wH2(cell + 1.3) - 0.5)*10.0, z = -(cell.y + 0.5)*30.0 + (wH2(cell + 5.1) - 0.5)*10.0;
    x += sign(x)*8.0;                                         // never nearer than 18 m to the mirror plane, where the lens goes
    float H0 = mix(125.0, 62.0, clamp(cell.y/20.0, 0.0, 1.0))*(1.0 - 0.5*clamp(abs(x)/120.0, 0.0, 1.0));
    float k = clamp(ph/0.62, 0.0, 1.0);
    C = vec3(x + 1.5*sin(uTime*0.8 + aP.z*20.0), H0*(1.0 - k*k), z);
    vec3 toC = C - cameraPosition;
    size = (2.2 + 3.6*aP.w)*act*step(ph, 0.62)*smoothstep(0.0, 0.05, ph)*smoothstep(-2.0, 2.0, C.y)*smoothstep(16.0, 34.0, length(toC));      // a piece is thinned from 34 m and gone at 16 m from the eye (twice the 8 m it keeps from the mirror plane, and that plus the 18 m of its nearest fall line)
  }
  vec3 wp = wBill(C, size, position.xy);
  vec4 vc = viewMatrix*vec4(C, 1.0), c0 = projectionMatrix*vc, c1 = projectionMatrix*(vc + vec4(0.0, 0.0, 0.75*size, 0.0));
  vZW = vec4(c0.z, c0.w, c1.z, c1.w);
  vW = wp; vC = C; vQ = position.xy; vS = vec2(aP.w, size);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
function quadGeometry() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, -300), 900); return g;
}
// list: [{ rib, seed, off: [x, y, z] }] (the draws are made by buildHero, in the first build's order)
function makeTipPuffs(list, material) {
  const g = ribAttributes(quadGeometry(), list.map((e) => ({ ...e.rib, seed: e.seed }))), n = list.length, off = new Float32Array(n * 3);
  list.forEach((e, i) => off.set(e.off, i * 3));
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3));
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.renderOrder = 1; return m;
}
// groups: [{ kind, n, rng } | { kind: 3, cells, rng } | { kind: 4, lumps }], filled in this order; each group draws from
// the fork it is given
function makeMassPuffs(groups, material) {
  const n = groups.reduce((a, gr) => a + (gr.cells ? gr.cells.length : gr.lumps ? gr.lumps.length / 4 : gr.n), 0);
  const g = quadGeometry(), P = new Float32Array(n * 4), K = new Float32Array(n); let i = 0;
  for (const gr of groups) {
    const r = gr.rng;
    if (gr.lumps) for (let j = 0; j < gr.lumps.length; j += 4, i++) { P.set(gr.lumps.slice(j, j + 4), i * 4); K[i] = gr.kind; }
    else if (gr.cells) for (const c of gr.cells) { P.set([c[0], c[1], r(), r()], i * 4); K[i++] = gr.kind; }
    else for (let j = 0; j < gr.n; j++) { P.set([r(), r(), r(), r()], i * 4); K[i++] = gr.kind; }
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(K, 1)); g.instanceCount = n;
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
}
// the rim of froth round the portal: low and torn, wider than it is tall, carried by the last arch's own ribs. A ragged
// ring a few metres thick hugs the portal, and from it a belt of froth runs out sideways to both ribs at the seat's
// height (xa(y): the arch's half width at height y). Nothing stands under it and nothing over it.
// r: its own stream (five draws for every try); rIn: the clear radius; seat: the portal's centre
function collarLumps(tries, r, rIn, seat, xa) {
  const out = [], reach = rIn + 6;
  for (let i = 0; i < tries; i++) {
    const y = seat.y + (r() * 2 - 1) * reach, x = (r() * 2 - 1) * xa(y), keep = r(), size = mix(1.1, 2.9, Math.pow(r(), 1.6)), dz = (r() - 0.5) * 3;
    const d = Math.hypot(x, y - seat.y) - rIn - 0.7 * size;
    const belt = Math.abs(y - seat.y) < 2.2 + 1.6 * Math.sin(x * 0.45) * Math.sin(x * 0.17 + 1.3) + 1.2 * (Math.abs(x) / Math.max(xa(y), 1));      // the belt: torn, a little thicker where it holds to the ribs
    const ang = Math.atan2(y - seat.y, x), torn = 0.25 + 0.75 * sat(0.5 + 0.8 * Math.sin(3 * ang + 1.7) * Math.sin(5 * ang + 0.4));      // the ring is torn: thick here, bare there
    if (d > 0 && (keep < Math.exp(-d / 1.1) * torn || (belt && keep < 0.8))) out.push(x, y - seat.y, dz, size);
  }
  return out;
}

// THE DOME before the burst, and the froth under its skin. uSolid: radius, height, how far its seams have opened
// (0..1), how far the froth has carried the petals up (0..1). The skin opens along SEAMS that run from the crown down:
// one on the mirror plane toward us, one on it behind (the dome splits along the axis the hall then grows on: the
// first sign of the mirror plane; these two are no wider and no brighter than the others), and two pairs between (uSeam: their bearings from the mirror
// plane, the same on both sides). The gap is widest at the crown, soft-edged; froth wells through it; the petals
// between the seams lift, lean out and are carried up on the froth until nothing is left of them.
const DOME_LIB = /* glsl */`
uniform vec4 uSolid; uniform vec2 uSeam;
// x: how far (in the unit dome's arc) this point lies from the nearest seam's gap edge (< 0 inside the gap); y: nearness to a seam 0..1
// (polish 1, second part, R4) A RULE OF THE THING: the skin never opens in two like openings side by side. FIVE SEAMS
// run down from the crown at unlike bearings, no one the mirror of another (all five from the two bearings live deals:
// one near the mirror plane toward the approach, off it by up to 18 degrees; one on the one hand at uSeam.x; one on the
// other hand at uSeam.y - 0.55; two behind, at uSeam.y + 0.25 and at -(uSeam.y + 0.55)). Each is an IRREGULAR LINE: its
// bearing wanders on its way down (up to 17 degrees, 20 m at the foot), and each opens later and less wide than the
// one before it. wSeamOne: the arc from the bearing a to seam k at the height y
float wSeamOne(float a, float b, float y, float k){
  float w = b + (0.6*(wN(vec3(y*4.0, k*7.3, 1.0)) - 0.5) + 0.05*(wN(vec3(y*13.0, k*3.1, 5.0)) - 0.5))*(1.0 - y*y);      // (fourth part, D1: the fine zigzag is a third of the second part's: a seam is a slow wandering line, not a crack)
  return abs(mod(a - w + 3.14159, 6.28318) - 3.14159);
}
vec2 wSeam(vec3 o){
  float rxz = length(o.xz), a = atan(o.x, o.z + 1e-5), y = clamp(o.y, 0.0, 1.0);
  float soft = 0.75 + 0.5*wN(o*3.1 + 4.0);                                         // the gap's edge wanders softly
  float wide = (0.015 + 0.42*y*sqrt(y))*soft, d = 1e3, dn = 1e3, dd, z1;            // open from the crown down
  dd = wSeamOne(a, (uSeam.x - 1.1)*1.2, y, 0.0)*rxz; dn = min(dn, dd); d = min(d, dd - uSolid.z*wide);
  dd = wSeamOne(a, uSeam.x, y, 1.0)*rxz; z1 = clamp(uSolid.z*1.35 - 0.35, 0.0, 1.0); dn = min(dn, dd); d = min(d, dd - z1*wide*0.8);
  dd = wSeamOne(a, 0.55 - uSeam.y, y, 2.0)*rxz; z1 = clamp(uSolid.z*1.15 - 0.15, 0.0, 1.0); dn = min(dn, dd); d = min(d, dd - z1*wide*0.92);
  dd = wSeamOne(a, uSeam.y + 0.25, y, 3.0)*rxz; z1 = clamp(uSolid.z*1.5 - 0.5, 0.0, 1.0); dn = min(dn, dd); d = min(d, dd - z1*wide*0.7);
  dd = wSeamOne(a, -0.55 - uSeam.y, y, 4.0)*rxz; z1 = clamp(uSolid.z*1.25 - 0.25, 0.0, 1.0); dn = min(dn, dd); d = min(d, dd - z1*wide*0.86);
  // (fourth part, D1) two CREASES THAT NEVER OPEN lie in the two widest petals (half way between the first seam and
  // the third, and half way between the two seams behind): seven lines from the crown divide the skin into petals
  dn = min(dn, wSeamOne(a, 0.5*((uSeam.x - 1.1)*1.2 + 0.55 - uSeam.y), y, 5.0)*rxz); dn = min(dn, wSeamOne(a, 2.99159, y, 6.0)*rxz);
  return vec2(d - uSolid.w*0.95, 1.0 - smoothstep(0.0, 0.16, dn));                  // the lift takes the rest
}`;
const SOLID_VS = /* glsl */`
${W_COMMON}
${DOME_LIB}
uniform float uCore;      // 0: the skin; 1: the froth under it
varying vec3 vW, vN, vO;
void main(){
  vec3 o = position; float y = clamp(o.y, 0.0, 1.0);
  vec3 sc = vec3(uSolid.x, uSolid.y, uSolid.x);
  vec3 n = normal/vec3(max(uSolid.x, 1e-3), max(uSolid.y, 1e-3), max(uSolid.x, 1e-3));
  vec3 p;
  if (uCore > 0.5) {
    // the froth: a billowed body just under the skin that wells out along the seams as they open
    vec2 sm = wSeam(o);
    float bil = wN(o*2.2 + vec3(0.0, uTime*0.12, 0.0)) + 0.5*wN(o*5.3 - vec3(uTime*0.1, 0.0, 0.0));
    p = o*sc*(0.9 + 0.07*(bil - 0.75) + uSolid.z*(0.05 + 0.13*sm.y) + 0.1*uSolid.w);
  } else {
    // the skin (second part, R4): its pieces FOLD BACK AND SINK. As the froth comes up through it each piece leans out
    // from the crown, lies down outward on the glass and goes under; none is carried up, none stands as a point
    vec2 xz = o.xz/max(length(o.xz), 1e-3); float fold = clamp(uSolid.w*1.5, 0.0, 1.0); fold = fold*fold*(3.0 - 2.0*fold);
    p = o*sc + vec3(xz.x, 0.0, xz.y)*uSolid.x*y*(0.1*uSolid.z + 0.7*fold);
    // (fourth part, D1) as the pieces part their tips at the crown are carried up a little by the froth (live lifted
    // the pieces whole): up to a quarter of the dome's height at a third of the fold, and down again with the fold;
    // five unlike tips for a moment, none left standing
    float tipUp = uSolid.w*1.5; tipUp = clamp(tipUp*3.0, 0.0, 1.0)*clamp(1.0 - (tipUp - 0.33)/0.5, 0.0, 1.0);
    p.y = p.y*(1.0 - 0.95*fold) - 3.0*fold*fold + uSolid.y*0.25*y*y*tipUp*(0.6 + 0.8*wN(vec3(xz*2.3, 7.0)));
  }
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vW = wp.xyz; vN = mat3(modelMatrix)*n; vO = o;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
// the dome: the glass sea bulging before it bursts. A mirror-bright bubble: the sky, both suns and the sea it stands on
// are in it; a faint light breathes under its skin
const DOME_FS = /* glsl */`
${W_COMMON}
${W_SKY}
${DOME_LIB}
varying vec3 vW, vN, vO;
void main(){
  vec2 sm = wSeam(vO);
  if (sm.x < 0.0) discard;
  vec3 Vv = vW - cameraPosition; vec3 V = Vv/max(length(Vv), 1e-3); vec3 N = vN/max(length(vN), 1e-4);
  N += 0.02*(vec3(wN(vW*0.05 + uTime*0.05), 0.5, wN(vW*0.05 + 7.0 - uTime*0.04)) - 0.5); N /= max(length(N), 1e-4);      // the skin is alive: the mirror wavers
  float f = 1.0 - clamp(dot(N, -V), 0.0, 1.0);
  vec3 R = reflect(V, N);
  vec3 Ru = vec3(R.x, abs(R.y) + 0.002, R.z); Ru /= max(length(Ru), 1e-4);
  // below the horizon the bubble mirrors the sea: dark, with the sky's glare lying on it
  vec3 seaC = vec3(0.02, 0.008, 0.012) + wSky(Ru)*0.4;
  vec3 env = mix(seaC, wSky(Ru), smoothstep(-0.02, 0.02, R.y));
  float angA = length(Ru - uSunA)*57.3, angB = length(Ru - uSunB)*57.3;
  env += uRadA.rgb*uDisc.z*(uRadA.w*(1.0 - smoothstep(uDisc.x*1.6, uDisc.x*2.2, angA)) + 1.1*exp(-angA*0.16) + 0.35*exp(-angA*0.04));
  env += uRadB.rgb*uDisc.w*(uRadB.w*(1.0 - smoothstep(uDisc.y*2.0, uDisc.y*3.5, angB)) + 1.1*exp(-angB*0.2) + 0.35*exp(-angB*0.05));
  vec3 col = env*(1.0 + 0.8*f*f) + (uAmbHi + uFill)*0.7*f*f;
  float mott = wN(vW*0.06 + vec3(0.0, uTime*0.04, 0.0)), breath = 0.8 + 0.2*sin(uTime*1.2083);      // the 5.2 s rhythm
  col += mix(uFroth, uRose, 0.3)*breath*(0.14 + 0.14*mott)*(1.0 - 0.4*f);                             // the light under the skin
  vec3 hA = uSunA - V; hA /= max(length(hA), 1e-3); vec3 hB = uSunB - V; hB /= max(length(hB), 1e-3);
  float ha = clamp(dot(N, hA), 0.0, 1.0), hb = clamp(dot(N, hB), 0.0, 1.0);
  col += uSunACol*uDisc.z*0.5*pow(ha, 12.0) + uSunBCol*uDisc.w*0.5*pow(hb, 12.0);                    // each sun lies on it as a broad sheen
  // (fourth part, D1) THE SEAMS ARE THERE TO READ FROM THE FIRST MOMENT, before anything opens or lifts: along each of
  // the five seams a dark crease (0.02 of the dome's radius to each side) between two pale raised lips of set froth
  // (out to 0.07), from the crown to the foot, dividing the skin into petals. Where a seam has opened the crease lies
  // in the gap and live's own lip (below) takes its place
  { float crease = smoothstep(0.9, 0.99, sm.y), lipS = smoothstep(0.55, 0.9, sm.y)*(1.0 - crease);
    vec3 lipS3 = wFrothLight(uFroth*0.95, N, V, 1.2)*(0.6 + 0.6*lipS) + uFroth*uFill;
    col = mix(col, wKnee(lipS3), 0.8*lipS);
    col *= 1.0 - 0.6*crease; }
  // the torn edge has thickness: a lip of set froth, shaded on the cut and lit on its rim (0.05 of the dome's radius wide)
  float lipT = clamp(sm.x/0.05, 0.0, 1.0), lip = step(1e-4, uSolid.z)*(1.0 - smoothstep(0.6, 1.0, lipT));
  vec3 lipC = wFrothLight(uFroth*0.95, N, V, 1.2)*(0.5 + 0.9*smoothstep(0.0, 0.45, lipT)) + uFroth*uFill;
  col = mix(col, wKnee(lipC), lip);
  // (third part, P3) A BUBBLE GIVING WAY, not a shell breaking: beside an opening seam the skin thins and goes glassy
  // (its own light under the skin shows through) and the froth wells out through the seam and OVER the skin in
  // billows, further as the seam opens: no clean broken edge is left
  { float wB = (0.012 + 0.07*uSolid.z)*(0.45 + 1.1*wN(vO*6.0 + vec3(0.0, uTime*0.07, 0.0))), open = smoothstep(0.0, 0.08, uSolid.z);      // (fourth part, D1: a narrow band, a quarter of the third part's: the petals between the seams stay bare skin)
    float over = open*(1.0 - smoothstep(0.55*wB, wB, sm.x)), thinS = open*(1.0 - smoothstep(wB, 2.6*wB, sm.x));
    vec3 bN = N + 0.6*(vec3(wN(vO*13.0), wN(vO*13.0 + 5.0), wN(vO*13.0 + 9.0)) - 0.5); bN /= max(length(bN), 1e-4);
    vec3 welled = wKnee((wFrothLight(uFroth*0.94, bN, V, 0.6) + uFroth*(uFill*2.0 + uAmbHi*0.5))*(0.7 + 0.5*wN(vO*21.0 + 3.0)));
    col = mix(col, mix(col*0.55, mix(uFroth, uRose, 0.3)*0.5, 0.6), 0.7*thinS);
    col = mix(col, welled, over); }
  gl_FragColor = vec4(wFog(col, vW), 1.0);
}`;
// the froth under the skin: billows with shadowed clefts, each sun on its own side, rose down in the clefts
const CORE_FS = /* glsl */`
${W_COMMON}
varying vec3 vW, vN, vO;
void main(){
  vec3 Vv = vW - cameraPosition; vec3 V = Vv/max(length(Vv), 1e-3); vec3 N = vN/max(length(vN), 1e-4);
  vec4 b1 = wBubbles(vO*6.5 + vec3(0.0, uTime*0.05, 0.0)), b2 = wBubbles(vO*17.0 + 3.0);
  N += 0.75*b1.yzw + 0.3*b2.yzw; N /= max(length(N), 1e-4);
  float cleft = clamp(0.8*b1.x + 0.35*b2.x, 0.0, 1.0);
  vec3 alb = mix(uFroth*0.94, uRose*0.72, 0.25*cleft);
  float wa = clamp(dot(N, uSunA)*0.5 + 0.5, 0.0, 1.0), wb = clamp(dot(N, uSunB)*0.5 + 0.5, 0.0, 1.0);
  vec3 col = (wFrothLight(alb, N, V, 0.6) + alb*(uFill*2.6 + uAmbHi*0.6 + 0.34*(wPale(uSunACol)*wa*wa*wa + wPale(uSunBCol)*wb*wb*wb)))*(1.0 - 0.5*cleft);
  col += mix(uRose, uFroth, 0.5)*0.07*cleft*cleft;                                  // the light under the glass's skin, in the clefts
  gl_FragColor = vec4(wFog(wKnee(col), vW), 1.0);
}`;

// ---------------------------------------------------------------- 6. buildHero
// opts: shared (makeShared() of the world; made here when viewed alone), driven (the world calls setProgress), ratio, tiers,
// forks. Returns the usual hero object plus setProgress(u), plan (the layout), anchors.portalSeat.
export async function buildHero(ctx, opts = {}) {
  // the forks: the world's one list (opts.forks); viewed alone, the part takes the same list here, before anything else
  const F = opts.forks || takeForks(ctx.rng);
  const detail = ctx.quality?.detail ?? 1;
  const S = opts.shared || makeShared(), plan = layout({ ratio: opts.ratio, tiers: opts.tiers });
  if (!opts.shared) { S.uSunACol.value.multiplyScalar(2.0); S.uSunBCol.value.multiplyScalar(1.6); S.uSunB.value.set(0.61, 0.12, -0.79).normalize(); }
  const object = new THREE.Group();
  const seat = planSeat(plan), { rIn } = plan.collar, last = plan.arches[plan.arches.length - 1], endRib = plan.main[plan.main.length - 1];
  for (const set of [plan.main, plan.gal]) for (const r of set) r.seed = F.hall();
  for (const r of plan.leg) r.seed = F.legs();
  for (const f of plan.bigFilms) f.seed = F.films();
  for (const f of plan.webs) f.seed = F.webs();
  // NEW IN FIX ROUND 2, each a named stream of its own made from the world's seed (the seventeen forks deal as before):
  // the seams of the dome, the skirt of foam round the tower's foot, the openings of the wall films
  const named = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const seamR = named('ocean-seams'), skirtR = named('ocean-skirt'), holeR = named('ocean-holes');
  // the dome's seams: one on the mirror plane before and one behind, two pairs between, their bearings from the plane
  const seams = [(48 + 30 * seamR()) * Math.PI / 180, (112 + 30 * seamR()) * Math.PI / 180];
  // a wall film's openings, the same on both sides of the mirror plane (one deal per bay and band): a large one low, a
  // middling one high on the other half, a small one; a web keeps one round opening in its middle
  const dealHoles = () => { const sd = holeR() < 0.5 ? 1 : -1;
    return [0.5 - sd * (0.08 + 0.14 * holeR()), 0.26 + 0.12 * holeR(), 0.13 + 0.06 * holeR(), 0.5 + sd * (0.1 + 0.16 * holeR()), 0.6 + 0.16 * holeR(), 0.06 + 0.05 * holeR(), 0.2 + 0.6 * holeR(), 0.42 + 0.4 * holeR(), 0.03 + 0.035 * holeR()]; };
  const holesOf = new Map();
  for (const f of plan.bigFilms) { const key = f.bay + ':' + f.band; if (!holesOf.has(key)) holesOf.set(key, dealHoles()); f.holes = holesOf.get(key); }
  for (const f of plan.webs) f.holes = [0.5, 0.5, 0.15, 0, 0, 0, 0, 0, 0];
  const tipList = [];
  for (const [ribs, per] of [[plan.main, 12], [plan.gal, 4], [plan.leg, 1]]) for (const rib of ribs) for (let k = 0; k < per; k++) {
    const seed = F.tips(), a = F.tips() * 6.283, y = F.tips() * 2 - 1, sq = Math.sqrt(1 - y * y), m = 0.4 + 0.6 * F.tips();
    tipList.push({ rib, seed, off: [Math.cos(a) * sq * m, y * m, Math.sin(a) * sq * m] });
  }
  await ctx.yield();
  const built = (r) => detail >= 1 || !r.outer, legs = plan.leg.filter(built);
  plan.legs = legs;
  const ribMat = new THREE.ShaderMaterial({ uniforms: S, vertexShader: RIB_VS, fragmentShader: RIB_FS, side: THREE.DoubleSide });
  const mainMesh = makeRibMesh(plan.main, 40, 15, ribMat); await ctx.yield();
  const galMesh = makeRibMesh(plan.gal, 20, 8, ribMat); await ctx.yield();
  const legMesh = makeRibMesh(legs, 6, 6, ribMat); await ctx.yield();
  object.add(mainMesh, galMesh, legMesh);
  // films: wall films and the webs under the two inner arches of every gallery chain (at low detail the innermost only)
  const filmMat = new THREE.ShaderMaterial({ uniforms: S, vertexShader: FILM_VS, fragmentShader: FILM_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
  object.add(makeFilmMesh([...plan.bigFilms, ...plan.webs.filter((f) => detail >= 1 || f.j === 0)], 12, filmMat)); await ctx.yield();
  // the hall's image in the glass (polish 1, Q3 a): the same ribs and films once more, coarser, drawn flat on the glass
  // right after the sea (the sea part draws the sea at order -3) and before everything that stands on it
  const MIRROR = { defines: { W_MIRROR: 1 }, side: THREE.DoubleSide, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };
  const ribMir = new THREE.ShaderMaterial({ uniforms: S, vertexShader: RIB_VS, fragmentShader: MIRROR_RIB_FS, ...MIRROR });
  const filmMir = new THREE.ShaderMaterial({ uniforms: S, vertexShader: FILM_VS, fragmentShader: FILM_FS, ...MIRROR });
  const images = [makeRibMesh(plan.main, 20, 8, ribMir), makeRibMesh(plan.gal, 10, 6, ribMir), makeRibMesh(legs, 3, 4, ribMir), makeFilmMesh([...plan.bigFilms, ...plan.webs.filter((f) => detail >= 1 || f.j === 0)], 6, filmMir)];
  for (const m of images) { m.renderOrder = -2; object.add(m); }
  await ctx.yield();
  // froth: tips (blended sprites), and the masses: tower, front, rain, falling pieces, the collar (solid, dithered)
  const PUFF_BLEND = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
  const tipMat = new THREE.ShaderMaterial({ uniforms: S, vertexShader: TIP_VS, fragmentShader: PUFF_FS, ...PUFF_BLEND });
  const tips = makeTipPuffs(tipList.filter((e) => e.rib.kind !== 2 || built(e.rib)), tipMat); await ctx.yield();
  const massU = { ...S, uTower: { value: new THREE.Vector4(0, 0, 0, 0) }, uFront: { value: new THREE.Vector4(0, 0, 50, 60) }, uSeat: { value: new THREE.Vector4(seat.x, seat.y, seat.z, 0) },
    uHornA: { value: new THREE.Vector3(...plan.main[0].A) }, uHornB: { value: new THREE.Vector3(...plan.main[0].B) }, uHornSh: { value: new THREE.Vector4(plan.main[0].R, plan.main[0].t0, plan.main[0].t1, plan.main[0].p) },
    uHornG: { value: new THREE.Vector4(plan.main[0].k, plan.main[0].birth, plan.main[0].dur, plan.main[0].r0) } };
  const massMat = new THREE.ShaderMaterial({ uniforms: massU, vertexShader: MASS_VS, fragmentShader: PUFF_FS, defines: { W_DEPTH: 1 } });
  const cells = []; for (let iz = 0; iz <= 20; iz++) for (let ix = -4; ix <= 3; ix++) cells.push([ix, iz]);
  const mass = makeMassPuffs([{ kind: 0, n: 1800, rng: F.lumps }, { kind: 1, n: 420, rng: F.lumps },
    { kind: 2, n: Math.round(520 * detail), rng: F.rain }, { kind: 3, cells, rng: F.pieces }, { kind: 5, n: 300, rng: skirtR },
    { kind: 6, n: 28, rng: named('ocean-slide') },      // (polish 1, Q4) the pieces that slide from the two first horns: a named stream of their own
    { kind: 4, lumps: collarLumps(Math.round(1500 * Math.max(detail, 0.7)), F.collar, rIn, seat, (y) => Math.abs(ribPoint(endRib, tnAtHeight(endRib, Math.min(y, 0.98 * last.H)))[0])) }], massMat);
  await ctx.yield();
  object.add(tips, mass); await ctx.yield();
  // the dome
  const uSolid = { value: new THREE.Vector4(58, 27, 0, 0) }, uSeam = { value: new THREE.Vector2(seams[0], seams[1]) };
  const domeU = { ...S, uSolid, uSeam, uCore: { value: 0 } }, coreU = { ...S, uSolid, uSeam, uCore: { value: 1 } };
  const domeGeo = new THREE.SphereGeometry(1, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, new THREE.ShaderMaterial({ uniforms: domeU, vertexShader: SOLID_VS, fragmentShader: DOME_FS, side: THREE.DoubleSide }));
  const core = new THREE.Mesh(domeGeo, new THREE.ShaderMaterial({ uniforms: coreU, vertexShader: SOLID_VS, fragmentShader: CORE_FS }));
  dome.frustumCulled = false; core.frustumCulled = false;
  object.add(dome, core); await ctx.yield();
  // THE OCEAN BUILDS ELSEWHERE: two new swellings of the sea itself (drawn by the sea part, as its own surface carried
  // up: see elsewhere() below for where they are and when they rise). Here only their state: x, z, radius, height now
  const others = elsewhere(plan, named('ocean-elsewhere'));
  const uElseA = { value: new THREE.Vector4(others[0].x, others[0].z, others[0].r, 0) }, uElseB = { value: new THREE.Vector4(others[1].x, others[1].z, others[1].r, 0) };
  await ctx.yield();

  let prog = 0, clock = 0;
  const endBirth = plan.arches[plan.arches.length - 1].birth;
  function apply() {
    const v = prog, m = axisM; S.uU.value = v; S.uSag.value = sagAt(v);
    // the tower: it climbs between the burst and the stand-off place, sloughs off from there, and is gone where the gate
    // arch has closed (TL.gone); its froth wells up over the last metres before the burst and the first after (a tenth
    // and a quarter of the dome's radius of the lens's way); its last lumps go over a quarter of a bay
    const [up, slough] = towerAt(v);
    massU.uTower.value.set(TOWER.H * up, slough, sstep(TL.burst - m(0.1 * DOME.r), TL.burst + m(0.25 * DOME.r), v) * (1 - sstep(TL.gone - m(0.25 * BAY), TL.gone, v)), TOWER.r);
    // the front: its bank wells up over one bay of the lens's way, centred on the place where the gate arch closes and
    // the tower is gone, and sinks back while the last arch closes
    const fz = frontZ(v), fr = sat(-fz / (HALL.length + 20));
    massU.uFront.value.set(fz, sstep(TL.gone - m(0.5 * BAY), TL.gone + m(0.5 * BAY), v) * (1 - sstep(TL.last, TL.last + TL.arch, v)), mix(56, 34, fr), mix(70, 46, fr));
    // the dome swells from the first metre of the flight, breathing. Its seams open from the crown down while the lens
    // flies the half dome-radius before the burst; then the froth carries the petals up: they are gone when the tower
    // stands two dome-heights tall. The froth under the skin sinks back into the sea as the tower falls away
    const breath = 1 + 0.05 * Math.sin(clock * 1.2083), sw = sstep(0, TL.burst, v);
    const lift = sat(TOWER.H * up / (2 * DOME.h));
    // (the froth under the skin draws in and sinks while the first six tenths of the tower slough off, as the lumps do)
    const sink = sstep(0.05, 0.6, slough);
    uSolid.value.set((DOME.r - 14 + 14 * sw) * (1 - 0.8 * sink), Math.max(0.5, mix(22, DOME.h, sw) * breath * (1 - sink * sink)), sstep(TL.burst - m(0.5 * DOME.r), TL.burst, v), lift);
    dome.visible = lift < 0.999; core.visible = sink < 0.999;
    [uElseA, uElseB].forEach((u, i) => { const o = others[i]; u.value.w = ELSE_HIGH * o.r * sstep(o.from, o.from + ELSE_RISE, S.uSag.value) * (1 + 0.05 * Math.sin(clock * 1.2083 + o.ph)); });
    massU.uSeat.value.w = sstep(endBirth + 0.5 * TL.arch, endBirth + 1.2 * TL.arch, v);      // the collar gathers as its arch closes
  }
  apply();
  return {
    object, radius: 330, height: 150, center: new THREE.Vector3(0, 60, -300), ground: false, plan, shared: S,
    mirrored: { uDome: uSolid, uTower: massU.uTower, uElseA, uElseB },      // what the glass sea shows of the dome and the tower; the two swellings the sea itself carries
    anchors: { portalSeat: seat, axis: new THREE.Vector3(0, 0, -1) },
    setProgress(v) { prog = v; },      // v: the lens's progress along the axis (see TL)
    update(dt, time) { clock = time; S.uTime.value = time; if (!opts.driven) prog = (time % 20) / 20; apply(); },
    dispose() {},
  };
}
