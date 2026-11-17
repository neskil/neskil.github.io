// THE LAKE TAKES FLIGHT - Lake Natron from a low biplane.
// Crimson brine crazed with rafts of white trona crust, Ol Doinyo Lengai dead ahead with its reflection, a pink
// shoreline that turns out to be birds, and the liftoff wave (src/parts/natron-liftoff.js) that starts at the wingtips,
// outruns the nose, and is then caught until the flock closes over the wings. The ring stands in the water in a lane
// the birds open under the cone.
//
// World space: water at y = 0. The flight ends heading -Z; the cone is drawn "at infinity" on the -Z axis, so it is on
// the entry axis and above the ring at the exit. The sun stays behind the left shoulder in the morning, at dawn, at
// noon, under the moon and in the rains. In the evening it is the site's sun: low ahead of the right wingtip, its
// glitter path on the water to the right of the route, its disc in the picture at the top of the last swing, never
// behind the ring. The sky is the site's too: lit cirrus on the morning, dawn, evening and noon looks, an overcast in
// the rains. Both are named departures from the design ("No clouds", "The water ahead holds no sun glare", the evening
// sun "over the right shoulder") that stand: see LOOKS.
// Seeded looks: morning (default), dawn, golden evening, full moon, the short rains, hazy noon; seasons october
// (sitting birds on the nest bar), december (a creche of grey chicks herded over the flats), dry peak (white crust cut
// by blood-red leads); cast and counts by seed and ctx.vary.density. Rare: the fish eagle stoops across the nose at
// 0.62 of the route and the sheet unzips early.
//
// The route (built from a heading and a height over path distance d, see "route"): the brief's level entry, straight
// down the cone's axis from 8.8 m, sinking to 4.7 m by d 200, down an open lead of brine that carries the cone's
// reflection (a dark diamond on the axis), banks of crazed salt either side, feeding parties wading eight metres off
// the line; the low pass over the crust at d 300; right to 29 degrees by d 480 (the cone left of the nose), hard left
// through 54 degrees from d 590 to 770 at three metres over the water, inside the rising flock (the cone crosses to the
// right), then right through 63 degrees from d 848 to 984, sideways through the thick of the flock (the cone crosses
// to the left edge of the frame), and back onto the cone by d 1130 for 70 m straight to the ring.
//
// WHAT EVERY PLACING, HIDING AND TIMING RULE IS KEYED TO.
// Path distance and metres off the route's line: the feeding groups of the approach (one rule from the entry to the
// band's own feeding parties, the gap between them following the lens height; no other company is stood in the
// lead); the pool party and the marabou by the low pass a quarter of the way down the route; the feeders at the
// courting block's two ends; the runners (the stragglers blocks: by band station, from 0.6 m off the line outward
// on both sides, as the site lays them; nothing moves them); plates awash, strings of foam and cat's paws (uRoute:
// metres along and across the route's line, from the entry to the band without a gap); crust, banks, rafts, nests,
// grass (world coordinates or path distance); the last lane (no raft within 15 m of the line from 0.91 of the
// route's length to the ring).
// A margin in space: the only water kept bare of standing birds is the lane under the airframe (LANE_HALF, the
// wingtip and seven tenths of a metre either side of the route's line): it is kept by the birds that stand when
// the plane comes by, not by the runners, which run on the water and skim under the airframe as we come over them.
// The feeding groups wade from the design's eight metres either side of the line outward, and a bird that leaves
// the picture by a lower corner is the flight.
// Metres from the eye (ahead, right, up) and nothing else: the escorts, the birds streaming beside the cockpit, the
// blizzard (seats dealt in metres round the eye): each shows from 78 m ahead to 6 m astern. The staged risers are
// keyed to the band and the liftoff line instead: each stands at its own station in the band (path distance and
// metres off the line), looks up, runs seven metres and lifts as the line reaches it, then climbs to its place in
// the wall (metres ahead of the eye, across the band, above the water), and is hidden when it is 6 m astern.
// Path distance and metres off the line again: the lake floor's salt polygons and the plates awash under the approach
// (lake coordinates, masked by the route's line), and the room each feeding group keeps clear of plates (uGrp).
// The share of the route flown (u): the pelicans (0.16: the site's key and track, kept unchanged; the design names them
// by a time, "at 4 s the pelicans cross 28 m ahead", not by a place of the route); where the brief's journey names the
// beat: the eagle (rare, 0.62), the
// four wall parties (the site's moments 0.70, 0.79, 0.84 and 0.87, with its headings, lead and show rule, unchanged),
// the blizzard's stretch (the design's 0.62 to 0.76), the escort keys. The first risers and the first runners are
// keyed to no share of the route: the first of the wave's staged risers stands at the band station the liftoff line
// has reached when its lead first holds 16 m (WALL_NEAR + RISER_GAP + 1) and lifts when the line comes to that
// station; the first runners stand from band station RUN_S0 and lift by the same line and their own delay.
// The plane's shadow: the real eye and the
// sun. No bird is moved by the lens: a bird that flies lower than the eye keeps to the side of the route's line by a
// rule of the route (escAt). No rule is keyed to a list of positions or to a seed's number.
//
// In the scene: the lake sheet (LAKE_FRAG: brine mirror with the sky and the cone in it, crust drawn from the footprint
// a pixel has across each line, plates crazed into hand-span tiles, a shoreline in metres, the wave's pattering line
// and its dark mass in the mirror, the biplane's shadow: two wing bars, fuselage and tail, crisp on crust and soft on
// brine); the wave's body (WAVE_VERT: 3,600 risers, one quad a bird; the build deals 64 in 100 of them round 44 loose
// parties, each party with its own place across the band, its own station, height and spread, and strews the rest
// singly and low: streams and gaps, not an even scatter); spray crowns along the liftoff line
// (CROWN_VERT); world-built pelicans and eagle (BIG_VERT); the cone, its steam, pale scarps, Gelai; about 2,000 nest
// cones on the bar; seep grass; far ribbons of flocks on the wing; the December creche; dust, down feathers, devils.
//
// The flight, by share of the route: feeding groups either side of the lead from the entry to the band, and the far
// skein crossing overhead at the start; a skein of nine overtaken on the side opposite the pelicans' (the left on
// three seeds in four); pelicans in line astern crossing 28 m
// ahead of the nose (0.16); the low pass over the crust with three marabou on the left and a pool party on the right
// (a quarter of the way); our shadow over the plates on the down-sun side; the courting block wheeling beside the
// left wingtip (abeam at 0.348); the first runners look up, turn and run on the water under the airframe and either
// side of it, then skim on below the wheels (from band station RUN_S0, about a third of the way down the route); THE
// WAVE as a wall with a base (to 0.64); rare eagle wing-over across the nose (0.58 to 0.66); inside the flock,
// escorts beside the cockpit and low over their reflections (0.6 to 0.87); four parties crossing the nose through the
// last swing; the lane, the ring with its reflection under the cone, the last birds over its rim (0.87 to 0.95).
// pace: the approach is a little brisk (1.12, see "PACE"); the flight lingers (0.84) from the first runners on, slower
// still (0.74) from the low pass under the flock at 0.56 through the last swing to 0.86, and back to 1.0 for the ring.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, BIRD_CLOCK } from '../parts/natron-liftoff.js';

const PALETTE = ['#9E1B2C', '#5C0F1E', '#F3A0B4', '#D81E3A', '#F2EEE6', '#CBDDE3', '#6E6F73'];
const HERO_PALETTE = ['#9E1B2C', '#5C0F1E', '#F9C4D0', '#D81E3A', '#F2EEE6', '#CBDDE3', '#6E6F73'];   // a paler pink, so bodies read against crimson
const N_GRP = 40;       // the feeding groups of the approach whose water the plates awash keep clear of
const N_POOL = 36;      // pools the shaders draw with their own crisp, broken shores (the feeding groups' in the banks and on the crust first)
const CONE = { dist: 3400, H: 560, Rb: 1050, t0: 0.055, k: 1.55 };   // drawn 9 degrees tall
const coneH = (t) => CONE.H * Math.pow(1 - Math.max(t, CONE.t0), CONE.k);

// sun: elevation, azimuth (kit convention: 0 = -Z, +90 = +X). Colours are premultiplied by the intensities below.
const LOOKS = {
  // THE SKY AND THE EVENING SUN ARE THE SITE'S, LINE FOR LINE: a named departure from the design that stands. The design
  // says "Cloudless morning", "No clouds" and "The water ahead holds no sun glare"; people shown both skies side by side
  // chose the site's (lit cirrus over a sky held a stop below the birds, a low evening sun with its glitter path on the
  // water) over a bare one. So the `sky` object of the morning, dawn, evening and noon looks, with its cirrus
  // (`clouds2`), and the whole evening look (sun low ahead of the right wingtip, its colour and strength, `rim`,
  // `glit`) are the site's own text and are not retuned here. The short rains keep their overcast (`clouds`); the moon
  // has no cloud. On one visit in five (ctx.vary.mood over 0.8) the cirrus is left out and the sky is bare. Nothing else
  // is drawn on the sky: its fall to a pale horizon is the kit sky's own.
  morning: { preset: 'day', el: 18, az: -128, sky: { zenith: '#4f80b4', mid: '#97bcd3', horizon: '#d2dcde', scatter: 0.2, scatterColor: '#ffe9cf', sunIntensity: 9,
      clouds2: { coverage: 0.46, softness: 0.36, scale: 0.9, opacity: 0.74, stretch: 1, haze: 0.3, lit: '#fff1e8', shade: '#c3cedb' } },
    sun: '#ffeeda', sunI: 3.0, fill: '#c6d9e2', fillI: 1.18, bounce: 0.9, fog: '#cfdadc', fogD: 0.00042, hor: '#cdd9dd', zen: '#7fa0bb',
    lum: 0.8, ripple: 0.22, wet: 0.0, salt: 1.5, exposure: 1.0, sat: 1.03, tint: '#fff9f4', shadowTint: '#1a0a14', coneHaze: 0.2, wallHaze: 0.6, portal: '#ffd9e2' },
  dawn: { preset: 'dawn', el: 3.5, az: -130, sky: { zenith: '#6f86b4', mid: '#c3a9bd', horizon: '#eac4ab', sunIntensity: 9,
      clouds2: { coverage: 0.36, softness: 0.5, scale: 0.8, opacity: 0.55, stretch: 1, haze: 0.35, lit: '#ffd9c4', shade: '#a995b4' } },
    sun: '#ffc09a', sunI: 2.7, fill: '#d2bcd0', fillI: 1.15, bounce: 0.8, fog: '#dcbcae', fogD: 0.00048, hor: '#ecc9b0', zen: '#8793b8',
    lum: 0.8, ripple: 0.16, wet: 0.0, salt: 2.0, exposure: 1.05, sat: 1.1, tint: '#fff4ec', shadowTint: '#1c1030', coneHaze: 0.3, wallHaze: 0.62, portal: '#ffd0b8' },
  // golden evening: the sun stands low ahead of the right wingtip (never behind the ring), so the flock, the cone and the
  // scarps are side and back lit all the way, and when the route swings right at u 0.79 it comes into the frame over its own path on the water
  evening: { preset: 'goldenHour', el: 9, az: 76, sky: { zenith: '#41609f', mid: '#b596a6', horizon: '#f2bd7c', horizonPow: 5.5, midPow: 1.25, scatter: 0.34, scatterColor: '#ffac5c', scatterPow: 4, sunIntensity: 11, sunSize: 1.7, sunGlow: 0.85,
      clouds2: { coverage: 0.5, softness: 0.3, scale: 1.0, opacity: 0.86, stretch: 1, haze: 0.22, detail: 0.7, lit: '#ffc4b0', shade: '#9d86ac' } },
    sun: '#ffc48a', sunI: 3.2, fill: '#bfbde0', fillI: 1.08, bounce: 1.0, fog: '#e2b888', fogD: 0.00046, hor: '#eebd84', zen: '#6680b4',
    rim: [1.9, 1.6], glit: 1, wallHaze: 0.4,
    lum: 0.8, ripple: 0.2, wet: 0.0, salt: 1.7, exposure: 1.0, sat: 1.06, tint: '#fff3e2', shadowTint: '#180c2a', coneHaze: 0.27, portal: '#ffdcae' },
  moon: { preset: 'night', el: 46, az: -125, sky: {},
    sun: '#c3d0ff', sunI: 2.1, fill: '#4c5788', fillI: 1.3, bounce: 0.5, fog: '#161d34', fogD: 0.0004, hor: '#33406c', zen: '#0e1430',
    lum: 0.55, ripple: 0.2, wet: 0.0, salt: 1.0, exposure: 1.5, sat: 1.0, tint: '#eef2ff', shadowTint: '#0a0c22', coneHaze: 0.5, wallHaze: 0.62, portal: '#cfd8ff' },
  // the short rains: an overcast (the site's `clouds`), and grey rain curtains hanging along the rift wall
  rains: { preset: 'day', el: 24, az: -134, sky: { zenith: '#6f8496', mid: '#a3b0b8', horizon: '#c3ccce', scatter: 0.05, sunIntensity: 5,
      clouds: { coverage: 0.7, softness: 0.4, scale: 1.3, lit: '#e4e4e0', shade: '#6f7a88' } },
    sun: '#fff2e2', sunI: 2.2, fill: '#bccbd4', fillI: 1.5, bounce: 0.8, fog: '#b9c4c8', fogD: 0.0006, hor: '#c5cfd2', zen: '#8497a6',
    lum: 0.85, ripple: 0.42, wet: 0.85, salt: 1.2, exposure: 1.0, sat: 1.08, tint: '#f6f8ff', shadowTint: '#140a18', coneHaze: 0.5, wallHaze: 0.8, portal: '#e6eeff' },
  noon: { preset: 'day', el: 58, az: -122, sky: { zenith: '#6d95be', mid: '#b5cbd6', horizon: '#d7dedb', scatter: 0.06, sunIntensity: 9,
      clouds2: { coverage: 0.4, softness: 0.5, scale: 0.8, opacity: 0.5, stretch: 1, haze: 0.5, lit: '#ffffff', shade: '#c5ced4' } },
    sun: '#fffaf0', sunI: 2.5, fill: '#d3dee2', fillI: 1.25, bounce: 1.0, fog: '#d2d9d6', fogD: 0.00062, hor: '#d9e0de', zen: '#84a5c0',
    lum: 0.95, ripple: 0.34, wet: 0.0, salt: 0.92, exposure: 0.98, sat: 1.08, tint: '#fffdf6', shadowTint: '#1a0a12', coneHaze: 0.55, wallHaze: 0.8, portal: '#ffe6ea' },
};

// ---------- the lake: brine mirror + trona crust, one flat sheet ----------
// crust the baked field is too coarse to carry (needs vnoise): rafts of crust standing in the band's brine (the field's
// blue channel says where they may lie) and the banks of the entry lead. The brief has open brine on the cone's axis
// (the cone and its reflection make a dark diamond there), so no crust lies on the axis: the lead runs straight down
// it, twenty-five metres wide, between two banks of crazed salt whose polygons converge on the cone either side of the
// wheels. All of it is laid in world coordinates (the route enters at the origin heading -Z).
const GLSL_RAFT = /* glsl */`
#ifndef NATRON_RAFT
#define NATRON_RAFT
uniform vec4 uCause;          // the entry lead: centre x, z where its banks end, half width, amount
uniform vec4 uRoute[34];      // the route's first half, tabulated every 16 m of -z: x, cos(heading), path distance, sin(heading)
uniform vec4 uGrp[${N_GRP}];     // where the feeding groups of the approach wade, by the route: path distance, metres right of the line, half length along it, half width across it (unused slots lie far away)
vec2 gRt;                     // set by crustExtra: routeAt(q), for whoever draws next (metres right of the line, path distance)
float gAwash;                 // set by crustExtra: how far this place is one of the plates awash beside the route
vec2 gRouteN;                 // set by routeAt: the unit vector across the route there (to its right)
// where a place lies by the route: metres right of its line, path distance (m). Good to some 30 m either side of the line.
vec2 routeAt(vec2 q){
  float f = clamp(-q.y/16., 0., 32.999); int i = int(f);
  vec4 r = mix(uRoute[i], uRoute[i + 1], f - float(i));
  float dx = q.x - r.x; gRouteN = vec2(r.y, r.w);
  return vec2(dx*r.y, r.z + dx*r.w + min(-q.y, 0.) + max(-q.y - 528., 0.));
}
// the baked field (10 m texels), read through a cubic B-spline (four bilinear taps): a smooth surface with a smooth
// slope, so that no shore, shallow or clearing drawn from it can follow a texel's straight edge or step at its border
vec4 fieldTap(vec2 q){
  vec2 st = (q - uFieldRect.xy)*uFieldRect.z*384. - 0.5, i = floor(st), f = st - i, f2 = f*f, f3 = f2*f;
  vec2 w0 = (1. - 3.*f + 3.*f2 - f3)/6., w1 = (4. - 6.*f2 + 3.*f3)/6., w3 = f3/6., g0 = w0 + w1, g1 = 1. - g0;
  vec2 h0 = (i - 0.5 + w1/max(g0, 1e-4))/384., h1 = (i + 1.5 + w3/max(g1, 1e-4))/384.;
  return (textureLod(uField, h0, 0.)*g0.x + textureLod(uField, vec2(h1.x, h0.y), 0.)*g1.x)*g0.y
       + (textureLod(uField, vec2(h0.x, h1.y), 0.)*g0.x + textureLod(uField, h1, 0.)*g1.x)*g1.y;
}
// PLATES AWASH beside the route, by path distance and metres from its line, from the entry lead to the band's own
// feeding parties without a gap. Two rows on each side of the wheels, the two sides out of step:
//   the inner row: one plate (often with a smaller one off its end) in every 22 m of path, its heart 4.4 to 5.6 m off
//     the line, 5 to 12 m long and 2.2 to 3.8 m across, lying a little askew to the route; never on the line itself
//     (the cone's reflection lies there: nothing nearer than 2.9 m);
//   the outer row: one larger plate in every 30 m of path, its heart 13 to 18 m off the line, 8 to 18 m long and 4.5
//     to 8.5 m across, askew: the plates the lower corners of the picture pass over.
// No plate lies where a feeding group wades (uGrp: the groups' own places), so every bird keeps its ring and its dark
// copy. Returns a level: over 0 inside a plate, falling away outside it.
float plateOne(float along, float across, float c, float sd){
  float h1 = hash11(c*7.13 + sd), h2 = hash11(c*3.91 + sd + 5.), h3 = hash11(c*17.7 + sd + 9.), h4 = hash11(c*5.3 + sd + 13.), h5 = hash11(c*9.7 + sd + 21.);
  float th = (h1 - 0.5)*0.8, ct = cos(th), st = sin(th);
  vec2 d = vec2(along - (c + 0.3 + 0.4*h1)*22., across - (4.4 + 1.2*h2));
  vec2 e = vec2(d.x*ct + d.y*st, d.y*ct - d.x*st)/vec2(2.5 + 3.5*h3, 1.1 + 0.8*h4);
  float lev = 1. - dot(e, e);
  // its companion: a smaller plate lying off one end of it, a little further out
  vec2 e2 = vec2((d.x - (h5 > 0.5 ? 1. : -1.)*(4.8 + 3.6*h3))/(1.3 + 1.5*h4), (across - (4.6 + 1.3*h1))/(0.75 + 0.4*h2));
  lev = max(lev, (1. - dot(e2, e2))*step(0.3, fract(h5*2.)) - 3.*(1. - step(0.3, fract(h5*2.))));
  return h5 > 0.1 && h5 < 0.93 ? lev : -3.;
}
float plateTwo(float along, float across, float c, float sd){
  float h1 = hash11(c*4.37 + sd + 31.), h2 = hash11(c*8.11 + sd + 37.), h3 = hash11(c*13.3 + sd + 43.), h4 = hash11(c*6.7 + sd + 47.), h5 = hash11(c*11.9 + sd + 53.);
  float th = (h1 - 0.5)*1.5, ct = cos(th), st = sin(th);
  vec2 d = vec2(along - (c + 0.25 + 0.5*h5)*30., across - (13. + 5.*h2));
  vec2 e = vec2(d.x*ct + d.y*st, d.y*ct - d.x*st)/vec2(4. + 5.*h3, 2.2 + 2.*h4);
  return h5 > 0.08 ? 1. - dot(e, e) : -3.;
}
float gHalo;                  // set by crustExtra: the shallow round a plate awash (1 at its shore, 0 a metre and a half out)
float gLev;                   // set by crustExtra: the plates' own level without the finest of its three noises (over 0 inside a plate awash, falling away outside it; -9 where none can lie): smooth across a hand-span tile
float crustExtra(vec2 q, float fb, float fa){
  float r = 0.8*fb*smoothstep(0.66, 0.74, vnoise(q*0.055 + 17.) + 0.25*vnoise(q*0.21 + 5.) + 0.11*(vnoise(q*0.83 + 3.) - 0.5));
  vec2 rt = routeAt(q); float al = abs(rt.x); gRt = rt;
  float along = smoothstep(22., 46., rt.y)*(1. - smoothstep(386., 414., rt.y));      // to path distance 414, where the feeding groups' rule ends too (GRP_END)
  gAwash = 0.; gHalo = 0.; gLev = -9.;
  if (along > 0.002 && al < 27.) {
    float sd = (rt.x >= 0. ? 3.7 : 41.3) + uFieldRect.w, s = rt.y + (rt.x >= 0. ? 11. : 0.), c0 = floor(s/22.), c1 = floor(s/30.);
    float lev = max(max(plateOne(s, al, c0 - 1., sd), plateOne(s, al, c0, sd)), plateOne(s, al, c0 + 1., sd));
    lev = max(lev, max(max(plateTwo(s, al, c1 - 1., sd), plateTwo(s, al, c1, sd)), plateTwo(s, al, c1 + 1., sd)));
    // a ragged shore: the level is broken by noise a hand to a stride across, so no plate ends in a ruled or rounded edge
    lev += 1.1*(vnoise(q*0.37 + 11.) - 0.5) + 0.5*(vnoise(q*1.13 + 3.) - 0.5) + 0.2*(vnoise(q*3.9 + 7.) - 0.5) + 0.08;
    // (the stretch, the side band and the clearings only lower the level, so a plate always ends in its own ragged
    // shore, never in a soft ramp; fa is the bake's fourth channel: 0 round the courting block's feeders; uGrp clears
    // the water each feeding group wades in)
    float clr = smoothstep(0.3, 0.7, fa + 0.36*(vnoise(q*0.31 + 9.) - 0.5));
    float gd = 1e4;
    for (int i = 0; i < ${N_GRP}; i++) { vec4 gp = uGrp[i]; gd = min(gd, (length(vec2(rt.y - gp.x, rt.x - gp.y)/gp.zw) - 1.)*gp.w); }
    clr *= smoothstep(-0.4, 1.4, gd + 1.2*(vnoise(q*0.45 + 23.) - 0.5));
    lev -= 1.6*(1. - along*clr*smoothstep(2.9, 3.6, al)*(1. - smoothstep(23., 26.5, al)));
    gAwash = smoothstep(-0.03, 0.03, lev);
    gHalo = smoothstep(-0.95, -0.1, lev);
    gLev = lev - 0.2*(vnoise(q*3.9 + 7.) - 0.5);
  }
  r += min(2.2*gAwash, 0.78);
  float hw = uCause.z*(0.93 + 0.16*vnoise(vec2(q.y*0.045, 9.)));
  float cx = abs(q.x - uCause.x) + 1.6*(vnoise(vec2(q.y*0.11, 3. + step(0., q.x - uCause.x)*40.)) - 0.5) + 0.8*(vnoise(vec2(q.y*0.43, 7.) + q.x*0.2) - 0.5);
  float c = smoothstep(-1.6, 1.6, cx - hw)*smoothstep(uCause.y, uCause.y + 26., q.y)*(1. - smoothstep(40., 60., q.y));
  return r + 0.95*c*uCause.w;
}
#endif
`;
// THE BIPLANE'S SHADOW, from the real camera and the real sun. The airframe is the ride's (src/rides/biplane.js: an upper
// wing 9 m across above and ahead of the eye, a lower wing 8.2 m across below it, the struts between them, the fuselage
// from the nose 2.6 m ahead to the tail 4.4 m behind, the tailplane): each part throws its shadow down-sun by its own height over the tangent of
// the sun's elevation, so under a low sun the two wings lie apart as two bars, the upper wing's further down-sun.
// The penumbra is the sun's own half-width (0.0047 rad) times the slant distance: a hand wide from three metres up.
const GLSL_PLANE_SHADOW = /* glsl */`
uniform vec4 uShadow;         // the eye's ground point x, z; the route's heading there as -sin, -cos
uniform vec4 uShadow2;        // strength on crust, strength on brine, the eye's height (m), penumbra half-width per metre of height
uniform vec4 uShadow3;        // the down-sun vector on the ground per metre of height, in the plane's frame (x across to the right, y along, nose -y)
float sdBoxS(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }
float sdSegS(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/max(dot(ba, ba), 1e-4), 0., 1.)); }
float planeShadow(vec2 q, float softK){
  vec2 sp = q - uShadow.xy; sp = vec2(sp.x*uShadow.w - sp.y*uShadow.z, sp.x*uShadow.z + sp.y*uShadow.w);
  float h = uShadow2.z; vec2 D = uShadow3.xy;
  vec2 far = sp - D*h; if (dot(far, far) > 400.) return 0.;      // nothing of the airframe falls further than 20 m from the eye's own shadow point
  float hU = max(h + 1.24, 0.2), hL = max(h - 0.98, 0.2), hF = max(h - 1.05, 0.2), hT = max(h - 0.75, 0.2);      // upper wing, lower wing, fuselage, tailplane above the water
  vec2 pU = sp - vec2(0., -1.92) - D*hU, pL = sp - vec2(0., -1.3) - D*hL, pF = sp - vec2(0., 0.9) - D*hF, pT = sp - vec2(0., 4.05) - D*hT;
  float sU = softK*(0.03 + uShadow2.w*hU), sL = softK*(0.03 + uShadow2.w*hL);
  float dU = sdBoxS(pU, vec2(4.3, 0.55)) - 0.15, dL = sdBoxS(pL, vec2(3.9, 0.5)) - 0.15;
  float dF = sdBoxS(pF, vec2(mix(0.42, 0.13, clamp((pF.y + 3.5)/7., 0., 1.)), 3.5)) - 0.06, dT = sdBoxS(pT, vec2(1.35, 0.32)) - 0.1;
  float sh = 1. - smoothstep(-sU, sU, dU);
  sh = max(sh, 1. - smoothstep(-sL, sL, dL));
  sh = max(sh, 1. - smoothstep(-sL, sL, min(dF, dT)));
  // the interplane struts, front and rear as one streak at each of the four stations: under a low sun the two wing
  // bars lie metres apart, and these tie them into one airframe (a box kite's shadow, not two loose bars)
  vec2 aL = vec2(0., -1.3) + D*hL, aU = vec2(0., -1.92) + D*hU;
  float dS = min(min(sdSegS(sp, aL + vec2(1.3, 0.), aU + vec2(1.3, 0.)), sdSegS(sp, aL - vec2(1.3, 0.), aU - vec2(1.3, 0.))),
                 min(sdSegS(sp, aL + vec2(3.2, 0.), aU + vec2(3.2, 0.)), sdSegS(sp, aL - vec2(3.2, 0.), aU - vec2(3.2, 0.)))) - 0.09;
  return max(sh, 0.8*(1. - smoothstep(-sU, sU, dS)));
}`;
const LAKE_VERT = /* glsl */`
varying vec3 vP;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.); vP = wp.xyz;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;

const LAKE_FRAG = /* glsl */`
uniform sampler2D uField;
uniform vec4 uFieldRect;      // origin x, z, 1/size
uniform vec3 uCam, uShallow, uDeep, uOrange, uSaltCol, uSkyHor, uSkyZen, uSunDir, uSunCol, uFill, uConeCol, uPinkCol;
uniform float uCrim;          // 1 by day: the brine keeps its crimson far out and gives back the sky only near the horizon; 0 by moon and in the rains
uniform vec4 uCone;           // tan half width of the base, tan summit elevation, t0, profile power
uniform float uTime, uRipple, uLum, uWet, uSaltGain, uSaltBias, uMirage, uGlit, uPix;
uniform vec4 uMass;           // the flock's mass in the mirror: dark rose (rgb), amount
uniform vec4 uFrontP;         // the liftoff line: point on the band's axis (x, z) and the axis direction there (x, z)
uniform vec4 uFrontK;         // axis curvature there (right +), band half width, strength of the pattering line, strength of the flock's mirror
uniform vec4 uMar[3];         // marabou on the crust: x, z, height, 0
uniform vec3 uFlockCol;       // the lit pink of the birds overhead, as the mirror gives it back
uniform vec4 uPools[${N_POOL}];      // pools standing in the crust: x, z, radius, 0 (unused slots lie far away)
uniform vec4 uCloud;          // the cirrus as the mirror gives it back: colour, amount
varying vec3 vP;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
${fx.GLSL_VORONOI}
${GLSL_RAFT}
${fx.GLSL_FOG_PARS_FRAG}
uniform sampler2D uSites;
// polygon plates from the baked site grid: (distance to the plate's site, distance to its nearest edge, plate id); eN = unit vector toward that edge
vec2 gSite = vec2(0.);        // set by plates: from x to the plate's own site
vec3 plates(vec2 x, out vec2 eN){
  vec2 n = floor(x), f = x - n, mg = vec2(0.), mr = vec2(0.); float md = 8., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec4 t = textureLod(uSites, (n + g + 0.5)/64., 0.);
    vec2 r = g + 0.5 + (t.xy - 0.5)*0.6 - f; float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; id = t.z; }
  }
  float me = 8.; eN = vec2(0., 1.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec4 t = textureLod(uSites, (n + g + 0.5)/64., 0.);
    vec2 r = g + 0.5 + (t.xy - 0.5)*0.6 - f, dr = r - mr; float l2 = dot(dr, dr);
    if (l2 > 1e-5) { float l = sqrt(l2), e = dot(0.5*(mr + r), dr)/l; if (e < me) { me = e; eN = dr/l; } }
  }
  gSite = mr;
  return vec3(sqrt(md), me, id);
}
// a band of a shore between a and b metres in from its waterline, drawn from the footprint e a pixel has across it:
// a band narrower than a pixel keeps a pixel's width and pales by its share of it
float shoreBand(float s, float a, float b, float e){ return smoothstep(a - e, a + e, s)*(1. - smoothstep(b - e, b + e, s))*min((b - a)/(1.2*e), 1.); }
float gFloorLip = 0.; vec3 gFloorCol = vec3(0.);      // set by the floor of the approach: the rims that break the surface
float rip(vec2 q){ return vnoise(q*2.1 + uTime*vec2(0.62, 0.38)) + 0.5*vnoise(q*5.3 - uTime*vec2(0.5, 0.75)); }
${GLSL_PLANE_SHADOW}
// what the mirror sees: the sky gradient with its cirrus, and the cone standing at infinity on the -Z axis
vec4 mirrorSky(vec3 R){
  float up = clamp(R.y, 0., 1.);
  vec3 sky = mix(uSkyHor, uSkyZen, sqrt(up));
  vec2 cq = R.xz/(up + 0.16);
  float cl = vnoise(cq*vec2(0.45, 1.25) + vec2(7.3, uTime*0.004))*0.62 + vnoise(cq*vec2(1.1, 3.1) + 2.7)*0.38;
  sky = mix(sky, uCloud.rgb, smoothstep(0.5, 0.78, cl)*uCloud.a*smoothstep(0.015, 0.14, up));
  float fz = max(-R.z, 1e-4);
  float t = abs(R.x)/fz/uCone.x;
  float prof = uCone.y*pow(max(1. - max(t, uCone.z), 0.), uCone.w)/pow(1. - uCone.z, uCone.w);
  float el = R.y/fz;
  float inside = (1. - smoothstep(prof - 0.004, prof + 0.004, el))*step(0., -R.z)*step(t, 1.);
  inside *= smoothstep(0., 0.012 + uMirage*0.05, el);
  return vec4(mix(sky, mix(uConeCol, uSkyHor, 0.12 + 0.5*exp(-max(el, 0.)*40.)), inside*0.94), inside);
}
void main(){
  vec3 V = uCam - vP; float dist = max(length(V), 1e-3); V /= dist;
  vec2 q = vP.xz;
  float latM = dist*uPix, fp = latM/max(V.y, 0.03);             // metres one pixel covers on the sheet: across the view, along it
  vec2 vh = V.xz/max(length(V.xz), 1e-4);                       // the view's direction over the sheet
  // ---- where crust lies: a baked field (10 m) broken up by finer noise ----
  vec4 fld = fieldTap(q);
  float field = fld.r;
  float n1 = vnoise(q*0.021 + 3.1), n2 = vnoise(q*0.083 + 11.7), n3 = vnoise(q*0.31);
  float sd = field + uSaltBias + (n1 - 0.5)*0.22 + (n2 - 0.5)*0.12 + (n3 - 0.5)*0.05*(1. - smoothstep(1., 6., fp));
  sd += 0.6*fld.g*smoothstep(0.7, 0.79, vnoise(q*0.12 + 31.) + 0.2*vnoise(q*0.47 + 3.));   // crust islets and pancakes out in the leads
  sd += crustExtra(q, fld.b, fld.a);                             // rafts in the band, the banks of the entry lead, the plates awash beside the route
  // ---- THE CRUST'S EDGE: ONE LAW FOR EVERY SHORE ON THE LAKE (bank, raft, islet, plate awash), keyed to nothing but
  //      the edge itself: metres in from the waterline, the way the shore faces, the sun. A raft of trona is a slab
  //      that ends in a shore, not a cut: the brine shoals and pales for two or three hands off it; its outermost tiles
  //      are broken away one by one, so the outline is ragged at the scale of the plates' own hand-span tiles and their
  //      cracks stand open and full of brine: these are the wet apron, a hand or two wide, where the brine laps (darker,
  //      pinker, glossy); a thin broken frost line at the top of it; and the slab's raised rim: bright on the shores
  //      that face the sun, dim on those turned from it, its shadow thrown down-sun over the apron and the water or
  //      back over the plate. Every band is drawn from the footprint a pixel has across the shore (shoreBand). ----
  // metres from the shoreline (+ on the crust, - in the brine), from the field's own slope on the screen
  // (the slope is never taken as flatter than 0.04 a metre: where the field lies nearly level just under the shore's
  // value the "shore" is far away, and the shallows and the foam flecks below fade out by the field's own
  // smooth value instead of spreading over the flat as a pale patch)
  vec2 gsd = vec2(dFdx(sd), dFdy(sd)); float gl = max(length(gsd), 1e-5); gsd /= gl;
  float mpp = max(sqrt(gsd.x*gsd.x*latM*latM + gsd.y*gsd.y*fp*fp), 1e-5);
  float dSh = (sd - 0.5)/max(gl/mpp, 0.04);
  // for the edge's own bands: metres in from the waterline (dE) and the unit vector into the crust (nE), from the
  // level's true slope over the sheet (the screen's two differences carried back to metres on the lake). The plates
  // awash are measured by their own level (gLev), every other shore by the field's (sd without the plates' step: a
  // step has no slope to measure by). The slope is taken down to 0.012 a metre for the field and 0.15 for a plate, so
  // on a gently shelving shore the bands keep their width in metres and no nearly level crust is eaten away. A plate
  // counts only where the level's own rule lets its crust show (the field over -0.28).
  vec2 qdx = dFdx(q), qdy = dFdy(q); float qdet = qdx.x*qdy.y - qdx.y*qdy.x; qdet = abs(qdet) < 1e-9 ? 1e-9 : qdet;
  float sd0 = sd - min(2.2*gAwash, 0.78);
  vec2 gA = vec2(qdy.y*dFdx(sd0) - qdx.y*dFdy(sd0), qdx.x*dFdy(sd0) - qdy.x*dFdx(sd0))/qdet;
  vec2 gB = vec2(qdy.y*dFdx(gLev) - qdx.y*dFdy(gLev), qdx.x*dFdy(gLev) - qdy.x*dFdx(gLev))/qdet;
  float gAl = max(length(gA), 0.012), dEA = (sd0 - 0.5)/gAl, dEB = min(gLev/clamp(length(gB), 0.15, 4.), (sd0 + 0.28)/gAl);
  float dE = max(dEA, dEB);
  vec2 nE = dEA > dEB ? gA : gB; nE /= max(length(nE), 1e-6);
  float shK = 1. - smoothstep(0.35, 1.6, fp);                    // how well a shoreline a metre wide can be drawn here
  float eaS = dot(nE, vh), wSh = sqrt(eaS*eaS*fp*fp + (1. - eaS*eaS)*latM*latM), eSh = max(0.012, 0.6*wSh);      // a pixel's footprint across the shore
  // how deep the shore is broken (stretch by stretch), and the shore line itself: the level's own line bitten back by
  // up to 0.22 m in bays a stride across, and then tile by tile by up to nib (0.11 to 0.25 m: a tile or so). On every
  // shore of the field the crust only loses tiles to the brine, so nothing that keeps off dry crust by the level alone
  // (a reflection, a spray crown) comes to lie on a tile; a plate awash is measured without the finest noise of its
  // level (0.26 m: a tile cannot follow it), so its tile line stands within a tile's width of the level's own.
  float rag = 0.2 + 0.25*vnoise(q*0.29 + 51.), nib = 0.55*rag, sW = dE - 0.5*rag*vnoise(q*1.3 + 7.);
  // the hand-span tiles the plates are crazed into (0.19 m; turned and warped against the plates, so the tiles never
  // line up in rows): found here once, for the shore and for the crazing below. A tile stands or is gone whole, by the
  // shore's distance at the tile's own site and the tile's own number: no outline cuts through a tile.
  vec3 pc = vec3(0.5); vec2 eC = vec2(0., 1.); float dC = 1., wC = fp, sTile = sW - nib/3.;
  if (fp < 0.8 && dE > -0.8) {
    mat2 RC = mat2(0.82, 0.57, -0.57, 0.82);
    pc = plates(RC*q*5.2 + 0.8*vec2(vnoise(q*1.7 + 3.), vnoise(q*1.7 + 41.)) + vec2(37.7, 11.3), eC); eC = eC*RC;
    vec2 tq = (gSite*RC)/5.2;                                    // from here to the tile's site, metres
    float ca = dot(eC, vh); dC = pc.y/5.2; wC = sqrt(ca*ca*fp*fp + (1. - ca*ca)*latM*latM);
    sTile = dE + dot(nE, tq) - 0.5*rag*vnoise((q + tq)*1.3 + 7.) - nib*pc.z*pc.z;
  }
  // the shore's bands, in metres in from the line: the apron's inner limit (the apron is the outermost tiles, the
  // tile or so that the brine laps: 0.16 to 0.22 m), the frost line on it, the rim's two flanks; and the shelf under
  // the brine off it
  float aprIn = 0.5*nib + 0.1;
  // the apron's tiles are cut free of their neighbours, their cracks open to the brine; the last tile before the
  // brine is worn down to a stump
  float gapH = 0.004 + 0.02*(1. - smoothstep(0., 0.2, sTile)) + 0.08*(1. - smoothstep(0., 0.05, sTile));
  float mTile = step(0., sTile)*(1. - (1. - smoothstep(aprIn - 0.04, aprIn + 0.1, sW))*(1. - smoothstep(gapH, gapH + max(0.8*wC, 0.004), dC)));
  // where a tile is smaller than a pixel: the share of the tiles that stand
  float mSoft = smoothstep(-nib/3. - eSh, nib/3. + eSh, sW - nib/3.);
  float crustK = mix(mSoft, mTile, 1. - smoothstep(0.07, 0.22, fp));
  float apron = (1. - smoothstep(aprIn - eSh, aprIn + eSh, sW))*shK;
  float frost = shoreBand(sW, aprIn - 0.02, aprIn + 0.03, eSh)*(0.4 + 0.6*smoothstep(0.3, 0.6, vnoise(q*1.9 + 13.)))*shK;
  float rimH = (0.3 + 0.7*smoothstep(0.3, 0.65, vnoise(q*2.6 + 29.)))*shK;      // the rim stands higher in some stretches than in others
  float rimOut = shoreBand(sW, aprIn + 0.02, aprIn + 0.1, eSh)*rimH, rimIn = shoreBand(sW, aprIn + 0.1, aprIn + 0.22, eSh)*rimH;
  float shelf = smoothstep(-0.45, 0., sW)*shK;
  // ---- pools standing in the crust (where the feeding parties wade): a crisp, broken shoreline drawn from the pool's own centre ----
  float dP = 1e4;
  for (int i = 0; i < ${N_POOL}; i++) { vec4 pl = uPools[i]; dP = min(dP, length(q - pl.xy) - pl.z); }
  dP += (vnoise(q*0.5 + 5.) - 0.5)*1.7 + (vnoise(q*2.1 + 9.) - 0.5)*0.4*(1. - smoothstep(0.5, 3., fp));
  float aaP = 0.03 + 0.6*fp, pIn = 1. - smoothstep(-aaP, aaP, dP);
  float wasCrust = smoothstep(0.48, 0.56, sd);                   // a pool is drawn only where it stands in crust
  float pShal = pIn*(1. - smoothstep(0.15, 1.7, -dP))*wasCrust;  // its orange shallows
  // wind: soda dust streaming low over the crust, ruffled bands running down the leads
  vec2 wq = vec2(q.x*0.342 - q.y*0.94, q.x*0.94 + q.y*0.342);
  float gust = vnoise(vec2(wq.x*0.2, wq.y*0.028 - uTime*0.5))*vnoise(vec2(wq.x*0.05 + 5., wq.y*0.011 - uTime*0.17));
  gust = smoothstep(0.1, 0.42, gust)*(1. - smoothstep(6., 40., fp));
  float salt = crustK*(1. - pIn);
  float shore = max(1. - smoothstep(0., 0.13, abs(sd - 0.5)), (1. - smoothstep(0., 0.4, abs(dP)))*wasCrust);       // band around the waterline
  // ---- the wave on the water: where the liftoff line is, measured along and across the band ----
  vec2 fq = q - uFrontP.xy; float fds = dot(fq, uFrontP.zw), flat0 = fq.x*-uFrontP.w + fq.y*uFrontP.z;
  flat0 -= 0.5*uFrontK.x*fds*fds;
  float inBand = (1. - smoothstep(uFrontK.y*0.75, uFrontK.y*1.45, abs(flat0)))*step(abs(fds), 400.);
  float clump = 0.55 + 0.45*smoothstep(0.25, 0.7, vnoise(q*0.045 + 4.7));
  float runZ = smoothstep(-3., 7., fds)*(1. - smoothstep(38., 58., fds))*inBand*clump*uFrontK.z;      // birds pattering here
  float wakeZ = smoothstep(-150., -30., fds)*(1. - smoothstep(0., 30., fds))*inBand*uFrontK.z;        // rings settling behind the line
  // ---- brine ----
  float paw = max(max(smoothstep(0.5, 0.78, vnoise(q*0.03 + uTime*vec2(0.06, 0.035))), gust*0.8), max(0.12*wakeZ, 0.7*runZ));
  float r0 = rip(q); vec2 g = vec2(rip(q + vec2(0.3, 0.)) - r0, rip(q + vec2(0., 0.3)) - r0);
  float fine = 1. - smoothstep(0.02, 0.12, fp);                    // close under the wheels: wavelets a hand wide
  float r1 = vnoise(q*11. + uTime*vec2(1.1, 0.7)) + 0.6*vnoise(q*23. - uTime*vec2(0.9, 1.4));
  g += vec2(vnoise(q*11. + vec2(0.05, 0.) + uTime*vec2(1.1, 0.7)), vnoise(q*11. + vec2(0., 0.05) + uTime*vec2(1.1, 0.7)))*fine*1.6 - vnoise(q*11. + uTime*vec2(1.1, 0.7))*fine*1.6;
  float amp = uRipple*(0.1 + 0.75*paw)/(1. + dist*0.035);
  vec3 N = normalize(vec3(-g.x*amp, 1., -g.y*amp));
  float cv = clamp(dot(N, V), 0., 1.), m = 1. - cv;
  float m2 = m*m, Fr = mix(0.03 + 0.9*m2*m2*sqrt(max(m, 0.)), 0.06 + 0.9*m2*m2*m2*m2, uCrim);                  // a dense, dark brine: crimson from above and far out over the lake, paling to the sky only in the last few degrees above the horizon
  Fr = mix(Fr, max(Fr, 0.13), pIn*wasCrust*(1. - smoothstep(0.4, 3.2, -dP)));      // water over pale mud shows a little more sky: along a pool's own shore only (its middle is as deep as the lead it opens into, so no tone steps along the bank's line)
  // THE BRINE IS A MIRROR FROM SOME FORTY METRES OUT, wherever it lies and from wherever it is seen: looked into steeply,
  // close to, it shows its own red body and what lies under it; looked along, from 24 m on, the surface takes over, and
  // from 56 m at least 0.58 of what it gives back is what stands over it (the sky, stained; the cone; the flock).
  // 0.58: enough that the pale sky wins over the crimson body, so the lead pales toward the horizon and anything dark
  // in the mirror stands out against it, and little enough that the water is still a crimson mirror.
  Fr = mix(Fr, max(Fr, 0.58), smoothstep(24., 56., dist));
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec4 mSky = mirrorSky(R); vec3 refl = mSky.rgb;
  refl *= mix(vec3(1.), mix(vec3(1., 0.8, 0.83), vec3(0.62, 0.44, 0.47), mSky.a), uCrim);      // the sky comes back off the brine a little stained; the cone's grey, a dark thing in dark red water, comes back darker and redder: grey-crimson
  float mot = 0.55*vnoise(q*0.018) + 0.3*vnoise(q*0.09 + 7.) + 0.15*vnoise(q*0.6);
  vec3 body = mix(uDeep*1.45, uShallow*1.1, smoothstep(0.25, 0.9, mot));
  body = mix(body, uOrange, max(max(mix(smoothstep(0.34, 0.5, sd), 1. - smoothstep(0.1, 1.5, -dSh), shK), 0.8*gHalo*(1. - gAwash))*0.62*(1. - pIn), pShal*0.85));    // soft orange shallows hugging every shore, a metre and a half wide
  // just off the shore the crust runs on under the brine for two or three hands: shallower still, and a little paler
  body = mix(body, mix(uOrange*1.1, uSaltCol*(uFill*0.92 + uSunCol*uSunDir.y)*0.3183*uSaltGain*vec3(1., 0.62, 0.58), 0.22), 0.4*shelf*shelf*(1. - pIn));
  // ---- THE LAKE'S FLOOR UNDER THE APPROACH: salt polygons seen through the shallow brine. The same plates the crust
  //      is crazed into (one site in every 3.7 m, so they are 2 to 6 m across) run on under the water: each lies at
  //      its own depth and every one is crimson (a third of them deep: the brine's deep crimson; the rest a crimson a
  //      little lighter and warmer the shallower they lie; none rose, none pale), its raised rim shows
  //      as a pale line that breaks the surface here and there in a thread of wet white salt. Laid in the lake's own
  //      coordinates, so close to the rims converge on the cone and streak under the wheels. By path distance and
  //      metres from the route's line (gRt), from behind the entry to the band; the ripple bends them. The floor is
  //      seen only near the eye (to some 40 m): further out the water is mirror and carries the sky and the cone. ----
  {
    float fAl = smoothstep(-60., -20., gRt.y)*(1. - smoothstep(404., 450., gRt.y));
    float fAc = 1. - smoothstep(19., 30., abs(gRt.x) + 7.*(vnoise(q*0.06 + 41.) - 0.5));
    // (the footprint a pixel really has here, from the picture itself: seen small through the previous world's ring a
    // pixel covers more water than the lens's own figure says, and the floor must melt into the crimson there too)
    float sK = clamp(max(length(dFdx(q)), length(dFdy(q)))/max(fp, 1e-4), 1., 8.), fpS = fp*sK, latS = latM*sK;
    float fNear = 1. - smoothstep(0.45, 1.5, fpS*0.27);
    // the floor shows only near the eye, where the look into the brine is steep: fading from 16 m, and gone by 40 m,
    // where the water is mirror (above). Its rims go with it: a rim is 5 cm high, and no net of them lies on the far lead.
    float fEye = 1. - smoothstep(16., 40., dist);
    float fK = fAl*fAc*fNear*fEye*(1. - salt)*(1. - pIn);
    if (fK > 0.004) {
      vec2 qf = q + 0.22*g*(0.5 + 2.*uRipple);                                  // the ripple bends what lies under it
      vec2 eF = vec2(0., 1.); vec3 pf = plates(qf*0.27, eF);
      float deF = pf.y/0.27, idF = pf.z;
      // shoals and leads: the floor comes up in shoals some tens of metres long, lying down the lake; between them leads
      float shoal = smoothstep(0.24, 0.48, vnoise(vec2(q.x*0.085, q.y*0.036) + 61. + uFieldRect.w*vec2(1.37, 0.71)) + 0.34*(vnoise(q*0.21 + 13.) - 0.5) + 0.12*(idF - 0.5));
      shoal *= 0.6 + 0.4*smoothstep(1.4, 5.0, abs(gRt.x) + 1.6*(vnoise(vec2(gRt.y*0.09, 5.)) - 0.5));      // deeper under the route's line
      shoal = max(0.3 + 0.7*shoal, 0.75*gHalo);      // in the leads the floor lies deeper but its rims still show faintly; round every plate awash it is close under the surface
      // EACH CELL LIES AT ITS OWN DEPTH (by its own number, idF) AND EVERY CELL IS CRIMSON: a third of the cells lie deep,
      // and the brine over them keeps its deep crimson; the rest lie nearer the surface, and the nearer a cell lies the
      // more the brine over it takes of a crimson a little lighter and warmer than its own body (below: under). No
      // cell is rose and none is pale: the polygons belong to the white crust, the water between is red.
      float topF = smoothstep(0.333, 0.39, idF)*(0.5 + 0.5*smoothstep(0.39, 1., idF));      // how near the surface this cell lies (0: deep)
      float eaF = dot(eF, vh), wF = sqrt(eaF*eaF*fpS*fpS + (1. - eaF*eaF)*latS*latS);      // a pixel's footprint across this rim
      float rH = 0.1 + 0.07*idF, rD = max(rH, 0.8*wF);
      // a rim narrower than a pixel keeps a pixel's width and pales by its share of it (so many of them never sum to a
      // net), and is gone when a pixel is a stride across it; one that runs with the view stays a line a little longer
      float rimF = (1. - smoothstep(rD*0.45, rD, deF))*min(rH/rD, 1.)*(1. - smoothstep(0.35, 1.3, wF));
      float glowF = 1. - smoothstep(0., 0.55 + 1.5*wF, deF);                     // the rim's flank falling away into the red
      vec3 floorLit = uSaltCol*(uFill*0.92 + uSunCol*uSunDir.y)*0.3183*uSaltGain;
      vec3 under = mix(uShallow*1.3, uOrange, 0.1);                              // the shallowest cells: the brine's own crimson, a little lighter (uShallow x 1.3, where the body's lightest is uShallow x 1.1) and a tenth toward the orange of the shallows (warmer)
      float washF = 1. - smoothstep(0.2, 1.0, fpS);                                // each cell's own tone only while a cell is far bigger than a pixel
      body = mix(body, uDeep*1.2, 0.5*fK*washF*(1. - smoothstep(0.3, 0.36, idF)));      // the deep third: the darkest crimson of the brine
      body = mix(body, under, fK*(0.7 + 0.3*shoal)*washF*topF*(0.5 + 0.34*glowF));
      body = mix(body, floorLit*vec3(1., 0.66, 0.62)*0.86, fK*shoal*rimF*(0.4 + 0.4*topF));
      // where a rim stands proud of the water: short threads of wet white salt, with the brine dark against them
      float proud = smoothstep(0.6, 0.8, vnoise(q*0.8 + idF*37.) + 0.25*topF)*smoothstep(0.55, 0.9, shoal)*smoothstep(0.35, 0.6, vnoise(q*0.13 + 83.));
      gFloorLip = fK*proud*rimF;
      gFloorCol = floorLit*1.02;
    }
  }
  // pink scum lying in the shallows: drifts a few metres long, their place and their outline bent by noise at three
  // sizes and the shallow's own limit broken the same way, so that no drift ends in a level band or a ruled edge
  float scW = vnoise(q*0.16 + 31.), scV = vnoise(q*0.13 + 17.), scF = vnoise(q*0.9 + 5.);
  vec2 sq = q + vec2(7.*(scW - 0.5), 6.*(scV - 0.5)) + 1.2*vec2(scF - 0.5, vnoise(q*0.7 + 23.) - 0.5);
  float scum = 0.66*vnoise(sq*vec2(0.07, 0.26) + vec2(uTime*0.03, 0.)) + 0.34*vnoise(sq*vec2(0.31, 0.57) + 3.);
  scum = smoothstep(0.55, 0.8, scum)*smoothstep(0.25, 0.45, sd + 0.16*(scW - 0.5) + 0.1*(scF - 0.5))*(1. - smoothstep(2., 9., fp))*(0.5 + 0.5*scF);
  body = mix(body, uPinkCol*0.55, scum*0.5);
  body *= uLum*(0.9 + 0.2*vnoise(q*vec2(0.012, 0.11) + vec2(uTime*0.006, 0.)));
  body *= 1. + (0.16 + 0.2*paw)*(r0 - 0.75)*(1. - smoothstep(0.4, 3., fp))*(1. - 0.6*fine) + 0.14*(r1 - 0.8)*fine;        // moving ripple texture in the brine itself
  // the flock overhead, given back by the mirror as short trembling pink dashes that point at the eye
  vec2 vq = q - uCam.xz; float vr = max(length(vq), 0.5), va = vr > 0.5 ? atan(vq.x, -vq.y) : 0.;
  float stk = vnoise(vec2(va*90., log(vr)*13. - uTime*0.3))*0.6 + vnoise(vec2(va*210. + 7., log(vr)*27. + uTime*0.5))*0.4;      // short dashes, broken across the view: never long streaks down the picture
  float flk = smoothstep(0.6, 0.8, stk + 0.06*(r0 - 0.75))*uFrontK.w*smoothstep(9., 30., vr)*(1. - smoothstep(60., 150., vr))*inBand;
  flk *= 1. - smoothstep(-25., 25., fds);                                 // only behind the liftoff line: there is nothing aloft ahead of it
  // Under the wave the mirror does not see the sky: it sees the wall. Its mass darkens the water to crimson and rose from
  // the eye out to the pattering line, and the birds themselves are short strokes darker than the brine, pointing at the
  // eye, broken by the ripple and thinning toward the lens. (When the flock has parted, in the lane, the sky comes back.)
  float mEdge = fds + 16.*(vnoise(q*0.045 + 3.) - 0.5) + 7.*(vnoise(q*0.21 + uTime*0.15) - 0.5);      // no ruled edge: the mass thins out raggedly either side of the line
  float wallM = uMass.a*inBand*(1. - smoothstep(-52., 34., mEdge))*smoothstep(3., 14., vr);
  refl = mix(refl, uFlockCol, flk*0.72*(1. - uMass.a));
  refl = mix(refl, uMass.rgb, wallM*0.74);
  // the cone in the mirror: a dark grey wedge on the axis, stronger than the sky around it (a dark thing in a mirror
  // reads: under its image no sky lights the surface, so four fifths of what the water gives back there is the cone's grey)
  float FrC = mix(Fr, max(Fr, 0.8), mSky.a*(1. - wallM));
  // cat's paws drifting over the mirror: far off a ruffled patch gives back less sky (a darker crimson streak on the
  // pale water), close under the wheels it is a lighter, cooler patch alive with wavelets
  float pawS = smoothstep(0.5, 0.78, vnoise(q*0.03 + uTime*vec2(0.06, 0.035)));
  vec3 water = mix(body, refl, FrC*(1. - 0.3*pawS*(1. - mSky.a))) + paw*0.045*refl;
  water += pawS*uSkyZen*max(0.075 + 0.09*(r0 - 0.75) + 0.06*(r1 - 0.8)*fine, 0.)*(1. - smoothstep(0.5, 4., fp));
  water += uSkyZen*vec3(0.015, 0.03, 0.035)*uCrim;                    // the sky's own light in the brine: crimson, never a flat red
  float strokes = smoothstep(0.58, 0.78, stk + 0.1*(r0 - 0.75))*wallM*smoothstep(10., 34., vr)*(1. - smoothstep(60., 130., vr));
  water = mix(water, mix(uDeep*0.7, uFlockCol*0.45, 0.35), strokes*0.46);
  // the sun's path: a column of light under the sun, sparks where a wavelet is bigger than a pixel, long broken streaks far off
  {
    vec3 R0 = reflect(-V, vec3(0., 1., 0.)); R0.y = abs(R0.y);
    vec2 sh = uSunDir.xz/max(length(uSunDir.xz), 1e-3), rh = R0.xz/max(length(R0.xz), 1e-3);
    float daz = 1. - dot(sh, rh), del = R0.y - uSunDir.y;
    float lobe = exp(-daz/(0.0035 + 0.03*uRipple + 0.012*paw))*exp(-del*del/(del < 0. ? 0.03 : 0.12));
    if (lobe > 0.002) {
      float spk = vnoise(q*7. + uTime*vec2(1.3, 0.9))*vnoise(q*13. - uTime*vec2(1.1, 1.7));
      float spark = smoothstep(0.3, 0.6, spk)*(1. - smoothstep(0.12, 1.1, fp));
      float lane = dot(q - uCam.xz, vec2(-sh.y, sh.x));
      float strk = smoothstep(0.3, 0.7, vnoise(vec2(lane*0.8, dot(q, sh)*0.045 - uTime*0.25))*0.7 + vnoise(vec2(lane*2.3 + 5., dot(q, sh)*0.11 + uTime*0.4))*0.3);
      water += uSunCol*vec3(1., 0.84, 0.66)*uGlit*lobe*(0.06 + 0.18*strk + 0.9*spark);
    }
  }
  // ---- windrows: thin broken lines of soda foam lying down the wind on the open brine, each a string of pale clots,
  //      gathered where the wind has herded them and thick along the lee shores ----
  vec3 saltLit = uSaltCol*(uFill*0.92 + uSunCol*uSunDir.y)*0.3183*uSaltGain;
  float wx = wq.x + 1.7*vnoise(q*0.11 + 31.) + 0.5*vnoise(q*0.47 + 5.);          // the rows wander: never a ruled line
  float rowN = vnoise(vec2(wx*1.7, wq.y*0.04 + uTime*0.02))*0.62 + vnoise(vec2(wx*4.9 + 3., wq.y*0.12 - uTime*0.03))*0.38;
  float rowZ = 0.25 + 0.75*smoothstep(0.38, 0.66, vnoise(q*0.021 + 17.)) + 0.6*smoothstep(0.36, 0.48, sd);
  float clot = smoothstep(0.36, 0.8, vnoise(q*2.3 + vec2(uTime*0.05, 0.)) + 0.4*vnoise(q*6.7 - vec2(0., uTime*0.04)));
  float rows = smoothstep(0.62, 0.82, rowN)*min(rowZ, 1.)*mix(clot, 0.55, smoothstep(0.08, 0.5, fp))*(1. - smoothstep(0.7, 4., fp))*(1. - pIn);
  water = mix(water, mix(saltLit, uPinkCol*(uFill + uSunCol*0.4)*0.3183, 0.35)*0.92, rows*(0.015 + 0.525*smoothstep(18., 70., vr)));      // not under the wheels: seen from three metres a clot is a pale smear
  // ---- scum lines running with the route (by path distance and metres from its line, from the entry to path
  //      distance 446 to 486, among the band's first runners): each a broken string of pale soda foam, runs a stride or two long with gaps between them, a few pixels
  //      wide close to with a soft ragged edge, a little pinker and dimmer than a plate's lip, thinning to nothing far
  //      off. They wander, converge on the cone, streak under the wheels and slide slowly along. ----
  {
    vec2 rt = routeAt(q);
    float sAl = smoothstep(2., 30., rt.y)*(1. - smoothstep(446., 486., rt.y))*(1. - smoothstep(16., 24., abs(rt.x)))*(1. - smoothstep(20., 58., vr));
    if (sAl > 0.003) {
      float lw = rt.x + 1.7*(vnoise(vec2(rt.y*0.03, 3.)) - 0.5) + 0.7*(vnoise(vec2(rt.y*0.13, 7.)) - 0.5) + 0.2*(vnoise(vec2(rt.y*0.7, 11.)) - 0.5);
      float li = floor(lw/3.3), hs = hash11(li*17.3 + 3.), lf = (fract(lw/3.3) - 0.5)*3.3 - (hs - 0.5)*1.6;
      float ea = dot(gRouteN, vh), wE = sqrt(ea*ea*fp*fp + (1. - ea*ea)*latM*latM);      // a pixel's footprint across the line
      float sl = rt.y - uTime*(0.45 + 0.9*hs) + hs*37.;                                   // metres along the line, sliding
      // runs: one in every 5.5 m of a line, 1.4 to 3.6 m long, tapering at both ends; a quarter of the places are empty
      float rc = floor(sl/5.5), rf = sl/5.5 - rc, r1 = hash11(rc*3.7 + li*11.1), r2 = hash11(rc*9.1 + li*5.3 + 2.), r3 = hash11(rc*5.9 + li*7.7 + 4.);
      float tr = (rf - 0.06 - 0.3*r1)/(0.25 + 0.4*r2);
      float run = smoothstep(0., 0.22, tr)*(1. - smoothstep(0.78, 1., tr))*step(0.25, r3)*step(0.4, hash11(li*9.7 + 2.));
      if (run > 0.003) {
        // clots: the string is thick and thin, and broken again at every stride
        float clt = (0.45 + 0.55*smoothstep(0.3, 0.7, vnoise(vec2(sl*1.9, li*3.1 + lf*9.))))*smoothstep(0.24, 0.42, vnoise(vec2(sl*2.3 + 5., li*5.3)));
        float hw0 = (0.02 + 0.02*hash11(li*5.1 + 1.))*(0.55 + 0.9*vnoise(vec2(sl*1.3, li*4.3)))*(0.4 + 0.6*run);
        float hw = max(hw0*(0.7 + 0.6*vnoise(vec2(sl*6.3, li*1.7))), 0.8*wE);      // never drawn narrower than a pixel and a half: below that it pales instead
        float ln = (1. - smoothstep(hw*0.3, hw, abs(lf)))*min(hw0/max(hw, 1e-4), 1.)*run*clt*sAl*(1. - pIn);
        water = mix(water, mix(saltLit, uPinkCol*(uFill + uSunCol*0.45)*0.3183, 0.55)*0.78, ln*0.62);
      }
    }
  }
  water = mix(water, gFloorCol, 0.8*gFloorLip);      // the rims that stand proud of the brine (the floor, above)
  // the pattering line: far off a broken white band, close to a field of footfalls each flashing and fading
  float patFar = smoothstep(0.2, 0.9, fp);
  float brk = smoothstep(0.3, 0.62, vnoise(q*vec2(0.42, 0.42) + uTime*vec2(0.5, 0.3)) + 0.25*vnoise(q*1.9 + uTime*2.1) - 0.12);
  float fdl = fds + 7.*(vnoise(q*0.09 + 23.) - 0.5) + 2.5*(vnoise(q*0.37 + uTime*0.3) - 0.5);          // the line wanders and frays: parties run, not a ruled arc
  float lineZ = smoothstep(-15., -8., fdl)*(1. - smoothstep(-4., 2., fdl))*inBand*uFrontK.z;     // a band ten metres deep on the eye's side of the liftoff line: seen UNDER the wall's lowest rank, over the dark water
  // broken twice over: into runs some metres long, and each run into dashes that flash and fade
  float brk2 = smoothstep(0.3, 0.52, vnoise(q*vec2(0.22, 0.22) + uTime*vec2(0.4, 0.3)) + 0.2*vnoise(q*1.3 - uTime*1.2))
    *(0.5 + 0.5*smoothstep(0.34, 0.6, vnoise(q*1.6 + uTime*vec2(1.7, -1.2))));
  float line = lineZ*brk2*patFar;
  float foam = max(runZ*0.3*brk*patFar, line);     // close to, the hero's spray crowns alone mark the footfalls (no pale patches on the brine)
  water = mix(water, uSaltCol*(uFill + uSunCol*(uSunDir.y + 0.3))*0.3183*(1.4 + 0.55*line), clamp(foam, 0., 0.86));
  // ---- crust: plates 3.7 m across (the same sites the rim ridges are built on), each with a thin raised rim and the
  //      rim's thin shadow, each crazed into hand-sized tiles; wet seams between rafts to the middle distance (9 m), old
  //      red seams far out (23 m). Every line is drawn from the footprint a pixel has ACROSS it (long along the view,
  //      short across it): a line narrower than a pixel and a half keeps that width and pales; none widens into a wedge. ----
  float w1 = fp*0.27, nearK = 1. - smoothstep(0.12, 0.5, w1);
  vec2 eN = vec2(0., 1.); vec3 pv = vec3(0.5, 0.5, 0.5);
  if (nearK > 0.003 && salt > 0.003) pv = plates(q*0.27, eN);
  float de = pv.y/0.27, cell = pv.z;                                // metres to the nearest plate edge, plate id
  float sunH = max(length(uSunDir.xz), 1e-3);
  float ea = dot(eN, vh), wE = sqrt(ea*ea*fp*fp + (1. - ea*ea)*latM*latM);      // a pixel's footprint across this edge
  float rimHalf = 0.06 + 0.025*n3, rimD = max(rimHalf, 0.75*wE);
  float rim = (1. - smoothstep(rimD*0.5, rimD, de))*pow(min(rimHalf/rimD, 1.), 0.6)*nearK;
  float facing = dot(-eN, uSunDir.xz)/sunH;                          // this flank of the rim looks at the sun (+) or away (-)
  float shW = min(0.05*abs(dot(eN, uSunDir.xz))/max(uSunDir.y, 0.07), 0.1), shD = max(shW, 0.6*wE);       // the rim's shadow on the plate behind it: no wider than a hand
  float rimSh = smoothstep(0.05, 0.4, -facing)*smoothstep(rimD*0.7, rimD, de)*(1. - smoothstep(rimD + shD*0.5, rimD + shD, de))*pow(min(shW/max(shD, 1e-4), 1.), 0.7)*nearK;
  vec3 vm = voronoi(q*0.105 + 9.3);
  float w2 = fp*0.105, plate = (1. - smoothstep(0.014 + w2*0.3, 0.04 + w2*0.9, vm.y))*(1. - smoothstep(0.15, 0.6, w2))*(1. - 0.9*nearK);
  float big = voronoi(q*0.043 + 5.).y;
  float w3 = fp*0.043, seam = (1. - smoothstep(0.01 + w3*0.3, 0.02 + w3*0.9, big))*(1. - smoothstep(0.2, 0.75, w3))*(1. - 0.9*nearK);
  float pl = hash11(vm.z*57.3);
  vec3 alb = uSaltCol*(0.9 + 0.1*n2)*(1. - 0.2*cell*nearK)*(0.93 + 0.09*pl);
  float margin = (1. - smoothstep(rimD, rimD + 0.55, de))*nearK;     // each plate is a shallow dish: its edge curls up to the rim
  float damp = smoothstep(0.7, 0.76, cell)*nearK*smoothstep(0.25, 0.55, de)*smoothstep(0.34, 0.5, vnoise(q*0.9 + cell*40.));   // plates still damp: pink, glossy
  alb = mix(alb, uPinkCol, 0.03 + 0.1*n1*pl + 0.3*damp);                       // pink staining, plate by plate
  float zone = smoothstep(0.46, 0.62, vnoise(q*0.037 + 21.))*(0.6 + 0.4*pl);     // rafts where the algae have come up through the salt: rose, rust at the wet edge
  alb = mix(alb, mix(uOrange*1.5, uPinkCol*1.05, smoothstep(0.52, 0.62, sd)), zone*0.3);
  alb *= 1. - 0.1*smoothstep(0.5, 0.8, vnoise(q*0.011 + 2.))*(1. - nearK*0.5);    // old grey crust in broad patches
  alb *= 0.93 + 0.07*vnoise(q*5.)*nearK;
  // Each plate is crazed into hand-sized tiles (a hand's span, 0.19 m), every tile its own shade and a shallow saucer: the
  // cracks dark and fine, the tile's lip bright where it faces the sun and dim where it turns away. Held out to twenty
  // metres and more: the cracks that run with the view stay lines, those across it melt into the plate's tone.
  float crzK = (1. - smoothstep(0.25, 0.8, fp))*salt*nearK, bev = 0.;
  if (crzK > 0.003) {      // (the tiles themselves were found above, with the shore: pc, eC, dC, wC)
    float cD = max(0.009, 0.7*wC), onPlate = smoothstep(rimD, rimD + 0.1, de);
    float crack = (1. - smoothstep(cD*0.45, cD, dC))*pow(min(0.009/cD, 1.), 0.45)*crzK*onPlate;
    float tK = crzK*(1. - smoothstep(0.05, 0.2, fp));                // a tile's own shade and lip only while a tile is bigger than a pixel
    alb *= 1. + 0.2*(pc.z - 0.5)*tK;
    bev = dot(-eC, uSunDir.xz)/sunH*(1. - smoothstep(cD, cD + 0.025 + wC, dC))*tK*onPlate;
    alb *= 1. - 0.55*crack;
  }
  float nearD = 1. - smoothstep(0.07, 0.4, fp);                     // salt nodules and popcorn crystals, crisp
  float b0 = vnoise(q*9.) + 0.5*vnoise(q*23.), b1 = vnoise(q*9. + uSunDir.xz*0.4) + 0.5*vnoise(q*23. + uSunDir.xz*0.6);
  float nod = smoothstep(1.04, 1.14, b0);
  alb = mix(alb, uSaltCol*1.08, nod*0.55*nearD);
  alb = mix(alb, alb*vec3(0.86, 0.8, 0.8), smoothstep(0.5, 1.5, de)*0.45*nearK);   // dished, dirtier centres
  alb = mix(alb, uSaltCol*1.16, rim*0.75);
  float wetEdge = 1. - smoothstep(0.5, 0.56, sd);                        // damp, darker margin
  float poolDamp = (1. - smoothstep(0.5, 2.4, dP))*(1. - pIn);            // the wet halo round a pool
  float poolRim = (1. - smoothstep(0.12, 0.5 + fp, dP))*(1. - pIn);       // and its pale lip of fresh salt
  alb = mix(alb, mix(uShallow, uOrange, 0.45)*1.25, clamp(plate*0.42 + seam*0.5 + wetEdge*0.5 + poolDamp*0.1, 0., 0.85));
  alb = mix(alb, uSaltCol*1.2, poolRim*0.9);
  // the crust's edge (see the law above): the slab's raised rim of clean salt, lit on the shores that face the sun and
  // dim on those turned from it; the wet apron outside it, darker and pinker; the frost line at the apron's top; and
  // the rim's shadow: back over the plate on the sunward shores (castIn), out over the apron and the brine on the
  // others (castOut, laid on below). Its length is the rim's height (0.07 m) over the tangent of the sun's elevation.
  float sunS = dot(-nE, uSunDir.xz)/sunH, shLen = min(0.07*sunH/max(uSunDir.y, 0.07), 0.45)*abs(sunS);
  float castIn = shoreBand(sW, aprIn + 0.22, aprIn + 0.22 + shLen, eSh)*smoothstep(0.05, 0.35, sunS)*shK;
  float castOut = shoreBand(sW, aprIn + 0.02 - shLen, aprIn + 0.02, eSh)*smoothstep(0.05, 0.35, -sunS)*shK;
  alb = mix(alb, uSaltCol*1.14, 0.6*min(rimOut + rimIn, 1.));
  alb = mix(alb, alb*vec3(0.6, 0.43, 0.47) + 0.05*uPinkCol, 0.85*apron);
  alb = mix(alb, uSaltCol*1.2, 0.8*frost);
  float ndl = clamp(uSunDir.y*(1. - 0.5*rim)*(1. - 0.4*rimOut) + facing*(rim*0.62 + margin*0.1) + sunS*(0.75*rimOut - 0.35*rimIn) + (b0 - b1)*0.4*nearD + 0.26*bev, 0.02, 1.5);
  vec3 lit = alb*(uFill*(0.92 - 0.2*rim*smoothstep(0., 0.3, -facing) - 0.12*rimSh - 0.3*rimOut*smoothstep(0., 0.3, -sunS) - 0.14*castIn) + uSunCol*ndl*(1. - 0.7*rimSh)*(1. - 0.8*castIn))*0.3183*uSaltGain;
  // soda dust streaming over the plates in long streaks
  float streak = vnoise(vec2(wq.x*0.9, wq.y*0.07 - uTime*0.62))*0.65 + vnoise(vec2(wq.x*2.6 + 4., wq.y*0.16 - uTime*1.1))*0.35;
  float dust = gust*smoothstep(0.42, 0.78, streak)*(1. - smoothstep(0.1, 0.7, fp));
  lit = mix(lit*(1. + 0.14*gust), uSaltCol*(uFill + uSunCol*(uSunDir.y + 0.25))*0.3183*uSaltGain*0.98, dust*0.42);
  lit = mix(lit, lit*vec3(0.86, 0.7, 0.72) + 0.3*water, 0.5*gAwash);      // a plate awash: thin, wet, stained through by the brine under it
  float wet = clamp(uWet + wetEdge*0.35 + seam*0.3 + plate*0.4 + damp*0.5 + poolDamp*0.5*(1. - poolRim) + 0.45*gAwash + 0.5*apron, 0., 1.);
  vec3 Rs = reflect(-V, vec3(0., 1., 0.)); Rs.y = abs(Rs.y);
  float ms = 1. - clamp(V.y, 0., 1.); float ms2 = ms*ms;
  lit = mix(lit, mirrorSky(Rs).rgb, wet*(0.08 + 0.22*uWet + 0.7*ms2*ms2*ms));
  // ---- foam and pink scum line where brine meets crust ----
  float lace = shore*smoothstep(0.35, 0.7, vnoise(q*1.3 + uTime*0.05))*(1. - smoothstep(1.5, 8., fp))*(1. - 0.8*shK);       // far off only: close to, the lip is drawn below
  vec3 c = mix(water, lit, salt);
  c = mix(c, uSaltCol*(uFill + uSunCol*uSunDir.y)*0.3183*0.9, lace*0.3*(1. - salt*0.6));
  // the shoreline close to (the "lip" of the line above is now the crust's own edge): the rim's shadow thrown out over
  // the apron and the brine on the shores turned from the sun, and foam flecks riding the brine against the crust (the
  // rim, the apron and the frost line are in the crust's own light, above; no line is drawn round a raft)
  {
    float open = (1. - pIn)*shK;
    float fleck = smoothstep(0.66, 0.9, vnoise(q*2.4 + uTime*vec2(0.08, 0.05)) + 0.22*vnoise(q*5.3 - uTime*0.1))*(1. - smoothstep(0.1, 1.0, -dSh))*(1. - smoothstep(-0.1, -0.02, dSh))*open*(1. - smoothstep(0.1, 0.5, fp));
    vec3 saltTop = uSaltCol*(uFill*0.95 + uSunCol*(uSunDir.y + 0.22))*0.3183*uSaltGain;
    c *= 1. - 0.42*castOut*(1. - pIn);
    c = mix(c, saltTop*0.8, fleck*0.4);
  }
  // ---- the biplane's shadow, thrown from its real shape by the real sun (GLSL_PLANE_SHADOW): crisp and cool on the
  //      crust, softer and fainter in the brine's body, never on the mirror ----
  c = mix(c, c*vec3(0.44, 0.48, 0.6), mix(planeShadow(q, 5.)*uShadow2.y*(1. - Fr), planeShadow(q, 1.)*uShadow2.x, salt));
  // the marabou throw long soft shadows down-sun over the plates (legs, body, hunched head)
  vec2 sdn = -uSunDir.xz/max(length(uSunDir.xz), 1e-3); float cot = min(length(uSunDir.xz)/max(uSunDir.y, 0.06), 9.);
  float msh = 0.;
  for (int i = 0; i < 3; i++) {
    vec2 d = q - uMar[i].xy; float al = dot(d, sdn)/cot, ac = d.x*-sdn.y + d.y*sdn.x, h = uMar[i].z;     // al: height of the point on the bird that shades here
    float t = al/max(h, 0.1);
    float wd = mix(0.07, 0.44, smoothstep(0.4, 0.56, t)*(1. - smoothstep(0.8, 0.92, t))) + 0.17*smoothstep(0.86, 0.93, t)*(1. - smoothstep(0.97, 1.02, t));
    float soft = 0.03 + 0.07*t*cot*0.3;
    msh = max(msh, (1. - smoothstep(wd - soft, wd + soft, abs(ac)))*smoothstep(-0.02, 0.03, t)*(1. - smoothstep(0.98, 1.06, t)));
  }
  c *= 1. - msh*mix(0.5, 0.68, salt);
  gl_FragColor = vec4(fxApplyFog(c), 1.);
}`;

// ---------- Ol Doinyo Lengai (at infinity on the -Z axis), its steam, the rift wall ----------
const CONE_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vN, vCol, vL;
void main(){
  vN = normal; vCol = color; vL = position;
  gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.);
}`;
const CONE_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uFill, uHaze;
uniform float uHazeAmt, uMirage, uTime;
varying vec3 vN, vCol, vL;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float ang = atan(vL.x, vL.z + 1e-4);
  float streak = vnoise(vec2(ang*46., vL.y*0.004)) - 0.5;
  vec3 alb = vCol*(1. + 0.3*streak);
  float sd = dot(N, uSunDir), ndl = clamp(sd*1.2 + 0.05, 0., 1.);
  float away = 1. - smoothstep(-0.5, 0.25, sd);                             // flank and gully walls turned from the sun: less sky, cooler
  vec3 c = alb*(uFill*(0.5 + 0.35*N.y)*mix(vec3(1.), vec3(0.4, 0.46, 0.62), away) + uSunCol*ndl)*0.3183;
  float hz = clamp(uHazeAmt*(1. - 0.25*away) + 0.36*exp(-vL.y/110.), 0., 1.);
  c = mix(c, uHaze, hz);
  float lift = uMirage*(42. + 14.*sin(ang*90. + uTime*1.7) + 10.*sin(ang*37. - uTime*1.1));   // the foot floats on a band of sky
  c = mix(c, uHaze, uMirage*(1. - smoothstep(lift*0.7, max(lift, 1e-3), vL.y)));
  gl_FragColor = vec4(c, 1.);
}`;
const STEAM_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.); }`;
const STEAM_FRAG = /* glsl */`
uniform vec3 uCol; uniform float uTime, uAmt;
varying vec2 vUv;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
void main(){
  // a plume rooted at (0.12, 0.1) leaning down-wind (+u) as it rises and thins
  float h = vUv.y, x = vUv.x - 0.12 - h*h*0.62;
  float w = 0.03 + 0.2*h;
  float core = exp(-x*x/(w*w));
  vec2 p = vec2(vUv.x*5. - uTime*0.05, vUv.y*4. - uTime*0.085);
  float n = vnoise(p)*0.6 + vnoise(p*2.3 + 3.)*0.4;
  float a = core*smoothstep(0.28, 0.75, n + 0.25*(1. - h))*smoothstep(0.0, 0.08, h)*(1. - smoothstep(0.55, 1., h))*(1. - smoothstep(0.7, 1., vUv.x));
  gl_FragColor = vec4(uCol, a*uAmt);
}`;
const WALL_VERT = /* glsl */`
attribute vec4 aInfo;     // along (0..1), up (0..1), haze added (0 the near scarp .. 1 the furthest), how squarely the face takes the sun
varying vec4 vInfo; varying float vH;
void main(){ vInfo = aInfo; vH = position.y; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.); }`;
const WALL_FRAG = /* glsl */`
uniform vec3 uCol, uHaze, uSunCol, uFill; uniform float uHazeAmt;
varying vec4 vInfo; varying float vH;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
void main(){
  // a fault scarp: a hard cap-rock rim, bedded cliff bands under it, gullies cut down the face, talus fans at the foot
  float gul = vnoise(vec2(vInfo.x*620., vInfo.y*1.6)), gul2 = vnoise(vec2(vInfo.x*1900., vInfo.y*3.));
  float cap = smoothstep(0.8, 0.86, vInfo.y);
  float beds = 0.5 + 0.5*sin(vH*0.085 + 1.5*vnoise(vec2(vInfo.x*70., 3.)));
  float cliff = smoothstep(0.42, 0.6, vInfo.y)*(1. - cap);
  vec3 alb = uCol*(0.7 + 0.3*gul + 0.16*gul2)*(1. - 0.2*cap)*(0.86 + 0.2*beds*cliff);
  float specks = step(0.8, hash12(floor(vec2(vInfo.x*2600., vInfo.y*22.))))*(1. - smoothstep(0.08, 0.36, vInfo.y));   // thorn trees on the fans
  alb *= 1. - 0.35*specks;
  float shade = smoothstep(0.35, 0.62, gul)*cliff;                         // the gully walls turned from the light
  vec3 c = alb*(uFill*(0.78 - 0.2*shade) + uSunCol*vInfo.w*(0.25 + 0.75*(1. - shade))*(0.6 + 0.5*gul2))*0.3183;
  float hz = clamp(uHazeAmt*(0.82 + 0.3*vInfo.z) + 0.34*exp(-max(vH, 0.)/38.), 0., 0.96);
  gl_FragColor = vec4(mix(c, uHaze, hz), 1.);
}`;

// ---------- small instanced things with their own tiny shaders ----------
const LIT_PARS = /* glsl */`uniform vec3 uSunDir, uSunCol, uFill, uBounce; uniform float uTime;`;
// nest cones with sitting birds: iN = x, z, yaw, scale; iM = seed, has bird, 0, 0. aPart: 0 mud, 1 body, 2 neck (y = sway weight)
const NEST_VERT = /* glsl */`
${LIT_PARS}
attribute vec4 iN, iM; attribute vec3 color; attribute vec2 aPart;
varying vec3 vC;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec3 p = position; float bird = step(0.5, aPart.x);
  float tA = uTime*(0.4 + iM.x*0.5) + iM.x*60.;
  p.x += aPart.y*(sin(tA)*0.05 + 0.03*sin(tA*2.7));
  p.z += aPart.y*0.04*sin(tA*0.6 + 1.3);
  p.y += bird*0.012*sin(tA*0.8);
  p *= mix(1., iM.y, bird);
  float cy = cos(iN.z), sy = sin(iN.z);
  vec3 w = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy)*iN.w + vec3(iN.x, 0., iN.y);
  vec3 n = vec3(normal.x*cy + normal.z*sy, normal.y, -normal.x*sy + normal.z*cy);
  float ndl = clamp((dot(n, uSunDir) + 0.25)/1.25, 0., 1.);
  vec3 alb = color*mix(0.86 + 0.28*fract(iM.x*7.31), 1., bird);
  vC = alb*(mix(uBounce, uFill, n.y*.5 + .5) + uSunCol*ndl)*0.3183;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const FLAT_FRAG = /* glsl */`
varying vec3 vC;
${fx.GLSL_FOG_PARS_FRAG}
void main(){ gl_FragColor = vec4(fxApplyFog(vC), 1.); }`;
// spike grass and sedge: iN = x, z, yaw, scale; iM = seed, greenness
const TUFT_VERT = /* glsl */`
${LIT_PARS}
attribute vec4 iN, iM; attribute vec2 aBlade;   // height 0..1, blade phase
varying vec3 vC;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec3 p = position; float h = aBlade.x;
  float gust = sin(uTime*1.6 + iN.x*0.21 + iN.y*0.17) + 0.5*sin(uTime*3.7 + aBlade.y*6.3 + iM.x*20.);
  p.x += h*h*(0.09*gust + 0.05); p.z += h*h*0.04*sin(uTime*2.3 + aBlade.y*4.);
  float cy = cos(iN.z), sy = sin(iN.z);
  vec3 w = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy)*iN.w + vec3(iN.x, 0., iN.y);
  vec3 straw = mix(vec3(0.5, 0.42, 0.25), vec3(0.72, 0.66, 0.46), h);
  vec3 green = mix(vec3(0.2, 0.26, 0.17), vec3(0.42, 0.47, 0.3), h);
  vec3 alb = mix(straw, green, iM.y*(1. - 0.5*h))*(0.8 + 0.4*fract(iM.x*5.7));
  vC = alb*(uFill*(0.45 + 0.55*h) + uSunCol*(0.25 + 0.5*h))*0.3183;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
// December creche: billboarded grey chicks (and a few pink adults) walking the flats. iN = x, z, phase, size; iM = seed, adult
const CHICK_VERT = /* glsl */`
${LIT_PARS}
uniform vec3 uCam; uniform vec2 uDrift; uniform float uPix;
attribute vec4 iN, iM;
varying vec2 vUv; varying vec3 vK;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  float walk = uTime*(0.75 + 0.3*iM.x) + iN.z*6.283;
  vec2 g = iN.xy + uDrift*uTime*(0.85 + 0.3*iM.x) + vec2(sin(walk*0.21 + iM.x*9.), cos(walk*0.17 + iM.x*5.))*0.6;
  vec3 base = vec3(g.x, 0., g.y);
  vec3 vd = uCam - base; float dist = max(length(vd), 1e-3);
  vec3 rgt = cross(vec3(0., 1., 0.), vd); rgt /= max(length(rgt), 1e-4);
  float sz = max(iN.w, 2.2*uPix*dist);
  vec3 w = base + rgt*(position.x*sz*0.5) + vec3(0., (position.y*0.5 + 0.5)*sz + abs(sin(walk*3.))*0.02, 0.);
  vUv = position.xy; vK = vec3(iM.y, sin(walk*3.), 0.6 + 0.4*fract(iM.x*13.7));
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const CHICK_FRAG = /* glsl */`
${LIT_PARS}
uniform vec3 uPink;
varying vec2 vUv; varying vec3 vK;
${fx.GLSL_FOG_PARS_FRAG}
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba*h); }
void main(){
  vec2 p = vUv; float ad = vK.x;
  float body = length((p - vec2(-0.05, mix(-0.1, 0.05, ad)))/vec2(mix(0.5, 0.36, ad), mix(0.36, 0.2, ad))) - 1.;
  vec2 hd = vec2(0.3 + 0.03*vK.y, mix(0.52, 0.86, ad));
  float neck = seg(p, vec2(0.22, mix(0.02, 0.1, ad)), hd) - mix(0.11, 0.05, ad);
  float head = length(p - hd) - mix(0.15, 0.08, ad);
  float leg = min(seg(p, vec2(-0.08 + 0.1*vK.y, -0.3), vec2(-0.1 + 0.16*vK.y, -1.)), seg(p, vec2(0.02 - 0.1*vK.y, -0.3), vec2(0.02 - 0.16*vK.y, -1.))) - mix(0.05, 0.03, ad);
  float d = min(min(body, neck*8.), min(head*8., leg*8.));
  if (d > 0.) discard;
  vec3 alb = mix(vec3(0.5, 0.47, 0.46)*vK.z, uPink, ad);
  if (leg < 0. && body > 0.) alb *= 0.45;
  vec3 c = alb*(uFill*(0.7 + 0.3*p.y) + uSunCol*(0.45 + 0.25*p.y))*0.3183;
  gl_FragColor = vec4(fxApplyFog(c), 1.);
}`;
// the short rains: grey curtains hanging along the rift wall
const RAIN_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.); }`;
const RAIN_FRAG = /* glsl */`
uniform vec3 uCol; uniform float uTime;
varying vec2 vUv;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
void main(){
  float x = vUv.x*2. - 1.;
  float streak = vnoise(vec2(vUv.x*9. + vUv.y*2.5, vUv.y*1.2 + uTime*0.25));
  float a = (1. - x*x)*(1. - x*x)*(1. - smoothstep(0.55, 1., vUv.y))*smoothstep(0., 0.12, vUv.y)*(0.5 + 0.5*streak);
  gl_FragColor = vec4(uCol, a*0.5);
}`;

// far flocks on the wing: ribbons of flamingos trailing over the lake like smoke. One quad a bird, flown along a
// swaying line: iA = line centre x, z, heading, length; iB = start along, sideways, height, speed; iC = phase, sway, lift, seed
const RIBBON_VERT = /* glsl */`
${LIT_PARS}
uniform vec3 uCam; uniform float uPix;
attribute vec4 iA, iB, iC;
varying vec2 vUv; varying vec3 vK;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  float al = mod(iB.x + uTime*iB.w, iA.w), e = al/iA.w;
  vec2 dir = vec2(sin(iA.z), -cos(iA.z)), prp = vec2(-dir.y, dir.x);
  float sw = iC.y*(sin(al*0.0085 + iC.x) + 0.45*sin(al*0.023 + iC.x*2.3 + uTime*0.05));
  vec3 base = vec3(iA.xy + dir*(al - iA.w*0.5) + prp*(sw + iB.y), 0.).xzy;
  base.y = iB.z + iC.z*(sin(al*0.0062 + iC.x*1.7) + 0.4*sin(al*0.019 + iC.x)) + 0.6*sin(uTime*0.8 + iC.w*40.);
  vec3 vd = uCam - base; float dist = max(length(vd), 1e-3);
  vec3 rgt = cross(vec3(0., 1., 0.), vd); rgt /= max(length(rgt), 1e-4);
  vec3 up = cross(vd/dist, rgt);
  float ends = smoothstep(0., 0.08, e)*(1. - smoothstep(0.92, 1., e));
  float sz = max(0.7, 1.5*uPix*dist)*ends;
  vec3 w = base + (rgt*position.x + up*position.y)*sz;
  vUv = position.xy; vK = vec3(sin(uTime*18.8*(0.9 + 0.2*iC.w) + iC.w*61.), iC.w, sz/max(uPix*dist, 1e-5));
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const RIBBON_FRAG = /* glsl */`
${LIT_PARS}
uniform vec3 uPink, uDark;
varying vec2 vUv; varying vec3 vK;
${fx.GLSL_FOG_PARS_FRAG}
void main(){
  // two wing strokes from the shoulder, a body between; drawn fat when the bird is only a couple of pixels
  float th = 0.75*vK.x + 0.1; vec2 wv = vec2(cos(th), sin(th))*0.92, p = vec2(abs(vUv.x), vUv.y);
  float t = clamp(dot(p, wv)/dot(wv, wv), 0., 1.), fat = mix(0.36, 0.11, smoothstep(2., 9., vK.z));
  float dW = length(p - wv*t) - fat*(1. - 0.5*t), dB = length(vUv*vec2(1.6, 1.)) - 0.24 - fat*0.5;
  if (min(dW, dB) > 0.) discard;
  vec3 alb = dB < 0. ? uPink : mix(uPink, uDark, smoothstep(0.5, 0.62, t)*smoothstep(2.5, 7., vK.z));   // black wing tips only once the wing is wide enough to carry them
  vec3 c = alb*(uFill*0.9 + uBounce*0.4 + uSunCol*0.6)*0.3183*(0.85 + 0.3*fract(vK.y*7.3));
  gl_FragColor = vec4(fxApplyFog(c), 1.);
}`;

// where crust lies, exactly as the lake draws it (needs uField, uFieldRect, uSaltBias, vnoise)
const GLSL_CRUST = /* glsl */`
${GLSL_RAFT}
float crustSd(vec2 q, float fp){
  vec4 fld = fieldTap(q);
  float n1 = vnoise(q*0.021 + 3.1), n2 = vnoise(q*0.083 + 11.7), n3 = vnoise(q*0.31);
  float sd = fld.r + uSaltBias + (n1 - 0.5)*0.22 + (n2 - 0.5)*0.12 + (n3 - 0.5)*0.05*(1. - smoothstep(1., 6., fp));
  sd += 0.6*fld.g*smoothstep(0.7, 0.79, vnoise(q*0.12 + 31.) + 0.2*vnoise(q*0.47 + 3.));   // crust islets and pancakes out in the leads
  sd += crustExtra(q, fld.b, fld.a);
  return sd;
}`;
// ---------- THE WAVE'S BODY: some thousands of risers between the liftoff line and the eye, one quad a bird ----------
// Each bird is placed from the liftoff line alone: iW = metres behind the line at station 0, metres right of the band's
// axis, the height it climbs to, seed. The line runs on at 34 m/s and a flamingo flies at 15, so as the line advances a
// metre a bird drops 0.559 m behind it: it rises out of the pattering line, climbs as it falls back toward the eye, and
// is overtaken (it fades there: within 17 m the birds are the mesh ones). Seen from behind: a body, the neck's stub, two
// wings beating out of step with its neighbours, pink at the shoulder, scarlet coverts, black flight feathers.
// With MIRROR the same quad is laid on the water where the eye sees its reflection: dark, rose, broken by the ripple.
const WAVE_VERT = /* glsl */`
${LIT_PARS}
uniform vec3 uCam; uniform float uPix, uRipple;
uniform vec4 uFrontP;     // the liftoff line: point on the axis (x, z), axis direction (x, z)
uniform vec4 uWall;       // station of the line (m), axis curvature, amount 0..1, depth of the body behind the line (m)
uniform vec2 uWall2;      // half width of the lane the birds leave open, how high the birds climb (1 = as built)
attribute vec4 iW;
varying vec2 vUv, vQ; varying vec4 vK; varying float vF;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vF = 0.;
  float b = mod(iW.x + 0.559*uWall.x, uWall.w), fds = -b;
  // (the sheet is laid as the build fills iW: 64 in 100 of the risers dealt round 44 loose parties, the rest strewn singly and low; this shader gathers them no further and thins no window in it)
  float lat0 = iW.y + sign(iW.y)*uWall2.x, hc = 0.8 + iW.z*uWall2.y;
  float lat = lat0 + 0.7*sin(uTime*0.4 + iW.w*40.);
  float L = lat + 0.5*uWall.y*fds*fds;
  vec2 dir = uFrontP.zw, rg = vec2(-dir.y, dir.x), g = uFrontP.xy + dir*fds + rg*L;
  float h = 0.8 + (hc - 0.8)*(1. - exp(-b/(4. + 6.*fract(iW.w*7.3)))) + 0.25*sin(uTime*0.9 + iW.w*17.);
  vec3 base = vec3(g.x, h, g.y);
  vec3 vd = uCam - base; float dist = max(length(vd), 1e-3);
  vec3 rgt = cross(vec3(0., 1., 0.), vd); rgt /= max(length(rgt), 1e-4);
  vec3 up = cross(vd/dist, rgt);
  float appear = smoothstep(4.5, 10.5, b)*(1. - smoothstep(uWall.w - 5., uWall.w, b));      // none low over the pattering line itself: the white line shows under the wall
  float sz = max(0.5 + 0.26*fract(iW.w*23.3), 1.5*uPix*dist)*appear*smoothstep(11., 17., dist)*smoothstep(0., 0.1, uWall.z*1.1 - fract(iW.w*13.7));
  float ph = uTime*18.8*(0.92 + 0.16*fract(iW.w*3.1)) + iW.w*61.;
  float tl = (fract(iW.w*31.7) - 0.5)*0.9 + 0.2*sin(uTime*0.7 + iW.w*50.), ct = cos(tl), st = sin(tl);      // each banks its own way
#ifdef MIRROR
  vec3 w = base + (rgt*(position.x*0.8) + up*(position.y*(0.75 + 0.7*fract(iW.w*17.3))))*sz;      // the ripple draws each reflection out a little along the eye's ray: a dab, not a copy and not a streak
#else
  vec3 w = base + (rgt*(position.x*ct - position.y*st) + up*(position.x*st + position.y*ct - 0.06*sin(ph)))*sz;
#endif
  vUv = position.xy;
  // wing phase, seed, pixels the half quad covers, which wing takes the sun (-1 left .. 1 right)
  vK = vec4(sin(ph), iW.w, sz/max(uPix*dist, 1e-5), clamp(dot(rgt, uSunDir)*1.6, -1., 1.));
#ifdef MIRROR
  float hh = max(w.y, 0.);
  vec3 m = vec3(w.x, -hh, w.z);
  m.xz += vec2(sin(w.z*2.3 + uTime*1.7 + hh*2.9), cos(w.x*2.1 - uTime*1.4 + hh*3.3))*(0.04 + 0.03*hh)*(0.6 + 2.*uRipple);
  float ch = max(uCam.y, 0.05);
  w = uCam + (m - uCam)*(ch/(ch + hh));
  w.y = 0.03 + 0.0005*length(w.xz - uCam.xz);
  vK.z *= 1. - 0.5*smoothstep(6., 22., hh);
  vF = dot(w.xz - uFrontP.xy, uFrontP.zw);            // metres past the liftoff line, on the water
#endif
  vQ = w.xz;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const WAVE_FRAG = /* glsl */`
${LIT_PARS}
uniform vec3 uPink, uScarlet, uDeep, uCam;
uniform vec4 uStream;        // w: how strong the reflections are (full under the wall's mass, faint where the sky has come back)
uniform sampler2D uField; uniform vec4 uFieldRect; uniform float uSaltBias;
varying vec2 vUv, vQ; varying vec4 vK; varying float vF;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
${GLSL_CRUST}
${fx.GLSL_FOG_PARS_FRAG}
void main(){
  // two wings from the shoulder, each bent at the wrist, a body between them, the neck's stub above it
  float th = 0.8*vK.x + 0.1; vec2 p = vec2(abs(vUv.x), vUv.y);
  vec2 w1 = vec2(cos(th), sin(th))*0.46, w2 = w1 + vec2(cos(th*0.45 - 0.2), sin(th*0.45 - 0.2))*0.46;
  float fat = mix(0.3, 0.085, smoothstep(2.5, 10., vK.z));
  vec2 pa = p - w1*clamp(dot(p, w1)/dot(w1, w1), 0., 1.), d2 = w2 - w1, pb = p - w1 - d2*clamp(dot(p - w1, d2)/dot(d2, d2), 0., 1.);
  float t = dot(pa, pa) < dot(pb, pb) ? 0.5*clamp(dot(p, w1)/dot(w1, w1), 0., 1.) : 0.5 + 0.5*clamp(dot(p - w1, d2)/dot(d2, d2), 0., 1.);
  float dW = min(length(pa), length(pb)) - fat*(1. - 0.55*t);
  float dB = length(vUv*vec2(1.5, 1.) - vec2(0., 0.02)) - 0.2 - fat*0.5;
#ifdef MIRROR
  { float sx = vUv.x*2.5 + 0.45*sin(vUv.y*5. + vK.y*40.); if (sx*sx + vUv.y*vUv.y > 1.) discard; }      // in the mirror a bird is a short stroke, not its own shape
#else
  if (min(dW, dB) > 0.) discard;
#endif
  float wide = smoothstep(2.5, 6., vK.z);        // black and scarlet only once the wing is wide enough to carry them
  vec3 alb = uPink;
  if (dB >= 0.) alb = mix(mix(uPink, uScarlet, smoothstep(0.28, 0.5, t)*0.8*wide), vec3(0.04, 0.03, 0.04), smoothstep(0.66, 0.76, t)*smoothstep(4., 8., vK.z)*0.85);
  float sunW = 0.5 + 0.5*vK.w*sign(vUv.x)*step(0., dB);
  vec3 c = alb*(uFill*0.85 + uBounce*0.55 + uSunCol*(0.3 + 0.55*sunW))*0.3183*(0.86 + 0.28*fract(vK.y*7.3));
#ifdef MIRROR
  // The wall given back by the brine: each bird a short stroke, dark rose, darker than the water it lies on, broken by
  // the ripple; thick under the wall, thinning toward the lens (close to, the eye looks down into the brine and sees
  // crimson, not sky); none on the pattering line itself, none on dry crust.
  float brk = smoothstep(0.34, 0.62, vnoise(vQ*vec2(0.9, 0.9) + uTime*vec2(1.3, 0.9)) + 0.4*vnoise(vQ*2.9 - uTime*1.7));
  if (crustSd(vQ, 0.) > 0.48) discard;
  float dm = length(uCam.xz - vQ);
  float a = 0.62*smoothstep(7., 30., dm)*(1. - smoothstep(-26., -10., vF + 8.*(vnoise(vQ*0.11 + 5.) - 0.5)))*mix(1., brk, 0.85)*uStream.w;
  if (a < 0.02) discard;
  gl_FragColor = vec4(fxApplyFog(uDeep*0.7 + c*vec3(0.4, 0.1, 0.13)*0.45), a);
#else
  gl_FragColor = vec4(fxApplyFog(c), 1.);
#endif
}`;

// ---------- THE PATTERING LINE'S SPRAY: crowns thrown up where the last footfalls land, standing along the wave's foot ----------
// Each crown belongs to a place on the water: iK = station phase (m), metres right of the band's axis, seed, size (m). As
// the liftoff line sweeps over that place the crown leaps up, opens and falls in the time the line runs on sixteen metres
// (half a second); the same place fires again a period later. Seen from the cockpit: a broken white line of spray at the
// waterline under the wall, in front of the legs of the last runners. None on dry crust.
const CROWN_VERT = /* glsl */`
uniform vec3 uCam; uniform float uPix;
uniform vec4 uFrontP, uWall;      // as for the wave's body
uniform vec4 uCrown;              // amount 0..1, period (m), 0, 0
attribute vec4 iK;
varying vec2 vUv, vQ; varying vec3 vK;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  float a = mod(uWall.x + 3. - iK.x, uCrown.y), fds = 3. - a, life = clamp(a/16., 0., 1.);
  float L = iK.y + 0.5*uWall.y*fds*fds;
  vec2 dir = uFrontP.zw, rg = vec2(-dir.y, dir.x), g = uFrontP.xy + dir*fds + rg*L;
  float alpha = smoothstep(0., 0.08, life)*(1. - life*life)*uCrown.x*step(a, 16.);
  vec3 base = vec3(g.x, 0., g.y);
  vec3 vd = uCam - base; float dist = max(length(vd), 1e-3);
  vec3 rgt = cross(vec3(0., 1., 0.), vd); rgt /= max(length(rgt), 1e-4);
  float sz = max(iK.w*(0.5 + 0.7*sqrt(life))*mix(0.42, 1., smoothstep(14., 50., dist)), 2.4*uPix*dist)*smoothstep(9., 16., dist);
  vec3 w = base + rgt*(position.x*sz*0.62) + vec3(0., (position.y + 1.)*0.5*sz*(1.25 - 0.35*life), 0.);
  if (alpha < 0.01) w.y = -6.;
  vUv = position.xy; vQ = g; vK = vec3(alpha, iK.z*40., life);
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const CROWN_FRAG = /* glsl */`
uniform vec3 uCol;
uniform sampler2D uField; uniform vec4 uFieldRect; uniform float uSaltBias;
varying vec2 vUv, vQ; varying vec3 vK;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
${GLSL_CRUST}
${fx.GLSL_FOG_PARS_FRAG}
void main(){
  // a burst of spray: thin uneven jets from the foot, opening upward, broken into beads close to; one soft fleck far off
  float r = length(vUv*vec2(1., 0.85)), fw = fwidth(r), ang = atan(vUv.x, vUv.y + 1.3);
  float jets = 0.5 + 0.5*sin(ang*15. + vK.y), beads = 0.5 + 0.5*sin(r*11. - vK.y*2.3 + ang*5.);
  float fan = 1. - smoothstep(0.45, 1., abs(vUv.x)/(0.28 + 0.5*(vUv.y + 1.)));
  float small = smoothstep(0.05, 0.2, fw);
  float jet = smoothstep(0.3, 0.8, jets*0.62 + beads*0.5)*(1. - smoothstep(0.25, 1., r))*fan*smoothstep(-1., -0.75, vUv.y);
  float fleck = 0.62*(1. - smoothstep(0.25, 1., length(vec2(vUv.x*1.15, (vUv.y + 0.72)*3.4))));      // lying along the waterline
  float a = mix(jet, fleck, small)*vK.x;
  if (a < 0.01 || crustSd(vQ, 0.) > 0.48) discard;
  gl_FragColor = vec4(fxApplyFog(uCol), a);
}`;

// ---------- the big birds: great white pelicans and the fish eagle (world-built, placed by u every frame) ----------
const BIG_VERT = /* glsl */`
${LIT_PARS}
uniform vec3 uCam; uniform float uRipple;
attribute vec4 iP, iQ, iR;        // x, y, z, wing phase | yaw, pitch, roll, size | beat amplitude, tuck, 0, seed
attribute vec3 color, aCol2, aW;  // aW: wing side (0 = body), span 0..1, half span in metres
attribute vec2 aUV;               // wings: span 0..1, chord 0 (leading edge) .. 1 (trailing edge)
varying vec3 vC1, vC2, vN; varying vec4 vK; varying vec2 vQ, vUV;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec3 p = position, n = normal; float wing = step(0.5, abs(aW.x));
  if (wing > 0.5) {
    float sd = aW.x, u = aW.y, S = aW.z, amp = iR.x, tuck = iR.y;
    float th1 = amp*sin(iP.w) + 0.2 - 0.3*tuck, th2 = amp*0.75*sin(iP.w - 1.1) - 0.36 - 0.55*tuck;
    float u2 = max(u - 0.45, 0.), u1 = u - u2;
    float tho = u > 0.45 ? th1 + th2 : th1;
    float root = abs(position.x) - S*u;
    p.x = sd*(root + S*(u1*cos(th1) + u2*cos(th1 + th2))*(1. - 0.22*tuck));
    p.y = position.y + S*(u1*sin(th1) + u2*sin(th1 + th2));
    p.z = position.z - tuck*S*(u2*1.25 + u1*0.2) + tuck*0.12;
    // the wing is cambered: its leading edge looks forward and up, its trailing edge back and up
    n = normalize(vec3(-sd*sin(tho), cos(tho), (0.36 - aUV.y)*0.85));
  }
  p *= iQ.w;
  float cr = cos(iQ.z), sr = sin(iQ.z), cp = cos(iQ.y), sp = sin(iQ.y), cy = cos(iQ.x), sy = sin(iQ.x);
  p = vec3(p.x*cr - p.y*sr, p.x*sr + p.y*cr, p.z); n = vec3(n.x*cr - n.y*sr, n.x*sr + n.y*cr, n.z);
  p = vec3(p.x, p.y*cp + p.z*sp, p.z*cp - p.y*sp); n = vec3(n.x, n.y*cp + n.z*sp, n.z*cp - n.y*sp);
  p = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy); n = vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy);
  vec3 w = iP.xyz + p;
  vK = vec4(wing, aW.y, 1., iR.w); vC1 = color; vC2 = aCol2; vN = n; vUV = aUV;
#ifdef MIRROR
  // the bird's reflection: flipped about the water, set trembling by the ripple, and slid along the eye's ray onto the sheet
  float hh = max(w.y, 0.);
  vec3 m = vec3(w.x, -hh, w.z);
  m.xz += vec2(sin(w.z*2.3 + uTime*1.7 + hh*2.9), cos(w.x*2.1 - uTime*1.4 + hh*3.3))*(0.05 + 0.05*hh)*(0.6 + 2.*uRipple);
  float ch = max(uCam.y, 0.05);
  w = uCam + (m - uCam)*(ch/(ch + hh));
  float dm = length(w.xz - uCam.xz);
  w.y = 0.03 + 0.0005*dm;
  vK.z = (1. - smoothstep(160., 320., dm))*(1. - 0.4*smoothstep(4., 14., hh));
#endif
  vQ = w.xz;
  vec4 mvPosition = viewMatrix*vec4(w, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const BIG_FRAG = /* glsl */`
${LIT_PARS}
uniform vec3 uDeep, uCam; uniform sampler2D uField; uniform vec4 uFieldRect; uniform float uSaltBias;
varying vec3 vC1, vC2, vN; varying vec4 vK; varying vec2 vQ, vUV;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
${GLSL_CRUST}
${fx.GLSL_FOG_PARS_FRAG}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 alb = vC1;
  bool under = !gl_FrontFacing;
#ifdef MIRROR
  under = !under;                     // the mirror shows the bird from below
#endif
  if (under) { N = -N; alb = vC2; }
  float blk = 0.;
  if (vK.x > 0.5) {
    // the wing's outline is cut here, not left to the mesh: a rounded tip, the primaries spread like fingers with slots
    // between them, and a trailing edge scalloped feather by feather
    float u = vUV.x, c = vUV.y;
    float tip = 1. - 0.17*pow(abs(c*2. - 0.86), 2.2);
    float fing = abs(fract(c*5.4 + 0.3) - 0.5)*2.;
    float slot = smoothstep(0.8, 0.99, u)*0.74;
    float scal = 0.5 + 0.5*cos(u*163.);
    if (u > tip || fing > 1. - slot || c > 1. - 0.055*scal*(1. - smoothstep(0.72, 0.86, u))) discard;
#ifdef PELICAN
    // white coverts; black flight feathers: a trailing band on the arm that widens to take the whole hand, its edge
    // following the wing and stepped by the tips of the coverts. Underneath the band is broader and the lining white.
    float cb = (under ? mix(0.46, 0.14, smoothstep(0.5, 0.92, u)) : mix(0.72, 0.3, smoothstep(0.5, 0.95, u))) + 0.022*sin(u*82.);
    blk = smoothstep(cb - 0.035, cb + 0.035, c);
    float shaft = smoothstep(0.55, 1., cos(u*163.));                       // pale shafts down the flight feathers
    float rows = smoothstep(0.62, 1., abs(fract(c/max(cb, 0.1)*2.6 + 0.1*sin(u*61.)) - 0.5)*2.);   // rows of coverts, each casting a soft line on the next
    alb *= 1. - 0.13*rows*(1. - blk);
    alb = mix(alb, (under ? vec3(0.07, 0.065, 0.075) : vec3(0.04, 0.038, 0.045))*(1. + 0.9*shaft), blk);
    alb *= 0.8 + 0.2*smoothstep(0., 0.16, u);                              // shaded where the wing meets the body
#else
    alb *= 1. - 0.1*(0.5 + 0.5*sin(u*86.));                                // feather shafts across the wing
#endif
  }
  float ndl = dot(N, uSunDir), dif = clamp((ndl + 0.2)/1.2, 0., 1.);
#ifdef PELICAN
  dif = clamp((ndl + 0.9)/1.9, 0., 1.);       // white plumage scatters: the light wraps right round the body, so a pelican seen against the sun is still a white bird
  vec3 hemi = mix(uBounce*1.6 + uFill*0.5, uFill*1.3 + uSunCol*0.24, smoothstep(-0.65, 0.6, N.y));     // warm white above, rose bounce off the brine below
#else
  vec3 hemi = mix(uBounce*1.5 + uFill*0.22, uFill, N.y*.5 + .5)*1.15;                  // bright salt and brine below: bellies are well lit
#endif
  vec3 c = alb*(hemi + uSunCol*dif)*0.3183;
  c += alb*uSunCol*(vK.x*0.22*max(-ndl, 0.)*0.3183)*(1. - blk);    // a little light through the spread wing
#ifdef MIRROR
  // A reflection in the brine is the bird's own shape, wings spread, but dark, dim and stained by the water, broken into
  // strokes by the ripple and strongest where the eye meets the sheet at a low angle; no reflection lies on dry crust.
  vec3 Vw = uCam - vec3(vQ.x, 0., vQ.y); float m = 1. - clamp(Vw.y/max(length(Vw), 1e-3), 0., 1.), m2 = m*m;
  float F = 0.03 + 0.9*m2*m2*m*sqrt(m);
  float brk = smoothstep(0.22, 0.6, vnoise(vQ*5.5 + uTime*vec2(1.3, 0.9)) + 0.4*vnoise(vQ*14. - uTime*1.7));
  float a = vK.z*(1. - smoothstep(0.46, 0.5, crustSd(vQ, 0.)))*(0.34 + 0.66*F)*mix(1., brk, 0.55);
  if (a < 0.02) discard;
  vec3 lit = alb*(uFill*0.6 + uBounce*0.5 + uSunCol*0.4)*0.3183;
  gl_FragColor = vec4(fxApplyFog(uDeep*0.55 + lit*vec3(1., 0.4, 0.46)*0.24), a*0.92);
#else
  gl_FragColor = vec4(fxApplyFog(c), 1.);
#endif
}`;

// raised rims of the salt plates (real ridges near the low pass): lit and shaded flanks, cut away wherever the lake draws brine
const RIM_VERT = /* glsl */`
${LIT_PARS}
uniform vec3 uSaltCol; uniform float uSaltGain;
attribute vec2 aR;
varying vec3 vC; varying vec2 vQ;
${fx.GLSL_FOG_PARS_VERT}
void main(){
  vec3 n = normalize(normal);
  float ndl = max(dot(n, uSunDir), 0.);
  vec3 alb = uSaltCol*(0.86 + 0.14*aR.y)*(0.92 + 0.24*aR.x);
  vC = alb*(uFill*(0.5 + 0.42*n.y) + uSunCol*ndl)*0.3183*uSaltGain;
  vQ = position.xz;
  vec4 mvPosition = viewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`;
const RIM_FRAG = /* glsl */`
uniform sampler2D uField; uniform vec4 uFieldRect; uniform float uSaltBias; uniform vec4 uPools[${N_POOL}];
varying vec3 vC; varying vec2 vQ;
${GLSL_PLANE_SHADOW}
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
${GLSL_CRUST}
${fx.GLSL_FOG_PARS_FRAG}
void main(){
  float dP = 1e4;
  for (int i = 0; i < ${N_POOL}; i++) { vec4 pl = uPools[i]; dP = min(dP, length(vQ - pl.xy) - pl.z); }
  dP += (vnoise(vQ*0.5 + 5.) - 0.5)*1.7;
  if (crustSd(vQ, 0.) < 0.6 + 0.05*vnoise(vQ*1.7) || dP < 0.45) discard;      // no ridge runs out onto the lip of the crust: the lip is the lake's own thin white line
  gl_FragColor = vec4(fxApplyFog(vC*(0.92 + 0.16*vnoise(vQ*9.))*mix(vec3(1.), vec3(0.44, 0.48, 0.6), planeShadow(vQ, 1.)*uShadow2.x)), 1.);      // the biplane's shadow lies over the ridges as over the plates
}`;

// kind 'pelican' (2.9 m span) or 'eagle' (2.1 m span). Model space: nose +Z, up +Y, +X the bird's left; metres.
function bigBirdGeometry(kind) {
  const P = [], N = [], C1 = [], C2 = [], A = [], UV = [], I = [], solid = [];
  const K = (h, k = 0.8) => new THREE.Color(h).multiplyScalar(k);
  const vert = (x, y, z, nx, ny, nz, c1, c2, a, u = 0, v = 0) => { P.push(x, y, z); N.push(nx, ny, nz); C1.push(c1.r, c1.g, c1.b); C2.push(c2.r, c2.g, c2.b); A.push(a[0], a[1], a[2]); UV.push(u, v); return P.length / 3 - 1; };
  const tri = (a, b, c, s) => { I.push(a, b, c); solid.push(s); };
  // a lofted tube: rows of [z, y centre, ry, rx, top colour, bottom colour]
  const loft = (rows, sides) => {
    const rings = [];
    for (const [z, yc, ry, rx, ct, cb] of rows) {
      const start = P.length / 3; rings.push(start);
      for (let j = 0; j < sides; j++) {
        const a = (j + 0.5) / sides * Math.PI * 2, sx = Math.sin(a), cy = Math.cos(a), nl = Math.hypot(sx * ry, cy * rx) || 1;
        const c = cb.clone().lerp(ct, smoothstep(-0.5, 0.6, cy));
        vert(sx * rx, yc + cy * ry, z, sx * ry / nl, cy * rx / nl, 0, c, c, [0, 0, 0]);
      }
    }
    for (let r = 0; r < rows.length - 1; r++) for (let j = 0; j < sides; j++) {
      const a = rings[r] + j, b = rings[r] + (j + 1) % sides, c = rings[r + 1] + (j + 1) % sides, d = rings[r + 1] + j;
      tri(a, b, c, 1); tri(a, c, d, 1);
    }
  };
  const pel = kind === 'pelican';
  const white = K('#f6f1e8', 0.84), cream = K('#ead9d4', 0.76), black = K('#17161a', 1), dusk = K('#3a363a', 1);      // 'cream' is the belly: grey in its own shade
  let S, root, chord, wy, zLE, tailZ;
  if (pel) {
    loft([[-0.64, 0.02, 0.008, 0.008, white, white], [-0.52, 0.02, 0.07, 0.09, white, cream], [-0.3, 0, 0.15, 0.16, white, cream], [0, -0.01, 0.19, 0.19, white, cream],
      [0.25, 0, 0.17, 0.17, white, cream], [0.42, 0.04, 0.125, 0.12, white, cream], [0.52, 0.09, 0.09, 0.085, white, white], [0.61, 0.135, 0.078, 0.066, white, white],
      [0.7, 0.14, 0.06, 0.055, white, K('#f1d9c8')], [0.77, 0.135, 0.036, 0.04, K('#f0d6c0'), K('#f0d6c0')]], 8);
    const bill = K('#e9dcae', 0.85), billTip = K('#e2813a', 0.9), pouch = K('#f2c23e', 0.95), pouchD = K('#e8a530', 0.9), foot = K('#e89355', 0.85);
    loft([[0.74, 0.14, 0.028, 0.042, bill, bill], [0.96, 0.108, 0.016, 0.036, bill, bill], [1.16, 0.078, 0.011, 0.024, bill, billTip], [1.215, 0.06, 0.004, 0.006, billTip, billTip]], 5);
    loft([[0.7, 0.1, 0.03, 0.03, pouch, pouch], [0.84, 0.05, 0.072, 0.034, pouch, pouchD], [1.0, 0.045, 0.052, 0.028, pouch, pouchD], [1.15, 0.062, 0.012, 0.014, pouch, pouch]], 5);
    for (const sx of [-1, 1]) {
      const o = P.length / 3;
      loft([[-0.46, -0.1, 0.02, 0.03, foot, foot], [-0.62, -0.085, 0.022, 0.05, foot, foot], [-0.74, -0.07, 0.004, 0.01, foot, foot]], 4);
      for (let i = o; i < P.length / 3; i++) P[i * 3] += sx * 0.075;
    }
    S = 1.31; root = 0.14; chord = 0.68; wy = 0.07; zLE = 0.27; tailZ = [-0.5, -0.8, 0.11, 0.2];
  } else {
    const head = K('#f7f3ea', 0.86), chest = K('#7a4226', 0.95), back = K('#4c3024', 1), yel = K('#f3c636', 0.95);
    loft([[-0.36, 0.0, 0.008, 0.008, back, chest], [-0.25, 0.0, 0.075, 0.085, back, chest], [0, -0.01, 0.12, 0.125, back, chest], [0.14, 0.0, 0.112, 0.108, K('#8a7a70'), K('#b99a86')],
      [0.2, 0.005, 0.1, 0.095, head, head], [0.3, 0.025, 0.074, 0.07, head, head], [0.38, 0.04, 0.06, 0.055, head, head], [0.445, 0.04, 0.036, 0.036, head, yel]], 8);
    loft([[0.43, 0.036, 0.03, 0.024, yel, yel], [0.49, 0.026, 0.022, 0.016, yel, K('#3a3026')], [0.525, -0.004, 0.007, 0.006, K('#2a221e'), K('#2a221e')]], 5);
    for (const sx of [-1, 1]) {
      const o = P.length / 3;
      loft([[-0.02, -0.11, 0.03, 0.03, chest, chest], [-0.14, -0.15, 0.028, 0.03, yel, yel], [-0.24, -0.16, 0.03, 0.04, yel, yel], [-0.3, -0.17, 0.004, 0.006, K('#2a221e'), K('#2a221e')]], 4);
      for (let i = o; i < P.length / 3; i++) P[i * 3] += sx * 0.06;
    }
    S = 0.95; root = 0.1; chord = 0.46; wy = 0.05; zLE = 0.2; tailZ = [-0.27, -0.6, 0.1, 0.27];
  }
  // tail fan
  {
    const tc = pel ? white : K('#f7f3ea', 0.86), [z0, z1, w0, w1] = tailZ, o = P.length / 3;
    for (const [z, w] of [[z0, w0], [(z0 + z1) / 2, (w0 + w1) / 2 * 1.08], [z1, w1]]) for (const k of [-1, -0.33, 0.33, 1]) vert(k * w, 0.02 - Math.abs(k) * 0.012, z - (1 - k * k) * 0.035 * (z === z1 ? 1 : 0), 0, 1, 0, tc, tc, [0, 0, 0]);
    for (let r = 0; r < 2; r++) for (let j = 0; j < 3; j++) { const a = o + r * 4 + j; tri(a, a + 1, a + 5, 2); tri(a, a + 5, a + 4, 2); }
  }
  // wings: a fine cambered sheet out to the tip. The outline (rounded tip, fingered primaries, scalloped trailing edge) and
  // the pelican's black flight feathers are drawn in the shader from (span, chord), so they follow the wing as it bends.
  const us = [0, 0.08, 0.17, 0.3, 0.45, 0.58, 0.7, 0.8, 0.87, 0.93, 0.97, 1], cs = [0, 0.14, 0.3, 0.48, 0.66, 0.83, 1];
  const cov = pel ? white : K('#7e4628', 1), covU = pel ? K('#ece6dc', 0.74) : K('#7a4226', 0.95), fly = pel ? white : K('#1e1917', 1), flyU = pel ? covU : K('#2a2422', 1);
  for (const sd of [1, -1]) {
    const grid = [];
    for (let i = 0; i < us.length; i++) {
      const u = us[i], ch = chord * (u < 0.14 ? 0.8 + u * 1.43 : 1 - 0.24 * (u - 0.14)), le = zLE - 0.15 * u * u - 0.05 * smoothstep(0.8, 1, u); grid.push([]);
      for (const c of cs) {
        const isFly = !pel && c > 0.42 - Math.max(u - 0.6, 0) * 0.9;
        const y = wy + 0.062 * Math.sin(Math.PI * Math.pow(c, 0.6)) * (1 - 0.55 * u) - 0.03 * c;
        grid[i].push(vert(sd * (root + S * u), y, le - c * ch, 0, 1, 0, isFly ? fly : cov, isFly ? flyU : covU, [sd, u, S], u, c));
      }
    }
    for (let i = 0; i < us.length - 1; i++) for (let j = 0; j < cs.length - 1; j++) { const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1]; tri(a, b, c, 2); tri(a, c, d, 2); }
  }
  // winding: closed parts face outward, flat parts face up (so the back face is the underside)
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2];
    va.set(P[a * 3], P[a * 3 + 1], P[a * 3 + 2]); vb.set(P[b * 3], P[b * 3 + 1], P[b * 3 + 2]); vc.set(P[c * 3], P[c * 3 + 1], P[c * 3 + 2]);
    fn.copy(vb).sub(va).cross(vc.sub(va));
    const d = solid[t / 3] === 2 ? fn.y : fn.x * (N[a * 3] + N[b * 3] + N[c * 3]) + fn.y * (N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1]) + fn.z * (N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2]);
    if (d < 0) { I[t + 1] = c; I[t + 2] = b; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C1, 3)); g.setAttribute('aCol2', new THREE.Float32BufferAttribute(C2, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  return g;
}

function pickLook(ctx) {
  const lr = ctx.rng.fork('look'), r1 = lr(), r2 = lr(), r3 = lr(), vary = ctx.vary || {};
  let id = r1 < 0.12 ? 'noon' : r1 < 0.27 ? 'morning' : r1 < 0.4 ? 'evening' : r1 < 0.55 ? 'morning' : r1 < 0.7 ? 'dawn' : r1 < 0.82 ? 'rains' : r1 < 0.92 ? 'moon' : 'morning';
  if (vary.hour === 'dawn') id = 'dawn';
  else if (vary.hour === 'golden') id = 'evening';
  else if (vary.hour === 'night') id = 'moon';
  else if (vary.hour === 'day' && (id === 'dawn' || id === 'evening' || id === 'moon')) id = r3 < 0.5 ? 'morning' : r3 < 0.75 ? 'rains' : 'noon';
  const season = r2 < 0.22 ? 'dry' : r2 < 0.34 ? 'december' : r2 < 0.45 ? 'dry' : r2 < 0.62 ? 'october' : r2 < 0.8 ? 'december' : 'october';
  return { id, season, look: LOOKS[id] };
}

async function build(ctx) {
  const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
  const { id: lookId, season, look } = pickLook(ctx);
  const dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
  const scene = new THREE.Scene();
  const C = (h) => new THREE.Color(h);
  const DUR = 38;

  // ---------- the route: in at 8.8 m on the cone's axis, sinking to 4.7 m by d 200 and 3 m over the crust, a long right
  //            curve onto the crescent (the cone slides to the left of the nose), a swooping left turn through the wave
  //            and into the flock (the cone crosses to the right), and a last right turn back onto the cone and the
  //            ring. It is integrated from a heading and a height given over path distance, so the band, the field
  //            and the ring follow it. ----------
  // <route>
  const bend = rng.range(0.9, 1.12), yLow = rng.range(2.9, 3.3);
  const X = (x) => x * bend;
  const A1 = 29 * bend, A2 = 25 * bend, A3 = 38;      // degrees right of -Z held through the first runners; degrees left of it held inside the flock; degrees right of it at the top of the last swing
  // The approach is the brief's level entry: straight down the cone's axis (heading exactly -Z until d 190), in at
  // 8.8 m and sinking, down an open lead of crimson brine that carries the cone's reflection, banks of crazed salt
  // either side of it, the feeding parties wading eight metres off the line.
  const headOld = (d) => A1 * smoothstep(190, 480, d);
  const headAt = (d) => headOld(d)
    // the last third: still at three metres, the nose swings from A2 left clean through to A3 right, sideways through the
    // thick of the flock (the cone crosses from the right of the frame to its left edge; the sun stays behind the shoulder on every
    // look), then back onto the cone for 70 m straight to the ring
    - (A1 + A2) * smoothstep(590, 770, d) + (A2 + A3) * smoothstep(848, 984, d) - A3 * smoothstep(1016, 1130, d);
  const HY = [[0, 8.8], [60, 8.3], [130, 6.1], [200, 4.7], [295, yLow + 0.25], [362, yLow - 0.25], [440, yLow + 0.1], [600, yLow], [740, yLow + 0.15], [830, yLow - 0.15], [960, yLow + 0.05], [1040, 4.5], [1100, 6.0], [1140, 6.5], [1300, 6.5]];
  const hyAt = (d) => { let k = 0; while (k < HY.length - 2 && d > HY[k + 1][0]) k++; const t = clamp((d - HY[k][0]) / (HY[k + 1][0] - HY[k][0]), 0, 1); return lerp(HY[k][1], HY[k + 1][1], t * t * (3 - 2 * t)); };
  const routePts = [];
  {
    let x = 0, z = 0;
    for (let i = 0; i <= 600; i++) { const d = i * 2; if (d < 300 || d > 780 ? i % 15 === 0 : i % 30 === 0) routePts.push([x, hyAt(d), z]); const a = headAt(d + 1) * Math.PI / 180; x += Math.sin(a) * 2; z -= Math.cos(a) * 2; }
  }
  const path = makePath(routePts);
  // </route>
  // the route's first half for the shaders (uRoute): every 16 m of -z from the entry: x, cos(heading), path distance, sin(heading)
  const routeTab = [];
  {
    let x = 0, z = 0, d = 0;
    for (let i = 0; i < 34; i++) {
      const zt = -16 * i;
      while (z > zt) { const a = headAt(d + 0.5) * Math.PI / 180; x += Math.sin(a); z -= Math.cos(a); d += 1; }
      const a = headAt(d) * Math.PI / 180, back = (zt - z) / Math.cos(a);
      routeTab.push(new THREE.Vector4(x - Math.sin(a) * back, Math.cos(a), d - back, Math.sin(a)));
    }
  }
  await ctx.yield();
  const LEN = path.length, P0 = 318, sPortal = LEN - P0, bandL = sPortal + 60, TAIL = 420;
  const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3();
  const ringXZ = path.posAtDist(LEN, new THREE.Vector3());

  // ---------- sky, fog, light ----------
  const skyOpts = Object.assign({ rng, preset: look.preset, clouds: false, clouds2: false, ground: look.fog, renderer: ctx.renderer }, look.sky);
  if (vary.mood !== undefined && vary.mood > 0.8) skyOpts.clouds2 = false;   // one visit in five the morning is as bare as the brief has it
  // the evening sun stands 48.5 degrees right of the heading held through the first runners: its disc stays just outside
  // the frame there (only its path on the water shows) and comes well inside it at the top of the last swing
  const sunAz = lookId === 'evening' ? A1 + 48.5 : look.az;
  if (lookId === 'moon') { skyOpts.bake = true; skyOpts.bodyOverrides = { 0: { elevation: look.el, azimuth: sunAz } }; }
  else { skyOpts.sunElevation = look.el; skyOpts.sunAzimuth = sunAz; }
  await ctx.yield();
  const sky = makeSky(skyOpts);
  scene.add(sky.object);
  scene.fog = new THREE.FogExp2(C(look.fog), look.fogD);
  await ctx.yield();
  const rig = makeLightRig(sky, { bounce: 0.45 });
  scene.add(rig.object);
  const elR = look.el * Math.PI / 180, azR = sunAz * Math.PI / 180;
  const SUN = new THREE.Vector3(Math.sin(azR) * Math.cos(elR), Math.sin(elR), -Math.cos(azR) * Math.cos(elR)).normalize();
  const sunCol = C(look.sun).multiplyScalar(look.sunI), fillCol = C(look.fill).multiplyScalar(look.fillI);
  const cCrimson = C(PALETTE[0]), cDeep = C(PALETTE[1]), cPink = C(PALETTE[2]), cSalt = C(PALETTE[4]), cGrey = C(PALETTE[6]);
  const bounceCol = cPink.clone().lerp(cCrimson, 0.15).multiplyScalar(look.bounce * 0.95);
  const LIT = { uSunDir: { value: SUN }, uSunCol: { value: sunCol }, uFill: { value: fillCol }, uBounce: { value: bounceCol }, uTime: { value: 0 } };
  await ctx.yield();

  // ---------- where crust and brine lie (CPU field, also baked to a texture for the lake shader) ----------
  const PS = [];
  for (let d = -60; d <= LEN + TAIL + 60; d += 22) { path.posAtDist(d, _p); path.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1; PS.push({ x: _p.x, z: _p.z, tx: _t.x / l, tz: _t.z / l, d }); }
  const rel = (x, z) => {
    let best = 1e18, bi = 0;
    for (let i = 0; i < PS.length; i++) { const dx = x - PS[i].x, dz = z - PS[i].z, dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } }
    const s = PS[bi], dx = x - s.x, dz = z - s.z;
    return { d: s.d + dx * s.tx + dz * s.tz, lat: dx * -s.tz + dz * s.tx };
  };
  path.posAtDist(P0, _p); path.tangentAtDist(P0, _t);
  const A0 = { x: _p.x, z: _p.z, fx: _t.x, fz: _t.z, lx: _t.z, lz: -_t.x };   // band start: forward and left
  const HORN = [];
  for (let d = 0; d <= 760; d += 40) { const f = 0.00045 * d * d - 8; HORN.push([A0.x + A0.lx * d + A0.fx * f, A0.z + A0.lz * d + A0.fz * f]); }
  const o1 = rng.range(0, 60), o2 = rng.range(0, 60), seasonBias = season === 'dry' ? 0.2 : 0, leadHalf = rng.range(10, 14);
  const groups = [];
  let islet = 1, raft = 0, clearA = 1, baking = false;
  // the banks of the entry lead: crazed crust either side of the cone's axis from the entry to d 110, open brine 13 m
  // either side of the axis between them (the lake shader draws them from uCause; here for the CPU tests)
  const CW = { x: 0, zEnd: -121, hw: 13.2 };
  const causeAt = (x, z) => smoothstep(-1.2, 1.2, Math.abs(x - CW.x) - CW.hw - 0.4) * smoothstep(CW.zEnd, CW.zEnd + 26, z) * (1 - smoothstep(40, 60, z));
  const at = (d, lat, out = new THREE.Vector3()) => { path.posAtDist(d, out); path.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1; out.x += -_t.z / l * lat; out.z += _t.x / l * lat; out.y = 0; return out; };
  // The low pass over the crust: marabou stand close on the left, a pool with a party of lesser flamingos lies on the
  // right. The design names no quarter of the route: U25 is the site's own key for where the three stand, and it, the
  // pool's two dealt numbers and the scatter's `avoid` stand as the site has them; nothing else is typed from it.
  const U25 = 0.25 * LEN, standSide = -1;
  const seepA = at(U25 + rng.range(30, 38), rng.range(17, 20)), stand = at(U25 + rng.range(12, 14), standSide * rng.range(7.6, 8.4)), creche = at(rng.range(210, 235), rng.range(44, 52));
  const xr = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x2f6e2b1) >>> 0);    // a second stream for things added later, so the first keeps its order
  const poolD = U25 + xr.range(12.3, 12.9), poolLat = xr.range(4.1, 4.3);
  // THE POOL lies at the seat the site deals it: poolD along the route, poolLat (4.1 to 4.3 m) right of its line, so
  // its water reaches under the right wing. Its party is dealt inside it by the part and keeps one margin, the one
  // every bird that stands keeps from the lane under the airframe (LANE_HALF, 5.2 m: `minLat` on the pool below, the
  // same number adjust keeps for a standing bird): the party wades in the pool's outer side, and a bird for which
  // that side has no room left is not stood (fewer than the ten asked for may stand).
  // WHAT adjust DOES (it is not one keep-off for every bird on the water): a bird that never lifts, or that stands
  // before band station -20, is moved out to LANE_HALF if it stands nearer the line; a bird of the band's scatter
  // that lifts between band stations -20 and 240 is moved out to KEEP_WATER (6.4 m: the lane's 5.2 m, a flamingo's
  // own 1.0 m span and a hand more); a runner of the stragglers blocks is not moved here at all (the build's last
  // block, THE FLIERS KEPT OFF OUR LINE BY PLACE, moves outward a runner that fails its tests); from band station 240
  // on nothing is moved. KEEP_WATER is also the least distance of the scatter's random groups (outliers.minLat).
  // POOL_MARGIN: a feeding group stands no nearer than 15 m to the edge of the three things in `holds` (the pool, the
  // seep's pad and the marabou's pad): the room the groups' own rule gives a group from the next one along the
  // route where they stand widest apart (15 m at the entry). It is also room enough that a group standing on
  // crust, which wades in a pool of its own 5.75 m in radius (3.5 x 1.1 + 1.9, see where the pools are handed to
  // the lake), keeps its water apart from the other's.
  const KEEP_WATER = 6.4, POOL_MARGIN = 15, POOL_R = 2.9, POOL_ACROSS = 0.9;
  const poolAt = at(poolD, poolLat);
  const apron = at(U25 + 7.5, 6.8);                 // crust under the right wing too: it takes the biplane's shadow, the pool lies beyond it
  const pads = [{ x: seepA.x, z: seepA.z, r: 13 }, { x: stand.x, z: stand.z, r: 11 }, { x: apron.x, z: apron.z, r: 8.5 }];
  // what a feeding group keeps POOL_MARGIN from, three things and no more: the pool where it really lies (poolAt, to
  // its drawn radius), the seep's crust pad and the marabou's crust pad (pads[0] and pads[1], each to its edge). The
  // bar's own seep lies fifty metres and more from the line, where no group of the approach wades.
  const holds = [{ x: poolAt.x, z: poolAt.z, r: POOL_R * 1.1 + 1.9 }, pads[0], pads[1]];
  if (season === 'december') pads.push({ x: creche.x, z: creche.z, r: 34 });
  const fieldAt = (x, z) => {
    let v = 0.53 + 0.4 * noise.fbm2(x * 0.0085 + o1, z * 0.0085 + o2, 3);
    islet = 1; raft = 0; clearA = 1;
    const mx = x - X(90), mz = z + 560;
    if (mx * mx + mz * mz < 1500 * 1500) {
      const r = rel(x, z), al = Math.abs(r.lat), st = r.d - P0;
      // the approach: crust under the wheels, then an open lead down the axis (it carries the cone's reflection), then crust again
      const lead = 1 - smoothstep(216, 250, r.d);     // open brine from the entry on: crust banks either side
      const lw = leadHalf + 2 + 5 * noise.n2(r.d * 0.02, o1) + 9 * smoothstep(104, 140, r.d) * (1 - smoothstep(224, 248, r.d));   // broad where the pelicans cross
      v += 0.2 * (1 - smoothstep(60, 190, al)) * (1 - smoothstep(-40, 20, st));
      v += 0.6 * smoothstep(236, 256, r.d) * (1 - smoothstep(326, 348, r.d)) * (1 - smoothstep(26, 44, al));
      v -= 0.8 * lead * (1 - smoothstep(lw, lw + 10, al));
      // the band stands in brine; the nest bar lies along its left side
      const inBand = smoothstep(8, 36, st) * (1 - smoothstep(bandL + TAIL - 80, bandL + TAIL + 40, st));
      v -= 0.95 * inBand * (1 - smoothstep(36, 54, al));
      islet = 1 - smoothstep(-30, 20, st) * (1 - smoothstep(46, 64, al));
      // rafts of crust standing in the band's brine from the first runners on, either side of the route, never round the
      // ring. Under the route a strip of bare mirror stays open all the way: no raft nearer the line than 5.2 m (rafts
      // may lie from 5.2 to 8.5 m off it outward). Over the design's last beat ("34-38 s, u 0.91-1": from route metre
      // 0.91 x LEN, the design's own number, to the ring and past it) no raft stands nearer the line than 15 m (the
      // design: "a lane of bare mirror 30 m wide with the portal standing in it"); the margin eases out from 5.2 m to
      // 15 m over the 40 m of route before that metre (`open`: 0 to 9.8 m added to both ends of the margin's ramp).
      { const rx = x - ringXZ.x, rz = z - ringXZ.z, open = (15 - 5.2) * smoothstep(0.91 * LEN - 40, 0.91 * LEN, r.d); raft = smoothstep(r.lat < -8 ? 120 : 50, r.lat < -8 ? 160 : 90, st) * (1 - smoothstep(sPortal + 30, sPortal + 90, st)) * smoothstep(5.2 + open, 8.5 + open, al) * (1 - smoothstep(44, 60, al)) * smoothstep(16, 30, Math.sqrt(rx * rx + rz * rz)); }
      islet *= 1 - lead * (1 - smoothstep(lw - 3, lw + 5, al));   // the entry lead stays open brine from bank to bank: it carries the cone's reflection, and the pelicans cross it
      v += 0.75 * smoothstep(8, 60, st) * (1 - smoothstep(bandL + 150, bandL + 330, st)) * smoothstep(44, 56, -r.lat) * (1 - smoothstep(118, 140, -r.lat));
      let hd = 1e9;
      for (let i = 0; i < HORN.length; i++) { const dx = x - HORN[i][0], dz = z - HORN[i][1]; hd = Math.min(hd, dx * dx + dz * dz); }
      hd = Math.sqrt(hd);
      v -= 0.85 * (1 - smoothstep(30, 48, hd));
      islet *= smoothstep(40, 60, hd);
      v += 0.5 * (1 - smoothstep(36, 60, Math.abs(hd - 88))) * smoothstep(60, 110, A0.lx * (x - A0.x) + A0.lz * (z - A0.z));   // the bar runs on behind the far horn
      for (let i = 0; i < pads.length; i++) { const g = pads[i], dx = x - g.x, dz = z - g.z; v += 0.7 * (1 - smoothstep(g.r * 0.6, g.r * 1.25, Math.sqrt(dx * dx + dz * dz))); }
      // Open brine wherever a feeding group wades in the lead. The bake has 10 m texels,
      // so every pad falls away over sixteen metres (never a rim sharper than the bake can carry: that drew
      // straight-edged and stepped shores), and pads that overlap carve once, as one water, not once each.
      if (r.d < 300) { let carve = 0; for (let i = 0; i < brinePads.length; i++) { const g = brinePads[i], dx = x - g.x, dz = z - g.z; carve = Math.max(carve, 1 - smoothstep(g.r - 4, g.r + 12, Math.sqrt(dx * dx + dz * dz))); } v = lerp(v, Math.min(v, -0.3), carve); islet *= 1 - carve; }
      // no plate awash where the courting block's feeders wade (the bake's fourth channel)
      if (r.d < 520 && al < 40) for (let i = 0; i < platePads.length; i++) { const g = platePads[i], dx = x - g.x, dz = z - g.z; clearA *= smoothstep(g.r, g.r + 6, Math.sqrt(dx * dx + dz * dz)); }
      // the pools the feeding parties wade in: drawn by the lake shader from uPools (crisp shores); here only for the CPU tests
      if (!baking) v += 0.95 * causeAt(x, z);
      for (let i = 0; i < groups.length; i++) { const g = groups[i]; if (g.open || (baking && !g.bake)) continue; const dx = x - g.x, dz = z - g.z, dd = Math.sqrt(dx * dx + dz * dz); v -= 1.3 * (1 - (baking ? smoothstep(g.R - 5, g.R + 7, dd) : smoothstep(g.R - 0.3, g.R + 1.2, dd))); }      // (a pool beyond the shader's N_POOL is baked: soft, as the bake can carry it)
    }
    const far = Math.max(Math.abs(x - X(90)), Math.abs(z + 560));
    return clamp(lerp(v, 0.3, smoothstep(1500, 1900, far)), 0, 1);
  };
  const isSalt = (x, z, m = 0.08) => fieldAt(x, z) + seasonBias > 0.5 + m;
  const isBrine = (x, z, m = 0.1) => fieldAt(x, z) + seasonBias < 0.5 - m;

  // ---------- the hero: the liftoff wave, laid along the route from P0 ----------
  const cnt = { near: 268, mid: Math.round(860 * Math.min(dens, 1.1)), far: Math.round(7400 * Math.min(dens, 1.2)), mirror: 1060, sprites: 1400, farMirror: 3000, midMirror: 700 };
  // the courting block: its near edge 6 m off the left wingtip, abeam at 0.3475 of the route (the brief: "a marching block of 400 passes 6 m beyond the left wingtip")
  const mSt = rng.range(0, 2) + 0.3475 * LEN - P0, VF = 38, uEsc0 = rare ? 0.668 : 0.612;
  const mGap = 2.4 + rng.range(5.2, 5.8);
  // How far ahead of the eye the liftoff line runs. It starts behind the wingtips (the marchers are still marching as we
  // pass), comes up level with the nose at u 0.4 (the first birds run right under it), outruns it to 40 m by u 0.47 and
  // holds there: the wave. Later we gain on it a little, and at the last the stragglers patter beneath us.
  const leadAt = (camS, u) => {
    const x = clamp((camS - 66) / 160, 0, 1);
    let lead = -78 + 118 * (0.6 * x + 0.4 * x * x * (3 - 2 * x));
    lead = lerp(lead, 58, smoothstep(0.6, 0.72, u));
    lead = lerp(lead, 40, smoothstep(0.8, 0.93, u));
    return lead;
  };
  const N_GEN = 15, N_BLZ = 40, N_PATH = N_GEN + 8 + 9 + 7 + 6 + N_BLZ, N_WALL = 72, N_ESC = N_PATH + N_WALL, N_SKEIN = 9, N_STREAM = 36;
  // late runners: each lifts when the eye is `gap` m short of it (negative: it is still running as we pass over)
  const lateJit = (g0, g1) => (st, r) => { const uu = clamp((st + P0 - 20) / LEN, 0, 1), gap = st > sPortal - 40 ? r.range(-14, 4) : r.range(g0, g1); return clamp((leadAt(st - 20, uu) - gap) / VF, 0, 3); };
  const sWave = 0.615 * LEN - P0;
  // where a reflection may lie: on brine and in the pools, never on dry crust. The same uniform objects go to the lake below.
  const poolV = []; for (let i = 0; i < N_POOL; i++) poolV.push(new THREE.Vector4(0, 1e6, 0, 0));
  const grpV = []; for (let i = 0; i < N_GRP; i++) grpV.push(new THREE.Vector4(1e6, 0, 1, 1));
  const crustU = { uField: { value: null }, uFieldRect: { value: new THREE.Vector4(0, 0, 1, 0) }, uSaltBias: { value: seasonBias }, uPools: { value: poolV }, uCause: { value: new THREE.Vector4(CW.x, CW.zEnd, CW.hw, 1) }, uRoute: { value: routeTab }, uGrp: { value: grpV } };
  const mirrorClip = { uniforms: crustU, pars: /* glsl */`
uniform sampler2D uField; uniform vec4 uFieldRect; uniform float uSaltBias; uniform vec4 uPools[${N_POOL}];
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
${GLSL_CRUST}
float mirrorOnWater(vec2 q){
  float dP = 1e4;
  for (int i = 0; i < ${N_POOL}; i++) { vec4 pl = uPools[i]; dP = min(dP, length(q - pl.xy) - pl.z); }
  dP += (vnoise(q*0.5 + 5.) - 0.5)*1.7;
  return max(1. - smoothstep(0.46, 0.5, crustSd(q, 0.)), 1. - smoothstep(-0.25, 0.05, dP));
}` };
  // ---------- THE BARE LANE UNDER THE PLANE (a margin in space) ----------
  // The only water kept clear of standing birds is the lane the airframe itself needs: the wings span nine metres, so
  // no bird that STANDS when the plane comes by (the feeding groups, the calm parties, the pool's party) stands
  // nearer the route's line than LANE_HALF (the wingtip and seven tenths of a metre). There is no other keep-out: a
  // bird that slides out of the picture by a lower corner as we pass it is the flight. Inside the band, where the
  // liftoff line runs level with the nose, the birds of the scatter keep 6.4 m off the line (the live rule, see
  // adjust), and a flier lower than the eye keeps outside the wingtips (escAt). THE RUNNERS are the exception, as on
  // the site: the birds of the stragglers blocks are laid from 0.6 m off the line outward and neither the lane nor
  // adjust carries them aside; they run on the water and skim on under the airframe, three metres under the eye, as
  // we come over them. (The build's last block, THE FLIERS KEPT OFF OUR LINE BY PLACE, moves outward a runner that
  // lifts before we are abeam of it and would fly within 5.0 m of our line, or, if we pass it on the water, whose
  // skin comes within 2.0 m of our line there or after it lifts; a runner we pass on the water and clear of that
  // is left where the part laid it.)
  const eyeAt = (d) => path.posAtDist(clamp(d, 0, LEN), _p).y, LANE_HALF = 5.2;

  // ---------- the approach: feeding groups beside the route ----------
  // The brief: "feeding groups slide by 8 m either side". They are lesser flamingos, rose-pink; the nearest bird of a
  // group wades 7.2 to 8 m from the line and the group spreads outward from there, in the open brine of the lead.
  const yr = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x7a31c5d) >>> 0);    // a third stream, for later additions
  // The flock's four forks are taken from the stream FIRST, before the group rule draws anything, so that the deal of
  // the wave's risers, the blizzard, the staged risers and the stream birds depends on the seed alone and not on how
  // many groups the rule sets down. New seeded things fork after these, in the order they were added: the plates'
  // phase (round 10), the feeding groups and the staged risers' standing poses (round 11).
  const yrWave = yr.fork('wave-body'), yrBlz = yr.fork('blizzard'), yrEarly = yr.fork('early-wall'), yrStream = yr.fork('stream');
  const plateSeed = Math.floor(yr.fork('plates')() * 97);
  const grpR = yr.fork('groups'), yrStand = yr.fork('riser-stand');
  const placed = [], brinePads = [], platePads = [], rulePools = [], calmRule = [], grpPads = [];
  // THE FEEDING GROUPS, BY ONE RULE ALONG THE WHOLE APPROACH (path distance, metres from the route's line), drawn from
  // a fork of their own: a group of four to seven lesser flamingos on alternate sides of the line, from the brief's
  // first frame ("feeding birds and their rings 18 m ahead": the first two groups stand 18 to 24 m down the route, one
  // either side) to where the band's own feeding parties take over (CALM_S0). The groups stand closer together the
  // lower the plane flies, because the lower the eye the shorter its view of the water under it: 15 m apart at the
  // entry's 8.8 m, 10 m apart at three metres. Each bird wades whole, filtering head down, walking slowly, standing,
  // preening, asleep on one leg or stretching a wing, with its rings and its dark copy in the brine (no plate awash
  // lies where a group wades: uGrp). Where one of the world's own companies holds the water a group leaves it to it:
  // no group within POOL_MARGIN of the edge of a pool, a seep or the marabou's stand, none beside the courting block. Up to the band the groups stand all day;
  // inside it they look up, turn and run when the wave reaches them, like every other bird.
  const RUN_S0 = 92, CALM_S0 = 96;      // band stations (kept from the live source): its first runners stand from RUN_S0, its own feeding parties from CALM_S0
  await ctx.yield();
  const GRP_END = P0 + CALM_S0, grpFlip = grpR() < 0.5 ? -1 : 1, mD = P0 + mSt, eye0 = eyeAt(0);
  for (let k = 0, d0 = 18 + grpR.range(0, 6); d0 < GRP_END; k++, d0 += k === 1 ? grpR.range(1, 5) : 15.2 * (0.45 + 0.55 * eyeAt(d0) / eye0) + grpR.range(-2, 2)) {
    const side = (k % 2 ? -1 : 1) * grpFlip, n = 4 + Math.floor(grpR() * 3.999), sp0 = grpR.range(1.2, 1.7), near = 7.2 + grpR.range(0, 0.8);
    at(d0 + (n - 1) * 0.4, side * (near + 1.8), _q);
    const onCrust = fieldAt(_q.x, _q.z) + seasonBias > 0.4, spread = onCrust ? 0.8 : sp0, lw = onCrust ? 2.6 : 4.0;      // a group that stands where crust lies stands close, in its own pool
    let held = false;      // POOL_MARGIN, from the group's nearest bird (its middle, where it was just tested for crust, less its own half length or half width) to the edge of every pool, seep and stand
    for (const h of holds) if (Math.hypot(_q.x - h.x, _q.z - h.z) < h.r + POOL_MARGIN + Math.max(0.5 * (n - 1) * spread, 0.5 * lw)) held = true;
    if (held || (side < 0 && Math.abs(d0 + 5 - mD) < 22)) continue;
    let md = 0, ml = 0;
    for (let i = 0; i < n; i++) {
      const d = d0 + i * spread + grpR.range(-0.5, 0.5), lat = side * (near + (onCrust ? 0.5 : 0) + lw * ((i * 0.618 + grpR() * 0.5) % 1)), r = grpR();
      const beh = i === 0 ? 1 : r < 0.42 ? 0 : r < 0.6 ? 1 : r < 0.74 ? 3 : r < 0.87 ? 2 : 5, size = grpR.range(0.9, 1.0), turn = (grpR() < 0.5 ? -1 : 1) * grpR.range(0.9, 2.2), any = grpR.range(-3.1, 3.1);
      if (d > P0 - 6) calmRule.push({ s: d - P0, lat, beh, size, hold: 0.05 + 0.55 * grpR() });
      else placed.push({ s: d - P0, lat, size, beh, yaw: beh === 0 ? any : turn });
      md += d / n; ml += lat / n;
    }
    at(md, ml, _q);
    if (onCrust) rulePools.push({ x: _q.x, z: _q.z, r: 3.5, pool: true });
    if (md < 216) brinePads.push({ x: _q.x, z: _q.z, r: 8 });
    grpPads.push([md, ml, 1.6 + 0.5 * n * spread, 3.1]);      // no plate awash where the group wades (the lake's uGrp, in the route's own coordinates)
  }
  for (let i = 0; i < Math.min(N_GRP, grpPads.length); i++) grpV[i].set(grpPads[i][0], grpPads[i][1], grpPads[i][2], grpPads[i][3]);
  await ctx.yield();
  // the courting block's own edge: feeders at its two ends (ahead of it and behind it along the route), 6.5 to 11.5 m
  // left of the line (the lane's margin moves any that would stand inside it); they run with the block when the wave comes
  for (let i = 0; i < 12; i++) {
    const end = i % 2 ? 1 : -1, j = i >> 1;
    if (j % 3 === 1) { at(mD + end * (14.8 + 1.5 * j), -9, _q); platePads.push({ x: _q.x, z: _q.z, r: 4.5 }); }      // no plate awash where they or the block wade
    if (j < 3) { at(mD + end * 5 * j, -13, _q); platePads.push({ x: _q.x, z: _q.z, r: 5 }); }
    calmRule.push({ s: mSt + end * (14.8 + 1.5 * j + yr.range(-0.4, 0.4)), lat: -(6.5 + 5 * ((j * 0.618 + 0.3 * yr()) % 1)), beh: [0, 0, 3, 0, 1, 5][j], size: yr.range(0.9, 1.0), hold: 0.3 + 0.6 * yr() });
  }
  // ---------- where the gaze is pulled (the engine blends these into the lens's heading) ----------
  const mAtX = at(P0 + mSt, -mGap);
  const marchAt = new THREE.Vector3(mAtX.x, 0.7, mAtX.z);
  const waveAt = new THREE.Vector3(), downAt = new THREE.Vector3(), lowAt = new THREE.Vector3(), laneAt = new THREE.Vector3(), uLow = rare ? 0.701 : 0.62;
  const pois = [
    // the approach: the gaze dips into the lead and the crust (the waders, the pelicans, the plates), so the horizon rides high
    { at: (time, u) => { path.posAtDist(Math.min(u * LEN + 30, LEN), downAt); downAt.y = -2.5; return downAt; }, from: 0.02, to: 0.3, weight: 0.36, fade: 0.2 },
    { at: marchAt, from: 0.26, to: 0.385, weight: 0.62, fade: 0.3 },
    // the wave: level, at the wall as it runs round the bend
    { at: (time, u) => { path.posAtDist(Math.min(u * LEN + 70, LEN), waveAt); waveAt.y += 1.0; return waveAt; }, from: 0.4, to: 0.6, weight: 0.4, fade: 0.3 },
    // inside the flock: down a little to the string low over the mirror; later to the lane's water and the ring's reflection
    { at: (time, u) => { path.posAtDist(Math.min(u * LEN + 26, LEN), lowAt); lowAt.y = 0.4; return lowAt; }, from: uLow - 0.055, to: uLow + 0.065, weight: 0.32, fade: 0.3 },
    { at: (time, u) => { path.posAtDist(Math.min(u * LEN + 45, LEN), laneAt); laneAt.y = 1.0; return laneAt; }, from: 0.85, to: 0.93, weight: 0.3, fade: 0.3 },
  ];
  // The world's last word on where a bird of the flock stands (the part calls it for every near and mid bird; it draws
  // no random numbers). Every rule here is in path distance and metres from the route's line.
  const adjust = (b) => {
    if (b.march) return;
    // A RUNNER IS NOT MOVED HERE (the build's last block moves outward the runners that fail its tests). The runners are the birds of the stragglers blocks: the part lays them from 0.6 m off the
    // route's line outward, under the airframe and beside it, and each is running on the water or skimming a metre
    // over it as the eye comes over it, three metres up. Neither the bare lane nor the band's keep-off below carries
    // one aside. A runner is known here as the part's own shader knows it (its `low`): a bird of the band that
    // cruises under two metres, which only the stragglers blocks deal.
    if (b.s < 1e4 && b.cruise < 2.0) return;
    const flies = b.s < 1e4, d = P0 + (flies ? b.s : b.s0);      // an outlier never lifts: its own station is s0
    if (!(d < P0 + 240)) return;      // from band station 240 on the liftoff line runs ahead of the nose: nothing is on the water there when the lens comes by
    let lat = b.lat;
    // THE BARE LANE (LANE_HALF): no bird that stands when the plane comes by (a bird that never lifts: the feeding
    // groups, the pool's party) stands under the wings. A bird of the band's scatter and the calm parties (band
    // stations -20 to 240, where the liftoff line runs level with the nose) keeps 6.4 m off the line.
    const keep = flies && b.s > -20 ? KEEP_WATER : LANE_HALF;
    if (Math.abs(lat) < keep) lat = (lat < 0 ? -1 : 1) * (keep + 1.3 * ((b.seed * 17.3) % 1));
    if (lat !== b.lat) { at(d, lat, _q); b.x = _q.x; b.z = _q.z; b.lat = lat; }
  };
  await ctx.yield();

  const sm = (x) => 0.5 * (x + Math.sqrt(x * x + 0.16));
  // NO BIRD RISES THROUGH THE COCKPIT OR COMES UP UNDER THE NOSE: a rule of the route, for every bird escAt places, the
  // whole flight. A bird that flies lower than the eye keeps a least distance to the side of the route's line, and the
  // lower it flies the more it keeps. Both numbers are the airframe's (src/rides/biplane.js). KEEP_DROP 0.98 m: the
  // lower wing lies that far under the eye, so a bird that far down or further is level with the lower wing or beneath
  // it. KEEP_SIDE: such a bird keeps the bare lane's own half width off the line (LANE_HALF: the 4.5 m half span and
  // seven tenths of a metre, the margin the standing birds keep on the water), so it flies outside the wingtips; from
  // the eye's own height, where nothing is asked, the distance grows to that over the 0.98 m. The side is the bird's
  // own (the sign of its lat), so none changes sides, and the distance is joined to its own offset in quadrature: no
  // step in its track, and two low birds still fly at different distances.
  const KEEP_DROP = 0.98, KEEP_SIDE = LANE_HALF;
  const escAt = (e, time, u, out) => {
    const tau = (u - e.uc) * DUR, hang = e.hang ?? 1.5, slow = e.slow ?? 2.0, d = u * LEN;
    const a = (e.a0 ?? 6.8) - slow * tau + (18.4 - slow) * sm(-tau - hang) - ((e.low ? 8 : 14) - slow) * sm(tau - hang) + 0.5 * Math.sin(time * 0.4 + e.ph * 2.9);
    const clear = e.low ? 0 : smoothstep(5.6, 2, a);           // as we come up on it, it lifts over the top wing and eases outward (the low ones pass beneath)
    path.posAtDist(d, _p); const eye = _p.y;
    path.posAtDist(Math.min(d + a, LEN + 30), out); path.tangentAtDist(Math.min(d + a, LEN), _t); const l = Math.hypot(_t.x, _t.z) || 1;
    const lat = e.lat + (e.vlat ?? 0) * tau + 0.4 * Math.sin(time * 0.6 + e.ph) + Math.sign(e.lat) * (1.3 * clear + (e.swing ? e.swing * smoothstep(10.5, 4.5, a) : 0))      // swing: it peels off to the side as we come up on it
      + (e.low ? (e.lat < 0 ? -1 : 1) * 4.2 * sm(tau - hang + 0.1) : 0);      // a low one banks away to its own side as it drops astern
    out.y = Math.max(eye + e.up + (e.climb ?? 0) * tau + 0.28 * Math.sin(time * 0.8 + e.ph * 2.3) + 2.7 * clear * (e.up > 0.2 ? 1 : 0), 1.3);
    const latK = (e.lat < 0 ? -1 : 1) * Math.hypot(lat, KEEP_SIDE * smoothstep(0, KEEP_DROP, eye - out.y));      // lower than the eye: outside the wingtips (above)
    out.x += -_t.z / l * latK; out.z += _t.x / l * latK;
    out.w = a;
    return out;
  };
  const _e4 = new THREE.Vector4();
  // THE WAVE'S WALL: the 72 slots of the wall's parties are first the staged risers of the wave. EVERY ONE IS A WHOLE
  // BIRD AT ITS FULL SIZE FROM THE FIRST FRAME UNTIL IT IS ASTERN: it stands in the band feeding like its neighbours,
  // and the wave's own trigger lifts it: when the liftoff line (the plane's path distance and its lead) comes to the
  // bird's station it has looked up, turned into the breeze, opened its wings and run its seven metres on the water
  // (the part's own clock and stride, with its pats, crowns and rings), and it lifts from the pattering line, climbs
  // to its place in the wall, hangs there while we close on it and is overtaken (the high ones over the top wing,
  // the low ones outside the wingtips). Nothing is scaled, nothing appears in open sky, and no moment is typed:
  //   WHERE IT STANDS: one riser in each of 72 even steps of band station (its place in the step dealt), from the
  //     station the liftoff line has reached when its lead first holds the wall's nearest place (WALL_NEAR and the
  //     gap below) to the station it has reached one hang short of the end of the design's wave ("18-23 s, u
  //     0.48-0.62: THE WAVE rolls 45 m ahead of the nose"), so that the last risers' hang ends as the wave does.
  //   WHEN IT HANGS follows from where it stands: it lifts as the line passes its station, RISER_GAP m beyond its
  //     place's own ground track (it lifts seven metres on and settles back into the place as it climbs), so the birds
  //     that stood nearest the entry lift first and hang first.
  //   ITS PLACE IN THE WALL, dealt by the risers' own stream ('early-wall') in metres in the route's frame:
  //     ahead of the eye: from WALL_NEAR (12 m: where the design's birds beside the cockpit end, "5 to 12 m") to the
  //       lead the line has as the bird lifts, never more than the design's 45 m, less the gap: so the wall hangs
  //       inside the lead and nearer while the lead is short;
  //     to the side of the route's line: across the band's own width (WALL_HALF 31 m either side: the half width
  //       the lake draws the pattering band with), thicker toward the line the band is thickest along, and never
  //       nearer it than 1.6 m;
  //     above the water: from 1.6 m to the design's 25 m (dealt to 23, and it climbs on slowly through its hang),
  //       thicker low (the square of an even deal); the high birds hang at the back of the wall, the low ones at
  //       its foot nearest us.
  //   ITS END: it keeps this law until it is 6 m astern of the eye and is hidden there; from the share of the route
  //     at which it is astern by that distance and half a metre (its wander) the slot is its party bird's. The
  //     parties' own moments are not read anywhere in this.
  // A greater flamingo only at the back of the wall (26 m and more ahead while it hangs).
  const wallEarly = [], RISER_GAP = 3, RISER_BLEND = 1.5;
  const frontAtU = (u) => { const cs = u * LEN - P0; return cs + leadAt(cs, u); };
  const travelB = (rt) => { const t1 = Math.min(rt, 2.1); return 0.5 * 7.143 * t1 * t1 + 15 * Math.max(rt - 2.1, 0); };      // metres run and flown, as the part's shader has it
  const wrapPi = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  const riserSprites = [];
  await ctx.yield();
  {
    const wr = yrEarly, WALL_NEAR = 12, WALL_LEAD = 45, WALL_TOP = 25, WALL_HALF = 31, WAVE_END = 0.62, HANG = [0.9, 1.3];
    const leadU = (u) => leadAt(u * LEN - P0, u);
    const uAtFront = (st) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = 0.5 * (lo + hi); if (frontAtU(m) < st) lo = m; else hi = m; } return 0.5 * (lo + hi); };
    let lo = 0.2, hi = WAVE_END;
    for (let i = 0; i < 30; i++) { const m = 0.5 * (lo + hi); if (leadU(m) < WALL_NEAR + RISER_GAP + 1) lo = m; else hi = m; }
    const S_A = frontAtU(hi), S_B = Math.max(frontAtU(WAVE_END - (HANG[0] + HANG[1]) / DUR), S_A + 1);
    const nom = (e, u) => escAt(e, 0, u, _e4).w - 0.5 * Math.sin(e.ph * 2.9);      // metres ahead of the eye, without its wander
    for (let ri = 0; ri < N_WALL; ri++) {
      if ((ri & 7) === 7) await ctx.yield();
      const st = S_A + (ri + wr()) / N_WALL * (S_B - S_A), uL = uAtFront(st), leadL = leadU(uL), eyeL = eyeAt(uL * LEN);
      const hf = wr(), H = lerp(1.6, WALL_TOP - 2, hf * hf), up = H - eyeL;
      const a0 = lerp(WALL_NEAR, Math.max(Math.min(leadL, WALL_LEAD) - RISER_GAP - 1, WALL_NEAR), clamp(0.08 + 0.72 * hf + wr.range(-0.16, 0.2), 0, 1));
      let lat = (wr() < 0.5 ? -1 : 1) * WALL_HALF * Math.pow(wr(), 1.5);
      if (Math.abs(lat) < 1.6) lat = (lat < 0 ? -1 : 1) * wr.range(1.6, 2.4);
      const big = a0 >= 26 && wr() < 0.25;
      const ew = { uc: uL, a0, lat, up, climb: up > 1 ? wr.range(0.15, 0.5) : 0, slow: 1.5, hang: wr.range(HANG[0], HANG[1]), low: false, swing: up < 0.5 ? 6 : 0,
        rise: (BIRD_CLOCK.climb + BIRD_CLOCK.climbPerM * H) / DUR, size: big ? wr.range(1.3, 1.4) : wr.range(0.96, 1.08), ph: wr.range(0, 6.28), s: st, gone: 1 };
      // its moment: the middle of its hang falls where its place is RISER_GAP m short of the line as the bird lifts
      lo = uL - 0.03; hi = uL + 0.25;
      for (let i = 0; i < 26; i++) { ew.uc = 0.5 * (lo + hi); if (nom(ew, uL) < leadL - RISER_GAP) lo = ew.uc; else hi = ew.uc; }
      ew.uc = 0.5 * (lo + hi);
      // its end: the share of the route at which it is 6.5 m astern
      lo = ew.uc; hi = ew.uc + 0.4;
      for (let i = 0; i < 26; i++) { const m = 0.5 * (lo + hi); if (nom(ew, m) > -6.5) lo = m; else hi = m; }
      ew.gone = hi;
      // where it stands (under its own place: a low flier's place lies outside the wingtips, by the route's rule), the
      // heading it runs on, its standing pose, and the footfall sprites the part draws for its run
      const glat = (lat < 0 ? -1 : 1) * Math.hypot(lat, KEEP_SIDE * smoothstep(0, KEEP_DROP, -up)) + 0.4 * Math.sin(ew.ph);
      at(P0 + st, glat, _q); path.tangentAtDist(Math.min(P0 + st, LEN), _t);
      const l = Math.hypot(_t.x, _t.z) || 1, r = yrStand();
      ew.gx = _q.x; ew.gz = _q.z; ew.fx = _t.x / l; ew.fz = _t.z / l; ew.yawF = Math.atan2(_t.x, _t.z);
      ew.rest = ew.yawF + yrStand.range(-2.6, 2.6); ew.beh = r < 0.5 ? 0 : r < 0.68 ? 1 : r < 0.8 ? 3 : r < 0.92 ? 2 : 5;
      riserSprites.push({ x: ew.gx, z: ew.gz, yaw: ew.yawF, s: ew.s, size: ew.size, seed: yrStand() });
      wallEarly.push(ew);
    }
  }
  await ctx.yield();

  const hero = await buildHero(ctx, {
    adjust,
    escorts: N_ESC + N_SKEIN + N_STREAM,
    stragglers: [
      // THE RUNNERS, laid across the route's line as the site lays them (its `lat` numbers; adjust moves none of them;
      // the build's last block, THE FLIERS KEPT OFF OUR LINE BY PLACE, moves outward those that fail its tests).
      // The band's first runners, from its station RUN_S0 on, 0.8 to 8.5 m either side of the line as dealt: under the
      // airframe and beside it; each lifts as the eye comes over it (when the eye is from about 30 m short of it to 12 m
      // past it, and never before the liftoff line reaches it) and skims on at 0.45 to 0.95 m, below the wheels
      { count: Math.round(118 * (0.75 + 0.25 * detail)), from: RUN_S0, to: 250, lat: [0.8, 8.5], cruise: [0.45, 0.95], jit: lateJit(-12, 30) },
      // through the wave and the flock: late runners 0.6 to 10 m either side of the line, each lifting when the eye is
      // from about 34 m short of it to 12 m past it, so some are still pattering on the water as we pass over them
      { count: Math.round(86 * (0.75 + 0.25 * detail)), from: 250, to: sWave, lat: [0.6, 10], cruise: [0.55, 1.25], jit: lateJit(-12, 34) },
      { count: Math.round(56 * (0.75 + 0.25 * detail)), from: sWave, to: 0.73 * LEN - P0, lat: [0.6, 10], cruise: [0.55, 1.35], jit: lateJit(-12, 34) },
      // to the ring (the part's own spread, 0.6 to 10 m either side, and its own skim, 1.1 to 2 m): the birds of the
      // last forty metres lift when the eye is from 4 m short of them to 14 m past them: the stragglers that patter
      // beneath us at the end
      { count: Math.round(72 * (0.75 + 0.25 * detail)), from: 0.73 * LEN - P0, to: sPortal - 5, jit: lateJit(-12, 34) },
    ],
    // parties beside the route (6.4 m and more off its line) that feed until the wave reaches them, then look up, turn
    // into the breeze and run with it like every other bird; the second block stands where the route comes down onto the band
    calm: [{ count: 40, from: CALM_S0, to: 330, lat: [6.6, 11.5], hold: [0, 0.6] }],
    // the rule's groups inside the band and the feeders at the courting block's two ends (laid above by path distance)
    calmPlace: calmRule,
    wall: [{ count: Math.round(330 * (0.7 + 0.3 * detail)), from: 150, to: sWave + 70, lat: 15, high: 0.34, low: 7.5 },   // a wall with a base: two thirds of it climbs no higher than 2 to 9.5 m
      { count: Math.round(92 * (0.7 + 0.3 * detail)), from: sWave + 70, to: sPortal - 185, lat: 16, high: 0.3, low: 7.5 },      // and the sheet stays thick through the last swing
      // the wave watched from behind (u 0.43 to 0.61): more risers close to the axis, so the wall is thickest ahead of the nose,
      { count: Math.round(92 * (0.7 + 0.3 * detail)), from: 170, to: sWave + 30, lat: 8.5, high: 0.4, low: 7.5 },
      // and late runners beside the route, still pattering with their crowns up as the nose comes over them
      { count: Math.round(108 * (0.7 + 0.3 * detail)), from: 236, to: sWave + 40, lat: 14, latMin: 6.4, cruise: [2.7, 4.6], jit: lateJit(8, 40) }],
    mirrorClip, spriteBirds: riserSprites,
    palette: HERO_PALETTE, nearBias: [bandL * 0.3, bandL * 0.74, 0.55], length: bandL, tail: TAIL, vF: VF, path, pathFrom: P0, water: false, counts: cnt, density: 1, season,
    weather: lookId === 'rains' ? 'rains' : lookId === 'noon' ? 'noon' : 'calm', skyHorizon: look.hor, skyZenith: look.zen,
    light: { sunDir: SUN, sunColor: sunCol, sky: fillCol, ground: bounceCol },
    marchStation: mSt, marchGap: mGap, marchCount: 333, marchRadius: 19, marchHold: 1.1, marchLead: 0,
    outliers: { mid: Math.round(250 * Math.min(dens, 1.1)), far: Math.round(2400 * dens * (0.5 + 0.5 * detail)), from: -P0, horn: 700, keep: (x, z) => isBrine(x, z, 0.04),
      avoid: [U25 - 34 - P0, U25 + 52 - P0],
      minLat: KEEP_WATER,      // the scatter's random groups stand 6.4 m and more from the route's line, the whole flight
      // a party of lesser flamingos feeding in a pool on the crust beside the low pass; the pool lies at the site's seat
      // (poolLat), its party keeps the standing birds' margin from the lane under the airframe (LANE_HALF)
      pool: [{ s: poolD - P0, lat: poolLat, r: POOL_R, n: 10, size: 0.97, minLat: LANE_HALF, along: 0.95, across: POOL_ACROSS }],
      // the feeding groups of the approach, bird by bird (world coordinates)
      place: placed },
  });
  scene.add(hero.object);
  scene.userData.natron = { marabou: null };
  // the pools: the first N_POOL go to the lake shader, any beyond that are baked into the field
  { let k = 0; for (const g of rulePools.concat(hero.outlierGroups || [])) { g.R = g.pool ? g.r * 1.1 + 1.9 : g.r * 1.5 + 2.2; if (!g.open) { if (k < N_POOL) poolV[k++].set(g.x, g.z, g.R, 0); else g.bake = true; } groups.push(g); } }
  hero.uniforms.uRipple.value = look.ripple;
  if (look.rim) hero.uniforms.uRim.value.set(look.rim[0], look.rim[1]);
  hero.uniforms.uOver.value.set(118, 0.86 * LEN - P0);  // from the first runners to the lane the high fliers near the axis pass over the eye
  // THE OVER-FLIERS' BASE over the route at the lens is a sum, typed here once: 5.0 m, the design's clear air between a
  // flight line and ours, taken on a bird's skin; 0.30, the bob; 0.035, the wingbeat's heave; 0.35 x 1.02, a bird's reach
  // (0.80 of its size) less its body's height (0.45 of its size) at size 1.02, the top of the range the part deals a
  // bird's size from. Their RANGE above the base is 5.5 m. Both are read by the line below, by the fliers' block
  // (its table and its box) and by update().
  const OVER_BASE = 5.0 + 0.30 + 0.035 + 0.35 * 1.02, OVER_RANGE = 5.5;
  hero.uniforms.uOverH.value.set(3.2 + OVER_BASE, OVER_RANGE);            // 5.69 to 11.19 m above it (set from the route's height every frame; until then the height stands at 3.2)
  await ctx.yield();

  const FN = 384, FS = 3840, FOX = X(90) - FS / 2, FOZ = -560 - FS / 2;
  const fdata = new Uint8Array(FN * FN * 4);
  baking = true;
  for (let j = 0; j < FN; j++) {
    for (let i = 0; i < FN; i++) {
      const v = fieldAt(FOX + (i + 0.5) / FN * FS, FOZ + (j + 0.5) / FN * FS), o = (j * FN + i) * 4;
      fdata[o] = Math.round(v * 255); fdata[o + 1] = Math.round(islet * 255); fdata[o + 2] = Math.round(raft * 255); fdata[o + 3] = Math.round(clearA * 255);
    }
    if (j % 4 === 3) await ctx.yield();
  }
  baking = false;
  const fieldTex = new THREE.DataTexture(fdata, FN, FN, THREE.RGBAFormat, THREE.UnsignedByteType);
  fieldTex.magFilter = fieldTex.minFilter = THREE.LinearFilter; fieldTex.wrapS = fieldTex.wrapT = THREE.ClampToEdgeWrapping; fieldTex.needsUpdate = true;

  // the plates: one jittered site per 3.7 m cell, shared by the lake shader and the rim ridges
  const SN = 64, CS = 0.27, sdata = new Uint8Array(SN * SN * 4);
  { const sr = xr.fork('sites'); for (let i = 0; i < SN * SN; i++) { sdata[i * 4] = sr.int(0, 255); sdata[i * 4 + 1] = sr.int(0, 255); sdata[i * 4 + 2] = sr.int(0, 255); sdata[i * 4 + 3] = 255; } }
  const siteTex = new THREE.DataTexture(sdata, SN, SN, THREE.RGBAFormat, THREE.UnsignedByteType);
  siteTex.magFilter = siteTex.minFilter = THREE.NearestFilter; siteTex.wrapS = siteTex.wrapT = THREE.RepeatWrapping; siteTex.needsUpdate = true;

  crustU.uField.value = fieldTex; crustU.uFieldRect.value.set(FOX, FOZ, 1 / FS, plateSeed);      // w: the plates' phase (which cells of the route carry a plate awash, by seed)
  const fogC = C(look.fog);
  const coneLit = cGrey.clone().multiply(fillCol.clone().multiplyScalar(0.7).add(sunCol.clone().multiplyScalar(0.45))).multiplyScalar(0.3183);
  const lakeU = {
    ...fx.fogUniforms(), ...LIT,
    uField: crustU.uField, uSites: { value: siteTex }, uFieldRect: crustU.uFieldRect, uCause: crustU.uCause, uRoute: crustU.uRoute, uGrp: crustU.uGrp, uCam: { value: new THREE.Vector3() },
    uShallow: { value: cCrimson.clone() }, uDeep: { value: cDeep.clone() }, uOrange: { value: C('#c4541f').multiplyScalar(0.75) },
    uSaltCol: { value: cSalt.clone().multiplyScalar(0.82) }, uSkyHor: { value: C(look.hor) }, uSkyZen: { value: C(look.zen) }, uCrim: { value: lookId === 'moon' || lookId === 'rains' ? 0 : 1 },
    uConeCol: { value: coneLit.clone().lerp(fogC, look.coneHaze) }, uPinkCol: { value: cPink.clone().multiplyScalar(0.8) },
    uCone: { value: new THREE.Vector4(CONE.Rb / CONE.dist, coneH(0) / CONE.dist, CONE.t0, CONE.k) },
    uShadow: { value: new THREE.Vector4(0, 0, 0, 1) }, uShadow2: { value: new THREE.Vector4(0, 0, 6, 0.015) }, uShadow3: { value: new THREE.Vector4(0, 0, 0, 0) }, uPools: crustU.uPools, uGlit: { value: look.glit ?? (lookId === 'dawn' ? 1 : lookId === 'rains' ? 0.25 : 0.6) },
    uCloud: { value: new THREE.Vector4(1, 1, 1, 0) },
    uRipple: { value: look.ripple }, uLum: { value: look.lum }, uWet: { value: look.wet }, uSaltGain: { value: look.salt },
    uSaltBias: crustU.uSaltBias, uMirage: { value: lookId === 'noon' ? 1 : 0 },
    uFrontP: { value: new THREE.Vector4(0, 1e5, 0, -1) }, uFrontK: { value: new THREE.Vector4(0, 30, 0, 0) },
    uMar: { value: [new THREE.Vector4(0, 1e5, 2, 0), new THREE.Vector4(0, 1e5, 2, 0), new THREE.Vector4(0, 1e5, 2, 0)] },
    uFlockCol: { value: C(HERO_PALETTE[2]).multiplyScalar(0.82).multiply(fillCol.clone().multiplyScalar(0.75).add(bounceCol.clone().multiplyScalar(0.5)).add(sunCol.clone().multiplyScalar(0.5))).multiplyScalar(0.3183) },
    uPix: { value: 0.0027 }, uMass: { value: new THREE.Vector4(0.18, 0.04, 0.055, 0) },
  };
  { const m = cDeep.clone().multiplyScalar(1.15 * look.lum / 0.8).lerp(lakeU.uFlockCol.value, 0.1); lakeU.uMass.value.set(m.r, m.g, m.b, 0); }      // the wall in the mirror: dark rose, darker than the brine's own tone on every look (it follows the look's water)
  {
    const c2 = skyOpts.clouds2 || null, c1 = skyOpts.clouds || null, cc = C(c2 ? c2.lit : c1 ? c1.shade : '#ffffff').multiplyScalar(0.92);
    lakeU.uCloud.value.set(cc.r, cc.g, cc.b, lookId === 'moon' ? 0 : c2 ? 0.55 : c1 ? 0.6 : 0);
  }
  const lakeGeo = new THREE.CircleGeometry(4300, 72); lakeGeo.rotateX(-Math.PI / 2); lakeGeo.translate(X(90), 0, -560);
  const lake = new THREE.Mesh(lakeGeo, new THREE.ShaderMaterial({ uniforms: lakeU, vertexShader: LAKE_VERT, fragmentShader: LAKE_FRAG, fog: true }));
  lake.frustumCulled = false; lake.matrixAutoUpdate = false; lake.name = 'lake'; scene.add(lake);
  await ctx.yield();

  // ---------- raised rims: real ridges along the plate edges within 17 m of the low pass (same sites as the shader) ----------
  {
    const P = [], Nn = [], R = [], I = [], rr = xr.fork('rims');
    const site = (i, j) => { const o = ((((j % SN) + SN) % SN) * SN + (((i % SN) + SN) % SN)) * 4; return [i + 0.5 + (sdata[o] / 255 - 0.5) * 0.6, j + 0.5 + (sdata[o + 1] / 255 - 0.5) * 0.6]; };
    const NB = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    const dEnd = P0 + 64, seen = new Set(), cells = [];
    for (let d = -14; d <= dEnd; d += 3) {
      path.posAtDist(Math.max(d, 0), _p); path.tangentAtDist(Math.max(d, 0), _t);
      const bx = _p.x + _t.x * Math.min(d, 0), bz = _p.z + _t.z * Math.min(d, 0);
      for (let l = -20; l <= 20; l += 3) {
        const i = Math.floor((bx - _t.z * l) * CS), j = Math.floor((bz + _t.x * l) * CS), key = i + ':' + j;
        if (!seen.has(key)) { seen.add(key); cells.push([i, j]); }
      }
    }
    await ctx.yield();
    let nSeg = 0;
    for (let ci = 0; ci < cells.length; ci++) {
      const [i, j] = cells[ci], s0 = site(i, j);
      // the plate: a box round its site clipped by the bisector with each of the eight neighbours
      let poly = [[s0[0] - 2, s0[1] - 2, -1], [s0[0] + 2, s0[1] - 2, -1], [s0[0] + 2, s0[1] + 2, -1], [s0[0] - 2, s0[1] + 2, -1]];
      for (let k = 0; k < 8 && poly.length > 2; k++) {
        const s1 = site(i + NB[k][0], j + NB[k][1]), nx = s1[0] - s0[0], ny = s1[1] - s0[1], c = nx * (s0[0] + s1[0]) * 0.5 + ny * (s0[1] + s1[1]) * 0.5, out = [];
        for (let a = 0; a < poly.length; a++) {
          const A = poly[a], B = poly[(a + 1) % poly.length], da = nx * A[0] + ny * A[1] - c, db = nx * B[0] + ny * B[1] - c;
          if (da <= 0) out.push(A);
          if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, da <= 0 ? k : A[2]]); }
        }
        poly = out;
      }
      for (let a = 0; a < poly.length; a++) {
        const A = poly[a], B = poly[(a + 1) % poly.length], k = A[2];
        if (k < 0 || k > 3) continue;                                   // each shared edge once (from the cell that has it on its +x / +z side)
        const ax = A[0] / CS, az = A[1] / CS, ex = (B[0] - A[0]) / CS, ez = (B[1] - A[1]) / CS, len = Math.hypot(ex, ez);
        if (len < 0.45) continue;
        const mx = ax + ex * 0.5, mz = az + ez * 0.5, near = path.nearestXZ(mx, mz);
        if (near.dist > 17.5 || fieldAt(mx, mz) + seasonBias < 0.36) continue;
        const fade = 1 - smoothstep(11.5, 17.5, near.dist), px = -ez / len, pz = ex / len, n = Math.max(1, Math.round(len / 0.9));
        const H = (0.085 + 0.06 * rr()) * fade, w = 0.18 + 0.05 * rr(), seed = rr();
        let prev = -1;
        for (let q = 0; q <= n; q++) {
          const t = q / n, ends = 0.55 + 0.45 * Math.sin(Math.PI * t), wob = (rr() - 0.5) * 0.07 * Math.sin(Math.PI * t), h = Math.max(H * ends * (0.7 + 0.6 * rr()), 0.004);
          const cx = ax + ex * t, cz = az + ez * t, nl = Math.hypot(h, w), o = P.length / 3;
          P.push(cx + px * w, 0.004, cz + pz * w, cx + px * wob, h, cz + pz * wob, cx + px * wob, h, cz + pz * wob, cx - px * w, 0.004, cz - pz * w);
          Nn.push(px * h / nl, w / nl, pz * h / nl, px * h / nl, w / nl, pz * h / nl, -px * h / nl, w / nl, -pz * h / nl, -px * h / nl, w / nl, -pz * h / nl);
          R.push(0, seed, 1, seed, 1, seed, 0, seed);
          if (prev >= 0) { I.push(prev, o, o + 1, prev, o + 1, prev + 1, prev + 2, o + 2, o + 3, prev + 2, o + 3, prev + 3); nSeg++; }
          prev = o;
        }
      }
      if (ci % 50 === 49) await ctx.yield();
    }
    await ctx.yield();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 2)); g.setIndex(I);
    const rims = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: RIM_VERT, fragmentShader: RIM_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: { ...fx.fogUniforms(), ...LIT, uSaltCol: lakeU.uSaltCol, uSaltGain: lakeU.uSaltGain, uField: lakeU.uField, uFieldRect: lakeU.uFieldRect, uSaltBias: lakeU.uSaltBias, uPools: lakeU.uPools, uCause: lakeU.uCause, uRoute: lakeU.uRoute, uGrp: lakeU.uGrp, uShadow: lakeU.uShadow, uShadow2: lakeU.uShadow2, uShadow3: lakeU.uShadow3 } }));
    rims.frustumCulled = false; rims.matrixAutoUpdate = false; scene.add(rims);
  }
  await ctx.yield();

  // ---------- the big birds: pelicans in line astern, and the fish eagle of the rare visit ----------
  const makeBig = (kind, n) => {
    const base = bigBirdGeometry(kind), iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4), iR = new Float32Array(n * 4);
    const attrs = { iP: new THREE.InstancedBufferAttribute(iP, 4), iQ: new THREE.InstancedBufferAttribute(iQ, 4), iR: new THREE.InstancedBufferAttribute(iR, 4) };
    for (const k in attrs) attrs[k].setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) { iP[i * 4 + 1] = -60; iR[i * 4 + 3] = xr(); }
    const geo = new THREE.InstancedBufferGeometry(); geo.index = base.index;
    for (const k in base.attributes) geo.setAttribute(k, base.attributes[k]);
    for (const k in attrs) geo.setAttribute(k, attrs[k]);
    geo.instanceCount = n;
    const uni = () => ({ ...fx.fogUniforms(), ...LIT, uCam: lakeU.uCam, uRipple: lakeU.uRipple, uDeep: lakeU.uDeep, uField: lakeU.uField, uFieldRect: lakeU.uFieldRect, uSaltBias: lakeU.uSaltBias, uCause: lakeU.uCause, uRoute: lakeU.uRoute, uGrp: lakeU.uGrp });
    const defs = kind === 'pelican' ? { PELICAN: 1 } : {};
    const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: BIG_VERT, fragmentShader: BIG_FRAG, fog: true, side: THREE.DoubleSide, defines: { ...defs } }));
    const mirror = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: BIG_VERT, fragmentShader: BIG_FRAG, fog: true, side: THREE.DoubleSide, defines: { ...defs, MIRROR: 1 },
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
    mesh.frustumCulled = mirror.frustumCulled = false; mesh.matrixAutoUpdate = mirror.matrixAutoUpdate = false; mirror.renderOrder = 1;
    mesh.name = kind === 'pelican' ? 'pelicans' : kind; scene.add(mesh, mirror);
    return { n, iP, iQ, iR, tris: base.index.count / 3,
      set(i, x, y, z, phase, yaw, pitch, roll, size, amp, tuck) { const o = i * 4; iP[o] = x; iP[o + 1] = y; iP[o + 2] = z; iP[o + 3] = phase; iQ[o] = yaw; iQ[o + 1] = pitch; iQ[o + 2] = roll; iQ[o + 3] = size; iR[o] = amp; iR[o + 1] = tuck; },
      commit() { attrs.iP.needsUpdate = attrs.iQ.needsUpdate = attrs.iR.needsUpdate = true; } };
  };

  // ---------- the cone, its steam, the rift wall and Gelai ----------
  const far = new THREE.Group(); scene.add(far);
  {
    const SEG = 96, RINGS = 30, pos = [], col = [], idx = [];
    const ash = C('#a9a6a0'), base = cGrey.clone().multiplyScalar(0.74), fo = rng.range(0, 50);
    for (let r = 0; r <= RINGS; r++) {
      const t = CONE.t0 + (1 - CONE.t0) * Math.pow(r / RINGS, 1.45);
      for (let i = 0; i < SEG; i++) {
        const a = i / SEG * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const wob = noise.n2(ca * 1.7 + fo, sa * 1.7);
        const rid = Math.pow(Math.abs(Math.sin(a * 11 + wob * 2.4)), 0.7), rid2 = Math.pow(Math.abs(Math.sin(a * 29 + wob * 5 + 1.3)), 0.8);
        const flute = smoothstep(0.04, 0.3, t) * (1 - 0.5 * smoothstep(0.6, 1, t));
        const rad = CONE.Rb * t * (1 + 0.07 * wob - flute * (0.13 * (1 - rid) + 0.05 * (1 - rid2)));
        const y = r === RINGS ? -30 : coneH(t) * (1 + 0.035 * noise.n2(ca * 4 + fo, sa * 4 + t * 3)) + (r === 0 ? 10 * noise.n2(a * 3, fo) : 0);
        pos.push(sa * rad, y, ca * rad);
        const streak = smoothstep(0.1, 0.7, noise.n2(a * 9 + fo, t * 2.5)) * (1 - smoothstep(0.08, 0.5, t));
        const c = base.clone().multiplyScalar(0.82 + 0.3 * rid * flute + 0.12 * wob).lerp(ash, 0.75 * streak + 0.25 * (1 - smoothstep(0.05, 0.16, t)));
        col.push(c.r, c.g, c.b);
      }
      await ctx.yield();   // ring by ring
    }
    for (let r = 0; r < RINGS; r++) for (let i = 0; i < SEG; i++) {
      const a = r * SEG + i, b = r * SEG + (i + 1) % SEG, c = a + SEG, d = b + SEG;
      idx.push(a, c, b, b, c, d);
    }
    const top = pos.length / 3; pos.push(0, coneH(0) - 26, 0); col.push(base.r * 0.6, base.g * 0.6, base.b * 0.6);
    for (let i = 0; i < SEG; i++) idx.push(top, i, (i + 1) % SEG);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    await ctx.yield();
    g.computeVertexNormals();
    await ctx.yield();
    const coneMat = new THREE.ShaderMaterial({ vertexShader: CONE_VERT, fragmentShader: CONE_FRAG,
      uniforms: { ...LIT, uHaze: { value: fogC.clone() }, uHazeAmt: { value: look.coneHaze }, uMirage: { value: lookId === 'noon' ? 1 : 0 } } });
    const cone = new THREE.Mesh(g, coneMat); cone.position.set(0, 0, -CONE.dist); cone.frustumCulled = false; far.add(cone);
    await ctx.yield();
    // steam leaning off the summit
    const sg = new THREE.PlaneGeometry(900, 420);
    const steamCol = C('#f1eee8').multiply(fillCol.clone().add(sunCol.clone().multiplyScalar(0.55))).multiplyScalar(0.3183 * 0.9);
    const steam = new THREE.Mesh(sg, new THREE.ShaderMaterial({ vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false,
      uniforms: { uCol: { value: steamCol }, uTime: LIT.uTime, uAmt: { value: lookId === 'moon' ? 0.6 : 0.85 } } }));
    steam.position.set((0.5 - 0.12) * 900, coneH(0) + (0.5 - 0.1) * 420 - 14, -CONE.dist + 70); steam.frustumCulled = false; steam.renderOrder = 1; far.add(steam);
    await ctx.yield();
    // the far shores: the rift's western wall to the right (a stepped fault scarp with a lower bench in front of it), a
    // lower broken scarp and its outliers along the far shore to the left, Gelai behind-left. Neither runs behind the cone.
    const wp = [], wi = [], wx = [], wo = rng.range(0, 40), sunH = Math.hypot(SUN.x, SUN.z) || 1;
    const strip = (a0, a1, n, hFn, hz, R) => {
      const start = wp.length / 3;
      for (let i = 0; i <= n; i++) {
        const u = i / n, a = (a0 + (a1 - a0) * u) * Math.PI / 180, h = hFn(u), sx = Math.sin(a), sz = -Math.cos(a);
        const lit = clamp((-sx * SUN.x - sz * SUN.z) / sunH * 0.75 + 0.3, 0.04, 1) * clamp(SUN.y * 2.4 + 0.45, 0.5, 1);
        const rows = [[-12, 1, 0], [h * 0.38, 1.02, 0.4], [h * 0.9, 1.028, 0.86], [h, 1.05, 1]];      // fan, cliff, rim, plateau edge
        for (const [y, k, v] of rows) { wp.push(sx * R * k, y, sz * R * k); wi.push(u, v, hz, lit); }
      }
      for (let i = 0; i < n; i++) for (let r = 0; r < 3; r++) { const a = start + i * 4 + r, b = a + 4; wx.push(a, b, a + 1, a + 1, b, b + 1); }
    };
    // stepped plateau: benches at two heights broken by fault notches, never a smooth hill line
    const steps = (u, f, o) => { const n1 = noise.n2(u * f + wo + o, 1.5), n2 = noise.n2(u * f * 3.1 + o, wo + 4.2), n3 = noise.n2(u * f * 13 + o, 7); return 0.5 + 0.26 * smoothstep(-0.25, -0.12, n1) + 0.22 * smoothstep(0.18, 0.3, n1 + 0.3 * n2) - 0.14 * smoothstep(0.42, 0.5, n2) + 0.035 * n3; };
    const ends = (u, a, b) => smoothstep(0, a, u) * (1 - smoothstep(1 - b, 1, u));
    // The design's tone and places: "a pale 600 m scarp far to the right", "Gelai a faint dome behind-left", under a
    // near-white horizon. Every mass is lifted to a pale tint by the haze; the low shore to the left is the faintest.
    strip(21, 172, 190, (u) => 330 * steps(u, 7, 0) * ends(u, 0.07, 0.14), 1, 3900);                         // the western wall
    strip(27, 150, 150, (u) => 118 * steps(u, 11, 31) * ends(u, 0.12, 0.2), 0.55, 3600);                     // its lower bench
    strip(-112, -21, 130, (u) => 105 * steps(u, 9, 57) * ends(u, 0.2, 0.1) * (0.55 + 0.45 * smoothstep(0.1, 0.6, u)), 1.55, 3850);   // the far shore to the left: low and pale
    strip(-170, -116, 44, (u) => 250 * Math.pow(Math.sin(Math.PI * u), 1.4) * (0.94 + 0.06 * noise.n2(u * 7, wo)), 1.5, 3950);      // Gelai, a faint dome
    await ctx.yield();
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('aInfo', new THREE.Float32BufferAttribute(wi, 4)); wg.setIndex(wx);
    const wall = new THREE.Mesh(wg, new THREE.ShaderMaterial({ vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, side: THREE.DoubleSide,
      uniforms: { uCol: { value: C('#a8998e') }, uHaze: { value: fogC.clone() }, uSunCol: LIT.uSunCol, uFill: LIT.uFill, uHazeAmt: { value: look.wallHaze } } }));
    wall.frustumCulled = false; far.add(wall);
    await ctx.yield();
    if (lookId === 'rains') {
      const rm = new THREE.ShaderMaterial({ vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uCol: { value: C('#77828c').multiply(fillCol).multiplyScalar(0.3183 * 1.1) }, uTime: LIT.uTime } });
      // the five curtains are one mesh (one colour, so the blend does not depend on their order): one draw call, not five
      const rp = [], ruv = [], rix = [];
      for (const [az, w, h] of [[52, 1500, 900], [84, 1900, 1050], [118, 1400, 850], [-64, 1300, 800], [20, 700, 620]]) {
        const a = az * Math.PI / 180, g = new THREE.PlaneGeometry(w, h), b0 = rp.length / 3;
        g.rotateY(-a); g.translate(Math.sin(a) * 3300, h * 0.5 - 20, -Math.cos(a) * 3300);
        for (const v of g.attributes.position.array) rp.push(v);
        for (const v of g.attributes.uv.array) ruv.push(v);
        for (const v of g.index.array) rix.push(b0 + v);
        g.dispose();
      }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2)); rg.setIndex(rix);
      const rmesh = new THREE.Mesh(rg, rm); rmesh.frustumCulled = false; rmesh.renderOrder = 1; far.add(rmesh);
    }
  }
  await ctx.yield();

  // ---------- the nest bar: mud cones, most with a sitting bird ----------
  const instGeo = (base, n, iN, iM) => {
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
    for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
    g.setAttribute('iN', new THREE.InstancedBufferAttribute(iN.subarray(0, n * 4), 4)); g.setAttribute('iM', new THREE.InstancedBufferAttribute(iM.subarray(0, n * 4), 4));
    g.instanceCount = n; return g;
  };
  const litMat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial(Object.assign({ vertexShader: vs, fragmentShader: fs, fog: true, uniforms: { ...fx.fogUniforms(), ...LIT, ...extra } }, o));
  {
    const P = [], N = [], K = [], A = [], I = [];
    const v = (x, y, z, nx, ny, nz, c, part, sway) => { P.push(x, y, z); const l = Math.hypot(nx, ny, nz) || 1; N.push(nx / l, ny / l, nz / l); K.push(c.r, c.g, c.b); A.push(part, sway); return P.length / 3 - 1; };
    const mud = C('#8d8479'), mudTop = C('#b9b2a6'), dark = C('#3d3733'), pk = cPink.clone().multiplyScalar(0.82), pale = pk.clone().lerp(cSalt, 0.3), rose = pk.clone().lerp(C(PALETTE[3]), 0.45), blk = C('#141214');
    const SIDES = 5, ring = [];
    for (let i = 0; i < SIDES; i++) { const a = i / SIDES * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); ring.push([v(ca * 0.36, 0, sa * 0.36, ca, 0.5, sa, mud, 0, 0), v(ca * 0.16, 0.3, sa * 0.16, ca, 0.9, sa, mudTop, 0, 0)]); }
    const cap = v(0, 0.25, 0, 0, 1, 0, dark, 0, 0);
    for (let i = 0; i < SIDES; i++) { const a = ring[i], b = ring[(i + 1) % SIDES]; I.push(a[0], a[1], b[1], a[0], b[1], b[0], cap, b[1], a[1]); }
    // sitting bird: body, folded neck, head and bill
    const bf = v(0, 0.42, 0.2, 0, 0.3, 1, pale, 1, 0), bb = v(0, 0.45, -0.27, 0, 0.3, -1, blk, 1, 0), bt = v(0, 0.56, -0.03, 0, 1, 0, pk, 1, 0), bo = v(0, 0.3, -0.02, 0, -1, 0, rose, 1, 0);
    const bl = v(0.12, 0.42, -0.03, 1, 0.2, 0, rose, 1, 0), br = v(-0.12, 0.42, -0.03, -1, 0.2, 0, rose, 1, 0);
    I.push(bf, bl, bt, bf, bt, br, bb, bt, bl, bb, br, bt, bf, bo, bl, bf, br, bo, bb, bl, bo, bb, bo, br);
    const nk = [[0.45, 0.17, 0.035], [0.6, 0.23, 0.028], [0.74, 0.2, 0.024], [0.82, 0.25, 0.03]];
    let prev = null;
    for (let i = 0; i < nk.length; i++) {
      const [y, z, w] = nk[i], sw = i / (nk.length - 1);
      const a = v(w, y, z, 0.7, 0.4, 0.6, pale, 2, sw), b = v(-w, y, z, -0.7, 0.4, 0.6, pale, 2, sw);
      if (prev) I.push(prev[0], a, b, prev[0], b, prev[1]); prev = [a, b];
    }
    const h0 = v(0, 0.86, 0.24, 0, 1, 0.3, pale, 2, 1), h1 = v(0, 0.8, 0.36, 0, 0.5, 1, rose, 2, 1), h2 = v(0, 0.72, 0.38, 0, 0, 1, blk, 2, 1);
    I.push(prev[0], h0, h1, prev[1], h1, h0, prev[0], h1, h2, prev[1], h2, h1);
    const base = new THREE.BufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    base.setAttribute('color', new THREE.Float32BufferAttribute(K, 3)); base.setAttribute('aPart', new THREE.Float32BufferAttribute(A, 2)); base.setIndex(I);
    // the far ones (most of the colony is a hundred metres off and more): two crossed mud triangles with two crossed
    // triangles of a pink bird's hump on them (four triangles), and beyond those one of each, set square to each other
    const farNest = (pairs) => {
      const P2 = [], N2 = [], K2 = [], A2n = [], I2 = [];
      const v2 = (x, y, z, nx, nz, c, part) => { P2.push(x, y, z); const l = Math.hypot(nx, 0.7, nz); N2.push(nx / l, 0.7 / l, nz / l); K2.push(c.r, c.g, c.b); A2n.push(part, 0); return P2.length / 3 - 1; };
      for (let i = 0; i < 2; i++) {
        const cx = i === 0 ? 1 : 0, cz = 1 - cx;
        if (pairs || i === 0) I2.push(v2(-0.4 * cx, 0, -0.4 * cz, cz, cx, mud, 0), v2(0, 0.36, 0, cz, cx, mudTop, 0), v2(0.4 * cx, 0, 0.4 * cz, cz, cx, mud, 0));
        if (pairs || i === 1) I2.push(v2(-0.22 * cx, 0.3, -0.27 * cz, cz, cx, rose, 1), v2(0, 0.62, 0.02, cz, cx, i === 0 ? pale : pk, 1), v2(0.22 * cx, 0.3, 0.27 * cz, cz, cx, rose, 1));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(K2, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(A2n, 2)); g.setIndex(I2);
      return g;
    };
    const baseFar = farNest(true), baseFar2 = farNest(false);
    // About 2,000 cones along the bar (the brief's number), most with a sitting bird: the 100 nearest the route are the
    // full nest, the next 500 the four-triangle one, the rest the two-triangle one. Laid by path distance and metres left
    // of the route.
    const want = Math.round(2000 * (0.6 + 0.4 * detail)), nFull = Math.round(100 * (0.75 + 0.25 * detail)), cand = [], used = new Set();
    const sit = season === 'october' ? 0.8 : season === 'dry' ? 0.6 : 0.22, nr = rng.fork('nests');
    await ctx.yield();
    for (let tries = want * 9; cand.length < want && tries > 0; tries--) {
      if ((tries & 63) === 0) await ctx.yield();
      const st = nr.range(14, bandL + 110), lat = -(46.5 + 86 * Math.pow(nr(), 1.5));
      at(P0 + st, lat, _q);
      if (0.5 + 0.5 * noise.fbm2(_q.x * 0.035, _q.z * 0.035, 2) < 0.26 + 0.3 * nr()) continue;
      const key = Math.round(_q.x / 1.3) + ':' + Math.round(_q.z / 1.3);
      if (used.has(key) || !isSalt(_q.x, _q.z, 0.1)) continue; used.add(key);
      cand.push([-lat, _q.x, _q.z, nr.range(0, 6.283), nr.range(0.85, 1.2), nr(), nr() < sit ? 1 : 0]);
    }
    cand.sort((p, q) => p[0] - q[0]);
    await ctx.yield();
    const nestMat = litMat(NEST_VERT, FLAT_FRAG, {}, { side: THREE.DoubleSide });
    const nA = Math.min(nFull, cand.length), nB = Math.min(nFull + 500, cand.length);
    for (const [from, to, geo] of [[0, nA, base], [nA, nB, baseFar], [nB, cand.length, baseFar2]]) {
      const n = to - from, iN = new Float32Array(Math.max(n, 1) * 4), iM = new Float32Array(Math.max(n, 1) * 4);
      for (let i = 0; i < n; i++) { const c = cand[from + i]; iN[i * 4] = c[1]; iN[i * 4 + 1] = c[2]; iN[i * 4 + 2] = c[3]; iN[i * 4 + 3] = c[4] * (geo === base ? 1 : 1.15); iM[i * 4] = c[5]; iM[i * 4 + 1] = c[6]; }
      const nests = new THREE.Mesh(instGeo(geo, n, iN, iM), nestMat);
      nests.frustumCulled = false; nests.matrixAutoUpdate = false; scene.add(nests);
      await ctx.yield();
    }
  }
  await ctx.yield();

  // ---------- spike grass and sedge round two seeps ----------
  let seepB = null;
  {
    const P = [], B = [], I = [], gr = rng.fork('grass');
    for (let b = 0; b < 7; b++) {
      const a = b / 7 * Math.PI * 2 + gr.range(-0.3, 0.3), lean = gr.range(0.05, 0.28), hgt = gr.range(0.32, 0.5), ca = Math.cos(a), sa = Math.sin(a), s0 = P.length / 3;
      for (let i = 0; i < 3; i++) {
        const h = i / 2, r = 0.03 + lean * h * h, w = 0.02 * (1 - h * 0.85), y = hgt * h;
        P.push(ca * r - sa * w, y, sa * r + ca * w, ca * r + sa * w, y, sa * r - ca * w); B.push(h, b / 7, h, b / 7);
      }
      for (let i = 0; i < 2; i++) { const o = s0 + i * 2; I.push(o, o + 1, o + 3, o, o + 3, o + 2); }
    }
    const base = new THREE.BufferGeometry();
    base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setAttribute('aBlade', new THREE.Float32BufferAttribute(B, 2)); base.setIndex(I);
    const want = Math.round(220 * (0.6 + 0.4 * detail)), iN = new Float32Array(want * 4), iM = new Float32Array(want * 4);
    seepB = at(P0 + rng.range(90, 150), -rng.range(52, 60));
    let n = 0;
    for (let tries = want * 10; n < want && tries > 0; tries--) {
      if ((tries & 127) === 0) await ctx.yield();
      const c = n < want * 0.62 ? seepA : seepB, r = Math.abs(gr.gauss()) * 6.5, a = gr.range(0, 6.283), x = c.x + Math.cos(a) * r * 1.5, z = c.z + Math.sin(a) * r;
      if (!isSalt(x, z, 0.02) || path.nearestXZ(x, z).dist < 8.5) continue;
      iN[n * 4] = x; iN[n * 4 + 1] = z; iN[n * 4 + 2] = gr.range(0, 6.283); iN[n * 4 + 3] = gr.range(0.8, 1.5);
      iM[n * 4] = gr(); iM[n * 4 + 1] = clamp(1 - r / 9 + gr.range(-0.3, 0.3), 0, 1); n++;
    }
    const tufts = new THREE.Mesh(instGeo(base, n, iN, iM), litMat(TUFT_VERT, FLAT_FRAG, {}, { side: THREE.DoubleSide }));
    tufts.frustumCulled = false; tufts.matrixAutoUpdate = false; scene.add(tufts);
    await ctx.yield();
    // steam off the two seeps: leaning plumes a few metres tall, the only upright things on the flats
    const ventCol = C('#f1eee8').multiply(fillCol.clone().add(sunCol.clone().multiplyScalar(0.55))).multiplyScalar(0.3183 * 0.9);
    const ventMat = new THREE.ShaderMaterial({ vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false,
      uniforms: { uCol: { value: ventCol }, uTime: LIT.uTime, uAmt: { value: lookId === 'moon' ? 0.3 : 0.46 } } });
    for (const [c, dx, dz, w, h] of [[seepA, 0, 0, 8, 11.5], [seepA, 4.5, -5, 6, 8], [seepA, -5.5, 3.5, 9.5, 14], [seepB, 0, 0, 9, 13], [seepB, -6, -4, 7, 9.5]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), ventMat);
      m.position.set(c.x + dx + (0.5 - 0.12) * w, h * 0.4, c.z + dz); m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
    }
  }
  await ctx.yield();

  // ---------- far flocks on the wing: four ribbons trailing over the lake ----------
  let ribbons = null;
  {
    const rr = xr.fork('ribbons'), RIB = [
      // centre x, z, heading (deg, 0 = -Z, 90 = +X), length, height, sway, lift, spread, birds
      [X(90) + rr.range(-80, 80), -2050, rr.range(78, 100), 1500, rr.range(26, 40), 60, 14, 9, 430],
      [X(90) + rr.range(380, 470), -720, rr.range(150, 172), 900, rr.range(36, 52), 50, 18, 8, 350],
      [X(90) - rr.range(360, 440), -640, rr.range(8, 30), 820, rr.range(28, 40), 44, 14, 8, 310],
      [X(150) + rr.range(-60, 60), -1560, rr.range(48, 70), 1100, rr.range(78, 100), 80, 24, 10, 310],
    ];
    let total = 0; for (const r of RIB) total += Math.round(r[8] * (0.6 + 0.4 * detail));
    const iA = new Float32Array(total * 4), iB = new Float32Array(total * 4), iC = new Float32Array(total * 4);
    let n = 0;
    for (const r of RIB) {
      const cnt2 = Math.round(r[8] * (0.6 + 0.4 * detail)), ph = rr.range(0, 6.28), sp = rr.range(13, 16) * (rr() < 0.5 ? -1 : 1);
      for (let i = 0; i < cnt2; i++, n++) {
        // strung along the line in loose knots, thinning toward both ends
        const knot = Math.floor(rr() * 9) / 9 + 0.03 * Math.sin(n), along = ((knot + rr.gauss() * 0.05 + rr() * rr() * 0.4) % 1 + 1) % 1;
        iA[n * 4] = r[0]; iA[n * 4 + 1] = r[1]; iA[n * 4 + 2] = r[2] * Math.PI / 180; iA[n * 4 + 3] = r[3];
        iB[n * 4] = along * r[3]; iB[n * 4 + 1] = rr.gauss() * r[7]; iB[n * 4 + 2] = r[4] + rr.gauss() * r[7] * (0.5 + 1.1 * rr() * rr()); iB[n * 4 + 3] = sp * rr.range(0.92, 1.08);
        iC[n * 4] = ph; iC[n * 4 + 1] = r[5]; iC[n * 4 + 2] = r[6]; iC[n * 4 + 3] = rr();
      }
      await ctx.yield();
    }
    const q = new THREE.BufferGeometry();
    q.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); q.setIndex([0, 1, 2, 0, 2, 3]);
    const g = new THREE.InstancedBufferGeometry(); g.index = q.index; g.setAttribute('position', q.attributes.position);
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
    g.instanceCount = total;
    ribbons = new THREE.Mesh(g, litMat(RIBBON_VERT, RIBBON_FRAG, { uCam: lakeU.uCam, uPix: { value: 0.0027 }, uPink: { value: C(HERO_PALETTE[2]).multiplyScalar(0.95) }, uDark: { value: C('#3a1420') } }, { side: THREE.DoubleSide }));
    ribbons.frustumCulled = false; ribbons.matrixAutoUpdate = false; ribbons.name = 'ribbons'; scene.add(ribbons);
  }

  await ctx.yield();

  // ---------- the wave's body: risers between the liftoff line and the eye, each with its reflection ----------
  const WAVE_B = 46;
  const waveU = {
    ...LIT, uCam: lakeU.uCam, uPix: { value: 0.0027 }, uRipple: lakeU.uRipple, uFrontP: lakeU.uFrontP, uWall: { value: new THREE.Vector4(0, 0, 0, WAVE_B) }, uWall2: { value: new THREE.Vector2(0, 1) },
    uPink: { value: C(HERO_PALETTE[2]).multiplyScalar(0.84) }, uScarlet: { value: C(PALETTE[3]).multiplyScalar(0.88) }, uDeep: lakeU.uDeep,
    uField: lakeU.uField, uFieldRect: lakeU.uFieldRect, uSaltBias: lakeU.uSaltBias, uCause: lakeU.uCause, uRoute: lakeU.uRoute, uGrp: lakeU.uGrp,
    uStream: { value: new THREE.Vector4(0, 3.1, 0, 1) },
  };
  {
    const wr = yrWave, n = Math.round(3600 * (0.6 + 0.4 * detail)), iW = new Float32Array(n * 4);
    // two thirds of them fly in some forty loose parties (so the wall has streams and gaps, never an even stipple), the rest alone and low
    const cl = []; for (let k = 0; k < 44; k++) cl.push([(wr() + wr() - 1) * 50, wr() * WAVE_B, 1.5 + 21 * Math.pow(wr(), 2.4), 3 + 4 * wr()]);
    for (let i = 0; i < n; i++) {
      let lat, b0, hi;
      if (i < n * 0.64) { const c = cl[i % 44]; lat = c[0] + wr.gauss() * c[3]; b0 = ((c[1] + wr.gauss() * 5) % WAVE_B + WAVE_B) % WAVE_B; hi = c[2] * (0.45 + 0.8 * wr()); }
      else { lat = (wr() + wr() - 1) * 54; b0 = wr() * WAVE_B; hi = 1.2 + 20 * Math.pow(wr(), 3.5); }
      if (Math.abs(lat) < 1.5) lat = lat < 0 ? -1.5 : 1.5;
      iW[i * 4] = b0; iW[i * 4 + 1] = lat; iW[i * 4 + 2] = hi; iW[i * 4 + 3] = wr();
      if ((i & 1023) === 1023) await ctx.yield();
    }
    const q = new THREE.BufferGeometry();
    q.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); q.setIndex([0, 1, 2, 0, 2, 3]);
    const g = new THREE.InstancedBufferGeometry(); g.index = q.index; g.setAttribute('position', q.attributes.position);
    g.setAttribute('iW', new THREE.InstancedBufferAttribute(iW, 4)); g.instanceCount = n;
    const body = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: WAVE_VERT, fragmentShader: WAVE_FRAG, fog: true, side: THREE.DoubleSide, uniforms: { ...fx.fogUniforms(), ...waveU } }));
    const mirror = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: WAVE_VERT, fragmentShader: WAVE_FRAG, fog: true, side: THREE.DoubleSide, defines: { MIRROR: 1 }, uniforms: { ...fx.fogUniforms(), ...waveU },
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
    body.frustumCulled = mirror.frustumCulled = false; body.matrixAutoUpdate = mirror.matrixAutoUpdate = false; mirror.renderOrder = 1;
    body.name = 'wave-body'; mirror.name = 'wave-mirror'; scene.add(body, mirror);
  }
  await ctx.yield();

  // ---------- the pattering line's spray: crowns standing along the liftoff line, under the wall (round seven) ----------
  const crownU = { ...fx.fogUniforms(), uCam: lakeU.uCam, uPix: waveU.uPix, uFrontP: lakeU.uFrontP, uWall: waveU.uWall, uCrown: { value: new THREE.Vector4(0, 48, 0, 0) },
    uCol: { value: cSalt.clone().multiply(fillCol.clone().multiplyScalar(0.9).add(sunCol.clone().multiplyScalar(0.75))).multiplyScalar(0.3183 * 1.2) },
    uField: lakeU.uField, uFieldRect: lakeU.uFieldRect, uSaltBias: lakeU.uSaltBias, uCause: lakeU.uCause, uRoute: lakeU.uRoute, uGrp: lakeU.uGrp };
  {
    const kr = ctx.core.makeRng(((ctx.seed >>> 0) ^ 0x51c0a37) >>> 0), n = 640, iK = new Float32Array(n * 4);
    // a BROKEN line: two thirds of the crowns in fourteen knots along it (where a party runs together), the rest strewn; thickest ahead of the nose
    const knots = []; for (let k = 0; k < 14; k++) knots.push([(kr() + kr() - 1) * 27, kr() * 48, 1.2 + 2.6 * kr()]);
    for (let i = 0; i < n; i++) {
      let lat, ph;
      if (i < n * 0.66) { const c = knots[i % 14]; lat = c[0] + kr.gauss() * c[2]; ph = ((c[1] + kr.gauss() * 6) % 48 + 48) % 48; }
      else { lat = (kr() + kr() - 1) * 34; ph = kr() * 48; }
      iK[i * 4] = ph; iK[i * 4 + 1] = lat; iK[i * 4 + 2] = kr(); iK[i * 4 + 3] = 0.9 + 0.8 * kr();
    }
    const q = new THREE.BufferGeometry();
    q.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); q.setIndex([0, 1, 2, 0, 2, 3]);
    const g = new THREE.InstancedBufferGeometry(); g.index = q.index; g.setAttribute('position', q.attributes.position);
    g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 4)); g.instanceCount = n;
    const crowns = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, uniforms: crownU }));
    crowns.frustumCulled = false; crowns.matrixAutoUpdate = false; crowns.renderOrder = 2; crowns.name = 'wave-crowns'; scene.add(crowns);
  }
  await ctx.yield();

  // ---------- December: the creche, grey chicks herded over the flats ----------
  let chicks = null;
  if (season === 'december') {
    const cr = rng.fork('creche'), want = Math.round(1700 * (0.6 + 0.4 * detail)) + 9, iN = new Float32Array(want * 4), iM = new Float32Array(want * 4);
    path.tangentAtDist(240, _t);
    const dx = _t.x * 0.8 + _t.z * 0.6, dz = _t.z * 0.8 - _t.x * 0.6;   // herd heading: along the route, veering away from it
    for (let i = 0; i < want; i++) {
      const adult = i >= want - 9, al = (adult ? cr.range(-1, 1) : cr.gauss() * 0.45) * 30, ac = (adult ? (cr() < 0.5 ? -1 : 1) * cr.range(11, 15) : cr.gauss() * 6.5) * (1 - 0.4 * Math.abs(al) / 30);
      iN[i * 4] = creche.x + dx * al - dz * ac; iN[i * 4 + 1] = creche.z + dz * al + dx * ac; iN[i * 4 + 2] = cr(); iN[i * 4 + 3] = adult ? cr.range(1.15, 1.3) : cr.range(0.5, 0.74);
      iM[i * 4] = cr(); iM[i * 4 + 1] = adult ? 1 : 0;
    }
    const q = new THREE.BufferGeometry();
    q.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); q.setIndex([0, 1, 2, 0, 2, 3]);
    chicks = new THREE.Mesh(instGeo(q, want, iN, iM), litMat(CHICK_VERT, CHICK_FRAG, { uCam: lakeU.uCam, uDrift: { value: new THREE.Vector2(dx * 0.42, dz * 0.42) }, uPix: { value: 0.0027 }, uPink: { value: cPink.clone().multiplyScalar(0.82) } }, { side: THREE.DoubleSide }));
    chicks.frustumCulled = false; chicks.matrixAutoUpdate = false; scene.add(chicks);
  }
  await ctx.yield();

  // ---------- the rest of the cast ----------
  const FL = { sunDir: SUN, sunColor: C(look.sun), sunIntensity: look.sunI, sky: C(look.fill), skyIntensity: look.fillI, ground: bounceCol.clone(), groundIntensity: 1 };
  const fauna = F.makeFauna(scene, { light: FL });
  await ctx.yield();
  const skeinSide = rng() < 0.75 ? -1 : 1;      // the far skein's side (the pelicans come from the side opposite it, and the nine close ones fly on the side opposite the pelicans': skSide)
  fauna.add(F.makeFlock({ rng: rng.fork('skein'), species: 'flamingos', count: rng.int(18, 26), size: 1.25,
    cross: { path, u: 0.022, lead: 36, angle: 80, side: skeinSide, height: 5.0 + 0.35 + 1.1 + (skeinSide > 0 ? 0.45 : 0), span: 380, duration: DUR } }), { always: true });      // the height is a sum: 5.0 (the design's clear air between a flying track and our line; it is over the kit's guard for this bird, 3.99 m, and over the 2.0 m floor with the bird's reach, 1.68 m) + 0.35 (the kit's wander up and down) + 1.1 (the lowest the kit deals a member under its route: 0.8 + 0.3) + a last term that only the side with skeinSide 1 has: there the lanes lie over our line behind the crossing's station (d 62.4, where the height is laid), as far back as d 16.5, where our line stands 0.41 m over its own height at that station: 0.45, rounded up; with skeinSide -1 the lanes lie over our line from d 62.75 on, where our line is lower than at the station, and the term is 0
  await ctx.yield();
  // great white pelicans, 7 to 15 by seed, low over the lead in line astern, as the site has them (its lines from pelN
  // to the end of placePelicans, unchanged): they come in from the side opposite the far skein's (pelSide, dealt per
  // seed), cross the nose on a slant that runs with us and are overtaken along the other wingtip. (The design names
  // them by a time, "at 4 s the pelicans cross 28 m ahead"; the 0.16 is the site's key, kept as it is.)
  const pelN = Math.round(lerp(7, 15, clamp((dens - 0.7) / 0.6 * 0.6 + rng() * 0.4, 0, 1))), pelSide = -skeinSide, pelSeed = rng.int(1, 1e9);
  const pelicans = makeBig('pelican', pelN);
  await ctx.yield();
  // Their track is an S: the slant across our line steepens up to the crossing (they bank toward the side they are making
  // for) and eases off after it (they bank back), so we see them from the quarter: body, drawn-back neck and long bill,
  // not wings end-on. The site's key and its numbers, unchanged: when the eye is PELU of the way down the route the last
  // bird of the line is PEL_NEAR m ahead of it and the leader about 40 m, the middle of the line crossing our line 1.0 m
  // to the pelicans' own side of it. Nothing else is laid for the track or timed to it (no pads).
  const PELU = 0.16, PEL_NEAR = 16, PEL_V = 17, PEL_GAP = clamp(28 / Math.max(pelN - 1, 1), 2.2, 3.6), PEL_LH = (pelN - 1) / 2 * PEL_GAP, PEL_PK = 42 * Math.PI / 180, PEL_W = 30;
  const pelM = new THREE.Vector3(), pelT = new THREE.Vector3(), pelR = new THREE.Vector3(), PEL_TAB = [];
  const pelSlant = (sx) => PEL_PK / (1 + (sx / PEL_W) * (sx / PEL_W));
  {
    // the track tabulated every metre from 90 m short of the crossing to 90 m past it: metres forward, metres toward pelSide
    const fw = [], bk = []; let f = 0, r = 0;
    for (let i = 0; i <= 90; i++) { fw.push([f, r]); const a = pelSlant(i + 0.5); f += Math.cos(a); r += Math.sin(a); }
    f = 0; r = 0;
    for (let i = 0; i <= 90; i++) { bk.push([f, r]); const a = pelSlant(-(i + 0.5)); f -= Math.cos(a); r -= Math.sin(a); }
    for (let i = 90; i >= 1; i--) PEL_TAB.push(bk[i]);
    for (let i = 0; i <= 90; i++) PEL_TAB.push(fw[i]);
    const dM = PELU * LEN + PEL_NEAR - PEL_TAB[Math.round(90 - PEL_LH)][0];      // the middle of the line crosses the axis here
    path.posAtDist(dM, pelM); path.tangentAtDist(dM, _t); _t.y = 0; _t.normalize(); pelT.copy(_t);
    pelR.set(-_t.z, 0, _t.x).multiplyScalar(pelSide);
    pelM.addScaledVector(pelR, 1.0);
  }
  const pelPh = pelSeed % 628 / 100;
  let pelS = 0;
  const pelAt = (i, time, u, out) => {
    pelS = clamp(PEL_V * (u - PELU) * DUR - (i - (pelN - 1) / 2) * PEL_GAP + 0.5 * Math.sin(time * 0.31 + i * 1.9), -89.9, 89.9);
    const k = Math.floor(pelS + 90), fr = pelS + 90 - k, a = PEL_TAB[k], b = PEL_TAB[k + 1];
    out.copy(pelM).addScaledVector(pelT, lerp(a[0], b[0], fr)).addScaledVector(pelR, lerp(a[1], b[1], fr) + 0.45 * Math.sin(time * 0.43 + i * 2.3 + pelPh));
    out.y = 2.3 + 0.3 * Math.sin(pelS * 0.05 + pelPh) + 0.18 * Math.sin(time * 0.6 + i * 1.3);
    return out;
  };
  const placePelicans = (time, u) => {
    const show = smoothstep(0.002, 0.03, u) * (1 - smoothstep(0.265, 0.285, u));
    for (let i = 0; i < pelN; i++) {
      pelAt(i, time, u, _q);
      const x = pelS / PEL_W, sl = pelSlant(pelS), dsl = -PEL_PK * 2 * x / PEL_W / ((1 + x * x) * (1 + x * x));      // slant here and how fast it is changing (rad per m)
      const dx = pelT.x * Math.cos(sl) + pelR.x * Math.sin(sl), dz = pelT.z * Math.cos(sl) + pelR.z * Math.sin(sl);
      // glide, then a few slow beats: the beat runs down the line from the leader
      const env = smoothstep(0.1, 0.7, Math.sin(time * 0.95 - i * 0.62 + pelPh)), ph = time * 7.6 - i * 0.5;
      pelicans.set(i, _q.x, show > 0.01 ? _q.y + 0.07 * env * Math.sin(ph - 1.4) : -60, _q.z, ph, Math.atan2(dx, dz) + 0.03 * Math.sin(time * 0.5 + i), 0.05,
        clamp(dsl * 30, -0.6, 0.6) * pelSide + 0.05 * Math.sin(time * 0.43 + i * 2.3 + pelPh), show, 0.2 + 0.32 * env, 0);
    }
    pelicans.commit();
  };
  // the fish eagle: circling high, or (rare) stooping across the nose at u 0.62 while the sheet unzips along its line
  const EAGLE = { species: 'eagles', body: '#5c3420', belly: '#6c3c22', wingC: '#2c2523', trail: '#1e1a19', tip: '#141212', head: '#f4efe6', tailC: '#f4efe6', beak: '#f0c030' };
  const eagleAt = at(P0 + rng.range(180, 330), -rng.range(70, 130)), eagleY = rng.range(42, 60), eagleRng = rng.fork('eagle');
  if (!rare) fauna.add(F.makeFlock({ ...EAGLE, rng: eagleRng, count: 1, size: 2.1, center: [eagleAt.x, eagleY, eagleAt.z], radius: 60, soarRadius: 34 }), { always: true });
  await ctx.yield();
  let placeEagle = null;
  if (rare) {
    const eagle = makeBig('eagle', 1), EU = 0.62;
    // where the eagle is, as seen from the cockpit: seconds from the crossing -> metres ahead, to the right, above the eye
    const KT = [-7, -4, -2.2, -1.5, 0, 1.5, 2.4, 3.6], KA = [150, 85, 46, 32, 11.5, 8.6, 7.2, 3], KR = [-95, -58, -31, -18.5, 0, 8.6, 15, 26], KH = [52, 36, 19, 12.5, -2.6, -3.4, -3.3, -2.4];
    const kf = (t, V) => {
      if (t <= KT[0]) return V[0]; if (t >= KT[7]) return V[7];
      let k = 0; while (t > KT[k + 1]) k++;
      const h = KT[k + 1] - KT[k], x = (t - KT[k]) / h;
      const m0 = k > 0 ? (V[k + 1] - V[k - 1]) / (KT[k + 1] - KT[k - 1]) : (V[1] - V[0]) / h, m1 = k < 6 ? (V[k + 2] - V[k]) / (KT[k + 2] - KT[k]) : (V[7] - V[6]) / h;
      const x2 = x * x, x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * V[k] + (x3 - 2 * x2 + x) * h * m0 + (-2 * x3 + 3 * x2) * V[k + 1] + (x3 - x2) * h * m1;
    };
    const eagleAtU = (uu, out) => {
      const tau = (uu - EU) * DUR, d = uu * LEN, a = kf(tau, KA);
      path.posAtDist(d, _p); const eye = _p.y;
      path.posAtDist(d + a, out); path.tangentAtDist(d + a, _t); const l = Math.hypot(_t.x, _t.z) || 1, r = kf(tau, KR);
      out.x += -_t.z / l * r; out.z += _t.x / l * r; out.y = Math.max(eye + kf(tau, KH), 1.6);
      return out;
    };
    const e0 = new THREE.Vector3(), e1 = new THREE.Vector3();
    const eF = new THREE.Vector3();
    placeEagle = (time, u) => {
      const tau = (u - EU) * DUR, show = smoothstep(-7, -6, tau) * (1 - smoothstep(3, 3.6, tau));
      eagleAtU(u - 0.002, e0); eagleAtU(u + 0.002, e1);
      eF.subVectors(e1, e0); if (eF.y < 0) eF.y *= 2.2; eF.normalize();
      eagleAtU(u, e0);
      const stoop = smoothstep(-4.4, -2.6, tau) * (1 - smoothstep(0.1, 1.5, tau)), flare = smoothstep(0.9, 2, tau);
      // Across the nose it wings over, back to the cockpit: the body swings off the line of sight and rolls until the eye
      // looks down onto white head, chestnut shoulders, black flight feathers and white tail.
      const bank = smoothstep(-2.6, -1.0, tau) * (1 - smoothstep(0.1, 1.3, tau)), dive = smoothstep(-2.6, -1.0, tau) * (1 - smoothstep(0.05, 1.0, tau));
      { // the dive it shows us: down and to the right across the path, the way it moves over the picture
        const l = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / l, tz = _t.z / l, k = 0.8 * dive;
        eF.multiplyScalar(1 - k); eF.x += k * (0.35 * tx - 0.55 * tz); eF.y += k * -0.76; eF.z += k * (0.35 * tz + 0.55 * tx);
      }
      eF.y = clamp(eF.y, -0.8, 0.3); eF.normalize();
      // rolled until its back faces the cockpit (the roll that does it holds near 1.85 rad all the way down the dive)
      const yaw = Math.atan2(eF.x, eF.z), pitch = Math.asin(clamp(eF.y, -1, 1)), roll = 1.85 * bank;
      eagle.set(0, e0.x, show > 0.01 ? e0.y : -60, e0.z, time * 13.5, yaw, pitch, roll + 0.06 * Math.sin(time * 0.9), 1.4 * show, 0.07 + 0.45 * flare, 0.2 * stoop * (1 - bank));
      eagle.commit();
    };
    await ctx.yield();
    const sZ = 0.6 * LEN - P0;
    hero.uniforms.uLane.value.set(sZ, sZ + 70, 7, 14);        // the sheet unzips along the eagle's line
  }
  // escorts: birds that hang beside, over and under the cockpit while we are inside the flock. Each closes from the sheet
  // ahead, keeps pace for about three seconds a few metres off the lens, then drops astern. Every one is placed from the
  // eye's path distance: metres ahead of it along the route, metres right of the route, metres above the eye (uc is the
  // share of the route at which it hangs nearest). The birds beside the cockpit are lesser flamingos; a few greater
  // ones (half as big again, far paler) fly further off, ten metres and more from the lens.
  //   general (23): overhead and beside, from the first tenth past the wave to the lane; four close on the left
  //   the low string (9): a slanting line low over the water as the flock shuts over the wings (0.62 of the route;
  //     0.701 when the eagle flies), 3.7 to 15.5 m ahead of the eye and 0.9 to 1.6 m below it, each over its own
  //     reflection. A bird lower than the eye keeps outside the wingtips (escAt, KEEP_SIDE), so none flies over the
  //     route's line: four fly left of it and five right, each on the side of its own offset, 5.2 to 6.7 m from the
  //     line (the two highest, as they bob up toward the eye's height, from 4 m)
  //   the low party (7): right of the route's line as the lane opens (0.79 of the route, the site's key), 5.5 to
  //     7.2 m from it (outside the right wingtip, by the same rule), at the 1.3 m a bird flies over the water,
  //     1.6 to 2 m below the eye
  //   In these two hand-set parties a greater flamingo is one of the party's furthest birds and never nearer than
  //   10 m to the eye at any moment of its hang (the designers: never among the nearest birds beside the cockpit).
  //   the lane (8 high, 6 low): the high ones 1.7 to 3.6 m either side of the route's line, above the eye: either
  //     side of the ring and over its rim; the six low ones alternately left and right of the line, 5.5 to 6.3 m
  //     from it (outside the wingtips, by the same rule), 1.85 to 2.25 m below the eye, over the lane's mirror
  const esc = [];
  {
    const er = xr.fork('escorts');
    let nIn = 0, nClose = 0; const flip = er() < 0.5 ? -1 : 1;
    for (let i = 0; i < N_GEN + 8; i++) {
      const kind = i % 9;
      const inner = kind === 0 || kind === 2 || kind === 4 || kind === 6 || kind === 7, side = kind === 3 || kind === 8, big = kind === 8;      // a greater flamingo only out on the flank, beyond the wingtip
      const sg = inner ? ((nIn++ * 3 % 5) < 2 ? -1 : 1) * flip : er() < 0.5 ? -1 : 1;      // inner birds: both sides of the nose, in no fixed order
      let lat = inner ? er.range(1.0, 2.7) : side ? er.range(6.2, 8.5) : er.range(4.4, 6.0);
      let up = inner ? er.range(0.6, 2.2) : side ? er.range(-1.6, 0.8) : er.range(0, 2);
      // the last eight stay with us down the lane to u 0.93: above the ring's rim and either side of it
      const last = i >= N_GEN, uc = (last ? 0.868 + (i - N_GEN + 0.5) / 8 * 0.066 : uEsc0 + (i + 0.5) / N_GEN * (0.868 - uEsc0)) + er.range(-0.006, 0.006);
      if (last) { lat = er.range(1.7, 3.6); up = er.range(1.8, 3.2); }
      const e = { uc, lat: (last ? (i % 2 ? 1 : -1) : sg) * lat, up: up + (big ? 0.3 : 0), size: big ? er.range(1.3, 1.4) : er.range(0.95, 1.05), ph: er.range(0, 6.28) };
      if (last && (i - N_GEN === 2 || i - N_GEN === 5)) { e.lat = (i % 2 ? 1 : -1) * er.range(0.8, 1.4); e.up = er.range(2.6, 3.2); }     // two over the top of the ring
      // four hang close on the left where the eye is 0.64 to 0.72 of the way down the route: 1.5 to 3.2 m left of the
      // route's line, 0.5 to 1.2 m above the eye, 4.6 or 5.1 m ahead of it at the middle of the hang (above the eye, so
      // escAt asks no keep-off of them); the cone stands right of the heading there
      if (!last && inner && uc > 0.64 && uc < 0.725 && nClose < 4) { e.a0 = 4.6 + 0.5 * (nClose % 2); e.lat = -(1.5 + 0.55 * nClose); e.up = [0.5, 1.0, 0.7, 1.2][nClose]; nClose++; }
      esc.push(e);
    }
    const uA = rare ? 0.701 : 0.62;      // 0.62: the design's beat (the flock shuts over the wings); 0.701: the site's key for the rare visit, as the site has it
    // [metres ahead while it hangs, its own offset in metres right of the route's line, metres above the eye]: nearest
    // first. Every one is lower than the eye, so escAt joins its offset to KEEP_SIDE and it flies outside the
    // wingtip on its own side (four left of the line, five right): 5.2 m and more from the line for a bird a metre
    // or more below the eye, a little less for the two highest when they bob up
    const LOWF = [[3.7, -2.3, -1.5], [4.5, 0.5, -1.62], [5.3, 2.7, -1.45], [6.6, -3.7, -1.3], [7.6, 1.3, -1.5], [9.2, -1.6, -1.25], [10.8, 3.8, -1.2], [12.8, -0.3, -1.05], [15.5, 2.2, -0.9]];
    // which of a hand-set party are greater flamingos, by distance: its `n` furthest birds, each GREATER_OFF (10 m) and
    // more from the eye at the nearest moment of its hang (ahead by a0 less what it drifts back in the hang, aside by
    // its offset with the route's keep-off for low fliers, below by its drop)
    const GREATER_OFF = 10;
    const hangDist = (e) => Math.hypot(Math.max(Math.abs(e.a0) - e.slow * e.hang, 0), Math.hypot(e.lat, KEEP_SIDE * smoothstep(0, KEEP_DROP, -e.up)), e.up);
    const greater = (list, n) => { const far = list.filter((e) => hangDist(e) >= GREATER_OFF).sort((p, q) => hangDist(q) - hangDist(p)).slice(0, n); for (const e of list) { e.size = far.includes(e) ? er.range(1.3, 1.38) : er.range(0.95, 1.05); e.ph = er.range(0, 6.28); esc.push(e); } };
    const lowString = [], lowParty = [];
    for (let k = 0; k < 9; k++) lowString.push({ uc: uA + k * 0.0008, a0: LOWF[k][0], lat: LOWF[k][1], up: LOWF[k][2], vlat: 0.9, slow: 2.2, hang: 1.35, low: true });
    greater(lowString, 2);
    for (let k = 0; k < 7; k++) lowParty.push({ uc: 0.79 + k * 0.002, a0: 5.4 + 2.3 * k, lat: 2.0 + 0.45 * k, up: -2.0 - 0.1 * k + 0.15 * Math.sin(k * 1.7), slow: 2.2, hang: 1.6, low: true });
    greater(lowParty, 2);
    for (let k = 0; k < 6; k++) esc.push({ uc: 0.868 + k * 0.014 + (k > 2 ? 0.006 : 0), a0: 7.6 + (k % 3) * 2.0, lat: (k % 2 ? 1 : -1) * (1.7 + 0.9 * (k % 3)), up: -1.85 - 0.2 * (k % 3), slow: 1.6, hang: 2.0, low: true,
      size: k === 5 ? er.range(1.3, 1.38) : er.range(0.95, 1.05), ph: er.range(0, 6.28) });
    // THE BLIZZARD: the flock shuts over the wings. Its stretch is the design's own (the journey: "23-28 s, u 0.62-0.76
    // ... the lead closes and the flock shuts over the wings: a pink blizzard overtaken at 19 m/s, birds above, beside
    // and mirrored below"; the set piece: single birds hang beside the cockpit for two seconds, "the nearest 5 to 12 m
    // from the lens"). Parties of eight stand at even steps of route metres from the stretch's first end to its last
    // (BLZ_D0 to BLZ_D1), and each bird hangs nearest where the eye is within 4.5 m of route of its party's station,
    // inside the stretch. A bird's seat (where it is at the middle of its hang) is dealt by the blizzard's own stream
    // ('blizzard') in metres in the route's frame:
    //   its distance from the eye: 5.5 to 11.5 m (with the half metre it wanders, inside the design's 5 to 12 m);
    //   its bearing: any direction from the eye, even over the whole sphere, except within BLZ_CONE (25 degrees) of
    //     the nose and of the tail (ahead on the route's line stand the ring and the cone, astern is our own wake):
    //     so some hang above, some beside, some ahead and some astern of the wings, some below the eye over their
    //     own reflections;
    //   kept by the world: no seat lower than a bird flies over the water (1.6 m: its 1.3 m floor and its bob); a
    //     seat between the planes of the two wings (0.98 m under the eye to 1.24 m over it) lies outside the wingtips
    //     (KEEP_SIDE); a seat lower than the eye is moved outside them by the route's rule (escAt) and must still be
    //     within the distance. A seat that fails is dealt again.
    // A greater flamingo is never among the near birds: one is a bird 10 m and more from the eye through its whole
    // hang (GREATER_OFF), and there are no more of them than the three the blizzard had.
    const br = yrBlz, BLZ_D0 = 0.62 * LEN, BLZ_D1 = 0.76 * LEN, BLZ_N = 8, BLZ_PARTIES = Math.floor(N_BLZ / BLZ_N), BLZ_CONE = Math.cos(25 * Math.PI / 180);
    for (let j = 0, nBig = 0; j < BLZ_PARTIES; j++) {
      const dj = lerp(BLZ_D0, BLZ_D1, j / Math.max(BLZ_PARTIES - 1, 1));
      for (let k = 0; k < BLZ_N; k++) {
        const d = clamp(dj + br.range(-4.5, 4.5), BLZ_D0, BLZ_D1), eye = eyeAt(d);
        let a0 = 0, lat = 0, up = 0;
        for (let t = 0; t < 24; t++) {
          const r = br.range(5.5, 11.5), c = br.range(-1, 1) * BLZ_CONE, rho = r * Math.sqrt(Math.max(1 - c * c, 0)), phi = br.range(0, 6.2832);
          a0 = r * c; lat = rho * Math.cos(phi); up = rho * Math.sin(phi);
          if (eye + up < 1.6) continue;
          if (up > -KEEP_DROP && up < 1.24 && Math.abs(lat) < KEEP_SIDE) continue;
          if (Math.hypot(a0, Math.hypot(lat, KEEP_SIDE * smoothstep(0, KEEP_DROP, -up)), up) <= 11.5) break;
        }
        up = Math.max(up, 1.6 - eye);
        const e = { uc: d / LEN, a0, lat, up, slow: 1.3, hang: 1.5, low: up < -1.0 };
        const big = nBig < 3 && hangDist(e) >= GREATER_OFF && br() < 0.3; if (big) nBig++;
        e.size = big ? br.range(1.3, 1.38) : br.range(0.98, 1.08); e.ph = br.range(0, 6.28);
        esc.push(e);
      }
    }
  }
  // the wall of the last third: four parties of big close birds that fly their own straight lines at 15 m/s (not the
  // route's), so that as the nose swings through them they cross the picture in three-quarter view, necks out and legs
  // trailing. They stand as the site has them: its four moments (0.70, 0.79, 0.84, 0.87 of the route), its headings (a
  // heading is in degrees from -Z, the lake's own axis toward the cone, right positive), its lead (a party's slots show
  // from 0.15 of the route before its moment) and its show and size rule, unchanged; nothing else is timed to them.
  // One thing is the designers' and not the site's: a party bird is a greater flamingo by its distance ahead (17 m and
  // more), not by a flag in its row.
  // PACE. The approach key is 1.12 (the live source has 1.22). The design flies the approach slower than the rest ("0-8 s,
  // u 0-0.20, 30 m/s" and "8-15 s, u 0.20-0.39, 32 m/s"); with the rest of this law as it stands and 38 s for the route,
  // 1.22 gives 41.9 m/s over u 0 to 0.20 and 38.8 over 0.20 to 0.39, 1.12 gives 39.4 and 37.0: the nearer to the design
  // of the two, so 1.12 stays. Nothing else of the law is changed.
  const paceAt = (u) => lerp(1.12, 0.84, smoothstep(0.27, 0.42, u)) - 0.1 * smoothstep(0.54, 0.6, u) * (1 - smoothstep(0.82, 0.89, u)) + 0.16 * smoothstep(0.88, 0.95, u);
  let invPace = 0; for (let i = 0; i < 64; i++) invPace += 1 / paceAt((i + 0.5) / 64) / 64;
  const wallE = [];
  {
    const wr = xr.fork('wall-escorts'), fP = new THREE.Vector3(), fD = new THREE.Vector3(), fR = new THREE.Vector3(), fU = new THREE.Vector3();
    const party = (uk, heading, list) => {
      const d = uk * LEN; path.posAtDist(d, fP); path.posAtDist(d + 30, fD); fD.sub(fP).normalize();
      fR.set(-fD.z, 0, fD.x).normalize(); fU.crossVectors(fR, fD);
      const tu = DUR / (paceAt(uk) * invPace);                     // seconds of flight per unit of u at this point of the route
      for (const [a, sx, sy] of list) {
        const size = a >= 17 ? wr.range(1.3, 1.4) : wr.range(0.96, 1.08), hd = (typeof heading === 'function' ? heading(sx) : heading) + wr.range(-4, 4), h = hd * Math.PI / 180;
        const x = fP.x + fD.x * a + fR.x * a * sx * 1.068 + fU.x * a * sy * 0.6, z = fP.z + fD.z * a + fR.z * a * sx * 1.068 + fU.z * a * sy * 0.6;
        const y = Math.max(fP.y + fD.y * a + fU.y * a * sy * 0.6, 0.62 * size + 0.35);
        wallE.push({ uk, x, y, z, vx: Math.sin(h) * 15 * tu, vz: -Math.cos(h) * 15 * tu, yaw: Math.PI - h, size, ph: wr.range(0, 6.28), rate: size > 1.2 ? 0.82 : wr.range(0.98, 1.1) });
      }
    };
    // the site's rows: [metres ahead, across, up (the site's own shares of that distance), the site's flag (not read: see above)]
    party(0.70, 24, [[3.9, -0.62, 0.3], [4.6, 0.1, -0.42], [5.2, 0.78, 0.5, 1], [5.6, -0.25, 0.62], [6.2, -0.86, -0.25, 1], [6.4, 0.42, -0.5],
      [7.5, -0.45, -0.1], [8.2, 0.6, -0.2], [8.8, -0.05, 0.28, 1], [9.5, 0.9, 0.12], [10.5, -0.72, 0.42], [11, 0.25, 0.6], [12, -0.3, -0.22], [13, 0.72, -0.12],
      [7.0, 0.16, 0.12], [7.8, -0.9, 0.16, 1], [9.2, -0.4, 0.5], [10, 0.5, 0.36], [10.8, 0.05, -0.3], [11.6, -0.62, -0.26], [12.6, 0.94, 0.4],
      [15, -0.55, 0.12], [17, 0.05, 0.05], [19, -0.15, 0.3], [21, 0.5, 0.33]]);
    party(0.79, -4, [[3.8, 0.36, 0.44, 1], [4.4, -0.2, -0.45], [5.0, -0.7, 0.42], [5.6, 0.1, 0.66], [6.0, 0.88, -0.32, 1], [6.6, -0.5, 0.14],
      [7.6, 0.35, -0.12], [8.4, -0.05, 0.3, 1], [9, 0.6, 0.0], [9.8, -0.88, -0.18], [10.5, 0.12, -0.3], [11.5, 0.46, 0.56], [12.5, -0.3, 0.52], [13.5, 0.95, 0.5],
      [5.6, -0.56, -0.42], [7.2, -0.82, 0.2, 1], [8.0, -0.32, -0.26], [9.4, 0.2, 0.14], [10.2, -0.6, 0.36], [11, -0.72, -0.15], [12, 0.74, -0.14],
      [15, 0.3, 0.2], [17, -0.15, 0.12], [19, 0.52, 0.06], [22, 0.05, 0.3]]);
    party(0.84, (sx) => (sx < 0 ? 2 : 20), [[4.0, 0.3, 0.42, 1], [4.8, -0.15, -0.5], [5.5, 0.75, -0.2], [6.2, -0.8, 0.45], [7.0, 0.1, 0.2, 1], [7.8, 0.55, 0.5],
      [8.6, -0.2, -0.28], [9.5, 0.88, 0.15], [10.5, 0.4, -0.25], [11.5, -0.9, -0.12], [12.5, 0.0, 0.5], [13.5, 0.66, -0.05]]);
    party(0.87, (sx) => (sx < 0 ? -6 : 15), [[4.2, 0.45, 0.4, 1], [5, -0.82, 0.35], [5.6, 0.85, -0.3], [6.5, 0.15, -0.5, 1], [7.5, 0.6, 0.05], [8.5, -0.7, -0.2],
      [9.5, 0.3, 0.58], [11, 0.9, 0.3], [12, -0.62, 0.5], [14, 0.4, -0.15]]);
  }
  // THE STREAMS BESIDE THE COCKPIT, the whole way through the flock (0.62 to 0.91 of the route): one lesser flamingo
  // closes from ahead every 0.008 of the route, in turn on each of four bearings round the route's
  // line (level left, up right, level right, up left). It hangs 5 to
  // 12 m from the lens for three to four seconds, neck out and legs trailing, then drops astern. The level ones fly
  // below the eye, low over the water, each over its own dark copy.
  const escS = [];
  {
    const sr = yrStream, TH = [3.19, 1.08, -0.05, 2.06];
    for (let k = 0; k < N_STREAM; k++) {
      const level = k % 2 === 0, th = TH[k % 4] + sr.range(-0.3, 0.3), a0 = sr.range(4.8, 9.2);
      let r = sr.range(4.2, 9.4), lat = r * Math.cos(th), up = level ? -sr.range(0.4, 2.3) : Math.min(r * Math.sin(th), 0.5 * a0);
      lat = Math.sign(lat || 1) * clamp(Math.abs(lat), 2.2, 0.9 * a0);
      const far = Math.hypot(a0, lat, up); if (far > 12) { lat *= 12 / far; up *= 12 / far; }
      escS.push({ uc: 0.622 + (k + 0.5) / N_STREAM * 0.288 + sr.range(-0.003, 0.003), a0: a0 * Math.min(1, 12 / far), lat, up, low: level, hang: sr.range(1.5, 2.1), slow: sr.range(1.2, 2.0),
        size: sr.range(0.97, 1.07), ph: sr.range(0, 6.28) });
    }
  }
  const SK_D0 = 0.09 * (LEN - 15 * DUR), SK_GAP = 3.4, SK_LAT = 4.2, SK_Y = 2.4, skSide = -pelSide, skPh = xr.range(0, 6.28);

  const placeEscorts = (time, u) => {
    const front = frontAtU(u);      // the liftoff line's band station
    for (let i = 0; i < N_PATH; i++) {
      const e = esc[i]; escAt(e, time, u, _e4);
      const a = _e4.w, show = a > -6 && a < 78;
      hero.escorts.set(i, _e4.x, show ? _e4.y : -60, _e4.z, Math.atan2(_t.x, _t.z) + (e.vlat ? -0.085 : 0) + 0.04 * Math.sin(time * 0.6 + e.ph + 1.57), 0.03, e.size * (1 - smoothstep(62, 78, a)), e.size > 1.2 ? 0.8 : 1.08);
    }
    for (let i = 0, nW = Math.min(N_WALL, wallE.length); i < nW; i++) {
      const ew = wallEarly[i];
      if (ew && u < ew.gone) {      // the slot is the riser's until it is astern (ew.gone); it is never scaled
        const tb = (front - ew.s) / VF, sz = ew.size, rate = ew.size > 1.2 ? 0.8 : 1.08;      // tb: its own clock, seconds before (-) and after (+) it lifts
        if (tb <= 0) {
          // on the water: feeding where it stands; then neck up, turned into the breeze, wings open, and its seven-metre run
          const run = travelB(Math.max(tb + 1.4, 0)), turn = smoothstep(-2.2, -1.5, tb), rw = smoothstep(0, 0.5, run);
          hero.escorts.set(N_PATH + i, ew.gx + ew.fx * run, lerp(0.5, 0.45, rw) * ew.size, ew.gz + ew.fz * run, ew.rest + wrapPi(ew.yawF - ew.rest) * turn, lerp(0.14, -0.04, rw), sz, rate, tb, ew.beh, run);
          continue;
        }
        // in the air: from where it left the water it climbs to its place in the wall (over its own climb) and settles into it
        escAt(ew, time, u, _e4);
        const a = _e4.w, run = travelB(tb + 1.4), w = smoothstep(0, RISER_BLEND, tb), cl = smoothstep(0, ew.rise * DUR, tb), yawR = Math.atan2(_t.x, _t.z);
        let x = lerp(ew.gx + ew.fx * run, _e4.x, w), y = lerp(0.45 * ew.size, _e4.y, cl), z = lerp(ew.gz + ew.fz * run, _e4.z, w);
        const rx = x - _cam.x, ry = y - _cam.y, rz = z - _cam.z, rl = Math.hypot(rx, ry, rz);
        if (rl < 2.6) { const k = (2.6 - rl) / Math.max(rl, 0.05); x += rx * k; y += (rl < 0.05 ? 2.6 : ry * k); z += rz * k; }
        hero.escorts.set(N_PATH + i, x, a > -6 || w < 1 ? y : -60, z, ew.yawF + wrapPi(yawR - ew.yawF) * w + 0.04 * Math.sin(time * 0.6 + ew.ph + 1.57) * w,
          0.03 + (ew.climb ? 0.09 : 0) + 0.9 * cl * (1 - cl), sz, rate, Math.min(tb, 5), 1, 60);
        continue;
      }
      const e = wallE[i], du = u - e.uk, on = du > -0.15 && du < 0.035;
      let x = e.x + e.vx * du + 0.3 * Math.sin(time * 0.5 + e.ph), y = e.y + 0.22 * Math.sin(time * 0.8 + e.ph * 2.3), z = e.z + e.vz * du + 0.3 * Math.cos(time * 0.43 + e.ph * 1.7);
      // never through the lens: a bird that comes within 2.6 m of the eye is eased out along the line from the eye to it
      const rx = x - _cam.x, ry = y - _cam.y, rz = z - _cam.z, rl = Math.hypot(rx, ry, rz);
      if (rl < 2.6) { const k = (2.6 - rl) / Math.max(rl, 0.05); x += rx * k; y += (rl < 0.05 ? 2.6 : ry * k); z += rz * k; }
      hero.escorts.set(N_PATH + i, x, on ? Math.max(y, 0.9) : -60, z, e.yaw + 0.04 * Math.sin(time * 0.6 + e.ph), 0.03, e.size * smoothstep(-0.15, -0.125, du), e.rate);
    }
    // the skein over the lead: nine flamingos in line astern, flying our way at 15 m/s low over the brine; we come up
    // on them from behind and above and pass along their flank between u 0.05 and 0.12 (placed by u, so they wait for us)
    for (let k = 0; k < N_SKEIN; k++) {
      const sd = SK_D0 + k * SK_GAP + (k > 6 ? 3.5 : 0) + 15 * DUR * u + 0.6 * Math.sin(time * 0.5 + k * 1.7);
      path.posAtDist(Math.min(sd, LEN), _e4); path.tangentAtDist(Math.min(sd, LEN), _t); const l = Math.hypot(_t.x, _t.z) || 1;
      const lat = skSide * (SK_LAT + 0.5 * Math.sin(k * 2.1 + skPh) + 0.35 * Math.sin(time * 0.45 + k * 1.3)), fade = (1 - smoothstep(0.2, 0.24, u));
      hero.escorts.set(N_ESC + k, _e4.x - _t.z / l * lat, fade > 0.01 ? Math.max(_e4.y - SK_Y, 2.2) + 0.45 * Math.sin(k * 1.3 + skPh) + 0.2 * Math.sin(time * 0.7 + k * 2.2) : -60, _e4.z + _t.x / l * lat,
        Math.atan2(_t.x, _t.z) + 0.03 * Math.sin(time * 0.5 + k), 0.02, (0.92 + 0.12 * ((k * 7) % 5) / 4) * fade, 1.02);
    }
    for (let k = 0; k < N_STREAM; k++) {
      const e = escS[k]; escAt(e, time, u, _e4);
      const a = _e4.w, show = a > -6 && a < 78;      // by its distance ahead of the lens, like every other bird of the flock: it is seen closing from 78 m
      let x = _e4.x, y = _e4.y, z = _e4.z;
      const rx = x - _cam.x, ry = y - _cam.y, rz = z - _cam.z, rl = Math.hypot(rx, ry, rz);
      if (rl < 3.2) { const q = (3.2 - rl) / Math.max(rl, 0.05); x += rx * q; y += (rl < 0.05 ? 3.2 : ry * q); z += rz * q; }
      hero.escorts.set(N_ESC + N_SKEIN + k, x, show ? Math.max(y, 1.3) : -60, z, Math.atan2(_t.x, _t.z) + 0.04 * Math.sin(time * 0.6 + e.ph + 1.57), 0.03, e.size * (1 - smoothstep(62, 78, a)), 1.08);
    }
    hero.escorts.commit();
  };
  await ctx.yield();
  // marabou storks: three on the crust beside the approach, three at the colony edge
  const marabouAt = [];
  {
    const pos = [], mr = rng.fork('marabou');
    for (let i = 0; i < 3; i++) { const j1 = mr.range(-1, 1) * 0.4, j2 = mr.range(-0.5, 0.5) * 0.6; at(U25 + [9.6, 11.6, 13.0][i] + j1 * 0.3, standSide * ([3.5, 5.2, 4.0][i] + j2 * 0.15), _q); pos.push([_q.x, 0, _q.z]); marabouAt.push(_q.x, _q.z); }
    for (let i = 0, tries = 60; i < 3 && tries > 0; tries--) { at(P0 + mr.range(60, 170), -mr.range(47, 56), _q); if (!isSalt(_q.x, _q.z, 0.05)) continue; pos.push([_q.x, 0, _q.z]); i++; }
    fauna.add(F.makeWaders({ rng: mr, species: 'stork', positions: pos, count: pos.length, level: 0, depth: 0, size: 1.95, oneLeg: 0.2, active: 0.35, peckRate: 0.25,
      body: '#454a54', wing: '#26282e', belly: '#e6e2d8', neckC: '#d9aea4', cap: '#cdb2aa', beakC: '#b7a88c', legC: '#d2ccc0' }), { always: true });
  }
  await ctx.yield();

  scene.userData.natron.marabou = marabouAt;
  for (let i = 0; i < 3 && i * 2 + 1 < marabouAt.length; i++) lakeU.uMar.value[i].set(marabouAt[i * 2], marabouAt[i * 2 + 1], 2.24, 0);

  // ---------- air: salt dust all the way, down feathers once the flock is up, steam at the seep ----------
  const air = fx.fxGroup(); scene.add(air.object);
  const night = lookId === 'moon';
  air.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: LIT.uTime, count: Math.round(1100 * detail), box: [64, 24, 64], size: [0.025, 0.07],
    colors: night ? ['#9aa6d8', '#c6ccf0', '#8088b8'] : ['#efe2d6', '#eed2d4', '#e6dfd4'], intensity: night ? 0.5 : 0.6, opacity: night ? 0.5 : 0.32, additive: night ? 0.5 : 0, twinkle: night ? 0.5 : 0.15, velocity: [0.5, 0.05, -0.2] }));
  await ctx.yield();
  const feathers = air.add(fx.makeParticles({ rng: rng.fork('down'), preset: 'petals', time: LIT.uTime, count: Math.round(340 * detail), box: [54, 22, 54], size: [0.05, 0.12],
    colors: ['#f6c9d2', '#f2eee6', '#f3a0b4'], velocity: [0.6, -0.35, -0.3], lightDir: [SUN.x, SUN.y, SUN.z], intensity: night ? 0.45 : 0.9 }));
  feathers.setOpacity(0);
  await ctx.yield();
  air.add(fx.makeMist({ rng: rng.fork('seep'), time: LIT.uTime, positions: [[seepA.x, 1.1, seepA.z], [seepA.x + 4, 1.6, seepA.z - 5], [seepA.x - 5, 1.3, seepA.z + 3]], size: [5, 9],
    color: C('#eef0ee').multiply(fillCol).multiplyScalar(0.3), opacity: 0.16, drift: [0.5, 0, 0.2] }));
  await ctx.yield();
  const devils = [];
  if (lookId === 'noon') {
    for (const [d, lat] of [[rng.range(330, 420), rng.range(95, 130)], [rng.range(640, 760), rng.range(150, 210)]]) {
      at(d, lat, _q);
      devils.push(air.add(fx.makeDustDevil({ rng: rng.fork('devil' + d), time: LIT.uTime, position: [_q.x, 0, _q.z], height: rng.range(38, 56), radius: [1, 8.5], wander: 5,
        color: '#e6dfd2', colorTop: '#f1ece2', shadowColor: '#a79c90', opacity: 0.36, sunDir: [SUN.x, SUN.y, SUN.z] })));
      await ctx.yield();
    }
  }

  // ---------- the ring's reflection closes the circle ----------
  const pEnd = path.posAtDist(LEN, new THREE.Vector3()), tEnd = path.tangentAtDist(LEN, new THREE.Vector3());
  const ringMirror = new THREE.Mesh(new THREE.PlaneGeometry(19, 19), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: C(look.portal) }, uTime: LIT.uTime, uAmt: { value: night ? 0.5 : 0.62 } },
    vertexShader: /* glsl */`varying vec2 vL; varying float vY; void main(){ vL = position.xy; vec4 w = modelMatrix*vec4(position, 1.); vY = w.y; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uTime, uAmt; varying vec2 vL; varying float vY;
      void main(){
        vec2 p = vL; p.x += (sin(p.y*1.9 + uTime*2.1)*0.16 + sin(p.y*4.3 - uTime*3.)*0.07)*(1. + max(-vY, 0.)*0.12);
        float r = length(p);
        float ring = smoothstep(6.1, 6.9, r)*(1. - smoothstep(7.2, 8.4, r));
        float a = (ring*1.3 + 0.16*(1. - smoothstep(2., 6.6, r)))*(1. - smoothstep(-0.5, 0.05, vY))*(1. - smoothstep(8.5, 14.5, -vY));
        gl_FragColor = vec4(uCol*a*uAmt, 1.);
      }` }));
  ringMirror.position.set(pEnd.x, -pEnd.y, pEnd.z); ringMirror.rotation.y = Math.atan2(-tEnd.x, -tEnd.z); ringMirror.renderOrder = 3; ringMirror.frustumCulled = false;
  scene.add(ringMirror);

  // ---------- the flight ----------
  const _b = new THREE.Vector2(), _cam = new THREE.Vector3();
  const shadowReach = 1 / Math.max(Math.tan(elR), 0.03), shadowPen = 0.0047 / Math.max(Math.sin(elR), 0.06);      // metres of shadow per metre of height; the sun's half-width over the sine of its elevation
  await ctx.yield();

  // THE FLIERS KEPT OFF OUR LINE BY PLACE (round 16). Computed here, once, from the numbers the part dealt (the instance
  // arrays of its draws near, mid and far) and the uniforms as the build leaves them (uVF, uLane, uOver, uMarchW). No
  // random draw is made; nothing is read of the eye, the seed, a still's place or the clock.
  // THE TABLE: the route's own line every 0.05 m (its place, its level heading, the liftoff line's station as update()
  // sets it, and the over-fliers' base: the route's height + OVER_BASE, as update() sets uOverH); linear between
  // (the last entry, the route's end, is read as if a whole 0.05 m after the one before).
  // THE BOX of a bird, at a station of ours, is every term of the part's law (evalBird) that can move it, each at its
  // extreme whatever the hash and the clock give: its run along its heading; across, its curve, the hash's side step
  // (0.07 m a metre flown past 7 m) and the sway (0.5 m), carried through the lane's part of the push (the eye's part
  // idle); up, its climb to its cruise (an over-flier's at five cruises across the base's 5.5 m range), the bob (0.3 m)
  // and the wingbeat's heave (0.035 m). Its CLEAR AIR is the distance from our line's point to that box, less its
  // reach (0.80 of its size: the bill's centre line, its ribbon's half width of some 3 mm is over that; the far
  // tier's card 1.10, some 3 mm short of the card's empty corner).
  // THE WALK (fails): from the station of ours at which the bird leaves the water to the route's end, against the limit
  // asked (5.0 m, the fliers' rule; 2.0 m for a straggler we pass on the water); each step is the clear air over the
  // limit divided by a bound on how fast it can close (our own metre, and the bird's run, side speeds and climb
  // through the seconds its clock runs in a metre of ours), held between 0.01 and 2 m; the bird fails at the first
  // walked station under the limit (between two walked stations the clear air can dip under it by the least step
  // times the bound: 0.055 m at the most on the forty seeds counted, a count's figure that no line holds; so a
  // straggler held to 2.0 m could have some 1.945 m between two stations). The lane's figure in the bound, vLane,
  // is the top rate of the part's inLane, smoothstep(uLane.x, uLane.y, s + bD): a smoothstep's steepest slope,
  // 1.5 over its length, times
  // the 15 m a second of the bird's run (travel), read from the lane the build has set: 0.225 a second on the
  // 100 m lane, 0.321 on the rare visit's 70 m. Where the same bound, taken at its greatest over the stretch ahead,
  // says that the next stations are clear and their steps 2 m too, those stations are stepped over without building
  // the box.
  // THE CURE, bird by bird (a bird that passes its tests is left; so is one that does not leave the water before the
  // route's end, save a straggler we pass on the water, which is put to the water test whether or not it lifts):
  //  - a straggler (dealt cruise under 2.0) still on the water (its clock under 0) as we come abeam of it (looked for
  //    every 0.25 m from 80 m before its station) is held to 2.0 m of clear air on its skin, not to the 5.0 m: on
  //    the water (its box against our line up to the station at which it lifts) and after it lifts (the walk, by
  //    the same box, against 2.0 m). One that passes both is left as dealt; one that fails either is moved outward
  //    in 0.1 m steps (19.9 m at the most) to the first place that passes both;
  //  - any other straggler that fails is moved outward by the least shift: 0.5 m steps (40 m at the most) until the
  //    walk passes, then seven halvings;
  //  - a bird that no shift within its limit (19.9 m, 40 m) cures is left as dealt, and nothing marks it;
  //  - any other bird that fails has its dealt cruise raised by the least raise (0.25 m steps until the walk passes,
  //    then six halvings): where it can become an over-flier (its station between uOver's two, within 13.5 m of the
  //    axis) to 8.5 m, and if nothing passes on to 9.5 m (a whole over-flier), each trial walked as the over-flier it
  //    becomes; where it cannot, by 16 m at the most. A bird no raise cures (a whole over-flier as dealt among them)
  //    is moved outward by the least shift.
  // WHAT IS WRITTEN: a raised bird's cruise (iA.z); a moved bird's lateral (iA.w), its place on the ground (iPos.x,
  // iPos.y) and, for a marcher, its circle's centre (iC.x, iC.y), each moved by the shift across its heading on the
  // side it has; the same numbers in the rows that are that bird's copies in the draws mirror, farMirror and splash
  // (found by its dealt numbers); iPos, iA and iC of those six draws are marked for upload.
  // A hand-back is asked after every 512 entries of the table and after about every 2000 boxes.
  {
    const LIM = 5.0, FLOOR = 2.0, HS = 0.05, TR = 1.4, PIECE = 2000;
    const HU = hero.uniforms, vf = HU.uVF.value, lane = HU.uLane.value, ov = HU.uOver.value, mW = HU.uMarchW.value;
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const trav = (rt) => { const t1 = Math.min(rt, 2.1); return 0.5 * 7.143 * t1 * t1 + 15 * Math.max(rt - 2.1, 0); };
    const hgt = (c, tb) => { const Tc = 1.3 + c * 0.09, x = Math.min(1, Math.max(0, tb / Tc)); return c * x * x * (3 - 2 * x); };
    const N = Math.floor(LEN / HS) + 2, LX = new Float64Array(N), LY = new Float64Array(N), LZ = new Float64Array(N), TX = new Float64Array(N), TZ = new Float64Array(N), UF = new Float64Array(N), OB = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const d = Math.min(i * HS, LEN); path.posAtDist(d, _p); path.tangentAtDist(d, _t); const h = Math.hypot(_t.x, _t.z) || 1;
      LX[i] = _p.x; LY[i] = _p.y; LZ[i] = _p.z; TX[i] = _t.x / h; TZ[i] = _t.z / h; UF[i] = d - P0 + leadAt(d - P0, d / LEN); OB[i] = _p.y + OVER_BASE;
      if ((i & 511) === 511) await ctx.yield();
    }
    let fMax = 0; for (let i = 1; i < N - 1; i++) { const s = (UF[i] - UF[i - 1]) / HS; if (s > fMax) fMax = s; }
    let Li = 0, Lk = 0, Lx = 0, Ly = 0, Lz = 0, Luf = 0, Lob = 0, cl = 0, bTb = 0, bDd = 0, bW = 0, ev = 0;
    const lens = (d) => {
      const x = Math.min(Math.max(d, 0), LEN) / HS, i = Math.min(Math.floor(x), N - 2), k = x - i, j = i + 1;
      Li = i; Lk = k; Lx = LX[i] + (LX[j] - LX[i]) * k; Ly = LY[i] + (LY[j] - LY[i]) * k; Lz = LZ[i] + (LZ[j] - LZ[i]) * k;
      Luf = UF[i] + (UF[j] - UF[i]) * k; Lob = OB[i] + (OB[j] - OB[i]) * k;
    };
    const dAtFront = (x) => {
      if (UF[0] >= x) return 0; if (UF[N - 1] < x) return Infinity;
      let a = 0, b = N - 1; while (b - a > 1) { const m = (a + b) >> 1; if (UF[m] >= x) b = m; else a = m; }
      return Math.min(LEN, (a + (x - UF[a]) / (UF[b] - UF[a])) * HS);
    };
    const dLift = (c) => dAtFront(c.s + vf * (c.jit - 0.5 * c.over));
    const overOf = (c, cz, lat) => ss(8.5, 9.5, cz) * (c.s >= ov.x ? 1 : 0) * (c.s <= ov.y ? 1 : 0) * (Math.abs(lat) <= 13.5 ? 1 : 0);
    const birdOf = (A, i, far) => {
      const o = i * 4, hd = A.iPos.array[o + 2], lat = A.iA.array[o + 3], size = A.iB.array[o + 1];
      const c = { s: A.iA.array[o], seed: A.iA.array[o + 1], cz: A.iA.array[o + 2], lat, size, jit: A.iB.array[o + 2], Gx: A.iPos.array[o], Gz: A.iPos.array[o + 1], f0x: Math.sin(hd), f0z: Math.cos(hd), k: A.iPos.array[o + 3],
        march: A.iC.array[o + 2] > 0.5, mcx: A.iC.array[o], mcz: A.iC.array[o + 1], mr: A.iC.array[o + 2], ma: A.iC.array[o + 3], sg: lat >= 0 ? 1 : -1, reach: (far ? 1.10 : 0.80) * size, low: 0, over: 0 };
      c.r0x = -c.f0z; c.r0z = c.f0x; c.low = 1 - ss(2.0, 2.6, c.cz); c.over = overOf(c, c.cz, lat);
      return c;
    };
    const raised = (b, rho) => { const c = { ...b }; c.cz = b.cz + rho; c.low = 1 - ss(2.0, 2.6, c.cz); c.over = overOf(b, c.cz, b.lat); return c; };
    const moved = (b, dl) => { const c = { ...b }, ax = b.r0x * b.sg * dl, az = b.r0z * b.sg * dl; c.Gx = b.Gx + ax; c.Gz = b.Gz + az; c.mcx = b.mcx + ax; c.mcz = b.mcz + az; c.lat = b.lat + b.sg * dl; c.over = overOf(b, b.cz, c.lat); return c; };
    const box = (c) => {
      ev++;
      const tb = (Luf - c.s) / vf - c.jit + 0.5 * c.over;
      let Gx = c.Gx, Gz = c.Gz;
      if (c.march) { const clk = Math.min(Luf / vf, c.s / vf + c.jit - 2.3), a = c.ma + mW * clk; Gx = c.mcx + c.mr * Math.cos(a); Gz = c.mcz + c.mr * Math.sin(a); }
      const bD = trav(Math.max(tb + TR, 0)), runW = ss(0, 0.5, bD), air = ss(0, 0.6, tb);
      const inLane = ss(lane.x, lane.y, c.s + bD), z0 = lane.z * (1 - c.over), m = (z0 + (lane.w - z0) * inLane) * (1 - c.low);
      const W = 0.07 * Math.max(bD - 7, 0) + 0.5 * air, w = 1.6 * inLane * air, sg = c.sg, lat = c.lat;
      const g0 = (lat - W - lat) + sg * Math.max(m - sg * (lat - W), 0) * w, g1 = (lat + W - lat) + sg * Math.max(m - sg * (lat + W), 0) * w, kink = sg * m;
      let lo = g0, hi = g0; if (g1 < lo) lo = g1; if (g1 > hi) hi = g1;
      if (kink > lat - W && kink < lat + W) { const q = (kink - lat) + sg * Math.max(m - sg * kink, 0) * w; if (q < lo) lo = q; if (q > hi) hi = q; }
      const bend = 0.5 * c.k * bD * bD, yb = (0.50 - 0.05 * runW) * c.size;
      let hLo, hHi;
      if (c.over > 0) { const c0 = c.cz + (Lob - c.cz) * c.over, c1 = c.cz + (Lob + OVER_RANGE - c.cz) * c.over; hLo = Infinity; hHi = -Infinity; for (let q = 0; q <= 4; q++) { const h = hgt(c0 + (c1 - c0) * q / 4, tb); if (h < hLo) hLo = h; if (h > hHi) hHi = h; } }
      else hLo = hHi = hgt(c.cz, tb);
      const bob = 0.3 * ss(0.3, 2.2, tb) + 0.035 * air, cLo = bend + lo, cHi = bend + hi, yLo = yb + hLo - bob, yHi = yb + hHi + bob;
      const dx = Lx - Gx, dz = Lz - Gz, la = dx * c.f0x + dz * c.f0z, lc = dx * c.r0x + dz * c.r0z;
      const da = la - bD, dc = lc < cLo ? cLo - lc : lc > cHi ? lc - cHi : 0, dy = Ly < yLo ? yLo - Ly : Ly > yHi ? Ly - yHi : 0;
      cl = Math.sqrt(da * da + dc * dc + dy * dy) - c.reach; bTb = tb; bDd = bD; bW = W;
    };
    const fv = fMax / vf, VB = 7.143 * 2.1, vLane = 1.5 * 15 / (lane.y - lane.x);
    const fails = (c, lim = LIM) => {
      let d = dLift(c); if (!(d < LEN)) return false;
      const cz = c.over > 0 ? Math.max(c.cz, 20) : c.cz, vUp = Math.min(16.7, cz * 1.5 / (1.3 + 0.09 * cz)) + 0.3, ka = Math.abs(c.k);
      for (;;) {
        lens(d); box(c);
        if (cl < lim) return true; if (d >= LEN) return false;
        const early = bTb < 0.7 ? 2.5 : 0, vPush = c.s + bDd + 40 > lane.x ? 3.2 + (lane.w + bW + 1) * 1.6 * (vLane + early) : 0, vAc = ka * (bDd + 3) * 15 + 0.07 * 15 + 1.25 + vPush;
        let h = (cl - lim) / (1 + 0.06 + fv * Math.sqrt(15 * 15 + vAc * vAc + vUp * vUp));
        if (h < 0.01) h = 0.01;
        else if (h > 2) {
          const bDw = bDd + VB * fv * h, vPw = c.s + bDw + 40 > lane.x ? 3.2 + (lane.w + 0.07 * Math.max(bDw - 7, 0) + 0.5 + 1) * 1.6 * (vLane + early) : 0, vAw = ka * (bDw + 3) * 15 + 0.07 * 15 + 1.25 + vPw;
          const x = (cl - lim) / (1 + 0.06 + fv * Math.sqrt(15 * 15 + vAw * vAw + vUp * vUp)) - 2;
          for (let j = 2; j <= x; j += 2) { d = Math.min(LEN, d + 2); if (d >= LEN) return false; }
          h = 2;
        }
        d = Math.min(LEN, d + h);
      }
    };
    const trial = async (c) => { if (ev > PIECE) { ev = 0; await ctx.yield(); } return fails(c); };
    const leastRaise = async (b, r0, rMax) => {
      if (!(rMax > r0 + 1e-9)) return null;
      let lo = r0, hi = -1;
      for (let k = 1; ; k++) { let rh = r0 + 0.25 * k; const last = rh >= rMax - 1e-9; if (last) rh = rMax; if (!(await trial(raised(b, rh)))) { hi = rh; break; } lo = rh; if (last) break; }
      if (hi < 0) return null;
      for (let q = 0; q < 6; q++) { const mid = (lo + hi) / 2; if (await trial(raised(b, mid))) lo = mid; else hi = mid; }
      return hi;
    };
    const leastShift = async (b) => {
      let lo = 0, hi = -1;
      for (let dl = 0.5; dl <= 40 + 1e-9; dl += 0.5) { if (!(await trial(moved(b, dl)))) { hi = dl; break; } lo = dl; }
      if (hi < 0) return Infinity;
      for (let q = 0; q < 7; q++) { const mid = (lo + hi) / 2; if (await trial(moved(b, mid))) lo = mid; else hi = mid; }
      return hi;
    };
    const water = (c) => {
      const dEnd = Math.min(LEN, dLift(c)); let d = 0, least = Infinity;
      for (;;) { lens(d); box(c); if (cl < least) least = cl; if (d >= dEnd) break; d = Math.min(dEnd, d + (cl > 12 ? Math.max(0.1, (cl - 11) / 2.2) : 0.1)); }
      return least;
    };
    const onWaterAbeam = (c) => {
      let prev = 0;
      for (let d = Math.max(0, P0 + c.s - 80); d <= LEN; d += 0.25) {
        lens(d); ev++;
        const tb = (Luf - c.s) / vf - c.jit + 0.5 * c.over; if (tb >= 0) return false;
        let Gx = c.Gx, Gz = c.Gz;
        if (c.march) { const clk = Math.min(Luf / vf, c.s / vf + c.jit - 2.3), a = c.ma + mW * clk; Gx = c.mcx + c.mr * Math.cos(a); Gz = c.mcz + c.mr * Math.sin(a); }
        const bD = trav(Math.max(tb + TR, 0)), side = 0.5 * c.k * bD * bD;
        const ahead = (Gx + c.f0x * bD + c.r0x * side - Lx) * (TX[Li] + (TX[Li + 1] - TX[Li]) * Lk) + (Gz + c.f0z * bD + c.r0z * side - Lz) * (TZ[Li] + (TZ[Li + 1] - TZ[Li]) * Lk);
        if (prev > 0 && ahead <= 0) return true;
        prev = ahead;
      }
      return false;
    };
    const tiers = ['near', 'mid', 'far'].map((n) => hero.object.getObjectByName(n).geometry), ch = [];
    for (let t = 0; t < 3; t++) {
      const A = tiers[t].attributes, n = tiers[t].instanceCount;
      for (let i = 0; i < n; i++) {
        if (ev > PIECE) { ev = 0; await ctx.yield(); }
        if (!(A.iA.array[i * 4] < 1e4)) continue;
        const b = birdOf(A, i, t === 2), st = b.cz < 2.0;
        if (st && onWaterAbeam(b)) {
          if (water(b) < FLOOR || fails(b, FLOOR)) for (let dl = 0.1; dl <= 20; dl += 0.1) { if (ev > PIECE) { ev = 0; await ctx.yield(); } const c = moved(b, dl); if (water(c) >= FLOOR && !fails(c, FLOOR)) { ch.push({ b, cz: NaN, dl }); break; } }
          continue;
        }
        if (!fails(b)) continue;
        let rho = null;
        if (!st) {
          const can = b.s >= ov.x && b.s <= ov.y && Math.abs(b.lat) <= 13.5;
          if (b.over === 0) { rho = await leastRaise(b, 0, can ? 8.5 - b.cz : 16); if (rho === null && can) rho = await leastRaise(b, Math.max(8.5 - b.cz, 0), 9.5 - b.cz); }
          else if (b.over < 1) rho = await leastRaise(b, 0, 9.5 - b.cz);
        }
        if (rho !== null) { ch.push({ b, cz: b.cz + rho, dl: 0 }); continue; }
        const dl = await leastShift(b);
        if (dl < Infinity) ch.push({ b, cz: NaN, dl });
      }
    }
    await ctx.yield();
    const bySeed = new Map(); for (const c of ch) { const l = bySeed.get(c.b.seed); if (l) l.push(c); else bySeed.set(c.b.seed, [c]); }
    for (const name of ['near', 'mid', 'far', 'mirror', 'farMirror', 'splash']) {
      const g = hero.object.getObjectByName(name).geometry, P = g.attributes.iPos, Aa = g.attributes.iA, C = g.attributes.iC, n = g.instanceCount;
      for (let i = 0, o = 0; i < n; i++, o += 4) {
        const l = bySeed.get(Aa.array[o + 1]); if (!l) continue;
        for (const c of l) {
          const b = c.b; if (Aa.array[o] !== b.s || Aa.array[o + 2] !== b.cz || Aa.array[o + 3] !== b.lat || P.array[o] !== b.Gx || P.array[o + 1] !== b.Gz) continue;
          if (c.dl === 0) Aa.array[o + 2] = c.cz;
          else { const ax = b.r0x * b.sg * c.dl, az = b.r0z * b.sg * c.dl; P.array[o] = b.Gx + ax; P.array[o + 1] = b.Gz + az; Aa.array[o + 3] = b.lat + b.sg * c.dl; if (b.march) { C.array[o] = b.mcx + ax; C.array[o + 1] = b.mcz + az; } }
          break;
        }
      }
      P.needsUpdate = Aa.needsUpdate = C.needsUpdate = true;
    }
  }
  await ctx.yield();

  await sky.prewarm(ctx.renderer, null, scene);

  function update(dt, time, camera, u) {
    LIT.uTime.value = time;
    const camD = u * LEN, camS = camD - P0, lead = leadAt(camS, u);
    hero.setFront(camS + lead);
    // the over-fliers' base over the route at the lens: the route's height + OVER_BASE (the sum is spelled where the
    // constant is typed)
    hero.uniforms.uOverH.value.set(path.posAtDist(camD, _p).y + OVER_BASE, OVER_RANGE);     // the over-fliers pass 5.69 to 11.19 m above the route
    hero.update(dt, time, camera);
    sky.update(dt, time, camera); rig.update(dt, time, camera);
    // every kit creature is behind us by the lane; parked from there on (one of them veils the sky with fog colour past u 0.94)
    fauna.update(dt, time, camera, u, u < 0.9);
    _cam.setFromMatrixPosition(camera.matrixWorld);                    // never camera.position: the portal camera is posed by its matrix
    placePelicans(time, u); placeEscorts(time, u);
    if (placeEagle) placeEagle(time, u);
    air.update(dt, time, camera);
    feathers.setOpacity(smoothstep(0.4, 0.56, u) * (1 - 0.5 * smoothstep(0.9, 1, u)));
    far.position.set(_cam.x, 0, _cam.z);
    lakeU.uCam.value.copy(_cam);
    // The biplane's shadow, from the real camera and the real sun (GLSL_PLANE_SHADOW): the eye's ground point, the
    // route's heading there, the eye's height, and the down-sun vector per metre of height turned into the plane's frame.
    const h = Math.max(_cam.y, 0.5), reach = h * shadowReach;
    const hl = Math.hypot(SUN.x, SUN.z) || 1;
    path.tangentAtDist(camD, _t); const tl = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / tl, tz = _t.z / tl;
    const dwx = -SUN.x / hl * shadowReach, dwz = -SUN.z / hl * shadowReach;
    lakeU.uShadow.value.set(_cam.x, _cam.z, -tx, -tz);
    lakeU.uShadow3.value.set(dwx * -tz + dwz * tx, -(dwx * tx + dwz * tz), 0, 0);
    // fainter under the moon and under the overcast of the rains; it fades out as it lengthens (a low sun, or the eye
    // high over the water: 14 to 42 m down-sun); none while the world is seen through a portal (it is ours, not the
    // portal camera's)
    const shK = (ctx.through ? 0 : night ? 0.5 : lookId === 'rains' ? 0.38 : 1) * (1 - smoothstep(14, 42, reach));
    lakeU.uShadow2.value.set(shK, 0.42 * shK, h, shadowPen);
    // the liftoff line on the water, for the lake's pattering band and the flock's mirror
    const sF = clamp(P0 + camS + lead, 0, LEN - 6);
    path.posAtDist(sF, _p); path.tangentAtDist(sF - 5, _t); const y0 = Math.atan2(_t.x, _t.z);
    path.tangentAtDist(sF + 5, _t); let dy = Math.atan2(_t.x, _t.z) - y0; dy = ((dy + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    path.tangentAtDist(sF, _t); const fl = Math.hypot(_t.x, _t.z) || 1;
    lakeU.uFrontP.value.set(_p.x, _p.z, _t.x / fl, _t.z / fl);
    lakeU.uFrontK.value.set(-dy / 10, 31, smoothstep(-30, 25, camS + lead) * (1 - 0.5 * smoothstep(0.84, 0.95, u)), smoothstep(0.42, 0.53, u) * (1 - 0.35 * smoothstep(0.93, 1, u)));
    const hgtPx = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_b).y : 1080;
    ribbons.material.uniforms.uPix.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.05) * Math.max(hgtPx, 1));
    // the wave's body rides the liftoff line: thick from the first runners on, parting into the lane, gone at the ring
    waveU.uPix.value = ribbons.material.uniforms.uPix.value;
    waveU.uWall.value.set(camS + lead, lakeU.uFrontK.value.x, smoothstep(0.4, 0.47, u) * (1 - 0.5 * smoothstep(0.71, 0.79, u)) * (1 - smoothstep(0.9, 0.955, u)), WAVE_B);
    waveU.uWall2.value.set(15 * smoothstep(0.74, 0.86, u), 0.9 + 0.5 * smoothstep(0.6, 0.68, u));      // a wall ahead of the nose, then a sheet over the wings
    // The lake's lines are held a pixel wide (uPix); under the wall the mirror carries its dark mass (uMass); spray
    // crowns stand along the pattering line.
    lakeU.uPix.value = waveU.uPix.value;
    lakeU.uMass.value.w = smoothstep(0.42, 0.5, u) * (1 - smoothstep(0.7, 0.8, u));
    crownU.uCrown.value.x = smoothstep(0.41, 0.46, u) * (1 - 0.6 * smoothstep(0.84, 0.92, u)) * (1 - smoothstep(0.95, 0.985, u));
    waveU.uStream.value.w = 0.4 + 0.6 * lakeU.uMass.value.w;      // (w: how strong the reflections are)
    if (chicks) {
      const hgt = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_b).y : 1080;
      chicks.material.uniforms.uPix.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.05) * Math.max(hgt, 1));
    }
  }

  return {
    scene, path, duration: DUR,
    // hurry the approach a little, linger from the first runners to the lane (most of all through the turn inside the flock), ease back to the average for the ring
    pace: paceAt,
    title: lookId === 'moon' ? 'The Lake Takes Flight, by Moonlight' : 'The Lake Takes Flight',
    camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 5600, lookAhead: 30, sway: 1, bank: 1.4 },      // nearThrough: the brine in front of the entry is in the picture seen through the previous ring
    pois,
    // dewash 0: the engine's ring window subtracts the host bloom from the next world without a floor (core/portal.js,
    // next = tex*uGain - wash()), which leaves negative pixels wherever the next world is dark; our bloom is faint anyway
    portal: { shape: 'circle', radius: 7, color: look.portal, glow: 0.8, style: 'ring', revealDistance: 300, dewash: 0 },
    post: {
      exposure: look.exposure, bloom: { strength: 0.2, radius: 0.55, threshold: 1.22 },      // above the near-white horizon: the sky itself never blooms
      grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 },
    },
    ride: 'biplane',
    update,
    dispose() { sky.dispose(); },
  };
}

export default {
  id: 'natron-liftoff',
  name: 'The Lake Takes Flight',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['open', 'air'],
  build,
};
