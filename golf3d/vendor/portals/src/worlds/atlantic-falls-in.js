// Where the Sea Ends · 5.33 million years ago (deep-time crew).
// The Strait of Gibraltar in the first weeks of the Pliocene: the Atlantic has cut through into a Mediterranean dried
// to a salt desert 1.5 km below sea level. We hold y 8 from the first metre to the last; only the world falls.
// World space == the hero's local space: x = brief x - 520 (east is +x), y 0 is the old sea level, north is -z.
// Nothing here uses three.js lights: every material is a ShaderMaterial fed by the hero's shared light uniforms.
import * as THREE from 'three';
import { makePath, smoothstep, clamp, lerp } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { buildHero, buildGannets, FLOOD_FAR, normalsAsync } from '../parts/atlantic-falls-in.js';

const XO = 520;
const TAU = Math.PI * 2;
const DIVE = [{ u0: 0.083, ahead: 20, side: 5.5 }, { u0: 0.097, ahead: 6, side: -4 }];      // the two plungers: when each starts its climb, and where it strikes (metres ahead of and beside the lens at that moment)
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// The three hours (the brief's variations). Colours are the brief's palette, re-keyed per hour.
const MOODS = {
  gold: {
    palette: ['#1C4FA0', '#2F9C8E', '#F3F7F5', '#C9A46A', '#EFE6D2', '#8FB0CF', '#F4C56A'],
    sunDir: [-0.828, 0.407, 0.386], sunColor: '#F9DDA6', sunI: 1.18, sky: '#5E8FD0', skyI: 0.42, bounce: '#C9A46A', bounceI: 0.30,
    zenith: '#2E66B8', horizon: '#8FB0CF', ground: '#B5A68E', fog: '#9BB3CC', fogD: 0.00040, shade: '#5F7FA8',
    cloudLit: '#FBEBC6', cloudShade: '#7F9FC4', floorA: '#C9A46A', floorB: '#EFE6D2', exposure: 1.0, preset: 'day', disc: 0,
  },
  noon: {
    palette: ['#1A58B0', '#27B3A6', '#F3F7F5', '#CDB58C', '#DDD3BC', '#9FBEDB', '#FFF3D0'],
    sunDir: [-0.52, 0.80, 0.30], sunColor: '#FFF6E6', sunI: 1.15, sky: '#6FA2E0', skyI: 0.46, bounce: '#D8C8A4', bounceI: 0.34,
    zenith: '#2A6DC8', horizon: '#A9C8E4', ground: '#C4BBA6', fog: '#AEC6DD', fogD: 0.00036, shade: '#526E96',
    cloudLit: '#FFFFFF', cloudShade: '#8FA9C8', floorA: '#B89868', floorB: '#E4D9BE', exposure: 0.9, preset: 'day', disc: 0,
  },
  pearl: {
    palette: ['#2A4F86', '#3A9488', '#EDF1F0', '#B5A58A', '#DDD8CA', '#A3B2C2', '#F1EAD8'],
    sunDir: [-0.70, 0.62, 0.36], sunColor: '#E9E6DE', sunI: 0.74, sky: '#9FB0C4', skyI: 0.78, bounce: '#B7AC98', bounceI: 0.34,
    zenith: '#8D9CB0', horizon: '#C3CBD2', ground: '#B3AEA2', fog: '#B4BEC8', fogD: 0.00046, shade: '#64788F',
    cloudLit: '#E8E8E4', cloudShade: '#7C8A9C', floorA: '#B9A886', floorB: '#E2DCCB', exposure: 1.04, preset: 'overcast', disc: 0,
  },
};

// Fog chunks shared by every shader in this file (scene.fog is a FogExp2 that never changes).
const FOG_V = /* glsl */`
#ifdef USE_FOG
varying float vFogDepth;
#endif
`;
const FOG_F = /* glsl */`
#ifdef USE_FOG
uniform vec3 fogColor; uniform float fogDensity; varying float vFogDepth;
#endif
vec3 fogMix(vec3 c){
#ifdef USE_FOG
  return mix(c, fogColor, 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
#else
  return c;
#endif
}
float fogAmt(){
#ifdef USE_FOG
  return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
#else
  return 0.;
#endif
}
`;
const NOISE_G = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ return 0.5 * vn(p) + 0.3 * vn(p * 2.03 + 17.1) + 0.2 * vn(p * 4.11 + 41.7); }
`;
const fogUniforms = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const shader = (U, names, extra, vertexShader, fragmentShader, opts = {}) => {
  const uniforms = fogUniforms(); for (const n of names) uniforms[n] = U[n]; Object.assign(uniforms, extra || {});
  return new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, fog: true, ...opts });
};

// ---------------------------------------------------------------------------------------------------------
// THE EMPTY SEA: the basin floor, the jade lake and the lower chute (third scale under extra haze), the old
// coast's escarpment behind the ring, and Jebel Musa across the tongue.
// ---------------------------------------------------------------------------------------------------------
const ESC_PTS = [[330, -500], [400, -610], [520, -690], [680, -680], [900, -590], [1200, -450], [1600, -340], [2300, -380], [3300, -620], [4600, -1100]];
function makeEscLine() {                     // the escarpment's foot line: z as a function of x, and the curve itself
  const curve = new THREE.CatmullRomCurve3(ESC_PTS.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  const N = 240, pts = curve.getSpacedPoints(N);
  const zAt = (x) => {
    if (x <= pts[0].x) return pts[0].z - (pts[0].x - x) * 0.2;
    for (let i = 1; i <= N; i++) if (pts[i].x >= x) { const a = pts[i - 1], b = pts[i], t = (x - a.x) / Math.max(b.x - a.x, 1e-3); return a.z + (b.z - a.z) * t; }
    return pts[N].z;
  };
  return { pts, zAt, N, curve };
}
const rampYw = (x) => { const bx = x + XO, u = Math.max(bx - 330, 0); return -4 * smoothstep(200, 330, bx) - (u - 185 * (1 - Math.exp(-u / 185))); };
// The basin: where the lower chute runs and where it ends. First weeks: a small jade lake 2.2 km out. Months on: a
// blue sea that has drowned the low salt, the chute shorter, today's islands standing in it.
const basinOf = (sea) => (sea
  ? { sea: 1, x: 3900, z: 350, r: 1750, level: -656, chEnd: 2060 }
  : { sea: 0, x: 2450, z: 420, r: 290, level: -672, chEnd: 2200 });
const chZc = (x) => lerp(30, 140, smoothstep(540, 1900, x));                        // the chute's centre line and half-width:
const chHw = (x) => 130 + 660 * Math.pow(1 - smoothstep(540, 1900, x), 1.6);        // a kilometre and a half wide under the ribbon, a river by the lake
const bedOf = (x) => (x < 540 ? rampYw(x) - 34 : lerp(-587, -652, smoothstep(540, 1000, x)));     // the flood's bed; its surface is 34 m higher under the hero's ribbon
function floorY(x, z, esc, noise, B) {
  const bed = bedOf(x);
  // the flood has cut its own channel into the salt: the plain stands 46 m above the water once the chute narrows
  const cn = Math.abs(z - chZc(x)) / chHw(x);
  // (a ragged bank: a low wet bench, then the riser to the plain, both wandering in and out by a tenth of the channel's width)
  const bnz = 0.10 * noise.n2(x * 0.0042, z * 0.0042) + 0.05 * noise.n2(x * 0.012, z * 0.012 + 7);
  const land = 0.34 * smoothstep(0.93, 1.0, cn + bnz) + 0.66 * smoothstep(1.05, 1.2, cn + 1.5 * bnz + 0.03 * noise.n2(x * 0.03, z * 0.03));      // east of the water the channel runs on as a dry canyon
  let y = bed + 46 * smoothstep(700, 1300, x) * land;
  // (the old coast's scree aprons are the escarpment's own lowest rows: they plunge into the flood and make its shore)
  y += 300 * smoothstep(1100, 2300, z) * smoothstep(300, 900, x);                    // the African side rising to the south
  const far = smoothstep(900, 2200, x) * (0.3 + 0.7 * land);
  y += far * (26 * noise.fbm2(x * 0.0011, z * 0.0011, 3) + 9 * noise.n2(x * 0.006, z * 0.006));
  const dl = Math.hypot(x - B.x, z - B.z);
  for (let i = 0; i < 5; i++) {                                                     // today's islands standing as mountains
    const mx = 2700 + 900 * i + 500 * hash(i * 3.1), mz = -900 + 2600 * hash(i * 7.7 + 2), r = 380 + 300 * hash(i + 9), dd = ((x - mx) * (x - mx) + (z - mz) * (z - mz)) / (r * r);
    const clear = B.sea ? 1 : smoothstep(500, 1000, Math.hypot(mx - B.x, mz - B.z)) * smoothstep(250, 600, Math.abs(mz - 140) + Math.max(mx - B.chEnd, 0));
    y += clear * (230 + 160 * hash(i + 4)) * Math.exp(-dd * 1.6) * (0.8 + 0.25 * noise.n2(x * 0.004 + i, z * 0.004));
  }
  // the bowl the water stands in
  return y - (B.sea ? 90 * (1 - smoothstep(B.r * 0.72, B.r * 1.08, dl)) : 80 * (1 - smoothstep(B.r * 0.5, B.r * 1.3, dl)) + 46 * (1 - smoothstep(B.r * 0.9, B.r * 1.5, dl)));
}

const FLOOR_VERT = /* glsl */`
varying vec3 vP, vN; varying float vTerr;
attribute float aTerr;
${FOG_V}
void main(){ vP = position; vN = normal; vTerr = aTerr; vec4 mv = modelViewMatrix * vec4(position, 1.);
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix * mv; }`;
const FLOOR_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uCam, uHaze, uWhite, uGreen, uFloorA, uFloorB, uLakeCol, uShalCol, uFarCol, uShade;
uniform float uTime, uShafts, uProg;
uniform vec4 uCl[14];
uniform vec4 uBasin;                      // the standing water: centre x, z, radius, level
uniform vec2 uCh;                         // x where the chute meets it; 1 when it is the sea
uniform vec4 uTow; uniform vec2 uTowD;    // the spray tower's shadow on the floor: centre x, z, radius along and across the sun's line; that line
varying vec3 vP, vN; varying float vTerr;
${FOG_F}
${NOISE_G}
${FLOOD_FAR}
float rampY(float bx){ float u = max(bx - 330., 0.); return -4. * smoothstep(200., 330., bx) - (u - 185. * (1. - exp(-u / 185.))); }
void main(){
  vec2 p = vP.xz; float dist = length(uCam - vP);
  float n1 = fbm3(p * 0.0016 + 3.), n2 = fbm3(p * 0.0075), n3 = vn(p * 0.03);
  float lod = 1. - smoothstep(900., 2600., dist);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float steep = clamp((1. - N.y) * 5., 0., 1.);
  // salt pans (white) on the flats, ochre fans and gypsum on anything that slopes, scree under the old coast
  float salt = smoothstep(0.30, 0.50, n1 + 0.25 * n2 - vTerr * 0.5 - steep * 0.6);
  vec3 col = mix(mix(uFloorA, uFloorB, 0.3 + 0.3 * steep) * (0.6 + 0.45 * n2), uFloorB * (0.84 + 0.18 * n3), salt);
  col = mix(col, mix(uFloorB * 0.6, uShade, 0.4) * (0.6 + 0.4 * n3), vTerr * 0.7 * (0.6 + 0.4 * vn(vec2(p.x * 0.05, p.y * 0.012))));
  // salt polygons: cells that fade to their mean tone before they pass two pixels
  vec2 g = p / 46.; vec2 gi = floor(g), gf = fract(g); float e1 = 1., e2 = 1.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); vec2 c = o + vec2(h21(gi + o), h21(gi + o + 71.3)) - gf; float d = dot(c, c); if (d < e1) { e2 = e1; e1 = d; } else if (d < e2) e2 = d; }
  float edge = smoothstep(0.0, 0.16, sqrt(e2) - sqrt(e1));
  col *= mix(1., 0.80 + 0.2 * edge, salt * lod);
  // the chute's course (the same numbers as chZc / chHw in the world file)
  float sx = smoothstep(540., 1900., vP.x), zc = mix(30., 140., sx), hw = 130. + 660. * pow(max(1. - sx, 1e-4), 1.6);
  float cn = (vP.z - zc) / hw, acn = abs(cn);
  // dry river canyons: branching dark lines with a lit lip, cut into the plain (not across the flood's own channel)
  float cw = abs(fbm3(p * 0.0011 + vec2(n2 * 0.25, 7.)) - 0.5), cw2 = abs(fbm3(p * 0.0031 + vec2(3., n1 * 0.4)) - 0.5);
  float plain = smoothstep(1.05, 1.5, acn) * smoothstep(900., 1500., vP.x) * (1. - steep);
  float can = max(1. - smoothstep(0.004, 0.012, cw), 0.7 * (1. - smoothstep(0.003, 0.008, cw2)) * lod) * plain;
  col = mix(col, mix(uShade, uFloorA, 0.3) * 0.75, can * 0.75);
  col = mix(col, uFloorB * 1.08, 0.4 * plain * smoothstep(0.012, 0.016, cw) * (1. - smoothstep(0.016, 0.03, cw)));
  // cloud shadows (matched to the cumulus) or, under overcast, roaming shafts of light; slopes take the sun by facing
  float sh = 0.;
  for (int i = 0; i < 14; i++) { vec2 d = (p - uCl[i].xy) / max(uCl[i].z, 1.); d.x *= 0.8; sh = max(sh, 1. - smoothstep(0.55, 1.05, length(d) + 0.3 * n2)); }
  float lit = mix(1. - 0.62 * sh, 0.16 + 2.5 * sh, uShafts);
  float ndl = clamp(dot(N, uSunDir) / max(uSunDir.y, 0.25), 0., 1.7);
  col *= uSunCol * (0.74 * lit * ndl) + uSkyCol * (0.62 + 0.25 * N.y) + uBounce * 0.2;
  col = mix(col, col * vec3(0.55, 0.68, 1.0), 0.55 * sh * (1. - uShafts));
  vec2 dT = p - uTow.xy; float tsh = (1. - smoothstep(0.45, 1.1, length(vec2(dot(dT, uTowD) / uTow.z, dot(dT, vec2(-uTowD.y, uTowD.x)) / uTow.w)) + 0.35 * (n2 - 0.5))) * (1. - smoothstep(0.40, 0.47, uProg));
  float footK = smoothstep(0.30, 0.80, vTerr + 0.35 * (n2 - 0.5) + 0.15 * (n3 - 0.5));
  col = mix(col, mix(uFloorA, uShade, 0.48) * (0.44 + 0.3 * n3) * (0.62 + 0.5 * vn(p * 0.33)) * (uSkyCol * 1.5 + uBounce * 0.4 + uSunCol * 0.12), footK * 0.92);
  // the gale that follows the water lifts salt off the pans: pale streamers racing east across the floor
  float blow = fbm3(vec2((p.x - uTime * 34.) * 0.004 + p.y * 0.002, p.y * 0.03 + 1.7 * n1));
  col = mix(col, vec3(1.0, 0.98, 0.95) * (uSunCol * 1.0 * lit + uSkyCol * 0.95), 0.62 * smoothstep(0.50, 0.66, blow) * (1. - 0.6 * steep) * smoothstep(800., 1400., vP.x) * (1. - footK) * (1. - 0.35 * salt) * smoothstep(0.50, 0.64, uProg));      // seen from over the void, not through the haze from the lip
  // THE LOWER CHUTE: the flood running on down its channel to the standing water: one tongue of torn white water whose
  // marks run ALONG the flow, a few standing waves near its head only, dark wet ragged banks.
  float bedY = vP.x < 540. ? rampY(vP.x + 520.) - 34. : mix(-587., -652., smoothstep(540., 1000., vP.x));
  float hb = vP.y - bedY, shoreH = vP.x < 540. ? 34. : 13.;
  float inX = 1. - smoothstep(uCh.x - 40., uCh.x + 70., vP.x + 60. * (n2 - 0.5));
  float corridor = (1. - smoothstep(0.90, 0.99, acn + 0.06 * (n2 - 0.5))) * inX;
  float chute = corridor * (1. - smoothstep(shoreH + 1., shoreH + 7., hb));
  float wenv = smoothstep(480., 640., vP.x);
  // (1) STANDING WAVES: four or five only, in the upper reach, unequally spaced, every crest broken along its length; they die
  // away downstream into streaked white. ci is the crest's number, dq the distance from it in periods (- upstream, + lee).
  float qx = (vP.x - 760.) / 172.;
  float q = qx + 0.42 * sin(qx * 1.7 + 0.8) - 0.9 * acn * (0.5 + 0.5 * acn) + 1.5 * (fbm3(p * 0.0026 + 11.) - 0.5) + 0.5 * (n2 - 0.5) + 0.2 * (vn(p * 0.021 + 5.) - 0.5);
  float ci = floor(q + 0.5), dq = q - ci;
  float tear = vn(vec2((vP.x - uTime * 38.) * 0.02, vP.z * 0.05));
  float brk = smoothstep(0.26, 0.5, vn(vec2(vP.z * 0.011 + ci * 17.3, ci * 3.1 + 0.5)));
  float str = wenv * smoothstep(0.5, 0.9, ci) * (1. - smoothstep(4.5, 5.6, ci)) * (1. - 0.68 * smoothstep(2.2, 5.2, q)) * (0.72 + 0.28 * h21(vec2(ci, 3.))) * (0.3 + 0.7 * brk);
  float sunUp = clamp(-uSunDir.x * 1.3, 0., 1.);
  float face = smoothstep(-0.36, -0.07, dq) * (1. - smoothstep(-0.03, 0.02, dq));               // the upstream face climbs toward the sun: bright glass
  float lee = smoothstep(0.0, 0.05, dq) * (1. - smoothstep(0.10, 0.32, dq));                    // the short lee falls away in blue shadow
  float crestL = str * (1. - smoothstep(0.012, 0.06 + 0.06 * tear, abs(dq - 0.004)));          // the torn white line itself
  float crestW = str * smoothstep(0.0, 0.03, dq) * (1. - smoothstep(0.04, 0.26, dq + 0.16 * (tear - 0.5)));      // foam trailing from it
  float waveL = 1. + str * sunUp * (0.6 * face - 0.7 * lee);
  // (2) THE GRAIN OF THE TONGUE: foam lanes in flow coordinates (across = the channel's own normalised width, so the lanes
  // converge as it narrows; along = metres downstream minus time, so everything slides at 30 to 46 m/s). These are the
  // dominant marks: long white streaks, thinner green-glass slivers between them, flecks racing down the lanes.
  float lodS = 1. - smoothstep(1100., 3000., dist), lodM = 1. - smoothstep(2200., 5200., dist);
  float sA = vP.x - uTime * 38., sB = vP.x - uTime * 30., sC = vP.x - uTime * 46.;
  float am = cn * hw;                                                                    // metres from the centre line: marks keep their size, they never fan
  float wob = fbm3(vec2(vP.x * 0.0017, cn * 1.6) + 3.) - 0.5;
  am += 46. * wob + 9. * (vn(vec2(sB * 0.006, am * 0.02)) - 0.5);                           // the lanes wander and braid
  // (2) THE GRAIN OF THE TORRENT, in flow coordinates (metres across, metres downstream minus time, so everything slides at
  // 30 to 46 m/s): foam rafts a few lengths long, never hairlines; and the DIAMONDS a supercritical flood stands in,
  // oblique shock waves off both banks crossing each other, white on their crests, glass green in the pockets between.
  float l1 = vn(vec2(am * 0.017 + 3., sA * 0.0042));
  float l2 = vn(vec2(am * 0.041 + 9., sB * 0.011 + 5.));
  float l3 = vn(vec2(am * 0.10 + 31., sC * 0.026));
  float l4 = vn(vec2(am * 0.24 + 7., sA * 0.062 + 2.));
  float lane = 0.34 * l1 + 0.30 * l2 + 0.22 * mix(0.5, l3, 0.35 + 0.65 * lodM) + 0.14 * mix(0.5, l4, lodS);
  float dw = 190. * (fbm3(p * 0.0024 + 21.) - 0.5) + 60. * (vn(p * 0.009 + 3.) - 0.5), dA = am + vP.x * 0.62 + dw, dB = am - vP.x * 0.62 - 0.6 * dw + 80. * (vn(p * 0.0061 + 40.) - 0.5);
  float r1 = 0.5 + 0.5 * cos(6.2831853 * dA / 236.), r2 = 0.5 + 0.5 * cos(6.2831853 * dB / 204. + 1.7);
  r1 *= r1 * r1; r2 *= r2 * r2;
  float dia = max(r1 * smoothstep(0.35, 0.6, vn(p * 0.0047 + 3.)), r2 * smoothstep(0.4, 0.65, vn(p * 0.0041 + 17.))) * wenv, pocket = (1. - r1) * (1. - r2);
  float tearD = vn(vec2(sC * 0.03, am * 0.08));
  float diaW = smoothstep(0.50, 0.80, dia + 0.25 * (tearD - 0.5));                          // the torn white crest of each diamond
  float boil = smoothstep(uCh.x - 300., uCh.x, vP.x);
  float edgeF = smoothstep(0.80, 0.95, acn + 0.12 * (l2 - 0.5)) * wenv;
  float core = (1. - smoothstep(0.25, 0.75, acn)) * (0.6 + 0.4 * pocket);                   // the fast smooth core runs greener than the torn margins
  float foamK = smoothstep(0.45 + 0.09 * core, 0.53 + 0.08 * core, lane + 0.06 * (1. - pocket));
  float ff = clamp(foamK + 0.75 * diaW + crestW * 0.8 + crestL + 0.8 * edgeF + 0.8 * boil, 0., 1.);
  ff = mix(clamp(floodFoam(p, uTime) * 0.75 + 0.2, 0., 1.), ff, wenv);
  vec3 wcol = uWhite * 0.74 * (uSunCol * 0.72 + uHaze * 0.42 + uSkyCol * 0.32);
  float relief = 1. + sunUp * wenv * (0.55 * (r1 + r2) - 0.30) * (0.6 + 0.4 * lodM);        // each diamond lit on the face that climbs toward the sun
  vec3 gcol = mix(uGreen, uWhite, 0.10) * 0.80 * (uSkyCol * 0.95 + uSunCol * 0.72 * waveL * relief) + uSunCol * uGreen * 0.45 * str * face * sunUp;
  gcol *= 0.82 + 0.36 * l2;
  vec3 wcolW = uWhite * 0.80 * (uSunCol * 0.88 * waveL * relief + uSkyCol * 0.62 + uHaze * 0.22);          // white water in the sun: the brightest thing on the floor, brighter than the salt
  wcolW *= mix(vec3(1.), vec3(0.74, 0.93, 0.90), 0.6 * (1. - smoothstep(0.50, 0.66, lane)) * wenv * (1. - diaW));      // thin foam: the jade shows through
  wcolW *= (0.92 + 0.16 * l3) * (1. - 0.14 * lodS * (1. - l4));
  wcolW *= 1. - 0.22 * smoothstep(0.5, 0.75, tearD) * (0.35 + 0.65 * lodM) * wenv * (1. - diaW);          // torn gaps racing down at 46 m/s
  vec3 fl = mix(gcol, wcolW, ff) * mix(1., 0.60 + 0.40 * lit, wenv);
  fl = mix(fl, fl * vec3(0.52, 0.70, 1.04), 0.8 * str * lee * sunUp);                      // the lee in blue shadow
  fl = mix(fl, fl * vec3(0.66, 0.80, 1.0), 0.5 * wenv * sunUp * smoothstep(0.25, 0.7, max(r1, r2)) * (1. - diaW));     // and the lee of each diamond
  fl *= 1. + 0.3 * crestL;
  // dark wet rock banks with a ragged outline: wet and near black at the water, drying upward to grey-ochre ledges
  float bn = 0.20 * (n2 - 0.5) + 0.09 * (n3 - 0.5) + 0.06 * (vn(p * 0.09) - 0.5) + 0.03 * (vn(p * 0.27) - 0.5) * lodS;
  float bankK = (1. - smoothstep(1.0, 1.30, acn + bn)) * inX * wenv * (1. - 0.85 * smoothstep(36., 52., hb + 22. * (n2 - 0.5) + 8. * (n3 - 0.5)));
  float wetB = 1. - smoothstep(shoreH + 2., shoreH + 26., hb + 18. * (n3 - 0.5) + 12. * (vn(p * 0.012 + 3.) - 0.5));
  float lq = hb / 7. + 1.6 * n2 + 0.5 * n3, ledgeB = smoothstep(0.7, 0.95, fract(lq)), ledgeT = 0.62 + 0.7 * h21(vec2(floor(lq), 5.));
  vec3 bankC = mix(mix(uFloorA, uShade, 0.42) * (0.34 + 0.26 * n3) * ledgeT * (1. - 0.55 * ledgeB) * (0.7 + 0.6 * vn(p * 0.21)), mix(uShade, uFloorA, 0.3) * (0.16 + 0.16 * n3), wetB);
  col = mix(col, bankC * (uSunCol * 0.55 * lit * (0.5 + 0.5 * ndl) + uSkyCol), bankK * mix(0.62, 0.92, wetB));
  col = mix(col, fl, chute);
  float edgeN = acn + 0.06 * (n2 - 0.5) + 0.02 * (vn(p * 0.05 + vec2(uTime * 0.6, 0.)) - 0.5);
  col = mix(col, wcol, 0.8 * wenv * inX * smoothstep(0.90, 0.955, edgeN) * (1. - smoothstep(0.985, 1.03, edgeN)) * smoothstep(0.30, 0.55, vn(p * 0.017 + vec2(uTime * 0.5, 3.))));      // a thin broken wash
  // where the flood laps the scree: wet rock and a white wash, never a hard edge
  float wash = corridor * (1. - chute) * (1. - smoothstep(shoreH + 2., shoreH + 30., hb));
  col = mix(col, col * 0.55, wash * 0.8);
  col = mix(col, wcol, wash * (1. - smoothstep(shoreH + 3., shoreH + 16., hb + 8. * (vn(p * 0.07 + vec2(uTime * 0.4, 0.)) - 0.5))));
  // THE STANDING WATER: jade in the first weeks, a blue sea months on. Pale shallows, a foam shore that follows the
  // ground, wind lanes, cloud shadow, a twinkle of sun, and the silt of the flood fanning out from the mouth.
  float dl = length(p - uBasin.xy);
  float wd = uBasin.w - (vP.y + 9. * (fbm3(p * 0.004 + 5.) - 0.5) + 3. * (n3 - 0.5) * lod);
  float inB = (1. - smoothstep(uBasin.z * 1.5, uBasin.z * 1.62, dl)) * smoothstep(uCh.x - 120., uCh.x + 40., vP.x);
  float lake = smoothstep(0., 1.4, wd) * inB;
  float shalD = mix(9., 20., uCh.y), shal = 1. - smoothstep(0., shalD, wd);
  vec2 mo = vec2(p.x - uCh.x, (p.y - 140.) * 1.6); float silt = exp(-dot(mo, mo) / mix(9.0e4, 6.4e5, uCh.y)) * (0.6 + 0.6 * vn(vec2((p.x - uTime * 12.) * 0.006, p.y * 0.012)));
  float lanes = vn(vec2(p.x * 0.0035 - uTime * 0.07, p.y * 0.022)) * 0.6 + vn(p * 0.012 - uTime * vec2(0.3, 0.06)) * 0.4;
  vec3 wat = mix(uLakeCol * (0.72 + 0.3 * lanes), uShalCol, max(shal * 0.85, clamp(silt, 0., 1.) * 0.8));
  wat *= uSunCol * (0.5 + 0.4 * lit) + uSkyCol * 1.1;
  float tw = vn(p * 0.09 + uTime * vec2(0.9, -0.6)) * vn(p * 0.13 - uTime * vec2(0.7, 0.5));
  wat += uSunCol * 0.55 * smoothstep(0.5, 0.75, tw) * lit * (0.3 + 0.7 * lod);
  float foamS = (1. - smoothstep(0.3, 2.6, wd)) * (0.55 + 0.45 * vn(p * 0.045 + vec2(uTime * 0.25, 0.)));
  wat = mix(wat, wcol * 1.1, max(foamS, 0.7 * smoothstep(0.55, 0.95, silt) * (1. - uCh.y * 0.5)));
  col = mix(col, col * 0.6, inB * (1. - lake) * (1. - smoothstep(0., 7., -wd)) * 0.7);          // the damp margin
  col = mix(col, wat, lake);
  // haze does the scale: blue-grey veils, then the far tone of the dome below the horizon
  #ifdef USE_FOG
  float fd = fogDensity * 0.62 * vFogDepth, f = 1. - exp(-fd * fd);
  vec3 warm = mix(uFarCol, uHaze, 0.22) * (uSunCol * 0.55 + uSkyCol * 1.1);
  col = mix(col, warm, clamp(f, 0., 1.));
  #endif
  col = mix(col, uHaze * (uSunCol * 0.4 + uSkyCol * 1.5), mix(0.30, 0.16, uShafts) * smoothstep(500., 3000., dist));     // the blue of a kilometre of air
  col *= mix(vec3(1.), vec3(0.62, 0.70, 0.85), tsh * mix(0.85, 0.5, uShafts));      // the spray tower's shadow streams east with the spray: the floor behind it is a step darker than the spray
  gl_FragColor = vec4(col, 1.);
}`;

const ROCK_VERT = /* glsl */`
attribute float aLit, aFace, aGul, aBq;
varying vec3 vP, vN; varying float vLit, vFace, vGul, vBq;
${FOG_V}
void main(){
  vec4 lp = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  lp = instanceMatrix * lp; n = mat3(instanceMatrix) * (n / max(vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)), vec3(1e-4)));
  #endif
  vP = lp.xyz; vN = n; vLit = aLit; vFace = aFace; vGul = aGul; vBq = aBq; vec4 mv = modelViewMatrix * lp;
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix * mv; }`;
const ROCK_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uHaze, uHoney, uBone, uShade, uCam;
varying vec3 vP, vN; varying float vLit, vFace, vGul, vBq;
${FOG_F}
${NOISE_G}
uniform float uTime;
float rampY(float bx){ float u = max(bx - 330., 0.); return -4. * smoothstep(200., 330., bx) - (u - 185. * (1. - exp(-u / 185.))); }
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 fN = cross(dFdx(vP), dFdy(vP)); fN = normalize(fN + N * 1e-4); if (dot(fN, N) < 0.) fN = -fN;
  float cliff = 1. - step(1.5, vFace);                                  // 1 on the escarpment's face (aFace 0..1 up it), 0 on plateau, Musa, slab
  vec3 N0 = N;
  N = normalize(mix(N, fN, mix(0.7, 0.40, cliff)));                      // broken planes: every ledge and block has its own facet
  float dC = length(uCam - vP);
  float along = vP.x * 0.8 + vP.z * 0.6;
  float bed = (vP.y - 0.364 * along) / 9. + 0.6 * vn(vec2(along, vP.y) * 0.01);
  float fb = fract(bed), band = h21(vec2(floor(bed), 3.));
  float n = fbm3(vec2(along * 0.012, vP.y * 0.03)), n2 = vn(vec2(along * 0.11, vP.y * 0.3));
  vec3 alb = mix(uHoney * (0.62 + 0.3 * band), uBone * 0.78, smoothstep(0.45, 0.8, n) * 0.6);
  alb *= 0.82 + 0.18 * n2; alb *= 1. - 0.3 * smoothstep(0.86, 1., fb);
  float gully = smoothstep(0.62, 0.8, fbm3(vec2(along * 0.006, 2.)));
  alb *= 1. - 0.25 * gully;
  float flat_ = smoothstep(0.75, 0.95, N.y);
  alb = mix(alb, mix(uHoney, vec3(0.33, 0.36, 0.24), 0.45) * (0.55 + 0.4 * n), flat_ * 0.8);     // scrub and soil on the tops
  alb = mix(alb, uBone * (0.66 + 0.16 * n2), step(1.5, vLit) * (1. - smoothstep(8.6, 9.8, vP.y)));     // blocks below the tide line are freshly broken
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 lit = alb * (uSunCol * ndl * 1.05 + uSkyCol * (0.6 + 0.4 * N.y) + uBounce * (0.55 - 0.45 * N.y));
  // faces turned from the sun settle to deep slate: the calm, dark element the ring hangs against. The form is real:
  // beds step back riser and tread (vBq is the same bed number the geometry stepped on), each bed is jointed into
  // blocks, couloirs hold cast shade, ledge tops take the sky, and grey-ochre scree fans fill the gully mouths.
  float gulS = smoothstep(0.18, 0.72, vGul + 0.25 * (n - 0.5));
  float bi = floor(vBq), fq = fract(vBq), bh = h21(vec2(bi, 9.));
  float jw = 20. + 26. * h21(vec2(bi, 3.)), js = along / jw + 7. * h21(vec2(bi, 40.)) + 0.25 * vn(vec2(vP.y * 0.05, bi));
  float ji = floor(js), jf = fract(js), blockT = h21(vec2(ji, bi + 5.));
  float mUp = step(h21(vec2(bi, 55.)), 0.45), mDn = step(h21(vec2(bi - 1., 55.)), 0.45);        // this bed runs on into the one above / below: beds two and three times as thick as others
  float plainK = smoothstep(0.50, 0.66, fbm3(vec2(along * 0.0045 + 9., vP.y * 0.006)));          // whole faces left unbroken between the jointed ones
  bh = h21(vec2(bi - mDn, 9.));
  float joint = (1. - smoothstep(0.0, 0.07, jf)) * step(0.35, h21(vec2(ji, bi + 17.))) * step(0.4, h21(vec2(bi - mDn, 71.))) * (1. - plainK);
  blockT = mix(blockT, 0.5, max(plainK, 1. - step(0.4, h21(vec2(bi - mDn, 71.)))));
  float tread = smoothstep(0.66, 0.84, fq + 0.1 * (n2 - 0.5)) * (1. - 0.85 * mUp), under = (1. - smoothstep(0.0, 0.2, fq + 0.1 * (n2 - 0.5))) * (1. - 0.85 * mDn);
  float sub = (1. - plainK) * (1. - smoothstep(0.0, 0.12, fract(vBq * 3.7 + 0.4 * vn(vec2(along * 0.02, bi))))) * smoothstep(0.35, 0.65, vn(vec2(along * 0.04 + bi * 5.1, bi)));
  float stain = vn(vec2(along * 0.11 + bi * 13., fq * 1.6)) * smoothstep(0.4, 0.7, vn(vec2(along * 0.013, bi * 0.7)));     // short drip stains that end at each ledge
  float side = clamp(dot(N, vec3(0.80, 0.0, 0.60)) * 0.5 + 0.5, 0., 1.), topL = clamp(N.y, 0., 1.) * (1. - 0.7 * mUp * smoothstep(0.5, 0.9, fq));
  float fineB = (1. - smoothstep(0.0, 0.18, fract(vBq * 8.3 + 0.3 * n2))) * (1. - 0.6 * plainK) * (1. - smoothstep(500., 1700., dC));      // thin partings inside each bed
  float form = 0.50 + 0.60 * side * side + 0.9 * topL + 0.35 * tread - 0.12 * fineB;                         // light off the bright basin on one flank, sky on every ledge
  form *= mix(1.16, 0.56, gulS) * (1. - 0.36 * under) * (1. - 0.5 * joint * (1. - tread)) * (1. - 0.16 * sub) * (1. - 0.3 * stain * (1. - tread));
  float tone = (0.80 + 0.30 * bh) * (0.90 + 0.20 * blockT) * (0.86 + 0.28 * fbm3(vec2(along * 0.006 + bi * 0.7, vP.y * 0.004)));
  // POLISH 2: the old coast is the Rock's own limestone in shade: thin tilted beds, each its own tone, in warm and cool groups,
  // a dark parting under the harder ones and rain flutes down the risers. Fine grain is what makes it read 700 m high.
  float sK = 1. - smoothstep(900., 2600., dC), sI = floor(bed), sT = h21(vec2(sI, 21.)), sG = h21(vec2(floor(bed / 5. + 0.3 * vn(vec2(along * 0.003, 5.))), 33.));
  float sB2 = bed * 3.1 + 0.4 * n2, sT2 = h21(vec2(floor(sB2), 47.));
  float strataL = (0.76 + 0.40 * sT) * (0.84 + 0.30 * sG) * (1. - 0.5 * (1. - smoothstep(0.0, 0.18, fb)) * step(0.35, sT)) * (0.90 + 0.2 * sT2 * (1. - smoothstep(300., 1100., dC)));
  float flute = 0.84 + 0.32 * vn(vec2(along * 0.085, vP.y * 0.011 + sI * 0.31)) * (0.6 + 0.4 * vn(vec2(along * 0.31, vP.y * 0.02)));
  tone *= mix(1., strataL * flute * 1.08, sK);
  float stone = mix(0.72 + 0.5 * h21(vec2(floor(vP.y / 13. + 2. * vn(vec2(along * 0.004, 3.))), 9.)), form * tone, cliff);
  vec3 slate = mix(uShade, vec3(dot(uShade, vec3(0.3, 0.5, 0.2))), 0.5 * cliff) * mix(1., 1.1, cliff);                   // limestone in shade: greyer than the sky, the same stone as the gold rim
  vec3 shade = mix(slate, uHoney * dot(uShade, vec3(0.4)) * 1.15, mix(0.16, 0.20 + 0.42 * sG * sK + 0.14 * sT * sK, cliff)) * mix(0.36 + 0.42 * clamp(dot(N, vec3(0.6, -0.3, 0.74)) * 0.6 + 0.5, 0., 1.) + 0.42 * smoothstep(0.35, 0.8, N.y), 0.70, cliff) * stone * (0.9 + 0.2 * n2) * (1. - 0.3 * gully * (1. - cliff));
  shade = mix(shade, shade * vec3(1.26, 1.02, 0.74), cliff * clamp(0.4 - 0.9 * N.y + 0.4 * (bh - 0.5), 0., 0.6));      // faces that look down or out take the ochre of the bright floor; ledge tops keep the sky's blue
  float screeE = vFace - 0.13 * vGul + 0.10 * (n - 0.5) + 0.05 * (vn(vec2(along * 0.05, vP.y * 0.04)) - 0.5) + 0.02 * (n2 - 0.5);
  float scree = cliff * (1. - smoothstep(0.10, 0.33, screeE));
  scree = max(scree, cliff * smoothstep(0.55, 0.74, N0.y) * (1. - smoothstep(0.30, 0.45, vFace)));      // POLISH 2: the whole 35 degree apron is scree, to its top
  float grainS = 0.6 * vn(vec2(along, vP.y) * 0.33) + 0.4 * vn(vec2(along, vP.y) * 1.1 + 7.), runS = vn(vec2(along * 0.08, vP.y * 0.009)) * (0.7 + 0.6 * vn(vec2(along, vP.y) * 0.07 + 3.));     // fine grain, then boulders and fall lines
  vec3 screeCol = mix(uHoney, uShade, 0.45) * (0.40 + 0.36 * clamp(dot(N0, vec3(0.80, 0.0, 0.60)) * 0.5 + 0.5, 0., 1.)) * (0.6 + 0.55 * grainS) * (0.86 + 0.26 * runS) * mix(1., 0.72, gulS);
  // POLISH 2: scree is blocks: pale boulders on dark fines at three sizes, so the apron under the cliff has grain instead of a brown smear
  vec2 sp = vec2(along, vP.y * 1.5); float spK = 1. - smoothstep(500., 1600., dC);
  float speck = vn(sp * 0.27) * 0.24 + vn(sp * 0.115 + 7.) * 0.40 + vn(sp * 0.05 + 3.) * 0.36;
  screeCol *= mix(1., mix(0.45, 1.75, smoothstep(0.38, 0.64, speck)), spK);
  shade = mix(shade, screeCol, scree);
  shade += uBounce * mix(0.45, 0.10, cliff) * (1. - smoothstep(-400., 60., vP.y)) * (0.35 + 0.65 * clamp(0.6 - N.y, 0., 1.));
  shade += uBounce * uHoney * 0.55 * cliff * (1. - smoothstep(0.12, 0.5, vFace)) * (0.5 + 0.5 * stone) * (1. - 0.8 * scree * spK);      // warm light off the salt floor in the cliff's lower third      // ochre light off the basin floor under the lower ledges
  float k = clamp(vLit, 0., 1.) * smoothstep(0.0, 0.35, ndl);
  k = mix(k, smoothstep(0.38, 0.62, vLit + 0.6 * (tread - 0.5) + 0.5 * (n - 0.5) + 0.4 * (blockT - 0.5) - 0.45 * gulS) * smoothstep(0.0, 0.3, ndl + 0.25), cliff);     // the gold rim breaks along the top beds and buttress heads, not along a row of the mesh
  vec3 col = mix(shade, lit, k);
  float wy = vP.x < 540. ? rampY(vP.x + 520.) : mix(-587., -652., smoothstep(540., 1000., vP.x)), hw_ = vP.y - wy;
  float wash = cliff * (1. - smoothstep(3., 34., hw_ + 10. * (n - 0.5)));                             // wet rock, then a white wash where the flood laps the scree
  col = mix(col, col * 0.5, wash);
  col = mix(col, vec3(0.62, 0.68, 0.72) * (uSunCol * 0.4 + uSkyCol * 0.9), cliff * (1. - smoothstep(0., 9., hw_ + 9. * (vn(vP.xz * 0.06 + vec2(uTime * 0.5, 0.)) - 0.5))) * 0.8);
  float dist = length(uCam - vP);
  col = mix(col, uHaze * (uSunCol * 0.35 + uSkyCol * 1.5), mix(0.35, 0.10, step(vFace, 2.5)) * smoothstep(400., 2200., dist));
  col = mix(col, fogMix(col), mix(1., 0.55, cliff));                         // the shaded cliff stays the dark shape through a kilometre of air
  gl_FragColor = vec4(col, 1.);
}`;

async function buildLands(W) {
  const { scene, U, M, V, ctx } = W, noise = ctx.noise, esc = makeEscLine(), B = basinOf(V.lakeSea);
  W.esc = esc; W.basin = B;
  await ctx.yield();
  // ---- the basin floor: a grid that is dense near the lip and thins toward the horizon --------------------
  const NX = 136, NZ = 100, xs = new Float32Array(NX + 1), zs = new Float32Array(NZ + 1);
  for (let i = 0; i <= NX; i++) { const t = i / NX; xs[i] = 250 + 7400 * (0.25 * t + 0.75 * t * t * t); }
  for (let j = 0; j <= NZ; j++) { const t = j / NZ * 2 - 1; zs[j] = -300 + 5200 * (0.3 * t + 0.7 * t * t * t); }
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), terr = new Float32Array((NX + 1) * (NZ + 1));
  let k = 0;
  for (let j = 0; j <= NZ; j++) {
    for (let i = 0; i <= NX; i++, k++) {
      const x = xs[i], z = zs[j];
      pos[k * 3] = x; pos[k * 3 + 1] = floorY(x, z, esc, noise, B); pos[k * 3 + 2] = z;
      terr[k] = smoothstep(430, 110, z - esc.zAt(x));       // the cliff's shade lies over the whole apron of scree, toes and all
    }
    await ctx.yield();
  }
  const idx = new Uint32Array(NX * NZ * 6); let q = 0;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.setAttribute('aTerr', new THREE.BufferAttribute(terr, 1)); fg.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  await normalsAsync(fg, ctx);
  await ctx.yield();
  fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(3500, -600, 0), 7000);
  W.cl = []; for (let i = 0; i < 14; i++) W.cl.push(new THREE.Vector4(1e5, 1e5, 1, 0));
  const sdT = U.uSunDir.value, hl = Math.hypot(sdT.x, sdT.z) || 1, cot = hl / Math.max(sdT.y, 0.25), towD = new THREE.Vector2(-sdT.x / hl, -sdT.z / hl);
  const towS = new THREE.Vector4(2500, 1045, 1500, 430); towD.set(0.927, 0.375);      // the spray streams east on the gale, and so does its shadow
  const floorMat = shader(U, ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uCam', 'uHaze', 'uWhite', 'uGreen', 'uShade'], {
    uFloorA: { value: new THREE.Color(M.floorA) }, uFloorB: { value: new THREE.Color(M.floorB) }, uFarCol: { value: new THREE.Color(M.ground) },
    uLakeCol: { value: new THREE.Color(B.sea ? '#1E5AA8' : '#23A088') }, uShalCol: { value: new THREE.Color(B.sea ? '#4FB9C2' : '#8FD8C4') },
    uBasin: { value: new THREE.Vector4(B.x, B.z, B.r, B.level) }, uCh: { value: new THREE.Vector2(B.chEnd, B.sea) },
    uShafts: { value: V.mood === 'pearl' ? 1 : 0 }, uCl: { value: W.cl }, uProg: U.uProgress, uTow: { value: towS }, uTowD: { value: towD },
  }, FLOOR_VERT, FLOOR_FRAG);
  const floor = new THREE.Mesh(fg, floorMat); floor.name = 'basin-floor'; scene.add(floor);
  await ctx.yield();

  // ---- the escarpment (shaded: aLit 0 on its face, 1 on the rim and plateau) and Jebel Musa -----------------
  const P = [], L = [], F = [], G = [], Q = [], I = []; W.escCols = [];
  // One continuous profile from scree to crest. Buttresses and couloirs run through every row, so they read as towers
  // and gullies, never as steps; the beds are tilted and uneven; ledges are smooth set-backs; scree fans fill the gully mouths.
  const NC = 200, NRF = 70, NRB = 5, NR = NRF + NRB, cp = new THREE.Vector3(), ct = new THREE.Vector3(), escLen = esc.curve.getLength();
  for (let c = 0; c <= NC; c++) {
    const f = Math.pow(c / NC, 1.8); esc.curve.getPointAt(f, cp); esc.curve.getTangentAt(f, ct);
    const tl = Math.hypot(ct.x, ct.z) || 1, nx = -ct.z / tl, nz = ct.x / tl, s = f * escLen, p = cp;
    const gul = smoothstep(0.12, 0.62, noise.n2(s * 0.0095, 7.7) + 0.35 * noise.n2(s * 0.021, 2.2));       // 1 in a couloir, 0 on a buttress
    const crest = 165 + 60 * noise.fbm2(s * 0.0012, 4.4, 3) + 50 * smoothstep(900, 300, p.x) - 60 * smoothstep(2500, 4500, p.x) - 26 * gul;
    const mass = 44 * noise.fbm2(s * 0.0042, 1.3, 3), fanTop = 0.15 + 0.10 * smoothstep(0.1, 0.7, noise.n2(s * 0.0095, 7.7));      // fans widen under the couloirs, without a step from column to column
    const yFoot = bedOf(p.x + nx * (190 + mass)) - 14, H = crest - yFoot;                              // the apron's toe lies under the flood or under the salt
    const bqAt = (y) => (y - 0.2 * s) / 46 + 0.55 * noise.n2(s * 0.003, y * 0.004) + 0.22 * noise.n2(s * 0.011, y * 0.013), stair = (b) => Math.floor(b) + 0.25 * (b - Math.floor(b)) + 0.75 * smoothstep(0.5, 1.0, b - Math.floor(b)), bq0 = bqAt(yFoot + H * fanTop);
    const col = { x: p.x, z: p.z, nx, nz, gul, s, pts: [] }; W.escCols.push(col);
    let back = 0;
    for (let r = 0; r < NR; r++) {
      let y, lit = 1, face = 2;
      if (r < NRF) {
        const t = r / (NRF - 1), tc = Math.max(t - fanTop, 0) / (1 - fanTop), bq = bqAt(yFoot + H * t);
        y = yFoot + H * t; face = t; lit = smoothstep(0.855, 0.985, t);
        back = -78 - mass - 1.4 * H * fanTop * (1 - Math.min(t / fanTop, 1))                      // the apron, 35 degrees
          + (12 + 6 * noise.n2(s * 0.02, Math.floor(bq) * 3.7)) * (stair(bq) - stair(bq0)) * smoothstep(0, 0.08, tc) * (1 - 0.5 * gul)      // beds stepping back, ledge by ledge: a riser, then a tread
          + 6 * noise.n2(s * 0.024 + Math.floor(bq) * 9.1, Math.floor(bq) * 3.3) * smoothstep(0.05, 0.2, tc) + 2.5 * noise.n2(s * 0.07, y * 0.05) * smoothstep(0.05, 0.2, tc)      // each bed broken along the face into blocks that stand in and out
          + 96 * gul * smoothstep(0, 0.3, tc) * (1 - 0.3 * tc) + 9 * noise.n2(s * 0.016, y * 0.012) * smoothstep(0, 0.2, tc)
          + 34 * smoothstep(0.88, 1, t) * smoothstep(0.88, 1, t);
      } else {
        const t = (r - NRF + 1) / NRB; y = crest - 30 * t + 22 * noise.n2(s * 0.004, t * 3); back += 40 + 260 * t;
      }
      P.push(p.x - nx * back, y, p.z - nz * back); L.push(lit); F.push(face); G.push(r < NRF ? gul : 0); Q.push(r < NRF ? bqAt(y) : 0);
      if (r < NRF && r % 6 === 5) col.pts.push([p.x - nx * back, y, p.z - nz * back]);
      if (r === NRF - 1) col.top = [p.x - nx * back, y, p.z - nz * back];
      if (r === 2) col.lo = [p.x - nx * back, y, p.z - nz * back]; if (r === 7) col.mid = [p.x - nx * back, y, p.z - nz * back];
    }
    if (c % 6 === 5) await ctx.yield();
  }
  for (let c = 0; c < NC; c++) for (let r = 0; r < NR - 1; r++) { const a = c * NR + r, b = a + NR; I.push(a, b, a + 1, a + 1, b, b + 1); }
  await ctx.yield();
  // Jebel Musa: the southern pillar, 1.4 km to the right, falling into the void on its east side
  const base = P.length / 3, MX = 44, MZ = 30;
  for (let j = 0; j <= MZ; j++) for (let i = 0; i <= MX; i++) {
    const x = -900 + 2600 * i / MX, z = 800 + 2400 * (j / MZ) * (j / MZ * 0.6 + 0.4);
    const sea = x < -190 ? -6 : rampYw(x) - 40, east = smoothstep(480, 880, x);
    const dx = (x - 230) / 620, dz = (z - 1650) / 620, m = Math.exp(-(dx * dx * (x > 230 ? 2.2 : 0.7) + dz * dz) * 1.3);
    const top = lerp(70 + 40 * noise.n2(x * 0.002, z * 0.002), -780, east * (1 - 0.75 * m)) + 430 * m * (0.82 + 0.3 * noise.fbm2(x * 0.004, z * 0.004, 3));
    const rise = smoothstep(830, 1180, z + 60 * noise.n2(x * 0.004, 5));
    P.push(x, lerp(Math.min(sea, top) - 20, top, rise) + 30 * rise * (1 - rise) * noise.n2(x * 0.01, z * 0.01), z); L.push(1); F.push(3); G.push(0); Q.push(0);
  }
  for (let j = 0; j < MZ; j++) for (let i = 0; i < MX; i++) { const a = base + j * (MX + 1) + i, b = a + 1, c = a + MX + 1; I.push(a, c, b, b, c, c + 1); }
  await ctx.yield();
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); rg.setAttribute('aLit', new THREE.Float32BufferAttribute(L, 1)); rg.setAttribute('aFace', new THREE.Float32BufferAttribute(F, 1)); rg.setAttribute('aGul', new THREE.Float32BufferAttribute(G, 1)); rg.setAttribute('aBq', new THREE.Float32BufferAttribute(Q, 1)); rg.setIndex(I);
  await ctx.yield();
  await normalsAsync(rg, ctx);
  await ctx.yield();
  rg.boundingSphere = new THREE.Sphere(new THREE.Vector3(1500, -200, 0), 6000);
  await ctx.yield();
  const rocks = new THREE.Mesh(rg, shader(U, ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uHaze', 'uHoney', 'uBone', 'uShade', 'uCam'], null, ROCK_VERT, ROCK_FRAG, { side: THREE.DoubleSide }));
  rocks.name = 'escarpment-and-musa'; scene.add(rocks);
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------------------
// SOFT PUFFS: the spray cloud climbing from the foot of the chute, the cumulus standing below eye level, the cap
// streaming off the Rock, the dust storm on the far salt, the streamers arching over the prow and the rare
// event's column. One instanced mesh, sorted once from east to west.
// kind 0 billow (boils in place) · 1 traveller along an arc, looping · 2 drifter · 4 one-shot arc keyed to uEvent
// ---------------------------------------------------------------------------------------------------------
const PUFF_VERT = /* glsl */`
attribute vec4 aPos, aPar, aEnd;
uniform float uTime, uEvent, uProg; uniform vec3 uCam; uniform vec2 uDive;
varying vec2 vUv; varying vec4 vPar; varying float vLife, vH;
${FOG_V}
void main(){
  vec3 c = aPos.xyz; float size = aPos.w, life = 1., seed = aPar.x, kind = aPar.y;
  if (kind > 0.5 && kind < 1.5) {
    float t = fract(uTime * aPar.z + seed); c = mix(aPos.xyz, aEnd.xyz, t); c.y += aEnd.w * 4. * t * (1. - t);
    life = smoothstep(0., 0.14, t) * (1. - smoothstep(0.62, 1., t)); size *= 0.55 + 1.5 * t;
  } else if (kind > 3.5) {
    float ev = kind > 4.5 ? uDive.x : uEvent; if (kind > 5.5) ev = uDive.y;
    float t = clamp((ev - 0.12 - seed * 0.25) * aPar.z, 0., 1.); c = mix(aPos.xyz, aEnd.xyz, t * t * (3. - 2. * t)); c.y += aEnd.w * 4. * t * (1. - t);
    life = smoothstep(0., 0.1, t) * (1. - smoothstep(0.7, 1., t)); size *= 0.4 + 1.6 * t;
  } else if (kind > 1.5) {
    if (aPar.w > 0.5) { float a = uTime * 1.9 + seed * 40. + c.y * 0.035; c.x += uTime * 9. + (c.y + 606.) * 0.22; c.xz += vec2(cos(a), sin(a)) * size * 0.45; }     // a dust devil leans, twists and walks
    else c.x += uTime * 24.;
  }
  else {
    float tm = uTime * (aPar.w > 1.5 ? 3. : 1.);                                    // low mist churns faster than the high cloud
    c += vec3(sin(tm * 0.11 + seed * 6.), 0.6 * sin(tm * 0.17 + seed * 9.), cos(tm * 0.13 + seed * 4.)) * size * 0.10;
    size *= 1. + 0.07 * sin(uTime * 0.23 + seed * 20.);
    if (aEnd.x > 0.) { float gone = smoothstep(aEnd.x, aEnd.x + 0.045, uProg); life *= 1. - gone; c.x += 90. * gone; }
  }
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float dist = length(uCam - c);
  life *= smoothstep(size * 0.7, size * 2.2, dist);                       // never a wall of white on the lens
  float low = step(1.5, aPar.w) * (1. - step(2.5, aPar.w));
  life *= mix(1., smoothstep(size * 2.2, size * 7., dist), low);            // POLISH 2: low mist is a far veil; it never lies as a milky sheet between the lens and the water                 // low mist lies along the water and the scree: long thin veils, never balls
  float jet = step(4.5, kind);                                              // POLISH 2: a plunge throws up thin white jets, a crown of spikes, never a round puff
  vec3 wp = c + (right * position.x * mix(1., 2.6, low) * mix(1., 0.36, jet) + up * mix(position.y * mix(1., 0.4, low), (position.y + 0.75) * 1.9, jet)) * size;
  vUv = position.xy; vPar = aPar; vLife = life; vH = kind < 0.5 && aPar.w < 0.5 ? clamp((c.y + 640.) / 900., 0., 1.) : 1.;
  vec4 mv = viewMatrix * vec4(wp, 1.);
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix * mv;
}`;
const PUFF_FRAG = /* glsl */`
precision highp float;
uniform float uTime; uniform vec3 uSunDir, uLitCol, uShadeCol, uDustCol, uStreamCol, uMistCol;
varying vec2 vUv; varying vec4 vPar; varying float vLife, vH;
${FOG_F}
${NOISE_G}
void main(){
  float r = length(vUv), seed = vPar.x, tint = vPar.w;
  if (r > 1. || vLife < 0.004) discard;
  vec2 q = vUv * 1.7 + seed * 37.; q.y -= uTime * (tint > 1.5 ? 0.14 : 0.045);
  float n = fbm3(q), n2 = vn(q * 3.3 + 11.);
  float d = r + (n - 0.5) * 0.75 + (n2 - 0.5) * 0.2;
  float a = (1. - smoothstep(0.22, 0.96, d)) * vLife;
  if (tint > 1.5 && tint < 2.5) a = (1. - smoothstep(0.05, 0.95, r + (n - 0.5) * 0.4)) * vLife;      // spray: soft, thin
  float tow = step(0.2, tint) * (1. - step(0.5, tint));
  a = mix(a, (1. - smoothstep(0.50, 0.80, d)) * vLife, tow);
  a = mix(a, (1. - smoothstep(0.30, 0.85, r + (n - 0.5) * 0.9 + 0.35 * (n2 - 0.5))) * vLife * 1.2, step(4.5, vPar.y));     // plunge jets: torn, bright                                          // the thunderhead: lobed and firm-edged, a cloud with a surface
  if (a < 0.004) discard;
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]), back = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  float z = sqrt(max(1. - r * r, 0.));
  vec3 N = normalize(right * vUv.x + up * vUv.y + back * (z + 0.25));
  float w = clamp(dot(N, uSunDir) * 0.55 + 0.42 + (n - 0.5) * 0.9 + N.y * 0.18, 0., 1.);
  float soft = step(0.5, tint) * (1. - step(1.5, tint)), strm = step(3.5, tint);
  w *= 0.5 + 0.5 * smoothstep(-0.1, 0.75, vH + (n - 0.5) * 0.3);
  w *= 1. - 0.8 * (1. - step(0.5, tint)) * smoothstep(0.36, 0.56, fract(seed * 13.7)) * (0.7 + 0.3 * n2);
  w *= mix(1., 0.55 + 0.75 * smoothstep(0.25, 0.75, n) * (0.6 + 0.4 * (vUv.y * 0.5 + 0.5)), tow);       // each billow: lit dome, blue hollow      // folds: a third of the billows stand in the mass's own shade                    // the mass shades its own lower folds
  vec3 lit = mix(uLitCol, uDustCol, soft), shade = mix(uShadeCol, uDustCol * vec3(0.62, 0.66, 0.78), soft);
  vec3 col = mix(shade, lit, w * w * (3. - 2. * w)) * (0.86 + 0.14 * n2);
  col = mix(col, mix(uShadeCol * 1.05, uMistCol, w), step(1.5, tint) * (1. - step(2.5, tint)));     // mist and spray: white with blue shadow in every mood, never dust
  col = mix(col, uStreamCol * (0.75 + 0.5 * w), strm);                                // streamers over the prow: sunlit spray, brighter than the shade behind
  float f = fogAmt();
  gl_FragColor = vec4(mix(col, fogColor, f * 0.8), a * (1. - 0.45 * f) * mix(0.8, 0.5, step(1.5, tint)) * mix(1., 0.56, step(2.1, tint) * (1. - step(2.5, tint))) * mix(1., 0.3, step(2.5, tint)) * mix(1., 2.3, strm));
}`;

function buildPuffs(W) {
  const { scene, U, M, V, rng, detail, A } = W;
  const list = [];                                   // [x,y,z,size, seed,kind,speed,tint, ex,ey,ez,apex]
  const add = (x, y, z, s, kind, speed = 0, tint = 0, e = null, apex = 0) => list.push([x, y, z, s, rng(), kind, speed, tint, e ? e[0] : 0, e ? e[1] : 0, e ? e[2] : 0, apex]);
  // the spray cloud at the foot of the chute, where the flood strikes the standing water: seen from above, far
  // below eye level, boiling up 280 m and leaning downwind
  const B = W.basin, nCloud = Math.round(100 * detail);
  for (let i = 0; i < nCloud; i++) {
    const t = Math.pow(rng(), 1.3), h = lerp(-668, -440, t), rad = lerp(105, 70, t) * (0.8 + 0.2 * Math.sin(t * 9 + 1)), ang = rng() * TAU, rr = Math.sqrt(rng()) * rad;
    add(B.chEnd - 10 + (h + 668) * 0.6 + Math.cos(ang) * rr * 1.2, h, 130 + Math.sin(ang) * rr, lerp(80, 50, t) * rng.range(0.8, 1.25), 0);
  }
  for (let i = 0; i < Math.round(44 * detail); i++) { const a = hash(i * 3.7) * TAU, rr = 90 * Math.sqrt(hash(i * 1.3 + 5)); list.push([B.chEnd + 10 + Math.cos(a) * rr * 1.2, -664, 130 + Math.sin(a) * rr, 38 + 22 * hash(i + 0.5), hash(i * 7.7 + 2), 1, 0.07 + 0.05 * hash(i * 2.9), 0, B.chEnd + 150 + Math.cos(a) * rr * 1.6, -430 + 60 * hash(i * 4.1), 130 + Math.sin(a) * rr * 1.5, 0]); }
  const nCol = Math.round(150 * detail);
  for (let i = 0; i < nCol; i++) {
    const t = Math.pow(rng(), 0.75), h = lerp(-420, 430, t), rad = lerp(95, 150, t) * (0.75 + 0.25 * Math.sin(t * 9 + 1)), ang = rng() * TAU, rr = Math.sqrt(rng()) * rad;
    list.push([1150 + (h + 420) * 0.35 + Math.cos(ang) * rr * 0.9, h, 560 + Math.sin(ang) * rr * 1.1, lerp(84, 132, rng()) * lerp(1.1, 0.85, t), rng(), 0, 0, 0.25, 0.39 + 0.04 * rng(), 0, 0, 0]);     // aEnd.x: the u at which this puff shreds away
  }
  for (let i = 0; i < Math.round(84 * detail); i++) {
    const zo = (hash(i * 2.91 + 7) * 2 - 1), zz = zo * Math.abs(zo), top = 20 + 250 * Math.exp(-zz * zz * 5), h = lerp(-240, top, Math.pow(hash(i * 1.37 + 0.2), 0.8));
    list.push([1010 + 330 * hash(i * 5.3 + 1) + (h + 420) * 0.3, h, 560 + zz * 520, lerp(86, 140, hash(i * 3.3 + 2)), hash(i * 7.1 + 4), 0, 0, 0, 0.385 + 0.045 * hash(i * 9.7), 0, 0, 0]);
  }
  // POLISH 2: THE THUNDERHEAD OF SPRAY. Over the void the cloud at the chute's foot is the far hero: it climbs from the
  // standing water past our eye level, a narrow boiling stem that swells into a head and leans downwind, gold on the faces
  // turned to us and blue-grey in its folds (the brief's sky). Placed by hash, so no seeded draw moves.
  { const nT = Math.round(170 * detail);
    for (let i = 0; i < nT; i++) {
      const t = Math.pow(hash(i * 1.93 + 0.37), 0.8), h = lerp(-480, 210, t), a = hash(i * 5.17 + 2.1) * TAU, rr = Math.sqrt(hash(i * 3.31 + 7.7));
      const rad = lerp(105, 360, Math.pow(t, 1.5)) * (0.8 + 0.2 * Math.sin(t * 11 + 1)) * (t > 0.86 ? lerp(1, 0.55, (t - 0.86) / 0.14) : 1);
      list.push([B.chEnd + 40 + (h + 480) * 0.62 + Math.cos(a) * rr * rad * 1.25, h, 130 + Math.sin(a) * rr * rad, lerp(105, 190, hash(i * 7.3 + 1.1)) * lerp(0.9, 1.2, t), (Math.floor(hash(i * 9.9 + 4.2) * 9) + ((-Math.sin(a) * rr + 0.7 * (0.45 - t) + 0.5 * (hash(i * 2.7 + 5) - 0.5)) > 0.12 ? 0.8 : 0.2)) / 13.7, 0, 0, 0.25, 0, 0, 0, 0]);
    } }
  for (let i = 0; i < 26; i++) { const x = rng.range(600, 1500), s2 = rng() < 0.5 ? -1 : 1; add(x, -640 - rng() * 20 + 60 * smoothstep(1000, 600, x), chZc(x) + s2 * chHw(x) * rng.range(0.8, 1.0), 60 + rng() * 60, 0, 0, 2); }       // mist along the chute's banks
  for (let i = 0; i < 60; i++) { const t = i / 60, x = lerp(232, 400, t) + rng.range(0, 40), yy = rampYw(x) + rng() * 45, zz = lerp(-118, -545, t) + rng.range(-10, 25), sz = 50 + rng() * 45; if (i % 3 !== 1 || t > 0.5) add(x, yy, zz, sz * (t < 0.5 ? 0.8 : 1), 0, 0, 2); }
  for (let i = 0; i < 26; i++) { const x = rng.range(330, 620), z = W.esc.zAt(x) + rng.range(110, 260), yy = rampYw(x) + 4 + rng() * 22, sz = 50 + rng() * 40; if (i % 2 === 0) add(x, yy, z, sz, 0, 0, 2); }      // spray haze over the flood behind the Rock
  for (let i = 0; i < 44; i++) { const t = i / 44, x = lerp(330, 600, t), z = W.esc.zAt(x) + 85 + rng.range(-15, 35), xx = x + rng.range(-15, 15), yy = rampYw(x) + 2 + rng() * 16, sz = 30 + rng() * 26; if (i % 4 === 0) add(xx, yy, z, sz, 0, 0, 2); }
  // (the thread of mist down a couloir and the veils along the old coast's foot are ribbons: buildVeils)
  // cumulus standing BELOW eye level over the basin, each dropping a blue shadow on the floor
  W.clouds = [];
  for (let i = 0; i < 14; i++) {
    const cx = 1500 + 3800 * (i / 14) + rng.range(-150, 150), cy = rng.range(-330, -150), w = rng.range(230, 420);
    let cz = rng.range(-1700, 2400); if (cx < 3200 && Math.abs(cz - 200) < 650) cz = 200 + (cz < 200 ? -1 : 1) * rng.range(700, 1500);      // never between the lens and the lake
    W.clouds.push({ x: cx, y: cy, z: cz, w });
    if (V.mood === 'pearl') continue;
    for (let k = 0; k < 8; k++) { const a = rng() * TAU, r = Math.sqrt(rng()) * w * 0.7, up = (1 - r / (w * 0.7)) * w * 0.32 * rng(); add(cx + Math.cos(a) * r, cy + up + 20, cz + Math.sin(a) * r * 0.7, w * (0.34 + 0.2 * rng()), 2); }
  }
  // seeded weather: a cap streaming east off the crest of the Rock, or a tan dust storm walking the far salt
  if (V.cap) for (let i = 0; i < 46; i++) { const o = rng.range(-28, 28); add(A.rockCrest[0] - 30, A.rockCrest[1] + 4 + rng() * 14, A.rockCrest[2] + o - 10, 26 + rng() * 16, 1, 0.05 + rng() * 0.03, 0, [A.rockCrest[0] + 215 + rng() * 85, A.rockCrest[1] + 30 + rng() * 60, A.rockCrest[2] + o * 2.4 - 40], 8); }
  if (V.dust) for (let i = 0; i < 54; i++) { const t = i / 54; add(3900 + 700 * Math.sin(t * 5) + rng() * 300, -600 + rng() * 330, -2300 + 4300 * t, 330 + rng() * 240, 0, 0, 1); }
  for (let k = 0; k < 6; k++) {                                  // dust devils walking the dry salt: never on the water, never in the flood's channel
    let x = 0, z = 0;
    for (let tries = 0; tries < 40; tries++) {
      x = rng.range(1300, 4300); z = rng.range(-500, 1400);
      if (Math.hypot(x - B.x, z - B.z) > B.r * 1.25 && (Math.abs(z - chZc(x)) > chHw(x) + 160 || x > B.chEnd + 500) && z > W.esc.zAt(x) + 260) break;
      x = rng.range(1250, 1900); z = rng.range(560, 1150);
    }
    for (let j = 0; j < 6; j++) add(x + j * 14 + rng() * 10, -606 + 26 + j * 46, z + 8 * Math.sin(j * 1.3), 34 + j * 9, 2, 0, 1);
    for (let j = 0; j < 5; j++) list.push([x + j * 30, -606 + 12 + j * 52, z, 16 + j * 10, hash(k * 9.1 + j), 2, 0, 1, 0, 0, 0, 0]);
  }
  // the rare event's column: white water thrown up where the slab strikes, laid flat by the wind
  W.slabAt = new THREE.Vector3(-55, -56, A.wallZ(-55) + 30);
  if (V.rare) for (let i = 0; i < 70; i++) { const a = rng() * TAU, r = rng() * 22, ex = W.slabAt.x + 45 + rng() * 150; add(W.slabAt.x + Math.cos(a) * r, W.slabAt.y - 8, W.slabAt.z + Math.sin(a) * r, 8 + rng() * 7, 4, 1.6 + rng() * 0.9, 0, [ex, rampYw(ex) + 5 + rng() * 13, W.slabAt.z + 6 + rng() * 62], 7 + rng() * 15); }      // laid flat by the wind: it lies along the water, under the tide line
  // the plume where each diving gannet strikes the open swell
  W.uDive = { value: new THREE.Vector2(0, 0) };
  W.diveAt.forEach((p, d) => { for (let i = 0; i < 24; i++) { const a = rng() * TAU, r = rng() * 0.55, hi = rng(); add(p.x + Math.cos(a) * r, 0.1, p.z + Math.sin(a) * r, 0.42 + rng() * 0.5, 5 + d, 1.5 + rng() * 0.8, 0, [p.x + 0.6 + rng() * 1.8 + Math.cos(a) * r * 2.5, 0.5 + hi * 1.2, p.z + Math.sin(a) * r * 2.5 + rng.range(-0.5, 0.5)], 1.0 + hi * 1.5); } });
  list.sort((a, b) => b[0] - a[0]);
  const n = list.length, aPos = new Float32Array(n * 4), aPar = new Float32Array(n * 4), aEnd = new Float32Array(n * 4);
  list.forEach((p, i) => { aPos.set(p.slice(0, 4), i * 4); aPar.set(p.slice(4, 8), i * 4); aEnd.set(p.slice(8, 12), i * 4); });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 4)); g.setAttribute('aPar', new THREE.InstancedBufferAttribute(aPar, 4)); g.setAttribute('aEnd', new THREE.InstancedBufferAttribute(aEnd, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(1500, -200, 0), 9000);
  W.uEvent = { value: 0 };
  const mat = shader(U, ['uTime', 'uSunDir', 'uCam'], { uProg: U.uProgress, uEvent: W.uEvent, uDive: W.uDive, uLitCol: { value: new THREE.Color(M.cloudLit).lerp(new THREE.Color('#FFFFFF'), 0.55).multiplyScalar(0.93) }, uMistCol: { value: new THREE.Color(M.palette[2]).multiplyScalar(0.82) }, uShadeCol: { value: new THREE.Color(M.cloudShade).multiplyScalar(0.8) },
    uDustCol: { value: new THREE.Color('#C8A878') }, uStreamCol: { value: new THREE.Color(M.palette[2]).lerp(new THREE.Color(M.palette[6]), 0.45).multiplyScalar(0.95) } }, PUFF_VERT, PUFF_FRAG, { transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'puffs'; mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
  // cloud shadows on the floor: each cumulus projected down the sun's rays
  const sd = U.uSunDir.value, clouds = W.clouds, cl = W.cl;
  W.parts.push({ update(dt, time) {
    for (let i = 0; i < 14; i++) { const c = clouds[i], k = (c.y + 640) / Math.max(sd.y, 0.2);
      if (V.mood === 'pearl') cl[i].set(c.x + 900 * Math.sin(time * 0.05 + i * 2.4) - sd.x * k * 0.3, c.z + 700 * Math.cos(time * 0.041 + i * 1.7), c.w * 1.1, 0);
      else cl[i].set(c.x + time * 24 - sd.x * k, c.z - sd.z * k, c.w * 0.95, 0); }
  } });
}

// ---------------------------------------------------------------------------------------------------------
// BIRDS OF THE STRAIT (living kinds, as the brief asks): one lofted, jointed-wing builder for the vultures,
// shearwaters, auks and storm-petrels. Model space: +x forward, +y up, wings along +-z, metres at life size.
// ---------------------------------------------------------------------------------------------------------
function birdGeo(o) {
  const P = [], C = [], C2 = [], Wg = [], I = [];
  const col = (h) => new THREE.Color(h);
  const top = col(o.top), belly = col(o.belly), head = col(o.head || o.top), bill = col(o.bill), wingA = col(o.wingA || o.top), wingB = col(o.wingB || o.top), under = col(o.under || o.belly), underTip = col(o.underTip || o.wingB || o.top);
  const v = (x, y, z, c, c2, ws = 0, hand = 0) => { P.push(x, y, z); C.push(c.r, c.g, c.b); C2.push(c2.r, c2.g, c2.b); Wg.push(ws, hand); return P.length / 3 - 1; };
  // body: a lofted cigar, deeper in the chest, dark above and pale below, the head carried straight out
  const L = o.len, R = o.radius, NS = o.sides || 8, prof = o.profile, NRg = prof.length, tmp = new THREE.Color();
  for (let k = 0; k < NRg; k++) {
    const [t, rr, lift] = prof[k], x = (t - 0.45) * L;
    for (let j = 0; j < NS; j++) {
      const a = j / NS * TAU, cy = Math.cos(a), sz = Math.sin(a), yy = cy * R * rr * (cy < 0 ? 0.92 : 1) + lift * L;
      const cTop = t > o.headAt ? head : (o.ruff && Math.abs(t - o.ruff[0]) < 0.045 ? col(o.ruff[1]) : top);
      tmp.copy(belly).lerp(cTop, smoothstep(-0.35, 0.25, cy)); if (o.rump && t < 0.2 && cy > 0) tmp.lerp(col(o.rump), 0.9);
      v(x, yy, sz * R * rr * (o.wide || 1), tmp, tmp);
    }
  }
  for (let k = 0; k < NRg - 1; k++) for (let j = 0; j < NS; j++) { const a = k * NS + j, b = k * NS + (j + 1) % NS, c = a + NS, d = b + NS; I.push(a, b, c, b, d, c); }
  { // the bill: a wedge with a ridge, hooked at the tip where the kind has one
    const [t, rr, lift] = prof[NRg - 1], x0 = (t - 0.45) * L, y0 = lift * L, r0 = R * rr, bl = o.billLen, bd = o.billDepth, hk = o.hook || 0;
    const tip = v(x0 + bl, y0 - hk, 0, bill, bill), a = v(x0, y0 + bd, 0, bill, bill), b = v(x0, y0 - bd * 0.7, 0, bill, bill), l = v(x0, y0, r0 * 0.8, bill, bill), r = v(x0, y0, -r0 * 0.8, bill, bill);
    const m = v(x0 + bl * 0.6, y0 + bd * 0.55, 0, bill, bill);
    I.push(a, l, m, a, m, r, m, l, tip, m, tip, r, b, tip, l, b, r, tip);
    const eye = col('#0d0c0b');                       // a dark eye each side with a pale ring where the kind has one
    for (const s of [1, -1]) { const e0 = v(x0 - r0 * 0.5, y0 + r0 * 0.45, s * r0 * 0.93, eye, eye), e1 = v(x0 - r0 * 1.3, y0 + r0 * 0.5, s * r0 * 1.0, eye, eye), e2 = v(x0 - r0 * 0.9, y0 + r0 * 0.05, s * r0 * 1.06, eye, eye); if (s > 0) I.push(e0, e1, e2); else I.push(e0, e2, e1); }
  }
  { // tail: a flat wedge or square fan
    const x0 = -0.45 * L + 0.02, tw = o.tailW, tl = o.tailLen, c = col(o.tail || o.top);
    const a = v(x0 + tl * 0.5, 0.01, tw * 0.35, c, c), b = v(x0 + tl * 0.5, 0.01, -tw * 0.35, c, c), d = v(x0 - tl, 0, tw * (o.tailSq ? 0.55 : 0.2), c, c), e = v(x0 - tl, 0, -tw * (o.tailSq ? 0.55 : 0.2), c, c), m = v(x0 - tl * (o.tailSq ? 1.0 : 1.25), 0, 0, c, c);
    I.push(a, b, d, b, e, d, d, e, m);
  }
  // wings: stations from shoulder to tip, three vertices across the chord (leading edge, coverts line, trailing edge)
  const st = o.wing, half = o.span / 2, root = R * 0.55;
  for (const s of [1, -1]) {
    const base = P.length / 3;
    for (let k = 0; k < st.length; k++) {
      const [f, xo, chord, covert] = st[k], z = s * (root + f * (half - root)), hand = smoothstep(o.wrist || 0.5, 1, f);
      const ct = tmp.copy(wingA).lerp(wingB, smoothstep(o.tipAt || 0.66, (o.tipAt || 0.66) + 0.06, f)).clone(), cu = tmp.copy(under).lerp(underTip, smoothstep(0.8, 0.9, f)).clone();
      const yb = 0.012 + 0.06 * chord * (1 - f);
      v(xo * L + chord * 0.5, R * 0.35, z, ct, cu, s * f, hand);
      v(xo * L + chord * (0.5 - covert), R * 0.35 + yb, z, ct, cu, s * f, hand);
      v(xo * L - chord * 0.5, R * 0.35, z, f < (o.tipAt || 0.66) ? wingB : ct, o.underRear ? col(o.underRear) : cu, s * f, hand);
    }
    for (let k = 0; k < st.length - 1; k++) for (let j = 0; j < 2; j++) { const a = base + k * 3 + j, b = a + 1, c = a + 3, d = c + 1; if (s > 0) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d); }
    if (o.fingers) {                                      // splayed primaries: six separate feathers at each tip
      const [f0, xo, chord] = st[st.length - 1], z0 = s * (root + f0 * (half - root));
      for (let q = 0; q < o.fingers; q++) {
        const a = (q / (o.fingers - 1) - 0.42) * 1.25, fl = o.fingerLen * (1 - 0.35 * Math.abs(q / (o.fingers - 1) - 0.4)), w = chord / o.fingers * 0.42;
        const bx = xo * L + chord * (0.5 - (q + 0.5) / o.fingers), dx = -Math.sin(a) * fl, dz = s * Math.cos(a) * fl;
        const p0 = v(bx + w, R * 0.35, z0, wingB, underTip, s, 1), p1 = v(bx - w, R * 0.35, z0, wingB, underTip, s, 1), p2 = v(bx + dx + w * 0.5, R * 0.35 + 0.02, z0 + dz, wingB, underTip, s * 1.25, 1), p3 = v(bx + dx - w * 0.5, R * 0.35 + 0.02, z0 + dz, wingB, underTip, s * 1.25, 1);
        if (s > 0) I.push(p0, p1, p2, p1, p3, p2); else I.push(p0, p2, p1, p1, p2, p3);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('color2', new THREE.Float32BufferAttribute(C2, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wg, 2)); g.setIndex(I);
  g.computeVertexNormals();
  return g;
}
const BIRD_VERT = /* glsl */`
attribute vec3 color, color2; attribute vec2 aW; attribute vec4 aB;     // per bird: phase, beats per second, share of the cycle spent gliding, beat amplitude
uniform float uTime, uDih;
varying vec3 vCol, vCol2, vN;
${FOG_V}
void main(){
  vec3 p = position, n = normal; float s = abs(aW.x), side = sign(aW.x);
  if (s > 0.001) {
    float tt = uTime + aB.x * 7.;
    float env = aB.z < 0.01 ? 1. : smoothstep(aB.z, aB.z + 0.07, fract(tt * 0.29 + aB.x)) * (1. - smoothstep(0.93, 1., fract(tt * 0.29 + aB.x)));
    float ang = uDih * s + aB.w * env * sin(6.2831853 * aB.y * tt - 1.3 * s) * (0.3 + 0.7 * s) + (1. - env) * 0.05 * sin(tt * 0.9) * s;
    ang += 0.25 * aB.w * env * aW.y * sin(6.2831853 * aB.y * tt - 2.2);                   // the hand lags the arm
    float ca = cos(ang), sa = sin(ang), z = abs(p.z);
    p.y += z * sa; p.z = side * z * ca; p.x -= aW.y * env * aB.w * 0.12 * max(cos(6.2831853 * aB.y * tt), 0.) * z;   // folds a little on the upstroke
    n = normalize(vec3(n.x, n.y * ca, n.z - side * sa * n.y));
  }
  vec4 lp = instanceMatrix * vec4(p, 1.); vN = mat3(instanceMatrix) * n; vCol = color; vCol2 = color2;
  vec4 mv = modelViewMatrix * lp;
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix * mv;
}`;
const BIRD_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce;
varying vec3 vCol, vCol2, vN;
${FOG_F}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 alb = vCol;
  if (!gl_FrontFacing) { N = -N; alb = vCol2; }
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 col = alb * (uSunCol * (ndl * 0.95 + 0.06) + uSkyCol * (0.75 + 0.45 * N.y) + uBounce * (0.9 - 0.9 * N.y));
  gl_FragColor = vec4(fogMix(col), 1.);
}`;
function birdMesh(W, geo, count, dih, name) {
  const aB = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); geo.setAttribute('aB', aB);
  const mat = shader(W.U, ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce'], { uDih: { value: dih } }, BIRD_VERT, BIRD_FRAG, { side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geo, mat, count); mesh.name = name; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  W.scene.add(mesh);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  return { mesh, aB,
    place(i, pos, yaw, bank, pitch, scale) { e.set(bank, yaw, pitch, 'YZX'); q.setFromEuler(e); sc.setScalar(scale); m.compose(pos, q, sc); mesh.setMatrixAt(i, m); },
    commit() { mesh.instanceMatrix.needsUpdate = true; } };
}

// The gannets: an escort on its own rail (world objects keyed to u, never parented to the camera), two that plunge
// into the open swell, nine that peel away at the lip, and the ledge birds that lift off as we pass.
async function buildGannetCast(W) {
  const { scene, U, V, rng, path, A } = W, n = V.gannets, G = buildGannets(n, U), nP = 36;
  await W.ctx.yield();
  const PG = buildGannets(nP, U);
  await W.ctx.yield();
  scene.add(G.object); scene.add(PG.object);
  const birds = [], pos = new THREE.Vector3(), tan = new THREE.Vector3(), right = new THREE.Vector3(), Lp = path.length;
  // THE ESCORT ROAMS: each bird wanders round the lens on its own slow figure (fore and aft, side to side, up and down, on
  // wavelengths of 130 to 260 m of flight), so it overtakes, falls back, crosses the bow and comes to arm's length; no bird
  // holds one place in the picture. World objects on the hero's rail; nothing is parented to the camera.
  for (let i = 0; i < n; i++) {
    const stay = i < 5, sg = i % 2 ? 1 : -1;
    birds.push({ stay, dir: sg, ph: rng(), sc: rng.range(0.95, 1.06), lag: rng() * 0.04,
      l0: stay ? [4.3, 5.6, 9, 6.6, 12][i] : 14 + rng() * 22, l1: stay ? [0.8, 1.3, 3.0, 1.6, 4.0][i] : 5 + rng() * 6, kl: TAU / (stay ? [150, 215, 180, 260, 135][i] : rng.range(140, 260)), pl: stay ? [0.6, 2.9, 4.6, 1.7, 3.6][i] : rng() * TAU,
      s0: stay ? [0.9, -1.6, 3.6, 1.6, 5.5][i] : sg * (6 + rng() * 9), s1: stay ? [1.5, 1.4, 3.0, 2.0, 4.0][i] : 3 + rng() * 5, ks: TAU / (stay ? [175, 130, 235, 160, 200][i] : rng.range(130, 240)), ps: stay ? [2.2, 0.4, 3.9, 5.3, 1.1][i] : rng() * TAU,
      dy: stay ? [1.5, -1.9, 2.8, 2.1, 3.6][i] : rng.range(-2.5, 4), y1: stay ? [0.5, 0.6, 0.7, 0.6, 0.9][i] : 1 + rng() * 1.5, ky: TAU / (stay ? [120, 165, 140, 190, 110][i] : rng.range(110, 200)), py: rng() * TAU });
  }
  const diver = (k) => n - 1 - k, o = {}, stay5 = (i) => i < 5;
  const perches = W.perches, pb = [];
  for (let i = 0; i < nP; i++) { const p = perches[i % perches.length], k = Math.floor(i / perches.length); pb.push({ p: p.p.clone().add(new THREE.Vector3((p.colony && !k ? 0 : rng.range(-1.2, 1.2)) + k * 0.9, 0, 0)), out: p.out, u0: rng() < 0.35 ? 9 : path.nearestXZ(p.p.x, p.p.z).u - 0.006 - rng() * 0.016, ph: rng(), yaw: rng.range(-0.8, 0.8), sc: p.colony && !k ? 1.7 : 1.15 }); if (p.colony && !k && (i === 2 || i === 5)) { pb[i].u0 = path.nearestXZ(p.p.x, p.p.z).u - 0.017 + 0.003 * i; pb[i].open = 1; } if (p.colony && !k && i === 7) pb[i].u0 = path.nearestXZ(p.p.x, p.p.z).u - 0.045; }
  W.parts.push({ update(dt, time, camera, u) {
    const d = u * Lp;
    for (let i = 0; i < n; i++) {
      const b = birds[i], ent = 1 - smoothstep(W.U0, W.U0 + 0.05, u), rem = (1 - u) * Lp;
      let lead = b.l0 + b.l1 * Math.sin(d * b.kl + b.pl) + 0.8 * Math.sin(time * 0.37 + i * 1.7) + ent * (stay5(i) ? 0.4 + 0.5 * i : 10 + i);
      let side = b.s0 + b.s1 * Math.sin(d * b.ks + b.ps) + 0.5 * Math.sin(time * 0.29 + i * 2.3);
      const dsd = b.s1 * b.ks * Math.cos(d * b.ks + b.ps);                                   // metres sideways per metre flown
      let y = 8 + b.dy + b.y1 * Math.sin(d * b.ky + b.py) + 0.3 * Math.sin(time * 0.9 + i) + ent * (0.8 + 0.8 * Math.sin(i * 1.9 + 0.5));
      if (b.stay) {
        const down = smoothstep(0.515, 0.56, u) * (1 - smoothstep(0.895, 0.94, u));              // while we look down the chute and over the void they fly below the lens, on the water
        y = lerp(y, 8 - 1.2 - 0.33 * lead + 0.6 * b.y1 * Math.sin(d * b.ky + b.py), down); side += down * (1.5 + 0.15 * lead);
        side = clamp(side, -0.46 * lead, lerp(0.46, 0.6, down) * lead); y = 8 + clamp(y - 8, -0.5 * lead, 0.31 * lead);
      }      // whole in the picture, never cut by its edge
      let yawAdd = -Math.atan(dsd) + 0.22 * Math.sin(d * b.kl * 0.7 + i * 2.1), bank = clamp(-dsd * 2.2, -0.5, 0.5) + 0.4 * Math.sin(d * b.ks * 1.3 + i * 1.3) + 0.08 * Math.sin(time * 0.29 + i * 2.3 + 1.5), pitch = 0.03 * Math.sin(time * 0.9 + i) + 0.6 * b.y1 * b.ky * Math.cos(d * b.ky + b.py), dive = 0, flap = 0, scale = b.sc;
      if (b.stay) {                                               // at the end they stream ahead and go through the ring before us
        const run = smoothstep(0.90, 0.985, u); lead += 26 * run; side *= 1 - 0.85 * run; y = lerp(y, 8 + 0.35 * b.dy, run); flap = run;
        if (lead > rem - 2) scale = 0; lead = Math.min(lead, rem + 4);
      } else {                                                    // the rest peel up and back west where the sea tips away
        const p = smoothstep(0.265 + b.lag, 0.40 + b.lag, u);
        lead -= 520 * p * p; y += 46 * p; side += b.dir * 70 * Math.sin(p * Math.PI * 0.5); yawAdd += b.dir * Math.PI * smoothstep(0.03, 0.55, p); bank += -b.dir * 0.6 * Math.sin(p * Math.PI); flap = Math.sin(p * Math.PI);
        if (p > 0.995) scale = 0;
      }
      path.posAtDist(d + lead, pos); path.tangentAtDist(d + lead, tan); right.set(-tan.z, 0, tan.x);
      pos.addScaledVector(right, side); pos.y = y;
      const wz = A.wallZ(pos.x) + 7 + Math.max(y - 9, 0) * 0.5; if (pos.z < wz && pos.x < 215) pos.z = wz;      // never into the rock: the wall leans back above the tide line
      let yaw = Math.atan2(-tan.z, tan.x) + yawAdd;
      for (let k = 0; k < 2; k++) if (i === diver(k)) {            // climb to y 28, wings thrown back to an arrow, a white plume
        const dp = (u - DIVE[k].u0) / 0.07, at = W.diveAt[k];
        if (dp > 0) {
          const up = smoothstep(0, 0.55, dp), fall = smoothstep(0.6, 1, dp);
          pos.x = lerp(pos.x, at.x - 4 * (1 - fall), up); pos.z = lerp(pos.z, at.z, up); pos.y = lerp(pos.y, 28, up) - 29 * fall * fall;
          dive = smoothstep(0.5, 0.68, dp); pitch = lerp(0.5 * Math.sin(up * Math.PI), -1.35, smoothstep(0.52, 0.7, dp)); flap = 1 - dive;
          if (dp >= 1) scale = 0;
        }
      }
      o.position = pos; o.yaw = yaw; o.bank = bank; o.pitch = pitch; o.phase = b.ph; o.dive = dive; o.flap = flap; o.scale = scale; o.perch = 0;
      G.place(i, o);
    }
    G.commit();
    W.uDive.value.set((u - DIVE[0].u0 - 0.07 + 0.004) / 0.03 + 0.12, (u - DIVE[1].u0 - 0.07 + 0.004) / 0.03 + 0.12);
    for (let i = 0; i < nP; i++) {                                // ledge birds: folded and upright until we come, then out over the flood
      const b = pb[i], du = u - b.u0, tr = Math.max(du, 0) * Lp, go = smoothstep(0, 0.012, du);
      pos.copy(b.p); pos.x += tr * 0.9 + go * 2; pos.y += 0.275 * b.sc * (1 - go) + go * (1.6 + 5 * Math.sin(Math.min(tr / 60, 1) * Math.PI) - Math.max(tr - 50, 0) * 0.16); pos.z += b.out[1] * Math.min(tr * 0.3 + go * 2.5, 5.5); pos.x += b.out[0] * Math.min(tr * 0.3, 5.5);      // out along the face, above and left of the lens, never across it
      const openK = b.open ? smoothstep(b.u0 - 0.034, b.u0 - 0.014, u) : 0;                        // two stand with wings half open, leaning into the wind, before they go
      o.position = pos; o.yaw = lerp(-Math.PI / 2 - 0.25 + 0.6 * b.yaw, -0.12, go); o.bank = 0; o.pitch = lerp(-0.2 * openK, 0.04, go); o.phase = b.ph; o.dive = 0; o.perch = (1 - go) * (1 - 0.5 * openK); o.flap = go * (1 - smoothstep(60, 140, tr)); o.scale = b.sc;
      if (du <= 0) { o.yaw += 0.22 * Math.sin(time * 0.6 + i * 1.3); o.pitch += 0.05 * Math.sin(time * 1.1 + i * 2.1); }
      PG.place(i, o);
    }
    PG.commit();
  } });
}

// Vultures wheeling off the prow, shearwaters shearing the swell in lines of forty, auks (or storm-petrels) low over the sea.
function buildBirds(W) {
  const { U, V, rng, path, A, detail, density } = W, Lp = path.length;
  const pos = new THREE.Vector3(), tan = new THREE.Vector3(), right = new THREE.Vector3();
  // ---- griffon-type vultures: plank wings, six splayed fingers, short square tail, pale head sunk in a cream ruff ----
  const vg = birdGeo({ len: 1.1, radius: 0.17, sides: 10, wide: 1.1, headAt: 0.86, ruff: [0.8, '#E6DCC0'], top: '#8C7350', belly: '#A08660', head: '#D9D2C0', bill: '#6E6657', billLen: 0.085, billDepth: 0.04, hook: 0.035,
    profile: [[0, 0.12, 0.0], [0.08, 0.5, 0.0], [0.22, 0.86, 0.0], [0.4, 1.0, 0.0], [0.58, 0.95, 0.005], [0.7, 0.74, 0.012], [0.78, 0.6, 0.02], [0.82, 0.62, 0.022], [0.87, 0.36, 0.02], [0.93, 0.33, 0.012], [0.975, 0.24, 0.004]],
    tailW: 0.52, tailLen: 0.3, tailSq: true, tail: '#3A2E26', span: 2.6, wrist: 0.45, tipAt: 2,
    wing: [[0, 0.02, 0.6, 0.5], [0.2, 0.05, 0.64, 0.5], [0.45, 0.07, 0.62, 0.5], [0.68, 0.05, 0.58, 0.48], [0.84, 0.02, 0.52, 0.45]],
    wingA: '#B99A6A', wingB: '#3A2E26', under: '#A58A5E', underRear: '#2E2520', underTip: '#2E2520', fingers: 6, fingerLen: 0.5 });
  const NV = 8, NF = 30, vul = birdMesh(W, vg, NV + NF, 0.16, 'vultures');
  const VK = W.toOld(0.785), vs = [], gz = { cam: path.posAtDist(VK * Lp, new THREE.Vector3()) };          // where the lens is, and looks, at u 0.78 (the same blend the engine makes with the basin poi)
  { const ah = path.posAtDist(VK * Lp + 30, new THREE.Vector3()).sub(gz.cam).normalize(), tp = W.gazeBasin.clone().sub(gz.cam).normalize();
    gz.G = ah.multiplyScalar(0.62).addScaledVector(tp, 0.38).normalize(); gz.Gh = new THREE.Vector3(gz.G.x, 0, gz.G.z).normalize(); gz.R = new THREE.Vector3(-gz.Gh.z, 0, gz.Gh.x); gz.T = path.tangentAtDist(VK * Lp, new THREE.Vector3()).setY(0).normalize(); }
  for (let k = 0; k < NV; k++) {
    const d = (0.72 + 0.021 * k) * Lp, r = 13 + 1.6 * k, sgn = k === 2 || k === 5 ? -1 : 1;
    path.posAtDist(d, pos); W.rightAt(d, right);
    if (k < 4) {            // crossers, composed for the moment the last rock goes (u 0.78): two sail across the bow at 12 to 17 m and away,
      // a little below the lens so their backs show (plank wings in a shallow V, fingers, sand coverts, ruff); a third beyond at
      // half the size; a fourth further off. Wide circles keyed to u, at 22 m/s, so we close on them slowly.
      const [fw, sd, dy, th, dir, sc] = [[11.5, -1.5, -2.4, -0.07, -1, 1.55], [16, 7, -0.8, 0.09, 1, 1.55], [29, 3, -4.2, 0.03, 1, 1.3], [46, 20, 3, -0.2, -1, 1.2]][k], r = 60;
      const P0 = gz.cam.clone().addScaledVector(gz.G, fw).addScaledVector(gz.R, sd); P0.y += dy;
      // they sail the way we fly (the path's own heading, a few degrees either side) at our speed, so they hang ahead of the bow, seen from behind and above
      const hx = gz.T.x * Math.cos(th) - gz.T.z * Math.sin(th), hz = gz.T.x * Math.sin(th) + gz.T.z * Math.cos(th);
      const ex = dir * hz, ez = -dir * hx, c = new THREE.Vector3(P0.x - r * ex, P0.y, P0.z - r * ez);
      vs.push({ c, r, dir, ph: Math.atan2(ez, ex), T: 15.7, sc, key: VK, bank: 0.1 });
    } else vs.push({ c: pos.clone().addScaledVector(right, sgn * (r + 12.5 + 2 * (k % 3))).setY(8 + [-3, 5, 9, -6, 2, 12, -1, 6][k]), r, dir: k % 2 ? 1 : -1, ph: rng() * TAU, T: 12, sc: rng.range(0.95, 1.08) });
  }
  for (let k = 0; k < NF; k++) vs.push({ c: new THREE.Vector3(rng.range(380, 1000), rng.range(-430, -130), rng.range(-260, 520)), r: rng.range(45, 120), dir: rng() < 0.5 ? 1 : -1, ph: rng() * TAU, T: rng.range(22, 34), sc: 1.15 });
  for (let k = 0; k < 12; k++) {                     // a dozen turning over the chute below the bow: small, but birds, not specks
    const b = vs[NV + k], fw = 95 + 150 * hash(k * 3.7 + 1);
    b.c.copy(gz.cam).addScaledVector(gz.Gh, fw).addScaledVector(gz.R, (hash(k * 5.3 + 2) - 0.45) * fw * 0.9); b.c.y = 8 - fw * (0.22 + 0.3 * hash(k * 2.1 + 5));
    b.r = 16 + 22 * hash(k * 7.9); b.T = 12 + 5 * hash(k * 1.3 + 3); b.sc = 1.3;
  }
  vs.forEach((b, i) => vul.aB.setXYZW(i, rng(), 0.4, 0, 0.0));
  // ---- shearwaters: stiff bowed wings, brown-grey above and white below, three beats then a long tilting glide ----
  const sg = birdGeo({ len: 0.5, radius: 0.062, sides: 6, headAt: 0.84, top: '#6B6257', belly: '#F1F0EA', head: '#5E564D', bill: '#33302C', billLen: 0.05, billDepth: 0.012, hook: 0.012,
    profile: [[0, 0.1, 0], [0.15, 0.6, 0], [0.4, 1, 0], [0.65, 0.92, 0], [0.82, 0.62, 0.006], [0.92, 0.5, 0.008], [0.975, 0.3, 0.004]],
    tailW: 0.13, tailLen: 0.11, span: 1.2, wrist: 0.42, tipAt: 0.8,
    wing: [[0, 0.03, 0.13, 0.5], [0.22, 0.07, 0.125, 0.5], [0.45, 0.085, 0.11, 0.5], [0.72, 0.0, 0.085, 0.5], [1, -0.16, 0.02, 0.5]], wingA: '#6B6257', wingB: '#4A433B', under: '#F1F0EA', underTip: '#57504A' });
  const nLines = Math.max(4, Math.round((V.shearMany ? 18 : 10) * detail * Math.min(density, 1.1))), PER = 40, shear = birdMesh(W, sg, nLines * PER, -0.10, 'shearwaters');
  const lines = [];
  for (let k = 0; k < nLines; k++) {
    const cross = k < 3, sideSign = k % 2 ? 1 : -1;
    lines.push({ cross, D: cross ? [0.125, 0.19, 0.25][k] * Lp : 0, ang: cross ? sideSign * rng.range(1.0, 1.35) : sideSign * rng.range(0.05, 0.3), off: sideSign * rng.range(22, 190), x0: rng() * 520, gap: 17 + 4 * k, ph: rng() * 10, sp: rng.range(2.6, 3.4) });
  }
  for (let i = 0; i < nLines * PER; i++) shear.aB.setXYZW(i, rng(), 3.4, 0.62, 0.42);
  // ---- razorbill-type auks whirring through at 10 m, or storm-petrels pattering on the swell ------------------
  const ag = V.petrels
    ? birdGeo({ len: 0.2, radius: 0.03, sides: 6, headAt: 0.82, top: '#2B2622', belly: '#2B2622', rump: '#F0EEE8', bill: '#141210', billLen: 0.02, billDepth: 0.006, hook: 0.004,
      profile: [[0, 0.1, 0], [0.2, 0.7, 0], [0.45, 1, 0], [0.7, 0.9, 0], [0.86, 0.62, 0.01], [0.97, 0.35, 0.01]], tailW: 0.07, tailLen: 0.06, tailSq: true, span: 0.42, wrist: 0.4, tipAt: 2,
      wing: [[0, 0.04, 0.075, 0.5], [0.3, 0.1, 0.075, 0.5], [0.55, 0.1, 0.065, 0.5], [0.8, 0.0, 0.05, 0.5], [1, -0.2, 0.012, 0.5]], wingA: '#3B342E', wingB: '#231F1B', under: '#3B342E' })
    : birdGeo({ len: 0.4, radius: 0.072, sides: 8, headAt: 0.8, top: '#1E2226', belly: '#F2F2EE', bill: '#16181A', billLen: 0.05, billDepth: 0.03, hook: 0.006,
      profile: [[0, 0.12, 0], [0.12, 0.62, 0], [0.32, 0.98, 0], [0.55, 1, 0], [0.75, 0.8, 0.004], [0.86, 0.62, 0.008], [0.95, 0.52, 0.008]], tailW: 0.09, tailLen: 0.08, span: 0.65, wrist: 0.5, tipAt: 2,
      wing: [[0, 0.02, 0.1, 0.5], [0.3, 0.04, 0.1, 0.5], [0.6, 0.03, 0.085, 0.5], [0.85, -0.02, 0.055, 0.5], [1, -0.08, 0.012, 0.5]], wingA: '#1E2226', wingB: '#15181B', under: '#D9DAD6', underTip: '#2A2D30' });
  const NA = V.petrels ? 40 : 36, auk = birdMesh(W, ag, NA, V.petrels ? 0.55 : 0.02, V.petrels ? 'storm-petrels' : 'auks');
  const as = [];
  for (let i = 0; i < NA; i++) {
    auk.aB.setXYZW(i, rng(), V.petrels ? 6.5 : 9, 0, V.petrels ? 0.5 : 0.62);
    as.push({ d: rng.range(20, 330), side: (rng() < 0.5 ? -1 : 1) * rng.range(5.5, 13), ph: rng() * TAU, line: Math.floor(i / 12), j: i % 12, wob: rng() });
  }
  const aukD = [0.15, 0.215, 0.275].map((x) => x * Lp);
  W.parts.push({ update(dt, time, camera, u) {
    const d = u * Lp, tw = U.uTime.value;
    for (let i = 0; i < vs.length; i++) {                         // never a wing beat: a shallow V, one turn in 12 s, a wing tipped to steer
      const b = vs[i], a = b.ph + b.dir * (b.key !== undefined ? (u - b.key) * 44 / 1.06 : time) * TAU / b.T, steer = Math.sin(time * 0.7 + i * 1.9);
      pos.set(b.c.x + Math.cos(a) * b.r, b.c.y + 1.2 * Math.sin(time * 0.23 + i), b.c.z + Math.sin(a) * b.r);
      vul.place(i, pos, -a - b.dir * Math.PI / 2, b.dir * (b.bank || 0.3) + 0.1 * steer, 0.02 * steer, b.sc);
    }
    vul.commit();
    const sea = u < 0.42;
    shear.mesh.visible = sea; auk.mesh.visible = sea;
    if (!sea) return;
    for (let k = 0; k < nLines; k++) {
      const ln = lines[k];
      for (let j = 0; j < PER; j++) {
        let x, z, yaw, sc = 1;
        if (ln.cross) {                                             // keyed to u: the tail of the line clears the lens by 17 m and more
          const s = (d - ln.D + ln.gap) * 0.36 + (PER - 1 - j) * ln.sp + 5 * Math.sin(time * 0.21 + k);
          path.posAtDist(ln.D, pos); path.tangentAtDist(ln.D, tan);
          const ca = Math.cos(ln.ang), sa = Math.sin(ln.ang), dx = tan.x * ca - tan.z * sa, dz = tan.x * sa + tan.z * ca;
          const wq = 4.5 * Math.sin(j * 0.61 + k * 1.3) + 2.2 * Math.sin(j * 1.7 + k);      // a loose skein, not a file: seen end-on a file stacked into one brown star
          x = pos.x + dx * s - dz * wq; z = pos.z + dz * s + dx * wq; yaw = Math.atan2(-dz, dx);
        } else {
          const s = (ln.x0 + time * 12 - j * ln.sp) % 520, ss = s < 0 ? s + 520 : s;
          x = -640 + ss * Math.cos(ln.ang); z = ln.off + ss * Math.sin(ln.ang) * 0.5 + 2 * Math.sin(j * 0.9 + k) + 5 * Math.sin(j * 0.47 + k * 2.1); yaw = -ln.ang * 0.5;
          sc = smoothstep(0, 25, ss) * (1 - smoothstep(380, 420, ss));
        }
        const g = Math.sin(time * 0.85 + j * 0.33 + ln.ph);
        pos.set(x, Math.max(A.waterHeight(x, z, tw), -3) + 0.75 + 0.5 * g, z);
        shear.place(k * PER + j, pos, yaw, 0.85 * g, 0.03, sc);
      }
    }
    shear.commit();
    for (let i = 0; i < NA; i++) {
      const b = as[i];
      if (V.petrels) {                                              // pattering: wings held up, feet on the water, dancing into the wind
        path.posAtDist(b.d, pos); W.rightAt(b.d, right); pos.addScaledVector(right, b.side + 1.5 * Math.sin(time * 0.4 + b.ph));
        pos.x += 3 * Math.sin(time * 0.31 + b.ph * 2); pos.y = A.waterHeight(pos.x, pos.z, tw) + 0.16 + 0.07 * Math.abs(Math.sin(time * 5 + b.ph));
        auk.place(i, pos, Math.PI + 0.5 * Math.sin(time * 0.5 + b.ph), 0.15 * Math.sin(time * 2.3 + b.ph), 0.25, 1.6);
      } else {                                                      // a line of twelve, whirring, crossing 10 m ahead
        const D = aukD[b.line], sg2 = b.line % 2 ? -1 : 1, s = (d - D + 10) * 0.55 + (11 - b.j) * 1.25 - 2;
        path.posAtDist(D, pos); path.tangentAtDist(D, tan);
        const ca = Math.cos(sg2 * 1.25), sa = Math.sin(sg2 * 1.25), dx = tan.x * ca - tan.z * sa, dz = tan.x * sa + tan.z * ca;
        pos.x += dx * s; pos.z += dz * s; pos.y = 5.6 - 0.02 * Math.abs(s) + 0.25 * Math.sin(time * 1.9 + b.ph) + 0.3 * Math.sin(b.j * 1.3);
        auk.place(i, pos, Math.atan2(-dz, dx), 0.08 * Math.sin(time * 2 + b.ph), 0.1, 1);
      }
    }
    auk.commit();
  } });
}

// ---------------------------------------------------------------------------------------------------------
// THE WALL'S OWN LIFE (above the old tide line only): dwarf fan palms, wild olives and stone-type pines thrashing
// in the gale that blows the way the water goes; jointed ledge blocks; perches for the ledge gannets.
// ---------------------------------------------------------------------------------------------------------
function plantGeo(kind, rng, hi = false) {
  const P = [], N = [], C = [], S = [], I = [], c = new THREE.Color(), n3 = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const v = (x, y, z, nx, ny, nz, col, sway, flash = 0, thin = 0) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(col.r, col.g, col.b); S.push(sway, flash, thin); return P.length / 3 - 1; };
  const tube = (pts, r0, r1, col, sides = 5) => {                 // a bent limb: rings along a polyline
    const base = P.length / 3;
    pts.forEach((p, k) => { const t = k / (pts.length - 1), r = lerp(r0, r1, t); for (let j = 0; j < sides; j++) { const a = j / sides * TAU, rr = r * (0.8 + 0.4 * hash(k * 3.1 + j * 1.7)); v(p[0] + Math.cos(a) * rr, p[1], p[2] + Math.sin(a) * rr, Math.cos(a), 0.1, Math.sin(a), c.copy(col).multiplyScalar(0.7 + 0.5 * hash(k * 7 + j)), p[3] ?? t * 0.5); } });
    for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < sides; j++) { const a = base + k * sides + j, b = base + k * sides + (j + 1) % sides; I.push(a, a + sides, b, b, a + sides, b + sides); }
  };
  // a flat-shaded triangle with its own normal (leaves, pleats, tufts: nothing here is a smooth ball)
  const tri = (a, b, d, col, sw, flash, thin) => {
    e1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); e2.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]); n3.crossVectors(e1, e2); if (n3.lengthSq() < 1e-12) n3.set(0, 1, 0); n3.normalize();
    const i0 = v(a[0], a[1], a[2], n3.x, n3.y, n3.z, col[0], sw[0], flash, thin); v(b[0], b[1], b[2], n3.x, n3.y, n3.z, col[1], sw[1], flash, thin); v(d[0], d[1], d[2], n3.x, n3.y, n3.z, col[2], sw[2], flash, thin);
    I.push(i0, i0 + 1, i0 + 2); return n3.y;
  };
  const ICO = new THREE.IcosahedronGeometry(1, 0), ip = ICO.attributes.position, ca = new THREE.Color(), cb = new THREE.Color(), cc = new THREE.Color();
  const tuft = (cx, cy, cz, rx, ry, rz, col, col2, sway, flash) => {     // a ragged cluster of leaves: a spiked faceted clump, dark underneath, each face its own tone
    const sd = rng() * 97, rot = rng() * TAU, cr = Math.cos(rot), sr = Math.sin(rot), q = [];
    for (let i = 0; i < ip.count; i++) {
      n3.fromBufferAttribute(ip, i); const h = hash(Math.round(n3.x * 31) + Math.round(n3.y * 57) * 3 + Math.round(n3.z * 91) * 7 + sd), k = 0.5 + 1.1 * h * h;
      q.push([cx + (n3.x * cr - n3.z * sr) * rx * k, cy + n3.y * ry * k, cz + (n3.x * sr + n3.z * cr) * rz * k, sway * (0.8 + 0.4 * (n3.y * 0.5 + 0.5))]);
    }
    for (let i = 0; i < ip.count; i += 3) {
      const a = q[i], b = q[i + 1], d = q[i + 2], up = ((a[1] + b[1] + d[1]) / 3 - cy) / Math.max(ry, 1e-3), t = 0.72 + 0.5 * hash(i * 3.3 + sd);
      ca.copy(col).lerp(col2, smoothstep(-0.5, 0.7, up) * (0.45 + 0.55 * hash(i * 1.9 + sd))).multiplyScalar(t);
      tri(a, b, d, [ca, ca, ca], [a[3], b[3], d[3]], flash * (hash(i * 5.7 + sd) < 0.6 ? 1 : 0), 0);
    }
  };
  if (kind === 'palm') {             // a trunkless clump of stiff grey-green fans: each a pleated half-disc of pointed blades on a spiny stalk
    const green = new THREE.Color('#8A9C7A'), dark = new THREE.Color('#56684E'), stalk = new THREE.Color('#8A8660'), nf = hi ? 9 : 6, nb = hi ? 14 : 8;
    for (let f = 0; f < nf; f++) {
      const az = f / nf * TAU + rng() * 0.6, el = (f % 3 === 0 ? 1.0 : 0.3) + rng() * 0.45, len = 0.5 + rng() * 0.4, R = 0.5 + rng() * 0.16;
      const dx = Math.cos(az) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(az) * Math.cos(el), hx = dx * len, hy = dy * len, hz = dz * len;
      const sx = -Math.sin(az), sz = Math.cos(az), ux = -Math.cos(az) * Math.sin(el), uy = Math.cos(el), uz = -Math.sin(az) * Math.sin(el);     // across and up within the fan
      const pt = (a, rr, pl) => [hx + (dx * Math.cos(a) + sx * Math.sin(a)) * rr + ux * pl, hy + dy * Math.cos(a) * rr + uy * pl, hz + (dz * Math.cos(a) + sz * Math.sin(a)) * rr + uz * pl];
      tri([sx * -0.03, 0, sz * -0.03], [sx * 0.03, 0, sz * 0.03], [hx, hy, hz], [stalk, stalk, stalk], [0, 0, 0.5], 0, 1);
      const hub = [hx, hy, hz], st = Math.PI * 1.2 / nb, tone = 0.85 + 0.3 * rng();
      for (let b = 0; b < nb; b++) {
        const a = (b + 0.5) / nb * Math.PI * 1.2 - Math.PI * 0.6, rr = R * (0.86 + 0.14 * Math.cos(a)) * (0.92 + 0.16 * hash(b * 3.7 + f));
        const tip = pt(a, rr, 0.05 * R), vl = pt(a - st * 0.5, rr * 0.66, -0.07 * R), vr = pt(a + st * 0.5, rr * 0.66, -0.07 * R);
        ca.copy(dark).multiplyScalar(tone); cb.copy(green).multiplyScalar(tone * 1.12); cc.copy(green).multiplyScalar(tone * 0.74);
        tri(hub, vl, tip, [ca, cb, cb], [0.5, 0.9, 1], 0, 1); tri(hub, tip, vr, [ca, cc, cc], [0.5, 1, 0.9], 0, 1);
      }
    }
  } else if (kind === 'olive') {     // a gnarled forked trunk and a ragged head of many small leaves in sprays, a third of them turned silver by the wind
    const bark = new THREE.Color('#6A5A48'), leaf = new THREE.Color('#4C6238'), lite = new THREE.Color('#84966A'), silver = new THREE.Color('#B8C2B0'), core = new THREE.Color('#3C4E2E');
    tube([[0, 0, 0, 0], [0.16, 0.4, 0.06, 0.04], [-0.08, 0.85, -0.1, 0.1], [0.12, 1.25, -0.02, 0.18], [0.3, 1.7, 0.05, 0.28]], 0.26, 0.1, bark);
    tube([[-0.08, 0.85, -0.1, 0.1], [-0.5, 1.25, 0.18, 0.22], [-0.72, 1.8, 0.34, 0.4]], 0.13, 0.05, bark, 4);
    tube([[0.12, 1.25, -0.02, 0.18], [0.6, 1.75, -0.3, 0.32], [0.9, 2.15, -0.5, 0.45]], 0.1, 0.04, bark, 4);
    tuft(0.1, 2.3, 0, 0.5, 0.36, 0.46, core, leaf, 0.6, 0); tuft(-0.36, 2.1, 0.2, 0.32, 0.26, 0.32, core, leaf, 0.65, 0);      // the dark heart of the crown, behind the leaves
    const spray = (cx, cy, cz, R, nl, sway, lw) => {                  // a twig's worth of narrow leaves, each its own facet
      for (let i = 0; i < nl; i++) {
        const zc = rng() * 2 - 1, a = rng() * TAU, rr = Math.sqrt(Math.max(1 - zc * zc, 0)), dx = Math.cos(a) * rr, dy = zc * 0.8 + 0.25, dz = Math.sin(a) * rr;
        const b0 = 0.2 + 0.3 * rng(), b1 = b0 + 0.55 + 0.35 * rng(), px = -dz, pz = dx, w = lw * (0.7 + 0.6 * rng()), pick = rng();
        ca.copy(pick < 0.3 ? silver : pick < 0.6 ? lite : leaf).multiplyScalar(0.72 + 0.5 * rng());
        tri([cx + dx * R * b0 - px * w, cy + dy * R * b0 - w * 0.5, cz + dz * R * b0 - pz * w], [cx + dx * R * b0 + px * w, cy + dy * R * b0 + w * 0.5, cz + dz * R * b0 + pz * w], [cx + dx * R * b1, cy + dy * R * b1, cz + dz * R * b1], [ca, ca, ca], [sway * 0.8, sway * 0.8, sway], 1, 1);
      }
    };
    const nt = hi ? 48 : 26, nl = hi ? 13 : 10, R = hi ? 0.34 : 0.48, lw = hi ? 0.05 : 0.08;
    for (let i = 0; i < nt; i++) {
      const a = i * 2.39996 + rng() * 0.5, h = 1 - 1.55 * (i + 0.5) / nt, r = Math.sqrt(Math.max(1 - h * h, 0)), k = 0.82 + 0.3 * rng();
      spray(0.1 + Math.cos(a) * r * 1.2 * k, 2.3 + h * 0.8 * k, Math.sin(a) * r * 1.05 * k, R * (0.8 + 0.5 * rng()), nl, 0.7 + 0.3 * rng(), lw);
    }
  } else {                           // stone-type pine: a bare leaning red-brown trunk and a flat umbrella of dark tufts, flagged by the wind
    const bark = new THREE.Color('#7C5038'), leaf = new THREE.Color('#22351F'), lite = new THREE.Color('#4C6A40');
    tube([[0, 0, 0, 0], [0.25, 2.2, 0.05, 0.05], [0.7, 4.6, 0.0, 0.12], [1.3, 6.8, -0.1, 0.22], [2.0, 8.4, -0.1, 0.35]], 0.3, 0.13, bark, 5);
    tube([[1.3, 6.8, -0.1, 0.22], [0.5, 8.0, 0.9, 0.4]], 0.1, 0.05, bark, 3); tube([[1.3, 6.8, -0.1, 0.22], [1.6, 8.1, -1.3, 0.4]], 0.1, 0.05, bark, 3);
    for (let i = 0; i < 10; i++) { const a = i / 9 * TAU + rng() * 0.5, r = i === 0 ? 0 : 1.2 + rng() * 1.3; tuft(2.8 + Math.cos(a) * r * 1.35, 8.75 + rng() * 0.5 - r * 0.16, -0.1 + Math.sin(a) * r, 1.0 + rng() * 0.4, 0.42 + rng() * 0.16, 0.9 + rng() * 0.3, leaf, lite, 0.6 + 0.3 * rng(), 0); }
  }
  ICO.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(S, 3)); g.setIndex(I);
  return g;
}
const PLANT_VERT = /* glsl */`
attribute vec3 color, aSway; attribute float aPh;
uniform float uTime;
varying vec3 vCol, vN; varying float vFlash, vThin;
${FOG_V}
void main(){
  vec4 wp = instanceMatrix * vec4(position, 1.);
  float sc = length(instanceMatrix[1].xyz), s = aSway.x, t = uTime;
  // a gale from the west: everything leans east and thrashes, tips most
  float gust = 0.55 + 0.45 * sin(t * 0.9 + wp.x * 0.05 + aPh * 6.) * sin(t * 0.37 + wp.z * 0.08);
  wp.x += s * sc * (0.16 + 0.22 * gust + 0.09 * sin(t * 5.3 + aPh * 20. + position.y * 2.));
  wp.z += s * sc * 0.09 * sin(t * 4.1 + aPh * 31. + position.x * 3.);
  wp.y -= s * sc * 0.07 * gust;
  vFlash = aSway.y * smoothstep(0.35, 0.9, 0.5 + 0.5 * sin(t * 2.3 + wp.x * 0.6 + wp.y * 0.9 + aPh * 9.)) * (0.4 + 0.6 * gust);
  vN = mat3(instanceMatrix) * normal; vCol = color; vThin = aSway.z;
  vec4 mv = viewMatrix * wp;
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix * mv;
}`;
const PLANT_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce;
varying vec3 vCol, vN; varying float vFlash, vThin;
${FOG_F}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 alb = mix(vCol, vec3(0.44, 0.50, 0.42), vFlash * 0.85);
  float sd = dot(N, uSunDir), thin = step(0.5, vThin);
  float ndl = mix(clamp(sd * 0.75 + 0.3, 0., 1.), abs(sd) * 0.62 + 0.38, thin);            // a leaf lets the light through: no black backs
  vec3 col = alb * (uSunCol * ndl * 1.1 + uSkyCol * (0.5 + 0.5 * mix(N.y, abs(N.y), thin)) + uBounce * 0.3);
  gl_FragColor = vec4(fogMix(col), 1.);
}`;

async function buildWallLife(W) {
  const { scene, U, hero, rng, detail, density, path, ctx } = W;
  const wall = hero.object.getObjectByName('wall-and-rock'), P = wall.geometry.attributes.position, Nn = wall.geometry.attributes.normal;
  const NR = 101, NC = Math.floor(P.count / NR), p = new THREE.Vector3(), n = new THREE.Vector3();
  // candidate spots read back from the built face: south wall only (the Rock's east face stays bare shade)
  const flats = [], faces = [], tops = [], low = [];
  for (let c = 2; c < NC - 2; c++) {
    const x = P.getX(c * NR + 40); if (x > 196) break;
    for (let r = 48; r < NR - 2; r++) {
      const k = c * NR + r, y = P.getY(k); if (y < 10.5) continue;
      const ny = Nn.getY(k), back = r >= 94, near = x > -230 && y < 62;
      if (back) { if (r < 97) tops.push(k); } else if (ny > 0.42) flats.push(k); else if (near && ny > -0.1 && hash(k * 1.7) < 0.3) faces.push(k);
      if (!back && y < 21 && x > -210 && ny > -0.05) low.push(k);
    }
    if (c % 60 === 59) await ctx.yield();
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), lean = new THREE.Vector3();
  const mat = shader(U, ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uBounce'], null, PLANT_VERT, PLANT_FRAG, { side: THREE.DoubleSide });
  const plant = (kind, count, pick, sMin, sMax, tilt, hi = false) => {
    const g = plantGeo(kind, rng, hi), ph = new Float32Array(count), mesh = new THREE.InstancedMesh(g, mat, count);
    for (let i = 0; i < count; i++) {
      const k = pick(i); if (typeof k === 'number') { p.fromBufferAttribute(P, k); n.fromBufferAttribute(Nn, k).normalize(); } else { p.fromArray(k.p); n.fromArray(k.n); }
      lean.set(n.x, 0, n.z).multiplyScalar(tilt).add(up).normalize(); q.setFromUnitVectors(up, lean);
      e.set(0, rng() * TAU, 0); q2.setFromEuler(e); q.multiply(q2);
      p.addScaledVector(n, -0.15); sc.setScalar(rng.range(sMin, sMax));
      if (path.distanceTo(p.x, p.y, p.z) < 7.5 + sc.x * 2) sc.setScalar(0.001);
      if (colL && typeof k === 'number' && Math.hypot(p.x - colL.position[0], p.z - colL.position[2]) < 11 && Math.abs(p.y - colL.position[1]) < 9) sc.setScalar(0.001);   // nothing grows over the gannets
      m4.compose(p, q, sc); mesh.setMatrixAt(i, m4); ph[i] = rng();
    }
    g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1));
    mesh.name = kind; mesh.frustumCulled = false; scene.add(mesh);
  };
  const colL = W.A.ledges.find((l) => l.colony);
  const some = (arr, bias) => () => arr[Math.floor(Math.pow(rng(), bias) * arr.length)];
  const dq = detail * clamp(density, 0.8, 1.2);
  const palmSpots = flats.concat(faces);
  const mixPick = (arr, share) => () => { const src = low.length && rng() < share ? low : arr; return src[Math.floor(rng() * src.length)]; };
  if (palmSpots.length) plant('palm', Math.round(260 * dq), mixPick(palmSpots, 0.6), 1.0, 2.3, 0.75);
  await ctx.yield();
  if (flats.length) plant('olive', Math.round(74 * dq), mixPick(flats, 0.35), 1.0, 1.7, 0.45);
  await ctx.yield();
  const pineSpots = tops.concat(flats.filter((k) => P.getY(k) > 30));
  if (pineSpots.length) plant('pine', Math.round(56 * dq), some(pineSpots, 1), 0.9, 1.45, 0.12);
  await ctx.yield();
  const rim = W.escCols.filter((cl) => cl.top && cl.x > 300 && cl.x < 1500 && cl.gul < 0.6);          // wind-flagged pines on the gold rim of the old coast
  if (rim.length) plant('pine', Math.round(40 * dq), () => { const cl = rim[Math.floor(Math.pow(rng(), 1.5) * rim.length)], bk = 2 + rng() * 16; return { p: [cl.top[0] - cl.nx * bk, cl.top[1] - 0.5 - bk * 0.05, cl.top[2] - cl.nz * bk], n: [cl.nx, 0, cl.nz] }; }, 1.9, 2.7, 0.1);
  await ctx.yield();
  await ctx.yield();
  // ---- the low ledges of the close pass (the hero's notches): a fan-palm clump or two and an olive on each, and the gannets' perches
  const lows = W.A.ledges.filter((l) => l.low).sort((a, b) => (b.colony ? 1 : 0) - (a.colony ? 1 : 0)), spots = [];
  W.perches = [];
  lows.forEach((l, i) => {
    const tx = -l.normal[2], tz = l.normal[0], at = (o, back) => ({ p: [l.position[0] + tx * o - l.normal[0] * back, l.position[1], l.position[2] + tz * o - l.normal[2] * back], n: l.normal });
    spots.push(at(-l.size * (l.colony ? 0.95 : 0.45), 0.5), at(l.size * (l.colony ? 1.0 : 0.5), 0.2));
    if (i % 2 === 1) spots.push(Object.assign(at(l.size * 0.15, 0.9), { olive: 1 }));
    for (const o of (l.colony ? [-0.66, -0.49, -0.33, -0.16, 0.02, 0.19, 0.37, 0.55] : [-0.2, 0.25])) { const q0 = at(l.size * o, l.colony ? -1.4 : -1.0); W.perches.push({ p: new THREE.Vector3(q0.p[0], q0.p[1] + 0.05, q0.p[2]), out: [l.normal[0], l.normal[2]], colony: !!l.colony }); }
  });
  W.colonyAt = W.perches.length ? W.perches[2].p.clone() : new THREE.Vector3(-23, 10, -45);
  const palmsL = spots.filter((q0) => !q0.olive), olivesL = spots.filter((q0) => q0.olive);
  await ctx.yield();
  if (palmsL.length) plant('palm', palmsL.length, (i) => palmsL[i], 1.5, 2.3, 0.5, true);
  await ctx.yield();
  if (olivesL.length) plant('olive', olivesL.length, (i) => olivesL[i], 0.95, 1.3, 0.3, true);
  await ctx.yield();
  // ---- more perches: real ledge tops low on the face ------------------------------------------------------
  const cand = flats.filter((k) => P.getY(k) < 31 && P.getX(k) > -150 && P.getX(k) < 185).sort((a, b) => P.getX(a) - P.getX(b));
  for (let i = 0; i < 8 && cand.length; i++) {
    const k = cand[Math.floor((i + 0.5) / 8 * cand.length)]; p.fromBufferAttribute(P, k); n.fromBufferAttribute(Nn, k); n.y = 0; if (n.lengthSq() < 1e-4) n.set(0, 0, 1); n.normalize();
    if (path.distanceTo(p.x, p.y, p.z) > 8) W.perches.push({ p: new THREE.Vector3(p.x + n.x * 0.35, p.y + 0.05, p.z + n.z * 0.35), out: [n.x, n.z] });
  }
  if (!W.perches.length) W.perches.push({ p: new THREE.Vector3().fromArray(W.A.ledges[0].position), out: [0, 1] });
}

// THE RARE EVENT: 150 m ahead a 60 m slab of undercut wall leans out and drops into the tongue; the column it raises
// (puffs of kind 4) is laid flat by the wind. Keyed to u so that it is over before we come abreast of it.
const SLAB_VERT = /* glsl */`
varying vec3 vP, vL, vN;
${FOG_V}
void main(){ vL = position; vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; vN = mat3(modelMatrix) * normal; vec4 mv = viewMatrix * wp;
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix * mv; }`;
const SLAB_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uHoney, uBone; uniform float uTideL;
varying vec3 vP, vL, vN;
${FOG_F}
${NOISE_G}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 fN = cross(dFdx(vP), dFdy(vP)); fN = normalize(fN + N * 1e-4); if (dot(fN, N) < 0.) fN = -fN;
  N = normalize(mix(N, fN, 0.8));                                             // broken planes, never a smooth box
  float bed = (vL.y - 0.36 * vL.x) / 3.4 + 0.5 * vn(vL.xy * 0.08), fb = fract(bed), bi = floor(bed);
  float joint = 1. - smoothstep(0.0, 0.07, fract(vL.x / (5. + 3. * h21(vec2(bi, 3.))) + 7. * h21(vec2(bi, 40.))));
  float n = fbm3(vL.xy * 0.09 + vL.z * 0.05), n2 = vn(vL.xy * 0.7 + vL.z);
  float tide = vL.y - uTideL + 2.4 * (n - 0.5);
  vec3 alb = mix(uBone * (0.56 + 0.2 * n2 + 0.12 * h21(vec2(bi, 7.))), uHoney * (0.62 + 0.3 * h21(vec2(bi, 3.))), smoothstep(-0.4, 1.4, tide));
  alb = mix(alb, uBone * 0.74, (1. - smoothstep(0.5, 2.6, tide)) * smoothstep(-0.4, 0.3, tide) * 0.8);                     // barnacle
  float weed = (1. - smoothstep(-0.6, 0.2, tide)) * smoothstep(-7., -2.5, tide + 2.5 * (n2 - 0.5));
  alb = mix(alb, vec3(0.07, 0.08, 0.035), weed * 0.88);
  alb *= (1. - 0.32 * smoothstep(0.84, 1., fb)) * (1. - 0.42 * joint) * (0.84 + 0.3 * n);
  alb = mix(alb, alb * vec3(0.72, 0.70, 0.66), smoothstep(0.55, 0.8, vn(vec2(vL.x * 0.5, vL.y * 0.05))) * 0.6);          // wet streaks
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 col = alb * (uSunCol * ndl * 1.05 + uSkyCol * (0.62 + 0.38 * N.y) + uBounce * (0.6 - 0.4 * N.y));
  gl_FragColor = vec4(fogMix(col), 1.);
}`;
function buildSlab(W) {
  const { scene, U, A, ctx } = W, noise = ctx.noise, st = (v, k) => Math.round(v * k) / k;
  const shape = (g, sx, sy, sz, sd) => {              // a box broken into beds and joints: stepped outline, ragged top and foot, a back that bellies
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), uy = y / sy, ax = Math.abs(x) / sx;
      const prof = 0.76 + 0.2 * Math.cos(uy * 1.3 + 0.4 + sd) + 0.2 * st(noise.n2(y * 2.6 / sy + sd, 3.3), 2.5) + 0.1 * noise.n2(y * 9 / sy, sd);
      const xx = x * prof + 0.07 * sx * noise.n2(y * 8 / sy, z * 0.2 + 5 + sd);
      const yy = y + (0.14 * sy * st(noise.n2(x * 2.2 / sx + sd, 9.1), 1.5) + 0.06 * sy * noise.n2(x * 7 / sx, z * 0.3)) * smoothstep(0.45, 1, Math.abs(uy)) - 0.1 * sy * ax * ax * Math.sign(uy);
      const zz = z * (0.62 + 0.45 * noise.n2(x * 1.6 / sx + sd, y * 1.6 / sy) + 0.25 * Math.cos(uy * 1.5)) * (1 - 0.45 * ax * ax) + 0.2 * sz * noise.n3(x * 4 / sx, y * 4 / sy, z * 0.3 + sd) + 0.12 * sz * st(noise.n2(x * 3 / sx + 4, y * 2.5 / sy + sd), 2);
      p.setXYZ(i, xx, yy, zz);
    }
    g.computeVertexNormals(); return g;
  };
  const mat = shader(U, ['uSunDir', 'uSunCol', 'uSkyCol', 'uBounce', 'uHoney', 'uBone'], { uTideL: { value: 58 } }, SLAB_VERT, SLAB_FRAG);
  const g = shape(new THREE.BoxGeometry(34, 62, 11, 12, 20, 4), 17, 31, 5.5, 0); g.translate(0, 31, 0);
  const slab = new THREE.Mesh(g, mat);
  const base = new THREE.Vector3(W.slabAt.x, -50, A.wallZ(W.slabAt.x) + 3.5);
  slab.position.copy(base); slab.name = 'falling-slab'; slab.frustumCulled = false; scene.add(slab);
  // the blocks that come away with it: smaller pieces of the same beds, tumbling
  const bits = [];
  for (let k = 0; k < 5; k++) {
    const s = 5 + 3.2 * hash(k * 3.3 + 1), bg = shape(new THREE.BoxGeometry(s * 1.5, s, s * 0.8, 4, 3, 2), s * 0.75, s * 0.5, s * 0.4, 3 + k * 5.7), m = new THREE.Mesh(bg, mat);
    m.name = 'slab-block'; m.frustumCulled = false; scene.add(m);
    bits.push({ m, x: (hash(k * 7.1) - 0.5) * 44, y: 8 + 44 * hash(k * 2.9 + 4), lag: 0.012 * k + 0.02 * hash(k + 0.3), sp: 1.5 + 2 * hash(k * 5.3), ax: hash(k * 1.7) * 6 });
  }
  W.parts.push({ update(dt, time, camera, u) {
    const lean = smoothstep(0.285, 0.36, u), drop = smoothstep(0.34, 0.425, u);
    slab.rotation.x = 0.42 * lean * lean + 0.9 * drop + 0.012 * Math.sin(time * 7) * lean * (1 - drop);      // it shudders, leans, goes
    slab.rotation.z = 0.10 * lean + 0.22 * drop;
    slab.position.set(base.x, base.y - 150 * drop * drop, base.z + 26 * drop);
    for (const b of bits) {
      const go = smoothstep(0.30 + b.lag, 0.335 + b.lag, u), d2 = smoothstep(0.325 + b.lag, 0.43 + b.lag, u);
      b.m.position.set(base.x + b.x * (1 + 0.3 * d2), base.y + b.y - 170 * d2 * d2, base.z + 1.5 + go * 5 + 30 * d2);
      b.m.rotation.set(b.ax + b.sp * 3 * d2, 0.4 * b.ax, b.sp * 2 * d2);
      b.m.scale.setScalar(go > 0 ? 1 : 0.001);
    }
    W.uEvent.value = clamp((u - 0.375) / 0.11, 0, 1.6);
  } });
}

// THE ARCH OVER THE RING: gold spray streamers blown left to right over the line. Four thin bands in planes just short
// of the ring, each a half-hoop whose filaments are drawn in the shader and slide along it with the wind.
const ARCH_VERT = /* glsl */`
attribute float aLayer;
uniform vec3 uCam;
varying vec2 vUv; varying float vLayer, vNear;
void main(){ vUv = uv; vLayer = aLayer; vNear = smoothstep(9., 24., length(uCam - position)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const ARCH_FRAG = /* glsl */`
precision highp float;
uniform float uTime; uniform vec3 uStreamCol;
varying vec2 vUv; varying float vLayer, vNear;
${NOISE_G}
void main(){
  float s = vUv.x * 56., r = vUv.y, t = uTime;
  float a = fbm3(vec2(s * 0.085 - t * 1.3 + vLayer * 7.3, r * 2.0 + s * 0.045 + vLayer * 3.1 + 1.8 * (vn(vec2(s * 0.06 - t * 0.5, vLayer * 9.)) - 0.5)));
  float b = vn(vec2(s * 0.38 - t * 3.1, r * 9. + vLayer * 5.));
  float fil = smoothstep(0.56, 0.74, a) * (0.45 + 0.55 * b) + 0.3 * smoothstep(0.66, 0.9, b) * smoothstep(0.45, 0.65, a);
  float env = smoothstep(0., 0.28, r) * (1. - smoothstep(0.62, 1., r)) * smoothstep(0.0, 0.2, vUv.x) * (1. - smoothstep(0.72, 1., vUv.x));
  float al = (clamp(fil, 0., 1.) * 0.50 + 0.03 * smoothstep(0.3, 0.7, a)) * env * vNear;
  if (al < 0.004) discard;
  gl_FragColor = vec4(uStreamCol * (0.9 + 0.5 * b), al);
}`;
function buildArch(W) {
  const { scene, U, M, path } = W, Lp = path.length, c = new THREE.Vector3(), rv = new THREE.Vector3();
  const P = [], UV = [], Ly = [], I = [], NA = 48, a0 = Math.PI + 0.42, a1 = -0.42;
  for (let l = 0; l < 3; l++) {
    const dd = Lp - 1.2 - l * 3.4, r0 = 11.5 + l * 2.1, wd = 4.6 + l * 0.6, base = P.length / 3;
    path.posAtDist(dd, c); W.rightAt(dd, rv);
    for (let i = 0; i <= NA; i++) {
      const u = i / NA, th = lerp(a0, a1, u);
      for (let j = 0; j < 2; j++) { const r = r0 + j * wd; P.push(c.x + rv.x * Math.cos(th) * r, c.y + Math.sin(th) * r, c.z + rv.z * Math.cos(th) * r); UV.push(u, j); Ly.push(l); }
    }
    for (let i = 0; i < NA; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aLayer', new THREE.Float32BufferAttribute(Ly, 1)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uCam: U.uCam, uStreamCol: { value: new THREE.Color(M.palette[2]).lerp(new THREE.Color(M.palette[6]), 0.5).multiplyScalar(1.05) } },
    vertexShader: ARCH_VERT, fragmentShader: ARCH_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'spray-arch'; mesh.frustumCulled = false; mesh.renderOrder = 6; scene.add(mesh);
}

// MIST AS RIBBONS (never balls): one pale thread falling down a couloir of the old coast, hugging the rock, and four
// long thin veils lying along the scree at its foot. aK: 0 veil, 1 thread; aS: metres along the ribbon.
const VEIL_VERT = /* glsl */`
attribute float aK, aS;
varying vec2 vUv; varying float vK, vS, vD;
${FOG_V}
void main(){ vUv = uv; vK = aK; vS = aS; vec4 mv = modelViewMatrix * vec4(position, 1.); vD = -mv.z;
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix * mv; }`;
const VEIL_FRAG = /* glsl */`
precision highp float;
uniform float uTime; uniform vec3 uMistCol, uShadeCol;
varying vec2 vUv; varying float vK, vS, vD;
${FOG_F}
${NOISE_G}
void main(){
  float u = clamp(vUv.x, 0., 1.), v = clamp(vUv.y, 0., 1.), t = uTime, al, w;
  if (vK > 0.5) {                                                        // the thread: filaments sliding DOWN the gully
    float wob = vn(vec2(vS * 0.02 - t * 0.3, 1.)) - 0.5;
    float fil = fbm3(vec2(v * 2.6 + 1.4 * wob, vS * 0.013 - t * 0.42));
    float sv = sin(3.14159 * clamp(v + 0.35 * wob, 0., 1.)); float env = sv * sv * smoothstep(0., 0.1, u) * (1. - smoothstep(0.7, 1., u));
    al = (0.04 + 0.5 * smoothstep(0.40, 0.74, fil)) * env * (0.15 + 0.85 * smoothstep(0.25, 0.7, vn(vec2(vS * 0.009 - t * 0.25, 7.)))) * 0.5; w = 0.5 + 0.5 * fil;
  } else {                                                               // a veil: torn sheets drifting along the foot with the wind
    float wob = vn(vec2(vS * 0.008 - t * 0.12, 3.)) - 0.5;
    float fil = fbm3(vec2(vS * 0.011 - t * 0.22, v * 2.4 + 1.6 * wob)), f2 = vn(vec2(vS * 0.05 - t * 0.6, v * 7.));
    float env = smoothstep(0., 0.3, v) * (1. - smoothstep(0.45, 1., v + 0.4 * wob)) * smoothstep(0., 0.2, u) * (1. - smoothstep(0.75, 1., u));
    al = smoothstep(0.34, 0.7, fil) * (0.7 + 0.3 * f2) * env * 0.68; w = 0.35 + 0.65 * fil * (0.4 + 0.6 * v);
  }
  al *= smoothstep(260., 900., clamp(vD, 0., 5000.));                       // POLISH 2: seen only across the gulf, never as a smear over the scree below the lens;                                        // a veil is weather seen across the gulf; close to and edge-on it was a grey blade on the rock
  if (al < 0.004) discard;
  vec3 col = mix(uShadeCol * 1.15, uMistCol, clamp(w, 0., 1.));
  float f = fogAmt();
  gl_FragColor = vec4(mix(col, fogColor, f * 0.7), al * (1. - 0.4 * f));
}`;
function buildVeils(W) {
  const { scene, U, M } = W, P = [], UV = [], K = [], S = [], I = [];
  const strip = (rows, kind) => {                     // rows: [[ax,ay,az],[bx,by,bz]] pairs along the ribbon
    const base = P.length / 3; let s = 0;
    rows.forEach((r, i) => {
      if (i) s += Math.hypot(r[0][0] - rows[i - 1][0][0], r[0][1] - rows[i - 1][0][1], r[0][2] - rows[i - 1][0][2]);
      P.push(...r[0], ...r[1]); UV.push(i / (rows.length - 1), 0, i / (rows.length - 1), 1); K.push(kind, kind); S.push(s, s);
    });
    for (let i = 0; i < rows.length - 1; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  let best = null; for (const c of W.escCols) if (c.x > 640 && c.x < 860 && c.pts.length > 8 && (!best || c.gul > best.gul)) best = c;
  if (best && false) {
    const rows = [], tx = -best.nz, tz = best.nx, n = best.pts.length;
    for (let k = n - 1; k >= 1; k--) { const q = best.pts[k], t = 1 - k / (n - 1), hw = 4 + 4.5 * t, o = 7, me = 7 * Math.sin(k * 1.9 + 0.7) * t; q[0] -= tx * me; q[2] -= tz * me; rows.push([[q[0] + best.nx * o - tx * hw, q[1], q[2] + best.nz * o - tz * hw], [q[0] + best.nx * o + tx * hw, q[1], q[2] + best.nz * o + tz * hw]]); }
    strip(rows, 1);
  }
  const cols = W.escCols.filter((c) => c.x > 400 && c.x < 1100 && c.lo && c.mid);
  for (let v = 0; v < 4 && cols.length > 12; v++) {
    const i0 = Math.floor(cols.length * (v + 0.08 + 0.1 * hash(v * 3.1)) / 4), i1 = Math.min(Math.floor(cols.length * (v + 0.95) / 4), cols.length - 1), rows = [];
    for (let i = i0; i <= i1; i++) { const c = cols[i], o = 9 + 5 * hash(i * 1.3 + v), lift = 0.55 + 0.45 * hash(v * 7.7 + 2);
      rows.push([[c.lo[0] + c.nx * o, c.lo[1] + 5, c.lo[2] + c.nz * o], [lerp(c.lo[0], c.mid[0], lift) + c.nx * o, lerp(c.lo[1], c.mid[1], lift) + 9, lerp(c.lo[2], c.mid[2], lift) + c.nz * o]]); }
    if (rows.length > 2) strip(rows, 0);
  }
  if (!P.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1)); g.setIndex(I);
  const mat = shader(U, ['uTime'], { uMistCol: { value: new THREE.Color(M.palette[2]).multiplyScalar(0.8) }, uShadeCol: { value: new THREE.Color(M.cloudShade).multiplyScalar(0.8) } }, VEIL_VERT, VEIL_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'mist-veils'; mesh.frustumCulled = false; mesh.renderOrder = 4; scene.add(mesh);
}

// THE DESERT BEYOND THE SEA'S EDGE: a far wall of ochre haze round the eastern half of the sky, with hazed island
// mountains and the far pillar standing in it. From the swell it is the band above the line where the sea stops;
// from the void it is the pale horizon under the sky.
const HAZE_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const HAZE_FRAG = /* glsl */`
precision highp float;
uniform vec3 uCam, uHazeLo, uHazeHi, uMount;
varying vec3 vP;
${NOISE_G}
void main(){
  vec2 dxz = vP.xz - uCam.xz; float hd = max(length(dxz), 1.), el = (vP.y - uCam.y) / hd, az = atan(dxz.y, max(dxz.x, 1.));
  float lobe = az - 0.66; lobe = exp(-lobe * lobe / 0.012);
  float ridge = 0.003 + 0.015 * fbm3(vec2(az * 7. + 3., 1.)) * smoothstep(0.2, 0.6, vn(vec2(az * 2.3, 5.))) + lobe * (0.045 + 0.012 * vn(vec2(az * 60., 2.)));
  float mount = 1. - smoothstep(-0.0012, 0.0012, el - ridge);
  float band = 1. - smoothstep(0.0, 0.034, el);
  vec3 col = mix(uHazeHi, uHazeLo, 1. - smoothstep(-0.045, 0.0, el));
  col = mix(col, uMount * (0.92 + 0.16 * vn(vec2(az * 90., el * 400.))), mount * (0.5 + 0.3 * smoothstep(0., 0.04, el)));
  float al = max(band * 0.9, mount * 0.92) * (1. - smoothstep(1.35, 1.75, abs(az)));
  if (al < 0.004) discard;
  gl_FragColor = vec4(col, al);
}`;
function buildHaze(W) {
  const { scene, U, M } = W, P = [], I = [], NA = 64, R = 9000;
  for (let i = 0; i <= NA; i++) { const a = lerp(-1.8, 1.8, i / NA); for (const y of [-900, -60, 60, 220, 700]) P.push(Math.cos(a) * R, y, Math.sin(a) * R); }
  for (let i = 0; i < NA; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b = a + 5; I.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const light = new THREE.Color(M.sunColor).multiplyScalar(M.sunI * 0.55).add(new THREE.Color(M.sky).multiplyScalar(M.skyI * 1.1));
  const lo = new THREE.Color(M.ground).lerp(new THREE.Color(M.palette[5]), 0.22).multiply(light), hi = new THREE.Color(M.floorA).lerp(new THREE.Color(M.fog), 0.12).multiply(light).multiplyScalar(1.25);
  const mat = new THREE.ShaderMaterial({ uniforms: { uCam: U.uCam, uHazeLo: { value: lo }, uHazeHi: { value: hi }, uMount: { value: new THREE.Color(M.shade).lerp(hi, 0.5) } },
    vertexShader: HAZE_VERT, fragmentShader: HAZE_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'desert-haze'; mesh.frustumCulled = false; mesh.renderOrder = 1; scene.add(mesh);
}

// THE LINE WHERE THE SEA STOPS: seen low and from afar, the ironed lip of the tongue is the last water the eye can
// reach: a hard thread of glitter under the desert haze. A ribbon riding the swell at brief x 262, just past the
// point where the sight line leaves the water; the swell in front hides and shows it, and it fades as we close.
const LIP_VERT = /* glsl */`
uniform vec3 uCam; uniform float uTime;
varying float vK, vV, vZ;
void main(){
  vec3 p = position; float bx = p.x + 520., t = uTime, k = 1. - smoothstep(200., 330., bx);
  float sw = k * (0.85 * sin(bx * 0.071 + p.z * 0.018 - t * 0.83) + 0.45 * sin(bx * 0.118 - p.z * 0.052 - t * 1.07 + 2.0) + 0.22 * sin(bx * 0.27 + p.z * 0.19 - t * 1.62 + 4.0));
  float dist = length(uCam - p);
  p.y = -1.86 + sw - 0.4 + uv.y * (2.1 + dist * 0.003);
  vK = smoothstep(70., 170., p.x - uCam.x); vV = uv.y; vZ = p.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const LIP_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSunCol, uSkyCol; uniform float uTime;
varying float vK, vV, vZ;
${NOISE_G}
void main(){
  float tw = vn(vec2(vZ * 0.55 - uTime * 2.6, uTime * 0.7)) * 0.6 + vn(vec2(vZ * 1.7 + uTime * 3.4, 3.)) * 0.4;
  float a = vK * smoothstep(0.0, 0.25, vV) * (1. - smoothstep(0.8, 1., vV));
  if (a < 0.004) discard;
  gl_FragColor = vec4((uSunCol * 1.7 + uSkyCol * 1.6) * (0.9 + 1.2 * smoothstep(0.35, 0.8, tw)), a);
}`;
function buildLip(W) {
  const { scene, U, A } = W, P = [], UV = [], I = [], x = 262 - XO, z0 = A.wallZ(x) + 2, NS = 320;
  for (let i = 0; i <= NS; i++) { const z = z0 + 1500 * i / NS; P.push(x, 0, z, x, 0, z); UV.push(0, 0, 0, 1); }
  for (let i = 0; i < NS; i++) { const a = i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({ uniforms: { uCam: U.uCam, uTime: U.uTime, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol }, vertexShader: LIP_VERT, fragmentShader: LIP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'lip-glitter'; mesh.frustumCulled = false; mesh.renderOrder = 3; scene.add(mesh);
}

// @@BUILDERS@@

export default {
  id: 'atlantic-falls-in',
  name: 'Where the Sea Ends',
  category: 'prehistoric',
  weirdness: 0.3,
  media: ['air', 'open', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // ---- the seeded look: hour, weather, stage of the flood, cast ---------------------------------------
    const roll = rng();
    let moodName = roll < 0.42 ? 'gold' : roll < 0.72 ? 'noon' : 'pearl';
    if (vary.hour === 'golden' || vary.hour === 'dawn') moodName = 'gold'; else if (vary.hour === 'day') moodName = roll < 0.6 ? 'noon' : 'pearl';
    const M = MOODS[moodName];
    const V = {
      mood: moodName, cap: rng() < 0.5, lakeSea: rng() < 0.4, petrels: rng() < 0.4,
      gannets: Math.round(lerp(6, 20, rng())), shearMany: rng() < 0.45, rare: !!vary.rare,
    };
    V.dust = !V.cap;
    const sunDir = new THREE.Vector3().fromArray(M.sunDir).normalize();
    const sky = makeSky({
      rng, preset: M.preset, zenith: M.zenith, horizon: M.horizon, ground: M.ground, groundFalloff: 5, horizonPow: 3.2,
      sunDirection: sunDir, sunIntensity: M.disc, sunGlow: moodName === 'pearl' ? 0.25 : 0.5, scatter: 0.22, scatterColor: M.palette[6],
      clouds: moodName === 'pearl' ? { coverage: 0.78, softness: 0.5, lit: '#E9E9E4', shade: '#8794A6' } : false,
      clouds2: moodName === 'pearl' ? false : { coverage: 0.30, opacity: 0.42, stretch: 1, lit: '#F4EEE2', shade: '#A9BCD6', seed: 11 },
      fogColor: M.fog,
    });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(new THREE.Color(M.fog), M.fogD);
    await ctx.yield();

    // ---- the hero: the lip and the wall ------------------------------------------------------------------
    const hero = await buildHero(ctx, { palette: M.palette, detail, gannets: false, shade: M.shade });
    hero.setLight({ sunDir, sunColor: M.sunColor, sunIntensity: M.sunI, sky: M.sky, skyIntensity: M.skyI, bounce: M.bounce, bounceIntensity: M.bounceI });
    scene.add(hero.object);
    const U = hero.uniforms, A = hero.anchors;
    await ctx.yield();

    // ---- the flight: y 8 from the first metre to the last -----------------------------------------------
    // The hero's own line starts at brief x 0. We join it X0 metres on, so the line where the sea stops, the green tongue
    // and the first standing wave come in the first third. Every scripted moment in this file is keyed to the distance
    // along the hero's line (uo, "old u"): toOld() turns the engine's u into it, toNew() the other way.
    // POLISH 2: past the prow the line no longer swings 22 degrees left into the old coast's cliff. It runs on almost straight
    // (14, easing to 12 degrees north of east), so the last third looks down the whole empty sea: the old coast raking away on
    // the left, the ring hung in open air against its far shaded reach a kilometre on, the flood, the lake and the spray tower
    // below and to the right. The length is the old one, so every moment keyed to distance keeps its place along the wall.
    const fly = A.flyThrough.filter((p) => p[0] <= 700 - XO + 1);
    { const q = fly[fly.length - 1].slice(), lenOld = makePath(A.flyThrough).length, lenHead = makePath(fly).length, nT = Math.max(Math.round((lenOld - lenHead) / 25), 6);
      for (let i = 1; i <= nT; i++) { const hd = (14 - 2 * smoothstep(0, 160, (i - 0.5) * 25)) * Math.PI / 180; q[0] += Math.cos(hd) * 25; q[2] -= Math.sin(hd) * 25; fly.push([q[0], 8, q[2]]); } }
    const pathOld = makePath(fly), X0 = 90;
    const path = makePath([[X0 - XO, 8, 0]].concat(fly.filter((p) => p[0] > X0 - XO + 5)));
    const toOld = (u) => (u * path.length + X0) / pathOld.length, toNew = (uo) => clamp((uo * pathOld.length - X0) / path.length, 0, 1);
    const seat = A.portalSeat;
    const parts = [];                      // { update(dt, time, camera, uo) }
    const W = { scene, hero, U, A, M, V, rng, path: pathOld, detail, density, ctx, parts, toOld, toNew, U0: toOld(0) };
    const rightAt = (d, out) => { const t = pathOld.tangentAtDist(d, out); return out.set(-t.z, 0, t.x).normalize(); };
    W.rightAt = rightAt;
    W.diveAt = [0, 1].map((k) => { const d = (DIVE[k].u0 + 0.07) * pathOld.length + DIVE[k].ahead, p = pathOld.posAtDist(d, new THREE.Vector3()), r = rightAt(d, new THREE.Vector3()); return p.addScaledVector(r, DIVE[k].side).setY(0); });

    await buildLands(W);
    W.gazeBasin = new THREE.Vector3(W.basin.sea ? 2500 : W.basin.x - 260, -640, 200);

    buildPuffs(W);
    await ctx.yield();
    buildArch(W);
    buildHaze(W);
    buildLip(W);
    await ctx.yield();

    await buildWallLife(W);
    await ctx.yield();
    await buildGannetCast(W);
    await ctx.yield();
    buildBirds(W);
    await ctx.yield();

    if (V.rare) buildSlab(W);
    await ctx.yield();
    buildVeils(W);
    await ctx.yield();

    // @@BUILD@@

    await sky.prewarm(ctx.renderer, null, scene);
    const poiV = new THREE.Vector3(), poiR = new THREE.Vector3();
    const pois = [
      { at: new THREE.Vector3(A.firstCrest[0] + 24, -21, A.firstCrest[2] + 7), from: toNew(0.29), to: toNew(0.445), weight: 0.6 },      // the first standing wave: a green hill that holds its place under us
      { at: (time, u) => { const d = toOld(u) * pathOld.length + 26; pathOld.posAtDist(d, poiV); rightAt(d, poiR); return poiV.addScaledVector(poiR, -10.5).setY(4.5); }, from: toNew(0.445), to: toNew(0.525), weight: 0.55 },      // the wall just ahead: the gannets' ledge comes to the upper middle of the left half, the tide line stays near the eye
      { at: new THREE.Vector3(770 - XO, -262, A.pathZ(690 - XO) + 92), from: toNew(0.527), to: toNew(0.625), weight: 0.6 },      // then down and to the right: the whole chute sliding away, standing waves 150 m under us
      { at: new THREE.Vector3(1050, -600, 300), from: toNew(0.645), to: 0.745, weight: 0.74 },      // POLISH 2: past the prow the gaze swings right and down the whole chute: racing water, the thunderhead, the far pillar
      { at: W.gazeBasin, from: 0.735, to: 0.915, weight: 0.6 },      // then back over the empty sea, before it comes home to the ring      // past the prow: the whole empty sea, before the gaze comes back to the ring
    ];
    const ease = (a, b, u) => smoothstep(a, b, u);
    const paceOld = (u) => lerp(lerp(lerp(1.45, 1.2, ease(0.17, 0.24, u)), 0.75, ease(0.30, 0.40, u)), 1.06, ease(0.66, 0.76, u));
    return {
      scene, path, duration: 42,
      pace: (u) => paceOld(toOld(u)),
      title: 'Where the Sea Ends · 5.33 million years ago',
      camera: { fov: 60, near: 0.5, far: 14000, lookAhead: 30, sway: 0.4, bank: 0.12 },
      pois,
      portal: { shape: 'circle', radius: seat.radius, color: '#F3F7F5', glow: 1, revealDistance: 350 },
      post: { exposure: M.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#04070c', vignette: 0.2, grain: 0.02, aberration: 0 } },
      ride: 'none', companion: 'none', style: 'none',
      update(dt, time, camera, u) {
        const uo = toOld(u);
        sky.update(dt, time, camera);
        hero.setProgress(uo);
        hero.update(dt, time, camera);
        for (let i = 0; i < parts.length; i++) parts[i].update(dt, time, camera, uo);
      },
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
