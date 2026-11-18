// Hero set piece of "blue-fire-crater": the fire. Sulphur gas burning blue where it leaves the rock, rivers of molten
// sulphur running dark red down a yellow slope, the plume of steam and gas over them. This file holds the two laws of
// the world (the wind and the pour), the noise they all read, the light the fire throws, and the things that burn.
//
// SPACE: the world's own (nothing here is moved): +X east, +Z south, y = 0 the lake. The bay's own frame is laid over
// it by the world: a = metres into the bay from the top of the fire slope (negative toward the lake), b = metres across
// it toward the north-east.
//
// WHERE THIS FILE READS THE EYE'S PLACE (never where the eye looks; each is drawing or optics, the same law everywhere).
// The list is whole: every use of the eye's place, of a derivative across the screen and of the projection is here.
// - THE PIXEL'S FOOTPRINT (uPx: how much of the world one pixel covers a metre away): worked out in update from
//   the height of the drawing in pixels and the world's own fixed field of view (opts.fov), and from nothing
//   else; times a thing's distance from the eye's place it is the pixel's footprint there. Every filter "by the
//   pixel's footprint" below is this, or a derivative across the screen where that is said.
// - airAt (GLSL_AIR), used by every material here: the fume on the straight line from the eye's place to the thing.
// - the flames and the licks: each tongue's sheet is turned to the eye's place about its own foot; a tongue's
//   tearing is left out by its height in pixels; a flame's sheet is never narrower than three pixels; a lick whose
//   half breadth comes under a pixel and a half fades (there the line's ribbon carries its light), and a seam's
//   licks give way to the seam's ribbon by the pixel's footprint. (The river's tiles, which ride with the licks,
//   lie where the build laid them and read nothing of the eye's place; one filter by a derivative across the
//   screen: a tile so nearly edge-on on the screen that it is under a pixel and a half broad is faded out, a
//   pour's second sheet from six pixels down.) A tongue's thin heart, under a pixel broad, is drawn six tenths
//   of a pixel to either side (a derivative across the screen) and as much the fainter.
// - the halos (they ride with the flames): a wall seam's halo is a sprite turned to the eye's place; every halo's
//   depth is taken one radius nearer the eye's place than it stands, so the ground under it does not cut it.
// - the ribbons of the burning lines: a sheet seen edge-on shows nothing (shading by the way to the eye's place);
//   the ribbon's form is chosen by the pixel's footprint at its distance (a bed with a row of small tongues where
//   they can be drawn, one stroke where they cannot), it is never drawn lower than six pixels, and its edges are
//   filtered by a derivative across the screen up the ribbon.
// - a wall's seam and a fall of fire: each line's ribbon is one stroke about the line, turned to the eye's place
//   (its fire in true metres at every distance; its sheet never under two and a half pixels to either side; what
//   a pixel cannot hold is the fainter, by a derivative across the screen over the stroke); its depth is taken
//   nearer the eye's place: a seam's by three tenths of its flame's height, 1.2 m at the most; a fall's by its
//   stroke's half breadth, 6 m at the most. WHAT STANDS WITHIN THAT DEPTH BEFORE THE STROKE, ON THE LINE TO THE
//   EYE'S PLACE, IS DRAWN OVER BY THE FIRE: that is the rock the fire lies in (the wall's own relief: a ledge's
//   lip, a nose, a rib), which is the purpose; it is equally a boulder at a fall's foot that stands so near.
//   The tearing of its edge is taken coarser along the line the more the eye's place lies along the line.
//   WHICH OF ITS SIDES IS THE UPPER ONE AS SEEN FROM THE EYE'S PLACE sets its reach and its tearing on a line
//   that runs aslant: the upper side reaches further and is torn deeper, the lower draws in (fire rises).
//   A FILLED FALL'S REACH toward its next line is the build's metres across the fall, taken by how much of the
//   fall's breadth the eye's place sees across the stroke (a size with no sign, never under 0.15). THE FALL'S
//   TWO SIDES are torn where the build counted them, across the fall: how far across the fall a spot of the
//   stroke lies from its line's point is worked out from the spot's own place, carried along the line from
//   the eye's place to the plane's ways through that point (that line is taken to stand at least 0.15 of its
//   length out of the plane); how far a side may be let out and how soft it is are taken by the share above,
//   its softness also by a derivative across the screen. On a fall's stroke the metres out from the line
//   are the length of the way from the line's point to the spot, as the sheet turned to the eye's place
//   lays it. The strokes of one fall are told off on the fall's own plane, at the place where the
//   line from the eye's place through the stroke meets it, so that strokes standing before one another show
//   one fire. From near a stroke's edge is torn deeper and stands crisper (by the derivative across the stroke).
// - the puffs: each square is turned to the eye's place; its lit side lies across that square (the moon's way
//   across the square and toward the eye's place), and the way its gas is drawn out is the puff's own way
//   through the air as that way is seen across the square. Gas that rises takes its lit side and its shade
//   side from where the puff stands in its column, across the square and toward the eye's place; and where the
//   sky's bright side stands behind the gas as seen from the eye's place, its thin parts shine through.
// - a chimney's own fire (the tongues on its lip and down its flank): its depth is taken nearer the eye's place
//   than it stands. A tongue of the crown's rim: 1 m. A tongue on the flank, the world's own or one of a lip
//   run: eight tenths of the skin's distance from the chimney's axis where it stands, 4 m at the most, and
//   never under 1.2 m (2 m on a giant, whose lip stands 20 m over the lake) for the world's own, 1.5 m for a
//   lip run's. (A tongue of a steep fall of the ground: up to 0.9 m.) The build knows a chimney's girth only
//   roughly, and a chimney's skin stands out in knobs and crusts: the fire is drawn on whatever stands within
//   that much before it on the line to the eye's place, and is hidden by what stands further. THAT IS THE
//   CHIMNEY'S OWN SKIN, which is the purpose (the pull is less than the skin's distance from the axis, so a
//   tongue on the far side stays hidden behind the chimney); IT IS EQUALLY WHATEVER ELSE STANDS SO NEAR BEFORE
//   A FLANK'S TONGUE: a neighbour's crust or a boulder within 4 m of it, or a flyer that passes within 4 m
//   before it, is drawn over by that tongue for as long as it stands there. A chimney's crown bears one halo,
//   upright, turned to the eye's place.
// - fireRim (GLSL_FIRE), for the world's forms: an edge that faces the fire, seen edge-on on the way to the eye's
//   place (the way is handed in by the world's shader), takes a thin line of the fire's light.
// - the sparks: each streak is turned to the eye's place and is never narrower than a pixel and a half; it dims
//   as a pixel comes to cover more than a tenth of a metre at its distance and is gone from 0.45 m: no dots
//   from afar.
// - the flyers: a wing is shaded by which of its two faces is turned to the eye's place (the face the screen
//   shows takes the light); nothing else of a flyer reads the eye's place but the air it is seen through.
import * as THREE from 'three';

const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
// (a number of its own, 0..1, for every whole number; and a smooth field of such numbers along a line: no lot is drawn)
const hash1 = (i) => { const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return s - Math.floor(s); };
const noise1 = (x) => { const i = Math.floor(x), t = x - i; return mix(hash1(i), hash1(i + 1), t * t * (3 - 2 * t)); };
// (and such a field over the ground, for where on a slope the fire gathers)
const hash2 = (i, j) => hash1(((i * 73 + j * 151) % 4096 + 4096) % 4096);
const noise2 = (x, z) => { const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, s = u * u * (3 - 2 * u), t = v * v * (3 - 2 * v); return mix(mix(hash2(i, j), hash2(i + 1, j), s), mix(hash2(i, j + 1), hash2(i + 1, j + 1), s), t); };

// ---------- shared GLSL: noise from one tileable texture (its mip chain smooths it to the pixel's footprint) ----------
export const GLSL_NOISE = /* glsl */`
uniform sampler2D tNoise;
float nR(vec2 p){ return texture2D(tNoise, p).r; }
float nG(vec2 p){ return texture2D(tNoise, p).g; }
float nB(vec2 p){ return texture2D(tNoise, p).b; }
float nA(vec2 p){ return texture2D(tNoise, p).a; }
`;

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
    if ((y & 1) === 1 && yieldFn) await yieldFn();
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = anisotropy; t.needsUpdate = true;
  return t;
}

// ---------- THE TWO LAWS, for the processor ----------
// THE WIND backs and veers once a period. `lean` (0..1) is how far it stands in the north: 1 leans the plume in over
// the fire slope, 0 has backed to the west and the slope stands clear. The change crosses the slope from west to east
// over `cross` seconds, so a place `e` (0 at the slope's west side, 1 at its east) follows the wind that much later.
// THE POUR: once a period the crust dam at the top of the slope gives. `tau` is the seconds since it gave. The lit
// head runs down the main channel at `speed` metres a second; a place `m` metres down the channel burns from the
// head's arrival, gutters and skins over; the pool behind the dam drains as the dam gives and fills for the rest.
// Both are pure functions of the world's clock: any second can be posed, and each is whole from any phase.
export function makeLaws(o = {}) {
  const L = { windPeriod: o.windPeriod ?? 35, pourPeriod: o.pourPeriod ?? 30, windStart: o.windStart ?? 0, pourStart: o.pourStart ?? 0, speed: 30, cross: 5,
    // uLaw: x = the wind's phase (0..1), y = the wind's period (s), z = seconds since the dam gave, w = the pour's period (s)
    uniform: { value: new THREE.Vector4(0, o.windPeriod ?? 35, 0, o.pourPeriod ?? 30) },
    set(time) { const fw = (time - L.windStart) / L.windPeriod, fp = (time - L.pourStart) / L.pourPeriod;
      L.uniform.value.x = fw - Math.floor(fw); L.uniform.value.z = (fp - Math.floor(fp)) * L.pourPeriod; },
    // how far the wind stands in the north at a place e of the slope (0 west .. 1 east)
    lean(e) { const ph = L.uniform.value.x - (e * L.cross) / L.windPeriod; return 0.5 + 0.5 * Math.cos(6.2832 * ph); },
    // how hard the main channel burns m metres down it (0..1)
    burn(m) { const t = L.uniform.value.z - m / L.speed, P = L.pourPeriod; return t < 0 ? 0 : sstep(0, 0.5, t) * (1 - sstep(P * 0.34, P * 0.6, t)); },
    // how full the pool behind the dam stands (0..1)
    pool() { const t = L.uniform.value.z, P = L.pourPeriod; return t < 3 ? 1 - sstep(0, 3, t) : sstep(3, P, t); },
  };
  return L;
}

// ---------- the same laws for the shaders ----------
export const GLSL_LAWS = /* glsl */`
uniform vec4 uLaw;
float windLean(float e){ return .5 + .5 * cos(6.2832 * (uLaw.x - e * 5. / uLaw.y)); }
float pourBurn(float m){ float t = uLaw.z - m / 30.; return smoothstep(0., .5, t) * (1. - smoothstep(uLaw.w * .34, uLaw.w * .6, t)); }
float pourPool(){ float t = uLaw.z; return t < 3. ? 1. - smoothstep(0., 3., t) : smoothstep(3., uLaw.w, t); }
`;

// ---------- shared GLSL: the light of this world ----------
// Nothing here is a lamp that moves: the fire's light comes from ten fixed places (uFire: place, strength now; the
// world sets each strength from the two laws every frame; uFireR: how broad the burning ground behind each is, metres),
// a clear light blue (uFireCol: pale enough that what it lights still shows its own colour), and always from below; the lake's steam glows pale from the lake's own place (uLake: the middle of the
// lake's near water, its strength in w); the night sky's light comes from above (uSkyCol); the moon of its hour, if any, from its own
// bearing (uMoonDir, uMoonCol).
export const GLSL_FIRE = /* glsl */`
uniform vec4 uFire[10]; uniform float uFireR[10]; uniform vec3 uFireCol, uSkyCol, uMoonDir, uMoonCol, uLakeCol; uniform vec4 uLake, uRim;
// how much of the moon a place sees over the crater's rim: the rim is taken as a ring about the crater's middle (the
// world's origin), uRim.x m out round the lake and uRim.y m out behind the bay, uRim.z m high; a place is lit when the
// way from it toward the moon clears that ring
float moonSees(vec3 P){
  vec2 m = normalize(uMoonDir.xz + vec2(1e-5, 0.)); float r2 = dot(P.xz, P.xz), R = mix(uRim.x, uRim.y, smoothstep(uRim.x - 25., uRim.x + 40., sqrt(r2)));
  float pm = dot(P.xz, m), t = -pm + sqrt(max(pm * pm - r2 + R * R, 0.));
  return smoothstep(-8., 8., P.y + t * uMoonDir.y / max(length(uMoonDir.xz), 1e-3) - uRim.z); }
// the fire's light on a face at P that looks along N (wrap: how far round the face the light creeps, 0..1). It is
// strong and local: from each place it is full within that place's own breadth (uFireR), a tenth of that at three
// breadths, and gone by eight; a face turned from the fire stays dark, so the rock's relief shows
vec3 fireLight(vec3 P, vec3 N, float wrap){
  float sum = 0.;
  for (int i = 0; i < 10; i++) { vec3 L = uFire[i].xyz - P; float d2 = dot(L, L), r2 = uFireR[i] * uFireR[i];
    sum += uFire[i].w * r2 / (d2 + r2) * (1. - smoothstep(16. * r2, 64. * r2, d2)) * clamp((dot(N, L) * inversesqrt(max(d2, 1e-4)) + wrap) / (1. + wrap), 0., 1.); }
  return uFireCol * sum; }
// the fire's rim: an edge of a form that faces the fire, seen edge-on from V (the way to the eye's place), takes a thin
// line of its light; it carries far (to some sixty breadths of each place), so the rim and the dead trees are edged by it
vec3 fireRim(vec3 P, vec3 N, vec3 V){
  float sum = 0., f = 1. - clamp(dot(N, V), 0., 1.); f *= f * f;
  for (int i = 0; i < 10; i++) { vec3 L = uFire[i].xyz - P; float d2 = dot(L, L), r2 = uFireR[i] * uFireR[i] * 64.;
    sum += uFire[i].w * r2 / (d2 + r2) * clamp(dot(N, L) * inversesqrt(max(d2, 1e-4)) * 1.1 + .1, 0., 1.); }
  return uFireCol * sum * f; }
// the fire's far light: what of it reaches a face a long way off (the same reach as the rim's), on the side turned to it
vec3 fireFar(vec3 P, vec3 N){
  float sum = 0.;
  for (int i = 0; i < 10; i++) { vec3 L = uFire[i].xyz - P; float d2 = dot(L, L), r2 = uFireR[i] * uFireR[i] * 64.;
    sum += uFire[i].w * r2 / (d2 + r2) * clamp(dot(N, L) * inversesqrt(max(d2, 1e-4)), 0., 1.); }
  return uFireCol * sum; }
// the night sky's own light on a face that looks along N: starlight, dim and nearly grey, from above. Level ground
// takes it whole, ground that falls at forty degrees some nine tenths of it, a standing wall over half, the underside
// of an overhang nothing
vec3 skyLight(vec3 N){ float up = clamp(N.y * .5 + .5, 0., 1.), top = max(N.y, 0.); return uSkyCol * (.78 * sqrt(up) + .22 * top * sqrt(top)); }
// everything else that lights a face: the sky from above, the lake's steam, the moon
vec3 nightLight(vec3 P, vec3 N){
  vec3 L = uLake.xyz - P; float d2 = dot(L, L);
  // (the lake's glow: from its near water, and faintly from its whole face up the foot of every wall that stands round it)
  return skyLight(N) + uLakeCol * uLake.w * (9e4 / (d2 + 9e4) * clamp(dot(N, L) * inversesqrt(max(d2, 1e-4)) * .7 + .3, 0., 1.)
      + exp(-max(P.y, 0.) / 30.) * (1. - smoothstep(uRim.x - 50., uRim.x + 80., length(P.xz))) * (.6 - .4 * N.y))
    + uMoonCol * max(dot(N, uMoonDir), 0.) * moonSees(P); }
`;

// ---------- shared GLSL: THE AIR of the bowl, one law for everything that is seen through it ----------
// The crater is full of fume. It lies thick on the lake and for some 30 to 40 m over it and thins away upward (its
// thickness falls by the height over the lake: uAir.x at the lake's level, a third of that every 1 / uAir.y metres up),
// and it stands a little thicker over burning ground (uAir.z). What is seen through it is seen less, by how much fume
// lies on the straight line from the eye's place to the thing: that line's share of fume is taken in closed form (the
// mean of the fall by height between the two ends), so nothing is marched. THIS READS THE EYE'S PLACE AND THE
// DISTANCE: it is the optics of air, the same law at every place.
// The fume has its own light: the night sky's, a neutral slate a little paler than unlit rock (uAirCol), so a far thing
// goes paler and softer, never darker. Where the line passes over burning ground the fume on it glows the fire's
// light blue: the fire's map of the bay (tAir, its wide light) is read at four places along the line, each weighed by
// the fume that stands there over the bay's floor (uAirFloor: the height of the slope's top, the slope's fall, the
// terrace's height, the metres over the floor in which that fume thins to a third; uAirMap: the bay's place and the
// map's corner). THE MAPS' MEASURE IS THE WORLD'S OWN: the world lays both maps a texel to the metre from that
// corner, so a place in the bay is read at its metres from the corner over the map's own size in texels (airUV:
// asked of the map itself; both maps are of one size, and no size is written here). Low over the lake the fume is the lake's steam and glows faintly teal (uAirTeal: its light, and
// the lake's radius about the crater's middle); hard by molten sulphur it takes a little dull red (tAirRed).
// airAt answers: rgb the light the air sends to the eye from along the line, a how much of the thing is still seen.
export const GLSL_AIR = /* glsl */`
uniform vec4 uAir, uAirMap, uAirFloor, uAirTeal; uniform vec3 uAirCol, uAirFire; uniform sampler2D tAir, tAirRed;
vec2 airBay(vec2 xz){ vec2 q = xz - uAirMap.xy; return vec2(q.x + q.y, q.x - q.y) * .70711; }
vec2 airUV(vec2 ab){ return (ab - uAirMap.zw) / vec2(textureSize(tAir, 0)); }
float airFloor(float a){ return a > 0. ? uAirFloor.x + a * .09 : max(uAirFloor.x + a * uAirFloor.y, uAirFloor.z); }
vec4 airAt(vec3 P){
  vec3 E = cameraPosition, D = P - E; float L = length(D);
  float yE = max(E.y, 0.) * uAir.y, yP = max(P.y, 0.) * uAir.y, dy = yP - yE;
  float fume = uAir.x * L * (abs(dy) > 1e-3 ? (exp(-yE) - exp(-yP)) / dy : exp(-yE));
  float fire = 0., teal = 0.;
  for (int i = 0; i < 4; i++) { vec3 Q = E + D * (.125 + .25 * float(i)); vec2 ab = airBay(Q.xz), uv = airUV(ab);
    vec2 e = smoothstep(vec2(0.), vec2(.06), uv) * (1. - smoothstep(vec2(.94), vec2(1.), uv));
    float f = textureLod(tAir, uv, 2.).g; f *= f * e.x * e.y;
    fire += f * exp(-max(Q.y - airFloor(ab.x), 0.) / uAirFloor.w);
    teal += (1. - smoothstep(uAirTeal.w - 60., uAirTeal.w - 10., length(Q.xz))) * exp(-max(Q.y, 0.) / 9.); }
  fire *= L * .25; teal *= L * .25;
  float tau = fume + uAir.z * fire, T = exp(-tau);
  vec2 abP = airBay(P.xz); float red = textureLod(tAirRed, airUV(abP), 1.).g;
  red = red * red * red * exp(-max(P.y - airFloor(abP.x), 0.) / 5.) * (1. - exp(-L / 30.));
  vec3 glow = uAirFire * (1. - exp(-fire * uAir.w)) + uAirTeal.rgb * (1. - exp(-teal * .012)) + vec3(.04, .006, .001) * red;
  return vec4(uAirCol * (1. - T) + glow * sqrt(T), T); }
// how near molten sulphur a place lies (the world's map of the bay's floor keeps, in its third number, how far
// inside a river's bank a place is, a sixteenth to the metre, a half on the bank): the most on the molten bed and to
// half a metre outside its bank, 0 from 2.5 m outside it, and less the higher over the bay's floor the place stands.
// ITS MOST IS 0.12, NOT 1: it tells a tongue how far its form gives way by molten sulphur (a sharper body, less
// fringe, an edge that hides the ground early: see the tongue's law), and the bed under a burning stream is dark,
// skinned sulphur, over which a thin blue is still blue: at the whole strength the stream's fire, which stands
// on the bed from end to end, is a pale flat sheet with cut edges; at an eighth its edges are firm and its
// tongues keep their veil.
float moltenAt(vec3 P){
  vec2 ab = airBay(P.xz), uv = airUV(ab);
  return .12 * smoothstep(-2.5, -.5, (texture2D(tAirRed, uv).b - .5) * 16.) * step(0., min(uv.x, uv.y)) * step(max(uv.x, uv.y), 1.) * exp(-max(P.y - airFloor(ab.x), 0.) / 4.); }
`;

// ---------- shared GLSL: THE FORM AND THE LIGHT OF A TONGUE OF FLAME, one law for every tongue ----------
// A TONGUE IS BLUE LIGHT, AND ITS BODY HIDES WHAT BURNS BEHIND IT. What this law answers is laid over what stands
// behind: the light is put on top, and of what was there the share FIRE_HIDES of the body's own density is taken
// away first (the soft edge hides in the share of its own thinness, the fringe two fifths as much, a halo and a
// spark nothing: they are light added and no more). The reason is the arithmetic of light on a screen. Blue light ADDED
// to ground that is already pale, or to the molten sulphur's orange, cannot show blue: the ground's own red and
// green stay, and it shows pale lavender (a body of blue 1.5 added to pale ground at 184, 184, 190 of 255 shows
// 197, 214, 242; added to the orange bed, 234, 205, 237). Hidden behind the body it shows 96, 171, 238 and 113,
// 169, 238: electric blue over whatever it stands before. And where many fires stand before one another their
// light does not add up without end: it ends at one body's light and a twentieth more.
// FIRE_HIDES = 0 gives the fire of pure added light back. In a pale hour (uFlame.y) nothing is hidden.
// It has a form and no outline: a
// rounded foot, a waist, a belly, a tip drawn out thin; its middle line bends to a side of its own and a wave runs
// up it on the world's clock, wider toward the tip, so its sides run in S-curves and the tip whips; one tongue in
// two has a lower lick at a side. IT CLIMBS AND TEARS OFF: on a round of its own (1 to 2 seconds, each tongue out
// of step with the next) its tip climbs from 0.56 to 0.84 of its sheet; then the top of it is torn off, a wisp of
// gas (taller than broad, torn by the tongue's own noise: not a ball) that rises through the rest of the sheet,
// shrinks and fades while the tongue climbs again. Noise that
// climbs through it (taken in metres, on the world's clock) eats into its edge, most toward the tip.
// Its light falls away to nothing at either side over a third of its breadth: outermost a deep blue fringe, 0.45
// at the most; a body of electric blue, 1.5 at its tip to 1.95 low in it (linear light, in blue; a fifth as
// much green, no red), that turns azure toward its inside and its foot (to 2.15 there); and from the foot up
// through two thirds of its height A THIN HEART of pale cyan, a tenth of the tongue's breadth, about 0, 1.15 to
// 1.5, 2.6 to 2.9: the heart alone is bright enough for the engine's bloom (threshold 1; the body's brightness
// to the eye is 0.35 to 0.5).
// lickD(): one lick's measure: how far inside its form a place is, in the tongue's half breadths.
// tongueLight(): p = across the tongue in its own half breadths at the foot, and up its sheet (0 foot .. 1 the
// sheet's top); sd its seed; hm the sheet's height and wm the tongue's half breadth at the foot, metres; tK how
// much of the tearing its size on the screen can carry; hot: a hotter tongue's heart is taller and brighter;
// lit: its strength; pale: the hour's paleness; edge: 1 inside the sheet, falling to 0 at the sheet's sides.
// It answers the light to lay on, and in its fourth number how much of what is behind it hides.
// (FIRE_HIDES: the share of what stands behind it that the full body of a flame hides, 0..1)
const FIRE_HIDES = 0.95;
export const GLSL_TONGUE = /* glsl */`
// (one lick: a smooth drop h tall, in the tongue's own height, its foot at x0, W broad, its tip drawn b aside; a
// wave runs up its middle line on the world's clock; a: how soon it draws in)
float lickD(vec2 p, float x0, float b, float W, float h, float a, float ph, float hm, float tK){
  float y = p.y / h, xc = x0 + b * y * y + W * (.3 + .7 * min(tK, 1.)) * (.2 * y + .55 * y * y) * sin(y * (4.2 + hm * .5) - uTime * 4.6 + ph);
  return W * pow(max(1. - pow(max(y, 0.), a), 0.), 1.1) * (.74 + .26 * exp(-y * 9.) + .14 * exp(-(y - .34) * (y - .34) * 24.)) * sqrt(clamp(y * 12. + .1, 0., 1.)) - abs(p.x - xc) - max(y - 1., 0.) * 3.; }
// (THE COLOURS OF THE FIRE, linear light, and none of them has any red. The engine's tone map draws a strong blue
// toward violet and then to white by itself: blue 3 with nothing else shows 116 of 255 in red, blue 5 shows 165.
// So the body is held to 1.5 to 1.95 of blue with a fifth as much green, which shows as electric blue (81, 166,
// 238 of 255 at its deepest; 109, 184, 243 at its brightest) and in THE HUE OF THE FIRE'S OWN LIGHT ON THE
// GROUND: the world lays that light as 0.08, 0.38, 1 times its strength, which shows at hue 215 to 204 degrees
// from dim to bright; the body shows at 208 to 206. (The light's own numbers at a flame's strength would show
// pale, 151, 204, 237: the tone map again.) Toward its inside the body gains green and turns azure (123, 195,
// 244 at the most); the fringe is the same blue, 0.45 at the most (0, 80, 187); and the heart is what a thin
// line at the tongue's middle gains over the body: with it the line stands at 0, 1.15 to 1.5, 2.6 to 2.9, pale
// cyan (178 to 195, 231 to 238, 245), and it alone is bright enough for the engine's bloom)
const vec3 FIRE_FRINGE = vec3(0., .2, 1.), FIRE_BODY = vec3(0., .2, 1.), FIRE_INNER = vec3(0., .08, .2), FIRE_HEART = vec3(0., 1., .7);
const float FIRE_HIDES = ${FIRE_HIDES.toFixed(3)};
vec4 tongueLight(vec2 p, float sd, float hm, float wm, float tK, float hot, float lit, float pale, float edge, float red){
  float r1 = fract(sd * 37.3), r2 = fract(sd * 11.7), r3 = fract(sd * 23.9), tk = min(tK, 1.);
  // (its round: a climbs from 0 to 1 in 1 to 2 seconds; hb: where its tip stands, in the sheet's height)
  float a = fract(uTime * (.5 + .5 * r3) + r1 * 7.), hb = mix(.84, mix(.56, .84, pow(a, .7)), tk);
  // (the tongue itself, full to past its middle and drawn out thin; one tongue in two has a lower lick at its
  // left side, one in four another at its right)
  float d = max(lickD(p, 0., (r1 - .5) * .9, .8, hb, 1.4 + .9 * r2, sd * 40., hm, tK),
    max(lickD(p, -.36 - .1 * r3, -.1 - .2 * r2, .44 * step(.5, r3), .26 + .26 * r3, 1.6, sd * 70., hm, tK), lickD(p, .36 + .1 * r2, .1 + .2 * r1, .42 * step(.75, r1), .22 + .26 * r1, 1.6, sd * 90., hm, tK)));
  // (eaten by noise that climbs on the world's clock, taken in metres: a broad tearing and a fine one, most toward the tip)
  float eat = ((nG(vec2(p.x * wm * .4 + sd * 5.1, p.y * hm * .16 - uTime * .7 + sd)) - .5) * .5 + (nA(vec2(p.x * wm * .4 + sd * 9.1, p.y * hm * .15 - uTime * 1.3)) - .5) * .16) * tK * (.2 + .8 * smoothstep(.05, .6, p.y));
  // (the light falls away to nothing over 0.38 of a half breadth at either side: a third of the tongue's whole
  // breadth at its belly, which is 1.14 half breadths; outside it the fringe)
  float body = smoothstep(0., .38 / (1. + .8 * red), d + eat), fringe = smoothstep(-.6, .1, d + eat); fringe *= fringe * (1. - body) * (1. - red);
  float inner = smoothstep(.22, .55, d + eat);
  // (THE HEART IS THIN: a lick a fifth as broad as the tongue, its light full only at its middle line: at half its
  // light it is a tenth of the tongue's breadth. A filter by the pixel's footprint: where that is under a pixel
  // (fp: a pixel's breadth in the tongue's half breadths) it is drawn half a pixel broad and as much the fainter)
  float fp = fwidth(p.x), hw = max(.16 + .04 * hot, .6 * fp);
  float heart = smoothstep(0., hw, lickD(p, 0., (r1 - .5) * .6, hw, hb * (.66 + .1 * hot), 1.2, sd * 40., hm, tK) + eat * .15) * min(1., .27 / max(fp, 1e-4));
  // (THE TORN-OFF TIP: it leaves from where the tip stood as the round began again, rises, shrinks and fades)
  float tipx = (r1 - .5) * .9 + .6 * (.3 + .7 * tk) * sin(4.2 + hm * .5 - uTime * 4.6 + sd * 40.);
  // (it is a wisp, not a ball: taller than broad, and eaten by the same noise as the tongue, hard)
  vec2 c = vec2(tipx * mix(.75, 1.1, a), mix(.74, .96, a)), rr = vec2(.32 - .16 * a, .17 - .07 * a);
  float torn = max(1. - length((p - c) / rr) + eat * 1.5, 0.) * (1. - a) * (1. - a) * tk * (1. - .7 * red);
  // (streaks of brighter gas climb through all of it; a soft glow lies about its foot, where it stands in the fire)
  float streak = nR(vec2(p.x * max(wm, .5) * .8 + sd * 3.3, p.y * max(hm, 1.5) * .08 - uTime * .6)) * .55 + nA(vec2(p.x * wm * .7 + sd * 9.1, p.y * hm * .1 - uTime * 1.)) * .45 * tk;
  float foot = exp(-p.y * hm / .35) * max(1. - abs(p.x) / 1.3, 0.);
  // (the body with the torn-off tip and the foot's glow is never more than one body's light; it is brightest
  // low in the tongue, where the gas burns hottest, and a deeper blue toward its tip: vg)
  float vg = 1. - smoothstep(.2, 1., p.y / hb);
  // (hid: how much of what lies behind it the body hides: near molten sulphur its thin edge hides more than its
  // own share, a little over twice it where the molten law answers its most, see below; and what the edge hides
  // beyond its own light it gives the fringe's deep blue: an edge that hides and gives no light is a dark line
  // round the tongue wherever it stands before other fire)
  float hid = min(body * (1. + 9. * red), 1.);
  vec3 col = FIRE_FRINGE * (.45 * fringe + .9 * (hid - body)) + FIRE_BODY * (min(body + .8 * torn + .4 * foot, 1.) * (1.5 + .22 * streak + .23 * vg - red * (.3 - .1 * streak - .25 * vg))) + FIRE_INNER * (min(inner + .5 * torn, 1.) * (.3 + .7 * vg))
    + FIRE_HEART * (heart * (.9 + .15 * hot) * (.75 + .25 * streak));
  float k = lit * edge * (1. - smoothstep(.93, 1., p.y)); col *= k;
  col = mix(col, vec3(.5, .55, .8) * dot(col, vec3(.1, .3, .4)), pale);   // (the hour's paleness)
  // (NEAR MOLTEN SULPHUR THE TONGUE'S FORM GIVES WAY A LITTLE. red is the molten law's answer, 0.12 at its most
  // (see moltenAt); where it is at that most the body's light comes up over nine tenths of the breadth it does
  // elsewhere, its thin edge hides a little over twice its own share, the fringe outside it is an eighth
  // fainter, the torn-off tip a twelfth fainter, and the body's own blue is all but the same (a fortieth deeper
  // at its tip). The reason: the bed's orange is many times brighter than the edge's blue, and what of it
  // shows through a soft edge and the fringe shows pink; so by the bed the edge is a little firmer and hides a
  // little sooner, and what it hides beyond its own light it gives the fringe's deep blue. The law is written
  // for red from nought to one and is handed no more than 0.12: at one the edge hides in full, there is no
  // fringe and the body comes up over five ninths of its breadth, and a stream's fire, which stands on the bed
  // from end to end, is then a pale flat sheet with cut edges)
  return vec4(col, FIRE_HIDES * min(hid + .8 * torn + .4 * fringe, 1.) * k * (1. - pale)); }
`;

// ---------- the flames: tongues of burning gas, each an upright sheet turned to the eye's place about its own foot ----------
// iP: the foot (world), the tongue's full height (m); iQ: seed, how far east across the slope it stands (0..1: when the
// wind's change reaches it), the main channel's metres at its foot (negative: it burns always; -2: and hotter), its breadth as a share
// of its height.
// A tongue is broad at its foot (its foot some half as broad as it is tall), where it stands in the burning ground;
// its form and its light are the one law above (GLSL_TONGUE). It leans down the wind, more toward its tip (the
// sheet is sheared by the lean, the tongue bends inside it), and its height breathes on two slow rhythms of its
// own. It is the same tongue from every distance: the eye's place is read for the sheet's turning, and for two
// filters by the pixel's footprint: its tearing is left out as it comes under 28 pixels of height (none under 6),
// and its sheet is never narrower than three pixels (the tongue inside it keeps its own breadth). A tongue of the
// main channel's banks stands tall while the channel burns there (the pour's law) and lower, 0.55 of its
// height, while it does not: the great river is fire along its whole length at every second, and flares as the
// pour's head comes down it. It is laid over what stands behind it, soft to its edge, and writes no depth.
// A FRONT (a breadth over 1.05 of the height's share: the build's mark) is fire run together on a slick: a low bed
// with a row of tongues (frontLight).
// THE HALOS, AND THE SLICKS under the fronts, ride in the same mesh (an instance whose breadth is below nought):
// see the vertex shader.
// uWind: the way the wind blows when it stands in the north (xy) and when it has backed to the west (zw), world x, z.
// uFlame: x = the share of its height a tongue keeps in this hour's weather, y = how pale the hour makes it (0..1).
// (FIRE_BLEND: how every fire's fragment is laid on, and every puff's. The screen's own fourth channel is left as
// the world wrote it: the engine's bloom weighs each pixel by it. SPARK_BLEND: a spark's light is added to what
// is there, and it too leaves the fourth channel as it is)
const FIRE_BLEND = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
const SPARK_BLEND = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
function flameMaterial(U) {
  // (ALL THE FIRE IS LAID ON THE SAME WAY (FIRE_BLEND): a fragment's light goes on top of what is there, of which
  // the share in the fragment's fourth number is taken away first (the tongue's law says how much, and why). So
  // where many fires stand before one another, tile, ribbon and tongues, their light does not add up without
  // end, and a field of blue fire stays blue and is not burnt white by the tone map. The fire's own meshes are
  // drawn in a set order and none of them writes depth: a tongue is not hidden by the fire before it, it is laid
  // over it. They are drawn before the steam, which veils them)
  return new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...FIRE_BLEND,
    vertexShader: /* glsl */`
      attribute vec4 iP, iQ; uniform float uTime, uPx; uniform vec4 uWind; uniform vec2 uFlame;
      ${GLSL_LAWS}
      ${GLSL_AIR}
      varying vec2 vUv; varying vec4 vS, vAir; varying vec3 vT; varying float vRed;
      void main(){
        vRed = moltenAt(iP.xyz);   // (how near molten sulphur its foot stands: for its edge, see the tongue's law)
        // (a tongue of a roaring vent or of a wall's seam burns hotter: a fifth brighter, its heart paler and taller)
        // (a tongue of a course, the build's mark, -1.2: told on as 1.1; it burns as every tongue that burns always)
        float sd = iQ.x, on = iQ.z < 0. ? 1. + .5 * step(iQ.z, -1.5) + .1 * step(iQ.z, -1.1) * step(-1.4, iQ.z) : .55 + .45 * pourBurn(iQ.z);
        float breathe = .78 + .16 * sin(uTime * (1.3 + sd * 1.1) + sd * 40.) + .1 * sin(uTime * (2.9 + sd * 1.7) + sd * 90.);
        // (A FRONT, a tongue broader than its height's own share (the build's mark: see A FRONT OF FIRE): its sheet
        // keeps one height, and the tongues in it breathe each on a round of its own)
        float front = step(1.05, iQ.w); breathe = mix(breathe, .92, front);
        // (h: the sheet's height: the tongue's own tip stands at 0.84 of it and its wisps rise through the rest; at
        // its tallest the sheet is 1.09 of the tongue's full height, inside the 1.1 the world keeps clear)
        float h = max(iP.w * breathe * uFlame.x * min(on, 1.) * 1.05, .05), y = position.y + .5;
        vec2 wd = mix(uWind.zw, uWind.xy, windLean(iQ.y));
        vec3 foot = iP.xyz, toEye = cameraPosition - foot; float dist = length(toEye); vec2 rt = normalize(vec2(toEye.z, -toEye.x) + vec2(1e-5, 0.));
        // (wm: its half breadth at the foot, metres: its foot is some half as broad as it is tall; a front's is
        // what the build gave it, up to 1.4 m; lean: how far down the wind its tip stands, metres: a tongue the weather
        // has beaten down leans by as many metres as it would standing tall; lx: that lean as it is seen across the
        // sheet, in half breadths)
        float wm = h * iQ.w * .19;
        float lean = h * (.14 + .1 * fract(sd * 13.7) + .06 * sin(uTime * 1.7 + sd * 60.)) / max(uFlame.x, .3), lx = dot(wd, rt) * lean / wm * (1. - front);
        // (the sheet is sheared by the lean and is broad enough to hold the tongue's bend and its fringe: 1.65
        // of its half breadth, 0.31 of its height: what the world counts for it; a front's, whose fire dies away
        // toward its two ends inside it, 1.15 of its half breadth; it is never narrower than three pixels at its
        // distance from the eye's place)
        float Q = max(mix(1.65 + .25 * abs(lx), 1.15, front), dist * uPx * 1.5 / wm);
        vec3 pos = foot + vec3(0., y * h, 0.) + vec3(wd.x, 0., wd.y) * (y * lean) + vec3(rt.x, 0., rt.y) * (position.x * 2. * wm * Q);
        // (vT.y: how much of the tongue's tearing its size on the screen can carry: none under six pixels of height,
        // all of it from twenty-eight; vT.z: the sheet's half breadth in the tongue's own)
        vUv = vec2(position.x * 2. * Q, y); vS = vec4(sd, on, h, wm); vT = vec3(lx, smoothstep(6., 28., h / max(dist * uPx, 1e-4)), Q);
        gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.); vAir = airAt(foot + vec3(0., h * .4, 0.));
        // A HALO (a breadth below nought is its mark; iP.w its radius, -iQ.w its strength): the air about a burning
        // line or a large tongue, lit by it: a round disc of light lying level a quarter of a metre over the line
        // (so, looked through from low over a field, the halos do not pile up into a haze); a wall seam's (100
        // more) stands upright before the wall, turned to the eye's place, its middle a third of its radius over
        // the seam. It swells and sinks a little on a slow round of its own. Its depth is taken one radius nearer
        // the eye's place than it stands (drawing: the ground it lies over does not cut it in a line)
        // A SLICK (200 more: the build's): the sulphur afloat under a front, burning: a level disc a tenth of a
        // metre over the front's foot, iP.w its radius, steady; its law is the fragment's. It carries its place
        // on the water (vS.zw): slicks that lie over one another show one sheet.
        if (iQ.w < 0.) { float slick = step(150., -iQ.w), wall = step(50., -iQ.w) * (1. - slick), r = iP.w * mix(.92 + .08 * sin(uTime * (.9 + sd) + sd * 40.), 1., slick);
          vec3 c = foot + vec3(0., mix(mix(.25, .1, slick), .35 * iP.w, wall), 0.), te = normalize(cameraPosition - c), rx = normalize(vec3(te.z, 0., -te.x) + vec3(1e-5, 0., 0.));
          pos = c + mix(vec3(position.x, 0., position.y), rx * position.x + cross(te, rx) * position.y, wall) * (2. * r);
          vec4 cn = projectionMatrix * viewMatrix * vec4(pos + te * r, 1.); gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.); gl_Position.z = cn.z * gl_Position.w / cn.w;
          // (near molten sulphur a halo is the fainter by the molten law's answer, an eighth at the most: blue light
          // added to the bed's orange shows pink)
          vUv = position.xy * 2.; vS = vec4(sd, mix(-iQ.w - 100. * wall, 1., slick) * min(on, 1.) * uFlame.x * (1. - vRed), mix(vec2(1.), pos.xz, slick)); vT = vec3(slick, 0., -1.); vAir = airAt(c); }
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec2 uFlame;
      ${GLSL_NOISE}
      ${GLSL_TONGUE}
      varying vec2 vUv; varying vec4 vS, vAir; varying vec3 vT; varying float vRed;
      // A FRONT'S LIGHT: fire that runs together. uv: across the front in its own half breadths and up its sheet
      // (0 its foot .. 1 the sheet's top); hm the sheet's height and wm the front's half breadth, metres; tK how much
      // tearing its size on the screen can carry; lit its strength; pale the hour's paleness; Qs the sheet's half
      // breadth in the front's own; red: how near molten sulphur it stands. It is the ribbon's near law on a
      // short line: A BED, a low bright layer an eighth to a third of the sheet high, azure, pale along its
      // foot, its top rising and sinking along it; and A ROW OF TONGUES rooted in the bed, one to every half
      // of the sheet's height across (0.28 to 0.6 m), each a lick of the one law of a height of its own,
      // between a fifth and the whole of what the sheet holds, broad for its height, soft, thinning away
      // toward its tip, climbing and tearing off on a round of its own. Toward its two ends the bed and the
      // tongues fall away, unevenly: it has no end wall. Front beside front, each laid over the other, they
      // are one fire with a wandering top. It answers as tongueLight does.
      vec4 frontLight(vec2 uv, float sd, float hm, float wm, float tK, float lit, float pale, float Qs, float red){
        float xm = uv.x * wm, ym = uv.y * hm, slow = nR(vec2(xm * .09 + sd * 5.3, sd * 3. + uTime * .03));
        float endK = 1. - smoothstep(.5, 1.05, abs(uv.x) + (nG(vec2(sd * 9. + uv.x * .3, uv.y * .7 + uTime * .1)) - .5) * .3);
        float bedH = hm * (.12 + .2 * slow) * endK, cw = clamp(.5 * hm, .28, .6), xs = xm / cw + fract(sd * 3.7), ci = floor(xs + .5);
        float eat = (nG(vec2(xm * .2 + sd * 7., ym * .45 - uTime * .9)) - .5) * .5 * tK, dT = -9., bT = 0., tT = 0.;
        for (int k = -1; k <= 1; k++) { float cj = ci + float(k), h1 = fract(sin(mod(cj, 1024.) * 12.9898 + floor(sd * 997.) * 4.1414) * 43758.5453), h2 = fract(h1 * 57.31);
          float a = fract(uTime * (.5 + .5 * h2) + h1 * 9.), hb = mix(.66, 1., pow(a, .7));
          float hg = max(hm * .76 * (.2 + .8 * h1 * h1) * (.7 + .3 * slow) * endK, .04), wT = min(.24 + .34 * hg, cw * .85);
          vec2 q = vec2((xs - cj - (h2 - .5) * .5) * cw / wT, (ym - bedH * .4) / hg);
          float dk = lickD(q, 0., (h1 - .5) * .8, .8, hb, 1.5 + h2, h1 * 40., hg, tK);
          vec2 c = vec2((h1 - .5) * .8 * mix(.8, 1.1, a), mix(.9, 1.22, a)), rr = vec2(.32 - .16 * a, .2 - .08 * a);
          // (a low tongue of a slick is soft and has no point: its light comes up over half of its half
          // breadth, and from a third of its height it thins away to four tenths at its tip: it stands up
          // plainly against the dark crust behind it)
          dT = max(dT, dk); bT = max(bT, smoothstep(-.05, .5 / (1. + .8 * red), dk + eat) * (1. - .6 * smoothstep(.35, 1., q.y / hb))); tT += max(1. - length((q - c) / rr) + eat * 1.5, 0.) * (1. - a) * (1. - a) * tK; }
        float bedTop = bedH * (.7 + .6 * nA(vec2(xm * .11 + sd * 3., uTime * .35 + sd))) * (1. + 1.4 * eat), bd = clamp(1. - ym / max(bedTop, 1e-3), 0., 1.);
        float fl = nB(vec2(xm * .16 + sd * 3., ym * .5 + sd * 9. + uTime * .2)), streak = nA(vec2(xm * .35 + sd, ym * .25 - uTime * 1.1));
        float fringe = smoothstep(-.3, .1, dT + eat) * (1. - bT) * (1. - red); tT *= 1. - .7 * red;
        float light = max(bT, sqrt(bd)), hid = min(light * (1. + 9. * red), 1.);
        // (the tongues are the body's deep blue, brightest where they leave the bed; THE FEET ARE BRIGHT: the bed's
        // lowest third is azure and its foot line pale)
        vec3 col = FIRE_FRINGE * (.45 * fringe + .9 * (hid - light)) + FIRE_BODY * (min(max(bT, .85 * sqrt(bd)) + .5 * tT, 1.) * (1.35 + .4 * streak + .3 * bd)) + FIRE_INNER * min(bd * 1.5 + .5 * tT, 1.)
          + FIRE_HEART * (bd * bd * bd * (.25 + .5 * fl * fl) * .9 * (.75 + .25 * streak));
        float k = lit * (1. - smoothstep(.85, 1., abs(uv.x) / Qs)) * (1. - smoothstep(.93, 1., uv.y)); col *= k;
        col = mix(col, vec3(.5, .55, .8) * dot(col, vec3(.1, .3, .4)), pale);
        return vec4(col, FIRE_HIDES * min(hid + .8 * tT + .4 * fringe, 1.) * k * (1. - pale)); }
      void main(){
        // (the tongue bends down the wind inside its sheared sheet: its middle line stands lx y (1 - y) half
        // breadths from the sheet's own; every tongue is turned left or right by its seed; a hotter tongue's heart
        // is broader, taller and brighter; its light dies away toward the sheet's sides)
        float y = vUv.y, sd = vS.x, flip = fract(sd * 91.7) < .5 ? -1. : 1.;
        if (vT.z < 0. && vT.x > .5) {
          // A SLICK: FIRE ALONG THE EDGES OF THE CRUST AFLOAT, AND ITS GLOW ON THE WATER. Not a sheet over the
          // whole: the crust stays dark and is seen. A slow field of the place on the water (W: the same for
          // every slick, so slick over slick the lines run on) parts crust from water in lobes a metre and a
          // half to three across, slowly changing: along that parting runs THE RIM, a thin bright line of low
          // flame a third of a metre across, electric blue, pale along its very middle, flickering along
          // itself; on the crust's side finer lines of the same fire follow its cracks; on the water's side lies
          // a deep blue glow, strongest against the rim. It hides what lies under it only along the lines
          // (nine tenths there), three tenths beside them and a tenth over the water: never a pale haze.
          vec2 W = vS.zw; float r = length(vUv), n1 = nR(W * .085 + vec2(uTime * .012, 0.)), n2 = nG(W * .21 - vec2(uTime * .05, uTime * .03));
          float f = .62 * n1 + .38 * n2 - .5, edge = smoothstep(0., .35, 1. - r - (n2 - .5) * .5) * vS.y;
          float rim = 1. - smoothstep(.02, .07, abs(f)), near = 1. - smoothstep(0., .22, abs(f)), wet = smoothstep(0., -.06, f);
          float cr = nB(W * .12 + vec2(uTime * .02, -uTime * .015) + (n2 - .5) * .25); cr *= cr;
          float fk = .55 + .45 * nA(vec2(W.x * .31 + W.y * .17, W.y * .29 - W.x * .13 + uTime * .4)), ln = max(rim, .7 * smoothstep(.55, .85, cr) * (1. - wet)) * fk;
          vec3 c = (FIRE_BODY * (1.75 * ln + (.34 * near + .16 * wet) * (1. - ln)) + FIRE_INNER * ln + FIRE_HEART * (.3 * rim * rim * fk)) * edge;
          gl_FragColor = vec4(mix(c, vec3(.5, .55, .8) * dot(c, vec3(.1, .3, .4)), uFlame.y), FIRE_HIDES * (.9 * ln + (.3 * near + .1 * wet) * (1. - ln)) * edge * (1. - uFlame.y)); }
        else if (vT.z < 0.) {   // (a halo: pure blue light added to what is behind it, strongest at its middle, nothing at its rim)
          float k = max(1. - dot(vUv, vUv), 0.); vec3 c = vec3(0., .16, .9) * (vS.y * k * k);
          gl_FragColor = vec4(mix(c, vec3(.5, .55, .8) * dot(c, vec3(.1, .3, .4)), uFlame.y), 0.); }
        // (its foot is soft and round: its light comes in from nothing over the lowest tenth of its height at its
        // middle line, and over three tenths more at one half breadth aside: a tongue that stands on the lip of a
        // step is seen from below, and a sheet's straight lower edge is a hard level cut there)
        else if (vS.w > .2 * vS.z) gl_FragColor = frontLight(vUv, sd, vS.z, vS.w, vT.y, min(vS.y, 1.), uFlame.y, vT.z, vRed) * smoothstep(0., .06, y);   // (a front: see the build's A FRONT OF FIRE)
        else { vec2 p = vec2((vUv.x + vT.x * y * (1. - y)) * flip, y); float edge = 1. - smoothstep(.7, 1., abs(vUv.x) / vT.z);
          vec4 t0 = tongueLight(p, sd, vS.z, vS.w, vT.y, step(1.2, vS.y), min(vS.y, 1.), uFlame.y, edge, vRed);
          // (A TONGUE OF A COURSE (told on as 1.1) IS A KNOT OF A RUN: beside it, in the same sheet, stand two
          // lower tongues of the one law, six tenths as broad, the one 0.42 to 0.67 of its height and the other
          // 0.36 to 0.66, each on a round of its own, their feet 0.8 of a half breadth to either side; the
          // tall one is laid over them. Knot beside knot, a metre apart or less, they are one run of fire.
          // Their feet come in over the lowest tenth of the sheet, a little more toward its sides)
          if (vS.y > 1.05 && vS.y < 1.15) { float ra = .42 + .25 * fract(sd * 17.3), rb = .36 + .3 * fract(sd * 29.1);
            vec4 t1 = tongueLight(vec2((p.x - .78) / .62, p.y / ra), sd + .37, vS.z * ra, vS.w * .62, vT.y, 0., 1., uFlame.y, edge, vRed);
            vec4 t2 = tongueLight(vec2((p.x + .8) / .58, p.y / rb), sd + .71, vS.z * rb, vS.w * .58, vT.y, 0., 1., uFlame.y, edge, vRed);
            t1 += t2 * (1. - t1.a); gl_FragColor = (t0 + t1 * (1. - t0.a)) * smoothstep(0., .1 + .1 * vUv.x * vUv.x, y); }
          else gl_FragColor = t0 * smoothstep(0., .1 + .3 * vUv.x * vUv.x, y); }
        gl_FragColor.rgb = gl_FragColor.rgb * vAir.a + vAir.rgb * gl_FragColor.a;   // (seen through the bowl's air, taken at the tongue's own place)
      }` });
}

// ---------- the curtains: the body of every burning line is a standing ribbon of flame that follows the line ----------
// A curtain is a strip laid along its line by the world: at each metre of the line a foot (position), the way and the
// height the flame stands there (aT.xyz, metres; aT.w: 0 at the foot, 1 at the top) and aU: the line's own metres
// there (each ribbon of a line counts from a start of its own), the ribbon's seed, how hard the line burns there
// (0..1), the main channel's metres there (negative: it burns always; else by the pour's law).
// and aF, four numbers worked out in the build from the ribbon's own feet: how fast the burning sulphur runs along
// the line, metres a second (signed: toward the lower end; nought on a level line); the mark of a line that is a
// turned stroke (nought on every other line; 1 on a wall's seam, and more by how tall the flame stands on the
// whole: 1.6 m to one, 4.4 at the most; a fall of fire's line 4 at the least; a short hanging strand that
// drips, 5); the true metres along the ribbon's feet; and how hot the fire burns there (0..1: at a stroke's head
// and where its line breaks over a ledge; below nought: how deep it stands in the mist at a great fall's foot).
// On a line of a great fall, which the build lays in the fall's own plane, the first number of aF is the plane's
// place, aT its way out of the rock times the flame's height, and the first number of aU the two reaches by
// which the line's body is filled toward its neighbours (packed: see the build).
// THE RIBBON IS THE LINE'S FRONT OF FLAME, one law, its form chosen by the pixel's footprint at its distance from
// the eye's place (that distance times the breadth of a pixel: uPx), and by it alone. Where a tongue can be drawn
// as a tongue it is THE BED OF FIRE: a low continuous layer of flame along the whole line, brightest at its foot,
// soft at its top, with a row of tongues rooted in it, each climbing and tearing off on a round of its own; the
// river's tiles and the licks (below) lie and stand in it and about it. Where a pixel covers more than 0.08 m
// the tongues begin to run together, and from 0.26 m it is ONE RAGGED STROKE: a thin pale cyan core along
// its foot (a tenth of its height), an electric blue body over it, azure toward its inside, a torn top whose knots
// travel down the line at the sulphur's speed on the world's clock. It is never drawn lower than six pixels. A
// sheet seen edge-on shows nothing (shading). It leans down the wind (the wind's law, by how far east it
// stands), more toward its top.
// A WALL'S SEAM AND A FALL OF FIRE ARE NOT SHEETS THAT STAND UP FROM THEIR LINE: each is one stroke about its
// line, turned to the eye's place, in true metres at every distance (see the shaders): a seam narrow, fire in a
// crack with its light on the rock to both sides; a fall a broad body in which the fire is seen to fall.
// All of it is laid over what stands behind it by the tongue's law: it writes no depth.
function curtainMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...FIRE_BLEND,
    vertexShader: /* glsl */`
      attribute vec4 aT, aU, aD, aF; uniform float uTime, uPx; uniform vec4 uWind; uniform vec2 uFlame, uBay;
      ${GLSL_LAWS}
      ${GLSL_AIR}
      varying vec4 vC, vAir, vF; varying float vH, vRed, vFar; varying vec3 vP, vN, vB, vE, vR; varying vec2 vUp;
      void main(){
        vRed = moltenAt(position);   // (how near molten sulphur its foot stands: for its edge, see the tongue's law)
        float y = aT.w, on = aU.w < 0. ? 1. : .55 + .45 * pourBurn(aU.w);
        // (vFar: 1 on a wall's seam and on a fall of fire, whose ribbon is a stroke turned to the eye's place, nought
        // on every other line: see below; such a line's flame is taken even along it, by aD's fourth number)
        vec3 toE = cameraPosition - position; float dE = length(toE); vFar = min(aF.y, 1.);
        vec3 T = aT.xyz * (uFlame.x * on * mix(1., aD.w, vFar)); float h = length(T);
        // (a filter by the pixel's footprint: a burning ground line's ribbon is never drawn lower than six pixels at
        // its distance from the eye's place. A TURNED STROKE IS NOT MADE TALLER: its fire keeps its own metres at
        // every distance, and only its sheet is kept two and a half pixels to either side, for its soft edge to lie
        // in: what is thinner than a pixel is the fainter by as much, so a far seam is a thin faint line and a far
        // fall a blue body, neither a block of light)
        T *= mix(max(1., 6. * dE * uPx / max(h, .02)), 1., vFar) * step(1e-4, h); h = length(T);
        vec2 q = position.xz - uBay; float east = clamp(((q.x - q.y) * .7071 + 78.) / 120., 0., 1.);
        vec2 wd = mix(uWind.zw, uWind.xy, windLean(east));
        float sway = .1 * sin(uTime * 1.3 + aU.x * .7 + aU.y * 40.);
        // (A WALL'S SEAM AND A FALL OF FIRE ARE STROKES ABOUT THEIR LINE, TURNED TO THE EYE'S PLACE. A sheet that
        // stands out from the wall is seen from across the bowl along its thin way, as hairs, and from beside it as
        // a card standing off the rock. So the sheet lies across the line of sight about the line's own run (aD),
        // the line down its middle, bh to either side: 1.1 of the flame's height on a seam (the fire's own reach is
        // far less: see the fragment's law; the rest is for its light on the rock), 1.45 on a fall of fire (whose
        // own body reaches 1.3 at the most: the air the world keeps clear about it; and as far as the fall's next
        // line where the fall is filled: below), and never under two and a half pixels. IT LIES IN THE ROCK'S FACE: its corners are not moved toward the eye; only its depth is taken
        // a little nearer the eye's place (how far: below), so that the rock it lies in does not cut it and it
        // does not shift against the rock as the eye goes by.
        // THIS READS THE EYE'S PLACE, as a tongue's sheet does. vUp.x: how far the sheet's one side is the upper
        // one, -1 to 1: nought on a line that runs straight down, more on one that runs aslant: fire rises.
        // vUp.y: how much of the line's length the eye sees: 1 from broadside, nought looking along it.)
        float bh = max(mix(1.1, 1.45, smoothstep(3.5, 4., aF.y)) * h, 2.5 * dE * uPx) * step(1e-4, h);
        vec3 ac = cross(aD.xyz, toE);
        // (A FALL IS FILLED FROM LINE TO LINE: fl, the metres the body reaches toward the fall's next line on the
        // one side of the stroke and on the other: the build's two reaches (in aU's first number; see there),
        // by how much of the fall's breadth the eye sees from where it stands; the sheet is broad enough for them)
        // (vE: how far the fall's two sides stand from the line's point, metres across the fall, the one against
        // the plane's level way and the one along it (the build's: aF's third number, see there); and how much
        // of the fall's breadth the eye's place sees across the stroke: A SIZE WITH NO SIGN, never taken under
        // 0.15 at any point, so between two points it never comes near nought; it serves the fill's reach, how
        // far a side may be let out and the softening of the fall's sides. A stroke with no fall's plane stands
        // deep inside.
        // WHICH OF THE STROKE'S TWO SIDES LIES ALONG THE LEVEL WAY CHANGES ALONG A LINE: where its run passes the
        // level way as the eye's place sees it (a line that runs along a ledge, an end carried across one) the
        // sheet stands over and under the line and neither side is the one along the level way. There the
        // fill's two reaches change places, both small. And the place across the fall is worked out from no
        // side: vR is the way from the line's point to this corner of the sheet, and the fragment's law carries
        // it on along the line from the eye's place to the fall's plane: see the fall's sides there.
        // A RUN-OUT (the build's number below nought) has no side in the fall's count: its two distances are 240,
        // the mark by which the fragment's law leaves it the torn edge of a line alone)
        vec2 fl = vec2(0.); vE = vec3(60., 60., 1.);
        if (aF.y > 3.75 && abs(aF.x) < 1e8) { float ca = dot(ac, normalize(vec3(-aT.z, 0., aT.x) + vec3(1e-6, 0., 0.))) / max(length(ac), 1e-3 * dE);
          fl = vec2(floor(aU.x) / 32., fract(aU.x) * 25.) * (abs(ca) * step(1e-4, h)); vE = vec3(floor(aF.z) / 8., fract(aF.z) * 64., max(abs(ca), .15));
          if (aF.z < 0.) vE.xy = vec2(240.);
          if (ca < 0.) fl = fl.yx; bh = max(bh, 1.25 * max(fl.x, fl.y)); }
        vec3 turned = ac * ((2. * y - 1.) * bh / max(length(ac), 1e-3 * dE)); vUp = vec2(ac.y / max(length(ac), 1e-3 * dE), length(ac) / max(dE, 1e-3)); vR = turned;
        vec3 pos = position + mix(T * y + vec3(wd.x, 0., wd.y) * (y * y * h * (.22 + sway)), turned, vFar);
        // (vN: the sheet's face there: across the line's run and the flame's way; on a turned stroke the way the build
        // gave it, which on a fall of fire is the normal of the fall's own plane; vB: a turned stroke's half breadth, metres)
        vC = vec4(aU.x, y, aU.y, aU.z * (.4 + .6 * on)); vH = max(h, .05); vP = pos; vF = aF; vN = vFar > .5 ? aT.xyz : cross(aD.xyz, T / max(h, 1e-3)); vB = vec3(bh, fl);
        gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.); vAir = airAt(pos);
        // (a seam's depth is taken three tenths of its flame's height nearer, 1.2 m at the most: it is a narrow fire
        // and stays behind every nose of rock that stands before its crack; a fall's, by its half breadth, to 6 m)
        if (vFar > .5) { vec4 cn = projectionMatrix * viewMatrix * vec4(pos + toE * (mix(min(.3 * h, 1.2), min(bh, 6.), smoothstep(3.5, 4., aF.y)) / max(dE, 1e-3)), 1.); gl_Position.z = cn.z * gl_Position.w / cn.w; }
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec2 uFlame;
      ${GLSL_NOISE}
      ${GLSL_TONGUE}
      uniform float uPx;
      varying vec4 vC, vAir, vF; varying float vH, vRed, vFar; varying vec3 vP, vN, vB, vE, vR; varying vec2 vUp;
      void main(){
        float y = vC.y, sd = vC.z, ym = y * vH;
        if (vFar > .5) {
          // THE TURNED STROKE: FIRE IN A CRACK, AND FIRE THAT FALLS. All of it is in true metres about the line
          // (ymS: the metres out from the line; side: which side; fwm: the metres a pixel covers across it), the
          // same from every distance: what a pixel cannot hold is not made larger, it is the fainter.
          // mark: 1 on a low seam, to 5 where the flame stands tall (a fall of fire is 4 at the least; tall: 1 on one).
          // ITS BODY reaches wb to either side. A SEAM IS NARROW, fire in a crack: three tenths of its flame's
          // height, and never more than 0.45 m and a tenth of that height, however far the flame stands out from
          // the wall: a broad stroke stands off the face and makes a squiggle of every bend of the crack. A fall is
          // a broad sheet: nine tenths of its flame's height. Its edge swells and draws in in slow
          // lobes of some 3 m, each side's its own, and is torn into tongues half a metre broad that lean up the
          // rock and climb it on the world's clock (uu: the line's metres taken the further up the further out).
          // Lines that lie close run into one body: each is laid over the others as a tongue is, and none adds.
          // (us: the line's metres as they travel with the sulphur; on a fall of fire the world's own height, falling at 6 m a second)
          float mark = max(vF.y, 1.), tall = smoothstep(3.5, 4., mark), hR = vH * (.3 + .7 * min(vC.w, 1.)), us = tall > .5 ? vP.y + 6. * uTime : vF.z - vF.x * uTime;
          // (ON A FALL'S STROKE THE METRES OUT FROM THE LINE ARE THE SHEET'S OWN: the length of the way from the
          // line's point to this spot (vR). Where a line's run passes the line of sight between two points (it
          // runs out over a ledge toward an eye that stands below) the sheet about it turns over within that one
          // piece, and its one edge crosses the line; told off by the place, the fire is whole about the line
          // there too, and only the sheet's own edge fades. A seam's are its sheet's own count)
          float side = y > .5 ? 1. : -1., ymS = vF.y > 3.75 ? length(vR) : abs(2. * y - 1.) * vB.x, fwm = max(fwidth(ymS), 1e-4), wb = mix(min(.3 * hR, .45 + .1 * hR), .9 * hR, tall), a = ymS / max(wb, 1e-3);
          // (on a fall the tongues are a metre broad, lean less and tear the edge half as deep, and the edge is softer:
          // a line of a fall alone is a soft body of fire, not a spine with barbs)
          // (fs: how much of the line's length the eye sees. A tongue told off in the line's own metres is drawn thin
          // as a hair where the eye looks along the line: so the tearing of the edge is taken the coarser along
          // the line by as much, in steps of two that pass into one another, and keeps its breadth to the eye)
          float dn = vF.x < 0. ? -1. : 1., uu = vF.z + dn * (ymS * mix(1.2, .5, tall) + uTime * .5), fs = clamp(vUp.y, .125, 1.), oc = -log2(fs), fo = exp2(-floor(oc)) * mix(.22, .11, tall);
          float lobe = nR(vec2(us * .045 + sd * 5.3 + side * 3.1, sd * 3. + uTime * .03));
          float lick = mix(nG(vec2(uu * fo + sd * 7. + side * 5., a * .7 - uTime * .35 + sd)), nG(vec2(uu * fo * .5 + sd * 7. + side * 5., a * .7 - uTime * .35 + sd)), fract(oc));
          // (A FALL'S EDGE IS TORN INTO TONGUES THAT RISE: told off in the world's own height, 0.7 m broad and some 2 m
          // tall, they climb at 3.5 m a second while the fire falls behind them, and where one stands clear of the
          // edge it has let go)
          lick = mix(lick, nG(vec2(side * ymS * .18 + sd * 7., vP.y * .057 - uTime * .2 + sd)), tall);
          // (FIRE RISES: on a line that runs aslant, as down a slope at a fall's foot or along a slanting crack, the
          // side of the stroke that is the upper one (su: by how much, as the eye sees it) reaches up to 1.45 times
          // as far and is torn up to 1.8 times as deep; the lower side draws in to a third: a bed with
          // flames standing up from it, not a blade lying along the slope. A fall's body is the fuller)
          // (from near the edge is torn deeper and stands crisper: nr, all of it where a pixel covers under a fiftieth
          // of the reach, none from an eighth)
          float su = side * vUp.x, rs = 1. + (su > 0. ? .45 : .65) * su, nr = 1. - smoothstep(.02, .125, fwm / max(wb, 1e-3));
          // (and on a side on which the fall's next line stands the body reaches toward it, as far as the build
          // counted: there it is filled, not torn. The lower side of a fall's line that runs aslant has no edge:
          // it dies away from the line outward)
          // (a stroke of a fall that has a plane reaches its whole way on a side with no next line: the fall's
          // sides are torn by the fall's own law, on its plane: below. A RUN-OUT, which the fall's count of its
          // sides leaves out (vE's first number is 240 on it), is not torn by that law: it keeps the torn edge
          // a line alone has, its lobes and its tongues, and is no straight band beside the torn body)
          float topM = max(wb * rs * mix(clamp(mix(.28, .42, tall) + mix(.5, .45, tall) * lobe + (lick - .5) * mix(.7, mix(.35, .8, nr), tall) * (1. + .8 * max(su, 0.)), .06, 1.), 1., step(3.75, vF.y) * step(vF.y, 4.7) * step(abs(vF.x), 1e8) * step(vE.x, 200.)), side > 0. ? vB.z : vB.y), soft = max(fwm * 1.5, mix(.4, mix(mix(.65, .35, nr), 1., max(-su, 0.)), tall) * topM), body = smoothstep(0., soft, topM - ymS);
          // (gr: how far out toward its edge a place lies, 0 at the line, 1 at the edge: the fire is brightest and
          // azure along its line and a deep blue toward its torn edge)
          float gr = clamp(ymS / max(topM, 1e-3), 0., 1.);
          // (IN IT THE FIRE FALLS: long streaks, some 10 m by an eighth of the body's reach, and finer ones of 4 m,
          // run down the line at the sulphur's speed: deep electric blue between them, bright on them, brightest
          // where the fall breaks (brk: knots a metre and a half long). Where a pixel covers more than a streak's
          // breadth the streaks are taken at their mean: from afar they are never a sum of bright lines or of spots.
          // And the whole body surges: slow swells some 15 m long that go down with the fire, by a third darker
          // and a quarter brighter: these a far eye still sees fall)
          float st = .55 * nR(vec2(a * 1. * side + sd * 3.3, us * .012 + sd)) + .45 * nG(vec2(a * 2. * side + sd * 9.1, us * .03 + sd * 2.));
          st = mix(st, .5, smoothstep(.03, .12, fwm / max(wb, 1e-3))); float brk = nB(vec2(us * .09 + sd * 5.3, uTime * .11 + sd * 3.)); brk *= brk;
          float surge = .6 + .5 * nR(vec2(sd * 3.7 + a * side * .04, us * .008 + sd * 5.));
          // (THE CRACK'S OWN LINE: a thin pale thread down the middle, six hundredths of the reach to either side:
          // strong in a low seam, faint in a fall, whose many lines would else stand as a comb; thinner than a
          // pixel it is the fainter by as much, and so are all the far ones together: no white column.
          // THE LIGHT ON THE ROCK to both sides dies away over a third of the flame's height, 0.3 m at the least,
          // and is the fainter where a pixel covers more than that.
          // hot: AT ITS HEAD AND WHERE IT BREAKS over a ledge the fire burns hottest: its body a quarter brighter,
          // and on a fall its pale thread up to four times as broad and three times as strong)
          float hot = max(vF.w, 0.), am = 0., drp = step(4.7, vF.y), hc = max(.06 * wb, .03) * (1. + 3. * hot * tall), core = (1. - smoothstep(.3 * hc, hc, ymS)) * min(1., hc / fwm) * mix(.85, mix(.15 + .3 * hot, .5, drp), tall);
          float hs = max(.35 * hR, .3), halo = exp(-ymS / hs) * min(1., hs / (2. * fwm)) * (1. - .7 * body);
          // (A SHORT STRAND THAT HANGS AND LETS GO (the build's mark of it: 5): whole where it holds to the rock, at its
          // head, it breaks up as it falls: toward its lower end it is drops of fire, half a metre long and less,
          // that fall at 5 m a second with gaps between them. Its light is the crack's law's, not the broad fall's: a
          // pale thread down its middle, streaks that run down it, a deep blue toward its edge; an eighth dimmer)
          float dr = mix(1., smoothstep(.42, .6, nG(vec2(sd * 9., (vP.y + 5. * uTime) * .2))), drp * smoothstep(.15, .9, 1. - hot)) * (1. - .125 * drp);
          float kk = smoothstep(0., .25, vC.w) * (1. - smoothstep(.85, 1., abs(2. * y - 1.))) * dr, hid = min(body * (1. + 9. * vRed), 1.);
          vec3 sc = (FIRE_BODY * (body * (.95 + .7 * st + .2 * brk) * surge * (1. + .25 * hot) * mix(1.2, .75, gr * nr) + .25 * halo) + FIRE_FRINGE * (.9 * (hid - body)) + FIRE_INNER * (body * mix(st, 1.5 * (1. - gr), nr)) + FIRE_HEART * core) * kk;
          // A FALL OF FIRE IS ONE BODY. The light inside a fall's stroke is told off BY THE PLACE in the world, not by
          // the stroke: where the strokes of lines that lie close cover one another they show one and the same
          // fire, and no line's own middle or edge stands in it as a stripe. In it the fire falls in sheets,
          // threads and hollows of unlike breadth and speed (the grain: below); deep blue between the sheets,
          // electric blue on them. AT ITS HEAD, ON A LEDGE AND WHERE IT LANDS ON ONE (hot) the deep blue between
          // its sheets is filled: the fire is bright all across and azure, and only there do the crests of its
          // sheets turn pale. From afar the noise's own filter leaves the mean.
          // (Q: THE PLACE the fire is told off at: where the line from the eye's place through this spot of the
          // stroke meets the fall's own plane (vN, and vF.x: the build's). The strokes of a fall stand at unlike
          // depths, each turned to the eye's place about its own line; told off on the one plane they show the
          // same fire wherever they cover one another, from wherever the eye stands. THIS READS THE EYE'S PLACE.
          // The place is never taken nearer than half nor further than twice the stroke's own distance; a fall
          // too small to have a plane is told off at the stroke's own spot)
          // (cA: the place's metres across the fall, along the plane's level way; its height is the world's own)
          // (off: HOW FAR ACROSS THE FALL THIS SPOT LIES FROM ITS LINE'S POINT, metres along the level way, with
          // its sign: the way from the line's point to this spot of the sheet (vR), carried on along the line
          // from the eye's place until it lies in the plane's own ways through that point. It is worked out
          // from places, not from which side of the stroke the spot is on, so it runs on unbroken where a
          // line's run passes the level way and the stroke's sides change places. The line from the eye's
          // place is taken to stand at least 0.15 of its length out of the plane: nothing is divided by less)
          if (tall > .5 && drp < .5) { vec3 Q = vP, tP = vec3(.7071, 0., .7071); float off = 0.;
            if (abs(vF.x) < 1e8) { vec3 nP = vN / max(length(vN), 1e-6), ray = vP - cameraPosition; float den = dot(nP, ray), dg = max(abs(den), .15 * length(ray)) * (den < 0. ? -1. : 1.); den = abs(den) < 1e-3 ? 1e-3 : den;
              Q = cameraPosition + ray * clamp((vF.x - dot(nP, cameraPosition)) / den, .5, 2.); tP = normalize(vec3(-nP.z, 0., nP.x) + vec3(1e-6, 0., 0.));
              off = dot(vR, tP) - dot(vR, nP) * dot(ray, tP) / dg; }
            float cA = dot(Q, tP), Y1 = Q.y + 4.5 * uTime, Y2 = Q.y + 9.5 * uTime, Y3 = Q.y + 15. * uTime, Y4 = Q.y + 7.5 * uTime;
            // (THE FIRE'S OWN GRAIN, four things at four speeds, all told off on the plane. BROAD SLOW SHEETS,
            // some 6 m across and 30 m long, at 4.5 m a second, whose folds wander from side to side by a metre
            // and a half as they go; finer ones of a metre by 10 m at 9.5 over them. FAST BRIGHT THREADS, a
            // third of a metre by some 3 m, at 15 m a second, few, and brightest where they run through a sheet. DARKER HOLLOWS, some
            // 6 m across and 14 m tall, soft, that travel down at 7.5 m a second: in one the fire is six tenths
            // as bright and deep blue. Slow swells go down through all of it)
            float sh = nR(vec2((cA + 3. * (nG(vec2(cA * .011 + .7, Y1 * .004)) - .5)) * .022, Y1 * .0045)), fi = nG(vec2(cA * .11 + .11, Y2 * .012));
            float fl = smoothstep(.32, .68, .65 * sh + .35 * fi), sw = nR(vec2(cA * .012 + .5, Y1 * .0045 + .37));
            float thr = smoothstep(.6, .8, nA(vec2(cA * .33 + .21, Y3 * .014))) * (.3 + .7 * fl);
            // (hq: WHERE THE FIRE STRIKES A LEDGE AND AT ITS HEAD it is the brightest and the most broken: the
            // build's hot reach (each line's own length of it) is broken into knots under a metre across and
            // 2 m tall that fall at 3 m a second and boil; a hot place has no hollow)
            float hq = clamp(hot * (.35 + 1.3 * nB(vec2(cA * .16 + 2.3, (Q.y + 3. * uTime) * .07 + uTime * .15))), 0., 1.);
            float hol = smoothstep(.55, .9, nB(vec2(cA * .022 + .4, Y4 * .0095))) * (1. - hq);
            // (THE FALL'S SIDES ARE TORN. dEd: how far inside the fall's nearer side this place lies, metres
            // across the fall (below nought: outside its outermost line): the build's two distances from the
            // line's point and off, this spot's own place across the fall from that point (above). The share
            // of the fall's breadth the eye's place sees across the stroke (vE's third number: a size with no
            // sign, 0.15 at the least at every point) only sets how far the side may be let out and how soft
            // it is. THIS READS THE EYE'S PLACE, as the fill does. tin: how far the side
            // stands drawn in at this height (or, below nought, how far out the fire may reach): each side
            // wanders in and out in great lobes some 20 m tall that sink at 1.5 m a second and breathe, drawn
            // in by up to three tenths of the fall's breadth there, 7 m at the most, and let out by up to 4 m
            // and never by more than three tenths of the stroke's own reach; on them swells of 7 m of height,
            // 2 m in and out, and small tongues of 0.65 m by 3 m, that climb at 1.2 and at 3.5 m a second
            // while the fire falls behind them (on a narrow fall both are the less, by its breadth: kT). Those
            // two are the plane's, not the side's: fire stands out beyond a place that is drawn in, and
            // strands leave the body and come back to it. A fill between two bodies of one fall is torn by the
            // same law. IT IS THIS LAW AND NOT A STROKE'S STRAIGHT REACH THAT ENDS THE FIRE AT A SIDE: the lobe
            // and the swell together never let the side out further than 0.85 of what this stroke reaches past
            // that side (rT: its reach across the fall less its line's distance from the side), less the
            // tongues' depth; so the tongues, laid on last, tear the edge inside the sheet at every height, and
            // no stretch of a side stands as the straight soft end of a stroke)
            if (abs(vF.x) < 1e8) { float dL = vE.x + off, dR = vE.y - off, dEd = min(dL, dR);
              float big = clamp((nR(vec2(dL < dR ? .21 : .58, (Q.y + 1.5 * uTime) * .0065 + uTime * .004)) - .5) * 3. + .5, 0., 1.);
              float kT = clamp((vE.x + vE.y) / 12., .35, 1.), rT = wb * rs / vE.z - (dL < dR ? vE.x : vE.y);
              float tin = max(min(7., .3 * (vE.x + vE.y)) * smoothstep(.5, .9, big) - min(4., .3 * wb * rs / vE.z) * (1. - smoothstep(.1, .5, big)) + (smoothstep(.3, .7, nG(vec2(cA * .02 + 1.9, (Q.y - 1.2 * uTime) * .02))) - .5) * 4. * kT, -max(.85 * rT - 1.3 * kT, 0.))
                + (nG(vec2(cA * .2 + 4.4, (Q.y - 3.5 * uTime) * .045)) - .5) * 2.6 * kT;
              kk *= smoothstep(-max(1.5 * fwm / vE.z, .5), 0., dEd - tin); }
            sc = (FIRE_BODY * (body * ((mix(.42, 1.15, hq) + (1.35 - .5 * hq) * fl * (.6 + .4 * sw)) * (1. - .4 * hol) + .55 * thr) + .25 * halo) + FIRE_FRINGE * (.9 * (hid - body))
              + FIRE_INNER * (body * (fl * (.15 + 1.2 * hq) * (1. - hol) + .6 * hq + .5 * thr)) + FIRE_HEART * (body * (hq * (.1 + .35 * smoothstep(.5, 1., fl)) + .1 * thr))) * kk;
            // (ITS FOOT STANDS IN ITS OWN LIT MIST: where the build says the fall lands (vF.w below nought: how deep
            // in the mist) the stroke bears, before its fire, the spray the fall throws up, lit by the fire: soft
            // billows some 6 m and 2.5 m across that climb at 1.5 m a second, told off on the fall's plane as the
            // fire is, thick at the foot and torn into the air above it, dying away toward the stroke's sides;
            // the fire is seen through it the fainter the thicker it stands. am: how much of what lies behind
            // the mist hides, eight tenths at the most)
            float mist = max(-vF.w, 0.), bw = .6 * nR(vec2(cA * .02 + 3.7, (Q.y - 1.5 * uTime) * .02)) + .4 * nG(vec2(cA * .05 + 1.3, (Q.y - 1.5 * uTime) * .05));
            am = .65 * smoothstep(0., .5, mist * 1.3 + (bw - .5) * .9 - .15) * (1. - smoothstep(.25, 1., ymS / max(vB.x, 1e-3))) * kk * smoothstep(0., 1., vC.w);
            sc = sc * (1. - am) + (FIRE_BODY * .34 + FIRE_HEART * .05) * ((.5 + bw) * am); }
          sc = mix(sc, vec3(.5, .55, .8) * dot(sc, vec3(.1, .3, .4)), uFlame.y);
          // (the glow on the rock hides a fifth of what lies behind it at the most, as glare does: the rock's own beds show through it)
          gl_FragColor = vec4(sc, FIRE_HIDES * (min(hid + .2 * halo, 1.) * kk * (1. - am) + am) * (1. - uFlame.y));
          gl_FragColor.rgb = gl_FragColor.rgb * vAir.a + vAir.rgb * gl_FragColor.a;   // (seen through the bowl's air)
          return; }
        // (A GROUND LINE'S RIBBON, from here on: ym, the metres up from its foot)
        // (the eye's place is read for shading: a sheet of gas seen edge-on is seen through its thin way and shows
        // nothing: nothing within six degrees of its own plane, and it comes up as it turns its face to the eye,
        // whole from twenty-six degrees: a sheet seen so steeply is a blade, not a flame. Its face is the one
        // across its line's run and its flame's way (vN), even from point to point; a sheet whose flame lies along
        // its own line has no breadth, and shows as much the less)
        float dist = length(cameraPosition - vP), facing = smoothstep(.1, .44, abs(dot(vN, cameraPosition - vP)) / (max(length(vN), .3) * dist));
        // (farK, the pixel's footprint: the bed's tongues begin to run together where a pixel covers more than 0.08 m
        // at the ribbon's distance, and are one stroke from 0.26 m)
        float farK = smoothstep(.08, .26, dist * uPx), hR = vH * (.3 + .7 * min(vC.w, 1.));
        // (us: the line's metres as they travel with the sulphur; run: how hard it runs; ub: the same, drawn
        // down-stream with the height, so what stands on running sulphur leans down-stream)
        float run = smoothstep(1., 4.5, abs(vF.x)), us = vF.z - vF.x * uTime;
        float slow = nR(vec2(us * .045 + sd * 5.3, sd * 3. + uTime * .03)), crest = nB(vec2(us * .09 + sd * 5.3, uTime * .11 + sd * 3.));
        // THE FRONT OF FLAME, one law by the pixel's footprint, laid over what is behind it as a tongue is. From
        // near it is THE BED, a low bright sheet 0.3 to 0.8 m high along the whole line, brightest at its foot,
        // whose crests run down the line at the sulphur's speed; and A ROW OF TONGUES rooted in it, one to every
        // 1.6 m of the line, each a lick of the one law (lickD) with a height and a bend
        // of its own, climbing and tearing off at its tip on a round of its own. On running sulphur they ride
        // down the line at a third of its speed and are drawn down-stream with their height.
        // From afar it is THE STROKE: one ragged body with slow knots. Between the two it passes smoothly.
        float bedH = min((.3 + .35 * slow) * (1. + .4 * run), .45 * hR) * smoothstep(0., .3, vC.w);
        // (the row is told off in true metres along the ribbon's feet, vF.z: the world's own count of a line is not in metres everywhere)
        float cw = 1.6, tH = min(hR * .95, 3.), dT = -9., bT = 0., hT = 0., tT = 0.;
        float xs = (vF.z - vF.x * uTime * .35 - sign(vF.x) * ym * (.15 + .3 * run)) / cw, ci = floor(xs + .5);
        float eat = (nG(vec2(us * .2 + sd * 7., ym * .45 - uTime * .9)) - .5) * .5;
        // (each tongue's own numbers are told off from whole numbers: its place in the row and the ribbon's seed in thousandths)
        for (int k = -1; k <= 1; k++) { float cj = ci + float(k), h1 = fract(sin(mod(cj, 1024.) * 12.9898 + floor(sd * 997.) * 4.1414) * 43758.5453), h2 = fract(h1 * 57.31);
          float a = fract(uTime * (.5 + .5 * h2) + h1 * 9.), hb = mix(.66, 1., pow(a, .7));
          float hg = max(tH * (.5 + .5 * h1) * (.7 + .3 * slow), .05), wT = min(.18 + .2 * hg, cw * .5);
          vec2 q = vec2((xs - cj - (h2 - .5) * .5) * cw / wT, (ym - bedH * .4) / hg);
          float dk = lickD(q, 0., (h1 - .5) * .8, .8, hb, 1.4 + .8 * h2, h1 * 40., hg, 1.);
          vec2 c = vec2((h1 - .5) * .8 * mix(.8, 1.1, a), mix(.9, 1.22, a)), rr = vec2(.32 - .16 * a, .2 - .08 * a);
          dT = max(dT, dk); bT = max(bT, smoothstep(0., .38 / (1. + .8 * vRed), dk + eat)); tT += max(1. - length((q - c) / rr) + eat * 1.5, 0.) * (1. - a) * (1. - a);
          hT = max(hT, smoothstep(0., .16, lickD(q, 0., (h1 - .5) * .4, .16, hb * .62, 1.2, h1 * 40., hg, 1.) + eat * .15)); }
        // (the bed: its top rises and sinks along the line; its light falls from its foot to nothing at its top,
        // and bright crests run through it down the line)
        // (its top is torn into small licks by the same noise that eats the tongues)
        float bedTop = bedH * (.7 + .6 * nA(vec2(us * .11 + sd * 3., uTime * .35 + sd))) * (1. + 1.4 * eat), bd = clamp(1. - ym / max(bedTop, 1e-3), 0., 1.);
        float fl = nB(vec2(us * .16 + sd * 3., ym * .5 + sd * 9.)), streak = nA(vec2(us * .35 + sd, ym * .25 - uTime * 1.1));
        float fringe = smoothstep(-.3, .1, dT + eat) * (1. - bT) * (1. - vRed); tT *= 1. - .7 * vRed;
        // (the same light as a tongue's: the body never more than one body's; the heart a thin line up each tongue of
        // the row, and thin bright crests low along the bed's foot)
        // (hidN: how much the near front hides; what its edge hides beyond its own light by molten sulphur it gives the fringe's deep blue, as a tongue does)
        float lightN = max(bT, sqrt(bd)), hidN = min(lightN * (1. + 9. * vRed), 1.);
        vec3 nearC = FIRE_FRINGE * (.45 * fringe + .9 * (hidN - lightN)) + FIRE_BODY * (min(max(bT, .85 * sqrt(bd)) + .8 * tT, 1.) * (1.5 + .45 * streak)) + FIRE_INNER * min(smoothstep(.22, .55, dT + eat) + .5 * tT, 1.)
          + FIRE_HEART * (max(hT, bd * bd * bd * fl * fl) * .9 * (.75 + .25 * streak));
        // (the stroke: its top soft over a third of its height, its thin bright core along its foot, a seventh of
        // its height, spread over the pixel when it is thinner than one)
        float top = min(hR * (.24 + .3 * slow + .46 * crest * crest), vH * .92);
        float fw = fwidth(ym), hc = .14 * top, soft = max(fw * 1.5, .35 * top), body = smoothstep(0., soft, top - ym);
        vec3 farC = FIRE_BODY * (body * (1.5 + .45 * streak)) + FIRE_FRINGE * (.9 * (min(body * (1. + 9. * vRed), 1.) - body)) + FIRE_INNER * smoothstep(.3 * top, max(fw * 3., .8 * top), top - ym)
          + FIRE_HEART * ((1. - smoothstep(.2 * hc, hc, ym)) * min(1., .86 * hc / max(fw, 1e-4)) * .9);
        // (where the line hardly burns there is no fire; the sheet's face toward the eye: shading)
        float lit = smoothstep(0., .25, vC.w) * facing;
        float kk = lit * (1. - smoothstep(.85, 1., y));
        vec3 sc = mix(nearC, farC, farK) * kk;
        sc = mix(sc, vec3(.5, .55, .8) * dot(sc, vec3(.1, .3, .4)), uFlame.y);
        gl_FragColor = vec4(sc, FIRE_HIDES * min(mix(hidN + .8 * tT + .4 * fringe, body * (1. + 9. * vRed), farK), 1.) * kk * (1. - uFlame.y));
        gl_FragColor.rgb = gl_FragColor.rgb * vAir.a + vAir.rgb * gl_FragColor.a;   // (seen through the bowl's air, taken at each corner of the ribbon)
      }` });
}

// ---------- the licks and the river: the gathered fire of the burning lines, one mesh of two kinds of thing ----------
// The world hands over, along every burning line and about every large tongue's foot, the places where gas burns.
// THE FIRE IS GATHERED, not dealt evenly: of those places the build lets a share stand (LICKS, and the rules at
// the build), each as a TONGUE of the one law (GLSL_TONGUE): an upright sheet turned to the eye's place about its
// own foot, as tall as its place allows and a quarter as broad at the foot (half breadth) as it is tall; in
// clusters of unlike heights about the large tongues, in knots along the ground lines, thinned on the seams. Each
// climbs and tears off on a round of its own on the world's clock and leans down the wind and down-stream.
// And along every ground line that burns lies THE RIVER'S SHEET: TILES laid from point to point of the world's
// own ribbon, level across the line, 0.3 m over it, 1.2 to 4 m broad: a low body of blue fire whose soft billows
// run down the line at the sulphur's speed, with one thin pale thread low in it and a deep blue rim (never a thin
// veil over the glowing bed, which would show pink); where the ground steps down the tile stands as steep as the step
// and the fire falls over it as a curtain (THE POUR), and gathers broader below. A pour has body from its side
// too: a second sheet stands across the first, from the step's face outward, as deep as the first's half breadth.
// All of it is laid over what stands behind it by the tongue's law; nothing here writes depth. A line's halo (kind 1) is drawn
// with the flames, as a halo.
// A tongue: iP: its foot (world), its sheet's height at its tallest (m); iQ: seed, how far east across the slope
// it stands (0..1: the wind's law), the main channel's metres there (negative: it burns always), its strength
// (0..1); iR: its half breadth at the foot (m), how many metres nearer the eye's place its depth is taken (1 to
// 4 for a chimney's own tongue, whose foot is then drawn soft; up to 0.9 for a tongue of a steep fall; 0 for every other: see the head), -, kind (0: a lick of the flame; 2: a lick on the crack's own
// thread: hot, its heart broader and brighter); iF: the line's metres at it (-1: by no line), the sulphur's
// speed, how far its tip is drawn down-stream to a metre of its height (x, z; 9 in x: it stands on a wall's seam).
// A tile (kind 3): iP: its middle (world), its half breadth (m); iQ as a tongue's; iR: the way from the one
// point of the line to the next (m), 3; iF: the line's true metres at its middle, the sulphur's speed, how much
// of a pour it is (0..1), and 1 on a pour's second sheet.
// The eye's place is read for a tongue's turning and for its filters by the pixel's footprint: the tearing is
// left out as a tongue comes under 28 pixels of height, and one whose half breadth comes under a pixel and a half
// is thinned, to nothing at half a pixel (it cannot be drawn, and a row of such would be a scatter of points).
// (HALO: a halo's light at its middle for each unit of the strength the world gives it, which is 0.2 on a line that
// burns its hardest and 0.25 on a large tongue: so 0.11 to 0.14 of pure blue, under a tenth of the body's
// strength. At a fifth, yellow sulphur behind a field of halos is grey-violet: it is held to what keeps it yellow)
const HALO = 0.55;
const SPARKS = { falls: 500, beds: 1000, tongues: 1 };   // (how many more places throw sparks: on the falls of fire (two sparks each), on the large beds; and whether the large tongues do)
// (LICKS: how many of a large tongue's places stand about it; the share of a ground line's places that stand, inside
// a knot; run: the share that stands between the knots too, along a line whose sulphur runs at 3 m/s or more: a
// river of fire bears tongues along its whole length; where the slow field makes a knot (above this, of 0..1) and
// how many metres of ground one turn of the field takes; the share of a seam's places, and of all others, that stand)
// (tall: a tongue's sheet at its tallest, as a share of the height the world gave its place; broad: its half breadth
// at the foot as a share of its sheet's height: the sheet is 1.65 half breadths to a side, so its far corner stands
// 0.785 * (1 + 0.24 * 1.65) = 1.1 of the place's height from its foot at the most: inside the reach the world
// counted. Where it leans the sheet is tilted, not stretched, and is broader only to hold the bend: its light
// still ends within its own length of its foot)
const LICKS = { cluster: 4, river: 0.325, run: 0.25, knot: 0.45, knotMetres: 3.5, seam: 0.41, other: 0.265, tall: 0.785, broad: 0.24 };
function glowMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...FIRE_BLEND,
    vertexShader: /* glsl */`
      attribute vec4 iP, iQ, iR, iF; uniform float uTime; uniform vec4 uWind; uniform vec2 uFlame;
      ${GLSL_LAWS}
      ${GLSL_AIR}
      ${GLSL_NOISE}
      uniform float uPx; varying vec2 vUv, vK; varying vec3 vT; varying vec4 vS, vAir; varying float vRed;
      void main(){
        vRed = moltenAt(iP.xyz);   // (how near molten sulphur it stands or lies: for its edge, see the tongue's law)
        float sd = iQ.x, on = iQ.z < 0. ? 1. : .55 + .45 * pourBurn(iQ.z), hot = step(1.5, iR.w) * step(iR.w, 2.5), y = position.y + .5;
        // (lit: how hard its place burns now: one whose place hardly burns gives no light)
        float lit = smoothstep(.03, .3, iQ.w * on) * (.6 + .4 * min(iQ.w * 1.4, 1.));
        if (iR.w > 2.5) {
          // A TILE OF THE RIVER'S SHEET (kind 3): it lies along its piece of the line, from point to point of the
          // world's own ribbon (iR.xyz: the way from the one to the other, with the ground's fall), level across
          // the line, iP.w metres to either side, 0.3 m over the line's points; over a step of the ground it
          // stands as steep as the step: there the fire falls. Each overlaps the next by its soft ends.
          float len = max(length(iR.xyz), 1e-3), two = iF.w;
          vec3 t = iR.xyz / len, n = normalize(vec3(iR.z, 0., -iR.x) + vec3(1e-6, 0., 0.)), up = normalize(cross(n, t)); up *= sign(up.y + 1e-6);
          // (the second sheet of a pour, iF.w = 1, stands across the first, from the step's face outward: as deep as
          // the first's half breadth, a little more: its outer edge is as far from the line as the first sheet's
          // side edges are, so it stays in the air the first is held to)
          float E = .5 * sqrt(iP.w * iP.w + .09);
          vec3 pos = iP.xyz + up * .3 + t * (position.y * len * 1.3) + (two > .5 ? up * (E - .3 + position.x * 2. * E) : n * (position.x * 2. * iP.w));
          // (vUv.y runs down the fall: from -0.65 at the tile's upper end to 0.65 at its lower)
          vUv = vec2(position.x * 2., position.y * 1.3 * (iR.y > 0. ? -1. : 1.)); vK = vec2(3., two); vS = vec4(sd, lit, iF.z, iP.w); vT = vec3(iF.x + position.y * 1.3 * len, iF.y, uFlame.x * on);
          gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.); vAir = airAt(pos);
          return; }
        // (h: the sheet's height now: iP.w, the height the build gave this tongue, in the hour's weather, breathing
        // on two slow rhythms of its own and never over iP.w; wm: its half breadth at the foot, the build's (iR.x),
        // and never over three tenths of its height)
        float h = max(iP.w * uFlame.x * on * (.8 + .12 * sin(uTime * (1.3 + sd * 1.1) + sd * 40.) + .08 * sin(uTime * (2.9 + sd * 1.7) + sd * 90.)), .05);
        float wm = min(iR.x, max(h * (.3 + .2 * hot), .03));
        vec2 wd = mix(uWind.zw, uWind.xy, windLean(iQ.y));
        vec3 foot = iP.xyz, toEye = cameraPosition - foot; float dist = length(toEye); vec2 rt = normalize(vec2(toEye.z, -toEye.x) + vec2(1e-5, 0.));
        // (its tip is drawn down the wind, and down-stream where it stands on running sulphur: iF.zw)
        // (a lick of a wall's seam, marked by iF.z = 9, stands upright: on a wall the hot gas climbs)
        float seam = step(5., iF.z);
        vec2 lean = wd * (h * (.18 + .12 * fract(sd * 13.7) + .06 * sin(uTime * 1.9 + sd * 60.))) + iF.zw * (h * (1. - seam));
        // (THE LICK IS TILTED, not stretched: its tip stands at most 0.8 of its length aside, and as far as it
        // leans it stands the lower (vy), so its whole reach from its foot is its own length, inside the 1.1 of the
        // flame's height that the world keeps clear for it; run: how hard the sulphur under it runs: on running
        // fire the gas is torn the more)
        float L = min(length(lean) / h, .8), run = (1. - seam) * smoothstep(.15, .6, length(iF.zw)), vy = sqrt(1. - L * L);
        lean *= L * h / max(length(lean), 1e-4); float lx = dot(lean, rt) / wm;
        // (a filter by the pixel's footprint: a lick under a pixel and a half of half breadth is thinned, to nothing
        // at half a pixel; one whose place hardly burns is not drawn. A seam's licks, small and many down one crack,
        // give way to the seam's ribbon where a pixel covers 0.03 to 0.09 m at the lick's distance (as the
        // ribbon turns into its one stroke about the crack): so a seam from afar is never a comb or a scatter of points)
        float k = smoothstep(.5, 1.5, wm / max(dist * uPx, 1e-5)) * lit * (1. - seam * smoothstep(.03, .09, dist * uPx)), Q = 1.65 + .25 * abs(lx);
        vec3 pos = foot + vec3(0., y * h * vy, 0.) + vec3(lean.x, 0., lean.y) * y + vec3(rt.x, 0., rt.y) * (position.x * 2. * wm * Q * step(.002, k));
        // (vK.x: its kind, and a quarter more on a chimney's own tongue, which stands in the air before a flank)
        // (and four tenths more on a tongue of a steep fall, whose depth pull is under a metre: it hangs in the air over the fall)
        vUv = vec2(position.x * 2. * Q, y); vK = vec2(iR.w + (iR.y > 0. ? (iR.y < .95 ? .4 : .25) : 0.), Q); vS = vec4(sd, k, h, wm); vT = vec3(lx, smoothstep(6., 28., h / max(dist * uPx, 1e-4)) * (1. + .8 * run), hot);
        gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.); vAir = airAt(foot + vec3(0., h * .4, 0.));
        // (a chimney's own tongue: its depth is taken iR.y metres nearer the eye's place: see the head)
        if (iR.y > 0.) { vec4 cn = projectionMatrix * viewMatrix * vec4(pos + toEye * (iR.y / dist), 1.); gl_Position.z = cn.z * gl_Position.w / cn.w; }
      }`,
    fragmentShader: /* glsl */`
      uniform vec2 uFlame; uniform float uTime;
      ${GLSL_NOISE}
      ${GLSL_TONGUE}
      varying vec2 vUv, vK; varying vec3 vT; varying vec4 vS, vAir; varying float vRed;
      void main(){
        float y = vUv.y, sd = vS.x, flip = fract(sd * 91.7) < .5 ? -1. : 1.;
        if (vK.x > 2.5) {
          // THE RIVER'S SHEET, laid over the ground as a tongue's body is: across the line it falls from its
          // middle to nothing at its sides; along it soft billows run down the line at the sulphur's speed on
          // the world's clock: deep blue in their troughs, electric blue to azure on their crests. Where it
          // stands steep over a step of the ground (vS.z: the pour) it is the same body, drawn out down the fall.
          // It hides the ground in full wherever it burns at six tenths of its strength or more (a weaker
          // sheet is a deeper blue, not a thinner one: thin blue over the orange bed shows pink).
          /* (each tile dies away over the next piece's first seventh: where two meet each is at seven tenths, and the one laid over the other gives one body's light) */
          /* (IT HAS NO STRAIGHT EDGE AND NO SAW'S EDGE: its sides wander in and out along the line in long soft lobes, some 2.5 m to a swell with lesser ones of a metre and of half a metre on it (vw: two slow noises that run with the sulphur), and its ends are ragged) */
          /* (vS.z says how steep the sheet falls over a step, 0..1; a pour's last sheet, under which no other falls, is told by 2 added to it (endK), and low runs from 0 to 1 down its lower half. sk: what lies further from the sheet's middle lags behind as it runs, by 0.8 m to a metre across: its billows are swept back, as flame is that is drawn along) */
          float v = vUv.x, m = vT.x, us = m - vT.y * uTime, endK = step(1.5, vS.z), a = v * vS.w, low = endK * smoothstep(-.1, .65, vUv.y), sk = sign(vT.y) * abs(a) * .8;
          /* (each side's edge has lobes of its own, a metre or two long, between four tenths and nine tenths of the tile's half breadth from its middle: the body swells and draws in along the line, and the middle wanders slowly by up to 0.15 of it: the light is nought at the tile's own sides everywhere, so no straight edge shows. A POUR'S LAST SHEET draws in to six tenths as it falls and ends in a few hanging tongues of unlike lengths, not in a level hem) */
          float c0 = (nA(vec2(us * .02 + sd * 4., sd * 9.)) - .5) * .3, sideN = nG(vec2((us + sk) * .11 + sd * 4. + step(0., v) * .37, sd * 9. + step(0., v) * .21));
          float vw = (v - c0) / ((.38 + .56 * sideN) * (1. - abs(c0)) * (1. - .4 * low)), bell = max(1. - vw * vw, 0.); bell *= .4 + .6 * bell;
          float ends = clamp((.65 - abs(vUv.y) - .05 * v * v + (nG(vec2(v * 1.3 + sd * 5., us * .07)) - .5) * .12 + (nR(vec2(v * .22 + sd * 5.3, sd * 3.)) - .6) * .9 * low) / (.21 + .2 * low), 0., 1.);
          /* (ITS BODY IS WHOLE: soft billows of burning gas, some 0.8 m long and 0.4 m across (bil), with a finer tearing (rag), run down the line with the sulphur and drift across it; they are taken in metres. A POUR IS THE SAME BODY, FALLING: its billows keep their own measure (drawn out down the fall they are stripes on a flat card), and nothing of it stands open: fire that falls is a body of flame, not threads) */
          float bil = nR(vec2((us + sk) * .16 + sd * 5.3, a * .3 + sd * 3. + uTime * .04)), rag = nG(vec2((us + sk) * .3 + sd * 3., a * .55 + sd * 7. - uTime * .06));
          float raw = bell * (.75 + .5 * bil + .35 * rag), I = ends * vS.y * vT.z, B = smoothstep(.2, .55, raw), cr = smoothstep(.3, .75, bil);
          /* (THE HOT FOOT: one thin pale thread low in the fire, a seventh of the sheet's half breadth, that wanders from side to side with the billows and breaks where the tearing runs low) */
          float core = max(1. - abs(vw - (bil - .5) * .9) / .14, 0.) * smoothstep(.3, .6, rag);
          /* (a filter by the pixel's footprint: a sheet seen so nearly edge-on that it is under a pixel and a half broad on the screen cannot be drawn, it would be a row of dashes: it is faded out; a pour's second sheet, which is there for the side view alone, from six pixels down to two) */
          I *= smoothstep(vK.y > .5 ? 2. : .75, vK.y > .5 ? 6. : 1.5, 2. / max(fwidth(v), 1e-4));
          /* (its body is a deep blue, 0.95, in the troughs of its billows and electric blue, 1.9, on their crests (cr): the billows show as rolls of flame, not as one even sheet; azure toward its middle; and the hot foot's thread of pale cyan) */
          /* (ITS EDGE IS A SOFT VEIL, AND WHAT IT HIDES BEYOND ITS LIGHT IT GIVES DEEP BLUE. Toward its sides the sheet hides the ground a little sooner than its own light falls (H: it comes up from 0.12 to 0.5 of the body's strength), and what it hides there beyond its light it gives the fringe's deep blue (rim): an edge that hides and gives no light is a dark line wherever one sheet's edge lies over another's body. A sheet that hides the ground in full to its very edge is a shape cut from paper: so the edge stays a veil) */
          /* (NEAR MOLTEN SULPHUR THE EDGE GIVES WAY A LITTLE, by the molten law's answer (vRed: 0.12 at its most, see moltenAt). The reason is the bed: there the sheet lies on sulphur that glows orange under it, and a thin veil of blue over orange shows pink. So by vRed the edge that hides early, from 0.06 to 0.3 of the body's strength, is mixed in: an eighth of it at the most; and the deep blue comes in only where 0.7 of vRed of the ground is hidden already: a twelfth at the most. At one the edge would hide the bed before its light and stand dark, then deep blue, then the body; the law is handed so little of it because a stream's fire stands on the bed from end to end and at the whole strength is a flat sheet with cut edges) */
          float H = mix(smoothstep(.12, .5, raw), smoothstep(.06, .3, raw), vRed), rim = max(smoothstep(.7 * vRed, 1., H) - B, 0.);
          /* (AWAY FROM MOLTEN SULPHUR THE SHEET IS LOW FIRE WITH FRONTS IN IT, NOT ONE EVEN BAND: there its troughs are thin and a deep blue, 0.45, and let two fifths of the ground show; its billows' crests are the body's blue; and through it run thin bright fronts (fr: ridges that lie across the line, some 0.4 m apart and a metre long, and run down it with the sulphur, electric blue, pale only on their ridges), with the hot foot's thread at four tenths of its strength: seen flat on from near, on a steep slope, it has rolls and fronts of flame in it and the slope shows dark between them. On the molten bed it is the same low fire for seven eighths and more: dry is 1 less vRed, 0.88 at the least) */
          float dry = 1. - vRed, fr = nB(vec2((us + sk) * .3 + sd * 2.1, a * .13 + sd * 5.7 + uTime * .05)); fr *= fr;
          H *= 1. - dry * .4 * (1. - max(cr, fr));
          vec3 c = FIRE_BODY * (I * B * mix(.95 + .95 * cr, .45 + .75 * cr + .8 * fr, dry)) + FIRE_INNER * (I * smoothstep(.45, .9, raw) * (.4 + .6 * cr) * (1. - .6 * dry * (1. - fr)))
            + FIRE_HEART * (I * B * (core * (.8 - .5 * dry) + dry * .3 * smoothstep(.5, .85, fr))) + FIRE_FRINGE * (I * rim * .8);
          gl_FragColor = vec4(mix(c, vec3(.5, .55, .8) * dot(c, vec3(.1, .3, .4)), uFlame.y), FIRE_HIDES * I * min(1.6, 1. / max(vS.y * vT.z, 1e-3)) * H * (1. - uFlame.y)); }
        // (as a tongue: it bends down the wind inside its sheared sheet, and is turned left or right by its seed; its
        // light dies away toward the sheet's sides. A tongue's foot is soft: its light comes in from nothing over
        // the lowest tenth of its height (where it stands on the lip of a step its foot is seen from below, and
        // a foot that begins at full light is a hard level edge there); a chimney's own stands in the air before the flank: over the lowest fifth,
        // so tongue over tongue they are one strand)
        // (and the foot is round, not level: the light comes in the later the further from the tongue's middle line, by
        // three tenths of the height more at one half breadth aside: the glow about a foot does not end in a straight hem)
        // (A TONGUE OF A STEEP FALL HAS NO LEVEL FOOT AT ALL: it stands on no floor, the ground falls away under it,
        // and seen from over the fall a broad level foot makes it a plate. Its foot is a round drop: its lower
        // outline climbs with the square of the way from its middle line, to three tenths of its height at its
        // body's side (r), so it is a flame from wherever it is seen)
        else { float r = .6 * vUv.x * vUv.x * step(.3, fract(vK.x));
          gl_FragColor = tongueLight(vec2((vUv.x + vT.x * y * (1. - y)) * flip, y), sd, vS.z, vS.w, vT.y, vT.z, 1., uFlame.y, 1. - smoothstep(.7, 1., abs(vUv.x) / vK.y), vRed) * (vS.y * smoothstep(r, r + mix(.1, .22, step(.1, fract(vK.x))) + .3 * vUv.x * vUv.x, y)); }
        gl_FragColor.rgb = gl_FragColor.rgb * vAir.a + vAir.rgb * gl_FragColor.a;   // (seen through the bowl's air, taken at the lick's own place)
      }` });
}

// ---------- steam and gas: soft puffs, many and thin, each a square turned to the eye's place, riding a track of its own ----------
// iS: where it leaves the ground (world), how high it climbs in its life (m); iT: how far the wind carries it in its
// life (m), its size as it leaves and as it ends (m), its strength; iM: where in its round it is at time 0, rounds a
// second, seed, kind; iE: how far east across the slope it starts (0..1), and for the burst the seconds after the
// lit head reaches the fall at which it leaves, and its life (s).
// and, worked out in the build, how much fire burns under where it leaves the ground (0..1).
// EVERY PUFF IS GAS, NOT A BALL. Its thickness is a soft field with no outline of its own: thickest at its middle,
// falling away gradually, FOLDED by a slow turning of the air (the field is read at places pushed about by a slow
// noise) and TORN by a finer noise that eats it from the rim inward, the more the older it is: a young puff is a
// soft full body, an old one is strands. The whole field is DRAWN OUT ALONG THE PUFF'S OWN WAY (up as it rises,
// down the wind as the wind takes it; the way is taken as it is seen across the puff's square), longer the older
// it is, so its strands pull out along the way it goes and the puff leans as the air shears it. The field climbs
// through the puff on the world's clock. Each puff has numbers of its own (how broad, how torn, how fine), so no
// two are alike.
// ITS LIGHT: gas is seen by what light is scattered in it. Where it is thin it takes the light whole; well inside
// it is darker (the light does not reach). The side of it that faces a light is the lit side (the field's slope
// across the square says which way each part faces): the night sky's dim grey from above; the moon's, or the
// east's first light, on the side toward it; and THE FIRE'S BLUE FROM BELOW, the world's own blue of the fire's
// light on the ground, on its under sides and through its thin low parts, for as high over the ground as the
// fire's light reaches up it AND ONLY WHERE FIRE BURNS UNDER IT: steam that rises from a vent with no fire takes
// none and is a dark shape against the stars.
// kind 0: the plume over the fire slope and the steam of a chimney or a vent: thin; lit blue from the fire
//   under it, most at the ground it left, a third as much at a fifth of its climb (8 to 40 m: the plume's own
//   puffs 24 to 40) and dying away above with no edge, grey higher up; it leans as the wind's law says, the
//   same at every height, later toward the east;
// kind 1: a body of the plume's column: tens of metres across, thick, a dark grey mass with torn sides, lit blue
//   from the fires in the same way (a third at 40 m); it hides the stars; one over another they are the column;
// kind 2: the lake's own steam: low torn banks, broader than deep, drawn out along the water, and one in three a
//   single wisp drawn out upward; sliding over the water down the wind;
// kind 3: the burst where the burning river falls into the lake: each puff leaves once a pour, some seconds after
//   the lit head reaches the fall (the pour's law), climbs, and is gone.
function puffMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...FIRE_BLEND,
    vertexShader: /* glsl */`
      attribute vec4 iS, iT, iM, iG; attribute vec3 iE; uniform float uTime, uFall; uniform vec4 uWind; uniform vec3 uMoonDir;
      ${GLSL_LAWS}
      ${GLSL_AIR}
      varying vec2 vUv, vLd; varying vec3 vLm, vK; varying vec4 vC, vAir, vF, vM; varying float vFb;
      void main(){
        float kind = iM.w, age, str = iT.w;
        if (kind > 2.5 && kind < 3.5) { float tb = uLaw.z - uFall / 30. - iE.y; age = clamp(tb / iE.z, 0., 1.); str *= step(0., tb) * step(tb, iE.z); }
        else age = fract(iM.x + uTime * iM.y);
        float ln = windLean(iE.x); vec2 wd = mix(uWind.zw, uWind.xy, ln);
        float rise = pow(age, .8) * iS.w, carry = pow(age, 1.4) * iT.x;
        vec3 c = iS.xyz + vec3(wd.x * carry, rise, wd.y * carry);
        c.xz += (vec2(sin(iM.z * 40. + age * 5.), cos(iM.z * 57. + age * 4.)) * .12) * rise * (1. + age);
        float size = mix(iT.y, iT.z, pow(age, .7));
        vec3 toEye = normalize(cameraPosition - c), rt = normalize(cross(vec3(0., 1., 0.), toEye) + vec3(1e-5, 0., 0.)), up = cross(toEye, rt);
        // (the lake's steam lies in banks: each is two and a half times as broad as it is deep)
        vec3 pos = c + (rt * position.x + up * (position.y * (kind > 1.5 && kind < 2.5 ? .4 : 1.))) * size * 2.;
        // (vLd: the way from the puff back to where it left the ground, across and up its own square: its lit side)
        vec3 back = normalize(iS.xyz - c + vec3(0., -1e-3, 0.)); vLd = vec2(dot(back, rt), dot(back, up));
        // (vLm: the way to the low moon, or to the east's first light, across, up and out of its own square)
        vLm = vec3(dot(uMoonDir, rt), dot(uMoonDir, up), dot(uMoonDir, toEye));
        vUv = position.xy * 2.; vC = vec4(iM.z, str * smoothstep(0., .1, age) * (1. - smoothstep(.5, 1., age)), rise, kind);
        // (vF: the world's up across and out of its own square; its half breadth now, metres; and how high over
        // the ground it left the fire's light has fallen to a third: a seventh of its whole climb, 7 m at the least
        // and 26 m at the most: the fire lights a column's foot blue, and above it the gas is the night's and the moon's)
        vF = vec4(up.y, toEye.y, size, clamp(iS.w * .15, 7., 26.));
        // (vM: the puff's own way at this moment of its track, as it is seen across and up its square: up while
        // it rises fast, down the wind as the wind takes it; its age; and how much fire burns under where it left
        // the ground: the burst at the fall is the burning river's own)
        float ag = max(age, .02); vec3 vel = vec3(wd.x, 0., wd.y) * (1.4 * pow(ag, .4) * iT.x) + vec3(0., .8 * pow(ag, -.2) * iS.w, 0.);
        // (vFb: HOW NEAR A GREAT FALL OF FIRE IT LEFT THE GROUND: the fall's own spray. The build keeps it with
        // the fire under the puff, in whole twos: 1 hard by the fall, nought from 40 m)
        float fbk = kind > 2.5 ? 0. : floor(iE.z * .5 + 1e-4); vFb = fbk / 7.;
        vM = vec4(vec2(dot(vel, rt), dot(vel, up)) / max(length(vel), 1e-3), age, kind > 2.5 ? 1. : iE.z - 2. * fbk);
        // (vK: WHERE IN ITS COLUMN THE PUFF STANDS (rising gas: kinds 0 and 1; the build's iG and iE.y): the
        // column's middle at the puff's own height is the middle of the places its neighbours left, carried down
        // the wind as their middle track is at that height; the column's half breadth there (Rc) is the spread
        // of those places and near half the puff's own size, a little more as it climbs. vK: how far the puff's
        // middle stands from the column's, across its square and toward the eye's place, and its own half
        // size, all in the column's half breadths: for the column's lit side and shade side, see the fragment)
        float aM = pow(clamp(max(c.y - iS.y, 0.) / max(iG.z, 1.), 0., 1.), 1.25), Rc = iE.y + .45 * size + .1 * rise;
        vec2 dC = c.xz - iG.xy - wd * (pow(aM, 1.4) * iG.w);
        vK = vec3(dot(dC, rt.xz), dot(dC, normalize(toEye.xz + vec2(1e-5, 0.))), size) / Rc;
        gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.); vAir = airAt(c);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uFireCol, uSkyCol, uLakeCol, uMoonCol, uPlume;   // (uPlume: the fire's glow on the plume, the lake's on its steam, how thick the hour's steam stands)
      ${GLSL_NOISE}
      varying vec2 vUv, vLd; varying vec3 vLm, vK; varying vec4 vC, vAir, vF, vM; varying float vFb;
      // (THE GAS'S THICKNESS at a place q of the puff, taken across its own way (x) and along it (y): ax its half
      // breadth and half length; fs how fine the tearing noise is across and along; off where in the noise this
      // puff reads; E how hard it is torn. It answers two numbers: how thick the gas stands, 0 where there is none
      // and 1 where it is full; and the tearing noise itself there, which is how dense the gas's folds are.
      // The thickness answers the noise GENTLY: it comes up over the whole way from the puff's reach to its middle,
      // and the noise moves it by less than that way: a thickness that answers the noise hard cuts a puff into a
      // few full lumps, each with a rim where its gas ends at once)
      vec2 gas(vec2 q, vec2 ax, vec2 fs, vec2 off, float E){
        vec4 t = texture2D(tNoise, q * fs + off); vec2 r = q / ax; float n = t.r * .62 + t.a * .26 + t.g * .12;
        return vec2(smoothstep(0., 1.1, 1. - dot(r, r) + min((n - .55) * E * .55, .3)), n); }
      void main(){
        float seed = vC.x, age = vM.z;
        float kind = vC.w, body = step(.5, kind) * step(kind, 1.5), bank = step(1.5, kind) * step(kind, 2.5);
        // (of the lake's steam one puff in three is a single wisp, a third as broad, drawn out upward; the others
        // are banks, drawn out along the water)
        float wisp = bank * step(fract(seed * 7.3), .33);
        vec2 p = vUv * vec2(1. + 2. * wisp, 1.); float f = 1. - dot(p, p);
        if (f <= 0.) discard;
        // (dv: its own way across the square (a puff that comes straight at the eye is taken as rising); dn: across that way)
        vec2 dv = normalize(mix(vM.xy + vec2(0., .25), vec2(1. - wisp, wisp), bank)), dn = vec2(dv.y, -dv.x);
        float tm = uTime * mix(.03, .012, body), r1 = fract(seed * 5.7), r3 = fract(seed * 9.3);
        // (FOLDED: the place is pushed about by a slow noise, more the older the puff)
        vec2 w = texture2D(tNoise, p * .11 + seed * vec2(3.1, 7.7) - dv * (tm * .4)).rg - .5;
        vec2 pw = p + w * mix(.42 + .28 * age, .55 + .35 * age, bank), q = vec2(dot(pw, dn), dot(pw, dv));
        // (DRAWN OUT AND TORN: its form narrows across its way as it ages, the tearing noise is read two to three
        // times as long along the way as across, and it tears harder with age; the noise climbs along the way)
        // (ITS REACH IS UNEVEN: the same slow noise that folds it says how far the gas reaches at each part of the
        // puff, from a little over half its measure to a seventh more: one side of it stands out and another falls
        // short, so its outline is no round; and at its furthest it ends short of its square's rim, which is a
        // round and must not be seen: the tearing eats the gas and adds little to its reach)
        // (GAS THAT POURS UPWARD IS DRAWN OUT ALONG ITS WAY: a puff of the plume or of a mouth's steam is a third
        // narrower across its way and a fifth longer along it than a bank of the lake's steam, and its tearing
        // runs in long strands up it, some three to four times as long as broad: one over another they are a stream
        // of gas, not a heap of round clouds)
        vec2 ax = mix(vec2(mix(.46, .36, age) * (.8 + .3 * r1), .86), vec2(mix(.62, .5, age) * (.8 + .3 * r1), .72), bank) * clamp(1. + 2.2 * w.y, .55, 1.15);
        // (GAS THAT RISES HAS LONG SOFT FOLDS: the folds of a puff of the plume, of a column or of a mouth's steam
        // are read 1.3 times as fine across its way as a bank's, some five to the puff's breadth, and near twice
        // as long along its way as they are across: drawn out up the wind, five to seven times as long as broad)
        // (the burst at the fall keeps its own make: 1.7 times as fine as a bank, torn a quarter harder)
        float rising = step(kind, 1.5);   // (1 on gas that rises in a column: kinds 0 and 1)
        vec2 fs = vec2(.2, .2 * mix(mix(.38, .24, age), mix(.55, .35, age), bank)) * (.8 + .5 * r3) * mix(mix(vec2(1.7), vec2(1.3, .75), rising), vec2(1.), bank), off = seed * vec2(5.3, 1.9) - vec2(0., tm);
        // (a young puff is torn too: no puff is a full round ball at any age. GAS THAT RISES IS TORN SOFTLY, half
        // as hard as the lake's steam: its folds swell and thin, they do not curdle into lumps with edges)
        float E = mix(2.1, 2.9, age) * (.8 + .4 * r1) * mix(1.2, .85, body) * mix(mix(1.25, .5, rising), 1., bank);
        // (the field is read at three places well apart: its value, and its broad slope across the square: the
        // light then falls on the puff's whole side and does not draw a bright line round every strand)
        vec2 G0 = gas(q, ax, fs, off, E), Gx = gas(q + vec2(.22, 0.), ax, fs, off, E) - G0, Gy = gas(q + vec2(0., .22), ax, fs, off, E) - G0; float D0 = G0.x;
        // (th: how thick the gas stands here: a little thinner where its folds are thin; it is nothing at its
        // square's rim, which no part of it reaches full)
        float th = D0 * smoothstep(0., .3, f) * (.72 + .28 * smoothstep(.3, .65, G0.y));
        if (th <= .003) discard;
        // (which way this part of the gas faces: from the slope of its thickness and of its folds, turned back
        // to the square's own frame)
        vec2 gr = (dn * (Gx.x + .45 * Gx.y) + dv * (Gy.x + .45 * Gy.y)) / .22;
        vec3 nm = normalize(vec3(-gr * mix(.55, .3, bank), 1.)), U = vec3(0., vF.x, vF.y);
        // (A COLUMN HAS ONE LIT SIDE AND ONE SHADE SIDE. Gas that rises (kinds 0 and 1) stands puff over puff in
        // a column, and the light falls on the column, not on each puff as if it were a ball: so this part of
        // the gas faces mostly as the column's own side does where it stands in it (sx: how far across the
        // column, -1..1; a round column's side, turned a little toward the eye's place where the puff stands
        // before the column's middle), and only by a quarter as its own folds do: the folds are soft and
        // small against the column, and the column's side toward the light is pale and its other side less so)
        float sx = clamp(vK.x + p.x * vK.z, -1., 1.);
        nm = normalize(mix(nm, normalize(vec3(sx, .2, max(sqrt(1. - sx * sx) + .5 * clamp(vK.y, -1., 1.), .08))), .75 * rising));
        // (in its dense folds the light does not reach: the gas is darker there. It goes by the folds, which
        // run through the gas with no regard to any one puff, not by the puff's own middle. In gas that rises
        // the folds are only a little darker, a tenth: it is thin, and the light goes through it)
        float top = dot(nm, U), crease = 1. - mix(mix(.3, .1, rising), .42, bank) * smoothstep(.42, .75, G0.y) * th;
        // (by the night's own light steam is grey: it takes the sky's tone and none of its hue; the sky lights it
        // from above: its crowns are pale, its under sides and its creases dark)
        vec3 grey = vec3(1.04, 1., .98) * (dot(uSkyCol, vec3(.3, .4, .3)) * .34 + .009);
        // (the fire lights it from beneath and from where it rose, and only where fire burns under it (vM.w); the
        // light dies away up the gas with no edge: to a third at the height vF.w over the ground it left, to a
        // twentieth at three times that; above, it is a grey shape against the stars)
        // (THE SPRAY OF A GREAT FALL (vFb) has the fire beside it all the way up: its light does not die away
        // with the height and is up to twice as strong (the fall is a wall of fire, not a line on the
        // ground), and the spray hides four tenths as much: the fire is seen through it, and before the
        // fall it is lit mist and never a dark shape on the fire. A low bank of it takes this light and not
        // the lake's)
        float hgt = vC.z + p.y * vF.z, lowB = max(exp(-max(hgt, 0.) / (.9 * vF.w)) * vM.w, vFb) * (1. + vFb);
        float fK = clamp(dot(nm, normalize(vec3(vLd * .5, 0.) - U)) * .7 + .5, 0., 1.5);
        // (how thick it stands: a body of the plume is thick, and hides the stars; a puff is thin, thickest where
        // it has just left the ground and thinner as it climbs; the lake's steam is thin)
        float low = exp(-max(vC.z, 0.) / 45.);
        // (and it is densest as it leaves the mouth and thins as it climbs: a third denser young, a quarter thinner old)
        float dens = th * vC.y * uPlume.z * mix(mix(.5, 1.5, low), 1.4, body) * mix(mix(1.35, .75, age), 1.2, bank), a = min(dens, .93);
        // (GAS THAT RISES IS THIN AT ITS EDGES AND NEVER A WALL: what it hides comes up softly with its
        // thickness and ends at seven tenths where it stands thickest; through a puff's outer third the wall, the
        // stars and the lake are dimly seen, and only puff over puff, in a column's middle, does it close)
        a = mix(a, .7 * (1. - exp(-1.5 * dens)), rising) * (1. - .6 * vFb);
        // (THE LIGHT OF GAS THAT RISES: it is pale. By the night sky alone it is a soft blue-grey, a blue cast
        // on the sky's tone and no brown in it: on its shade side a half of that tone, which is paler than the
        // night sky behind it, on the side turned to the sky's bright side (where the moon or the first light
        // stands, in every hour) seven tenths: pale grey-blue by starlight. THE MOON, when it is up, does the
        // rest: the side turned to it is pale blue-white; and where the moon stands behind the gas (vLm.z below
        // nought: the way to it leads away from the eye's place) its thin parts shine through. The moon's
        // light is the hour's own number, taken for its strength and not for its hue: the first light before
        // dawn is warm, and warm light on grey gas shows brown.
        // The lake's steam and the burst at the fall take the night's plain grey, the law above)
        vec3 moonC = mix(vec3(dot(uMoonCol, vec3(.3, .5, .2))), uMoonCol, .3);
        float through = smoothstep(.15, .9, -vLm.z) * exp(-3.5 * th) * 1.2, lit = clamp(dot(nm, vLm) * .6 + .45, 0., 1.);
        vec3 col = grey * .62 * mix(1. + .8 * low, 2.1, body) * (.45 + .55 * (.5 + .5 * top) * (.5 + .5 * top)) * crease + moonC * ((max(dot(nm, vLm) * .8 + .2, 0.) * mix(.6, 1.1, body) * crease + through * mix(.6, 1., body)));
        vec3 colR = vec3(.6, .84, 1.3) * ((dot(uSkyCol, vec3(.3, .4, .3)) * mix(.5, .7, lit) + .01) * (.8 + .2 * (.5 + .5 * top)) * crease)
          + vec3(.8, .95, 1.2) * (dot(uMoonCol, vec3(.3, .5, .2)) * 1.7 * (max(dot(nm, vLm) * .8 + .2, 0.) * crease + through * .8));
        col = mix(col, colR, rising);
        // (THE FIRE'S BLUE: the world lays the fire's light on the ground as 0.08, 0.38, 1; the gas over the
        // fire takes that same blue a little stronger, 0.1, 0.44, 1.15 (the gas's own grey comes on top of it and would
        // pale it), on its under sides and through its thin low parts)
        // (it goes by the height over the fire, which is one field through all the gas, and only a little by
        // which way a part faces: so it lights the column's foot, not a ring round every puff)
        col += uFireCol * vec3(.1, .44, 1.15) * uPlume.x * (lowB * (.58 + .46 * fK) * mix(1., 1.2, body) * mix(1., crease, .7) + body * vM.w * .03 / (1. + vC.z * vC.z / 3600.) * (.7 + .3 * fK));
        // (the lake's own steam glows faintly with the lake's light)
        col = mix(col, (grey * (.5 + .5 * (.5 + .5 * top)) + uLakeCol * uPlume.y * (2. + 1.5 * D0)) * crease, bank * (1. - vFb));
        gl_FragColor = vec4((col * vAir.a + vAir.rgb) * a, a);   // (seen through the bowl's air, taken at the puff's own middle)
      }` });
}

// ---------- sparks: burning droplets thrown up from the vents and the running sulphur ----------
// iP: where it leaves (world), how high it is thrown (m); iQ: seed, how far east across the slope (0..1), the main
// channel's metres there (negative: it is thrown always), throws a second. Each rises on its own arc, drifts down the
// wind, and burns out before it falls back; one whose throw height is negative is a drip of molten sulphur: it falls
// that many metres from where it hangs, red. Each is drawn as a streak along its own way (a spark: a fine one, its
// bright head where it is and its tail where it came from), never thinner than uPx of the distance to the eye's
// place (a pixel and a half), its brightness spread over the breadth it is drawn at; from afar it goes out.
function sparkMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, ...SPARK_BLEND,
    vertexShader: /* glsl */`
      attribute vec4 iP, iQ; uniform float uTime, uPx; uniform vec4 uWind;
      ${GLSL_LAWS}
      ${GLSL_AIR}
      varying vec3 vC; varying float vL;
      vec3 at(float age){ float sd = iQ.x; vec2 wd = mix(uWind.zw, uWind.xy, windLean(iQ.y));
        vec2 side = vec2(sin(sd * 71.), cos(sd * 53.)) * .35;
        if (iP.w < 0.) return iP.xyz + vec3(0., iP.w * age * age, 0.);              // (a drip: it falls from where it hangs, faster as it goes)
        return iP.xyz + vec3((wd.x * .5 + side.x) * iP.w * age, iP.w * (2. * age - age * age), (wd.y * .5 + side.y) * iP.w * age); }
      void main(){
        float cyc = iQ.x * 17. + uTime * iQ.w, age = fract(cyc), on = iQ.z < 0. ? 1. : pourBurn(iQ.z);
        // (a drip is a short streak ahead of where it is; a spark is a fine streak: its bright head where it is now,
        // its tail along the way it came over the last fourteenth of its flight)
        vec3 c = at(age), d = iP.w < 0. ? (at(age + .04) - c) * 1.6 : c - at(max(age - .07, 0.));
        vec3 toEye = cameraPosition - c; float dist = length(toEye);
        vec3 ax = normalize(cross(d, toEye) + vec3(1e-5, 0., 0.));
        float hw = max(iP.w < 0. ? .02 : .035, dist * uPx * .75);
        vec3 pos = c + d * (position.y + (iP.w < 0. ? .5 : -.5)) + ax * position.x * 2. * hw;
        // (its brightness is spread over whatever breadth it is drawn at: a drip is 28 mm broad, a spark's glow 70 at its narrowest and its light that of one 140 broad;
        // a spark is brightest as it leaves and fades all the way up its arc, slowly at first: it rises and dies)
        vL = position.y * 2.;
        // (and it is dimmed by the bowl's air between it and the eye. A SPARK IS A SMALL THING: where a pixel at its
        // distance from the eye's place covers more than a tenth of a metre it begins to go out, and it is gone
        // where a pixel covers 0.45 m: many sparks about a far fire would else add up in a few pixels to pale dots)
        vC = vec3(position.x * 2., on * airAt(c).a * (1. - smoothstep(.1, .45, dist * uPx)) * smoothstep(0., .08, age) * (iP.w < 0. ? .014 / hw * (1. - smoothstep(.45, .95, age)) : min(.07 / hw, 1.) * 1.5 * (1. - age) * (1. - age * age)), iP.w < 0. ? 2. : fract(iQ.x * 7.7));
        gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; varying float vL;
      void main(){ float al = vL * .5 + .5;   // (along the streak: a drip is soft at both ends; a spark is brightest at its head, its tail thinning away)
        float a = (1. - vC.x * vC.x) * vC.y * (vC.z > 1.5 ? 1. - vL * vL : al * al * (1. - smoothstep(.82, 1., al)) * 1.5);
        // (a spark's head is an ember: pale cyan and more than twice as bright as its tail, bright enough to bloom; a
        // spark is blue fire too: its red is under a fifth of its blue)
        float hd = al * al * al * al;
        gl_FragColor = vec4(mix(mix(mix(vec3(.05, .4, 1.5), vec3(.1, .55, 1.4), step(.6, vC.z)), vec3(.25, .85, 1.6), hd) * (1. + 1.4 * hd), vec3(1.1, .1, .02), step(1.5, vC.z)) * (a * 2.2), 1.); }` });
}

// ---------- what flies: atlas moths and bent-winged bats, one instanced mesh, each animal on a closed course of its own ----------
// iC: the middle of its course (world), kind (0 a moth on the wing, 1 a bat, 2 a moth at rest on a branch);
// iR: the course's half-breadths east, up and south (m), rounds a second (times 2 pi);
// iH: where on its round it is at time 0, seed, half its span (m; for a moth the largest it may have: each moth's
// own is 0.76 to 1 of it by its seed), and for a moth at rest the way its back faces (radians).
// A moth's course is a slow loop that rises and sinks; it beats slow and deep, some beats and then a short glide on
// set wings. A bat's course is the same loop made fast and jinking by quicker turns laid over it; it beats fast and
// never glides. A moth at rest hangs on its branch with its wings spread and shivers them in bursts. Where an animal
// is at a time is a law of that time alone; its body lies along its own way. The wings are lit like the land; the
// clear windows in a moth's wings let the fire's light through from beneath.
export const flyerCourse = (kind, c, r, t, seed) => kind === 1
  ? [c[0] + r[0] * (Math.cos(t) + 0.25 * Math.sin(4 * t + seed * 9)), c[1] + r[1] * (Math.sin(2 * t) + 0.3 * Math.sin(5 * t)), c[2] + r[2] * (Math.sin(t + 0.7) + 0.25 * Math.cos(3 * t))]
  : [c[0] + r[0] * Math.cos(t), c[1] + r[1] * (0.5 * Math.sin(2 * t + seed * 6) + 0.25 * Math.sin(5 * t)), c[2] + r[2] * Math.sin(t)];   // (every course closes in one round)
function flyerMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 iC, iR, iH; uniform float uTime;
      ${GLSL_AIR}
      varying vec3 vW, vN; varying vec3 vUv; varying vec4 vAir;
      vec3 course(float t){ float sd = iH.y;
        if (iC.w > .5 && iC.w < 1.5) return iC.xyz + iR.xyz * vec3(cos(t) + .25 * sin(4. * t + sd * 9.), sin(2. * t) + .3 * sin(5. * t), sin(t + .7) + .25 * cos(3. * t));
        return iC.xyz + iR.xyz * vec3(cos(t), .5 * sin(2. * t + sd * 6.) + .25 * sin(5. * t), sin(t)); }
      void main(){
        float kind = iC.w, sd = iH.y, t = iH.x + uTime * iR.w;
        vec3 c = course(t), dir = normalize(course(t + .03) - c + vec3(1e-5, 0., 0.)), rt, up; float ang;
        // (a moth at rest lies flat to what it hangs on: its wings spread in one plane, raised two degrees, and
        // shivered through three more in bursts)
        if (kind > 1.5) { c = iC.xyz; dir = vec3(0., 1., 0.); rt = vec3(cos(iH.w), 0., sin(iH.w));
          ang = .035 + .05 * sin(uTime * 55. + sd * 30.) * smoothstep(.2, .6, sin(uTime * .8 + sd * 20.)); }
        else { rt = normalize(cross(dir, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.));
          float beats = kind > .5 ? 1. : smoothstep(-.25, .15, sin(uTime * 1.1 + sd * 30.));
          ang = kind > .5 ? .85 * sin(uTime * 58. + sd * 40.) : mix(.3, .12 + 1.05 * sin(uTime * 19. + sd * 40.), beats); }
        up = cross(rt, dir);
        // (A MOTH'S SPAN: the world gives the largest an atlas moth of the place may have, a quarter of a metre from
        // tip to tip; each moth has its own, 0.76 to 1 of that by its seed: 0.19 to 0.25 m. A bat keeps the world's)
        float x = position.x, ca = cos(ang), sa = sin(ang), half_ = iH.z * (kind > .5 && kind < 1.5 ? 1. : .76 + .24 * fract(sd * 7.31));
        vec3 p = c + (rt * (x * ca) + up * (abs(x) * sa) + dir * position.z) * half_;
        vW = p; vN = normalize(up * ca - rt * (sign(x) * sa)); vUv = vec3(abs(x), position.z, kind);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); vAir = airAt(c);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN; varying vec3 vUv; varying vec4 vAir;
      ${GLSL_NOISE}
      ${GLSL_FIRE}
      void main(){ vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N; float x = vUv.x, z = vUv.y;
        // (A FLYER TAKES THE NIGHT'S LIGHT AS THE WORLD'S STONES DO, by the same shares: six hundredths of the fire's
        // near light, eight of its far light, six tenths of the sky's, the lake's and the moon's: dark by the
        // moon, blue-grey near the fire, never a lamp of its own; under: what of the fire comes from beneath)
        vec3 lit = fireLight(vW, N, .3) * .06 + fireFar(vW, N) * .08 + nightLight(vW, N) * .6, under = fireLight(vW, vec3(0., -1., 0.), .3) * .06 + fireFar(vW, vec3(0., -1., 0.)) * .08;
        // a bat: dark fur and membrane, the membrane thin enough to take a little light through
        vec3 bat = vec3(.05, .035, .03) * lit + vec3(.03, .02, .02) * under * smoothstep(.15, .5, x);
        // a moth by night: drab grey-brown wings with a paler band and a dark margin, a clear window in each
        float band = 1. - smoothstep(0., .1, abs(x - .62 - z * .25)), margin = smoothstep(.78, .95, x + abs(z) * .25), win = 1. - smoothstep(.06, .1, abs(x - .42) + abs(z - .08) * .8);
        vec3 moth = mix(mix(vec3(.16, .13, .1), vec3(.3, .28, .24), band * .7), vec3(.045, .04, .035), margin) * lit;
        moth = mix(moth, under * .4, win);
        gl_FragColor = vec4((vUv.z > .5 && vUv.z < 1.5 ? bat : moth) * vAir.a + vAir.rgb, 1.);   // (seen through the bowl's air)
      }` });
}

// one instanced mesh of everything that flies (flyers { C, R, H }: every course laid by the world, which walks each
// whole course and counts its clear air; light: the world's shared uniforms). A flyer's own shape: two wings that meet
// along its body, half its span = 1.
export function makeFlyers(flyers, light) {
  const g = new THREE.InstancedBufferGeometry(), P = [], I = [], n = flyers.C.length / 4;
  for (const sd of [1, -1]) { const b = P.length / 3;   // (one wing: root front, fore tip, the notch between fore and hind wing, hind tip, root back, root middle, the fore wing's leading edge)
    P.push(0, 0, 0.3, sd * 1, 0, 0.42, sd * 0.86, 0, -0.08, sd * 0.62, 0, -0.6, 0, 0, -0.42, 0, 0, 0, sd * 0.55, 0, 0.5);
    I.push(b + 5, b, b + 6, b + 5, b + 6, b + 1, b + 5, b + 1, b + 2, b + 5, b + 2, b + 3, b + 5, b + 3, b + 4); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const ia = (arr) => new THREE.InstancedBufferAttribute(new Float32Array(arr.length ? arr : [0, 0, 0, 0]), 4);
  g.setAttribute('iC', ia(flyers.C)); g.setAttribute('iR', ia(flyers.R)); g.setAttribute('iH', ia(flyers.H)); g.instanceCount = n;
  const mesh = new THREE.Mesh(g, flyerMaterial({ ...light })); mesh.frustumCulled = false;
  return { object: mesh, dispose() { g.dispose(); mesh.material.dispose(); } };
}

// ---------- the build (the fire itself is added to this group by the world's order of building) ----------
export async function buildHero(ctx, opts = {}) {
  // opts: laws (makeLaws), light (the world's shared uniforms: tNoise, uLaw, uTime, uFire, ...), wind [nx, nz, wx, wz]
  // (the way the wind blows from the north and from the west), flame [height share, paleness] of the hour,
  // flames { P: [x, y, z, height, ...], Q: [seed, east, channel metres, breadth, ...] } (placed by the world, which
  // counts their clear air), yield
  const group = new THREE.Group(), made = [];
  const laws = opts.laws || makeLaws({}), LUn = opts.light || {};
  const shared = { tNoise: LUn.tNoise, uLaw: LUn.uLaw || laws.uniform, uTime: LUn.uTime || { value: 0 },
    // (the bowl's air: the world's own uniforms)
    uAir: LUn.uAir, uAirMap: LUn.uAirMap, uAirFloor: LUn.uAirFloor, uAirTeal: LUn.uAirTeal, uAirCol: LUn.uAirCol, uAirFire: LUn.uAirFire, tAir: LUn.tAir, tAirRed: LUn.tAirRed,
    uWind: { value: new THREE.Vector4(...(opts.wind || [0.5, 0.87, 1, 0])) }, uFlame: { value: new THREE.Vector2(...(opts.flame || [1, 0])) }, uPx: { value: 0.0016 } };
  const uPx = shared.uPx;                                            // (how much of the world one pixel covers a metre away)
  const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
  // (THE BUILD RESTS OFTEN: before its first work, between its pieces and inside every long loop it asks the
  // world's own rest (opts.yield), so that no piece of it holds the page long)
  if (opts.yield) await opts.yield();
  // --- THE CHIMNEYS, KNOWN BY THEIR CROWNS ---
  // The world hands this file no chimney as such. What it sets in each chimney's throat is a crown: four or more
  // of the hot tongues (the main channel's metres -2) that are THIN (each less than 0.85 of its height broad: a
  // thin flame on a spire) and stand TOGETHER: within 2.6 m of one of them on the plan and 1.2 m of its level.
  // (A roaring vent has three, and they are broad.) From a crown this build reads the chimney's facts:
  // - its PLACE: the middle of the crown's feet is on the chimney's axis;
  // - ITS LEAN: the crown's feet lie in one flat round across the throat: level on an upright chimney, tilted on
  //   a leaning one; the axis stands square to that round (ax; e1 and e2 are the two ways square to it);
  // - its MOUTH'S HEIGHT: the crown stands in the throat about a metre under the lip (0.95 to 1.45 m by the
  //   world's measures), so the lip is taken 0.95 m up the axis from the crown's middle;
  // - its THROAT'S RADIUS: the world spreads the crown's feet over six tenths of it: the widest foot from the
  //   middle, over 0.55 (a rough measure: it may be a fifth out, and it is the throat's, not the foot's);
  // - HOW LARGE ITS FIRE IS: the crown's tallest tongue (tall): a tall chimney's crown is 4 to 5 m, a small
  //   stack's 2 to 3 m; everything a chimney burns with is measured by it.
  // So a chimney the world adds, moves, or makes taller burns the same way where it stands, with no change here.
  const CH = [];
  if (opts.flames) { const F = opts.flames, hot = [], used = new Set(), b0 = LUn.uBay ? LUn.uBay.value : { x: 0, y: 0 };
    for (let j = 0; j < F.P.length; j += 4) if (F.Q[j + 2] < -1.5 && F.Q[j + 3] < 0.85) hot.push(j);
    for (const j0 of hot) { if (used.has(j0)) continue;
      const L = hot.filter((j) => !used.has(j) && Math.hypot(F.P[j] - F.P[j0], F.P[j + 2] - F.P[j0 + 2]) <= 2.6 && Math.abs(F.P[j + 1] - F.P[j0 + 1]) <= 1.2);
      if (L.length < 4) continue;
      let x = 0, y = 0, z = 0, tall = 0, sp = 0, sxx = 0, sxz = 0, szz = 0, sxy = 0, szy = 0;
      for (const j of L) { used.add(j); x += F.P[j] / L.length; y += F.P[j + 1] / L.length; z += F.P[j + 2] / L.length; tall = Math.max(tall, F.P[j + 3]); }
      for (const j of L) { const dx = F.P[j] - x, dy = F.P[j + 1] - y, dz = F.P[j + 2] - z; sp = Math.max(sp, Math.hypot(dx, dz)); sxx += dx * dx; sxz += dx * dz; szz += dz * dz; sxy += dx * dy; szy += dz * dy; }
      // (the round the feet lie in: its slope along x and along z, by least squares; feet in a row say nothing of it,
      // and the chimney is then taken upright; no chimney is taken to lean more than 24 degrees)
      const det = sxx * szz - sxz * sxz; let gx = det > 1e-3 ? (sxy * szz - szy * sxz) / det : 0, gz = det > 1e-3 ? (szy * sxx - sxy * sxz) / det : 0;
      const gl = Math.hypot(gx, gz); if (gl > 0.45) { gx *= 0.45 / gl; gz *= 0.45 / gl; }
      const al = Math.hypot(gx, 1, gz), ax = [-gx / al, 1 / al, -gz / al], l1 = Math.hypot(1 - ax[0] * ax[0], ax[0] * ax[1], ax[0] * ax[2]);
      const e1 = [(1 - ax[0] * ax[0]) / l1, (-ax[0] * ax[1]) / l1, (-ax[0] * ax[2]) / l1], e2 = [e1[1] * ax[2] - e1[2] * ax[1], e1[2] * ax[0] - e1[0] * ax[2], e1[0] * ax[1] - e1[1] * ax[0]];
      // (x, lip, z: the lip's middle; at(D, th, rr): the place D metres down the axis from the lip, rr from the axis
      // at the bearing th round it)
      const c = { x: x + 0.95 * ax[0], lip: y + 0.95 * ax[1], z: z + 0.95 * ax[2], r: Math.max(sp / 0.55, 0.5), tall, L, ax, e1, e2, east: sat((((x - b0.x) - (z - b0.y)) * 0.7071 + 78) / 120) };
      c.at = (D, th, rr) => { const cs = Math.cos(th) * rr, sn = Math.sin(th) * rr; return [c.x - ax[0] * D + e1[0] * cs + e2[0] * sn, c.lip - ax[1] * D + e1[1] * cs + e2[1] * sn, c.z - ax[2] * D + e1[2] * cs + e2[2] * sn]; };
      CH.push(c); } }
  if (opts.yield) await opts.yield();
  // (MOUTHS: where the world hands over eight or more puffs of steam in a row that leave one place (the same height,
  // within a metre of the first), they are one mouth's steam: a chimney's throat. Told off in pairs: the first of
  // the row and the one after its last.)
  // A CHIMNEY IS A PIPE, AND IT STEAMS (c.pipe): a crown with a mouth's steam leaving within 1.5 m of its lip's
  // middle on the plan and 2.5 m of its height stands in a chimney's throat: melt wells over that lip and runs
  // burning down a spire's flank. A crown with no mouth's steam burns on a crag's broken head, or where a seam's
  // hot tongues stand together: no pipe stands under it, and of a crag's ledges this build knows nothing: such a
  // crown burns as its ring of tongues alone, and no run is laid down from it.
  const MOUTHS = [];
  if (opts.puffs) { const S = opts.puffs.S, M = opts.puffs.M, n = S.length / 4;
    for (let i = 0; i < n;) { let j = i + 1; while (j < n && M[i * 4 + 3] < 0.5 && M[j * 4 + 3] < 0.5 && Math.abs(S[j * 4 + 1] - S[i * 4 + 1]) < 1e-3 && Math.abs(S[j * 4] - S[i * 4]) <= 1 && Math.abs(S[j * 4 + 2] - S[i * 4 + 2]) <= 1) j++;
      if (j - i >= 8) MOUTHS.push(i, j); i = j; }
    for (const c of CH) { c.pipe = false; for (let q = 0; q < MOUTHS.length && !c.pipe; q += 2) { const i = MOUTHS[q] * 4; c.pipe = Math.abs(S[i + 1] - c.lip) <= 2.5 && Math.hypot(S[i] - c.x, S[i + 2] - c.z) <= 1.5; } } }
  else for (const c of CH) c.pipe = true;
  if (opts.yield) await opts.yield();
  // --- the flames: one instanced mesh ---
  if (opts.flames && opts.flames.P.length) { const g = quad(), FPa = Array.from(opts.flames.P), FQa = Array.from(opts.flames.Q), G = opts.glows;
    // (A FRONT OF FIRE. The low tongues the world sets on a slick of sulphur afloat, broader than they are tall
    // (their breadth over 1.05 of the height's own share: the mark of a front, in iQ's fourth number), are not
    // so many separate flames of one make: fire that stands so close on one slick runs together. The flames' law
    // draws a front as a low bed of fire with a row of tongues of unlike heights rooted in it; and it is as
    // broad as its neighbours stand off: where two more tongues that burn always stand within 1.9 m of its foot
    // (d2: how far the second of them stands), its half breadth is eight tenths of d2, never less than the
    // world's own measure for it and never over 1.4 m: so front after front they are one fire.
    // AND A COURSE IS NOT A ROW OF LIKE BEADS: a tongue of the common breadth that burns always (not a roaring
    // vent's or a crown's, which burn hotter, nor one of a chimney's crown), stands under 2.6 m tall and has two
    // more such within 1.9 m of its foot stands in a course down a skin of sulphur: there the fire stands tall
    // in runs and burns low between them, by a slow field over the place, some 7 m to a turn: from the whole of
    // the height the world gave it down to 0.45 of it. None is made taller than the world set it. AND ITS
    // TONGUES RUN TOGETHER: each is as broad at the foot as its height's whole share (the breadth the world
    // counts clear for a tongue), and is marked (-1.2 in iQ's third number, which still says it burns always):
    // the flames' law gives a marked tongue a lower tongue at either side, so tongue by tongue the course is
    // one run of fire with tongues of unlike heights rising from it.
    // SLK: the feet of the fronts, for their slicks: see the halos.)
    const SLK = new Map(), skey = (x, z) => Math.round(x * 20) * 100003 + Math.round(z * 20);
    { const nF = FPa.length / 4, cell = new Map(), inC = new Set(), key = (x, y, z) => (Math.floor(x / 2) * 73856093) ^ (Math.floor(y / 2) * 19349663) ^ (Math.floor(z / 2) * 83492791);
      for (const c of CH) for (const j of c.L) inC.add(j);
      const cand = (j) => FQa[j + 2] < 0 && FQa[j + 2] > -1.5 && FPa[j + 3] < 2.6 && !inC.has(j);
      for (let j = 0; j < nF * 4; j += 4) if (cand(j)) { const k = key(FPa[j], FPa[j + 1], FPa[j + 2]); let L = cell.get(k); if (!L) cell.set(k, L = []); L.push(j); }
      if (opts.yield) await opts.yield();
      for (let j = 0; j < nF * 4; j += 4) { if (opts.yield && j % 800 === 796) await opts.yield(); if (!cand(j)) continue; const x = FPa[j], y = FPa[j + 1], z = FPa[j + 2], wide = FQa[j + 3]; let d1 = 1e9, d2 = 1e9, h = FPa[j + 3];
        for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) for (let iz = -1; iz <= 1; iz++) { const L = cell.get(key(x + 2 * ix, y + 2 * iy, z + 2 * iz));
          if (L) for (const q of L) if (q !== j) { const d = Math.hypot(FPa[q] - x, FPa[q + 1] - y, FPa[q + 2] - z); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } }
        if (wide <= 1) { if (d2 < 1.9) { FPa[j + 3] = h * (0.45 + 0.55 * sstep(0.3, 0.75, 0.5 + 0.5 * Math.sin(x * 0.9 + 1.7 * Math.sin(z * 0.7) + y * 1.1))); FQa[j + 3] = 1; FQa[j + 2] = -1.2; } continue; }
        const wm = Math.min(Math.max(0.19 * h * wide, d2 < 1.9 ? 0.8 * d2 : 0), Math.max(1.4, 0.19 * h * wide));
        FQa[j + 3] = Math.max(wm / (0.19 * h), 1.06); SLK.set(skey(x, z), Math.min(Math.max(wm * 1.25, 0.8), 1.8)); }
      if (opts.yield) await opts.yield(); }
    // (THE HALOS ride in this mesh, after the tongues: the world's halo of every burning line and large tongue
    // (a glow of kind 1) at its own place and radius; its strength, the world's own, is kept below nought as its mark)
    // (WHERE HALOS LIE OVER ONE ANOTHER, in a field of fire, each is weakened by as much as the others add at its
    // middle: the light of all of them together is nowhere more than one line's own, so a field is never a wash)
    // (A HALO OF A WALL'S SEAM, one that lies within 4 m of a ribbon standing out from a wall, is told by 100 added
    // to its strength: it stands up before the wall, turned to the eye's place, and is 1.8 times as strong;
    // every other lies flat over the ground it lights)
    const SP = [], SQ = [];
    if (G) { const H = [], SM = [], c = opts.curtains;
      for (let i = 0, ng = G.P.length / 4; i < ng; i++) { const k = G.R[i * 4 + 3]; if (k > 0.5 && k < 1.5) H.push(i * 4); }
      if (c) for (let v = 0, nv = c.P.length / 3; v < nv; v += 6) { const l = Math.hypot(c.T[v * 4], c.T[v * 4 + 1], c.T[v * 4 + 2]); if (l > 0 && c.T[v * 4 + 1] / l < 0.5) SM.push(c.P[v * 3], c.P[v * 3 + 1], c.P[v * 3 + 2]); }
      let hn = 0;
      for (const i of H) { const x = G.P[i], y = G.P[i + 1], z = G.P[i + 2]; let A = 0, wall = 0; if (opts.yield && hn++ % 2 === 0) await opts.yield();   // (the build rests before the first halo and after every second: each is weighed against every other)
        for (const j of H) { const d2 = ((G.P[j] - x) ** 2 + (G.P[j + 1] - y) ** 2 + (G.P[j + 2] - z) ** 2) / (G.R[j] * G.R[j]); if (d2 < 1) A += G.Q[j + 3] * (1 - d2) * (1 - d2); }
        for (let j = 0; j < SM.length && !wall; j += 3) if ((SM[j] - x) ** 2 + (SM[j + 1] - y) ** 2 + (SM[j + 2] - z) ** 2 < 16) wall = 1;
        // (its radius is 0.85 of the world's: with the tongues' broad sheets the whole fill of the fire's sprites is kept low)
        // (THE HALO OF A FRONT IS ITS SLICK: where a halo lies at the foot of a front (SLK: by its place, to the
        // twentieth of a metre) the sulphur afloat burns about the front: in the halo's stead lie rims of low
        // fire along the crust's edges and a deep blue glow on the water, level, within a round a quarter broader
        // than the front's half breadth (0.8 to 1.8 m of radius); slick by slick the rims run on. Told by 200 added to its
        // strength; the slicks are drawn before the tongues (SP, SQ): a front stands in its slick, not behind it)
        const sl = SLK.get(skey(x, z));
        if (sl) { SP.push(x, y, z, sl); SQ.push(G.Q[i], G.Q[i + 1], G.Q[i + 2], -Math.max(G.Q[i + 3] * HALO * Math.min(1, 0.2 / Math.max(A, 1e-3)), 1e-4) - 200); }
        else { FPa.push(x, y, z, G.R[i] * 0.85); FQa.push(G.Q[i], G.Q[i + 1], G.Q[i + 2], -Math.max(G.Q[i + 3] * HALO * (wall ? 1.8 : 1) * Math.min(1, 0.2 / Math.max(A, 1e-3)), 1e-4) - 100 * wall); } } }
    // (A CHIMNEY'S CROWN: its tongues are as broad at the foot as a roaring vent's (the world sets them half to
    // seven tenths as broad: a thin flame on a spire); and the air about the mouth glows: one halo, upright,
    // turned to the eye's place, small enough to lie within 1.1 of the crown's tallest tongue of the crown's
    // feet, which is the air the world counted clear for that tongue)
    for (const [ci, c] of CH.entries()) { for (const j of c.L) FQa[j + 3] = Math.max(FQa[j + 3], 1);
      FPa.push(c.x, c.lip, c.z, Math.max((1.1 * c.tall - 0.95) / 1.35, 0.5)); FQa.push(hash1(ci * 17 + 3), c.east, -1, -0.3 * HALO * 1.8 - 100); }
    const n = (SP.length + FPa.length) / 4, IP = new Float32Array(n * 4), IQ = new Float32Array(n * 4); IP.set(SP); IP.set(FPa, SP.length); IQ.set(SQ); IQ.set(FQa, SQ.length);
    g.setAttribute('iP', new THREE.InstancedBufferAttribute(IP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(IQ, 4)); g.instanceCount = n;
    // (the order of drawing: the licks and the river's tiles (4), the ribbons (4.5), the large tongues and the
    // halos (4.6), each laid over the one before; then the steam (5), which veils whatever fire stands behind
    // it; the sparks (7))
    const m = new THREE.Mesh(g, flameMaterial({ ...shared })); m.frustumCulled = false; m.renderOrder = 4.6; group.add(m); made.push(g); }
  if (opts.yield) await opts.yield();
  // --- the curtains: one mesh of every ribbon of flame (opts.curtains { P, T, U, I }: laid by the world along its
  // burning lines, which counts their clear air) ---
  // (RSTEEP: for each point told off in RIB, how steep the line falls there: 0 under 0.45 of a metre to a metre of the line, 1 from 0.65 (27 to 40 degrees))
  const RIB = [], RSTEEP = [], XF = [], XB = [], TP = [], TQ = [], TR = [], TF = [], FPL = [], tcell = new Map(), facts = { tongues: 0, tiles: 0, pours: 0, pourDrop: 0 };
  const bay0 = LUn.uBay ? LUn.uBay.value : { x: 0, y: 0 }, eastOf = (x, z) => sat((((x - bay0.x) - (z - bay0.y)) * 0.7071 + 78) / 120);
  let RC = opts.curtains;                                            // (the ribbons as they are drawn: the world's own, with each fall of fire laid anew)
  if (opts.curtains && opts.curtains.I.length) { const g = new THREE.BufferGeometry(), cw = opts.curtains, c = RC = { P: Float32Array.from(cw.P), T: Float32Array.from(cw.T), U: Float32Array.from(cw.U), I: cw.I };
    // A FALL OF FIRE THAT DOUBLES BACK IS LAID ANEW, ONE RUN DOWN THE FACE. A ground line whose ends stand apart in
    // height by more than seven tenths of their distance, and by 3 m or more, comes down a steep face: where the
    // world's points step from ledge to gully and back, up and down the face, a ribbon laid from point to point in
    // their order doubles back on itself and stands as a comb of slabs. Its points are told off again by how far down
    // the fall they stand; of the face it keeps the outermost of every thirteen points in a row (the fire falls
    // clear of the ledges, not through them), eased; and its feet are set at even steps down that run.
    // IT STAYS IN ITS OWN AIR: the world counts 1.3 of a ribbon's height clear about each of its points; a foot
    // set anew bears a flame only as tall as still lies inside that air of one of the line's own points (h), and
    // none where that is under 0.3 m. Each foot keeps the way and the channel of the point that stood as far
    // down the fall.
    for (let a = 0, nv = c.P.length / 3; a < nv;) { let b = a; while (b < nv && c.U[b * 4 + 1] === c.U[a * 4 + 1]) b += 3;
      const np = (b - a) / 3, e = b - 3, sg = c.P[e * 3 + 1] > c.P[a * 3 + 1] ? -1 : 1, top = sg > 0 ? a : e;   // (sg: 1 where the line is told off from its top down)
      const dx = (c.P[e * 3] - c.P[a * 3]) * sg, dy = (c.P[e * 3 + 1] - c.P[a * 3 + 1]) * sg, dz = (c.P[e * 3 + 2] - c.P[a * 3 + 2]) * sg, ch = Math.hypot(dx, dy, dz), hl = Math.hypot(dx, dz);
      const vm = a + 3 * (np >> 1), upm = c.T[vm * 4 + 1] / (Math.hypot(c.T[vm * 4], c.T[vm * 4 + 1], c.T[vm * 4 + 2]) || 1);
      // (back: the line doubles back: one of its points stands more than half a metre further up the fall than the
      // point told off before it. A line that goes one way down the face is left as the world laid it)
      let back = false; for (let i = 1; i < np && !back; i++) { const v = a + 3 * i; back = ((c.P[v * 3] - c.P[v * 3 - 9]) * dx + (c.P[v * 3 + 1] - c.P[v * 3 - 8]) * dy + (c.P[v * 3 + 2] - c.P[v * 3 - 7]) * dz) * sg < -0.5 * ch; }
      if (back && np > 8 && upm >= 0.5 && -dy > 3 && -dy > 0.7 * ch && hl > 0.02 * ch) {
        // (d: down the fall from end to end; q: square to it, out from the face; w: along the face)
        const d = [dx / ch, dy / ch, dz / ch], ql = -dy / ch, k1 = hl / ch, q = [(dx / hl - k1 * d[0]) / ql, (-k1 * d[1]) / ql, (dz / hl - k1 * d[2]) / ql], w = [d[1] * q[2] - d[2] * q[1], d[2] * q[0] - d[0] * q[2], d[0] * q[1] - d[1] * q[0]];
        if (opts.yield) await opts.yield();   // (the build rests before each fall is laid anew, and again in the middle of it)
        const pt = [], oP = [], oT = [], oU = [], oL = [], W = 6, T0 = [c.P[top * 3], c.P[top * 3 + 1], c.P[top * 3 + 2]];
        for (let i = 0; i < np; i++) { const v = a + 3 * i, x = c.P[v * 3] - T0[0], y = c.P[v * 3 + 1] - T0[1], z = c.P[v * 3 + 2] - T0[2]; pt.push([x * d[0] + y * d[1] + z * d[2], x * q[0] + y * q[1] + z * q[2], x * w[0] + y * w[1] + z * w[2], v]); }
        pt.sort((m, n) => m[0] - n[0] || m[3] - n[3]);
        for (const p of pt) { const v = p[3]; oP.push(c.P[v * 3], c.P[v * 3 + 1], c.P[v * 3 + 2]); oT.push(c.T[v * 4], c.T[v * 4 + 1], c.T[v * 4 + 2]); oU.push(c.U[v * 4 + 2], c.U[v * 4 + 3]); oL.push(Math.hypot(c.T[v * 4], c.T[v * 4 + 1], c.T[v * 4 + 2])); }   // (oL: each point's flame's height)
        const env = pt.map((p, i) => { let m = -1e9; for (let j = Math.max(0, i - W); j <= Math.min(np - 1, i + W); j++) m = Math.max(m, pt[j][1]); return m; });
        const ease = (f, i, R) => { let s = 0, ws = 0; for (let j = Math.max(0, i - R); j <= Math.min(np - 1, i + R); j++) { const k = R + 1 - Math.abs(j - i); s += f(j) * k; ws += k; } return s / ws; };
        const path = pt.map((p, i) => { const t = ease((j) => pt[j][0], i, 2), u = ease((j) => env[j], i, W), s = ease((j) => pt[j][2], i, W); return [T0[0] + d[0] * t + q[0] * u + w[0] * s, T0[1] + d[1] * t + q[1] * u + w[1] * s, T0[2] + d[2] * t + q[2] * u + w[2] * s]; });
        const cum = [0]; for (let i = 1; i < np; i++) cum.push(cum[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]));
        for (let k = 0, j = 0; k < np; k++) { const s = (k / (np - 1)) * cum[np - 1]; while (j < np - 2 && cum[j + 1] < s) j++;
          if (opts.yield && k % 48 === 47) await opts.yield();
          const f = (s - cum[j]) / Math.max(cum[j + 1] - cum[j], 1e-6), R = [0, 1, 2].map((r) => path[j][r] + (path[j + 1][r] - path[j][r]) * f); let h = 0;
          for (let m = 0; m < np; m++) h = Math.max(h, oL[m] - Math.hypot(R[0] - oP[m * 3], R[1] - oP[m * 3 + 1], R[2] - oP[m * 3 + 2]) / 1.3);
          // (its height and its strength: those of the points that stood about as far down the fall, eased over
          // seven of them, for in the world's order a dull point and a burning one, a tall and a low, lie mixed;
          // a foot that may bear no flame keeps its way, a hair long, and burns at nought)
          const tl = Math.hypot(oT[k * 3], oT[k * 3 + 1], oT[k * 3 + 2]), hf = Math.min(ease((j) => Math.hypot(oT[j * 3], oT[j * 3 + 1], oT[j * 3 + 2]), k, 3), h), sc = tl > 0 && hf >= 0.3 ? hf / tl : 1e-5 / Math.max(tl, 1e-5);
          const burn = hf >= 0.3 ? ease((j) => oU[j * 2], k, 3) : 0, slot = a + 3 * (sg > 0 ? k : np - 1 - k);
          for (let r = 0; r < 3; r++) { const v = slot + r; c.P[v * 3] = R[0]; c.P[v * 3 + 1] = R[1]; c.P[v * 3 + 2] = R[2]; c.T[v * 4] = oT[k * 3] * sc; c.T[v * 4 + 1] = oT[k * 3 + 1] * sc; c.T[v * 4 + 2] = oT[k * 3 + 2] * sc;
            c.U[v * 4 + 2] = burn; c.U[v * 4 + 3] = oU[k * 2 + 1]; } } }
      a = b; }
    if (opts.yield) await opts.yield();
    g.setAttribute('position', new THREE.Float32BufferAttribute(c.P, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(c.T, 4)); g.setAttribute('aU', new THREE.Float32BufferAttribute(c.U, 4));
    // (aF, four numbers from each ribbon's own feet: a ribbon is a run of points with one seed, three corners to a
    // point. Its sulphur runs toward its lower end, 1.5 m/s and faster the steeper the whole line falls, not at all
    // on a line that falls under half a metre. The other three: sk, met and hot, each said where it is worked out.
    // RIB, for the licks: at each point of every ribbon its place, the line's metres there (each ribbon's set off
    // by its seed), the sulphur's speed, and how far a tongue's tip is drawn down-stream there, metres to a
    // metre of its height, as a way in the world's x and z (the law is at the line that works it out, below), and
    // nothing where the ribbon lies out from a wall (up: the share of the flame's way that is upward): on a wall
    // hot gas climbs)
    // (aD: the way the ribbon's line runs at each point, a unit, from its feet two points to either side as they
    // are drawn: with the flame's way it gives the sheet's own face there, evenly from point to point; and its
    // fourth number, on a wall's seam and on a fall's line: what the flame's height there is to be taken times
    // for the turned stroke, so that the stroke is as broad as the flame stands in the mean over some 8 points to
    // either side: the world deals a tall seam's flame a height of its own at every point, and a stroke as broad
    // as each point's own flame is a comb of spikes to either side of the crack)
    const nv = c.P.length / 3, F = new Float32Array(nv * 4), D = new Float32Array(nv * 4), py = (v) => c.P[v * 3 + 1], dd = (v, w) => Math.hypot(c.P[v * 3] - c.P[w * 3], c.P[v * 3 + 1] - c.P[w * 3 + 1], c.P[v * 3 + 2] - c.P[w * 3 + 2]);
    const PA = g.attributes.position.array, UA = g.attributes.aU.array, TA = g.attributes.aT.array; let a0 = 0;   // (a0: the build rests after every 150 points of ribbon)
    if (opts.yield) await opts.yield();
    // (WHICH RIBBONS ARE A FALL OF FIRE, told off before any is made (FALLS: each one's first corner). A fall is
    // known by its line (see below, at the seams): steep from end to end. AND WHERE A FALL LANDS ITS FIRE RUNS
    // ON: a short line (under 40 m) that drops more than three tenths of its straight way, and whose upper end stands
    // within 10 m of a point of a fall, is that fall's run-out down the scree at its foot, and is a fall too:
    // the fire that comes down the wall is one body to the water)
    const FALLS = new Set(), RUN = new Set();   // (RUN: the run-outs among them)
    { const RB = [], FPT = []; for (let a = 0; a < nv;) { let b = a; while (b < nv && c.U[b * 4 + 1] === c.U[a * 4 + 1]) b += 3;
        const np = (b - a) / 3, drop = py(a) - py(b - 3), chd = dd(a, b - 3), vm = a + 3 * (np >> 1), upM = c.T[vm * 4 + 1] / (Math.hypot(c.T[vm * 4], c.T[vm * 4 + 1], c.T[vm * 4 + 2]) || 1);
        if (!(upM < 0.5 && np > 8 || upM < -0.3) && np > 3 && Math.abs(drop) > 2.5 && Math.abs(drop) > 0.3 * chd) {
          if (Math.abs(drop) > 0.7 * chd) { FALLS.add(a); for (let v = a; v < b; v += 3) FPT.push(v); } else if (chd < 40) RB.push([a, drop > 0 ? a : b - 3]); }
        a = b; }
      if (opts.yield) await opts.yield();
      for (const r of RB) { for (let k = 0; k < FPT.length; k++) if (dd(r[1], FPT[k]) < 10) { FALLS.add(r[0]); RUN.add(r[0]); break; }
        if (opts.yield) await opts.yield(); } }
    // (A FALL'S OWN PLANE. The lines of one fall are gathered (those whose middles stand within 70 m of one
    // another on the level), and through the middle of all the points of a fall of eight lines or more goes
    // the fall's plane: it holds the way the lines run down and the level way across them. The fall's fire is
    // told off on that plane: see the stroke's law. PLN: for each such ribbon, by its first corner, the plane's unit
    // normal and its place along it)
    const PLN = new Map(), FIL = new Map(), MST = new Map(), JMP = new Set(), EDG = new Map(), JN = new Map();
    { const CLU = [];
      for (const a of FALLS) { let b = a, sx = 0, sz = 0, k = 0; while (b < nv && c.U[b * 4 + 1] === c.U[a * 4 + 1]) { sx += c.P[b * 3]; sz += c.P[b * 3 + 2]; k++; b += 3; }
        let cl = CLU.find((q) => Math.hypot(q.x / q.k - sx / k, q.z / q.k - sz / k) < 70); if (!cl) CLU.push(cl = { x: 0, z: 0, k: 0, R: [] });
        cl.x += sx; cl.z += sz; cl.k += k; cl.R.push([a, b]); }
      if (opts.yield) await opts.yield();
      for (const cl of CLU) { if (cl.R.length < 8) continue;
        // (m: the middle of all its points; dw: the way its lines run down, each line's from its upper end to its
        // lower, summed; S: how its points are spread on the level)
        const m = [0, 0, 0], dw = [0, 0, 0], S = [0, 0, 0]; let k = 0;
        for (const [a, b] of cl.R) { const e = b - 3, sg = py(a) > py(e) ? 1 : -1, l = dd(a, e) || 1; dw[0] += (c.P[e * 3] - c.P[a * 3]) * sg / l; dw[1] += (py(e) - py(a)) * sg / l; dw[2] += (c.P[e * 3 + 2] - c.P[a * 3 + 2]) * sg / l;
          for (let v = a; v < b; v += 3) { m[0] += c.P[v * 3]; m[1] += c.P[v * 3 + 1]; m[2] += c.P[v * 3 + 2]; k++; } }
        m[0] /= k; m[1] /= k; m[2] /= k;
        for (const [a, b] of cl.R) for (let v = a; v < b; v += 3) { const x = c.P[v * 3] - m[0], z = c.P[v * 3 + 2] - m[2]; S[0] += x * x; S[1] += x * z; S[2] += z * z; }
        // (t: the level way across the fall: square to the way its lines run out from the wall as they come down;
        // where they come straight down, the way in which its points are spread the most. The plane holds t and
        // the way the lines run down: its normal is square to both)
        const dl = Math.hypot(dw[0], dw[1], dw[2]) || 1, oh = Math.hypot(dw[0], dw[2]), th = 0.5 * Math.atan2(2 * S[1], S[0] - S[2]);
        const t = oh > 0.15 * dl ? [-dw[2] / oh, 0, dw[0] / oh] : [Math.cos(th), 0, Math.sin(th)];
        const n = [t[1] * dw[2] - t[2] * dw[1], t[2] * dw[0] - t[0] * dw[2], t[0] * dw[1] - t[1] * dw[0]], nl = Math.hypot(n[0], n[1], n[2]) || 1, pl = [n[0] / nl, n[1] / nl, n[2] / nl, 0];
        pl[3] = pl[0] * m[0] + pl[1] * m[1] + pl[2] * m[2];
        for (const [a] of cl.R) PLN.set(a, pl);
        if (opts.yield) await opts.yield();
        // (THE FALL IS FILLED FROM LINE TO LINE. At each point of each line: how far across the fall (along t) the
        // next line of the same fall that burns stands to either side, among the points within 2.5 m of its own
        // height (one nearer than half a metre across is the same strand's next piece and is passed over). Where
        // one stands there, no further off than a tenth of the fall's whole height and 24 m at the most, the
        // stroke's body reaches nine tenths of the way to it; where the next stands up to twice as far, a little
        // over half the way (24.5 m at the most), and the two meet in the middle: so the lines of a fall are one
        // body with no gap between them, and only the fall's own outer sides are torn. FIL: for each such point the two reaches,
        // metres, the one toward -t in whole thirty-seconds of a metre, the one toward +t as twenty-fifths of the rest.
        // AND WHERE A HIGH FALL LANDS ITS FOOT STANDS IN ITS OWN LIT MIST: MST, for each point of a fall over
        // 40 m high, how deep it stands in the mist: 1 at the fall's lowest point, nought from 10 m over it)
        // (a run-out down the scree is not filled and fills no other: its lines lie aslant, each a bed of its own.
        // And a point with no reach between two that have one takes the lesser of theirs: a line's body does not
        // draw in for one point's length. GAP: each point's two reaches before they are packed)
        const PT = [], GAP = []; let y0 = 1e9, y1 = -1e9, ri = 0;
        for (const [a, b] of cl.R) { const run = RUN.has(a) ? 1 : 0; for (let v = a; v < b; v += 3) { PT.push(v, (c.P[v * 3] - m[0]) * t[0] + (c.P[v * 3 + 2] - m[2]) * t[2], py(v), ri, run); y0 = Math.min(y0, py(v)); y1 = Math.max(y1, py(v)); } ri++; }
        const cap = y1 - y0 > 20 ? Math.min(24, 0.1 * (y1 - y0)) : 0;   // (a fall under 20 m high is not filled: its lines are strands)
        // (BK: the points that burn and are no run-out's, told off by 2.5 m of height: a point's neighbours in
        // height lie in its own cell and the next above and below; the build rests after every 50 points)
        if (opts.yield) await opts.yield();
        const BK = new Map(), bk = (y) => Math.floor(y / 2.5);
        for (let j = 0; j < PT.length; j += 5) if (!PT[j + 4] && c.U[PT[j] * 4 + 2] > 0.05) { const k = bk(PT[j + 2]); let L = BK.get(k); if (!L) BK.set(k, L = []); L.push(j); }
        if (opts.yield) await opts.yield();
        // (NN: how far each point stands out from the fall's plane. Where the wall steps forward the fall comes
        // down two faces, one before the other: a line more than 5 m before or behind a point is not its
        // neighbour, is not filled toward, and the body does not go on to it: each face's fire has its own sides)
        const NN = new Float32Array(PT.length / 5); for (let j = 0; j < PT.length; j += 5) NN[j / 5] = c.P[PT[j] * 3] * pl[0] + c.P[PT[j] * 3 + 1] * pl[1] + c.P[PT[j] * 3 + 2] * pl[2];
        for (let i = 0; i < PT.length; i += 5) { let gl = 1e9, gr = 1e9; if (opts.yield && i % 250 === 245) await opts.yield();
          if (!PT[i + 4]) for (let kb = bk(PT[i + 2]) - 1, ke = kb + 2; kb <= ke; kb++) { const L = BK.get(kb);
            if (L) for (const j of L) { if (PT[j + 3] === PT[i + 3] || Math.abs(PT[j + 2] - PT[i + 2]) > 2.5 || Math.abs(NN[j / 5] - NN[i / 5]) > 5) continue; const ds = PT[j + 1] - PT[i + 1]; if (ds > 0.5) gr = Math.min(gr, ds); else if (ds < -0.5) gl = Math.min(gl, -ds); } }
          GAP.push(gl < cap ? 0.9 * gl : gl < 2 * cap ? Math.min(0.55 * gl, 24.5) : 0, gr < cap ? 0.9 * gr : gr < 2 * cap ? Math.min(0.55 * gr, 24.5) : 0);
          if (y1 - y0 > 40 && PT[i + 2] < y0 + 10) MST.set(PT[i], 1 - (PT[i + 2] - y0) / 10); }
        for (let i = 0, k = 0; i < PT.length; i += 5, k += 2) { const in0 = i >= 5 && PT[i - 2] === PT[i + 3], in1 = i + 5 < PT.length && PT[i + 8] === PT[i + 3];
          const gl = GAP[k] || (in0 && in1 ? Math.min(GAP[k - 2], GAP[k + 2]) : 0), gr = GAP[k + 1] || (in0 && in1 ? Math.min(GAP[k - 1], GAP[k + 3]) : 0);
          FIL.set(PT[i], Math.floor(gl * 32) + gr / 25); }
        if (opts.yield) await opts.yield();
        // (THE FALL'S TWO SIDES, for their tearing: see the stroke's law. At each point of each line: how far
        // across the fall (along t, from the fall's middle m) the body's outer side stands to either hand, among
        // the points within 3 m of its own height. The body goes on from line to line as long as the next
        // line stands within 6 m; where the next stands further off the body has a side there too, and the
        // fill between the two is torn as a side is. EDG: for each point the two sides' places across the
        // fall. The plane carries its level way and its middle's place along it for them (pl's last four
        // numbers). The build rests after every second cell of height)
        pl.push(t[0], t[1], t[2], t[0] * m[0] + t[2] * m[2]);
        { let ek = 0; for (const k of BK.keys()) { const W = []; for (let q = k - 1; q <= k + 1; q++) { const M = BK.get(q); if (M) for (const j of M) W.push(j); }
            W.sort((p, q) => PT[p + 1] - PT[q + 1]);
            for (let q = 0; q < W.length; q++) { const j = W[q], y = PT[j + 2]; if (bk(y) !== k) continue; let tl = PT[j + 1], tr = tl;
              for (let p = q - 1; p >= 0; p--) { const o = W[p]; if (Math.abs(PT[o + 2] - y) > 3 || Math.abs(NN[o / 5] - NN[j / 5]) > 5) continue; if (tl - PT[o + 1] > 6) break; tl = PT[o + 1]; }
              for (let p = q + 1; p < W.length; p++) { const o = W[p]; if (Math.abs(PT[o + 2] - y) > 3 || Math.abs(NN[o / 5] - NN[j / 5]) > 5) continue; if (PT[o + 1] - tr > 6) break; tr = PT[o + 1]; }
              EDG.set(PT[j], [tl, tr]); }
            if (opts.yield && ++ek % 2 === 0) await opts.yield(); } }
        if (opts.yield) await opts.yield();
        // (WHERE THE FALL BREAKS ON A LEDGE ITS FIRE RUNS ON. The world lays the fall tier by tier: a line ends
        // on a ledge and another begins at the ledge's lip. Where a line's lower end stands within 12 m of
        // another line's upper end (and that end no more than 9 m over it), the fire of the upper line spills
        // over the lip: its last point is carried down the lower line, 1.5 to 9 m past that line's head, each
        // line by its own seed, so the shelf between the two is covered as it is seen from above; and the fire
        // piles up on the lip: the lower line's first point is carried straight up from the lip, 1.5 to 7.5 m,
        // so the lip's own edge of rock is covered as it is seen from below. Each such end is a tongue that
        // draws in to a point (see even, below), and it burns to its tip: the two tiers lie over one another
        // raggedly, and no level edge and no dark line of rock stands between them. A line under 6 m of fall
        // takes no part. JN: for each such end point its carried place. It lies along the fall's own lines,
        // across the ledge between them and in the air over the lip, where the upper tier's fire comes down)
        { const EN = []; for (const [a, b] of cl.R) if (!RUN.has(a) && Math.abs(py(a) - py(b - 3)) > 6) { const dn = py(a) > py(b - 3); EN.push([dn ? a : b - 3, dn ? b - 3 : a, a, b]); }
          const along = (L, v, d) => { const st = v === L[2] ? 3 : -3, end = v === L[2] ? L[3] - 3 : L[2];
            while (v !== end) { const w = v + st, s = dd(v, w); if (s >= d) { const k = d / Math.max(s, 1e-3); return [c.P[v * 3] + (c.P[w * 3] - c.P[v * 3]) * k, py(v) + (py(w) - py(v)) * k, c.P[v * 3 + 2] + (c.P[w * 3 + 2] - c.P[v * 3 + 2]) * k]; } d -= s; v = w; }
            return [c.P[v * 3], py(v), c.P[v * 3 + 2]]; };
          for (const A of EN) { let bu = null, du = 12, bl = null, dl = 12; const h1 = hash1(c.U[A[2] * 4 + 1] * 997 + 3), h2 = hash1(c.U[A[2] * 4 + 1] * 997 + 11);
            for (const B of EN) { if (B === A) continue; const d = dd(A[1], B[0]); if (d < du && py(B[0]) < py(A[1]) + 9) { du = d; bu = B; }
              const e = dd(A[0], B[1]); if (e < dl && py(B[1]) > py(A[0]) - 9) { dl = e; bl = B; } }
            if (bu) JN.set(A[1], along(bu, bu[0], 1.5 + 7.5 * Math.pow(h1, 1.7))); if (bl) JN.set(A[0], [c.P[A[0] * 3], py(A[0]) + 1.5 + 6 * Math.pow(h2, 1.5), c.P[A[0] * 3 + 2]]); }
          if (opts.yield) await opts.yield(); } } }
    for (let a = 0; a < nv;) { let b = a; while (b < nv && c.U[b * 4 + 1] === c.U[a * 4 + 1]) b += 3;
      const np = (b - a) / 3, drop = py(a) - py(b - 3); let len = 0; for (let i = 1; i < np; i++) len += dd(a + 3 * i, a + 3 * i - 3);
      // (A WALL'S SEAM, known by its flame standing out from the wall more than up: its ribbon is ONE stroke down
      // the crack. Its sheet is rooted on the seam's run eased over some 4 m of its fall (the crack steps over
      // every ledge of the cliff, and a sheet that steps with it is a comb of bars from along the wall);
      // and where the seam burns low between its reaches the ribbon still burns, at half strength, to within 4 m
      // of each of its ends: from afar a seam is not a row of dashes)
      // (A FALL OF FIRE, known by its line: four points or more, dropping more than 2.5 m and more than seven
      // tenths of the straight way from its one end to its other (FALLS, above; with its run-out): each of its
      // lines is a stroke of the same kind, turned to the eye's place about its own run, eased as a seam's is,
      // its flame taken even along it: a body of falling fire. Lines of a fall that lie close run into one
      // body. It bears no sheets of the river's)
      // (AND A LINE THAT HANGS UNDER AN OVERHANG, known by its flame's way pointing down (more than three tenths
      // of it, at the line's middle; four points or more), is a stroke of the seam's kind too: fire that holds
      // to the rock from below. No sheet hangs down from it and no sheet of the river's lies under it: its
      // stroke lies in the rock's face about the line, and its fire rises round the rock on the upper side)
      let seam = false; const vm = a + 3 * (np >> 1), upM = c.T[vm * 4 + 1] / (Math.hypot(c.T[vm * 4], c.T[vm * 4 + 1], c.T[vm * 4 + 2]) || 1); seam = upM < 0.5 && np > 8 || upM < -0.3 && np > 3;
      const fallR = FALLS.has(a);
      // (A BREAK IN A GROUND LINE BEARS NO FIRE. Where one piece of a line is more than 8 m long and more than four
      // times as long as its pieces are in the middle of their run of lengths, the line has leapt from one ground
      // to another (a point of it fell on the wall over a shelf, or under it): a sheet drawn across the leap is
      // a hair across the cliff. JMP: the later point of each such piece; it bears no ribbon and no tile)
      if (!seam && !fallR && np > 4) { const L = []; for (let i = 1; i < np; i++) L.push(dd(a + 3 * i, a + 3 * i - 3)); const md = L.slice().sort((p, q) => p - q)[L.length >> 1];
        for (let i = 1; i < np; i++) if (L[i - 1] > 8 && L[i - 1] > 4 * md) JMP.add(a + 3 * i); }
      // (LF, on a stroke's line: each point's own fall, metres down to a metre along the line; cumM: the metres along
      // the line to each point; ER: over how many points to either side a stroke's run and its flame are eased:
      // some 5 m of the line, eight points at the most, and no further than the line's nearer end stands, so its
      // two ends stay where the world set them: a fall's head stays at its lip)
      const LF = seam || fallR ? new Float32Array(np) : null, cumM = seam || fallR ? new Float32Array(np) : null, ER = Math.max(1, Math.min(8, Math.round(5 * (np - 1) / Math.max(len, 0.5))));
      if (LF) for (let i = 0; i < np; i++) { const v0 = a + 3 * Math.max(0, i - 2), v1 = a + 3 * Math.min(np - 1, i + 2); LF[i] = Math.abs(py(v0) - py(v1)) / Math.max(dd(v0, v1), 0.5); if (i) cumM[i] = cumM[i - 1] + dd(a + 3 * i, a + 3 * i - 3); }
      if (seam || fallR) for (let i = 0; i < np; i++) { const v = a + 3 * i, er = Math.min(ER, i, np - 1 - i); let sx = 0, sy = 0, sz = 0, w = 0;
        for (let j = i - er; j <= i + er; j++) { const q = a + 3 * j, k = er + 1 - Math.abs(j - i); sx += c.P[q * 3] * k; sy += c.P[q * 3 + 1] * k; sz += c.P[q * 3 + 2] * k; w += k; }
        const lit = seam && Math.hypot(c.T[v * 4], c.T[v * 4 + 1], c.T[v * 4 + 2]) > 0 ? 0.5 * sat(Math.min(i, np - 1 - i) / 8) : 0;
        // (a fall's stroke ends softly: it burns at nought at its two end points and at six tenths at the next: no stroke ends in a cut.
        // An end that is carried over a ledge (JN) burns to its tip, at a half there, and stands at its carried place)
        const jp = JN.get(v), endK = fallR ? Math.min(1, JN.has(a) ? 0.5 + i : 0.6 * i, JN.has(b - 3) ? 0.5 + (np - 1 - i) : 0.6 * (np - 1 - i)) : 1;
        if (jp) { sx = jp[0] * w; sy = jp[1] * w; sz = jp[2] * w; }
        for (let r = 0; r < 3; r++) { PA[(v + r) * 3] = sx / w; PA[(v + r) * 3 + 1] = sy / w; PA[(v + r) * 3 + 2] = sz / w; UA[(v + r) * 4 + 2] = Math.max(UA[(v + r) * 4 + 2], lit) * endK; } }
      const flow = Math.abs(drop) < 0.5 ? 0 : Math.sign(drop) * (1.5 + 4 * Math.min(1, Math.abs(drop) / Math.max(len, 1)));
      // (sk: the mark of a turned stroke's ribbon: 1 on a seam, and more by how tall its flame stands on the whole,
      // 1.6 m to one; 4 at the least on a line of a fall of fire; nought on every other line)
      // (drip: A SHORT STRAND THAT HANGS: a fall's line under 8 m long, no run-out, with no line of its fall beside
      // its middle to be filled toward: fire that holds to the rock at its head, draws out thin as it falls and
      // lets go in drops. Its mark is 5, every other fall's 4 to 4.4)
      const drip = fallR && !RUN.has(a) && len < 8 && !(FIL.get(a + 3 * (np >> 1)) > 0);
      let sk = 0; if (seam || fallR) { let s = 0, k = 0; for (let v = a; v < b; v += 3) { const h = Math.hypot(c.T[v * 4], c.T[v * 4 + 1], c.T[v * 4 + 2]); if (h > 0) { s += h; k++; } } sk = drip ? 5 : Math.max(fallR ? 4 : 1, Math.min(s / Math.max(k, 1) / 1.6, 4.4)); }
      // (met: the true metres along the ribbon's own feet, as they are drawn, each ribbon's set off by its seed)
      let met = c.U[a * 4 + 1] * 97; const TL = [];
      for (let i = 0; i < np; i++) { const v = a + 3 * i, v0 = a + 3 * Math.max(0, i - 2), v1 = a + 3 * Math.min(np - 1, i + 2), fall = (py(v0) - py(v1)) / Math.max(dd(v0, v1), 0.5);
        const seg = i ? Math.hypot(PA[v * 3] - PA[v * 3 - 9], PA[v * 3 + 1] - PA[v * 3 - 8], PA[v * 3 + 2] - PA[v * 3 - 7]) : 0; met += seg;
        const tx = c.T[v * 4], ty = c.T[v * 4 + 1], tz = c.T[v * 4 + 2], up = ty / (Math.hypot(tx, ty, tz) || 1), t = sat((up - 0.4) / 0.4);
        const dx = c.P[v1 * 3] - c.P[v0 * 3], dz = c.P[v1 * 3 + 2] - c.P[v0 * 3 + 2], hl = Math.hypot(dx, dz) || 1;
        // (on running sulphur a tongue is drawn down-stream by a fifth of its length and by more the steeper
        // the line falls there, to four tenths over a fall of fire; on a level line by half its fall. A tongue
        // RISES: drawn further down-stream it lies along the fall as a thin blade, and a row of such is a saw)
        const ln = (flow ? Math.sign(flow) * Math.min(0.4, 0.2 + 0.5 * Math.max(0, fall * Math.sign(flow))) : Math.max(-0.4, Math.min(0.4, fall * 0.5))) * t * t * (3 - 2 * t);
        // (hot, aF's fourth number, on a stroke: WHERE FALLING FIRE BURNS HOTTEST: at its head (1 at the line's upper
        // end, dying away over some 12 m down it) and where it breaks: where the line falls less steeply than it
        // does within six points to either side (a ledge: from a difference of 0.12 in the fall, all of it from
        // 0.4), and on a fall of fire over the last 5 m before its lower end, where it lands)
        let hot = 0; if (LF) { let mx = 0; for (let j = Math.max(0, i - 6); j <= Math.min(np - 1, i + 6); j++) mx = Math.max(mx, LF[j]);
          const fromHead = drop > 0 ? cumM[i] : len - cumM[i];
          // (on a fall each line's two reaches of it are its own: 0.55 to 1.45 of those lengths, by its seed: the
          // fire's hot places end raggedly from line to line)
          const hk = fallR ? 0.55 + 0.9 * hash1(c.U[a * 4 + 1] * 997 + 17) : 1, hl2 = fallR ? 0.55 + 0.9 * hash1(c.U[a * 4 + 1] * 997 + 29) : 1;
          hot = Math.max(Math.exp(-fromHead / (Math.min(12, len / 3) * hk)), drip ? 0 : sstep(0.12, 0.4, mx - LF[i]), fallR && !drip ? 0.8 * Math.exp(-(len - fromHead) / (5 * hl2)) : 0);
          // (where a fall's foot stands in its mist the number is that depth, below nought: the mist's law is the stroke's)
          const ms = MST.get(v); if (ms > 0.02) hot = -ms; }
        for (let r = 0; r < 3; r++) { F[(v + r) * 4] = flow; F[(v + r) * 4 + 1] = sk; F[(v + r) * 4 + 2] = met; F[(v + r) * 4 + 3] = hot; }
        { const ux = PA[v1 * 3] - PA[v0 * 3], uy = PA[v1 * 3 + 1] - PA[v0 * 3 + 1], uz = PA[v1 * 3 + 2] - PA[v0 * 3 + 2], ul = Math.hypot(ux, uy, uz) || 1;
          // (and a turned stroke draws in over its last metres at either end: a seam over 4 m, to a point; a fall
          // of fire over a metre and a half, to a third: it is broad at its lip and where it lands)
          let even = 1; if (seam || fallR) { const own = Math.hypot(tx, ty, tz); let s = 0, w = 0;
            for (let j = Math.max(0, i - ER); j <= Math.min(np - 1, i + ER); j++) { const q = a + 3 * j, hq = Math.hypot(c.T[q * 4], c.T[q * 4 + 1], c.T[q * 4 + 2]), k = ER + 1 - Math.abs(j - i); if (hq > 0) { s += hq * k; w += k; } }
            // (a line of a fall is taken 2 m tall at the least, a short one a quarter of its length: its body
            // reaches nine tenths of that to either side, so a line alone is still a body, and a short strand is not a ball)
            // (a short strand that hangs: a ninth of its length at the least; broad where it holds, over its first
            // quarter, it draws in from there to a quarter of that at its lower end)
            // (an end of a fall's line that is carried over a ledge is a tongue: whole at the point before it,
            // an eighth at its tip)
            const end = Math.min(cumM[i], len - cumM[i]), fh = (drop > 0 ? cumM[i] : len - cumM[i]) / Math.max(len, 0.5);
            const fe = Math.min(JN.has(a) ? (i ? 1 : 0.12) : 0.35 + 0.65 * sstep(0, 1.5, cumM[i]), JN.has(b - 3) ? (i < np - 1 ? 1 : 0.12) : 0.35 + 0.65 * sstep(0, 1.5, len - cumM[i]));
            if (own > 0 && w > 0) even = Math.max(Math.min(Math.max(s / w / own, 0.25), 4), fallR ? (drip ? len / 9 : Math.min(2, len / 4)) / own : 0) * (drip ? (0.5 + 0.5 * sstep(0, 0.12, fh)) * (1 - 0.75 * sstep(0.25, 1, fh)) : fallR ? fe : 0.12 + 0.88 * sstep(0, 4, end)); }
          for (let r = 0; r < 3; r++) { D[(v + r) * 4] = ux / ul; D[(v + r) * 4 + 1] = uy / ul; D[(v + r) * 4 + 2] = uz / ul; D[(v + r) * 4 + 3] = even; } }
        // (WHERE THE LINE FALLS STEEP ITS FLAME STANDS OUT FROM THE FACE. A ribbon is the sheet between its line and
        // its flame's way; where the line itself runs nearly straight down and the flame stands straight up the
        // two lie along one another and the sheet has no breadth: thin blades down the fall. lv is
        // the level share of the line's run there; under three quarters the flame's way is turned outward, toward
        // the level way in which the line comes down, by up to nine tenths of its length to one upward, and keeps
        // its length: fire that falls burns out from the face and up. It stays inside the air of its own foot)
        const lv = Math.sqrt(Math.max(1 - fall * fall, 0));
        if (!seam && !fallR && up > 0.5 && lv < 0.75) { const gq = 0.9 * (1 - sstep(0.3, 0.75, lv)), so = Math.sign(fall) || 1, ox = (dx / hl) * so, oz = (dz / hl) * so;
          const tl = Math.hypot(tx, ty, tz), nx = tx / tl + ox * gq, ny = ty / tl, nz = tz / tl + oz * gq, sc = tl / Math.hypot(nx, ny, nz);
          for (let r = 0; r < 3; r++) { TA[(v + r) * 4] = nx * sc; TA[(v + r) * 4 + 1] = ny * sc; TA[(v + r) * 4 + 2] = nz * sc; } }
        // (A FALL'S STROKE CARRIES ITS FALL'S PLANE: a stroke is turned to the eye's place and uses of its flame's
        // way only its length; so on a fall line the way given to the drawing is the plane's normal, as long as
        // the flame is tall, and aF's first number, which a stroke does not read as a speed, is the plane's
        // place: 1e9 where the fall has no plane of its own; and aU's first number, which a stroke does not read
        // as metres, is the two reaches by which the fall is filled from line to line: FIL, above (none at an
        // end carried over a ledge: the tongue draws in); and aF's third number, the line's metres, which a
        // fall's stroke does not read, is how far the fall's two sides stand from the point as it is drawn
        // (EDG, above): metres, the one toward -t in whole eighths of a metre (100 m at the most), the one
        // toward +t as sixty-fourths of the rest (under 64 m); a point with none is taken as deep inside: 60 m.
        // A RUN-OUT'S NUMBER IS -1 at every point: the body's count leaves it out, so the fall's sides are not
        // its sides, and its stroke keeps the torn edge a line alone has: see the stroke's law.
        // FPL: the places of such points that burn, for the fall's own spray: see the puffs)
        if (fallR) { const pl = PLN.get(a), tl = Math.hypot(tx, ty, tz) || 1e-3, ed = EDG.get(v), tq = pl ? PA[v * 3] * pl[4] + PA[v * 3 + 2] * pl[6] - pl[7] : 0;
          const pk = RUN.has(a) ? -1 : ed ? Math.floor(Math.min(Math.max(tq - ed[0], 0), 100) * 8) + Math.min(Math.max(ed[1] - tq, 0), 63.9) / 64 : 480.9375;
          if (pl && c.U[v * 4 + 2] > 0.05) FPL.push(c.P[v * 3], py(v), c.P[v * 3 + 2]);
          for (let r = 0; r < 3; r++) { F[(v + r) * 4] = pl ? pl[3] : 1e9; if (pl) { TA[(v + r) * 4] = pl[0] * tl; TA[(v + r) * 4 + 1] = pl[1] * tl; TA[(v + r) * 4 + 2] = pl[2] * tl; UA[(v + r) * 4] = JN.has(v) ? 0 : FIL.get(v) || 0; F[(v + r) * 4 + 2] = pk; } } }
        if (!seam && c.U[v * 4 + 2] > 0.5 && ty >= 0.6) (Math.abs(flow) >= 3 && fall * Math.sign(flow) > 0.25 ? XF : XB).push(v);   // (where more sparks rise: a fall of fire, a large bed)
        if (c.U[v * 4 + 2] > 0.05) { RIB.push(c.P[v * 3], c.P[v * 3 + 1], c.P[v * 3 + 2], c.U[v * 4] + 1000 * c.U[v * 4 + 1], flow, seam ? 9 : (dx / hl) * ln, (dz / hl) * ln, Math.hypot(tx, ty, tz));   // (9: the mark of a wall's seam; and last the ribbon's own height there)
          RSTEEP.push(seam ? 0 : sstep(0.45, 0.65, Math.abs(fall))); }
        // (A TILE OF THE RIVER'S SHEET to every piece of a ground line that burns at both its ends: its middle,
        // the way from the one point to the other with the ground's fall, the true metres at its middle, how hard
        // it burns, the channel's metres, and THE POUR: where the line's own points drop 1.5 m or more over this
        // piece and the one to either side of it, and this piece itself stands steeper than a slope (0 at a
        // fall of 0.72 to a metre of the line, 1 from 0.9: 46 to 64 degrees), the ground steps down there and
        // the sheet falls over the step as a curtain. Over a sheer drop the tile's way across is taken from the
        // line's run)
        // (A LINE OF A FALL OF FIRE bears no sheet: its turned stroke is its body)
        const vp = v - 3;
        if (!seam && !fallR && !JMP.has(v) && i >= 1 && c.U[v * 4 + 2] > 0.05 && c.U[vp * 4 + 2] > 0.05) { const ax = c.P[vp * 3], ay = c.P[vp * 3 + 1], az = c.P[vp * 3 + 2];
          // (THE SHEET RUNS TRUE: the world's line steps from side to side as it follows the ground, and sheets laid
          // from point to point each turned its own way. Each sheet lies along the level way from the point before
          // its piece to the point after it, so sheet after sheet they keep one way; its middle, its height and
          // its fall stay its own piece's, on the ground the world laid the line on)
          const q0 = a + 3 * Math.max(0, i - 2), q1 = a + 3 * Math.min(np - 1, i + 1), mx = (ax + c.P[v * 3]) / 2, mz = (az + c.P[v * 3 + 2]) / 2;
          let ex = c.P[v * 3] - ax, ez = c.P[v * 3 + 2] - az; const ey = c.P[v * 3 + 1] - ay, el = Math.hypot(ex, ey, ez) || 1e-3;
          { const gx = c.P[q1 * 3] - c.P[q0 * 3], gz = c.P[q1 * 3 + 2] - c.P[q0 * 3 + 2], gl = Math.hypot(gx, gz);
            if (gl > 0.2) { const s = (ex * gx + ez * gz) / gl; ex = (gx / gl) * s; ez = (gz / gl) * s; }
            if (Math.hypot(ex, ez) < 0.05 * el) { ex += (dx / hl) * 0.05 * el; ez += (dz / hl) * 0.05 * el; } }
          const pour = Math.abs(py(a + 3 * Math.max(0, i - 2)) - py(a + 3 * Math.min(np - 1, i + 1))) >= 1.5 ? sstep(0.72, 0.9, Math.abs(ey) / el) : 0;
          // (the breadth the air allows it: the world counts 1.3 of the ribbon's height clear about each foot; the
          // tile's far corner, 0.3 m up, 0.15 of its length past the point and its half breadth aside, stays inside that)
          const hm = Math.min(Math.hypot(c.T[v * 4], c.T[v * 4 + 1], c.T[v * 4 + 2]), Math.hypot(c.T[vp * 4], c.T[vp * 4 + 1], c.T[vp * 4 + 2]));
          TL.push([mx, ay + ey / 2, mz, ex, ey, ez, met - seg / 2, Math.min(c.U[v * 4 + 2], c.U[vp * 4 + 2]), c.U[v * 4 + 3], pour, Math.abs(ey), Math.sqrt(Math.max(1.69 * hm * hm - 0.09 - 0.0225 * el * el, 0.01))]); } }
      // (each tile's half breadth: 0.6 m, to 1.4 m where the sulphur runs fast, and up to 0.5 m more by a slow
      // field along the line: the body is 1.2 to 3.8 m broad, and never broader than its air allows: A RIVER'S
      // FIRE IS THE FOOT OF ITS WHOLE BED, not a thread down it. BELOW A
      // POUR the fire gathers: the piece next down-stream of a falling one is broader by a quarter, 4 m at the
      // most, and burns half as bright again)
      // (ONE BODY: where burning lines lie side by side, in a field of fire, a piece that lies within 1.6 m of a
      // piece of another line already laid is left out: the sheets of two lines do not lie one upon the other)
      for (let j = 0; j < TL.length; j++) { const q = TL[j], upT = TL[j - Math.sign(flow || 1)], gather = q[9] < 0.5 && upT && upT[9] >= 0.5 ? 1 : 0;
        { const cx = Math.floor(q[0] / 1.6), cz = Math.floor(q[2] / 1.6); let hit = false;
          for (let ix = -1; ix <= 1 && !hit; ix++) for (let iz = -1; iz <= 1 && !hit; iz++) { const L = tcell.get((cx + ix) * 8192 + cz + iz); if (L) for (const o of L) if (o[3] !== a && (o[0] - q[0]) ** 2 + (o[1] - q[1]) ** 2 + (o[2] - q[2]) ** 2 < 2.56) { hit = true; break; } }
          if (hit) continue; let L = tcell.get(cx * 8192 + cz); if (!L) tcell.set(cx * 8192 + cz, L = []); L.push([q[0], q[1], q[2], a]); }
        // (A POUR HAS BODY FROM ITS SIDE: a falling piece is two sheets, the one along the step's face and a second
        // across it, standing out from the face (its fourth number in TF is 1): seen along the step it is not a line)
        const hw = Math.min((0.6 + 0.8 * sat((Math.abs(flow) - 1.5) / 4) + 0.5 * noise1(q[6] / 9)) * (gather ? 1.25 : 1), 2, q[11]);
        // (A POUR'S LAST SHEET, under which no other falls within 4 m of the line, is told by 2 added to its third
        // number in TF: it ends in hanging tongues: see the river's sheet)
        const dnT = TL[j + Math.sign(flow || 1)], last = q[9] >= 0.5 && !(dnT && dnT[9] >= 0.5 && Math.abs(dnT[6] - q[6]) < 4) ? 2 : 0;
        for (let x = 0; x < (q[9] >= 0.5 ? 2 : 1); x++) { TP.push(q[0], q[1], q[2], hw);
          TQ.push(c.U[a * 4 + 1], eastOf(q[0], q[2]), q[8], Math.min(1, q[7] * (gather ? 1.5 : 1))); TR.push(q[3], q[4], q[5], 3); TF.push(q[6], flow, Math.max(q[9], 0.4 * gather) + last, x); }
        facts.tiles++; if (q[9] >= 0.5) { facts.pours++; facts.pourDrop = Math.max(facts.pourDrop, q[10]); } }
      if (opts.yield && b - a0 > 450) { a0 = b; await opts.yield(); }
      a = b; }
    if (opts.yield) await opts.yield();
    g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 4)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 4));
    // (WHAT CAN NEVER SHOW IS NOT DRAWN: a piece of ribbon whose three corners all burn at nought (as they stand
    // now, a seam's low reaches filled in) gives no light at any time, by the ribbon's own law: such pieces are
    // left out of the list of what is drawn. Nothing that shows is left out.)
    { const I0 = c.I, I1 = []; for (let i = 0; i < I0.length; i += 3) { if (opts.yield && i % 9000 === 8997) await opts.yield();
        if (UA[I0[i] * 4 + 2] > 1e-4 || UA[I0[i + 1] * 4 + 2] > 1e-4 || UA[I0[i + 2] * 4 + 2] > 1e-4) { const mx = Math.max(I0[i], I0[i + 1], I0[i + 2]); if (!JMP.has(mx - mx % 3)) I1.push(I0[i], I0[i + 1], I0[i + 2]); } }
      if (opts.yield) await opts.yield(); g.setIndex(I1); }
    if (opts.yield) await opts.yield();
    const m = new THREE.Mesh(g, curtainMaterial({ ...shared, uBay: LUn.uBay || { value: new THREE.Vector2() } })); m.frustumCulled = false; m.renderOrder = 4.5; group.add(m); made.push(g); }
  if (opts.yield) await opts.yield();
  // --- A CHIMNEY BURNS: from each chimney's facts (see THE CHIMNEYS above), by its own numbers (no lot is drawn) ---
  // THE CROWN'S RIM: round the lip a ragged ring of tongues of the one law, two to every metre of the crown's
  // tallest tongue (11 on a tall chimney, 5 or 6 on a small stack), each at a place and of a height of its own,
  // under a half of the tallest's to the whole of it, one in three a hot one; their feet 0.3 m under the lip, inside
  // the throat's rim. None stands higher over the crown's feet than the crown's tallest tongue does, nor is its
  // tip carried further down the wind (hmax: its feet stand 0.65 m over the crown's, and up to 0.4 of the throat's
  // radius outside them); it stands inside the throat's rim, so over the chimney's own top and no nearer to any
  // place beside the chimney than the chimney's skin is.
  // THE FLANK'S FIRE: burning melt that has welled out of the chimney and creeps down its flank is A NARROW STRAND
  // OF FLAME: tongue over tongue of the one law, each standing on the skin and lapping the next, so the strand
  // is whole from near and from far and from every side (a sheet laid on the flank is flat from near and is
  // gone edge-on: none is laid).
  // - WHERE THE WORLD SETS A FLANK ALIGHT ITSELF: a soft light of the world's that stands by no ribbon and at
  //   no large tongue's foot, more than 1.2 m under a chimney's lip and within its girth (flankOf), is that
  //   chimney's own: every heart among them bears a tongue, and every soft light that stands 0.4 m or more
  //   from a heart and from a soft light that already bears one (the world sets them a quarter of a metre
  //   apart: a tongue at every half metre laps the next), nine tenths to the whole of the height the world
  //   counted for that place and never under a metre (0.45 of the crown's tallest on a small stack): a lower
  //   one would not reach the next, and the run would be a row of beads (they are not gathered into knots:
  //   the places in their row are the run).
  // - AND FROM THE LIP: where the world has set the flank alight itself, ONE run, down the side that fire
  //   leaves dark; else one run on a small chimney (its crown 2.5 m or under), two on a larger one, set
  //   opposite each other, and three, at thirds of the round, on a tall one (its crown over 3.5 m): so from
  //   whatever side a chimney is seen, fire comes down the flank that is turned to that side or stands out
  //   past its edge. Each from the lip down for 1.3 to 1.9 of the crown's tallest tongue (never further than
  //   six tenths of the lip's height over the lake: it does not reach the water), wandering a little from
  //   side to side as it goes; a tongue at every 0.43 m, three tenths to six tenths of the crown's tallest
  //   (1.1 m at the least, or half the crown's tallest on a small stack), a little over half as tall at the
  //   run's end, every other one a hot one, broader at the foot.
  //   The flank under a lip run: where the world's own flank lights are known (eight or more of them), the
  //   straight law that fits them best (how far from the axis the skin stands at each depth under the lip);
  //   else the throat's radius at the lip and a tenth of a metre broader for every metre down. The tongues
  //   stand 0.4 m proud of that. (These are made below, when the world's lights have been read.)
  // (CL: the chimneys' own tongues, seven numbers each: foot, height, seed, how far east, kind)
  const CL = [];
  for (const [ci, c] of CH.entries()) { const h = (k) => hash1(ci * 17 + k), nr = Math.round(2.2 * c.tall), hmax = Math.max(c.tall - Math.max(0.65, 0.6 * c.r), 0.3);
    c.fn = 0; c.hp = []; c.kp = []; c.sD = 0; c.sR = 0; c.sDD = 0; c.sDR = 0; c.su = 0; c.sv = 0; c.s2c = 0; c.s2s = 0;
    for (let i = 0; i < nr; i++) { const th = ((i + h(20 + i)) / nr) * 6.2832, rr = c.r * (0.65 + 0.3 * h(40 + i)), f = h(60 + i);
      const q = c.at(0.3, th, rr); CL.push(q[0], q[1], q[2], Math.min(c.tall * (0.45 + 0.4 * f * f + 0.15 * h(80 + i)), hmax), h(100 + i), c.east, i % 3 ? 0 : 2); } }
  // (flankOf: the chimney on whose flank a place stands, with its depth under the lip along the axis, its
  // distance from the axis, and its bearing round the axis as a cosine and a sine; a chimney's girth is taken
  // generously: 1.3 of the throat's radius and half a metre more for every metre down, and 1.2 m, and never
  // more than four and a half throats and 1.5 m)
  const flankOf = (x, y, z) => { for (const c of CH) { const dx = x - c.x, dy = y - c.lip, dz = z - c.z, D = -(dx * c.ax[0] + dy * c.ax[1] + dz * c.ax[2]); if (D < 1.2) continue;
    const px = dx + c.ax[0] * D, py = dy + c.ax[1] * D, pz = dz + c.ax[2] * D, rad = Math.hypot(px, py, pz), ir = 1 / Math.max(rad, 1e-3);
    if (rad <= Math.min(4.5 * c.r + 1.5, 1.3 * c.r + 0.5 * D + 1.2)) return [c, D, rad, (px * c.e1[0] + py * c.e1[1] + pz * c.e1[2]) * ir, (px * c.e2[0] + py * c.e2[1] + pz * c.e2[2]) * ir]; } return null; };
  facts.chimneys = CH.length;
  // --- the flame's body from near: one instanced mesh of soft lights (opts.glows { P, Q, R }: placed by the world
  // along its burning lines, which counts their clear air) ---
  if (opts.glows && opts.glows.P.length) { const g = quad(), G = opts.glows, n0 = G.P.length / 4, ia = (arr) => new THREE.InstancedBufferAttribute(new Float32Array(arr), 4);
    // (THE FIRE IS GATHERED. Of the places handed over a share stands as tongues, by each one's own seed (LICKS; a
    // halo, kind 1, is not kept), and each that stands is a tongue of its place's whole counted height or a share of it:
    // - about a large tongue's foot (a place the world set within a fifth of that tongue's breadth of it, at its
    //   level): LICKS.cluster of them, more or less, with the one at its very foot: a CLUSTER of unlike heights;
    // - by a ground line: only in KNOTS, a few metres across with a few metres between (a slow field over the
    //   ground, so the braided ribbons of one line bear their tongues at the same places), the tallest at a
    //   knot's middle: between the knots the line is its running sheet alone;
    // - on a wall's seam: LICKS.seam of them; and of whatever else there is, LICKS.other, in the same knots.
    // Nothing is drawn by lot: a place stands or not by its own seed, and by where on its line it lies)
    const P = [], Q = [], R = [], Fl = [], F = opts.flames, fcell = new Map(), crowd = new Map();
    if (F) for (let j = 0, nf = F.P.length / 4; j < nf; j++) { const k = Math.floor(F.P[j * 4] / 4) * 4096 + Math.floor(F.P[j * 4 + 2] / 4); let L = fcell.get(k); if (!L) fcell.set(k, L = []); L.push(j * 4); }
    if (opts.yield) await opts.yield();
    // (iF: each lick takes the line's metres, the sulphur's speed and the down-stream lean from the nearest point
    // of a ribbon within 3.5 m of its foot (RIB, told off in squares of 4 m); one that stands by no ribbon takes
    // none: -1)
    const cell = new Map(), key = (x, z) => Math.floor(x / 4) * 4096 + Math.floor(z / 4);
    for (let j = 0; j < RIB.length; j += 8) { if (opts.yield && j % 16000 === 15992) await opts.yield(); const k = key(RIB[j], RIB[j + 2]); let L = cell.get(k); if (!L) cell.set(k, L = []); L.push(j); }
    if (opts.yield) await opts.yield();
    // (the hearts that stand on a chimney's flank are told off first: see where a flank's soft lights are read)
    for (let i = 0; i < n0; i++) if (G.R[i * 4 + 3] > 1.5) { if (opts.yield && i % 500 === 499) await opts.yield(); const fl = flankOf(G.P[i * 4], G.P[i * 4 + 1], G.P[i * 4 + 2]); if (fl) fl[0].hp.push(G.P[i * 4], G.P[i * 4 + 1], G.P[i * 4 + 2]); }
    for (let i = 0; i < n0; i++) { const k = G.R[i * 4 + 3], s = G.Q[i * 4], f = (s * 7.77 + 0.31) % 1, f2 = (s * 13.37 + 0.73) % 1;
      if (opts.yield && i % 40 === 39) await opts.yield();
      if ((k > 0.5 && k < 1.5) || G.Q[i * 4 + 3] <= 0.03) continue;   // (a halo is not kept; nor a place that burns so low its tongue would give no light at any time)
      const x = G.P[i * 4], y = G.P[i * 4 + 1], z = G.P[i * 4 + 2], hg = G.P[i * 4 + 3]; let best = 3.5 * 3.5, bj = -1, fj = -1, share = 1, steep = 0;
      for (let cx = -4; cx <= 4; cx += 4) for (let cz = -4; cz <= 4; cz += 4) { const L = cell.get(key(x + cx, z + cz)), M = fcell.get(key(x + cx, z + cz));
        if (M && fj < 0) for (const j of M) if (Math.abs(F.P[j + 1] + 0.05 - y) < 0.02 && Math.hypot(F.P[j] - x, F.P[j + 2] - z) <= 0.29 * F.P[j + 3] * F.Q[j + 3] + 0.01) { fj = j; break; }
        if (L) for (const j of L) { const d = (RIB[j] - x) ** 2 + (RIB[j + 1] - y) ** 2 + (RIB[j + 2] - z) ** 2; if (d < best) { best = d; bj = j; } } }
      let top = hg * LICKS.tall;
      // (a place on a chimney's own flank bears its tongue whatever its seed: see THE FLANK'S FIRE; what is
      // learnt of the flank there is kept for the chimney's lip run: how many, the sums a straight law is
      // fitted by, and the sums of their bearings round the axis (su, sv; and s2c, s2s of twice the bearing: the
      // line they stand along where they stand on two opposite sides); its depth is taken nearer the eye's place
      // as a lip run's tongue's is (see THE SKIN IS ROUGH): by eight tenths of its own distance from the
      // chimney's axis, 4 m at the most, and never under 1.2 m, on a giant 2 m)
      const fl = bj < 0 && fj < 0 ? flankOf(x, y, z) : null;
      // (ON A GIANT THE FLANK'S FIRE IS A GIANT'S: the higher a chimney's lip stands over the lake, from 5 m, the
      // taller and broader the tongues its flank bears: 1.7 to 2.6 times as tall from a lip at 20 m (big), each by
      // its own seed, a quarter again as broad, their depth taken 2 m nearer the eye's place at the least: a strand of
      // metre-high tongues on a spire of thirty metres is a chain of beads; these lap one another four deep and
      // are one body of flame down the flank. They stand hard on the skin and climb along it: the giant's whole
      // skin is 3.5 m and more from the flown line by the world's law, and such a tongue's sheet stands under
      // 2.2 m out of the skin at its tip.)
      const big = fl ? Math.min(Math.max((fl[0].lip - 5) / 15, 0), 1) : 0;
      if (fl) { const c = fl[0], hs = Math.max(hg * (0.9 + 0.1 * f2), Math.min(1, 0.45 * c.tall)) * (1 + big * (0.7 + 0.9 * f)); c.fn++; c.sD += fl[1]; c.sR += fl[2]; c.sDD += fl[1] * fl[1]; c.sDR += fl[1] * fl[2];
        c.su += fl[3]; c.sv += fl[4]; c.s2c += fl[3] * fl[3] - fl[4] * fl[4]; c.s2s += 2 * fl[3] * fl[4];
        // (a heart always bears its tongue; a soft light bears one unless a heart of this flank, or a soft light
        // that already bears one, stands within 0.4 m of it: a tongue at every half metre of the run)
        if (k < 1.5) { let near = 0; for (const L of [c.hp, c.kp]) for (let j = 0; j < L.length && !near; j += 3) if ((L[j] - x) ** 2 + (L[j + 1] - y) ** 2 + (L[j + 2] - z) ** 2 < 0.16) near = 1;
          if (near) continue; c.kp.push(x, y, z); }
        P.push(x, y, z, hs); Q.push(s, G.Q[i * 4 + 1], G.Q[i * 4 + 2], G.Q[i * 4 + 3]); R.push(hs * (0.3 + 0.08 * big), Math.max(1.2 + 0.8 * big, Math.min(0.8 * fl[2], 4)), 0, k); Fl.push(-1, 0, 0, 0); facts.tongues++; continue; }   // (its depth: see THE SKIN IS ROUGH, at the lip runs)
      if (fj >= 0) { if (k < 1.5 && f >= LICKS.cluster / Math.ceil(F.P[fj + 3] * 2.5)) continue; share = k > 1.5 ? 0.5 : 0.5 + 0.5 * f2; }
      else if (bj >= 0 && RIB[bj + 5] === 9) { if (f >= LICKS.seam) continue; share = 0.6 + 0.4 * f2; }
      // (a tongue of a ground line stands in the line's own air: the world keeps 1.3 of the ribbon's height
      // clear about each of its feet, and the tongue's whole sheet, 1.4 of its height from its own foot at
      // its far corner, stays inside that from where it stands: a tall line bears tongues of 1.5 to 4 m)
      // (WHERE A LINE FALLS STEEP ITS FIRE IS A STRAND OF TONGUES. Down a steep slope the eye looks along the line:
      // the line's ribbon is seen along its thin way and the river's sheet lies flat on the ground before it:
      // what shows as flame there is the tongues, each turned to the eye's place. So where the line falls
      // steeper than 27 degrees the knots' rule gives way, wholly from 40 degrees (steep): there nine places in
      // ten bear a tongue, each of seven tenths to the whole of its height, and they lap one another down the
      // fall as they do down a chimney's flank)
      else if (bj >= 0) { const kn = sstep(LICKS.knot, LICKS.knot + 0.25, noise2(x / LICKS.knotMetres, z / LICKS.knotMetres)); steep = RSTEEP[bj / 8];
        // (ALONG A RIVER, a line whose sulphur runs at 3 m/s or more, tongues stand between the knots too, LICKS.run
        // of its places: a river's fire rises along its whole length)
        if (f >= mix(Math.max(LICKS.river * kn, Math.abs(RIB[bj + 4]) >= 3 ? LICKS.run : 0), 0.9, steep)) continue; share = (0.7 + 0.3 * f2) * (0.7 + 0.3 * Math.max(kn, steep));
        top = Math.max(top, Math.min((1.3 * RIB[bj + 7] - Math.sqrt(best)) / (1 + LICKS.broad * 1.65), 4)); }
      else { if (f >= LICKS.other * sstep(LICKS.knot, LICKS.knot + 0.25, noise2(x / LICKS.knotMetres, z / LICKS.knotMetres))) continue; share = 0.6 + 0.4 * f2; }
      // (NOT A FIELD: in any cube of 2.5 m no more than two to five tongues stand, how many by the cube's own
      // number: where the world sets its places thick, on a burning slick, the fire stands in clusters with
      // ground between them)
      { const cx = Math.floor(x / 2.5), cy = Math.floor(y / 2.5), cz = Math.floor(z / 2.5), ck = (cx * 4096 + cz) * 256 + (cy & 255), c = crowd.get(ck) || 0;
        if (c >= 2 + Math.floor(3.5 * hash1(((cx * 73 + cz * 151 + cy * 31) % 4096 + 4096) % 4096)) + Math.round(3 * steep)) continue; crowd.set(ck, c + 1); }   // (and up to three more on a steep fall, whose strand needs them)
      // (its sheet: LICKS.tall of the place's height at the most, and LICKS.broad of the sheet's height to its half
      // breadth: the sheet's corners then lie within 1.1 of the place's height of its foot)
      const hs = top * share;
      // (a tongue of a steep fall has its depth taken up to 0.9 m nearer the eye's place, as a chimney's has: the
      // ground there goes down in steps, and seen from below the lip of each step cuts the feet of the tongues
      // on the tread behind it in a level line unless their depth is taken so)
      P.push(x, y, z, hs); Q.push(s, G.Q[i * 4 + 1], G.Q[i * 4 + 2], G.Q[i * 4 + 3]); R.push(hs * LICKS.broad, 0.9 * steep, 0, k); facts.tongues++;
      // (and on a steep fall it is drawn down-stream a quarter as far as elsewhere: the hot gas climbs, and a tongue
      // laid out over the fall is a squat sheet as seen from above)
      if (bj < 0) Fl.push(-1, 0, 0, 0); else { const up = RIB[bj + 5] === 9 ? 1 : 1 - 0.75 * steep; Fl.push(RIB[bj + 3], RIB[bj + 4], RIB[bj + 5] * up, RIB[bj + 6] * up); } }
    if (opts.yield) await opts.yield();
    // (the chimneys' own tongues: each stands by no line and burns always; a tenth again as broad as a lick; the
    // second number of iR is how many metres nearer the eye's place its depth is taken: see the head)
    for (let j = 0; j < CL.length; j += 7) { P.push(CL[j], CL[j + 1], CL[j + 2], CL[j + 3]); Q.push(CL[j + 4], CL[j + 5], -1, 1); R.push(CL[j + 3] * 0.27, 1, 0, CL[j + 6]); Fl.push(-1, 0, 0, 0); facts.tongues++; }
    // (THE LIP RUNS: see THE FLANK'S FIRE. own: the world has set this chimney's flank alight itself; a, b: the
    // skin's distance from the axis at the lip and what it gains for each metre down: fitted to the world's own
    // flank lights where they are known, and held between the throat's own measure and the girth a chimney is
    // allowed; else the throat's radius and a tenth of a metre a metre)
    for (const [ci, c] of CH.entries()) { const h = (k) => hash1(ci * 17 + k), det = c.fn * c.sDD - c.sD * c.sD, own = c.fn >= 8, fit = own && det > c.fn;
      const b = fit ? Math.min(Math.max((c.fn * c.sDR - c.sD * c.sR) / det, 0), 0.5) : 0.1, a = fit ? (c.sR - b * c.sD) / c.fn - 0.2 : 0.95 * c.r;
      const runs = !c.pipe ? 0 : own ? 1 : c.tall > 3.5 ? 3 : c.tall > 2.5 ? 2 : 1;   // (no pipe, no run: see A CHIMNEY IS A PIPE)
      // (dark: the bearing of the side the world's own flank fire leaves dark: opposite to where its lights stand
      // in the mean; or, where they stand on two opposite sides, square to the line through them)
      const dark = Math.hypot(c.su, c.sv) > 0.35 * c.fn ? Math.atan2(-c.sv, -c.su) : 0.5 * Math.atan2(c.s2s, c.s2c) + (h(1) < 0.5 ? 1.5708 : -1.5708);
      for (let r = 0; r < runs; r++) { const th0 = own ? dark + 0.5 * (h(2) - 0.5) : (h(1) + (r + 0.3 * (h(2 + r) - 0.5)) / runs) * 6.2832, len = Math.min(c.tall * (1.3 + 0.6 * h(5 + r)), 0.6 * c.lip), n = Math.min(Math.max(3, Math.round(len * 2.3)), 39), ph = h(9 + r) * 6.2832;
        for (let i = 1; i < n; i++) { const t = i / n, D = t * len, th = th0 + 0.22 * Math.sin(D * 0.9 + ph) + 0.1 * Math.sin(D * 2.3 + ph * 2), f = h(120 + r * 40 + i), hot = i % 2 ? 0 : 1;
          const rr = Math.min(Math.max(a + b * D, 0.95 * c.r + 0.05 * D), 1.3 * c.r + 0.5 * D), q = c.at(D, th, rr + 0.4), hs = Math.max(c.tall * (0.28 + 0.34 * f * f) * (1 - 0.45 * t), Math.min(1.1, 0.5 * c.tall) * (1 + 0.8 * Math.min(Math.max((c.lip - 5) / 15, 0), 1)));   // (the least of them taller on a tall chimney, as its flank's own are: a strand, not beads)
          // (THE SKIN IS ROUGH: a chimney's skin stands out in knobs and ledges that no straight law of its girth
          // follows, the more the thicker it is; a tongue whose foot lies behind a knob shows only its tip over
          // it, and a run of such is a chain of beads. So a flank's tongue has its depth taken nearer the eye's
          // place by eight tenths of the skin's own distance from the axis where it stands, 1.5 to 4 m: less
          // than that distance, so a tongue on the chimney's far side stays hidden behind it)
          P.push(q[0], q[1], q[2], hs); Q.push(h(400 + r * 40 + i), c.east, -1, 1); R.push(hs * (0.3 + 0.15 * hot), Math.max(1.5, Math.min(0.8 * rr, 4)), 0, 2 * hot); Fl.push(-1, 0, 0, 0); facts.tongues++; } } }
    // (and THE RIVER'S TILES, gathered with the ribbons above, ride in this mesh after the tongues)
    for (let j = 0; j < TP.length; j++) { P.push(TP[j]); Q.push(TQ[j]); R.push(TR[j]); Fl.push(TF[j]); }
    const n = P.length / 4;
    g.setAttribute('iP', ia(P)); g.setAttribute('iQ', ia(Q)); g.setAttribute('iR', ia(R)); g.setAttribute('iF', ia(Fl)); g.instanceCount = n;
    const m = new THREE.Mesh(g, glowMaterial({ ...shared })); m.frustumCulled = false; m.renderOrder = 4; group.add(m); made.push(g); }
  if (opts.yield) await opts.yield();
  // --- steam and gas: one instanced mesh of puffs (opts.puffs { S, T, M, E }: placed by the world, which counts their
  // clear air; opts.fall: the main channel's metres at the fall) ---
  const uPlume = { value: new THREE.Vector3(1, 1, opts.steam ?? 1) };
  if (opts.puffs && opts.puffs.S.length) { const g = quad(), n = opts.puffs.S.length / 4;
    // (HOW MUCH FIRE BURNS UNDER EACH PUFF, for its light: the nearest place where the world set fire (a large
    // tongue's foot, a point of a burning line's ribbon) to where the puff leaves the ground: all of the fire's
    // blue within 8 m of fire, none from 16 m. It is kept in the third number of iE, which only the burst at the
    // fall uses for itself (the burst is the burning river's own steam); the lake's steam takes the lake's light)
    const S = Float32Array.from(opts.puffs.S), T = Float32Array.from(opts.puffs.T), M = Float32Array.from(opts.puffs.M), E = Float32Array.from(opts.puffs.E), fc = new Map(), fk = (x, z) => Math.floor(x / 16) * 4096 + Math.floor(z / 16);
    // A MOUTH'S STEAM IS ONE COLUMN. Where the world hands over eight or more puffs in a row that leave one place
    // (the same height, within a metre of the first: a chimney's throat), they are one mouth's steam. As the
    // world deals them each has a climb, a carry and a time of its own, and they stand apart as two or three
    // clouds. Here they all take THE TRACK OF ONE OF THEMSELVES, the one whose climb is the middle of theirs: its
    // place, its climb, its carry, its time for a round; they leave it one after another at even times (each a
    // little out of step by its own draw); and each is NARROW: no broader as it leaves than that one, and at its
    // end a fifth of the climb across (2.6 m at the least), never broader than that one's end. So they stand one
    // over another as one thin column from the mouth, that leans as the wind takes it and frays where the puffs
    // stray from its middle near its top. IT STAYS IN THE AIR THE WORLD COUNTED: every puff rides a track the
    // world walked for a puff of its own, and is nowhere larger than that puff is there. No puff is added.
    for (let q = 0; q < MOUTHS.length; q += 2) { const i = MOUTHS[q], j = MOUTHS[q + 1], ord = []; for (let k = i; k < j; k++) ord.push(k); ord.sort((p, q) => S[p * 4 + 3] - S[q * 4 + 3]); const r = ord[ord.length >> 1];
      const R = [S[r * 4], S[r * 4 + 1], S[r * 4 + 2], S[r * 4 + 3], T[r * 4], T[r * 4 + 1], T[r * 4 + 2], M[r * 4 + 1]], end = Math.min(R[6], Math.max(2.6, R[3] / 5));
      for (let k = i; k < j; k++) { S[k * 4] = R[0]; S[k * 4 + 1] = R[1]; S[k * 4 + 2] = R[2]; S[k * 4 + 3] = R[3]; T[k * 4] = R[4]; T[k * 4 + 1] = Math.min(T[k * 4 + 1], R[5], end); T[k * 4 + 2] = end;
        M[k * 4] = (k - i + 0.6 * M[k * 4]) / (j - i); M[k * 4 + 1] = R[7]; } }
    const put = (x, y, z) => { const k = fk(x, z); let L = fc.get(k); if (!L) fc.set(k, L = []); L.push(x, y, z); };
    for (let j = 0; j < RIB.length; j += 32) put(RIB[j], RIB[j + 1], RIB[j + 2]);
    if (opts.flames) for (let j = 0, F = opts.flames.P; j < F.length; j += 4) put(F[j], F[j + 1], F[j + 2]);
    if (opts.yield) await opts.yield();
    // (the search for a puff ends at the first fire found within 8 m: nearer makes no difference to its light)
    // (AND THE SPRAY OF A GREAT FALL: a puff that leaves the ground within 14 m of a burning point of a fall
    // that has a plane (FPL) is that fall's spray, wholly; from 40 m not at all. It is kept with the fire under
    // the puff, as so many whole twos added to it: sevenths, 14 for the whole. ff: those points by 16 m of
    // ground; a puff's search ends at the first found within 14 m. The build rests after every 8 puffs)
    const ff = new Map(); for (let j = 0; j < FPL.length; j += 3) { const k = fk(FPL[j], FPL[j + 2]); let L = ff.get(k); if (!L) ff.set(k, L = []); L.push(FPL[j], FPL[j + 1], FPL[j + 2]); }
    if (opts.yield) await opts.yield();
    for (let i = 0; i < n; i++) { if (opts.yield && i % 8 === 7) await opts.yield(); if (M[i * 4 + 3] > 2.5) continue; const x = S[i * 4], y = S[i * 4 + 1], z = S[i * 4 + 2]; let best = 1e9, bf = 1e9;
      for (let cx = -16; cx <= 16 && best > 64; cx += 16) for (let cz = -16; cz <= 16 && best > 64; cz += 16) { const L = fc.get(fk(x + cx, z + cz));
        if (L) for (let j = 0; j < L.length && best > 64; j += 3) { const d = (L[j] - x) ** 2 + (L[j + 1] - y) ** 2 + (L[j + 2] - z) ** 2; if (d < best) best = d; } }
      if (ff.size) for (let cx = -48; cx <= 48 && bf > 196; cx += 16) for (let cz = -48; cz <= 48 && bf > 196; cz += 16) { const L = ff.get(fk(x + cx, z + cz));
        if (L) for (let j = 0; j < L.length && bf > 196; j += 3) { const d = (L[j] - x) ** 2 + (L[j + 1] - y) ** 2 + (L[j + 2] - z) ** 2; if (d < bf) bf = d; } }
      E[i * 3 + 2] = 1 - sstep(8, 16, Math.sqrt(best)) + 2 * Math.round(7 * (1 - sstep(14, 40, Math.sqrt(bf)))); }
    // (THE COLUMN A PUFF RISES IN, for its lit side and its shade side: for every puff of rising gas (kinds 0
    // and 1) the puffs that leave the ground within 10 m of it, level, and 8 m of its height are its column:
    // the middle of their places (iG's first two numbers: x, z), the middle of their climbs and of their
    // carries (its other two), and how far their places spread about that middle (the second number of iE,
    // which only the burst at the fall uses for itself). A puff alone is its own column)
    const G4 = new Float32Array(n * 4), gc = new Map(), gk = (x, z) => Math.floor(x / 10) * 8192 + Math.floor(z / 10);
    for (let i = 0; i < n; i++) if (M[i * 4 + 3] < 1.5) { const k = gk(S[i * 4], S[i * 4 + 2]); let L = gc.get(k); if (!L) gc.set(k, L = []); L.push(i); }
    if (opts.yield) await opts.yield();
    for (let i = 0; i < n; i++) { if (opts.yield && i % 8 === 7) await opts.yield(); if (M[i * 4 + 3] > 1.5) continue; const x = S[i * 4], y = S[i * 4 + 1], z = S[i * 4 + 2]; let sx = 0, sz = 0, ss = 0, sc = 0, sw = 0, cn = 0;
      for (let cx = -10; cx <= 10; cx += 10) for (let cz = -10; cz <= 10; cz += 10) { const L = gc.get(gk(x + cx, z + cz));
        if (L) for (const j of L) { const dx = S[j * 4] - x, dz = S[j * 4 + 2] - z; if (dx * dx + dz * dz < 100 && Math.abs(S[j * 4 + 1] - y) < 8) { sx += dx; sz += dz; ss += dx * dx + dz * dz; sc += S[j * 4 + 3]; sw += T[j * 4]; cn++; } } }
      const mx = sx / cn, mz = sz / cn; G4[i * 4] = x + mx; G4[i * 4 + 1] = z + mz; G4[i * 4 + 2] = sc / cn; G4[i * 4 + 3] = sw / cn; E[i * 3 + 1] = Math.sqrt(Math.max(ss / cn - mx * mx - mz * mz, 0));
    }
    g.setAttribute('iG', new THREE.InstancedBufferAttribute(G4, 4));
    g.setAttribute('iS', new THREE.InstancedBufferAttribute(S, 4)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(T, 4)); g.setAttribute('iM', new THREE.InstancedBufferAttribute(M, 4)); g.setAttribute('iE', new THREE.InstancedBufferAttribute(E, 3)); g.instanceCount = n;
    const m = new THREE.Mesh(g, puffMaterial({ ...shared, uFall: { value: opts.fall ?? 300 }, uFireCol: LUn.uFireCol, uSkyCol: LUn.uSkyCol, uLakeCol: LUn.uLakeCol, uMoonDir: LUn.uMoonDir, uMoonCol: LUn.uMoonCol, uPlume }));
    m.frustumCulled = false; m.renderOrder = 5; group.add(m); made.push(g); }
  if (opts.yield) await opts.yield();
  // --- sparks: one instanced mesh (opts.sparks { P, Q }: placed by the world) ---
  if (opts.sparks && opts.sparks.P.length) { const g = quad(), SP = Array.from(opts.sparks.P), SQ = Array.from(opts.sparks.Q), c = RC, bay = LUn.uBay ? LUn.uBay.value : { x: 0, y: 0 };
    // (MORE SPARKS, over the falls of fire, the large beds and the large tongues: of the ribbons' points told off
    // above, at most SPARKS.falls on the falls (two sparks each) and SPARKS.beds on the beds, taken evenly; and one from every
    // tongue 3 m tall or more. Each is thrown from the fire's own foot, on a line to between 0.62 and 0.92 of the
    // ribbon's height there, on a tongue to between a half and four fifths of its height: a spark's whole flight
    // reaches 1.31 of its throw, so it stays inside the air the world counted clear for that flame (1.3 of a
    // ribbon's height, 1.1 of a tongue's). Its seed and its rate are told off from its place in the row, not
    // drawn by lot)
    const h01 = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
    const east = (x, z) => sat((((x - bay.x) - (z - bay.y)) * 0.7071 + 78) / 120);
    const more = (x, y, z, h, m, i, k, top) => { SP.push(x, y + 0.1, z, h * (top - 0.3 * h01(i, k))); SQ.push(h01(i, k + 1), east(x, z), m, 1 / (0.8 + 1.3 * h01(i, k + 2))); };
    if (c) { const take = (L, max, per) => { const st = Math.max(1, Math.ceil(L.length / max)); for (let j = 0; j < L.length; j += st) { const v = L[j]; for (let k = 0; k < per; k++) more(c.P[v * 3], c.P[v * 3 + 1], c.P[v * 3 + 2], c.T[v * 4 + 1], c.U[v * 4 + 3], v, k * 3, 0.92); } };
      if (SPARKS.falls) take(XF, SPARKS.falls, 2); if (SPARKS.beds) take(XB, SPARKS.beds, 1); }
    if (opts.flames && SPARKS.tongues) for (let i = 0, F = opts.flames, nf = F.P.length / 4; i < nf; i++) if (F.P[i * 4 + 3] >= 3) more(F.P[i * 4], F.P[i * 4 + 1], F.P[i * 4 + 2], F.P[i * 4 + 3], F.Q[i * 4 + 2], i, 7, 0.8);
    const n = SP.length / 4;
    g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(SP), 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(new Float32Array(SQ), 4)); g.instanceCount = n;
    const m = new THREE.Mesh(g, sparkMaterial({ ...shared, uPx })); m.frustumCulled = false; m.renderOrder = 7; group.add(m); made.push(g); }
  if (opts.yield) await opts.yield();
  // how much of the world one pixel covers a metre away, from the world's own field of view (opts.fov, degrees) and
  // the height of the drawing buffer
  const buf = new THREE.Vector2(), tanHalf = Math.tan(((opts.fov ?? 60) * Math.PI) / 360);
  return { object: group, radius: 200, height: 320, center: new THREE.Vector3(0, 70, 0), anchors: {}, laws, uniforms: shared, facts,
    // (the plume glows by the fire under it: more while the main channel burns at its middle)
    update(dt, time) { laws.set(time); if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(buf); uPx.value = (2 * tanHalf) / Math.max(1, buf.y); } uPlume.value.x = (opts.glow ?? 1) * (0.75 + 0.25 * laws.burn(150)); uPlume.value.y = opts.lakeGlow ?? 1; },
    // (dispose frees what this build made: its geometries, and the material of each of its meshes; the textures
    // those materials read are the world's and are left to it)
    dispose() { for (const g of made) g.dispose(); group.traverse((o) => { if (o.material) o.material.dispose(); }); }, ground: false, groundY: 0 };
}
