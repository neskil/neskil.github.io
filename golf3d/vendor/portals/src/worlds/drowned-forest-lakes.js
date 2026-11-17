// The Peacock Lakes (drowned-forest-lakes): mid-October in Jiuzhaigou. A low flight behind nine mandarin ducks across a
// turquoise lake, up through a slot in a travertine fall that pours between living trees, along a shoal of sheeting water
// under leaping golden monkeys, and out over a peacock-blue lake that is a mirror until a gust wipes it and a whole fallen
// forest shows on its floor (the hero set piece, src/parts/drowned-forest-lakes.js; world frame == hero frame, top lake
// level y = 0, pass one flies toward -Z, the lower lake lies at y = -31).
//
// THE FLIGHT (u is the fraction of the path flown; it is given here to say where on the journey a thing is met, and the
// things themselves are placed in world coordinates, by distances along the path or from the lens, never by u):
// 0-0.10 the lower lake, nine ducks ahead, the fall across the view with ten dark spruces on its lip either side of the
// slot and the snow peak over them; long rafts of leaves streak under the nose and lie as red and gold streaks across the
// lake (painted by LAKE_FRAG from uRaft), a band of fine glitter 50-92 m out, a ring on the water under each duck. The gaze starts on the foot of the fall and
// lifts to the lip (pois[0]). 0.10-0.20 the climb through the slot, 10-15 m over a stair of twelve rimstone pools (the gaze
// drawn down onto them, pois[1]); the face is lobed (two buttresses either side of the slot, bays beyond: lobe(x), GL_FORM),
// its veils fall in leaps on a body of thin strands, its lip is a mossy rim. 0.20-0.27 the shoal skim between willow scrub
// under two stout-boughed trees at z = 252 where golden monkeys sit and four leap the channel one after another. At 0.265
// the lens comes over the shoal's crest (z 257) and the top lake's mirror begins there: the lake's level water lies over the
// outlet tongue to the crest (the hero's surface, surfZ), the peak and the shore forest doubled in it, small rimstone pools
// under the nose, leaves afloat either side. 0.29-0.54 PASS ONE at 1.3 m along x = -100: the gust front crosses the lens at
// 0.372 and the window opens; the ducks swing right and ski in (0.372-0.41); a jam of laid trunks passes under the nose;
// a low mist bank lies across the line (z 16-76, MBANK); THE STAND, forty-odd bleached trunks standing 12-26 m out of the
// water round the elbow of the lake, is doubled in a lee of still water until the lens comes in among it (the lee breaks
// over 0.525-0.565; there is no other); THE ARCH, one huge fallen tree, spans the line (passed under at 0.548). 0.54-0.69
// the right turn, climbing to 11.5 m, level: the sun, the far peaks and the far shore in the upper half of the frame, the
// window over the FELLED FOREST in the lower (sixty bone-white trunks under the turn and pass two, a shoal of a hundred
// carp over one of them); THE ISLAND, a travertine islet of gold birches and scarlet maples, is rounded 17 m off. The gaze
// is led by keys (pois[3], 0.44-0.86) from the snow peak past the side valley in the west slope to the gate. 0.69-0.84 PASS
// TWO, the left arc sinking to the shelf: the raft of felled trunks under the window with a second shoal of carp over
// it (the third hangs over a white log under the gate, 87 m down the exit run), the gate in the left of the frame from 0.70; the calm returns as one front from the head of the lake (it comes onto
// the lake behind the gate at 0.79-0.80) and the mirror heals toward the lens. 0.84-0.90 the shelf skim: white trunks
// cross 0.6-1.5 m under the lens, moss gardens on lifted root plates pass 6.2-6.4 m either side every ten or twelve
// metres, and at 0.885 the golden pheasant stands on his mossy log 7 m to the right, cape fanned (his log is set from that
// beat by the hero; he stands across it, side-on to the lens; ONE gaze entry of weight 0.6, the site's own look carried
// with him, rests on him as he comes up and is handed on to the gate from 3.6 m of route before he is abeam: he never
// leaves his log). 0.90-1 the gate: two snags, eight crusted jam logs, the portal, and a bank of mist whose
// every sheet stands beyond the sill's crest and clear of the ring (none over the shelf's water).
// Mandarins perch on five boughs of the stand and a second flight of four leads through it (0.27-0.9).
// The valley walls east of the stand are carved by LAND_FRAG into spur ribs that run up the slope (aRib: way along the wall,
// which wall, strength): sunlit rock and larch gold on the sun side of each spur, blue shade in each gully, a snow tongue
// and one thread of falling water over the gate; the spurs are soft and end well below every crest, so each skyline is one
// unbroken line. The island's trees have their own leaves (cards cut into small leaves in hanging clusters) and take the
// hour's key (LOOKS.isle, LOOKS.isleRock); its pedestal is built in rimstone steps.
// What the lens cannot see is not drawn, by rules of the lens's own place and gaze only (update(): the shoal's things, the
// fall's and the lip's old spruces each lie in a box built round them, and a box is not drawn while every corner of it is
// behind the plane of the eye; the pheasant within 300 m and ahead;
// hero.setLens: sunk wood by the lens's height, z and bearing, each carp shoal within 75 m).
// Random streams: ctx.rng is forked in this order: sky, peacock-lake (the hero), mist, [smoke1, smoke2], [snow], leaffall,
// plants, forest, ducks, monkeys, [takin], spray, rafts, lipleaves, lipmoss, and then round 13's lakerafts, drifts. Everything else that is
// seeded has a stream of its own made from the seed (lakes-*, peacock-*), which takes nothing from ctx.rng. Among them is
// every loop whose count of numbers depends on the ground it tests (lakes-strays, lakes-willows, lakes-lipspruce,
// lakes-knobs, lakes-belt, lakes-shoaltrees, lakes-lowtrees): if the ground changes, that loop is dealt anew and no other.
// Pace: 1.1 lower lake and fall, 0.85 over the shoal (monkeys), 1.05 over the mirror, 0.74 through the stand, 0.9 shelf, 1.0 gate.
// The fall is soft feathered veils of mixed widths that part round ten planted ledges and burst white on each of them, over
// rock that is always wet (brown and ochre travertine, cushions of moss), with a bank of spray at its foot (no kit mist:
// its flat puffs read as bars); the slot is a stair of pools with white water draped over each rim; the shoal is one sheet shader (rimstone pools, foam lines, filtered by fwidth) plus instanced stones.
// The slope canopy is painted by LAND_FRAG from one stand field (hue) and round crown cells (light and shade only); the
// instanced far crowns read the same field through standAt(), so the two always agree.
// Looks by seed: morning (peak autumn), dawn (blue shade, smoke-mist, pink peak), full-moon night (the moon where the
// morning sun was; also the answer to a wish for night), amber (late October: the sun low in the notch of the side valley,
// a 240 m band of its light raking across the stand, warm bounce on the shaded slopes, mist sheets on the water, half-bare birches)
// and first snow. Rare: nine takin wading the head of the shoal.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, normalsInSteps } from '../parts/drowned-forest-lakes.js';

const PAL = ['#0E8FA8', '#0B4F6C', '#7FD6C8', '#EDE8D6', '#E3A82B', '#1F3A2C', '#C8421A'];
const LL = -31, AX = -100, ZC = 258, ZLIP = 335, UG = 0.372, BZ = 252;      // lower-lake level, axis x, shoal crest z, fall lip z, gust u
const PORTAL = [193.3, 4.5, -143.8], HEAD = [0.423, -0.906], PERP = [0.906, 0.423];
const SZ0 = 307, SZ1 = 365, NSTEP = 12, PR = 7;                                    // the slot's stair: z of its top and its foot, number of pools
const LOOKS = {
  morning: { hour: 'morning', season: 'peak', sky: { preset: 'day', zenith: '#1a4c9c', horizon: '#c6d9e8', sunElevation: 28, sunAzimuth: -97, clouds: false, clouds2: { coverage: 0.34, stretch: 1, opacity: 0.55, scale: 0.8 } },
    sun: '#FFE9C4', sunI: 3.1, low: 1, lake: 1, amb: '#9dbbe6', ambI: 1.1, gnd: '#77705f', hazeK: 1 / 3400, fog: 0.0007, shadow: [0, 0, 1e4, 1], exposure: 1.0, tint: '#ffffff', leaves: 1, snow: 0 },
  dawn: { hour: 'dawn', season: 'peak', sky: { preset: 'dawn', sunElevation: 5, sunAzimuth: -97, clouds: false, clouds2: { coverage: 0.4, stretch: 1, opacity: 0.6, scale: 0.8 } },
    sun: '#FFAE9A', sunI: 2.7, low: 0.3, lake: 0.5, amb: '#7f9ad6', ambI: 1.25, gnd: '#5d6680', hazeK: 1 / 2500, fog: 0.001, shadow: [0.12, 0, -42, 28], exposure: 1.2, tint: '#f4f1ff', leaves: 0.6, snow: 0, scat: 0.82, wallHz: 0.4, isle: [1.0, 0.86, 0.72, 0.22, 0.6, 0.45, 0], isleRock: [0, 0.3, 1, 0.82] },
  // (the sun has left the valley floor but still stands in the notch of the side valley, 94 degrees right of the way in:
  // a band of low light 240 m wide lies across the elbow of the lake, through the standing trunks: shaft = half-width, m)
  amber: { hour: 'afternoon', season: 'late', shaft: 120, fill: [0.5, 0.4, 0.29], sky: { preset: 'goldenHour', sunElevation: 15, sunAzimuth: 94, clouds: false, clouds2: { coverage: 0.42, stretch: 1, opacity: 0.6, scale: 0.8 } },
    sun: '#FFB868', sunI: 3.0, low: 0.3, lake: 0.55, amb: '#8fa6dc', ambI: 1.2, gnd: '#6f6258', hazeK: 1 / 3600, fog: 0.0007, shadow: [-0.2, 0, -90, 32], exposure: 1.15, tint: '#fff4e6', leaves: 2.2, snow: 0, scat: 0.62, wallHz: 0.6 },
  snow: { hour: 'morning', season: 'snow', sky: { preset: 'day', zenith: '#5c7fb4', horizon: '#d3dde6', sunElevation: 28, sunAzimuth: -97, sunIntensity: 6, clouds: { coverage: 0.62, softness: 0.5, opacity: 0.8 }, clouds2: { coverage: 0.5, stretch: 1, opacity: 0.6 } },
    sun: '#FFF1DC', sunI: 2.3, low: 1, lake: 1, amb: '#b3c6e2', ambI: 1.3, gnd: '#8a8c90', hazeK: 1 / 2600, fog: 0.0008, shadow: [0, 0, 1e4, 1], exposure: 0.98, tint: '#f3f7ff', leaves: 0.5, snow: 1 },
  // full moon: it stands beside the snow peak, 22 degrees left of the way in and 20 up (the one look whose key is ahead of
  // us, because moonlight only reads on water looked at toward the moon): the falls are silver lace lit from behind, both
  // lakes carry the moon and its path of glitter, and the trunks lie pale under blue-black water. On the exit run it is
  // 47 degrees to the left, at the very edge of the frame and well clear of the portal.
  night: { hour: 'night', season: 'peak', moon: true, sky: { preset: 'night', zenith: '#050d24', mid: '#0e2148', horizon: '#27477f', bodyOverrides: { 0: { elevation: 20, azimuth: -22, size: 3, glow: 0.35 } },
      clouds: false, clouds2: { coverage: 0.36, stretch: 1, opacity: 0.5, scale: 0.8, lit: '#9fb2e0', shade: '#1c2a52' } },
    sun: '#c3d3ff', sunI: 1.35, low: 1, lake: 1.4, amb: '#4668b8', ambI: 1.25, gnd: '#1c2a4c', hazeK: 1 / 2900, fog: 0.0007, shadow: [0, 0, 1e4, 1], exposure: 1.45, tint: '#e9f0ff', leaves: 0.6, snow: 0, scat: 0.24, heroAmb: 0.55, shW: [0.045, 0.07, 0.125], wallHz: 0.3, isle: [0.5, 0.64, 1.0, 0.95, 0.5, 0.4, 1], isleRock: [0, 0, 0.8, 0.5] },
};

// ---------- GLSL ----------
const GL_N = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= .5; } return s / .9375; }
float fbr(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 3; i++) { s += a * vn(p); p = mat2(.8, .6, -.6, .8) * p * 2.07 + vec2(13.7, 7.1); a *= .5; } return s / .875; }
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
    mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }`;
const GL_U = /* glsl */`
uniform float uTime, uU, uSnow, uHazeK, uLow, uWSun, uMoon; uniform vec3 uSun, uSunCol, uSkyCol, uGndCol, uHaze, uZen, uHor, uShW, uFill; uniform vec4 uShadow, uShaft;
// where the low sun reaches: above the shadow of the ridge, and in the band of light that comes down the side valley
// (uShaft: unit vector across the band in xz, its offset, its half-width; a half-width of 0 means no band)
float shaftAt(vec3 p){ return step(1., uShaft.w) * (1. - smoothstep(.55, 1., abs(dot(p.xz, uShaft.xy) - uShaft.z) / max(uShaft.w, 1.))); }
float sunGate(vec3 p){ return mix(uLow, 1., max(smoothstep(0., uShadow.w, p.y + uShadow.x * p.x + uShadow.z), shaftAt(p))); }
// white water takes direct light only where the sun really reaches; in the valley's shade it is lit by the sky (uShW: the
// extra sky light the eye gives white water there), so it reads cool and pale, never the colour of a sun it cannot see
float sunW(vec3 p){ return smoothstep(uLow * .999, 1., sunGate(p)); }
vec3 hazed(vec3 c, float d){ return mix(c, uHaze, 1. - exp(-d * uHazeK)); }`;
// (round 11) the plan of the fall's face (the same lobes the land is built with: metres toward the lower lake, and their
// slope along the face), and the SHELVES of the wet rock: a count of rimstone ledges down the rock, one every 2.4 m (the
// drop of a pool of the stair), warped so that they climb, dip and pinch out. The rock paints its shelves from it and the
// falling water breaks on them: both read the same count from the same place (needs GL_N)
const GL_FORM = /* glsl */`
float lobeG(float x){ float a = x - (${AX.toFixed(1)}); return 4.6 * (1. + cos(a * .0805)) + 1.4 * (1. + sin(a * .19 + .8)); }
float lobeD(float x){ float a = x - (${AX.toFixed(1)}); return -.3703 * sin(a * .0805) + .266 * cos(a * .19 + .8); }
// the round of the face under a side light: its alcoves lie in their own shade, each buttress has a lit and a shaded flank
float formK(float x, float sx){ return (.66 + .46 * smoothstep(0., 10., lobeG(x))) * clamp(1. - 1.05 * lobeD(x) * (sx < 0. ? -1. : 1.), .55, 1.5); }
float ledgePh(vec3 p){ return p.y * .42 + 1.1 * vn(vec2(p.z * .11 + p.x * .07, 3.7)) + .3 * vn(vec2(p.z * .43 - p.x * .31, 9.1)) + .1 * vn(vec2(p.x * 1.3 + p.z * 1.1, p.y * .7)); }`;
// the rock the falls run over: wet travertine in brown and ochre bands that follow its ledges, with round cushions of
// moss; never black, so the white water reads as water over rock in every light (needs GL_N, GL_FORM)
const GL_ROCK = /* glsl */`
vec3 wetRock(vec3 p, vec3 moss, vec3 bone, float d, float ny){
  // (every pattern is drawn in space, not in plan: on a wall of the slot nothing is drawn out into streaks)
  float n3 = vn3(p * vec3(3.1, 2.7, 3.1)), grain = vn3(p * 11. + 17.), wetS = vn3(vec3(p.x * 1.5, p.y * .7, p.z * 1.5) + 9.);
  float mossF = vn3(p * 6.) * .6 + vn3(p * 15. + 3.) * .4;
  float steep = 1. - smoothstep(.22, .6, ny), fine = 1. - smoothstep(70., 190., d);
  // the face bulges: lobes a few metres across. Under a bulge a dark hollow, on its shoulder pale wet stone and moss
  vec3 q = p * vec3(.4, .46, .4) + 4.7;
  float b0 = vn3(q) + .45 * vn3(q * 2.3 + 8.), b1 = vn3(q + vec3(0., .2, 0.)) + .45 * vn3(q * 2.3 + vec3(8., 8.46, 8.));
  float und = clamp((b1 - b0) * 4.6, -1., 1.), hol = max(und, 0.), sho = max(-und, 0.);
  // drapery: on the steep face the stone hangs in flutes three times as tall as they are wide
  float cur = vn3(vec3(p.x * .95, p.y * .26, p.z * .95) + 3.);
  // rimstone lips: no courses. Their height is warped at two scales (so they run 0.4 to 3 m apart, climb, merge and
  // die out), each hangs in scallops of uneven width, whole stretches have none, and on a near-vertical face they
  // are faint; the fine cracks are kept for ledges only
  float w1 = vn3(p * vec3(.17, .11, .17) + 2.), w2 = vn3(p * vec3(.5, .33, .5) + 13.);
  float sc = abs(sin((p.x + p.z * .8) * 1.25 + 3. * vn3(p * vec3(.3, .22, .3) + 21.)));
  float ph = p.y * 1.15 + 3.4 * w1 + 1.5 * w2 + .5 * sc * (.4 + w2) + .2 * vn3(p * 2.1);
  float lf = fract(ph), lipOn = smoothstep(.34, .6, vn3(p * vec3(.45, .8, .45) + 11.) + .25 * (1. - steep)) * mix(1., .45, steep) * fine;
  float band = vn3(vec3(p.x * .3, ph * .55, p.z * .3) + 1.7);
  vec3 rock = mix(vec3(.2, .135, .075), bone * vec3(.4, .3, .17), smoothstep(.42, .72, band)) * (.55 + .7 * n3) * (.7 + .5 * wetS) * (.74 + .52 * grain);
  rock *= mix(1., .6 + .8 * cur, steep * .8);
  rock = mix(rock, bone * vec3(.72, .6, .4) * (.7 + .5 * grain), sho * .62);
  rock *= 1. - .72 * hol;
  rock = mix(rock, bone * vec3(.66, .55, .37) * (.7 + .5 * grain), smoothstep(0., .05, lf) * (1. - smoothstep(.07, .2, lf)) * .75 * lipOn);
  rock *= 1. - .6 * smoothstep(.8, .99, lf) * lipOn;
  rock *= 1. - .55 * (1. - smoothstep(.0, .06, abs(vn3(p * vec3(1.9, 1.2, 1.9) + 31.) - .5))) * fine * (1. - steep);
  float mossC = smoothstep(.5, .57, vn3(p * vec3(.9, .8, .9)) * .55 + vn3(p * vec3(2.7, 2.3, 2.7) + 5.) * .45 + .1 * sho - .07 * hol);   // (cushions with an edge, on the shoulders)
  // (round 11) THE SHELVES, at the scale of the stair's pools: under each lip a dark undercut, the lip itself a cream rim
  // in scallops, on the tread behind it a wet shine and a cushion of bright moss, and leaves caught there. They are
  // shapes with edges, drawn in space, at one size from the lake as from the slot: nothing is drawn out along the wall.
  float slotW = 1. - smoothstep(13., 19., abs(p.x - (${AX.toFixed(1)})));                                       // the walls of the slot: shelf on shelf; on the open face a shelf here and there
  float lp = ledgePh(p), lid = floor(lp), lfr = lp - lid, lk2 = 1. - smoothstep(mix(30., 60., slotW), mix(85., 150., slotW), d);
  float onL = smoothstep(mix(.5, .3, slotW), mix(.62, .46, slotW), vn(vec2(lid * 7.3 + 1.7, p.z * .12 + p.x * .09))) * lk2;                 // (a shelf runs eight or ten metres and pinches out)
  float undK = smoothstep(.62, .93, lfr) * (1. - smoothstep(.975, 1., lfr)), rimK = max(smoothstep(.955, .985, lfr), 1. - smoothstep(.015, .05, lfr)), trdK = smoothstep(.03, .07, lfr) * (1. - smoothstep(.2, .34, lfr + .1 * (vn3(p * 1.7 + 3.) - .5)));
  rock *= 1. - .66 * undK * onL;
  rock = mix(rock, bone * vec3(.42, .5, .46) * (.75 + .5 * grain), trdK * onL * .55);                         // the wet tread, turquoise-grey
  rock = mix(rock, bone * vec3(.86, .78, .58) * (.8 + .3 * grain), rimK * onL * .75 * (.5 + .5 * smoothstep(.3, .6, vn3(p * vec3(.9, .6, .9) + 23.))));   // (the rim shows in runs, not as one drawn line)
  mossC = max(mossC * (1. - .8 * undK * onL), trdK * onL * smoothstep(.36, .5, vn3(p * vec3(.8, .5, .8) + 14.)));
  vec3 outC = mix(rock, moss * (.42 + .95 * mossF) * (.8 + .4 * n3) * (1. - .4 * hol) * (1. + .5 * trdK * onL), max(mossC, .3 * smoothstep(.5, .72, wetS)));
  {   // (round 11) within thirty metres of the lens the stone has a grain you could touch: pores and pits in the travertine,
      // moss in tufts with bright tips over dark crevices, a wet glint on the treads. Drawn in space at the scale of a hand,
      // so the walls beside the climb are sharp where they are nearest and nothing on them is a soft smear.
    float nk = 1. - smoothstep(9., 30., d), mK = max(mossC, .3 * smoothstep(.5, .72, wetS));
    float tA = vn3(p * 19.), tB = vn3(p * 47. + 3.), pore = smoothstep(.6, .7, vn3(p * 29. + 7.));
    vec3 det = outC * (.5 + .66 * tA) * (.72 + .5 * tB) * 1.14;
    det = mix(det, det * vec3(1.32, 1.26, .7), mK * smoothstep(.58, .78, tB) * .65);
    det *= 1. - .5 * (1. - mK) * pore;
    det = mix(det, bone * vec3(.8, .74, .58), (1. - mK) * (1. - pore) * smoothstep(.7, .78, tA) * .3);
    outC = mix(outC, det, nk);
  }
  vec2 lc2 = floor(p.xz * 3.3 + lid * 1.7); float lfK = step(.8, h21(lc2)) * smoothstep(.34, .2, length(fract(p.xz * 3.3 + lid * 1.7) - .5)) * trdK * onL * (1. - smoothstep(30., 70., d));
  return mix(outC, mix(vec3(.89, .66, .17), vec3(.78, .26, .1), step(.7, h21(lc2 + 3.))) * .8, lfK * .9);
}`;

const LAND_VERT = /* glsl */`
attribute vec3 aMat, aRib; varying vec3 vP, vN, vMat, vRib;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vN = normal; vMat = aMat; vRib = aRib; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const LAND_FRAG = /* glsl */`
${GL_N}
${GL_U}
${GL_FORM}
${GL_ROCK}
uniform vec3 uBone, uGold, uScar, uSpruce, uMoss, uSoil, uTurq; uniform float uFar, uLate, uRibK, uFallS, uWallHz;
varying vec3 vP, vN, vMat, vRib;
float knob(vec2 q){ return vn(q * 2.4) * .6 + vn(q * 6.3 + 4.) * .4; }
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 Vv = cameraPosition - vP; float d = length(Vv); vec3 V = Vv / max(d, 1e-3);
  float graze = smoothstep(.14, .46, abs(dot(N, V)));                 // 0 where the land turns edge-on to the eye: at every skyline
  float alt = vMat.z * 1000., n1 = fbm(vP.xz * .05), n2 = vn(vP.xz * .6), n3 = vn(vP.xz * 3.1), nearK = 1. - smoothstep(50., 150., d);
  N = normalize(N + vec3(n3 - .5, 0., vn(vP.xz * 3.1 + 7.) - .5) * (.35 + .5 * vMat.x) * nearK);
  // forest floor: soil, moss, leaf litter
  vec3 soil = mix(uSoil, uMoss * .8, smoothstep(.4, .7, n1 + .25 * n2)) * (.7 + .6 * n2);
  vec2 lc = floor(vP.xz * 2.7);
  float leaf = step(.55, h21(lc)) * smoothstep(.34, .2, length(fract(vP.xz * 2.7) - .5 - .2 * (vec2(h21(lc + 5.), h21(lc + 9.)) - .5)));
  soil = mix(soil, mix(uGold, uScar, step(.72, h21(lc + 2.))) * .75, leaf * .85 * nearK);
  soil = mix(soil, mix(uGold, uScar, .3) * .42, (1. - nearK) * .5);
  // slope forest. Dark spruce is the mass; gold and scarlet stand in soft drifts whose hue comes only from low, warped
  // noise (stands, not crowns). Crowns are round cells that tilt the normal, so each is half lit and half blue, and they
  // fade into soft clumps with distance.
  float mid = fbm(vP.xz * .011 + 3.), cfade = 1. - smoothstep(380., 1150., d), cfar = 1. - smoothstep(900., 2800., d);
  // The valley walls are modelled in paint. Spurs and gullies run down them (vRib.x: metres along the wall's contours;
  // vRib.y: 1 on the walls of the side valley, whose contours run the other way): hr is the height of the relief (1 on a
  // spur's crest, 0 in a gully), slopeS its fall along the wall. The spurs take the light raking along the wall (rock and
  // larch gold on the lit flank, blue shade on the other), the gullies hold haze and tongues of snow, and one gully of the
  // west wall beyond the gate carries the white thread of a fall (uFallS: its z). Fades in above the valley floor and with distance.
  // (vRib.y, baked per vertex: 0 on the main walls, -1 / +1 on the south / north wall of the side valley, turning smoothly
  // over the shoulder between two faces, where the count along the wall (vRib.x) is blended too: the spurs of one face run
  // on into those of the other like the bones of a fish. vRib.z is 0 on the side valley's floor. The spurs fade out with
  // height, well below the crest, and wherever the land turns edge-on to the eye: no skyline carries a rib, a band or a step.)
  float sK = vRib.x * 1000., wallK = (1. - vMat.x) * uRibK * smoothstep(90., 380., d), yS = vRib.y, sgn = 1. - 2. * clamp(yS, 0., 1.);
  float grazeR = smoothstep(.07, .26, abs(dot(N, V)));                 // (the spurs hold on a wall looked along; they still die at the skyline itself)
  // (round 13) THE WALLS ARE READ FROM THE LAKE, where a wall's skyline stands only some 300 m over the water (the slope
  // rolls back above that): everything that makes it a mountainside is painted inside those 300 m. Its lowest third (to
  // 100 m) is the dark spruce mass; a broken band of larch gold lies over that (95-190 m); the spurs run from the crest
  // two thirds of the way down (they die out between 110 and 40 m), each gold-green on the flank the light rakes and
  // blue on its lee; grey rock breaks out from 210 m and on the spurs' crests from 130 m, and a little snow lies in
  // the gullies under the crest. hiK is the look's own sun (uLow): under the high suns (morning, snow, the moon), which
  // shine flat on a wall, the spurs are painted at full strength over the shoulders as well and up to the crest; under
  // the low suns (amber, dawn: hiK 0) they keep the raking relief they had, begun a little lower on the wall (50-190 m).
  float hiK = smoothstep(.3, 1., uLow);
  float ribOn = mix(smoothstep(50., 190., alt) * (1. - smoothstep(500., 740., alt)) * vRib.z, smoothstep(40., 110., alt) * (1. - .35 * smoothstep(650., 900., alt)) * smoothstep(0., .45, vRib.z), hiK) * wallK * grazeR, fallOn = wallK * (1. - smoothstep(.1, .26, abs(yS))) * step(0., vP.x);   // (the fall keeps to the main wall's own face: where the slope begins to turn toward the side valley a line of constant z would lie along a contour)
  float hr = .6, slopeS = 0., gul = 0., thr2 = 0., gz = 0., puff = 0., bl = 0.;
  vec3 c3 = vec3(0.), Lr = uSun;
  if (max(ribOn, fallOn) > .01) {
    c3 = normalize(vec3(yS, 0., 1. - abs(yS)));                     // the way along the wall, from the wall itself (never from the coarse mesh's normal): it turns smoothly over a shoulder
    float wv = (vn(vec2(sK * .0016, alt * .0019 + 3.)) - .5) * .6, ya = alt * .0011, e = .1, u1 = sK * mix(.0055, .0078, hiK) + wv, u2 = sK * .019 + wv * 1.2;   // (the spurs lean and wander a little as they climb)
    // (the relief is a function of the way along the wall only, so every crest runs up the slope: none can turn along a contour)
    float h0 = 1. - abs(2. * vn(vec2(u1, 7.3)) - 1.), ha = 1. - abs(2. * vn(vec2(u1 - e, 7.3)) - 1.), hb = 1. - abs(2. * vn(vec2(u1 + e, 7.3)) - 1.);
    float g0 = 1. - abs(2. * vn(vec2(u2, 3.1)) - 1.), ga = 1. - abs(2. * vn(vec2(u2 - e, 3.1)) - 1.), gb = 1. - abs(2. * vn(vec2(u2 + e, 3.1)) - 1.);
    hr = mix(.55, h0 * .7 + g0 * .3, .65 + .35 * vn(vec2(sK * .004 + 5., ya * 2.6))); slopeS = clamp((hb - ha) * 4.6 + (gb - ga) * 1.7, -1.2, 1.2);
    // the far fall: a white ribbon never under three and a half pixels wide, falling in leaps; on the ledge between two leaps
    // it is hidden and a puff of mist stands there
    float sc = vP.z - (uFallS + 10. * sin(alt * .019) + 4. * sin(alt * .061)), fa = fallOn * smoothstep(70., 90., alt) * (1. - smoothstep(300., 330., alt));
    gz = (1. - smoothstep(8., 60., abs(sc))) * fallOn * smoothstep(60., 110., alt) * (1. - smoothstep(330., 400., alt));
    hr = mix(hr, .04, gz * .85 * step(.01, ribOn));
    float fw2 = max(1.3, d * .004), lw = abs(fract(alt * .017 + .4 * vn(vec2(alt * .011, 1.))) - .5), leap = 1. - smoothstep(.36, .46, lw);   // (lw: .5 on a ledge)
    thr2 = smoothstep(fw2 * 1.3, fw2 * .55, abs(sc) + fw2 * .7 * (vn(vec2(alt * .07, 3.)) - .5)) * fa * leap * (.5 + .5 * smoothstep(.25, .5, vn(vec2(sc * .4, alt * .09 + uTime * .9))));
    puff = exp(-sc * sc / (fw2 * fw2 * 16.)) * fa * smoothstep(.3, .47, lw) * (.55 + .45 * vn(vec2(sc * .12 + uTime * .1, alt * .06 - uTime * .12)));
    gul = (1. - smoothstep(0., .5, hr)) * step(.01, ribOn);
    // (under a low sun a wall that faces away from it still takes the light that rakes along it through the gap of the side
    // valley: its spurs are lit on one flank, blue on the other, not a dark slab)
    bl = smoothstep(.1, -.3, dot(N, uSun)) * (1. - uLow);
    Lr = normalize(mix(uSun, N * .5, bl) + c3 * (1.1 * sgn) + vec3(0., .25, 0.));
  }
  vec2 sw = vP.xz * .0043 + vec2(.0016 * vP.y, 0.); sw += (vec2(fbr(sw * 2.1 + 3.), fbr(sw * 2.1 + 11.)) - .5) * .4;
  float st1 = fbr(sw * 2.9), st2 = fbr(sw * 6.7 + 5.), st3 = fbr(sw * 4.3 + 21.);
  float tex = fbr(mat2(.8, .6, -.6, .8) * vP.xz * .045 + vP.y * .02);
  float larch = smoothstep(85., 125., alt + 50. * (mid - .5)) * (1. - smoothstep(150., 215., alt + 50. * (mid - .5)));
  float foot = 1. - smoothstep(35., 240., alt + 90. * (st2 - .5));
  float share = clamp(.06 + .5 * foot + .5 * larch + .22 * uLate * smoothstep(120., 300., alt) * (1. - smoothstep(520., 640., alt)), 0., 1.), thA = .7 - .28 * share;   // (late October: the gold has climbed the walls)
  vec2 cp = mat2(.866, .5, -.5, .866) * (vP.xz + vec2(0., .45 * vP.y)) / 6.6, ci = floor(cp), cfr = fract(cp), dv = vec2(0.);
  float F1 = 9., cidh = .5;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), r = g + vec2(h21(ci + g), h21(ci + g + 37.7)) * .8 + .1 - cfr; float dd = dot(r, r);
    if (dd < F1) { F1 = dd; dv = r; cidh = h21(ci + g + 71.3); }
  }
  F1 = sqrt(F1);
  float dome = 1. - smoothstep(0., .62, F1), gap = smoothstep(.4, .72, F1), fm = smoothstep(12., 55., alt) * cfade * (1. - vMat.x);
  float litF = ribOn * smoothstep(.1, .7, -slopeS * sgn);          // the flank of a spur that the raking light reaches
  float aut = smoothstep(thA - .05, thA + .05, st1 * .62 + st2 * .38 + (tex - .5) * .14 + (.2 + .25 * bl) * litF * smoothstep(190., 260., alt) - .1 * gul * ribOn * smoothstep(190., 260., alt));
  // a mountainside in bands: its lower third is dark spruce (the gold stays on the valley floor and comes back as the larch band above)
  aut *= 1. - .85 * smoothstep(50., 110., alt + 50. * (mid - .5)) * (1. - vMat.x) * (1. - .3 * litF);   // (no drifts of scarlet up the wall: above the spruce the colour is the larch band's)
  // (round 10) and above it a broken band of larch gold, most on the lit flanks of the spurs
  float wallF = (1. - vMat.x) * uRibK * smoothstep(90., 380., d), shF = ribOn * smoothstep(.1, .7, slopeS * sgn);
  aut = max(aut, larch * smoothstep(.4, .6, st2 * .55 + tex * .3 + .22 * litF - .12 * shF) * .92 * wallF);
  vec3 autC = mix(uGold * vec3(1., .86, .6), uScar * 1.05, smoothstep(.5, .64, st3) * (1. - larch) * .85 * (1. - .85 * wallF * smoothstep(60., 150., alt)));
  vec3 forest = mix(uSpruce * 1.85, autC * (.46 + .2 * larch * wallF), aut * .88 * (.35 + .65 * cfar));
  // a wall is a mountainside: its lowest third a dark spruce mass, each spur gold-green on the flank the light rakes and blue on the other
  forest *= 1. - .42 * (1. - smoothstep(80., 130., alt + 40. * (mid - .5))) * wallF * (1. - .5 * litF);
  forest = mix(forest, forest * vec3(1.42, 1.3, .8), mix(.55, .8, hiK) * litF * (1. - uSnow));
  forest = mix(forest, forest * vec3(.6, .72, 1.), .5 * shF);
  vec2 tw = vec2(-(.866 * dv.x + .5 * dv.y), .5 * dv.x - .866 * dv.y);          // from the crown's centre to here, in world xz
  float side = dot(tw, normalize(uSun.xz + vec2(1e-5, 0.))) * (.3 + .7 * sunGate(vP));
  float dsoft = 1. - smoothstep(.26, .66, F1);                                  // light and shade live inside the crown, so no edge shows where two crowns meet
  float cellK = 1. - .7 * uSnow;                                                 // (under first snow the crowns are not each picked out: the white lies in drifts)
  forest *= mix(1., (1. + (.4 * cidh - .18) * dsoft) * (1. + .85 * side * dsoft) * (1. - .32 * gap * (1. - .5 * aut)), cfade * cellK);
  forest *= mix(1., .78 + .44 * tex, cfar * (1. - .6 * cfade));
  float crown = dome;
  vec3 rock = vec3(.4, .39, .39) * (.65 + .7 * vn(vP.xz * .02 + vP.y * .03));
  rock = mix(rock, uBone * vec3(.52, .43, .31) * (.6 + .6 * tex), ribOn * (.35 + .4 * litF));                 // (the spurs: warm bare rock)
  float rk = max(smoothstep(215., 300., alt + 80. * (mid - .5)) * (.5 + .5 * smoothstep(.35, .6, tex + .3 * smoothstep(330., 480., alt))), smoothstep(.74, .58, N.y) * smoothstep(150., 380., alt));   // (broken rock under the crest, bare above it)
  rk = max(rk, ribOn * max(smoothstep(.74, .96, hr + .25 * (tex - .5)) * smoothstep(130., 250., alt + 90. * (mid - .5)) * .85, gz * .55));
  forest *= 1. - .34 * gul * ribOn;
  float snowL = mix(420., 340., uSnow);
  float sn = smoothstep(snowL - 70., snowL + 90., alt + 170. * (mid - .5) + 150. * gul * ribOn) * smoothstep(.3, .62, N.y + .25 * tex);
  vec3 land = mix(soil, forest, smoothstep(12., 55., alt));
  land = mix(land, rock, rk); land = mix(land, vec3(.86, .89, .95), sn);
  float dust = uSnow * smoothstep(.4, .8, N.y) * (.25 + .3 * n2 + .45 * smoothstep(120., 520., alt)) * (1. - sn);      // first snow: thicker with height
  float drift = smoothstep(.36, .6, st1 * .5 + st3 * .28 + .22 * tex + .26 * smoothstep(140., 520., alt) + .16 * (hr - .5) * ribOn - .2 * gul * ribOn + .1 * litF);
  dust *= mix(1., mix(.7, 1.7 * drift + .1, cfade), smoothstep(12., 55., alt));   // on the canopy it lies in drifts and bands that follow the spurs and thicken with height; dark spruce shows through in ragged patches
  land = mix(land, vec3(.8, .84, .9), clamp(dust, 0., .88));
  // travertine: cream, amber stain, moss on the shoulders
  vec3 trav = uBone * (.42 + .24 * n2 + .14 * n3) * mix(vec3(1.), vec3(1.05, .92, .72), smoothstep(.4, .75, n1));
  trav = mix(trav, uMoss * (.55 + .5 * n3), smoothstep(.5, .75, n1 * .5 + n2 * .55 + .2 * N.y - .1) * .85);
  trav = mix(trav, vec3(.82, .86, .92), uSnow * smoothstep(.6, .9, N.y) * .5 * (1. - vMat.y));
  float face = smoothstep(.72, .4, N.y) * vMat.x, streak = vn3(vec3(vP.x * 1.1, vP.y * .45, vP.z * 1.1));   // (drapery two to one, drawn in space)
  trav = mix(trav, mix(vec3(.2, .19, .17), uMoss * .5, smoothstep(.35, .7, streak)) * (.6 + .5 * n3), face * .82);
  // the rock the fall runs over (marked by a negative altitude): always wet, near black, with round cushions of dark moss
  // (clumps, not streaks), so the white water reads as lace on it in every light and from any distance
  float wetF = clamp(-vMat.z * 120., 0., 1.);
  if (wetF > .001) trav = mix(trav, wetRock(vP, uMoss, uBone, d, N.y), wetF * .9);
  vec3 alb = mix(land, trav, vMat.x);
  alb *= mix(1., .7 + .38 * vn3(vP * 8.) + .22 * vn3(vP * 21. + 3.), nearK * vMat.x);
  // the sheet of water over the shoal and the outlet tongue. Under the film the travertine is wet and dark: tan lips of
  // rimstone with a white foam line, amber pools between them; knobs stand out of it cream and dry, tilting the normal
  // so each has a lit and a shaded side, with a foam tail on its downstream (+Z) side; flow threads at three scales run
  // to the lip; leaves ride the sheet toward the fall. Seen at a grazing angle a pixel covers a long strip of ground, so
  // every layer fades to its mean (FF) before its cells get smaller than a pixel: no sparkle in the middle distance.
  vec2 fwv = fwidth(vP.xz); float pz = max(fwv.x, fwv.y);
  #define FF(cell) (1. - smoothstep(.3, .75, pz / (cell)))
  // nf: the last few metres under the lens. There the painted knobs give way to the real stones (instanced, each with its
  // own collar of foam) and the sheet is clear water over small terraces
  float nf = 1. - smoothstep(3.5, 10., d), kw = mix(.06, .012, nf);
  float k1 = vn(vP.xz * 2.4), kn = mix(.5, k1, FF(.42) * (1. - nf)) * .6 + mix(.5, vn(vP.xz * 6.3 + 4.), FF(.16) * (1. - nf)) * .4;
  float film = vMat.y * (1. - face), wat = smoothstep(.66 + kw, .66 - kw, kn) * film, t = uTime, thr = 0., foam = 0., pearl = 0., lipF = 0., crestF = 0., lf = 0., flowN = .5;
  if (vMat.x > .01) {
    float nk = 1. - smoothstep(6., 24., d), nk3 = 1. - smoothstep(2.5, 9., d);
    vec2 kg = (vec2(vn((vP.xz + vec2(.15, 0.)) * 2.4), vn((vP.xz + vec2(0., .15)) * 2.4)) - k1) / .15;      // relief from the broad knobs only
    N = normalize(N + vec3(-kg.x, 0., -kg.y) * ((.2 + .75 * nf * smoothstep(.6, .72, kn)) * vMat.x * (1. - face) * FF(.42)));
    vec2 rp = vP.xz * vec2(.3, .62) + vec2(vn(vP.xz * .33), vn(vP.xz * .33 + 5.)) * 1.2, ri = floor(rp), rf = fract(rp); float D1 = 9., D2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)), r = g + vec2(h21(ri + g + 3.), h21(ri + g + 19.)) * .76 + .12 - rf; float dd = dot(r, r);
      if (dd < D1) { D2 = D1; D1 = dd; } else if (dd < D2) D2 = dd;
    }
    float rd = sqrt(D2) - sqrt(D1), wd = mix(.15, .045, nf) + pz * .9;                                     // lips widen and dim with distance instead of breaking into dots
    float dam = smoothstep(wd, wd * .4, rd) * film * min(1., .22 / wd), pool = smoothstep(.14, .5, rd) * film;
    lipF = exp(-(vP.z - 246.) * (vP.z - 246.) * 1.1) * vMat.y * step(vP.z, 251.);      // a rimstone rim a hand above the lake's level, 11 m inside the crest
    // (round 12) THE TOP LAKE'S LEVEL WATER LIES OVER THE TONGUE TO THE SHOAL'S CREST (z 256.6: the hero's mirror ends there).
    // lakeK: 1 under that water. There the ground is the lake's floor seen through still clear water: small rimstone pools
    // with thin pale rims at every distance, no running threads, no pearls, no leaves racing to the fall, no painted sheen
    // (the mirror above does that); and a hair of white along the crest where the lake breaks into the sheet.
    float lakeK = 1. - smoothstep(255.2, 257., vP.z); crestF = exp(-(vP.z - 256.9) * (vP.z - 256.9) * 2.2) * film; lipF *= 1. - lakeK;   // (the old rim 11 m inside the crest lies under the lake now: no white line across it)
    dam = max(dam * (1. - .8 * lakeK), max(lipF, crestF * .8));
    // (round 23) UNDER THE RUNNING SHEET THE BED KEEPS THREE TENTHS OF THE TILT. The two lines that tilt the normal (the
    // 0.3 m grain of the land, and the knobs' relief, at the head of this block) throw the sun's light into bright and
    // near-black patches a hand to an arm across. On dry stone that is its form. Under LIVE's white threads and net it
    // was hidden; with the net toned down it is what read as a mottled, muddy floor in the sunlit looks: light that
    // reaches a bed through moving water is spread by the surface. So where the running sheet lies the normal goes seven
    // tenths of the way back to the land's own. 0.7: a level tuned on the whole shoal in five looks.
    // sheetK: THE RUNNING SHEET'S PRESENCE AT THE PLACE, with the eye taken out (the motion pass). Live's wat reads the
    // eye (nf, in its width kw and in kn; and the footprint). Of wat's own terms sheetK keeps the FILM alone (the sheet
    // as the land carries it), and drops nf, the footprint AND the whole knob term kn: kn's near part is the eye, and
    // its far part alone would leave the full tilt on every painted knob's place under the lens too, where live draws
    // water and no knob: dark shaded humps in the sunlit looks (seen in a reckoning, not rendered). So the tilt is three tenths wherever the film lies, on
    // a painted knob's place as between the knobs, far and near alike (a far knob's relief is three tenths of live's
    // now). Nothing under the lake's level water (1 - lakeK): the lake's floor is live's. (The line stands here, below
    // lakeK, for that; nothing between the tilt's lines and this one reads N.)
    float sheetK = film * (1. - lakeK);
    N = normalize(mix(N, normalize(vN + vec3(0., 1e-5, 0.)), .7 * sheetK));
    float flow = vn(vec2(vP.x * 1.6, vP.z * .45 - t * 1.6));
    float a1 = vn(vec2(vP.x * 6.5 + flow * 2., vP.z * .7 - t * 2.6)), a2 = vn(vec2(vP.x * 15. + a1 * 2.5, vP.z * 1.5 - t * 4.)), a3 = vn(vec2(vP.x * 29. + a2 * 2., vP.z * 3. - t * 7.));
    float r1 = 1. - abs(2. * a1 - 1.), r2 = 1. - abs(2. * a2 - 1.), r3 = 1. - abs(2. * a3 - 1.);
    r1 *= r1; r1 *= r1 * r1; r2 *= r2; r2 *= r2 * r2; r3 *= r3; r3 *= r3;
    // the broad flow layer is 15 cm strokes: under the nose they would be 40 px smears, so it gives way there to the two
    // fine ones (threads a few pixels wide that run at the lens) and to the little terraces below
    float far1 = smoothstep(2.5, 7., d);
    // (round 23) thr, on the next line, is still computed and since round 22 is READ BY NOTHING: the straight threads it
    // draws (nine to ten times as long as wide, running at the lens) are out of the picture. The line stands as it was;
    // flowN, set on the same line, is still read (by the sheen at the composite).
    thr = (mix(.12, r1, FF(.5)) * .6 * (.35 + .65 * nearK) * far1 + r2 * (.6 - .48 * nf) * FF(.3) + mix(r3, r3 * r3, nf) * (.45 + .2 * nf) * FF(.16)) * (1. - lakeK); flowN = mix(.5, a1, FF(.5) * far1);
    float tail = max(smoothstep(.64, .78, kn + vn((vP.xz - vec2(0., .22)) * 2.4) * .6 - k1 * .6), .65 * smoothstep(.64, .78, kn + vn((vP.xz - vec2(0., .55)) * 2.4) * .6 - k1 * .6)) * FF(.42) * (1. - nf);
    float collar = smoothstep(.035, .0, abs(kn - .66)) * nf * FF(.04);                          // a thin line of foam where each knob meets the water
    foam = (tail * (.3 + .7 * mix(.5, smoothstep(.3, .7, vn(vec2(vP.x * 11., vP.z * 3. - t * 6.))), FF(.3))) * (1. - .55 * nf) + collar * .8) * (1. - lakeK) + dam * (.3 + .7 * mix(.5, vn(vec2(vP.x * 7., vP.z * 7. - t * 4.)), FF(.15))) * (1. - .7 * lakeK);
    // (round 23) THE WHITE NET IS TONED DOWN AND OPENED, NOT TAKEN OFF. What made it a projected grid: every rim of the
    // pools (3.3 m by 1.6 m) and of the little terraces (0.87 m by 0.42 m) the same near white (the bone at 0.8 to 0.86,
    // nine tenths strong), closed all round, each carrying a line of foam its whole length (0.7 of white), all one
    // width; and between them straight threads nine to ten times as long as wide, running at the lens. Round 22 took
    // net and threads off and left a brown floor. Now the rims stay, clearly seen, as pale stone rims of a terrace of
    // pools, and three things break the grid, all three by the place alone (larger noises: 4.3 m and 1.4 m; 1.1 m):
    //   rimV: a rim's stone stands out in RUNS, six tenths to its whole strength along its length;
    //   rimF: its foam is at LIVE's own strength only in short arcs, about a third of its length, and elsewhere under
    //         half of it (0.45);
    //   rimW: its WIDTH varies along its length: where the noise is low the rim's flank is thinned toward its crown
    //         (dam taken a second time, by four tenths at the most: the flank keeps at least six tenths of its own
    //         strength; a soft edge, never above live's own).
    // And the hardest white is pressed down: the foam on a rim's crown loses three tenths where the rim stands at its
    // full strength (1 - .3 * dam), a thin near rim more than a broad far one. The four levels (0.6, 0.45, 0.6, 0.3)
    // are levels tuned on the whole shoal in five looks (the notes have the rims' measured contrast against the pool
    // beside live's, position by position).
    // THE FOAM IS TAKEN DOWN BY SUBTRACTING live's own rim term from the line above, which stands as it was. The term
    // is typed twice: the line above and the line below MUST CHANGE TOGETHER, or a residue is left on every rim.
    // The hair of white on the crest (crestF) is live's.
    float rimB = vn(vP.xz * .23 + 11.) * .6 + vn(vP.xz * .71 + 3.) * .4, rimV = smoothstep(.3, .62, rimB), rimF = smoothstep(.53, .68, rimB);
    float rimW = mix(dam, 1., mix(.6, 1., smoothstep(.35, .65, vn(vP.xz * .9 + vec2(31., 17.)))));               // RIDES on live's mask dam: 1 at most
    foam = max(foam - dam * (1. - .7 * lakeK) * (.3 + .7 * mix(.5, vn(vec2(vP.x * 7., vP.z * 7. - t * 4.)), FF(.15))) * (1. - crestF) * (1. - lakeK) * (1. - mix(.45, 1., rimF) * rimW * (1. - .3 * dam)), 0.);   // RIDES on live's mask dam: what is left is never above live's; nothing is taken off under the lake's level water (1 - lakeK)
    // A RIM IS A LOW STONE DAM: its flank away from the sun stands in a thin soft shade. rimG: the way down the rim's
    // flank on the ground (the slope of rd, the distance from the rim's crest, taken from the pixel's own footprint);
    // rimL: 1 on the middle of the flank that faces away from the sun (by the sun's own direction), 0 on the crown, at
    // the rim's foot and on the sunward flank; only where the sun reaches (sunGate), and gone before a rim is finer than
    // a pixel (FF of 0.3 m, a rim's breadth).
    vec2 rimX = dFdx(vP.xz), rimY = dFdy(vP.xz), rimD = vec2(dFdx(rd), dFdy(rd));
    vec2 rimG = vec2(rimD.x * rimY.y - rimD.y * rimX.y, rimD.y * rimX.x - rimD.x * rimY.x) * sign(rimX.x * rimY.y - rimX.y * rimY.x);
    float rimL = smoothstep(0., .8, -dot(rimG, uSun.xz) / max(length(rimG) * length(uSun.xz), 1e-6)) * 4. * dam * (1. - dam) * FF(.3) * sunGate(vP);   // RIDES on live's mask dam
    // little rimstone terraces under the lens: pools half a metre long, each held by a thin white rim, clear water over pale marl
    vec2 tq = vP.xz * vec2(1.15, 2.4) + vec2(vn(vP.xz * .8 + 3.), vn(vP.xz * .8 + 8.)) * 1.1 + (vec2(vn(vP.xz * 2.3 + 13.), vn(vP.xz * 2.3 + 29.)) - .5) * .8, tci = floor(tq), tcf = fract(tq); float E1 = 9., E2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)), r = g + vec2(h21(tci + g + 41.), h21(tci + g + 57.)) * .8 + .1 - tcf; float dd = dot(r, r);
      if (dd < E1) { E2 = E1; E1 = dd; } else if (dd < E2) E2 = dd;
    }
    float nfL = max(nf, lakeK * (1. - smoothstep(12., 34., d)));                           // (under the lake's level water the little terraces are the floor as far as they can be told apart)
    float te = sqrt(E2) - sqrt(E1), tw = .05 + pz * 2.2, trim = smoothstep(tw, tw * .3, te) * min(1., .1 / tw) * film * nfL * (.3 + .7 * smoothstep(.3, .62, vn(vP.xz * 1.7 + 5.))), tin = smoothstep(.03, .4, te);
    pearl = (step(.975, vn(vP.xz * 11. + vec2(t * 1.1, -t * 4.))) * (1. - nk) * .4 + step(.968, vn(vP.xz * 27. + vec2(t * 2.3, -t * 9.))) * nk3) * (1. - lakeK);
    float kn2 = mix(.5, vn(vP.xz * 15.) * .55 + vn(vP.xz * 37. + 9.) * .45, FF(.05));    // pebbled travertine under the lens
    alb *= mix(1., .7 + .6 * kn2, vMat.x);
    vec3 wet = uBone * vec3(.52, .385, .2) * (.72 + .56 * kn2) * (.8 + .4 * n2);
    wet = mix(wet, uBone * vec3(.33, .2, .065) * (.7 + .6 * n3), pool * .9);
    wet = mix(wet, uTurq * .3, pool * smoothstep(.6, .85, n1 + .3 * n2) * .4);
    float tk = 1. - smoothstep(253., 260., vP.z);                                          // the outlet tongue: pale marl terraces under clear water
    wet = mix(wet, mix(uBone * vec3(.6, .57, .44) * (.8 + .4 * kn2), uTurq * .62, pool * .55), tk);
    // (round 23) THE WHOLE SHOAL IS CLEAR WATER OVER PALE MARL, as live's own tongue is (the line above). Beyond the
    // tongue the bed was tan lips and amber pools (the four lines above): hidden under live's white threads and net, and
    // once those are toned down it is the brown, muddy floor of round 22. So the tongue's own paint lies over the whole
    // sheet (1 - tk: the tongue itself is as it was), with a pool's water painted by its depth: pale and milky over the
    // shallow margin inside the rim (the turquoise at 1.15, mixed 0.45 toward live's rim colour, the bone at 0.8: the
    // marl seen through a hand of water), deeper turquoise in its middle (0.55; live's tongue has 0.62 all over), from
    // 0.35 to 0.8 of rd (a pool's middle lies at about 1 of it), over eight tenths of a pool for live's 0.55: shallow
    // water in the open, not under the lake. The five levels (1.15, 0.45, 0.55, the two ends of the depth, 0.8) are
    // levels tuned on the whole shoal in five looks: they hold live's brightness with its threads gone in the sunlit
    // looks, keep the rims seen against the pools in shade, and keep the water from a loud blue under the moon. By
    // the place alone. (The motion pass: the marl between a rim and its pool is no longer the tongue's tan (.6, .57,
    // .44) but the same marl seen through a finger of water, paler and toward the water's colour (.54, .66, .58: a
    // tenth brighter): the little terraces no longer lay a brighter paint of their own under the lens, so the bed
    // itself carries that light, far and near alike; and nothing on the sheet is tan. A level tuned on the whole
    // shoal in five looks.)
    wet = mix(wet, mix(uBone * vec3(.54, .66, .58) * (.8 + .4 * kn2), mix(mix(uTurq * 1.15, uBone * .8, .45), uTurq * .55, smoothstep(.35, .8, rd)), pool * .8), (1. - tk) * (1. - lakeK));   // (not under the lake's level water: the lake's floor is live's)
    // (round 23) THE RIM: live's own pale rim (the bone at 0.8), with only so much stone in it that it reads as a low
    // stone dam and not as a white line: pebbled (0.8 to 1 of it), a warmer cream on its crown (dam * dam), the thin
    // soft shade on its flank away from the sun (rimL, a quarter), standing out in runs (rimV) and of varying width
    // (rimW). Under the lake's level water and on the crest it is as it was. RIDES on live's mask dam: no colour above
    // live's 0.8, no strength above live's 0.92.
    wet = mix(wet, mix(uBone * mix(vec3(.8), vec3(.8, .77, .68), dam * dam) * (.8 + .2 * kn2) * (1. - .25 * rimL), uBone * .8, max(lakeK, crestF)), dam * .92 * mix(rimW * mix(.6, 1., rimV), 1., max(lakeK, crestF)));
    vec3 bedR = wet;                                // the bed with its rims as the whole shoal's lines paint it at this place: the same far and near
    vec3 marl = mix(uBone * vec3(.62, .54, .36) * (.72 + .56 * kn2), uTurq * (.5 + .3 * kn2), tin * .9);
    marl = mix(marl, uBone * vec3(.56, .4, .2) * (.7 + .6 * kn2), smoothstep(.62, .8, h21(tci + 3.3) ) * .55 * (1. - tk));   // one pool in three stained amber
    wet = mix(wet, marl, nfL * .9 * (1. - dam));
    // (round 23, the motion pass) THE LITTLE TERRACES ARE THE FINE RELIEF OF THE SAME BED: THE SAME PLACE CARRIES THE
    // SAME PAINT FAR AND NEAR. Live's line above lays its little terraces under its mask nfL (the lens, and the lake).
    // On the running sheet the line below takes that paint off again, whole, and lays in its place the bed as the
    // whole shoal's lines paint it there (bedR), with the little pools as a MODULATION of that paint: paler and
    // warmer toward a little pool's margin, deeper and bluer toward its middle, by te alone:
    //     bedR * (1 + (.5 - smoothstep(.15, .35, te)) * (.5, .2, -.1) * FF(.42) * (1 - dam))
    // THE MEAN of smoothstep(.15, .35, te) over the shoal's ground is 0.500 (counted at 300,000 places, twice: 0.501
    // and 0.499), so the modulation's mean over the little pools is 1 in every channel: where the footprint fades it
    // (FF of 0.42 m, a little terrace's lesser breadth: whole where a terrace is resolved, gone before it is finer
    // than a pixel) the picture goes to bedR itself with no step in brightness or colour. It hangs on no distance:
    // not nfL, not nf. It gives way on a rim (1 - dam: RIDES on live's mask dam) and has no pebbling of its own.
    // WHAT THE MASK nfL STILL DOES, place by place (near paint less far paint at one place, one footprint). The paint is
    //     lakeK * mix(bedR, marl, nfL * .9 * (1 - dam)) + (1 - lakeK) * bedR * modulation,
    // so the step of nfL from 0 to 1 is  lakeK * .9 * (1 - dam) * (marl - bedR):
    //   on the running sheet (lakeK 0): NOTHING, at every kind of place: a little pool's margin in a big pool's
    //     middle (live's own step there: +0.176 in albedo luminance, the reader's count), beside a big rim (live:
    //     +0.056), a little pool's middle on a big pool's margin, a stained pool of live's (the stain lies in marl,
    //     which is wholly covered), on a rim (dam 1: nothing in live either);
    //   under the lake (lakeK 1): live's own step, the term above with bedR live's own paint there: the lake's floor
    //     is live's by pixel;
    //   in the crest's strip (z 255.2 to 257, 1.8 m): lakeK times a step of live's kind, against a bed that is
    //     live's with at most (1 - tk) * (1 - lakeK) of the shoal's floor in it (lakeK * (1 - lakeK) * (1 - tk) is
    //     0.10 at the most): NOT shown smaller than live's at every point of that strip.
    // The amplitudes (.5, .2, -.1) and the two ends of te are levels tuned on the whole shoal in five looks.
    wet = mix(wet, bedR * (1. + (.5 - smoothstep(.15, .35, te)) * vec3(.5, .2, -.1) * FF(.42) * (1. - dam)), 1. - lakeK);
    wet = mix(wet, mix(uBone * mix(vec3(.86), vec3(.86, .83, .73), trim) * (.8 + .2 * kn2), uBone * .86, max(lakeK, crestF)), trim * .9 * mix(.6, 1., max(lakeK, crestF))); foam += trim * (.25 + .75 * vn(vec2(vP.x * 9., vP.z * 9. - t * 3.))) * (1. - lakeK) * mix(.5 * rimF, 1., max(lakeK, crestF));   // (round 23: the little terraces' rims likewise: live's pale rim (0.86), pebbled, warmer on the crown, six tenths strong under the running sheet (a level tuned on the whole shoal in five looks), their foam only in the arcs where the pools' rims carry theirs and half of live's there; under the lake's level water AND on the crest every rim and its foam are as they were. RIDES on live's mask trim (which carries nfL: the little rims are live's own near paint): no colour and no strength above live's. Its step, 0.54 of (the rim's colour less the bed), is at most 0.17 in albedo luminance; live's own, 0.9 of (0.86 of the bone less live's marl), is 0.12 to 0.28: smaller at most places, not shown smaller at every one)
    // (round 23, the motion pass) THE WATER RUNS: RIPPLE TRAINS ON ITS SURFACE, moving down the current (+z, with the
    // current's own sideways wander, flow). With live's threads and its foam on every rim gone the sheet stood still
    // but for the foam arcs. Now short soft crests lie ACROSS the current, two and a half times as broad across it as
    // along it (never a line along the flow): over a rim they are quick and bunched (crest to crest about 0.24 m,
    // 1 m/s), in a pool's middle slow and wide (about 0.44 m, 0.75 m/s: between live's rim foam, 0.57 m/s, and its
    // leaves, 2.4 m/s); ripK: 1 on a rim, 0 from under half of the way to a pool's middle (rd, by the place). Each
    // train fades to its mean before a crest is finer than a pixel (FF). rip: -1 to 1, mean 0, and 0 where the running
    // sheet is not (sheetK: the film, not under the lake). It is a gentle shading of the ground's colour under the
    // sheet (0.3 of it at the very most, a few hundredths of the picture's range as a rule: the line after live's two
    // below): no white, no line. 0.3: a level tuned on the whole shoal in five looks. By the place and the world's
    // clock alone: it hangs on no mask of live's (not wat, not nf, not nfL, not dam), so it lies on a painted knob's
    // place as on the water beside it, far and near alike; nothing under the lake's level water (rip is 0 there).
    // (round 25) The trains no longer go into flowN: live's sheen line reads flowN under live's mask wat, which reads
    // the eye, and the reader of round 24 found that mask making more difference than in live wherever a trough lay
    // on a painted knob's place. flowN is live's again; the shading of the ground's colour carries the motion alone.
    float ripK = 1. - smoothstep(.1, .45, rd);
    float rip = (mix(mix(.5, vn(vec2(vP.x * 1.8 + flow + 7., vP.z * 4.5 - t * 3.4)), FF(.22)), vn(vec2(vP.x * 3.3 + flow, vP.z * 8.3 - t * 8.3)), ripK * FF(.12)) - .5) * 2. * sheetK;
    alb = mix(alb, wet, film * max(smoothstep(.72 + kw, .72 - kw - .04 * (1. - nf), kn), lakeK));     // (under the lake no painted knob of dry stone: they were dark blots under the water)
    alb *= 1. - .45 * nf * film * smoothstep(.09, .0, abs(kn - .7)) * (1. - lakeK);                       // the wet dark line round each knob
    alb *= 1. + .3 * rip;                           // (round 23, the motion pass) the ripple trains' shading: by the place alone (rip carries sheetK), under no mask
    // leaves riding the sheet: each a hand long, a pointed oval with a midrib, lying any way round; gold, tan and a few scarlet
    vec2 lq = vec2(vP.x, vP.z - t * 2.4) * 5.5, lcc = floor(lq), lo = fract(lq) - .5 - .3 * (vec2(h21(lcc + 5.), h21(lcc + 9.)) - .5);
    float lan = h21(lcc + 17.) * 6.283, lca = cos(lan), lsa = sin(lan), lh = h21(lcc + 2.); vec2 lr = vec2(lo.x * lca + lo.y * lsa, -lo.x * lsa + lo.y * lca);
    float lsh = smoothstep(0., .03, .11 * (1. - lr.x * lr.x * 14.) - abs(lr.y));
    lf = step(mix(.975, .93, uLate), h21(lcc + 31.)) * lsh * wat * FF(.11) * (1. - lakeK);
    wat *= 1. - lakeK;                                                                        // (no painted sheen under the mirror)
    alb = mix(alb, mix(mix(uGold, uGold * vec3(.8, .62, .4), step(.5, lh)), uScar * .85, step(.84, lh)) * (.62 + .38 * smoothstep(0., .03, abs(lr.y))) * .95, lf);
  }
  alb = mix(alb, alb * vec3(.5, .72, .7) + vec3(0., .015, .02), vMat.x * .35 * (1. - film));
  float fmask = fm * (1. - rk) * (1. - sn);                                    // crowns stand out of the slope: lit side, blue side
  vec3 Nl = normalize(N + vec3(tw.x, 0., tw.y) * (fmask * dsoft * cellK) - c3 * (slopeS * (2.2 + .8 * bl) * ribOn));
  float ndl = max(dot(Nl, normalize(mix(uSun, Lr, ribOn))), 0.), shadeK = ribOn * smoothstep(.05, .6, slopeS * sgn);   // (the blue is the painted spur's own lee flank: taken from the coarse mesh normal it stepped along every arete)
  float cl = 1. - .5 * smoothstep(.52, .7, fbm(vP.xz * .0017 + uTime * vec2(.006, .003))) * smoothstep(40., 200., alt);
  vec3 ambL = mix(mix(uGndCol, uSkyCol, Nl.y * .5 + .5), uSkyCol * vec3(.8, .95, 1.3), .45 * fmask);
  ambL = mix(ambL, uSkyCol * vec3(.66, .9, 1.5), (.6 + .3 * bl) * shadeK) * mix(1., .6 + .5 * hr, ribOn);                    // a spur's shaded flank and the gullies: blue, and darker the deeper
  vec3 lightC = uSunCol * ndl * mix(sunGate(vP), 1., .65 * ribOn) * cl * (1. + (.35 + .9 * bl) * ribOn) + ambL + uShW * (1.6 * vMat.x * (1. - .3 * wetF) + 3. * sn * uMoon)   // (and the far snows keep a glimmer under the moon)
    + uFill * (1. - .4 * vMat.x) * (1. - sn) * (1. - .65 * shadeK)
    + (uSkyCol * 1.5 + uSunCol * .14) * wetF * (1. - .5 * smoothstep(0., .3, ndl));       // the fall's rock in shade is lit by the white water all round it: never black          // late light: the warm bounce that keeps the shaded forest in colour
  vec3 col = alb * lightC;
  col *= mix(1., formK(vP.x, uSun.x), wetF * .85 * smoothstep(11., 16., abs(vP.x - (${AX.toFixed(1)}))));   // (round 11) the fall's face is round: alcoves in shade, each buttress lit on one flank
  // the spurs, painted outright: the flank the light rakes is warm and bright, its lee flank blue shade, the gullies dark.
  // (So the wall over the gate is a mountainside of three or four spurs in every light, not a smooth cone.)
  col *= 1. + litF * vec3(.85, .68, .3) * (1. - sn);
  col = mix(col, col * vec3(.46, .6, .98), .72 * shadeK * (1. - sn));
  col *= 1. - .28 * gul * ribOn * (1. - sn);
  col *= 1. + .3 * hiK * ribOn * smoothstep(.84, .97, hr) * (1. - sn);                          // (round 13) and a spur's own crest catches the light: a pale line down the wall
  col = mix(col, vec3(dot(col, vec3(.3, .5, .2))) * vec3(.72, .9, 1.3), .62 * uMoon * wallK * (1. - sn));   // (round 13: under the moon a wall's larch and lit rock are silver-blue, never orange)
  float ov = 1. - max(V.y, 0.), fr = .04 + .8 * ov * ov * ov * ov;
  vec3 white = uSunCol * sunW(vP) + uSkyCol + uShW;
  col = mix(col, mix(uHor, uZen, .8) * .85, wat * fr * .32 * (.3 + .7 * flowN) * (1. - lf));
  col += white * (1. - .85 * lf) * (wat * (foam * .7) + (lipF * .5 + crestF * .32) * (.4 + .6 * vn(vec2(vP.x * 6., vP.z * 4. - t * 3.))));   // (round 23: live's line less its straight threads (thr * .5): nothing long runs at the lens. The foam's weight is live's. RIDES on live's mask wat)
  col += (uSunCol * 5. * sunW(vP) + uShW * 3.) * pearl * wat * (1. - smoothstep(25., 70., d));
  vec3 fallW = (uSunCol * sunW(vP) * .7 + uSkyCol * 1.5 + uShW * 1.2) * 1.15;                                  // the far fall: white in sun, blue-white in the valley's shade
  col = mix(mix(col, fallW * .8, puff * .5), fallW, thr2 * .95);
  float fo = smoothstep(30., 150., alt) * (1. - smoothstep(500., 1600., d));         // blue valley haze between the shore trees and the slope
  // haze lies along the foot of the walls and thickens with distance (uWallHz: most under a low sun, looked at against the
  // light: ridge behind ridge), and a little more of it lies in the gullies (none at a skyline: the spurs have faded there).
  float hzK = 1. + .45 * fo + wallK * (.3 + .6 * (1. - smoothstep(120., 420., alt)) + uWallHz * smoothstep(250., 1000., d)) + 1.1 * gul * ribOn;
  gl_FragColor = vec4(mix(col, mix(uHaze, mix(uHor, uZen, .62), .6 * fo), min(1. - exp(-d * uHazeK * hzK), uFar)), 1.);
}`;

const PLANT_VERT = /* glsl */`
uniform float uTime; attribute vec3 aCol; attribute float aFlex; varying vec3 vP, vN, vC, vP0, vLoc; varying float vF, vLace, vKind, vFootY;
#ifdef ISLE
  // the island's trees: aLf = a leaf card's own coordinates in metres (across, along) and the size of the leaves it is cut into
  uniform vec3 uSun; attribute vec3 aLf; varying vec3 vLf; varying float vRim;
#endif
void main(){
  vec3 p = (instanceMatrix * vec4(position, 1.)).xyz, n = normalize(mat3(instanceMatrix) * normal), c = aCol;
  #ifdef USE_INSTANCING_COLOR
    c *= instanceColor;
  #endif
  // aFlex + 4 marks leaves cut to lace in the fragment shader, + 8 birch bark, + 16 travertine stones
  float stone = step(15.5, aFlex), a1 = aFlex - 16. * stone, bark = step(7.5, a1), a2 = a1 - 8. * bark, lace = step(3.5, a2), fl = a2 - 4. * lace, ph = p.x * .31 + p.z * .27;
  vP0 = p; vLoc = position; vKind = bark + 2. * stone;
  p.x += fl * (sin(uTime * 1.6 + ph) * .1 + sin(uTime * 5.3 + p.y * 2.1 + p.x * 1.7) * .035);
  p.z += fl * (sin(uTime * 1.25 + ph * 1.3) * .08 + cos(uTime * 4.7 + p.y * 1.9 + p.z * 1.3) * .035);
  vP = p; vN = n; vC = c; vF = fl; vLace = lace; vFootY = instanceMatrix[3].y;
  #ifdef ISLE
    vLf = aLf;
    vec3 cc = instanceMatrix[3].xyz + vec3(0., 6.4 * length(instanceMatrix[1].xyz), 0.);       // about the middle of the crown
    vRim = dot(normalize(p - cc + vec3(0., 1e-4, 0.)), uSun);                                   // 1 on the side of the crown that faces the light
  #endif
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const PLANT_FRAG = /* glsl */`
${GL_N}
${GL_U}
uniform float uFallZ, uWallHz;
varying vec3 vP, vN, vC, vP0, vLoc; varying float vF, vLace, vKind, vFootY;
#ifdef ISLE
  uniform vec4 uIsTone; uniform vec3 uIsLit; varying vec3 vLf; varying float vRim;
#endif
void main(){
  vec3 Vv = cameraPosition - vP; float d = length(Vv); vec3 V = Vv / max(d, 1e-3);
  float cutK = 1.;
  #ifdef ISLE
    // Every card is a spray of small leaves, not one big diamond: it is cut into cells a hand across, each holding one leaf
    // (a pointed oval hanging any way round for the birch, a broad lobed one for the maple), one cell in seven empty, each
    // leaf its own shade. Far off, where a leaf would be less than a pixel, the card closes up again.
    if (vLf.z > .01) {
      vec2 g = vLf.xy / vLf.z, ci = floor(g), cf = fract(g) - .5;
      float hh = h21(ci + 3.7), ang = (h21(ci + 11.3) - .5) * 1.4, ca = cos(ang), sa = sin(ang), maple = step(.3, vLf.z), far = smoothstep(26., 60., d);
      cf -= (vec2(h21(ci + 23.1), h21(ci + 41.9)) - .5) * .28;
      vec2 r = vec2(cf.x * ca + cf.y * sa, -cf.x * sa + cf.y * ca);
      float shp = mix(r.x * r.x * 8. + r.y * r.y * 3.3 + r.y * .22, dot(r, r) * 4.6 * (1. + .32 * cos(5. * atan(r.y, r.x + 1e-5))), maple);
      if (far < .97 && (hh > .9 || shp > mix(.75, 2.6, far))) discard;
      cutK = mix(.7 + .6 * h21(ci + 5.9), 1., far);
    }
  #endif
  // willow leaves: each broad blade is cut into narrow hanging leaflets (in the plant's rest frame, so the cut rides the sway)
  if (vLace > .5 && vn3(vP0 * vec3(13., 4.5, 13.)) < .47 - .2 * smoothstep(14., 40., d)) discard;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  float leafy = smoothstep(.25, .6, vF), bark = step(.5, vKind) * step(vKind, 1.5), stone = step(1.5, vKind), up = 0., glint = 0.;
  vec3 alb = vC * (.8 + .4 * vn(vP.xz * 5. + vP.y * 4.)) * (.74 + .52 * vn3(vP * vec3(.8, 1.1, .8)));
  if (bark > .5) {
    // white birch: chalk-white paper with short dark lenticel dashes lying across the stem, black scars where limbs were
    // shed, tan where the paper has peeled, and a rough dark foot
    float ang = atan(vN.z, vN.x + 1e-5), y = vP0.y, row = floor(y * 5.5);
    vec2 lq = vec2(ang * 2.1 + row * 1.7, y * 5.5), ci = floor(lq), cf = fract(lq); float hh = h21(ci + 3.);
    float dash = step(.4, hh) * (1. - smoothstep(.1, .26, abs(cf.y - .5))) * smoothstep(0., .12, cf.x) * (1. - smoothstep(.45 + .4 * hh, .6 + .4 * hh, cf.x));
    vec2 bq = vec2(ang * .8 + floor(y * 1.9) * 2.3, y * 1.9), bf = fract(bq); float bh = h21(floor(bq) + 11.);       // and the long dark bands that half ring the stem
    dash = max(dash, step(.5, bh) * (1. - smoothstep(.06, .15 + .1 * bh, abs(bf.y - .5))) * smoothstep(0., .1, bf.x) * (1. - smoothstep(.75, .95, bf.x)));
    float scar = smoothstep(.66, .74, vn(vec2(ang * .8 + 3., y * 1.3))) * (.6 + .4 * vn(vec2(ang * 5., y * 9.)));
    float foot = (1. - smoothstep(.1, 1.7, y + .9 * vn(vec2(ang * 2., y * 1.6)))) * (.4 + .5 * vn(vec2(ang * 4., y * 6.)));
    vec3 paper = mix(vec3(.72, .7, .64), vec3(.66, .5, .36), smoothstep(.6, .78, vn(vec2(ang * 1.7 + 9., y * 2.6))) * .5) * (.86 + .22 * vn(vec2(ang * 7., y * 2.)));
    alb = mix(paper, vec3(.05, .045, .04), clamp(max(max(dash * .9, scar), foot * .88), 0., 1.)) * vC;
    up = .5 - .5 * N.y;
  }
  if (stone > .5) {
    // travertine: rimstone ridges following its contours, pits, cream where it is dry, amber and dark where the water keeps it wet
    float h = vLoc.y, w1 = vn(vP0.xz * 3.1), tr = fract(h * 6.5 + 1.3 * w1 + .35 * vn(vP0.xz * 9.));
    float lip = smoothstep(0., .1, tr) * (1. - smoothstep(.1, .34, tr)), crease = 1. - smoothstep(0., .5, tr);
    float pit = vn3(vP0 * 14.) * .6 + vn3(vP0 * 31. + 5.) * .4, pits = 1. - smoothstep(.2, .36, pit);
    float wet = 1. - smoothstep(-.06, .2, h + .12 * (w1 - .5));
    alb = vC * (.72 + .5 * lip - .28 * crease) * (1. - .5 * pits) * (.85 + .3 * vn(vP0.xz * 21.));
    alb = mix(alb, alb * vec3(.5, .37, .22), wet * .85);
    N = normalize(N + vec3(vn(vP0.xz * 11.) - .5, 0., vn(vP0.xz * 11. + 7.) - .5) * .7 + vec3(0., .5 * (lip - crease), 0.));
    vec3 Rf = reflect(-V, N); float sr = max(dot(Rf, uSun), 0.), s2 = sr * sr; s2 *= s2; s2 *= s2;
    glint = (s2 * s2 * .9 + .08 * (1. - max(dot(N, V), 0.))) * (.35 + .65 * wet);
  }
  // (round 13) the old spruces on the lip stand over the slot's white water: its light comes up under their boughs and in
  // at the side that faces the slot, so each is a tree of lit green tiers, not a dark cut-out from the climb. A rule of
  // the place: conifers within 22-40 m of the axis, from 40 m behind the fall's line outward.
  float wl = (1. - smoothstep(22., 40., abs(vP.x - (${AX.toFixed(1)})))) * smoothstep(uFallZ - 40., uFallZ - 22., vP.z) * (1. - bark) * (1. - stone) * (1. - leafy);
  up = max(up, wl * clamp(.55 - .45 * N.y + .5 * N.x * sign((${AX.toFixed(1)}) - vP.x), 0., 1.));
  float sunK = 1.;
  #ifdef ISLE
    // No leaf brighter than paper; and the island keeps the key of the hour. In the blue shade of dawn its gold is ochre and
    // its scarlet wine; under the moon the crowns are blue-grey, and only the leaves on the side the moon catches keep their gold.
    alb *= cutK; alb *= min(1., .8 / max(max(alb.r, alb.g), max(alb.b, 1e-3)));
    float rimI = uIsLit.z * smoothstep(.74, .96, vRim) * leafy * smoothstep(.85, 1.15, cutK);      // (a thin rim: only the edge that faces the moon)
    alb = mix(mix(alb, dot(alb, vec3(.3, .55, .15)) * uIsTone.rgb, uIsTone.a * mix(.5, 1., leafy)) * uIsLit.x, mix(alb, vec3(.8, .68, .4), .45) * vec3(1.15, 1., .72), rimI);
    sunK = mix(uIsLit.y, 1., rimI);
  #endif
  alb = mix(alb, vec3(.82, .86, .92), uSnow * smoothstep(.5, .95, N.y) * (.15 + .55 * vn3(vP * 1.3 + 4.)));
  float sd = dot(N, uSun), ndl = max(sd, 0.);
  ndl = mix(ndl, ndl * .6 + .4 * (sd * .5 + .5) + .45 * max(-sd, 0.) * max(dot(-V, uSun), 0.), leafy);
  #ifdef ISLE
    // every crown half lit, half blue: the light falls on the crown as a whole, in leaf masses with a lit side and a shaded
    // side and a darker underside, not on each leaf alone (so no crown is a glowing blob)
    float mass = vn3(vP * .5) - .5, cl = smoothstep(-.3, .5, vRim + .7 * mass + .3 * (vn3(vP * 1.8 + 9.) - .5));
    ndl = mix(ndl, cl * (.45 + .55 * ndl) * 1.1, leafy * .88);
    alb = mix(alb, alb * vec3(.46, .58, .98), leafy * (1. - cl) * .62 * (1. - .6 * uIsTone.a));
    alb *= mix(1., .72 + .56 * smoothstep(-.25, .25, mass + .35 * N.y), leafy);
  #endif
  vec3 col = alb * (uSunCol * ndl * sunGate(vP) * sunK + mix(uGndCol, uSkyCol, N.y * .5 + .5) * (1. + .3 * leafy) + uShW * .5 + uFill * .8
    + (uSunCol * sunW(vP) * .3 + uSkyCol * .5 + uShW * .4) * up);                // (white bark over white water takes the water's light from below)
  col += (uSunCol * sunW(vP) + uSkyCol * .6 + uShW) * glint;
  // (round 13) a crown that stands up a slope is hazed as the slope behind it is (the land's own rule: the blue haze that
  // lies along the foot of the walls and thickens with distance), so the stands on a wall sink into its painted canopy
  // and are not dark cut-outs on it. Only a crown whose foot stands 6-36 m or more over the lake's level: the trees of the
  // valley floor are as they were.
  float sl = smoothstep(6., 36., vFootY), fo = smoothstep(30., 150., vP.y) * (1. - smoothstep(500., 1600., d)) * sl;
  float hzK = 1. + sl * (.45 * fo + smoothstep(90., 380., d) * (.3 + .6 * (1. - smoothstep(120., 420., vP.y)) + uWallHz * smoothstep(250., 1000., d)));
  gl_FragColor = vec4(mix(col, mix(uHaze, mix(uHor, uZen, .62), .6 * fo), 1. - exp(-d * uHazeK * hzK)), 1.);
}`;

// the lower lake: turquoise milk over pale marl, mirroring the fall, the trees on its lip, the valley and the sky
const LAKE_VERT = /* glsl */`
attribute float aDepth, aFoot; varying vec3 vP; varying float vDepth, vFoot;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vDepth = aDepth; vFoot = aFoot; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const LAKE_FRAG = /* glsl */`
${GL_N}
${GL_U}
${GL_FORM}
uniform vec3 uBone, uGold, uScar, uSpruce, uTurq; uniform float uFallZ;
uniform vec4 uRaft[24], uRaftB[24]; uniform vec3 uDuck[9];   // leaf rafts: centre xz, half width, half length; unit direction xz, hue, wander (m). The flight's nine ducks: xz, how near the water
varying vec3 vP; varying float vDepth, vFoot;
float hgt(vec2 q, float churn){ return .05 * vn(q * .3 + uTime * vec2(.06, .04)) + .02 * vn(q * 1.1 - uTime * .13) + churn * .07 * vn(q * 1.7 + vec2(uTime * .3, uTime * 1.3)); }
void main(){
  vec3 Vv = cameraPosition - vP; float d = length(Vv); vec3 V = Vv / max(d, 1e-3); vec2 q = vP.xz;
  vec2 fq = fwidth(q); float pz = max(fq.x, fq.y), pxA = length(dFdx(q)), pxL = length(dFdy(q));   // (a pixel's width and length on the water)
  float churn = 1. - smoothstep(3., 34., q.y - uFallZ - 8. * vn(vec2(q.x * .07, 2.))), e = .2;
  // THE FOOT OF THE FALLS (vFoot: metres out from where the falling water lands): no straight edge and no dark band there.
  // A ragged carpet of foam lies 6-13 m out on the water, boiling; beyond it the image of the falls is broken by the chop
  // and its lowest ten metres are the white of the spray, not the dark of wet rock
  float ft = vFoot + 2.4 * (vn(vec2(q.x * .31, 3. + uTime * .2)) - .5), carpet = 1. - smoothstep(1., 4. + 18. * vn(vec2(q.x * .09, 4.)) * (.5 + vn(vec2(q.x * .31, 11.))), ft);
  churn = max(churn, carpet);
  float h0 = hgt(q, churn), hx = hgt(q + vec2(e, 0.), churn), hz = hgt(q + vec2(0., e), churn);
  vec3 N = normalize(vec3(h0 - hx, e, h0 - hz));
  // (round 11) THE IMAGE IN THE LAKE IS SOFT AND RIPPLED. Long low wavelets lie across the view and draw every edge of it
  // out into a wavering fringe; the outlines of the slopes, the peak and the trees are soft and ragged, never a cut-out
  float rw = vn(vec2(q.x * .21, q.y * 1.7 - uTime * .4)) - .5, rw2 = vn(vec2(q.x * .55 + 3., q.y * 4.3 + uTime * .65)) - .5;
  N = normalize(N + vec3(.02 * rw2, 0., .05 * rw + .022 * rw2));
  float om = 1. - clamp(dot(N, V), 0., 1.), Fr = .03 + .97 * om * om * om * om * om;
  vec3 R = reflect(-V, N); R.y = abs(R.y) + .004; R = normalize(R);
  float hl = max(length(R.xz), 1e-4); vec2 dr = R.xz / hl; float ty = R.y / hl, az = atan(dr.x, -dr.y + 1e-5);
  float md = max(dot(R, uSun), 0.); vec3 c = mix(uHor, uZen, pow(max(R.y, 0.), .4)) + uSunCol * uMoon * (5. * smoothstep(.9978, .9988, md) + .2 * pow(md, 400.));
  float rag = (vn(vec2(az * 38., ty * 17.)) - .5) * .04 + (vn(vec2(az * 9., 5.)) - .5) * .05;
  // the snow peak at the head of the valley stands in the water on the axis, over the image of the spruce clump
  float pk = .42 * max(0., 1. - pow(abs(az) / .2, .85)) * (.9 + .2 * vn(vec2(az * 40., 2.)));
  vec3 snowC = mix(uSunCol * (.35 + .65 * uLow) + uSkyCol * 1.1, uSkyCol * 1.7 + uShW * .5, smoothstep(-.03, .05, az * (uSun.x < 0. ? 1. : -1.) + .05 * (vn(vec2(ty * 60., az * 30.)) - .5)));
  vec3 pkC = mix(vec3(.3, .32, .38) * (uSunCol * .5 * uLow + uSkyCol * 1.3), snowC * .82, smoothstep(.4, .7, ty / max(pk, 1e-3) + .25 * vn(vec2(az * 80., ty * 45.))));
  c = mix(c, mix(pkC, uHaze, .3), smoothstep(-.012, .03, pk - ty + rag * .5));
  float sl = (.12 + .4 * pow(abs(dr.x), 1.5)) * (.8 + .4 * vn(vec2(az * 2.2 + 4., 1.7)));
  float sf = clamp(ty / max(sl, 1e-3), 0., 1.), stx = vn(vec2(az * 30., ty * 60.)), stb = vn(vec2(az * 7. + 3., ty * 9.));
  vec3 slope = mix(uSpruce * (1.2 + .9 * stx), uGold * (.34 + .3 * stx), smoothstep(.45, .7, stb * .7 + stx * .3) * (.35 + .65 * smoothstep(.3, .75, sf)));
  slope = mix(slope, vec3(.34, .35, .39), smoothstep(.78, .95, sf + .15 * (stb - .5)));                    // forest below, larch gold, bare rock at the crest
  slope *= uSunCol * (.25 + .75 * smoothstep(-.2, .6, dr.x * -uSun.x)) * (.55 + .45 * uLow) + uSkyCol + uFill;
  c = mix(c, mix(slope, uHaze, .25 + .25 * sf), smoothstep(-.025, .05, sl - ty + rag));
  if (dr.y < -.05) {                                                    // the fall and the trees on its lip
    float tt = (uFallZ - q.y) / (dr.y * hl), hx2 = q.x + R.x * tt;
    tt = (uFallZ + lobeG(hx2) - q.y) / (dr.y * hl); hx2 = q.x + R.x * tt;                                      // (the face bulges: its image does too)
    float hh = R.y * tt, clump = (1. - smoothstep(9., 25., abs(hx2 + 100.))) * smoothstep(4., 8., abs(hx2 + 100.));
    float inside = 1. - smoothstep(98., 112., abs(hx2 + 100.));
    float wht = smoothstep(.3, .72, vn(vec2(hx2 * .55, 3.)) * .7 + .45 * vn(vec2(hx2 * .21, 9.))) * (.75 + .25 * vn(vec2(hx2 * 1.7, hh * .2 - uTime * .6)));
    vec3 fall = mix(mix(vec3(.2, .135, .075), uSpruce * 2.6 + vec3(.03, .05, 0.), vn(vec2(hx2 * .23, hh * .3))) * (uSunCol * .5 * uWSun + uSkyCol + uShW * .8 + uFill * .6), (uSunCol * .45 * uWSun + uSkyCol * .9 + uShW) * .8, wht * .9);
    fall = mix(fall, (uSunCol * .5 * uWSun + uSkyCol + uShW) * .85, (1. - smoothstep(1., 11. + 4. * vn(vec2(hx2 * .2, 2.)), hh)) * .8);
    // the trees on the lip: separate crowns, big and small, ragged, each with a lighter top; on the axis the dark spruce clump stands over all of them
    float crown = 23. + 8. * vn(vec2(hx2 * .16, 5.)) + 8. * vn(vec2(hx2 * .55, 9.)) * vn(vec2(hx2 * 1.3, 2.)) + 13. * clump * (.7 + .3 * vn(vec2(hx2 * .9, 7.))), k2 = vn(vec2(hx2 * .21, 8.));
    vec3 tc = mix(mix(uGold, uScar, step(.72, k2)), uSpruce * .9, max(step(k2, .42), clump)) * (uSunCol * .5 * uLow + uSkyCol * .8) * .75 * (1. - .45 * clump);
    tc *= .7 + .6 * smoothstep(crown - 9., crown, hh);
    c = mix(c, tc, inside * smoothstep(crown + 1.5, crown - 5., hh + 60. * rag) * step(0., tt));
    fall *= mix(1., formK(hx2, uSun.x), .7 * smoothstep(11., 16., abs(hx2 + 100.)));
    c = mix(c, fall, inside * smoothstep(26., 23.5, hh + 20. * rag) * step(0., tt));
  }
  vec3 body = mix(uBone * .55, uTurq, 1. - exp(-vDepth * .9)) * (uSunCol * (.25 + .5 * uSun.y) * sunGate(vP) + uSkyCol * 1.15);
  vec3 col = mix(body, c, clamp(Fr * 1.15 + .04, 0., .92));
  // (round 13) THE RAFTS OF LEAVES: twenty-four streaks of red and gold lying on the lake, each 10-30 m long and 1.5-4 m
  // wide, wandering a little, ragged at the edge, some redder, some all gold. Near the lens every leaf is a pointed oval a
  // hand long lying any way round; where a pixel holds several the streak is their mean colour, so from the far shore and
  // through the portal a raft is still a plain warm streak on the turquoise, never a scatter of specks.
  // (hand mend after round 13: this supersedes the note above) THE RAFTS ARE DRIFTS OF LEAVES, NOT PAINT. Each is a short
  // windrow at most 12 m long and 2 m wide (uRaft: half width, half length; the mask is nothing beyond them), narrowing to
  // its ends, ragged, and BROKEN: the turquoise shows through a third of it in holes 1-3 m across, and its ends thin out
  // into single leaves. It is gold first with scarlet flecks (30 leaves in a hundred, more in one patch and fewer in the
  // next), and what is drawn far off is what lies there near: no raft is one colour, none is redder than its leaves.
  // Near the lens every leaf is a pointed oval a hand long lying any way round; where a pixel holds several, the drift
  // is drawn in dabs (clumps of leaves three pixels across), seven gold to three scarlet, and turquoise water between them.
  float rM = 0., rgn = vn(q * .55 + 3.), rgn2 = vn(q * 1.9 + 11.);      // (ragged edges: lobes 2 m and 0.5 m across; they only ever eat into a raft)
  for (int i = 0; i < 24; i++) {
    vec4 A = uRaft[i], B = uRaftB[i]; if (A.z < .01) break;             // (the rafts in use come first; one not in use has no width)
    vec2 r = q - A.xy;
    float al = r.x * B.x + r.y * B.y, ac = r.y * B.x - r.x * B.y + B.w * sin(al * .23 + B.z * 40.);
    float ea = abs(al) / max(A.w, .01), sp = clamp(1. - ea * ea, 0., 1.);   // (a spindle: at its ends 0.7 of its width; it thins over the last two fifths of its length)
    float m = (1. - smoothstep(.8, 1., abs(ac) / max(A.z * (.7 + .3 * sp), .01) * (1. + .2 * rgn + .12 * rgn2))) * (1. - smoothstep(.6, 1., ea * (1. + .15 * rgn + .1 * rgn2)));
    rM = max(rM, m);
  }
  rM *= 1. - churn;
  if (rM > .002) {
    // THE HOLES are of the lake's own coordinates (a noise of 1.05 m and 0.5 m lobes; a third of the lake lies under its
    // .43 level: holes 1-3 m across), so a raft is a chain of clumps. Where it holds, it is thick in one metre and thin
    // in the next (thick), and scarlet has 0.12 to 0.48 of it, 0.3 in the mean, in patches 1-2 m across (sc).
    // cv: the share of the water the leaves hide: .6 in the thick of the raft and .45 where it is thin, falling through
    // .2 to nothing over its ragged rim and its thinning ends, and nothing in its holes
    float hole = smoothstep(.385, .475, .6 * vn(q * .95 + 23.) + .4 * vn(q * 2.1 + 41.));
    float thick = smoothstep(.2, .55, vn(q * 1.2 + 17.)), sc = clamp(.3 + .4 * (vn(q * .8 + 7.) - .5), .12, .48);
    float lF = 1. - smoothstep(.2, .6, pz * 3.1), cv = (.45 + .15 * thick) * rM * hole;   // (lF: 0 where a leaf is under a pixel)
    // (near: three layers of leaf cells of different pitch and lie, every cell full, so the leaves never stand in a lattice;
    // together they hide .39 of the water where they lie. lsd: how far inside the nearest leaf's outline, in cells)
    vec2 lq = q * 3.1, lc = floor(lq), lo = fract(lq) - .5 - .34 * (vec2(h21(lc + 5.), h21(lc + 9.)) - .5);
    float lan = h21(lc + 17.) * 6.283, lca = cos(lan), lsa = sin(lan), lh = h21(lc + 2.); vec2 lr = vec2(lo.x * lca + lo.y * lsa, -lo.x * lsa + lo.y * lca);
    float lsd = .17 * (1. - lr.x * lr.x * 9.) - abs(lr.y);
    vec2 mq = q.yx * 4.37 + 13.3, mc = floor(mq), mo = fract(mq) - .5 - .34 * (vec2(h21(mc + 3.), h21(mc + 8.)) - .5);
    float man = h21(mc + 19.) * 6.283, mca = cos(man), msa = sin(man); vec2 mr = vec2(mo.x * mca + mo.y * msa, -mo.x * msa + mo.y * mca);
    float msd = .17 * (1. - mr.x * mr.x * 9.) - abs(mr.y);
    if (msd > lsd) { lsd = msd; lh = h21(mc + 2.); lr = mr; lc = mc + 50.; }
    vec2 nq = vec2(q.x + q.y, q.x - q.y) * 2.65 + vec2(7.7, 3.1), nc = floor(nq), no = fract(nq) - .5 - .34 * (vec2(h21(nc + 4.), h21(nc + 6.)) - .5);
    float nan2 = h21(nc + 23.) * 6.283, nca = cos(nan2), nsa = sin(nan2); vec2 nr = vec2(no.x * nca + no.y * nsa, -no.x * nsa + no.y * nca);
    float nsd = .17 * (1. - nr.x * nr.x * 9.) - abs(nr.y);
    if (nsd > lsd) { lsd = nsd; lh = h21(nc + 2.); lr = nr; lc = nc + 90.; }
    // (THE DABS: a noise whose cells are 0.385 m, or three pixels where that is more, along the lake's two axes each for
    // itself (across the lake: three of a pixel's widths, and never less than the pixel's whole reach along x; along it:
    // three of its reaches along z; the octave of each axis is blended into the next, as the glitter's is). A dab is
    // where the noise stands over the level that leaves the share cv of the water under it (.82 - .64 cv, measured for
    // this noise); it is scarlet where a second noise, of cells 0.55 as wide, stands over the level of the share sc
    // (flecks, smaller than the dabs). Near the lens the dabs spread (cv / .39) and the leaves stand inside them: far
    // off each leaf is drawn so fat that the three layers close the dab, and as the lens nears they shrink to their own
    // outline and the water opens between them, so a clump opens into its leaves, is never drawn twice and never as a
    // wash. A cell is never longer than 6 m (half a raft); where a pixel is 2.5-5 m long on the water (the farthest
    // slivers) the dabs give way to their mean.)
    float cvE = mix(cv, min(cv / .39, 1.), lF);
    vec2 dl = log2(clamp(vec2(max(pxA, fq.x * .34), fq.y), vec2(.128), vec2(1e3, 2.)) * 7.8), di = floor(dl), dfr = dl - di, dsc = 2.6 * exp2(-di);
    float dn = mix(mix(vn(q * dsc + 31.), vn(q * dsc * vec2(.5, 1.) + 31.), dfr.x), mix(vn(q * dsc * vec2(1., .5) + 31.), vn(q * dsc * .5 + 31.), dfr.x), dfr.y);
    float dh = mix(mix(vn(q * dsc * vec2(1.8, 1.37) + 77.), vn(q * dsc * vec2(.9, 1.37) + 77.), dfr.x), mix(vn(q * dsc * vec2(1.8, .685) + 77.), vn(q * dsc * vec2(.9, .685) + 77.), dfr.x), dfr.y);
    float dg = 1. / sqrt(max((dfr.x * dfr.x + (1. - dfr.x) * (1. - dfr.x)) * (dfr.y * dfr.y + (1. - dfr.y) * (1. - dfr.y)), .25));   // (octaves half blended vary less than one: made up)
    dn = .5 + (dn - .5) * dg; dh = .5 + (dh - .5) * dg;
    float dabK = 1. - smoothstep(2.5, 5., fq.y), th = mix(1.02, .82 - .64 * cvE, smoothstep(0., .15, cvE));
    float cover = mix(cvE, smoothstep(th - .06, th + .06, dn), dabK) * smoothstep(0., .05, lsd + 1.6 * (1. - lF) * (1. - lF));
    float scar = mix(mix(sc, smoothstep(-.06, .06, dh - .82 + .64 * sc), dabK), step(1. - sc, lh), lF);
    vec3 lcol = mix(uGold * mix(vec3(.94, .88, .8), mix(vec3(1.), vec3(.8, .62, .4), step(.5, lh)), lF), uScar, scar) * (.82 + .36 * vn(q * 1.6 + 29.));
    // IN SHADE, AT DAWN AND UNDER THE MOON THE LEAVES ARE DULL GOLD-BROWN, never maroon: warm is 1 where the warm sun itself
    // lies on the water and 0 in the valley's shade and by moonlight. As it falls, a gold leaf goes four fifths of the
    // way to a brown-gold (the palette's gold with its red held back a tenth and its green and blue let up), a scarlet
    // one nearly all the way (.95) to the same brown-gold a sixth darker (so the drift keeps two tones, and neither
    // is red), and the light they are seen by loses three fifths of its colour (the blue of the sky's light, which
    // makes scarlet wine-dark and gold green) for its own brightness, a little warm.
    float warm = sunW(vP) * (1. - uMoon);
    lcol = mix(mix(lcol, (uGold * vec3(.9, 1.1, 1.2) + vec3(.04, .04, .02)) * mix(vec3(1.), vec3(.85, .8, .78), scar), mix(.8, .95, scar)), lcol, warm);
    vec3 lL = uSunCol * (.3 + .6 * uSun.y) * sunGate(vP) + uSkyCol * 1.1;
    lL = mix(dot(lL, vec3(.3, .59, .11)) * vec3(1.1, 1., .8), lL, .4 + .6 * warm);
    lcol *= lL * .8 * mix(1., (.82 + .36 * h21(lc + 7.)) * (.75 + .25 * smoothstep(0., .04, abs(lr.y))), lF);
    col = mix(col, lcol, cover * .94);
    rM = cover;                                                           // (what follows is hidden only where a leaf lies: the rings and the glitter show in the holes and between the dabs)
  } else rM = 0.;
  // and under the flight of ducks that leads the lens up the lake: two or three rings of downwash on the water under
  // each bird (2 m across), stronger the lower it flies, and once it is within 3 m of the water a short thin V
  // behind it (they fly toward -z)
  float dkR = 0., dkV = 0.;
  for (int i = 0; i < 9; i++) {
    vec3 D = uDuck[i]; vec2 r = q - D.xy; float l = length(r), ry = max(r.y, 0.), vv = abs(r.x) - .22 * ry;
    dkR += D.z * sin(l * 5.5 - uTime * 6. + 2.5 * vn(r * .9 + D.xy)) * exp(-l * 1.4) * smoothstep(.1, .5, l) * (.35 + .65 * vn(r * 1.6 + D.yx));   // (rings broken and bent: a ruffle, never a target)
    dkV += smoothstep(.7, .98, D.z) * exp(-vv * vv / (.012 + .0016 * ry * ry)) * smoothstep(.4, 2.2, r.y) * exp(-ry * .7);
  }
  vec3 wWhite = uSunCol * .7 * sunW(vP) + uSkyCol + uShW;
  col = mix(col * (1. - .16 * clamp(-dkR, 0., 1.)), wWhite * .9, clamp(max(dkR, 0.) * .36 + dkV * (.22 + .4 * vn(vec2(q.x * 3., q.y * 1.4 - uTime * 1.5))), 0., .6) * (1. - rM * .7));
  float foam = churn * smoothstep(.42, .7, vn(vec2(q.x * 1.3 + uTime * .15, q.y * 1.3 - uTime * .8)) + .35 * churn - .1);
  float lace = smoothstep(.34, .6, vn(vec2(q.x * 1.7, q.y * 1.7 - uTime * 1.2)) * .55 + vn(q * .6 + vec2(uTime * .1, -uTime * .35)) * .45 + .6 * carpet - .25);
  foam = max(foam, carpet * lace);
  col = mix(col, (uSunCol * .8 * sunW(vP) + uSkyCol + uShW) * .95, foam * .85);
  float sr = max(dot(reflect(-V, N), uSun), 0.), s2 = sr * sr; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;
  col += uSunCol * s2 * s2 * 3. * sunGate(vP) * (1. - .75 * uMoon);
  // (round 11) a band of glitter lies across the lake where the breath of the fall ruffles it, 15 to 60 m out from the foot
  // (vFoot): glints along the wavelets near the lens, and where a pixel holds many of them their mean, a soft bright band
  // (round 13: the band reaches 50-92 m out, so that it lies across the middle of the lake from the entry and through the
  // portal; there, where a pixel is metres of water long, the glints are drawn as the dashes they are at that slant:
  // cells 0.6 m across and, along the view, as long as two to five pixels cover (the octave is chosen from the pixel's own
  // length on the water and blended into the next), so the glitter is fine and bright at every distance)
  float gFF = 1. - smoothstep(.12, .5, pz), glod = log2(max(pxL, .03) * 5.), gl0 = floor(glod), gs0 = exp2(-gl0);
  vec2 ga = vec2(q.x * 1.6, q.y * gs0), gb = vec2(q.x * 1.6, q.y * gs0 * .5), gt1 = vec2(uTime * .25, -uTime * .5 * gs0), gt2 = vec2(7. - uTime * .3, uTime * .4 * gs0);
  float sp0 = vn(ga + gt1) * vn(ga * 2.3 + gt2), sp1 = vn(gb + gt1) * vn(gb * 2.3 + gt2);
  float gband = smoothstep(13., 25., ft) * (1. - smoothstep(50., 92., ft)) * (1. - carpet) * smoothstep(14., 38., d) * (1. - .8 * rM);   // (never under the lens itself: there a glint would be a white patch)
  float gsp2 = smoothstep(.31, .4, mix(sp0, sp1, glod - gl0)) * (1. - smoothstep(.3, .7, pxA * 1.6)) * smoothstep(.09, .3, pz);
  float gsp = smoothstep(.62, .82, vn(vec2(q.x * 2.4, q.y * 7.) + vec2(uTime * .3, -uTime * 1.1)) * vn(vec2(q.x * 5.3 + 7., q.y * 2.9) - vec2(uTime * .4, uTime * .5)) * 2.2) * smoothstep(.035, .09, pz) * gFF;
  float gsoft = .08 + .2 * smoothstep(.4, .7, vn(vec2(q.x * .09 + uTime * .03, q.y * .45 - uTime * .12)));
  col += (uSkyCol * 1.1 + uSunCol * .45 * sunGate(vP) + uShW * .6) * gband * (gsoft * .6 + .4 * gsp + .85 * gsp2);
  gl_FragColor = vec4(hazed(col, d), smoothstep(0., .3, vDepth));
}`;

// falling water: ribbons that lie half a metre off the travertine and are drawn a little nearer than they are, so a
// bulge of rock between two samples never cuts a notch in them. Each is a veil: thick in its middle and thinning to
// nothing at its edges (no hard stripe), of its own width; from afar one soft white body whose density only wavers, nearer
// it opens into strands with the wet rock showing between, under the lens into clots of tumbling water. The face drops in
// three falls with a ledge between: on every ledge the veil bursts into spray, spreads, and gathers again in new strands.
const THREAD_VERT = /* glsl */`
attribute vec4 aT; attribute float aF, aSt, aLg; varying vec2 vUv; varying vec3 vP; varying vec4 vT; varying float vF, vSt, vLg;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vUv = uv; vT = aT; vF = aF; vSt = aSt; vLg = aLg;
  vec4 c1 = projectionMatrix * viewMatrix * wp;
  vec3 tc = cameraPosition - wp.xyz; float dl = max(length(tc), 1e-3);
  vec4 c2 = projectionMatrix * viewMatrix * vec4(wp.xyz + tc / dl * min(.9, dl * .3), 1.);
  if (c1.w > 1e-3 && c2.w > 1e-3) c1.z = c2.z / c2.w * c1.w;
  gl_Position = c1;
}`;
const THREAD_FRAG = /* glsl */`
${GL_N}
${GL_U}
${GL_FORM}
uniform vec3 uGold; uniform float uLate;
varying vec2 vUv; varying vec3 vP; varying vec4 vT; varying float vF, vSt, vLg;
void main(){
  float d = distance(cameraPosition, vP), e = 1. - abs(vUv.x), w = vT.z, yl = vUv.y, xm = vUv.x * w, sd = vT.y, t = uTime * vT.x;
  float nearT = 1. - smoothstep(30., 130., d), fineT = 1. - smoothstep(9., 36., d), midT = 1. - smoothstep(60., 150., d), closeT = 1. - smoothstep(7., 24., d);
  float seg = floor(clamp(vLg, 0., .999) * 3.), lk = 1. - smoothstep(.03, .1, abs(fract(vLg * 3. + .5) - .5));
  float x1 = xm + (vn(vec2(xm * .8 + sd * 17. + seg * 5.3, yl * .06 - t * .08)) - .5) * .7 + (h21(vec2(seg + 1.7, sd * 91.)) - .5) * .5 * w;
  float s1 = vn(vec2(x1 * 2.3 + sd * 41. + seg * 9.1, yl * .1 - t * .3));
  float s2 = mix(.5, vn(vec2(x1 * 5.2 + sd * 13., yl * .26 - t * .7)), midT);
  float s3 = mix(.5, vn(vec2(x1 * 11. + sd * 7., yl * .7 - t * 1.6)), fineT);
  float strand = s1 * .38 + s2 * .4 + s3 * .22;                    // (streaked: the veil is strands with the wet rock between, from the far shore as from the slot)
  float ends = smoothstep(0., 1.6, yl) * smoothstep(0., 2.4, vT.w - yl);
  float fe = smoothstep(0., .8, e), body = fe * fe * (3. - 2. * fe);
  float aFar = body * (.3 + .7 * smoothstep(.34, .62, strand));
  float aNear = body * smoothstep(.4, .56, strand + .22 * (e - .5));
  float cl1 = vn(vec2(x1 * 5.5 + sd * 9., yl * 1.25 - t * 2.6)), cl2 = vn(vec2(x1 * 13. + sd * 5., yl * 3.1 - t * 5.5));
  float aClose = body * smoothstep(.4, .6, strand + .08 * (vSt - .5)) * smoothstep(.3, .58, cl1 * .6 + cl2 * .4 + .25 * (strand - .5));
  float a = mix(mix(aFar, aNear, nearT * .8), aClose, closeT * .85);
  // Beside the lens (the walls of the slot) the water is drawn in world space, so nothing follows the ribbon and nothing shows
  // where it bends: tumbling white clots, an opaque foamy core, edges that break into clots and drops. No sheet, no streak.
  float slotK = 1. - smoothstep(13., 17., abs(vP.x - (${AX.toFixed(1)})));           // the walls of the slot are seen from inside it: clots from far further off
  float tumT = 1. - smoothstep(mix(19., 44., slotK), mix(42., 90., slotK), d);
  vec2 wq = vec2(xm * 1.1 + (vP.x * .83 + vP.z * .71) * .35 + sd * 13., vP.y * .8 - yl * .45);     // (across the veil; down it: height, and the run of the veil counted in, so the pattern still travels where it crosses a ledge)
  // strands, not clots: every layer is drawn out three to four times along the fall and runs downward, each wandering a
  // little as it goes; the veil's edge breaks into single strands and drops, and its length into separate leaps
  float wx = wq.x + .2 * (vn(vec2(wq.y * .6, sd * 7.)) - .5), wy = wq.y;
  float k1 = vn(vec2(wx * 1.7, wy * .36 + t * .55)), k2 = vn(vec2(wx * 4.3 + 3.1 + .2 * wy, wy * .95 + t * 1.4)), k3 = vn(vec2(wx * 9.6 + 7.7 - .15 * wy, wy * 2.4 + t * 3.3));
  float clot = k1 * .44 + k2 * .33 + k3 * .23, eR = e + .2 * (k2 - .5) + .32 * (k3 - .5), core = smoothstep(.05, .7, eR);   // (a ragged edge: the ribbon's own never shows)
  float gapL = smoothstep(.3, .5, vn(vec2(sd * 31. + wx * .5, wy * .2 + t * .35)) + .25 * core);                     // the leaps
  float dropT = step(.8, vn(vec2(wx * 21., wy * 5.5 + t * 7.))) * (1. - core) * smoothstep(-.1, .1, eR) * .7;        // drops flung off the edge
  // (round 11) BESIDE THE LENS THE WATER FALLS IN LEAPS, SHELF TO SHELF: shelves at the spacing of the rock's own (ledgePh, the
  // count the rock is painted from) break every veil into strands two or three metres tall, each with its own place, width and wander;
  // it leaves a lip narrow, frays as it falls and bursts on the tread below, and one leap in three is missing, the water
  // gone behind the stone, so the rock, its rim and its moss show between. Shapes with breaks: no ribbon, no long streak.
  // Every column of water (a metre wide) has its own run of leaps: its own count of drops and its own heights, so no two
  // neighbours break at one level and neither the face nor a wall of the slot ever reads as courses or tiles. A leap is a
  // tongue: narrow where it leaves a lip, spreading as it falls, frayed by the same travelling strands, ending in its burst.
  float colX = xm * .95 + sd * 7., cellS = floor(colX), hcol = h21(vec2(cellS * 1.7 + 3.1, sd * 37.));
  float lp = ledgePh(vP) * mix(.7, 1.3, hcol) + fract(hcol * 13.7), lid = floor(lp), lfr = lp - lid;
  float cfS = fract(colX) - .5 + .34 * (h21(vec2(lid * 3.7 + cellS * 1.3, sd * 7.3)) - .5);
  // (a broad veil of the bays is many leaps side by side with few missing; a thread on a buttress is one leap wide and often gone)
  float denseW = smoothstep(.8, 2.2, w);
  float hc = h21(vec2(cellS * 3.1 + lid * 13.7, sd * 57. + 1.)), keepL = step(mix(.24, .07, denseW), hc);     // (round 12: one leap in four of a thread is missing, one in fourteen of a veil: it was two in five and one in seven)
  // (no leap is a slab: its head and its foot are ragged, it leaves the lip as a thin film that gathers as it falls, and
  // within fifty metres of the lens it is fine strands with the wet rock dark between them)
  float nearL = 1. - smoothstep(14., 48., d), lfrN = clamp(lfr + .16 * (vn(vec2(wx * 2.7 + hc * 3., wy * .8)) - .5), 0., 1.);
  // (round 12) a leap reaches from its lip nearly to the tread below: its head gathers within a fifth of the drop and its
  // foot frays only over the last fifth, so the leaps of one column join into a body of falling water and are not left
  // hanging apart as spindles
  float fallK = smoothstep(0., .2, lfrN) * (1. - smoothstep(.8, 1., lfrN));
  float wdt = mix(.46, .15, smoothstep(.3, 1., lfr)) * (.7 + .6 * fract(hc * 7.31)) * mix(1., 1.25, denseW), offS = abs(cfS + .13 * (vn(vec2(wy * 1.3 + hc * 9., sd * 3.)) - .5));
  float texS = smoothstep(.22, .55, k2 * .5 + k3 * .5 + .25 * (1. - offS / max(wdt, .05)));
  float texF = smoothstep(.3, .62, k3 * .62 + k2 * .38 + .2 * (1. - offS / max(wdt, .05)));                 // beside the lens each tongue is itself fine strands, the rock dark between them
  float sA = (1. - smoothstep(wdt * .3, wdt, offS)) * keepL * fallK * (mix(.5, .16, nearL) + mix(.5, .84, nearL) * texS) * mix(1., .22 + .78 * texF, nearL);
  float puffS = smoothstep(0., .1, lfrN) * (1. - smoothstep(.12, .36, lfrN)) * keepL * smoothstep(.36, .6, vn(vec2(wx * 2.6 + hc * 5., wy * 2.2 + t * 1.3)) + .3 * (1. - 2. * abs(cfS)));
  // (round 12) and behind the leaps the veil keeps a body: a thin film of water in strands down its whole length, densest
  // in its middle, which the leaps ride on. Within 40 m of the lens a veil is one piece of water again, the wet rock
  // showing through between its strands, never detached white dashes.
  float filmS = body * smoothstep(.3, .6, k1 * .45 + k2 * .35 + k3 * .2 + .22 * (e - .5)) * mix(.34, .6, denseW);
  float aLeap = max(max(max(sA, puffS * .75), filmS) * smoothstep(-.05, .25, eR), dropT * keepL);
  float aTum = mix(max(smoothstep(.62 - .46 * core, .86 - .4 * core, clot) * smoothstep(.02, .3, eR) * mix(1., gapL, .75 * slotK), dropT), aLeap, 1. - smoothstep(38., 80., d));
  a = mix(a, aTum, tumT);
  // (round 11) on the open face the leaps hold from the foot of the fall out to 50-100 m (metres from the lens): closing on
  // the fall, each veil resolves from a far thread into tongues of water that break on every shelf, with the rock, its rims
  // and its moss between them. Nothing is drawn out into a streak along the face.
  a = mix(a, aLeap, (1. - smoothstep(50., 100., d)) * (1. - slotK));
  float burst = lk * body * (.5 + .5 * vn(vec2(xm * 2.6 + sd * 5., yl * .8 - t * 2.2)));
  burst *= 1. - tumT;                                             // (beside the lens the burst on a ledge is the clots themselves, not a white bar)
  a = max(a, burst * .9) * mix(mix(.74, 1., smoothstep(.3, 1.3, w)), 1., tumT) * mix(1., .55 + .45 * vSt, tumT) * ends * vF;
  float side = vUv.x * (uSun.x < 0. ? 1. : -1.), sw = sunW(vP), beadT = 1. - smoothstep(18., 60., d);
  vec3 white = uSunCol * .75 * sw + uSkyCol * .95 + uShW;
  // a round body of water: its sun-side third burns warm, its far side falls into blue shade
  vec3 col = white * (.56 + .44 * smoothstep(.36, .8, strand)) * mix(vec3(1.), vec3(.66, .74, .87), smoothstep(.05, .9, -side) * (.3 + .6 * sw));
  col = mix(col, white * 1.06, burst);
  col *= mix(1., .7 + .5 * cl2, closeT * (1. - tumT));
  col = mix(col, white * mix(mix(vec3(.85, .91, 1.), vec3(.68, .8, .98), 1. - smoothstep(14., 48., d)), vec3(1.03), smoothstep(.25, .8, k2 * .55 + k3 * .45 + .25 * (k1 - .5))) * mix(.92, 1., core), tumT);   // white all through: pale blue in its hollows, never grey
  col *= mix(1., mix(.78, 1.06, smoothstep(.6, 1.4, formK(vP.x, uSun.x))), (1. - slotK) * (1. - .6 * tumT));              // (round 11) the veils on a buttress's shaded flank and in the alcoves are in the face's own shade
  col += (uSunCol * .5 * sw + uShW * .3) * smoothstep(.12, .7, side) * (.6 + .4 * s2) * (1. - .6 * tumT);
  float bead = smoothstep(.62, .76, vn(vec2(x1 * 7. + sd * 3., yl * 1.1 - t * 3.4))) * beadT * smoothstep(.3, .55, strand) * (1. + .8 * closeT) * (1. - .85 * tumT);
  col += (uSunCol * 1.5 * sw + uSkyCol * .5 + uShW) * bead * (.55 + .45 * smoothstep(-.3, .6, side));
  col = mix(col, uGold * (uSunCol + uSkyCol), uLate * step(.8, vn(vec2(vUv.x * 9. + sd * 31., yl / max(w, .3) * 3. - t * 2.))) * .8 * (1. - .9 * closeT));   // (the riding leaves are specks from afar)
  gl_FragColor = vec4(hazed(col, d), clamp(a + bead * .5 * ends * vF * body, 0., 1.) * mix(.92, .97, tumT));
}`;

// mist: tall soft veils that rise from the foot of the fall and in the slot, lit from the side (the sun side of each is
// warm white, the far side blue shade), each renewing as it climbs
const VEIL_VERT = /* glsl */`
uniform float uTime; uniform vec3 uSun;
attribute vec4 aV; attribute vec2 aS; varying vec2 vUv; varying vec3 vP; varying float vK, vSide, vSeed;
void main(){
  float ph = fract(uTime * .03 * (.7 + .6 * fract(aV.w * 7.3)) + aV.w);
  vec3 c = aV.xyz + vec3(sin(ph * 6.283 + aV.w * 40.) * .8, ph * aS.y * .3, 0.);
  vec3 toC = cameraPosition - c; float dl = length(toC.xz);
  vec2 rgt = dl > 1e-3 ? vec2(toC.z, -toC.x) / dl : vec2(1., 0.);
  vec3 p = c + vec3(rgt.x, 0., rgt.y) * (position.x * aS.x) + vec3(0., position.y * aS.y, 0.);
  vUv = vec2(position.x * 2., position.y); vP = p; vSeed = aV.w;
  vSide = dot(rgt, normalize(uSun.xz + vec2(1e-5, 0.)));
  vK = sin(ph * 3.1416) * smoothstep(5., 16., length(toC));
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const VEIL_FRAG = /* glsl */`
${GL_N}
${GL_U}
uniform float uVeil;
varying vec2 vUv; varying vec3 vP; varying float vK, vSide, vSeed;
void main(){
  float y = vUv.y, d = distance(cameraPosition, vP);
  // a column that leans and wanders as it climbs, widest low down, torn into long wisps by noise drawn out along its height
  float n2 = vn(vec2(vUv.x * 5. - vSeed * 5., y * 6.5 - uTime * .27));
  float r = vUv.x - (vn(vec2(vSeed * 13., y * 2.6 - uTime * .06)) - .5) * 1.1 * y + (n2 - .5) * .4 * (.3 + y);   // ragged edges
  float wid = mix(.7, .36, y), sx = clamp(1. - r * r / (wid * wid), 0., 1.), shape = sx * sx * smoothstep(0., .07, y) * (1. - smoothstep(.2, 1., y));
  float n = fbm(vec2(r * 2.3 + vSeed * 9., y * 2.1 - uTime * .1));
  float n3 = fbm(vec2(r * 5.3 + vSeed * 3., y * 4.6 - uTime * .17));                // a finer tear: holes the rock shows through
  float a = shape * smoothstep(.43, .58, n + .22 * (1. - y) + .3 * (n2 - .5)) * smoothstep(.3, .6, n3 + .12 * (1. - y)) * vK * uVeil;
  if (a < .004) discard;
  float lit = smoothstep(-.45, .55, r / wid * vSide + .5 * (n - .5));
  vec3 col = mix(uSkyCol * 1.45 + uHaze * .12 + uShW * .5, uSunCol * 1.05 * sunW(vP) + uSkyCol * 1.05 + uShW, lit);
  gl_FragColor = vec4(hazed(col, d) * a, a);
}`;

// the slot's stair, painted from the same pool count q the relief is built from: level turquoise pools over pale marl,
// a cream lip on every dam, ochre and brown drapery with moss below it, white water over the lip and down the face in
// strands and clots (drawn in world space, so nothing stretches), a boil of foam at the foot spreading into the next pool
const STAIR_VERT = /* glsl */`
varying vec3 vP, vN;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const STAIR_FRAG = /* glsl */`
${GL_N}
${GL_U}
${GL_FORM}
${GL_ROCK}
uniform vec3 uBone, uMoss, uTurq;
varying vec3 vP, vN;
void main(){
  vec3 Vv = cameraPosition - vP; float d = length(Vv); vec3 V = Vv / max(d, 1e-3), N = normalize(vN + vec3(0., 1e-5, 0.));
  float xr = vP.x - (${AX.toFixed(1)}), ax = abs(xr), t = uTime;
  float q = (vP.z - ${SZ0.toFixed(1)}) / ${(SZ1 - SZ0).toFixed(1)} * ${NSTEP.toFixed(1)} - .3 * cos(xr * .33) + .09 * sin(xr * 1.1 + 1.7);
  float k = floor(q), f = q - k, on = step(-.5, k) * step(k, ${NSTEP.toFixed(1)} - .5);
  float wS = (1. - smoothstep(5.2, 9.2, ax)) * smoothstep(302.5, 306.5, vP.z) * (1. - smoothstep(366.5, 371., vP.z)) * on;
  float pool = 1. - smoothstep(.6, .66, f), rim = smoothstep(.57, .64, f) * (1. - smoothstep(.69, .73, f)), ris = smoothstep(.69, .74, f);
  float dp = 1. - smoothstep(.12, .62, f);                                // depth of a pool: 1 at its head, 0 at the rim
  float pebble = vn3(vP * 5.) * .6 + vn3(vP * 13. + 4.) * .4;
  vec3 marl = uBone * vec3(.62, .56, .4) * (.7 + .5 * pebble);
  vec3 water = mix(marl, uTurq * (.75 + .2 * pebble), .35 + .6 * dp);
  water = mix(water, uTurq * vec3(.35, .75, .85), dp * dp * .5);
  float drape = vn(vec2(vP.x * 1.6 + k * 3.7, vP.y * .9)) * .6 + vn(vec2(vP.x * 4.6 + 3., vP.y * 2.6)) * .4;
  // (round 11: the dam under the white water is dark wet stone and moss in cushions with an edge, cream only at its lip: no brown smear between the strands)
  vec3 dam = mix(vec3(.13, .105, .075), uBone * vec3(.46, .4, .27), smoothstep(.45, .8, drape)) * (.7 + .5 * pebble);
  dam = mix(dam, uMoss * (.75 + .6 * pebble), smoothstep(.5, .56, vn3(vP * vec3(1.3, 1.1, 1.3) + 7.)) * .85);
  vec3 alb = mix(mix(water, uBone * vec3(.8, .74, .58) * (.75 + .35 * pebble), rim), dam, ris);
  alb = mix(wetRock(vP, uMoss, uBone, d, N.y), alb, wS);
  // White water over each dam: strands that fall. They are drawn in space (across the slot, down the drop), three to four
  // times as long as they are wide and running downward, each wandering a little; between them the wet drapery of the dam
  // shows. At the foot of every drop a line of foam, ragged on its pool side; the pool beyond it is clear to its marl.
  float xs = vP.x + (vn(vec2(vP.x * .7, k * 3.1)) - .5) * .8 + .42 * (vn(vec2(vP.y * 1.1, k * 5.1 + vP.x * .3)) - .5);
  float sA = vn(vec2(xs * 2.3 + k * 7.3, 1.7 + vP.y * .05)), sB = vn(vec2(xs * 5.9 + k * 2.9, vP.y * .3 + t * .6)), sC = vn(vec2(xs * 13. + 4.1, vP.y * 1.1 + t * 2.5));
  float strand = sA * .38 + sB * .38 + sC * .24, run = vn(vec2(xs * 3.6 + 9., vP.y * .85 + t * 3.2));    // run: the brightness that travels down a strand
  // (round 13) the edge of every strand is ragged: it wavers a hand's width from side to side every half metre of its fall
  // and frays finer still, so a gap between two strands opens and pinches shut down the drop and is never a straight slot
  float rag = (vn(vec2(xs * 4.3 + k * 1.9, vP.y * 2.4 + t * 1.3)) - .5) * .3 + (vn(vec2(xs * 11. + 3.7, vP.y * 6.5 + t * 3.1)) - .5) * .14;
  float fall = smoothstep(.39, .57, strand + .14 + rag);                     // (strands with an edge, the dam between them)
  float over = smoothstep(.6, .68, f) * (1. - smoothstep(.7, .76, f));
  float drops = step(.78, vn(vec2(xs * 19., vP.y * 5.5 + t * 9.))) * (1. - fall) * ris * .55;                 // drops in the gaps
  float ww = ris * fall * (.78 + .22 * run) + drops + over * smoothstep(.34, .56, sB * .6 + sA * .4) * .75;
  float foamN = vn(vec2(vP.x * 3. + t * .3, vP.z * 3. - t * 1.2)) * .6 + vn(vP.xz * 8. + t * vec2(.5, -2.)) * .4;
  float foam = max((1. - smoothstep(.03, .1 + .09 * foamN, f)) * step(.5, k), smoothstep(.9, .985, f) * (.6 + .4 * foamN));   // the line at the foot of the drop
  float lines = smoothstep(.72, .82, vn(vec2(vP.x * 1.1 + foamN, vP.z * 2.2 - t * .4))) * pool * .14;
  float inPool = pool * wS;
  vec3 Np = normalize(vec3((vn(vP.xz * 2.1 + t * vec2(.2, .5)) - .5) * .25, 1., (vn(vP.xz * 2.1 + 5. - t * vec2(.3, .4)) - .5) * .25));
  N = normalize(mix(normalize(N + vec3(pebble - .5, 0., vn(vP.xz * 5. + 9.) - .5) * .5), Np, inPool));
  vec3 lightC = uSunCol * max(dot(N, uSun), 0.) * sunGate(vP) + mix(uGndCol, uSkyCol, N.y * .5 + .5) + uShW * 1.2 + uFill * .6 + (uSkyCol * .9 + uSunCol * .1) * (1. - wS * pool);
  vec3 col = alb * lightC;
  float ov = 1. - max(dot(V, Np), 0.), fr = .03 + .6 * ov * ov * ov * ov;
  col = mix(col, mix(uHor, uZen, .7) * .9, inPool * fr);
  vec3 white = uSunCol * .8 * sunW(vP) + uSkyCol + uShW;
  col = mix(col, white * mix(vec3(.86, .92, 1.), vec3(1.02), smoothstep(.3, .7, run * .6 + sC * .4)), clamp(ww + foam * .92 + lines, 0., 1.) * wS);   // (white all through: the low end of its range is pale blue, never grey)
  float al = (1. - smoothstep(9.6, 10.8, ax)) * smoothstep(0., .3, q);
  gl_FragColor = vec4(hazed(col, d), al);
}`;

// spray at the foot of the fall: one long soft bank standing in front of the face, billowing and rising, lit by the sky
// (and by the sun where it reaches); it thins to nothing at its top and as the camera comes up to it
const BANK_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vP;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BANK_FRAG = /* glsl */`
${GL_N}
${GL_U}
uniform float uVeil;
varying vec2 vUv; varying vec3 vP;
void main(){
  float y = vUv.y, d = distance(cameraPosition, vP), t = uTime;
  float n = fbm(vec2(vUv.x * .11, y * 1.7 - t * .06)), n2 = fbm(vec2(vUv.x * .37 + 7., y * 2.9 - t * .13));
  float a = smoothstep(.3, .78, n * .6 + n2 * .4 + .42 * (1. - y) - .3 * y) * (1. - smoothstep(.3, 1., y)) * smoothstep(0., .06, y);
  a *= (1. - smoothstep(98., 108., abs(vUv.x))) * smoothstep(8., 17., abs(vUv.x) + 3. * (n2 - .5)) * smoothstep(9., 30., d) * uVeil * .8;   // (it thins away before the slot, so the slot's wall never cuts it)
  if (a < .004) discard;
  vec3 col = mix(uSkyCol * 1.4 + uHaze * .12 + uShW * .6, uSunCol * sunW(vP) + uSkyCol * 1.05 + uShW, .35 + .5 * n2);
  gl_FragColor = vec4(hazed(col, d) * a, a);
}`;
// a little mist lying on the top lake among the standing trunks: wide, low, soft sheets that drift; where the low sun
// reaches they glow, most of all looked at toward the light
const LMIST_VERT = /* glsl */`
uniform float uTime;
attribute vec4 aV; attribute vec2 aS; varying vec2 vUv; varying vec3 vP; varying float vSeed, vK;
void main(){
  vec3 c = aV.xyz + vec3(sin(uTime * .05 + aV.w * 40.) * 4., 0., cos(uTime * .04 + aV.w * 23.) * 3.);
  vec3 toC = cameraPosition - c; float dl = length(toC.xz);
  vec2 rgt = dl > 1e-3 ? vec2(toC.z, -toC.x) / dl : vec2(1., 0.);
  vec3 p = c + vec3(rgt.x, 0., rgt.y) * (position.x * aS.x) + vec3(0., position.y * aS.y, 0.);
  vUv = vec2(position.x * 2., position.y); vP = p; vSeed = aV.w;
  vK = smoothstep(10., 30., length(toC)) * (1. - smoothstep(240., 380., length(toC))) * (1. - smoothstep(3.2, 8., cameraPosition.y));   // (looked down on from the turn a sheet of mist is a pale patch with an edge: it is there only for a lens near the water)
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const LMIST_FRAG = /* glsl */`
${GL_N}
${GL_U}
uniform float uMist;
varying vec2 vUv; varying vec3 vP; varying float vSeed, vK;
void main(){
  float y = vUv.y, x = vUv.x, d = distance(cameraPosition, vP);
  float n = fbm(vec2(x * 1.6 + vSeed * 9. + uTime * .012, y * 3.2 + vSeed * 4.)), sx = clamp(1. - x * x, 0., 1.);
  float a = sx * sx * smoothstep(0., .12, y) * (1. - smoothstep(.25, 1., y)) * smoothstep(.3, .7, n + .25 * (1. - y)) * vK * uMist;
  if (a < .004) discard;
  vec3 V = normalize(cameraPosition - vP + vec3(0., 1e-5, 0.));
  float fw = max(dot(-V, uSun), 0.), lit = sunW(vP) * (.45 + .55 * fw * fw);
  vec3 col = mix(uSkyCol * 1.3 + uHaze * .15 + uShW * .4, uSunCol * 1.1 + uSkyCol, lit);
  gl_FragColor = vec4(hazed(col, d) * a, a);
}`;

// THE MIST BANK: a low bank of mist lying across pass one between z 76 and z 16 (the camera meets it at u 0.43 and is
// through it by u 0.52): eleven standing sheets of slow fbm, dense at the water and ragged on top, and through them the
// sun's shafts, drawn along the true direction of the light (b is constant along a ray of sun), each sheet cutting the
// shafts at its own depth so they pass one another as the camera moves. It thins to nothing round the lens.
const MBANK_VERT = /* glsl */`
attribute float aSeed; varying vec2 vUv; varying vec3 vP; varying float vSeed;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const MBANK_FRAG = /* glsl */`
${GL_N}
${GL_U}
uniform float uBankK; uniform vec4 uBeam;      // strength; the sun's azimuth (xz, unit), cos and sin of its elevation
varying vec2 vUv; varying vec3 vP; varying float vSeed;
void main(){
  float d = distance(cameraPosition, vP), y = vP.y, t = uTime;
  float n = fbm(vec2(vP.x * .03 + vSeed * 7.3 + t * .016, y * .16 - t * .008 + vSeed * 3.1));
  float n2 = fbm(vec2(vP.x * .1 - t * .03 + vSeed * 11., y * .4 + vSeed * 5. + t * .012));
  float plan = smoothstep(.34, .62, fbm(vec2(vP.x * .017 + t * .006, vP.z * .05 + 4.)));              // billows and gaps in plan: a bank, not a bar
  float top = 1. + 6.5 * n * plan, body = (1. - smoothstep(top * .15, top, y)) * smoothstep(0., .3, y);
  float near = smoothstep(7., 26., d) * (1. - smoothstep(.55, 1., abs(vUv.x))) * (1. - .45 * smoothstep(110., 230., d));
  float a = body * smoothstep(.2, .7, n * .45 + n2 * .55 + .1) * (.25 + .75 * plan) * near;
  float b = y * uBeam.z - dot(vP.xz, uBeam.xy) * uBeam.w;
  float beam = smoothstep(.4, .64, vn(vec2(b * .2 + vSeed * 1.7, vP.z * .05)) * .62 + vn(vec2(b * .53 + 3., vSeed * 9. + vP.z * .02)) * .38);
  float sw = sunW(vP), hz = (1. - smoothstep(top, top + 9., y)) * smoothstep(0., .6, y) * near;   // (a thin haze over the bank still shows the shafts)
  vec3 V = normalize(cameraPosition - vP + vec3(0., 1e-5, 0.));
  float fw = max(dot(-V, uSun), 0.), lit = sw * (.12 + .88 * beam) * (.7 + .3 * fw * fw);
  float al = clamp(a * .11 * (.6 + .4 * mix(1., beam, sw)) + hz * beam * sw * .075, 0., 1.) * uBankK;
  if (al < .003) discard;
  vec3 col = mix(uSkyCol * 1.2 + uHaze * .22 + uShW * .45, uSunCol * 1.7 + uSkyCol * .8, lit);
  gl_FragColor = vec4(hazed(col, d) * al, al);
}`;

// spray pearls (ballistic, looping on time) and leaf showers (falling, started by u): instanced soft quads
const SPRITE_VERT = /* glsl */`
uniform float uTime, uU, uDur, uResY;
attribute vec4 aO, aV; varying vec2 vUv; varying float vK, vLeaf;
void main(){
  vec3 c; float size, k = 1., leaf = step(aV.w, 0.);
  if (leaf > .5) {
    float tau = (uU - aO.w) * uDur; k = step(0., tau) * (1. - smoothstep(2.4, 3.6, tau)); tau = max(tau, 0.);
    c = aO.xyz + vec3(aV.x * tau * .4 + sin(tau * 3.1 + aV.z * 9.) * .35, -1.1 * tau + aV.y * tau * exp(-tau * 2.), aV.z * tau * .4 + cos(tau * 2.6 + aV.x * 7.) * .35); size = .2;
  } else {
    float T = aV.w, tau = fract(uTime / T + aO.w) * T;
    c = aO.xyz + aV.xyz * tau - vec3(0., 4.9 * tau * tau, 0.); size = .05 + .04 * fract(aO.w * 7.3); k = smoothstep(0., .08, tau) * (1. - smoothstep(T * .8, T, tau));
  }
  vec4 mv = viewMatrix * vec4(c, 1.);
  size = max(size, -mv.z * 3.2 / (projectionMatrix[1][1] * max(uResY, 1.)));            // never under about 1.6 px
  mv.xy += position.xy * size;
  vUv = position.xy * 2.; vK = k; vLeaf = leaf; gl_Position = projectionMatrix * mv;
}`;
const SPRITE_FRAG = /* glsl */`
${GL_U}
uniform vec3 uGold; varying vec2 vUv; varying float vK, vLeaf;
void main(){
  float r = length(vUv), a = (1. - smoothstep(.35, 1., r)) * vK;
  if (a < .01) discard;
  vec3 col = mix((uSunCol * 2.2 * uWSun + uSkyCol + uShW * 2.) * 1.3, uGold * (uSunCol * .8 * (.3 + .7 * uWSun) + uSkyCol), vLeaf);
  gl_FragColor = vec4(col * a, a * mix(.75, 1., vLeaf));
}`;

// V wakes behind the ducks that have landed: two spreading arms and the churned line of the skid between them
const WAKE_VERT = /* glsl */`
attribute vec4 iA; attribute float iW; varying vec2 vUv; varying float vW;
void main(){
  float len = 1.5 + 7.5 * iW, c = cos(iA.w), s = sin(iA.w);
  vec2 l = vec2(position.x * len * .56, -position.z * len - .1);
  vec3 p = vec3(iA.x + l.x * c + l.y * s, .04, iA.z - l.x * s + l.y * c);
  vUv = vec2(position.x * 2., position.z); vW = iW * step(iA.y, .4);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const WAKE_FRAG = /* glsl */`
${GL_N}
${GL_U}
varying vec2 vUv; varying float vW;
void main(){
  float v = vUv.y, ax = abs(vUv.x), n = vn(vec2(vUv.x * 7., v * 16. - uTime * 2.5));
  float arms = smoothstep(.15, 0., abs(ax - v * .8)) * smoothstep(0., .06, v);
  float core = smoothstep(.2, 0., ax) * (1. - smoothstep(.04, .4, v));
  float a = (arms * (.5 + .5 * n) + core * .45 * (.4 + .6 * n)) * (1. - v) * clamp(vW * 1.8, 0., 1.) * .8;
  if (a < .01) discard;
  gl_FragColor = vec4((uSunCol * .55 * uWSun + uSkyCol * 1.15 + uShW) * a, a);
}`;

// ---------- the stand field of LAND_FRAG again in JS (same hashes, same noise), for placing far crowns ----------
const frJ = (x) => x - Math.floor(x);
const h21J = (x, y) => { let px = frJ(x * 0.1031), py = frJ(y * 0.1030); const d = px * (py + 33.33) + py * (px + 33.33); px += d; py += d; return frJ((px + py) * px); };
const vnJ = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h21J(ix, iy), h21J(ix + 1, iy), fx), lerp(h21J(ix, iy + 1), h21J(ix + 1, iy + 1), fx), fy); };
const fbrJ = (x, y) => { let s = 0, a = 0.5; for (let i = 0; i < 3; i++) { s += a * vnJ(x, y); const nx = (0.8 * x - 0.6 * y) * 2.07 + 13.7; y = (0.6 * x + 0.8 * y) * 2.07 + 7.1; x = nx; a *= 0.5; } return s / 0.875; };
const fbmJ = (x, y) => { let s = 0, a = 0.5; for (let i = 0; i < 4; i++) { s += a * vnJ(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; a *= 0.5; } return s / 0.9375; };
const ST = { aut: 0, scar: 0, larch: 0 };
function standAt(x, y, z, alt, late = 0) {
  let sx = x * 0.0043 + 0.0016 * y, sz = z * 0.0043; const w1 = fbrJ(sx * 2.1 + 3, sz * 2.1 + 3), w2 = fbrJ(sx * 2.1 + 11, sz * 2.1 + 11);
  sx += (w1 - 0.5) * 0.4; sz += (w2 - 0.5) * 0.4;
  const st1 = fbrJ(sx * 2.9, sz * 2.9), st2 = fbrJ(sx * 6.7 + 5, sz * 6.7 + 5), st3 = fbrJ(sx * 4.3 + 21, sz * 4.3 + 21);
  const tex = fbrJ((0.8 * x - 0.6 * z) * 0.045 + y * 0.02, (0.6 * x + 0.8 * z) * 0.045 + y * 0.02), mid = fbmJ(x * 0.011 + 3, z * 0.011 + 3);
  const larch = smoothstep(300, 420, alt + 140 * (mid - 0.5)) * (1 - smoothstep(560, 650, alt)), foot = 1 - smoothstep(35, 240, alt + 90 * (st2 - 0.5));
  const thA = 0.7 - 0.28 * clamp(0.06 + 0.5 * foot + 0.5 * larch + 0.22 * late * smoothstep(120, 300, alt) * (1 - smoothstep(520, 640, alt)), 0, 1);
  ST.aut = smoothstep(thA - 0.05, thA + 0.05, st1 * 0.62 + st2 * 0.38 + (tex - 0.5) * 0.14); ST.scar = smoothstep(0.5, 0.64, st3) * (1 - larch) * 0.85; ST.larch = larch;
  return ST;
}

// ---------- geometry helpers (own plants: position, aCol, aFlex) ----------
const hex = (h) => new THREE.Color(h);
const mkAcc = () => ({ p: [], c: [], f: [], i: [] });
function accGeo(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a.p, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(a.c, 3));
  g.setAttribute('aFlex', new THREE.Float32BufferAttribute(a.f, 1)); g.setIndex(a.i); g.computeVertexNormals();
  return g;
}
// tube through pts; col(t, out) and flex(t) along it
function tube(a, pts, r0, r1, sides, col, flex) {
  const base = a.p.length / 3, n = pts.length, cc = [0, 0, 0];
  for (let k = 0; k < n; k++) {
    const p = pts[k], q0 = pts[Math.max(0, k - 1)], q1 = pts[Math.min(n - 1, k + 1)], t = k / (n - 1), r = lerp(r0, r1, t);
    let tx = q1[0] - q0[0], ty = q1[1] - q0[1], tz = q1[2] - q0[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let ux = Math.abs(ty) > 0.9 ? 1 : 0, uy = Math.abs(ty) > 0.9 ? 0 : 1, uz = 0;
    let ax = uy * tz - uz * ty, ay = uz * tx - ux * tz, az = ux * ty - uy * tx; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
    const bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax;
    for (let s = 0; s < sides; s++) {
      const th = (s / sides) * 6.2832, cs = Math.cos(th) * r, sn = Math.sin(th) * r;
      a.p.push(p[0] + ax * cs + bx * sn, p[1] + ay * cs + by * sn, p[2] + az * cs + bz * sn); col(t, cc); a.c.push(cc[0], cc[1], cc[2]); a.f.push(flex(t));
    }
  }
  for (let k = 0; k < n - 1; k++) for (let s = 0; s < sides; s++) { const i0 = base + k * sides + s, i1 = base + k * sides + (s + 1) % sides; a.i.push(i0, i0 + sides, i1, i1, i0 + sides, i1 + sides); }
}
// one diamond leaf from (x,y,z) along (dx,dy,dz)
function leaf(a, rng, x, y, z, dx, dy, dz, len, wid, c, k, flex) {
  const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
  let sx = rng.range(-1, 1), sy = rng.range(-0.3, 0.3), sz = rng.range(-1, 1);
  let px = dy * sz - dz * sy, py = dz * sx - dx * sz, pz = dx * sy - dy * sx; const pl = (Math.hypot(px, py, pz) || 1) / (wid * 0.5); px /= pl; py /= pl; pz /= pl;
  const b = a.p.length / 3, mx = x + dx * len * 0.45, my = y + dy * len * 0.45, mz = z + dz * len * 0.45;
  a.p.push(x, y, z, mx + px, my + py, mz + pz, x + dx * len, y + dy * len, z + dz * len, mx - px, my - py, mz - pz);
  for (let i = 0; i < 4; i++) { const kk = k * (i === 2 ? 1.12 : i === 0 ? 0.8 : 1); a.c.push(c.r * kk, c.g * kk, c.b * kk); a.f.push(flex); }
  a.i.push(b, b + 1, b + 3, b + 1, b + 2, b + 3);
}
const colFn = (c0, c1) => (t, o) => { o[0] = lerp(c0.r, c1.r, t); o[1] = lerp(c0.g, c1.g, t); o[2] = lerp(c0.b, c1.b, t); };

// willow / poplar scrub rooted in the travertine: ~4 m, many stems, hanging narrow leaves
function willowGeo(rng, leafA, leafB, near) {
  const a = mkAcc(), bark = colFn(hex('#4a3d2c'), hex('#8a8048')), nS = near ? 6 : 5, nLf = near ? 46 : 20, lk = near ? 0.6 : 1, wk = near ? 0.42 : 1, lc = new THREE.Color();   // by the path: many narrow withe leaves
  for (let s = 0; s < nS; s++) {
    const ang = (s + rng.range(-0.3, 0.3)) / nS * 6.2832, lean = rng.range(0.22, 0.6), H = rng.range(3.0, 4.6), ca = Math.cos(ang), sa = Math.sin(ang), pts = [];
    for (let k = 0; k <= 4; k++) { const t = k / 4, rh = lean * H * Math.pow(t, 1.5); pts.push([ca * rh, H * t * (1 - 0.13 * t), sa * rh]); }
    tube(a, pts, 0.07, 0.014, 3, bark, (t) => t * 0.45);
    for (let l = 0; l < nLf; l++) {
      const t = rng.range(0.22, 1), f = t * 4, k = Math.min(3, Math.floor(f)), u = f - k, p0 = pts[k], p1 = pts[k + 1];
      lc.copy(leafA).lerp(leafB, rng());
      leaf(a, rng, lerp(p0[0], p1[0], u) + rng.range(-0.25, 0.25), lerp(p0[1], p1[1], u) + rng.range(-0.1, 0.3), lerp(p0[2], p1[2], u) + rng.range(-0.25, 0.25),
        ca * rng.range(0, 0.7) + rng.range(-0.4, 0.4), -rng.range(0.4, 1.2), sa * rng.range(0, 0.7) + rng.range(-0.4, 0.4), rng.range(0.5, 0.85) * lk, rng.range(0.2, 0.3) * wk, lc, rng.range(0.8, 1.2), (near ? 0.45 : 4.45) + 0.55 * t);
    }
  }
  return accGeo(a);
}
// a birch arching over the channel (+X is the way it leans): white marked trunk, gold leaves hanging from long branches
function birchGeo(rng, leafA, leafB, leafC, fullness) {
  const a = mkAcc(), white = hex('#d6d1c2'), dark = hex('#2a2622'), lc = new THREE.Color();
  const tp = [[0, -0.4, 0], [0.2, 1.8, 0.1], [0.55, 3.8, -0.1], [1.2, 5.8, 0.1], [2.1, 7.6, 0], [3.2, 9.0, 0.1], [4.4, 10.0, 0]];
  tube(a, tp, 0.24, 0.07, 7, (t, o) => { const m = rng.chance(0.2 + 0.25 * (1 - t)) ? rng.range(0.15, 0.6) : 1; o[0] = lerp(dark.r, white.r, m); o[1] = lerp(dark.g, white.g, m); o[2] = lerp(dark.b, white.b, m); }, (t) => t * 0.12);
  const br = colFn(hex('#6b6258'), hex('#4a3a2c'));
  const perch = [], FIX = [[4.5, 1, 0.03, 0.14, 4.7], [5.3, 1, 0.1, -0.16, 4.9], [3.9, 1, 0.0, -0.05, 4.4]];   // three long boughs over the channel: the monkeys' road
  for (let b = 0; b < 10; b++) {
    const fx0 = FIX[b], f = fx0 ? fx0[0] : rng.range(2.4, 6), k = Math.min(5, Math.floor(f)), u = f - k, o = [lerp(tp[k][0], tp[k + 1][0], u), lerp(tp[k][1], tp[k + 1][1], u), lerp(tp[k][2], tp[k + 1][2], u)];
    let dx = fx0 ? fx0[1] : rng.range(0.15, 1), dy = fx0 ? fx0[2] : rng.range(0.1, 0.6), dz = fx0 ? fx0[3] : rng.range(-1, 1); const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
    const len = fx0 ? fx0[4] : rng.range(2.4, 4.4), pts = [o, [o[0] + dx * len * 0.5, o[1] + dy * len * 0.5 + 0.25, o[2] + dz * len * 0.5], [o[0] + dx * len, o[1] + dy * len - 0.3, o[2] + dz * len]];
    tube(a, pts, fx0 ? 0.075 : 0.055, fx0 ? 0.03 : 0.012, 4, br, (t) => (fx0 ? 0.04 : 0.12) + t * (fx0 ? 0.08 : 0.3));
    if (fx0) for (const s of [0.62, 0.8, 0.96]) { const q = s < 0.5 ? 0 : 1, uu = (s - 0.5) * 2; perch.push([lerp(pts[q][0], pts[q + 1][0], uu), lerp(pts[q][1], pts[q + 1][1], uu) + 0.06, lerp(pts[q][2], pts[q + 1][2], uu)]); }
    const nL = Math.round(84 * fullness);
    for (let l = 0; l < nL; l++) {
      const s = rng.range(0.25, 1.08), q = s < 0.5 ? 0 : 1, uu = s < 0.5 ? s * 2 : Math.min(1, (s - 0.5) * 2), p0 = pts[q], p1 = pts[q + 1], R = 0.45 + 0.75 * s, r = rng();
      lc.copy(r < 0.6 ? leafA : r < 0.9 ? leafB : leafC);
      leaf(a, rng, lerp(p0[0], p1[0], uu) + rng.gauss() * R * 0.5, lerp(p0[1], p1[1], uu) + rng.gauss() * R * 0.4 - 0.2, lerp(p0[2], p1[2], uu) + rng.gauss() * R * 0.5,
        rng.range(-0.5, 0.5), -1, rng.range(-0.5, 0.5), rng.range(0.24, 0.36), rng.range(0.17, 0.25), lc, rng.range(0.8, 1.2), rng.range(0.6, 1));
    }
  }
  const g = accGeo(a); g.userData.perch = perch; return g;
}
// a living tree for the island in the top lake (unit: 10 m tall, +X is the way it leans). kind 0: a white-stemmed birch,
// tall and narrow, its leaves hanging in curtains from rising boughs; kind 1: a maple, forking low into spreading stems
// under a broad round crown of large leaves held flat
function islandTreeGeo(rng, kind, cols) {
  const a = mkAcc(), lc = new THREE.Color(), BK = kind === 0 ? 8 : 0, H = 10, lean = kind === 0 ? 1.5 : 0.8, lf = [], cell = kind === 0 ? 0.26 : 0.36;
  const pad = () => { while (lf.length < a.p.length) lf.push(0); };                    // (wood carries no leaf coordinates)
  // a card of leaves: the diamond of leaf(), with its own coordinates in metres on every corner (shifted by a random whole
  // number of cells, so no two cards are cut alike); the fragment shader cuts it into small leaves
  const card = (x, y, z, dx, dy, dz, len, wid, c, k, flex) => {
    pad(); leaf(a, rng, x, y, z, dx, dy, dz, len, wid, c, k, flex);
    const ox = rng.int(0, 40) * cell, oy = rng.int(0, 40) * cell;
    lf.push(ox, oy, cell, ox + wid * 0.5, oy + len * 0.45, cell, ox, oy + len, cell, ox - wid * 0.5, oy + len * 0.45, cell);
  };
  const tcol = kind === 0 ? (t, o) => { const k = 0.92 + 0.1 * Math.sin(t * 23); o[0] = k; o[1] = k; o[2] = k; } : colFn(hex('#3b2a20'), hex('#5a4030'));
  const top = kind === 0 ? H * 0.97 : H * 0.6, tp = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6; tp.push([lean * t * t + 0.25 * Math.sin(t * 5 + 1), -0.5 + (top + 0.5) * t, 0.2 * Math.sin(t * 4)]); }
  tube(a, tp, kind === 0 ? 0.21 : 0.3, 0.03, 7, tcol, (t) => BK + t * 0.06);
  const at = (f) => { const g = clamp(f, 0, 0.999) * 6, k = Math.floor(g), u = g - k; return [lerp(tp[k][0], tp[k + 1][0], u), lerp(tp[k][1], tp[k + 1][1], u), lerp(tp[k][2], tp[k + 1][2], u)]; };
  const nB = kind === 0 ? 9 : 7, nLeaf = kind === 0 ? 86 : 84, br = kind === 0 ? colFn(hex('#8a8378'), hex('#4a3a2c')) : colFn(hex('#4a352a'), hex('#3a2a20'));
  for (let b = 0; b < nB; b++) {
    const f = kind === 0 ? 0.3 + 0.66 * (b + rng.range(0.1, 0.9)) / nB : 0.42 + 0.56 * (b + rng.range(0.1, 0.9)) / nB, o = at(f), an = b * 2.4 + rng.range(-0.4, 0.4);
    const k = (f - 0.3) / 0.7, len = kind === 0 ? lerp(3.1, 1.5, k) * rng.range(0.85, 1.15) : lerp(4.4, 2.6, k) * rng.range(0.85, 1.15), up = kind === 0 ? rng.range(0.55, 1.0) : rng.range(0.35, 0.95) + (b === nB - 1 ? 1 : 0);
    const dl = Math.hypot(1, up), dx = Math.cos(an) / dl, dy = up / dl, dz = Math.sin(an) / dl, sag = kind === 0 ? 0.35 : 0.12;
    const pts = [o, [o[0] + dx * len * 0.5, o[1] + dy * len * 0.5 + 0.1 * len, o[2] + dz * len * 0.5], [o[0] + dx * len, o[1] + dy * len - sag * len, o[2] + dz * len]];
    tube(a, pts, kind === 0 ? 0.06 : 0.1, 0.014, 4, br, (t) => (kind === 0 ? BK : 0) + 0.06 + t * 0.25);
    for (let l = 0; l < nLeaf; l++) {
      const s = rng.range(0.2, 1.1), q = s < 0.5 ? 0 : 1, uu = s < 0.5 ? s * 2 : Math.min(1, (s - 0.5) * 2), p0 = pts[q], p1 = pts[q + 1], R = (kind === 0 ? 0.36 + 0.42 * s : 0.5 + 0.6 * s), r = rng();
      lc.copy(r < 0.56 ? cols[0] : r < 0.86 ? cols[1] : cols[2]);
      const x = lerp(p0[0], p1[0], uu) + rng.gauss() * R * 0.55, y = lerp(p0[1], p1[1], uu) + rng.gauss() * R * (kind === 0 ? 0.55 : 0.4) - (kind === 0 ? 0.35 : 0), z = lerp(p0[2], p1[2], uu) + rng.gauss() * R * 0.55;
      // (the birch's sprays hang in curtains; the maple's are held out flat)
      if (kind === 0) card(x, y, z, rng.range(-0.3, 0.3), -1, rng.range(-0.3, 0.3), rng.range(0.62, 0.95), rng.range(0.4, 0.56), lc, rng.range(0.8, 1.2), rng.range(0.6, 1));
      else card(x, y, z, dx + rng.range(-0.8, 0.8), rng.range(-0.55, 0.15), dz + rng.range(-0.8, 0.8), rng.range(0.76, 1.08), rng.range(0.6, 0.82), lc, rng.range(0.78, 1.2), rng.range(0.5, 0.9));
    }
  }
  pad();
  const g = accGeo(a); g.setAttribute('aLf', new THREE.Float32BufferAttribute(lf, 3)); return g;
}
// one of the two white birches that arch over the channel where the monkeys cross (+X is the way it leans): a stout trunk
// that runs on into a leader, three stout boughs reaching over the water, each tapering into a fork of twig sprays, upward
// side branches all along them and a crown above, every twig hung with leaves, so that an animal on a bough is plainly an
// animal in a tree. Trunk and boughs carry aFlex + 8: the fragment shader paints them as birch bark (white, lenticel
// dashes, dark scars, a rough dark foot). userData.slots: seats on the boughs (local): the tips of the top and the low
// bough, then four inner seats, no two nearer than 1.5 m as the camera sees them; userData.yaws: the way each seat's bough
// runs. No leaf hangs in front of a seat.
async function monkeyTreeGeo(rng, leafA, leafB, leafC, pause) {
  const a = mkAcc(), lc = new THREE.Color(), BK = 8, grey = (t, o) => { const k = 0.92 + 0.1 * Math.sin(t * 23); o[0] = k; o[1] = k; o[2] = k; };
  const tp = [[0, -0.4, 0], [0.25, 2, 0.1], [0.7, 4.0, -0.1], [1.5, 5.9, 0.1], [2.6, 7.5, 0], [3.9, 8.7, 0.1], [5.2, 9.5, 0], [6.4, 10.3, -0.2], [7.3, 11.2, 0.1], [7.9, 12.3, 0]];
  tube(a, tp, 0.47, 0.035, 8, grey, (t) => BK + t * 0.05);
  tube(a, [[0, -0.5, 0], [0.03, 0.3, 0.02], [0.07, 0.9, 0.04], [0.14, 1.6, 0.06]], 0.68, 0.43, 8, grey, () => BK);          // the flare of the foot
  const at = (f) => { const k = Math.min(8, Math.floor(f)), u = f - k; return [lerp(tp[k][0], tp[k + 1][0], u), lerp(tp[k][1], tp[k + 1][1], u), lerp(tp[k][2], tp[k + 1][2], u)]; };
  const br = colFn(hex('#6a5a4a'), hex('#4a3626')), BO = [[6, [8.9, 9.6, -0.75], 0.2, 0.075], [3.75, [8.4, 6.75, 1.7], 0.23, 0.08], [4.5, [7.9, 8.0, -2.2], 0.2, 0.075]], lines = [], twigs = [];
  // a twig: a thin curved tube, remembered so that leaves can be hung along it
  const twig = (q, dx, dy, dz, len, r0, sides, droop) => {
    const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
    const pts = [q, [q[0] + dx * len * 0.5, q[1] + dy * len * 0.5 + 0.08 * len, q[2] + dz * len * 0.5], [q[0] + dx * len, q[1] + dy * len - droop * len, q[2] + dz * len]];
    tube(a, pts, r0, 0.011, sides, br, (t) => 0.08 + 0.3 * t); twigs.push(pts); return pts;
  };
  for (const [f, e, r0, r1] of BO) {
    const o = at(f), pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([lerp(o[0], e[0], t), lerp(o[1], e[1], t) + 0.3 * Math.sin(t * Math.PI), lerp(o[2], e[2], t)]); }
    tube(a, pts, r0, r1, 6, grey, (t) => BK + 0.02 + 0.04 * t); lines.push({ pts, r0, r1 });
    const end = pts[5], ex = end[0] - pts[4][0], ey = end[1] - pts[4][1], ez = end[2] - pts[4][2], yaw = Math.atan2(ez, ex);
    for (let j = 0; j < 3; j++) {                                    // the bough ends in a fork of three, each with its own twigs
      const an = yaw + [-0.75, 0.05, 0.8][j] + rng.range(-0.15, 0.15), up = [0.12, 0.55, -0.02][j] + rng.range(-0.08, 0.08), len = rng.range(1.25, 1.9);
      const fk = twig(end, Math.cos(an), up, Math.sin(an), len, r1 * 0.72, 4, 0.12);
      for (let w = 0; w < 2; w++) { const b = fk[1 + w], a2 = an + rng.range(-1.1, 1.1); twig(b, Math.cos(a2), rng.range(0.1, 0.7), Math.sin(a2), rng.range(0.6, 1.05), 0.022, 3, 0.2); }
    }
    for (let w = 0; w < 7; w++) {                                    // side branches all along it, most of them rising: they carry the crown
      const t = 0.17 + 0.115 * w, k = Math.min(4, Math.floor(t * 5)), u = t * 5 - k, q = [lerp(pts[k][0], pts[k + 1][0], u), lerp(pts[k][1], pts[k + 1][1], u), lerp(pts[k][2], pts[k + 1][2], u)];
      const an = yaw + (w % 2 ? 1 : -1) * rng.range(0.5, 1.5), len = rng.range(1.0, 1.8), sb = twig(q, Math.cos(an), rng.range(0.55, 1.3), Math.sin(an), len, 0.04, 3, 0.1);
      if (w % 2 === 0) { const a2 = an + rng.range(-1, 1); twig(sb[1], Math.cos(a2), rng.range(0.2, 0.9), Math.sin(a2), len * 0.6, 0.02, 3, 0.15); }
    }
  }
  for (let w = 0; w < 7; w++) {                                      // the leader's own twigs: the top of the crown
    const q = at(5.6 + 0.48 * w), an = (w % 2 ? 1 : -1) * rng.range(0.6, 2.2) + rng.range(-0.3, 0.3), len = rng.range(1.1, 2.0), sb = twig(q, Math.cos(an) + 0.35, rng.range(0.35, 1.1), Math.sin(an), len, 0.04, 3, 0.1);
    const a2 = an + rng.range(-1, 1); twig(sb[1], Math.cos(a2) + 0.2, rng.range(0.2, 0.8), Math.sin(a2), len * 0.6, 0.02, 3, 0.15);
  }
  const on = (b, t) => { const L = lines[b], f = t * 5, k = Math.min(4, Math.floor(f)), u = f - k, p0 = L.pts[k], p1 = L.pts[k + 1]; return [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + lerp(L.r0, L.r1, t), lerp(p0[2], p1[2], u)]; };
  const yawOf = (b) => { const L = lines[b].pts; return Math.atan2(L[5][0] - L[0][0], L[5][2] - L[0][2]); };
  const trunkSeat = at(5.3); trunkSeat[1] += 0.14;
  const slots = [on(0, 0.92), on(1, 0.9), on(0, 0.4), on(1, 0.48), on(2, 0.72), trunkSeat], yaws = [yawOf(0), yawOf(1), yawOf(0), yawOf(1), yawOf(2), Math.atan2(1.3, 0.1)];
  const free = (x, y, z) => { for (const q of slots) { const dy = y - q[1]; if (Math.abs(x - q[0]) < 0.85 && dy > -1.5 && dy < 2.0) return false; } return true; };      // a clear window round every seat, whichever side the lens is on
  const hang = (x, y, z, big) => {
    if (!free(x, y, z)) return; const r = rng();
    lc.copy(r < 0.55 ? leafA : r < 0.88 ? leafB : leafC);
    leaf(a, rng, x, y, z, rng.range(-0.6, 0.6), -1, rng.range(-0.6, 0.6), rng.range(0.34, 0.5) * big, rng.range(0.22, 0.3) * big, lc, rng.range(0.75, 1.2), rng.range(0.6, 1));
  };
  await pause();
  for (let w = 0; w < twigs.length; w++) {                           // leaves hang all along every twig and crowd round its tip
    const pts = twigs[w]; if ((w & 7) === 7) await pause();         // (the page gets its frames between twigs)
    for (let l = 0; l < 16; l++) { const t = rng.range(0.25, 1.04), q = t < 0.5 ? 0 : 1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2, p0 = pts[q], p1 = pts[q + 1]; hang(lerp(p0[0], p1[0], u) + rng.range(-0.16, 0.16), lerp(p0[1], p1[1], u) + rng.range(-0.25, 0.1), lerp(p0[2], p1[2], u) + rng.range(-0.16, 0.16), 1); }
    const e = pts[2]; for (let l = 0; l < 13; l++) hang(e[0] + rng.gauss() * 0.42, e[1] + rng.gauss() * 0.34, e[2] + rng.gauss() * 0.42, 1.08);
  }
  await pause();
  const g = accGeo(a); g.userData.slots = slots; g.userData.yaws = yaws; return g;
}
// a spruce for the lip of the fall: whorls of drooping, ridged boughs (unit: 10 m tall)
function spruceGeo(rng, body, tip) {
  const a = mkAcc(), H = 10, bark = colFn(hex('#3a2f26'), hex('#2a241e'));
  tube(a, [[0, -0.5, 0], [0, 3, 0], [0.05, 6.5, 0], [0, H, 0]], 0.2, 0.025, 5, bark, (t) => t * 0.1);
  const v = (x, y, z, c, k, f) => { a.p.push(x, y, z); a.c.push(c.r * k, c.g * k, c.b * k); a.f.push(f); return a.p.length / 3 - 1; };
  for (let w = 0; w < 11; w++) {
    const f = w / 10, y = 1.1 + 8.6 * f, R = 2.7 * Math.pow(1 - f, 0.8) + 0.28, a0 = rng() * 6.28;
    for (let b = 0; b < 6; b++) {
      const an = a0 + b / 6 * 6.2832 + rng.range(-0.2, 0.2), rr = R * rng.range(0.8, 1.12), ca = Math.cos(an), sa = Math.sin(an), wd = rr * 0.36, k = rng.range(0.8, 1.2), dr = rr * rng.range(0.3, 0.5);
      const r0 = v(ca * 0.1, y, sa * 0.1, body, 0.7 * k, 0.02), ml = v(ca * rr * 0.55 - sa * wd, y - dr * 0.5, sa * rr * 0.55 + ca * wd, body, k, 0.12), mr = v(ca * rr * 0.55 + sa * wd, y - dr * 0.5, sa * rr * 0.55 - ca * wd, body, k, 0.12);
      const rg = v(ca * rr * 0.55, y - dr * 0.25 + 0.16 * rr, sa * rr * 0.55, tip, 0.9 * k, 0.1), tp = v(ca * rr, y - dr, sa * rr, tip, 1.15 * k, 0.2);
      a.i.push(r0, ml, rg, r0, rg, mr, ml, tp, rg, rg, tp, mr);
    }
  }
  return accGeo(a);
}
// a reed tuft: broad gold blades (wide enough not to shimmer at 40 m)
// a cushion of moss on the lip of the fall: a low lumpy dome whose ragged skirt hangs over the edge, three blades of sedge
// standing out of it (27 triangles)
function lipMossGeo(rng, lit, dark, sedge) {
  const a = mkAcc(), NS = 6;
  a.p.push(0, 0.44, 0); a.c.push(lit.r * 1.1, lit.g * 1.1, lit.b * 1.1); a.f.push(0);
  for (let r = 0; r < 2; r++) for (let q = 0; q < NS; q++) {
    const an = q / NS * 6.283 + r * 0.45, rr = (r ? 1 : 0.6) * rng.range(0.8, 1.2), y = r ? -rng.range(0.1, 0.4) : 0.3 * rng.range(0.8, 1.2), c = r ? dark : lit, k = rng.range(0.85, 1.15);
    a.p.push(Math.cos(an) * rr, y, Math.sin(an) * rr); a.c.push(c.r * k, c.g * k, c.b * k); a.f.push(0);
  }
  for (let q = 0; q < NS; q++) { const n = (q + 1) % NS; a.i.push(0, 1 + n, 1 + q, 1 + q, 1 + n, 1 + NS + q, 1 + n, 1 + NS + n, 1 + NS + q); }
  for (let b = 0; b < 3; b++) {
    const an = rng() * 6.283, r = rng.range(0.1, 0.5), h = rng.range(0.9, 1.5), ln = rng.range(0.2, 0.6), ca = Math.cos(an), sa = Math.sin(an), w = 0.06, k = rng.range(0.8, 1.2), x = ca * r, z = sa * r, i0 = a.p.length / 3;
    a.p.push(x - sa * w, 0.15, z + ca * w, x + sa * w, 0.15, z - ca * w, x + ca * ln * 0.4 - sa * w * 0.8, 0.15 + h * 0.6, z + sa * ln * 0.4 + ca * w * 0.8, x + ca * ln * 0.4 + sa * w * 0.8, 0.15 + h * 0.6, z + sa * ln * 0.4 - ca * w * 0.8, x + ca * ln, 0.15 + h, z + sa * ln);
    for (let i = 0; i < 5; i++) { const kk = k * (i < 2 ? 0.8 : i < 4 ? 1 : 1.2); a.c.push(sedge.r * kk, sedge.g * kk, sedge.b * kk); a.f.push(i < 2 ? 0 : i < 4 ? 0.5 : 1.3); }
    a.i.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2, i0 + 2, i0 + 3, i0 + 4);
  }
  return accGeo(a);
}
function reedGeo(rng, root, tip) {
  const a = mkAcc();
  for (let b = 0; b < 10; b++) {
    const an = rng() * 6.283, r = rng.range(0, 0.35), h = rng.range(1.5, 2.3), ln = rng.range(0.1, 0.5), ca = Math.cos(an), sa = Math.sin(an), w = 0.07, k = rng.range(0.8, 1.2), x = ca * r, z = sa * r, i0 = a.p.length / 3;
    a.p.push(x - sa * w, 0, z + ca * w, x + sa * w, 0, z - ca * w, x + ca * ln * 0.4 - sa * w * 0.8, h * 0.6, z + sa * ln * 0.4 + ca * w * 0.8, x + ca * ln * 0.4 + sa * w * 0.8, h * 0.6, z + sa * ln * 0.4 - ca * w * 0.8, x + ca * ln, h, z + sa * ln);
    for (let i = 0; i < 5; i++) { const c = i < 2 ? root : tip, kk = k * (i < 2 ? 0.8 : i < 4 ? 1 : 1.2); a.c.push(c.r * kk, c.g * kk, c.b * kk); a.f.push(i < 2 ? 0 : i < 4 ? 0.5 : 1.3); }
    a.i.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2, i0 + 2, i0 + 3, i0 + 4);
  }
  return accGeo(a);
}
// far crowns (unit height), a little irregular so no two silhouettes in a row match
function coneGeo(rng) {                                              // a far spruce: three stacked skirts, dark underneath
  const a = mkAcc(), S = 5;
  [[0.04, 0.5, 0.5], [0.3, 0.78, 0.37], [0.56, 1, 0.24]].forEach(([y0, y1, r], k) => {
    const top = a.p.length / 3; a.p.push(0, y1, 0); a.c.push(1.15, 1.15, 1.15); a.f.push(0.3);
    for (let s = 0; s < S; s++) { const th = (s + k * 0.4) / S * 6.2832, rr = r * (s % 2 ? 0.82 : 1) * rng.range(0.85, 1.15); a.p.push(Math.cos(th) * rr, y0 - (s % 2 ? 0 : 0.05) + rng.range(-0.02, 0.02), Math.sin(th) * rr); const c = 0.42 + 0.14 * (s % 2); a.c.push(c, c, c); a.f.push(0.3); }
    for (let s = 0; s < S; s++) a.i.push(top, top + 1 + (s + 1) % S, top + 1 + s);
  });
  return accGeo(a);
}
function coneGeoLite(rng) {                                          // (round 13) a far spruce among others: two skirts of three (six triangles: it stands 300 m and more off)
  const a = mkAcc(), S = 3;
  [[0.05, 0.62, 0.48], [0.42, 1, 0.3]].forEach(([y0, y1, r], k) => {
    const top = a.p.length / 3; a.p.push(0, y1, 0); a.c.push(1.15, 1.15, 1.15); a.f.push(0.3);
    for (let s = 0; s < S; s++) { const th = (s + k * 0.5) / S * 6.2832, rr = r * (s % 2 ? 0.84 : 1) * rng.range(0.85, 1.15); a.p.push(Math.cos(th) * rr, y0 - (s % 2 ? 0 : 0.05) + rng.range(-0.02, 0.02), Math.sin(th) * rr); const c = 0.42 + 0.14 * (s % 2); a.c.push(c, c, c); a.f.push(0.3); }
    for (let s = 0; s < S; s++) a.i.push(top, top + 1 + (s + 1) % S, top + 1 + s);
  });
  return accGeo(a);
}
function blobGeo(rng, lumps = 4) {                                              // a far broadleaf crown: four lumps, lit tops, dark undersides
  const a = mkAcc(), S = 5;
  const lump = (cx, cy, cz, r, ry, k) => {
    const b = a.p.length / 3, o = rng();
    a.p.push(cx + rng.range(-0.04, 0.04), cy + ry, cz + rng.range(-0.04, 0.04)); a.c.push(1.25 * k, 1.25 * k, 1.25 * k); a.f.push(0.5);
    for (let s = 0; s < S; s++) { const th = (s + o) / S * 6.2832, rr = r * rng.range(0.8, 1.2); a.p.push(cx + Math.cos(th) * rr, cy + rng.range(-0.25, 0.2) * ry, cz + Math.sin(th) * rr); const c = k * rng.range(0.78, 1.02); a.c.push(c, c, c); a.f.push(0.5); }
    a.p.push(cx, cy - ry * 0.8, cz); a.c.push(0.36 * k, 0.36 * k, 0.36 * k); a.f.push(0.3);
    for (let s = 0; s < S; s++) { const n = (s + 1) % S; a.i.push(b, b + 1 + n, b + 1 + s, b + 1 + s, b + 1 + n, b + 6); }
  };
  lump(0, 0.6, 0, 0.36, 0.34, 1); lump(0.25, 0.44, 0.1, 0.27, 0.26, 0.86); if (lumps > 2) { lump(-0.22, 0.46, -0.14, 0.28, 0.27, 0.92); lump(0.03, 0.8, -0.05, 0.22, 0.2, 1.08); }
  return accGeo(a);
}

// a travertine knob (unit radius): a lumpy dome, wet and amber at the waterline, cream on top
function knobGeo(rng, top, base) {
  const a = mkAcc(), S = 6, prof = [[1, -0.3, 0], [0.96, 0.1, 0.35], [0.66, 0.36, 1]], c = new THREE.Color();
  for (let r = 0; r < 3; r++) for (let s = 0; s < S; s++) {
    const th = (s + r * 0.5) / S * 6.2832, rr = prof[r][0] * rng.range(0.82, 1.15);
    a.p.push(Math.cos(th) * rr, prof[r][1] + (r ? rng.range(-0.05, 0.07) : 0), Math.sin(th) * rr); c.copy(base).lerp(top, prof[r][2]); a.c.push(c.r, c.g, c.b); a.f.push(16);   // (aFlex 16: shaded as travertine)
  }
  a.p.push(rng.range(-0.1, 0.1), 0.5, rng.range(-0.1, 0.1)); a.c.push(top.r * 1.08, top.g * 1.08, top.b * 1.08); a.f.push(16);
  for (let r = 0; r < 2; r++) for (let s = 0; s < S; s++) { const i0 = r * S + s, i1 = r * S + (s + 1) % S; a.i.push(i0, i0 + S, i1, i1, i0 + S, i1 + S); }
  for (let s = 0; s < S; s++) a.i.push(2 * S + s, 3 * S, 2 * S + (s + 1) % S);
  return accGeo(a);
}
const KNOB_VERT = /* glsl */`
attribute vec4 iK; varying vec2 vQ; varying vec3 vP;
void main(){
  vec2 q = vec2(position.x * 3.6, position.z * 6.4 - 1.5);                 // in stone radii: 1.8 either side, 1.5 upstream to 4.9 downstream (+Z)
  vec3 p = vec3(iK.x + q.x * iK.w, iK.y + .08 - (iK.z > 258. ? .078 : 0.) * q.y * iK.w, iK.z + q.y * iK.w);
  vQ = q; vP = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const KNOB_FRAG = /* glsl */`
${GL_N}
${GL_U}
varying vec2 vQ; varying vec3 vP;
void main(){
  float r = length(vQ), t = uTime, d = distance(cameraPosition, vP), ax = abs(vQ.x);
  float n = vn(vec2(vP.x * 9., vP.z * 4. - t * 6.)), n2 = vn(vec2(vP.x * 3.3, vP.z * 1.5 - t * 3.));
  float bow = smoothstep(.34, 0., abs(r - 1.14)) * smoothstep(1., -.3, vQ.y);
  float tail = smoothstep(1.2, .5, ax * (1. + .1 * vQ.y)) * smoothstep(.5, 1.3, vQ.y) * (1. - smoothstep(1.6, 4.9, vQ.y));
  float edge = smoothstep(.26, 0., abs(ax - 1.02 + .07 * vQ.y)) * smoothstep(.2, 1., vQ.y) * (1. - smoothstep(1.5, 4.4, vQ.y));
  float nearT = mix(.3, 1., smoothstep(3., 9., d));                 // under the lens the long tail would be a smear: the collar stays
  float a = clamp(bow * (.45 + .55 * n) + (tail * (.2 + .8 * smoothstep(.3, .75, n * .6 + n2 * .4)) + edge * .5 * (.4 + .6 * n)) * nearT, 0., 1.) * .85 * (1. - smoothstep(40., 90., d));
  if (a < .01) discard;
  gl_FragColor = vec4(hazed(uSunCol * sunW(vP) + uSkyCol + uShW, d) * a, a);
}`;

// ---------- creatures (kit Geo + the kit's lit creature shader, posed by instance attributes) ----------
// iA = x, y, z, yaw; iB = scale, state, pitch, roll
const GL_POSE = /* glsl */`
void rotX(inout vec3 q, float a){ float c = cos(a), s = sin(a); q.yz = vec2(q.y * c + q.z * s, -q.y * s + q.z * c); }
void rotZ(inout vec3 q, float a){ float c = cos(a), s = sin(a); q.xy = vec2(q.x * c - q.y * s, q.x * s + q.y * c); }
void rotY(inout vec3 q, float a){ float c = cos(a), s = sin(a); q.xz = vec2(q.x * c + q.z * s, -q.x * s + q.z * c); }`;
const GL_TRAJ = 'vec3 traj(float q){ return iA.xyz; }\n';
function duckGeo() {
  const g = new F.Geo(), C = hex, back = C('#3a2d22'), belly = C('#ece6d6'), breast = C('#5a2850'), flank = C('#c98a3c'), sail = C('#f07a18'), crest = C('#1d4a3c'), white = C('#f3f0e6'), bill = C('#d63a2a'), wingA = C('#28384f'), tail = C('#2b241e');
  g.loft([{ z: -0.21, y: 0.02, rx: 0, ry: 0, top: tail }, { z: -0.15, y: 0.015, rx: 0.042, ry: 0.034, top: tail, belly: white }, { z: -0.05, y: 0, rx: 0.076, ry: 0.06, top: back, belly }, { z: 0.05, y: 0, rx: 0.08, ry: 0.066, top: back, belly: flank },
    { z: 0.12, y: 0.012, rx: 0.06, ry: 0.056, top: breast, belly: breast }, { z: 0.17, y: 0.03, rx: 0, ry: 0, top: breast }], { sides: 8 });
  g.blob(0, 0.088, 0.165, 0.042, 0.046, 0.06, crest, white, 6, 4);
  g.tube([[0, 0.078, 0.215], [0, 0.07, 0.255]], [0.014, 0.007], 4, bill, bill);
  for (const sx of [-1, 1]) g.fan([[sx * 0.034, 0.045, 0.0], [sx * 0.046, 0.168, -0.09], [sx * 0.034, 0.05, -0.18]], sail);
  g.fan([[0, 0.02, -0.17], [-0.055, 0.025, -0.26], [0, 0.03, -0.275], [0.055, 0.025, -0.26]], tail);
  for (const sx of [-1, 1]) { g.tube([[sx * 0.034, -0.035, -0.02], [sx * 0.04, -0.095, 0.035]], [0.011, 0.009], 4, bill, bill); g.fan([[sx * 0.04, -0.09, 0.02], [sx * 0.085, -0.1, 0.1], [sx * 0.04, -0.105, 0.115], [sx * 0.0, -0.1, 0.1]], bill); }   // orange legs and webbed feet
  const wing = g.strip([[0.05, 0.04, 0.06], [0.2, 0.045, 0.075], [0.33, 0.04, 0.03], [0.4, 0.035, -0.04]], [[0.05, 0.04, -0.08], [0.2, 0.04, -0.1], [0.31, 0.038, -0.1], [0.4, 0.035, -0.06]], [wingA, wingA, wingA, wingA], [white, white, wingA, wingA]);
  g.anim(wing, (x) => [clamp((x - 0.05) / 0.35, 0, 1), 1, 1, 0]); g.pivot(wing, 0.05, 0.04, 0); g.mirror(wing);
  return g.build();
}
const DUCK_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float brk = clamp(iB.y - 1., 0., 1.), fly = min(iB.y, 1.), ph = h11(float(gl_InstanceID)) * 6.28; gYaw = iA.w;   // state 1..2: braking, wings held high and cupped
  if (aAnim.z > .5) {
    vec3 q = p - aPivot; float side = aAnim.y, a = fly * (sin(uTime * 50.3 + ph - aAnim.x * 1.2) * mix(.95, .42, brk) + .12 + .75 * brk);
    q.x *= mix(.16, 1., fly); q.z -= (1. - fly) * aAnim.x * .1; rotZ(q, a * side); p = aPivot + q; gThin = 1.;
  }
  p.y += (1. - fly) * .012 * sin(uTime * 2.3 + ph);
  rotX(p, iB.z); rotX(n, iB.z); rotZ(p, iB.w); rotZ(n, iB.w);
}`;
// golden snub-nosed monkey: dark brown back and crown, cream chest and belly, a gold mane round a pale blue face
function monkeyGeo() {
  const g = new F.Geo(), gold = hex('#e2861a'), pale = hex('#fff0bd'), dark = hex('#5b3211'), face = hex('#a6cdf0'), mane = hex('#f5ad30'), eye = hex('#17110c'), hand = hex('#3c2410'), chest = hex('#f0a030');
  g.loft([{ z: -0.34, y: 0, rx: 0, ry: 0, top: dark }, { z: -0.27, y: 0, rx: 0.1, ry: 0.1, top: dark, belly: chest }, { z: -0.05, y: 0.01, rx: 0.125, ry: 0.12, top: dark, belly: chest }, { z: 0.16, y: 0.02, rx: 0.135, ry: 0.125, top: dark, belly: chest },
    { z: 0.27, y: 0.035, rx: 0.1, ry: 0.095, top: gold, belly: chest }, { z: 0.32, y: 0.045, rx: 0.05, ry: 0.05, top: gold, belly: chest }, { z: 0.35, y: 0.05, rx: 0, ry: 0, top: gold }], { sides: 8 });
  const hd = [g.blob(0, 0.115, 0.44, 0.118, 0.12, 0.108, mane, mane, 7, 5),                         // the head in its gold mane, clear of the shoulders
    g.blob(0, 0.2, 0.42, 0.08, 0.045, 0.085, dark, dark, 6, 3),                                      // dark crown
    g.blob(0, 0.1, 0.525, 0.07, 0.078, 0.04, face, face, 6, 4)];                                     // the blue face
  for (const sx of [-1, 1]) hd.push(g.blob(sx * 0.028, 0.122, 0.558, 0.014, 0.014, 0.012, eye, eye, 4, 3));
  hd.push(g.blob(0, 0.072, 0.56, 0.022, 0.016, 0.014, pale, pale, 4, 3));                           // pale muzzle
  for (const r of hd) { g.anim(r, () => [0, 0, 4, 0]); g.pivot(r, 0, 0.05, 0.33); }                  // (part 4: the head turns on the neck)
  const limb = (x, y, z, len, part) => {
    const r = g.tube([[x, y, z], [x * 1.25, y - len * 0.5, z + 0.03], [x * 1.3, y - len * 0.9, z], [x * 1.3, y - len * 0.94, z + 0.02]], [0.07, 0.056, 0.046, 0.04], 6, gold, pale);
    const h = g.blob(x * 1.3, y - len * 0.98, z + 0.04, 0.045, 0.05, 0.062, hand, hand, 5, 3);       // dark hands and feet
    for (const q of [r, h]) { g.anim(q, (px, py) => [clamp((y - py) / len, 0, 1), Math.sign(x), part, 0]); g.pivot(q, x, y, z); }
  };
  limb(0.1, 0, 0.22, 0.46, 1); limb(-0.1, 0, 0.22, 0.46, 1); limb(0.09, -0.02, -0.24, 0.5, 2); limb(-0.09, -0.02, -0.24, 0.5, 2);
  const tl = g.tube([[0, 0.04, -0.32], [0, 0.06, -0.58], [0, 0.06, -0.86], [0, 0.03, -1.16]], [0.046, 0.04, 0.034, 0.02], 6, gold, pale);
  g.anim(tl, (px, py, pz) => [clamp((-0.32 - pz) / 0.8, 0, 1), 0, 3, 0]); g.pivot(tl, 0, 0.04, -0.32);
  return g.build();
}
// iB = scale, in the air (0..1), pitch, sitting (0..1). On all fours the limbs hang; sitting, the trunk goes upright on its
// haunches, the head comes down to look at us, the hands rest by the knees, the legs dangle over the bough and the tail
// hangs straight down; in the air the arms reach, the legs trail, the back arches and the tail streams behind.
const MONKEY_DEFORM = /* glsl */`
void deform(inout vec3 p, inout vec3 n){
  float air = iB.y, sit = iB.w, ph = h11(float(gl_InstanceID)) * 6.28, part = aAnim.z, th = 0.; gYaw = iA.w;
  if (part > 3.5) th = (-1.45 + .14 * sin(uTime * .9 + ph)) * sit - .3 * air;
  else if (part > 2.5) th = mix(mix(.57, .42, sit), -.28, air) + aAnim.x * .3 * sin(uTime * 2.1 + ph)
    + aAnim.x * aAnim.x * (h11(float(gl_InstanceID) * 1.7 + 3.) * 2.1 - .75) * (1. - air);          // every tail hangs in its own curve: a hook, a crook, an S
  else if (part > 1.5) th = mix(mix(-.4, -.1, sit), -.8, air);
  else if (part > .5) th = mix(mix(.3, -.71, sit), 1.2, air) + .08 * sin(uTime * 1.3 + ph + aAnim.y) * (1. - sit);
  if (part > .5) { vec3 q = p - aPivot; if (part < 2.5) { rotZ(q, aAnim.y * .5 * air); rotZ(n, aAnim.y * .5 * air); } rotX(q, th); rotX(n, th); p = aPivot + q; if (part > 3.5) p += vec3(0., .09, .035) * sit; }
  vec3 hp = vec3(0., -.02, -.27); float sa = 1.15 * sit;
  p -= hp; rotX(p, sa); rotX(n, sa); p += hp;
  p.y -= air * .8 * p.z * p.z;
  rotX(p, iB.z); rotX(n, iB.z);
}`;
// The cock golden pheasant, life size (model units are metres: 1.17 m from bill to the tip of the tail; the world draws him
// at 1.3). He is built feather by feather where it shows: a silky gold crest swept back over the nape; the CAPE, four rows of
// broad orange feathers with blue-black tips that lie like tiles down the back of the neck and stand out into a ruff when
// he fans it (each vertex carries the way to its fanned place in aPivot); a green mantle of round scales, long gold plumes
// over the rump, a folded wing (dark red scapulars, a blue patch, brown barred primaries), scarlet breast and flanks, scarlet
// tail coverts; the TAIL: a central pair of long roofed feathers and three shorter ones a side, each tapering to a point,
// barred in the shader; feathered thighs, yellow shanks, toes that hold the log. aAnim = (along the part, side, part,
// paint): parts 1 cape, 2 tail, 3 head and neck, 5 legs, 6 wing; paints 0 body scales, 2 tail bars, 3 wing feathers, 4 plain.
// (blue: the blue eared pheasant of the snow look: slate body, black cap, red face, white ear tufts for the cape.)
function pheasantGeo(blue) {
  const g = new F.Geo(), C = hex, red = C(blue ? '#55709a' : '#c8421a'), redD = C(blue ? '#3a4f73' : '#8f2610'), gold = C(blue ? '#3f5273' : '#f2bb2a'), goldD = C(blue ? '#2b3a55' : '#c58a1c');
  const green = C(blue ? '#2c3b57' : '#1f6b3c'), greenD = C(blue ? '#1a2538' : '#0f3a22'), blu = C(blue ? '#1d2740' : '#27407a'), cape = C(blue ? '#ecebe4' : '#f08a1c'), bar = C(blue ? '#b9bcc0' : '#16130f');
  const tan = C(blue ? '#3a4763' : '#c9a468'), brown = C(blue ? '#1c2233' : '#6b4424'), leg = C(blue ? '#b5483a' : '#c9a23a'), face = C(blue ? '#c8372c' : '#e9c873'), horn = C('#e6d9a8'), eye = C('#14100c'), crown = blue ? C('#15161c') : gold;
  const tag = (r, part, paint, fx, fy) => g.anim(r, (x, y, z) => [fx ? fx(x, y, z) : 0, fy ? fy(x, y, z) : 0, part, paint]);
  const RINGS = [[-0.215, 0.03, 0, 0], [-0.17, 0.028, 0.036, 0.036], [-0.1, 0.018, 0.064, 0.064], [-0.02, 0.004, 0.08, 0.083], [0.06, 0.008, 0.082, 0.088], [0.13, 0.028, 0.068, 0.078], [0.185, 0.058, 0.046, 0.056], [0.225, 0.085, 0, 0]];
  tag(g.loft(RINGS.map(([z, y, rx, ry]) => ({ z, y, rx, ry, top: z > 0.02 ? green : gold, belly: red })), { sides: 10, shade: [0.3, 0.8] }), 0, 0);
  const topAt = (z, x) => {                                      // the body's upper surface at (z, x)
    let i = 0; while (i < RINGS.length - 2 && z > RINGS[i + 1][0]) i++;
    const A = RINGS[i], B = RINGS[i + 1], k = clamp((z - A[0]) / (B[0] - A[0]), 0, 1), rx = lerp(A[2], B[2], k) + 1e-4, ry = lerp(A[3], B[3], k), q = clamp(x / rx, -0.95, 0.95);
    return lerp(A[1], B[1], k) + ry * Math.sqrt(1 - q * q);
  };
  // head and neck (part 3: they turn together on the neck)
  const HD = [g.tube([[0, 0.065, 0.175], [0, 0.15, 0.212], [0, 0.215, 0.228]], [0.042, 0.031, 0.028], 7, red, blue ? crown : C('#c8742a')),
    g.blob(0, 0.245, 0.245, 0.032, 0.035, 0.047, crown, face, 7, 5),
    g.tube([[0, 0.243, 0.286], [0, 0.239, 0.31], [0, 0.231, 0.325]], [0.011, 0.007, 0.0015], 5, horn, horn),
    g.tube([[0, 0.266, 0.287], [0, 0.291, 0.245], [0, 0.297, 0.195], [0, 0.286, 0.145], [0, 0.268, 0.108]], [0.01, 0.027, 0.029, 0.021, 0.003], 6, crown, blue ? crown : goldD, { flatten: 0.5 })];
  for (const sx of [-1, 1]) {
    HD.push(g.blob(sx * 0.0285, 0.252, 0.262, 0.0075, 0.0075, 0.006, eye, eye, 4, 3));
    HD.push(g.fan([[sx * 0.012, 0.29, 0.2], [sx * 0.03, 0.283, 0.13], [sx * 0.024, 0.262, 0.088], [sx * 0.008, 0.276, 0.14]], crown, blue ? crown : goldD));   // the crest's ragged side wisps
  }
  for (const r of HD) tag(r, 3, 4);
  // The cape. At rest its four rows lie like tiles down the back of the neck. FANNED it is the display of the bird: every
  // feather swings round to his left side (the side the lens comes up on) and they spread into one flat fan behind the
  // face, from under the chin round the nape to behind the crest: an orange half-disc 13 cm deep, ringed with four
  // blue-black arcs, the face and bill clear in front of it. Each vertex keeps the way to its fanned place in aPivot.
  {
    const P0 = [0, 0.236, 0.205], dn = [0, -0.957, -0.29], e1 = [0, 0.29, -0.957], capeD = cape.clone().multiplyScalar(0.72), fanK = blue ? 0 : 1;
    const nm = [0.905, 0.05, 0.42], fu = [-0.0009, -0.9695, -0.245], fw = [0.4246, 0.2113, -0.8803], O = [0.02, 0.228, 0.2];   // the fan's plane: normal, "down" in it, "back" in it; its hub by the ear
    const at = (k, phi, al, sl, wd) => {
      const cp = Math.cos(phi), sp = Math.sin(phi), r = [sp, e1[1] * cp, e1[2] * cp], tw = [cp, -e1[1] * sp, -e1[2] * sp], s0 = 0.012 + 0.03 * k, rho = 0.042 + 0.002 * k, ca = Math.cos(al), sa = Math.sin(al);
      return [P0[0] + dn[0] * s0 + r[0] * rho + (dn[0] * ca + r[0] * sa) * sl + tw[0] * wd, P0[1] + dn[1] * s0 + r[1] * rho + (dn[1] * ca + r[1] * sa) * sl + tw[1] * wd, P0[2] + dn[2] * s0 + r[2] * rho + (dn[2] * ca + r[2] * sa) * sl + tw[2] * wd];
    };
    const fan = (k, th, f) => {
      const rad = 0.02 + (k + 1.2 * f - 0.2) * 0.0245, lift = 0.006 + 0.004 * (3 - k) + 0.12 * rad, c = Math.cos(th) * rad, sn = Math.sin(th) * rad;
      return [O[0] + nm[0] * lift + fu[0] * c + fw[0] * sn, O[1] + nm[1] * lift + fu[1] * c + fw[1] * sn, O[2] + nm[2] * lift + fu[2] * c + fw[2] * sn];
    };
    for (let k = 0; k < 4; k++) {
      const nF = 6 + k, dphi = 3.5 / nF, len = 0.05 + 0.007 * k, al0 = 0.35 + 0.05 * k, w = 2 * (0.042 + 0.002 * k + Math.sin(al0) * len * 0.5) * Math.sin(dphi / 2) * 1.3;
      for (let j = 0; j < nF; j++) {
        const phi = -1.75 + (j + 0.5) * dphi, ids = [], kf = 0.86 + 0.28 * (((j * 5 + k * 3) % 4) / 3), cA = cape.clone().multiplyScalar(kf), cB = capeD.clone().multiplyScalar(kf);   // each feather its own shade of orange
        for (const [sl, wd, col] of [[0, -0.42, cB], [0, 0.42, cB], [0.48, -0.6, cA], [0.48, 0.6, cA], [0.7, -0.55, cA], [0.7, 0.55, cA], [0.93, -0.27, bar], [1, 0, bar], [0.93, 0.27, bar], [0.79, -0.5, bar], [0.79, 0.5, bar]]) {
          const a0 = at(k, phi, al0, sl * len, wd * w), a1 = fan(k, 0.654 + (phi + wd * dphi * 1.04) * 1.125, sl), id = g.v(a0[0], a0[1], a0[2], col); ids.push(id);
          g.a[id * 4] = sl; g.a[id * 4 + 2] = 1; g.a[id * 4 + 3] = 4; g.pv[id * 3] = (a1[0] - a0[0]) * fanK; g.pv[id * 3 + 1] = (a1[1] - a0[1]) * fanK; g.pv[id * 3 + 2] = (a1[2] - a0[2]) * fanK;
        }
        g.quad(ids[0], ids[1], ids[3], ids[2]); g.quad(ids[2], ids[3], ids[5], ids[4]); g.quad(ids[4], ids[5], ids[10], ids[9]);       // orange to 0.7 of its length, then the blue-black tip
        g.tri(ids[9], ids[10], ids[7]); g.tri(ids[9], ids[7], ids[6]); g.tri(ids[10], ids[8], ids[7]);
      }
    }
  }
  // mantle: round green scales with dark edges; rump: long gold plumes that hang over the wing and the root of the tail
  for (let r = 0; r < 2; r++) for (let j = 0; j < 4 - r; j++) {
    const x0 = (j - (3 - r) / 2) * 0.034, z0 = 0.135 - r * 0.05, y = (dx, dz) => topAt(z0 + dz, x0 + dx) + 0.006;
    tag(g.fan([[x0, y(0, 0), z0], [x0 - 0.024, y(-0.024, -0.03), z0 - 0.03], [x0 - 0.016, y(-0.016, -0.058), z0 - 0.058], [x0, y(0, -0.068), z0 - 0.068], [x0 + 0.016, y(0.016, -0.058), z0 - 0.058], [x0 + 0.024, y(0.024, -0.03), z0 - 0.03]], green, greenD), 0, 4);
  }
  for (const sx of [-1, 1]) for (let j = 0; j < 5; j++) {
    const z0 = 0.02 - j * 0.035, x0 = sx * (0.022 + 0.004 * j), yb = topAt(z0, x0) + 0.005, L = 0.085 + 0.012 * j, xt = sx * (0.062 + 0.006 * j), zt = z0 - L, yt = Math.min(yb - 0.012, topAt(zt, xt * 0.8) - 0.004 - 0.008 * j);
    tag(g.fan([[xt, yt, zt], [x0 - sx * 0.012, yb, z0], [x0, yb + 0.002, z0 + 0.012], [x0 + sx * 0.016, yb - 0.006, z0 - 0.004]], goldD, gold), 0, 4);
  }
  // the folded wing (part 6): six stations from the shoulder to the tip, three rows
  {
    const WZ = [0.11, 0.06, 0, -0.06, -0.12, -0.185], WT = [0.058, 0.07, 0.068, 0.058, 0.04, 0.014], WB = [0.004, -0.034, -0.046, -0.04, -0.026, 0.0], WX = [0.064, 0.086, 0.09, 0.082, 0.064, 0.04];
    const WC = [[redD, redD, redD, redD, brown, brown], [blu, blu, redD, brown, brown, brown], [brown, brown, tan, tan, brown, bar]], rows = [0, 1, 2].map((r) => WZ.map((z, i) => [WX[i] + (r === 1 ? 0.012 : r === 2 ? 0.004 : -0.004), lerp(WT[i], WB[i], r / 2), z]));
    const wa = g.strip(rows[0], rows[1], WC[0], WC[1]), wb = g.strip(rows[1], rows[2], WC[1], WC[2]);
    for (const r of [wa, wb]) { tag(r, 6, 3, (x, y, z) => clamp((0.11 - z) / 0.295, 0, 1), () => 1); g.pivot(r, 0.06, 0.05, 0.1); g.mirror(r); }
  }
  // the tail (part 2; pivot at its root): the central pair, 0.7 m, roofed; three shorter feathers a side, fanned a little
  // and set lower; and the scarlet coverts lying along its root
  const TB = [0, 0.03, -0.17];
  const feather = (x0, y0, yaw, len, wMax, tent, nSeg, side, paint, c0, c1) => {
    const dz = -Math.cos(yaw), dx = Math.sin(yaw), R = [], A = [], B = [], cR = [], cE = [];
    for (let i = 0; i <= nSeg; i++) {
      const t = i / nSeg, w = wMax * (1 - 0.84 * t) * Math.min(1, t * 7 + 0.25) + 0.0025, cx = x0 + dx * len * t, cy = y0 + len * (0.06 * t - 0.22 * t * t), cz = TB[2] + dz * len * t;
      R.push([cx, cy, cz]); A.push([cx - dz * w, cy - tent * w, cz + dx * w]); B.push([cx + dz * w, cy - tent * w, cz - dx * w]); cR.push(c1); cE.push(c0);
    }
    for (const r of [g.strip(A, R, cE, cR), g.strip(R, B, cR, cE)]) { tag(r, 2, paint, (x, y, z) => clamp(Math.hypot(x - x0, z - TB[2]) / 0.7, 0, 1), () => side); g.pivot(r, TB[0], TB[1], TB[2]); }
  };
  const shaft = tan.clone().multiplyScalar(0.7);
  for (const sx of [-1, 1]) {
    feather(sx * 0.009, 0.036, sx * 0.02, 0.7, 0.034, 1.25, 10, sx * 0.15, 2, tan, shaft);
    for (let i = 1; i <= 3; i++) feather(sx * (0.014 + 0.008 * i), 0.03 - 0.011 * i, sx * (0.03 + 0.09 * i), [0.52, 0.38, 0.26][i - 1], 0.028, 0.75, 6, sx * (0.3 + 0.23 * i), 2, tan, shaft);
    for (let i = 0; i < 3; i++) feather(sx * (0.03 + 0.007 * i), 0.036 - 0.008 * i, sx * (0.07 + 0.05 * i), 0.27 - 0.045 * i, 0.011, 0.2, 3, sx * 0.4, 4, red, redD);
  }
  // legs (part 5; pivot at the hip): a feathered thigh, a yellow shank, three toes forward and one back
  for (const sx of [-1, 1]) {
    const X = sx * 0.037, L = [g.blob(sx * 0.036, -0.036, -0.005, 0.027, 0.046, 0.036, red, redD, 6, 4), g.tube([[X, -0.055, -0.01], [X, -0.098, -0.03], [X, -0.135, -0.012], [X, -0.166, 0.004]], [0.015, 0.0095, 0.0085, 0.0085], 5, redD, leg)];
    for (const tx of [-0.024, 0, 0.024]) L.push(g.tube([[X, -0.166, 0.004], [X + tx * 0.6, -0.169, 0.03], [X + tx, -0.173, 0.056]], [0.0065, 0.005, 0.002], 4, leg, leg));
    L.push(g.tube([[X, -0.166, 0.004], [X, -0.172, -0.022]], [0.006, 0.002], 4, leg, leg));
    for (const r of L) { tag(r, 5, 4, (x, y) => clamp((-0.03 - y) / 0.14, 0, 1), () => sx); g.pivot(r, sx * 0.036, -0.03, -0.005); }
  }
  return g.build();
}
// iB = scale, cape fanned (0..1), -, pitch of the body over the hips; uPz = how far the head is turned toward the lens
// (radians), then three terms the world leaves at 0 (he never hops). The feet keep to the log: only what is above the hips
// pitches; the head turns on the neck in small quick looks, the cape rides with it, the tail sways and flexes along its length.
const PHEASANT_DEFORM = /* glsl */`
uniform vec4 uPz;
void deform(inout vec3 p, inout vec3 n){
  float part = aAnim.z, t = uTime, hop = uPz.y, cr = uPz.z; gYaw = iA.w; gThin = aAnim.w;
  float sac = floor(t * 1.4), hy = uPz.x + .2 * (mix(h11(sac), h11(sac + 1.), smoothstep(0., .18, fract(t * 1.4))) - .5);
  vec3 nk = vec3(0., .07, .19);
  if (part > 5.5) { vec3 q = p - aPivot; q.x *= 1. + 1.3 * hop * aAnim.x; q.y += (.035 * hop + .002 * sin(t * 2.1)) * aAnim.x; p = aPivot + q; }
  else if (part > 4.5) { vec3 q = p - aPivot; q.y *= 1. - .3 * cr - .25 * hop; rotX(q, -.8 * hop * aAnim.x); p = aPivot + q; }
  else if (part > 2.5) { vec3 q = p - nk; rotY(q, hy); p = nk + q; rotY(n, hy); p.y += .004 * sin(t * 1.7 + 1.); }
  else if (part > 1.5) {
    vec3 q = p - aPivot; float a = aAnim.x;
    rotY(q, (.11 * sin(t * .8) + .05 * sin(t * 1.9 + 2.) * a + uPz.w) * a + aAnim.y * .12 * iB.y * a);
    rotX(q, (.05 * sin(t * 1.15 + 1.) - .3 * hop) * a * (.4 + .6 * a)); p = aPivot + q;
  }
  else if (part > .5) { p += aPivot * iB.y * (.93 + .07 * sin(t * 2.6)); vec3 q = p - nk; rotY(q, hy * .65); p = nk + q; rotY(n, hy * .65); }
  if (part < 4.5 || part > 5.5) {
    vec3 hp = vec3(0., -.03, -.01), q = p - hp; rotX(q, iB.w); p = hp + q; rotX(n, iB.w);
    p.y += .003 * sin(t * 2.) - .03 * cr;
  }
}`;
// feather pattern (vThin carries the paint): scales on the body, dark bars across the tail feathers (V-shaped about the
// shaft), the edges of the long feathers of the folded wing; each fades to its mean before it is finer than a pixel
const PHEASANT_PATTERN = /* glsl */`
vec3 pattern(vec3 alb, vec3 l, float id){
  if (id > 1.5 && id < 2.5) {
    float q = -l.z * 19. + abs(l.x) * 24., w = fwidth(q) * 1.2, f = abs(fract(q) - .5) * 2.;
    alb *= mix(.82, mix(1.08, .3, 1. - smoothstep(.34 - w, .34 + w, f)), 1. - smoothstep(.35, 1.1, w));
  } else if (id > 2.5 && id < 3.5) {
    float q = l.y * 58. - l.z * 10., w = fwidth(q) * 1.2, f = abs(fract(q) - .5) * 2.;
    alb *= mix(.88, 1.05 - .5 * (1. - smoothstep(.08, .22 + w, f)), 1. - smoothstep(.35, 1.1, w));
  } else if (id < .5) {
    float w = fwidth(l.z * 24.) * 1.2, row = floor(l.z * 24.);
    vec2 sc = vec2(atan(l.x, l.y - .02 + 1e-5) * 4.5 + .5 * mod(row, 2.), l.z * 24.), cf = vec2(fract(sc.x) - .5, fract(sc.y));
    float e = smoothstep(.62, .92, length(vec2(cf.x * 1.5, 1. - cf.y)));
    alb *= mix(.9, 1.06 - .42 * e, 1. - smoothstep(.35, 1.1, w));
  }
  return alb;
}`;

export default {
  id: 'drowned-forest-lakes', name: 'The Peacock Lakes', category: 'wilderness', weirdness: 0.1, media: ['air'],
  async build(ctx) {
    const { rng, noise } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || { hour: 'any', rare: false, density: 1 };
    // --- the look of this visit: hour, season and weather ---
    const lr = makeRng(hashSeed('lakes-look:' + ctx.seed)), r0 = lr();
    let lookName = r0 < 0.42 ? 'morning' : r0 < 0.52 ? 'dawn' : r0 < 0.62 ? 'night' : r0 < 0.81 ? 'amber' : 'snow';
    if (vary.hour === 'night') lookName = 'night'; else if (vary.hour === 'dawn') lookName = 'dawn'; else if (vary.hour === 'golden') lookName = lookName === 'dawn' ? 'dawn' : 'amber';
    else if (vary.hour === 'day' && lookName !== 'morning' && lookName !== 'snow') lookName = lr() < 0.7 ? 'morning' : 'snow';
    const LK = LOOKS[lookName], dens = clamp(((vary.density ?? 1) - 0.7) / 0.6, 0, 1), late = LK.season === 'late', DUR = 50;
    const [P0, P1, P2, P3, P4, P5, P6] = PAL.map(hex);
    const scene = new THREE.Scene();
    const sky = makeSky({ rng, ...LK.sky }); scene.add(sky.object);
    await ctx.yield();
    const sunDir = (LK.moon ? sky.lightDirection : sky.sunDirection).clone().normalize(), sunCol = hex(LK.sun), ambCol = hex(LK.amb), gndCol = hex(LK.gnd);
    const zen = sky.zenithColor.clone(), hor = sky.horizonColor.clone(), haze = hor.clone().lerp(zen, LK.low < 1 ? 0.5 : LK.snow ? 0.42 : 0.22);
    const dl = new THREE.DirectionalLight(sunCol, LK.sunI * (LK.low < 1 ? 0.4 : 1)); dl.position.copy(sunDir).multiplyScalar(600); scene.add(dl);
    scene.add(new THREE.HemisphereLight(ambCol, gndCol, LK.ambI));
    scene.fog = new THREE.FogExp2(haze, LK.fog);
    // sky light on white water where the sun does not reach (dawn, late afternoon): the sky's own colour, half bleached
    const skyL = ambCol.clone().multiplyScalar(LK.ambI / Math.PI), skyLum = 0.2126 * skyL.r + 0.7152 * skyL.g + 0.0722 * skyL.b;
    const shW = LK.shW ? new THREE.Color(...LK.shW) : LK.low < 1 ? skyL.clone().lerp(new THREE.Color(skyLum, skyLum, skyLum).multiplyScalar(1.15), 0.5).multiplyScalar(1.5) : new THREE.Color(0, 0, 0);
    const moss = P5.clone().lerp(hex('#8FA32B'), 0.6), soil = P5.clone().lerp(P4, 0.28).multiplyScalar(0.62);
    const sunXZ = Math.hypot(sunDir.x, sunDir.z) || 1, SHC = [15, -12];      // the band of late light is centred on the stand
    const U = { uTime: { value: 0 }, uU: { value: 0 }, uSnow: { value: LK.snow }, uHazeK: { value: LK.hazeK }, uLow: { value: LK.low }, uWSun: { value: LK.low < 1 ? 0 : 1 }, uShW: { value: shW }, uSun: { value: sunDir },
      uSunCol: { value: sunCol.clone().multiplyScalar(LK.sunI / Math.PI) }, uSkyCol: { value: ambCol.clone().multiplyScalar(LK.ambI / Math.PI) }, uGndCol: { value: gndCol.clone().multiplyScalar(LK.ambI / Math.PI) },
      uHaze: { value: haze }, uZen: { value: zen }, uHor: { value: hor }, uShadow: { value: new THREE.Vector4(...LK.shadow) }, uBone: { value: P3 }, uGold: { value: P4 }, uScar: { value: P6 }, uSpruce: { value: P5 },
      uMoss: { value: moss }, uSoil: { value: soil }, uTurq: { value: P2 }, uFallZ: { value: ZLIP + 5 }, uLate: { value: late ? 1 : 0 }, uFar: { value: 1 }, uRibK: { value: 1 }, uFallS: { value: -540 }, uWallHz: { value: LK.wallHz ?? 0 }, uMoon: { value: LK.moon ? 1 : 0 }, uDur: { value: DUR }, uResY: { value: 450 },
      uFill: { value: new THREE.Color(...(LK.fill || [0, 0, 0])) }, uShaft: { value: new THREE.Vector4(-sunDir.z / sunXZ, sunDir.x / sunXZ, (-sunDir.z * SHC[0] + sunDir.x * SHC[1]) / sunXZ, LK.shaft || 0) } };
    const mk = (vs, fs, params = {}, extra = null) => new THREE.ShaderMaterial({ uniforms: extra ? { ...U, ...extra } : U, vertexShader: vs, fragmentShader: fs, ...params });
    await ctx.yield();

    // --- the hero: the top lake ---
    const ys = (z) => -6 * clamp((z - ZC) / (ZLIP - ZC), 0, 1.25);                    // the shoal's sheet of water
    // the line flown before the lake path: lower lake, the climb through the slot, the shoal. The hero is told it (approach)
    // so that it can find the journey's u on its own path: the pheasant's log is set from the journey's u 0.885.
    const approach = [[AX, LL + 5.6, 482], [AX, LL + 4.3, 462], [AX, LL + 2.7, 440], [AX, LL + 1.7, 418], [AX, LL + 1.55, 398], [AX, -28.1, 380], [AX, -19.4, 368], [AX, -10.4, 356], [AX, -4, 344],
      [AX, -2.2, 332], [AX, -1.75, 320], [AX, -1.7, 308],   // (the climb tops out 2-3 m over the shoal's sheet while still in the slot: the lip is looked down on, never seen edge-on)
      [AX, ys(296) + 1.2, 296], [AX, ys(282) + 1.2, 282], [AX, ys(268) + 1.2, 268], [AX, 1.25, 254], [AX, 1.3, 240]];
    // (surfZ 256.6: the lake's level water, the mirror, reaches the crest of the shoal; the ground of the outlet tongue lies under it)
    const hero = await buildHero(ctx, { palette: PAL, hour: LK.hour, season: LK.season, density: dens, backdrop: false, zMax: 242, surfZ: 256.6, approach, snow: LK.snow,
      sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: LK.sun, ambientSky: LK.moon ? '#1e3f86' : undefined, ambientHorizon: LK.moon ? '#2c4c88' : undefined, sunIntensity: LK.sunI * LK.lake, ambient: LK.heroAmb ?? (LK.low < 1 ? 1.25 : 0.62), scatter: LK.scat, skyColor: zen, horizonColor: hor,
      skyline: { treeHeight: 19, slopeTan: 0.5, axisTan: 0.12, peakTan: 0.42, peakWidth: 0.2 }, gustU: UG, healU: 0.74, progress: 0, portalRadius: PR, slopeFill: LK.fill,
      outletFill: [shW.r * 1.6 + (LK.fill ? LK.fill[0] * 0.6 : 0), shW.g * 1.6 + (LK.fill ? LK.fill[1] * 0.6 : 0), shW.b * 1.6 + (LK.fill ? LK.fill[2] * 0.6 : 0)],   // (what LAND_FRAG adds to its own travertine in shade: uShW * 1.6 + uFill * 0.6)
      lowSun: LK.low, paleK: lookName === 'dawn' ? 1 : 0.8, isleRock: LK.isleRock, shaft: LK.shaft ? { perp: [-sunDir.z / sunXZ, sunDir.x / sunXZ], offset: (-sunDir.z * SHC[0] + sunDir.x * SHC[1]) / sunXZ, half: LK.shaft, out: 0.8, in: 1.75 } : null });
    scene.add(hero.object);
    const lake = hero.lake;
    await ctx.yield();

    // --- the land: one height function for the valley, the lower basin, the fall and the shoal ---
    const sdBox = (x, z, cx, cz, hx, hz, r) => { const qx = Math.abs(x - cx) - hx + r, qz = Math.abs(z - cz) - hz + r; return Math.min(Math.max(qx, qz), 0) + Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) - r; };
    // (round 11) THE FACE BULGES IN PLAN. Two round buttresses of travertine stand forward either side of the slot, the face
    // lies back in an alcove forty metres out on each side and comes forward again toward its ends (lobe: metres toward the
    // lower lake, never negative, a function of x alone); the foot of the fall and the lake's edge follow it. This is the
    // one lip there is: whatever is seeded on or beside the fall is accepted or refused by this ground.
    const lobe = (x) => 4.6 * (1 + Math.cos((x - AX) * 0.0805)) + 1.4 * (1 + Math.sin((x - AX) * 0.19 + 0.8));
    const sdLow = (x, z) => { const zz = z - lobe(x) * (1 - smoothstep(350, 384, z)); return Math.min(sdBox(x, zz, -62, 500, 78, 156, 55), sdBox(x, zz, AX, 364, 104, 20, 16)) + 5 * noise.n2(x * 0.012 + 9.1, z * 0.012) + 1.5 * noise.n2(x * 0.05, z * 0.05 + 3.3); };
    const lipZ = (x) => ZLIP + lobe(x) + 4.5 * noise.n2(x * 0.021, 7.7) + 1.5 * noise.n2(x * 0.09, 3.1);
    const xc = (z) => lerp(45, AX, smoothstep(180, 330, z)) + (z > 250 ? 560 : 380) * Math.sin((z - 250) / 520) * smoothstep(450, 1250, Math.abs(z - 250));
    const hw = (z) => lerp(340, 215, smoothstep(180, 330, z));
    const gi = { trav: 0, film: 0, alt: 0, hum: 0, t: 0, rise: 0, sh: 0, s: 0, sk: 0, rk: 1 };
    // ledges in the face of the fall where willow and spruce root: [x, how far down the face, half-width, height]
    const LEDGE = [[-17, 0.42, 2.6, 1.7], [16, 0.36, 2.5, 1.6], [-27, 0.56, 3.1, 1.8], [25.5, 0.5, 3.1, 1.7], [36, 0.3, 3, 1.5], [-39, 0.38, 3, 1.6], [-56, 0.47, 3.1, 1.7], [58, 0.42, 3, 1.6], [-76, 0.5, 3, 1.6], [79, 0.36, 3, 1.5]].map((g) => [AX + g[0], g[1], g[2], g[3]]);
    // The slot's stair: twelve rimstone pools, each lying level behind a dam that curves downstream, the water going over
    // every dam in a short white fall (2-3.5 m). q counts pools down the slot; the fragment shader of the stair works out
    // the same q from the position, so paint and relief always agree.
    const STOP = -3.92, SBOT = LL - 0.7;
    const stOff = (x) => -0.3 * Math.cos((x - AX) * 0.33) + 0.09 * Math.sin((x - AX) * 1.1 + 1.7);
    const stQ = (x, z) => (z - SZ0) / (SZ1 - SZ0) * NSTEP + stOff(x);
    const stLv = (k) => { const p = clamp(k / NSTEP, 0, 1); return lerp(STOP, SBOT, 0.5 * p + 0.5 * p * p * (3 - 2 * p)); };
    const stairY = (x, z) => { const q = stQ(x, z), k = Math.floor(q), f = q - k, e = f - 0.66; return lerp(stLv(k), stLv(k + 1), smoothstep(0.7, 0.98, f)) + (k >= 0 && k < NSTEP ? 0.1 * Math.exp(-e * e / 0.0018) : 0); };
    const ground = (x, z) => {
      const a = Math.abs(x - AX), d = Math.abs(x - xc(z)) - hw(z); let rise = 0, y;
      gi.s = z; gi.sk = 0; gi.rk = 1;                                    // metres along the wall's contours, for the painted spurs (the side valley's walls run the other way), and their strength
      if (d > 0) rise = (950 * (1 - Math.exp(-d / 800)) * (1 + 0.22 * noise.fbm2(x / 700, z / 700, 3)) + 85 * (noise.ridged2(x / 420 + 3, z / 420, 4) - 0.35) * smoothstep(60, 500, d)) * smoothstep(-40, 240, d);
      // the west slope opens in a side valley (the one the west inflow comes down): a broad trough climbing away at a tenth,
      // between walls steep enough to show rock, with a second snow peak at its head. The turn over the lake looks up it.
      if (d > 0 && x > xc(z)) {
        const w = Math.abs(z - (-25 + 0.174 * (x - 385))) - (120 + 0.05 * d);
        if (w < 2600) {
          const side = 0.115 * d * (1 + 0.25 * noise.n2(x / 300, 5.5)) + (w > 0 ? 880 * (1 - Math.exp(-w / 700)) * (1 + 0.2 * noise.fbm2(x / 500 + 9, z / 500, 3)) : 0) + 20 * noise.n2(x / 110, z / 110) * smoothstep(0, 300, d);
          // smooth minimum: no crease where trough meets slope; high up the two faces meet in a broad round shoulder (220 m),
          // which the grid can draw, not in an arete, which it draws as a stair
          const df = rise - side, kk = lerp(60, 220, smoothstep(60, 320, Math.min(rise, side))), h = clamp(0.5 + 0.5 * df / kk, 0, 1); rise = lerp(rise, side, h) - kk * h * (1 - h) * 0.5;
          // each face has its own count along its contours; over the shoulder between two faces the one is blended into the
          // other (no jump anywhere), the spurs a little fainter there, and they die away on the floor of the side valley
          // (on a side wall the count is the z at which its fall line meets the shoulder, so it agrees there with the main wall's)
          const az = -25 + 0.174 * (x - 385), sth = z < az ? -1 : 1, hs = clamp(0.5 + 0.5 * df / (1.6 * kk), 0, 1);
          gi.s = lerp(z, az + sth * (120 + 0.85 * d), hs); gi.sk = hs * sth;
          gi.rk = (1 - hs * (1 - smoothstep(40, 220, w))) * (1 - 0.4 * 4 * hs * (1 - hs));
          rise = Math.max(rise, 0);
        }
      }
      gi.alt = rise; gi.rise = rise; gi.trav = 0; gi.film = 0; gi.hum = 0; gi.t = 0;
      if (z < 242) { y = lake.bedAt(x, z) + Math.max(0, -z - 300) * 0.02; gi.sh = lake.sdf(x, z); }
      else {
        const wch = 7.2 + 1.3 * noise.n2(z * 0.05, 4.4);
        const hum = Math.max(0, noise.n2(x * 0.07, z * 0.07 + 20) * 0.9 - 0.12) * smoothstep(wch, wch + 5, a) + 0.045 * noise.n2(x * 0.9, z * 0.9);
        let T = ys(z) - 0.1 + hum + 0.075 * Math.exp(-((z - 256.5) * (z - 256.5)) / 6) + 0.09 * Math.max(0, a - 55) + 2.2 * smoothstep(55, 90, a);
        if (z < ZC) T = lerp(lake.bedAt(x, z), T, smoothstep(242, 255, z)) + 0.05 * Math.exp(-((z - 246) * (z - 246)) / 1.6) * (1 - smoothstep(12, 20, a));   // the rimstone lip 11 m inside the crest (round 12: a low swell of the floor under the lake's level water; the lake is held by the crest of the shoal)
        const sl = sdLow(x, z), e = Math.max(sl, 0), dd = Math.max(-sl, 0);
        const Lw = sl > 0 ? LL + 0.06 + 0.5 * smoothstep(0, 4, e) + 0.06 * Math.min(e, 60) + 0.7 * (0.5 + 0.5 * noise.n2(x * 0.06, z * 0.06)) * smoothstep(1, 12, e) - Math.max(0, z - 700) * 0.02
          : LL - 0.35 - 4.6 * smoothstep(0, 38, dd) + 0.3 * noise.n2(x * 0.08, z * 0.08);
        // the step: the fall's bulging face, the slot on the axis, forested banks past the fall's ends
        const slot = 1 - smoothstep(6.5, 13, a), ends = smoothstep(96, 126, a), m = Math.max(slot, ends);
        const run = lerp(9, 60, m), z0 = lerp(lipZ(x), slot >= ends ? 306 : ZLIP - 22, m), t = clamp((z - z0) / run, 0, 1);
        // (the face drops in three falls with a ledge between)
        const p = t - 0.05 * Math.sin(t * 18.85) * (1 - m), s = p * p * (3 - 2 * p);
        y = lerp(T, Lw, s);
        if (t > 0 && t < 1) {
          y += 0.7 * noise.n2(x * 0.16, z * 0.3) * Math.sin(t * Math.PI) * (1 - ends);
          if (m < 0.5) for (let q = 0; q < LEDGE.length; q++) { const g = LEDGE[q], ex = (x - g[0]) / g[2], et = (t - g[1]) / 0.1, e2 = ex * ex + et * et; if (e2 < 6) y += g[3] * Math.exp(-e2); }
        }
        if (a < 9.2 && z > 302.5 && z < 371) y = lerp(y, stairY(x, z), (1 - smoothstep(5.2, 9.2, a)) * smoothstep(302.5, 306.5, z) * (1 - smoothstep(366.5, 371, z)));   // the floor of the slot is the stair
        gi.hum = hum; gi.t = t; gi.sh = z < ZLIP ? a - 62 : sl;
        gi.trav = Math.max((1 - smoothstep(56, 76, a)) * Math.max(smoothstep(242, 246, z), 1 - smoothstep(22, 34, a)), (1 - smoothstep(100, 118, a)) * smoothstep(z0 - 10, z0 - 2, z)) * (1 - smoothstep(374, 394, z));   // (round 11: on the outlet's axis the travertine starts at the hero's edge: no strip of soil under the water)
        gi.film = (1 - smoothstep(0.04, 0.2, hum)) * (1 - smoothstep(52, 58, a)) * smoothstep(ZC - 1, ZC + 1, z) * (1 - smoothstep(0.02, 0.2, t));
        if (z < ZC + 1) gi.film = Math.max(gi.film, (1 - smoothstep(13, 19, a)) * smoothstep(243.5, 244.5, z) * (1 - smoothstep(-0.03, 0.1, T)));   // the outlet tongue: marl terraces under clear water, to the lip
      }
      if (rise < 56) gi.alt = Math.max(rise, 56 * smoothstep(24, 64, gi.sh));     // the valley floor is forest away from the water
      if (z >= 242 && gi.t > 0.03 && gi.t < 0.995 && gi.trav > 0.3) gi.alt = -9 * Math.min(1, 4 * Math.sin(gi.t * Math.PI)) * gi.trav;   // the rock the fall runs over: wet (a negative altitude tells the shader)
      return y + rise;
    };

    // --- the path: lower lake, the climb through the slot, the shoal, then the hero's line over the top lake ---
    const pts = approach.map((q) => [q[0], q[1], q[2]]);
    for (const p of hero.anchors.flyThrough) pts.push([p.x, p.y, p.z]);
    const path = makePath(pts), L = path.length;
    await ctx.yield();

    // (fallSide: what belongs to the shoal; fallLow: what belongs to the fall's face, the slot and the lower lake; fallRim: the lip's spruces. None is
    // drawn once the lens cannot see it: rules of the lens's own place and gaze, in update(). The hero does the same for
    // sunk wood and carp, hero.setLens.)
    const fallSide = [], fallLow = [], fallRim = [];
    // --- terrain meshes: a fine tensor grid round the fall and the lower lake, a coarse warped grid for the valley, the peak ---
    const landMat = mk(LAND_VERT, LAND_FRAG);
    const buildGrid = async (xs, zs, o = {}) => {
      const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), mat = new Float32Array(nx * nz * 3), rib = new Float32Array(nx * nz * 3), flag = new Uint8Array(nx * nz), idx = [];
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const k = j * nx + i, x = xs[i], z = zs[j]; let y = o.height ? o.height(x, z) : ground(x, z);
          if (o.sink) { const sk = o.sink(x, z, i, j); if (sk) { y -= sk; flag[k] = 1; } }
          pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; mat[k * 3] = gi.trav; mat[k * 3 + 1] = gi.film; mat[k * 3 + 2] = gi.alt / 1000;
          if (!o.height) { rib[k * 3] = gi.s / 1000; rib[k * 3 + 1] = gi.sk; rib[k * 3 + 2] = gi.rk; }
          if ((i & 31) === 31) await ctx.yield();                      // (a row of the valley grid is long: the page gets its frames within it)
        }
        await ctx.yield();
      }
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        if (o.hole && flag[a] && flag[b] && flag[c] && flag[d]) continue;
        idx.push(a, c, b, b, c, d);
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aMat', new THREE.BufferAttribute(mat, 3)); g.setAttribute('aRib', new THREE.BufferAttribute(rib, 3)); g.setIndex(idx);
      await ctx.yield(); await normalsInSteps(g, ctx.yield); await ctx.yield();   // (the valley grid's normals, in steps)
      const m = new THREE.Mesh(g, o.material || landMat); m.frustumCulled = false; scene.add(m); return m;
    };
    const span = (arr, a, b, step) => { const n = Math.max(1, Math.round((b - a) / step)); for (let i = 0; i < n; i++) arr.push(a + (b - a) * i / n); };
    const nxs = [], nzs = [];
    span(nxs, -262, -214, 4.8); span(nxs, -214, -122, 2.4); span(nxs, -122, -78, 1.1); span(nxs, -78, 14, 2.4); span(nxs, 14, 62, 4.8); nxs.push(62);
    span(nzs, 242, 262, 1); span(nzs, 262, 296, 2); span(nzs, 296, 372, 1); span(nzs, 372, 404, 2); span(nzs, 404, 564, 8); nzs.push(564);
    await buildGrid(nxs, nzs, { sink: (x, z, i, j) => { if (i === 0 || i === nxs.length - 1 || j === nzs.length - 1 || (j === 0 && x < -205)) return 3; const q = stQ(x, z); return Math.abs(x - AX) < 8.8 && q > 0.45 && q < NSTEP + 0.5 ? 0.9 : 0; } });
    {                                                                    // the stair: its own fine mesh, rows laid along the dams
      const NC = 26, FR = [0, 0.33, 0.6, 0.66, 0.71, 0.79, 0.88, 0.97], qs = [];
      for (let k = 0; k < NSTEP; k++) for (const f of FR) qs.push(k + f);
      qs.push(NSTEP, NSTEP + 0.45, NSTEP + 0.9);
      const nr = qs.length, sp = new Float32Array(nr * (NC + 1) * 3), si = [];
      for (let r = 0; r < nr; r++) {
        for (let i = 0; i <= NC; i++) { const x = AX - 11 + 22 * i / NC, z = SZ0 + (qs[r] - stOff(x)) * (SZ1 - SZ0) / NSTEP, o = (r * (NC + 1) + i) * 3; sp[o] = x; sp[o + 1] = ground(x, z); sp[o + 2] = z; }
        if ((r & 7) === 7) await ctx.yield();
      }
      for (let r = 0; r < nr - 1; r++) for (let i = 0; i < NC; i++) { const a = r * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1; si.push(a, c, b, b, c, d); }
      const sg2 = new THREE.BufferGeometry(); sg2.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg2.setIndex(si); sg2.computeVertexNormals();
      const stair = new THREE.Mesh(sg2, mk(STAIR_VERT, STAIR_FRAG, { transparent: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); stair.renderOrder = 0.5; stair.frustumCulled = false; scene.add(stair); fallLow.push(stair);
      await ctx.yield();
    }
    // (fineHi / fineLo: how far beyond b / before a the lines stay within 58 m of each other: the west wall over the gate,
    // whose skyline stands over the portal for the last fifth of the flight)
    const lines = (lo, hi, a, b, fineHi = 0, fineLo = 0) => {
      const out = []; for (let v = a; v <= b + 1e-6; v += 12) out.push(v);
      let st = 12, v = b; while (v < hi) { st = Math.min(st * 1.2, v < b + fineHi ? 58 : 115); v += st; out.push(v); }
      st = 12; v = a; while (v > lo) { st = Math.min(st * 1.2, v > a - fineLo ? 58 : 115); v -= st; out.unshift(v); }
      return out;
    };
    const inHole = (x, z) => (x > -204 && x < 294 && z > -229 && z < 242.5) || (x > -261 && x < 61 && z >= 242 && z < 563);
    await buildGrid(lines(-2300, 2300, -276, 312, 1150, 0), lines(-2750, 2500, -246, 582, 0, 1150), { hole: true, sink: (x, z) => (inHole(x, z) ? 2.5 : 0) });
    const PKX = -30, PKZ = -3500, PH = 0.42 * 3500, pxs = [], pzs = [];
    span(pxs, PKX - 1300, PKX + 1300, 58); pxs.push(PKX + 1300); span(pzs, PKZ - 1100, PKZ + 1100, 58); pzs.push(PKZ + 1100);
    const peakMat = mk(LAND_VERT, LAND_FRAG, {}, { uFar: { value: 0.5 }, uRibK: { value: 0 } });
    {                                                                    // the peak at the head of the side valley, 3.4 km west of the lake
      const QX = 3350, QZ = 500, QH = 1180, qxs = [], qzs = [];
      span(qxs, QX - 1150, QX + 1150, 66); qxs.push(QX + 1150); span(qzs, QZ - 1050, QZ + 1050, 66); qzs.push(QZ + 1050);
      await buildGrid(qxs, qzs, { material: peakMat, height: (x, z) => {
        const r1 = Math.hypot(x - QX, z - QZ) / 640, r2 = Math.hypot(x - QX - 60, z - QZ + 470) / 520;
        const h = Math.max(QH * Math.max(0, 1 - Math.pow(r1, 0.8)), QH * 0.66 * Math.max(0, 1 - Math.pow(r2, 0.9)));
        const y = h * (0.86 + 0.2 * noise.ridged2(x / 480 + 3, z / 480, 4)) + 50 * noise.fbm2(x / 300, z / 300, 3) + 120;
        gi.trav = 0; gi.film = 0; gi.alt = y + 350; return y;
      } });
    }
    await buildGrid(pxs, pzs, { material: peakMat, height: (x, z) => {
      const r1 = Math.hypot(x - PKX, z - PKZ) / 700, r2 = Math.hypot(x - PKX + 490, z - PKZ - 60) / 630;
      const h = Math.max(PH * Math.max(0, 1 - Math.pow(r1, 0.85)), PH * 0.62 * Math.max(0, 1 - Math.pow(r2, 0.9)));
      const y = h * (0.86 + 0.2 * noise.ridged2(x / 520 + 7, z / 520, 4)) + 50 * noise.fbm2(x / 300, z / 300, 3) + 30;
      gi.trav = 0; gi.film = 0; gi.alt = y + 350; return y;
    } });

    await ctx.yield();
    // --- the lower lake: turquoise milk, with leaf rafts streaking under the path ---
    const lg = new THREE.PlaneGeometry(250, 336, 40, 54); lg.rotateX(-Math.PI / 2); lg.translate(-92, LL, 504);
    const lp = lg.attributes.position, ld = new Float32Array(lp.count);
    for (let i = 0; i < lp.count; i++) { ld[i] = LL - ground(lp.getX(i), lp.getZ(i)); if ((i & 255) === 255) await ctx.yield(); }
    lg.setAttribute('aDepth', new THREE.BufferAttribute(ld, 1));
    const lf = new Float32Array(lp.count);                           // metres out from the foot of the falls
    for (let i = 0; i < lp.count; i++) { const x = lp.getX(i); lf[i] = lp.getZ(i) - lerp(lipZ(x) + 10.5, 369.5, 1 - smoothstep(6.5, 13, Math.abs(x - AX))); }
    lg.setAttribute('aFoot', new THREE.BufferAttribute(lf, 1));
    const uRaft = [], uRaftB = [], uDuck = [];
    for (let i = 0; i < 24; i++) { uRaft.push(new THREE.Vector4(0, 0, 1, 1)); uRaftB.push(new THREE.Vector4(0, 1, 0, 0)); }
    for (let i = 0; i < 9; i++) uDuck.push(new THREE.Vector3(0, 0, 0));
    const lowLake = new THREE.Mesh(lg, mk(LAKE_VERT, LAKE_FRAG, { transparent: true, depthWrite: false }, { uRaft: { value: uRaft }, uRaftB: { value: uRaftB }, uDuck: { value: uDuck } })); lowLake.renderOrder = 2; lowLake.frustumCulled = false; scene.add(lowLake); fallLow.push(lowLake);
    await ctx.yield();
    // THE STRAYS: single leaves strewn over the lower lake, a quarter of the lake's count of leaves, each kept if it lies on
    // the water (1.5 m inside the lake's edge as it is, south of the fall's foot). They are dealt here from a stream of
    // their own ('lakes-strays') and the main stream takes nothing. The long streaks of leaves that lie down the lake
    // under the nose are dealt from their own fork ('rafts', after 'spray'): see the end.
    const leafList = [], nLeaf = Math.round(850 * detail * Math.min(LK.leaves, 1.6));
    {
      const yr = makeRng(hashSeed('lakes-strays:' + ctx.seed));
      for (let i = 0, n = Math.floor(nLeaf / 4); i < n; i++) {
        const x = AX + yr.range(-60, 60), z = yr.range(360, 540);
        if (sdLow(x, z) < -1.5 && z > 366) leafList.push([x, z, yr() * 6.283, yr.range(0.17, 0.32), yr(), yr()]);
      }
    }
    await ctx.yield();

    // --- the fall: about a hundred threads that follow the travertine down, mist at its foot and in the slot ---
    const tp = [], tu = [], ta = [], tf = [], ts = [], tl = [], ti = [], g2 = [0, 0];
    const ledgeFade = (x, t) => { let f = 1; for (let q = 0; q < LEDGE.length; q++) { const g = LEDGE[q], ex = (x - g[0]) / g[2], et = (t - g[1] + 0.02) / 0.13; f = Math.min(f, smoothstep(0.45, 1.5, ex * ex + et * et)); } return f; };   // the water parts round the clumps on the ledges
    const trng = makeRng(hashSeed('lakes-veils:' + ctx.seed));           // the veils' own stream
    const thread = (x0, z0, w, spd, stop = 0) => {
      let x = x0, z = z0, len = 0; const seed = trng(), rows = [], LIFT = 0.55;
      for (let k = 0; k < 42; k++) {
        const y = ground(x, z), tC = gi.t, e = 0.6; if (y < LL - 0.15 || (stop && Math.abs(x - AX) < stop)) break;
        g2[0] = (ground(x + e, z) - ground(x - e, z)) / (2 * e); g2[1] = (ground(x, z + e) - ground(x, z - e)) / (2 * e);
        const gl = Math.hypot(g2[0], g2[1]), wd = smoothstep(0.1, 0.6, gl), il = 1 / Math.max(gl, 1e-3);
        let dx = -g2[0] * il * wd, dz = -g2[1] * il * wd + (1 - wd); const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
        const nn = 1 / Math.sqrt(1 + gl * gl), ox = -g2[0] * nn * LIFT, oy = nn * LIFT, oz = -g2[1] * nn * LIFT;
        const stp = smoothstep(0.3, 1.2, gl), wf = w * (1 + 0.5 * (1 - stp));       // on a ledge and at the foot the veil spreads
        const ax = x + dz * wf, az = z - dx * wf, bx = x - dz * wf, bz = z + dx * wf;          // each edge rides its own rock, never more than a metre under the middle
        const ya = Math.max(ground(ax, az), y - 1), fa = ledgeFade(ax, gi.t), yb = Math.max(ground(bx, bz), y - 1), fb = ledgeFade(bx, gi.t);
        rows.push([ax + ox, ya + oy, az + oz, bx + ox, yb + oy, bz + oz, len, fa, fb, stp, tC]);
        const st = 1.4 * nn; x += dx * st; z += dz * st; len += 1.4;
      }
      let n = rows.length; if (n < 2) return;
      for (let k = 1; k < n - 1; k++) for (const c of [1, 4]) rows[k][c] = Math.max(rows[k][c], (rows[k - 1][c] + rows[k + 1][c]) / 2 - 0.1);   // bridge the hollows
      if (stop) {                                                      // the veils beside the lens bend over their ledges in a curve, not at a crease: a row between every two
        for (let pass = 0; pass < 3; pass++) {                           // (first the line itself is drawn smooth: water finding its way down a gully swings from side to side)
          const sm = rows.map((r) => r.slice());
          for (let k = 1; k < n - 1; k++) for (let c = 0; c < 6; c++) { const v = 0.25 * sm[k - 1][c] + 0.5 * sm[k][c] + 0.25 * sm[k + 1][c]; rows[k][c] = c === 1 || c === 4 ? Math.max(v, sm[k][c] - 0.12) : v; }
        }
        const fine = [];
        for (let k = 0; k < n; k++) {
          fine.push(rows[k]); if (k === n - 1) break;
          const p0 = rows[Math.max(0, k - 1)], p1 = rows[k], p2 = rows[k + 1], p3 = rows[Math.min(n - 1, k + 2)], m = [];
          for (let c = 0; c < 11; c++) m.push(c < 6 ? (-p0[c] + 9 * p1[c] + 9 * p2[c] - p3[c]) / 16 : (p1[c] + p2[c]) / 2);
          fine.push(m);
        }
        rows.length = 0; for (const r of fine) rows.push(r); n = rows.length;
      }
      const b = tp.length / 3, tot = rows[n - 1][6];
      for (let k = 0; k < n; k++) { const r = rows[k]; tp.push(r[0], r[1], r[2], r[3], r[4], r[5]); tu.push(-1, r[6], 1, r[6]); ta.push(spd, seed, w, tot, spd, seed, w, tot); tf.push(r[7], r[8]); ts.push(r[9], r[9]); tl.push(r[10], r[10]); if (k) { const q = b + k * 2; ti.push(q - 2, q, q - 1, q - 1, q, q + 1); } }
    };
    // (the world's main stream is advanced exactly as the old ninety-two threads advanced it, so nothing seeded after them moves)
    for (let i = 0; i < 92; i++) { const x = AX - 104 + 208 * (i + rng()) / 92; if (Math.abs(x - AX) > 14) { rng(); rng(); rng(); } }
    for (let i = 0; i < 23; i++) { rng(); rng(); rng(); rng(); } for (let i = 0; i < 5; i++) rng();
    // seventy-odd veils: one in seven a thread, half of them a metre or two wide, the rest broad curtains of three or four
    const nTh = 74;
    for (let i = 0; i < nTh; i++) {
      const x = AX - 104 + 208 * (i + trng()) / nTh, r = trng(), w = (r < 0.14 ? trng.range(0.28, 0.45) : r < 0.66 ? trng.range(0.6, 1.15) : trng.range(1.3, 2.3)) * (late ? 0.88 : 1), spd = trng.range(1.6, 3.2);
      // (round 11: on the crest of a buttress the water is thin threads with the rock between; it gathers into broad veils in the alcoves)
      if (Math.abs(x - AX) > 14) thread(x, lipZ(x) - 1.6, Math.max(0.26, w * lerp(1.4, 0.75, smoothstep(2.5, 9.5, lobe(x)))), spd); await ctx.yield();
    }
    // down the walls of the slot, ending where they meet the stair
    // (thirty thin separate strands, each from the top of the wall to its foot and no further: none runs on down the stair's edge like a rail)
    for (let i = 0; i < 30; i++) { thread(AX + (i % 2 ? 1 : -1) * trng.range(12.2, 13.4), 312 + Math.floor(i / 2) * 2.3 + trng.range(-0.6, 0.6), trng.range(0.3, 0.62), trng.range(1.8, 3.2), 8.7); await ctx.yield(); }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(tu, 2)); tg.setAttribute('aT', new THREE.Float32BufferAttribute(ta, 4)); tg.setAttribute('aF', new THREE.Float32BufferAttribute(tf, 1)); tg.setAttribute('aSt', new THREE.Float32BufferAttribute(ts, 1)); tg.setAttribute('aLg', new THREE.Float32BufferAttribute(tl, 1)); tg.setIndex(ti);
    const threads = new THREE.Mesh(tg, mk(THREAD_VERT, THREAD_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide })); threads.renderOrder = 1; threads.frustumCulled = false; scene.add(threads); fallLow.push(threads);
    await ctx.yield();
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const mistPos = [], mistCol = haze.clone().lerp(hex('#ffffff'), 0.55).multiplyScalar(LK.low < 1 ? 0.75 : 1);
    for (let i = 0; i < 64; i++) { const x = AX + rng.range(-98, 98); mistPos.push([x, LL + rng.range(1, 8), lipZ(x) + rng.range(7, 17)]); }
    for (let i = 0; i < 22; i++) { const x = AX + rng.range(-9, 9), z = rng.range(326, 364); mistPos.push([x, ground(x, z) + rng.range(1.5, 6), z]); }
    const vrng = rng.fork('mist'), vA = [], vS = [];              // a dozen veils along the foot with gaps between them, five in the slot
    for (let i = 0; i < 86; i++) {
      const m = mistPos[i], slot = i >= 64, a = Math.abs(m[0] - AX);
      if (slot ? i % 3 !== 0 : (i % 2 !== 1 || a < 13)) continue;
      const z = slot ? Math.max(m[2], 344 + (m[2] - 326) * 0.3) : lipZ(m[0]) + 9.5 + (m[2] - lipZ(m[0]) - 7) * 0.45;
      vA.push(m[0], slot ? ground(m[0], z) - 0.4 : LL - 0.4, z, vrng()); vS.push(slot ? vrng.range(4, 5.6) : vrng.range(5.5, 8), slot ? vrng.range(6.5, 9) : vrng.range(17, 25));
    }
    for (const [dx, sd, w, h] of [[-22, 0.37, 7, 22], [25, 0.81, 7.5, 20], [-44, 0.13, 8, 24], [-15.5, 0.55, 5.6, 18], [17, 0.23, 6, 19]]) { vA.push(AX + dx, LL - 0.4, lipZ(AX + dx) + 11.5, sd); vS.push(w, h); }
    const vg = new THREE.InstancedBufferGeometry();
    vg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0], 3)); vg.setIndex([0, 1, 2, 2, 1, 3]);
    vg.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(vA), 4)); vg.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(vS), 2)); vg.instanceCount = vA.length / 4;
    const veils = new THREE.Mesh(vg, mk(VEIL_VERT, VEIL_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide }, { uVeil: { value: LK.low < 1 ? 0.7 : 0.85 } }));
    veils.renderOrder = 3; veils.frustumCulled = false; scene.add(veils); fallLow.push(veils);   // (drawn by the rule of the fall's box, with the water they stand on)
    await ctx.yield();
    {                                                                    // the bank of spray along the foot of the fall
      const bp = [], bu = [], bi = [], NB = 54;
      for (let i = 0; i <= NB; i++) {
        const dx = -108 + 216 * i / NB, x = AX + dx, zf = lerp(lipZ(x) + 10.5, 369.5, 1 - smoothstep(6.5, 13, Math.abs(dx)));
        for (let r = 0; r < 3; r++) { bp.push(x, LL - 0.3 + 4.5 * r, zf + 1.2 - 1.1 * r); bu.push(dx, r / 2); }
        if (i) for (let r = 0; r < 2; r++) { const a = (i - 1) * 3 + r, b = a + 3; bi.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(bu, 2)); bg.setIndex(bi);
      const bank = new THREE.Mesh(bg, mk(BANK_VERT, BANK_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide }, { uVeil: { value: LK.low < 1 ? 0.8 : 0.95 } }));
      bank.renderOrder = 2.6; bank.frustumCulled = false; scene.add(bank); fallLow.push(bank);
      // and the mist on the top lake, among the standing trunks and on toward the gate
      const mr = makeRng(hashSeed('lakes-mist2:' + ctx.seed)), mA = [], mS = [];
      for (let i = 0, t = 0; i < 24 && t < 400; t++) {
        if (i < 17) { const x = 15 + mr.gauss() * 60, z = -15 + mr.gauss() * 28; if (lake.sdf(x, z) > -6) continue; mA.push(x, 0.1, z, mr()); mS.push(mr.range(18, 34), mr.range(3, 6)); i++; continue; }
        // (round 13) THE GATE'S BANK OF MIST, the last seven sheets. The bank's own shape: every sheet's foot stands on the
        // far side of the sill's crest (4 to 16 m beyond it), to one side of the gate or the other, clear of the portal's
        // ring by its own half width and 3 m more. None hangs over the shelf's water (they were strewn 30 m either side of
        // the whole exit run: from the shelf they stood as a pale bar behind the pheasant on his log): what lies behind him
        // from the path is the shelf's peacock water, and the bank closes the sill behind the gate's logs.
        const al = mr.range(4, 16), side = mr.range(-1, 1), sd = mr(), w = mr.range(18, 34), h = mr.range(3, 6), ac = (side < 0 ? -1 : 1) * (w / 2 + PR + 3 + Math.abs(side) * 24);
        const mx = PORTAL[0] + HEAD[0] * (al - 3) + PERP[0] * ac, mz = PORTAL[2] + HEAD[1] * (al - 3) + PERP[1] * ac;
        mA.push(mx, Math.max(0.1, lake.bedAt(mx, mz)) + 0.1, mz, sd); mS.push(w, h); i++;
      }
      const mg = new THREE.InstancedBufferGeometry();
      mg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0], 3)); mg.setIndex([0, 1, 2, 2, 1, 3]);
      mg.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(mA), 4)); mg.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(mS), 2)); mg.instanceCount = mA.length / 4;
      const lmist = new THREE.Mesh(mg, mk(LMIST_VERT, LMIST_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide }, { uMist: { value: LK.shaft ? 0.3 : LK.moon ? 0.16 : LK.low < 1 ? 0.14 : 0.13 } }));
      lmist.renderOrder = 3.5; lmist.frustumCulled = false; scene.add(lmist);
      // and the mist that stands at the sill where the west inflow spills over it, either side of the gate (never across
      // the portal itself): thicker than the lake's, and side-lit like it
      {
        const sr = makeRng(hashSeed('lakes-sillmist:' + ctx.seed)), sA = [], sS = [], SX = PORTAL[0] - HEAD[0] * 3, SZ = PORTAL[2] - HEAD[1] * 3;
        for (let i = 0; i < 10; i++) { const ac = (i % 2 ? 1 : -1) * sr.range(10.5, 24), al = sr.range(-2.5, 4); sA.push(SX + PERP[0] * ac + HEAD[0] * al, 0.25, SZ + PERP[1] * ac + HEAD[1] * al, sr()); sS.push(sr.range(9, 15), sr.range(3.2, 5.6)); }
        const sg = new THREE.InstancedBufferGeometry();
        sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0], 3)); sg.setIndex([0, 1, 2, 2, 1, 3]);
        sg.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(sA), 4)); sg.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(sS), 2)); sg.instanceCount = sA.length / 4;
        const smist = new THREE.Mesh(sg, mk(LMIST_VERT, LMIST_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide }, { uMist: { value: LK.moon ? 0.3 : 0.5 } }));
        smist.renderOrder = 3.5; smist.frustumCulled = false; scene.add(smist);
      }
      await ctx.yield();
      // the mist bank across pass one (far sheet first)
      const kp = [], ku = [], ks = [], ki = [], NK = 11;
      for (let k = 0; k < NK; k++) {
        const z = 16 + 6 * k + mr.range(-1.2, 1.2), sd = mr(), b0 = k * 4;
        kp.push(AX - 78, 0, z, AX + 78, 0, z, AX - 78, 20, z, AX + 78, 20, z); ku.push(-1, 0, 1, 0, -1, 1, 1, 1); ks.push(sd, sd, sd, sd); ki.push(b0, b0 + 1, b0 + 2, b0 + 2, b0 + 1, b0 + 3);
      }
      const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); kg.setAttribute('uv', new THREE.Float32BufferAttribute(ku, 2)); kg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ks, 1)); kg.setIndex(ki);
      const mbank = new THREE.Mesh(kg, mk(MBANK_VERT, MBANK_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide },
        { uBankK: { value: LK.shaft ? 1 : lookName === 'dawn' ? 0.9 : LK.moon ? 0.55 : LK.snow ? 0.6 : 0.5 }, uBeam: { value: new THREE.Vector4(sunDir.x / sunXZ, sunDir.z / sunXZ, Math.min(sunXZ, 0.848), Math.max(sunDir.y, 0.53)) } }));   // (the shafts are drawn no flatter than 32 degrees, so a low sun's still read as shafts)
      mbank.renderOrder = 3.4; mbank.frustumCulled = false; scene.add(mbank);
    }
    await ctx.yield();
    if (lookName === 'dawn') {                                           // smoke-mist lying on both lakes
      set.add(fx.makeMist({ rng: rng.fork('smoke1'), count: 80, area: [360, 2.5, 380], center: [45, 1.6, 30], size: [18, 40], color: mistCol, opacity: 0.15, drift: [0.5, 0, 0.9], time }));
      set.add(fx.makeMist({ rng: rng.fork('smoke2'), count: 40, area: [180, 2.5, 260], center: [-80, LL + 1.6, 480], size: [16, 34], color: mistCol, opacity: 0.2, drift: [0.4, 0, 0.7], time }));
      await ctx.yield();
    }
    if (LK.snow) set.add(fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', count: Math.round(2000 * detail), size: [0.035, 0.09], time }));
    set.add(fx.makeParticles({ rng: rng.fork('leaffall'), preset: 'leaves', count: Math.round(420 * detail * LK.leaves), colors: ['#e3a82b', '#c8421a', '#f0c44a'], time }));
    await ctx.yield();

    // --- own plants near the path: willow scrub, the arching birches, spruce on the lip, reeds, far crowns on the slopes ---
    const plantMat = mk(PLANT_VERT, PLANT_FRAG, { side: THREE.DoubleSide });
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S3 = new THREE.Vector3();
    const inst = (geo, list, mat = plantMat) => {                        // list of [x, y, z, yaw, sxz, sy, colour]
      const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); m.count = list.length;
      list.forEach((o, i) => { E.set(0, o[3], 0); Q.setFromEuler(E); V.set(o[0], o[1], o[2]); S3.set(o[4], o[5], o[4]); m.setMatrixAt(i, M4.compose(V, Q, S3)); m.setColorAt(i, o[6]); });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.frustumCulled = false; scene.add(m); return m;
    };
    const prng = rng.fork('plants'), grey = (k, w = 0) => new THREE.Color(k * (1 + w), k, k * (1 - w));
    const gold = late ? P4.clone().lerp(hex('#b7791f'), 0.35) : P4, wl = [];
    // (the willows' own stream, 'lakes-willows': how many numbers this loop takes depends on the ground it tests, the lip
    // among it, so it deals from a stream of its own and what the plants' stream deals after it does not move with the lip)
    const wr = makeRng(hashSeed('lakes-willows:' + ctx.seed));
    for (let t = 0, n = Math.round(70 + 12 * dens); t < 6000 && wl.length < n; t++) {
      const row = wl.length < 36, z = row ? wr.range(254, 318) : wr.range(246, 333), x = AX + (row ? (wl.length % 2 ? 1 : -1) : wr.sign()) * (row ? wr.range(8.3, 10.6) : wr.range(10.5, 20));
      if (wl.some((o) => (o[0] - x) * (o[0] - x) + (o[2] - z) * (o[2] - z) < (row ? 5 : 7))) continue;
      if (row && Math.abs(z - BZ) < 3.5) continue;
      const y = ground(x, z); if (gi.t > 0.02) continue;
      const s = row ? wr.range(0.95, 1.4) : wr.range(0.75, 1.25); wl.push([x, y - 0.12, z, wr() * 6.283, s, s * wr.range(0.85, 1.15), grey(wr.range(0.8, 1.2), wr.range(-0.08, 0.08))]);
    }
    const wNear = wl.slice(0, 36), wFar = wl.slice(36).filter((o, r) => r % 4 !== 2),   // (one far willow in four pays for the island's)
       wA = hex(late ? '#c9a738' : '#b9b43a'), wB = hex(late ? '#a58a2c' : '#8a9a2e');
    // willow clumps rooted on the ledges of the face, the water running round them (own random stream: nothing seeded shifts)
    const er = makeRng(hashSeed('lakes-laid:' + ctx.seed)), ledgeAt = (g, dx, dt) => { const x = g[0] + dx, z = lipZ(x) + 9 * (g[1] - 0.045 + dt); return [x, ground(x, z), z]; };
    LEDGE.forEach((g, i) => {
      if (i % 3 === 2) return;
      for (let q = 0; q < 2; q++) { const p = ledgeAt(g, (q ? 1 : -1) * er.range(0.5, 1.3), er.range(-0.01, 0.01)), sc = er.range(0.95, 1.3); wFar.push([p[0], p[1] - 0.3, p[2], er() * 6.283, sc, sc * er.range(0.9, 1.1), grey(er.range(0.85, 1.2), er.range(-0.06, 0.06))]); }
    });
    // the island in the top lake (the hero's mound; anchors.island): willow scrub and reeds round its rim, two spruces, and
    // its living trees, three gold birches and four scarlet maples (own random stream)
    const ISL = hero.anchors.island, ir = makeRng(hashSeed('lakes-island:' + ctx.seed));
    for (let q = 0; q < 5; q++) { const an = (q + ir.range(-0.3, 0.3)) / 5 * 6.283, r = ISL.r * ir.range(0.72, 0.9), x = ISL.x + Math.cos(an) * r, z = ISL.z + Math.sin(an) * r, sc = ir.range(0.55, 0.85); wFar.push([x, ISL.heightAt(x, z) - 0.1, z, ir() * 6.283, sc, sc * ir.range(0.9, 1.1), grey(ir.range(0.9, 1.25), ir.range(-0.04, 0.08))]); }
    await ctx.yield();
    fallSide.push(inst(willowGeo(prng, wA, wB, true), wNear)); await ctx.yield(); inst(willowGeo(prng, wA, wB, false), wFar);
    await ctx.yield();
    const bGeo = birchGeo(prng, gold, P4.clone().lerp(hex('#f2d15a'), 0.6), late ? hex('#a4671e') : hex('#9aa53a'), late ? 0.62 : 1), bl = [];
    await ctx.yield();
    const bY = Math.max(0, ground(AX - 11.5, BZ));
    // (the two at the crossing are the monkeys' own trees, built below from their own stream)
    const mtr = makeRng(hashSeed('lakes-monkeytree:' + ctx.seed)), mtGeo = await monkeyTreeGeo(mtr, gold, P4.clone().lerp(hex('#f2d15a'), 0.6), late ? hex('#b06a1e') : hex('#9aa53a'), ctx.yield);
    fallSide.push(inst(mtGeo, [[AX - 11.5, bY, BZ, 0, 1, 1, grey(1)], [AX + 11.5, bY, BZ, Math.PI, 1, 1, grey(0.95, 0.04)]]));
    await ctx.yield();
    for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, z = 269 + i * 7.2 + prng.range(-1.5, 1.5), x = AX + sd * prng.range(12, 13.5), s = prng.range(0.8, 0.98); bl.push([x, ground(x, z) - 0.1, z, (sd > 0 ? Math.PI : 0) + prng.range(-0.35, 0.35), s, s, grey(prng.range(0.85, 1.1), prng.range(-0.05, 0.05))]); }
    fallSide.push(inst(bGeo, bl));
    await ctx.yield();
    {
      // (their own variant of the plant shader: leaf cards cut into small leaves, and a tone that follows the hour.
      // LK.isle: tint of the toned leaf, how far it is toned, its brightness, how much direct light it takes, the gold rim)
      const IT = LK.isle || [1, 1, 1, 0, 1, 1, 0];
      const isleMat = mk(PLANT_VERT, PLANT_FRAG, { side: THREE.DoubleSide, defines: { ISLE: 1 } }, { uIsTone: { value: new THREE.Vector4(IT[0], IT[1], IT[2], IT[3]) }, uIsLit: { value: new THREE.Vector3(IT[4], IT[5], IT[6]) } });
      const iB = [], iM = [], hot = (k, w) => new THREE.Color(k * (1 + w), k, k * (1 - w));
      for (const tr of ISL.trees) { if (tr.kind === 2) continue; const sc = tr.h / 10; (tr.kind ? iM : iB).push([tr.x, tr.y - 0.15, tr.z, -tr.out + ir.range(-0.5, 0.5), sc * ir.range(0.95, 1.1), sc, hot(ir.range(0.86, 1.04), ir.range(-0.03, 0.07))]); }
      inst(islandTreeGeo(ir, 0, [P4.clone().lerp(hex('#f6c531'), 0.5), hex('#f7dc62'), hex('#e08a1c')]), iB, isleMat);
      await ctx.yield();
      inst(islandTreeGeo(ir, 1, [P6.clone().lerp(hex('#e0401c'), 0.5), hex('#ee6a1e'), hex('#a8231a')]), iM, isleMat);
    }
    await ctx.yield();
    // (the lip's spruces: each is tested where it stands, `back` metres behind the lip at its own x, and one that would
    // stand on the fall's face is not planted and takes no more numbers; so they have their own stream, 'lakes-lipspruce')
    const lsr = makeRng(hashSeed('lakes-lipspruce:' + ctx.seed));
    const sl2 = [], spruceAt = (x, back) => { const z = lipZ(x) - back, y = ground(x, z); if (gi.t > 0.03) return; const s = lsr.range(0.8, 1.35); sl2.push([x, y - 0.2, z, lsr() * 6.283, s, s * lsr.range(0.9, 1.15), grey(lsr.range(0.8, 1.25))]); };
    for (let i = 0; i < 8; i++) { const sd = i % 2 ? 1 : -1, x = AX + sd * lsr.range(15.5, 25); spruceAt(x, lsr.range(3, 12)); }
    for (let i = 0; i < 12; i++) { const x = AX + (i % 2 ? 1 : -1) * lsr.range(30, 102); spruceAt(x, lsr.range(2.5, 6)); spruceAt(x + lsr.range(-4, 4), lsr.range(6, 11)); }
    LEDGE.forEach((g, i) => {                                          // and a small spruce on most ledges
      if (i % 3 === 0) return;
      const p = ledgeAt(g, i % 3 === 2 ? 0 : er.range(-2.2, 2.2), 0.005), sc = i % 3 === 2 ? er.range(0.55, 0.7) : er.range(0.34, 0.46);
      sl2.push([p[0], p[1] - 0.3, p[2], er() * 6.283, sc * 1.15, sc, grey(er.range(0.85, 1.2))]);
      if (i % 3 === 2) { const p2 = ledgeAt(g, er.sign() * 1.9, 0.012), s2 = er.range(0.3, 0.4); sl2.push([p2[0], p2[1] - 0.3, p2[2], er() * 6.283, s2 * 1.15, s2, grey(er.range(0.85, 1.2))]); }
    });
    for (const tr of ISL.trees) if (tr.kind === 2) { const sc = tr.h / 10; sl2.push([tr.x, tr.y - 0.2, tr.z, tr.yaw, sc * 1.1, sc, grey(ir.range(0.9, 1.25))]); }
    await ctx.yield();
    const spG = spruceGeo(prng, P5.clone().multiplyScalar(2.3), P5.clone().lerp(hex('#5f8a4a'), 0.5).multiplyScalar(1.5));
    inst(spG, sl2);
    await ctx.yield();
    // (round 11) THE DARK SPRUCE CLUMP ON THE AXIS (the brief's arrival: it splits the white curtain, the snow peak stands
    // directly above it). Ten old spruces, dark, 16-26 m tall, on the two shoulders of the slot at the lip (13.6 to
    // 21 m either side of the axis, 1.5-9 m back from the lip: world coordinates); the climb passes between their trunks.
    // Own random stream; drawn by a box of their own (fallRim, see update(): they stand over the rim).
    {
      const cr = makeRng(hashSeed('lakes-clump:' + ctx.seed)), cl = [];
      for (let i = 0; i < 10; i++) {
        const k = i >> 1, x = AX + (i % 2 ? 1 : -1) * (13.6 + k * 1.85 + cr.range(-0.5, 0.5)), z = lipZ(x) - 1.5 - (k % 3) * 3.3 - cr.range(0, 1.6), y = ground(x, z), h = cr.range(1.9, 2.6) * (1 - 0.05 * k);
        cl.push([x, y - 0.3, z, cr() * 6.283, h * 0.7, h, grey(0.5 + cr.range(0.3, 0.42) * 0.7, -0.04)]);   // (round 12: dark, not black: tint 0.71-0.79, so every crown has a lit half and a blue one; it was 0.3-0.42, a flat cut-out)
      }
      fallRim.push(inst(spG, cl));
    }
    await ctx.yield();
    // travertine knobs that really break the sheet beside and under the path, each with a collar and a tail of foam
    // (their own stream, 'lakes-knobs': a knob is taken where the sheet of water lies over the ground as it is)
    const kl = [], kI = [], nKn = Math.round(250 * (0.6 + 0.4 * detail)), knr = makeRng(hashSeed('lakes-knobs:' + ctx.seed));
    for (let t = 0, cx = 0, cz = 0; t < 4000 && kl.length < nKn; t++) {
      if ((t & 127) === 127) await ctx.yield();
      if (t % 5 === 0) { cx = AX + knr.range(-8.5, 8.5); cz = knr.chance(0.34) ? knr.range(248.5, 262) : knr.range(260, 331); }
      const x = cx + knr.gauss() * 1.5, z = cz + knr.gauss() * 2.2, r = knr.range(0.22, 0.5) * (knr.chance(0.15) ? 1.5 : 1); if (Math.abs(x - AX) > 10.5 || z < 247.5 || z > 333) continue;
      if (kl.some((o) => (o[0] - x) * (o[0] - x) + (o[2] - z) * (o[2] - z) < (o[4] + r) * (o[4] + r) * 1.5)) continue;
      const y = ground(x, z); if (gi.t > 0.02 || gi.film < 0.5) continue;
      const mossy = knr.chance(0.22); kl.push([x, y, z, knr() * 6.283, r, r * knr.range(0.7, 1.25), mossy ? new THREE.Color(0.62, 0.86, 0.42).multiplyScalar(knr.range(0.8, 1.1)) : grey(knr.range(0.85, 1.15), knr.range(0, 0.06))]); kI.push(x, y, z, r);
    }
    await ctx.yield();
    fallSide.push(inst(knobGeo(er, P3.clone().multiplyScalar(0.66), new THREE.Color(P3.r * 0.36, P3.g * 0.28, P3.b * 0.16)), kl));
    const kq = new THREE.InstancedBufferGeometry();
    kq.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0, 1, 0.5, 0, 1], 3)); kq.setIndex([0, 2, 1, 1, 2, 3]);
    kq.setAttribute('iK', new THREE.InstancedBufferAttribute(new Float32Array(kI), 4)); kq.instanceCount = kI.length / 4;
    const kFoam = new THREE.Mesh(kq, mk(KNOB_VERT, KNOB_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
    kFoam.renderOrder = 1; kFoam.frustumCulled = false; scene.add(kFoam);
    await ctx.yield();
    const rl = [];
    for (let t = 0; t < 6000 && rl.length < 310; t++) {
      if ((t & 127) === 127) await ctx.yield();
      const x = AX + prng.range(-64, 124) * (t % 5 ? -1 : 1) - (t % 5 ? 0 : 0), z = prng.range(384, 566), sd = sdLow(x, z);
      if (sd < -3.5 || sd > 1.5 || Math.abs(x - AX) < 26) continue;
      const s = prng.range(0.8, 1.35); rl.push([x, Math.max(ground(x, z), LL - 0.3), z, prng() * 6.283, s, s, grey(prng.range(0.8, 1.2))]);
    }
    { let w = 0; for (let r = 0; r < rl.length; r++) if (r % 4 !== 3) rl[w++] = rl[r]; rl.length = w; }                 // (one tuft in four pays for the monkeys' birches)
    for (let q = 0; q < 16; q++) { const an = ir() * 6.283, r = ISL.r * ir.range(0.86, 1.03), x = ISL.x + Math.cos(an) * r, z = ISL.z + Math.sin(an) * r, sc = ir.range(0.6, 1.0); rl.push([x, Math.max(ISL.heightAt(x, z), 0) - 0.05, z, ir() * 6.283, sc, sc, grey(ir.range(0.85, 1.2))]); }
    await ctx.yield();
    inst(reedGeo(prng, P4.clone().multiplyScalar(0.45), P4.clone().lerp(hex('#f0d28a'), 0.3)), rl);
    await ctx.yield();
    const conL = [], blobL = [], blob2L = [], scar = late ? P6.clone().multiplyScalar(0.8) : P6, olive = hex('#7c8a2e');
    // every far crown takes its kind and colour from the stand it grows in (the same field the land shader paints the
    // canopy with), so drifts of gold and scarlet are made of gold and scarlet trees and the spruce mass of spruce
    // (rr: the stream a crown is dealt from)
    const crownAt = (rr, x, y, z, alt, big, light, sink, keepDark) => {
      const st = standAt(x, y, z, alt, late ? 1 : 0), pr = rr(), broad = !keepDark && st.aut > 0.4 && pr < 0.06 + 0.9 * st.aut, k2 = rr();   // no stray gold crowns out in the spruce
      if (broad) { const h = rr.range(10, 16) * big, c = k2 < 0.1 ? olive : k2 < 0.1 + 0.9 * st.scar ? scar : gold; (light ? blob2L : blobL).push([x, y - 0.5 - sink * h, z, rr() * 6.283, h * rr.range(0.8, 1.15), h, c.clone().multiplyScalar(rr.range(0.42, 0.74))]); }
      else { const h = rr.range(13, 23) * big, lar = st.larch > 0.5 && rr() < 0.4; conL.push([x, y - 0.5 - sink * h, z, rr() * 6.283, h * rr.range(0.4, 0.56), h, lar ? gold.clone().multiplyScalar(rr.range(0.45, 0.7)) : P5.clone().multiplyScalar(rr.range(1.3, 2.4))]); }
    };
    // the valley floor: a standing wall of crowns behind the kit trees, densest at the shore, round both lakes
    // (its own stream, 'lakes-belt': a place is taken or passed over by the ground as it is: the land's rise, the
    // travertine of the fall and the shoal, the distance from the water of either lake)
    const nBelt = Math.round(800 * (0.55 + 0.45 * detail)), br = makeRng(hashSeed('lakes-belt:' + ctx.seed));
    for (let t = 0, n = 0; t < nBelt * 10 && n < nBelt; t++) {
      if ((t & 63) === 0) await ctx.yield();
      const low = t % 5 === 0, x = low ? br.range(-340, 160) : br.range(-340, 430), z = low ? br.range(335, 650) : br.range(-430, 335), y = ground(x, z), sh = gi.sh, alt = gi.alt;
      if (gi.rise > 45 || gi.trav > 0.05 || sh < 22 || sh > 240 || br() > 1.12 - sh / 240) continue;
      const pd = path.nearestXZ(x, z).dist; if (pd < 52) continue;
      crownAt(br, x, y, z, alt, 1, pd > 230, 0, pd <= 72 || Math.hypot(x - PORTAL[0], z - PORTAL[2]) < 90); n++;
    }
    // the foot of the slopes: a standing rank of crowns on the lowest 150 m, densest low down, most of them on the west
    // slope that pass two looks across the lake at, sunk a third into the canopy the land shader paints
    // the slopes: crowns in clumps (a stand of six to ten together, ragged, big and small), never single cones dotted over the wall
    // (round 13: sunk 0.45 of their height into the painted canopy; driftC keeps each stand's place: the 'drifts' fork, taken
    // last of all, adds six crowns to every stand, so each is a drift of ten or more)
    const driftC = [];
    const nSl = Math.round(520 * (0.6 + 0.4 * detail));
    for (let t = 0, n = 0; t < nSl && n < nSl; t++) {
      if ((t & 7) === 0) await ctx.yield();
      const west = t % 10 < 7, z0 = west ? prng.range(-470, 290) : prng.range(-330, 520), dd = 24 + 230 * Math.pow(prng(), 1.3), m = prng.int(6, 10), R = prng.range(7, 15); let kept = 0;
      for (let q = 0; q < m; q++) {
        const z = z0 + prng.gauss() * R * 0.62, x = (west ? xc(z) + hw(z) + dd : xc(z) - hw(z) - dd) + prng.gauss() * R * 0.5, y = ground(x, z), alt = gi.rise;
        if (alt > 230 || alt < 4 || gi.trav > 0.05) continue;
        crownAt(prng, x, y, z, gi.alt, prng.range(0.85, 1.3), true, 0.45, true); n++; kept++;
      }
      if (kept) driftC.push([west, z0, dd, R]);
    }
    await ctx.yield();
    for (const L of [blob2L, conL, blobL]) { let w = 0; for (let r = 0; r < L.length; r++) if (r % 7 !== 6 && r % 7 !== 3) L[w++] = L[r]; L.length = w; }   // two crowns in seven pay for the stair, the veils' foot, the trunks by the gate and the monkeys' birches
    inst(blobGeo(prng, 2), blob2L); await ctx.yield();
    inst(coneGeo(prng), conL); await ctx.yield(); inst(blobGeo(prng), blobL);
    await ctx.yield();

    // --- the standing forest (kit trees, never nearer than 20 m to the path) ---
    const frng = rng.fork('forest'), wind = flora.makeWind({ direction: [0.5, 0.85], strength: 0.9 }), fopt = { wind };
    if (flora.prepareLeafTexture) await flora.prepareLeafTexture(fopt, ctx.yield);   // the leaf atlas, drawn in short steps (guarded: an older kit copy has no such function)
    await ctx.yield();
    const fmat = flora.windMaterial(fopt);                          // kit: flora.windMaterial, alone between two yields
    await ctx.yield();
    const treeOpt = async (d) => {
      const b = flora.birchGeometry({ rng: frng, detail: d, autumn: true, height: 14, fullness: late ? 0.6 : 1 }); await ctx.yield();
      const m = flora.mapleGeometry({ rng: frng, detail: d, height: 12 }); await ctx.yield();
      const c = flora.coniferGeometry({ rng: frng, detail: d, height: 19, snow: LK.snow * 0.45, leaf: '#24513a', leafLight: '#5a865c', leafDark: '#102a1e' }); await ctx.yield();
      return [b, m, c];
    };
    const nearV = await treeOpt(1), farV = await treeOpt(0);
    const tpts = [], SX = PORTAL[0] - HEAD[0] * 3, SZ = PORTAL[2] - HEAD[1] * 3;
    const tree = (x, z, conifer, rr = frng) => {                    // (rr: the stream the tree is dealt from)
      const n = path.nearestXZ(x, z); if (n.dist < 20) return;
      if (tpts.some((p) => (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < 16)) return;
      const k = rr(), v = k < conifer ? 2 : k < conifer + (1 - conifer) * 0.68 ? 0 : 1;
      tpts.push({ x, y: ground(x, z), z, s: rr.range(0.85, 1.35), rot: rr() * 6.283, d: n.dist, u: n.u, v });
    };
    const nRing = Math.round(118 + 34 * dens);
    for (let t = 0; t < 6000 && tpts.length < nRing; t++) {
      const x = frng.range(-200, 290), z = frng.range(-225, 241), s = lake.sdf(x, z); if (s < 5 || s > 44 || frng() > 1.15 - s / 44) continue;
      const ac = (x - SX) * PERP[0] + (z - SZ) * PERP[1], al = (x - SX) * HEAD[0] + (z - SZ) * HEAD[1];
      if ((Math.abs(ac) < 26 && al > -8) || (Math.abs(x - AX) < 17 && z > 205)) continue;
      tree(x, z, Math.hypot(x - PORTAL[0], z - PORTAL[2]) < 75 ? 0.8 : s > 20 ? 0.62 : 0.32);
      if ((t & 255) === 0) await ctx.yield();
    }
    // (the trees beside the shoal and those round the lower lake are taken or passed over by the ground as it is (the
    // fall's face, the sheet of water, the lake's edge): each of the two loops deals from a stream of its own,
    // 'lakes-shoaltrees' and 'lakes-lowtrees', and the forest's stream goes on from the ring round the top lake)
    const str = makeRng(hashSeed('lakes-shoaltrees:' + ctx.seed)), ltr = makeRng(hashSeed('lakes-lowtrees:' + ctx.seed));
    for (let t = 0; t < 1500 && tpts.length < nRing + 60; t++) {
      if ((t & 127) === 0) await ctx.yield();
      const x = AX + str.sign() * str.range(21, 118), z = str.range(243, 333); ground(x, z); if (gi.t > 0.02 || (gi.film > 0.5 && str() < 0.6)) continue;
      tree(x, z, 0.3, str);
    }
    for (let t = 0; t < 2500 && tpts.length < nRing + 94; t++) {
      if ((t & 127) === 0) await ctx.yield();
      const x = ltr.range(-300, 110), z = ltr.range(346, 562); if (sdLow(x, z) < 5) continue; ground(x, z); if (gi.t > 0.02 && gi.t < 0.98) continue;
      tree(x, z, 0.45, ltr);
    }
    { const far = tpts.map((q, r) => [q.d, r]).sort((a2, b2) => b2[0] - a2[0]).slice(0, 84).filter((q, r) => r % 2 === 0).map((q) => q[1]).sort((a2, b2) => b2 - a2); for (const r of far) tpts.splice(r, 1); }   // (and every other one of the 84 trees farthest from the path: they pay for the island's trees and the arch)
    await ctx.yield();
    const lowSun = LK.low < 1;
    await ctx.yield();
    // kit: flora.makeScatter, alone between two yields (it reads 50-65 ms)
    const forest = flora.makeScatter({ rng: frng, points: tpts, variants: nearV, farVariants: farV, farDistance: 42, material: fmat, chunks: 3, cullDistance: 900, sink: 0.02, heightAt: ground, groundShadow: { sunDir, strength: lowSun ? 0.25 : 0.45 } });
    scene.add(forest.object);
    await ctx.yield();
    const bpts = [];
    for (let t = 0; t < 3000 && bpts.length < 46; t++) {
      if ((t & 127) === 127) await ctx.yield();
      const x = frng.range(-200, 290), z = frng.range(-225, 241), s = lake.sdf(x, z), n = s > 2 && s < 13 ? path.nearestXZ(x, z) : null;
      if (n && n.dist > 22 && !(Math.abs(x - AX) < 17 && z > 205)) bpts.push({ x, y: ground(x, z), z, s: frng.range(0.24, 0.34), rot: frng() * 6.283, d: n.dist, u: n.u, v: 0 });
    }
    if (bpts.length > 30) bpts.length = 30;
    await ctx.yield();
    const bamG = flora.bambooGeometry({ rng: frng, detail: 0, stalk: '#9fb04a', leaf: '#8fae3e' });
    await ctx.yield();
    const bamboo = flora.makeScatter({ rng: frng, points: bpts, variants: [bamG], material: fmat, sink: 0.02, tint: 0.2 });
    scene.add(bamboo.object);
    await ctx.yield();

    // --- creatures ---
    const light = F.lightFrom(scene), cMats = [];
    const creature = (base, n, deform, o = {}) => {
      const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iT = new Float32Array(n * 3).fill(1);
      const g = F.instancedGeo(base, n, iA, iB, iT); g.attributes.iA.setUsage(THREE.DynamicDrawUsage); g.attributes.iB.setUsage(THREE.DynamicDrawUsage);
      const m = F.creatureMaterial({ instanced: true, upright: true, pre: GL_POSE, traj: GL_TRAJ, deform, light, rim: 0.3, ...o });
      const mesh = F.creatureMesh(g, m, 0); scene.add(mesh); cMats.push(m);
      return { iA, iB, iT, g, m, mesh };
    };
    // mandarin ducks: 9 lead the way and land after the gust, 14 raft near the gate, 2 perch on it; 4 dippers work the fall
    const ND = 38, dk = creature(duckGeo(), ND, DUCK_DEFORM, { rim: 0.35 }), dW = new Float32Array(ND), drng = rng.fork('ducks'), SP = hero.anchors.standPerches || [];
    // The landing: from the gust (u 0.372) each bird swings out to the right, drops onto the water half-way through its
    // landing and planes in on its own wake, wings held high, to stop 13.5-17 m ahead of where the camera is at u 0.40 and
    // 6.5-10.5 m right of the path; at u 0.40 they are skiing 11-14 m ahead, and the camera passes them at u 0.415-0.42.
    const DOFF = [0, 0.3, 1.7, 2.1, 3.5, 3.8, 5.2, 5.6, 7.1], LATF = [6.5, 7.6, 9.4, 8.2, 10.3, 7.1, 9.0, 10.5, 8.5], dLat = [], dH = [], sG = UG * L, DUK = 0.034, DST = 0.0006, M0 = DUK * L, M1 = 1.2;
    const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pT = new THREE.Vector3(), v2 = new THREE.Vector2();
    for (let i = 0; i < 9; i++) { dLat.push((i % 2 ? 1 : -1) * (0.55 + 0.5 * DOFF[i])); dH.push(-0.5 + 0.12 * DOFF[i]); }
    await ctx.yield();
    const duckAt = (i, u, out) => {
      const u0 = UG + DST * i, k = (u - u0) / DUK, kc = clamp(k, 0, 1), k2 = kc * kc, k3 = k2 * kc;
      const G = (0.4 - u0) * L + 13.5 + 0.5 * DOFF[i] - 6.5 - DOFF[i];
      const g = k <= 0 ? (u - UG) * L : (u0 - UG) * L + (k3 - 2 * k2 + kc) * M0 + (3 * k2 - 2 * k3) * G + (k3 - k2) * M1 + Math.max(0, k - 1) * M1;
      const s = sG + 6.5 + DOFF[i] + g, e = smoothstep(0.25, 1, kc);                 // the swing to the right comes late, so they ski in three-quarter view, sails showing
      path.posAtDist(s, out); path.tangentAtDist(s, pT);
      const aside = smoothstep(0.27, 0.3, u) * (1 - smoothstep(0.352, 0.37, u));          // (u 0.29-0.36: they keep to the left and low, dark against the bright water, clear of the far stand and its image)
      const hl = Math.hypot(pT.x, pT.z) || 1, lat = lerp(dLat[i], LATF[i], e) - 5.2 * aside, fl = 1 - smoothstep(0.04, 0.5, kc);
      out.x -= pT.z / hl * lat; out.z += pT.x / hl * lat; out.y = lerp(0.03, out.y + dH[i] - (0.35 + 0.25 * dH[i]) * aside, fl);
      return k;
    };
    const flightAt = (k, u, t, out) => {
      const off = smoothstep(0.775, 0.875, u), sd = u * L + 15 + 3.3 * k + 0.5 * L * 0.04 * Math.log(1 + Math.exp((0.5 - u) / 0.04)) + 30 * off, lat = F2L[k] + 52 * off * off;   // (at half the camera's speed until it has caught them up)
      path.posAtDist(sd, out); path.tangentAtDist(sd, pT);
      const hl = Math.hypot(pT.x, pT.z) || 1;
      out.x -= pT.z / hl * lat; out.z += pT.x / hl * lat; out.y = Math.max(out.y + F2H[k] + 4 * off, 1.0) + 0.14 * Math.sin(t * 1.9 + k * 2.3);
    };
    const rX = new Float32Array(ND), rZ = new Float32Array(ND), rP = new Float32Array(ND), RAFT = [[135.6, -56], [175.3, -126.7]], F2L = [-2.8, 2.4, -0.7, 3.9], F2H = [-0.5, -1.3, -1.9, -0.9];
    for (let i = 0; i < ND; i++) {
      const j = i * 4, hen = i % 3 === 2, dip = i >= 25 && i < 29; rP[i] = drng() * 6.283;
      dk.iB[j] = dip ? 0.75 : i < 9 || i >= 34 ? 2.05 : i === 23 || i === 24 ? 3.5 : i >= 29 ? (i - 29 < SP.length ? 2.9 : 0) : 1.45;
      if (i >= 29 && i < 34 && i - 29 < SP.length) {                       // mandarins roosting on the standing trunks, turned three-quarters to the path
        const q = SP[i - 29], n = path.pointAt(path.nearestXZ(q.x, q.z).u, pA);
        dk.iA.set([q.x, q.y + 0.3, q.z, Math.atan2(n.x - q.x, n.z - q.z) + (i % 2 ? 1.1 : -1.1)], j);
      }
      if (dip) dk.iT.set([0.2, 0.18, 0.17], i * 3); else if (hen) dk.iT.set([0.62, 0.58, 0.55], i * 3);
      if (i >= 9 && i < 23) {
        const c = RAFT[i < 16 ? 0 : 1]; let x = c[0], z = c[1];
        for (let t = 0; t < 60; t++) {
          x = c[0] + drng.range(-7, 7); z = c[1] + drng.range(-7, 7); let ok = lake.sdf(x, z) < -2.5 && path.nearestXZ(x, z).dist > 7.5;
          for (let q = 9; q < i && ok; q++) if (Math.hypot(rX[q] - x, rZ[q] - z) < 1.3) ok = false;
          if (ok) break;
        }
        rX[i] = x; rZ[i] = z; dW[i] = 0.2;
      } else if (i === 23 || i === 24) {
        const p = hero.anchors.duckPerches[i - 23];
        dk.iA.set([p.x, p.y + 0.36, p.z, Math.atan2(-HEAD[0], -HEAD[1]) + (i === 23 ? 0.75 : -0.75)], j);
      } else if (i === 25 || i === 26) {
        const x = AX + (i === 25 ? -7.6 : 8.2), z = i === 25 ? 291 : 302; dk.iA.set([x, ground(x, z) + 0.13, z, i === 25 ? 1.9 : -2.3], j);
      }
      await ctx.yield();
    }
    const wq = new THREE.InstancedBufferGeometry();
    wq.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0, 1, 0.5, 0, 1], 3)); wq.setIndex([0, 2, 1, 1, 2, 3]);
    wq.setAttribute('iA', dk.g.attributes.iA); const iW = new THREE.InstancedBufferAttribute(dW, 1); iW.setUsage(THREE.DynamicDrawUsage); wq.setAttribute('iW', iW); wq.instanceCount = 23;
    const wake = new THREE.Mesh(wq, mk(WAKE_VERT, WAKE_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide }));
    wake.renderOrder = 4; wake.frustumCulled = false; scene.add(wake);
    await ctx.yield();

    // golden monkeys in the two arching birches. Most sit on the stout boughs, upright, turned to watch us come; four cross
    // the 5.8 m gap one after another (in the air at u 0.208-0.228, 0.226-0.246, 0.243-0.263 and 0.2485-0.2685): each stands up, runs out
    // along its bough, leaps, lands on all fours and sits down again on the far side.
    const NM = Math.round(5 + 3 * dens), mo = creature(monkeyGeo(), NM, MONKEY_DEFORM, { rim: 0.6, fill: 0.36, back: 0.8 }), mrng = rng.fork('monkeys');
    const MS = 1.9, MDU = 0.02, MPRE = 0.012, MPOST = 0.012, SL = mtGeo.userData.slots;
    const seatW = (side, i) => (side ? [AX + 11.5 - SL[i][0], bY + SL[i][1], BZ - SL[i][2]] : [AX - 11.5 + SL[i][0], bY + SL[i][1], BZ + SL[i][2]]);
    // leapers: [seat before, take-off, landing, seat after, u of the leap]; sitters: [seat, side]
    // (round 10: a fourth follows on the low boughs. The second, once landed, runs on in along its bough; the fourth runs out
    // to the tip the second left, and is in the air at u 0.2485-0.2685 with the third, the lens passing beneath at 0.265)
    const LEAP = [[seatW(0, 0), seatW(0, 0), seatW(1, 0), seatW(1, 2), 0.208], [seatW(0, 1), seatW(0, 1), seatW(1, 1), seatW(1, 3), 0.226], [seatW(0, 2), seatW(0, 0), seatW(1, 0), seatW(1, 0), 0.243], [seatW(0, 3), seatW(0, 1), seatW(1, 1), seatW(1, 1), 0.2485]], NL = LEAP.length;
    const SIT = [[4, 1], [4, 0], [5, 0], [5, 1]], POSE = [0.66, 0, 0.7, 1], SY = mtGeo.userData.yaws, mSc = [];
    const sO = [], sV = [];
    for (let j = 0; j < NM; j++) {
      const o = j * 4, sc = MS * mrng.range(0.9, 1.06) * (j === 6 ? 0.72 : 1); mSc.push(sc);
      mo.iB[o] = sc;
      if (j >= NL) {                                                   // three poses among the sitters: on all fours along the bough, hunched, upright
        const [si, side] = SIT[j - NL], q = seatW(side, si), pose = POSE[j - NL], yw = (side ? -1 : 1) * mrng.range(0.3, 0.7);
        mo.iA.set([q[0], q[1] + sc * lerp(0.46, 0.09, pose), q[2], pose < 0.1 ? SY[si] + (side ? Math.PI : 0) : pose < 0.9 ? yw * 1.6 : yw], o); mo.iB[o + 3] = pose; continue;
      }
      const A = LEAP[j][1], B = LEAP[j][2], t0 = LEAP[j][4];
      for (let q = 0; q < 20; q++) {                                   // leaves shaken loose where it jumps and where it lands
        const P = q < 7 ? A : B; sO.push(P[0] + mrng.range(-0.8, 0.8), P[1] + 0.3 + mrng.range(-0.5, 0.6), P[2] + mrng.range(-0.8, 0.8), q < 7 ? t0 + 0.001 : t0 + MDU);
        sV.push(mrng.range(-1, 1), mrng.range(0.4, 1.6), mrng.range(-1, 1), 0);
      }
    }
    await ctx.yield();
    // The golden pheasant on his mossy log (a blue eared pheasant when the snow has come), near life size: 1.8 m with his tail
    // (PS 1.5), 7 m right of the path, passed abeam at the journey's u 0.885 (the hero sets his log from that beat). He
    // stands side-on to the lens as it comes up the shelf. His feet are fixed to the log; only the body above the hips
    // moves: the cape fans open as the lens nears (95 m to 45 m) and stays fanned, the head turns to follow the lens, the
    // tail sweeps. He does not fly: the last stretch belongs to the gate.
    // (round 13) HE STANDS ACROSS HIS LOG, as a bird perches: head toward the gate, tail out behind him over the water,
    // his left side square to the lens when he is 55 degrees off the bow (10 m off, the middle of the stretch in which he
    // is large: from 16 m off until he leaves the frame he is within 30 degrees of side-on, cape, body and the whole
    // barred tail in view). His axis is the path's heading at the journey's u 0.885 swung 35 degrees toward the path.
    const pHd = path.tangentAt(0.885), pTl = Math.hypot(pHd.x, pHd.z) || 1, pfx = pHd.x / pTl, pfz = pHd.z / pTl;
    const pp = hero.anchors.pheasantPerch, PS = 1.5, PY = 0.172 * PS - 0.012, pYaw = Math.atan2(pfx * 0.819 + pfz * 0.574, pfz * 0.819 - pfx * 0.574), uPz = new THREE.Vector4(0, 0, 0, 0), camV = new THREE.Vector3();
    const phz = creature(pheasantGeo(LK.snow > 0), 1, PHEASANT_DEFORM, { rim: 0.5, fill: 0.3, pattern: PHEASANT_PATTERN, defines: { PATTERN: 1 }, uniforms: { uPz: { value: uPz } } });
    if (LK.low < 1) phz.iT.fill(1.6);
    phz.iA.set([pp.position.x, pp.position.y + PY, pp.position.z, pYaw]); phz.iB.set([PS, 0, 0, 0.06]);
    await ctx.yield();
    // the rare morning: nine takin at the top of the shoal
    let herd = null;
    if (vary.rare) {
      herd = F.makeHerd({ rng: rng.fork('takin'), preset: { ...F.HERD_PRESETS.bison, h: 1.3, headLen: 0.4, horns: 0.2 }, count: 9, coat: '#c59a45', belly: '#9c7430', legs: '#4c3a26', sock: '#2f261c', accent: '#3a2c1e', horn: '#2c2620', center: [AX + 19, 0, 253], radius: 7.5, heightAt: ground, path, clear: 14, light });
      scene.add(herd.object);
    }
    await ctx.yield();

    // spray pearls over the shoal and the ramp + the monkeys' leaf showers: one instanced draw
    const srng = rng.fork('spray'), nP = Math.round(520 * (0.5 + 0.5 * detail));
    for (let i = 0; i < nP; i++) {
      const ramp = i % 3 === 0, z = ramp ? srng.range(308, 371) : srng.range(262, 334), x = AX + srng.range(-1, 1) * (ramp ? 11 : 9.5);
      const y = Math.max(ground(x, z), LL) + 0.08, vy = srng.range(1.4, 3.2) * (ramp ? 1.3 : 1);
      sO.push(x, y, z, srng()); sV.push(srng.range(-0.5, 0.5), vy, srng.range(0.3, 1.3), 2 * vy / 9.8);
    }
    const sg = new THREE.InstancedBufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); sg.setIndex([0, 1, 2, 2, 1, 3]);
    sg.setAttribute('aO', new THREE.InstancedBufferAttribute(new Float32Array(sO), 4)); sg.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(sV), 4)); sg.instanceCount = sO.length / 4;
    const sprites = new THREE.Mesh(sg, mk(SPRITE_VERT, SPRITE_FRAG, { transparent: true, depthWrite: false, premultipliedAlpha: true }, { uGold: { value: gold } }));
    sprites.renderOrder = 5; sprites.frustumCulled = false; scene.add(sprites); fallSide.push(sprites, mo.mesh);
    await ctx.yield();
    // --- (round 12) WHAT THIS ROUND SEEDS, each from a fork of its own taken here, after every fork the build already takes
    // ('rafts', 'lipleaves', 'lipmoss', in that order): nothing dealt before them moves ---
    {
      // the lower lake's long rafts: twelve streaks of leaves lying down the lake, under the nose (6-17 m long, 0.5-1.4 m wide)
      const rr = rng.fork('rafts'), rafts = [], nR = Math.round(nLeaf * 0.75);
      for (let i = 0; i < 12; i++) rafts.push([AX + rr.range(-16, 16), rr.range(372, 480), rr.range(0.5, 1.4), rr.range(6, 17)]);
      for (let i = 0; i < nR; i++) {
        const r = rafts[i % rafts.length], x = r[0] + rr.gauss() * r[2], z = r[1] + rr.gauss() * r[3], lf = [x, z, rr() * 6.283, rr.range(0.17, 0.32), rr(), rr()];
        if (z > 366 && sdLow(x, z) < -1.2) leafList.push(lf);
        if ((i & 255) === 255) await ctx.yield();
      }
      const lowLeaves = hero.makeLeaves(leafList); lowLeaves.position.y = LL; scene.add(lowLeaves); fallLow.push(lowLeaves);
      await ctx.yield();
      // leaves afloat on the top lake's mirror from the crest of the shoal down the first sixty metres of pass one (the
      // journey: 'floating leaves and the tips of snags pass 6 to 8 m off'): two loose drifts 6-8 m either side of the line
      // and a thin streak along it, all on the lake's level water (on the tongue, within 6.5 m of the axis)
      const lr2 = rng.fork('lipleaves'), ll = [];
      for (let i = 0; i < 360; i++) {
        const k = i % 3, z = lr2.range(196, 255.5), x = AX + (k === 2 ? lr2.gauss() * 1.6 : (k ? 1 : -1) * ((z > 232 ? 4.2 : 7) + lr2.gauss() * 1.3)), lf = [x, z, lr2() * 6.283, lr2.range(0.2, 0.36), lr2(), lr2()];
        if (z > 240 ? Math.abs(x - AX) < 6.5 : lake.sdf(x, z) < -1.5) ll.push(lf);
      }
      const lipLeaves = hero.makeLeaves(ll); scene.add(lipLeaves);
      await ctx.yield();
      // THE MOSSY LIP of the fall (B4): cushions of moss with sedge standing out of them all along the lip either side of the
      // slot (13 to 104 m from the axis, 1.5 m behind the edge to 1.2 m over it), and three round the foot of each spruce of
      // the clump: the wall's top is a ragged green rim that the trees are rooted in, not a ruled edge against the sky
      const lm = rng.fork('lipmoss'), ml = [], mossLit = moss.clone().multiplyScalar(1.25), mossDk = moss.clone().lerp(P5, 0.45), sedgeC = P4.clone().lerp(hex('#a8b45a'), 0.55).multiplyScalar(0.8);
      for (let i = 0; i < 132; i++) {
        const a = 13 + (i >> 1) * 1.38 + lm.range(-0.4, 0.4), x = AX + (i % 2 ? a : -a), z = lipZ(x) + lm.range(-1.5, 1.2), sc = lm.range(0.9, 1.9);
        ml.push([x, ground(x, z) - 0.06 * sc, z, lm() * 6.283, sc, sc * lm.range(0.8, 1.3), grey(lm.range(0.85, 1.2), lm.range(-0.05, 0.05))]);
      }
      for (let i = 0; i < 10; i++) for (let q = 0; q < 3; q++) {
        const k = i >> 1, x0 = AX + (i % 2 ? 1 : -1) * (13.6 + k * 1.85), z0 = lipZ(x0) - 1.5 - (k % 3) * 3.3, an = lm() * 6.283, r = lm.range(0.7, 1.5), x = x0 + Math.cos(an) * r, z = z0 + Math.sin(an) * r, sc = lm.range(0.8, 1.4);
        ml.push([x, ground(x, z) - 0.06 * sc, z, lm() * 6.283, sc, sc * lm.range(0.8, 1.2), grey(lm.range(0.85, 1.2), lm.range(-0.05, 0.05))]);
      }
      fallLow.push(inst(lipMossGeo(lm, mossLit, mossDk, sedgeC), ml));
      await ctx.yield();
      // (round 13) THE LOWER LAKE'S RAFTS AS STREAKS ('lakerafts', a fork of its own taken here, after every other): the
      // twelve rafts above, where the leaves lie thickest, and twelve more all over the lake (anywhere on it at least 4 m
      // from its edge); each is given its lie (within 30 degrees of the lake's length), its hue and how far it wanders.
      // The lake's own paint draws them (LAKE_FRAG, uRaft): streaks 13-37 m long and 1.5-4 m wide.
      // (hand mend after round 13: this supersedes the note above) THE RAFTS ARE FEW, SHORT, AND OFF THE FLOCK'S LINE. The
      // ducks' course over the lower lake is the flight's own first leg (approach: x = AX from the entry at z 482 to the
      // slot at z 380), each bird within 4.1 m of it (dLat), its rings 2 m across. A site is taken only if the whole raft
      // (its reach to either side: its length across the line by its lie, its width, its wander) stays LANE = 8 m clear of
      // that line: the water under the flock is turquoise with its rings, and the ducks' sails are the warmest thing on it.
      //   half length 5-6 m, half width 0.9-1 m: no raft longer than 12 m or wider than 2 m (the paint is nothing beyond
      //     them), and none so small that it is a speck from the line
      //   wander 0.2-0.6 m: the windrow bends by less than its own width
      //   lie within 0.52 rad (30 degrees) of the lake's length, as before
      //   its near end at z 376 or more: beyond most of the carpet of foam at the fall's foot; where the foam or the last
      //     of the churn (to z 382) reaches a raft, the paint itself frays it (rM *= 1 - churn)
      //   its centre 4 m and both its ends 3 m inside the shore: it floats, none lies on the bank
      //   14 m between centres: two rafts of 12 m never join into one band
      // First the twelve rafts of the table above (where the strewn leaves lie thickest), each where it lies if it may lie
      // there; then sites dealt on the left and the right of the line by turns, from the lane's edge (half a metre clear of
      // it) out to 14 m beyond it, more of them near than far (the square of the deal: from the lens, 2-5 m over the
      // water, a raft 2 m wide is a streak a few pixels thick, thinner the farther off; the west shore is 40 m from the
      // line), and stepped down the lake by the golden section (0.618 of the way from z 376 to z 478, the water ahead of
      // the lens at the entry, each deal after the last: no stretch of the flight is without a raft), until there are
      // twelve (400 deals at most: about one in two is taken). The entries not in use have no width: the paint stops at
      // the first.
      const kr = rng.fork('lakerafts'), LANE = 8, sites = [], z0 = kr();
      const lies = (x, z, w, len, a, wan) => {
        const sa = Math.sin(a), ca = Math.cos(a), reach = len * Math.abs(sa) + (w + wan) * Math.abs(ca);
        if (Math.abs(x - AX) - reach < LANE || z - len * Math.abs(ca) < 376) return false;
        if (sdLow(x, z) > -4 || sdLow(x + sa * len, z + ca * len) > -3 || sdLow(x - sa * len, z - ca * len) > -3) return false;
        for (let k = 0; k < sites.length; k++) if (Math.hypot(x - sites[k][0], z - sites[k][1]) < 14) return false;
        sites.push([x, z, w, len, sa, ca, kr(), wan]); return true;
      };
      for (let i = 0; i < 12; i++) lies(rafts[i][0], rafts[i][1], kr.range(0.9, 1), clamp(rafts[i][3] * 0.5, 5, 6), kr.range(-0.52, 0.52), kr.range(0.2, 0.6));
      for (let n = 0; sites.length < 12 && n < 400; n++) {
        const w = kr.range(0.9, 1), len = kr.range(5, 6), a = kr.range(-0.52, 0.52), wan = kr.range(0.2, 0.6), k = kr();
        const off = LANE + len * Math.abs(Math.sin(a)) + (w + wan) * Math.abs(Math.cos(a)) + 0.5 + 14 * k * k;
        lies(AX + (n % 2 ? off : -off), 376 + len + (102 - len) * ((z0 + n * 0.618) % 1), w, len, a, wan);
      }
      for (let i = 0; i < 24; i++) {
        const r = sites[i];
        if (r) { uRaft[i].set(r[0], r[1], r[2], r[3]); uRaftB[i].set(r[4], r[5], r[6], r[7]); } else { uRaft[i].set(0, 0, 0, 0); uRaftB[i].set(0, 1, 0, 0); }
      }
      await ctx.yield();
      // (round 13) THE DRIFTS ON THE WALLS ('drifts', the last fork taken): six more spruce crowns round every stand on the
      // slopes, strewn as the stand itself is (within its own radius, on the wall's lowest 230 m) and sunk 0.45 of their
      // height into the painted canopy: with the stand's own crowns a drift of ten or more. Their cone is a light one
      // (two skirts of four: 8 triangles), and what they cost at the entry is paid by the top lake's floor, which is not
      // drawn while the lens is below its rim (hero.setLens).
      const dr = rng.fork('drifts'), driftL = [];
      for (let c = 0; c < driftC.length; c++) {
        const [west, z0, dd, R] = driftC[c];
        for (let q = 0; q < 6; q++) {
          const z = z0 + dr.gauss() * R * 0.62, x = (west ? xc(z) + hw(z) + dd : xc(z) - hw(z) - dd) + dr.gauss() * R * 0.5, h = dr.range(13, 23) * dr.range(0.85, 1.3), yaw = dr() * 6.283, wk = dr.range(0.4, 0.56), ck = dr.range(1.3, 2.4), y = ground(x, z);
          if (gi.rise > 230 || gi.rise < 4 || gi.trav > 0.05) continue;
          driftL.push([x, y - 0.5 - 0.45 * h, z, yaw, h * wk, h, P5.clone().multiplyScalar(ck)]);
        }
        if ((c & 7) === 7) await ctx.yield();
      }
      inst(coneGeoLite(dr), driftL);
      await ctx.yield();
    }
    // WHAT THE LENS HAS BEHIND IT IS NOT DRAWN: three boxes in world coordinates, each built here round
    // the things it holds (no place of the map is typed): the shoal's (fallSide: the near willows, the monkeys' trees and the
    // monkeys, the arching birches, the knobs, the pearls and the leaf showers), the fall's (fallLow: the stair, the lower
    // lake and its leaves, the falling water, the veils of mist, the bank of spray, the lip's moss) and that of the ten old
    // spruces on the lip (fallRim). A plain mesh and an instanced one give their own bounds; what a shader places gives the
    // places it was dealt with its reach (a veil's half width and the height it rises to; a pearl's leap and a shaken
    // leaf's fall; a monkey's seats and the top of its leap); each box is then let out 3 m all round for the sway of a crown.
    const boxOf = (list) => {
      const B = new THREE.Box3(), b = new THREE.Box3();
      for (const m of list) {
        if (m.isInstancedMesh) { m.computeBoundingBox(); b.copy(m.boundingBox); } else if (!m.geometry.isInstancedBufferGeometry) { m.geometry.computeBoundingBox(); b.copy(m.geometry.boundingBox); } else continue;
        m.updateMatrixWorld(); B.union(b.applyMatrix4(m.matrixWorld));
      }
      return B;
    };
    const boxSide = boxOf(fallSide), boxLow = boxOf(fallLow), boxRim = boxOf(fallRim);
    for (let i = 0; i < sO.length; i += 4) { boxSide.expandByPoint(V.set(sO[i], sO[i + 1] - 4, sO[i + 2])); boxSide.expandByPoint(V.set(sO[i], sO[i + 1] + 1.5, sO[i + 2])); }
    for (const Lp of LEAP) for (let q = 0; q < 4; q++) boxSide.expandByPoint(V.set(Lp[q][0], Lp[q][1] + 3.5, Lp[q][2]));
    for (const [si, side] of SIT) { const q = seatW(side, si); boxSide.expandByPoint(V.set(q[0], q[1] + 2, q[2])); }
    for (let i = 0; i < vS.length; i += 2) { const w = vS[i] / 2 + 0.8, j = i * 2; boxLow.expandByPoint(V.set(vA[j] - w, vA[j + 1], vA[j + 2] - w)); boxLow.expandByPoint(V.set(vA[j] + w, vA[j + 1] + 1.3 * vS[i + 1], vA[j + 2] + w)); }
    for (let i = 0; i < leafList.length; i++) boxLow.expandByPoint(V.set(leafList[i][0], LL, leafList[i][1]));
    boxSide.expandByScalar(3); boxLow.expandByScalar(3); boxRim.expandByScalar(3);
    // inSight(B): false while all eight corners of the box lie behind the plane of the eye (the camera's own place and
    // gaze, read in update(); nothing of u, nothing of the map)
    const inSight = (B) => {
      let nb = 0;
      for (let c = 0; c < 8; c++) {
        const x = (c & 1 ? B.max.x : B.min.x) - camV.x, y = (c & 2 ? B.max.y : B.min.y) - camV.y, z = (c & 4 ? B.max.z : B.min.z) - camV.z;
        if (x * camD.x + y * camD.y + z * camD.z <= 0) nb++;
      }
      return nb < 8;
    };
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const poiA = new THREE.Vector3(), poiB = new THREE.Vector3(), poiS = new THREE.Vector3(), poiC = new THREE.Vector3(PORTAL[0], PORTAL[1], PORTAL[2]), camD = new THREE.Vector3();
    // the route's metre where the run down across the lower lake ends and the climb up the fall begins: where the route first
    // comes level with its own lowest point on the approach
    const zLow = approach.reduce((a, q) => (q[1] < a[1] ? q : a))[2];
    let sClimb = 0; while (sClimb < L && path.posAtDist(sClimb, poiS).z > zLow) sClimb += 0.5;
    // the route's metre where the pheasant is abeam (the hero's anchor: the route's own point his log is set from)
    const sAb = path.nearestXZ(pp.abeam.x, pp.abeam.z).u * L;
    const GK = [[0.44, -100, 5, 20], [0.50, -100, 10, -2], [0.53, -100, 11, -2], [0.555, -62, 9, -36], [0.60, -31, 3.5, -37], [0.635, -10, 6, -31], [0.65, 16.5, 13, -14], [0.70, 66, 6, -30], [0.75, 105, 10, -8.5], [0.79, 133, 9, -34], [0.86, 150, 5, -52]];
    const s = smoothstep, dA = dk.g.attributes.iA, dB = dk.g.attributes.iB, mAt = mo.g.attributes.iA, mBt = mo.g.attributes.iB;
    return {
      scene, path, duration: DUR, look: lookName,
      // the lower lake and the climb a little brisk (1.1), slower under the monkeys (0.85), 1.05 on the mirror, slowest through
      // the standing trunks and round the turn (0.74 from u 0.53 to 0.76), 0.9 down the shelf to the pheasant, 1.0 through the gate
      pace: (u) => 1.1 - 0.25 * s(0.18, 0.215, u) + 0.2 * s(0.275, 0.31, u) - 0.31 * s(0.455, 0.53, u) + 0.16 * s(0.76, 0.82, u) + 0.1 * s(0.895, 0.93, u),
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 20, bank: 0.75 },
      pois: [
        // (round 11; re-hung in round 18) arrival: over the run down across the lower lake the gaze is lifted to the dark spruce
        // clump on the fall's lip and the snow peak over it; it is let go where that run ends and the climb up the fall begins
        // (sClimb, a metre of the route found from the approach's own lowest point; nothing at u 0: the engine's guard)
        { at: [AX, 3, 338], from: 0, to: sClimb / L, weight: 0.42, fade: 0.35 },
        // the stair in the slot: the gaze is drawn down onto its pools, 15 m ahead of the lens, while the camera climbs over it
        { at: (t, u) => { path.pointAt(clamp(u, 0, 1), poiS); poiS.z -= 15; poiS.y = Math.max(LL, stairY(AX, poiS.z)) + 0.5; return poiS; }, from: 0.1, to: 0.2, weight: 0.5 },
        { at: [AX, bY + 8.4, BZ], from: 0.18, to: 0.272, weight: 0.5 },
        // through the stand: the gaze is led from trunk to trunk at their own height, never down into the water, so the far
        // shore, the slopes, the side valley with its peak and the sky stay in frame over the window (keys: u, x, y, z)
        { at: (t, u) => { let i = 0; while (i < GK.length - 2 && u > GK[i + 1][0]) i++; const a = GK[i], b = GK[i + 1], k = clamp((u - a[0]) / (b[0] - a[0]), 0, 1); return poiA.set(lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)); }, from: 0.44, to: 0.86, weight: 0.6, fade: 0.2 },
        // the pheasant as it comes up ahead on the right, then on to the gate. It is the site's own look, carried with the bird:
        // each of its four marks keeps the site's distance, in metres of route, from the point where he is abeam (sAb). The look
        // opens 83.5 m before that point, the hand-over to the gate begins 3.6 m before it and is done 11.7 m after it, and the
        // look closes 60.1 m after it (on the site these were 0.8, 0.889, 0.906 and 0.96 of the same 897.65 m, his abeam at 0.893)
        { at: (t, u) => poiB.set(pp.position.x, pp.position.y + 0.5, pp.position.z).lerp(poiC, s(sAb - 3.6, sAb + 11.7, u * L)), from: (sAb - 83.5) / L, to: (sAb + 60.1) / L, weight: 0.6 },
      ],
      portal: { shape: 'circle', radius: PR, color: '#bfe6ff', glow: 1, tilt: true },
      post: { exposure: LK.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.05, tint: LK.tint, shadowTint: '#04121a', vignette: 0.3, grain: 0.02 } },
      ride: 'none',
      update(dt, t, camera, u) {
        U.uTime.value = t; U.uU.value = u; time.value = t;
        ctx.renderer.getDrawingBufferSize(v2); U.uResY.value = v2.y;
        // What the lens cannot see is not drawn; every rule is of the lens's own place and gaze (none of u, none of the map):
        //   the shoal's things (fallSide), the fall's (fallLow: its face's water, the slot's stair, the lower lake, the mist,
        //     the lip's moss) and the ten old spruces on the lip (fallRim): each by its own box (built round the things at
        //     the end of the build): not drawn while every corner of the box is behind the plane of the eye (inSight).
        //     Coming up the fall and the shoal each box goes behind the eye as the lens passes the last thing in it; on
        //     the turn and the arc back the boxes lie ahead of the eye again and are drawn.
        //   the hero's sunk wood and carp: hero.setLens
        camera.getWorldPosition(camV); camera.getWorldDirection(camD);
        sky.update(dt, t, camera); hero.setProgress(u); hero.setLens(camV.x, camV.y, camV.z, camD.x, camD.y, camD.z); hero.update(dt, t);
        const sideOn = inSight(boxSide), lowOn = inSight(boxLow), rimOn = inSight(boxRim);
        for (let i = 0; i < fallSide.length; i++) fallSide[i].visible = sideOn;
        for (let i = 0; i < fallRim.length; i++) fallRim[i].visible = rimOn;
        for (let i = 0; i < fallLow.length; i++) fallLow[i].visible = lowOn;
        forest.update(dt, t, camera); bamboo.update(dt, t, camera); set.update(dt, t, camera);
        for (let i = 0; i < cMats.length; i++) cMats[i].uniforms.uTime.value = t;
        if (herd) herd.update(dt, t, camera);
        const a = dk.iA, b = dk.iB;
        for (let i = 0; i < 9; i++) {
          const k = duckAt(i, u, pA); duckAt(i, u + 0.0015, pB);
          const dx = pB.x - pA.x, dy = pB.y - pA.y, dz = pB.z - pA.z, kc = clamp(k, 0, 1), fly = 1 - s(0.84, 1, kc), air = 1 - s(0.3, 0.5, kc), brk = s(0.2, 0.45, kc) * (1 - s(0.84, 1, kc)), j = i * 4;
          a[j] = pA.x; a[j + 1] = pA.y + air * 0.12 * Math.sin(t * 1.7 + i * 2.1); a[j + 2] = pA.z; a[j + 3] = Math.atan2(dx, dz);
          b[j + 1] = fly + brk; b[j + 2] = clamp(Math.atan2(dy, Math.hypot(dx, dz) + 1e-5), -0.5, 0.6) * air + 0.6 * brk; b[j + 3] = air * 0.14 * Math.sin(t * 1.1 + i * 1.3);
          dW[i] = s(0.46, 0.84, k) * (1 - 0.75 * s(1.1, 2.6, k));
          uDuck[i].set(pA.x, pA.z, pA.z > 366 ? 1 - s(1.2, 8.5, pA.y - LL) : 0);        // (over the lower lake: its rings and wake on that water, by the bird's own height over it)
        }
        for (let i = 9; i < 23; i++) {
          const j = i * 4, p = rP[i];
          a[j] = rX[i] + 0.6 * Math.sin(t * 0.21 + p); a[j + 1] = 0.03; a[j + 2] = rZ[i] + 0.6 * Math.cos(t * 0.17 + p * 1.7); a[j + 3] = p + 0.9 * Math.sin(t * 0.13 + p * 2.3);
        }
        for (let i = 25; i < 27; i++) { const c = Math.sin(t * 5 + i * 2); b[i * 4 + 2] = -0.3 * c * c * c * c; }                    // dippers bobbing on the rimstone
        for (let i = 27; i < 29; i++) {                                   // and two whirring low along the foot of the fall
          const j = i * 4, sd = i === 27 ? -1 : 1, w = t * 0.3 + i * 3;
          a[j] = AX + sd * (46 + 24 * Math.sin(w)); a[j + 1] = LL + 1.3 + 0.4 * Math.sin(t * 0.9 + i); a[j + 2] = 374 + 3 * Math.sin(t * 0.6 + i);
          a[j + 3] = Math.atan2(sd * 7.2 * Math.cos(w), 1.8 * Math.cos(t * 0.6 + i)); b[j + 1] = 1;
        }
        // the second flight: four mandarins flying ahead up the lake at half our speed are caught up as the camera reaches the
        // stand (15-30 m ahead from u 0.52), lead it round the turn and peel away to the right on the way down to the shelf
        for (let i = 34; i < 38; i++) {
          const k = i - 34, j = i * 4, show = s(0.25, 0.27, u) * (1 - s(0.9, 0.93, u));
          flightAt(k, u, t, pA); flightAt(k, u + 0.0015, t, pB);
          const dx = pB.x - pA.x, dy = pB.y - pA.y, dz = pB.z - pA.z;
          a[j] = pA.x; a[j + 1] = pA.y; a[j + 2] = pA.z; a[j + 3] = Math.atan2(dx, dz);
          b[j] = 2.2 * show; b[j + 1] = 1; b[j + 2] = clamp(Math.atan2(dy, Math.hypot(dx, dz) + 1e-5), -0.4, 0.5); b[j + 3] = 0.16 * Math.sin(t * 1.2 + k * 1.7);
        }
        dA.needsUpdate = true; dB.needsUpdate = true; iW.needsUpdate = true;
        {                                                             // the pheasant on his log: feet fixed, the cape fans, the head follows the lens, the tail sweeps
          const pa = phz.iA, pb = phz.iB;
          // (all by his distance and bearing from the lens: drawn within 300 m (further off he is under five pixels long)
          // and while he is not behind the plane of the lens; his head begins to turn to the lens at 110 m and follows it
          // from 60 m; his cape fans open as the lens comes from 95 m to 45 m and stays fanned)
          const px = pa[0] - camV.x, py = pa[1] - camV.y, pz = pa[2] - camV.z, pd = Math.hypot(px, pz);
          phz.mesh.visible = pd < 300 && px * camD.x + py * camD.y + pz * camD.z > -1.5;
          let hy = Math.atan2(camV.x - pa[0], camV.z - pa[2]) - pYaw; hy -= 6.28318 * Math.round(hy / 6.28318);
          uPz.set(clamp(hy, -1.7, 1.7) * (1 - s(60, 110, pd)), 0, 0, 0);
          pb[1] = 1 - s(45, 95, pd);
          phz.g.attributes.iB.needsUpdate = true;
        }
        const ma = mo.iA, mb = mo.iB;
        for (let j = 0; j < NL; j++) {
          const Lp = LEAP[j], t0 = Lp[4], run0 = Lp[0] !== Lp[1], run1 = Lp[2] !== Lp[3], o = j * 4, sc = mSc[j];
          const k = clamp((u - t0) / MDU, 0, 1), k1 = run0 ? s(t0 - MPRE - 0.003, t0 - 0.003, u) : 1, k2 = run1 ? s(t0 + MDU + 0.004, t0 + MDU + 0.004 + MPOST, u) : 0;
          const sit = Math.max(1 - s(t0 - (run0 ? MPRE + 0.008 : 0.008), t0 - (run0 ? MPRE + 0.003 : 0.003), u), s(t0 + MDU + 0.004 + (run1 ? MPOST : 0), t0 + MDU + 0.01 + (run1 ? MPOST : 0), u));
          const air = s(0, 0.12, k) * (1 - s(0.88, 1, k)), F0 = k1 < 1 ? Lp[0] : k < 1 ? Lp[1] : Lp[2], F1 = k1 < 1 ? Lp[1] : k < 1 ? Lp[2] : Lp[3], kk = k1 < 1 ? k1 : k < 1 ? k : k2;
          const crouch = s(t0 - 0.004, t0, u) * (1 - s(0, 0.08, k)) + s(0.92, 1, k) * (1 - s(t0 + MDU, t0 + MDU + 0.006, u));
          ma[o] = lerp(F0[0], F1[0], kk); ma[o + 1] = lerp(F0[1], F1[1], kk) + sc * lerp(0.46, 0.09, sit) + 5.6 * k * (1 - k) - 0.12 * sc * crouch; ma[o + 2] = lerp(F0[2], F1[2], kk);
          ma[o + 3] = lerp(u < t0 ? 0.5 : -0.5, 1.5708, 1 - sit);
          mb[o + 1] = air; mb[o + 2] = (0.6 - 1.25 * k) * air; mb[o + 3] = sit;
        }
        mAt.needsUpdate = true; mBt.needsUpdate = true;
      },
      dispose() { hero.dispose?.(); sky.dispose?.(); },
    };
  },
};
