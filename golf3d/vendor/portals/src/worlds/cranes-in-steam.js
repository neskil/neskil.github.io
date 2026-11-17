// THE RIVER THAT NEVER FREEZES (cranes-in-steam): dawn at twenty-five below on a spring-fed river that smokes
// instead of freezing. We fly it two metres up, wing to wing with whooper swans, in and out of rose steam
// under hoarfrosted willows, to a gravel bar where forty red-crowned cranes dance, and leave with a dozen.
//
// SPACE  world space = the hero's space: the dance bar is centred on the origin, the river runs downstream
//        along +X, y = 0 is the water. Everything else is laid out in "river space" (d = metres along the
//        camera path, s = metres to its right), so banks, trees, reeds, ice and steam follow the bends.
// LIGHT  nothing here uses three.js lights: every material is lit by the hero's shared uniforms (sun, sky,
//        ground) and fogged by one analytic steam function (height fog x drifting patchy noise + five bank volumes).
//        Two real lights exist only so rides and companions added to the scene are lit.
// STEAM  the smoke stands in separate columns along the shelf ice, in a taller column with a rose shoulder and a lilac side over the slack
//        water in the lee of the islet's tail and of each gravel step of the entry reach, and in three low banks set behind the things they light (the gallery
//        behind the islet's tail, the back-lit shoal, the deer), with clear air between, and lies as a thin skin on the water itself (uSkin). Two banks lie
//        across our course and we fly through them: bank A at u 0.32 (the swans turn to blue shapes and come back) and the last bank at
//        u 0.645-0.69, which parts on the dance. They lie on the water in strata, densest at the surface and thin at the eye, their
//        billows along the shores: inside one we still see the river under us and 25 m of it ahead. Every sprite is a soft billow whose
//        top curls over and leans downstream.
// WATER  a near-black body that mirrors the zenith and nothing lower, with no relief shaded on it: long low streamlines along the flow
//        only tip the mirror; between lanes of fine cat's-paw lie long glassy lanes, drawn out along the streamlines, that slide downstream
//        and take the low rose of the sky (the sliding sheen: the only rose on the water; lanes are sines across the streamlines, never
//        a grid of cells); standing ripples only over the gravel bars; a few pinpoint glints of the sun. The frosted willows hang in it as pale columns under the dark line of the bank; rings run out from every
//        leg that stands in it, every sitting swan and each touch of a low swan's wingtip; pans with a slush fringe ride two drift
//        lines, frost flowers stand on the ice. Seen through the previous portal the river is drawn right up to the lens
//        (camera.nearThrough).
// CLOCKS the dancers on the three shoals run on a clock keyed to u (danceT, the seconds of flight at u under pace: the live source's
//        rule). Every other crane (the bar, the roosts, the waders), the fox and the dipper run on world time.
// RIVER  what stands along it by rule, each from a stream of its own: the islet's gravel tail in its lee; roost groups of three to six every
//        35 to 45 m down the first 300 m, the nearest bird 5 to 9 m off our line, a group whose place falls beside a bare gravel bar standing on it (the steps of the entry
//        reach, the islet's tail); every willow at the water's edge of the left bank leaning out over the river, its tips ending 6 m from our
//        line; waders scattered along the riffle and the shallows at the bar; a fox on its round of the right bank's lip.
// BEATS  u 0 the islet alder rose-lit on the axis against a rose plume, a crane family at its foot; threes crossing the sky on the slant;
//        a dipper on the ice rind of the second step | 0.02-0.10 the seven swans, 15 to 42 m ahead, run and lift (the first stands
//        upright, flapping) | 0.10-0.52 seven swans on station 7 to 22 m ahead, a breath at every wingbeat; one that we come abeam of
//        turns its head to us | 0.12 round the islet under the leaning alder, 2 m up as everywhere | 0.25-0.29 SHOAL A on our right,
//        5.8 m off: a leap at 0.25 and 0.27 | 0.30-0.34 through steam bank A | 0.34-0.42 SHOAL B on our left, 5.8 m off, against the
//        rose sky: a pair leaps every 0.02 of u | 0.43 five cranes cross our bow right to left, a wing's length above the eye |
//        0.52-0.55 SHOAL C on our left, 5.8 m off: leaps at 0.52, 0.535, 0.55 | 0.535-0.59 the sea eagle drops from the snag and crosses
//        8-9 m ahead, frost rains | 0.59-0.845 the gaze swings left | 0.60-0.64 nine deer ford right to left, the rearmost 11 m from
//        the lens at 0.62 | 0.645-0.69 the last steam bank, waders in it on our left, and it parts on the bar | 0.655-0.885 the pace
//        eases to 0.55 | 0.66-1 three cranes fly low ahead of us on the right, 15 m ahead at the bar, 9 m at the ring |
//        0.70-0.83 the bar pass: two staggered ranks of pairs 5.4 and 7.5 m off the line, waders 5 m and more off on our right,
//        a rose steam bank behind the cut bank | 0.79-1 the leavers run, lift and hold 7-13 m ahead through the portal
//        (rare: the eagle comes back 0.781-0.911, the roost of 44 goes up 0.79-0.88, strings cross at 0.84, 0.88).
// THE LAWS KEYED TO THE FLIGHT'S SHARE u (round 11: a table; their working is left alone). u is the share of the ROUTE flown, not of the time:
//        the metres of route behind us are u x 658.96 (the path's length; the pace only says how fast u runs). So each law answers OUR PLACE
//        ON THE ROUTE, and each place below is that share in metres, beside the thing of the world it stands at. The constants stay typed
//        as shares of L in the code: retyped as metres they would differ in the last digits of L and move things by fractions of a
//        millimetre on every seed, which is a change to what is drawn, however small; so they are left, and said here.
//        law                     answers (our place on the route)            places, by the thing of the world (metres of route)
//        swans' run and lift     13 to 66 m: the entry reach to the islet    they run 15 to 42 m ahead of us, off the water above the islet (88 m)
//        swans' escort           66 to 343 m: islet to shoal C               on station 7 to 22 m ahead of the lens, wherever we are
//        swans' peel             from 343 m: the head of shoal C             they bank left and climb over the left bank's gallery
//        shoal pairs' dance      the seconds we have flown (pace-weighted)   leaps as we pass shoal A (168-201 m), B (227-288 m), C (344-381 m)
//        the five's course       our place, 529 m of their track a route     they cross our line 298 m down (15 m ahead when we are at 283 m), between shoals B and C
//        eagle's drop            from 353 m: beside shoal C                  off the snag 375 m down, 10 m right of our line; crosses 8-9 m ahead
//        deer's walk             330 to 474 m (it stands still outside)      the ford 418 m down, 20 m above the last steam bank (437 m)
//        low three's clock       metres of route (lowClock, new this round)  they begin 125-155 m ahead while we are at 166-226 m; 15 m ahead at the bar
//        leavers' take-off       from the middle of the bar on (520 m)       they run the bar's lip and lift 7-13 m ahead, through the ring
//        steam's warming, sun    the whole route: rose to gold, 1 degree     nothing placed: a colour and the sun's height (see THE WAY OUT below)
//        steam's thickening      13 to 145 m: entry reach, short of shoal A  nothing placed: the smoke's density rises from 0.55 to the whole
//        (rare) eagle's return, the roost going up, strings at the arch: 515 to 600 m, over the bar and the willow arch.
//        THE WAY OUT: live already lets four things change by the share flown up to the ring and they are left as they were, none added: the
//        sun's height (setSun(el + u)) and the steam's colour (uStB toward gold by u) change over the whole route, the last stretch
//        included; the leavers' take-off and hold through the ring; the low three 9 m ahead at the ring. No double of the ring is drawn.
// GUARDS BY PLACE (round 11; both set at the build from the flown line, the path's own point every 0.25 m of route, searched every 2 m first
//        and then fine; neither takes a random draw nor removes one):
//        G1 the lip sedge of the dance bar: the world hands the hero lineDist (metres from a point to the flown line); a lip tussock any point
//           of which, with its blade's width and its whole sway, would stand within 2.3 m of the line is not made (the part's head).
//        G2 the five that cross our bow: the string is raised, all five alike, by just what keeps every bird of it (wings spread, the whole
//           wingbeat, its whole course) 2.3 m from the line.
// THE STEAM HAS FORM (round 11): every steam sprite is a heap of round lobes with a rim (a column's puff and a bank's head end in an outline;
//        the skins and shore wisps stay soft), lit lobe by lobe: the shoulder toward the sun bright, gold at its thin edge, the side turned
//        away and the hollows between lobes in cool shade; a column's puff at the top of its climb is torn off downstream in shreds. The
//        columns in the lee are thinner and more: 16 puffs three quarters the size and a lesser column of 8 beside each (sprites 24 for
//        14 a column; the summed area of all steam sprites is no more than live's: counted by shots/cis11/b-count.js).
//        READS WHERE THE EYE IS: a lobe's slope is taken across neighbouring pixels of its sprite (screen derivatives of its body), and a
//        sprite faces the eye, as before.
// THE WILLOWS' MIRROR (round 11): the frosted gallery hangs in the water as its own soft shape (the height of the trees along each bank,
//        as before), soft to its top, fainter the further the water lies from its bank, broken sideways by the swells (a tipped facet
//        shows a metre or two of bank further up or down). The fine comb of strands, which drew it as ruled columns of dots, is
//        gone, and the shiver by the finest wavelets is cut to a quarter.
// THE SWANS ARE SOLID WHITE BIRDS (round 11). Why they read as ghosts: (1) their white had no shadow side (the fill as bright as the key), so
//        wing lay on wing and on the pale water without an edge; (2) the sun shone through the whole wing as through paper; (3) the breath
//        of each wingbeat, three big pale puffs, hung in the air behind the bird, between it and us who follow; (4) the willows' mirror
//        stripes lay under them like a smeared double (mended with the mirror). Now: a lit side and a cool shadow side, a darker under side,
//        a dark turn of the form on the shaded hand, a rim in the sun's colour, a blue-grey hem on each flight feather of the hand, hardly
//        any light through the wing, a small faint breath. The stretch of a near bird at the picture's side is the wide lens: left as live.
//        READS WHERE THE EYE IS: a feather's hem is let go where the feather is finer than a few pixels (screen derivative of its count).
// THE LOW SUN (round 11; a second colour on the violet, all of it uniforms set once at the build from the look: WARM, uGold, uSunK, uStGold,
//        uIce, uWarm, uRimCol; the looks without a low sun have them at nought): a gold disc and aureole 5 degrees up on the left bank
//        (fixed bearing, 70 degrees left of down-river), the sun-side hills and the far ridge lowered to a saddle under it (SUN_GAP, by
//        place) so that it stands clear; gold in the steam toward it; a broken path of gold on the water under it (facets of the ripples
//        that tilt the sun into the eye, out to some 75 degrees of its bearing, none where we look steeply down into the water); gold on the ice rims and frost that face it, long blue shadow lanes on
//        the ice; the birds' rim and the through-light of their wings in gold (uRimCol, shared with the part); the key light itself
//        drawn toward gold.
//        READS WHERE THE EYE IS (never where it looks): the water's gold path and the ice's gold rim use the pixel's footprint on the
//        water (screen derivatives of the world place), as the water's ripples and the ice's edge already do. Two terms are shading by
//        the direction from a thing to the eye, the same at every place of the flight, hiding nothing: the water's gold is given back
//        only at a grazing look (lowK), and the frost fur is warm where we stand on the sun's side of it (dot of that direction and the sun's).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeCranes, makePuffs, makeBreath, LIGHT_GLSL } from '../parts/cranes-in-steam.js';

const PAL = ['#0B1620', '#F6F3F7', '#F4B8B0', '#FFC9A0', '#8FA3CF', '#5B5F8C', '#D4202A'];
const DUR = 42, NRIF = 24;           // NRIF: how many gravel riffles the river's shader holds
const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Every look: the hour (or weather) with its sky, key, fill, steam and grade. Colours are sRGB hex x gain.
const LOOKS = {
  dawn: { hero: 'dawn', el: 5, sun: ['#FFC9A0', 1.25], sky: ['#8FA3CF', 0.8], zen: '#5B5F8C', horS: '#F2B49C', horA: '#B49CC0', belt: '#EFA9B0', slate: '#626C98', glow: 1, stars: 0, over: 0,
    stA: ['#8C8CC6', 0.7], stB: ['#F4B8B0', 0.88], scat: 0.42, dens: 1, far: '#5B5F8C', farS: '#C0949C', exposure: 1.0, bloom: 0.34, sat: 1.1, glit: 1, fall: 1, sleep: 0.15, shadow: '#141a36', deep: ['#0B1620', 0.95] },
  blue: { hero: 'blue', el: -3, sun: ['#B79AD0', 0.5], sky: ['#7E90CF', 0.62], zen: '#28336A', horS: '#D98CA4', horA: '#48548C', belt: '#6C6AA6', slate: '#38426E', glow: 0.25, stars: 0.25, over: 0,
    stA: ['#5E63A0', 0.62], stB: ['#A994CC', 0.7], scat: 0.3, dens: 1.1, far: '#3A4478', farS: '#8A6C96', exposure: 1.45, bloom: 0.3, sat: 1.12, glit: 0.5, fall: 0.7, sleep: 0.7, shadow: '#0c1230', deep: ['#0A1226', 0.8] },
  morning: { hero: 'morning', el: 15, sun: ['#FFF0DC', 1.3], sky: ['#8FB0E6', 0.7], zen: '#2B58A6', horS: '#C6DAF0', horA: '#A2BEE4', belt: '#B4C8E8', slate: '#9AB4DC', glow: 0.8, stars: 0, over: 0,
    stA: ['#9FB2DA', 0.8], stB: ['#EEE8EC', 0.84], scat: 0.35, dens: 0.42, far: '#7C98CC', farS: '#B4C6E4', exposure: 0.92, bloom: 0.3, sat: 1.1, glit: 2.2, fall: 3, sleep: 0, shadow: '#0e1c3c', deep: ['#08182C', 1.0] },
  // golden evening: the sun low and amber on the left, teal overhead, a blue-grey east; the cranes come in to roost in strings
  evening: { hero: 'evening', el: 4, sun: ['#FF9648', 1.5], sky: ['#6FA0C4', 0.6], zen: '#2A5676', horS: '#FF8A40', horA: '#7F90B2', belt: '#C0909A', slate: '#566C8C', glow: 1.15, stars: 0, over: 0,
    stA: ['#6C6C92', 0.6], stB: ['#FFC08C', 0.8], scat: 0.36, dens: 0.85, far: '#54688A', farS: '#E89658', exposure: 1.0, bloom: 0.36, sat: 1.18, glit: 1, fall: 1, sleep: 0.1, shadow: '#0c1a2a', deep: ['#08161E', 0.9] },
  moon: { hero: 'moon', el: 24, sun: ['#9FB4E8', 0.55], sky: ['#6E86D0', 0.3], zen: '#070C20', horS: '#1C2A50', horA: '#121C3C', belt: '#18244C', slate: '#0E1632', glow: 0.5, stars: 1, over: 0,
    stA: ['#24345E', 0.6], stB: ['#6C84BC', 0.62], scat: 0.4, dens: 0.9, far: '#101A38', farS: '#1E2C54', exposure: 1.9, bloom: 0.4, sat: 1.05, glit: 1.4, fall: 0.8, sleep: 0.6, shadow: '#050816', deep: ['#050A16', 0.8] },
  snow: { hero: 'dawn', weather: 'snow', el: 9, sun: ['#E6D8D8', 0.5], sky: ['#A6ACC8', 0.95], zen: '#9896A8', horS: '#C4BEC8', horA: '#B0AEBE', belt: '#B0AEBE', slate: '#B0AEBE', glow: 0.2, stars: 0, over: 1,
    stA: ['#8E8EA4', 0.78], stB: ['#C4C0CC', 0.84], scat: 0.1, dens: 1.15, far: '#A4A2B4', farS: '#B8B4C2', exposure: 1.0, bloom: 0.25, sat: 0.96, glit: 0.2, fall: 0.5, sleep: 0.3, shadow: '#20243c', deep: ['#0C1420', 1.0] },
};

// THE SECOND COLOUR (round 11): the low sun as a presence. k = how much of one it is in each look (0 leaves the look as it was): a disc with a
// gold aureole standing clear of the hills, gold in the steam about it, a path of gold on the water under it, gold rims on what stands against
// it. gold = that colour (sRGB hex); disc = the disc's own gain. All of it is uniforms set at the build.
const WARM = {
  dawn: { k: 1, gold: '#FFAE62', disc: 1 }, evening: { k: 0.8, gold: '#FF9A48', disc: 1 }, morning: { k: 0.4, gold: '#FFDCAE', disc: 0.7 },
  blue: { k: 0, gold: '#B79AD0', disc: 0 }, moon: { k: 0, gold: '#9FB4E8', disc: 0 }, snow: { k: 0, gold: '#E6D8D8', disc: 0 },
};

// ---------------------------------------------------------------------------------------------------------
// STEAM: one analytic fog function for every material. Height fog over the water (scale height uStP.y) times
// slow drifting noise, plus five soft ellipsoid banks (integrated exactly along the view ray with erf), plus
// distance haze. Lit from the side and through: lilac cores, rose sunward, forward scatter pow 4. The last two
// banks lie across the course: they are densest on the water and thin at eye height, and they hang in strata.
// ---------------------------------------------------------------------------------------------------------
const STEAM_FN = /* glsl */`
uniform vec3 uStSun; uniform vec3 uStA; uniform vec3 uStB; uniform vec3 uStScat; uniform vec3 uStFar; uniform vec3 uStFarS;
uniform vec4 uStP; uniform vec4 uStBk[5]; uniform vec3 uStBr[5]; uniform vec3 uStGold;      // uStGold: the gold the smoke takes close about the sun
float stH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float stN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(stH(i), stH(i + vec2(1.0, 0.0)), f.x), mix(stH(i + vec2(0.0, 1.0)), stH(i + vec2(1.0, 1.0)), f.x), f.y); }
float stErf(float x){ float a = abs(x); float t = 1.0 / (1.0 + 0.47047 * a);
  float y = 1.0 - t * (0.3480242 + t * (-0.0958798 + t * 0.7478556)) * exp(-a * a); return x < 0.0 ? -y : y; }
float stBank(vec3 o, vec3 dir, float d, vec4 c, vec3 ir){
  vec3 oc = (o - c.xyz) * ir; vec3 dr = dir * ir;
  float a = max(dot(dr, dr), 1e-6); float b = dot(oc, dr); float sa = sqrt(a);
  float ex = exp(min(b * b / a - dot(oc, oc), 0.0));
  return c.w * ex * 0.8862269 / sa * (stErf(sa * d + b / sa) - stErf(b / sa));
}
// steam glows, but under white: held below about 0.86 so the frosted reeds and twigs in front of it keep their lines and only rims bloom
vec3 stHold(vec3 c){ float m = max(c.r, max(c.g, c.b)); return m > 0.62 ? c * ((0.62 + 0.24 * (1.0 - exp(-(m - 0.62) / 0.24))) / m) : c; }
vec3 steamApply(vec3 c, vec3 wp, float farK){
  vec3 rd = wp - cameraPosition; float d = length(rd); vec3 dir = rd / max(d, 1e-3);
  float H = uStP.y; float y0 = clamp(abs(cameraPosition.y), 0.0, 200.0); float y1 = clamp(wp.y, -1.0, 400.0);
  float e0 = exp(-y0 / H); float e1 = exp(-y1 / H); float dy = y1 - y0;
  float mean = abs(dy) > 0.05 ? H * (e0 - e1) / dy : e0;
  float dd = min(d, 240.0);
  vec2 q = cameraPosition.xz + dir.xz * min(dd, 80.0) * 0.55;
  float n = 0.65 * stN(q * 0.045 + vec2(-uStP.w * 0.027, 0.0)) + 0.35 * stN(q * 0.13 + vec2(-uStP.w * 0.06, uStP.w * 0.013));
  float pat = smoothstep(0.42, 0.78, n);                         // the smoke stands in separate columns: clear air between them
  float tau = uStP.x * dd * smoothstep(6.0, 60.0, dd) * mean * (0.08 + 1.9 * pat * pat);
  float tb = stBank(cameraPosition, dir, d, uStBk[0], uStBr[0]) + stBank(cameraPosition, dir, d, uStBk[1], uStBr[1]) + stBank(cameraPosition, dir, d, uStBk[2], uStBr[2]);
  // the two banks we fly through hang in layers: sheets a metre or two thick, tens of metres long, sliding downstream, thick and thin by turns
  vec3 ps = cameraPosition + dir * min(d, 18.0);
  float strat = 0.6 * stN(vec2((ps.x + 0.6 * ps.z) * 0.07 - uStP.w * 0.05, ps.y * 0.85)) + 0.4 * stN(vec2((ps.x - 0.5 * ps.z) * 0.19 - uStP.w * 0.12, ps.y * 2.1 + 5.0));
  float tc = (stBank(cameraPosition, dir, d, uStBk[3], uStBr[3]) + stBank(cameraPosition, dir, d, uStBk[4], uStBr[4])) * (0.25 + 1.5 * strat);
  tb += tc;
  float fs = max(dot(dir, uStSun), 0.0); fs *= fs; fs *= fs;
  vec2 sx = uStSun.xz / max(length(uStSun.xz), 1e-3);
  float side = 0.5 + 0.5 * dot(dir.xz, sx);
  float fg = fs * fs; fg *= fg; float fc0 = fg * fg; fc0 *= fc0; fc0 *= fc0;      // (the gold lies close about the sun: the sixteenth power of the cosine; the sun's own place in the smoke: the 128th)
  vec3 sc = stHold(mix(uStA, uStB, clamp(0.2 + 0.75 * side - 0.3 * smoothstep(0.5, 2.4, tau + tb), 0.0, 1.0)) + uStScat * fs + uStGold * (fg + 0.5 * fs)) + uStGold * 1.4 * fc0;
  sc *= 1.0 - 0.3 * (1.0 - exp(-tc)) * (1.0 - side) * (1.0 - smoothstep(-0.05, 0.3, dir.y));           // inside a bank the smoke low on the shaded hand is in its own shadow: lilac-blue, darker than the lit side
  vec3 fc = mix(uStFar, uStFarS, side * side);
  c = mix(fc, c, exp(-uStP.z * d * farK));
  return mix(sc, c, exp(-(tau + tb)));
}`;
const STEAM_PARS_F = 'varying vec3 vStWp;\n' + STEAM_FN;

// Give any ShaderMaterial that uses the three.js fog chunks (the hero's, the kit's creatures) the steam instead.
function steamPatch(m, U) {
  if (!m || !m.isShaderMaterial || m.userData.steam) return;
  if (!m.fragmentShader.includes('#include <fog_fragment>') || !m.vertexShader.includes('#include <fog_vertex>')) return;
  m.vertexShader = m.vertexShader.replace('#include <fog_pars_vertex>', '#include <fog_pars_vertex>\nvarying vec3 vStWp;')
    .replace('#include <fog_vertex>', '#include <fog_vertex>\n  vStWp = cameraPosition + mvPosition.xyz * mat3(viewMatrix);');
  m.fragmentShader = m.fragmentShader.replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\n' + STEAM_PARS_F)
    .replace('#include <fog_fragment>', 'gl_FragColor.rgb = steamApply(gl_FragColor.rgb, vStWp, 1.0);');
  Object.assign(m.uniforms, U); m.userData.steam = true; m.needsUpdate = true;
}

// ---------------------------------------------------------------------------------------------------------
// SKY: zenith to horizon, peach-rose on the sun side, the Belt of Venus over the earth's shadow opposite,
// a soft veiled sun (never a hard disc), stars for the moonlit night, and the steam laid over its foot.
// ---------------------------------------------------------------------------------------------------------
const SKY_VERT = /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_GLSL = /* glsl */`
uniform vec3 uZen; uniform vec3 uHorS; uniform vec3 uHorA; uniform vec3 uBelt; uniform vec3 uSlate; uniform vec3 uSunC; uniform vec4 uSkyK;   // glow, stars, overcast, time
uniform vec3 uGold; uniform vec4 uSunK;        // the second colour, and (the sun's disc, its aureole, the gold on the horizon under it, the path on the water)
vec3 skyBase(vec3 dir, vec3 sun){
  float h = max(dir.y, 0.0);
  vec2 sx = sun.xz / max(length(sun.xz), 1e-3); float az = dot(dir.xz / max(length(dir.xz), 1e-3), sx);
  vec3 hor = mix(uHorA, uHorS, smoothstep(-0.35, 1.0, az));
  float t = 1.0 - h; float t2 = t * t;
  vec3 c = mix(uZen, hor, t2 * t2 * mix(t, 1.0, 0.5));
  float anti = (1.0 - smoothstep(-0.85, 0.15, az)) * (1.0 - uSkyK.z);
  float bz = (h - 0.12) / 0.07; c = mix(c, uBelt, anti * 0.75 * exp(-bz * bz));
  c = mix(c, uSlate, anti * 0.85 * (1.0 - smoothstep(0.0, 0.085, h)));
  return c;
}`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir; uniform vec3 uSunDir; uniform vec3 uDeep; uniform vec3 uSky;
${SKY_GLSL}
${STEAM_FN}
float skH(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
void main(){
  vec3 dir = normalize(vDir);
  vec3 c = skyBase(dir, uSunDir);
  float cs = max(dot(dir, uSunDir), 0.0);
  float c2 = cs * cs; float c8 = c2 * c2; c8 *= c8; float c64 = c8 * c8; c64 *= c64; c64 *= c64; float c512 = c64 * c64; c512 *= c512; c512 *= c512;
  c += uSunC * uSkyK.x * (0.9 * c512 + 0.26 * c64 + 0.11 * c8 * (1.0 - 0.6 * uSkyK.z));
  // the sun itself: a disc soft at the limb (1.0 to 1.4 degrees from its centre) in a gold aureole, and a band of gold lying on the horizon under it
  float limb = 1.0 - smoothstep(1.5e-4, 3.0e-4, 1.0 - cs); float c2k = c512 * c512; c2k *= c2k;
  vec2 sxs = uSunDir.xz / max(length(uSunDir.xz), 1e-3); float azs = max(dot(dir.xz / max(length(dir.xz), 1e-3), sxs), 0.0); float az8 = azs * azs; az8 *= az8; az8 *= az8; float az3 = azs * azs * azs;
  c *= mix(vec3(1.0), vec3(1.1, 0.8, 0.52), uSunK.y * (0.75 * c8 + 0.5 * az3 * exp(-max(dir.y, 0.0) / 0.14)));          // the air about a low sun takes the blue out of the sky behind it
  c += uGold * (uSunK.x * (4.0 * limb + 0.9 * c2k) + uSunK.y * (0.5 * c64 * c64 + 0.2 * c8 * c8) + uSunK.z * (0.3 * az8 + 0.22 * az3) * exp(-max(dir.y, 0.0) / 0.07));
  if (uSkyK.y > 0.01) {
    vec3 g = dir * 150.0; vec3 id = floor(g); float hs = skH(id);
    float st = step(0.975, hs) * (1.0 - smoothstep(0.1, 0.42, length(fract(g) - 0.5))) * (0.5 + 0.5 * sin(uSkyK.w * (0.6 + 2.0 * skH(id + 3.0)) + hs * 40.0));
    c += vec3(0.7, 0.8, 1.0) * st * uSkyK.y * smoothstep(0.02, 0.3, dir.y) * 1.4;
  }
  float dn = max(-dir.y, 0.0);
  if (dn > 0.0) {                                               // the river running on under everything, 2 m below the eye
    float fr = 1.0 - dn; float F = 0.06 + 0.9 * fr * fr * fr;
    c = uDeep + (uZen * 0.09 + uSky * 0.012 + uHorS * 0.012) * (0.5 + 0.5 * dn) + mix(c, uZen, 0.3) * F;
    c = steamApply(c, cameraPosition + dir * min(2.0 / max(dn, 1e-3), 2500.0), 1.0);
  } else c = steamApply(c, cameraPosition + dir * 2500.0, 0.0);
  gl_FragColor = vec4(c, 1.0);
}`;

// ---------------------------------------------------------------------------------------------------------
// LAND: snow meadows, cut banks, far wooded hills (also drawn instanced for the snow-capped sedge tussocks)
// ---------------------------------------------------------------------------------------------------------
const LAND_VERT = /* glsl */`
varying vec3 vWp; varying vec3 vN;
void main(){
  vec4 p = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 wp = modelMatrix * p; vWp = wp.xyz; vN = mat3(modelMatrix) * n;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LAND_FRAG = /* glsl */`
varying vec3 vWp; varying vec3 vN; uniform float uTime; uniform vec4 uLand; uniform vec3 uShadowC;      // uLand = (thaw, shadow strength, sparkle, -)
${LIGHT_GLSL}
${STEAM_FN}
// river shingle: one rounded stone per cell. Returns (distance to the nearest stone's centre, that stone's own tone)
vec2 lcob(vec2 p){
  vec2 ip = floor(p), fp = fract(p); float best = 9.0; float tone = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 id = ip + g;
    vec2 r = g + vec2(h2(id), h2(id + 17.3)) * 0.7 + 0.15 - fp;
    float d = dot(r, r); if (d < best) { best = d; tone = h2(id + 31.7); }
  }
  return vec2(sqrt(best), tone);
}
void main(){
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vWp; float dist = length(Vv); Vv /= max(dist, 1e-4);
  float fwL = 1.5 * sqrt(length(dFdx(vWp.xz)) * length(dFdy(vWp.xz)));
  float steep = 1.0 - N.y;
  float n1 = vnoise(vWp.xz * 0.35); float n2 = vnoise(vWp.xz * 2.3 + 11.0); float n3 = vnoise(vWp.xz * 9.0);
  vec3 SNOW = vec3(0.60, 0.61, 0.645) * (0.93 + 0.1 * n1);
  // wind-packed snow: fine relief in the lighting, fading with distance
  float nearK = 1.0 - smoothstep(25.0, 90.0, dist);
  N = normalize(N + vec3(n2 - 0.5, 0.0, n3 - 0.5) * 0.35 * nearK + vec3(vnoise(vWp.xz * 0.9 + 3.0) - 0.5, 0.0, n1 - 0.5) * 0.25);
  vec3 alb = SNOW;
  // thaw: buff grass and dark earth showing through
  float bare = uLand.x * smoothstep(0.5, 0.62, 0.6 * n1 + 0.4 * vnoise(vWp.xz * 0.11 + 5.0)) * (1.0 - smoothstep(30.0, 90.0, vWp.y));
  alb = mix(alb, vec3(0.24, 0.19, 0.10) * (0.6 + 0.8 * n3), bare);
  // cut bank: frozen earth in strata, roots, frost creeping down
  float bank = smoothstep(0.3, 0.6, steep) * (1.0 - smoothstep(6.0, 14.0, vWp.y));
  float st = vnoise(vec2(vWp.x * 0.6 + vWp.z * 0.3, vWp.y * 8.0)); float cl = vnoise(vWp.xy * 3.1 + vWp.z * 2.3);
  vec3 earth = vec3(0.040, 0.037, 0.044) * (0.5 + 0.9 * st * cl + 0.4 * cl);
  earth = mix(earth, SNOW, smoothstep(0.45, 0.8, 0.5 * n3 + 0.3 * st + 0.25 * smoothstep(0.8, 2.6, vWp.y)));
  alb = mix(alb, earth, bank);
  float shoreK = (1.0 - smoothstep(0.2, 0.4, vWp.y + 0.3 * (n1 - 0.5) + 0.1 * (n2 - 0.5))) * (1.0 - bank) * nearK;                 // the foot of every bar and islet: wet shingle, rimed, with a rind of ice at the waterline
  float peb = vnoise(vWp.xz * 7.0) * vnoise(vWp.xz * 17.0 + 3.0);
  vec3 shing = mix(vec3(0.05, 0.05, 0.058), vec3(0.21, 0.2, 0.2), smoothstep(0.1, 0.5, peb)) * (0.7 + 0.6 * n3);
  if (shoreK > 0.01) {                                             // close to, the shingle is stones: cobbles the size of a fist among loaves, dark wet joints, rime on the crowns of the dry ones
    float kA = 1.0 - smoothstep(0.45, 1.0, fwL * 2.6); float kB = 1.0 - smoothstep(0.45, 1.0, fwL * 8.0);
    vec2 cA = lcob(vWp.xz * 2.6 + 5.0); vec2 cB = lcob(vWp.xz * 8.0);
    float stA = (1.0 - smoothstep(0.36, 0.66, cA.x)); float stB = (1.0 - smoothstep(0.3, 0.62, cB.x));
    vec3 stone = mix(vec3(0.07, 0.072, 0.085), vec3(0.25, 0.235, 0.215), 0.25 + 0.75 * cB.y) * mix(vec3(0.85, 0.95, 1.12), vec3(1.12, 1.0, 0.86), cA.y);
    vec3 det = mix(vec3(0.022, 0.022, 0.028), stone, mix(1.0, stB, kB)) * mix(1.0, 0.55 + 0.6 * stA * (0.6 + 0.8 * cA.y), kA);
    float dry = smoothstep(0.1, 0.24, vWp.y);
    det = mix(det, vec3(0.5, 0.51, 0.55), dry * kB * (1.0 - smoothstep(0.15, 0.4, cB.x)) * step(0.45, cB.y) * 0.75);
    shing = mix(shing, det, max(kA, kB));
  }
  alb = mix(alb, shing, shoreK * 0.85);
  alb = mix(alb, vec3(0.34, 0.42, 0.52), (1.0 - smoothstep(0.02, 0.07, abs(vWp.y - 0.03))) * 0.7 * nearK);
  // far hills: dark spruce and bare oak as blue-grey texture between snowfields
  float hill = smoothstep(12.0, 40.0, vWp.y);
  float wood = smoothstep(0.38, 0.6, 0.55 * vnoise(vWp.xz * 0.012 + 7.0) + 0.3 * vnoise(vWp.xz * 0.05) + 0.15 * vnoise(vWp.xz * 0.21) + 0.25 * steep);
  alb = mix(alb, mix(vec3(0.035, 0.05, 0.07), vec3(0.16, 0.15, 0.17), vnoise(vWp.xz * 0.03 + 20.0)) * (0.7 + 0.6 * vnoise(vWp.xz * 0.4)), hill * wood);
  // long blue tree shadows raking across the snow, sliding as the sun climbs
  vec2 sx = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  vec2 sp = vec2(dot(vWp.xz, vec2(-sx.y, sx.x)), dot(vWp.xz, sx));
  float sh = smoothstep(0.40, 0.62, 0.7 * vnoise(vec2(sp.x * 0.16 + uTime * 0.012, sp.y * 0.011)) + 0.3 * vnoise(vec2(sp.x * 0.55, sp.y * 0.03 + 4.0)));
  sh *= uLand.y * (1.0 - hill) * (1.0 - bank);
  float ndl = dot(N, uSunDir); float wrap = clamp((ndl + 0.3) / 1.3, 0.0, 1.0);
  vec3 c = alb * (uSunCol * wrap * 1.5 * (1.0 - sh) + mix(uGround, uSky, N.y * 0.5 + 0.5) * (1.0 - 0.25 * sh));
  c = mix(c, c * 0.6 + uShadowC * 0.25, sh * 0.5);
  float gl = step(0.988, h2(floor(vWp.xz * 55.0))) * (1.0 - bank) * (1.0 - bare) * nearK * (1.0 - sh);
  c += uSunCol * gl * uLand.z * 1.5 * (0.5 + 0.5 * sin(dot(Vv, vec3(41.0, 13.0, 29.0)) + vWp.x * 3.0));
  gl_FragColor = vec4(steamApply(c, vWp, 1.0), 1.0);
}`;

// ---------------------------------------------------------------------------------------------------------
// RIVER: indigo-black water. Near the lens it mirrors almost nothing; toward the horizon the fresnel mirror
// takes over. Slicks slide downstream carrying the rose of the sun-side sky, the frosted gallery stands
// mirrored along both banks (a height map of the real trees, looked up where the mirrored ray meets the
// bank), gravel shows through the shallows, and shelf ice and drifting pans have thickness: the top surface
// is found by parallax, so the side facing us shows a wall of blue ice over a dark waterline.
// aF = (d along the path, s to its right, metres to the left bank, metres to the right bank)  aT = flow direction
// ---------------------------------------------------------------------------------------------------------
const WATER_VERT = /* glsl */`
attribute vec4 aF; attribute vec2 aT; varying vec3 vWp; varying vec4 vF; varying vec2 vT;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz; vF = aF; vT = aT; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WATER_FRAG = /* glsl */`
varying vec3 vWp; varying vec4 vF; varying vec2 vT;
uniform float uTime; uniform vec4 uIslet[10]; uniform vec2 uIsletDir[10]; uniform vec4 uRif[${NRIF}]; uniform vec4 uWat; uniform vec3 uDeep;     // uRif = a gravel riffle in river space (d, s, half length, half width)
//     // uWat = (shelf ice, pans, sheen, gallery mirror)
uniform sampler2D uGal; uniform vec2 uGalR; uniform vec4 uBar; uniform vec3 uFrostL; uniform vec3 uFrostR; uniform vec4 uSkin; uniform vec4 uIce;      // uIce = (the long shadows on the ice, the gold on it, -, -)          // uGalR = (first d, 1 / span)  uBar = (half length, front z, -, -)
${LIGHT_GLSL}
${SKY_GLSL}
${STEAM_FN}
// the streamlines: long low swells drawn out along the current (x down the flow, y across it), a metre or two apart and tens of metres
// long, sliding downstream. k = how much of each size one pixel can still hold. They are a few millimetres high: they only tip the mirror.
float wH(vec2 p, vec2 k){
  float s1 = vnoise(vec2(p.x * 0.05 - uTime * 0.06, p.y * 0.9 + 0.4 * sin(p.x * 0.045)));
  float s2 = vnoise(vec2(p.x * 0.14 - uTime * 0.17 + 7.0, p.y * 2.3 + 3.0));
  return 0.62 * k.x * s1 + 0.3 * k.y * s2;
}
// the cat's-paw: fine wavelets that ride with the current inside a lane of ruffled water. Three trains of crests cross one another aslant,
// each bent by a slow wave of its own, so the crests are short and no two alike: no train is read from a grid, and the wavelets never
// fall into cells or into ruled bars
float wFine(vec2 p){
  float a = p.x * 9.3 + p.y * 1.9 - uTime * 11.2 + 1.8 * sin(p.y * 2.3 + 0.7 * sin(p.x * 1.1));
  float b = p.x * 6.1 + p.y * 4.3 - uTime * 7.3 + 1.5 * sin(p.y * 1.1 - p.x * 0.6 + 2.0);
  float c = p.x * 7.7 - p.y * 5.2 - uTime * 9.2 + 1.4 * sin(p.x * 0.8 + p.y * 0.9);
  return 0.5 + 0.19 * sin(a) + 0.17 * sin(b) + 0.15 * sin(c);
}
// standing ripples over a gravel bar: short crests across the flow, in patches, that keep their place and only shiver
float wStand(vec2 p){ return sin(p.x * 7.5 + 9.0 * vnoise(p * vec2(0.5, 1.3) + 3.0) + 0.5 * sin(uTime * 1.9 + p.y * 2.1)) * smoothstep(0.35, 0.7, 0.5 + 0.5 * sin(p.y * 2.1 + 3.0 + 1.5 * sin(p.x * 0.6))); }
float isD(vec4 I, vec2 D){ vec2 il = vWp.xz - I.xy; il = vec2(il.x * D.x + il.y * D.y, -il.x * D.y + il.y * D.x);       // metres to the edge of a long ellipse, true off its tips as well as off its sides
  float k0 = length(il / I.zw); float k1 = length(il / (I.zw * I.zw)); return k0 < 0.08 ? -I.w : k0 * (k0 - 1.0) / max(k1, 1e-4); }
// one pan per cell, turning as it drifts. q = river coords moving with the flow; sy, shore, sgn give the distance
// to the shore at the CELL centre, so a pan is whole or absent, never cut. Returns the signed distance to its edge in metres.
float panCell(vec2 q, float cell, float seed, float rmin, float rmax, float dens, float sy, float shore, float sgn, float minS, float laneK){
  vec2 pp = q / cell; vec2 ic = floor(pp); vec2 id = ic + seed; vec2 pf = fract(pp) - 0.5;
  float ph = stH(id); float r = mix(rmin, rmax, stH(id + 9.1));
  vec2 jit = (vec2(stH(id + 1.7), stH(id + 5.3)) - 0.5) * (0.8 - 2.0 * r);
  vec2 pj = pf - jit;
  float shoreC = shore + sgn * ((ic.y + 0.5 + jit.y) * cell - sy);
  float cy = (ic.y + 0.5 + jit.y) * cell;
  float ln = (cy - 2.3 * sin(ic.x * cell * 0.043 + 1.7)) / 2.4;                       // the drift line: pans ride one meandering streamline down the middle
  float ln2 = (cy - 7.7 - 1.2 * sin(ic.x * cell * 0.031 + 0.4)) / 1.5;                 // ... and a second line on our right hand
  float k = max((0.26 + 0.74 * (1.0 - smoothstep(2.5, 12.0, shoreC))) * (0.2 + 0.8 * smoothstep(0.3, 0.62, stN(ic * cell * vec2(0.03, 0.09) + seed))), laneK * max(exp(-ln * ln), 0.9 * exp(-ln2 * ln2)));
  float has = step(ph, dens * k) * step(r * cell * 1.35 + 0.5, shoreC) * step(minS, abs(cy));
  float rot = ph * 40.0 + uTime * (ph - 0.5) * 0.45; float ca = cos(rot), sa = sin(rot); pj = vec2(pj.x * ca - pj.y * sa, pj.x * sa + pj.y * ca);
  float pa = atan(pj.y + 1e-5, pj.x);
  float rr = r * (1.0 + 0.11 * sin(pa * 3.0 + ph * 37.0) + 0.06 * sin(pa * 5.0 + ph * 11.0) + 0.03 * sin(pa * 8.0 + ph * 61.0));
  float dd = (length(pj) - rr) * cell; float m = 0.04 * cell;                  // outside the pan the distance runs away to infinity before the cell's edge, so no soft edge, fringe or far-off blur can show the cell's square
  dd = dd > 0.0 ? dd / max(1.0 - dd / m, 0.02) : dd;
  return mix(9.0, dd, has);
}
float panSD(vec2 q, float sy, float shore, float sgn, float crumbs, out float fr){      // fr: the slush fringe, its width cut to each cell so it never shows the cell's square
  float d = panCell(q, 6.2, 0.0, 0.2, 0.3, uWat.y * 0.55, sy, shore, sgn, 3.8, 0.85);
  fr = 1.0 - smoothstep(0.0, 0.7, d);
  float d2 = panCell(q + vec2(1.3, 0.0), 2.7, 31.0, 0.15, 0.3, uWat.y * 0.8, sy, shore, sgn, 0.0, 0.92);
  fr = max(fr, 1.0 - smoothstep(0.0, 0.4, d2)); d = min(d, d2);
  d2 = mix(9.0, panCell(q + vec2(0.4, 0.0), 0.95, 77.0, 0.15, 0.3, uWat.y * 0.7, sy, shore, sgn, 0.0, 0.2), crumbs);
  fr = max(fr, 1.0 - smoothstep(0.0, 0.2, d2)); d = min(d, d2);
  return d;
}
// the river bed: one cobble per cell with dark wet joints. Returns (distance to the nearest stone's centre, that stone's own tone)
vec2 cobble(vec2 p){
  vec2 ip = floor(p), fp = fract(p); float best = 9.0; float tone = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 id = ip + g;
    vec2 r = g + vec2(stH(id), stH(id + 17.3)) * 0.7 + 0.15 - fp; r.y *= 1.0 + 0.5 * stH(id + 5.1);
    float d = dot(r, r); if (d < best) { best = d; tone = stH(id + 31.7); }
  }
  return vec2(sqrt(best), tone);
}
void main(){
  vec3 Vv = cameraPosition - vWp; float dist = length(Vv); Vv /= max(dist, 1e-4);
  float fwp = length(fwidth(vWp.xz));
  float fwr = 1.5 * sqrt(length(dFdx(vWp.xz)) * length(dFdy(vWp.xz)));
  vec2 T = vT / max(length(vT), 1e-4); vec2 Nr = vec2(-T.y, T.x);
  float di = 99.0; for (int i = 0; i < 10; i++) di = min(di, isD(uIslet[i], uIsletDir[i]));
  float shoreB = min(vF.z, vF.w); float shore = min(shoreB, di);
  float dBar = length(max(vec2(abs(vWp.x + 4.0) - uBar.x, vWp.z - uBar.y), 0.0));
  float shal = max((1.0 - smoothstep(0.4, 3.8, shore)), 0.7 * (1.0 - smoothstep(0.8, 4.5, dBar)) * step(vWp.z, 30.0));
  vec2 q = vF.xy;
  // riffles: gravel shallows in mid-channel, their edges eaten by the current
  float rif = 0.0; for (int i = 0; i < ${NRIF}; i++) { vec2 e = (q - uRif[i].xy) / uRif[i].zw; rif = max(rif, 1.0 - dot(e, e)); }
  rif = smoothstep(0.05, 0.6, rif + 0.4 * (vnoise(q * vec2(0.3, 1.0)) - 0.5) + 0.16 * (vnoise(q * vec2(1.3, 3.1)) - 0.5)) * step(0.6, min(di, dBar));
  // THE SKIN OF THE RIVER: a near-black body that mirrors the zenith and nothing lower, with no relief shaded on it. What moves on it:
  // long low streamlines drawn out along the current (they only tip the mirror, so they show as faint threads toward the horizon); long
  // glassy lanes that slide downstream and carry the rose of the low sky (the sheen: the only rose on the water); a fine cat's-paw in
  // lanes of its own; standing ripples over the gravel bars and nowhere else; a few pinpoint glints of the sun.
  // Both the cat's-paw and the sheen lie in LANES ALONG THE STREAMLINES: a streamline is a line of constant s (metres across the river) that
  // meanders a little down the reach (stream). A lane is a soft wave across the streamlines; nothing here is read from a grid of cells, so
  // no cell, square or seam can show: every edge is a sine's flank, a metre wide or more.
  float stream = q.y + 1.9 * sin(q.x * 0.019 + 0.7) + 0.8 * sin(q.x * 0.047 - uTime * 0.035 + 2.0);
  float laneK = 1.0 - smoothstep(1.2, 3.0, abs(dFdx(q.y)) + abs(dFdy(q.y)));                 // a lane narrower than a few pixels is let go into its mean
  float paw = mix(0.5, smoothstep(0.3, 0.7, 0.5 + 0.5 * sin(stream * 0.52 + 2.3 + 1.2 * sin(q.x * 0.023 - uTime * 0.028))), laneK);
  float bar = max(rif, shal);
  // the sheen: glassy lanes 3 m wide in their heart and 7 m apart, each feathering into the indigo over a metre; down the river a lane
  // swells and dies away over some seventy metres, each lane at its own place, and the whole slides downstream at the river's 1.2 m a second
  float lanes = 0.5 + 0.5 * sin(stream * 0.9 + 0.9 * sin(q.x * 0.031 - uTime * 0.037));
  float along = 0.5 + 0.5 * sin(q.x * 0.045 - uTime * 0.054 + 1.4 * sin(stream * 0.37 + 4.0) + 0.6 * sin(q.x * 0.013 + 1.0));
  float slick = mix(0.3, smoothstep(0.3, 0.8, lanes * (0.3 + 0.7 * along)), laneK) * (1.0 - bar);
  // each size is faded out before it is finer than the pixel that draws it (along the flow and across it)
  vec2 dqx = dFdx(q); vec2 dqy = dFdy(q); vec2 fq = abs(dqx) + abs(dqy);
  vec2 kk = vec2(1.0 - smoothstep(0.5, 1.4, fq.y * 0.9), 1.0 - smoothstep(0.4, 1.1, fq.y * 2.3));
  float kF = (1.0 - smoothstep(0.3, 0.9, fq.x * 1.9)) * (1.0 - smoothstep(0.3, 0.9, fq.y * 3.4));
  float kS = (1.0 - smoothstep(0.3, 0.9, fq.x * 1.1)) * (1.0 - smoothstep(0.3, 0.9, fq.y * 0.6));
  float aF = 0.034 * kF * paw * (1.0 - 0.7 * slick) * (1.0 - bar); float aS = 0.018 * kS * bar;
  float e = 0.035; vec2 qx = q + vec2(e, 0.0); vec2 qz = q + vec2(0.0, e);
  float f0 = wFine(q); vec2 gF = vec2(f0 - wFine(qx), f0 - wFine(qz)) / e;
  float h0 = 0.085 * wH(q, kk) + aS * wStand(q);
  float hx = 0.085 * wH(qx, kk) + aS * wStand(qx);
  float hz = 0.085 * wH(qz, kk) + aS * wStand(qz);
  vec2 gs = (vec2(h0 - hx, h0 - hz) / e + aF * gF) * (1.0 - 0.5 * smoothstep(40.0, 150.0, dist));
  vec3 N = normalize(vec3(T.x * gs.x + Nr.x * gs.y, 1.0, T.y * gs.x + Nr.y * gs.y));
  // whichever way a facet is tipped, the ray it gives back is lifted well clear of the horizon: the mirror holds the zenith alone
  vec3 R = reflect(-Vv, N); R.y = max(abs(R.y), 0.62); R = normalize(R);
  float ndv = max(dot(N, Vv), 0.0); float fr = 1.0 - ndv; float fr2 = fr * fr; float F = 0.04 + 0.96 * fr2 * fr2;
  vec3 env = skyBase(R, uSunDir) * 0.92;
  // the frosted gallery mirrored toward each bank: every willow hangs in the water as a pale column under the dark line of its bank,
  // shivered a little by the finest wavelets (round 11: a quarter of what it was, 0.004 for 0.016; the full shiver drew ruled columns of dots)
  vec2 gq = gs + 0.004 * kF * gF; vec3 Ng = normalize(vec3(T.x * gq.x + Nr.x * gq.y, 1.0, T.y * gq.x + Nr.y * gq.y));
  vec3 Rg = reflect(-Vv, Ng); Rg.y = abs(Rg.y) + 0.015; Rg = normalize(Rg);
  float te = Rg.y / max(length(Rg.xz), 1e-3);                    // how steeply the mirrored ray climbs: the ripples shiver it, so the mirrored tops are ragged
  // WHICH metre of the bank the mirror shows is taken from the level river, not from the tipped facet: a facet tipped a few degrees would
  // throw its ray a hundred metres up or down the bank, and the swells would deal the trees out over mid-river as blocks. So each willow
  // hangs where a level river would hang it; its height shivers, and (round 11, below) a swell slides it a metre or two along the bank. Dead ahead down the stream the ray meets no bank: no mirror there.
  vec2 Rf = -Vv.xz; float rl = max(length(Rf), 1e-3);
  float Ra = dot(Rf, T) / rl; float Rc = dot(Rf, Nr) / rl;
  float lat = Rc > 0.0 ? vF.w : vF.z;
  float hit = max(lat, 0.5) / max(abs(Rc), 0.07);
  // (round 11) ... and the ripples break the hanging shape SIDEWAYS: a facet tipped along the stream shows a metre or two of bank further up or
  // down (held to 2.4 m: never a tree dealt out over mid-river), so each willow's mirror is cut into level slices that slide past one another
  float dh = vF.x + Ra * hit + clamp(3.2 * gs.x * hit, -2.4, 2.4);
  float gu = (dh - uGalR.x) * uGalR.y; float gv = Rc > 0.0 ? 0.75 : 0.25; float du = (0.45 + 0.02 * hit) * uGalR.y;
  vec4 gt = 0.5 * texture2D(uGal, vec2(gu, gv)) + 0.25 * (texture2D(uGal, vec2(gu - du, gv)) + texture2D(uGal, vec2(gu + du, gv)));
  float topT = (gt.r * 22.0 + 1.0) / (hit + 3.0);
  // the strands of the mirror: how tall and how pale it stands changes only ALONG the bank it mirrors (sines of dh, the metre of bank the
  // mirrored ray meets), so on the water it is combed into lanes that run toward that bank; nothing in it is a cell
  float strand = 0.5 + 0.14 * sin(dh * 0.83 + 1.7 * sin(dh * 0.31 + 4.0));           // (round 11: slow, the breadth of a tree; the fine comb drew ruled stripes)
  float crown = 0.84 + 0.1 * sin(dh * 0.71 + 1.3 * sin(dh * 0.27));
  // (toward mid-river the mirrored tops of the two galleries meet: each top feathers out over a long reach of water, combed into strands by
  // the ripples, so the meeting is a soft fringe of long lanes drawn toward us, never a row of blocks)
  float gal = (1.0 - smoothstep(topT * 0.1, topT * (1.0 + 0.4 * strand), te)) * smoothstep(0.03, 0.16, gt.r) * uWat.w * smoothstep(0.012, 0.07, abs(Rc)) * mix(1.0, 0.45, smoothstep(5.0, 18.0, lat));      // soft to its top, fainter the further the water lies from its bank
  float bankM = (1.0 - smoothstep(0.8, 1.2, te * (hit + 1.0) / 2.2)) * uWat.w;                  // the dark cut bank under them
  vec3 galC = (Rc > 0.0 ? uFrostR : uFrostL) * (0.45 + 0.6 * gt.g) * crown;
  float g2 = gal * (1.0 - 0.85 * bankM);
  vec3 refl = mix(env, galC, g2 * 0.88) * (1.0 - 0.75 * bankM * (1.0 - gal));
  float Fm = mix(F, max(F, 0.28), max(g2, 0.6 * bankM) * smoothstep(0.5, 0.82, fr));                 // close under the lens the mirror is weak and the water black: the trees hang in it from mid-river outward
  vec3 body = (uZen * 0.05 + uSky * 0.008) * (0.5 + 0.5 * ndv);                 // looked down into, the water is near black with a breath of indigo
  vec3 c = uDeep + body + refl * Fm;
  // the sliding rose sheen: each glassy lane gives back the low sky of the sun side, more the flatter we look along it, and the fine
  // wavelets that cross it draw short bright and dark bars in it. Outside the lanes there is no rose on the water at all.
  vec2 sx0 = uSunDir.xz / max(length(uSunDir.xz), 1e-3); float lit = dot(vec2(N.x, N.z), sx0);
  vec3 roseC = mix(uHorS, uStB, 0.35);
  float bars = mix(0.82, 0.68 + 0.32 * smoothstep(0.3, 0.7, f0), kF);
  // (how much of the low sky a lane gives back is taken mostly from the level river, so a lane stays one long lane: the swells that cross
  // it only breathe in it and never chop it into bars across the stream)
  float frS = 1.0 - clamp(mix(Vv.y, ndv, 0.3), 0.0, 1.0);
  // THE SUN'S PATH (the second colour on the water): toward the sun's bearing the river gives back its gold, and the ripples break it. Under the
  // sun stands a column of flashing crests (within 18 degrees of its bearing, the fine wavelets cut it into short bars; where they are finer
  // than a pixel it closes into a shimmering band); about it, strongest within 18 degrees and thinning out to some 75, the glassy lanes turn from rose
  // to gold. Looked down into, near the lens, there is none (lowK: by the slope of the line from the water to the eye, as a mirror gives
  // back a low sun only at a grazing look; the same at every place of the flight).
  float caS = dot(-Vv.xz / max(length(Vv.xz), 1e-3), sx0);
  float colN = smoothstep(0.95, 0.998, caS); float colB = smoothstep(0.25, 0.95, caS); float lowK = 1.0 - smoothstep(0.1, 0.45, Vv.y);
  roseC = mix(roseC, uGold * 0.8, 0.55 * colB * uSunK.w);
  c += roseC * slick * uWat.z * (0.04 + 0.42 * frS * frS) * bars * (1.0 - 0.6 * g2) * (1.0 - 0.7 * bankM);
  // (a facet flashes when, tipped toward us or away, it throws the sun's ray to the eye: twice its tilt along our line of sight must make
  // up the difference between how steeply we look down and how high the sun stands. The wavelets are given their full steepness here.)
  vec2 gP = mix(1.0, 0.55, kF) * gs + 0.085 * kF * gF; vec2 gPw = vec2(T.x * gP.x + Nr.x * gP.y, T.y * gP.x + Nr.y * gP.y);
  float tilt = dot(gPw, Vv.xz / max(length(Vv.xz), 1e-3)); float miss = 2.0 * tilt - (Vv.y / max(length(Vv.xz), 1e-3) - uSunDir.y);
  float flash = smoothstep(-0.03, 0.05, miss) * (1.0 - smoothstep(0.3, 0.7, miss));      // (one-sided: a crest flashes whole, never as a ring about itself)
  float lane2 = 0.55 + 0.45 * sin(stream * 2.3 + 1.9 * sin(q.x * 0.11 - uTime * 0.19)) * laneK;
  c += uGold * uSunK.w * uWat.z * ((2.6 * colN * (1.0 - smoothstep(0.2, 0.4, Vv.y)) + 0.9 * colB * (1.0 - smoothstep(0.1, 0.26, Vv.y))) * flash * lane2 * mix(0.6, 1.0, kF) + 0.14 * lowK * colB * (0.35 + 0.65 * lanes) * bars) * (1.0 - 0.6 * g2) * (1.0 - 0.8 * bankM) * (1.0 - 0.6 * bar);
  // the sun's glints: a few pinpoints. One facet in five of a fine drifting grid may flash, when the ray it throws back (each tipped its own
  // way) comes within a few degrees of the sun; the grid is let go before a cell is as small as a pixel, so the glints never line up in rows
  vec2 gp = vec2(q.x - uTime * 1.1, q.y) * vec2(2.2, 4.0); vec2 gi = floor(gp); float gh = stH(gi + 3.7);
  vec2 gf = fract(gp) - 0.5 - (vec2(stH(gi + 1.3), stH(gi + 6.1)) - 0.5) * 0.6;
  float gk = (1.0 - smoothstep(0.3, 0.8, fq.x * 2.2)) * (1.0 - smoothstep(0.3, 0.8, fq.y * 4.0));
  vec3 Nf = normalize(vec3(N.x + (stH(gi + 9.2) - 0.5) * 0.5, 1.0, N.z + (stH(gi + 4.4) - 0.5) * 0.5));
  float sdg = max(dot(reflect(-Vv, Nf), uSunDir), 0.0);
  float glint = step(0.8, gh) * smoothstep(0.98, 0.997, sdg) * (1.0 - smoothstep(0.06, 0.24, length(gf))) * (0.5 + 0.5 * sin(uTime * (1.5 + 3.0 * gh) + gh * 40.0)) * gk;
  c += uSunCol * uWat.z * 2.4 * glint * (1.0 - g2 * 0.7) * (1.0 - 0.8 * bankM) * (1.0 - bar);
  // gravel through the shallows
  float kP = 1.0 - smoothstep(0.06, 0.25, fwp * 6.0);
  float peb = mix(0.42, vnoise(vWp.xz * 6.0) * vnoise(vWp.xz * 14.0 + 3.0) * 1.8, kP);
  vec3 grav = vec3(0.078, 0.076, 0.078) * (0.4 + 1.2 * peb) * (uSky * 0.9 + uSunCol * 0.2);
  c = mix(c, grav + env * F * 0.6, shal * (1.0 - F) * 0.75);
  if (rif > 0.01) {                                                          // the bed of a riffle seen through a hand's depth of water: pale cobbles swimming under the ripples
    vec2 cb = cobble((vWp.xz + vec2(T.x * gs.x + Nr.x * gs.y, T.y * gs.x + Nr.y * gs.y) * 1.5) * 8.5);
    float stone = (1.0 - smoothstep(0.34, 0.66, cb.x)) * kP;
    vec3 bedA = mix(vec3(0.085, 0.088, 0.1), mix(vec3(0.18, 0.176, 0.17), vec3(0.34, 0.32, 0.29), cb.y), stone);
    bedA = mix(vec3(0.21, 0.205, 0.2), bedA, kP);
    vec3 bed = bedA * (uSky * 0.95 + uSunCol * (0.16 + 0.5 * smoothstep(0.02, 0.12, lit) * kP)) * vec3(0.8, 0.9, 1.0);
    c = mix(c, bed + env * F * 0.6, rif * (1.0 - F) * 0.9);
  }
  // thin skins of steam lying on the water: looked down on they are almost nothing, seen aslant they close up into soft lit bands
  vec2 sq = q - vec2(uTime * 0.55, 0.0);
  float skl = 0.5 + 0.5 * sin(stream * 0.63 + 5.0 + 1.3 * sin(sq.x * 0.027 + 1.0));                           // (in lanes of their own, drawn out along the streamlines)
  float ska = 0.5 + 0.5 * sin(sq.x * 0.083 + 1.9 * sin(stream * 0.41 + 2.0) + 0.7 * sin(sq.x * 0.019));
  float skin = smoothstep(0.3, 0.85, skl * (0.35 + 0.65 * ska)) * (0.75 + 0.25 * sin(sq.x * 0.6 + 2.1 * sin(stream * 1.3 + sq.x * 0.05)));
  float skA = (1.0 - exp(-uSkin.x * skin / max(Vv.y, 0.05))) * smoothstep(16.0, 42.0, dist) * (1.0 - smoothstep(110.0, 220.0, dist)) * smoothstep(0.5, 5.0, dBar);
  float fsS = max(dot(-Vv, uStSun), 0.0); fsS *= fsS; fsS *= fsS;
  float sideS = 0.5 + 0.5 * dot(-Vv.xz / max(length(Vv.xz), 1e-3), sx0);
  c = mix(c, mix(uStA, uStB, clamp(0.3 + 0.7 * sideS, 0.0, 1.0)) + uStScat * fsS, min(skA, 0.45));
  // ice with thickness: where the view ray crossed the level of the ice top (0.14 m up) decides top or wall
  vec2 offW = Vv.xz / max(Vv.y, 0.07) * 0.14; offW *= min(1.0, 0.9 / max(length(offW), 1e-3));
  vec2 offQ = vec2(dot(offW, T), dot(offW, Nr));
  float sgn = vF.z < vF.w ? 1.0 : -1.0; float isB = step(shoreB, di);
  vec3 SNOW = vec3(0.60, 0.61, 0.645);
  float wrap = clamp((uSunDir.y + 0.3) / 1.3, 0.0, 1.0);
  // the long shadows of the land's trees run on over the ice (the same lanes as the land's, along the sun's bearing): blue in the shadow, warm in the sun
  vec2 spI = vec2(dot(vWp.xz, vec2(-sx0.y, sx0.x)), dot(vWp.xz, sx0));
  float shI = smoothstep(0.40, 0.62, 0.7 * vnoise(vec2(spI.x * 0.16 + uTime * 0.012, spI.y * 0.011)) + 0.3 * vnoise(vec2(spI.x * 0.55, spI.y * 0.03 + 4.0))) * uIce.x;
  vec3 iceLit = SNOW * ((uSunCol * wrap * 1.5 + uGold * 0.16 * uIce.y) * (1.0 - shI) + uSky * (1.0 - 0.12 * shI)) * (0.86 + 0.2 * vnoise(vWp.xz * 1.7) + 0.08 * vnoise(vWp.xz * 9.0) * kP);
  vec3 iceRim = vec3(0.33, 0.42, 0.54) * (uSky * 1.3 + uSunCol * 0.45);
  vec3 iceWall = vec3(0.10, 0.19, 0.30) * (uSky * 1.5 + uSunCol * 0.25) * (0.7 + 0.5 * vnoise(vWp.xz * vec2(5.0, 5.0)));
  float aa = 0.03 + fwp * 0.9;
  // the shelf along every shore
  float sw = uWat.x * (1.1 + 2.8 * vnoise(vec2(vF.x * 0.06, vF.y < 0.0 ? 9.0 : 2.0)));
  vec2 pt = vWp.xz + offW;
  float swE = sw * mix(0.27, 1.0, isB); float wob = mix(0.45, 1.3, isB);                    // round an islet or a shoal the shelf is only a rind, so its cranes stand against dark water
  float eW = shore - swE + (vnoise(vWp.xz * 0.8) - 0.5) * wob + (vnoise(vWp.xz * 3.7) - 0.5) * 0.3;
  float eT = shore + sgn * offQ.y * isB - swE + (vnoise(pt * 0.8) - 0.5) * wob + (vnoise(pt * 3.7) - 0.5) * 0.3;
  // pans drifting with the flow
  vec2 qd = q - vec2(uTime * 1.1, 0.0); float crumbs = 1.0 - smoothstep(26.0, 60.0, dist);
  float frW, frT; float pW = panSD(qd, q.y, shoreB, sgn, crumbs, frW); float pT = panSD(qd + offQ, q.y, shoreB, sgn, crumbs, frT);
  float on = step(0.001, uWat.x); float ero = max(0.0, 2.2 - min(di, dBar)) * 1.4; float clearK = 1.0 - smoothstep(0.0, 0.6, ero);      // a pan that drifts against a shoal or the bar melts back from it whole: it is never cut by a line
  pW += ero; pT += ero;
  float dW = min(mix(9.0, eW, on), pW); float dT = min(mix(9.0, eT, on), pT);
  float top = 1.0 - smoothstep(-aa, aa, dT); float foot = 1.0 - smoothstep(-aa, aa, dW);
  float slush = max(frW * clearK * (1.0 - smoothstep(0.0, 0.45, pW)), on * (1.0 - smoothstep(0.0, 0.55, eW))) * (1.0 - foot);                  // a fringe of slush just under the water round every pan and along the shelf: soft, not cut out
  c = mix(c, iceRim * 0.5 + c * 0.55, slush * 0.5);
  c *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.06 + aa, dW)) * (1.0 - foot);          // a soft dark line where ice meets water
  c = mix(c, iceWall, foot * (1.0 - top) * 0.85);
  float panTop = step(pT, mix(9.0, eT, on));                                       // a pan, not the shelf: a broad soft rim of crushed ice round a greyer, thinner middle
  vec3 iceIn = iceLit * mix(1.0, mix(1.1, 0.84, smoothstep(0.22, 0.5, -dT)), panTop * smoothstep(0.1, 0.16, -dT) * (1.0 - smoothstep(0.1, 0.35, fwp * 6.0)));
  // frost flowers: stars of feathered rime a hand across, standing on the shelves and the pans
  vec2 fp2 = pt * 2.7; vec2 fi = floor(fp2); float fh = stH(fi + 21.0);
  vec2 ff = fract(fp2) - 0.5 - (vec2(stH(fi + 3.3), stH(fi + 8.1)) - 0.5) * 0.5;
  float fa = atan(ff.y + 1e-5, ff.x); float spike = abs(cos(fa * 3.0 + fh * 6.2832)); spike *= spike; spike *= spike;
  float flower = (1.0 - smoothstep(0.55, 1.0, length(ff) / (0.09 + 0.3 * spike * (0.4 + 0.6 * fh)))) * step(0.42, fh) * kP * smoothstep(0.06, 0.2, -dT);
  iceIn = mix(iceIn, iceLit * 1.2 + uSunCol * 0.1, flower * 0.85) * (1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.5, abs(length(ff) - 0.2) * 6.0)) * step(0.42, fh) * kP * (1.0 - flower));
  // the rim of a pan or of the shelf that is turned to the sun takes its gold (which way a rim faces: the slope of the distance to the edge, from the pixel's own neighbours; let go where a pixel is wider than the rim)
  vec2 jx = dFdx(vWp.xz); vec2 jy = dFdy(vWp.xz); float tX = dFdx(dT); float tY = dFdy(dT); float jd = jx.x * jy.y - jx.y * jy.x;
  vec2 gT = vec2(jy.y * tX - jx.y * tY, jx.x * tY - jy.x * tX) * (jd < 0.0 ? -1.0 : 1.0);
  float rimS = max(dot(gT / max(length(gT), 1e-6), sx0), 0.0) * (1.0 - smoothstep(0.12, 0.5, fwp)) * uIce.y * step(1e-9, abs(jd));
  c = mix(c, mix(iceRim + uGold * 0.85 * rimS, iceIn, smoothstep(0.0, mix(0.13, 0.24, panTop) + aa, -dT)), top);
  vec3 cf = steamApply(c, vWp, 1.0);                                                    // the smoke that stands in columns is drawn by the wisps; on the water itself only its far haze lies
  gl_FragColor = vec4(mix(c, cf, 0.4 + 0.6 * smoothstep(25.0, 100.0, dist)), 1.0);
}`;

// ---------------------------------------------------------------------------------------------------------
// FROST RIBBONS: every trunk, limb, twig, withy and reed is a camera-facing strip. The middle of the strip
// is the dark wood (shaded as a cylinder); the rest is a fur of hoarfrost needles cut in the fragment
// shader, lit through by the sun. Strips never fall under ~1.5 pixels.
// aR = (half width m, side -1|+1, core fraction, metres along)   aW = (sway, phase, frost 0..1, kind)
// ---------------------------------------------------------------------------------------------------------
const RIB_VERT = /* glsl */`
attribute vec3 aTan; attribute vec4 aR; attribute vec4 aW;
uniform float uTime; uniform float uPx; uniform float uWind;
varying vec3 vWp; varying vec3 vSide; varying vec4 vR; varying vec3 vK; varying float vRad; varying float vPxw;
void main(){
  vec4 lp = vec4(position, 1.0); vec3 tn = aTan; float sc = 1.0; float ph = aW.y;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; tn = mat3(instanceMatrix) * tn; sc = length(instanceMatrix[0].xyz); ph += dot(instanceMatrix[3].xyz, vec3(0.37, 0.11, 0.53));
  #endif
  vec4 wp = modelMatrix * lp; tn = mat3(modelMatrix) * tn; tn /= max(length(tn), 1e-4);
  float sw = aW.x * uWind * sc;
  wp.x += sw * (0.10 * sin(uTime * 0.9 + ph) + 0.035 * sin(uTime * 2.3 + ph * 1.7)) + sw * 0.25 * (uWind - 1.0);
  wp.z += sw * 0.07 * sin(uTime * 0.7 + ph * 1.3);
  vec3 tc = cameraPosition - wp.xyz; float dist = length(tc);
  vec3 sd = cross(tn, tc); sd /= max(length(sd), 1e-4);
  float hw = max(aR.x * sc, 1e-4); float w = max(hw, uPx * dist * 0.8);
  wp.xyz += sd * aR.y * w;
  vWp = wp.xyz; vSide = sd; vR = vec4(aR.y, aR.z * hw / w, aR.w * sc, aW.z); vK = vec3(aW.w, fract(ph * 3.7), w / hw); vRad = hw * aR.z; vPxw = w / max(uPx * dist, 1e-5);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RIB_FRAG = /* glsl */`
varying vec3 vWp; varying vec3 vSide; varying vec4 vR; varying vec3 vK; varying float vRad; varying float vPxw;
uniform float uFrost; uniform vec4 uAld; uniform float uWarm;         // uAld = (the islet alder's crown centre, its radius)
${LIGHT_GLSL}
${STEAM_FN}
void main(){
  float v = vR.x; float av = abs(v); float core = vR.y; float frost = vR.w * uFrost;
  float a = vR.z * 38.0; float fw = fwidth(a);
  float len = 0.3 + 0.7 * h1(floor(a) + (v > 0.0 ? 17.3 : 3.1));
  float needle = len * (1.0 - abs(2.0 * fract(a) - 1.0));
  float lim = mix(needle, mix(0.55, 1.0, smoothstep(1.0, 1.6, vK.z)), smoothstep(0.16, 0.6, fw));      // the needles close up into plain fur before they are small enough to break into dots
  if (av > max(max(core + (1.0 - core) * lim * frost, core), min(1.0, 0.62 / vPxw))) discard;      // never narrower than a pixel and a quarter: a thinner strand breaks into dashes
  float thinK = step(0.5, vK.x) * step(vK.x, 1.5) + step(2.5, vK.x) * step(vK.x, 3.5);      // withies and reeds: wood far thinner than its frost
  if (vK.y < 0.3 * smoothstep(2.2, 4.5, vK.z) * step(vK.x, 1.5) * thinK) discard;         // far curtains thin out, so the sky shows between the strands and a willow is not a pale block
  vec3 Vv = cameraPosition - vWp; Vv /= max(length(Vv), 1e-4);
  vec3 SNOW = vec3(0.62, 0.63, 0.66); vec3 c;
  // the islet alder stands rose-lit out of the steam: the side of its crown that faces the sun takes the rose-gold key, its heart stays dark
  vec3 an = (vWp - uAld.xyz) * vec3(1.0, 0.8, 1.0); float anl = length(an); an /= max(anl, 1e-4);
  float ak = step(3.5, vK.x) * (1.0 - smoothstep(0.85, 1.15, anl / max(uAld.w, 1e-3))); float aSun = smoothstep(-0.3, 0.5, dot(an, uSunDir)) * smoothstep(0.25, 0.8, anl / max(uAld.w, 1e-3));
  float xc = clamp(v / max(core, 1e-3), -1.0, 1.0); float sArc = asin(xc) * vRad; float fa = fwidth(sArc) + fwidth(vR.z);      // metres round the bole, and how much of it one pixel covers
  float farK = smoothstep(1.2, 3.5, vK.z);
  // a withy or reed stem narrower than a pixel is drawn as its frost alone: its dark core would only land on stray pixels and dot the strand
  if (av < core * (1.0 - thinK * smoothstep(1.25, 1.9, vK.z))) {
    float x = xc;
    vec3 N = vSide * x + Vv * sqrt(max(1.0 - x * x, 0.0)); N /= max(length(N), 1e-4);
    float k = vK.x;
    vec3 bark = (k < 0.5 || k > 3.5) ? vec3(0.050, 0.038, 0.034) : k < 1.5 ? vec3(0.17, 0.10, 0.055) : k < 2.5 ? vec3(0.17, 0.17, 0.18) : vec3(0.34, 0.27, 0.15);
    float g = vnoise(vec2(vR.z * 2.5, x * 2.5 + k * 7.0)); float g2 = vnoise(vec2(vR.z * 11.0, x * 5.0));
    bark *= 0.55 + 0.9 * g * (0.6 + 0.8 * g2);
    // a bole wide enough to have bark: plates and furrows, rime packed into the furrows and plastered on the weather side, snow
    // lodged on whatever leans face up, a dark wet foot where it stands in the river's breath
    float dk = step(k, 0.5) + step(3.5, k);
    float big = smoothstep(0.05, 0.2, vRad) * dk; float seen = 1.0 - smoothstep(0.02, 0.07, fa);
    float fu = vnoise(vec2(sArc * 11.0 + 2.5 * vnoise(vec2(vR.z * 1.1, sArc * 3.0)), vR.z * 1.7));
    float furrow = (1.0 - smoothstep(0.0, 0.28, abs(fu - 0.5) * 2.0)) * big * seen;
    bark *= (1.0 - 0.62 * furrow) * mix(1.0, 0.72 + 0.5 * vnoise(vec2(sArc * 11.0, vR.z * 0.9) + 7.0), big * seen);
    float wsd = dot(N, vec3(0.2, 0.33, 0.92));
    float plast = smoothstep(0.3, 0.75, wsd + 0.7 * (g - 0.5) + 0.35 * (g2 - 0.5)) * big;
    float foot = (1.0 - smoothstep(0.1, 0.9, vWp.y)) * dk;
    bark *= 1.0 - 0.55 * foot;
    float top = smoothstep(mix(0.1, 0.0, big), mix(0.75, 0.3, big), N.y + mix(0.5, 0.22, big) * g - mix(0.2, 0.06, big)) * frost;
    float white = max(max(top * 0.9, 0.25 * frost * g2), max(plast * 0.8, furrow * smoothstep(-0.2, 0.5, wsd) * 0.75) * frost) * (1.0 - foot);
    c = shade(mix(bark, SNOW, white * (1.0 - 0.55 * ak * (1.0 - aSun))), N, Vv, 0.0, 0.7) * (1.0 - 0.3 * ak * (1.0 - aSun)) + uSunCol * ak * aSun * (0.13 + 0.3 * white);
  } else {
    vec3 N = Vv * 0.55 + vec3(0.0, 0.55, 0.0) + vSide * v * 0.45; N /= max(length(N), 1e-4);
    float bk = max(dot(-Vv, uSunDir), 0.0);
    float sunny = smoothstep(-0.15, 0.45, dot(mix(N, Vv * 0.7 + vec3(0.0, 0.7, 0.0), farK), uSunDir));               // fur the sun does not reach is blue and darker than the sky behind it; only its back-lit edge glows
    c = shade(SNOW * mix(0.92 + 0.16 * vK.y, 0.74 + 0.36 * fract(vK.y * 7.3), farK * thinK) * mix(0.7, 1.0, sunny), N, Vv, 1.0, 0.0) + uRimCol * frost * (0.04 + mix(0.55, 0.34, farK) * bk * bk * bk);
    c += uRimCol * frost * 0.3 * smoothstep(0.1, 0.7, v * dot(vSide, uSunDir)) * (1.0 - 0.7 * farK);      // the edge of the fur that faces the sun: a rose-gold rim
    c += SNOW * uRimCol * frost * uWarm * 0.32 * smoothstep(0.35, 0.9, 0.5 + 0.5 * dot(Vv, uSunDir));      // seen from the sun's side, the fur is in its light: warm (the second colour)
    c *= mix(1.0, mix(0.5, 0.36, step(3.5, vK.x)), farK * (1.0 - sunny));          // far off, a strip is wider than its twig: give the dark wood inside it its share, so back-lit trees stand blue against the steam
    c = c * (1.0 - 0.3 * ak * (1.0 - aSun)) + uSunCol * frost * 0.85 * ak * aSun * (0.7 + 0.3 * vK.y);
  }
  gl_FragColor = vec4(steamApply(c, vWp, 1.0), 1.0);
}`;

// ---------------------------------------------------------------------------------------------------------
// BIG BIRDS (whooper swans, the Steller's sea eagle): one articulated mesh placed per instance from the CPU.
// aB = (part, t, side, w): 0 body / tail / feet (rigid)  1 neck ring  2 head and bill  3 wing (u span, v chord)
// iP = (x, y, z, heading)  iQ = (pitch, bank, flap phase, flap amplitude)  iS = (wings open, neck upright, scale, -)
// ---------------------------------------------------------------------------------------------------------
const BIRD_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aB; attribute vec4 iP; attribute vec4 iQ; attribute vec4 iS;       // iS.w: the head turned to the bird's left (+) or right (-), radians
uniform vec4 uBd; uniform vec4 uBe;       // (neck length, body radius, neck base z, neck base y)  (body length, shoulder y, shoulder z, wing twist)
varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec3 vUv;
void main(){
  float part = aB.x; float open = iS.x; float up = iS.y;
  vec3 lp = position; vec3 ln = normal;
  if (part > 0.5 && part < 2.5) {
    float a0 = mix(0.15, 1.05, up); float b = mix(0.02, 0.62, up);
    float t = part < 1.5 ? aB.y : 1.0; float th = a0 + b * t;
    vec3 c = vec3(0.0, uBd.w, uBd.z) + uBd.x * vec3(0.0, (cos(a0) - cos(th)) / b, (sin(th) - sin(a0)) / b);
    if (part < 1.5) { vec3 e2 = vec3(0.0, cos(th), -sin(th)); lp = c + vec3(position.x, 0.0, 0.0) + e2 * position.y; ln = vec3(normal.x, 0.0, 0.0) + e2 * normal.y; }
    else { float hh = mix(th - 0.15, 0.05, up * 0.9); float ch = cos(hh), sh = sin(hh);
      lp = c + vec3(position.x, position.y * ch + position.z * sh, -position.y * sh + position.z * ch);
      ln = vec3(normal.x, normal.y * ch + normal.z * sh, -normal.y * sh + normal.z * ch);
      float hk = iS.w * 0.55; float chk = cos(hk), shk = sin(hk); vec3 hl = lp - c;                        // the head turns on the end of the neck ...
      lp = c + vec3(hl.x * chk + hl.z * shk, hl.y, -hl.x * shk + hl.z * chk); ln = vec3(ln.x * chk + ln.z * shk, ln.y, -ln.x * shk + ln.z * chk); }
    float nk = iS.w * 0.45 * t; float cnk = cos(nk), snk = sin(nk); vec3 nb = vec3(0.0, uBd.w, uBd.z); vec3 nl = lp - nb;      // ... and the neck bends round with it
    lp = nb + vec3(nl.x * cnk + nl.z * snk, nl.y, -nl.x * snk + nl.z * cnk); ln = vec3(ln.x * cnk + ln.z * snk, ln.y, -ln.x * snk + ln.z * cnk);
  } else if (part > 2.5) {
    float u = aB.y; float side = aB.z;
    float ph = iQ.z - 1.2 * u;
    float ang = (0.10 + iQ.w * sin(ph) * (0.25 + 0.75 * u)) * open;
    float span = position.x * (1.0 - 0.25 * u * max(cos(iQ.z - 0.6), 0.0) * step(0.01, iQ.w));
    float tw = (0.12 + 0.40 * max(cos(ph), 0.0) * step(0.01, iQ.w)) * u * open * uBe.w;             // the hand of the wing turns its upper side back on the up-stroke: seen from behind and above it flashes white
    vec3 q = vec3(span * cos(ang) - position.y * sin(ang), span * sin(ang) + position.y * cos(ang) + (position.z - 0.18 * uBe.x) * tw, position.z);      // position.y: the arch of the wing
    vec3 fo = vec3(uBd.y * (0.5 - 0.3 * u), -0.10 * u - 0.6 * uBd.y * aB.w, -u * 0.74 * uBe.x - 0.08 * aB.w);
    q = mix(fo, q, open);
    lp = vec3(side * (uBd.y * 0.5 + q.x), uBe.y + q.y, uBe.z + q.z);
    vec3 n = mix(vec3(0.8, 0.6, 0.0), vec3(-sin(ang) * normal.y, cos(ang) * normal.y, normal.z), open); ln = vec3(side * n.x, n.y, n.z);
  }
  lp *= iS.z;
  float cp = cos(iQ.x), sp = sin(iQ.x);
  lp = vec3(lp.x, lp.y * cp + lp.z * sp, -lp.y * sp + lp.z * cp); ln = vec3(ln.x, ln.y * cp + ln.z * sp, -ln.y * sp + ln.z * cp);
  float cb = cos(iQ.y), sb = sin(iQ.y);
  lp = vec3(lp.x * cb - lp.y * sb, lp.x * sb + lp.y * cb, lp.z); ln = vec3(ln.x * cb - ln.y * sb, ln.x * sb + ln.y * cb, ln.z);
  float chd = cos(iP.w), shd = sin(iP.w);
  lp = vec3(lp.x * chd + lp.z * shd, lp.y, -lp.x * shd + lp.z * chd); ln = vec3(ln.x * chd + ln.z * shd, ln.y, -ln.x * shd + ln.z * chd);
  vec4 wp = modelMatrix * vec4(iP.xyz + lp, 1.0);
  vWp = wp.xyz; vN = ln; vCol = color; vUv = vec3(aB.y, aB.w, part);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BIRD_FRAG = /* glsl */`
varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec3 vUv; uniform float uFinger; uniform vec4 uWingP; uniform vec4 uSwanL;     // uWingP = (feathers along the span, primaries from, to, slot depth)  uSwanL = the swan's light (shadow side, key, under side, contour)
${LIGHT_GLSL}
${STEAM_FN}
void main(){
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vWp; Vv /= max(length(Vv), 1e-4);
  vec3 alb = vCol; float thin = 0.0;
  if (vUv.z > 2.5) {
    float u = vUv.x, v = vUv.y; float fu = fract(u * uWingP.x); float fid = floor(u * uWingP.x);
    float prim = smoothstep(uWingP.y, uWingP.z, u);
    float v0 = mix(uFinger > 0.5 ? 0.84 : 0.93, uWingP.w, prim);
    float tip = clamp((v - v0) / (1.0 - v0), 0.0, 1.0);
    if (abs(fu - 0.5) * 2.0 > 1.0 - tip * sqrt(tip) * mix(0.7, 0.9, prim)) discard;
    float vane = smoothstep(0.0, 0.6, 1.0 - abs(fu - 0.5) * 2.0);
    if (uFinger > 0.5) {                                   // the sea eagle: soft rows of dark coverts, each feather a shade of its own, white shoulders
      float rows = 0.5 + 0.5 * sin(v * 17.0 + 1.3 * sin(fu * 6.2832));
      alb *= (0.75 + 0.35 * rows * (1.0 - prim)) * (0.8 + 0.4 * h1(fid + 3.0)) * (0.8 + 0.2 * vane);
      float wh = (1.0 - smoothstep(0.42, 0.52, u + 0.06 * (h1(fid) - 0.5))) * (1.0 - smoothstep(0.2, 0.3, v + 0.04 * sin(fu * 6.2832)));
      alb = mix(alb, vec3(0.72, 0.715, 0.73) * (0.85 + 0.15 * rows), wh);
    } else {                                               // the swan: three rows of coverts lying over the flight feathers, a soft blue shadow under each hem
      float row = fract(v * 3.4 + 0.12 * sin(fu * 6.2832));
      alb *= (0.84 + 0.16 * vane) * mix(vec3(1.0), vec3(0.72, 0.78, 0.92), smoothstep(0.7, 1.0, row) * 0.6 * (1.0 - step(0.88, v)));
      // each flight feather of the hand has its own edge: a blue-grey hem where it lies under its neighbour (let go as a feather comes down from ten pixels wide to four)
      float hem = (1.0 - smoothstep(0.0, 0.2, 1.0 - abs(fu - 0.5) * 2.0)) * smoothstep(0.45, 0.75, v) * (0.25 + 0.75 * prim) * (1.0 - smoothstep(0.1, 0.25, fwidth(u * uWingP.x)));
      alb *= mix(vec3(1.0), vec3(0.5, 0.56, 0.74), 0.6 * hem);
    }
    if (dot(N, Vv) < 0.0) N = -N;
    thin = 1.0;
  }
  float rk = 0.8;
  if (uFinger < 0.5) {                                     // the swan: no rim glow on black feet and bill, feathers lying in soft rows down the back
    rk *= smoothstep(0.024, 0.045, max(alb.r, alb.g));
    if (vUv.z < 0.5) alb *= 0.95 + 0.05 * sin(vUv.x * 46.0);
    if (vUv.z > 1.5 && vUv.z < 2.5 && vUv.y < 0.45) alb = mix(alb, vec3(0.02, 0.02, 0.024), smoothstep(0.325, 0.36, vUv.y) * (1.0 - smoothstep(0.02, 0.12, abs(vUv.x - 0.7))));      // the eye, small and dark, on each side of the head
  }
  vec3 col;
  if (uFinger < 0.5) {
    // THE SWAN IS A SOLID WHITE BIRD: the side turned to the sun warm white, the side turned from it in cool blue shadow, its under side darker,
    // a dark line where its form turns away on the shaded hand, a rim of the sun's colour on the edge that faces the sun; hardly any light through the wing
    float ndl = dot(N, uSunDir); float key = smoothstep(-0.35, 0.25, ndl);
    vec3 fill = mix(uGround, uSky, N.y * 0.5 + 0.5);
    float under = mix(uSwanL.z, 1.0, smoothstep(-0.7, 0.25, N.y));
    col = alb * mix(fill * uSwanL.x * vec3(0.9, 0.96, 1.1), uSunCol * uSwanL.y + fill * 0.95, key) * under;
    col += thin * alb * uRimCol * max(-ndl, 0.0) * 0.12;
    float fr = 1.0 - max(dot(N, Vv), 0.0);
    col *= 1.0 - uSwanL.w * fr * fr * (1.0 - key) * (1.0 - thin);
    col += uRimCol * fr * fr * fr * smoothstep(-0.3, 0.8, dot(-Vv, uSunDir)) * rk * (0.25 + 0.9 * alb);
  } else col = shade(alb, N, Vv, thin, rk);
  gl_FragColor = vec4(steamApply(col, vWp, 1.0), 1.0);
}`;

// splash rings left where a running swan's foot or wingtip met the water (u-keyed: iR = x, z, birth u, size)
const RING_VERT = /* glsl */`
attribute vec4 iR; uniform float uU; varying vec2 vQ; varying float vA; varying vec3 vWp;
void main(){
  float age = (uU - iR.z) * ${DUR.toFixed(1)} / 1.7; float on = step(0.0, age) * step(age, 1.0);
  float rad = iR.w * (0.25 + 1.5 * sqrt(clamp(age, 0.0, 1.0))) * on;
  vec4 wp = modelMatrix * vec4(iR.x + position.x * rad, 0.03, iR.y + position.y * rad, 1.0);
  vQ = position.xy; vA = (1.0 - age) * on; vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RING_FRAG = /* glsl */`
varying vec2 vQ; varying float vA; varying vec3 vWp; uniform vec3 uSunCol; uniform vec3 uSky;
${STEAM_FN}
void main(){
  float r = length(vQ); float w = max(0.055, fwidth(r) * 1.5);                    // two thin rings running outward and dying away, never a drawn hoop
  float ring = (1.0 - smoothstep(0.0, w, abs(r - 0.88))) + 0.55 * (1.0 - smoothstep(0.0, w, abs(r - 0.56)));
  float al = ring * vA * vA * 0.24 * (0.055 / w) * (1.0 - smoothstep(0.94, 1.0, r));
  if (al < 0.004) discard;
  gl_FragColor = vec4(steamApply(uSky * 1.1 + uSunCol * 0.5, vWp, 1.0), al);
}`;

// the rings that run out from every leg standing in the river and every swan sitting on it (iR = x, z, phase, radius m; iU = shown from u, to u)
const WRING_VERT = /* glsl */`
attribute vec4 iR; attribute vec2 iU; uniform float uU; varying vec2 vQ; varying vec2 vA; varying vec3 vWp;
void main(){
  float on = step(iU.x, uU) * step(uU, iU.y);
  vec4 wp = modelMatrix * vec4(iR.x + position.x * iR.w * on, 0.035, iR.y + position.y * iR.w * on, 1.0);
  vQ = position.xy; vA = vec2(iR.z, iR.w); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const WRING_FRAG = /* glsl */`
varying vec2 vQ; varying vec2 vA; varying vec3 vWp; uniform float uTime; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uDeep;
${STEAM_FN}
void main(){
  float r = length(vQ); float k = 5.5 * vA.y;                       // a crest every 55 cm or so
  float fq = fwidth(r) * k * 6.2832; float keep = 1.0 - smoothstep(1.2, 3.0, fq);
  float sn = sin((r * k - uTime * 0.55 - vA.x) * 6.2832);
  float env = (1.0 - r) * (1.0 - r) * smoothstep(0.07, 0.2, r) * keep;
  float lightK = smoothstep(0.35, 0.95, sn); float dark = smoothstep(0.35, 0.95, -sn);
  float al = env * (0.62 * lightK + 0.5 * dark);
  if (al < 0.004) discard;
  vec3 c = mix(uDeep * 0.6, uSky * 1.15 + uSunCol * 0.55, lightK / max(lightK + dark, 1e-3));
  gl_FragColor = vec4(steamApply(c, vWp, 1.0), min(al, 0.8));
}`;

// peeling steam wisps and the curling tops of the banks: soft noise-eroded quads, faded near the lens
const WISP_VERT = /* glsl */`
attribute vec4 iP; attribute vec4 iQ; attribute float iT;            // (x, y, z, size)  (seed, wisp rate, stretch, opacity)  rose tint 0..1 (+2: a billow with an outline)
uniform float uTime; uniform vec4 uWisp; uniform vec3 uStSun;          // (lean downstream, rise, opacity, -)
varying vec2 vQ; varying vec4 vS; varying vec3 vWp; varying float vT; varying vec2 vL; varying vec3 vLs;      // vLs = (the way to the sun across the picture, how far a column's puff is torn)
void main(){
  float sd = iQ.x; float wisp = step(0.0001, iQ.y); float life = fract(uTime * iQ.y + sd); float firm = step(1.5, iT);
  vec3 p = iP.xyz;
  float rise = mix(1.0, iQ.z, wisp);                 // a wisp's iQ.z is how many times its own size it climbs; a bank top's is its stretch
  p.x += wisp * life * iP.w * uWisp.x * sqrt(rise) + (1.0 - wisp) * 1.5 * sin(uTime * 0.11 + sd * 40.0);
  p.y += wisp * life * iP.w * uWisp.y * rise + 0.3 * sin(uTime * 0.2 + sd * 30.0);
  float sz = iP.w * (0.7 + mix(0.75 * (0.6 + 0.4 * rise), 1.0, firm) * life * wisp);       // a puff swells as it climbs and thins (a column's puff less: the column keeps its waist)
  float ang = (sd - 0.5) * 0.9 + uTime * 0.05 * (sd - 0.5); float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(position.x * mix(iQ.z, 1.0, wisp), position.y * mix(0.9, 1.0, wisp));
  q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
  // every puff and every head leans downstream: its top is carried along the flow (world +x as the eye sees it) while its foot stays
  float fx = (viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).x;
  // a column's puff at the top of its climb is torn off downstream: drawn out along the flow, flattened, and (in the fragment) parted into shreds
  float tear = firm * wisp * smoothstep(0.5, 0.95, life);
  q = vec2(q.x * (1.0 + 0.9 * tear * abs(fx)), q.y * (1.0 - 0.3 * tear));
  q.x += fx * (0.22 + 0.2 * life * wisp + 0.5 * tear) * (q.y + 1.0);
  vec3 sv = mat3(viewMatrix) * uStSun; vec2 l2 = sv.xy / max(length(sv.xy), 1e-3); vL = vec2(l2.x * ca + l2.y * sa, -l2.x * sa + l2.y * ca);      // the way to the sun across the eye's view, in the puff's own frame
  vLs = vec3(l2, tear);
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  mv.xy += q * sz;
  float op = iQ.w * uWisp.z * mix(1.0, mix(sin(3.14159 * life), smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.5, 1.0, life)), firm), wisp) * smoothstep(min(9.0, 2.6 * iP.w), min(24.0, 7.0 * iP.w), -mv.z) * (1.0 - smoothstep(mix(150.0, 70.0, wisp), mix(230.0, 150.0, wisp), -mv.z));
  vQ = position.xy; vS = vec4(life + uTime * 0.06, sd, op, wisp); vT = iT;
  vWp = cameraPosition + mv.xyz * mat3(viewMatrix);
  gl_Position = projectionMatrix * mv;
}`;
const WISP_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vS; varying vec3 vWp; varying float vT; varying vec2 vL; varying vec3 vLs;
${STEAM_FN}
void main(){
  // vapour: a round billow with slow lobes inside it. Its top curls over: the lobes are wound round a point in the upper half, more the
  // nearer they lie to it, and the winding goes on with time.
  float r = length(vQ);
  vec2 cq = vQ - vec2(0.12, 0.3); float cl = length(cq);
  float wind = (0.8 + 0.3 * sin(vS.x * 1.3 + vS.y * 20.0)) * (1.0 - smoothstep(0.0, 0.85, cl)) * (vS.y > 0.5 ? 1.0 : -1.0);
  float cw = cos(wind), sw = sin(wind); vec2 w = vec2(cq.x * cw - cq.y * sw, cq.x * sw + cq.y * cw);
  float n = 0.52 * stN(w * 1.8 + vS.y * 17.0 + vec2(-vS.x * 0.3, -vS.x * 0.5)) + 0.31 * stN(w * 3.9 - vS.y * 9.0 + vec2(vS.x * 0.4, 0.0)) + 0.17 * stN(w * 8.3 + vS.y * 5.0 + vec2(vS.x * 0.5, -vS.x * 0.3));
  // THE BODY OF A BILLOW (round 11): thick at its heart, heaped in lobes toward its rim, and it HAS a rim: a column's puff and a bank's head
  // end in an outline (the thin skins and shore wisps stay soft through and through). A column's puff near the top of its climb is torn:
  // its lobes part and it goes in shreds (vLs.z). firm: the columns in the lee, the alder's plume, the heads of the gallery bank.
  float firm = step(1.5, vT); float tint = vT - 2.0 * firm; float tear = vLs.z;
  float body = mix(mix(0.55, 0.22, vS.w), 1.0, firm);                          // how much of an outline: a bank's soft head 0.55, a skin 0.22
  float dens = (0.8 - r) + (0.85 + 0.5 * tear) * (n - 0.5) * (1.0 - smoothstep(0.62, 1.0, r)) - 0.3 * tear;       // (the lobes die away before the quad's own edge: no billow is ever cut by it)
  float cover = smoothstep(0.0, mix(0.55, 0.2, body), dens); float thick = smoothstep(0.0, 0.75, dens);
  float al = cover * mix(mix(0.1, 0.45, body), 1.0, thick) * 1.5 * vS.z * smoothstep(-1.0, -0.4, vQ.y) * smoothstep(0.02, mix(2.5, 0.3, vS.w), vWp.y);
  al = mix(0.7, 0.82, firm) * (1.0 - exp(-al / 0.7));
  if (al < 0.004) discard;
  vec3 Vd = vWp - cameraPosition; Vd /= max(length(Vd), 1e-4);
  float fs = max(dot(Vd, uStSun), 0.0); fs *= fs; fs *= fs;
  vec2 sx = uStSun.xz / max(length(uStSun.xz), 1e-3);
  float side = 0.5 + 0.5 * dot(Vd.xz, sx);
  // lit as a heap of round lobes: each lobe's shoulder toward the sun bright (rose, and gold at its thin edge where the look has a low sun),
  // its side away from the sun and the hollows between lobes in cool shade. The slope of the body across the picture stands for its form.
  vec2 gd = vec2(dFdx(dens), dFdy(dens)) / max(length(dFdx(vQ)), 1e-5);
  float lobe = clamp(-dot(gd, vLs.xy) * 0.42, -1.0, 1.0);
  float lit = clamp(0.5 * clamp(dot(vQ, vL), -1.0, 1.0) + mix(0.3, 0.65, firm * vS.w) * lobe + 0.2 * vQ.y, -1.0, 1.0); float lk = smoothstep(-0.5, 0.6, lit);      // (a bank's wide head takes less of the lobes' slope than a column's puff: drawn out sideways, it would streak)
  float kk = clamp(mix(0.1 + 0.34 * side + 0.5 * lk, 0.16 + 0.78 * lk, min(tint * 1.3, 1.0)), 0.0, 1.0);
  vec3 c = mix(uStA * mix(1.0, 0.8, body), uStB * (1.05 + 0.1 * tint) * mix(vec3(1.0), vec3(1.08, 0.85, 0.92), tint * (1.0 - 0.65 * firm)), kk)
    + uStScat * fs * (0.5 + 0.7 * n) * (1.0 - 0.45 * tint) + uStGold * (0.2 + 0.6 * (1.0 - thick)) * smoothstep(0.0, 0.7, lit) * (0.3 + 0.7 * side) * body;
  c = stHold(c);
  gl_FragColor = vec4(c, al);
}`;

// diamond dust and falling frost (or snow): points in a box that wraps around whichever camera draws them.
// With EVENT defined: a shower fixed in the world, born at path fraction uEv (the eagle's sprung branch).
const GLIT_VERT = /* glsl */`
attribute vec4 aD;                                // (seed, fall speed, twinkle rate, size m)
uniform vec4 uGl; uniform float uPx; uniform vec3 uGlWind; uniform vec2 uEv;      // uGl = (box xz, box y, time, max pixels)   uEv = (u now, u born)
varying float vTw;
void main(){
  vec3 box = vec3(uGl.x, uGl.y, uGl.x); float T = uGl.z; vec3 p; float k = 1.0;
  #ifdef FALL
    float hh = max(position.y, 0.5); float lf = fract(T * aD.y / hh + aD.x * 7.0);            // shed from a bough at height position.y, down to the water, again and again
    p = vec3(position.x, hh * (1.0 - lf), position.z) + uGlWind * lf * hh * 0.5;
    p.xz += 0.16 * vec2(sin(T * 1.1 + aD.x * 50.0), cos(T * 0.9 + aD.x * 31.0));
    k = smoothstep(0.0, 0.05, lf) * (1.0 - smoothstep(0.93, 1.0, lf));
  #elif defined(EVENT)
    float age = (uEv.x - uEv.y) * ${DUR.toFixed(1)};
    p = position; p.y -= age * aD.y * (1.0 + 2.5 * aD.x) + 0.4 * age * age; p += uGlWind * age * (0.4 + aD.x);
    p.xz += 0.25 * vec2(sin(age * 1.3 + aD.x * 50.0), cos(age * 1.1 + aD.x * 31.0));
    k = step(0.0, age) * (1.0 - smoothstep(3.0, 5.5, age)) * step(0.05, p.y);
  #else
    vec3 b = position * box;
    b.y -= T * aD.y; b += uGlWind * T * (0.5 + aD.x);
    b.xz += 0.4 * vec2(sin(T * 0.23 + aD.x * 50.0), cos(T * 0.19 + aD.x * 31.0));
    #ifdef SNOWFALL
      vec3 c = cameraPosition + vec3(0.0, box.y * 0.22, 0.0);
    #else
      vec3 c = cameraPosition + vec3(0.0, box.y * 0.38, 0.0);         // diamond dust through the whole air column, from the water to twenty metres up
    #endif
    p = mod(b - c, box) - 0.5 * box + c;
    k = step(0.05, p.y) * (1.0 - smoothstep(0.38 * box.x, 0.5 * box.x, length(p.xz - c.xz)));
  #endif
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float tw = max(sin(T * aD.z + aD.x * 80.0), 0.0); tw *= tw; tw *= tw; tw *= tw;
  vTw = k * smoothstep(1.2, 4.0, -mv.z);
  #ifdef SNOWFALL
    vTw *= 0.75;
  #elif defined(FALL)
    vTw *= (0.3 + 0.7 * tw) * (1.0 - smoothstep(22.0, 60.0, -mv.z));
  #else
    vTw *= 0.05 + 0.95 * tw;
    #ifndef EVENT
      vTw *= 1.0 - 0.72 * smoothstep(9.0, 30.0, -mv.z);            // eased with distance: pinpoints near, a faint glitter far
    #endif
  #endif
  gl_PointSize = clamp(aD.w / max(uPx * -mv.z, 1e-4), 1.5, uGl.w);
  gl_Position = projectionMatrix * mv;
}`;
const GLIT_FRAG = /* glsl */`
uniform vec3 uGlCol; varying float vTw;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float d = 1.0 - smoothstep(0.15, 1.0, length(q));
  #ifdef SNOWFALL
    gl_FragColor = vec4(uGlCol, vTw * d);
  #else
    gl_FragColor = vec4(uGlCol * vTw * d, 1.0);
  #endif
}`;

// ---------------------------------------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------------------------------------
function ribbonSet() {
  const pos = [], tan = [], rr = [], ww = [], idx = [];
  // pts: [[x,y,z],...]; r0..r1 wood radius; fur: frost fur length m; frost 0..1; sw0..sw1 sway; kind 0 dark wood 1 withy 2 grey snag 3 reed
  const add = (pts, r0, r1, fur, frost, sw0, sw1, ph, kind) => {
    const n = pts.length, v0 = pos.length / 3; let along = (ph * 7.31) % 5;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], p = pts[i];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (i) along += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      const t = i / (n - 1), rc = mix(r0, r1, t), hw = rc + fur, sw = mix(sw0, sw1, t * t);
      for (const s of [-1, 1]) { pos.push(p[0], p[1], p[2]); tan.push(tx, ty, tz); rr.push(hw, s, rc / hw, along); ww.push(sw, ph, frost, kind); }
    }
    for (let i = 0; i < n - 1; i++) { const a = v0 + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  };
  const build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
    g.setAttribute('aR', new THREE.Float32BufferAttribute(rr, 4)); g.setAttribute('aW', new THREE.Float32BufferAttribute(ww, 4)); g.setIndex(idx);
    g.computeBoundingSphere(); g.boundingSphere.radius += 1.5;
    return g;
  };
  return { add, build, tris: () => idx.length / 3 };
}
// a wandering limb: n segments from p along dir, bending down (droop > 0) or up (droop < 0) toward the tip
function limb(rng, p, dir, len, n, droop, wig) {
  const pts = [[p[0], p[1], p[2]]]; let d = dir.slice(), q = p.slice(); const sl = len / n;
  for (let i = 1; i <= n; i++) {
    d[1] -= droop / n; d[0] += rng.range(-wig, wig); d[2] += rng.range(-wig, wig); d[1] += rng.range(-wig, wig) * 0.5;
    const l = Math.hypot(d[0], d[1], d[2]) || 1; d = [d[0] / l, d[1] / l, d[2] / l];
    q = [q[0] + d[0] * sl, q[1] + d[1] * sl, q[2] + d[2] * sl]; pts.push(q);
  }
  return pts;
}
const dirOf = (a, b) => { const x = b[0] - a[0], y = b[1] - a[1], z = b[2] - a[2], l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
// a hanging withy from p: nearly straight down, a little outward, never into the ground
function withy(R, rng, p, L, out, ph, fur, minY = 1.1) {
  L = Math.min(L, p[1] - minY); if (L < 0.5) return;
  const pts = []; for (let i = 0; i <= 3; i++) { const t = i / 3; pts.push([p[0] + out[0] * L * 0.16 * Math.sqrt(t), p[1] - L * t, p[2] + out[1] * L * 0.16 * Math.sqrt(t)]); }
  R.add(pts, 0.004, 0.003, fur, 1, 0, 1.0, ph, 1);
}
// white willow, bare: short leaning bole, arching limbs, curtains of frosted withies. det 0 far, 1 near, 2 specimen
function willow(R, rng, h, det, o = {}) {
  const ph = rng.range(0, 6.28), la = o.leanAz ?? rng.range(0, 6.28), lean = o.lean ?? rng.range(0.08, 0.3), k = h / 11;
  const bole = limb(rng, [0, -0.4, 0], [Math.sin(la) * lean, 1, Math.cos(la) * lean], h * rng.range(0.26, 0.36) + 0.4, 4, 0, 0.05);
  R.add(bole, 0.3 * k + 0.06, 0.2 * k + 0.04, 0.02, 0.55, 0, 0, ph, 0);
  const top = bole[bole.length - 1], nl = det ? rng.int(4, 6) : 3, a0 = rng.range(0, 6.28);
  for (let i = 0; i < nl; i++) {
    const az = a0 + (i / nl) * 6.283 + rng.range(-0.4, 0.4), el = rng.range(0.55, 1.0);
    const lm = limb(rng, top, [Math.sin(az) * (1 - el * 0.5), el, Math.cos(az) * (1 - el * 0.5)], h * rng.range(0.5, 0.72), det ? 6 : 4, rng.range(0.9, 1.4), 0.07);
    R.add(lm, 0.12 * k, 0.02, det ? 0.03 : 0.07, 0.8, 0, 0.12, ph + i, 0);
    const src = [];
    for (let j = 2; j < lm.length; j++) src.push(lm[j]);
    const nb = det === 2 ? 5 : det ? 3 : 1;
    for (let b = 0; b < nb; b++) {
      const j = rng.int(1, lm.length - 2), d0 = dirOf(lm[j], lm[j + 1]), az2 = rng.range(-1.1, 1.1);
      const d = [d0[0] * Math.cos(az2) - d0[2] * Math.sin(az2), d0[1] + rng.range(0, 0.3), d0[0] * Math.sin(az2) + d0[2] * Math.cos(az2)];
      const sb = limb(rng, lm[j], d, h * rng.range(0.16, 0.3), det ? 4 : 3, rng.range(0.8, 1.5), 0.08);
      R.add(sb, 0.035 * k, 0.008, det ? 0.03 : 0.1, 0.92, 0.03, 0.3, ph + b * 3, 0);
      for (let q = 1; q < sb.length; q++) src.push(sb[q]);
    }
    const out = [Math.sin(az), Math.cos(az)];
    if (det) { const per = o.per ?? (det === 2 ? 4 : 3); for (const p of src) for (let w = 0; w < per; w++) withy(R, rng, [p[0] + rng.range(-0.25, 0.25), p[1], p[2] + rng.range(-0.25, 0.25)], rng.range(0.16, 0.46) * h, out, ph + w + p[0], 0.028, o.minY); }
    else for (let w = 0; w < 3; w++) { const p = src[rng.int(0, src.length - 1)]; withy(R, rng, p, rng.range(0.25, 0.45) * h, out, ph + w, 0.16); }
  }
}
// Japanese alder: upright, ascending branches, sprays of furred twigs
function alder(R, rng, h, det, o = {}) {
  const ph = rng.range(0, 6.28), la = o.leanAz ?? rng.range(0, 6.28), lean = o.lean ?? rng.range(0.02, 0.12), k = h / 9;
  const bole = limb(rng, [0, -0.4, 0], [Math.sin(la) * lean, 1, Math.cos(la) * lean], h + 0.4, 7, o.curve ?? 0, 0.03);
  const thick = o.thick ?? 1;
  R.add(bole, (0.17 * k + 0.04) * thick, 0.02 * thick, 0.022, 0.6, 0, 0.05, ph, 0);
  const nb = det === 2 ? (h > 14 ? 32 : 24) : det ? 15 : 8;
  for (let i = 0; i < nb; i++) {
    const t = 0.24 + 0.72 * ((i + rng()) / nb), f = t * (bole.length - 1), j = Math.min(Math.floor(f), bole.length - 2), fr = f - j;
    const p = [mix(bole[j][0], bole[j + 1][0], fr), mix(bole[j][1], bole[j + 1][1], fr), mix(bole[j][2], bole[j + 1][2], fr)];
    const az = i * 2.4 + rng.range(-0.5, 0.5), el = rng.range(0.45, 0.9), len = h * (0.36 - 0.24 * t) * rng.range(0.8, 1.2);
    const br = limb(rng, p, [Math.sin(az), el, Math.cos(az)], len, det ? 4 : 3, -0.35, 0.07);
    R.add(br, 0.045 * k * (1.1 - t) * thick, 0.008, det ? 0.03 : 0.11, 0.9, 0, 0.1, ph + i, 0);
    const nt = det === 2 ? 7 : det ? 4 : 2;
    for (let w = 0; w < nt; w++) {
      const q = br[rng.int(1, br.length - 1)], az2 = az + rng.range(-1.3, 1.3);
      R.add(limb(rng, q, [Math.sin(az2), rng.range(0.1, 0.9), Math.cos(az2)], len * rng.range(0.25, 0.5), 2, rng.range(-0.3, 0.3), 0.1), 0.01, 0.004, det ? 0.032 : 0.12, 1, 0.02, 0.2, ph + w, 0);
    }
  }
}
// THE ISLET ALDER, a specimen for the close pass: a leaning furrowed bole on buttress roots, a ring of low drooping boughs
// that hang 6 m over our heads as we round it, ascending boughs above, and every bough ending in furred sprays
// of twigs hung with dark catkins and last year's cones. o.ok(p) says whether a point is clear of our course.
async function alderHero(R, rng, h, o = {}) {
  const ph = rng.range(0, 6.28), la = o.leanAz ?? 0, lean = o.lean ?? 0.2, k = h / 9, thick = o.thick ?? 1, ok = o.ok || (() => true), fall = o.fall || [], clear = o.clear || (() => true);
  const addClear = (pts, ...a) => { if (pts.every(clear)) R.add(pts, ...a); };                // twigs and catkins that would reach nearer our course than the hem allows are not grown
  const bole = limb(rng, [0, -0.4, 0], [Math.sin(la) * lean, 1, Math.cos(la) * lean], h + 0.4, 10, o.curve ?? 0, 0.025);
  const r0 = (0.17 * k + 0.04) * thick;
  R.add(bole, r0, 0.03 * thick, 0.03, 0.8, 0, 0.04, ph, 4);
  for (let i = 0; i < 5; i++) { const a = la + 0.6 + (i / 5) * 6.283 + rng.range(-0.3, 0.3), c = Math.sin(a), s = Math.cos(a), L = rng.range(0.9, 1.5);          // buttress roots running into the gravel
    R.add([[c * r0 * 0.3, 0.9, s * r0 * 0.3], [c * r0 * 0.95, 0.35, s * r0 * 0.95], [c * (r0 + L * 0.6), 0.0, s * (r0 + L * 0.6)], [c * (r0 + L), -0.35, s * (r0 + L)]], r0 * 0.42, r0 * 0.14, 0.02, 0.5, 0, 0, ph + i, 4); }
  const atT = (t) => { const f = clamp(t, 0, 1) * (bole.length - 1), j = Math.min(Math.floor(f), bole.length - 2), fr = f - j; return [mix(bole[j][0], bole[j + 1][0], fr), mix(bole[j][1], bole[j + 1][1], fr), mix(bole[j][2], bole[j + 1][2], fr)]; };
  const catkins = (p, q) => {
    const n = rng.int(2, 4); for (let i = 0; i < n; i++) { const L = rng.range(0.07, 0.13), ox = rng.range(-0.05, 0.05), oz = rng.range(-0.05, 0.05);
      addClear([[p[0] + ox, p[1], p[2] + oz], [p[0] + ox * 1.5, p[1] - L, p[2] + oz * 1.5]], 0.014, 0.009, 0.004, 0.3, 0.5, 1.1, q + i, 4); }
    if (rng() < 0.6) for (let i = 0; i < 2; i++) { const a = rng.range(0, 6.28); addClear([[p[0], p[1], p[2]], [p[0] + Math.cos(a) * 0.04, p[1] + 0.035, p[2] + Math.sin(a) * 0.04]], 0.019, 0.013, 0.003, 0.25, 0.3, 0.5, q, 4); }
  };
  const spray = (p, d, len, r, q, cat) => {
    const pts = limb(rng, p, d, len, 4, rng.range(0.1, 0.6), 0.09); addClear(pts, r, 0.006, 0.04, 1, 0.02, 0.22, q, 4);
    for (let j = 1; j < pts.length; j++) { const d0 = dirOf(pts[j - 1], pts[j]), a = (j % 2 ? 1 : -1) * rng.range(0.5, 1.0), c = Math.cos(a), sn = Math.sin(a);
      const tw = limb(rng, pts[j], [d0[0] * c - d0[2] * sn, d0[1] + rng.range(-0.25, 0.35), d0[0] * sn + d0[2] * c], len * rng.range(0.3, 0.5), 3, rng.range(-0.15, 0.5), 0.12);
      addClear(tw, Math.max(r * 0.6, 0.006), 0.004, 0.036, 1, 0.03, 0.26, q + j, 4);
      if (rng() < cat) catkins(tw[tw.length - 1], q + j); }
    if (cat > 0) catkins(pts[pts.length - 1], q);
  };
  const bough = (p, az, el, len, r, droop, nSpray, cat, i) => {
    let br = limb(rng, p, [Math.sin(az), el, Math.cos(az)], len, 6, droop, 0.06), n = br.length;
    while (n > 2 && !ok(br[n - 1])) n--;
    br = br.slice(0, n);
    R.add(br, r, 0.012, 0.05, 0.95, 0, 0.1, ph + i, 4);
    for (let q = 0; q < nSpray; q++) { const j = clamp(1 + Math.floor(((q + rng()) / nSpray) * (br.length - 1)), 1, br.length - 1), d0 = dirOf(br[j - 1], br[j]), a = (q % 2 ? 1 : -1) * rng.range(0.4, 1.1), c = Math.cos(a), sn = Math.sin(a);
      spray(br[j], [d0[0] * c - d0[2] * sn, d0[1] * 0.5 + rng.range(-0.4, 0.3), d0[0] * sn + d0[2] * c], Math.min(len, 4.5) * rng.range(0.22, 0.36), r * 0.3 + 0.006, ph + q + i, cat);
      if (q % 2 === 0) fall.push(br[j]); }
    spray(br[br.length - 1], dirOf(br[br.length - 2], br[br.length - 1]), Math.min(len, 4.5) * 0.28, 0.013, ph + i, cat);
    fall.push(br[br.length - 1]);
  };
  const nLow = o.low ?? 8;
  for (let i = 0; i < nLow; i++) {                      // the low ring: long boughs that leave the bole between 2.6 and 6.4 m, reach out and let their tips hang
    const y = 2.2 + 3.7 * ((i + rng.range(0.1, 0.9)) / nLow), t = (y + 0.4) / (h + 0.4) / Math.cos(Math.atan(lean));
    bough(atT(t), la + 1.1 + i * 2.4 + rng.range(-0.35, 0.35), rng.range(0.28, 0.55), rng.range(3.8, 5.4), 0.05 * k * thick * 0.72, rng.range(0.6, 1.0), 8, 0.8, i);
    if (o.yield && (i & 3) === 3) await o.yield();
  }
  const nb = o.high ?? 28;
  for (let i = 0; i < nb; i++) {                        // the crown: ascending boughs, shorter toward the top
    const t = 0.36 + 0.61 * ((i + rng()) / nb), len = h * (0.33 - 0.22 * t) * rng.range(0.8, 1.2);
    bough(atT(t), i * 2.4 + rng.range(-0.5, 0.5), rng.range(0.45, 0.9), len, 0.045 * k * (1.1 - t) * thick, -0.35, 5, 0.45, 20 + i);
    if (o.yield && (i & 7) === 7) await o.yield();
  }
  return bole;
}
// a grey snag, broken off, with a few stubs (and, for the eagle's perch, one long bough toward the river)
function snag(R, rng, h, det, o = {}) {
  const ph = rng.range(0, 6.28), la = rng.range(0, 6.28), k = h / 7;
  const bole = limb(rng, [0, -0.4, 0], [Math.sin(la) * 0.1, 1, Math.cos(la) * 0.1], h + 0.4, 5, 0, 0.04);
  R.add(bole, 0.24 * k + 0.05, 0.11 * k, 0.018, 0.5, 0, 0, ph, 2);
  const ns = det ? rng.int(4, 6) : 3;
  for (let i = 0; i < ns; i++) {
    const j = rng.int(2, bole.length - 1), az = rng.range(0, 6.28);
    R.add(limb(rng, bole[j], [Math.sin(az), rng.range(0.2, 0.9), Math.cos(az)], rng.range(0.8, 2.4) * k, 3, rng.range(-0.3, 0.5), 0.12), 0.06 * k, 0.02, det ? 0.025 : 0.07, 0.75, 0, 0, ph + i, 2);
  }
  if (o.bough) { const b = limb(rng, [bole[4][0], bole[4][1], bole[4][2]], [o.bough[0], 0.25, o.bough[1]], 3.2, 4, 0.35, 0.03); R.add(b, 0.09, 0.05, 0.025, 0.8, 0, 0.05, ph, 2); return b[b.length - 1]; }
  return bole[bole.length - 1];
}
// a stand of common reed: buff stems, nodding frosted plumes
function reedClump(R, rng, n = 9) {
  for (let i = 0; i < n; i++) {
    const x = rng.range(-0.55, 0.55), z = rng.range(-0.55, 0.55), h = rng.range(1.4, 2.3), lx = rng.range(-0.22, 0.22), lz = rng.range(-0.18, 0.18), pts = [], ph = rng.range(0, 6.28);
    for (let j = 0; j <= 3; j++) { const t = j / 3; pts.push([x + lx * t * t * h, -0.1 + (h + 0.1) * t * (1 - 0.05 * t), z + lz * t * t * h]); }
    R.add(pts, 0.007, 0.004, 0.006, 0.5, 0, 1, ph, 3);
    const tp = pts[3], L = rng.range(0.24, 0.4), dx = lx + rng.range(-0.3, 0.3), dz = lz + rng.range(-0.2, 0.2);
    R.add([tp, [tp[0] + dx * L * 0.5, tp[1] + L * 0.5, tp[2] + dz * L * 0.5], [tp[0] + dx * L, tp[1] + L * rng.range(0.6, 0.95), tp[2] + dz * L]], 0.006, 0.002, 0.05, 1, 1, 1.3, ph, 3);
  }
}
// swan / eagle geometry (see BIRD_VERT). Nose +Z, origin at the body centre.
function bigBirdGeometry(S) {
  const pos = [], nor = [], cl = [], ab = [], idx = [];
  const V = (p, n, c, b) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); cl.push(c[0], c[1], c[2]); ab.push(b[0], b[1], b[2], b[3]); return pos.length / 3 - 1; };
  const quad = (a, b, c, d) => { idx.push(a, b, c, a, c, d); };
  const tube = (rings, NS, f) => { const v0 = pos.length / 3; rings.forEach((r, i) => { for (let j = 0; j < NS; j++) f(r, i, (j / NS) * Math.PI * 2); });
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < NS; j++) { const a = v0 + i * NS + j, b = v0 + i * NS + (j + 1) % NS; quad(a, b, b + NS, a + NS); } };
  const bl = S.bl, br = S.br;
  // body
  const NR = S.bodyNR || 9, br2 = []; for (let i = 0; i <= NR; i++) br2.push(i / NR);
  const mot = S.mottle || 0;
  tube(br2, S.bodyNS || 8, (s, i, a) => { const pr = Math.pow(Math.max(Math.sin(Math.PI * Math.pow(s, 0.8)), 0), 0.75) + 0.02, sn = Math.sin(a);
    const c0 = sn < -0.25 ? (s < 0.42 ? S.thigh : S.belly) : S.body, mk = 1 + mot * (((Math.sin(i * 12.9898 + a * 78.233) * 43758.5453) % 1 + 1) % 1 - 0.5), c = [c0[0] * mk, c0[1] * mk, c0[2] * mk];
    if (S.loft) {                                           // the swan: a long flat-backed hull, broadest at the shoulders, drawn out to the tail, the back line rising to the neck
      const pw = Math.pow(Math.max(Math.sin(Math.PI * Math.pow(s, 1.25)), 0), 0.8) + 0.03, ph = Math.pow(Math.max(Math.sin(Math.PI * Math.pow(s, 1.1)), 0), 0.85) + 0.03;
      V([br * pw * Math.cos(a), br * 0.74 * ph * sn * (sn < 0 ? 0.82 : 1) + br * (0.2 * s - 0.06), mix(-0.58 * bl, 0.42 * bl, s)], [Math.cos(a), sn * 1.2, (s - 0.55) * 0.8], c, [0, s, 0, 0]); return; }
    V([br * pr * Math.cos(a), br * 0.9 * pr * sn + 0.03 * s, mix(-0.58 * bl, 0.42 * bl, s)], [Math.cos(a), sn, (s - 0.5) * 0.8], c, [0, s, 0, 0]); });
  // neck (swept in the shader) and head with bill, in the head frame (x, up, forward)
  tube([0, 0.2, 0.4, 0.6, 0.8, 1], 6, (t, i, a) => { const r = mix(S.nr0, S.nr1, sstep(0, 0.6, t)); V([r * Math.cos(a), r * Math.sin(a), 0], [Math.cos(a), Math.sin(a), 0], S.neck, [1, t, 0, 0]); });
  const hr = S.hr;
  tube([0, 0.2, 0.45, 0.7, 0.9, 1], 6, (t, i, a) => { const la = t * Math.PI, rr = Math.max(Math.sin(la), 0.05), f = hr * (0.3 - 1.25 * Math.cos(la));
    V([hr * 0.85 * rr * Math.cos(a), hr * rr * Math.sin(a) + hr * 0.2, f], [Math.cos(a), Math.sin(a), -Math.cos(la)], S.head, [2, t, 0, 0.4 * Math.max(Math.cos(a - 0.35), Math.cos(a - Math.PI + 0.35), 0)]); });
  tube(S.billRings, 5, (r, i, a) => V([r[1] * Math.cos(a), r[2] * Math.sin(a) + r[3], hr * 1.2 + r[0]], [Math.cos(a), Math.sin(a), 0.3], r[4], [2, 0, 0, 1]));
  // wings: span x chord grid; the shader flaps and folds it
  for (const side of [-1, 1]) { const NSp = S.nsp || 10, NC = S.nc || 4, v0 = pos.length / 3;
    for (let i = 0; i <= NSp; i++) for (let j = 0; j <= NC; j++) { const u = i / NSp, v = j / NC, le = S.chord * 0.3 - S.sweep * S.W * u * u, ch = S.chord * (1 - S.taper * Math.pow(u, S.tp)), ga = (S.fan || 0) * sstep(0.55, 1, u);
      const cam = (S.camber || 0) * (1 - 0.6 * u), nz = -1.7 * cam * Math.pow(v, 0.7), nl = Math.hypot(1, nz);          // an arched wing: the rear half droops, so from behind it is a blade, not a line
      V([S.W * u + v * ch * Math.sin(ga), 0.02 * Math.sin(Math.PI * v) * (S.fan ? 1 : 0) - cam * ch * Math.pow(v, 1.7), le - v * ch * Math.cos(ga)], [0, 1 / nl, nz / nl], S.wingColor(u, v), [3, u, side, v]); }
    for (let i = 0; i < NSp; i++) for (let j = 0; j < NC; j++) { const a = v0 + i * (NC + 1) + j; quad(a, a + 1, a + NC + 2, a + NC + 1); } }
  // tail fan and trailing feet
  { const v0 = pos.length / 3, z0 = -0.5 * bl, n = 4;
    for (let i = 0; i <= n; i++) { const a = (i / n - 0.5) * 2; V([a * br * (S.tailW0 ?? 0.45), 0.02, z0], [0, 1, 0], S.tailC, [0, 0, 0, 0]); V([a * S.tailW, 0.0, z0 - S.tail * (1 - 0.25 * a * a)], [0, 1, 0], S.tailC, [0, 0, 0, 0]); }
    for (let i = 0; i < n; i++) { const a = v0 + i * 2; quad(a, a + 1, a + 3, a + 2); }
    if (S.loft) for (const sx of [-1, 1]) { const f0 = pos.length / 3, x = sx * br * 0.5, y = -br * 0.2;          // black paddles trailing flat beside the tail and a little past it
      V([x, y - 0.02, z0 + 0.14], [0, 1, 0], S.foot, [0, 0, 0, 0]); V([x - 0.04, y, z0 - 0.1], [0, 1, 0], S.foot, [0, 0, 0, 0]); V([x + 0.005 * sx, y + 0.005, z0 - S.footL], [0, 1, 0], S.foot, [0, 0, 0, 0]); V([x + 0.05, y, z0 - 0.12], [0, 1, 0], S.foot, [0, 0, 0, 0]);
      quad(f0, f0 + 1, f0 + 2, f0 + 3); }
    else for (const sx of [-1, 1]) { const f0 = pos.length / 3, x = sx * br * 0.3, y = -br * 0.55;
      V([x, y + 0.03, z0 + 0.12], [0, -1, 0], S.foot, [0, 0, 0, 0]); V([x - 0.05, y, z0 - 0.08], [0, -1, 0], S.foot, [0, 0, 0, 0]); V([x, y - 0.01, z0 - S.footL], [0, -1, 0], S.foot, [0, 0, 0, 0]); V([x + 0.05, y, z0 - 0.08], [0, -1, 0], S.foot, [0, 0, 0, 0]);
      quad(f0, f0 + 1, f0 + 2, f0 + 3); } }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 4)); g.setIndex(idx);
  return g;
}
const WH = [0.74, 0.735, 0.75], BK = [0.022, 0.022, 0.026], YEL = [0.80, 0.52, 0.06], DK = [0.035, 0.028, 0.024];
// the whooper swan, made to be seen from behind and above: a long hull tapering to a tail wedge, the neck stretched ahead above the back line,
// arched wings with a swept, fingered hand, black paddles trailing past the tail
const SWAN = { loft: 1, twist: 1, bl: 0.92, br: 0.19, nl: 0.8, nr0: 0.068, nr1: 0.036, hr: 0.054, W: 1.18, chord: 0.47, sweep: 0.12, taper: 0.7, tp: 2.2, tail: 0.19, tailW: 0.045, tailW0: 0.42, footL: 0.36, finger: 0.35,
  fan: 0.5, camber: 0.36, nsp: 12, nc: 5, bodyNS: 10, bodyNR: 11, neckY: 0.42,
  wingP: [18, 0.62, 0.86, 0.5], body: WH, belly: [0.55, 0.59, 0.7], thigh: [0.55, 0.59, 0.7], neck: WH, head: WH, tailC: WH, foot: BK, wingColor: (u, v) => [WH[0] * (1 - 0.1 * v), WH[1] * (1 - 0.08 * v), WH[2]],
  billRings: [[-0.03, 0.03, 0.03, 0.012, YEL], [0.03, 0.024, 0.02, 0.006, YEL], [0.07, 0.019, 0.012, 0.0, BK], [0.105, 0.006, 0.004, -0.004, BK]] };
const EAGLE = { twist: 0.4, bl: 0.80, br: 0.21, nl: 0.13, nr0: 0.105, nr1: 0.09, hr: 0.088, W: 1.2, chord: 0.6, sweep: 0.03, taper: 0.3, tp: 3.0, tail: 0.38, tailW: 0.25, footL: 0.12, finger: 1,
  fan: 1.15, nsp: 18, nc: 6, bodyNS: 10, mottle: 0.5, wingP: [26, 0.66, 0.8, 0.3],
  body: [0.05, 0.04, 0.034], belly: DK, thigh: WH, neck: [0.07, 0.058, 0.05], head: [0.085, 0.072, 0.064], tailC: WH, foot: YEL, wingColor: (u, v) => [DK[0] * (1.5 + 0.9 * v), DK[1] * (1.5 + 0.9 * v), DK[2] * (1.5 + 0.9 * v)],
  billRings: [[-0.03, 0.045, 0.055, 0.0, YEL], [0.04, 0.035, 0.05, -0.005, YEL], [0.09, 0.02, 0.035, -0.02, YEL], [0.125, 0.004, 0.008, -0.05, YEL]] };

// ---------------------------------------------------------------------------------------------------------
// SIKA DEER at the ford: our own animal (a lofted body, neck and head, legs that swing from the hip, sika
// antlers as tubes that never thin below a pixel and a half), placed from the CPU so the line is exactly
// where the ford is, dark and rim-lit against the steam.
// aB = (part 0 body | 1 leg | 2 neck and head | 3 antler, leg phase, leg pivot z, tube radius)
// iP = (x, y, z, heading)   iQ = (walk phase, nod, scale, stag 0|1)
// ---------------------------------------------------------------------------------------------------------
const DEER_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aB; attribute vec3 aOff; attribute vec4 iP; attribute vec4 iQ;
uniform float uPx;
varying vec3 vWp; varying vec3 vN; varying vec3 vCol;
void main(){
  float part = aB.x; vec3 lp = position; vec3 ln = normal; vec3 lo = aOff;
  if (part > 0.5 && part < 1.5) {
    float a = 0.4 * sin(iQ.x + aB.y); float c = cos(a), s = sin(a);
    vec3 pv = vec3(position.x, 0.64, aB.z); vec3 r = position - pv;
    lp = pv + vec3(r.x, r.y * c - r.z * s, r.y * s + r.z * c); ln = vec3(normal.x, normal.y * c - normal.z * s, normal.y * s + normal.z * c);
  } else if (part > 1.5) {
    if (part > 2.5) lp = mix(vec3(0.0, 1.38, 0.70), position, iQ.w);
    float a = iQ.y; float c = cos(a), s = sin(a); vec3 pv = vec3(0.0, 0.84, 0.36); vec3 r = lp - pv;
    lp = pv + vec3(r.x, r.y * c - r.z * s, r.y * s + r.z * c); ln = vec3(normal.x, normal.y * c - normal.z * s, normal.y * s + normal.z * c);
  }
  lp.y += 0.012 * sin(iQ.x * 2.0);
  float ch = cos(iP.w), sh = sin(iP.w);
  vec3 wl = vec3(lp.x * ch + lp.z * sh, lp.y, -lp.x * sh + lp.z * ch) * iQ.z;
  vec4 wp = modelMatrix * vec4(iP.xyz + wl, 1.0);
  if (part > 2.5) {
    float dist = length(wp.xyz - cameraPosition); float k = max(1.0, uPx * dist * 0.85 / max(aB.w * iQ.z, 1e-4)) - 1.0;
    wp.xyz += vec3(lo.x * ch + lo.z * sh, lo.y, -lo.x * sh + lo.z * ch) * iQ.z * iQ.w * min(k, 5.0);
  }
  vWp = wp.xyz; vN = vec3(ln.x * ch + ln.z * sh, ln.y, -ln.x * sh + ln.z * ch); vCol = color;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DEER_FRAG = /* glsl */`
varying vec3 vWp; varying vec3 vN; varying vec3 vCol;
${LIGHT_GLSL}
${STEAM_FN}
void main(){
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vWp; Vv /= max(length(Vv), 1e-4);
  float hair = 0.85 + 0.3 * vnoise(vWp.xy * 23.0 + vWp.z * 17.0);
  vec3 c = shade(vCol * hair * 0.42, N, Vv, 0.0, 1.5) * (0.55 + 0.45 * smoothstep(0.0, 0.45, vWp.y));     // wet and dark at the water
  gl_FragColor = vec4(steamApply(c, vWp, 1.0), 1.0);
}`;
// the deer's wakes (kind 0: a V lying on the water behind the legs), breath and the steam off wet flanks (kind 1)
// iP = (x, y, z, size)   iQ = (heading, seed, opacity, kind)
const DFX_VERT = /* glsl */`
attribute vec4 iP; attribute vec4 iQ;
varying vec2 vQ; varying vec4 vS; varying vec3 vWp;
void main(){
  vec4 mv; vec3 wp;
  if (iQ.w < 0.5) {
    float ch = cos(iQ.x), sh = sin(iQ.x); vec2 l = vec2(position.x * 0.5, -(position.y * 0.5 + 0.42)) * iP.w;
    wp = vec3(iP.x + l.x * ch + l.y * sh, 0.025, iP.z - l.x * sh + l.y * ch); mv = viewMatrix * vec4(wp, 1.0);
  } else { mv = viewMatrix * vec4(iP.xyz, 1.0); mv.xy += position.xy * iP.w; wp = cameraPosition + mv.xyz * mat3(viewMatrix); }
  vQ = position.xy; vS = vec4(iQ.y, iQ.z * smoothstep(1.5, 5.0, -mv.z), iQ.w, 0.0); vWp = wp;
  gl_Position = projectionMatrix * mv;
}`;
const DFX_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vS; varying vec3 vWp;
uniform float uTime; uniform vec3 uSunCol; uniform vec3 uSky;
${STEAM_FN}
void main(){
  float al; vec3 c;
  if (vS.z < 0.5) {
    float back = (1.0 - vQ.y) * 0.5; float lat = abs(vQ.x);
    float x = (lat - (0.05 + 0.80 * back)) / (0.07 + 0.2 * back); float arm = exp(-x * x) * (0.35 + 0.65 * stN(vec2(back * 9.0 - uTime * 0.8, vS.x * 31.0 + sign(vQ.x) * 3.0)));
    float rip = 0.5 + 0.5 * sin(back * 30.0 - uTime * 4.0 + vS.x * 6.0);
    float inside = 1.0 - smoothstep(0.0, 0.06 + 0.8 * back, lat);
    float fade = (1.0 - back); fade *= fade;
    al = (arm * (0.45 + 0.4 * rip) + inside * rip * 0.22) * fade * smoothstep(0.0, 0.05, back) * vS.y * 0.75;
    c = uSky * 1.5 + uSunCol * 0.8;
  } else {
    float r = length(vQ); float soft = 1.0 - smoothstep(0.0, 1.0, r);
    float n = 0.6 * stN(vQ * 2.1 + vS.x * 17.0 + vec2(0.0, -uTime * 0.3)) + 0.4 * stN(vQ * 4.7 - vS.x * 9.0);
    al = soft * (0.25 + 0.95 * smoothstep(0.2, 0.8, n)) * vS.y;
    vec3 Vd = vWp - cameraPosition; Vd /= max(length(Vd), 1e-4);
    float fs = max(dot(Vd, uStSun), 0.0); fs *= fs; fs *= fs;
    c = uSky * 1.25 + uSunCol * (0.3 + 1.6 * fs);
  }
  if (al < 0.004) discard;
  gl_FragColor = vec4(steamApply(c, vWp, 1.0), min(al, 0.85));
}`;

// ---------------------------------------------------------------------------------------------------------
// THE SMALL ONES: a fox trotting the right bank and a dipper bobbing on the ice rind of a gravel step (one
// mesh, each animal placed by a uniform; never a beat, never looked at)
// aB = (who 0 fox | 1 dipper, leg phase or -1 rigid, leg pivot z, leg pivot y)
// uCrA[who] = (x, y, z, heading)   uCrB[who] = (stride phase, pitch, scale, lift)
// ---------------------------------------------------------------------------------------------------------
const CRIT_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aB;
uniform vec4 uCrA[2]; uniform vec4 uCrB[2];
varying vec3 vWp; varying vec3 vN; varying vec3 vCol;
void main(){
  vec4 A = mix(uCrA[0], uCrA[1], aB.x); vec4 B = mix(uCrB[0], uCrB[1], aB.x);
  vec3 lp = position; vec3 ln = normal;
  if (aB.y > -0.5) {
    float a = 0.6 * sin(B.x + aB.y); float c = cos(a), s = sin(a); vec3 pv = vec3(position.x, aB.w, aB.z); vec3 r = position - pv;
    lp = pv + vec3(r.x, r.y * c - r.z * s, r.y * s + r.z * c); ln = vec3(normal.x, normal.y * c - normal.z * s, normal.y * s + normal.z * c);
  }
  float cp = cos(B.y), sp = sin(B.y);
  lp = vec3(lp.x, lp.y * cp + lp.z * sp, -lp.y * sp + lp.z * cp); ln = vec3(ln.x, ln.y * cp + ln.z * sp, -ln.y * sp + ln.z * cp);
  lp.y += B.w;
  float ch = cos(A.w), sh = sin(A.w);
  vec3 wl = vec3(lp.x * ch + lp.z * sh, lp.y, -lp.x * sh + lp.z * ch) * B.z;
  vec4 wp = modelMatrix * vec4(A.xyz + wl, 1.0);
  vWp = wp.xyz; vN = vec3(ln.x * ch + ln.z * sh, ln.y, -ln.x * sh + ln.z * ch); vCol = color;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
function critterGeometry() {
  const pos = [], nor = [], cl = [], ab = [], idx = [];
  const V = (p, n, c, b) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); cl.push(c[0], c[1], c[2]); ab.push(b[0], b[1], b[2], b[3]); return pos.length / 3 - 1; };
  const skin = (v0, n, NS) => { for (let i = 0; i < n - 1; i++) for (let j = 0; j < NS; j++) { const a = v0 + i * NS + j, b = v0 + i * NS + (j + 1) % NS; idx.push(a, b, b + NS, a, b + NS, a + NS); } };
  // a body lofted along a spine in the animal's mid plane: rings of [y, z, radius]
  const loft = (sp, NS, col, b, flat = 1) => { const v0 = pos.length / 3;
    sp.forEach(([y, z, r], i) => { for (let j = 0; j < NS; j++) { const a = (j / NS) * 6.2832, cx = Math.cos(a), sy = Math.sin(a); V([r * cx * flat, y + r * sy, z], [cx, sy, 0], col(i, sy), b); } });
    skin(v0, sp.length, NS); };
  const leg = (x, z, top, r, ph, who, c) => { const v0 = pos.length / 3;
    for (const [y, k] of [[top, 1.25], [top * 0.5, 0.85], [0, 0.7]]) for (let j = 0; j < 5; j++) { const a = (j / 5) * 6.2832; V([x + r * k * Math.cos(a), y, z + r * k * Math.sin(a)], [Math.cos(a), 0, Math.sin(a)], c, [who, ph, z, top]); }
    skin(v0, 3, 5); };
  // the fox: rust-brown coat, cream throat and tail tip, dark legs and ears
  const RUST = [0.45, 0.28, 0.16], CREAM = [0.85, 0.8, 0.72], DARK = [0.06, 0.05, 0.045];
  loft([[0.34, -0.30, 0.02], [0.35, -0.26, 0.085], [0.36, -0.05, 0.10], [0.365, 0.14, 0.105], [0.39, 0.26, 0.08], [0.43, 0.35, 0.062], [0.455, 0.42, 0.058], [0.44, 0.47, 0.045], [0.425, 0.53, 0.022], [0.42, 0.56, 0.012]], 7,
    (i, sy) => i >= 9 ? DARK : (i >= 3 && sy < -0.3) ? CREAM : RUST, [0, -1, 0, 0], 0.86);
  loft([[0.34, -0.28, 0.03], [0.33, -0.36, 0.06], [0.31, -0.48, 0.075], [0.29, -0.6, 0.065], [0.275, -0.70, 0.03], [0.27, -0.74, 0.005]], 6, (i) => i >= 4 ? CREAM : RUST, [0, -1, 0, 0]);
  for (const sx of [-1, 1]) { const a = V([sx * 0.02, 0.5, 0.4], [0, 0, -1], DARK, [0, -1, 0, 0]), b = V([sx * 0.06, 0.5, 0.41], [0, 0, -1], DARK, [0, -1, 0, 0]), c = V([sx * 0.045, 0.6, 0.4], [0, 0, -1], DARK, [0, -1, 0, 0]); idx.push(a, b, c); }
  leg(-0.055, 0.2, 0.3, 0.02, 0, 0, DARK); leg(0.055, 0.2, 0.3, 0.02, 3.1416, 0, DARK); leg(-0.055, -0.2, 0.3, 0.022, 3.1416, 0, DARK); leg(0.055, -0.2, 0.3, 0.022, 0, 0, DARK);
  // the dipper: a round chocolate-brown bird with a white bib and a short cocked tail
  const BROWN = [0.2, 0.13, 0.09], HEAD = [0.27, 0.16, 0.09], BIB = [1.9, 1.9, 1.9];
  loft([[0.095, -0.1, 0.006], [0.075, -0.06, 0.018], [0.058, -0.03, 0.034], [0.055, 0.0, 0.04], [0.06, 0.03, 0.038], [0.072, 0.055, 0.027], [0.076, 0.07, 0.02], [0.074, 0.085, 0.006], [0.073, 0.098, 0.002]], 6,
    (i, sy) => i >= 7 ? DARK : (i >= 4 && i <= 6 && sy < 0.2) ? BIB : i >= 5 ? HEAD : BROWN, [1, -1, 0, 0]);
  leg(-0.014, 0.0, 0.03, 0.004, -1, 1, DARK); leg(0.014, 0.0, 0.03, 0.004, -1, 1, DARK);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 4)); g.setIndex(idx);
  return g;
}

function deerGeometry() {
  const pos = [], nor = [], cl = [], ab = [], off = [], idx = [];
  // a tube along a centre line: pts = [[x, y, z, rx, ry], ...]; rings stand square to the line
  const tube = (pts, NS, colF, part, b1, b2) => {
    const v0 = pos.length / 3, n = pts.length;
    for (let i = 0; i < n; i++) { const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)], p = pts[i];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let sx = 1 - tx * tx, sy = -tx * ty, sz = -tx * tz; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      const wx = ty * sz - tz * sy, wy = tz * sx - tx * sz, wz = tx * sy - ty * sx;
      for (let j = 0; j < NS; j++) { const an = (j / NS) * 6.2832, ca = Math.cos(an), sa = Math.sin(an);
        const ox = sx * p[3] * ca + wx * p[4] * sa, oy = sy * p[3] * ca + wy * p[4] * sa, oz = sz * p[3] * ca + wz * p[4] * sa, c = colF(i / (n - 1), sa, ca);
        const nx = sx * ca + wx * sa, ny = sy * ca + wy * sa, nz = sz * ca + wz * sa, nl = Math.hypot(nx, ny, nz) || 1;
        pos.push(p[0] + ox, p[1] + oy, p[2] + oz); nor.push(nx / nl, ny / nl, nz / nl); cl.push(c[0], c[1], c[2]); ab.push(part, b1, b2, Math.max(p[3], p[4])); off.push(ox, oy, oz); } }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < NS; j++) { const a = v0 + i * NS + j, b = v0 + i * NS + (j + 1) % NS; idx.push(a, b, b + NS, a, b + NS, a + NS); }
  };
  const COAT = [0.036, 0.029, 0.024], BELLY = [0.06, 0.052, 0.046], RUMP = [0.46, 0.45, 0.44], DARK = [0.016, 0.014, 0.013], HORN = [0.085, 0.066, 0.045];
  tube([[0, 0.80, -0.62, 0.02, 0.03], [0, 0.76, -0.54, 0.13, 0.17], [0, 0.72, -0.38, 0.185, 0.225], [0, 0.69, -0.12, 0.2, 0.235], [0, 0.69, 0.12, 0.2, 0.245], [0, 0.71, 0.30, 0.185, 0.245], [0, 0.76, 0.42, 0.14, 0.2], [0, 0.82, 0.50, 0.06, 0.1]], 8,
    (t, sa) => (t < 0.2 && sa > -0.5 ? RUMP : sa < -0.4 ? BELLY : COAT), 0, 0, 0);
  tube([[0, 0.80, -0.60, 0.035, 0.03], [0, 0.70, -0.66, 0.03, 0.02], [0, 0.63, -0.67, 0.012, 0.01]], 5, () => RUMP, 0, 0, 0);
  tube([[0, 0.80, 0.36, 0.12, 0.15], [0, 0.98, 0.50, 0.10, 0.115], [0, 1.16, 0.61, 0.08, 0.09], [0, 1.30, 0.69, 0.07, 0.075]], 6, (t, sa) => (sa < -0.5 ? BELLY : COAT), 2, 0, 0);
  tube([[0, 1.32, 0.63, 0.03, 0.04], [0, 1.35, 0.70, 0.078, 0.085], [0, 1.32, 0.82, 0.062, 0.065], [0, 1.26, 0.95, 0.04, 0.042], [0, 1.235, 1.0, 0.02, 0.022]], 6, (t) => (t > 0.8 ? DARK : COAT), 2, 0, 0);
  for (const s of [-1, 1]) {
    const v0 = pos.length / 3, E = [[s * 0.055, 1.40, 0.66], [s * 0.13, 1.46, 0.69], [s * 0.21, 1.52, 0.64], [s * 0.13, 1.47, 0.62]];        // an ear: a leaf held out to the side
    for (const p of E) { pos.push(p[0], p[1], p[2]); nor.push(0, 0.3, 0.95); cl.push(COAT[0] * 1.3, COAT[1] * 1.3, COAT[2] * 1.3); ab.push(2, 0, 0, 0.03); off.push(0, 0, 0); }
    idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    for (const [z, phase] of [[0.30, s < 0 ? 1.57 : 4.71], [-0.40, s < 0 ? 0 : 3.14]]) { const x = s * 0.11, hind = z < 0 ? 1 : 0;
      tube([[x, 0.72, z, 0.075, 0.095], [x, 0.46, z - 0.04 * hind, 0.045, 0.055], [x, 0.30, z + 0.03 * hind, 0.03, 0.033], [x, 0.03, z, 0.024, 0.027], [x, -0.02, z + 0.03, 0.03, 0.036]], 6, (t) => (t > 0.3 ? DARK : COAT), 1, phase, z); }
    const A = [[s * 0.05, 1.40, 0.70], [s * 0.13, 1.56, 0.62], [s * 0.24, 1.74, 0.50], [s * 0.30, 1.92, 0.42], [s * 0.27, 2.06, 0.45]], R = [0.022, 0.02, 0.017, 0.013, 0.007];
    tube(A.map((p, i) => [...p, R[i], R[i]]), 4, () => HORN, 3, 0, 0);
    for (const [k, tip] of [[1, [s * 0.18, 1.74, 0.86]], [2, [s * 0.33, 1.97, 0.70]], [3, [s * 0.40, 2.03, 0.32]]]) { const b = A[k], m = [(b[0] + tip[0]) / 2 + s * 0.01, (b[1] + tip[1]) / 2 - 0.03, (b[2] + tip[2]) / 2 + 0.03];
      tube([[...b, R[k], R[k]], [...m, R[k] * 0.75, R[k] * 0.75], [...tip, 0.006, 0.006]], 4, () => HORN, 3, 0, 0); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 4)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 3)); g.setIndex(idx);
  return g;
}

// a sedge tussock under its snow cap, unit size (radius 1, height 1): a low lumpy mound for the land shader. A dark core, narrower than the
// cap and in its shade, and a domed, lobed cap that overhangs it, its crown off the middle (cap normals lean up so it shades as snow, the
// core's lie out so it shades as frozen earth). The skirt is not a surface: it is the hem of dead blades below ...
function tussockGeometry(rng) {
  const pos = [], nor = [], idx = [], NS = 9, p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28), ox = rng.range(-0.2, 0.2), oz = rng.range(-0.2, 0.2);
  const lob = (a) => 1 + 0.17 * Math.sin(2 * a + p1) + 0.1 * Math.sin(3 * a + p2);
  const ring = (rr, hh, up, sh) => { const v0 = pos.length / 3; for (let j = 0; j < NS; j++) { const a = (j / NS) * 6.283, k = rr * lob(a) * (0.9 + 0.2 * rng()), o = 1 - Math.abs(up);
    pos.push(ox * sh + Math.cos(a) * k, hh * (0.93 + 0.14 * rng()) * (0.85 + 0.15 * lob(a + 1.3)), oz * sh + Math.sin(a) * k); nor.push(Math.cos(a) * o, up, Math.sin(a) * o); } return v0; };
  const band = (a0, b0) => { for (let j = 0; j < NS; j++) { const a = a0 + j, b = a0 + (j + 1) % NS, c = b0 + j, d = b0 + (j + 1) % NS; idx.push(a, c, d, a, d, b); } };
  const r0 = ring(0.8, -0.12, 0.3, 0), r2 = ring(0.72, 0.44, 0.2, 0.3); band(r0, r2);
  const c1 = ring(1.22, 0.47, 0.7, 0.4), c2 = ring(1.08, 0.7, 0.88, 0.6), c4 = ring(0.46, 0.98, 0.99, 1); band(r2, c1); band(c1, c2); band(c2, c4);
  const top = pos.length / 3; pos.push(ox, 1.06, oz); nor.push(0, 1, 0); for (let j = 0; j < NS; j++) idx.push(c4 + j, top, c4 + (j + 1) % NS);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
// ... and its blades for the ribbon shader: a ragged hem of dead sedge hanging out from under the cap to the stones, no two blades alike in
// length, droop or reach; and a fountain of buff sedge standing up through the cap and leaning out, tips clear of the ice
function tussockBlades(R, rng, hem) {
  const nh = 10; for (let k = 0; k < nh; k++) { const a = ((k + hem.range(0.1, 0.9)) / nh) * 6.283, ca = Math.cos(a), sa = Math.sin(a), out = hem.range(1.4, 2.0), mid = hem.range(1.15, 1.35), yk = hem.range(0.24, 0.42);
    R.add([[ca * 0.95, 0.5, sa * 0.95], [ca * mid, yk, sa * mid], [ca * out, 0.0, sa * out]], 0.075, 0.02, 0.015, hem.range(0.1, 0.45), 0, 0.15, hem.range(0, 6.28), 3); }
  const nb = 9; for (let k = 0; k < nb; k++) { const a = (k / nb) * 6.283 + rng.range(-0.25, 0.25), ca = Math.cos(a), sa = Math.sin(a), b0 = rng.range(0.25, 0.8), lean = rng.range(0.5, 1.5), up = rng.range(1.1, 2.0);
    R.add([[ca * b0, 0.5, sa * b0], [ca * (b0 + 0.45 * lean), 0.5 + up * 0.55, sa * (b0 + 0.45 * lean)], [ca * (b0 + lean), 0.5 + up * 0.92, sa * (b0 + lean)], [ca * (b0 + 1.55 * lean), 0.5 + up * (1.0 - 0.14 * lean), sa * (b0 + 1.55 * lean)]], 0.05, 0.016, 0.02, rng.range(0.2, 0.5), 0, 0.3, rng.range(0, 6.28), 3); }
  for (let k = 0; k < 4; k++) { const a = rng.range(0, 6.28), d = rng.range(0.1, 0.7), L = rng.range(0.5, 1.1), bx = Math.cos(a) * d, bz = Math.sin(a) * d, lx = rng.range(-0.3, 0.3), lz = rng.range(-0.3, 0.3);
    R.add([[bx, 0.8, bz], [bx + lx * 0.5, 0.8 + L * 0.6, bz + lz * 0.5], [bx + lx, 0.8 + L, bz + lz]], 0.04, 0.014, 0.03, rng.range(0.4, 0.7), 0, 0.5, rng.range(0, 6.28), 3); }
}
function quadGeo() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g;
}
// flip the winding of a ground mesh whose normals came out pointing down
function faceUp(g) {
  const nrm = g.attributes.normal; let up = 0; for (let i = 0; i < nrm.count; i++) up += nrm.getY(i);
  if (up < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); }
}
const put4 = (arr, o, a, b, c, d) => { arr[o] = a; arr[o + 1] = b; arr[o + 2] = c; arr[o + 3] = d; };
const iattr = (g, name, arr, size) => { const a = new THREE.InstancedBufferAttribute(arr instanceof Float32Array ? arr : new Float32Array(arr), size); g.setAttribute(name, a); return a; };

export default {
  id: 'cranes-in-steam',
  name: 'The River That Never Freezes',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- which visit is this: hour or weather, wind, season, cast
    const pick = rng.fork('variation')(), wr = rng.fork('weather');
    let lookName = pick < 0.34 ? 'dawn' : pick < 0.46 ? 'blue' : pick < 0.60 ? 'morning' : pick < 0.78 ? 'evening' : pick < 0.88 ? 'moon' : 'snow';
    if (vary.hour === 'dawn') lookName = pick < 0.7 ? 'dawn' : 'blue'; else if (vary.hour === 'day') lookName = pick < 0.75 ? 'morning' : 'snow';
    else if (vary.hour === 'golden') lookName = 'evening'; else if (vary.hour === 'night') lookName = 'moon';
    const LK = LOOKS[lookName], WM = WARM[lookName], w1 = wr(), w2 = wr(), w3 = wr();
    const windy = (lookName === 'dawn' || lookName === 'morning' || lookName === 'evening') && w1 < 0.2;
    const thaw = lookName !== 'snow' && lookName !== 'moon' && w2 < 0.18;
    const rare = !!vary.rare, snowing = lookName === 'snow';
    const scene = new THREE.Scene();

    // ---- the path: a straight reach, round the islet, two gentle bends, past the ford on its right-hand side, then
    //      the line along the bar (ZC, 4.6 m off the front row of dancers) and the climb to the portal
    const ZC = 9.6, E = new THREE.Vector3(150, 7.5, ZC);
    const upstream = [[-505, 28], [-474, 28], [-446, 28.4], [-418, 31.6], [-362, 39], [-308, 43], [-254, 38.5], [-210, 30], [-170, 21.5], [-135, 15.6], [-105, 12], [-80, 10.2], [-60, ZC]];
    const ppts = upstream.map(([x, z]) => [x, 2, z]);                           // 2 m above the water until the climb at the end
    for (const x of [-40, -20, 0, 20, 40]) ppts.push([x, 2, ZC]);
    for (const x of [50, 60, 70, 80]) ppts.push([x, 2 + (E.y - 2) * sstep(40, 90, x), ZC]);
    for (const x of [90, 110, 130, E.x]) ppts.push([x, E.y, ZC]);
    const path = makePath(ppts), L = path.length;
    const dOfX = (x) => L - (E.x - x), uOfX = (x) => dOfX(x) / L;                       // on the final straight
    // THE FLOWN LINE BY PLACE (the guards G1 and G2, see the head): the path's own point every 0.25 m of route. lineD(x, y, z) is the metres
    // from a point of the world to that line, searched coarse first (every 2 m of route) and then fine (the 4 m of route about the coarse
    // least, as segments): a few hundred steps a call
    const LQ = 0.25, NLQ = Math.ceil(L / LQ), LPT = new Float32Array((NLQ + 1) * 3);
    { const q = new THREE.Vector3(); for (let i = 0; i <= NLQ; i++) { path.posAtDist(Math.min(i * LQ, L), q); LPT[i * 3] = q.x; LPT[i * 3 + 1] = q.y; LPT[i * 3 + 2] = q.z; } }
    const lineD = (x, y, z) => { let bi = 0, bd = 1e18;
      for (let i = 0; i <= NLQ; i += 8) { const o = i * 3, dx = LPT[o] - x, dy = LPT[o + 1] - y, dz = LPT[o + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; bi = i; } }
      for (let i = Math.max(bi - 8, 0), e = Math.min(bi + 8, NLQ); i < e; i++) { const o = i * 3, ax = LPT[o], ay = LPT[o + 1], az = LPT[o + 2], bx = LPT[o + 3] - ax, by = LPT[o + 4] - ay, bz = LPT[o + 5] - az;
        const t = clamp(((x - ax) * bx + (y - ay) * by + (z - az) * bz) / Math.max(bx * bx + by * by + bz * bz, 1e-9), 0, 1), dx = ax + bx * t - x, dy = ay + by * t - y, dz = az + bz * t - z, d = dx * dx + dy * dy + dz * dz; if (d < bd) bd = d; }
      return Math.sqrt(bd); };
    // sun: on our left for the whole flight (hero space: 70 degrees left of +X); assert the brief's 55..85 degrees
    const sunAz = Math.atan2(-0.94, 0.34), tv = new THREE.Vector3();
    for (let i = 0; i <= 40; i++) { path.tangentAt(i / 40, tv); const off = Math.abs(Math.atan2(tv.z, tv.x) - sunAz) * 180 / Math.PI; if (off < 52 || off > 88) console.warn('cranes-in-steam: sun ' + off.toFixed(0) + ' deg off the heading at u=' + (i / 40)); }

    // ---- river space: frames every 4 m along the (extended) path
    const D0 = -180, D1 = L + 400, STEP = 4, NROW = Math.ceil((D1 - D0) / STEP);
    const FX = new Float32Array(NROW + 1), FZ = new Float32Array(NROW + 1), NX = new Float32Array(NROW + 1), NZ = new Float32Array(NROW + 1), pv = new THREE.Vector3();
    for (let i = 0; i <= NROW; i++) { const d = D0 + i * STEP; path.posAtDist(d, pv); path.tangentAtDist(d, tv); const l = Math.hypot(tv.x, tv.z) || 1; FX[i] = pv.x; FZ[i] = pv.z; NX[i] = -tv.z / l; NZ[i] = tv.x / l; }
    const toWorld = (d, s, out = [0, 0]) => { const f = clamp((d - D0) / STEP, 0, NROW - 0.001), i = Math.floor(f), t = f - i, sc = clamp(s, -60, 60);
      out[0] = mix(FX[i], FX[i + 1], t) + mix(NX[i], NX[i + 1], t) * sc; out[1] = mix(FZ[i], FZ[i + 1], t) + mix(NZ[i], NZ[i + 1], t) * sc + (s - sc); return out; };
    const toRiver = (x, z) => { const q = path.nearestXZ(x, z), d = q.u * L; path.posAtDist(d, pv); path.tangentAtDist(d, tv); const l = Math.hypot(tv.x, tv.z) || 1; return [d, ((x - pv.x) * -tv.z + (z - pv.z) * tv.x) / l]; };
    const n2 = noise.n2, bellS = (x, c, w) => { const t = (x - c) / w; return Math.exp(-t * t); };
    // pace: linger at the three shoals where pairs dance (0.8, 0.72, 0.72 of the average) and along the bar (0.55); full speed for the climb with the leavers
    const win = (u, a, b, f) => sstep(a, a + f, u) * (1 - sstep(b - f, b, u));
    const pace = (u) => 1 - 0.2 * win(u, 0.215, 0.30, 0.03) - 0.28 * (win(u, 0.315, 0.435, 0.035) + win(u, 0.49, 0.56, 0.03)) - 0.45 * sstep(0.655, 0.705, u) * (1 - sstep(0.80, 0.885, u));
    // the dance clock: the seconds of flight behind us at u (at the pace above). The pairs on the three shoals dance on it (as the live source
    // has them); every other crane of the river runs on world time
    const NTD = 256, paceT = new Float32Array(NTD + 1);
    { let acc = 0; for (let i = 0; i <= NTD; i++) { paceT[i] = acc; acc += 1 / clamp(pace((i + 0.5) / NTD), 0.35, 2.5); } const k = DUR / paceT[NTD]; for (let i = 0; i <= NTD; i++) paceT[i] *= k; }
    const danceT = (u) => { const f = clamp(u, 0, 1) * NTD, i = Math.min(Math.floor(f), NTD - 1); return mix(paceT[i], paceT[i + 1], f - i); };
    // the ford (the brief: u 0.60-0.64, the last of the file 11 m off): the deer wade the line D_FORD; the rearmost crosses it 5.5 m left of our
    // course when the lens is at u 0.62, 9.5 m short of the line: 11 m from it. A ford is the crest of a riffle; the river digs its pool at
    // the riffle's foot, where the bed drops: the deep water, and the bay it has cut in the left bank, lie a quarter of the river's width
    // (30 m there) below the ford line
    const D_ISLET = 88, U_FORD = 0.62, D_FORD = U_FORD * L + 9.5, D_POOL = D_FORD + 0.25 * 30;
    const heroK = (d) => { const x = d - dOfX(0); return sstep(-60, -57, x) * (1 - sstep(57, 60, x)); };
    const heroK2 = (d) => { const x = d - dOfX(0); return sstep(-86, -67, x) * (1 - sstep(66, 95, x)); };
    const poolK = (d) => Math.max(win(d, 0.34 * L - 12, 0.34 * L + 82, 16), win(d, 0.52 * L - 14, 0.52 * L + 52, 14));         // the pools beside the two left-hand shoals
    const sL = (d) => { let b = -(15.5 + 3.5 * n2(d * 0.011, 1.3) + 1.2 * n2(d * 0.05, 2.7)) - 8 * bellS(d, D_ISLET, 40) - 15 * bellS(d, D_POOL, 27); b = Math.min(b, mix(b, -17.5, poolK(d)));
      b = mix(b, -(ZC + 8.1), heroK2(d)); return mix(b, -(ZC + 9.3), heroK(d)); };
    const sR = (d) => { let b = 15 + 3 * n2(d * 0.012, 5.1) + 1.2 * n2(d * 0.045, 7.7); const x = d - dOfX(0);
      return mix(b, Math.max(b, 17.4), sstep(-80, -50, x)); };
    const SUN_GAP = 0.3;
    const hgt = (d, s) => {
      const l = sL(d), r = sR(d); let t, hb, sd;
      if (s >= r) { t = s - r; hb = 1.7 + 0.55 * n2(d * 0.021, 11.5); sd = 1; } else if (s <= l) { t = l - s; hb = mix(1.9 + 0.6 * n2(d * 0.02, 9.1), 3.02, heroK2(d)); sd = -1; } else return -0.7;
      let h = -0.5 + (hb + 0.5) * sstep(0, 1.0 + 0.45 * n2(d * 0.09, sd * 7.3), t);
      h += sstep(2, 26, t) * (0.45 + 0.55 * n2(d * 0.008, s * 0.008 + 3)) + 0.1 * n2(d * 0.08, s * 0.08) * sstep(1, 5, t);
      if (sd < 0) { const k = heroK(d) * (1 - sstep(17, 24, t)); h = mix(h, Math.min(h, 2.72 + 0.4 * sstep(12, 17, t)), k); }
      // (the hills of the left bank, the sun's side, are low downs, SUN_GAP of the right bank's height: the valley lies open to the sunrise, and the sun
      // stands clear over them the whole way down)
      h += sstep(330, 780, t) * (95 + 55 * n2(d * 0.0016 + sd * 3, s * 0.0016)) * (0.75 + 0.25 * n2(d * 0.006, s * 0.006 + 9)) * (sd < 0 ? SUN_GAP : 1) + sstep(120, 330, t) * 6 * (0.5 + 0.5 * n2(d * 0.004, s * 0.004));
      return h;
    };
    const groundAt = (x, z) => { const q = toRiver(x, z); return hgt(q[0], q[1]); };

    // ---- islets and shoals as plain shapes first (their meshes come later): the islet on the entry axis, the two
    //      shoals the arch willows stand on, and three long gravel shoals upstream of the dance, 5 m off our course,
    //      where cranes are already at it: the right-hand ones in full rose light, the left-hand one back lit
    const moundSpec = (c, tx, tz, HL, HW, top) => {
      const Y = (a, b) => { const r = Math.hypot(a / HL, b / HW); return top * Math.pow(Math.max(1 - r * r, 0), 0.6) - 0.5 * sstep(0.85, 1.3, r) + 0.06 * n2(a * 0.6 + c[0], b * 0.6); };
      const W = (a, b) => [c[0] + tx * a - tz * b, c[1] + tz * a + tx * b];                   // a along the flow, b to the right
      return { Y, W, c, tx, tz, HL, HW };
    };
    const riverMound = (d, s, HL, HW, top) => { const c = toWorld(d, s), i = clamp(Math.round((d - D0) / STEP), 0, NROW); const m = moundSpec(c, NZ[i], -NX[i], HL, HW, top); m.d = d; m.s = s; return m; };
    const IHL = 6.6, IHW = 2.5, M0 = riverMound(D_ISLET, -7.5, IHL, IHW, 0.55), isl = M0.c, itx = M0.tx, itz = M0.tz, isletY = M0.Y, isletW = M0.W;
    const AX = E.x + 0.7, ARCH = [-1, 1].map((side) => moundSpec([AX - 0.4, ZC + side * 10.2], 1, 0, 5.8, 2.8, 0.6));
    // SHOALS: A on our right at u 0.25 (front lit), B on our left through u 0.34-0.42 (back lit against a rose bank), C on our left at
    // u 0.52-0.55: the dance seen three times before the gathering on the bar. How near the dancers stand is the design's, one distance for
    // all three shoals and not typed for any: 'We pass at eye level with their heads, 5 m from the nearest pair'; 'creatures may come to 5 m'.
    // The derivation: a pair's two birds stand at most 1 m either side of its point, on an axis 0.87 rad off the flow (as the pairs are seated below and in the hero part), so the nearer bird is sin(0.87) m nearer the route than the pair's line
    const PAIR_CLEAR = 5, PAIR_LAT = PAIR_CLEAR + 1 * Math.sin(0.87);          // metres from the route's line: to the nearer bird of a pair, and to each pair's line
    const SHO = [
      { side: 1, lat: PAIR_LAT, d0: 0.25 * L + 3, d1: 0.25 * L + 36, big: 1,
        pairs: [[0.25, 8, 'leap', 0.588, 1.9], [0.25, 14, 'bow', 0.225], [0.27, 8, 'leap', 0.588, 1.8], [0.27, 14, 'duet'], [0.29, 8, 'bow', 0.225]], back: [[13, 'preen'], [27, 'idle']] },
      { side: -1, lat: PAIR_LAT, d0: 0.34 * L + 2.5, d1: 0.34 * L + 0.08 * L + 11, big: 1.06,
        pairs: [[0.34, 6.5, 'leap', 0.588, 2.1], [0.34, 13, 'bow', 0.225], [0.36, 6.5, 'leap', 0.588, 1.9], [0.36, 13, 'duet'], [0.38, 6.5, 'leap', 0.588, 2.0], [0.38, 13, 'bow', 0.225],
          [0.40, 6.5, 'leap', 0.588, 2.1], [0.40, 13, 'bow', 0.225], [0.42, 6.5, 'leap', 0.588, 1.9]], back: [[18, 'idle'], [38, 'preen'], [57, 'sleep']] },
      { side: -1, lat: PAIR_LAT, d0: 0.52 * L + 1.5, d1: 0.52 * L + 0.03 * L + 18.5, big: 1.08,
        pairs: [[0.52, 5.5, 'leap', 0.588, 2.15], [0.52, 11, 'bow', 0.225], [0.535, 7, 'leap', 0.588, 1.95], [0.535, 12.5, 'duet'], [0.55, 7.5, 'leap', 0.588, 2.05], [0.55, 13.5, 'bow', 0.225]], back: [[11, 'idle'], [27, 'preen']] },
    ];
    const SHOALS = SHO.map((S) => riverMound((S.d0 + S.d1) / 2, S.side * (S.lat + 1.4), (S.d1 - S.d0) / 2, 2.9, 0.33));
    // the spit: the islet's own gravel tail, laid down in its lee where the current slackens. It begins at the islet's downstream tip (joined
    // to it, or up to 3 m of slack water below it), runs 15 to 22 m down the islet's own line and is 4.4 to 5.8 m wide: length, width, gap and
    // the little it drifts across the stream are dealt from a stream of its own. No dancers: a group of the roost stands on it (below)
    const tailR = ctx.core.makeRng(ctx.core.hashSeed('islet-tail:' + ctx.seed)), tailHL = tailR.range(7.5, 11), tailGap = tailR.range(-1.5, 3);
    const SPIT = riverMound(D_ISLET + IHL + tailGap + tailHL, M0.s + tailR.range(-0.5, 0.5), tailHL, tailR.range(2.2, 2.9), 0.25); SHOALS.push(SPIT);
    // three low snow-capped gravel bars on the entry reach: pale stepping stones on the dark water that lead the eye to the islet
    const STEPS = [riverMound(21, -6.4, 4.2, 2.1, 0.7), riverMound(45, 7.0, 3.8, 1.9, 0.66), riverMound(66, -8.0, 3.6, 1.8, 0.6)];
    // gravel riffles in mid-channel, under our course: (d, s, half length, half width)
    const RIFS = [[46, -1.0, 4.5, 1.7], [0.25 * L + 5.6, 1.5, 4.2, 1.6], [0.4 * L + 7, -1.4, 4.6, 1.6], [0.55 * L + 8, 0.8, 5, 1.7], [dOfX(-6), 4.4, 30, 1.8], [dOfX(118), 0, 6, 2.0]];
    const extraGround = (x, z) => { for (const m of SHOALS) { const dx = x - m.c[0], dz = z - m.c[1], a = dx * m.tx + dz * m.tz, b = -dx * m.tz + dz * m.tx; if (Math.abs(a) < m.HL * 1.3 && Math.abs(b) < m.HW * 1.3) return Math.max(m.Y(a, b), -0.06); } return -0.06; };
    // the dipper's stone: the ice rind of the second gravel step, on its river side
    const dipM = STEPS[1], dipB = -Math.min(dipM.HW, dipM.s - 5.1), dipP = dipM.W(0.8, dipB), dipQ = dipM.W(0.8, dipB - 1), dipY = Math.max(dipM.Y(0.8, dipB), 0.03), dipHd = Math.atan2(dipQ[0] - dipP[0], dipQ[1] - dipP[1]) + 0.6;
    // the pairs: [u of the lens, metres ahead of it there, kind, where in its dance cycle the pair is at that u, leap height]. Each pair stands
    // across our line of sight (its axis 50 degrees off the flow), the cock nearer us; when he is at the top of his leap, wings up, the hen
    // stands tall with hers spread. Leaps come every 0.02 of the path, so a pair is always in the air 8 m ahead of the lens while it passes a shoal.
    const extraPairs = [];
    SHO.forEach((S, k) => {
      S.pairs.forEach(([uK, ahead, kind, cK, H, juv], j) => { const d = uK * L + ahead, q = toWorld(d, S.side * (kind === 'duet' ? S.lat - 0.27 : S.lat)), i = clamp(Math.round((d - D0) / STEP), 0, NROW), flow = Math.atan2(-NX[i], NZ[i]);
        const T = kind === 'leap' ? 7 : 8, ph = cK === undefined ? (0.17 + 0.37 * j + 0.2 * k) % 1 : (((cK - danceT(uK) / (kind === 'duet' ? 0.8 * T : T)) % 1) + 1) % 1;
        extraPairs.push({ kind, x: q[0], z: q[1], ang: kind === 'duet' ? flow + 0.12 * Math.sin(j * 2.1 + k) : flow - S.side * 0.87, H: H || 0, ph, T, big: S.big, juv: juv ? 1 : 0, g: k }); });
      S.back.forEach(([a, kind], j) => { const d = S.d0 + a, q = toWorld(d, S.side * (S.lat + 2.3)), i = clamp(Math.round((d - D0) / STEP), 0, NROW), flow = Math.atan2(-NX[i], NZ[i]);
        extraPairs.push({ kind, x: q[0], z: q[1], ang: flow + 0.4 * Math.sin(j * 1.7 + k), H: 0, ph: (0.3 + 0.41 * j + 0.2 * k) % 1, g: k }); });
    });

    // ---- the hero: the dance on the bar. World space is its space. The take-off clock (tau) advances one second
    //      for every 12.6 m we travel, so a leaver on the wing holds its distance ahead of the lens: tau = 0 when
    //      the camera is at x = CAM0.
    const VF = 12.6, CAM0 = 12, TAU_K = L / VF, LEAVE_U = uOfX(CAM0) - 1 / TAU_K, leaveSeconds = (1 - LEAVE_U) * TAU_K;
    const lowSun = lookName === 'dawn' || lookName === 'evening';
    const hero = await buildHero(ctx, { palette: PAL, count: Math.min(66, Math.round(62 * density / 2) * 2), leavers: 12, hour: LK.hero, weather: LK.weather || (windy ? 'wind' : 'still'), season: thaw ? 'thaw' : 'winter',
      lineZ: ZC, exit: [E.x, E.y, E.z], camX0: CAM0, leaveSeconds, roost: rare ? 44 : 0, rate: 1, extraPairs, extraGround, extraDetail: 0.85, lineDist: lineD,
      shadowLen: lowSun ? 3.4 : lookName === 'morning' ? 2.8 : lookName === 'moon' ? 2.2 : 0.45, shadowK: lowSun ? 1 : lookName === 'morning' ? 0.9 : lookName === 'moon' ? 0.7 : 0.5 });      // no sun (snowfall, blue hour): only the dark patch at the feet
    scene.add(hero.object);
    const HS = hero.shared;
    if (HS.uRose && HS.uViolet) { HS.uRose.value.copy(col(LK.stB[0])); HS.uViolet.value.copy(col(LK.stA[0])); }     // the bar's own steam takes the hour's colours
    await ctx.yield();


    // ---- light and steam: one set of uniforms shared by the hero and everything here
    const sunDir = HS.uSunDir.value;
    const setSun = (el) => { const e = el * Math.PI / 180, ch = Math.cos(e); sunDir.set(Math.cos(sunAz) * ch, Math.sin(e), Math.sin(sunAz) * ch); };
    setSun(LK.el > 0 ? LK.el : 2);
    HS.uSunCol.value.copy(col(LK.sun[0], LK.sun[1])).lerp(col(WM.gold, LK.sun[1] * 1.1), 0.6 * WM.k);      // the key itself goes to gold with the low sun
    HS.uSky.value.copy(col(LK.sky[0], LK.sky[1]));
    HS.uGround.value.copy(col(LK.sky[0])).lerp(col(PAL[2]), snowing ? 0.1 : 0.4).multiplyScalar(0.5 * LK.sky[1]);
    HS.uRimCol.value.copy(HS.uSunCol.value).multiplyScalar(1 - WM.k).add(col(WM.gold, 1.6 * WM.k));      // the light on an edge turned to the sun: the second colour (the key itself where the look has none)
    const LIGHTU = { uSunDir: HS.uSunDir, uSunCol: HS.uSunCol, uSky: HS.uSky, uGround: HS.uGround, uRimCol: HS.uRimCol };
    const steamK = LK.dens * (windy ? 0.6 : 1), stB0 = col(LK.stB[0], LK.stB[1]), stB1 = stB0.clone().lerp(col(PAL[3], LK.stB[1]), lookName === 'dawn' ? 0.5 : 0);
    // the banks: the first three stand behind the things they light. The first is long and narrow and stands IN THE GALLERY of the left bank
    // below the islet, 7 m behind the water's edge: the trees at the water stand dark against it, and the reach in front of it (the islet's
    // tail, its roost, the river) is in clear air.
    // The last two lie ACROSS our course and we fly through them: bank A at u 0.32, where the swans turn to blue shapes in rose-lit smoke and come
    // back, and the last bank, which ends at the head of the bar and parts on the dance. Each is a soft ellipsoid about 24 m through along our
    // line (under 2.5 s inside it), lying on the water: densest at the surface, 0.7 of that at the eye (2 m up), a tenth at 5 m. At its heart a
    // level ray at eye height loses 1.5 optical depths in 25 m at most, so a swan 25 m ahead is still a blue shape and the trees stand over it.
    const D_BANKA = 0.32 * L, D_BANKZ = 0.664 * L;
    const bankW = [toWorld(D_ISLET + 24, sL(D_ISLET + 24) - 7), toWorld(SHOALS[1].d, -28), toWorld(D_POOL + 15, -34), toWorld(D_BANKA, 0.5), toWorld(D_BANKZ, -1)],
      bankR = [[14, 7, 4], [32, 6, 8], [18, 6.5, 14], [12.5, 3.1, 17], [11, 3.1, 15]], bankK = [0.05, 0.028, 0.05, 0.088, 0.088];
    const STU = {
      uStSun: HS.uSunDir, uStA: { value: col(LK.stA[0], LK.stA[1]) }, uStB: { value: stB0.clone() }, uStScat: { value: col(LK.sun[0], LK.sun[1] * LK.scat) },
      uStFar: { value: col(LK.far) }, uStFarS: { value: col(LK.farS) }, uStP: { value: new THREE.Vector4(0.008 * steamK, windy ? 1.5 : 2.5, 0.001, 0) },
      uStBk: { value: bankW.map((w, i) => new THREE.Vector4(w[0], i > 2 ? 0.2 : i ? 1.4 : 2.0, w[1], Math.min(bankK[i] * Math.max(steamK, 0.6), 0.1))) },
      uStBr: { value: bankR.map((r) => new THREE.Vector3(1 / r[0], 1 / (windy ? r[1] * 0.5 : r[1]), 1 / r[2])) },
      uStGold: { value: col(WM.gold, 0.9 * WM.k) },
    };
    const SKYU = { uZen: { value: col(LK.zen) }, uHorS: { value: col(LK.horS) }, uHorA: { value: col(LK.horA) }, uBelt: { value: col(LK.belt) }, uSlate: { value: col(LK.slate) },
      uSunC: { value: col(LK.sun[0], 1.3) }, uSkyK: { value: new THREE.Vector4(LK.glow, LK.stars, LK.over, 0) },
      uGold: { value: col(WM.gold) }, uSunK: { value: new THREE.Vector4(WM.k * WM.disc, WM.k, WM.k, WM.k) } };
    const mat = (vs, fs, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...LIGHTU, ...STU, uTime: HS.uTime, uPx: HS.uPx, ...uniforms }, ...extra });
    scene.fog = new THREE.FogExp2(col(LK.far).lerp(col(LK.farS), 0.4), 0.0024);
    hero.object.traverse((o) => { if (o.material) steamPatch(o.material, STU); });
    // two real lights, only for rides and companions that join the scene
    const dirLight = new THREE.DirectionalLight(col(LK.sun[0]), 2.6 * LK.sun[1]); dirLight.position.copy(sunDir).multiplyScalar(200); scene.add(dirLight);
    scene.add(new THREE.HemisphereLight(col(LK.sky[0]), col(LK.sky[0]).lerp(col(PAL[2]), 0.4).multiplyScalar(0.5), 1.6 * LK.sky[1]));

    // ---- sky
    const deepU = { value: col(LK.deep[0], LK.deep[1]).add(HS.uSky.value.clone().multiplyScalar(0.018)).add(col(LK.zen).multiplyScalar(0.055)) };     // deep indigo, never crushed to nothing
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14), new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: { ...STU, ...SKYU, uSunDir: HS.uSunDir, uDeep: deepU, uSky: HS.uSky }, side: THREE.BackSide, depthWrite: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

    // ---- land: both banks from the water's edge to the hill crests, one mesh in river space
    const landMat = mat(LAND_VERT, LAND_FRAG, { uLand: { value: new THREE.Vector4(thaw ? 1 : 0, LK.el > 0 && !snowing ? (lookName === 'moon' ? 0.5 : 0.8) : 0.0, snowing ? 0.2 : 1, 0) }, uShadowC: { value: col(PAL[4], 0.5) } });
    { const TS = [-1.4, 0, 0.3, 0.6, 1.0, 1.5, 2.2, 3.2, 4.6, 6.5, 9, 12, 16, 21, 28, 37, 49, 65, 86, 115, 155, 205, 265, 335, 410, 550, 700, 1000], NT = TS.length;
      const pos = new Float32Array((NROW + 1) * NT * 2 * 3), idx = [], w = [0, 0];
      for (let sd = 0; sd < 2; sd++) for (let i = 0; i <= NROW; i++) { if ((i & 31) === 0) await ctx.yield();   // a breath every 32 rows
        const d = D0 + i * STEP, edge = sd ? sR(d) : sL(d);
        for (let k = 0; k < NT; k++) { const s = sd ? edge + TS[k] : edge - TS[k], o = ((sd * (NROW + 1) + i) * NT + k) * 3; toWorld(d, s, w); pos[o] = w[0]; pos[o + 1] = hgt(d, s); pos[o + 2] = w[1]; } }
      await ctx.yield();
      for (let sd = 0; sd < 2; sd++) for (let i = 0; i < NROW; i++) for (let k = 0; k < NT - 1; k++) { const a = (sd * (NROW + 1) + i) * NT + k, b = a + NT, c = b + 1, e = a + 1; if (sd) idx.push(a, e, c, a, c, b); else idx.push(a, b, c, a, c, e); }
      await ctx.yield();
      // the normals from the grid itself (each vertex from its four neighbours along and across the river), a breath every 32 rows
      const nor = new Float32Array(pos.length), RS = NT * 3;
      for (let sd = 0; sd < 2; sd++) for (let i = 0; i <= NROW; i++) { if ((i & 31) === 0) await ctx.yield();
        for (let k = 0; k < NT; k++) { const o = ((sd * (NROW + 1) + i) * NT + k) * 3, a1 = o + (i < NROW ? RS : 0), a0 = o - (i > 0 ? RS : 0), b1 = o + (k < NT - 1 ? 3 : 0), b0 = o - (k > 0 ? 3 : 0);
          const ax = pos[a1] - pos[a0], ay = pos[a1 + 1] - pos[a0 + 1], az = pos[a1 + 2] - pos[a0 + 2], bx = pos[b1] - pos[b0], by = pos[b1 + 1] - pos[b0 + 1], bz = pos[b1 + 2] - pos[b0 + 2];
          let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
          const nl = Math.hypot(nx, ny, nz) || 1; nor[o] = nx / nl; nor[o + 1] = ny / nl; nor[o + 2] = nz / nl; } }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
      await ctx.yield();
      const land = new THREE.Mesh(g, landMat); land.frustumCulled = false; scene.add(land); }
    await ctx.yield();

    // ---- islets and shoals: their meshes
    for (const m of [M0, ...ARCH, ...SHOALS, ...STEPS]) {
      const NA = 26, RR = [0, 0.28, 0.52, 0.72, 0.88, 1.0, 1.12, 1.3], pos = [], idx = [];
      for (const r of RR) for (let j = 0; j < NA; j++) { const an = (j / NA) * 6.283, k = r * (1 + 0.08 * n2(Math.cos(an) * 2 + m.c[0], Math.sin(an) * 2 + 4)), a = Math.cos(an) * m.HL * k, b = Math.sin(an) * m.HW * k, q = m.W(a, b); pos.push(q[0], m.Y(a, b), q[1]); }
      for (let i = 0; i < RR.length - 1; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA; idx.push(a, b + NA, a + NA, a, b, b + NA); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      faceUp(g); scene.add(new THREE.Mesh(g, landMat));
      await ctx.yield();
    }
    await ctx.yield();
    // ---- the far ridges that close the valley in every direction, blue behind the haze
    { const NA = 120, RR = [[1000, 0], [1380, 0.5], [1560, 1], [1800, 0.55], [2100, 0]], pos = [], idx = [], NR = RR.length;
      // (toward the sunrise the ring is low too: a saddle 48 degrees wide about the bearing on which the sun's rays come down the whole reach)
      const aSun = Math.atan2(-1410, 380);
      for (let j = 0; j <= NA; j++) { const a = (j / NA) * 6.2832, ca = Math.cos(a), sa = Math.sin(a), da = Math.abs(Math.atan2(Math.sin(a - aSun), Math.cos(a - aSun)));
        const h = (150 + 75 * n2(ca * 2.2, sa * 2.2 + 40) + 34 * n2(ca * 7, sa * 7 + 9)) * (1 - (1 - SUN_GAP) * (1 - sstep(0.42, 0.78, da)));
        for (const [r, k] of RR) pos.push(-150 + ca * r, k > 0 ? h * k : 2, 20 + sa * r); }
      for (let j = 0; j < NA; j++) for (let k = 0; k < NR - 1; k++) { const a = j * NR + k, b = a + NR; idx.push(a, a + 1, b + 1, a, b + 1, b); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      faceUp(g); const m = new THREE.Mesh(g, landMat); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // ---- the river
    const waterU = { ...SKYU, uIslet: { value: [M0, ...ARCH, ...SHOALS, ...STEPS].map((m) => new THREE.Vector4(m.c[0], m.c[1], m.HL * 0.98, m.HW * 0.98)) }, uIsletDir: { value: [M0, ...ARCH, ...SHOALS, ...STEPS].map((m) => new THREE.Vector2(m.tx, m.tz)) },
      uRif: { value: Array.from({ length: NRIF }, (_, i) => { const r = RIFS[i] || [-999, 0, 1, 1]; return new THREE.Vector4(r[0], r[1], r[2], r[3]); }) },
      uWat: { value: new THREE.Vector4(thaw ? 0 : 1, thaw ? 0.35 : 1, lookName === 'moon' ? 1.6 : snowing ? 0.3 : 1, 1) }, uDeep: deepU,
      uSkin: { value: new THREE.Vector4(0.075 * clamp(steamK, 0.45, 1.15), 0, 0, 0) }, uIce: { value: new THREE.Vector4(WM.k * 0.8, WM.k, 0, 0) }, uGal: { value: null }, uGalR: { value: new THREE.Vector2(D0, 1 / (D1 - D0)) }, uBar: { value: new THREE.Vector4(48, 7.5, 0, 0) },
      uFrostL: { value: HS.uSunCol.value.clone().multiplyScalar(0.34).add(HS.uSky.value.clone().multiplyScalar(0.5)) },      // back-lit bank: cool fur, a little glow
      uFrostR: { value: HS.uSunCol.value.clone().multiplyScalar(0.62).add(HS.uSky.value.clone().multiplyScalar(0.42)) } };   // front-lit bank: rose-gold
    { const NW = 15, pos = new Float32Array((NROW + 1) * NW * 3), af = new Float32Array((NROW + 1) * NW * 4), at = new Float32Array((NROW + 1) * NW * 2), idx = [], w = [0, 0];
      for (let i = 0; i <= NROW; i++) { if ((i & 63) === 0) await ctx.yield();
        const d = D0 + i * STEP, l = sL(d), r = sR(d);
        for (let j = 0; j < NW; j++) { const s = mix(l - 1.6, r + 1.6, j / (NW - 1)), o = i * NW + j; toWorld(d, s, w); pos[o * 3] = w[0]; pos[o * 3 + 1] = 0; pos[o * 3 + 2] = w[1]; af[o * 4] = d; af[o * 4 + 1] = s; af[o * 4 + 2] = s - l; af[o * 4 + 3] = r - s; at[o * 2] = NZ[i]; at[o * 2 + 1] = -NX[i]; } }
      for (let i = 0; i < NROW; i++) for (let j = 0; j < NW - 1; j++) { const a = i * NW + j, b = a + NW; idx.push(a, a + 1, b + 1, a, b + 1, b); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aF', new THREE.BufferAttribute(af, 4)); g.setAttribute('aT', new THREE.BufferAttribute(at, 2)); g.setIndex(idx);
      const water = new THREE.Mesh(g, mat(WATER_VERT, WATER_FRAG, waterU)); water.frustumCulled = false; scene.add(water); }
    await ctx.yield();

    // ---- hoarfrosted gallery: willows, alders, snags (instanced ribbons), reeds, tussocks
    const uAld = { value: new THREE.Vector4(0, -500, 0, 1) }, ribMat = mat(RIB_VERT, RIB_FRAG, { uWind: { value: windy ? 3 : 1 }, uFrost: { value: thaw ? 0.62 : 1 }, uAld, uWarm: { value: WM.k } }, { side: THREE.DoubleSide });
    const tr = rng.fork('trees'), spare = [];
    const variant = (fn, h, det, o) => { const R = ribbonSet(); fn(R, tr, h, det, o); const g = R.build(); g.userData.h = h; g.userData.reach = (fn === willow ? 0.65 : 0.36) * h; spare.push(g); return g; };
    const nearV = [], farV = [];
    for (const [fn, h, o] of [[willow, 11], [willow, 13, { per: 2 }], [alder, 9], [alder, 11.5], [snag, 7]]) { nearV.push(variant(fn, h, 1, o)); await ctx.yield(); }
    for (const [fn, h] of [[willow, 12], [alder, 10], [alder, 12]]) { farV.push(variant(fn, h, 0)); await ctx.yield(); }
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0);
    // place instances of several geometries, split into chunks along the river so that far ones are culled
    const scatterInst = (geos, items, material, chunks) => {
      const lo = D0, span = D1 - D0;
      for (let c = 0; c < chunks; c++) geos.forEach((g, vi) => {
        const mine = items.filter((it) => it.v === vi && clamp(Math.floor(((it.d - lo) / span) * chunks), 0, chunks - 1) === c); if (!mine.length) return;
        const im = new THREE.InstancedMesh(g, material, mine.length);
        mine.forEach((it, i) => { q4.setFromAxisAngle(YA, it.yaw); s4.set(it.sx ?? it.sc, it.sy ?? it.sc, it.sx ?? it.sc); p4.set(it.x, it.y, it.z); im.setMatrixAt(i, m4.compose(p4, q4, s4)); });
        im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.boundingSphere.radius += 8; scene.add(im);
        const k = spare.indexOf(g); if (k >= 0) spare.splice(k, 1);
      });
    };
    const xHero = (d) => d - dOfX(0), wv = [0, 0];
    const nearT = [], farT = [], taken = [], leanT = [];
    const free = (x, z, r) => taken.every((t) => (t[0] - x) ** 2 + (t[1] - z) ** 2 > (r + t[2]) ** 2);
    const tryTree = (list, geos, d, sd, t, v, sc, r) => {
      const clear = 6.5 + geos[v].userData.reach * sc;
      for (let k = 0; k < 3; k++, t += 3.5) {
        const s = sd > 0 ? sR(d) + t : sL(d) - t; toWorld(d, s, wv);
        if (path.nearestXZ(wv[0], wv[1]).dist < clear || !free(wv[0], wv[1], r)) continue;
        taken.push([wv[0], wv[1], r]); list.push({ v, d, x: wv[0], y: hgt(d, s) - 0.15, z: wv[1], yaw: tr.range(0, 6.28), sc, sd, t, h: geos[v].userData.h * sc, reach: geos[v].userData.reach * sc }); return true;
      }
      return false;
    };
    for (let sd = -1; sd <= 1; sd += 2) for (let d = -70; d < L + 120; d += 16.5) {            // the trees at the water's edge
      await ctx.yield();
      const dd = d + tr.range(-5, 5), x = xHero(dd), behindBar = sd < 0 && x > -66 && x < 66;
      let t = behindBar ? tr.range(13.5, 20) : 1.6 + Math.abs(tr.gauss()) * 3.5; if (x > 28 && !behindBar) t += 5;
      const r = tr(), v0 = r < 0.34 ? 0 : r < 0.56 ? 1 : r < 0.76 ? 2 : r < 0.94 ? 3 : 4;
      const v = dd > -25 && dd < 80 ? (sd < 0 ? (dd < 46 ? 0 : 3) : (dd < 52 ? 1 : 0)) : v0;        // the entry reach: willows on both banks, the islet alder between them
      // a willow at the water's edge of the left bank is not a copy: it is grown where it stands, leaning out over the river (below)
      if (tryTree(nearT, nearV, dd, sd, t, v, tr.range(0.82, 1.18), 3.2) && sd < 0 && !behindBar && v < 2) { const it = nearT[nearT.length - 1]; it.v = -1; leanT.push(it); }
    }
    for (let i = 0; i < 9; i++) tryTree(nearT, nearV, dOfX(-60 + i * 15 + tr.range(-4, 4)), -1, tr.range(12.5, 24), tr.int(0, 3), tr.range(0.9, 1.25), 2.8);   // a frosted wall behind the dance
    const nFar = Math.round(150 * (0.6 + 0.4 * detail));
    for (let i = 0, guard = 0; i < nFar && guard < 4000; guard++) {
      if ((guard & 15) === 0) await ctx.yield();
      const sd = tr.sign(), d = tr.range(D0 + 30, D1 - 20), copse = tr() < 0.22;
      let t = copse ? tr.range(80, 420) : 7 + Math.pow(tr(), 1.5) * 68; if (sd < 0 && Math.abs(xHero(d)) < 70) t += 16;
      if (copse && n2(d * 0.01, t * 0.01 * sd + 30) < 0.1) continue;
      if (tryTree(farT, farV, d, sd, t, tr.int(0, 2), tr.range(0.8, 1.35), 2.2)) i++;
    }
    await ctx.yield();
    scatterInst(nearV, nearT, ribMat, 5);
    await ctx.yield();
    scatterInst(farV, farT, ribMat, 4);
    await ctx.yield();
    // THE LEANING WILLOWS: every willow at the water's edge of the left bank leans out over the river, by 14 to 31 degrees, a little up or down
    // the stream (each lean and each tree's own shape from one stream of its own). Limbs and withies end where they would come within 6.4 and
    // 6.1 m of our line, so where the bank runs close the withy tips go by 6 m overhead.
    { const lw = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':lean')), sets = [];
      for (const it of leanT) {
        await ctx.yield();
        const c = clamp(Math.floor(((it.d - D0) / (D1 - D0)) * 5), 0, 4), R = sets[c] || (sets[c] = ribbonSet()), i = clamp(Math.round((it.d - D0) / STEP), 0, NROW);
        const lean = lw.range(0.25, 0.6), az = Math.atan2(NX[i], NZ[i]) + lw.range(-0.45, 0.45), off = path.nearestXZ(it.x, it.z).dist;
        const A = { add: (pts, r0, ...rest) => { const lim = r0 > 0.02 ? 6.4 : 6.1, out = [];
          for (const q0 of pts) { const q = [it.x + q0[0], it.y + q0[1], it.z + q0[2]];
            if (out.length && off - Math.hypot(q0[0], q0[2]) < lim + 0.3 && path.distanceTo(q[0], q[1], q[2]) < lim) break; out.push(q); }
          if (out.length > 1) R.add(out, r0, ...rest); } };
        willow(A, lw, it.h, 1, { leanAz: az, lean });
      }
      for (const R of sets) if (R) { await ctx.yield(); scene.add(new THREE.Mesh(R.build(), ribMat)); } }
    await ctx.yield();
    // the mirror's height map: how tall the frosted gallery stands at each metre of each bank (rows 0-1 left, 2-3 right)
    { const GW = 1024, gd = new Uint8Array(GW * 4 * 4), gh = [new Float32Array(GW), new Float32Array(GW)], gv = [new Float32Array(GW), new Float32Array(GW)], per = (D1 - D0) / GW;
      for (const it of [...nearT, ...farT]) { if (it.t > 34) continue; const k = it.sd > 0 ? 1 : 0, hw = Math.max(it.reach, 2.2), c = (it.d - D0) / per, n = Math.ceil(hw / per), near = 1 - 0.5 * sstep(8, 34, it.t), tone = 0.35 + 0.65 * tr();
        for (let j = -n; j <= n; j++) { const i = Math.round(c) + j; if (i < 0 || i >= GW) continue; const q = (j * per) / hw, hh = it.h * near * Math.pow(Math.max(1 - q * q, 0), 0.9); if (hh > gh[k][i]) { gh[k][i] = hh; gv[k][i] = tone; } } }
      for (let k = 0; k < 2; k++) for (let row = 0; row < 2; row++) for (let i = 0; i < GW; i++) { const o = ((k * 2 + row) * GW + i) * 4; gd[o] = Math.round(clamp(gh[k][i] / 22, 0, 1) * 255); gd[o + 1] = Math.round(gv[k][i] * 255); gd[o + 3] = 255; }
      const galTex = new THREE.DataTexture(gd, GW, 4, THREE.RGBAFormat, THREE.UnsignedByteType); galTex.magFilter = galTex.minFilter = THREE.LinearFilter; galTex.wrapS = galTex.wrapT = THREE.ClampToEdgeWrapping; galTex.generateMipmaps = false; galTex.needsUpdate = true;
      waterU.uGal.value = galTex; }
    await ctx.yield();

    // specimens built in place: the leaning islet alder, the eagle's snag, the two willows of the arch
    const special = ribbonSet(), sp = rng.fork('special');
    const shifted = (x, y, z, yaw = 0) => { const c = Math.cos(yaw), s = Math.sin(yaw); return { add: (pts, ...rest) => special.add(pts.map((p) => [x + p[0] * c + p[2] * s, y + p[1], z - p[0] * s + p[2] * c]), ...rest) }; };
    const alderY = isletY(0, 0), alderFall = [];
    await ctx.yield();
    const leanAz2 = Math.atan2(itx * 0.55 - itz * 0.45, itz * 0.55 + itx * 0.45), LEAN2 = 0.28;           // leaning downstream and toward the path
    uAld.value.set(isl[0] + Math.sin(leanAz2) * LEAN2 * 9.5, alderY + 11.5, isl[1] + Math.cos(leanAz2) * LEAN2 * 9.5, 10.5);
    await alderHero(shifted(isl[0], alderY, isl[1]), rng.fork('alder'), 19, { leanAz: leanAz2, lean: LEAN2, curve: -0.2, thick: 1.5, fall: alderFall, yield: ctx.yield,
      ok: (q) => path.distanceTo(isl[0] + q[0], alderY + q[1], isl[1] + q[2]) > 8.2, clear: (q) => path.distanceTo(isl[0] + q[0], alderY + q[1], isl[1] + q[2]) > 6.2 });
    await ctx.yield();
    const D_SNAG = 0.562 * L + 4.7, SNAG_S = 10, snagW = toWorld(D_SNAG, SNAG_S), fs = clamp(Math.round((D_SNAG - D0) / STEP), 0, NROW);
    const boughEnd = snag(shifted(snagW[0], 0, snagW[1]), sp, 7.2, 2, { bough: [-NX[fs] * 0.9 - NZ[fs] * 0.3, -NZ[fs] * 0.9 + NX[fs] * 0.3] });
    const perch = new THREE.Vector3(snagW[0] + boughEnd[0], boughEnd[1], snagW[1] + boughEnd[2]);
    for (const side of [-1, 1]) {                                  // two leaning boles that follow the ring round and cross above it
      await ctx.yield();
      const ax = AX, bz = ZC + side * 9.7, RA = 9.6, bole = [[ax, -0.4, ZC + side * 9.9], [ax + 0.15, 2.4, ZC + side * 9.75], [ax, 5.0, ZC + side * 9.65]];
      for (let i = 0; i <= 9; i++) { const ph = (i / 9) * (Math.PI / 2 + 0.2), r = RA + 0.3 * n2(i * 0.7, side * 3); bole.push([ax + side * 0.25 + 0.4 * n2(i * 0.5, side * 5), E.y + r * Math.sin(ph), ZC + side * r * Math.cos(ph)]); }
      special.add(bole, 0.66, 0.26, 0.03, 0.6, 0, 0, side, 0);
      // withies never hang into the opening: over it they stop above the ring
      const hang = (q, n, i) => { const dz = Math.abs(q[2] - ZC), floor = dz < 7.7 ? E.y + Math.sqrt(7.7 * 7.7 - dz * dz) + 0.2 : 0.8;
        for (let w = 0; w < n; w++) withy(special, sp, [q[0] + sp.range(-0.3, 0.3), q[1], q[2] + sp.range(-0.3, 0.3)], sp.range(2, 5.5), [0, side], i + w + side, 0.03, floor); };
      for (let i = 0; i < 16; i++) {                                                         // limbs outward and up, arching over
        const p = bole[sp.int(3, 11)], az = sp.range(-1.1, 1.1), rz = clamp(side * (p[2] - ZC) / RA, 0, 1), ry = clamp((p[1] - E.y) / RA, 0, 1);
        const lm = limb(sp, p, [Math.sin(az) * 0.8, ry * 0.8 + sp.range(0.1, 0.5), side * (rz * 0.8 + 0.25)], sp.range(4, 8), 6, sp.range(1.0, 1.6), 0.07);
        special.add(lm, 0.12, 0.02, 0.03, 0.85, 0, 0.12, i + side, 0); for (let k = 1; k < lm.length; k++) hang(lm[k], 4, i);
      }
      const fork = limb(sp, [ax - 0.7, -0.4, bz + side * 0.7], [0.3, 1, side * 0.5], 10.5, 6, 0.5, 0.04);     // a second stem leaning out from the same stool
      special.add(fork, 0.4, 0.08, 0.03, 0.6, 0, 0.05, side * 2, 0);
      for (let i = 0; i < 7; i++) { const p = fork[sp.int(2, 6)], az = sp.range(-1.4, 1.4);
        const lm = limb(sp, p, [Math.sin(az), sp.range(0.2, 0.8), side * (0.2 + 0.8 * Math.cos(az))], sp.range(3, 5.5), 5, sp.range(1.0, 1.6), 0.07);
        special.add(lm, 0.07, 0.015, 0.03, 0.85, 0, 0.14, i + side * 3, 0); for (let k = 1; k < lm.length; k++) hang(lm[k], 3, i + 20); }
      for (let i = 0; i < 44; i++) { const j = sp.int(3, 11), p = bole[j], q = bole[j + 1], t = sp(); hang([mix(p[0], q[0], t), mix(p[1], q[1], t), mix(p[2], q[2], t)], 1, i); }
    }
    await ctx.yield();
    { const m = new THREE.Mesh(special.build(), ribMat); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // reeds in buff stands along the banks, on the islet and the shoals; snow-capped sedge tussocks at the water's edge
    const rr = rng.fork('reeds'), reedV = [0, 1, 2].map(() => { const R = ribbonSet(); reedClump(R, rr, 7); const g = R.build(); spare.push(g); return g; }), reeds = [], tuss = [];
    const nReed = Math.round(340 * (0.5 + 0.5 * detail) * density);
    for (let i = 0, guard = 0; i < nReed && guard < 6000; guard++) {
      if ((guard & 31) === 0) await ctx.yield();
      const sd = rr.sign(), d = rr.range(-60, L + 30), x = xHero(d); if (n2(d * 0.035, sd * 17) < -0.25 && rr() < 0.85) continue;
      if (sd < 0 && x > -64 && x < 64) continue;
      const t = rr.range(-2.2, 1.6), s = sd > 0 ? sR(d) + t : sL(d) - t; toWorld(d, s, wv); if (path.nearestXZ(wv[0], wv[1]).dist < 6.6) continue;
      reeds.push({ v: rr.int(0, 2), d, x: wv[0], y: Math.max(hgt(d, s), 0.0), z: wv[1], yaw: rr.range(0, 6.28), sc: rr.range(0.8, 1.2) }); i++;
    }
    // reeds on the islands stand at least 7 m from our line (their heads reach 1 m out): one that would stand nearer slides outward across its island
    const slideOut = (m, a, b) => { const out = m.s > 0 ? 1 : -1; let q = m.W(a, b); for (let k = 0; k < 16 && path.nearestXZ(q[0], q[1]).dist < 7.0; k++) { b += out * 0.25; q = m.W(a, b); } return [q, b]; };
    for (let i = 0; i < 16; i++) { const a = rr.range(-IHL * 0.8, IHL * 0.8), [q, b] = slideOut(M0, a, rr.range(-IHW * 0.7, IHW * 0.7)); reeds.push({ v: i % 3, d: D_ISLET, x: q[0], y: Math.max(isletY(a, b), 0), z: q[1], yaw: rr.range(0, 6.28), sc: rr.range(0.8, 1.15) }); }
    for (let i = 0; i < 26; i++) { const d = rr.range(-10, 70), sd = rr.sign(), s = sd * rr.range(6.8, 9.5); toWorld(d, s, wv); reeds.push({ v: i % 3, d, x: wv[0], y: 0, z: wv[1], yaw: rr.range(0, 6.28), sc: rr.range(0.75, 1.1) }); }
    for (let i = 0; i < 7; i++) reeds.push({ v: i % 3, d: D_SNAG, x: snagW[0] + rr.range(-1.2, 1.2), y: 0, z: snagW[1] + rr.range(0.2, 1.6), yaw: rr.range(0, 6.28), sc: rr.range(0.7, 1) });
    for (const m of ARCH) for (let i = 0; i < 9; i++) { const a = rr.range(-m.HL * 0.8, m.HL * 0.8), b = rr.range(-m.HW * 0.6, m.HW * 0.6), q = m.W(a, b); reeds.push({ v: i % 3, d: L, x: q[0], y: Math.max(m.Y(a, b), 0), z: q[1], yaw: rr.range(0, 6.28), sc: rr.range(0.7, 1.05) }); }
    const xs = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':shoals'));
    for (const m of SHOALS) { const out = m.s > 0 ? 1 : -1;
      for (let i = 0; i < 9; i++) { const a = m.HL * (i < 5 ? xs.range(0.82, 0.96) : -xs.range(0.86, 0.96)), [q, b] = slideOut(m, a, out * xs.range(0.1, 0.5) * m.HW * 0.4); reeds.push({ v: i % 3, d: m.d, x: q[0], y: Math.max(m.Y(a, b), 0), z: q[1], yaw: xs.range(0, 6.28), sc: xs.range(0.6, 0.85) }); }
      for (let i = 0, nt = Math.round(14 * m.HL / 15); i < nt; i++) { const far = i % 3 !== 2, a = xs.range(-0.92, 0.92) * m.HL, b = (far ? out : -out) * m.HW * Math.sqrt(Math.max(1 - (a / m.HL) ** 2, 0)) * xs.range(0.86, 1.0), q = m.W(a, b);
        tuss.push({ v: 0, d: m.d, x: q[0], y: -0.02, z: q[1], yaw: 0, sx: far ? xs.range(0.22, 0.38) : xs.range(0.14, 0.22), sy: far ? xs.range(0.22, 0.36) : xs.range(0.14, 0.2) }); } }
    for (const m of STEPS) {
      for (let i = 0; i < 4; i++) { const a = xs.range(-0.7, 0.7) * m.HL, [q, b] = slideOut(m, a, xs.range(-0.4, 0.4) * m.HW); reeds.push({ v: i % 3, d: m.d, x: q[0], y: Math.max(m.Y(a, b), 0), z: q[1], yaw: xs.range(0, 6.28), sc: xs.range(0.55, 0.85) }); }
      for (let i = 0; i < 7; i++) { const an = xs.range(0, 6.28), k = xs.range(0.55, 0.98), q = m.W(Math.cos(an) * m.HL * k, Math.sin(an) * m.HW * k); tuss.push({ v: 0, d: m.d, x: q[0], y: Math.max(m.Y(Math.cos(an) * m.HL * k, Math.sin(an) * m.HW * k), 0) - 0.04, z: q[1], yaw: 0, sx: xs.range(0.2, 0.38), sy: xs.range(0.2, 0.36) }); } }
    await ctx.yield();
    scatterInst(reedV, reeds, ribMat, 5);
    await ctx.yield();
    const nTus = Math.round(180 * (0.5 + 0.5 * detail));
    for (let i = 0; i < nTus; i++) { const sd = rr.sign(), d = rr.range(-60, L + 30), t = rr.range(-1.3, 0.5), s = sd > 0 ? sR(d) + t : sL(d) - t; toWorld(d, s, wv);
      if (sd < 0 && Math.abs(xHero(d)) < 62) continue; const r = rr.range(0.2, 0.4);
      tuss.push({ v: 0, d, x: wv[0], y: Math.max(hgt(d, s), 0) - 0.03, z: wv[1], yaw: rr.range(0, 6.28), sx: r, sy: rr.range(0.26, 0.44) }); }
    for (let i = 0; i < 10; i++) { const a = rr.range(0, 6.28), q = isletW(Math.cos(a) * IHL * 0.9, Math.sin(a) * IHW * 0.9); tuss.push({ v: 0, d: D_ISLET, x: q[0], y: 0, z: q[1], yaw: 0, sx: rr.range(0.2, 0.36), sy: rr.range(0.2, 0.34) }); }
    for (let i = 0; i < 5; i++) tuss.push({ v: 0, d: D_SNAG, x: snagW[0] + rr.range(-0.9, 0.9), y: -0.05, z: snagW[1] + rr.range(-0.9, 0.9), yaw: 0, sx: rr.range(0.35, 0.7), sy: rr.range(0.25, 0.4) });
    for (const m of ARCH) for (let i = 0; i < 9; i++) { const a = rr.range(0, 6.28), q = m.W(Math.cos(a) * m.HL * 0.92, Math.sin(a) * m.HW * 0.92); tuss.push({ v: 0, d: L, x: q[0], y: 0, z: q[1], yaw: 0, sx: rr.range(0.2, 0.36), sy: rr.range(0.2, 0.34) }); }
    await ctx.yield();
    { const tg = tussockGeometry(ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':tussock'))); spare.push(tg); scatterInst([tg], tuss, landMat, 3);
      await ctx.yield();
      const R = ribbonSet(); tussockBlades(R, rr, ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':tussock-hem'))); const bg = R.build(); spare.push(bg); scatterInst([bg], tuss, ribMat, 3); }
    await ctx.yield();

    // ---- cranes beyond the dance: the islet family, roosts in the shallows, threes on the wing
    const roost = [], hdTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
    const famP = isletW(-IHL - 1.3, 1.5), famLook = path.pointAt(0.02);
    for (const [k, da, db] of [[0, 0, -0.45], [1, 0.25, 0.45], [2, 1.5, 1.2]]) { const q = isletW(-IHL - 1.3 + da, 1.5 + db);
      roost.push({ rd: D_ISLET, x: q[0], y: -0.06, z: q[1], heading: hdTo(q[0], q[1], famLook.x, famLook.z) + (k < 2 ? Math.PI / 2 : 0.4), type: k < 2 ? 2 : 0, phase: 0.1, period: 6.5, scale: k === 2 ? 0.9 : k ? 1.03 : 0.97, c: k < 2 ? [0, 0, k, 0] : [1, 0, 0, 2] }); }
    // THE ROOSTS OF THE UPPER RIVER (the brief: thirty more stand in the shallows along the first 300 m in groups of three to six, several
    // asleep on one leg, families with a tawny-necked juvenile). ONE rule for the whole reach, dealt from the world's 'roost' stream: a group
    // every 35 to 45 m down the first 300 m, the first 20 to 30 m in: seven or eight groups of three to six, which come to about the
    // brief's thirty birds over the reach. Cranes roost on bars: a group whose place falls within 12 m of a bare gravel bar that no
    // group holds yet (the steps of the entry reach, the islet's tail) stands on that bar, along its crest, its nearest bird at the bar's
    // river edge. A bar that no group's place falls beside stays bare. Elsewhere the group's side is from
    // the stream, across the river from any islet, shoal or held bar beside it, and it has a gravel riffle of its own under its feet.
    // The nearest bird of a group is 5 to 9 m off our line (6.6 m at least beside the swans' water, where they sit before their run); the
    // others stand within 2.6 m of it along the stream and up to 3.2 m further out, 0.78 m apart at least. A group of four or more may hold
    // a pair that calls: the two stand side by side, 0.62 m apart, facing one way, and that way is from the stream (the hen on the cock's
    // one side; on his other side where the first would be nearer than 5 m to our line or another bird stands there already; where neither
    // side is free the group holds no pair and he stands as the others do).
    const roostG = [[], [], [], []], tailRoost = { n: 0, d0: 1e9, d1: -1e9, s: 0 };
    { const rg = rng.fork('roost'), bare = [...STEPS, SPIT], held = new Set(), mounds = [M0, ...SHOALS, ...STEPS], placed = [];
      const moundY = (x, z) => { let y = -0.06; for (const m of mounds) { const dx = x - m.c[0], dz = z - m.c[1], a = dx * m.tx + dz * m.tz, b = -dx * m.tz + dz * m.tx; if (Math.abs(a) < m.HL * 1.3 && Math.abs(b) < m.HW * 1.3) y = Math.max(y, m.Y(a, b)); } return y; };
      const sw0 = 0.02 * L + 14, sw1 = 0.02 * L + 15 + 6 * 4.4 + 5, w = [0, 0];
      for (let d = rg.range(20, 30); d < 300; d += rg.range(35, 45)) {
        let sd = rg.sign(), near = rg.range(5, 9), dg = d, half = 2.6, deep = 3.2, n = rg.int(3, 6);
        const fam = rg.chance(0.45), call = rg.chance(0.35), cph = rg(), chd = rg.range(0, 6.28), along = rg.range(-0.3, 0.3), mem = [];
        const bar = bare.find((m) => !held.has(m) && Math.abs(d - m.d) < m.HL + 12);
        if (bar) { held.add(bar); sd = bar.s > 0 ? 1 : -1;
          dg = bar.d + along * bar.HL; half = Math.min(bar.HL - 1.2, 1.2 * n);
          near = Math.max(5, Math.abs(bar.s) - 0.75 * bar.HW); deep = Math.min(3.2, Math.abs(bar.s) + 0.8 * bar.HW - near); }
        else if ([M0, SHOALS[0], SHOALS[1], SHOALS[2], ...bare].some((m) => m.s * sd > 0 && Math.abs(d - m.d) < m.HL + 6)) sd = -sd;
        if (dg > sw0 && dg < sw1) near = Math.max(near, 6.6);
        if (!bar) RIFS.push([dg, sd * (near + 1.3), 4.6, 2.5]);
        const list = roostG[Math.min(3, Math.floor(dg / 75))]; let pairs = call && n > 3, cock = null, tries = 0;
        for (let guard = 0; mem.length < n && guard < 120; guard++) {
          const k = mem.length, caller = pairs && k < 2;
          let a = rg.range(-half, half), b = rg.range(0.3, deep); const r = rg(), hd = rg.range(0, 6.28), ph = rg(), per = rg.range(6, 10), sc = rg.range(0.95, 1.04), leg = rg.chance(0.5) ? 1 : 0;
          if (!k) b = 0;
          toWorld(dg + a, sd * (near + b), w);
          if (caller && k) {                                    // the hen, at the cock's side
            toWorld(dg + mem[0][0], sd * (near + mem[0][1]), w);
            const px = Math.cos(chd) * 0.62, pz = -Math.sin(chd) * 0.62, sg = (path.nearestXZ(w[0] + px, w[1] + pz).dist < 5 ? -1 : 1) * (tries ? -1 : 1);
            w[0] += sg * px; w[1] += sg * pz; const q = toRiver(w[0], w[1]); a = q[0] - dg; b = sd * q[1] - near; }
          else if (!mem.every((m) => Math.hypot(m[0] - a, m[1] - b) > 0.78)) continue;
          if (!placed.every((m, j) => (caller && k && j === placed.length - 1) || Math.hypot(m[0] - w[0], m[1] - w[1]) > 0.9) || Math.hypot(w[0] - dipP[0], w[1] - dipP[1]) < 1.6 || (caller && k && tries && path.nearestXZ(w[0], w[1]).dist < 5)) {
            if (caller && k && ++tries > 1) { pairs = false; cock.type = 0; cock.c = [0, 0, 0, 0]; }
            continue; }
          mem.push([a, b]); placed.push([w[0], w[1]]);
          if (bar === SPIT) { tailRoost.n++; tailRoost.d0 = Math.min(tailRoost.d0, dg + a); tailRoost.d1 = Math.max(tailRoost.d1, dg + a); tailRoost.s = sd * (near + 1); }
          const bird = { x: w[0], y: moundY(w[0], w[1]), z: w[1], heading: hd, type: 0, phase: ph, period: per, scale: sc, c: [leg, 0, k % 2, 0] };
          if (caller) { bird.type = 2; bird.heading = chd; bird.phase = cph; bird.period = 6.4; bird.scale = k ? 0.97 : 1.03; bird.c = [0, 0, k ? 0 : 1, 0]; if (!k) cock = bird; }
          else if (fam && k === n - 1) { bird.scale = 0.9; bird.c = [0, 0, 0, 2]; }
          else if (r < LK.sleep + 0.25) { bird.type = 5; bird.c = [0, leg, 0, 0]; }
          else if (r < LK.sleep + 0.5) { bird.type = 4; bird.c = [1, leg, 0, 0]; }
          list.push(bird);
        }
      }
      RIFS.forEach((r, i) => { if (i < NRIF) waterU.uRif.value[i].set(r[0], r[1], r[2], r[3]); });       // the roosts' riffles join the river's
    }
    // the look aside at the roost on the islet's tail, by our metres to the bar itself: it opens when the lens is 24 m short of the tail's head
    // and is closed where the lens comes to the tail's end. Where no crane stands on the tail there is no look.
    const tailLook = tailRoost.n ? { from: (SPIT.d - SPIT.HL - 24) / L, to: (SPIT.d + SPIT.HL) / L } : null;
    // THE WADERS AT THE BAR, scattered in river coordinates from a stream of their own, every one 5 m or more off our line: twenty-one on our
    // right, from 13 m above the head of the bar to its tail, two in three of them 5.1 to 7.4 m off the line (the long riffle, which lies 2.6
    // to 6.2 m off it, reaches only the nearest of these), the rest 7.9 to 9.6 m off it; eleven on our left in the shallows above the head
    // of the bar, 5.1 to 7.2 m off the line, between the ford and the first dancers.
    // Stance and heading from the stream: standing, preening, asleep on one leg, or two calling: these stand side by side, 0.62 m apart, both
    // facing the one way the stream gave them.
    const wd = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':waders')), waders = [];
    for (const [n, x0, x1, sgn] of [[21, -62, 46, 1], [11, -93, -61, -1]]) { const mem = [];
      for (let guard = 0; mem.length < n && guard < 400; guard++) {
        const x = mix(x0, x1, (mem.length + wd()) / n), s = sgn > 0 ? (wd() < 0.67 ? wd.range(5.1, 7.4) : wd.range(7.9, 9.6)) : wd.range(5.1, 7.2), r = wd(), hd = wd.range(0, 6.28), ph = wd(), per = wd.range(6, 10), sc = wd.range(0.98, 1.06), leg = wd.chance(0.5) ? 1 : 0;
        if (!mem.every((m) => Math.hypot(m[0] - x, m[1] - s) > 1.25)) continue;
        const pair = r > 0.8 && mem.length < n - 1 && s + 0.15 < (sgn > 0 ? 9.6 : 7.2), type = pair ? 2 : r < 0.4 ? 0 : r < 0.62 ? 4 : 5;
        toWorld(dOfX(x), sgn * s, wv);
        for (let k = 0; k < (pair ? 2 : 1); k++) { let wx = wv[0], wz = wv[1], xs = x, ss = s;
          if (k) { const px = Math.cos(hd) * 0.62, pz = -Math.sin(hd) * 0.62, sg = path.nearestXZ(wx + px, wz + pz).dist < 5 ? -1 : 1; wx += sg * px; wz += sg * pz; xs += sg * px; ss += sgn * sg * pz; }      // the hen, at the cock's side
          mem.push([xs, ss]);
          waders.push({ x: wx, y: -0.2, z: wz, heading: hd, type, phase: ph, period: pair ? 6.4 : per, scale: pair ? (k ? 0.97 : 1.03) : sc, c: type === 0 ? [1, 0, 0, 0] : pair ? [0, 0, 1 - k, 0] : [0, leg, 0, 0] }); }
      } }
    await ctx.yield();
    let wadeU = null;
    // the meshes. Each is one roost, or one reach of the roosts, with its bounds on the river: update() shows a mesh while the lens is within
    // range of those bounds and hides it beyond (cranes a river-bend away are not drawn)
    const lensP = new THREE.Vector3(), shown = [];
    const boundsOf = (list, pad) => { const B = [1e9, -1e9, 1e9, -1e9]; for (const b of list) { B[0] = Math.min(B[0], b.x - pad); B[1] = Math.max(B[1], b.x + pad); B[2] = Math.min(B[2], b.z - pad); B[3] = Math.max(B[3], b.z + pad); } return B; };
    const awayFrom = (B) => Math.hypot(Math.max(B[0] - lensP.x, 0, lensP.x - B[1]), Math.max(B[2] - lensP.z, 0, lensP.z - B[3]));
    for (const [list, lod, range] of [[roost, 0.66, 150], ...roostG.map((g) => [g, 0.85, 150]), [waders, 0.85, 150]]) { if (!list.length) continue;
      await ctx.yield();
      const m = makeCranes(ctx, list, { shared: HS, detail: lod }).object, B = boundsOf(list, 2); scene.add(m); shown.push([m, B, range]);
      // (these birds stand where they are: the mesh carries the sphere that holds them, so one that is astern of the lens is not drawn either)
      m.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3((B[0] + B[1]) / 2, 1, (B[2] + B[3]) / 2), Math.hypot(B[1] - B[0], B[3] - B[2]) / 2 + 3); m.frustumCulled = true; }
    const barB = [-62, 62, -12, ZC + 12], shoalB = [0, 1, 2].map((k) => boundsOf(extraPairs.filter((q) => q.g === k), 2.5));
    const wading = [...roost, ...waders, ...roostG.flat()];
    { const m = makeBreath(wading, HS, wd); steamPatch(m.material, STU); scene.add(m); }      // breath: a glowing puff at every note of the calling pairs, a slow one from every other bird
    await ctx.yield();
    // rings round every leg that stands in the river
    const WR = [], WU = [];
    for (const b of wading) if (b.y < 0.02) for (let k = 0; k < 2; k++) { WR.push(b.x + wd.range(-0.12, 0.12), b.z + wd.range(-0.12, 0.12), wd(), wd.range(0.9, 1.35) * (k ? 0.6 : 1)); WU.push(-1, 2); }
    // the small ones. The dipper stands on the ice rind of the second gravel step, 5.2 m right of our line 45 m in: it curtsies, dives and comes up
    // again on an eight second round. The fox trots the lip of the right bank downstream at 3.2 m a second, on world time: it comes out of the
    // trees at a place of its own on the right bank (dealt in metres from its own stream, anywhere between the islet and the ford), keeps the
    // lip for 150 m and slips back into the gallery; then it is on its round again.
    const crA = [new THREE.Vector4(), new THREE.Vector4()], crB = [new THREE.Vector4(0, 0, 0.9, 0), new THREE.Vector4(0, 0, 1.5, 0)];
    { const m = new THREE.Mesh(critterGeometry(), mat(CRIT_VERT, DEER_FRAG, { uCrA: { value: crA }, uCrB: { value: crB } }, { side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m); }
    WR.push(dipQ[0] * 0.45 + dipP[0] * 0.55, dipQ[1] * 0.45 + dipP[1] * 0.55, 0.37, 0.8); WU.push(-1, 2);
    const fxr = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':fox')), FOX_D = fxr.range(D_ISLET, D_FORD), FOX_LEN = 150, FOX_PH = fxr() * FOX_LEN;
    const updateSmall = (u, time) => {
      const run = (time * 3.2 + FOX_PH) % FOX_LEN, out = 1 - sstep(0, 9, run) * (1 - sstep(FOX_LEN - 9, FOX_LEN, run)), d = FOX_D + run, s = sR(d) + 1.7 + 7 * out; toWorld(d, s, wv);
      crA[0].set(wv[0], hgt(d, s) - 0.03, wv[1], hdAt(d) - Math.atan2(sR(d + 1.5) - sR(d - 1.5), 3)); crB[0].set(d * 9.0, 0.03 * Math.sin(d * 18.0), 0.9 * (1 - sstep(0.7, 1, out)), 0.012 * Math.abs(Math.sin(d * 9.0)));
      const c = (time / 8 + 0.1) % 1, under = sstep(0.56, 0.62, c) * (1 - sstep(0.9, 0.95, c)), bob = Math.max(Math.sin(time * 8.8), 0) * (1 - sstep(0.5, 0.56, c));
      crA[1].set(mix(dipP[0], dipQ[0], 0.45 * under), dipY - 0.16 * under, mix(dipP[1], dipQ[1], 0.45 * under), dipHd); crB[1].set(0, -0.25 * bob - 1.0 * under, 1.5 * (1 - sstep(0.6, 0.66, c) * (1 - sstep(0.9, 0.94, c))), -0.012 * bob);
    };
    // flyers: HT runs on world time (ambient loops, alive at u = 0), HU on u (they are overhead where the brief wants them). Their phases, sizes,
    // spacing and tucked legs are dealt from a stream of their own
    const fy = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':flyers'));
    const HT = { ...HS, uTau: { value: 0 } }, HU = { ...HS, uTau: { value: 0 } };
    const trio = (list, x, y, z, hd, off, len, arc) => { for (const [back, side, upo] of [[0, 0, 0], [2.6, 1.7, 0.5], [5.0, -1.6, -0.3]])
      list.push({ x: x - Math.sin(hd) * back + Math.cos(hd) * side, y: y + upo, z: z - Math.cos(hd) * back - Math.sin(hd) * side, heading: hd, type: 7, phase: fy(), period: 4, scale: fy.range(0.96, 1.04), c: [off, len, arc, fy.chance(0.4) ? 1 : 0] }); };
    const flyT = [], flyU = [];
    // threes leaving the roost cross the entry reach on the slant, right to left, one every three seconds: over our line 34 m in, 6.5 m up, so
    // whenever we arrive (or look in through the last world's ring) cranes are crossing the sky above the islet alder
    { const c = toWorld(34, 0), hd = Math.atan2(NZ[clamp(Math.round((34 - D0) / STEP), 0, NROW)], -NX[clamp(Math.round((34 - D0) / STEP), 0, NROW)]) + 0.62, LEN = 280;
      for (let k = 0; k < 7; k++) trio(flyT, c[0] - Math.sin(hd) * LEN * 0.5 + (k % 3 - 1) * 1.5, 4.3 + 0.5 * (k % 2), c[1] - Math.cos(hd) * LEN * 0.5, hd, 21 + 40 * k, LEN, 1.9); }
    // a string of n cranes on the u clock (HU: 529 m of flight per unit u, so we overhaul them slowly): its leader is at
    // river point (d, s) and height y when the camera is at uh, a fraction f along a straight track of len metres
    const string = (list, n, d, s, y, uh, turn, len, f, arc, clockU = DUR * VF) => { const w = toWorld(d, s), hd = hdAt(d) + turn, fx = Math.sin(hd), fz = Math.cos(hd), y0 = y - arc * Math.sin(Math.PI * f);
      const x0 = w[0] - fx * f * len, z0 = w[1] - fz * f * len, base = ((f * len - uh * clockU) % len + len) % len;
      for (let k = 0; k < n; k++) { const back = k * 2.7 + (k ? fy.range(-0.4, 0.4) : 0), side = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.5;
        list.push({ x: x0 + fz * side, y: y0 + fy.range(-0.3, 0.3) - 0.12 * k, z: z0 - fx * side, heading: hd, type: 7, phase: fy(), period: 4, scale: fy.range(0.96, 1.04), c: [(base - back + len) % len, len, arc, fy.chance(0.4) ? 1 : 0] }); } };
    const hdAt = (d) => { const f = clamp((d - D0) / STEP, 0, NROW - 0.001), i = Math.floor(f); return Math.atan2(NZ[i], -NX[i]); };
    if (lookName === 'evening') {                         // golden evening: the cranes come in to roost, strings of them over the river all the way down
      string(flyU, 6, 0.4 * L + 22, -5, 9.5, 0.4, 0.05, 340, 0.5, 2.5); string(flyU, 5, 0.4 * L + 28, 6.5, 12, 0.4, -0.04, 360, 0.45, 2);
      string(flyU, 7, 0.4 * L + 31, -1.5, 14.5, 0.4, 0.02, 380, 0.55, 3); string(flyU, 5, 0.12 * L + 26, 3, 11, 0.12, 0.03, 320, 0.5, 2);
      string(flyU, 6, 0.7 * L + 34, -9, 10.5, 0.7, -0.12, 300, 0.6, -2.5); string(flyU, 5, 0.93 * L + 30, 4, 15, 0.93, 0.0, 330, 0.5, 2);
    }
    string(flyU, 5, 0.43 * L + 15, -2.0, 3.7, 0.43, 0.36, 260, 0.5, 0.8);      // five cross our bow from right to left at u 0.43, 6-15 m ahead and a wing's length above our eye line
    // THE GUARD OF THE FIVE, by place (G2): the string is raised, all five alike, by just what keeps every bird of it FIVE_CLEAR from the flown
    // line over its whole course. A bird on the wing is held as a slab about its foot point, swept along its track: wings spread FLY_HALF to
    // either side, nothing of it lower than FLY_LOW above the foot (per unit of its scale: the rig's own reach over a whole wingbeat, 1.234 and
    // 0.487 as drawn), smaller toward the foot over the 30 m at each end of the track as the rig has it. The line is the path's own points
    // 0.25 m apart: every 2 m of route first, then every point about each place within 12 m of the track. No draw is taken.
    const FIVE_CLEAR = 2.3, FLY_HALF = 1.25, FLY_LOW = 0.47; let fiveRaise = 0;
    { const five = flyU.slice(-5);
      for (const b of five) { const fx = Math.sin(b.heading), fz = Math.cos(b.heading), len = b.c[1], arc = b.c[2], half = FLY_HALF * b.scale;
        const need = (i) => { const o = i * 3, dx = LPT[o] - b.x, dz = LPT[o + 2] - b.z, s = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx);
          if (s < -1.2 || s > len + 1.2) return [lat, -1e9];
          const sc = clamp(s, 0, len), k = sstep(0, 30, sc) * (1 - sstep(len - 30, len, sc)), ex = Math.max(lat - half, 0);
          const gap = b.y + arc * Math.sin(Math.PI * sc / len) - 0.012 + FLY_LOW * b.scale * k - LPT[o + 1];
          return [lat, ex < FIVE_CLEAR ? Math.sqrt(FIVE_CLEAR * FIVE_CLEAR - ex * ex) - gap : -1e9]; };
        for (let i = 0; i <= NLQ; i += 8) if (need(i)[0] < 12) for (let j = Math.max(i - 8, 0); j <= Math.min(i + 8, NLQ); j++) fiveRaise = Math.max(fiveRaise, need(j)[1]); }
      for (const b of five) b.y += fiveRaise; }
    // three fly low over the water ahead of us from the ford to the portal, a little slower than we go: 15 m ahead as we come to the bar, 9 m ahead at the ring
    const HP = { ...HS, uTau: { value: 0 } }, PACE_V = 640, flyP = []; string(flyP, 3, 0.75 * L + 13.5, 0.8, 2.3, 0.75, 0, 600, 0.31, 0, PACE_V);
    // (round 11) THEIR CLOCK, in metres of route flown: from 33 m below the heart of the last steam bank on (the head of the bar) it is the
    // clock they had (640 m of their track for the whole route: they keep station ahead of us). Above that they fly at half our pace, so
    // we come up on them from far behind: the 30 m over which the part lets a flyer grow lie 125 to 155 m ahead of us, beyond steam bank A,
    // while we are between shoal A and that bank (route metres 166 to 226); nobody sees them begin. Before that they are on the far end of
    // their track, 700 m and more away past the ring, as they were.
    const LOW_FAST = D_BANKZ + 33, LOW_SLOW = D_BANKZ - 12, LOW_R = PACE_V / L;
    const lowClock = (d) => { if (d >= LOW_FAST) return d * LOW_R; const t = clamp((d - LOW_SLOW) / (LOW_FAST - LOW_SLOW), 0, 1);
      return LOW_FAST * LOW_R - 0.5 * (LOW_FAST - d) - (LOW_R - 0.5) * (LOW_FAST - LOW_SLOW) * (0.5 - t * t * t + 0.5 * t * t * t * t); };
    { const a = toWorld(72, -4), b = toWorld(372, 4), hd = hdTo(a[0], a[1], b[0], b[1]); trio(flyU, a[0], 8.2, a[1], hd, 0, 300, 1.5);
      const dX = 0.595 * L + 24, c = toWorld(dX - 80, -305), e = toWorld(dX, 0), hd2 = hdTo(c[0], c[1], e[0], e[1]); trio(flyU, c[0], 15.5, c[1], hd2, 0, 560, -6.5); }
    // the rare event: more of the roost comes up from the meadow behind the bank and crosses our bow (clock held outside u 0.74..1.02)
    const HR = { ...HS, uTau: { value: 0 } }, RA = 0.74, RB = 1.02, flyR = [];
    if (rare) { const len = (RB - RA) * DUR * VF, at = (uh, ahead, y, dz, turn, n) => { const x = E.x - (1 - uh) * L + ahead, f = (uh - RA) / (RB - RA);
        const hd = Math.PI / 2 - turn, fx = Math.sin(hd), fz = Math.cos(hd), arc = 9.5, y0 = y - arc * Math.sin(Math.PI * f), x0 = x - fx * f * len, z0 = ZC + dz - fz * f * len, base = ((-RA * DUR * VF) % len + len) % len;
        for (let k = 0; k < n; k++) { const back = 13 - k * 2.6, side = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 1.6;
          flyR.push({ x: x0 + fz * side, y: y0 + fy.range(-0.5, 0.5), z: z0 - fx * side, heading: hd, type: 7, phase: fy(), period: 4, scale: fy.range(0.96, 1.04), c: [(base + back) % len, len, arc, fy.chance(0.4) ? 1 : 0] }); } };
      at(0.84, 15, 5.4, -2, 1.05, 5); at(0.84, 22, 8, 3, 1.2, 4); at(0.88, 13, 9, -1, 0.95, 5); }
    for (const [list, sh, lod] of [[flyT, HT, 0.5], [flyU, HU, 0.66], [flyP, HP, 0.66], [flyR, HR, 0.62]]) if (list.length) { await ctx.yield(); scene.add(makeCranes(ctx, list, { shared: sh, detail: lod }).object); }
    await ctx.yield();

    // ---- wing-mates: the whooper swans (run u 0.02-0.10, on station 9 m ahead to 0.52, then peel left and climb)
    const birdMesh = (S, n) => { const g = bigBirdGeometry(S); g.instanceCount = n;
      const iP = iattr(g, 'iP', new Float32Array(n * 4), 4), iQ = iattr(g, 'iQ', new Float32Array(n * 4), 4), iS = iattr(g, 'iS', new Float32Array(n * 4), 4);
      for (const a of [iP, iQ, iS]) a.setUsage(THREE.DynamicDrawUsage);
      const m = new THREE.Mesh(g, mat(BIRD_VERT, BIRD_FRAG, { uBd: { value: new THREE.Vector4(S.nl, S.br, 0.36 * S.bl, (S.neckY ?? 0.3) * S.br) }, uBe: { value: new THREE.Vector4(S.bl, 0.4 * S.br, 0.1 * S.bl, S.twist ?? 0) }, uFinger: { value: S.finger }, uWingP: { value: new THREE.Vector4(...S.wingP) }, uSwanL: { value: new THREE.Vector4(1.35, 1.15, 0.86, 0.4) } }, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
      return { set(i, x, y, z, hd, pitch, bank, ph, amp, open, up, sc, look) { put4(iP.array, i * 4, x, y, z, hd); put4(iQ.array, i * 4, pitch, bank, ph, amp); put4(iS.array, i * 4, open, up, sc, look || 0); }, flush() { iP.needsUpdate = iQ.needsUpdate = iS.needsUpdate = true; } };
    };
    const sr = rng.fork('swans'), nSwan = 7;                                         // always seven
    // stations: [metres right of our line, metres ahead of the lens]. The first two fly low, wingtips dimpling the water, so we look down on
    // their backs. Before the run all seven sit on the water 28 to 55 m in (the brief: 25 m ahead on the left at u 0.02); the first stands
    // upright, flapping.
    const STN = [[1.0, 7.3], [-2.6, 9.8], [3.1, 11.8], [-4.1, 14], [4.4, 16.2], [-1.9, 18.6], [1.7, 21.5]];
    const SW = STN.map(([lat, lead], i) => ({ i, lat, lead, d0: 0.02 * L + 15 + i * 4.4 + (i ? sr.range(-1, 1) : 0), lat0: i ? -7 + i * 1.9 + sr.range(-0.6, 0.6) : -0.8, drop: i === 0 ? 1.34 : i === 1 ? 1.27 : 0.8, ph: sr.range(0, 6.28), uA: 0.02 + i * 0.004, uB: 0.104 + i * 0.004 }));
    const swans = birdMesh(SWAN, nSwan);
    const swanPuffs = makePuffs(HS, nSwan * 3); steamPatch(swanPuffs.object.material, STU); scene.add(swanPuffs.object);       // a breath at every wingbeat, left hanging in the air behind
    await ctx.yield();
    const bellU = ctx.core.bell;
    const runPos = (w, t, out) => { const s1 = w.uB * L + w.lead, m1 = L * (w.uB - w.uA); out[0] = w.d0 + (s1 - w.d0) * (3 * t * t - 2 * t * t * t) + m1 * (t * t * t - t * t); out[1] = mix(w.lat0, w.lat, sstep(0.1, 1, t)); return out; };
    const rings = [], ds = [0, 0], ds2 = [0, 0];
    // where a swan flies across the river at u: the whole flight draws over to the side away from whichever shoal the gaze has gone to
    // (the windows are those of the gaze, below; the first is the look at the islet's tail, opened and closed by our metres to the tail)
    const swanLat = (w, u) => { const toL = bellU(u, 0.165, 0.298, 0.25), toR = Math.min(1, bellU(u, 0.295, 0.445, 0.2) + bellU(u, 0.468, 0.565, 0.25)), toM = tailLook ? bellU(u, tailLook.from, tailLook.to, 0.3) : 0;
      return mix(mix(mix(w.lat, w.lat * 0.45 + 2.1, toM), w.lat * 0.45 - 2.1, toL), w.lat * 0.45 + 2.1, toR); };
    for (const w of SW) for (let k = 1; k <= 26; k++) { const t = k * 0.024; runPos(w, t, ds); toWorld(ds[0], ds[1] + (k % 2 ? 0.2 : -0.2), wv); rings.push(wv[0], wv[1], w.uA + t * (w.uB - w.uA), sr.range(0.45, 0.8) * (1 - 0.6 * t)); }
    for (let i = 0; i < 2; i++) { const w = SW[i];                 // the low pair: each down-beat a wingtip touches the river and leaves a ring behind
      for (let uu = w.uB + 0.022, k = 0; uu < 0.515; uu += 5.2 / L, k++) { toWorld(uu * L + w.lead - 0.4, swanLat(w, uu) + (k % 2 ? 1.25 : -1.25), wv); rings.push(wv[0], wv[1], uu, sr.range(0.5, 0.75)); } }
    for (const w of SW) { toWorld(w.d0, w.lat0, wv); for (let k = 0; k < 2; k++) { WR.push(wv[0], wv[1], sr(), k ? 0.9 : 1.6); WU.push(-1, w.uA + 0.004); } }
    { const g = quadGeo(); iattr(g, 'iR', WR, 4); iattr(g, 'iU', WU, 2); g.instanceCount = WU.length / 2;
      wadeU = { value: 0 };
      const m = new THREE.Mesh(g, mat(WRING_VERT, WRING_FRAG, { uU: wadeU, uDeep: deepU }, { transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = 2; scene.add(m); }
    const ringU = { value: 0 };
    { const g = quadGeo(); iattr(g, 'iR', rings, 4); g.instanceCount = rings.length / 4;
      const m = new THREE.Mesh(g, mat(RING_VERT, RING_FRAG, { uU: ringU }, { transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = 2; scene.add(m); }
    const FLAP = 2 * Math.PI * 3, V_LENS = L / DUR;
    const updateSwans = (u, time) => {
      const vNow = V_LENS * pace(u);
      SW.forEach((w, i) => {
        let d, lat, y, open = 1, up = 0, pitch = 0.12, bank = 0, amp = 0.66, sc = 1, yaw = 0, look = 0, v = vNow;
        if (u < w.uA) { d = w.d0; lat = w.lat0; y = 0.1 + 0.02 * Math.sin(time * 1.3 + i); up = i === 0 ? 0.45 : 1; open = i === 0 ? 1 : 0; pitch = i === 0 ? 0.8 : 0; amp = i === 0 ? 0.6 : 0; v = 0;
          if (i === 0) y += 0.16; }
        else if (u < w.uB) { const t = (u - w.uA) / (w.uB - w.uA), lift = sstep(0.42, 1, t); runPos(w, t, ds); d = ds[0]; lat = ds[1];
          runPos(w, Math.min(t + 0.01, 1), ds2); yaw = -clamp(Math.atan2(ds2[1] - lat, ds2[0] - d), -1.45, 1.45);       // the body lies along the run
          v = vNow * sstep(0, 0.8, t);
          y = mix(0.2, Math.max(path.posAtDist(d, pv).y - w.drop, 0.62), lift); up = (i === 0 ? 0.45 : 1) * (1 - sstep(0, 0.4, t)); pitch = mix(i === 0 ? 0.8 : 0.3, 0.12, sstep(0, 0.7, t)); amp = mix(0.95, 0.66, lift); }
        else { const k = sstep(w.uB, w.uB + 0.03, u), p = sstep(0.52, 0.66, u);
          // each holds its station and wanders about it on world time (the low pair less)
          d = u * L + w.lead + k * (i < 2 ? 0.6 : 1.2) * Math.sin(time * 0.31 + i * 1.7) + 18 * p; lat = swanLat(w, u) + k * (i < 2 ? 0.25 : 0.5) * Math.sin(time * 0.23 + i * 2.3) - 48 * p * p;
          y = Math.max(path.posAtDist(d, pv).y - w.drop, 0.62) + k * (i < 2 ? 0.1 : 0.22) * Math.sin(time * 0.41 + i) + 17 * p * p;
          yaw = 0.75 * Math.sin(Math.PI * Math.min(p * 1.15, 1)); bank = -0.45 * Math.sin(Math.PI * p); pitch = 0.12 + 0.2 * Math.sin(Math.PI * p);
          amp = 0.66 + 0.14 * Math.sin(Math.PI * p); sc = 1 - sstep(0.635, 0.67, u); }
        // a swan turns its head to the lens by its bearing: the more the nearer we are (not at all beyond 11 m) and the further round we are from
        // dead astern of it; to its left when we are on its left
        { const back = d - u * L, dist = Math.hypot(back, lat), abeam = Math.atan2(Math.abs(lat), Math.max(back, 0.01));
          look = 0.95 * clamp(lat / 0.8, -1, 1) * (1 - sstep(6.5, 11, dist)) * sstep(0.1, 0.55, abeam) * (1 - up); }
        toWorld(d, lat, wv); const hd = hdAt(d) + yaw, ph = time * FLAP + w.ph;
        swans.set(i, wv[0], y, wv[1], hd, pitch, bank, ph, amp, open, up, sc * 1.28, look);
        const fx = Math.sin(hd), fz = Math.cos(hd), beat = Math.floor(ph / 6.2832), fr = ph / 6.2832 - beat, hx = Math.sin(hd + look), hz = Math.cos(hd + look), nk = mix(1.55, 0.75, up);
        for (let k = 0; k < 3; k++) { const age = (fr + k) / 3, back = v * age * (v > 0 ? 1 : 0), sd = (((i * 0.37 + (beat - k) * 0.61) % 1) + 1) % 1;       // the breath stays in the air where it was breathed: the swan flies on and leaves it
          swanPuffs.set(i * 3 + k, wv[0] + fx * 0.5 + hx * (nk - 0.5) - fx * back, y + mix(0.3, 1.2, up) + 0.3 * age, wv[1] + fz * 0.5 + hz * (nk - 0.5) - fz * back, 0.24, age, sd, (amp > 0 ? 0.45 : 0.3) * sc); }      // (a small faint breath: we follow the swans, and a big one hung between us and the bird as its pale double)
      });
      swans.flush(); swanPuffs.flush();
    };

    // ---- the Steller's sea eagle: waits on the snag, drops as we come (u 0.535), crosses 9 m ahead at 0.562;
    //      on a rare visit it comes back low across the end of the bar at u 0.80 and puts the whole roost up
    await ctx.yield();
    const eagle = birdMesh(EAGLE, 1), EV0 = 0.535, eX = E.x - 0.16 * L + 11, eA = new THREE.Vector3(eX - 12, 0, ZC - 46), eB = new THREE.Vector3(eX + 12, 0, ZC + 46), eHd = Math.atan2(eB.x - eA.x, eB.z - eA.z);
    const snagHd = hdAt(D_SNAG);
    const updateEagle = (u, time) => {
      const fl = time * 2 * Math.PI * 1.7;
      if (rare && u > 0.78) { const w = clamp((u - 0.781) / 0.13, 0, 1), k = sstep(0.781, 0.796, u) * (1 - sstep(0.901, 0.911, u));       // (it crosses the axis at u 0.846: at 0.84 it is 4 m left of it, clear of the ring)
        eagle.set(0, mix(eA.x, eB.x, w), 10.2 - 6.6 * Math.sin(Math.PI * w), mix(eA.z, eB.z, w), eHd, 0.06, -0.3 * Math.sin(Math.PI * w), fl, 0.62, 1, 0, 1.35 * k); }
      else if (u < EV0) eagle.set(0, perch.x, perch.y + 0.3, perch.z, snagHd + 1.9, 1.05, 0, 0, 0, 0.04 + 0.04 * Math.sin(time * 0.9), 0.7, 1.12);
      else { const w = clamp((u - EV0) / 0.135, 0, 1), o = sstep(0, 0.06, w);
        // out from the bough to 9 m ahead of us by u 0.562, then it keeps that lead (a touch faster than we fly) while it slides across our bow and climbs away left
        const d = D_SNAG + 11 * Math.min(w, 0.2) + Math.max(u - 0.562, 0) * L * 1.07, lat = SNAG_S - 0.35 - 42 * w - 2.6 * sstep(0, 0.11, w) * (1 - sstep(0.18, 0.3, w)), y = perch.y + 0.3 + (2.6 - perch.y - 0.3) * sstep(0, 0.2, w) + 14 * sstep(0.27, 1, w);
        toWorld(d, lat, wv);
        const px = mix(perch.x, wv[0], sstep(0, 0.05, w)), pz = mix(perch.z, wv[1], sstep(0, 0.05, w));
        eagle.set(0, px, y, pz, snagHd + mix(1.9, 1.25, sstep(0.15, 0.6, w)), mix(1.05, 0.05, o) - 0.25 * sstep(0, 0.2, w) * (1 - sstep(0.2, 0.3, w)), 0, fl, mix(0.9, 0.62, w), mix(0.06, 1, o), 0.7 * (1 - o), 1.12 * (1 - sstep(0.93, 1, w))); }
      eagle.flush();
    };

    // ---- sika deer wading the ford right to left through u 0.60-0.64: a loose double file across our course on its left, the
    //      rearmost 11 m from the lens when it is at u 0.62, dark against steam bank C and the veiled sun behind them.
    //      We pass behind the last one. Their place is a function of u; breath, wakes and flank steam run on time.
    const dr = rng.fork('deer'), stagShare = w3 < 0.5 ? 0.25 : w3 < 0.75 ? 0 : 1, nDeer = stagShare === 1 ? 6 : 9;
    await ctx.yield();
    const deerG = deerGeometry(); deerG.instanceCount = nDeer;
    const dP = iattr(deerG, 'iP', new Float32Array(nDeer * 4), 4), dQ = iattr(deerG, 'iQ', new Float32Array(nDeer * 4), 4);
    const NFX = nDeer * 4, fxG = quadGeo(); fxG.instanceCount = NFX;
    const fP = iattr(fxG, 'iP', new Float32Array(NFX * 4), 4), fQ = iattr(fxG, 'iQ', new Float32Array(NFX * 4), 4);
    for (const a of [dP, dQ, fP, fQ]) a.setUsage(THREE.DynamicDrawUsage);
    { const m = new THREE.Mesh(deerG, mat(DEER_VERT, DEER_FRAG, {}, { side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m);
      const f = new THREE.Mesh(fxG, mat(DFX_VERT, DFX_FRAG, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide })); f.frustumCulled = false; f.renderOrder = 2; scene.add(f); }
    const DEER = [];
    for (let i = 0; i < nDeer; i++) { const stag = stagShare === 1 || (stagShare > 0 && (i === 0 || i === nDeer - 2));
      DEER.push({ s0: -5.5 - i * (stagShare === 1 ? 2.3 : 1.5) + (i ? dr.range(-0.25, 0.25) : 0), dd: i ? (i % 2 ? 1.4 : -0.1) + dr.range(-0.3, 0.3) : 0, stag: stag ? 1 : 0, sc: stag ? dr.range(1.36, 1.42) : (i % 4 === 2 ? 1.0 : dr.range(1.17, 1.26)), ph: dr.range(0, 6.28), sd: dr() }); }
    const WALK = 1.25, DEPTH = 0.3, deerMid = new THREE.Vector3();
    const updateDeer = (u, time) => {
      const shift = WALK * (clamp(u, 0.5, 0.72) - U_FORD) * DUR;
      DEER.forEach((D, i) => {
        const s = D.s0 - shift, d = D_FORD + 0.2 * (-s - 5.5) + D.dd; toWorld(d, s, wv);
        const fi = clamp(Math.round((d - D0) / STEP), 0, NROW), hx = -NX[fi] + 0.2 * NZ[fi], hz = -NZ[fi] - 0.2 * NX[fi], hd = Math.atan2(hx, hz), hl = Math.hypot(hx, hz);
        const x = wv[0], z = wv[1], sc = D.sc, fx = hx / hl, fz = hz / hl;
        put4(dP.array, i * 4, x, -DEPTH, z, hd); put4(dQ.array, i * 4, D.ph + shift * 6.0 / sc, 0.07 * Math.sin(time * 0.8 + D.ph) + 0.05 * D.stag, sc, D.stag);
        let o = i * 16;
        put4(fP.array, o, x, 0, z, 5.4 * sc); put4(fQ.array, o, hd, D.sd, 0.6, 0); o += 4;                                  // the V of its wake
        for (let k = 0; k < 2; k++, o += 4) { const age = (time / 3.4 + D.sd + k * 0.5) % 1;                                // breath, hanging and drifting downstream
          put4(fP.array, o, x + fx * sc + NZ[fi] * 0.5 * age, -DEPTH + 1.24 * sc + 0.35 * age, z + fz * sc - NX[fi] * 0.5 * age, (0.1 + 0.42 * Math.sqrt(age)) * sc);
          put4(fQ.array, o, 0, D.sd + k * 0.37, 0.8 * (1 - age) * (1 - age) * Math.min(age * 12, 1), 1); }
        { const age = (time / 4.6 + D.sd * 3.1) % 1;                                                                        // steam off the wet flanks
          put4(fP.array, o, x + NZ[fi] * 0.3 * age, -DEPTH + 0.95 * sc + 0.6 * age, z - NX[fi] * 0.3 * age, 0.4 + 0.5 * age); put4(fQ.array, o, 0, D.sd + 0.7, 0.22 * Math.sin(Math.PI * age), 1); }
      });
      dP.needsUpdate = dQ.needsUpdate = fP.needsUpdate = fQ.needsUpdate = true;
    };
    await ctx.yield();

    // ---- steam: separate columns rising along the shelf ice (each a stack of puffs that climb, swell and lean downstream),
    //      low wisps peeling off the water at the banks, and the curling tops of the banks. Clear air over our course.
    const ws = rng.fork('wisps'), WP = [], WQ = [], WT = [];
    const wisp = (x, y, z, size, seed, rate, stretch, op, tint = 0) => { WP.push(x, y, z, size); WQ.push(seed, rate, stretch, op); WT.push(tint); };
    const wispOK = (x, z, s) => !(Math.abs(x) < 47 && z < 8.4) && !(x > 85 && Math.abs(s) < 12.5);       // none between us and the dancers, none before the portal
    const nCol = Math.round(34 * (0.6 + 0.4 * detail) * clamp(steamK, 0.5, 1.2));
    for (let i = 0; i < nCol; i++) { const d = mix(24, L + 35, (i + ws()) / nCol), sd = i % 2 ? 1 : -1, edge = sd > 0 ? sR(d) : -sL(d), s = sd * clamp(edge - ws.range(1.0, 4.5), 8.6, 40); toWorld(d, s, wv);
      const sz = ws.range(2.0, 3.1), rise = ws.range(1.7, 2.7), rate = ws.range(0.04, 0.062), sd0 = ws(), cx = wv[0], cz = wv[1];
      if (!wispOK(cx, cz, s)) continue;
      for (let k = 0; k < 8; k++) wisp(cx + ws.range(-0.5, 0.5), 0.35, cz + ws.range(-0.5, 0.5), sz * ws.range(0.85, 1.15), (sd0 + (k + ws.range(-0.2, 0.2)) / 8) % 1, rate, rise, ws.range(0.5, 0.72)); }
    const nW = Math.round(240 * (0.5 + 0.5 * detail));
    for (let i = 0; i < nW; i++) { const d = ws.range(-30, L + 40), sd = ws.sign(), edge = sd > 0 ? sR(d) : -sL(d), s = sd * clamp(edge - ws.range(0.5, 5.5), 7.5, 40); toWorld(d, s, wv);
      if (!wispOK(wv[0], wv[1], s)) continue;
      wisp(wv[0], ws.range(0.15, 0.6), wv[1], ws.range(1.4, 2.6), ws(), ws.range(0.05, 0.11), 1, ws.range(0.3, 0.5)); }
    STU.uStBk.value.slice(0, 3).forEach((c, b) => { for (let k = 0; k < 14; k++)
      wisp(c.x + ws.range(-1, 1) * bankR[b][0] * 0.9, ws.range(3, windy ? 4.5 : 7.5), c.z + ws.range(-1, 1) * bankR[b][2] * 0.8, ws.range(9, 14), ws(), 0, 1.6, ws.range(0.3, 0.45) * Math.min(steamK, 1), b ? 0 : 2.5); });      // (the gallery bank's heads are rounded billows with an outline: tint 2 and over)
    // the two banks across our course have no heads over the channel: their billows stand along both shores, 9.5 to 17 m off our line and 1.5
    // to 4.5 m up, rose on the sun's side; between them we look down the river under the smoke
    { const wb = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':bank-billows'));
      for (const [b, dB] of [[3, D_BANKA], [4, D_BANKZ]]) for (let k = 0; k < 12; k++) { const sd = k % 2 ? 1 : -1;
        toWorld(dB + wb.range(-1.15, 1.15) * bankR[b][0], sd * wb.range(9.5, 17), wv);
        wisp(wv[0], wb.range(1.5, windy ? 3 : 4.5), wv[1], wb.range(5, 8), wb(), 0, 1.5, wb.range(0.26, 0.4) * Math.min(steamK, 1), sd < 0 ? 0.6 : 0); } }
    // THE COLUMNS IN THE LEE: over the slack water below the downstream tip of the islet's tail and of each gravel step of the entry reach
    // and of no other bar (the dancers' shoals carry none) a column of steam stands
    // up: puffs that leave the water one after another, climb 8 m or so, swell and lean downstream, each with a rose shoulder to the sun and a
    // lilac side away from it. The islet and its tail are one bar (their slack water lies below the tail); a bar has no column where the
    // head of the next bar on its side begins inside the column's own seat: closer below the tail than the seat's distance plus the
    // column's size (the current parts there: no slack water). Between columns the air is clear.
    { const lc = ctx.core.makeRng(ctx.core.hashSeed('lee-columns:' + ctx.seed)), bars = [SPIT, ...STEPS], heads = [M0, ...bars];
      for (const m of bars) { const tail = m.d + m.HL, seat = lc.range(2.5, 4.5), off = lc.range(-0.6, 0.6), sz = lc.range(1.9, 2.4);
        if (tail > 300 || heads.some((h) => h !== m && h.s * m.s > 0 && h.d - h.HL > tail - 2 && h.d - h.HL < tail + seat + sz)) continue;
        toWorld(tail + seat, m.s + off, wv);
        const rise = lc.range(5.5, 7.0), rate = lc.range(0.034, 0.046), sd0 = lc();
        // (round 11: thinner and more. The column itself is sixteen puffs three quarters the size it had; beside it, a few metres further down
        // the slack water, stands a lesser one of eight, half as high. Sprites 24 for 14, their summed area 0.87 of what it was.)
        for (let k = 0; k < 16; k++) wisp(wv[0] + lc.range(-0.3, 0.3), 0.45, wv[1] + lc.range(-0.3, 0.3), 0.78 * sz * lc.range(0.85, 1.15), (sd0 + (k + lc.range(-0.2, 0.2)) / 16) % 1, rate, rise * 1.2, lc.range(0.5, 0.66), 2.85);
        toWorld(tail + seat + lc.range(2.6, 4.2), m.s + off + lc.range(1.0, 1.7) * (lc() < 0.5 ? -1 : 1), wv); const sd1 = lc(), rate1 = rate * lc.range(1.25, 1.5);
        for (let k = 0; k < 8; k++) wisp(wv[0] + lc.range(-0.2, 0.2), 0.35, wv[1] + lc.range(-0.2, 0.2), 0.55 * sz * lc.range(0.85, 1.15), (sd1 + (k + lc.range(-0.2, 0.2)) / 8) % 1, rate1, rise * 0.75, lc.range(0.45, 0.6), 2.85); } }
    const wz = rng.fork('wisps2'), sK = Math.min(steamK, 1);
    // the rose plume that stands up behind the islet alder: from the entry the whole tree is drawn dark on it
    for (let k = 0; k < 10; k++) { toWorld(D_ISLET + 8 + k * 2.6, -10.6 - 0.4 * k + wz.range(-1.2, 1.2), wv); wisp(wv[0], 5 + 1.6 * k + wz.range(-1, 1), wv[1], wz.range(9, 12.5), wz(), 0, 1.4, wz.range(0.38, 0.48) * sK, 2.85); }
    // a rose bank standing behind each left-hand shoal, beyond the first trees of the bank: the gallery and the dancers are drawn dark on it
    for (const k of [1, 2]) { const m = SHOALS[k], n = Math.round(m.HL / 4.2);
      for (let j = 0; j < n; j++) { toWorld(m.d + mix(-m.HL - 4, m.HL + 8, (j + wz()) / n), -(25 + wz.range(0, 6)), wv); wisp(wv[0], wz.range(3.2, 6.5), wv[1], wz.range(7, 9.5), wz(), 0, 1.6, wz.range(0.24, 0.36) * sK, 0.5); } }
    // the rose bank that stands behind the cut bank of the dance: brighter and pinker than the frost in front of it
    for (let k = 0; k < 15; k++) wisp(-58 + k * 8.4 + wz.range(-2.5, 2.5), wz.range(5.4, 7.8), wz.range(-19.5, -15.5), wz.range(8.5, 11.5), wz(), 0, 1.7, wz.range(0.46, 0.6) * sK, 0.85);
    // thin skins of smoke peeling off the water under our course, low enough to look down on
    const nSkin = Math.round(150 * (0.5 + 0.5 * detail) * clamp(steamK, 0.5, 1.1));
    for (let i = 0; i < nSkin; i++) { const d = mix(6, L - 20, (i + wz()) / nSkin), s = wz.range(-6.5, 6.5), sz = wz.range(1.1, 2.0), sd0 = wz(), rate = wz.range(0.06, 0.12), op = wz.range(0.34, 0.52); toWorld(d, s, wv);
      if ([M0, ...SHOALS, ...STEPS].some((m) => Math.abs(d - m.d) < m.HL + 2 && Math.abs(s - m.s) < m.HW + 1.2) || (Math.abs(wv[0]) < 50 && wv[1] < 8.6) || (wv[0] > 56 && Math.abs(s) < 5)) continue;
      wisp(wv[0], wz.range(0.1, 0.3), wv[1], sz, sd0, rate, 1.3, op); }
    for (const [uu, s, ph] of [[0.25, 0.2, 0.54], [0.4, 0.6, 0.3], [0.7, 2.6, 0.0], [0.12, 2.2, 0.8]]) { toWorld(uu * L + 5.2, s, wv); wisp(wv[0], 0.2, wv[1], 1.7, ph, 0.08, 1.3, 0.5); }
    { const g = quadGeo(); iattr(g, 'iP', WP, 4); iattr(g, 'iQ', WQ, 4); iattr(g, 'iT', WT, 1); g.instanceCount = WT.length;
      const m = new THREE.Mesh(g, mat(WISP_VERT, WISP_FRAG, { uWisp: { value: new THREE.Vector4(windy ? 2.4 : 1.1, windy ? 0.25 : 0.62, steamK > 0.5 ? 1.8 : 1.1, 0) } }, { transparent: true, depthWrite: false }));
      m.frustumCulled = false; m.renderOrder = 1; scene.add(m); }

    await ctx.yield();

    // ---- diamond dust and falling frost through the whole air column (heavy snow under the overcast)
    const gr = rng.fork('glitter'), nG = Math.round((snowing ? 2600 : 1900 * clamp(LK.glit, 0.3, 2.2)) * detail);
    const uGl = { value: new THREE.Vector4(44, snowing ? 16 : 20, 0, snowing ? 6 : 3) }, uEv = { value: new THREE.Vector2(0, EV0 + 0.002) };
    const glCol = snowing ? new THREE.Color(0.78, 0.78, 0.84) : HS.uSunCol.value.clone().multiplyScalar(1.7).addScalar(0.45);
    const points = (n, place, fall, size, extra, defines, wind) => {
      const p = new Float32Array(n * 3), a = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { place(p, i * 3); a.set([gr(), gr.range(fall[0], fall[1]), gr.range(1.5, 5), gr.range(size[0], size[1])], i * 4); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aD', new THREE.BufferAttribute(a, 4));
      const m = new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: GLIT_VERT, fragmentShader: GLIT_FRAG, defines, uniforms: { uGl, uPx: HS.uPx, uEv, uGlWind: { value: wind }, uGlCol: { value: glCol } }, transparent: true, depthWrite: false, ...extra }));
      m.frustumCulled = false; m.renderOrder = 4; scene.add(m);
    };
    points(nG, (p, o) => { p[o] = gr(); p[o + 1] = gr(); p[o + 2] = gr(); }, snowing ? [0.9, 1.7] : [0.08, 0.35 * Math.sqrt(LK.fall)], snowing ? [0.05, 0.09] : [0.02, 0.04],
      { blending: snowing ? THREE.NormalBlending : THREE.AdditiveBlending }, snowing ? { SNOWFALL: 1 } : {}, new THREE.Vector3(windy ? 3.5 : snowing ? 0.35 : 0.05, 0, windy ? 1.0 : 0.15));
    // the frost that rains from the eagle's sprung bough, drifting across our path
    points(Math.round(280 * detail), (p, o) => { const k = gr(); p[o] = mix(snagW[0], perch.x, k) + gr.range(-0.8, 0.8); p[o + 1] = perch.y + gr.range(-0.5, 0.9); p[o + 2] = mix(snagW[1], perch.z, k) + gr.range(-0.8, 0.8); },
      [0.5, 1.3], [0.03, 0.055], { blending: THREE.AdditiveBlending }, { EVENT: 1 }, new THREE.Vector3(-NX[fs] * 1.5, 0, -NZ[fs] * 1.5));
    // the steady fall of crystals from the boughs: thick under the islet alder and the arch, a few under every tree by the water
    { const fl = rng.fork('fall'), FP = [];
      for (let i = 0; i < Math.round(300 * detail); i++) { const q = alderFall[fl.int(0, alderFall.length - 1)]; FP.push(isl[0] + q[0] + fl.range(-0.6, 0.6), alderY + q[1] - fl.range(0, 0.5), isl[1] + q[2] + fl.range(-0.6, 0.6)); }
      for (let i = 0; i < Math.round(220 * detail); i++) { const a = fl.range(0.25, 2.9), r = fl.range(7.6, 10.5); FP.push(AX + fl.range(-2.5, 2.5), E.y + r * Math.sin(a), ZC + r * Math.cos(a)); }
      for (const it of nearT) { const n = Math.round(13 * detail); for (let i = 0; i < n; i++) { const a = fl.range(0, 6.28), r = it.reach * Math.sqrt(fl()) * 0.9; FP.push(it.x + Math.cos(a) * r, it.y + it.h * fl.range(0.35, 0.8), it.z + Math.sin(a) * r); } }
      let k = 0; points(FP.length / 3, (p, o) => { p[o] = FP[k++]; p[o + 1] = FP[k++]; p[o + 2] = FP[k++]; }, [0.35, 0.9], [0.028, 0.05], { blending: THREE.AdditiveBlending }, { FALL: 1 }, new THREE.Vector3(windy ? 2.2 : 0.12, 0, windy ? 0.6 : 0.05)); }
    await ctx.yield();

    // ---- gaze: the family under the islet alder as we bank round it; then one long look to the left that begins on the
    //      deer line at the ford, slides to the head of the bar as we leave them astern (over the 24 m of river from 6 m short of
    //      the ford line, where the last of the file is abeam, to 18 m past it), and runs along the bar 7.9 m ahead of us for the whole pass, about 42 degrees off our course
    const famV = new THREE.Vector3(famP[0], 1.3, famP[1]), gaze = new THREE.Vector3(), gz2 = new THREE.Vector3(), fordV = toWorld(D_FORD + 2, -14.5);
    // ... and before that, three looks aside at the cranes on the shoals: the gaze rests on the bar's near edge 6.5 m ahead of us and slides along it;
    // and one at the roost on the islet's tail (tailLook, above): it rests on the birds that stand there, 6.5 m ahead of us along their own line
    const shoalGaze = (m, S) => { const g = new THREE.Vector3(), w = [0, 0]; return (time, u) => { toWorld(clamp(u * L + 6.5, m.d - m.HL + 3, m.d + m.HL - 3), S.side * S.lat, w); return g.set(w[0], 1.9, w[1]); }; };
    const tailV = new THREE.Vector3(), tailGaze = (time, u) => { toWorld(clamp(u * L + 6.5, tailRoost.d0, tailRoost.d1), tailRoost.s, wv); return tailV.set(wv[0], 1.4, wv[1]); };
    const pois = [
      { at: famV, from: 0.03, to: 0.15, weight: 0.3 },
      ...(tailLook ? [{ at: tailGaze, from: tailLook.from, to: tailLook.to, weight: 0.62, fade: 0.3 }] : []),
      { at: shoalGaze(SHOALS[0], SHO[0]), from: 0.165, to: 0.298, weight: 0.6, fade: 0.25 },
      { at: shoalGaze(SHOALS[1], SHO[1]), from: 0.295, to: 0.445, weight: 0.62, fade: 0.25 },
      { at: shoalGaze(SHOALS[2], SHO[2]), from: 0.468, to: 0.547, weight: 0.6, fade: 0.3 },        // (back to our course by 0.547: the eagle drops ahead of us)
      { at: (time, u) => { const cx = path.pointAt(u, gaze).x; gz2.set(fordV[0], 1.0, fordV[1]); gaze.set(clamp(cx + 7.9, -42.5, 58), 1.5, 0);
          return gaze.lerp(gz2, 1 - sstep(0.626, 0.662, u)); }, from: 0.588, to: 0.845, weight: 0.8, fade: 0.11 },
    ];
    return {
      scene, path, duration: DUR, pace, pois, ride: 'none',
      guards: { lipTussocks: hero.counts.lipTussocks, lipNotMade: hero.counts.lipNotMade, fiveRaise },      // what the two guards by place did on this visit (read by the checks; nothing reads it here)
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 26, nearThrough: 0.3 },      // through the previous portal the river is drawn right up to the lens, not cut at the opening
      portal: { shape: 'circle', radius: 7, color: LK.horS, glow: 1, revealDistance: 260 },
      post: { exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.7, threshold: 0.9 },
        grade: { saturation: LK.sat, contrast: 1.03, tint: '#ffffff', shadowTint: LK.shadow, vignette: 0.22, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        u = u ?? 0;
        if (LK.el > 0) setSun(LK.el + (LK.el < 12 ? u : 0));                              // the sun climbs a degree over the flight
        dirLight.position.copy(sunDir).multiplyScalar(200);
        STU.uStP.value.w = time; STU.uStP.value.x = 0.008 * steamK * mix(0.55, 1, sstep(0.02, 0.22, u));   // the smoke thickens as we go down
         STU.uStB.value.copy(stB0).lerp(stB1, u);                 // steam warming from rose to gold
        SKYU.uSkyK.value.w = time; uGl.value.z = time; uEv.value.x = u; ringU.value = u; wadeU.value = u;
        hero.setDance(danceT(u)); hero.setProgress((u - LEAVE_U) / (1 - LEAVE_U)); hero.update(dt, time, camera);    // also sets the shared clock and pixel size
        // cranes a long way off are not drawn: the bar's beyond 115 m of the bar, a shoal's dancers beyond 160 m of their shoal, each roost
        // and the waders beyond 150 m of where they stand (the lens is at the point of the path that u names)
        path.pointAt(u, lensP);
        hero.setShown(awayFrom(barB) < 115, shoalB.map((B) => awayFrom(B) < 160));
        for (const g of shown) g[0].visible = awayFrom(g[1]) < g[2];
        HT.uTau.value = time; HU.uTau.value = u * DUR; HP.uTau.value = lowClock(u * L) / VF; HR.uTau.value = clamp(u, RA, RB) * DUR;
        updateSwans(u, time); updateEagle(u, time); updateSmall(u, time);
        updateDeer(u, time);
      },
      dispose() { hero.dispose?.(); for (const g of spare) g.dispose(); },
    };
  },
};
