// KETTLE OVER THE STRAIT (stork-kettle-riso): migration day printed in three inks. You circle up a thermal inside a helix of
// white storks with the gaze LEVEL, the storks of your own lane sliding past at arm's length all the way from 15 m over the
// scrub of a limestone headland to the top of the kettle under a cumulus tower. Half way up the heading comes round over
// the strait and the gaze drops to it: nine ships and their wakes (broken lines of foam) below the stair, a street of low
// cumuli, the far shore in three pale steps, far kettles like smoke; then round over the land, which from a kilometre up
// is a printed map. The top of the kettle is THE FUNNEL (built by the hero: about 265 storks on a five-turn cone about the
// thermal's axis, 1,151 to 1,235 m): the lens climbs into it with the gaze still level and storks crossing close,
// and only as it comes up through the upper half and out of the funnel's top does the gaze go over and look back DOWN it, ring inside ring of
// paper-white backs over the lighthouse island, the blue strait and the wakes; then it levels out behind the departing
// file with a pink ring a few seconds ahead under the cloud, the file a dotted thread from beside the ring down to the
// far coast. The kettle is never looked up into.
// The whole world is a three-plate riso separation: every surface writes INK COVERAGE (pink, blue,
// yellow) on layer 1 with the press exported by src/parts/stork-kettle-riso.js (makePress / styleMaterial / INK_GLSL), and the
// hero's page composites the plates. No naturalistic shading anywhere; returns style 'none'.
//
// MAP OF THIS FILE (in order)
//   1. helpers            IG (ink geometry builder: position + normal + ink recipe), box / tube / lump builders, coastZ()
//   2. GLSL               COAST_GLSL (the coastline, shared by sea and land), ROAD_GLSL (the white road, shared with roadX()),
//                         BIRD_VERT / BIRD_FRAG (kites, buzzards, gulls, the solo kite; NEARLANE: the pale buzzards that
//                         hold a height just over the lens'; FLAM: a flamingo's own heading and bank, held size),
//                         FLAM_FRAG (the flamingo's print: pink coverts, paper leading edge, plum hands and trailing edge),
//                         DRIFT_VERT (swifts and thistledown that wrap around the camera)
//   3. build()
//      MOODS              seeded looks: hour (noon | golden | haze), wind (calm | east), season (parched | spring), cast (white |
//                         black | raptor | packed | thin). ctx.vary.hour overrides the hour, ctx.vary.density packs the column,
//                         ctx.vary.rare stages the flamingo skein, ctx.vary.mood turns its course and sets its height. The
//                         hero reads the same choices (opts) and sets sun, sky and haze. Generators of their own (no draw
//                         from ctx.rng): company (which stair, which side), lane (the birds of our lane), buzzards, the
//                         strait (ships' headways, the cloud street), fishing-boat (her seat and heading), village,
//                         hamlet, flamingos.
//      HERO + PATH        buildHero(...) -> hero; PATH = hero.anchors.flyThrough (lead-in, two turns of helix rising 14 degrees,
//                         85 m straight south at 12 degrees up); the exit ring is hero.anchors.portalSeat. ROOT is the group
//                         that holds the hero, the land, the sea and the clouds: update() sinks it by (path height -
//                         hero.altitudeAt(u)), which is the whole time-lapse climb. metresAt(sec): the metres flown at a
//                         second of the film (the design's beats); FT_D(i): route metres at a point of the suggested flight.
//      SEA                one plane; swell, whitecaps, tide rips, glitter, shallows, foam, cloud shadows, the surf and shoals
//                         of the lighthouse island (LIGHT), the skerry (ISLE) and the rock awash (ISLET), and every ship's
//                         wake are drawn in its fragment shader (uShip / uShipB / uSea / uCloud uniforms). EVERY wake is a
//                         broken line of foam: a ragged edge, dashes with blue water between them astern of the churn
//                         (the dashes lie in the water), a darker margin of water beside it, and it narrows to its tail;
//                         a fast ferry's (uShipB.w = 2, by the kind of ship) is broader. uLook (the look down) calms rips
//                         and drifting cloud shadow under the funnel; uFarW (with the tilt) holds a far wake at a few
//                         design px of paper. The sea hazes itself. The foam of the mainland breathes at the cliff's
//                         real foot (34 m south of the coastline, where the face meets the water), and where the land
//                         is printed as a map the shore is one ruled paper line there (the cased coast),
//                         which goes out with the haze where the land beside it has gone to the haze's blue.
//      LAND               headland mesh (cliff rows + top + hills). Its shader prints the ground twice: near, as scrub
//                         mottling, ribs, thistles, terraced strips and a white track; and where a design pixel covers
//                         more than a few metres (from about 700 m up, and the far hills from anywhere) as THE PRINTED
//                         MAP: broad flat patches of olive on bare ground printed as A STRAW GROUND (a regular screen of
//                         the yellow plate, a fifth to a quarter covered, nailed to the page) with ITS FORM FROM THE LIGHT
//                         (three flat steps of the blue screen where the ground has less light than level ground;
//                         far off, where the haze has taken the olive's yellow, the whole top is the olive's hazed blue, one
//                         tone, and no straw dot stands on ground or rock;
//                         no grain: the thistle's pink stays on the near ground), the coast cased by the sea's ruled paper
//                         shore line alone (no line of the land's own), the terraces as flat-yellow contour bands round
//                         the village and the upper hamlet, the road as one cased line of paper three design pixels
//                         wide, the cloud's shadow as one flat plum tone sliding across. THE CLIFF FACE is rock at every
//                         range: a flat tone of the blue screen stepped by the light, its strata knocked out as paper
//                         lines, under the ground's straw screen. The land shades and hazes itself, BY THE RANGE (the
//                         metres from the eye, not those along the lens's axis: turning the head changes no tone of it,
//                         and the far ground's gate is a circle round the eye's foot). Scrub clumps and palms
//                         (instanced), watchtower + nest pair, the lighthouse on its low island 330 m off the tip, the
//                         two bare rocks, the white village 700 m north of the point and the upper hamlet 1.85 km north
//                         on the same road (one mesh; the houses at their size in metres, under the one RANGE RULE they
//                         share with the ships: FAR_ALT, FAR_HOLD; no count of pixels), wind turbines
//                         (blades turn in the vertex shader)
//      STRAIT             nine ships on fixed lanes by the world clock, each from a seeded place along its lane (moved in
//                         update, wakes in the sea shader; above 500 m a ship further than 1.7 km is held at its 1.7 km
//                         size, so the far hulls still read from the top); the fishing boat at a seeded bearing and range
//                         (150 to 400 m) round the skerry on a seeded heading (BOAT); far continent in three pale steps, far kettles
//                         (dotted columns with larger bird marks on the near side, tapering up into their own cumuli:
//                         two behind the headland, three on the far coast)
//      CLOUDS             the hero cloud's dimpled base (calm and dark round the ring), rim lobes, small cumuli (the flat-yellow
//                         lining is printed as broad dabs, and only on clouds out over the strait), a seeded street of six
//                         low cumuli over the west of the strait with bases from 620 to 1,120 m, thirty-two scud
//                         pieces shown only as the head comes up to the ring and kept out of the sightline to it: twelve
//                         pale ribbons (fibre streaks beside the last straight, tipped toward the arriving lens) and
//                         twenty near shreds strung along the last straight 8.6 to 9.4 m out, low on either side
//                         (plum-blue torn strips, each condensing 25 m ahead and sliding out past a lower corner)
//      CAST               kites, buzzards, gulls, swifts, thistledown; two PALE HONEY BUZZARDS on circles of their own close
//                         to the lane, the other way round, a little over the lens' height (the world clock). Nothing of
//                         the cast but the three stragglers of the last straight is placed from the lens or turned by
//                         reading it:
//                         the entry trio (on the route ahead, u 0-0.27, backs turned, over the strait);
//                         CLOSE COMPANY = THE BIRDS OF OUR LANE (laneBirds: eight storks that fly the route itself, each
//                         at its own lane speed 0.5 to 2 m/s off ours on the world clock, placed and banked in the
//                         path's frame; one or two cross the stretch 2.5 to 8 m ahead of the lens, 6 to 11 m from it, at
//                         every phase of the clock, none nearer than LANE_CLEAR = 6 m to the route's centreline at its
//                         own station anywhere on the lane; the lane ends where the route straightens, and there each
//                         climbs away to the file; see the comment there);
//                         the stork that crosses the lens (the design's 13 s: a lane of its own that crosses ours where
//                         the route is at that beat), the kite that crosses against the grain (17 s: its own line down
//                         the lane), the flamingo skein (the rare visit only: one straight level course through a seeded
//                         point within 20 m of the thermal's axis, 25 m under the lane where the route is at the
//                         design's 24 s), all three moved by METRES FLOWN.
//                         The hero is driven from update(): hero.setStair (the stair, until the gaze goes over; the
//                         companions of the look down, with the tilt and the lift), hero.setEscort (the stair stretches
//                         and wanders with u), hero.setCalm (the far column thinned under the funnel), hero.setRing
//                         (clears the sightline to the ring as the head comes up). Funnel and departing file are the
//                         hero's; past its first 10 m the only other storks of the last straight are THE SITE'S THREE
//                         STRAGGLERS (PASS: the site's own three rows and the lines that fly them, inherited unchanged:
//                         seats in the lens's frame on typed shares of the flight, u 0.822 to 0.992).
//      THE GAZE           the director: gazeAt(time, u), the target of the world's ONE point of interest (weight 1, the
//                         whole flight). It returns the engine's own gaze drawn to the pair on the nest (by the metres
//                         of route to the watchtower: from 60 m short of it until 10 m past abeam, nestK) and then half
//                         way to the stair of storks ahead-right and below (the pull rises as the heading turns out of
//                         the lead-in, stairK; the stair's place sinks to the strait by the place: by the lens' height
//                         over the sea and the share of the heading that points to the strait, stairDrop), until THE
//                         LOOK DOWN: a tilt that begins by the lens' height against the funnel's band (level to the
//                         middle of the band, D_UP; down by D_OUT) and a lift ruled by the metres left to the ring
//                         (D_LIFT0 to D_LIFT1: done, the ring centred, where the route straightens); see its comment
//      RETURN             path, duration 51 with pace() (0.55 of the speed from u 0.70 to 0.85), pois (the director alone),
//                         camera (bank 0.36: the horizon cants about 6 degrees), portal (revealDistance
//                         190: the next world shows only on the last straight), POST (exposure 3 and bloom 0.3 at 1.1:
//                         the page divides by the exposure so paper lands on its hex; nothing else in the grade),
//                         update(), dispose()
//   Fog = the ink haze function in the press (press.shared.uHaze, set by the hero from the hour). Light = press.shared.uSunDir.
//   The two three.js lights exist only for the engine's ride (layer 0); nothing printed reads them.
// DEPARTURES OF THE CREW from the design (things of this world the brief does not name): the white village on the hill
// road and its terraces, the road itself, the upper hamlet further up it with its contour bands, the street of six low
// cumuli over the west of the strait.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, INK_GLSL } from '../parts/stork-kettle-riso.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const _p = new THREE.Vector3(), Y_UP = new THREE.Vector3(0, 1, 0);
const SEA_Y = -120;
// THE RANGE RULE for things that stand on the map (ships and houses alike), in metres: once the lens is high in the climb
// (from FAR_ALT[0] m over the scrub, wholly from FAR_ALT[1] m) a thing further off than FAR_HOLD m is held at the size it
// has at FAR_HOLD m, and beyond twice that range it stands half as tall again, so the far hulls and houses still read from
// the top of the climb. No count of pixels in it.
const FAR_ALT = [500, 1150], FAR_HOLD = 1700;
// THE LIGHTHOUSE ISLAND, a low ragged skerry 330 m off the headland's tip (the design's "low island off the tip"): the
// thermal stands over the cliff edge, so from the top of the kettle the island lies under the funnel's lowest rings
const LIGHT = [-150, 330];
// two bare rocks in their own rings of surf, so the water off the point is a place: a skerry 800 m to the south-east
// (ISLE: the fishing boat works beside it) and a rock awash 370 m west of the point (ISLET)
const ISLE = [640, 500];
const ISLET = [-340, 170];
// ink recipes (pink, blue, yellow)
const K_WHITE = [0, 0, 0], K_PLUM = [1, 1, 0], K_VERM = [1, 0, 1], K_OLIVE = [0, 0.62, 1], K_YEL = [0, 0, 1], K_BLUE = [0, 0.8, 0], K_PINK = [0.9, 0, 0];

// ---------------------------------------------------------------- 1. helpers
class IG {
  constructor() { this.P = []; this.N = []; this.K = []; this.X = []; this.I = []; this.n = 0; this.explicit = true; }
  v(x, y, z, ink, nx, ny, nz, ex) {
    this.P.push(x, y, z); this.K.push(ink[0], ink[1], ink[2]);
    if (nx === undefined) { this.explicit = false; this.N.push(0, 1, 0); } else this.N.push(nx, ny, nz);
    if (ex) this.X.push(ex[0], ex[1], ex[2], ex[3]); else this.X.push(0, 0, 0, 0);
    return this.n++;
  }
  tri(a, b, c) { this.I.push(a, b, c); }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  build(extraName) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('ink', new THREE.Float32BufferAttribute(this.K, 3));
    if (extraName) g.setAttribute(extraName, new THREE.Float32BufferAttribute(this.X, 4));
    g.setIndex(this.I);
    if (this.explicit) g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); else g.computeVertexNormals();
    return g;
  }
}
// a box with flat faces; yaw about Y; taper = [x scale, z scale] of the top face
function box(G, cx, cy, cz, sx, sy, sz, ink, yaw = 0, taper = [1, 1], ex) {
  const c = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hz = sz / 2;
  const pt = (x, y, z) => { const k = y > 0 ? taper : [1, 1]; const X = x * hx * k[0], Z = z * hz * k[1]; return [cx + X * c + Z * s, cy + (y > 0 ? sy : 0), cz - X * s + Z * c]; };
  const faces = [[[-1, 0, 1], [1, 0, 1], [1, 1, 1], [-1, 1, 1]], [[1, 0, -1], [-1, 0, -1], [-1, 1, -1], [1, 1, -1]], [[1, 0, 1], [1, 0, -1], [1, 1, -1], [1, 1, 1]],
    [[-1, 0, -1], [-1, 0, 1], [-1, 1, 1], [-1, 1, -1]], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]]];
  for (const f of faces) { const id = f.map((q) => { const p = pt(q[0], q[1], q[2]); return G.v(p[0], p[1], p[2], ink, undefined, 0, 0, ex); }); G.quad(id[0], id[1], id[2], id[3]); }
}
// a tube through stations [x, y, z, r] (smooth); ink may be a function of the station index
function tube(G, st, sides, ink, capEnd = true, ex) {
  const rings = [];
  for (let k = 0; k < st.length; k++) {
    const a = st[Math.max(k - 1, 0)], b = st[Math.min(k + 1, st.length - 1)];
    const t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    const u = new THREE.Vector3(0, 1, 0); if (Math.abs(t.y) > 0.9) u.set(1, 0, 0);
    const e1 = new THREE.Vector3().crossVectors(t, u).normalize(), e2 = new THREE.Vector3().crossVectors(t, e1);
    const ring = [], kk = typeof ink === 'function' ? ink(k) : ink;
    for (let i = 0; i < sides; i++) { const an = i / sides * TAU, cx = Math.cos(an) * st[k][3], cy = Math.sin(an) * st[k][3]; ring.push(G.v(st[k][0] + e1.x * cx + e2.x * cy, st[k][1] + e1.y * cx + e2.y * cy, st[k][2] + e1.z * cx + e2.z * cy, kk, undefined, 0, 0, ex)); }
    rings.push(ring);
  }
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; G.quad(rings[k][i], rings[k + 1][i], rings[k + 1][j], rings[k][j]); }
  if (capEnd) { const e = st[st.length - 1], kk = typeof ink === 'function' ? ink(st.length - 1) : ink, c = G.v(e[0], e[1], e[2], kk, undefined, 0, 0, ex), last = rings[rings.length - 1]; for (let i = 0; i < sides; i++) G.tri(c, last[i], last[(i + 1) % sides]); }
}
// a noisy lobe (icosphere) with explicit normals; sy squashes it, flat clamps its underside
const ICO = {};
function lump(G, noise, cx, cy, cz, r, detail, sy, flat, amp, ink, ex) {
  const src = ICO[detail] || (ICO[detail] = (() => { const g = new THREE.IcosahedronGeometry(1, detail); const p = g.attributes.position.array.slice(); g.dispose(); return p; })());
  const map = new Map(), idx = [];
  for (let i = 0; i < src.length; i += 3) {
    const key = Math.round(src[i] * 4096) + ',' + Math.round(src[i + 1] * 4096) + ',' + Math.round(src[i + 2] * 4096);
    let id = map.get(key);
    if (id === undefined) {
      const x = src[i], y = src[i + 1], z = src[i + 2];
      const d = 1 + amp * noise.fbm3(cx * 0.01 + x * 1.3, cy * 0.01 + y * 1.3, cz * 0.01 + z * 1.3, 3);
      let py = y * d * sy, ny = y / Math.max(sy, 0.2);
      if (flat && py < -flat) { py = -flat + (py + flat) * 0.12; ny = -3; }
      const nl = Math.hypot(x, ny, z) || 1;
      id = G.v(cx + x * d * r, cy + py * r, cz + z * d * r, ink, x / nl, ny / nl, z / nl, ex); map.set(key, id);
    }
    idx.push(id);
  }
  for (let i = 0; i < idx.length; i += 3) G.tri(idx[i], idx[i + 1], idx[i + 2]);
}
// the coastline: land is north of z = coastZ(x). The same function is in COAST_GLSL.
// cove(): beyond the cape's tip the two flanks carry bays and small capes (1.5 km, 640 m and 330 m long), so that from the top of
// the kettle the coast reads as a coastline and never as a ruled edge; nothing moves within 260 m of the tower.
const cove = (x) => smoothstep(260, 1100, Math.abs(x)) * (120 * Math.sin(x * 0.0041 + 0.6) + 75 * Math.sin(x * 0.0098 + 2.0) + 34 * Math.sin(x * 0.019 + 4.1));
const coastZ = (x) => 16 + 10 * Math.sin(x * 0.021 + 1.0) + 6 * Math.sin(x * 0.057 + 2.3) - (x * x) / (520 + 1.1 * Math.abs(x)) + cove(x);

// ---------------------------------------------------------------- 2. GLSL
const COAST_GLSL = /* glsl */`
float coastZ(float x){ return 16. + 10. * sin(x * .021 + 1.) + 6. * sin(x * .057 + 2.3) - (x * x) / (520. + 1.1 * abs(x))
  + smoothstep(260., 1100., abs(x)) * (120. * sin(x * .0041 + .6) + 75. * sin(x * .0098 + 2.) + 34. * sin(x * .019 + 4.1)); }
`;
// THE ROAD: a white track from the watchtower up the spine of the headland, through the village (560 m north) and on over
// the hills to the turbines. roadX(q) = its x at q metres north of the point; the same function is in ROAD_GLSL. The village
// stands on it 600 to 800 m north (VILLAGE = its centre).
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const roadX = (q) => 48 - 28 * sstep(100, 700, q) - 0.05 * Math.max(q - 700, 0) + (38 * Math.sin(q * 0.0085) + 20 * Math.sin(q * 0.023 + 1)) * sstep(10, 140, q);
const VILLAGE = [roadX(700), -700];
// THE UPPER HAMLET stands on the same road where it crosses the hills beyond the turbine ridge, 1.75 to 1.95 km north
// of the point: from the upper half of the climb, when the heading comes round over the land, it is the knot of paper
// blocks on the road in the lower third of the page (the village itself is then under the lens' feet)
const HAMLET = [roadX(1850), -1850];
const ROAD_GLSL = /* glsl */`
float roadX(float q){ return 48. - 28. * smoothstep(100., 700., q) - .05 * max(q - 700., 0.) + (38. * sin(q * .0085) + 20. * sin(q * .023 + 1.)) * smoothstep(10., 140., q); }
`;
// cloud shadows: drifting patches plus the hero cloud's own disc, cast along the sun. uCloud = (axis x, axis z, radius, base height
// above this surface is passed by the caller)
const SHADOW_GLSL = /* glsl */`
uniform vec4 uCloud;   // x, z of the tower's base centre, its radius, wind drift speed
float cloudShadow(vec2 w, float below){
  vec2 c = uCloud.xy - uSunDir.xz / max(uSunDir.y, .2) * below;
  vec2 q = (w - c) / max(uCloud.z, 1.); q.x *= .82;
  float lobes = inkNoise(w * .004) * .35;
  float hero = 1. - smoothstep(.8, 1.05, length(q) + lobes);
  vec2 d = w * .00042 + vec2(uTime * uCloud.w, 0.);
  float drift = smoothstep(.6, .68, inkNoise(d) * .7 + inkNoise(d * 2.7 + 9.) * .3);
  return max(hero, drift);
}
`;

// Birds other than the hero's storks: kites, buzzards, gulls, flamingos. Like the storks they live in the camera's frame
// (height offset wrapped between scrub and base), but they circle THE OTHER WAY and hold their own radius. NEARLANE: the
// pale honey buzzards, which hold a height a few metres over the lens' own (no wrap) on circles close to the lane.
//   iA = radius, phase, height offset, angular rate      iB = seed, size, flap floor (0 soars, 1 always beats), 0
//   aW = signed distance along the wing from the root (0 on body and tail), tail spread weight, 0, 0
//   FORM: iA = lateral, vertical, along (metres in the formation's frame); the formation's frame comes from uniforms
const BIRD_VERT = /* glsl */`
attribute vec3 ink; attribute vec4 aW; attribute vec4 iA; attribute vec4 iB;
uniform float uTime, uAlt, uH, uBufH, uMinPx, uBubble; uniform vec2 uLean;
uniform vec3 uCentre, uFwd, uRight, uFlap; uniform float uShow, uBank, uPitch;   // uFlap: wings held this much higher, beat scale, floor of a thin part's width (buffer px)
varying vec3 vInk, vN; varying float vDepth, vPx; varying vec2 vUV; varying vec4 vW;
void main(){
  vec3 p = position, n = normal; float seed = iB.x, grow = 1., bank;
  vec3 c, fwd, right, up = vec3(0., 1., 0.);
#ifdef FORM
  c = uCentre + uRight * iA.x + vec3(0., iA.y + .25 * sin(uTime * 1.3 + seed * 20.), 0.) + uFwd * iA.z;
  { vec3 f1 = uFwd - vec3(0., uPitch, 0.); fwd = f1 / max(length(f1), 1e-4); } right = uRight; bank = uBank + .08 * sin(uTime * .7 + seed * 9.); grow = uShow;   // (uPitch: nose down, the formation stays level)
#else
  float phi = iA.y - uTime * iA.w;
  float r = iA.x * (1. + .1 * sin(uTime * .19 + seed * 20.));
  #ifdef GULL
  c = uCentre + vec3(r * sin(phi), iA.z + 2. * sin(uTime * .5 + seed * 12.), -r * cos(phi));
  #else
  #ifdef NEARLANE
  float yAlt = iA.z + uAlt + .5 * sin(uTime * .31 + seed * 12.);
  #else
  float yAlt = mod(iA.z + uAlt, max(uH, 1.));
  #endif
  c = vec3(r * sin(phi), yAlt, -r * cos(phi)); c.xz += uLean * (yAlt - uAlt);
  grow = smoothstep(0., 8., yAlt) * (1. - smoothstep(uH - 6., uH, yAlt));
  #endif
  fwd = vec3(-cos(phi), 0., -sin(phi)); right = vec3(-sin(phi), 0., cos(phi));
  bank = -(.34 + .1 * sin(uTime * .8 + seed * 30.));
#endif
  vec4 wc = modelMatrix * vec4(c, 1.);
  vec3 toC = wc.xyz - cameraPosition; float dist = max(length(toC), 1e-3);
  wc.xyz += toC / dist * max(uBubble - dist, 0.); dist = max(dist, uBubble);
  float px = projectionMatrix[1][1] * uBufH * .5 / dist * 1.6 * iB.y; vPx = px;
#ifdef FLAM
  // A flamingo of the skein keeps its station but is its own bird: its heading is a few degrees off its neighbours' (so no
  // two lines of neck and legs lie in one line) and it rocks in its own bank about the skein's (uBank), on its own period.
  // Nothing here reads the lens: the skein flies its course level and is seen however the lens happens to stand to it.
  float yj = (fract(seed * 7.13) - .5) * .3;
  vec3 f0 = normalize(vec3(uFwd.x, 0., uFwd.z) + vec3(0., 0., 1e-5)), r0 = uRight;
  fwd = f0 * cos(yj) + r0 * sin(yj); right = r0 * cos(yj) - f0 * sin(yj);
  bank = uBank + (fract(seed * 5.31) - .5) * .24 + .07 * sin(uTime * (.5 + .4 * fract(seed * 3.3)) + seed * 9.);
  fwd = fwd * cos(uPitch) - vec3(0., sin(uPitch), 0.); up = cross(fwd, right);
#endif
  // wings: slow deep beats in bursts, otherwise set in a shallow V with the tips riding up
  float d = abs(aW.x), sg = sign(aW.x);
  float cyc = fract(uTime / (5. + 4. * seed) + seed * 7.);
  float env = max(iB.z, smoothstep(0., .06, cyc) * (1. - smoothstep(.3, .36, cyc)));
  float fph = uTime * (7. + 3. * fract(seed * 3.7)) + seed * 50.;
  if (d > 0.) {
    float a = mix(.13, .04, env) + uFlap.x + env * .6 * uFlap.y * sin(fph), aTip = env * .45 * uFlap.y * sin(fph - 1.) + (1. - env) * .12;
    float dOut = max(d - .4, 0.);
    p.y += d * sin(a) + dOut * (sin(a + aTip) - sin(a));
    p.x = sg * (d * cos(a) + dOut * (cos(a + aTip) - cos(a)) + .04);
  }
  // a thin part (aW.z: a flamingo's neck, bill and legs) is never drawn narrower than uFlap.z pixels: fattened about the body's axis
  // (three times at most for a far bird, half as much again at most once the bird is 50 design px across: a near bird's line
  // stays a third as wide as its wing)
  p.xy *= 1. + aW.z * (clamp(uFlap.z / max(px / 1.6 * .085, 1e-4), 1., mix(3., 1.5, smoothstep(30., 50., px * 450. / max(uBufH, 1.)))) - 1.);
  p.x *= 1. + aW.y * .35 * sin(uTime * .6 + seed * 14.);            // the tail fans and twists as it steers
  p.y += aW.y * .05 * sin(uTime * 1.1 + seed * 5.);
  float cb = cos(bank), sb = sin(bank);
#ifdef FLAM
  // a flamingo is held at uMinPx on the page, but never drawn more than 1.45 times its size: stations stand 4.5 m apart, so
  // every bird stays whole with water round it (and one held at that size keeps its three inks)
  float hold = clamp(uMinPx / max(px, 1e-4), 1., 1.45); vPx = px * hold;
#else
  float hold = max(1., uMinPx / max(px, 1e-4));
#endif
  float sc = iB.y * grow * hold;
  vec3 q = vec3(p.x * cb - p.y * sb, p.x * sb + p.y * cb, p.z) * sc;
  vec3 nn = vec3(n.x * cb - n.y * sb, n.x * sb + n.y * cb, n.z);
  mat3 M3 = mat3(modelMatrix);
  vec3 w = wc.xyz + M3 * (right * q.x + up * q.y + fwd * q.z);
  vN = M3 * (right * nn.x + up * nn.y + fwd * nn.z);
  vInk = ink; vUV = vec2(d, position.z); vW = aW;
  vec4 mv = viewMatrix * vec4(w, 1.); vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;
// A FLAMINGO, printed as the storks are (never a flat pink shape): the pink plate carries it as grain that deepens from a
// bare-paper highlight along the leading edge of each wing back to the flight feathers; the hand and a scalloped trailing
// band are plum with feather gaps knocked out; the root of each wing and the flanks take blue dots (the body's own shade);
// the back has a paper highlight, the belly is plum, the bill is paper with a plum tip. vW.w = the part: 0..1 across the
// wing's chord (leading edge to trailing edge), 2 body, 3 neck and head, 4 bill (inked by vertex), 5 legs.
const FLAM_FRAG = /* glsl */`precision highp float;
${INK_GLSL}
varying vec3 vInk, vN; varying float vDepth, vPx; varying vec2 vUV; varying vec4 vW;
void main(){
  vec3 n0 = vN / max(length(vN), 1e-5), n = gl_FrontFacing ? n0 : -n0;
  float lit = dot(n, uSunDir), part = vW.w, span = clamp(abs(vW.x) / .95, 0., 1.);
  float fc = fwidth(part) * 1.2 + 1e-4, fsRaw = span * 26. + part * 2., lw = max(fwidth(fsRaw), 1e-4);
  vec3 ink; float keep = 0.;                                           // keep: bare paper that takes no shade
  if (part < 1.5) {
    float c = clamp(part, 0., 1.);
    float hand = smoothstep(.5, .6, span + (c - .5) * .14);            // the black hand: its inner edge slants back across the wing
    float lead = mix(.2, .3, hand);
    float cut = mix(.72 + .04 * sin(span * 80.), lead + .05, hand);    // where the pink coverts end and the plum flight feathers begin
    float gap = (1. - smoothstep(lw * .7, lw * 1.5, abs(fract(fsRaw) - .5))) * (1. - smoothstep(.16, .45, lw)) * smoothstep(cut + .05, cut + .16, c);
    float plum = smoothstep(cut - fc, cut + fc, c) * (1. - gap * .9);
    float hl = 1. - smoothstep(lead - fc, lead + fc, c);
    float tone = mix(.6, .97, smoothstep(lead, cut, c));
    ink = vec3(tone * (1. - hl), .26 * (1. - smoothstep(.04, .24, span)) * (1. - hl), 0.);
    if (!gl_FrontFacing) ink = vec3(.92, .2 + .2 * (1. - smoothstep(.04, .34, span)), 0.);          // the underwing: deep pink under a light dot
    ink = mix(ink, vec3(1., 1., 0.), plum); keep = hl * (1. - plum) * (gl_FrontFacing ? 1. : 0.);
  } else if (part < 2.5) {
    float back = smoothstep(.72, .92, n0.y), belly = (1. - smoothstep(-.5, -.1, n0.y));
    ink = mix(vec3(.84, .3 * (1. - smoothstep(.1, .5, n0.y)), 0.), vec3(0.), back); ink = mix(ink, vec3(1., 1., 0.), belly); keep = back;
  } else if (part < 3.5) ink = vec3(.9, .34 * (1. - smoothstep(-.4, .1, n0.y)), 0.);
  else if (part < 4.5) { ink = vInk; keep = 1. - step(.05, max(ink.r, ink.g)); }
  else ink = vec3(1., 0., .3);
  // light is ink: a side turned from the sun takes blue dots over its pink
  ink.g += (1. - ink.g) * (1. - smoothstep(-.35, .3, lit)) * .5 * (1. - keep);
  // too small to print in three inks: a pink tick with plum hands
  float small = 1. - smoothstep(13., 21., vPx);
  ink = mix(ink, part < 1.5 && span > .56 ? vec3(1., 1., 0.) : vec3(1., 0., 0.), small);
  ink = inkHaze(ink, vDepth * .5);
  gl_FragColor = inkOut(ink, vDepth);
}`;
const BIRD_FRAG = /* glsl */`precision highp float;
${INK_GLSL}
uniform float uBars, uSolid;
varying vec3 vInk, vN; varying float vDepth, vPx; varying vec2 vUV;
void main(){
  vec3 n = vN / max(length(vN), 1e-5); if (!gl_FrontFacing) n = -n;
  float lit = dot(n, uSunDir);
  vec3 ink = vInk;
  // barred underwings (honey buzzards): knocked-out bars across the wing, only where they are wide enough to print
  float fb = vUV.x * 9., fw = fwidth(fb);
  float bar = smoothstep(.25, .35, abs(fract(fb) - .5)) * (1. - smoothstep(.2, .5, fw)) * step(.08, vUV.x) * abs(uBars) * (1. - step(0., n.y));
  ink = uBars < 0. ? mix(ink, vec3(1., 1., 0.), bar * .92) : ink * (1. - bar * .85);     // uBars -1: plum bars printed on a pale wing
  ink = mix(inkShade(ink, lit, .8), ink, uSolid);
  float small = 1. - smoothstep(10., 16., vPx);                       // too small to print in three inks: a solid tick
  ink = mix(ink, mix(vec3(1., 1., 0.), ink, uSolid), small * step(.05, max(ink.r, max(ink.g, ink.b))));
  ink = mix(inkHaze(ink, vDepth), ink, uSolid * .7);
  gl_FragColor = inkOut(ink, vDepth);
}`;

// Swifts and thistledown: a box of things that wraps around the camera (world space), so there is always arm's-length
// parallax. iA = home position in the box (0..L), speed; iB = seed, size, heading, kind
const DRIFT_VERT = /* glsl */`
attribute vec3 ink; attribute vec4 iA; attribute vec4 iB;
uniform float uTime, uBufH, uBox, uMinPx; uniform vec3 uWind;
varying vec3 vInk; varying float vDepth; varying vec2 vUV;
void main(){
  float seed = iB.x; vec3 p = position;
  vec3 vel = uWind;
#ifdef SWIFT
  float hd = iB.z + .5 * sin(uTime * .23 + seed * 30.);
  vec3 fwd = vec3(sin(hd), .12 * sin(uTime * .4 + seed * 11.), cos(hd));
  vel = vec3(sin(iB.z), 0., cos(iB.z)) * iA.w;
#endif
  vec3 home = iA.xyz + vel * uTime;
#ifndef SWIFT
  home.xz += vec2(sin(uTime * .31 + seed * 40.), cos(uTime * .27 + seed * 23.)) * 1.3;
#endif
  vec3 q = mod(home - cameraPosition, uBox) - .5 * uBox;
  vec3 wc = cameraPosition + q;
  float dist = max(length(q), .001);
  float px = projectionMatrix[1][1] * uBufH * .5 / dist * iB.y;
  float sc = iB.y * max(1., uMinPx / max(px, 1e-4)) * (1. - smoothstep(.4 * uBox, .5 * uBox, dist)) * smoothstep(.5, 1.4, dist);
  vInk = ink; vUV = position.xy;
#ifdef SWIFT
  vec3 right = normalize(cross(vec3(0., 1., 0.), fwd)), up = cross(fwd, right);
  float bank = .7 * sin(uTime * .9 + seed * 17.), flick = .5 * sin(uTime * (26. + 8. * seed) + seed * 9.) * step(.4, fract(uTime * .7 + seed * 3.));
  p.y += abs(p.x) * (flick + .1);
  vec3 b = vec3(p.x * cos(bank) - p.y * sin(bank), p.x * sin(bank) + p.y * cos(bank), p.z) * sc;
  vec4 mv = viewMatrix * vec4(wc + right * b.x + up * b.y + fwd * b.z, 1.);
#else
  vec4 mv = viewMatrix * vec4(wc, 1.); mv.xy += position.xy * sc;
#endif
  vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;
const DRIFT_FRAG = /* glsl */`precision highp float;
${INK_GLSL}
varying vec3 vInk; varying float vDepth; varying vec2 vUV;
void main(){
  vec3 ink = vInk;
#ifndef SWIFT
  float r = length(vUV) * 2.;                                         // thistledown: a round paper tuft with a plum seed
  float ray = .78 + .22 * cos(atan(vUV.y, abs(vUV.x) + 1e-4) * 9.);
  if (r > ray) discard;
  ink = vec3(1., 1., 0.) * (1. - smoothstep(.16, .26, r));
#endif
  gl_FragColor = inkOut(ink, vDepth);
}`;

// ---------------------------------------------------------------- 3. the world
export default {
  id: 'stork-kettle-riso',
  name: 'Kettle over the Strait',
  category: 'sky',
  weirdness: 0.3,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();

    // ================================================================ MOODS (seeded looks)
    const hourPick = rng.pick(['noon', 'noon', 'noon', 'noon', 'golden', 'haze']);
    const hour = vary.hour === 'golden' ? 'golden' : (vary.hour === 'dawn' || vary.hour === 'night') ? 'haze' : vary.hour === 'day' ? 'noon' : hourPick;
    const wind = rng.chance(0.4) ? 'east' : 'calm';
    const season = rng.chance(0.4) ? 'spring' : 'parched';
    const cast = rng.pick(['white', 'black', 'raptor', 'packed', 'thin']);
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const mood = { hour, wind, season, cast, rare: !!vary.rare };
    const golden = hour === 'golden', haze = hour === 'haze', east = wind === 'east';

    // a second stream of choices for the close company (which stair, which side the close storks pass on, when): its own
    // generator, made from the seed without a draw from ctx.rng, so every older choice of every seed stays as it was
    const vr = makeRng('stork-kettle-company:' + (ctx.seed ?? 0));
    const stairLayout = vr.int(0, 2), mirror = vr.chance(0.5) ? -1 : 1;
    mood.stair = stairLayout; mood.mirror = mirror;

    // ================================================================ HERO + PATH
    const hero = await buildHero(ctx, {
      exposure: 3, hour, wind, backdrop: false, rise: 2.3, base: [-60, 0, 360], stairLayout,
      cast: cast === 'raptor' ? 'white' : cast, ticks: Math.round(6400 * clamp(density, 0.75, 1.1)),
    });
    await ctx.yield();
    const press = hero.press, H = hero.height, A = hero.anchors, seat = A.portalSeat;
    const sty = (o) => hero.styleMaterial(o);
    const path = makePath(A.flyThrough);
    // THE BEATS of the design's journey are named in seconds: metresAt(sec) = the metres flown at that second of the film
    // (the engine flies at length / duration x pace(u), with pace scaled so that the whole lasts `duration`)
    const DURATION = 51, paceOf = (u) => 1 - 0.45 * smoothstep(0.64, 0.70, u) * (1 - smoothstep(0.85, 0.91, u));
    const metresAt = (sec) => {
      let k = 0; for (let i = 0; i < 65; i++) k += 1 / paceOf(i / 64); k /= 65;
      let d = 0; const h = 0.02; for (let t = 0; t < sec && d < path.length; t += h) d += (path.length / DURATION) * paceOf(d / path.length) * k * h;
      return d;
    };
    // route metres at the i-th point of the suggested flight (the helix begins at its third point), and the last straight's length
    const FT_D = (i) => { const q = A.flyThrough[i]; let best = 0, bd = 1e9; for (let k = 0; k <= 2000; k++) { const d = k / 2000 * path.length, pp = path.posAtDist(d, _p), e = pp.distanceToSquared(q); if (e < bd) { bd = e; best = d; } } return best; };
    const FT_STRAIGHT = A.flyThrough[A.flyThrough.length - 1].distanceTo(A.flyThrough[A.flyThrough.length - 4]);
    const root = new THREE.Group(); root.name = 'kettle-root';        // sinks under the camera: the time-lapse climb
    scene.add(root); root.add(hero.object);
    const land = new THREE.Group(), strait = new THREE.Group(), clouds = new THREE.Group(), castG = new THREE.Group();
    root.add(land, strait, clouds, castG);
    const sunDir = press.shared.uSunDir.value;
    // the engine's ride is drawn outside the plates (layer 0): these two lights are for it alone
    const rideSun = new THREE.DirectionalLight(golden ? '#ffe9c4' : '#ffffff', 2.2); rideSun.position.copy(sunDir).multiplyScalar(100);
    const rideSky = new THREE.HemisphereLight('#dfe6f6', '#8f9cc4', 1.5);
    scene.add(rideSun, rideSky);
    // THE VEIL (for the ride only): a full-screen triangle at 12.9 m with the depth test reversed, multiplied over whatever
    // stands nearer than the page (the page never writes nearer than 13 m, so that is the ride and nothing else).
    const uVeil = { value: 1 };
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
      const veil = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uProj: press.uniforms.uProj, uPx: press.uniforms.uPx, uVeil, uBlue: { value: new THREE.Color('#3255A4') }, uPaper: { value: new THREE.Color(hero.mood.paper || '#F6F0E2') } },
        vertexShader: 'uniform vec2 uProj; void main(){ gl_Position = vec4(position.xy, (uProj.y - uProj.x * 12.9) / 12.9, 1.); }',
        fragmentShader: /* glsl */`precision highp float; uniform float uPx, uVeil; uniform vec3 uBlue, uPaper;
          void main(){
            vec2 q = mat2(.258819, .965926, -.965926, .258819) * (gl_FragCoord.xy / max(uPx, .25)) * (6.28318 / 6.);
            float T = .5 - .25 * (cos(q.x) + cos(q.y)), b = smoothstep(-.12, .12, .24 - T);
            gl_FragColor = vec4(mix(vec3(1.), uPaper * mix(vec3(1.), uBlue * 1.6, b), uVeil), 1.);
          }`,
        depthFunc: THREE.GreaterDepth, depthTest: true, depthWrite: false, transparent: true, blending: THREE.MultiplyBlending, premultipliedAlpha: true, fog: false, toneMapped: false,
      }));
      veil.frustumCulled = false; veil.renderOrder = 900; scene.add(veil);
    }
    const uCloud = { value: new THREE.Vector4(-60, 0, 560, east ? 0.012 : 0.004) };
    const pathY = (u) => path.pointAt(u, _p).y;

    // ================================================================ SEA
    // One plane. Everything on the water is ink knocked out of (or added to) the blue: swell bands 70-88 percent, paper
    // swell lines, whitecaps, tide rips, glitter under the sun, yellow shallows, foam at the cliff foot, pink-grain cloud
    // shadows, and the wakes of the nine ships (uShip: x, z, heading x, z; uShipB: length, wake length, beam, stern churn).
    const NSHIP = 9;
    const uShip = { value: Array.from({ length: NSHIP }, () => new THREE.Vector4(0, 9e5, 1, 0)) };
    const uShipB = { value: Array.from({ length: NSHIP }, () => new THREE.Vector4(100, 600, 16, 1)) };
    const uFarW = { value: 0 };   // 1 from the top of the climb: far wakes are held wide on the page (the last approach)
    const uLook = { value: 0 };   // 1 during the look back down: tide rips and drifting cloud shadows keep clear of the skerry
    const uSea = { value: new THREE.Vector4(east ? 0.26 : 0.06, east ? 0.6 : 1, golden ? 1 : 0, haze ? 1 : 0) };
    const seaMat = sty({
      uniforms: { uShip, uShipB, uSea, uCloud, uLook, uFarW, uBufH: hero.uniforms.uBufH },
      fragmentPre: COAST_GLSL + SHADOW_GLSL + /* glsl */`
        uniform vec4 uShip[${NSHIP}]; uniform vec4 uShipB[${NSHIP}]; uniform vec4 uSea; uniform float uLook, uBufH, uFarW;
        float wkDark;                                                     // set by wakes(): the dark water beside a far wake
        float wakes(vec2 w, float px, vec2 fw){
          float k = 0.; wkDark = 0.;
          for (int i = 0; i < ${NSHIP}; i++) {
            vec2 rel = w - uShip[i].xy, dir = uShip[i].zw;
            float along = dot(rel, dir), across = abs(dot(rel, vec2(-dir.y, dir.x)));
            float L = uShipB[i].x, s = L * .5 - along;                     // metres behind the bow
            float life = 1. - smoothstep(.55, 1., s / max(uShipB[i].y, 1.));
            float fade = step(0., s) * life;
            // metres to the pixel ACROSS this wake (fw = fwidth of w.x and w.y, taken outside the loop): far off, and seen low
            // over the water, a wake is held 3 to 10 design px wide on the page (more than a dot pitch: a stroke of paper, not a hairline) (uFarW: from the top of the climb only), so it stays a long paper stroke as far as the far shore
            float apx = abs(dir.y) * fw.x + abs(dir.x) * fw.y, farK = smoothstep(9., 22., apx) * uFarW;
            float wv = 1.6 + s * .009 + min(px, 9.) * 1.1;                          // the arms of the bow V widen and soften astern
            float arm = 1. - smoothstep(wv * .6, wv, abs(across - (uShipB[i].z * .35 + s * .2)));
            float churn = inkNoise(vec2(along * .06 + float(i) * 7., across * .3)) * .5 + .5;
            float st = L * .92 - along - L * .5;                            // metres behind the stern
            float dpx = apx * uBufH / 450.;                                 // metres to the design pixel across the wake
            // a broad wake (uShipB.w = 2: a fast ferry's, by the kind of ship) is a brush stroke of paper: it swells for 250 m
            // behind the stern and then tapers to a point, its edge wanders and breaks into flecks (never a ruled bar), and it
            // has no hairline arms of a bow V beside it. EVERY wake narrows to its tail: a stroke that ends in a point,
            // never a band of one width.
            float broad = smoothstep(1.4, 2., uShipB[i].w), noArm = smoothstep(1., 1.2, uShipB[i].w), sl = s / max(uShipB[i].y, 1.);
            float swell = smoothstep(0., 250., st) * (1. - smoothstep(.12, .95, sl));
            float wsB = (uShipB[i].z * .34 + (8. + min(px, 9.) * .9) * swell) * (.72 + .56 * inkNoise(vec2(along * .012 + float(i) * 5., 7.)));
            float ws = max(mix((uShipB[i].z * .3 + max(st, 0.) * .006 + min(px, 9.) * 1.2) * (1. - .85 * smoothstep(.15, .9, sl)), wsB, broad), dpx * mix(5., 1.6, smoothstep(.1, .9, sl)) * farK);
            ws = max(ws, dpx * mix(2.2, .9, smoothstep(.08, .95, sl)) * broad);   // (held four and a half design px wide behind the ferry, 2 at its tail, however low the lens)
            // EVERY WAKE IS A BROKEN LINE OF FOAM (every ship, every range): its edge wanders and breaks, and astern of the
            // churn at the stern the trail is cut into dashes with blue water between them (about two fifths of its length
            // is water; the dashes lie in the WATER, the ship draws away from them), so a paper bird that crosses a wake has
            // dots round its body and never joins a ruled paper stroke ...
            float brk = smoothstep(.25, .55, inkNoise(vec2(along * .011 + float(i) * 3., across * .04)) * .8 + (1. - across / max(ws, 1e-3)) * .9);
            float wAl = dot(w, dir), gone = smoothstep(60., 240., st);
            // (long and short dashes, no two alike. A dash is never shorter than 8 design px ALONG the wake: where the
            // wake is seen far off or end on, the dashes are drawn an octave longer at a time, cross-faded, so it stays a
            // broken line as far as the far shore and never closes up into a ruled stroke)
            float lodW = log2(max((abs(dir.x) * fw.x + abs(dir.y) * fw.y) * uBufH / 450. * 8. / 37., 1.)), sc0 = exp2(-floor(lodW)), fi = float(i);
            float dash0 = smoothstep(.4, .47, inkNoise(vec2(wAl * .027 * sc0 + fi * 11., 3.)) * .62 + inkNoise(vec2(wAl * .083 * sc0 + fi * 4., 6.)) * .38);
            float dash1 = smoothstep(.4, .47, inkNoise(vec2(wAl * .0135 * sc0 + fi * 11., 3.)) * .62 + inkNoise(vec2(wAl * .0415 * sc0 + fi * 4., 6.)) * .38);
            float dash = mix(1., mix(dash0, dash1, smoothstep(.25, .75, fract(lodW))), gone);
            float dashA = mix(1., smoothstep(.4, .48, inkNoise(vec2(wAl * .04 + float(i) * 5., 9.))), smoothstep(L * .55, L * 1.1, s));
            // ... with darker water for a dot pitch and a half either side of it at every range, so the dashes are PAPER on the
            // pale, hazy strait and not a dark hairline
            wkDark = max(wkDark, (1. - smoothstep(ws + dpx * 1.5, ws + dpx * 5.5, across)) * smoothstep(-8., 40., st) * fade * (.35 + .65 * inkNoise(vec2(wAl * .019 + float(i) * 3., across * .05))));   // (a soft, wandering margin: never a ruled band)
            float trail = (1. - smoothstep(ws * mix(.55, .8, broad), ws, across)) * smoothstep(-8., 4., st) * mix(churn, .82 + .18 * churn, max(farK, broad)) * brk * dash * min(uShipB[i].w, 1.);
            float skirt = (1. - smoothstep(uShipB[i].z * .5 + 1.5 + min(px, 4.), uShipB[i].z * .5 + 5. + min(px, 4.) * 2., across)) * step(abs(along), L * .56);   // foam at the waterline
            k = max(k, max(arm * dashA * .9 * (1. - smoothstep(150., 950., s)) * (1. - farK) * (1. - noArm), trail) * fade);
            k = max(k, skirt * .9);
          }
          return k;
        }`,
      fragmentMain: /* glsl */`
        vec2 w = vWorld.xz; float px = max(fwidth(w.x) + fwidth(w.y), 1e-4);           // metres to the pixel, more or less
        float sw = dot(w, vec2(.2873, .9578)) / 52. + inkNoise(w * .0022) * 1.3 - uTime * .11;
        float swf = fwidth(sw);
        float sw2 = dot(w, vec2(-.6, .8)) / 17. + inkNoise(w * .011 + 5.) * 1.7 - uTime * .19;
        float sw2f = fwidth(sw2);
        float band = (.5 + .5 * sin(sw * 6.28318)) * (1. - smoothstep(.2, .7, swf));
        float tone = mix(.7, .88, mix(.5, band, uSea.y * .8 + .2));
        tone -= .07 * (.5 + .5 * sin(sw2 * 6.28318)) * (1. - smoothstep(.15, .6, sw2f));
        tone += (inkNoise(w * .0009 + 3.) - .5) * .12;                      // slicks and cat's-paws, kilometres across
        // paper swell lines: thin, broken, crawling with the swell
        // paper swell dashes: short (40 to 90 m), bent by the slicks, and only where a metre of sea is wider than a pixel or so;
        // from altitude the sea is calm blue and the wakes are the only long white strokes
        float swl = sw + inkNoise(w * .0065 + 9.) * .55, swlf = max(fwidth(swl), 1e-5);
        float ln = 1. - smoothstep(.028 + swlf * .6, .028 + swlf * 1.6, abs(fract(swl) - .5));
        ln *= smoothstep(.57, .65, inkNoise(vec2(dot(w, vec2(.9578, -.2873)) * .011, floor(swl) * 3.7))) * (1. - smoothstep(.12, .45, swlf)) * (1. - smoothstep(1., 3.2, px));
        // whitecaps: cells that break for a moment and drift downwind
        vec2 wc = (w + vec2(uTime * 2.2, 0.)) / vec2(11., 6.);
        vec2 ci = floor(wc), cf = fract(wc) - .5;
        float ch = inkHash(ci), lifeC = fract(uTime * (.12 + .1 * ch) + ch * 9.);
        float cap = step(1. - uSea.x, inkHash(ci + 31.7)) * smoothstep(0., .15, lifeC) * (1. - smoothstep(.5, .9, lifeC));
        cap *= 1. - smoothstep(.12, .3 + .12 * ch, length(cf * vec2(1., 1.9) + (vec2(inkHash(ci + 3.), inkHash(ci + 8.)) - .5) * .4));
        cap *= (1. - smoothstep(1., 2.4, px));
        float capFar = smoothstep(1.2, 4., px) * uSea.x * .3 * smoothstep(.55, .75, inkNoise(w * .02 + vec2(uTime * .05, 0.)));   // far off they merge into streaks
        // three tide rips off the point
        float rip = 0.;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float rz = 260. + fi * 520. + 90. * sin(w.x * .0021 + fi * 2.1) + 40. * sin(w.x * .0063 + fi + uTime * .03);
          float wr = 3. + 2. * fi + min(px, 6.) * .7;
          rip = max(rip, (1. - smoothstep(wr * .4, wr, abs(w.y - rz + 5. * inkNoise(vec2(w.x * .09, fi * 3.))))) * smoothstep(.4, .6, inkNoise(vec2(w.x * .035 - uTime * .3, fi * 9.))) * (1. - smoothstep(1500., 3800., abs(w.x + 300. - fi * 400.))));
        }
        // glitter: paper flecks where the sea throws the sun back, each lasting half a second
        vec3 vdir = normalize(vWorld - cameraPosition);
        float spec = max(dot(reflect(vdir, vec3(0., 1., 0.)), uSunDir), 0.);
        // (a narrow path of short dashes lying along the swell crests, never more than a tenth of the water covered)
        float gs = max(3., px * 6.5); vec2 gq = vec2(dot(w, vec2(.9578, -.2873)) / 2.5, dot(w, vec2(.2873, .9578))) / gs, gc = floor(gq);
        float gl = step(1. - smoothstep(.988, .9995, spec) * .09, inkHash(gc + floor(uTime * 2. + inkHash(gc) * 2.) * 17.3)) * (1. - smoothstep(.2, .42, length((fract(gq) - .5) * vec2(1., 1.6))));
        // the coast: yellow under blue in the shallows, foam breathing at the foot of the cliff
        // (dm: metres south of the mainland's coastline, which is the cliff's TOP edge; gdm: metres of dm to the design
        // pixel; mapS: the land's own mapK, by the same measure, so the sea's shore changes hands where the land's print does)
        float dc = w.y - coastZ(w.x), dm = dc, gdm = max(length(vec2(dFdx(dm), dFdy(dm))) * uBufH / 450., 1e-4), mapS = smoothstep(3., 6.5, px * uBufH / 450.);
        // the lighthouse island off the tip (LIGHT): a ragged skerry, not a disc; the bare skerry to the south-east (ISLE)
        // and the rock awash west of the point (ISLET), each in its own ring of surf over a shoal
        float isl = length((w - vec2(${LIGHT[0].toFixed(1)}, ${LIGHT[1].toFixed(1)})) * vec2(1.3, .8)) - 42. + 16. * (inkNoise(w * .04 + 2.) - .5);
        float isl2 = length((w - vec2(${ISLE[0].toFixed(1)}, ${ISLE[1].toFixed(1)})) * vec2(1.25, .85)) - 46. + 22. * (inkNoise(w * .03 + 2.) - .5);
        dc = min(dc, min(isl, isl2));
        float reef = length((w - vec2(${ISLET[0].toFixed(1)}, ${ISLET[1].toFixed(1)})) * vec2(1.2, .85)) - 13. + 7. * (inkNoise(w * .07 + 5.) - .5);
        float shallow = max((1. - smoothstep(8., 110., dc + 30. * inkNoise(w * .02))) * step(-40., dc), 1. - smoothstep(2., 16., reef));
        dc = min(dc, reef);
        // THE FOOT OF THE CLIFF IS IN SURF (mend12). The face leans out: it meets the water 34 m south of the coastline
        // (measured on the mesh, seeds 7, 3, 34: 30 to 38 m for nine tenths of the coast), so the foam laid from the
        // coastline lay wholly under the face and the cliff stood in flat water. The mainland's breathing foam is laid
        // from the foot (dcf); the islands' is as it was (dci). Where the land is printed as a map (mapS) the
        // mainland's foam, thinner than a dot there, gives way to the ruled shore line below.
        float dci = min(min(isl, isl2), reef), dcf = min(dm - 34., dci);
        float foam = (1. - smoothstep(3., 9. + 5. * sin(uTime * .7 + w.x * .05) + 6. * inkNoise(w * .12 + uTime * .2), dcf)) * (1. - mapS * step(dm - 34., dci));
        float foam2 = (1. - smoothstep(1., 2.5 + px, abs(dc - 18. - 6. * fract(uTime * .09 + inkNoise(w * .01)) * 3.))) * step(.45, inkNoise(w * vec2(.09, .09)));
        float white = max(ln * .9, max(max(cap, capFar), max(rip * (1. - uLook), gl)));
        // seen from the top of the kettle the foam at the cliff's foot is thinner than a dot: there a broken paper line of surf
        // two pixels wide follows the coast, so the land ends in a shore and not in a cut
        // (since mend12 that broken line is the islands' alone, dci; the mainland has the ruled shore below)
        float surfFar = (1. - smoothstep(px * 1.2, px * 2.6, abs(dci - px * 1.5))) * smoothstep(2.5, 6., px) * (1. - smoothstep(40., 90., px)) * step(.3, inkNoise(w * .011 + 31.));
        // THE CASED COAST (mend12; since 12e this line of the sea's is the whole of it): where the land is a map the
        // mainland's shore is ONE RULED PAPER LINE at the cliff's foot, unbroken, from under the face out to 5.5 m of
        // water and a design pixel and a quarter beyond the foot's mean (39.5 m = 34 + 5.5: on the page 1.3 to 3 design
        // pixels of paper at every range, never thinner than the 1.2 the order sets), so the water ends in a shore
        // whatever the ground's tone.
        // THE LINE GOES WITH THE HAZE (mend12, second pass): a ruled paper line is a mark on the map, and where the land
        // beside it has gone to the haze's blue no cream stands on it. hzS is the share of a yellow the haze has taken
        // at this range (the press's own law, inkHaze); the page prints a full yellow whole while .58 of it is left
        // and not at all under .42 (its on/off): between the two the olive beside the shore turns from olive to the
        // haze's blue, and the shore goes out with it. Noon and golden hour: whole to 1.9 km, gone from 2.8 km; haze
        // hour: 0.86 and 1.27 km. Nearer, every value is what it was. BY THE RANGE (12e): the distance is the metres
        // from the eye to the water, as the land beside it takes its haze (THE LAND SHADES AND HAZES ITSELF, in the
        // land's shader), and not vDepth, the metres along the lens's axis: line and land go out together at every bearing.
        float hzS = clamp(length(vWorld - cameraPosition) / max(uHaze.x, 1.), 0., 1.); hzS = 1. - (1. - hzS) * (1. - hzS);
        float shore = (1. - smoothstep(39.5 + 1.05 * gdm, 39.5 + 1.45 * gdm, dm)) * step(0., dm) * mapS * (1. - smoothstep(.42, .58, hzS));
        white = max(white, max(max(max(foam, shore), foam2 * .8), max(surfFar * .85, wakes(w, px, vec2(fwidth(w.x), fwidth(w.y))))));
        float shadow = cloudShadow(w, uCloud.w * 0. + ${(H - SEA_Y).toFixed(1)}) * mix(1., smoothstep(420., 1000., length(w - vec2(0., 420.))), uLook);
        tone = mix(tone, tone * .8 + .04, shallow);
        ink = vec3(shadow * .5, tone, shallow * .95);
        // the sea hazes itself (haze: false below): in the hazy morning edition it keeps a 22 percent dot out to nine kilometres
        // (so the last approach is not bare paper), and the water beside a far wake is darkened after the haze
        // (the sea hazes half as fast as everything that stands on it: the strait is blue most of the way across and pales
        // to the band of paper haze under the far coast, so the page always has a ground under its horizon, ships and
        // wakes lie on water and not on bare paper, and under the dark cloud of the last approach it does not read
        // upside down)
        ink = inkHaze(ink, vDepth * mix(.5, .42, uFarW));
        ink.g = max(ink.g, uSea.w * .22 * (1. - smoothstep(8500., 11500., vDepth)));
        ink.g = min(ink.g + wkDark * mix(.22, .3, uFarW), 1.);
        ink *= 1. - clamp(white, 0., 1.);
        lit = 1.; shadeK = 0.;`,
      haze: false,
    });
    const seaGeo = new THREE.PlaneGeometry(44000, 44000, 4, 4); seaGeo.rotateX(-Math.PI / 2);
    seaGeo.setAttribute('ink', new THREE.Float32BufferAttribute(new Float32Array(seaGeo.attributes.position.count * 3), 3));
    const sea = new THREE.Mesh(seaGeo, seaMat); sea.position.y = SEA_Y; sea.frustumCulled = false; strait.add(sea);
    await ctx.yield();

    // ================================================================ LAND: the headland
    // One mesh in coast coordinates: columns along x (dense near the thermal), rows by distance north of the coastline
    // (t < 0 is the cliff face, 120 m down to the sea, with buttresses pushed out by noise). Vertex ink = (rock, scrub
    // density, broom); the fragment shader prints scrub mottling, limestone ribs, strata and cloud shadow from it.
    const spring = season === 'spring';
    const TOWER = { x: 48, z: 2, y: 3 };
    const hTop = (x, z, t) => {
      const hill = smoothstep(300, 2300, t), ridge = 1 - Math.abs(noise.fbm2(x * 0.00042 + 5, z * 0.00042, 4));
      const dx = x - TOWER.x, dz = z - TOWER.z;
      return noise.fbm2(x * 0.02, z * 0.02, 3) * 1.3 * smoothstep(0, 30, t)
        + 30 * smoothstep(90, 900, t) * (0.5 + 0.5 * noise.fbm2(x * 0.0021, z * 0.0021, 3))
        + 520 * hill * ridge * (0.5 + 0.5 * smoothstep(-0.4, 0.5, noise.n2(x * 0.0002, z * 0.0002 + 9)))
        + 3.4 * Math.exp(-(dx * dx + dz * dz) / 60);
    };
    const hAt = (x, z) => hTop(x, z, Math.max(coastZ(x) - z, 0));
    {
      const NX = 320, rowsT = [-36, -27, -20, -15, -11, -7, -3.5, 0, 4, 9, 16, 26, 40, 60, 90, 130, 190, 270, 380, 520, 700, 950, 1300, 1800, 2500, 3500, 5000, 7000, 9500];
      const cliffH = [-128, -119, -97, -72, -47, -24, -7, 0], NR = rowsT.length;
      const P = new Float32Array((NX + 1) * NR * 3), K = new Float32Array((NX + 1) * NR * 3), I = [];
      for (let i = 0; i <= NX; i++) {
        const s = i / (NX / 2) - 1, x = 600 * s + 8400 * s * s * s, cz = coastZ(x);
        for (let r = 0; r < NR; r++) {
          const t = rowsT[r], o = (i * NR + r) * 3;
          let z = cz - t, y, rock = 0;
          if (r < 8) {
            const f = r / 7, bulge = Math.sin(Math.PI * Math.min(f * 1.15, 1));
            z += bulge * (9 * (1 - Math.abs(noise.n2(x * 0.03, r * 0.22))) + 3 * noise.n2(x * 0.11, r * 0.9)) + (r === 1 ? 5 * noise.n2(x * 0.05, 3) + 4 : 0);
            y = cliffH[r] + (r > 1 && r < 7 ? 5 * noise.n2(x * 0.04, r * 1.7) : 0); rock = r === 7 ? 0.55 : 1;
          } else y = hTop(x, z, t);
          P[o] = x; P[o + 1] = y; P[o + 2] = z;
          const dens = clamp(0.42 + 0.5 * noise.fbm2(x * 0.004 + 3, z * 0.004, 2) + 0.3 * smoothstep(300, 2000, t) + (spring ? 0.16 : -0.04), 0.08, 1);
          K[o] = rock; K[o + 1] = dens; K[o + 2] = (spring ? 0.9 : 0.3) * smoothstep(-0.1, 0.5, noise.n2(x * 0.006 + 20, z * 0.006));
        }
        if (i % 32 === 0) await ctx.yield();
      }
      for (let i = 0; i < NX; i++) for (let r = 0; r < NR - 1; r++) { const a = i * NR + r, b = a + NR; I.push(a, a + 1, b + 1, a, b + 1, b); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('ink', new THREE.BufferAttribute(K, 3)); g.setIndex(I); g.computeVertexNormals();
      const mat = sty({
        uniforms: { uCloud, uBufH: hero.uniforms.uBufH, uPx: press.uniforms.uPx }, side: THREE.DoubleSide, haze: false,   // (the land shades and hazes itself: see the end of its shader)
        vertexPre: 'varying vec3 vLoc;', vertexMain: 'vLoc = p;',
        fragmentPre: 'varying vec3 vLoc; uniform float uBufH, uPx;' + SHADOW_GLSL + ROAD_GLSL,
        fragmentMain: /* glsl */`
          vec2 w = vWorld.xz; float px = max(fwidth(w.x) + fwidth(w.y), 1e-4);
          float rock = vInk.r, dens = vInk.g, broom = vInk.b, nearK = (1. - smoothstep(1., 5., px));
          float n1 = inkNoise(w * .045), n2 = mix(.5, inkNoise(w * .31 + 11.), (1. - smoothstep(2.5, 9., px))), n3 = inkNoise(w * 1.7 + 3.);
          float m = n1 * .55 + n2 * mix(.45, .3, nearK) + n3 * .15 * nearK;
          float scrub = smoothstep(.52 - dens * .34, .57 - dens * .34, m);
          // THE PRINTED MAP. Where a design pixel of the page covers more than a few metres of ground (dp: from about
          // 700 m up, and all the far hills from anywhere) the land is drawn as a map and not as a texture: scrub in broad
          // FLAT patches of olive, hundreds of metres across with clean edges, on ground printed flat too; no mottling.
          float dp = px * uBufH / 450., mapK = smoothstep(3., 6.5, dp);
          float pm = inkNoise(w * .0047 + 17.) * .64 + inkNoise(w * .0121 + 3.) * .36, pe = max(fwidth(pm) * 1.2, .012);
          scrub = mix(scrub, smoothstep(.5 - pe, .5 + pe, pm + (dens - .55) * .45 + .035), mapK);
          float rib = smoothstep(.6, .66, inkNoise(w * vec2(.016, .11) + 40.)) * step(n2, .62) * (1. - mapK);
          // BARE GROUND ON THE MAP IS A STRAW GROUND WITH ITS FORM FROM THE LIGHT (mend12), flat and clean-edged as the olive
          // is, NO GRAIN (a thistle head or a rib is smaller than a design pixel there: noise). The straw is an ink the
          // sea does not carry: a regular screen of the yellow plate, printed at the end of this shader (THE STRAW SCREEN).
          // Over it the blue of the shade, by the light:
          // turn = the light a slope loses against level ground (the sun's height less N.L) over the sun's level
          // length. It is NOT the tilt from the sun's bearing alone: for a slope of tilt t whose fall line stands at the
          // angle a from the sun's bearing, turn = tan(sun's height) (1 - cos t) - sin t cos a: the lean away from the
          // sun plus what any tilt loses under a high sun. So at noon (the sun 64 degrees up) 45 to 73 in a hundred of
          // the turned ground lean a little sunward and are turned by their steepness; at the golden hour (25 degrees)
          // 1 in a hundred (headless, seeds 7, 11, 34, 4, 1 and 3, 20). Ground with level ground's light or more prints
          // the straw alone; ground with less takes the blue screen in three flat steps whose edges follow the relief,
          // one REAL pixel soft each side (tw: fwidth, the buffer's own pixel, which is the design pixel at 800 by
          // 450; measured in the second pass: an edge twice as soft moves the shimmer by nothing, so it stays):
          // .30 from turn 0, .44 from .06, .58 from .14 (a slope straight away from the sun: 3.3 and 7.1 degrees at
          // noon, 3.4 and 7.8 at the golden hour; side-on: 14 and 21, 30 and 46). These numbers are measures of the
          // print, not of the land: three tones .14 apart, the lightest a clear step under the straw (L 83 under 89),
          // the deepest under the olive's .64 so that turned ground is never taken for scrub; .06 and .14 halve the
          // turned ground twice at noon (the counts below). The page's own shade law (inkShade)
          // begins at N.L .35 and reaches none of this ground at noon (N.L .83 to .98 on seeds 7, 11, 34, 4, 1), so the
          // hills had no turned side. By turn, at noon 19 to 25 in a hundred of the bare ground are turned at all, 9
          // to 14 past the second step, 4 to 7 past the third (seed 1's flatter ground: 10, 2, 1); at the golden hour
          // 51, 32 and 19. The tones print L 83, 73 and 58 over the straw's 89 (eval11b's one flat tone, .42,
          // printed 80 over all of it). They come in with mapK as dots growing from nothing; the near ground keeps the
          // brief's bare paper. Left paper on the map: the road; and the terraces' fallow strips nearer than the far
          // gate (beyond it THE FAR GROUND IS ONE HAZED TONE, below, takes them with the rest of the top).
          float turn = (uSunDir.y - lit) / max(length(uSunDir.xz), .2), tw = max(fwidth(turn), 1e-4), lw = max(fwidth(lit), 1e-4);
          float shadeM = .30 * smoothstep(0. - tw, 0. + tw, turn) + .14 * smoothstep(.06 - tw, .06 + tw, turn) + .14 * smoothstep(.14 - tw, .14 + tw, turn);
          vec3 top = mix(vec3(0., .1 * smoothstep(.5, .8, n2), 0.), vec3(0., shadeM, 0.), mapK);   // bleached grass: bare paper near
          float brm = mix(smoothstep(.6, .66, inkNoise(w * .06 + 70.)), smoothstep(.66, .66 + pe * 2., inkNoise(w * .0083 + 70.)) * step(.5, broom), mapK);
          top = mix(top, vec3(0., 0., 1.), brm * broom);                                       // broom: flat yellow
          top = mix(top, vec3(0., mix(.52 + .3 * n2, .64, mapK), 1.), scrub);                  // olive: blue dots on flat yellow
          top = mix(top, vec3(0., .16 + .3 * n3 * nearK, 0.), rib * (1. - scrub * .7));       // limestone ribs
          // THE LANDMARKS, so that the land is a place and not a texture. Terraced fields on the slopes round the village:
          // strips that follow the contours, stubble (flat yellow), olive and bleached fallow (paper) in turn, each behind a paper wall ...
          float tm = 1. - smoothstep(200., 340., length(w - vec2(${VILLAGE[0].toFixed(1)}, ${(VILLAGE[1] - 20).toFixed(1)})) + 70. * (inkNoise(w * .006 + 3.) - .5));
          float tq = (vLoc.y + .1 * dot(w, vec2(.5, .86))) / 6., tf = fract(tq), ft = max(fwidth(tq), 1e-5);
          float wall = (1. - smoothstep(.06 + ft * .5, .06 + ft * 1.5, min(tf, 1. - tf))) * (1. - smoothstep(.2, .5, ft));
          float tk = mod(floor(tq), 3.);
          vec3 fld = tk < .5 ? vec3(0., .08 + .12 * n2, .92) : tk < 1.5 ? vec3(0., .52 + .24 * n2, 1.) : vec3(0., .1 + .14 * n2, 0.);
          top = mix(top, mix(fld, vec3(0.), wall), tm * (1. - smoothstep(.4, .9, ft)) * (1. - mapK));
          // ... on the map the terraces are CONTOUR BANDS: flat yellow and bare paper in turn, each band 15 m of height
          // (broad enough to print), round the village and round the upper hamlet on the hill road (HAMLET)
          float tmM = max(tm, 1. - smoothstep(250., 470., length(w - vec2(${HAMLET[0].toFixed(1)}, ${HAMLET[1].toFixed(1)})) + 110. * (inkNoise(w * .0045 + 8.) - .5)));
          float tqM = tq / 2.5, tfM = fract(tqM), ftM = max(fwidth(tqM), 1e-5);
          float bandM = smoothstep(0., ftM, tfM) * (1. - smoothstep(.56, .56 + ftM, tfM));
          top = mix(top, vec3(0., .04, bandM), tmM * mapK * (1. - smoothstep(.45, 1.1, ftM)));
          // ... and the white road (see roadX), never thinner than two pixels and a bit: a paper line from the tower to the village and on over the hills
          // (on the map it is ONE CLEAN LINE: three design pixels of paper at any range between two hairlines of blue, as a
          // road is cased on a printed sheet, so it reads across bare ground and olive alike)
          float rq = -w.y, rsl = (roadX(rq + 3.) - roadX(rq - 3.)) / 6., rd = abs(w.x - roadX(rq)) / sqrt(1. + rsl * rsl), mpp = px * .5, mpd = mpp * uBufH / 450.;
          float rhw = max(2.4, mix(1.15 * mpp, 1.5 * mpd, mapK)), rgate = step(13., rq) * (1. - smoothstep(2400., 2700., rq)) * (1. - smoothstep(mix(30., 70., mapK), mix(60., 130., mapK), px));
          float road = (1. - smoothstep(rhw - .5 * mpp, rhw + .5 * mpp, rd)) * rgate;
          float rcase = (1. - smoothstep(rhw + 1.1 * mpd - .5 * mpp, rhw + 1.1 * mpd + .5 * mpp, rd)) * rgate * mapK;
          top = mix(top, vec3(0., .96, 0.), rcase);
          top = mix(top, vec3(0.), road);
          // THISTLE IN THE BLEACHED GRASS OF THE NEAR GROUND, one law over the whole headland: a head in one cell in seven
          // (cells of 1.8 m), an oval 1.35 by 1.04 m. The .86 and .34/.5 are no count of the plant: they give a cover of 4.4
          // in a hundred of the bleached grass, the cover eval4c's line had (whole top, seeds 1 to 40). None on the map.
          vec2 tc = w * .55, tci = floor(tc);                                                   // thistle heads: small round clusters of pink grain
          float th = step(.86, inkHash(tci)) * (1. - smoothstep(.34, .5, length((fract(tc) - .5) * vec2(1., 1.3) + (vec2(inkHash(tci + 7.), inkHash(tci + 13.)) - .5) * .12) + .1 * inkNoise(w * 5.)));
          top.r = max(top.r, th * nearK * (1. - mapK) * (1. - scrub) * .92);                                // (flecks of near-solid pink a metre and a half across in the bleached grass)
          float sy = vLoc.y * .09 + inkNoise(vec2(w.x * .02, vLoc.y * .06)) * 1.6, sf = max(fwidth(sy), 1e-5);
          float strata = (1. - smoothstep(.07 + sf * .5, .07 + sf * 1.5, abs(fract(sy) - .5))) * (1. - smoothstep(.15, .5, sf));
          float crack = smoothstep(.62, .74, inkNoise(vec2(w.x * .14, vLoc.y * .025)));
          // THE CLIFF FACE IS ROCK (mend12). It was paper with its strata inked on it (blue .08 is under the screen's first
          // dot, and the face takes the noon sun at N.L .23 to .73, three quarters of it over inkShade's .35): from just
          // off its edge a white pane with a paper rim. Now the face is a flat tone of the blue screen stepped by the
          // light it takes: .44 lit, .56 under N.L .45, .68 under .15 (L 78, 64 and 50, each a step deeper than the ground's;
          // edges one real pixel soft each side: lw, as tw). .45 is the face's median at noon, so half of it is the lit side; under .15 lie
          // the faces turned from a low sun (half the face at the golden hour, a fiftieth at noon). The strata are
          // KNOCKED OUT of the tone as paper lines (the same lines, .92 of the ink taken out); cracks stay plum.
          // inkShade still deepens the faces turned right away, as on everything.
          float rockT = .44 + .12 * (1. - smoothstep(.45 - lw, .45 + lw, lit)) + .12 * (1. - smoothstep(.15 - lw, .15 + lw, lit));
          vec3 cliff = vec3(crack * .7, rockT + crack * .3, 0.) * (1. - strata * .92);
          ink = mix(top, cliff, rock);
          float shd = cloudShadow(w, ${H.toFixed(1)} - vLoc.y);                             // shade adds blue first, then a light pink grain: plum-blue, never solid pink
          // (on the map the shadow is one flat plum tone with a clean edge, sliding over patches, bands and road)
          shd = mix(shd, smoothstep(.3, .7, shd), mapK);
          ink.g = max(ink.g, shd * mix(.45, .6, mapK)); ink.r = max(ink.r, shd * mix(.28, .5, mapK) * (1. - rock * .6));
          shadeK = mix(.6, 1., rock);
          // (mend12) bare: 1 on the map's bare ground; 0 on the near ground, under olive, broom, terrace bands, the road and its case, and on rock
          float bare = mapK * (1. - brm * broom) * (1. - scrub) * (1. - tmM * mapK * (1. - smoothstep(.45, 1.1, ftM))) * (1. - rcase) * (1. - road) * (1. - rock);
          // NO LINE OF THE LAND'S OWN ALONG THE COAST (12e). eval12 laid a plum line 1.9 design px wide on the cliff's
          // top edge wherever the land is a map. In the climb the gaze turns 0.36 to 0.38 degrees a film frame and the
          // ground slides 2.6 to 3.6 design px a frame on the page (seed 7, u .33 to .61): a dark line thinner than its
          // own step is printed afresh at every frame, all of its ink changed twice over. Measured on the land alone
          // with the line switched off and nothing else (a port of this shader and of the page, two frames one film
          // frame apart at 800 by 450, the change inside the land's outline; seeds 7, 34 and 4, 30 places and clocks
          // of the climb): the line alone made 1 to 28 in a hundred of what the land changed, and where little but
          // the coast is in frame (u .544, seed 7) the land changed 59 in a hundred more than the site's with it and
          // 16 without. Taken out: the top ends in the rock of the face; the sea's ruled paper line at the foot and
          // the water case the coast.
          // THE LAND SHADES AND HAZES ITSELF (haze: false above, shadeK 0 from here: the press's own two calls in the
          // press's order), BY THE RANGE (12e): rng, the metres from the eye to this ground, where the press gives its
          // haze vDepth, the metres along the lens's axis. Those are a plane square to the lens: ground at one range
          // stands at its full distance in the middle of the frame and at 0.68 of it at the side edge of a 16:9 frame
          // (47 degrees off the axis), so by the press's measure the far gate below began 1.9 km off in the middle of
          // the frame and 2.8 km off at its side, ended 2.8 and 4.1 km off, and the ground between changed tone as the
          // head turned and nothing else did (2.8 km off: the haze's blue in the middle, olive and straw at the side).
          // Measured as the coast's line above (NO LINE OF THE LAND'S OWN): by the axis the land changed more than
          // a tenth over the site's at 21 of the 30 places and clocks (the most 59 in a hundred); the line out alone,
          // at 12 (the most 16); by the range, the line still on, at 9 (the most 52, the coast's own); by the range
          // with the line out at none (the most 9.5). WHAT THE RANGE GAINS IS GROUND IN ONE TONE, not a steadier tone.
          // What changes from frame to frame is the map's print sliding on the page, most of all the olive's edge
          // against lit ground (a step of .64 of the blue screen where the site's was .22: .64 against .42); the far
          // tone is flat, and by the range it begins 1.9 km off at every bearing. The proof: a ring laid at 0.85 of
          // the range (the plane's own mean over the frame is 0.83: as much far ground in frame as the plane gave)
          // gains next to nothing (over the site's, the mean of fifteen places of seeds 7 and 34: the plane 26 in a
          // hundred, that ring 24, the range 9). The price is counted too: the ground 1.9 to 4.1 km off toward the
          // frame's sides, olive by the plane, is the far tone now. On the lens's axis every value is what it was,
          // the near ground's too; off it the ground takes the haze of its own distance, and the far gate below is a
          // circle round the eye's foot where it was a line across the page. The map's bare ground must take the haze
          // as GROUND: inkHaze leaves bare paper bare (for the white birds), and lit ground far off would be a hole to
          // the sky. hzd is the haze worked once more with the ground's weight in the pink slot, only to open that gate:
          // its blue is the haze tone that bare ground settles to. It settles slowly (measured on the plates in the
          // second pass, noon: lit bare ground carries blue .06, .10 and .14 at 1.5, 3 and 5 km and prints L 90 to 91 with
          // its straw, while the olive beside it loses its yellow by the page's on/off between 1.9 and 2.8 km and is
          // the haze's blue from there): so far off the lit ground stood as cream patches and strips in a blue land,
          // read as shapes lying on water.
          // THE FAR GROUND IS ONE HAZED TONE (mend12, third pass). hzG is the share of a full yellow the page no longer
          // prints at this range (the press's haze law through the page's on/off: 0 to 1.9 km, 1 from 2.8 km; haze
          // hour 0.86 and 1.27 km): the gate at which the olive stops being olive. By the same gate the whole top of
          // the map (bare ground lit or turned, broom, the terraces' bands; not the rock, not the road's paper) takes
          // the olive's own hazed blue (.64 through the haze, as the olive beside it has there: one land, no patch and
          // no rim; the haze's own .22 would stand paler than the olive and leave the patches). Measured at noon, the
          // far land from the far sea at 3 and 5 km: dE 28 and 21 (the site's two tones together 32 and 23); haze hour
          // at 1.5, 3 and 5 km: 24, 19, 8 (the site's 28, 19, 8). (Those were mend12's, the distance by the axis. 12e,
          // on the climb's frames of seeds 7 and 4, land and sea taken in rings of range: noon at 1.5, 3 and 5 km 49,
          // 27 and 23 where the plane gave 48, 32 and 20, its 3 km ring holding olive toward the frame's sides; haze
          // hour 33, 22 and 10 for 33, 20 and 9.) Nearer than the gate every value is what it was (on the lens's
          // axis: BY THE RANGE, above). The shore's ruled line goes by the same gate: THE LINE GOES WITH THE HAZE in
          // the sea's shader.
          float rng = length(vWorld - cameraPosition);
          vec3 lk = inkShade(ink, lit, shadeK), hzd = inkHaze(vec3(bare, lk.g, 0.), rng);
          ink = inkHaze(lk, rng); ink.g = max(ink.g, hzd.g); shadeK = 0.;
          float hzG = clamp(rng / max(uHaze.x, 1.), 0., 1.); hzG = smoothstep(.42, .58, 1. - (1. - hzG) * (1. - hzG));
          ink.g = mix(ink.g, max(ink.g, mix(.64, uHaze.y, 1. - exp(-rng / max(uHaze.z, 1.)))), hzG * mapK * (1. - rock) * (1. - road));
          // THE STRAW SCREEN (mend12): the map's bare ground and the rock of the cliff under round dots of the YELLOW
          // plate at the blue screen's pitch (6 design px), 15 degrees: 60 from the blue's 75, which between two square
          // screens is 30, so the two beat at 11.6 design px (6 / (2 sin 15)): a rosette not quite two pitches across,
          // the same at every height and page size, no slower moire (on the line-screen edition the dots beat with
          // the lines, pitch 5, at 10 px). It is nailed to the page like the blue one and like the sky's gold screen. The
          // pink plate was not taken: its grain and its register slip tear a regular dot into specks (tried on the
          // page's law off line). The haze thins the dots at half the pace of other yellows, the pace the sea hazes at
          // (the ground of the page, as the sea is). Tone .38 is a measure of the print: with the dot's soft edge (.04)
          // and that haze it covers 24 in a hundred of the paper where the map begins (700 m off) and 20 at 1.5 km
          // (haze hour: 20 where the map begins), the fifth to a quarter of a light ground while it is near
          // enough to read; near, it prints L 89, straw, 14 dE from the paper, 56 from the shallows, 55 from the olive.
          // NO DOT ON GROUND THAT HAS GONE TO THE HAZE'S BLUE (second and third pass): on the bare ground and on the
          // rock the dots go out by the gate above (hzG): whole to 1.9 km, gone from 2.8 km (haze hour 0.86 and
          // 1.27 km). Nearer than the gate every value is what it was (on the lens's axis; the dots thin by the range).
          float straw = inkHaze(vec3(.38 * (bare + rock * (1. - strata * .92)) * (1. - hzG), 0., 0.), rng * .5).r;
          vec2 gq = mat2(.965926, .258819, -.258819, .965926) * (gl_FragCoord.xy / max(uPx, .25)) * (6.28318 / 6.);
          ink.b = max(ink.b, smoothstep(0., .08, straw - (.5 - .25 * (cos(gq.x) + cos(gq.y)))));`,
      });
      const m = new THREE.Mesh(g, mat); m.name = 'headland'; land.add(m);
    }
    await ctx.yield();

    // ---- scrub: wild olive and mastic domes, broom, thistle, dwarf fan palms (two instanced meshes, tossing in the wind)
    const uToss = { value: east ? 2.2 : 1 };
    const scrubMat = (extra = '', frag = '') => sty({
      uniforms: { uToss }, side: THREE.DoubleSide,
      vertexPre: 'attribute vec3 iInk; uniform float uToss; varying vec3 vLoc; varying vec2 vHome;',
      vertexMain: /* glsl */`
        vLoc = p; inkV = mix(iInk, vec3(0., 0., 0.), ink.x); vHome = instanceMatrix[3].xz;
        float ph = instanceMatrix[3].x * .21 + instanceMatrix[3].z * .17;
        float sway = sin(uTime * 1.7 + ph) + .5 * sin(uTime * 3.1 + ph * 1.7);
        p.xz += vec2(.07, .04) * sway * p.y * uToss; ${extra}`,
      fragmentPre: 'varying vec3 vLoc; varying vec2 vHome;',
      fragmentMain: /* glsl */`
        float lf = inkNoise(vLoc.xz * 5. + vWorld.xz * .7) ;
        ${frag}
        // a ragged clump, not a polygon: torn along its outline (where the face turns away from the lens) with a few gaps inside
        float rim = abs(dot(n, normalize(cameraPosition - vWorld)));
        if (inkNoise(vLoc.xy * 6. + vWorld.xz * 1.3 + vLoc.z * 4.) > .5 + rim * 1.5) discard;
        ink.g = clamp(ink.g + (lf - .5) * .5 - smoothstep(.72, .8, lf) * .5 * vLoc.y, 0., 1.);     // leaf gaps let the yellow through
        // the side away from the sun takes blue dots on the olive clumps (wild olive, mastic, palms: recipes with blue in
        // them, .35 and more); broom and thistle clumps (the design's flora; recipes with .12 of blue at most) take none of
        // it, so broom stays flat yellow and thistle pink grain but for the general shade (blue .3 to .55 low on the far flank)
        float away = (1. - smoothstep(-.5, .1, dot(n.xz, uSunDir.xz / max(length(uSunDir.xz), .2)))) * smoothstep(.15, .35, vInk.g);
        ink.g += (1. - ink.g) * away * (.3 + .2 * lf);
        ink.r = min(ink.r, .62);                                                             // thistle clumps: pink grain, never solid pink
        lit += (vLoc.y - .45) * .9; shadeK = .9;`,
    });
    {
      const G = new IG();                                              // a lumpy dome: 7 sides, two rings and a cap
      const S = 7, r0 = [], r1 = [];
      for (let i = 0; i < S; i++) { const a = i / S * TAU, j = 1 + 0.22 * Math.sin(i * 2.4); r0.push(G.v(Math.cos(a) * j, 0, Math.sin(a) * j, K_WHITE)); }
      for (let i = 0; i < S; i++) { const a = (i + 0.5) / S * TAU, j = 0.78 + 0.16 * Math.sin(i * 1.7 + 1); r1.push(G.v(Math.cos(a) * j, 0.58 + 0.1 * Math.sin(i * 3.1), Math.sin(a) * j, K_WHITE)); }
      const top = G.v(0.08, 0.9, -0.05, K_WHITE);
      for (let i = 0; i < S; i++) { const j = (i + 1) % S; G.tri(r0[i], r1[i], r0[j]); G.tri(r0[j], r1[i], r1[j]); G.tri(r1[i], top, r1[j]); }
      const domeGeo = G.build();
      const P2 = new IG();                                             // a dwarf fan palm: a rosette of bent blades
      for (let b = 0; b < 9; b++) {
        const a = b / 9 * TAU + (b % 2) * 0.2, el = 0.5 + 0.35 * ((b * 7) % 3) / 2, c = Math.cos(a), s = Math.sin(a), w = 0.16;
        const p0 = [0, 0.1, 0], p1 = [c * 0.6 * Math.cos(el), 0.6 * Math.sin(el) + 0.1, s * 0.6 * Math.cos(el)], p2 = [c * 1.15, 0.6 * Math.sin(el) - 0.05, s * 1.15];
        const A0 = P2.v(p0[0], p0[1], p0[2], K_WHITE), B0 = P2.v(p1[0] - s * w, p1[1], p1[2] + c * w, K_WHITE), B1 = P2.v(p1[0] + s * w, p1[1], p1[2] - c * w, K_WHITE), C0 = P2.v(p2[0], p2[1], p2[2], K_WHITE);
        P2.tri(A0, B0, B1); P2.tri(B0, C0, B1);
      }
      const palmGeo = P2.build();
      const NS = Math.round(2300 * lerp(0.6, 1, clamp((detail - 0.6) / 0.4, 0, 1)) * clamp(density, 0.85, 1.15)), NP = 260;
      const mk = (geo, n, mat) => { const im = new THREE.InstancedMesh(geo, mat, n); im.geometry.setAttribute('iInk', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)); im.frustumCulled = false; land.add(im); return im; };
      // a dome is torn in its own PLAN as well (seen from above, as on the lead-in, its outline is a ragged clump of lobes
      // and never the seven-sided polygon it is built from) and leaf gaps are knocked out of it whichever way it faces,
      // with flecks of bare yellow or paper beside them
      const domeFrag = /* glsl */`
        float rl = length(vLoc.xz); vec2 dr = vLoc.xz / max(rl, 1e-3);
        float edge = .8 + .34 * inkNoise(dr * 2.4 + vHome * .37) + .12 * inkNoise(dr * 8. + vHome * .9);   // (a bushy mass with a lobed edge: nothing is knocked out of its middle)
        if (rl > edge) discard;
        float gapN = inkNoise(vLoc.xz * 9. + vHome * 1.7 + vLoc.y * 3.);
        float fleck = max(smoothstep(.58, .64, lf) * step(gapN, .42), step(.72, gapN) * step(lf, .4));
        ink.g *= 1. - .9 * fleck; ink.r *= 1. - fleck; ink.b *= mix(1., step(.3, gapN), fleck);`;
      const domes = mk(domeGeo, NS, scrubMat('', domeFrag)), palms = mk(palmGeo, NP, scrubMat());
      const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
      const place = (im, n, palm) => {
        const ik = im.geometry.attributes.iInk.array;
        for (let i = 0; i < n; i++) {
          let x = 0, z = 0, t = 0, tries = 0;
          do {
            const nearBand = rng.chance(0.62);
            x = nearBand ? rng.range(-130, 190) : rng.range(-650, 700);
            t = nearBand ? 2 + 230 * Math.pow(rng(), 1.5) : 4 + 650 * rng();
            z = coastZ(x) - t; tries++;
          } while (tries < 6 && (noise.n2(x * 0.045 + 7, z * 0.045) < -0.25 || Math.hypot(x - TOWER.x, z - TOWER.z) < 6));
          const big = rng(), r = palm ? rng.range(1.0, 1.9) : Math.min(0.9 + 2.4 * big * big, Math.abs(x - 36) < 40 && z > -95 ? 2.9 : 9), hgt = palm ? r * rng.range(0.9, 1.3) : r * rng.range(0.7, 1.25);
          e.set(rng.range(-0.08, 0.08), rng() * TAU, rng.range(-0.08, 0.08)); q.setFromEuler(e);
          const kind = rng(), tiny = !palm && kind >= (spring ? 0.24 : 0.07) && kind < (spring ? 0.29 : 0.12) ? 0.38 : 1;
          M.compose(pv.set(x, hTop(x, z, t) - 0.15, z), q, sv.set(r * tiny, hgt * tiny, r * tiny * rng.range(0.8, 1.2))); im.setMatrixAt(i, M);
          const k = palm ? [0, rng.range(0.35, 0.6), 1] : kind < (spring ? 0.24 : 0.07) ? [0, rng.range(0, 0.12), 1] : kind < (spring ? 0.29 : 0.12) ? [rng.range(0.5, 0.9), 0.1, 0] : kind < 0.42 ? [0.25, 0.95, 1] : [0, rng.range(0.5, 0.82), 1];
          ik[i * 3] = k[0]; ik[i * 3 + 1] = k[1]; ik[i * 3 + 2] = k[2];
        }
        im.instanceMatrix.needsUpdate = true;
      };
      place(domes, NS, false); await ctx.yield(); place(palms, NP, true);
    }
    await ctx.yield();

    // ================================================================ LAND: watchtower, nest pair, lighthouse island, turbines
    // props: anything with a plain ink recipe. White faces take only a light dot in shade (they must stay paper).
    const propMat = sty({ side: THREE.DoubleSide, fragmentMain: 'float wh = 1. - max(vInk.r, max(vInk.g, vInk.b)); shadeK = mix(1., .42, wh);' });
    const props = new IG();
    {
      // the watchtower: battered round stone, a corbelled and broken parapet with a floor inside it. Solid plum; the
      // courses, joints and the slit window are knocked out of the plates in the fragment shader.
      const G = new IG(), S = 28, prof = [[0, 4.15], [0.9, 4.0], [1.0, 3.8], [4, 3.7], [8, 3.6], [11.6, 3.52], [11.9, 3.9], [12.5, 3.95]];
      const rings = prof.map((q) => { const ring = []; for (let i = 0; i < S; i++) { const a = i / S * TAU; ring.push(G.v(Math.cos(a) * q[1], q[0], Math.sin(a) * q[1], K_PLUM)); } return ring; });
      for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < S; i++) { const j = (i + 1) % S; G.quad(rings[k][i], rings[k + 1][i], rings[k + 1][j], rings[k][j]); }
      const topH = (i) => { const n = noise.n2(i * 0.9, 4.2); return 14 - (n < -0.25 ? 1.3 : 0) - (i % 4 === 3 ? 0.7 : 0) - (i > 19 && i < 24 ? 0.6 + 0.3 * (i % 2) : 0); };
      for (let i = 0; i < S; i++) {                                    // merlons: each its own flat-topped block, some fallen
        const a0 = i / S * TAU, a1 = (i + 1) / S * TAU, h = topH(i), ro = 3.95, ri = 3.3;
        const c = [[Math.cos(a0), Math.sin(a0)], [Math.cos(a1), Math.sin(a1)]];
        const v = (cc, r, y) => G.v(cc[0] * r, y, cc[1] * r, K_PLUM);
        G.quad(v(c[0], ro, 12.5), v(c[0], ro, h), v(c[1], ro, h), v(c[1], ro, 12.5));
        G.quad(v(c[1], ri, 12.5), v(c[1], ri, h), v(c[0], ri, h), v(c[0], ri, 12.5));
        G.quad(v(c[0], ro, h), v(c[0], ri, h), v(c[1], ri, h), v(c[1], ro, h));
        G.quad(v(c[0], ri, 12.5), v(c[0], ri, h), v(c[0], ro, h), v(c[0], ro, 12.5));
        G.quad(v(c[1], ro, 12.5), v(c[1], ro, h), v(c[1], ri, h), v(c[1], ri, 12.5));
      }
      { const c = G.v(0, 12.6, 0, K_PLUM), ring = []; for (let i = 0; i < S; i++) { const a = i / S * TAU; ring.push(G.v(Math.cos(a) * 3.3, 12.6, Math.sin(a) * 3.3, K_PLUM)); } for (let i = 0; i < S; i++) G.tri(c, ring[(i + 1) % S], ring[i]); }
      const towerMat = sty({
        vertexPre: 'varying vec3 vLoc;', vertexMain: 'vLoc = p;', fragmentPre: 'varying vec3 vLoc;', side: THREE.DoubleSide,
        fragmentMain: /* glsl */`
          float ang = atan(vLoc.z, abs(vLoc.x) + 1e-4), wall = step(abs(n.y), .6);
          float cy = vLoc.y / .62 + .08 * inkNoise(vLoc.xz * 2.), fy = max(fwidth(vLoc.y / .62), 1e-5), row = floor(cy);
          float ca = ang * 7. + mod(row, 2.) * .5 + .15 * inkHash(vec2(row, 3.)), fa = max(fwidth(ang * 7.), 1e-5);
          float lh = (1. - smoothstep(.045 + fy * .5, .045 + fy * 1.5, abs(fract(cy) - .5))) * (1. - smoothstep(.16, .5, fy));
          float lv = (1. - smoothstep(.03 + fa * .5, .03 + fa * 1.5, abs(fract(ca) - .5))) * (1. - smoothstep(.12, .4, fa)) * step(.1, abs(fract(cy) - .5));
          float slit = step(abs(ang - .35), .05) * step(abs(vLoc.y - 8.4), 1.1) * step(0., vLoc.x);
          float knock = max(max(lh, lv) * wall * step(vLoc.y, 12.4), slit);
          float sun = smoothstep(.05, .55, lit);
          ink = vec3(1. - sun * .4, 1. - sun * .1, 0.) * (1. - knock * .92);                  // lit stone is a paler violet, never grey
          ink.rg *= 1. - .25 * smoothstep(.55, .8, inkNoise(vLoc.xy * vec2(1.3, .5) + vLoc.z)) * sun;
          shadeK = 0.;`,
      });
      const tower = new THREE.Mesh(G.build(), towerMat); tower.position.set(TOWER.x, TOWER.y, TOWER.z); tower.name = 'watchtower'; land.add(tower);
      // the stick nest on the parapet floor
      const nx = TOWER.x - 0.5, ny = TOWER.y + 12.6, nz = TOWER.z - 0.3;
      lump(props, noise, nx, ny + 0.75, nz, 2.5, 1, 0.42, 0, 0.5, [0.75, 0.9, 0.35]);
      for (let i = 0; i < 26; i++) {
        const a = rng() * TAU, r = rng.range(1.2, 2.6), y = ny + rng.range(0.5, 1.5), l = rng.range(1.2, 2.4), a2 = a + rng.range(1.0, 2.1);
        tube(props, [[nx + Math.cos(a) * r, y, nz + Math.sin(a) * r, 0.05], [nx + Math.cos(a) * r + Math.cos(a2) * l, y + rng.range(-0.3, 0.5), nz + Math.sin(a) * r + Math.sin(a2) * l, 0.04]], 3, rng.chance(0.5) ? K_PLUM : [0.2, 0.7, 1], false);
      }
    }
    // the pair on the nest: body in the props mesh, neck + head + bill as its own mesh so the bill can be thrown back to clatter
    const nestPair = [];
    for (let b = 0; b < 2; b++) {
      const sc = 1.3, bx = TOWER.x - 0.5 + (b ? 0.95 : -0.75), by = TOWER.y + 13.75, bz = TOWER.z - 0.3 + (b ? 0.5 : -0.35), yaw = b ? 2.5 : -0.4;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), W = (x, y, z) => [bx + (x * cy + z * sy) * sc, by + y * sc, bz + (-x * sy + z * cy) * sc];
      const st = (arr) => arr.map((q) => { const p = W(q[0], q[1], q[2]); return [p[0], p[1], p[2], q[3] * sc]; });
      const bodyInk = [K_PLUM, K_PLUM, K_WHITE, K_WHITE, K_WHITE, K_WHITE];
      tube(props, st([[0, 0.5, -0.44, 0.03], [0, 0.52, -0.3, 0.1], [0, 0.6, -0.1, 0.15], [0, 0.7, 0.08, 0.15], [0, 0.8, 0.2, 0.1], [0, 0.86, 0.25, 0.05]]), 7, (k) => bodyInk[k]);
      for (const sx of [-1, 1]) {                                      // folded wings (plum flight feathers) and vermilion legs
        tube(props, st([[sx * 0.13, 0.74, 0.12, 0.05], [sx * 0.16, 0.62, -0.12, 0.085], [sx * 0.12, 0.5, -0.36, 0.06], [sx * 0.07, 0.44, -0.52, 0.02]]), 5, (k) => (k === 0 ? K_WHITE : K_PLUM));
        tube(props, st([[sx * 0.06, 0.5, -0.05, 0.03], [sx * 0.06, 0.24, -0.02, 0.026], [sx * 0.065, 0, -0.06, 0.026], [sx * 0.065, -0.01, 0.1, 0.02]]), 4, K_VERM);
      }
      const N = new IG();
      tube(N, [[0, 0, 0, 0.055], [0, 0.16, 0.035, 0.04], [0, 0.33, 0.045, 0.036], [0, 0.42, 0.06, 0.05], [0, 0.45, 0.11, 0.045], [0, 0.44, 0.15, 0.025]], 6, K_WHITE);
      tube(N, [[0, 0.44, 0.13, 0.03], [0, 0.42, 0.26, 0.022], [0, 0.39, 0.4, 0.006]], 5, K_VERM);
      const neck = new THREE.Mesh(N.build(), propMat); const p = W(0, 0.84, 0.23);
      neck.position.set(p[0], p[1], p[2]); neck.scale.setScalar(sc); neck.rotation.order = 'YXZ'; neck.rotation.y = yaw; land.add(neck);
      nestPair.push({ neck, seed: b * 0.37 + 0.2 });
    }
    // the lighthouse on its low island off the point (LIGHT), its keeper's house beside it; the bare skerry (ISLE) and the
    // rock awash (ISLET) are the same rock, turned and scaled
    {
      const ix = LIGHT[0], iz = LIGHT[1];
      {
        const I = new IG(); lump(I, noise, 0, 0, 0, 1, 2, 0.2, 0, 0.55, [0, 0.42, 0.8]); const rock = I.build();
        const m = new THREE.Mesh(rock, propMat); m.position.set(ix, SEA_Y - 2, iz); m.scale.set(31, 44, 52); m.rotation.y = 0.2; land.add(m);
        const m2 = new THREE.Mesh(rock, propMat); m2.position.set(ISLE[0], SEA_Y - 2, ISLE[1]); m2.scale.set(36, 40, 54); m2.rotation.y = 1.3; land.add(m2);
        const m3 = new THREE.Mesh(rock, propMat); m3.position.set(ISLET[0], SEA_Y - 1.5, ISLET[1]); m3.scale.set(11, 17, 15); m3.rotation.y = 2.4; land.add(m3);
      }
      const band = [K_WHITE, K_WHITE, K_VERM, K_VERM, K_WHITE, K_WHITE, K_PLUM, K_PLUM];
      tube(props, [[ix, SEA_Y + 4, iz, 4.2], [ix, SEA_Y + 9, iz, 3.2], [ix, SEA_Y + 9.1, iz, 3.2], [ix, SEA_Y + 17, iz, 2.8], [ix, SEA_Y + 17.1, iz, 2.8], [ix, SEA_Y + 26, iz, 2.4], [ix, SEA_Y + 26.1, iz, 3.1], [ix, SEA_Y + 30, iz, 2.2]], 10, (k) => band[k]);
      box(props, ix + 9, SEA_Y + 4, iz - 6, 10, 4, 7, K_WHITE, 0.4); box(props, ix + 9, SEA_Y + 8, iz - 6, 10.5, 2.2, 7.5, K_VERM, 0.4, [0.1, 1]);
    }
    // THE WHITE VILLAGE, 600 to 800 m north of the point on both sides of the road: forty-two paper-white houses (drawn half
    // as big again as life, so the cluster reads from the kettle) under vermilion roofs, and a church with a square tower
    // and a plum cap. Its own generator: no draw from ctx.rng. The terraces and the road are in the land's shader.
    // THE UPPER HAMLET (HAMLET): twenty-six more houses and a chapel on the same road 1.73 to 1.99 km north, in the hills
    // beyond the turbines (a generator of its own). Both are one mesh of their own. A house has its own size in metres
    // (as built: half as big again as life); only THE RANGE RULE the ships have (FAR_ALT, FAR_HOLD) is laid on it: from
    // high in the climb a house further off than 1.7 km grows about its own doorstep so as to hold its 1.7 km size.
    {
      const vill = new IG();
      const vg = makeRng('stork-kettle-village:' + (ctx.seed ?? 0));
      const yawAt = (q) => Math.atan2(roadX(q + 4) - roadX(q - 4), -8);
      const house = (x, y, z, sx, sy, sz, yaw, roofH) => {
        const ex = [x, y, z, Math.max(sx, sz)];
        box(vill, x, y, z, sx, sy, sz, K_WHITE, yaw, [1, 1], ex); box(vill, x, y + sy, z, sx * 1.06, roofH, sz * 1.06, K_VERM, yaw, [0.12, 1], ex);
      };
      for (let i = 0; i < 42; i++) {
        const q = 605 + 190 * vg(), side = i % 2 ? 1 : -1, off = 11 + 52 * vg() * vg(), x = roadX(q) + side * off, z = -q;
        const sx = vg.range(9, 15), sz = vg.range(8, 12), sy = vg.range(5.5, 9), yaw = yawAt(q) + vg.range(-0.25, 0.25) + (vg() < 0.3 ? Math.PI / 2 : 0), y = hAt(x, z) - 0.8;
        house(x, y, z, sx, sy, sz, yaw, 2.8);
      }
      const church = (cq, dx, nave, towerH) => {
        const cx = roadX(cq) + dx, cz = -cq, cy = hAt(cx, cz) - 0.8, cyaw = yawAt(cq), ex = [cx, cy, cz, nave];
        box(vill, cx, cy, cz, 13, 15, nave, K_WHITE, cyaw, [1, 1], ex); box(vill, cx, cy + 15, cz, 13.6, 4.5, nave + 0.6, K_VERM, cyaw, [0.1, 1], ex);
        box(vill, cx + 14 * Math.cos(cyaw), cy, cz - 14 * Math.sin(cyaw), 8.5, towerH, 8.5, K_WHITE, cyaw, [1, 1], ex); box(vill, cx + 14 * Math.cos(cyaw), cy + towerH, cz - 14 * Math.sin(cyaw), 9.2, 8, 9.2, K_PLUM, cyaw, [0.06, 0.06], ex);
      };
      church(700, -24, 24, 31);
      const hg = makeRng(ctx.core.hashSeed('stork-kettle-hamlet:' + (ctx.seed ?? 0)));
      for (let i = 0; i < 26; i++) {
        const q = 1730 + 260 * hg(), side = i % 2 ? 1 : -1, off = 12 + 62 * hg() * hg(), x = roadX(q) + side * off, z = -q;
        const sx = hg.range(9, 15), sz = hg.range(8, 12), sy = hg.range(5.5, 9), yaw = yawAt(q) + hg.range(-0.25, 0.25) + (hg() < 0.3 ? Math.PI / 2 : 0), y = hAt(x, z) - 0.8;
        house(x, y, z, sx, sy, sz, yaw, 2.8);
      }
      church(1850, 26, 18, 22);
      const villMat = sty({
        side: THREE.DoubleSide, uniforms: { uAlt: hero.uniforms.uAlt }, vertexPre: 'attribute vec4 aX; uniform float uAlt;',
        vertexMain: /* glsl */`
          float hd = max(length((modelMatrix * vec4(aX.xyz, 1.)).xyz - cameraPosition), 1.);
          float farK = smoothstep(${FAR_ALT[0].toFixed(1)}, ${FAR_ALT[1].toFixed(1)}, uAlt), hk = mix(1., max(1., hd / ${FAR_HOLD.toFixed(1)}), farK);   // the range rule (see FAR_HOLD)
          p = aX.xyz + (p - aX.xyz) * vec3(hk, hk * mix(1., 1.5, farK * smoothstep(${FAR_HOLD.toFixed(1)}, ${(2 * FAR_HOLD).toFixed(1)}, hd)), hk);`,
        fragmentMain: 'float wh = 1. - max(vInk.r, max(vInk.g, vInk.b)); shadeK = mix(1., .42, wh);',
      });
      const vm = new THREE.Mesh(vill.build('aX'), villMat); vm.frustumCulled = false; vm.name = 'village'; land.add(vm);
    }
    await ctx.yield();
    // fourteen white turbines on a ridge 1.5 km north: towers in props, blades as ribbons turned in the vertex shader
    const blades = new IG();
    for (let i = 0; i < 14; i++) {
      const x = -940 + i * 145 + rng.range(-30, 30), z = -1500 + 130 * noise.n2(i * 0.6, 1.5) - Math.abs(i - 6.5) * 22, y = hAt(x, z) - 2, hub = 92;
      tube(props, [[x, y, z, 4.6], [x, y + hub * 0.5, z, 3.6], [x, y + hub, z, 2.8]], 6, K_WHITE);
      box(props, x + 3, y + hub - 3, z, 14, 6, 6, K_WHITE);
      const a0 = rng() * TAU;
      for (let b = 0; b < 3; b++) for (let k = 0; k < 3; k++) {
        const ra = k * 17, rb = (k + 1) * 17, wa = 6 - k * 1.4, wb = 6 - (k + 1) * 1.4, ang = a0 + b * TAU / 3, hp = [x + 11, y + hub, z];
        const v = (r, c) => blades.v(hp[0], hp[1], hp[2], K_WHITE, 1, 0, 0, [r, c, ang, 0.8 + 0.4 * ((i * 7) % 5) / 5]);
        blades.quad(v(ra, -wa / 2), v(rb, -wb / 2), v(rb, wb / 2), v(ra, wa / 2));
      }
    }
    {
      const mat = sty({
        side: THREE.DoubleSide, uniforms: { uBufH: hero.uniforms.uBufH, uSpin: { value: east ? 1.5 : 0.75 } },
        vertexPre: 'attribute vec4 aX; uniform float uBufH, uSpin;',
        vertexMain: /* glsl */`
          float a = aX.z + uTime * uSpin * aX.w, dist = max(length((modelMatrix * vec4(p, 1.)).xyz - cameraPosition), 1.);
          float c = aX.y * max(1., 2.4 * dist / max(projectionMatrix[1][1] * uBufH * .5 * 5., 1e-3));     // never thinner than 2.4 px
          p += vec3(0., aX.x * cos(a) - c * sin(a), aX.x * sin(a) + c * cos(a));`,
        fragmentMain: 'shadeK = .25;',
      });
      const m = new THREE.Mesh(blades.build('aX'), mat); m.frustumCulled = false; land.add(m);
    }
    await ctx.yield();

    // ================================================================ STRAIT: nine ships
    // Hulls vermilion or plum, upperworks paper. Positions are advanced in update(); their wakes are drawn by the sea.
    const shipGeo = (kind, hullInk, seed) => {
      const G = new IG(), big = kind < 2, L = kind === 2 ? 110 : kind === 3 ? 26 : kind === 0 ? 285 : 300, B = kind === 2 ? 26 : kind === 3 ? 8 : 50, F = kind === 2 ? 9 : kind === 3 ? 3 : 15;
      const NS = 12, port = [], stbd = [], prof = (f) => (f < 0.08 ? 0.82 + f * 2.2 : f < 0.72 ? 1 : Math.max(0.03, Math.cos((f - 0.72) / 0.28 * Math.PI / 2)));
      const deckInk = kind === 2 ? K_WHITE : kind === 0 ? [0.55, 0, 1] : [hullInk[0] * 0.5, 0.25, hullInk[2]];
      for (let k = 0; k <= NS; k++) {
        const f = k / NS, z = (f - 0.5) * L, hw = B / 2 * prof(f), sheer = F + (f > 0.8 ? (f - 0.8) * F * 1.4 : 0);
        port.push([G.v(-hw * 0.8, -2, z, hullInk), G.v(-hw, sheer, z, hullInk), G.v(-hw, sheer, z, deckInk)]);
        stbd.push([G.v(hw * 0.8, -2, z, hullInk), G.v(hw, sheer, z, hullInk), G.v(hw, sheer, z, deckInk)]);
      }
      for (let k = 0; k < NS; k++) {
        G.quad(port[k][0], port[k][1], port[k + 1][1], port[k + 1][0]); G.quad(stbd[k + 1][0], stbd[k + 1][1], stbd[k][1], stbd[k][0]);
        G.quad(port[k][2], stbd[k][2], stbd[k + 1][2], port[k + 1][2]);
      }
      G.quad(stbd[0][0], stbd[0][1], port[0][1], port[0][0]);
      const r = (a, b) => a + (b - a) * (((seed = (seed * 16807) % 2147483647) & 0xffff) / 0xffff);
      if (kind === 0) {                                                // tanker: pipe runs, a catwalk, the white house aft
        for (const sx of [-0.2, 0, 0.2]) box(G, sx * B, F, L * 0.05, 2.2, 2.4, L * 0.66, K_WHITE);
        for (let i = 0; i < 6; i++) box(G, 0, F, -L * 0.24 + i * L * 0.11, B * 0.8, 3.2, 3, K_WHITE);
        box(G, 0, F, -L * 0.39, B * 0.7, 30, 24, K_WHITE); box(G, 0, F + 30, -L * 0.385, B * 0.96, 5, 12, K_WHITE);
        box(G, 0, F + 30, -L * 0.43, 9, 15, 11, hullInk, 0, [0.8, 0.8]);
      } else if (kind === 1) {                                         // container ship: bays stacked in every ink the press has
        const inks = [K_PINK, K_YEL, K_BLUE, K_VERM, K_PLUM, K_WHITE, [0, 0.62, 1], K_YEL, K_VERM];
        for (let i = 0; i < 13; i++) {
          if (i === 3) continue;
          const z = -L * 0.4 + i * L * 0.063;
          for (const sx of [-1, 0, 1]) box(G, sx * B * 0.3, F, z, B * 0.28, r(9, 21), L * 0.052, inks[Math.floor(r(0, 8.99))]);
        }
        box(G, 0, F, -L * 0.4 + 3 * L * 0.063, B * 0.9, 38, 13, K_WHITE); box(G, 0, F + 38, -L * 0.4 + 3 * L * 0.063, B * 1.02, 5, 9, K_WHITE);
        box(G, 0, F, -L * 0.455, 9, 34, 9, hullInk, 0, [0.8, 0.8]);
      } else if (kind === 2) {                                         // fast ferry: all white upperworks, a blue window band, a raked funnel
        box(G, 0, F, -2, B * 0.9, 7, L * 0.74, K_WHITE, 0, [0.96, 0.93]); box(G, 0, F + 7, -2, B * 0.9, 1.6, L * 0.7, K_BLUE, 0, [1, 1]);
        box(G, 0, F + 8.6, -4, B * 0.8, 6, L * 0.56, K_WHITE, 0, [0.9, 0.9]); box(G, 0, F + 14.6, 12, B * 0.6, 4, 16, K_WHITE, 0, [0.8, 0.7]);
        box(G, 0, F + 14.6, -22, 9, 9, 14, K_VERM, 0, [0.7, 0.6]);
      } else {                                                         // the fishing boat: wheelhouse, mast, gantry
        box(G, 0, F, 2, B * 0.6, 4, 7, K_WHITE); box(G, 0, F + 4, 2.5, B * 0.5, 0.8, 5, K_PLUM);
        tube(G, [[0, F, -3, 0.35], [0, F + 11, -3.5, 0.25]], 4, K_PLUM); tube(G, [[0, F + 7, -3, 0.25], [0, F + 3, -11, 0.2]], 4, K_PLUM);
        box(G, 0, F, -8, B * 0.7, 1.6, 5, K_YEL);
      }
      return G.build();
    };
    // kind (0 tanker, 1 container, 2 ferry, 3 boat), hull ink, start x, z, heading (x, z), speed m/s, wake length
    // THE NINE SHIPS all sail fixed lanes by the WORLD clock (none is keyed to the flight), each from a seeded place along
    // its lane (HEADWAY, the strait's own generator). Two lanes of big ships 1 to 2.7 km out: a vermilion tanker and a
    // plum container ship westbound (the tanker passes 1 km off the lighthouse, dead ahead on the lead-in), a plum tanker
    // and a vermilion container ship eastbound. Three fast ferries cut across them, their wakes broad strokes 2 km and
    // more long (the wake belongs to the kind of ship: see the sea): one stands out of the western bay southbound, one
    // runs north INTO the western bay, one crosses eastward 5 km out. A second vermilion tanker goes west 6.2 km out, so
    // the band of sea under the far coast (the last approach looks due south over it from 1,400 m) holds a hull and two
    // long wakes. The fishing boat works round the south-east skerry, gulls behind it (see BOAT below).
    // Seen from high in the climb a ship far out is drawn larger (update: it holds its size on the page beyond 1.7 km).
    const shipMat = sty({ side: THREE.DoubleSide, haze: false, fragmentMain: /* glsl */`
      float wh = 1. - max(vInk.r, max(vInk.g, vInk.b));
      ink = inkShade(ink, lit, mix(1., .42, wh)); ink = inkHaze(ink, vDepth * .15); shadeK = 0.;` });
    const sr = makeRng('stork-kettle-strait:' + (ctx.seed ?? 0));       // the strait's own generator (headways, the cloud street): no draw from ctx.rng
    // THE FISHING BOAT works round the south-east skerry (ISLE). Her seat stands at a bearing and a range (150 to 400 m)
    // from the rock and she steers a heading of her own, all three from her own generator ('fishing-boat:' + seed: no draw
    // from any other stream). HER BEAT is the straight line through the seat on that heading, BOAT_BEAT metres long;
    // where on it the clock finds her is her HEADWAY (the strait's generator, as every ship's: anywhere on the whole
    // beat), and she makes her BOAT_V m/s along it on the world clock. Seat and heading are drawn again until the whole
    // beat, and two minutes' sailing beyond it, keeps sea room: 60 m off the cliff's foot, 90 m off the skerry, 100 m off
    // the lighthouse island, 50 m off the rock awash and 120 m inshore of the tanker's lane (z 1,000).
    const BOAT_BEAT = 400, BOAT_V = 4;
    const BOAT = (() => {
      const fb = makeRng(ctx.core.hashSeed('fishing-boat:' + (ctx.seed ?? 0)));
      const room = (x, z) => z > coastZ(x) + 60 && z < 880 && Math.hypot(x - ISLE[0], z - ISLE[1]) > 90 && Math.hypot(x - LIGHT[0], z - LIGHT[1]) > 100 && Math.hypot(x - ISLET[0], z - ISLET[1]) > 50;
      let q = null;
      for (let n = 0; n < 60; n++) {
        const be = fb() * TAU, ra = fb.range(150, 400), hd = fb() * TAU, x = ISLE[0] + Math.sin(be) * ra, z = ISLE[1] + Math.cos(be) * ra, dx = Math.sin(hd), dz = Math.cos(hd);
        let ok = true; for (let m = -BOAT_BEAT / 2; m <= BOAT_BEAT / 2 + BOAT_V * 120 && ok; m += 20) ok = room(x + dx * m, z + dz * m);
        q = [x, z, dx, dz]; if (ok) break;
      }
      return q;
    })();
    const SHIPS = [
      [0, K_VERM, 150, 1000, -1, 0.03, 13, 2400], [1, K_PLUM, -900, 1550, -1, -0.02, 15, 2600], [0, K_PLUM, -1700, 2350, 1, 0.02, 12, 2400],
      [1, K_VERM, 1900, 2700, 1, -0.03, 15, 2600], [0, K_VERM, 1800, 6200, -1, 0.04, 13, 3800],
      [2, K_PLUM, -900, 450, 0.2, 0.98, 22, 2200], [2, K_PLUM, -1100, 2300, -0.2, -0.98, 24, 2200], [2, K_PLUM, -2100, 5000, 1, -0.1, 24, 3400],
      [3, K_VERM, BOAT[0], BOAT[1], BOAT[2], BOAT[3], BOAT_V, 130],
    ].map((s, i) => {
      const mesh = new THREE.Mesh(shipGeo(s[0], s[1], 977 + i * 131), shipMat), l = Math.hypot(s[4], s[5]);
      mesh.rotation.y = Math.atan2(s[4], s[5]); strait.add(mesh);
      const L = s[0] === 2 ? 110 : s[0] === 3 ? 26 : s[0] === 0 ? 285 : 300, B = s[0] === 2 ? 26 : s[0] === 3 ? 8 : 50;
      const head = sr.range(-1, 1) * (s[0] === 2 ? 320 : s[0] === 3 ? BOAT_BEAT / 2 : 220);   // HEADWAY: metres on or back along its lane at clock 0 (the boat: anywhere on her beat)
      const x0 = s[2] + s[4] / l * head, z0 = s[3] + s[5] / l * head;
      uShipB.value[i].set(L, s[7], B, s[0] === 3 ? 0.6 : s[0] === 2 ? 2 : 1); uShip.value[i].set(x0, z0, s[4] / l, s[5] / l);
      return { mesh, x: x0, z: z0, dx: s[4] / l, dz: s[5] / l, v: s[6] };
    });
    await ctx.yield();

    // ================================================================ STRAIT: the far continent (three pale steps) and far kettles
    {
      const G = new IG(), tones = haze ? [0.07, 0.04, 0.02] : [0.72, 0.5, 0.33], foot = haze ? [0.5, 0.75, 0.75] : [0.32, 0.42, 0.5];   // dark crest, hazy foot
      [[11400, 800, 0.9], [12500, 1400, 0.55], [13700, 2000, 0.33]].forEach((q, ri) => {
        const NXF = 110, top = [], bot = [];
        for (let i = 0; i <= NXF; i++) {
          const x = (i / NXF - 0.5) * 22000, edge = 1 - smoothstep(6500, 10800, Math.abs(x));
          const rdg = 1 - Math.abs(noise.fbm2(x * 0.00016 * (1 + ri * 0.4) + ri * 9, ri * 3.1, 4));
          const h = q[1] * (0.28 + 0.72 * rdg * rdg) * (0.55 + 0.45 * smoothstep(-0.5, 0.4, noise.n2(x * 0.00007 + ri * 4, 2))) * (0.4 + 0.6 * edge);
          const z = q[0] - 0.000012 * x * x, t = tones[ri] * (0.7 + 0.3 * edge);
          top.push(G.v(x, SEA_Y + h, z, [0, t, 0], 0, 0, -1)); bot.push(G.v(x, SEA_Y - 4, z, [0, t * foot[ri], 0], 0, 0, -1));
        }
        for (let i = 0; i < NXF; i++) G.quad(bot[i], bot[i + 1], top[i + 1], top[i]);
      });
      const m = new THREE.Mesh(G.build(), sty({ haze: false, side: THREE.DoubleSide, fragmentMain: 'lit = 1.; shadeK = 0.;' })); m.frustumCulled = false; strait.add(m);
    }
    // FAR KETTLES: two over the hills behind the headland, three on the far coast, each under its own cumulus. Each is a
    // KETTLE and not a smudge: a column of dots that narrows into the flat base of its cloud and thins there, with one
    // cell in five on the side toward the lens holding a bird mark four dots wide (a plum gull-wing V with a body).
    const FARK = [[-2700, -800], [3300, -1500], [2100, 9300], [-3600, 10200], [5600, 9800]];
    {
      const G = new IG(), leanK = Math.tan(hero.mood.leanDeg * D2R);
      FARK.forEach((k, ki) => {
        const base = k[1] < 0 ? hAt(k[0], k[1]) : SEA_Y, cs = Math.max(16, Math.hypot(k[0], k[1]) * 0.011), S = 16, rows = 7, ring = [], wide = Math.max(1, Math.hypot(k[0], k[1]) / 4500);
        for (let r = 0; r <= rows; r++) {
          const f = r / rows, y = lerp(base + 20, H, f), rad = 118 * wide * lerp(0.4, 1, smoothstep(0, 0.45, f)) * lerp(1, 0.6, smoothstep(0.62, 1, f));
          const row = [];
          for (let i = 0; i <= S; i++) { const a = i / S * TAU; row.push(G.v(k[0] + Math.cos(a) * rad - leanK * (y - base), y, k[1] + Math.sin(a) * rad, K_PLUM, Math.cos(a), 0, Math.sin(a), [i / S, cs, ki * 3.7 + 1, f])); }
          ring.push(row);
        }
        for (let r = 0; r < rows; r++) for (let i = 0; i < S; i++) G.quad(ring[r][i], ring[r][i + 1], ring[r + 1][i + 1], ring[r + 1][i]);
      });
      const mat = sty({
        haze: false, side: THREE.DoubleSide, uniforms: { uFar: { value: haze ? 0.75 : 1 } },
        vertexPre: 'attribute vec4 aX; varying vec4 vX; varying float vLy;', vertexMain: 'vX = aX; vLy = p.y;',
        fragmentPre: 'varying vec4 vX; varying float vLy; uniform float uFar;',
        fragmentMain: /* glsl */`
          float cs = max(vX.y, 1.);                                             // one bird to a cell of the page, never finer than the screen
          vec2 uv = vec2(vX.x * 740. / cs + uTime * 9. / cs, vLy / cs * 1.15); uv.y += uv.x * .22;
          vec2 ci = floor(uv), cf = fract(uv) - .5;
          float h1 = inkHash(ci + vX.z * 13.);
          float flip = step(0., sin(vX.x * 6.28318 + uTime * .39 - vLy * .012 + h1 * 2.5));   // the glitter wave climbs these too
          // the bird marks: cells four dots wide on the near side of the column
          vec2 bu = uv * .25 + vX.z, bi = floor(bu), bf = fract(bu) - .5;
          float nearSide = step(0., dot(vNormal.xz, cameraPosition.xz - vWorld.xz)), bh = inkHash(bi + 3.1);
          float markCell = step(.8, bh) * nearSide * step(vX.w, .86);
          float wing = abs(bf.y + .06 - .42 * abs(bf.x)), mark = max(step(wing, .085) * step(abs(bf.x), .4), step(abs(bf.x), .06) * step(abs(bf.y - .02), .2));
          if (markCell > .5) { if (mark < .5) discard; ink = vec3(1., 1., 0.) * uFar; }
          else {
            if (h1 < .5 + .36 * smoothstep(.7, 1., vX.w) || length(cf + (vec2(inkHash(ci + 5.), inkHash(ci + 9.)) - .5) * .3) > .36) discard;
            ink = vec3(.5, .78, 0.) * mix(.25, 1., flip) * uFar * (1. - .3 * vX.w);
          }
          lit = 1.; shadeK = 0.;`,
      });
      const m = new THREE.Mesh(G.build('aX'), mat); m.frustumCulled = false; strait.add(m);
    }
    await ctx.yield();

    // ================================================================ CLOUDS
    // the hero cloud's base: a polar plate over the thermal, dimpled upward only (so nothing hangs into the flight), with a
    // deep calm dimple over the seat for the ring; plum-blue: 65 percent blue under pink grain. The rim curls up into paper.
    const seatL = seat.position;
    const cloudMat = sty({
      fragmentMain: /* glsl */`
        float under = (1. - smoothstep(-.8, -.25, n.y));
        // the flat-yellow lining on the turning edge is a soft, broken rim (dabs several pixels deep) and never a ruled line:
        // where the turning band would print thinner than about four pixels, or lies along the cloud's outline, it is left out
        float turn = smoothstep(-.02, .16, lit) * (1. - smoothstep(.3, .6, lit));
        float deep = (1. - smoothstep(.06, .16, fwidth(lit)));
        float dab = smoothstep(.3, .55, inkNoise(vWorld.xz * .007) * .65 + inkNoise(vWorld.xz * .028 + 7.) * .35);
        // (and only clouds out over the strait carry it: those over the land are passed under their flat bases, where the
        // lining would print as a dashed line along the base)
        float facing = smoothstep(.16, .42, abs(dot(n, normalize(cameraPosition - vWorld)))) * smoothstep(150., 600., vWorld.z);
        ink = vec3(under * .42, under * .62, turn * (1. - under) * deep * dab * facing);
        shadeK = .8 * (1. - under);`,
    });
    {
      const NRg = 54, NSg = 96, P = new Float32Array((NRg + 1) * NSg * 3), I = [];
      for (let r = 0; r <= NRg; r++) {
        const rad = 640 * Math.pow(r / NRg, 1.75);
        for (let s = 0; s < NSg; s++) {
          const a = s / NSg * TAU, x = Math.cos(a) * rad * 1.12 - 60, z = Math.sin(a) * rad, o = (r * NSg + s) * 3;
          const ds = Math.hypot(x - seatL.x, z - seatL.z), curl = Math.max(rad - 450, 0) / 190;
          P[o] = x; P[o + 2] = z;
          P[o + 1] = H + 9 * smoothstep(-0.2, 0.7, noise.n2(x * 0.021, z * 0.021)) + 11 * (0.5 + 0.5 * noise.n2(x * 0.006, z * 0.006)) * smoothstep(20, 90, ds)
            + 24 * Math.exp(-(ds * ds) / (30 * 30)) + curl * curl * 150;
        }
        if (r % 18 === 0) await ctx.yield();
      }
      for (let r = 0; r < NRg; r++) for (let s = 0; s < NSg; s++) { const a = r * NSg + s, b = r * NSg + (s + 1) % NSg, c = a + NSg, d = b + NSg; I.push(a, c, d, a, d, b); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('ink', new THREE.BufferAttribute(new Float32Array(P.length), 3)); g.setIndex(I); g.computeVertexNormals();
      const mat = sty({
        side: THREE.DoubleSide, uniforms: { uSeat: { value: new THREE.Vector2(seatL.x, seatL.z + 170) } },
        vertexPre: 'varying vec3 vLoc;', vertexMain: 'vLoc = p;', fragmentPre: 'varying vec3 vLoc; uniform vec2 uSeat;',
        fragmentMain: /* glsl */`
          vec2 w = vLoc.xz;
          float dn = inkNoise(w * .028 + uTime * .012) * .6 + inkNoise(w * .1 - uTime * .025) * .4;       // the base breathes
          float up = clamp((vLoc.y - ${H.toFixed(1)}) / 24., 0., 1.4);
          float ringD = length(w - uSeat), calm = 1. - smoothstep(150., 330., ringD);   // calm and dark over the last straight and far beyond the ring
          float b = .56 + .2 * up + (dn - .5) * .26 * (1. - calm) + .14 * calm;
          float pk = .26 + .34 * smoothstep(.15, .9, up) + (dn - .5) * .34 * (1. - calm) + .22 * calm;
          float scud = smoothstep(.66, .76, inkNoise(w * vec2(.012, .05) + vec2(uTime * .03, 0.)) * .6 + dn * .4) * (1. - calm);   // scud ribbons: paler streaks
          float rim = smoothstep(430., 640., length((w + vec2(60., 0.)) * vec2(.89, 1.)) + 60. * inkNoise(w * .006));
          ink = vec3(pk * (1. - scud * .4) * (1. - rim), b * (1. - scud * .24) * (1. - rim * .9), smoothstep(.5, .7, rim) * (1. - smoothstep(.86, .97, rim)));
          lit = 1.; shadeK = 0.;`,
      });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'cloud-base'; clouds.add(m);
    }
    await ctx.yield();
    {
      // rim lobes of the tower, fourteen small cumuli with level bases along both coasts, one over each far kettle
      const G = new IG();
      for (let i = 0; i < 15; i++) {
        const a = i / 15 * TAU + rng.range(-0.1, 0.1), rr = rng.range(175, 260);
        lump(G, noise, Math.cos(a) * 610 * 1.12 - 60, H + rr * 0.62 + rng.range(0, 60), Math.sin(a) * 610, rr, 2, 0.8, 0, 0.35, K_WHITE);
        if (i % 5 === 0) await ctx.yield();
      }
      const spots = [];
      for (let i = 0; i < 7; i++) spots.push([east ? -6000 + i * 1900 : rng.range(-6500, 6500), east ? -1900 - (i % 2) * 900 : rng.range(-3200, -1300)]);
      for (let i = 0; i < 7; i++) spots.push([east ? -6300 + i * 2000 : rng.range(-7000, 7000), east ? 10400 + (i % 2) * 1100 : rng.range(9800, 12400)]);
      for (const k of FARK) spots.push([k[0] - 80, k[1], 1]);
      // A STREET OF LOW CUMULI over the west of the strait: six clouds on a line that runs from 3 km west of the point out
      // toward the far coast, their flat bases stepping up from about 620 m at the near end to 1,120 m at the far end
      // (each a little on or back, higher or lower, larger or smaller by the strait's own generator: no draw from ctx.rng).
      // The climb rises past them one after another: first they stand in the sky over the strait, then on the far
      // coast, then below the horizon with their paper tops turned to the lens.
      for (let i = 0; i < 6; i++) {
        const t = (i + sr.range(-0.3, 0.3)) / 5, cx = -3000 + 1800 * t + sr.range(-260, 260), cz = 300 + 4900 * t, r = 230 + 150 * t + sr.range(-30, 40);
        const cy = 620 + 500 * t + sr.range(-45, 45) + r * 0.1, e1 = sr.range(0.6, 0.9), e2 = sr.range(0.6, 0.9);
        lump(G, noise, cx, cy, cz, r, 2, 0.6, 0.1, 0.4, K_WHITE);
        lump(G, noise, cx + r * e1, cy - r * 0.02, cz + r * 0.2, r * 0.62, 1, 0.6, 0.13, 0.4, K_WHITE);
        lump(G, noise, cx - r * e2, cy - r * 0.03, cz - r * 0.25, r * 0.54, 1, 0.62, 0.14, 0.4, K_WHITE);
      }
      await ctx.yield();
      let ci = 0;
      for (const sp of spots) {
        const r = sp[2] ? rng.range(330, 420) : rng.range(300, 620), cy = H + r * 0.1;
        lump(G, noise, sp[0], cy, sp[1], r, 2, rng.range(0.55, 0.8), 0.1, 0.4, K_WHITE);
        lump(G, noise, sp[0] + r * rng.range(0.6, 0.9), cy, sp[1] + r * rng.range(-0.3, 0.3), r * 0.62, 1, 0.6, 0.16, 0.4, K_WHITE);
        lump(G, noise, sp[0] - r * rng.range(0.6, 0.9), cy, sp[1] + r * rng.range(-0.3, 0.3), r * 0.55, 1, 0.62, 0.18, 0.4, K_WHITE);
        if (++ci % 4 === 0) await ctx.yield();
      }
      const m = new THREE.Mesh(G.build(), cloudMat); m.frustumCulled = false; clouds.add(m);
    }
    // scud: twelve thin ribbons of cloud streaming back past the last straight and on beyond the ring. Each lies PARALLEL to the flight line and drifts
    // along it, so its distance from the line never changes; homes are in root-local space, hand-placed round the line
    // (metres back from the ring, bearing round the line: 0 right, 90 up, 180 left, 270 down, distance from the line): to the
    // right and below, 15 m and more from the lens and well outside the ring's disc; the upper left is the departing file's.
    const scud = [], scudF = new THREE.Vector3();
    let scudMesh;
    {
      const G = new IG(); lump(G, noise, 0, 0, 0, 1, 1, 0.45, 0, 0.5, K_WHITE);
      // ... and twenty near shreds strung along the straight, 8.6 to 9.4 m from the line, low on either side: torn strips
      // in the cloud's shade, each of which condenses 25 m ahead and slides out past a lower corner of the page at arm's
      // length over the strait (about three in view at any moment)
      const SC = [[70, -35, 21], [62, 48, 23], [54, 250, 22], [46, 300, 24], [38, -50, 19], [30, 235, 20], [22, 20, 22], [14, 285, 23], [4, -30, 22], [-8, 225, 24], [-20, 40, 26], [-34, -60, 26],];
      for (let k = 0; k < 20; k++) SC.push([66 - k * 3.3, (k % 2 ? 318 : 222) + ((k * 5) % 4) * 1.5, 8.6 + 0.4 * ((k * 7) % 3)]);   // the near shreds, left and right in turn
      const mat = sty({
        side: THREE.DoubleSide, vertexPre: 'attribute float iNear; varying float vNear; varying vec3 vLoc;', vertexMain: 'vLoc = p; vNear = iNear;', fragmentPre: 'varying vec3 vLoc; varying float vNear;',
        fragmentMain: /* glsl */`
          float e = abs(dot(n, normalize(cameraPosition - vWorld)));
          float along = vLoc.x, across = vLoc.z;
          float body = 1. - smoothstep(.2, 1., abs(across) * (1.2 + 1.3 * inkNoise(vec2(along * 2.5 + vWorld.x * .05, 3.))) + along * along * .85);
          float wisp = inkNoise(vec2(along * 1.7 + uTime * .05, across * 7. + vWorld.y * .1)) * .6 + inkNoise(vec2(along * 5., across * 17.) + 5.) * .4;
          float nearShow = mix(1., (1. - smoothstep(17., 25., vDepth)), vNear);                   // a near shred condenses out of nothing as the lens comes up to it
          if (body < .06 || wisp > mix(.32 + .5 * body, .15 + .57 * body, vNear) * nearShow || e < (.05 + .25 * wisp) * (1. - vNear)) discard;   // (a near shred is torn harder and is not culled by its facing)               // torn into fibres along its length, thinning to nothing at the ends
          float und = (1. - smoothstep(-.6, .1, n.y));
          ink = vec3(0., .2 + .22 * und + .14 * (1. - body), 0.); lit = 1.; shadeK = 0.;      // a mid tone: paler than the base, darker than the hazy strait
          // the near shreds hang in the cloud's own shade over the pale strait: a deeper plum-blue, so they read against it
          ink = mix(ink, vec3(.36 + .12 * und, .62 + .1 * und + .06 * (1. - body), 0.), vNear);`,
      });
      scudMesh = new THREE.InstancedMesh(G.build(), mat, SC.length); scudMesh.frustumCulled = false; clouds.add(scudMesh);
      scudMesh.geometry.setAttribute('iNear', new THREE.InstancedBufferAttribute(new Float32Array(SC.map((q, i) => (i >= 12 ? 1 : 0))), 1));
      const locAt = (u, out) => { path.pointAt(u, out); out.y = hero.altitudeAt(u); return out; };
      const fL = scudF.copy(seatL).sub(locAt(0.9, new THREE.Vector3())).normalize();
      const rL = new THREE.Vector3().crossVectors(fL, Y_UP).normalize(), uL = new THREE.Vector3().crossVectors(rL, fL);   // frame right (west) and up
      const ta = new THREE.Vector3(), tb = new THREE.Vector3(), tc = new THREE.Vector3(), foot = new THREE.Vector3(), bm = new THREE.Matrix4();
      for (let i = 0; i < SC.length; i++) {
        const a1 = rng(), r0 = rng.range(1.3, 3.0), side = rng.sign ? rng.sign() : (rng() < 0.5 ? -1 : 1), a2 = rng.range(0, 9), a3 = rng.range(-5, 5);
        const sy = rng.range(0.7, 1.3), sp = rng.range(1.5, 4), off = rng() * 40, rot = rng() * TAU;
        const q = SC[i], th = (q[1] + (a1 - 0.5) * 14 * side) * D2R, rho = q[2] + a2 * 0.35, back = q[0] + (rot / TAU - 0.5) * 6;
        foot.copy(seatL).addScaledVector(fL, -back);
        const home = foot.clone().addScaledVector(rL, Math.cos(th) * rho).addScaledVector(uL, Math.sin(th) * rho);
        // basis: X along the flight line (its length), Y toward the line (its thin axis, so the lens sees it broadside), Z across
        tb.subVectors(foot, home).normalize(); tc.crossVectors(fL, tb).normalize();
        const tw = a3 * 0.07; ta.copy(tb).multiplyScalar(Math.cos(tw)).addScaledVector(tc, Math.sin(tw)); tc.crossVectors(fL, ta).normalize();
        // ... and tipped 30 degrees back toward the arriving lens, so it shows its face from far down the straight and not only abeam
        const lx = fL.clone().multiplyScalar(0.866).addScaledVector(ta, 0.5), ly = ta.clone().multiplyScalar(0.866).addScaledVector(fL, -0.5);
        bm.makeBasis(lx, ly, tc);
        if (i >= 12) {
          // a near shred lies ACROSS the flight (a ribbon along it, seen from behind, is foreshortened to a hairline): its
          // length level and square to the line, its face tipped up and back toward the arriving lens
          const yawS = a3 * 0.07, ax = rL.clone().multiplyScalar(Math.cos(yawS)).addScaledVector(fL, Math.sin(yawS));
          ax.multiplyScalar(Math.cos(0.5)).addScaledVector(uL, (Math.cos(th) < 0 ? -1 : 1) * Math.sin(0.5)).normalize();   // rolled: its outer end rides higher
          const nrm = uL.clone().multiplyScalar(0.62).addScaledVector(fL, -0.785).normalize();
          const az = new THREE.Vector3().crossVectors(ax, nrm).normalize(); nrm.crossVectors(az, ax).normalize();
          bm.makeBasis(ax, nrm, az);
        }
        scud.push({ home, r: (1 + 0.5 * (r0 - 1.3)) * (i >= 12 ? 1.55 : 1), len: i >= 12 ? 1.8 : 6, run: i >= 12 ? 0.42 : 1, sy, sp, off, q: new THREE.Quaternion().setFromRotationMatrix(bm) });
      }
    }
    await ctx.yield();

    // ================================================================ CAST: kites, buzzards, gulls, swifts, thistledown
    // kind 0 black kite (forked tail, all three inks), 1 honey buzzard (broad, barred), 2 gull, 4 the pale honey
    // buzzard that passes over the lens (yellow under blue dots, plum bars, tips and wrist patches)
    const raptorGeo = (kind) => {
      const G = new IG(), body = kind === 0 ? [0.85, 0.35, 1] : kind === 1 ? [0.75, 0.8, 0.6] : kind === 4 ? [0, 0.14, 1] : K_WHITE;
      const hs = kind === 1 || kind === 4 ? 0.8 : 0.75, ch = kind === 1 || kind === 4 ? 0.19 : 0.14;
      const wingInk = (d) => (kind === 0 ? (d < 0.3 ? [0.75, 0.55, 1] : d < 0.5 ? [0.1, 0.25, 0.6] : K_PLUM) : kind === 1 ? (d > 0.68 ? K_PLUM : [0.7, 0.75, 0.55]) : kind === 4 ? (d > 0.7 ? K_PLUM : d > 0.34 && d < 0.46 ? [0.9, 0.85, 0.5] : [0, 0.12, 1]) : (d > 0.62 ? K_PLUM : K_WHITE));
      const nose = 0.3, tailZ = -0.28;
      tube(G, [[0, 0, tailZ, 0.02], [0, 0, -0.14, 0.055], [0, 0.005, 0.05, 0.065], [0, 0.01, 0.2, 0.045], [0, 0.012, nose, 0.012]], 5, (k) => (kind === 2 && k === 4 ? K_YEL : body));
      for (const sg of [1, -1]) {
        const ds = [0.001, 0.2, 0.4, 0.58, hs], rows = ds.map((d) => {
          const f = d / hs, le = 0.1 + 0.07 * Math.sin(f * Math.PI * 0.9) - (kind === 0 ? 0.12 * f * f : 0.04 * f), te = le - ch * (1 - 0.35 * f * f) * 1.6;
          const k = wingInk(d); return [G.v(sg * d, 0.02, le, k, undefined, 0, 0, [sg * d, 0, 0, 0]), G.v(sg * d, 0.03, (le + te) / 2, k, undefined, 0, 0, [sg * d, 0, 0, 0]), G.v(sg * d, 0.02, te, k, undefined, 0, 0, [sg * d, 0, 0, 0])];
        });
        for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < 2; j++) { if (sg > 0) G.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]); else G.quad(rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j], rows[i][j]); }
        if (kind < 2 || kind === 4) for (let f = 0; f < 4; f++) {                     // fingered primaries
          const z0 = 0.06 - f * 0.065 - (kind === 0 ? 0.12 : 0.04), a = (-0.25 + f * 0.24), l = 0.2 - f * 0.02, d0 = hs - 0.03, d1 = d0 + Math.cos(a) * l, z1 = z0 - Math.sin(a) * l;
          const va = G.v(sg * d0, 0.02, z0 + 0.025, K_PLUM, undefined, 0, 0, [sg * d0, 0, 0, 0]), vb = G.v(sg * d0, 0.02, z0 - 0.025, K_PLUM, undefined, 0, 0, [sg * d0, 0, 0, 0]), vc = G.v(sg * d1, 0.03, z1, K_PLUM, undefined, 0, 0, [sg * d1, 0, 0, 0]);
          if (sg > 0) G.tri(va, vc, vb); else G.tri(vb, vc, va);
        }
      }
      {                                                                // tail: forked for the kite, a rounded fan otherwise
        const tk = kind === 0 ? [1, 0.15, 1] : kind === 1 ? [0.7, 0.75, 0.55] : kind === 4 ? [0.25, 0.3, 1] : K_WHITE, L = kind === 0 ? 0.36 : 0.26, notch = kind === 0 ? 0.11 : -0.03;
        const a = G.v(-0.04, 0.005, -0.24, tk), b = G.v(0.04, 0.005, -0.24, tk), c = G.v(0.14, 0.005, -0.24 - L, tk, undefined, 0, 0, [0, 1, 0, 0]), d = G.v(0, 0.005, -0.24 - L + notch, tk, undefined, 0, 0, [0, 1, 0, 0]), e = G.v(-0.14, 0.005, -0.24 - L, tk, undefined, 0, 0, [0, 1, 0, 0]);
        G.tri(a, b, d); G.tri(b, c, d); G.tri(a, d, e);
      }
      return G.build('aW');
    };
    // A FLAMINGO in flight (+Z forward, 1.9 units from wingtip to wingtip, 2.07 from bill to toes): neck stretched out ahead
    // and legs trailing behind in ONE straight line a quarter as wide as the wing is deep, a spindle of a body between them,
    // a down-kinked bill (paper, plum at the tip) and two tapered, cambered wings with a wrist (chord 0.48 at the root, 0.25
    // at the hand, a pointed tip). The inks are laid by FLAM_FRAG from aW: x = signed distance along the wing, z = 1 on the
    // thin parts (neck, head, bill, legs: the vertex shader never lets them go narrower than a few pixels), w = the part
    // (0..1 across the wing's chord, 2 body, 3 neck and head, 4 bill, 5 legs).
    const flamingoGeo = () => {
      const G = new IG(), PK = [1, 0, 0], hs = 0.9;
      tube(G, [[0, 0, -0.36, 0.012], [0, 0, -0.24, 0.05], [0, 0.006, -0.05, 0.08], [0, 0.008, 0.1, 0.072], [0, 0.01, 0.22, 0.047]], 7, PK, false, [0, 0, 0, 2]);
      tube(G, [[0, 0.01, 0.2, 0.047], [0, 0.012, 0.45, 0.042], [0, 0.012, 0.7, 0.04], [0, 0.014, 0.86, 0.042], [0, 0.016, 0.92, 0.06], [0, 0.012, 0.975, 0.052]], 5, PK, false, [0, 0, 1, 3]);
      const billInk = [K_WHITE, [0.3, 0, 0], K_PLUM, K_PLUM];
      tube(G, [[0, 0.01, 0.96, 0.046], [0, -0.005, 1.03, 0.042], [0, -0.05, 1.085, 0.036], [0, -0.11, 1.11, 0.012]], 4, (k) => billInk[k], true, [0, 0, 1, 4]);
      for (const sx of [-1, 1]) tube(G, [[sx * 0.026, -0.012, -0.28, 0.026], [sx * 0.026, -0.016, -0.6, 0.022], [sx * 0.028, -0.018, -0.84, 0.022], [sx * 0.03, -0.018, -0.9, 0.034], [sx * 0.03, -0.016, -0.96, 0.014]], 3, PK, true, [0, 0, 1, 5]);
      const CH = [[0, 0.016], [0.25, 0.042], [0.62, 0.032], [1, 0.012]];        // chord fraction, camber height
      for (const sg of [1, -1]) {
        const rows = [0.02, 0.14, 0.28, 0.42, 0.55, 0.68, 0.8, hs].map((d) => {
          const f = d / hs, c = lerp(0.48, 0.25, Math.pow(f, 1.3)), le = 0.2 + 0.045 * Math.sin(f * Math.PI * 0.9) - 0.07 * f * f;
          return CH.map((q) => G.v(sg * d, q[1], le - c * q[0], PK, undefined, 0, 0, [sg * d, 0, 0, q[0]]));
        });
        for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < 3; j++) { if (sg > 0) G.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]); else G.quad(rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j], rows[i][j]); }
        const last = rows[rows.length - 1], tip = G.v(sg * (hs + 0.1), 0.014, 0.0, PK, undefined, 0, 0, [sg * (hs + 0.1), 0, 0, 0.55]);
        for (let j = 0; j < 3; j++) { if (sg > 0) G.tri(last[j], tip, last[j + 1]); else G.tri(last[j + 1], tip, last[j]); }
      }
      return G.build('aW');
    };
    const uMinPxB = { value: 6 }, uGull = { value: new THREE.Vector3() };
    const birdMat = (defines, o = {}) => new THREE.ShaderMaterial({
      uniforms: { ...press.shared, uAlt: hero.uniforms.uAlt, uH: hero.uniforms.uH, uLean: hero.uniforms.uLean, uBufH: hero.uniforms.uBufH, uMinPx: o.minPx || uMinPxB, uBubble: { value: o.bubble ?? 7.5 },
        uCentre: o.centre || { value: new THREE.Vector3() }, uFwd: { value: new THREE.Vector3(0, 0, 1) }, uRight: { value: new THREE.Vector3(1, 0, 0) }, uShow: { value: 1 }, uBank: { value: 0 }, uPitch: { value: o.pitch ?? 0 }, uFlap: o.flap || { value: new THREE.Vector3(0, 1, 0) },
        uBars: { value: o.bars ?? 0 }, uSolid: { value: o.solid ?? 0 } },
      defines, vertexShader: BIRD_VERT, fragmentShader: o.frag || BIRD_FRAG, side: THREE.DoubleSide, fog: false, toneMapped: false,
    });
    const flock = (geo, n, mat, fill) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
      const a = new Float32Array(n * 4), b = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) fill(i, a, b);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
    };
    const kiteGeo = raptorGeo(0);
    const nKite = Math.round((cast === 'raptor' ? 300 : 60) * clamp(density, 0.8, 1.2));
    castG.add(flock(kiteGeo, nKite, birdMat({}), (i, a, b) => {
      const r = i % 5 === 0 ? rng.range(24, 44) : rng.range(46, 118);
      a.set([r, rng() * TAU, rng() * H, rng.range(9, 13) / r], i * 4); b.set([rng(), rng.range(1.0, 1.2), 0, 0], i * 4);
    }));
    castG.add(flock(raptorGeo(1), 24, birdMat({}, { bars: 1 }), (i, a, b) => {
      const r = rng.range(40, 125);
      a.set([r, rng() * TAU, rng() * H, rng.range(8, 11) / r], i * 4); b.set([rng(), rng.range(1.05, 1.25), 0, 0], i * 4);
    }));
    castG.add(flock(raptorGeo(2), 14, birdMat({ GULL: 1 }, { centre: uGull, bubble: 0 }), (i, a, b) => {
      a.set([rng.range(10, 46), rng() * TAU, rng.range(7, 30), rng.range(0.25, 0.6) * (i % 2 ? 1 : -1)], i * 4); b.set([rng(), rng.range(1.0, 1.3), 0.25, 0], i * 4);
    }));
    await ctx.yield();
    const uDriftMin = { value: 3.2 }, driftMat = (defines, box, windV) => new THREE.ShaderMaterial({
      uniforms: { ...press.shared, uBufH: hero.uniforms.uBufH, uBox: { value: box }, uMinPx: uDriftMin, uWind: { value: windV } },
      defines, vertexShader: DRIFT_VERT, fragmentShader: DRIFT_FRAG, side: THREE.DoubleSide, fog: false, toneMapped: false,
    });
    {
      const S = new IG();                                              // a swift: a sickle of two swept wings and a short body
      for (const sg of [1, -1]) { const a = S.v(0, 0, 0.12, K_PLUM), b = S.v(sg * 0.5, 0, -0.06, K_PLUM), c = S.v(sg * 1, 0, -0.42, K_PLUM), d = S.v(sg * 0.42, 0, -0.2, K_PLUM), e = S.v(0, 0, -0.14, K_PLUM); S.tri(a, b, e); S.tri(b, d, e); S.tri(b, c, d); }
      { const a = S.v(0, 0.02, 0.3, K_PLUM), b = S.v(0.06, 0, 0, K_PLUM), c = S.v(0, 0, -0.5, K_PLUM), d = S.v(-0.06, 0, 0, K_PLUM); S.quad(a, b, c, d); }
      const nSw = Math.round(150 * lerp(0.6, 1, clamp((detail - 0.6) / 0.4, 0, 1)));
      castG.add(flock(S.build(), nSw, driftMat({ SWIFT: 1 }, 64, new THREE.Vector3()), (i, a, b) => {
        a.set([rng() * 64, rng() * 64, rng() * 64, rng.range(15, 24)], i * 4); b.set([rng(), 0.21, rng() * TAU, 0], i * 4);
      }));
      const Q = new IG(); Q.quad(Q.v(-0.5, -0.5, 0, K_WHITE), Q.v(0.5, -0.5, 0, K_WHITE), Q.v(0.5, 0.5, 0, K_WHITE), Q.v(-0.5, 0.5, 0, K_WHITE));
      const nDn = Math.round(600 * lerp(0.6, 1, clamp((detail - 0.6) / 0.4, 0, 1)) * clamp(density, 0.85, 1.15));
      castG.add(flock(Q.build(), nDn, driftMat({}, 46, new THREE.Vector3(east ? -2.4 : -0.5, 0.9, 0.2)), (i, a, b) => {
        a.set([rng() * 46, rng() * 46, rng() * 46, 0], i * 4); b.set([rng(), rng.range(0.07, 0.13), 0, 0], i * 4);
      }));
    }
    await ctx.yield();

    // ================================================================ STAGED
    // the entry trio labouring up dead ahead (u); the birds of our lane (the world clock); the stork that slides across
    // the lens wingtip to wingtip, the kite that crosses against the grain and the flamingo skein (rare), each on a
    // course of its own and moved by the metres flown; the site's three stragglers of the last straight (PASS, in the
    // lens's frame by u). These live in the scene, not in the sinking root.
    const trio = [0, 1, 2].map((i) => { const m = hero.makeSoloStork({ flap: 1, legs: 0.75, seed: 0.13 + i * 0.29 }); scene.add(m); return { m, lead: [9, 11.5, 14][i], lat: [-0.4, 2.3, 4.6][i], up: [-1.6, -1.2, -1.9][i] }; });
    const crosser = hero.makeSoloStork({ flap: 0, legs: 0, seed: 0.61 }); crosser.scale.setScalar(1.25); crosser.visible = false; scene.add(crosser);
    // CLOSE COMPANY: THE BIRDS OF OUR OWN LANE. We ride in a stair lane, and these are the storks that share it: each
    // flies THE ROUTE itself, at a station so many metres ahead of us or behind (rel), offset in the PATH's frame (lat
    // metres to the right of the route, up metres over it), heading along the route at its own station and banked as the
    // route turns there, with its own slow wander and rocking. Each has a LANE SPEED of its own, 0.5 to 2 m/s off ours
    // (dv, on the world clock): half of them we overhaul, half overhaul us, so each slides back or forward past the lens
    // and the hang beside us is nothing but that speed difference. A bird has its own beat on the lane: it comes into
    // it from the lane above, far ahead (or from behind us), crosses the stretch 2.5 to 8 m ahead of the lens (ZONE,
    // where it is 6 to 11 m off) in ZONE / |dv| seconds, and leaves behind us (or far ahead, up into the lane above); its
    // beat is |dv| x T metres long. T is the sum of the birds' crossing times less the overlap, and each bird comes to
    // the stretch as the one before it is 85 percent through, so at every phase of the clock one or two are at arm's
    // length. No window in u and no table: their own generator gives each its speed, side, height, wingbeat, wander
    // and the clock's start phase. A bird of the lane is a bird of the HELIX: it rises into its station from the scrub
    // where the lane begins (LANE0, labouring) and climbs away to the file where the lane ends (LANE1, where the route
    // straightens: by its own station it climbs from 30 m short of that point and is gone 10 m past it).
    // THE LANE'S MARGIN (a rule of the lane, never of the lens): every lane lies LANE_OUT m further out along its own
    // bearing than its draw (the nearest 6.5 m from the route's centreline), and whatever wander, the lane above, the
    // rise from the scrub and the climb away make of its offset, no bird of the lane is placed nearer than LANE_CLEAR m
    // to the centreline at its own station, anywhere on the lane.
    const lr = makeRng(ctx.core.hashSeed('stork-kettle-lane:' + (ctx.seed ?? 0)));
    const ZONE = [2.5, 8], NLANE = 8, LANE0 = FT_D(2), LANE1 = path.length - FT_STRAIGHT;
    const LANE_CLEAR = 6, LANE_OUT = 3.5;
    const laneBirds = [];
    {
      let sum = 0;
      for (let i = 0; i < NLANE; i++) {
        const dv = lr.range(0.5, 2) * (i % 2 ? 1 : -1), side = (i % 4 < 2 ? 1 : -1) * mirror, up = lr.range(-3.6, -1.5);   // (the route climbs a quarter of a metre to the metre: a bird ahead on it rides higher than the lens, so stations lie under the route)
        const lat = side * Math.max(lr.range(1.5, 3.6), Math.sqrt(Math.max(9 - up * up, 0)));
        const m = hero.makeSoloStork({ flap: 0, legs: lr.chance(0.3) ? 0.5 : 0, seed: lr() }); m.visible = false; scene.add(m);
        const dwell = (ZONE[1] - ZONE[0]) / Math.abs(dv);
        const ko = (Math.hypot(lat, up) + LANE_OUT) / Math.hypot(lat, up);
        laneBirds.push({ m, dv, lat: lat * ko, up: up * ko, dwell, at: sum, ph: lr() * TAU, wp: lr.range(0.25, 0.45), size: lr.range(1.22, 1.34) });
        sum += dwell * 0.85;
      }
      const T = sum, t0 = lr() * T;                                   // the beat of the whole lane, and where the clock finds it
      for (const b of laneBirds) {
        b.T = T; b.at += t0; b.P = Math.abs(b.dv) * T;
        b.back = Math.min(6 + 0.1 * b.P, 12); b.front = b.P - b.back;   // its beat on the lane: from back metres behind us to front metres ahead
      }
    }
    // OUR OWN LANE, by the design's sentence: OWN_N storks on THE ROUTE'S OWN LINE ahead of us, in the slots the hero's lane
    // leaves empty before its next bird (hero.spacing apart, the design's 12 m), each drawn up to OWN_JIT m off its slot
    // (so gaps differ as the entry trio's leads do) and drifting in its gap on the world clock, none nearer to the next or
    // to us than three of the stork's own spans (its mesh at the largest size drawn). Height, heading and bank are the
    // route's at the bird's own station; it rises from the scrub where the lane begins, climbs away where it ends, and
    // gives way across the lane to keep two spans from the trio and the neighbour lanes. Its own stream; reads no lens.
    const ow = makeRng(ctx.core.hashSeed('stork-kettle-ownlane:' + (ctx.seed ?? 0)));
    const OWN_N = 3, OWN_JIT = (trio[2].lead - trio[0].lead) / 4;
    const ownBirds = [], ownNear = [...trio.map((t) => t.m), ...laneBirds.map((b) => b.m)];
    {
      const pa = trio[0].m.geometry.attributes.position; let x0 = 0, x1 = 0;
      for (let i = 0; i < pa.count; i++) { x0 = Math.min(x0, pa.getX(i)); x1 = Math.max(x1, pa.getX(i)); }
      for (let i = 1; i <= OWN_N; i++) {
        const m = hero.makeSoloStork({ flap: 0, legs: ow.chance(0.3) ? 0.5 : 0, seed: ow() }); m.visible = false; scene.add(m);
        ownBirds.push({ m, at: i * hero.spacing + ow.range(-OWN_JIT, OWN_JIT), size: ow.range(1.22, 1.34), ph: ow() * TAU, wp: ow.range(0.25, 0.45) });
      }
      const clear = 3 * (x1 - x0) * Math.max(...ownBirds.map((b) => b.size));
      for (let i = 0; i < OWN_N; i++) {
        const b = ownBirds[i]; b.room = 2 * (x1 - x0) * b.size;
        const behind = b.at - (i ? ownBirds[i - 1].at : 0), ahead = (i < OWN_N - 1 ? ownBirds[i + 1].at : (OWN_N + 1) * hero.spacing) - b.at;
        b.amp = Math.max(Math.min(behind, ahead) - clear, 0) / 2;
      }
    }
    // THE SITE'S OWN THREE ROWS, inherited unchanged (the last three of its PASS table, flown by its own lines in update):
    // seats in the lens's frame on typed shares of the flight; first work of the next round.
    //   [mesh, u0, u1, depth, hang x, y, in x, y, out x, y, yaw, pitch, roll, scale]   (metres right / up of the optical axis)
    const company = [0, 1, 2, 3].map((i) => { if (i === 1) return crosser; const m = hero.makeSoloStork({ flap: 0, legs: i === 2 ? 0.5 : 0, seed: 0.27 + i * 0.17 }); m.visible = false; scene.add(m); return m; });
    const PASS = [
      // the last straight: three stragglers of the file that the lens overtakes, well outside the ring's disc; they peel
      // away down the left and the right of the page as the ring grows
      [3, 0.822, 0.972, 7.6, -4.3, -1.5, -10.8, -2.6, -9.6, -4.4, -0.12, 0.42, 0.5, 1.3],
      [0, 0.840, 0.985, 8.4, 4.9, -2.0, 11.6, 0.6, 9.2, -6.2, 0.1, 0.5, 0.0, 1.25],
      [2, 0.905, 0.992, 8.8, -6.0, 1.9, -11.6, 0.4, -9.4, 6.8, -0.14, -0.45, -0.4, 1.25],
    ];
    const kiteMat = birdMat({ FORM: 1 }, { bubble: 0 });
    const soloKite = flock(kiteGeo, 1, kiteMat, (i, a, b) => { a.set([0, 0, 0, 0], 0); b.set([0.43, 1.3, 0, 0], 0); });
    soloKite.visible = false; scene.add(soloKite);
    // THE PALE HONEY BUZZARDS: two (yellow under blue dots, plum bars, tips and wrist patches) that circle THE OTHER WAY
    // on circles of their own about the thermal's axis, a few metres inside or outside the lane and 3 to 5.5 m over the
    // lens' height, by the world clock: one comes down the lane against us and passes over a shoulder every few seconds
    // of the whole climb, barred underwings to the lens. Radius, height, speed, start phase: their own generator.
    {
      const br = makeRng(ctx.core.hashSeed('stork-kettle-buzzards:' + (ctx.seed ?? 0)));
      castG.add(flock(raptorGeo(4), 2, birdMat({ NEARLANE: 1 }, { bubble: 4.2, bars: -1, solid: 0.55 }), (i, a, b) => {
        const r = hero.laneRadius + (i ? -1 : 1) * br.range(2.5, 6.5);
        a.set([r, br() * TAU, br.range(3.2, 5.5), br.range(8.5, 11) / r], i * 4); b.set([br(), br.range(1.4, 1.6), 0, 0], i * 4);
      }));
    }
    // THE FLAMINGO SKEIN, the rare event (ctx.vary.rare: the engine's seeded chance, about one visit in eight; on other
    // visits nothing of it is built): forty birds, the only pink in the world, printed by FLAM_FRAG, flying as THREE
    // STACKED BOWS, one behind the next (14, 13 and 13 birds, each bow 15 m behind and a little below the one ahead: forty
    // birds in one V would be far wider than the page). Stations stand 4.5 m apart across; an arm sweeps back in a curve
    // (0.9 m at the first station, 12 m at the seventh), so each rank is a bow and not a ruled V. Every bird but a
    // leader is a little off its station, at its own height, on its own heading and in its own bank (the vertex
    // shader). The whole skein is 54 m wide and 43 m deep. Its own generator, so no other choice of any seed moves.
    // ITS COURSE is one straight, level line in the scene (FLAM): it is anchored on THE THERMAL'S OWN AXIS, at a point
    // up to 20 m off it (inside the innermost stair lane) at a bearing and a distance drawn from the skein's own
    // generator after its last bird, 25 m under the height the lane has where the route is at the design's 24 s. The
    // middle of the skein is at that point AT the beat; its heading is 105 degrees inward of ours at the beat, so it
    // comes in under our lane from the outside of the turn, crosses the kettle's middle below the stair and goes out
    // under the far side of the lane, at 17 m/s. update() only says how far along its line it is, by metres flown.
    // ctx.vary.mood turns the course a few degrees and sets it a little higher or lower.
    const uFlamFlap = { value: new THREE.Vector3(0.1, 0.4, 2.2) }, uFlamMin = { value: 36 };   // wings held in a shallow V, a shallow beat; held at 36 design px where a bird is within 1.45 times of it
    const moodV = clamp(vary.mood ?? 0.5, 0, 1);
    let flam = null, flamMat = null;
    const FLAM = { o: new THREE.Vector3(), c: new THREE.Vector3(), k: 17 / 14, d: 0 };   // (k: its 17 m/s to the ride's 14)
    if (mood.rare) {
      flamMat = birdMat({ FORM: 1, FLAM: 1 }, { bubble: 0, flap: uFlamFlap, pitch: 0, frag: FLAM_FRAG, minPx: uFlamMin });
      const fr = makeRng('stork-kettle-flamingos:' + (ctx.seed ?? 0));
      flam = flock(flamingoGeo(), 40, flamMat, (i, a, b) => {
        const ch = i < 14 ? 0 : i < 27 ? 1 : 2, jj = i - [0, 14, 27][ch], k = Math.ceil(jj / 2), sg = jj % 2 ? 1 : -1, jk = Math.min(k, 1);
        a.set([sg * k * 4.5 + fr.range(-0.25, 0.25) * jk, fr.range(-0.4, 0.4) * jk - ch * 0.8, -(0.9 * k + 0.12 * k * k) + fr.range(-0.3, 0.3) * jk - ch * 15, 0], i * 4);
        b.set([fr(), fr.range(1.74, 1.86), 1, 0], i * 4);
      });
      flam.visible = false; scene.add(flam);
      // the course: through a point by the thermal's axis (the offset is drawn here, after the skein's last bird), 25 m under
      // the lane's height at the beat, 105 degrees inward of the heading at the beat
      FLAM.d = metresAt(24);
      const tf = path.tangentAtDist(FLAM.d, new THREE.Vector3()).setY(0).normalize(), rf = new THREE.Vector3(-tf.z, 0, tf.x), th = (105 + (moodV - 0.5) * 8) * D2R;
      const ob = fr() * TAU, od = fr.range(0, 20);
      FLAM.o.set(Math.sin(ob) * od, path.posAtDist(FLAM.d, new THREE.Vector3()).y - 25 - (moodV - 0.5) * 3, -Math.cos(ob) * od);
      FLAM.c.copy(tf).multiplyScalar(Math.cos(th)).addScaledVector(rf, Math.sin(th));
      flamMat.uniforms.uFwd.value.copy(FLAM.c); flamMat.uniforms.uRight.value.crossVectors(Y_UP, FLAM.c).normalize();
    }
    land.add(new THREE.Mesh(props.build(), propMat));
    // everything printed goes on the ink layer (the hero's own objects already are; its page must stay on layer 0)
    for (const g of [land, strait, clouds, castG, soloKite]) press.ink(g);
    if (flam) press.ink(flam);
    await ctx.yield();
    // The free storks' program as the page's print asks for it (a buffer set, no light on the ink layer: the engine's
    // compile step counts the ride's two lights and so makes another): made here and waited for in the background, so
    // that the first print does not make it and use it at once.
    if (ctx.renderer && ctx.renderer.compile) {
      const r = ctx.renderer, prevRT = r.getRenderTarget(), rt = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
      const inkCam = new THREE.PerspectiveCamera(); inkCam.layers.set(press.layer);
      let prog = null;
      try { r.setRenderTarget(rt); r.compile(trio[0].m, inkCam, scene); prog = r.properties.get(trio[0].m.material).currentProgram; } catch (e) { prog = null; }
      r.setRenderTarget(prevRT); rt.dispose();
      // (waits by drawn frames, never by a timer: ctx.frame always waits for the next frame; at most three hundred frames, and a program that never reports is used as it is)
      for (let n = 0; prog && n < 300; n++) { let ok = true; try { ok = prog.isReady(); } catch (e) { /* gone */ } if (ok) break; await ctx.frame(); }
      await ctx.yield();
    }

    // ================================================================ UPDATE
    const L = path.length;
    const cP = new THREE.Vector3(), cR = new THREE.Vector3(), cU = new THREE.Vector3(), cF = new THREE.Vector3();
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3();
    const m4 = new THREE.Matrix4(), q1 = new THREE.Quaternion(), e1 = new THREE.Euler(), s1 = new THREE.Vector3();
    // orient a +Z-forward bird: forward f, rolled by r about it (r > 0 lowers the wing on the camera's right in a right turn)
    const aim = (mesh, f, r) => {
      bz.copy(f).normalize(); bx.crossVectors(Y_UP, bz).normalize(); by.crossVectors(bz, bx);
      v2.copy(bx).multiplyScalar(Math.cos(r)).addScaledVector(by, Math.sin(r)); by.multiplyScalar(Math.cos(r)).addScaledVector(bx, -Math.sin(r)); bx.copy(v2);
      m4.makeBasis(bx, by, bz); mesh.quaternion.setFromRotationMatrix(m4);
    };
    const rootY = (u) => pathY(u) - hero.altitudeAt(u);
    const cFl = new THREE.Vector3(), cUl = new THREE.Vector3();
    // a +Z-forward bird on THE ROUTE: at st metres along it, lat metres to the right of it and up metres over it (the path's
    // frame), nose along the route there (turned yaw toward the inside, pitched), banked as the route turns at that
    // station (a level turn at the ride's 14 m/s) plus its own roll
    const flyLane = (mesh, st, lat, up, yaw, pitch, roll, scale) => {
      const sc = clamp(st, 0, L - 0.01);
      path.posAtDist(sc, v1); path.tangentAtDist(sc, s1); path.tangentAtDist(Math.min(sc + 6, L), v2);
      const turn = (v2.z * s1.x - v2.x * s1.z) / 6;                    // radians to the metre, to the right
      bx.set(-s1.z, 0, s1.x).normalize();
      mesh.position.copy(v1).addScaledVector(bx, lat); mesh.position.y += up;
      s1.addScaledVector(bx, yaw); s1.y += pitch;
      mesh.scale.setScalar(Math.max(scale, 0.001));
      aim(mesh, s1, Math.atan(196 * turn / 9.81) + roll);
    };
    const BEAT_C = metresAt(13), BEAT_K = metresAt(17), KITE_Y = path.posAtDist(BEAT_K + 4, new THREE.Vector3()).y - 1.2;

    // ================================================================ THE GAZE
    // ONE point of interest of full weight for the whole flight, whose target is worked out here (gazeAt). Up the climb
    // it is the engine's own gaze (24 m down the path) drawn to the pair on the nest as we pass them and then half way to
    // the stair of storks ahead-right and below, so it stays LEVEL on the birds and is never turned up the kettle. THE
    // LOOK DOWN is worked out as a yaw from the heading and a pitch, so the move is ruled by two eased ramps and not by
    // the engine's blend of unit vectors (which hurries through the middle of a wide turn):
    //   TILT  from the stair down to 58 degrees below level and 50 degrees inside the turn. It begins where the lens has
    //         climbed half way up the funnel's band (the gaze is level till then) and goes over as the lens comes up out of
    //         the funnel's top: the horizon slides up and out of the page as the rings come in from below
    //   LIFT  almost a pure lift of the head, from the rings up through the strait and the far coast onto the engine's own
    //         gaze where the route straightens: the pink ring stands in the middle of the page for the whole last straight
    // Before the tilt the director returns exactly what the gaze already is and after the lift exactly the engine's own
    // gaze. pace() slows the flight to 0.55 from u 0.70 to 0.85. The tilt turns the camera no faster than the helix
    // itself does (22 degrees a second); the lift, 70 degrees of it within one look-ahead of route, turns it at up to 30.
    const GZ = { pitch: -58 * D2R, yaw: 50 * D2R };
    const gP = new THREE.Vector3(), gA = new THREE.Vector3(), gT = new THREE.Vector3(), gR = new THREE.Vector3(), gB = new THREE.Vector3(), gS = new THREE.Vector3(), gN = new THREE.Vector3(), gH = new THREE.Vector3();
    const poiStair = new THREE.Vector3(), poiGaze = new THREE.Vector3();
    const easeG = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return 0.4 * t + 0.6 * t * t * (3 - 2 * t); };
    // THE OPENING: the stair's point sinks from 12.5 to STAIR_DEEP m under the lens, and the gaze with it (to 20 degrees
    // below level), BY THE PLACE: by the share of the heading that points toward the strait (due south 1, across or away
    // from it 0, eased) and by how high the lens stands over the sea (not at all below OPEN_H[0] m, wholly from
    // OPEN_H[1] m, eased over those 300 m of climb: the design's heights at its 13 s and at the top of turn one, where
    // its opening begins). The same on every turn of the stair: the horizon rides up into the top quarter as the
    // heading comes round to the strait, with its ships and wakes under the stair, and comes back as the heading turns
    // to the land; low over the headland the gaze stays level. Nothing here is a share of the flight.
    const STAIR_DEEP = 30, OPEN_H = [300, 600];
    const stairDrop = (d) => {
      path.tangentAtDist(d, gH); const south = Math.max(gH.z / Math.max(Math.hypot(gH.x, gH.z), 1e-6), 0);
      return lerp(12.5, STAIR_DEEP, south * south * (3 - 2 * south) * smoothstep(OPEN_H[0], OPEN_H[1], hero.altitudeAt(d / L) - SEA_Y));
    };
    const stairAt = (u, out) => { const uc = clamp(u, 0, 1); path.pointAt(uc, out); const ph = Math.atan2(out.x, -out.z) + 0.606; return out.set(33 * Math.sin(ph), out.y - stairDrop(uc * L), -33 * Math.cos(ph)); };
    // HOW FAR THE HEADING HAS TURNED from the lead-in, in degrees, at each metre of the route (summed along the route, so
    // it goes on growing through both turns of the helix). THE STAIR ASSEMBLES BY THE TURN ITSELF (stairK): nothing of it
    // on the lead-in, all of it once the heading has come 30 degrees round. The same factor raises the escorts ahead
    // of the lens (update, read at the lens' own station) and draws the gaze half way to them (gazeAt, read AHEAD metres
    // on, at the station the engine's gaze looks to: the gaze goes into the turn one look-ahead before the lens does)
    const TURNED = (() => {
      const n = Math.ceil(L) + 2, t = new Float32Array(n), a = path.tangentAtDist(0, new THREE.Vector3()), b = new THREE.Vector3();
      for (let i = 1; i < n; i++) { path.tangentAtDist(Math.min(i, L), b); t[i] = t[i - 1] + Math.atan2(b.z * a.x - b.x * a.z, a.x * b.x + a.z * b.z) / D2R; a.copy(b); }
      return t;
    })();
    const turnedAt = (d) => { const x = clamp(d, 0, TURNED.length - 1.001), i = Math.floor(x); return lerp(TURNED[i], TURNED[i + 1], x - i); };
    const stairK = (d) => smoothstep(0, 30, turnedAt(d));
    // THE NEST'S STRETCH, by the metres of route to the watchtower: D_TOWER is where the lead-in comes abeam of it; the
    // look at the pair (and the first bill-throw, update) begins 60 m short of that, is whole from 40 m short, eases
    // out from 30 m short and is let go 10 m past abeam
    const D_TOWER = (() => { let best = 0, bd = 1e9; for (let d = 0; d <= LANE0 + 30; d += 0.25) { path.posAtDist(d, gH); const e = (gH.x - TOWER.x) ** 2 + (gH.z - TOWER.z) ** 2; if (e < bd) { bd = e; best = d; } } return best; })();
    const nestK = (d) => smoothstep(-60, -40, d - D_TOWER) * (1 - smoothstep(-30, 10, d - D_TOWER));
    const NEST = { at: new THREE.Vector3(TOWER.x - 0.5, TOWER.y + 14.6, TOWER.z), weight: 0.42 };
    const STAIR = { weight: 0.5 }, AHEAD = 24;   // (the stair's pull has no end of its own: the look down takes the gaze from it)
    // THE LOOK DOWN is ruled by where the lens IS, not by a table of u:
    //   TILT  begins by the lens' HEIGHT against the funnel's own band (hero.funnel): the gaze is level until the lens is
    //         in the upper half of the band (D_UP: the metres to the ring where it is half way up it), goes over as the
    //         lens comes up out of the funnel's top, and is fully down half a look-ahead after it is out (D_OUT)
    //   LIFT  by METRES TO THE RING: it begins one look-ahead before the route straightens out for the ring (D_LIFT0 = the
    //         straight + AHEAD: from there the engine's own gaze, AHEAD metres down the path, rests on the straight) and
    //         is done where the route straightens (D_LIFT1 = the first point of the last straight), eased over those
    //         AHEAD metres: the ring is centred from the first metre of the straight
    const STRAIGHT = FT_STRAIGHT;
    const solve = (f, lo, hi) => { for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m)) hi = m; else lo = m; } return (lo + hi) / 2; };
    const dRingAtHeight = (y) => (1 - solve((u) => hero.altitudeAt(u) > y, 0.5, hero.top.u)) * path.length;
    const D_UP = dRingAtHeight((hero.funnel.y0 + hero.funnel.y1) / 2), D_OUT = dRingAtHeight(hero.funnel.y1) - AHEAD / 2;
    const D_LIFT0 = STRAIGHT + AHEAD, D_LIFT1 = STRAIGHT;
    const tiltK = (dRing) => { const t = clamp((D_UP - dRing) / (D_UP - D_OUT), 0, 1); return 0.55 * t + 0.45 * t * t * (3 - 2 * t); };
    const liftK = (dRing) => easeG(D_LIFT0, D_LIFT1, dRing);
    const gazeAt = (time, u) => {
      const uc = clamp(u, 0, 1), d = uc * path.length, dRing = path.length - d;
      path.posAtDist(d, gP); path.tangentAtDist(d, gT); gT.y = 0; if (gT.lengthSq() < 1e-8) gT.set(0, 0, 1); gT.normalize(); gR.set(-gT.z, 0, gT.x);   // heading, and its right (inside the turn)
      path.posAtDist(d + AHEAD, gA); gB.subVectors(gA, gP).normalize();                                     // the engine's own gaze
      const wn = nestK(d) * NEST.weight, ws = stairK(d + AHEAD) * STAIR.weight;
      gS.copy(gB).multiplyScalar(1 - wn).addScaledVector(gN.copy(NEST.at).sub(gP).normalize(), wn).normalize();   // ... as the pair on the nest
      gS.multiplyScalar(1 - ws).addScaledVector(stairAt(uc, poiStair).sub(gP).normalize(), ws).normalize();        // ... and then the stair leave it
      const a = tiltK(dRing), b = liftK(dRing);
      if (a <= 0 && b <= 0) return poiGaze.copy(gS).multiplyScalar(60).add(gP);
      const yS = Math.atan2(gS.dot(gR), gS.dot(gT)), pS = Math.asin(clamp(gS.y, -1, 1)), yB = Math.atan2(gB.dot(gR), gB.dot(gT)), pB = Math.asin(clamp(gB.y, -1, 1));
      const yaw = lerp(lerp(yS, GZ.yaw, a), yB, b), pit = lerp(lerp(pS, GZ.pitch, a), pB, b), cp = Math.cos(pit);
      return poiGaze.copy(gT).multiplyScalar(Math.cos(yaw) * cp).addScaledVector(gR, Math.sin(yaw) * cp).setY(Math.sin(pit)).multiplyScalar(60).add(gP);
    };

    function update(dt, time, camera, u) {
      const uu = clamp(u ?? 0, 0, 1);
      // ---- the climb: land, sea, clouds and the kettle sink together under the path
      root.position.y = rootY(uu);
      hero.setEscort(lerp(0.92, 1.3, smoothstep(0.15, 0.62, uu)), 46 * uu);            // the stair stretches and re-forms as it climbs
      hero.update(dt, time, camera);
      // the stair rises into place ahead of the lens as the heading turns out of the lead-in (stairK) and flies there until the gaze goes over; the
      // companions for the look back down come up inside the turn with the tilt (tk) and sink away with the lift (lk);
      // birds keep clear of the ring's disc as the head comes up to it
      const d0 = uu * L, tk = tiltK(L - d0), lk = liftK(L - d0);
      hero.setStair(stairK(d0) * (1 - smoothstep(0.05, 0.6, tk)), smoothstep(0.1, 0.7, tk) * (1 - smoothstep(0.25, 0.85, lk)));
      hero.setRing(smoothstep(0.3, 0.85, lk));
      // the column far below the funnel is thinned for the look down, and the sea under it is calm
      hero.setCalm(smoothstep(0, 0.3, tk) * (1 - smoothstep(0.75, 1, lk)));
      uLook.value = smoothstep(0, 0.4, tk) * (1 - smoothstep(0.5, 1, lk)); uFarW.value = smoothstep(0.3, 1, tk);
      const alt = hero.uniforms.uAlt.value, bufH = hero.uniforms.uBufH.value;
      hero.uniforms.uUnder.value = lerp(0.13, 0.2, smoothstep(940, 1100, alt));       // into the tower's own shade
      uVeil.value = smoothstep(9, 28, L - d0);                                          // let go of the ride before the ring is at arm's length
      uMinPxB.value = 6 * bufH / 450; uDriftMin.value = 3.2 * bufH / 450; uFlamMin.value = 36 * bufH / 450; uFlamFlap.value.z = 2.2 * bufH / 450;
      // the lens's frame, read by the site's own lines: cP for the size a far ship is held at; cR, cU, cF and cFl, cUl (forward
      // and up with any dive beyond 11 degrees taken out) only for the site's three stragglers of the last straight (PASS)
      const e = camera.matrixWorld.elements;
      cP.set(e[12], e[13], e[14]); cR.set(e[0], e[1], e[2]).normalize(); cU.set(e[4], e[5], e[6]).normalize(); cF.set(-e[8], -e[9], -e[10]).normalize();
      cFl.copy(cF); if (cFl.y < -0.2) { const k = Math.sqrt(0.96) / Math.max(Math.hypot(cF.x, cF.z), 1e-4); cFl.set(cF.x * k, -0.2, cF.z * k); }
      cUl.crossVectors(cR, cFl).normalize();
      // ---- ships under way (their wakes follow through the sea's uniforms); gulls trail the fishing boat
      const farShips = smoothstep(FAR_ALT[0], FAR_ALT[1], alt);                        // the range rule (FAR_ALT, FAR_HOLD: the houses have the same)
      for (let i = 0; i < SHIPS.length; i++) {
        const s = SHIPS[i], x = s.x + s.dx * s.v * time, z = s.z + s.dz * s.v * time;
        s.mesh.position.set(x, SEA_Y + 0.5 * Math.sin(time * 0.5 + i), z); s.mesh.rotation.z = 0.02 * Math.sin(time * 0.6 + i * 2);
        // the range rule (FAR_ALT, FAR_HOLD), in metres: from high in the climb a ship further off than FAR_HOLD m is held at the
        // size it has at FAR_HOLD m and, beyond twice that range, stands half as tall again, so the far hulls still read from the top
        const sd = Math.hypot(x - cP.x, SEA_Y + root.position.y - cP.y, z - cP.z), sk = lerp(1, Math.max(1, sd / FAR_HOLD), farShips);
        s.mesh.scale.set(sk, sk * lerp(1, 1.5, farShips * smoothstep(FAR_HOLD, 2 * FAR_HOLD, sd)), sk);
        uShip.value[i].set(x, z, s.dx, s.dz);
        if (i === 8) uGull.value.set(x - s.dx * 14, SEA_Y + 5, z - s.dz * 14);
      }
      // ---- the pair on the nest: bills thrown back, clattering (the first throw is held over the nest's stretch of the route, nestK)
      for (let i = 0; i < 2; i++) {
        const n = nestPair[i], c = (time / 7.5 + n.seed) % 1;
        let th = smoothstep(0, 0.08, c) * (1 - smoothstep(0.42, 0.56, c));
        if (i === 0) th = Math.max(th, nestK(d0));
        n.neck.rotation.x = -th * 1.9 + th * 0.1 * Math.sin(time * 36 + i) + 0.06 * Math.sin(time * 0.9 + i * 2);
      }
      // ---- scud ribbons streaming down the last straight (they fade in and out at the ends of their run: no popping). They
      // exist only once the lens is on that straight: before it the ring sits alone in its dark dimple
      const scudShow = smoothstep(0.35, 0.97, lk);
      for (let i = 0; i < scud.length; i++) {
        const s = scud[i], k = ((time * s.sp + s.off) % 24) / 24, fade = smoothstep(0, 0.16, k) * (1 - smoothstep(0.84, 1, k)) * scudShow;
        v1.copy(s.home).addScaledVector(scudF, (12 - 24 * k) * s.run);
        const g = Math.min(1, fade * 6);                                 // nothing at all is left of it where its run wraps
        m4.compose(v1, s.q, s1.set(s.r * s.len * (0.25 + 0.75 * fade) * g + 1e-4, s.r * 0.3 * g + 1e-4, s.r * 0.9 * s.sy * fade + 1e-4)); scudMesh.setMatrixAt(i, m4);
      }
      scudMesh.instanceMatrix.needsUpdate = true;
      // ---- the entry trio: 9 to 15 m dead ahead, labouring up; from u 0.12 they pull up and away into the stair
      const away = smoothstep(0.12, 0.24, uu), show = 1 - smoothstep(0.22, 0.27, uu);
      for (let i = 0; i < 3; i++) {
        const t = trio[i], d = d0 + t.lead + away * 24;
        path.posAtDist(d, v1); path.tangentAtDist(d, s1);
        bx.crossVectors(s1, Y_UP).normalize();                           // the path's right
        v1.addScaledVector(bx, t.lat * (1 + away)); v1.y += t.up + away * 17 + 0.3 * Math.sin(time * 2.1 + i * 2.2);
        t.m.position.copy(v1); t.m.scale.setScalar(Math.max(show, 0.001)); t.m.visible = show > 0.001;
        s1.y += 0.5 + 0.15 * away; aim(t.m, s1, 0.5 * smoothstep(0.085, 0.14, uu));     // nose up: their backs are turned to the lens
      }
      // ---- close company: the birds of our own lane (see laneBirds). Station on the route by the clock and the bird's own
      // lane speed; place, heading and bank from the route at that station
      for (let i = 0; i < laneBirds.length; i++) {
        const b = laneBirds[i], av = Math.abs(b.dv);
        const x = ((((time - b.at) * av + (b.dv < 0 ? b.front - ZONE[1] : ZONE[0] + b.back)) % b.P) + b.P) % b.P, rel = b.dv < 0 ? b.front - x : x - b.back;
        const st = d0 + rel, above = smoothstep(b.front - 7, b.front, rel), join = smoothstep(LANE0 - 30, LANE0 + 25, st), leave = smoothstep(LANE1 - 30, LANE1 + 10, st);
        const show = (1 - smoothstep(b.front - 1.5, b.front, rel)) * smoothstep(-b.back, -b.back + 2, rel) * smoothstep(LANE0 - 30, LANE0 - 22, st) * (1 - smoothstep(LANE1, LANE1 + 10, st));
        b.m.visible = show > 0.002; if (!b.m.visible) continue;
        const lat = b.lat + 0.35 * Math.sin(time * b.wp + b.ph), up = b.up + 0.25 * Math.sin(time * b.wp * 1.7 + b.ph * 2) + 8 * above - 14 * (1 - join) + 16 * leave;
        const rr = Math.max(Math.hypot(lat, up), 1e-3), kk = Math.max(rr, LANE_CLEAR) / rr;
        flyLane(b.m, st, lat * kk, up * kk, 0.05 * Math.cos(time * b.wp + b.ph), 0.3 * (1 - join) - 0.12 * above + 0.2 * leave, 0.06 * Math.sin(time * 0.9 + b.ph * 3), b.size * show);
        b.m.material.uniforms.uSolo.value.x = 1 - join;                 // labouring up into the lane from the scrub
      }
      for (let i = 0; i < ownBirds.length; i++) {
        const b = ownBirds[i], st = d0 + b.at + b.amp * Math.sin(time * b.wp + b.ph);
        const join = smoothstep(LANE0, LANE0 + 55, st), leave = smoothstep(LANE1 - 30, LANE1 + 10, st);
        const show = smoothstep(LANE0, LANE0 + 8, st) * (1 - smoothstep(LANE1, LANE1 + 10, st));
        b.m.visible = show > 0.002; if (!b.m.visible) continue;
        flyLane(b.m, st, 0.3 * Math.sin(time * b.wp * 0.8 + b.ph * 2), 0.2 * Math.sin(time * b.wp * 1.7 + b.ph * 3) - 14 * (1 - join) + 16 * leave, 0.05 * Math.cos(time * b.wp + b.ph), 0.3 * (1 - join) + 0.2 * leave, 0.06 * Math.sin(time * 0.9 + b.ph * 3), b.size * show);
        b.m.material.uniforms.uSolo.value.x = 1 - join;
        path.tangentAtDist(clamp(st, 0, L), v2); bz.set(0, 0, 0);
        for (const n of ownNear) {
          if (!n.visible) continue;
          v1.subVectors(b.m.position, n.position); const al = v1.dot(v2);
          if (v1.lengthSq() >= b.room * b.room) continue;
          v1.addScaledVector(v2, -al); const pl = v1.length();
          if (pl < 1e-3) v1.set(0, -1, 0); else v1.divideScalar(pl);
          bz.addScaledVector(v1, Math.sqrt(b.room * b.room - al * al) - pl);
        }
        b.m.position.add(bz);
      }
      // ---- the last straight: the site's three stragglers (see PASS), flown in the lens's frame by the site's own lines
      for (let i = 0; i < company.length; i++) if (i !== 1) company[i].visible = false;
      let crossBusy = false;
      for (let i = 0; i < PASS.length; i++) {
        const q = PASS[i], k = (uu - q[1]) / (q[2] - q[1]);
        if (k <= 0 || k >= 1) continue;
        const m = company[q[0]], kin = 1 - smoothstep(0, 0.25, k), kout = smoothstep(0.75, 1, k), dr = (k - 0.5) * 0.9 * Math.sign(q[8] - q[6]);
        const x = q[4] + (q[6] - q[4]) * kin + (q[8] - q[4]) * kout + dr + 0.12 * Math.sin(time * 0.7 + i * 2.1);
        const y = q[5] + (q[7] - q[5]) * kin + (q[9] - q[5]) * kout + 0.14 * Math.sin(time * 1.1 + i * 1.3);
        m.position.copy(cP).addScaledVector(cF, q[3] + 0.3 * Math.sin(time * 0.4 + i * 2)).addScaledVector(cR, x).addScaledVector(cU, y);
        v1.copy(cFl).addScaledVector(cR, q[10]).addScaledVector(cUl, q[11] + 0.03 * Math.sin(time * 0.6 + i)); aim(m, v1, q[12] + 0.05 * Math.sin(time * 0.9 + i * 1.7));
        m.scale.setScalar(q[13]); m.visible = true; if (q[0] === 1) crossBusy = true;
      }
      // ---- 13 s: the stork that slides across the lens wingtip to wingtip. It flies a lane of its own that lies 7 m inside
      // ours below this place (clear of the watchtower, which stands outside the foot of the lane) and 7 m outside it
      // above, crossing our line where the route is at the beat; we overhaul it
      // at 1 m/s (0.07 m to the metre flown), and where the route is at the beat it is 3 m ahead of the lens, on our line
      {
        const rel = 3 - 0.07 * (d0 - BEAT_C), st = d0 + rel, q = 0.16 * (st - BEAT_C - 3) / 7, th = Math.tanh(q);
        const show = smoothstep(-6, -4, rel) * (1 - smoothstep(14, 16, rel)) * smoothstep(LANE0 - 30, LANE0 - 22, st), join = smoothstep(LANE0 - 30, LANE0 + 25, st);
        crosser.visible = show > 0.002;
        if (crosser.visible) {
          flyLane(crosser, st, -7 * th + 0.1 * Math.sin(time * 0.7), -1.9 + 0.1 * Math.sin(time * 1.3) - 14 * (1 - join), -0.16 * (1 - th * th), 0.3 * (1 - join), 0.05 * Math.sin(time * 0.9), 1.25 * show);
          crosser.material.uniforms.uSolo.value.x = 1 - join;
        }
      }
      // ---- 17 s: the kite that crosses against the grain. Its course is a line of its own in the scene that swings from
      // 12 m inside our lane across it to 12 m outside; it comes DOWN that line at 0.6 m to the metre we fly, crosses our
      // line 10 m ahead, is 6 m from the lens where the route is at the beat and passes 3 m off our left shoulder
      {
        const st = BEAT_K + 5.5 - 0.6 * (d0 - BEAT_K), rel = st - d0, th = Math.tanh(0.825 * (st - BEAT_K - 7.3) / 12);
        const show = smoothstep(-9, -5, rel) * (1 - smoothstep(60, 75, rel)) * smoothstep(LANE0 - 10, LANE0 + 10, st) * (1 - smoothstep(LANE1 - 10, LANE1, st));
        soloKite.visible = show > 0.002;
        if (soloKite.visible) {
          const U = kiteMat.uniforms, sc = clamp(st, 0, L);
          path.posAtDist(sc, v1); path.tangentAtDist(sc, s1); s1.y = 0; s1.normalize(); bx.set(-s1.z, 0, s1.x);
          U.uCentre.value.copy(v1).addScaledVector(bx, 12 * th); U.uCentre.value.y = KITE_Y;   // (its line is level: a kite circles, it does not climb the lane)
          v2.copy(s1).addScaledVector(bx, 0.825 * (1 - th * th)).multiplyScalar(-1).normalize();
          U.uFwd.value.copy(v2); U.uRight.value.crossVectors(Y_UP, v2).normalize(); U.uBank.value = 0.6; U.uShow.value = show;
        }
      }
      // ---- 24 s (the rare visit): the flamingo skein on its own straight course (FLAM) through the kettle's middle, 25 m under the lane; where it is
      // on that line is given by the metres flown
      if (flam) {
        const x = (d0 - FLAM.d) * FLAM.k, U = flamMat.uniforms;   // (x: the skein's middle; its leader flies 20 m ahead of that)
        flam.visible = Math.abs(x) < 160;
        if (flam.visible) { U.uCentre.value.copy(FLAM.o).addScaledVector(FLAM.c, x + 20); U.uBank.value = 0; U.uShow.value = smoothstep(-160, -130, x) * (1 - smoothstep(130, 160, x)); }
      }
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.pointAt(0)) }, 0);

    // ================================================================ RETURN
    return {
      scene, path, duration: DURATION,
      // the flight slows to 0.55 of its speed for the look back down (the tilt, the hold over the rings and most of the lift)
      // and is back to speed for the last tenth of the path
      pace: paceOf,
      camera: { fov: 62, near: 0.3, far: 18000, lookAhead: 24, sway: 0.6, bank: 0.36 },   // (bank 0.36: the horizon cants 6 degrees in the climb)
      // THE GAZE. The path circles and climbs; the gaze never looks up the kettle. (1) the pair on the nest; (2) all through the
      // climb it rests a little below level on the stair of storks ahead (so the horizon sits two fifths down the page and
      // backs are seen against land and sea); (3) at the top THE DIRECTOR (see THE GAZE above update), once and at weight 1: a
      // tilt of six and a half seconds down into the funnel, two seconds held over its rings, a three-second lift of the head to the ring.
      pois: [{ at: gazeAt, from: 0, to: 1, weight: 1, fade: 0.02 }],
      portal: { shape: 'circle', radius: 7, color: '#FF6EC0', glow: 1, tilt: true, revealDistance: 190 },
      // POST: the page is pre-compensated for the tone curve and divides by this exposure, so paper lands on its hex and
      // stays under the bloom threshold; only the ring blooms. No vignette, grain or aberration: the print brings its own.
      post: { exposure: 3, bloom: { strength: 0.3, radius: 0.5, threshold: 1.1 }, grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      ride: 'great-bird', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
