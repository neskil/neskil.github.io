// THE SCROLL AT RAINBOW BRIDGE
//
// A spring morning in Song-dynasty Kaifeng, ruled in even ink on a strip of tea-brown silk that winds off one
// jade-knobbed roller and onto another. We ride the bow of a grain barge: cast off in the basin facing the
// take-up roller, swing with the current past the left-bank village, run the reach between moored barges and
// wine shops, drop the mast a metre short of the Rainbow Bridge's beams, pass the city gate and its camels,
// and lift off the bow onto blank silk where one vermilion seal waits on the rising sheet.
//
// Everything is unlit jiehua: flat washes and one ink line of constant screen width, drawn by the hero's
// ruledInk material (src/parts/rainbow-bridge-scroll.js), which this world shares for its buildings, boats,
// willows and props. The silk ribbon (river, banks, flow lines, seals, the elevation painting in the bends),
// the dome of aged silk, the walking dab-figures and the animal / bird cards have their own small shaders here.
//
// COLOUR: under the ink line the washes are those of the blue-green manner, laid boldly and flat on pale paper: malachite
// on willows, pines and open ground, a deep azurite or blue-green wash on the water, azurite, malachite and azurite-grey
// tiles under gold ridges, cinnabar columns, shop posts, lanterns and banners, robes in all four minerals. The rollers
// are wrapped in azurite brocade ruled with gold lozenges between malachite knobs. Shade is flat ink wash: under every
// eave and soffit, on the wall below the eave, on the ground beside each building, under the bridge and along the quays.
// THE ENDS: the entry looks across the basin at the village bank: a three-storey pavilion on cinnabar columns, the well
// and its peach tree, willows, the donkey train, ducks and the sampan; the painting climbs the bend behind it to the lip
// of the silk (the take-up roller itself is kept out of the picture: from here only its end showed, as a stray cylinder
// in the corner). The town runs on to x = 291 and ends in a place round the seal: a water gate of two piers, two five-storey
// pagodas on stone terraces flanking the seal, a grove of pines, a crowd on the last quays. Where the silk rises to the
// feed roller the picture continues in flat elevation as three ranges of blue-green hills standing out of mist, the
// river winding up between them, and the great seal hanging over them like a sun in a reserve of pale silk cut on a
// ruled collar of cloud, with four cranes wheeling round it (seen from above, wings spread), who open their ring and
// leave the frame as the eye comes close. The same landscape is painted on the silk all round the
// scroll (the dome): three ranges told apart by colour, with two drifting bands of luminous mist; and on the take-up
// bend the painting climbs in stages of hills, roofs and willows. Skeins of cranes cross the upper sky in every cast.
// THE WATER: the wash lies in long tongues down the current; banks, bridge and moored hulls are laid on it as columns
// of broken level strokes that waver (a mirror image's reach from where the eye is), with their breaks sliding. The ruled
// flow lines waver as a ripple travels down them; wavelets (short bowed strokes) drift between them; a second deeper wash
// lies in bands down the channel and glints are left as reserve; lanterns, the banner towers and the junk's sail lie on
// the water as deeper blue, azurite and pale strokes (no red lies on the water). Under way on the reach (keyed to u): a junk under a battened mat sail,
// a passenger sampan sculled up past our starboard side, a small sampan by the bridge, each with its wake and its people.
// THROUGH THE PREVIOUS PORTAL the bank behind the entry is laid down to water level and drawn as river, and the fades are
// measured from the entry, so the opening shows river running toward the eye under the village bank.
//
// LOOKS (seed / ctx.vary.hour): misty morning (three drifting bands of bare silk), clear dry noon (paler, newer
// silk, every roof ruled to the wall), dusk (darker, older silk, paper lanterns under the eaves, a busier
// river), first snow (roofs and decks left as paper-pale reserve, bare willows, ice lines at the banks).
// CAST (seed): an ordinary day, grain-fleet day (a second great barge towed up through the arch, passing to
// our right), festival day (a bridal procession over the bridge street, kites above the wall).
// RARE: a collector stamps the scroll: as we clear the bridge a soapstone block 12 m square comes down on the
// left quay beside the water gate, presses and lifts, leaving a square vermilion impression, and one ripple runs back
// up the length of the silk so that every roof, boat and camel bobs once.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeAcc, PAT, GLSL_COMMON, GLSL_MIST, GLSL_RIPPLE, DAB_FRAG, buildCrowd, makeRibbons } from '../parts/rainbow-bridge-scroll.js';

// THE END FRAME. true: the great seal is cut clean (a clear rim, a band of squared key-fret between two ruled rings, a
// scalloped ring holding the opening, flat cinnabar) and its collar of cloud is a full scalloped band of pale ochre
// between two ruled lines, as rounds 14 and 15 drew them. false: both exactly as the live version draws them
const END_FRAME_R14 = true;

const PALETTE = ['#B79C70', '#F3EAD3', '#2B241C', '#8E8573', '#C6A568', '#A7A57C', '#D5351C'];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BANK = 3.0, HERO_X = 161, STAMP_X = 258, STAMP_Z = -24;
const MINERAL = { mal: '#1FA37A', azu: '#1F5FB0', gold: '#E0B02A' };
// river half-width along the scroll (also in GLSL below)
const halfW = (s) => 21 + 9 * sstep(0, 20, s) - 8 * sstep(60, 100, s) - 7 * sstep(183, 210, s);
const bankH = (s) => BANK * sstep(-20, -10, s) * (1 - sstep(292, 299, s));

// The scroll's profile: arc length s along the silk -> world (x, y) and the tangent angle. Flat from s = -20
// to X1; behind, a 36 m quarter-pipe up onto the take-up roller; ahead, the silk rises like a wave past the
// vertical to 108 degrees, runs straight for 18 m (the seal lies on it, square to a path pitched up 18
// degrees), and curls over onto the nearly spent feed roller.
const X0 = -20, R0 = 36, X1 = 300, R1 = 12, A1 = 108 * Math.PI / 180, STR = 18, A2 = 150 * Math.PI / 180;
const S_A = X1 + R1 * A1, S_B = S_A + STR, S_C = S_B + R1 * (A2 - A1), S_MIN = X0 - R0 * Math.PI / 2 - 9, S_MAX = S_C + 7;
function scrollBend(s, out) {
  if (s < X0) {
    const th = (X0 - s) / R0;
    if (th <= Math.PI / 2) { out.x = X0 - R0 * Math.sin(th); out.y = R0 * (1 - Math.cos(th)); out.a = -th; }
    else { const ph = (th - Math.PI / 2) * R0 / 5; out.x = X0 - R0 + 5 - 5 * Math.cos(ph); out.y = R0 + 5 * Math.sin(ph); out.a = -Math.PI / 2 - ph; }
  } else if (s <= X1) { out.x = s; out.y = 0; out.a = 0; }
  else if (s <= S_A) { const th = (s - X1) / R1; out.x = X1 + R1 * Math.sin(th); out.y = R1 * (1 - Math.cos(th)); out.a = th; }
  else {
    const ax = X1 + R1 * Math.sin(A1), ay = R1 * (1 - Math.cos(A1)), ca = Math.cos(A1), sa = Math.sin(A1);
    if (s <= S_B) { out.x = ax + (s - S_A) * ca; out.y = ay + (s - S_A) * sa; out.a = A1; }
    else {
      const bx = ax + STR * ca, by = ay + STR * sa, cx = bx - R1 * sa, cy = by + R1 * ca;
      if (s <= S_C) { const th = A1 + (s - S_B) / R1; out.x = cx + R1 * Math.sin(th); out.y = cy - R1 * Math.cos(th); out.a = th; }
      else {
        const ex = cx + R1 * Math.sin(A2), ey = cy - R1 * Math.cos(A2), rx = ex - 3 * Math.sin(A2), ry = ey + 3 * Math.cos(A2), th = A2 + (s - S_C) / 3;
        out.x = rx + 3 * Math.sin(th); out.y = ry - 3 * Math.cos(th); out.a = th;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------
// shaders
const GLSL_VNOISE = /* glsl */`
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
  float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0)); }
`;

const SILK_VERT = /* glsl */`
  attribute vec3 aP;
  uniform float uTime; uniform vec4 uClip;
  varying vec3 vP; varying vec3 vW; varying float vThru;
  ${GLSL_RIPPLE}
  void main() {
    vP = aP;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    // seen through the previous portal (uClip.w on): behind the entry plane the bank is laid down to water level, so that
    // the low part of the opening is river running toward the eye (the fragment shader draws it as water there)
    vThru = uClip.w * smoothstep(0.0, 6.0, dot(wp.xz, uClip.xy) + uClip.z) * step(-19.0, aP.x) * (1.0 - step(299.0, aP.x));
    wp.y -= aP.y * vThru;
    wp.y += rippleY(wp.x);
    // slow ripples travelling down the blank silk from the feed roller (still under the great seal)
    float ra = clamp((aP.x - 300.0) / 12.0, 0.0, 1.885);
    float amp = 0.2 * smoothstep(299.0, 305.0, aP.x) * (1.0 - smoothstep(308.0, 320.0, aP.x));
    wp.xy += vec2(-sin(ra), cos(ra)) * amp * sin((aP.x + uTime * 9.0) * 0.21);
    vW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const SILK_FRAG = /* glsl */`
  uniform vec3 uInk, uSilk, uPale, uGrey, uSeal, uAzur, uMal, uGold, uWater, uTone;${END_FRAME_R14 ? ' uniform vec3 uOchre;' : ''}
  uniform float uLinePx, uTime, uSeed, uWind, uSnow, uBusy, uJoin;
  uniform vec2 uFade; uniform vec4 uBargeW; uniform vec4 uSeals[5]; uniform vec3 uObs[12]; uniform vec4 uBig; uniform vec4 uStampAt; uniform vec3 uThresh;
  uniform vec4 uTraf[3]; uniform vec4 uSail; uniform vec3 uTow[5];
  varying vec3 vP; varying vec3 vW; varying float vThru;
  ${GLSL_COMMON}
  ${GLSL_MIST}
  ${GLSL_VNOISE}
  float halfW(float s) { return 21.0 + 9.0 * smoothstep(0.0, 20.0, s) - 8.0 * smoothstep(60.0, 100.0, s) - 7.0 * smoothstep(183.0, 210.0, s); }
  // a square collector's seal: border, two fret rings, a centre dot; four-fold symmetric, no characters
  float squareSeal(vec2 sq, float fs) {
    vec2 aq = abs(sq); float dd = max(aq.x, aq.y), mn = min(aq.x, aq.y);
    float ink = smoothstep(0.80 - fs, 0.80 + fs, dd);
    ink = max(ink, smoothstep(0.50 - fs, 0.50 + fs, dd) * (1.0 - smoothstep(0.64 - fs, 0.64 + fs, dd)) * smoothstep(0.10 - fs, 0.10 + fs, mn));
    ink = max(ink, smoothstep(0.22 - fs, 0.22 + fs, dd) * (1.0 - smoothstep(0.36 - fs, 0.36 + fs, dd)) * smoothstep(0.07 - fs, 0.07 + fs, abs(aq.x - aq.y)));
    ink = max(ink, 1.0 - smoothstep(0.08 - fs, 0.08 + fs, dd));
    return ink * (1.0 - smoothstep(1.0 - fs, 1.0 + fs, dd));
  }
  // one figure of the flat elevation painting, in its own cell: a roof over its walls, or a willow. Returns the distance
  // to its ruled lines; fl = (roof, wall, leaf) fills
  float glyph(vec2 g, vec2 ci, float hc, out vec3 fl) {
    float dg = 99.0; fl = vec3(0.0);
    if (hc < 0.56) {                                                  // a roof: ridge, eaves, two slopes, walls
      float rw = 1.5 + 1.1 * h21(ci + 13.0);
      dg = min(sdSeg(g, vec2(-rw, 2.0), vec2(rw, 2.0)), sdSeg(g, vec2(-rw - 1.5, 0.2), vec2(rw + 1.5, 0.2)));
      dg = min(dg, min(sdSeg(g, vec2(-rw, 2.0), vec2(-rw - 1.5, 0.2)), sdSeg(g, vec2(rw, 2.0), vec2(rw + 1.5, 0.2))));
      dg = min(dg, min(sdSeg(g, vec2(-rw - 0.3, 0.2), vec2(-rw - 0.3, -1.3)), sdSeg(g, vec2(rw + 0.3, 0.2), vec2(rw + 0.3, -1.3))));
      dg = min(dg, min(sdSeg(g, vec2(-rw - 0.3, -1.3), vec2(rw + 0.3, -1.3)), sdSeg(g, vec2(-0.4, -1.3), vec2(-0.4, -0.2))));
      fl.x = step(0.2, g.y) * step(g.y, 2.0) * step(abs(g.x), rw + 1.5 * (2.0 - g.y) / 1.8);
      fl.y = step(-1.3, g.y) * step(g.y, 0.2) * step(abs(g.x), rw + 0.3);
    } else if (hc < 0.92) {                                           // a willow: trunk, round head, hanging strokes
      dg = min(sdSeg(g, vec2(0.0, -2.2), vec2(0.2, 0.2)), abs(length(g - vec2(0.2, 1.2)) - 1.9));
      dg = min(dg, min(sdSeg(g, vec2(-0.9, 1.0), vec2(-1.2, -0.9)), sdSeg(g, vec2(1.2, 1.2), vec2(1.6, -0.7))));
      dg = min(dg, min(sdSeg(g, vec2(-1.6, 1.4), vec2(-2.1, -0.3)), sdSeg(g, vec2(0.4, 0.6), vec2(0.6, -1.0))));
      fl.z = step(length(g - vec2(0.2, 1.2)), 1.9);
    }
    return dg;
  }
  // the crest of a range of hills over z: sharp peaks of uneven height
  float ridgeH(float z, float k, float sd) {
    float n1 = vnoise(vec2(z * k, sd)), n2 = vnoise(vec2(z * k * 2.7 + 5.0, sd + 3.0)), n3 = vnoise(vec2(z * k * 0.45 + 9.0, sd + 7.0));
    return (1.0 - abs(2.0 * n1 - 1.0)) * (0.45 + 0.55 * n3) + 0.22 * n2;
  }
  // one range in flat elevation (on the rising silk, and in each stage of the painting that climbs the take-up bend):
  // a wash graded from malachite at the crest to azurite below, stopped at its foot on a ruled, scalloped line of
  // cloud (bare silk under it); one gold contour, hemp-fibre strokes hanging from the ruled crest, moss dots along
  // it and, where wf is on, a few waterfalls: a pale ruled band whose strokes run down
  void hillRange(inout vec3 col, inout float ink, float sw, float z, float base, float amp, float k, float sd, float depth, float fw, float px, float a, float wf, float lift, float mg, float pn) {
    float r0 = base + amp * ridgeH(z, k, sd), r1 = base + amp * ridgeH(z + 0.4, k, sd);
    float sl = (r1 - r0) / 0.4, F = (sw - r0) / sqrt(1.0 + sl * sl);
    float t = clamp((r0 - sw) / depth, 0.0, 1.0), inn = 1.0 - smoothstep(-fw, fw, F);
    float ft = 0.9 - 0.1 * abs(sin(z * 0.61 + sd * 3.1)) - 0.05 * abs(sin(z * 1.9 + sd)), ftd = (ft - t) * depth;
    float body = inn * smoothstep(-fw, fw, ftd);
    vec3 crest = mix(uMal, uPale, uSnow);
    float tsn = 0.15 + 0.06 * sin(z * 0.83 + sd * 2.0) + 0.03 * sin(z * 2.9 + sd), esn = fw / depth;
    // the minerals are laid boldly and flat: malachite at the crest (a snow cap under snow), azurite below; lift pales a
    // far range, mg is how far down the malachite reaches
    vec3 wash = mix(crest, mix(uAzur, uMal, 0.3 * (1.0 - uSnow)), mix(smoothstep(0.05, mg, t), smoothstep(tsn - esn, tsn + esn, t), uSnow));
    wash = mix(wash, uPale, lift);
    // the flank of every peak that is turned from the light takes a second, deeper flat wash, cut on the fall line under
    // each summit and stopped on a line that follows the crest: the range stands as faceted rock, not as one sheet
    float flank = smoothstep(-0.012, 0.012, sl) * smoothstep(0.0, 0.5 * fw / depth + 0.004, t) * (1.0 - smoothstep(0.5 - fw / depth, 0.5 + fw / depth, t + 0.07 * sin(z * 0.9 + sd)));
    wash = mix(wash, mix(wash, mix(uAzur, uInk, 0.45), 0.42), flank * (1.0 - 0.6 * lift));
    col = mix(col, wash, 0.95 * body * (1.0 - 0.25 * smoothstep(0.35, 0.95, t)) * a * uTone.z);
    ink *= 1.0 - body * a;
    col = mix(col, uGold, 0.9 * inkLine(abs(F + 0.75 + 0.05 * depth), fw, px * 1.2) * a * uTone.z);
    float keep = smoothstep(3.0, 6.0, 1.5 / max(fw, 1e-6));
    float cell = floor(z / 1.5), hh = h11(cell + sd * 13.0);
    float st = inkLine(abs(fract(z / 1.5 + 0.2 * sin(sw * 0.9 + sd)) - 0.5) * 1.5, fw, px * 0.8) * step(0.25, hh) * body * (1.0 - smoothstep(0.14 + 0.4 * hh, 0.2 + 0.46 * hh, t)) * keep;
    // a second, fainter set of strokes lower down, between the first
    float st2 = inkLine(abs(fract(z / 1.5 + 0.5 + 0.2 * sin(sw * 0.7 + sd * 2.0)) - 0.5) * 1.5, fw, px * 0.7) * step(0.55, h11(cell + sd * 5.0)) * body * smoothstep(0.3, 0.36, t) * (1.0 - smoothstep(0.52 + 0.2 * hh, 0.6 + 0.2 * hh, t)) * keep;
    // moss dots along the crest
    float dc = floor(z / 1.3 + sd), dh = h11(dc + sd * 7.0);
    float dots = (1.0 - smoothstep(0.19 - fw, 0.19 + fw, length(vec2((fract(z / 1.3 + sd) - 0.5) * 1.3, F + 0.45 + 0.5 * dh)))) * step(0.42, dh) * smoothstep(3.0, 6.0, 0.4 / max(fw, 1e-6));
    // waterfalls
    float wc = floor(z / 13.0 + sd * 0.37), wz = (fract(z / 13.0 + sd * 0.37) - 0.5) * 13.0 - 3.0 * (h11(wc + sd) - 0.5), wh = step(0.55, h11(wc + sd * 3.0)) * wf;
    float win = (1.0 - smoothstep(0.6 - fw, 0.6 + fw, abs(wz))) * body * step(0.1, t) * wh;
    col = mix(col, uPale, 0.85 * win * a);
    float wl = max(inkLine(abs(abs(wz) - 0.6), fw, px * 0.8) * step(0.1, t), 0.75 * ruled(wz, 0.3, fw, px * 0.7) * step(0.45, fract(t * depth / 1.7 - uTime * 0.8 + h11(floor(wz / 0.3) + wc) * 5.0))) * body * wh * step(abs(wz), 0.75);
    float cloud = 0.5 * inkLine(abs(ftd), fw, px * 0.8) * inn;
    ink = max(ink, max(max(inkLine(abs(F), fw, px), max(st, st2) * 0.55), max(max(dots * 0.85, wl), cloud)) * a);
    // pines standing along the crest: a ruled wedge of malachite (snow-laden under snow) on a short trunk
    float pcl = floor(z / 3.4 + sd * 1.7), pz = (fract(z / 3.4 + sd * 1.7) - 0.5) * 3.4 - 0.9 * (h11(pcl + sd * 11.0) - 0.5), ph = 2.8 + 1.8 * h11(pcl + 7.0), py = F + 0.25;
    float pon = step(1.0 - 0.62 * pn, h11(pcl + sd * 19.0)) * step(0.001, pn) * smoothstep(3.0, 6.0, 1.0 / max(fw, 1e-6)) * a;
    float pwd = 1.05 * clamp(1.0 - (py - 0.7) / (ph - 0.7), 0.0, 1.0), pin = step(0.7, py) * step(py, ph);
    // (dark malachite in every look: under snow only the windward half of each wedge is left as reserve)
    col = mix(col, mix(mix(uMal, uInk, 0.38), uPale, 0.7 * uSnow * step(0.0, pz) * step(0.35 * pwd, abs(pz))), 0.94 * pin * (1.0 - smoothstep(pwd - fw, pwd + fw, abs(pz))) * pon);
    float pl = min(abs(pz) + (1.0 - step(0.0, py) * step(py, 0.7)) * 9.0, min(abs(abs(pz) - pwd) + (1.0 - pin) * 9.0, abs(py - 0.7) + step(1.05, abs(pz)) * 9.0));
    ink = max(ink, inkLine(pl, fw, px * 0.85) * pon);
  }
  void main() {
    vec2 p = vP.xz; float s = p.x, z = p.y, h = vP.y, px = uLinePx, mz = abs(z);
    vec2 pdx = dFdx(p), pdy = dFdy(p);
    float gs = max(length(vec2(pdx.x, pdy.x)), 1e-6), gz = max(length(vec2(pdx.y, pdy.y)), 1e-6), fwp = max(gs, gz);
    float fh = max(length(vec2(dFdx(h), dFdy(h))), 1e-6);
    float dist = length(cameraPosition - vW);
    float bend = 1.0 - smoothstep(-24.0, -19.0, s);                 // the flat painting that climbs onto the take-up roller
    float sp = s + uWind * bend;                                      // it winds upward, slowly
    float blank = smoothstep(292.0, 304.0, s);
    vec3 col = mix(uSilk, uPale, blank * 0.92);
    // ---- the silk itself: foxing, repair patches, creases, cracks, wormholes, weave
    vec2 q = p + uSeed * vec2(37.0, 91.0);
    float fox = smoothstep(0.56, 0.86, vnoise(q * 0.045 + uTime * 0.006) * 0.7 + vnoise(q * 0.13) * 0.3);
    col *= 1.0 - 0.085 * fox;
    vec2 pc = floor((q + vec2(37.0, 11.0)) / vec2(64.0, 46.0)), pf = fract((q + vec2(37.0, 11.0)) / vec2(64.0, 46.0));
    float mend = step(0.66, h21(pc)) * step(0.2, pf.x) * step(pf.x, 0.55) * step(0.3, pf.y) * step(pf.y, 0.62);
    col = mix(col, mix(uSilk, uPale, 0.5), mend * 0.3);
    float crease = 1.0 - smoothstep(0.0, 0.5 + fwp, abs(fract((s * 0.22 + z + uSeed * 50.0) / 150.0 + 0.3) - 0.5) * 150.0);
    col *= 1.0 - 0.13 * crease;
    float ck = abs(vnoise(q * 0.08 + 11.0) - 0.5);
    col *= 1.0 - 0.16 * (1.0 - smoothstep(0.0, 0.006 + fwp * 0.03, ck)) * step(0.55, vnoise(q * 0.013 + 3.0));
    vec2 wc = floor(q / 7.0), wf = fract(q / 7.0) - 0.5;
    float hole = step(0.9, h21(wc)) * (1.0 - smoothstep(0.02, 0.03 + fwp * 0.1, length(wf - 0.3 * (vec2(h21(wc + 3.0), h21(wc + 7.0)) - 0.5))));
    col = mix(col, uPale, hole * 0.6);
    col *= 1.0 + 0.04 * (1.0 - smoothstep(0.012, 0.04, fwp)) * sin(s * 52.0) * sin(z * 52.0);
    float rp = sin((s + uTime * 9.0) * 0.21);
    col *= 1.0 + blank * (0.045 * rp + 0.035 * smoothstep(0.93, 1.0, rp) + 0.015 * sin((s + uTime * 5.0) * 0.83 + z * 0.05));    // slow ripples running down from the feed roller
    float line = 0.0;
    if (mz > 75.0) {                                                  // the mount: an azurite brocade border, lozenges ruled in gold
      col = mix(col, uAzur, 0.82 * (1.0 - bend));
      float la = s + z, lb = s - z, fl = fwp * 1.41;
      vec2 lc = (vec2(fract(la / 3.2), fract(lb / 3.2)) - 0.5) * 3.2;
      float lo = max(max(ruled(la, 3.2, fl, px * 1.2), ruled(lb, 3.2, fl, px * 1.2)), (1.0 - smoothstep(0.42 - fl, 0.42 + fl, length(lc))) * smoothstep(2.6, 5.0, 3.2 / fl));
      col = mix(col, uGold, 0.8 * lo * (1.0 - bend));
    }
    float thrK = step(0.5, vThru);
    line = (inkLine(abs(mz - 75.0), gz, px) + inkLine(abs(mz - 76.2), gz, px * 0.7)) * (1.0 - thrK);
    float w = halfW(s);
    float pic = 1.0 - smoothstep(289.0, 297.0, s);
    float mst = mistAt(vW, dist), jn = uJoin * (1.0 - smoothstep(3.0, 10.0, abs(s + 19.0))) * step(mz, 75.0);       // (the mist band over the join)
    float omit = max(max(smoothstep(uFade.x, uFade.y, dist), mst), jn);
    // the water's wash is carried further than the ink and thins, not vanishes, under mist
    float omitW = max(max(smoothstep(uFade.x * 1.3, uFade.y * 1.6, dist), 0.65 * mst), jn);
    float ink = 0.0;
    // the river's flow coordinate, parted by our hull; its derivative is taken here, outside any branch (Direct3D)
    float cx = z * 22.0 / w + 0.7 * sin(s * 0.043 + 1.3) + 0.3 * sin(s * 0.11) + 0.8 * sin(s * 0.17 + z * 0.06) * (1.0 - smoothstep(38.0, 70.0, s));
    vec2 hd = uBargeW.zw, rel = p - uBargeW.xy;
    float al = dot(rel, hd), ac = rel.y * hd.x - rel.x * hd.y;
    float bw = exp(-ac * ac / 30.0) * (1.0 - smoothstep(10.0, 22.0, abs(al)));
    cx += sign(ac + 1e-4) * 1.6 * bw * (1.0 - smoothstep(0.0, 4.0, abs(ac)) * 0.5);
    // the ruled lines waver: a slow ripple travels down them
    cx += 0.24 * sin(s * 0.9 - uTime * 1.4 + z * 0.7) * (1.0 - bend) * (1.0 - 0.8 * bw);
    float fwc = max(length(vec2(dFdx(cx), dFdy(cx))), 1e-6);
    if ((mz < w + 0.12 && h < 0.03) || thrK > 0.5) {
      // ---- the river: bare silk, long ruled flow lines sliding downstream
      float period = 2.7, lid = floor(cx / period), hh = h11(lid);
      // in the basin (each line up to its own mark) more lines are drawn and their strokes are shorter
      float basin = step(s, 50.0 + 14.0 * h11(lid + 3.0));
      float len = mix(38.0 + 30.0 * hh, 22.0 + 18.0 * hh, basin);
      float seg = fract((sp - uTime * (3.4 + 1.8 * hh) * (1.0 - bend)) / len + hh * 9.0);
      float e1 = 0.42 + 0.3 * h11(lid + 5.0);
      float on = smoothstep(0.0, 0.02, seg) * (1.0 - smoothstep(e1, e1 + 0.04, seg)) * step(mix(0.4 - 0.2 * uBusy, 0.2, basin), h11(lid + 17.0));
      ink = ruled(cx, period, fwc, px * 0.85) * on * (1.0 - 0.9 * bw);
      // the basin: a second, fainter set of short ripple strokes between the flow lines
      float rseg = (sp - uTime * 2.0) / 7.0;
      ink = max(ink, 0.55 * ruled(cx + 1.35, period, fwc, px * 0.7) * basin * step(s, 64.0) * step(0.5, h21(vec2(lid + 40.0, floor(rseg)))) * step(0.12, fract(rseg)) * step(fract(rseg), 0.7) * (1.0 - 0.9 * bw));
      // whorls: ruled arcs turning in the lee of every hull and pier nose
      for (int i = 0; i < 12; i++) {
        vec3 ob = uObs[i];
        vec2 d = p - ob.xy; float r = length(d) + 1e-4;
        float ang = atan(d.y, d.x + 1e-5) + uTime * 0.65 * (mod(float(i), 2.0) < 0.5 ? 1.0 : -1.0) + r * 1.1;
        float arc = smoothstep(0.1, 0.5, sin(ang)) * (1.0 - smoothstep(ob.z - 0.8, ob.z, r)) * smoothstep(0.25, 0.5, r);
        vec2 dn = d / r; float fr = max(length(vec2(dot(pdx, dn), dot(pdy, dn))), 1e-6);
        ink = max(ink, ruled(r, 0.62, fr, px) * arc);
      }
      // wavelets: short level strokes bowed downstream, in staggered cells that drift with the current and come and go
      float wsv = (sp - uTime * 2.3 * (1.0 - bend)) / 3.7, wrow = floor(wsv);
      float wzu = z / 2.7 + 0.5 * mod(wrow, 2.0) + h11(wrow) * 0.3, wcl = floor(wzu), wvh = h21(vec2(wrow, wcl));
      float wdz = (fract(wzu) - 0.5) * 2.7 - (h21(vec2(wcl, wrow) + 7.0) - 0.5) * 0.7, wlen = 0.7 + 0.7 * h21(vec2(wrow, wcl) + 3.0);
      float wds = (fract(wsv) - 0.3 - 0.4 * wvh) * 3.7 - 0.42 * (1.0 - wdz * wdz / (wlen * wlen));
      float wlf = fract(wvh * 7.0 + uTime * 0.11), wlife = smoothstep(0.0, 0.2, wlf) * (1.0 - smoothstep(0.75, 0.95, wlf));
      ink = max(ink, inkLine(abs(wds), gs, px * 0.9) * step(abs(wdz), wlen) * step(0.22, wvh) * wlife * smoothstep(1.5, 3.0, 1.6 / gs) * (1.0 - bw));
      // the wakes of the boats under way: two ruled arms, broken, a fainter pair inside them, and a reserve of pale astern
      float foam = 0.0;
      for (int i = 0; i < 3; i++) {
        vec4 tr = uTraf[i]; vec2 rl = p - tr.xy; float wal = -dot(rl, tr.zw), wac = abs(rl.y * tr.z - rl.x * tr.w);
        float won = step(0.5, wal) * (1.0 - smoothstep(15.0, 23.0, wal));
        float arm = inkLine(abs(wac - (0.5 + 0.3 * wal)), fwp, px * 0.85) * step(0.3, fract(wal / 2.6 - uTime * 0.5));
        float arm2 = inkLine(abs(wac - 0.12 * wal), fwp, px * 0.7) * step(0.5, fract(wal / 1.9 - uTime * 0.7 + 0.4)) * step(3.0, wal);
        ink = max(ink, max(arm, 0.7 * arm2) * won);
        foam = max(foam, (1.0 - smoothstep(0.0, 0.4 + 0.25 * wal, wac)) * step(0.0, wal) * (1.0 - smoothstep(1.5, 11.0, wal)));
      }
      ink = max(ink, inkLine(abs(mz - w), gz, px * 1.1) * (1.0 - thrK));
      // first snow: ice lines along the banks
      float ice = inkLine(abs(mz - w + 1.3 + 0.5 * sin(s * 0.3)), gz, px * 0.8) * step(0.3, fract(s / 11.0)) + inkLine(abs(mz - w + 2.9 + 0.7 * sin(s * 0.17 + 2.0)), gz, px * 0.8) * step(0.55, fract(s / 17.0 + 0.4));
      ink = max(ink, ice * uSnow * (1.0 - thrK));
      ink *= pic;
      // the water: a thin blue-green mineral wash laid in long tongues down the current (the silk shows paler between
      // them), deeper under the banks and under the bridge; left bare where mist or distance omits
      float rd = w - mz, wk = pic * (1.0 - omit);
      float tongue = smoothstep(0.37, 0.45, vnoise(vec2(cx * 0.42 + 7.0, (s - uTime * 1.5 * (1.0 - bend)) * 0.028)));
      float wat = (0.86 + 0.06 * smoothstep(w - 9.0, w, mz) + 0.06 * (1.0 - smoothstep(7.0, 12.0, abs(s - 161.0)))) * mix(0.76, 1.0, tongue);
      col = mix(col, uWater, min(wat * uTone.x, 0.95) * pic * (1.0 - omitW));
      // a second, deeper wash lies in long bands down the channel; glints are left as short level strokes of reserve that
      // come and go; astern of every boat under way the wash is thinned
      float deep = smoothstep(0.58, 0.64, vnoise(vec2(cx * 0.3 + 31.0, (s - uTime * 1.1 * (1.0 - bend)) * 0.021)));
      col = mix(col, mix(uWater, uInk, 0.24), 0.6 * deep * wk);
      float gsv = (sp - uTime * 1.2 * (1.0 - bend)) / 4.6, grw = floor(gsv), gzu = z / 2.6 + h11(grw + 9.0) * 3.0, gcl = floor(gzu), gh = h21(vec2(grw + 20.0, gcl));
      float gdz = (fract(gzu) - 0.5) * 2.6, gds = (fract(gsv) - 0.5) * 4.6, glen = 0.5 + 0.6 * h21(vec2(gcl, grw) + 5.0);
      float glint = (1.0 - smoothstep(-gs, gs, abs(gds) - 0.11 * (1.0 - gdz * gdz / (glen * glen)))) * step(abs(gdz), glen) * step(0.3, gh) * smoothstep(0.2, 0.6, sin(uTime * (0.6 + gh) + gh * 40.0)) * (1.0 - smoothstep(0.25, 0.6, gs));
      col = mix(col, uPale, 0.75 * glint * wk);
      col = mix(col, uPale, 0.32 * foam * wk);
      // shade, as flat ink wash: the bridge's on the water under it, and a band along the foot of each embankment
      float shb = 1.0 - smoothstep(7.0, 11.0, abs(s - 161.0));
      col = mix(col, mix(uWater, uInk, 0.6), 0.8 * shb * wk);
      col = mix(col, mix(uWater, uInk, 0.45), 0.35 * smoothstep(w - 2.5, w, mz) * wk * (1.0 - thrK));
      // reflections: whatever stands on the bank is laid on the water below it as a column of broken level strokes, in
      // its own wash (pale wall, tile grey, willow); a cinnabar column or lantern lies there as the water's own deeper
      // blue (wdeep), for no red is laid on the water anywhere; the strokes waver and their breaks slide. Far off the
      // breaks, then the columns, are left out and only an even deeper band is kept
      vec3 wdeep = mix(uWater, uInk, 0.5);
      float sideK = step(0.0, z), cw = 3.1, cu = s / cw + 0.37 * sideK, cid = floor(cu) + 57.0 * sideK, ch = h11(cid * 1.7 + 4.0), ch2 = h11(cid + 23.0);
      float townR = smoothstep(62.0, 74.0, s) * (1.0 - smoothstep(288.0, 296.0, s));
      float Ho = mix(2.2 + 4.5 * ch, 4.0 + 8.0 * ch, townR), eyeH = max(cameraPosition.y, 1.5);
      float Hc = min(Ho * clamp(dist / (eyeH + Ho), 0.6, 4.0), w * 0.8), fh2 = clamp(rd / Hc, 0.0, 1.0);
      float colw = (0.5 + 0.8 * h11(cid + 9.0)) * (1.0 - 0.5 * fh2);
      float cxr = abs((fract(cu) - 0.5) * cw + 0.2 * fh2 * sin(rd * 2.6 + uTime * 1.7 + cid));
      float rdw = rd + 0.09 * sin(s * 1.9 + uTime * 1.4), rrow = floor(rdw / 0.5), gapK = 1.0 - smoothstep(0.1, 0.3, fwp), colK = 1.0 - smoothstep(0.45, 1.3, gs);
      float gap = step(0.36 + 0.5 * fh2, h21(vec2(rrow, floor(s / 1.3 + h11(rrow) * 5.0 + uTime * 0.3 * (h11(rrow + 2.0) - 0.5)))));
      float inC = (1.0 - smoothstep(colw - gs, colw + gs, cxr)) * step(rd, Hc) * smoothstep(0.1, 0.7, rd) * step(0.18, ch2);
      float refl = inC * (1.0 - gap * gapK) * mix(1.0, step(0.36, fract(rdw / 0.5)), gapK);
      refl = mix(0.3 * (1.0 - smoothstep(2.0, 9.0, rd)) * smoothstep(0.1, 0.7, rd), refl * (1.0 - 0.5 * fh2), colK);
      vec3 rc = ch2 < 0.56 ? mix(uPale, uSilk, 0.15) : ch2 < 0.78 ? mix(mix(uAzur, uGrey, 0.5), uPale, uSnow * 0.8) : ch2 < 0.92 ? mix(mix(uMal, uInk, 0.35), mix(uGrey, uInk, 0.3), uSnow) : wdeep;
      rc = mix(mix(uWater, uInk, 0.3), rc, colK);
      float rk = wk * (1.0 - thrK);
      col = mix(col, rc, 0.78 * refl * rk);
      // the lanterns under the eaves lie on the water as a row of short strokes of the deeper blue; each banner tower as
      // a tall column of azurite and deeper blue strokes that wavers
      float Hl = min(5.5 * clamp(dist / (eyeH + 5.5), 0.6, 1.5), w * 0.3), fl2 = rd / max(Hl, 1e-3), lcu = s / 1.9 + 0.5 * sideK;
      float lan = townR * step(0.68, h11(floor(lcu) + 31.0 * sideK)) * (1.0 - smoothstep(0.3 - gs, 0.3 + gs, abs(fract(lcu) - 0.5) * 1.9)) * step(0.3, fl2) * step(fl2, 0.85) * step(0.3, fract(rdw / 0.5)) * colK;
      col = mix(col, mix(wdeep, uWater, 0.2), 0.6 * lan * rk);
      // a mirror lays a tall thing on the water toward the eye: each banner tower's three cloths as a short column of
      // deeper blue and azurite strokes, where the line from its foot to the eye crosses the river
      float ban = 0.0, bmid = 0.0;
      for (int i = 0; i < 5; i++) {
        vec2 tb = uTow[i].xy, tv = cameraPosition.xz - tb; float tdn = max(length(tv), 1e-3); tv /= tdn;
        vec2 trl = p - tb; float tal = dot(trl, tv), tac = abs(trl.y * tv.x - trl.x * tv.y);
        // (as wide as the cloths look from here: the nearer the eye the strokes lie, the narrower the column)
        float thw = 2.9 * clamp((tdn - tal) / tdn, 0.0, 1.0), twv = tac + 0.12 * sin(tal * 2.3 + uTime * 1.5);
        float ton = step(tdn * 11.0 / (11.0 + eyeH), tal) * step(tal, tdn * 20.0 / (20.0 + eyeH)) * step(twv, thw) * step(0.36, fract(tal / 0.55 + 0.1 * sin(tac * 2.0 + uTime)));
        ban = max(ban, ton); bmid = mix(bmid, step(twv, thw * 0.34), ton);
      }
      col = mix(col, mix(mix(wdeep, uAzur, bmid), uWater, 0.2), 0.58 * ban * rk * (1.0 - uClip.w) * (1.0 - smoothstep(0.3, 0.8, fwp)));
      // the junk's sail lies on the water toward the eye: a tapering column of pale broken strokes
      vec2 sv = cameraPosition.xz - uSail.xy; float sdn = max(length(sv), 1e-3); sv /= sdn;
      vec2 srl = p - uSail.xy; float sal = dot(srl, sv), sac = abs(srl.y * sv.x - srl.x * sv.y), sL = max(sdn * uSail.z / (uSail.z + eyeH), 1e-3);
      float shw = uSail.w * clamp((sdn - sal) / sdn, 0.0, 1.0);
      float sref = step(1.5, sal) * step(sal, sL) * (1.0 - smoothstep(shw - fwp, shw + fwp, sac + 0.14 * sin(sal * 2.1 + uTime * 1.6))) * step(0.36, fract(sal / 0.6 + 0.15 * sin(sac * 3.0 + uTime * 0.9)));
      col = mix(col, mix(uPale, uGold, 0.25), 0.62 * sref * wk * (1.0 - uClip.w));
      // the bridge lies on the water either side of itself: the dark of the arch nearest, then the crowd and its
      // parasols as short level strokes of pale, deeper blue, azurite and gold
      float db = abs(s - 161.0) - 7.0, la = (4.0 + 9.0 * cos(clamp(z / 21.0, -1.0, 1.0) * 1.5708)) * clamp(dist / (eyeH + 10.0), 0.5, 2.6);
      float dbw = db + 0.09 * sin(z * 1.9 + uTime * 1.4), brow = floor(dbw / 0.5), bz = z / 1.7 + h11(brow) * 3.0 + uTime * 0.22 * (h11(brow + 5.0) - 0.5), bh = h21(vec2(brow + 90.0, floor(bz)));
      float inB = step(0.0, db) * mix(1.0, step(0.42, fract(dbw / 0.5)), gapK) * step(mz, w - 0.5);
      float arch = inB * (1.0 - smoothstep(la * 0.75, la, db)) * (1.0 - step(0.62 + 0.3 * db / la, bh) * gapK);
      col = mix(col, mix(uWater, uInk, 0.5), 0.8 * arch * wk);
      float conf = inB * step(la * 0.35, db) * (1.0 - smoothstep(la + 2.0, la + 7.0, db)) * step(0.78, bh) * gapK * step(0.1, fract(bz)) * step(fract(bz), 0.4 + 0.5 * h11(floor(bz) + brow));
      vec3 cc = bh < 0.9 ? uPale : bh < 0.95 ? wdeep : bh < 0.98 ? mix(uAzur, uPale, 0.3) : uGold;
      col = mix(col, mix(cc, uWater, 0.2), 0.8 * conf * wk);
      // the weave shows through the wash
      col *= 1.0 + 0.03 * sin(s * 52.0) * sin(z * 52.0) * (1.0 - smoothstep(0.012, 0.04, fwp));
    } else if (h > 0.03 && h < 2.94) {
      // ---- the embankment face: ruled stone courses in the town, earth with a few strokes in the village
      float town = smoothstep(62.0, 74.0, s);
      float row = floor(h / 0.6);
      float l = ruled(h, 0.6, fh, px), j = ruled(s + h11(row) * 1.7, 1.7, gs, px) * smoothstep(2.6, 5.0, 0.6 / fh);
      ink = max(l, j) * town + (1.0 - town) * ruled(s + h11(floor(h / 0.9)) * 0.9, 0.9, gs, px) * step(0.62, h11(floor(s / 0.9) + row * 7.0));
      col = mix(col, mix(uPale, uGrey, 0.18 * step(0.8, h21(vec2(row, floor((s + h11(row) * 1.7) / 1.7))))), 0.55 * town);
      col = mix(col, uGrey, 0.3 * (1.0 - smoothstep(0.0, 1.4, h)));                 // a wash of shade along the foot of the wall
      // the village's earth bank: grass hanging over the lip (a malachite wash thinning downward), tufts as short strokes
      col = mix(col, uMal, 0.34 * (1.0 - town) * smoothstep(0.9, 2.9, h) * uTone.y);
      float tuft = inkLine(abs(fract(s / 0.45 + h11(floor(s / 0.45)) * 0.3) - 0.5) * 0.45, gs, px * 0.8) * step(0.5, h11(floor(s / 0.45) + 3.0)) * step(2.9 - 0.9 * h11(floor(s / 0.45) + 9.0), h) * smoothstep(3.0, 6.0, 0.45 / gs);
      ink = max(ink, tuft * (1.0 - town) * (1.0 - uSnow));
      ink *= pic; col = mix(col, mix(uSilk, uPale, blank * 0.92), 1.0 - pic);
    } else if (mz <= 75.0 && s > -24.0) {
      // ---- bank tops: the embankment lane, paving, kitchen plots, streets, grass ticks
      float d = mz - w - 1.0;
      float town = smoothstep(62.0, 74.0, s) * (1.0 - smoothstep(288.0, 295.0, s));
      // open ground takes a thin uneven malachite wash; the paved town is a little paler than the paper
      float keep = pic * (1.0 - omit);
      col = mix(col, uMal, (0.2 + 0.14 * vnoise(p * 0.09 + 5.0)) * (1.0 - town) * uTone.y * keep * smoothstep(-24.0, -18.0, s));
      col = mix(col, uPale, 0.2 * town * keep);
      col = mix(col, uPale, 0.9 * uSnow * pic);
      ink = inkLine(abs(d - 0.12), gz, px * 1.1);
      if (d < 6.4) {
        float rowp = floor(d / 1.6);
        ink = max(ink, max(ruled(d, 1.6, gz, px), ruled(s + h11(rowp) * 2.4, 2.4, gs, px) * smoothstep(2.6, 5.0, 1.6 / gz)) * 0.8 * town);
        col = mix(col, uPale, 0.3 * town * (1.0 - 0.5 * step(0.7, h21(vec2(rowp, floor((s + h11(rowp) * 2.4) / 2.4))))));
        ink = max(ink, inkLine(abs(d - 6.4), gz, px) * step(0.3, fract(s / 9.0 + h11(floor(s / 9.0)))));
      } else {
        vec2 cq = vec2(s / 17.0, z / 13.0), ci = floor(cq), cf = fract(cq);
        float hc = h21(ci + 5.0), inC = step(0.08, cf.x) * step(cf.x, 0.92) * step(0.1, cf.y) * step(cf.y, 0.9);
        float plot = step(0.52, hc) * inC * (1.0 - town);
        float fur = mix(ruled(z, 0.95, gz, px), ruled(s, 0.95, gs, px), step(0.76, hc));
        vec2 eb = min(cf - vec2(0.08, 0.1), vec2(0.92, 0.9) - cf) * vec2(17.0, 13.0);
        ink = max(ink, plot * max(fur * 0.75, max(inkLine(eb.x, gs, px), inkLine(eb.y, gz, px))));
        col = mix(col, uGrey, 0.07 * plot); col = mix(col, uMal, 0.2 * plot * uTone.y * keep * step(0.3, fract(hc * 7.0)));
        // grass and pebble ticks on open ground
        vec2 tq = p / vec2(1.1, 1.5), ti = floor(tq), tf = fract(tq);
        float th = h21(ti);
        ink = max(ink, (1.0 - plot) * step(0.86, th) * inkLine(abs(tf.y - 0.5) * 1.5, gz, px * 0.9) * step(0.2, tf.x) * step(tf.x, 0.2 + 0.5 * h21(ti + 9.0)) * smoothstep(3.0, 6.0, 1.1 / gs));
        // streets running back from the river
        float st = min(min(abs(abs(s - 86.0) - 3.6), abs(abs(s - 121.0) - 3.6)), min(abs(abs(s - 161.0) - 7.3), min(abs(abs(s - 199.0) - 3.6), abs(abs(s - 262.0) - 3.6))));
        ink = max(ink, inkLine(st, gs, px) * town);
      }
      // the threshing floor: a ruled ring with spokes of swept grain
      vec2 td = p - uThresh.xy; float tr = length(td);
      ink = max(ink, inkLine(abs(tr - uThresh.z), fwp, px));
      ink = max(ink, ruled(atan(td.y, td.x + 1e-5) * 3.0, 0.5, fwp * 3.0 / max(tr, 0.5), px) * step(tr, uThresh.z - 0.6) * step(1.2, tr) * 0.7);
      ink *= pic;
    }
    if (bend > 0.01 && mz < 73.0) {
      // ---- the painting in the bend: river banks, roofs and trees in flat elevation, no three dimensions
      float gink = inkLine(abs(mz - w), gz, px * 1.1);
      if (mz > w + 3.0) {
        // the painting climbs in stages of 22 m, each with a range of hills standing out of cloud and, before and on
        // it, three rows of roofs and willows of uneven size, set half a cell along from each other, with cells left
        // empty and one oblique street left open. Roofs take an azurite-grey wash over pale walls, willow heads malachite
        float gk = bend * (1.0 - omit);
        float upc = -sp, per = floor(upc / 22.0), f = upc - 22.0 * per;
        hillRange(col, gink, f, z, 13.6, 5.8, 0.06, per * 3.7 + uSeed * 9.0, 9.0, fwp, px, gk * 0.95, 0.0, 0.0, 0.5, 0.5);
        float rr = (f - 0.6) / 6.3, rowi = floor(rr);
        vec2 cq = vec2(rr, z / 7.0 + 0.5 * rowi + per * 0.37), ci = vec2(rowi + per * 3.0, floor(cq.y));
        float hc = h21(ci + 2.0) * mix(1.2, 1.5, step(1.5, rowi)), gsc = mix(1.25, 0.82, h21(ci + 21.0));
        vec2 g = vec2((fract(cq.y) - 0.5) * 7.0 + (h21(ci + 4.0) - 0.5) * 1.0, (fract(cq.x) - 0.5) * 6.3 + (h21(ci + 8.0) - 0.5) * 0.8) * 1.38 * gsc;
        vec3 fl; float dg = glyph(g, ci, hc, fl);
        float vk = step(0.0, rowi) * step(rowi, 2.5) * step(0.07, abs(fract((upc * 0.35 + z) / 46.0) - 0.5)) * gk;
        gink = max(gink * (1.0 - max(fl.x, max(fl.y, fl.z)) * vk), inkLine(dg, fwp * 1.38 * gsc, px) * vk);
        col = mix(col, mix(mix(uAzur, uGrey, 0.25), uPale, uSnow), 0.85 * fl.x * vk);
        col = mix(col, uPale, 0.5 * fl.y * vk);
        col = mix(col, uMal, 0.8 * fl.z * vk * max(uTone.y, 0.3));
      }
      ink = mix(ink, max(ink, gink), bend);
    }
    line = max(line, ink * (1.0 - omit));
    // ---- the far end: where the silk rises to the feed roller the picture goes on in flat elevation, as a blue-green
    // landscape: three ranges of hills standing out of mist, the river winding up between them, and a reserve of
    // pale silk left round the great seal, which hangs over them like a sun. Nothing three-dimensional stands here
    if (s > 293.0 && mz < 74.5) {
      float sw = s - 299.0, dc = length(p - uBig.xy);
      // the reserve round the great seal is cut on a ruled collar of cloud, twelve lobes that turn slowly
      float ca = atan(p.y - uBig.y, p.x - uBig.x + 1e-5), cedge = dc - (uBig.z + 2.3 + 1.5 * abs(sin(ca * 6.0 + uTime * 0.03)));
      float res = smoothstep(-fwp, fwp, cedge) * (1.0 - smoothstep(42.0, 49.0, sw));
      float sd = smoothstep(6.0, 44.0, mz), wk = (1.0 - smoothstep(uFade.x * 1.35, uFade.y * 1.7, dist)) * res;
      // gold-flecked paper: small lozenges of leaf scattered over the blank silk, catching the light in turn
      vec2 gq = p / 1.7, gi = floor(gq), gf = fract(gq) - 0.5, go = (vec2(h21(gi + 71.0), h21(gi + 73.0)) - 0.5) * 0.5;
      float gh = h21(gi + 61.0), gsz = 0.1 + 0.15 * h21(gi + 67.0), gfw = fwp / 1.7;
      float fleck = step(0.5, gh) * (1.0 - smoothstep(gsz - gfw, gsz + gfw, abs(gf.x - go.x) + abs(gf.y - go.y))) * smoothstep(1.2, 2.6, gsz / gfw);
      col = mix(col, uGold, 0.95 * fleck * (0.6 + 0.4 * sin(uTime * 0.9 + gh * 40.0)) * smoothstep(296.0, 303.0, s) * (1.0 - smoothstep(uFade.x * 1.35, uFade.y * 1.7, dist)));
      float wink = 0.0;
      // (the three ranges are told apart by colour, not by strength: pale azurite, deep azurite, malachite over azurite)
      hillRange(col, wink, sw, z, 15.0 + 13.0 * sd, 13.0, 0.05, 3.0 + uSeed * 9.0, 17.0, fwp, px, wk, 1.0, 0.2, 0.3, 0.0);
      hillRange(col, wink, sw, z, 7.5 + 7.5 * sd, 9.0, 0.075, 11.0 + uSeed * 9.0, 11.5, fwp, px, wk, 1.0, 0.0, 0.4, 0.8);
      // a temple hall on each flank, below the seal, standing on the middle range: two cinnabar storeys under azurite roofs
      vec2 tg = vec2(mz - 36.0, sw - 17.0 - 5.0 * sd) / 2.2;
      vec3 tf0, tf1; float td = min(glyph(vec2(tg.x, tg.y), vec2(3.0, 5.0), 0.2, tf0), glyph(vec2(tg.x * 1.5, tg.y - 3.3), vec2(3.0, 5.0), 0.2, tf1));
      vec3 tfl = max(tf0, tf1); float tk = wk * step(abs(tg.x), 4.6) * step(-1.6, tg.y) * step(tg.y, 5.6);
      col = mix(col, mix(uAzur, uPale, uSnow), 0.95 * tfl.x * tk);
      col = mix(col, uSeal, 0.85 * tfl.y * tk);
      col = mix(col, uGold, tk * (1.0 - smoothstep(0.3 - fwp, 0.3 + fwp, length(tg - vec2(0.0, 5.45)))));
      wink = max(wink * (1.0 - max(tfl.x, tfl.y) * tk), inkLine(td, fwp * 0.55, px) * tk);
      hillRange(col, wink, sw, z, 1.6 + 2.6 * sd, 6.0, 0.11, 23.0 + uSeed * 9.0, 7.0, fwp, px, wk, 0.0, 0.0, 1.3, 1.0);
      // the river comes on up the sheet, narrowing and winding, and is lost in the mist under the seal
      float up = smoothstep(-3.0, 14.0, sw), zc = 6.5 * sin(sw * 0.3 + 0.6) * smoothstep(0.0, 6.0, sw), hw = mix(15.0, 1.4, up);
      float de = (abs(z - zc) - hw) / sqrt(1.0 + 3.8 * up), inr = 1.0 - smoothstep(-fwp, fwp, de);
      float rk = wk * (1.0 - smoothstep(13.0, 19.0, sw)) * smoothstep(-6.0, -2.0, sw);
      col = mix(col, uWater, 0.85 * inr * rk * uTone.x);
      wink *= 1.0 - inr * rk;
      float flw = ruled(z - zc, 1.7, fwp, px * 0.8) * step(0.5, fract(sw / 5.0 - uTime * 0.22 + h11(floor((z - zc) / 1.7)) * 3.0)) * inr * step(abs(z - zc), hw - 0.5);
      wink = max(wink, max(inkLine(abs(de), fwp, px), flw * 0.7) * rk);
      // the last of the town climbs the foot of the sheet: two rows of roofs and willows either side of the river
      float vq = (sw + 1.0) / 5.6, vrow = floor(vq);
      vec2 vc = vec2(vq, z / 5.8 + 0.5 * mod(vrow, 2.0)), vi = floor(vc) + 40.0;
      vec2 vg = vec2((fract(vc.y) - 0.5) * 5.8 + (h21(vi + 4.0) - 0.5) * 0.5, (fract(vc.x) - 0.5) * 5.6 + (h21(vi + 8.0) - 0.5) * 0.5) * 1.42;
      vec3 vf; float vd = glyph(vg, vi, h21(vi + 2.0) * mix(0.92, 1.25, clamp(vrow, 0.0, 1.0)), vf);
      float vk = wk * step(0.0, vrow) * step(vrow, 1.5) * step(hw + 3.2, abs(z - zc)) * step(mz, 71.0);
      col = mix(col, mix(mix(uAzur, uGrey, 0.2), uPale, uSnow), 0.9 * vf.x * vk);
      col = mix(col, uPale, 0.8 * vf.y * vk);
      col = mix(col, mix(uMal, uGrey, uSnow * 0.6), 0.85 * vf.z * vk);
      wink = max(wink * (1.0 - max(vf.x, vf.y) * vk), inkLine(vd, fwp * 1.42, px) * vk);
      // the collar itself: two ruled scalloped lines, the inner one fainter and turning the other way
      float far2 = (1.0 - smoothstep(uFade.x * 1.35, uFade.y * 1.7, dist)) * (1.0 - smoothstep(42.0, 49.0, sw));
      ${END_FRAME_R14 ? /* glsl */`// (END_FRAME_R14: a scalloped band of pale ochre between two ruled lines of cloud, and inside it the fainter line)
      col = mix(col, uOchre, 0.8 * smoothstep(-fwp, fwp, cedge) * (1.0 - smoothstep(0.85 - fwp, 0.85 + fwp, cedge)) * far2);
      wink = max(wink * (1.0 - step(cedge, 0.85) * far2), max(max(0.8 * inkLine(abs(cedge), fwp, px), 0.8 * inkLine(abs(cedge - 0.85), fwp, px)), 0.4 * inkLine(abs(dc - (uBig.z + 0.8 + 0.9 * abs(sin(ca * 6.0 + 0.26 - uTime * 0.02)))), fwp, px * 0.8)) * far2);` : /* glsl */`wink = max(wink, max(0.6 * inkLine(abs(cedge), fwp, px * 0.9), 0.4 * inkLine(abs(dc - (uBig.z + 0.8 + 0.9 * abs(sin(ca * 6.0 + 0.26 - uTime * 0.02)))), fwp, px * 0.8)) * far2);`}
      line = max(line, wink);
    }
    col = mix(col, uInk, clamp(line, 0.0, 1.0));
    // ---- seals: five small collectors' seals stamped flat, the new impression, and the great round seal
    float red = 0.0;
    for (int i = 0; i < 5; i++) {
      vec4 sl = uSeals[i]; vec2 sq = (p - sl.xy) / max(abs(sl.z), 0.1); float fs = fwp / max(abs(sl.z), 0.1);
      float sk = sl.w > 1.5 ? squareSeal(sq * vec2(1.0, 0.72), fs) * step(length(sq * vec2(1.0, 0.72)), 0.98)      // oval
               : sl.w > 0.5 ? max(squareSeal(sq * 2.0 - vec2(0.0, 1.2), fs * 2.0) * step(length(sq * 2.0 - vec2(0.0, 1.2)), 1.2), squareSeal(sq * 1.6 + vec2(0.0, 1.15), fs * 1.6) * step(length(sq * 1.6 + vec2(0.0, 1.15)), 1.2))   // gourd: two lobes and a clear waist
               : squareSeal(sq, fs);
      red = max(red, sk);
    }
    red = max(red, squareSeal((p - uStampAt.xy) / uStampAt.z, fwp / uStampAt.z) * uStampAt.w);
    vec2 bd = (p - uBig.xy); float br = length(bd), ba = atan(bd.y, bd.x + 1e-5), R = uBig.z, fr2 = fwp;
    ${END_FRAME_R14 ? /* glsl */`// (END_FRAME_R14: the great seal is cut clean, as a graphic seal: a clear outer rim, a band of squared key-fret between
    // two ruled rings (turning slowly), and the scalloped ring that holds the opening; flat cinnabar, laid after the
    // small seals with no uneven pressure)
    float big = 0.0;
    if (br < R + 1.0) {
      float rim = smoothstep(R * 0.935 - fr2, R * 0.935 + fr2, br) * (1.0 - smoothstep(R - fr2, R + fr2, br));
      float inner = 1.0 - smoothstep(-fr2, fr2, br - R * (0.7 + 0.011 * sin(ba * 16.0 - uBig.w * 2.0)));        // the ring that holds the opening
      float cwm = br * 3.14159265 / 12.0, hb = R * 0.0727, th = R * 0.0108;       // 24 keys; half the band; half a stroke
      vec2 kq = vec2((fract(ba * 12.0 / 3.14159265 + uBig.w) - 0.5) * cwm, br - R * 0.835);
      float kd = min(abs(kq.y - hb), abs(kq.y + hb));
      kd = min(kd, min(sdSeg(kq, vec2(-0.062 * R, -hb), vec2(-0.062 * R, 0.4 * hb)), sdSeg(kq, vec2(-0.062 * R, 0.4 * hb), vec2(0.032 * R, 0.4 * hb))));
      kd = min(kd, min(sdSeg(kq, vec2(0.032 * R, 0.4 * hb), vec2(0.032 * R, -0.38 * hb)), sdSeg(kq, vec2(0.032 * R, -0.38 * hb), vec2(-0.016 * R, -0.38 * hb))));
      kd = min(kd, sdSeg(kq, vec2(0.079 * R, hb), vec2(0.079 * R, -0.38 * hb)));
      big = max(max(rim, inner), 1.0 - smoothstep(th - fr2, th + fr2, kd));
    }` : /* glsl */`if (br < R + 1.0) {
      float rim = smoothstep(R * 0.93 - fr2, R * 0.93 + fr2, br) * (1.0 - smoothstep(R - fr2, R + fr2, br));
      float inner = 1.0 - smoothstep(R * 0.69 - fr2, R * 0.69 + fr2, br);                        // the ring that holds the opening
      float t1 = ba * 14.0 / 3.14159265 + uBig.w, fa = fract(t1), rr = (br - R * 0.79) / (R * 0.11);
      float fret = step(0.0, rr) * step(rr, 1.0) * max(max(step(rr, 0.22) * step(fa, 0.72), step(0.78, rr) * step(0.28, fa)), max(step(abs(fa - 0.72), 0.09) * step(rr, 0.62), step(abs(fa - 0.28), 0.09) * step(0.38, rr)));
      float cloud = 1.0 - smoothstep(R * 0.022 - fr2, R * 0.022 + fr2, abs(br - R * (0.735 + 0.018 * sin(ba * 16.0 - uBig.w * 2.0))));
      float press = 0.9 + 0.1 * smoothstep(0.25, 0.6, vnoise(p * 1.3 + 9.0));
      red = max(red, max(max(rim, inner), max(fret, cloud)) * press * 1.25);
    }`}
    float pr = 0.8 + 0.2 * smoothstep(0.25, 0.6, vnoise(p * 2.3 + 9.0));
    // (no red lies on the water: where a collector's impression falls on the river it is the same block printed in the
    // water's own deeper blue)
    float onRiver = (((mz < w + 0.12 && h < 0.03) || thrK > 0.5) ? 1.0 : 0.0) * pic;
    col = mix(col, mix(uSeal, mix(uWater, uInk, 0.5), onRiver), clamp(red, 0.0, 1.0) * pr);${END_FRAME_R14 ? `
    col = mix(col, uSeal, big);` : ''}
    gl_FragColor = vec4(col, 1.0);
  }
`;

// the dome: the same aged silk above and around the picture, a dim umber table below it
const DOME_VERT = /* glsl */`
  varying vec3 vD;
  void main() { vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); gl_Position = p; }
`;
const DOME_FRAG = /* glsl */`
  uniform vec3 uSilk, uPale, uTable, uInk, uMal, uAzur, uGold, uGrey, uTone, uFar, uMid; uniform float uTime, uSeed, uSnow, uLinePx;
  varying vec3 vD;
  ${GLSL_COMMON}
  ${GLSL_VNOISE}
  float domeRidge(vec2 dn, float k, float sd, float sharp) {
    float n1 = vnoise(dn * k + sd), n2 = vnoise(dn * k * 2.6 + sd + 5.0), n3 = vnoise(dn * k * 0.5 + sd + 9.0);
    float r = 1.0 - abs(2.0 * n1 - 1.0);
    return mix(r, r * r, sharp) * (0.4 + 0.6 * n3) + 0.2 * n2;
  }
  // one range of the landscape painted on the silk all round the scroll, in the blue-green manner: a ruled crest, a
  // wash that is malachite (snow-pale in the first-snow look) at the crest and azurite below and is left out toward the
  // foot (mist), one gold contour, hemp-fibre strokes hanging from the crest. sc / fsc: a coordinate that runs round
  // the horizon and its footprint; amp is the height of the tallest peaks
  void domeRange(inout vec3 col, inout float cover, float e, vec2 dn, float base, float amp, float k, float sd, float depth, float sharp, float fe, float sc, float fsc, float a, vec3 crestC, vec3 deepC) {
    vec2 d2 = normalize(dn + vec2(-dn.y, dn.x) * 0.004);
    float r0 = base + amp * domeRidge(dn, k, sd, sharp), r1 = base + amp * domeRidge(d2, k, sd, sharp);
    float sl = (r1 - r0) / 0.004, F = (e - r0) / sqrt(1.0 + sl * sl);
    float t = clamp((r0 - e) / depth, 0.0, 1.0), inn = 1.0 - smoothstep(-fe, fe, F);
    vec3 crest = mix(crestC, uPale, uSnow);
    float tsn = 0.2 + 0.07 * sin(sc * k * 7.0 + sd) + 0.04 * sin(sc * k * 19.0 + sd * 2.0), esn = fe / depth;
    float wm = mix(smoothstep(0.08, 0.3, t), smoothstep(tsn - esn, tsn + esn, t), uSnow);
    vec3 wash = mix(crest, deepC, wm);
    // laid boldly and flat; thinned only toward the foot, where the next range or the mist takes over
    float body = inn * (1.0 - 0.8 * smoothstep(0.6, 1.0, t)) * a;
    col = mix(col, wash, min(1.0, 0.95 * body * uTone.z));
    cover = max(cover, inn * a);
    col = mix(col, uGold, 0.8 * inkLine(abs(F + depth * 0.12), fe, uLinePx * 1.1) * a * uTone.z);
    float cell = floor(sc * k * 9.0), hh = h11(cell + sd * 13.0);
    float st = ruled(sc * k * 9.0 + 0.3 * sin(e * 40.0 + sd), 1.0, fsc * k * 9.0, uLinePx * 0.8) * step(0.4, hh) * inn * step(0.03, t) * (1.0 - smoothstep(0.1 + 0.3 * hh, 0.16 + 0.4 * hh, t));
    col = mix(col, uInk, min(1.0, max(inkLine(abs(F), fe, uLinePx), 0.75 * st) * a * 1.35));
  }
  void main() {
    vec3 d = normalize(vD + vec3(0.0, 1e-5, 0.0));
    vec2 q = d.xz / (abs(d.y) + 0.4) * 3.0 + uSeed * 7.0 + uTime * 0.0035;
    float fox = smoothstep(0.52, 0.86, vnoise(q * 1.3) * 0.7 + vnoise(q * 4.1) * 0.3);
    // the paper is luminous at the horizon, behind the roofs, and a little deeper overhead
    vec3 col = mix(mix(uPale, uSilk, 0.35), uSilk * 0.94, smoothstep(0.05, 0.75, d.y)) * (1.0 - 0.04 * fox);
    vec2 pc = floor(q * 0.7 + 3.0), pf = fract(q * 0.7 + 3.0);
    // mends: soft-edged paler patches with a faint stitched border
    vec2 pe = min(pf - vec2(0.2, 0.25), vec2(0.6, 0.6) - pf);
    float pm = min(pe.x, pe.y), has = step(0.85, h21(pc));
    col = mix(col, mix(uSilk, uPale, 0.5), 0.1 * has * smoothstep(0.0, 0.04, pm));
    float along = pe.x < pe.y ? pf.y : pf.x;
    col *= 1.0 - 0.07 * has * (1.0 - smoothstep(0.004, 0.009, abs(pm - 0.025))) * step(0.5, fract(along * 26.0));
    float cr = abs(fract(q.x * 0.16 + q.y * 0.05) - 0.5);
    col *= 1.0 - 0.05 * (1.0 - smoothstep(0.0, 0.006, cr));
    // ---- the landscape beyond the town: three ranges standing one behind another all round the scroll, the furthest
    // the tallest and palest, with two bands of mist (bare silk) drifting across them. Down the axis of the scroll,
    // where the great seal and the feed roller hang, the peaks stand lower and leave the silk open
    float lxz = max(length(d.xz), 1e-4), e = d.y / lxz, fe = max(length(vec2(dFdx(e), dFdy(e))), 1e-6);
    vec2 dn = d.xz / lxz;
    vec2 fdn = vec2(length(vec2(dFdx(dn.x), dFdy(dn.x))), length(vec2(dFdx(dn.y), dFdy(dn.y))));
    float useX = step(abs(dn.x), abs(dn.y)), sc = mix(dn.y, dn.x, useX), fsc = max(mix(fdn.y, fdn.x, useX), 1e-6);
    float open = 1.0 - 0.5 * smoothstep(0.9, 0.995, dn.x);
    float foot = smoothstep(0.012, 0.085, e) * (1.0 - smoothstep(0.62, 0.8, e));
    float m1 = 0.125 + 0.03 * sin(dn.x * 5.0 + uTime * 0.021 + uSeed * 6.0) + 0.02 * sin(dn.y * 7.0 - uTime * 0.016 + 2.0);
    float m2 = 0.27 + 0.04 * sin(dn.y * 4.0 + uTime * 0.017 + 1.0) + 0.025 * sin(dn.x * 6.0 - uTime * 0.012 + uSeed * 9.0);
    float mist = smoothstep(0.006, 0.032, abs(e - m1)) * (0.45 + 0.55 * smoothstep(0.008, 0.036, abs(e - m2)));
    // three ranges told apart by colour: pale azurite far off, deep azurite, then malachite over azurite. No crest of
    // the far range stands above e = 0.42. The mist is laid over them afterwards as bands of luminous reserve
    float ak = foot * 0.95, cover = 0.0;
    domeRange(col, cover, e, dn, 0.12, 0.3 * open, 3.1, 2.0 + uSeed * 5.0, 0.22, 0.45, fe, sc, fsc, ak, mix(uFar, uMal, 0.3), uFar);
    domeRange(col, cover, e, dn, 0.085, 0.26 * open, 5.0, 14.0 + uSeed * 5.0, 0.15, 0.45, fe, sc, fsc, ak, mix(uMid, uMal, 0.55), uMid);
    domeRange(col, cover, e, dn, 0.035, 0.15 * (0.6 + 0.4 * open), 8.0, 27.0 + uSeed * 5.0, 0.085, 0.2, fe, sc, fsc, ak, uMal, mix(uAzur, uMal, 0.35));
    col = mix(col, uPale, 0.8 * (1.0 - mist) * cover);
    col = mix(col, uTable, 1.0 - smoothstep(-0.03, 0.005, d.y));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// dab-figures that walk: each goes to and fro between two points of a lane (the hero's DAB_FRAG draws them)
const WALK_VERT = /* glsl */`
  attribute vec4 aA; attribute vec4 aB; attribute vec4 aInfo; attribute vec3 aCol;
  uniform float uTime;
  varying vec2 vQ; varying vec3 vCol; varying float vHat; varying float vDist; varying vec3 vW;
  #include <fog_pars_vertex>
  ${GLSL_RIPPLE}
  void main() {
    vec3 ab = aB.xyz - aA.xyz;
    float len = max(length(ab), 0.01), t = fract(uTime * aB.w / len * 0.5 + aA.w), tri = 1.0 - abs(2.0 * t - 1.0);
    if (aInfo.z > 0.5) tri = t;                                      // processions go one way and come round again
    vec3 base = aA.xyz + ab * tri;
    base.y += 0.07 * abs(sin(uTime * 4.6 + aA.w * 40.0)) * step(0.001, aB.w) + 0.03 * sin(uTime * 1.3 + aA.w * 17.0);
    float h = aInfo.x * (aInfo.z > 0.5 ? smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.97, 1.0, t)) : 1.0);
    vec3 loc = base + vec3(0.0, position.y * h, 0.0);
    vec4 wp = modelMatrix * vec4(loc, 1.0);
    vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
    wp.xyz += right * (position.x * h * 0.46 + aInfo.w * position.y);
    wp.y += rippleY(wp.x); vW = wp.xyz;
    vQ = vec2(position.x * 0.46, position.y); vCol = aCol; vHat = aInfo.y;
    vec4 mvPosition = viewMatrix * wp;
    vDist = length(mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

// cards: animals in side view, ducks, swallows, paper lanterns and kites, each one instanced quad whose
// figure is ruled in the fragment shader. aK = (kind, size, variant, phase)
//   kind 0 walker A -> B (variant 0 donkey with panniers, 1 camel, 2 ox, 3 pig)   1 duck bobbing at A
//   kind 2 swallow weaving about A with amplitudes B   3 lantern at A   4 kite at A   5 snowflake falling from A
//   kind 6 swallow flying A -> B.xyz, keyed to u (starts at u = B.w)
//   kind 7 crane: variant 0 flies A -> B.xyz at B.w m/s and comes round again; variant 1 circles A (radii B.xyz, rate B.w)
const CARD_VERT = /* glsl */`
  attribute vec3 aA; attribute vec4 aB; attribute vec4 aK; attribute vec3 aCol;
  uniform float uTime, uU;
  varying vec2 vQ; varying vec4 vK; varying vec3 vCol; varying float vGait; varying vec3 vW;
  ${GLSL_RIPPLE}
  void main() {
    float kind = aK.x, size = aK.y, ph = aK.w;
    vec3 base = aA; float flip = 1.0, sc = 1.0, gait = 0.0, piv = 0.0; vec2 rot = vec2(1.0, 0.0);
    vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0)), up = vec3(0.0, 1.0, 0.0);
    if (kind < 0.5) {
      vec3 ab = aB.xyz - aA; float len = max(length(ab), 0.01), t = fract(uTime * aB.w / len + ph);
      base = aA + ab * t; sc = smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.97, 1.0, t));
      flip = dot(right, ab) < 0.0 ? -1.0 : 1.0; gait = uTime * aB.w * 2.6 / max(size, 0.2) + ph * 40.0;
      base.y += 0.04 * size * abs(sin(gait));
    } else if (kind < 1.5) {
      base.x += 0.8 * sin(uTime * 0.21 + ph * 9.0); base.z += 0.6 * sin(uTime * 0.17 + ph * 5.0);
      base.y += 0.05 * sin(uTime * 1.9 + ph * 30.0); flip = sin(uTime * 0.11 + ph * 20.0) > 0.0 ? 1.0 : -1.0;
      gait = 0.12 * sin(uTime * 1.9 + ph * 30.0);
    } else if (kind < 2.5) {
      float a = uTime * aB.w + ph * 6.2831;
      base = aA + vec3(aB.x * sin(a), aB.y * sin(a * 2.3 + ph * 11.0), aB.z * sin(a * 1.7 + ph * 5.0));
      up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      gait = sin(uTime * 13.0 + ph * 50.0); flip = cos(a) * aB.x * right.x + cos(a * 1.7 + ph * 5.0) * 1.7 * aB.z * right.z < 0.0 ? -1.0 : 1.0;
    } else if (kind < 3.5) {
      gait = 0.12 * sin(uTime * 1.1 + ph * 30.0);
    } else if (kind < 4.5) {
      base += vec3(1.6 * sin(uTime * 0.31 + ph * 8.0), 1.1 * sin(uTime * 0.47 + ph * 3.0), 1.3 * sin(uTime * 0.23 + ph * 12.0));
      gait = 0.25 * sin(uTime * 0.9 + ph * 20.0);
    } else if (kind < 5.5) {                                          // a snowflake: an unpainted pale dot, falling
      base.y = mod(aA.y - uTime * aB.w, 26.0);
      base.x += 0.9 * sin(uTime * 0.5 + ph * 30.0); base.z += 0.7 * sin(uTime * 0.37 + ph * 17.0);
      sc = clamp(length(base - cameraPosition) / 16.0, 0.03, 1.0);   // a flake by the eye stays a dot of a few pixels
      up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    } else if (kind > 6.5) {                                          // a crane, wings beating slowly
      up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      vec3 vel = aB.xyz - aA;
      if (aK.z < 0.5) {
        float t = fract(uTime * aB.w / max(length(vel), 0.01) + ph);
        base = aA + vel * t; base.y += 1.1 * sin(uTime * 0.45 + ph * 40.0);
        sc = smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(0.96, 1.0, t));
      } else {
        // circling the great seal in the plane of the sheet, seen from above with both wings spread: the card is turned
        // to the bird's heading and held to a size on screen as the eye comes close. The ring keeps its size for the whole
        // flight: the birds leave the frame as the eye closes on the seal, by perspective alone
        float a = uTime * aB.w + ph * 6.2831;
        base = aA + vec3(aB.x * sin(a), aB.y * sin(a), aB.z * cos(a));
        vel = vec3(aB.x * cos(a), aB.y * cos(a), -aB.z * sin(a)) * sign(aB.w);
        sc = clamp(length(base - cameraPosition) / 40.0, 0.4, 1.0);
        rot = normalize(vec2(dot(right, vel), dot(up, vel)) + vec2(1e-4, 0.0)); piv = 0.7;
      }
      gait = sin(uTime * 3.6 + ph * 50.0); flip = aK.z > 0.5 ? 1.0 : dot(right, vel) < 0.0 ? -1.0 : 1.0;
    } else {                                                          // a swallow flying from A to B as u runs from aB.w over the next 0.075
      float t = clamp((uU - aB.w) / 0.075, 0.0, 1.0);
      base = mix(aA, aB.xyz, t) + (1.0 - t) * vec3(0.0, 0.5 * sin(uTime * 2.1 + ph * 9.0), 0.9 * sin(uTime * 1.3 + ph * 5.0));
      sc = step(0.001, t) * step(t, 0.995);
      up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
      gait = sin(uTime * 13.0 + ph * 50.0); flip = dot(right, aB.xyz - aA) < 0.0 ? -1.0 : 1.0;
    }
    // a swallow far off is drawn a little larger so that it stays a bird of several pixels, and beyond 105 m it is left out
    if ((kind > 1.5 && kind < 2.5) || (kind > 5.5 && kind < 6.5)) { float dcam = length(base - cameraPosition); sc *= clamp(dcam / 45.0, 1.0, 2.4) * (1.0 - smoothstep(105.0, 140.0, dcam)); }
    vec2 qc = vec2(position.x * 1.7, position.y * 1.4);
    if (kind > 2.5 && kind < 3.5) qc.x += gait * (1.4 - qc.y);       // lanterns swing from their hooks
    qc = vec2(rot.x * qc.x - rot.y * (qc.y - piv), rot.y * qc.x + rot.x * (qc.y - piv)) + vec2(0.0, piv * (1.0 - step(0.5, piv)));
    vec4 wp = modelMatrix * vec4(base, 1.0);
    wp.xyz += (right * qc.x * flip + up * qc.y) * size * sc;
    wp.y += rippleY(wp.x); vW = wp.xyz;
    vQ = vec2(position.x * 1.7, position.y * 1.4); vK = aK; if (kind > 5.5 && kind < 6.5) vK.x = 2.0; vCol = aCol; vGait = gait;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const CARD_FRAG = /* glsl */`
  uniform vec3 uInk, uSilk, uGrey, uAzur, uSeal, uGold; uniform float uLinePx; uniform vec2 uFade;
  varying vec2 vQ; varying vec4 vK; varying vec3 vCol; varying float vGait; varying vec3 vW;
  ${GLSL_COMMON}
  ${GLSL_MIST}
  ${GLSL_VNOISE}
  float ell(vec2 p, vec2 c, vec2 r) { vec2 q = (p - c) / r; return (length(q) - 1.0) * min(r.x, r.y); }
  void main() {
    vec2 q = vQ; float kind = floor(vK.x + 0.5), var = floor(vK.z + 0.5), px = uLinePx;
    float fw = max(length(vec2(dFdx(q.y), dFdy(q.y))), 1e-6);
    float d = 9.0, inkOnly = 9.0, dark = 9.0, rug = 9.0;
    if (kind == 0.0) {
      float camel = step(0.5, var) * step(var, 1.5), pig = step(2.5, var), leg = mix(0.5, 0.26, pig);
      d = ell(q, vec2(0.0, leg + 0.17), vec2(0.42 + 0.06 * pig, 0.19 + 0.03 * pig));
      vec2 hd = mix(vec2(0.56, leg + 0.34), vec2(0.6, leg + 0.72), camel); hd = mix(hd, vec2(0.52, leg + 0.14), pig);
      // the neck in two segments: straight for a donkey, ox or pig; a deep curve (down, forward, up) for a camel
      vec2 nb = vec2(0.34, leg + 0.22), nk = mix(0.5 * (nb + hd), vec2(0.6, leg + 0.2), camel);
      d = min(d, min(sdSeg(q, nb, nk), sdSeg(q, nk, hd)) - mix(0.065, 0.055, camel));
      d = min(d, ell(q, hd + vec2(0.07, -0.03), vec2(0.13, 0.085)));
      d = min(d, sdSeg(q, hd + vec2(-0.02, 0.06), hd + vec2(-0.07, 0.2 - 0.14 * pig)) - 0.022);            // ear
      d = min(d, mix(9.0, min(ell(q, vec2(-0.14, leg + 0.4), vec2(0.12, 0.13)), ell(q, vec2(0.13, leg + 0.4), vec2(0.12, 0.13))), camel));
      float sw = 0.13 * sin(vGait), sw2 = 0.13 * sin(vGait + 3.14159);
      d = min(d, min(sdSeg(q, vec2(0.3, leg + 0.08), vec2(0.3 + sw, 0.0)), sdSeg(q, vec2(0.24, leg + 0.08), vec2(0.24 + sw2, 0.0))) - 0.032);
      d = min(d, min(sdSeg(q, vec2(-0.3, leg + 0.08), vec2(-0.3 + sw2, 0.0)), sdSeg(q, vec2(-0.24, leg + 0.08), vec2(-0.24 + sw, 0.0))) - 0.032);
      inkOnly = sdSeg(q, vec2(-0.42, leg + 0.2), vec2(-0.5, leg - 0.05 + 0.04 * sin(vGait * 0.5)));       // tail
      vec2 pb = abs(q - vec2(-0.02, leg + 0.4)) - vec2(0.2, 0.11);                                          // panniers / load
      dark = mix(9.0, max(pb.x, pb.y), step(var, 0.5));
      // a camel carries a pack between its humps (dark) over a saddle cloth that hangs down the flank (cinnabar or azurite)
      vec2 pk = abs(q - vec2(0.0, leg + 0.52)) - vec2(0.17, 0.1), sc2 = abs(q - vec2(0.0, leg + 0.27)) - vec2(0.2, 0.15);
      dark = min(dark, mix(9.0, max(pk.x, pk.y), camel));
      rug = mix(9.0, max(sc2.x, sc2.y), camel);
      dark = min(dark, mix(9.0, sdSeg(q, vec2(0.5, leg + 0.52), vec2(0.62, leg + 0.44)) - 0.03, step(1.5, var) * step(var, 2.5)));   // ox horn
    } else if (kind == 1.0) {
      d = min(ell(q, vec2(-0.05, 0.2), vec2(0.4, 0.17)), ell(q, vec2(0.36, 0.5 + vGait), vec2(0.12, 0.1)));
      d = min(d, sdSeg(q, vec2(0.26, 0.26), vec2(0.34, 0.46 + vGait)) - 0.05);
      inkOnly = min(sdSeg(q, vec2(0.46, 0.49 + vGait), vec2(0.58, 0.47 + vGait)), sdSeg(q, vec2(-0.7, 0.04), vec2(0.7, 0.04)) + 0.02 * step(0.5, fract(q.x * 3.0)));
    } else if (kind == 2.0) {
      // a swallow as the painters dab it: body along its flight, two swept wings that beat, a forked tail
      float wv = 0.72 + 0.28 * vGait, ay = abs(q.y - 0.7);
      vec2 qs = vec2(q.x, ay);
      dark = sdSeg(q, vec2(-0.14, 0.7), vec2(0.2, 0.7)) - 0.05;
      dark = min(dark, sdSeg(qs, vec2(0.08, 0.0), vec2(-0.02, 0.22 * wv)) - 0.04);
      dark = min(dark, sdSeg(qs, vec2(-0.02, 0.22 * wv), vec2(-0.3, 0.52 * wv)) - 0.022);
      dark = min(dark, sdSeg(qs, vec2(-0.14, 0.0), vec2(-0.44, 0.1)) - 0.016);
    } else if (kind == 3.0) {
      d = ell(q, vec2(0.0, 0.62), vec2(0.34, 0.4));
      inkOnly = min(sdSeg(q, vec2(0.0, 1.02), vec2(0.0, 1.4)), min(sdSeg(q, vec2(-0.13, 1.0), vec2(0.13, 1.0)), sdSeg(q, vec2(-0.13, 0.23), vec2(0.13, 0.23))));
      inkOnly = min(inkOnly, sdSeg(q, vec2(0.0, 0.22), vec2(0.03, 0.0)));
    } else if (kind == 5.0) {
      d = length(q - vec2(0.0, 0.7)) - 0.3;
    } else if (kind == 7.0 && var > 0.5) {
      // a crane seen from above, as on a roundel: both wings spread and swept, ink-black primaries, the neck stretched
      // out ahead in a thin S, a cinnabar crown, two hair-line legs trailing behind a short dark tail
      float ay = abs(q.y - 0.7), wl = 0.86 + 0.14 * vGait;
      vec2 qs = vec2(q.x, ay), wr = vec2(0.06, 0.03), wm = vec2(0.02 - 0.05 * vGait, 0.3 * wl), wt = vec2(-0.16 - 0.06 * vGait, 0.62 * wl);
      d = min(ell(q, vec2(-0.02, 0.7), vec2(0.2, 0.062)), min(sdSeg(q, vec2(0.15, 0.7), vec2(0.38, 0.716)), sdSeg(q, vec2(0.38, 0.716), vec2(0.6, 0.7))) - 0.02);
      d = min(d, ell(q, vec2(0.64, 0.7), vec2(0.05, 0.034)));
      float tw = clamp(dot(qs - wr, wm - wr) / dot(wm - wr, wm - wr), 0.0, 1.0), tw2 = clamp(dot(qs - wm, wt - wm) / dot(wt - wm, wt - wm), 0.0, 1.0);
      d = min(d, min(sdSeg(qs, wr, wm) - mix(0.1, 0.075, tw), sdSeg(qs, wm, wt) - mix(0.075, 0.03, tw2)));
      dark = min(sdSeg(qs, mix(wm, wt, 0.45) - vec2(0.035, 0.0), wt - vec2(0.03, 0.0)) - mix(0.05, 0.026, tw2), sdSeg(q, vec2(-0.2, 0.7), vec2(-0.3, 0.7)) - 0.032);
      dark = min(dark, sdSeg(q, vec2(0.68, 0.7), vec2(0.8, 0.7)) - 0.011);
      inkOnly = min(sdSeg(qs, vec2(-0.28, 0.012), vec2(-0.66, 0.02)), sdSeg(qs, vec2(-0.12, 0.2 * wl), vec2(0.0, 0.26 * wl)));
      rug = length(q - vec2(0.635, 0.7)) - 0.024;
    } else if (kind == 7.0) {
      // a crane in flight, from the side: a slim pale body, the neck stretched out ahead in a thin S, one swept and
      // tapered wing beating (ink-black primaries) and the far wing behind it, a cinnabar crown, two hair-line legs
      vec2 wr = vec2(0.03, 0.73), wt = vec2(-0.2, 0.73 + 0.5 * vGait), wm = mix(wr, wt, 0.5) + vec2(0.05, 0.03 * vGait);
      d = min(ell(q, vec2(0.0, 0.7), vec2(0.27, 0.07)), min(sdSeg(q, vec2(0.22, 0.715), vec2(0.42, 0.775)), sdSeg(q, vec2(0.42, 0.775), vec2(0.63, 0.757))) - 0.02);
      d = min(d, ell(q, vec2(0.68, 0.762), vec2(0.052, 0.036)));
      float tw = clamp(dot(q - wr, wm - wr) / dot(wm - wr, wm - wr), 0.0, 1.0), tw2 = clamp(dot(q - wm, wt - wm) / max(dot(wt - wm, wt - wm), 1e-4), 0.0, 1.0);
      d = min(d, min(sdSeg(q, wr, wm) - mix(0.085, 0.065, tw), sdSeg(q, wm, wt) - mix(0.065, 0.026, tw2)));
      d = min(d, sdSeg(q, vec2(0.12, 0.73), vec2(0.17, 0.73 + 0.36 * vGait)) - 0.035);                    // the far wing
      dark = min(sdSeg(q, mix(wm, wt, 0.35) - vec2(0.04, 0.0), wt - vec2(0.035, 0.0)) - mix(0.045, 0.022, tw2), sdSeg(q, vec2(-0.25, 0.7), vec2(-0.35, 0.69)) - 0.03);
      dark = min(dark, sdSeg(q, vec2(0.72, 0.762), vec2(0.84, 0.752)) - 0.011);
      inkOnly = min(sdSeg(q, vec2(-0.26, 0.695), vec2(-0.74, 0.672)), sdSeg(q, vec2(-0.26, 0.68), vec2(-0.71, 0.652)));
      rug = length(q - vec2(0.672, 0.792)) - 0.026;
    } else {
      d = abs(q.x) / 0.5 + abs(q.y - 0.86) / 0.52 - 1.0; d *= 0.36;
      inkOnly = min(sdSeg(q, vec2(-0.5, 0.86), vec2(0.5, 0.86)), sdSeg(q, vec2(0.0, 0.34), vec2(0.0, 1.38)));
      inkOnly = min(inkOnly, abs(q.x - 0.07 * sin(q.y * 16.0 + vGait * 6.0)) + step(0.34, q.y) * 9.0);
    }
    float body = 1.0 - smoothstep(-0.5, 0.5, d / fw), edge = (1.0 - smoothstep(px * 0.5 - 0.5, px * 0.5 + 0.5, abs(d) / fw)) * (kind == 5.0 ? 0.0 : 1.0);
    float ln = max(edge, 1.0 - smoothstep(px * 0.5 - 0.5, px * 0.5 + 0.5, inkOnly / fw));
    float dk = 1.0 - smoothstep(-0.5, 0.5, dark / fw);
    float a = max(body, max(ln, dk));
    if (a < 0.5 || clipped(vW)) discard;
    float rg = 1.0 - smoothstep(-0.5, 0.5, rug / fw);
    vec3 fillc = mix(vCol, mix(uSeal, uAzur, step(0.5, fract(vK.w * 7.3)) * (kind == 7.0 ? 0.0 : 1.0)), rg);
    // a lantern is banded in gold at its crown and foot; a snowflake keeps a thin grey ring so that it reads on pale paper
    if (kind == 3.0) fillc = mix(fillc, uGold, step(0.29, abs(q.y - 0.62)));
    if (kind == 5.0) fillc = mix(fillc, mix(uGrey, vCol, 0.3), smoothstep(-1.7, -0.5, d / fw));
    ln = max(ln, (1.0 - smoothstep(px * 0.5 - 0.5, px * 0.5 + 0.5, abs(rug) / fw)));
    vec3 col = mix(fillc, uInk, max(ln, dk * 0.86));
    float dist = length(cameraPosition - vW);
    col = mix(col, uSilk, max(smoothstep(uFade.x, uFade.y, dist), mistAt(vW, dist)));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// what a moored hull lays on the water round itself: level strokes of its own ochre close in, of deeper wash further
// out, broken where ripples cross them. One instanced quad per boat, lying just over the silk. aBoat = (x, z, yaw, scale)
const REFL_VERT = /* glsl */`
  attribute vec4 aBoat;
  varying vec2 vQ; varying vec3 vW; varying float vPh;
  ${GLSL_RIPPLE}
  void main() {
    float c = cos(aBoat.z), sn = sin(aBoat.z);
    vec2 l = position.xz * vec2(5.6, 16.0) * aBoat.w;
    vec3 wp = vec3(aBoat.x + l.x * c + l.y * sn, 0.05, aBoat.y - l.x * sn + l.y * c);
    wp.y += rippleY(wp.x);
    vQ = position.xz * vec2(5.6, 16.0); vW = wp; vPh = fract(aBoat.x * 0.37 + aBoat.y * 0.61) * 9.0;
    gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  }
`;
const REFL_FRAG = /* glsl */`
  uniform vec3 uInk, uSilk, uPale, uWater, uHull; uniform float uTime; uniform vec2 uFade;
  varying vec2 vQ; varying vec3 vW; varying float vPh;
  ${GLSL_COMMON}
  ${GLSL_MIST}
  void main() {
    vec2 q = vQ;
    float fw = max(max(length(vec2(dFdx(q.x), dFdy(q.x))), length(vec2(dFdx(q.y), dFdy(q.y)))), 1e-6);
    float ty = abs(q.y) / 12.5, hb = 2.75 * (1.0 - 0.52 * ty * ty * ty);
    float dh = max(abs(q.x) - hb, abs(q.y) - 12.5);
    float row = floor(q.x / 0.42), gapK = 1.0 - smoothstep(0.1, 0.32, fw);
    float gap = step(0.42 + 0.3 * clamp(dh / 2.4, 0.0, 1.0), h21(vec2(row + vPh, floor(q.y / 1.5 + h11(row + vPh) * 4.0 + uTime * 0.3 * (h11(row + 3.0) - 0.5)))));
    float a = (1.0 - smoothstep(1.5, 2.5, dh + 0.5 * sin(q.y * 1.3 + uTime * 1.2 + vPh))) * (1.0 - gap * gapK) * mix(1.0, step(0.4, fract(q.x / 0.42 + 0.2 * sin(q.y * 1.7 + uTime * 1.4))), gapK);
    float dist = length(cameraPosition - vW);
    a *= 0.55 * (1.0 - max(smoothstep(uFade.x, uFade.y, dist), mistAt(vW, dist)));
    if (a < 0.01 || clipped(vW)) discard;
    vec3 col = mix(mix(uHull, uPale, 0.3), mix(uWater, uInk, 0.38), smoothstep(0.5, 1.0, dh));
    gl_FragColor = vec4(col, a);
  }
`;

// ---------------------------------------------------------------------------------------------------------
// builders: everything is accumulated with the hero's ruled-ink accumulator. Prototypes are built at the
// origin facing +Z (toward the river) and instanced.
const _n = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3();
// a quad whose front is turned toward `hint`
function oq(acc, a, b, c, d, hint, mat, pat, o) {
  _n.copy(_e1.subVectors(b, a)).cross(_e2.subVectors(d, a));
  if (_n.dot(hint) < 0) acc.quad(b, a, d, c, mat, pat, o); else acc.quad(a, b, c, d, mat, pat, o);
}
// ridge along x. Tiles are ruled down the slope; thatch ticks hang down it. hip > 0 pulls the ridge ends in.
function roof(acc, cx, cz, w, d, y0, rise, over, mat, pat, o = {}) {
  const x0 = cx - w / 2 - over, x1 = cx + w / 2 + over, hip = o.hip || 0, top = y0 + rise, drop = o.drop ?? 0.35;
  const trim = o.trim || mat, eave = o.eave || trim, ridge = o.ridge || trim, off = { edges: [0, 0, 0, 0] }, DOWN = V(0, -1, 0);
  for (const sg of [-1, 1]) {
    const ze = cz + sg * (d / 2 + over), zw = cz + sg * d / 2, hint = V(0, 1, sg * 0.01), ye = y0 - drop;
    if (o.thatch) oq(acc, V(x0, ye, ze), V(x1, ye, ze), V(x1 - hip, top, cz), V(x0 + hip, top, cz), hint, mat, pat, { u0: 0, v0: 0 });
    else oq(acc, V(x1, ye, ze), V(x1 - hip, top, cz), V(x0 + hip, top, cz), V(x0, ye, ze), hint, mat, pat, { u0: 0, v0: 0, lv: x1 - x0 });
    acc.beam(V(x0, ye - 0.06, ze), V(x1, ye - 0.06, ze), 0.16, 0.2, eave, [PAT.none], { noEnds: true });      // eaves board
    // the soffit, from the wall head out to the eave: it looks down and takes the deep wash of shade
    oq(acc, V(x0, ye, ze), V(x1, ye, ze), V(x1 - over, y0, zw), V(x0 + over, y0, zw), DOWN, trim, [PAT.none], off);
    // and the eave's shade on the wall under it: a band of deeper wash with no line round it
    if (o.wall) oq(acc, V(cx - w / 2, y0 - 1.1, zw + sg * 0.015), V(cx + w / 2, y0 - 1.1, zw + sg * 0.015), V(cx + w / 2, y0, zw + sg * 0.015), V(cx - w / 2, y0, zw + sg * 0.015), V(0, 0, sg), o.wall, [PAT.none], { edges: [0, 0, 0, 0], col: o.wall.band });
  }
  for (const sg of [-1, 1]) {
    const xe = sg > 0 ? x1 : x0, xr = xe - sg * hip, zf = cz + d / 2 + over, zb = cz - d / 2 - over, xg = xe - sg * over;
    if (hip > 0) {
      const ap = V(xr, top, cz);
      if (o.thatch) oq(acc, V(xe, y0 - drop, zf), V(xe, y0 - drop, zb), ap, ap.clone(), V(sg, 1, 0), mat, pat, { u0: 0, v0: 0 });
      else oq(acc, V(xe, y0 - drop, zf), ap, ap.clone(), V(xe, y0 - drop, zb), V(sg, 1, 0), mat, pat, { u0: 0, v0: 0, lv: zf - zb });
      oq(acc, V(xe, y0 - drop, zf), V(xe, y0 - drop, zb), V(xg, y0, cz - d / 2), V(xg, y0, cz + d / 2), DOWN, trim, [PAT.none], off);
    } else {
      const ap = V(xg, top - 0.02, cz);
      oq(acc, V(xg, y0, cz + d / 2), V(xg, y0, cz - d / 2), ap, ap.clone(), V(sg, 0, 0), o.gable || mat, o.gablePat || [PAT.none], { u0: 0, v0: 0 });
    }
    if (o.wall) oq(acc, V(xg + sg * 0.015, y0 - 1.1, cz - d / 2), V(xg + sg * 0.015, y0 - 1.1, cz + d / 2), V(xg + sg * 0.015, y0, cz + d / 2), V(xg + sg * 0.015, y0, cz - d / 2), V(sg, 0, 0), o.wall, [PAT.none], { edges: [0, 0, 0, 0], col: o.wall.band });
  }
  acc.beam(V(x0 + hip - 0.25, top + 0.1, cz), V(x1 - hip + 0.25, top + 0.1, cz), 0.3, 0.36, ridge);
  if (o.finials) for (const sg of [-1, 1]) acc.box((sg > 0 ? x1 - hip : x0 + hip) + sg * 0.2, top + 0.78, cz, 0.6, 1.2, 0.6, o.finialMat || trim, [PAT.none], { taper: 0.4 });
}
// the wash of shade a building lays on the ground on the side away from the light: no line round it
function groundShade(acc, w, d, T) {
  oq(acc, V(w / 2, 0.06, d / 2), V(w / 2 + 1.6, 0.06, d / 2 - 1.1), V(w / 2 + 1.6, 0.06, -d / 2 - 1.1), V(w / 2, 0.06, -d / 2), V(0, 1, 0), T.plaster, [PAT.none], { edges: [0, 0, 0, 0], col: T.ground });
}
// a storeyed tower on a square plan: each storey a plaster core with lattice windows behind cinnabar columns and a
// gallery rail, under a hipped roof with a gold ridge; a gold spire of rings on the last. widths: the storeys from the ground up
function pagoda(acc, x, z, y0, widths, sh, T) {
  const tile = [PAT.tiles, 1, 0.46]; let y = y0;
  for (let i = 0; i < widths.length; i++) {
    const w = widths[i], h = sh * (i === 0 ? 1.15 : 1), core = w - 1.8, n = w > 6.4 ? 3 : 2, last = i === widths.length - 1, hw = w / 2 - 0.3;
    acc.box(x, y + h / 2, z, core, h, core, T.plaster, [PAT.none], { noTop: true });
    for (let a = 0; a <= n; a++) for (let b = 0; b <= n; b++) {
      if (a > 0 && a < n && b > 0 && b < n) continue;
      const px = x - hw + (a * 2 * hw) / n, pz = z - hw + (b * 2 * hw) / n;
      acc.tube(V(px, y, pz), V(px, y + h, pz), 0.24, 0.21, T.lacquer, [PAT.none], { sides: 6, caps: false });
    }
    for (const sg of [-1, 1]) {
      const c = core / 2 + 0.03, wl = core / 2 - 0.5;
      acc.quad(V(x - wl, y + 1.0, z + sg * c), V(x + wl, y + 1.0, z + sg * c), V(x + wl, y + h - 0.6, z + sg * c), V(x - wl, y + h - 0.6, z + sg * c), T.rail, [PAT.lattice, 0.34, 0.34], { double: true });
      acc.quad(V(x + sg * c, y + 1.0, z - wl), V(x + sg * c, y + 1.0, z + wl), V(x + sg * c, y + h - 0.6, z + wl), V(x + sg * c, y + h - 0.6, z - wl), T.rail, [PAT.lattice, 0.34, 0.34], { double: true });
      acc.quad(V(x - hw, y, z + sg * hw), V(x + hw, y, z + sg * hw), V(x + hw, y + 1.0, z + sg * hw), V(x - hw, y + 1.0, z + sg * hw), T.rail, [PAT.lattice, 0.4, 0.4], { double: true, u0: 0 });
      acc.quad(V(x + sg * hw, y, z - hw), V(x + sg * hw, y, z + hw), V(x + sg * hw, y + 1.0, z + hw), V(x + sg * hw, y + 1.0, z - hw), T.rail, [PAT.lattice, 0.4, 0.4], { double: true, u0: 0 });
      acc.beam(V(x - hw, y + h - 0.2, z + sg * hw), V(x + hw, y + h - 0.2, z + sg * hw), 0.26, 0.36, T.lacquer);
      acc.beam(V(x + sg * hw, y + h - 0.2, z - hw), V(x + sg * hw, y + h - 0.2, z + hw), 0.26, 0.36, T.lacquer);
    }
    const over = 1.3 + 0.1 * w, rise = last ? sh * 0.8 : sh * 0.46, hip = w / 2 + over - 0.3;
    roof(acc, x, z, w, w, y + h + 0.15, rise, over, T.tile, tile, { hip, trim: T.beam, ridge: T.ridge, eave: T.eave, drop: 0.55 });
    if (last) y += h + 0.15 + rise; else y += h + 0.05 + rise * (1 - (widths[i + 1] / 2) / (w / 2 + over));
  }
  acc.tube(V(x, y - 0.2, z), V(x, y + sh * 1.15, z), 0.2, 0.06, T.gold, [PAT.none], { sides: 6 });
  for (let k = 0; k < 4; k++) acc.tube(V(x, y + 0.5 + k * sh * 0.2, z), V(x, y + 0.72 + k * sh * 0.2, z), 0.66 - 0.13 * k, 0.6 - 0.13 * k, T.gold, [PAT.none], { sides: 8 });
  return y + sh * 1.15;
}
// a tall pine: a bare trunk and flat tiers of needles, alternately in the lit and the shaded wash
function protoPine(acc, rng, T) {
  const h = rng.range(15, 19), lean = rng.range(-0.8, 0.8), n = 6;
  acc.tube(V(0, 0, 0), V(lean * 0.5, h * 0.5, 0), 0.5, 0.36, T.bark, [PAT.none], { sides: 6, caps: false });
  acc.tube(V(lean * 0.5, h * 0.5, 0), V(lean, h, 0), 0.36, 0.14, T.bark, [PAT.none], { sides: 6, caps: false });
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1), y = h * (0.42 + 0.56 * t), r = (4.6 - 3.0 * t) * rng.range(0.85, 1.15), ox = lean * (0.42 + 0.56 * t) + rng.range(-0.9, 0.9) * (1 - t), oz = rng.range(-0.9, 0.9) * (1 - t);
    acc.cone(ox, y, oz, r, 1.5, 7, T.pine, { phase: rng() * 6, col: k % 2 ? T.pine.shade : T.pine.lit });
    acc.cone(ox, y - 0.05, oz, r * 0.96, -0.5, 7, T.pine, { phase: rng() * 6, col: T.pine.deep });
  }
}
// the peach tree in blossom by the well (a red plum under snow): a forked trunk and clusters of unpainted blossom
function peachTree(acc, x, z, rng, T) {
  const fork = V(x + 0.3, BANK + 2.2, z);
  acc.tube(V(x, BANK, z), fork, 0.4, 0.3, T.bark, [PAT.none], { sides: 6, caps: false });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.28 + rng.range(-0.4, 0.4), r = rng.range(2.2, 4.2), tip = V(fork.x + Math.cos(a) * r, BANK + rng.range(4.6, 7.4), z + Math.sin(a) * r);
    acc.tube(fork, tip, 0.2, 0.07, T.bark, [PAT.none], { sides: 5, caps: false });
    for (let k = 0; k < 7; k++) {
      const t = rng.range(0.35, 1.05), bx = fork.x + (tip.x - fork.x) * t + rng.range(-0.9, 0.9), by = fork.y + (tip.y - fork.y) * t + rng.range(-0.3, 0.9), bz = fork.z + (tip.z - fork.z) * t + rng.range(-0.9, 0.9);
      acc.cone(bx, by, bz, rng.range(0.55, 1.0), 0.35, 6, T.blossom, { phase: rng() * 6, col: k % 3 === 0 ? T.blossom.shade : T.blossom.lit });
    }
  }
}
// a hanging cloth that lifts in the wind (pivot along its top edge)
function cloth(acc, a, b, drop, mat, pat, col) {
  acc.setAnim((a.x + b.x) / 2, a.y, (a.z + b.z) / 2, 2);
  acc.quad(V(a.x, a.y - drop, a.z), V(b.x, b.y - drop, b.z), b, a, mat, pat, { double: true, u0: 0, col });
  acc.setAnim(0, 0, 0, 0);
}
function table(acc, x, z, T, rng) {
  acc.box(x, 1.25, z, 1.9, 0.14, 1.9, T.timber, [PAT.none], { bottom: true, patTop: [PAT.planks, 3, 0.45] });
  for (const i of [-1, 1]) for (const j of [-1, 1]) acc.box(x + i * 0.8, 0.6, z + j * 0.8, 0.14, 1.2, 0.14, T.beam, [PAT.none], { noTop: true });
  for (let k = 0; k < 3; k++) { const a = rng() * 6.28; acc.box(x + Math.cos(a) * 1.7, 0.36, z + Math.sin(a) * 1.7, 0.6, 0.72, 0.6, T.timber, [PAT.none], { ry: a }); }
  acc.tube(V(x + 0.3, 1.32, z - 0.2), V(x + 0.3, 1.7, z - 0.2), 0.2, 0.13, T.charcoal, [PAT.none], { sides: 6 });                     // a kettle
}
function crates(acc, x, z, T, rng, n = 3) {
  for (let i = 0; i < n; i++) {
    const s = rng.range(0.8, 1.3), kind = rng.int(0, 2), px = x + rng.range(-1.2, 1.2), pz = z + rng.range(-0.9, 0.9);
    if (kind === 0) acc.box(px, s / 2, pz, s, s, s, T.timber, [PAT.planks, 2, 0.34], { ry: rng() * 1.5, patTop: [PAT.planks, 2, 0.34] });
    else if (kind === 1) { acc.tube(V(px, 0, pz), V(px, s * 0.9, pz), s * 0.34, s * 0.42, T.stone, [PAT.none], { sides: 8, capCol: T.charcoal.lit }); }
    else acc.box(px, s * 0.3, pz, s * 1.1, s * 0.6, s * 0.8, T.cloth, [PAT.none], { taper: 0.8, ry: rng() * 3 });
  }
}

function protoHut(acc, rng, T) {
  const w = rng.range(6.5, 9), d = rng.range(5, 6.5), h = 3.1, wat = [PAT.weave, 0.4, 0.4];
  acc.box(0, h / 2, 0, w, h, d, T.wattle, wat, { noTop: true });
  for (const sx of [-1, 1]) acc.box(sx * w / 2, h / 2, d / 2, 0.3, h, 0.3, T.beam, [PAT.none], {});
  acc.box(rng.range(-1.5, 1.5), 1.3, d / 2 + 0.03, 1.6, 2.6, 0.08, T.charcoal, [PAT.none], {});
  acc.quad(V(w / 2 - 2.3, 1.5, d / 2 + 0.04), V(w / 2 - 0.9, 1.5, d / 2 + 0.04), V(w / 2 - 0.9, 2.5, d / 2 + 0.04), V(w / 2 - 2.3, 2.5, d / 2 + 0.04), T.rail, [PAT.lattice, 0.3, 0.3], {});
  roof(acc, 0, 0, w, d, h, rng.range(2.4, 3.1), 0.9, T.thatch, [PAT.ticks, 0.34, 0.75], { thatch: true, hip: rng.chance(0.5) ? 1.6 : 0, gable: T.wattle, gablePat: wat, trim: T.beam, drop: 0.5, wall: T.wattle });
  groundShade(acc, w, d, T);
  // lean-to, woodpile, jars, a length of wattle fence
  const sx = rng.chance(0.5) ? 1 : -1;
  acc.box(sx * (w / 2 + 1.3), 1.1, -0.6, 2.6, 2.2, 3.4, T.wattle, wat, { noTop: true });
  oq(acc, V(sx * (w / 2 + 2.9), 1.9, 1.4), V(sx * (w / 2 + 2.9), 1.9, -2.6), V(sx * (w / 2 - 0.1), 2.9, -2.6), V(sx * (w / 2 - 0.1), 2.9, 1.4), V(sx * 0.2, 1, 0), T.thatch, [PAT.ticks, 0.34, 0.75], { u0: 0, v0: 0 });
  for (let i = 0; i < 5; i++) acc.tube(V(-sx * (w / 2 + 0.6), 0.25 + (i % 2) * 0.42, -1 + i * 0.5), V(-sx * (w / 2 + 2.4), 0.25 + (i % 2) * 0.42, -1 + i * 0.5), 0.22, 0.2, T.log, [PAT.none], { sides: 6, capCol: T.endGrain });
  crates(acc, -sx * 1.8, d / 2 + 1.6, T, rng, 3);
  const fz = d / 2 + rng.range(3, 4.5);
  acc.quad(V(-w / 2 - 2, 0, fz), V(w / 2 + 1, 0, fz), V(w / 2 + 1, 1.5, fz), V(-w / 2 - 2, 1.5, fz), T.rail, [PAT.lattice, 0.42, 0.42], { double: true, u0: 0 });
  acc.quad(V(-w / 2 - 2, 0, fz), V(-w / 2 - 2, 0, fz - 4), V(-w / 2 - 2, 1.5, fz - 4), V(-w / 2 - 2, 1.5, fz), T.rail, [PAT.lattice, 0.42, 0.42], { double: true, u0: 0 });
  for (let i = 0; i < 4; i++) acc.box(-w / 2 - 2 + i * (w + 3) / 3, 0.9, fz, 0.16, 1.8, 0.16, T.beam, [PAT.none], {});
  // laundry on a pole
  if (rng.chance(0.7)) {
    const lx = sx * (w / 2 + 1), lz = d / 2 + 1.2;
    for (const e of [0, 4.2]) acc.box(lx + sx * e, 1.6, lz, 0.14, 3.2, 0.14, T.beam, [PAT.none], {});
    acc.beam(V(lx, 3.1, lz), V(lx + sx * 4.2, 3.1, lz), 0.08, 0.08, T.timber, [PAT.none], { noEnds: true });
    for (let i = 0; i < 3; i++) { const x0 = lx + sx * (0.4 + i * 1.3); cloth(acc, V(x0, 3.08, lz), V(x0 + sx * 1.0, 3.08, lz), rng.range(1.1, 1.9), T.cloth, rng.chance(0.4) ? [PAT.stripes, 0.24, 1] : [PAT.none], rng.chance(0.5) ? T.cloth.lit : T.greyCloth.lit); }
  }
}

function protoShop(acc, rng, T, big) {
  const w = big ? rng.range(12, 14.5) : rng.range(8.5, 11), d = rng.range(7, 8.5), h1 = 4.2, h2 = big ? 3.6 : 3.1, zf = d / 2;
  const tile = [PAT.tiles, 1, 0.46], bays = Math.round(w / 3.2);
  // ground floor: plaster box, timber posts, an open front with half shutters, counters and a door curtain
  acc.box(0, h1 / 2, -0.2, w, h1, d - 0.4, T.plaster, [PAT.none], { noTop: true });
  for (let i = 0; i <= bays; i++) acc.box(-w / 2 + (i * w) / bays, h1 / 2, zf, 0.36, h1, 0.36, T.lacquer, [PAT.none], { noTop: true });
  acc.beam(V(-w / 2, h1 - 0.3, zf), V(w / 2, h1 - 0.3, zf), 0.3, 0.4, T.beam);
  const door = rng.int(0, bays - 1);
  for (let i = 0; i < bays; i++) {
    const x0 = -w / 2 + (i * w) / bays + 0.2, x1 = -w / 2 + ((i + 1) * w) / bays - 0.2, zz = zf + 0.02;
    if (i === door) { cloth(acc, V(x0, h1 - 0.5, zz), V(x1, h1 - 0.5, zz), 1.5, T.cloth, [PAT.stripes, 0.3, 2], (door + bays) % 2 ? T.red.lit : T.blue.lit); acc.box((x0 + x1) / 2, 1.5, zf - 0.3, x1 - x0, 3, 0.1, T.charcoal, [PAT.none], {}); continue; }
    const k = rng.int(0, 2);
    if (k === 0) { acc.quad(V(x0, 1.3, zz), V(x1, 1.3, zz), V(x1, h1 - 0.6, zz), V(x0, h1 - 0.6, zz), T.rail, [PAT.lattice, 0.34, 0.34], {}); acc.box((x0 + x1) / 2, 0.65, zf, x1 - x0, 1.3, 0.2, T.timber, [PAT.planks, 3, 0.32], {}); }
    else if (k === 1) { acc.box((x0 + x1) / 2, 0.6, zf + 0.5, x1 - x0, 1.2, 1.0, T.timber, [PAT.planks, 3, 0.3], { patTop: [PAT.planks, 3, 0.3] }); for (let j = 0; j < 3; j++) acc.tube(V(x0 + 0.5 + j * 0.8, 1.2, zf + 0.5), V(x0 + 0.5 + j * 0.8, 1.75, zf + 0.5), 0.26, 0.17, T.stone, [PAT.none], { sides: 7, capCol: T.charcoal.lit }); acc.box((x0 + x1) / 2, 2.2, zf - 0.6, x1 - x0, 2.0, 0.1, T.charcoal, [PAT.none], {}); }
    else { acc.quad(V(x0, 0, zz), V(x1, 0, zz), V(x1, h1 - 0.6, zz), V(x0, h1 - 0.6, zz), T.timber, [PAT.planks, 9, 0.5], { u0: 0 }); }
  }
  // pent roof over the front, on brackets, with a striped valance
  const py = h1 + 0.5, pz = zf + (big ? 2.6 : 2.0);
  oq(acc, V(w / 2 + 0.6, py - 1.0, pz), V(w / 2 + 0.6, py, zf - 0.2), V(-w / 2 - 0.6, py, zf - 0.2), V(-w / 2 - 0.6, py - 1.0, pz), V(0, 1, 0.01), T.tile, tile, { u0: 0, v0: 0, lv: w + 1.2 });
  acc.beam(V(-w / 2 - 0.6, py - 1.06, pz), V(w / 2 + 0.6, py - 1.06, pz), 0.18, 0.2, T.beam);
  for (let i = 0; i <= bays; i++) { const x = -w / 2 + (i * w) / bays; acc.beam(V(x, h1 - 1.2, zf + 0.1), V(x, py - 1.0, pz - 0.15), 0.14, 0.16, T.beam, [PAT.none], { noEnds: true }); }
  if (rng.chance(0.75)) cloth(acc, V(-w / 2, py - 1.12, pz), V(w / 2, py - 1.12, pz), 0.8, T.cloth, [PAT.stripes, 0.42, 1], T.cloth.lit);
  // upper floor: lattice windows, a balcony with a potted pine, shutters
  const y2 = h1 + 0.5, uw = w - 0.8, ud = d - 1.2;
  acc.box(0, y2 + h2 / 2, -0.3, uw, h2, ud, T.plaster, [PAT.none], { noTop: true });
  const uz = -0.3 + ud / 2 + 0.03;
  for (let i = 0; i < bays; i++) {
    const x0 = -uw / 2 + (i * uw) / bays + 0.35, x1 = -uw / 2 + ((i + 1) * uw) / bays - 0.35;
    acc.quad(V(x0, y2 + 1.0, uz), V(x1, y2 + 1.0, uz), V(x1, y2 + h2 - 0.5, uz), V(x0, y2 + h2 - 0.5, uz), T.rail, rng.chance(0.3) ? [PAT.planks, 9, 0.3] : [PAT.lattice, 0.3, 0.3], {});
    acc.box(-uw / 2 + (i * uw) / bays, y2 + h2 / 2, uz, 0.24, h2, 0.2, T.beam, [PAT.none], { noTop: true });
  }
  acc.box(uw / 2, y2 + h2 / 2, uz, 0.24, h2, 0.2, T.beam, [PAT.none], { noTop: true });
  for (const sx of [-1, 1]) acc.quad(V(sx * uw / 2 + sx * 0.03, y2 + 1.0, -1.6), V(sx * uw / 2 + sx * 0.03, y2 + 1.0, 0.6), V(sx * uw / 2 + sx * 0.03, y2 + h2 - 0.5, 0.6), V(sx * uw / 2 + sx * 0.03, y2 + h2 - 0.5, -1.6), T.rail, [PAT.lattice, 0.3, 0.3], { double: true });
  if (big) {
    const bz = uz + 1.3;
    acc.box(0, y2 + 0.08, uz + 0.65, uw, 0.16, 1.4, T.deck, [PAT.none], { bottom: true, patTop: [PAT.planks, 4, 0.4] });
    acc.quad(V(-uw / 2, y2 + 0.16, bz), V(uw / 2, y2 + 0.16, bz), V(uw / 2, y2 + 1.3, bz), V(-uw / 2, y2 + 1.3, bz), T.rail, [PAT.lattice, 0.36, 0.36], { double: true, u0: 0 });
    for (let i = 0; i <= bays; i++) acc.box(-uw / 2 + (i * uw) / bays, y2 + 0.75, bz, 0.14, 1.4, 0.14, T.beam, [PAT.none], {});
    const px = rng.range(-uw / 3, uw / 3);
    acc.tube(V(px, y2 + 0.16, uz + 0.7), V(px, y2 + 0.7, uz + 0.7), 0.26, 0.36, T.stone, [PAT.none], { sides: 7, caps: false });
    acc.cone(px, y2 + 0.7, uz + 0.7, 0.62, 1.5, 6, T.leaf, {}); acc.cone(px, y2 + 1.5, uz + 0.7, 0.42, 1.1, 6, T.leaf, {});
  }
  roof(acc, 0, -0.3, uw, ud, y2 + h2, big ? 3.2 : 2.6, 1.3, T.tile, tile, { hip: big ? 2.2 : 1.5, trim: T.beam, ridge: T.ridge, eave: T.eave, wall: T.plaster, finials: true, finialMat: T.gold, drop: 0.45 });
  groundShade(acc, w, d, T);
  // bracket blocks under the main eaves, a blank hanging sign, things on the ground in front
  for (let i = 0; i <= bays * 2; i++) acc.box(-uw / 2 + (i * uw) / (bays * 2), y2 + h2 - 0.16, uz + 0.4, 0.3, 0.3, 0.8, T.beam, [PAT.none], {});
  const sx = rng.chance(0.5) ? 1 : -1;
  acc.beam(V(sx * (w / 2 - 0.4), y2 + 0.4, zf), V(sx * (w / 2 - 0.4), y2 + 0.4, pz + 1.4), 0.12, 0.12, T.beam);
  acc.setAnim(sx * (w / 2 - 0.4), y2 + 0.4, pz + 1.1, 2);
  acc.box(sx * (w / 2 - 0.4), y2 - 0.9, pz + 1.1, 0.12, 2.2, 0.9, T.timber, [PAT.none], { bottom: true });
  acc.setAnim(0, 0, 0, 0);
  crates(acc, rng.range(-w / 3, w / 3), pz + 1.2, T, rng, big ? 5 : 3);
  if (rng.chance(0.6)) { const bx = rng.range(-w / 3, w / 3); acc.box(bx, 0.5, pz + 0.2, 2.6, 0.12, 0.6, T.timber, [PAT.none], { bottom: true }); for (const e of [-1, 1]) acc.box(bx + e * 1.1, 0.25, pz + 0.2, 0.14, 0.5, 0.5, T.beam, [PAT.none], {}); }
}

function protoTeahouse(acc, rng, T) {
  const w = rng.range(10, 13), d = 7.5, h = 4.0, zf = d / 2, tile = [PAT.tiles, 1, 0.46];
  acc.box(0, 0.2, 0, w + 0.6, 0.4, d + 0.6, T.stone, [PAT.courses, 1.6, 0.4], { patTop: [PAT.planks, 4, 0.5] });
  for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) acc.tube(V(-w / 2 + (i * w) / 3, 0.4, sz * zf), V(-w / 2 + (i * w) / 3, h, sz * zf), 0.2, 0.18, T.log, [PAT.none], { sides: 6, caps: false });
  acc.box(0, h / 2 + 0.2, -zf, w, h - 0.4, 0.2, T.plaster, [PAT.none], {});
  acc.quad(V(-w / 2 + 1, 1.6, -zf + 0.12), V(w / 2 - 1, 1.6, -zf + 0.12), V(w / 2 - 1, h - 0.6, -zf + 0.12), V(-w / 2 + 1, h - 0.6, -zf + 0.12), T.rail, [PAT.lattice, 0.36, 0.36], {});
  for (const sx of [-1, 1]) acc.quad(V(sx * w / 2, 0.4, -zf), V(sx * w / 2, 0.4, zf), V(sx * w / 2, 1.5, zf), V(sx * w / 2, 1.5, -zf), T.rail, [PAT.lattice, 0.36, 0.36], { double: true, u0: 0 });
  acc.beam(V(-w / 2, h - 0.2, zf), V(w / 2, h - 0.2, zf), 0.26, 0.36, T.beam); acc.beam(V(-w / 2, h - 0.2, -zf), V(w / 2, h - 0.2, -zf), 0.26, 0.36, T.beam);
  roof(acc, 0, 0, w, d, h + 0.3, 2.6, 1.4, T.tile, tile, { hip: 2.0, trim: T.beam, ridge: T.ridge, eave: T.eave, finials: true, finialMat: T.gold, drop: 0.5 });
  groundShade(acc, w, d, T);
  // square tables open to the water, a stove with its kettle, the awning on two poles
  const nt = Math.round(w / 3.4);
  for (let i = 0; i < nt; i++) table(acc, -w / 2 + (i + 0.5) * (w / nt), rng.range(-0.8, 1.2) , T, rng);
  acc.box(w / 2 - 1.2, 0.9, -zf + 1.2, 1.4, 1.0, 1.2, T.stone, [PAT.courses, 0.7, 0.34], {});
  acc.tube(V(w / 2 - 1.2, 1.4, -zf + 1.2), V(w / 2 - 1.2, 1.95, -zf + 1.2), 0.34, 0.22, T.charcoal, [PAT.none], { sides: 7 });
  const az = zf + 3.6, ay = h - 1.3;
  acc.setAnim(0, h - 0.3, zf + 1.4, 2);
  oq(acc, V(-w / 2 + 0.5, h - 0.3, zf + 1.3), V(w / 2 - 0.5, h - 0.3, zf + 1.3), V(w / 2 - 0.5, ay, az), V(-w / 2 + 0.5, ay, az), V(0, 1, 0), T.cloth, [PAT.stripes, 0.7, 2], { double: true, u0: 0, col: T.blue.lit });
  acc.setAnim(0, 0, 0, 0);
  for (const sx of [-1, 1]) acc.tube(V(sx * (w / 2 - 0.6), 0, az), V(sx * (w / 2 - 0.6), ay + 0.2, az), 0.1, 0.08, T.timber, [PAT.none], { sides: 5 });
  cloth(acc, V(-w / 2 + 0.5, ay, az), V(w / 2 - 0.5, ay, az), 0.6, T.cloth, [PAT.stripes, 0.7, 2], T.blue.lit);
  crates(acc, -w / 2 - 1.5, zf + 1, T, rng, 4);
}

function protoStall(acc, rng, T, tint) {
  const r = rng.range(1.9, 2.5), ph = rng() * 6;
  acc.tube(V(0, 0, 0), V(0.15, 3.5, 0), 0.07, 0.06, T.timber, [PAT.none], { sides: 5, caps: false });
  acc.setAnim(0.15, 3.5, 0, 1);
  const plain = rng.chance(0.5) ? T.oiled : T.cloth;
  acc.cone(0.15, 3.3, 0, r, 0.7, 10, tint || plain, { phase: ph });
  acc.setAnim(0, 0, 0, 0);
  acc.box(0.2, 0.55, 1.0, 2.4, 0.1, 1.1, T.timber, [PAT.none], { bottom: true, patTop: [PAT.planks, 3, 0.3] });
  for (const e of [-1, 1]) acc.box(0.2 + e * 1.0, 0.27, 1.0, 0.12, 0.54, 0.9, T.beam, [PAT.none], {});
  for (let i = 0; i < 4; i++) acc.box(-0.6 + i * 0.55, 0.78, 1.0 + rng.range(-0.2, 0.2), 0.42, 0.36, 0.42, i % 2 ? T.cloth : T.mat, i % 2 ? [PAT.none] : [PAT.weave, 0.12, 0.12], { taper: 0.75 });
  acc.tube(V(-1.4, 0, 0.3), V(-1.4, 0.7, 0.3), 0.3, 0.42, T.mat, [PAT.weave, 0.14, 0.14], { sides: 7, capCol: T.cloth.shade });
  // a wheelbarrow parked beside it
  if (rng.chance(0.6)) {
    acc.box(1.9, 0.8, -0.5, 1.5, 0.6, 1.0, T.timber, [PAT.planks, 3, 0.3], { ry: 0.5, taper: 1.15, patTop: [PAT.none] });
    acc.tube(V(2.5, 0.42, -0.42), V(2.6, 0.42, -0.58), 0.42, 0.42, T.beam, [PAT.none], { sides: 9 });
    for (const e of [-0.3, 0.3]) acc.beam(V(1.3, 0.75, -0.2 + e), V(0.5, 1.1, 0.3 + e), 0.08, 0.08, T.timber, [PAT.none], { noEnds: true });
  }
}

// pollard willow: a knuckled trunk, a knob of stubs, whips of hair lines with leaf ticks trailing down
function protoWillow(acc, rng, T, bare) {
  const h = rng.range(4.6, 6.4), lean = rng.range(-0.6, 0.6), kx = lean, top = V(kx, h, rng.range(-0.3, 0.3));
  acc.tube(V(0, 0, 0), V(lean * 0.4, h * 0.55, 0), 0.52, 0.38, T.bark, [PAT.none], { sides: 7, caps: false });
  acc.tube(V(lean * 0.4, h * 0.55, 0), top, 0.4, 0.46, T.bark, [PAT.none], { sides: 7, caps: false });
  acc.tube(V(lean * 0.33, h * 0.45, 0), V(lean * 0.45, h * 0.6, 0), 0.5, 0.5, T.bark, [PAT.none], { sides: 7, caps: false });
  acc.tube(V(top.x, top.y - 0.2, top.z), V(top.x, top.y + 0.75, top.z), 0.66, 0.5, T.bark, [PAT.none], { sides: 7, capCol: T.bark.lit });
  const y0 = top.y + 0.45;
  if (!bare) {
    // the head: a faint green stain on the silk (no outline), a low crown and a ragged skirt, behind the hair lines
    const stain = { lit: T.leaf.lit.clone().lerp(T.bark.lit, 0.0), shade: T.leaf.lit }, NS = 9, ring = (r, y, jig) => { const o = []; for (let k = 0; k <= NS; k++) { const a = (k / NS) * Math.PI * 2, j = k === NS ? o[0].j : rng.range(-jig, jig); o.push({ p: V(top.x + Math.cos(a) * r, y + (k % 2 ? j : -j), top.z + Math.sin(a) * r), j }); } o[NS].p.copy(o[0].p); return o; };
    const r0 = ring(0.4, y0 + 1.3, 0.1), r1 = ring(1.1, y0 + 0.8, 0.25), r2 = ring(1.55, y0 - 2.3, 0.9);
    for (let k = 0; k < NS; k++) {
      acc.quad(r0[k].p, r1[k].p, r1[k + 1].p, r0[k + 1].p, stain, [PAT.none], { double: true, edges: [0, 0, 0, 0], col: T.leaf.lit });
      acc.setAnim(top.x, y0 + 0.9, top.z, 2);
      acc.quad(r1[k].p, r2[k].p, r2[k + 1].p, r1[k + 1].p, stain, [PAT.none], { double: true, edges: [0, 0, 0, 0], col: T.leaf.lit });
      acc.setAnim(0, 0, 0, 0);
    }
  }
  // whips: each a smooth curve of eight short strips, out from the knob and then straight down
  const n = bare ? 26 : 60, wd = 0.24, NSEG = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.25, 0.25), out = rng.range(0.8, 2.2) * (bare ? 1.3 : 1), up = rng.range(0.5, 1.9), trail = rng.chance(0.3);
    // one whip in three trails: those that hang clear of the bank lip go on down the embankment face into the flow lines
    const floor = trail && !bare ? -(BANK + 0.4) : -2.3, push = trail && !bare ? 1.5 : 0;
    const len = bare ? rng.range(1.5, 3.6) : trail ? y0 + up * 0.93 - floor : rng.range(3, 8.4), jx = rng.range(-0.15, 0.15), jz = rng.range(-0.15, 0.15);
    const dx = Math.cos(a), dz = Math.sin(a), sx = -dz * wd / 2, sz = dx * wd / 2;
    const pat = [PAT.whip, wd, bare ? 99 : 0.42], col = bare ? T.leaf.shade : T.leaf.lit;
    const pts = [];
    for (let k = 0; k <= NSEG; k++) {
      const t = k / NSEG, ta = Math.min(1, t / 0.4), fall = Math.max(0, (t - 0.25) / 0.75);
      const o = out * Math.sin(ta * Math.PI / 2) + 0.25 * fall + push * Math.min(1, fall * 2), y = y0 + up * Math.sin(ta * Math.PI * 0.62) - len * fall * fall * (3 - 2 * fall) * 0.5 - len * fall * 0.5;
      pts.push(V(top.x + dx * (0.3 + o) + jx * fall * (1 + Math.sin(k * 2.1)), Math.max(floor, y), top.z + dz * (0.3 + o) + jz * fall * (1 + Math.cos(k * 1.7))));
    }
    acc.tube(V(top.x + dx * 0.3, y0 - 0.1, top.z + dz * 0.3), pts[1], 0.08, 0.04, T.bark, [PAT.none], { sides: 3, caps: false, noRing: true });
    let v0 = 0;
    for (let k = 0; k < NSEG; k++) {
      const p = pts[k], q = pts[k + 1], sl = p.distanceTo(q);
      if (sl < 0.02) break;
      if (k === 3) acc.setAnim(pts[3].x, pts[3].y, pts[3].z, 2);
      acc.quad(V(p.x - sx, p.y, p.z - sz), V(p.x + sx, p.y, p.z + sz), V(q.x + sx, q.y, q.z + sz), V(q.x - sx, q.y, q.z - sz), T.leaf, pat, { double: true, u0: 0, lu: wd, v0, lv: sl, col, edges: [0, 0, 0, 0] });
      v0 += sl;
    }
    acc.setAnim(0, 0, 0, 0);
  }
}
// bare elm with a crow's nest
function protoElm(acc, rng, T) {
  const h = rng.range(9, 13);
  acc.tube(V(0, 0, 0), V(0.3, h * 0.45, 0), 0.42, 0.3, T.bark, [PAT.none], { sides: 6, caps: false });
  const fork = V(0.3, h * 0.45, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * 6.28 + rng.range(-0.4, 0.4), r = rng.range(2, 4), tip = V(fork.x + Math.cos(a) * r, h * rng.range(0.75, 1), Math.sin(a) * r);
    acc.tube(fork, tip, 0.24, 0.08, T.bark, [PAT.none], { sides: 5, caps: false });
    for (let k = 0; k < 4; k++) {
      const t = rng.range(0.35, 0.95), b = fork.clone().lerp(tip, t), e = V(b.x + rng.range(-1.6, 1.6), b.y + rng.range(1.2, 2.6), b.z + rng.range(-1.6, 1.6));
      acc.quad(V(b.x - 0.25, b.y, b.z), V(b.x + 0.25, b.y, b.z), V(e.x + 0.25, e.y, e.z), V(e.x - 0.25, e.y, e.z), T.leaf, [PAT.whip, 0.5, 99], { double: true, u0: 0, lu: 0.5, col: T.leaf.shade, edges: [0, 0, 0, 0] });
    }
    if (i === 1) acc.cone(tip.x * 0.7 + fork.x * 0.3, h * 0.8, tip.z * 0.7, 0.7, -0.55, 6, T.charcoal, {});
  }
}
// reeds at the water's edge: a comb of upright strokes leaning with the current
function protoReeds(acc, rng, T) {
  for (let i = 0; i < 11; i++) {
    const x = rng.range(-2.2, 2.2), z = rng.range(-0.5, 0.5), h = rng.range(0.9, 2.0), ln = rng.range(0.25, 0.6);
    acc.quad(V(x - 0.2, 0, z), V(x + 0.2, 0, z), V(x + 0.2 + ln, h, z), V(x - 0.2 + ln, h, z), T.leaf, [PAT.whip, 0.4, 99], { double: true, u0: 0, lu: 0.4, col: T.leaf.shade, edges: [0, 0, 0, 0] });
  }
}
// a lashed-pole flag scaffold, 14 m, hung with plain striped banners
function scaffold(acc, x, z, T, rng) {
  const h = rng.range(13, 15.5), s = 1.9;
  for (const i of [-1, 1]) for (const j of [-1, 1]) acc.tube(V(x + i * s, BANK, z + j * s), V(x + i * s * 0.55, BANK + h, z + j * s * 0.55), 0.17, 0.11, T.log, [PAT.none], { sides: 6, caps: false });
  for (let k = 1; k <= 4; k++) {
    const y = BANK + (k * h) / 4.4, f = 1 - 0.45 * (k / 4.4), e = s * f + 0.5;
    acc.beam(V(x - e, y, z + s * f), V(x + e, y, z + s * f), 0.14, 0.14, T.timber); acc.beam(V(x - e, y, z - s * f), V(x + e, y, z - s * f), 0.14, 0.14, T.timber);
    acc.beam(V(x + s * f, y + 0.15, z - e), V(x + s * f, y + 0.15, z + e), 0.14, 0.14, T.timber); acc.beam(V(x - s * f, y + 0.15, z - e), V(x - s * f, y + 0.15, z + e), 0.14, 0.14, T.timber);
    for (const i of [-1, 1]) for (const j of [-1, 1]) acc.tube(V(x + i * s * f, y - 0.25, z + j * s * f), V(x + i * s * f, y + 0.3, z + j * s * f), 0.2, 0.2, T.rope, [PAT.rope, 0.12, 1], { sides: 6, caps: false });
  }
  const top = BANK + h;
  acc.tube(V(x, top - 3, z), V(x, top + 3.5, z), 0.13, 0.07, T.log, [PAT.none], { sides: 5 });
  acc.beam(V(x - 3.2, top + 3.0, z), V(x + 3.2, top + 3.0, z), 0.1, 0.1, T.timber);
  for (let k = 0; k < 3; k++) { const bx = x - 3.0 + k * 2.1; cloth(acc, V(bx, top + 2.95, z), V(bx + 1.8, top + 2.95, z), rng.range(7, 9), T.cloth, [PAT.stripes, 0.6, 2], k % 2 ? T.blue.lit : T.red.lit); }
  const sd = rng.chance(0.5) ? 1 : -1;
  acc.beam(V(x, top - 2.2, z), V(x, top - 2.2, z + sd * 3.4), 0.1, 0.1, T.timber);
  cloth(acc, V(x, top - 2.25, z + sd * 1.2), V(x, top - 2.25, z + sd * 3.2), rng.range(3.5, 5), T.cloth, [PAT.stripes, 0.5, 2], T.gold.lit);
}

// the city wall, its corner turret and the double-eaved gate tower. Built in a frame whose +x runs along the
// wall toward the river and whose +z faces upstream, then seated across the left bank at x = 215.
function buildWall(acc, rng, T, gateZ) {
  const m = new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(215, BANK, 0);
  acc.setXf(m);
  const course = [PAT.courses, 1.7, 0.56], H = 9, g = gateZ, tile = [PAT.tiles, 1, 0.5];
  const seg = (x0, x1) => { acc.box((x0 + x1) / 2, H / 2, 0, x1 - x0, H, 4.4, T.brick, course, { u0: x0, patTop: [PAT.courses, 1.7, 1.1] }); };
  seg(-82, g - 7); seg(g + 7, -26.5);
  for (let x = -81; x < -27; x += 2.5) if (Math.abs(x - g) > 7.5) for (const sz of [-1, 1]) acc.box(x, H + 0.55, sz * 1.95, 1.4, 1.1, 0.5, T.brick, [PAT.courses, 1.7, 0.56], {});
  acc.box(-24.2, 5.6, 0, 5.4, 11.2, 5.8, T.brick, course, { u0: 0, patTop: [PAT.courses, 1.7, 1.1] });      // corner turret by the lane
  for (let i = 0; i < 4; i++) for (const sz of [-1, 1]) acc.box(-26.1 + i * 1.3, 11.7, sz * 2.65, 0.8, 1.0, 0.5, T.brick, [PAT.none], {});
  // gate block with its passage
  for (const sx of [-1, 1]) acc.box(g + sx * 5.2, 5.5, 0, 3.6, 11, 7.4, T.brick, course, { u0: sx * 9 });
  acc.box(g, 9.2, 0, 6.8, 3.6, 7.4, T.brick, course, { u0: 3, bottom: true });
  acc.box(g, 3.7, -1.2, 6.8, 7.4, 0.3, T.charcoal, [PAT.none], {});
  for (const sx of [-1, 1]) acc.quad(V(g + sx * 3.4, 0, 3.72), V(g + sx * 1.1, 0, 3.72 + 0.0), V(g + sx * 1.1, 6.9, 3.72), V(g + sx * 3.4, 6.9, 3.72), T.timber, [PAT.planks, 9, 0.62], { double: true, u0: 0 });   // the leaves, ajar
  acc.box(g, 11.15, 0, 15.4, 0.3, 8.2, T.stoneTop, [PAT.none], { bottom: true, patTop: [PAT.courses, 1.9, 1.1] });
  for (let i = 0; i < 11; i++) for (const sz of [-1, 1]) acc.box(g - 7 + i * 1.4, 11.8, sz * 3.9, 0.9, 1.0, 0.4, T.brick, [PAT.none], {});
  // two tiers of hall on bracket sets
  const tier = (y, w, d, h, rise, over, hip) => {
    acc.box(g, y + h / 2, 0, w, h, d, T.plaster, [PAT.none], { noTop: true });
    const n = Math.round(w / 2.6);
    for (let i = 0; i <= n; i++) for (const sz of [-1, 1]) {
      const x = g - w / 2 + (i * w) / n;
      acc.tube(V(x, y, sz * (d / 2 + 0.5)), V(x, y + h, sz * (d / 2 + 0.5)), 0.2, 0.18, T.log, [PAT.none], { sides: 6, caps: false });
      for (let k = 0; k < 3; k++) acc.box(x, y + h + 0.16 + k * 0.3, sz * (d / 2 + 0.5 + k * 0.35), 0.5 + k * 0.4, 0.26, 0.5, T.beam, [PAT.none], {});     // bracket set
      if (i < n) acc.quad(V(x + 0.3, y + 0.9, sz * (d / 2 + 0.03)), V(x + w / n - 0.3, y + 0.9, sz * (d / 2 + 0.03)), V(x + w / n - 0.3, y + h - 0.5, sz * (d / 2 + 0.03)), V(x + 0.3, y + h - 0.5, sz * (d / 2 + 0.03)), T.rail, [PAT.lattice, 0.34, 0.34], { double: true });
    }
    acc.quad(V(g - w / 2 - 0.5, y, d / 2 + 0.5), V(g + w / 2 + 0.5, y, d / 2 + 0.5), V(g + w / 2 + 0.5, y + 1.1, d / 2 + 0.5), V(g - w / 2 - 0.5, y + 1.1, d / 2 + 0.5), T.rail, [PAT.lattice, 0.4, 0.4], { double: true, u0: 0 });
    roof(acc, g, 0, w + 1, d + 1, y + h + 1.0, rise, over, T.tile, tile, { hip, trim: T.beam, ridge: T.ridge, eave: T.eave, finials: true, finialMat: T.gold, drop: 0.7 });
  };
  tier(11.3, 12.6, 5.6, 3.8, 1.9, 2.0, 5.2);
  tier(17.2, 9.0, 3.6, 3.0, 3.4, 1.8, 2.6);
  acc.setXf(null);
}

// a temple gateway on the right bank: four posts, three ruled roofs
function buildGateway(acc, x, z, T) {
  const tile = [PAT.tiles, 1, 0.42];
  for (const [dx, h] of [[-5.2, 6.6], [-2.2, 8.6], [2.2, 8.6], [5.2, 6.6]]) {
    acc.tube(V(x + dx, BANK, z), V(x + dx, BANK + h, z), 0.3, 0.25, T.log, [PAT.none], { sides: 7, caps: false });
    acc.box(x + dx, BANK + 0.5, z, 0.9, 1.0, 0.9, T.stone, [PAT.courses, 9, 0.34], {});
  }
  acc.beam(V(x - 2.6, BANK + 7.2, z), V(x + 2.6, BANK + 7.2, z), 0.3, 0.5, T.beam); acc.beam(V(x - 2.6, BANK + 6.2, z), V(x + 2.6, BANK + 6.2, z), 0.26, 0.4, T.beam);
  acc.quad(V(x - 1.9, BANK + 6.42, z), V(x + 1.9, BANK + 6.42, z), V(x + 1.9, BANK + 6.95, z), V(x - 1.9, BANK + 6.95, z), T.rail, [PAT.lattice, 0.3, 0.3], { double: true });
  for (const sx of [-1, 1]) { acc.beam(V(x + sx * 2.2, BANK + 5.4, z), V(x + sx * 5.5, BANK + 5.4, z), 0.26, 0.42, T.beam); acc.beam(V(x + sx * 2.2, BANK + 4.6, z), V(x + sx * 5.5, BANK + 4.6, z), 0.22, 0.34, T.beam); }
  roof(acc, x, z, 5.4, 0.8, BANK + 8.5, 1.3, 1.0, T.tile, tile, { hip: 1.2, trim: T.beam, ridge: T.ridge, eave: T.eave, finials: true, finialMat: T.gold, drop: 0.4 });
  for (const sx of [-1, 1]) roof(acc, x + sx * 3.9, z, 3.0, 0.7, BANK + 6.5, 1.0, 0.8, T.tile, tile, { hip: 0.9, trim: T.beam, ridge: T.ridge, eave: T.eave, drop: 0.35 });
}

// stacked sacks under a mat roof: the tax house's yard, and cargo on the quays
function sackStack(acc, x, z, nx, nz, nh, T, rng) {
  for (let l = 0; l < nh; l++) for (let i = l * 0.5; i < nx - l * 0.5; i++) for (let k = l * 0.5; k < nz - l * 0.5; k++)
    acc.box(x + (i - nx / 2) * 1.05 + rng.range(-0.07, 0.07), BANK + 0.3 + l * 0.56, z + (k - nz / 2) * 0.95, 1.0, 0.54, 0.9, T.cloth, [PAT.none], { taper: 0.82, ry: rng.range(-0.1, 0.1) });
}

// the silk ribbon: rows along the scroll's arc length, columns that follow the river banks
function buildSilk(mat) {
  const rows = []; let s = S_MIN;
  while (s < S_MAX) { rows.push(s); s += s < X0 - 1 || s > X1 - 1 ? 1.6 : s < 0 || s > 228 ? 2.0 : 3.0; }
  rows.push(S_MAX);
  const NC = 12, P = new Float32Array(rows.length * NC * 3), A = new Float32Array(rows.length * NC * 3), I = [], b = { x: 0, y: 0, a: 0 };
  for (let r = 0; r < rows.length; r++) {
    const sr = rows[r], w = halfW(sr), bh = sr > X1 ? 0 : bankH(sr);
    scrollBend(sr, b);
    const cols = [[-81, bh], [-75, bh], [-52, bh], [-w - 1.0, bh], [-w - 0.1, 0], [-w * 0.4, 0], [w * 0.4, 0], [w + 0.1, 0], [w + 1.0, bh], [52, bh], [75, bh], [81, bh]];
    for (let c = 0; c < NC; c++) {
      const o = (r * NC + c) * 3, hh = cols[c][1];
      P[o] = b.x - Math.sin(b.a) * hh; P[o + 1] = b.y + Math.cos(b.a) * hh; P[o + 2] = cols[c][0];
      A[o] = sr; A[o + 1] = hh; A[o + 2] = cols[c][0];
      if (r > 0 && c > 0) { const i0 = (r - 1) * NC + c - 1, i1 = i0 + 1, i2 = r * NC + c - 1, i3 = i2 + 1; I.push(i0, i1, i3, i0, i3, i2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aP', new THREE.BufferAttribute(A, 3)); g.setIndex(I);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = -0.5; mesh.name = 'silk';
  return mesh;
}

// instanced prototype: placements are { x, y, z, ry, sx, sy, sz }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s3 = new THREE.Vector3(), _p3 = new THREE.Vector3(), _eu = new THREE.Euler(), YAX = new THREE.Vector3(0, 1, 0);
function instances(geo, mat, list, name) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  mesh.count = list.length; mesh.name = name;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    _q.setFromAxisAngle(YAX, p.ry || 0); _m4.compose(_p3.set(p.x, p.y, p.z), _q, _s3.set(p.sx || 1, p.sy || 1, p.sz || p.sx || 1)); mesh.setMatrixAt(i, _m4);
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  return mesh;
}
function cardMesh(list, mat, name) {
  const n = list.length, A = new Float32Array(n * 3), B = new Float32Array(n * 4), K = new Float32Array(n * 4), C = new Float32Array(n * 3);
  list.forEach((d, i) => { A.set(d.a, i * 3); B.set(d.b || [0, 0, 0, 0], i * 4); K.set(d.k, i * 4); C.set([d.col.r, d.col.g, d.col.b], i * 3); });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(K, 4)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(C, 3));
  g.instanceCount = n;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = name;
  return mesh;
}
function walkerMesh(list, mat) {
  const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), F = new Float32Array(n * 4), C = new Float32Array(n * 3);
  list.forEach((d, i) => { A.set(d.a, i * 4); B.set(d.b, i * 4); F.set([d.h, d.hat === 2 ? 2 : d.hat ? 1 : 0, d.loop ? 1 : 0, d.lean || 0], i * 4); C.set([d.col.r, d.col.g, d.col.b], i * 3); });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
  g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(F, 4)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(C, 3));
  g.instanceCount = n;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'walkers';
  return mesh;
}

const LOOKS = {
  mist: { title: 'The Scroll at Rainbow Bridge', paper: '#D9C7A0', water: '#3C8C93', mist: 1.0, mistNF: [40, 92], band: [0.42, 0.8, 9, 24], fade: [150, 215], snow: 0, busy: 0, willow: 1, join: 1, lit: 0, tone: [1, 1, 1] },
  noon: { title: 'The Scroll at Rainbow Bridge: Dry Noon', paper: '#E6D8B6', water: '#3C8C93', mist: 0.0, mistNF: [38, 85], band: [0.56, 0.9, 5, 15], fade: [230, 320], snow: 0, busy: 0.2, willow: 1, join: 0, lit: 0, tone: [1, 1.1, 1] },
  dusk: { title: 'The Scroll at Rainbow Bridge: Lantern Dusk', paper: '#CDAE7C', water: '#2F5F8C', mist: 0.45, mistNF: [38, 85], band: [0.56, 0.9, 5, 15], fade: [135, 195], snow: 0, busy: 1, willow: 1, join: 1, lit: 0.1, tone: [1, 0.85, 0.95] },
  snow: { title: 'The Scroll at Rainbow Bridge: First Snow', paper: '#DCD6C6', water: '#3E7DB0', mist: 0.7, mistNF: [38, 85], band: [0.56, 0.9, 5, 15], fade: [140, 200], snow: 1, busy: 0, willow: 0, join: 1, lit: 0, tone: [1, 0, 1] },
};

export default {
  id: 'rainbow-bridge-scroll',
  name: 'The Scroll at Rainbow Bridge',
  category: 'city',
  after: 'Zhang Zeduan, 1085 to 1145',
  weirdness: 0.4,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('scroll-look'), detail = ctx.quality?.detail ?? 1;
    const density = vary.density ?? 1, rare = !!vary.rare, hour = vary.hour || 'any';
    const lookId = hour === 'dawn' ? 'mist' : hour === 'day' ? (vr.chance(0.35) ? 'snow' : 'noon') : hour === 'golden' || hour === 'night' ? 'dusk' : vr.pick(['mist', 'mist', 'noon', 'dusk', 'snow']);
    const look = LOOKS[lookId], cast = vr.pick(['plain', 'fleet', 'festival', 'fleet', 'festival']);
    const seedF = vr();
    // palette: each look has its own pale paper (the sky and the ground are this colour); the reserve (snow, plaster,
    // mist, blank silk) is paler still, and whiter under snow
    const base = PALETTE.map((h) => new THREE.Color(h));
    if (look.snow) base[1].set('#FAF6EC');
    const silkC = new THREE.Color(look.paper);
    const pal = [silkC, base[1], base[2], base[3], base[4], base[5], base[6]];
    const [silk, pale, ink, grey, ochre, green] = pal;
    const mx = (a, b, t) => a.clone().lerp(b, t), two = (lit, shade) => ({ lit, shade });
    // the mineral colours, laid as thin flat washes under the ink line: malachite, azurite, gold, and the seal's cinnabar
    const mal = new THREE.Color(MINERAL.mal), azu = new THREE.Color(MINERAL.azu), gold = new THREE.Color(MINERAL.gold), cin = base[6];
    // everything added east of x = 242 (and every later addition) draws from its own stream, so the seeded town stays as it was
    const rngE = ctx.core.makeRng('scroll-east:' + Math.floor(seedF * 1e9));

    const scene = new THREE.Scene();
    scene.background = silkC.clone();

    // ---- the hero: bridge, crowd, our barge
    const hero = await buildHero(ctx, { palette: pal.map((c) => '#' + c.getHexString()), minerals: MINERAL, underlay: false, fadeNear: look.fade[0], fadeFar: look.fade[1], snow: !!look.snow, litShift: look.lit, parasols: look.snow ? 80 : 40 });
    hero.object.position.set(HERO_X, 0, 0); hero.object.rotation.y = -Math.PI / 2; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const U = hero.uniforms, inkMat = hero.mats.ink;
    U.uMist.value.set(look.mist, 0, look.mistNF[0], look.mistNF[1]); U.uMistBand.value.set(look.band[0], look.band[1], look.band[2], look.band[3]);
    await ctx.yield();
    const T = {
      ...hero.tones,
      plaster: two(mx(pale, silk, 0.1), mx(pale, grey, 0.42)), wattle: two(mx(ochre, silk, 0.55), mx(grey, silk, 0.4)),
      thatch: look.snow ? two(pale.clone(), mx(pale, grey, 0.22)) : two(mx(ochre, pale, 0.35), mx(ochre, grey, 0.5)),
      // roofs: a second, darker ink value on the shops; an azurite-grey tile on the wine shops, teahouses, gate and gateway
      tile: look.snow ? two(pale.clone(), mx(pale, azu, 0.26)) : two(new THREE.Color('#51708F'), mx(new THREE.Color('#51708F'), ink, 0.3)),
      tileB: look.snow ? two(pale.clone(), mx(pale, azu, 0.3)) : two(new THREE.Color('#2F8F78'), mx(new THREE.Color('#2F8F78'), ink, 0.3)),
      tileA: look.snow ? two(pale.clone(), mx(pale, azu, 0.36)) : two(new THREE.Color('#2B6FAE'), mx(new THREE.Color('#2B6FAE'), ink, 0.3)),
      brick: two(mx(pale, grey, 0.25), mx(grey, silk, 0.25)), bark: two(mx(grey, ochre, 0.4), mx(grey, ink, 0.4)),
      leaf: { lit: mx(mal, silk, lookId === 'noon' ? 0.1 : lookId === 'dusk' ? 0.25 : 0.18), shade: mx(mal, ink, 0.3) },
      jade: two(mx(mal, pale, 0.2), mx(mal, ink, 0.3)), lacquer: two(cin.clone(), mx(cin, ink, 0.3)),
      roll: two(mx(azu, silk, 0.12), mx(azu, ink, 0.28)), band: two(mx(pale, silk, 0.1), mx(pale, grey, 0.4)), soap: two(mx(pale, grey, 0.2), mx(grey, pale, 0.3)),
    };
    // first snow: shadows are thin azurite washes
    if (look.snow) for (const k of ['plaster', 'brick', 'thatch', 'wattle']) T[k] = two(T[k].lit, mx(T[k].shade, azu, 0.3));
    // dusk: the plain lit washes move a tenth of the way to grey; the hour is told by amber paper, deeper water and lanterns
    if (look.lit) for (const k of ['plaster', 'wattle', 'thatch', 'brick', 'bark']) T[k] = two(mx(T[k].lit, grey, look.lit), T[k].shade);
    // ridges are gold on every tiled roof; under snow the eaves boards are cinnabar; the wash a building lays on the ground
    T.ridge = T.gold; T.eave = look.snow ? T.lacquer : T.beam;
    for (const k of ['plaster', 'wattle']) T[k].band = mx(T[k].shade, ink, 0.35);
    T.pine = look.snow ? { lit: mx(pale, mal, 0.2), shade: mx(mal, ink, 0.3), deep: mx(mal, ink, 0.55) } : { lit: mx(mal, ink, 0.15), shade: mx(mal, ink, 0.38), deep: mx(mal, ink, 0.6) };
    T.blossom = look.snow ? two(cin.clone(), mx(cin, pale, 0.4)) : two(mx(pale, cin, 0.2), mx(pale, cin, 0.5));
    T.ground = look.snow ? mx(pale, azu, 0.32) : mx(silk, mx(grey, ink, 0.3), 0.6);
    // the landmarks (gate tower, temple gateways, teahouses) stand on cinnabar columns under azurite tiles with gold finials
    const TL = { ...T, tile: T.tileA, log: T.lacquer, finial: T.gold }, TB = { ...T, tile: T.tileB, finial: T.gold };

    // ---- the path: cast off, the swing, the reach, under the bridge, the gate, blank silk, the seal
    const bend = { x: 0, y: 0, a: 0 };
    const S_SEAL = S_A + STR / 2;
    scrollBend(S_SEAL, bend);
    const sealAt = V(bend.x, bend.y, 0), endP = V(bend.x - Math.sin(A1) * 0.45, bend.y + Math.cos(A1) * 0.45, 0);
    const dirE = V(Math.sin(A1), -Math.cos(A1), 0), st = endP.clone().addScaledVector(dirE, -60);
    // the entry looks across the basin at the village bank (the pavilion, the well and its peach tree, willows, the donkey
    // train, the sampan, the ranges behind); the take-up roller only cuts the upper left corner of the first view. Then
    // the current swings the bow right, along the bank and away downstream
    const pts = [];
    { const a = 170 * Math.PI / 180, jx = 48 + 16 * Math.cos(a), jz = -3.9 + 16 * Math.sin(a); for (const t of [22, 14.67, 7.33]) pts.push([jx + Math.sin(a) * t, 4.2, jz - Math.cos(a) * t]); }
    for (const deg of [170, 195, 220, 245, 270]) { const a = deg * Math.PI / 180; pts.push([48 + 16 * Math.cos(a), 4.2, -3.9 + 16 * Math.sin(a)]); }
    pts.push([66, 4.2, -17], [84, 4.2, -10.5], [102, 4.2, -4], [120, 4.2, 0.6], [140, 4.2, 1.5], [161, 4.2, 1.5], [182, 4.2, 0.6], [203, 4.2, -2.2], [222, 4.2, -2.6], [236, 4.2, -1.0]);
    const x0l = st.x - 2 * (st.y - 4.2) / dirE.y * dirE.x, kq = (st.y - 4.2) / ((st.x - x0l) * (st.x - x0l));
    pts.push([x0l, 4.2, -0.3], [(x0l + st.x) / 2, 4.2 + kq * (st.x - x0l) * (st.x - x0l) / 4, 0]);
    pts.push(st, st.clone().addScaledVector(dirE, 20), st.clone().addScaledVector(dirE, 40), endP);
    const path = makePath(pts);
    const duration = 48;
    // moments that were tuned as fractions of an earlier path, 3.96 m longer at its start: the same places on this one
    const LEAD = -3.96, uo = (v) => (v * (path.length - LEAD) + LEAD) / path.length;

    // ---- materials that share the hero's uniforms
    const silkMat = new THREE.ShaderMaterial({
      uniforms: {
        uInk: U.uInk, uSilk: U.uSilk, uPale: U.uPale, uGrey: U.uGrey, uSeal: U.uSeal, uLinePx: U.uLinePx, uTime: U.uTime, uFade: U.uFade, uMist: U.uMist, uMistBand: U.uMistBand, uClip: U.uClip, uRipple: U.uRipple,
        uSeed: { value: seedF }, uWind: { value: 0 }, uSnow: { value: look.snow }, uBusy: { value: look.busy }, uJoin: { value: look.join },
        uAzur: U.uAzur, uMal: U.uMal, uGold: U.uGold, uWater: { value: new THREE.Color(look.water) },
        ...(END_FRAME_R14 ? { uOchre: { value: ochre } } : {}),
        uTone: { value: new THREE.Vector3(look.tone[0], look.tone[1], look.tone[2]) },
        uBargeW: { value: new THREE.Vector4(40, 10, -1, 0) }, uSeals: { value: [] }, uObs: { value: [] },
        uTraf: { value: [new THREE.Vector4(0, 900, 1, 0), new THREE.Vector4(0, 900, 1, 0), new THREE.Vector4(0, 900, 1, 0)] }, uSail: { value: new THREE.Vector4(0, 900, 8, 2) },
        uTow: { value: [V(91, -(halfW(91) + 9.5), 0), V(117, -(halfW(117) + 9), 0), V(129, halfW(129) + 9, 0), V(280, -(halfW(280) + 7.5), 0), V(280, halfW(280) + 7.5, 0)] },
        uBig: { value: new THREE.Vector4(S_SEAL, 0, 11, 0) }, uStampAt: { value: new THREE.Vector4(STAMP_X, STAMP_Z, 7, 0) }, uThresh: { value: new THREE.Vector3(52, -53, 5.2) },
      },
      vertexShader: SILK_VERT, fragmentShader: SILK_FRAG, side: THREE.DoubleSide,
    });
    const SU = silkMat.uniforms;
    SU.uSeals.value = [
      new THREE.Vector4(-56, -78, 1.9, 0), new THREE.Vector4(76 + vr.range(-3, 3), -9 + vr.range(-2, 5), 1.15, 1),
      new THREE.Vector4(278 + vr.range(-3, 3), 12 + vr.range(-2, 3), 1.5, 2), new THREE.Vector4(S_SEAL - 3 + vr.range(-3, 3), 24 + vr.range(-2, 4), 1.5, 0), new THREE.Vector4(S_SEAL + 2 + vr.range(-3, 3), -27 + vr.range(-3, 3), 1.35, 1),
    ];
    for (let i = 0; i < 12; i++) SU.uObs.value.push(new THREE.Vector3(0, 500, 3));
    await ctx.yield();
    const silkMesh = buildSilk(silkMat); scene.add(silkMesh);
    await ctx.yield();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 24, 12), new THREE.ShaderMaterial({
      uniforms: { uSilk: U.uSilk, uPale: U.uPale, uTable: { value: mx(silk, ink, 0.6) }, uTime: U.uTime, uSeed: { value: seedF }, uInk: U.uInk, uMal: U.uMal, uAzur: U.uAzur, uGold: U.uGold, uGrey: U.uGrey, uTone: SU.uTone, uSnow: SU.uSnow, uLinePx: U.uLinePx, uFar: { value: new THREE.Color('#7FA6CF') }, uMid: { value: new THREE.Color('#3F78B4') } },
      vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false,
    }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

    // ---- the two rollers with their jade knobs
    // each roller is the wound scroll in its brocade wrapper (azurite ground, lozenges ruled in gold), tied at mid-length
    // with a silk band and a jade toggle, between two big malachite knobs on gold collars
    const rollerGeo = (r, kr) => {
      const a = makeAcc(rng);
      a.tube(V(0, 0, -81.5), V(0, 0, 81.5), r, r, T.roll, [PAT.brocade, 2.4, 1], { sides: 26, capCol: T.roll.shade });
      for (const sg of [-1, 1]) {
        a.tube(V(0, 0, sg * 81.5), V(0, 0, sg * 83), kr * 1.3, kr * 1.3, T.gold, [PAT.none], { sides: 14 });
        a.tube(V(0, 0, sg * 83), V(0, 0, sg * 89.5), kr, kr * 0.92, T.jade, [PAT.planks, 400, (Math.PI * 2 * kr) / 5], { sides: 14 });
        a.tube(V(0, 0, sg * 89.5), V(0, 0, sg * 91), kr * 1.25, kr * 1.1, T.gold, [PAT.none], { sides: 14 });
      }
      a.setRng(rngE);
      a.tube(V(0, 0, -1.3), V(0, 0, 1.3), r + 0.14, r + 0.14, T.band, [PAT.rope, 0.5, 1], { sides: 26, caps: false });
      for (const e of [-1.45, 1.45]) a.tube(V(0, 0, e - 0.16), V(0, 0, e + 0.16), r + 0.2, r + 0.2, T.gold, [PAT.none], { sides: 26, caps: false });
      a.box(r + 0.45, 0, 0, 0.7, 0.9, 3.4, T.jade, [PAT.none], { bottom: true });
      for (const e of [-27, 27, -54, 54]) a.tube(V(0, 0, e - 0.35), V(0, 0, e + 0.35), r + 0.06, r + 0.06, T.gold, [PAT.none], { sides: 26, caps: false });
      return a.build();
    };
    // the rollers stand outside the picture: they are never faded by distance or mist
    const rollMat = new THREE.ShaderMaterial({ uniforms: { ...inkMat.uniforms, uFade: { value: new THREE.Vector2(1e5, 2e5) }, uMist: { value: new THREE.Vector4(0, 0, 1, 2) } }, vertexShader: inkMat.vertexShader, fragmentShader: inkMat.fragmentShader, fog: true });
    // (the take-up roller is kept out of the picture: from the entry, 110 m and more away, only its end showed, cutting
    // the upper left corner as a stray cylinder; the painting climbs the bend to the lip of the silk instead)
    const takeUp = new THREE.Mesh(rollerGeo(4.9, 3.0), rollMat); takeUp.position.set(X0 - R0 + 5, R0, 0); takeUp.frustumCulled = false; takeUp.visible = false; scene.add(takeUp);
    scrollBend(S_C, bend);
    const feed = new THREE.Mesh(rollerGeo(2.9, 1.9), rollMat); feed.position.set(bend.x - 3 * Math.sin(A2), bend.y + 3 * Math.cos(A2), 0); feed.frustumCulled = false; scene.add(feed);
    await ctx.yield();

    // ---- prototypes (each one buffer), then placements
    const proto = async (fn) => { const a = makeAcc(rng); fn(a); await ctx.yield(); const g = a.build(); await ctx.yield(); return g; };
    const G = { hut: [], shop: [], big: [], tea: [], stall: [], willow: [], elm: [], reeds: [] };
    for (let i = 0; i < 3; i++) G.hut.push(await proto((a) => protoHut(a, rng, T)));
    for (let i = 0; i < 3; i++) G.shop.push(await proto((a) => protoShop(a, rng, T, false)));
    for (let i = 0; i < 3; i++) G.big.push(await proto((a) => protoShop(a, rng, TB, true)));
    for (let i = 0; i < 2; i++) G.tea.push(await proto((a) => protoTeahouse(a, rng, TL)));
    for (let i = 0; i < 3; i++) G.stall.push(await proto((a) => protoStall(a, rng, T, i === 0 ? T.red : i === 1 ? null : look.snow ? T.blue : T.green)));
    for (let i = 0; i < 3; i++) G.willow.push(await proto((a) => protoWillow(a, rng, T, !look.willow)));
    for (let i = 0; i < 2; i++) G.elm.push(await proto((a) => protoElm(a, rng, T)));
    G.reeds.push(await proto((a) => protoReeds(a, rng, T)));
    const L = {}; for (const key in G) L[key] = G[key].map(() => []);
    const put = (key, o) => { const arr = L[key]; arr[rng.int(0, arr.length - 1)].push(o); };
    const lanternAt = [], placedB = [], segDist = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
    const GATE_Z = -46, camA = [211, GATE_Z], camB = [181, -27.5];
    for (const sg of [-1, 1]) for (let r = 0; r < 4; r++) {
      let x = -13 + rng.range(0, 7);
      while (x < 242) {
        const w = halfW(x), town = x > 68 && x < (sg < 0 ? 240 : 206), z = sg * (w + 1 + 14 + r * 15.5 + rng.range(-1.2, 1.2));
        const thin = 1 - sstep(224, 243, x), roll = rng(), kindRoll = rng(), jit = rng.range(-0.1, 0.1), quarter = rng.chance(0.3), gap = rng.range(0, 2.5), sc = rng.range(0.92, 1.1);
        const blocked = Math.abs(z) > 70.5 || (x > 132 && x < 190 && Math.abs(z) < 41) || Math.abs(x - 86) < 7 || Math.abs(x - 121) < 7 || Math.abs(x - 161) < 11.5 || Math.abs(x - 199) < 7
          || (sg < 0 && Math.abs(x - 215) < 10.5) || (sg < 0 && x > 224 && z < -40 && z > -64) || (sg < 0 && Math.hypot(x - 52, z + 53) < 12.5) || (sg < 0 && segDist(x, z, camA[0], camA[1], camB[0], camB[1]) < 10.5);
        if (blocked) { x += 4.5; continue; }
        const ry = (sg < 0 ? 0 : Math.PI) + jit + (r >= 2 && quarter ? Math.PI / 2 : 0), o = { x, y: BANK, z, ry, sx: sc, sy: rng.range(0.94, 1.12), sz: sc };
        let step = 8, key = null;
        if (town && roll < (r === 0 ? 0.96 : 0.88 - 0.1 * r) * thin) {
          if (r === 0 && sg > 0 && kindRoll < 0.42) { key = 'tea'; step = 16; }
          else if (r <= 1 && kindRoll < (r === 0 ? 0.78 : 0.5)) { key = 'big'; step = 17.5; }
          else { key = 'shop'; step = 13.5; }
        } else if (!town && roll < (x < 70 ? 0.7 : 0.4) * Math.min(1.2, density) * (x < 70 ? 1 : thin)) { key = 'hut'; step = 14 + gap * 2; }
        if (key) {
          put(key, o); placedB.push([x, z, step / 2]);
          if (r < 3 && key !== 'hut') for (const bay of [-2, -1, 0, 1, 2]) {
            const lx = bay * (key === 'big' ? 2.5 : key === 'tea' ? 2.1 : 1.75), lz = key === 'tea' ? 5.3 : 4.5, ly = key === 'tea' ? 1.5 : key === 'big' ? 5.0 : 4.5;
            lanternAt.push([x + (lx * Math.cos(ry) + lz * Math.sin(ry)) * sc, BANK + ly * o.sy, z + (-lx * Math.sin(ry) + lz * Math.cos(ry)) * sc, key === 'tea' ? 0.75 : 1, x, z]);
          }
        }
        x += step + gap;
      }
      await ctx.yield();
    }
    // willows along both banks, a second scatter behind; reeds at the water's edge; elms behind the village
    for (const sg of [-1, 1]) {
      for (let x = -16 + rng.range(0, 4); x < 247; x += rng.range(6, 9.5)) {
        const w = halfW(x), sc = rng.range(0.9, 1.35), d = rng.range(1.2, 2.8), keep = rng(), ry = rng() * 6.28;
        if ((x > 135 && x < 187) || (sg < 0 && x > 174 && x < 212) || (x > 70 && x < 236 && keep > 0.62) || (x <= 70 && keep > 0.7) || keep > 1 - 0.9 * sstep(232, 250, x)) continue;
        put('willow', { x, y: bankH(x), z: sg * (w + 1 + d), ry, sx: sc, sy: sc, sz: sc });
      }
      for (let x = -14 + rng.range(0, 5); x < 247; x += rng.range(14, 24)) {
        const w = halfW(x), sc = rng.range(0.8, 1.2), d = rng.range(7.2, 9.5), keep = rng(), ry = rng() * 6.28;
        if ((x > 62 && x < (sg < 0 ? 236 : 190)) || keep > 0.75 || keep > 1 - 0.9 * sstep(232, 250, x)) continue;
        put('willow', { x, y: bankH(x), z: sg * (w + 1 + d), ry, sx: sc, sy: sc, sz: sc });
      }
      for (let x = -15 + rng.range(0, 4); x < 247; x += rng.range(6, 12)) {
        const w = halfW(x), off = rng.range(0.4, 1.4), sc = rng.range(0.8, 1.3), flip = rng.chance(0.5);
        if ((x > 68 && x < 186) || path.nearestXZ(x, sg * (w - off)).dist < 7 || x > 244) continue;
        put('reeds', { x, y: -0.05, z: sg * (w - off), ry: flip ? 0.2 : -0.2, sx: sc, sy: sc, sz: sc });
      }
      for (let x = -8 + rng.range(0, 8); x < 70; x += rng.range(9, 16)) { const sc = rng.range(0.85, 1.25); put('elm', { x, y: BANK, z: sg * rng.range(62, 72), ry: rng() * 6.28, sx: sc, sy: sc, sz: sc }); }
      // parasol stalls on the embankment lanes of the town
      for (let x = 72 + rng.range(0, 5); x < 236; x += rng.range(6.5, 11)) {
        const w = halfW(x), d = rng.range(3.4, 5.2), keep = rng(), ry = (sg < 0 ? 0 : Math.PI) + rng.range(-0.5, 0.5);
        if ((x > 136 && x < 186) || keep > 0.72 * density || (sg < 0 && x > 174 && x < 220) || (sg > 0 && x > 208)) continue;
        put('stall', { x, y: BANK, z: sg * (w + 1 + d), ry, sx: 1, sy: 1, sz: 1 });
      }
    }
    for (let i = 0; i < 9; i++) { const sg = i % 2 ? 1 : -1, zz = sg * rng.range(36, 68); put('stall', { x: 161 + sg * rng.range(4.2, 5.6) * (i % 3 ? 1 : -1), y: BANK, z: zz, ry: rng() * 6.28, sx: 1, sy: 1, sz: 1 }); }
    await ctx.yield();
    // ---- the town carried on east to the end of the picture (to x = 291), filling whatever the seeded rows left open
    // beyond the gate; a street at x = 262 and a small square at x = 280 behind each of the two banner towers
    const putE = (key, o) => { const arr = L[key]; arr[rngE.int(0, arr.length - 1)].push(o); };
    const freeAt = (x, z, half) => { for (const b of placedB) if (Math.abs(b[1] - z) < 9 && Math.abs(b[0] - x) < b[2] + half + 0.8) return false; return true; };
    for (const sg of [-1, 1]) for (let r = 0; r < 4; r++) {
      let x = (sg < 0 ? 226 : 203) + rngE.range(0, 6);
      while (x < 291) {
        const w = halfW(x), z = sg * (w + 1 + 14 + r * 15.5 + rngE.range(-1.2, 1.2));
        const thin = 1 - 0.4 * sstep(274, 294, x), roll = rngE(), kindRoll = rngE(), jit = rngE.range(-0.1, 0.1), quarter = rngE.chance(0.3), gap = rngE.range(0, 2.5), sc = rngE.range(0.92, 1.1), sy = rngE.range(0.94, 1.12);
        let key = null, step = 8;
        if (roll < (r === 0 ? 0.96 : 0.9 - 0.08 * r) * thin) {
          if (r === 0 && kindRoll < 0.3) { key = 'tea'; step = 16; }
          else if (r <= 1 && kindRoll < (r === 0 ? 0.72 : 0.5)) { key = 'big'; step = 17.5; }
          else { key = 'shop'; step = 13.5; }
        }
        const blocked = !key || Math.abs(z) > 70.5 || Math.abs(x - 262) < 7 || (r === 0 && Math.abs(x - 280) < 7.5) || (sg < 0 && Math.abs(x - 215) < 10.5)
          || (sg < 0 && x > 224 && x < 262 && z < -39 && z > -53) || (sg > 0 && r === 0 && Math.abs(x - 204) < 9.5) || !freeAt(x, z, step / 2);
        if (blocked) { x += 4.5; continue; }
        const ry = (sg < 0 ? 0 : Math.PI) + jit + (r >= 2 && quarter ? Math.PI / 2 : 0);
        putE(key, { x, y: BANK, z, ry, sx: sc, sy, sz: sc }); placedB.push([x, z, step / 2]);
        if (r < 3) for (const bay of [-2, -1, 0, 1, 2]) {
          const lx = bay * (key === 'big' ? 2.5 : key === 'tea' ? 2.1 : 1.75), lz = key === 'tea' ? 5.3 : 4.5, ly = key === 'tea' ? 1.5 : key === 'big' ? 5.0 : 4.5;
          lanternAt.push([x + (lx * Math.cos(ry) + lz * Math.sin(ry)) * sc, BANK + ly * sy, z + (-lx * Math.sin(ry) + lz * Math.cos(ry)) * sc, key === 'tea' ? 0.75 : 1, x, z]);
        }
        x += step + gap;
      }
      await ctx.yield();
    }
    for (const sg of [-1, 1]) {
      for (let x = 238 + rngE.range(0, 5); x < 293; x += rngE.range(6, 9.5)) {
        const w = halfW(x), sc = rngE.range(0.9, 1.35), d = rngE.range(1.2, 2.8), keep = rngE(), ry = rngE() * 6.28;
        if (keep > 0.55 || Math.abs(x - 280) < 4 || Math.abs(x - 262) < 3) continue;
        putE('willow', { x, y: bankH(x), z: sg * (w + 1 + d), ry, sx: sc, sy: sc, sz: sc });
      }
      for (let x = 244 + rngE.range(0, 5); x < 292; x += rngE.range(6, 12)) {
        const w = halfW(x), off = rngE.range(0.4, 1.4), sc = rngE.range(0.8, 1.3), flip = rngE.chance(0.5);
        putE('reeds', { x, y: -0.05, z: sg * (w - off), ry: flip ? 0.2 : -0.2, sx: sc, sy: sc, sz: sc });
      }
      for (let x = (sg < 0 ? 238 : 210) + rngE.range(0, 5); x < 290; x += rngE.range(6.5, 11)) {
        const w = halfW(x), d = rngE.range(3.4, 5.2), keep = rngE(), ry = (sg < 0 ? 0 : Math.PI) + rngE.range(-0.5, 0.5);
        if (keep > 0.72 * density || Math.abs(x - 280) < 4.5) continue;
        putE('stall', { x, y: BANK, z: sg * (w + 1 + d), ry, sx: 1, sy: 1, sz: 1 });
      }
    }
    // the village bank: reeds twice as thick under it
    for (let x = 5 + rngE.range(0, 3); x < 68; x += rngE.range(3.5, 7)) {
      const w = halfW(x), off = rngE.range(0.4, 1.6), sc = rngE.range(0.8, 1.3), flip = rngE.chance(0.5);
      if (path.nearestXZ(x, -(w - off)).dist < 7) continue;
      putE('reeds', { x, y: -0.05, z: -(w - off), ry: flip ? 0.2 : -0.2, sx: sc, sy: sc, sz: sc });
    }
    await ctx.yield();
    // room for the pavilion on the entry axis and for the two pagodas at the far end: whatever the rows put there is
    // taken out again (and its lanterns with it), so the seeded draws stay as they were
    const PAG_X = 294.5, PAG_Z = 20, SIG_X = 27, SIG_Z = -50, GATE_X = 268;
    let PAG_TOP = 0;
    const clearings = [[SIG_X, SIG_Z, 9.5, 9.5], [PAG_X, PAG_Z, 12, 11], [PAG_X, -PAG_Z, 12, 11]];
    if (rare) clearings.push([STAMP_X, STAMP_Z, 13.5, 9.5]);            // the quay the collector's block comes down on
    const inStamp = (x, z) => rare && Math.abs(x - STAMP_X) < 8.2 && Math.abs(z - STAMP_Z) < 8.2;
    const cleared = (x, z) => clearings.some((c) => Math.abs(x - c[0]) < c[2] && Math.abs(z - c[1]) < c[3]);
    for (const key of ['hut', 'shop', 'big', 'tea', 'stall', 'willow']) L[key] = L[key].map((arr) => arr.filter((o) => !cleared(o.x, o.z)));
    for (let i = lanternAt.length - 1; i >= 0; i--) if (cleared(lanternAt[i][4], lanternAt[i][5])) lanternAt.splice(i, 1);
    // tall pines (their own stream of draws, like everything added with them): a grove at the foot of the rising silk,
    // a few down the lanes behind the last quays, three behind the entry pavilion
    const rngF = ctx.core.makeRng('scroll-far:' + Math.floor(seedF * 1e9));
    G.pine = []; for (let i = 0; i < 2; i++) G.pine.push(await proto((a) => { a.setRng(rngF); protoPine(a, rngF, T); }));
    L.pine = G.pine.map(() => []);
    for (const [px, pz, need] of [[296, 34, 0], [299, 46, 0], [295, 58, 0], [287, 37.5, 1], [279, 38, 1], [271, 37.5, 1], [264, 52, 1], [17, -61, 1], [38, -63, 1], [27, -67, 1], [8, -52, 1]]) for (const sg of px > 100 ? [-1, 1] : [1]) {
      const sc = rngF.range(0.85, 1.15), ry = rngF() * 6.28, which = rngF.int(0, 1);
      if (need && !freeAt(px, sg * pz, 1.2)) continue;
      L.pine[which].push({ x: px, y: px > 291.5 ? Math.max(0, bankH(px)) : BANK, z: sg * pz, ry, sx: sc, sy: sc, sz: sc });
    }
    const names = { hut: 'huts', shop: 'shops', big: 'wine-shops', tea: 'teahouses', stall: 'stalls', willow: 'willows', elm: 'elms', reeds: 'reeds', pine: 'pines' };
    for (const key in G) for (let i = 0; i < G[key].length; i++) if (L[key][i].length) { scene.add(instances(G[key][i], inkMat, L[key][i], names[key])); await ctx.yield(); }

    // ---- unique statics: the wall and gate tower, flag scaffolds, the temple gateway, the tax yard, the well
    const acc = makeAcc(rng);
    buildWall(acc, rng, TL, GATE_Z);
    await ctx.yield();
    const town = makeAcc(rng);
    scaffold(town, 91, -(halfW(91) + 9.5), T, rng);
    await ctx.yield();
    scaffold(town, 117, -(halfW(117) + 9), T, rng);
    await ctx.yield();
    scaffold(town, 129, halfW(129) + 9, T, rng);
    await ctx.yield();
    buildGateway(town, 204, halfW(204) + 10, TL);
    sackStack(town, 191, -(halfW(191) + 8.5), 5, 4, 3, T, rng); sackStack(town, 196.5, -(halfW(196) + 9.2), 3, 3, 2, T, rng);
    sackStack(town, 108, halfW(108) + 3.6, 4, 2, 2, T, rng); sackStack(town, 76, -(halfW(76) + 4), 3, 2, 2, T, rng);
    const wellX = 24, wellZ = -(halfW(24) + 8);
    town.tube(V(wellX, BANK, wellZ), V(wellX, BANK + 1.1, wellZ), 1.1, 1.1, T.stone, [PAT.courses, 0.8, 0.36], { sides: 10, capCol: T.charcoal.lit });
    for (const e of [-0.35, 0.35]) town.tube(V(wellX + 4.1, BANK, wellZ + e), V(wellX + 4.1, BANK + 4.6, wellZ + e), 0.16, 0.12, T.log, [PAT.none], { sides: 5 });
    await ctx.yield();
    // two more banner towers for the camera to rise between at x = 280, cargo on the last quays, and along the village
    // bank mooring posts with their rope turns and a flight of stone steps down into the water (their own stream)
    const east = makeAcc(rngE);
    scaffold(east, 280, -(halfW(280) + 7.5), T, rngE);
    await ctx.yield();
    scaffold(east, 280, halfW(280) + 7.5, T, rngE);
    await ctx.yield();
    sackStack(east, 247, halfW(247) + 3.6, 4, 2, 2, T, rngE); sackStack(east, 271, -(halfW(271) + 3.8), 3, 2, 2, T, rngE);
    for (let x = 8; x < 63; x += rngE.range(4.5, 7.5)) {
      const z = -(halfW(x) - 0.7 - rngE.range(0, 0.5)), lean = rngE.range(-0.1, 0.1), top = 1.5 + rngE.range(0, 0.7);
      if (path.nearestXZ(x, z).dist < 6.5) continue;
      east.tube(V(x, -0.6, z), V(x + lean, top, z), 0.22, 0.17, T.log, [PAT.none], { sides: 6, capCol: T.endGrain });
      east.tube(V(x, 0.7, z), V(x + lean * 0.5, 1.05, z), 0.27, 0.26, T.rope, [PAT.rope, 0.12, 1], { sides: 6, caps: false });
    }
    for (let i = 0; i < 9; i++) east.box(20, BANK - 0.2 - i * 0.37, -(halfW(20) + 0.5 - i * 0.62), 3.0, 0.4, 0.74, T.stoneTop, [PAT.none], {});
    await ctx.yield();
    const eastMesh = new THREE.Mesh(east.build(), inkMat); eastMesh.name = 'east-statics'; scene.add(eastMesh);
    await ctx.yield();
    // ---- the signature on the entry axis: a three-storey pavilion on cinnabar columns under azurite roofs, and the
    // peach tree in blossom by the well. And a place round the seal: two five-storey pagodas on stone terraces at the
    // foot of the rising silk, flanking the seal, and a water gate of two piers with pavilions for the camera to rise over
    const far = makeAcc(rngF);
    far.box(SIG_X, BANK + 0.3, SIG_Z, 10.5, 0.6, 10.5, T.stone, [PAT.courses, 1.6, 0.3], { u0: 0, patTop: [PAT.courses, 1.9, 1.1] });
    pagoda(far, SIG_X, SIG_Z, BANK + 0.6, [8, 6.2, 4.6], 3.2, TL);
    await ctx.yield();
    peachTree(far, wellX - 4.5, wellZ - 3, rngF, T);
    await ctx.yield();
    for (const sg of [-1, 1]) {
      far.box(PAG_X, 1.6, sg * PAG_Z, 11, 3.6, 11, T.stone, [PAT.courses, 1.7, 0.56], { u0: 0, patTop: [PAT.courses, 1.9, 1.1] });
      PAG_TOP = pagoda(far, PAG_X, sg * PAG_Z, 3.4, [9, 7.8, 6.6, 5.4, 4.2], 3.9, TL);        // (the height of the spire's tip, for the gaze)
      await ctx.yield();
      far.box(GATE_X, 3.0, sg * 12.4, 5.2, 6.6, 5.2, T.brick, [PAT.courses, 1.7, 0.56], { u0: 0, patTop: [PAT.courses, 1.9, 1.1] });
      for (let i = 0; i < 4; i++) for (const e of [-1, 1]) { far.box(GATE_X - 2.1 + i * 1.4, 6.75, sg * 12.4 + e * 2.4, 0.8, 0.9, 0.4, T.brick, [PAT.none], {}); far.box(GATE_X + e * 2.4, 6.75, sg * 12.4 - 2.1 + i * 1.4, 0.4, 0.9, 0.8, T.brick, [PAT.none], {}); }
      pagoda(far, GATE_X, sg * 12.4, 6.3, [3.6], 2.6, TL);
      await ctx.yield();
    }
    const farMesh = new THREE.Mesh(far.build(), inkMat); farMesh.name = 'pagodas'; scene.add(farMesh);
    await ctx.yield();
    const wallMesh = new THREE.Mesh(acc.build(), inkMat); wallMesh.name = 'city-wall'; scene.add(wallMesh);
    await ctx.yield();
    const townMesh = new THREE.Mesh(town.build(), inkMat); townMesh.name = 'town-statics'; scene.add(townMesh);
    // the well sweep: a long lever that dips
    const sw = makeAcc(rng);
    sw.tube(V(-4.2, 0, 0), V(5.2, 0, 0), 0.13, 0.09, T.log, [PAT.none], { sides: 5 });
    sw.box(5.0, -0.3, 0, 0.7, 0.6, 0.6, T.stone, [PAT.none], { bottom: true });
    sw.beam(V(-4.1, 0, 0), V(-4.1, -3.4, 0), 0.05, 0.05, T.timber); sw.tube(V(-4.1, -4.0, 0), V(-4.1, -3.4, 0), 0.26, 0.32, T.timber, [PAT.planks, 9, 0.2], { sides: 7 });
    const sweep = new THREE.Mesh(sw.build(), inkMat); sweep.position.set(wellX + 4.1, BANK + 4.4, wellZ); sweep.rotation.y = 0.0; scene.add(sweep);
    await ctx.yield();

    // ---- moored grain barges and passenger boats, two and three abreast (the hero's hull and mast, instanced)
    const boats = [];
    const tryBoat = (x, z, sc, ry, ph, tilt) => { if (Math.abs(z) > 6 && ((x > 262 && Math.abs(x - 284) < 12.5 * sc + 4.5) || Math.abs(x - GATE_X) < 12.5 * sc + 4.5)) return; for (const t of [-1, 0, 1]) if (path.nearestXZ(x + t * 11.5 * sc, z).dist < 9.5) return; boats.push({ x, z, sc, ry, ph, tilt }); };
    for (const sg of [-1, 1]) for (let kk = 0; kk < 3; kk++) {
      let x = (kk ? 9 : 1) + rng.range(0, 10);
      while (x < 236) {
        const small = x < 62 || kk === 2, sc = small ? rng.range(0.42, 0.62) : rng.range(0.62, 0.92), len = 25 * sc, keep = rng(), up = rng.chance(0.5), jit = rng.range(-0.07, 0.07), ph = rng() * 6.28, low = rng.chance(0.4), gap = rng.range(2, 8);
        if (x > 135 - len / 2 && x < 188 + len / 2) { x = 188 + len / 2 + gap; continue; }
        if (keep < (kk === 0 ? 0.86 : kk === 1 ? 0.6 : 0.3) * density * (1 + 0.5 * look.busy)) tryBoat(x, sg * (halfW(x) - 0.9 - (kk + 0.5) * 5.3 * (small ? 0.62 : 0.95)), sc, (up ? 1 : -1) * Math.PI / 2 + jit, ph, low ? -1.36 : rng.range(-0.1, 0.02));
        x += len + gap;
      }
    }
    // east of the old end of the picture the moored rows go on, and punts lie under the village bank (their own stream)
    const nb0 = boats.length, overlaps = (x, z, len) => boats.some((b) => Math.abs(b.z - z) < 4.5 && Math.abs(b.x - x) < (len + 25 * b.sc) / 2 + 1.5);
    for (const sg of [-1, 1]) for (let kk = 0; kk < 2; kk++) {
      let x = (sg > 0 && cast === 'fleet' ? 268 : 240) + rngE.range(0, 8);
      while (x < 286) {
        const small = kk === 1, sc = small ? rngE.range(0.4, 0.55) : rngE.range(0.62, 0.9), len = 25 * sc, keep = rngE(), up = rngE.chance(0.5), jit = rngE.range(-0.07, 0.07), ph = rngE() * 6.28, low = rngE.chance(0.4), gap = rngE.range(2, 8), tl = rngE.range(-0.1, 0.02);
        const z = sg * (halfW(x) - 0.9 - (kk + 0.5) * 5.3 * (small ? 0.62 : 0.95));
        if (keep < (kk === 0 ? 0.9 : 0.5) * density && !overlaps(x, z, len)) tryBoat(x, z, sc, (up ? 1 : -1) * Math.PI / 2 + jit, ph, low && x < 258 ? -1.36 : tl);
        x += len + gap;
      }
    }
    for (const x of [13, 27, 41, 56]) {
      const z = -(halfW(x) - 2.1), sc = rngE.range(0.26, 0.34), ph = rngE() * 6.28, jit = rngE.range(-0.12, 0.12);
      if (path.nearestXZ(x, z).dist > 7.5 && !overlaps(x, z, 25 * sc)) boats.push({ x, z, sc, ry: Math.PI / 2 + jit, ph, tilt: -1.36 });
    }
    const hullInst = new THREE.InstancedMesh(hero.geo.hull, inkMat, Math.max(1, boats.length)), mastInst = new THREE.InstancedMesh(hero.geo.mast, inkMat, Math.max(1, boats.length));
    hullInst.count = mastInst.count = boats.length; hullInst.frustumCulled = mastInst.frustumCulled = false; hullInst.name = 'moored-hulls'; mastInst.name = 'moored-masts';
    hullInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mastInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(hullInst, mastInst);
    // what each moored hull lays on the water: one flat quad per boat just over the silk, drawn after it
    let reflAttr = null;
    {
      const g = new THREE.InstancedBufferGeometry(), B = new Float32Array((boats.length + 3) * 4);
      boats.forEach((b, i) => B.set([b.x, b.z, b.ry, b.sc], i * 4));
      for (let i = 0; i < 3; i++) B.set([0, 900, 0, 0.3], (boats.length + i) * 4);            // the boats under way (written each frame)
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
      reflAttr = new THREE.InstancedBufferAttribute(B, 4); reflAttr.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('aBoat', reflAttr); g.instanceCount = boats.length + 3;
      const reflMat = new THREE.ShaderMaterial({
        uniforms: { uInk: U.uInk, uSilk: U.uSilk, uPale: U.uPale, uWater: SU.uWater, uHull: { value: T.hull.lit }, uTime: U.uTime, uFade: U.uFade, uMist: U.uMist, uMistBand: U.uMistBand, uClip: U.uClip, uRipple: U.uRipple },
        vertexShader: REFL_VERT, fragmentShader: REFL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      const refl = new THREE.Mesh(g, reflMat); refl.frustumCulled = false; refl.name = 'hull-reflections'; refl.renderOrder = -0.4; scene.add(refl);
    }
    // whorls: the four pier noses and the sterns of the hulls nearest our course
    const obs = SU.uObs.value;
    obs[0].set(171.6, -18.2, 3.1); obs[1].set(171.6, 18.2, 3.1); obs[2].set(150.6, -18.4, 3.1); obs[3].set(150.6, 18.4, 3.1);
    boats.slice().sort((a, b) => path.nearestXZ(a.x, a.z).dist - path.nearestXZ(b.x, b.z).dist).slice(0, 6).forEach((b, i) => obs[4 + i].set(b.x + 12.5 * b.sc, b.z, 2.7));
    await ctx.yield();

    // ---- the towed barge (grain-fleet day), the ferry, sedan chairs
    const fleet = new THREE.Group(); fleet.name = 'towed-barge';
    if (cast === 'fleet') {
      const fm = new THREE.Mesh(hero.geo.mast, inkMat); fm.position.set(0, 2.4, -5.2); fm.rotation.x = -1.3;
      fleet.add(new THREE.Mesh(hero.geo.hull, inkMat), fm); fleet.rotation.y = Math.PI / 2; fleet.position.set(236, 0, 11.6); scene.add(fleet);
    }
    const TOW_N = 12, towZ = (x) => { const z = halfW(x) + 1.5; return z + (32.5 - z) * sstep(144, 152, x) * (1 - sstep(170, 178, x)); };
    let towMen = null, towRope = null; const towPts = [];
    if (cast === 'fleet') {
      // twelve men leaning on the line, in step, on the right-bank tow path ahead of the barge. Their mesh is turned
      // so that the crowd shader's lean (its +z) points upstream; homes are written each frame from u
      const list = [];
      for (let i = 0; i < TOW_N; i++) list.push({ x: 0, y: BANK, z: 0, ph: 0, kind: 2, h: rng.range(2.9, 3.15), lean: 0.9, hat: i % 3 === 0, col: i % 2 ? grey : mx(grey, pale, 0.45) });
      towMen = buildCrowd(list, hero.mats.dab); towMen.name = 'towmen'; towMen.rotation.y = -Math.PI / 2; towMen.geometry.attributes.aHome.setUsage(THREE.DynamicDrawUsage); scene.add(towMen);
      towRope = makeRibbons(40, hero.mats.rib); towRope.mesh.name = 'tow-line'; scene.add(towRope.mesh);
      for (let i = 0; i < TOW_N + 8; i++) towPts.push(V(0, 0, 0));
    }
    const ferry = new THREE.Mesh(hero.geo.hull, inkMat); ferry.scale.set(0.34, 0.42, 0.3); ferry.position.set(96, -0.05, -17); ferry.name = 'ferry'; scene.add(ferry);
    const ferry2 = new THREE.Mesh(hero.geo.hull, inkMat); ferry2.scale.set(0.34, 0.42, 0.3); ferry2.position.set(276, -0.05, 9); ferry2.name = 'ferry-east'; scene.add(ferry2);
    // a sculled sampan inside the arc of the opening swing, 5 m off our course, broadside to the eye as we come round
    const SAMPAN = { x: 39.5, z: -10.8, ry: -1.864 }, sampan = new THREE.Mesh(hero.geo.hull, inkMat);
    sampan.scale.set(0.3, 0.36, 0.3); sampan.position.set(SAMPAN.x, -0.04, SAMPAN.z); sampan.rotation.order = 'YXZ'; sampan.rotation.y = SAMPAN.ry; sampan.name = 'sampan'; scene.add(sampan);
    obs[10].set(SAMPAN.x + 3.9 * Math.sin(SAMPAN.ry), SAMPAN.z + 3.9 * Math.cos(SAMPAN.ry), 2.6);      // a whorl astern of it
    // ---- boats under way in mid-channel on the reach, keyed to u so that every view down the reach has its traffic (their
    // own stream of draws): a junk hove-to under a battened mat sail, squared across the hull, a streamer at each yard-arm;
    // a passenger sampan sculled upstream past our starboard side; a small sampan ahead of us by the bridge, on the side
    // the sheering barge leaves open. Each lays a wake and its own strokes on the water, and carries its people
    const rngT = ctx.core.makeRng('scroll-traffic:' + Math.floor(seedF * 1e9));
    const laneTab = []; for (let i = 0; i <= 120; i++) { const q = path.pointAt(0.15 + 0.4 * i / 120); laneTab.push([q.x, q.z]); }
    const zPathAt = (x) => { let k = 0; while (k < laneTab.length - 2 && laneTab[k + 1][0] < x) k++; const a = laneTab[k], b = laneTab[k + 1], t = Math.min(1, Math.max(0, (x - a[0]) / Math.max(1e-3, b[0] - a[0]))); return a[1] + (b[1] - a[1]) * t; };
    const sheer = hero.object.children.find((c) => c.isGroup && c !== hero.barge.object && c.children.length === 2 && c.children[0].geometry === hero.geo.hull);
    const openSide = sheer && sheer.position.x > 0 ? -1 : 1;
    const junk = new THREE.Group(); junk.name = 'junk';
    {
      const a = makeAcc(rngT), SZ = -5.0, Y0 = 4.9, Y1 = 15.0, HW = 3.3, NX = 4, NY = 8, sailTone = T.oiled;
      a.setAnim(0, Y1, SZ, 2);
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
        const x0 = -HW + (2 * HW * i) / NX, x1 = -HW + (2 * HW * (i + 1)) / NX, y0 = Y0 + ((Y1 - Y0) * j) / NY, y1 = Y0 + ((Y1 - Y0) * (j + 1)) / NY;
        const bz = (x, y) => SZ - 0.55 * (1 - (x / HW) * (x / HW)) * Math.sin(Math.PI * (0.15 + 0.7 * (y - Y0) / (Y1 - Y0)));
        a.quad(V(x0, y0, bz(x0, y0)), V(x1, y0, bz(x1, y0)), V(x1, y1, bz(x1, y1)), V(x0, y1, bz(x0, y1)), sailTone, [PAT.planks, 99, 0.42], { double: true, u0: x0 + HW, v0: y0, edges: [i === 0 ? 1 : 0, i === NX - 1 ? 1 : 0, 1, 1], col: (i + j) % 5 === 0 ? sailTone.shade : sailTone.lit });
      }
      a.setAnim(0, 0, 0, 0);
      a.tube(V(-HW - 0.4, Y1 + 0.05, SZ), V(HW + 0.4, Y1 + 0.05, SZ), 0.13, 0.1, T.log, [PAT.none], { sides: 6, capCol: T.endGrain });
      a.tube(V(-HW - 0.2, Y0 - 0.05, SZ), V(HW + 0.2, Y0 - 0.05, SZ), 0.11, 0.09, T.log, [PAT.none], { sides: 6, capCol: T.endGrain });
      cloth(a, V(HW + 0.3, Y1 - 0.1, SZ + 0.1), V(HW + 0.95, Y1 - 0.1, SZ + 0.1), 3.4, T.cloth, [PAT.stripes, 0.33, 2], T.red.lit);
      cloth(a, V(-HW - 0.95, Y1 - 0.1, SZ + 0.1), V(-HW - 0.3, Y1 - 0.1, SZ + 0.1), 2.6, T.cloth, [PAT.stripes, 0.33, 2], T.blue.lit);
      const jm = new THREE.Mesh(hero.geo.mast, inkMat); jm.position.set(0, 2.4, -5.2); jm.rotation.x = -0.03;
      const sail = new THREE.Mesh(a.build(), inkMat); sail.name = 'junk-sail';
      junk.add(new THREE.Mesh(hero.geo.hull, inkMat), jm, sail);
      for (const m of junk.children) m.frustumCulled = false;
    }
    const JUNK_SC = 0.76; junk.scale.setScalar(JUNK_SC); junk.rotation.order = 'YXZ'; junk.position.set(79, 0, 5); junk.rotation.y = -Math.PI / 2; scene.add(junk);
    const skiffUp = new THREE.Mesh(hero.geo.hull, inkMat); skiffUp.scale.set(0.36, 0.44, 0.32); skiffUp.rotation.order = 'YXZ'; skiffUp.position.set(126, -0.05, 1.5); skiffUp.name = 'passenger-sampan'; skiffUp.frustumCulled = false; scene.add(skiffUp);
    const skiffBr = new THREE.Mesh(hero.geo.hull, inkMat); skiffBr.scale.set(0.3, 0.36, 0.28); skiffBr.rotation.order = 'YXZ'; skiffBr.position.set(142, -0.05, 9); skiffBr.name = 'bridge-sampan'; skiffBr.frustumCulled = false; scene.add(skiffBr);
    // their people: (boat, across, height, along the hull toward the stern)
    const afloat = [[0, 1.6, 1.75, -10.6], [0, -1.5, 1.75, -9.6], [0, 1.9, 1.6, -0.6], [0, 1.9, 3.1, 10.6], [1, 0.5, 3.1, 10.8], [1, 0.7, 1.6, -2.0], [1, -0.7, 1.6, -5.5], [2, 0.5, 3.1, 10.8], [2, 0.0, 1.6, -4.0]];
    const afloatMesh = buildCrowd(afloat.map((c, i) => ({ x: 0, y: 0, z: 900, ph: rngT() * 6, kind: 2, h: c[0] === 0 ? rngT.range(1.9, 2.2) : rngT.range(2.1, 2.5), lean: c[3] > 9 ? 0.12 : 0, hat: i % 2 === 0, col: [grey, cin, pale, azu, grey, cin, mx(gold, ochre, 0.3), grey, mal][i] })), hero.mats.dab);
    afloatMesh.name = 'afloat'; afloatMesh.geometry.attributes.aHome.setUsage(THREE.DynamicDrawUsage); scene.add(afloatMesh);
    const trafPose = [{ x: 79, z: 5, ry: -Math.PI / 2, sc: JUNK_SC, sy: JUNK_SC, y: 0 }, { x: 126, z: 1.5, ry: Math.PI / 2, sc: 0.34, sy: 0.44, y: 0 }, { x: 142, z: 9, ry: Math.PI / 2, sc: 0.29, sy: 0.36, y: 0 }];
    await ctx.yield();
    const sd = makeAcc(rng);
    sd.box(0, 1.9, 0, 1.5, 2.0, 1.7, T.plaster, [PAT.none], { bottom: true });
    for (const sx of [-1, 1]) sd.quad(V(sx * 0.76, 1.7, -0.6), V(sx * 0.76, 1.7, 0.6), V(sx * 0.76, 2.6, 0.6), V(sx * 0.76, 2.6, -0.6), T.rail, [PAT.lattice, 0.2, 0.2], { double: true });
    sd.cone(0, 2.9, 0, 1.45, 0.75, 4, T.oiled, { phase: Math.PI / 4 });
    for (const sx of [-1, 1]) sd.beam(V(sx * 0.82, 1.5, -3.2), V(sx * 0.82, 1.5, 3.2), 0.09, 0.09, T.timber);
    cloth(sd, V(-0.6, 2.85, 0.87), V(0.6, 2.85, 0.87), 1.5, T.cloth, [PAT.none], T.blue.lit);
    const sedans = [], walkers = [];
    const robes = [pale, mx(pale, ochre, 0.6), ochre, mx(grey, pale, 0.45), grey, mx(silk, pale, 0.4), mx(green, pale, 0.2), mx(grey, ink, 0.35)];
    // about a third of the robes are grey or ink-grey, so a crowd is never a row of identical pale wedges
    // and two in five wear a mineral colour, unthinned: cinnabar, azurite, malachite, gold
    const tints = [cin, azu, mal, mx(gold, ochre, 0.3)]; let robeN = 0;
    const robeOf = (q) => {
      const c = q() < 0.34 ? robes[q.chance(0.5) ? 4 : q.chance(0.5) ? 7 : 3] : robes[Math.min(robes.length - 1, Math.floor(q() * q() * robes.length * 1.6))];
      robeN++;
      return robeN % 5 < 2 ? tints[robeN % 4] : c;
    };
    const robe = () => robeOf(rng);
    const addSedan = (ax, az, bx, bz, speed, ph) => {
      const len = Math.hypot(bx - ax, bz - az);
      sedans.push({ ax, az, bx, bz, len, speed, ph, yaw: Math.atan2(bx - ax, bz - az) });
      for (const e of [-2.6, 2.6]) walkers.push({ a: [ax, BANK, az, ph + e / len], b: [bx, BANK, bz, speed], h: 2.5, hat: true, loop: true, col: grey });
    };
    addSedan(98, 26.2, 134, 26.2, 2.6, rng()); addSedan(134, 27.8, 98, 27.8, 2.4, rng());
    if (cast === 'festival') {            // the bridal procession: sedan chairs and their train along the left embankment
      const p0 = rng();
      for (let i = 0; i < 3; i++) addSedan(72, -(halfW(101) + 3.6), 134, -26.6, 1.7, p0 + i * 0.12);
      for (let i = 0; i < 22; i++) walkers.push({ a: [72, BANK, -(halfW(101) + 3.6) + rng.range(-0.8, 0.8), p0 - 0.05 + i * 0.019 + (i > 10 ? 0.06 : 0)], b: [134, BANK, -26.6, 1.7], h: rng.range(2.4, 2.8), hat: i % 3 === 0, loop: true, col: i % 2 ? pale : mx(pale, ochre, 0.5) });
    }
    const sedanInst = new THREE.InstancedMesh(sd.build(), inkMat, sedans.length); sedanInst.frustumCulled = false; sedanInst.name = 'sedans';
    sedanInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(sedanInst);
    await ctx.yield();

    // ---- dab-figures on the lanes and streets
    // the embankment lanes: people stand and walk in knots of two to five (and a few crowds), children among them;
    // some of those standing hold a parasol, some of those walking carry a shoulder pole with two baskets
    const lanes = [[-1, 2, 148], [-1, 219, 240], [1, 2, 148], [1, 174, 238]], held = [];
    const nLane = Math.round(900 * detail * Math.min(1.3, density) * (1 + 0.2 * look.busy)), laneLen = lanes.reduce((t, l) => t + l[2] - l[1], 0);
    for (let made = 0, guard = 0; made < nLane && guard < 2000; guard++) {
      let pick = rng() * laneLen, li = 0; while (li < lanes.length - 1 && pick > lanes[li][2] - lanes[li][1]) { pick -= lanes[li][2] - lanes[li][1]; li++; }
      const ln = lanes[li], sg = ln[0];
      const town = rng.chance(0.78), cx0 = town ? rng.range(Math.max(ln[1], 68), ln[2]) : rng.range(ln[1], ln[2]), cd = rng.range(1.6, 5.4), still = rng.chance(0.4);
      const big = rng.chance(0.22), n = big ? rng.int(9, 20) : rng.int(2, 5), spread = big ? 2.6 : 1.3;
      const travel = (rng.chance(0.5) ? 1 : -1) * rng.range(8, 30), ph = rng(), speed = rng.range(1.3, 2.6);
      for (let k = 0; k < n; k++, made++) {
        const x0 = Math.min(ln[2], Math.max(ln[1], cx0 + rng.gauss() * spread)), d = Math.min(5.8, Math.max(1.2, cd + rng.gauss() * 0.7));
        const x1 = Math.min(ln[2], Math.max(ln[1], x0 + travel)), child = rng.chance(0.15), carry = rng();
        const z0 = sg * (halfW(x0) + 1 + d), z1 = sg * (halfW(x1) + 1 + d + rng.range(-0.4, 0.4)), h = child ? rng.range(1.5, 1.95) : rng.range(2.25, 2.85);
        walkers.push({ a: [x0, bankH(x0), z0, ph + rng.range(-0.004, 0.004)], b: still ? [x0, bankH(x0), z0, 0] : [x1, bankH(x1), z1, speed], h, hat: !still && !child && carry < 0.2 ? 2 : rng.chance(0.25), lean: still ? rng.range(-0.25, 0.25) : 0, col: robe() });
        if (still && !child && carry < (look.snow ? 0.45 : 0.24)) held.push({ x: x0 + 0.3, y: bankH(x0), z: z0, ry: rng() * 6.28, sx: 1, sy: h / 2.6, sz: 1 });
      }
      if (guard % 40 === 39) await ctx.yield();
    }
    // the lanes east of the old end of the picture and the street at x = 262 (their own stream)
    {
      const lanesE = [[-1, 240, 290], [1, 238, 290]], nE = Math.round(300 * detail * Math.min(1.3, density) * (1 + 0.2 * look.busy));
      for (let made = 0, guard = 0; made < nE && guard < 700; guard++) {
        const ln = lanesE[rngE.int(0, 1)], sg = ln[0], cx0 = rngE.range(ln[1], ln[2]), cd = rngE.range(1.6, 5.4), still = rngE.chance(0.4);
        const big = rngE.chance(0.22), n = big ? rngE.int(9, 18) : rngE.int(2, 5), spread = big ? 2.6 : 1.3;
        const travel = (rngE.chance(0.5) ? 1 : -1) * rngE.range(8, 30), ph = rngE(), speed = rngE.range(1.3, 2.6);
        for (let k = 0; k < n; k++, made++) {
          const x0 = Math.min(ln[2], Math.max(ln[1], cx0 + rngE.gauss() * spread)), d = Math.min(5.8, Math.max(1.2, cd + rngE.gauss() * 0.7));
          const x1 = Math.min(ln[2], Math.max(ln[1], x0 + travel)), child = rngE.chance(0.15), carry = rngE();
          const z0 = sg * (halfW(x0) + 1 + d), z1 = sg * (halfW(x1) + 1 + d + rngE.range(-0.4, 0.4)), h = child ? rngE.range(1.5, 1.95) : rngE.range(2.25, 2.85);
          walkers.push({ a: [x0, bankH(x0), z0, ph + rngE.range(-0.004, 0.004)], b: still ? [x0, bankH(x0), z0, 0] : [x1, bankH(x1), z1, speed], h, hat: !still && !child && carry < 0.2 ? 2 : rngE.chance(0.25), lean: still ? rngE.range(-0.25, 0.25) : 0, col: robeOf(rngE) });
          if (still && !child && carry < (look.snow ? 0.45 : 0.24)) held.push({ x: x0 + 0.3, y: bankH(x0), z: z0, ry: rngE() * 6.28, sx: 1, sy: h / 2.6, sz: 1 });
        }
        if (guard % 40 === 39) await ctx.yield();
      }
      for (let i = 0; i < Math.round(70 * detail * density); i++) {
        const sd = rngE.chance(0.5) ? 1 : -1, x = 262 + rngE.range(-2.6, 2.6), zmin = halfW(262) + 8;
        const za = sd * rngE.range(zmin, 70), zb = sd * Math.min(72, Math.max(zmin, Math.abs(za) + (rngE.chance(0.5) ? 1 : -1) * rngE.range(8, 26)));
        walkers.push({ a: [x, BANK, za, rngE()], b: [x + rngE.range(-0.5, 0.5), BANK, zb, rngE.range(1.2, 2.4)], h: rngE.range(2.3, 2.85), hat: rngE.chance(0.25), col: robeOf(rngE) });
      }
    }
    await ctx.yield();
    {
      const a = makeAcc(rng);
      a.tube(V(0, 1.1, 0), V(0.2, 3.5, 0), 0.05, 0.045, T.timber, [PAT.none], { sides: 5, caps: false });
      a.setAnim(0.2, 3.5, 0, 1); a.cone(0.2, 3.3, 0, 1.35, 0.5, 10, look.snow ? T.cloth : T.oiled, {}); a.setAnim(0, 0, 0, 0);
      scene.add(instances(a.build(), inkMat, rare ? held.filter((o) => !inStamp(o.x, o.z)) : held, 'held-parasols'));
    }
    await ctx.yield();
    const streets = [[86, 1], [86, -1], [121, 1], [121, -1], [161, 1], [161, -1], [199, -1], [199, 1]];
    for (let i = 0; i < Math.round(300 * detail * density); i++) {
      const s0 = streets[rng.int(0, streets.length - 1)], wide = s0[0] === 161 ? 5.6 : 2.6, x = s0[0] + rng.range(-wide, wide), zmin = (s0[0] === 161 ? 34 : halfW(s0[0]) + 8);
      const za = s0[1] * rng.range(zmin, 70), zb = s0[1] * Math.min(72, Math.max(zmin, Math.abs(za) + (rng.chance(0.5) ? 1 : -1) * rng.range(8, 26)));
      walkers.push({ a: [x, BANK, za, rng()], b: [x + rng.range(-0.5, 0.5), BANK, zb, rng.range(1.2, 2.4)], h: rng.range(2.3, 2.85), hat: rng.chance(0.25), col: robe() });
    }
    for (let i = 0; i < Math.round(70 * detail); i++) {       // village folk about the huts, the well and the threshing floor
      const sg = rng.chance(0.7) ? -1 : 1, x = rng.range(2, 66), z = sg * (halfW(x) + 1 + rng.range(6.5, 26));
      walkers.push({ a: [x, BANK, z, rng()], b: rng.chance(0.5) ? [x, BANK, z, 0] : [x + rng.range(-9, 9), BANK, z + rng.range(-3, 3), rng.range(1, 2)], h: rng.range(2.3, 2.8), hat: rng.chance(0.5), col: robe() });
    }
    walkers.push({ a: [SAMPAN.x - 0.5, 0.55, SAMPAN.z - 0.15, 0.3], b: [SAMPAN.x - 0.5, 0.55, SAMPAN.z - 0.15, 0], h: 2.3, hat: true, lean: 0.15, col: grey });   // the sculler
    boats.forEach((b, bi) => {                                    // crews on the moored boats
      const q = bi < nb0 ? rng : rngE, n = q.int(1, 3), c = Math.cos(b.ry), sn = Math.sin(b.ry);
      for (let i = 0; i < n; i++) { const lx = q.range(-1.6, 1.6) * b.sc, lz = q.range(-10.5, 0.5) * b.sc; walkers.push({ a: [b.x + lx * c + lz * sn, 1.6 * b.sc, b.z - lx * sn + lz * c, q()], b: [b.x + lx * c + lz * sn, 1.6 * b.sc, b.z - lx * sn + lz * c, 0], h: q.range(2.2, 2.7) * Math.max(0.75, b.sc), hat: q.chance(0.6), lean: q.range(-0.2, 0.2), col: robeOf(q) }); }
    });
    // the last quays, the terraces of the two pagodas and their steps: a crowd come to see the seal (their own stream)
    for (let i = 0; i < Math.round(150 * detail); i++) {
      const sg = rngF.chance(0.5) ? 1 : -1, x = rngF.range(264, 291.5), d = rngF.range(1.2, 8.5), z = sg * (halfW(x) + 1 + d), still = rngF.chance(0.6), h = rngF.chance(0.15) ? rngF.range(1.5, 1.95) : rngF.range(2.3, 2.85), ph = rngF(), tx = rngF.range(-12, 12), sp = rngF.range(1.2, 2.2), hat = rngF.chance(0.25);
      if (Math.abs(x - GATE_X) < 3.6 && d < 1.6) continue;
      walkers.push({ a: [x, bankH(x), z, ph], b: still ? [x, bankH(x), z, 0] : [Math.min(291.5, Math.max(264, x + tx)), BANK, z, sp], h, hat, lean: still ? rngF.range(-0.2, 0.2) : 0, col: robeOf(rngF) });
    }
    for (let i = 0; i < Math.round(36 * detail); i++) {
      const sg = i % 2 ? 1 : -1, side = rngF.int(0, 2), t = rngF.range(-4.9, 4.9), x = side === 0 ? PAG_X - 5.0 : PAG_X + t, z = sg * (side === 0 ? PAG_Z + t : PAG_Z + (side === 1 ? -5.0 : 5.0));
      walkers.push({ a: [x, 3.4, z, rngF()], b: [x, 3.4, z, 0], h: rngF.range(2.3, 2.8), hat: rngF.chance(0.3), lean: rngF.range(-0.2, 0.2), col: robeOf(rngF) });
    }
    const walkMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uInk: U.uInk, uSilk: U.uSilk, uLinePx: U.uLinePx, uFade: U.uFade, uMist: U.uMist, uMistBand: U.uMistBand, uClip: U.uClip, uRipple: U.uRipple, uTime: U.uTime }, vertexShader: WALK_VERT, fragmentShader: DAB_FRAG, side: THREE.DoubleSide, fog: true });
    // (on the rare day nobody stands or walks where the collector's block comes down)
    scene.add(walkerMesh(rare ? walkers.filter((w) => !inStamp(w.a[0], w.a[2]) && !inStamp(w.b[0], w.b[2]) && !inStamp((w.a[0] + w.b[0]) / 2, (w.a[2] + w.b[2]) / 2)) : walkers, walkMat));
    await ctx.yield();

    // ---- cards: donkeys, oxen, pigs, camels, ducks, swallows, lanterns, kites
    const cards = [], cDonkey = mx(grey, pale, 0.35), cCamel = mx(ochre, grey, 0.3), cOx = mx(grey, silk, 0.35), cLantern = pale.clone(), cRed = cin.clone();
    const train = (n, a, b, speed, size, variant, col, spacing) => { const len = Math.hypot(b[0] - a[0], b[2] - a[2]), p0 = rng(); for (let i = 0; i < n; i++) cards.push({ a, b: [b[0], b[1], b[2], speed], k: [0, size * rng.range(0.92, 1.08), variant, p0 + (i * spacing) / len], col }); return p0; };
    train(5, [22, BANK, -35.2], [66, BANK, -34.6], 1.5, 2.3, 0, cDonkey, 4.0);
    const oxP0 = train(2, [134, BANK, 29.6], [100, BANK, 29.6], 1.0, 2.9, 2, cOx, 11);
    // each ox draws a cart: plank bed, a load of sacks, two wheels, shafts
    const cartAcc = makeAcc(rng);
    cartAcc.setAnim(0, 0.8, 0, 3);
    cartAcc.box(0, 1.5, 0, 3.0, 1.2, 1.6, T.timber, [PAT.planks, 3, 0.3], { bottom: true, patTop: [PAT.planks, 3, 0.4] });
    for (let k = 0; k < 3; k++) cartAcc.box(-0.9 + k * 0.9, 2.36 + (k === 1 ? 0.3 : 0), 0, 1.0, 0.56, 1.3, T.cloth, [PAT.none], { taper: 0.8, ry: 0.1 * (k - 1) });
    for (const sz of [-1, 1]) {
      cartAcc.tube(V(0.2, 0.8, sz * 0.92), V(0.2, 0.8, sz * 1.08), 0.8, 0.8, T.beam, [PAT.none], { sides: 8, capCol: T.timber.lit });
      cartAcc.tube(V(0.2, 0.8, sz * 1.08), V(0.2, 0.8, sz * 1.2), 0.18, 0.14, T.log, [PAT.none], { sides: 6 });
      cartAcc.beam(V(-1.5, 1.2, sz * 0.62), V(-3.9, 1.5, sz * 0.5), 0.1, 0.12, T.timber, [PAT.none]);
    }
    cartAcc.setAnim(0, 0, 0, 0);
    const carts = new THREE.InstancedMesh(cartAcc.build(), inkMat, 2); carts.frustumCulled = false; carts.name = 'ox-carts'; carts.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(carts);
    train(4, [199, BANK, -62], [199.6, BANK, -25], 2.3, 1.5, 3, pale, 3.2);
    {   // the camel train: out of the gate, down to the embankment lane and along it against us (two legs of equal
        // length sharing their phases, so each camel that reaches the corner is taken up by the next leg)
      const cz1 = -(halfW(206) + 4), len = Math.hypot(5, GATE_Z - cz1), cz2 = -(halfW(179) + 4), xe = 206 - Math.sqrt(Math.max(1, len * len - (cz2 - cz1) * (cz2 - cz1))), p0 = rng();
      for (let i = 0; i < 8; i++) {
        const size = 3.5 * rng.range(0.88, 1.12), ph = p0 + i / 8;
        cards.push({ a: [camA[0], BANK, camA[1]], b: [206, BANK, cz1, 1.25], k: [0, size, 1, ph], col: cCamel });
        cards.push({ a: [206, BANK, cz1], b: [xe, BANK, cz2, 1.25], k: [0, size, 1, ph], col: cCamel });
      }
    }
    for (let i = 0, tries = 0; i < 9 && tries < 80; tries++) {
      const t = rng.range(13, 48), l = rng.range(-13, 13), x = 40 - 0.87 * t + 0.5 * l, z = 10 - 0.5 * t - 0.87 * l;
      if (path.nearestXZ(x, z).dist < 6 || Math.abs(z) > halfW(x) - 3) continue;
      cards.push({ a: [x, 0.0, z], k: [1, rng.range(1.0, 1.35), 0, rng()], col: pale }); i++;
    }
    // six more inside the arc of the opening swing, 2.5 to 7 m off our course, clear of the sampan (their own stream of
    // draws, so that nothing placed before them moves)
    const xr = vr.fork('basin');
    for (let i = 0, tries = 0; i < 6 && tries < 60; tries++) {
      const a = xr.range(150, 262) * Math.PI / 180, r = xr.range(9, 13.5), x = 48 + r * Math.cos(a), z = -3.9 + r * Math.sin(a);
      if (Math.hypot(x - SAMPAN.x, z - SAMPAN.z) < 4.5) continue;
      cards.push({ a: [x, 0.0, z], k: [1, xr.range(1.0, 1.35), 0, xr()], col: pale }); i++;
    }
    // five more on the water of the first view, between the entry leg and the centre of the swing (their own stream again)
    const rngX = ctx.core.makeRng('scroll-first:' + Math.floor(seedF * 1e9));
    for (let i = 0, tries = 0; i < 5 && tries < 60; tries++) {
      const a = rngX.range(52, 128) * Math.PI / 180, r = rngX.range(4.5, 12.6), x = 48 + r * Math.cos(a), z = -3.9 + r * Math.sin(a), size = rngX.range(1.0, 1.35), ph = rngX();
      if (Math.hypot(x - SAMPAN.x, z - SAMPAN.z) < 4.5 || path.nearestXZ(x, z).dist < 3) continue;
      cards.push({ a: [x, 0.0, z], k: [1, size, 0, ph], col: pale }); i++;
    }
    for (let i = 0; i < Math.round(80 * detail); i++) cards.push({ a: [rng.range(18, 252), rng.range(1.5, 2.3), rng.range(-5, 5)], b: [rng.range(14, 30), rng.range(0.6, 1.1), rng.range(5, 11), rng.range(0.45, 0.95) * (rng.chance(0.5) ? 1 : -1)], k: [2, rng.range(0.55, 0.8), 0, rng()], col: ink });
    for (let i = 0; i < 8; i++) cards.push({ a: [st.x + 20 + i * 4, st.y + 4 + i * 1.6, (i % 2 ? 1 : -1) * rng.range(9, 15)], b: [7, 2.2, 3.5, rng.range(0.7, 1.1)], k: [2, 0.75, 0, rng()], col: ink });
    for (let i = 0; i < 4; i++) {
      const from = st.clone().addScaledVector(dirE, 30 + i * 2.5); from.y += 1.2 - i * 0.9; from.z += (i % 2 ? 1 : -1) * (2.5 + i);
      cards.push({ a: [from.x, from.y, from.z], b: [endP.x + 1.5, endP.y + (i - 1.5) * 0.9, (i % 2 ? 1 : -1) * 1.2, uo(0.895 + i * 0.006)], k: [6, 0.9, 0, rng()], col: ink });
    }
    {   // east of the old end: a second donkey train on the right-bank lane, pigs down the new street, ducks where the river ends
      const za = halfW(246) + 4.4, len = 42, p0 = rngE();
      for (let i = 0; i < 5; i++) cards.push({ a: [288, BANK, za], b: [246, BANK, za, 1.5], k: [0, 2.3 * rngE.range(0.9, 1.1), 0, p0 + (i * 4.0) / len], col: cDonkey });
      const p1 = rngE();
      for (let i = 0; i < 4; i++) cards.push({ a: [262.4, BANK, -60], b: [261.8, BANK, rare ? -34 : -25, 2.2], k: [0, 1.5 * rngE.range(0.9, 1.1), 3, p1 + (i * 3.2) / 35], col: pale });
      for (let i = 0; i < 7; i++) cards.push({ a: [rngE.range(268, 293), 0.0, rngE.range(-9, 9)], k: [1, rngE.range(1.0, 1.35), 0, rngE()], col: pale });
    }
    // paper lanterns under the eaves in every look, on every hook: cinnabar banded with gold (at dusk one in three is pale paper)
    lanternAt.forEach((q, i) => cards.push({ a: [q[0], q[1] - 0.25, q[2]], k: [3, q[3] * rngE.range(2.2, 2.6), 0, rngE()], col: lookId === 'dusk' && i % 3 === 1 ? cLantern : cRed }));
    if (lookId === 'dusk') {
      boats.forEach((b, i) => cards.push({ a: [b.x + 5.5 * b.sc * Math.sin(b.ry), 3.4 * b.sc, b.z + 5.5 * b.sc * Math.cos(b.ry)], k: [3, 1.9, 0, rng()], col: i % 2 ? cLantern : cRed }));   // one at every cabin door
      // the bridge: one at every stall along the lane, and a row on poles above the upstream rail (hero frame: world = (161 - z, y, x))
      for (const sd of [-1, 1]) for (let lx = -24; lx <= 24; lx += 4) cards.push({ a: [HERO_X - sd * 3.1, hero.anchors.deckY(lx) + 1.3, lx], k: [3, 2.0, 0, rng()], col: sd > 0 ? cRed : cLantern });
      for (let lx = -22; lx <= 22; lx += 4.4) cards.push({ a: [HERO_X - 7.15, hero.anchors.deckY(lx) + 1.9, lx], k: [3, 1.8, 0, rng()], col: cLantern });
    }
    // cranes (pale, black-tipped, a cinnabar crown), in every cast: two skeins crossing high over the bridge and the
    // reach, one each way, so that one is always in the upper sky; and two circling in front of the great seal
    for (let f = 0; f < 2; f++) {
      const A = f ? [112, 33, 66] : [214, 41, 58], B = f ? [208, 37, -62] : [108, 44, -66], dx = B[0] - A[0], dz = B[2] - A[2], len = Math.hypot(dx, dz), ax = dx / len, az = dz / len, p0 = rngF() + f * 0.5;
      for (let i = 0; i < (f ? 6 : 7); i++) {
        const k = i - 3, back = -Math.abs(k) * 5.5, lat = k * 4.2, ox = ax * back - az * lat, oz = az * back + ax * lat, oy = rngF.range(-0.6, 0.6);
        cards.push({ a: [A[0] + ox, A[1] + oy, A[2] + oz], b: [B[0] + ox, B[1] + oy, B[2] + oz, 6.5], k: [7, rngF.range(4.6, 5.6), 0, p0], col: pale });
      }
    }
    // (four of them, evenly round a ring that stands outside the seal's collar of cloud: the collar's outer radius,
    // COLLAR_R, plus half a bird's span; 2.6 m off the sheet; the ring's starting angle is the look's own seedF, no draw added)
    const COLLAR_R = 15.65, CRANE = 4.1, RING_R = COLLAR_R + CRANE / 2;
    for (let i = 0; i < 4; i++) cards.push({ a: [sealAt.x - Math.sin(A1) * 2.6, sealAt.y + Math.cos(A1) * 2.6, 0], b: [Math.cos(A1) * RING_R, Math.sin(A1) * RING_R, RING_R, 0.13], k: [7, CRANE, 1, i * 0.25 + seedF], col: pale });
    if (cast === 'festival') for (let i = 0; i < 8; i++) cards.push({ a: [rng.range(204, 238), rng.range(27, 44), rng.range(-70, -22)], k: [4, rng.range(4, 6), 0, rng()], col: i % 2 ? pale : cLantern });
    if (look.snow) for (let i = 0; i < Math.round(2000 * detail); i++) cards.push({ a: [rng.range(-10, 300), rng.range(0, 26), rng.range(-46, 46)], b: [0, 0, 0, rng.range(0.9, 1.9)], k: [5, rng.range(0.45, 0.85), 0, rng()], col: pale });
    await ctx.yield();
    const cardMat = new THREE.ShaderMaterial({ uniforms: { uInk: U.uInk, uSilk: U.uSilk, uGrey: U.uGrey, uLinePx: U.uLinePx, uFade: U.uFade, uMist: U.uMist, uMistBand: U.uMistBand, uClip: U.uClip, uRipple: U.uRipple, uTime: U.uTime, uU: { value: 0 }, uAzur: U.uAzur, uSeal: U.uSeal, uGold: U.uGold }, vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, side: THREE.DoubleSide });
    await ctx.yield();
    scene.add(cardMesh(cards, cardMat, 'cards'));
    await ctx.yield();

    // ---- the collector's block (rare): made now, hidden, and brought down by u onto the bare silk past the wall
    const block = new THREE.Group(); block.name = 'collector-block';
    if (rare) {
      const b = makeAcc(rng), verm = base[6], HB = 7, soapIn = two(mx(T.soap.lit, grey, 0.14), mx(T.soap.shade, grey, 0.2));
      b.box(0, 4.5, 0, 14, 9, 14, T.soap, [PAT.none], { noTop: true });
      // each face: a ruled border 0.6 m in from every edge and a sunk panel inside it
      for (let k = 0; k < 4; k++) {
        b.setXf(new THREE.Matrix4().makeRotationY(k * Math.PI / 2));
        b.quad(V(-HB + 0.6, 0.6, HB + 0.03), V(HB - 0.6, 0.6, HB + 0.03), V(HB - 0.6, 8.4, HB + 0.03), V(-HB + 0.6, 8.4, HB + 0.03), T.soap, [PAT.none], {});
        b.quad(V(-HB + 1.2, 1.2, HB + 0.045), V(HB - 1.2, 1.2, HB + 0.045), V(HB - 1.2, 7.8, HB + 0.045), V(-HB + 1.2, 7.8, HB + 0.045), T.soap, [PAT.none], {});      // the second border
        b.quad(V(-HB + 1.5, 1.5, HB + 0.06), V(HB - 1.5, 1.5, HB + 0.06), V(HB - 1.5, 7.5, HB + 0.06), V(-HB + 1.5, 7.5, HB + 0.06), soapIn, [PAT.none], {});
        // one incised cloud scroll: a squared spiral of four strokes, the same on every face
        const sc4 = [[-2.6, 5.9], [2.6, 5.9], [2.6, 3.1], [-1.5, 3.1], [-1.5, 4.7]];
        for (let i = 0; i + 1 < sc4.length; i++) {
          const p0 = sc4[i], p1 = sc4[i + 1], hz = p0[1] === p1[1], cxm = (p0[0] + p1[0]) / 2, cym = (p0[1] + p1[1]) / 2;
          b.box(cxm, cym, HB + 0.1, hz ? Math.abs(p1[0] - p0[0]) + 0.34 : 0.34, hz ? 0.34 : Math.abs(p1[1] - p0[1]) + 0.34, 0.1, T.soap, [PAT.none], { u0: 0 });
        }
        // and a band of squared frets across the head and the foot of the panel: nine keys each, standing proud
        for (const [fy, up] of [[6.72, 1], [2.28, -1]]) for (let kx = -4; kx <= 4; kx++) {
          const fx = kx * 1.12;
          b.box(fx, fy + up * 0.3, HB + 0.1, 0.84, 0.13, 0.08, T.soap, [PAT.none], { u0: 0 });
          b.box(fx - 0.355, fy, HB + 0.1, 0.13, 0.6, 0.08, T.soap, [PAT.none], { u0: 0 });
          b.box(fx - 0.08, fy - up * 0.3, HB + 0.1, 0.68, 0.13, 0.08, T.soap, [PAT.none], { u0: 0 });
          b.box(fx + 0.195, fy - up * 0.1, HB + 0.1, 0.13, 0.4, 0.08, T.soap, [PAT.none], { u0: 0 });
        }
      }
      b.setXf(null);
      // chamfered shoulders, a stepped plinth, and the knob: a crouching beast
      b.box(0, 9.6, 0, 14, 1.2, 14, T.soap, [PAT.none], { taper: 0.886 }); b.box(0, 10.7, 0, 12.4, 1.0, 12.4, T.soap, [PAT.none], { taper: 0.73 });
      b.box(0, 11.5, 0, 8, 0.6, 8, T.soap, [PAT.none], {}); b.box(0, 12.05, 0, 6.6, 0.5, 6.6, soapIn, [PAT.none], {});
      const y0 = 12.3;
      b.box(0, y0 + 1.0, 0, 3.0, 2.0, 5.0, T.soap, [PAT.none], { taper: 0.8 });                 // body
      b.box(0, y0 + 1.3, -1.7, 3.5, 2.6, 2.3, T.soap, [PAT.none], { taper: 0.7 });              // haunches
      b.box(0, y0 + 2.4, 2.5, 2.3, 2.0, 2.2, T.soap, [PAT.none], { taper: 0.82, bottom: true });   // head
      b.box(0, y0 + 1.95, 3.85, 1.4, 1.0, 1.0, T.soap, [PAT.none], { taper: 0.8, bottom: true }); // muzzle
      for (const sx of [-1, 1]) {
        b.box(sx * 0.78, y0 + 3.65, 2.2, 0.55, 0.7, 0.5, T.soap, [PAT.none], { taper: 0.3 });   // ears
        b.box(sx * 1.15, y0 + 0.35, 2.8, 0.9, 0.7, 2.2, T.soap, [PAT.none], { taper: 0.85 });   // forepaws
      }
      b.box(0, y0 + 2.5, -2.95, 0.7, 1.5, 0.8, T.soap, [PAT.none], { taper: 0.45 });            // tail
      // the cord through the knob, hanging down two faces to its tassels
      for (const sx of [-1, 1]) {
        const c = [V(sx * 1.55, y0 + 0.9, 0.9), V(sx * 3.6, y0 + 0.1, 1.2), V(sx * 5.2, 11.05, 1.5), V(sx * 6.75, 10.0, 1.7), V(sx * 7.25, 8.6, 1.8), V(sx * 7.3, 6.2 + sx * 0.7, 1.9)];
        for (let i = 0; i + 1 < c.length; i++) b.tube(c[i], c[i + 1], 0.17, 0.17, T.rope, [PAT.rope, 0.2, 1], { sides: 6, caps: false });
        b.tube(c[5], V(c[5].x, c[5].y - 0.5, c[5].z), 0.3, 0.3, T.rope, [PAT.rope, 0.12, 1], { sides: 7 });
        b.cone(c[5].x, c[5].y - 2.3, c[5].z, 0.55, 1.8, 8, T.oiled, {});
      }
      b.tube(V(-1.55, y0 + 0.9, 0.9), V(1.55, y0 + 0.9, 0.9), 0.17, 0.17, T.rope, [PAT.rope, 0.2, 1], { sides: 6, caps: false });
      // the face: the carved fret, loaded with vermilion (seen as the block lifts)
      [1, 0.8, 0.64, 0.5, 0.36, 0.22, 0.08].forEach((f, i) => { const r = HB * f, y = -0.02 * i; b.quad(V(-r, y, -r), V(r, y, -r), V(r, y, r), V(-r, y, r), T.soap, [PAT.none], { col: i % 2 ? T.soap.shade : verm }); });
      await ctx.yield();
      block.add(new THREE.Mesh(b.build(), rollMat)); block.position.set(STAMP_X, 120, STAMP_Z); block.visible = false; scene.add(block);
    }

    // ---- motion
    const _cp = new THREE.Vector3(), _tan = new THREE.Vector3(), _m5 = new THREE.Matrix4(), X_LIFT = x0l;
    // seen through the previous portal the camera stands back behind the entry (camera.nearThrough draws the silk
    // there), as far as 60 m and off to one side: among the right-bank shops. So while ctx.through is true everything
    // that stands up from the silk behind the entry plane is left out, as the opening's own plane would leave it out,
    // and the opening shows flow lines and bank tops in front of the entry view. Only a uniform changes
    const thruA = path.pointAt(0), thruB = thruA.clone().sub(path.pointAt(0.004)).setY(0).normalize();
    const uA = path.nearestXZ(122, 0.7).u, uB = path.nearestXZ(161, 1.5).u, uC = path.nearestXZ(190, 0).u;      // mast, crown, clear of the bridge
    const mastHead = V(130, 12, -3), gatePoi = V(196, 6.5, -25), cl01 = (x) => Math.min(1, Math.max(0, x));
    // ---- THE GAZE LIFTS: the last two points of interest, at full weight. Each stands on the line the gaze already has
    // there (the path's 15 m look-ahead turned by the six points of interest before it, worked out here as the engine works it out) and only raises its pitch: by just what keeps
    // the tops of something tall under the top edge of the frame. Where nothing needs lifting the point lies on the gaze
    // itself; outside its window the engine passes it by. Heading, path and pace are untouched
    const _g0 = V(0, 0, 0), _g1 = V(0, 0, 0), _g2 = V(0, 0, 0), _g3 = V(0, 0, 0), DEG = Math.PI / 180, TAN_UP = Math.tan(31 * DEG);     // (fov 62: the top edge stands 31 degrees over the gaze)
    let gazePois = [];
    const bellW = (x, a, b, f) => { const w = (b - a) * f; return sstep(a, a + w, x) * (1 - sstep(b - w, b, x)); };
    const gazeBefore = (time, u, out) => {             // the gaze after the first six points of interest; the eye is left in _g0
      const d = u * path.length; path.posAtDist(d, _g0); path.posAtDist(d + 15, out).sub(_g0).normalize();
      const guard = sstep(0, 0.04, u) * (1 - sstep(0.93, 0.985, u));
      for (let i = 0; i < 6; i++) {
        const q = gazePois[i], w = bellW(u, q.from ?? 0, q.to ?? 1, q.fade ?? 0.3) * (q.weight ?? 0.5) * guard;
        if (w <= 0.001) continue;
        const at = typeof q.at === 'function' ? q.at(time, u) : q.at;
        if (at.isVector3) _g1.copy(at); else _g1.set(at[0], at[1], at[2]);
        out.multiplyScalar(1 - w).addScaledVector(_g1.sub(_g0).normalize(), w).normalize();
      }
      return out;
    };
    // the larger of two, with a rounded corner k wide (exactly a where b is k or more under it), and the smaller likewise
    const softMax = (a, b, k) => { const x = (b - a) / k; return a + k * (x <= -1 ? 0 : x >= 1 ? x : (x + 1) * (x + 1) / 4); }, softMin = (a, b, k) => -softMax(-a, -b, k);
    // tops: [x, y, z] of the highest things to be kept in; frac(eye): how far up from the centre of the frame toward its
    // top edge they may stand; cap(eye): the steepest pitch allowed
    const gazeLift = (tops, frac, cap) => (time, u) => {
      gazeBefore(time, u, _g2);
      const hl = Math.max(Math.hypot(_g2.x, _g2.z), 1e-6), cx = _g2.x / hl, cz = _g2.z / hl, base = Math.atan2(_g2.y, hl);
      let need = -1.5;
      for (const q of tops) { const h = (q[0] - _g0.x) * cx + (q[2] - _g0.z) * cz; if (h > 2) need = Math.max(need, Math.atan2(q[1] - _g0.y, h) - Math.atan(TAN_UP * frac(_g0))); }
      const pt = softMax(base, softMin(need, cap(_g0), 2.5 * DEG), 2.5 * DEG), cp = Math.cos(pt) * 60;
      return _g3.set(_g0.x + cx * cp, _g0.y + Math.sin(pt) * 60, _g0.z + cz * cp);
    };
    // ONE RULE FOR BOTH LIFTS: the tops named are held no higher than TOP_FRAC of the way from the centre of the frame to
    // its top edge, from wherever they would otherwise rise above it, for as long as the pitch allowed can do it. Each
    // lift's window is the span the scroll already gives that subject (the arch's own point of interest; the seal's)
    const TOP_FRAC = 0.86;
    // THE CROWD ON THE BRIDGE: the tallest thing on the near side of the deck is a banner pole 8.2 m over the crown's
    // deck (BANK + 8), 5.75 m before the crown; the parasols stand 2 to 3.3 m under it. The window and its easing are
    // the arch's own point of interest: the hold is let go as that one is, into the look up at the timbers. The gaze may
    // never climb further than keeps the great seal, seen under the arch, TOP_FRAC of the way to the bottom edge
    const crowdLift = { at: gazeLift([[HERO_X - 5.75, BANK + 8 + 8.2, 0]], () => TOP_FRAC, (e) => Math.atan2(sealAt.y - e.y, Math.max(Math.hypot(sealAt.x - e.x, e.z), 1)) + Math.atan(TAN_UP * TOP_FRAC)), from: uA - 0.1, to: uB - 0.01, weight: 1, fade: 0.3 };
    // THE GATE PAGODAS: the tips of the two spires (PAG_TOP, 34.8 m, 20 m either side of the axis), for as long as the
    // scalloped frame round the great seal (its lowest lobe, 15.65 m down the sheet from the seal's centre) can stay
    // whole above the bottom edge: as the seal and its frame grow to fill the view that limit comes down to the path's
    // own pitch and the lift ends of itself, so the seal is met square
    const sealLow = V(sealAt.x - COLLAR_R * Math.cos(A1), sealAt.y - COLLAR_R * Math.sin(A1), 0);
    const gateLift = { at: gazeLift([[PAG_X, PAG_TOP, -PAG_Z], [PAG_X, PAG_TOP, PAG_Z]], () => TOP_FRAC, (e) => Math.atan2(sealLow.y - e.y, Math.max(sealLow.x - e.x, 1)) + 31 * DEG), from: uo(0.78), to: 1, weight: 1, fade: 0.3 };
    const mastDeg = (p) => {
      const drop = (a, b) => { const t = cl01((p - a) / (b - a)); return Math.min(1.06, t * t * (1 + 0.12 * Math.sin(cl01((p - b) / 0.02) * Math.PI))); };
      return 86 - 46 * drop(0.03, 0.10) - 9 * drop(0.15, 0.18) - 9 * drop(0.21, 0.24);
    };
    function update(dt, time, camera, u) {
      const through = ctx.through === true;
      U.uClip.value.set(thruB.x, thruB.z, -(thruB.x * thruA.x + thruB.z * thruA.z) - 1.5, through ? 1 : 0);
      _cp.setFromMatrixPosition(camera.matrixWorld);
      // (and distance is measured from the entry, not from where the opening's camera stands back: the fades and the
      // mist move out by that much, so the village bank keeps its ink and colour in the opening)
      const back = through ? Math.max(0, (_cp.x - thruA.x) * thruB.x + (_cp.z - thruA.z) * thruB.z) : 0;
      U.uFade.value.set(look.fade[0] + back, look.fade[1] + back); U.uMist.value.z = look.mistNF[0] + back; U.uMist.value.w = look.mistNF[1] + back;
      dome.position.copy(_cp);
      if (rare) {                                             // the collector stamps the scroll as we clear the bridge
        const down = sstep(uC - 0.035, uC + 0.03, u), up = sstep(uC + 0.05, uC + 0.13, u), since = u - (uC + 0.035);
        block.visible = u > uC - 0.04 && u < uC + 0.135;
        block.position.y = BANK + 0.05 + 88 * (1 - down) + 88 * up * up;
        SU.uStampAt.value.w = sstep(uC + 0.03, uC + 0.04, u);
        U.uRipple.value.set(STAMP_X - since * 900, since > 0 ? 0.9 * sstep(0, 0.012, since) * (1 - sstep(0.2, 0.3, since)) : 0, 13);
      }
      // our barge: the bow is built round the eye (2 m to starboard, 8.5 m ahead of midships); past the last flow
      // line the camera lifts off and the hull drifts to rest
      path.pointAt(Math.min(1, u + 0.003), _tan); path.pointAt(Math.max(0, u - 0.003), _p3); _tan.sub(_p3);
      let ex = _cp.x, ez = _cp.z, h = Math.atan2(_tan.z, _tan.x);
      if (through) { path.pointAt(0, _p3); ex = _p3.x; ez = _p3.z; }
      if (ex > X_LIFT) { const dx = ex - X_LIFT; ex = X_LIFT + 9 * (1 - Math.exp(-dx / 9)); h *= 1 - sstep(0, 24, dx); }
      const ch = Math.cos(h), sh = Math.sin(h), cx = ex - 8.5 * ch + 2 * sh, cz = ez - 8.5 * sh - 2 * ch;
      hero.setCarried(!through);
      hero.setBargePose(cz, HERO_X - cx, -h);
      const prog = Math.min(1, Math.max(0, (62 - (HERO_X - cx)) / 107));
      hero.setProgress(prog);
      // the mast: the first fall happens above the frame; the two checked drops that follow come down into it.
      // Once its head is through the arch it is laid down as we pass under the crown: flat (1.5 degrees) and 30 degrees
      // out over the port rail into the low crutch there, so that it is down before we come out and look at the gate,
      // and lies in the lower left of the frame, its head 1.5 m below the eye and under the line of the lane
      const lay = sstep(0.48, 0.565, prog);
      hero.setMast((prog > 0.48 ? 22 - 20.5 * lay : mastDeg(prog)) * Math.PI / 180, prog > 0.48 ? (13 + 17 * lay) * Math.PI / 180 : null);
      gatePoi.set(Math.min(213, Math.max(188, _cp.x + 15)), 6.5, -25);
      // the ripple of the collector's stamp lifts every vertex of the hull with the silk; most of it is taken back out
      // here, so that the bow by the eye bobs a quarter of a metre and no more
      const rp = U.uRipple.value, rg = (ex + 1 - rp.x) / Math.max(rp.z, 1);
      hero.setSink(0.3 + (_cp.x > X_LIFT && !through ? 1.5 * sstep(0, 20, _cp.x - X_LIFT) : 0) + 0.72 * rp.y * Math.exp(-rg * rg));
      hero.update(dt, time, camera);
      hero.barge.object.updateMatrixWorld(true); mastHead.set(0, 14.5, 0).applyMatrix4(hero.barge.mast.matrixWorld);
      cardMat.uniforms.uU.value = u;
      SU.uBargeW.value.set(cx, through ? 900 : cz, ch, sh);
      obs[11].set(ex + 7.5 * ch - 4.5 * sh, through ? 900 : ez + 7.5 * sh + 4.5 * ch, 3.0);      // the eddy off our starboard bow
      // the take-up roller winds the painting on: always a little, and faster while we cast off and it is in the picture
      const wound = time * 0.54 + 70 * Math.min(u, 0.15);
      SU.uWind.value = wound; SU.uBig.value.w = -time * 0.22; U.uMist.value.y = time * 0.045;
      takeUp.rotation.z = -wound / 4.9; feed.rotation.z = -time * 0.24;
      // the sampan sculls: it yaws about its sweep and rocks
      sampan.rotation.y = SAMPAN.ry + 0.1 * Math.sin(time * 1.7); sampan.rotation.z = 0.05 * Math.sin(time * 1.7 + 1); sampan.position.y = -0.04 + 0.03 * Math.sin(time * 1.1);
      // moored boats swing on their lines
      for (let i = 0; i < boats.length; i++) {
        const b = boats[i];
        _eu.set(0.006 * Math.sin(time * 0.7 + b.ph), b.ry + 0.035 * Math.sin(time * 0.31 + b.ph), 0.02 * Math.sin(time * 0.8 + b.ph * 2), 'YXZ'); _q.setFromEuler(_eu);
        _m4.compose(_p3.set(b.x, 0.05 * Math.sin(time * 0.9 + b.ph), b.z), _q, _s3.set(b.sc, b.sc, b.sc)); hullInst.setMatrixAt(i, _m4);
        _m5.makeRotationX(b.tilt + 0.012 * Math.sin(time * 1.1 + b.ph)).setPosition(0, 2.4, -5.2); _m4.multiply(_m5); mastInst.setMatrixAt(i, _m4);
      }
      hullInst.instanceMatrix.needsUpdate = true; mastInst.instanceMatrix.needsUpdate = true;
      // the ferry sculls across ahead of us; the towed barge comes up through the arch
      ferry.position.z = -17 + 34 * sstep(uo(0.07), uo(0.3), u) + 0.3 * Math.sin(time * 0.4); ferry.position.y = -0.05 + 0.04 * Math.sin(time * 1.1);
      ferry.rotation.y = Math.PI + 0.12 * Math.sin(time * 1.7); ferry.rotation.z = 0.04 * Math.sin(time * 1.7 + 1);
      ferry2.position.z = 9 - 18 * sstep(uo(0.6), uo(0.92), u) + 0.3 * Math.sin(time * 0.4 + 2); ferry2.position.y = -0.05 + 0.04 * Math.sin(time * 1.1 + 2);
      ferry2.rotation.y = 0.12 * Math.sin(time * 1.7 + 2); ferry2.rotation.z = 0.04 * Math.sin(time * 1.7);
      // the boats under way: the junk drifts down the reach under its sail; the passenger sampan is sculled up past our
      // starboard side; the small one comes up from the bridge. Wakes, strokes on the water and people go with them
      {
        const j = trafPose[0], a = trafPose[1], b = trafPose[2], tr = SU.uTraf.value;
        j.x = 79 + 3.5 * sstep(0, 0.3, u) + 0.25 * Math.sin(time * 0.21); j.z = 5 + 0.3 * Math.sin(time * 0.17 + 1); j.ry = -Math.PI / 2 + 0.05 * Math.sin(time * 0.33); j.y = 0.05 * Math.sin(time * 0.8);
        junk.position.set(j.x, j.y, j.z); junk.rotation.set(0.01 * Math.sin(time * 0.7), j.ry, 0.03 * Math.sin(time * 0.6 + 2));
        const ka = sstep(0.05, 0.42, u), kb = sstep(0.18, 0.5, u);
        a.x = 126 - 56 * ka; a.z = Math.min(zPathAt(a.x) + 9, 1.5) + 0.25 * Math.sin(time * 0.4); a.ry = Math.PI / 2 + 0.1 * Math.sin(time * 1.7); a.y = -0.05 + 0.04 * Math.sin(time * 1.1 + 1);
        skiffUp.position.set(a.x, a.y, a.z); skiffUp.rotation.set(0, a.ry, 0.04 * Math.sin(time * 1.7 + 1));
        b.x = 142 - 16 * kb; b.z = zPathAt(b.x) + openSide * 8.5 + 0.25 * Math.sin(time * 0.37 + 2); b.ry = Math.PI / 2 + 0.12 * Math.sin(time * 1.9 + 1); b.y = -0.05 + 0.04 * Math.sin(time * 1.2);
        skiffBr.position.set(b.x, b.y, b.z); skiffBr.rotation.set(0, b.ry, 0.05 * Math.sin(time * 1.9));
        const mva = ka > 0.002 && ka < 0.998, mvb = kb > 0.002 && kb < 0.998, fz = ferry.position.z, mvf = fz > -16.5 && fz < 16.5;
        tr[0].set(a.x + 3.6, mva ? a.z : 900, -1, 0); tr[1].set(b.x + 3.0, mvb ? b.z : 900, -1, 0); tr[2].set(96, mvf ? fz - 3.4 : 900, 0, 1);
        SU.uSail.value.set(j.x, j.z, 11.2, 2.5);
        const home = afloatMesh.geometry.attributes.aHome;
        for (let i = 0; i < afloat.length; i++) {
          const c = afloat[i], q = trafPose[c[0]], cs = Math.cos(q.ry), sn = Math.sin(q.ry), lx = c[1] * q.sc, lz = c[3] * q.sc;
          home.setXYZ(i, q.x + lx * cs + lz * sn, q.y + c[2] * q.sy + 0.03 * Math.sin(time * 1.7 + i), q.z - lx * sn + lz * cs);
        }
        home.needsUpdate = true;
        for (let i = 0; i < 3; i++) { const q = trafPose[i]; reflAttr.setXYZW(boats.length + i, q.x, q.z, q.ry, q.sc); }
        reflAttr.needsUpdate = true;
      }
      fleet.position.x = 240 - 92 * sstep(uB - 0.3, uB, u); fleet.position.y = 0.05 * Math.sin(time * 0.8 + 2); fleet.rotation.z = 0.012 * Math.sin(time * 0.6);
      if (towMen) {
        const home = towMen.geometry.attributes.aHome, hx = fleet.position.x - 19.65, step = Math.abs(Math.sin(time * 2.3));
        towPts[0].set(hx, 6.4 + fleet.position.y, 11.6);
        for (let i = 0; i < TOW_N; i++) {
          const x = hx - 16 - (TOW_N - 1 - i) * 1.25, z = towZ(x), y = BANK + 0.08 * step;
          home.setXYZW(i, z, y, -x, i * 0.7);                      // (world z, y, -world x): see the mesh's turn
          towPts[7 + TOW_N - i].set(x - 0.75, y + 1.75, z);
        }
        const a = towPts[0], b = towPts[8];
        for (let k = 1; k < 8; k++) { const t = k / 8; towPts[k].set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - 1.6 * t * (1 - t), a.z + (b.z - a.z) * t); }
        home.needsUpdate = true;
        towRope.begin(); towRope.line(towPts, 2.2); towRope.end();
      }
      for (let i = 0; i < 2; i++) {                                // the ox carts follow their oxen (the same clock as the cards)
        const t = (time * 1.0 / 34 + oxP0 + (i * 11) / 34) % 1, f = sstep(0, 0.03, t) * (1 - sstep(0.97, 1, t));
        _m4.compose(_p3.set(134 - 34 * t + 4.3, BANK, 29.6), _q.set(0, 0, 0, 1), _s3.set(f, f, f)); carts.setMatrixAt(i, _m4);
      }
      carts.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < sedans.length; i++) {
        const s = sedans[i], t = (time * s.speed / s.len * 0.5 + s.ph) % 1, f = Math.min(1, Math.min(t, 1 - t) / 0.03);
        _q.setFromAxisAngle(YAX, s.yaw);
        _m4.compose(_p3.set(s.ax + (s.bx - s.ax) * t, BANK + 0.1 * Math.abs(Math.sin(time * 4.6 + i)), s.az + (s.bz - s.az) * t), _q, _s3.set(f, f, f)); sedanInst.setMatrixAt(i, _m4);
      }
      sedanInst.instanceMatrix.needsUpdate = true;
      sweep.rotation.z = 0.12 + 0.3 * Math.sin(time * 0.5);
    }
    await ctx.yield();
    const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 3000); path.pointAt(0, c0.position); c0.updateMatrixWorld();
    hero.setProgress(0); hero.update(0, 0, c0);
    await ctx.yield();
    update(0, 0, c0, 0);
    await ctx.yield();

    const world = {
      scene, path, duration,
      // cast off slowly, quicken down the reach, hold a little for the mast and the arch, then run for the seal
      pace: (u) => 0.62 + 0.48 * sstep(uo(0.02), uo(0.3), u) - 0.2 * sstep(uA - 0.05, uA + 0.02, u) * (1 - sstep(uB, uB + 0.06, u)) + 0.06 * sstep(uo(0.7), uo(0.9), u),
      title: look.title + (rare ? ': The Collector’s Seal' : cast === 'fleet' ? ', Grain-Fleet Day' : cast === 'festival' ? ', Festival Day' : ''),
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 3200, lookAhead: 15, sway: 0.35, bank: 0.2, nearThrough: 0.3 },
      pois: [
        { at: [91, 13, -(halfW(91) + 9.5)], from: uo(0.12), to: uo(0.29), weight: 0.36, fade: 0.25 },        // the first wine shop under its banner scaffold
        { at: [HERO_X, 8.5, 0], from: uA - 0.1, to: uB - 0.01, weight: 0.4, fade: 0.3 },             // the arch and its leaning crowd
        { at: () => mastHead, from: uA - 0.04, to: uA + 0.06, weight: 0.35, fade: 0.3 },              // the mast head as it comes down
        { at: [HERO_X + 6, 9.2, 1.5], from: uB - 0.035, to: uB + 0.01, weight: 0.5, fade: 0.3 },      // up at the timbers as we pass under the crown
        { at: () => gatePoi, from: uC - 0.05, to: uC + 0.075, weight: 0.4, fade: 0.3 },           // the camels on the lane, the gate behind them
        { at: sealAt, from: uo(0.78), to: 1, weight: 0.35, fade: 0.3 },
        crowdLift, gateLift,
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#C2371F', glow: 0.3, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0.5, threshold: 1 }, grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      update,
      dispose() { hero.dispose?.(); },
    };
    gazePois = world.pois;
    return world;
  },
};
