// THE STANDING STEEL of the digging wheel: the machine's tracks, its turning ring, its body and machine house, two masts
// with their boxed stays, the counterweight, the discharge bridge back to the loader on its own tracks, the loader's spout;
// and the two vehicles, both on the pit floor by the haul road (a coach on the road's north side, a crew's pickup pulled
// off onto the south verge opposite its nose), parked and empty. A machine of its kind at a
// true size (90 m tall, 190 m long), after no one machine: all closed plate, nothing lettered, no maker's plate, no company's
// colours. NOTHING HERE MOVES but the rubber of two belts (the bridge's and the spout's), whose cleats go by in the
// fragment shader on the world's clock uT; no corner of this file's geometry ever leaves its place.
// (The wheel, its boom, the cab, the chute, the belts' earth and the heap are the works file's.)
//
// HOW IT IS DRAWN: the smith (class Smith, below) builds flat-faced steel with the core's Geo and gives every corner its
// place on its own face; one fragment law (ownSurface) then draws each face by its material: painted plate (the shared
// steelSurface's plating and weather, and at the plate's own edges grime and worn metal), the running gear's iron, rubber
// belts, vehicle paint, dark glass, tyres, louvres, the turning ring's teeth. Every pattern is filtered by the pixel's
// footprint. No bar, post, stay, rib or wall of steel is thinner than 0.7 m. What is thinner is PLATE, thin one way only
// and 0.7 m or more in BOTH its greater measures (parapets 1.1 m high, doors, hoods, landings); A STRAP, A RIB OR A
// STIFFENER THAT LIES ON A PLATE IS PLATE BY THAT SAME RULE AND NO OTHER (the lead's ruling, round three b: every flange
// strap, every stiffener and every pad here is 0.7 m broad or more; a rib narrower than that is not built). What is under
// 0.7 m in both its lesser measures and stands all the same, each said here: fastenings and round bosses on a body
// (bolts, pins' heads, bearing caps, hubs, the loader's small rollers: discs and studs, no members); the crawlers' chain
// as the plan has it (shoes, each a ribbed plate 3 m broad, one every 0.63 m, their links under them: together one
// band); a flight's closed treads (each laps the next: together one stepped slab 1.2 m broad and more); the vehicles'
// own trim (bumpers, sills, lamps: no steel of the machine's). (shots/the-digging-wheel/round3b/steel/thin.mjs lists
// every flat face under 0.7 m both ways as built: a strap's, a rib's or a bar's section would show there.)
//
// WHAT THE OTHER FILES USE: buildMachine(ctx, uniforms) -> { steel, paint, triangles }   (async; it fills its share of the
//   sun's shadow tables: 16 boxes, 10 round bars);  COACH, PICKUP (where the vehicles stand);  GLSL_STEEL (the drawing of
//   steel: steelSurface);  MACHINE_BODIES (the masses as boxes, for the clear-air script: a list worked when first read;
//   machineBodies() works it).  When this file loads nothing is built and nothing asked of the land: only figures are set.
import { Geo, C, ZC, GREY, GLASS, HOLLOW, boomTop, BRIDGE, SPOUT, addShadowBox, addShadowCap } from './the-digging-wheel.js';
import { landY, fitted } from './the-digging-wheel-land.js';

export const COACH = { x: -14, z: 62, L: 12 };                // its middle on the pit floor; it stands along x
export const PICKUP = { x: -3.0, z: 69.4, L: 5.4 };           // its middle on the pit floor, where a crew parks: by the coach, pulled off the haul road onto its south verge (5.55 m south of the road's middle, the road 9 m broad: 0.1 m of verge between its wheels and the road's edge), opposite the coach's nose and a truck's length ahead of it; on level floor, no heap, boulder, berm or pool within 14 m of it; its body's box in MACHINE_BODIES stands 26.3 m from the lens's line at the nearest. From the lens's line it is in the 16:9 picture whole, no corner of it behind the coach, from the entry to metre 91, where it leaves by the picture's right edge 30 m off (shots/the-digging-wheel/round3/steel/place.mjs: a place in line with the coach, nose to tail, lies behind the coach from metre 64 on)
const PICKUP_RY = 0.112;                                      // its yaw: it stands along the road there (the road's own heading at its place), its nose to the east as the coach's is
const pickupY = () => landY(PICKUP.x, PICKUP.z);              // the pit floor's level under it (asked of the land in the build and when the list of bodies is first read, never when this file loads)

// THE DRAWING OF STEEL, one law for all the machine's plate: this file's own and (imported) the works file's wheel, boom and cab.
// base: the corner's paint; p0: the corner's place as built (so the drawing sticks to steel that turns); wp: its place now;
// n: the face's normal; foot: the pixel's footprint in metres. Everything is placed from p0 and filtered by foot: a line
// thinner than the footprint fades into the plate's mean tone, rivets come in only as they come to cover a pixel.
//   steelSurface(base, p0, wp, n, foot)  the whole law: plates laid like brickwork (4.8 by 2.4 m), each its own tone, dark
//       joints under paler straps, rivet rows beside them; rust running down walls from the level seams and hanging in
//       blotches; chips; pale dust on level tops; grime on undersides; the pit's earth on what stands under 6 m. A base
//       darker than 0.05 (a hollow, dark glass) is given back untouched. n does two things: it chooses the face's frame
//       (deck or wall) and says what is a top and what a wall: for steel that TURNS hand it the normal AS BUILT if the
//       drawing is to stick as it goes round.
//       Steel that STANDS (p0 equal to wp) is then given the steel's light (stLight, below), for which n must be the
//       normal as the face stands; steel that turns keeps the core's light, so the as-built normal does it no harm.
//   stPlating(col, q, S, foot), stWeather(col, p0, q, n, foot, sv)   its two halves, for a face with coordinates q of its own
//   stLight(col, n, wp, k)               (fragment only) the colour so weighed that under the core's light it reads as grey
//       painted steel: cooler than the earth in the gold sun, filled by the sky in the shade (see at the law itself)
//   stLine(d, w, f)                      the footprint's filter for any line (see below)
//   stOil(p0, n, c, w, len), steelOil(col, amount)   an oil-dark stain running down from a drive at c (as built): each file
//       knows where its own drives are and lays these on in its surface()
// (every name here begins with st or ST_ so that it meets nothing in the file that takes the chunk in)
export const GLSL_STEEL = /* glsl */`
  const vec3 ST_RUST = vec3(0.20, 0.088, 0.045), ST_DUST = vec3(0.52, 0.45, 0.33), ST_MUD = vec3(0.33, 0.265, 0.18), ST_BARE = vec3(0.50, 0.49, 0.47);
  float stHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float stNoise(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
    return mix(mix(stHash(i), stHash(i + vec2(1., 0.)), f.x), mix(stHash(i + vec2(0., 1.)), stHash(i + vec2(1., 1.)), f.x), f.y); }
  // how much of a pixel of footprint f a line of width w covers when the line's middle lies d from the pixel's
  // (a line thinner than the footprint gives w / f wherever it falls in the pixel: the plate's mean tone, never a crawl)
  float stLine(float d, float w, float f){ return clamp((0.5 * (w + f) - abs(d)) / f, 0., min(1., w / f)); }
  // from x to the nearest multiple of s, signed
  float stOff(float x, float s){ return x - s * floor(x / s + 0.5); }
  // THE PLATING of a face whose own coordinates are q (metres): plates S.x long and S.y high laid like brickwork, each its own
  // tone; round each a dark joint under a strap's paler band, a row of rivets on either side of it
  vec3 stPlating(vec3 col, vec2 q, vec2 S, float foot){
    float row = floor(q.y / S.y), qx = q.x + 0.5 * S.x * mod(row, 2.);
    col *= 1. + (stHash(vec2(floor(qx / S.x), row)) - 0.5) * 0.22 * (1. - smoothstep(0.25, 0.5, foot / S.y));   // (gone when two footprints no longer fit in a plate)
    float sh = stOff(q.y, S.y), sv = stOff(qx, S.x), dh = abs(sh), dv = abs(sv);
    float strap = max(stLine(dh, 0.34, foot), stLine(dv, 0.26, foot)), joint = max(stLine(dh, 0.05, foot), stLine(dv, 0.04, foot));
    col *= (1. + 0.08 * strap) * (1. - 0.62 * joint);
    float rv = 1. - smoothstep(0.04, 0.085, foot);            // rivets come in as they come to cover a pixel
    if (rv > 0.) { const float R = 0.042;
      vec2 a = vec2(stOff(q.x, 0.3), sh - sign(sh) * 0.105), b = vec2(sv - sign(sv) * 0.085, stOff(q.y, 0.3));
      vec2 d = dot(a, a) < dot(b, b) ? a : b; float l = length(d);
      float inside = 1. - smoothstep(R - 0.5 * foot, R + 0.5 * foot, l);
      col *= mix(1., clamp(0.96 + 0.42 * d.y / R, 0.6, 1.35), inside * rv); }
    return col;
  }
  // THE WEATHER on it: rust that runs down a wall from each level seam (sv apart) and hangs in blotches and drips; pale dust
  // lying on what is level; the pit's earth thrown up on what stands low; small chips in the paint
  vec3 stWeather(vec3 col, vec3 p0, vec2 q, vec3 n, float foot, float sv){
    float wall = 1. - smoothstep(0.35, 0.7, abs(n.y)), top = smoothstep(0.45, 0.85, n.y);
    float seam = floor(q.y / sv), below = sv * (1. - fract(q.y / sv));                 // metres below the seam above
    float s1 = smoothstep(0.50, 0.80, stNoise(vec2(q.x * 2.6, seam * 7.3))) * exp(-1.6 * below / (0.6 + 2.2 * stNoise(vec2(q.x * 0.9 + 31., seam * 3.1))));
    s1 *= 0.55 + 0.45 * stNoise(vec2(q.x * 9., q.y * 0.6));
    s1 = mix(s1, 0.09, smoothstep(0.15, 0.5, foot));          // (the streaks' mean when one is narrower than two footprints)
    float s2 = smoothstep(0.58, 0.90, stNoise(vec2(q.x * 0.23 + 5., q.y * 0.31))) * (0.35 + 0.65 * stNoise(vec2(q.x * 1.3, q.y * 0.11 + 9.)));
    s2 = mix(s2, 0.05, smoothstep(1., 3., foot));
    col = mix(col, ST_RUST, wall * clamp(0.6 * s1 + 0.5 * s2, 0., 0.62));
    float ch = smoothstep(0.80, 0.87, vnoise(p0 * 6.3)) * (1. - smoothstep(0.03, 0.09, foot));
    col = mix(col, ST_RUST * 0.8, 0.5 * ch);
    col = mix(col, ST_DUST, top * (0.25 + 0.5 * fbm(p0 * 0.31)));
    col *= 1. - 0.18 * smoothstep(0.45, 0.85, -n.y);          // undersides keep their grime
    return mix(col, ST_MUD, (1. - smoothstep(0.3, 5.0, p0.y)) * (0.10 + 0.4 * vnoise(p0 * 0.8)));
  }
  // THE LIGHT ON PAINTED STEEL THAT STANDS (fragment only: it uses the core's shade and skyAmb). The core lights every
  // face alike, by the gold sun and the sky's fill; grey paint comes out of that khaki in the sun and near black in the
  // shade. This gives a face's colour back so weighed that the core's light then leaves it as painted steel is seen: in the
  // sun a grey a little cooler than the earth round it (k of the way: the gloss of paint gives back the sky with the sun);
  // in the shade the open sky's fill at nearly twice the core's, bluer on what looks away from the sun, and on what looks
  // east the warm light the sunlit face of the cut throws back. n: the face's normal AS IT STANDS NOW.
  vec3 stLight(vec3 col, vec3 n, vec3 wp, float k){
    float ndl = max(dot(n, uSun), 0.), cut = ndl > 0. ? shadeOnce(wp) : 0.;   // (the core's lit() asks the same and gets it for nothing)
    vec3 amb = skyAmb(n), sun = SUNC * ndl * (1. - cut);
    vec3 sunP = mix(SUNC, vec3(0.86, 0.87, 0.915), 0.72 * k) * ndl * (1. - cut);
    float away = 0.5 - 0.5 * dot(normalize(n.xz + vec2(1e-4)), normalize(uSun.xz)) * (1. - abs(n.y));
    vec3 fill = amb * (1. + 0.85 * k) + k * (vec3(0.014, 0.022, 0.040) * away + vec3(0.150, 0.118, 0.078) * max(n.x, 0.) * (1. - 0.5 * abs(n.y)));
    return col * (sunP + fill) / (sun + amb);
  }
  vec3 steelSurface(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot){
    float is = smoothstep(0.05, 0.085, dot(base, vec3(0.3, 0.5, 0.2)));       // hollows and dark glass are let be
    if (is <= 0.) return base;
    vec2 q = abs(n.y) > 0.7 ? p0.xz : vec2(dot(p0.xz, normalize(vec2(-n.z, n.x))), p0.y);   // the face's own frame: a deck's (east, south) or a wall's (along it, up)
    vec3 col = base * (1. + (fbm(p0 * 0.9) - 0.5) * 0.24 * (1. - smoothstep(0.6, 2., foot)));
    col = stPlating(col, q, vec2(4.8, 2.4), foot);
    col = mix(base, stWeather(col, p0, q, n, foot, 2.4), is);
    // steel that stands where it was built takes the steel's light (its n is then the normal as it stands). Steel that turns
    // keeps the core's: and so that it keeps it at the clocks when the wheel stands as built too (every 20 s: p0 is wp then),
    // so does everything in the round the wheel sweeps (out to its teeth, as wide as its buckets) and on its shaft's line.
    vec3 dp = abs(p0 - wp); float rr = length(p0.xy - uWheel.xy);
    bool stands = max(dp.x, max(dp.y, dp.z)) < 0.001 && rr > 0.8 && (rr > uWheel.z + 0.3 || abs(p0.z) > 1.7);
    return stands ? stLight(col, n, wp, 1.) : col;
  }
  // how much oil lies at p0 under a drive at c (its place as built): a stain w wide that runs len down a wall from c
  // and lies in a pool about it on a deck
  float stOil(vec3 p0, vec3 n, vec3 c, float w, float len){
    vec3 d = p0 - c; float side = length(d.xz), down = -d.y;
    float wallAmt = (1. - smoothstep(0.35 * w, 0.6 * w, side - 0.12 * max(down, 0.))) * smoothstep(-0.3, 0.3, down) * (1. - smoothstep(0.35 * len, len, down));
    float deckAmt = (1. - smoothstep(0.5 * w, 1.1 * w, side)) * (1. - smoothstep(0.3, 1.5, abs(d.y)));
    float a = mix(wallAmt, deckAmt, smoothstep(0.5, 0.8, abs(n.y)));
    return a * (0.45 + 0.55 * vnoise(vec3(p0.x * 3.1, p0.y * 0.4, p0.z * 3.1)));
  }
  vec3 steelOil(vec3 col, float amount){ return mix(col, col * 0.22 + vec3(0.012, 0.011, 0.010), clamp(amount, 0., 1.) * 0.85); }
`;

// ---------- this file's own materials ----------
// Every corner of this file's meshes is marked [8, material, a, b] and carries in aux its place on its own face: (u, v) in
// metres from the face's middle and the face's half sizes. KIND 8 here means this file's own steel, in this file's own
// two meshes under this file's own law of motion (OWN_MOTION): it STANDS, every corner given back unmoved. (The works'
// law of motion knows kinds 2 to 10 and has a kind 8 of its own, a corner of the boom's belt's heaped bed, in the works'
// own meshes: a mesh has one law, so the two never meet.) The vertex shader hands mark and aux to the fragment, which so
// knows how far it is from the plate's edge and how the plate lies.
const OWN = 8;
const PLATE = 0, IRON = 1, BELT = 2, PAINT = 3, PANE = 4, TYRE = 5, LOUVRE = 6, TEETH = 7;
const WORLD = 0, GIRDER = 1, SMALL = 2, PARAPET = 3;          // a PLATE's plating: the world's brickwork; joints across a long member; none (a small part); a stair's or a walk's plated side (upright ribs, a rail along its head, a stringer along its foot)
const OWN_MOTION = /* glsl */`
  varying vec4 vOwn; varying vec3 vKind;
  vec3 movedMore(vec3 p, vec4 mark, vec4 aux){ vOwn = aux; vKind = mark.yzw; return p; }
`;
// where oil runs: [x, y, z, width, length] under each drive of this file's steel (filled as the parts are built)
const ownSurface = (oil) => GLSL_STEEL + /* glsl */`
  varying vec4 vOwn; varying vec3 vKind;
  // PLATE: painted steel. A: how it is plated (0 the world's brickwork, 1 a long member: joints across it and a riveted
  // flange along each long edge, 2 a small part: no joints)
  vec3 kPlate(vec3 base, vec3 p0, vec3 n, float foot, vec2 uv, vec2 hf, float edge, float A){
    if (dot(base, vec3(0.3, 0.5, 0.2)) < 0.05) return base;   // (a hollow's dark)
    vec2 q =abs(n.y) > 0.7 ? p0.xz : vec2(dot(p0.xz, normalize(vec2(-n.z, n.x))), p0.y);
    vec3 col = base * (1. + (fbm(p0 * 0.9) - 0.5) * 0.24 * (1. - smoothstep(0.6, 2., foot)));
    if (A < 0.5) col = stPlating(col, q, vec2(4.8, 2.4), foot);
    else if (A < 1.5 && hf.x < 500.) {
      bool lu = hf.x >= hf.y; float along = lu ? uv.x : uv.y, e2 = lu ? hf.y - abs(uv.y) : hf.x - abs(uv.x), half2 = lu ? hf.y : hf.x;
      float d = abs(stOff(along, 6.0));
      col *= 1. + (stHash(vec2(floor(along / 6.0 + 0.5), floor(half2 * 8.))) - 0.5) * 0.26 * (1. - smoothstep(0.8, 2.0, foot));
      col *= (1. + 0.09 * stLine(d, 0.5, foot)) * (1. - 0.6 * stLine(d, 0.05, foot));
      if (half2 > 0.9) col *= 1. - 0.16 * smoothstep(0.40 - 0.5 * foot, 0.40 + 0.5 * foot, e2) * smoothstep(0.32 - 0.5 * foot, 0.32 + 0.5 * foot, d) * (1. - smoothstep(0.9, 2.2, foot));   // the web between flanges and straps lies a little darker: a plated girder's panels, seen from afar
      if (half2 > 0.45) { const float R = 0.042;
        col *= 1. + 0.08 * stLine(e2 - 0.15, 0.30, foot);
        vec2 dd = vec2(stOff(along, 0.3), e2 - 0.15);
        col *= mix(1., clamp(0.96 + 0.42 * dd.y / R, 0.6, 1.35), (1. - smoothstep(R - 0.5 * foot, R + 0.5 * foot, length(dd))) * (1. - smoothstep(0.04, 0.085, foot))); }
    }
    else if (A > 2.5 && hf.x < 500. && abs(n.y) < 0.6 && hf.x > hf.y) {
      // A STAIR'S OR A WALK'S PLATED SIDE (a wall: its v is up, its head at +hf.y): plate panels between UPRIGHT ribs
      // 1.4 m apart (placed along the wall by the level run, so that on a flight's sloping side they stand upright),
      // each panel its own tone; a rail along its head, a dark line under it; along its foot the stringer, a darker
      // band 0.22 m deep. Every line by the footprint: each fades to its mean as the footprint outgrows it.
      float hp = uv.y + hf.y, dj = abs(stOff(q.x, 1.4));
      col *= 1. + (stHash(vec2(floor(q.x / 1.4), floor(hf.x * 8.))) - 0.5) * 0.16 * (1. - smoothstep(0.5, 1.5, foot));   // (a panel's tone changes under a rib)
      col *= (1. + 0.16 * stLine(dj, 0.12, foot)) * (1. - 0.45 * stLine(dj - 0.085, 0.04, foot));
      col *= (1. + 0.20 * stLine(hp - (2. * hf.y - 0.07), 0.14, foot)) * (1. - 0.4 * stLine(hp - (2. * hf.y - 0.16), 0.04, foot));
      col *= 1. - 0.24 * stLine(hp - 0.11, 0.22, foot);
    }
    col = stWeather(col, p0, q, n, foot, 2.4);
    ${oil.length ? 'float oil = 0.; vec3 od;' : ''}
    ${oil.map(([x, y, z, w, len]) => { const c = `vec3(${[x, y, z].map((v) => v.toFixed(2)).join(', ')})`, R = Math.max(1.1 * w, 0.6 * w + 0.12 * len).toFixed(2), D = Math.max(len, 1.5).toFixed(2);   // (a stain is worked only inside the box that holds all of it: stOil gives nothing farther than R to the side of its drive, higher than 1.5 m over it or lower than D under it)
      return `od = p0 - ${c}; if (abs(od.x) < ${R} && abs(od.z) < ${R} && od.y < 1.5 && od.y > -${D}) oil = max(oil, stOil(p0, n, ${c}, ${w.toFixed(2)}, ${len.toFixed(2)}));`; }).join('\n    ')}
    ${oil.length ? 'col = steelOil(col, oil);' : ''}
    col *= 1. - 0.17 * (1. - smoothstep(0., 0.30, edge)) * (1. - smoothstep(0.3, 0.9, foot));   // grime gathers where plates meet,
    col *= 1. - 0.13 * (1. - smoothstep(0., 1.3, edge)) * (1. - smoothstep(1.2, 3.5, foot));    // and lies deeper into the plate, fainter
    if (hf.x < 500. && abs(n.y) < 0.6) col *= 1. + 0.09 * clamp(uv.y / hf.y, -1., 1.);         // a wall is cleaner toward its head
    return mix(col, ST_BARE * 0.8, 0.6 * stLine(edge, 0.08, foot) * smoothstep(0.35, 0.65, vnoise(p0 * 1.7)));   // the paint worn off the edge, in a broken line
  }
  // IRON: the running gear. Cast dark, rusted in patches, the pit's earth packed into it, worn bright along its edges; A 1: a
  // pad (a face that runs on the ground or under a roller), scoured bright all over in scratches
  vec3 kIron(vec3 base, vec3 p0, vec3 n, float foot, vec2 hf, float edge, float A){
    vec3 col = base * (0.8 + 0.4 * fbm(p0 * 2.3));
    float fine = 1. - smoothstep(0.1, 0.4, foot);
    col = mix(col, ST_RUST * 0.75, mix(0.25, 0.55 * smoothstep(0.3, 0.75, vnoise(p0 * 3.7 + 11.)), fine));
    float low = 0.15 + 0.45 * (1. - smoothstep(0.2, 3.0, p0.y));
    float mud = low * mix(0.4, smoothstep(0.45, 0.85, vnoise(p0 * 1.9) + 0.45 * (1. - smoothstep(0., 0.14, edge))), fine);
    col = mix(col, ST_MUD * 0.9, 0.75 * mud);
    float wear = stLine(edge, 0.05, foot) * (0.4 + 0.6 * vnoise(p0 * 5.));
    if (A > 0.5 && hf.x < 500.) wear = max(wear, mix(0.35, 0.2 + 0.7 * smoothstep(0.25, 0.7, vnoise(vec3(p0.x * 0.9, p0.y * 9., p0.z * 9.))), fine) * (1. - 0.7 * mud));   // (a pad's flat faces; not a drum's ends)
    return mix(col, ST_BARE * 0.9, 0.75 * wear);
  }
  // BELT: rubber that runs. A: +1 when it runs toward -x; B: how fast it goes by in x, metres a second (its own speed
  // along its slope, taken level). Its cleats and the earth's film on it go by on the world's clock
  vec3 kBelt(vec3 base, vec3 p0, float foot, float edge, float A, float B){
    float s = p0.x * A + uT * B;
    vec3 col = base * (0.8 + 0.4 * vnoise(vec3(s * 0.9, p0.z * 1.7, 3.)));
    col = mix(col, ST_DUST * 0.55, 0.45 * smoothstep(0.3, 0.8, vnoise(vec3(s * 0.33, p0.z * 0.9, 7.))));
    col *= 1. + 1.1 * stLine(stOff(s, 1.4), 0.18, foot);
    return mix(col, ST_BARE * 0.8, 0.6 * stLine(edge - 0.07, 0.14, foot));   // its edges, worn bright where they rub the kerbs
  }
  // PAINT: a vehicle's. A: the ground's level under it (under -50: a part that takes no dust). The pit's dust stands up its
  // walls from the ground (thick on the skirts, its upper edge ragged, a thinning film over that to the waist) and lies
  // as a film on what is level; the ragged edge fades to its mean as the footprint outgrows it
  vec3 kPaint(vec3 base, vec3 p0, vec3 n, float foot, float edge, float A){
    vec3 col = base * (0.96 + 0.08 * vnoise(p0 * 1.3));
    float h = p0.y - A, rag = mix(vnoise(vec3(p0.x * 1.9, p0.y * 0.6, p0.z * 1.9)), 0.5, smoothstep(0.15, 0.5, foot)), up = 0.5 + 0.8 * rag;   // (up: how high the thick dust stands here, metres)
    float dust = (1. - smoothstep(0.5, 0.8, abs(n.y))) * (0.72 * (1. - smoothstep(0.3 * up, up, h)) + 0.2 * (1. - smoothstep(up, up + 1.2, h)));
    dust = max(dust, 0.3 * smoothstep(0.6, 0.9, n.y) * (0.5 + 0.5 * rag)) * step(-50., A);
    col = mix(col, ST_DUST * (0.8 + 0.12 * vnoise(p0 * 2.7)), dust);
    return col * (1. - 0.12 * (1. - smoothstep(0., 0.06, edge)) * (1. - smoothstep(0.03, 0.12, foot)));
  }
  // PANE: dark glass holding a little of the sky, deeper below, in a rubber seal
  vec3 kPane(vec3 base, float foot, vec2 uv, vec2 hf, float edge){
    float up = clamp(0.5 + 0.5 * uv.y / max(hf.y, 0.01), 0., 1.);
    vec3 col = mix(base, vec3(0.075, 0.10, 0.135), 0.2 + 0.6 * up * up);
    col = mix(col, ST_DUST * 0.4, 0.18 * (1. - up));
    return mix(col, vec3(0.015), stLine(edge, 0.07, foot));
  }
  vec3 kTyre(vec3 base, vec3 p0){ return mix(base * (0.8 + 0.4 * vnoise(p0 * 4.1)), ST_DUST * 0.45, 0.25 + 0.3 * vnoise(p0 * 2.3)); }
  // LOUVRE: slats A apart in a frame, the panel set back under its head (the slats fade to their mean tone when two
  // footprints no longer fit in one)
  vec3 kLouvre(vec3 base, float foot, vec2 uv, vec2 hf, float edge, float A){
    float f = fract(uv.y / A), k = 1. - smoothstep(0.3 * A, 0.7 * A, foot);
    vec3 col = base * mix(0.62, mix(0.26, 1.02, smoothstep(0.15, 0.8, f)), k);
    col *= 1. - 0.4 * smoothstep(hf.y - 0.55, hf.y - 0.16, uv.y);
    return mix(base * 1.18, col, smoothstep(0.13 - 0.5 * foot, 0.13 + 0.5 * foot, edge));
  }
  // TEETH: the turning ring's toothed band about the machine's axis. A: the teeth's pitch, metres
  vec3 kTeeth(vec3 base, vec3 p0, float foot, vec2 uv, vec2 hf, float A){
    vec2 r = p0.xz - vec2(0., ${ZC.toFixed(1)});
    float gap = stLine(stOff(atan(r.y, r.x) * length(r), A), 0.44 * A, foot);
    vec3 col = mix(mix(base * 1.5, ST_BARE * 0.75, 0.35 + 0.3 * uv.y / max(hf.y, 0.01)), base * 0.22, gap);
    return col * (0.85 + 0.3 * vnoise(p0 * 2.9));
  }
  vec3 surface(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot){
    float id = floor(vKind.x + 0.5), A = vKind.y, B = vKind.z;
    vec2 uv = vOwn.xy, hf = vOwn.zw; float edge = min(hf.x - abs(uv.x), hf.y - abs(uv.y));   // metres in from the face's nearest edge
    vec3 col; float k = 1.;                                   // (k: how much of the steel's light the face takes: the vehicles' paint and tyres and every pane of glass take half)
    if (id < 0.5) col = kPlate(base, p0, n, foot, uv, hf, edge, A);
    else if (id < 1.5) col = kIron(base, p0, n, foot, hf, edge, A);
    else if (id < 2.5) col = kBelt(base, p0, foot, edge, A, B);
    else if (id < 3.5) { col = kPaint(base, p0, n, foot, edge, A); k = 0.5; }
    else if (id < 4.5) { col = kPane(base, foot, uv, hf, edge); k = 0.5; }
    else if (id < 5.5) { col = kTyre(base, p0); k = 0.5; }
    else if (id < 6.5) col = kLouvre(base, foot, uv, hf, edge, A);
    else col = kTeeth(base, p0, foot, uv, hf, A);
    return stLight(col, n, wp, k);
  }
`;

// THE SMITH: this file's builder. The core's Geo makes the corners; to each the smith gives the corner's place on its
// own face, in the geometry's aux. Its box, beam, prism and cyl are the Geo's, face by
// face (u along a face's first edge, v along its last; on a wall v is up, on a member u runs along it).
// (the places are written STRAIGHT INTO THE GEO'S OWN AUX, over the nought its tri has just laid there for each corner
// (the smith never sets the Geo's aux), read after the tri, for a Geo that grows takes new arrays: the same numbers the
// mesh's aux was always given, without a list of their own kept beside the Geo and copied in when the mesh is made)
const QUAD_UV = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];   // a quad's six corners as its two triangles go (a, b, c, a, c, d), each as (u, v) in halves of its two sides
class Smith {
  constructor(corners = 32768) { this.g = new Geo(corners); this.kind(PLATE); }   // (corners: the room it starts with; one that comes to hold more grows)
  kind(id, a = 0, b = 0) { this.g.mark = [OWN, id, a, b]; return this; }
  get triangles() { return this.g.triangles; }
  // a flat four-cornered face, its corners in order round it
  quad(a, b, c, d, col) {
    const hu = 0.5 * Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), hv = 0.5 * Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    let i = this.g.triangles * 12; this.g.quad(a, b, c, d, col); const L = this.g.A;
    for (let k = 0; k < 12; k += 2) { L[i++] = QUAD_UV[k] * hu; L[i++] = QUAD_UV[k + 1] * hv; L[i++] = hu; L[i++] = hv; }   // (its six corners' places on it, by QUAD_UV: no list is made for every face)
  }
  // a three-cornered face with no edge of its own
  tri(a, b, c, col) { let i = this.g.triangles * 12; this.g.tri(a, b, c, col); const L = this.g.A; for (let k = 0; k < 3; k++) { L[i++] = 0; L[i++] = 0; L[i++] = 1e3; L[i++] = 1e3; } }
  // one blade of a fan about o: its edge is p to q
  fan(o, p, q, col) {
    const ex = q[0] - p[0], ey = q[1] - p[1], ez = q[2] - p[2], ox = o[0] - p[0], oy = o[1] - p[1], oz = o[2] - p[2], el = Math.hypot(ex, ey, ez) || 1;
    const r = Math.hypot(oy * ez - oz * ey, oz * ex - ox * ez, ox * ey - oy * ex) / el;
    let i = this.g.triangles * 12; this.g.tri(o, p, q, col); const L = this.g.A;
    for (let k = 0; k < 3; k++) { L[i++] = 0; L[i++] = k ? r : 0; L[i++] = 1e3; L[i++] = r; }
  }
  // the six faces of a box by its eight corners v[z][y][x] in the order -,+ (skip: a set of faces left out, of 'S','N','E','W','T','B' on an unturned box)
  _box(v, col, skip = '') {
    if (!skip.includes('S')) this.quad(v[4], v[5], v[7], v[6], col);
    if (!skip.includes('N')) this.quad(v[1], v[0], v[2], v[3], col);
    if (!skip.includes('E')) this.quad(v[5], v[1], v[3], v[7], col);
    if (!skip.includes('W')) this.quad(v[0], v[4], v[6], v[2], col);
    if (!skip.includes('T')) this.quad(v[6], v[7], v[3], v[2], col);
    if (!skip.includes('B')) this.quad(v[0], v[1], v[5], v[4], col);
  }
  // a box by its middle and sizes, turned ry about y and rz about z (as the Geo's)
  box(cx, cy, cz, sx, sy, sz, col, ry = 0, rz = 0, skip = '') {
    const cy_ = Math.cos(ry), sy_ = Math.sin(ry), cz_ = Math.cos(rz), sz_ = Math.sin(rz), v = [];
    for (const z of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const x of [-0.5, 0.5]) {
      const lx = x * sx, ly = y * sy, lz = z * sz, x1 = lx * cz_ - ly * sz_, y1 = lx * sz_ + ly * cz_;
      v.push([cx + x1 * cy_ + lz * sy_, cy + y1, cz - x1 * sy_ + lz * cy_]); }
    this._box(v, col, skip);
  }
  // a straight member from p to q, w wide (level, across it) and h deep; w1, h1: its sizes at q when it tapers
  beam(p, q, w, h, col, w1 = w, h1 = h, skip = '') {
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], len = Math.hypot(dx, dy, dz), d = [dx / len, dy / len, dz / len];
    let s = [d[2], 0, -d[0]]; const sl = Math.hypot(s[0], s[2]); s = sl < 1e-6 ? [1, 0, 0] : [s[0] / sl, 0, s[2] / sl];   // up cross d: level, across it
    const u = [d[1] * s[2] - d[2] * s[1], d[2] * s[0] - d[0] * s[2], d[0] * s[1] - d[1] * s[0]];
    const v = [];                                             // corners v[side][up][end]: the member's own x is its length
    for (const k of [-0.5, 0.5]) for (const j of [-0.5, 0.5]) for (const e of [0, 1]) { const o = e ? q : p, ww = e ? w1 : w, hh = e ? h1 : h;
      v.push([o[0] + s[0] * k * ww + u[0] * j * hh, o[1] + s[1] * k * ww + u[1] * j * hh, o[2] + s[2] * k * ww + u[2] * j * hh]); }
    this._box(v, col, skip);
  }
  // a flat outline (corners in order) pushed from w0 to w1 across it; map(u, v, w) gives the place
  prism(poly, w0, w1, map, col, capCol = col, ends = true) {
    const n = poly.length; let cu = 0, cv = 0; for (const [u, v] of poly) { cu += u / n; cv += v / n; }
    for (let i = 0; i < n; i++) {
      const [u0, v0] = poly[i], [u1, v1] = poly[(i + 1) % n];
      this.quad(map(u0, v0, w0), map(u1, v1, w0), map(u1, v1, w1), map(u0, v0, w1), col);
      if (ends) { this.fan(map(cu, cv, w0), map(u0, v0, w0), map(u1, v1, w0), capCol); this.fan(map(cu, cv, w1), map(u0, v0, w1), map(u1, v1, w1), capCol); }
    }
  }
  // a round bar from p to q (n sides); r1: its radius at q; caps: 0 none, 1 at p, 2 at q, 3 both
  cyl(p, q, r, n, col, capCol = col, r1 = r, caps = 3) {
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], len = Math.hypot(dx, dy, dz), d = [dx / len, dy / len, dz / len];
    let s = [d[2], 0, -d[0]]; const sl = Math.hypot(s[0], s[2]); s = sl < 1e-6 ? [1, 0, 0] : [s[0] / sl, 0, s[2] / sl];
    const t = [d[1] * s[2] - d[2] * s[1], d[2] * s[0] - d[0] * s[2], d[0] * s[1] - d[1] * s[0]];
    const ring = (c, rr) => { const o = new Array(n); for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2, cs = Math.cos(th) * rr, sn = Math.sin(th) * rr; o[i] = [c[0] + s[0] * cs + t[0] * sn, c[1] + s[1] * cs + t[1] * sn, c[2] + s[2] * cs + t[2] * sn]; } return o; };
    const A = ring(p, r), B = ring(q, r1);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.quad(A[i], A[j], B[j], B[i], col); if (caps & 1) this.fan(p, A[i], A[j], capCol); if (caps & 2) this.fan(q, B[i], B[j], capCol); }
  }
  mesh(uniforms, oil = []) {
    return fitted(this.g).mesh(uniforms, { surface: ownSurface(oil), motion: OWN_MOTION });   // (its aux holds the corners' places already: see above)
  }
}

// the paints (linear): two close greys so that the masses part (the body and its legs; the booms, masts and stays), a paler
// one for the houses, cast iron for the running gear
const BODYC = [0.132, 0.14, 0.149], BOOMC = GREY, HOUSEC = [0.36, 0.37, 0.355], IRONC = [0.068, 0.064, 0.062], RUBBER = [0.035, 0.035, 0.037];
const tone = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ONE CRAWLER TRACK about (x0, z0) on the ground, lying along x: L long, H tall, W wide. A chain of SHOES (each a pad with
// a rib across it, one after another round the whole stadium), the links and pins that join them, a tumbler at each end,
// the track's frame between them with its rollers below and above and, in its middle, the boss of the bogie's great pin.
// south, north: how much is drawn on that flank (2: all, with the chain's pins and the bolts; 1: no pins or bolts; 0: bare).
// Gives the frame's middle height. It yields inside its loop of shoes.
async function buildTrack(ctx, S, x0, z0, L, H, W, south, north) {
  const r = H / 2, a = L / 2 - r, RIB = 0.14, TH = 0.24, LINK = 0.30, rs = r - RIB;     // the pads' outer faces run at rs; the ribs reach r
  const P = 4 * a + 2 * Math.PI * rs, N = Math.round(P / 0.63), pitch = P / N, rt = rs - TH - LINK;
  // a place on the chain's line, s metres along it from the aft end of the bottom run: [x, y, tx, ty]; outward is (ty, -tx)
  const at = (s) => { s = ((s % P) + P) % P;
    if (s < 2 * a) return [-a + s, r - rs, 1, 0];
    s -= 2 * a; if (s < Math.PI * rs) { const th = -Math.PI / 2 + s / rs; return [a + Math.cos(th) * rs, r + Math.sin(th) * rs, -Math.sin(th), Math.cos(th)]; }
    s -= Math.PI * rs; if (s < 2 * a) return [a - s, r + rs, -1, 0];
    s -= 2 * a; const th = Math.PI / 2 + s / rs; return [-a + Math.cos(th) * rs, r + Math.sin(th) * rs, -Math.sin(th), Math.cos(th)]; };
  const hl = pitch / 2 - 0.025, RW = 0.11, SHOE = [[-hl, -TH], [hl, -TH], [hl, 0], [RW, 0], [RW, RIB], [-RW, RIB], [-RW, 0], [-hl, 0]], PADS = [2, 4, 6];
  for (let k = 0; k < N; k++) {
    const [px, py, tx, ty] = at((k + 0.5) * pitch), M = (e, f, w) => [x0 + px + tx * e + ty * f, py + ty * e - tx * f, z0 + w];
    const col = tone(IRONC, 0.85 + 0.3 * ((k * 7) % 5) / 5), o0 = M(0, -TH / 2, -W / 2), o1 = M(0, -TH / 2, W / 2);
    for (let i = 0; i < 8; i++) { const [e0, f0] = SHOE[i], [e1, f1] = SHOE[(i + 1) % 8];
      S.kind(IRON, PADS.includes(i) ? 1 : 0); S.quad(M(e0, f0, -W / 2), M(e1, f1, -W / 2), M(e1, f1, W / 2), M(e0, f0, W / 2), PADS.includes(i) ? tone(col, 1.5) : col);
      S.kind(IRON); S.fan(o0, M(e0, f0, -W / 2), M(e1, f1, -W / 2), col); S.fan(o1, M(e0, f0, W / 2), M(e1, f1, W / 2), col); }
    // the links that join it to the next, on either flank, and the pins' heads
    S.kind(IRON);
    for (const sd of [1, -1]) { const lvl = sd > 0 ? south : north, zl = sd * (W / 2 - 0.29 - 0.06 * (k % 2)), lk = LINK - 0.04 * (k % 2), c = M(0, -TH - lk / 2, zl);   // (every other link sits 0.06 m further in and stands 0.04 m lower: where two lap, no two of their faces lie in one plane)
      S.box(c[0], c[1], c[2], pitch + 0.1, lk, 0.26, tone(col, 0.9), 0, Math.atan2(ty, tx), sd > 0 ? 'BN' : 'BS');
      if (lvl > 1) { const [qx, qy, ux, uy] = at(k * pitch), pc = [x0 + qx - uy * (TH + LINK / 2), qy + ux * (TH + LINK / 2), z0];
        S.cyl([pc[0], pc[1], z0 + sd * (W / 2 - 0.17)], [pc[0], pc[1], z0 + sd * (W / 2 - 0.05)], 0.085, 6, tone(IRONC, 1.6), tone(IRONC, 1.6), 0.085, 2); } }
    if (k % 16 === 15) await ctx.yield();
  }
  // the tumblers: a drum through the track's width at each end; on each flank its hub, its bearing's cap, six pads round the hub (the machine's own tracks; the loader's drums are too small for them), eight bolts
  const zf = W / 2 - 0.42, zd = W / 2 - 0.25, FRAME = tone(BODYC, 0.9);
  for (const e of [-1, 1]) { const cx = x0 + e * a;
    S.kind(IRON, 1); S.cyl([cx, r, z0 - zd], [cx, r, z0 + zd], rt, 24, tone(IRONC, 1.25), IRONC);
    for (const sd of [1, -1]) { const lvl = sd > 0 ? south : north, zc = z0 + sd * zd, out = (d) => zc + sd * d;
      S.kind(PLATE, SMALL); S.cyl([cx, r, zc], [cx, r, out(0.26)], 0.42 * rt, 16, FRAME, FRAME, 0.40 * rt, 2);
      if (lvl > 0) { S.cyl([cx, r, out(0.26)], [cx, r, out(0.40)], 0.2 * rt, 10, tone(FRAME, 1.25), tone(FRAME, 1.25), 0.2 * rt, 2);
        S.kind(IRON); if (rt > 1.3) for (let i = 0; i < 6; i++) { const th = (i + 0.5) / 6 * Math.PI * 2; S.box(cx + Math.cos(th) * 0.7 * rt, r + Math.sin(th) * 0.7 * rt, out(0.045), 0.7, 0.7, 0.09, tone(IRONC, 1.1), 0, th, sd > 0 ? 'N' : 'S'); } }   // (six pads round the hub, each 0.7 m by 0.7 m, 0.09 m proud: plate by both its greater measures; they stand 0.05 m off the hub, 0.04 m from each other at their inner corners and 0.02 m inside the drum's edge. A drum too small for pads of that size, the loader's, has none: a rib narrower than 0.7 m is not built)
      if (lvl > 1) { S.kind(PLATE, SMALL); for (let i = 0; i < 8; i++) { const th = i / 8 * Math.PI * 2; S.box(cx + Math.cos(th) * 0.31 * rt, r + Math.sin(th) * 0.31 * rt, out(0.30), 0.12, 0.12, 0.08, tone(FRAME, 0.6), 0, th, sd > 0 ? 'N' : 'S'); } } } }
  await ctx.yield();
  // the frame: a deep plate girder from axle to axle, flanged above and below, stiffened; the bogie's pin in its middle
  const fy0 = r - 0.9, fy1 = r + 0.95, span = a - rt - 0.1;
  S.kind(PLATE, SMALL); S.box(x0, (fy0 + fy1) / 2, z0, 2 * a, fy1 - fy0, 2 * zf, FRAME, 0, 0, 'EW');
  for (const sd of [1, -1]) { const lvl = sd > 0 ? south : north, zc = z0 + sd * zf, out = (d) => zc + sd * d, hide = sd > 0 ? 'N' : 'S';
    S.kind(PLATE, SMALL);
    for (const y of [fy0 + 0.35, fy1 - 0.35]) S.box(x0, y, out(0.05), 2 * span, 0.7, 0.1, tone(FRAME, 1.08), 0, 0, hide);   // (the flange straps, each 0.7 m broad: 0.45 m of web between them)
    const ns = Math.max(2, Math.round(span / 0.85)); for (let i = 0; i < ns; i++) { const x = x0 + (i + 0.5 - ns / 2) * (2 * span / ns); if (Math.abs(x - x0) > 1.1) S.box(x, (fy0 + fy1) / 2, out(0.07), 0.7, fy1 - fy0 - 0.1, 0.14, FRAME, 0, 0, hide); }   // (the stiffeners: posts 0.7 m broad over web and flanges alike, 0.04 m proud of the flanges and 0.06 m behind the rollers' faces)
    S.cyl([x0, r, zc], [x0, r, out(0.40)], 0.36 * r, 16, tone(FRAME, 0.8), tone(FRAME, 0.8), 0.34 * r, 2);
    S.cyl([x0, r, out(0.40)], [x0, r, out(0.54)], 0.19 * r, 12, tone(FRAME, 1.3), tone(FRAME, 1.3), 0.19 * r, 2);
    if (lvl > 1) for (let i = 0; i < 8; i++) { const th = (i + 0.5) / 8 * Math.PI * 2; S.box(x0 + Math.cos(th) * 0.28 * r, r + Math.sin(th) * 0.28 * r, out(0.43), 0.13, 0.13, 0.08, tone(FRAME, 0.55), 0, th, hide); }
    // the rollers: the chain runs under the lower ones and hangs on the upper ones
    const rr = 0.24 * r, ru = 0.17 * r, nl = Math.max(3, Math.round(2 * (span - rr) / (2.35 * rr)) + 1), sides = lvl > 0 ? 14 : 10;
    S.kind(IRON, 1);
    for (let i = 0; i < nl; i++) { const x = x0 + (i / (nl - 1) - 0.5) * 2 * (span - rr - 0.1), y = r - rs + TH + LINK + rr;
      S.cyl([x, y, zc], [x, y, out(0.2)], rr, sides, tone(IRONC, 1.3), tone(IRONC, 1.05), rr, 2);
      if (lvl > 0) S.cyl([x, y, out(0.2)], [x, y, out(0.29)], 0.4 * rr, 8, tone(FRAME, 1.1), tone(FRAME, 1.1), 0.4 * rr, 2); }
    for (let i = 0; i < 3; i++) { const x = x0 + (i - 1) * 0.62 * span, y = r + rs - TH - LINK - ru;
      S.cyl([x, y, zc], [x, y, out(0.2)], ru, sides, tone(IRONC, 1.3), tone(IRONC, 1.05), ru, 2);
      if (lvl > 0) S.cyl([x, y, out(0.2)], [x, y, out(0.28)], 0.45 * ru, 8, tone(FRAME, 1.1), tone(FRAME, 1.1), 0.45 * ru, 2); }
  }
  await ctx.yield();
  return r;
}

// ---------- the machine's figures (metres; its turning axis stands at x 0, z ZC) ----------
const TRACKS = [[12, ZC + 14], [12, ZC + 19], [12, ZC - 14], [12, ZC - 19], [-24, ZC - 2.6], [-24, ZC + 2.6]];   // x, z (every track is built whole on both flanks, whoever may see it)
const STANDS = [[12, ZC + 16.5, 2.5], [12, ZC - 16.5, 2.5], [-24, ZC, 2.6]];      // the three points the machine stands on: the middle of each pair of tracks, half the pair's spacing
const RINGG = { r: 17, y0: 7.2, y1: 10.4 }, TURN = { r: 9, y1: 12.5 }, SLEW = [0.87, Math.PI - 0.87];   // the ring girder; the turning ring on it; where its two slewing drives stand (angles about the axis)
const DECK = { x0: -22, x1: 14, y0: 12.5, y1: 15, hz: 9 }, HOUSE = { x0: -15.5, x1: -1, y1: 25.6, hz: 4.6 };   // (the house stops 6.5 m short of the deck's aft edge: there, behind it, the counterweight's boom is hinged)
const FORE = { foot: [2, 15], head: [10, 84], w: 3.2, fz: 6.6 }, AFT = { foot: [-10, 15], head: [-18, 65], w: 2.6, fz: 7 };   // the masts' legs: (x, y) of foot and head; they stand ZC ± fz at the foot, ± 2.5 at the head (fz so that each leg's foot, which stands askew in plan, and its block stand on the deck inside the parapet: the legs' outermost corners 8.75 and 8.76 m from the middle line, the deck's side at 9)
const legZ = (M, k) => M.fz - (M.fz - 2.5) * k;               // a leg's distance from the middle line, k of the way up it
const STAYZ = 2.9, STAY = { w: 1.4, h: 2.4 };                 // the stays go in pairs at ZC ± STAYZ, each a boxed girder w wide and h deep
const STAYS = [[[FORE.head[0], FORE.head[1] + 1.5], [58, boomTop(58) + 0.3]], [[AFT.head[0], AFT.head[1] + 1.5], [-51, 38.4]], [[FORE.head[0], FORE.head[1] + 1.5], [AFT.head[0], AFT.head[1] + 1.5]]];   // (x, y) from and to
const CWPIN = [-19.2, 22.2];                                  // the counterweight boom's hinge pin, between two cheeks that stand on the deck behind the house
const CW = { a: [-18.36, 21.87], b: [-53, 35.75], w: 7.2, h: 4.5, box:[[-57, 35.6], [-43, 35.6], [-43, 27.6], [-46, 24.4], [-54, 24.4], [-57, 27.6]], hz: 6 };   // the counterweight's boom (its middle line) and the ballast box's outline
const LOADER = { x: -86, hz: 3.2, L: 11, H: 2.8, W: 2.4 };
const STAIR = { xa: -9.2, xb: -2.96, zs: 15.0, zn: 13.3, w: 1.5, zr: 9.5, zc: 5.4, xc: 1.2, top0: -7.0, top1: -5.24 };   // the stair's tower stands from xa to xb, its two lanes along z zs and zn, each w wide, its gangway reaching in to zr; the fifth flight climbs west from xc along z zc and lands on the body's deck between top0 and top1

// A PLATE THAT STANDS PROUD OF A WALL (a pane, a flap, a lamp, a hood's dark mouth): its face, four corners P in order round
// it, and its four edges, each going `back` (a vector to the wall, 0.04 m or more: nothing here lies nearer over a wall than
// that, so that no two faces fight for one depth from afar). at: the frame the corners are given in (a vehicle's own; the
// world's when left out). face false: the edges alone (the caller builds the face in parts)
const HERE = (x, y, z) => [x, y, z];
function proud(S, P, back, col, at = HERE, face = true) {
  if (face) S.quad(at(...P[0]), at(...P[1]), at(...P[2]), at(...P[3]), col);
  for (let i = 0; i < 4; i++) { const p = P[i], q = P[(i + 1) % 4]; S.quad(at(...p), at(...q), at(q[0] + back[0], q[1] + back[1], q[2] + back[2]), at(p[0] + back[0], p[1] + back[1], p[2] + back[2]), col); }
}

// a box girder along the line a to b ((x, y) on the machine's middle plane), w wide and h deep, with a post standing proud
// at every joint on both sides (each stops 0.05 m short of the girder's top and bottom). Gives at(t, up): the place t of
// the way along it and `up` metres off its middle line. skip 'T': its back is not built (a trough lies along all of it)
function girder(S, a, b, w, h, col, skip = '') {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), sg = dx > 0 ? 1 : -1, ux = -dy / len * sg, uy = dx / len * sg;
  const at = (t, up = 0, z = ZC) => [a[0] + dx * t + ux * up, a[1] + dy * t + uy * up, z];
  S.kind(PLATE, GIRDER); S.beam(at(0), at(1), w, h, col, w, h, skip);
  S.kind(PLATE, SMALL);
  for (let s = len / 2 - 6 * Math.floor(len / 12); s < len - 1; s += 6) if (s > 1) for (const sd of [-1, 1]) S.beam(at(s / len, 0.05 - h / 2, ZC + sd * (w / 2 + 0.06)), at(s / len, h / 2 - 0.05, ZC + sd * (w / 2 + 0.06)), 0.14, 0.7, tone(col, 1.1));
  return { at, len };
}
// a belt in its trough on a girder's back, in place of the back's own plate: the rubber (it runs toward b at 4 m a second
// ALONG THE GIRDER'S SLOPE, as the works' earth rides it), a kerb 0.7 m broad on either side, 3.48 m over all. pan: where
// the girder is narrower than that (the spout's), the breadth of a floor plate laid along the whole of its back under the
// trough, so that the kerbs sit on steel and not in the air
function trough(S, gd, h, col, t0 = 0, t1 = 1, pan = 0) {
  const y = h / 2 + 0.03, a = gd.at(t0, y), b = gd.at(t1, y), sg = b[0] < a[0] ? 1 : -1, vx = 4 * Math.abs(b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);   // (vx: what 4 m a second along the slope comes to in x)
  S.kind(BELT, sg, vx); S.quad([a[0], a[1], ZC + 1.04], [b[0], b[1], ZC + 1.04], [b[0], b[1], ZC - 1.04], [a[0], a[1], ZC - 1.04], RUBBER);
  S.kind(PLATE, GIRDER); for (const sd of [-1, 1]) S.beam(gd.at(t0, h / 2 + 0.3, ZC + sd * 1.39), gd.at(t1, h / 2 + 0.3, ZC + sd * 1.39), 0.7, 0.72, tone(col, 0.9));
  if (pan) S.beam(gd.at(0, h / 2 - 0.19), gd.at(1 + 0.06 / gd.len, h / 2 - 0.19), pan, 0.3, tone(col, 0.8));   // (its top 0.04 m under the girder's back; it stands 0.06 m beyond the girder's head)
}

// THE BASE: on each pair of tracks a hanger on the bogie's pin and a saddle over both; on the saddle's ball the knee of an
// arm that runs in to the ring girder; the ring girder with its deck's parapet; on it the turning ring with its toothed
// band and two slewing drives
function buildBase(S, OIL) {
  const { r: R, y0, y1 } = RINGG, PAR = tone(BODYC, 1.3);
  for (const [x, z, hw] of STANDS) {
    S.kind(PLATE, SMALL); S.box(x, 3.3, z, 3.0, 3.4, 2 * (hw - 1.5) - 0.3, BODYC);
    S.kind(PLATE, GIRDER); S.box(x, 5.95, z, 7.4, 2.1, 2 * hw + 3.4, BODYC, 0, 0, 'EW');     // (its two ends are the end plates' outer faces: not built twice)
    S.kind(PLATE, SMALL);
    for (const e of [-1, 1]) S.box(x + e * 3.35, 5.95, z, 0.7, 2.5, 2 * hw + 3.8, tone(BODYC, 1.12));
    S.cyl([x, 7.0, z], [x, 7.45, z], 1.9, 16, tone(BODYC, 0.7));
    S.kind(PLATE, WORLD); S.cyl([x, 7.4, z], [x, y1 - 0.2, z], 3.1, 20, BODYC);
    const d = Math.hypot(x, z - ZC), ux = x / d, uz = (z - ZC) / d;
    S.kind(PLATE, GIRDER); S.beam([ux * 8, 8.8, ZC + uz * 8], [x, 8.8, z], 5.2, 2.6, BODYC, 5.2, 2.6, 'EW');   // (2.6 deep: its top and bottom lie 0.1 m inside the knee's caps, not in their planes)
    if (z > ZC + 1) {                                         // the south saddle, where the lens goes by: a plated walk along its face over the track, a door into it
      // THE WAY UP: a closed flight from the ground at the track's east end, west up to the walk's east end, in the walk's
      // own lane (no nearer the lens than the walk); the walk's parapet stands open before the door, its two gate plates
      // swung in across the walk, so that the lens, going by at the walk's own level, sees the door whole from its sill
      const zf = z + hw + 1.7, zw = zf + 0.6, xd = x + 0.85, g0 = xd - 1.55, g1 = xd + 0.6, TREAD = tone(BODYC, 0.7), n = 25, run = n * 0.28;
      S.kind(PLATE, SMALL);
      S.box(x, 4.9, zw, 8.0, 0.2, 1.2, tone(BODYC, 0.8));
      S.kind(PLATE, PARAPET);                                 // (the walk's parapets and its gate take the stair's drawing: ribs, rail, a dark strip at the foot)
      for (const [a, b] of [[x - 4, g0], [g1, x + 4]]) S.box((a + b) / 2, 5.55, zf + 1.16, b - a, 1.1, 0.08, PAR);
      S.box(x - 3.96, 5.55, zw, 0.08, 1.1, 1.2, PAR);
      for (const xg of [g0 + 0.04, g1 - 0.04]) S.box(xg, 5.5, zf + 0.68, 0.08, 1.0, 0.92, tone(PAR, 1.15));                       // the gate's two plates, open
      S.kind(PLATE, SMALL);
      S.box(xd, 6.0, zf + 0.03, 1.2, 2.0, 0.06, [0.085, 0.10, 0.115], 0, 0, 'N'); S.box(xd, 5.94, zf + 0.08, 0.9, 1.88, 0.08, tone(HOUSEC, 0.95), 0, 0, 'N');   // the door: a pale leaf in a dark frame,
      S.box(xd, 7.08, zf + 0.35, 1.6, 0.12, 0.7, PAR);                                                                              // a hood over it (a plate 1.6 m by 0.7 m),
      S.kind(PANE); proud(S, [[xd - 0.2, 6.2, zf + 0.16], [xd + 0.2, 6.2, zf + 0.16], [xd + 0.2, 6.62, zf + 0.16], [xd - 0.2, 6.62, zf + 0.16]], [0, 0, -0.04], GLASS);   // a small dark pane in it, in its seal
      flight(S, x + 4.02 + run, 0, zw, -1, n * 0.2, 1.2, TREAD, PAR);
      S.box(x + 4 + 0.5 * run, 1.05, zw, 0.7, 2.1, 0.7, BODYC); }                                                                   // the flight's post
  }
  S.kind(PLATE, WORLD); S.cyl([0, y0, ZC], [0, y1, ZC], R, 40, BODYC);
  S.kind(PLATE, SMALL);
  const gap = Math.atan2(STAIR.zr + 0.2 - ZC, STAIR.xa + 0.65);                   // where the stair's gangway meets the rim
  for (let i = 0; i < 40; i++) { const th = (i + 0.5) / 40 * Math.PI * 2, ap = R * Math.cos(Math.PI / 40), len = 2 * R * Math.sin(Math.PI / 40), ry = Math.atan2(-Math.cos(th), -Math.sin(th)), c = Math.cos(th), s = Math.sin(th);
    for (const y of [y0 + 0.35, y1 - 0.35]) S.box(c * (ap + 0.06), y, ZC + s * (ap + 0.06), len, 0.7, 0.12, tone(BODYC, 1.1), ry);                       // its flanges, each a strap 0.7 m broad
    const tv = i / 40 * Math.PI * 2; S.box(Math.cos(tv) * (R + 0.02), (y0 + y1) / 2, ZC + Math.sin(tv) * (R + 0.02), 0.7, y1 - y0 - 1.38, 0.2, BODYC, Math.atan2(-Math.cos(tv), -Math.sin(tv)));   // a stiffener at every joint, 0.7 m broad, between the flanges
    if (Math.abs(th - gap) > 0.07) S.box(c * (ap - 0.06), y1 + 0.55, ZC + s * (ap - 0.06), len, 1.1, 0.08, PAR, ry); }
  S.cyl([0, y1, ZC], [0, TURN.y1, ZC], TURN.r, 36, tone(BODYC, 0.6));
  S.cyl([0, 11.85, ZC], [0, 12.2, ZC], TURN.r + 0.42, 36, tone(BODYC, 0.8));
  S.kind(TEETH, 1.1); S.cyl([0, 10.7, ZC], [0, 11.85, ZC], TURN.r + 0.24, 36, tone(IRONC, 1.2), IRONC, TURN.r + 0.24, 0);
  for (const th of SLEW) { const c = Math.cos(th), s = Math.sin(th);
    S.kind(PLATE, SMALL); S.box(c * 10.9, y1 + 1.0, ZC + s * 10.9, 2.5, 2.0, 2.2, tone(BOOMC, 1.1), -th);
    S.cyl([c * 12.1, y1 + 1.0, ZC + s * 12.1], [c * 13.7, y1 + 1.0, ZC + s * 13.7], 0.62, 10, tone(BOOMC, 0.8));
    OIL.push([c * 12.2, y1 + 0.4, ZC + s * 12.2, 3.6, 2], [c * 16.95, y1 + 0.2, ZC + s * 16.95, 2.4, 3.6]); }
}

// THE BODY: the deck with its plate parapets; the machine house (plain doors 2 m tall, a roller door, louvre panels set in
// under their heads, a roof slab); the two cheeks the boom's root hangs between, on its hinge pin; the belt's way into the
// house (a hood over the foot of the boom's belt, a closed duct) and out of it (a hood at the deck's aft edge, where the
// discharge bridge's belt comes out)
function buildBody(S, OIL) {
  const { x0, x1, y0, y1, hz } = DECK, PAR = tone(BODYC, 1.3), zs = ZC + hz, zn = ZC - hz;
  S.kind(PLATE, WORLD); S.box((x0 + x1) / 2, (y0 + y1) / 2, ZC, x1 - x0, y1 - y0, 2 * hz, BODYC);
  S.kind(PLATE, SMALL);
  const pz = (xa, xb, z) => S.box((xa + xb) / 2, y1 + 0.55, z, xb - xa, 1.1, 0.08, PAR), px = (x, za, zb) => S.box(x, y1 + 0.55, (za + zb) / 2, 0.08, 1.1, zb - za, PAR);
  pz(x0, STAIR.top0, zs - 0.04); pz(STAIR.top1, x1, zs - 0.04); pz(x0, x1, zn + 0.04); px(x1 - 0.04, zn, zs); px(x0 + 0.04, zn, ZC - 2.5); px(x0 + 0.04, ZC + 2.5, zs);
  for (const sd of [-1, 1]) { const z = ZC + sd * (hz + 0.06);                                           // the deck girder's flanges and stiffeners, along both sides
    for (const y of [y0 + 0.35, y1 - 0.35]) S.box((x0 + x1) / 2, y, z, x1 - x0, 0.7, 0.12, tone(BODYC, 1.1));   // (each flange a strap 0.7 m broad; the stiffeners, 0.7 m broad too, stand between them)
    for (let x = x0 + 1.5; x < x1; x += 3) S.box(x, (y0 + y1) / 2, z - sd * 0.01, 0.7, y1 - y0 - 1.4, 0.14, BODYC); }
  const H = HOUSE, xm = (H.x0 + H.x1) / 2, DOORC = [0.085, 0.10, 0.115], SLAT = [0.17, 0.18, 0.18];
  S.kind(PLATE, WORLD); S.box(xm, (y1 + H.y1) / 2, ZC, H.x1 - H.x0, H.y1 - y1, 2 * H.hz, HOUSEC, 0, 0, 'B');
  S.kind(PLATE, SMALL); S.box(xm, H.y1 + 0.25, ZC, H.x1 - H.x0 + 1.0, 0.5, 2 * H.hz + 0.2, tone(BODYC, 0.9));
  for (const sd of [1, -1]) { const zw = ZC + sd * H.hz, hide = sd > 0 ? 'N' : 'S';
    S.kind(PLATE, SMALL);
    for (const x of [-14.3, -1.9]) { S.box(x, y1 + 1.0, zw + sd * 0.04, 1.0, 2.0, 0.08, DOORC, 0, 0, hide); S.box(x, y1 + 2.2, zw + sd * 0.35, 1.6, 0.14, 0.7, tone(HOUSEC, 0.8)); }
    S.kind(LOUVRE, 0.14); S.box(-5.2, y1 + 2.3, zw + sd * 0.05, 4.2, 4.6, 0.1, [0.20, 0.21, 0.21], 0, 0, hide);
    S.kind(LOUVRE, 0.22); for (const x of [-13.4, -9.8, -6.2, -2.8]) S.box(x, y1 + 7.6, zw + sd * 0.04, 3.0, 1.8, 0.08, SLAT, 0, 0, hide);
  }
  for (const sd of [-1, 1]) { const xw = sd > 0 ? H.x1 : H.x0, hide = sd > 0 ? 'W' : 'E';
    S.kind(PLATE, SMALL); S.box(xw + sd * 0.04, y1 + 1.0, ZC + 3.2, 0.08, 2.0, 1.0, DOORC, 0, 0, hide);
    S.kind(LOUVRE, 0.22); S.box(xw + sd * 0.04, y1 + 5.4, ZC, 0.08, 2.0, 5.0, SLAT, 0, 0, hide); }
  S.kind(PLATE, SMALL); for (const z of [ZC - 2.4, ZC + 2.4]) S.box(-4, H.y1 + 1.1, z, 2.2, 1.2, 2.0, tone(HOUSEC, 0.85));   // two vents on the roof
  // the boom's root between two cheeks (the boom's sides stand at z -8.25 and -1.75), its hinge pin through both
  S.kind(PLATE, WORLD);
  for (const z of [-9.0, -1.0]) S.prism([[3.6, y1], [12.4, y1], [10.2, 25.5], [5.8, 25.5]], z - 0.7, z + 0.7, (u, v, w) => [u, v, w], BOOMC);
  S.kind(PLATE, SMALL); S.cyl([8, 21, -10.3], [8, 21, 0.3], 0.95, 14, tone(BOOMC, 0.7));
  for (const sd of [-1, 1]) S.cyl([8, 21, ZC + sd * 4.7], [8, 21, ZC + sd * 5.05], 1.9, 16, tone(BOOMC, 1.15), tone(BOOMC, 1.15), 1.8, 2);
  OIL.push([8, 20.6, 0.1, 2.2, 5.5]);
  // the belt's way in and out
  S.box(8.0, 26.5, ZC, 7.0, 3.8, 5.4, HOUSEC); S.box(1.8, 25.6, ZC, 5.6, 3.6, 4.4, HOUSEC);
  proud(S, [[11.55, 25.2, ZC - 2.2], [11.55, 25.2, ZC + 2.2], [11.55, 28.1, ZC + 2.2], [11.55, 28.1, ZC - 2.2]], [-0.05, 0, 0], HOLLOW);   // the hood's dark mouth, where the boom's belt and its earth run in (its head at 28.1, 0.3 m under the hood's roof: the belt's top stands at 25.47 there, its heaped bed 1.25 m over that, the bed's swell 0.13 m at its most so near the belt's foot, and the greatest clod that can be dealt, 0.62 m, seated on the bed's crown at its whole size, reaches 1.18 m over the bed: 28.03 at the most, 0.07 m under the head; as built the highest corner passes at 27.64: shots/the-digging-wheel/round3b/steel/mouths.mjs)
  S.box(x0 + 0.35, y1 + 0.8, ZC, 1.3, 2.4, 4.8, HOUSEC);
  proud(S, [[x0 - 0.35, y1 - 0.35, ZC - 1.8], [x0 - 0.35, y1 - 0.35, ZC + 1.8], [x0 - 0.35, y1 + 1.85, ZC + 1.8], [x0 - 0.35, y1 + 1.85, ZC - 1.8]], [0.05, 0, 0], HOLLOW);   // (as broad as the trough that comes out of it, and 0.06 m more on either side; its head 0.06 m over the greatest clod that can be dealt onto the bridge's bed, which reaches 16.79 here: as built the highest passes at 16.13)
}

// a flight of closed treads between plated parapets: from its foot it climbs `rise` going along x (dir +1 or -1). Each
// tread is a closed step 0.2 m high, 0.28 m deep; the steps show under the parapets as a saw's edge. Gives the head's (x, y)
function flight(S, x, y, z, dir, rise, w, col, par) {
  const n = Math.round(rise / 0.2), h = rise / n, g = 0.28, run = n * g, sl = Math.hypot(run, rise);
  S.kind(PLATE, SMALL);
  for (let k = 0; k < n; k++) S.box(x + dir * (k + 0.5) * g, y + (k + 1) * h - 0.17, z, g + 0.04, 0.34, w, col);
  S.kind(PLATE, PARAPET);                                     // (its two sides take the stair's own drawing: upright ribs, the rail, the stringer)
  for (const sd of [-1, 1]) S.beam([x, y + h + 0.55, z + sd * (w / 2 - 0.04)], [x + dir * run, y + rise + h + 0.55, z + sd * (w / 2 - 0.04)], 0.08, 1.1 * run / sl, par);
  S.kind(PLATE, SMALL);
  return [x + dir * run, y + rise];
}
// THE STAIR on the south side: a tower of four flights going to and fro between landings, from the ground to a gangway
// onto the ring girder's deck, four posts at its corners; and a fifth flight from that deck up to the body's
function buildStair(S) {
  const { xa, xb, zs, zn, w } = STAIR, TREAD = tone(BODYC, 0.7), PAR = tone(BODYC, 1.3), y1 = RINGG.y1, L = 1.3, z0 = zn - w / 2, z1 = zs + w / 2;   // (PAR: the paint of the body's own parapets, as on the ring's deck over it and on the saddle's stair)
  const slab = (x0, x1, za, zb, y) => S.box((x0 + x1) / 2, y - 0.125, (za + zb) / 2, x1 - x0, 0.25, zb - za, TREAD);
  const pz = (x0, x1, zz, y) => { S.kind(PLATE, PARAPET); S.box((x0 + x1) / 2, y + 0.55, zz, x1 - x0, 1.1, 0.08, PAR); S.kind(PLATE, SMALL); }, px = (xx, za, zb, y) => { S.kind(PLATE, PARAPET); S.box(xx, y + 0.55, (za + zb) / 2, 0.08, 1.1, zb - za, PAR); S.kind(PLATE, SMALL); };
  const rise = y1 / 4;
  for (let i = 0; i < 4; i++) { const east = i % 2 === 0, y = (i + 1) * rise;       // flights 1 and 3 climb east in the south lane, 2 and 4 west in the north lane
    flight(S, east ? xa + L : xb - L, i * rise, east ? zs : zn, east ? 1 : -1, rise, w, TREAD, PAR);
    if (i < 3) { const x0 = east ? xb - L : xa, x1 = east ? xb : xa + L; slab(x0, x1, z0, z1, y); px(east ? xb - 0.04 : xa + 0.04, z0, z1, y); pz(x0, x1, z0 + 0.04, y); pz(x0, x1, z1 - 0.04, y); } }
  const yg = y1 + 0.04;                                       // the gangway onto the ring's deck: its plate laps 0.04 m over the deck's
  slab(xa, xa + L, STAIR.zr, z1, yg); px(xa + 0.04, STAIR.zr + 0.3, z1, yg); px(xa + L - 0.04, STAIR.zr + 0.3, z0, yg); px(xa + L - 0.04, zn + w / 2 + 0.1, z1, yg); pz(xa, xa + L, z1 - 0.04, yg);
  for (const x of [xa - 0.39, xb + 0.39]) for (const z of [z0 + 0.35, z1 - 0.35]) S.box(x, (y1 + 1.1) / 2, z, 0.7, y1 + 1.1, 0.7, BOOMC);
  const [x, y] = flight(S, STAIR.xc, y1, STAIR.zc, -1, DECK.y1 - y1, 1.6, TREAD, PAR);
  slab(STAIR.top0, x, ZC + DECK.hz + 0.12, STAIR.zc + 0.8, y); pz(STAIR.top0, x, STAIR.zc + 0.76, y); px(STAIR.top0 + 0.04, ZC + DECK.hz, STAIR.zc + 0.8, y);
}

// THE MASTS: each a pair of boxed legs leaning together, tied across by boxes, its head closed with plate; on the head a
// sheave house (the sheaves' round cheeks standing out of it, a roof over it); a plated landing on the lower tie
function buildMasts(S, OIL) {
  for (const M of [FORE, AFT]) {
    const [xf, yf] = M.foot, [xt, yt] = M.head, at = (k, sd) => [xf + (xt - xf) * k, yf + (yt - yf) * k, ZC + sd * legZ(M, k)];
    for (const sd of [-1, 1]) { S.kind(PLATE, GIRDER); S.beam(at(0, sd), at(1, sd), M.w, M.w, BOOMC, M.w * 0.8, M.w * 0.8);
      S.kind(PLATE, SMALL); S.box(xf, yf + 0.5, ZC + sd * M.fz, M.w + 1.6, 1.0, 2 * (DECK.hz - 0.15 - M.fz), tone(BOOMC, 0.8));   // its foot block, on the deck: its outer face 0.07 m inside the parapet
      const dk = 0.4 / Math.hypot(xt - xf, yt - yf, M.fz - 2.5);   // the leg is built in lengths: a flanged joint stands proud round it between each two
      for (const k of [0.14, 0.39, 0.61]) { const w = M.w * (1 - 0.2 * k) + 0.44; S.beam(at(k - dk, sd), at(k + dk, sd), w, w, tone(BOOMC, 0.86)); } }
    S.kind(PLATE, GIRDER);
    for (const k of [0.28, 0.5]) S.beam(at(k, -1), at(k, 1), 1.6, 1.6, BOOMC);
    S.beam(at(0.68, 0), at(1, 0), 2 * legZ(M, 0.68), M.w * 0.7, tone(BOOMC, 0.92), 5, M.w * 0.56);
    S.kind(PLATE, SMALL);
    const t = at(0.28, 0), len = 2 * legZ(M, 0.28) - M.w;
    S.box(t[0], t[1] + 0.925, ZC, 3.4, 0.25, len, tone(BOOMC, 0.8)); for (const e of [-1, 1]) S.box(t[0] + e * 1.66, t[1] + 1.6, ZC, 0.08, 1.1, len, tone(BOOMC, 1.3));
    S.box(xt, yt + 1.4, ZC, 5.6, 3.8, 7.2, tone(BOOMC, 0.75)); S.box(xt, yt + 3.5, ZC, 6.6, 0.4, 8.4, tone(BOOMC, 1.05));
    S.kind(IRON, 1); S.cyl([xt, yt + 1.2, ZC - 4.0], [xt, yt + 1.2, ZC + 4.0], 2.3, 20, tone(IRONC, 1.3), tone(IRONC, 1.1));
    S.kind(PLATE, SMALL); for (const sd of [-1, 1]) S.cyl([xt, yt + 1.2, ZC + sd * 4.0], [xt, yt + 1.2, ZC + sd * 4.35], 0.8, 12, tone(BOOMC, 1.2), tone(BOOMC, 1.2), 0.7, 2);
    OIL.push([xt, yt - 1.2, ZC + 2.6, 2.6, 10], [xt, yt - 1.2, ZC - 2.6, 2.6, 10]);
  }
}

// THE STAYS: boxed girders in pairs, tied across twice, each on an anchor block: from the fore mast's head down to the
// wheel's boom, from the aft mast's head down to the counterweight, and from head to head
function buildStays(S) {
  const col = tone(BOOMC, 0.78);
  for (const [p, q] of STAYS) {
    for (const sd of [-1, 1]) { const z = ZC + sd * STAYZ; S.kind(PLATE, GIRDER); S.beam([p[0], p[1], z], [q[0], q[1], z], STAY.w, STAY.h, col);
      S.kind(PLATE, SMALL); S.box(q[0], q[1] - 0.2, z, 3.4, 1.8, STAY.w + 0.3, tone(BOOMC, 0.7)); }
    S.kind(PLATE, GIRDER);
    for (const k of [0.34, 0.66]) { const x = p[0] + (q[0] - p[0]) * k, y = p[1] + (q[1] - p[1]) * k; S.beam([x, y, ZC - STAYZ], [x, y, ZC + STAYZ], 2.4, 1.0, col); }
  }
}

// THE COUNTERWEIGHT: its boom, a closed box girder hinged between two cheeks on the deck behind the house and going up
// over the ballast, plate parapets along its back; the ballast box hung under its end in four broad hangers, banded
function buildCounterweight(S, OIL) {
  const gd = girder(S, CW.a, CW.b, CW.w, CW.h, BOOMC), BAL = [0.34, 0.34, 0.325];
  // its root: two cheeks that stand on the body's deck behind the house (each on its sole plate), the boom's end between
  // them on its hinge pin, a boss on either cheek's outer face. Nothing of the boom goes through the house.
  const [px, py] = CWPIN, zc = CW.w / 2 + 0.76;                 // (the cheeks' middles: each 1.28 m thick, 0.12 m clear of the boom's side)
  S.kind(PLATE, WORLD);
  for (const sd of [-1, 1]) S.prism([[-21.8, DECK.y1 + 0.4], [-16.5, DECK.y1 + 0.4], [-17.3, 24.8], [-21.1, 24.8]], ZC + sd * zc - 0.64, ZC + sd * zc + 0.64, (u, v, w) => [u, v, w], BOOMC);
  S.kind(PLATE, SMALL);
  for (const sd of [-1, 1]) { S.box(-19.075, DECK.y1 + 0.2, ZC + sd * zc, 5.55, 0.4, 2.0, tone(BOOMC, 0.8));
    S.cyl([px, py, ZC + sd * (zc + 0.64)], [px, py, ZC + sd * (zc + 0.99)], 1.7, 16, tone(BOOMC, 1.15), tone(BOOMC, 1.15), 1.6, 2); }
  S.cyl([px, py, ZC - zc - 1.25], [px, py, ZC + zc + 1.25], 0.85, 14, tone(BOOMC, 0.7));
  OIL.push([px, py - 0.4, ZC + zc + 0.7, 2.0, 5]);
  S.kind(PLATE, SMALL);
  for (const sd of [-1, 1]) S.beam(gd.at(0.3, CW.h / 2 + 0.55, ZC + sd * (CW.w / 2 - 0.05)), gd.at(1, CW.h / 2 + 0.55, ZC + sd * (CW.w / 2 - 0.05)), 0.08, 1.1, tone(BOOMC, 1.3));
  S.kind(PLATE, WORLD); S.prism(CW.box, ZC - CW.hz, ZC + CW.hz, (u, v, w) => [u, v, w], BAL);
  S.kind(PLATE, SMALL);
  for (const y of [29.3, 33.2]) S.box(-50, y, ZC, 14.3, 0.8, 2 * CW.hz + 0.3, tone(BAL, 0.85));
  for (const x of [-55, -45]) for (const sd of [-1, 1]) S.box(x, 33.2, ZC + sd * (CW.hz + 0.15), 1.3, 4.8, 0.3, BOOMC);
}

// THE DISCHARGE BRIDGE: a closed box girder from under the body's deck back to the loader, the belt in its trough on its
// back, a plated walk with its parapet along its south side
function buildBridge(S) {
  const gd = girder(S, BRIDGE.from, BRIDGE.to, BRIDGE.w, BRIDGE.h, BOOMC, 'T'), h = BRIDGE.h, zw = ZC + BRIDGE.w / 2;
  trough(S, gd, h, BOOMC);
  S.kind(PLATE, SMALL);
  S.beam(gd.at(0.115, h / 2 - 0.1, zw + 0.65), gd.at(0.93, h / 2 - 0.1, zw + 0.65), 1.3, 0.2, tone(BOOMC, 0.8));
  S.beam(gd.at(0.115, h / 2 + 0.55, zw + 1.26), gd.at(0.93, h / 2 + 0.55, zw + 1.26), 0.08, 1.1, tone(BOOMC, 1.3));
  for (let i = 0; i < 9; i++) { const t = 0.13 + i * 0.098; S.beam(gd.at(t, h / 2 - 0.55, zw), gd.at(t, h / 2 - 0.55, zw + 1.25), 0.7, 0.7, BOOMC); }   // the walk's brackets
}

// THE LOADER on its own two tracks: a turntable and platform with its parapet, a small house under the bridge's end, the
// hood where the bridge's belt gives over to the spout's, the spout out over the heap held by two boxed stays from a mast
// of two boxed legs, a ballast block behind
async function buildLoader(ctx, S, OIL) {
  const X = LOADER.x, PAR = tone(BODYC, 1.3);
  for (const sd of [-1, 1]) await buildTrack(ctx, S, X, ZC + sd * LOADER.hz, LOADER.L, LOADER.H, LOADER.W, 2, 2);
  S.kind(PLATE, SMALL); S.box(X, 1.5, ZC, 2.6, 1.5, 2 * LOADER.hz, BODYC);
  S.cyl([X, 2.2, ZC], [X, 3.7, ZC], 1.9, 16, tone(BODYC, 0.75));
  S.kind(PLATE, WORLD); S.box(X + 0.5, 4.15, ZC, 12, 0.9, 8, BODYC);
  S.kind(PLATE, SMALL);
  for (const sd of [-1, 1]) { S.box(X + 0.5, 5.15, ZC + sd * 3.96, 12, 1.1, 0.08, PAR); S.box(X + 0.5 + sd * 5.96, 5.15, ZC, 0.08, 1.1, 8, PAR); }
  S.kind(PLATE, WORLD); S.box(X + 2.6, 6.5, ZC, 4.2, 3.8, 5.2, HOUSEC, 0, 0, 'B');
  S.kind(PLATE, SMALL); S.box(X + 2.6, 8.55, ZC, 4.8, 0.3, 5.8, tone(BODYC, 0.9));
  S.box(X + 1.6, 5.6, ZC + 2.64, 1.0, 2.0, 0.08, [0.085, 0.10, 0.115], 0, 0, 'N');
  S.kind(LOUVRE, 0.22); S.box(X + 3.5, 6.9, ZC + 2.64, 1.8, 1.4, 0.08, [0.17, 0.18, 0.18], 0, 0, 'N');
  S.kind(PLATE, SMALL); S.box(X + 5.3, 6.0, ZC, 2.2, 2.8, 7.0, [0.34, 0.34, 0.325]);                    // its ballast
  for (const sd of [-1, 1]) S.box(X - 1.0, 6.8, ZC + sd * 1.9, 1.6, 4.4, 0.9, BOOMC);                    // the posts that carry the hood
  S.box(X + 0.2, 11.5, ZC, 5.6, 5.8, 4.8, HOUSEC);                                                       // the hood where belt gives over to belt
  proud(S, [[X + 3.05, 12.0, ZC - 1.8], [X + 3.05, 12.0, ZC + 1.8], [X + 3.05, 14.25, ZC + 1.8], [X + 3.05, 14.25, ZC - 1.8]], [-0.05, 0, 0], HOLLOW);   // (the two mouths' heads stand over the greatest clod that can be dealt onto each belt's bed: 14.19 on the bridge's here, 14.14 on the spout's at the west mouth, whose head is at 14.2; as built the highest pass at 13.53 and 13.39)
  const gd = girder(S, SPOUT.from, SPOUT.to, SPOUT.w, SPOUT.h, BOOMC, 'T'); trough(S, gd, SPOUT.h, BOOMC, 0.14, 0.995, 3.6);   // (the spout is 2.6 m broad, its trough 3.48: a floor plate 3.6 m broad carries the kerbs)
  S.kind(PLATE, SMALL); proud(S, [[X - 2.65, 11.9, ZC - 1.8], [X - 2.65, 11.9, ZC + 1.8], [X - 2.65, 14.2, ZC + 1.8], [X - 2.65, 14.2, ZC - 1.8]], [0.05, 0, 0], HOLLOW);
  const head = [X - 4.5, 23.5], hold = gd.at(0.72, SPOUT.h / 2 + 0.2), ZS = 2.9;
  for (const sd of [-1, 1]) { S.kind(PLATE, GIRDER);
    S.beam([X - 3.6, 4.6, ZC + sd * 3.4], [head[0], head[1], ZC + sd * ZS], 1.6, 1.6, BOOMC, 1.3, 1.3);
    S.beam([head[0], head[1], ZC + sd * ZS], [hold[0], hold[1], ZC + sd * 1.85], 1.0, 1.9, tone(BOOMC, 0.78));
    S.beam([head[0], head[1], ZC + sd * ZS], [X + 5.3, 7.4, ZC + sd * ZS], 1.0, 1.9, tone(BOOMC, 0.78));
    S.kind(PLATE, SMALL); S.box(hold[0], hold[1] - 0.5, ZC + sd * 1.85, 2.2, 1.2, 1.1, tone(BOOMC, 0.7)); }
  S.kind(PLATE, SMALL); S.box(head[0], head[1], ZC, 2.4, 2.4, 2 * ZS + 1.3, tone(BOOMC, 0.75));
  OIL.push([X - 2.7, 10.4, ZC + 1.3, 2.0, 5], [X + 3.0, 9.0, ZC + 2.0, 1.6, 4]);
}

export async function buildMachine(ctx, uniforms) {
  const G = new Smith(204414), F = new Smith(4620), OIL = [];   // (room from the first for exactly the corners they come to hold, 204,414 and 4,620: no array is grown and copied on the way, nor cut when the mesh is made (the land file's fitted); one that comes to hold more grows as ever)
  // six tracks in three groups (two pairs under the fore body, one pair aft), each whole on both its flanks
  for (const [x, z] of TRACKS) await buildTrack(ctx, G, x, z, 17, 4.2, 3.0, 2, 2);
  buildBase(G, OIL); await ctx.yield();
  buildBody(G, OIL); buildStair(G); await ctx.yield();
  buildMasts(G, OIL); buildStays(G); await ctx.yield();
  buildCounterweight(G, OIL); buildBridge(G); await ctx.yield();
  await buildLoader(ctx, G, OIL); await ctx.yield();

  // the vehicles
  const PICKUP_Y = pickupY();
  buildCoach(F, COACH.x, COACH.z);
  buildPickup(F, PICKUP.x, PICKUP_Y, PICKUP.z, PICKUP_RY);

  // THE SUN'S SHADOW TABLES: the big masses as boxes (all the machine's 16) and the leaning ones as round bars (the
  // machine's 10), each INSIDE its steel, 0.1 m and more under every sunlit face (a corner that lies inside one is taken
  // as shaded). A pair of stays is one bar on the pair's middle line, between the two, where no steel is.
  addShadowBox(uniforms, [12, 2.1, ZC + 16.5], [7.0, 1.85, 3.5]);         // the fore tracks, south pair (the flanks' frames stand outside it, in the sun)
  addShadowBox(uniforms, [12, 2.1, ZC - 16.5], [7.0, 1.85, 3.5]);         // the fore tracks, north pair
  addShadowBox(uniforms, [-24, 2.1, ZC], [7.0, 1.85, 3.6]);               // the aft pair
  addShadowBox(uniforms, [12, 5.95, ZC + 16.5], [3.5, 0.9, 4.0]);         // the saddle over the south fore pair, where the lens goes by
  addShadowBox(uniforms, [0, 8.8, ZC], [11.8, 1.5, 11.8]);                // the ring girder: two squares inside its round
  addShadowBox(uniforms, [0, 8.8, ZC], [11.8, 1.5, 11.8], Math.PI / 4);
  addShadowBox(uniforms, [-4, 13.75, ZC], [17.8, 1.15, 8.8]);             // the body's deck
  addShadowBox(uniforms, [(HOUSE.x0 + HOUSE.x1) / 2, 20.5, ZC], [(HOUSE.x1 - HOUSE.x0) / 2 - 0.2, 5.4, HOUSE.hz - 0.2]);    // the machine house
  addShadowBox(uniforms, [8, 26.5, ZC], [3.3, 1.75, 2.5]);                // the hood over the boom's foot
  addShadowBox(uniforms, [-50, 31.3, ZC], [6.4, 4.1, CW.hz - 0.2]);       // the ballast box (above its sloped foot)
  addShadowBox(uniforms, [-31.5, 12.75, ZC], [17.4, 0.7, 1.5]);           // the bridge, in two level lengths
  addShadowBox(uniforms, [-66.5, 11.25, ZC], [17.4, 0.7, 1.5]);
  addShadowBox(uniforms, [LOADER.x + 0.5, 2.4, ZC], [5.0, 2.05, 3.6]);    // the loader: its tracks under its platform; its hood
  addShadowBox(uniforms, [LOADER.x + 0.2, 11.5, ZC], [2.6, 2.7, 2.2]);
  addShadowBox(uniforms, [COACH.x, 1.7, COACH.z], [5.75, 1.55, 1.15]);    // the coach, from 0.15 m over the floor: its shadow begins at its own foot (under its floor only its tyres and its belly lie in the box)
  addShadowBox(uniforms, [PICKUP.x, PICKUP_Y + 0.56, PICKUP.z], [2.45, 0.40, 0.82], PICKUP_RY);   // the pickup: its lower body from 0.16 m over the floor to 0.96 (0.12 m under the bonnet's top at the box's nose end; the bed's liner lies in it)
  for (const M of [FORE, AFT]) for (const sd of [-1, 1]) addShadowCap(uniforms, [M.foot[0], M.foot[1] + 0.5, ZC + sd * M.fz], [M.head[0], M.head[1], ZC + sd * 2.5], M.w * 0.42, M.w * 0.34);   // the masts' four legs
  for (const [p, q] of STAYS) { const k = 1 - 4 / Math.hypot(q[0] - p[0], q[1] - p[1]); addShadowCap(uniforms, [p[0], p[1], ZC], [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, ZC], 1.2); }
  addShadowCap(uniforms, [CW.a[0] - 2, CW.a[1] + 0.53, ZC], [CW.b[0] + 1, CW.b[1] - 0.27, ZC], 2.05);                        // the counterweight's boom
  addShadowCap(uniforms, [SPOUT.from[0] - 3, SPOUT.from[1] + 0.95, ZC], [SPOUT.to[0] + 1, SPOUT.to[1] - 0.32, ZC], 0.95);    // the loader's spout
  addShadowCap(uniforms, [FORE.head[0], FORE.head[1] + 1.3, ZC - 3.2], [FORE.head[0], FORE.head[1] + 1.3, ZC + 3.2], 1.6);   // the fore mast's sheave house
  await ctx.yield();
  const steel = G.mesh(uniforms, OIL); await ctx.yield();
  const paint = F.mesh(uniforms);
  return { steel, paint, triangles: G.triangles + F.triangles };
}

// a road wheel in its arch on a vehicle's flank: at(u, v, w) is the vehicle's frame (u along, v up, w across); the axle
// stands at u, the wheel's radius is r, the flank at hw and the arch's foot at v0
// (the arch's dark stands 0.04 m off the flank, the tyre's face 0.04 m off the arch, the hub's 0.04 m off the tyre)
function roadWheel(F, at, u, r, hw, v0, sd, arch = 1.3) {
  F.kind(PAINT, -99); const o = at(u, v0, sd * (hw + 0.04)), ra = r * arch;
  for (let i = 0; i < 8; i++) { const a0 = i / 8 * Math.PI, a1 = (i + 1) / 8 * Math.PI; F.fan(o, at(u + Math.cos(a0) * ra, v0 + Math.sin(a0) * ra, sd * (hw + 0.04)), at(u + Math.cos(a1) * ra, v0 + Math.sin(a1) * ra, sd * (hw + 0.04)), [0.018, 0.018, 0.02]); }
  F.kind(TYRE); F.cyl(at(u, r, sd * (hw - 0.3)), at(u, r, sd * (hw + 0.08)), r, 14, RUBBER, RUBBER, r, 2);
  F.kind(PAINT, -99); F.cyl(at(u, r, sd * (hw + 0.08)), at(u, r, sd * (hw + 0.12)), 0.55 * r, 10, [0.5, 0.5, 0.48], [0.5, 0.5, 0.48], 0.5 * r, 2);
}

// a coach, parked and empty, its nose to the east (toward the machine: the lens comes up behind it and passes its rear):
// 12 m long, white; walls that go over into the roof by a rounded edge, a raked windscreen, a rear window over the engine's
// lid, two rear lights as plain dark-red plates, a band of dark glass down each side in six panes with a pillar between
// each two, a dark rubbing strip under it, a glazed door by the nose on its right, lockers' flaps, six wheels in their
// arches, a grey air unit and two dark hatches on the roof, the pit's dust up its lower panels (kPaint); nothing lettered
export function buildCoach(F, x, z) {
  const W = C('#ECEAE3'), W2 = tone(W, 0.9), TRIM = [0.06, 0.062, 0.066], LAMP = [0.9, 0.86, 0.7], RED = [0.21, 0.016, 0.012], at = (u, v, w) => [x + u, v, z + w];   // u toward its nose (east), v up, w to its right (south)
  const hw = 1.275, y0 = 0.42, yb = 1.5, ys = 3.16, yr = 3.42, uf = 5.5;     // half its width, its floor, its waist at the nose, its shoulder, its roof, where the windscreen's head stands
  // its body: one section the whole length, the wall going over into the roof in three bent plates (the rounded roof edge)
  const SEC = [[hw, y0], [hw, 2.92], [hw - 0.07, ys], [hw - 0.26, 3.33], [hw - 0.6, yr], [0.6 - hw, yr], [0.26 - hw, 3.33], [0.07 - hw, ys], [-hw, 2.92], [-hw, y0]], put = (a, b, c) => at(c, b, a);
  F.kind(PAINT, 0);
  F.prism(SEC, -6, uf, put, W, W, false);
  for (const u of [-6, uf]) for (let i = 0; i < SEC.length; i++) { const a = SEC[i], b = SEC[(i + 1) % SEC.length]; F.fan(at(u, 1.9, 0), at(u, a[1], a[0]), at(u, b[1], b[0]), W); }   // its rear wall; the brow over the windscreen
  // its nose: a low bow under the raked windscreen, a pillar's foot on either side of the glass
  F.quad(at(6, y0, -hw), at(6, y0, hw), at(6, yb, hw), at(6, yb, -hw), W);
  for (const sd of [-1, 1]) { const w = sd * hw; F.quad(at(uf, y0, w), at(6, y0, w), at(6, yb, w), at(uf, yb, w), W); F.tri(at(uf, yb, w), at(6, yb, w), at(uf, ys, sd * (hw - 0.07)), W); }
  F.box(x - 6.05, 0.62, z, 0.12, 0.36, 2.6, TRIM); F.box(x + 6.05, 0.62, z, 0.12, 0.36, 2.6, TRIM);       // bumpers
  F.box(x - 1.4, yr + 0.14, z, 3.0, 0.28, 1.6, [0.40, 0.41, 0.41]);                                        // on the roof: the air unit (grey), two hatches (dark, each in a pale frame)
  for (const u of [2.6, -4.3]) { F.box(x + u, yr + 0.04, z, 1.0, 0.08, 1.0, W2); F.box(x + u, yr + 0.07, z, 0.76, 0.1, 0.76, [0.16, 0.17, 0.18]); }
  // what lies on its walls: each a plate standing 0.04 m proud, with its own edge (see proud)
  const rect = (u0, u1, v0, v1, w) => [[u0, v0, w], [u1, v0, w], [u1, v1, w], [u0, v1, w]], end = (u, w0, w1, v0, v1) => [[u, v0, w0], [u, v0, w1], [u, v1, w1], [u, v1, w0]];   // a plate's corners on a flank (at w) and on an end wall (at u)
  for (const sd of [-1, 1]) { proud(F, end(6.04, sd * 0.72, sd * 1.14, 0.84, 1.1), [-0.04, 0, 0], LAMP, at);
    proud(F, end(-6.04, sd * 0.92, sd * 1.2, 0.92, 1.8), [0.04, 0, 0], RED, at);                                                            // the rear lights: plain dark-red plates
    for (let i = 0; i < 3; i++) proud(F, rect(-2.1 + i * 1.5, -0.6 + i * 1.5, 0.5, 1.42, sd * (hw + 0.04)), [0, 0, -sd * 0.04], W2, at);    // the lockers' flaps between the axles
    proud(F, rect(-5.9, 4.3, 1.48, 1.61, sd * (hw + 0.04)), [0, 0, -sd * 0.04], TRIM, at); }                                                // a dark rubbing strip under the glass, from the tail to the door
  proud(F, end(-6.04, -0.86, 0.86, 0.84, 1.78), [0.04, 0, 0], W2, at);                                                                      // the engine's lid, its grille on it
  proud(F, rect(4.42, 5.42, 0.5, 2.98, hw + 0.04), [0, 0, -0.04], W2, at);                                                                  // the door's leaf (on its right, by the nose)
  F.kind(PANE);
  F.quad(at(6.0, yb, -hw), at(6.0, yb, hw), at(uf, ys, hw - 0.07), at(uf, ys, 0.07 - hw), GLASS);                                             // the windscreen
  proud(F, end(-6.04, -1.02, 1.02, 1.98, 2.9), [0.04, 0, 0], GLASS, at);                                                                    // the rear window
  for (const sd of [-1, 1]) { const w = sd * (hw + 0.04), back = [0, 0, -sd * 0.04];
    for (let i = 0; i < 6; i++) { const u0 = -5.5 + i * 1.62 + 0.11, u1 = u0 + 1.40; proud(F, rect(u0, u1, 1.72, 2.86, w), back, GLASS, at); }   // the long band: six panes, each in its own seal, a pillar of the wall 0.22 m broad between each two
    if (sd > 0) proud(F, rect(4.5, 5.34, 0.74, 2.86, w + 0.04), back, GLASS, at); else proud(F, rect(4.5, 5.34, 1.72, 2.86, w), back, GLASS, at); }   // the door's glass, on its leaf (south); the driver's pane (north)
  F.kind(LOUVRE, 0.1); proud(F, end(-6.08, -0.6, 0.6, 0.95, 1.34), [0.04, 0, 0], [0.12, 0.12, 0.125], at);                                  // the engine's grille
  for (const u of [3.3, -2.9, -4.25]) for (const sd of [-1, 1]) roadWheel(F, at, u, 0.52, hw, y0, sd, 1.5);
}

// a crew's pickup, parked and empty: 5.4 m long, 1.9 m wide, a dusty slate blue (no company's colours, nothing lettered);
// a bonnet, a cab with a raked windscreen and dark glass, a dark gap between cab and bed, an open bed with its headboard, a
// steel job box and a spare bucket tooth in it, dark bumpers and sills, plain lights, an amber lamp on the roof (unlit),
// four wheels in their arches; the pit's dust up its lower panels (kPaint). (x, y, z): the middle of its footprint on the
// ground; ry: its yaw (its nose looks along the turned +x)
export function buildPickup(F, x, y, z, ry) {
  const W = C('#4E7186'), TRIM = [0.05, 0.052, 0.056], LAMP = [0.9, 0.86, 0.7], RED = [0.42, 0.03, 0.02], BOXC = [0.50, 0.50, 0.47], c = Math.cos(ry), s = Math.sin(ry), hw = 0.95;
  const at = (u, v, w) => [x + c * u + s * w, y + v, z - s * u + c * w];          // u along it, v up, w across
  const box = (u, v, w, su, sv, sw, col) => { const p = at(u, v, w); F.box(p[0], p[1], p[2], su, sv, sw, col, ry); };
  F.kind(PAINT, y);
  F.prism([[1.25, 0.42], [2.7, 0.42], [2.7, 0.92], [2.5, 1.08], [1.25, 1.17]], -hw, hw, at, W);                              // the bonnet
  F.prism([[-0.62, 0.42], [1.25, 0.42], [1.25, 1.17], [0.78, 1.82], [-0.5, 1.82], [-0.62, 1.15]], -hw, hw, at, W);           // the cab
  box(-1.72, 0.6, 0, 1.96, 0.36, 1.9, W);                                                                                     // the bed (it begins 0.12 m behind the cab's back): its floor,
  for (const sd of [-1, 1]) box(-1.72, 0.97, sd * (hw - 0.04), 1.96, 0.42, 0.08, W);                                          // its sides,
  box(-2.66, 0.97, 0, 0.08, 0.42, 1.9, W);                                                                                    // its tailgate,
  box(-0.78, 1.03, 0, 0.08, 0.54, 1.9, tone(W, 0.8));                                                                         // its headboard, 0.12 m over its sides
  box(-0.68, 0.78, 0, 0.13, 0.66, 1.78, [0.022, 0.022, 0.024]);                                                               // the dark gap between cab and bed (a hollow set 0.06 m in from either flank)
  box(-1.42, 1.15, 0.1, 0.9, 0.6, 1.3, BOXC); box(-1.42, 1.47, 0.1, 0.96, 0.05, 1.36, tone(BOXC, 0.6));                       // in the bed: a steel job box and its lid,
  { F.kind(IRON, 1); const T = [0.46, 0.455, 0.44], a = at(-2.0, 0.86, -0.3), b = at(-2.0, 0.86, 0.26), cc = at(-2.02, 1.2, 0.26), d = at(-2.02, 1.2, -0.3), tip = at(-2.56, 0.9, -0.02);   // and a spare bucket tooth, lying point to the tail
    F.quad(a, b, cc, d, T); F.tri(a, b, tip, T); F.tri(b, cc, tip, T); F.tri(cc, d, tip, T); F.tri(d, a, tip, T); F.kind(PAINT, y); }
  // what lies on its walls: each a plate standing 0.04 m proud, with its own edge (see proud)
  proud(F, [[-2.61, 0.84, -0.86], [-0.83, 0.84, -0.86], [-0.83, 0.84, 0.86], [-2.61, 0.84, 0.86]], [0, -0.06, 0], [0.10, 0.10, 0.105], at);   // the bed's dark liner (0.06 m over the floor and 0.05 m over the rear tyres' tops; it stops 0.01 m short of the bed's walls all round)
  box(2.74, 0.58, 0, 0.1, 0.24, 1.94, TRIM); box(-2.74, 0.56, 0, 0.1, 0.2, 1.94, TRIM);                                       // bumpers
  for (const sd of [-1, 1]) box(0.08, 0.46, sd * (hw + 0.02), 2.0, 0.1, 0.12, TRIM);                                          // a dark sill under the doors, between the arches
  box(0.15, 1.89, 0, 0.26, 0.14, 0.3, [0.70, 0.33, 0.04]);                                                                    // an amber lamp on the roof (unlit: nothing here is timed)
  const end = (u, w0, w1, v0, v1) => [[u, v0, w0], [u, v0, w1], [u, v1, w1], [u, v1, w0]];
  proud(F, end(2.74, -0.5, 0.5, 0.74, 0.88), [-0.04, 0, 0], [0.03, 0.03, 0.033], at);                                        // the grille, over the bumper
  for (const sd of [-1, 1]) { proud(F, end(2.74, sd * 0.58, sd * 0.88, 0.74, 0.88), [-0.04, 0, 0], LAMP, at);
    proud(F, end(-2.74, sd * 0.78, sd * 0.92, 0.82, 1.12), [0.04, 0, 0], RED, at); }
  F.kind(PANE);
  proud(F, [[1.2560, 1.2333, -0.84], [1.2560, 1.2333, 0.84], [0.8420, 1.8053, 0.84], [0.8420, 1.8053, -0.84]], [-0.0340, -0.0246, 0], GLASS, at);   // the windscreen, 0.042 m off the cab's raked front
  proud(F, [[-0.6402, 1.2752, -0.7], [-0.6402, 1.2752, 0.7], [-0.5562, 1.7452, 0.7], [-0.5562, 1.7452, -0.7]], [0.0413, -0.0074, 0], GLASS, at);    // the rear pane, 0.042 m off the cab's back
  for (const sd of [-1, 1]) { const w = sd * (hw + 0.04); proud(F, [[-0.45, 1.22, w], [1.14, 1.22, w], [0.76, 1.75, w], [-0.45, 1.75, w]], [0, 0, -sd * 0.04], GLASS, at); }
  for (const u of [1.75, -1.6]) for (const sd of [-1, 1]) roadWheel(F, (a, b, d) => at(a, b, d), u, 0.4, hw, 0.42, sd);
}

// THE MACHINE'S MASSES as upright boxes that CONTAIN them, for the script that proves clear air about the lens's line: each
// { name, c: [x, y, z] its middle, h: [hx, hy, hz] its half sizes, yaw: its turn about y (radians, as the core's boxes) }.
// A leaning member (a mast, a stay, a boom) is a chain of such boxes along it.
// machineBodies() works the list; MACHINE_BODIES is that list, WORKED THE FIRST TIME IT IS READ (it asks the land for the
// pit floor's level under the pickup: nothing is worked when this file loads). Read it as any list: for-of, length, map, an index.
export function machineBodies() {
  const B = [], box = (name, c, h, yaw = 0) => B.push({ name, c, h, yaw }), PICKUP_Y = pickupY();
  // n boxes along the line a to b ((x, y) at the level z), each holding its length of a member hr thick about the line, hz half wide
  const chain = (name, a, b, z, hr, hz, n) => { for (let i = 0; i < n; i++) { const x0 = a[0] + (b[0] - a[0]) * i / n, x1 = a[0] + (b[0] - a[0]) * (i + 1) / n, y0 = a[1] + (b[1] - a[1]) * i / n, y1 = a[1] + (b[1] - a[1]) * (i + 1) / n;
    box(name, [(x0 + x1) / 2, (y0 + y1) / 2, z], [Math.abs(x1 - x0) / 2 + hr, Math.abs(y1 - y0) / 2 + hr, typeof hz === 'function' ? hz(i / n) : hz]); } };
  for (const [x, z] of TRACKS) box('track', [x, 2.1, z], [8.6, 2.2, 1.7]);
  for (const [x, z, hw] of STANDS) { const d = Math.hypot(x, z - ZC);
    box('saddle', [x, 5.5, z], [3.8, 2.0, hw + 2.0]); if (z > ZC + 1) { box('saddle walk', [x, 5.5, z + hw + 2.35], [4.1, 0.8, 0.7]); box('saddle door hood', [x + 0.85, 7.1, z + hw + 2.05], [0.9, 0.2, 0.45]); chain('saddle stair', [x + 4, 5.5], [x + 11.1, 0.5], z + hw + 2.3, 1.0, 0.7, 3); box('saddle stair', [x + 7.5, 1.05, z + hw + 2.3], [0.45, 1.1, 0.45]); } box('knee', [x, 8.9, z], [3.2, 1.6, 3.2]); box('arm', [x / 2, 8.8, ZC + (z - ZC) / 2], [d / 2, 1.5, 2.7], Math.atan2(-(z - ZC), x)); }
  for (const [x, z, hw] of STANDS) box('hanger', [x, 3.3, z], [1.55, 1.75, hw - 1.5]);                    // (between the two tracks of a pair, under the saddle)
  box('ring girder', [0, 9.35, ZC], [17.2, 2.2, 17.2]); box('turning ring', [0, 11.5, ZC], [9.5, 1.1, 9.5]);
  for (const th of SLEW) box('slewing drive', [Math.cos(th) * 11.7, RINGG.y1 + 1.0, ZC + Math.sin(th) * 11.7], [2.1, 1.05, 1.2], -th);
  box('deck', [DECK.x0 / 2 + DECK.x1 / 2 - 0.15, 14.3, ZC], [18.2, 1.85, DECK.hz + 0.15]);
  box('machine house', [-11, 21.2, ZC], [10.6, 6.3, HOUSE.hz + 0.2]); box('boom root', [5.7, 21.7, ZC], [6.8, 6.8, 5.35]);
  for (const sd of [-1, 1]) for (const x of [-14.3, -1.9]) box('house door hood', [x, DECK.y1 + 2.2, ZC + sd * (HOUSE.hz + 0.35)], [0.85, 0.12, 0.4]);
  box('stair', [(STAIR.xa + STAIR.xb) / 2, 5.75, 13.0], [(STAIR.xb - STAIR.xa) / 2 + 0.8, 5.95, 3.6]); box('stair', [-2.85, 13.3, 5.1], [4.2, 2.9, 1.15]);
  for (const M of [FORE, AFT]) { const hr = 0.69 * (M.w + 0.44) + 0.05;                                  // (a leg stands askew in plan: its section, and its joints', reach 0.69 of their breadth from its line)
    chain('mast', M.foot, M.head, ZC, hr, (k) => legZ(M, k) + hr, 6); box('sheave house', [M.head[0], M.head[1] + 1.4, ZC], [3.4, 2.6, 4.45]); }
  for (const [p, q] of STAYS) chain('stay', p, q, ZC, STAY.h / 2 + 0.5, STAYZ + STAY.w / 2 + 0.3, 8);
  chain('counterweight boom', CW.a, CW.b, ZC, CW.h / 2 + 1.3, CW.w / 2 + 0.2, 6); box('boom bracket', [-19.4, 20, ZC], [3.2, 5.2, 5.9]); box('ballast', [-50, 30, ZC], [7.3, 5.7, CW.hz + 0.4]);
  chain('bridge', BRIDGE.from, BRIDGE.to, ZC + 0.6, BRIDGE.h / 2 + 1.3, BRIDGE.w / 2 + 0.85, 4);
  for (const sd of [-1, 1]) box('loader track', [LOADER.x, 1.4, ZC + sd * LOADER.hz], [5.6, 1.5, 1.4]);
  box('loader turntable', [LOADER.x, 2.3, ZC], [2.0, 1.6, LOADER.hz + 0.1]);
  box('loader', [LOADER.x + 0.5, 6.2, ZC], [6.1, 2.6, 4.1]); box('loader hood', [LOADER.x + 0.2, 11.5, ZC], [2.9, 3.0, 2.5]);
  chain('loader mast', [LOADER.x - 3.6, 4.6], [LOADER.x - 4.5, 23.5], ZC, 1.2, 4.6, 3); box('loader mast head', [LOADER.x - 4.5, 23.5, ZC], [1.25, 1.25, 3.6]);
  const sl = Math.hypot(SPOUT.to[0] - SPOUT.from[0], SPOUT.to[1] - SPOUT.from[1]), hold = [SPOUT.from[0] + (SPOUT.to[0] - SPOUT.from[0]) * 0.72 + (SPOUT.to[1] - SPOUT.from[1]) / sl * (SPOUT.h / 2 + 0.2), SPOUT.from[1] + (SPOUT.to[1] - SPOUT.from[1]) * 0.72 - (SPOUT.to[0] - SPOUT.from[0]) / sl * (SPOUT.h / 2 + 0.2)];   // where the spout's stays hold it (as buildLoader works it)
  chain('loader stay', [LOADER.x - 4.5, 23.5], hold, ZC, 1.2, 3.6, 3); chain('loader stay', [LOADER.x - 4.5, 23.5], [LOADER.x + 5.3, 7.4], ZC, 1.2, 3.6, 3);
  box('spout stay block', [hold[0], hold[1] - 0.5, ZC], [1.15, 0.65, 2.45]);
  chain('spout', SPOUT.from, SPOUT.to, ZC, SPOUT.h / 2 + 0.9, 1.9, 4);                                    // (its trough's floor plate is 3.6 m broad)
  box('coach', [COACH.x, 1.85, COACH.z], [6.15, 1.85, 1.45]); box('pickup', [PICKUP.x, PICKUP_Y + 1.0, PICKUP.z], [2.85, 1.0, 1.1], PICKUP_RY);
  return B;
}
export const MACHINE_BODIES = (() => {
  const list = []; let made = false;
  const read = () => { if (!made) { const B = machineBodies(); for (const b of B) list.push(b); made = true; } return list; };   // (made only once the list is whole: a first read that throws leaves nothing half made, and the next read works it again)
  return new Proxy(list, { get: (t, k, r) => Reflect.get(read(), k, r), has: (t, k) => Reflect.has(read(), k), ownKeys: () => Reflect.ownKeys(read()), getOwnPropertyDescriptor: (t, k) => Reflect.getOwnPropertyDescriptor(read(), k) });
})();
