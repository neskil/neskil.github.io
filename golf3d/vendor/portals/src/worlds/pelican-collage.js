// THE TISSUE-PAPER PELICANS: the Danube delta in late May as a collage of torn, hand-painted tissue paper.
// On a paper kingfisher's nape we streak down a reed channel, plunge once through the water sheets into amber,
// burst out onto a lagoon where sixty white pelicans fish in a closing horseshoe (the hero, ../parts/pelican-collage.js),
// then climb out through the eye of their turning thermal into a portal in a torn cloud.
//
// Everything is unlit paper drawn with the hero's PAPER_GLSL (torn rim, white deckle, brush streaks, fibre); there
// are no lights and no fog. Distance is done the collage way (paler, bluer tissue). World space = hero space:
// the horseshoe is at the origin opening toward +Z, the channel runs from z = 342 down to its mouth at z = 117,
// the lagoon is a 430 m disc centred (15, -97) with a north bay beyond its far rim, the thermal stands at (30, -195).
//
// The sky is three collages, one for each third: a warm one low over the reeds (channel), the lagoon's, and a cooler
// lilac-blue one for the climb; torn cumulus stacks with lilac undersides drift round the horizon and one tall stack
// caps the thermal. Our own bird is paper in the lens's plane, seen from its nape: the back of its barred crown running off
// the bottom edge, the long dark bill with its orange base pointing away up the picture, wing shoulders at the lower corners
// on each downstroke. It is the last sheet drawn, so nothing of the world is ever painted across it.
//
// Variations by seed / ctx.vary: hour (mid-morning, rose dawn with mist sheets and a thin column, amber evening,
// blue dusk under a full moon), weather (clear, a passing shower with rings on the water, a gale with the reeds
// laid over and the horseshoe pulled tight), season (late May, all-green high summer with twice the lilies, tawny
// October with purple plumes and 300 birds massing), cast (pygmy cormorants ahead of the horseshoe, a mostly
// Dalmatian flock, 44-76 fishers, 150-260 soarers), layout (the channel's S-bend, reed islands, lily carpet) and
// the rare event: a white-tailed eagle crosses low and the whole horseshoe takes off round the camera.
//
// Scripted moments (all keyed to u, so a frozen frame is the same every time):
//   The channel (u 0-0.36) is five different pictures, each reach with its own reeds (tall and straw-gold at the entry,
//   green past the first pool, low dark rush round the lily pool, low and warm round the mere). 0-0.05 the reed wall is
//   open on one side onto an entry bay (lilies, two pelicans, dark willows) with the thermal ahead as a tower of circling
//   cut-out birds, and at 0.02 a squacco heron lifts off the pads and crosses 3.7 m ahead of the bill, a third of the
//   picture wide; 0.07-0.11 we pass between two pelicans fishing in the channel; 0.121 a skein comes over low, wings
//   square to the lens (the gaze tips up at it); 0.15-0.21 the reed wall opens on a backwater pool on the outside of the
//   bend: eight pelicans fishing against the dark mirror and willows of its far bank, the nearest 5 m off at 0.16 (the
//   gaze turns into it, a second heron crosses at 0.18); 0.207-0.241 and 0.293-0.358 three hawker dragonflies hold
//   station just ahead of the bill; 0.224-0.288 the gaze turns through a wide opening on the other bank onto the lily
//   pool (42 m across, white lilies from bank to bank, five pelicans, the nearest 6 m off) while a file of glossy ibis
//   comes out across it at 0.25 and the pool's heron lifts off a pad (0.2245) to be 5.7 m from the lens at 0.25, back
//   and both wings to us against the dark willows on the pool's side of the picture, clear water between it and the
//   bill-tossing pelican in the middle, gone over the willows by 0.30; at 0.34 one hawker hangs 1.5 m off; marsh frogs sit close under the bill and leap aside all the way;
//   0.31-0.37 the reeds draw back round a lily mere 30-40 m wide with four pelicans on it, and at 0.34 eight frogs leap
//   across the bow at once, cut in side view.
//   0.245-0.35 the open water under the bill is laid with more paper: five large torn sheets of deeper teal across the route
//   (one in the lower picture at 0.25, 0.27, 0.30, 0.32 and 0.34), three torn honey-yellow strips of sun, and off the lily
//   pool's mouth at 0.25 a notched pad with a white lily, a drift of duckweed confetti and two slow torn rings.
//   0.33-0.36 the tear and plunge, about 0.365-0.41 under water (honey bed, light shafts 3-9 m off the route as swaying
//   strips of pale tissue torn down both long sides, each with its lilac shadow copy, bronze
//   carp parting either side, lily stems, bubbles), 0.42 the burst with three Dalmatians pattering up ahead-left (slap
//   rings), two more herons peeling away at 0.455 / 0.475; THE RAFT (the flight's middle peak): sixteen pelicans at rest
//   on the carpet start their run as we surface (0.412-0.42), patter ahead of the bill with slap rings, torn white spray
//   and honey-yellow strips of sun on the water (0.43, the nearest 7 m off), lift between 0.45 and 0.5 and at 0.52 are
//   spread across the whole sky ahead, bellies and both wings to the lens, sweeping up toward the column (gone by 0.59);
//   0.43-0.53 a low run-in over the lily carpet through hovering
//   terns toward a vanguard of fishers ahead of the mouth (10-17 m at 0.5) while the horseshoe closes (0.47-0.54);
//   0.54-0.585 a tracking shot down the inside of the left arm, the gaze on the bird just ahead
//   of abeam, with the dip wave (32 m long, phased by arc metres) timed so that bird is up with a full pouch at 0.57;
//   0.52-0.54 three more fishers close on the right of the run-in; 0.59-0.63 the bend, fish leaping and rings opening
//   under the bill, 0.62 over the back row; from 0.56 four pelicans come past the shoulder and hold station ahead (6-16 m).
//   The climb (0.64-0.9) is three pictures, each with its own cast of pelicans placed in the picture itself (the
//   "climbers": every bird is set in the lens's own frame each frame, whole inside it, turned so that its belly or back
//   and both black-edged wings face the lens, and never over the sun): to 0.74 the gaze is held down, so the lagoon, its
//   willow islands, lily rafts and the colonies lie across the lower third under eight birds rising toward the sun (peak
//   0.70); 0.74-0.83 it pans across the far shore and the north bay past seven more, one large and 6 m off on the left
//   (peak 0.79); from 0.83 it lifts into the cloud's eye, where the portal is a warm sun with torn-paper rays that light
//   the wings near it, two pelicans 8 m off flanking it left and right at 0.87-0.90. The whole sun and its rays stay in
//   the picture from 0.66 on (the rays are drawn in a little while it is far).
//   0.90-0.99 four big birds wheel banked circles left and right of the portal, belly to the lens at 0.95, never over the disc.
//   Rare: heads up at 0.5725, the eagle mid-frame at 0.60, take-off from 0.576 (the nearest first), the birds that rise
//   ahead kept 7.5 m and more ahead and whole inside the picture, the nearest holding the right half at 0.60-0.65.
//   0.59-0.61 the shoal boils where the gaze falls at the bend: up to five big fish are dealt 3.3-4.7 m out, low in the picture,
//   and some twenty more behind them to 13 m at different heights; each is then stood 2 m off our line by its box, the big ones across it, on our right at 0.6 (they go under as we reach them), with a fisher tail up
//   on either side at 0.6. At dawn the mist is low torn strips lying on the water.
// Seen through the previous world's portal (camera.nearThrough) the lens stands behind the entry: the channel, its reed
// walls, pads and duckweed run on behind the first path point, and the mount is not drawn.
// "Driven" flocks (herons, Dalmatians, escorts, eagle, take-off) get their places from the camera route each frame.
// On an upright screen the tracking gaze sits closer to the bird abeam and the kingfisher's crown is lowered; at 0.55 it
// looks squarely at the arm's first bird, so that bird is whole in the narrow frame (raised bill, apricot pouch) against
// the thicket's leaning willow, whose dark crown reaches out over the water behind it.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell, makeRng, hashSeed } from '../kit/core.js';
import { buildHero, PAPER_GLSL, makeGeo, strip, finishGeo, instanced, mixc } from '../parts/pelican-collage.js';

const TAU = Math.PI * 2, V3 = THREE.Vector3, lin = (h) => new THREE.Color(h);

// (at dawn and in the evening the climb's lowest bands are warm: peach to pale apricot, coral to amber, under rose and lilac)
// sky: eight torn bands, zenith first, horizon last (sky is the lagoon's; skyA the channel's, warm low over the reeds; skyC the
// climb's, cooler higher up: the sky is a different one in each third of the flight). pal: paper white, apricot, water, green, straw, deep, honey.
const LOOKS = {
  morning: { sky: ['#3C78D2', '#4688DA', '#4F9AE0', '#5AACE4', '#6CBCE6', '#86CCE6', '#A6DCE2', '#D4EEE4'],
    skyA: ['#3C78D2', '#4688DA', '#4F9AE0', '#5CAEE4', '#74C2E4', '#96D4DE', '#BCE4D6', '#E6F2D2'], skyC: ['#3466CC', '#3C76D6', '#4688DC', '#509AE2', '#60ACE6', '#78BEE8', '#98D0E6', '#C6E6E6'],
    pal: ['#FDFBF3', '#F7A65E', '#2FA8C9', '#8CC63F', '#E8C65A', '#1E7F86', '#DFA233'], cloud: ['#FDFBF3', '#B9B2DC'], far: '#9CCFD8', portal: '#FFC452', sun: ['#FFD24A', '#F7A65E', '#FFF1C2'], sunLight: [1.0, 0.86, 0.58] },
  dawn: { sky: ['#8D8FD8', '#A292D6', '#BC98D0', '#D99EC2', '#F0A8AE', '#F8BC9E', '#FBD2AC', '#FDE8CE'],
    skyA: ['#8D8FD8', '#A693D4', '#C49ACA', '#E6A0B6', '#F8A694', '#FCB680', '#FDCB8C', '#FEE2B0'], skyC: ['#7482DE', '#8A8CE0', '#AC98DA', '#DC9EC2', '#F3AAA4', '#F9BC96', '#FBD0A2', '#FDE4C4'],
    pal: ['#FDF6EE', '#F7A05E', '#7FA9D9', '#9CC76A', '#EDC886', '#6C74B8', '#E3A857'], cloud: ['#FFE9DC', '#C9A6D2'], far: '#C7A8CC', portal: '#FFA670', sun: ['#FFC670', '#F58A7A', '#FFEFD6'], sunLight: [1.0, 0.82, 0.66] },
  evening: { sky: ['#5878CE', '#7688D0', '#A092C6', '#CF98AC', '#F09A80', '#F6B068', '#F9C676', '#FCDFA2'],
    skyA: ['#5878CE', '#7C88CE', '#AC92C0', '#DE98A0', '#F6987A', '#FAAE60', '#FCC468', '#FEDC94'], skyC: ['#4C6CD2', '#6680D8', '#8A8CDA', '#B094D0', '#D49CB8', '#F0A08A', '#F8B870', '#FCD69A'],
    pal: ['#FFF4DC', '#F79A52', '#4FA3C2', '#9CBF3F', '#EDBE52', '#3F6F9E', '#E29A2E'], cloud: ['#FFE6BE', '#A88CC8'], far: '#B89CC0', portal: '#FFA436', sun: ['#FFC53C', '#F27A3C', '#FFF0C0'], sunLight: [1.0, 0.82, 0.52] },
  dusk: { sky: ['#1C2670', '#243084', '#2E3C96', '#3A4CA6', '#4F60B2', '#6A7AC0', '#8A98CE', '#B0BADE'],
    skyA: ['#1C2670', '#263286', '#34409A', '#4452AA', '#5E66B8', '#7C7EC4', '#9C98D0', '#C0B6DE'], skyC: ['#161E66', '#1E2A7A', '#28368E', '#34469E', '#465AAC', '#6074BA', '#8090C8', '#A8B4DA'],
    pal: ['#F1F2FA', '#F7A65E', '#4C7FD0', '#6FB07A', '#C9C27A', '#2F4F9A', '#C9A04A'], cloud: ['#C8D0F0', '#6A70B4'], far: '#6C7CC0', portal: '#DCE4FF', sun: ['#F2F0DC', '#A9B6F4', '#FFFFFF'], sunLight: [0.92, 0.95, 1.0] },
};
const SEASONS = {
  may: { green: null, straw: null, plume: '#F4E6B0', lily: 1 },
  summer: { green: '#6FBF3F', straw: '#A9CF4A', plume: '#DAD88E', lily: 2.2 },
  october: { green: '#C2B04A', straw: '#D9A247', plume: '#B48CC4', lily: 0.7, dark: '#6E4A9A' },
};

function pickLook(ctx) {
  const r = ctx.rng.fork('pelican'), a = r(), b = r(), c = r(), d = r(), e = r(), h = ctx.vary?.hour ?? 'any';
  const hour = h === 'dawn' ? 'dawn' : h === 'day' ? 'morning' : h === 'golden' ? 'evening' : h === 'night' ? 'dusk'
    : a < 0.4 ? 'morning' : a < 0.62 ? 'evening' : a < 0.84 ? 'dawn' : 'dusk';
  const weather = b < 0.64 ? 'clear' : b < 0.84 ? 'shower' : 'gale';
  const season = c < 0.5 ? 'may' : c < 0.75 ? 'summer' : 'october';
  return { hour, weather, season, cormorants: d < 0.45, dalmatian: e < 0.14 };
}

// ---------- shader templates ----------
// A field of instanced paper quads: the vertex snippet sets the centre c and the two half-axes T, W (and P, the
// params handed to the fragment stage); the fragment snippet sets e (0 on the torn rim .. 1 inside), col, alpha.
// A snippet never discards: it sets cut, and main throws the pixel away after paperSheet (whose texture reads and fwidth are not defined for a kept neighbour once a pixel has left).
const FIELD_VERT = (pars, body) => /* glsl */`
attribute vec4 iA, iB, iC;
uniform float uTime, uU, uUnderK, uPx;
uniform vec3 uShadowDir;
uniform vec2 uWind;
varying vec2 vQ; varying vec4 vP; varying float vDist; varying vec3 vWp;
${pars}
void main() {
  vec3 c = vec3(0.0), T = vec3(1.0, 0.0, 0.0), W = vec3(0.0, 1.0, 0.0); vec4 P = vec4(0.0); vec2 q = position.xy;
  vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 flatR = normalize(vec3(camR.x, 0.0, camR.z) + vec3(1e-4, 0.0, 0.0));
  ${body}
  vec4 world = modelMatrix * vec4(c + T * q.x + W * q.y, 1.0);
  vQ = q; vP = P; vWp = world.xyz;
  vec4 mv = viewMatrix * world; vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const FIELD_FRAG = (pars, body) => /* glsl */`
varying vec2 vQ; varying vec4 vP; varying float vDist; varying vec3 vWp;
uniform float uTime, uU, uUnderK;
uniform vec3 uShade, uShadowDir, uDeep, uHoney;
${PAPER_GLSL}
${pars}
void main() {
  float e = 1.0, alpha = 1.0, deck = 1.0, tearK = 1.0, farK = 1.0, seed = vP.w; vec3 col = uWhite; vec2 puv = vQ; bool cut = false;
  ${body}
  vec4 ps = paperSheet(col, puv, clamp(e, 0.0, 1.0), tearK, seed, deck);
  ps.a *= alpha;
  if (cut || ps.a < 0.04) discard;
  gl_FragColor = vec4(paperFar(ps.rgb, vDist * farK), ps.a);
}`;

// A hawker dragonfly in plan view (q in -1..1): striped abdomen, thorax, head with two eyes, four veined cellophane wings
// that whirr with fl. Sets e (0 on the torn rim) and isBody; returns the colour.
const FLY_GLSL = /* glsl */`
uniform vec3 uWing;
float wingE(vec2 q, vec2 root, float a, float len, float wd) {     // a long wing from its root; 0 on the rim
  vec2 d = q - root; float ca = cos(a), sa = sin(a); vec2 l = vec2(d.x * ca + d.y * sa, -d.x * sa + d.y * ca);
  float t = clamp(l.x / len, 0.0, 1.0);
  return min(1.0 - abs(l.y) / (wd * (0.35 + 0.65 * sin(3.1416 * pow(t, 0.7)))), min(l.x / len * 9.0, (len - l.x) / len * 9.0));
}
vec3 hawker(vec2 q, float fl, vec3 cA, vec3 cB, out float e, out float isBody) {
  vec2 aq = vec2(abs(q.x), q.y); vec3 col;
  float abd = min(1.0 - abs(q.x) / (0.05 - 0.02 * (1.0 - smoothstep(-0.95, -0.2, q.y))), min((q.y + 0.96) * 14.0, (0.1 - q.y) * 14.0));
  float thx = 1.0 - length((q - vec2(0.0, 0.14)) / vec2(0.105, 0.17));
  float hd = 1.0 - length((q - vec2(0.0, 0.36)) / vec2(0.1, 0.085));
  float ey = 1.0 - length((aq - vec2(0.075, 0.39)) / vec2(0.07, 0.065));
  float body = max(max(abd, thx), max(hd, ey));
  float wf = wingE(aq, vec2(0.06, 0.2), 0.2 + 0.16 * fl, 0.9, 0.125), wh = wingE(aq, vec2(0.06, 0.1), -0.22 - 0.13 * fl, 0.84, 0.14), wg = max(wf, wh);
  if (body > 0.0) {
    e = body * 3.0 + 0.3; isBody = 1.0;
    col = mix(cB, uDeep * 0.55, step(0.5, fract(q.y * 6.5)) * step(q.y, 0.02));
    if (thx > 0.0) col = mix(cA, cB, smoothstep(0.2, 0.7, thx));
    if (hd > 0.0) col = cA * 1.05;
    if (ey > 0.15) col = mix(uDeep * 0.45, cB, smoothstep(0.6, 0.9, ey));
  } else {
    e = wg * 2.2; isBody = 0.0;
    float along = length(aq - vec2(0.06, 0.15));
    col = mix(uWing, uWhite, 0.35 + 0.3 * step(wh, wf));
    col = mix(col, cB * 0.9, (1.0 - smoothstep(0.03, 0.09, abs(fract(along * 5.0 + q.y * 1.5) - 0.5))) * 0.55);      // veins
    col = mix(col, uDeep * 0.6, smoothstep(0.8, 0.83, along) * (1.0 - smoothstep(0.88, 0.9, along)) * step(0.45, wg));   // the dark spot near each tip
  }
  return col;
}`;

// A leaping fish (f.x 0 at the tail .. 1 at the snout, f.y -1 belly .. 1 back): x = body, y = tail, z = dorsal and anal fins;
// each is 0 on its rim and rises inside.
const FISH_GLSL = /* glsl */`
vec3 fishE(vec2 f) {
  float prof = 0.1 + 0.9 * pow(max(sin(3.1416 * clamp((f.x - 0.16) / 0.84, 0.0, 1.0)), 0.0), 0.6);
  float body = (1.0 - abs(f.y) / prof) * step(0.0, f.x) * step(f.x, 1.0);
  float tw = 0.85 * (1.0 - f.x / 0.3);
  float tail = min(1.0 - abs(f.y) / max(tw, 0.01), (abs(f.y) - 0.45 * (1.0 - f.x / 0.16)) * 4.0 + 0.6) * step(f.x, 0.3) * step(-0.02, f.x);
  float dors = 1.0 - length((f - vec2(0.5, 0.96)) / vec2(0.15, 0.25));
  float anal = 1.0 - length((f - vec2(0.36, -0.9)) / vec2(0.1, 0.24));
  return vec3(body, tail, max(dors, anal));
}`;

export default {
  id: 'pelican-collage',
  name: 'The Tissue-Paper Pelicans',
  category: 'wilderness',
  weirdness: 0.4,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, dens = ctx.vary?.density ?? 1, rare = !!ctx.vary?.rare;
    const look = pickLook(ctx), L = LOOKS[look.hour], SE = SEASONS[look.season];
    const gale = look.weather === 'gale', shower = look.weather === 'shower' && look.hour !== 'dusk';
    const pal = L.pal.slice();
    if (SE.green) pal[3] = SE.green;
    if (SE.straw) pal[4] = SE.straw;
    const rx = makeRng(hashSeed('pelican-extra:' + ctx.seed));     // draws for everything added later, so the older layout keeps its seeds
    const rz = makeRng(hashSeed('pelican-four:' + ctx.seed));      // and for what the fourth round added (behind the entry, the shoal, the mist)
    const r5 = makeRng(hashSeed('pelican-five:' + ctx.seed));      // and the fifth (the lily pool, the colonies below, the sun)
    const r6 = makeRng(hashSeed('pelican-six:' + ctx.seed));       // and the sixth (the climb's wheeling flock, the bay at the entry, the mere, the far islands)
    const r7 = makeRng(hashSeed('pelican-seven:' + ctx.seed));     // and the seventh (the raft that lifts off the lily carpet, the horizon cumulus, the glints)
    const r9 = makeRng(hashSeed('pelican-nine:' + ctx.seed));      // and the ninth (the leaning willow of the thicket, the near things on the water at u 0.25-0.34)
    const scene = new THREE.Scene();
    const above = new THREE.Group(), under = new THREE.Group(); above.name = 'above'; under.name = 'under';
    scene.add(above, under);

    // ---------- the hero: horseshoe, thermal, cloud cap, the lagoon sheet (stretched under the channel) ----------
    const nSoar = look.season === 'october' ? 300 : look.hour === 'dawn' ? 90 : clamp(Math.round(205 * dens), 150, 260);
    // a vanguard ahead of the mouth: fishers the run-in passes at 10-17 m, facing us (x is measured from the left tip)
    const jx = gale ? 3 : 0, JOIN = [[-4.6, 39.2, 0.62], [-0.8, 35.2, 0.08], [3.2, 38.6, 0.76], [4.4, 31.6, 0.2], [-15.6, 29.5, 0.05], [-16.8, 35.5, 0.14], [8.4, 35.6, 0.5], [-5.4, 33.4, 0.56], [0.6, 29.6, 0.12]];
    // further fishers the world places itself once the channel is laid out (hero.setPlace): a pair in the channel, the
    // birds of the backwater pool, one inside the bend. [u offset, metres to the pool side, cycle fraction at their moment, scale]
    const EXTRA = [
      { u: 0.0915, lat: 3.3, f: 0.62, uf: 0.08, s: 1.18, fixed: 1 }, { u: 0.108, lat: -3.3, f: 0.16, uf: 0.08, s: 1.1, fixed: 1 },
      { u: 0.166, lat: 3.4, f: 0.76, uf: 0.16, s: 1.26 }, { u: 0.1715, lat: 5.3, f: 0.56, uf: 0.16, s: 1.18 }, { u: 0.1775, lat: 3.5, f: 0.13, uf: 0.16, s: 1.2 },
      { u: 0.1765, lat: 7.6, f: 0.66, uf: 0.16, s: 1.14 }, { u: 0.185, lat: 5.6, f: 0.3, uf: 0.16, s: 1.18 }, { u: 0.171, lat: 9.8, f: 0.05, uf: 0.16, s: 1.1 },
      { u: 0.193, lat: 8.6, f: 0.7, uf: 0.16, s: 1.14 }, { u: 0.184, lat: 11.5, f: 0.42, uf: 0.16, s: 1.08 },
      { u: 0.6155, lat: 3.4, f: 0.22, uf: 0.6, s: 1.34, fixed: 1, bend: 1, shoal: 1 },      // (re-placed beside the shoal once the gaze is known)
      { u: 0.528, lat: 3.5, f: 0.74, uf: 0.52, s: 1.2, fixed: 1, bend: 1, face: 1 }, { u: 0.5345, lat: 5.4, f: 0.56, uf: 0.52, s: 1.16, fixed: 1, bend: 1, face: 1 }, { u: 0.5415, lat: 3.6, f: 0.14, uf: 0.52, s: 1.12, fixed: 1, bend: 1, face: 1 },
      // the lily pool (the second side pool, u 0.25-0.3): a pair close inside its mouth and three further in
      { u: 0.2578, lat: 4.5, f: 0.74, uf: 0.25, s: 1.36, p2: 1 }, { u: 0.2655, lat: 7.8, f: 0.52, uf: 0.25, s: 1.3, p2: 1 }, { u: 0.2805, lat: 12.2, f: 0.14, uf: 0.25, s: 1.18, p2: 1 },
      { u: 0.268, lat: 15.6, f: 0.62, uf: 0.25, s: 1.16, p2: 1 }, { u: 0.287, lat: 7.2, f: 0.3, uf: 0.25, s: 1.14, p2: 1 },
      // the sixth round: a pair loafing in the entry bay (u 0.02) and four on the lily mere before the dive (u 0.34)
      { u: 0.05, lat: 10.5, f: 0.7, uf: 0.02, s: 1.2, p2: 1, p6: 1 }, { u: 0.058, lat: 17, f: 0.3, uf: 0.02, s: 1.14, p2: 1, p6: 1 },
      { u: 0.3525, lat: -7.6, f: 0.72, uf: 0.34, s: 1.24, fixed: 1, p6: 1 }, { u: 0.358, lat: 8.6, f: 0.5, uf: 0.34, s: 1.2, fixed: 1, p6: 1 },
      { u: 0.3655, lat: -11.2, f: 0.16, uf: 0.34, s: 1.16, fixed: 1, p6: 1 }, { u: 0.3715, lat: 12.4, f: 0.62, uf: 0.34, s: 1.14, fixed: 1, p6: 1 },
    ];
    const hero = await buildHero(ctx, {
      joiners: JOIN.map(([x, z], i) => ({ x: x + jx + (x < -10 ? -2.2 : 0.8), z: z + 1.2, cx: x + jx, cz: z, yaw: 0.3 * Math.sin(i * 2.4 + 1) + (x < -10 ? 0.25 : -0.1), scale: 1.09 + 0.05 * Math.sin(i * 1.7), seed: undefined }))
        .concat(EXTRA.map((e, i) => ({ x: 900 + i * 4, z: 900, yaw: 0, scale: e.s, seed: e.p6 ? r6() : e.p2 ? r5() : rx(), flush: e.p6 ? r6() : e.p2 ? r5() : rx() }))),
      palette: pal, hour: look.hour, weather: gale ? 'gale' : undefined,
      fishers: clamp(Math.round(60 * dens), 44, 76), soarers: Math.round(nSoar * (0.6 + 0.4 * detail)),
      dalmatian: look.dalmatian ? 0.7 : undefined, waveLength: 32, waterRadius: 640, waterCenter: [0, 60], waterDepthWrite: false,
    });
    above.add(hero.object);
    const U = hero.uniforms, A = hero.anchors, C = hero.colors, P = pal.map(lin), darkC = SE.dark ? lin(SE.dark) : null;
    const skyCols = L.sky.map(lin);
    if (shower) for (const c of skyCols) c.lerp(lin('#A7A4D6'), 0.38);
    // the three skies of the flight (the channel's, the lagoon's, the climb's); update() mixes them into skyCols by u
    const skySets = [L.skyA ?? L.sky, L.sky, L.skyC ?? L.sky].map((set) => set.map((h) => { const c = lin(h); if (shower) c.lerp(lin('#A7A4D6'), 0.38); return c; }));
    const skyBandK = { value: 1 };
    U.uHaze.value.copy(skyCols[7]).multiplyScalar(0.9);
    const WU = {                                    // uniforms shared by the world's own sheets
      uU: { value: 0 }, uUnderK: { value: 0 }, uPx: { value: 0.0027 }, uShadowDir: U.uShadowDir, uShade: U.uShade,
      uBackK: { value: 0 },                         // 1 lays the reeds behind the entry flat (a lens looking in through a portal from off the channel's axis)
      uWind: { value: new THREE.Vector2(-0.85, -0.52) }, uGust: { value: new THREE.Vector2(gale ? 0.9 : 0.75, gale ? 1.5 : 0.08) },
      uDeep: { value: darkC ? mixc(P[5], darkC, 0.6) : mixc(P[5], P[3], 0.25) }, uHoney: { value: P[6].clone() },
    };
    const mat = (uni, vert, frag, params = {}) => new THREE.ShaderMaterial({
      uniforms: { ...U, ...WU, ...uni }, vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide, alphaToCoverage: true, ...params });
    const QUAD = new THREE.PlaneGeometry(1, 1);
    // list: array of [iA(4), iB(4), iC(4)] flat 12-number rows
    const field = (rows, o) => {
      const n = rows.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { const r = rows[i]; for (let k = 0; k < 4; k++) { iA[i * 4 + k] = r[k]; iB[i * 4 + k] = r[4 + k]; iC[i * 4 + k] = r[8 + k] ?? 0; } }
      const m = new THREE.Mesh(instanced(o.geo ?? QUAD, Math.max(n, 1), { iA, iB, iC }),
        mat(o.uniforms ?? {}, FIELD_VERT(o.vpars ?? '', o.vert), FIELD_FRAG(o.fpars ?? '', o.frag), o.params ?? {}));
      m.frustumCulled = false; m.visible = n > 0; if (o.order != null) m.renderOrder = o.order;
      (o.parent ?? above).add(m);
      return m;
    };
    await ctx.yield();

    // ---------- layout: channel centre line, lagoon, the camera path ----------
    const LC = [15, -97.5], LR = 213, sgn = rng.sign(), B = rng.range(7, 11);
    const x4 = -17 + sgn * B * 0.55, x5 = -17 + sgn * B, x6 = lerp(x5, -5.5, 0.62) - sgn * 2;
    const pinch = rng.int(4, 6);
    const chan = [[-17, 440, 5.4], [-17, 342, 5.4], [-17, 300, 5.2], [-17, 262, 5.0], [x4, 226, 4.8], [x5, 190, 4.8], [x6, 156, 4.8], [-5.5, 130, 5.4], [-5.5, 106, 6.5]];
    chan[pinch][2] = 3.9;
    chan[7][2] = 15; chan[8][2] = 21;               // the last reach opens into a lily mere, the reeds drawn well back (u 0.31-0.37)
    // Seen through the previous world's portal (camera.nearThrough) the lens stands behind the entry, up to some 70 m back
    // when the opening is far off: the channel, its reed walls, pads and duckweed run on behind the entry to Z_BACK.
    const Z_BACK = 640;
    // the backwater: a round pool on the outside of the first bend. The reed wall opens on it for some 30 m (u 0.15-0.21)
    // and the gaze turns to the pelicans fishing there against the dark mirror of its far bank
    const ps = -sgn, pool = [lerp(-17, x4, 29 / 36) + ps * 18.4, 233, 21];
    const poolD = (x, z) => Math.hypot(x - pool[0], z - pool[1]) - pool[2];
    // the lily pool: a second round pool on the other bank, further down (the reed wall opens on it at u 0.25-0.3):
    // white lilies in flower from bank to bank, a few pelicans loafing and fishing, dark willows behind
    const s2 = -ps, pool2 = [lerp(x5, x6, 4 / 34) + s2 * 19.5, 186, 21];
    const pool2D = (x, z) => Math.hypot(x - pool2[0], z - pool2[1]) - pool2[2];
    // the entry bay: the reed wall is open on one side from the first metres (the opening picture, u 0.0-0.05)
    const pool3 = [-17 + s2 * 19, 312, 17], pool3D = (x, z) => Math.hypot(x - pool3[0], z - pool3[1]) - pool3[2];
    // the reeds change from reach to reach: tall and straw-gold at the entry, green past the first pool, low dark rush round
    // the lily pool, lower and warm again round the mere. [height factor, tone (+ straw, - dark green)] at a given z
    const reach = (z) => {
      const a = smoothstep(310, 322, z), b = (1 - smoothstep(200, 212, z)) * smoothstep(160, 170, z), c = (1 - smoothstep(158, 168, z)) * smoothstep(96, 110, z);
      return [1 + 0.3 * a - 0.3 * b - 0.22 * c, 0.8 * a - 0.85 * b + 0.5 * c];
    };
    const fly = A.flyThrough;
    const pts = [[-17, 2.5, 338], [-17, 2.1, 315], [-17, 1.45, 288], [-17, 1.0, 262], [x4, 1.0, 226], [x5, 1.0, 190], [x6, 1.0, 156],
      [-5.5, 1.0, 131], [-5.5, 0.1, 125], [-5.4, -1.15, 120.5], [-5.3, -1.45, 113.5], [-5.6, -1.4, 106.5], [-6.0, -0.95, 101.5],
      [-6.2, 0.5, 97.1], [-5.6, 2.0, 92], [-1.6, 2.7, 78], [-2.4, 2.7, 62], ...fly];
    const path = makePath(pts);
    const PL = path.length, _p = new V3(), _q = new V3();
    let uIn = 0.37, uOut = 0.41;                    // where the path crosses the water going down and coming up
    const PT = []; for (let i = 0; i <= 1000; i++) PT.push(path.pointAt(i / 1000).clone());       // the path, tabulated for the clearance checks
    const ptAt = (u) => PT[clamp(Math.round(u * 1000), 0, 1000)];
    for (let i = 1; i < 600; i++) { const a = PT[i - 1].y, b = PT[i].y; if (a > 0 && b <= 0) uIn = (i - 1 + a / (a - b)) / 1000; if (a < 0 && b >= 0) uOut = (i - 1 + a / (a - b)) / 1000; }
    await ctx.yield();
    // the gaze through the horseshoe: first its middle, then a tracking shot along the inside of the arc, aimed at the
    // bird a few metres ahead of abeam; the dip wave (32 m long) is phased so that bird is up with a full pouch as we pass
    const closeAt = (u) => { const p = clamp((u - 0.47) / 0.07, 0, 1); return p * p * (3 - 2 * p); };
    // (an upright screen sees a much narrower slice, so there the aim sits on the bird abeam instead: TRKT)
    const TRK = [], TRKT = [], HC = A.horseshoeCenter, _gt = new V3();
    let tallK = clamp((1.3 - (ctx.aspect ?? 1.78)) / 0.7, 0, 1);
    const ARC = new Float32Array(521 * 4);           // the arc, open and closed, tabulated once
    for (let j = 0; j <= 520; j++) { const o = hero.shape(j / 800, 0), c = hero.shape(j / 800, 1); ARC[j * 4] = o[0]; ARC[j * 4 + 1] = o[1]; ARC[j * 4 + 2] = c[0]; ARC[j * 4 + 3] = c[1]; }
    await ctx.yield();
    for (let i = 0; i <= 140; i++) {
      if (i % 8 === 7) await ctx.yield();
      const u = 0.38 + i * 0.002, k = closeAt(u), m = smoothstep(0.49, 0.538, u);
      for (const [T, lead0, j0] of [[TRK, 1.2, 16], [TRKT, 0.6, 2]]) {
        const lead = lead0 + (9.2 - lead0) * smoothstep(0.582, 0.615, u), Q = ptAt(clamp(u + lead / PL, 0, 1));
        let bd = 1e9, bx = 0, bz = 0;
        for (let j = j0; j <= 520; j++) {
          const o = j * 4, qx = ARC[o] + (ARC[o + 2] - ARC[o]) * k, qz = ARC[o + 1] + (ARC[o + 3] - ARC[o + 1]) * k, dx = qx - Q.x, dz = qz - Q.z, d = dx * dx + dz * dz;
          if (d < bd) { bd = d; bx = qx; bz = qz; }
        }
        T.push(new V3(lerp(HC[0] + 2.5, bx, m), lerp(0.5, 0.92, m), lerp(4, bz, m)));
      }
    }
    const gazeW = (u, out) => { const f = clamp((u - 0.38) / 0.002, 0, 139.999), i = Math.floor(f); return out.lerpVectors(TRK[i], TRK[i + 1], f - i); };
    // (as the lens reaches the arm's first bird, u 0.55, an upright screen looks squarely at it: the whole bird, raised bill and pouch, inside the narrow frame)
    const gazeAt = (u, out) => { const f = clamp((u - 0.38) / 0.002, 0, 139.999), i = Math.floor(f); gazeW(u, out); if (tallK > 0) { out.lerp(_gt.lerpVectors(TRKT[i], TRKT[i + 1], f - i), tallK * 0.62); const w = tallK * smoothstep(0.53, 0.55, u) * (1 - smoothstep(0.55, 0.568, u)); if (w > 0) { _gt.copy(tallAim); if (u > 0.55) { path.pointAt(u, _gt2); _gt.x += _gt2.x - tallAt.x; _gt.z += _gt2.z - tallAt.z; } out.lerp(_gt, w); } } return out; };
    const tallAim = new V3(), tallAt = path.pointAt(0.55).clone(), _gt2 = new V3();      // (past the bird the aim keeps its bearing and travels on with the lens, so the gaze never turns back)
    { // the arm's first bird as the lens comes level with it (u 0.55) and the one behind it: the upright aim sits a third of the way from the first to the second
      const c0 = ptAt(0.55), near = hero.fisherList.filter((b) => !b.joiner && b.s < 0.5).map((b) => [Math.hypot(b.c[0] - c0.x, b.c[1] - c0.z), b]).sort((a, b) => a[0] - b[0]);
      const a = near[0][1].c, b = (near[1] ?? near[0])[1].c; tallAim.set(a[0] + (b[0] - a[0]) * 0.35, 0.9, a[1] + (b[1] - a[1]) * 0.35);
    }
    const U_STAR = 0.57, starAt = new V3().lerpVectors(TRK[95], TRK[96], 0);
    let star = hero.fisherList[0]; { let bd = 1e9; for (const b of hero.fisherList) { const d = Math.hypot(b.c[0] - starAt.x, b.c[1] - starAt.z); if (b.s < 0.5 && !b.joiner && d < bd) { bd = d; star = b; } } }
    const waveOff = 0.57 + star.phase - U_STAR * 40 / 3, waveAt = (u) => u * 40 / 3 + waveOff;
    // the vanguard's dips are timed for the run-in: at u 0.5 some have wings half-lifted, some are up with a full pouch
    JOIN.forEach((j, i) => hero.setPhase(hero.joiners.first + i, waveAt(0.5) - j[2]));
    const segD = (x, z, a, b) => {
      const bx = b[0] - a[0], bz = b[1] - a[1], px = x - a[0], pz = z - a[1], h = clamp((px * bx + pz * bz) / (bx * bx + bz * bz), 0, 1);
      return Math.hypot(px - bx * h, pz - bz * h) - lerp(a[2], b[2], h);
    };
    const chanD = (x, z) => { let d = 1e9; for (let i = 0; i < 8; i++) d = Math.min(d, segD(x, z, chan[i], chan[i + 1])); return d; };
    const wetD = (x, z) => Math.min(chanD(x, z), poolD(x, z), pool2D(x, z), pool3D(x, z));          // channel, backwater and lily pool together
    // the extra fishers take their places: beside the route at their u, facing the way we come from
    const sideOf = (u, lat, out) => { const i = clamp(Math.round(u * 1000), 1, 999), a = PT[i - 1], b = PT[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return out.set(PT[i].x - dz / l * lat, 0, PT[i].z + dx / l * lat); };
    const extraAt = [], poolLook = new V3();
    EXTRA.forEach((e, k) => {
      const idx = hero.joiners.first + JOIN.length + k, q = new V3(); let lat = e.lat * (e.fixed ? 1 : e.p2 ? s2 : ps);
      for (let tries = 0; tries < 30; tries++) {
        sideOf(e.u, lat, q);
        let md = 1e9; for (let i = Math.max(0, Math.round(e.u * 1000) - 40); i <= Math.min(1000, Math.round(e.u * 1000) + 40); i++) md = Math.min(md, Math.hypot(PT[i].x - q.x, PT[i].z - q.z, Math.max(0, PT[i].y - 1.3)));
        const crowd = e.bend ? hero.fisherList.some((b, j) => j !== idx && (Math.hypot(b.c[0] - q.x, b.c[1] - q.z) < 1.9 || Math.hypot(b.o[0] - q.x, b.o[1] - q.z) < 1.9)) : extraAt.some((o) => Math.hypot(o.x - q.x, o.z - q.z) < 1.9);
        if (md >= 3.2 && !crowd && (e.bend || wetD(q.x, q.z) < -1.0)) break;
        lat += Math.sign(lat) * (md < 3.2 || crowd ? 0.35 : -0.35);
      }
      const back = ptAt(clamp(e.u - (e.bend && !e.face ? -0.02 : 0.03), 0, 1)), yaw = e.bend && !e.face ? Math.atan2(PT[Math.round(e.u * 1000) - 6].x - q.x, PT[Math.round(e.u * 1000) - 6].z - q.z) + 0.5 : Math.atan2(back.x - q.x, back.z - q.z) * 0.8 + 0.25 * Math.sin(k * 2.1);
      hero.setPlace(idx, q.x, q.z, yaw); hero.setPhase(idx, waveAt(e.uf) - e.f);
      extraAt.push({ x: q.x, z: q.z, e, lat });
    });
    { let n = 0; for (const o of extraAt) if (!o.e.fixed && !o.e.p2) { poolLook.x += o.x; poolLook.z += o.z; n++; } poolLook.multiplyScalar(1 / n); poolLook.y = 0.9; }
    await ctx.yield();
    // reed islands (plaur) inside the lagoon rim, clear of the path and the horseshoe
    const islands = [[-58 + rng.range(-4, 4), 4 + rng.range(-8, 8), rng.range(16, 20)], [50 + rng.range(-4, 6), -36 + rng.range(-8, 6), rng.range(12, 15)], [-28 + rng.range(-3, 3), -64 + rng.range(-4, 4), rng.range(15, 18)]];
    {
      const c0 = ptAt(0.562), g = gazeW(0.562, new V3()), gx = g.x - c0.x, gz = g.z - c0.z, gl = Math.hypot(gx, gz) || 1, q = islands[0];
      q[2] = 13.5;
      for (let d = 27; d < 44; d += 1) {            // as near as the open horseshoe allows
        q[0] = g.x + gx / gl * d; q[1] = g.z + gz / gl * d;
        if (hero.fisherList.every((b) => Math.hypot(b.o[0] - q[0], b.o[1] - q[1]) > q[2] + 3.5)) break;
      }
    }
    for (let tries = 0; tries < 400 && islands.length < 8; tries++) {
      const a = rng() * TAU, rr = rng.range(70, 185), r = rng.range(8, 19), x = LC[0] + Math.cos(a) * rr, z = LC[1] + Math.sin(a) * rr;
      if (Math.hypot(x, z) < r + 46 || path.nearestXZ(x, z).dist < r + 24 || Math.hypot(x - 30, z + 195) < r + 30) continue;
      if (Math.abs(x + 9) < 30 && z > 30) continue;                       // keep the lily carpet and the opening view clear
      if (islands.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + r + 14)) continue;
      islands.push([x, z, r]);
    }
    while (islands.length < 8) islands.push([900, 900, 1]);
    // two more in the far half of the lagoon, placed for the climb: willow islands left and right of the thermal's foot
    const northIsl = [];
    for (const [x, z, r0, r1] of [[-27 + r5.range(-3, 3), -138 + r5.range(-4, 4), 15.5, 20.5], [66 + r5.range(-3, 3), -150 + r5.range(-4, 4), 13, 17.5], [-78 + r5.range(-4, 4), -212 + r5.range(-4, 4), 14.5, 18.5]]) {
      const hitR = (r) => islands.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + r + 6), r = hitR(r1) ? r0 : r1, hit = hitR(r);
      const q = hit ? [900, 900, 1] : [x, z, r]; islands.push(q); if (!hit) northIsl.push(q);
    }
    // the north bay: beyond the far rim the lagoon opens on a second water, which is what lies under the lens from the top
    // of the climb (u 0.75-0.82); big willow islands stand in it and in the lagoon's far half, each with its own birds
    const bay = [-12 + r6.range(-6, 6), -382 + r6.range(-6, 6), 150];
    const bayD = (x, z) => Math.hypot(x - bay[0], z - bay[1]) - bay[2];
    const newIsl = [];
    for (const [x, z, r] of [[13 + r6.range(-4, 4), -254 + r6.range(-4, 4), 19], [112 + r6.range(-5, 5), -214 + r6.range(-5, 5), 17], [-52 + r6.range(-5, 5), -338 + r6.range(-5, 5), 25], [48 + r6.range(-5, 5), -372 + r6.range(-5, 5), 21], [-8 + r6.range(-6, 6), -446 + r6.range(-5, 5), 23]]) {
      const hit = islands.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + r + 6);
      const q = hit ? [900, 900, 1] : [x, z, r]; islands.push(q); if (!hit) newIsl.push(q);
    }
    const sdfWater = (x, z) => {                     // < 0 on open water, > 0 on land (metres to the shore); the lily pool is not counted (older layouts keep their draws)
      let d = Math.min(Math.hypot(x - LC[0], z - LC[1]) - LR, chanD(x, z), poolD(x, z));
      for (let i = 0; i < 8; i++) { const q = islands[i]; d = Math.max(d, q[2] - Math.hypot(x - q[0], z - q[1])); }
      return d;
    };
    const sdfWater2 = (x, z) => { let d = Math.min(sdfWater(x, z), pool2D(x, z)); for (let i = 8; i < islands.length; i++) { const q = islands[i]; d = Math.max(d, q[2] - Math.hypot(x - q[0], z - q[1])); } return d; };
    const sdfWater3 = (x, z) => { let d = Math.min(sdfWater(x, z), pool2D(x, z), pool3D(x, z), bayD(x, z)); for (let i = 8; i < islands.length; i++) { const q = islands[i]; d = Math.max(d, q[2] - Math.hypot(x - q[0], z - q[1])); } return d; };
    await ctx.yield();

    // ---------- sky: eight torn bands of tissue on a dome; the same dome turns honey under water ----------
    const moonDir = new V3(0.5, 0.33, -0.8).normalize();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 16, 10), mat({
      uBand: { value: skyCols }, uBandK: skyBandK, uSkySeed: { value: rng() }, uOlive: { value: mixc(P[6], P[5], 0.36).multiplyScalar(0.72) },
      uMoon: { value: new THREE.Vector4(moonDir.x, moonDir.y, moonDir.z, look.hour === 'dusk' ? 1 : 0) },
      uSea: { value: P[2].clone().multiply(U.uTint.value).multiplyScalar(0.94) },
    }, /* glsl */`
      varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, /* glsl */`
      varying vec3 vDir;
      uniform vec3 uBand[8], uOlive, uHoney, uSea; uniform vec4 uMoon; uniform float uSkySeed, uUnderK, uBandK;
      ${PAPER_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float el = asin(clamp(d.y, -1.0, 1.0)) * 57.2958;
        float az = atan(d.x, d.z + (abs(d.x) + abs(d.z) < 1e-5 ? 1e-4 : 0.0));
        vec2 uv = vec2(az / 6.2832 * 6.0, el * 0.03);
        vec4 nA = textureLod(uPaper, uv + vec2(0.0, uSkySeed), 0.0), nB = textureLod(uPaper, uv * vec2(2.0, 1.7) + 0.37, 0.0);
        vec4 nC = textureLod(uPaper, uv * vec2(1.0, 9.0) + 0.71, 0.0);
        float fw = fwidth(el) * 1.6 + 0.05, line = 0.0, x;
        vec3 col = uBand[7];
        #define BAND(i, b, amp, n) x = el - (b * uBandK + ((n) - 0.5) * amp); col = mix(col, uBand[i], smoothstep(-fw * 0.4, fw * 0.4, x)); line = max(line, 1.0 - smoothstep(0.0, fw, abs(x)));
        BAND(6, 2.4, 1.2, nA.r)
        BAND(5, 5.6, 2.0, nB.r)
        BAND(4, 10.0, 3.0, nA.a)
        BAND(3, 17.0, 4.5, nB.a)
        BAND(2, 27.0, 6.5, 0.5 * (nA.r + nB.a))
        BAND(1, 41.0, 9.0, 0.5 * (nA.a + nB.r))
        BAND(0, 60.0, 11.0, nA.b)
        col *= 0.95 + 0.1 * nC.b;
        col = mix(col, uWhite, line * 0.6);
        float ang = acos(clamp(dot(d, uMoon.xyz), -1.0, 1.0)) * 57.2958 + (nB.r - 0.5) * 0.7;
        col = mix(col, mix(col, uWhite, 0.3), uMoon.w * (1.0 - smoothstep(8.0, 8.4, ang + (nA.a - 0.5) * 3.0)));
        col = mix(col, vec3(0.93, 0.92, 0.84), uMoon.w * (1.0 - smoothstep(3.3, 3.5, ang)));
        // well below the horizon the dome is water paper, so no pale sky can ever show under a clipped water sheet
        col = mix(col, uSea * (0.94 + 0.12 * nA.b), 1.0 - smoothstep(-6.0, -2.5, el + (nB.r - 0.5) * 1.5));
        float tn = (nA.r - 0.5) * 12.0;
        vec3 uc = mix(uOlive, uHoney * 0.78, smoothstep(-fw, fw, el + 16.0 + tn));
        uc = mix(uc, uHoney * vec3(1.1, 1.12, 1.0), smoothstep(-fw, fw, el - 6.0 + (nB.a - 0.5) * 10.0));
        uc *= 0.92 + 0.14 * nC.b;
        col = mix(col, uc, uUnderK);
        col += (nA.g - 0.5) * 0.03;
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
      }`, { side: THREE.BackSide, depthWrite: false, depthTest: false, alphaToCoverage: false }));
    sky.renderOrder = -3; sky.frustumCulled = false; scene.add(sky);

    // ---------- blobs: cumulus stacks, willow crowns and trunks (camera-facing torn sheets) ----------
    const blobRows = [], stacks = [];              // stacks: [first row, rows] of each cumulus
    const nStacks = Math.round((shower ? 15 : 9) + rng.range(0, 3));
    for (let i = 0, guard = 0; i < nStacks && guard < 200; guard++) {
      const x = rng.range(-1500, 1500), z = rng.range(-1700, 200), y = rng.range(150, 330), S = rng.range(110, 230);
      if (Math.hypot(x - 30, z + 195) < 420 || Math.hypot(x, z - 342) < 500) continue;
      const k = rng.int(3, 5), sd = rng();
      stacks.push([blobRows.length, k]);
      for (let j = 0; j < k; j++) blobRows.push([x + rng.range(-0.22, 0.22) * S, y + j * 0.13 * S, z + j * 9, S * (1 - 0.13 * j) * (j ? 0.62 : 0.5),
        sd + j * 0.13, rng.range(1.7, 2.4) * (j ? 1 : 1.25), j ? 0 : 1, 2.6 + 0.7 * j + rng.range(0, 0.4), 0, 0, 0, 0]);
      i++;
    }
    const willow = (x, z, h, r, lean, dark, rng = ctx.rng) => {            // foliage masses and a leaning trunk; the hanging strands come later
      const lx = lean[0], lz = lean[1];
      blobRows.push([x + lx * 0.15, h * 0.42, z + lz * 0.15, h * 0.84, rng(), 0.16, 4, 0, 2, 0, 0, 0]);
      blobRows.push([x + lx * 0.5 + 0.5, h * 0.5, z + lz * 0.5, h * 0.7, rng(), 0.1, 4, 0, 2, 0, 0, 0]);
      for (let j = 0; j < 9; j++) {
        const a = rng() * TAU, rr = r * rng.range(0.1, 0.7);
        blobRows.push([x + lx + Math.cos(a) * rr, h * rng.range(0.74, 1.02) - rr * 0.2, z + lz + Math.sin(a) * rr, r * rng.range(1.05, 1.5), rng(), rng.range(1.2, 1.6), j % 3 === 0 ? 5 : j % 3 === 1 ? (dark ? 4 : 2) : (dark ? 5 : 3), 0, 1, 0, 0, 0]);
      }
    };
    const willows = [], farWillows = []; let leanW = null;               // [x, z, height, crown radius, lean xz]; farWillows are crowns only (no strands)
    {
      const side = -sgn, zA = rng.range(236, 250), zB = rng.range(166, 182);
      const xa = lerp(-17, x4, clamp((262 - zA) / 36, 0, 1)), xb = lerp(x5, x6, clamp((190 - zB) / 34, 0, 1));
      // the first willow leans over the backwater from its far bank; two more (below) thicken that bank into a dark screen
      willows.push([pool[0] + side * (pool[2] + 2.5), pool[1] + (zA - 243) * 0.8 - 3, 11.5, 6.8, [-side * 3.2, 0], true], [pool2[0] + s2 * (pool2[2] + 2.5), pool2[1] + (zB - 174) * 0.8, 12.5, 7.2, [-s2 * 3.4, 0], true]);
      void xa;
      for (const q of islands.slice(0, 3)) if (q[2] > 10 && q[0] < 800) willows.push([q[0] + rng.range(-2, 2), q[1] + rng.range(-2, 2), rng.range(8, 11), 5.2, [rng.range(-1.5, 1.5), 0]]);
      { // a thicket on the first island, right behind the closest pass, so the white birds stand against dark green
        const q = islands[0], dx = starAt.x - q[0], dz = starAt.z - q[1], dl = Math.hypot(dx, dz) || 1, ex = dx / dl, ez = dz / dl;
        for (const [al, ac, h] of [[6.5, 0, 12.5], [5.5, 7.5, 10.5], [5.5, -7.5, 11]]) willows.push([q[0] + ex * al - ez * ac, q[1] + ez * al + ex * ac, h, 6, [ex * 1.2, ez * 1.2], true]);
      }
      for (const w of willows) willow(...w);
      { // one more willow of the thicket, rooted on the island's rim on the side we come from and leaning out over the water,
        // so that the dark crown also stands behind the first bird of the left arm (u 0.55, its raised bill and apricot pouch)
        const q = islands[0], dx = starAt.x - q[0], dz = starAt.z - q[1], dl = Math.hypot(dx, dz) || 1, ex = dx / dl, ez = dz / dl;
        const a = ptAt(0.54), b = ptAt(0.575), sd = (a.x - b.x) * -ez + (a.z - b.z) * ex < 0 ? -1 : 1;
        leanW = [q[0] + ex * 1.5 - ez * 10.4 * sd, q[1] + ez * 1.5 + ex * 10.4 * sd, 11.5, 6, [-ez * 7 * sd + ex * 0.8, ex * 7 * sd + ez * 0.8], true, r9];      // (rooted far enough in that both trunk sheets stand among the island's reeds)
        willow(...leanW);
      }
      for (const [ang, h] of [[0.72, 10.5], [-0.66, 12]]) {
        const w = [pool[0] + side * Math.cos(ang) * (pool[2] + 3), pool[1] + Math.sin(ang) * (pool[2] + 3), h, 6.2, [-side * Math.cos(ang) * 2.4, -Math.sin(ang) * 2.4], true, rx];
        willows.push(w); willow(...w);
      }
      // the lily pool's far bank: two more dark willows either side of the first, and willows on the far islands
      for (const [ang, h] of [[0.78, 11], [-0.7, 12.5], [-1.35, 10]]) {
        const w = [pool2[0] + s2 * Math.cos(ang) * (pool2[2] + 3), pool2[1] + Math.sin(ang) * (pool2[2] + 3), h, 6.4, [-s2 * Math.cos(ang) * 2.4, -Math.sin(ang) * 2.4], true, r5];
        willows.push(w); willow(...w);
      }
      for (const [ang, h] of [[0.5, 12.5], [-0.55, 10.5]]) {      // the entry bay's far bank
        const w = [pool3[0] + s2 * Math.cos(ang) * (pool3[2] + 3), pool3[1] + Math.sin(ang) * (pool3[2] + 3), h, 6.6, [-s2 * Math.cos(ang) * 2.6, -Math.sin(ang) * 2.6], true, r6];
        willows.push(w); willow(...w);
      }
      for (const q of northIsl) for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + r5.range(-0.4, 0.4), rr = q[2] * 0.42, w = [q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr, r5.range(10, 14), 7, [r5.range(-1.5, 1.5), 0], k !== 1, r5];
        farWillows.push(w); willow(...w);
      }
      for (const q of newIsl) for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + r6.range(-0.4, 0.4), rr = q[2] * 0.44, w = [q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr, r6.range(12, 17), 8.6, [r6.range(-1.5, 1.5), 0], k !== 1, r6];
        farWillows.push(w); willow(...w);
      }
    }
    const blobMesh = field(blobRows, {
      uniforms: { uBlob: { value: [lin(L.cloud[0]).multiplyScalar(0.85), lin(L.cloud[1]).multiplyScalar(0.85), P[3].clone().multiplyScalar(0.82), mixc(P[3], P[0], 0.42), darkC ? mixc(darkC, P[5], 0.3).multiplyScalar(0.8) : mixc(P[5], P[3], 0.35).multiplyScalar(0.8), darkC ? mixc(darkC, P[3], 0.2) : mixc(P[3], P[5], 0.5)] } },
      vert: /* glsl */`
        c = iA.xyz; float sz = iA.w;
        if (iC.x < 0.5) { c.x = mod(c.x - uTime * iB.w + 1700.0, 3400.0) - 1700.0; c.y += 2.5 * sin(uTime * 0.11 + iB.x * 20.0); }
        else if (iC.x < 1.5) c.xz += 0.035 * sz * vec2(sin(uTime * 0.9 + iB.x * 30.0), cos(uTime * 0.7 + iB.x * 17.0));
        vec3 tc = cameraPosition - c;
        T = normalize(vec3(tc.z, 0.0, -tc.x) + vec3(1e-4, 0.0, 0.0)) * sz * iB.y; W = vec3(0.0, sz, 0.0);
        P = vec4(iB.z, iC.x, sz, iB.x);`,
      fpars: 'uniform vec3 uBlob[6];',
      frag: /* glsl */`
        vec4 n = texture2D(uPaper, vQ * 0.55 + seed);
        if (vP.y < 1.5) {
          e = (1.0 - length(vQ * 2.0)) * 1.7 + (n.a - 0.5) * 1.5;
          if (vP.y < 0.5) { e = min(e, (vQ.y + 0.5) * 4.0 + 0.2 + (n.r - 0.5) * 0.8); farK = 0.3; }
        } else { e = (1.0 - abs(vQ.x) * 2.0) * 1.4 + (n.a - 0.5) * 0.8; e = min(e, (0.5 - vQ.y) * 8.0); }
        col = uBlob[int(vP.x + 0.5)];
        puv = vQ * vP.z * vec2(0.11, 0.2) + seed;`,
    });
    await ctx.yield();

    // ---------- the composed sky: a rank of cumulus along the northern horizon and one great stack over the thermal ----------
    // Painted on the sky itself (drawn straight after the dome, behind everything, no depth): each stack is a wide lilac
    // underside sheet, torn white sheets heaped over it and one sheet lit by the low sun, drifting west at their own speeds
    // so the sheets slip over one another. The great stack stands behind the column, its lilac underside behind the birds
    // and the cloud cap, its white head above them. As the climb begins (the lens 5-14 m up) they tear away to nothing
    // from their rims inward, and the climb has its own sky: the cloud's eye and the sun.
    {
      const rows = [], O = [-5, 100];
      const stack = (x, z, y0, S, n, tower) => {
        const sd = r7(), dr = tower ? 0 : r7.range(0.8, 1.7);
        rows.push([x, y0, z, S * (tower ? 1.25 : 1.0), sd, r7.range(2.0, 2.5), 1, dr, tower, 0, 0, 0]);
        for (let j = 1; j <= n; j++) {
          const k = j / n, lit = j === 2 || (tower && j === 4);
          rows.push([x + r7.range(-0.3, 0.3) * S * (1 - 0.5 * k), y0 + S * (0.1 + (tower ? 0.7 : 0.42) * k) + r7.range(-0.03, 0.03) * S, z, S * (0.86 - 0.42 * k) * r7.range(0.9, 1.1),
            sd + j * 0.17, r7.range(1.5, 2.0), lit ? 2 : 0, dr * r7.range(0.8, 1.25), tower, 0, 0, 0]);
        }
      };
      for (const [az, dist, y0, S] of [[-66, 1150, 100, 150], [-43, 1380, 135, 200], [-24, 1100, 85, 140], [-10, 1650, 170, 180], [19, 1500, 125, 205], [36, 1150, 90, 150], [55, 1320, 140, 190], [73, 1050, 95, 145]]) {
        const a = (az + r7.range(-4, 4)) * Math.PI / 180, d = dist * r7.range(0.94, 1.06);
        stack(O[0] + Math.sin(a) * d, O[1] - Math.cos(a) * d, y0, S * r7.range(0.9, 1.1), r7.int(3, 4), 0);
      }
      stack(44, -335, 132, 120, 5, 1);
      field(rows, {
        order: -2.8, params: { depthTest: false, depthWrite: false },
        uniforms: { uCum: { value: [mixc(lin(L.cloud[0]), P[0], 0.55).multiplyScalar(0.86), lin(L.cloud[1]).multiplyScalar(0.84),
          look.hour === 'morning' ? mixc(P[0], lin(L.cloud[1]), 0.3).multiplyScalar(0.86) : look.hour === 'dusk' ? mixc(lin(L.cloud[0]), lin(L.cloud[1]), 0.45).multiplyScalar(0.86) : mixc(P[1], lin(L.cloud[0]), 0.5).multiplyScalar(0.9)] } },
        vert: /* glsl */`
          c = iA.xyz; float sz = iA.w;
          c.x -= uTime * iB.w; c.y += 0.012 * sz * sin(uTime * 0.13 + iB.x * 20.0);
          vec3 tc = cameraPosition - c;
          T = normalize(vec3(tc.z, 0.0, -tc.x) + vec3(1e-4, 0.0, 0.0)) * sz * iB.y; W = vec3(0.0, sz, 0.0);
          P = vec4(iB.z, smoothstep(5.0, 14.0, cameraPosition.y), sz, iB.x);`,
        fpars: 'uniform vec3 uCum[3];',
        frag: /* glsl */`
          vec2 q = vQ * 2.0; vec4 n = texture2D(uPaper, vQ * vec2(0.9, 0.5) + seed), n2 = texture2D(uPaper, vQ * vec2(2.6, 1.4) + seed * 2.0);
          float s1 = fract(seed * 5.3) - 0.5, s2 = fract(seed * 9.7) - 0.5;
          // a heap of four round heads over a flat torn base
          float hp = max(max(1.0 - length((q - vec2(-0.5 + 0.1 * s1, -0.12)) / vec2(0.46, 0.52)), 1.0 - length((q - vec2(-0.08 + 0.2 * s2, 0.2 + 0.1 * s1)) / vec2(0.5, 0.72))),
            max(1.0 - length((q - vec2(0.42 + 0.1 * s2, 0.02)) / vec2(0.5, 0.6)), 1.0 - length((q - vec2(0.1, -0.3)) / vec2(0.86, 0.45))));
          if (vP.x > 0.5 && vP.x < 1.5) hp = 1.0 - length((q - vec2(0.0, 0.1)) / vec2(0.96, 0.5));       // the underside: one long low sheet
          e = hp * 1.5 + (n.a - 0.5) * 0.7 + (n2.r - 0.5) * 0.22;
          e = min(e, (q.y + 0.55) * 3.0 + 0.15 + (n.r - 0.5) * 0.5);
          e -= vP.y * 1.9;                                  // tearing away as the climb begins
          col = uCum[int(vP.x + 0.5)];
          farK = 0.3; tearK = 0.6;
          puv = vQ * vP.z * vec2(0.022, 0.04) + seed;`,
      });
    }
    await ctx.yield();

    // ---------- the land sheet: reed beds painted as torn green and straw papers, with a torn shoreline ----------
    const strawC = P[4].clone().multiplyScalar(0.9), greenC = P[3].clone().multiplyScalar(0.88), plumeC = lin(SE.plume).multiplyScalar(0.88);
    const SDF_GLSL = /* glsl */`
      uniform vec3 uLC, uPool, uPool2, uPool3, uChan[9], uIsl[16], uBay;
      float sdW(vec2 p) {
        float d = min(min(length(p - uLC.xy) - uLC.z, length(p - uPool.xy) - uPool.z), length(p - uPool2.xy) - uPool2.z);
        for (int i = 0; i < 8; i++) {
          vec2 a = uChan[i].xy, ba = uChan[i + 1].xy - a, pa = p - a;
          float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
          d = min(d, length(pa - ba * h) - mix(uChan[i].z, uChan[i + 1].z, h));
        }
        d = min(d, min(length(p - uBay.xy) - uBay.z, length(p - uPool3.xy) - uPool3.z));
        for (int i = 0; i < 16; i++) d = max(d, uIsl[i].z - length(p - uIsl[i].xy));
        return d;
      }`;
    const sdfU = { uLC: { value: new V3(LC[0], LC[1], LR) }, uPool: { value: new V3(pool[0], pool[1], pool[2]) }, uPool2: { value: new V3(pool2[0], pool2[1], pool2[2]) }, uPool3: { value: new V3(pool3[0], pool3[1], pool3[2]) }, uChan: { value: chan.map((c, i) => new V3(c[0], i ? c[1] : Z_BACK, c[2])) }, uIsl: { value: islands.map((c) => new V3(c[0], c[1], c[2])) }, uBay: { value: new V3(bay[0], bay[1], bay[2]) } };
    {
      const g = new THREE.CircleGeometry(3600, 48); g.rotateX(-Math.PI / 2); g.translate(0, 0.12, 0);
      const land = new THREE.Mesh(g, mat({ ...sdfU, uG0: { value: greenC }, uG1: { value: strawC }, uG2: { value: darkC ? mixc(darkC, P[3], 0.2).multiplyScalar(0.92) : mixc(P[3], P[5], 0.45) }, uLake: { value: mixc(P[2], P[0], 0.2) } }, /* glsl */`
        varying vec3 vW; varying float vDist;
        void main() { vW = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`, /* glsl */`
        varying vec3 vW; varying float vDist;
        uniform vec3 uG0, uG1, uG2, uLake;
        ${PAPER_GLSL}
        ${SDF_GLSL}
        void main() {
          vec2 w = vW.xz; float d = sdW(w), dist = length(vW - cameraPosition);
          float e = clamp(d / 2.4 + 0.03, 0.0, 1.0);
          vec4 a = texture2D(uPaper, w * vec2(0.031, 0.011) + 0.13), b = texture2D(uPaper, (mat2(0.8, 0.6, -0.6, 0.8) * w) * vec2(0.008, 0.021) + 0.61);
          vec3 col = uG0;
          col = mix(col, uG1, smoothstep(0.48, 0.52, a.a));
          col = mix(col, uG2, smoothstep(0.55, 0.58, b.a) * 0.8);
          col = mix(col, mix(uG0, uG1, 0.5) * 1.1, smoothstep(0.6, 0.62, b.r) * 0.6);
          col *= 0.86 + 0.26 * a.b;
          float lk = texture2D(uPaper, w / 700.0 + 0.27).a, lk2 = texture2D(uPaper, w / 260.0 + 0.5).r;
          float lake = smoothstep(60.0, 120.0, d) * max(smoothstep(0.6, 0.615, lk), (1.0 - smoothstep(0.03, 0.045, abs(lk2 - 0.5))) * step(0.35, lk));
          col = mix(col, uLake, lake);
          vec4 s = paperSheet(col, w / 9.0, e, 1.0 - 0.8 * smoothstep(60.0, 400.0, dist), 0.61, 1.0);
          if (s.a < 0.04) discard;
          gl_FragColor = vec4(paperFar(s.rgb, dist), 1.0);
        }`, { alphaToCoverage: false }));
      land.frustumCulled = false; above.add(land);
    }
    await ctx.yield();

    // ---------- reed walls and far tree lines as long torn bands, with flipped darker copies as reflections ----------
    {
      const G = { pos: [], dat: [], idx: [], n: 0 };
      let ribbonRng = ctx.rng, ribbonCut = null;
      const ribbon = (line, h, kind, rng = ribbonRng) => {
        let along = rng() * 60;
        for (let i = 0; i < line.length; i++) {
          if (i) along += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
          const zn = kind > 0.5 && kind < 1.5 && line[i][1] > 96 ? reach(line[i][1]) : null, hh = h * (0.8 + 0.4 * rng()) * (zn ? zn[0] : 1), kd = zn ? kind + zn[1] * 0.07 : kind;
          G.pos.push(line[i][0], 0, line[i][1], line[i][0], hh, line[i][1]); G.dat.push(along, 0, kd, hh, along, 1, kd, hh);
          if (i && !(ribbonCut && (ribbonCut(line[i]) || ribbonCut(line[i - 1])))) { const a = G.n + i * 2 - 2; G.idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
        }
        G.n += line.length * 2;
      };
      const split = (line, ok, h, kind) => { let cur = []; for (const q of line) { if (ok(q)) cur.push(q); else { if (cur.length > 1) ribbon(cur, h, kind); cur = []; } } if (cur.length > 1) ribbon(cur, h, kind); };
      const circle = (cx, cz, r, step) => { const n = Math.max(10, Math.round(TAU * r / step)), o = []; for (let i = 0; i <= n; i++) { const a = i / n * TAU; o.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return o; };
      const hR = gale ? 0.8 : 1;
      ribbonCut = (q) => bayD(q[0], q[1]) < 2;       // (the rim is open where the north bay joins: cut, with the same draws)
      split(circle(LC[0], LC[1], LR + 1.1, 4), (q) => chanD(q[0], q[1]) > 1.0, 2.8 * hR, 0);
      split(circle(LC[0], LC[1], LR + 2.6, 4), (q) => chanD(q[0], q[1]) > 2.4, 4.8 * hR, 1);
      split(circle(LC[0], LC[1], LR + 13, 6), (q) => chanD(q[0], q[1]) > 8, 13, 4);
      ribbonCut = null;
      await ctx.yield();
      for (const s of [-1, 1]) for (const [off, h, kind] of [[3.4, 3.9 * hR, 1], [5.5, 4.3 * hR, 1]]) {
        const line = [];
        for (let i = 0; i < 8; i++) { const a = chan[i], b = chan[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
          for (let k = 0, m = Math.ceil(len / 3); k < m; k++) { const t = k / m, w = lerp(a[2], b[2], t) + off; line.push([lerp(a[0], b[0], t) + nx * s * w, lerp(a[1], b[1], t) + nz * s * w]); } }
        ribbonCut = (q) => pool2D(q[0], q[1]) <= off * 0.7 || pool3D(q[0], q[1]) <= off * 0.7;
        split(line, (q) => Math.hypot(q[0] - LC[0], q[1] - LC[1]) > LR + 2 && poolD(q[0], q[1]) > off * 0.7, h, kind);
        ribbonCut = null;
        split(circle(pool[0], pool[1], pool[2] + off, 3), (q) => chanD(q[0], q[1]) > off * 0.7, h, kind);       // the backwater's own reed wall
      }
      split(circle(pool[0], pool[1], pool[2] + 11, 4), (q) => chanD(q[0], q[1]) > 22, 9.5, 4);                    // a dark tree line behind it
      await ctx.yield();
      {
        // the lily pool's reed wall and the dark tree line behind it (drawn with the fifth round's own random numbers)
        const keep = ribbonRng; ribbonRng = r5;
        for (const [off, h, kind] of [[3.4, 3.9 * hR, 1], [5.5, 4.3 * hR, 1]]) split(circle(pool2[0], pool2[1], pool2[2] + off, 3), (q) => chanD(q[0], q[1]) > off * 0.7, h, kind);
        split(circle(pool2[0], pool2[1], pool2[2] + 11, 4), (q) => chanD(q[0], q[1]) > 22, 9.5, 4);
        ribbonRng = keep;
      }
      {
        // the entry bay: a low green fringe (no tall wall) and a dark tree line behind it
        const keep = ribbonRng; ribbonRng = r6;
        split(circle(pool3[0], pool3[1], pool3[2] + 2.2, 3), (q) => chanD(q[0], q[1]) > 3.0, 2.3 * hR, 0);
        split(circle(pool3[0], pool3[1], pool3[2] + 10, 4), (q) => chanD(q[0], q[1]) > 20, 9.5, 4);
        ribbonRng = keep;
      }
      {
        // the north bay's own reed rim and the dark tree line behind it
        const keep = ribbonRng; ribbonRng = r6;
        const out = (m) => (q) => Math.hypot(q[0] - LC[0], q[1] - LC[1]) > LR + m;
        split(circle(bay[0], bay[1], bay[2] + 1.1, 4), out(1), 2.8 * hR, 0); split(circle(bay[0], bay[1], bay[2] + 2.6, 4), out(2.4), 4.8 * hR, 1); split(circle(bay[0], bay[1], bay[2] + 13, 6), out(13), 13, 4);
        ribbonRng = keep;
      }
      for (const q of islands) if (q[0] < 800) { const rq = northIsl.includes(q) ? r5 : newIsl.includes(q) ? r6 : ctx.rng; ribbon(circle(q[0], q[1], Math.max(1, q[2] - 0.8), 2.5), 2.3 * hR, 0, rq); ribbon(circle(q[0], q[1], Math.max(0.6, q[2] - 2.2), 2.5), 3.9 * hR, 1, rq); }
      // the reed walls behind the entry (seen through the previous portal)
      for (const s of [-1, 1]) for (const [off, h, kind] of [[3.4, 3.9 * hR, 1], [5.5, 4.3 * hR, 1]]) {
        const line = []; for (let z = Z_BACK; z >= 440; z -= 4) line.push([-17 + s * (5.4 + off), z]);
        ribbon(line, h, kind, rz);
      }
      await ctx.yield();
      // far tree lines; none may stand across the channel or the backwater (a pale wall and its mirror in the water path)
      const farOK = (q) => q[1] < 95 || Math.abs(q[0] + 12) > 95;
      ribbonCut = (q) => bayD(q[0], q[1]) < 16;
      split(circle(LC[0], LC[1], 300, 9), farOK, 10, 2); split(circle(LC[0] - 40, LC[1] + 30, 470, 14), farOK, 16, 3); split(circle(LC[0] + 60, LC[1], 820, 24), farOK, 24, 3);
      ribbonCut = null;
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); g.setAttribute('aData', new THREE.Float32BufferAttribute(G.dat, 4)); g.setIndex(G.idx);
      const tintV = U.uTint.value, mirrorC = mixc(P[5], darkC ?? P[3], darkC ? 0.35 : 0.14);
      mirrorC.setRGB(mirrorC.r / lerp(1, tintV.r, 0.75), mirrorC.g / lerp(1, tintV.g, 0.75), mirrorC.b / lerp(1, tintV.b, 0.75));
      const bandMat = (flip) => mat({ uFlip: { value: flip }, uMirror: { value: mirrorC }, uG0: { value: greenC }, uG1: { value: strawC }, uPlume: { value: plumeC }, uFar: { value: lin(L.far) } }, /* glsl */`
        attribute vec4 aData; uniform float uFlip, uTime, uBackK; uniform vec2 uWind, uGust;
        varying vec4 vD; varying float vDist;
        void main() {
          vec3 p = position;
          if (p.z > 338.3) p.y *= 1.0 - uBackK;
          float g = pow(0.5 + 0.5 * sin(dot(p.xz, uWind) * 0.11 - uTime * 1.57), 3.0) * uGust.x + uGust.y;
          p.xz += uWind * g * aData.y * min(aData.w, 5.0) * 0.17;
          p.y *= uFlip;
          if (uFlip < 0.0) {
            p.y *= 0.8;
            p.xz += 0.1 * aData.y * vec2(sin(p.y * 2.3 + uTime * 1.7 + p.z * 0.3), cos(p.y * 1.9 + uTime * 1.3 + p.x * 0.3));
            if (aData.z > 1.5 && aData.z < 3.5) p = vec3(0.0);      // far tree lines stand on land: no mirror
          }
          vD = aData;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`, /* glsl */`
        varying vec4 vD; varying float vDist;
        uniform vec3 uG0, uG1, uPlume, uFar, uDeep, uMirror; uniform float uFlip, uTime;
        ${PAPER_GLSL}
        void main() {
          float v = vD.y, kind = vD.z;
          vec4 n = texture2D(uPaper, vec2(vD.x * 0.17, v * 0.11) + kind * 0.31);
          float plume = uFlip < 0.0 ? 0.0 : smoothstep(0.62, 0.8, v + (n.r - 0.5) * 0.3);       // the mirror carries no pale plumes
          vec3 col = kind < 0.5 ? mix(uG0, mix(uG0, uDeep, 0.5), smoothstep(0.4, 0.6, n.b))
            : kind < 1.5 ? mix(mix(uG1, uG0, smoothstep(0.52, 0.6, n.a) * 0.8), uPlume, plume)
            : kind < 3.5 ? mix(uFar, uHaze, kind < 2.5 ? 0.0 : 0.35) : mix(uG0 * 0.72, uDeep, 0.3 + 0.4 * smoothstep(0.4, 0.6, n.b));
          float tone = kind > 0.6 && kind < 1.4 ? (kind - 1.0) / 0.07 : 0.0;          // the reach's own reed colour (see reach())
          col = mix(col, mix(uG1, uPlume, 0.3) * 1.04, clamp(tone, 0.0, 1.0) * 0.55 * (1.0 - plume));
          col = mix(col, mix(uG0, uDeep, 0.45), clamp(-tone, 0.0, 1.0) * 0.62);
          if (kind < 1.5) col = mix(col, uDeep, (1.0 - smoothstep(0.0, 0.4, v)) * 0.5);
          float edge = clamp((1.0 - v) * 1.9, 0.0, 1.0);
          if (uFlip < 0.0) {
            // the mirror: a darker, cooler sheet in the water's own deep colour that keeps the wall's streaks, torn into
            // sliding strips that open wider the further they lie from the bank, so the blue water shows between them
            float lum = dot(col, vec3(0.3, 0.5, 0.2));
            col = mix(uMirror * (0.62 + 0.62 * lum), col, 0.1);
            vec4 rp = texture2D(uPaper, vec2(vD.x * 0.021 + uTime * 0.006, v * vD.w * 0.33 - uTime * 0.012) + 0.43);
            float gap = rp.r - (0.24 + 0.34 * v);
            edge = min(edge, clamp(gap * 9.0 + 0.5, 0.0, 1.0));
            col = mix(col, uWhite, (1.0 - smoothstep(0.0, 0.05, abs(gap))) * 0.5 * step(0.0, gap));
          }
          vec4 s = paperSheet(col, vec2(vD.x, v * vD.w) / (kind < 1.5 ? 2.2 : 9.0), edge, 1.0 - 0.5 * smoothstep(100.0, 500.0, vDist), 0.2 + kind * 0.13, uFlip < 0.0 ? 0.0 : 0.6);
          if (s.a < 0.04) discard;
          gl_FragColor = vec4(paperFar(s.rgb, vDist), s.a);
        }`);
      const bands = new THREE.Mesh(g, bandMat(1)), refl = new THREE.Mesh(g, bandMat(-1));
      bands.frustumCulled = refl.frustumCulled = false; above.add(bands, refl);
    }
    await ctx.yield();

    // ---------- strips: reed clumps, iris, willow strands (camera-turned torn strips posed by a travelling gust) ----------
    const clumpGeo = (r, o) => {
      const pos = [], aS = [], aL = [], idx = []; let n = 0;
      const add = (kind, h, w, seg) => {
        const ox = r.range(-o.spread, o.spread), oz = r.range(-o.spread, o.spread), lx = r.range(-0.5, 0.5) * o.lean, lz = r.range(-0.5, 0.5) * o.lean, sd = r();
        for (let i = 0; i <= seg; i++) for (const v of [-1, 1]) { pos.push(ox, i / seg, oz); aS.push(v, w, h, kind); aL.push(lx, lz, sd, 0); }
        for (let i = 0; i < seg; i++) { const a = n + i * 2; idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
        n += (seg + 1) * 2;
      };
      for (let i = 0; i < o.nA; i++) add(0, o.hA * r.range(0.82, 1.12), o.wA, 3);
      for (let i = 0; i < o.nB; i++) add(1, o.hB * r.range(0.7, 1.15), o.wB, o.segB ?? 2);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 4));
      g.setAttribute('aL', new THREE.Float32BufferAttribute(aL, 4)); g.setIndex(idx);
      return g;
    };
    const stripField = (rows, geo, o) => {            // rows: [x, y, z, scale, seed, rot]
      const n = rows.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      rows.forEach((r, i) => { iA.set([r[0], r[1], r[2], r[3]], i * 4); iB.set([r[4], r[5], r[6] ?? 0, 0], i * 4); });
      const m = new THREE.Mesh(instanced(geo, Math.max(1, n), { iA, iB }), mat({
        uCA: { value: o.a }, uCB: { value: o.b }, uCP: { value: o.p }, uCS: { value: o.s ?? o.b }, uDown: { value: o.down ?? 1 }, uFlipK: { value: o.flip ?? 0 },
      }, /* glsl */`
        attribute vec4 aS, aL, iA, iB;
        uniform float uTime, uDown, uPx, uBackK; uniform vec2 uWind, uGust;
        varying vec4 vS; varying vec3 vK; varying float vDist, vTone;
        void main() {
          vTone = iB.z;
          float t = position.y, sc = iA.w, cr = cos(iB.y), sr = sin(iB.y);
          vec2 off = vec2(position.x * cr + position.z * sr, -position.x * sr + position.z * cr) * sc;
          vec3 base = vec3(iA.x + off.x, iA.y, iA.z + off.y);
          float sd = fract(aL.z + iB.x * 7.31), H = aS.z * sc * (0.85 + 0.3 * sd) * (base.z > 338.3 ? 1.0 - uBackK : 1.0);
          float gw = pow(0.5 + 0.5 * sin(dot(base.xz, uWind) * 0.11 - uTime * 1.57), 3.0);
          float g = gw * uGust.x + uGust.y + 0.1 * sin(uTime * 2.3 + sd * 40.0);
          vec2 lean = vec2(aL.x * cr + aL.y * sr, -aL.x * sr + aL.y * cr) + uWind * g * (uDown > 0.0 ? 0.3 : 0.42);
          vec3 p = base + vec3(lean.x * t * t * H, uDown * H * t * (1.0 - 0.18 * min(dot(lean, lean), 2.0) * t), lean.y * t * t * H);
          vec3 tc = cameraPosition - p;
          vec2 side = normalize(vec2(tc.z, -tc.x) + vec2(1e-4, 0.0));
          float hw = max(aS.y * sc, length(tc) * uPx * 0.8);
          p.xz += side * aS.x * hw;
          vS = vec4(aS.x, t, aS.w, sd); vK = vec3(H, gw, hw);
          vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv;
        }`, /* glsl */`
        varying vec4 vS; varying vec3 vK; varying float vDist, vTone;
        uniform vec3 uCA, uCB, uCP, uCS, uDeep, uShade; uniform float uFlipK;
        ${PAPER_GLSL}
        void main() {
          float v = vS.x, t = vS.y, kind = vS.z, sd = vS.w, prof;
          if (kind < 0.5) prof = mix(0.32, 1.0, smoothstep(0.62, 0.78, t)) * (1.0 - 0.7 * smoothstep(0.86, 1.0, t));
          else prof = 0.25 + 0.75 * sin(3.1416 * clamp(0.12 + 0.86 * t, 0.0, 1.0));
          float e = min(1.0 - abs(v) / max(prof, 0.05), (1.0 - t) * vK.x / max(vK.z, 1e-3) * 0.5);
          vec3 col = kind < 0.5 ? mix(uCA, uCP, smoothstep(0.62, 0.72, t)) : mix(uCB, uCS, uFlipK * smoothstep(0.6, 1.0, vK.y + sd * 0.35));
          col = mix(col, mix(uCA, uCP, 0.3) * 1.04, clamp(vTone, 0.0, 1.0) * 0.55);
          col = mix(col, mix(uCB, uDeep, 0.45), clamp(-vTone, 0.0, 1.0) * 0.62);
          col *= 0.84 + 0.3 * fract(sd * 5.3);
          col = mix(col, uDeep, (1.0 - smoothstep(0.0, 0.5, t)) * 0.5 * (1.0 - uFlipK));
          if (fract(sd * 3.7) < 0.13) col = mix(uShade, uDeep, 0.3);
          float fe = fwidth(e);
          vec4 s = paperSheet(col, vec2(v * vK.z, t * vK.x) / 0.6 + sd, clamp(e, 0.0, 1.0), 0.55 * (1.0 - 0.7 * smoothstep(20.0, 90.0, vDist)), sd, 0.6 * (1.0 - smoothstep(0.06, 0.25, fe)));
          if (s.a < 0.04) discard;
          gl_FragColor = vec4(paperFar(s.rgb, vDist), s.a);
        }`));
      m.frustumCulled = false; m.visible = n > 0; above.add(m);
      return m;
    };
    {
      const rr = rng.fork('reeds'), reedRows = [], irisRows = [], hR = gale ? 0.85 : 1;
      const rowsDef = [[0.4, 0.5], [1.1, 0.56], [1.9, 0.72], [2.8, 0.95]];
      for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
        const a = chan[i], b = chan[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len * s, nz = (b[0] - a[0]) / len * s;
        for (const [off, sp] of rowsDef) for (let d = rr() * sp; d < len; d += sp / (0.55 + 0.45 * detail)) {
          const t = d / len, w = lerp(a[2], b[2], t) + off + rr.range(-0.25, 0.25), x = lerp(a[0], b[0], t) + nx * w + rr.range(-0.2, 0.2), z = lerp(a[1], b[1], t) + nz * w;
          if (z > 404 || Math.hypot(x - LC[0], z - LC[1]) < LR + 0.3 || wetD(x, z) < 0.25) continue;
          reedRows.push([x, 0.1, z, rr.range(0.85, 1.2) * hR, rr(), rr() * TAU]);
          if (off < 0.5 && rr.chance(0.22)) irisRows.push([x - nx * 0.45, 0.1, z - nz * 0.45, rr.range(0.8, 1.2), rr(), rr() * TAU]);
        }
      }
      for (const s of [-1, 1]) for (const [off, sp] of rowsDef) for (let z = 404 + rz() * sp; z < 474; z += sp / (0.55 + 0.45 * detail) * (z > 440 ? 1.6 : 1)) {
        const x = -17 + s * (5.4 + off + rz.range(-0.25, 0.25)) + rz.range(-0.2, 0.2);
        reedRows.push([x, 0.1, z, rz.range(0.85, 1.2) * hR, rz(), rz() * TAU]);
        if (off < 0.5 && rz.chance(0.22)) irisRows.push([x - s * 0.45, 0.1, z, rz.range(0.8, 1.2), rz(), rz() * TAU]);
      }
      await ctx.yield();
      // the lagoon rim either side of the channel mouth
      for (let a = 0.9; a < 2.3; a += 0.0026) for (const off of [0.5, 1.4, 2.4]) {
        const r = LR + off + rr.range(-0.3, 0.3), x = LC[0] + Math.cos(a) * r, z = LC[1] + Math.sin(a) * r;
        if (chanD(x, z) < 0.3 || Math.hypot(x + 5.5, z - 117) > 62 || rr.chance(0.25)) continue;
        reedRows.push([x, 0.1, z, rr.range(0.85, 1.2) * hR, rr(), rr() * TAU]);
      }
      // the backwater's rim: four rows of clumps, thinner on the far bank
      for (const [off, sp] of rowsDef) for (let a = rx() * 0.02; a < TAU; a += sp / (pool[2] + off) / (0.55 + 0.45 * detail)) {
        const r = pool[2] + off + rx.range(-0.25, 0.25), x = pool[0] + Math.cos(a) * r, z = pool[1] + Math.sin(a) * r, far = path.nearestXZ(x, z).dist;
        if (chanD(x, z) < off + 0.3 || far > 30 && rx.chance(0.5)) continue;
        reedRows.push([x, 0.1, z, rx.range(0.85, 1.2) * hR, rx(), rx() * TAU]);
        if (off < 0.5 && far < 26 && rx.chance(0.3)) irisRows.push([x - Math.cos(a) * 0.45, 0.1, z - Math.sin(a) * 0.45, rx.range(0.8, 1.2), rx(), rx() * TAU]);
      }
      for (const [off, sp] of rowsDef) for (let a = r5() * 0.02; a < TAU; a += sp / (pool2[2] + off) / (0.55 + 0.45 * detail)) {
        const r = pool2[2] + off + r5.range(-0.25, 0.25), x = pool2[0] + Math.cos(a) * r, z = pool2[1] + Math.sin(a) * r, far = path.nearestXZ(x, z).dist;
        if (chanD(x, z) < off + 0.3 || far > 30 && r5.chance(0.5)) continue;
        reedRows.push([x, 0.1, z, r5.range(0.85, 1.2) * hR, r5(), r5() * TAU]);
        if (off < 0.5 && far < 26 && r5.chance(0.4)) irisRows.push([x - Math.cos(a) * 0.45, 0.1, z - Math.sin(a) * 0.45, r5.range(0.8, 1.2), r5(), r5() * TAU]);
      }
      for (const q of islands.slice(0, 3)) for (let a = 0; a < TAU; a += 0.6 / q[2]) for (const off of [0.4, 1.3]) if (rr.chance(0.8))
        reedRows.push([q[0] + Math.cos(a) * (q[2] - off + rr.range(-0.3, 0.3)), 0.1, q[1] + Math.sin(a) * (q[2] - off), rr.range(0.9, 1.25) * hR, rr(), rr() * TAU]);
      await ctx.yield();
      for (const r of reedRows) if (r[2] > 96) { const zn = reach(r[2]); r[3] *= zn[0]; r[6] = zn[1]; }      // each reach its own height and colour
      // the entry bay's fringe: low dark-green rush, thin enough to see the water through
      for (const [off, sp] of [[0.4, 0.62], [1.2, 0.8], [2.1, 1.1]]) for (let a = r6() * 0.03; a < TAU; a += sp / (pool3[2] + off) / (0.55 + 0.45 * detail)) {
        const r = pool3[2] + off + r6.range(-0.25, 0.25), x = pool3[0] + Math.cos(a) * r, z = pool3[1] + Math.sin(a) * r;
        if (chanD(x, z) < off + 2.6) continue;
        reedRows.push([x, 0.1, z, r6.range(0.5, 0.78) * hR, r6(), r6() * TAU, -0.8]);
        if (off < 0.5 && r6.chance(0.3)) irisRows.push([x - Math.cos(a) * 0.45, 0.1, z - Math.sin(a) * 0.45, r6.range(0.8, 1.2), r6(), r6() * TAU]);
      }
      stripField(reedRows, clumpGeo(rr, { nA: 2, nB: 2, hA: 3.5, hB: 2.0, wA: 0.11, wB: 0.085, spread: 0.3, lean: 0.22 }), { a: strawC, b: greenC, p: plumeC });
      stripField(irisRows, clumpGeo(rr, { nA: 2, nB: 3, hA: 1.0, hB: 0.8, wA: 0.075, wB: 0.035, spread: 0.16, lean: 0.3 }), { a: greenC, b: greenC, p: lin('#F6D648').multiplyScalar(0.9) });
      await ctx.yield();
      const strands = [], strandsDark = [];
      for (const [x, z, h, r, lean, dark] of willows) for (let i = 0, n = Math.round(130 * (0.6 + 0.4 * detail)); i < n; i++) {
        const a = rr() * TAU, q = Math.sqrt(rr()) , rad = r * (0.25 + 0.8 * q), y = h * (1.0 - 0.3 * q * q), px = x + lean[0] + Math.cos(a) * rad, pz = z + lean[1] + Math.sin(a) * rad;
        const low = sdfWater2(px, pz) < 0.5 ? 4.2 : 1.6;
        (dark ? strandsDark : strands).push([px, y, pz, Math.max(1.2, Math.min(rr.range(3.2, 6.2), y - low)), rr(), rr() * TAU]);
      }
      if (leanW) {                                   // the leaning willow's strands hang on the side of its crown that faces the horseshoe
        const [x, z, h, r, lean] = leanW, fx = starAt.x - x, fz = starAt.z - z, fa = Math.atan2(fz, fx);
        for (let i = 0; i < 30; i++) {
          const a = fa + r9.range(-1.5, 1.5), q = Math.sqrt(r9()), rad = r * (0.3 + 0.75 * q), y = h * (1.0 - 0.3 * q * q), px = x + lean[0] + Math.cos(a) * rad, pz = z + lean[1] + Math.sin(a) * rad;
          strandsDark.push([px, y, pz, Math.max(1.2, Math.min(r9.range(3.4, 6.2), y - 4.2)), r9(), r9() * TAU]);
        }
      }
      const strandGeo = clumpGeo(rr, { nA: 0, nB: 4, hA: 1, hB: 1, wA: 0.02, wB: 0.017, spread: 0.13, lean: 0.12, segB: 3 });
      stripField(strands, strandGeo, { a: greenC, b: P[3].clone().multiplyScalar(0.8), p: greenC, s: mixc(P[0], P[3], 0.22).multiplyScalar(0.86), down: -1, flip: 1 });
      stripField(strandsDark, strandGeo, { a: greenC, b: darkC ? mixc(darkC, P[3], 0.25).multiplyScalar(0.86) : mixc(P[3], P[5], 0.5).multiplyScalar(0.78), p: greenC, s: P[3].clone().multiplyScalar(0.82), down: -1, flip: 1 });
    }
    await ctx.yield();

    // ---------- flat sheets on the water: lily pads with their shadows, duckweed, rain rings, whitecaps, the tear's hole ----------
    const rf = rng.fork('flora'), flat = [], bill = [];
    const tan = (u) => path.tangentAt(u, _q), at = (u) => path.pointAt(u, _p);
    const beside = (u, lat) => { at(u); tan(u); const l = Math.hypot(_q.x, _q.z) || 1; return [_p.x + (-_q.z / l) * lat, _p.z + (_q.x / l) * lat]; };   // lat > 0 = right of the path
    const pad = (x, z, r) => flat.push([x, z, r, 0, rf(), 0, rf(), rf(), 0, 0, 0, 0]);
    const lilyOpen = look.hour === 'dusk' ? 0 : 1;
    const flower = (x, z, s) => bill.push([x, 0.05, z, s, rf(), rf.chance(0.3) ? 3 : 2, 0, 0, 0, 0, rf(), 0]);
    // a pad is the water's skin and lies wherever it fell; its flower is a body, and none of the carpet's stands within 2.4 m of our line
    // (in plan) on the stretches flown within 2.5 m of the surface: such a flower is dealt as ever and then left out, its pad stays
    const lowLine = []; for (let i = 0; i < 1000; i++) { const r0 = PT[i], r1 = PT[i + 1]; if (Math.min(Math.abs(r0.y), Math.abs(r1.y)) <= 2.5) lowLine.push(r0.x, r0.z, r1.x - r0.x, r1.z - r0.z); }
    const onLowLine = (x, z) => {
      for (let i = 0; i < lowLine.length; i += 4) {
        const px = x - lowLine[i], pz = z - lowLine[i + 1]; if (Math.abs(px) + Math.abs(pz) > 4.5) continue;
        const dx = lowLine[i + 2], dz = lowLine[i + 3], t = clamp((px * dx + pz * dz) / (dx * dx + dz * dz || 1), 0, 1), ex = px - dx * t, ez = pz - dz * t;
        if (ex * ex + ez * ez < 2.4 * 2.4) return true;
      }
      return false;
    };
    {
      const nCarpet = Math.round(1150 * SE.lily * dens * (0.6 + 0.4 * detail)), deep = look.season === 'summer' ? 105 : 86;
      for (let i = 0, g = 0; i < nCarpet && g < nCarpet * 4; g++) {
        if ((g & 255) === 255) await ctx.yield();
        const z = 119 - Math.pow(rf(), 1.25) * deep, x = -6 + rf.gauss() * (10 + (119 - z) * 0.32);
        if (sdfWater(x, z) > -0.5 || Math.hypot(x, z) < 34) continue;
        const r = rf.range(0.24, 0.52); pad(x, z, r); i++;
        if (rf.chance(0.13)) { flower(x + rf.range(-0.2, 0.2), z + rf.range(-0.2, 0.2), rf.range(0.3, 0.42)); const fl = bill[bill.length - 1]; if (onLowLine(fl[0], fl[2])) bill.pop(); }
      }
      await ctx.yield();
      for (let i = 0, n = Math.round(520 * SE.lily * (0.6 + 0.4 * detail)); i < n; i++) {          // pads hugging the reed foot down the channel
        if ((i & 127) === 127) await ctx.yield();
        const u = rf.range(-0.02, uIn + 0.01), lat = (rf.chance(0.5) ? 1 : -1) * rf.range(2.0, 5.2), q = beside(Math.max(u, 0), lat);
        if (u < 0) q[1] += -u * PL;
        const d = sdfWater(q[0], q[1]); if (d > -0.35 || d < -2.6 && rf.chance(0.7)) continue;
        pad(q[0], q[1], rf.range(0.22, 0.46));
        if (rf.chance(0.1)) flower(q[0], q[1], rf.range(0.28, 0.38));
      }
      await ctx.yield();
      for (let i = 0, n = Math.round(1500 * detail); i < n; i++) {                                   // duckweed confetti under the bill
        if ((i & 255) === 255) await ctx.yield();
        const q = beside(rf.range(0, uIn), rf.range(-4.4, 4.4));
        flat.push([q[0], q[1], rf.range(0.035, 0.075), 0, rf(), 1, rf(), rf(), 0, 0, 0, 0]);
      }
      if (shower) for (let i = 0, n = Math.round(700 * detail); i < n; i++) {
        const u = rf.range(0, 0.66), q = beside(u, rf.gauss() * (u > uOut ? 26 : 3.2));
        flat.push([q[0], q[1], rf.range(0.25, 0.6), 0, rf(), 2, rf(), 0, 0, 0, 0, 0]);
      }
      if (gale) for (let i = 0, n = Math.round(420 * detail); i < n; i++) {
        const a = rf() * TAU, r = Math.sqrt(rf()) * 200;
        flat.push([LC[0] + Math.cos(a) * r, LC[1] + Math.sin(a) * r, rf.range(1.2, 3.2), 0, rf(), 3, rf(), 0, 0, 0, 0, 0]);
      }
    }
    await ctx.yield();
    {
      // the backwater's lilies (clear of its fishers), fish jumping among them, rings where they fell
      for (let i = 0, n = Math.round(260 * Math.min(SE.lily, 1.5) * (0.6 + 0.4 * detail)); i < n; i++) {
        if ((i & 63) === 63) await ctx.yield();
        const a = rx() * TAU, r = Math.sqrt(rx()) * (pool[2] - 0.6), x = pool[0] + Math.cos(a) * r, z = pool[1] + Math.sin(a) * r, rad = rx.range(0.26, 0.56), fl = rx.chance(0.16);
        if (path.nearestXZ(x, z).dist < 2.4 || extraAt.some((o) => Math.hypot(o.x - x, o.z - z) < 1.5)) continue;
        pad(x, z, rad); if (fl) flower(x + 0.1, z - 0.1, rx.range(0.3, 0.42));
      }
      for (let i = 0; i < 70; i++) {
        const q = beside(rx.range(0.146, 0.205), ps * rx.range(2.3, 8)), rad = rx.range(0.3, 0.6), fl = rx.chance(0.2);
        if (wetD(q[0], q[1]) > -0.5 || extraAt.some((o) => Math.hypot(o.x - q[0], o.z - q[1]) < 1.4)) continue;
        pad(q[0], q[1], rad); if (fl) flower(q[0] + 0.1, q[1] - 0.1, rx.range(0.3, 0.42));
      }
      for (let i = 0; i < 16; i++) {
        const o = extraAt[2 + (i % 8)], a = rx() * TAU, r = rx.range(1.6, 4.2), x = o.x + Math.cos(a) * r, z = o.z + Math.sin(a) * r;
        if (wetD(x, z) > -0.8 || path.nearestXZ(x, z).dist < 4.6) continue;
        bill.push([x, 0, z, rx.range(0.4, 0.54), rx(), 7, rx(), rx.range(0.4, 0.8), rx.range(1.4, 2.6), 0, rx(), 0]);
        flat.push([x, z, rx.range(0.3, 0.55), 0, rx(), 2, rx(), 0, 0, 0, 0, 0]);
      }
      // inside the bend of the horseshoe (u 0.585-0.63): fish leaping 3-12 m from the lens and rings sliding under the bill,
      // laid where the gaze falls there (the route ahead blended with the tracking aim)
      const gz = new V3(), gd = new V3();
      await ctx.yield();
      for (let i = 0; i < 330; i++) {
        if ((i & 63) === 63) await ctx.yield();
        const u = i < 180 ? 0.596 + 0.01 * rx() : 0.586 + 0.042 * rx(), c0 = ptAt(u), w = 0.9 * bell(u, 0.44, 0.625, 0.22), d = i < 260 ? rx.range(3.6, 12.5) : rx.range(2.2, 10), a = rx.range(-0.5, 0.5);      // (a shoal boils where the bend begins)
        gd.copy(ptAt(clamp(u + 14 / PL, 0, 1))).sub(c0).normalize().multiplyScalar(1 - w).addScaledVector(gazeW(u, gz).sub(c0).normalize(), w); gd.y = 0; gd.normalize();
        const x = c0.x + d * (gd.x * Math.cos(a) - gd.z * Math.sin(a)), z = c0.z + d * (gd.z * Math.cos(a) + gd.x * Math.sin(a));
        if (path.nearestXZ(x, z).dist < (i < 260 ? 2.1 : 0.8) || hero.fisherList.some((b) => Math.hypot(b.c[0] - x, b.c[1] - z) < (i < 260 ? 1.8 : 1.2))) continue;
        if (i < 260) bill.push([x, 0, z, rx.range(0.42, 0.58), rx(), 7, rx(), rx.range(0.4, 0.8), rx.range(1.0, 1.9), 0, rx(), 0, 1.8]);      // (the 13th: its keep-out from a fisher, as above)
        else flat.push([x, z, rx.range(0.5, 1.0), 0, rx(), 2, rx(), 0, 0, 0, 0, 0]);
      }
    }
    await ctx.yield();
    {
      // behind the entry: pads and lilies hugging the reed feet, duckweed sliding down the middle (drawn only for the lens
      // that looks in through the previous world's portal from behind the first path point)
      for (let i = 0, n = Math.round(230 * Math.min(SE.lily, 1.5) * (0.6 + 0.4 * detail)); i < n; i++) {
        const z = 339 + 130 * Math.pow(rz(), 1.4), sd = rz.sign(), x = -17 + sd * (5.15 - 2.9 * Math.pow(rz(), 1.7)), r = rz.range(0.24, 0.5), fl = rz.chance(0.12);
        flat.push([x, z, r, 0, rz(), 0, rz(), rz(), 0, 0, 0, 0]);
        if (fl) bill.push([x + 0.1, 0.05, z - 0.1, rz.range(0.3, 0.4), rz(), rz.chance(0.3) ? 3 : 2, 0, 0, 0, 0, rz(), 0]);
      }
      for (let i = 0, n = Math.round(420 * detail); i < n; i++) flat.push([-17 + rz.range(-4.4, 4.4), 340 + 110 * rz(), rz.range(0.035, 0.075), 0, rz(), 1, rz(), rz(), 0, 0, 0, 0]);
    }
    await ctx.yield();
    {
      // the lily pool: white lilies in flower from bank to bank, clear of its pelicans and of the route past its mouth
      for (let i = 0, n = Math.round(430 * Math.min(SE.lily, 1.5) * (0.6 + 0.4 * detail)); i < n; i++) {
        if ((i & 63) === 63) await ctx.yield();
        const a = r5() * TAU, r = Math.sqrt(r5()) * (pool2[2] - 0.5), x = pool2[0] + Math.cos(a) * r, z = pool2[1] + Math.sin(a) * r, rad = r5.range(0.3, 0.66), fl = r5.chance(0.3);
        if (path.nearestXZ(x, z).dist < 2.3 || extraAt.some((o) => Math.hypot(o.x - x, o.z - z) < 1.5)) continue;
        flat.push([x, z, rad, 0, r5(), 0, r5(), r5(), 0, 0, 0, 0]);
        if (fl) bill.push([x + 0.1, 0.05, z - 0.1, r5.range(0.36, 0.52), r5(), r5.chance(0.25) ? 3 : 2, 0, 0, 0, 0, r5(), 0]);
      }
      await ctx.yield();
      // the entry bay and the mere: pads and white flowers from bank to bank (the route itself stays open water)
      for (let i = 0, n = Math.round(520 * Math.min(SE.lily, 1.5) * (0.6 + 0.4 * detail)); i < n; i++) {
        let x, z;
        if (i % 120 === 119) await ctx.yield();
        if (i % 3 === 0) { const a = r6() * TAU, r = Math.sqrt(r6()) * (pool3[2] - 0.5); x = pool3[0] + Math.cos(a) * r; z = pool3[1] + Math.sin(a) * r; }
        else { z = r6.range(104, 152); x = lerp(chan[7][0], chan[6][0], clamp((z - 130) / 26, 0, 1)) + r6.range(-1, 1) * 21; }
        const rad = r6.range(0.3, 0.7), fl = r6.chance(0.32), sd = r6(), s1 = r6(), s3 = r6(), s4 = r6(), s5 = r6();
        if (wetD(x, z) > -0.5 || path.nearestXZ(x, z).dist < (i % 3 === 0 ? 2.3 : 1.7) || extraAt.some((o) => Math.hypot(o.x - x, o.z - z) < 1.5)) continue;
        flat.push([x, z, rad, 0, sd, 0, s1, s3, 0, 0, 0, 0]);
        if (fl) bill.push([x + 0.1, 0.05, z - 0.1, 0.36 + 0.2 * s4, s5, s4 < 0.25 ? 3 : 2, 0, 0, 0, 0, s1, 0]);
      }
      await ctx.yield();
      // seen from the climb: rafts of lily pads lying on the far half of the lagoon, round the willow islands and along the reed rim
      for (let i = 0, g = 0; i < 46 && g < 500; g++) {
        const q = northIsl.length && g % 3 < 2 ? northIsl[g % northIsl.length] : null, a = r5() * TAU, rd = q ? q[2] + r5.range(3, 20) : r5.range(40, 200), r = r5.range(3.4, 8.2);
        const x = (q ? q[0] : LC[0]) + Math.cos(a) * rd, z = (q ? q[1] : LC[1]) + Math.sin(a) * rd;
        if (z > -54 || sdfWater2(x, z) > -r * 0.7 - 1 || Math.hypot(x - 30, z + 195) < 16) continue;
        flat.push([x, z, r, 0, r5(), 7, 0, r5(), 0, 0, 0, 0]); i++;
      }
      for (let i = 0, g = 0; newIsl.length && i < 18 && g < 240; g++) {      // and round the islands of the far half and the north bay
        const q = newIsl[g % newIsl.length], a = r6() * TAU, rd = q[2] + r6.range(4, 26), r = r6.range(5, 10.5), x = q[0] + Math.cos(a) * rd, z = q[1] + Math.sin(a) * rd;
        if (sdfWater3(x, z) > -r * 0.7 - 1 || Math.hypot(x - 30, z + 195) < 16) continue;
        flat.push([x, z, r, 0, r6(), 7, 0, r6(), 0, 0, 0, 0]); i++;
      }
    }
    {
      // The open water of the last reaches (u 0.25-0.34) is laid with more paper, in the picture as the lens has it there:
      // large torn sheets of deeper teal lie across the route (a smaller, deeper sheet torn over each, a hairline of white
      // at every join), a torn honey-yellow strip of sun beside them, and off the lily pool's mouth (u 0.25) the near
      // water carries a notched pad with a white lily on the left, a drift of duckweed confetti on the right and two
      // slow torn rings between them, so the lower part of an upright screen is as busy as the wide one's.
      const gz = (u) => {                            // the lens at u and its level gaze (the route ahead, turned by the lily pool's poi)
        at(u); const cx = _p.x, cz = _p.z; path.posAtDist(Math.min(u * PL + 14, PL), _q).sub(_p).normalize();
        const w = bell(u, 0.224, 0.288, 0.3) * 0.74;
        if (w > 0.001) { const tx = pool2[0] - s2 * 4 - cx, tz = pool2[1] - 9 - cz, tl = Math.hypot(tx, 1 - _p.y, tz) || 1; _q.multiplyScalar(1 - w); _q.x += tx / tl * w; _q.z += tz / tl * w; }
        const l = Math.hypot(_q.x, _q.z) || 1;
        return [cx, cz, _q.x / l, _q.z / l];
      };
      const put = (g, d, lat) => [g[0] + g[2] * d - g[3] * lat, g[1] + g[3] * d + g[2] * lat];      // d metres ahead, lat to the right
      const sheets = [[0.25, 3.5, -0.5, 3.3, 0.4], [0.2735, 3.6, 1.1, 2.5, 0.46], [0.297, 3.5, -0.7, 3.1, 0.4], [0.3185, 3.7, 0.9, 2.6, 0.44], [0.34, 3.6, -0.3, 3.2, 0.4]];
      for (const [u, d, lat, r, wz] of sheets) { const g = gz(u), q = put(g, d, lat); flat.push([q[0], q[1], r, 0, r9(), 9, r9(), wz, 0, 0, 0, 0]); }
      // (a glint swells and thins with time; these three are phased to be half open in a still taken at 12 s or at 40 s)
      for (const [u, d, lat, r, sd] of [[0.25, 4.3, -3.0, 1.8, 0.1395], [0.297, 4.4, -1.7, 1.6, 0.2966], [0.34, 4.6, 1.5, 1.7, 0.4536]]) { const g = gz(u), q = put(g, d, lat); flat.push([q[0], q[1], r, 0, sd, 8, r9(), 0, 0, 0, 0, 0]); }
      const g = gz(0.25);
      { // (the pad's notch is turned toward the lens and to the right, its lily stands on the far half)
        const q = put(g, 2.0, -0.92), nx = -g[2] - 0.8 * g[3], nz = -g[3] + 0.8 * g[2], f = put(g, 2.12, -1.04);
        flat.push([q[0], q[1], 0.46, 0, ((Math.atan2(nz, nx) / TAU) % 1 + 1) % 1, 0, r9(), 0.12 * r9(), 0, 0, 0, 0]); bill.push([f[0], 0.05, f[1], 0.42, r9(), 2, 0, 0, 0, 0, r9(), 0]);
      }
      for (const [d, lat, r, ph] of [[2.6, 0.3, 0.44, 0.62], [3.5, -0.35, 0.58, 0.85]]) { const q = put(g, d, lat); flat.push([q[0], q[1], r, 0, r9(), 10, ph, 0, 0, 0, 0, 0]); }
      for (let i = 0; i < 44; i++) {
        const t = (i + r9()) / 44, d = t < 0.5 ? lerp(1.5, 2.3, t * 2) : lerp(2.3, 3.5, t * 2 - 1), lat = t < 0.5 ? lerp(0.32, 0.85, t * 2) : lerp(0.85, 1.25, t * 2 - 1);
        const q = put(g, d + r9.gauss() * 0.14, lat + r9.gauss() * 0.16);
        flat.push([q[0], q[1], r9.range(0.04, 0.085), 0, r9(), 12, r9(), r9(), 0, 0, 0, 0]);
      }
    }
    await ctx.yield();
    const holeAt = at(uIn).clone();
    flat.push([holeAt.x, holeAt.z, 2.3, 0, 0.3, 5, uIn, 0, 0, 0, 0, 0]);
    // frogs on their own pads (they leap as we come), herons' pads, dragonflies, cormorants, the tear's scraps
    const frogs = Math.round(40), heronSpots = [];
    const frog = (u, sd, lat, size, lead, r, out = 1) => {     // out 1: leaps in ahead of the bill; -1: leaps away toward the reeds
      const q = beside(u, sd * lat);
      if (sdfWater(q[0], q[1]) > -0.6 || extraAt.some((o) => !o.e.p2 && Math.hypot(o.x - q[0], o.z - q[1]) < 1.3)) return;
      tan(u); const l = Math.hypot(_q.x, _q.z) || 1, dx = _q.x / l * 0.8 + out * sd * (_q.z / l), dz = _q.z / l * 0.8 - out * sd * (_q.x / l), dl = Math.hypot(dx, dz);
      pad(q[0], q[1], size * 1.45);
      bill.push([q[0], 0.06, q[1], size, r(), 0, u - lead / PL, 0, dx / dl, dz / dl, 0, 0]);
    };
    for (let i = 0; i < frogs; i++) {
      const u = i < 30 ? rf.range(0.03, uIn - 0.014) : rf.range(uOut + 0.02, uOut + 0.1), sd = rf.sign();
      frog(u, sd, rf.range(2.3, 3.7), 0.36, 11, rf);
    }
    // marsh frogs close under the bill: they sit until we are almost on them, then leap aside
    for (let i = 0; i < 12; i++) frog(0.03 + (uIn - 0.05) * (i + rx()) / 12, i % 2 ? 1 : -1, rx.range(1.6, 2.1), rx.range(0.34, 0.4), 6.5, rx, -1);
    for (const [u, sd] of [[0.126, 1], [0.2558, -ps], [0.3458, 1]]) frog(u, sd, 1.55, 0.42, 5, rx, -1);
    for (const [u, lat] of [[0.059, 4.1], [0.179, -ps * 4.2], [0.2475, s2 * 3.4], [uOut + 0.046, 6.5], [uOut + 0.066, -7.2]]) {
      let q = beside(u, lat * (pinch >= 4 && Math.abs(u - 0.2) < 0.12 ? 0.86 : 1));
      for (let k = 0; k < 6 && sdfWater(q[0], q[1]) > -0.9; k++) q = beside(u, lat * (0.9 - 0.1 * k));
      pad(q[0], q[1], 0.75); pad(q[0] + 0.7, q[1] - 0.5, 0.45);
      at(u); tan(u); const hl = Math.hypot(_q.x, _q.z) || 1;
      heronSpots.push({ x: q[0], z: q[1], u, lat: ((q[0] - _p.x) * -_q.z + (q[1] - _p.z) * _q.x) / hl });
    }
    {
      // the opening picture's own subject: a squacco heron on a pad a dozen metres inside the entry, on the left; it lifts
      // as we come in and crosses low and close ahead of the bill at u 0.02
      const u = 0.0205, q = beside(u, -4.0);
      flat.push([q[0], q[1], 0.75, 0, r5(), 0, r5(), r5(), 0, 0, 0, 0], [q[0] + 0.7, q[1] - 0.5, 0.45, 0, r5(), 0, r5(), r5(), 0, 0, 0, 0]);
      heronSpots.push({ x: q[0], z: q[1], u, lat: -4.0, chan: true, yFly: 1.42 });
    }
    // the paper dragonflies: each hops about inside its own box, and the box stands beside our line, never across it: long beside the
    // route, narrow across it. The value dealt for its place across the channel gives its side and how far beyond the floor it stands;
    // the floor is 2 m of clear air between the lens and the sheet at its furthest reach (the box's nearest face, less the sheet's half
    // diagonal), measured against the route's table from its start to its end (the route curves, so not only the stretch at the box's own
    // u): the box is tried at its dealt place and then stood off by what it lacks, up to twelve times; if the twelfth try is still short
    // it is stood off once more by what that try lacked, and the row is kept.
    // [x, z of the box's middle, the route's heading there (the box's long axis)]
    // (across the route the box is 1.0 m and the dragonflies' sheets are 0.5 to 0.72 m, so it is about 1.4 to 2 sheets wide:
    // narrower and the dragonfly slides on a rail; wider and the box's middle stands further off, its nearer face staying where it is)
    const FLY_L = 7.0, FLY_W = 1.0, FLY_H = 1.4;     // the box: beside the route, across it, its height (the hop in the shader is written with these same numbers)
    const flyBox = (u, g, y, s) => {
      at(u); tan(u); const l = Math.hypot(_q.x, _q.z) || 1, tx = _q.x / l, tz = _q.z / l, px = _p.x, pz = _p.z, side = g < 0 ? -1 : 1;
      const need = 2.02 + 0.7072 * s, hl = FLY_L / 2, hw = FLY_W / 2, hh = FLY_H / 2 + 0.06;
      let lat = need + hw + Math.abs(g) * 2.6, cx = 0, cz = 0, gap = 0;
      for (let k = 0; k < 12; k++) {
        cx = px - tz * side * lat; cz = pz + tx * side * lat;
        gap = 1e9;
        for (let i = 0; i < 1000; i++) {
          const r0 = PT[i], r1 = PT[i + 1];
          if (Math.abs(r0.x - cx) + Math.abs(r0.z - cz) > 16) continue;
          for (let m = 0; m < 4; m++) {
            const f = m / 4, rx = r0.x + (r1.x - r0.x) * f - cx, ry = r0.y + (r1.y - r0.y) * f - y, rz = r0.z + (r1.z - r0.z) * f - cz;
            gap = Math.min(gap, Math.hypot(Math.max(Math.abs(rx * tx + rz * tz) - hl, 0), Math.max(Math.abs(rz * tx - rx * tz) - hw, 0), Math.max(Math.abs(ry) - hh, 0)));
          }
        }
        if (gap >= need) break;
        lat += need - gap + 0.01;
      }
      if (gap < need) { cx = px - tz * side * lat; cz = pz + tx * side * lat; }      // (short after the twelfth try: stood off once more, by the lack already added)
      return [cx, cz, tx, tz];
    };
    for (let i = 0, n = Math.round(60 * (0.7 + 0.3 * detail)); i < n; i++) {
      const u = i % 3 === 2 ? rf.range(uOut, 0.52) : rf.range(0, uIn), g = rf.gauss(), y = rf.range(0.9, 2.5), s = rf.range(0.5, 0.72), q = flyBox(u, g, y, s);
      bill.push([q[0], y, q[1], s, rf(), 1, 0, 0, q[2], q[3], 0, 0]);
    }
    if (look.cormorants) for (let i = 0; i < 40; i++) {
      const sd = rf.sign(), x = -7 + sd * rf.range(6, 30), z = rf.range(42, 64);
      if (sdfWater(x, z) < -2) bill.push([x, 0, z, rf.range(0.6, 0.8), rf(), 4, 0, 0, 0, 0, rf(), 0]);
    }
    const exitAt = at(uOut).clone();
    for (let i = 0, n = Math.round(110 * detail); i < n; i++) {
      const first = i % 3 === 0, o = first ? holeAt : exitAt, uT = first ? uIn - 0.007 : uOut - 0.004;
      bill.push([o.x + rf.range(-1.2, 1.2), 0.1, o.z + rf.range(-1.2, 1.2), rf.range(0.12, 0.34), rf(), 5, uT + rf() * 0.005, rf.range(3, 8), rf.range(-3, 3), rf.range(-7, -1), 0, 0]);
    }
    for (let i = 0, n = Math.round(250 * detail); i < n; i++) {                          // white down rising beside the climb
      at(rf.range(0.6, 0.995)); const a = rf() * TAU, r = rf.range(2.6, 12);
      bill.push([_p.x + Math.cos(a) * r, _p.y + rf.range(-8, 8), _p.z + Math.sin(a) * r, rf.range(0.2, 0.46), rf(), 6, 0, 0, 0, 0, rf(), 0]);
    }
    for (let i = 0, n = Math.round(90 * detail); i < n; i++) {
      at(rf.range(0.88, 1.0)); const a = rf() * TAU, r = rf.range(2.4, 7);
      bill.push([_p.x + Math.cos(a) * r, _p.y + rf.range(-6, 10), _p.z + Math.sin(a) * r, rf.range(0.2, 0.42), rf(), 6, 0, 0, 0, 0, rf(), 0]);
    }
    const flatField = (rows, parent) => field(rows, {
      parent, uniforms: { uGlint: { value: look.hour === 'dusk' ? lin('#DCE4FF').multiplyScalar(0.84) : mixc(P[6], lin('#FFC548'), 0.78) }, uPadA: { value: P[3].clone().multiplyScalar(0.8) }, uPadB: { value: darkC ? mixc(darkC, P[3], 0.35).multiplyScalar(0.9) : mixc(P[3], P[5], 0.45).multiplyScalar(0.9) },
        uSheetA: { value: mixc(P[2], P[5], 0.5).multiplyScalar(0.96) }, uSheetB: { value: mixc(P[2], P[5], 0.82).multiplyScalar(0.94) } },
      vert: /* glsl */`
        float kind = iB.y, r = iA.z, wz = 1.0;
        c = vec3(iA.x, 0.03 + 0.014 * fract(iB.x * 9.0), iA.y);
        if (kind < 0.5) { r *= 1.35; c.y += 0.012 * sin(uTime * 1.6 + iB.x * 50.0); }
        else if (kind < 1.5) { float qd = fract(uTime * 0.07 + iB.z); c.z += (0.5 - qd) * 11.0; r *= sin(3.1416 * qd); }
        else if (kind < 2.5) { float qd = fract(uTime * 0.45 + iB.z); r *= 0.25 + qd; P.z = qd; }
        else if (kind < 3.5) { float qd = fract(uTime * 0.12 + iB.z); c.xz += uWind * (qd - 0.5) * 16.0; r *= sin(3.1416 * qd); }
        else if (kind > 11.5) { float qd = fract(uTime * 0.04 + iB.z); c.xz += vec2(0.9, 0.4) * (qd - 0.5); c.y = 0.046; r *= smoothstep(0.0, 0.1, qd) * (1.0 - smoothstep(0.9, 1.0, qd)) * (1.0 - uUnderK); }      // duckweed that keeps to its drift
        else if (kind > 9.5) { float qd = fract(uTime * 0.14 + iB.z); r *= (0.4 + 0.6 * qd) * (1.0 - uUnderK); P.z = qd; c.y = 0.05; }                                                              // a slow ring
        else if (kind > 8.5) { c.y = 0.014 + 0.006 * fract(iB.x * 9.0); c.x += 0.45 * sin(uTime * 0.21 + iB.x * 20.0); c.z += 0.2 * sin(uTime * 0.17 + iB.x * 31.0); r *= 1.0 - uUnderK; wz = iB.w; }        // a sheet of deeper teal sliding on the water
        else if (kind > 7.5) { c.y = 0.05; r *= 0.62 + 0.38 * sin(uTime * 1.9 + iB.x * 40.0); c.x += 0.5 * sin(uTime * 0.6 + iB.x * 17.0); }      // a glint: a torn strip of low sun that swells and thins
        else if (kind > 6.5) { c.y = 0.05; }
        else if (kind > 5.5) { float age = (uU - iB.z) * 40.0; r *= step(0.0, age) * (0.35 + 0.9 * sqrt(max(age, 0.0))); P.z = clamp(age / 1.9, 0.0, 1.0); c.y = 0.045; }
        else if (kind > 4.5) { r *= smoothstep(iB.z - 0.05, iB.z - 0.02, uU); c.y = 0.02; }
        T = vec3(r * 2.0, 0.0, 0.0); W = vec3(0.0, 0.0, r * 2.0 * (kind > 2.5 && kind < 3.5 ? 0.3 : kind > 8.5 ? wz : kind > 7.5 ? 0.3 * max(1.0, length(c.xz - cameraPosition.xz) / 6.0) : 1.0));
        P = vec4(kind, iB.w, P.z, iB.x);`,
      fpars: 'uniform vec3 uPadA, uPadB, uGlint, uSheetA, uSheetB;',
      frag: /* glsl */`
        float kind = vP.x; vec2 q = vQ * 2.0; float len = length(q); tearK = 0.55;
        if (kind < 0.5) {
          q *= 1.35; len = length(q);
          float ang = atan(q.y, q.x + (abs(q.x) + abs(q.y) < 1e-5 ? 1e-4 : 0.0)) - seed * 6.2832;
          ang = abs(mod(ang + 3.1416, 6.2832) - 3.1416);
          float pe = min((1.0 - len) * 2.2, (ang - 0.17) * len * 3.5 + 1.0 - smoothstep(0.08, 0.3, len));
          float se = (1.0 - length(q - uShadowDir.xz * 0.2)) * 2.2;
          vec4 n = texture2D(uPaper, vWp.xz * 0.9 + seed);
          float th = 0.06 + 0.26 * n.r;
          if (pe > th) { e = 1.0; col = mix(uPadA, uPadB, vP.y) * (0.92 + 0.1 * cos(ang * 9.0)); col = mix(col, uWhite, (1.0 - smoothstep(th + 0.03, th + 0.12, pe)) * 0.8); col = mix(col, uDeep * 0.5, uUnderK * 0.85); }
          else { e = se > 0.18 ? 1.0 : 0.0; col = mix(uShade, uDeep, 0.35); col = mix(col, uDeep * 0.5, uUnderK); }
          deck = 0.0;
        } else if (kind < 1.5) { e = (1.0 - len) * 2.0; col = mix(uPadA, uWhite, 0.25 + 0.2 * vP.y) * 1.1; deck = 0.0; }
        else if (kind < 2.5) { e = (1.0 - abs(len - 0.78) / 0.17) * (1.0 - vP.z * 0.75) * 1.3; deck = 0.0; tearK = 1.0; }
        else if (kind < 3.5) { e = (1.0 - len) * 1.5; tearK = 1.0; }
        else if (kind < 4.5) {
          float b = 1.0 - length(q * vec2(3.2, 1.25)), w = 1.0 - length(vec2(q.x * 1.05, (q.y - 0.15 + 0.3 * abs(q.x)) * 3.6));
          e = max(b, w) * 2.0; col = uShade; deck = 0.0; alpha = vP.y;
        } else if (kind > 11.5) { e = (1.0 - len) * 2.0; col = mix(uPadA, uWhite, 0.1 + 0.22 * vP.y) * 1.14; deck = 0.0; }
        else if (kind > 9.5) { e = (1.0 - abs(len - 0.8) / 0.15) * (1.0 - vP.z * vP.z * 0.8) * 1.5; deck = 0.0; tearK = 1.0; }
        else if (kind > 8.5) {
          // a large torn sheet of deeper teal with a smaller, deeper one torn over it and a white hairline at the join
          vec4 n = texture2D(uPaper, vWp.xz * 0.11 + seed), m = texture2D(uPaper, vWp.xz * 0.37 + seed * 2.3);
          e = (1.0 - len) * 1.5 + (n.a - 0.5) * 1.2 + (m.r - 0.5) * 0.3;
          float e2 = 1.0 - length((q - vec2(0.2 - 0.4 * fract(seed * 5.3), -0.12)) / vec2(0.6, 0.72)) + (n.r - 0.5) * 0.9 + (m.a - 0.5) * 0.2;
          col = mix(uSheetA, uSheetB, step(0.1, e2));
          col = mix(col, uWhite, (1.0 - smoothstep(0.0, 0.07, abs(e2 - 0.1))) * 0.75);
          tearK = 1.0;
        } else if (kind > 7.5) { vec4 n = texture2D(uPaper, vWp.xz * vec2(0.5, 1.4) + seed); e = (1.0 - len) * 1.7 + (n.a - 0.5) * 0.9; col = uGlint * (0.94 + 0.12 * n.b); tearK = 1.0; }
        else if (kind > 6.5) {
          // a raft of lily pads seen from the air: one torn green sheet with open water torn out of it and flowers as white flecks
          vec4 n = texture2D(uPaper, vWp.xz * 0.045 + seed), m = texture2D(uPaper, vWp.xz * 0.31 + seed * 3.0);
          e = min((1.0 - len) * 1.5 + (n.a - 0.5) * 1.5, (m.a - 0.34) * 5.0 + 0.45);
          col = mix(uPadA, uPadB, clamp(smoothstep(0.5, 0.56, m.r) * 0.75 + 0.25 * vP.y, 0.0, 1.0));
          col = mix(col, uWhite, step(0.8, texture2D(uPaper, vWp.xz * 0.9 + seed).b) * 0.9);
          tearK = 1.0;
        } else if (kind > 5.5) { e = (1.0 - abs(len - 0.78) / 0.2) * (1.0 - vP.z) * 1.6; deck = 0.0; tearK = 1.0; }
        else { e = (1.0 - len) * 3.0; col = uHoney * 0.85; tearK = 1.0; }
        puv = vWp.xz * 0.7 + seed;`,
    });
    flatField(flat, scene);                             // seen from above and, as dark discs, from below
    const mountShadow = flatField([[0, 0, 0.9, 0, 0.5, 4, 0, 1, 0, 0, 0, 0]], above);
    const buildBill = () => field(bill, {
      uniforms: { uCrA: { value: mixc(P[3], P[5], 0.15).multiplyScalar(0.9) }, uCrB: { value: mixc(P[2], lin('#3F6FE0'), 0.4) }, uApricot: { value: P[1].clone().multiplyScalar(0.95) },
        uYellow: { value: lin('#F4D23A').multiplyScalar(0.92) }, uLilyOpen: { value: lilyOpen }, uWing: { value: mixc(C.white, P[2], 0.3) } },
      vpars: 'float hh(float n) { return fract(sin(n * 12.9898) * 43758.5453); }',
      vert: /* glsl */`
        float kind = iB.y, sz = iA.w, sd = iB.x; c = iA.xyz; T = flatR * sz; W = vec3(0.0, sz, 0.0);
        if (kind < 0.5) {
          float lt = (uU - iB.z) * 40.0 / 0.7, j = clamp(lt, 0.0, 1.0), hj = 4.4 * (1.0 + iC.z);
          c.xz += iC.xy * j * 2.3; c.y += 0.5 * sz + hj * j * (1.0 - j) - step(1.0, lt) * 1.5;
          P.z = j;
          if (j > 0.001 && j < 0.999) {
            // in the air the frog is cut in side view and laid along its leap: head first, the long legs trailing
            float sx = dot(vec3(iC.x, 0.0, iC.y), flatR) * 2.3, sy = hj * (1.0 - 2.0 * j), fl = sx < 0.0 ? -1.0 : 1.0, ang = clamp(atan(sy, max(abs(sx), 0.35)), -0.8, 0.8);
            T = (flatR * fl * cos(ang) + vec3(0.0, sin(ang), 0.0)) * sz * 1.7; W = (vec3(0.0, cos(ang), 0.0) - flatR * fl * sin(ang)) * sz;
            P.y = 1.0;
          }
        } else if (kind < 1.5) {
          float tt = uTime * 0.5 + sd * 10.0, cyc = floor(tt), f = smoothstep(0.55, 1.0, fract(tt));
          vec3 h0 = vec3(hh(cyc + sd * 7.0), hh(cyc * 1.3 + sd * 3.0), hh(cyc * 1.7 + sd)), h1 = vec3(hh(cyc + 1.0 + sd * 7.0), hh((cyc + 1.0) * 1.3 + sd * 3.0), hh((cyc + 1.0) * 1.7 + sd));
          vec3 hop = mix(h0, h1, f) - 0.5;            // (inside its box, which was dealt clear of our line: iC.xy is the box's long axis)
          c.xz += iC.xy * (hop.x * ${FLY_L.toFixed(1)}) + vec2(-iC.y, iC.x) * (hop.z * ${FLY_W.toFixed(1)}); c.y += hop.y * ${FLY_H.toFixed(1)} + 0.06 * sin(uTime * 9.0 + sd * 30.0);
          float ro = sd * 6.2832 + 0.3 * sin(uTime * 2.0 + sd * 9.0);
          T = (camR * cos(ro) + camU * sin(ro)) * sz; W = (camU * cos(ro) - camR * sin(ro)) * sz;
        } else if (kind < 3.5) {
          c.y += 0.42 * sz; W = (vec3(0.0, 1.0, 0.0) + flatR * 0.13 * sin(uTime * 1.3 + sd * 40.0)) * sz;
        } else if (kind < 4.5) {
          float ph = fract(uTime * 0.13 + iC.z), up = 1.0 - smoothstep(0.5, 0.58, ph) + smoothstep(0.93, 1.0, ph);
          c.xz += 2.0 * vec2(sin(sd * 40.0), cos(sd * 40.0)) * ph;
          c.y += 0.5 * sz + (up - 1.0) * sz * 1.2 + 0.22 * sz * smoothstep(0.44, 0.5, ph) * (1.0 - smoothstep(0.5, 0.56, ph)) + 0.02 * sin(uTime * 2.0 + sd * 20.0);
        } else if (kind > 6.5) {
          // a fish leaps: out of the water along a random heading, an arc, and back under (drawn only above the surface)
          float tt = uTime / max(iC.x, 0.5) + iB.z, qf = fract(tt), cyc = floor(tt), h1 = hh(cyc + sd * 78.0);
          vec2 base = c.xz + (vec2(h1, fract(h1 * 7.13)) - 0.5) * 1.6;
          float j = qf / (iC.y > 0.05 ? iC.y : 0.5), air = step(j, 1.0), da = sd * 6.2832 + cyc * 2.4, vy = iB.w * 4.0 * (1.0 - 2.0 * j) / 2.3, il = 1.0 / sqrt(1.0 + vy * vy);
          vec2 tcx = cameraPosition.xz - base;        // it leaps across our view, so the whole flank shows
          vec2 d = normalize(vec2(-tcx.y, tcx.x) * (fract(sd * 13.7 + cyc * 0.37) < 0.5 ? -1.0 : 1.0) + 0.45 * length(tcx) * vec2(cos(da), sin(da)) + vec2(1e-4, 0.0));
          float upK = 1.0 - iC.w * smoothstep(0.6035, 0.608, uU);      // (iC.w: the near five, who go under between u 0.6035 and 0.608. Nothing here reads the lens's place to keep a fish under: each fish's box is stood 2 m off our line at the build)
          c = vec3(base.x + d.x * (j - 0.5) * 2.3, air * iB.w * 4.0 * j * (1.0 - j) * upK - (1.0 - air) * 0.9 - 0.04 - (1.0 - upK) * 0.6, base.y + d.y * (j - 0.5) * 2.3);
          vec3 Tf = vec3(d.x * il, vy * il, d.y * il), tc = cameraPosition - c;
          // (the quad is cut a fifth larger than the fish, so its fins and its shadow sheet have room; the back is always up)
          T = Tf * sz * 1.22; W = normalize(cross(Tf, tc) + vec3(0.0, 1e-4, 0.0)) * sz * 0.44 * 1.22; if (W.y < 0.0) W = -W;
          P.y = iC.w;
        } else if (kind > 5.5) {
          float qd = fract(uTime * 0.07 + iC.z), ro = sd * 20.0 + uTime * (0.6 + sd);
          c.y += (qd - 0.5) * 26.0; c.xz += 1.2 * vec2(sin(uTime * 0.6 + sd * 30.0), cos(uTime * 0.5 + sd * 17.0));
          // the down is a medium we fly through, so it takes the near law in the form of the kit's makeParticles: by the true distance of
          // its middle from the lens, on its alpha alone (handed to the fragment stage in P.y). The two figures, 0.6 m and 2.5 m, are those
          // of the kit's petals preset; this field cuts by coverage and throws a fragment away under alpha 0.04, so a piece whose middle is
          // inside about 0.83 m is not drawn
          sz *= sin(3.1416 * qd); P.y = smoothstep(0.6, 2.5, length((viewMatrix * modelMatrix * vec4(c, 1.0)).xyz));
          T = (camR * cos(ro) + camU * sin(ro)) * sz; W = (camU * cos(ro) - camR * sin(ro)) * sz * (0.45 + 0.4 * abs(cos(uTime * 1.3 + sd * 9.0)));
        } else {
          float lt = (uU - iB.z) * 40.0, j = max(lt, 0.0), ro = sd * 20.0 + j * (4.0 + 6.0 * sd);
          c += vec3(iC.x, iB.w, iC.y) * j; c.y -= 4.9 * j * j;
          sz *= step(0.0, lt) * (1.0 - smoothstep(1.3, 2.0, j)) * (1.0 - iC.z * smoothstep(0.45, 0.85, j));      // (iC.z: the raft's spray, which is gone before the lens reaches it)
          T = (camR * cos(ro) + camU * sin(ro)) * sz; W = (camU * cos(ro) - camR * sin(ro)) * sz * (0.4 + 0.6 * abs(cos(j * 7.0 + sd * 9.0)));
        }
        P = vec4(kind, P.y, P.z, sd);`,
      fpars: 'uniform vec3 uCrA, uCrB, uApricot, uYellow; uniform float uLilyOpen;\nfloat segE(vec2 p, vec2 a, vec2 b, float w) { vec2 pa = p - a, ba = b - a; return 1.0 - length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) / w; }' + FISH_GLSL + FLY_GLSL,
      frag: /* glsl */`
        float kind = vP.x; vec2 q = vQ * 2.0; vec4 n = texture2D(uPaper, vQ * 0.4 + seed); tearK = 0.5;
        vec2 aq = vec2(abs(q.x), q.y);
        if (kind < 0.5 && vP.y > 0.5) {
          float body = 1.0 - length((q - vec2(0.1, 0.04)) / vec2(0.54, 0.31)), head = 1.0 - length((q - vec2(0.58, 0.1)) / vec2(0.3, 0.25));
          float eyeb = 1.0 - length((q - vec2(0.6, 0.31)) / vec2(0.16, 0.14)), trunk = max(max(body, head), eyeb);
          float legs = max(max(segE(q, vec2(-0.22, -0.02), vec2(-0.6, -0.27), 0.16), segE(q, vec2(-0.6, -0.27), vec2(-0.92, -0.05), 0.105)),
            max(1.0 - length((q - vec2(-0.9, 0.05)) / vec2(0.1, 0.17)), segE(q, vec2(0.36, -0.1), vec2(0.62, -0.5), 0.085)));
          e = max(trunk, legs) * 2.4;
          col = mix(uCrA, uDeep, smoothstep(0.55, 0.62, n.a) * 0.7);
          if (legs > trunk) col = mix(uCrA, uDeep, 0.4);
          else col = mix(col, uWhite * vec3(0.95, 1.0, 0.8), 1.0 - smoothstep(-0.16, -0.06, q.y - 0.12 * q.x));
          if (length((q - vec2(0.62, 0.3)) / vec2(0.08, 0.075)) < 1.0) col = uDeep * 0.5;
          if (vWp.y < 0.0) cut = true;      // (under the water line; here and below the cut is only noted, and made after paperSheet: see FIELD_FRAG)
        } else if (kind < 0.5) {
          float b = 1.0 - length((q - vec2(0.0, -0.3)) / vec2(0.78, 0.5));
          float ey = 1.0 - length((aq - vec2(0.34, 0.24)) / 0.24);
          float ft = 1.0 - length((aq - vec2(0.74, -0.7)) / vec2(0.26, 0.16));
          e = max(b, max(ey, ft)) * 2.2;
          col = mix(uCrA, uDeep, smoothstep(0.55, 0.62, n.a) * 0.7);
          col = mix(col, uWhite * vec3(0.95, 1.0, 0.8), 1.0 - smoothstep(-0.52, -0.42, q.y));
          if (ey > 0.5) col = uDeep * 0.5;
          if (vWp.y < 0.0) cut = true;
        } else if (kind < 1.5) {
          float isB = 0.0; col = hawker(q, sin(uTime * 37.0 + seed * 40.0), uCrA, mix(uCrA, uCrB, 0.3 + 0.7 * step(0.4, fract(seed * 7.0))), e, isB);
          deck = 1.0 - isB; tearK = 0.25 * (1.0 - isB);
        } else if (kind < 2.5) {
          float len = length(q), ang = atan(q.y, q.x + (abs(q.x) + abs(q.y) < 1e-5 ? 1e-4 : 0.0));
          float rr = mix(0.4, 0.55, uLilyOpen) + mix(0.1, 0.4, uLilyOpen) * abs(cos(3.0 * ang + seed * 6.0));
          e = (rr - len) * 3.0;
          col = len < 0.27 * uLilyOpen ? uApricot : mix(uWhite, uWhite * vec3(1.0, 0.9, 0.95), smoothstep(0.3, 0.9, len));
        } else if (kind < 3.5) {
          float cup = (0.46 - length(q - vec2(0.0, 0.4))) * 3.0, st = (1.0 - abs(q.x) / 0.09) * step(q.y, 0.2);
          e = max(cup, st); col = cup > 0.0 ? uYellow * (0.85 + 0.15 * smoothstep(0.0, 0.5, cup)) : uCrA;
        } else if (kind < 4.5) {
          q.x *= fract(seed * 3.1) < 0.5 ? -1.0 : 1.0;
          float b = 1.0 - length((q - vec2(-0.1, -0.62)) / vec2(0.85, 0.3));
          vec2 pa = q - vec2(0.42, -0.5), ba = vec2(0.12, 0.95);
          float nk = 1.0 - length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) / 0.13;
          float hd = 1.0 - length((q - vec2(0.72, 0.5)) / vec2(0.3, 0.1));
          e = max(b, max(nk, hd)) * 2.5; col = mix(uDeep * 0.5, uShade * 0.55, n.b * 0.4); deck = 0.5;
          if (vWp.y < 0.0) cut = true;
        } else if (kind > 6.5) {
          // a leaping fish cut from torn papers: a silver flank sheet with brush streaks along it, a blue back sheet torn
          // along its lower edge (white deckle on the tear), a white belly, tail and fins in rayed blue-apricot paper, a thin
          // dark gill arc, a pectoral fin with its own white rim, an eye, a white deckle rim all round and a lilac shadow
          // sheet slipped out below and behind
          vec2 fq = vec2(vQ.x * 1.22 + 0.5, q.y * 1.22);
          vec3 fe = fishE(fq), fsh = fishE(fq - vec2(-0.035, -0.2));
          float sh = max(fe.x, max(fe.y, fe.z)), shS = max(fsh.x, max(fsh.y, fsh.z)), th = 0.1 + (0.1 + 0.26 * vP.y) * n.r;
          vec4 n2 = texture2D(uPaper, vec2(fq.x * 0.9, fq.y * 0.22) + seed * 3.0);
          deck = 0.0; tearK = 0.0;
          if (sh > th) {
            e = 1.0;
            float yb = 0.1 + 0.15 * sin(fq.x * 7.0 + seed * 20.0) + (n2.r - 0.5) * 0.5;
            col = mix(mix(uWhite, uCrB, 0.16) * (0.84 + 0.3 * n2.b), uCrB * (0.68 + 0.3 * n2.b), step(yb, fq.y));
            col = mix(col, uWhite, (1.0 - smoothstep(0.0, 0.075, abs(fq.y - yb))) * 0.85);
            col = mix(col, uWhite * 1.02, 1.0 - smoothstep(-0.62, -0.5, fq.y + (n2.a - 0.5) * 0.2));
            if (fe.x <= th) col = mix(uCrB * 0.8, uApricot, fe.y > fe.z ? 0.42 : 0.25) * (0.84 + 0.3 * step(0.5, fract(fq.y * 3.5 + fq.x * 4.0)));
            else {
              vec2 pq = fq - vec2(0.57, -0.26); pq = vec2(pq.x * 0.8 + pq.y * 0.6, -pq.x * 0.6 + pq.y * 0.8);
              float pf = 1.0 - length(pq / vec2(0.17, 0.1));
              if (pf > 0.0) col = mix(uWhite, mix(uCrB * 0.8, uApricot, 0.34), smoothstep(0.16, 0.34, pf));
              float gill = abs(fq.x - (0.69 + 0.065 * (1.0 - fq.y * fq.y)));
              col = mix(col, uDeep * 0.45, (1.0 - smoothstep(0.01, 0.02, gill)) * step(abs(fq.y), 0.62) * 0.9);
              float ey = length((fq - vec2(0.86, 0.15)) / vec2(0.055, 0.125));
              if (ey < 1.0) col = ey < 0.6 ? uDeep * 0.35 : uWhite;
            }
            col = mix(col, uWhite, (1.0 - smoothstep(th + 0.03, th + 0.14, sh)) * 0.9);
          } else { e = shS > 0.16 ? 1.0 : 0.0; col = mix(uShade, uDeep, 0.2); }
          if (vWp.y < 0.0) cut = true;
        } else { e = (1.0 - length(q * vec2(1.0, 1.5))) * 1.6 + (n.r - 0.5) * 0.8; tearK = 1.0; if (kind > 5.5) alpha = vP.y; }      // (the down thins as it nears the lens)
        puv = vQ * 0.5 + seed;`,
    });
    await ctx.yield();

    // ---------- free flyers cut from the hero's jointed pelican ----------
    const yawAt = (u) => { tan(u); return Math.atan2(_q.x, _q.z); };
    const flocks = [], moving = [];
    const dbgFlocks = [], gazeV = new V3(), rareV = new V3(), dalV = new V3(), skV = new V3(), ibV = new V3(), pkV = new V3(); let dalRef = null;
    const addFlock = (list, o, name) => { const m = hero.makeFlock(list, o); above.add(m); flocks.push(m); dbgFlocks.push({ name, list, o, m }); return m; };
    const crossing = (uX, ahead, up, rightK, backK, speed, n, gap, i0, o) => {     // a line of birds that crosses the view at uX
      at(uX); tan(uX);
      const l = Math.hypot(_q.x, _q.z) || 1, tx = _q.x / l, tz = _q.z / l, rx = -tz, rz = tx;
      let vx = rx * rightK - tx * backK, vz = rz * rightK - tz * backK; const vl = Math.hypot(vx, vz); vx /= vl; vz /= vl;
      const X = new V3(_p.x + tx * ahead + rx * (o.lat ?? 0), _p.y + up, _p.z + tz * ahead + rz * (o.lat ?? 0)), yaw = Math.atan2(vx, vz), list = [];
      for (let k = 0; k < n; k++) list.push({ x: -vx * (k - i0) * gap + rng.range(-0.5, 0.5), y: rng.range(-0.35, 0.35) + 0.25 * Math.sin(k * 1.3), z: -vz * (k - i0) * gap + rng.range(-0.5, 0.5),
        yaw: yaw + rng.range(-0.05, 0.05), scale: (o.scale ?? 1) * rng.range(0.94, 1.08), seed: rng(), phase: k * 0.35, flap: 1, flush: rng() });
      const m = addFlock(list, o, o.name ?? 'crossing');
      moving.push({ m, X, V: new V3(vx * speed, 0, vz * speed), uX, sink: o.sink ?? 0 });
      return m;
    };
    // ---------- driven flyers: birds whose places are worked out from the flight itself (keyed to u) ----------
    // A driven bird keeps a station beside the camera path: `a` metres ahead of the lens along the route, `lat` metres
    // to the right and `dy` above it. We overtake each one slowly (it is abeam at u = uab), it sweeps in from further
    // out before that, and it is parked out of sight outside its window. Birds that start on the water (from) ease
    // from their spot onto the station after their launch.
    const RTAB = PT.map((q, i) => { const a = PT[Math.max(0, i - 1)], b = PT[Math.min(1000, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
    // A bird with b.hold is never overtaken: it is far ahead and wide at first (we close on it over din), keeps a station
    // ahead of the lens that breathes a little, and at the end pulls ahead and out toward the thermal again (over dout),
    // so it only ever meets the edge of the picture when it is small with distance.
    const stationAt = (b, u, out) => {
      let a, lat, dy;
      if (b.hold) {
        const h = b.hold, kin = 1 - smoothstep(h.u0, h.u0 + h.din, u), ko = smoothstep(h.u1, h.u1 + h.dout, u), ph = u * h.wk + h.wp;
        a = h.a + h.aIn * kin + h.aOut * ko + h.aw * Math.sin(ph);
        lat = h.lat * (1 + h.sIn * kin) + h.latOut * ko * ko + h.lw * Math.sin(ph * 0.73 + 1.3);
        dy = h.dy + h.dyIn * kin + h.dyOut * ko + h.dw * Math.sin(ph * 1.31 + 2.1);
      } else {
        a = clamp(b.vrel * 40 * (b.uab - u) - (b.uE !== undefined ? 18 * (1 - smoothstep(b.uE, b.uE + b.eDur, u)) : 0), -70, 70);
        const k = b.spread ? 1 - smoothstep(b.uab - 0.12, b.uab - 0.05, u) : 0, pk = b.peel ? 1 - smoothstep(0.5, 6, a) : 0;
        lat = b.lat * (1 + b.spread * k) * (1 + (b.peel ?? 0) * pk) + (b.latV ?? 0) * (u - b.uab) * 40; dy = b.dy * (1 + b.spread * k) + (b.dyFar ?? 0) * k + 1.3 * pk;
      }
      const f = clamp((u + a / PL) * 1000, 0, 1000), i = Math.min(999, Math.floor(f)), t = f - i, A0 = PT[i], B0 = PT[i + 1], r0 = RTAB[i], r1 = RTAB[i + 1];
      const over = Math.max(0, (u + a / PL) * 1000 - 1000);
      out.set(lerp(A0.x, B0.x, t + over) + lerp(r0[0], r1[0], t) * lat, (b.yAbs ? b.yAbs(u) : Math.max(2.2, lerp(A0.y, B0.y, t + over) + dy)), lerp(A0.z, B0.z, t + over) + lerp(r0[1], r1[1], t) * lat);
      return out;
    };
    // Never across the sun: seen from the lens, a bird (half its span included) is pushed out of the portal's outline.
    const seatV = new V3(...A.portalSeat.position), dirV = new V3(...A.portalSeat.direction), _od = new V3();
    const offDisc = (u, out, scale, sideHint) => {
      path.pointAt(u, _od);
      const vx = out.x - _od.x, vy = out.y - _od.y, vz = out.z - _od.z, al = vx * dirV.x + vy * dirV.y + vz * dirV.z;
      if (al <= 0.5) return out;
      const dn = (seatV.x - _od.x) * dirV.x + (seatV.y - _od.y) * dirV.y + (seatV.z - _od.z) * dirV.z, k = dn / al;
      if (dn <= 0.5 || k < 1) return out;
      let rx = _od.x + vx * k - seatV.x, ry = _od.y + vy * k - seatV.y, rz = _od.z + vz * k - seatV.z, rr = Math.hypot(rx, ry, rz);
      const needR = 8.4 + 2.2 * scale * k;
      if (rr < needR) {
        if (rr < 0.5) { const r = RTAB[clamp(Math.round(u * 1000), 0, 1000)], sg = sideHint < 0 ? -1 : 1; rx = r[0] * sg; ry = 0; rz = r[1] * sg; rr = 1; }
        const g = (needR - rr) / rr / k; out.x += rx * g; out.y += ry * g; out.z += rz * g;
      }
      return out;
    };
    const birdAt = (b, u, out) => {
      if (u < b.show0 || u > b.show1) return out.set(0, -400, 0);
      if (b.custom) return b.custom(u, out);
      stationAt(b, u, out);
      if (b.from) {
        const LT = (u - b.launch) * 40, w = smoothstep(b.w0 ?? 0.3, b.w1 ?? 2.8, LT);
        out.set(lerp(b.from[0], out.x, w), lerp(b.from[1], out.y, Math.pow(w, 1.6)), lerp(b.from[2], out.z, w));
      }
      if (b.hold && u > 0.6) offDisc(u, out, b.scale ?? 1, b.hold.lat);
      return out;
    };
    const driven = [], _b0 = new V3(), _b1 = new V3(), ldD = new V3(), ldR = new V3(), ldU = new V3(), YUP = new V3(0, 1, 0);
    const addDriven = (list, o, name) => {
      for (const b of list) { b.pos = (u, out) => birdAt(b, u, out); b.x = 0; b.y = -400; b.z = 0; b.show0 ??= -1; b.show1 ??= 2; }
      const m = addFlock(list, { ...o, run: 0, rise: 0, clipY: Math.max(o.clipY ?? -1e6, -300) }, name);
      driven.push({ m, list, u0: Math.min(...list.map((b) => b.show0)), u1: Math.max(...list.map((b) => b.show1)), on: true });
      return m;
    };
    const driveAll = (u) => {
      for (const d of driven) {
        const act = u >= d.u0 && u <= d.u1;
        if (!act && !d.on) continue;
        const iA = d.m.userData.iA, n = d.list.length, sh = d.m.userData.copies;
        for (let i = 0; i < n; i++) {
          const b = d.list[i]; b.pos(u, _b0);
          let yaw = b.yaw ?? 0;
          if (b.yawFn) yaw = b.yawFn(u); else if (_b0.y > -300) { b.pos(u + 0.0012, _b1); const dx = _b1.x - _b0.x, dz = _b1.z - _b0.z; if (_b1.y > -300 && dx * dx + dz * dz > 1e-5) yaw = Math.atan2(dx, dz) + (b.yawBias ?? 0); else if (b.yawOf) yaw = b.yawOf(u); }
          b.yawNow = yaw;
          for (let q = 0; q < sh; q++) { const k = (i + q * n) * 4; iA[k] = _b0.x; iA[k + 1] = _b0.y; iA[k + 2] = _b0.z; iA[k + 3] = yaw; }
        }
        d.m.geometry.attributes.iA.needsUpdate = true; d.on = act;
      }
    };
    const U_SKEIN = 0.121, skein = crossing(U_SKEIN, 7.5, 3.95, 0.7, 0.7, 10.5, 9, 4.8, 2, { shadow: true, sink: 3.7, scale: 1.3 });     // low, wings square to the lens
    const ibisC = { white: lin('#8A4A86').multiplyScalar(0.8), cream: lin('#9A5A6E').multiplyScalar(0.8), flush: lin('#7A4690').multiplyScalar(0.8), ink: lin('#3E9A6A').multiplyScalar(0.8),
      face: lin('#5A3A80'), bill: mixc(P[5], lin('#3A2A60'), 0.5), pouch: mixc(P[5], lin('#3A2A60'), 0.5), pouchDeep: lin('#3A2A60') };
    crossing(0.25, 11, 3.6, -0.9 * s2, 0.42, 11, 14, 3.1, 1.5, { colors: ibisC, scale: 0.98, neck: [0.25, 0.1, -0.3], flapRate: 6.5, sink: 0.6, lat: s2 * 9.5, name: 'ibis' });     // out over the lily pool, across the opening
    await ctx.yield();
    const offPath = (q, lat, out) => {                 // a point `lat` metres to the right of the route at path fraction q
      const f = clamp(q * 1000, 0, 1000), i = Math.min(999, Math.floor(f)), t = f - i, A0 = PT[i], B0 = PT[i + 1], r0 = RTAB[i], r1 = RTAB[i + 1];
      return out.set(lerp(A0.x, B0.x, t) + lerp(r0[0], r1[0], t) * lat, lerp(A0.y, B0.y, t), lerp(A0.z, B0.z, t) + lerp(r0[1], r1[1], t) * lat);
    };
    let heronM = null, heronList = null;
    const ringRows = [], slapRing = (x, z, uS, r) => ringRows.push([x, z, r, 0, rng(), 6, uS, 0, 0, 0, 0, 0]);
    {
      // three Dalmatians patter up ahead and to the left of the burst: we draw level with them as they rise
      const U_D = 0.42, dal = [[6.6, -4.7, 1.26], [8.8, -2.2, 1.2], [11.6, -6.6, 1.3]].map(([a0, lat42, scale], i) => {
        const vrel = 2.0, uab = U_D + a0 / (vrel * 40), latV = -0.5;
        return { vrel, uab, lat: lat42 + latV * (uab - U_D) * 40, latV, dy: 0, spread: 0, scale, seed: rng(), dal: 1, phase: i * 1.7, flap: 1, yawBias: -0.45,
          launch: uOut - 0.016 + i * 0.002, show0: uOut - 0.02, show1: 0.6,
          yAbs: (u) => 0.1 + (0.25 + 0.2 * i) * smoothstep(uOut, U_D + 0.004, u) + 3.4 * smoothstep(U_D + 0.004, 0.495, u) + 24 * smoothstep(0.462, 0.56, u) };
      });
      dalRef = dal[1];
      addDriven(dal, { shadow: true, flapRate: 5.4 }, 'dalmatians');
      for (const b of dal) for (let u = uOut - 0.012; u < U_D + 0.022; u += 0.0028) { stationAt(b, u, _p); slapRing(_p.x + rng.range(-0.3, 0.3), _p.z + rng.range(-0.3, 0.3), u, rng.range(0.45, 0.7)); }
      await ctx.yield();
      // squacco herons: hunched and buff on a pad, pure white the instant the wings open; each lifts when we are 11 m
      // away and crosses the channel a few metres ahead of the bill before climbing over the far reed wall
      // (each stays under a metre up, against the water and the green foot of the far wall, until it is over; then it climbs)
      const hw = C.white.clone().multiplyScalar(1.04), buff = mixc(lin('#C8782E'), P[1], 0.25).multiplyScalar(0.86);
      const herons = heronSpots.map((h, i) => {
        const uc = h.u + 0.001, pad = new V3(h.x, 0.06, h.z), L0 = h.lat, lag = i >= 3 && !h.chan, L1 = lag ? Math.sign(h.lat) * 12 : -Math.sign(h.lat) * 4.0, tmp = new V3();
        // (the third is the lily pool's heron: it lifts from the pool's mouth and holds a place in the picture itself, see driveHeron)
        if (i === 2) return { scale: 1.06, seed: rng(), phase: Math.asin(0.3) - 78, flap: 1, launch: 0.2245, yaw: yawAt(h.u) + s2 * 1.2, show0: -1, show1: 0.318, uc, pad, custom: (u, out) => out.copy(pad) };
        return { scale: h.chan ? 1.08 : 0.95, seed: h.chan ? r5() : rng(), phase: i * 2.1, flap: 1, launch: uc - 0.021, yaw: yawAt(h.u) + (h.lat < 0 ? 0.5 : -0.5), show0: -1, show1: uc + 0.09, uc,
          custom: (u, out) => {
            const s = (u - uc) * 40; if (s <= -0.84) return out.copy(pad);
            const w = smoothstep(-0.84, 0.1, s), a = h.chan ? 3.7 - 2.1 * smoothstep(0.7, 2.6, s) : 4.6 - 2.8 * smoothstep(0.7, 2.6, s);
            offPath(u + a / PL, lerp(L0, L1, lag ? smoothstep(-0.5, 2.2, s) : smoothstep(-1.3, 1.6, s)), tmp);
            tmp.y = lerp(h.yFly ?? (lag ? 0.95 : 0.74), tmp.y + 5.2, lag ? smoothstep(0.2, 2.0, s) : smoothstep(0.9, 2.4, s));
            return out.set(lerp(pad.x, tmp.x, w), lerp(pad.y, tmp.y, w * w), lerp(pad.z, tmp.z, w));
          } };
      });
      heronM = addDriven(herons, { colors: { white: hw, ink: mixc(U.uShade.value, P[5], 0.45).multiplyScalar(0.74), face: mixc(hw, P[4], 0.5), bill: mixc(P[2], P[5], 0.4), pouch: P[4].clone(), pouchDeep: P[4].clone(), flush: buff, cream: mixc(hw, buff, 0.8), back: buff.clone().multiplyScalar(0.95), tail: hw },
        foldTint: [1.0, 0.8, 0.5], flapRate: 6.5, shadow: true, slip: 0.2 }, 'herons');
      heronList = herons; heronM.geometry.attributes.iD.setUsage(THREE.DynamicDrawUsage);
      await ctx.yield();
      const terns = [], ternOK = (v, need) => { let md = 1e9; for (let i = 430; i <= 560; i++) md = Math.min(md, v.distanceTo(PT[i])); return md >= need; };
      for (const [uq, lat, up] of [[0.5145, 5.6, 0.9], [0.5105, 8.6, -0.7], [0.519, 6.0, -0.75], [0.5225, 9.6, 1.5], [0.527, 6.6, -0.3], [0.506, 7.6, 1.2], [0.492, -6.2, 0.9], [0.476, 6.0, -0.8]]) {
        let L = lat; offPath(uq, L, _p); _p.y = Math.max(2.0, _p.y + up);
        for (let k = 0; k < 8 && !ternOK(_p, 5.0); k++) { L += Math.sign(lat) * 0.7; offPath(uq, L, _p); _p.y = Math.max(2.0, _p.y + up); }
        terns.push({ x: _p.x, y: _p.y, z: _p.z, yaw: yawAt(uq) + Math.PI + rng.range(-0.7, 0.7), scale: rng.range(0.7, 0.8), seed: rng(), phase: rng() * 6 });
      }
      for (let i = 0; i < 8; i++) { const sd = rng.sign(); terns.push({ x: -7 + sd * rng.range(9, 26), y: rng.range(2.6, 5), z: rng.range(52, 108), yaw: rng() * TAU, scale: 0.5, seed: rng(), phase: rng() * 6 }); }
      const tm = addFlock(terns, { colors: { white: lin('#9FADD2').multiplyScalar(0.8), ink: mixc(lin('#2E3A78'), P[5], 0.25).multiplyScalar(0.6), face: mixc(P[5], lin('#16264A'), 0.75).multiplyScalar(0.45), cream: lin('#7C8CBC').multiplyScalar(0.76), flush: lin('#6F80B4').multiplyScalar(0.76), back: lin('#6F80B4').multiplyScalar(0.72), tail: lin('#E4EAF6').multiplyScalar(0.85), bill: P[1].clone(), pouch: P[1].clone(), pouchDeep: P[1].clone() },
        lod: true, neck: [1.2, 0.4, -0.35], flapRate: 10, shadow: true, slip: 0.16 }, 'terns');
      tm.userData.u.uHover.value.set(0.6, 1.1, 0);
      await ctx.yield();
    }
    // escorts: pelicans on their way to the thermal that we overtake one after another, so three or four always fly
    // within a dozen metres of the lens from the horseshoe to the portal (the hero's soarers keep 8.5 m off the line)
    {
      const list = [];
      for (let k = 0; k < 397; k++) rng();          // (the draws the old escort table took, so everything laid out after it keeps its seeds)
      // Over the back row (u 0.56-0.66): four birds met from behind, held 6-16 m ahead of the lens where the whole of each
      // is in the picture, and let go ahead toward the thermal before the climb's own flock arrives. [u0 (we begin to close
      // on it), u1 (it pulls away), metres ahead, to the right, above the route, scale, flap]
      const HOLD = [[0.558, 0.632, 5.9, -2.9, 1.5, 1.25, 0.85], [0.562, 0.648, 10.2, 4.4, 1.5, 1.16, 0.3], [0.57, 0.655, 12.5, -1.6, 2.6, 1.14, 0.85], [0.58, 0.64, 15.5, -4.2, -0.2, 1.12, 0.3]];
      for (const [u0, u1, a, lat, dy, scale, flap] of HOLD) if (!rare) list.push({ hold: { u0, din: 0.05, u1, dout: 0.075, a, lat, dy, aIn: 44, sIn: 1.5, dyIn: 3, aOut: 62, latOut: Math.sign(lat) * 26, dyOut: 8,
        aw: 0.7, lw: 0.45, dw: 0.35, wk: r5.range(60, 95), wp: r5() * TAU }, show0: u0 - 0.006, launch: u0 - 0.006, show1: u1 + 0.075, scale, seed: r5(), phase: r5() * 6, flap, flush: r5() });
      if (!list.length) list.push({ hold: { u0: 2, din: 0.05, u1: 2.1, dout: 0.05, a: 10, lat: 3, dy: 1, aIn: 0, sIn: 0, dyIn: 0, aOut: 0, latOut: 0, dyOut: 0, aw: 0, lw: 0, dw: 0, wk: 1, wp: 0 }, show0: 2, launch: 2, show1: 2.1, scale: 1, seed: 0.5, phase: 0, flap: 0, flush: 0.5 });
      await ctx.yield();
      const em = addDriven(list, { shadow: true, hideBefore: true }, 'escorts');
      em.userData.u.uHover.value.set(0.25, 0.25, 0);
      await ctx.yield();
      // the last wheel: big birds turning tight banked circles left and right of the portal's cloud hole. Each circle is
      // carried along with us (so they stay 11-15 m from the lens), sits clear of the disc, and brings its bird to the near
      // side, belly and black wing edges turned to the lens, at u 0.95; they come in from far ahead and peel out wide at the end
      const st = { vrel: 1, uab: 0, lat: 0, dy: 0, spread: 0 }, WOM = 1.05, WR = 2.3, WBANK = 0.78;
      const wheel = [[-7.0, 1.0, 10.8, 1.42, 0.0], [6.8, -0.6, 10.2, 1.38, 0.3], [-5.0, -4.4, 12.6, 1.44, -0.3], [11.4, 4.6, 13.6, 1.36, 0.6]].map(([lat, dy, a0, scale, ph], i) => {
        const th = (u) => bird.ph + WOM * (u - 0.95) * 40;
        const bird = { ph, scale, seed: rng(), phase: i * 1.9, flap: i % 2 ? 0.2 : 0.7, flush: rng(), show0: 0.84, show1: 0.994,
          yawFn: (u) => { const r = RTAB[clamp(Math.round(u * 1000), 0, 1000)], t = th(u), vx = -Math.sin(t) * r[0] + Math.cos(t) * r[1], vz = -Math.sin(t) * r[1] - Math.cos(t) * r[0]; return Math.atan2(vx, vz); },
          custom: (u, out) => {
            const sT = (u - 0.95) * 40, sp = Math.max(sT, 0), o = Math.max(sT - 0.7, 0), a = a0 - 1.5 * sT + 70 * (1 - smoothstep(-3.6, -1.0, sT));
            st.uab = u + a / 40; st.lat = Math.sign(lat) * (Math.abs(lat) + 0.4 * sp + 3.2 * o * o); st.dy = dy * (1 + 0.25 * sp);
            const r = RTAB[clamp(Math.round(u * 1000), 0, 1000)], t = th(u), c = Math.cos(t) * WR, sn = Math.sin(t) * WR;
            stationAt(st, u, out);
            out.x += r[0] * c + r[1] * sn; out.z += r[1] * c - r[0] * sn;
            // never across the disc: seen from the lens, the bird (half a span included) stays outside the portal's outline
            const cam = ptAt(u), vx = out.x - cam.x, vy = out.y - cam.y, vz = out.z - cam.z, al = vx * dirV.x + vy * dirV.y + vz * dirV.z;
            if (al > 0.5) {
              const dn = (seatV.x - cam.x) * dirV.x + (seatV.y - cam.y) * dirV.y + (seatV.z - cam.z) * dirV.z, k = dn / al;
              let rx = cam.x + vx * k - seatV.x, ry = cam.y + vy * k - seatV.y, rz = cam.z + vz * k - seatV.z, rr = Math.hypot(rx, ry, rz);
              const needR = 8.2 + 2.2 * scale * Math.max(k, 0);
              if (dn > 0.5 && rr < needR) {
                if (rr < 0.5) { rx = r[0] * Math.sign(lat); ry = 0; rz = r[1] * Math.sign(lat); rr = 1; }
                const g = (needR - rr) / rr / k; out.x += rx * g; out.y += ry * g; out.z += rz * g;
              }
            }
            return out;
          } };
        // where on its circle does the banked bird turn its belly square to the lens? put it there at u 0.95 (give or take ph)
        let best = -2, bph = 0; const cam = ptAt(0.95), sa = Math.sin(WBANK), ca = Math.cos(WBANK);
        for (let k = 0; k < 72; k++) {
          bird.ph = k / 72 * TAU; bird.custom(0.95, _p); const yaw = bird.yawFn(0.95), dx = _p.x - cam.x, dy2 = _p.y - cam.y, dz = _p.z - cam.z;
          const f = (-sa * Math.cos(yaw) * dx + ca * dy2 + sa * Math.sin(yaw) * dz) / Math.hypot(dx, dy2, dz);
          if (f > best) { best = f; bph = bird.ph; }
        }
        bird.ph = bph + ph;
        return bird;
      });
      const wm = addDriven(wheel, { shadow: true }, 'wheelers');
      wm.userData.u.uHover.value.set(0.15, 0.15, WBANK);
      await ctx.yield();
    }
    // ---------- the climb's wheeling flock (u 0.62-0.95): pelicans cut into the picture itself ----------
    // Three casts of big birds, one for each picture of the climb (the lagoon view at 0.70, the pan across the far shore at
    // 0.79, the sun in the cloud's eye at 0.87-0.90). A bird of a cast has a place in the frame, not in the world: it comes
    // down out of the flock round the sun (far ahead, small), wheels across its part of the picture at 6-26 m while the
    // lens is at its cast's picture, and pulls ahead to the sun again. Each is turned so that its belly (seen from below)
    // or its back (the low ones, seen against the water) and both black-edged wings face the lens: no bird near us is
    // ever a thin edge-on line. Places are worked out from the camera it is drawn with, so the whole of every bird is
    // inside the frame with either camera style and on any screen shape, and none is ever over the sun.
    // [peak u, half plateau, depth m, x, y in the frame (-1..1), drift x, y per 0.05 u, heading on screen (deg: 0 flying
    //  right, 90 up, 180 left), heading out of the picture (deg, + away), side (1 back, -1 belly), tilt (deg), scale, flap,
    //  where it waits far off: x, y from the sun in tangent units]
    const VIEW = [
      // the lagoon view (0.70): a loose flock rising toward the sun, wings at every angle, two crossing low over the water
      [0.700, 0.030, 7.6, -0.54, 0.10, 0.08, 0.11, 55, 12, -1, 26, 1.25, 0.5, -0.30, -0.10],
      [0.704, 0.030, 10.5, 0.52, 0.22, -0.09, 0.11, 128, -14, -1, 24, 1.2, 0.3, 0.32, -0.06],
      [0.697, 0.030, 14, -0.05, 0.0, 0.03, 0.14, 80, 30, -1, 30, 1.2, 0.7, -0.10, -0.34],
      [0.702, 0.030, 7.9, 0.30, -0.50, -0.04, 0.07, 104, 40, 1, 12, 1.16, 0.3, 0.16, -0.36],       // (the two low ones climb away up the picture, nose up, so the back and both wings lie across it)
      [0.698, 0.030, 19, -0.30, 0.50, 0.13, 0.05, 20, 0, -1, 20, 1.2, 0.8, -0.26, 0.12],
      [0.706, 0.030, 24, 0.80, -0.02, -0.05, 0.13, 110, -25, -1, 30, 1.2, 0.3, 0.42, -0.2],
      [0.700, 0.030, 7.8, -0.70, -0.46, 0.05, 0.07, 74, 40, 1, 12, 1.16, 0.8, -0.44, -0.3],
      [0.695, 0.030, 30, 0.42, 0.56, -0.12, 0.07, 150, 0, -1, 20, 1.2, 0.3, 0.26, 0.16],
      // the pan across the far shore (0.79): the large near bird on the left, six more at other depths
      [0.788, 0.030, 6.3, -0.45, -0.04, 0.05, 0.09, 62, 14, -1, 30, 1.3, 0.4, -0.12, -0.44, 0.03],       // (it is away under the sun, small, before the left flanker of 0.87 comes in)
      [0.791, 0.030, 9.6, 0.62, 0.0, -0.07, 0.12, 118, -12, -1, 25, 1.2, 0.5, 0.36, -0.12],
      [0.793, 0.030, 13, 0.12, -0.26, 0.02, 0.14, 85, 30, -1, 32, 1.2, 0.3, 0.06, -0.38],
      [0.786, 0.030, 16, -0.80, 0.52, 0.12, 0.07, 30, 0, -1, 22, 1.2, 0.8, -0.4, 0.06],
      [0.790, 0.030, 20, 0.40, -0.44, -0.13, 0.05, 160, 15, -1, 34, 1.2, 0.3, 0.24, -0.4],
      [0.794, 0.030, 15, -0.14, 0.36, -0.02, 0.14, 100, -20, -1, 20, 1.16, 0.7, -0.18, 0.2],
      [0.790, 0.030, 27, 0.86, -0.30, -0.10, 0.10, 135, 0, -1, 30, 1.2, 0.3, 0.5, -0.24],
      // the sun in the cloud's eye (0.87-0.90): two flankers climbing with us left and right of it, three more below and above
      [0.884, 0.030, 7.2, -0.52, 0.08, 0.03, 0.04, 66, 0, -1, 16, 1.32, 0.35, -0.3, 0.1],
      [0.887, 0.030, 7.6, 0.51, 0.02, -0.03, 0.04, 114, 0, -1, 16, 1.3, 0.6, 0.3, 0.06],
      [0.881, 0.030, 13.5, -0.28, -0.56, 0.06, 0.04, 58, 0, -1, 22, 1.2, 0.3, -0.2, -0.3],
      [0.890, 0.030, 15.5, 0.66, -0.52, -0.05, 0.04, 122, 0, -1, 22, 1.2, 0.8, 0.34, -0.26],
      [0.885, 0.030, 21, 0.28, 0.74, -0.03, 0.0, 104, 0, -1, 20, 1.2, 0.3, 0.2, 0.3],
    ].map((v, i) => ({ pk: v[0], hw: v[1], D: v[2], nx: v[3], ny: v[4], vx: v[5], vy: v[6], phi: v[7] * Math.PI / 180, out: v[8] * Math.PI / 180, side: v[9], tilt: v[10] * Math.PI / 180,
      scale: v[11], flap: v[12], fx: v[13], fy: v[14], fin: 0.056, fout: v[15] ?? (v[0] > 0.86 ? 0.036 : 0.056), wk: 70 + 9 * (i % 5), wp: i * 2.4,
      x: 0, y: -400, z: 0, yaw: 0, launch: -1, seed: r6(), phase: r6() * 6, flush: r6() }));
    const viewM = addFlock(VIEW, { shadow: true }, 'climbers');
    viewM.userData.u.uHover.value.set(0.1, 0.08, 0);
    for (const k of ['iA', 'iD']) viewM.geometry.attributes[k].setUsage(THREE.DynamicDrawUsage);
    const VF0 = Math.min(...VIEW.map((b) => b.pk - b.hw - b.fin)), VF1 = Math.max(...VIEW.map((b) => b.pk + b.hw + b.fout)), FAR_D = 95;
    const vF = new V3(), vR = new V3(), vU = new V3(), vP = new V3(), vV = new V3(), vEr = new V3(), vEu = new V3(), vFd = new V3(), vVp = new V3(), vW = new V3(), vN = new V3(), vS = new V3();
    let viewOn = true;
    const driveView = (u, camera, camP) => {
      const act = u > VF0 && u < VF1;
      if (!act && !viewOn) return;
      const iA = viewM.userData.iA, iD = viewM.userData.iD, n = VIEW.length, me = camera.matrixWorld.elements;
      // the lens: where it looks, its right and its up with the horizon level, how wide it sees, where the sun is in it
      vF.set(-me[8], -me[9], -me[10]).normalize(); vR.set(-vF.z, 0, vF.x); if (vR.lengthSq() < 1e-6) vR.set(1, 0, 0); vR.normalize(); vU.crossVectors(vR, vF);
      const tanV = Math.tan((camera.fov ?? 62) * Math.PI / 360), tanH = tanV * (camera.aspect ?? 1.78);
      vS.copy(seatV).sub(camP); const sunD = vS.dot(vF), sun = sunD > 2, sx = sun ? vS.dot(vR) / sunD : 0, sy = sun ? vS.dot(vU) / sunD : 0.6 * tanV;
      for (let i = 0; i < n; i++) {
        const b = VIEW[i], a0 = b.pk - b.hw - b.fin, a1 = b.pk + b.hw + b.fout;
        let px = 0, py = -400, pz = 0, yaw = 0, roll = 0, pitch = 0;
        if (act && u > a0 && u < a1) {
          const k = smoothstep(a0, b.pk - b.hw, u) * (1 - smoothstep(b.pk + b.hw, a1, u)), t = (u - b.pk) / 0.05, ph = u * b.wk + b.wp;
          const hs = 1.61 * b.scale;
          let Dd = Math.max(1 / lerp(1 / FAR_D, 1 / b.D, k), hs / (0.42 * tanH));
          let ax = lerp(sx + b.fx, (b.nx + b.vx * t + 0.03 * Math.sin(ph)) * tanH, k), ay = lerp(sy + b.fy, (b.ny + b.vy * t + 0.03 * Math.sin(ph * 1.31 + 1.7)) * tanV, k);
          // the whole bird stays inside the frame, and off the sun's disc and its inner ring of rays
          const mx = Math.max(0, tanH - hs / Dd * 1.05), my = Math.max(0, tanV - hs / Dd * 0.96);
          ax = clamp(ax, -mx, mx); ay = clamp(ay, -my, my);
          if (sun) {
            const need = 11.5 / sunD + hs / Dd * 0.92; let dx = ax - sx, dy = ay - sy, dl = Math.hypot(dx, dy);
            if (dl < need) {
              if (dl < 1e-4) { dx = b.nx < 0 ? -1 : 1; dy = 0; dl = 1; }
              ax = clamp(sx + dx / dl * need, -mx, mx); ay = clamp(sy + dy / dl * need, -my, my);
              if (Math.hypot(ax - sx, ay - sy) < need - 1e-3) ay = clamp(sy - Math.sqrt(Math.max(need * need - (ax - sx) * (ax - sx), 0)), -my, my);
            }
          }
          vP.copy(vF).addScaledVector(vR, ax).addScaledVector(vU, ay).multiplyScalar(Dd).add(camP);
          // its heading lies across the line of sight while it is near (it flies away from us while it is far), and the
          // sheet of its wings is turned toward the lens, tilted a little so the top of the bird leans to the sky
          vV.copy(camP).sub(vP).normalize();
          vEr.copy(vR).addScaledVector(vV, -vV.dot(vR)).normalize(); vEu.crossVectors(vV, vEr);
          const phi = b.phi + 0.12 * Math.sin(ph * 0.7 + 0.6), co = Math.cos(b.out), fl = Math.hypot(vV.x, vV.z) || 1, kf = 1 - k;
          vFd.copy(vEr).multiplyScalar(Math.cos(phi) * co).addScaledVector(vEu, Math.sin(phi) * co).addScaledVector(vV, -Math.sin(b.out)).multiplyScalar(k);
          vFd.x += kf * (-vV.x / fl * 0.94 + vEr.x * 0.3 * Math.cos(phi)); vFd.y += kf * 0.22; vFd.z += kf * (-vV.z / fl * 0.94 + vEr.z * 0.3 * Math.cos(phi)); vFd.normalize();
          vVp.copy(vV).addScaledVector(vFd, -vFd.dot(vV)).normalize();
          vW.crossVectors(vVp, vFd); if (vW.y < 0) vW.negate();
          const sd = lerp(-1, b.side, k), tl = Math.max(b.tilt, 0.35 * (1 - Math.abs(sd)) + 0.2);
          vN.copy(vVp).multiplyScalar(sd * Math.cos(tl)).addScaledVector(vW, Math.sin(tl)).normalize();
          yaw = Math.atan2(vFd.x, vFd.z); pitch = Math.asin(clamp(vFd.y, -1, 1));
          // (the bird's own up, taken back through its yaw and pitch, gives the roll)
          const cy = Math.cos(yaw), sy2 = Math.sin(yaw), n1x = vN.x * cy - vN.z * sy2, n1z = vN.x * sy2 + vN.z * cy, cp = Math.cos(pitch), sp = Math.sin(pitch);
          roll = Math.atan2(-n1x, vN.y * cp - n1z * sp);
          px = vP.x; py = vP.y; pz = vP.z;
        }
        for (let q = 0; q < 2; q++) { const o = (i + q * n) * 4; iA[o] = px; iA[o + 1] = py; iA[o + 2] = pz; iA[o + 3] = yaw; iD[o] = roll; iD[o + 1] = pitch; }
      }
      viewM.geometry.attributes.iA.needsUpdate = true; viewM.geometry.attributes.iD.needsUpdate = true; viewOn = act;
    };
    await ctx.yield();
    // ---------- placing a bird in the picture itself (shared by the raft's lift and the lily pool's heron) ----------
    // The lens as update() sees it (setLens), and the pose of a bird that holds a place in its frame: k = 1 at its place
    // (depth D, frame x and y in -1..1), k = 0 far off beside the sun. As with the climbers, the whole bird stays inside the
    // frame and off the sun, and its belly (side -1) or back (side 1) and both wings are turned to the lens.
    const fp = { x: 0, y: -400, z: 0, yaw: 0, pitch: 0, roll: 0 }, lens = { tanH: 1.07, tanV: 0.6, sx: 0, sy: 0.4, sun: false, sunD: 100 };
    const qF = new V3(0, 0, -1), qR = new V3(1, 0, 0), qU = new V3(0, 1, 0), qP = new V3(), qV = new V3(), qEr = new V3(), qEu = new V3(), qFd = new V3(), qVp = new V3(), qW = new V3(), qN = new V3(), qS = new V3();
    const setLens = (camera, camP) => {
      const me = camera.matrixWorld.elements;
      qF.set(-me[8], -me[9], -me[10]).normalize(); qR.set(-qF.z, 0, qF.x); if (qR.lengthSq() < 1e-6) qR.set(1, 0, 0); qR.normalize(); qU.crossVectors(qR, qF);
      lens.tanV = Math.tan((camera.fov ?? 62) * Math.PI / 360); lens.tanH = lens.tanV * (camera.aspect ?? 1.78);
      qS.copy(seatV).sub(camP); lens.sunD = qS.dot(qF); lens.sun = lens.sunD > 2;
      lens.sx = lens.sun ? qS.dot(qR) / lens.sunD : 0; lens.sy = lens.sun ? qS.dot(qU) / lens.sunD : 0.6 * lens.tanV;
    };
    const framePose = (b, u, k, camP) => {
      const tanH = lens.tanH, tanV = lens.tanV, t = (u - b.pk) / 0.05, ph = u * b.wk + b.wp, hs = 1.61 * b.scale;
      const Dd = Math.max(1 / lerp(1 / FAR_D, 1 / b.D, k), hs / (0.42 * tanH));
      let ax = lerp(lens.sx + b.fx, (b.nx + b.vx * t + 0.025 * Math.sin(ph)) * tanH, k), ay = lerp(lens.sy + b.fy, (b.ny + b.vy * t + 0.025 * Math.sin(ph * 1.31 + 1.7)) * tanV, k);
      const mx = Math.max(0, tanH - hs / Dd * 1.05), my = Math.max(0, tanV - hs / Dd * 0.96);
      ax = clamp(ax, -mx, mx); ay = clamp(ay, -my, my);
      if (lens.sun) {
        const need = 11.5 / lens.sunD + hs / Dd * 0.92; let dx = ax - lens.sx, dy = ay - lens.sy, dl = Math.hypot(dx, dy);
        if (dl < need) {
          if (dl < 1e-4) { dx = b.nx < 0 ? -1 : 1; dy = 0; dl = 1; }
          ax = clamp(lens.sx + dx / dl * need, -mx, mx); ay = clamp(lens.sy + dy / dl * need, -my, my);
          if (Math.hypot(ax - lens.sx, ay - lens.sy) < need - 1e-3) ay = clamp(lens.sy - Math.sqrt(Math.max(need * need - (ax - lens.sx) * (ax - lens.sx), 0)), -my, my);
        }
      }
      qP.copy(qF).addScaledVector(qR, ax).addScaledVector(qU, ay).multiplyScalar(Dd).add(camP);
      qV.copy(camP).sub(qP).normalize();
      qEr.copy(qR).addScaledVector(qV, -qV.dot(qR)).normalize(); qEu.crossVectors(qV, qEr);
      // (a bird of the raft heads for the thermal: its heading on screen is the way to the sun from where it is)
      const phi = (b.toSun ? Math.atan2(lens.sy - ay, (lens.sx - ax) || 1e-4) : 0) + b.phi + 0.1 * Math.sin(ph * 0.7 + 0.6), co = Math.cos(b.out), fl = Math.hypot(qV.x, qV.z) || 1, kf = 1 - k;
      qFd.copy(qEr).multiplyScalar(Math.cos(phi) * co).addScaledVector(qEu, Math.sin(phi) * co).addScaledVector(qV, -Math.sin(b.out)).multiplyScalar(k);
      qFd.x += kf * (-qV.x / fl * 0.94 + qEr.x * 0.3 * Math.cos(phi)); qFd.y += kf * 0.22; qFd.z += kf * (-qV.z / fl * 0.94 + qEr.z * 0.3 * Math.cos(phi)); qFd.normalize();
      qVp.copy(qV).addScaledVector(qFd, -qFd.dot(qV)).normalize();
      qW.crossVectors(qVp, qFd); if (qW.y < 0) qW.negate();
      const sd = lerp(-1, b.side, k), tl = Math.max(b.tilt, 0.35 * (1 - Math.abs(sd)) + 0.2);
      qN.copy(qVp).multiplyScalar(sd * Math.cos(tl)).addScaledVector(qW, Math.sin(tl)).normalize();
      fp.yaw = Math.atan2(qFd.x, qFd.z); fp.pitch = Math.asin(clamp(qFd.y, -1, 1));
      const cy = Math.cos(fp.yaw), sy2 = Math.sin(fp.yaw), n1x = qN.x * cy - qN.z * sy2, n1z = qN.x * sy2 + qN.z * cy, cp = Math.cos(fp.pitch), sp = Math.sin(fp.pitch);
      fp.roll = Math.atan2(-n1x, qN.y * cp - n1z * sp);
      fp.x = qP.x; fp.y = qP.y; fp.z = qP.z;
    };
    const turnTo = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k; };

    // ---------- the raft that lifts off the lily carpet (u 0.41-0.59): the middle of the flight has its own peak ----------
    // Sixteen pelicans loaf in a dense raft on the lily carpet where we come up out of the water. As we burst out they go
    // up in a wave, nearest first: THE RUN (u 0.43): they patter away ahead of the lens at our own speed, the nearest
    // 7-9 m off, wings spread and beating, backs and both black-edged wings to us, feet slapping rings onto the water,
    // torn white scraps of spray flying, honey-yellow glints torn across the water round them. THE LIFT (u 0.52): they
    // are up, each in its own place in the picture (the nearest a quarter to a third of it wide, over the dark willow
    // island on the left), bellies and wings turned to the lens, every one heading for the thermal; then they draw away
    // up the sky to the column before the horseshoe's tracking shot begins.
    // [metres ahead on the run, metres to the right, scale | the lift: depth, frame x, y | wing at t 12 (-1 down .. 1 up), far place from the sun x, y]
    const RAFT = [
      [5.8, 0.5, 1.4, 5.2, -0.50, 0.34, 0.0, -0.10, -0.30], [6.0, 2.4, 1.42, 6.6, 0.10, 0.50, 0.4, 0.05, -0.36], [7.6, 1.6, 1.34, 8.2, 0.62, 0.28, -0.1, 0.20, -0.28],
      [9.2, -0.5, 1.28, 10, -0.84, 0.68, 0.7, -0.28, -0.12], [10.6, 6.4, 1.26, 12, 0.38, 0.74, 0.3, 0.12, -0.18],
      [12.2, 3.6, 1.24, 14, -0.22, 0.26, -0.4, -0.16, -0.34], [15.5, -3.4, 1.24, 18, 0.86, 0.62, 0.6, 0.30, -0.10], [16.5, 0.6, 1.22, 21, 0.32, 0.22, 0.1, 0.24, -0.38],
      [18.5, 6.2, 1.22, 24, -0.62, 0.22, 0.8, -0.34, -0.26], [20, -6.5, 1.22, 27, -0.04, 0.78, -0.3, -0.06, -0.20], [21.5, 2.6, 1.2, 30, -0.36, 0.60, 0.4, -0.22, -0.16],
      [24, -2.2, 1.2, 34, 0.58, 0.50, -0.6, 0.18, -0.14], [26, 8, 1.2, 38, -0.08, 0.36, 0.2, -0.04, -0.30], [28, 4.2, 1.2, 42, 0.20, 0.62, 0.9, 0.10, -0.24],
      [30, -5, 1.2, 46, -0.16, 0.50, -0.2, -0.12, -0.22], [33, 0.5, 1.2, 50, 0.10, 0.42, 0.5, 0.06, -0.28],
    ];
    const R_RATE = 5.4, R_LEAD = 9, R_TAU = 2 * R_LEAD / PL, R_END = 0.6;
    const raftList = RAFT.map((v, i) => {
      const uL = uOut + 0.003 + 0.0006 * i, b = { gap: v[0], lat: v[1], scale: v[2], D: v[3], nx: v[4], ny: v[5], fx: v[7], fy: v[8], vx: (i % 2 ? -0.04 : 0.05), vy: 0.07,
        toSun: true, phi: (i % 3 - 1) * 0.22, out: (12 + 4 * (i % 4)) * Math.PI / 180, side: -1, tilt: (20 + 3 * (i % 3)) * Math.PI / 180,
        pk: 0.52, wk: 70 + 9 * (i % 5), wp: i * 2.4, uL, sR: uL + (v[0] + R_LEAD) / PL, uIn0: 0.452 + 0.0012 * i, uIn1: 0.5 + 0.0006 * i, uOut0: 0.532 + 0.0008 * i, uOut1: 0.585 + 0.0008 * i,
        yawJ: r7.range(-0.7, 0.7), yawRun: 0, pitchRun: 0,
        x: 0, y: 0, z: 0, yaw: 0, launch: uL, seed: r7(), phase: Math.asin(v[6]) - 12 * R_RATE, flap: 1, flush: r7() };
      return b;
    });
    // where a bird of the raft is on its run: at rest until its launch, then gathering speed until it holds its gap ahead of the lens
    const raftRun = (b, u, out) => {
      let s = b.sR;
      if (u > b.uL) { const x = Math.min(1, (u - b.uL) / R_TAU), g1 = b.gap / PL; s = u + g1 + (b.sR - b.uL - g1) * (1 - x) * (1 - x); }
      const go = smoothstep(b.uL, b.uL + 0.01, u);
      offPath(s, b.lat * (1 + 0.12 * smoothstep(b.uL, 0.47, u)), out);
      out.y = 0.02 + 0.3 * go + 2.4 * smoothstep(0.446, 0.51, u);
      const r = RTAB[clamp(Math.round(s * 1000), 0, 1000)];
      b.yawRun = Math.atan2(r[1], -r[0]) + b.yawJ * (1 - go); b.pitchRun = 0.2 * go;
      return out;
    };
    for (const b of raftList) { raftRun(b, 0, _b0); b.x = _b0.x; b.y = _b0.y; b.z = _b0.z; b.yaw = b.yawRun; }
    const raftSets = [[addFlock(raftList.slice(0, 5), { shadow: true, flapRate: R_RATE, slip: 0.1 }, 'raft'), raftList.slice(0, 5)], [addFlock(raftList.slice(5), { shadow: true, lod: true, flapRate: R_RATE }, 'raft-far'), raftList.slice(5)]];
    for (const [m] of raftSets) { m.userData.u.uHover.value.set(0.06, 0.05, 0); for (const k of ['iA', 'iD']) m.geometry.attributes[k].setUsage(THREE.DynamicDrawUsage); }
    await ctx.yield();
    let raftOn = true;
    const driveRaft = (u, camP) => {
      const act = u < R_END;
      if (!act && !raftOn) return;
      for (const [m, list] of raftSets) {
        const iA = m.userData.iA, iD = m.userData.iD, n = list.length;
        for (let i = 0; i < n; i++) {
          const b = list[i]; let x = 0, y = -400, z = 0, yaw = 0, pitch = 0, roll = 0;
          if (act && u < b.uOut1) {
            const kIn = smoothstep(b.uIn0, b.uIn1, u);
            if (kIn < 1) { raftRun(b, u, _b0); x = _b0.x; y = _b0.y; z = _b0.z; yaw = b.yawRun; pitch = b.pitchRun; }
            if (kIn > 0) {
              framePose(b, u, 1 - smoothstep(b.uOut0, b.uOut1, u), camP);
              if (kIn < 1) { x += (fp.x - x) * kIn; y += (fp.y - y) * kIn; z += (fp.z - z) * kIn; yaw = turnTo(yaw, fp.yaw, kIn); pitch += (fp.pitch - pitch) * kIn; roll = fp.roll * kIn; }
              else { x = fp.x; y = fp.y; z = fp.z; yaw = fp.yaw; pitch = fp.pitch; roll = fp.roll; }
            }
          }
          for (let q = 0; q < 2; q++) { const o = (i + q * n) * 4; iA[o] = x; iA[o + 1] = y; iA[o + 2] = z; iA[o + 3] = yaw; iD[o] = roll; iD[o + 1] = pitch; }
        }
        m.geometry.attributes.iA.needsUpdate = true; m.geometry.attributes.iD.needsUpdate = true;
      }
      raftOn = act;
    };
    {
      // what the run leaves on the water and throws into the air: slap rings under every bird, torn white scraps of spray
      // flying forward and outward from its feet, and torn honey-yellow strips of low sun lying across the water round the raft
      for (const b of raftList) for (let u = b.uL + 0.002, j = 0; u < 0.4525; u += 0.003, j++) {
        raftRun(b, u, _p); const r = RTAB[clamp(Math.round(u * 1000), 0, 1000)], fx = r[1], fz = -r[0], sp = 3 + 6 * smoothstep(b.uL, b.uL + R_TAU, u);
        slapRing(_p.x + r7.range(-0.35, 0.35), _p.z + r7.range(-0.35, 0.35), u, r7.range(0.45, 0.75));
        for (let q = 0; q < 2; q++) { const side = r7.range(-2.6, 2.6);
          bill.push([_p.x + r7.range(-0.4, 0.4), 0.15, _p.z + r7.range(-0.4, 0.4), r7.range(0.14, 0.34), r7(), 5, u + r7() * 0.002, r7.range(2.6, 5.2), fx * sp + r[0] * side, fz * sp + r[1] * side, 1, 0]); }
      }
      await ctx.yield();
      for (let i = 0, g = 0; i < 280 && g < 1600; g++) {
        if ((g & 63) === 63) await ctx.yield();
        const q = offPath(r7.range(0.412, 0.535), (r7.chance(0.6) ? 1 : -1) * r7.range(1.2, 15), _p), len = r7.range(0.7, 1.9);
        if (sdfWater(q.x, q.z) > -1.5 || hero.fisherList.some((b) => Math.hypot(b.o[0] - q.x, b.o[1] - q.z) < 1.6)) continue;
        ringRows.push([q.x, q.z, len, 0, r7(), 8, r7(), 0, 0, 0, 0, 0]); i++;
      }
    }
    await ctx.yield();
    // ---------- the lily pool's heron (u 0.2245-0.31): the one clear subject of the pool view ----------
    // It lifts from a pad in the pool's mouth as the gaze turns in, and at u 0.25 it is 5.7 m from the lens, a quarter of
    // the picture wide, its buff back and both white wings turned to us, out to the pool's side of the picture and high
    // enough to stand whole against the dark willows, beside (never across) the bill-tossing pelican that holds the middle
    // with its apricot pouch; then it goes off over the pool's far willows. Its place is in the picture itself, so it is whole with either camera.
    const PH = { D: 5.7, nx: 0.6 * s2, ny: 0.3, vx: 0.05 * s2, vy: 0.05, fx: 0, fy: 0, toSun: false, phi: (90 - s2 * 48) * Math.PI / 180, out: 24 * Math.PI / 180, side: 1, tilt: 0.3, scale: 1.06, pk: 0.25, wk: 80, wp: 1.3 };
    const hExit = new V3(pool2[0] + s2 * (pool2[2] + 7), 11.5, pool2[1] - 9), hPad = heronList[2].pad, hYaw0 = heronList[2].yaw;
    const driveHeron = (u, camP) => {
      if (u < 0.2 || u > 0.32) return;
      const kIn = smoothstep(0.2265, 0.2435, u), kOut = smoothstep(0.262, 0.303, u), iA = heronM.userData.iA, iD = heronM.userData.iD, n = heronList.length;
      let x = hPad.x, y = hPad.y, z = hPad.z, yaw = hYaw0, pitch = 0, roll = 0;
      if (kIn > 0) {
        framePose(PH, u, 1, camP);
        x += (fp.x - x) * kIn; y += (fp.y - y) * kIn * kIn; z += (fp.z - z) * kIn; yaw = turnTo(yaw, fp.yaw, kIn); pitch = fp.pitch * kIn; roll = fp.roll * kIn;
        if (kOut > 0) {
          const yo = Math.atan2(hExit.x - x, hExit.z - z), kt = Math.min(1, kOut * 3);
          x += (hExit.x - x) * kOut; y += (hExit.y - y) * kOut; z += (hExit.z - z) * kOut; yaw = turnTo(yaw, yo, kt); pitch += (0.2 - pitch) * kt; roll *= 1 - kt;
        }
      }
      for (let q = 0; q < 2; q++) { const o = (2 + q * n) * 4; iA[o] = x; iA[o + 1] = y; iA[o + 2] = z; iA[o + 3] = yaw; iD[o] = roll; iD[o + 1] = pitch; }
      heronM.geometry.attributes.iA.needsUpdate = true; heronM.geometry.attributes.iD.needsUpdate = true;
    };
    const seatP = new V3(...A.portalSeat.position), clV = new V3(), _lx0 = new V3(), _lx1 = new V3(), _ca = new V3();
    // The climb's gaze is hung from the sun: it looks as far below the sun as the frame allows with the whole disc and
    // every ray still inside the top edge, so the lagoon keeps as much of the lower picture as it can have; it swings a
    // little to the left of the sun at 0.79 and lifts into the cloud's eye after 0.82.
    // (the sun's rays are drawn in a little while it is far off on the climb and open out again as we come up to it)
    const rayK = (u) => 1 - 0.38 * smoothstep(0.6, 0.68, u) * (1 - smoothstep(0.78, 0.9, u));
    const climbAim = (u, out) => {
      path.pointAt(u, _ca);
      const dx = seatP.x - _ca.x, dy = seatP.y - _ca.y, dz = seatP.z - _ca.z, hl = Math.hypot(dx, dz) || 1, hx = dx / hl, hz = dz / hl, sd = Math.hypot(hl, dy);
      const yaw = -0.04 - 0.22 * bell(u, 0.73, 0.86, 0.4), cy = Math.cos(yaw), sy = Math.sin(yaw);
      const below = Math.atan(Math.max(0.05, (0.6009 - (8.4 + 20.1 * rayK(u)) / sd - 0.014) * cy * cy)) * (1 - 0.5 * smoothstep(0.82, 0.88, u));
      const pitch = Math.max(0.12, Math.atan2(dy, hl) - below);
      return out.set(_ca.x + (hx * cy - hz * sy) * 60, _ca.y + Math.tan(pitch) * 60, _ca.z + (hx * sy + hz * cy) * 60);
    };
    await ctx.yield();
    {
      // The climb's two large near birds are white paper: in the stills (t 12 and 40) no white cumulus may stand behind
      // the head and body of either, so a stack that would is slid down toward the horizon or lifted clear above.
      const arr = blobMesh.geometry.attributes.iA.array, cp = new V3(), aim = new V3(), M = 0.17;
      for (let pass = 0; pass < 2; pass++) for (const [u0, hx, hy] of [[0.7, -0.5, 0.15], [0.79, -0.41, 0.1]]) for (const du of [-0.012, 0, 0.012]) for (const T of [12, 40]) {
        await ctx.yield();
        path.pointAt(u0 + du, cp); climbAim(u0 + du, aim);
        let fx = aim.x - cp.x, fy = aim.y - cp.y, fz = aim.z - cp.z; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
        const rl = Math.hypot(fx, fz) || 1, rx0 = -fz / rl, rz0 = fx / rl, ux = -rz0 * fy, uy = rz0 * fx - rx0 * fz, uz = rx0 * fy;
        let hxw = fx + rx0 * hx + ux * hy, hyw = fy + uy * hy, hzw = fz + rz0 * hx + uz * hy;
        const hEl = Math.atan2(hyw, Math.hypot(hxw, hzw)), hAz = Math.atan2(hxw, hzw);
        for (const [i0, k] of stacks) {
          let hit = false, dn = 0, up = 0;
          for (let j = 0; j < k; j++) {
            const r = blobRows[i0 + j], o = (i0 + j) * 4, x = ((r[0] - T * r[7] + 1700) % 3400 + 3400) % 3400 - 1700, y = arr[o + 1], sz = r[3];
            const dx = x - cp.x, dz = r[2] - cp.z, hd = Math.hypot(dx, dz) || 1, el = Math.atan2(y - cp.y, hd);
            let da = Math.atan2(dx, dz) - hAz; da = Math.atan2(Math.sin(da), Math.cos(da));
            const aw = 0.45 * sz * r[5] / hd + M, ah = 0.45 * sz / hd + M, de = el - hEl;
            if (Math.abs(da) < aw) { dn = Math.min(dn, hd * Math.tan(hEl - ah) - (y - cp.y)); up = Math.max(up, hd * Math.tan(hEl + ah) - (y - cp.y)); if (Math.abs(de) < ah) hit = true; }
          }
          if (!hit) continue;
          const low = arr[i0 * 4 + 1] + dn > 60, dy = low && -dn < up * 1.6 ? dn : up;
          for (let j = 0; j < k; j++) arr[(i0 + j) * 4 + 1] += dy;
        }
      }
    }
    const pois = [
      // up at the skein as it comes over, into the backwater as the reed wall opens, up at the ibis file
      { at: (time, u) => { const q = ptAt(clamp(u + 7 / PL, 0, 1)); return skV.set(q.x, q.y + 4.3, q.z); }, from: 0.085, to: 0.15, weight: 0.6, fade: 0.3 },
      { at: (time, u) => { sideOf(clamp(u + 8.5 / PL, 0, 1), ps * 8, pkV); pkV.y = 0.9; return pkV.lerpVectors(poolLook, pkV, smoothstep(0.148, 0.172, u)); }, from: 0.122, to: 0.218, weight: 0.68, fade: 0.3 },
      { at: (time, u) => ibV.set(pool2[0] - s2 * 4, 1.0, pool2[1] - 9), from: 0.224, to: 0.288, weight: 0.74, fade: 0.3 },        // through the opening onto the lily pool
      { at: [pool3[0] - s2 * 6, 1.3, pool3[1] - 5], from: -0.03, to: 0.052, weight: 0.36, fade: 0.3 },                          // the entry bay
      { at: (time, u) => { stationAt(dalRef, u, dalV); dalV.x -= 1.2; return dalV; }, from: 0.405, to: 0.495, weight: 0.5, fade: 0.3 },
      { at: (time, u) => gazeAt(u, gazeV), from: 0.44, to: 0.625, weight: 0.9, fade: 0.22 },
      rare ? { at: (time, u) => { const q = ptAt(clamp(u + 9 / PL, 0, 1)); return rareV.set(q.x, Math.max(0.8, q.y - 4.0), q.z); }, from: 0.585, to: 0.652, weight: 0.66, fade: 0.3 }
        : { at: (time, u) => { const q = ptAt(clamp(u + 10 / PL, 0, 1)); return rareV.set(q.x, lerp(Math.max(0.6, q.y - 1.4), q.y + 1.6, smoothstep(0.607, 0.645, u)), q.z); }, from: 0.592, to: 0.672, weight: 0.5, fade: 0.4725 },
      // the climb: the gaze is held down so that the lagoon, its islands and the colonies lie across the lower third with
      // the thermal standing over them and the sun in the cloud's eye at the top; it pans left across the far shore at
      // 0.79, then lifts into the eye
      { at: (time, u) => climbAim(u, clV), from: 0.612, to: 0.9, weight: 0.95, fade: 0.2 },
      { at: A.portalSeat.position, from: 0.8, to: 0.975, weight: 0.62 },
    ];
    // (the same gaze worked out from the exact route position, for whatever is placed in the picture itself on the climb)
    // (calm is the viewer's steady camera, read off the lens itself in update, so that the big bird of the climb sits in the
    // picture with either camera)
    let calmK = 0;
    const lookDirX = (u, out, calm = calmK) => {
      const guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u)) * (1 - 0.65 * calm);
      path.pointAt(u, _lx0); path.posAtDist(Math.min(u * PL + Math.min(14 * (1 + 2.4 * calm), Math.max(14, PL * 0.22)), PL), out).sub(_lx0);
      out.normalize(); if (calm > 0) { out.y *= 1 - 0.45 * calm; out.normalize(); }
      for (const p of pois) {
        const w = bell(u, p.from, p.to, p.fade ?? 0.3) * p.weight * guard; if (w <= 0.001) continue;
        const a = typeof p.at === 'function' ? p.at(0, u) : p.at;
        if (a.isVector3) _lx1.copy(a); else _lx1.set(a[0], a[1], a[2]);
        out.multiplyScalar(1 - w).addScaledVector(_lx1.sub(_lx0).normalize(), w).normalize();
      }
      return out;
    };
    // the gaze the engine will take at u with the sweeping camera: the route ahead, then each point of interest in turn
    const lookDir = (u, out) => {
      const c0 = ptAt(u), guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
      out.copy(ptAt(clamp(u + 14 / PL, 0, 1))).sub(c0).normalize();
      for (const p of pois) {
        const w = bell(u, p.from, p.to, p.fade ?? 0.3) * p.weight * guard; if (w <= 0.001) continue;
        const a = typeof p.at === 'function' ? p.at(0, u) : p.at;
        if (a.isVector3) _q.copy(a); else _q.set(a[0], a[1], a[2]);
        out.multiplyScalar(1 - w).addScaledVector(_q.sub(c0).normalize(), w).normalize();
      }
      return out;
    };
    // ---------- the boiling shoal at the bend (u 0.6, the ordinary pass) ----------
    // Dealt in the picture itself: fish 3.3-13 m out where the gaze falls at u 0.6, rings beside their dealt spots and under
    // the bill, and one fisher works the shoal close in, tail up in mid-dip as we look. Before buildBill each fish whose box is
    // not 2 m clear of our line is stood off it (the rings stay): the near five are carried across the line, to our right at u 0.6.
    const shoalInfo = {};
    // The birds that rise ahead of us in the rare take-off are kept in the picture itself: once up, none is nearer than
    // 7.5 m ahead of the lens, and while it is near enough to be large it is drawn in from the left and right edges whole.
    const fitTakeoff = (u, camera, camP) => {
      if (u < 0.572 || u > 0.77 || !takeoffD.on) return;
      const e = camera.matrixWorld.elements, hl = Math.hypot(e[8], e[10]) || 1, lx = -e[8] / hl, lz = -e[10] / hl, tanH = Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
      const iA = takeoffD.m.userData.iA, iD = takeoffD.m.userData.iD, n = takeoffD.list.length, sh = takeoffD.m.userData.copies;
      for (let i = 0; i < n; i++) {
        const b = takeoffD.list[i], k = i * 4, LT = (u - b.launch) * 40;
        if (!b.hold || LT <= 0 || iA[k + 1] < -300) { if (iD[k + 1] !== 0) for (let q = 0; q < sh; q++) iD[(i + q * n) * 4 + 1] = 0; continue; }
        const ramp = smoothstep(0, 0.5, LT), vx = iA[k] - camP.x, vz = iA[k + 2] - camP.z, hs = 1.61 * (b.scale ?? 1);
        let al = vx * lx + vz * lz, la = vz * lx - vx * lz;
        if (al < 7.5) al += (7.5 - al) * ramp;
        const lim = Math.max(0.6, al * tanH * 0.95 - hs * 1.1), nearK = 1 - smoothstep(17, 27, Math.hypot(al, la));
        if (Math.abs(la) > lim) la += (Math.sign(la) * lim - la) * nearK * ramp;
        let x = camP.x + lx * al - lz * la, y = iA[k + 1], z = camP.z + lz * al + lx * la;
        if (b.star) {
          // the nearest of them: once it is up it holds a place 8 m out in the right half of the picture, wings working,
          // until the climb begins (u 0.60-0.65)
          const w = smoothstep(b.launch + 0.006, b.launch + 0.024, u) * (1 - smoothstep(0.64, 0.675, u)), ta = 6.9, tl = 0.46 * tanH * ta;
          x += (camP.x + lx * ta - lz * tl - x) * w; z += (camP.z + lz * ta + lx * tl - z) * w; y += (Math.max(1.0, camP.y - e[9] / hl * ta - 1.15) - y) * w;
        }
        // each climbs nose up, the more the lower it sits in the lens's eye, so that from behind its back and both wings show
        // (a bird well above the eye line shows its belly anyway)
        const el = Math.atan2(y - camP.y, Math.hypot(x - camP.x, z - camP.z) || 1), pit = clamp(el + 0.5, 0.3, 0.75) * (1 - smoothstep(0.3, 0.6, el)) * ramp * (1 - smoothstep(20, 32, Math.hypot(al, la)));
        for (let q = 0; q < sh; q++) { const o = (i + q * n) * 4; iA[o] = x; iA[o + 1] = y; iA[o + 2] = z; iD[o + 1] = pit; }
      }
      takeoffD.m.geometry.attributes.iD.needsUpdate = true;
    };
    await ctx.yield();
    {
      const U_SH = 0.6, c0 = ptAt(U_SH), gd = lookDir(U_SH, new V3()), sp = new V3(), fq = new V3(-900, 0, -900); gd.y = 0; gd.normalize();
      const fan = (c, g, d, a, out) => out.set(c.x + d * (g.x * Math.cos(a) - g.z * Math.sin(a)), 0, c.z + d * (g.z * Math.cos(a) + g.x * Math.sin(a)));   // a > 0: right of the gaze
      const idx = hero.joiners.first + JOIN.length + EXTRA.findIndex((e) => e.shoal);
      // the nearest free place for it: as close as the 3.2 m rule allows, 17-34 degrees off the gaze on either side
      let best = 1e9;
      for (let ia = -19; ia <= 19; ia++) for (let id = 0; id <= 12; id++) {
        if (id === 0 && (ia & 3) === 0) await ctx.yield();
        const a = ia * 0.04, d = 4.4 + id * 0.2, cost = d + 4 * Math.max(0, Math.abs(a) - 0.58) + 3 * Math.max(0, 0.3 - Math.abs(a));
        if (cost >= best) continue;
        fan(c0, gd, d, a, sp);
        let md = 1e9; for (let i = 540; i <= 680; i++) md = Math.min(md, Math.hypot(PT[i].x - sp.x, PT[i].z - sp.z, Math.max(0, PT[i].y - 1.3)));
        if (md < 3.2 || hero.fisherList.some((b, j) => j !== idx && (Math.hypot(b.c[0] - sp.x, b.c[1] - sp.z) < 2.0 || Math.hypot(b.o[0] - sp.x, b.o[1] - sp.z) < 2.0))) continue;
        best = cost; fq.copy(sp); shoalInfo.fisher = [+a.toFixed(2), +d.toFixed(1), +md.toFixed(1)];
      }
      if (fq.x > -800) {
        fan(c0, gd, 5.0, 0.1 * Math.sign(-shoalInfo.fisher[0]), sp);
        hero.setPlace(idx, fq.x, fq.z, Math.atan2(sp.x - fq.x, sp.z - fq.z)); hero.setPhase(idx, waveAt(U_SH) - 0.3);
      }
      // and on the other side the nearest bird of the arm itself, 15-32 degrees left of the gaze, is cut a third larger
      // and dips out of turn, so that it too is tail up as we look
      {
        let bi = -1, bd = 8.2; const fl = hero.fisherList, n = fl.length;
        fl.forEach((b, i) => {
          if (b.joiner) return;
          const dx = b.c[0] - c0.x, dz = b.c[1] - c0.z, al = dx * gd.x + dz * gd.z, la = dz * gd.x - dx * gd.z, a = Math.atan2(la, al), d = Math.hypot(dx, dz);
          if (a < -0.26 && a > -0.6 && d < bd) { bd = d; bi = i; }
        });
        if (bi >= 0) {
          const fm = hero.object.getObjectByName('fishers'), rm = hero.object.getObjectByName('rings'), sc = Math.min(1.36, Math.max(1.3, fl[bi].scale * 1.3));
          fl[bi].scale = sc; hero.setPhase(bi, waveAt(U_SH) - 0.3);
          for (const sh of [0, 1]) fm.userData.iB[(bi + sh * n) * 4 + 2] = sc;
          for (let k = 0; k < 3; k++) rm.userData.iB[(bi * 3 + k) * 4 + 2] = sc;
          shoalInfo.left = [bi, +bd.toFixed(1)];
        }
      }
      // The shoal is dealt with depth: up to five big fish (two or three a seed on forty seeds) 3.3-4.7 m out, each cut a hand larger,
      // the rest behind them 5.6-13 m out, smaller and to different heights, clear of the fishers. The near five are dealt there, in our
      // lane: the law at the build (the stand-off before buildBill) carries them clear of our line, across it: at u 0.6 they are on our
      // right, out of the frame as flown (a still posed at u 0.6, its lens set on the gaze with no slow turn, has one in its right
      // quarter on some seeds).
      // From its own fisher at fq the shoal keeps 2.3 m, the near five 1.7 m (KQ: read by the dealing here and by the stand-off before buildBill).
      let nFish = 0, nNear = 0; const KQ = [2.3, 1.7]; shoalInfo.own = [fq.x, fq.z, KQ];
      await ctx.yield();
      for (let i = 0; i < 240 && nFish < 28; i++) {
        if ((i & 15) === 15) await ctx.yield();
        const near = nNear < 5 && i % 2 === 0, ur = rz(), u = near ? U_SH : U_SH - 0.002 + 0.006 * ur, d = near ? rz.range(3.3, 4.7) : rz.range(5.6, 13), a = near ? (nNear - 2 + rz.range(-0.3, 0.3)) * 0.2 : rz.range(-0.62, 0.62), cu = ptAt(u);
        lookDir(u, _b0); _b0.y = 0; _b0.normalize(); fan(cu, _b0, d, a, sp);
        if (path.nearestXZ(sp.x, sp.z).dist < 1.1 || Math.hypot(sp.x - fq.x, sp.z - fq.z) < KQ[+near] ||hero.fisherList.some((b) => Math.hypot(b.c[0] - sp.x, b.c[1] - sp.z) < (near ? 1.5 : 2.1))) continue;
        bill.push([sp.x, 0, sp.z, near ? rz.range(0.86, 1.04) : rz.range(0.6, 0.9), rz(), 7, rz(), near ? rz.range(0.42, 0.7) : rz.range(0.5, 1.5), rz.range(0.95, 1.4), 0.62, rz(), 0]); nFish++;
        if (near) { const r = bill[bill.length - 1], q = 0.1 + 0.085 * nNear - 12 / r[8]; r[6] = q - Math.floor(q); r[11] = 1; nNear++; }       // (the near five's phases: at clock 12 each is at a different point of its leap; the stand-off then carries them to our right at u 0.6)
        if (i % 5 === 0) ringRows.push([sp.x + rz.range(-0.6, 0.6), sp.z + rz.range(-0.6, 0.6), rz.range(0.4, 0.75), 0, rz(), 2, rz(), 0, 0, 0, 0, 0]);
      }
      for (let i = 0; i < 6; i++) {                  // rings close under the bill
        fan(c0, gd, rz.range(1.7, 3.6), rz.range(-0.8, 0.8), sp);
        ringRows.push([sp.x, sp.z, rz.range(0.28, 0.5), 0, rz(), 2, rz(), 0, 0, 0, 0, 0]);
      }
      shoalInfo.fish = nFish;
    }
    await ctx.yield();
    // the rare event: a white-tailed eagle swings in over our shoulder and crosses low ahead of the lens; every head in
    // the horseshoe comes up, and the back row and the right arm take off ahead of us, so that we climb out through them
    let eagle = null, takeoff = null, takeoffD = null; const U_EAGLE = 0.6, U_ALERT = 0.5725, U_UP = 0.58;
    const fishersMesh = hero.object.getObjectByName('fishers'), ringsMesh = hero.object.getObjectByName('rings');
    if (rare) {
      const dk = lin('#2C2F66').multiplyScalar(0.62), c0 = ptAt(U_EAGLE), ah = ptAt(U_EAGLE + 14 / PL).clone().sub(c0).normalize(), gz = gazeW(U_EAGLE, new V3()).sub(c0).normalize();
      const wg = 0.9 * bell(U_EAGLE, 0.44, 0.625, 0.22), gd = ah.multiplyScalar(1 - wg).addScaledVector(gz, wg); gd.y = 0; gd.normalize();
      const E0 = new V3(c0.x + gd.x * 10, c0.y + 3.4, c0.z + gd.z * 10), ca = Math.cos(0.42), sa = Math.sin(0.42);
      const EV = new V3(gd.x * ca - gd.z * sa, 0.025, gd.x * sa + gd.z * ca).multiplyScalar(17);       // away and to the right
      eagle = addDriven([{ scale: 1.56, seed: 0.3, flap: 1, flush: 0, show0: 0.52, show1: 0.76, custom: (u, out) => out.copy(E0).addScaledVector(EV, (u - U_EAGLE) * 40) }],
        { colors: { white: dk, cream: dk, flush: dk, tail: lin('#FBF7EA').multiplyScalar(0.9), ink: lin('#1B1E48').multiplyScalar(0.7), face: mixc(dk, P[4], 0.45), bill: lin('#F2C63A').multiplyScalar(0.92), pouch: lin('#F2C63A').multiplyScalar(0.92), pouchDeep: lin('#E0A92E') },
          lod: true, neck: [0.5, 0.2, -0.3], flapRate: 3.4 }, 'eagle');
      eagle.userData.u.uHover.value.set(0.25, 0, 0);
      await ctx.yield();
      const rows = hero.fisherList.filter((b) => b.c[1] < 100).map((b) => { const x = b.c[0], z = b.c[1]; let bu = 0.6, bd = 1e9; for (let i = 540; i <= 700; i++) { const d = Math.hypot(PT[i].x - x, PT[i].z - z); if (d < bd) { bd = d; bu = i / 1000; } }
        const r = RTAB[Math.round(bu * 1000)], q = ptAt(bu); return { b, x, z, bu, bd, side: (x - q.x) * r[0] + (z - q.z) * r[1] > 0 ? 1 : -1 }; });
      rows.forEach((r, i) => { if (r.bd < 9) r.side = i % 3 ? -1 : 1; });
      const aheadSet = rows.filter((r) => r.bu >= 0.598 && r.bd < 30).sort((p, q) => (p.bu + p.bd * 0.0012) - (q.bu + q.bd * 0.0012));
      const list = [];
      for (let ri = 0; ri < rows.length; ri++) {
        const r = rows[ri];
        if (ri % 6 === 5) await ctx.yield();
        const k = aheadSet.indexOf(r), fr = k < 0 ? 0 : k / Math.max(1, aheadSet.length - 1);
        let launch = k < 0 ? U_UP + 0.004 + rng() * 0.014 : U_UP + 0.001 + 0.011 * fr + rng() * 0.003;
        // a bird close ahead goes up while we are still a dozen metres short of it (so it is airborne and ahead, inside the
        // picture, as we come up); one we pass before it lifts goes up behind us; one far out to the side stays far out
        if (k >= 0) launch = Math.min(launch, Math.max(U_UP - 0.004, r.bu - 0.024)); else if (r.bu < 0.598) launch = Math.max(launch, r.bu + 0.004);
        const uab = k < 0 ? launch - 0.03 - rng() * 0.05 : 0.636 + 0.165 * Math.pow(fr, 1.1);
        let lat = r.side * rng.range(5.4, 9.5) * (k < 0 && r.bu >= 0.598 ? 3.6 : 1), dy = rng.range(-3.2, 3.4); const hl = Math.hypot(lat, dy); if (hl < 5.7) { lat *= 5.7 / hl; dy *= 5.7 / hl; }
        if (k === 0) lat = Math.abs(lat);            // the nearest of them rises on the right
        const bird = { vrel: rng.range(3.0, 4.6), uab, lat, dy, spread: 0, from: [r.x, 0, r.z], launch, w0: 0.25, w1: rng.range(2.1, 2.6) * (k >= 0 ? 0.7 : 1), yaw: r.b.yaw, show0: -1, show1: Math.max(uab, launch) + 0.07,
          scale: r.b.scale, seed: r.b.seed, dal: r.b.dal, phase: k === 0 ? Math.PI / 2 - 60 : r.b.seed * 6, flap: 1 };      // (the nearest has its wings up in a still at t 12)
        // the birds that rise ahead of us are not overtaken: they climb ahead in a loose flock 8-40 m off and pull away to the thermal
        if (k >= 0) {
          const u1 = 0.652 + 0.05 * fr;
          const a = 8 + 31 * fr, lm = 3.2 + (Math.abs(lat) - 5.4) / 4.1 * 0.25 * a, dyh = lerp(-0.42 * a, 0.0, clamp((dy + 3.2) / 6.6, 0, 1));
          bird.hold = { u0: launch, din: 0.001, u1, dout: 0.08, a, lat: Math.sign(lat) * Math.max(3.2, lm), dy: dyh, aIn: 0, sIn: 0, dyIn: 0, aOut: 62, latOut: Math.sign(lat) * 26, dyOut: 6,
            aw: 0.7, lw: 0.45, dw: 0.35, wk: 60 + 35 * r.b.seed, wp: r.b.seed * 40 };
          bird.show1 = u1 + 0.08; bird.star = k === 0; if (k === 0) bird.scale = Math.max(bird.scale ?? 1, 1.4);
        }
        const L = bird.hold ?? bird;
        for (let tries = 0; tries < 8; tries++) {    // nobody may cross within 4.3 m of the lens
          let md = 1e9;
          for (let u = bird.launch; u < bird.show1; u += 0.001) { birdAt(bird, u, _p); md = Math.min(md, _p.distanceTo(ptAt(u))); }
          if (md > 4.3) break;
          if (tries % 2 === 0) L.lat = -L.lat; else { if (bird.hold) { L.a += 2.6; L.lat += Math.sign(L.lat) * 0.5; } else L.lat += Math.sign(L.lat) * 1.6; bird.launch += 0.005; bird.show1 += 0.005; }
        }
        list.push(bird);
      }
      await ctx.yield();
      takeoff = addDriven(list, { lod: true, clipY: -0.02, flapRate: 5 }, 'takeoff');
      takeoffD = driven[driven.length - 1]; takeoff.geometry.attributes.iD.setUsage(THREE.DynamicDrawUsage);
      takeoff.visible = false;
      for (const b of list) {                        // slap rings and torn white scraps where each bird runs
        for (let j = 0; j < 3; j++) { const u = b.launch + 0.004 + j * 0.006; birdAt(b, u, _p); slapRing(_p.x, _p.z, u, rng.range(0.5, 0.8)); }
        for (let j = 0; j < 2; j++) bill.push([b.from[0] + rng.range(-0.6, 0.6), 0.2, b.from[2] + rng.range(-0.6, 0.6), rng.range(0.16, 0.36), rng(), 5, b.launch + 0.002 + j * 0.006, rng.range(3, 7), rng.range(-2.5, 2.5), rng.range(-5, -1), 0, 0]);
      }
    }
    {
      // u 0.34: marsh frogs leap across the bow from the pads just ahead, one after another, so that several are in the air
      // at once in the middle of the picture: [metres ahead of the lens at 0.34, to the right, how far through its leap,
      // which way it leaps (1 = to the right), leap length, extra height, size]
      const U_F = 0.34, c0 = path.pointAt(U_F, new V3()), g = lookDir(U_F, new V3()); g.y = 0; g.normalize(); const fx = -g.z, fz = g.x;
      // One law for all eight, in metres of route, sets how far through its leap each frog is at 0.34. A row's lead is the route metre
      // of the foot of its landing place on the route's table, less the lens's own metre at the instant the leap ends (u is metres of
      // route over the route's length, so no speed is in it). A row whose lead as dealt is 2 m of route or more, from the lens to the
      // foot of its landing place, is left as dealt, and the least lead among those rows is given to the others: a row whose dealt lead
      // is under that least is taken further through its leap at 0.34 until its lead reaches that least (by halving, the upper end kept),
      // and its pad and its rings go with it; for such a row the table's third number is only where it is dealt, not where it is at 0.34.
      // If no row is left as dealt the least stays unbounded and every row is taken to its leap's end; a row whose lead at its leap's
      // end is still under the least is likewise put at its end.
      const iF = Math.round(U_F * 1000), routeM = (x, z) => {      // the route metre of the foot of (x, z) on the route's table, from the key to 0.03 of the route beyond it (the rows stand 3.3 to 10.4 m ahead of the key)
        let best = 1e9, m = 0;
        for (let i = iF; i < iF + 30; i++) {
          const a = PT[i], b = PT[i + 1], ex = b.x - a.x, ez = b.z - a.z, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez), 0, 1), qx = a.x + ex * t - x, qz = a.z + ez * t - z, q = qx * qx + qz * qz;
          if (q < best) { best = q; m = (i + t) * PL / 1000; }
        }
        return m;
      };
      const leaps = []; let lead0 = Infinity;
      for (const [d, l, j, way, len, hz, size] of [[3.3, -1.5, 0.5, 1, 1.25, -0.42, 0.6], [4.6, 1.9, 0.3, -1, 1.5, -0.2, 0.66], [5.6, -0.7, 0.68, 1, 1.3, -0.05, 0.66], [6.6, 2.5, 0.55, -1, 1.5, 0.1, 0.72],
        [7.6, -2.6, 0.22, 1, 1.5, 0.0, 0.72], [8.8, 0.6, 0.8, -1, 1.2, 0.15, 0.74], [4.0, 2.7, 0.84, -1, 1.0, -0.3, 0.56], [10.4, -1.2, 0.42, 1, 1.4, 0.25, 0.78]]) {
        const dx = (fx * way * 0.94 + g.x * 0.34) * len, dz = (fz * way * 0.94 + g.z * 0.34) * len;
        const lead = (q) => routeM(c0.x + g.x * d + fx * l + dx * (1 - q) * 2.3, c0.z + g.z * d + fz * l + dz * (1 - q) * 2.3) - (U_F + (1 - q) * 0.0175) * PL;
        const l0 = lead(j); if (l0 >= 2.0) lead0 = Math.min(lead0, l0);
        leaps.push([d, l, j, dx, dz, hz, size, lead, l0]);
      }
      for (const [d, l, j0, dx, dz, hz, size, lead, l0] of leaps) {
        let j = j0;
        if (l0 < lead0) { let a = j0, b = 1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (lead(m) < lead0) a = m; else b = m; } j = b; }
        const sx = c0.x + g.x * d + fx * l - dx * j * 2.3, sz = c0.z + g.z * d + fz * l - dz * j * 2.3, uS = U_F - j * 0.0175;
        if (sdfWater2(sx, sz) > -0.1) continue;
        ringRows.push([sx, sz, size * 1.5, 0, r5(), 0, r5(), r5(), 0, 0, 0, 0]);                         // its pad
        bill.push([sx, 0.06, sz, size, r5(), 0, uS, 0, dx, dz, hz, 0]);
        ringRows.push([sx, sz, 0.3, 0, r5(), 6, uS, 0, 0, 0, 0, 0], [sx + dx * 2.3, sz + dz * 2.3, 0.42, 0, r5(), 6, uS + 0.0175, 0, 0, 0, 0, 0]);   // a ring where it left, a ring where it lands
      }
    }
    await ctx.yield();
    flatField(ringRows, above);
    await ctx.yield();
    {
      // The leaping fish (kind 7) and the hero's arc fish are stood 2 m off the camera's whole line by the place of their boxes (the part's
      // standOff; no draw, the rows in their order, the rings where dealt). A kind 7 fish's box, from its program: wander 1.6 / 2; leap
      // 2.3 / 2 either way, y -0.04 to r[7] - 0.04; far corner 0.61 x r[3] x hypot(1, 0.44) (both in the single precision the field holds
      // them in). Its dealing's keep-out from a fisher: 1.5 m the near five (r[11]), 2.1 m the shoal (r[9]), 1.8 m the bend's (r[12]), none the
      // backwater's; and the shoal's from its own fisher (own: that fisher's place and the dealing's KQ).
      const fr = Math.fround, k7 = bill.filter((r) => r[5] === 7), so = shoalInfo.own, fish = k7.map((r) => ({ x: r[0], z: r[2], h: 1.6 / 2, slabs: [[2.3 / 2, -0.04, fr(r[7]) - 0.04]], skin: 0.61 * fr(r[3]) * Math.hypot(1, 0.44), keep: r[11] ? 1.5 : r[9] ? 2.1 : r[12] ?? 0, own: r[9] ? [so[0], so[1], so[2][r[11]]] : null }));
      shoalInfo.stood = await hero.standFish(path, PT, fish);
      k7.forEach((r, i) => { r[0] = fish[i].x; r[2] = fish[i].z; });
    }
    buildBill();
    await ctx.yield();

    // ---------- under the surface: a cream ceiling with moving rings, an olive floor, light strips, stems, carp ----------
    const duskH = look.hour === 'dusk';             // by moonlight the ceiling is periwinkle paper going to indigo, with silver rings
    const ceilC = duskH ? lin('#A9B6FF').multiplyScalar(0.9) : mixc(P[0], P[6], 0.2).multiplyScalar(0.88), oliveC = mixc(P[5], P[6], 0.68).multiplyScalar(0.84);
    const amberC = mixc(P[6], lin('#D8641E'), 0.5).multiplyScalar(0.62);
    for (const ceil of [1, 0]) {
      const g = new THREE.PlaneGeometry(700, 700); g.rotateX(ceil ? Math.PI / 2 : -Math.PI / 2); g.translate(-5, ceil ? 0.1 : -3.3, 110);
      const m = new THREE.Mesh(g, mat({ uCeil: { value: ceil }, uCeilCol: { value: ceilC }, uOlive: { value: oliveC }, uAmber: { value: amberC },
        uCeilWarm: { value: duskH ? lin('#8E7CF4') : P[6].clone().multiplyScalar(1.05) }, uCeilFar: { value: duskH ? lin('#5560E0') : P[6].clone().multiplyScalar(0.78) } }, /* glsl */`
        varying vec3 vW; varying float vDist;
        void main() { vW = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`, /* glsl */`
        varying vec3 vW; varying float vDist;
        uniform float uCeil, uTime; uniform vec3 uCeilCol, uCeilWarm, uCeilFar, uOlive, uAmber, uHoney, uDeep;
        ${PAPER_GLSL}
        void main() {
          vec2 w = vW.xz; float dist = length(vW - cameraPosition);
          vec4 a = texture2D(uPaper, w * 0.06 + vec2(uTime * 0.012, 0.0)), b = texture2D(uPaper, w * 0.023 - vec2(0.0, uTime * 0.008) + 0.4);
          vec3 col;
          if (uCeil > 0.5) {
            col = mix(uCeilCol, uCeilCol * vec3(0.84, 0.95, 1.0), smoothstep(0.48, 0.52, b.r));
            col = mix(col, uCeilWarm, smoothstep(0.52, 0.55, b.a) * 0.3);
            col = mix(col, uWhite * 1.04, (1.0 - smoothstep(0.0, 0.03, abs(a.r - 0.5))) * 0.75);
            col = mix(col, uCeilWarm * 0.857, smoothstep(0.5, 0.56, texture2D(uPaper, w * 0.011 + 0.2).a) * 0.45);
            col = mix(col, uCeilFar, 1.0 - exp(-dist * 0.022));
          } else {
            // the bed: honey paper with amber and olive-gold sheets torn over it and pale veins of light crawling across
            vec4 c2 = texture2D(uPaper, w * 0.13 + vec2(0.0, uTime * 0.02) + 0.7);
            col = mix(uHoney * 0.74, uOlive, smoothstep(0.5, 0.54, a.a) * 0.85);
            col = mix(col, uAmber, smoothstep(0.55, 0.58, b.r) * 0.8);
            col = mix(col, mix(uOlive, uDeep, 0.35) * 0.9, smoothstep(0.66, 0.69, b.a) * 0.55);
            col = mix(col, uHoney * 1.12, (1.0 - smoothstep(0.0, 0.03, abs(c2.r - 0.5))) * 0.5 * (1.0 - smoothstep(4.0, 16.0, dist)));
            col = mix(col, uHoney * 1.02, (1.0 - smoothstep(0.0, 0.025, abs(b.a - 0.5))) * 0.45);
            col *= 0.84 + 0.32 * a.b;
            col = mix(col, uHoney * 0.8, 1.0 - exp(-dist * 0.045));
          }
          gl_FragColor = vec4(col * uTint, 1.0);
        }`, { alphaToCoverage: false }));
      m.frustumCulled = false; under.add(m);
    }
    await ctx.yield();
    {
      const ru = rng.fork('under'), rows = [], shafts = [], zc = (holeAt.z + exitAt.z) / 2;
      // light shafts: strips of pale tissue hanging from the surface 3 to 9 m off the route on both sides, leaning with the
      // drawn sun; each has its lilac shadow copy slipped out behind it (the first half of the rows)
      for (let i = 0; i < 60; i++) {
        const u = lerp(uIn - 0.014, uOut + 0.04, (i + ru()) / 60), q = beside(clamp(u, 0, 1), (i % 2 ? 1 : -1) * (3.2 + 5.6 * Math.pow(ru(), 1.3)));
        const len = ru.range(3.0, 3.4), wd = ru.range(0.6, 1.1), sd = ru();
        if (path.nearestXZ(q[0], q[1]).dist < 2.8) continue;
        shafts.push([q[0], 0, q[1], len, sd, 0, wd * 1.4, 0, 0, 0, 0, 0]);
      }
      // Each shaft is a strip of pale honey tissue torn down both long sides (big ragged bites and a fine tear, a faint
      // white deckle just inside), a little narrower at the bed than at the surface, its foot swaying slowly while a slow
      // wave runs down it; the carp and stems show through it. No edge of it is straight.
      field(shafts.map((r) => { const c = r.slice(); c[5] = 1; return c; }).concat(shafts), {
        parent: under, geo: new THREE.PlaneGeometry(1, 1, 1, 10), order: 2.8, params: { transparent: true, depthWrite: false, alphaToCoverage: false },
        uniforms: { uCeilCol: { value: ceilC } },
        vert: /* glsl */`
          float len = iA.w, sd = iB.x, shd = iB.y, s = q.y + 0.5, dn = 1.0 - s;
          c = vec3(iA.x, 0.1, iA.z) + vec3(uShadowDir.x * 0.42, -1.0, uShadowDir.z * 0.42) * len * dn;
          c.xz += dn * sqrt(dn) * 0.5 * vec2(sin(uTime * 0.7 + sd * 30.0), cos(uTime * 0.6 + sd * 21.0));
          c += flatR * 0.11 * dn * sin(uTime * 1.1 + s * 5.0 + sd * 17.0);
          if (shd > 0.5) { vec3 away = c - cameraPosition; c += vec3(uShadowDir.x, 0.0, uShadowDir.z) * 0.2 + away / max(length(away), 1e-3) * 0.12; c.y -= 0.06; }
          float wdt = max(iB.z * (0.58 + 0.42 * s), length(cameraPosition - c) * uPx * 3.0);
          T = flatR * wdt; W = vec3(0.0);
          P = vec4(shd, len, wdt, sd);`,
        fpars: 'uniform vec3 uCeilCol;',
        frag: /* glsl */`
          float shd = vP.x, len = vP.y, s = vQ.y + 0.5, ax = abs(vQ.x) * 2.0, sideK = step(0.0, vQ.x);
          puv = vec2(vQ.x * vP.z * 1.6 + sideK * 0.37, s * len * 0.95) + seed;
          vec4 nr = texture2D(uPaper, vec2(seed * 3.7 + sideK * 0.5, s * len * 0.3 + seed));      // big bites out of each long edge
          e = min((1.0 - ax) * 1.3 - 0.44 * nr.a + 0.02, min(s * 6.0 + 0.08, (1.0 - s) * 5.0));
          tearK = 1.0; deck = 0.75 * (1.0 - shd);
          float th = 0.05 + 0.46 * texture2D(uPaper, puv * 0.9 + vec2(seed, seed * 1.7)).r, rim = (1.0 - smoothstep(th + 0.04, th + 0.17, e)) * (1.0 - shd);
          col = mix(mix(mix(uCeilCol, uWhite, 0.6), uHoney * 1.5, 0.42) * 1.08, mix(uShade, uHoney, 0.22) * 0.96, shd);
          alpha = mix(mix(0.42, 0.34, shd), 0.82, rim) * smoothstep(1.2, 3.2, vDist) * exp(-vDist * 0.035);`,
      });
      await ctx.yield();
      // lily stems under their pads (none within 1.8 m of the lens), bubbles, bed weed
      for (let i = 0; i < flat.length; i++) {
        if ((i & 511) === 511) await ctx.yield();
        const f = flat[i];
        if (f[5] === 0 && Math.abs(f[1] - zc) < 30 && Math.abs(f[0] + 5.5) < 16 && f[2] > 0.3 && path.nearestXZ(f[0], f[1]).dist > 1.8) rows.push([f[0], 0, f[1], 3.4, ru(), 1, 0.035, 0, 0, 0, 0, 0]);
      }
      await ctx.yield();
      for (let i = 0; i < 120; i++) { const q = beside(ru.range(uIn, uOut + 0.01), ru.gauss() * 2.4); rows.push([q[0], -2.9, q[1], ru.range(0.04, 0.085), ru(), 2, 0, ru(), 0, 0, 0, 0]); }
      for (let i = 0; i < 200; i++) rows.push([-5.5 + ru.gauss() * 6, -3.3, zc + ru.range(-26, 24), ru.range(0.5, 1.5), ru(), 3, 0.09, 0, 0, 0, 0, 0]);
      field(rows, {
        parent: under, order: 3, params: { transparent: true, depthWrite: false, alphaToCoverage: false },
        uniforms: { uCeilCol: { value: ceilC }, uPadA: { value: P[3].clone().multiplyScalar(0.8) } },
        vert: /* glsl */`
          float kind = iB.y, len = iA.w, sd = iB.x, s = q.y + 0.5, wd = iB.z; c = iA.xyz;
          W = vec3(0.0, len, 0.0);
          if (kind < 1.5) { c.y = -len * 0.5 + 0.03; c.xz += sin(3.1416 * s) * 0.25 * vec2(sin(uTime * 0.8 + sd * 30.0 + s * 3.0), cos(uTime * 0.7 + sd * 11.0)); }
          else if (kind < 2.5) { float qd = fract(uTime * 0.3 + iB.w); c.y += qd * 2.7; c.x += 0.1 * sin(uTime * 3.0 + sd * 40.0); len *= sin(3.1416 * qd); }
          else { c.y += len * 0.5; c.xz += s * s * 0.3 * vec2(sin(uTime * 0.9 + sd * 30.0), cos(uTime * 0.8 + sd * 13.0)); }
          float dc = length(cameraPosition - c);
          if (kind > 1.5 && kind < 2.5) { len = min(len, dc * uPx * 10.0); T = camR * len; W = camU * len; }
          else T = flatR * max(wd, dc * uPx * 2.0);
          P = vec4(kind, 0.0, 0.0, sd);`,
        fpars: 'uniform vec3 uCeilCol, uPadA;',
        frag: /* glsl */`
          float kind = vP.x, s = vQ.y + 0.5; deck = 0.0; tearK = 0.6;
          if (kind < 1.5) { e = 1.0; col = mix(uDeep, uPadA, 0.4) * 0.8; tearK = 0.0; alpha = smoothstep(0.7, 1.9, vDist); }
          else if (kind < 2.5) { float rr = length(vQ * 2.0); e = 1.0; tearK = 0.0; alpha = 0.75 * (1.0 - smoothstep(0.35, 1.0, rr)) * smoothstep(0.7, 1.8, vDist); }
          else { e = min(1.0 - abs(vQ.x) * 2.0, (1.0 - s) * 4.0) * 1.5; col = mix(uPadA, uHoney, 0.45) * 0.8; alpha = smoothstep(0.6, 1.6, vDist); }
          col = mix(col, uHoney * 0.78, (1.0 - exp(-vDist * 0.06)) * step(0.5, kind));
          puv = vec2(vQ.x * 0.2, vQ.y * 2.0) + seed;`,
      });
      await ctx.yield();
      // carp: bronze cut-outs with dark dabs, a cream belly and a shadow sheet slipped out below; they scull and part as we come
      const carp = [];
      for (let i = 0; i < 46; i++) {
        const u = lerp(uIn + 0.003, uOut + 0.012, (i + ru()) / 46), sd = i % 2 ? 1 : -1, q = beside(u, sd * (ru.range(1.35, 2.5) + (i % 3 === 2 ? ru.range(1.2, 3.4) : 0))), yw = yawAt(u) - sd * Math.PI / 2 + ru.range(-0.45, 0.45);
        at(u); carp.push([q[0], clamp(_p.y + ru.range(-0.75, 0.3), -2.6, -0.7), q[1], ru.range(1.45, 1.95), ru(), 0, u, sd, Math.sin(yw), Math.cos(yw), 0, 0]);
      }
      const bronzeC = mixc(P[6], lin('#A2561A'), 0.72).multiplyScalar(0.8);
      field(carp, {
        parent: under, geo: new THREE.PlaneGeometry(1, 1, 8, 1), order: 2,
        uniforms: { uBronze: { value: bronzeC }, uBack: { value: mixc(bronzeC, WU.uDeep.value, 0.55).multiplyScalar(0.72) }, uFin: { value: mixc(P[1], bronzeC, 0.45).multiplyScalar(0.92) },
          uDab: { value: WU.uDeep.value.clone().multiplyScalar(0.5) }, uCream: { value: mixc(P[0], P[6], 0.22).multiplyScalar(0.9) } },
        vert: /* glsl */`
          float sd = iB.x, len = iA.w; vec3 dir = vec3(iC.x, 0.0, iC.y), sdv = vec3(-dir.z, 0.0, dir.x);
          float part = smoothstep(iB.z - 0.04, iB.z - 0.008, uU);
          c = iA.xyz + dir * (0.4 * sin(uTime * 0.3 + sd * 9.0) + part * 1.1);
          c += sdv * sin(q.x * 5.0 - uTime * (5.0 + 3.0 * part) + sd * 20.0) * 0.1 * len * (0.55 - q.x);
          c.y += 0.05 * sin(uTime * 0.8 + sd * 30.0);
          T = dir * len; W = vec3(0.0, len * 0.56, 0.0);
          P = vec4(0.0, 0.0, 0.0, sd);`,
        fpars: /* glsl */`uniform vec3 uBronze, uBack, uFin, uDab, uCream;
          // x = body, y = fins and tail (each 0 on its rim, rising inside)
          vec2 carpE(vec2 q) {
            float hb = 0.5 * (0.62 + 0.38 * smoothstep(-0.55, 0.3, q.x));
            float body = 1.0 - length((q - vec2(0.2, 0.02)) / vec2(0.74, hb));
            float t = clamp((-0.4 - q.x) / 0.56, 0.0, 1.0), ht = 0.12 + 0.7 * t;
            float tail = min(1.0 - abs(q.y) / ht, (abs(q.y) - 0.5 * smoothstep(0.55, 1.0, t)) * 5.0 + 1.0) * step(q.x, -0.4) * step(-0.97, q.x);
            float dors = 1.0 - length((q - vec2(0.06, 0.48)) / vec2(0.46, 0.3));
            float anal = 1.0 - length((q - vec2(-0.3, -0.4)) / vec2(0.17, 0.24));
            float pelv = 1.0 - length((q - vec2(0.14, -0.5)) / vec2(0.17, 0.24));
            float pect = 1.0 - length((q - vec2(0.52, -0.36)) / vec2(0.16, 0.2));
            return vec2(body, max(max(tail * 0.8, dors), max(anal, max(pelv, pect))));
          }`,
        frag: /* glsl */`
          vec2 q = vQ * 2.0; vec4 n = texture2D(uPaper, vQ * vec2(0.5, 0.3) + seed), n2 = texture2D(uPaper, vQ * vec2(1.7, 0.95) + seed * 3.0);
          tearK = 0.0; deck = 0.0;
          vec2 eb = carpE(q), es = carpE(q - vec2(-0.05, -0.13));
          float sh = max(eb.x, eb.y), th = 0.07 + 0.26 * n2.r;
          if (sh > th) {
            e = 1.0;
            if (eb.x > th) {
              col = mix(uBronze, uBack, smoothstep(0.02, 0.34, q.y + (n.b - 0.5) * 0.2));
              col = mix(col, uDab, smoothstep(0.5, 0.55, n.a) * smoothstep(-0.2, 0.05, q.y) * 0.9);
              col = mix(col, uDab, smoothstep(0.62, 0.66, n2.a) * smoothstep(-0.25, 0.0, q.y) * 0.7);
              col = mix(col, uCream, (1.0 - smoothstep(-0.34, -0.16, q.y + (n.r - 0.5) * 0.12)) * 0.9);
              float gill = abs(length((q - vec2(0.44, 0.02)) / vec2(0.2, 0.4)) - 1.0);
              col = mix(col, uBack * 0.8, (1.0 - smoothstep(0.05, 0.1, gill)) * step(0.5, q.x) * 0.8);
              float ey = length(q - vec2(0.72, 0.1));
              if (ey < 0.105) col = ey < 0.062 ? uDab * 0.8 : uCream;
            } else { col = uFin * (0.84 + 0.3 * step(0.5, fract(atan(q.y, q.x - 0.1) * 5.0 + q.x * 6.0))); }
            col = mix(col, uCream * 1.05, (1.0 - smoothstep(th + 0.02, th + 0.1, sh)) * 0.55);
          } else { e = max(es.x, es.y) > 0.16 ? 1.0 : 0.0; col = mix(uDab, uHoney, 0.5) * 0.9; alpha = 0.6; }
          col = mix(col, uHoney * 0.78, 1.0 - exp(-vDist * 0.032));
          puv = vQ * vec2(1.2, 0.6) + seed;`,
      });
    }
    // the tear: three rings of hinged flaps that curl open where we stoop through the surface
    {
      const rows = [];
      tan(uIn); const hl = Math.hypot(_q.x, _q.z) || 1, hx = _q.x / hl, hz = _q.z / hl;
      for (let layer = 0; layer < 3; layer++) for (let k = 0; k < 12; k++) {
        const a = (k + 0.5 * layer + rng.range(-0.15, 0.15)) / 12 * TAU, len = 1.5 + 0.25 * layer + rng.range(-0.2, 0.2), sd = rng();
        if (-(Math.cos(a) * hx + Math.sin(a) * hz) > 0.3) continue;            // nothing stands on the side we come in over
        rows.push([holeAt.x, holeAt.z, 1.7 + 0.32 * layer, a, sd, layer, uIn, len, 0, 0, 0, 0]);
      }
      field(rows, {
        geo: new THREE.PlaneGeometry(1, 1, 1, 4), uniforms: { uFlapA: { value: P[2].clone() }, uFlapB: { value: mixc(P[2], P[5], 0.6) } },
        vert: /* glsl */`
          float s = q.y + 0.5, layer = iB.y, sd = iB.x;
          float open = smoothstep(iB.z - 0.05 + 0.004 * layer, iB.z - 0.014, uU);
          vec3 radial = vec3(cos(iA.w), 0.0, sin(iA.w)), tang = vec3(-radial.z, 0.0, radial.x);
          float th = open * (2.45 + 0.3 * sd) - open * 0.9 * s + 0.1 * open * sin(uTime * 5.0 + sd * 30.0);
          c = vec3(iA.x, 0.05 + 0.03 * layer, iA.y) + radial * iA.z + iB.w * s * (-radial * cos(th) + vec3(0.0, sin(th), 0.0));
          T = tang * iA.z * 0.58 * (1.0 - 0.92 * s) * step(0.001, open); W = vec3(0.0);
          P = vec4(layer, s, 0.0, sd);`,
        fpars: 'uniform vec3 uFlapA, uFlapB;',
        frag: /* glsl */`
          float s = vP.y; tearK = 0.7;
          e = min((0.5 - abs(vQ.x)) * 2.0 + 0.2, (1.0 - s) * 2.5 + 0.15);
          col = vP.x < 0.5 ? uFlapA : vP.x < 1.5 ? uWhite : uFlapB;
          if (!gl_FrontFacing) col = uWhite * 0.97;
          puv = vec2(vQ.x, s * 2.0) + seed;`,
      });
    }
    await ctx.yield();

    // ---------- weather sheets: slanted rain strips (shower), mist sheets on the water (dawn) ----------
    {
      const rw = rng.fork('weather'), rows = [];
      if (shower) for (let i = 0, n = Math.round(650 * detail); i < n; i++) rows.push([rw.range(0, 50), rw.range(0, 24), rw.range(0, 50), rw.range(1.1, 2.2), rw(), 0, 0, 0, 0, 0, 0, 0]);
      // dawn mist: long low strips of torn paper lying on the water (under a metre tall, a torn white top edge), drawn across
      // the channel in front of the reed feet, over the backwater and out on the lagoon; the lens passes over them
      if (look.hour === 'dawn') {
        const strip = (x, z, dx, dz, len, h) => { const l = Math.hypot(dx, dz) || 1; rows.push([x, 0, z, len, rz(), 1, h, 0, dx / l, dz / l, 0, 0]); };
        for (let k = 0; k < 13; k++) {
          const u = 0.028 + 0.0225 * (k + 0.6 * rz()), a = rz.range(-0.3, 0.3); at(u); tan(u);
          if (_p.y < 0.95) continue;
          const l = Math.hypot(_q.x, _q.z) || 1, tx = _q.x / l, tz = _q.z / l, off = rz.range(-1.6, 1.6);
          strip(_p.x - tz * off, _p.z + tx * off, -tz * Math.cos(a) + tx * Math.sin(a), tx * Math.cos(a) + tz * Math.sin(a), rz.range(6.5, 9.5), Math.min(rz.range(0.5, 0.8), _p.y - 0.22));
        }
        for (let k = 0; k < 6; k++) { const a = rz() * TAU, r = Math.sqrt(rz()) * pool[2] * 0.7, b = rz() * TAU; strip(pool[0] + Math.cos(a) * r, pool[1] + Math.sin(a) * r, Math.cos(b), Math.sin(b), rz.range(8, 14), rz.range(0.5, 0.85)); }
        for (let k = 0, g = 0; k < 14 && g < 80; g++) {
          const u = rz.range(uOut + 0.02, 0.66), sd = rz.sign(), q = beside(u, sd * rz.range(9, 46)), a = rz.range(-0.5, 0.5); tan(u);
          if (sdfWater(q[0], q[1]) > -6 || Math.hypot(q[0], q[1] + 2) < 44 || path.nearestXZ(q[0], q[1]).dist < 8) continue;
          const l = Math.hypot(_q.x, _q.z) || 1, tx = _q.x / l, tz = _q.z / l;
          strip(q[0], q[1], -tz * Math.cos(a) + tx * Math.sin(a), tx * Math.cos(a) + tz * Math.sin(a), rz.range(12, 22), rz.range(0.6, 1.0)); k++;
        }
      }
      rows.push([30, 64, -195, 0, 0.5, 2, 0.5, 0, 0, 0, 0, 0]);       // (keeps the field from being empty on a clear day; nothing is drawn)
      field(rows, {
        order: 5, params: { transparent: true, depthWrite: false, alphaToCoverage: false },
        uniforms: { uRain: { value: mixc(P[2], P[0], 0.55) }, uMist: { value: mixc(lin(L.cloud[0]), skyCols[6], 0.4).multiplyScalar(0.9) } },
        vert: /* glsl */`
          float kind = iB.y;
          if (kind < 0.5) {
            vec3 dn = normalize(vec3(-0.25, -1.0, -0.1)), o = iA.xyz + dn * uTime * 11.0;
            c = cameraPosition + mod(o - cameraPosition + vec3(25.0, 12.0, 25.0), vec3(50.0, 24.0, 50.0)) - vec3(25.0, 12.0, 25.0);
            vec3 tc = cameraPosition - c;
            W = dn * iA.w; T = normalize(cross(dn, tc) + vec3(1e-4, 0.0, 0.0)) * max(0.025, length(tc) * uPx * 1.6);
          } else if (kind < 1.5) {
            vec3 along = vec3(iC.x, 0.0, iC.y);
            c = iA.xyz + along * 1.4 * sin(uTime * 0.07 + iB.x * 20.0); c.y = iB.z * 0.5 + 0.03;
            T = along * iA.w; W = vec3(0.0, iB.z, 0.0);
            P.y = iA.w; P.z = iB.z;
          } else { c = iA.xyz; T = flatR * iA.w * iB.z; W = vec3(0.0, iA.w, 0.0); }
          P = vec4(kind, P.y, P.z, iB.x);`,
        fpars: 'uniform vec3 uRain, uMist;',
        frag: /* glsl */`
          deck = 0.0;
          if (vP.x < 0.5) { tearK = 0.0; col = uRain; alpha = 0.55 * (1.0 - abs(vQ.y) * 2.0); }
          else if (vP.x < 1.5) {
            // a strip of mist: torn along the top and at both ends (white deckle on the tear), melting into the water below
            float s = vQ.y + 0.5, len = vP.y; vec4 n = texture2D(uPaper, vec2(vQ.x * len * 0.13, s * 0.1) + seed);
            float top = (1.0 - s) * 1.25 - 0.12 + (n.a - 0.5) * 1.3 + (n.r - 0.5) * 0.5;
            e = min(top, (0.5 - abs(vQ.x)) * len * 0.8 + (n.r - 0.5) * 1.6);
            col = uMist * (0.96 + 0.1 * n.b); deck = 1.0; tearK = 0.6; farK = 0.3;
            alpha = 0.6 * smoothstep(0.0, 0.3, s) * smoothstep(1.6, 5.5, vDist);
            puv = vec2(vQ.x * len, s * vP.z) * 0.7 + seed;
          }
          else { vec4 n = texture2D(uPaper, vQ * vec2(0.4, 0.9) + seed); e = min((1.0 - abs(vQ.x) * 2.0) * 1.3 + (n.a - 0.5) * 0.9, (0.5 - abs(vQ.y)) * 5.0 + (n.r - 0.5) * 0.6);
            col = uShade * 1.05; alpha = 0.3 * smoothstep(70.0, 190.0, vDist); farK = 0.15; }
          if (vP.x < 0.5 || vP.x > 1.5) puv = vQ * vec2(3.0, 1.0) + seed;`,
      });
    }

    // ---------- the thermal from afar: a tower of circling paper birds ----------
    // From the channel the column is 300-540 m off and its real soarers are specks, so it is drawn there as what it is:
    // some sixty cut-out pelicans (white, ink wing tips, a lilac shadow sheet slipped out behind each) wheeling on banked
    // wings in a funnel under the cloud, each cut about a twenty-fifth of the picture wide whatever the distance. They
    // shrink away between 290 and 170 m, where the hero's own jointed soarers have grown large enough to take over.
    {
      const soarA = hero.object.getObjectByName('soarers').geometry.attributes.iA.array, sense = soarA[3] < 0 ? -1 : 1, rows = [];
      for (let i = 0, n = clamp(Math.round(40 * nSoar / 205), 24, 58); i < n; i++) {
        const y = 17 + 109 * Math.pow((i + rx()) / n, 0.9), r = rx.range(8, 20 + 24 * Math.sin(Math.PI * Math.min(1, (y - 15) / 113)));
        rows.push([r, y, rx() * TAU + sense * y * 0.05, sense * rx.range(7.5, 10.5) / r, rx(), rx.range(0.85, 1.2), rx.chance(0.2) ? 1 : 0, 0, 0, 0, 0, 0]);
      }
      field(rows, {
        uniforms: { uColumn: { value: new V3(...A.columnFoot) }, uInk: { value: C.ink.clone() } },
        vpars: 'uniform vec3 uColumn;',
        vert: /* glsl */`
          float ang = iA.z + uTime * iA.w, sd = iB.x, dirS = iA.w < 0.0 ? -1.0 : 1.0;
          vec3 radial = vec3(cos(ang), 0.0, sin(ang));
          c = uColumn + radial * (iA.x + 1.2 * sin(uTime * 0.23 + sd * 11.0)) + vec3(0.0, iA.y + 1.5 * sin(uTime * 0.37 + sd * 23.0), 0.0);
          vec3 tc = cameraPosition - c; float dc = length(tc);
          float sz = dc * 0.058 * iB.y * smoothstep(170.0, 290.0, dc);
          float bank = dirS * (0.42 + 0.12 * sin(uTime * 0.31 + sd * 9.0));
          vec3 span = radial * cos(bank) + vec3(0.0, sin(bank), 0.0);
          vec2 sp = vec2(dot(span, camR), dot(span, camU)); float sl = max(length(sp), 1e-3); vec2 sn = sp / sl;
          T = (camR * sn.x + camU * sn.y) * sz * max(sl, 0.45); W = (camU * sn.x - camR * sn.y) * sz * 0.5;
          if (W.y < 0.0) W = -W;
          P = vec4(iB.z * sin(uTime * 4.2 + sd * 31.0), 0.0, 0.0, sd);`,
        fpars: /* glsl */`uniform vec3 uInk;
          float farBird(vec2 q, float fl, float fat) {            // a pelican from below or behind: body, two long wings with a shallow kink
            float ax = abs(q.x) * (1.0 - 0.1 * fat), yc = (0.34 + 0.3 * fl) * ax * (1.0 - 0.55 * ax) - 0.12, th = 0.17 * (1.0 - 0.72 * ax) + 0.17 * exp(-ax * ax * 26.0) + 0.1 * fat;
            return 1.0 - abs(q.y - yc) / max(th, 0.02);
          }`,
        frag: /* glsl */`
          vec2 q = vQ * 2.0 * 1.12; float pe = farBird(q, vP.x, 0.0), se = max(farBird(q, vP.x, 1.0), farBird(q - vec2(-0.1, -0.14), vP.x, 0.6)), ax = abs(q.x);
          tearK = 0.0; deck = 0.0; farK = 0.25;
          if (pe > 0.12) { e = 1.0; float yc = (0.34 + 0.3 * vP.x) * ax * (1.0 - 0.55 * ax) - 0.12; col = mix(uWhite, uInk, max(smoothstep(0.56, 0.66, ax), step(q.y, yc - 0.035) * step(0.2, ax))); }
          else { e = se > 0.12 ? 1.0 : 0.0; col = mix(uShade, uInk, 0.22); }
          puv = vQ + seed;`,
      });
    }
    await ctx.yield();

    // ---------- the colonies far below the climb ----------
    // From the climb the lagoon lies across the lower third of the picture: on it, a raft of pelicans fishing in a crescent
    // under the foot of the thermal and a long line working the far reed shore. They are cut-outs in profile (white, ink
    // wing tips, straw bill and apricot pouch, a lilac shadow sheet, a torn white wake), cut larger with distance once the
    // lens is high so that each still reads as a bird, and the dip runs along each line as it does round the horseshoe.
    {
      const rows = [], CA = [22, -186], put = (x, z, k, ph) => { if (sdfWater2(x, z) < -2.5 && Math.hypot(x, z) > 60) rows.push([x, z, k, r5.sign(), r5(), 0, ph, 0, 0, 0, 0, 0]); };
      for (let i = 0; i < 44; i++) { const f = (i + r5.range(-0.3, 0.3)) / 43, a = (f - 0.5) * 3.7, R = 27 + (i % 2) * 2.6 + r5.range(-0.8, 0.8); put(CA[0] + Math.sin(a) * R, CA[1] - Math.cos(a) * R * 0.8, r5.range(0.9, 1.12), f * 1.6); }
      for (let i = 0; i < 12; i++) { const a = r5() * TAU, R = Math.sqrt(r5()) * 15; put(CA[0] + Math.cos(a) * R, CA[1] + 6 + Math.sin(a) * R * 0.7, r5.range(0.85, 1.0), r5()); }
      for (let i = 0; i < 58; i++) { const f = (i + r5.range(-0.3, 0.3)) / 57, a = 4.2 + f * 0.86, R = LR - 14 - (i % 2) * 3 - 7 * Math.sin(f * 9.0) + r5.range(-1, 1); put(LC[0] + Math.cos(a) * R, LC[1] + Math.sin(a) * R, r5.range(0.9, 1.12), f * 2.4); }
      for (const q of northIsl) for (let i = 0; i < 7; i++) { const a = r5() * TAU, R = q[2] + r5.range(4, 11); put(q[0] + Math.cos(a) * R, q[1] + Math.sin(a) * R, r5.range(0.8, 0.95), r5()); }
      // the sixth round: a crescent fishing in the north bay and birds round the new islands
      const put6 = (x, z, k, ph) => { if (sdfWater3(x, z) < -2.5) rows.push([x, z, k, r6.sign(), r6(), 0, ph, 0, 0, 0, 0, 0]); };
      for (let i = 0; i < 40; i++) { const f = (i + r6.range(-0.3, 0.3)) / 39, a = 3.5 + f * 2.4, R = 62 + (i % 2) * 4 + 9 * Math.sin(f * 7); put6(bay[0] + Math.cos(a) * R, bay[1] + 24 + Math.sin(a) * R * 0.6, r6.range(0.95, 1.15), f * 2); }
      for (const q of newIsl) for (let i = 0; i < 8; i++) { const a = r6() * TAU, R = q[2] + r6.range(5, 14); put6(q[0] + Math.cos(a) * R, q[1] + Math.sin(a) * R, r6.range(0.85, 1.0), r6()); }
      field(rows, {
        uniforms: { uInk: { value: C.ink.clone() }, uApricot: { value: P[1].clone().multiplyScalar(0.95) }, uBillC: { value: C.bill.clone() } },
        vert: /* glsl */`
          float sd = iB.x; c = vec3(iA.x, 0.0, iA.y);
          c.xz += 0.7 * vec2(sin(uTime * 0.21 + sd * 30.0), cos(uTime * 0.17 + sd * 17.0));
          float dc = length(cameraPosition - c);
          float sz = mix(2.0, max(2.0, dc * 0.058), smoothstep(7.0, 20.0, cameraPosition.y)) * iA.z;
          float f = fract(uTime / 3.0 - iB.z);
          T = flatR * sz * iA.w; W = vec3(0.0, sz * 0.8, 0.0); c.y = sz * 0.24 + 0.012 * sz * sin(uTime * 1.7 + sd * 30.0);
          P = vec4(smoothstep(0.07, 0.19, f) * (1.0 - smoothstep(0.4, 0.52, f)), smoothstep(0.44, 0.54, f) * (1.0 - smoothstep(0.76, 0.92, f)), 0.0, sd);`,
        fpars: /* glsl */`uniform vec3 uInk, uApricot, uBillC;
          float segC(vec2 p, vec2 a, vec2 b, float w) { vec2 pa = p - a, ba = b - a; return 1.0 - length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) / w; }
          // a swimming pelican in profile, head toward +x: x = the white bird, y = bill and pouch, z = the ink of the folded wing tip
          vec3 swimmer(vec2 q, float dip, float full) {
            float body = 1.0 - length((q - vec2(-0.14, -0.3)) / vec2(0.6, 0.3 - 0.06 * dip));
            float tail = segC(q, vec2(-0.6, -0.26), vec2(-0.86, -0.02 + 0.3 * dip), 0.13);
            vec2 hd = mix(vec2(0.44, 0.5), vec2(0.5, -0.5), dip);
            float neck = max(segC(q, vec2(0.26, -0.22), mix(vec2(0.22, 0.2), vec2(0.42, -0.4), dip), 0.12), segC(q, mix(vec2(0.22, 0.2), vec2(0.42, -0.4), dip), hd, 0.11));
            float head = 1.0 - length((q - hd) / vec2(0.16, 0.13));
            float bill = segC(q, hd + vec2(0.1, 0.0), hd + vec2(0.52, -0.3 + 0.16 * full), 0.06 + 0.07 * full);
            float tip = 1.0 - length((q - vec2(-0.5, -0.36)) / vec2(0.3, 0.13));
            return vec3(max(max(body, tail), max(neck, head)), bill, tip);
          }`,
        frag: /* glsl */`
          vec2 q = vQ * 2.0; float dip = vP.x, full = vP.y;
          vec3 b = swimmer(q, dip, full), sh = swimmer(q - vec2(-0.1, -0.1), dip, full);
          float wake = (1.0 - abs(length((q - vec2(-0.1, -0.62)) / vec2(0.92, 0.2)) - 1.0) / 0.3) * step(q.y, -0.56);
          tearK = 0.0; deck = 0.0; farK = 0.3;
          if (max(b.x, b.y) > 0.1) {
            e = 1.0; col = b.y > b.x ? mix(uBillC, uApricot, 0.35 + 0.65 * full) : uWhite;
            if (b.z > 0.25 && b.x > 0.1) col = uInk;
            if (q.y < -0.56) e = 0.0;                      // the water line
          } else if (max(sh.x, sh.y) > 0.1 && q.y > -0.56) { e = 1.0; col = mix(uShade, uInk, 0.15); }
          else { e = wake > 0.0 ? 1.0 : 0.0; col = uWhite; }
          puv = vQ + seed;`,
      });
    }
    await ctx.yield();

    const sunRayK = { value: 1 };
    // ---------- the sun in the cloud's eye: cut-paper rays round the exit ----------
    // A ring of torn paper rays, long and short by turns, in two warm papers, each with a lilac shadow sheet slipped out
    // behind it, and a pale disc behind the opening itself. They lie in the plane of the portal and turn slowly; they are
    // drawn straight after the sky and the cloud and before everything else, so the cloud never hides them and every bird
    // passes in front. The same sun warms the wings of whatever flies near it (the hero's uSunK).
    {
      const dir = new V3(...A.portalSeat.direction).normalize(), e1 = new V3().crossVectors(dir, new V3(0, 1, 0)).normalize(), e2 = new V3().crossVectors(e1, dir).normalize(), rows = [];
      const NR = 18;
      for (const pass of [1, 0]) for (let i = 0; i < NR; i++) {
        const long = i % 2 === 0, a = (i + 0.5) / NR * TAU + r5.range(-0.05, 0.05) * (pass ? 0 : 0);
        rows.push([a, long ? 8.1 : 8.4, long ? 15.5 + 4 * Math.sin(i * 2.3) : 8.0 + 1.5 * Math.cos(i * 1.7), long ? 5.2 : 4.0, 0.13 + i * 0.071, pass, long ? 0 : 1, long ? 0.011 : -0.016, 0, 0, 0, 0]);
      }
      rows.push([0, 0, 21, 21, 0.61, 2, 2, 0, 0, 0, 0, 0]);
      const cloudM = hero.object.getObjectByName('cloud'); if (cloudM) cloudM.renderOrder = -2.5;
      const sunC = L.sun.map(lin);
      field(rows, {
        order: -2, params: { depthTest: false, depthWrite: false },
        uniforms: { uSeat: { value: seatP.clone() }, uE1: { value: e1 }, uE2: { value: e2 }, uDirP: { value: dir }, uRayA: { value: sunC[0].multiplyScalar(0.92) }, uRayB: { value: sunC[1].multiplyScalar(0.92) }, uRayC: { value: sunC[2].multiplyScalar(0.86) }, uRayK: sunRayK },
        vpars: 'uniform vec3 uSeat, uE1, uE2, uDirP; uniform float uRayK;',
        vert: /* glsl */`
          float kind = iB.y, ang = iA.x + uTime * iB.w, len = iA.z * (1.0 + 0.03 * sin(uTime * 0.5 + iB.x * 40.0)) * (kind < 1.5 ? uRayK : 1.0);
          vec3 ax = uE1 * cos(ang) + uE2 * sin(ang), side = uE1 * -sin(ang) + uE2 * cos(ang);
          c = uSeat + uDirP * 0.6;
          if (kind < 1.5) { c += ax * (iA.y + len * 0.5); T = side * iA.w; W = ax * len; if (kind > 0.5) c += (uE1 * -0.55 + uE2 * -0.4) * (0.6 + 0.04 * len) + uDirP * 0.2; }
          else { T = uE1 * iA.z; W = uE2 * iA.w; }
          P = vec4(kind, iB.z, len, iB.x);`,
        fpars: 'uniform vec3 uRayA, uRayB, uRayC;',
        frag: /* glsl */`
          float kind = vP.x, s = vQ.y + 0.5; vec4 n = texture2D(uPaper, vQ * vec2(0.5, 1.3) + seed);
          farK = 0.0; tearK = 0.8;
          if (kind < 1.5) {
            // a ray: a long torn triangle, widest a little way out from its foot
            float wd = (1.0 - s) * (0.35 + 0.65 * smoothstep(0.0, 0.12, s));
            e = min((1.0 - abs(vQ.x) * 2.0 / max(wd, 0.02)) * 1.2, s * 9.0 + 0.3) + (n.a - 0.5) * 0.5;
            col = vP.y < 0.5 ? mix(uRayA, uRayC, smoothstep(0.55, 0.6, n.b) * 0.35) : uRayB;
            col = mix(col, uRayC, (1.0 - smoothstep(0.0, 0.2, s)) * 0.5);
            if (kind > 0.5) { col = uShade * 0.95; deck = 0.0; }
            puv = vec2(vQ.x * 1.5, s * vP.z * 0.3) + seed;
          } else {
            float len = length(vQ * 2.0);
            e = (1.0 - len) * 2.4 + (n.a - 0.5) * 0.7;
            col = mix(uRayC, uRayA, smoothstep(0.62, 0.9, len + (n.r - 0.5) * 0.2));
            puv = vQ * 6.0 + seed;
          }`,
      });
      U.uSunC.value.setRGB(L.sunLight[0], L.sunLight[1], L.sunLight[2]); U.uSunK.value = look.hour === 'dusk' ? 0.6 : 0.9;
    }
    await ctx.yield();

    // ---------- hawker dragonflies that keep station just ahead of the bill for two stretches of the channel ----------
    // (cut large: plan view, striped abdomen, eyes, four veined cellophane wings that whirr; places are set each frame)
    const flyStations = [[2.9, -1.05, 0.12], [4.0, 1.2, 0.3], [5.2, 0.45, 0.62]];
    // (over the mere, u 0.293-0.358, the first of them hangs 1.8 m ahead of the lens, left of the bill: a fifth of the picture wide at u 0.34)
    const flyStations2 = [[1.45, -0.6, 0.17], [3.9, 1.35, 0.3], [5.2, 0.5, 0.62]];
    const flyRows = flyStations.map((f, i) => [0, -400, 0, 0.86 + 0.08 * i, rx(), i, 0, 0, 0, 0, 0, 0]);
    const heroFlies = field(flyRows, {
      uniforms: { uCrB: { value: mixc(P[2], lin('#3F6FE0'), 0.4) }, uCrA: { value: mixc(P[3], P[5], 0.15).multiplyScalar(0.9) }, uWing: { value: mixc(C.white, P[2], 0.3) } },
      vert: /* glsl */`
        float sd = iB.x, sz = iA.w; c = iA.xyz;
        c += 0.16 * vec3(sin(uTime * 2.7 + sd * 30.0), 0.6 * sin(uTime * 3.4 + sd * 17.0), cos(uTime * 2.2 + sd * 9.0));
        float ro = 0.4 * sin(uTime * 1.3 + sd * 20.0) + (iB.y - 1.0) * 0.35;
        T = (camR * cos(ro) + camU * sin(ro)) * sz; W = (camU * cos(ro) - camR * sin(ro)) * sz;
        P = vec4(sin(uTime * 37.0 + sd * 40.0), iB.y, 0.0, sd);`,
      fpars: 'uniform vec3 uCrA, uCrB;' + FLY_GLSL,
      frag: /* glsl */`
        float isB = 0.0; col = hawker(vQ * 2.0, vP.x, uCrA, uCrB, e, isB);
        deck = 1.0 - isB; tearK = 0.25 * (1.0 - isB);
        puv = vQ * 0.6 + seed;`,
    });
    heroFlies.geometry.attributes.iA.setUsage(THREE.DynamicDrawUsage);
    const _fly = new V3(), flyWin = [[0.207, 0.256], [0.293, 0.358]];
    const driveFlies = (u) => {
      let k = 0, out = 0, wi = 0; for (let w = 0; w < flyWin.length; w++) { const [a, b] = flyWin[w]; if (u > a - 0.012 && u < b + 0.006) { k = smoothstep(a - 0.012, a + 0.008, u); out = smoothstep(b - 0.008, b + 0.006, u); wi = w; } }
      const arr = heroFlies.geometry.attributes.iA.array, on = k > 0 && out < 1;
      if (!on && !heroFlies.userData.on) return;
      for (let i = 0; i < flyStations.length; i++) {
        const f = (wi ? flyStations2 : flyStations)[i], sg = i % 2 ? 1 : -1;
        if (on) { offPath(clamp(u + (f[0] + 18 * (1 - k)) / PL, 0, 1), f[1] + sg * (5 * (1 - k) + 9 * out * out), _fly); _fly.y = Math.max(0.45, _fly.y + f[2] + 4.5 * out * out + 1.2 * (1 - k)); } else _fly.set(0, -400, 0);
        arr[i * 4] = _fly.x; arr[i * 4 + 1] = _fly.y; arr[i * 4 + 2] = _fly.z;
      }
      heroFlies.geometry.attributes.iA.needsUpdate = true; heroFlies.userData.on = on;
    };
    await ctx.yield();

    // ---------- the mount: a paper kingfisher's crown and bill under the lens, wing fans in the lower corners ----------
    const mount = new THREE.Group(); mount.matrixAutoUpdate = false; mount.visible = false; scene.add(mount);
    const wash = new THREE.Mesh(QUAD, mat({ uWash: { value: 0 }, uWashC: { value: 0 } }, /* glsl */`
      varying vec2 vQ; void main() { vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, /* glsl */`
      varying vec2 vQ; uniform float uWash, uWashC, uTime; uniform vec3 uHoney;
      ${PAPER_GLSL}
      void main() {
        vec4 n = texture2D(uPaper, vQ * vec2(1.4, 0.8) + vec2(0.0, uTime * 0.15));
        vec3 col = mix(uWhite * vec3(0.86, 0.95, 1.0), uHoney * 0.95, uWashC) * (0.9 + 0.2 * n.b);
        gl_FragColor = vec4(col * uTint, uWash * (0.8 + 0.2 * n.a));
      }`, { transparent: true, depthTest: false, depthWrite: false, alphaToCoverage: false }));
    wash.matrixAutoUpdate = false; wash.frustumCulled = false; wash.renderOrder = 60; wash.visible = false; scene.add(wash);
    const mountU = { uFold: { value: 0 }, uBeat: { value: 0 }, uBob: { value: 0 }, uFrame: { value: new THREE.Vector2(1.07, 0.6) } };
    {
      // Our own bird, cut in paper and pinned to the lens: we sit on its nape and look forward over the BACK of its head.
      // The lower middle of the picture holds the crown, a turquoise teardrop barred with torn blue arcs that ring the
      // base of the bill, widest where it runs off the bottom edge and drawn in to a point at the forehead, with its torn
      // white deckle rim; out of the forehead the long dark dagger of the bill points away from us up the picture, the
      // orange of the lower mandible showing either side of its base (the one echo of the pelicans' apricot). No face is
      // turned to the lens (no eyes, no cheeks) and there is no neck: the head leaves the frame at the bottom. Each piece
      // drags its lilac shadow sheet to the left. The head bobs with the wingbeat, and on each downstroke the shoulders
      // of both wings (five barred flight feathers and three coverts a side) swing in from the lower corners; on the
      // glides and under water they are tucked away. Everything is laid in the lens's own plane, one metre out, in units
      // of the frame (uFrame = half width, half height there; the bottom edge is z = 0), and is the LAST thing drawn:
      // a transparent sheet with the highest render order of all but the plunge's wash, so no wake, ring, stem, mist
      // or rain strip of the world can be painted across it.
      // By moonlight the world's paper is tinted indigo; our own bird takes only part of that tint and its papers are cut a
      // little paler, so the crown stays barred turquoise with a pale rim and the bill's base orange, lighter than the water.
      const mk = duskH ? 0.2 : 0, mountTint = U.uTint.value.clone().lerp(new THREE.Color(1, 1, 1), duskH ? 0.5 : 0);
      const turq = mixc(lin('#22B8CC'), lin('#7FE6EE'), mk).multiplyScalar(0.92), blue = lin('#1C63B0'), azure = mixc(lin('#46D2F0'), lin('#D6F6FA'), mk).multiplyScalar(0.9), deep = lin('#24508C'), orange = mixc(lin('#F08A3A'), lin('#F7A65E'), mk * 2).multiplyScalar(0.95);
      const white = C.white.clone(), lilac = mixc(U.uShade.value, P[5], 0.12), dark = mixc(C.ink, deep, 0.22), ridge = mixc(dark, azure, 0.15);
      const M = makeGeo(), flatC = (c) => () => c;
      // (the head covers no more of the picture than the one before it: 2880 px of an 800 x 450 still against 2910)
      const HK = 0.92, Z0 = -0.06 * HK, CL = 0.17 * HK, B0 = 0.082 * HK, BL = 0.2 * HK;
      // the crown: widest at the frame's edge, drawn in to a feathered point that lies on the base of the bill
      // (it flares over its lowest 15 px, where the nape runs out into the mantle: some 80 px wide at the frame's edge of an 800 px still, no wider than before higher up)
      const crownHw = (t) => { const z = Z0 + t * CL, s = clamp((z / HK + 0.01) / 0.12, 0, 1); return HK * 0.1 * Math.pow(Math.max(0, 1 - Math.pow(s, 2.2)), 0.85) * (1 - 0.4 * s * s) + HK * 0.045 * (1 - smoothstep(-0.012, 0.04, z)); };
      const upHw = (t) => HK * (0.003 + 0.025 * Math.pow(1 - t, 1.1)), loHw = (t) => upHw(t * 0.58) + HK * 0.025 * (1 - t * t);
      // (ids: 0 the shadow sheets, 6 the lower bill, 7 the upper bill, 3 the crown, which is painted in the fragment shader)
      strip(M, 0, { S: 10, K: 5, len: CL, org: [0, 0, Z0], endA: false, hwRef: 0.012, hw: (t) => crownHw(t) + 0.003, col: flatC(lilac), tear: 0.4 });
      strip(M, 0, { S: 4, K: 3, len: BL, org: [0, 0, B0], endA: false, hwRef: 0.03, hw: (t) => upHw(t) + 0.002, col: flatC(lilac), tear: 0.4 });
      strip(M, 6, { S: 5, K: 3, len: BL * 0.58, org: [0, 0, B0], endA: false, hwRef: 0.02, hw: loHw, col: flatC(orange), tear: 0.2 });
      strip(M, 7, { S: 6, K: 5, len: BL, org: [0, 0, B0], endA: false, hwRef: 0.03, hw: upHw, col: (t, v) => (Math.abs(v) < 0.3 && t < 0.86 ? ridge : dark), tear: 0.3 });
      strip(M, 3, { S: 12, K: 9, len: CL, org: [0, 0, Z0], endA: false, hwRef: 0.012, hw: crownHw, col: flatC(turq), tear: 0.4 });
      // the wings: ids 20.. (left) and 40.. (right): + 10..14 the shadows of the flight feathers, + 0..4 the feathers, + 5..7 the coverts
      const primLen = (j) => 0.36 - 0.03 * Math.abs(j - 1.6), primHw = (t) => 0.008 + 0.03 * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * t)), 0.7);
      const feather = (j) => (t, v) => (t > 0.86 ? mixc(blue, deep, 0.6) : Math.abs(v) < 0.14 ? mixc(azure, white, 0.45) : mixc(Math.floor(t * 9 + 0.5 * Math.abs(v) + 0.3 * j) % 2 ? mixc(turq, blue, 0.6) : turq, white, 0.06 * (j % 3)));
      for (const base of [20, 40]) {
        for (let j = 0; j < 5; j++) strip(M, base + 10 + j, { S: 6, K: 3, len: primLen(j), hw: (t) => primHw(t) + 0.004, col: flatC(lilac), tear: 0.4, uvo: j * 0.13 });
        for (let j = 0; j < 5; j++) strip(M, base + j, { S: 7, K: 5, len: primLen(j), hw: primHw, col: feather(j), tear: 0.4, uvo: j * 0.21 });
        for (let j = 0; j < 3; j++) strip(M, base + 5 + j, { S: 4, K: 5, len: 0.17 - 0.012 * j, hw: (t) => 0.012 + 0.03 * Math.sin(Math.PI * (0.08 + 0.84 * t)),
          col: (t, v) => (Math.floor(t * 5 + Math.abs(v) * 1.5) % 2 ? mixc(blue, deep, 0.35) : mixc(turq, azure, 0.5)), tear: 0.4, uvo: j * 0.31 });
      }
      const mv = /* glsl */`
        attribute vec4 aData; attribute vec3 color;
        uniform float uFold, uBeat, uBob; uniform vec2 uFrame;
        varying vec3 vCol; varying vec4 vData; varying float vShd; varying vec3 vLoc;
        void main() {
          float pid = aData.w; vec2 d2; vShd = 0.0;
          float sc = clamp(uFrame.x / max(uFrame.y * 1.4, 1e-4), 0.8, 1.0);       // a little smaller on an upright screen (whose wider lens already shrinks it)
          if (pid > 19.5) {
            float side = pid > 39.5 ? 1.0 : -1.0, k = pid - (side > 0.0 ? 40.0 : 20.0), sh = step(9.5, k), j = k - 10.0 * sh;
            float fanI = j < 4.5 ? j : (j - 5.0) * 1.4 + 0.6;
            float th = mix(0.1, 0.62, uBeat) - 0.6 * uFold + (fanI - 2.0) * mix(0.1, 0.2, uBeat);
            vec2 dir = vec2(cos(th), sin(th)), nrm = vec2(-dir.y, dir.x);
            vec2 w = dir * position.z + nrm * position.x + vec2(0.03, -0.075 - 0.16 * uFold) + sh * vec2(-0.014, -0.012);
            d2 = vec2(side * (w.x * sc - uFrame.x), w.y * sc - uFrame.y);
            vShd = sh;
          } else {
            d2 = vec2(position.x, position.z) * sc + vec2(0.0, uBob - uFrame.y);
            if (pid < 0.5) { d2 += vec2(-0.011, -0.008) * sc; vShd = 1.0; }
          }
          vCol = color; vData = vec4(aData.xyz, pid * 0.137); vLoc = vec3(position.x, position.z, pid);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(d2, -1.0, 1.0);
        }`, mf = /* glsl */`
        varying vec3 vCol; varying vec4 vData; varying float vShd; varying vec3 vLoc;
        uniform vec3 uCrA, uCrB, uCrC, uMTint; uniform vec2 uCrown;
        ${PAPER_GLSL}
        void main() {
          vec3 col = vCol;
          if (abs(vLoc.z - 3.0) < 0.5) {
            // the crown's bars: rows of feathers ringing the base of the bill, each row a scalloped band of three flat
            // papers (a deep blue bar, turquoise, a pale azure tip), their edges a little torn
            vec2 p = vLoc.xy - vec2(0.0, uCrown.x);
            float n = texture2D(uPaper, vLoc.xy * 2.6 + vec2(0.37, 0.11)).r;
            float ang = atan(p.x, max(-p.y, 1e-4));
            float r = length(p * vec2(0.8, 1.0)) / uCrown.y - 0.42 * abs(sin(ang * 6.5)) + (n - 0.5) * 0.5 + 0.2;
            float f = fract(r), aw = clamp(fwidth(r) * 0.8, 0.02, 0.2);
            float bar = 1.0 - smoothstep(0.3 - aw, 0.3 + aw, f) + smoothstep(1.0 - aw, 1.0, f);
            col = mix(mix(uCrA, uCrC, smoothstep(0.68 - aw, 0.68 + aw, f)), uCrB, clamp(bar, 0.0, 1.0));
          }
          vec4 s = paperSheet(col, vData.xy * 5.0, vData.z, 0.5, vData.w, 1.0 - vShd);
          if (s.a < 0.04) discard;
          gl_FragColor = vec4(max(s.rgb * uMTint, vec3(0.0)), s.a);
        }`;
      // (made once, here: transparent with no depth test and the highest render order, so three.js draws it after every
      // other sheet of the world, opaque or transparent; only the plunge's wash, order 60, is laid over it)
      const birdM = new THREE.Mesh(finishGeo(M), mat({ ...mountU, uMTint: { value: mountTint }, uCrA: { value: turq }, uCrB: { value: blue }, uCrC: { value: mixc(azure, white, 0.25) }, uCrown: { value: new THREE.Vector2(B0 + 0.03 * HK, 0.027 * HK) } },
        mv, mf, { transparent: true, depthTest: false, depthWrite: false, alphaToCoverage: false }));
      birdM.frustumCulled = false; birdM.renderOrder = 50; mount.add(birdM);
    }
    await ctx.yield();

    // ---------- per-frame ----------
    const camP = new V3(), bufSize = new THREE.Vector2(), mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), tA = new V3(), tB = new V3();
    const sdir = new THREE.Vector2(U.uShadowDir.value.x, U.uShadowDir.value.z).normalize();
    let uPrev = -1, drift = 0;
    const update = (dt, time, camera, u) => {
      camP.setFromMatrixPosition(camera.matrixWorld);
      ctx.renderer.getDrawingBufferSize(bufSize);
      WU.uPx.value = 2 * Math.tan((camera.fov ?? 62) * Math.PI / 360) / Math.max(1, bufSize.y);
      WU.uU.value = u; sunRayK.value = rayK(u);
      const isUnder = camP.y < 0 && !ctx.through;
      above.visible = !isUnder; under.visible = isUnder; WU.uUnderK.value = isUnder ? 1 : 0;
      // looking in through the previous portal from beside the channel's axis, the lens would stand among the reeds behind
      // the entry: they lie flat for it, and stand again as it comes onto the axis
      WU.uBackK.value = ctx.through ? smoothstep(3.0, 5.2, Math.abs(camP.x + 17)) : 0;
      sky.position.copy(camP);
      // the sky of each third: warm and wide-banded low over the reeds down the channel, the lagoon's own once we are up
      // out of the water, cooler and closer-banded on the climb (the change falls in the plunge and in the turn upward)
      {
        const wA = 1 - smoothstep(0.33, 0.42, u), wC = smoothstep(0.6, 0.72, u) * (1 - wA), wB = 1 - wA - wC, sa = skySets[0], sb = skySets[1], sc = skySets[2];
        for (let i = 0; i < 8; i++) skyCols[i].setRGB(sa[i].r * wA + sb[i].r * wB + sc[i].r * wC, sa[i].g * wA + sb[i].g * wB + sc[i].g * wC, sa[i].b * wA + sb[i].b * wB + sc[i].b * wC);
        skyBandK.value = 1.3 * wA + wB + 0.8 * wC;
      }
      // the dip wave is keyed to the flight (it meets the nearest birds at the closest pass); it runs on time when the camera rests
      if (u > 0 && Math.abs(u - uPrev) < 1e-7) drift += dt / 3;
      uPrev = u;
      hero.setProgress(clamp((u - 0.47) / 0.07, 0, 1));
      hero.setWave(u > 0 ? waveAt(u) + drift : time / 3);
      hero.update(dt, time, camera);
      const glide = smoothstep(-0.3, 0.3, Math.sin(time * 0.9));
      for (const m of flocks) m.userData.u.uU.value = u;
      skein.userData.u.uGlide.value = glide;
      for (const k of moving) {
        const T = (u - k.uX) * 40;
        k.m.position.copy(k.X).addScaledVector(k.V, T); k.m.position.y += Math.max(0, -T) * k.sink + 0.3 * Math.sin(time * 0.8);
      }
      tallK = clamp((1.3 - (camera.aspect ?? 1.78)) / 0.7, 0, 1);
      driveAll(u); driveFlies(u);
      setLens(camera, camP); driveRaft(u, camP); driveHeron(u, camP);
      driveView(u, camera, camP); if (takeoffD) fitTakeoff(u, camera, camP);
      if (rare) {
        const up = u >= U_UP;
        U.uAlert.value = smoothstep(U_ALERT, U_UP, u);
        takeoff.visible = up; fishersMesh.visible = !up; ringsMesh.visible = !up;
      }
      // the mount rides the camera; it slides up into frame as the flight begins and is not drawn through a portal (u = 0)
      const pres = smoothstep(0.0, 0.012, u);
      mount.visible = pres > 0.001 && !ctx.through;
      if (mount.visible) {
        // the wing fans whirr in powered flight and are tucked away on the glides (past the backwater, down the horseshoe, up
        // the thermal), so the lower corners of the picture are not the same in every stretch
        const glide = Math.max(smoothstep(0.113, 0.127, u) * (1 - smoothstep(0.205, 0.22, u)), smoothstep(0.495, 0.51, u) * (1 - smoothstep(0.625, 0.645, u)), smoothstep(0.745, 0.762, u) * (1 - smoothstep(0.895, 0.915, u)));
        const fold = Math.max(glide, smoothstep(uIn - 0.04, uIn - 0.014, u) * (1 - smoothstep(uOut + 0.004, uOut + 0.03, u)));
        const shake = smoothstep(uOut + 0.004, uOut + 0.02, u) * (1 - smoothstep(uOut + 0.03, uOut + 0.06, u));
        const fd = clamp(fold + 0.22 * shake * Math.sin(time * 30), 0, 1), tanV = Math.tan((camera.fov ?? 62) * Math.PI / 360), beat = time * 15.708 + 0.5236;
        // (2.5 beats a second: a still at t 12 or t 40 catches the wings three quarters of the way down)
        mountU.uFold.value = fd; mountU.uBeat.value = (0.5 + 0.5 * Math.sin(beat)) * (1 - fd); mountU.uBob.value = 0.0055 * Math.sin(beat + 1.0) * (1 - 0.6 * fd);
        mountU.uFrame.value.set(tanV * (camera.aspect ?? 1.78), tanV);
        path.tangentAt(u, tA); path.tangentAt(Math.min(1, u + 0.012), tB);
        const turn = clamp((tA.z * tB.x - tA.x * tB.z) * 3.0, -0.14, 0.14);
        mA.makeRotationZ(-turn).setPosition(0.006 * Math.sin(time * 1.7), -(1 - pres) * 0.3, 0);
        mount.matrix.multiplyMatrices(camera.matrixWorld, mA); mount.matrixWorldNeedsUpdate = true;
      }
      const gate = smoothstep(uIn - 0.016, uIn - 0.004, u) * (1 - smoothstep(uOut + 0.004, uOut + 0.016, u));
      const wa = gate * (1 - smoothstep(0.0, 0.85, Math.abs(camP.y)));
      wash.visible = wa > 0.003 && !ctx.through;
      if (wash.visible) {
        wash.material.uniforms.uWash.value = wa * 0.92; wash.material.uniforms.uWashC.value = smoothstep(0.25, -0.25, camP.y);
        mA.makeScale(3.4, 2.2, 1).setPosition(0, 0, -0.5); wash.matrix.multiplyMatrices(camera.matrixWorld, mA); wash.matrixWorldNeedsUpdate = true;
      }
      // the kingfisher's own shadow sheet on the water, ahead and to the left
      const sh = (1 - smoothstep(2.5, 8, camP.y)) * pres;
      mountShadow.visible = sh > 0.02 && !isUnder && !ctx.through;
      if (mountShadow.visible) { const k = camP.y * 3.2 + 0.8; mountShadow.position.set(camP.x + sdir.x * k, 0, camP.z + sdir.y * k); mountShadow.scale.setScalar(sh * (0.8 + 0.06 * Math.sin(time * 12.566))); }
    };

    const titles = { morning: 'The Tissue-Paper Pelicans', dawn: 'The Tissue-Paper Pelicans at Dawn', evening: 'The Tissue-Paper Pelicans, Evening', dusk: 'The Tissue-Paper Pelicans by Moonlight' };
    return {
      scene, path, duration: 40, title: titles[look.hour], look,
      pace: (u) => 1.08 - 0.2 * bell(u, 0.13, 0.215, 0.4) - 0.12 * bell(u, 0.425, 0.53, 0.4) - 0.3 * bell(u, 0.5, 0.66, 0.4),
      dbg: { setCalm: (c) => { calmK = c; }, leanW, hero, flocks: dbgFlocks, moving, waveAt, closeAt, star, islands, uIn, uOut, shoalInfo, info: { ps, pool, extra: extraAt.map((o) => [+o.x.toFixed(1), +o.z.toFixed(1), +o.lat.toFixed(1)]) } },
      camera: { fov: 62, near: 0.2, nearThrough: 0.3, far: 4200, lookAhead: 14, sway: 0.7, bank: 0.5 },
      pois,
      portal: { shape: 'circle', radius: 7, color: L.portal, glow: 1.15, tilt: true, revealDistance: 300 },
      post: { exposure: 1.0, bloom: { strength: 0.2, radius: 0.5, threshold: 0.93 },
        grade: { saturation: 1.06, contrast: 1.03, tint: '#ffffff', shadowTint: '#0a1030', vignette: 0.2, grain: 0.03, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); QUAD.dispose(); },
    };
  },
};
