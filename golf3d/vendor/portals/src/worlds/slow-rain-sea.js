// The Sea of Slow Rain: a low-gravity moon under amber haze. Rain falls at walking pace in drops the
// size of oranges and melons; a mirror sea answers every landing with a slow glass crown.
// The flight: off an ice spit, into the rain shaft (the hero, src/parts/slow-rain-sea.js), through its
// core among the drops and crowns with sail-rays wheeling overhead, out into gold light and up the
// headland to a teal ring in a notch of the ice.
// Everything is lit by one analytic sky (hero.glsl.sky): no scene lights, no textures.
// Two colours: the light is amber, gold or bone (per seed); everything unlit falls to its cool complement (COOLS:
// plum to ink teal, slate violet to indigo, or deep petrol): the lid, the band away from the tear, shadow sides,
// the near mirror, the clefts and the shadowed wall of the notch. Teal stays the one bright cool accent.
// A place to rest: from u 0.38 to 0.47 the flight lingers down a lane of calm mirror where two or three glass
// crowns stand whole ahead; beyond them the drinker crosses, ploughing its furrow.
// The headland is ice in TWO COLOURS: warm cream-gold faces the tear lights, deep violet-blue (the seed's cool) on every
// shadowed return, cleft and in the niche; broad wedge buttresses whose long shadows fall across the stepped foot, a pale cool
// glow only at lips, arrises and icicle rows, a dark wet waterline, fallen slabs in their own shadow, a real stair of ice cut
// into the gully under the climb. The fall is a body of white water in a dark chute; the notch stands in a plain fluted face
// where the colony roosts beside it. It shows from the first frame as a banded cliff in the haze with a clear leaning edge,
// is lost inside the shaft and comes back whole at u 0.5 over a gold mirror that still carries the rain's last crowns, where
// a kite-sail raft (hull, cargo, a storm kite low on taut lines; or two great catch-buoys) gives it its size. A herald ray
// comes with us: at u 0.7 it crosses before the fall, at u 0.79 it wheels before the niche beside the colony.
// Cast: sail-rays (one instanced draw: wheelers on time; an overtaker at u 0.34-0.40, a drinker at
// u 0.42-0.49 and a ray that lets go of its ledge at u 0.86, all keyed to u; fourteen roosting), kite-sail
// rafts or catch-buoys, floes / crumbs / rain-cups in windrows, the methanefall and its veils, ice talus.
// Seeded: light (gold side-light / ember dusk / pale noon; ctx.vary.hour picks it when given), rain,
// swell, palette, cast. Rare (ctx.vary.rare): a drop 3.6 m across lands at u 0.40 and raises a crown
// 16 m across whose ring lifts every floe as it runs out under the camera.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/slow-rain-sea.js';

const PALETTES = [
  ['#E9A04B', '#8A4A1E', '#F3E7D2', '#0B0A0E', '#C96A2B', '#3A2418', '#5FD6C8'],   // amber and rust
  ['#EBB24C', '#7C2F2C', '#F5E6C8', '#12060C', '#C8602F', '#3A1822', '#5FD6C8'],   // honey haze, wine-dark sea
  ['#DDBE8A', '#7B5630', '#F1EAD9', '#0B0A0C', '#BB8248', '#34261A', '#5FD6C8'],   // bone haze, tobacco lid
];
// the complement of each palette: what everything unlit falls to (the lid, the band away from the tear, shadow sides, deep water)
const COOLS = [['#6B3070', '#0E3440'], ['#5A55A2', '#28366E'], ['#42609E', '#1C5564']];   // dusk plum to ink teal / slate violet to indigo / slate blue to deep petrol
// (the first of each pair must meet the palette's amber through a colour, not through grey: plum, violet and slate blue do; petrol is kept for the lid's hollows and deep water)
const SEAT = [-50, 0, 215];
const FOGD = 0.00166;                    // gold haze: half strength at 500 m

// shared GLSL: light every solid thing from the same sky the mirror shows
const GLSL_LIT = /* glsl */`
uniform vec3 uKey; uniform float uDusk;
vec3 litCol(vec3 alb, vec3 N, float ao, float trans){
  float nl = dot(N, uSun);
  float key = smoothstep(-0.08, 0.55, nl) * (1. - 0.6 * uRainDim);
  vec3 band = mix(cHaze, cEmber, uRainDim) * (0.55 + 0.45 * (1. - abs(N.y)));
  band = mix(band, cCool * 1.7, (1. - smoothstep(-0.7, 0.3, nl)) * (0.35 + 0.5 * uRainDim));          // turned from the tear: the dusk side
  vec3 amb = mix(band, band * 0.45 + cCool * 0.8, smoothstep(0.1, 0.9, N.y)) * (0.26 + 0.46 * ao);
  amb += cHaze * 0.16 * (1. - smoothstep(-0.8, 0.0, N.y));
  return alb * (uKey * key * ao * 1.45 + amb + uKey * trans * max(-nl, 0.) * 0.5);
}
`;

// shared GLSL: the analytic relief of the ice headland (strata lips, flutes), used by the face, the
// notch, the icicles and (through the hero's mirror hook) the sea. p = (x along the face, y up), metres.
const GLSL_ICE = /* glsl */`
uniform vec4 uIce;                       // seeded phases: flutes, strata, -, cloud base
uniform vec3 uIceKey;                    // the colour of ice the tear lights
// buttresses of unequal width: a strongly frequency-modulated phase, leaning a little with height
float iceFluteA(vec2 p){ float x = p.x + 0.1 * p.y * sin(p.x * 0.0071 + 1.3 + uIce.y);
  return x * 0.068 + uIce.x + 1.9 * sin(x * 0.0137 + 0.7 + uIce.y) + 0.9 * sin(x * 0.0331 + 2.1 + uIce.x) + 0.35 * sin(p.y * 0.011 + x * 0.004); }
float iceCleft(float a){ float c = 0.5 - 0.5 * cos(a); c *= c; return c * c * (0.6 + 0.4 * sin(a * 0.159 + 1.)); }   // 1 deep in a cleft
float iceFlute(vec2 p){ return 1. - iceCleft(iceFluteA(p)); }                                       // 1 on a buttress face
float iceRib(vec2 p){ float b = p.x * 0.37 + 2.6 * sin(p.x * 0.041 + 0.9 * uIce.x) + 1.2 * sin(p.x * 0.09 + 2.) + 0.8 * sin(p.y * 0.023 + p.x * 0.013);
  return (0.5 - 0.5 * cos(b + 0.5 * sin(b))) * (0.25 + 0.75 * smoothstep(-0.4, 0.6, sin(p.x * 0.017 + p.y * 0.009 + uIce.y))); }
// each buttress is a blunt wedge: one broad face turned toward the tear (ph 0.08 to 0.74), an arris, one short return face in shadow
float iceFz(float x){ return smoothstep(40., 74., abs(x - 170.)) * smoothstep(49., 68., abs(x - 46.5)); }      // 0 about the fall and across the notch: each stands in one plain face
float icePh(vec2 p){ return fract((iceFluteA(p) - 3.14159) / 6.28318); }
float iceSaw(float ph){ float e = 1. - min(ph / 0.74, (1. - ph) / 0.26); return sqrt(e * e + 0.003); }
// 1 on the face the tear lights, 0 on the return face and in the cleft's own long shadow (the edges wander a little with height)
float iceLit(vec2 p){ float ph = icePh(p) + 0.012 * sin(p.y * 0.043 + p.x * 0.011) + 0.006 * sin(p.y * 0.19 + 1.7);
  float cst = 0.27 + 0.05 * sin(p.y * 0.021 + floor(iceFluteA(p) / 6.28318 - 0.5) * 2.3) + 0.014 * sin(p.y * 0.13);            // the grazing tear: a long cast shadow
  return mix(1., smoothstep(cst - 0.012, cst + 0.022, ph) * (1. - smoothstep(0.722, 0.748, ph)), iceFz(p.x)); }
// light coming through the thin arris: a band just round the corner on the shadow side
float iceArris(vec2 p){ float ph = icePh(p) + 0.012 * sin(p.y * 0.043 + p.x * 0.011) + 0.006 * sin(p.y * 0.19 + 1.7);
  return smoothstep(0.722, 0.75, ph) * (1. - smoothstep(0.75, 0.83, ph)) * iceFz(p.x); }
float iceRelief(vec2 p){ return iceFz(p.x) * (24. * iceCleft(iceFluteA(p)) + 16. * iceSaw(icePh(p))) + 1.1 * iceRib(p); }                   // metres the face stands back
vec3 iceV = vec3(0., 0., 1.);            // the view ray (eye to surface, brief space): set by the caller before iceCol
float iceFlip = 1.;                      // -1 where skyCol wants the world's x (the sea's mirror)
// strata: beds of unequal thickness that tilt across each buttress and break at the clefts.
// x: bed coordinate, y: its rate per metre of height
vec2 iceSyD(vec2 p){
  float a = (iceFluteA(p) - 3.14159) / 6.28318, bi = floor(a), saw = a - bi - 0.5;
  float y = p.y + 6. * sin(p.x * 0.0113 + uIce.y) + 3. * sin(p.x * 0.031 + 4.1) + saw * 15. * sin(bi * 2.7 + uIce.y) + 8. * sin(bi * 4.3 + 1.);
  return vec2(y / 21. + 0.62 * sin(y * 0.045 + 2.) + 0.12 * sin(y * 0.11 + 0.7), 1. / 21. + 0.0279 * cos(y * 0.045 + 2.) + 0.0132 * cos(y * 0.11 + 0.7));
}
float iceSy(vec2 p){ return iceSyD(p).x; }
float iceHk(float k){ return fract(sin(k * 12.9898 + 4.1) * 43758.5453); }
float iceH2(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float iceN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(iceH2(i), iceH2(i + vec2(1., 0.)), f.x), mix(iceH2(i + vec2(0., 1.)), iceH2(i + vec2(1., 1.)), f.x), f.y); }
// where a shelf's lip stands proud: beds pinch out and come back along the face
float icePinch(float x, float k){ return smoothstep(-0.45, 0.2, sin(x * 0.019 + k * 2.4) + 0.6 * sin(x * 0.043 + k * 5.1 + 1.)); }
// N0: the smooth normal of the surface (unit). ao: 1 open, 0 deep in a cleft. fw: pixel footprint of p.
// along: how p.x runs along the surface tangent (1 on the face, +-0.83 on the notch walls). strata: 0 on floors.
vec3 iceCol(vec2 p, vec3 N0, float ao, vec2 fw, float along, float strata, float gold){
  vec2 sd = iceSyD(p); float sy = sd.x, k = floor(sy), sf = sy - k; float wy = fw.y * sd.y;
  float hk = iceHk(k), e0 = 1. - clamp(4.6 * sd.y * (0.6 + 0.8 * hk), 0.07, 0.4);                    // the lip is a few metres thick, whatever the bed
  float sFade = (1. - smoothstep(0.12, 0.4, wy)) * strata * icePinch(p.x, k);
  float under = smoothstep(e0 - 0.07 - wy, e0 - 0.05, sf) * (1. - smoothstep(e0, e0 + 0.02 + wy, sf)) * sFade;
  float contact = smoothstep(e0 - 0.38, e0 - 0.05, sf) * (1. - smoothstep(e0, e0 + 0.02 + wy, sf)) * sFade;     // soft shade gathering under the lip
  float cap = smoothstep(e0, e0 + 0.02 + wy, sf) * (1. - smoothstep(0.985 - wy, 1., sf)) * sFade;
  float top = smoothstep(0.94, 0.985, sf) * sFade;
  // laminae: thin beds inside each bed, of unequal weight; frost feathers; streaks run down from under each lip
  float lf = sy * 3. + 0.8 * sin(p.x * 0.05 + k), lk = floor(lf), lfr = lf - lk, lh = fract(sin(lk * 78.233 + 1.3) * 43758.5453), wl = fw.y * sd.y * 3.;
  float lam = (1. - smoothstep(0.05 + wl, 0.15 + 2. * wl, min(lfr, 1. - lfr))) * step(0.42, lh) * (0.4 + 0.6 * lh) * (1. - smoothstep(0.15, 0.5, wl)) * strata
    * smoothstep(-0.5, 0.1, sin(p.x * 0.083 + lk * 1.9));
  float frost = smoothstep(0.5, 0.74, 0.6 * iceN(vec2(p.x * 0.083 + 1.3 * k, p.y * 0.19 + 2.7 * hk)) + 0.4 * iceN(vec2(p.x * 0.33 + 5.1, p.y * 0.71 + k)))
    * (1. - smoothstep(0.6, 2.5, max(fw.x, fw.y)));
  float drip = smoothstep(0.5, 0.9, 0.5 + 0.5 * sin(p.x * 1.9 + 2. * sin(p.x * 0.43 + k * 3.))) * smoothstep(e0 - 0.55, e0 - 0.08, sf) * (1. - smoothstep(e0 - 0.07, e0 - 0.05, sf))
    * (1. - smoothstep(0.35, 1.3, fw.x * 1.9)) * sFade;
  // tall flutes that jog a little at every shelf; a fine striation and a soft hammered relief close to
  float a2 = p.x * 0.4 + 0.7 * sin(k * 2.3) + 3.3 * sin(p.x * 0.07 + k * 0.9) + 2.5 * sin(p.x * 0.023 + k * 1.7), s2 = a2 + 0.6 * sin(a2);
  float f2 = (1. - smoothstep(0.45, 1.5, fw.x * 0.6)) * strata * (0.3 + 0.7 * smoothstep(-0.3, 0.5, sin(p.x * 0.031 + k * 1.3 + p.y * 0.02)));
  float a3 = p.x * 2.9 + 2. * sin(p.y * 0.31 + k) + 1.3 * sin(p.x * 0.6), f3 = (1. - smoothstep(0.35, 1.3, fw.x * 2.9)) * strata;
  float a4 = p.y * 3.3 + 1.6 * sin(p.x * 0.45 + k), f4 = (1. - smoothstep(0.35, 1.3, fw.y * 3.3)) * strata;
  float fm = max(fw.x, fw.y), f5 = 1. - smoothstep(0.25, 1.1, fm), f6 = 1. - smoothstep(0.08, 0.4, fm);
  float h5 = iceN(vec2(p.x * 0.11 + 3.1 * hk, p.y * 0.62 + 1.7 * k)) - 0.5, h6 = iceN(vec2(p.x * 0.47 + k, p.y * 2.9)) - 0.5;   // beds of uneven tone, long along the face
  // (the flutes are soft changes of tone inside a face, never a second terminator: the big light and shade is the buttress's own)
  float tx = (-sin(s2) * (1. + 0.6 * cos(a2)) * 0.11 * f2 - sin(a3) * 0.06 * f3 * (0.4 + 0.6 * h5 + 0.3)) * (1. - 0.6 * cap) * along;
  float ty = 1.4 * under - 1.1 * top + 0.5 * lam * sign(lfr - 0.5) - sin(a4) * 0.05 * f4 * (1. - cap);
  vec3 T = normalize(vec3(-N0.z, 0., N0.x) + vec3(1e-4, 0., 0.)); vec3 Bt = cross(T, N0);
  vec3 N = normalize(N0 - T * tx - Bt * ty);
  float nl = dot(N, uSun), sh = clamp(-gold, 0., 1.);
  float open = clamp(ao * (1. - 0.85 * under) * (1. - 0.3 * contact) * (1. - 0.4 * lam), 0., 1.);
  float key = mix(smoothstep(-0.16, 0.26, nl), 0.55 + 0.45 * smoothstep(-0.2, 0.9, nl), max(gold, 0.)) * open * (1. - sh);
  // ICE: pale cream, clearly lighter than the gold sea; beds differ by a tenth of tone, no more
  vec3 alb = mix(cCream, mix(cCream, cHaze, 0.55), 0.08 + 0.5 * hk) * (0.66 + 0.045 * cos(s2) * f2 + 0.07 * sf * sFade + 0.09 * h5 * f5 + 0.07 * h6 * f6);
  alb = mix(alb, cCream * 0.88, max(max(cap, smoothstep(0.45, 0.8, N.y)), 0.55 * frost));                // frost on lips and ledges, feathers on the walls
  alb *= (1. - 0.3 * lam) * (1. - 0.26 * drip);
  float lum = dot(alb, vec3(0.333)), rake = smoothstep(0.35, 0.9, nl);
  // the lit face: cream under a near-white key, warming to gold only where the tear rakes it square on
  vec3 lit = alb * mix(vec3(1.03, 1.0, 0.95), uIceKey * 1.27, 0.93 + 0.07 * rake) * (0.82 + 0.2 * clamp(nl * 1.5, 0., 1.));
  // the shadowed face: the seed's cool colour, deep in clefts and under lips, lifted by the bounce off the sea
  float fill = 0.74 + 0.3 * dot(N, normalize(vec3(-uSun.x, 0.35, -0.55)));
  vec3 shS = mix(mix(cDeep, cCool, 0.45) * 0.9, mix(cCool * 1.7, cCream, 0.12), open * (0.5 + 0.5 * smoothstep(0.5, 0.82, lum))) * (0.2 + 0.86 * lum) * fill;
  shS *= (1. - 0.7 * under) * (1. - 0.36 * contact) * (1. + 0.9 * top + 0.42 * cap) * (1. - 0.4 * lam);                    // dark under each lip, the ledge tops catch the band
  shS += mix(cCool * 1.6, cCream, 0.55) * 0.15 * (frost + 0.8 * top) * open;                                   // frost is the palest thing on a shadowed wall
  vec3 c = mix(shS, lit, key) + alb * cHaze * 0.05 * open;
  // light comes THROUGH thin ice: lips, caps and the rims of frost glow pale and cool where they stand against the shade
  c += mix(cCool * 1.9, cCream, 0.6) * (0.3 * top + 0.16 * cap) * (0.35 + 0.65 * (1. - key)) * (0.4 + 0.6 * open);
  c *= (1. - 0.2 * lam) * (1. - 0.16 * drip) * (1. + 0.22 * frost * (1. - key));
  // a wet, glossy skin: at a grazing angle the face holds the haze band (and the tear, as a soft sheen)
  float cv = clamp(dot(N, -iceV), 0., 1.), fr = 1. - cv; fr *= fr; fr *= fr;
  vec3 Rr = reflect(iceV, N); Rr = vec3(Rr.x * iceFlip, 0., Rr.z); Rr /= max(length(Rr), 1e-4); Rr = normalize(vec3(Rr.x, 0.09, Rr.z));
  c = mix(c, skyCol(Rr) * 0.95, (0.02 + 0.5 * fr) * (0.35 + 0.65 * open) * (1. - 0.5 * cap));
  float sp = max(dot(reflect(iceV, N), uSun), 0.); sp *= sp; sp *= sp; sp *= sp;
  c += uIceKey * (0.2 * sp + 0.5 * sp * sp * sp) * key;
  return c * (1. - 0.3 * uRainDim);
}
// the headland enters the cloud: its upper face sinks into the lid's rust
vec3 iceCloud(vec3 c, vec2 p){ return mix(c, mix(cDeep, cCool, 0.62) * 0.7, smoothstep(uIce.w, uIce.w + 210., p.y + 26. * sin(p.x * 0.013 + 1.)) * 0.94); }
`;

export default {
  id: 'slow-rain-sea',
  name: 'The Sea of Slow Rain',
  category: 'alien',
  weirdness: 0.45,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng } = ctx;
    const detail = ctx.quality?.detail ?? 1, dens = ctx.vary?.density ?? 1, hour = ctx.vary?.hour ?? 'any';
    const rare = !!ctx.vary?.rare;
    const vr = rng.fork('variants');
    const pick3 = (w) => { const r = vr(); return r < w[0] ? 0 : r < w[0] + w[1] ? 1 : 2; };
    // light: 0 gold side-light, 1 ember dusk, 2 pale noon
    let lightV = pick3([0.4, 0.3, 0.3]);
    if (hour === 'golden') lightV = 0; else if (hour === 'dawn' || hour === 'night') lightV = 1; else if (hour === 'day') lightV = 2;
    const rainV = rare ? 0 : pick3([0.45, 0.3, 0.25]);     // oranges and melons / plum-fine / great drops
    const swellV = pick3([0.45, 0.3, 0.25]);               // glassy swell / flat calm / 3 m swell
    const castV = pick3([0.5, 0.25, 0.25]);                // three rafts / one great raft, twin kites / catch-buoys
    const nRays = 4 + Math.floor(vr() * 5);                // four to eight
    const forkTail = vr() < 0.4;
    const palV = (pick3([0.3, 0.3, 0.4]) + 1) % 3;         // amber and rust / honey over wine / bone under tobacco
    const pal = PALETTES[palV];
    const rareHook = {};
    const C = pal.map((h) => new THREE.Color(h));
    const teal = C[6];

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, FOGD);

    // ---- the path (the brief's camera line; the last 150 m dead straight at 22 degrees) ----------
    // The brief's map has +X to starboard; looking down +Z in a right-handed world that is -X. So the
    // world is authored in the brief's coordinates inside the mirrored group B, and the path, the hero
    // seat, the sun and the pois are given to the engine with x negated.
    const path = makePath([[0, 4.5, 0], [0, 4.2, 50], [0, 3.8, 95], [-20, 3.8, 150], [-50, 3.8, 215], [-42, 4.2, 270], [-6, 14, 345],
      [22, 40, 412], [40.7, 58.7, 454], [59.3, 77.3, 496], [78, 96, 538]].map((q) => [-q[0], q[1], q[2]]));
    const nearB = (x, z) => path.nearestXZ(-x, z);                 // nearest path sample to a brief-space point
    const B = new THREE.Group(); B.scale.x = -1; B.name = 'brief-space'; scene.add(B);
    await ctx.yield();

    // ---- flight clock: the brief's speeds (14 m/s in, 8 through the shaft, 20 up the climb) --------
    const sstep0 = ctx.core.smoothstep;
    // and it lingers in the lane of calm mirror (u 0.39-0.45), where the crowns stand
    const paceF = (u) => 1.12 - 0.5 * sstep0(0.16, 0.27, u) - 0.19 * sstep0(0.36, 0.4, u) * (1 - sstep0(0.44, 0.48, u)) + 0.92 * sstep0(0.455, 0.62, u) - 0.42 * sstep0(0.86, 0.97, u);
    const TT = new Float32Array(257); { let acc = 0; for (let i = 1; i <= 256; i++) { acc += 1 / paceF((i - 0.5) / 256); TT[i] = acc; } for (let i = 1; i <= 256; i++) TT[i] *= 45 / acc; }
    const Tof = (u) => { const x = Math.min(1, Math.max(0, u)) * 256, i = Math.min(255, Math.floor(x)); return TT[i] + (TT[i + 1] - TT[i]) * (x - i); };   // seconds into the flight at u
    const uAt = (t) => { let lo = 0, hi = 1; for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (Tof(m) < t) lo = m; else hi = m; } return (lo + hi) / 2; };
    // ---- the sea's mirror of the headland: the same analytic ice, met by the reflected ray --------
    const iceU = { value: new THREE.Vector4(vr() * 6.28, vr() * 6.28, 0, 255) };
    const keyCol = [new THREE.Color(1.0, 0.86, 0.6), new THREE.Color(1.0, 0.62, 0.36), new THREE.Color(1.0, 0.91, 0.72)][lightV];
    const sunBU = { value: new THREE.Vector3(0, 1, 0) }, veilU = { value: 1 }, iceKey0 = [new THREE.Color(1.0, 0.82, 0.54), new THREE.Color(1.0, 0.72, 0.45), new THREE.Color(1.0, 0.86, 0.6)][lightV];
    const GLSL_MIRROR = `uniform vec3 uKey, cTeal, uSunB; uniform float uVeil;\n` + GLSL_ICE.replace(/uSun/g, 'uSunB') + /* glsl */`
      float mirZ(float y){ return 505. - 64. * exp(-max(y, 0.) / 20.) - 0.045 * max(0., y - 120.); }
      vec3 mirrorCol(vec3 o, vec3 d, vec3 sky){             // o, d in the hero's frame; the face stands in the brief's
        vec3 bo = vec3(-(o.x + 50.), o.y, o.z + 215.), bd = vec3(-d.x, d.y, d.z); float dz = max(bd.z, 0.03);
        float dimK = uVeil, fwd = step(0.03, bd.z);
        float t = (505. - bo.z) / dz, y = bo.y + t * bd.y;
        t = (mirZ(y) - bo.z) / dz; y = bo.y + t * bd.y;
        t = (mirZ(y) - bo.z) / dz; y = bo.y + t * bd.y;
        vec2 p = vec2(bo.x + t * bd.x, y); vec2 fw = max(fwidth(p), vec2(3.5, 6.));        // the mirror keeps the broad bands, not the crisp lips
        // the cape dissolves into haze exactly as the face above the water does (capeFade in the headland shader)
        float hit = fwd * step(0., t) * (1. - smoothstep(500., 540., y)) * smoothstep(-128., -106., p.x - 0.16 * y) * (1. - smoothstep(600., 760., p.x));
        float hi = smoothstep(6., 56., y), cl = iceCleft(iceFluteA(p)) * iceFz(p.x);
        float zx = hi * (iceRelief(p + vec2(2., 0.)) - iceRelief(p)) * 0.5;
        vec3 N0 = normalize(vec3(zx, 3.2 * exp(-max(y, 0.) / 20.), -1.));
        float up = clamp(N0.y, 0., 1.);
        iceV = bd / max(length(bd), 1e-4); iceFlip = -1.;
        vec3 c = iceCol(p, N0, 1. - 0.78 * hi * smoothstep(0.12, 0.8, cl), fw, 1., smoothstep(14., 46., y) * (1. - smoothstep(0.55, 0.85, up)), -(1. - iceLit(p)) * smoothstep(4., 18., y));
        c = iceCloud(c, p);
        float px = p.x - 70.5, slot = smoothstep(46., 48.5, p.x) * (1. - smoothstep(92.5, 95., p.x)) * smoothstep(64., 68., y) * (1. - smoothstep(156., 160., y + 0.03 * px * px));
        c = mix(c, mix(cDeep, cCool, 0.5) * 0.8, slot * 0.9);
        
        #ifdef USE_FOG
          c = mix(c, fogColor, 1. - exp(-fogDensity * fogDensity * t * t));
        #endif
        // inside the rain the headland is only a soft rust shape in the mirror
        c = mix(c, sky, 0.9 * dimK);
        vec3 res = mix(sky, c * mix(vec3(1.), cHaze * 1.2, 0.4) * mix(0.5, 0.78, smoothstep(8., 70., y)) + mix(cDeep, cCool, 0.5) * 0.04, hit);   // the image is a tone deeper and warmer than the wall: a gold mirror, not a second cliff        // the image is a tone deeper than the wall: sea and ice part cleanly
        // the bank of luminous haze between the shaft and the cape (the plane z 385 of 'haze-bank')
        float tb = (385. - bo.z) / dz; vec2 pb = vec2(bo.x + tb * bd.x, bo.y + tb * bd.y);
        float ab = (1. - smoothstep(-6., 66., pb.x + 15.)) * smoothstep(-420., -250., pb.x) * (1. - smoothstep(40., 185., pb.y + 35.)) * smoothstep(150., 300., tb) * fwd;
        res = mix(res, mix(cCream, cHaze, 0.42) * mix(vec3(1.), uKey, 0.5) * 1.04, ab * 0.86 * (1. - dimK));
        // the shaft: a soft rust pillar standing in the mirror directly under the column of rain
        vec2 dn = d.xz / max(length(d.xz), 1e-3); float along = -dot(o.xz, dn), perp = abs(o.x * dn.y - o.z * dn.x);
        float sh = (1. - smoothstep(48. + 150. * smoothstep(0.12, 0.5, d.y), 96. + 170. * smoothstep(0.12, 0.5, d.y), perp)) * smoothstep(60., 130., along) * (1. - 0.5 * dimK);
        res = mix(res, mix(cRust, cEmber, 0.55) * 0.92, sh * 0.62);
        return res;
      }`;
    // ---- the hero: shaft, drops, crowns, and the world's sea ------------------------------------
    const coolV = lightV === 2 || palV === 2 ? 2 : palV;
    const hero = await buildHero(ctx, { palette: pal, cool: COOLS[coolV], detail, sea: true, seaRadius: 1700, lid: true,
      light: lightV, rain: rainV, swell: swellV, mirror: { glsl: GLSL_MIRROR, uniforms: { uKey: { value: keyCol }, cTeal: { value: teal }, uSunB: sunBU, uIce: iceU, uVeil: veilU, uIceKey: { value: iceKey0 } } },
      track: [[-50, 6, -215], [-50, 6, -120], [-30, 5, -65], [0, 3.8, 0], [-8, 4.2, 55], [-44, 14, 130]], clear: 4.8 });
    hero.object.position.set(-SEAT[0], SEAT[1], SEAT[2]);
    scene.add(hero.object);
    const HU = hero.uniforms;
    // the rain drifts with us (3.3 m/s), so inside the shaft drops close at walking pace
    hero.setDrift(-0.5, 3.3);
    hero.setCalm(-236, 172, 50, 40);                               // the untouched oval under the methanefall
    const sunB = HU.uSun.value.clone();                            // the sun in the brief's frame (port quarter)
    sunBU.value.copy(sunB);
    hero.setSun(new THREE.Vector3(-sunB.x, sunB.y, sunB.z));       // and in the world's
    const camB = new THREE.Vector3();
    const DUSK_OUT = [0.0, 0.0, 0.0][lightV];
    const iceKey = iceKey0;
    const W = { uKey: { value: keyCol }, uDusk: { value: lightV === 1 ? 1 : 0 }, uU: { value: 0 }, uVeil: veilU, uIn: { value: 0 }, uIceKey: { value: iceKey }, cTeal: { value: teal },
      uSun: { value: sunB }, uCamB: { value: camB } };
    const WS = { uSun: HU.uSun };                                  // for materials living in world space (the dome)
    // uniforms for a world material: fog + the hero's clock and sky + ours
    const U = (extra = {}) => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...HU, ...W, ...extra });
    const HASH = hero.glsl.hash, SKY = hero.glsl.sky;
    const FOGV = '#include <fog_pars_vertex>\n', FOGF = '#include <fog_pars_fragment>\n';
    const big = new THREE.Sphere(new THREE.Vector3(0, 100, 250), 5000);
    const disposables = [];
    const updaters = [], veiled = [];                                             // veiled: what the rain hides whole; not drawn while the veil is full
    await ctx.yield();

    // ---- sky dome: the same analytic sky, plus six slow rays fanning under the lid ---------------
    {
      const g = new THREE.SphereGeometry(3600, 48, 24);
      const mat = new THREE.ShaderMaterial({
        uniforms: U({ uFogCol: { value: scene.fog.color }, ...WS }), side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
        vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `uniform float uTime; uniform vec3 uFogCol; uniform vec3 uKey;\n` + SKY + /* glsl */`
          varying vec3 vD;
          void main(){
            vec3 d = normalize(vD);
            float a = uTime * 0.0052; float ca = cos(a), sa = sin(a);       // the lid turns once in twenty minutes
            vec3 dr = vec3(d.x * ca - d.z * sa, d.y, d.x * sa + d.z * ca);
            vec3 c = skyCol(vec3(dr.x, max(dr.y, 0.), dr.z) / max(length(vec3(dr.x, max(dr.y, 0.), dr.z)), 1e-4));
            c = mix(c, skyCol(vec3(d.x, max(d.y, 0.), d.z) / max(length(vec3(d.x, max(d.y, 0.), d.z)), 1e-4)), 1. - smoothstep(0.15, 0.4, d.y));
            // rays: a fan about the torn patch, only in the haze band and just under the lid
            vec3 r = normalize(vec3(-uSun.z, 0., uSun.x) + vec3(1e-5, 0., 0.)); vec3 up = cross(uSun, r);
            float px = dot(d, r), py = dot(d, up); float ang = atan(py, px + 1e-5);
            float sd = clamp(dot(d, uSun), -1., 1.); float off = 1. - sd;
            float fan = 0.5 + 0.5 * sin(ang * 6. + 0.6 * sin(ang * 2. + uTime * 0.05) + uTime * 0.021);
            fan *= fan; fan *= 0.6 + 0.4 * sin(ang * 13. - uTime * 0.033);
            float reach = smoothstep(0.004, 0.03, off) * (1. - smoothstep(0.08, 0.75, off));
            float under = smoothstep(-0.01, 0.03, d.y) * (1. - smoothstep(0.22, 0.5, d.y));
            c *= 1. - 0.34 * reach * under * (1. - fan) * (1. - uRainDim);
            c += uKey * fan * reach * under * 0.3 * (1. - 0.7 * uRainDim);
            c = mix(uFogCol, c, smoothstep(-0.012, 0.03, d.y));
            gl_FragColor = vec4(c, 1.);
          }`,
      });
      const dome = new THREE.Mesh(g, mat); dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
      updaters.push((dt, time, camera) => { camera.getWorldPosition(dome.position); });
    }
    await ctx.yield();

    // ---- the ice headland: a face along z 505, stepped strata crossed by flutes, the exit notch -----
    // The relief is analytic (GLSL_ICE and its twins below): the mesh carries the big shape, the shader
    // draws every shelf lip and flute from the same functions, so nothing depends on mesh density.
    const noise = ctx.noise, sstep = ctx.core.smoothstep;
    W.uIce = iceU;
    const NOTCH = { x0: 48, x1: 93, floorY: 68, topY: 158, back: 556 };
    // CPU twins of GLSL_ICE (keep in step)
    const IU = iceU.value;
    const fluteAJ = (x, y) => { const xx = x + 0.1 * y * Math.sin(x * 0.0071 + 1.3 + IU.y);
      return xx * 0.068 + IU.x + 1.9 * Math.sin(xx * 0.0137 + 0.7 + IU.y) + 0.9 * Math.sin(xx * 0.0331 + 2.1 + IU.x) + 0.35 * Math.sin(y * 0.011 + xx * 0.004); };
    const cleftJ = (a) => { let c = 0.5 - 0.5 * Math.cos(a); c *= c; return c * c * (0.6 + 0.4 * Math.sin(a * 0.159 + 1)); };
    const fluteJ = (x, y) => 1 - cleftJ(fluteAJ(x, y));
    const phJ = (a) => { const v = (a - Math.PI) / (2 * Math.PI); return v - Math.floor(v); };
    const sawJ = (a) => { const ph = phJ(a), e = 1 - Math.min(ph / 0.74, (1 - ph) / 0.26); return Math.sqrt(e * e + 0.003); };
    const ribJ = (x, y) => { const b = x * 0.37 + 2.6 * Math.sin(x * 0.041 + 0.9 * IU.x) + 1.2 * Math.sin(x * 0.09 + 2) + 0.8 * Math.sin(y * 0.023 + x * 0.013);
      return (0.5 - 0.5 * Math.cos(b + 0.5 * Math.sin(b))) * (0.25 + 0.75 * sstep(-0.4, 0.6, Math.sin(x * 0.017 + y * 0.009 + IU.y))); };
    const syJ = (x, y) => {                                         // bed coordinate; its rate per metre in syJ.ds
      const a = (fluteAJ(x, y) - Math.PI) / (2 * Math.PI), bi = Math.floor(a), saw = a - bi - 0.5;
      const yy = y + 6 * Math.sin(x * 0.0113 + IU.y) + 3 * Math.sin(x * 0.031 + 4.1) + saw * 15 * Math.sin(bi * 2.7 + IU.y) + 8 * Math.sin(bi * 4.3 + 1);
      syJ.ds = 1 / 21 + 0.0279 * Math.cos(yy * 0.045 + 2) + 0.0132 * Math.cos(yy * 0.11 + 0.7);
      return yy / 21 + 0.62 * Math.sin(yy * 0.045 + 2) + 0.12 * Math.sin(yy * 0.11 + 0.7);
    };
    const fractJ = (v) => v - Math.floor(v);
    const hkJ = (k) => fractJ(Math.sin(k * 12.9898 + 4.1) * 43758.5453);
    const e0J = (k, ds) => 1 - Math.min(0.4, Math.max(0.07, 4.6 * ds * (0.6 + 0.8 * hkJ(k))));          // where bed k's lip begins
    const pinchJ = (x, k) => sstep(-0.45, 0.2, Math.sin(x * 0.019 + k * 2.4) + 0.6 * Math.sin(x * 0.043 + k * 5.1 + 1));
    // how far the lip of the bed at (x, sy) stands proud, 0..1
    const lipJ = (sy, x) => { const k = Math.floor(sy), sf = sy - k, e0 = e0J(k, syJ.ds); return sstep(e0 - 0.065, e0 + 0.01, sf) * (1 - sstep(0.94, 1.0, sf)) * pinchJ(x, k); };
    // the gully stair: step coordinate sq(y) (GLSL twin: tzq in the headland shader); a tread is the first 12% of each step
    const stairSq = (y) => y / 2.4 + 0.25 * Math.sin(y * 0.37 + 1);
    const stairInv = (q) => { let lo = q * 2.4 - 0.7, hi = q * 2.4 + 0.7; for (let k = 0; k < 16; k++) { const mid = (lo + hi) / 2; if (stairSq(mid) < q) lo = mid; else hi = mid; } return (lo + hi) / 2; };
    const stairTop = (y) => { const q = stairSq(y), k = Math.floor(q); return k + Math.min(1, (q - k) / 0.12); };
    // z of the face at (x, y); ao in cliffZ.ao. smooth: without the shelf lips. open: without the notch.
    const cliffZ = (x, y, smooth, open) => {
      const wob = noise.fbm2(x * 0.004, y * 0.006, 3);
      let z = 505 - 64 * Math.exp(-Math.max(y, -8) / 20) + 22 * wob - 0.045 * Math.max(0, y - 120);
      const hi = sstep(6, 56, y), fa = fluteAJ(x, y), fz = sstep(40, 74, Math.abs(x - 170)) * sstep(49, 68, Math.abs(x - 46.5)), cl = cleftJ(fa) * fz;
      z += hi * (24 * cl + 1.1 * ribJ(x, y) + 16 * sawJ(fa) * fz + 3.0 * ribJ(x * 0.8 + 31, y) * (1 - fz) * (1 - sstep(40, 47, x)));   // (the plain face to port of the notch keeps shallow flutes: never a flat pane)
      let ao = 1 - 0.78 * hi * sstep(0.12, 0.8, cl);
      if (!smooth) { const sy = syJ(x, y); z -= 2.6 * lipJ(sy, x) * sstep(40, 56, y) * (1 - sstep(190, 230, y)); }
      // the hanging valley of the fall at x 170, above y 200 (low enough to be seen whole from the sea)
      const hv = (1 - sstep(10, 34, Math.abs(x - 170) + 6 * noise.n2(y * 0.02, 3.1))) * sstep(188, 214, y);
      z += 70 * hv; ao -= 0.75 * hv;
      // and the chute it has worn below the lip: a dark recess for the pale ribbon to pour down
      const chute = (1 - sstep(21, 40, Math.abs(x - 170) + 6 * noise.n2(y * 0.02, 3.1))) * sstep(48, 120, y) * (1 - hv);
      z += 24 * chute; ao -= 0.6 * chute;
      // the cape ends and curls away to port; the far end melts into haze
      const cape = Math.max(0, -40 - x), far = Math.max(0, x - 560);
      z += 0.012 * cape * cape + 0.004 * far * far;
      // a clear gully under the climb (only where the apron would come near the path)
      const zreq = 416 + (y - 23) * 2.25;
      const m = (1 - sstep(10, 24, Math.abs(x - (y - 2.2)))) * sstep(16, 30, y) * (1 - sstep(62, 70, y));
      // ... and its floor is a REAL STAIR of ice: unequal treads (flat, 5 m deep) and risers (2-3 m), cut into the mesh
      const zrS = !smooth && m > 0 ? 416 + (stairInv(stairTop(y)) - 23) * 2.25 : zreq;
      if (m > 0 && zrS > z) z += (zrS - z) * m;
      // the notch: the face only makes room here; its walls, floor and ledges are the notch mesh below
      if (!open) {
        const s = sstep(45.2, 46.8, x) * (1 - sstep(94.2, 95.8, x)) * (1 - sstep(158.5, 161, y + 0.03 * (x - 70.5) * (x - 70.5))) * sstep(59, 63, y);
        if (s > 0) { const zn = Math.min(NOTCH.back + 6, zreq); if (zn > z) { z += (zn - z) * s; ao -= 0.5 * s; } }
      }
      cliffZ.ao = Math.max(0.1, ao);
      return z;
    };
    const iceFrag = (body, post = '') => `uniform float uTime, uVeil; uniform vec3 uCamB;\n` + SKY + GLSL_LIT + GLSL_ICE + FOGF + /* glsl */`
      varying vec3 vN, vP; varying vec4 vA; varying vec2 vB; uniform float uU; uniform vec3 cTeal;
      float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      float glint(vec2 q, float fwq){ vec2 sc = q * 6.; vec2 sf = fract(sc) - 0.5;
        return step(0.985, h21(floor(sc) + floor(uTime * 1.5 + h21(floor(sc)) * 7.))) * (1. - smoothstep(0.1, 0.45, length(sf))) * (1. - smoothstep(0.05, 0.25, fwq)); }
      // broken plates: a warped grid of slabs, each with its own tilt (xy) and tone (w), dark cracks between (z)
      vec4 plates(vec2 q, float fwq){ vec2 w = vec2(q.x * 0.8 + q.y * 0.6, q.y * 0.8 - q.x * 0.6) + 0.42 * vec2(sin(q.y * 1.7 + 0.8 * sin(q.x * 0.9)), sin(q.x * 1.3 + 0.9 * sin(q.y * 0.7)));
        vec2 id = floor(w), f = fract(w); float h = h21(id), h2 = h21(id + 17.3);
        float e = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)) * (0.6 + 0.8 * h2);
        return vec4(h - 0.5, h2 - 0.5, (1. - smoothstep(0.02 + fwq, 0.09 + 2. * fwq, e)) * (1. - smoothstep(0.2, 0.6, fwq)), h); }
      // one flight of steps along the coordinate tq (tw its footprint): x riser, y lip, z tread, w the shade at the back of a tread
      vec4 stepsAt(float tq, float tw, float rz){ float tf = fract(tq), fade = 1. - smoothstep(0.45, 1.1, tw);
        float riser = smoothstep(rz - tw, rz + 0.03 + tw, tf) * (1. - smoothstep(0.955 - tw, 0.985, tf));
        float lip = smoothstep(0.94 - tw, 0.975, tf) + (1. - smoothstep(0.0, 0.045 + tw, tf));
        float tread = 1. - smoothstep(rz - tw, rz + 0.03 + tw, tf);
        return vec4(riser, lip, tread, smoothstep(rz - 0.16, rz - 0.01, tf) * tread) * fade; }
      void main(){
        vec3 N0 = normalize(vN + vec3(0., 0., -1e-4)); vec3 c;
        ${body}
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
        ${post}
      }`;
    const iceVert = FOGV + /* glsl */`
      attribute vec4 aA; attribute vec2 aB; varying vec3 vN, vP; varying vec4 vA; varying vec2 vB;
      void main(){ vN = normal; vP = position; vA = aA; vB = aB;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
    {
      const NX = Math.round(196 * Math.max(0.8, Math.sqrt(detail))), ys = [];
      for (let j = 0; j < 14; j++) ys.push(-9 + 64 * j / 14);                    // apron
      for (let j = 0; j < 70; j++) ys.push(55 + 110 * j / 70);                   // dense about the notch
      for (let k = Math.ceil(stairSq(15)); k <= Math.floor(stairSq(67)); k++) ys.push(stairInv(k) + 0.004, stairInv(k + 0.12));   // a row at the lip and at the back of every tread of the gully stair
      ys.sort((a, b) => a - b); for (let j = ys.length - 1; j > 0; j--) if (ys[j] - ys[j - 1] < 0.03) ys.splice(j, 1);
      for (let j = 0; j <= 62; j++) { const t = j / 62; ys.push(165 + 375 * (0.35 * t + 0.65 * t * t)); }
      const NY = ys.length - 1;
      const n = (NX + 1) * (NY + 1), pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), aA = new Float32Array(n * 4), aB = new Float32Array(n * 2).fill(1), idx = [];
      await ctx.yield();
      for (let j = 0, o = 0; j <= NY; j++) {
        const y = ys[j];
        for (let i = 0; i <= NX; i++, o++) {
          const s = i / NX * 2 - 1, a = Math.abs(s);
          const x = 70 + (s < 0 ? -420 * (0.2 * a + 0.8 * a * a * a) : 700 * (0.13 * a + 0.87 * a * a * a));
          const z0 = cliffZ(x, y, true), ao = cliffZ.ao, zx = (cliffZ(x + 1.5, y, true) - z0) / 1.5, zy = (cliffZ(x, y + 1.5, true) - z0) / 1.5;
          const il = 1 / Math.hypot(zx, zy, 1);
          pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = cliffZ(x, y);
          nrm[o * 3] = zx * il; nrm[o * 3 + 1] = zy * il; nrm[o * 3 + 2] = -il; aA[o * 4] = ao;
        }
        await ctx.yield();
      }
      for (let j = 0; j < NY; j++) { for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); } if (j % 24 === 23) await ctx.yield(); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      g.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.BufferAttribute(aB, 2)); g.setIndex(idx); g.boundingSphere = big;
      await ctx.yield();
      const mat = new THREE.ShaderMaterial({
        uniforms: U(), fog: true, side: THREE.DoubleSide, vertexShader: iceVert,
        fragmentShader: iceFrag(/* glsl */`
          vec2 fw = fwidth(vP.xy); float up = clamp(N0.y, 0., 1.);
          float gully = (1. - smoothstep(30., 58., abs(vP.x - (vP.y + 6.)))) * smoothstep(16., 30., vP.y) * (1. - smoothstep(64., 72., vP.y));
          float strata = smoothstep(14., 46., vP.y) * (1. - smoothstep(0.55, 0.85, up)) * (1. - gully);
          // STEPPED SHELVES: the apron comes down to the sea in ledges of unequal rise (a frosted tread, a lit lip, a shaded
          // riser); under the climb they are the notch floor's own stair carried down the gully. No plates, no cracks.
          float gullyW = (1. - smoothstep(46., 86., abs(vP.x - (vP.y + 6.)))) * smoothstep(16., 30., vP.y) * (1. - smoothstep(64., 72., vP.y));   // the stair of ledges spreads wider than the smooth ramp
          float ter = max(1. - smoothstep(18., 52., vP.y), gullyW);
          float tyq = vP.y / 6.4 + 0.3 * sin(vP.x * 0.021 + 1.3 * sin(vP.x * 0.009 + uIce.x)) + 0.1 * sin(vP.x * 0.083 + 2.) + 0.035 * sin(vP.x * 0.37);
          float tzq = vP.y / 2.4 + 0.25 * sin(vP.y * 0.37 + 1.);       // the gully stair's step coordinate (CPU twin: stairSq)
          // (two flights, never one coordinate bent into the other: the shelves of the apron die out at the edge of the carved
          // gully and the stair begins inside it)
          float carve = (1. - smoothstep(9., 22., abs(vP.x - (vP.y - 2.2)))) * smoothstep(16., 30., vP.y) * (1. - smoothstep(62., 70., vP.y));
          float gz = smoothstep(0.3, 0.7, carve) * (1. - smoothstep(62., 67., vP.y)), twy = fwidth(tyq) + 1e-4, twz = fwidth(tzq) + 1e-4, tky = floor(tyq), tkz = floor(tzq);
          float tpin = smoothstep(-0.55, -0.05, sin(vP.x * 0.027 + tky * 2.4) + 0.6 * sin(vP.x * 0.061 + tky * 5.1 + 1.));
          float rzy = 0.62 + 0.16 * iceHk(tky), rzz = 0.12;
          float tfS = fract(tzq), trS = 1. - smoothstep(0.115 - twz, 0.13 + twz, tfS), lipS = (1. - smoothstep(0.01, 0.022 + twz, tfS)) + smoothstep(0.92 - twz, 0.965, tfS);
          vec4 stS = vec4((1. - trS) * (1. - smoothstep(0.92, 0.965, tfS)), min(lipS, 1.), trS, smoothstep(0.06, 0.115, tfS) * trS) * (1. - smoothstep(0.8, 1.8, twz));
          float tgq = vP.y / 4.7 + 0.42 * sin(vP.y * 0.29 + 1.3) + 0.2 * sin(vP.x * 0.11 + 1.1 * sin(vP.x * 0.047)) + 0.05 * sin(vP.x * 0.61), twg = fwidth(tgq) + 1e-4, tkg = floor(tgq);
          float gpin = smoothstep(-0.5, 0.0, sin(vP.x * 0.071 + tkg * 2.4) + 0.6 * sin(vP.x * 0.17 + tkg * 5.1 + 1.));
          float gst = smoothstep(0.3, 0.75, gullyW) * (1. - gz) * (1. - smoothstep(63., 69., vP.y)) * gpin;
          vec4 st4 = (stepsAt(tyq, twy, rzy) * tpin * (1. - gst) * (1. - gz) * (1. - smoothstep(48., 62., vP.y)) + stepsAt(tgq, twg, 0.3 + 0.2 * iceHk(tkg)) * gst + stS * gz) * ter;
          float riser = st4.x, lip = st4.y, tread = st4.z, foot = st4.w;
          float tf = gz > 0.5 ? fract(tzq) : fract(tyq), tk = gz > 0.5 ? tkz : tky, tw = gz > 0.5 ? twz : twy, rz = gz > 0.5 ? rzz : rzy;
          N0 = normalize(mix(N0, vec3(0., 0.4, -0.92), 0.72 * gully));
          N0 = normalize(mix(N0, vec3(0., 0.1, -1.), 0.8 * riser)); N0 = normalize(mix(N0, vec3(0., 1., -0.12), 0.8 * tread));
          // the face to port of the notch lies in the long shadow of its buttress: the slot opens between a violet wall and a gold one
          float xs = vP.x + 0.1 * (vP.y - 100.) + 5. * sin(vP.y * 0.07 + 1.);
          float lowS = clamp((68. - vP.y) / 30., 0., 1.), xe2 = vP.x + 16. * lowS + 3. * sin(vP.y * 0.13 + 0.6 * sin(vP.x * 0.2)) * lowS;
          float shL = smoothstep(-52., -24., xs) * (1. - smoothstep(46. - 9. * lowS, 51. + 5. * lowS, xe2)) * smoothstep(34., 66., vP.y) * (1. - smoothstep(175., 235., vP.y));
          iceV = normalize(vP - uCamB + vec3(0., 0., 1e-4));
          float hiF = smoothstep(4., 18., vP.y) * (1. - gully), shA = max(shL, (1. - iceLit(vP.xy)) * hiF);
          c = iceCol(vP.xy, N0, vA.x * (1. - 0.3 * foot), fw, 1., strata, -max(shL, (1. - iceLit(vP.xy)) * hiF));
          c += mix(cCool * 1.9, cCream, 0.55) * 0.34 * iceArris(vP.xy) * hiF * vA.x * (1. - shL) * (1. - 0.3 * uRainDim);      // the thin arris of each buttress glows
          float lamT = smoothstep(0.35, 0.9, sin(tf * 70. + 2. * sin(vP.x * 0.31) + tk)) * (1. - smoothstep(0.08, 0.3, tw * 11.));
          float dripT = smoothstep(0.55, 0.9, sin(vP.x * 2.1 + 2. * sin(vP.x * 0.47 + tk * 3.))) * smoothstep(rz + 0.04, rz + 0.3, tf) * (1. - smoothstep(0.3, 1.2, fw.x * 2.1));
          c = mix(c, mix(cCool * 1.3, cDeep, 0.3) * (0.42 + 0.7 * dot(c, vec3(0.333))), riser * (0.8 + 0.1 * lamT + 0.08 * dripT));   // risers hold the dusk
          c *= 1. - 0.3 * foot;
          c = mix(c, cCream * mix(vec3(1.), uKey, 0.65) * mix(1.04, 0.46, shA), 0.72 * lip);                                   // the lip of every shelf catches the tear
          { float wl = vP.y - 0.5 * sin(vP.x * 0.21 + 1.3 * sin(vP.x * 0.057)), wn = iceN(vP.xy * vec2(0.35, 0.9));            // the dark wet foot: a band of the cool colour the swell keeps washed
            float wet = 1. - smoothstep(3.4, 5.6, wl + 1.4 * wn);
            c = mix(c, mix(cDeep, cCool, 0.6) * (0.42 + 0.3 * wn), 0.9 * wet);
            float rim = (1. - smoothstep(0.2, 0.9, abs(wl - 1.2 - 1.6 * (wn - 0.5)))) * smoothstep(0.5, 0.68, iceN(vP.xz * vec2(0.83, 0.47) + 3.)) * smoothstep(0.3, 0.6, iceN(vP.xz * 3.1)) * (1. - smoothstep(0.6, 2.4, fw.y));
            c = mix(c, cCream * mix(vec3(1.), uKey, 0.4) * 0.9, 0.8 * rim); }                                        // a broken rim of stranded crumb ice
          c += mix(uKey, vec3(1.), 0.55) * 1.3 * glint(vP.xy + vP.z * 0.7, max(fw.x, fw.y)) * smoothstep(0.3, 0.7, max(up, tread) + 0.5 * step(0.8, fract(iceSy(vP.xy))));
          c += mix(uKey, vec3(1.), 0.55) * 1.5 * glint(vP.xy * 0.37 + vP.z * 0.21 + 11., max(fw.x, fw.y) * 0.37) * iceLit(vP.xy) * hiF * vA.x;
          { float chm = (1. - smoothstep(24., 44., abs(vP.x - 170.) + 5. * sin(vP.y * 0.05))) * smoothstep(52., 110., vP.y) * (1. - smoothstep(215., 250., vP.y));
            c = mix(c, mix(cDeep, cCool, 0.55) * (0.3 + 0.42 * dot(c, vec3(0.333))), 0.82 * chm); }
          c = iceCloud(c, vP.xy);`, /* glsl */`
          // the cape does not end in an edge: it dissolves into the haze (the mirror fades it the same way)
          vec3 dv = vP - uCamB; float dl = max(length(dv), 1e-3); dv /= dl;
          float ta = uTime * 0.0052, ca = cos(ta), sa = sin(ta); vec3 dw = vec3(-dv.x, max(dv.y, 0.), dv.z);
          vec3 dr = vec3(dw.x * ca - dw.z * sa, dw.y, dw.x * sa + dw.z * ca);
          vec3 skc = mix(skyCol(dw / max(length(dw), 1e-4)), skyCol(dr / max(length(dr), 1e-4)), smoothstep(0.15, 0.4, dv.y));
          float cape = 1. - smoothstep(-128., -106., vP.x - 0.16 * vP.y + 9. * sin(vP.y * 0.021 + 1.) + 4. * sin(vP.y * 0.057));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, skc, cape);
          // seen from inside the rain the headland is a soft rust shape, no more
          gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor * 0.9, skc, 0.8), 0.96 * uVeil * smoothstep(40., 220., dl) * (1. - cape));`),
      });
      const cliff = new THREE.Mesh(g, mat); cliff.name = 'headland'; B.add(cliff); veiled.push(cliff);
    }
    await ctx.yield();
    // ---- the notch: a swept slot with real ledges. Left wall in rust shadow, right wall gold. ------
    // Cross-section loop (left wall up, arch, right wall down, floor back) swept from the face to an apse.
    const notchWall = (side, y, hx) => { const sy = syJ(hx, y); return side * (1.9 * lipJ(sy, hx) + 2.4 * ribJ(hx * 1.7 + 40 * side, y) + 1.2 * noise.n2(hx * 0.09 + 7 * side, y * 0.05)); };
    {
      const NWL = 64, NA = 22, NF = 18, NP = NWL * 2 + NA + NF, ND = 46, zB = NOTCH.back;
      const n = NP * (ND + 1), pos = new Float32Array(n * 3), smo = new Float32Array(n * 3), aA = new Float32Array(n * 4), aB = new Float32Array(n * 2), idx = [];
      const floorAt = (z) => NOTCH.floorY + (z - 505) / 2.3;          // a plain ramp: the shader draws the stair of frost ledges on it
      const sect = (q, d, bev, out) => {                           // loop point q at depth d: x, y, kind (0 L, 1 arch, 2 R, 3 floor), v
        const xL = NOTCH.x0 + 9 * d * d - bev, xR = NOTCH.x1 - 2 * d * d + bev, top = (x) => NOTCH.topY - 14 * d * d + bev - 0.03 * (x - 70.5) * (x - 70.5);
        if (q < NWL) { out.k = 0; out.v = q / NWL; out.x = xL; out.y = top(xL); }
        else if (q < NWL + NA) { out.k = 1; out.v = (q - NWL) / NA; out.x = xL + (xR - xL) * out.v; out.y = top(out.x); }
        else if (q < NWL * 2 + NA) { out.k = 2; out.v = 1 - (q - NWL - NA) / NWL; out.x = xR; out.y = top(xR); }
        else { out.k = 3; out.v = (q - NWL * 2 - NA) / NF; out.x = xR + (xL - xR) * out.v; out.y = 0; }
        return out;
      };
      const P = {}, M = {};
      for (let q = 0; q < NP; q++) {
        sect(q, 0, 4.2, M); const mk2 = M.k, mv = M.v;
        const my = mk2 === 3 ? NOTCH.floorY - 4 : mk2 === 1 ? M.y : NOTCH.floorY - 4 + mv * (M.y - NOTCH.floorY + 4);
        const zm = cliffZ(M.x, Math.max(my, 60), false, true) - 0.5;      // where this strand leaves the face
        for (let i = 0; i <= ND; i++) {
          const d = Math.pow(i / ND, 1.25), o = i * NP + q, bev = 4.2 * Math.pow(1 - sstep(0, 0.09, d), 2);
          sect(q, d, bev, P);
          const z = zm + (zB - zm) * d, fy = floorAt(z) - bev * 0.9, hx = P.x + 0.83 * (z - zm);
          let x = P.x, y = P.k === 3 ? fy : P.k === 1 ? P.y : fy + P.v * (P.y - fy), xs = x, ysm = y;
          const rel = (1 - bev / 4.2);
          if (P.k === 0) x += rel * notchWall(1, y, hx) * sstep(0, 0.06, P.v);
          else if (P.k === 2) x += rel * notchWall(-1, y, hx) * sstep(0, 0.06, P.v);
          else if (P.k === 3) { y += 0.25 * noise.n2(x * 0.22, z * 0.22) * rel; ysm = NOTCH.floorY + (z - 505) / 2.3 - bev * 0.9; }
          else y -= 1.6 * ribJ(hx * 1.7, 200) * rel;
          // the apse: the slot closes to a point behind the ring
          const ap = Math.pow(Math.cos(Math.PI / 2 * sstep(0.74, 1, d)), 0.7), cx = 78, cy = 97;
          x = cx + (x - cx) * ap; y = cy + (y - cy) * ap; xs = cx + (xs - cx) * ap; ysm = cy + (ysm - cy) * ap;
          pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z; smo[o * 3] = xs; smo[o * 3 + 1] = ysm; smo[o * 3 + 2] = z;
          const deep = sstep(0.5, 0.8, d);
          aA[o * 4] = (P.k === 1 ? 0.6 : 1) * (1 - 0.8 * deep);                                      // ao
          aA[o * 4 + 1] = hx; aA[o * 4 + 2] = P.k === 0 ? 0.83 : P.k === 2 ? -0.83 : P.k === 3 ? 2 : 1;
          aA[o * 4 + 3] = (P.k === 2 ? 0.6 + 0.3 * P.v : P.k === 3 ? 0.6 * sstep(62, 88, x) - 0.8 * (1 - sstep(52, 70, x)) : P.k === 0 ? -0.9 : -0.6) * (1 - 0.7 * deep) * rel;   // gold (+) or kept in shadow (-)
          aB[o * 2] = 1 - sstep(3, 13, z - zm); aB[o * 2 + 1] = sstep(0.62, 0.9, d);                 // sunlit from outside, deep
        }
        if (q % 4 === 3) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < ND; i++) for (let q = 0; q < NP; q++) { const a = i * NP + q, b = i * NP + (q + 1) % NP, c = a + NP, e = b + NP; idx.push(a, b, c, b, e, c); }
      const gs = new THREE.BufferGeometry(); gs.setAttribute('position', new THREE.BufferAttribute(smo, 3)); gs.setIndex(idx); gs.computeVertexNormals();
      const nrm = gs.attributes.normal.array;
      for (let o = 0; o < n; o++) {                                // normals face into the slot
        const d = Math.floor(o / NP) / ND, cx = 71, cy = NOTCH.floorY + (smo[o * 3 + 2] - 505) / 2.3 + 30 * (1 - 0.5 * d);
        if (nrm[o * 3] * (cx - smo[o * 3]) + nrm[o * 3 + 1] * (cy - smo[o * 3 + 1]) + nrm[o * 3 + 2] * -0.3 < 0) { nrm[o * 3] *= -1; nrm[o * 3 + 1] *= -1; nrm[o * 3 + 2] *= -1; }
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm.slice(), 3));
      g.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.BufferAttribute(aB, 2)); g.setIndex(idx); g.boundingSphere = big; gs.dispose();
      const mat = new THREE.ShaderMaterial({
        uniforms: U(), fog: true, side: THREE.DoubleSide, vertexShader: iceVert,
        fragmentShader: iceFrag(/* glsl */`
          vec2 p = vec2(vA.y, vP.y); vec2 fw = fwidth(p); float up = abs(N0.y);
          float inside = smoothstep(0.64, 0.8, uU);                                  // seen from the sea the slot is in shadow
          float strata = (1. - smoothstep(0.5, 0.8, up)) * (1. - 0.75 * vB.y) * (1. - smoothstep(1.3, 1.7, vA.z));   // (the sill's face carries no flutes or drips: they striped it)
          // the slot's own fine ledges: a lip every three metres or so that comes and goes along the wall, a dark undercut
          // beneath it, frost on its top (the icicle rows hang from these: ledgeYJ below is the twin)
          float wall = (1. - smoothstep(0.5, 0.8, up)) * (1. - 0.5 * vB.y) * (1. - smoothstep(0.86, 0.98, abs(vA.z)));
          float ly = vP.y / 3.2 + 0.35 * sin(vA.y * 0.21 + 1.7 * sin(vA.y * 0.083)) + 0.12 * sin(vA.y * 0.57);
          float lk = floor(ly), lf = ly - lk, lw = fwidth(ly) + 1e-4, le = 0.7 + 0.18 * iceHk(lk);
          float lpin = smoothstep(-0.25, 0.25, sin(vA.y * 0.13 + lk * 2.4) + 0.6 * sin(vA.y * 0.31 + lk * 5.1)) * wall * (1. - smoothstep(0.25, 0.7, lw));
          float lUnder = smoothstep(le - 0.2 - lw, le - 0.04, lf) * (1. - smoothstep(le, le + 0.03 + lw, lf)) * lpin;
          float lCap = smoothstep(le, le + 0.03 + lw, lf) * (1. - smoothstep(0.9, 0.98, lf)) * lpin;
          float lTop = smoothstep(0.9, 0.97, lf) * lpin;
          float lam2 = smoothstep(0.55, 0.95, sin(vP.y * 9.5 + 2. * sin(vA.y * 0.31) + 1.3 * sin(vA.y * 1.1))) * wall * (1. - smoothstep(0.12, 0.4, fwidth(vP.y) * 9.5));
          // the floor is a staircase of frost ledges: a shaded riser with laminae and drips, a bright lip, a cracked frosted tread
          float flr = smoothstep(1.3, 1.7, vA.z) * (1. - vB.y);
          float qz = (vP.z - 505.) / 4. + 0.05 * sin(vP.x * 0.23 + 1.3 * sin(vP.x * 0.071)) + 0.02 * sin(vP.x * 0.9), fz = fract(qz), wz = fwidth(qz) + 1e-4;
          float riser = smoothstep(0.6 - wz, 0.64 + wz, fz) * (1. - smoothstep(0.95 - wz, 0.985, fz)) * flr;
          float lip = (smoothstep(0.93 - wz, 0.97, fz) + (1. - smoothstep(0.03, 0.1 + wz, fz))) * flr;
          vec3 Nf = normalize(N0 + vec3(0., -0.5, -1.1) * riser);
          vec2 fwz = vec2(fwidth(vP.x), fwidth(vP.z)); float fwq = max(fwz.x, fwz.y);
          vec4 pt = plates(vP.xz / 2.7 + 3.1, fwq / 2.7);
          Nf = normalize(Nf + vec3(pt.x, 0., pt.y) * 0.05 * flr * (1. - riser) * (1. - smoothstep(0.25, 0.7, fwq / 2.7)) + vec3(0., 0.5 * lTop - 0.9 * lUnder, 0.));
          iceV = normalize(vP - uCamB + vec3(0., 0., 1e-4));
          c = iceCol(p, Nf, vA.x * mix(mix(0.22, 1., vB.x), 1., inside), fw, min(vA.z, 1.), strata, vA.w * inside);
          c = mix(c, mix(cDeep, cCool, 0.45) * (0.34 + 0.3 * dot(c, vec3(0.333))), 0.8 * (1. - inside) * (1. - vB.x));
          float shw = clamp(-vA.w * 1.3, 0., 1.) * inside;                           // the wall kept in shadow
          c *= (1. - 0.62 * lUnder) * (1. - 0.2 * lam2);
          c = mix(c, mix(cCream * mix(vec3(1.), uKey, 0.6) * 0.98, mix(cCool * 1.8, cCream, 0.5) * 0.6, shw), 0.5 * lCap + 0.62 * lTop);
          float lamR = smoothstep(0.5, 0.9, sin(vP.y * 8.3 + 2. * sin(vP.x * 0.37))) * (1. - smoothstep(0.1, 0.35, fwidth(vP.y) * 8.3));
          float dripR = smoothstep(0.55, 0.9, sin(vP.x * 2.3 + 2. * sin(vP.x * 0.51 + floor(qz) * 3.))) * smoothstep(0.62, 0.9, fz) * (1. - smoothstep(0.3, 1.2, fwz.x * 2.3));
          c *= (1. - riser * (0.2 * lamR + 0.22 * dripR)) * (1. + 0.5 * lip) * (1. + flr * (1. - riser) * 0.14 * pt.x);
          c = mix(c, mix(cCool * 1.3, cDeep, 0.3) * (0.42 + 0.7 * dot(c, vec3(0.333))), riser * 0.62);            // risers hold the dusk, as on the stair below
          c = mix(c, c * 0.5 + cCream * mix(cCool * 1.7, uKey, 0.5 + 0.5 * clamp(vA.w, -1., 1.)) * 0.5, 0.6 * lip * inside);
          float fl = max(smoothstep(0.5, 0.85, N0.y), flr * (1. - riser));           // frost ledges catching glints
          c += uKey * 1.7 * (glint(vP.xz * 1.3, max(fw.x, fw.y)) + flr * glint(vP.xz * 2.9 + 5., fwq)) * (fl + 0.4 * strata * step(0.79, fract(iceSy(p))) + 0.9 * lTop + 0.5 * lCap);
          vec3 dq = vP - vec3(78., 96., 538.); c += cTeal * 0.16 * exp(-dot(dq, dq) / 300.);`, /* glsl */`
          // seen from inside the rain the slot is lost in the dusk with the headland it is cut in
          vec3 dv = vP - uCamB; float dl = max(length(dv), 1e-3); dv /= dl; vec3 dw = vec3(-dv.x, max(dv.y, 0.), dv.z);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor * 0.9, skyCol(dw / max(length(dw), 1e-4)), 0.8), 0.96 * uVeil * smoothstep(40., 220., dl));`),
      });
      const notch = new THREE.Mesh(g, mat); notch.name = 'notch'; notch.frustumCulled = false; B.add(notch); veiled.push(notch);
    }
    await ctx.yield();
    // ---- icicles: fringes under the shelf lips either side of the notch and along its ledges --------
    {
      const ik = rng.fork('icicles'), N = Math.round(1500 * Math.max(0.7, detail)), aP = new Float32Array(N * 4), aQ = new Float32Array(N * 4);
      const lipY = (hx, k) => { let lo = k * 21 - 70, hi = k * 21 + 80; for (let i = 0; i < 17; i++) { const mid = (lo + hi) / 2; if (syJ(hx, mid) < k + e0J(k, syJ.ds)) lo = mid; else hi = mid; } return lo; };
      const ledgeYJ = (hx, lk) => 3.2 * (lk + 0.7 + 0.18 * hkJ(lk) - 0.35 * Math.sin(hx * 0.21 + 1.7 * Math.sin(hx * 0.083)) - 0.12 * Math.sin(hx * 0.57));   // twin of the notch shader's ledges
      let n = 0;
      for (let t = 0; t < N * 6 && n < N; t++) {
        if (t % 40 === 39) await ctx.yield();
        const inN = ik() < 0.5, k = 3 + Math.floor(ik() * (inN ? 4 : 8)); let x, y, z, gold = 0, shade = 1, fine = false, kk = k;
        if (inN) {
          const left = ik() < 0.7, d = ik.range(0.1, 0.8), xw = left ? NOTCH.x0 + 9 * d * d : NOTCH.x1 - 2 * d * d;
          const zm = cliffZ(xw, 100, false, true) - 0.5; z = zm + (NOTCH.back - zm) * d; const hx = xw + 0.83 * (z - zm);
          const lk = 2 * Math.floor(ik.range(11, 24)); fine = ik() < 0.72;
          if (fine && Math.sin(hx * 0.13 + lk * 2.4) + 0.6 * Math.sin(hx * 0.31 + lk * 5.1) < 0.1) continue;
          y = fine ? ledgeYJ(hx, lk) - 0.04 : lipY(hx, k); kk = fine ? lk : k; if (y > NOTCH.topY - 14 * d * d - 0.03 * (xw - 70.5) * (xw - 70.5) - 6 || y < NOTCH.floorY + (z - 505) / 2.3 + 7) continue;
          x = xw + notchWall(left ? 1 : -1, y, hx) + (left ? 0.25 : -0.25); gold = left ? -1 : 0.8; shade = 1 - 0.5 * sstep(0.55, 1, d);
        } else {
          x = 70.5 + (ik() < 0.5 ? -1 : 1) * (27 + 150 * Math.pow(ik(), 1.7)); y = lipY(x, k);
          z = cliffZ(x, y) - 0.5; shade = cliffZ.ao; if (shade < 0.45) continue;
          if (x < 48 && x > -34 && y > 50 && y < 190) gold = -1;                              // in the buttress's shadow
        }
        if (noise.n2(x * 0.11 + z * 0.09, kk * 3.7) < (fine ? -0.3 : -0.15)) continue;         // gathered into fringes
        const len = (1.2 + 5.5 * Math.pow(ik(), 2.2)) * (0.7 + 0.5 * noise.n2(x * 0.3 + z * 0.3, k)) * (fine ? 0.42 : 1);
        aP.set([x, y, z, Math.max(0.8, len)], n * 4); aQ.set([ik(), gold, shade, fine ? 0.06 + 0.03 * len : 0.11 + 0.035 * len], n * 4); n++;
      }
      const cone = new THREE.ConeGeometry(1, 1, 5, 1, true); cone.translate(0, -0.5, 0); cone.rotateX(Math.PI);   // base at y 0, tip at y -1
      cone.translate(0, -1, 0);
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', cone.attributes.position); g.setAttribute('normal', cone.attributes.normal); g.setIndex(cone.index);
      g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 4)); g.instanceCount = n; g.boundingSphere = big;
      disposables.push(cone);
      const mat = new THREE.ShaderMaterial({ uniforms: U(), fog: true, side: THREE.DoubleSide,
        vertexShader: `uniform vec3 uCamB; uniform float uTime, uRainDim, uVeil;\n` + FOGV + /* glsl */`attribute vec4 aP, aQ; varying vec3 vN; varying vec4 vQ; varying float vT; varying vec4 vSk;
          void main(){ float dist = length(aP.xyz - uCamB); vec3 dv = (aP.xyz - uCamB) / max(dist, 1e-3);
            vSk = vec4(-dv.x, max(dv.y, 0.), dv.z, 0.96 * uVeil * smoothstep(40., 220., dist)); float r = max(aQ.w, dist * 0.0021);                // never thinner than a pixel and a half
            float t = -position.y; vec3 p = aP.xyz + vec3(position.x * r, position.y * aP.w, position.z * r);
            vN = normalize(vec3(normal.x, 0.15, normal.z)); vQ = aQ; vT = t;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform float uTime; uniform vec3 uKey;\n` + SKY + FOGF + /* glsl */`varying vec3 vN; varying vec4 vQ; varying float vT; varying vec4 vSk;
          void main(){ vec3 N = normalize(vN); float nl = dot(N, uSun);
            float sh = clamp(-vQ.y, 0., 1.), key = max(smoothstep(-0.3, 0.6, nl), vQ.y) * vQ.z * (1. - sh);
            vec3 c = mix(mix(mix(cCool * 1.7, cCream, 0.5) * (0.5 + 0.4 * vQ.z), mix(cCool * 1.5, cCream, 0.3) * (0.42 + 0.3 * vQ.z), sh), cCream * mix(vec3(1.), uKey, 0.5) * 1.05, key) * (0.8 + 0.3 * vT);
            float tw = 0.5 + 0.5 * sin(uTime * (1.3 + 2. * vQ.x) + vQ.x * 60.); c += mix(uKey, vec3(1.), 0.7) * 1.1 * smoothstep(0.86, 1., vT) * tw * tw * (0.3 + 0.7 * key);   // a bead of melt at the tip
            gl_FragColor = vec4(c * (1. - 0.3 * uRainDim), 1.);
            #include <fog_fragment>
            gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor * 0.9, skyCol(normalize(vSk.xyz + vec3(0., 1e-4, 0.))), 0.8), vSk.w);
          }` });
      const ici = new THREE.Mesh(g, mat); ici.name = 'icicles'; ici.frustumCulled = false; B.add(ici); veiled.push(ici);
    }
    await ctx.yield();
    //@@HEAD
    await ctx.yield();

    // ---- things afloat: pancake floes, crumbs and rain-cups combed into windrows down the wind ---
    const seatU = { value: new THREE.Vector2(SEAT[0], SEAT[2]) };
    const windDir = new THREE.Vector2(0.9, 6.5).normalize(), windPerp = new THREE.Vector2(windDir.y, -windDir.x);
    const lathe = (prof, seg, lobes, amp) => {                    // prof: [r, y, tint]
      const pos = [], tint = [], idx = [], R = prof.length;
      for (let i = 0; i < R; i++) for (let s = 0; s < seg; s++) {
        const a = s / seg * Math.PI * 2, r = prof[i][0] * (1 + amp * Math.cos(a * lobes) * Math.min(1, prof[i][0] * 1.6));
        pos.push(Math.cos(a) * r, prof[i][1], Math.sin(a) * r); tint.push(prof[i][2]);
      }
      for (let i = 0; i < R - 1; i++) for (let s = 0; s < seg; s++) {
        const a = i * seg + s, b = i * seg + (s + 1) % seg, c = a + seg, d = b + seg;
        if (prof[i][0] > 0) idx.push(a, b, c); idx.push(b, d, c);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 1)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    const floatMat = new THREE.ShaderMaterial({
      uniforms: U({ uSeat: seatU, uLift: { value: new THREE.Vector4(0, 0, -99, 0) } }), fog: true,
      vertexShader: HASH + FOGV + /* glsl */`
        attribute vec4 aPos; attribute vec2 aKind; attribute float aTint; uniform vec2 uSeat; uniform vec4 uLift;
        varying vec3 vN; varying vec3 vT; varying vec3 vW;
        void main(){
          vec2 c = aPos.xy; vec2 hl = vec2(-(c.x - uSeat.x), c.y - uSeat.y);     // the hero's sea lives in world space
          float h = swellH(hl); vec2 g = swellG(hl); g.x = -g.x;
          float cs = cos(aPos.w), sn = sin(aPos.w); float sd = aKind.y;
          vec3 p = vec3(position.x * cs - position.z * sn, position.y, position.x * sn + position.z * cs) * aPos.z;
          vec3 n = vec3(normal.x * cs - normal.z * sn, normal.y, normal.x * sn + normal.z * cs);
          vec2 nod = g + 0.06 * vec2(sin(uTime * 1.7 + sd * 40.), cos(uTime * 1.3 + sd * 23.));
          // a cup dips and rings when a drop lands in it
          float T = 3. + 4. * sd, tau = mod(uTime + sd * 31., T);
          float dip = aKind.x * (-0.10 * exp(-tau * 1.6) * cos(tau * 8.) * step(1.5, aKind.x + 1.) );
          // the rare great ring lifts everything as it passes
          float rr = length(c - uLift.xy) - uLift.z; float lift = uLift.w * exp(-rr * rr * 0.02);
          p.y += dot(nod, p.xz) + dip * step(0.5, aKind.x) + lift + 0.03 * sin(uTime * 2.1 + sd * 17.);
          vec3 w = vec3(c.x + p.x, h + p.y, c.y + p.z);
          vN = normalize(n + vec3(-nod.x, 0., -nod.y)); vT = vec3(aTint, aKind.x, sd); vW = w;
          vec4 mvPosition = modelViewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: SKY + GLSL_LIT + FOGF + /* glsl */`
        varying vec3 vN; varying vec3 vT; varying vec3 vW;
        void main(){
          vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
          float cup = step(0.5, vT.y);
          vec3 alb = mix(cCream * (0.6 + 0.14 * vT.z), cCream * 0.8, vT.x);            // floe: bright rolled rim
          alb = mix(alb, mix(cCream * 0.74, cRust * 1.15, smoothstep(0.72, 0.95, vT.x)), cup);   // cup: wax, rust rim
          alb *= 1.;
          vec3 c = litCol(alb, N, 0.75 + 0.25 * vT.x, 0.35 * cup);
          gl_FragColor = vec4(c, 1.);
          #include <fog_fragment>
        }`,
    });
    const afloat = (geo, list, kind) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = geo.index;
      for (const k of ['position', 'normal', 'aTint']) g.setAttribute(k, geo.attributes[k]);
      const aPos = new Float32Array(list.length * 4), aKind = new Float32Array(list.length * 2);
      list.forEach((q, i) => { aPos.set(q, i * 4); aKind[i * 2] = kind; aKind[i * 2 + 1] = (q[0] * 12.9898 + q[1] * 78.233) % 1 < 0 ? ((q[0] * 12.9898 + q[1] * 78.233) % 1) + 1 : (q[0] * 12.9898 + q[1] * 78.233) % 1; });
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 4)); g.setAttribute('aKind', new THREE.InstancedBufferAttribute(aKind, 2));
      g.instanceCount = list.length; g.boundingSphere = big;
      const m = new THREE.Mesh(g, floatMat); m.frustumCulled = false; B.add(m); disposables.push(geo); return m;
    };
    {
      const fr = rng.fork('afloat');
      // a point in a windrow: rows 15 m apart across the wind, 2 m wide, wandering a little
      const rowPoint = (spread) => {
        for (let k = 0; k < 30; k++) {
          const far2 = fr() < 0.36, z = far2 ? fr.range(285, 430) : fr.range(-25, 405), near = far2 ? fr() < 0.85 : fr() < 0.6;
          let x = (near ? fr.range(-55, 55) : fr.range(-190, 190)) + (z > 95 ? -Math.min(50, (z - 95) * 0.45) + Math.max(0, z - 215) * 0.5 : 0);
          const q = x * windPerp.x + z * windPerp.y, al = x * windDir.x + z * windDir.y, row = Math.round(q / 15);
          const q2 = row * 15 + 2.6 * noise.n2(al * 0.02, row * 3.3) + fr.gauss() * spread;
          x += windPerp.x * (q2 - q); const zz = z + windPerp.y * (q2 - q);
          const n = nearB(x, zz);
          if (n.dist < 6.5 && n.y < 9) continue;                    // (nothing afloat under the lens: a floe cut by the bottom of the frame is a pale blank)
          if (Math.hypot(x, zz) < 4) continue;
          return [x, zz];
        }
        return [fr.range(-60, 60), fr.range(100, 300)];
      };
      const floes = [], cups = [], crumbs = [];
      const nF = Math.round(400 * detail * dens), nC = Math.round(500 * detail), nK = Math.round(1700 * detail * dens);
      const bigFloes = [];
      for (let i = 0; i < nF; i++) { if (i % 50 === 49) await ctx.yield(); const p = rowPoint(0.8), big2 = fr() < 0.2 && nearB(p[0], p[1]).dist > 11; (big2 ? bigFloes : floes).push([p[0], p[1], big2 ? fr.range(0.9, 1.8) : fr.range(0.42, 0.9), fr.range(0, 6.28)]); }
      for (let i = 0; i < nC; i++) { if (i % 50 === 49) await ctx.yield(); const p = rowPoint(0.6); cups.push([p[0], p[1], fr.range(0.22, 0.62), fr.range(0, 6.28)]); }
      // the drift line under the headland: flotsam gathered along its foot, crossing the view at u 0.5-0.62
      const shore = rng.fork('shoreline');
      for (let i = 0; i < 46; i++) { const x = shore.range(-46, 120), z = 384 + 7 * Math.sin(x * 0.045 + 1) - 0.1 * Math.max(0, x - 40) + shore.gauss() * 1.6, k = shore();
        if (k < 0.32) bigFloes.push([x, z, shore.range(1.5, 2.5), shore.range(0, 6.28)]); else if (k < 0.62) cups.push([x, z, shore.range(0.6, 1.1), shore.range(0, 6.28)]); else floes.push([x, z, shore.range(0.4, 0.9), shore.range(0, 6.28)]); }
      for (let i = 0; i < nK * 0.14; i++) { if (i % 50 === 49) await ctx.yield(); const p = rowPoint(1.1); crumbs.push([p[0], p[1], fr.range(0.14, 0.3), fr.range(0, 6.28)]); }
      afloat(lathe([[0, 0.05, 0.1], [0.55, 0.05, 0.05], [0.84, 0.06, 0.15], [0.94, 0.14, 1], [1.0, 0.09, 0.9], [0.98, -0.12, 0.3]], 14, 5, 0.06), bigFloes, 0); await ctx.yield();
      afloat(lathe([[0, 0.05, 0.1], [0.8, 0.06, 0.1], [0.94, 0.13, 1], [1.0, 0.08, 0.9], [0.98, -0.12, 0.3]], 7, 4, 0.05), floes, 0); await ctx.yield();
      afloat(lathe([[0, -0.03, 0.2], [0.5, 0.0, 0.3], [0.85, 0.22, 0.6], [1.0, 0.36, 1], [1.05, 0.3, 1], [0.7, -0.1, 0.4]], 12, 6, 0.16), cups, 1); await ctx.yield();
      afloat(lathe([[0, 0.5, 0.9], [1, 0.1, 0.5], [0.7, -0.5, 0.2]], 4, 4, 0), crumbs, 0);
    }
    await ctx.yield();

    // ---- the shingle spit off the entry, running away to port -----------------------------------
    {
      const NL = 150, NW = 22, pos = [], idx = [];
      for (let i = 0; i <= NL; i++) for (let j = 0; j <= NW; j++) {
        const t = i / NL, s = j / NW * 2 - 1;
        const cx = -64 - 200 * t + 5 * Math.sin(t * 5), cz = 26 + 78 * t * t + 16 * t + 4 * Math.sin(t * 9 + 1);   // (never cut by the frame's edge at the entry)
        const wdt = (11 + 5 * noise.n2(t * 6, 2.2)) * (0.45 + 0.55 * Math.sin(Math.min(1, t * 6) * Math.PI / 2));
        const x = cx + 0.35 * s * wdt, z = cz + s * wdt;
        const prof = Math.pow(Math.max(0, 1 - s * s), 0.7);
        const y = -3.5 + (4.5 + 0.45 * noise.fbm2(x * 0.08, z * 0.08, 3)) * Math.pow(prof, 0.6) + 0.12 * noise.n2(x * 0.7, z * 0.7);
        pos.push(x, Math.min(y, nearB(x, z).y - 3.2), z);
      }
      for (let i = 0; i < NL; i++) for (let j = 0; j < NW; j++) { const a = i * (NW + 1) + j, b = a + 1, c = a + NW + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const mat = new THREE.ShaderMaterial({
        uniforms: U(), fog: true, side: THREE.DoubleSide,
        vertexShader: FOGV + `varying vec3 vN, vP; void main(){ vN = normal; vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
        fragmentShader: `uniform vec3 uCamB;\n` + SKY + GLSL_LIT + FOGF + /* glsl */`
          varying vec3 vN, vP;
          vec2 h22(vec2 p){ vec3 a = fract(p.xyx * vec3(0.1031, 0.1030, 0.0973)); a += dot(a, a.yzx + 33.33); return fract((a.xx + a.yz) * a.zy); }
          // rounded pebbles: nearest cell centre gives a little dome normal and its own shade
          vec4 pebbles(vec2 p){ vec2 i = floor(p), f = fract(p); float md = 9.; vec2 mo = vec2(0.); float id = 0.;
            for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + 0.15 + 0.7 * h22(i + o) - f;
              float d = dot(r, r); if (d < md) { md = d; mo = r; id = h22(i + o + 7.).x; } }
            return vec4(mo, sqrt(md), id); }
          void main(){
            vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
            float dist = length(vP - uCamB); float nf = 1. - smoothstep(25., 90., dist);
            vec4 a = pebbles(vP.xz * 2.6), b = pebbles(vP.xz * 0.9 + 3.);
            N = normalize(N + vec3(-a.x, 0., -a.y) * 0.9 * nf + vec3(-b.x, 0., -b.y) * 0.22);
            vec3 alb = mix(mix(cDeep, cCool, 0.35) * 0.6, cRust * 0.7, 0.3 + 0.4 * a.w * nf + 0.15 * b.w); alb = mix(alb, cDeep * 0.5, 0.5 * smoothstep(0.42, 0.62, a.z) * nf + 0.2 * smoothstep(0.5, 0.75, b.z));   // dark wet shingle: the dark note of the opening
            alb = mix(cDeep * 0.4, alb, smoothstep(-0.5, 0.25, vP.y));               // wet and dark at the waterline
            vec3 c = litCol(alb, N, 0.6 + 0.4 * (1. - smoothstep(0.25, 0.7, a.z * nf)), 0.) + alb * cHaze * 0.12 * (1. - 0.6 * uRainDim);
            gl_FragColor = vec4(c, 1.);
            #include <fog_fragment>
          }`,
      });
      await ctx.yield();
      const spit = new THREE.Mesh(g, mat); spit.name = 'spit'; spit.frustumCulled = false; B.add(spit);
    }
    await ctx.yield();

    // ---- sail-rays: a membrane wing on seven ribs a side, a slim body, a whip (or forked) tail ----
    // One instanced draw. Per instance: aP (xyz position, w scale), aF (forward xyz, bank), aA (flap
    // phase, fold 0..1, flap amplitude, seed). Wings bend, fold and ripple in the vertex shader.
    const RAY_MAX = 8 + 1 + 14 + 8;                                // + the wheelers' images in the sea
    const rayP = new Float32Array(RAY_MAX * 4), rayF = new Float32Array(RAY_MAX * 4), rayA = new Float32Array(RAY_MAX * 4);
    let rayGeo;
    {
      const pos = [], aw = [], idx = [];
      const v = (x, y, z, a, r, part, t) => { pos.push(x, y, z); aw.push(a, r, part, t); return pos.length / 3 - 1; };
      const NA = 24, NR = 8, ribLen = (a) => 12.2 * (1 - 0.56 * Math.pow(a, 1.25)), ribAng = (a) => (14 - 96 * a) * Math.PI / 180;
      for (const sg of [1, -1]) {
        const base = pos.length / 3;
        for (let i = 0; i <= NA; i++) {
          const a = i / NA, f = (a * 6) % 1, L = ribLen(a) * (1 - 0.11 * Math.sin(Math.PI * f)), th = ribAng(a);
          for (let j = 0; j <= NR; j++) { const r = j / NR, rr = 0.5 + L * r; v(sg * (0.2 + Math.cos(th) * rr), 0, 1.2 + Math.sin(th) * rr, a, r, 0, sg); }
        }
        for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) { const a = base + i * (NR + 1) + j, b = a + 1, c = a + NR + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
        // fringe: tendrils trailing from the scalloped edge, a bead at each tip
        for (let i = 3; i <= NA; i++) {
          const a = i / NA, L = ribLen(a) * (1 - 0.11 * Math.sin(Math.PI * ((a * 6) % 1))), th = ribAng(a), rr = 0.5 + L;
          const x = sg * (0.2 + Math.cos(th) * rr), z = 1.2 + Math.sin(th) * rr, len = 1.1 + 0.9 * ((i * 7) % 5) / 4, w = 0.09;
          const dx = sg * Math.cos(th - 0.9), dz = Math.sin(th - 0.9);
          const q = []; for (let k = 0; k <= 2; k++) { const t = k / 2; q.push(v(x + dx * len * t - w, 0, z + dz * len * t, a, 1, 2, t), v(x + dx * len * t + w * (k === 2 ? 2.2 : 1), 0, z + dz * len * t, a, 1, 2, t)); }
          idx.push(q[0], q[1], q[2], q[1], q[3], q[2], q[2], q[3], q[4], q[3], q[5], q[4]);
        }
      }
      // body: a flattened spindle, nose at +3.6, jaw scoop under the front; then the tail(s)
      { const NB = 9, NS = 8, base = pos.length / 3;
        for (let i = 0; i <= NB; i++) { const t = i / NB, z = 3.6 - 7.2 * t, rad = 0.72 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.93 + 0.05)), 0.7) + 0.06;
          for (let s = 0; s < NS; s++) { const a = s / NS * Math.PI * 2, jaw = Math.sin(a) < -0.3 && t < 0.3 ? 1 : 0;
            v(Math.cos(a) * rad * 1.15, Math.sin(a) * rad * (Math.sin(a) > 0 ? 0.75 : 0.5) - jaw * 0.25 * (1 - t / 0.3), z, t, jaw, 1, Math.sin(a)); } }
        for (let i = 0; i < NB; i++) for (let s = 0; s < NS; s++) { const a = base + i * NS + s, b = base + i * NS + (s + 1) % NS, c = a + NS, d = b + NS; idx.push(a, c, b, b, c, d); }
      }
      for (const side of forkTail ? [1, -1] : [0]) { const NT = 10, base = pos.length / 3;
        for (let i = 0; i <= NT; i++) { const t = i / NT, w = 0.22 * (1 - 0.8 * t) + 0.04;
          for (let s = 0; s < 3; s++) { const a = s / 3 * Math.PI * 2; v(Math.cos(a) * w, Math.sin(a) * w, -3.4 - (forkTail ? 9 : 12) * t, t, side, 3, 0); } }
        for (let i = 0; i < NT; i++) for (let s = 0; s < 3; s++) { const a = base + i * 3 + s, b = base + i * 3 + (s + 1) % 3, c = a + 3, d = b + 3; idx.push(a, c, b, b, c, d); }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 4)); g.setIndex(idx);
      g.computeVertexNormals();
      for (const [n, arr] of [['aP', rayP], ['aF', rayF], ['aA', rayA]]) { const at = new THREE.InstancedBufferAttribute(arr, 4); at.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, at); }
      g.instanceCount = 0; g.boundingSphere = big; rayGeo = g;
      const mat = new THREE.ShaderMaterial({
        uniforms: U({ uSeat: seatU }), fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: true,
        vertexShader: HASH + `uniform vec3 uCamB; uniform vec2 uSeat;\n` + FOGV + /* glsl */`
          attribute vec4 aW, aP, aF, aA; varying vec4 vW; varying vec3 vN, vV; varying vec2 vS; varying float vM;
          vec3 bend(vec3 p){
            float s = abs(p.x), sg = p.x < 0. ? -1. : 1., sn = clamp(s / 12.5, 0., 1.);
            float th = aA.z * (sin(aA.x - 1.7 * sn) * (0.25 + 0.75 * sn) + 0.18);
            th = mix(th, -1.42 - 0.22 * sin(p.z * 0.9 + aA.w * 9.), aA.y) * pow(max(sn, 1e-4), 0.75 - 0.4 * clamp(aA.y, 0., 1.));
            float edge = sn * sn * (1. - aA.y);
            return vec3(sg * s * cos(th), s * sin(th) + 0.22 * edge * sin(aA.x * 3. + p.z * 1.1 + s * 0.5), p.z - 0.6 * edge * cos(aA.x - 1.2));
          }
          void main(){
            vec3 p = position, n = normal; float part = aW.z;
            if (part < 0.5 || part > 1.5 && part < 2.5) {
              vec3 q = bend(p); vec3 dx = bend(p + vec3(0.25, 0., 0.)) - q, dz = bend(p + vec3(0., 0., 0.25)) - q;
              n = normalize(cross(dz, dx) + vec3(0., 1e-4, 0.)); p = q;
              if (part > 1.5) { float t = aW.w; p.y -= t * t * (0.9 + 0.5 * sin(uTime * 1.3 + aW.x * 40.)); p.x += 0.2 * t * sin(uTime * 2.1 + aW.x * 55.); }
            } else if (part > 2.5) {
              float t = aW.x; p.x += aW.y * t * (0.4 + 2.6 * t) + 1.5 * t * t * sin(uTime * 1.1 + aA.w * 20. - t * 3.) * (1. - aA.y);
              p.y += 0.8 * t * t * sin(aA.x - 2.5 - t * 2.) * (1. - aA.y) - aA.y * t * t * 1.5;
            } else { p.y += 0.12 * sin(aA.x - 0.6) * aA.z; }
            // instance frame: forward F, banked right R, up Uv
            vec3 F = normalize(aF.xyz + vec3(0., 0., 1e-5)); vec3 R0 = normalize(cross(vec3(0., 1., 0.), F) + vec3(1e-5, 0., 0.)); vec3 U0 = cross(F, R0);
            float cb = cos(aF.w), sb = sin(aF.w); vec3 R = R0 * cb + U0 * sb, Uv = U0 * cb - R0 * sb;
            vec3 w = aP.xyz + (R * p.x + Uv * p.y + F * p.z) * abs(aP.w);
            vN = R * n.x + Uv * n.y + F * n.z; vW = aW; vS = vec2(aA.w, abs(position.x)); vM = 0.;
            if (aP.w < 0.) {                                           // its image in the sea, laid on the surface along the line of sight
              float sw = swellH(vec2(-(w.x - uSeat.x), w.z - uSeat.y)); w.y = 2. * sw - w.y; vN.y = -vN.y; vM = 1.;
              float f = clamp((uCamB.y - sw - 0.06) / max(uCamB.y - w.y, 0.05), 0., 1.); w = uCamB + (w - uCamB) * f; }
            vV = w;
            vec4 mvPosition = modelViewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
            gl_Position.z -= vM * 0.0006 * gl_Position.w;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform float uTime, uVeil, uIn; uniform vec3 uCamB, cTeal;\n` + SKY + GLSL_LIT + FOGF + /* glsl */`
          varying vec4 vW; varying vec3 vN, vV; varying vec2 vS; varying float vM;
          float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
          void main(){
            vec3 Nup = normalize(vN + vec3(0., 1e-4, 0.)); vec3 V = normalize(uCamB - vV + vec3(0., 1e-4, 0.));
            float facing = dot(Nup, V); vec3 N = facing < 0. ? -Nup : Nup;
            float part = vW.z; vec3 c;
            if (part < 0.5) {
              float a6 = vW.x * 6.; float dr = abs(fract(a6 + 0.5) - 0.5); float fw = fwidth(a6) * 1.3;
              float rib = 1. - smoothstep(0.035 + fw * 0.5, 0.06 + fw, dr);
              float vein = smoothstep(0.75, 1., abs(sin(a6 * 9.42 + 1.3 * sin(vW.y * 9.)))) * 0.5 + smoothstep(0.86, 1., abs(sin(vW.y * 26. + 3. * sin(a6 * 6.28)))) * 0.35;
              vein *= 1. - smoothstep(0.02, 0.2, fw);
              float inRain = clamp(uRainDim / 0.85, 0., 1.);
              vec3 amber = mix(mix(cEmber, cRust, 0.22) * vec3(1.08, 0.9, 0.7), mix(cEmber, cHaze, 0.62), inRain) * (1.0 + 0.25 * sin(a6 * 6.28 + 1.) * vW.y);
              vec3 top = litCol(amber * 0.55, N, 1., 0.);
              // seen against the light the membrane glows like a lampshade
              vec3 thru = amber * (uKey * (0.6 + 1.0 * smoothstep(-0.2, 0.7, dot(Nup, uSun))) + mix(cHaze, cEmber, uRainDim) * 0.5) * (1. - 0.2 * uRainDim);
              c = mix(top, thru, facing < 0. ? 0.92 : 0.38);
              // drops landing on the wing: brief dark dimples that roll for the edge
              vec2 dp = vec2(a6 * 2.4, vW.y * 7. - uTime * 0.5 * (0.5 + h21(vec2(floor(a6 * 2.4), vS.x)))); vec2 dc = fract(dp) - 0.5;
              float dim = (1. - smoothstep(0.08, 0.2, length(dc))) * step(0.55, h21(floor(dp) + vS.x * 7.));
              c *= 1. - 0.5 * dim * (1. - smoothstep(0.02, 0.15, fw)); c *= 1. - 0.4 * vein;
              c = mix(c, cUmber * 0.35, rib * 0.9);
              c *= 0.55 + 0.45 * smoothstep(0.0, 0.14, vW.y);                 // darker where it meets the body
              // nine teal spots along the leading edge
              vec2 sq = vec2((vW.x - 0.03) * 34., fract(vW.y * 9.4 + 0.2) - 0.5);
              c += cTeal * 2.4 * (1. - smoothstep(0.12, 0.3, length(sq))) * step(0.08, vW.y);
            } else if (part < 1.5) {
              c = litCol(mix(cUmber, cEmber, 0.25 + 0.2 * vW.w), N, 1., 0.) * 0.8;
              c += cTeal * 1.6 * smoothstep(0.2, 0.5, vW.y) * (1. - smoothstep(0.5, 0.85, vW.y));   // the jaw's scoop is lined teal
            } else if (part < 2.5) {
              c = mix(cUmber * 0.5, cEmber * 0.8, vW.w) + uKey * 1.6 * smoothstep(0.8, 1., vW.w);
            } else { c = litCol(mix(cUmber, cEmber, 0.2), N, 1., 0.) * 0.7; }
            // seen from outside through the rain, a ray in the shaft is veiled; its image in the sea is darker
            float veil = 0.55 * smoothstep(60., 200., length(uCamB - vV)) * (1. - smoothstep(95., 130., length(vV.xz - vec2(-50., 215.))));
            c = mix(c, mix(mix(cEmber, cHaze, 0.3), cCool * 1.6, 0.4) * 0.6, veil);
            float al = 1.; vec3 dv = vV - uCamB; float dl = max(length(dv), 1e-3); dv /= dl;
            if (vM > 0.5) {                                               // a reflection: darker than the ray, broken by the rings, and never close to the lens (where the crowns stand)
              c *= 0.5; al = 0.34 * smoothstep(16., 42., dl) * (0.62 + 0.38 * sin(vV.x * 2.3 + 2. * sin(vV.z * 1.7 + uTime * 0.9) + uTime * 0.6));
              if (al < 0.01) discard; }
            gl_FragColor = vec4(c, al);
            #include <fog_fragment>
            vec3 dw = vec3(-dv.x, max(dv.y, 0.), dv.z);
            float lost = 0.96 * uVeil * smoothstep(40., 220., dl) * smoothstep(120., 170., length(vV.xz - vec2(-50., 215.)));
            gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor * 0.9, skyCol(dw / max(length(dw), 1e-4)), 0.8), lost); gl_FragColor.a *= 1. - lost / 0.96;
            if (gl_FragColor.a < 0.02) discard;
          }`,
      });
      const rays = new THREE.Mesh(g, mat); rays.name = 'sail-rays'; rays.frustumCulled = false; rays.renderOrder = 0.6; B.add(rays);   // after the curtain, so the rain does not bury them
    }
    await ctx.yield();

    // ---- the rays' flights: ambient wheeling on time, three scripted passes keyed to u ----------
    const pB = (u, out) => { path.pointAt(u, out); out.x = -out.x; return out; };       // path in brief space
    // Catmull-Rom through [u, value] keys (smooth velocity, no stutter at the keys)
    const keyf = (u, ks) => {
      const n = ks.length; if (u <= ks[0][0]) return ks[0][1]; if (u >= ks[n - 1][0]) return ks[n - 1][1];
      let i = 0; while (i < n - 2 && u > ks[i + 1][0]) i++;
      const t = (u - ks[i][0]) / (ks[i + 1][0] - ks[i][0]), p0 = ks[Math.max(0, i - 1)][1], p1 = ks[i][1], p2 = ks[i + 1][1], p3 = ks[Math.min(n - 1, i + 2)][1];
      return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    };
    const rr = rng.fork('rays');
    const wheel = []; for (let i = 0; i < 8; i++) wheel.push({ R: 30 + 7.5 * i + rr.range(-3, 3), h: 15 + 6.5 * ((i * 3) % 5) + rr.range(0, 4), ph: rr.range(0, 6.28), dir: i % 2 ? 1 : -1, sp: rr.range(6.5, 9.5), seed: rr() });
    const perch = new THREE.Vector3(40, 104, cliffZ(40, 104) - 2.6);
    const vA = new THREE.Vector3(), vB2 = new THREE.Vector3(), vC = new THREE.Vector3(), vT = new THREE.Vector3(), vS2 = new THREE.Vector3();
    const setRay = (i, p, f, bank, phase, fold, amp, seed) => {
      rayP[i * 4] = p.x; rayP[i * 4 + 1] = p.y; rayP[i * 4 + 2] = p.z; rayP[i * 4 + 3] = 1;
      rayF[i * 4] = f.x; rayF[i * 4 + 1] = f.y; rayF[i * 4 + 2] = f.z; rayF[i * 4 + 3] = bank;
      rayA[i * 4] = phase; rayA[i * 4 + 1] = fold; rayA[i * 4 + 2] = amp; rayA[i * 4 + 3] = seed;
    };
    const ambient = (i, time, out, fwd) => {
      const w = wheel[i], a = w.ph + w.dir * w.sp / w.R * time;
      out.set(-50 + Math.cos(a) * w.R, w.h + 3 * Math.sin(time * 0.31 + i * 2.1), 215 + Math.sin(a) * w.R * 0.9);
      fwd.set(-Math.sin(a) * w.dir, 0.08 * Math.cos(time * 0.31 + i * 2.1), Math.cos(a) * w.dir * 0.9).normalize();
      return -w.dir * 0.32;
    };
    // a pass flown relative to the camera's own track: d metres ahead, lat metres to starboard, up metres above
    const along = (u, d, lat, up, out) => {
      pB(u + d / path.length, out); path.tangentAt(Math.min(1, Math.max(0, u + d / path.length)), vT); vT.x = -vT.x;
      const l = Math.hypot(vT.x, vT.z) || 1; out.x += vT.z / l * lat; out.z += -vT.x / l * lat; out.y += up; return out;
    };
    const OV = { d: [[0.30, -44], [0.338, -18], [0.353, 3], [0.37, 13], [0.40, 34], [0.44, 58], [0.5, 120]],
      lat: [[0.30, -24], [0.338, -10], [0.353, -4], [0.37, -1], [0.40, 3], [0.44, 14], [0.5, 40]],
      up: [[0.30, 16], [0.338, 9], [0.353, 7.2], [0.37, 6.8], [0.40, 8.5], [0.44, 4], [0.5, 16]] };
    // (it crosses from port to starboard and a little away from us, so the furrow it leaves lies across the view, whole, on its port side)
    const SK = { d: [[0.36, 110], [0.40, 74], [0.43, 50], [0.455, 38], [0.48, 34], [0.51, 42], [0.55, 62], [0.6, 85]],
      lat: [[0.36, -52], [0.40, -36], [0.43, -24], [0.455, -9], [0.48, 8], [0.51, 6], [0.55, -4], [0.6, -8]],   // (it keeps to port of the kite raft as we come out)
      up: [[0.36, 9], [0.40, -2.2], [0.45, -2.6], [0.49, -2.4], [0.52, 3], [0.56, 11], [0.6, 20]] };
    const perch2 = new THREE.Vector3(-11, 90, cliffZ(-11, 90) - 2.4), perch3 = new THREE.Vector3(-10, 110, cliffZ(-10, 110) - 2.4);
    // the herald: one of the wheelers comes on with us to the headland. At u 0.70 it crosses close ahead between the ring and the
    // fall, whole and lit against the dark chute; at u 0.79 it wheels before the dark niche above the ring; then away over the violet wall
    const HD = { d: [[0.56, 150], [0.61, 96], [0.66, 60], [0.70, 44], [0.74, 50], [0.79, 54], [0.84, 50], [1, 40]],
      lat: [[0.56, 60], [0.61, 38], [0.66, 24], [0.70, 16], [0.74, 8], [0.77, 11], [0.79, 2], [0.81, -10], [0.84, -16], [1, -20]],
      up: [[0.56, 30], [0.61, 22], [0.66, 15], [0.70, 12], [0.74, 13], [0.79, 18], [0.84, 26], [1, 30]] };
    const perchH = new THREE.Vector3(-22, 100, cliffZ(-22, 100) - 2.4);
    // the ray that lets go: it falls from its ledge into the line of flight (24 m ahead of the lens, upper left of
    // the ring, at u 0.87), opening as it comes, then lifts away over our port shoulder
    const DR = { d: [[0.8, 34], [0.84, 38], [0.87, 40], [0.9, 33], [0.918, 20], [0.932, 4], [0.95, -14], [1, -40]], lat: [[0.8, -8], [0.84, -6], [0.87, -3], [0.9, -6], [0.918, -14], [0.932, -24], [0.95, -30], [1, -40]],   // (it stoops: seen from behind and above, its whole planform shows)
      up: [[0.8, 12], [0.84, 22], [0.87, 9.5], [0.9, 5.5], [0.918, 13], [0.932, 23], [0.95, 30], [1, 34]], fold: [[0.798, 1], [0.825, 0.8], [0.855, 0.45], [0.9, 0]] };
    const drAt = (u, out) => { along(u, keyf(u, DR.d), keyf(u, DR.lat), keyf(u, DR.up), vC); const w = sstep(0.8, 0.85, u); return out.copy(perch).lerp(vC, w * w * (3 - 2 * w)); };
    const scripted = (K, u, out, fwd) => {
      along(u, keyf(u, K.d), keyf(u, K.lat), keyf(u, K.up), out);
      const u2 = u + 0.004; along(u2, keyf(u2, K.d), keyf(u2, K.lat), keyf(u2, K.up), vS2); fwd.copy(vS2).sub(out);   // (along() uses vT as scratch: never pass it in)
      if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, 1); fwd.normalize();
    };
    const GR = { d: [[0, 75], [0.04, 48], [0.08, 28], [0.12, 36], [0.16, 38], [0.2, 60], [0.25, 96]], lat: [[0, 20], [0.04, 8], [0.08, -6], [0.12, -17], [0.16, -4], [0.2, 14], [0.25, 10]],
      up: [[0, 20], [0.04, 12], [0.08, 8], [0.12, 10], [0.16, 13.5], [0.2, 14], [0.25, 15]] };
    const GR_BANK = -0.65;
    const skim = { pos: new THREE.Vector3(), fwd: new THREE.Vector3(0, 0, 1), on: 0 };
    const ovWorld = new THREE.Vector3(50, 30, 215), skWorld = new THREE.Vector3(50, 30, 215), drWorld = new THREE.Vector3(-40, 104, 500);
    // the fourteen that hang folded on ledges beside the notch (written once)
    for (let k = 0; k < 14; k++) {
      const left = k % 2 === 0, x0 = left ? rr.range(4, 33) : rr.range(106, 136), y0 = rr.range(76, 150);
      // four hang apart on the violet wall to port of the notch, whole in frame as the gaze turns to them at u 0.79 (the fifth there
      // is the one that lets go); the rest are a far colony along the gold face to starboard, where the two flyers go to roost
      const near = k < 4, x = near ? [6, 17, 28, 17][k] : 560 + (x0 - (left ? 4 : 106)) * 6.5, y = near ? [97, 110, 96, 85][k] : 70 + (y0 - 76) * 0.9, sc = near ? 1.3 : 1.3;
      vA.set(x, y, cliffZ(x, y) - 1.9 * sc - 0.4); vB2.set(rr.range(-0.15, 0.15), 0.93, -0.36).normalize();
      setRay(nRays + 1 + k, vA, vB2, rr.range(-0.2, 0.2), rr.range(0, 6), 1, 0.12, rr()); rayP[(nRays + 1 + k) * 4 + 3] = sc;
    }
    const roostPh = []; for (let k = 0; k < 14; k++) roostPh.push(rayA[(nRays + 1 + k) * 4]);
    rayGeo.instanceCount = nRays + 1 + 14 + nRays;
    // while we come in (u < 0.3) three of them wheel in tight banked circles about the axis, planform to the lens
    const SHOW = [{ c: [-50, 24, 196], R: 10, sp: 0.30, dir: 1 }, { c: [-30, 15, 204], R: 11, sp: 0.34, dir: -1 }, { c: [-48, 34, 226], R: 15, sp: 0.26, dir: 1 }];
    updaters.push((dt, time, camera, u) => {
      const flap = time * Math.PI * 2 / 5;
      for (let i = 0; i < nRays; i++) {
        let bank = ambient(i, time, vA, vB2), fold = 0, amp = 0.5, ph = flap + i * 1.9;
        if (i === 5) { const k = 1 - 0.25 * sstep(0.2, 0.235, u) * (1 - sstep(0.265, 0.3, u)); vA.x = -50 + (vA.x + 50) * k; vA.z = 215 + (vA.z - 215) * k; }   // the outermost wheels a little closer as the curtain fills the frame, so it is whole in it
        if (u > 0.28 && u < 0.56) {                                // inside the wheel the flock veers round the lens, far enough off that each is whole in frame
          const dx = vA.x - camB.x, dz = vA.z - camB.z, d = Math.hypot(dx, dz) || 1, need = Math.max(45, 5 * (vA.y - camB.y)), kk = sstep(0.28, 0.33, u) * (1 - sstep(0.52, 0.56, u));
          if (d < need) { const f = 1 + (need / d - 1) * kk; vA.x = camB.x + dx * f; vA.z = camB.z + dz * f; }
        }
        if (i >= 1 && i <= 3 && u < 0.42) {
          const S2 = SHOW[i - 1], w = 1 - sstep(0.36, 0.42, u), a = wheel[i].ph + S2.dir * S2.sp * time, sh = sstep(0.26, 0.335, u);
          vC.set(S2.c[0] + 10 * sh + Math.cos(a) * S2.R, S2.c[1] + (14 + 2 * i - S2.c[1]) * sh + 2 * Math.sin(time * 0.4 + i), S2.c[2] + 68 * sh + Math.sin(a) * S2.R); vT.set(-Math.sin(a) * S2.dir, 0, Math.cos(a) * S2.dir);
          vA.lerp(vC, w); vB2.lerp(vT, w).normalize(); bank += (-S2.dir * 1.1 - bank) * w;
        }
        if (i === 2 && u < 0.27) { const w = 1 - sstep(0.2, 0.265, u); scripted(GR, u, vC, vT); vA.lerp(vC, w); vB2.lerp(vT, w).normalize(); bank += (GR_BANK * (1 - 2 * sstep(0.112, 0.138, u)) - bank) * w; }
        if (i === 0) {                                             // the overtaker, 6.8 m above the lens
          const w = sstep(0.275, 0.305, u);
          if (w > 0) { scripted(OV, u, vC, vT);
            const land = sstep(0.5, 0.67, u);                               // it goes on ahead of us to the headland and hangs itself up in the colony
            if (land > 0) { vS2.copy(vC); vC.lerp(perch3, land); vT.copy(perch3).sub(vS2).normalize().lerp(vS2.set(-0.1, 0.93, -0.36), sstep(0.625, 0.67, u)).normalize(); }
            vA.lerp(vC, w); vB2.lerp(vT, w).normalize(); bank *= 1 - w; bank += w * 0.5 * sstep(0.39, 0.45, u) * (1 - sstep(0.47, 0.52, u)); fold = sstep(0.635, 0.675, u); amp = (0.5 - 0.12 * w) * (1 - 0.75 * fold); }
        } else if (i === 1) {                                      // the drinker, jaw in the sea
          const w = sstep(0.34, 0.38, u);
          if (w > 0) { scripted(SK, u, vC, vT); const low = sstep(0.395, 0.415, u) * (1 - sstep(0.49, 0.515, u));
            vC.y = Math.max(vC.y, 1.25); vC.y += (1.3 - vC.y) * low; vT.y *= 1 - low;
            const land = sstep(0.54, 0.72, u);                              // across the face to its ledge in the colony
            if (land > 0) { vS2.copy(vC); vC.lerp(perch2, land); vT.copy(perch2).sub(vS2).normalize().lerp(vS2.set(0.1, 0.93, -0.36), sstep(0.67, 0.72, u)).normalize(); }
            vA.lerp(vC, w); vB2.lerp(vT, w).normalize(); bank *= 1 - w; fold = -0.24 * low + sstep(0.685, 0.725, u); amp = (0.5 - 0.36 * low) * (1 - 0.75 * sstep(0.685, 0.725, u)); skim.on = low * w; skim.pos.copy(vA); skim.fwd.copy(vB2); }
          else skim.on = 0;
        }
        if (i >= 2) { const wl = sstep(0.36, 0.41, u);                   // down the lane the rest of the flock wheels ahead of us, whole in frame, never at the lens's shoulder
          if (wl > 0) { along(u, 96, -24, 0, vC); const a = wheel[i].ph + wheel[i].dir * 0.22 * time, R = 16 + 5 * (i % 3);
            vC.x += Math.cos(a) * R; vC.z += Math.sin(a) * R; vC.y = 13 + 3.6 * (i - 2) + 2 * Math.sin(time * 0.4 + i); vT.set(-Math.sin(a) * wheel[i].dir, 0, Math.cos(a) * wheel[i].dir);
            if (i !== 3) { const go = sstep(0.445, 0.505, u);                // ... and as we come out it goes off round the cape to port, small over the open sea (it never doubles back past the lens)
              if (go > 0) { vS2.set(-262 + Math.cos(a) * 26, 38 + 5 * (i - 2), 425 + Math.sin(a) * 26); vC.lerp(vS2, go); vT.lerp(vS2.set(-0.95, 0.08, 0.3), Math.sin(go * Math.PI)).normalize(); } }
            vA.lerp(vC, wl); vB2.lerp(vT, wl).normalize(); bank += (-wheel[i].dir * 0.9 - bank) * wl; } }
        if (i === 3) { const w = sstep(0.5, 0.57, u); if (w > 0) { scripted(HD, u, vC, vT);          // the herald leaves the flock for the headland
          const land = sstep(0.795, 0.845, u); if (land > 0) { vS2.copy(vC); vC.lerp(perchH, land); vT.copy(perchH).sub(vS2).normalize().lerp(vS2.set(0.05, 0.93, -0.36), sstep(0.822, 0.845, u)).normalize(); }
          vA.lerp(vC, w); vB2.lerp(vT, w).normalize(); bank = bank * (1 - w) - 0.6 * w * sstep(0.62, 0.68, u) * (1 - sstep(0.8, 0.83, u)); fold = sstep(0.822, 0.85, u); amp = 0.5 * (1 - 0.75 * fold); } }
        setRay(i, vA, vB2, bank, ph, fold, amp, wheel[i].seed);
      }
      for (let k = 0; k < 14; k++) { const i = nRays + 1 + k, T = 6.5 + 1.3 * (k % 4), tt = (time + k * 2.9) % T, bump = sstep(0, 0.9, tt) * (1 - sstep(1.5, 3.0, tt)) * (1 - sstep(0.815, 0.835, u));
        rayA[i * 4] = roostPh[k] + time * (0.9 + 0.1 * (k % 3)); rayA[i * 4 + 1] = 1 - 0.3 * bump; rayA[i * 4 + 2] = 0.16 + 0.3 * bump; }
      // the one that lets go of its ledge as we climb past, and unfurls
      drAt(Math.min(u + 0.004, 1), vB2); drAt(u, vA); vB2.sub(vA);
      const fd = keyf(u, DR.fold); if (u < 0.802 || vB2.lengthSq() < 1e-8) vB2.set(0.1, 0.93, -0.36); vB2.normalize();
      if (fd > 0.5) vB2.lerp(vC.set(0.1, 0.93, -0.36), sstep(0.5, 1, fd)).normalize();
      setRay(nRays, vA, vB2, 0.16 * sstep(0.83, 0.86, u) - 0.66 * sstep(0.9, 0.94, u), flap + 1.1, fd, 0.15 + 0.5 * (1 - fd), 0.37);
      ovWorld.set(-rayP[0], rayP[1], rayP[2]); skWorld.set(-rayP[4], rayP[5] + 3, rayP[6]); drWorld.set(-vA.x, vA.y, vA.z);
      const m0 = (nRays + 15) * 4; rayP.copyWithin(m0, 0, nRays * 4); rayF.copyWithin(m0, 0, nRays * 4); rayA.copyWithin(m0, 0, nRays * 4);
      for (let i = 0; i < nRays; i++) rayP[m0 + i * 4 + 3] = -1;
      for (const n of ['aP', 'aF', 'aA']) rayGeo.attributes[n].needsUpdate = true;
    });
    disposables.push(rayGeo);

    // ---- the made things: kite-sail rafts (or one great raft, or a line of catch-buoys) ----------
    // CPU copy of the hero's swell (its sea lives in world space: x mirrored, origin at the seat)
    const swellAt = (bx, bz, time) => {
      const sw = HU.uSwell.value, x = -(bx - SEAT[0]), z = bz - SEAT[2], f = 1 - sstep(380, 760, Math.hypot(x, z));
      return f * (sw.x * Math.sin((x * 0.34 + z * 0.94) * sw.y - time * sw.z) + sw.w * Math.sin((-x * 0.71 + z * 0.70) * sw.y * 2.3 - time * sw.z * 1.37));
    };
    const solidMat = new THREE.ShaderMaterial({
      uniforms: U(), fog: true, side: THREE.DoubleSide,
      vertexShader: FOGV + /* glsl */`attribute vec4 color; varying vec4 vC; varying vec3 vN, vWp;
        void main(){ vC = color; vN = normalize(mat3(modelMatrix) * normal); vN.x = -vN.x;          // back to brief space
          vWp = (modelMatrix * vec4(position, 1.)).xyz; vWp.x = -vWp.x;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform float uTime, uIn; uniform vec3 cTeal, uCamB;\n` + SKY + GLSL_LIT + FOGF + /* glsl */`varying vec4 vC; varying vec3 vN, vWp;
        void main(){ vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
          vec3 c = litCol(vC.rgb, N, 1., 0.) + cTeal * vC.a * (3.2 + 0.8 * sin(uTime * 2.3 + vC.r * 40.));
          gl_FragColor = vec4(c, 1.);
          #include <fog_fragment>
            { vec3 dv = vWp - uCamB; float dl = max(length(dv), 1e-3); dv /= dl; vec3 dw = vec3(-dv.x, max(dv.y, 0.), dv.z);   // lost as the rain closes round the lens
              gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor * 0.9, skyCol(dw / max(length(dw), 1e-4)), 0.8), min(1., 1.05 * uIn) * smoothstep(22., 80., dl)); }
        }`,
    });
    // tiny mesh builder: boxes and tapered prisms with a colour and an emissive flag in colour.a
    const mk = () => ({ p: [], c: [], i: [] });
    const prism = (m, x, y, z, rx0, rz0, rx1, rz1, h, sides, col, em = 0, axis = 'y', yaw = 0) => {
      const b = m.p.length / 3, cy = Math.cos(yaw), sy = Math.sin(yaw);
      for (let k = 0; k < 2; k++) for (let s = 0; s < sides; s++) {
        const a = (s + 0.5) / sides * Math.PI * 2, rx = k ? rx1 : rx0, rz = k ? rz1 : rz0;
        let lx = Math.cos(a) * rx * 1.414 * (sides === 4 ? 1 : 0.71), ly = k * h, lz = Math.sin(a) * rz * 1.414 * (sides === 4 ? 1 : 0.71);
        if (axis === 'z') { const t = ly; ly = lz; lz = t - h / 2; }
        m.p.push(x + lx * cy - lz * sy, y + ly, z + lx * sy + lz * cy); m.c.push(col.r, col.g, col.b, em);
      }
      for (let s = 0; s < sides; s++) { const a = b + s, c = b + (s + 1) % sides, d = a + sides, e = c + sides; m.i.push(a, d, c, c, d, e); }
      for (let s = 1; s < sides - 1; s++) m.i.push(b, b + s, b + s + 1, b + sides, b + sides + s + 1, b + sides + s);
    };
    const finish = (m) => {
      const g0 = new THREE.BufferGeometry(); g0.setAttribute('position', new THREE.Float32BufferAttribute(m.p, 3));
      g0.setAttribute('color', new THREE.Float32BufferAttribute(m.c, 4)); g0.setIndex(m.i);
      const g = g0.toNonIndexed(); g.computeVertexNormals(); g0.dispose(); return g;       // flat-shaded planks
    };
    const plank = C[2].clone().multiplyScalar(0.62), plank2 = C[2].clone().lerp(C[0], 0.3).multiplyScalar(0.5), dark = C[5].clone().multiplyScalar(0.8), rustC = new THREE.Color('#8A4A1E').lerp(C[2], 0.22).multiplyScalar(0.8);
    const rafts = [];                                              // { group, x, z, kites: [...] }
    const kiteMat = new THREE.ShaderMaterial({
      uniforms: U({ cKite: { value: new THREE.Color('#8A4A1E').lerp(C[2], 0.2) } }), fog: true, side: THREE.DoubleSide,
      vertexShader: `uniform float uTime;\n` + FOGV + /* glsl */`varying vec3 vN, vWp; varying vec2 vQ;
        void main(){ vec3 p = position; vQ = uv; float rip = uv.y * uv.y; vWp = (modelMatrix * vec4(position, 1.)).xyz; vWp.x = -vWp.x;
          p += normal * (rip * (0.9 * sin(uTime * 2.6 + uv.x * 31.) + 0.6 * sin(uTime * 1.7 - uv.x * 17.)) + 1.2 * sin(uTime * 0.6 + uv.x * 3.) * (1. - uv.y));
          vN = normalize(mat3(modelMatrix) * normal + vec3(0., 0.2 * rip * cos(uTime * 2.6 + uv.x * 31.), 0.)); vN.x = -vN.x;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 cKite, uCamB; uniform float uIn;\n` + SKY + GLSL_LIT + FOGF + /* glsl */`varying vec3 vN, vWp; varying vec2 vQ;
        void main(){ vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
          float pan = fract(vQ.x * 9.); float seam = smoothstep(0.0, 0.05, pan) * (1. - smoothstep(0.95, 1.0, pan));
          float rusty = step(0.5, fract(floor(vQ.x * 9.) * 0.5 + 0.25)) * smoothstep(0.25, 0.3, vQ.y) * (1. - smoothstep(0.8, 0.85, vQ.y));
          vec3 alb = mix(cCream * 0.74, cKite * 0.72, rusty) * (0.75 + 0.25 * seam);
          vec3 c = litCol(alb, N, 1., mix(0.7, 0.25, rusty)) + alb * cHaze * mix(0.35, 0.1, rusty);    // cloth lit through
          c *= 0.45 + 0.55 * seam * smoothstep(0.0, 0.03, vQ.y) * (1. - smoothstep(0.97, 1.0, vQ.y)) + 0.0;
          gl_FragColor = vec4(c, 1.);
          #include <fog_fragment>
            { vec3 dv = vWp - uCamB; float dl = max(length(dv), 1e-3); dv /= dl; vec3 dw = vec3(-dv.x, max(dv.y, 0.), dv.z);   // lost as the rain closes round the lens
              gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor * 0.9, skyCol(dw / max(length(dw), 1e-4)), 0.8), min(1., 1.05 * uIn) * smoothstep(22., 80., dl)); }
        }`,
    });
    // the near raft's image in the sea (the rays' trick: mirrored about the surface, laid on it along the line of sight, broken by the ripples)
    const imgMat = (kite) => new THREE.ShaderMaterial({
      uniforms: U({ uSeat: seatU, cKite: { value: new THREE.Color('#8A4A1E').lerp(C[2], 0.2) } }), fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      vertexShader: HASH + `uniform vec3 uCamB; uniform vec2 uSeat;\n` + FOGV + (kite ? `varying vec2 vQ; varying vec3 vWp;` : `attribute vec4 color; varying vec4 vC; varying vec3 vWp;`) + /* glsl */`
        void main(){ vec3 p = position; ${kite ? 'vQ = uv; p += normal * (uv.y * uv.y * (0.9 * sin(uTime * 2.6 + uv.x * 31.) + 0.6 * sin(uTime * 1.7 - uv.x * 17.)) + 1.2 * sin(uTime * 0.6 + uv.x * 3.) * (1. - uv.y));' : 'vC = color;'}
          vec3 b = (modelMatrix * vec4(p, 1.)).xyz; b.x = -b.x;
          float sw = swellH(vec2(-(b.x - uSeat.x), b.z - uSeat.y)); b.y = 2. * sw - b.y;
          float f = clamp((uCamB.y - sw - 0.06) / max(uCamB.y - b.y, 0.05), 0., 1.); b = uCamB + (b - uCamB) * f; vWp = b;
          vec4 mvPosition = viewMatrix * vec4(-b.x, b.y, b.z, 1.); gl_Position = projectionMatrix * mvPosition; gl_Position.z -= 0.0006 * gl_Position.w;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform float uTime, uIn; uniform vec3 cKite, cTeal, uCamB;\n` + SKY + FOGF + (kite ? `varying vec2 vQ; varying vec3 vWp;` : `varying vec4 vC; varying vec3 vWp;`) + /* glsl */`
        void main(){ ${kite ? 'float rusty = step(0.5, fract(floor(vQ.x * 9.) * 0.5 + 0.25)) * smoothstep(0.25, 0.3, vQ.y) * (1. - smoothstep(0.8, 0.85, vQ.y)); vec3 c = mix(cCream * 0.6, cKite * 0.5, rusty) * mix(cHaze, vec3(1.), 0.5);' : 'vec3 c = vC.rgb * mix(cHaze, vec3(1.), 0.5) * 0.7 + cTeal * vC.a * 2.2;'}
          float dl = length(vWp - uCamB), brk = 0.6 + 0.4 * sin(vWp.x * 2.3 + 2. * sin(vWp.z * 1.7 + uTime * 0.9) + uTime * 0.6);
          gl_FragColor = vec4(c * 0.5, 0.68 * brk * smoothstep(6., 22., dl) * (1. - uIn));
          #include <fog_fragment>
        }`,
    });
    await ctx.yield();
    const solidImg = imgMat(false), kiteImg = imgMat(true);
    const imgOf = (mesh, mat, group) => { const m = new THREE.Mesh(mesh.geometry, mat); m.position.copy(mesh.position); m.rotation.copy(mesh.rotation); m.scale.copy(mesh.scale); m.frustumCulled = false; m.renderOrder = 0.5; group.add(m); return m; };
    // and its wake: a V of two low bright lips and a ruffled lane between, lying on the swell behind the stern
    const wakeMat = new THREE.ShaderMaterial({
      uniforms: U({ uSeat: seatU }), fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      vertexShader: HASH + `uniform vec2 uSeat;\n` + FOGV + /* glsl */`varying vec2 vQ; varying vec3 vWp;
        void main(){ vQ = vec2(position.x / 15., -position.z / 80.); vec3 b = (modelMatrix * vec4(position, 1.)).xyz; b.x = -b.x;
          b.y = swellH(vec2(-(b.x - uSeat.x), b.z - uSeat.y)) + 0.05; vWp = b;
          vec4 mvPosition = viewMatrix * vec4(-b.x, b.y, b.z, 1.); gl_Position = projectionMatrix * mvPosition; gl_Position.z -= 0.0004 * gl_Position.w;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform float uTime, uIn; uniform vec3 uKey;\n` + SKY + FOGF + /* glsl */`varying vec2 vQ; varying vec3 vWp;
        void main(){ float t = vQ.y, ax = abs(vQ.x), arm = 0.2 + 0.72 * t, e = (ax - arm) / (0.035 + 0.05 * t);
          float lip = exp(-e * e) * (1. - t) * (1. - t) * smoothstep(0.0, 0.06, t);
          float lane = (1. - smoothstep(arm * 0.5, arm, ax)) * (1. - t) * (0.5 + 0.5 * sin(vWp.x * 1.9 + uTime * 1.3 + 2. * sin(vWp.z * 1.3 - uTime))) * 0.3;
          vec3 c = mix(mix(cDeep, cCool, 0.5) * 0.6, cCream * mix(vec3(1.), uKey, 0.6) * 1.15, clamp(lip * 1.4, 0., 1.));
          gl_FragColor = vec4(c, clamp(0.85 * lip + lane, 0., 0.9) * (1. - uIn));
          #include <fog_fragment>
        }`,
    });
    await ctx.yield();
    const makeKite = (span) => {                                   // a crescent canopy, bowed, 30 x 6 quads
      const NS = 30, NC = 6, pos = [], uv = [], idx = [];
      for (let i = 0; i <= NS; i++) for (let j = 0; j <= NC; j++) {
        const s = i / NS * 2 - 1, c = j / NC, ph = s * 1.2, R = span / (2 * Math.sin(1.2)), ch = span * 0.24 * (1 - 0.72 * s * s);
        pos.push(R * Math.sin(ph), R * (Math.cos(ph) - 1) * 0.75 - c * ch * 0.92 + span * 0.05 * s * s * c, -c * ch * 0.4 + 4 * Math.sin(c * 3.14) * (1 - s * s)); uv.push(i / NS, c);
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + 1, c = a + NC + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    const makeRaft = (bx, bz, scale, nKites, near = false) => {
      const m = mk(), L = 22;
      for (const px of [-3.4, 0, 3.4]) { prism(m, px, 0.5, 0, 1.25, L / 2, 1.25, L / 2, 0, 4, plank, 0);                         // pontoons: hull + tapered bows
        prism(m, px, -0.5, 0, 0.9, L / 2 - 1, 1.25, L / 2, 1.0, 4, plank2); prism(m, px, 0.5, L / 2 + 1.3, 1.1, 0.4, 0.5, 0.25, 0.5, 4, plank, 0, 'y'); }
      for (let k = -4; k <= 4; k++) prism(m, 0, 0.55, k * 2.3, 5.2, 0.28, 5.2, 0.28, 0.22, 4, k % 2 ? plank : plank2);           // lashed cross-beams
      prism(m, 0, 0.77, -3.5, 2.3, 3.0, 2.1, 2.8, 3.0, 4, plank); prism(m, 0, 3.77, -3.5, 2.6, 3.3, 0.4, 2.9, 0.9, 4, rustC);     // deckhouse + roof
      prism(m, 2.32, 0.8, -3.0, 0.03, 0.45, 0.03, 0.45, 2.0, 4, dark);                                                             // the door-sized hatch
      prism(m, -2.5, 0.77, -6.2, 0.07, 0.07, 0.07, 0.07, 3.9, 4, dark); prism(m, -2.0, 0.77, -6.2, 0.07, 0.07, 0.07, 0.07, 3.9, 4, dark);
      for (let k = 0; k < 7; k++) prism(m, -2.25, 1.1 + k * 0.5, -6.2, 0.3, 0.05, 0.3, 0.05, 0.08, 4, dark);                       // ladder
      for (let k = -5; k <= 5; k++) for (const sx of [-5, 5]) prism(m, sx, 0.77, k * 2, 0.07, 0.07, 0.07, 0.07, 1.1, 4, dark);     // rails
      for (const sx of [-5, 5]) prism(m, sx, 1.82, 0, 0.06, 10.2, 0.06, 10.2, 0.09, 4, dark);
      for (let k = 0; k < 5; k++) { prism(m, 3.2, 0.77, 2 + k * 1.7, 0.08, 0.08, 0.1, 0.1, 1.2, 6, dark); prism(m, 3.2, 1.97, 2 + k * 1.7, 0.12, 0.12, 0.75, 0.75, 0.8, 8, k % 2 ? rustC : plank); }  // funnels
      for (let k = 0; k < 3; k++) { prism(m, -3.2, 0.77, 3 + k * 2.6, 0.06, 0.06, 0.06, 0.06, 2.6, 4, dark); if (k < 2) prism(m, -3.2, 1.6, 4.3 + k * 2.6, 0.02, 1.25, 0.02, 1.25, 1.6, 4, rustC); } // drying nets
      prism(m, -1.7, 0.77, -8.4, 1.0, 1.0, 1.0, 1.0, 1.3, 4, rustC); prism(m, 1.3, 0.77, -8.7, 0.9, 0.9, 0.9, 0.9, 1.0, 4, plank2); prism(m, -1.5, 2.07, -8.5, 0.6, 0.6, 0.6, 0.6, 0.7, 4, plank2);   // cargo: crates lashed aft, casks amidships
      prism(m, 0.3, 0.77, 0.9, 0.55, 0.55, 0.55, 0.55, 1.25, 8, rustC); prism(m, -1.1, 0.77, 1.4, 0.55, 0.55, 0.55, 0.55, 1.25, 8, plank2); prism(m, -0.4, 0.77, 2.4, 0.55, 0.55, 0.55, 0.55, 1.25, 8, rustC);
      prism(m, 0, 0.77, 5.5, 0.16, 0.16, 0.09, 0.09, 9.5, 6, plank2);                                                             // mast
      prism(m, 0, 9.4, 5.5, 1.3, 0.07, 1.3, 0.07, 0.12, 4, dark);
      for (const lx of [-1.2, 0, 1.2]) prism(m, lx, 9.55 + (lx === 0 ? 0.6 : 0), 5.5, 0.2, 0.2, 0.2, 0.2, 0.42, 6, teal, 1);     // three teal lamps
      const group = new THREE.Group(), hull = new THREE.Mesh(finish(m), solidMat); hull.frustumCulled = false; group.add(hull);
      if (near) imgOf(hull, solidImg, group);
      const kites = [];
      for (let k = 0; k < nKites; k++) {
        const kSpan = near ? 32 : 60, kg = makeKite(kSpan), kite = new THREE.Mesh(kg, kiteMat);   // (the raft before the headland flies a storm kite low over its bow: hull and sail read as one thing) kite.frustumCulled = false;
        const off = nKites > 1 && !near ? (k ? 34 : -34) : 0, hi2 = near && k === 1;                // (the great raft's twin kites fly one above the other when it sails before the headland)
        kite.position.set(off / scale, (near ? (hi2 ? 48 : 30) : 70) / scale, (near ? (hi2 ? 14 : 24) : 52) / scale); kite.rotation.set(hi2 ? -0.6 : -0.85, 0, 0); kite.scale.setScalar(1 / scale); group.add(kite); kites.push(kite); if (near) imgOf(kite, kiteImg, group);
        // four tether ribbons from the deck to the canopy's leading edge, crossed flats that sag
        const t = mk();
        for (const s of [-0.9, -0.35, 0.35, 0.9]) { const ph = s * 1.2, R = kSpan / (2 * Math.sin(1.2)), sag = near ? 1.2 : 7;
          const top = new THREE.Vector3(R * Math.sin(ph), R * (Math.cos(ph) - 1) * 0.75, 0).applyEuler(kite.rotation).multiplyScalar(1 / scale).add(kite.position), bot = new THREE.Vector3(s * 3, 1.2, 7);
          for (let q = 0; q < 8; q++) { const a = q / 8, b2 = (q + 1) / 8, pa = bot.clone().lerp(top, a), pb = bot.clone().lerp(top, b2); pa.y -= sag * Math.sin(a * Math.PI) / scale; pb.y -= sag * Math.sin(b2 * Math.PI) / scale;
            const o = t.p.length / 3, w = 0.22 / scale; t.p.push(pa.x - w, pa.y, pa.z, pa.x + w, pa.y, pa.z, pb.x - w, pb.y, pb.z, pb.x + w, pb.y, pb.z, pa.x, pa.y - w, pa.z, pa.x, pa.y + w, pa.z, pb.x, pb.y - w, pb.z, pb.x, pb.y + w, pb.z);
            for (let e = 0; e < 8; e++) t.c.push(dark.r, dark.g, dark.b, 0); t.i.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 4, o + 5, o + 6, o + 5, o + 7, o + 6); } }
        const tm = new THREE.Mesh(finish(t), solidMat); tm.frustumCulled = false; group.add(tm); if (near) imgOf(tm, solidImg, group);
      }
      if (near) { const wg = new THREE.PlaneGeometry(30, 80, 12, 16); wg.rotateX(-Math.PI / 2); wg.translate(0, 0, -40 - 8); const wk = new THREE.Mesh(wg, wakeMat); wk.frustumCulled = false; wk.renderOrder = 0.42; group.add(wk); }
      group.scale.setScalar(scale); B.add(group); rafts.push({ group, x: bx, z: bz, ph: rr.range(0, 6), kites, near });
    };
    await ctx.yield();
    let zShore = 441; for (let x = 40; x <= 130; x += 6) zShore = Math.min(zShore, cliffZ(x, 0.5));
    const zRaft = Math.min(392, zShore - 18);
    if (castV === 0) { makeRaft(-347, 489, 1, 1); makeRaft(21, 340, 1, 1, true); makeRaft(1010, 60, 1, 1); }
    else if (castV === 1) makeRaft(28, 347, 1.4, 2, true);
    else {                                                        // no rafts: a line of anchored catch-buoys with teal lamps
      for (let k = 0; k < 9; k++) { const m = mk(); prism(m, 0, -0.6, 0, 1.5, 1.5, 1.9, 1.9, 1.3, 8, plank); prism(m, 0, 0.7, 0, 1.9, 1.9, 0.5, 0.5, 1.1, 8, rustC);
        prism(m, 0, 1.8, 0, 0.1, 0.1, 0.1, 0.1, 3.4, 4, dark); prism(m, 0, 4.4, 0, 0.16, 0.16, 1.5, 1.5, 1.3, 10, plank2); prism(m, 0, 3.6, 0, 0.26, 0.26, 0.26, 0.26, 0.5, 6, teal, 1);
        const group = new THREE.Group(), hull = new THREE.Mesh(finish(m), solidMat); hull.frustumCulled = false; group.add(hull); B.add(group);
        if (k === 6 || k === 7) group.scale.setScalar(2.3);            // the two great buoys moored before the headland: they give the wall its size
        imgOf(hull, solidImg, group);
        // (the last three stand on the mirror before the headland: two of them in the right half of the frame as we come out of the rain)
        rafts.push({ group, x: k === 6 ? 18 : k === 7 ? 52 : k === 8 ? 128 : 24 + k * 9 + (k > 3 ? (k - 3) * 22 : 0), z: k === 6 ? 336 : k === 7 ? 352 : k === 8 ? zRaft + 14 : 40 + k * 52, ph: rr.range(0, 6), kites: [], buoy: true }); }
    }
    await ctx.yield();
    const raftWorld = new THREE.Vector3(-31, 13, 340);
    updaters.push((dt, time, camera, u) => {
      for (const r of rafts) {
        const crawl = r.buoy ? 0 : (r.near ? 300 * (u - 0.52) + 16000 * Math.pow(Math.max(0, u - 0.55), 2) : 135 * (u - 0.2)) + 1.2 * Math.sin(time * 0.21 + r.ph);   // crawling at 3 m/s (the near one is away to starboard by u 0.6)
        const z = r.z + (r.near ? -0.26 * crawl : crawl), x = r.x + (r.near ? 0.966 * crawl : 0);                                                  // (the near one sails to starboard along the coast)
        const h = swellAt(x, z, time), hx = swellAt(x + 4, z, time), hz = swellAt(x, z + 6, time);
        r.group.position.set(x, h + (r.buoy ? 0.1 : 0.25), z);
        if (r.near) { r.group.rotation.set(0.02 * Math.sin(time * 0.9 + r.ph), Math.PI / 2 + 0.26, 0.015 * Math.sin(time * 0.7 + r.ph));
          const uu = ctx.through ? 0 : u; r.group.visible = uu < 0.64; raftWorld.set(-(x + 10), 13, z); continue; }      // (once it has left the frame to starboard it is gone: the gaze turns that way again at u 0.7)
        r.group.rotation.set(-(hz - h) / 6 * 0.8 + 0.02 * Math.sin(time * 0.9 + r.ph), 0, (hx - h) / 4 * 0.8 + (r.buoy ? 0.08 : 0.015) * Math.sin(time * 0.7 + r.ph));
      }
    });
    await ctx.yield();

    // ---- the methanefall: slow lobes pouring from the hanging valley, fraying to nothing ---------
    const GLSL_VN = /* glsl */`
      float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      float fb(vec2 p){ return 0.55 * vn(p) + 0.3 * vn(p * 2.1 + 3.7) + 0.15 * vn(p * 4.3 + 9.1); }
      `;
    {
      const NXf = 14, NYf = 44, pos = [], uv = [], idx = [];
      for (let j = 0; j <= NYf; j++) for (let i = 0; i <= NXf; i++) {
        const s = i / NXf, t = j / NYf, y = 232 - 190 * t, x = 170 + (s - 0.5) * (46 + 34 * t);
        const zc = cliffZ(170, Math.min(y, 196), true) + 0.6 * Math.max(0, y - 196) - 3.5 - 4.5 * Math.sin(s * Math.PI) - 5 * sstep(0.45, 1, t);
        pos.push(x, y, zc); uv.push(s, t);
      }
      for (let j = 0; j < NYf; j++) for (let i = 0; i < NXf; i++) { const a = j * (NXf + 1) + i, b = a + 1, c = a + NXf + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        uniforms: U(), fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: FOGV + `varying vec2 vQ; void main(){ vQ = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
        fragmentShader: `uniform float uTime, uVeil, uU;\n` + SKY + GLSL_LIT + GLSL_VN + FOGF + /* glsl */`varying vec2 vQ;
          void main(){
            float t = vQ.y, s = vQ.x, sc = s * 2. - 1.; float tt = uTime * 0.1;
            // A BODY OF WATER: one bright column that pours in slow lobes, opens into strands and goes to mist where it frays
            float st = fb(vec2(s * 15., t * 0.7 - tt * 1.2));                       // strands
            float lobes = fb(vec2(s * 4., t * 5. - tt * 3.2));                       // slow lobes riding down them
            float wob = 0.12 * (fb(vec2(t * 3. - tt * 1.5, 2.)) - 0.5) * (0.3 + t);
            float w = 0.3 + 0.34 * t, e = (sc - wob) / w, core = exp(-e * e * 1.6);
            float body = smoothstep(0.2 + 0.42 * t, 0.46 + 0.4 * t, st * 0.5 + lobes * 0.66);
            float pour = core * mix(1., 0.25 + 0.75 * body, smoothstep(0.12, 0.7, t)) * (1. - smoothstep(0.5, 0.96, t)) * smoothstep(0.0, 0.08, t);
            float mn = fb(vec2(s * 3. + tt * 0.6, t * 4. - tt * 1.1)), em = sc / 0.92;
            float mist = smoothstep(0.38, 0.72, t) * (1. - smoothstep(0.86, 1., t)) * exp(-em * em * 2.2) * smoothstep(0.25, 0.75, mn) * (1. - smoothstep(0.75, 1., abs(sc)));
            float a = clamp(0.97 * pour + 0.46 * mist * (1. - pour), 0., 0.97);
            // the core is the one near-white thing on the face; its far side and its mist take the dusk
            vec3 wc = mix(cCream, vec3(1.), 0.72) * mix(uKey, vec3(1.), 0.62) * (1.25 + 0.9 * core * (0.5 + lobes)) * (1. - 0.3 * smoothstep(-0.3, 0.9, e)) * (1. - 0.12 * t);
            vec3 mc = mix(mix(cCream, vec3(1.), 0.3) * mix(uKey, vec3(1.), 0.5), cCool * 1.8, 0.22 + 0.3 * smoothstep(-0.2, 0.8, sc)) * (0.8 + 0.3 * mn);
            vec3 c = mix(mc, wc, clamp(pour / max(a, 1e-3), 0., 1.)) * (1. - 0.45 * uRainDim);
            c = mix(c, mix(cDeep, cCool, 0.55) * 0.8, (1. - smoothstep(0.0, 0.1, t)) * 0.6);     // it leaves the cloud dark
            gl_FragColor = vec4(c, a * (1. - uVeil) * (1. - 0.9 * smoothstep(0.83, 0.868, uU)));          // (in the throat of the notch it thins away: no white blur over the gold wall)
            #include <fog_fragment>
            gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 0.85 * uVeil);      // from inside the rain, a ghost of itself
          }`,
      });
      const fall = new THREE.Mesh(g, mat); fall.name = 'methanefall'; fall.frustumCulled = false; fall.renderOrder = 4; B.add(fall); veiled.push(fall);
    }
    // ---- three veils of the fall drifting along the wall, across the climb (u 0.78, 0.84, 0.9) ---
    {
      const pos = [], uv = [], av = [], idx = [], tq = new THREE.Vector3(), cq = new THREE.Vector3();
      [0.9, 0.975].forEach((vu, k) => {
        pB(vu, cq); path.tangentAt(vu, tq); tq.x = -tq.x;
        const rx = tq.z, rz = -tq.x, rl = Math.hypot(rx, rz) || 1, o = pos.length / 3, W2 = 150, H2 = 120;
        for (let j = 0; j <= 1; j++) for (let i = 0; i <= 1; i++) { const sx = (i - 0.5) * W2, sy = (j - 0.42) * H2;
          if (k === 0) { const gx = (i - 0.5) * 84, gy = (j - 0.5) * 96; pos.push(2 + gx, 92 + gy, 470 - 0.1 * gx); av.push(gx / 150, gy / 120, k); }   // (never crossing a wall: no edge can be cut)
          else { pos.push(cq.x + rx / rl * sx, cq.y + sy, cq.z + rz / rl * sx); av.push(i - 0.5, j - 0.42, k); }
          uv.push(i * 3 + k * 1.7, j * 2.4 + k * 0.9); }
        idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aV', new THREE.Float32BufferAttribute(av, 3)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        uniforms: U({ uFogCol: { value: scene.fog.color } }), side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: `attribute vec3 aV; varying vec2 vQ; varying vec3 vA; varying float vD;
          void main(){ vQ = uv; vA = aV; vec4 mv = modelViewMatrix * vec4(position, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uTime; uniform vec3 uFogCol, uKey, cCream;\n` + GLSL_VN + /* glsl */`varying vec2 vQ; varying vec3 vA; varying float vD;
          void main(){
            float sx = vA.x * 150., sy = vA.y * 120., last = step(0.5, vA.z), fwx = fwidth(sx);
            float fine = fb(vec2(sx * 0.9 + uTime * 0.22 + last * 9., sy * 0.06 + uTime * 0.26));
            float fine2 = mix(fb(vec2(sx * 2.4 - uTime * 0.17, sy * 0.13 + uTime * 0.45)), 0.45, smoothstep(0.03, 0.1, fwx));
            // (0) the fall's veil: ONE clean gauze over the port third, its edge slanting and soft, never more than a third;
            // (1) the last wisp, a slanting band that passes above the ring
            float dr0 = 5. * sin(uTime * 0.13), ge = length(vec2((sx - dr0 + 0.3 * sy) / 31., sy / 43.)) + 0.3 * (fine - 0.5);
            float g0 = 1. - smoothstep(0.3, 1., ge);                                 // a slanting gauze that thins to nothing all round, drifting
            float yc = 18. - 0.4 * sx + 5. * sin(sx * 0.05 + uTime * 0.11), sb = (sy - yc) / 6.5;
            float g1 = (1. - smoothstep(0.3, 1.05, sb)) * smoothstep(-1.0 - 1.8 * fine, -0.25 - 0.4 * fine, sb) * (1. - smoothstep(0.25, 0.5, abs(vA.x)));
            float body = mix(g0, g1, last);
            float a = body * mix(clamp(0.17 + 0.24 * (fine - 0.5) + 0.34 * (fine2 - 0.45), 0.03, 0.33), clamp(0.34 + 0.7 * fine + 0.6 * (fine2 - 0.45), 0., 1.) * 0.28, last);
            vec2 sg = vec2(sx, sy + uTime * 1.1) * 2.6; float hs = h21(floor(sg) + last * 13.);
            float spk = step(0.9, hs) * (1. - smoothstep(0.04, 0.16 + 2.6 * fwx, length(fract(sg) - 0.5))) * (0.5 + 0.5 * sin(uTime * (3. + 5. * hs) + hs * 50.)) * body * min(1., 0.05 / max(fwx, 1e-3));
            float nearV = smoothstep(3., 15., vD) * (1. - smoothstep(45., 80., vD));       // never a wall in the face, never a haze from afar
            vec3 c = mix(cCream, uFogCol, 0.2) * (0.95 + 0.25 * fine) * mix(vec3(1.), uKey, 0.5);
            gl_FragColor = vec4(c + uKey * 1.6 * spk, clamp((a + 0.5 * spk) * nearV, 0., 0.5));
          }`,
      });
      const veils = new THREE.Mesh(g, mat); veils.name = 'veils'; veils.frustumCulled = false; veils.renderOrder = 5; B.add(veils);
    }
    await ctx.yield();

    // ---- a bank of luminous haze on the sea between the shaft and the headland's cape: it parts the
    // layers at the entry (glitter column, bright air, cream wall) and thins away as we come up to it ----
    {
      const g = new THREE.PlaneGeometry(1, 1, 1, 1);
      const mat = new THREE.ShaderMaterial({ uniforms: U(), transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`varying vec3 vP; varying float vD;
          void main(){ vec3 p = vec3(-130. + position.x * 580., 94. + position.y * 196., 385.); vP = p;
            vec4 mv = modelViewMatrix * vec4(p, 1.); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uTime, uVeil; uniform vec3 uKey;\n` + SKY + GLSL_VN + /* glsl */`varying vec3 vP; varying float vD;
          void main(){
            float n = fb(vec2(vP.x * 0.012 + uTime * 0.012, vP.y * 0.03 - uTime * 0.004));
            float a = (1. - smoothstep(8., 96., vP.x + 30. * n)) * smoothstep(-420., -250., vP.x) * (1. - smoothstep(40., 185., vP.y + 70. * n)) * smoothstep(-4., 6., vP.y);
            a *= smoothstep(150., 300., vD) * 0.86 * (1. - uVeil);
            gl_FragColor = vec4(mix(cCream, cHaze, 0.42) * mix(vec3(1.), uKey, 0.5) * (0.92 + 0.25 * n), a);
          }` });
      const bank = new THREE.Mesh(g, mat); bank.name = 'haze-bank'; bank.frustumCulled = false; bank.renderOrder = 0.45; B.add(bank);
    }
    // ---- keyed landings: the first crown off the port bow (u 0.09-0.11), the crown to starboard (u 0.41)
    // and the bead thrown to lens height from a crown dead ahead (it hangs beside the lens at u 0.42) ----
    const clamp = ctx.core.clamp;
    const featA = along(0.02 + 11.5 / path.length, 0, 2.6, 0, new THREE.Vector3()), tA0 = Tof(0.02) - 1.05;   // the opening picture: a crown whole in the near field, the column behind it   // whole in the lower left at u 0.1, 21 m off
    const uBapex = 0.4203, featB = along(0.424, 0, 0.8, 0, new THREE.Vector3()), tB0 = Tof(uBapex) - 4.2;
    const featC = along(0.437, 0, 5.0, 0, new THREE.Vector3()), tC0 = Tof(0.415) - 1.15;
    const camYB = pB(uBapex, new THREE.Vector3()).y;
    updaters.push((dt, time, camera, u) => {
      const t = Tof(u);
      if (u < 0.24) { hero.setFeature(-featA.x + SEAT[0], featA.z - SEAT[2], t - tA0, [2.0, 2.6, 1.4][rainV], 1); hero.setFeature2(0, 0, -99, 1, 1); }
      else {
        const bk = clamp((camYB - 0.12 - swellAt(featB.x, featB.z, time) - 1.75) / 1.394, 0.6, 2.6);     // the bead tops out at lens height
        hero.setFeature(-featB.x + SEAT[0], featB.z - SEAT[2], t - tB0, 1.25, bk); hero.setFeature2(-featC.x + SEAT[0], featC.z - SEAT[2], t - tC0, 1.3, 1);
      }
    });
    // ---- crowns beside the track, and the still-life. Through the core a crown lands every few metres of flight to one
    // side or the other, each timed (from u) to a known stage when the lens is 9 m short of it. From u 0.38 to 0.47 the
    // track runs down a LANE OF CALM MIRROR (hero.setLane): no other crown lands there and the small rain is thinned, so
    // two or three glass crowns stand whole ahead, 3.3-4 m either side of the line, with their ring trains to themselves.
    // Eight slots of the hero's clock (drop, crown and rings) are handed down the line. ----
    const laneWorld = new THREE.Vector3(50, 0, 215);
    {
      const pk = rng.fork('passers'), list = [], len = path.length;
      const speedAt = (u) => len * 0.004 / Math.max(1e-3, Tof(u + 0.002) - Tof(u - 0.002));
      for (let k = 0, uk = 0.298; uk < 0.476; k++) {
        const v = speedAt(uk), u0 = uk, inLane = u0 > 0.374 && u0 < 0.472, side = k % 2 ? 1 : -1;
        uk += Math.max(3.2, 0.48 * v) / len;
        const lat = side * ((inLane ? 3.3 + 0.7 * pk() : 4.2 + 1.5 * pk()) + (rainV === 2 ? (inLane ? 1.3 : 0.6) : 0));
        const stage = (inLane ? [1.2, 1.5, 1.05, 1.38] : [0.9, 1.6, 1.25, 1.9])[k % 4] + pk.range(-0.08, 0.08);   // its age when the lens is 9 m short of it
        const size = (inLane ? 1.14 + 0.2 * pk() : 1.08 + 0.26 * pk()) * (rainV === 1 ? 1.4 : rainV === 2 ? (inLane ? 0.85 : 0.72) : 1);
        if (side > 0 && Math.abs(u0 - 0.437) < 0.008) continue;                         // the keyed crown to starboard stands here
        if (side < 0 && u0 > 0.342 && u0 < 0.356) continue;                             // (a breath of open mirror to port at u 0.34: no crown under the lens's corner)
        if (rare && side > 0 && u0 > 0.385) continue;                                   // and on rare visits the great crown has that side to itself
        const q = along(u0, 0, lat, 0, new THREE.Vector3());
        list.push({ slot: k % 8, x: -q.x + SEAT[0], z: q.z - SEAT[2], t0: Tof(u0 - 9 / len) - stage, size });
      }
      { const ak = rng.fork('approach');
        for (let k = 0, uk = 0.064; uk < 0.236; k++, uk += (8.5 + 3 * ak()) / len) {
          const side = k % 2 ? 1 : -1, q = along(uk, 0, side * (5.2 + 4.5 * ak()), 0, new THREE.Vector3());
          if (Math.abs(uk - 0.172) < 0.03) continue;
          list.push({ slot: 7 - (k % 8), x: -q.x + SEAT[0], z: q.z - SEAT[2], t0: Tof(uk - 15 / len) - [1.0, 1.5, 1.2, 1.8][k % 4], size: 1.15 + 0.4 * ak() }); } }
      { const q = along(0.16 + 12.5 / len, 0, -3.6, 0, new THREE.Vector3()); list.push({ slot: 1, x: -q.x + SEAT[0], z: q.z - SEAT[2], t0: Tof(0.16) - 1.3, size: [1.75, 2.2, 1.3][rainV] }); }
      // the rain's last crowns stand on the gold mirror as the headland comes out of it: the two halves of the flight in one picture
      for (const [uq, lat, lead, stage, size, slot] of [[0.5, 5.5, 25, 1.5, 1.4, 5], [0.52, -5.5, 24, 1.3, 1.75, 0], [0.522, 7, 27, 1.0, 1.4, 1], [0.548, 5.5, 26, 1.25, 1.6, 2], [0.565, -7, 27, 1.3, 1.6, 3]]) {
        const q = along(uq + lead / len, 0, lat, 0, new THREE.Vector3()); list.push({ slot, x: -q.x + SEAT[0], z: q.z - SEAT[2], t0: Tof(uq) - stage, size: size * (rainV === 1 ? 1.25 : rainV === 2 ? 0.8 : 1) }); }
      { const q = along(0.25 + 13.5 / len, 0, 2.2, 0, new THREE.Vector3()); list.push({ slot: 4, x: -q.x + SEAT[0], z: q.z - SEAT[2], t0: Tof(0.25) - 1.35, size: [1.75, 2.2, 1.3][rainV] }); }   // as the curtain closes: one crown whole and large under the wheeling flock
      const l0 = pB(0.378, new THREE.Vector3()), l1 = pB(0.482, new THREE.Vector3());
      hero.setLane(-l0.x + SEAT[0], l0.z - SEAT[2], -l1.x + SEAT[0], l1.z - SEAT[2], 9, 1);
      updaters.push((dt, time, camera, u) => {
        const t = Tof(u);
        for (let j = 0; j < 8; j++) hero.setPasser(j, 0, 0, -99, 0);
        if (u < 0.64) for (const q of list) { const tau = t - q.t0; if (tau > -0.8 && tau < 3.0) hero.setPasser(q.slot, q.x, q.z, tau, q.size); }
        along(Math.min(u, 0.5), 11, 0, 0, vC); laneWorld.set(-vC.x, 0.4, vC.z);         // where the gaze rests in the lane: the mirror 11 m ahead
      });
    }
    const lens = /* glsl */`
      vec3 lensCol(vec3 N, vec3 V, float rim){              // V: from eye to surface. The world upside down, a hard crescent
        vec3 rd = normalize(V - 1.3 * (N - V * dot(N, V)) + vec3(0., 1e-4, 0.));
        vec3 c = envCol(vec3(rd.x, -rd.y, rd.z)) * mix(vec3(1.), cHaze, 0.5); c *= 1.2 / (1. + 0.8 * max(c.r, max(c.g, c.b))); c *= mix(vec3(0.55), cHaze * 0.9, 0.7);   // an amber body, never a pale disc
        float fr = 1. - abs(dot(N, V)); fr *= fr;
        c += envCol(reflect(V, N)) * fr * 0.6;
        float sl = dot(N, uSun);
        c *= 1. - 0.62 * smoothstep(0.3, 0.85, fr) * (1. - smoothstep(-0.1, 0.4, sl));                 // a dark rim away from the tear
        c += uKey * 4.2 * smoothstep(0.22, 0.6, sl) * smoothstep(0.18, 0.6, fr) * rim;                       // a broad crescent of light toward it
        c += uKey * 0.9 * smoothstep(0.45, 0.85, -sl) * (1. - smoothstep(0.1, 0.5, fr));                    // and the light it gathers, low on the far side
        return c; }
    `;
    // ---- melon drops by the lens: a handful the world owns, each keyed to u so it sinks past the lens
    // at a known moment (u 0.03 to starboard, u 0.33 to port with a dozen round it), mirrored in the sea --
    {
      const dk = rng.fork('lensdrops'), sm = Math.max(0.85, [1, 0.62, 1.5][rainV]) * (rainV === 2 ? 0.8 : 1) * 0.9, list = [];
      const add = (u0, a, l, h, r) => list.push({ t0: Tof(u0), p: along(u0, a, l, h, new THREE.Vector3()), r: r * sm, s: dk() });
      add(0.03, 2.5, 1.5, -0.1, 0.12); add(0.03, 4.4, -2.3, 0.8, 0.12); add(0.03, 7.5, 3.4, 1.5, 0.13); add(0.03, 11, -4.5, 2.6, 0.12);
      add(0.33, 4.6, -1.9, -0.1, 0.125);
      for (let i = 0; i < 11; i++) { const d = dk.range(2.7, 5.6) * 1.9, az = dk.range(-0.6, 0.62) + (i % 2 ? 0.1 : 0), el = dk.range(-0.2, 0.28); add(0.33, d * Math.cos(az), d * Math.sin(az), d * el, dk.range(0.1, 0.15)); }
      const N = list.length, aD = new Float32Array(N * 8), aE = new Float32Array(N * 6);
      const sg = new THREE.SphereGeometry(1, 16, 10), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', sg.attributes.position); g.setAttribute('normal', sg.attributes.normal); g.setIndex(sg.index); disposables.push(sg);
      const dAt = new THREE.InstancedBufferAttribute(aD, 4), eAt = new THREE.InstancedBufferAttribute(aE, 3); dAt.setUsage(THREE.DynamicDrawUsage); eAt.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('aD', dAt); g.setAttribute('aE', eAt); g.instanceCount = N * 2; g.boundingSphere = big;
      const mat = new THREE.ShaderMaterial({ uniforms: U({ uSeat: seatU }), fog: true,
        vertexShader: HASH + `uniform vec3 uCamB; uniform vec2 uSeat;\n` + FOGV + /* glsl */`attribute vec4 aD; attribute vec3 aE; varying vec3 vN, vV; varying float vM;
          void main(){ float w = 0.17 * sin(uTime * (3.4 + 2. * aE.x) + aE.x * 40.);
            vec3 sc = vec3(1. + w * 0.85, 1. - w, 1. + w * 0.85); vec3 n = normalize(normal / sc); vec3 c = aD.xyz;
            vec3 wp = c + position * sc * aD.w * mix(0.4, 1., smoothstep(1.2, 3.4, length(c - uCamB))); float sw = swellH(vec2(-(c.x - uSeat.x), c.z - uSeat.y));
            if (aE.z > 0.5) {                                            // the image in the sea, laid on the surface along the line of sight
              wp.y = 2. * sw - wp.y; float f = clamp((uCamB.y - sw - 0.04) / max(uCamB.y - wp.y, 0.05), 0., 1.); wp = uCamB + (wp - uCamB) * f * 0.99; }
            wp.y -= (1. - aE.y) * 90.;
            vN = n; vV = wp - uCamB; vM = aE.z;
            vec4 mvPosition = modelViewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: SKY + GLSL_LIT + lens + FOGF + /* glsl */`varying vec3 vN, vV; varying float vM;
          void main(){ vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 V = normalize(vV + vec3(0., 1e-4, 0.));
            if (vM > 0.5) V.y = -V.y;                                      // shade the image as the drop it mirrors
            vec3 c = lensCol(N, V, 1.) + mix(cEmber, cHaze, 0.6) * (0.16 + 0.26 * abs(dot(N, V)));
            if (vM > 0.5) c = c * 0.5 + cRust * 0.1;
            gl_FragColor = vec4(c, 1.);
            #include <fog_fragment>
          }` });
      const ld = new THREE.Mesh(g, mat); ld.name = 'lens-drops'; ld.frustumCulled = false; ld.renderOrder = 1.2; B.add(ld);
      const dB = [0.5, 3.3];                                           // the rain's drift in the brief's frame
      updaters.push((dt, time, camera, u) => {
        const t = Tof(u);
        for (let i = 0; i < N; i++) { const q = list[i], tr = t - q.t0, y = q.p.y - 1.6 * tr, on = Math.abs(tr) < 7 && y > 1.2 ? 1 : 0;
          for (let m = 0; m < 2; m++) { const o = (i * 2 + m);
            aD[o * 4] = q.p.x + dB[0] * tr; aD[o * 4 + 1] = y; aD[o * 4 + 2] = q.p.z + dB[1] * tr; aD[o * 4 + 3] = q.r; aE[o * 3] = q.s; aE[o * 3 + 1] = on; aE[o * 3 + 2] = m; } }
        dAt.needsUpdate = true; eAt.needsUpdate = true;
      });
    }

    // ---- the rare event: one drop three metres across, and the crown it raises ------------------
    const liftU = floatMat.uniforms.uLift.value;
    if (rare) {
      const site = along(0.47, 0, 19, 0, new THREE.Vector3()); site.y = 0;   // lands at u 0.40, 40 m ahead and to starboard
      const RU = U({ uTau: { value: -20 }, uSite: { value: site }, uSeat2: seatU });
      // the drop: a sphere that pulses bun to bell like a jellyfish as it sinks
      const dg = new THREE.SphereGeometry(1.5, 36, 24); dg.scale(1.2, 1.2, 1.2);
      const dm = new THREE.ShaderMaterial({ uniforms: RU, fog: true,
        vertexShader: `uniform float uTime, uTau; uniform vec3 uSite;\n` + FOGV + /* glsl */`varying vec3 vN, vP;
          void main(){ float fall = max(-uTau, 0.); float squash = (1. - smoothstep(0., 0.35, fall));
            float w = 0.22 * sin(uTime * 2.4) + 0.08 * sin(uTime * 5.1 + 1.);
            vec3 p = position; float yn = p.y / 1.5;
            float rad = 1. + w * (0.6 - yn * 0.8) + 0.07 * sin(atan(p.z, p.x + 1e-5) * 5. + uTime * 1.7) * (1. - yn * yn);
            p.xz *= rad * (1. + 0.6 * squash); p.y *= (1. - w * 0.8) * (1. - 0.7 * squash);
            vec3 n = normalize(normal * vec3(1., 1. + w * 1.6 + 2. * squash, 1.) + vec3(0., -0.5 * w * (1. - yn * yn), 0.));
            vec3 wp = uSite + vec3(0.6 * sin(uTime * 0.7), 1.6 + fall * 3.0, 0.6 * cos(uTime * 0.6)) + p;
            if (uTau > 0.15) wp.y = -50.;
            vN = n; vP = wp; vec4 mvPosition = modelViewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform vec3 uCamB;\n` + SKY + GLSL_LIT + lens + FOGF + /* glsl */`varying vec3 vN, vP;
          void main(){ vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 V = normalize(vP - uCamB + vec3(0., 1e-4, 0.));
            gl_FragColor = vec4(lensCol(N, V, 1.), 1.);
            #include <fog_fragment>
          }` });
      const big3 = new THREE.Mesh(dg, dm); big3.frustumCulled = false; big3.renderOrder = 1.5; B.add(big3);
      // the crown: a fluted glass wall 16 m across that climbs to 8 m, splits into 18 points, throws 18 melon beads, folds
      const NAc = 216, NHc = 12, pos = [], aq = [], idx = [];
      for (let j = 0; j <= NHc; j++) for (let i = 0; i < NAc; i++) { const a = i / NAc * Math.PI * 2; pos.push(Math.cos(a), j / NHc, Math.sin(a)); aq.push(i / NAc, j / NHc, 0); }
      for (let j = 0; j < NHc; j++) for (let i = 0; i < NAc; i++) { const a = j * NAc + i, b = j * NAc + (i + 1) % NAc, c = a + NAc, d = b + NAc; idx.push(a, b, c, b, d, c); }
      for (let k = 0; k < 18; k++) { const o = pos.length / 3, a = (k + 0.5) / 18 * Math.PI * 2;        // beads: little 8 x 6 spheres
        for (let j = 0; j <= 6; j++) for (let i = 0; i < 8; i++) { const th = j / 6 * Math.PI, ph = i / 8 * Math.PI * 2;
          pos.push(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); aq.push((k + 0.5) / 18, 1, 1 + k); }
        for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) { const p0 = o + j * 8 + i, p1 = o + j * 8 + (i + 1) % 8, p2 = p0 + 8, p3 = p1 + 8; idx.push(p0, p1, p2, p1, p3, p2); } }
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('aQ', new THREE.Float32BufferAttribute(aq, 3)); cg.setIndex(idx);
      const cm = new THREE.ShaderMaterial({ uniforms: RU, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: `uniform float uTime, uTau; uniform vec3 uSite;\n` + FOGV + /* glsl */`attribute vec3 aQ; varying vec3 vN, vP; varying vec3 vQ;
          void main(){ float t = uTau; float a = aQ.x * 6.2832; float h = aQ.y;
            float rise = smoothstep(0., 1.5, t), fold = smoothstep(3.4, 6.2, t), on = step(0., t) * (1. - smoothstep(5.8, 6.4, t));
            float lobe = sqrt(0.5 + 0.5 * cos(a * 18.) + 1e-4);                      // eighteen round-topped scallops
            float H = 8.0 * rise * (1. - fold) * (0.72 + 0.28 * lobe * smoothstep(0.5, 1., h) * smoothstep(0.7, 1.8, t));
            float R = 3.0 + 5.0 * smoothstep(0., 3.0, t) + (1.4 + 1.6 * rise) * h * h - 2.5 * fold * h;
            R *= 1. + 0.035 * cos(a * 18.) * (0.3 + 0.7 * h) + 0.02 * sin(a * 7. + uTime * 1.3) * h;
            vec3 dir = vec3(cos(a), 0., sin(a)); vec3 p = dir * R + vec3(0., H * h - 0.25, 0.);
            vec3 n = normalize(dir + vec3(0., -(2.8 + 3.2 * rise) * h / max(H, 0.5), 0.) + 0.25 * vec3(-sin(a), 0., cos(a)) * sin(a * 18.));
            if (aQ.z > 0.5) {                                                       // a bead: leaves its point at t 2.3, flies a slow arc
              float k = aQ.z; float tb = max(t - 1.6 - 0.25 * fract(k * 0.618), 0.); float sz = 0.42 + 0.14 * fract(k * 0.37);
              vec3 c0 = dir * (9.4 + 0.2 * sin(k)) + vec3(0., 8.0 * rise, 0.);
              c0 += dir * (2.3 + 0.8 * fract(k * 0.71)) * tb + vec3(0., (2.6 + fract(k * 0.53)) * tb - 0.62 * tb * tb, 0.);
              float show = step(1.3, t) * step(0.3, c0.y); c0.y = max(c0.y, -3.);
              p = c0 + position * sz * show * (1. + 0.15 * sin(uTime * 6. + k) * vec3(1., -1., 1.)); n = normalize(position + vec3(0., 1e-4, 0.)); on = show; }
            vec3 wp = uSite + p * on - vec3(0., 60. * (1. - on), 0.);
            vN = n; vP = wp; vQ = vec3(aQ.xy, aQ.z > 0.5 ? 1. : 0.);
            vec4 mvPosition = modelViewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform vec3 uCamB; uniform float uTau;\n` + SKY + GLSL_LIT + lens + FOGF + /* glsl */`varying vec3 vN, vP; varying vec3 vQ;
          void main(){ vec3 V = normalize(vP - uCamB + vec3(0., 1e-4, 0.)); vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (dot(N, V) > 0.) N = -N;
            vec3 c = lensCol(N, V, 1.); float fr = 1. - abs(dot(N, V));
            float flute = 0.5 + 0.5 * cos(vQ.x * 6.2832 * 18.); float thread = smoothstep(0.75, 1., vQ.y) * (1. - flute);
            // the same glass as the small crowns: two flutes to a lobe, amber through the sunward half, a lip lit only toward the tear
            float band = smoothstep(-0.6, 0.6, cos(vQ.x * 6.2832 * 36. + 0.9)), glassL = mix(0.5, 1.15, band);
            float sunSide = dot(normalize(vN + vec3(0., 1e-4, 0.)), uSun), thru = smoothstep(-0.2, 0.8, sunSide);
            float al = mix(0.2 + 0.55 * fr * fr + 0.14 * band * vQ.y + 0.42 * thru * thru + 0.14 * smoothstep(0.9, 1., vQ.y), 1., vQ.z);
            al *= 1. - 0.75 * thread * (1. - vQ.z);                              // the rim thins to threads between the points
            c = mix(c * glassL * 0.8 * (1. - 0.4 * thru) + mix(cEmber, cHaze, 0.45) * vec3(1.1, 0.9, 0.62) * (0.08 + 0.25 * fr * thru + (1.4 * thru * thru + 0.2 * thru) * glassL * (0.5 + 0.5 * vQ.y)) + mix(cCool, cDeep, 0.3) * 0.45 * (1. - thru) * glassL, c, vQ.z) + uKey * 0.9 * smoothstep(0.93, 1., vQ.y) * (1. - vQ.z) * smoothstep(0.2, 0.85, sunSide);
            gl_FragColor = vec4(c, clamp(al, 0., 1.));
            #include <fog_fragment>
          }` });
      const crown = new THREE.Mesh(cg, cm); crown.frustumCulled = false; crown.renderOrder = 3.5; B.add(crown);
      // its ring: one great swell that runs out under us and lifts every floe and cup
      const rg = new THREE.RingGeometry(0.5, 1, 96, 6); rg.rotateX(-Math.PI / 2);
      const rm = new THREE.ShaderMaterial({ uniforms: RU, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: HASH + `uniform float uTau; uniform vec3 uSite; uniform vec2 uSeat2;\n` + FOGV + /* glsl */`varying vec3 vN, vP; varying float vA;
          void main(){ float t = max(uTau, 0.); float rad = 6. + 5.5 * t; float s = (length(position.xz) - 0.75) * 4.;     // -1..1 across
            float amp = 0.75 * exp(-t * 0.16) * smoothstep(0.4, 1.6, t); vec3 dir = normalize(position + vec3(1e-5, 0., 0.));
            vec3 wp = uSite + dir * (rad + s * 4.5); vec2 hl = vec2(-(wp.x - uSeat2.x), wp.z - uSeat2.y);
            wp.y = swellH(hl) + 0.03 + amp * (0.5 + 0.5 * cos(s * 3.1416));
            vN = normalize(vec3(0., 1., 0.) + dir * amp * 0.55 * sin(s * 3.1416)); vP = wp; vA = (1. - s * s) * step(0.3, uTau) * (1. - smoothstep(14., 22., t));
            vec4 mvPosition = modelViewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform vec3 uCamB;\n` + SKY + FOGF + /* glsl */`varying vec3 vN, vP; varying float vA;
          void main(){ vec3 V = normalize(vP - uCamB + vec3(0., 1e-4, 0.)); vec3 N = normalize(vN); vec3 R = reflect(V, N); R.y = abs(R.y) + 0.004;
            float x1 = 1. - clamp(dot(-V, N), 0., 1.); vec3 c = mix(cInk, skyCol(normalize(R)), 0.3 + 0.7 * x1 * sqrt(x1));
            gl_FragColor = vec4(c, clamp(vA * 1.6, 0., 1.));
            #include <fog_fragment>
          }` });
      const ring = new THREE.Mesh(rg, rm); ring.frustumCulled = false; ring.renderOrder = 0.3; B.add(ring);
      const siteW = new THREE.Vector3(-site.x, 5, site.z);
      rareHook.poi = { at: (time, u) => siteW.set(-site.x, u < 0.40 ? 3 + (Tof(0.40) - Tof(u)) * 3 : 5, site.z), from: 0.255, to: 0.32, weight: 0.5 };
      rareHook.poi2 = { at: (time, u) => siteW.set(-site.x, u < 0.40 ? 3 + (Tof(0.40) - Tof(u)) * 3 : 5, site.z), from: 0.395, to: 0.48, weight: 0.62 };
      updaters.push((dt, time, camera, u) => { const tau = Tof(u) - Tof(0.40); RU.uTau.value = tau; liftU.set(site.x, site.z, 6 + 5.5 * Math.max(tau, 0), tau > 0.4 && tau < 20 ? 0.8 * Math.exp(-tau * 0.16) : 0); });
    }
    await ctx.yield();

    // ---- the drinker's furrow: the water opens in a narrow V behind its jaw. Two low lips that start together and
    // spread to 7 m apart 38 m back, laid along the line the ray actually flew (four points of its track, keyed to u), so
    // it bends with the turn; gold on the faces toward the tear, dusk on the others, a smooth dark trough between; the lips
    // sink back into the mirror with distance.
    {
      const NRw = 40, NXw = 20, pos = [], idx = [];
      for (let j = 0; j <= NRw; j++) for (let i = 0; i <= NXw; i++) pos.push(i / (NXw / 2) - 1, 0, j / NRw);
      for (let j = 0; j < NRw; j++) for (let i = 0; i < NXw; i++) { const a = j * (NXw + 1) + i, b = a + 1, c = a + NXw + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const trail = [0, 1, 2, 3].map(() => new THREE.Vector2());
      const FU = U({ uTr: { value: trail }, uSkOn: { value: 0 }, uSeat2: seatU });
      const mat = new THREE.ShaderMaterial({ uniforms: FU, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: HASH + `uniform vec2 uTr[4]; uniform float uSkOn; uniform vec2 uSeat2;\n` + FOGV + /* glsl */`varying vec3 vN, vP; varying float vA, vH, vX;
          vec2 trk(float t){ float s = clamp(t, 0., 1.) * 3.; vec2 a = uTr[0], b = uTr[1], c = uTr[2], d = uTr[3];
            if (s < 1.) return mix(a, b, s) + 0.25 * s * (1. - s) * (2. * b - a - c);
            if (s < 2.) { float f = s - 1.; return mix(b, c, f) + 0.25 * f * (1. - f) * ((2. * b - a - c) + (2. * c - b - d)); }
            float f = s - 2.; return mix(c, d, f) + 0.25 * f * (1. - f) * (2. * c - b - d); }
          void main(){ float t = position.z, x = position.x, ax = abs(x);
            vec2 c0 = trk(t), tg = trk(t + 0.03) - trk(t - 0.03); tg /= max(length(tg), 1e-4); vec2 r = vec2(tg.y, -tg.x);
            float wd = 0.35 + 8.2 * pow(t, 0.85); vec2 q = c0 + r * x * wd;
            vec2 hl = vec2(-(q.x - uSeat2.x), q.y - uSeat2.y);
            // the lips stand a metre proud at the jaw and sink back into the mirror: a wedge of folded water that dies away behind
            float die = (1. - t) * (1. - t), amp = (1.15 * exp(-t * 2.6) * (1. - t) + 0.14 * die) * smoothstep(0., 0.05, t) * uSkOn;
            float e = (ax - 0.78) / 0.13, lipP = exp(-e * e), prof = lipP;                                           // a lip each side, the smooth trough between
            vec3 wp = vec3(q.x, swellH(hl) + 0.03 + amp * prof, q.y);
            float dp = (-2. * e / 0.13 * lipP) * sign(x) * amp / max(wd, 0.3);
            vN = normalize(vec3(-r.x * dp, 1., -r.y * dp)); vP = wp;
            vA = (1. - t) * (1. - t * t) * uSkOn * smoothstep(0., 0.03, t); vH = lipP; vX = x;
            vec4 mvPosition = modelViewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform vec3 uCamB; uniform vec3 uKey;\n` + SKY + FOGF + /* glsl */`varying vec3 vN, vP; varying float vA, vH, vX;
          void main(){ vec3 V = normalize(vP - uCamB + vec3(0., 1e-4, 0.)); vec3 N = normalize(vN); vec3 R = reflect(V, N); R.y = abs(R.y) + 0.004;
            float x1 = 1. - clamp(dot(-V, N), 0., 1.); vec3 c = mix(mix(cInk, cDeep, 0.6), skyCol(normalize(R)), 0.3 + 0.7 * x1 * sqrt(x1));
            float ef = (abs(vX) - 0.78) / 0.13, lipF = exp(-ef * ef), edge = 1. - smoothstep(0.92, 1., abs(vX));
            float lit = smoothstep(0.02, 0.4, dot(N, uSun) - uSun.y), crest = smoothstep(0.45, 0.92, lipF);
            c = mix(mix(cDeep, cCool, 0.3) * 0.34, c, 0.25 + 0.45 * lit * lipF);                                            // the trough and the faces turned away hold the dusk
            c += vec3(1., 0.84, 0.56) * (0.9 * lit * lipF * (1. - crest) + crest * (1.5 + 1.5 * lit));                // the faces toward the tear are gold, each crest a bright thread
            gl_FragColor = vec4(c, clamp(vA * (0.12 + 2.2 * lipF) * edge, 0., 0.95));
            #include <fog_fragment>
          }` });
      const furrow = new THREE.Mesh(g, mat); furrow.frustumCulled = false; furrow.renderOrder = 0.4; furrow.visible = false; B.add(furrow);
      const fv = new THREE.Vector3(), ft = new THREE.Vector3();
      updaters.push((dt, time, camera, u) => { furrow.visible = skim.on > 0.01; FU.uSkOn.value = skim.on;
        if (skim.on > 0.01) for (let k = 0; k < 4; k++) { scripted(SK, u + 0.004 - 0.011 * k, fv, ft); trail[k].set(fv.x, fv.z); } });
    }

    // ---- ice talus: blocks fallen from the face, under the climb -------------------------------
    {
      const groundY = (x, z) => { let lo = -9, hi = 150; for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (cliffZ(x, mid) < z) lo = mid; else hi = mid; } return (lo + hi) / 2; };
      // one fallen slab: an irregular six-sided block of ice with real thickness (a broken edge half as tall as the slab is wide
      // across its short side), flat faces (16 triangles)
      const rk = rng.fork('talus'), pv = [], NS6 = 6, top = [], bot = [];
      for (let i = 0; i < NS6; i++) { const a = (i + 0.35 * Math.sin(i * 2.4)) / NS6 * Math.PI * 2, r = 0.72 + 0.34 * Math.abs(Math.sin(i * 1.7 + 0.6));
        top.push([Math.cos(a) * r * 0.95 + 0.04, 0.4 + 0.05 * Math.sin(i * 2.1), Math.sin(a) * r * 0.95]); bot.push([Math.cos(a) * r, -0.12, Math.sin(a) * r]); }
      for (let i = 1; i < NS6 - 1; i++) pv.push(...top[0], ...top[i + 1], ...top[i]);
      for (let i = 0; i < NS6; i++) { const j = (i + 1) % NS6; pv.push(...bot[i], ...top[i], ...top[j], ...bot[i], ...top[j], ...bot[j]); }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3)); rg.computeVertexNormals();
      { const ip = rg.attributes.position, nn = rg.attributes.normal;                // faces must point outward whatever the winding
        for (let i = 0; i < ip.count; i += 3) { const cx = (ip.getX(i) + ip.getX(i + 1) + ip.getX(i + 2)) / 3, cy = (ip.getY(i) + ip.getY(i + 1) + ip.getY(i + 2)) / 3 - 0.13, cz = (ip.getZ(i) + ip.getZ(i + 1) + ip.getZ(i + 2)) / 3;
          if (nn.getX(i) * cx + nn.getY(i) * cy + nn.getZ(i) * cz < 0) for (let q = 0; q < 3; q++) nn.setXYZ(i + q, -nn.getX(i + q), -nn.getY(i + q), -nn.getZ(i + q)); } }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', rg.attributes.position); g.setAttribute('normal', rg.attributes.normal);
      // a dozen great slabs and a few dozen small ones (never a carpet): the great ones along the foot shelves, under the clefts they fell from
      const nBig = 13, nR = nBig + Math.round(52 * Math.max(0.7, detail)) + 4, aPos = new Float32Array(nR * 4), aRot = new Float32Array(nR * 4), placed = []; let n = 0;
      const put = (x, y, z, s, yaw, lean) => { const slope = Math.atan2(groundY(x, z + 0.6 * s) - groundY(x, z - 0.6 * s), 1.2 * s);
        aPos.set([x, y - s * 0.07, z, s], n * 4); aRot.set([yaw, slope + lean, rk.range(0.85, 1.25), rk()], n * 4); placed.push([x, z, s]); n++; };
      for (let k = 0; k < 9000 && n < nR - 4; k++) {
        if (k % 20 === 19) await ctx.yield();
        const bigOne = n < nBig, z = bigOne ? rk.range(428, 476) : rk.range(424, 500), cx = 22 + (z - 412) * 0.444, x = cx + rk.gauss() * (bigOne ? 46 : 60), y = groundY(x, z), s = bigOne ? rk.range(4.4, 7.4) : rk.range(1.0, 2.6);
        const keep = bigOne || (rk() < 0.2 + 0.8 * sstep(0.03, 0.5, cleftJ(fluteAJ(x, 60))) && rk() < 1.1 - y / 40);
        if (!keep || y < 0.6 || y > (bigOne ? 30 : 70) || path.distanceTo(-x, y + s * 0.3, z) < 8 + s) continue;
        let clash = false; for (const q of placed) if (Math.hypot(q[0] - x, q[1] - z) < (q[2] + s) * (bigOne ? 1.25 : 0.8)) { clash = true; break; }
        if (clash) continue;
        // each lies flat ON the slope, sunk a hand's breadth; one in five leans on its uphill edge
        put(x, y, z, s, rk.range(0, 6.28), rk() < 0.2 ? rk.range(0.1, 0.2) : rk.range(-0.04, 0.04));
      }
      // three blocks on the treads of the gully stair, beside the climb (they pass the lower frame at u 0.8)
      for (const [zq, off, sq] of [[440, -7, 3.0], [451, -10.5, 3.6], [463, -8, 2.8], [474, -11, 3.2]]) { const yq = 23 + (zq - 416) / 2.25, xq = yq - 2.2 + off; put(xq, groundY(xq, zq), zq, sq, rk.range(0, 6.28), 0); }
      g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 4)); g.setAttribute('aRot', new THREE.InstancedBufferAttribute(aRot, 4)); g.instanceCount = n; g.boundingSphere = big;
      const mat = new THREE.ShaderMaterial({ uniforms: U(), fog: true, side: THREE.DoubleSide,
        vertexShader: FOGV + /* glsl */`attribute vec4 aPos, aRot; varying vec3 vN, vP; varying float vS, vH;
          void main(){ float c = cos(aRot.x), s = sin(aRot.x); vec3 p = position * vec3(1., aRot.z, 1.), n = normal;
            p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c); n = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
            float ct = cos(aRot.y), st = sin(aRot.y);                                         // then laid back on the slope (which rises toward +z)
            p.yz = vec2(p.y * ct + p.z * st, p.z * ct - p.y * st); n.yz = vec2(n.y * ct + n.z * st, n.z * ct - n.y * st);
            vec3 w = aPos.xyz + p * aPos.w; vN = n; vP = w; vS = aRot.w; vH = position.y * 4.;   // (position.y runs -0.12 to 0.45)
            vec4 mvPosition = modelViewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `uniform float uTime, uVeil; uniform vec3 uCamB, uIceKey;\n` + SKY + GLSL_LIT + GLSL_VN + FOGF + /* glsl */`varying vec3 vN, vP; varying float vS, vH;
          void main(){ vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
            float g1 = fb(vP.xz * 0.35 + vP.y * 0.5), side = 1. - smoothstep(0.45, 0.75, abs(N.y)), topF = smoothstep(0.5, 0.85, N.y);
            float bed = sin(vH * 5.5 + vS * 20. + 1.2 * g1), low = 1. - smoothstep(0.0, 0.9, vH + 0.5);                    // vH: -0.5 at the foot of the slab, 1.6 at its top
            // ICE: a smooth frosted top, a pale blue-white broken edge thinly bedded; its foot stands in its own cool shadow
            vec3 frostC = cCream * (0.74 + 0.06 * g1), edgeC = mix(cCream, cCool * 1.9, 0.34) * (0.86 + 0.1 * smoothstep(-0.2, 0.6, bed));
            vec3 alb = mix(frostC, edgeC, side);
            float aoT = (0.62 + 0.38 * smoothstep(-0.6, 0.5, N.y)) * (1. - 0.42 * low * side), nlT = dot(N, uSun);
            float keyT = max(smoothstep(-0.1, 0.3, nlT), 0.6 * topF) * aoT;
            vec3 shT = mix(mix(cDeep, cCool, 0.5) * 0.7, mix(cCool * 1.55, cCream, 0.1), aoT) * (0.3 + 0.7 * dot(alb, vec3(0.333))) * (0.8 + 0.25 * N.y);
            vec3 c = mix(shT, alb * mix(vec3(1.03, 1., 0.95), uIceKey * 1.27, 0.85) * (0.88 + 0.16 * clamp(nlT, 0., 1.)), keyT);
            c += mix(cCool * 1.9, cCream, 0.6) * 0.22 * side * smoothstep(0.9, 1.5, vH) * (1. - keyT);                      // light through the thin top edge
            vec3 Vt = normalize(vP - uCamB + vec3(0., 1e-4, 0.)); float frT = 1. - clamp(dot(N, -Vt), 0., 1.); frT *= frT; frT *= frT;
            vec3 Rt = reflect(Vt, N); Rt = normalize(vec3(Rt.x, 0., Rt.z) + vec3(1e-4, 0.1, 0.)); c = mix(c, skyCol(Rt) * 0.95, (0.04 + 0.3 * frT) * (0.4 + 0.6 * topF));   // a wet sheen on the top
            c *= 1. - 0.3 * uRainDim;
            vec2 gq = floor(vP.xz * 2.3 + vP.y * 1.7); c += uKey * 1.5 * step(0.985, h21(gq + floor(uTime * 1.3 + vS * 9.))) * topF * (1. - smoothstep(0.1, 0.4, length(fract(vP.xz * 2.3 + vP.y * 1.7) - 0.5)));
            gl_FragColor = vec4(c, 1.);
            #include <fog_fragment>
            vec3 dv = vP - uCamB; float dl = max(length(dv), 1e-3); dv /= dl; vec3 dw = vec3(-dv.x, max(dv.y, 0.), dv.z);   // from inside the rain it is lost with its headland
            gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor * 0.9, skyCol(dw / max(length(dw), 1e-4)), 0.8), 0.96 * uVeil * smoothstep(40., 220., dl));
          }` });
      { const sp = [0, 0, 0], NSH = 10; for (let i = 0; i < NSH; i++) { const a0 = i / NSH * 6.2832, a1 = (i + 1) / NSH * 6.2832; sp.length = i * 9; sp.push(0, 0, 0, Math.cos(a1) * 1.75, 0, Math.sin(a1) * 1.75, Math.cos(a0) * 1.75, 0, Math.sin(a0) * 1.75); }
        const sg0 = new THREE.BufferGeometry(); sg0.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); disposables.push(sg0);
        const sgI = new THREE.InstancedBufferGeometry(); sgI.setAttribute('position', sg0.attributes.position); sgI.setAttribute('aPos', g.attributes.aPos); sgI.setAttribute('aRot', g.attributes.aRot); sgI.instanceCount = n; sgI.boundingSphere = big;
        const smat = new THREE.ShaderMaterial({ uniforms: U(), fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
          vertexShader: FOGV + /* glsl */`attribute vec4 aPos, aRot; varying vec2 vQ;
            void main(){ vec3 p = position; float ct = cos(aRot.y), st = sin(aRot.y); vQ = position.xz / 1.75;
              p.yz = vec2(p.y * ct + p.z * st, p.z * ct - p.y * st); vec3 w = aPos.xyz + p * aPos.w + vec3(0., 0.09 * aPos.w + 0.12, 0.);
              vec4 mvPosition = modelViewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: `uniform float uVeil;\n` + SKY + FOGF + /* glsl */`varying vec2 vQ;
            void main(){ float r = length(vQ), a = (1. - smoothstep(0.42, 1., r)); a *= a;
              gl_FragColor = vec4(mix(cDeep, cCool, 0.55) * 0.42, 0.74 * a * (1. - uVeil));
              #include <fog_fragment>
            }` });
        const shadowM = new THREE.Mesh(sgI, smat); shadowM.name = 'talus-shadows'; shadowM.frustumCulled = false; shadowM.renderOrder = 0.2; B.add(shadowM); veiled.push(shadowM); }
      const rocks = new THREE.Mesh(g, mat); rocks.name = 'talus'; rocks.frustumCulled = false; B.add(rocks); veiled.push(rocks); disposables.push(rg);
    }
    await ctx.yield();
    // ---- frost fall: ice dust sifting off the ledges about the notch, glittering in the side light -
    {
      const N = Math.round(5400 * detail), pos = new Float32Array(N * 3), aS = new Float32Array(N), fk = rng.fork('dust');
      for (let i = 0; i < N; i++) { const t0 = fk(), t = i % 2 ? 0.52 + 0.48 * t0 : t0, z = 400 + 150 * t; pos[i * 3] = 22 + (z - 412) * 0.444 + fk.gauss() * (i % 3 === 0 ? 46 * (1 - 0.6 * t) : 16 + 20 * (1 - t)); pos[i * 3 + 1] = fk(); pos[i * 3 + 2] = z; aS[i] = fk(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 1)); g.boundingSphere = big;
      const DU = U({ uBufH2: { value: 900 } });
      const mat = new THREE.ShaderMaterial({ uniforms: DU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `uniform float uTime, uBufH2, uRainDim, uVeil; attribute float aS; varying float vA;
          void main(){ vec3 p = position; float base = 24. + (p.z - 412.) * 0.444 - 30.;
            p.y = base + mod(p.y * 90. - uTime * (0.7 + 0.9 * aS), 90.); p.x += 1.5 * sin(uTime * 0.4 + aS * 40.) ; p.z += 1.2 * cos(uTime * 0.33 + aS * 31.);
            vec4 mv = modelViewMatrix * vec4(p, 1.); float d = max(-mv.z, 0.5);
            float px = (0.07 + 0.09 * aS) * projectionMatrix[1][1] * uBufH2 * 0.5 / d; gl_PointSize = clamp(px, 1.6, 7.);
            float tw = 0.5 + 0.5 * sin(uTime * (3. + 4. * aS) + aS * 77.); tw *= tw;
            vA = (0.3 + 0.7 * tw * tw) * min(px / 1.6, 1.) * smoothstep(1.5, 8., d) * (1. - smoothstep(170., 260., d)) * (1. - uVeil); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 uKey; varying float vA; void main(){ vec2 q = gl_PointCoord * 2. - 1.; float r = dot(q, q); if (r > 1.) discard;
          gl_FragColor = vec4(uKey * 1.9 * vA * (1. - r), 1.); }` });
      const dust = new THREE.Points(g, mat); dust.frustumCulled = false; dust.renderOrder = 6; B.add(dust);
      const v2 = new THREE.Vector2();
      updaters.push(() => { ctx.renderer.getDrawingBufferSize(v2); DU.uBufH2.value = v2.y; });
    }
    //@@NEXT

    const fogA = C[2].clone().lerp(C[0], lightV === 1 ? 0.85 : 0.72).multiplyScalar(lightV === 1 ? 0.85 : 0.98), fogB = C[4].clone().multiplyScalar(0.95);
    const pois = [
      { at: [50, 22, 215], from: 0.0, to: 0.24, weight: 0.5 },                    // the shaft, left of centre
      { at: () => ovWorld, from: 0.347, to: rare ? 0.4 : 0.415, weight: 0.62 },    // the wing overhead: the gaze tips up
      { at: () => laneWorld, from: 0.392, to: 0.475, weight: 0.5 },                 // the still-life: the gaze dips to the crowns in the lane
      { at: () => skWorld, from: 0.43, to: 0.5, weight: rare ? 0 : 0.22 },          // the drinker crossing beyond them
      { at: () => raftWorld, from: 0.475, to: 0.575, weight: 0.3 },                // the kite raft crossing the mirror before the headland (or the buoys)
      { at: [-78, 96, 538], from: 0.5, to: 0.635, weight: 0.45 },                  // the teal ring in the notch
      { at: [-150, 124, 505], from: 0.64, to: 0.735, weight: 0.5 },               // the gaze lifts to starboard, up the fall
      { at: [-21, 98, 500], from: 0.74, to: 0.812, weight: 0.6 },                  // the rays hanging on the violet wall: the gaze turns to port
      { at: () => drWorld, from: 0.84, to: 0.885, weight: 0.1 },                  // the ray letting go of its ledge
    ];
    if (rareHook.poi) pois.push(rareHook.poi, rareHook.poi2);
    return {
      scene, path, duration: 45, pace: paceF, title: 'The Sea of Slow Rain',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 22, sway: 0.5, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: 8, color: pal[6], glow: 1.1, tilt: true, revealDistance: 300 },
      post: { exposure: [0.8, 0.88, 0.76][lightV], bloom: { strength: 0.42, radius: 0.6, threshold: 0.96 },
        grade: { saturation: 1.04, contrast: 1.05, tint: '#fff6ea', shadowTint: '#0c0a16', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);
        W.uU.value = u; camera.getWorldPosition(camB); camB.x = -camB.x;             // the camera in the brief's space
        { const uu = ctx.through ? 0 : u, k0 = 1 - Math.min(1, Math.max(0, (Math.hypot(camB.x - SEAT[0], camB.z - SEAT[2]) - 85) / 85)), k = k0 * k0 * (3 - 2 * k0);
          const out = 1 - sstep(0.46, 0.52, uu);                                    // we come out into gold light in three seconds, not through a ghost
          // the flight OPENS in the dusk under the lid: the rain's own light from the first frame, the headland kept for the far side
          HU.uRainDim.value = Math.max(0.85 * Math.max(k, 0.86 * (1 - sstep(0.2, 0.3, uu))) * out, DUSK_OUT * sstep(0.5, 0.56, uu));
          W.uVeil.value = out * (0.54 + 0.46 * sstep(0.13, 0.27, uu)); W.uIn.value = sstep(0.19, 0.27, uu) * out; { const shown = W.uVeil.value < 0.998; for (let i = 0; i < veiled.length; i++) veiled[i].visible = shown; }
          HU.uShaft.value.z = 0.05 + 0.27 * (1 - sstep(0.3, 0.44, uu)); }                // a skirt of lighter rain lies over the approach
        scene.fog.color.copy(fogA).lerp(fogB, HU.uRainDim.value / 0.85 * 0.8); scene.fog.density = FOGD * (1 - 0.4 * sstep(0.47, 0.56, ctx.through ? 0 : u));
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, time, camera, u);
      },
      dispose() { hero.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
