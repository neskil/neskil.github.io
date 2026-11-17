// The Tempo Fen: a silver morning marsh where every reed is a ticking metronome. A gust from behind pulls the
// wands into step so their brass glints gather into bright lines that race downwind to the Maelzel, a mahogany
// metronome 140 m tall (src/parts/tempo-fen.js) that beats time for the whole fen and holds the exit ring.
//
// World frame: we fly +Z (downwind). The sun is abeam to port, which is +X when flying +Z. Water at y 0.
// All metronome motion runs on T, a clock that free-runs on time and is phase-locked to u * 46 while the flight
// advances, so the bob meets the path at u 0.953 and the fen still ticks when seen through a portal (u held at 0).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, GLSL_COMMON } from '../parts/tempo-fen.js';

const HZ = 1175;                 // the Maelzel's base centre (world z); it faces -Z, toward the entry
const PORTAL_Z = HZ + 5, SWING_Z = HZ - 25, LAGOON_Z = 705, LAGOON_R = 46, TILE = 96, TILE_N = 256;
const DURATION = 46;
const PALETTE = ['#DCE6EA', '#9FB4BE', '#3E5560', '#5A2A1C', '#C9A04A', '#F4E3B0', '#1B2226'];

// ---- the layout, written twice (here and in GLSL below) so reeds, pads and the water agree ----
// one slow S: 40 m to starboard by z 320, across to 15 m to port over the high pass, back to the axis by z 640
const pathX = (z) => -40 * smoothstep(60, 320, z) * (1 - smoothstep(330, 640, z)) + 26 * smoothstep(330, 480, z) * (1 - smoothstep(500, 640, z));
// low among the bobs at first (2.2 m at z 60-130), 5 m while the gust passes at u 0.24-0.30, then the high pass: a climb
// to 51 m by z 468, held to z 540, and one glide down to the lagoon, so that through u 0.38-0.50 the camera is high and
// looking down: the lines of glitter step away up the frame to the Maelzel's feet. Low over the water for the long
// look, rising to the ring's height (7.5 m) for the last 120 m.
const pathY = (z) => 3 - 0.8 * smoothstep(40, 75, z) * (1 - smoothstep(110, 150, z)) + 2 * smoothstep(165, 300, z)
  + 46 * smoothstep(318, 468, z) * (1 - smoothstep(540, 664, z)) - 2 * smoothstep(660, 760, z) + 4.5 * smoothstep(900, 1060, z);
const chanHalf = (z) => lerp(4.7, 8, smoothstep(930, 1000, z));
// 1 in open water (channel, lagoon, the basin round the Maelzel), 0 in the reed bed
function openWater(x, z) {
  const d = Math.abs(x - pathX(z));
  const hw = chanHalf(z);
  const chan = 1 - smoothstep(hw, hw + 1.2, d);
  const lag = 1 - smoothstep(LAGOON_R - 3, LAGOON_R + 2, Math.hypot(x, (z - LAGOON_Z) * 0.62));
  const bas = (1 - smoothstep(38, 44, Math.abs(x))) * (1 - smoothstep(40, 46, Math.abs(z - HZ)));
  const bay = 1 - smoothstep(0.7, 1.1, Math.hypot((x + 9) / 6, (z - 40) / 24));
  const bay2 = 1 - smoothstep(0.7, 1.1, Math.hypot((x - BAY2_X) / 7, (z - 207) / 20));
  const bay3 = 1 - smoothstep(0.7, 1.1, Math.hypot((x - 9.5) / 6.5, (z - 941) / 13));
  return { chan, open: Math.max(chan, lag, bas, bay, bay2, bay3), d };
}

const BAY2_X = pathX(207) - 9.5;
const FEN_GLSL = /* glsl */`
uniform sampler2D uTile;
uniform float uTear, uClear; uniform vec3 uTearCol;
uniform float uT, uTime, uU, uFront, uGust, uLull, uCross, uBeat, uSpacing, uFogK, uMist, uPxAng, uFrost, uSwingAmp;
uniform vec3 uCam, uFogCol, uMistCol, uBrass, uSteel, uFoot, uPadCol, uGlint, uGold; uniform vec3 uBand;
const float HZ = ${HZ.toFixed(1)}, LAGZ = ${LAGOON_Z.toFixed(1)}, LAGR = ${LAGOON_R.toFixed(1)};
float pathX(float z){ return -40. * smoothstep(60., 320., z) * (1. - smoothstep(330., 640., z)) + 26. * smoothstep(330., 480., z) * (1. - smoothstep(500., 640., z)); }
// x: channel only, y: any open water
vec2 openWater(vec2 p){
  float d = abs(p.x - pathX(p.y));
  float hw = mix(4.7, 8., smoothstep(930., 1000., p.y));
  float chan = 1. - smoothstep(hw, hw + 1.2, d);
  float lag = 1. - smoothstep(LAGR - 3., LAGR + 2., length(vec2(p.x, (p.y - LAGZ) * .62)));
  float bas = (1. - smoothstep(38., 44., abs(p.x))) * (1. - smoothstep(40., 46., abs(p.y - HZ)));
  float bay = 1. - smoothstep(.7, 1.1, length(vec2((p.x + 9.) / 6., (p.y - 40.) / 24.)));
  bay = max(bay, 1. - smoothstep(.7, 1.1, length(vec2((p.x - ${BAY2_X.toFixed(2)}) / 7., (p.y - 207.) / 20.))));
  bay = max(bay, 1. - smoothstep(.7, 1.1, length(vec2((p.x - 9.5) / 6.5, (p.y - 941.) / 13.))));
  return vec2(chan, max(max(chan, bay), max(lag, bas)));
}
// reed density 0..1 at a point of the fen: tussocks with leads between, big meres, islands in open water
float reedDens(vec2 p){
  vec2 ow = openWater(p);
  vec4 t = textureLod(uTile, p / ${TILE.toFixed(1)}, 0.);
  float mere = textureLod(uTile, p.yx / 1040. + .37, 0.).g;
  float lined = 1. - smoothstep(14., 28., abs(p.x - pathX(p.y)));           // the channel is always reed-lined
  float bed = t.r * max(smoothstep(.10, .20, mere), lined);
  float isl = t.r * step(.72, t.g) * (1. - ow.x);
  return mix(bed, isl, ow.y);
}
// how far the reeds at p are in step: the gust front, lulls drifting downwind, faint wind patches
float lockC(vec2 p){
  float front = uFront + 40. * (vn(p / 60.) * 2. - 1.);
  float G = uGust * smoothstep(0., 80., front - p.y);
  float L = uLull * smoothstep(.64, .88, vn((p - vec2(0., 12. * uTime)) / 105. + 5.3));
  float W = smoothstep(.62, .9, vn(p / 85. + vec2(3.7, -uTime * .04)));
  return clamp(G - .38 * L * G + .3 * W, 0., 1.);
}
// 1 where the gust has passed (the water there is ruffled dark, in step or not)
float gustAt(vec2 p){ return uGust * smoothstep(0., 80., uFront + 40. * (vn(p / 60.) * 2. - 1.) - p.y); }
// the moment the gust front passes a place: one eased pulse about a second long, travelling with the front
float gustPulse(vec2 p){
  float x = uFront + 40. * (vn(p / 60.) * 2. - 1.) - p.y;
  return uGust * smoothstep(0., 12., x) * (1. - smoothstep(16., 52., x));
}
// the common beat: wavy lines uSpacing apart racing downwind; the rare cross-gust sends a second set from port
float commonT(vec2 p, float h, float t){
  float c1 = sin(6.2832 * (t / uBeat - (p.y + 34. * (vn(p / 150.) * 2. - 1.) + 9. * sin(p.x / 41.)) / uSpacing));
  float c2 = sin(6.2832 * (t / uBeat + (p.x + 30. * (vn(p.yx / 200. + 9.) * 2. - 1.)) / uSpacing));
  return mix(c1, c2, uCross * step(.5, h));
}
float commonS(vec2 p, float h){ return commonT(p, h, uT); }
// swing of one wand, -1..1 (+ leans toward the sun at +X). a: rate hash, b: phase hash
float swingS(vec2 p, float a, float b, out float C){
  C = lockC(p);
  float own = sin(6.2832 * ((.58 - .16 * a) * uT + b));
  return mix(own, commonS(p, b), C);
}
float glintOf(float s){ return smoothstep(.82, .98, s); }
// a line of glitter rides the crest of the common beat, about a third of the spacing wide; its cat's-paw (dark
// ruffled water) runs a quarter of a spacing behind it
// (uBand = the beat's value at 20 m and at 8 m from the crest, so a line is the same width at every tempo)
float lineBand(float cs){ return smoothstep(mix(uBand.x, max(uBand.x, .68), uCross), mix(uBand.y, max(uBand.y, .97), uCross), cs); }
// largo's lines are 180 m apart: a fainter off-beat line runs halfway between them (uBand.z, 0 at other tempi)
float halfLine(vec2 p){
  float c = sin(6.2832 * 2. * (uT / uBeat - (p.y + 34. * (vn(p / 150.) * 2. - 1.) + 9. * sin(p.x / 41.)) / uSpacing) - 1.5708);   // crests on the lines and halfway between
  return uBand.z * smoothstep(.72, .96, c) * (1. - uCross) * (1. - smoothstep(.0, .5, commonS(p, 0.)));   // (only the off-beat crests)
}
// the tear of clear sky low to port (+X): 0..1 for a direction; the water mirrors it as a warm sheen
float tearAmt(vec3 d){
  float az = d.x / max(length(d.xz), 1e-4);
  return smoothstep(-.12, .42, az) * smoothstep(.012, .05, d.y) * (1. - smoothstep(.11, .27, d.y + .06 * (fbm(d.xz * 5. + uTime * .004) - .5)));
}
float lineAt(vec2 p){ return max(max(lineBand(commonS(p, 0.)), uCross * lineBand(commonS(p, 1.))), halfLine(p)); }
float pawAt(vec2 p){
  float t = uT - .22 * uBeat;
  return max(smoothstep(.50, .94, commonT(p, 0., t)), uCross * smoothstep(.50, .94, commonT(p, 1., t)));
}
// glitter as separate sparks: one per screen cell a few pixels across, each twinkling on its own slow beat
// (fc = gl_FragCoord.xy; k = share of the cells alight). Under one flash a second per spark, eased.
float sparkLayer(vec2 g, float k, float seed){
  vec2 ci = floor(g), cf = fract(g) - .5;
  float ha = h21(ci + seed), hb = h21(ci + 31.7 + seed);
  float tw = .5 + .5 * sin(uTime * (2.4 + 2.8 * ha) + hb * 6.2832);
  float lit = smoothstep(1. - k, 1.2 - k, tw * (.55 + .45 * hb));
  float r = .17 + .20 * ha;                                      // unequal sparks, each well inside its cell
  return lit * smoothstep(r, r * .3, length(cf - (vec2(hb, fract(ha * 7.3)) - .5) * (1. - 2. * r)));
}
float sparks(vec2 fc, float k){
  vec2 g = fc / max(.0078 / max(uPxAng, 1e-5), 2.6);             // two turned grids, so no rows or columns show
  return max(sparkLayer(vec2(.83 * g.x - .56 * g.y, .56 * g.x + .83 * g.y), k, 0.),
    sparkLayer(vec2(.47 * g.x + .88 * g.y, -.88 * g.x + .47 * g.y) * .58, k * .75, 5.));
}
// haze: exponential distance fog plus the ground mist lying in the reeds (thick below ~5 m)
vec3 fenFog(vec3 col, vec3 wp){
  vec3 dv = wp - uCam; float dist = length(dv);
  float f = 1. - exp(-dist * uFogK);
  float hy = max(.5 * (wp.y + uCam.y), 0.);
  float m = 1. - exp(-dist * uMist * exp(-hy / 3.2));
  col = mix(col, uMistCol, m * .92);
  return mix(col, uFogCol, f);
}
`;

// ---- tussock tile: R = reed density (Worley cells 6 m across with leads between), G = a hash per cell ----
async function buildTile(ctx, rng) {
  const CN = 16, cs = TILE / CN, px = new Float32Array(CN * CN), pz = new Float32Array(CN * CN), ph = new Float32Array(CN * CN);
  for (let i = 0; i < CN * CN; i++) { px[i] = rng.range(0.12, 0.88); pz[i] = rng.range(0.12, 0.88); ph[i] = rng(); }
  const data = new Uint8Array(TILE_N * TILE_N * 4);
  for (let j = 0; j < TILE_N; j++) {
    const z = (j + 0.5) / TILE_N * TILE, cj = Math.floor(z / cs);
    for (let i = 0; i < TILE_N; i++) {
      const x = (i + 0.5) / TILE_N * TILE, ci = Math.floor(x / cs);
      let f1 = 1e9, f2 = 1e9, h = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const a = ci + di, b = cj + dj, k = ((b + CN) % CN) * CN + ((a + CN) % CN);
        const dx = (a + px[k]) * cs - x, dz = (b + pz[k]) * cs - z, d = Math.sqrt(dx * dx + dz * dz);
        if (d < f1) { f2 = f1; f1 = d; h = ph[k]; } else if (d < f2) f2 = d;
      }
      const lead = 0.5 + 1.3 * h;                                   // leads 1 to 4 m wide between tussocks
      const r = smoothstep(lead * 0.5, lead * 0.5 + 0.9, f2 - f1) * (h < 0.1 ? 0 : 1);
      const o = (j * TILE_N + i) * 4;
      data[o] = Math.round(r * 255); data[o + 1] = Math.round(h * 255); data[o + 2] = Math.round(clamp(f1 / cs, 0, 1) * 255); data[o + 3] = 255;
    }
    if (j % 8 === 7) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, TILE_N, TILE_N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.needsUpdate = true;
  const at = (u, v, c) => {
    const i = ((Math.floor(u * TILE_N) % TILE_N) + TILE_N) % TILE_N, j = ((Math.floor(v * TILE_N) % TILE_N) + TILE_N) % TILE_N;
    return data[(j * TILE_N + i) * 4 + c] / 255;
  };
  // the JS twin of reedDens() in FEN_GLSL
  const reedDens = (x, z) => {
    const ow = openWater(x, z);
    const r = at(x / TILE, z / TILE, 0), g = at(x / TILE, z / TILE, 1);
    const mere = at(z / 1040 + 0.37, x / 1040 + 0.37, 1);
    const bed = r * Math.max(smoothstep(0.10, 0.20, mere), 1 - smoothstep(14, 28, ow.d));
    const isl = r * (g >= 0.72 ? 1 : 0) * (1 - ow.chan);
    return lerp(bed, isl, ow.open);
  };
  return { tex, reedDens, cellHash: (x, z) => at(x / TILE, z / TILE, 1) };
}

// ---- sky dome: the hero's analytic silver sky, plus a paler tear of clear sky low to port ----
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
  vec3 c = skyCol(d, uClear * .5);
  float az = d.x / max(length(d.xz), 1e-4), ov = 1. - .6 * uClear;
  // a light side and a dark side: brighter toward the sun to port, slate low to starboard and behind the Maelzel
  c *= 1. + (.22 * az - .07) * (1. - d.y) * ov;
  c = mix(c, uSlate * 1.02, (1. - smoothstep(.04, .26, d.y)) * (1. - smoothstep(-.55, .30, az)) * .46 * (1. - uClear));
  c = mix(c, uHor * .80, smoothstep(.972, .999, d.z / max(length(d.xz), 1e-4)) * (1. - smoothstep(.03, .24, d.y)) * .32 * (1. - uClear));   // a paler slot straight downwind: the Maelzel stands against it
  // long bars of overcast converging downwind, toward the Maelzel, with finer drift across them
  vec2 sp = d.xz / (abs(d.y) + .16);
  float st = fbm(vec2(sp.x * 2.2 + 2.2 * vn(sp * .30) + .8 * vn(sp * 1.1 + 5.), sp.y * .42) + vec2(3., uTime * .004));
  float st2 = fbm(vec2(sp.x * 6.1, sp.y * .75) + vec2(11., uTime * .006));
  float cl = fbm(d.xz / (abs(d.y) + .3) * 1.7 + vec2(0., uTime * .006));
  c *= 1. + ((smoothstep(.30, .72, st) - .5) * .30 + (st2 - .5) * .12 + (cl - .5) * .20) * smoothstep(.0, .14, d.y) * ov;
  // the tear: a long low lens of clear pale warm sky to port
  vec3 tc = mix(uTearCol * vec3(1.05, 1.04, 1.02), uTearCol * vec3(.98, .84, .70), smoothstep(.04, .22, d.y));   // pale at the horizon, peach-gold above
  c = mix(c, tc, tearAmt(d) * uTear * (1. - .55 * smoothstep(.42, .74, st) * smoothstep(.06, .16, d.y)) * (.86 + .14 * st2));   // bars of overcast cross it
  // low gold light spilling out of the tear: warm haze round it and along the undersides of the overcast to port
  c += uGold * (.13 * smoothstep(-.45, .75, az) * (1. - smoothstep(.05, .62, d.y)) + .05 * smoothstep(.2, .9, az)) * smoothstep(-.01, .03, d.y);
  // frosty dawn: a rose band above the horizon opposite and under the sun
  c = mix(c, c * vec3(1.16, .98, .93), uClear * (1. - smoothstep(.02, .34, abs(d.y - .04))));
  gl_FragColor = vec4(mix(c, uFogCol, (1. - smoothstep(-.01, .10, d.y)) * .85 * step(-.02, d.y) * (1. - .7 * tearAmt(d) * uTear)), 1.);
}`;

const WATER_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WATER_FRAG = /* glsl */`
uniform vec3 uPeat; uniform float uMirrorZone, uLoom;
varying vec3 vW;
float hgt(vec2 p){ return vn(p * 1.9 + vec2(.0, -uTime * .9)) + .6 * vn(p * 4.3 + vec2(uTime * .7, uTime * .4)); }
void main(){
  vec2 p = vW.xz;
  vec3 Vv = uCam - vW; float dist = max(length(Vv), .01); vec3 V = Vv / dist;
  float C = lockC(p);
  float cs = commonS(p, 0.), cs2 = commonS(p, 1.);
  float gp = gustPulse(p);
  float band = lineAt(p), paw = pawAt(p) * (1. - band);
  float ruffle = max(C * paw, gp * .9);
  // two scrolling ripple layers, flattened with distance; ruffled under each line of glitter (cat's-paws)
  float amp = (.035 + .11 * ruffle) / (1. + dist * .02);
  float h0 = hgt(p), hx = hgt(p + vec2(.12, 0.)), hz = hgt(p + vec2(0., .12));
  vec3 n = normalize(vec3((h0 - hx) * amp * 8., 1., (h0 - hz) * amp * 8.));
  vec3 R = reflect(-V, n); R.y = abs(R.y) + .002; R = normalize(R);
  vec3 sky = skyCol(R, .12 + .4 * ruffle) * 1.12;
  float tear = tearAmt(R) * uTear;
  sky = mix(sky, uTearCol * 1.04, tear * .85);                     // the tear's warm sheen on the water to port
  // (p2) the dome's long bars of overcast, mirrored: the first bar term of SKY_FRAG (its st) on R in place of d, with
  // live's uTime drift and at the dome's own strength, so the water is lighter where the dome is lighter and darker
  // where it is darker. One law on all water. No broad water is lifted above the horizon's 0.84 (the brief: 'Pale values
  // clip: horizon at 0.84'): a bar may raise a channel to 0.84 and no further; where live's own value already stood over
  // that, live's stands and a bar can only darken it
  vec2 barP = R.xz / (abs(R.y) + .16);
  float barS = fbm(vec2(barP.x * 2.2 + 2.2 * vn(barP * .30) + .8 * vn(barP * 1.1 + 5.), barP.y * .42) + vec2(3., uTime * .004));
  float barM = (smoothstep(.30, .72, barS) - .5) * .30 * smoothstep(.0, .14, R.y) * (1. - .6 * uClear);
  sky = min(sky * (1. + barM), max(sky, vec3(.84)));
  float fr = .34 + .66 * pow(1. - clamp(V.y, 0., 1.), 3.);
  vec3 col = mix(uPeat, sky, fr);
  col = mix(col, col * vec3(.60, .68, .74), ruffle * .75);
  col *= mix(1., .70, smoothstep(60., 300., dist));
  // skim ice (frosty dawn): matte pale plates with dark cracks, broken where the reeds tick
  vec4 tl = textureLod(uTile, p / 47. + .21, 0.);
  float crack = smoothstep(.0, .18, tl.r) * (1. - smoothstep(.18, .46, tl.r)) * .55;   // hairline cracks either side of a refrozen lead, not mortar
  vec3 iceCol = mix(uZen, uHor, .35) * (.50 + .16 * tl.g) * mix(.9, 1., smoothstep(.0, .3, tl.r)) + sky * .22;
  float dens = reedDens(p);
  col = mix(col, mix(iceCol, uPeat * 2.2, crack * .8), uFrost * .78 * (1. - .7 * dens));
  // the reed bed: under the stems the water is slate; far off it becomes a combed, breathing nap sown with sparks
  float far = smoothstep(30., 95., dist);
  float comb = .82 + .18 * vn(vec2(p.x * 2.6, p.y * .35));
  vec3 nap = uSlate * (.40 + .20 * comb) * (1. + .16 * cs * C) * (1. + .32 * C * far * (1. - paw)) + uFogCol * .03;   // in step, the plain fen between lines is a step lighter than the cat's-paws
  nap = mix(nap, uZen * .5, uFrost * .25);
  nap += uTearCol * .07 * tear;
  col = mix(col, nap, dens * mix(.74, .9, far));
  // once the fen is in step the open water is ruffled slate, so no mere outshines a line; each cat's-paw is darker still
  float farW = smoothstep(40., 150., dist);
  col = mix(col, col * vec3(.50, .57, .64), max(C, .9 * gustAt(p)) * (1. - dens) * farW * .85);
  // (p2) the cat's-paw: under its own line of glitter (live's paw once the reeds are in step, C * paw) open water is a step
  // darker than live's, and never darker than the dark comb of the reed nap beside it (the nap at comb .82, uSlate *
  // (.40 + .20 * .82), lit in step, frosted and warmed by the tear as the nap is); where live's own water is already
  // under that it stays live's. The water between the lines (paw 0) and the reed bed (dens 1) are live's
  vec3 combDark = uSlate * .564 * (1. + .16 * cs * C) + uFogCol * .03;
  combDark = mix(combDark, uZen * .5, uFrost * .25) + uTearCol * .07 * tear;
  col = mix(col, max(col * vec3(.77, .79, .84), min(col, combDark)), C * paw * (1. - dens) * .75);
  col *= 1. - .64 * (1. - .35 * uCross) * C * paw * far;
  // glitter. Near: one spark per 1.3 m cell with its own beat. Far: the lines themselves, as bands of separate
  // sparks carried across reeds and open water alike (sun-glitter on the ruffle), faded to a steady sheen where
  // the lines would fall only a few pixels apart
  float cell = 1.3; vec2 ci = floor(p / cell), cf = fract(p / cell) - .5;
  float ha = h21(ci), hb = h21(ci + 17.3);
  float own = sin(6.2832 * ((.58 - .16 * ha) * uT + hb));
  float s = mix(own, mix(cs, cs2, step(.5, hb)), C);
  float pxm = dist * uPxAng / max(V.y, .03);                      // metres of water per pixel (along the view)
  float dotm = (1. - smoothstep(.12, .42, length(cf - (vec2(ha, hb) - .5) * .5)));
  float gNear = max(glintOf(s), .75 * gp) * dotm * 2.6 * dens;
  float lineW = uSpacing / max(pxm, 1e-3);                         // pixels between lines
  float lf = smoothstep(2.5, 7., lineW);
  float spk = sparks(gl_FragCoord.xy, .62), spk2 = sparks(gl_FragCoord.xy + 91., .16);
  float lineG = C * mix(.5 * band * mix(.55, 1., dens), mix(2.1, 1., dens) * sparks(gl_FragCoord.xy, .06 + .62 * band) * 1.7 * smoothstep(0., .2, band) + .34 * band, lf);
  float loose = (1. - C) * dens * spk2 * 1.3 + .04 * dens;        // out of step: brass sparks at random
  float gFar = lineG + loose + gp * (spk * 1.6 + .25);
  float nearK = (1. - smoothstep(.5, 1.4, pxm / cell)) * (1. - smoothstep(30., 75., dist));
  float gg = mix(gFar, gNear + gFar * .3, nearK) * far;
  float goldPath = tear * (sparks(gl_FragCoord.xy + 37., .34) * 1.1 + .12) * (1. - .75 * dens) * smoothstep(8., 30., dist);
  vec3 outc = fenFog(col, vW) + (uGlint * gg + uGold * goldPath) * exp(-dist * (uFogK * .45 + uMist * .05));
  // the Maelzel's mirror image shows through the water: on the approach, and from the first frame wherever this bit of
  // water mirrors the Maelzel as seen from here (similar triangles: the height and the offset on the Maelzel it reflects)
  float dp = max(p.y - uCam.z, 1.), hm = uCam.y * max(HZ - p.y, 0.) / dp, xm = uCam.x + (p.x - uCam.x) * (HZ - uCam.z) / dp;
  float mir2 = (1. - smoothstep(150. * uLoom, 185. * uLoom, hm)) * (1. - smoothstep(42. * uLoom, 70. * uLoom, abs(xm))) * smoothstep(8., 30., p.y - uCam.z);
  float a = 1. - uMirrorZone * max(.5 * (1. - smoothstep(48., 80., abs(p.x))) * smoothstep(HZ - 760., HZ - 520., p.y), .62 * mir2) * (1. - dens * .7);
  gl_FragColor = vec4(outc, a);
}`;

// ---- near reed-metronomes: real geometry (foot, notched wand, faceted bob, wedge, two blank blades) ----
// aPA = (swing weight, anchor, material). anchor 0: metres from the foot; 1: y scaled by the reed's height;
// 2: relative to the bob; 3: relative to the tip. aI = (x, z, height, rate hash), aJ = phase hash.
const REED_SWING = /* glsl */`
attribute vec3 aPA; attribute vec4 aI; attribute float aJ;
vec3 reedPos(vec3 pos, float sw, out float s, out float C, out float th){
  vec2 base = aI.xy; float H = aI.z, bf = .55 + .30 * aI.w;
  s = swingS(base, aI.w, aJ, C);
  th = (s * radians(22. + 8. * C) * (1. - .5 * gustPulse(base)) + radians(27.) * gustPulse(base)) * uSwingAmp * sw;
  vec3 p = pos;
  if (aPA.y > .5 && aPA.y < 1.5) p.y = .25 + pos.y * (H - .25);
  else if (aPA.y > 1.5 && aPA.y < 2.5) p.y += .25 + bf * (H - .25);
  else if (aPA.y > 2.5 && aPA.y < 3.5) p.y += H;
  else if (aPA.y > 3.5) { p.y = .02 + pos.y * H * .62; th = (aPA.x - .5) * .9 + s * .06 + .34 * gustPulse(base); }
  return p;
}
vec3 rotZ(vec3 p, float th){ float c = cos(th), sn = sin(th); float y = p.y - .25; return vec3(p.x * c + y * sn, .25 - p.x * sn + y * c, p.z); }
`;
const REED_VERT = /* glsl */`
${REED_SWING}
varying vec3 vW, vN; varying vec2 vUv; varying float vMat, vG;
void main(){
  float s, C, th; float sw = aPA.x > .99 ? 1. : 0.;
  vec3 p = reedPos(position, sw, s, C, th);
  vec3 root = vec3(aI.x, 1.5, aI.y);
  float dist = length(root - uCam);
  if (aPA.z > .5 && aPA.z < 1.5) p.x *= max(.016, .8 * dist * uPxAng);      // the wand never thinner than ~1.5 px
  vUv = vec2(position.x, p.y);
  p = rotZ(p, th);
  vec3 n = normalize(rotZ(normal + vec3(0., .25, 0.), th) - vec3(0., .25, 0.) + vec3(0., 1e-4, 0.));
  vW = vec3(aI.x + p.x, p.y, aI.y + p.z); vN = n; vMat = aPA.z; vG = max(glintOf(s), gustPulse(aI.xy));
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const REED_FRAG = /* glsl */`
varying vec3 vW, vN; varying vec2 vUv; varying float vMat, vG;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(uCam - vW);
  if (!gl_FrontFacing) N = -N;
  float key = max(dot(N, uSunDir), 0.), wrap = .5 + .5 * dot(N, uSunDir);
  vec3 fill = mix(uSlate * .55, uZen * .8, .5 + .5 * N.y);
  vec3 col;
  if (vMat < .5) {                                        // the foot: wood pyramid with a brass edge
    col = uFoot * (fill * 1.3 + uSunCol * key * 1.1);
    col = mix(col, uBrass * (.25 + .9 * wrap), step(vUv.y, .045));
  } else if (vMat < 1.5) {                                // steel wand: one thin sky line, a notched tempo scale
    float line = (1. - smoothstep(.0, .35, abs(vUv.x + .3)));
    float notch = step(.2, vUv.x) * step(fract(vUv.y / .11), .4);
    col = uSteel * (.10 + .30 * wrap) + (uHor * .16 + uGold * .62) * line;
    col *= 1. - .6 * notch;
    col = mix(col, vec3(.74, .80, .84), uFrost * (.04 + .40 * line));
  } else if (vMat < 2.5) {                                // brass bob: satin, one facet cut to flash at the sun
    vec3 R = reflect(-V, N);
    col = uBrass * (.16 + .55 * wrap + .5 * skyCol(R, .5));
    col += uGlint * 3.8 * vG * smoothstep(.35, .8, N.x);
    col = mix(col, vec3(.7, .76, .8), uFrost * .25 * (1. - vG));
  } else if (vMat < 3.5) {                                // the wedge weight at the tip, like a seed head
    col = uSteel * vec3(.42, .5, .62) * (.35 + .8 * wrap) + uGold * .22;
  } else {                                                // blank blades
    col = mix(uSlate * .34, uSteel * .40, wrap) * (.6 + .5 * smoothstep(0., 2., vW.y));
    col += uGold * .20 * smoothstep(.8, 2.4, vW.y);
    col = mix(col, vec3(.7, .76, .8), uFrost * .18);
  }
  gl_FragColor = vec4(fenFog(col, vW), 1.);
}`;
// overlay (premultiplied): the ring ripple at the foot, the glint star on the bob, the wand's wobbling reflection
const REEDOV_VERT = /* glsl */`
${REED_SWING}
varying vec2 vUv; varying vec4 vK; varying vec3 vW;
void main(){
  float s, C, th; vec2 base = aI.xy; float H = aI.z, bf = .55 + .30 * aI.w;
  s = swingS(base, aI.w, aJ, C);
  th = (s * radians(22. + 8. * C) * (1. - .5 * gustPulse(base)) + radians(27.) * gustPulse(base)) * uSwingAmp;
  float dist = length(vec3(aI.x, 1.5, aI.y) - uCam);
  vec3 w; vUv = position.xy; vK = vec4(aPA.z, 0., 0., 0.);
  if (aPA.z < 4.5) {                                      // 4: ripple ring on the water, born at each tick
    float lo = uT - .06, own0 = sin(6.2832 * ((.58 - .16 * aI.w) * lo + aJ));
    float sPrev = mix(own0, commonT(base, aJ, lo), C);
    float fall = step(abs(s), abs(sPrev));                 // |s| shrinking: the tick has just happened
    float age = 1. - abs(s);
    float rad = mix(.12, .95, age) * (.7 + .5 * aI.w);
    w = vec3(aI.x + position.x * rad * 1.25, .012, aI.y + position.y * rad * 1.25);
    vK.y = rad; vK.z = (1. - age) * sqrt(max(age, 0.)) * 2.6 * fall * (1. - smoothstep(12., 60., dist));
  } else if (aPA.z < 5.5) {                               // 5: glint star, camera-facing, never under 1.5 px
    vec3 c = rotZ(vec3(0., .25 + bf * (H - .25), 0.), th) + vec3(aI.x, 0., aI.y);
    float g = max(glintOf(s), gustPulse(base)), sz0 = .16, sz = max(sz0, 1.8 * dist * uPxAng);
    vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    w = c + (cr * position.x + cu * position.y) * sz * (.5 + .8 * g);
    vK.z = g * (sz0 * sz0) / (sz * sz);
  } else {                                                // 6: the wand mirrored in the water
    vec3 p = vec3(position.x * max(.014, .9 * dist * uPxAng), .25 + position.y * (H - .25), 0.);
    p = rotZ(p, th); p.y = -p.y;
    p.x += sin(p.y * 5. + uTime * 2.6 + aJ * 20.) * .035 * (-p.y);
    w = vec3(aI.x + p.x, p.y * .96, aI.y + p.z); vK.z = .55 * (1. - .25 * position.y);
  }
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
  if (aPA.z > 5.5) gl_Position.z -= .0005 * gl_Position.w;
}`;
const REEDOV_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vK; varying vec3 vW;
void main(){
  vec3 dv = vW - uCam; float f = exp(-length(dv) * uFogK);
  if (vK.x < 4.5) {
    float r = length(vUv) * 1.25, ring = (1. - smoothstep(.0, .09, abs(r - vK.y) / max(vK.y, .05) * .35)) ;
    float a = ring * vK.z * f * step(r, 1.24);
    gl_FragColor = vec4(mix(uHor, uSunCol, .3) * a * .55, a * .25);
  } else if (vK.x < 5.5) {
    float r = length(vUv), core = (1. - smoothstep(0., 1., r)); core *= core;
    float star = max(0., 1. - abs(vUv.x) * 9.) * max(0., 1. - abs(vUv.y)) + max(0., 1. - abs(vUv.y) * 9.) * max(0., 1. - abs(vUv.x));
    gl_FragColor = vec4(mix(uGlint, uSunCol, .3) * (core * 3.2 + star * 1.6) * vK.z * f, 0.);
  } else {
    float a = vK.z * f * (1. - smoothstep(.5, 1., abs(vUv.x)));
    gl_FragColor = vec4(uSlate * .45 * a, a);
  }
}`;

// ---- far reeds: one upright card per clump, six wands drawn in the fragment shader with the same swing ----
// (cards stand in the x-y plane, the plane every wand swings in, and we always fly within ~20 degrees of +Z).
// The lower half of the card is the clump's reflection, drawn over the water.
const CARD_W = 4.6;
const CARD_VERT = /* glsl */`
attribute vec4 aI;
varying vec2 vQ; varying vec4 vI; varying vec3 vW; varying vec3 vS; varying float vP; varying vec3 vL;
void main(){
  float H = aI.z + .5;
  vQ = vec2(position.x * ${(CARD_W / 2 + 1.6).toFixed(2)}, position.y * H);
  vW = vec3(aI.x + vQ.x, vQ.y, aI.y);
  vI = aI;
  float C = lockC(aI.xy);
  float dist = length(vec3(aI.x, 2., aI.y) - uCam);
  vS = vec3(C, dist * uPxAng, exp(-dist * uFogK));
  vP = gustPulse(aI.xy);
  float bnd = lineAt(aI.xy);
  float farK = smoothstep(30., 95., dist);
  vL = vec3(bnd * C * farK, pawAt(aI.xy) * (1. - bnd) * C * farK, farK);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const CARD_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vI; varying vec3 vW; varying vec3 vS; varying float vP; varying vec3 vL;
void main(){
  float C = vS.x, px = max(vS.y, 1e-4);
  float mir = step(vQ.y, 0.);
  vec2 q = vec2(vQ.x, abs(vQ.y));
  q.x += mir * (sin(q.y * 4. + uTime * 2.3 + vI.w * 30.) * .07 + sin(q.y * 9.5 - uTime * 3.1 + vQ.x * 2.) * .035) * q.y;
  float cov = 0., bob = 0., glint = 0., tipc = 0.;
  float hw = max(.016, .62 * px), thin = clamp(.016 / (.62 * px), .0, 1.);
  float br = max(.075, .9 * px), gr = max(.16, 1.7 * px);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float ha = fract(vI.w * 7.13 + fi * .618), hb = fract(vI.w * 3.71 + fi * .377 + ha * 5.);
    vec2 foot = vec2((fi + .2 + .6 * ha - 3.) * ${(CARD_W / 6).toFixed(3)}, .22);
    float H = (vI.z - .22) * (.55 + .45 * hb);
    vec2 wp = vI.xy + vec2(foot.x, (ha - .5) * 3.);
    float own = sin(6.2832 * ((.58 - .16 * ha) * uT + hb));
    float s = mix(own, commonS(wp, hb), C);
    float th = (s * radians(22. + 8. * C) * (1. - .5 * vP) + radians(27.) * vP) * uSwingAmp;
    vec2 dir = vec2(sin(th), cos(th));
    vec2 d = q - foot; float t = clamp(dot(d, dir), 0., H);
    float dl = length(d - dir * t);
    cov = max(cov, smoothstep(hw + px * .6, hw - px * .4, dl));
    vec2 bc = foot + dir * H * (.55 + .30 * ha);
    float db = length(q - bc);
    bob = max(bob, smoothstep(br + px * .5, br - px * .5, db));
    float g = max(glintOf(s), vP), fall = max(1. - db / gr, 0.);
    glint += g * fall * fall * (.16 * .16) / (gr * gr);
    tipc = max(tipc, smoothstep(.09 + px, .09 - px, length(q - foot - dir * H)));
    cov = max(cov, smoothstep(.13 + px, .13 - px, abs(d.x) + max(d.y, 0.) * .6 + max(-d.y, 0.) * 9.) * step(-.2, d.y));
  }
  // the sedge: three ranks of blank blades under a ragged dome (tallest in the middle, single blades at both ends),
  // rear ranks standing higher on the card and darker, the front rank a step lighter and broken by slots of water
  float xn = vQ.x / ${(CARD_W / 2 + 1.6).toFixed(2)};
  float dome = sqrt(max(1. - xn * xn, 0.)) * (1. - smoothstep(.82, 1., abs(xn)));
  float rag = .50 + .85 * vn(vec2(vQ.x * .8 + vI.w * 40., vI.w * 9.)) * (.7 + .6 * vn(vec2(vQ.x * 2.7 + vI.w * 71., 3.)));
  float env = vI.z * .64 * dome * rag;
  float slot = smoothstep(.56, .70, vn(vec2(vQ.x * 1.5 + vI.w * 23., 7.)));
  float wl = .34 * vn(vec2(vQ.x * .9 + vI.w * 5., 2.)) + .14 * vn(vec2(vQ.x * 3.3 + vI.w * 15., 4.)) - .08;   // a waterline that wanders
  float sedge = 0., sh = .6;
  for (int j = 0; j < 3; j++) {
    float fj = float(j), fr = 3.6 + 2.6 * fj;
    float xx = (q.x + vI.w * 17. + fj * 3.3) * fr;
    float bi = floor(xx), bf = fract(xx) - .5, hh = h21(vec2(bi, vI.w * 51. + fj));
    float y0 = ((2. - fj) * .13 + .10 * h21(vec2(bi + 3., vI.w * 29. + fj)) + wl) * (1. - .8 * mir) + slot * (fj > 1.5 ? 9. : .16 * fj);
    float bh = env * (.28 + .72 * hh) * (1. - .16 * fj), yy = q.y - y0;
    float t = yy / max(bh, .05);
    float lean = (h21(vec2(bi + 7., vI.w * 13. + fj)) - .5) * .8;
    float wdt = .44 * (1. - t), pxb = px * fr * 1.2;
    float b = smoothstep(wdt + pxb, wdt - pxb, abs(bf - lean * t)) * step(0., yy) * step(yy, bh);
    // where the blades fall under a pixel: the share of blades taller than this height, so the top stays ragged and soft
    float bfar = (1. - smoothstep(.22, 1., yy / max(env * (1. - .16 * fj), .05))) * step(0., yy) * .85;
    b = mix(b, bfar, smoothstep(.22, .55, pxb));
    sh = mix(sh, .62 + .30 * fj + .25 * (hh - .5), b);
    sedge = max(sedge, b);
  }
  bob *= clamp(.075 / (.9 * px), 0., 1.);
  float lit = .5 + .5 * smoothstep(0., 3., q.y);
  vec3 dark = mix(uSlate * .34, uSteel * .42, .30 * lit);
  dark = mix(dark, vec3(.62, .69, .74), uFrost * (.04 + .22 * smoothstep(1.2, 3.5, q.y)));
  dark *= (1. - .60 * (1. - .35 * uCross) * vL.y) * (1. + .28 * vS.x * vL.z * (1. - vL.y));   // under a cat's-paw the bed is darker; the plain fen between lines a step lighter
  vec3 col = mix(dark * sh, dark * 1.1, cov);
  col += uGold * (.17 * smoothstep(.45, 1., q.y / max(env, .3)) * (1. - cov) + .20 * cov * smoothstep(.8, 2.6, q.y)) * (1. - .6 * mir) * (1. - .85 * smoothstep(9., 30., uCam.y));   // (from above the bed stays slate, so the lines carry)
  col = mix(col, uBrass * .5, bob);
  // the reflection wobbles and fades out downward
  float mirA = mix(1., .55 * (1. - smoothstep(.15, 1., q.y / max(env * 1.5 + .5, .3))), mir);
  float a = max(max(cov * mix(.7, 1., thin), sedge * .96), bob) * mirA;
  a = max(a, tipc * (1. - mir));
  vec3 fogged = fenFog(col, vec3(vW.x, abs(vW.y), vW.z));
  float gf = vS.z * mix(1., .35, mir);
  // the line of glitter crossing this clump: sparks at bob height over the whole crown, so a line holds from above
  float crown = smoothstep(.30, .62, q.y / max(vI.z, .5)) * (1. - smoothstep(.80, 1.05, q.y / max(vI.z, .5)))
    * smoothstep(${(CARD_W / 2 + 1.5).toFixed(2)}, ${(CARD_W / 2 - .3).toFixed(2)}, abs(vQ.x)) * (1. - mir);
  float lk = max(vL.x, vP * vL.z);                                 // a line of glitter, or the gust's own bar of glints as it passes
  float lineG = (crown * (sparks(gl_FragCoord.xy, .06 + .62 * lk) * 1.6 * smoothstep(0., .2, lk) + .2 * lk) + .26 * vL.x * a * (1. - mir))
    * exp(-vS.y / max(uPxAng, 1e-6) * (uFogK * .45 + uMist * .05));
  gl_FragColor = vec4(fogged * a + mix(uGlint, uSunCol, .3) * 3.4 * min(glint, 1.5) * gf + uGlint * lineG, a);
}`;

// ---- lily pads of grey-green baize, rocking; one in eight carries a cream bud that opens as a line passes ----
const PAD_VERT = /* glsl */`
attribute vec4 aI; attribute vec3 aK;        // aI = (x, z, radius, hash); aK = (petal 0/1, tip 0/1, petal angle)
uniform float uBloomAll;
varying vec3 vW, vN; varying vec2 vUv; varying float vPetal;
void main(){
  vec2 base = aI.xy; float h = aI.w;
  float C = lockC(base), cs = commonS(base, h);
  vec3 p = position * aI.z; vec3 n = vec3(0., 1., 0.);
  float open = max(uBloomAll, C * smoothstep(-.3, .7, cs));
  if (aK.x > .5) {                          // a petal: hinge at the centre, 82 degrees up when shut, 24 when open
    float up = radians(mix(82., 24., open)), r = aK.y * .42 * aI.z, yaw = aK.z;
    float side = position.x;                // -1, 0, 1 across the petal
    vec3 out2 = vec3(cos(yaw), 0., sin(yaw)), tng = vec3(-sin(yaw), 0., cos(yaw));
    p = out2 * (r * cos(up) + .05) + vec3(0., r * sin(up) + .03, 0.) + tng * side * .09 * aI.z * (1. - aK.y * .8);
    n = normalize(out2 * -sin(up) + vec3(0., cos(up), 0.) + vec3(0., .3, 0.));
  }
#ifdef P2
  // (p2) a pad of the new rafts is turned about its centre by an angle from its own hash (live's notch always faces +X)
  if (aK.x < .5) { float tu = 6.2832 * h; p.xz = mat2(cos(tu), sin(tu), -sin(tu), cos(tu)) * p.xz; }
#endif
  float rock = sin(uTime * (1.1 + h) + h * 40.) * .05 + .05 * sin(uTime * 2.3 + base.x) * C;
  p.y += p.x * rock + p.z * rock * .6 + .035;
  vUv = position.xz; vPetal = aK.x;
  vW = vec3(base.x + p.x, p.y, base.y + p.z); vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const PAD_FRAG = /* glsl */`
varying vec3 vW, vN; varying vec2 vUv; varying float vPetal;
void main(){
  vec3 N = normalize(vN);
  float key = max(dot(N, uSunDir), 0.) * 1.6 + .25;
  vec3 col;
  if (vPetal > .5) col = vec3(.90, .84, .66) * (.45 + .5 * key) + uSunCol * .12;
  else {
    float r = length(vUv), ang = atan(vUv.y, vUv.x + 1e-5);
    float vein = smoothstep(.75, 1., abs(sin(ang * 5.))) * smoothstep(.1, .6, r);
    col = uPadCol * (.70 + .50 * key) * (1. - .22 * vein) * (.82 + .3 * r);
    col += uHor * .10 * pow(1. - max(normalize(uCam - vW).y, 0.), 3.);
    col = mix(col, vec3(.72, .78, .8), uFrost * .45 * smoothstep(.5, 1., r));
  }
#ifdef P2
  if (vPetal > .5) col = min(col, vec3(.98));   // (p2) a new bud's petal stops under white
#endif
  gl_FragColor = vec4(fenFog(col, vW), 1.);
}`;

// ---- stand-herons: folding music stands of black lacquered steel. One instanced mesh, posed in the vertex shader ----
// aP = (part, k, flag): 0 body collar, 1/2 legs (flag 1 = shin and foot, hinged at the knee), 3 tail leg, 4 lower shaft,
// 5 upper shaft, head and clip bill, 7 desk slat k (-4..4). Standing, the folded desk is the long bill and, opened, a fan;
// in flight it slides down the shaft and spreads as two wings of four slats, the ninth lying back as the tail.
// Per instance: iA = (x, y, z, heading), iB = (stride phase, neck extension, fan open, flight), iC = (flap phase, strike, scale).
const HERON_VERT = /* glsl */`
attribute vec3 aP, iC; attribute vec4 iA, iB, aAx, aBx; attribute float aTone;
varying vec3 vW; varying float vTone;
vec3 rx(vec3 p, vec3 o, float a){ float c = cos(a), s = sin(a); vec3 d = p - o; return o + vec3(d.x, d.y * c - d.z * s, d.y * s + d.z * c); }
vec3 rzz(vec3 p, vec3 o, float a){ float c = cos(a), s = sin(a); vec3 d = p - o; return o + vec3(d.x * c - d.y * s, d.x * s + d.y * c, d.z); }
void main(){
  vec3 hub = vec3(0., 1.15, 0.), p = position;
  float sc = max(iC.z, .1);
  // no strut or slat ever thinner than ~2.6 pixels either way: a heron is a solid, lit object at any range
  float mw = 1.3 * length(iA.xyz + vec3(0., 1.5 * sc, 0.) - uCam) * uPxAng / sc;
  mw *= mix(1., .55, step(.5, aTone));                             // (nickel fittings stay small: bright points, not blobs)
  p += aAx.xyz * (max(1., mw / max(aAx.w, 1e-3)) - 1.) + aBx.xyz * (max(1., mw / max(aBx.w, 1e-3)) - 1.);
  float part = aP.x, fl = iB.w, open = iB.z;
  vec3 nd = vec3(0., .96, .28), dors = vec3(0., .28, -.96);    // the shaft's axis, and the back of the bird once it leans into flight
  if (part > .5 && part < 2.5) {
    float sgn = part < 1.5 ? 1. : -1.;
    float lift = max(sgn * cos(iB.x), 0.) * (1. - fl);
    if (aP.z > .5) p = rx(p, vec3(sgn * .17, .62, -.20), .55 * lift + .85 * fl);   // the knee folds as the foot lifts; in flight the leg trails straight
    p = rx(p, hub, sgn * .40 * sin(iB.x) * (1. - fl));
  } else if (part > 2.5 && part < 3.5) {
    p = rx(p, hub, .10 * sin(iB.x * 2.) * (1. - fl) - fl * .95);
  } else if (part > 4.5 && part < 6.5) {
    p += nd * .55 * iB.y;
  } else if (part > 6.5) {
    // a slat: modelled along +Y from the origin, hinged at the shoulders. Folded, the nine lie back along the body as a
    // wedge of folded wings; opened, they fan out behind the neck; flying, they are two wings of four with the ninth as the tail
    float k = aP.y / 4.;
    vec3 sh = hub + nd * .42;
    float ph = radians(20. + 3.6 * aP.y);
    vec3 fd = vec3(0., -sin(ph), -cos(ph)), fu = vec3(0., cos(ph), -sin(ph));
    vec3 F = sh + vec3(aP.y * .028 + p.z, .03, -.09) + fd * (p.y * .68) + fu * p.x;
    vec3 q = rzz(p, vec3(0.), -k * radians(78.));
    q = rx(q, vec3(0.), radians(-10.));
    q += sh + vec3(0., .02, -.07 - .004 * aP.y);
    // each wing: four slats side by side like a blind, swept back a little and splayed toward the tip, the rear ones shorter
    float sd = sign(aP.y), j = abs(aP.y);
    float sw = radians(8. + 6. * (j - 1.)), fa = .24 + .62 * sin(iC.x - .18 * j), len = 1. - .09 * (j - 1.);
    vec3 lat = vec3(sd * cos(fa), 0., 0.) + dors * sin(fa);
    vec3 dir = lat * cos(sw) - nd * sin(sw), wd = nd * cos(sw) + lat * sin(sw), nr = cross(dir, wd);
    vec3 root = sh + nd * (.22 - .125 * (j - 1.)) + vec3(sd * .07, 0., 0.);
    if (j < .5) { dir = -nd; wd = vec3(1., 0., 0.); nr = dors; root = sh - nd * .25; len = .8; }
    vec3 w3 = root + dir * (p.y * len) + wd * p.x + nr * p.z;
    p = mix(mix(F, q, open), w3, fl);
  }
  if (part > 3.5) p = rx(p, hub, iC.y * .62 * (1. - fl));        // the strike: the whole shaft pitches forward
  p = rx(p, hub, fl * radians(62.));                              // in flight the body lies forward: neck out ahead, legs trailing
  p = rzz(p, hub, -fl * iB.x);                                     // and banks (in flight iB.x is the bank, port wing down, not the stride)
  p *= sc;
  float c = cos(iA.w), s = sin(iA.w);
  vW = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c) + iA.xyz;
  vTone = aTone;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const HERON_FRAG = /* glsl */`
varying vec3 vW; varying float vTone;
void main(){
  vec3 N = normalize(cross(dFdx(vW), dFdy(vW)) + vec3(0., 1e-6, 0.));
  vec3 V = normalize(uCam - vW); if (dot(N, V) < 0.) N = -N;
  float key = max(dot(N, uSunDir), 0.), rim = 1. - max(dot(N, V), 0.); rim = rim * rim * rim;
  float top = smoothstep(.30, .95, N.y), port = smoothstep(.66, 1., N.x);     // the sky lies along every upper edge; the gold light comes from port (+X)
  vec3 R = reflect(-V, N);
  float spec = max(dot(R, uSunDir), 0.); spec *= spec; spec *= spec; spec *= spec; spec *= spec;
  vec3 skyc = mix(uHor, uZen, .45);
  // black lacquer: almost no colour of its own, but it mirrors the sky above and the warm light to port
  vec3 lac = vec3(.012, .014, .018) + skyc * (.19 * top + .07 * rim) + uGold * .30 * port + uSunCol * (.05 * key + .26 * spec);
  // nickel joints, feet and slat caps: a step brighter than the lacquer, with a glint that comes and goes
  float tw = .5 + .5 * sin(uTime * 2.3 + vW.x * 3.1 + vW.z * 2.3 + vW.y * 5.);
  vec3 nick = vec3(.34, .36, .38) * (.22 + .65 * top + .7 * key + .3 * rim) + uGold * .22 * port + mix(uGlint, uSunCol, .4) * (1.1 * spec + .10 * tw * tw * tw * tw);
  gl_FragColor = vec4(fenFog(mix(lac, nick, vTone), vW), 1.);
}`;
function heronGeometry() {
  const pos = [], aP = [], tone = [], idx = [], axA = [], axB = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const tmp = new THREE.Vector3(), side = new THREE.Vector3(), up2 = new THREE.Vector3();
  // a four-sided strut from a to b, wa x wb thick (half-widths); fl = the vertex flag (legs: 1 below the knee)
  const strut = (a, b, wa, wb, part, k = 0, tn = 0, fl = 0) => {
    tmp.subVectors(b, a).normalize();
    side.set(1, 0, 0); if (Math.abs(tmp.x) > 0.9) side.set(0, 0, 1);
    up2.crossVectors(tmp, side).normalize(); side.crossVectors(up2, tmp).normalize();
    const base = pos.length / 3;
    for (const e of [a, b]) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      pos.push(e.x + side.x * sx * wa + up2.x * sy * wb, e.y + side.y * sx * wa + up2.y * sy * wb, e.z + side.z * sx * wa + up2.z * sy * wb);
      aP.push(part, k, fl); tone.push(tn);
      axA.push(side.x * sx * wa, side.y * sx * wa, side.z * sx * wa, wa); axB.push(up2.x * sy * wb, up2.y * sy * wb, up2.z * sy * wb, wb);
    }
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; idx.push(base + i, base + j, base + 4 + j, base + i, base + 4 + j, base + 4 + i); }
    idx.push(base, base + 2, base + 1, base, base + 3, base + 2, base + 4, base + 5, base + 6, base + 4, base + 6, base + 7);
  };
  const hub = V(0, 1.15, 0), nd = V(0, 0.96, 0.28);
  const on = (t, dx = 0) => hub.clone().addScaledVector(nd, t).add(V(dx, 0, 0));
  strut(V(0, 1.0, 0), V(0, 1.32, 0), 0.07, 0.07, 0);                                      // the body: the tripod's collar block
  strut(V(0, 0.97, 0), V(0, 1.02, 0), 0.088, 0.088, 0, 0, 1); strut(V(0, 1.30, 0), V(0, 1.35, 0), 0.088, 0.088, 0, 0, 1);
  for (const [part, sx] of [[1, 1], [2, -1]]) {                                           // two legs: thigh, knee, shin, four toes
    const knee = V(sx * 0.17, 0.62, -0.20), ank = V(sx * 0.24, 0.05, 0.10);
    strut(hub, knee, 0.036, 0.036, part);
    strut(knee.clone().add(V(-0.05 * sx, 0, 0)), knee.clone().add(V(0.05 * sx, 0, 0)), 0.055, 0.055, part, 0, 1);   // the knee: a nickel hinge
    strut(knee, ank, 0.030, 0.030, part, 0, 0, 1);
    strut(ank, V(sx * 0.24, 0.02, 0.50), 0.028, 0.022, part, 0, 0.75, 1);
    strut(ank, V(sx * 0.08, 0.02, 0.40), 0.024, 0.020, part, 0, 0.75, 1);
    strut(ank, V(sx * 0.42, 0.02, 0.38), 0.024, 0.020, part, 0, 0.75, 1);
    strut(ank, V(sx * 0.25, 0.02, -0.12), 0.024, 0.020, part, 0, 0.75, 1);
  }
  strut(hub, V(0, 0.84, -1.05), 0.034, 0.034, 3); strut(V(0, 0.84, -1.05), V(0, 0.80, -1.26), 0.05, 0.022, 3, 0, 1);    // the third leg, carried as a tail
  strut(hub, on(0.8), 0.042, 0.042, 4);                                                   // the neck: lower shaft
  strut(on(0.73), on(0.85), 0.06, 0.06, 4, 0, 1);
  strut(on(0.3), on(1.02), 0.028, 0.028, 5);                                              // sliding upper shaft
  strut(on(0.97), on(1.22), 0.085, 0.07, 5);                                              // the head: the desk's hinge block
  strut(on(1.10, -0.11), on(1.10, 0.11), 0.034, 0.034, 5, 0, 1);                          // its wing nut: a bright eye on either side
  const hp = on(1.12), bd = V(0, -0.442, 0.897);                                          // the clip: a short bill of its own
  strut(hp.clone().addScaledVector(bd, 0.05), hp.clone().addScaledVector(bd, 0.46), 0.036, 0.034, 5);
  strut(hp.clone().addScaledVector(bd, 0.42), hp.clone().addScaledVector(bd, 0.82), 0.021, 0.020, 5, 0, 0.55);
  for (let k = -4; k <= 4; k++) {                                                         // the desk: nine slats
    strut(V(0, 0, 0), V(0, 1.62, 0), 0.042, 0.009, 7, k);
    strut(V(-0.058, 1.59, 0), V(0.058, 1.59, 0), 0.024, 0.013, 7, k, 1);
    strut(V(-0.07, 0.8, 0), V(0.07, 0.8, 0), 0.014, 0.011, 7, k, 0.7);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 3));
  g.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 1));
  g.setAttribute('aAx', new THREE.Float32BufferAttribute(axA, 4)); g.setAttribute('aBx', new THREE.Float32BufferAttribute(axB, 4));
  g.setIndex(idx);
  return g;
}

// ---- fork-flies: tuning forks flying stem-first, tines ghosted by their own hum, glass wings a pale disc ----
// aK = (kind, across/alpha param, phase). kind 0 steel, 1 ghost tine, 2 wing disc (billboard), 3 ring on the water.
// aI = (home x, y, z, hash); aS = squadron slot (0..8) or -1 for the ones that live on the fen.
const FLY_VERT = /* glsl */`
attribute vec3 aK; attribute vec4 aI; attribute float aS;
uniform vec3 uSquad; uniform vec4 uSquadDir;     // xz = heading, w = presence 0..1
varying vec2 vUv; varying vec3 vK; varying vec3 vW;
void main(){
  float h = aI.w, t = uTime;
  vec3 c; vec2 fw;
  if (aS < -.5) {
    // hover, then dart: a new perch every few seconds, eased
    float per = 2.6 + 2. * h, ph = t / per + h * 7., k = floor(ph), f = smoothstep(.62, 1., fract(ph));
    vec3 a = vec3(h21(vec2(k, h * 91.)), h21(vec2(k, h * 37. + 3.)), h21(vec2(k + 5., h * 53.))) - .5;
    vec3 b = vec3(h21(vec2(k + 1., h * 91.)), h21(vec2(k + 1., h * 37. + 3.)), h21(vec2(k + 6., h * 53.))) - .5;
    vec3 off = mix(a, b, f) * vec3(16., 2.4, 16.);
    c = aI.xyz + off + vec3(0., .12 * sin(t * 5. + h * 60.), 0.);
    vec2 dd = (b - a).xz; fw = normalize(dd + vec2(1e-3, 2e-3));
  } else {
    float slot = aS, row = floor((slot + 1.) * .5), sd = mod(slot, 2.) < .5 ? 1. : -1.;
    vec2 f2 = normalize(uSquadDir.xz + vec2(0., 1e-4)), rt = vec2(f2.y, -f2.x);
    vec2 pv = .819 * f2 + .574 * rt, fv = .574 * f2 - .819 * rt;   // our port and our forward (the nine head 55 degrees across the bow)
    // a vee seen face-on: the leader at its point, two arms trailing to starboard, one rising and one falling
    vec2 fl2 = pv * (-row * 1.9) + fv * (row * .5);
    vec3 form = vec3(fl2.x, .12 * sin(t * 2.2 + slot * 1.7) + row * .8 * sd, fl2.y);
    c = uSquad + form + vec3(0., (1. - uSquadDir.w) * 40. + (1. - step(.004, uSquadDir.w)) * 600., 0.);   // (gone for good once they have left: never a speck in a corner)
    fw = f2;
  }
  vec3 p = position; vUv = uv; vK = aK;
  float big = aS < -.5 ? 1. : 2.5;                               // the five that pace us are the big ones
  vec3 w;
  if (aK.x < 1.5) {
    if (aK.x > .5) p.x += sin(t * 61. + aK.z * 2.1 + h * 30.) * .05 * (1. - smoothstep(-.3, 0., p.z));
    float nod = -p.z * .10 + .03 * sin(t * 3.1 + h * 20.) * p.z;
    p = (aK.x > .5 ? vec3(0., p.x + p.y * 1.3 + nod, p.z) : vec3(-p.y, p.x + nod, p.z)) * (aS < -.5 ? vec3(1.) : vec3(.72, .72, 1.));   // flown level and on edge: side-on, two tines one above the other
    p *= big;
    w = c + vec3(p.x * fw.y + p.z * fw.x, p.y, -p.x * fw.x + p.z * fw.y);
  } else if (aK.x < 2.5) {
    vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    float s0 = .52 * big, sz = max(s0, 3. * length(c - uCam) * uPxAng);     // the wings: a blurred pair, half a fork long each
    w = c + vec3(0., .22 * big, 0.) + (cr * p.x + cu * p.y * .6) * sz;
    vK.y = (s0 * s0) / (sz * sz);
  } else {
    w = vec3(c.x + p.x * .6 * big, .015, c.z + p.y * .6 * big);
    vK.y = 1. - smoothstep(1., 5.5, c.y);
  }
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
  if (aS > 4.5) gl_Position = vec4(2., 2., 2., 1.);                // (the vee is five strong: the other four slots are never drawn)
}`;
const FLY_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vK; varying vec3 vW;
void main(){
  float f = exp(-length(vW - uCam) * uFogK);
  if (vK.x < .5) {
    // polished steel bar, lit as a round: dark underside, the sky as a bright line along its upper edge, a glint that runs along it
    float up = vUv.x, line = exp(-(up - .45) * (up - .45) * 22.);
    float run = .5 + .5 * sin(vUv.y * 2.4 + uTime * 2.6 + vW.x * .7 + vW.z * .5); run *= run; run *= run;
    vec3 col = uSteel * (.08 + .42 * smoothstep(-.5, .6, up)) + mix(uHor, uZen, .3) * .55 * line + mix(uGlint, uSunCol, .5) * line * run * .9 + uGold * .10 * smoothstep(-.2, .8, up);
    if (vK.y > .5) { if (dot(vUv, vUv) > 1.) discard; col = vec3(.62, .65, .68) * (.50 + .5 * smoothstep(-.6, .7, vUv.x)) + uHor * .2; }   // the ball end: nickel
    gl_FragColor = vec4(fenFog(col, vW), 1.);
  }
  else if (vK.x < 1.5) { float a = .36; gl_FragColor = vec4(fenFog(uSteel * .22, vW) * a, a); }
  else if (vK.x < 2.5) {
    // glass wings beating too fast to see: two pale lobes, brightest along their leading edge, veined, flickering
    vec2 e = vec2(abs(vUv.x), vUv.y + .55);                       // each wing springs from the yoke, up and outward
    vec2 q = vec2(dot(e, vec2(.766, .643)), dot(e, vec2(-.643, .766)));
    q = vec2((q.x - .62) / .60, q.y / .20);
    float d = length(q), lead = smoothstep(-.9, .6, q.y);
    float a = (1. - smoothstep(.6, 1., d)) * (.10 + .34 * lead * lead + .22 * smoothstep(.55, .95, d)) * min(vK.y, 1.);
    a *= .72 + .28 * sin(q.x * 9. + uTime * 14.);
    gl_FragColor = vec4((mix(uHor, uSunCol, .35) * .8 + uGold * .25) * a * f, a * .22);
  } else {
    float r = length(vUv), a = (1. - smoothstep(.6, 1., r)) * (.5 + .5 * sin(r * 34. - uTime * 9.)) * vK.y * .36 * f;
    gl_FragColor = vec4(uHor * a * .7, a * .3);
  }
}`;
function flyGeometry() {
  const pos = [], uv = [], aK = [], idx = [];
  const quad = (pts, kind, par = 0, ph = 0) => {
    const b = pos.length / 3;
    pts.forEach((p, i) => { pos.push(p[0], p[1], p[2]); uv.push(i === 0 || i === 3 ? -1 : 1, i < 2 ? -1 : 1); aK.push(kind, par, ph); });
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  const ribbon = (x, z0, z1, w, kind, ph = 0) => {            // crossed ribbons so it reads from any side
    quad([[x - w, 0, z0], [x + w, 0, z0], [x + w, 0, z1], [x - w, 0, z1]], kind, 0, ph);
    quad([[x, -w, z0], [x, w, z0], [x, w, z1], [x, -w, z1]], kind, 0, ph);
  };
  ribbon(0, 0.10, 0.46, 0.030, 0);                             // the stem, forward of the yoke
  ribbon(-0.10, -0.50, 0.0, 0.030, 0); ribbon(0.10, -0.50, 0.0, 0.030, 0);     // the two tines, trailing
  for (let i = 0; i < 6; i++) {                                // the yoke: a round bend joining the tines to the stem
    const a0 = (i / 6) * Math.PI, a1 = ((i + 1) / 6) * Math.PI, w = 0.030;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    quad([[(0.10 - w) * c0, 0, (0.10 - w) * s0], [(0.10 + w) * c0, 0, (0.10 + w) * s0], [(0.10 + w) * c1, 0, (0.10 + w) * s1], [(0.10 - w) * c1, 0, (0.10 - w) * s1]], 0);
    quad([[0.10 * c0, -w, 0.10 * s0], [0.10 * c0, w, 0.10 * s0], [0.10 * c1, w, 0.10 * s1], [0.10 * c1, -w, 0.10 * s1]], 0);
  }
  quad([[-0.05, 0, 0.44], [0.05, 0, 0.44], [0.05, 0, 0.54], [-0.05, 0, 0.54]], 0, 1); quad([[0, -0.05, 0.44], [0, 0.05, 0.44], [0, 0.05, 0.54], [0, -0.05, 0.54]], 0, 1);   // the ball end
  for (let g = 0; g < 2; g++) for (const x of [-0.10, 0.10]) quad([[x, -0.03, -0.50], [x, 0.03, -0.50], [x, 0.03, 0], [x, -0.03, 0]], 1, 0, g * 3 + (x > 0 ? 1 : 0));
  quad([[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]], 2);
  quad([[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]], 3);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 3));
  g.setIndex(idx);
  return g;
}

// ---- ground mist: soft cards lying in the reeds, torn off downwind when the gust front passes ----
const MIST_VERT = /* glsl */`
attribute vec4 aI;
varying vec2 vUv; varying vec3 vW; varying float vA;
void main(){
  float front = uFront + 40. * (vn(aI.xy / 60.) * 2. - 1.);
  float tear = uGust * smoothstep(-20., 140., front - aI.y);
  vec3 c = vec3(aI.x + sin(uTime * .05 + aI.w * 9.) * 6., 2.2 + aI.w * 1.6, aI.y + uTime * .8 + tear * tear * 260.);
  vec2 sz = vec2(aI.z * (1. + .7 * tear), aI.z * .16 * (1. - .5 * tear));
  vW = c + vec3(position.x * sz.x, position.y * sz.y, 0.);
  vUv = position.xy; 
  float dist = length(c - uCam);
  vA = (1. - tear) * (1. - tear) * smoothstep(aI.z * .6 + 10., aI.z * .6 + 60., dist) * exp(-dist * uFogK * .5);
  vA *= mix(1., .14, smoothstep(6., 26., uCam.y));              // from above a card is a veil, never a white lid
  // no card stands between us and the Maelzel while it is far off: its foot is dark against the mist, not lost in it
  vec2 hv = vec2(0., HZ) - uCam.xz; float hD = max(length(hv), 1.); hv /= hD;
  vec2 cv = c.xz - uCam.xz; float lane = 50. * max(dot(cv, hv), 0.) / hD + .55 * sz.x;
  vA *= mix(1., smoothstep(lane, lane * 1.7 + 8., abs(cv.x * hv.y - cv.y * hv.x)), smoothstep(200., 450., hD));
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const MIST_FRAG = /* glsl */`
uniform float uMistCards;
varying vec2 vUv; varying vec3 vW; varying float vA;
void main(){
  float e = (1. - vUv.x * vUv.x) * (1. - vUv.y * vUv.y);
  float n = fbm(vec2(vW.x * .04 + uTime * .02, vW.y * .3 + vW.z * .01));
  float a = e * smoothstep(.2, .75, n + e * .3) * vA * uMistCards * .9;
  gl_FragColor = vec4(uMistCol * a, a);
}`;

// ---- geometry for one near reed (18 triangles) and its overlay (ripple ring, glint star, mirrored wand) ----
function reedGeometries() {
  const pos = [], nor = [], pa = [];
  const a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), n3 = new THREE.Vector3();
  const tri = (A, B, C, PA, N = null) => {
    if (N) n3.set(N[0], N[1], N[2]); else { a3.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); b3.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]); n3.crossVectors(a3, b3).normalize(); }
    for (const P of [A, B, C]) { pos.push(P[0], P[1], P[2]); nor.push(n3.x, n3.y, n3.z); pa.push(PA[0], PA[1], PA[2]); }
  };
  const f = 0.13, ap = [0, 0.25, 0], cs = [[-f, 0, -f], [f, 0, -f], [f, 0, f], [-f, 0, f]];
  for (let i = 0; i < 4; i++) tri(cs[(i + 1) % 4], cs[i], ap, [0, 0, 0]);                 // the pyramid foot
  tri([-1, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1], [0, 0, 1]); tri([-1, 0, 0], [1, 1, 0], [-1, 1, 0], [1, 1, 1], [0, 0, 1]);   // the wand
  const bx = 0.085, by = 0.10, eq = [[bx, 0, 0], [0, 0, bx], [-bx, 0, 0], [0, 0, -bx]];
  for (let i = 0; i < 4; i++) {                                                          // the faceted bob
    tri(eq[i], [0, by, 0], eq[(i + 1) % 4], [1, 2, 2]);
    tri(eq[(i + 1) % 4], [0, -by, 0], eq[i], [1, 2, 2]);
  }
  tri([-0.05, 0.04, 0], [0.05, 0.04, 0], [0, -0.13, 0], [1, 3, 3], [0, 0, 1]);            // the wedge weight
  tri([0, 0.04, -0.05], [0, 0.04, 0.05], [0, -0.13, 0], [1, 3, 3], [1, 0, 0]);
  tri([-0.035, 0, 0.03], [0.035, 0, 0.03], [0, 1, 0.03], [0.18, 4, 4], [0, 0, 1]);        // blank blades, like sedge
  tri([-0.035, 0, -0.04], [0.035, 0, -0.04], [0, 0.8, -0.04], [0.84, 4, 4], [0, 0, 1]);
  tri([-0.03, 0, 0.06], [0.03, 0, 0.06], [0, 0.62, 0.06], [0.36, 4, 4], [0, 0, 1]);
  tri([-0.03, 0, -0.07], [0.03, 0, -0.07], [0, 0.7, -0.07], [0.66, 4, 4], [0, 0, 1]);
  // sedge round the foot: eight wider blades of unequal height standing up to 0.6 m from it, so a bed has body at eye level
  const sb = [[-0.52, 0.10, 0.07, 0.92, 0.30], [0.47, -0.16, 0.06, 0.74, 0.72], [-0.24, 0.22, 0.055, 0.55, 0.58], [0.26, 0.26, 0.065, 1.0, 0.40],
    [-0.40, -0.24, 0.06, 0.66, 0.78], [0.60, 0.05, 0.05, 0.48, 0.22], [-0.10, -0.30, 0.07, 0.86, 0.50], [0.12, 0.34, 0.05, 0.40, 0.64]];
  for (const [x, z, w, h, ln] of sb) tri([x - w, 0, z], [x + w, 0, z], [x + (ln - 0.5) * 0.25, h, z], [ln, 4, 4], [0, 0, 1]);
  const solid = new THREE.InstancedBufferGeometry();
  solid.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  solid.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  solid.setAttribute('aPA', new THREE.Float32BufferAttribute(pa, 3));
  const op = [], opa = [], oi = [];
  const quad = (y0, kind) => {
    const b = op.length / 3;
    op.push(-1, y0, 0, 1, y0, 0, 1, 1, 0, -1, 1, 0);
    for (let i = 0; i < 4; i++) opa.push(1, 0, kind);
    oi.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  quad(0, 6); quad(-1, 4); quad(-1, 5);
  const over = new THREE.InstancedBufferGeometry();
  over.setAttribute('position', new THREE.Float32BufferAttribute(op, 3));
  over.setAttribute('aPA', new THREE.Float32BufferAttribute(opa, 3));
  over.setIndex(oi);
  return { solid, over };
}
function padGeometries() {
  const pos = [], k = [];
  const N = 9, a0 = 0.35, span = Math.PI * 2 - 0.7;
  for (let i = 0; i < N; i++) {
    const a = a0 + span * i / N, b = a0 + span * (i + 1) / N;
    pos.push(0, 0, 0, Math.cos(b), 0, Math.sin(b), Math.cos(a), 0, Math.sin(a));
    for (let j = 0; j < 3; j++) k.push(0, 0, 0);
  }
  const pad = new THREE.InstancedBufferGeometry();
  pad.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  pad.setAttribute('aK', new THREE.Float32BufferAttribute(k, 3));
  const bp = [], bk = [];
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 6; i++) {
    const yaw = (i + ring * 0.5) / 6 * Math.PI * 2, tip = ring ? 0.72 : 1;
    bp.push(-1, 0, 0, 1, 0, 0, 0, 0, 0); bk.push(1, 0, yaw, 1, 0, yaw, 1, tip, yaw);
  }
  const bud = new THREE.InstancedBufferGeometry();
  bud.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  bud.setAttribute('aK', new THREE.Float32BufferAttribute(bk, 3));
  return { pad, bud };
}
// split instances into bands along z so whole bands behind the camera are culled; returns the meshes
async function bandMeshes(ctx, geo, mat, items, stride, attrs, bandLen, yMax, order = 0) {
  const bands = new Map();
  for (let i = 0; i < items.length; i += stride) {
    const b = Math.floor(items[i + 1] / bandLen);
    if (!bands.has(b)) bands.set(b, []);
    bands.get(b).push(i);
  }
  const out = [];
  for (const [b, list] of bands) {
    const g = new THREE.InstancedBufferGeometry();
    g.index = geo.index; for (const name of Object.keys(geo.attributes)) g.setAttribute(name, geo.attributes[name]);
    let minX = 1e9, maxX = -1e9, o = 0;
    for (const [name, size, off] of attrs) {
      const arr = new Float32Array(list.length * size);
      for (let j = 0; j < list.length; j++) for (let c = 0; c < size; c++) arr[j * size + c] = items[list[j] + off + c];
      g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
    }
    for (const i of list) { minX = Math.min(minX, items[i]); maxX = Math.max(maxX, items[i]); }
    g.instanceCount = list.length;
    const cz = (b + 0.5) * bandLen, cx = (minX + maxX) / 2;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 0, cz), Math.hypot((maxX - minX) / 2 + 6, bandLen / 2 + 6, yMax));
    const m = new THREE.Mesh(g, mat); m.renderOrder = order; out.push(m); o++;
    await ctx.yield();
  }
  return out;
}

const WEATHERS = {
  // zenith, horizon, slate, sun, fog colour, mist colour, [fogK at entry, fogK after the gust], ground mist, clear, frost
  silver: { zen: '#9FB4BE', hor: '#DCE6EA', slate: '#3E5560', sun: '#FFF0D2', fog: '#B4C2C9', mist: '#C3CED3', fogK: [0.0016, 0.0005], mist0: 0.010, clear: 0, frost: 0, tear: '#F4DCA8' },
  frost: { zen: '#6A8FBA', hor: '#E8CDBE', slate: '#3F5470', sun: '#FFD6A6', fog: '#B3AEBB', mist: '#C4BDC6', fogK: [0.0011, 0.0004], mist0: 0.005, clear: 1, frost: 1, tear: '#F3DCC0' },
  mist: { zen: '#B3C1C7', hor: '#E1E8EA', slate: '#4A5F69', sun: '#FFF4E0', fog: '#C4CED2', mist: '#CCD5D8', fogK: [0.0052, 0.0009], mist0: 0.022, clear: 0, frost: 0, tear: '#F2DDB0' },
};
const TEMPI = { andante: [2, 120], largo: [3, 180], allegretto: [1.3, 80] };

export default {
  id: 'tempo-fen',
  name: 'The Tempo Fen',
  category: 'bizarre',
  weirdness: 0.85,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- every seeded choice, drawn first and in a fixed order ----
    const wRoll = rng(), tRoll = rng();
    let weatherName = wRoll < 0.46 ? 'silver' : wRoll < 0.74 ? 'frost' : 'mist';
    if (vary.hour === 'dawn') weatherName = 'frost'; else if (vary.hour === 'day') weatherName = wRoll < 0.6 ? 'silver' : 'mist';
    const golden = vary.hour === 'golden';
    const tempoName = tRoll < 0.5 ? 'andante' : tRoll < 0.76 ? 'largo' : 'allegretto';
    const roostCount = clamp(Math.round(rng.range(0, 7) * density), 0, 7);
    const haveFlies = rng.chance(0.78), fullFlower = rng.chance(0.35), second = rng.chance(0.3), rare = !!vary.rare;
    const layoutSeed = rng.range(0, 1000);
    const W = WEATHERS[weatherName], [beat, spacing] = TEMPI[tempoName];
    const rTile = rng.fork('tile'), rReed = rng.fork('reeds'), rPad = rng.fork('pads'), rCast = rng.fork('cast');
    const sunDir = new THREE.Vector3(0.975, golden ? 0.15 : 0.21, -0.06).normalize();
    const C = (h) => new THREE.Color(h);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C(W.fog), W.fogK[0]);
    await ctx.yield();

    // ---- the Maelzel ----
    const hero = await buildHero(ctx, { palette: PALETTE, sunDir: sunDir.toArray(), keySide: -1, duration: DURATION, beat,
      lineSpacing: spacing, lineSpeed: spacing / beat, reflection: 0.62, downwind: [0, 1] });
    hero.object.position.set(0, 0, HZ); hero.object.rotation.y = Math.PI;
    scene.add(hero.object);
    hero.setSky(W.zen, W.hor, W.slate); hero.setSun(sunDir, golden ? '#FFD9A0' : W.sun);
    await ctx.yield();
    const metal = { mahogany: ['#C9A04A', '#8FA3AD', '#5A2A1C'], ebony: ['#C2C8CC', '#77858F', '#1E1B20'], pearwood: ['#C27A48', '#8FA3AD', '#7A5030'] }[hero.cabinet] || ['#C9A04A', '#8FA3AD', '#5A2A1C'];
    let second2 = null;
    if (second) {
      // a second Maelzel, 60 m tall, far to starboard, beating three against two
      second2 = await buildHero(ctx, { palette: PALETTE, sunDir: sunDir.toArray(), keySide: -1, duration: DURATION, beat: beat * 2 / 3,
        lineSpacing: spacing, lineSpeed: spacing / beat, reflection: false, cabinet: hero.cabinet === 'ebony' ? 'mahogany' : 'ebony' });
      second2.object.scale.setScalar(60 / 140); second2.object.position.set(-250, 0, 930); second2.object.rotation.y = Math.PI * 0.86;
      scene.add(second2.object);
      second2.setSky(W.zen, W.hor, W.slate); second2.setSun(sunDir, golden ? '#FFD9A0' : W.sun);
      await ctx.yield();
    }

    // ---- uniforms shared by everything the world draws itself ----
    const HU = hero.uniforms;
    const tile = await buildTile(ctx, rTile);
    const FU = {
      uZen: HU.uZen, uHor: HU.uHor, uSlate: HU.uSlate, uSunCol: HU.uSunCol, uSunDir: HU.uSunDir, uDarkCol: HU.uDarkCol,
      uDownwind: HU.uDownwind, uMirror: { value: 1 }, uDim: { value: 1 }, uWaterY: { value: 0 }, uHeroInv: { value: new THREE.Matrix4() },
      uTile: { value: tile.tex }, uT: { value: 0 }, uTime: { value: 0 }, uU: { value: 0 }, uFront: { value: -300 }, uGust: { value: 1 },
      uLull: { value: 1 }, uCross: { value: 0 }, uBeat: { value: beat }, uSpacing: { value: spacing }, uBand: { value: new THREE.Vector3(Math.cos(Math.min(6.2832 * 20 / spacing, 1.5)), Math.cos(6.2832 * 8 / spacing), tempoName === 'largo' ? 0.7 : 0) }, uFogK: { value: W.fogK[0] },
      uMist: { value: W.mist0 }, uPxAng: { value: 0.002 }, uFrost: { value: W.frost }, uSwingAmp: { value: 1 },
      uCam: { value: new THREE.Vector3() }, uFogCol: { value: C(W.fog) }, uMistCol: { value: C(W.mist) },
      uBrass: { value: C(metal[0]) }, uGold: { value: C(golden ? '#FFB85C' : '#FFC46C').multiplyScalar(W.clear ? 0.5 : 1) }, uGlint: { value: hero.cabinet === 'ebony' ? C('#EBCB86') : C(metal[0]).lerp(C(golden ? '#FFD9A0' : W.sun), 0.22) }, uSteel: { value: C(metal[1]) }, uFoot: { value: C(metal[2]) }, uPadCol: { value: C('#5E7F6A') },
      uTear: { value: W.clear ? 0.35 : 1 }, uClear: { value: W.clear }, uTearCol: { value: C(W.tear).multiplyScalar(W.clear ? 0.84 : 0.97) },
      uPeat: { value: C('#141C1F') }, uMirrorZone: { value: 1 }, uLoom: { value: 1 }, uBloomAll: { value: fullFlower ? 1 : 0 }, uMistCards: { value: 1 },
      uSquad: { value: new THREE.Vector3(0, 60, 0) }, uSquadDir: { value: new THREE.Vector4(0, 0, 1, 0) },
    };
    if (golden) { FU.uFogCol.value.lerp(C('#D8C4A8'), 0.35); FU.uMistCol.value.lerp(C('#E2CFB2'), 0.35); FU.uTearCol.value.set('#E8CFA0'); }
    // the Maelzel takes the scene fog: a blue-grey a step darker than the sky behind it, so its ghost reads as a wedge
    scene.fog.color.copy(FU.uFogCol.value).lerp(C(W.clear ? '#3A4A78' : W.slate), W.clear ? 0.62 : 0.66);
    const mk = (vert, frag, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...FU }, vertexShader: GLSL_COMMON + FEN_GLSL + vert,
      fragmentShader: GLSL_COMMON + FEN_GLSL + frag, ...extra });
    const premult = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };

    // ---- sky and water ----
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mk(SKY_VERT, SKY_FRAG, { side: THREE.BackSide, depthWrite: false }));
    sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
    const waterGeo = new THREE.PlaneGeometry(9000, 9000, 1, 1); waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, mk(WATER_VERT, WATER_FRAG, { transparent: true, depthWrite: false }));
    water.position.set(0, 0, 600); water.renderOrder = 1; water.frustumCulled = false; scene.add(water);
    await ctx.yield();

    // ---- reeds: near ones as geometry, the rest as clump cards ----
    const feet = hero.anchors.feet.map((f) => [-f.x, HZ - f.z]);
    const blocked = (x, z, r) => {
      for (const f of feet) if (Math.hypot(x - f[0], z - f[1]) < r) return true;
      if (second && Math.hypot(x + 250, z - 930) < 22) return true;
      if (Math.abs(z - HZ) < 34 && Math.abs(Math.abs(x) - 32) < 5) return true;          // the case walls
      if (z > HZ + 24 && z < HZ + 40 && Math.abs(x) < 36) return true;                     // the back wall
      if (Math.abs(z - (HZ - 32)) < 5 && Math.abs(x) > 17 && Math.abs(x) < 36) return true;  // the front wall either side of the opening
      for (const lz of [HZ - 21.6, HZ - 7.5]) if (Math.hypot(Math.abs(x) - 13, z - lz) < r - 1) return true;   // the A-frame legs
      if (Math.abs(z - (HZ + 9.5)) < 3.2 + r * 0.3 && Math.abs(Math.abs(x) - 19.2) < 9.5) return true;        // the two low wheels beside the ring
      return false;
    };
    const heightAt = (x, z, r) => {
      const g = tile.cellHash(x, z), av = smoothstep(900, 990, z);
      return lerp(1.5 + 2.5 * (0.35 * r + 0.65 * g), 3.5 + 0.6 * r, av);
    };
    const near = [];
    const NEAR = 6000;
    for (let tries = 0; tries < 90000 && near.length < NEAR * 5; tries++) {
      const z = -14 + (HZ + 30) * rReed(), sd = rReed() < 0.5 ? -1 : 1, q = rReed(), hw = chanHalf(z);
      const x = pathX(z) + sd * (hw + 0.2 + 9.6 * q * Math.sqrt(q)), ra = rReed(), rb = rReed(), rh = rReed();
      if (tile.reedDens(x, z) > 0.5 && !blocked(x, z, 5.5) && Math.abs(x - pathX(z)) > 4.6) near.push(x, z, heightAt(x, z, rh), ra, rb);
      if (tries % 500 === 499) await ctx.yield();
    }
    await ctx.yield();
    const RG = reedGeometries();
    const reedMat = mk(REED_VERT, REED_FRAG, { side: THREE.DoubleSide });
    const reedOvMat = mk(REEDOV_VERT, REEDOV_FRAG, { ...premult, side: THREE.DoubleSide });
    const cardMat = mk(CARD_VERT, CARD_FRAG, { ...premult, side: THREE.DoubleSide });
    const reedAttrs = [['aI', 4, 0], ['aJ', 1, 4]];
    await ctx.yield();
    for (const m of await bandMeshes(ctx, RG.solid, reedMat, near, 5, reedAttrs, 150, 5)) scene.add(m);
    await ctx.yield();
    for (const m of await bandMeshes(ctx, RG.over, reedOvMat, near, 5, reedAttrs, 150, 5, 2)) scene.add(m);
    await ctx.yield();
    const cards = [];
    const CARDS = Math.round(30000 * clamp(detail, 0.5, 1) * (0.85 + 0.15 * density));
    for (let tries = 0; tries < 160000 && cards.length < CARDS * 4; tries++) {
      const z = -60 + 1640 * rReed(), sd = rReed() < 0.5 ? -1 : 1, q = rReed(), hw = chanHalf(z), rh = rReed(), ra = rReed();
      const r = Math.max(hw + 2.6, 6.4) + 46 * (Math.exp(q * Math.log(1 + 430 / 46)) - 1);
      const x = pathX(clamp(z, 0, HZ)) + sd * r;
      if (tile.reedDens(x, z) > 0.45 && !blocked(x, z, 7)) cards.push(x, z, heightAt(x, z, rh) * (r > 60 ? 1.1 : 1), ra);
      if (tries % 500 === 499) await ctx.yield();
    }
    const cardGeo = new THREE.InstancedBufferGeometry();
    cardGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    cardGeo.setIndex([0, 1, 2, 0, 2, 3]);
    await ctx.yield();
    for (const m of await bandMeshes(ctx, cardGeo, cardMat, cards, 4, [['aI', 4, 0]], 200, 6, 3)) scene.add(m);
    await ctx.yield();

    // ---- lily pads and buds ----
    const pads = [], buds = [];
    const PADS = Math.round(2200 * detail * density);
    for (let tries = 0; tries < 40000 && pads.length < PADS * 4; tries++) {
      const kind = rPad(), a = rPad(), b = rPad(), rr = rPad(), hh = rPad(), bb = rPad();
      let x, z;
      if (kind < 0.5) { z = -20 + (HZ + 10) * a; x = pathX(z) + (b * 2 - 1) * (kind < 0.3 ? 9 : 40); }
      else if (kind < 0.8) { const an = a * 6.283, r0 = Math.sqrt(b) * LAGOON_R; x = Math.cos(an) * r0; z = LAGOON_Z + Math.sin(an) * r0 / 0.62; }
      else { x = (a * 2 - 1) * 42; z = HZ - 60 + b * 105; }
      if (tile.reedDens(x, z) > 0.12 || blocked(x, z, 4)) continue;
      const rad = 0.25 + 0.55 * rr * rr + (kind >= 0.5 ? 0.12 : 0);
      pads.push(x, z, rad, hh);
      if (bb < (kind >= 0.5 && kind < 0.8 ? 0.3 : 0.125)) buds.push(x, z, rad, hh);
      if (tries % 500 === 499) await ctx.yield();
    }
    await ctx.yield();
    // the entry bay and the first 125 m of channel: pads crowd the lower third of the opening frames
    for (let i = 0; i < Math.round(150 * Math.max(detail, 0.7)); i++) {
      const a = rPad(), b = rPad(), rr = rPad(), hh = rPad(), bb = rPad();
      const z = 3 + 125 * a * a, x = pathX(z) + (b * 2 - 1) * 4.4;
      if (tile.reedDens(x, z) > 0.12) continue;
      const rad = 0.3 + 0.6 * rr * rr;
      pads.push(x, z, rad, hh); if (bb < 0.16) buds.push(x, z, rad, hh);
    }
    await ctx.yield();
    const PG = padGeometries();
    // pads are drawn after the water plane (which writes no depth), so they can never z-fight it at a grazing view
    const padMat = mk(PAD_VERT, PAD_FRAG, { side: THREE.DoubleSide, transparent: true });
    for (const m of await bandMeshes(ctx, PG.pad, padMat, pads, 4, [['aI', 4, 0]], 300, 2, 1.4)) scene.add(m);
    await ctx.yield();
    for (const m of await bandMeshes(ctx, PG.bud, padMat, buds, 4, [['aI', 4, 0]], 600, 2, 1.5)) scene.add(m);
    await ctx.yield();

    // ---- stand-herons: the strider at the entry, two in the lagoon, two on the threshold, the rest roosting ----
    const toWorld = (v) => new THREE.Vector3(-v.x, v.y, HZ - v.z);
    const roosts = [new THREE.Vector3(36.5, 0, HZ - 37), new THREE.Vector3(-36.5, 0, HZ - 37), toWorld(hero.anchors.roosts[5]), toWorld(hero.anchors.roosts[6]),
      new THREE.Vector3(6.6, 0, 905), new THREE.Vector3(-6.7, 0, 990), new THREE.Vector3(6.8, 0, 1068)];
    // the strider's stand, per seed: the first of these spots where the water is clear of tussocks, both round where it
    // paces and along the lines of sight to its feet as we arrive (no random draws: the seed's tile decides); if none
    // is clear, the clearest
    const striderReeds = (hx, hz) => {
      let worst = 0;
      for (let i = 0; i <= 5; i++) {
        const wk = -0.8 + i * 0.76, fx = hx + wk, fz = hz + Math.sin(clamp(wk, 0, 2.2) * 0.9) * 0.4;
        for (const dz of [-1.2, 0, 1.2]) worst = Math.max(worst, tile.reedDens(fx, fz + dz));
        if (i > 0 && i < 5) for (const zc of [16, 24, 32]) for (let k = 6; k < 20; k++) worst = Math.max(worst, tile.reedDens(lerp(pathX(zc), fx, k / 20), lerp(zc, fz, k / 20)));
      }
      return worst;
    };
    let striderAt = [-6.9, 45], striderBest = 9;
    for (const hz of [45, 49, 41, 53, 37]) for (const hx of [-6.9, -6.2, -5.6, -5.2]) {
      const sc = striderReeds(hx, hz);
      if (striderBest > 0.3 && sc < striderBest) { striderBest = sc; striderAt = [hx, hz]; }
    }
    const herons = [
      // the strider: in the open channel off the starboard bow, tall enough for its head to stand against the mist
      { role: 'stride', x: striderAt[0], z: striderAt[1], y: 0, head: 0.1, ph: rCast() * 6, sc: 1.6 },
      // the two that lift off the lagoon and cross the bow from starboard to port
      { role: 'fly', x: -7, z: 684.4, y: 0, head: 2.3, ph: rCast() * 6, u0: 0.566, sc: 1.5 },
      { role: 'fly', x: -11, z: 707.7, y: 0, head: 2.0, ph: rCast() * 6, u0: 0.588, sc: 1.5 },
      // the two on the threshold: either side of the avenue 86 m out, whole in frame with their fans up until we pass between them at u 0.915
      { role: 'gate', x: 6.6, z: HZ - 86, y: 0, head: -2.8, ph: rCast() * 6, sc: 1.6 },
      { role: 'gate', x: -5.0, z: HZ - 84, y: 0, head: 2.8, ph: rCast() * 6, sc: 1.6 },
    ];
    // three that wait beside the route (no seeded draws: their phases are fixed): one fishing in the starboard bay at
    // z 201 that shakes its fan out at us as we pass (u 0.16), one in profile in the port bay before the avenue
    // (u 0.79), one in the avenue that opens its fan at u 0.88
    herons.push({ role: 'show', x: BAY2_X + 5.9, z: 201.9, y: 0, head: 2.53, ph: 1.7, from: 0.128, to: 0.215 },
      { role: 'watch', x: 5.7, z: 937.5, y: 0, head: -Math.PI / 2, ph: 4.1, at: 0.79, sc: 1.3 },
      { role: 'show', x: -6.9, z: 1062, y: 0, head: Math.PI * 0.94, ph: 3.3, from: 0.845, to: 0.93, sc: 1.5 });
    const roostOrder = rCast.shuffle ? rCast.shuffle(roosts.map((_, i) => i)) : roosts.map((_, i) => i);
    for (let i = 0; i < Math.min(roostCount, 5); i++) {
      const r = roosts[roostOrder[i]];
      herons.push({ role: 'roost', x: r.x, y: r.y, z: r.z, head: Math.PI + (rCast() - 0.5) * 1.6, ph: rCast() * 6 });
    }
    const HN = herons.length, heronGeo = heronGeometry();
    const iA = new THREE.InstancedBufferAttribute(new Float32Array(HN * 4), 4), iB = new THREE.InstancedBufferAttribute(new Float32Array(HN * 4), 4);
    const iC = new THREE.InstancedBufferAttribute(new Float32Array(HN * 3), 3);
    iA.setUsage(THREE.DynamicDrawUsage); iB.setUsage(THREE.DynamicDrawUsage); iC.setUsage(THREE.DynamicDrawUsage);
    heronGeo.setAttribute('iA', iA); heronGeo.setAttribute('iB', iB); heronGeo.setAttribute('iC', iC);
    heronGeo.instanceCount = HN;
    const heronMesh = new THREE.Mesh(heronGeo, mk(HERON_VERT, HERON_FRAG, { side: THREE.DoubleSide }));
    heronMesh.frustumCulled = false; scene.add(heronMesh);
    await ctx.yield();

    // ---- fork-flies: the squadron of nine always; the ones that live on the fen by seed ----
    const FLIES = haveFlies ? Math.round(240 * detail * density) : 0;
    const fI = new Float32Array((FLIES + 9) * 4), fS = new Float32Array(FLIES + 9);
    for (let i = 0; i < FLIES + 9; i++) {
      const a = rCast(), b = rCast(), c = rCast(), d = rCast();
      let x, y, z;
      if (i < 9) { x = 0; y = 0; z = 0; fS[i] = i; } else {
        fS[i] = -1;
        if (a < 0.2) { x = (b < 0.5 ? -1 : 1) * (8 + Math.abs(b * 2 - 1) * 18); y = 46 + c * 38; z = HZ - 34 - d * 8; }   // crossing the Maelzel's face, high: above the frame once we are under the case
        else { z = 20 + (HZ - 60) * b; const sd = c < 0.5 ? -1 : 1; x = pathX(z) + sd * (17 + 70 * d * d); y = 2.2 + 5 * ((c * 2) % 1); }
      }
      fI.set([x, y, z, rCast()], i * 4);
    }
    const flyGeo = flyGeometry();
    flyGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(fI, 4)); flyGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(fS, 1));
    flyGeo.instanceCount = FLIES + 9;
    const flyMesh = new THREE.Mesh(flyGeo, mk(FLY_VERT, FLY_FRAG, { ...premult, side: THREE.DoubleSide }));
    flyMesh.frustumCulled = false; flyMesh.renderOrder = 5; scene.add(flyMesh);

    // ---- ground mist cards ----
    const MIST = Math.round(60 * clamp(detail, 0.6, 1) * (weatherName === 'mist' ? 1.3 : 1));
    const mI = new Float32Array(MIST * 4);
    for (let i = 0; i < MIST; i++) {
      const z = 60 + 1050 * rCast(), sd = rCast() < 0.5 ? -1 : 1;
      mI.set([pathX(z) + sd * (22 + 130 * rCast()), z, 34 + 40 * rCast(), rCast()], i * 4);
    }
    const mistGeo = new THREE.InstancedBufferGeometry();
    mistGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    mistGeo.setIndex([0, 1, 2, 0, 2, 3]);
    mistGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(mI, 4)); mistGeo.instanceCount = MIST;
    const mistMesh = new THREE.Mesh(mistGeo, mk(MIST_VERT, MIST_FRAG, { ...premult, side: THREE.DoubleSide }));
    mistMesh.frustumCulled = false; mistMesh.renderOrder = 4; scene.add(mistMesh);
    await ctx.yield();

    // ---- the flight ----
    const pts = [];
    for (const z of [0, 30, 60, 100, 145, 190, 235, 280, 325, 370, 415, 460, 505, 550, 595, 640, 685, 730, 775, 820, 865, 910, 955, 1000, 1045, 1090, 1135, PORTAL_Z]) {
      pts.push([pathX(z) + 2.3 * smoothstep(35, 85, z) * (1 - smoothstep(110, 160, z)), pathY(z), z]);
    }
    const path = makePath(pts);
    // ---- (p2) pad rafts on the S and over the lagoon (the designer's rulings of 8 Oct 2026, 19:57, 20:05 and 21:43 UTC). The law
    // of the place: along the whole channel from the end of the entry's own patch (live's first 15 m, which stand as live dealt
    // them) to the lagoon's mouth (z 15 to 645) pads are dealt until the clear channel carries COVER of its
    // water under them, 20 in a hundred, one number for the whole S; then over the whole lagoon until its water carries
    // COVER_L, 28 in a hundred of its water (both thin with detail as live's pads do): the cover does not fall on the way to the lagoon
    // and is fullest in it. Where the pads already there reach the number, nothing is added. The new pads lie in rafts under
    // a LAW OF OPEN WATER: none is dealt where, with it, more than half of a lane 8.8 m wide would be closed at any slice.
    // On the S the lane is the clear channel round pathX; the lagoon is ruled into eleven such lanes side by side by x
    // alone, and again into lanes set half a lane over, so that all its water is under one law, no lane is named and no
    // lane's edge is a way round it. So each cover lands where the law lets it.
    // Said plainly: the two covers and the law are numbers on a whole water, not on what a still holds; nothing here reads
    // the lens, the clock or a seed. The round's one stream is forked from rPad after rPad's last live draw; nothing here
    // is pushed into live's arrays, and the new pads are drawn by a material of their own (PAD_VERT and PAD_FRAG under P2).
    const rP2 = rPad.fork('p2');
    const pads2 = [], buds2 = [];
    {
      const COVER = 0.20 * Math.max(detail, 0.7), CELL = 15, Z0 = 15, NC = 42, HALF = 4.4, STEP = 0.25;
      const AIR = Math.hypot(2.0, STEP / 2) + 0.005;                 // 2.0 m of true air from a line known every STEP metres (its samples lie up to 0.259 m apart)
      const ROCK = 1.166 * 0.10, S82 = Math.sin(82 * Math.PI / 180), C82 = Math.cos(82 * Math.PI / 180);
      // the flown line: live's own path at every 0.25 m of arc over its whole length, made once; and, for each metre of z,
      // the first and the last of its places lying in that metre (LN and -1 where none does)
      const LN = Math.ceil(path.length / STEP) + 1, lx = new Float64Array(LN), ly = new Float64Array(LN), lz = new Float64Array(LN), lp = new THREE.Vector3();
      const LM = Math.floor(PORTAL_Z) + 2, first = new Int32Array(LM).fill(LN), last = new Int32Array(LM).fill(-1);
      for (let i = 0; i < LN; i++) {
        path.posAtDist(Math.min(i * STEP, path.length), lp); lx[i] = lp.x; ly[i] = lp.y; lz[i] = lp.z;
        const m = clamp(Math.floor(lp.z), 0, LM - 1); first[m] = Math.min(first[m], i); last[m] = i;
        if (i % 800 === 799) await ctx.yield();
      }
      // the least air between the whole line and an upright drum of plan radius r and height h standing on the water at (x, z),
      // wherever that is under AIR. Only places of the line within r + AIR of the drum in plan can stand nearer than AIR,
      // so only the metres of z in that reach are walked: when none of them is nearer, the answer is some number not under AIR
      const airOf = (x, z, r, h) => {
        let best = 1e9, i0 = LN, i1 = -1;
        for (let m = clamp(Math.floor(z - r - AIR), 0, LM - 1); m <= clamp(Math.floor(z + r + AIR), 0, LM - 1); m++) { i0 = Math.min(i0, first[m]); i1 = Math.max(i1, last[m]); }
        for (let i = i0; i <= i1; i++) {
          const dx = lx[i] - x, dz = lz[i] - z, dh = Math.max(Math.sqrt(dx * dx + dz * dz) - r, 0), dv = Math.max(ly[i] - h, 0), d = dh * dh + dv * dv;
          if (d < best) best = d;
        }
        return Math.sqrt(best);
      };
      // a cell of the clear channel's water: 15 m of z, |x - pathX(z)| under 4.4 m, reed density under 0.12
      const cellOf = (x, z) => (z >= Z0 && z < Z0 + NC * CELL && Math.abs(x - pathX(z)) < HALF && tile.reedDens(x, z) < 0.12 ? Math.floor((z - Z0) / CELL) : -1);
      // THE LAW OF OPEN WATER. A book of lanes 2 * HALF wide lying side by side, 2 * side + 1 of them, the middle one centred
      // on cen(z), kept at every slice of z a STEP apart from zA to zB: for each slice and lane, the stretches of the lane's
      // width that pads close there, as pairs [a, b] of x that never overlap. A pad of radius r at (x, z0) closes, at the
      // slice z, the chord from x - c to x + c with c = sqrt(r * r - (z - z0) * (z - z0)), cut to the lane
      const lanes = (zA, zB, side, cen) => {
        const n = Math.round((zB - zA) / STEP) + 1;
        return { zA, n, side, cen, iv: Array.from({ length: n * (2 * side + 1) }, () => []) };
      };
      // half a lane's width, a centimetre inside it (said plainly: a margin of arithmetic on every lane, the same at every
      // place). The law is asked of the very numbers the meshes carry: a new pad's x, z and radius are rounded to 32 bits
      // (Math.fround) BEFORE any test, and live's are entered as rounded, so the book and the drawn pads hold the same chords
      const OPEN = HALF - 0.01;
      // asks the law of a book for a pad: false if, at any slice where the pad's own chord reaches a lane, the closed width
      // of that lane with it (the union of the stretches, overlaps counted once) would be more than OPEN. A pad none of
      // whose chords reaches a lane is not refused. With `enter` nothing is asked: the pad's chords are written in
      const lawOf = (B, x, z, rad, enter) => {
        for (let k = Math.max(Math.ceil((z - rad - B.zA) / STEP), 0); k < B.n && B.zA + k * STEP < z + rad; k++) {
          const zs = B.zA + k * STEP, c = Math.sqrt(Math.max(rad * rad - (zs - z) * (zs - z), 0)), px = B.cen(zs);
          for (let j = Math.max(Math.floor((x - c - px) / (2 * HALF) + 0.5), -B.side); j <= B.side && px + (2 * j - 1) * HALF < x + c; j++) {
            const iv = B.iv[k * (2 * B.side + 1) + j + B.side];
            let a = Math.max(x - c, px + (2 * j - 1) * HALF), b = Math.min(x + c, px + (2 * j + 1) * HALF), shut = b - a;
            if (b <= a) continue;
            if (enter) {
              for (let q = iv.length - 2; q >= 0; q -= 2) if (iv[q] <= b && iv[q + 1] >= a) { a = Math.min(a, iv[q]); b = Math.max(b, iv[q + 1]); iv.splice(q, 2); }
              iv.push(a, b);
            } else {
              for (let q = 0; q < iv.length; q += 2) shut += iv[q + 1] - iv[q] - Math.max(0, Math.min(b, iv[q + 1]) - Math.max(a, iv[q]));
              if (shut > OPEN) return false;
            }
          }
        }
        return true;
      };
      // the three books: the S's one lane round pathX, from z 3 to the furthest slice a pad of the S can lie across (2.6 m
      // and a radius past its last cell); the lagoon's eleven lanes by x alone, on its own axis x 0, from z 630 to 780; and
      // the lagoon's lanes again, thirteen of them set half a lane over, so that the law holds across a lane's edge too: with
      // both, no new pad leaves any 8.8 m of x at a slice more than a lane's half and a quarter shut (4.39 + 2.2 m)
      const SB = lanes(3, Z0 + NC * CELL + 3.5, 0, pathX), LB = lanes(630, 780, 5, () => 0), LB2 = lanes(630, 780, 6, () => HALF);
      // live's cover, cell by cell (live's array is read, never written), and every pad there is, so that no new pad lies on
      // another; live's pads are entered first in every book
      const cov = new Float64Array(NC), occ = [];
      let big = 0.8;                                                  // the largest radius of any pad, live's or the S's
      for (let i = 0; i < pads.length; i += 4) {
        const c = cellOf(pads[i], pads[i + 1]);
        if (c >= 0) cov[c] += Math.PI * pads[i + 2] * pads[i + 2];
        occ.push(pads[i], pads[i + 1], pads[i + 2]); big = Math.max(big, pads[i + 2]);
        const fx = Math.fround(pads[i]), fz = Math.fround(pads[i + 1]), fr = Math.fround(pads[i + 2]);   // as live's mesh carries them (read, never written)
        lawOf(SB, fx, fz, fr, true); lawOf(LB, fx, fz, fr, true); lawOf(LB2, fx, fz, fr, true);
        if (i % 2000 === 1996) await ctx.yield();
      }
      await ctx.yield();
      const TRIES = 16, PLACES = 10;                                   // rafts tried in one cell; places tried for one pad
      // one raft, by the same law on the S and over the lagoon: n pads within 2.6 m of its centre, thicker toward the centre;
      // it stops when its cell c has its cover. `plus` is live's own 0.12 on the radius of a lagoon pad, `wet` the water's
      // own tests at a pad's centre, cellAt and cv the cells and the cover of that water
      const raft = (cx, cz, n, plus, wet, cellAt, cv, c, want) => {
        const by = [], reach = 2.6 + 0.8 * (0.8 + plus + Math.max(big, 0.8 + plus));   // the pads already lying within reach of this raft
        for (let j = 0; j < occ.length; j += 3) if (Math.abs(occ[j] - cx) < reach && Math.abs(occ[j + 1] - cz) < reach) by.push(occ[j], occ[j + 1], occ[j + 2]);
        for (let k = 0; k < n && cv[c] < want; k++) {
          const rr = rP2(), hh = rP2(), bb = rP2(), rad = Math.fround(0.25 + 0.55 * rr * rr + plus);
          let x = 0, z = 0, free = false;
          for (let q = 0; q < PLACES && !free; q++) {
            const an = 6.2832 * rP2(), r0 = 2.6 * rP2();
            x = Math.fround(cx + Math.cos(an) * r0); z = Math.fround(cz + Math.sin(an) * r0); free = true;
            for (let j = 0; j < by.length && free; j += 3) {         // no two centres nearer than 0.8 of the sum of their radii
              const dx = x - by[j], dz = z - by[j + 1], s = 0.8 * (rad + by[j + 2]);
              if (dx * dx + dz * dz < s * s) free = false;
            }
          }
          // in this order: the water's own tests, a heron's stand as live deals it, 2.0 m of air over the rim at its greatest
          // rock, and the law of open water in every lane the pad lies across, of every book
          if (!free || !wet(x, z)) continue;
          if (herons.some((h) => Math.hypot(x - h.x, z - h.z) < 2.4)) continue;
          if (airOf(x, z, rad, ROCK * rad + 0.035) < AIR) continue;
          if (!lawOf(SB, x, z, rad) || !lawOf(LB, x, z, rad) || !lawOf(LB2, x, z, rad)) continue;
          pads2.push(x, z, rad, hh); occ.push(x, z, rad); by.push(x, z, rad);
          lawOf(SB, x, z, rad, true); lawOf(LB, x, z, rad, true); lawOf(LB2, x, z, rad, true);
          const cc = cellAt(x, z); if (cc >= 0) cv[cc] += Math.PI * rad * rad;
          // a bud on one in eight (the designer's word; live's own three in ten for the lagoon is not copied), but none whose
          // top (shut at 82 degrees, at the greatest rock) would stand within 2.0 m of the line
          if (bb < 0.125 && airOf(x, z, 0.42 * rad + 0.05, 0.42 * rad * S82 + 0.03 + 0.035 + ROCK * (0.42 * rad * C82 + 0.05)) >= AIR) buds2.push(x, z, rad, hh);
        }
      };
      // THE S: one number in every cell from z 15 to 645. It begins where the entry's own patch ends (the ruling of 21:43):
      // live's bay is topped up to the S's number by the S's own law, and where it already carries it nothing is added and
      // nothing is taken. Its ends are not softened: the cover is not to fall on the way to the lagoon (the ruling of
      // 20:05), whose own water begins inside the S's last cell
      // the S's water: live's own two tests, and from the patch's end on (z 15): no new pad's centre lies in the entry's own
      // patch, which stands as live dealt it (a raft centred just past z 15 would else lay a pad or two back into it)
      const want = COVER * CELL * 2 * HALF, wetS = (x, z) => z >= Z0 && !(tile.reedDens(x, z) > 0.12 || blocked(x, z, 4));
      for (let c = 0; c < NC; c++) {
        const z0 = Z0 + c * CELL;
        for (let t = 0; t < TRIES && cov[c] < want; t++) {
          // a raft's centre in the cell, within 3.4 m of pathX; 8 to 14 pads
          const a = rP2(), cz = z0 + CELL * rP2(), cx = pathX(cz) + (2 * a - 1) * 3.4;
          raft(cx, cz, 8 + Math.floor(7 * rP2()), 0, wetS, cellOf, cov, c, want);
          await ctx.yield();
        }
      }
      // THE LAGOON, raised with the S by the ruling of 20:05: the same rafts over its whole water by ONE cover number, drawn
      // from the same stream after the S's last draw. Its water is where live deals its own lagoon pads: inside the ellipse,
      // reed density under 0.12, not blocked. Cells 15 m square, seven across (x -52.5 to 52.5) and ten along (z 630 to 780)
      const COVER_L = 0.28 * Math.max(detail, 0.7), LX0 = -52.5, LZ0 = 630, NX = 7, NZ = 10;
      const inLagoon = (x, z) => Math.hypot(x, (z - LAGOON_Z) * 0.62) < LAGOON_R && tile.reedDens(x, z) < 0.12 && !blocked(x, z, 4);
      const cellL = (x, z) => (x >= LX0 && x < LX0 + NX * CELL && z >= LZ0 && z < LZ0 + NZ * CELL && inLagoon(x, z) ? Math.floor((x - LX0) / CELL) + NX * Math.floor((z - LZ0) / CELL) : -1);
      // a cell's water, counted once at the centre of each of its 225 square metres; and the cover it already has, from
      // every pad lying in the lagoon's water now: live's, and the S's new ones in its mouth
      const area = new Float64Array(NX * NZ), covL = new Float64Array(NX * NZ);
      for (let c = 0; c < NX * NZ; c++) {
        const x0 = LX0 + (c % NX) * CELL, z0 = LZ0 + Math.floor(c / NX) * CELL;
        for (let i = 0; i < CELL; i++) for (let j = 0; j < CELL; j++) if (inLagoon(x0 + i + 0.5, z0 + j + 0.5)) area[c]++;
        if (c % NX === NX - 1) await ctx.yield();
      }
      for (let j = 0; j < occ.length; j += 3) { const c = cellL(occ[j], occ[j + 1]); if (c >= 0) covL[c] += Math.PI * occ[j + 2] * occ[j + 2]; }
      await ctx.yield();
      for (let c = 0; c < NX * NZ; c++) {
        const x0 = LX0 + (c % NX) * CELL, z0 = LZ0 + Math.floor(c / NX) * CELL, wantL = COVER_L * area[c];
        if (area[c] < 20) continue;                                 // a cell with under 20 m2 of water is skipped
        for (let t = 0; t < TRIES && covL[c] < wantL; t++) {
          // a raft's centre anywhere in the cell's water: off it the raft is skipped, its two draws spent and the try with them
          const cx = x0 + CELL * rP2(), cz = z0 + CELL * rP2();
          if (!inLagoon(cx, cz)) continue;
          raft(cx, cz, 8 + Math.floor(7 * rP2()), 0.12, inLagoon, cellL, covL, c, wantL);
          await ctx.yield();
        }
      }
    }
    const padMat2 = mk('#define P2\n' + PAD_VERT, '#define P2\n' + PAD_FRAG, { side: THREE.DoubleSide, transparent: true });
    for (const m of await bandMeshes(ctx, PG.pad, padMat2, pads2, 4, [['aI', 4, 0]], 300, 2, 1.4)) scene.add(m);
    await ctx.yield();
    for (const m of await bandMeshes(ctx, PG.bud, padMat2, buds2, 4, [['aI', 4, 0]], 600, 2, 1.5)) scene.add(m);
    await ctx.yield();
    const downLook = new THREE.Vector3(), portLook = new THREE.Vector3(), goldLook = new THREE.Vector3(), heronLook = new THREE.Vector3(), heronAhead = new THREE.Vector3(), heroCentre = new THREE.Vector3(0, 60, HZ - 20), bobW = new THREE.Vector3(), camP = new THREE.Vector3(), camF = new THREE.Vector3();
    const size = new THREE.Vector2(), tmpV = new THREE.Vector3();
    const fogK = (u) => lerp(W.fogK[0], W.fogK[1], smoothstep(weatherName === 'mist' ? 0.24 : 0.1, weatherName === 'mist' ? 0.46 : 0.34, u));
    // the gust front: behind us until it passes the camera at u 0.24, then outruns the lines to reach the Maelzel at u 0.48
    const frontAt = (u) => (u < 0.2 ? lerp(-500, 150, u / 0.2) : u < 0.24 ? lerp(150, 300, (u - 0.2) / 0.04) : u < 0.25 ? lerp(300, 336, (u - 0.24) / 0.01)
      : u < 0.27 ? lerp(336, 400, (u - 0.25) / 0.02) : u < 0.48 ? lerp(400, HZ + 120, (u - 0.27) / 0.21) : HZ + 120 + (u - 0.48) * 4000);
    let T = 0, lastU = -1, lastTime = -1;
    const P = 2 * beat;

    function poseHerons(time, u) {
      for (let i = 0; i < HN; i++) {
        const h = herons[i];
        let x = h.x, y = h.y, z = h.z, head = h.head, stride = 0, neck = 0.3 + 0.3 * Math.sin(time * 0.5 + h.ph), fan = 0, fl = 0, flap = 0, strike = 0;
        const cyc = (time * 0.16 + h.ph) % 1;
        if (h.role === 'stride') {
          // paces 2.2 m across the channel's edge and back, in profile to the entry view, easing to a stop and turning at
          // each end; it stabs at the water once, as we come level with it
          const pa = (time * 0.42 + h.ph) * (Math.PI / 6), walk = 1.1 * (1 - Math.cos(pa)), vel = Math.sin(pa);
          x += walk; z += Math.sin(walk * 0.9) * 0.4; stride = walk * 3.4 + h.ph;
          head = Math.PI / 2 * (2 * smoothstep(-0.2, 0.2, vel) - 1);
          strike = 0.8 * smoothstep(0.026, 0.031, u) * (1 - smoothstep(0.036, 0.046, u)); neck = lerp(0.55 + 0.25 * Math.sin(time * 0.5 + h.ph), 1, strike);
        } else if (h.role === 'fly') {
          // n = hundredths of u since lift-off: an eased start, then a flat crossing at 45 degrees to our course, a little
          // slower than we are, so each crosses the bow from starboard and leaves by the port edge of the frame
          const n = Math.max(u - h.u0, 0) / 0.01, m = n < 1 ? 0.5 * n * n : n - 0.5;
          fan = smoothstep(h.u0 - 0.055, h.u0 - 0.012, u); neck = lerp(neck, 0.9, fan);
          fl = smoothstep(0, 0.9, n);
          x += 4 * m; z += 9.2 * m; y += 3.5 * smoothstep(0, 2.5, n) - 0.25 * Math.max(n - 3, 0);
          head = lerp(h.head, 0.72 + 0.04 * n, smoothstep(0, 0.9, n)); flap = time * 6.5 + h.ph;
          stride = 0.28 * smoothstep(0.5, 2.2, n);                   // (in flight this slot carries the bank: port wing down, belly to us)
          if (n <= 0) strike = 0.5 * smoothstep(0.80, 0.86, cyc) * (1 - smoothstep(0.90, 0.99, cyc)) * (1 - fan);
        } else if (h.role === 'show') {
          // strikes once as we come up, then shakes the desk out into its fan, facing us
          strike = 0.9 * smoothstep(h.from - 0.035, h.from - 0.022, u) * (1 - smoothstep(h.from - 0.016, h.from - 0.004, u));
          fan = smoothstep(h.from, h.from + 0.022, u) * (1 - smoothstep(h.to, h.to + 0.03, u)) * (0.92 + 0.08 * Math.sin(time * 1.9 + h.ph));
          neck = lerp(neck, 1, Math.max(fan, strike));
        } else if (h.role === 'watch') {
          // in profile, neck run out, stabbing at the water as we draw level
          const k = smoothstep(h.at - 0.05, h.at - 0.02, u);
          neck = lerp(neck, 0.95, k);
          strike = 0.75 * smoothstep(h.at - 0.008, h.at - 0.001, u) * (1 - smoothstep(h.at + 0.012, h.at + 0.03, u)) + 0.12 * k * Math.sin(time * 0.8 + h.ph);
        } else if (h.role === 'gate') {
          fan = smoothstep(0.862, 0.893, u) * (0.9 + 0.1 * Math.sin(time * 1.3 + h.ph)); neck = lerp(neck, 1, fan);
        } else {
          fan = 0.5 * smoothstep(0.6, 0.9, Math.sin(time * 0.23 + h.ph * 3));
          strike = 0.25 * smoothstep(0.84, 0.9, cyc) * (1 - smoothstep(0.92, 0.99, cyc));
        }
        iA.setXYZW(i, x, y, z, head); iB.setXYZW(i, stride, neck, fan, fl); iC.setXYZ(i, flap, strike, h.sc || 1);
      }
      iA.needsUpdate = true; iB.needsUpdate = true; iC.needsUpdate = true;
    }

    function update(dt, time, camera, u) {
      u = clamp(u ?? 0, 0, 1);
      // the metronome clock: free-running, pulled into phase with u * 46 while the flight advances
      const step = lastTime < 0 ? 0 : clamp(time - lastTime, 0, 0.25);
      if (lastU < 0 || Math.abs(u - lastU) > 0.02) T = u * DURATION;
      else if (u !== lastU) { const err = (((u * DURATION - T) % P) + P * 1.5) % P - P / 2; T += step * (1 + clamp(err * 1.5, -0.3, 0.3)); }
      else T += step;
      lastU = u; lastTime = time;
      const me = camera.matrixWorld.elements;                      // never camera.position: the portal camera's matrix is set directly
      camP.set(me[12], me[13], me[14]); camF.set(-me[8], -me[9], -me[10]);
      ctx.renderer.getDrawingBufferSize(size);
      const pm = camera.projectionMatrix.elements;
      FU.uPxAng.value = 2 / Math.max(pm[5], 0.05) / Math.max(size.y, 1);
      FU.uCam.value.copy(camP); FU.uT.value = T; FU.uTime.value = time; FU.uU.value = u;
      FU.uFront.value = frontAt(u);
      FU.uLull.value = 1 - smoothstep(0.55, 0.8, u);
      FU.uCross.value = rare ? smoothstep(0.33, 0.37, u) * (1 - smoothstep(0.50, 0.57, u)) : 0;
      const k = fogK(u);
      // only the Maelzel takes the scene fog: it stands clear and in its own colour on the horizon from the first frame.
      // It also looms: a tower over cold water stands taller at a distance than it is, settling to its true size by u 0.45
      // (its apparent size still only ever grows as we come up)
      FU.uFogK.value = k; scene.fog.density = lerp(Math.min(0.36 * k, 0.0007), k, smoothstep(0.05, 0.32, u));
      const loom = 1 + 0.3 * (1 - smoothstep(0.02, 0.45, u));
      hero.object.scale.setScalar(loom); FU.uLoom.value = loom;
      const torn = smoothstep(0.19, 0.27, u);
      FU.uMist.value = W.mist0 * lerp(1, weatherName === 'mist' ? 0.4 : 0.22, torn);
      hero.setTime(T); hero.setLock(smoothstep(0.3, 0.48, u)); hero.setFogK(k); hero.update(dt, time, camera);
      if (second2) { second2.setTime(T); second2.setLock(1); second2.setFogK(k); second2.update(dt, time, camera); }
      // the squadron of nine: falls in off the starboard bow in the lagoon and paces us for five seconds
      const pres = smoothstep(0.615, 0.66, u) * (1 - smoothstep(0.725, 0.77, u));
      const fx = camF.x, fz = camF.z, fl = Math.max(Math.hypot(fx, fz), 1e-3);
      // leader 8.5 m ahead and a little to port, heading 55 degrees across our bow, so every fork is seen side-on
      const Fx = fx / fl, Fz = fz / fl, Px = Fz, Pz = -Fx, Hx = Fx * 0.574 + Px * 0.819, Hz = Fz * 0.574 + Pz * 0.819;   // port = (fz, -fx)
      const slide = lerp(-3.0, -1.9, smoothstep(0.62, 0.76, u));   // the vee holds off the starboard bow, clear of the Maelzel, easing in a little
      tmpV.set(camP.x + Fx * 7.4 + Px * slide, camP.y - 0.75 - (1 - pres) * 6, camP.z + Fz * 7.4 + Pz * slide);
      const lead = (1 - pres) * 150;                                // they come in from far off the port bow and leave the same way
      FU.uSquad.value.set(tmpV.x + Hx * lead, Math.max(tmpV.y, 2.0), tmpV.z + Hz * lead);
      FU.uSquadDir.value.set(Hx, 0, Hz, pres);
      poseHerons(time, u);
    }

    await ctx.yield();
    // prime every uniform and instance buffer once, with a stand-in for the entry camera (looking +Z from the entry point)
    update(0, 0, { matrixWorld: new THREE.Matrix4().makeRotationY(Math.PI).setPosition(0, 3, 0), projectionMatrix: new THREE.Matrix4().makePerspective(-1, 1, 0.6, -0.6, 1, 100) }, 0);
    lastU = -1; lastTime = -1;

    return {
      scene, path, duration: DURATION,
      // hurry the link up the channel, hold the high pass a little, linger on the long look; 1 over the last tenth
      pace: (u) => 1 + 0.2 * smoothstep(0.10, 0.16, u) * (1 - smoothstep(0.28, 0.34, u)) - 0.12 * smoothstep(0.36, 0.40, u) * (1 - smoothstep(0.48, 0.53, u))
        - 0.22 * smoothstep(0.64, 0.69, u) * (1 - smoothstep(0.82, 0.88, u)),
      title: weatherName === 'frost' ? 'The Tempo Fen, Rimed' : weatherName === 'mist' ? 'The Tempo Fen in Mist' : 'The Tempo Fen',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 24, sway: 0.6, bank: 0.6 },
      pois: [
        { at: (time, u) => heroCentre.set(0, lerp(24, 60, smoothstep(0.5, 0.8, u ?? 0)), HZ - 20), from: 0.3, to: 0.85, weight: 0.5 },
        // the high pass looks down at the water 130 m ahead (holds the horizon in the upper third while we climb and glide)
        { at: (time, u) => { const zt = (u ?? 0) * 1207 + 130; return downLook.set(pathX(zt) * 0.6, -18, zt); }, from: 0.27, to: 0.55, fade: 0.22, weight: 0.55 },
        // low among the bobs: a look to port, the wands against the pale tear of sky
        { at: (time, u) => { const zt = (u ?? 0) * 1207 + 15; return portLook.set(pathX(zt) + 12 * (1 - smoothstep(0.07, 0.13, u ?? 0)), 2.6, zt); }, from: 0.04, to: 0.14, weight: 0.62 },   // (the look lets go gradually, from u 0.07 to 0.13)
        // half-way up the climb: a look to port along the lines of glitter, toward the gold light on the water
        { at: (time, u) => { const zt = (u ?? 0) * 1207; return goldLook.set(pathX(zt) + 150, -12, zt + 150); }, from: 0.285, to: 0.385, weight: 0.5 },
        // the heron that shakes its fan out in the starboard bay
        // While the bird is far the gaze leans on it; it stands 6 m abeam of the route, so from u 0.135 the target eases off
        // the bird onto a point 40 m away that holds 34 degrees to starboard of the way ahead (the bird slides out by the
        // right edge instead of dragging the gaze round with it), and from u 0.172 to 0.215 it eases back to dead ahead.
        { at: (time, u) => {
          const uu = u ?? 0, d = uu * path.length;
          path.posAtDist(d, heronLook); path.posAtDist(d + 24, heronAhead).sub(heronLook);            // the engine's own look-ahead
          const y0 = Math.atan2(heronAhead.x, heronAhead.z), p0 = Math.atan2(heronAhead.y, Math.max(Math.hypot(heronAhead.x, heronAhead.z), 1e-3));
          const s = smoothstep(0.135, 0.165, uu), k = 1 - smoothstep(0.172, 0.215, uu);
          let yaw = y0 - 0.593 * k, pitch = lerp(p0, -0.175, k);
          if (s < 1) {
            const hx = BAY2_X + 5.9 - heronLook.x, hy = 1.7 - heronLook.y, hz = Math.max(201.9 - heronLook.z, 1), hd = Math.hypot(hx, hz);
            yaw = lerp(Math.atan2(hx, hz), yaw, s); pitch = lerp(Math.atan2(hy, hd), pitch, s);
          }
          const c = Math.cos(pitch) * 40;
          return heronLook.set(heronLook.x + Math.sin(yaw) * c, heronLook.y + Math.sin(pitch) * 40, heronLook.z + Math.cos(yaw) * c);
        }, from: 0.115, to: 0.23, fade: 0.2217, weight: 0.5 },
        // the dive into the lagoon looks across it to starboard, the slate side: the Maelzel stands at the left third of the
        // frame and the lagoon and the fen beyond fill the rest (its own picture, between the high pass and the lagoon)
        { at: [-75, -4, 720], from: 0.48, to: 0.575, fade: 0.45, weight: 0.45 },
        { at: () => { hero.bobCenter(bobW); return bobW.set(-bobW.x, bobW.y, HZ - bobW.z); }, from: 0.93, to: 0.96, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#F4E3B0', glow: 1, revealDistance: 420 },
      post: { exposure: 1.0, bloom: { strength: 0.5, radius: 0.55, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#0b1418', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { hero.dispose(); if (second2) second2.dispose(); tile.tex.dispose(); },
    };
  },
};
