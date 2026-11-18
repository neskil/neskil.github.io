// Nursery of Dots: a star-forming nebula painted entirely in pointillist dabs.
// Everything visible is a dab (one instanced camera-facing triangle, one of twelve unmixed pigments)
// or a painted hull / dome whose shader lays the same dots. Nothing is lit, nothing is additive.
// The ground (the deck, the level top of the dark cloud) is a painted plane: its dots lie on the plane out to about
// 5 km from the eye; beyond that the far ground is painted as the far wall is, with the wall's own dots laid on the
// sphere of directions about the eye, each still painted with the place on the plane it lies over (deckPaint).
// The flight: the whole canvas -> the plunge at the hero pillar -> a climbing turn up its burning
// rim -> a climbing helix in front of the globule's open mouth: in at the mouth while its veil peels, the star wakes and
// the jets draw out at the near point -> the dive down the upper jet into the portal lying in the disc's middle gap.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/pointillist-nursery.js';
import { DECK_GLSL } from '../parts/pointillist-nursery.js';   // the deck's rule of pigment and of distance, one text for this shader and the deck's dabs

const TAU = Math.PI * 2;

// priming, ultramarine, violet, viridian, rose, orange, lemon
const CANVASES = {
  rose: { name: 'Nursery of Dots', pal: ['#141A3C', '#2B3FA8', '#5B3C9E', '#1F8F78', '#E0607E', '#F28A2E', '#FFF4C2'], primeK: 2.2, glow: 0.0, portal: '#FFF4C2' },
  gold: { name: 'Nursery of Dots, Gold and Teal', pal: ['#10203A', '#1C5F8E', '#6A3FA0', '#17A096', '#E7A63C', '#F27F22', '#FFF0B4'], primeK: 2.2, glow: 0.04, portal: '#FFF0B4' },
  nocturne: { name: 'Nursery of Dots, Nocturne', pal: ['#0C1130', '#2536A6', '#4B2F96', '#24489E', '#6C48B4', '#E8842E', '#FFEEB8'], primeK: 2.4, glow: -0.02, portal: '#FFEEB8' },
  dawn: { name: 'Nursery of Dots, Dawn Canvas', pal: ['#D8CCB2', '#4F6FC4', '#8E6FC0', '#35B8AC', '#EE86A2', '#F59A52', '#FFF7D6'], primeK: 1.0, glow: 0.1, portal: '#FFF7D6' },
};

// the share of warm pigment (orange, gold, lemon) the canvas allows on the deck: the nocturne keeps to sparse sparks
const LAND_WARM = { rose: 1, gold: 1, nocturne: 0.35, dawn: 1 };

const LAND_THINGS = true;   // the knots of the deck, their shadows and streamers (off: nothing of them is dealt)

// ---------- the painted far wall: jittered dot lattices on the direction sphere ----------
const DOME_VS = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  gl_Position = p;
}`;
const DOME_FS = /* glsl */`
uniform vec3 uPig[12];
uniform vec3 uCluster[5];
uniform vec3 uKey;
uniform mat3 uRot;
uniform vec3 uHeroDir;
uniform vec3 uFlank[4];
uniform float uTime, uN, uManner, uPrimeK, uGlow, uSpark, uFlankK, uNarrow;
uniform vec3 uCam, uDeckK, uDeckDeep;   // uDeckK: the deck's world height, pixels per radian, unused
uniform vec4 uDeckPh, uFoot[12];        // uFoot: a pillar's foot on the deck (x, z, radius, length of its painted shadow)
uniform vec2 uLh;                       // the key direction laid flat
uniform vec4 uBank[12];                  // a bank of gas hanging over the deck: (x, z, radius of the ground under it, how near the deck it hangs)
varying vec3 vDir;
vec3 turn(vec3 d, float a, float b){
  float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
  d = vec3(d.x * ca - d.y * sa, d.x * sa + d.y * ca, d.z);
  return vec3(d.x, d.y * cb - d.z * sb, d.y * sb + d.z * cb);
}
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
// one generation of dots: (hash, hash2, mask)
vec3 gen(vec3 d, float n, float seed){
  vec3 p = d * n + seed; vec3 c = floor(p); vec3 f = p - c - .5;
  float h = h31(c + seed), h2 = h31(c + seed + 19.7);
  vec3 q = f - (vec3(h, h2, fract(h * 7.13 + h2 * 3.7)) - .5) * .16;
  float dl = (uManner > .5 && uManner < 1.5) ? max(abs(q.x), max(abs(q.y), abs(q.z))) * 1.22 : length(q);
  return vec3(h, h2, step(dl, .545 + .05 * h2));   // three lattices of these cover well over nine tenths: the wall fuses
}
// Three tiers of tone and the edge between two of them. Inside a tier the hue varies and the value stays close, and
// the tints are pale, so that from across the nebula the wall fuses into quiet graded tone: pearl (pale rose beside
// pale viridian, a little gold), pale ultramarine (a little pale rose and rose pricked through), and the deep
// (ultramarine and violet, a few rose sparks); where the pale ultramarine meets the deep the two are laid side by
// side in a narrow edge, one hue in two values.
// The strongest lights (lemon) and the deepest darks (the dark violet, the priming) are left to the forms in front.
float pick(float g, float h){
  if (g > .70) return h < .48 ? 7. : h < .90 ? 11. : 9.;
  if (g > .46) return h < .84 ? 5. : h < .93 ? 7. : 6.;
  if (g > .40) return h < .5 ? 5. : h < .8 ? 2. : 3.;
  return h < .50 ? 2. : h < .88 ? 3. : h < .88 + uSpark ? 6. : 2.;
}
// ---------- the deck: the level top of the dark cloud the pillars rise from, painted where it lies in the world ----------
// (a plane at one world height; the same swells, rollers, gaps, feet, lights and painted shadows are laid in real dabs by the world)
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float swell(vec2 p){
  vec2 q = p * .001;
  return .5 * sin(q.x * 1.1 + 1.3 * sin(q.y * .7 + uDeckPh.x)) * sin(q.y * 1.3 + uDeckPh.y)
    + .3 * sin(q.x * 2.3 + q.y * 1.7 + uDeckPh.z) + .2 * sin(q.y * 4.1 - q.x * 2.9 + uDeckPh.w);
}
float ripple(vec2 p){ vec2 q = p * .001; return sin(q.x * 9.7 + q.y * 6.1 + uDeckPh.y * 3.) * sin(q.y * 8.3 - q.x * 3.9 + uDeckPh.z * 2.); }
float gapF(vec2 p){ vec2 q = p * .001; return sin(q.x * .83 + uDeckPh.w * 2. + .9 * sin(q.y * .61 + uDeckPh.x * 3.)) * sin(q.y * .97 + uDeckPh.z * 5. + .8 * sin(q.x * .53)); }
// the rollers of the cloud top: long ridges some 1200 m from crest to crest, a sharp crest and a round trough, the
// crests lying square to the key so that every one has a face turned to the cluster and a face turned away; they
// wander, and the broad swell bends them. (al, ac: kilometres toward the key and across it, from the foot of the hero pillar)
float roll(vec2 p, float s0){
  vec2 q = p * .001; float al = dot(q, uLh), ac = q.x * uLh.y - q.y * uLh.x;
  float ph = al * 2.6 + .75 * sin(ac * 1.1 + uDeckPh.x) + .4 * sin(ac * 2.9 + al * 1.3 + uDeckPh.z) + .9 * sin(al * .8 + ac * .5 + uDeckPh.y) + .6 * s0;
  // (no roller runs on for ever: each is a billow some 1300 m long, and the billows of one rank stand between those of the next)
  float bead = smoothstep(.1, .8, .5 + .5 * sin(ac * 2.3 + .5 * ph + 1.1 * sin(al * .9 + uDeckPh.w) + uDeckPh.x * 2.));
  return (1. - abs(sin(ph))) * bead;
}
// tone of the deck at a place, 0 deep .. 1 light: slopes turned to the key are lighter and the creases between the
// rollers deep; a broad reach of ground on the side the cluster's light comes from is lighter; each pillar lays a
// painted shadow away from the key, and the far lip of a gap catches the light.
// warm: the burning rim of a pillar lights the ground round its foot on the side turned to the key, thinning away.
// gas: the bank of gas that hangs over a place tints it (x rose, under the side of the bank turned to the key;
// y viridian, under the side turned away).
float deckTone(vec2 p, float dist, out float gap, out float warm, out vec2 gas){
  float e = 40.;
  float s0 = swell(p), r0 = ripple(p), near = .04;
  vec2 grad = vec2(swell(p + vec2(e, 0.)) - s0 + near * (ripple(p + vec2(e, 0.)) - r0), swell(p + vec2(0., e)) - s0 + near * (ripple(p + vec2(0., e)) - r0)) / e;
  float alK = dot(p, uLh), acK = p.x * uLh.y - p.y * uLh.x;   // metres toward the key and across it, from the foot of the hero pillar
  float ro = roll(p, s0), lr = (ro - roll(p + uLh * e, swell(p + uLh * e))) * 10.;
  float amp = .25 + .75 * (.5 + .5 * sin(acK * .0009 + alK * .0005 + uDeckPh.w));   // (the rollers run high in some reaches and low in others)
  amp *= 1. - smoothstep(3500., 9000., dist);   // (and far off they are too fine to paint: the broad forms carry the distance)
  // (a roller's two faces are planes: one lit from crest to trough, one in shade, and the crest between them a sharp line)
  float t = .45 + .07 * s0 - 100. * dot(grad, uLh) + amp * (.26 * smoothstep(0., .45, lr) - .2 * smoothstep(0., .45, -lr) + .1 * (ro - .4));
  t += .18 * smoothstep(-2500., 3000., alK) * (1. - .6 * smoothstep(2500., 6000., abs(acK)));
  float sh = 0., keep = 1.;
  warm = 0.;
  for (int i = 0; i < 12; i++) {
    vec4 ft = uFoot[i];
    if (ft.z > 0.) {
      vec2 rel = p - ft.xy; float al = -dot(rel, uLh), ac = abs(rel.x * uLh.y - rel.y * uLh.x), dl = length(rel);
      sh = max(sh, smoothstep(-ft.z, ft.z * .6, al) * (1. - smoothstep(ft.w * .55, ft.w, al)) * (1. - smoothstep(ft.z * .7, ft.z * 1.2 + al * .06, ac)));
      keep *= smoothstep(ft.z * 2., ft.z * 5., dl);
      warm = max(warm, (1. - smoothstep(ft.z * .9, ft.z * 3.4, dl)) * smoothstep(-.25, .55, -al / max(dl, 1.)));
    }
  }
  gas = vec2(0.);
  for (int i = 0; i < 12; i++) {
    vec4 bk = uBank[i];
    if (bk.z > 0.) {
      vec2 rel = p - bk.xy;
      float w = bk.w * (1. - smoothstep(bk.z * .3, bk.z * 1.1, length(rel))), sd = smoothstep(-.4, .4, dot(rel, uLh) / bk.z);
      gas += w * vec2(sd, 1. - sd);
    }
  }
  float gf = gapF(p) * keep;
  gap = smoothstep(.9, .93, gf);
  t += 2.2 * (gapF(p + uLh * 60.) * keep - gf) * smoothstep(.7, .9, gf) - .42 * sh;
  warm *= 1. - sh;
  return clamp(t, 0., 1.);
}
vec3 cell2(vec2 g, float rad, float seed){
  float row = floor(g.y); g.x += .5 * mod(row, 2.);
  vec2 id = floor(g), f = fract(g) - .5;
  float h = h21(id + seed), h2 = h21(id + seed + 17.3);
  return vec3(h, h2, step(length(f - (vec2(h, h2) - .5) * .4), rad * (.86 + .3 * h2)));
}
${DECK_GLSL}
float wallTone(vec3 dw);
vec3 deckPaint(vec3 dw){
  float hgt = max(uCam.y - uDeckK.x, 1.), t = hgt / max(-dw.y, 1e-4);
  vec2 p = uCam.xz + dw.xz * t;
  float gap, warm; vec2 gas;
  float tone = deckTone(p, t, gap, warm, gas);
  // the law of distance (by t, the metres to the place, alone): toward the level line the ground goes paler and
  // nearer the tones of the wall that stands over it, its lights sparser and its neighbours closer in value
  float air = deckAir(t);
  // dots laid on the plane, sized as the hulls' dots are (a few pixels deep at any distance): far off they lie flat, as bands
  float cw = max(4. * t * t / (hgt * uDeckK.y), 9. * t / uDeckK.y);
  float lg = log2(max(cw, 1.)), i = floor(lg), f = lg - i, cA = exp2(i);
  vec3 a = cell2(p / cA, .5 * (1. - smoothstep(.45, 1., f)), 0.), b = cell2(p / (cA * 2.) + 3.7, .5 * smoothstep(0., .55, f), 40.);
  vec3 k = vec3(.5, .5, 0.);
  if (b.z > .5) k = b;
  if (a.z > .5) k = a;
  // Far off the plane's cells would lie flat as long dashes, so from about 5 km the dots are the wall's own: laid on
  // the sphere of directions, round at any range, a coarser generation through the middle distance and the wall's
  // fine one from about 8.5 km (the changes of generation wander with a slow noise of the direction: no ruled line).
  // What a dot is painted with is still the place on the plane it lies over.
  float sw = t * .001 + 1.2 * (vn(dw * 23.) - .5);
  vec3 dq = uRot * dw;
  if (sw > 5.) {
    float n = sw > 8.5 ? uN : uN * .5, sd = sw > 8.5 ? 0. : 57.;
    vec3 c3 = gen(turn(dq, 1.1, .7), n * 1.5, 31.7 + sd), b3 = gen(turn(dq, -.6, 2.1), n * .9, 11.3 + sd), a3 = gen(turn(dq, .37, -.52), n, sd);
    k = vec3(.5, .5, 0.);
    if (c3.z > .5) k = c3;
    if (b3.z > .5) k = b3;
    if (a3.z > .5) k = a3;
  }
  // the tiers of tone are the deck's rule (deckPick); a dot strays less from its tier the farther off it lies
  float T = deckFarT(tone * 5. + (k.y - .5) * .6 * (1. - .6 * air), air), pig = deckPick(T, k.x, air);
  float h3 = fract(k.x * 57.31 + k.y * 7.7), h4 = fract(k.x * 23.17 + k.y * 41.3), h5 = fract(k.x * 91.7 + k.y * 13.1);
  bool pool = gap > .5 && h5 > smoothstep(.3, .7, air);   // (a gap far off is dotted over, dot by dot: no dark dash lies on the pale distance)
  bool deep = pool || T < 1.;
  if (pool) pig = k.x < .7 ? 0. : uLandDeep;
  else if (T >= 1.) {
    // the gas overhead: rose, or viridian, laid dot beside dot among the deck's own (their pale tints on a lit slope)
    float gs = gas.x + gas.y;
    if (h4 < .5 * min(gs, 1.) * (1. - .7 * air)) pig = fract(h4 * 37.3) * gs < gas.x ? (T < 3.2 ? 6. : 7.) : (T < 3.2 ? 4. : 11.);
    // the burning rim near by: lemon and gold closest to the foot, then orange, then rose, beside the deck's own
    // ultramarine and violet
    if (h3 < .7 * warm * uLandWarm * (1. - .7 * air)) {
      float heat = warm + (k.y - .5) * .3;
      pig = heat > .72 ? (k.x < .34 ? 10. : k.x < .64 ? 9. : 8.) : heat > .42 ? (k.x < .48 ? 8. : k.x < .8 ? 6. : 9.) : (k.x < .55 ? 6. : k.x < .8 ? 8. : 7.);
    }
  }
  float br = .93 + .07 * sin(uTime * (.35 + k.x * .9) + k.y * 90.);
  vec3 col = pig < .5 ? uDeckDeep : uPig[int(pig + .5)] * (.88 + .14 * k.y) * br;
  // between the dots: the tier's own darker neighbour beside us; with distance the next lighter, so that dot and
  // ground draw together (the switch is dithered cell by cell, never a ruled line)
  float hb = sw > 5. ? h31(floor(dq * uN * .25) + 3.1) : h21(floor(p / 160.) + 7.3);
  bool farB = hb < air * 1.5 - .25;
  if (k.z < .5) col = deep ? uDeckDeep : T < 3.2 ? uPig[farB ? 2 : int(uLandDeep + .5)] * .9 : farB ? uPig[5] * .8 : uPig[2] * .9;
  // the last of the ground before the level line is painted in the wall's own pigments, those of the wall just
  // above the level line in the same direction: ground and wall meet in one band of fused dots
  float sB = smoothstep(.9, .985, air);
  if (sB > 0.) {
    float gh = wallTone(normalize(vec3(dw.x, 0., dw.z)));
    if (k.z > .5) { if (h5 < sB) col = uPig[int(pick(gh + (k.y - .5) * .13, k.x) + .5)] * (.9 + .14 * k.y) * (.9 + .1 * sin(uTime * (.35 + k.x * .9) + k.y * 90.)); }
    else if (hb < sB * 1.2 - .1) col = gh > .70 ? uPig[5] * .95 : gh > .46 ? uPig[5] * .8 : gh > .40 ? uPig[2] : uPig[0] * uPrimeK * .9;
  }
  return col;
}
// the tone of the wall in a direction of the world (its tiers are read off it by pick)
float wallTone(vec3 dw){
  vec3 d = uRot * dw;
  // the glowing gas: a slow curling field, brighter toward the cluster, deeper below
  vec3 w = d * 1.9 + vec3(uTime * .006, 0., -uTime * .004);
  w += .45 * vec3(vn(d * 2.6 + uTime * .012), vn(d * 2.6 + 5.2), vn(d * 2.6 + 9.1 - uTime * .009));
  float g = .64 * vn(w * 1.4) + .30 * vn(w * 3.1 + 7.) + .06 * vn(w * 6.7 + 13.);
  g = .5 + (g - .5) * .85;   // the curling gas is a slow change of tone, not a field of stains
  // value in two masses: one luminous pale passage behind the hero, deep ultramarine and violet everywhere else
  // (at the entry the passage is wide and lies behind all the pillars, each a dark figure on pearl; once we are
  // on the rim it draws in round the egg)
  float hd = max(dot(d, uHeroDir), 0.);
  float fd = max(max(dot(d, uFlank[0]), dot(d, uFlank[1])), max(dot(d, uFlank[2]), dot(d, uFlank[3])));
  hd = max(hd, uFlankK * fd);
  float kd = dot(d, uKey);
  // (graded from one key: lighter toward the cluster, deeper away from it; a pale band stands on the level line
  // where the wall meets the deck, and the wall deepens toward the zenith)
  // The wall is the middle tone of the canvas: pearl only in the glow round the cluster, pale ultramarine on the
  // side toward it, the deep on the side away. So a form in front of it can be both lighter than it (its lights)
  // and darker (its shade). A little of the pale passage stays behind the hero.
  g += mix(.06 * hd * hd, .07 * hd * hd * hd, uNarrow) + .12 * kd + .2 * smoothstep(.86, .97, kd) - .07 + uGlow
    + .08 * (1. - smoothstep(0., .3, dw.y)) - .1 * smoothstep(.45, 1., dw.y);
  // a shadow passage behind the cluster, so its five dabs are the key light (lighter where a pillar stands before it)
  g -= .26 * smoothstep(.935, .982, kd) * (1. - .55 * uFlankK * smoothstep(.93, .99, fd));
  return g;
}
void main(){
  vec3 dw = normalize(vDir);
  if (dw.y < 0.) { gl_FragColor = vec4(deckPaint(dw), 1.); return; }
  vec3 d = uRot * dw;
  float g = wallTone(dw);
  // (between the dots the ground is the tier's own darker neighbour, and the priming only in the deep: no dark prick breaks a pale passage)
  vec3 col = g > .70 ? uPig[5] * .95 : g > .46 ? uPig[5] * .8 : g > .40 ? uPig[2] : uPig[0] * uPrimeK * .9;
  vec3 c = gen(turn(d, 1.1, .7), uN * 1.5, 31.7);
  vec3 b = gen(turn(d, -.6, 2.1), uN * .9, 11.3);
  vec3 a = gen(turn(d, .37, -.52), uN, 0.);
  vec3 k = vec3(0.);
  if (c.z > .5) k = c;
  if (b.z > .5) k = b;
  if (a.z > .5) k = a;
  if (k.z > .5) {
    float pig = pick(g + (k.y - .5) * .13, k.x);   // (a dot strays at most into the tier next to its own)
    if (a.z > .5 && fract(k.x * 91.7 + k.y * 13.1) > .988) pig = 10.;   // an ordinary star: one pale dab
    float br = .9 + .1 * sin(uTime * (.35 + k.x * .9) + k.y * 90.);
    col = uPig[int(pig + .5)] * br * (.9 + .14 * k.y);
  }
  // the cluster: five loaded dabs of lemon, each with a ridge of paint toward the studio light and two rings of
  // halo dots that swap violet and orange, slowly
  for (int i = 0; i < 5; i++) {
    vec3 s = uCluster[i];
    if (dot(d, s) > .98) {
      vec3 t1 = normalize(cross(s, vec3(0., 1., 0.))); vec3 t2 = cross(s, t1);   // right, down
      float sz = i == 0 ? 1. : .84;
      vec2 q = vec2(dot(d, t1), dot(d, t2)) / (.0225 * sz);
      float r = length(q);
      if (r < 1.) {
        vec2 qn = q / max(r, 1e-3);
        float v = smoothstep(.35, .85, r) * dot(qn, vec2(-.707, -.707)) * 1.3 + .34 * sin(q.y * 8. + q.x * 2.5 + float(i) * 3.);
        float tone = v > .4 ? 1. : v < -.4 ? -1. : 0.;
        col = tone < -.5 ? uPig[9] * 1.02 : uPig[10] * (1.06 + .12 * tone + .05 * sin(uTime * .8 + float(i) * 2.1));
      } else if (r < 4.1) {
        float kk = r < 2.55 ? 0. : 1.;
        float rc = 1.8 + 1.5 * kk, n = 10. + 8. * kk;
        float an = atan(q.y, q.x) / 6.2832 + .5 + .13 * kk;
        float cell = floor(an * n);
        vec2 f = vec2((fract(an * n) - .5) * 6.2832 * rc / n, r - rc);
        float hc = h31(vec3(cell, kk, float(i) * 7.));
        float fl = length(f);
        if (fl < .56 - .05 * kk) {
          float par = mod(cell + kk + floor(uTime * .32 + hc * 3.), 2.);
          float tn = dot(f, vec2(-.707, -.707)) > .16 ? 1.14 : 1.;
          col = par < .5 ? uPig[3] * 1.3 * tn : uPig[8] * tn;      // the violet a touch lighter than the shadow it lies on
        }
      }
    }
  }
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- linen weave, fixed to the screen, multiplied over the finished picture ----------
const WEAVE_FS = /* glsl */`
uniform float uPeriod, uK;
void main(){
  vec2 p = gl_FragCoord.xy / uPeriod;
  vec2 c = floor(p), f = fract(p) - .5;
  float par = mod(c.x + c.y, 2.);
  float t = par > .5 ? cos(f.x * 3.1416) * (1. - .5 * abs(f.y)) : cos(f.y * 3.1416) * (1. - .5 * abs(f.x));
  float slub = fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor = vec4(vec3(1. - uK * (1. - t) - uK * .35 * slub), 1.);
}`;

// ---------- the rare event: an unfinished bank, primed linen with a charcoal underdrawing ----------
const BARE_VS = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const BARE_FS = /* glsl */`
uniform vec3 uPig[12];
uniform vec4 uSeg[100];
uniform vec2 uSize;
uniform float uFill, uPrimeK, uTime, uGone;
varying vec2 vUv;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float segD(vec2 p, vec4 s){ vec2 a = s.xy, b = s.zw; vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); return length(pa - ba * h); }
// distance in from the torn edge of the bank, in metres (a ragged bank, not a card)
float tearF(vec2 p){
  vec2 ec = abs(p / uSize - .5) * 2.;
  float se = 1. - pow(ec.x * ec.x * sqrt(ec.x) + ec.y * ec.y * sqrt(ec.y) + 1e-6, .4);   // rounder than a card: no straight side
  return se * .5 * uSize.x - 40. - 320. * (.6 * vn2(p * .0042 + 3.) + .28 * vn2(p * .013 + 11.) + .12 * vn2(p * .041 + 5.)) - uGone * 900.;   // once behind us it frays away to nothing
}
// one loose lattice of dabs, turned so that no two lattices share a row; the painter works upward and a dab
// swells as it lands, each a little early or late so the working edge is ragged. Returns (hash, hash2, covered).
vec3 lay(vec2 p, float cell, float ang, float seed, out vec2 ctr){
  float ca = cos(ang), sa = sin(ang);
  vec2 g = vec2(p.x * ca + p.y * sa, -p.x * sa + p.y * ca) / cell + seed;
  float row = floor(g.y), sh = .5 * mod(row, 2.); g.x += sh;
  vec2 id = floor(g), f = fract(g) - .5;
  float h = h21(id + seed), h2 = h21(id + seed + 41.);
  vec2 cl = (id + .5 - vec2(sh, 0.) - seed) * cell;
  ctr = vec2(cl.x * ca - cl.y * sa, cl.x * sa + cl.y * ca);
  float front = uFill * (uSize.y + 300.) - 150. + 46. * sin(ctr.x * .011 + seed) + 28. * sin(ctr.x * .037 + seed * 2.);
  float land = clamp((front - ctr.y) / 60. + (h - .5) * 2.4, 0., 1.);
  // the painter has already worked in from the torn edge: a ragged border of dabs is there from the first frame
  land = max(land, clamp(1.25 - tearF(ctr) / (70. + 150. * h2), 0., 1.) * step(.22, h));
  vec2 q = f - (vec2(h, h2) - .5) * .34;
  q.x *= 1. + .35 * h;
  return vec3(h, h2, step(length(q), (.2 + .12 * h2) * land) * step(.001, land));
}
void main(){
  vec2 p = vUv * uSize;                       // metres on the canvas
  float aa = max(fwidth(p.x) + fwidth(p.y), 1e-3);
  float tear = tearF(p);
  if (tear < 0.) discard;
  // bare linen: warm ecru, the blue priming scrubbed thinly over part of it, and a weave coarse enough to see from
  // across the nebula (its thread never under about four pixels: the period doubles with distance)
  float per = 9. * exp2(ceil(log2(max(aa * 4. / 9., 1.))));
  vec2 th = p / per; vec2 tc = floor(th), tf = fract(th) - .5;
  float wv = mod(tc.x + tc.y, 2.) > .5 ? cos(tf.x * 3.1416) * (1. - .6 * abs(tf.y)) : cos(tf.y * 3.1416) * (1. - .6 * abs(tf.x));
  float slub = h21(tc);
  float wash = smoothstep(.42, .62, .6 * vn2(p * .0031 + 7.) + .4 * vn2(p * .011 + 2.));
  vec3 linen = vec3(.40, .35, .28) * (.72 + .36 * wv + .1 * slub);
  // the ground is the canvas's own priming, scrubbed over the linen: thinner in places, where the thread shows warmer
  vec3 col = mix(mix(uPig[0] * uPrimeK, uPig[2], .34) * (.8 + .3 * wv + .08 * slub), linen, .05 + .1 * wash);
  // charcoal: three pillars, the fingers, the egg, hatching on the shade side, the construction lines
  float dmin = 1e5;
  for (int i = 0; i < 100; i++) dmin = min(dmin, segD(p, uSeg[i]));
  // (a charcoal line is never thinner than two pixels, and its grain shows only close to)
  float grit = mix(1., .5 + .5 * h21(floor(p / 5.)), clamp(4. / aa, 0., 1.));
  float lw = max(4., aa * 1.15);
  float line = (1. - smoothstep(lw, lw + aa * 1.1 + 1.5, dmin + 3. * vn2(p * .05) * clamp(4. / aa, 0., 1.))) * grit;
  col = mix(col, vec3(.05, .04, .045), line * .4);
  // the dots: four lattices of different sizes; inside the drawn pillar they are shade and a burning left edge
  vec2 ca, cb, cc, cd, ck;
  vec3 a = lay(p, 69., 0., 3., ca), b = lay(p, 51., .55, 17., cb), c = lay(p, 30., -.35, 29., cc), d = lay(p, 39., 1.1, 43., cd);
  vec3 k = vec3(0.); ck = p;
  if (a.z > .5) { k = a; ck = ca; }
  if (b.z > .5) { k = b; ck = cb; }
  if (d.z > .5) { k = d; ck = cd; }
  if (c.z > .5) { k = c; ck = cc; }
  if (k.z > .5) {
    float h = k.x;
    float cxx = uSize.x * .62 - .2131 * ck.y;
    float hww = mix(200., 120., clamp(ck.y / 1100., 0., 1.)) * (1. + .12 * sin(ck.y * .011));
    float sx = (ck.x - cxx) / hww;
    vec2 eg = (ck - vec2(uSize.x * .62 - .2131 * 1100. - 60., 1420.)) / vec2(150., 175.);
    bool inE = dot(eg, eg) < 1.;
    float pig = h < .28 ? 6. : h < .50 ? 4. : h < .66 ? 7. : h < .78 ? 5. : h < .90 ? 11. : 8.;
    if ((ck.y < 1100. && abs(sx) < 1.) || inE) {
      float lit = inE ? -eg.x - .3 * eg.y : -sx;
      pig = lit > .5 ? (h < .45 ? 8. : h < .75 ? 10. : 9.) : (h < .42 ? 1. : h < .74 ? 2. : h < .92 ? 3. : 5.);
    }
    col = uPig[int(pig + .5)] * (.9 + .1 * sin(uTime * (.4 + h) + k.y * 60.));
  }
  gl_FragColor = vec4(col, 1.);
}`;

export default {
  id: 'pointillist-nursery',
  name: 'Nursery of Dots',
  category: 'sky',
  weirdness: 0.5,
  media: ['space'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = (ctx.quality && ctx.quality.detail) || 1;
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const scene = new THREE.Scene();

    // ---------- seeded variations ----------
    const hour = vary.hour || 'any';
    const vr = rng.fork('variation');                            // a fork, so that small seeds do not all pick alike
    const canvasId = hour === 'night' ? 'nocturne' : hour === 'golden' ? 'gold' : hour === 'dawn' ? (vr.chance(0.6) ? 'dawn' : 'rose')
      : hour === 'day' ? vr.pick(['rose', 'rose', 'dawn', 'gold']) : vr.pick(['rose', 'rose', 'rose', 'gold', 'nocturne', 'dawn']);
    const canvas = CANVASES[canvasId];
    const manner = vr.pick([0, 0, 1, 2]);                        // round dots, square tesserae, comma dashes
    const dabScale = manner === 1 ? vr.range(1.1, 1.5) : manner === 2 ? vr.range(0.9, 1.25) : vr.range(0.75, 1.15);
    const composition = vr.pick(['three', 'three', 'colossus', 'wall']);
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const dens = (0.75 + 0.25 * density) * (detail < 1 ? 0.45 + 0.55 * detail : 1);   // 240k .. 330k dabs
    const rare = !!vary.rare;
    scene.background = new THREE.Color(canvas.pal[0]);
    // Streams for the dab populations that have been repainted (the hero's, and the crust of the flanking pillars),
    // so that how many dabs they take moves nothing that has a seat: the loose banks, the box of dabs, the tadpoles,
    // the shoals and the cluster are all dealt from the main stream. A fork costs its parent one draw, so these are
    // forked from the variation stream, after its last pick.
    const heroDabs = vr.fork('hero-dabs'), cr = vr.fork('flank-crust');

    // ---------- the hero ----------
    const hero = await buildHero(ctx, {
      palette: canvas.pal, progress: 0, manner, primeK: canvas.primeK, dabScale, dabRng: heroDabs,
      tadpoles: Math.round(clamp(rng.range(10, 60) * density, 10, 60)), planets: rng.int(1, 3),
      density: clamp(0.62 + 0.38 * density, 0.6, 1),
    });
    scene.add(hero.object);
    const an = hero.anchors, kit = hero.kit, P = kit.P, U = hero.uniforms;
    U.uLandWarm.value = LAND_WARM[canvasId]; U.uLandDeep.value = canvasId === 'dawn' ? P.ULTRA : P.DVIOLET;
    const G = an.globuleCenter, A = an.discNormal, S = an.portalSeat.position, L = an.clusterDir;
    const Lh = V3(L.x, 0, L.z).normalize();
    await ctx.yield();

    // ---------- the route ----------
    const tmp = V3(0, 0, 0), tmp2 = V3(0, 0, 0), ax = V3(0, 0, 0);
    const litA = an.litU * TAU;
    const rim = [];
    for (let k = 0; k <= 8; k++) {                              // a climbing turn up the lit rim, crust on our right
      // (the turn round the pillar eases off toward the top and the camera drifts out from the crust, so that it
      // leaves the rim heading out over the lit side and not round the back)
      const t = k / 8, a = litA - 0.95 + 1.3 * (1 - Math.pow(1 - t, 1.8)), v = lerp(0.69, 0.925, t);
      an.pillarPoint(((a / TAU) % 1 + 1) % 1, v, tmp); an.axisAt(v, ax);
      tmp2.set(tmp.x - ax.x, 0, tmp.z - ax.z).normalize();
      tmp.addScaledVector(tmp2, 30 + 12 * t + 70 * smoothstep(0.55, 1, t) * t);
      for (let i = 0; i < 80 && an.hullDist(tmp) < 38; i++) tmp.addScaledVector(tmp2, 3);
      if (k) {                                                  // never steeper than about 52 degrees: the camera cannot fly straight up
        const prev = rim[rim.length - 1], top = prev.y + Math.hypot(tmp.x - prev.x, tmp.z - prev.z) * 1.28;
        if (tmp.y > top) { tmp.y = top; for (let i = 0; i < 80 && an.hullDist(tmp) < 38; i++) tmp.addScaledVector(tmp2, 3); }
      }
      // (and no two points so close that the curve between them is decided by noise)
      if (k > 1 && Math.hypot(tmp.x - rim[rim.length - 1].x, tmp.z - rim[rim.length - 1].z) < 36) { if (k < 8) continue; rim.pop(); }
      rim.push(tmp.clone());
    }
    // the spiral: from the top of the rim the camera leaves the pillar on its lit side and climbs a turn and a half
    // of a wide helix standing in front of the egg's open mouth, looking at the egg all the way (the gaze is held by
    // a poi). The first turn swings out and comes back straight at the mouth while the veil peels; at the near
    // point, under 400 m from the star and looking down into the open bowl, the star lights and the jets draw out
    // overhead; the last turn carries us up and round onto the dive line beside the upper jet. The egg's dark back
    // is never the subject. Frame: er = the jet axis laid flat (out of the mouth), el = level and square to it.
    const DIVE = 600;                                           // metres of straight dive down the jet
    const er = V3(A.x, 0, A.z).normalize(), el = V3(-er.z, 0, er.x);
    const P1 = rim[rim.length - 1];
    if (tmp.subVectors(P1, G).dot(el) < 0) el.negate();
    const lS = tmp.subVectors(S, G).dot(el);                    // the dive line lies this far to the side of the axis
    const D0 = S.clone().addScaledVector(A, DIVE);
    const Rl = 170, Cr = tmp.subVectors(D0, G).dot(er) + 125, Cl = lS + Rl;
    const loop = [];
    for (let k = 0; k < 14; k++) {                              // 150 degrees round to -75 of the next turn, the near side at k = 7
      const a = THREE.MathUtils.degToRad(150 - 45 * k);
      loop.push(G.clone().addScaledVector(er, Cr + Rl * Math.cos(a)).addScaledVector(el, Cl + Rl * Math.sin(a)));
    }
    {
      const yE = P1.y, yQ = D0.y + 55;                          // the last of the helix stands a little over the top of the dive
      const cum = []; let acc = 0, px = P1.x, pz = P1.z;
      for (const p of loop) { acc += Math.hypot(p.x - px, p.z - pz); cum.push(acc); px = p.x; pz = p.z; }
      loop.forEach((p, i) => {
        p.y = yE + (yQ - yE) * (1 - Math.pow(1 - cum[i] / acc, 1.3));
        for (let j = 0; j < 60 && an.hullDist(p) < 60; j++) p.addScaledVector(tmp.subVectors(p, G).normalize(), 6);
      });
    }
    const r0 = rim[0];
    const inDir = V3(-0.27, 0, -0.963).normalize(), rightOf = V3(-inDir.z, 0, inDir.x);
    // The layout of the canvas: its axis runs along inDir to the foot of the rim, and the layout's origin lies on
    // the axis 2330 m before that foot. The flanking pillars, the rare bank and the painted contours of the pillars
    // are placed along and across this axis from that origin, so they stand where they stand whatever the route does.
    const eye0 = r0.clone().addScaledVector(inDir, -2330); eye0.y = r0.y - 6;
    // The approach, by places in the world: metres before the foot of the rim along the axis, to the right of the
    // axis, above the foot. It begins far back and high, over the whole group of pillars standing on the deck, comes
    // down and in toward the axis, passes through the gate (two lesser pillars standing either side of the axis,
    // GATE metres before the foot of the rim) and runs level to the plunge at the hero pillar.
    const GATE = 1380;
    const ap = (back, right, up) => r0.clone().addScaledVector(inDir, -back).addScaledVector(rightOf, right).setY(r0.y + up);
    const entry = ap(3400, 130, 540);
    const pts = [entry, ap(3200, 128, 536), ap(2600, 100, 430), ap(1950, 45, 240), ap(GATE, 0, 70), ap(850, 0, -6),
      r0.clone().addScaledVector(inDir, -330).add(V3(30, -12, 0)),
      ...rim, ...loop,
      D0, S.clone().addScaledVector(A, DIVE - 140), S.clone().addScaledVector(A, 340), S.clone().addScaledVector(A, 210),
      S.clone().addScaledVector(A, 70), S.clone()];
    await ctx.yield();
    const path = makePath(pts, { samples: 480 });
    await ctx.yield();
    const uOfPoint = (p) => { let best = 1e18, bu = 0; for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, tmp); const d = tmp.distanceToSquared(p); if (d < best) { best = d; bu = i / 400; } } return bu; };
    const uRim = uOfPoint(rim[1]), uTop = uOfPoint(P1);
    await ctx.yield();
    const uDive = uOfPoint(D0);
    await ctx.yield();
    const uIn = uOfPoint(loop[5]), uNear = uOfPoint(loop[7]);    // heading in at the mouth; the near point, looking down into it
    const uFar = lerp(uIn, uNear, 0.6);                         // where the star takes hold
    await ctx.yield();
    const uPeel0 = uOfPoint(loop[3]);                           // the veil holds while we swing out and lifts as we come back in at the mouth
    await ctx.yield();
    const mt = (d) => d / path.length;                          // a stretch of the route given in metres, as a share of it
    const uGate = uOfPoint(pts[4]);                             // between the two gate pillars

    // ---------- shared painter's helpers ----------
    const pa = V3(0, 0, 0), pb = V3(0, 0, 0), pc = V3(0, 0, 0), nn = V3(0, 0, 0), tu = V3(0, 0, 0), tv = V3(0, 0, 0);
    const sample = (fn, u, v) => {                               // -> pa, nn (outward), tu, tv
      const e = 0.004, vv = Math.min(v, 1 - e);
      fn(u, vv, pa); fn(u + e, vv, pb); fn(u, vv + e, pc);
      tu.subVectors(pb, pa); tv.subVectors(pc, pa); nn.crossVectors(tv, tu);
      if (nn.lengthSq() < 1e-10) nn.set(0, 1, 0);
      nn.normalize(); tu.normalize(); tv.normalize();
    };
    const rotAt = (p, r = rng) => noise.n3(p.x * 0.002, p.y * 0.002, p.z * 0.002) * Math.PI + r.range(-0.35, 0.35);
    const sink = { add() {} };                                  // takes a dab and lays nothing
    // one dab on a surface and, now and then, its complementary partner; `r` is the stream it is drawn from. In the
    // shade the partner is a rare prick of orange: it is drawn seven times in a hundred, as partners in the shade
    // always were, and laid for half of those, so that the count of draws a dab takes does not depend on how rare
    // the prick is.
    // (`flow` is the direction the dab's stroke is laid along: up the form by default, along its row where one is given)
    const addSurf = (bank, size, bias = 0, r = rng, flow = tv) => {
      const l = nn.dot(L) * 0.5 + 0.5 + bias + (r() - 0.5) * 0.16;
      const pig = kit.pickPigment(l, r()), s = size * dabScale;
      bank.add(pa.x + nn.x * s * 0.15, pa.y + nn.y * s * 0.15, pa.z + nn.z * s * 0.15, s, r(), pig, rotAt(pa, r), flow.x, flow.y, flow.z, 0);
      const x = r();
      if (x < (l > 0.76 ? 0.36 : 0.07)) {
        const k = 0.6 * s * r.sign(), h = r(), rot = rotAt(pa, r);
        if (l > 0.76 || x < 0.035) bank.add(pa.x + tu.x * k + nn.x * s * 0.2, pa.y + tu.y * k + nn.y * s * 0.2, pa.z + tu.z * k + nn.z * s * 0.2, s * 0.55, h, l > 0.76 ? kit.COMPLEMENT[pig] : P.ORANGE, rot, flow.x, flow.y, flow.z, 0);
      }
    };
    const N = (n) => Math.round(n * dens);

    // ---------- flanking pillars and the dark roots everything rises from ----------
    const Y0 = -900;
    const DECK_Y = -120;                                        // the deck: the level top of the dark cloud, at one world height
    const litAng = Math.atan2(Lh.z, Lh.x);
    const mkPillar = (o, r = rng) => {                          // (`r`: the stream its two shape offsets are drawn from)
      const o1 = r.range(-40, 40), o2 = r.range(-40, 40), rr = o.H * 0.38 / 2.4;
      const axis = (y, out) => {                                // returns the horn angle (0 without a curl)
        const k = Math.max(0, y) / o.H, lean = Math.tan(o.lean) * o.H * Math.min(k, o.curl ? 0.62 : 1);
        out.set(o.x + Lh.x * lean + 40 * Math.sin(k * 4 + o1) * k, y, o.z + Lh.z * lean + 30 * Math.sin(k * 3 + o2) * k);
        if (o.curl && k > 0.62) {
          const th = (k - 0.62) * o.H / rr;
          out.y = 0.62 * o.H + rr * Math.sin(th);
          out.x += Lh.x * rr * (1 - Math.cos(th)) * 1.25; out.z += Lh.z * rr * (1 - Math.cos(th)) * 1.25;
          return th;
        }
        return 0;
      };
      const fn = (u, v, out) => {
        const a = u * TAU, y = lerp(Y0, o.H, v), k = Math.max(0, y) / o.H;
        const th = axis(y, ax);
        let R = o.R * lerp(1.25, 0.7, o.skirt ? 0 : k) * (1 + 1.5 * smoothstep(0, Y0, y));
        if (o.curl) R *= 1 - 0.55 * smoothstep(0.62, 1, k);
        if (k > 0.9 && !o.skirt) R *= Math.sqrt(Math.max(0, 1 - Math.pow((k - 0.9) / 0.1, 2)));
        if (o.skirt) R *= 1 + 0.12 * smoothstep(0.8, 1, v);
        const dx = Math.cos(a), dz = Math.sin(a);
        R *= 1 + 0.26 * noise.fbm3(dx * 1.4 + o1, y * 0.004 + o2, dz * 1.4, 3) + 0.07 * noise.n3(dx * 4 + o2, y * 0.014, dz * 4 + o1)
          + (o.skirt ? 0 : 0.3 * Math.sin(a * 3 + o1) * smoothstep(0.7, 0.93, k));
        let rx = dx * R, ry = 0, rz = dz * R * 0.85;
        if (th) {                                               // turn the cross-section with the horn
          const q = rx * Lh.x + rz * Lh.z, c = Math.cos(th) - 1, s = Math.sin(th);
          rx += q * Lh.x * c; rz += q * Lh.z * c; ry = -q * s;
        }
        return out.set(ax.x + rx, ax.y + ry, ax.z + rz);
      };
      return { o, fn, axis };
    };
    const flanks = [];
    const heroRoot = mkPillar({ x: 0, z: 0, H: 150, R: 300, lean: 0, skirt: true });
    const e0 = eye0;
    const at = (fwd, right) => ({ x: e0.x + inDir.x * fwd + rightOf.x * right, z: e0.z + inDir.z * fwd + rightOf.z * right });
    const lean12 = () => THREE.MathUtils.degToRad(rng.range(10, 14));
    if (composition === 'three') {
      flanks.push(mkPillar({ ...at(4300 + rng.range(-200, 300), -950 + rng.range(-150, 150)), H: rng.range(2000, 2250), R: rng.range(250, 300), lean: lean12() }));
      flanks.push(mkPillar({ ...at(1500 + rng.range(-100, 200), 980 + rng.range(-40, 120)), H: rng.range(1020, 1180), R: rng.range(190, 230), lean: lean12() }));
    } else if (composition === 'colossus') {
      flanks.push(mkPillar({ ...at(4500 + rng.range(-200, 300), -1150 + rng.range(-150, 150)), H: rng.range(3000, 3400), R: rng.range(380, 440), lean: lean12(), curl: true }));
    } else {
      flanks.push(mkPillar({ ...at(4300, -950), H: rng.range(1900, 2200), R: rng.range(230, 270), lean: lean12() }));
      flanks.push(mkPillar({ ...at(1250, 580), H: rng.range(1000, 1150), R: rng.range(180, 215), lean: lean12() }));
      flanks.push(mkPillar({ ...at(4700, 900), H: rng.range(1700, 1950), R: rng.range(210, 250), lean: lean12() }));
      flanks.push(mkPillar({ ...at(3300, -2100), H: rng.range(1350, 1600), R: rng.range(200, 240), lean: lean12() }));
    }
    // ---------- the gate and the young pillars: lesser forms that the approach passes ----------
    // Two gate pillars stand either side of the canvas's axis, GATE metres before the foot of the rim, and the route
    // runs between them: near surfaces pass on both sides while the far pillars stand unmoved behind. A few young
    // pillars stand on the deck either side of the approach. All are placed by world coordinates, along and across
    // the canvas's axis, from a stream of their own, and are shaped, painted and modelled like the flanking pillars.
    const ls = ctx.core.makeRng(ctx.core.hashSeed('lesser-pillars:' + ctx.seed));
    const lesser = [];
    for (const side of [-1, 1]) {
      const g = mkPillar({ x: 0, z: 0, H: side < 0 ? ls.range(1750, 1950) : ls.range(1500, 1650), R: ls.range(105, 130), lean: THREE.MathUtils.degToRad(ls.range(4, 6)) }, ls);
      // (its axis, at the height the route passes, stands 190 to 225 m to the side of the canvas's axis)
      const want = ap(GATE + ls.range(-70, 70), side * ls.range(190, 225), 70);
      g.axis(want.y, ax); g.o.x = want.x - ax.x; g.o.z = want.z - ax.z; g.gate = side;
      // a margin in space: no part of it nearer the route than 55 m (measured from its surface to the route itself)
      for (let pass = 0; pass < 4; pass++) {
        let near = 1e9;
        for (let j = 0; j <= 14; j++) for (let i = 0; i < 24; i++) { g.fn(i / 24, (lerp(want.y - 420, Math.min(want.y + 420, g.o.H), j / 14) - Y0) / (g.o.H - Y0), tmp); near = Math.min(near, path.distanceTo(tmp.x, tmp.y, tmp.z)); }
        if (near >= 55) break;
        g.o.x += rightOf.x * side * (60 - near); g.o.z += rightOf.z * side * (60 - near);
      }
      lesser.push(g);
      await ctx.yield();
    }
    for (let k = 0, tries = 0; k < 5 && tries < 80; tries++) {
      const p = ap(ls.range(450, 3000), (k % 2 ? 1 : -1) * ls.range(430, 1250), 0), H = ls.range(380, 820), R = ls.range(120, 200), lean = THREE.MathUtils.degToRad(ls.range(3, 8));
      if (Math.hypot(p.x + 180, p.z) < 900 || [...flanks, ...lesser].some((f) => Math.hypot(p.x - f.o.x, p.z - f.o.z) < f.o.R + R + 350)) continue;
      lesser.push(mkPillar({ x: p.x, z: p.z, H, R, lean }, ls)); k++;
    }
    const hulls = [kit.gridGeometry(32, 10, heroRoot.fn, 2048, 1024)];
    for (const f of flanks) { hulls.push(kit.gridGeometry(36, 30, f.fn, 2048, Math.round((f.o.H - Y0) / 256) * 256)); await ctx.yield(); }
    for (const f of lesser) {                                   // (a lesser pillar's hull begins a little under the deck)
      const vD = (DECK_Y - 60 - Y0) / (f.o.H - Y0);
      hulls.push(kit.gridGeometry(f.gate ? 30 : 24, f.gate ? 26 : 12, (u, v, out) => f.fn(u, vD + (1 - vD) * v, out), f.gate ? 768 : 1024, Math.max(128, Math.round((f.o.H - DECK_Y + 60) / 128) * 128)));
      await ctx.yield();
    }
    const flankHull = new THREE.Mesh(kit.mergeGrids(hulls), kit.hullMat(0, THREE.DoubleSide));
    flankHull.frustumCulled = false; scene.add(flankHull);
    await ctx.yield();

    const crust = new kit.Bank(), spray = new kit.Bank();
    const litUf = ((litAng / TAU) % 1 + 1) % 1;
    const sprayPig = () => { const h = rng(); return h < 0.46 ? P.ORANGE : h < 0.72 ? P.LEMON : h < 0.93 ? P.GOLD : P.ROSE; };
    await ctx.yield();
    // (on the flanking pillars the warm crust is a contour down the lit edge; the body stays ultramarine and violet)
    const wsum = flanks.reduce((s, f) => s + f.o.H * f.o.R, 0) || 1;
    for (const f of flanks) {
      const share = f.o.H * f.o.R / wsum, v0 = (-250 - Y0) / (f.o.H - Y0);
      const farK = clamp(Math.hypot(f.o.x - eye0.x, f.o.z - eye0.z) / 2600, 1, 1.7);   // the far pillars keep a contour the canvas's axis can see
      // where the lit side is turned toward the axis's origin (a pillar on the right), the seam is laid round toward
      // the left-hand contour and its spray is thinned; where the lit side is the contour itself (a pillar on the
      // left), it is laid a little round to the front, as a band
      const vdx = f.o.x - eye0.x, vdz = f.o.z - eye0.z;
      let dEdge = Math.atan2(-vdx, vdz) - litAng; dEdge -= Math.round(dEdge / TAU) * TAU;
      const turned = dEdge > 0.35, seamOff = turned ? 0.05 : -0.05, litOff = turned ? 0.04 : 0;
      // The crust has been repainted (a heavier seam, a darker body) and is laid from its own stream, `cr`. The main
      // stream first takes the draws the three generations took before the repainting, dab for dab and laying
      // nothing: this pillar's spray and everything dealt after the pillars is drawn from it, and so keeps its seat.
      for (let i = 0, n = N(1400 * share); i < n; i++) { sample(f.fn, i % 2 ? (litUf + seamOff + rng.gauss() * 0.05 * farK + 2) % 1 : rng(), rng.range(v0, 0.99)); addSurf(sink, rng.range(44, 70) * (i % 2 ? farK : 1), i % 2 ? 0.2 : -0.15); if ((i & 255) === 255) await ctx.yield(); }
      for (let i = 0, n = N(11000 * share); i < n; i++) { sample(f.fn, i % 3 ? (litUf + litOff + rng.gauss() * 0.07 + 2) % 1 : rng(), rng.range(v0, 0.99)); addSurf(sink, rng.range(20, 32), i % 3 ? 0.03 : -0.15); if ((i & 255) === 255) await ctx.yield(); }
      for (let i = 0, n = N(12500 * share); i < n; i++) { sample(f.fn, i % 4 ? (litUf + litOff + rng.gauss() * 0.06 + 2) % 1 : rng(), lerp(v0, 0.99, Math.pow(rng(), 0.7))); addSurf(sink, rng.range(9, 15), i % 4 ? 0.05 : -0.15); if ((i & 255) === 255) await ctx.yield(); }
      await ctx.yield();
      // (laid in rows that follow the surface: rings round the pillar at even steps of height, each dab a stroke along
      // its ring. Half of each generation is dealt evenly round the pillar and half crowds the side toward the key,
      // and every dab takes the pigment the modelling gives the surface it lies on: none is pushed lighter or darker.)
      const span = f.o.H - Y0, rowF = (v, m) => (Math.floor(v * span / m) + 0.5) * m / span;
      for (let i = 0, n = N(2400 * share); i < n; i++) { sample(f.fn, i % 2 ? (litUf + seamOff + cr.gauss() * 0.05 * farK + 2) % 1 : cr(), rowF(cr.range(v0, 0.99), 56)); addSurf(crust, cr.range(44, 70) * (i % 2 ? farK : 1), 0, cr, tu); if ((i & 255) === 255) await ctx.yield(); }
      for (let i = 0, n = N(11000 * share); i < n; i++) { sample(f.fn, i % 2 ? (litUf + litOff + cr.gauss() * 0.09 + 2) % 1 : cr(), rowF(cr.range(v0, 0.99), 25)); addSurf(crust, cr.range(20, 32), 0, cr, tu); if ((i & 255) === 255) await ctx.yield(); }
      await ctx.yield();
      for (let i = 0, n = N(12500 * share); i < n; i++) { sample(f.fn, i % 2 ? (litUf + litOff + cr.gauss() * 0.09 + 2) % 1 : cr(), rowF(lerp(v0, 0.99, Math.pow(cr(), 0.7)), 11.5)); addSurf(crust, cr.range(9, 15), 0, cr, tu); if ((i & 255) === 255) await ctx.yield(); }
      for (let i = 0, n = N(4200 * share * (turned ? 0.45 : 1)); i < n; i++) {         // spray off the lit rim, like spray off a wave
        sample(f.fn, (litUf + litOff + rng.gauss() * (turned ? 0.05 : 0.08) + 2) % 1, rng.range(turned ? 0.7 : 0.5, 0.99));
        const h = rng(), sz = Math.min(h < 0.5 ? rng.range(9, 15) : h < 0.85 ? rng.range(18, 30) : rng.range(36, 56), turned ? 26 : 56) * dabScale;
        tmp.set(-0.5 + nn.x * 0.3 + rng.range(-0.15, 0.15), 0.75 + rng.range(-0.15, 0.2), 0.25 + nn.z * 0.3 + rng.range(-0.15, 0.15)).normalize().multiplyScalar(rng.range(400, 900));
        spray.add(pa.x + nn.x * 4, pa.y + nn.y * 4, pa.z + nn.z * 4, sz, rng(), sprayPig(), rng.range(0, 3), tmp.x, tmp.y, tmp.z, rng.range(0.025, 0.06));
        if ((i & 255) === 255) await ctx.yield();
      }
      await ctx.yield();
    }
    // (the skirt of the hero's root likewise: its old draws on the main stream, its darker repainting from `cr`)
    for (let i = 0, n = N(1500); i < n; i++) { sample(heroRoot.fn, rng(), rng.range(0.45, 0.99)); addSurf(sink, i % 3 ? rng.range(20, 32) : rng.range(44, 70)); if ((i & 255) === 255) await ctx.yield(); }
    for (let i = 0, n = N(1500); i < n; i++) { sample(heroRoot.fn, cr(), cr.range(0.45, 0.99)); addSurf(crust, i % 3 ? cr.range(20, 32) : cr.range(44, 70), 0, cr, tu); if ((i & 255) === 255) await ctx.yield(); }
    await ctx.yield();
    // the lesser pillars are painted as the flanking ones are: three generations in rows that ring the pillar, every
    // dab taking the pigment the modelling gives its surface; a gate pillar also carries a fine generation over the
    // band of heights at which the route passes it
    for (const f of lesser) {
      const span = f.o.H - Y0, v0 = (DECK_Y - Y0) / span, rowF = (v, m) => (Math.floor(v * span / m) + 0.5) * m / span;
      const kA = clamp(f.o.H * f.o.R / 200000, 0.3, 1.2);       // by the size of the pillar
      for (let i = 0, n = N(260 * kA); i < n; i++) { sample(f.fn, ls(), rowF(ls.range(v0, 0.99), 56)); addSurf(crust, ls.range(44, 70), 0, ls, tu); }
      await ctx.yield();
      for (let i = 0, n = N(1100 * kA); i < n; i++) { sample(f.fn, ls(), rowF(ls.range(v0, 0.99), 25)); addSurf(crust, ls.range(20, 32), 0, ls, tu); if ((i & 255) === 255) await ctx.yield(); }
      await ctx.yield();
      for (let i = 0, n = N(3200 * kA); i < n; i++) { sample(f.fn, ls(), rowF(lerp(v0, 0.99, Math.pow(ls(), 0.8)), 11.5)); addSurf(crust, ls.range(9, 15), 0, ls, tu); if ((i & 255) === 255) await ctx.yield(); }
      await ctx.yield();
      if (f.gate) for (let i = 0, n = N(3000); i < n; i++) { sample(f.fn, ls(), rowF((r0.y + 70 + ls.range(-190, 230) - Y0) / span, 2.7)); addSurf(crust, ls.range(2.2, 3.4), 0, ls, tu); if ((i & 255) === 255) await ctx.yield(); }
      await ctx.yield();
    }

    // ---------- the deck: the level top of the dark cloud, at one world height under the whole route ----------
    // The far wall's shader paints it where it lies (a plane at DECK_Y, out to the level line all round); a mask
    // of the same plane hides what stands below it; and real dabs are laid on it at their real distances, so that
    // they shrink toward the level line. Swells, gaps, feet and painted shadows are the same rule in both. All of
    // it is dealt from a stream of its own.
    const dk = ctx.core.makeRng(ctx.core.hashSeed('deck:' + ctx.seed));
    const deckPh = new THREE.Vector4(dk.range(0, TAU), dk.range(0, TAU), dk.range(0, TAU), dk.range(0, TAU));
    const swell = (x, z) => { const qx = x * 0.001, qz = z * 0.001;
      return 0.5 * Math.sin(qx * 1.1 + 1.3 * Math.sin(qz * 0.7 + deckPh.x)) * Math.sin(qz * 1.3 + deckPh.y)
        + 0.3 * Math.sin(qx * 2.3 + qz * 1.7 + deckPh.z) + 0.2 * Math.sin(qz * 4.1 - qx * 2.9 + deckPh.w); };
    const ripple = (x, z) => Math.sin(x * 0.0097 + z * 0.0061 + deckPh.y * 3) * Math.sin(z * 0.0083 - x * 0.0039 + deckPh.z * 2);
    const gapF = (x, z) => { const qx = x * 0.001, qz = z * 0.001;
      return Math.sin(qx * 0.83 + deckPh.w * 2 + 0.9 * Math.sin(qz * 0.61 + deckPh.x * 3)) * Math.sin(qz * 0.97 + deckPh.z * 5 + 0.8 * Math.sin(qx * 0.53)); };
    // where each pillar meets the deck: (x, z, radius of its foot, length of the shadow it lays away from the key)
    const shadowLen = (H) => Math.min((H - DECK_Y) * Math.hypot(L.x, L.z) / L.y, 2600);
    const feet = [new THREE.Vector4(0, 0, 430, shadowLen(an.tipTop.y + 500))];
    for (const f of [...flanks, ...lesser]) feet.push(new THREE.Vector4(f.o.x, f.o.z, f.o.R * 1.25, shadowLen(f.o.H)));
    const deckAt = { t: 0, gap: 0, foot: 0, warm: 0, rose: 0, virid: 0 };
    const roll = (x, z, s0) => { const al = (x * Lh.x + z * Lh.z) * 0.001, ac = (x * Lh.z - z * Lh.x) * 0.001;
      const ph = al * 2.6 + 0.75 * Math.sin(ac * 1.1 + deckPh.x) + 0.4 * Math.sin(ac * 2.9 + al * 1.3 + deckPh.z) + 0.9 * Math.sin(al * 0.8 + ac * 0.5 + deckPh.y) + 0.6 * s0;
      const bead = smoothstep(0.1, 0.8, 0.5 + 0.5 * Math.sin(ac * 2.3 + 0.5 * ph + 1.1 * Math.sin(al * 0.9 + deckPh.w) + deckPh.x * 2));
      return (1 - Math.abs(Math.sin(ph))) * bead; };
    const deckBanks = [];                                        // the banks of the air, for the ground under them: filled once the banks are dealt
    const deckTone = (x, z) => {                                 // the shader's deckTone, at a place
      const e = 40, s0 = swell(x, z), rp = ripple(x, z);
      const gx = (swell(x + e, z) - s0 + 0.04 * (ripple(x + e, z) - rp)) / e, gz = (swell(x, z + e) - s0 + 0.04 * (ripple(x, z + e) - rp)) / e;
      const alK = x * Lh.x + z * Lh.z, acK = x * Lh.z - z * Lh.x;
      const ro = roll(x, z, s0), lr = (ro - roll(x + Lh.x * e, z + Lh.z * e, swell(x + Lh.x * e, z + Lh.z * e))) * 10;
      const amp = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(acK * 0.0009 + alK * 0.0005 + deckPh.w));
      let t = 0.45 + 0.07 * s0 - 100 * (gx * Lh.x + gz * Lh.z) + amp * (0.26 * smoothstep(0, 0.45, lr) - 0.2 * smoothstep(0, 0.45, -lr) + 0.1 * (ro - 0.4)), sh = 0, keep = 1, foot = 0, warm = 0;
      t += 0.18 * smoothstep(-2500, 3000, alK) * (1 - 0.6 * smoothstep(2500, 6000, Math.abs(acK)));
      for (const ft of feet) {
        const rx = x - ft.x, rz = z - ft.y, al = -(rx * Lh.x + rz * Lh.z), ac = Math.abs(rx * Lh.z - rz * Lh.x), rr = Math.hypot(rx, rz);
        sh = Math.max(sh, smoothstep(-ft.z, ft.z * 0.6, al) * (1 - smoothstep(ft.w * 0.55, ft.w, al)) * (1 - smoothstep(ft.z * 0.7, ft.z * 1.2 + al * 0.06, ac)));
        keep *= smoothstep(ft.z * 2, ft.z * 5, rr);
        warm = Math.max(warm, (1 - smoothstep(ft.z * 0.9, ft.z * 3.4, rr)) * smoothstep(-0.25, 0.55, -al / Math.max(rr, 1)));
        if (rr < ft.z) foot = 1;
      }
      let rose = 0, virid = 0;
      for (const b of deckBanks) {
        const rx = x - b.x, rz = z - b.y, w = b.w * (1 - smoothstep(b.z * 0.3, b.z * 1.1, Math.hypot(rx, rz))), sd = smoothstep(-0.4, 0.4, (rx * Lh.x + rz * Lh.z) / b.z);
        rose += w * sd; virid += w * (1 - sd);
      }
      const gf = gapF(x, z) * keep;
      t += 2.2 * (gapF(x + Lh.x * 60, z + Lh.z * 60) * keep - gf) * smoothstep(0.7, 0.9, gf) - 0.42 * sh;
      deckAt.t = clamp(t, 0, 1); deckAt.gap = smoothstep(0.9, 0.93, gf); deckAt.foot = foot;
      deckAt.warm = warm * (1 - sh); deckAt.rose = rose; deckAt.virid = virid;
      return deckAt;
    };
    // a dab of the deck: the tone of its place (fifty steps to a tier) and, where the place has a light of its own, the
    // pigment of that light (15 = none), packed into the pigment slot; the dab's shader picks the pigment by the deck's
    // rule and the law of distance (the same rule the far wall's shader paints the plane by). h, h2: two of the dab's draws.
    const landWarm = LAND_WARM[canvasId];
    const deckDab = (T, at, h, h2) => {
      const fr = (v) => v - Math.floor(v), h3 = fr(h * 57.31 + h2 * 7.7), h4 = fr(h * 23.17 + h2 * 41.3);
      let own = 15;
      if (T >= 1) {
        const gs = at.rose + at.virid;
        if (h4 < 0.5 * Math.min(gs, 1)) own = fr(h4 * 37.3) * gs < at.rose ? (T < 3.2 ? P.ROSE : P.PROSE) : (T < 3.2 ? P.VIRID : P.PVIRID);
        if (h3 < 0.7 * at.warm * landWarm) {
          const heat = at.warm + (h2 - 0.5) * 0.3;
          own = heat > 0.72 ? (h < 0.34 ? P.LEMON : h < 0.64 ? P.GOLD : P.ORANGE) : heat > 0.42 ? (h < 0.48 ? P.ORANGE : h < 0.8 ? P.ROSE : P.GOLD) : (h < 0.55 ? P.ROSE : h < 0.8 ? P.ORANGE : P.PROSE);
        }
      }
      return own + 16 * Math.round(clamp(T, 0, 5) * 50);
    };

    // ---------- loose banks of gas out to 5 km ----------
    const gasStill = new kit.Bank(), gasFlow = new kit.Bank();
    const banks = [];
    const nearPillar = (p, pad) => {
      if (p.y < 2400 && Math.hypot(p.x + 180, p.z) < 420 + pad) return true;
      for (const f of flanks) { f.axis(clamp(p.y, 0, f.o.H), ax); if (p.y < f.o.H + 250 && Math.hypot(p.x - ax.x, p.z - ax.z) < f.o.R * 1.5 + pad) return true; }
      for (const f of lesser) { f.axis(clamp(p.y, 0, f.o.H), ax); if (p.y < f.o.H + 250 && Math.hypot(p.x - ax.x, p.z - ax.z) < f.o.R * 1.5 + pad) return true; }
      return false;
    };
    // the deck's tiers of pigment, deep to light (its dabs, the feet and the gas that lies on it are all painted in them)
    const deckPig = (T, h) => (T < 1 ? P.DVIOLET : T < 3.3 ? (h < 0.62 ? P.VIOLET : P.ULTRA) : T < 4.2 ? (h < 0.6 ? P.PULTRA : P.ROSE) : h < 0.7 ? P.PULTRA : P.PROSE);
    // the banks keep clear of the route, so their loop takes as many draws as the route decides: a stream of their own
    const bk = ctx.core.makeRng(ctx.core.hashSeed('gas-banks:' + ctx.seed));
    // nothing loose may hang in front of a pillar all the way down the approach: the lines of sight to the hero's
    // tip, to the globule and to every flanking pillar are kept clear from the route itself, at even steps of 100 m
    // of route from the start to the gate. What lies behind the hero along the canvas's axis is painted paler (the
    // glowing gas), so each pillar is a dark mass against it.
    const heroHead = an.tipTop.clone().lerp(G, 0.3);
    const heroLookDir = heroHead.clone().sub(entry).normalize();
    const sights = [an.tipTop.clone(), G.clone()];
    for (const f of flanks) { const t = V3(0, 0, 0); f.axis(f.o.H * 0.75, t); sights.push(t); }
    const sightEyes = [];
    for (let sd = 0; sd <= uGate * path.length; sd += 100) sightEyes.push(path.posAtDist(sd, V3(0, 0, 0)));
    const sightDist = (p, T, E) => {
      tmp.subVectors(T, E); const k = clamp(tmp2.subVectors(p, E).dot(tmp) / tmp.lengthSq(), 0, 1);
      return tmp2.addScaledVector(tmp, -k).length();
    };
    // a bank's place by the canvas, not by an eye: how far along the axis it lies from the layout's origin, and how
    // far off the level line through the hero's head that runs along the axis
    const axisOf = (p) => {
      const along = tmp.subVectors(p, eye0).dot(inDir), a = tmp.subVectors(p, heroHead).dot(inDir);
      return { along, across: tmp.addScaledVector(inDir, -a).length() };
    };
    // the rare unfinished bank stands on the free side of the approach: 2050 m along the canvas's axis from the
    // layout's origin and 1250 m across it
    const barePos = eye0.clone().addScaledVector(inDir, 2050).addScaledVector(rightOf, (composition === 'colossus' ? 1 : -1) * 1250); barePos.y = eye0.y - 140;
    const wantBanks = Math.round(18 * (0.8 + 0.2 * density));
    for (let tries = 0; banks.length < wantBanks && tries < 900; tries++) {
      if ((tries & 31) === 31) await ctx.yield();
      const low = banks.length < 9;                             // the first few lie low and hide the pillars' feet
      // (every die of a bank is cast before its place is tested)
      const r = low ? bk.range(500, 900) : bk.range(340, 920);
      const p = low ? V3(bk.range(-2600, 2400), bk.range(-500, 150), bk.range(-2800, 2600)) : V3(bk.range(-4300, 3900), bk.range(-300, 3700), bk.range(-4900, 3100));
      const sq = low ? bk.range(0.3, 0.5) : bk.range(0.45, 1), flow = V3(-L.x + bk.range(-0.5, 0.5), bk.range(-0.1, 0.5), -L.z + bk.range(-0.5, 0.5)).normalize(), el = bk.range(1, 1.9);
      if (path.distanceTo(p.x, p.y, p.z) < 900 + r) continue;
      if (p.distanceTo(G) < 760 + r * 0.6 || (!low && nearPillar(p, r * 0.45))) continue;
      let blocked = false;
      for (const E of sightEyes) {
        for (const T of sights) if (sightDist(p, T, E) < 180 + r * (low ? 0.45 : 0.85)) blocked = true;
        if (rare && sightDist(p, barePos, E) < 560 + r * 0.8) blocked = true;
        if (blocked) break;
      }
      if (blocked || (rare && p.distanceTo(barePos) < 800 + r)) continue;
      const at = axisOf(p), hdB = at.along > 0 ? at.along / Math.hypot(at.along, at.across) : 0;
      banks.push({ p, r, low, glow: 0.42 * hdB * hdB * hdB * hdB - 0.16, sq, flow, el });
    }
    const r2sum = banks.reduce((s, b) => s + b.r * b.r, 0) || 1;
    // the ground under a bank of the air takes its tint: over a radius of the bank's own, and less the higher it hangs
    // (full within 400 m of the deck, a quarter of that from 3200 m up); the low banks are heaps of the deck itself
    for (const b of banks) if (!b.low && deckBanks.length < 12) deckBanks.push(new THREE.Vector4(b.p.x, b.p.z, b.r, 1 - 0.75 * smoothstep(400, 3200, b.p.y - DECK_Y)));
    const farTint = (pig, far) => { if (bk() >= far) return pig;      // (always one draw, so the sequence does not depend on the answer)
      return pig === P.ROSE ? P.PROSE : pig === P.VIRID ? P.PVIRID : pig === P.GOLD || pig === P.LEMON || pig === P.PROSE || pig === P.PVIRID ? pig : P.PULTRA; };
    // a bank is a soft form and is modelled as the forms are: the pale tints on its side toward the key, rose and
    // viridian across the turn, the deep pigments on the side away (hue varies inside a tier, value stays close)
    const gasPig = (l) => { const h = bk();
      if (l > 0.62) return h < 0.3 ? P.PROSE : h < 0.55 ? P.PULTRA : h < 0.75 ? P.PVIRID : h < 0.9 ? P.ROSE : P.GOLD;
      if (l > 0.4) return h < 0.34 ? P.ROSE : h < 0.6 ? P.VIRID : h < 0.85 ? P.PULTRA : P.VIOLET;
      return h < 0.4 ? P.ULTRA : h < 0.65 ? P.VIOLET : h < 0.85 ? P.DVIOLET : P.VIRID; };
    let bi = 0;
    for (const b of banks) {
      const n = N(26000 * b.r * b.r / r2sum);
      const farB = 0.6 * smoothstep(2500, 4400, b.p.distanceTo(eye0));   // three depth planes, by the bank's distance from the origin of the canvas's layout, told apart by hue and value
      for (let i = 0; i < n; i++) {
        tmp.set(bk.gauss(), bk.gauss() * b.sq, bk.gauss()).multiplyScalar(b.r * 0.5);
        const al = bk.gauss() * b.r * 0.5 * (b.el - 1);
        tmp.addScaledVector(b.flow, al);
        const l = 0.62 + 0.55 * tmp.dot(L) / b.r + (bk() - 0.5) * 0.2 + canvas.glow + b.glow;
        const x = b.p.x + tmp.x, y = b.p.y + tmp.y, z = b.p.z + tmp.z;
        const sz = (bk() < 0.55 ? bk.range(40, 72) : bk.range(15, 27)) * dabScale, rot = Math.atan2(b.flow.y, b.flow.x) + bk.range(-0.4, 0.4);
        // gas that lies on the deck is part of the deck: a low bank, and the foot of any bank within 400 m of the
        // deck, takes the deck's tiers by its own turn to the key (soft heaps of the dark cloud's own colour); only
        // the banks of the air take the pale tints
        const lies = bk() > smoothstep(DECK_Y + 130, DECK_Y + 400, y) || b.low;
        const pig = lies ? deckPig(0.8 + (l - 0.3) * 3.2, bk()) : farTint(gasPig(l), farB);
        if (i % 2) gasStill.add(x, y, z, sz, bk(), pig, rot, b.flow.x, b.flow.y, b.flow.z, 0);
        else { const len = bk.range(160, 460); gasFlow.add(x, y, z, sz, bk(), pig, rot, b.flow.x * len, b.flow.y * len, b.flow.z * len, bk.range(0.012, 0.03)); }
        if (bk() < 0.22) gasStill.add(x + sz * 0.6, y + bk.range(-0.3, 0.3) * sz, z, sz * 0.55, bk(), lies ? deckPig(1.4 + (l - 0.3) * 3.2, bk()) : kit.COMPLEMENT[pig], rot, b.flow.x, b.flow.y, b.flow.z, 0);
        if ((i & 511) === 511) await ctx.yield();
      }
      await ctx.yield(); bi++;
    }
    await ctx.yield();

    // ---------- the box of dabs that wraps round the lens: we are always inside the painting ----------
    const wrap = new kit.Bank();
    const wrapPig = () => { const h = rng(); return h < 0.22 ? P.ROSE : h < 0.40 ? P.VIRID : h < 0.54 ? P.ULTRA : h < 0.62 ? P.VIOLET : h < 0.75 ? P.PULTRA : h < 0.84 ? P.DVIOLET : h < 0.91 ? P.ORANGE : h < 0.95 ? P.PROSE : h < 0.98 ? P.LEMON : P.PVIRID; };
    for (const [count, box, s0, s1] of [[6000, 110, 0.45, 0.75], [7000, 470, 2, 3.2], [2500, 2300, 9.5, 15]]) {
      const sp = box * 0.022;
      for (let i = 0, n = N(count); i < n; i++) {
        wrap.add(rng(), rng(), rng(), rng.range(s0, s1) * dabScale, rng(), wrapPig(), rng.range(0, TAU), box,
          (-L.x + rng.range(-0.3, 0.3)) * sp / box, (0.25 + rng.range(-0.3, 0.3)) * sp / box, (-L.z + rng.range(-0.3, 0.3)) * sp / box);
      }
      await ctx.yield();
    }
    await ctx.yield();

    // ---------- tadpoles drifting close beside the route ----------
    const tad = new kit.Bank();
    const tail = U.uTail.value;
    let tadNear = 0;
    // (whether a place is free depends on the route, so these take a stream of their own)
    const nt = ctx.core.makeRng(ctx.core.hashSeed('route-tadpoles:' + ctx.seed));
    // Every die of a tadpole (its place, its length, its phase, its dabs) is cast before its place is tested: it is
    // painted into `held`, and laid only if the place is free over its whole drift.
    const heldRows = [], held = { add: (...a) => { heldRows.push(a); } };
    const layHeld = (ok) => { if (ok) { for (const a of heldRows) tad.add(...a); tadNear++; } heldRows.length = 0; return ok; };
    // Seven seats beside the route, an even series by metres of route from the foot of the rim to the dive: the
    // spacing is that length over seven and falls where it falls, the whole series is set off by one draw within one
    // spacing, and each seat strays by a draw of its own, up to a fifth of the spacing either way.
    const sRim = uRim * path.length, sTop = uTop * path.length, sDive = uDive * path.length;
    const seatGap = (sDive - sRim) / 7, seatOff = nt.range(0, seatGap);
    for (let k = 0; k < 7; k++) {
      const sd = sRim + seatOff + k * seatGap + nt.range(-0.2, 0.2) * seatGap;
      const side = nt.range(15, 21) * nt.sign(), len = nt.range(13, 22), ph = nt();   // (its phase is free: anywhere in its drift)
      path.posAtDist(sd, pa); path.tangentAtDist(sd, tu);
      nn.crossVectors(tu, tail); const flat = nn.lengthSq() < 0.01;
      if (!flat) pa.addScaledVector(nn.normalize(), side);
      held.add(pa.x, pa.y, pa.z, len * 0.36, nt(), P.VIOLET, 0.3, 0, 0, 0, ph);
      held.add(pa.x, pa.y, pa.z, len * 0.24, nt(), P.DVIOLET, 1.2, len * 0.13, len * 0.05, -len * 0.04, ph);
      held.add(pa.x, pa.y, pa.z, len * 0.2, nt(), P.ULTRA, 2.0, len * 0.05, -len * 0.09, len * 0.06, ph);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; held.add(pa.x, pa.y, pa.z, len * nt.range(0.1, 0.15), nt(), i % 3 ? P.ORANGE : P.LEMON, a, -len * 0.17, Math.cos(a) * len * 0.11, Math.sin(a) * len * 0.11, ph); }
      for (let i = 0; i < 18; i++) {
        const s = lerp(0.22, 1.7, i / 17) * len, w = len * 0.04 * (1 + i * 0.12);
        held.add(pa.x, pa.y, pa.z, len * lerp(0.2, 0.06, i / 17), nt(), i % 5 === 4 ? P.VIRID : i % 7 === 3 ? P.PROSE : P.ROSE, nt.range(0, 3), s, nt.gauss() * w, nt.gauss() * w, ph);
      }
      let ok = !flat && an.hullDist(pa) > 30;
      for (let s = -75; s <= 115 && ok; s += 10) if (path.distanceTo(pa.x + tail.x * s, pa.y + tail.y * s, pa.z + tail.z * s) < 9) ok = false;
      layHeld(ok);
    }
    await ctx.yield();
    // a large tadpole: a compact dark head, a broad crescent of orange and lemon on the side facing the cluster,
    // a long rose tail. The figures of the climb and of the pull-back.
    const bigTad = (c, len, ph, r, bank = tad) => {
      bank.add(c.x, c.y, c.z, len * 0.34, r(), P.VIOLET, 0.3, 0, 0, 0, ph);
      for (let i = 0; i < 9; i++) bank.add(c.x, c.y, c.z, len * r.range(0.2, 0.27), r(), i % 3 === 0 ? P.ULTRA : i % 3 === 1 ? P.DVIOLET : P.VIOLET, r.range(0, 3), len * r.range(-0.06, 0.2), r.gauss() * len * 0.09, r.gauss() * len * 0.09, ph);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, rr = i % 2 ? 0.16 : 0.08; bank.add(c.x, c.y, c.z, len * r.range(0.17, 0.22), r(), i % 3 ? P.ORANGE : P.LEMON, a, -len * (0.25 - rr * 0.4), Math.cos(a) * len * rr, Math.sin(a) * len * rr, ph); }
      for (let i = 0; i < 24; i++) {
        const sl = lerp(0.3, 2.1, i / 23) * len, w = len * 0.035 * (1 + i * 0.12);
        bank.add(c.x, c.y, c.z, len * lerp(0.2, 0.06, i / 23), r(), i % 5 === 4 ? P.VIRID : i % 7 === 3 ? P.PROSE : P.ROSE, r.range(0, 3), sl, r.gauss() * w, r.gauss() * w, ph);
      }
    };
    const tadClear = (c, hull, off, far = 145) => {
      if (an.hullDist(c) < hull) return false;
      for (let sd = -80; sd <= far; sd += 10) if (path.distanceTo(c.x + tail.x * sd, c.y + tail.y * sd, c.z + tail.z * sd) < off) return false;
      return true;
    };
    const leftOf = V3(0, 0, 0);
    // the tadpoles we pass within arm's length: built of dabs small enough to hold together at twenty metres (a large
    // dab parts round the lens long before that). A compact dark head, an orange and lemon crescent on the side facing
    // the cluster, a short rose tail.
    // (two generations at one seat, as everywhere on this canvas: a coarse one that reads from 60 m to 300 m and a
    // fine one that takes over inside 90 m. The crescent is a cap of warm dabs on the half of the head that faces
    // the cluster, so from any side it shows as a bright edge.)
    const tr = rng.fork('near-tadpoles');                       // a fork: these do not disturb what was laid before them
    const tadGen = (c, len, ph, d, nH, nC, nT, cK = 1, r = tr, bank = tad) => {
      const Rh = len * 0.16;
      for (let i = 0; i < nH; i++) bank.add(c.x, c.y, c.z, d * r.range(0.9, 1.15), r(), i % 3 === 0 ? P.VIOLET : i % 3 === 1 ? P.DVIOLET : P.ULTRA, r.range(0, 3), r.gauss() * Rh * 0.4, r.gauss() * Rh * 0.4, r.gauss() * Rh * 0.4, ph);
      for (let i = 0; i < nC; i++) {
        const phi = i ? r.range(0.5, 1.25) : 0, psi = (i / Math.max(1, nC - 1)) * TAU + r.range(-0.2, 0.2), k = Rh * 1.12;
        bank.add(c.x, c.y, c.z, d * cK * r.range(0.82, 1), r(), i % 3 === 0 ? P.LEMON : P.ORANGE, psi, -k * Math.cos(phi), k * Math.sin(phi) * Math.cos(psi), k * Math.sin(phi) * Math.sin(psi), ph);
      }
      for (let i = 0; i < nT; i++) {
        const t = i / (nT - 1), sl = lerp(0.24, 2.1, t) * len, w = len * 0.022 * (1 + 3 * t);
        bank.add(c.x, c.y, c.z, d * lerp(0.95, 0.42, t), r(), i % 4 === 3 ? P.PROSE : P.ROSE, r.range(0, 3), sl, r.gauss() * w, r.gauss() * w, ph);
      }
    };
    const fineTad = (c, len, ph) => { tadGen(c, len, ph, len * 0.25, 3, 7, 8, 1, tr, held); tadGen(c, len, ph, len * 0.09, 22, 16, 12, 1, tr, held); };
    // nine of them up the rim: even steps of route from the foot of the rim to its top, the series set off by one
    // draw within one step
    const fineStep = (sTop - sRim) / 9, fineOff = tr.range(0, fineStep);
    for (let k = 0; k < 9; k++) {
      const sd = sRim + fineOff + k * fineStep;
      path.posAtDist(sd, pb); path.tangentAtDist(sd, tu); leftOf.set(tu.z, 0, -tu.x).normalize();
      // six candidates at each place, every one cast whole before any is tested; the first that hangs clear is laid
      for (let c = 0, laid = false; c < 6; c++) {
        // ahead of that place on the route and a little to the left and above: the rim turns away to the right, so
        // these hang in the open air beside the climb, with the pale wall behind them
        const fwd = tr.range(60, 115), side = tr.range(9, 26), up = tr.range(4, 22), len = tr.range(15, 20), ph = tr();
        pa.copy(pb).addScaledVector(tu, fwd).addScaledVector(leftOf, side); pa.y += up;
        fineTad(pa, len, ph);
        laid = layHeld(!laid && tadClear(pa, 26, 8)) || laid;
      }
    }
    for (let k = 0; k < 10; k++) {                              // and a midground shoal out on the left of the climb, each drawn anywhere between the foot of the rim and its top
      const sd = lerp(sRim, sTop, tr());
      path.posAtDist(sd, pb); path.tangentAtDist(sd, tu); leftOf.set(tu.z, 0, -tu.x).normalize();
      const side = tr.range(70, 190), fwd = tr.range(40, 240), up = tr.range(-40, 60), len = tr.range(19, 25), ph = tr();
      pa.copy(pb).addScaledVector(leftOf, side).addScaledVector(tu, fwd); pa.y += up;
      fineTad(pa, len, ph);
      layHeld(tadClear(pa, 40, 30));
    }
    await ctx.yield();
    // large tadpoles hanging to the left all along the climb, in front of the deep wall: the figures of that stretch.
    // Their places are an even series along the course, one every 75 m from the foot of the rim to its top, the whole
    // series set off by one seeded draw. At each place up to two tadpoles are hung, 70 to 140 m out to the left and
    // 40 to 200 m further along, clear of the course over their whole drift and 80 m from one another, each with a
    // phase of its own; they are painted in two generations of dab small enough to hold together this close.
    // All of it is dealt from a fork of the near tadpoles' stream, taken after that stream's last draw.
    const lr = tr.fork('left-of-the-climb'), leftSeats = [], seatStep = 75;
    for (let sd = uRim * path.length + lr.range(0, seatStep); sd < uTop * path.length; sd += seatStep) {
      path.posAtDist(sd, pb); path.tangentAtDist(sd, tu); leftOf.set(tu.z, 0, -tu.x).normalize();
      for (let k = 0, got = 0; k < 12 && got < 2; k++) {
        const side = lr.range(70, 140), fwd = lr.range(40, 200), up = lr.range(-30, 50);
        const len = lr.range(48, 70), ph = lr();
        pa.copy(pb).addScaledVector(leftOf, side).addScaledVector(tu, fwd); pa.y += up;
        if (tadClear(pa, 46, 26, 210) && !leftSeats.some((q) => q[0].distanceTo(pa) < 80)) { leftSeats.push([pa.clone(), len, ph]); got++; }
      }
    }
    for (const [c, len, ph] of leftSeats) { tadNear++; tadGen(c, len, ph, len * 0.13, 10, 12, 12, 1.5, lr); tadGen(c, len, ph, len * 0.06, 36, 30, 18, 1.5, lr); }
    await ctx.yield();
    // shoals of the helix. Some hang between the camera and the egg, off the line of sight to its mouth, so that
    // orange-crescent figures cross its dark shell; some hang out ahead, toward the cluster, where the path is going.
    // (which seats are free depends on the route: a stream of their own)
    const hs = ctx.core.makeRng(ctx.core.hashSeed('helix-shoals:' + ctx.seed));
    // (the fourth is drawn anywhere between the top of the rim and the first knot of the helix)
    const uKnot = uOfPoint(loop[0]);
    for (const [uu, toward] of [[lerp(uTop, uFar, 0.3), 1], [lerp(uTop, uFar, 0.6), 1], [lerp(uTop, uFar, 0.92), 1], [lerp(uTop, uKnot, hs()), 0], [lerp(uTop, uFar, 0.5), 0]]) {
      path.pointAt(uu, pb);
      if (toward) tu.subVectors(G, pb).normalize(); else path.tangentAt(uu, tu);
      leftOf.set(tu.z, 0, -tu.x).normalize(); pc.crossVectors(leftOf, tu).normalize();
      for (let k = 0, cnt = hs.int(3, 4); k < cnt; k++) {
        const ang = hs.range(0, TAU), off = hs.range(toward ? 70 : 95, toward ? 150 : 180), fwd = toward ? hs.range(170, 290) : hs.range(180, 360);
        const len = hs.range(28, 40), ph = hs();
        pa.copy(pb).addScaledVector(tu, fwd).addScaledVector(leftOf, Math.cos(ang) * off).addScaledVector(pc, Math.sin(ang) * off * 0.75);
        bigTad(pa, len, ph, hs, held);
        layHeld(tadClear(pa, 40, 16));
      }
      await ctx.yield();
    }
    // the crust the climb passes: within arm's length of the path it is separate burning dabs, orange and lemon about
    // three to one over the ultramarine pricked between them, a continuous bright edge on our right
    for (let i = 0, n = N(5200); i < n; i++) {
      const t = rng(), a = litA - 0.95 + 1.3 * (1 - Math.pow(1 - t, 1.8)), v = lerp(0.685, 0.93, t) + rng.gauss() * 0.022;
      // (laid in rows 2.5 m deep that ring the pillar, 640 of them in its height, each dab a stroke along its ring)
      sample(an.pillarPoint, ((a / TAU + rng.gauss() * 0.03) % 1 + 1) % 1, (Math.floor(clamp(v, 0.6, 0.985) * 640) + 0.5) / 640);
      const h = rng(), pig = h < 0.4 ? P.ORANGE : h < 0.62 ? P.LEMON : h < 0.75 ? P.GOLD : P.ULTRA, sz = (rng() < 0.7 ? rng.range(1.5, 2.6) : rng.range(3, 4.6)) * dabScale;
      crust.add(pa.x + nn.x * (0.4 + sz * 0.2), pa.y + nn.y * (0.4 + sz * 0.2), pa.z + nn.z * (0.4 + sz * 0.2), sz, rng(), pig, rotAt(pa), tu.x, tu.y, tu.z, 0);
      if ((i & 255) === 255) await ctx.yield();
    }
    await ctx.yield();
    // ---------- what stands on the deck: knots of the dark cloud and their streamers ----------
    // A rule of the place, the same whichever way the flight looks: over the whole disc of the deck within 6 km of the
    // hero pillar's foot, knots of the dark cloud are dealt 0.8 to the square kilometre (90 of them; one that falls
    // in a gap, on a pillar's foot or against another knot is not laid). A knot is a low heap,
    // 150 to 380 m in radius and 0.5 to 0.9 of that high, leaning toward the key as the pillars do and modelled as
    // they are (rows of dabs: a dark body, a burning crest toward the cluster, shade away from it); it lays a painted
    // shadow on the deck, and the cluster's light blows a streamer of gas off its crest, away from the key and
    // rising, rose by the crest and paling as it thins. Knot, shadow and streamer are dabs of the deck: they take
    // the deck's tiers and its law of distance, and each is laid by its own random turn as the deck's dabs are (the
    // heap's are dealt in rows that ring it). Their places are dealt from a stream of their own and their dabs
    // from another; every die of a knot is cast before its place is tested.
    // Three more rules of the place. A knot stands only on the carpet of the deck's dabs: one whose heap, shadow or
    // streamer would reach beyond the carpet's 6.5 km about its middle is not laid (so the 90 dealt come to about
    // 40 laid). On a visit with the rare unfinished bank, a knot whose heap or streamer would
    // come nearer to that bank, or to the kept lines of sight to it, than the banks themselves may (the banks' own
    // margins, taken from the heap's radius or the streamer's half width there) is not laid. And a knot's dabs are
    // flagged apart from the carpet's (-0.3 for -0.25): the dab shader would bring them to nothing between 8.4 and
    // 8.9 km from the eye, by the metres from the eye to the dab alone; on the carpet no knot lies that far from any
    // eye of the route (the first eye is 1.7 km from the carpet's middle), so this only guards the lens's far distance.
    const LAND_R = 6000, knots = [];
    const carpetMid = ap(1700, 0, 0), CARPET_R = 6500, keySlope = Math.hypot(L.x, L.z) / L.y;   // (the carpet's middle and reach, and the key's slope, as the carpet's and the shadows' own lines below have them)
    const offCarpet = (x, z, R, H, tailK, rise) => {
      const len = R * tailK, dh = Math.sqrt(1 - rise * rise), sh = R * 0.5 + R * 0.6 + H * keySlope, from = (px, pz) => Math.hypot(px - carpetMid.x, pz - carpetMid.z);
      // (the heap by its radius; the far end of its shadow by the shadow's half width; the streamer's tip by its half width there)
      return from(x, z) + R > CARPET_R || from(x - Lh.x * sh, z - Lh.z * sh) + 0.8 * R > CARPET_R
        || from(x + Lh.x * H * 0.35 - Lh.x * dh * len, z + Lh.z * H * 0.35 - Lh.z * dh * len) + 0.22 * R + 0.12 * len > CARPET_R;
    };
    const nearBare = (x, z, R, H, tailK, rise) => {
      const len = R * tailK, dh = Math.sqrt(1 - rise * rise), cx = x + Lh.x * H * 0.35, cz = z + Lh.z * H * 0.35, q = V3(0, 0, 0);
      for (let j = -1; j <= 6; j++) {
        // (j = -1 the heap, by its radius; then seven places along the streamer from the crest to its tip, by its half width)
        const sd = len * Math.max(j, 0) / 6, wd = j < 0 ? R : 0.22 * R + 0.12 * sd;
        if (j < 0) q.set(x, DECK_Y + H * 0.5, z); else q.set(cx - Lh.x * dh * sd, DECK_Y + H * 0.8 + rise * sd, cz - Lh.z * dh * sd);
        if (q.distanceTo(barePos) < 800 + wd) return true;
        for (const E of sightEyes) if (sightDist(q, barePos, E) < 560 + wd) return true;
      }
      return false;
    };
    if (LAND_THINGS) {
      const kn = ctx.core.makeRng(ctx.core.hashSeed('deck-knots:' + ctx.seed));
      for (let i = 0, n = Math.round(0.8 * Math.PI * LAND_R * LAND_R / 1e6); i < n; i++) {
        const a = kn.range(0, TAU), r = LAND_R * Math.sqrt(kn()), R = kn.range(150, 380), H = R * kn.range(0.5, 0.9), o1 = kn.range(-40, 40), o2 = kn.range(-40, 40), tailK = kn.range(2.2, 3.6), rise = kn.range(0.4, 0.62);
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (deckTone(x, z).gap > 0.5 || feet.some((ft) => Math.hypot(x - ft.x, z - ft.y) < ft.z * 1.6 + R) || knots.some((k) => Math.hypot(x - k.x, z - k.z) < k.R + R + 120)) continue;
        if (offCarpet(x, z, R, H, tailK, rise) || (rare && nearBare(x, z, R, H, tailK, rise))) continue;
        const fn = (u, v, out) => {
          const an = u * TAU, ang = v * Math.PI / 2, c = Math.cos(ang), sn = Math.sin(ang), dx = Math.cos(an), dz = Math.sin(an);
          const rr = R * Math.pow(c, 0.7) * (1 + 0.28 * noise.fbm3(dx * 1.3 + o1, sn * 2 + o2, dz * 1.3, 3));
          return out.set(x + Lh.x * H * 0.35 * sn * sn + dx * rr, DECK_Y - 40 + (H + 40) * sn, z + Lh.z * H * 0.35 * sn * sn + dz * rr * 0.85);
        };
        knots.push({ x, z, R, H, tailK, rise, fn });
      }
      await ctx.yield();
    }
    const addDabs = (bank, mode, push) => { if (!bank.count) return null; const m = kit.dabMesh(bank, mode, push); scene.add(m); return m; };
    addDabs(crust, 0, 0.6); await ctx.yield(); addDabs(spray, 1, 0); await ctx.yield(); addDabs(gasStill, 0, 0); await ctx.yield(); addDabs(gasFlow, 1, 0);
    await ctx.yield();
    addDabs(wrap, 6, 0); await ctx.yield(); addDabs(tad, 5, 0);

    await ctx.yield();
    // ---------- the deck's own dabs ----------
    // laid flat on the cloud top out to 6.5 km from the middle of the canvas, thicker toward the middle; each carries
    // the tone of the deck where it lies and the light that falls there, and is painted by the deck's rule
    const deck = new kit.Bank(), deckMid = ap(1700, 0, 0);   // (on the axis of the approach, 1700 m before the foot of the rim)
    for (let i = 0, n = N(26000); i < n; i++) {
      const a = dk.range(0, TAU), r = 6500 * Math.pow(dk(), 0.7), x = deckMid.x + Math.cos(a) * r, z = deckMid.z + Math.sin(a) * r;
      const size = dk.range(46, 78) * dabScale, hsh = dk(), h = dk(), rot = dk.range(-0.4, 0.4), dith = dk();
      const at = deckTone(x, z);
      if ((i & 255) === 255) await ctx.yield();
      if (at.gap > 0.5 || at.foot) continue;
      // (toward the rim of their reach the dabs thin away, die by die, and the plane's own dots carry the ground on)
      if (((hsh * 7.77) % 1) < smoothstep(4000, 6500, r)) continue;
      deck.add(x, DECK_Y + 6 + 45 * (0.5 + 0.5 * swell(x, z)), z, size, hsh, deckDab(at.t * 5 + (dith - 0.5) * 0.6, at, h, dith), rot, -Lh.x, 0, -Lh.z, -0.25);
    }
    await ctx.yield();
    // the foot: the deck heaped in a ring where a pillar meets it, in the deck's own tiers, turned to the key on one
    // side and in the pillar's painted shadow on the other
    const footAt = { warm: 0, rose: 0, virid: 0 };
    for (const ft of feet) {
      for (let i = 0, n = N(420); i < n; i++) {
        const a = dk.range(0, TAU), k = dk() * dk(), r = ft.z * (0.9 + 0.6 * k), size = dk.range(34, 56) * dabScale, hsh = dk(), h = dk(), dith = dk();
        const lit = 0.5 + 0.5 * (Math.cos(a) * Lh.x + Math.sin(a) * Lh.z);
        // (the heap's side toward the key burns with the rim that stands over it)
        footAt.warm = lit * lit;
        deck.add(ft.x + Math.cos(a) * r, DECK_Y + 10 + 170 * (1 - k) * (1 - k), ft.y + Math.sin(a) * r, size, hsh, deckDab(0.6 + 3.3 * lit * lit + (dith - 0.5) * 0.6, footAt, h, dith), dk.range(-0.4, 0.4), -Math.sin(a), 0, Math.cos(a), -0.25);
      }
      await ctx.yield();
    }
    // the knots: each a heap of dabs in rows that ring it, 45 m deep (a dab is laid by its own random turn and sways a
    // little along its ring); the painted shadow it lays on the deck away from the key, as long as its height throws at
    // the key's own angle; and the streamer off its crest. All three carry the knots' flag, -0.3.
    if (knots.length) {
      const kd = ctx.core.makeRng(ctx.core.hashSeed('deck-knot-dabs:' + ctx.seed)), slope = Math.hypot(L.x, L.z) / L.y, tier = (T) => 16 * Math.round(T * 50);
      for (const k of knots) {
        const rows = Math.max(3, Math.round((k.H + k.R) / 45)), rowV = (v) => (Math.floor(v * rows) + 0.5) / rows;
        for (let i = 0, n = N(k.R * k.R * 0.003); i < n; i++) {
          sample(k.fn, kd(), rowV(kd.range(0.06, 0.98)));
          // (the modelling is the pillars': how far the place faces the key, a tier deeper; the lights are the dab's own)
          const l = nn.dot(L) * 0.5 + 0.36 + (kd() - 0.5) * 0.16, size = kd.range(44, 76) * dabScale, pig = kit.pickPigment(l, kd());
          deck.add(pa.x + nn.x * size * 0.15, pa.y + nn.y * size * 0.15, pa.z + nn.z * size * 0.15, size, kd(), (l > 0.66 ? pig : 15) + tier(l > 0.66 ? 3.5 : l > 0.5 ? 2.4 : l > 0.2 ? 1.5 : 0.7), kd.range(-0.4, 0.4), tu.x, tu.y, tu.z, -0.3);
        }
        const sl = k.R * 0.6 + k.H * slope;
        for (let i = 0, n = N(k.R * sl * 0.0003); i < n; i++) {
          const al = kd() * sl, ac = kd.range(-0.8, 0.8) * k.R * (1 - 0.5 * al / sl), size = kd.range(40, 66) * dabScale, hsh = kd(), dith = kd();
          const x = k.x - Lh.x * (k.R * 0.5 + al) + Lh.z * ac, z = k.z - Lh.z * (k.R * 0.5 + al) - Lh.x * ac;
          deck.add(x, DECK_Y + 8 + 45 * (0.5 + 0.5 * swell(x, z)), z, size, hsh, 15 + tier(0.7 + 1.1 * dith), kd.range(-0.4, 0.4), -Lh.x, 0, -Lh.z, -0.3);
        }
        // (the streamer: from the crest, away from the key and rising; thick and rose by the crest, wider, finer and paler along it)
        const len = k.R * k.tailK, cx = k.x + Lh.x * k.H * 0.35, cz = k.z + Lh.z * k.H * 0.35, dh = Math.sqrt(1 - k.rise * k.rise);
        for (let i = 0, n = N(k.R * k.R * 0.002); i < n; i++) {
          const u = Math.pow(kd(), 1.5), sd = u * len, wd = 0.22 * k.R + 0.12 * sd, o1 = kd.gauss() * wd * 0.5, o2 = kd.gauss() * wd * 0.35, h = kd();
          const own = h < 0.5 - 0.3 * u ? P.ROSE : h < 0.8 ? P.PROSE : h < 0.93 ? 15 : P.PVIRID;
          deck.add(cx - Lh.x * dh * sd + Lh.z * o1, DECK_Y + k.H * 0.8 + k.rise * sd + o2, cz - Lh.z * dh * sd - Lh.x * o1, lerp(62, 30, u) * kd.range(0.8, 1.2) * dabScale, kd(), own + tier(3.6), kd.range(-0.4, 0.4), -Lh.x * dh, k.rise, -Lh.z * dh, -0.3);
        }
        await ctx.yield();
      }
    }
    addDabs(deck, 0, 0);
    const deckMask = new THREE.Mesh(new THREE.CircleGeometry(8800, 48), new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide }));
    deckMask.rotation.x = -Math.PI / 2; deckMask.position.y = DECK_Y; deckMask.renderOrder = -0.5; deckMask.frustumCulled = false; scene.add(deckMask);
    await ctx.yield();
    // ---------- the painted far wall ----------
    const rotL = (h, deg, out) => { const r = THREE.MathUtils.degToRad(deg), c = Math.cos(r), s = Math.sin(r); return out.set(h.x * c + h.z * s, 0, -h.x * s + h.z * c); };
    const keyAz = rng.range(30, 37), keyEl = THREE.MathUtils.degToRad(rng.range(21, 25));
    const key = rotL(inDir, keyAz, V3(0, 0, 0)).multiplyScalar(Math.cos(keyEl)); key.y = Math.sin(keyEl); key.normalize();
    const kt1 = V3(0, 0, 0).crossVectors(key, V3(0, 1, 0)).normalize(), kt2 = V3(0, 0, 0).crossVectors(key, kt1);
    const cluster = [key.clone()];
    const lone = canvasId === 'nocturne';                        // the nocturne keeps one lemon star
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + rng.range(-0.4, 0.4), r = lone ? 9 : rng.range(0.15, 0.25);
      cluster.push(lone ? key.clone() : key.clone().addScaledVector(kt1, Math.cos(a) * r).addScaledVector(kt2, Math.sin(a) * r * 0.75).normalize());
    }
    const domeHero = heroLookDir.clone(), heroAim = an.tipTop.clone().lerp(G, 0.3);
    // the pale passage also lies behind each flanking pillar while the whole canvas is in view
    const flankAim = flanks.slice(0, 4).map((f) => { const t = V3(0, 0, 0); f.axis(f.o.H * 0.62, t); return t; });
    const flankDir = [0, 1, 2, 3].map(() => heroLookDir.clone());
    const domeU = {
      uPig: { value: hero.pigments }, uCluster: { value: cluster }, uKey: { value: key }, uHeroDir: { value: domeHero }, uFlank: { value: flankDir }, uFlankK: { value: 0.94 }, uNarrow: { value: 0 }, uRot: { value: new THREE.Matrix3() },
      uTime: { value: 0 }, uN: { value: 64 }, uManner: { value: manner }, uPrimeK: { value: canvas.primeK },
      uGlow: { value: canvas.glow }, uSpark: { value: lone ? 0.05 : 0.08 },
      uCam: { value: V3(entry.x, entry.y, entry.z) }, uDeckK: { value: V3(DECK_Y, 400, 0) }, uDeckPh: { value: deckPh }, uLh: { value: new THREE.Vector2(Lh.x, Lh.z) },
      uBank: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (deckBanks[i] ? deckBanks[i].clone() : new THREE.Vector4(0, 0, 0, 0))) }, uLandWarm: U.uLandWarm, uLandDeep: U.uLandDeep,
      // what shows in a gap of the deck: the canvas's own priming where that is dark, the deepest violet where it is pale
      uDeckDeep: { value: canvasId === 'dawn' ? hero.pigments[1].clone().multiplyScalar(0.7) : hero.pigments[0].clone().multiplyScalar(canvas.primeK * 0.9) },
      uFoot: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (feet[i] ? feet[i].clone() : new THREE.Vector4(0, 0, 0, 0))) },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(8200, 32, 20), new THREE.ShaderMaterial({
      uniforms: domeU, vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);
    const rotAxis = V3(0.2, 1, 0.1).normalize(), rotM4 = new THREE.Matrix4();

    // ---------- linen ----------
    const weaveU = { uPeriod: { value: 3 }, uK: { value: canvasId === 'dawn' ? 0.12 : 0.1 } };
    const weave = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: weaveU, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: WEAVE_FS,
      depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendEquation: THREE.AddEquation }));
    weave.frustumCulled = false; weave.renderOrder = 60; scene.add(weave);

    // ---------- rare: one bank is still bare primed linen with the charcoal underdrawing ----------
    let bareU = null, uPass = 0.3;
    if (rare) {
      const W = 1300, H = 1700, segs = [], K = 0.85;
      const S4 = (a, b, c, d) => segs.push(new THREE.Vector4(a, b, c, d));
      const cx = (y) => W * 0.62 - Math.tan(0.21) * y, hw = (y) => lerp(200, 120, clamp(y / 1100, 0, 1)) * (1 + 0.12 * Math.sin(y * 0.011));
      // a contour drawn freehand: short strokes that wander with the noise
      const contour = (x0, lean, w0, w1, y0, y1, n, sd) => {
        for (const sg of [-1, 1]) {
          let px = 0, py = 0;
          for (let i = 0; i <= n; i++) {
            const y = lerp(y0, y1, i / n), k = (y - y0) / (y1 - y0);
            const x = x0 - lean * y + sg * lerp(w0, w1, k) * (1 + 0.16 * noise.n2(y * 0.006 + sd, sg * 7.3 + sd));
            if (i) S4(px, py, x, y);
            px = x; py = y;
          }
        }
        S4(x0 - lean * y1 - w1 * 0.9, y1, x0 - lean * y1 + w1 * 0.9, y1 + w1 * 0.25);
      };
      {                                                          // the hero pillar follows the same outline the dots fill
        for (const sg of [-1, 1]) for (let i = 0; i < 24; i++) {
          const ya = lerp(70, 1100, i / 24), yb = lerp(70, 1100, (i + 1) / 24);
          const wob = (y) => 1 + 0.07 * noise.n2(y * 0.008, sg * 3.1) + 0.03 * noise.n2(y * 0.03, sg * 5.7);
          S4(cx(ya) + sg * hw(ya) * wob(ya), ya, cx(yb) + sg * hw(yb) * wob(yb), yb);
        }
      }
      for (let i = 0; i < 3; i++) {                              // fingers
        const x0 = cx(1100) + (i - 1) * 85, x1 = x0 - 40 - i * 12, y1 = 1190 + (i === 1 ? 60 : 0);
        S4(x0 - 35, 1100, x1, y1); S4(x1, y1, x0 + 35, 1100);
      }
      const ex = cx(1100) - 60, ey = 1420;
      for (let i = 0; i < 8; i++) { const a0 = (i / 8) * TAU, a1 = ((i + 1) / 8) * TAU; S4(ex + Math.cos(a0) * 150, ey + Math.sin(a0) * 175, ex + Math.cos(a1) * 150, ey + Math.sin(a1) * 175); }
      contour(330, 0.2, 78, 50, 60, 1330, 5, 1.7);               // the tall pillar behind, on the left
      contour(1150, 0.2, 92, 58, 60, 720, 4, 5.2);               // the short one, nearer on the right
      S4(cx(40), 40, cx(1640), 1640);                            // the construction line of the lean
      for (let i = 0; i < 6; i++) { const y = 190 + i * 150; S4(cx(y) + hw(y) * 0.34, y, cx(y) + hw(y) * 0.8, y + 52); }
      for (let i = 0; i < 4; i++) { const y = 240 + i * 250; S4(330 - 0.2 * y + 14, y, 330 - 0.2 * y + 56, y + 46); }
      for (let i = 0; i < 2; i++) { const y = 260 + i * 240; S4(1150 - 0.2 * y + 18, y, 1150 - 0.2 * y + 70, y + 52); }
      while (segs.length < 100) segs.push(segs[0].clone());
      bareU = { uPig: { value: hero.pigments }, uSeg: { value: segs.slice(0, 100) }, uSize: { value: new THREE.Vector2(W, H) },
        uFill: { value: 0 }, uPrimeK: { value: canvas.primeK }, uTime: { value: 0 }, uGone: { value: 0 } };
      const bare = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShaderMaterial({ uniforms: bareU, vertexShader: BARE_VS, fragmentShader: BARE_FS, side: THREE.DoubleSide }));
      bare.scale.setScalar(K);
      bare.position.copy(barePos);
      bare.lookAt(tmp.copy(eye0).addScaledVector(inDir, 700));
      scene.add(bare);
      uPass = uOfPoint(eye0.clone().addScaledVector(inDir, 1150));   // the last dabs land as the route passes it, a little after the gate
    }
    await ctx.yield();

    // ---------- flight plan ----------
    const heroLook = an.tipTop.clone().lerp(G, 0.45);
    // out over the deck on the side the burning rim faces (toward the key), 4 km from the foot of the rim and 400 m
    // over the deck: the deck, the level line and the wall beyond it
    const climbLook = r0.clone().addScaledVector(Lh, 4000).setY(DECK_Y + 400);
    // The look is taken up from the last knot of the approach, where the route leaves the canvas's axis and turns in
    // to the rim (from that knot on, the lit face closes in on the right), and it is full at the foot of the rim; it
    // is let go over the same length of route after the top. climbN is that one length: the metres of route from
    // that knot to the foot of the rim.
    const climbN = Math.max(1, (uRim - uOfPoint(pts[6])) * path.length);
    const lookG = G.clone().addScaledVector(A, 45);              // a little up the axis: the mouth, the star and the root of the upper jet
    // the veil holds while we pull back beside the egg (a dark mass with a burning lip) and lifts once the view is into the mouth
    const stage = hero.stage;
    const stageAt = (u) => {
      stage.peel = smoothstep(uPeel0, uIn, u);                  // the mouth is open by the time we head in at it
      stage.star = smoothstep(uFar - mt(200), uFar, u);
      stage.jets = clamp((u - uFar) / mt(460), 0, 1);           // drawn out over the 460 m after the star takes hold
      stage.front = clamp((u - uFar) / (1 + mt(115) - uFar), 0, 1);
      stage.reveal = smoothstep(uTop - mt(175), uTop + mt(175), u);
      hero.setStage(stage);
    };
    stageAt(0); U.uStorm.value = 0.1;
    const res = new THREE.Vector2(), camP = V3(0, 0, 0);
    // linger on the whole canvas from above, hurry the descent, the gate and the plunge, ease on to the rim, ease for
    // the approach to the ring in the gap (every stretch is given by a place of the route or in metres from one)
    const pace = (u) => 0.66 + 0.7 * smoothstep(mt(200), uGate - mt(500), u) - 0.3 * smoothstep(uRim - mt(580), uRim, u)
      + 0.2 * smoothstep(uTop, uTop + mt(230), u) * (1 - smoothstep(uPeel0 - mt(230), uPeel0 + mt(115), u))   // the swing out is a link
      - 0.34 * smoothstep(uFar - mt(460), uFar - mt(58), u)     // linger while the star lights and the jets draw out
      + 0.22 * smoothstep(uFar + mt(580), uDive, u) + 0.1 * smoothstep(1 - mt(400), 1 - mt(115), u);

    return {
      scene, path,
      duration: clamp(path.length / 118, 38, 50), pace,
      title: canvas.name,
      ride: 'none', style: 'none',
      marks: { G, A, S, uGate, uRim, uTop, uPeel0, uIn, uNear, uFar, uDive, hullDist: an.hullDist },   // where the beats fall, for whoever tunes the route
      camera: { fov: 65, near: 0.5, far: 9000, lookAhead: 60, sway: 0.6, bank: 0.8 },
      pois: [
        { at: heroLook, from: 0, to: uRim - mt(700), weight: 0.5 },
        // up the rim the gaze leans out from the burning crust, which passes close beside us, to the deck and the
        // level line on the side the rim faces (full from the foot of the rim to its top; taken up over the climbN
        // metres before the foot and let go over the climbN metres after the top)
        { at: climbLook, from: uRim - mt(climbN), to: uTop + mt(climbN), weight: 0.7, fade: mt(climbN) / (uTop - uRim + 2 * mt(climbN)) },
        // the camera pulls back from the egg and loops in front of it, looking at it all the way: one whole pull,
        // taken up over the 470 m before the top of the rim and let go over the same length after the dive begins
        // (a steady camera takes a third of it and watches the cluster and the shoals until the loop turns it in)
        { at: lookG, from: uTop - mt(200), to: uDive + mt(200), weight: 1, fade: mt(470) / (uDive - uTop + mt(400)) },
      ],
      // (until the next world shows, the opening is a dark pool in the groove and not a second star)
      portal: { shape: 'circle', radius: 14, color: canvas.portal, glow: 1.5, tilt: true, revealDistance: 1300, veil: canvas.pal[1] },
      post: {
        exposure: canvasId === 'dawn' ? 0.92 : 1.05,
        bloom: { strength: 0.16, radius: 0.35, threshold: 1.0 },
        grade: { saturation: canvasId === 'nocturne' ? 1.0 : 1.1, contrast: 1.03, tint: '#ffffff', shadowTint: '#0a0c24', vignette: 0.18, grain: 0.0, aberration: 0 },
      },
      update(dt, time, camera, u) {
        stageAt(u);
        hero.update(dt, time, camera);
        camera.getWorldPosition(camP); dome.position.copy(camP);
        domeU.uTime.value = time;
        domeU.uCam.value.copy(camP); domeU.uDeckK.value.y = U.uPxScale.value;
        ctx.renderer.getDrawingBufferSize(res);
        // the far wall's dots are finer than any real dab (about 2.8 px, or 0.47 % of the frame's height), so it fuses
        domeU.uN.value = clamp(U.uPxScale.value / Math.max(2.8, res.y * 0.0047), 60, 400);
        // the pale passage of the wall stays behind the hero: behind the pillars at first, behind the egg later
        domeHero.copy(heroAim).lerp(G, smoothstep(uRim - mt(350), uTop, u)).sub(camP);
        if (domeHero.lengthSq() < 1) domeHero.copy(heroLookDir); else domeHero.normalize();
        for (let i = 0; i < 4; i++) {
          if (i < flankAim.length) { flankDir[i].subVectors(flankAim[i], camP); if (flankDir[i].lengthSq() < 1) flankDir[i].copy(domeHero); else flankDir[i].normalize(); }
          else flankDir[i].copy(domeHero);
        }
        domeU.uFlankK.value = 0.94 * (1 - smoothstep(uRim - mt(520), uRim + mt(115), u));
        domeU.uNarrow.value = smoothstep(uRim - mt(350), uTop, u);
        rotM4.makeRotationAxis(rotAxis, time * 0.0025); domeU.uRot.value.setFromMatrix4(rotM4);
        weaveU.uPeriod.value = Math.max(3, res.y / 110);
        // the storm of the plunge thins as we reach the rim, so the climb has figures and not only weather
        // (it gathers once the gate is behind us: the high approach and the gate are seen through clear air)
        U.uStorm.value = lerp(0.1, 1, smoothstep(uGate, uGate + mt(600), u)) * (1 - 0.75 * smoothstep(uRim - mt(230), uRim + mt(115), u))
          * (1 - 0.85 * smoothstep(uTop - mt(115), uTop + mt(230), u) * (1 - smoothstep(uDive - mt(290), uDive + mt(230), u)));   // clear air round the egg
        if (bareU) { bareU.uTime.value = time; bareU.uFill.value = 0.35 + 0.65 * smoothstep(mt(115), uPass, u); bareU.uGone.value = smoothstep(uPass + mt(290), uPass + mt(810), u); }
      },
      dispose() { hero.dispose(); },
    };
  },
};
