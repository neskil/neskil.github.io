// The Squall Made of Light, after J. M. W. Turner (the late oils): the part.
// REBUILT WHOLE in November 2026 (the first build was flat pigment with the light switched off; this one is built on light).
// What stands here: the world's one shared law of light and air (TURNER_GLSL: the painted sky, the haze that takes every far
// thing into the colour of the light behind it, the squall: a column of vapour standing on the sea, dark on its lee and lit
// toward the sun, with its cloud wound in arms about the sun; from within it the whole sky is that whirl), the sky dome, the sea, one material for
// every solid and one for every thin line, and the things themselves: the old three-decker in her black and yellow and the small
// black paddle tug that tows her (the hero set piece, buildHero), a steam packet (the tug's larger sister, for the squall), smoke
// and spray, fishing luggers under sail, a bell buoy, gulls,
// the harbour (moles, lighthouse, quays, houses, porticoes, towers, domes, the bridge), coasters, a brig under sail, a trader
// with her sails loosed, skiffs.
// Everything is drawn live by code: no model, no picture file, nothing lettered. The one texture is a 256 px sheet of noise made here.
//
// WHAT READS THE EYE, and nothing else does (no seed beyond the dealt rng, no still position, no wall clock, no lens angle):
//   the sky is a dome carried at the eye (a sky at infinity); the sea is a fan of rings carried at the eye's x and z (the water itself
//   is a function of place and of the world's clock); the sea's dabs and the strokes on solids are sized by the pixel's footprint, so
//   they stay a few pixels broad at any distance; which lay of the sea's dabs shows at a place goes by the bearing it is seen on, and
//   so do the sun's road, the glints, the sheen against the light and the sun through canvas (bearing terms, as light is); the air
//   takes things by their distance from the eye; ribbons (rigging, hawser) turn about their own run to face the eye and are never
//   under a pixel and a third (they pale instead); puffs turn to the eye and thin away as the lens comes up;
//   a sail's edge is broken by the bristle to a depth of a few pixels at any distance; the sea lies stiller where the world says it is sheltered.
// WHAT THE CLOCK MOVES: the water, the sky's slow turning, smoke and spray, the tug's wheels, cloth (flags, loosed sails, the luggers'
//   and the brig's canvas), the gulls on their rings, the water's light on stone and hulls; the world rocks the hulls,
//   lifts the boats on the sea under them and swells the lamp.
import * as THREE from 'three';

export const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the looks: pigments (sRGB as a painter names them; written through post.flat they reach the screen as written) -------
export const LOOKS = {
  // the fire evening: a white-hot sun low in chrome and vermilion, slate blue and lilac standing off it
  fire: {
    core: '#FFF6D8', lemon: '#FFDD6E', gold: '#F7AC3C', fire: '#E66A30', red: '#B23A26', rose: '#D9998A', cream: '#F2D49C',
    dusk: '#8F8AA8', slate: '#3F5679', zen: '#6F8DB2', umber: '#2E211B', pearl: '#E6DDCB', sea: '#2C3A3E', ghost: '#EFE3C4',
    sunEl: 6.4, sunAz: 12,
  },
};

// ---- the uniform set: one per build, shared by every material of that build ------------------------------------------------
export function makeNoiseTexture() {
  // value noise sheet: R = lattice, G = the same lattice shifted by (37, 239) so one fetch gives two levels of a 3D lattice, B = a second lattice
  const N = 256, R = new Uint8Array(N * N), B = new Uint8Array(N * N), data = new Uint8Array(N * N * 4);
  let s = 0x2f6e2b1 >>> 0; const next = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s >>> 24; };
  for (let i = 0; i < N * N; i++) { R[i] = next(); B[i] = next(); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    data[i * 4] = R[i]; data[i * 4 + 1] = R[((y + 239) & 255) * N + ((x + 37) & 255)]; data[i * 4 + 2] = B[i]; data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

export function makeUniforms(lookName, seedVec, sunEl) {
  const L = LOOKS[lookName] || LOOKS.fire, c = (h) => ({ value: new THREE.Color(h) });
  const az = L.sunAz * Math.PI / 180, el = (sunEl || L.sunEl) * Math.PI / 180;
  const sun = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();   // +Z is the course at the entry, +X is port
  const sunR = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), sun).normalize(), sunU = new THREE.Vector3().crossVectors(sun, sunR).normalize();
  const sunH = new THREE.Vector2(sun.x, sun.z).normalize();
  return {
    uT: { value: 0 }, uSun: { value: sun }, uSunR: { value: sunR }, uSunU: { value: sunU }, uSunH: { value: sunH },
    uRes: { value: new THREE.Vector2(1280, 720) }, uNoise: { value: makeNoiseTexture() }, uSeed: { value: seedVec || new THREE.Vector3(3.1, 7.7, 1.3) },
    cCore: c(L.core), cLemon: c(L.lemon), cGold: c(L.gold), cFire: c(L.fire), cRed: c(L.red), cRose: c(L.rose), cCream: c(L.cream),
    cDusk: c(L.dusk), cSlate: c(L.slate), cZen: c(L.zen), cUmber: c(L.umber), cPearl: c(L.pearl), cSea: c(L.sea), cGhost: c(L.ghost),
    uHaze: { value: new THREE.Vector4(1 / 340, 0.012, 0, 0) },            // x: the air's thickness (1 over metres), y: how fast it thins with height
    uSq: { value: new THREE.Vector4(0, 0, 120, 0) },                      // the squall's column: centre x, z, radius (m), strength (optical depth through its middle)
    uSwell: { value: new THREE.Vector4(0.14, 1.9, 0, 0) },                // x: the calm water's swell (m), y: the sea got up inside the squall (m)
    uCalm: { value: new THREE.Vector4(1e9, 2e9, 0, 0) },                  // sheltered water: it comes on between z = x and z = y; z: how still it lies there (0 not at all, 1 a harbour)
    uFol: { value: new THREE.Vector3() },                                 // how far a funnel that rides the sea stands from its place of rest just now (the youngest of its smoke goes with it)
    // what stands in the water, for the sea to mirror and to break against (set by the world once, by place)
    uVes: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },      // a vessel: x, z, cos and sin of her heading
    uVesS: { value: Array.from({ length: 14 }, () => new THREE.Vector4()) },     // half beam, half length, kind (1 hulk, 2 paddle tug, 3 a thing lying still, 4 a boat with way on her), where her wheels are
    uBxC: { value: Array.from({ length: 32 }, () => new THREE.Vector4()) },     // a box to mirror: centre, cos of its heading
    uBxH: { value: Array.from({ length: 32 }, () => new THREE.Vector4()) },     // half sizes, sin of its heading
    uBxCol: { value: Array.from({ length: 32 }, () => new THREE.Vector3()) },   // its colour as it stands in the light
  };
}

// ---- the one law of light and air, in every material -----------------------------------------------------------------------
export const TURNER_GLSL = /* glsl */`
uniform float uT; uniform vec3 uSun, uSunR, uSunU, uSeed; uniform vec2 uSunH, uRes; uniform sampler2D uNoise;
uniform vec3 cCore, cLemon, cGold, cFire, cRed, cRose, cCream, cDusk, cSlate, cZen, cUmber, cPearl, cSea, cGhost;
uniform vec4 uHaze, uSq, uSwell, uCalm;
uniform vec4 uVes[14], uVesS[14], uBxC[32], uBxH[32]; uniform vec3 uBxCol[32];
float tN2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return textureLod(uNoise, (mod(i, 256.) + f + .5) / 256., 0.).b; }
float tN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  vec2 uv = mod(i.xy + vec2(37., 239.) * i.z, 256.) + f.xy; vec2 rg = textureLod(uNoise, (uv + .5) / 256., 0.).rg; return mix(rg.x, rg.y, f.z); }
float tFbm2(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * tN2(p); p = p * 2.03 + vec2(17.1, 3.7); a *= .5; } return s / .9375; }
float tFbm3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * tN3(p); p = p * 2.03 + vec3(17.1, 3.7, 9.2); a *= .5; } return s / .9375; }
float tFbm3b(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++){ s += a * tN3(p); p = p * 2.11 + vec3(5.3, 13.7, 2.9); a *= .5; } return s / .875; }
float tHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 tHash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }

// The lay-in: the sky with no brushwork in it. It is also the colour of the haze in a direction and what the water mirrors.
vec3 tLay(vec3 d){
  float el = clamp(d.y, 0., 1.);
  float th = acos(clamp(dot(d, uSun), -1., 1.));
  vec2 dh = d.xz * inversesqrt(max(dot(d.xz, d.xz), 1e-6));
  float sw = dot(dh, uSunH) * .5 + .5;                                    // 1 toward the sun's bearing, 0 away from it
  vec3 low = mix(cDusk, cCream, sw * sw * sw), high = mix(cSlate, cZen, sw * sw);
  vec3 col = mix(low, high, 1. - exp(-el * 4.2));
  float t2 = th * th;
  col = mix(col, cFire, .62 * exp(-t2 / .34) * exp(-el * 1.6));
  col = mix(col, cGold, .9 * exp(-t2 / .085));
  col = mix(col, cLemon, .95 * exp(-t2 / .022));
  col = mix(col, cCore, exp(-t2 / .0042));
  return col;
}

vec3 tHazeCol(vec3 rd){ vec3 h = normalize(vec3(rd.x, max(rd.y, 0.) * .6 + .03, rd.z)); return tLay(h); }

// The painted sky. Under everything a soft picture: the lay-in, veils of cloud wound in a slow whirl about the sun, banks lying
// along the horizon further off. Over it the brush: strokes that each carry ONE colour, taken from the soft picture at the
// stroke's own middle, laid along the whirl near the sun and level away from it; each has a ridge and the bristle's drag.
vec3 tTwist(vec3 d, float a){ float c = cos(a), s = sin(a); return d * c + cross(uSun, d) * s + uSun * dot(uSun, d) * (1. - c); }
vec3 tVeilCol(vec3 col, vec2 dl, float th, float tone){
  float t2 = th * th, near = exp(-t2 / .5), off = 1. - exp(-t2 / .012);
  vec3 dfar = mix(cSlate * .74, cDusk * .8, tone), dnear = mix(cRed, cFire, tone * .9);
  col = mix(col, mix(dfar, dnear, smoothstep(.06, .62, near)), dl.x * off * (.84 - .3 * near));
  vec3 lc = mix(mix(cPearl, cRose, .45 * (1. - tone)), mix(cLemon, cCore, tone), smoothstep(.12, .8, near));
  return mix(col, lc, dl.y * off * .8);
}
// The colour of the squall's vapour in a direction: a blaze toward the sun, slate rain on its lee, darker as one looks up into it.
vec3 tSquallCol(vec3 d){
  vec2 hn = d.xz * inversesqrt(max(dot(d.xz, d.xz), 1e-6)); float sd = dot(hn, uSunH), sunward = smoothstep(.8, .995, sd);
  vec3 lee = mix(cSlate * .5 + cUmber * .16, mix(cSlate, cDusk, .42) * .7, smoothstep(.3, .98, sd));
  vec3 c = mix(lee, mix(tHazeCol(d), mix(cLemon, cCore, .5), .3), sunward);
  return mix(c, c * vec3(.42, .47, .66), smoothstep(.05, .38, d.y) * (1. - .55 * sunward));
}
// The squall against the sky: a pillar of rain with the light in it and the dark cloud that carries it. It is a body in the
// world (the very column the air knows), reckoned from where the eye stands, so it keeps its place as we come up and go through.
float tErf(float x){ float s = sign(x), a = abs(x); float t = 1. / (1. + .3275911 * a); float y = 1. - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * exp(-a * a); return s * y; }
vec3 tSquallOn(vec3 col, vec3 d){
  if (uSq.w <= 0.) return col;
  vec2 oh = cameraPosition.xz - uSq.xy, dh = d.xz; float a = max(dot(dh, dh), 1e-4), b = dot(dh, oh), c = dot(oh, oh), R = uSq.z, sa = sqrt(a);
  float tc = max(-b / a, 0.), yc = cameraPosition.y + max(d.y, 0.) * tc, miss = max(c - b * b / a, 0.);
  float lat = (oh.x * dh.y - oh.y * dh.x) / sa;
  vec2 hn = dh / sa; float sunward = smoothstep(-.2, .95, dot(hn, uSunH));
  // the pillar: rain falling in long slant streaks, thick low and thinning as the sight line climbs
  float yEff = cameraPosition.y + max(d.y, 0.) * (tc + .5 * R / sa);
  float rag = tN2(vec2(yc * .011 + uSeed.x, lat * .006 + uSeed.z)), latS = lat - (yc - 25.) * .3;      // its flanks are ragged, and it leans down the wind
  float tauP = uSq.w * .5 / sa * exp(-latS * latS / (R * R * (.4 + 1.2 * rag))) * (1. - tErf((b / sa) / R)) * exp(-yEff / 120.);
  float streak = tN2(vec2((lat - yc * .4) * .07, yc * .007) + uSeed.xy);
  // seen from outside, its rain falls in slant streaks; from within there is no column to see, and the rain goes round with the whirl
  float th = acos(clamp(dot(d, uSun), -1., 1.)), t2 = th * th, inS = exp(-c / (R * R * 1.15));
  vec3 dW = tTwist(d, 2.1 * log(min(th, 1.5) + .1) + uT * .01);
  float farS = smoothstep(.12, .6, th);                                    // far from the sun nothing of it is wound, seen from within: broken cloud, soft at the edge (wound that far out, its arms would stand as straight rays)
  streak = mix(streak, mix(.25 + .5 * tN3(dW * 3.7 + uSeed.zxy * 2.3), .5, farS), smoothstep(.06, .4, inS));
  tauP *= .55 + .9 * streak;
  vec3 pc = tSquallCol(d);
  pc = mix(pc, pc * vec3(.7, .74, .86), (1. - streak) * .5);
  float veil = 1. - exp(-tauP);
  col = mix(col, pc, veil);
  // the cloud that carries it: dark arms wound about the sun (their winding is the sky's own, at infinity) and standing where the squall
  // stands (a lid some way up, reckoned from the eye). The eye of it, about the sun, is open; the arms nearest the sun take fire.
  float t1 = (85. - cameraPosition.y) / max(d.y, .02); vec2 pa = oh + dh * t1; float RA = R * 3.0;
  float arm = tFbm3b(dW * 2.0 + uSeed.yzx * 1.3);
  inS *= smoothstep(.1, .45, inS);                                         // how deep the eye stands in it: from within, the whole sky is its whirl, down to the sea; a little way out of it none of that is left
  float wS = 1. - smoothstep(.3, .75, inS);                                // deep in it the arms are sharp; toward its edge they are broad and soft
  float inF = farS * smoothstep(0., .5, inS);
  float armR = arm;
  if (inS > .002) armR = mix(arm, tFbm3b(d * 1.7 + uSeed.yzx * 1.3 + 4.3), farS) + (tN3(mix(dW, d, farS) * 6.1 + uSeed.xzy * 1.9) - .5) * (.1 + .16 * farS);
  float tauA = 7.5 * (exp(-dot(pa, pa) / (RA * RA)) * min(.4 / max(d.y, .08), 2.4) * mix(1., .6, inF) * smoothstep(.25 - .08 * inF, .5 + .18 * inF, mix(arm, armR, inF)) + inS * mix(1.5, .45, farS) * smoothstep(.47 - .1 * wS - .1 * farS, .56 + .16 * wS + .2 * farS, armR)) * (1. - exp(-t2 / .026));
  float tn = tN3(d * 7.3 + uSeed.zxy), tb = tN3(d * 2.7 + uSeed.yxz * 1.7);  // no two strokes of it the same dark, and broad lights lie in it
  vec3 cc = mix(mix(cSlate * .34, mix(cUmber, cSlate, .5) * .8, armR), mix(cSlate, cDusk, .4) * .62, tn * .7);
  cc = mix(cc, mix(cDusk, cRose, .4) * .78, smoothstep(.52, .8, tb) * .42);  // where the low light finds its under side
  cc = mix(cc, mix(cRed, cFire, .5) * .92, exp(-t2 / .085) * .85 * smoothstep(.66, .42, arm));
  col = mix(col, cc, (1. - exp(-tauA)) * (1. - .3 * veil));                 // the rain hangs before the cloud, and takes some of its dark
  // and from within, between the dark arms the light pours down the whirl: pale arcs of lit rain wound with them
  float lg = smoothstep(.47 + .06 * farS, .38 - .14 * farS, armR) * inS * exp(-t2 / .7) * (1. - exp(-t2 / .02));
  return mix(col, mix(mix(cPearl, cCream, .55), mix(cLemon, cCore, .5), exp(-t2 / .22)), lg * (.5 + .2 * exp(-t2 / .4)));
}
vec3 tField(vec3 d, float soft){
  vec3 col = tLay(d);
  float th = acos(clamp(dot(d, uSun), -1., 1.)), t2 = th * th;
  float wW = exp(-t2 / .7);                                               // how far the whirl reaches
  vec3 p1 = tTwist(d, 1.15 * log(min(th, 1.2) + .08) - uT * .008);
  float v1 = tFbm3(p1 * 2.4 + uSeed);
  float vH = tFbm3b(vec3(d.x * 2.6, d.y * 9., d.z * 2.6) + uSeed.zxy * 1.7 + vec3(uT * .004, 0., 0.));   // banks lying level
  float e = mix(vH, v1, .25 + .75 * wW);
  float tone = tN3(p1 * 5.1 + uSeed.yzx);
  vec2 dl = vec2(smoothstep(.46 + soft, .39 - soft, e), smoothstep(.57 - soft, .66 + soft, e));
  return tSquallOn(tVeilCol(col, dl, th, tone), d);
}
vec3 tSkySoft(vec3 d){ return tField(d, .05); }
// a cell of strokes. p in cells (x along the stroke, y across). x: the bristle here, y: across, z: how much paint, w: its dice; pc: its middle
vec4 tCell(vec2 p, float lvl, out vec2 pc){
  float row = floor(p.y), o = tHash(vec2(row, lvl)) * 7.31, A = p.x + o;
  vec2 id = vec2(floor(A), row), f = vec2(A - id.x, p.y - row) - .5;
  vec2 hs = tHash2(id + lvl * 17.3);
  vec2 jit = (hs - .5) * vec2(.16, .14), g = f - jit;
  // loaded at its middle, dragged thin to its ends; its sides are broken by the bristle (a dry brush leaves hairs, not a blur)
  float body = 1. - smoothstep(.45, 1., length(vec2(g.x / (.36 + .14 * hs.y), g.y / .44)));
  float hair = tN2(vec2(A * 1.3 + hs.x * 9., p.y * 26.) + lvl * 5.7);
  float m = smoothstep(hair * .7, hair * .7 + .2, body * 1.3);
  m *= smoothstep(.5, .45, abs(f.x)) * smoothstep(.5, .47, abs(f.y));
  pc = vec2(id.x + .5 + jit.x - o, row + .5 + jit.y);
  return vec4(hair, g.y, m, hs.x);
}
// the sky's own cell of strokes: as tCell, but laid by hand: no two strokes one size, each a little off its row and out of its
// place, loaded at one end and dragged dry toward the other; and (soft, 0 to 1) how far it is a scumble and not a dab: about
// the sun the paint is laid thick in crisp touches, away from it it is dragged thin and worked into the ground
vec4 tCellW(vec2 p, float lvl, float soft, float bare, out vec2 pc){
  float row = floor(p.y), o = tHash(vec2(row, lvl)) * 7.31, A = p.x + o;
  vec2 id = vec2(floor(A), row), f = vec2(A - id.x, p.y - row) - .5;
  vec2 hs = tHash2(id + lvl * 17.3), h2 = tHash2(id + lvl * 5.9 + 41.3);
  float sc = .78 + .36 * h2.x;
  vec2 jit = (hs - .5) * (vec2(.16, .14) + vec2(.66, .52) * (1.14 - sc)), g = f - jit;
  float an = (h2.y - .5) * .5, ca = cos(an), sa = sin(an); g = vec2(g.x * ca - g.y * sa / 1.7, g.x * sa * 1.7 + g.y * ca);
  vec2 ge = abs(vec2(g.x / ((.36 + .14 * hs.y) * sc), g.y / (.44 * sc)));
  float body = 1. - smoothstep(.45 * (1. - .8 * soft), 1., pow(ge.x * ge.x * ge.x + ge.y * ge.y * ge.y, .3333));     // a touch of the brush is blunt where it is set down: no leaf
  float hair = tN2(vec2(A * 1.3 + hs.x * 9., p.y * 26.) + lvl * 5.7), dry = (.7 + .3 * h2.y) * (1. - .5 * soft);
  dry *= 1. + .4 * smoothstep(-.25, .5, g.x * (hs.x < .5 ? 1. : -1.) / sc);
  float m = smoothstep(hair * dry, hair * dry + .2 + .75 * soft, body * 1.3);
  m *= smoothstep(.5, .45, abs(f.x)) * smoothstep(.5, .47, abs(f.y)) * step(bare, fract(h2.x * 7.7 + h2.y * 3.1));
  pc = vec2(id.x + .5 + jit.x - o, row + .5 + jit.y);
  return vec4(hair, g.y / sc, m, hs.x);
}
// strokes laid along the whirl's own arms: ph round the sun (0 straight up; the seam is straight down, out of sight), lg the log of the angle from it
vec3 tWhirl(float ph, float lg, float n, float hl, float k, float lvl, float soft, float bare, out vec4 s){
  vec2 pc; s = tCellW(vec2(lg / hl, (ph + k * lg) * n / 6.2832), lvl, soft, bare, pc);
  float lgc = pc.x * hl, phc = pc.y * 6.2832 / n - k * lgc, thc = max(exp(lgc) - .07, 0.);
  return tField(cos(thc) * uSun + sin(thc) * (sin(phc) * uSunR + cos(phc) * uSunU), .1 * soft);          // a scumbled stroke carries a broken tone, not the veil's pure one
}
// level strokes: az round the horizon, el up from it
vec3 tLevel(float az, float el, float n, float h, float lvl, float soft, float bare, out vec4 s){
  vec2 pc; s = tCellW(vec2(az / 6.2832 * n, el / h), lvl, soft, bare, pc);
  float azc = pc.x / n * 6.2832, elc = clamp(pc.y * h, 0., 1.5);
  return tField(vec3(sin(azc) * cos(elc), sin(elc), cos(azc) * cos(elc)), 0.);
}
vec3 tLayOn(vec3 col, vec3 c, vec4 s, float op, float vary){               // one stroke over what is there: its colour, its ridge, its bristle
  float edge = s.z * (1. - s.z) * 4., d2 = fract(s.w * 7.31 + .37);
  c = mix(c, col, .22);                                                    // a stroke takes up a little of what it is laid into
  c *= 1. + (s.w - .5) * (.13 + .2 * vary);
  c *= mix(vec3(1.), d2 < .5 ? vec3(.9, .98, 1.1) : vec3(1.12, .98, .92), vary * abs(d2 - .5) * 1.7);   // away from the sun no two strokes are one blue
  c *= 1. - .3 * s.y * edge;
  c *= .93 + .14 * s.x;
  return mix(col, c, s.z * op);
}
vec3 tTame(vec3 c, vec3 col, float k){ float dl = dot(c - col, vec3(.3, .5, .2)); return mix(c, col, smoothstep(.08, .34, abs(dl)) * k); }   // a stroke over a far lighter or darker ground is worked into it
vec2 tDepth(vec3 ro, vec3 rd, float D);
vec3 tSky(vec3 d){
  float th = acos(clamp(dot(d, uSun), -1., 1.)), t2 = th * th;
  vec3 col = tField(d, .04);
  float wW = smoothstep(1.05, .6, th);
  vec4 s; vec3 c;
  if (wW > .002) {
    float x = dot(d, uSunR), y = dot(d, uSunU);
    float ph = atan(x, abs(x) + abs(y) < 1e-6 ? 1e-6 : y), lg = log(th + .07);
    float far = 1. - exp(-t2 / .5);                                        // away from the sun no stroke stands out of its ground like a stamp
    float scum = smoothstep(.22, .7, th);                                  // about the sun the paint is laid thick in crisp touches; away from it it is scumbled: dragged thin and soft into the ground
    float tk = max(.7 * far, .55 * smoothstep(.25, .55, th));              // and no pale touch stands whole on a dark ground but hard by the sun
    c = tWhirl(ph, lg, 15., .7, 1.15, 1., scum, 0., s); col = tLayOn(col, tTame(c, col, tk), s, (.8 + .15 * s.w) * wW, 0.);
    c = tWhirl(ph + .37, lg + .11, 26., .42, .85, 2., scum * .8, 0., s); col = tLayOn(col, tTame(c, col, tk * .93), s, (.6 + .35 * s.w) * wW, 0.);
    c = tWhirl(ph + .9, lg + .05, 46., .23, 1.45, 5., scum * .5, 0., s); col = tLayOn(col, tTame(c, col, .8 * far), s, (.5 + .4 * s.w) * wW * step(.45, s.w), 0.);
  }
  if (wW < .998) {
    float az = atan(d.x, abs(d.x) + abs(d.z) < 1e-6 ? 1e-6 : d.z), el = asin(clamp(d.y, 0., 1.));
    c = tLevel(az, el, 20., .1, 3., .55, 0., s); col = tLayOn(col, c, s, (.8 + .15 * s.w) * (1. - wW), 1.);
    c = tLevel(az + .11, el + .019, 40., .05, 4., .4, 0., s); col = tLayOn(col, tTame(c, col, .6), s, (.6 + .35 * s.w) * (1. - wW), 1.);
  }
  // the low air takes the sky's foot into the light, so no line stands where the sea ends
  float lowK = exp(-max(d.y, 0.) * 30.) * .94;
  if (lowK > .01) {                                                        // (the squall stands on the sea: where it stands, the foot is its vapour)
    vec3 dlow = normalize(vec3(d.x, .03, d.z)); vec2 tl = tDepth(cameraPosition, normalize(vec3(d.x, 0., d.z)), 2400.);
    col = mix(col, mix(tLay(dlow), tSquallCol(dlow), tl.y / (tl.x + tl.y + 1e-4)), lowK);
  }
  // the sun: a rimless clot of white, laid on thick (above 1: the glow pass takes it from there)
  float clot = smoothstep(.036, .012, th + (tN2(d.xy * 90.) - .5) * .014);
  col += cCore * clot * 1.7;
  return col;
}

// Air. Everything far goes into the colour of the light behind it; the squall is a column of lit vapour standing on the sea.
vec2 tDepth(vec3 ro, vec3 rd, float D){                                    // optical depth along a sight line of D metres: x of the air, y of the squall's column
  float k = uHaze.y, dy = abs(rd.y) < 1e-4 ? 1e-4 : rd.y;
  float base = uHaze.x * exp(-k * max(ro.y, 0.)) * (1. - exp(-k * dy * D)) / (k * dy);     // thinning with height
  vec2 oh = ro.xz - uSq.xy, dh = rd.xz; float a = max(dot(dh, dh), 1e-6), b = dot(dh, oh), c = dot(oh, oh), R = uSq.z, sa = sqrt(a);
  float col = uSq.w / (1.7725 * R) * exp(-max(c - b * b / a, 0.) / (R * R)) * (R / sa) * .8862 * (tErf((D * sa + b / sa) / R) - tErf((b / sa) / R));
  return vec2(base, col);
}
vec3 tAirK(vec3 col, vec3 P, float k){                                     // k: how much of the squall's vapour counts (the water under it is lost in it; a hull standing in it is not)
  vec3 v = P - cameraPosition; float D = length(v); vec3 rd = v / max(D, 1e-3);
  vec2 tau = tDepth(cameraPosition, rd, D); tau.y *= k; float f = 1. - exp(-tau.x - tau.y);
  f = pow(f, 1.35); f = f * f * (3. - 2. * f);                            // near darks keep their strength; far things go wholly into the light
  return mix(col, mix(tHazeCol(rd), tSquallCol(rd), tau.y / (tau.x + tau.y + 1e-4)), f);
}
vec3 tAir(vec3 col, vec3 P){ return tAirK(col, P, 1.); }

// The sea's long swell: height and slope at a place. Calm in the estuary; got up where the squall stands.
float tSwellAmp(vec2 p){ vec2 o = p - uSq.xy; return uSwell.x + uSwell.y * exp(-dot(o, o) / (uSq.z * uSq.z * 1.6)); }
vec3 tSwell(vec2 p){                                                       // x: height, yz: d/dx, d/dz
  float A = tSwellAmp(p), h = 0.; vec2 g = vec2(0.);
  vec2 d1 = vec2(.34, .94), d2 = vec2(-.5, .866), d3 = vec2(.8, .6);
  float k1 = .105, k2 = .17, k3 = .29;
  float a1 = dot(p, d1) * k1 - uT * .62, a2 = dot(p, d2) * k2 - uT * .8 + 1.7, a3 = dot(p, d3) * k3 - uT * 1.05 + 4.1;
  h += A * sin(a1); g += A * k1 * cos(a1) * d1;
  h += A * .55 * sin(a2); g += A * .55 * k2 * cos(a2) * d2;
  h += A * .3 * sin(a3); g += A * .3 * k3 * cos(a3) * d3;
  return vec3(h, g);
}
`;

// ---- the sky: a dome that goes with whichever camera draws it (at infinity, nothing of the place) ---------------------------
export function buildSky(U) {
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 1800., 1.); gl_Position = p; }`,
    fragmentShader: /* glsl */`varying vec3 vDir;
      ${TURNER_GLSL}
      void main(){
        vec3 d = normalize(vDir);
        vec3 col = tSky(normalize(vec3(d.x, max(d.y, 0.), d.z)));
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), mat);
  m.frustumCulled = false; m.renderOrder = -100; m.name = 'sky';
  return m;
}

// ---- the sea ----------------------------------------------------------------------------------------------------------------
// One fan of rings that goes with the eye's place (a level of detail by where the eye IS, never by where it looks); its height
// and every mark on it are functions of the place in the world, so nothing on it moves with us.
export function buildSea(U, detail = 1) {
  const rings = Math.round(84 * (0.7 + 0.3 * detail)), segs = Math.round(144 * (0.7 + 0.3 * detail)), pos = [], idx = [];
  pos.push(0, 0, 0);
  const R0 = 1.2, grow = Math.pow(2600 / R0, 1 / (rings - 1));
  for (let i = 0; i < rings; i++) { const r = R0 * Math.pow(grow, i); for (let j = 0; j < segs; j++) { const a = (j + (i % 2) * 0.5) / segs * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + (j + 1) % segs, 1 + j);
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < segs; j++) {
    const a = 1 + i * segs + j, b = 1 + i * segs + (j + 1) % segs, c = 1 + (i + 1) * segs + j, d = 1 + (i + 1) * segs + (j + 1) % segs;
    if (i % 2 === 0) idx.push(a, b, c, b, d, c); else idx.push(a, d, c, a, b, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`varying vec3 vW;
      ${TURNER_GLSL}
      void main(){ vec2 p = position.xz + cameraPosition.xz; vW = vec3(p.x, tSwell(p).x, p.y); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: /* glsl */`varying vec3 vW;
      ${TURNER_GLSL}
      // one layer of dabs: lozenges of loaded paint lying across the light, each with one tilt of its own (so each mirrors one colour)
      vec4 tDabs(vec2 p, float cell, float lvl, vec2 dx){                  // xy: slope, z: how much of a dab stands here, w: its dice
        vec2 q = vec2(dot(p, dx), dot(p, vec2(-dx.y, dx.x))) / (cell * vec2(4.6, 1.));            // x along the dab, y across it
        float row = floor(q.y); q.x += tHash(vec2(row, lvl * 7.3)) * 13.7 + uT * .04 * (tHash(vec2(row, 3.1 + lvl)) - .5);
        vec2 id = vec2(floor(q.x), row), f = fract(q) - .5;
        vec2 h = tHash2(id + lvl * 19.7), h2 = tHash2(id + 31.7 + lvl * 3.3);
        float body = 1. - smoothstep(.45, 1., length(vec2(f.x / (.36 + .13 * h.y), f.y / .42)));
        float hair = tN2(vec2(q.x * 1.2 + h.x * 9., q.y * 17.) + lvl * 9.1);     // the dab's edge is the bristle's, not ruled
        float m = smoothstep(hair * .7, hair * .7 + .22, body * 1.3) * step(.24, h.x);
        float ph = h.y * 6.283 + uT * (.5 + 1.2 * h2.x);
        vec2 tilt = vec2((h2.y - .5) * .4, sin(ph) * .62 + (h.x - .65) * .5);
        return vec4(tilt, m, h2.x);
      }
      // one lay of dabs at three sizes laid over one another (the smallest comes in as we near, the largest goes); k says which way the lay lies:
      // 0 across the sun's bearing, 1 and 2 a fifth of a turn to either hand. xy: the tilt it gives the water (world x, z), z: how much of a dab stands here.
      vec3 tDabLay(vec2 p, float l0, float fr, float k){
        float an = k < .5 ? 0. : (k < 1.5 ? 1.257 : -1.257), cs = cos(an), sn = sin(an);
        vec2 dx = vec2(uSunH.y, -uSunH.x) * cs - uSunH * sn, dy = vec2(-dx.y, dx.x);
        float lv = l0 + k * 37.;
        vec4 a = tDabs(p, exp2(l0), lv, dx), b = tDabs(p, exp2(l0 + 1.), lv + 1., dx), c = tDabs(p, exp2(l0 + 2.), lv + 2., dx);
        vec2 tl = c.xy * c.z * fr; float cov = c.z * fr;
        tl = mix(tl, b.xy, b.z); cov = max(cov, b.z);
        tl = mix(tl, a.xy, a.z * (1. - fr)); cov = max(cov, a.z * (1. - fr));
        return vec3(dx * tl.x + dy * tl.y, cov);
      }
      void main(){
        vec3 P = vW; vec3 v = P - cameraPosition; float D = length(v); vec3 rd = v / max(D, 1e-3);
        vec3 sw = tSwell(P.xz);
        vec2 sqo = P.xz - uSq.xy; float rough = uSq.w > 0. ? exp(-dot(sqo, sqo) / (uSq.z * uSq.z * 1.6)) : 0.;
        float hb = uCalm.z * smoothstep(uCalm.x, uCalm.y, P.z);              // sheltered water (the world says where): it lies stiller, in longer and fewer strokes
        float fp = max(length(dFdx(P.xz)), length(dFdy(P.xz))) * (uRes.y / 450.);    // metres a design pixel covers here
        float want = max(fp * 7., .3) * (1. + .7 * hb), l = log2(want), l0 = floor(l), fr = l - l0;
        vec2 ax = vec2(uSunH.y, -uSunH.x), ay = uSunH;
        // A painter lays water in strokes that lie across the sight. Three lays of dabs stand in the sea, each fixed in the water: one across the sun's
        // bearing, which is all that shows for fifty degrees to either hand of the sun (and of its opposite), and two for the water seen far off that
        // bearing. Which shows at a place is a matter of the bearing it is seen on, as with any gleam on water.
        vec2 rh = rd.xz * inversesqrt(max(dot(rd.xz, rd.xz), 1e-6));
        float pb = atan(dot(rh, ax), dot(rh, ay)); pb = pb > 1.5708 ? pb - 3.1416 : (pb < -1.5708 ? pb + 3.1416 : pb);
        float ab = abs(pb), w0 = 1. - smoothstep(.873, 1.082, ab), wE = smoothstep(1.45, 1.5708, ab) * .5, ks = pb < 0. ? 2. : 1.;
        vec3 lay = w0 > .001 ? tDabLay(P.xz, l0, fr, 0.) : vec3(0.);
        if (w0 < .999) {
          vec3 sd = tDabLay(P.xz, l0, fr, ks);
          if (wE > .001) sd = mix(sd, tDabLay(P.xz, l0, fr, 3. - ks), wE);
          lay = mix(sd, lay, w0);
        }
        float cov = lay.z * (1. - .35 * hb);                                // fewer dabs stand in still water: more of it is one glass
        // long smooth undulation under the dabs (the glassy water's own slow tilt)
        float und = tN2(P.xz * vec2(.021, .034) + uT * .02) - .5;
        vec2 slope = sw.yz + (lay.xy * mix(1. + .6 * rough, .45, hb) + ay * und * .5) * .3;   // every dab's tilt: steep where the squall breaks the water, slight where it is sheltered
        vec3 n = normalize(vec3(-slope.x, 1., -slope.y));
        vec3 r = reflect(rd, n); r.y = abs(r.y) + .015; r = normalize(r);
        float cosi = max(dot(-rd, n), 0.);
        float fres = .03 + .97 * pow(1. - cosi, 4.2);
        vec3 mir = tSkySoft(r);
        mir = mix(mir, mir * vec3(.5, .56, .68), rough * .55);              // under the squall the water is heavy: it gives back less of the sky
        // what stands in the water is mirrored in it, broken by every dab's own tilt
        float best = 1e9, chord = 0.; vec3 oc = vec3(0.);
        vec3 rj = normalize(r + vec3(ax.x, 0., ax.y) * (tN2(vec2(dot(P.xz, ax) * .35, dot(P.xz, ay) * 2.4) + 9.) - .5) * .5);   // each streak of water throws the thing a little to one hand
        for (int i = 0; i < 32; i++){
          vec4 bc = uBxC[i], bh = uBxH[i];
          vec3 o = P - bc.xyz;
          vec3 ol = vec3(o.x * bc.w - o.z * bh.w, o.y, o.x * bh.w + o.z * bc.w), dl = vec3(rj.x * bc.w - rj.z * bh.w, rj.y, rj.x * bh.w + rj.z * bc.w);
          vec3 inv = 1. / (dl + (1. - step(1e-5, abs(dl))) * 1e-5);
          vec3 t1 = (-bh.xyz - ol) * inv, t2 = (bh.xyz - ol) * inv, tmn = min(t1, t2), tmx = max(t1, t2);
          float tn = max(max(tmn.x, tmn.y), tmn.z), tf = min(min(tmx.x, tmx.y), tmx.z);
          if (bh.x > 0. && tf > max(tn, 0.) && tn < best) { best = max(tn, 0.); oc = uBxCol[i]; chord = tf - best; }
        }
        if (best < 1e8) {                                                   // soft where the sight only grazes it, and broken into streaks the further the thing stands off: no ruled edge lies on the water
          float brk = tN2(vec2(dot(P.xz, ax) * .08, dot(P.xz, ay) * .6) + 3.);
          mir = mix(mir, tAirK(oc, P + r * best, .5), .88 * smoothstep(0., 2.6, chord) * smoothstep(best / 60. - .2, best / 60. + .15, brk));
        }
        // the bearing of the sun over the water: the track
        float track = exp(-(1. - dot(rh, uSunH)) * 26.);
        // the sun's own clot in the water: thick white where a dab mirrors it
        float th = acos(clamp(dot(r, uSun), -1., 1.));
        float glint = smoothstep(.2, .03, th) * cov;
        // the water's own body: a warm dark glaze, seen where we look down into it and between the dabs; the light soaks into it under the sun
        float bn = tN2(P.xz * .06 + 7.);
        vec3 body = mix(cSea, mix(cUmber, cRed, .25), .25 + .45 * bn);
        body = mix(body, mix(cRed, cFire, .5) * .62, track * .55);
        float k = clamp(fres * (.55 + .45 * cov) + .2 * cov, 0., 1.);
        vec3 col = mix(body, mir, k);
        col = mix(col, mix(cLemon, cCore, .6), glint * .9);
        col += cCore * glint * track * .55;                                 // the hottest dabs of the track go over the top: the glow takes them
        // the water about a hull: dark under her side, a broken line of white where she meets it; the tug's wheels leave two roads of foam
        float foam = 0., sheet = 0.;
        for (int i = 0; i < 14; i++){
          vec4 ve = uVes[i], vs = uVesS[i];
          if (vs.x <= 0.) continue;
          vec2 o = P.xz - ve.xy, l = vec2(o.x * ve.z - o.y * ve.w, o.x * ve.w + o.y * ve.z);          // x to her port, y along her
          float dH = pow(pow(abs(l.x) / vs.x, 2.6) + pow(abs(l.y) / vs.y, 2.6), .3846), off = (dH - 1.) * vs.x;   // metres off her side, near enough
          col *= 1. - .34 * smoothstep(1.4 * vs.x, 0., off);
          float fn = tN2(vec2(l.x * .7, l.y * .5 + uT * .3) + float(i) * 7.);
          foam = max(foam, smoothstep(1.1, .15, off) * smoothstep(.35, .6, fn) * (vs.z > 1.5 ? .9 : .5));
          if (vs.z > 1.5 && vs.z < 2.5) {
            float aft = -1.5 - l.y;                                                                     // metres astern of her wheels
            float wn = tN2(vec2(l.x * .8, (l.y + uT * 2.6) * .3)), wn2 = tN2(vec2(l.x * 2.1, (l.y + uT * 2.6) * 1.1) + 5.);
            float wd = 1.0 + max(aft, 0.) * .03;
            float wv = (tN2(vec2(l.y * .09 + uT * .2, float(i))) - .5) * (1.2 + max(aft, 0.) * .05);                          // the roads wander as they go
            float road = (1. - smoothstep(wd * .35, wd * 1.25, abs(abs(l.x) - vs.w + max(aft, 0.) * .008 + wv))) * smoothstep(-2.5, 1.5, aft) * exp(-max(aft, 0.) / 30.) * smoothstep(.25, .6, tN2(vec2(l.x * .3, l.y * .11 + uT * .35) + 11.));
            foam = max(foam, road * smoothstep(.2, .55, wn * .6 + wn2 * .5 + road * .3));
            float mid = (1. - smoothstep(vs.w * .4, vs.w + .6 + max(aft, 0.) * .025, abs(l.x))) * smoothstep(vs.y - 4., vs.y + 3., aft + 1.5) * exp(-max(aft - vs.y, 0.) / 50.);
            col = mix(col, mix(col, mix(cDusk, cPearl, .5), .4), mid * (.3 + .7 * wn));                 // her churned water lies flat and pale astern
            float bow = vs.y - l.y, vee = abs(abs(l.x) - 1. - bow * .34);
            foam = max(foam, smoothstep(1.3, .2, vee) * smoothstep(-1., 2., bow) * exp(-max(bow, 0.) / 22.) * smoothstep(.3, .6, wn2));
          }
          if (vs.z > 3.5) {                                                                              // a boat with way on her: a wave at her bow, a short broken wake
            float bow = vs.y - l.y, wn2 = tN2(vec2(l.x * 1.6, (l.y + uT * 2.) * .9) + 5.);
            float vee = abs(abs(l.x) - .4 - bow * .42);
            foam = max(foam, smoothstep(1.5, .2, vee) * smoothstep(-1.5, 1., bow) * exp(-max(bow, 0.) / (vs.y * 1.3)) * smoothstep(.3, .6, wn2));
            float aft = -vs.y - l.y;
            foam = max(foam, (1. - smoothstep(vs.x * .3, vs.x * 1.2 + max(aft, 0.) * .08, abs(l.x))) * smoothstep(-1., 2., aft) * exp(-max(aft, 0.) / (vs.y * 2.2)) * smoothstep(.42, .7, wn2));
          }
        }
        // where the squall has got the sea up, the crests break
        if (rough > .02) {
          float crest = sw.x / max(tSwellAmp(P.xz) * 1.85, .01) * .5 + .5;
          float cn = tN2(P.xz * vec2(.09, .16) + vec2(uT * .11, uT * .07)), cn2 = tN2(P.xz * .55 + uT * .2);
          float lace = tN2(vec2(dot(P.xz, vec2(-.94, .34)) * .05, dot(P.xz, vec2(.34, .94)) * .42 + uT * .25));          // foam lies in lines along the crests
          float cf = rough * smoothstep(.6, .86, crest * .72 + cn * .45) * smoothstep(.4, .66, lace) * smoothstep(.2, .55, cn2 + cov * .4);
          foam = max(foam, cf); sheet = smoothstep(.45, .9, cf) * smoothstep(.3, .62, tN2(P.xz * vec2(.9, 1.7) + uT * .3 + 2.)) * .8;   // where a crest breaks hard its white runs together, torn; at its fringes it stays single dabs
        }
        vec3 fc = mix(mix(cDusk, cPearl, .7), mix(cPearl, cCore, .5), .45 + .55 * track);
        col = mix(col, fc, clamp(foam, 0., 1.) * mix(.06 + .94 * cov, 1., sheet));
        // a dry drag of the brush across the dabs: bristle streaks along the crests
        float br = tN2(vec2(dot(P.xz, ax) * .5, dot(P.xz, ay) * 5.) / max(want * 1.6, .3));
        col *= .93 + .14 * br;
        col = tAirK(col, P, .62);                                            // the water is lost in the squall's vapour, but not at once
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = -90; m.name = 'sea';
  return m;
}

// ---- drawn solids: one material for every hull, spar and stone, shaded by the one law above -------------------------------
// aM.x is the kind of surface: 0 plain paint, 1 a three-decker's side (wales and gun ports by aM.yz = metres along, metres up),
// 2 her stern (lit windows, aM.yz = 0..1 across and up), 3 fire (the funnel's lip, a lamp: written over 1 for the glow pass),
// 4 canvas (takes the light through it; aM.z over 0: a working sail, 0..1 up it), 5 a paddle box's face (a fan of slats about
// aM.yz = 0), 6 stone in courses, 7 a house front, 8 a tower's shaft, 9 a belfry, 10 the lighthouse, 11 the ring of an arch,
// 12 a planked side, 13 a roof in courses of tile.
export function solidMaterial(U, extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uGlow: { value: 1 }, ...extra }, side: THREE.DoubleSide, vertexColors: true,
    vertexShader: /* glsl */`attribute vec4 aM; varying vec3 vW, vN, vC, vO; varying vec4 vM; uniform float uT;
      void main(){
        vec3 p = position;
        if (aM.x > 3.5 && aM.x < 4.5) { float ph = aM.y * 1.25 - uT * 3.4; p += normal * (sin(ph) + .45 * sin(ph * 2.3 + 1.7 + uT * .6)) * aM.w; p.y += cos(ph * .7) * aM.w * .35; }   // cloth in the wind
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; vC = color; vM = aM; vO = position; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`varying vec3 vW, vN, vC, vO; varying vec4 vM; uniform float uGlow;
      ${TURNER_GLSL}
      float box1(float x, float c, float h, float e){ return smoothstep(h + e, h - e, abs(x - c)); }
      void main(){
        vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.);
        vec3 v = vW - cameraPosition; float D = length(v); vec3 rd = v / max(D, 1e-3);
        vec3 alb = vC; float kind = vM.x, fire = 0., water = 0., glowUp = 0.;
        float br = tFbm2(vec2(vO.x + vO.z, vO.y * 1.7) * .3), br2 = tN2(vec2((vO.z + vO.x) * .33, vO.y * 1.7) + 3.);
        float e = max(fwidth(vM.y), 1e-3);
        if (kind > .5 && kind < 1.5) {                                      // the side of a ship of the line: tarred dark, a pale band along each gun deck, her ports shut
          float up = vM.z, al = vM.y, ports = 0., band = 0., lamp = 0., run = 0., tone = 0.;
          float wob = tN2(vec2(al * .4, up * .8)) - .5;                     // nothing on her is ruled
          for (int i = 0; i < 3; i++){
            float y0 = 2.5 + float(i) * 2.25 + wob * .2; band += box1(up, y0, .62, .2);
            float pn = al / 3.05 + .17 * float(i), cx = (fract(pn) - .5) * 3.05, pid = floor(pn), dn = y0 - .43 - up;
            vec2 ph = tHash2(vec2(pid + 1., float(i) + 2.));
            float pt = smoothstep(1.24, .8, max(abs(cx) / (.44 + .06 * ph.x), abs(up - y0) / (.4 + .06 * ph.y)) + wob * .7);
            ports += pt; tone += pt * (.72 + .5 * ph.y); lamp += pt * step(.86, tHash(vec2(pid, float(i) + 9.))) * (.4 + .6 * tHash(vec2(pid + 5., float(i))));   // a lamp burning behind a port here and there
            run += smoothstep(.62, .15, abs(cx)) * smoothstep(0., .12, dn) * smoothstep(1.15, .1, dn);                               // the weather run down from each sill
          }
          ports = clamp(ports, 0., 1.); band = clamp(band, 0., 1.);
          vec3 tar = mix(cUmber * 1.55, cSlate * .55, .22), paint = alb * vec3(.97, .86, .62);
          paint *= .8 + .34 * tN2(vec2(al * .09, up * 3.1) + 3.);            // old paint, gone thin in long patches
          alb = mix(tar, paint, band * (.82 + .18 * smoothstep(.2, .6, tN2(vec2(al * .5, up * 1.4) + 11.))));
          alb *= 1. - .24 * clamp(run, 0., 1.);
          alb = mix(alb, tar * clamp(tone, .6, 1.3), ports * .88);            // each lid a dab of dark, no two alike
          alb = mix(alb, cGold * .55, box1(up, 8.45 + wob * .1, .07, .05) * .6);   // a worn gilt moulding along her bulwark
          alb *= .86 + .28 * tN2(vec2(al * .07, up * 4.6));                  // planking, long ways
          alb = mix(alb, vec3(.3, .34, .28), smoothstep(1.5, .9, up + wob * .5) * .8);                        // her copper, green and dark at the water
          alb *= 1. - .3 * smoothstep(1.2, .0, up);                         // wet at the water
          alb = mix(alb, cUmber * 1.5, smoothstep(.55, .38, vM.w) * .75);   // the black rail and the hammock nettings along her top
          fire += lamp * .62;
          water = smoothstep(7., .6, up) * .75;                             // the water's light plays along her lower side
        } else if (kind > 1.5 && kind < 2.5) {                              // the stern: three tiers of windows, lamps behind some
          for (int i = 0; i < 3; i++){
            float y0 = .3 + float(i) * .22, wx = vM.y * (7. - float(i)), fx = fract(wx) - .5, fy = (vM.z - y0) / .068;
            float win = smoothstep(.43, .36, abs(fx)) * smoothstep(1., .84, abs(fy)) * step(.04, vM.y) * step(vM.y, .96);
            float gb = max(smoothstep(.12, .05, abs(fract(fx * 3. + .5) - .5)), smoothstep(.16, .07, abs(fract(fy * 1.5 + .5) - .5)));
            fire += win * (1. - .55 * gb) * (.3 + .7 * tHash(vec2(floor(wx), float(i) + 3.)));
            alb = mix(alb, cGold * .8, smoothstep(.016, .006, abs(vM.z - y0 + .1)) * .7);    // a gilt moulding under each tier
          }
          fire = clamp(fire, 0., 1.);
          alb = alb * vec3(.92, .8, .55) * (.9 + .2 * br2);
        } else if (kind > 4.5 && kind < 5.5) {                              // a paddle box: a fan of slats
          float r = length(vM.yz), a = atan(vM.z, abs(vM.y) + abs(vM.z) < 1e-4 ? 1e-4 : vM.y);
          float slat = smoothstep(.25, .45, abs(fract(a * 3.2) - .5)) * smoothstep(.22, .3, r) * smoothstep(1., .9, r);
          alb = mix(alb, alb * 2.6 + cRed * .2, slat * .5);
        } else if (kind > 3.5 && kind < 4.5) {                              // canvas: cloths sewn side by side, no two weathered alike
          float sw2 = tN2(vec2(vM.y * 3.1, vO.y * .23) + 2.) - .5, cl = vM.y + sw2 * .07, nearC = smoothstep(.45, .1, fwidth(vM.y));
          alb *= .9 + .18 * tHash(vec2(floor(cl), 7.));
          alb *= 1. - .13 * smoothstep(.42, .48, abs(fract(cl) - .5)) * nearC;                 // the seams: none ruled, lost with distance
          alb *= .8 + .4 * tFbm2(vec2(vM.y * .23, vO.y * .11) + 5.);                         // the cloth's own lights and stains, broad
          vec2 pq = vec2(cl * .5, vO.y * .31 + tHash(vec2(floor(cl * .5), 3.)) * 5.), pf = abs(fract(pq) - .5);   // a patch let in here and there, newer or older than the cloth about it
          alb *= 1. + (tHash(floor(pq) + 21.) - .45) * .26 * step(.84, tHash(floor(pq) + 5.)) * (1. - smoothstep(.34, .4, max(pf.x, pf.y))) * nearC;
          if (vM.z > .001) {                                                // a working sail: two reef bands across it, their points hanging; its head and foot roped
            for (int i = 0; i < 2; i++) {
              float rb = vM.z - (.3 + .17 * float(i)) + sw2 * .012;
              alb *= 1. - .12 * (1. - smoothstep(.006, .02, abs(rb)));
              alb *= 1. - .15 * nearC * (1. - smoothstep(.04, .1, abs(fract(cl) - .5))) * (1. - smoothstep(-.008, 0., rb)) * smoothstep(-.05, -.035, rb);
            }
            alb *= 1. - .3 * smoothstep(.9, 1., abs(vM.z * 2. - 1.));
          }
        } else if (kind > 6.5 && kind < 7.5) {                              // a house front: an arcade at its foot, rows of windows, a cornice; a lamp lit here and there
          float al = vM.y, up = vM.z, H = vM.w, wob = tN2(vec2(al * .3, up * .5)) - .5, bay = 3.4, ax = (fract(al / bay) - .5) * bay;
          float arch = up < 3. ? abs(ax) : length(vec2(ax, up - 3.));
          float dark = smoothstep(1.3, 1., arch + wob * .3) * step(up, 4.4) * step(.4, up);
          float row = floor((up - 5.6) / 3.5), fy = up - 5.6 - row * 3.5 - 1.5;
          float win = smoothstep(1.15, .8, max(abs(ax) / .55, abs(fy) / 1.05) + wob * .45) * step(5.6, up) * step(up, H - 1.);
          fire = win * step(.86, tHash(vec2(floor(al / bay) + 7., row + 3.))) * .7;
          alb = mix(alb, cUmber * 1.6, max(dark, win) * .85);
          alb *= 1. + .14 * (smoothstep(.2, .08, abs(up - 5.)) + smoothstep(.34, .14, abs(up - (H - .4))));
          alb *= .88 + .24 * tN2(vec2(al * .12, up * .6));
          glowUp = .5 * (1. - smoothstep(-2., 16., up));
        } else if (kind > 7.5 && kind < 8.5) {                              // a tower's shaft: slits one over another
          float fy = fract(vM.z / 7.) * 7. - 3.5;
          alb = mix(alb, cUmber * 1.6, smoothstep(1.2, .8, max(abs(vM.y) / .38, abs(fy) / 1.15)) * step(4., vM.z) * .85);
          alb *= .88 + .24 * tN2(vec2(vM.y * .3, vM.z * .5));
          float rowT = floor(vM.z * .8), stT = tHash(vec2(floor(vM.y / 1.7 + rowT * .5), rowT + 31.));        // stone in courses, quietly
          alb *= (1. - .14 * smoothstep(.06, .0, abs(fract(vM.z * .8) - .5) - .44)) * (.9 + .2 * stT);
        } else if (kind > 8.5 && kind < 9.5) {                              // a belfry: two open arches a side
          float ax = (abs(vM.y) - vM.w * .46) / (vM.w * .27), ay = (vM.z - .6) / .22;
          float open = vM.z < .6 ? abs(ax) : length(vec2(ax, ay));
          alb = mix(alb, cUmber * 1.4, smoothstep(1.1, .9, open) * step(.14, vM.z) * .88);
        } else if (kind > 9.5 && kind < 10.5) {                             // the lighthouse: whitewashed stone, slits toward the harbour, a red band under its gallery, the weather run down it
          float qc = (vM.y - 10.4) / 5.184 + .5, qi = mod(floor(qc), 4.), qx = (fract(qc) - .5) * 5.184, zs = vM.z + qi;   // slits on four sides, each side's a little lower than the last: they go round with the stair
          float wy = min(min(abs(zs - 15.), abs(zs - 21.)), abs(zs - 27.));
          float slit = smoothstep(1.2, .8, max(abs(qx) / .35, wy / .9));
          alb *= 1. + .12 * smoothstep(1.9, 1.3, max(abs(qx) / .35, wy / .9)) * (1. - slit);          // each in a dressed surround, paler than the wash
          alb = mix(alb, cUmber * 1.6, slit * .85);
          alb *= 1. - .1 * smoothstep(.07, .0, abs(fract(vM.z / 1.3) - .5) - .43) * smoothstep(.6, .15, fwidth(vM.z));   // courses, faint under the wash
          alb = mix(alb, alb * vec3(.66, .3, .24), box1(vM.z, 31.5, .95, .12) * .85);
          alb = mix(alb, alb * vec3(.8, .78, .74), smoothstep(14., 9.4, vM.z) * .6);
          alb *= 1. - .2 * smoothstep(.5, .75, tN2(vec2(vM.y * .9, vM.z * .06) + 5.)) * smoothstep(12., 30., vM.z);
          alb *= .92 + .16 * tN2(vec2(vM.y * .25, vM.z * .9));
        } else if (kind > 5.5 && kind < 6.5) {                              // stone in courses
          float rowS = floor(vM.z * .8), sx = vM.y / 1.7 + rowS * .5 + (tHash(vec2(rowS, 9.)) - .5) * .3, fz = fract(vM.z * .8), fx = fract(sx);
          float st = tHash(vec2(floor(sx), rowS)), st2 = tHash(vec2(floor(sx) + 7., rowS + 3.));
          float wz = fwidth(vM.z) * .8, jw = max(wz, .035), jx = max(fwidth(vM.y) / 1.7, .022), far = smoothstep(.5, .1, wz);
          float joint = max(smoothstep(jw * 1.7, jw * .4, min(fz, 1. - fz)), .8 * smoothstep(jx * 1.7, jx * .4, min(fx, 1. - fx)));   // bed joints and perpends
          alb *= (1. - .25 * joint * far) * (.86 + .26 * st); alb = mix(alb, alb * vec3(1.07, .97, .87), st2 * .7);                       // each stone its own tone, some warmer
          alb *= 1. - .2 * step(.88, st2) + .14 * step(st2, .1);                                      // one here and there much darker, or new and pale: the wall is told by its blocks, not by ruled joints
          alb *= .9 + .2 * tN2(vec2(vM.y * .13, vM.z * .21) + 11.);                                   // and broad lights and stains lie over whole runs of it
          alb *= 1. + .09 * smoothstep(.72, .93, fz) * far;                                           // the light catches each stone's upper edge
          alb *= .93 + .14 * tN2(vec2(vM.y * 2.3, vM.z * 2.9));                                       // the mason's tooling
          alb *= 1. - .15 * smoothstep(.5, .78, tN2(vec2(vM.y * .7, vM.z * .09) + 3.));               // the weather run down it
          alb *= .9 + .16 * smoothstep(1., 9., vM.z);                                                 // the sky's light finds the upper courses
          float tide = 1.45 + .4 * (tN2(vec2(vM.y * .31, 3.)) - .5);                                  // the tide's mark: weed and wet below it, a pale line of salt above
          alb = mix(alb, vec3(.19, .22, .16), (1. - smoothstep(tide - .4, tide + .2, vM.z)) * .62);
          alb *= 1. + .13 * (1. - smoothstep(.0, .3, abs(vM.z - tide - .42)));
          float rgx = (fract(vM.y / 9. + .37) - .5) * 9.;                                             // an iron ring every few fathoms, its rust run down the wall
          alb = mix(alb, alb * vec3(.84, .58, .42), (1. - smoothstep(.1, .55, abs(rgx))) * (1. - smoothstep(3., 3.2, vM.z)) * smoothstep(.6, 2.8, vM.z) * .5);
          alb = mix(alb, cUmber * 1.3, (1. - smoothstep(.05, .1, abs(length(vec2(rgx, vM.z - 3.25)) - .2))) * .85 * (1. - smoothstep(.04, .2, fwidth(vM.z))));
          water = smoothstep(7.5, .3, vM.z); glowUp = 1. - smoothstep(1., 17., vM.z);
        } else if (kind > 11.5 && kind < 12.5) {                            // a planked side (aM: metres along, metres up): strakes, wet at the water, the water's light on her
          alb *= .82 + .36 * tN2(vec2(vM.y * .13, vM.z * 3.6)); alb *= 1. - .35 * smoothstep(.8, .0, vM.z);
          float sk = vM.z / .3, nearH = 1. - smoothstep(.06, .3, fwidth(vM.z));                          // close to, each strake shows: a seam under it, a butt here and there, its own tone
          float seam = smoothstep(.36, .5, abs(fract(sk) - .5)), butt = smoothstep(.46, .5, abs(fract(vM.y / 2.6 + tHash(vec2(floor(sk), 5.)) * 7.) - .5));
          alb *= 1. - nearH * (.24 * seam + .16 * butt * (1. - seam) + .14 * (tHash(vec2(floor(sk), 3.)) - .5));
          alb *= 1. - .22 * smoothstep(.55, .8, tN2(vec2(vM.y * .8, vM.z * .12) + 7.)) * smoothstep(-.2, 1.2, vM.z);   // tar and weather run down her
          water = smoothstep(4.2, .1, vM.z) * .9;
        } else if (kind > 12.5 && kind < 13.5) {                            // a roof: courses of tile (aM: metres along the eave, metres up the slope)
          float rowR = floor(vM.z / .55), tl = tHash(vec2(floor(vM.y / .42 + rowR * .5), rowR + 3.)), near = smoothstep(.7, .2, fwidth(vM.z));
          alb *= 1. - near * (.2 * smoothstep(.14, .0, fract(vM.z / .55)) + .28 * (tl - .5));
          alb *= .88 + .24 * tN2(vec2(vM.y * .07, vM.z * .25) + 2.);       // moss and weather in broad patches
        } else if (kind > 10.5 && kind < 11.5) {                            // the ring of an arch: wedge stones, a joint between each (aM: arc metres, metres across the ring, height)
          float jn = smoothstep(.07, .0, abs(fract(vM.y / 1.15) - .5) - .43), st = tHash(vec2(floor(vM.y / 1.15), 5.));
          alb *= (1. - .28 * jn) * (.88 + .24 * st); alb = mix(alb, alb * vec3(1.08, .97, .86), st);
          alb *= 1. - .3 * smoothstep(1.6, .0, vM.w);
          water = smoothstep(6.5, .3, vM.w); glowUp = 1. - smoothstep(1., 17., vM.w);
        }
        alb *= .88 + .24 * br;                                              // the brush is in everything
        // ... and it is laid in strokes: a few pixels broad at any distance, lying along the form, each with its own weight of colour and of light
        vec2 sc = kind > .5 && kind < 1.5 ? vM.yz : (abs(n.y) > .75 ? vO.xz : vec2(dot(vO.xz, normalize(vec2(-n.z, n.x) + 1e-5)), vO.y));
        float fpx = max(length(dFdx(sc)), length(dFdy(sc))) * (uRes.y / 450.);
        float lq = log2(clamp(fpx * 5., .03, 40.)), l0 = floor(lq), fq = lq - l0, c0 = exp2(l0);
        vec2 sw = sc + (vec2(tN2(sc / c0 * .31), tN2(sc / c0 * .31 + 17.)) - .5) * c0 * 1.5;       // no stroke has a ruled edge
        float k1 = step(.5, kind) * step(kind, 1.5), k4 = step(3.5, kind) * step(kind, 4.5);   // a ship's side: its strokes run long, as planking does; canvas takes the brush softly
        vec2 qa = sw / (c0 * vec2(3.2 + 6.5 * k1, 1.)), qb = sw / (c0 * vec2(6.4 + 13. * k1, 2.));
        qa.x += tHash(vec2(floor(qa.y), 1.)) * 7.3; qb.x += tHash(vec2(floor(qb.y), 2.)) * 7.3;
        float dice = mix(tHash(floor(qa) + 3.), tHash(floor(qb) + 11.), fq);
        if (k4 > .5) dice = mix(tN2(qa * vec2(.3, .45) + 7.), tN2(qb * vec2(.3, .45) + 19.), fq);   // on cloth the brush is dragged soft and long: never tiles of paint
        float km = step(5.5, kind) * step(kind, 11.5);                         // masonry: a wall is a great plain thing, and the brush must be seen in it
        alb *= .89 - .04 * km + (.22 - .09 * k1 - .08 * k4 + .09 * km) * dice; alb = mix(alb * vec3(.96, .99, 1.05), alb * vec3(1.08, .99, .88), dice);
        // ... and over them broad dabs of loaded paint, as on the sky and the water: each of ONE tone, its edges the bristle's (on cloth they run down the drape)
        vec2 dq = (k4 > .5 ? sw.yx : sw) / c0, dpc;
        vec4 d1 = tCell(dq / vec2(7.5, 2.3), 31., dpc), d2 = tCell(dq / vec2(15., 4.6) + 3.7, 37., dpc);
        float dm = mix(d1.z, d2.z, fq), dw = mix(step(.5, d1.w), step(.5, d2.w), fq);
        alb = mix(alb, alb * mix(vec3(.86 - .1 * km, .9 - .08 * km, 1. - .02 * km), vec3(1.12 + .09 * km, 1.04 + .04 * km, .92 - .04 * km), dw), dm * (.85 - .35 * k1 - .45 * k4 + .1 * km));
        // a sail's edge is the brush's, not a ruled line: the bristle breaks it (the grid's outermost cells carry how far in we are)
        if (k4 > .5 && kind > 4.02) {
          float ed = (4.4 - kind) * 2.5, epx = ed / max(fwidth(ed), 1e-5) * (450. / uRes.y);
          float hr = mix(tN2(sw / c0 * vec2(1.6, .2) + 3.), tN2(sw / c0 * vec2(.8, .1) + 9.), fq);
          if (epx < 3.4 * hr - .5) discard;
        }
        // the form turns from the light to the shade, the turn dragged by the brush
        float nl = dot(n, uSun);
        float lit = smoothstep(-.18, .5, nl + (br2 - .5) * .16 + (dice - .5) * .24 * (1. - .7 * k1) * (1. - .7 * k4) + (dw - .5) * dm * .22);
        vec3 lightC = mix(cGold, mix(cLemon, cCore, .55), .7) * 1.04, shadeC = mix(cSlate, cDusk, .55) * .92 + cRed * .1;   // a low sun's light is gold
        shadeC += cGold * .22 * smoothstep(.2, -.8, n.y);                   // the water's gold comes up under things
        vec3 col = alb * mix(shadeC, lightC, lit);
        col += alb * mix(cFire, cGold, .55) * glowUp * (1. - lit) * .26;    // the molten water's light comes up the stone that stands in it
        if (water > 0.) {                                                   // the water's light plays on stone that stands in it
          float r1 = tN2(vec2(vM.y * .3 + uT * .2, vM.z * 2.6 - uT * .55)), r2 = tN2(vec2(vM.y * .21 - uT * .17, vM.z * 1.9 + uT * .2) + 9.);   // long ripples of light, climbing
          col += alb * mix(cGold, cLemon, .5) * smoothstep(.34, .7, r1 * r2 * 2.) * water * water * (1. - .75 * lit) * .34;
        }
        if (kind > 3.5 && kind < 4.5) {                                     // canvas: the low sun comes through it
          float thru = smoothstep(.0, .9, dot(rd, uSun)) * (1. - lit) * (.5 + .5 * smoothstep(.1, .8, abs(nl)));
          col = mix(col, alb * mix(cGold, cLemon, .4) * 1.02, thru * .66);
        }
        // against the light a form is eaten at its edges
        float rim = pow(1. - clamp(dot(n, -rd), 0., 1.), 3.) * smoothstep(.35, .98, dot(rd, uSun));
        col = mix(col, mix(cGold, cLemon, .6), rim * .65 * clamp(dot(alb, vec3(.3, .5, .2)) * 2.2, 0., 1.));   // soot takes no sheen
        col = mix(col, mix(cGold, cLemon, .35) * 1.3, fire * .88);
        col = tAirK(col, vW, .38 * (1. - .75 * smoothstep(.93, .999, dot(rd, uSun))));   // a form standing right against the sun keeps its dark: the vapour before it is thin beside that light
        if (kind > 2.5 && kind < 3.5) { vec3 fc = mix(cFire, cLemon, vM.y) * (1. + 2.4 * vM.z * uGlow); col = mix(fc, tAirK(fc, vW, .5), .65); }   // fire: over the top, for the glow; the air takes only some of it
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// A small mesher: grids, tubes and boxes into one geometry (position, colour, aM), normals from the faces.
export class Mesher {
  constructor() { this.pos = []; this.col = []; this.aux = []; this.idx = []; this.n = 0; }
  vert(p, c, a) { this.pos.push(p[0], p[1], p[2]); this.col.push(c.r, c.g, c.b); this.aux.push(a ? a[0] : 0, a ? a[1] : 0, a ? a[2] : 0, a ? a[3] || 0 : 0); return this.n++; }
  // f(u, v) gives { p, c, a } for u, v in 0..1; nu by nv cells
  grid(nu, nv, f) {
    const b = this.n;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const o = f(i / nu, j / nv); this.vert(o.p, o.c, o.a); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * (nu + 1) + i, c = a + nu + 1; this.idx.push(a, a + 1, c, a + 1, c + 1, c); }
  }
  // a round spar from A to B with radii ra, rb
  tube(A, B, ra, rb, c, sides = 7, a = null, c2 = null) {
    const ax = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]), len = ax.length() || 1; ax.multiplyScalar(1 / len);
    const s = new THREE.Vector3(0, 1, 0); if (Math.abs(ax.y) > 0.9) s.set(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(ax, s).normalize(), w = new THREE.Vector3().crossVectors(ax, u);
    this.grid(sides, 1, (i, j) => { const an = i * Math.PI * 2, r = j ? rb : ra, P = j ? B : A, cx = Math.cos(an) * r, cy = Math.sin(an) * r; return { p: [P[0] + u.x * cx + w.x * cy, P[1] + u.y * cx + w.y * cy, P[2] + u.z * cx + w.z * cy], c: j && c2 ? c2 : c, a }; });
  }
  // a box: centre, half sizes, yaw; six faces of their own (hard edges)
  box(C, H, yaw, c, a = null, taper = 1) {
    const cs = Math.cos(yaw), sn = Math.sin(yaw), P = (x, y, z) => { const k = y > 0 ? taper : 1; x *= k; z *= k; return [C[0] + x * cs + z * sn, C[1] + y, C[2] - x * sn + z * cs]; };
    const F = [[[-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]], [[1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]], [[1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1]], [[-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1]], [[-1, 1, 1], [1, 1, 1], [-1, 1, -1], [1, 1, -1]], [[-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1]]];
    for (const f of F) { const b = this.n; for (const q of f) this.vert(P(q[0] * H[0], q[1] * H[1], q[2] * H[2]), c, a); this.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  quad(P0, P1, P2, P3, c, A0 = null, A1 = null, A2 = null, A3 = null) { const b = this.n; this.vert(P0, c, A0); this.vert(P1, c, A1 || A0); this.vert(P2, c, A2 || A0); this.vert(P3, c, A3 || A0); this.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(this.aux, 4)); g.setIndex(this.idx); g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
}

// ---- thin lines (rigging, a hawser, a rocket's trail): ribbons turned to the eye about their own run, never under a pixel and a third ----
export function lineMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 aDir; attribute vec4 aL; attribute vec3 aCol; varying vec3 vW, vC; varying float vA, vPx, vH;
      uniform vec2 uRes;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.); vec3 dir = normalize(mat3(modelMatrix) * aDir);
        vec3 toC = cameraPosition - w.xyz; float dist = max(length(toC), .05);
        vec3 side = cross(dir, toC / dist); float sl = length(side); side = sl > 1e-4 ? side / sl : vec3(1., 0., 0.);
        float pxm = projectionMatrix[1][1] * uRes.y * .5 / dist;              // pixels a metre covers here
        float wd = aL.y, wpx = wd * pxm, k = max(wpx, 1.35);                   // a hairline never thins under a pixel and a third: it pales instead
        w.xyz += side * aL.x * .5 * k / pxm;
        vA = aL.z * clamp(wpx / 1.35, .0, 1.); vW = w.xyz; vC = aCol; vPx = wpx; vH = aL.w;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`varying vec3 vW, vC; varying float vA, vPx, vH;
      ${TURNER_GLSL}
      void main(){
        vec3 v = vW - cameraPosition; vec3 rd = normalize(v);
        vec3 col = vC * mix(mix(cSlate, cDusk, .5) * .95, mix(cLemon, cCore, .5), .5);
        col = mix(col, mix(cGold, cLemon, .6), smoothstep(.5, .98, dot(rd, uSun)) * .6 * smoothstep(4., 1.5, vPx) * (1. - vH));   // against the sun a far rope is a thread of light
        col = tAirK(col, vW, .5);
        gl_FragColor = vec4(col, vA);
      }`,
  });
}
export class Liner {
  constructor() { this.pos = []; this.dir = []; this.l = []; this.col = []; this.idx = []; this.n = 0; }
  // a run of points; w metres wide; alpha
  line(pts, w, c, alpha = 1, heavy = 0) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      for (const sd of [-1, 1]) { this.pos.push(pts[i][0], pts[i][1], pts[i][2]); this.dir.push(d[0], d[1], d[2]); this.l.push(sd, w, alpha, heavy); this.col.push(c.r, c.g, c.b); }
      if (i) { const k = this.n + (i - 1) * 2; this.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    this.n += pts.length * 2;
  }
  // a hanging rope between two points: sag metres at the middle
  rope(A, B, sag, w, c, alpha = 1, n = 8) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - sag * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t]); } this.line(pts, w, c, alpha); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(this.dir, 3));
    g.setAttribute('aL', new THREE.Float32BufferAttribute(this.l, 4)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 3)); g.setIndex(this.idx); g.computeBoundingSphere();
    return g;
  }
}

// ---- the old three-decker: tarred black, a band of pale yellow along each gun deck, her port lids shut (the solid shader paints her side) ----
// Her own frame: z forward (the stem near +29), x to port, y up from the water; metres. Written into a Mesher (solids) and a
// Liner (rigging); returns the places the world needs of her.
const C3 = (h) => new THREE.Color(h);
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export function drawShip(M, Ln, rng) {
  const hullC = C3('#F1E8D2'), mastC = C3('#E9DAB6'), yardC = C3('#C9B995'), sailC = C3('#F6F0DF'), deckC = C3('#B9A784'), ironC = C3('#3A3430'),
    giltC = C3('#E9B95C'), sternC = C3('#E7D8B2'), ropeC = C3('#4A3D31'), flagC = C3('#F4EEDF'), tarC = C3('#3B2F28');
  const railAt = (u) => 9.2 + 1.3 * sm(0.44, 0.40, u) + 1.9 * sm(0.2, 0.16, u) + 0.9 * sm(0.78, 0.82, u);
  const zStern = (y) => -29 - 0.16 * Math.max(0, y - 3) + (y < 4.6 ? 0.12 * (4.6 - y) * (4.6 - y) : 0), zStem = (y) => 29 + 0.06 * y;   // the counter tucks under
  const halfAt = (u, y) => {
    const R = railAt(u), run = 0.74 + 0.26 * sm(0, 0.3, u);
    const p = 2.0 + 1.2 * Math.max(0, y) / R, bow = u < 0.76 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.76) / 0.24, p)), 0.55);
    const w = y < 2.2 ? 0.9 + 0.1 * sm(-1.5, 2.2, y) : 1 - 0.17 * Math.pow((y - 2.2) / (R - 2.2), 1.3);
    return 7.8 * run * bow * w;
  };
  const zAt = (u, y) => zStern(y) + u * (zStem(y) - zStern(y));
  const uOfZ = (z, y) => (z - zStern(y)) / (zStem(y) - zStern(y));
  const sideX = (z, y) => halfAt(uOfZ(z, y), y);
  // the two sides: a wall of planking with three gun decks
  for (const s of [1, -1]) M.grid(56, 12, (u, t) => { const R = railAt(u), y = -1.5 + t * (R + 1.5); return { p: [s * halfAt(u, y), y, zAt(u, y)], c: hullC, a: [1, zAt(u, y) + 30, y, R - y] }; });
  // the stern: a raked wall arched at its top, three tiers of windows with lamps behind them, a walk under each of the upper two
  const R0 = railAt(0), sternTop = R0 + 0.9, stTop = (a) => sternTop + 0.9 * Math.cos((a - 0.5) * Math.PI);
  M.grid(12, 12, (a, t) => { const y = 0.4 + t * (stTop(a) - 0.4), hb = halfAt(0, Math.min(y, R0)); return { p: [(a * 2 - 1) * hb, y, zStern(y) - 0.02], c: sternC, a: [2, a, (y - 3.0) / (sternTop - 3.0), 0] }; });
  for (const y of [7.42, 9.68]) { const hb = halfAt(0, y) + 0.25, z = zStern(y); M.box([0, y, z - 0.5], [hb, 0.08, 0.55], 0, sternC); M.box([0, y + 0.42, z - 1.02], [hb, 0.4, 0.04], 0, yardC); }
  // the quarter galleries: a glazed bulge on either quarter
  for (const s of [1, -1]) M.grid(5, 6, (tz, ty) => { const y = 4.7 + ty * 6.9, z = zStern(y) + tz * 6.4, b = 0.95 * (1 - Math.pow(tz, 2.5)) * Math.pow(Math.sin(Math.PI * ty), 0.5); return { p: [s * (sideX(Math.max(z, zStern(y)), y) + b), y, z], c: sternC, a: [2, tz, (y - 3.0) / (sternTop - 3.0), 0] }; });
  // the taffrail's three lanterns
  for (const lx of [-3.3, 0, 3.3]) { const y = sternTop + 1.1 + (lx === 0 ? 1.1 : 0.25), z = zStern(sternTop) - 0.55; M.tube([lx, sternTop - 0.2, z + 0.3], [lx, y - 0.34, z], 0.06, 0.06, ironC, 5); M.box([lx, y, z], [0.2, 0.32, 0.2], 0, giltC, [3, 0.45, 0.22, 0], 0.72); }
  M.box([0, 1.2, zStern(1.2) - 0.55], [0.2, 2.8, 0.62], 0, deckC);                                       // the rudder
  // the deck (seen only from aloft)
  M.grid(40, 2, (u, a) => { const R = railAt(u) - 1.3; return { p: [(a * 2 - 1) * (halfAt(u, R) - 0.2), R, zAt(u, R)], c: deckC }; });
  // the head: the knee under the bowsprit, its rails, the figure
  const kz = (y) => { const t = (y + 1.5) / 11.9; return zStem(y) + 0.2 + 6.0 * Math.pow(t, 1.5) * (1 - 0.25 * sm(0.8, 1, t)); };
  M.grid(1, 9, (i, t) => { const y = -1.5 + t * 11.9; return { p: [0, y, i ? kz(y) : zStem(y) - 0.3], c: C3(t > 0.72 ? '#B9925A' : '#6B5844') }; });   // the knee of the head: tarred timber, gilt toward the figure
  M.tube([0, 8.7, 34.0], [0, 11.2, 35.5], 0.5, 0.32, giltC, 6); M.box([0, 11.55, 35.7], [0.3, 0.34, 0.3], 0, giltC);
  for (const s of [1, -1]) {
    M.tube([s * 4.3, 9.7, 27.5], [s * 2.5, 9.0, 31.4], 0.13, 0.11, hullC, 5); M.tube([s * 2.5, 9.0, 31.4], [s * 0.2, 9.5, 34.6], 0.11, 0.09, hullC, 5);
    M.tube([s * 4.9, 7.3, 27.2], [s * 1.9, 7.6, 31.2], 0.13, 0.11, hullC, 5); M.tube([s * 1.9, 7.6, 31.2], [s * 0.2, 8.5, 34.2], 0.11, 0.09, hullC, 5);
    // the cathead and the anchor hung under it
    M.tube([s * 5.2, 10.7, 24.3], [s * 8.5, 11.0, 26.6], 0.3, 0.26, tarC, 5);
  }
  // the bowsprit and its jib-boom, the dolphin striker under the cap
  M.tube([0, 10.6, 27.2], [0, 17.5, 42.5], 0.55, 0.4, mastC, 8); M.tube([0, 16.7, 40.4], [0, 21.4, 53.6], 0.25, 0.14, mastC, 6);
  M.box([0, 17.45, 42.4], [0.34, 0.5, 0.22], 0, mastC); M.tube([0, 17.2, 42.5], [0, 12.7, 43.2], 0.11, 0.08, mastC, 5);
  Ln.line([[0, 17.0, 41.8], [0, 2.6, 30.4]], 0.1, ropeC, 0.9); Ln.line([[0, 15.4, 38.2], [0, 4.4, 31.2]], 0.1, ropeC, 0.9);                    // bobstays
  Ln.line([[0, 21.3, 53.4], [0, 12.8, 43.2], [0, 8.2, 30.9]], 0.06, ropeC, 0.85);                                                             // martingale
  for (const s of [1, -1]) Ln.line([[0, 17.3, 42.3], [s * 5.4, 10.4, 26.0]], 0.07, ropeC, 0.8);                                               // bowsprit shrouds
  // the masts
  const masts = [{ z: 17, top: 27, head: 42.5, truck: 53, yard: [27, 20, 13], r: 0.52, rake: 0.0, n: 7 },
    { z: -1.5, top: 30, head: 46.5, truck: 58, yard: [30, 22, 14.5], r: 0.56, rake: -0.02, n: 7 },
    { z: -19.5, top: 23.5, head: 36.5, truck: 45.5, yard: [20, 15.5, 10.5], r: 0.42, rake: -0.045, n: 5 }];
  const trucks = [];
  masts.forEach((m, mi) => {
    const zr = (y) => m.z + m.rake * (y - 9), k = m.r / 0.56, deckY = railAt(uOfZ(m.z, 9)) - 1.3;
    M.tube([0, deckY, zr(deckY)], [0, m.top + 2.6, zr(m.top + 2.6)], m.r, m.r * 0.78, mastC, 8);
    M.box([0, m.top, zr(m.top) + 0.2], [2.5 * k, 0.1, 2.0 * k], 0, yardC);                                 // the top
    M.tube([0, m.top - 1.6, zr(m.top - 1.6) + 0.62 * k], [0, m.head + 1.8, zr(m.head + 1.8) + 0.4 * k], m.r * 0.62, m.r * 0.46, mastC, 7);
    M.box([0, m.head, zr(m.head) + 0.3], [1.15 * k, 0.07, 0.9 * k], 0, yardC);                             // the crosstrees
    M.tube([0, m.head - 1.2, zr(m.head - 1.2) + 0.75 * k], [0, m.truck, zr(m.truck) + 0.5 * k], m.r * 0.4, m.r * 0.18, mastC, 6);
    trucks.push([0, m.truck, zr(m.truck) + 0.5 * k]);
    // the yards, each with its sail furled along it; no two braced quite alike
    const ys = [m.top - 3.3, m.top + 4.6, m.head + 3.4];
    ys.forEach((y, yi) => {
      const len = m.yard[yi] * 0.5, yaw = (rng.range(-1, 1) * 5 + (mi - 1) * 3) * Math.PI / 180, cock = rng.range(-1, 1) * 0.022, zc = zr(y) + (0.75 + 0.1 * yi) * k * (1 + 0.3 * yi);
      const end = (s, t = 1) => [s * len * t * Math.cos(yaw), y + s * len * t * cock, zc + s * len * t * Math.sin(yaw)];
      const ry = (0.3 - 0.06 * yi) * k;
      for (const s of [1, -1]) M.tube(end(s, 0), end(s), ry, ry * 0.45, yardC, 6);
      // the furled sail: a pale roll lashed along the top of the yard, thick at the bunt
      M.grid(10, 5, (a, b) => { const t = a * 2 - 1, c = end(Math.sign(t) || 1, Math.abs(t) * 0.94), rr = ry * (1.55 - 0.75 * Math.abs(t)) * (0.9 + 0.2 * Math.sin(a * 37 + mi * 3 + yi)), an = b * Math.PI * 2;
        return { p: [c[0], c[1] + ry * 0.7 + Math.sin(an) * rr * 0.9, c[2] + Math.cos(an) * rr], c: sailC }; });
      // lifts from the mast above to the yardarms; the braces of the lower yards led aft and down
      const up = yi === 0 ? m.top + 2.2 : yi === 1 ? m.head + 1.2 : m.truck - 1.0;
      for (const s of [1, -1]) Ln.line([[0, up, zr(up) + 0.4], end(s, 0.97)], 0.05, ropeC, 0.7);
      if (yi < 2 && mi < 2) for (const s of [1, -1]) Ln.line([end(s, 0.98), [s * 1.2, masts[mi + 1].top - 6 - yi * -9, masts[mi + 1].z + 0.6]], 0.045, ropeC, 0.6);
    });
    // the lower shrouds with their ratlines; the channels they come down to
    for (const s of [1, -1]) {
      const chX = sideX(m.z - 4, 8.7) + 0.95, n = m.n, top = (j) => [s * 1.5 * k, m.top - 0.25, zr(m.top) - 0.5 + j * 0.16], foot = (j) => [s * chX, 8.75, m.z - 0.9 - j * 1.02];
      M.box([s * (chX - 0.35), 8.6, m.z - 0.9 - (n - 1) * 0.51], [0.6, 0.11, (n - 1) * 0.51 + 0.7], 0, tarC);
      for (let j = 0; j < n; j++) Ln.line([top(j), foot(j)], 0.085, ropeC, 0.9);
      for (let q = 1; q <= 13; q++) { const t = q / 14.5; Ln.line([lerp3(foot(0), top(0), t), lerp3(foot(n - 1), top(n - 1), t)], 0.035, ropeC, 0.62); }
      // topmast shrouds, backstays
      for (let j = 0; j < 4; j++) Ln.line([[s * 0.8 * k, m.head - 0.2, zr(m.head) + 0.1], [s * 2.3 * k, m.top + 0.12, zr(m.top) - 0.4 - j * 0.42 * k]], 0.055, ropeC, 0.8);
      for (let j = 0; j < 2; j++) Ln.line([[s * 0.3, m.head + 0.4, zr(m.head) + 0.3], [s * chX, 8.75, m.z - 0.9 - n * 1.02 - 0.9 - j * 1.1]], 0.065, ropeC, 0.8);
      Ln.line([[s * 0.15, m.truck - 1.2, zr(m.truck) + 0.5], [s * chX, 8.75, m.z - 0.9 - n * 1.02 - 3.4]], 0.05, ropeC, 0.7);
    }
  });
  // the stays down the middle line
  const F = masts[0], Mn = masts[1], Z = masts[2];
  const stay = (a, b, w = 0.1, al = 0.9) => Ln.line([a, b], w, ropeC, al);
  stay([0, F.top + 1.6, F.z + 0.4], [0, 14.4, 35.6]); stay([0, F.head + 1.0, F.z + 0.6], [0, 17.6, 42.4], 0.08); stay([0, F.truck - 1.5, F.z + 0.5], [0, 21.3, 53.3], 0.06, 0.8);
  stay([0, Mn.top + 1.6, Mn.z + 0.3], [0, 11.6, F.z - 1.4]); stay([0, Mn.head + 1.0, Mn.z + 0.3], [0, F.top + 1.0, F.z - 0.5], 0.08); stay([0, Mn.truck - 1.5, Mn.z + 0.3], [0, F.head + 1.0, F.z - 0.2], 0.06, 0.8);
  stay([0, Z.top + 1.4, Z.z + 0.2], [0, 14.5, Mn.z - 1.2]); stay([0, Z.head + 0.8, Z.z + 0.1], [0, Mn.top + 0.8, Mn.z - 0.6], 0.07); stay([0, Z.truck - 1.2, Z.z], [0, Mn.head + 0.6, Mn.z - 0.4], 0.055, 0.8);
  // the gaff and the boom of the driver, both short of her taffrail (nothing of her reaches abaft her own stern); she wears no ensign now,
  // only a long pennant at the main truck (the wind is ahead of her)
  const zz = (y) => Z.z + Z.rake * (y - 9);
  M.tube([0, 20.2, zz(20.2) - 0.5], [0, 26.4, -28.2], 0.2, 0.1, yardC, 6); M.tube([0, 13.2, zz(13.2) - 0.5], [0, 14.0, -29.6], 0.22, 0.13, yardC, 6);
  stay([0, Z.top + 1.8, zz(Z.top)], [0, 26.4, -28.2], 0.05, 0.7); stay([0, 26.4, -28.2], [0, 14.0, -29.6], 0.04, 0.6);
  const lee = [-0.34, 0, -0.94];
  const tk = trucks[1];
  M.grid(16, 1, (a, b) => { const along = a * 15, wd = 0.55 * (1 - 0.8 * a); return { p: [tk[0] + lee[0] * along, tk[1] + 0.2 - (b - 0.5) * wd * 2 - 0.05 * along, tk[2] + lee[2] * along], c: C3('#EBD9B4'), a: [4, along, 0, 0.6 * Math.pow(a, 0.8)] }; });
  return {
    hawse: [1.3, 7.3, 29.3], trucks, length: 62, railAt, sideX,
    boxes: [{ c: [0, 5.2, -5], h: [7.3, 5.6, 24], col: hullC }, { c: [0, 5.2, 24.2], h: [3.6, 5.6, 5.2], col: hullC }, ...masts.map((m) => ({ c: [0, (m.truck + 10) / 2, m.z], h: [1.0, (m.truck - 10) / 2, 1.0], col: mastC }))],
  };
}

// ---- the tug: small, black, a tall funnel with fire in its throat, two paddle wheels thrashing ------------------------------------
// Her own frame as the ship's. W is a second Mesher for the wheels alone (they turn about the shaft).
// S over 0: not the tug but a steam packet, her larger sister, drawn in the tug's own metres for the world to show S times the size
// (her people are drawn 1/S, and so stand their own height): planked sides with a pale strake along the sheer, lit ports, a red
// flag, a second mast, and a scrap of tanned storm canvas to steady her (a trysail on the main). No towing bitts.
export function drawTug(M, Ln, W, rng, S = 0) {
  const P = S > 0;
  const hullC = C3('#2A201B'), deckC = C3('#3E3026'), boxC = C3(P ? '#6A553C' : '#44301F'), funC = C3('#1F1A18'), mastC = C3('#6B5844'), flagC = C3(P ? '#B23A26' : '#F3ECD8'), manC = C3('#232733'),
    ropeC = C3('#3A3028'), redC = C3(P ? '#B5A47E' : '#8C3323');
  const railAt = (u) => 1.2 + 1.0 * sm(0.66, 1.0, u) + 0.35 * sm(0.22, 0, u);
  const halfAt = (u, y) => {
    const st = Math.pow(Math.sin(Math.min(1, u / 0.24) * Math.PI / 2), 0.6), bw = u < 0.6 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.6) / 0.4, 2.0)), 0.6);
    return 2.6 * (0.3 + 0.7 * st) * bw * (0.8 + 0.2 * sm(-1, 1.2, y));
  };
  const zAt = (u, y) => -13 + 26 * u + 0.3 * Math.max(0, y) * sm(0.75, 1, u) - 0.35 * Math.max(0, y) * sm(0.2, 0, u);
  for (const s of [1, -1]) M.grid(30, 5, (u, t) => { const R = railAt(u), y = -1.0 + t * (R + 1.0); return { p: [s * halfAt(u, y), y, zAt(u, y)], c: y > R - 0.32 ? redC : hullC, a: P ? [12, u * 26, y, 0] : null }; });
  M.grid(2, 3, (a, t) => { const y = -1.0 + t * (railAt(0) + 1.0); return { p: [(a * 2 - 1) * halfAt(0, y), y, zAt(0, y)], c: hullC, a: P ? [12, a * 4, y, 0] : null }; });
  if (P) for (const s of [1, -1]) for (const u of [0.09, 0.145, 0.2, 0.255, 0.31, 0.365, 0.6, 0.655, 0.71]) {           // her ports, a lamp behind each
    const y = 0.74, du = 0.15 / 26, q = (uu, yy) => [s * (halfAt(uu, yy) + 0.035), yy, zAt(uu, yy)];
    M.quad(q(u - du, y - 0.1), q(u + du, y - 0.1), q(u - du, y + 0.1), q(u + du, y + 0.1), C3('#E9B95C'), [3, 0.35 + 0.3 * rng(), 0.1, 0]);
  }
  M.grid(24, 2, (u, a) => { const R = railAt(u) - 0.4; return { p: [(a * 2 - 1) * (halfAt(u, R) - 0.1), R, zAt(u, R)], c: deckC }; });
  // the paddle boxes: half drums over the wheels, their faces slatted in a fan
  const sy = 1.25, sz = -1.5, RB = 2.5, x0 = 2.35, x1 = 4.1;
  for (const s of [1, -1]) {
    M.grid(14, 1, (a, r) => { const an = a * Math.PI; return { p: [s * x1, sy + RB * r * Math.sin(an), sz + RB * r * Math.cos(an)], c: boxC, a: [5, r * Math.cos(an), r * Math.sin(an), 0] }; });
    M.grid(14, 1, (a, w) => { const an = a * Math.PI; return { p: [s * (x0 + (x1 - x0) * w), sy + RB * Math.sin(an), sz + RB * Math.cos(an)], c: boxC }; });
    M.box([s * (x0 + x1) / 2, sy - 0.12, sz], [(x1 - x0) / 2 + 0.1, 0.12, RB + 0.5], 0, hullC);                // the sponson
  }
  M.box([0, 3.85, sz], [x1 - 0.2, 0.07, 0.45], 0, deckC);                                                      // the bridge plank from box to box
  for (const s of [1, -1]) for (const dz of [-0.45, 0.45]) Ln.line([[s * (x1 - 0.3), 4.8, sz + dz], [-s * (x1 - 0.3), 4.8, sz + dz]], 0.04, ropeC, 0.8);
  // the wheels (in the shaft's own frame): rims, spokes, floats
  for (const s of [1, -1]) {
    const xa = s * (x0 + 0.25), xb = s * (x1 - 0.3), n = 10, Rw = 2.15;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, a2 = (k + 1) / n * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      for (const x of [xa, xb]) { W.tube([x, 0, 0], [x, sn * Rw, c * Rw], 0.05, 0.05, ropeC, 4); W.tube([x, sn * Rw, c * Rw], [x, Math.sin(a2) * Rw, Math.cos(a2) * Rw], 0.06, 0.06, ropeC, 4); }
      W.quad([xa, sn * (Rw - 0.55), c * (Rw - 0.55)], [xb, sn * (Rw - 0.55), c * (Rw - 0.55)], [xa, sn * (Rw + 0.1), c * (Rw + 0.1)], [xb, sn * (Rw + 0.1), c * (Rw + 0.1)], C3('#6A503A'));
    }
  }
  W.tube([-x1 + 0.2, 0, 0], [x1 - 0.2, 0, 0], 0.14, 0.14, ropeC, 6);
  // the funnel: tall and thin, raked a little, its lip red hot
  const fz = 2.3, ftop = [0, 11.7, fz - 0.6], flip = [0, 11.1, fz - 0.57];
  M.tube([0, 1.2, fz], flip, 0.52, 0.47, funC, 10); M.tube(flip, ftop, 0.47, 0.5, funC, 10, [3, 0.12, 0.0, 0], null);
  M.grid(10, 1, (a, j) => { const an = a * Math.PI * 2, r = 0.5; return { p: [ftop[0] + Math.cos(an) * r, flip[1] + (ftop[1] - flip[1]) * j + 0.001, ftop[2] + Math.sin(an) * r * 1.0 + (flip[2] - ftop[2]) * (1 - j)], c: funC, a: [3, 0.1 + 0.25 * j, 0.25 + 0.75 * j, 0] }; });
  M.box([0, 7.4, fz - 0.33], [0.55, 0.22, 0.55], 0, redC);                                                     // a red band
  for (const s of [1, -1]) for (const dz of [-3.2, 2.6]) Ln.line([[0, 8.6, fz - 0.4], [s * 2.2, 1.3, fz + dz]], 0.035, ropeC, 0.7);
  // the mast forward with a white flag; a lamp on it
  M.tube([0, 1.3, 8.3], [0, 12.6, 8.0], 0.17, 0.08, mastC, 6);
  Ln.line([[0, 11.6, 8.0], [0, 2.4, 12.9]], 0.04, ropeC, 0.75); for (const s of [1, -1]) Ln.line([[0, 11.2, 8.0], [s * 2.3, 1.6, 6.3]], 0.04, ropeC, 0.75);
  M.box([0, 7.2, 8.42], [0.14, 0.2, 0.14], 0, C3('#E9B95C'), [3, 0.6, 0.4, 0]);
  const lee = [-0.34, 0, -0.94];
  M.grid(8, 4, (a, b) => { const along = a * 2.6; return { p: [lee[0] * along, 12.5 - b * 1.5 - 0.2 * along * a, 8.0 + lee[2] * along], c: flagC, a: [4, along * 2.2, 0, 0.24 * Math.pow(a, 0.7)] }; });
  // the deck house, the towing bitts, two men
  M.box([0, 1.75, -5.6], [0.95, 0.7, 1.7], 0, boxC); M.box([0, 1.5, 5.2], [0.8, 0.45, 1.1], 0, boxC);
  if (P) {
    // the main mast, and her storm canvas: a trysail set flat abaft it, sheeted to starboard (her lee) and shaking; her forestay bare (the sea comes over her bows)
    const mz = -8.0, tanA = C3('#A8482A');
    M.tube([0, 1.2, mz], [0, 11.3, mz - 0.25], 0.16, 0.07, mastC, 6);
    for (const s of [1, -1]) Ln.line([[0, 10.6, mz - 0.2], [s * 2.1, 1.5, mz - 1.9]], 0.04, ropeC, 0.75);
    Ln.line([[0, 11.0, mz - 0.2], [0, 12.2, 8.0]], 0.035, ropeC, 0.6);
    const gA = [0, 7.7, mz - 0.3], gB = [-0.45, 9.0, mz - 3.7], tk = [0, 3.1, mz - 0.28], cw = [-0.75, 3.3, mz - 4.3];
    M.tube(gA, gB, 0.08, 0.05, mastC, 5);
    M.grid(7, 7, (a, b) => { const q = lerp3(lerp3(tk, cw, a), lerp3(gA, gB, a), b); q[0] -= 0.4 * Math.sin(Math.PI * a) * Math.sin(Math.PI * b); return { p: q, c: tanA.clone().multiplyScalar(sailFormL(a, b)), a: [edge4(a, b), a * 4.2, 0.02 + 0.96 * b, 0.05 * a] }; });
    Ln.line([cw, [-1.3, 1.5, mz - 4.6]], 0.04, ropeC, 0.8);
    M.box([0, 1.35, -10.4], [0.5, 0.3, 0.7], 0, boxC);                                                       // a companion aft
    // her people, each at his own height: one at the wheel, one on the bridge between the boxes, two forward
    for (const [x, y, z, c] of [[0.3, 1.0, -11.6, '#232733'], [-1.1, 3.92, sz, '#3E4A5E'], [0.9, 0.8, 6.9, '#5A2A20'], [-0.7, 0.8, 3.4, '#232733']]) figure(M, x, y, z, 1.7 / S, C3(c), 0.04 / S);
  } else {
    M.tube([0, 1.0, -9.3], [0, 2.35, -9.3], 0.16, 0.16, deckC, 6); M.tube([-0.6, 2.1, -9.3], [0.6, 2.1, -9.3], 0.09, 0.09, deckC, 5);
    for (const p of [[0.5, -10.9], [-0.9, 3.6]]) { M.box([p[0], 1.95, p[1]], [0.2, 0.62, 0.15], 0.3, manC); M.box([p[0], 2.72, p[1]], [0.12, 0.13, 0.12], 0.3, C3('#B98C6A')); }
  }
  M.box([0, 0.6, -13.1], [0.07, 1.6, 0.42], 0, hullC);                                                       // the rudder
  return { funnel: ftop, shaft: [0, sy, sz], tow: [0, 2.2, -9.3], stern: [0, 1.75, -13.3], wheelX: (x0 + x1) / 2, wheelR: 2.15,
    boxes: [{ c: [0, 0.8, 0], h: [4.2, 1.4, 12.8], col: hullC }, { c: [0, 6.2, fz - 0.3], h: [0.5, 5.5, 0.5], col: funC }] };
}

// ---- smoke, steam, spray: soft dabs that stand in the world and turn their faces to the eye (a medium: they thin away near the lens) ----
// Each puff runs a line of its own again and again: from p0 it drifts by v (metres, over its whole life), rises by 'rise' fast
// at first, swells from r0 to r1, and wanders 'wob' about the line. mode 0: coal smoke; 1: spray and foam; 2: steam. (mode 0.25: coal
// smoke whose funnel rides the sea: its youngest puffs are carried by uFol, which the world keeps.)
// All of it is a function of the world's clock alone, which is already running when the world is first seen.
export function buildPuffs(U, puffs) {
  // Laid in from the oldest to the youngest, so the young soot at the funnel stands before the thin old smoke beyond it (a stream is
  // looked along from its head on this flight). The set is written twice, latest born first: the first copy draws those not yet
  // born again this round of the clock (the old), the second those that have been (the young); so the order holds at every clock.
  const list = puffs.slice().sort((x, y) => (x.mode || 0) - (y.mode || 0) || y.phase - x.phase), n = list.length * 2, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 1, 3, 2]);
  const P0 = new Float32Array(n * 3), V = new Float32Array(n * 3), S = new Float32Array(n * 4), C = new Float32Array(n * 4), G = new Float32Array(n);
  for (let i = 0; i < n; i++) { const q = list[i % list.length]; P0.set(q.p0, i * 3); V.set(q.v, i * 3); S.set([q.phase % 1, q.rate, q.r0, q.r1], i * 4); C.set([q.mode || 0, q.rise || 0, q.wob || 0, q.seed], i * 4); G[i] = i < list.length ? 0 : 1; }
  g.setAttribute('aP0', new THREE.InstancedBufferAttribute(P0, 3)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 3));
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 4)); g.setAttribute('aG', new THREE.InstancedBufferAttribute(G, 1));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`attribute vec3 aP0, aV; attribute vec4 aS, aC; attribute float aG; uniform float uT; uniform vec3 uFol;
      varying vec2 vUv; varying vec4 vI; varying vec3 vCtr, vR, vUp; varying float vA;
      void main(){
        float a0 = aS.x + fract(uT * aS.y), a = fract(a0), sd = aC.w;
        if (abs(step(1., a0) - aG) > .5) { vUv = vec2(0.); vI = vec4(0.); vCtr = vec3(0.); vR = vec3(0.); vUp = vec3(0.); vA = 0.; gl_Position = vec4(2., 2., 2., 1.); return; }   // this copy's turn is not now
        vec3 c = aP0 + aV * pow(a, 1.15);
        if (fract(aC.x) > .1) c += uFol * exp(-a * 9.);                                               // smoke from a funnel that rides the sea leaves it where it is just now
        c.y += aC.x > .5 && aC.x < 1.5 ? aC.y * 4. * a * (1. - a) : aC.y * (1. - exp(-3.2 * a));    // spray is thrown and falls; smoke climbs
        c += aC.z * (.2 + a) * vec3(sin(sd * 37. + uT * .31 + a * 9.), sin(sd * 51. + uT * .27 + a * 7.), cos(sd * 23. + uT * .23 + a * 8.));
        float r = mix(aS.z, aS.w, pow(a, .8));
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        float ang = sd * 6.2832 + uT * .06 * (sd - .5), cs = cos(ang), sn = sin(ang);
        vec2 q = vec2(position.x * cs - position.y * sn, position.x * sn + position.y * cs);
        vec3 w = c + (right * q.x + up * q.y) * r;
        vUv = position.xy; vI = vec4(a, aC.x, sd, r); vCtr = c; vR = right * cs + up * sn; vUp = up * cs - right * sn;
        float dist = length(c - cameraPosition);
        float fade = aC.x < .5 ? exp(-a * a / .19) * sqrt(1. - a) : pow(1. - a, 1.3);                     // coal smoke is thick at the funnel and soon a thin haze: no column of it stands far from its source
        vA = smoothstep(0., .03, a) * fade * smoothstep(1.2 + r * .6, 3.5 + r * 1.6, dist);               // thin near the lens
        if (aC.x > .5 && aC.x < 1.5) vA *= .08 + .92 * smoothstep(8., 28., dist);                          // thrown water seen close is a fine mist, not white wool
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`varying vec2 vUv; varying vec4 vI; varying vec3 vCtr, vR, vUp; varying float vA;
      ${TURNER_GLSL}
      void main(){
        float rr = length(vUv), age = vI.x, mode = vI.y;
        float n = tN2(vUv * (1.9 + (mode < .5 ? vI.w * .2 : 0.)) + vI.z * 31.), n2 = tN2(vUv * 4.3 + vI.z * 17. + 9.);     // a great old puff of smoke is torn as finely as a young one
        float body = 1. - smoothstep(.3, 1., rr);
        float m = mode > .5 && mode < 1.5 ? smoothstep(n * .9 + .1, n * .9 + .3, body * 1.2 * (.6 + .8 * n2)) * (.22 + .78 * smoothstep(.36, .6, tN2(vUv * 6.7 + vI.z * 43. + 3.))) : smoothstep(n * .8 + n2 * .12, n * .8 + n2 * .12 + .26, body * (1.32 - .5 * age));   // a dab of the brush, not a disc: smoke tears into wisps as it ages
        float al = m * vA;
        if (al < .004) discard;
        vec3 rd = normalize(vCtr - cameraPosition);
        vec3 nb = normalize((vR * vUv.x + vUp * vUv.y) * (mode < .5 ? .55 : 1.) - rd * (sqrt(max(1. - rr * rr, 0.)) + .25));   // the puff as a ball (smoke: a flatter one, so the stream reads as one body)
        float l = dot(nb, uSun) * .5 + .5, toSun = smoothstep(.1, .97, dot(rd, uSun)), edge = smoothstep(.25, .95, rr + (n2 - .5) * .3), fringe = smoothstep(.5, 1., rr + (n2 - .5) * .3);
        vec3 col;
        if (mode < .5) {                                                     // coal smoke: soot at its heart, the light in its skirts
          vec3 dark = mix(cUmber * 1.15, mix(cDusk, cUmber, .5) * 1.05, age), lit = mix(mix(cFire, cRed, .6) * .85, mix(cRose, cDusk, .45), age);   // soot at the funnel, a grey brown as it thins
          col = mix(dark, lit, l * l * (.4 + .4 * age));
          col = mix(col, mix(cFire, cLemon, fringe * .7) * 1.05, toSun * fringe * (.5 - .2 * age) * smoothstep(.03, .3, age));    // against the sun it stands dark, and only its fringes take fire (the young soot at the funnel not even those: it is too thick)
          col = mix(col, mix(cRed, cFire, .7) * 1.25, smoothstep(.035, .0, age) * .75 * (1. - .75 * smoothstep(.15, .7, rr + (n2 - .5) * .3)));   // the furnace lights the youngest smoke at its heart
          col *= .9 + .2 * n2;
          al *= .92;
        } else if (mode < 1.5) {                                             // spray and foam: thrown water, white in the light
          col = mix(mix(cDusk, cPearl, .55), mix(cPearl, cCore, .5), l);
          col = mix(col, mix(cLemon, cCore, .5) * 1.15, toSun * (.4 + .5 * edge));
          al *= .8;
        } else {                                                             // steam: thin and pale
          col = mix(mix(cDusk, cPearl, .7), cCore, l * .8);
          col = mix(col, cLemon * 1.1, toSun * edge * .7);
          al *= .55;
        }
        col = tAirK(col, vCtr, mode < .5 ? .4 : 1.);                         // coal smoke stands dark in the squall's vapour a while (thrown water and steam are of it, and go into it)
        gl_FragColor = vec4(col, al);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 8; mesh.name = 'puffs';
  return mesh;
}

// the sea's height at a place, as the shaders know it (for things that float)
export function swellAt(U, x, z, t) {
  const sq = U.uSq.value, sw = U.uSwell.value, ox = x - sq.x, oz = z - sq.y;
  const A = sw.x + sw.y * Math.exp(-(ox * ox + oz * oz) / (sq.z * sq.z * 1.6));
  const a1 = (x * 0.34 + z * 0.94) * 0.105 - t * 0.62, a2 = (x * -0.5 + z * 0.866) * 0.17 - t * 0.8 + 1.7, a3 = (x * 0.8 + z * 0.6) * 0.29 - t * 1.05 + 4.1;
  return A * (Math.sin(a1) + 0.55 * Math.sin(a2) + 0.3 * Math.sin(a3));
}

// ---- a fishing lugger running home before the wind: tarred hull, tanned lugsails spread wide (the low sun comes through them) ----
// S is her size (1: a 12 m boat); the people aboard keep their own size. wing: 1 her mizzen is boomed out to port (goose-winged),
// 0 both sails to starboard. Her own frame as the ship's (z forward, x to port).
const edge4 = (a, b) => (a < 1e-6 || a > 1 - 1e-6 || b < 1e-6 || b > 1 - 1e-6 ? 4.4 : 4);   // canvas: 4 within, 4.4 along the sail's own edge (the shader breaks that edge with the bristle)
const sailFormL = (a, b) => 1 - 0.18 * Math.pow(Math.abs(a * 2 - 1), 2.2) + 0.07 * Math.sin(Math.PI * a) * Math.sin(Math.PI * b) - 0.09 * sm(0.75, 1, b);
export function drawLugger(M, Ln, rng, S = 1, wing = 1) {
  const hullC = C3('#2B2320'), strakeC = C3('#B9A27A'), deckC = C3('#5A4636'), mastC = C3('#7A664A'), ropeC = C3('#3A3028'), netC = C3('#6A5A44');
  const manC = [C3('#262A36'), C3('#5A2A20'), C3('#3E4A5E'), C3('#B9A27A')];
  const tan = rng.pick([['#B8502A', '#C97A3C', '#9C3F26'], ['#A8432A', '#B8502A', '#C2622E'], ['#C2622E', '#D08A45', '#B8502A'], ['#D9C9A0', '#B8502A', '#C97A3C']]).map(C3);   // each deal tans her sails its own way
  const railAt = (u) => (1.15 + 0.7 * sm(0.6, 1.0, u) + 0.35 * sm(0.25, 0, u)) * S;
  const halfAt = (u, y) => { const st = Math.pow(Math.sin(Math.min(1, u / 0.3) * Math.PI / 2), 0.7), bw = u < 0.55 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.55) / 0.45, 2.0)), 0.6); return 1.85 * S * (0.45 + 0.55 * st) * bw * (0.72 + 0.28 * sm(-0.8, 1.0, y / S)); };
  const zAt = (u, y) => (-6 + 12 * u) * S + 0.35 * Math.max(0, y) * sm(0.7, 1, u);
  for (const s of [1, -1]) M.grid(22, 5, (u, t) => { const R = railAt(u), y = -0.8 * S + t * (R + 0.8 * S); return { p: [s * halfAt(u, y), y, zAt(u, y)], c: y > R - 0.28 * S ? strakeC : hullC, a: [12, u * 12 * S, y, 0] }; });
  M.grid(2, 5, (a, t) => { const R = railAt(0), y = -0.8 * S + t * (R + 0.8 * S); return { p: [(a * 2 - 1) * halfAt(0, y), y, zAt(0, y)], c: y > R - 0.28 * S ? strakeC : hullC, a: [12, a * 3 * S, y, 0] }; });   // her transom: the sheer strake carried round it
  const deckY = (u) => railAt(u) - 0.45 * S;
  M.grid(16, 2, (u, a) => { const R = deckY(u); return { p: [(a * 2 - 1) * (halfAt(u, R) - 0.08), R, zAt(u, R)], c: deckC }; });
  // a lugsail: a four-cornered sail hung from a yard that slants up aft, squared off before the wind and full of it (its belly forward)
  const sail = (mz, top, tack, clew, y0, y1, col, sheet, n) => {
    mz *= S; top *= S; tack *= S; clew *= S; y0 *= S; y1 *= S;
    M.tube([0, 0.6 * S, mz], [0, top, mz - 0.2 * S], 0.13 * S, 0.07 * S, mastC, 6);
    const ex = Math.sin(sheet), ez = Math.cos(sheet), sg = Math.sign(sheet) || 1;      // the sail's own line, swung off the keel; its belly goes forward on either hand
    const at = (d, y, belly) => [d * ex - sg * belly * ez, y, mz + d * ez + sg * belly * ex];
    const A = [tack + 0.4 * S, y0], B = [clew + 0.7 * S, y1], T = [tack, 1.5 * S], Cc = [clew, 1.9 * S], wet = col.clone().multiplyScalar(0.72);
    M.grid(n, n, (a, b) => {
      const tp = [A[0] + (B[0] - A[0]) * a, A[1] + (B[1] - A[1]) * a], bt = [T[0] + (Cc[0] - T[0]) * a, T[1] + (Cc[1] - T[1]) * a - 0.35 * S * Math.sin(Math.PI * a)];
      const d = bt[0] + (tp[0] - bt[0]) * b, y = bt[1] + (tp[1] - bt[1]) * b, belly = 1.25 * S * Math.sin(Math.PI * a) * Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * b) * 0.92);
      return { p: at(d, y, belly), c: col.clone().lerp(wet, 0.75 * (1 - b) * (1 - b)).multiplyScalar(sailFormL(a, b)), a: [edge4(a, b), a * 7, 0.02 + 0.96 * b, 0.05 * S * Math.sin(Math.PI * a) * Math.sin(Math.PI * b)] };   // darker toward the foot, where the spray wets it
    });
    const yA = at(A[0] + 0.3 * S, A[1] - 0.2 * S, 0), yB = at(B[0] - 0.3 * S, B[1] + 0.25 * S, 0);
    M.tube(yA, yB, 0.09 * S, 0.06 * S, mastC, 5);
    Ln.line([[0, top - 0.3 * S, mz - 0.2 * S], lerp3(yA, yB, 0.38)], 0.04, ropeC, 0.8);
    Ln.line([at(Cc[0], Cc[1], 0), [-sg * 1.0 * S, 1.3 * S, mz - 2.2 * S]], 0.045, ropeC, 0.85);                                              // the sheet, aft to the quarter
    Ln.line([at(T[0], T[1], 0), [sg * 0.5 * S, 1.2 * S, mz + 1.4 * S]], 0.045, ropeC, 0.85);                                                // the tack, down to the weather bow
  };
  sail(2.6, 9.8, 3.0, -4.4, 5.2, 10.9, tan[0], 1.22, 10);
  sail(-3.9, 6.8, 1.6, -3.3, 3.9, 7.5, tan[1], wing ? -1.12 : 1.05, 8);
  // a jib on a running bowsprit, drawing a little
  M.tube([0, 1.5 * S, 5.2 * S], [0, 2.1 * S, 9.4 * S], 0.08 * S, 0.05 * S, mastC, 5);
  M.grid(6, 6, (a, b) => { const h = [0, 8.9 * S, 2.7 * S], t = [0, 2.1 * S, 9.2 * S], c = [-1.6 * S, 1.9 * S, 4.4 * S], e = lerp3(t, c, a), q = lerp3(e, h, b); q[0] -= 0.5 * S * Math.sin(Math.PI * a) * Math.sin(Math.PI * b * 0.9); return { p: q, c: tan[2], a: [edge4(a, b), a * 3, 0, 0.04 * S * a * (1 - b)] }; });
  for (const s of [1, -1]) { Ln.line([[0, 9.2 * S, 2.4 * S], [s * 1.6 * S, 1.3 * S, 1.2 * S]], 0.035, ropeC, 0.75); Ln.line([[0, 6.3 * S, -4.1 * S], [s * 1.4 * S, 1.3 * S, -5.0 * S]], 0.035, ropeC, 0.75); }
  Ln.line([[0, 9.3 * S, 2.5 * S], [0, 2.1 * S, 9.3 * S]], 0.04, ropeC, 0.8);
  // her people: one at the tiller, the rest about the deck; a heap of nets, baskets, a lantern at the mizzen
  const dk = (z) => deckY((z / S + 6) / 12);
  figure(M, 0.35 * S, dk(-4.9 * S), -4.9 * S, 1.7, manC[0], -0.1, C3('#2A2622'));
  const crew = Math.round(2 + 1.5 * S);
  for (let i = 0; i < crew; i++) { const z = rng.range(-3, 4.4) * S, x = rng.range(-0.75, 0.75) * S; figure(M, x, dk(z), z, rng.range(1.55, 1.75) * (rng.chance(0.3) ? 0.62 : 1), rng.pick(manC), rng.range(-0.12, 0.12), rng.chance(0.5) ? C3('#2A2622') : null); }
  M.box([0.1 * S, dk(-1.2 * S) + 0.22, -1.2 * S], [0.75 * S, 0.22, 1.1 * S], 0.2, netC); M.box([-0.5 * S, dk(1.2 * S) + 0.2, 1.3 * S], [0.3, 0.2, 0.3], 0.5, strakeC); M.box([0.55 * S, dk(0.4 * S) + 0.2, 0.5 * S], [0.28, 0.2, 0.28], 0.1, strakeC);
  M.box([0.16 * S, 2.6 * S, -4.0 * S], [0.11, 0.15, 0.11], 0, C3('#E9B95C'), [3, 0.55, 0.3, 0]);
  M.box([0, 0.5 * S, -6.15 * S], [0.05 * S, 1.2 * S, 0.3 * S], 0, hullC);                                    // the rudder
  return { bow: [0, 0.2, 6.1 * S], half: [1.9 * S, 6.2 * S],
    boxes: [{ c: [0, 0.6 * S, 0], h: [1.7 * S, 1.0 * S, 5.6 * S], col: hullC }, { c: [-0.6 * S, 5.6 * S, 3.4 * S], h: [3.4 * S, 4.2 * S, 0.6 * S], col: tan[0] }] };
}

// ---- the harbour: two moles, the lighthouse on its bastion, and beyond the mouth a long water street between quays of porticoes,
// domes and towers going into the light. Set out in the world's own metres (no group): W gives the places.
export function drawHarbour(M, Ln, Lamp, rng, W) {
  const stone = [C3('#EADBB8'), C3('#DCC79E'), C3('#DDB9A0'), C3('#CFC8BA'), C3('#F0E8D8'), C3('#D2BE9C')], moleC = C3('#B9AD98'), quayC = C3('#C4B79E');
  const roofs = [C3('#B36A45'), C3('#8A8F98'), C3('#A65A3C'), C3('#9A8F84')], darkC = C3('#3A3028'), leadC = C3('#AEB6BD'), giltC = C3('#E9B95C'), whiteC = C3('#F2EBDD'), manC = [C3('#2B2A33'), C3('#6B2E22'), C3('#3E4A5E'), C3('#C9B995')];
  // an upright wall from A to B (x, z), y0 to y1, its face coords in metres: kind 6 stone in courses, 7 a house front (aM.w its height)
  const wall = (ax, az, bx, bz, y0, y1, c, kind, H = 0, n = 1) => {
    const len = Math.hypot(bx - ax, bz - az);
    M.grid(n, 1, (u, v) => ({ p: [ax + (bx - ax) * u, y0 + (y1 - y0) * v, az + (bz - az) * u], c, a: [kind, u * len, (y0 + (y1 - y0) * v) - (kind === 7 ? W.quayY : 0), H] }));
  };
  const top = (x0, x1, z0, z1, y, c) => M.quad([x0, y, z0], [x1, y, z0], [x0, y, z1], [x1, y, z1], c);
  const slab = (x0, x1, z0, z1, y0, y1, c, kind = 6) => { wall(x0, z0, x1, z0, y0, y1, c, kind); wall(x1, z0, x1, z1, y0, y1, c, kind); wall(x1, z1, x0, z1, y0, y1, c, kind); wall(x0, z1, x0, z0, y0, y1, c, kind); top(x0, x1, z0, z1, y1, c); };
  const round = (cx, cz, r0, r1, y0, y1, c, kind = 6, sides = 22) => M.grid(sides, 2, (u, v) => { const a = u * Math.PI * 2, r = r0 + (r1 - r0) * v; return { p: [cx + Math.cos(a) * r, y0 + (y1 - y0) * v, cz + Math.sin(a) * r], c, a: [kind, u * Math.PI * 2 * r0, y0 + (y1 - y0) * v, 0] }; });
  const disc = (cx, cz, r, y, c, sides = 22) => M.grid(sides, 1, (u, v) => { const a = u * Math.PI * 2; return { p: [cx + Math.cos(a) * r * v, y, cz + Math.sin(a) * r * v], c }; });
  // a roof's slope: P0 to P1 its eave, P2 and P3 its ridge; tiled in courses up from the eave
  const roofQ = (P0, P1, P2, P3, c) => {
    const ex = P1[0] - P0[0], ey = P1[1] - P0[1], ez = P1[2] - P0[2], L = Math.hypot(ex, ey, ez) || 1, ux = ex / L, uy = ey / L, uz = ez / L;
    const A = (P) => { const dx = P[0] - P0[0], dy = P[1] - P0[1], dz = P[2] - P0[2], al = dx * ux + dy * uy + dz * uz; return [13, al, Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - al * al)), 0]; };
    M.quad(P0, P1, P2, P3, c, A(P0), A(P1), A(P2), A(P3));
  };
  // a figure of stone on a block
  const statue = (x, y, z, h, c) => { M.box([x, y + 0.25, z], [0.45, 0.25, 0.45], 0, c); M.tube([x, y + 0.5, z], [x, y + 0.5 + h * 0.78, z], 0.3 * h / 2.4, 0.2 * h / 2.4, c, 6); M.tube([x, y + 0.5 + h * 0.8, z], [x, y + 0.5 + h, z], 0.15 * h / 2.4, 0.13 * h / 2.4, c, 5); };
  // a house: four fronts and a hipped roof
  const house = (x0, x1, z0, z1, H, c, rc, rh = 3) => {
    const y0 = W.quayY, y1 = y0 + H;
    wall(x0, z0, x1, z0, y0, y1, c, 7, H); wall(x1, z0, x1, z1, y0, y1, c, 7, H); wall(x1, z1, x0, z1, y0, y1, c, 7, H); wall(x0, z1, x0, z0, y0, y1, c, 7, H);
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, ix = Math.min((x1 - x0) / 2, (z1 - z0) / 2) * 0.75, e = 0.5;
    const a = [x0 - e, y1, z0 - e], b = [x1 + e, y1, z0 - e], cc = [x1 + e, y1, z1 + e], d = [x0 - e, y1, z1 + e];
    const r1 = (x1 - x0) > (z1 - z0) ? [x0 + ix, y1 + rh, mz] : [mx, y1 + rh, z0 + ix], r2 = (x1 - x0) > (z1 - z0) ? [x1 - ix, y1 + rh, mz] : [mx, y1 + rh, z1 - ix];
    if ((x1 - x0) > (z1 - z0)) { roofQ(a, b, r1, r2, rc); roofQ(cc, d, r2, r1, rc); roofQ(b, cc, r2, r2, rc); roofQ(d, a, r1, r1, rc); }
    else { roofQ(a, b, r1, r1, rc); roofQ(b, cc, r1, r2, rc); roofQ(cc, d, r2, r2, rc); roofQ(d, a, r2, r1, rc); }
  };
  // a temple front toward the water (sx: +1 faces +X, -1 faces -X): columns, an entablature, a pediment, steps down to the quay's edge
  const portico = (xf, z0, z1, hc, n, c, sx) => {
    const y0 = W.quayY + 1.0, d = 4.2, xb = xf - sx * d;
    for (let i = 0; i < n; i++) { const z = z0 + 0.9 + (z1 - z0 - 1.8) * i / (n - 1); M.tube([xf - sx * 0.7, y0, z], [xf - sx * 0.7, y0 + hc, z], 0.62, 0.52, c, 8); M.box([xf - sx * 0.7, y0 + hc + 0.2, z], [0.8, 0.2, 0.8], 0, c); }
    const xa = Math.min(xf, xb) , xc = Math.max(xf, xb);
    slab(xa - 0.3, xc + 0.3, z0, z1, y0 + hc + 0.4, y0 + hc + 2.0, c, 0);
    const py = y0 + hc + 2.0, ph = (z1 - z0) * 0.15, mz = (z0 + z1) / 2, tc = c.clone().multiplyScalar(0.82), ck = 0.7, xo = xf + sx * 0.6, xi = xf - sx * 0.4, xk = xb - sx * 0.4;
    slab(Math.min(xo, xf), Math.max(xo, xf), z0 - 0.5, z1 + 0.5, py - 0.4, py, c, 0);                       // the cornice, standing out over the frieze
    M.quad([xi, py, z0 + 0.3], [xi, py, z1 - 0.3], [xi, py + ph - 0.2, mz], [xi, py + ph - 0.2, mz], tc);    // the tympanum, back in their shade
    M.quad([xk, py, z0 - 0.3], [xk, py, z1 + 0.3], [xk, py + ph + ck, mz], [xk, py + ph + ck, mz], c);
    for (const zz of [z0 - 0.5, z1 + 0.5]) {                                 // each slope: the raking cornice's face and its soffit, then the tiles
      M.quad([xo, py, zz], [xo, py + ph, mz], [xo, py + ck, zz], [xo, py + ph + ck, mz], c);
      M.quad([xo, py, zz], [xo, py + ph, mz], [xi, py, zz], [xi, py + ph, mz], tc);
      roofQ([xo, py + ck, zz], [xk, py + ck, zz], [xo, py + ph + ck, mz], [xk, py + ph + ck, mz], roofs[1]);
    }
    statue(xo - sx * 0.5, py + ph + ck - 0.1, mz, 2.6, c); statue(xo - sx * 0.5, py + ck - 0.1, z0 + 0.4, 2.2, c); statue(xo - sx * 0.5, py + ck - 0.1, z1 - 0.4, 2.2, c);
    for (let i = 0; i < 5; i++) { const x0 = xf + sx * (0.2 + i * 0.75), x1 = xf + sx * (0.95 + i * 0.75), yy = y0 - i * 0.22; slab(Math.min(x0, x1), Math.max(x0, x1), z0 - 0.5, z1 + 0.5, yy - 0.22, yy, c, 0); }
    slab(xa, xc, z0, z1, W.quayY, y0, c, 0);
  };
  // a dome on a drum, a lantern and a gilt ball on it
  const dome = (cx, cz, yb, rd, hd, hdome, c, dc) => {
    round(cx, cz, rd, rd, yb, yb + hd, c, 7, 20);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; M.tube([cx + Math.cos(a) * (rd + 0.7), yb, cz + Math.sin(a) * (rd + 0.7)], [cx + Math.cos(a) * (rd + 0.7), yb + hd - 0.6, cz + Math.sin(a) * (rd + 0.7)], 0.42, 0.36, c, 6); }
    disc(cx, cz, rd + 1.3, yb + hd - 0.5, c, 20); round(cx, cz, rd + 1.3, rd + 1.3, yb + hd - 0.5, yb + hd + 0.3, c, 0, 20);
    M.grid(20, 8, (u, v) => { const a = u * Math.PI * 2, t = v * Math.PI / 2, r = rd * 0.98 * Math.cos(t), y = yb + hd + 0.3 + hdome * Math.pow(Math.sin(t), 0.82); return { p: [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r], c: dc }; });
    const yl = yb + hd + 0.3 + hdome; round(cx, cz, rd * 0.17, rd * 0.15, yl - 0.4, yl + rd * 0.5, c, 0, 10);
    M.grid(10, 4, (u, v) => { const a = u * Math.PI * 2, t = v * Math.PI / 2; return { p: [cx + Math.cos(a) * rd * 0.17 * Math.cos(t), yl + rd * 0.5 + rd * 0.2 * Math.sin(t), cz + Math.sin(a) * rd * 0.17 * Math.cos(t)], c: dc }; });
    M.box([cx, yl + rd * 0.78, cz], [0.32, 0.32, 0.32], 0.6, giltC); M.tube([cx, yl + rd * 0.7, cz], [cx, yl + rd * 0.7 + 2.2, cz], 0.07, 0.04, giltC, 4);
    return yl + rd * 0.7 + 2.2;
  };
  // a tower: shaft, belfry, spire
  const tower = (cx, cz, w, H, c, rc, spire = 9) => {
    const y0 = W.quayY, y1 = y0 + H;
    for (const [ax, az, bx, bz] of [[cx - w, cz - w, cx + w, cz - w], [cx + w, cz - w, cx + w, cz + w], [cx + w, cz + w, cx - w, cz + w], [cx - w, cz + w, cx - w, cz - w]]) {
      M.grid(1, 1, (u, v) => ({ p: [ax + (bx - ax) * u, y0 + (y1 - y0) * v, az + (bz - az) * u], c, a: [8, (u - 0.5) * 2 * w, v * H, H] }));
    }
    M.box([cx, y1 + 0.25, cz], [w + 0.45, 0.25, w + 0.45], 0, c);
    const bw = w * 0.86, bh = 6.5;
    for (const [ax, az, bx, bz] of [[cx - bw, cz - bw, cx + bw, cz - bw], [cx + bw, cz - bw, cx + bw, cz + bw], [cx + bw, cz + bw, cx - bw, cz + bw], [cx - bw, cz + bw, cx - bw, cz - bw]]) M.grid(1, 1, (u, v) => ({ p: [ax + (bx - ax) * u, y1 + 0.5 + bh * v, az + (bz - az) * u], c, a: [9, (u - 0.5) * 2 * bw, v, bw] }));
    M.box([cx, y1 + 0.75 + bh, cz], [bw + 0.4, 0.25, bw + 0.4], 0, c);
    M.box([cx, y1 + 1.0 + bh + spire / 2, cz], [bw * 0.92, spire / 2, bw * 0.92], 0, rc, null, 0.04);
    M.tube([cx, y1 + 1 + bh + spire, cz], [cx, y1 + 3 + bh + spire, cz], 0.06, 0.03, giltC, 4);
    return y1 + 3 + bh + spire;
  };
  const people = (x0, x1, z0, z1, n) => { for (let i = 0; i < n; i++) figure(M, rng.range(x0, x1), W.quayY, rng.range(z0, z1), rng.range(1.5, 1.75), rng.pick(manC), rng.range(-0.08, 0.08)); };

  // the moles and their heads
  const bx = W.bastion[0], bz = W.bastion[1], hx = W.head[0], hz = W.head[1];
  slab(bx + 4, bx + 700, bz - 6.5, bz + 6.5, -1.2, 4.6, moleC); slab(bx + 4, bx + 700, bz - 6.5, bz - 5.6, 4.6, 5.7, moleC);
  slab(hx - 700, hx - 3, hz - 5.5, hz + 5.5, -1.2, 4.2, moleC); slab(hx - 700, hx - 3, hz - 5.5, hz - 4.7, 4.2, 5.2, moleC);
  round(bx, bz, 10.5, 9.3, 0.8, 9.3, moleC, 6, 44); disc(bx, bz, 9.3, 9.2, quayC, 44); round(bx, bz, 9.3, 9.3, 9.6, 10.5, moleC, 6, 44); round(bx, bz, 8.7, 8.7, 9.2, 10.5, moleC, 6, 44);
  round(bx, bz, 11.1, 10.9, -1.2, 0.8, moleC, 6, 44); round(bx, bz, 10.9, 10.5, 0.8, 1.0, moleC, 0, 44);     // its footing, a step out at the water
  round(bx, bz, 9.86, 10.12, 5.3, 5.5, whiteC, 0, 44); round(bx, bz, 10.12, 9.8, 5.5, 5.75, whiteC, 0, 44);   // a string course round it
  for (let i = 0; i < 11; i++) {                                              // embrasures under its parapet: dark openings lying in the wall's own face
    const a = (i + 0.5) / 11 * Math.PI * 2, da = 0.075, rAt = (y) => 10.5 - 1.2 * (y - 0.8) / 8.5 + 0.05, P = (an, y) => [bx + Math.cos(an) * rAt(y), y, bz + Math.sin(an) * rAt(y)];
    M.quad(P(a - da, 6.95), P(a + da, 6.95), P(a - da, 7.7), P(a + da, 7.7), darkC);
    M.quad(P(a - da * 1.25, 7.7), P(a + da * 1.25, 7.7), P(a - da * 1.25, 7.9), P(a + da * 1.25, 7.9), whiteC);   // a pale lintel over each
  }
  round(bx, bz, 9.3, 9.75, 9.3, 9.45, whiteC, 0, 44); round(bx, bz, 9.75, 9.3, 9.45, 9.6, whiteC, 0, 44);
  round(hx, hz, 6.8, 6.3, 0.6, 4.6, moleC, 6, 32); round(hx, hz, 7.25, 7.1, -1.2, 0.6, moleC, 6, 32); round(hx, hz, 7.1, 6.8, 0.6, 0.8, moleC, 0, 32);
  round(hx, hz, 6.3, 6.7, 4.6, 4.75, whiteC, 0, 32); round(hx, hz, 6.7, 6.3, 4.75, 4.9, whiteC, 0, 32);
  round(hx, hz, 6.3, 6.3, 4.9, 5.8, moleC, 6, 32); round(hx, hz, 5.8, 5.8, 5.4, 5.8, moleC, 6, 32); disc(hx, hz, 6.0, 5.4, quayC, 32);
  // the lighthouse: a white tower, a gallery, the lamp, a dark cap
  round(bx, bz, 3.3, 2.25, 9.2, 33.4, whiteC, 10, 24);
  round(bx, bz, 4.0, 3.7, 9.2, 10.7, whiteC, 0, 24); round(bx, bz, 3.7, 3.25, 10.7, 11.1, whiteC, 0, 24);   // its plinth
  round(bx, bz, 2.3, 3.45, 32.4, 33.4, whiteC, 0, 24);                                                      // the flare that carries the gallery
  disc(bx, bz, 3.5, 33.4, darkC, 24); round(bx, bz, 3.5, 3.5, 33.4, 33.8, darkC, 0, 24);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; Ln.line([[bx + Math.cos(a) * 3.4, 33.8, bz + Math.sin(a) * 3.4], [bx + Math.cos(a) * 3.4, 34.9, bz + Math.sin(a) * 3.4]], 0.05, darkC, 0.9); }
  Lamp.grid(14, 1, (u, v) => { const a = u * Math.PI * 2; return { p: [bx + Math.cos(a) * 1.55, 34.0 + v * 2.5, bz + Math.sin(a) * 1.55], c: giltC, a: [3, 0.5 + 0.3 * v, 0.55, 0] }; });
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; M.tube([bx + Math.cos(a) * 1.6, 33.8, bz + Math.sin(a) * 1.6], [bx + Math.cos(a) * 1.6, 36.6, bz + Math.sin(a) * 1.6], 0.06, 0.06, darkC, 4); }
  round(bx, bz, 1.9, 0.12, 36.5, 39.0, darkC, 0, 14); M.tube([bx, 39, bz], [bx, 40.6, bz], 0.06, 0.03, darkC, 4);
  M.box([bx - 3.2, 10.6, bz - 0.2], [0.12, 1.1, 0.55], 0, darkC);                                           // a door toward the mouth
  // a small light on the other head
  round(hx, hz, 1.1, 0.8, 5.4, 11.0, whiteC, 10, 10); Lamp.grid(8, 1, (u, v) => { const a = u * Math.PI * 2; return { p: [hx + Math.cos(a) * 0.62, 11.0 + v * 1.1, hz + Math.sin(a) * 0.62], c: giltC, a: [3, 0.2, 0.3, 0] }; });
  round(hx, hz, 0.8, 0.06, 12.1, 13.2, darkC, 0, 8);
  // the quays, either side of the water street
  const qL = W.quayL, qR = W.quayR, z0 = W.mouthZ + 14, zE = 1700;
  slab(qL, qL + 60, z0, zE, -1.2, W.quayY, quayC); slab(qR - 60, qR, z0, zE, -1.2, W.quayY, quayC);
  slab(qL, bx + 6, bz + 6.5, z0 + 0.5, -1.2, W.quayY, quayC); slab(hx - 6, qR, hz + 5.5, z0 + 0.5, -1.2, W.quayY, quayC);
  // the left quay (toward the sun: its fronts stand in their own shade, the light coming round and between them)
  const fL = qL + 8, fR = qR - 8, dep = 16;
  house(fL, fL + dep, 664, 698, 12.5, stone[1], roofs[0]);
  house(fL, fL + dep + 4, 704, 758, 17, stone[0], roofs[2], 3.6); portico(fL - 0.2, 720, 742, 10.5, 6, stone[4], -1);
  const camp = tower(fL + 7, 786, 4.4, 41, stone[2], roofs[0], 11);
  house(fL + 3, fL + 28, 806, 846, 15, stone[4], roofs[1]); const dl = dome(fL + 15.5, 826, W.quayY + 15, 8.2, 6.5, 10.5, stone[4], leadC);
  // the right quay (its fronts take the low sun)
  house(fR - dep, fR, 662, 690, 10, stone[5], roofs[3]);
  house(fR - dep - 6, fR - 4.5, 700, 756, 16, stone[0], roofs[1], 3.2); portico(fR + 0.2, 703, 753, 12.5, 9, stone[4], 1);
  house(fR - dep - 2, fR, 766, 838, 19, stone[2], roofs[0], 3.8);
  house(fR - 34, fR - 2, 858, 922, 17, stone[0], roofs[1]); const dr = dome(fR - 18, 890, W.quayY + 17, 12.5, 10, 17, stone[0], stone[4]);
  tower(fR - 6, 846, 3.2, 30, stone[4], roofs[1], 8);
  // the city going on up both quays into the light: plainer and plainer
  let zl = 866, zr = 936;
  for (let i = 0; i < 16; i++) { const len = rng.range(26, 60), H = rng.range(11, 24), d2 = rng.range(14, 24); house(fL + rng.range(0, 3), fL + d2, zl, zl + len, H, rng.pick(stone), rng.pick(roofs), rng.range(2.4, 4)); if (rng.chance(0.3)) tower(fL + rng.range(8, 20), zl + len * 0.5, rng.range(2.6, 3.8), rng.range(26, 46), rng.pick(stone), rng.pick(roofs), rng.range(6, 12)); zl += len + rng.range(4, 10); }
  for (let i = 0; i < 15; i++) { const len = rng.range(26, 60), H = rng.range(11, 24), d2 = rng.range(14, 24); house(fR - d2, fR - rng.range(0, 3), zr, zr + len, H, rng.pick(stone), rng.pick(roofs), rng.range(2.4, 4)); if (rng.chance(0.3)) tower(fR - rng.range(8, 20), zr + len * 0.5, rng.range(2.6, 3.8), rng.range(26, 46), rng.pick(stone), rng.pick(roofs), rng.range(6, 12)); zr += len + rng.range(4, 10); }
  dome(fL + 30, 1120, W.quayY + 20, 13, 9, 18, stone[3], leadC);
  // the bridge over the water street: two arches a side and the great middle arch, which is the way out (the opening is the engine's;
  // the stone round it is ours and stands a little before it)
  const gx = W.gate[0], gz = W.gate[1], gr = W.gate[2], gs = W.gate[3], zf = gz - 0.6, zb = gz + 8.6, bc = stone[1];
  const deckY = (x) => 17.4 - 4.6 * Math.pow(Math.min(1, Math.abs(x - gx) / 45), 1.6);
  const spans = [[gx, gr, gs]];                                              // centre x, radius, springing height
  for (const sd of [1, -1]) { spans.push([gx + sd * (gr + 3.4 + 7), 7, 2.5]); spans.push([gx + sd * (gr + 3.4 + 14 + 3 + 7), 7, 2.5]); }
  const edges = [qR]; spans.slice().sort((a, b) => a[0] - b[0]).forEach(([cx, r]) => { edges.push(cx - r, cx + r); }); edges.push(qL);
  for (const z of [zf, zb]) {
    for (let i = 0; i < edges.length; i += 2) { const x0 = edges[i], x1 = edges[i + 1]; M.grid(2, 1, (u, v) => { const x = x0 + (x1 - x0) * u, yt = deckY(x); return { p: [x, -1.2 + (yt + 1.2) * v, z], c: bc, a: [6, x - qR, -1.2 + (yt + 1.2) * v, 0] }; }); }   // piers and abutments
    for (const [cx, r, sp] of spans) M.grid(16, 1, (u, v) => { const x = cx - r + 2 * r * u, ya = sp + Math.sqrt(Math.max(0, r * r - (x - cx) * (x - cx))), yt = deckY(x); return { p: [x, ya + (yt - ya) * v, z], c: bc, a: [6, x - qR, ya + (yt - ya) * v, 0] }; });   // the wall over each arch
  }
  for (const [cx, r, sp] of spans) {
    M.grid(16, 1, (u, v) => { const a = Math.PI * u; return { p: [cx - r * Math.cos(a), sp + r * Math.sin(a), zf + (zb - zf) * v], c: bc, a: [6, v * 9, u * r * 3.14 + 30, 0] }; });  // the barrel
    for (const sd of [1, -1]) M.grid(1, 1, (u, v) => ({ p: [cx + sd * r, -1.2 + (sp + 1.2) * v, zf + (zb - zf) * u], c: bc, a: [6, u * 9, -1.2 + (sp + 1.2) * v, 0] }));             // the pier's cheeks below the springing
  }
  const ringC = stone[4];
  for (const [cx, r, sp] of spans) {                                          // the ring of each arch stands a hand proud of the wall
    const w = r < 6.9 ? 1.15 : 0.85, zr = zf - 0.24;
    M.grid(20, 1, (u, v) => { const a = Math.PI * u, rr = r + v * w; return { p: [cx - rr * Math.cos(a), sp + rr * Math.sin(a), zr], c: ringC, a: [11, u * Math.PI * r, v * w, sp + rr * Math.sin(a)] }; });
    for (const rr of [r, r + w]) M.grid(20, 1, (u, v) => { const a = Math.PI * u; return { p: [cx - rr * Math.cos(a), sp + rr * Math.sin(a), zr + (zf - zr) * v], c: ringC, a: [11, u * Math.PI * r, rr - r, sp + rr * Math.sin(a)] }; });
    for (const sd of [1, -1]) M.box([cx + sd * (r + w * 0.5), sp - 0.28, zf - 0.2], [w * 0.5 + 0.12, 0.28, 0.32], 0, ringC);                                                    // an impost under each foot of the ring
  }
  M.box([gx, gs + gr + 0.62, zf - 0.34], [0.5, 1.0, 0.3], 0, ringC, null, 1.3);                                                                                               // the keystone
  const piers = []; for (let i = 2; i < edges.length - 2; i += 2) piers.push([(edges[i] + edges[i + 1]) / 2, (edges[i + 1] - edges[i]) / 2]);
  for (const [px, hw] of piers) {                                             // cutwaters: each pier's nose toward the mouth, capped with a slope
    const tall = Math.abs(px - gx) < 12, yt = tall ? gs - 0.4 : 3.4, nz = zf - 2.6;
    wall(px - hw, zf, px, nz, -1.2, yt, bc, 6); wall(px, nz, px + hw, zf, -1.2, yt, bc, 6);
    M.quad([px - hw, yt, zf], [px, yt, nz], [px, yt + 1.5, zf], [px, yt + 1.5, zf], ringC); M.quad([px, yt, nz], [px + hw, yt, zf], [px, yt + 1.5, zf], [px, yt + 1.5, zf], ringC);
  }
  for (const [px, hw] of piers) {                                             // over each pier a strip of stone runs up the wall; on the outer two a figure stands on the parapet
    const tall = Math.abs(px - gx) < 12, y0 = (tall ? gs - 0.4 : 3.4) + 1.5, y1 = deckY(px) - 0.5;
    M.box([px, (y0 + y1) / 2, zf - 0.13], [Math.min(hw, 1.1), (y1 - y0) / 2, 0.13], 0, bc.clone().lerp(ringC, 0.3), [6, px - qR, (y0 + y1) / 2, 0]);
    if (!tall) statue(px, deckY(px) + 1.1, zf - 0.3, 2.7, ringC);
  }
  M.grid(30, 1, (u, v) => { const x = qR + (qL - qR) * u; return { p: [x, deckY(x) - 0.5, zf - 0.5 + 0.5 * v], c: bc }; });                                                     // under the parapet's overhang
  for (let x = qR + 1.2; x < qL - 0.6; x += 1.5) M.box([x, deckY(x) - 0.78, zf - 0.2], [0.2, 0.28, 0.2], 0, ringC, null, 1);                                                    // a table of corbels under it
  M.grid(30, 1, (u, v) => { const x = qR + (qL - qR) * u; return { p: [x, deckY(x), zf - 0.5 + (zb - zf + 1.0) * v], c: quayC }; });                                           // the roadway
  for (const z of [zf - 0.5, zb + 0.5]) for (const dz of [0, 0.35]) M.grid(30, 1, (u, v) => { const x = qR + (qL - qR) * u; return { p: [x, deckY(x) - 0.5 + 1.6 * v, z + dz * (z < gz ? 1 : -1)], c: bc, a: [6, x - qR, v * 1.6 + 30, 0] }; });   // parapets
  for (const sd of [1, -1]) { const x = gx + sd * (gr + 1.7), y = deckY(x) + 1.1; M.box([x, y + 2.4, zf - 0.3], [0.5, 2.4, 0.5], 0, bc, null, 0.45); Lamp.box([x, y + 5.3, zf - 0.3], [0.3, 0.42, 0.3], 0, giltC, [3, 0.5, 0.5, 0], 0.7); }
  for (let i = 0; i < 9; i++) { const x = rng.range(qR + 4, qL - 4); figure(M, x, deckY(x), zf + rng.range(0.4, 1.6), rng.range(1.5, 1.75), rng.pick(manC), 0); }
  // people on the quays and the mole, small as dabs
  people(qL + 1.5, fL - 1, 668, 850, 26); people(fR + 1, qR - 1.5, 668, 850, 26); people(bx + 12, bx + 60, bz - 4, bz + 5, 6);
  // mooring posts along the quay edges
  for (let z = 672; z < 900; z += 12) { M.tube([qL + 0.7, W.quayY, z], [qL + 0.7, W.quayY + 0.9, z], 0.2, 0.17, darkC, 5); M.tube([qR - 0.7, W.quayY, z + 5], [qR - 0.7, W.quayY + 0.9, z + 5], 0.2, 0.17, darkC, 5); }
  return { campanile: [fL + 7, camp, 786], domeR: [fR - 18, dr, 890], domeL: [fL + 15.5, dl, 826], lamp: [bx, 35.2, bz],
    boxes: [{ c: [bx, 4.4, bz], h: [8.6, 5.6, 8.6], col: moleC }, { c: [bx, 22, bz], h: [2.6, 12, 2.6], col: whiteC }, { c: [qL + 16, 9, 712], h: [10, 8, 46], col: stone[0] }, { c: [qR - 16, 9, 750], h: [10, 9, 88], col: stone[0] }] };
}

// a person, small: a body narrowing to the shoulders, a head; h is the height standing (sitting: give 0.62 of it), lean in metres at the head
export function figure(M, x, y, z, h, c, lean = 0, hat = null) {
  const sh = h * 0.8;
  M.tube([x, y, z], [x + lean * 0.8, y + sh, z], 0.2 * h / 1.7, 0.15 * h / 1.7, c, 6);
  M.tube([x + lean * 0.8, y + sh, z], [x + lean, y + sh + 0.07, z], 0.15 * h / 1.7, 0.06, c, 6);
  M.tube([x + lean, y + sh + 0.04, z], [x + lean, y + h, z], 0.1, 0.085, hat || C3('#B98C6A'), 5);
  if (hat) M.tube([x + lean, y + h - 0.07, z], [x + lean, y + h - 0.03, z], 0.2, 0.2, hat, 6);
}

// a small coasting vessel lying at a quay, bare poled; s is her size (1: 20 m). dry (four colours): her sails loosed to dry as she lies at anchor.
// set (with dry's colours): a brig under sail instead, close hauled on the starboard tack: yards braced sharp, canvas full, jibs and a spanker.
const sailForm = (a, b) => 1 - 0.2 * Math.pow(Math.abs(a * 2 - 1), 2.2) + 0.07 * Math.sin(Math.PI * a) * Math.sin(Math.PI * b) - 0.1 * sm(0.72, 1, b) - 0.05 * sm(0.25, 0, b);   // a sail's own modelling: a across it, b up it
export function drawCoaster(M, Ln, s = 1, dry = null, set = 0) {
  const brace = set ? -0.58 : 0, cb = Math.cos(brace), sb = Math.sin(brace);
  const hullC = C3(dry ? '#4A3A2E' : '#3A2E26'), strakeC = C3('#A8946E'), wale = C3(dry ? '#7A2E22' : '#3A2E26'), deckC = C3('#6B5844'), mastC = C3('#8A7556'), ropeC = C3('#3A3028'), sailC = C3('#E6DCC6');
  const railAt = (u) => (1.5 + 0.8 * sm(0.62, 1.0, u) + 0.9 * sm(0.24, 0, u)) * s;
  const halfAt = (u, y) => { const st = Math.pow(Math.sin(Math.min(1, u / 0.26) * Math.PI / 2), 0.6), bw = u < 0.6 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.6) / 0.4, 2.0)), 0.6); return 2.9 * s * (0.5 + 0.5 * st) * bw * (0.78 + 0.22 * sm(-1, 1.2, y / s)); };
  const zAt = (u, y) => (-10 + 20 * u) * s + 0.3 * Math.max(0, y) * sm(0.75, 1, u);
  for (const sd of [1, -1]) M.grid(22, 6, (u, t) => { const R = railAt(u), y = -1.0 * s + t * (R + 1.0 * s); return { p: [sd * halfAt(u, y), y, zAt(u, y)], c: y > R - 0.4 * s ? strakeC : (y > R - 0.95 * s && y < R - 0.6 * s ? wale : hullC), a: [12, u * 20 * s, y, 0] }; });
  M.grid(4, 6, (a, t) => { const y = -1.0 * s + t * (railAt(0) + 1.0 * s); return { p: [(a * 2 - 1) * halfAt(0, y), y, zAt(0, y)], c: y > railAt(0) - 0.4 * s ? strakeC : hullC, a: [12, a * 4 * s, y, 0] }; });
  if (dry) for (const sd of [1, -1]) M.quad([sd * 0.5 * s, 0.85 * s, -10 * s - 0.04], [sd * 0.82 * s, 0.85 * s, -10 * s - 0.04], [sd * 0.5 * s, 1.16 * s, -10 * s - 0.04], [sd * 0.82 * s, 1.16 * s, -10 * s - 0.04], C3('#E9B95C'), [3, 0.35, 0.05, 0]);   // her cabin's lamp behind two stern lights
  M.grid(16, 2, (u, a) => { const R = railAt(u) - 0.5 * s; return { p: [(a * 2 - 1) * (halfAt(u, R) - 0.1), R, zAt(u, R)], c: deckC }; });
  [[4.2, 21, 13], [-4.6, 17.5, 10.5]].forEach(([mz, top, yl], mi) => {
    mz *= s; top *= s; yl *= s;
    M.tube([0, 1 * s, mz], [0, top, mz - 0.3 * s], 0.24 * s, 0.1 * s, mastC, 6);
    const yards = [[top * 0.52, yl * 0.5], [top * 0.8, yl * 0.36]];
    if (dry) {                                                              // her sails loosed to dry: they hang from the yards in the still air, their feet stirring
      const hang = (yh, lh, yf, lf, up, col, belly) => M.grid(12, 8, (a, b) => {
        const t = a * 2 - 1, l = (lf + (lh - lf) * b) * (1 - 0.07 * Math.sin(Math.PI * b)), y = yf + up * Math.sin(Math.PI * a) * (1 - b) + (yh - yf) * b;   // the leeches hollow a little: no edge of a sail is ruled
        const bel = belly * Math.sin(Math.PI * a) * Math.sin(Math.PI * Math.min(1, 0.1 + 0.9 * b) * 0.95);
        const cf = col.clone().multiplyScalar(sailForm(a, b) * (set ? 1 - 0.17 * Math.exp(-Math.pow(t * l / (0.7 * s), 2)) : 1));   // under sail against the light, the mast stands dark through the cloth
        if (set) return { p: [t * l * cb - bel * sb, y + t * 0.1 * b, mz + 0.42 * s + t * l * sb + bel * cb], c: cf, a: [edge4(a, b), t * l * 0.9, 0.02 + 0.96 * b, 0.03 * s * (1 - b) * (1 - b)] };   // full of wind, bellied forward and to leeward
        const z = mz + 0.3 * s + t * l * 0.1 - bel - 0.12 * s;
        return { p: [t * l, y + t * 0.1 * b, z], c: cf, a: [edge4(a, b), t * l * 0.9, 0.02 + 0.96 * b, 0.1 * s * (1 - b) * (1 - b)] };
      });
      hang(yards[0][0] - 0.25 * s, yards[0][1] * 0.93, 3.6 * s, yards[0][1] * 0.82, (set ? 0.55 : 1.1) * s, dry[mi * 2], (set ? 1.5 : 0.7) * s);
      hang(yards[1][0] - 0.2 * s, yards[1][1] * 0.93, yards[0][0] + 0.55 * s, yards[0][1] * 0.86, (set ? 0.45 : 0.9) * s, dry[mi * 2 + 1], (set ? 1.1 : 0.5) * s);
    }
    for (const [y, l] of yards) {
      for (const sd of [1, -1]) M.tube([0, y, mz + 0.3 * s], set ? [sd * l * cb, y + sd * 0.1, mz + 0.3 * s + sd * l * sb] : [sd * l, y + sd * 0.1, mz + 0.3 * s + sd * l * 0.1], 0.12 * s, 0.06 * s, mastC, 5);
      if (!dry) M.grid(6, 4, (a, b) => { const t = a * 2 - 1, an = b * Math.PI * 2, rr = 0.2 * s * (1.4 - 0.6 * Math.abs(t)); return { p: [t * l * 0.92, y + 0.2 * s + Math.sin(an) * rr, mz + 0.3 * s + t * l * 0.092 + Math.cos(an) * rr], c: sailC }; });
      for (const sd of [1, -1]) Ln.line([[0, y + 2.4 * s, mz], set ? [sd * l * 0.96 * cb, y + sd * 0.1, mz + 0.3 * s + sd * l * 0.96 * sb] : [sd * l * 0.96, y + sd * 0.1, mz + 0.3 * s + sd * l * 0.096]], 0.04, ropeC, 0.7);
    }
    for (const sd of [1, -1]) for (let j = 0; j < 3; j++) Ln.line([[sd * 0.3 * s, top * 0.6, mz], [sd * 2.75 * s, 1.6 * s, mz - (0.6 + j * 0.8) * s]], 0.05, ropeC, 0.8);
    Ln.line([[0, top * 0.95, mz], [0, (mi ? 6 : 2.6) * s, mz + (mi ? 8.2 : 6.5) * s]], 0.05, ropeC, 0.8);
  });
  M.tube([0, 2.2 * s, 9.2 * s], [0, 4.6 * s, 14.5 * s], 0.16 * s, 0.08 * s, mastC, 5);
  if (dry) {
    if (!set) Ln.line([[0.5 * s, 2.0 * s, 9.6 * s], [0.9 * s, 0.4, 13 * s], [1.2 * s, -0.6, 15.5 * s]], 0.09, ropeC, 0.95);       // her cable, to the anchor ahead of her
    if (set) {                                                             // two jibs out to the bowsprit, a spanker abaft the main: all drawing, sheeted to leeward (port)
      const jib = (head, tk, cl, col) => M.grid(6, 6, (a, b) => { const q = lerp3(lerp3(tk, cl, a), head, b); q[0] += 0.55 * s * Math.sin(Math.PI * a) * Math.sin(Math.PI * b * 0.9); return { p: q, c: col.clone().multiplyScalar(sailForm(a, 0.5) - 0.1 * b), a: [edge4(a, b), a * 4, 0, 0.03 * s * a * (1 - b)] }; });
      jib([0, 19.5 * s, 4.0 * s], [0, 4.5 * s, 14.2 * s], [0.9 * s, 3.2 * s, 6.6 * s], dry[1]); jib([0, 15.5 * s, 4.1 * s], [0, 3.6 * s, 11.8 * s], [0.8 * s, 3.0 * s, 5.6 * s], dry[0]);
      M.tube([0, 4.2 * s, -4.9 * s], [1.6 * s, 4.6 * s, -11.6 * s], 0.11 * s, 0.07 * s, mastC, 5); M.tube([0, 11.6 * s, -4.9 * s], [1.3 * s, 14.4 * s, -9.8 * s], 0.09 * s, 0.05 * s, mastC, 5);
      M.grid(8, 8, (a, b) => { const q = lerp3(lerp3([0, 4.4 * s, -4.9 * s], [1.6 * s, 4.8 * s, -11.5 * s], a), lerp3([0, 11.5 * s, -4.9 * s], [1.3 * s, 14.3 * s, -9.7 * s], a), b); q[0] += 0.6 * s * Math.sin(Math.PI * a) * Math.sin(Math.PI * b); return { p: q, c: dry[2].clone().multiplyScalar(sailForm(a, b)), a: [edge4(a, b), a * 5, 0, 0.03 * s * a] }; });
    }
    M.grid(10, 2, (a, b) => ({ p: [0, 21 * s - 0.25 * a * s - (b - 0.5) * 0.5 * s * (1 - a), 4.2 * s - 0.4 - a * 7.5 * s], c: C3('#B23A26'), a: [4, a * 7.5 * s, 0, 0.28 * a] }));   // a long pennant at the main truck, streaming aft
    for (const [x, z, h, c] of [[0.9, -6.5, 1.7, '#2B2A33'], [-1.2, -1.5, 1.65, '#6B2E22'], [0.4, 6.2, 1.7, '#3E4A5E']]) figure(M, x * s, railAt(0.4) - 0.5 * s, z * s, h, C3(c), 0.05);
    return { boxes: [{ c: [0, 0.9 * s, 0], h: [2.7 * s, 1.5 * s, 9.6 * s], col: hullC }, { c: [0, 11.5 * s, 0], h: [5.6 * s, 8.5 * s, 5.2 * s], col: sailC }] };
  }
  return { boxes: [{ c: [0, 0.9 * s, 0], h: [2.7 * s, 1.5 * s, 9.6 * s], col: hullC }] };
}

// a rowing boat with two or three people in her; lies low
export function drawSkiff(M, n = 2) {
  const hullC = C3('#3E3026'), sheerC = C3('#B48D56'), inC = C3('#A58A62'), manC = [C3('#D8CCB2'), C3('#8E3122'), C3('#3E4A5E')];   // a pale strake along her sheer, a man in his shirt: a boat with people in her, not a dark chip
  const halfAt = (u) => 0.85 * Math.pow(Math.sin(Math.min(1, u / 0.3) * Math.PI / 2), 0.7) * (u < 0.55 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.55) / 0.45, 2)), 0.6));
  for (const sd of [1, -1]) M.grid(10, 2, (u, t) => ({ p: [sd * halfAt(u) * (0.7 + 0.3 * t), -0.25 + t * 0.85, -2.6 + 5.2 * u], c: t > 0.75 ? sheerC : hullC }));
  M.grid(8, 1, (u, a) => ({ p: [(a * 2 - 1) * halfAt(u) * 0.8, 0.12, -2.6 + 5.2 * u], c: inC }));
  for (let i = 0; i < n; i++) figure(M, i ? 0 : 0.05, 0.28, -1.4 + i * 1.5, 1.02, manC[i % 3], i ? 0.1 : -0.06, i ? null : C3('#2A2622'));
  for (const sd of [1, -1]) M.tube([sd * 0.7, 0.6, 0.1], [sd * 2.5, 0.15, -0.5], 0.035, 0.05, inC, 4);
  return {};
}

// ---- gulls: each wheels on a level ring of its own, set by the world clear of the flown line; wings beat and glide by the clock ----
export function buildGulls(U, gulls) {
  const n = gulls.length, g = new THREE.InstancedBufferGeometry();
  // one bird: x along the span (-1..1), z along the chord; the body is the middle strip
  const pos = [], idx = [];
  const strip = [[-1, 0.0, 0.03], [-0.62, 0.1, 0.2], [-0.22, 0.0, 0.3], [0, 0.0, 0.42], [0.22, 0.0, 0.3], [0.62, 0.1, 0.2], [1, 0.0, 0.03]];      // x, sweep, half chord
  strip.forEach(([x, sw, hc]) => { pos.push(x, 0, sw + hc, x, 0, sw - hc); });
  for (let i = 0; i < strip.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const C = new Float32Array(n * 4), K = new Float32Array(n * 4);
  gulls.forEach((q, i) => { C.set([q.c[0], q.c[1], q.c[2], q.r], i * 4); K.set([q.speed, q.phase, q.flap, q.size], i * 4); });
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(K, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aC, aK; uniform float uT; varying vec3 vW; varying float vUp, vTip;
      void main(){
        float a = aK.y + uT * aK.x / aC.w, cs = cos(a), sn = sin(a), dir = sign(aK.x);
        vec3 ctr = aC.xyz + vec3(cs * aC.w, sin(uT * .5 + aK.y * 3.) * .8, sn * aC.w);
        vec3 fwd = vec3(-sn, 0., cs) * dir, out_ = vec3(cs, 0., sn), up = vec3(0., 1., 0.);
        float beat = sin(uT * aK.z + aK.y * 7.), glide = smoothstep(-.2, .5, sin(uT * .37 + aK.y * 5.));      // beats a while, then holds its wings out
        float ang = mix(beat * .75, .12, glide), ax = abs(position.x);
        vec3 right = out_ * dir * -1.;
        vec3 bank = normalize(up + out_ * -.35);                                                               // leaning into the turn
        vec3 w = ctr + (right * position.x * cos(ang * ax) + bank * (ax * sin(ang * ax) * 1.1 - .06 * ax * ax) + fwd * position.z * .55) * aK.w;
        vW = w; vUp = sin(ang * ax); vTip = ax;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`varying vec3 vW; varying float vUp, vTip;
      ${TURNER_GLSL}
      void main(){
        vec3 rd = normalize(vW - cameraPosition);
        vec3 col = mix(mix(cDusk, cSlate, .3) * .9, mix(cPearl, cCore, .5), gl_FrontFacing ? .75 : .3);
        col = mix(col, cUmber * 1.6, smoothstep(.8, 1., vTip) * .7);                                           // dark wing tips
        col = mix(col, mix(cGold, cLemon, .5), smoothstep(.55, .98, dot(rd, uSun)) * .55);                     // against the sun they are flecks of light
        gl_FragColor = vec4(tAirK(col, vW, .5), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'gulls';
  return mesh;
}

// a bell buoy: a red can, a cage over it, a top mark
export function drawBuoy(M, Ln) {
  const red = C3('#8E2F22'), black = C3('#221C1A'), iron = C3('#3A3430');
  M.grid(18, 6, (u, v) => { const a = u * Math.PI * 2, r = 1.35 - 0.75 * v * v; return { p: [Math.cos(a) * r, -0.6 + v * 2.3, Math.sin(a) * r], c: v > 0.34 && v < 0.67 ? black : red, a: [12, u * 8.5, -0.6 + v * 2.3, 0] }; });
  M.grid(12, 1, (u, v) => { const a = u * Math.PI * 2; return { p: [Math.cos(a) * 0.6 * v, 1.7, Math.sin(a) * 0.6 * v], c: red }; });
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; M.tube([Math.cos(a) * 0.55, 1.7, Math.sin(a) * 0.55], [Math.cos(a) * 0.2, 3.7, Math.sin(a) * 0.2], 0.05, 0.04, iron, 4); }
  M.box([0, 2.65, 0], [0.2, 0.24, 0.2], 0.3, C3('#B08D4A'), null, 0.55);                                    // the bell
  M.box([0, 4.0, 0], [0.26, 0.26, 0.26], 0.78, red);
  return { boxes: [{ c: [0, 1.3, 0], h: [0.9, 2.4, 0.9], col: red }] };
}

// ---- the hero for the set-piece viewer: the old ship and her tug, the hawser between them, the tug's smoke ------------------------
// (The world sets the same pieces out itself, a longer tow apart; here they stand close enough to be turned about and judged alone.)
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const U = makeUniforms('fire', new THREE.Vector3(rng.range(0, 40), rng.range(0, 40), rng.range(0, 40)));
  U.uSq.value.set(0, 0, 100, 0); U.uSwell.value.set(0.14, 0, 0, 0);
  const object = new THREE.Group(); object.name = 'squall-of-light-hero';
  const solid = solidMaterial(U), lines = lineMaterial(U), geos = [];
  const put = (parent, geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; parent.add(m); geos.push(geo); return m; };
  const shipG = new THREE.Group(); object.add(shipG);
  const sM = new Mesher(), sL = new Liner(), ship = drawShip(sM, sL, rng.fork ? rng.fork('ship') : rng);
  await ctx.yield();
  put(shipG, sM.geometry(), solid); put(shipG, sL.geometry(), lines, 5);
  await ctx.yield();
  const tugG = new THREE.Group(); tugG.position.set(17, 0, 82); tugG.rotation.y = 0.17; object.add(tugG);
  const tM = new Mesher(), tL = new Liner(), tW = new Mesher(), tug = drawTug(tM, tL, tW, rng.fork ? rng.fork('tug') : rng);
  put(tugG, tM.geometry(), solid); put(tugG, tL.geometry(), lines, 5);
  const wheels = put(tugG, tW.geometry(), solid); wheels.position.set(tug.shaft[0], tug.shaft[1], tug.shaft[2]);
  await ctx.yield();
  const toWorld = (g, q) => { const c = Math.cos(g.rotation.y), sn = Math.sin(g.rotation.y); return [g.position.x + q[0] * c + q[2] * sn, q[1], g.position.z - q[0] * sn + q[2] * c]; };
  const hL = new Liner(), hA = toWorld(shipG, ship.hawse), hB = toWorld(tugG, tug.tow), hp = [];
  for (let i = 0; i <= 30; i++) { const k = i / 30; hp.push([hA[0] + (hB[0] - hA[0]) * k, hA[1] + (hB[1] - hA[1]) * k - 4.2 * 4 * k * (1 - k), hA[2] + (hB[2] - hA[2]) * k]); }
  hL.line(hp, 0.11, C3('#7A664A'), 1);
  put(object, hL.geometry(), lines, 5);
  const puffs = [], pr = rng.fork ? rng.fork('puffs') : rng, fW = toWorld(tugG, tug.funnel), nS = Math.round(80 * detail);
  for (let i = 0; i < nS; i++) puffs.push({ p0: [fW[0], fW[1] + 0.2, fW[2]], v: [-0.45 * 120, 4, -0.89 * 120], phase: (i + pr()) / nS, rate: 1 / 26, r0: 0.75, r1: pr.range(8, 13), rise: pr.range(24, 32), wob: pr.range(1.2, 3), seed: pr(), mode: 0 });
  const puffMesh = buildPuffs(U, puffs); object.add(puffMesh);
  const size = new THREE.Vector2();
  return {
    object, radius: 78, height: 62, center: new THREE.Vector3(5, 20, 34),
    anchors: { hawse: ship.hawse.slice(), tow: hB, funnel: fW, trucks: ship.trucks },
    update(dt, time) {
      U.uT.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uRes.value.copy(size); }
      shipG.rotation.z = Math.sin(time * 0.52) * 0.006; tugG.rotation.z = Math.sin(time * 1.5) * 0.02; tugG.position.y = Math.sin(time * 1.9) * 0.1;
      wheels.rotation.x = time * 2.3;
    },
    dispose() { for (const g of geos) g.dispose(); puffMesh.geometry.dispose(); puffMesh.material.dispose(); solid.dispose(); lines.dispose(); U.uNoise.value.dispose(); },
    ground: true, groundY: 0,
  };
}
