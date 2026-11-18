// THE SHAKEN GLOBE. Inside a snow globe on a winter windowsill in the seconds after it is shaken.
// A blue-and-white porcelain village and its music-box carousel (src/parts/shaken-globe.js) whirl in a
// glitter blizzard that calms from streaks to a spiral to snowfall, while beyond the glass a window, a
// frosted garden and a bird the size of a mountain loom. Everything solid is the hero's own glaze shader.
//   Looks (by seed / ctx.vary.hour): frosty sunrise, gold morning, white overcast with snow outside,
//   thaw afternoon with dripping icicles and a green garden. Visitor: robin, a pair of blue tits or a squirrel.
//   Rare: the visitor taps the glass, a pressure ring crosses the liquid and the blizzard is kicked up again.
//   The flight ends in one long even climb round the carousel (past the reindeer deck, level with the crown and its finial,
//   over the spire with the lit village below) and a straight run up the eye, through a slow column of loose stars and geese,
//   to the mirror under the bubble, which irises open on the portal.
//   Light: cold blue snow shadows against warm amber windows, lamps, the carousel's bulbs and the low sun's band in the room.
//   The room beyond the glass is at dusk: deep blue walls and ceiling pricked with fairy lights, blue velvet curtains, a small lit fir
//   in a pot, and through the window a dawn sky over a frosted garden of firs in sharp silhouette. At the head of the street stands
//   the village's great fir, dressed in gilt garlands, lit bulbs and a star.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, smoothstep, clamp, lerp } from '../kit/core.js';
import { buildHero } from '../parts/shaken-globe.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const PALETTE = ['#f7f4ee', '#cfe4f5', '#8fb8e6', '#1c3e9a', '#1f5a4a', '#ffe2a0', '#d6263a'];   // the cobalt a shade deeper than the brief's, so it anchors the high-key picture
const LOOKS = {
  sunrise: { title: 'The Shaken Globe at Sunrise', el: 10, az: 0.42, sun: '#ffb27c', sunK: 1.12, top: '#6f93e4', hor: '#ffc7a6', lawn: '#d6dcf2', trees: '#8a97cf', fog: '#c3cdea', skyFill: '#7aaaf0', snow: 0, thaw: 0, tint: '#fff6ea', fogD: 0.0033, exp: 0.76, con: 1.13, sat: 1.15, caK: 1.6, tsTop: 0.66, bok: 0.7 },
  morning: { title: 'The Shaken Globe', el: 22, az: -0.22, sun: '#ffe2a0', sunK: 1.0, top: '#6a9fe4', hor: '#e2edf7', lawn: '#cfe4f5', trees: '#93b6e0', fog: '#c0daf3', skyFill: '#a3c6f0', snow: 0, thaw: 0, tint: '#fffaf0', caK: 1.25 },
  overcast: { title: 'The Shaken Globe, Snow on Snow', el: 34, az: 0.1, sun: '#fff0d8', sunK: 0.84, top: '#8aa9de', hor: '#e9eef4', lawn: '#dde8f3', trees: '#8fa6cc', fog: '#c4d6ec', skyFill: '#9dbbea', snow: 1, thaw: 0, tint: '#f7faff' },
  thaw: { title: 'The Shaken Globe in the Thaw', el: 30, az: 0.5, sun: '#ffcf7a', sunK: 1.05, top: '#5fa4ea', hor: '#ffe9c0', lawn: '#9ccf8c', trees: '#78aa86', fog: '#cfe6e0', skyFill: '#a4cbee', snow: 0, thaw: 1, tint: '#fffbec' },
};

// ---------- the glass and the room beyond it ----------
const DOME_VERT = /* glsl */`
  varying vec3 vW;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DOME_FRAG = /* glsl */`
  uniform vec3 uC, uSunR, uSunCol, uTop, uHor, uLawn, uTrees, uHaze, uVisA, uVisB, uTapDir, uBub, uBubH;
  uniform mat3 uTilt;
  uniform float uTime, uGrow, uSnow, uThaw, uKind, uLand, uHop, uCock, uPeer, uVisX, uTap, uSettle, uBok, uWinAz, uWinK, uSeamY, uBandAz;
  uniform vec3 uVisDir;
  varying vec3 vW;
  float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 h22(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ return vn(p) * 0.55 + vn(p * 2.1 + 3.7) * 0.3 + vn(p * 4.3 + 9.1) * 0.15; }
  float ell(vec2 p, vec2 c, vec2 r, float blur){ return smoothstep(1.0 + blur, 1.0 - blur, length((p - c) / r)); }
  // soft bokeh discs on a jittered grid (hoarfrost twigs twinkling)
  float bokeh(vec2 p, float sc, float dens){
    vec2 g = p * sc, i = floor(g); float a = 0.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 c = i + vec2(float(x), float(y)), h = h22(c);
      float on = step(1.0 - dens, h21(c + 7.3)), r = 0.22 + 0.3 * h.x;
      float d = length(g - c - 0.5 - (h - 0.5) * 0.8);
      float tw = 0.45 + 0.55 * sin(uTime * (1.0 + 2.5 * h.y) + h.x * 40.0);
      a += on * smoothstep(r, r * 0.72, d) * (0.35 + 0.65 * tw * tw) * (0.5 + 0.5 * smoothstep(r * 0.5, r * 0.95, d));
    }
    return a;
  }
  // (polish 2) fairy lights and glints about the dusk room, held sharp in the glass: small warm and white points with a
  // four-point sparkle, twinkling. p is the stereographic map of the room direction, so they never smear.
  float stars(vec2 p, float sc, float dens){
    vec2 g = p * sc, i = floor(g), h = h22(i);
    float on = step(1.0 - dens, h21(i + 3.7)), r = 0.035 + 0.05 * h.x;
    vec2 c = fract(g) - 0.5 - (h - 0.5) * 0.62; float d = length(c);
    float tw = 0.5 + 0.5 * sin(uTime * (1.2 + 2.5 * h.y) + h.x * 40.0);
    float cross_ = smoothstep(r * 0.3, 0.0, min(abs(c.x), abs(c.y))) * smoothstep(r * 5.0, 0.0, d) * step(0.55, h.y);
    return on * (smoothstep(r, r * 0.35, d) + 0.22 * smoothstep(r * 3.5, 0.0, d) + 0.8 * cross_) * (0.35 + 0.65 * tw);
  }
  // (polish) the visitor on the outer sill, SHARP: fur or feathers drawn as fine directional strokes, a fringed outline,
  // a glossy eye that holds the window (the squirrel's is plain, with one catchlight), whiskers or a hard beak. p is in its own
  // space, feet at 0, about 1.3 tall.
  float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0); return length(pa - ba * h); }
  // (polish 4) the squirrel's ear about its own middle e: a leaf 0.066 half as wide, round below and drawn to a point 0.115 above;
  // and the tuft at its tip: a wisp leaning back, with a hair either side, that ends 0.15 above the middle
  float earLeaf(vec2 e){
    float w = e.y < 0.0 ? sqrt(max(1.0 - e.y * e.y / 0.0169, 0.0)) : pow(max(1.0 - e.y / 0.115, 0.0), 0.75);
    return smoothstep(0.007, -0.007, abs(e.x) - 0.066 * w) * step(-0.13, e.y) * step(e.y, 0.115);
  }
  float earTuft(vec2 e){
    float ty = clamp((e.y - 0.08) / 0.07, 0.0, 1.0);
    float wisp = smoothstep(0.004, -0.004, abs(e.x + 0.018 * ty * ty) - 0.016 * (1.0 - ty)) * step(0.08, e.y) * step(e.y, 0.15);
    float d = min(seg(e, vec2(-0.004, 0.1), vec2(-0.028, 0.138)), seg(e, vec2(0.004, 0.1), vec2(0.012, 0.142)));
    return max(wisp, smoothstep(0.005, 0.0015, d));
  }
  vec4 critter(vec2 p, vec3 backC, vec3 frontC, float kind, float cock, float peer, vec2 sdir){
    float sq = step(1.5, kind), b = 0.03;
    float fz = vn(p * vec2(64.0, 40.0) + 3.0) - 0.5, fz2 = vn(p * vec2(40.0, 64.0) + 9.0) - 0.5;
    vec2 pf = p + vec2(fz, fz2) * (0.014 + 0.02 * sq);                                   // the fringe of the coat
    vec2 hd = vec2(0.1, 0.84) + vec2(sin(cock), cos(cock) - 1.0) * 0.16 + vec2(-0.03, -0.035) * peer;
    float breath = sin(uTime * 2.2), bp = fract(uTime * 0.27 + 0.2 * kind), blink = smoothstep(0.955, 0.975, bp) * smoothstep(1.0, 0.985, bp);
    float body = ell(pf, vec2(0.0, 0.42), vec2(0.34, 0.4) * (1.0 + 0.03 * breath), b), head = ell(pf, hd, vec2(0.2 + 0.035 * peer + 0.035 * sq, 0.2 + 0.035 * peer + 0.015 * sq), b);
    float sway = 0.035 * sin(uTime * 1.3) * sq, tail, tailTop = 0.0;
    if (sq > 0.5) {
      // (polish 3) as the squirrel sits, the plume curls over at the line of the ears' tops (it stood 0.2 of the creature's own
      // measure above them), so its ears and its plume top out together
      tailTop = max(ell(pf, vec2(-0.43 + sway, 0.9), vec2(0.24, 0.3), b), ell(pf, vec2(-0.3 + 2.0 * sway, 1.08), vec2(0.2, 0.14), b));
      tail = max(ell(pf, vec2(-0.45, 0.5), vec2(0.2, 0.44), b), tailTop);
    } else tail = ell(pf, vec2(-0.4, 0.3 + 0.022 * sin(uTime * 3.1) * sin(uTime * 0.83)), vec2(0.31, 0.075), b);
    float a = max(max(body, head), tail);
    float mot = fbm(p * 9.0 + 3.0 + vec2(0.0, 0.12 * breath));
    // strokes: fine hairs running down and back along the body (curling up the squirrel's tail)
    vec2 fd = mix(vec2(p.x * 1.0 + p.y * 0.35, p.y - p.x * 0.3), vec2(p.x + 0.5 * sin(p.y * 4.0), p.y), sq * step(p.x, -0.26));
    float fur = 0.55 * vn(vec2(fd.x * 95.0, fd.y * 13.0) + 11.0) + 0.45 * vn(vec2(fd.x * 180.0, fd.y * 24.0) + 2.0);
    vec3 c = backC * (0.52 + 0.5 * smoothstep(0.0, 1.0, p.y) + 0.26 * (mot - 0.5) + 0.62 * (fur - 0.5));
    if (sq < 0.5) {                                                                       // the folded wing: rows of scalloped feathers, dark flight feathers
      vec2 wq = (p - vec2(-0.14, 0.43)) / vec2(0.2, 0.29);
      float wing = ell(p, vec2(-0.14, 0.43), vec2(0.2, 0.29), 0.08);
      float sc = abs(sin(wq.x * 7.0 + floor(wq.y * 4.0 + 4.0) * 1.57)) * (0.35 + 0.65 * fract(wq.y * 4.0 + 4.0));
      c = mix(c, backC * (0.3 + 0.42 * sc), wing * 0.92);
      c = mix(c, vec3(0.06, 0.06, 0.08), wing * smoothstep(0.012, 0.0, abs(fract(wq.x * 3.0 - wq.y * 1.2) - 0.5) * 0.33) * step(wq.y, -0.1) * 0.7);
    } else c = mix(c, backC * 1.5 + vec3(0.14, 0.08, 0.02), tail * (0.3 + 0.7 * tailTop) * (0.45 + 0.75 * fur) * step(p.x, -0.2 + 0.2 * tailTop));   // the brush of the tail, lighter and wilder
    c = mix(c, vec3(0.9, 0.88, 0.84) * (0.72 + 0.5 * fur), ell(p, vec2(0.08, 0.2), vec2(0.24, 0.2), 0.14) * 0.85 * body);                    // pale belly
    c = mix(c, frontC * (0.66 + 0.24 * mot + 0.5 * fur), ell(pf, vec2(0.12 - 0.03 * peer, 0.56) + (hd - vec2(0.1, 0.84)) * 0.5, vec2(0.23 + 0.02 * peer, 0.27) * (1.0 + 0.03 * breath), 0.1) * max(body, head)); // the breast, breathing
    if (kind > 0.5 && kind < 1.5) {
      c = mix(c, vec3(0.13, 0.3, 0.72) * (0.7 + 0.6 * fur), ell(pf, hd + vec2(0.0, 0.11), vec2(0.17, 0.085), 0.12) * head);               // blue cap
      c = mix(c, vec3(0.93), ell(pf, hd + vec2(0.04, -0.02), vec2(0.15, 0.07), 0.12) * head * 0.9);                                         // white cheek
      c = mix(c, vec3(0.05, 0.07, 0.16), smoothstep(0.014, 0.004, abs(p.y - hd.y - 0.035 + 0.1 * (p.x - hd.x))) * head * step(hd.x - 0.14, p.x));   // the eye stripe
    }
    if (sq > 0.5) {
      // (polish 4) ears that read as ears: each a leaf standing on the crown, round at its foot and drawn to a point, a tuft
      // of hairs at the tip and a hollow in it; they take a finer fringe than the coat's so that the outline holds. Before the
      // sun-side light below is added the tuft is laid at 0.4 of the back's colour (the leaf's strokes run 0.45 to 0.95 of it)
      // and the rear ear's leaf 0.3 darker than the front one's; that light is then added over leaf and tuft alike. Leaf and
      // tuft together top out where the old ears did (0.15 over the middle)
      vec2 pe = p + vec2(fz, fz2) * 0.01;
      vec2 e1 = pe - hd - vec2(-0.1, 0.22), e2 = pe - hd - vec2(0.07, 0.235);
      float ear1 = earLeaf(e1), ear2 = earLeaf(e2), ears = max(ear1, ear2);
      float tuft = max(earTuft(e1), earTuft(e2));
      a = max(a, max(ears, tuft));
      c = mix(c, backC * (0.45 + 0.5 * fur) * (1.0 - 0.3 * ear1 * (1.0 - ear2)), ears * (1.0 - head));
      c = mix(c, vec3(0.5, 0.26, 0.2), max(ell(e1, vec2(0.004, -0.03), vec2(0.024, 0.07), 0.25), ell(e2, vec2(0.004, -0.03), vec2(0.024, 0.07), 0.25)) * 0.8);
      c = mix(c, backC * 0.4, tuft * (1.0 - ears));
      float paws = max(ell(pf, vec2(0.2, 0.5), vec2(0.07, 0.05), 0.1), ell(pf, vec2(0.11, 0.47), vec2(0.07, 0.05), 0.1));
      c = mix(c, backC * 0.62 * (0.7 + 0.6 * fur), paws); a = max(a, paws);
      c = mix(c, backC * 0.5, smoothstep(0.02, 0.0, abs(length((p - vec2(-0.05, 0.3)) / vec2(0.27, 0.3)) - 1.0)) * step(p.x, 0.05) * step(p.y, 0.5) * 0.6 * body);   // the haunch
    }
    // light from the sun side: a warm rim through the fringe
    vec2 nn = p - vec2(0.02, 0.52); nn /= max(length(nn), 1e-3);
    float edge = a * (1.0 - smoothstep(0.0, 0.07, min(min(1.0 - length((pf - vec2(0.0, 0.42)) / vec2(0.34, 0.4)), 1.0 - length((pf - hd) / 0.2)), 0.2) + 0.2 * (1.0 - max(body, head))));
    c += uSunCol * (0.55 * edge * (0.3 + max(dot(nn, sdir), 0.0)) * (0.5 + fur) + 0.14 * max(dot(nn, sdir), 0.0) * a);
    // the eye: large, wet and black, a pale ring, and the bright window held in it; (polish 4) the squirrel's is smaller and
    // plain: black, the pale ring and one small soft catchlight, no window in it
    vec2 ey = hd + mix(vec2(0.085, 0.035), vec2(0.04, 0.025), peer);
    float er = (0.05 - 0.006 * sq) * (1.0 + (0.5 - 0.25 * sq) * peer), eye = ell(p, ey, vec2(er, er * (1.0 - 0.88 * blink)), 0.07);
    c = mix(c, mix(frontC, vec3(0.9, 0.84, 0.74), 0.6 + 0.3 * sq) * (0.75 + 0.4 * fur), ell(p, ey, vec2(er * 1.3), 0.14) * (0.4 + 0.2 * sq));
    c = mix(c, vec3(0.012, 0.012, 0.02), eye);
    c += vec3(0.05, 0.08, 0.16) * eye * smoothstep(0.2, -0.9, (p.y - ey.y) / er);                                           // sky in the lower half of the cornea
    vec2 hq = (p - ey - vec2(0.3, 0.34) * er) / (er * 0.3);
    c += (vec3(2.6, 2.5, 2.3) + uSunCol) * step(max(abs(hq.x), abs(hq.y) * 0.8), 1.0) * step(0.2, abs(hq.x)) * step(0.16, abs(hq.y)) * eye * (1.0 - blink) * (1.0 - sq);
    c += vec3(0.85, 0.86, 0.9) * sq * ell(p, ey + vec2(0.3, 0.34) * er, vec2(er * 0.22), 0.5) * eye * (1.0 - blink);
    if (sq < 0.5) {                                                                       // a hard little beak, and wire legs
      vec2 bq = p - hd - vec2(0.17 - 0.03 * peer, -0.012 - 0.02 * peer);
      float beak = step(0.0, bq.x) * smoothstep(0.004, -0.004, abs(bq.y) - 0.034 * (1.0 - bq.x / 0.105)) * step(bq.x, 0.105);
      c = mix(c, mix(vec3(0.2, 0.16, 0.13), vec3(0.5, 0.42, 0.3), smoothstep(-0.01, 0.02, bq.y)), beak); a = max(a, beak);
      float legs = (smoothstep(0.016, 0.008, abs(p.x - 0.05 - 0.1 * (0.1 - p.y))) + smoothstep(0.016, 0.008, abs(p.x + 0.1 - 0.1 * (0.1 - p.y)))) * step(p.y, 0.1) * step(0.0, p.y);
      c = mix(c, vec3(0.3, 0.2, 0.16), legs * (1.0 - body)); a = max(a, legs);
    } else {                                                                              // nose and whiskers
      vec2 mz = hd + vec2(0.185 + 0.02 * peer, -0.045);
      c = mix(c, vec3(0.12, 0.07, 0.06), ell(p, mz, vec2(0.022, 0.017), 0.3));
      float wk = 1e3; for (int k = 0; k < 4; k++) { float fk = float(k) - 1.5; wk = min(wk, seg(p, mz + vec2(-0.02, -0.012), mz + vec2(0.17, 0.05 * fk + 0.012 * sin(uTime * 3.0 + fk)) )); wk = min(wk, seg(p, mz + vec2(-0.03, -0.012), mz + vec2(-0.2, -0.03 + 0.045 * fk))); }
      float wl = smoothstep(0.0045, 0.0015, wk);
      c = mix(c, vec3(0.97, 0.95, 0.9), wl); a = max(a, wl * 0.9);
    }
    return vec4(c, a * smoothstep(-0.05, 0.01, p.y));
  }
  float winPatch(vec2 p, vec2 c, vec2 hs, float skew){
    vec2 w = p - c; w.x += skew * w.y;
    float m = smoothstep(hs.x, hs.x * 0.72, abs(w.x)) * smoothstep(hs.y, hs.y * 0.72, abs(w.y));
    return m * (1.0 - 0.8 * max(smoothstep(0.045, 0.015, abs(w.x)), smoothstep(0.04, 0.012, abs(w.y))));
  }
  float paneMask(vec2 q, float soft){ return smoothstep(1.62, 1.62 - soft, abs(q.x)) * smoothstep(-0.34, -0.34 + soft, q.y) * smoothstep(2.25, 2.25 - soft, q.y); }
  vec3 room(vec3 d){
    // ---- the window (+Z): pane coordinates, x right, y up, the outer sill at y = -0.3
    vec2 q = d.xy / max(d.z, 0.06);
    vec3 col = mix(uHor, uTop, smoothstep(-0.05, 0.9, q.y));
    col = mix(col, uTop * vec3(0.4, 0.5, 0.82), smoothstep(0.75, 2.2, q.y));                          // (polish 2) a real sky: deepening overhead,
    col = mix(col, mix(uHor, uSunCol, 0.5) * 1.05, smoothstep(0.55, 0.0, q.y) * 0.5 * (1.0 - 0.6 * uSnow));   // a band of warmth above the garden
    vec2 sq = uSunR.xy / max(uSunR.z, 0.2), sv = q - sq; float sd = length(sv), sa = atan(sv.y, sv.x);
    float veil = 1.0 - 0.7 * uSnow;
    col += uSunCol * (smoothstep(0.1, 0.07, sd) * 5.0 * veil + exp(-sd * 3.2) * 0.75 + exp(-sd * 0.9) * 0.2);
    col += uSunCol * pow(abs(cos(sa * 3.0 + 0.3)), 60.0) * exp(-sd * 1.6) * 1.3 * veil;              // six-point glass flare
    // far trees as soft masses and bokeh, the lawn below
    float tl = 0.34 + 0.2 * fbm(vec2(q.x * 1.7 + 4.0, 1.0)) + 0.1 * vn(vec2(q.x * 5.0, 3.0));
    // (polish 2) the frosted garden is drawn, not smeared: a pale far wood, then a rank of firs in sharp silhouette
    col = mix(col, mix(uTrees, col, 0.5), smoothstep(tl + 0.12, tl + 0.04, q.y) * 0.85);
    float fxx = q.x * 5.0 + 0.6 * vn(vec2(q.x * 1.3, 2.0)), fir = max(1.0 - 3.3 * abs(fract(fxx) - 0.5), 0.0) * (0.07 + 0.15 * h11(floor(fxx)));
    float fx2 = q.x * 8.3 + 3.1, fir2 = max(1.0 - 3.0 * abs(fract(fx2) - 0.5), 0.0) * (0.04 + 0.09 * h11(floor(fx2) + 9.0));
    float trees = smoothstep(tl - 0.15 + max(fir, fir2) + 0.012, tl - 0.15 + max(fir, fir2) - 0.012, q.y);
    col = mix(col, uTrees * (0.34 + 0.2 * vn(q * 3.0) + 0.3 * smoothstep(tl - 0.3, tl, q.y)) + vec3(0.9, 0.95, 1.0) * 0.5 * smoothstep(0.55, 0.8, vn(q * vec2(9.0, 22.0))) * smoothstep(tl - 0.25, tl, q.y), trees * 0.94);   // (polish) dark blue trees rimed white, sharp against the dawn
    float bk = bokeh(q + vec2(0.0, 0.02 * sin(uTime * 0.3)), 9.0, 0.5) * smoothstep(tl + 0.22, tl - 0.05, q.y) * smoothstep(-0.02, 0.1, q.y) + bokeh(q * 1.7 + 5.0, 11.0, 0.4) * trees * smoothstep(0.0, 0.12, q.y);
    col += mix(vec3(1.0), uSunCol, 0.4) * bk * (0.2 + 0.7 * exp(-sd * 1.2)) * uBok * 0.42;
    float lawn = smoothstep(0.06, -0.06, q.y - 0.05 * vn(vec2(q.x * 2.0, 7.0)));
    col = mix(col, uLawn * (0.8 + 0.14 * vn(q * vec2(3.0, 14.0))) + uSunCol * 0.1, lawn);
    // snow falling outside, at two scales (overcast look)
    if (uSnow > 0.01) for (int k = 0; k < 2; k++) {
      float sc = k == 0 ? 3.5 : 9.0; vec2 g = q * sc + vec2(0.6 * sin(uTime * 0.2 + q.y * 2.0), uTime * (k == 0 ? 0.55 : 0.9));
      vec2 i = floor(g), h = h22(i + float(k) * 31.0); float r = 0.1 + 0.16 * h.x;
      col += vec3(0.9, 0.93, 1.0) * uSnow * smoothstep(r, r * 0.5, length(fract(g) - 0.25 - h * 0.5)) * (k == 0 ? 0.5 : 0.3);
    }
    // the visitor on the outer sill
    float hop1 = clamp(uHop, 0.0, 1.0), hop2 = clamp(uHop - 1.0, 0.0, 1.0);
    vec2 base = vec2(uVisX - 0.14 * (hop1 + hop2) * (1.0 - uKind * 0.3) + 1.4 * (1.0 - uLand) * (1.0 - uLand), -0.13 + 2.4 * (1.0 - uLand) + 0.1 * (sin(hop1 * 3.1416) + sin(hop2 * 3.1416)) + 0.004 * sin(uTime * 2.3) * uLand);
    float flut = (1.0 - uLand) * sin(uTime * 22.0);
    float vs = (0.8 + 0.1 * uPeer) * (1.0 - 0.15 * step(1.5, uKind));   // (polish) enormous: the robin and the squirrel stand two thirds to three quarters as tall as the window's lower row of panes, their tops well under the rail; (polish 3) the squirrel, taller than the robin by its ears, is drawn so that, as it sits, its ears' tops stand where the robin's crown stands
    vec4 cr; vec2 sdir = sq - base - vec2(0.0, 0.3); sdir /= max(length(sdir), 1e-3);
    if (uKind > 0.5 && uKind < 1.5) {
      cr = critter((q - base) / vec2(0.56 + 0.08 * flut, 0.56), uVisA, uVisB, 1.0, uCock, uPeer, sdir);
      vec4 c2 = critter((q - base - vec2(-0.72 - 0.5 * (1.0 - uLand), 0.12 * abs(sin(uTime * 0.9)) * step(0.99, uLand))) / vec2(-0.5, 0.5), uVisA, uVisB, 1.0, -uCock * 0.7, 0.0, sdir * vec2(-1.0, 1.0));
      cr = mix(c2, cr, cr.a);  cr.a = max(cr.a, c2.a);
    } else cr = critter((q - base) / vec2(vs * (1.0 + 0.18 * flut), vs), uVisA, uVisB, uKind, uCock, uPeer, sdir);
    cr.rgb *= 0.78 + 0.3 * smoothstep(-0.3, 1.2, q.y);
    col = mix(col, cr.rgb, cr.a * 0.98);
    {   // its breath fogging the pane in front of its nose, coming and going
      vec2 mzp = base + vec2(0.34, 0.8) * vs;
      float fg = smoothstep(1.0, 0.1, length((q - mzp) / (vec2(0.46, 0.32) * vs))) * uLand * (0.5 + 0.5 * sin(uTime * 2.2 - 1.0));
      col = mix(col, vec3(0.84, 0.9, 0.98) * (0.82 + 0.3 * fbm(q * 16.0)), fg * 0.5 * (0.55 + 0.45 * fbm(q * 34.0 + uTime * 0.15)));
    }
    // outer sill with a lip of snow, icicles and drips in the thaw
    col = mix(col, vec3(0.9, 0.93, 0.98) * (0.86 + 0.14 * vn(vec2(q.x * 6.0, 1.0))), smoothstep(-0.06, -0.12, q.y + 0.03 * vn(vec2(q.x * 4.0, 2.0))));
    if (uThaw > 0.01) {
      float cx = floor(q.x * 9.0), hx = h11(cx), fx = fract(q.x * 9.0) - 0.5, len = 0.12 + 0.3 * hx;
      float ic = smoothstep(0.02, -0.02, abs(fx) - 0.3 * clamp((q.y - (2.25 - len)) / len, 0.0, 1.0)) * step(2.25 - len, q.y);
      col = mix(col, vec3(0.92, 0.97, 1.0) + uSunCol * 0.6 * smoothstep(0.1, 0.0, abs(fx + 0.08)), ic * 0.8 * uThaw);
      float ph = fract(uTime * (0.25 + 0.3 * hx) + hx * 7.0), dy = 2.25 - len - ph * ph * 2.4;
      col += (vec3(1.2) + uSunCol) * uThaw * smoothstep(0.05, 0.0, length(vec2(fx * 0.111, (q.y - dy) * 0.6))) * step(0.3, hx);
    }
    // frost ferns growing in from the pane edges and the glazing bars
    float barV = abs(abs(q.x) - 0.98), barH = abs(q.y - 1.16), frameE = min(1.62 - abs(q.x), 2.25 - q.y);
    float e = min(min(frameE - 0.1, q.y + 0.34), min(barV, barH) + 0.2);
    vec2 fq = q * 5.0; float fern = abs(sin(fq.x * 3.0 + 2.5 * vn(fq * 1.3))) * abs(sin(fq.y * 3.0 + 2.5 * vn(fq * 1.3 + 5.0)));
    fern = 0.62 * fbm(fq * 2.3) + 0.2 * vn(fq * 7.0) + 0.18 * pow(fern, 0.5);        // (polish 2) an irregular crystalline fringe, not a row of lobes
    float frost = smoothstep(0.0, 0.16, uGrow * (0.12 + 0.42 * fern) * (1.0 - 0.6 * uThaw) + 0.05 - e);
    col = mix(col, vec3(0.9, 0.94, 1.0) * (0.75 + 0.35 * fern) + uSunCol * 0.9 * pow(fern, 6.0) * (0.5 + 0.5 * sin(uTime * 2.0 + fq.x * 9.0)), frost * 0.74);
    // glazing bars and the frame, painted cream, a blue shadow on one side
    float bars = max(max(smoothstep(0.07, 0.045, barV), smoothstep(0.06, 0.036, barH)), smoothstep(0.17, 0.12, frameE));
    vec3 wood = mix(vec3(0.5, 0.4, 0.34), uTop, 0.25) * (0.34 + 0.16 * smoothstep(-0.5, 2.2, q.y));      // (polish) the frame is darker than the dawn behind it, its sunny edges warm
    // (polish 3) each member of the frame has its own sunny face and its own blue shadow edge, on the side away from the sun's
    // place in the pane (sq): upright members across their width, the rail and the head across their height
    // which member paints a point: the stronger of the masks that draw them; a side runs through its corners, a glazing bar
    // stops under the head and against nothing else, the rail stops against the sides (1 on an upright, 0 on the rail or the head)
    float fS = smoothstep(0.17, 0.12, 1.62 - abs(q.x)), fH = smoothstep(0.17, 0.12, 2.25 - q.y);
    float up_ = step(max(fH, smoothstep(0.06, 0.036, barH) * (1.0 - fS)), max(fS, smoothstep(0.07, 0.045, barV) * (1.0 - fH)));
    float lit = mix((q.y - (q.y > 1.7 ? 2.165 : 1.16)) * sign(sq.y - q.y), (abs(q.x) - (abs(q.x) > 1.3 ? 1.535 : 0.98)) * sign(q.x) * sign(sq.x - q.x), up_);
    col = mix(col, wood * mix(vec3(0.6, 0.72, 1.0), vec3(1.3, 1.08, 0.8), smoothstep(-0.045, 0.015, lit)), bars * 0.96);
    float pane = paneMask(q, 0.05) * smoothstep(0.02, 0.14, d.z);
    // ---- the room: wall, cream curtain folds, one out-of-focus pot plant, pale ceiling
    float az = atan(d.x, -d.z + 1e-5);
    float fold = sin(az * 30.0 + 1.6 * sin(d.y * 2.3 + az * 3.0)) * 0.5 + 0.5;
    float fold2 = sin(az * 14.0 + 0.9 * sin(d.y * 3.1 - az * 2.0) + 2.0);                              // broad curtain folds, out of focus
    // (polish) the room is a deep blue dusk-coloured wall, not a pale veil: the back wall carries the window's own warm
    // band of low sun with the glazing bars' shadow in it, and a dado rail and skirting give it scale
    vec3 deepW = uTop * 0.3 + vec3(0.02, 0.045, 0.13);
    vec3 rm = deepW * (0.7 + 0.5 * smoothstep(-0.25, 0.9, d.y)) * (0.9 + 0.16 * vn(vec2(az * 3.0, d.y * 5.0)) + 0.05 * fold2);
    rm = mix(rm, deepW * 1.5 + vec3(0.03, 0.03, 0.02), smoothstep(0.012, 0.004, abs(d.y - 0.05)) + 0.5 * smoothstep(0.03, 0.0, abs(d.y + 0.03)));
    {
      vec2 bq = vec2(az - uBandAz, d.y - 0.36 + 0.5 * (az - uBandAz) * 0.3);
      float band = smoothstep(0.62, 0.5, abs(bq.x)) * smoothstep(0.34, 0.26, abs(bq.y));
      float bbar = smoothstep(0.02, 0.05, abs(bq.x)) * smoothstep(0.015, 0.04, abs(abs(bq.y) - 0.115));
      rm += mix(uSunCol, vec3(1.0, 0.6, 0.25), 0.55) * band * (0.25 + 0.75 * bbar) * (0.06 + 0.02 * fold) * (1.0 - 0.6 * uSnow);
    }
    vec3 wall = (deepW * 1.25) * (0.7 + 0.45 * smoothstep(-0.2, 0.8, d.y)) * (0.92 + 0.12 * vn(vec2(az * 2.0, d.y * 3.0) + 4.0));
    {   // cream curtains drawn back either side of the window, lit warm from behind, in soft folds
      float cx = abs(q.x) - 1.62;
      // (polish 3) each curtain is drawn back a third of the way up its drop: its inner edge sweeps out from the frame, and
      // the folds are measured across the cloth's own width, so they fan into the gather
      float sw = (1.0 - sqrt(smoothstep(0.62, 2.3, q.y))) * (1.0 - 0.2 * smoothstep(0.62, -0.3, q.y));
      float cin = 0.02 + 0.5 * sw, cout = 1.25 + 0.12 * sin(q.y * 2.0) - 0.12 * sw;
      float cs = clamp((cx - cin) / (cout - cin), 0.0, 1.0), cf = sin(cs * 16.25) * 0.5 + 0.5;
      float cm = smoothstep(0.0, 0.14, cx - cin) * smoothstep(cout, cout - 0.2, cx) * step(0.05, d.z) * smoothstep(-0.5, -0.3, q.y) * smoothstep(2.75, 2.5, q.y);   // (they hang from a rail just above the frame)
      vec3 curt = deepW * (1.05 + 0.75 * cf) + vec3(1.0, 0.55, 0.22) * 0.1 * cf * cf * smoothstep(0.6, 0.0, cx - cin);   // (polish 2) deep blue velvet, gilded by the window only along its near folds
      wall = mix(wall, curt, cm * 0.95);
    }
    vec2 pf = vec2(abs(az) - 2.25, d.y - 0.32);                                                        // a framed picture on each side wall, out of focus
    float pic = smoothstep(0.2, 0.15, abs(pf.x)) * smoothstep(0.15, 0.1, abs(pf.y)), pin = smoothstep(0.16, 0.12, abs(pf.x)) * smoothstep(0.11, 0.07, abs(pf.y));
    wall = mix(wall, mix(vec3(0.86, 0.6, 0.3) * 0.5, deepW * 1.6, pin), pic * 0.5);                      // (polish 2) a dim gilt frame, no pale pane
    rm = mix(rm, wall, smoothstep(0.35, 0.7, abs(az) / 3.1416));                                         // plain wall beside the window
    vec2 pp = vec2(az + 0.75, d.y) / 1.15;
    // (polish 2) not a blurred pot plant: the room's own little fir in its pot, tiered, hung with lights and a star
    float ty = clamp(pp.y / 0.85, 0.0, 1.0), tier = fract(-ty * 5.0);
    float leaves = smoothstep(0.015, -0.015, abs(pp.x) - 0.33 * (1.0 - ty) * (0.7 + 0.3 * tier)) * smoothstep(0.0, 0.03, pp.y) * step(pp.y, 0.85);
    rm = mix(rm, vec3(0.05, 0.21, 0.15) * (0.6 + 0.5 * vn(pp * 11.0)) * (0.55 + 0.75 * tier) + uSunCol * 0.03, leaves * 0.95);
    rm += mix(vec3(1.0, 0.68, 0.32), vec3(0.8, 0.9, 1.0), step(0.6, h21(floor(pp * 21.0) + 5.1))) * stars(pp, 21.0, 0.75) * leaves * 2.4;
    { vec2 tq = pp - vec2(0.0, 0.89); float td = length(tq); rm += vec3(1.0, 0.78, 0.4) * (smoothstep(0.03, 0.01, td) * 2.5 + smoothstep(0.012, 0.0, min(abs(tq.x), abs(tq.y))) * smoothstep(0.1, 0.0, td) * 1.6 + 0.3 * exp(-td * td * 220.0)); }
    rm = mix(rm, vec3(0.8, 0.84, 0.92) * (0.8 + 0.3 * smoothstep(-0.15, 0.15, pp.x)), ell(pp, vec2(0.0, 0.02), vec2(0.16, 0.13), 0.2));   // its pot
    // out-of-focus glints about the room (glass, brass, a mirror): big soft discs, slowly breathing
    rm += mix(vec3(1.0, 0.95, 0.86), uSunCol, 0.4) * bokeh(vec2(az * 0.8, d.y * 1.15) + 3.0, 3.2, 0.42) * 0.04 * smoothstep(-0.05, 0.2, d.y) * smoothstep(-0.2, 0.35, -d.z);
    // the ceiling: pale plaster in blue skylight, a cornice, two window-shaped patches of bounced sun
    vec2 cp = d.xz / max(d.y, 0.05);
    vec2 ee = abs(cp - vec2(0.0, -0.92)) / vec2(1.95, 1.38);                                            // seen through the ball the ceiling's edge is a soft oval, never a straight line
    float ce = (1.0 - pow(pow(ee.x, 2.4) + pow(ee.y, 2.4), 0.4167)) * 1.38;
    vec3 ceil_ = mix(vec3(0.46, 0.47, 0.52), vec3(0.6, 0.54, 0.46), smoothstep(2.2, 0.1, length(cp - vec2(0.0, -0.3))));
    ceil_ = mix(ceil_, ceil_ * (0.55 + uHor * 0.6), 0.5);
    ceil_ = mix(ceil_ * 0.3, deepW * 0.95, 0.88) * (0.9 + 0.3 * smoothstep(2.4, 0.0, length(cp - vec2(0.0, -0.3)))) * (0.94 + 0.1 * vn(cp * 5.0));   // (polish) a deep blue ceiling: the window's light lies on it in warm patches
    float wl = winPatch(cp, vec2(-0.74, -0.66), vec2(0.42, 0.3), 0.35) + winPatch(cp, vec2(0.7, -0.24), vec2(0.36, 0.27), -0.32);
    ceil_ += mix(uSunCol, vec3(1.0, 0.55, 0.22), 0.75) * wl * (0.05 + 0.08 * sin(uTime * 0.9 + cp.x * 5.0) + 0.08 * sin(uTime * 1.4 - cp.y * 7.0)) * (1.0 - 0.45 * uSnow);
    ceil_ *= 1.0 - 0.13 * smoothstep(0.42, 0.0, ce);                                                     // a soft shadow where the ceiling meets the walls
    rm *= 1.0 - 0.12 * smoothstep(-0.6, 0.05, ce) * smoothstep(0.0, 0.12, d.y);
    rm = mix(rm, ceil_, smoothstep(-0.1, 0.14, ce) * smoothstep(0.04, 0.14, d.y));
    {
      vec2 stp = d.xz / (1.0 + max(d.y, -0.6));
      float st = stars(stp, 13.0, 0.55) + 0.7 * stars(stp + 7.3, 27.0, 0.4);
      rm += mix(vec3(1.0, 0.72, 0.38), vec3(0.8, 0.9, 1.0), step(0.6, h21(floor(stp * 13.0) + 1.3))) * st * 1.5 * smoothstep(-0.02, 0.1, d.y);
    }
    col = mix(rm, col, pane);
    // ---- the white sill, stretching away like a salt flat, with the globe's caustic splash on it
    vec2 sp = d.xz / max(-d.y, 0.03);
    vec3 sill = vec3(0.9, 0.9, 0.88) * (0.82 + 0.1 * vn(sp * 0.7)) * mix(vec3(0.34, 0.46, 0.8), vec3(0.8, 0.84, 0.95), smoothstep(-0.5, 2.5, sp.y));
    float barSh = smoothstep(0.3, 0.12, abs(sp.x + sp.y * uSunR.x / max(uSunR.z, 0.3) * 0.4)) * smoothstep(-1.0, 3.0, sp.y);
    sill *= 1.0 - 0.2 * barSh;
    vec2 cc = sp + uSunR.xz * 1.6; float cr2 = length(cc);
    float net = pow(1.0 - abs(sin(cc.x * 5.0 + sin(cc.y * 4.0 + uTime * 1.3) * 1.2)) * abs(sin(cc.y * 5.0 + sin(cc.x * 4.0 - uTime * 1.1) * 1.2)), 6.0);
    sill += uSunCol * (exp(-cr2 * cr2 * 0.55) * (0.5 + 2.2 * net) + smoothstep(0.25, 0.0, abs(cr2 - 1.75 - 0.05 * sin(uTime * 2.0))) * 0.5) * (1.0 - 0.6 * uSnow);
    col = mix(col, sill, smoothstep(-0.07, -0.16, d.y));
    return col;
  }
  // the window as the inside of the ball holds it: a bowed patch of 2 x 3 panes on the glass, centred at (azimuth, elevation)
  float winRefl(vec3 n, vec2 c, vec2 hs, float bow){
    float az = atan(n.x, n.z + 1e-5), el = asin(clamp(n.y, -1.0, 1.0));
    float da = az - c.x; da -= 6.2832 * floor(da / 6.2832 + 0.5);
    vec2 p = vec2(da * cos(c.y), el - c.y);
    p.x += bow * p.y * p.y - 0.25 * bow * p.y; p.y += 0.9 * p.x * p.x;
    vec2 q = p / hs;
    float m = smoothstep(1.0, 0.9, abs(q.x)) * smoothstep(1.0, 0.92, abs(q.y));
    float bars = smoothstep(0.06, 0.13, abs(q.x)) * smoothstep(0.05, 0.11, abs(abs(q.y) - 0.34));
    return m * (0.08 + 0.92 * bars) * (0.55 + 0.45 * q.y);
  }
  void main(){
    vec3 nrm = normalize(vW - uC), V = normalize(vW - cameraPosition);
    float ndv = max(dot(V, nrm), 0.0), dist = length(vW - cameraPosition);
    // thick hand-blown glass: the room is bent toward the normal where the ball curves away, and swims a little
    // behind slow ripples that belong to the glass, not to the room
    vec3 wob = vec3(vn(nrm.yz * 4.0 + 1.7), vn(nrm.zx * 4.0 + 4.1), vn(nrm.xy * 4.0 + 8.3)) - 0.5;
    wob += 0.4 * (vec3(vn(nrm.yz * 11.0 + 5.2), vn(nrm.zx * 11.0 + 9.4), vn(nrm.xy * 11.0 + 2.6)) - 0.5);
    vec3 d = normalize(uTilt * normalize(mix(V, refract(V, -nrm, 0.75), 0.6) + wob * 0.022));
    vec3 col = room(d);
    float hb = nrm.y * 80.0 + uC.y;                      // height on the glass
    // the liquid and the thick foot of the glass: a deeper blue low down when it is seen from across the globe,
    // so the white village stands in front of something
    vec3 deepG = mix(uTop, vec3(0.16, 0.3, 0.66), 0.55);
    col = mix(col, (col * vec3(0.52, 0.62, 1.0) * 0.8 + deepG * 0.3) * (0.85 + 0.25 * vn(nrm.xz * 7.0 + hb * 0.05)), smoothstep(42.0, 9.0, hb) * smoothstep(45.0, 105.0, dist) * 0.7);
    // window-shaped highlights lying on the inside of the glass: they slide as the globe is set down, then drift
    vec3 nT = uTilt * nrm;
    float dr = 0.05 * sin(uTime * 0.11), sl = uSettle;
    float hl = winRefl(nT, vec2(uWinAz + 0.95 * sl + dr, 0.62 - 0.22 * sl), vec2(0.125, 0.155), 0.9)
             + 0.8 * winRefl(nT, vec2(uWinAz - 0.95 - 0.7 * sl - dr, 1.02 - 0.15 * sl), vec2(0.13, 0.105), -1.1)
             + 0.42 * winRefl(nT, vec2(uWinAz + 3.1416 + 1.15 - 0.8 * sl + dr, 0.56 + 0.1 * sl), vec2(0.105, 0.135), -0.9);
    col = mix(col, vec3(1.0, 0.7, 0.36) * 1.15 + uSunCol * 0.3, clamp(hl * uWinK * 1.15, 0.0, 0.92));          // (polish 2) the lit window held small, warm and paned in the curve of the glass
    // the glass curving away: a sheen, a Fresnel veil and a spectral fringe, red outside, blue inside
    float rim = 1.0 - ndv;
    col += uTop * rim * rim * rim * 0.3;
    col = mix(col, mix(uTop, uHor, 0.35) * 0.9, smoothstep(0.6, 1.0, rim) * 0.4);
    col += vec3(0.15, 0.4, 1.0) * smoothstep(0.2, 0.5, rim) * smoothstep(0.8, 0.5, rim) * 0.5 + vec3(1.0, 0.3, 0.12) * smoothstep(0.52, 0.8, rim) * smoothstep(1.0, 0.84, rim) * 0.4;
    // the bright seam where the ball meets its base: a thin prismatic line all the way round, behind the pine rim
    float seam = (hb - uSeamY) + 0.5 * sin(atan(nrm.x, nrm.z + 1e-5) * 3.0);
    float glint = 0.55 + 0.45 * vn(nrm.xz * 38.0 + uTime * 0.6);
    col += (vec3(0.2, 0.45, 1.0) * smoothstep(2.6, 1.0, abs(seam - 1.5)) + vec3(1.0, 0.36, 0.14) * smoothstep(2.6, 1.0, abs(seam + 1.5)) + vec3(1.0, 0.97, 0.9) * 1.5 * smoothstep(0.7, 0.0, abs(seam))) * 0.5 * glint;
    // small bubbles stuck to the glass, crowding toward the big one, and the caustic halo it throws
    float ab = acos(clamp(dot(nrm, uBub), -1.0, 1.0));
    vec3 bt = normalize(cross(uBub, vec3(1.0, 0.0, 0.0))), bs = cross(bt, uBub);
    vec2 g = vec2(dot(nrm, bt), dot(nrm, bs)) * 80.0 / 3.4, gi = floor(g), gh = h22(gi), gc = fract(g) - 0.5 - (gh - 0.5) * 0.5;
    float br = (0.1 + 0.3 * gh.x * gh.x) * (1.0 + 0.08 * sin(uTime * 2.0 + gh.y * 40.0)), bd = length(gc);
    float on = step(h21(gi + 3.1), 0.65 * exp(-ab * 6.5) + 0.012) * step(0.6, dot(nrm, uBub));
    col = mix(col, col * 0.78 + vec3(0.1, 0.12, 0.17), on * smoothstep(br, br * 0.85, bd) * 0.7);
    col += (uSunCol * 0.8 + 0.3) * on * (smoothstep(0.05, 0.0, abs(bd - br * 0.9)) * 0.45 + smoothstep(br * 0.3, 0.0, length(gc - vec2(0.3, 0.35) * br)) * 1.4);
    ab = acos(clamp(dot(nrm, uBubH), -1.0, 1.0));                // the halo follows the lens as it is seen, 6 m below the glass
    float ba = atan(dot(nrm, bs), dot(nrm, bt) + 1e-5), wv = 0.0035 * sin(ba * 9.0 + uTime * 1.6) + 0.0025 * sin(ba * 5.0 - uTime * 2.3);   // (polish 2) clean halo rings, barely breathing
    float rings = 0.4 * smoothstep(0.016, 0.0, abs(ab - 0.2 - wv - 0.012 * sin(uTime * 1.7))) + 0.3 * smoothstep(0.016, 0.0, abs(ab - 0.31 + wv - 0.015 * sin(uTime * 1.3 + 2.0)))
                + 0.22 * smoothstep(0.018, 0.0, abs(ab - 0.44 - wv * 1.4 - 0.016 * sin(uTime * 1.1 + 4.0))) + 0.15 * smoothstep(0.02, 0.0, abs(ab - 0.59 + wv * 1.6 - 0.018 * sin(uTime * 0.9 + 1.0)));
    col += mix(uSunCol, vec3(0.85, 0.92, 1.0), 0.55) * (0.4 * exp(-ab * 5.0) + rings * 0.8 * (0.75 + 0.25 * sin(ba * 23.0 + uTime * 0.7)) + 0.2 * smoothstep(0.03, 0.0, abs(ab - 0.128)));
    {   // (polish) round the visitor the ball itself shows: a faint ring of frost on the glass and one curved window-light highlight
      float va = acos(clamp(dot(nrm, uVisDir), -1.0, 1.0));
      vec3 vt = normalize(cross(uVisDir, vec3(0.0, 1.0, 0.0))), vu = cross(vt, uVisDir);
      float vang = atan(dot(nrm, vu), dot(nrm, vt) + 1e-5), fr = fbm(vec2(vang * 7.0, va * 34.0));
      col = mix(col, vec3(0.88, 0.93, 1.0), smoothstep(0.07, 0.0, abs(va - 0.66 - 0.05 * fr)) * (0.2 + 0.8 * fr * fr) * 0.5 * uLand);
      col += (uSunCol * 0.7 + 0.45) * smoothstep(0.016, 0.0, abs(va - 0.5 - 0.01 * sin(vang * 2.0))) * smoothstep(0.35, 0.95, sin(vang - 2.4)) * 0.8 * uLand;
    }
    // rare: the pressure ring where the beak struck
    float ta = acos(clamp(dot(nrm, uTapDir), -1.0, 1.0));
    col += vec3(1.3, 1.5, 1.8) * smoothstep(0.07, 0.0, abs(ta - uTap * 2.6)) * smoothstep(1.0, 0.25, uTap) * step(0.001, uTap);
    // the milk-blue liquid between here and the glass
    col = mix(col, uHaze, (1.0 - exp(-dist * dist * 0.000022)) * 0.1 * (0.7 + 0.3 * smoothstep(20.0, 52.0, hb)));
    gl_FragColor = vec4(col, 1.0);
  }`;

// ---------- bottle-brush pines: instanced, leaning with the current and wobbling upright ----------
const PINE_VERT = /* glsl */`
  attribute vec3 aCol; attribute vec4 aFx; attribute vec2 aTree;
  uniform float uTime, uS;
  varying vec3 vCol, vN, vW; varying vec2 vUv, vYW; varying float vMat; varying vec4 vBr;
  #include <fog_pars_vertex>
  void main(){
    mat4 im = modelMatrix * instanceMatrix;
    vec3 root = im[3].xyz;
    vec4 w = im * vec4(position, 1.0);
    vec3 n = normalize(mat3(im) * normal);
    vec2 tang = normalize(vec2(root.z, -root.x) + 1e-4);
    float hgt = w.y - root.y;
    float sway = sin(uTime * (1.5 + aTree.x) + aTree.x * 40.0);
    float lean = 0.5 * uS * aTree.y + (0.035 + 0.3 * uS * (1.0 - uS)) * sway;
    float b = lean * hgt * (0.55 + 0.05 * hgt);
    w.xz += tang * b; w.y -= abs(b) * abs(lean) * 0.45;
    w.xz += vec2(-tang.y, tang.x) * 0.02 * hgt * sin(uTime * 1.1 + aTree.x * 17.0);
    n = normalize(n - vec3(tang.x, 0.0, tang.y) * lean * n.y * 0.6);
    vW = w.xyz; vN = n; vCol = aCol; vUv = uv; vMat = aFx.x; vBr = vec4(position.xz, aFx.yz);
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition; vYW = gl_Position.yw;
    #include <fog_vertex>
  }`;

// ---------- settled glitter: drifts in the lee of the houses, lifted off in sheets while the current runs ----------
const GLIT_VERT = /* glsl */`
  attribute vec3 aBase, aSeed;
  uniform float uTime, uS;
  varying vec2 vQ; varying float vSp;
  #include <fog_pars_vertex>
  void main(){
    vec2 tang = normalize(vec2(aBase.z, -aBase.x) + 1e-4);
    float gust = smoothstep(0.2, 1.0, 0.5 + 0.5 * sin(uTime * 0.9 - aSeed.z * 2.5 + aSeed.x * 0.8 + atan(aBase.x, aBase.z + 1e-4) * 3.0));
    float lift = min((0.1 + 1.7 * uS) * gust * (0.3 + aSeed.y), 1.5);
    vec3 c = aBase + vec3(tang.x, 0.0, tang.y) * lift * (2.0 + 6.0 * aSeed.y) + vec3(0.0, 0.07 + lift * (0.6 + 3.4 * aSeed.y), 0.0);
    c += 0.3 * lift * vec3(sin(uTime * 3.0 + aSeed.x * 40.0), sin(uTime * 2.3 + aSeed.y * 40.0), cos(uTime * 2.7 + aSeed.z * 40.0));
    vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.0);
    float dist = length(mv.xyz);
    float rot = aSeed.x * 6.2832 + lift * uTime * 3.0, cr = cos(rot), sr = sin(rot);
    mv.xy += vec2(position.x * cr - position.y * sr, position.x * sr + position.y * cr) * max(0.1 + 0.09 * aSeed.y, dist * 0.0017) * smoothstep(1.5, 8.0, dist);
    vSp = pow(abs(sin(uTime * (1.2 + 2.6 * aSeed.x) * (0.4 + lift) + aSeed.z * 50.0)), 22.0);
    vQ = position.xy;
    vec4 mvPosition = mv;
    gl_Position = projectionMatrix * mv;
    #include <fog_vertex>
  }`;
const GLIT_FRAG = /* glsl */`
  uniform vec3 uSunCol, uSkyCol;
  varying vec2 vQ; varying float vSp;
  #include <fog_pars_fragment>
  void main(){
    if (sqrt(abs(vQ.x)) + sqrt(abs(vQ.y)) > 1.0) discard;                                // a four-point star
    vec3 col = vec3(0.9, 0.93, 1.0) * (uSkyCol * 0.62 + uSunCol * 0.42) + mix(uSunCol, vec3(1.0), 0.4) * vSp * 5.0;
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }`;

// ---------- (polish) lamplight: additive halos that face the lens, and pools that lie on the snow ----------
const GLOW_VERT = /* glsl */`
  attribute vec4 aP; attribute vec3 aK, aN;
  uniform float uTime;
  varying vec2 vQ; varying float vI;
  void main(){
    vec4 mv;
    if (aK.x < 0.5) { mv = viewMatrix * vec4(aP.xyz, 1.0); mv.xy += position.xy * aP.w; }
    else {
      vec3 n = normalize(aN + vec3(0.0, 1e-4, 0.0)), t = normalize(cross(n, vec3(0.0, 0.0, 1.0)) + vec3(1e-5, 0.0, 0.0)), b = cross(t, n);
      mv = viewMatrix * vec4(aP.xyz + (t * position.x + b * position.y) * aP.w, 1.0);
    }
    vQ = position.xy; vI = aK.y * (0.88 + 0.12 * sin(uTime * (1.7 + 2.0 * aK.z) + aK.z * 40.0));
    gl_Position = projectionMatrix * mv;
  }`;
const GLOW_FRAG = /* glsl */`
  uniform vec3 uCol; varying vec2 vQ; varying float vI;
  void main(){
    float d = length(vQ), a = exp(-d * d * 4.5) * smoothstep(1.0, 0.7, d);
    gl_FragColor = vec4(uCol * (a * vI) + vec3(1.0, 0.85, 0.6) * (a * a * a * vI * 0.6), 1.0);
  }`;

// gable roof: ridge along X at height h, eaves at z = +-(d/2 + over)
function gableRoof(w, d, h, over) {
  const hw = w / 2 + over, hd = d / 2 + over, g = new THREE.BufferGeometry();
  const P = [-hw, 0, hd, hw, 0, hd, hw, h, 0, -hw, 0, hd, hw, h, 0, -hw, h, 0, hw, 0, -hd, -hw, 0, -hd, -hw, h, 0, hw, 0, -hd, -hw, h, 0, hw, h, 0];
  const UV = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(UV), 2));
  g.computeVertexNormals(); return g;
}
function gableEnds(w, d, h) {
  const x = w / 2, z = d / 2, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x, 0, z, x, 0, -z, x, h, 0, -x, 0, -z, -x, 0, z, -x, h, 0]), 3));
  g.computeVertexNormals(); return g;
}

export default {
  id: 'shaken-globe', name: 'The Shaken Globe', category: 'domestic', weirdness: 0.3,
  media: ['tiny', 'snow', 'air'],
  async build(ctx) {
    const { rng, noise } = ctx, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare, hour = vary.hour || 'any';
    const pickDay = rng.pick(['morning', 'overcast', 'morning']), pickAny = rng.pick(['sunrise', 'morning', 'overcast', 'thaw', 'morning']);
    const lookId = hour === 'dawn' || hour === 'night' ? 'sunrise' : hour === 'golden' ? 'thaw' : hour === 'day' ? pickDay : pickAny;
    const L = LOOKS[lookId], duration = 44;
    const detail = ctx.quality?.detail ?? 1;                          // phones: fewer flakes and less settled glitter, nothing else
    const visitor = rng.pick([0, 0, 0, 1, 2]);                       // robin | pair of blue tits | squirrel
    const scene = new THREE.Scene();
    const fogCol = new THREE.Color(L.fog).lerp(new THREE.Color(L.top), 0.55).multiplyScalar(0.62);          // (polish) the liquid is clear and blue, a third of the old milk
    scene.background = fogCol.clone(); scene.fog = new THREE.FogExp2(fogCol, (L.fogD ?? 0.0047) * 0.58);

    // ---- the hero and its porcelain kit
    // (bubblesAt: clusters that rise between the lens and the glass at the reveal, on the window side)
    // They rise at the two ends of the reveal's arc, wide of every line from the lens to the visitor (who lands on the
    // side away from the sun), so none of them ever drifts across its breast.
    const visSide = -(Math.sign(L.az) || 1);
    const hero = await buildHero(ctx, { palette: PALETTE, flakes: Math.round(17000 * clamp(density, 0.8, 1.2) * detail), duration,
      bubblesAt: [[5.8, 72.5], [5.9, 71], [5.7, 70], ...(visSide > 0 ? [[6.9, 71.5], [7.0, 70]] : [[6.72, 72], [6.82, 70.5]])].map(([a, r]) => [Math.sin(a) * r, Math.cos(a) * r]) });
    const rx = ctx.core.makeRng('shaken-globe-extras:' + ctx.seed);      // its own stream, so later additions never shift the main one
    scene.add(hero.object);
    const U = hero.uniforms, A = hero.anchors;
    const { prep, place, glazedLathe, instances, wobble, tube, archShape, C, glaze } = hero.kit;
    const az = L.az + rng.range(-0.12, 0.12), el = (L.el + rng.range(-2, 2)) * DEG;
    const sunRoom = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const sunCol = new THREE.Color(L.sun);
    hero.setSun(sunRoom, sunCol.clone().lerp(new THREE.Color(1, 1, 1), 0.4).multiplyScalar(L.sunK));
    U.uSkyCol.value.set(L.skyFill).lerp(new THREE.Color(1, 1, 1), 0.12).multiplyScalar(lookId === 'overcast' ? 1.22 : 1);
    U.uHorizon.value.set(L.hor).lerp(new THREE.Color(L.fog), 0.3);
    U.uCaK.value = L.caK ?? 1; U.uTsTop.value = L.tsTop ?? 1;
    // real lights only for rides and companions (every world surface is self-lit)
    scene.add(new THREE.HemisphereLight(new THREE.Color(L.skyFill), new THREE.Color('#f7f4ee'), 1.1));
    const sunLight = new THREE.DirectionalLight(sunCol, 1.6 * L.sunK); sunLight.position.copy(sunRoom).multiplyScalar(200); scene.add(sunLight);
    await ctx.yield();

    // ---- the flight. Angles follow the current: a grows counter-clockwise seen from above, pos = (sin a, cos a) * r
    const pp = (a, r, y) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
    const a0 = 2.6 + rng.range(-0.07, 0.07), rs = rng.range(51, 53.5);
    // the portal sits half a metre behind the bubble's mirror underside, which opens like an iris on approach
    const seatDir = A.portalSeat.direction.clone(), seat = A.portalSeat.position.clone().addScaledVector(seatDir, 0.25);
    const pts = [
      pp(a0, 68, 27), pp(a0 + 0.04, 50.5, 26.2), pp(a0 + 0.5, 46.5, 23), pp(a0 + 0.9, 48.5, 18), pp(a0 + 1.3, rs, 13.5), pp(a0 + 1.7, rs, 10.6),
      pp(4.7, rs, 9.4), pp(5.15, rs + 1, 9.8), pp(5.6, rs + 4, 12), pp(6.0, 60, 15.2), pp(6.38, 63, 14.8),
      pp(6.8, 59, 14.5), pp(7.12, 47, 10.8), pp(7.42, 33, 8.2), pp(7.66, 23.5, 7),
    ];
    const aOrb = Math.PI / 2 + TAU, HR = 0.95;
    // (polish) the close orbit over the ice for a quarter turn, then one long even climb: past the reindeer deck at their own
    // height, out to r 21 level with the crown and its finial, on up over the spire so the whole lit village lies below,
    // and in over the tip to the foot of the straight run. Same turning and (within a metre) the same length as before.
    for (const [da, r, y] of [[0, 18.5, 6.6], [0.785, 18.5, 6.6], [1.571, 18.5, 7.4], [2.356, 18.8, 9.2], [3.142, 19.2, 12.0], [3.927, 20.0, 16.5], [4.712, 20.8, 21.5],
      [5.498, 21.2, 26.0], [6.283, 21.2, 29.5], [7.069, 20.5, 32.5], [7.854, 19.5, 35.0], [8.639, 18.5, 37.5], [9.425, 17.5, 39.5], [10.21, 16.5, 41.0],
      [10.996, 15.5, 42.0], [11.781, 14.5, 42.6], [12.566, 13.5, 43.2], [13.352, 13.2, 44.2]]) pts.push(pp(aOrb + da, da > 2 ? r * HR : r, y));
    pts.push(new THREE.Vector3(3.4, 47.8, -13.2));
    const LINE = 39;
    for (const k of [LINE, 26, 13, 0]) pts.push(seat.clone().addScaledVector(seatDir, -k));
    const path = makePath(pts, { samples: 480 });
    const SN = 400, sPts = []; for (let i = 0; i <= SN; i++) sPts.push(path.pointAt(i / SN));
    const uNear = (v) => { let b = 1e9, bi = 0; for (let i = 0; i <= SN; i++) { const d = sPts[i].distanceToSquared(v); if (d < b) { b = d; bi = i; } } return bi / SN; };
    const uStreet = uNear(pts[6]), uReveal = uNear(pts[10]), uBridge = uNear(pts[12]), uIce = uNear(pts[15]), uHelix = uNear(pts[20]), uTop = uNear(pts[pts.length - 4]);
    const uDeck = uNear(pts[19]), uCrown = uNear(pts[23]) - 0.005, uOver = uNear(pts[26]) - 0.01, uSpire = uNear(pts[29]);
    const uTilt = uNear(pts[4]) * 0.92;

    // ---- layout: channel, pads for buildings, then the snow hills
    const chanA = (r) => 0.8 + 0.09 * Math.sin(r * 0.11 + 1.0);
    const chanDist = (x, z) => { const r = Math.hypot(x, z); let da = Math.atan2(x, z) - chanA(r); da -= Math.round(da / TAU) * TAU; return Math.abs(da) * r; };
    const pads = [];
    const hillRaw = (x, z) => {
      const r = Math.hypot(x, z), a = Math.atan2(x, z);
      let h = Math.pow(clamp(noise.fbm2(x * 0.03 + 7.3, z * 0.03 - 2.1, 3) * 0.6 + 0.5, 0, 1), 1.25) * 9.5 * smoothstep(37.5, 50, r) * (1 - smoothstep(61, 71, r));
      h += 3.4 * smoothstep(54, 63, r) * (1 - smoothstep(66, 72, r)) * (0.55 + 0.45 * noise.n2(Math.sin(a) * 2.2 + 3, Math.cos(a) * 2.2));
      h += smoothstep(72.5, 79.5, r) * 4.5;
      h = lerp(-0.55, h, smoothstep(35.3, 39.5, r));
      const n = path.nearestXZ(x, z);
      if (n.dist < 17) h = Math.min(h, lerp(n.y - 8.6, h, smoothstep(7, 17, n.dist)));
      const dc = chanDist(x, z);
      if (r > 35 && dc < 5.5) h = lerp(Math.min(h, -0.75), h, smoothstep(1.7, 5.5, dc));
      return h;
    };
    const hillAt = (x, z) => {
      let h = hillRaw(x, z);
      for (const p of pads) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r + 4) h = lerp(p.y, h, smoothstep(p.r, p.r + 4, d)); }
      return h;
    };
    const clearOf = (x, y, z, m) => path.distanceTo(x, y, z) > m;
    const padFree = (x, z, m) => pads.every((p) => Math.hypot(x - p.x, z - p.z) > p.r + m);
    const addPad = (x, z, r, y) => { const p = { x, z, r, y: y ?? hillRaw(x, z) }; pads.push(p); return p; };

    // windmill on its hill beside the street, bandstand, bridge over the feeder channel
    const aw = 4.98 + rng.range(-0.12, 0.12), mill = addPad(Math.sin(aw) * (rs + 14), Math.cos(aw) * (rs + 14), 4.2, 4.6);
    const ab = 1.75 + rng.range(-0.3, 0.3), band = addPad(Math.sin(ab) * 47, Math.cos(ab) * 47, 5.6, 1.4);
    const rB = 43.5, aB = chanA(rB), bridge = { x: Math.sin(aB) * rB, z: Math.cos(aB) * rB, a: aB };
    // houses: two crescents flanking the street, and a looser group on the far side of the pond
    const houses = [], nHouse = Math.round(25 * density);
    const tryHouse = (a, r, face, type) => {
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (!clearOf(x, 5, z, 10.5) || !clearOf(x, 9, z, 9) || !padFree(x, z, 5) || chanDist(x, z) < 8) return false;
      const p = addPad(x, z, 4.6); p.y = Math.max(p.y, 0.2);
      const h = { x, z, y: p.y, ry: a + (face > 0 ? 0 : Math.PI) + rng.range(-0.25, 0.25), type: type ?? rng.int(0, 5), s: rng.range(0.9, 1.12) };
      if (h.type === 5) {       // the church is deep and its tower stands forward of the nave: set it back from the street
        const r2 = clamp(r + (r > rs ? 3.8 : -3.8), 42, 72), k = r2 / r;
        if (clearOf(x * k, 5, z * k, 13.5) && clearOf(x * k, 9, z * k, 12)) { h.x = p.x = x * k; h.z = p.z = z * k; h.y = p.y = Math.max(hillRaw(h.x, h.z), 0.2); }
        else h.type = 2;      // no room for it here: a cottage instead
      }
      houses.push(h);
      return true;
    };
    for (let a = a0 + 0.95; a < 5.85 && houses.length < nHouse * 0.62; a += rng.range(0.17, 0.25)) {
      if (rng.chance(0.85)) tryHouse(a, rs - 12.8 + rng.range(-0.6, 0.8), 1);
      if (rng.chance(0.8)) tryHouse(a + 0.08, rs + 12.8 + rng.range(-0.8, 2.5), -1);
    }
    for (let k = 0; k < 90 && houses.length < nHouse; k++) tryHouse(rng.range(0.95, 2.6), rng.range(41, 58), rng.chance(0.5) ? 1 : -1);
    // (polish 2) the village's great fir, dressed with gilt garlands, lit bulbs and a star: it stands at the head of the
    // street where the lens turns up toward the glass, the subject of that stretch. Its spot is searched without a random
    // draw and without touching the pads, so nothing else in the village moves.
    let great = null;
    for (let i = 0; i < 40 && !great; i++) {
      const a = 5.76 + ((i >> 2) % 2 ? 1 : -1) * Math.ceil((i >> 2) / 2) * 0.04, r = 67.5 + (i & 3) * 1.1, x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (padFree(x, z, 6.5) && clearOf(x, 10, z, 9.5) && clearOf(x, 16, z, 8.5) && chanDist(x, z) > 9) great = { x, z, y: 0, H: 25 };
    }
    if (!great) great = { x: Math.sin(5.76) * 70.5, z: Math.cos(5.76) * 70.5, y: 0, H: 25 };
    await ctx.yield();

    // ---- snow hills: a polar grid from the hero's bank out to the glass
    {
      const NR = 46, NA = 168, pos = new Float32Array((NR + 1) * NA * 3), idx = [];
      for (let j = 0; j <= NR; j++) {
        const r = 35.3 + (79.9 - 35.3) * Math.pow(j / NR, 1.08);
        for (let i = 0; i < NA; i++) { const a = i / NA * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r, k = (j * NA + i) * 3; pos[k] = x; pos[k + 1] = hillAt(x, z); pos[k + 2] = z; }
        if (j % 2 === 1) await ctx.yield();
      }
      for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * NA + i, b = j * NA + (i + 1) % NA, c = a + NA, d = b + NA; idx.push(a, b, c, b, d, c); }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals();
      await ctx.yield();
      const stream = C.sky.clone().lerp(C.cobalt, 0.4);
      const groundGeo = prep(tg, {
        col: (x, y, z, u, v, out) => {
          const r = Math.hypot(x, z);
          out.copy(C.white).lerp(C.pool, clamp(0.46 - y * 0.075 + noise.n2(x * 0.22, z * 0.22) * 0.2 + 0.2 * smoothstep(0.05, 0.7, noise.n2(x * 0.085 + 31, z * 0.085 - 7)), 0.04, 0.8));   // blue pooled in the hollows, brushed
          if (r > 36) out.lerp(stream, smoothstep(3.4, 1.5, chanDist(x, z)) * 0.9);
          out.lerp(C.cobalt, Math.max(smoothstep(0.7, 0.3, Math.abs(r - 74.2)), smoothstep(0.35, 0.1, Math.abs(r - 76.0))) * 0.9);
        },
      });
      await ctx.yield();
      const ground = new THREE.Mesh(groundGeo, glaze);
      ground.frustumCulled = false; scene.add(ground);
    }
    await ctx.yield();

    // ---- the porcelain village (one merged mesh in the hero's glaze)
    const VG = [], tmpC = new THREE.Color();
    const wallCol = (h) => (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, clamp(0.5 - y * 0.2, 0, 0.5));
    const win = (w, h, m) => prep(new THREE.ExtrudeGeometry(archShape(w, h), { depth: 0.16, bevelEnabled: false, curveSegments: 4 }),
      { col: (x, y, z, u, v, out) => out.copy(C.lamp).multiplyScalar(0.5 + 0.5 * clamp(y / h, 0, 1)), mat: 3, m });     // (polish) every window lit amber, brightest at the head of the arch
    const ball = (r, x, y, z, col = C.gold, mt = 1) => prep(new THREE.SphereGeometry(r, 7, 5), { col, mat: mt, m: place(x, y, z) });
    const roofTint = (x, y, z, u, v, out) => out.copy(C.cobalt).lerp(C.deep, 0.35 * (1 - v));
    // (the house makers are generators: they pause between pieces so the build can hand the frame back)
    function* boxHouse(w, d, hw, hr, row, blue) {
      const G = [];
      G.push(prep(new THREE.BoxGeometry(w, hw, d), { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, clamp(0.3 - y * 0.2, 0, 0.5)), row, rep: 0.5, m: place(0, hw / 2, 0) }));
      G.push(prep(gableRoof(w, d, hr, 0.55), blue ? { col: roofTint, m: place(0, hw - 0.12, 0) } : { col: C.white, row: 1, rep: 1, vrep: 2, m: place(0, hw - 0.12, 0) }));
      G.push(prep(gableEnds(w, d, hr - 0.25), { col: C.white, m: place(0, hw, 0) }));
      const ridge = new THREE.CylinderGeometry(0.13, 0.13, w + 1.3, 6); ridge.rotateZ(Math.PI / 2); G.push(prep(ridge, { col: C.gold, mat: 1, m: place(0, hw + hr - 0.1, 0) }));
      for (const s of [-1, 1]) G.push(ball(0.24, s * (w / 2 + 0.65), hw + hr - 0.05, 0));
      G.push(glazedLathe([[0.38, 0], [0.42, 1.1], [0.55, 1.2], [0.5, 1.4], [0.3, 1.55]], 8, C.white, C.cobalt, { m: place(w * 0.24, hw + hr * 0.45, -d * 0.2) }));
      yield;
      G.push(win(1.0, 2.0, place(0, 0, d / 2 - 0.04)));
      for (const s of [-1, 1]) {
        yield;
        G.push(win(0.85, 1.3, place(s * w * 0.31, hw * 0.34, d / 2 - 0.04)));
        if (hw > 4.6) G.push(win(0.7, 1.0, place(s * w * 0.31, hw * 0.7, d / 2 - 0.04)));
        G.push(win(0.85, 1.3, place(s * w * 0.25, hw * 0.4, -d / 2 + 0.04, Math.PI)));
        G.push(win(0.8, 1.3, place(s * (w / 2 - 0.04), hw * 0.4, 0, s * Math.PI / 2)));
        G.push(prep(new THREE.SphereGeometry(0.34, 8, 5), { col: C.cobalt, m: place(s * (w / 2 + 0.02), hw + hr * 0.36, 0, 0, 0, 0, 0.25, 1, 1) }));
      }
      yield;
      const g = mergeGeometries(G);
      yield;
      return wobble(g, noise, 0.06);
    }
    function* roundHouse(r, hw, hr, row, blue) {
      const G = [];
      G.push(glazedLathe([[r * 1.06, 0], [r, 0.35], [r, hw]], 18, C.white, C.pool, { row, rep: 1.25 }));
      G.push(glazedLathe([[r + 0.7, hw - 0.25], [r * 0.6, hw + hr * 0.45], [0.14, hw + hr]], 18, C.white, C.pool, blue ? { tint: (x, y, z, u, v, out) => out.copy(C.cobalt).lerp(C.deep, 0.35 * (1 - v)) } : { row: 1, rep: 2, vrep: 2 }));
      const tr = new THREE.TorusGeometry(r + 0.68, 0.09, 5, 20); tr.rotateX(Math.PI / 2); G.push(prep(tr, { col: C.gold, mat: 1, m: place(0, hw - 0.25, 0) }));
      G.push(ball(0.3, 0, hw + hr + 0.2, 0));
      yield;
      G.push(win(1.0, 2.0, place(0, 0, r - 0.06)));
      for (let k = 1; k < 5; k++) { const a = k / 5 * TAU; G.push(win(0.8, 1.3, place(Math.sin(a) * (r - 0.06), hw * 0.45, Math.cos(a) * (r - 0.06), a))); }
      yield;
      const g = mergeGeometries(G);
      yield;
      return wobble(g, noise, 0.06);
    }
    const houseTpl = [], staged = async (gen) => { let r; while (!(r = gen.next()).done) await ctx.yield(); return r.value; };
    for (const make of [() => boxHouse(7, 5.4, 4.2, 2.8, 0, false), () => boxHouse(8.4, 5.8, 5.1, 3.1, 3, true), () => boxHouse(6, 5, 3.7, 3.3, 2, false), () => roundHouse(3.1, 5.0, 3.8, 3, false), () => roundHouse(2.6, 6.1, 3.5, 0, true), () => boxHouse(6, 9, 4.6, 3.4, 0, true)]) { houseTpl.push(await staged(make())); await ctx.yield(); }
    { const tower = await staged(roundHouse(1.9, 9.2, 4.6, 2, false)); tower.applyMatrix4(place(0, 0, 4.2)); await ctx.yield(); houseTpl[5] = mergeGeometries([houseTpl[5], tower]); }   // the church: a nave and its round tower
    const houseTop = [7.0, 8.2, 7.0, 9.1, 9.9, 8.0];
    await ctx.yield();
    const cocks = [];
    for (let t = 0; t < houseTpl.length; t++) {
      const mats = [];
      houses.forEach((h, i) => { if (h.type !== t) return; mats.push(place(h.x, h.y - 0.15, h.z, h.ry, 0, 0, h.s)); if (i % 3 === 0) cocks.push(new THREE.Vector3(h.x, h.y + houseTop[t] * h.s - 0.1, h.z)); });
      for (let i = 0; i < mats.length; i += 2) { VG.push(instances(houseTpl[t], mats.slice(i, i + 2))); await ctx.yield(); }
      houseTpl[t].dispose();
    }
    await ctx.yield();

    // (polish 2) the great fir
    {
      great.y = hillAt(great.x, great.z) - 0.4;
      const G = [], H = great.H, firGreen = C.green.clone().lerp(new THREE.Color('#2f8a58'), 0.6), NT = 9, NS = 18;
      G.push(glazedLathe([[2.5, -1.2], [2.6, 0.5], [1.9, 0.9], [1.0, 2.8]], 14, C.white, C.cobalt, { row: 2, rep: 2 }));
      for (let k = 0; k < NT; k++) {
        const f = k / (NT - 1), R = lerp(6.0, 1.15, f), h = lerp(4.8, 2.7, f), cg = new THREE.ConeGeometry(R, h, NS, 2, true), cp = cg.attributes.position;
        for (let i = 0; i < cp.count; i++) {
          const c = i % (NS + 1), row = Math.floor(i / (NS + 1)), a = c / NS * TAU, odd = c % 2 === 1;
          const r = row === 0 ? R * 0.1 : row === 1 ? R * (odd ? 0.5 : 0.58) : R * (odd ? 1.1 : 0.9);
          cp.setXYZ(i, Math.sin(a) * r, row === 0 ? h / 2 : row === 1 ? -0.08 * h : -h / 2 + (odd ? -0.15 * h : 0.05 * h), Math.cos(a) * r);
        }
        cg.computeVertexNormals();
        G.push(prep(cg, { col: (x, y, z, u, v, out) => { const rr = Math.hypot(x, z) / R; out.copy(firGreen).multiplyScalar(0.5 + 1.25 * rr).lerp(C.white, smoothstep(0.8, 0.95, rr) * 0.95); }, m: place(0, 2.4 + f * (H - 6.0) + h / 2, 0, k * 0.5) }));
        if (k % 3 === 2) await ctx.yield();
      }
      await ctx.yield();
      const sp = [], NB = 54;
      for (let i = 0; i <= 90; i++) { const t = i / 90, a = t * TAU * 5, r = lerp(6.25, 1.3, t) + 0.25 * Math.sin(t * 90); sp.push([Math.sin(a) * r, 2.2 + t * (H - 4.6) - 0.5 * Math.abs(Math.sin(a * 4.5)), Math.cos(a) * r]); }
      G.push(prep(tube(sp, 0.13, 180, 5), { col: C.gold, mat: 1 }));
      await ctx.yield();
      for (let i = 0; i < NB; i++) {
        const t = (i + 0.5) / NB, a = t * TAU * 5 + 0.3, r = lerp(6.25, 1.3, t) + 0.2;
        G.push(prep(new THREE.SphereGeometry(i % 3 === 0 ? 0.42 : 0.33, 7, 5), { col: i % 3 === 0 ? C.lamp.clone().multiplyScalar(1.5) : i % 3 === 1 ? C.lamp : new THREE.Color(0.75, 0.85, 1.0), mat: 3, m: place(Math.sin(a) * r, 1.7 + t * (H - 4.6), Math.cos(a) * r) }));
        if (i % 14 === 13) await ctx.yield();
      }
      await ctx.yield();
      const eye = path.pointAt(0.25), sry = Math.atan2(eye.x - great.x, eye.z - great.z);
      G.push(prep(hero.kit.starGeo(hero.kit.K.starPoints, 1.05, 0.25), { col: C.gold, mat: 1, flat: true, m: place(0, H + 1.5, 0, sry, 0, 0, 2.3) }));
      G.push(prep(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6), { col: C.gold, mat: 1, m: place(0, H - 0.6, 0) }));
      G.push(prep(new THREE.SphereGeometry(0.5, 8, 6), { col: C.lamp.clone().multiplyScalar(1.6), mat: 3, m: place(0, H + 1.5, 0) }));
      await ctx.yield();
      const g = mergeGeometries(G); for (const x of G) x.dispose();
      await ctx.yield();
      g.applyMatrix4(place(great.x, great.y, great.z)); VG.push(g);
    }
    await ctx.yield();
    // windmill tower (the sails are their own turning mesh)
    {
      const G = [];
      G.push(glazedLathe([[3.4, -0.6], [3.3, 0.5], [2.85, 4.2]], 20, C.white, C.pool, { row: 0, rep: 1.5 }));
      G.push(glazedLathe([[2.85, 4.2], [2.95, 4.5], [2.75, 4.8], [2.1, 11.0], [2.45, 11.3]], 20, C.white, C.pool));
      G.push(glazedLathe([[2.6, 11.3], [2.3, 12.0], [1.5, 13.2], [0.2, 13.9]], 20, C.white, C.pool, { tint: (x, y, z, u, v, out) => out.copy(C.cobalt).lerp(C.deep, 0.3 * (1 - v)) }));
      const tr = new THREE.TorusGeometry(2.92, 0.11, 5, 24); tr.rotateX(Math.PI / 2); G.push(prep(tr, { col: C.gold, mat: 1, m: place(0, 4.5, 0) }));
      G.push(ball(0.34, 0, 14.2, 0)); G.push(win(1.1, 2.1, place(0, 0, 3.2)));
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.8; G.push(win(0.7, 1.2, place(Math.sin(a) * 2.45, 6.5 + (k % 2) * 1.8, Math.cos(a) * 2.45, a))); }
      const ax = new THREE.CylinderGeometry(0.25, 0.25, 3.2, 8); ax.rotateX(Math.PI / 2); G.push(prep(ax, { col: C.gold, mat: 1, m: place(0, 11.0, 2.0) }));
      const g = wobble(mergeGeometries(G), noise, 0.07); g.applyMatrix4(place(mill.x, mill.y, mill.z, aw + Math.PI)); VG.push(g);
    }
    await ctx.yield();
    // bandstand
    {
      const G = [];
      G.push(glazedLathe([[4.6, -0.5], [4.6, 0.8], [4.3, 0.95], [0.1, 0.95]], 16, C.white, C.pool, { row: 2, rep: 3 }));
      G.push(glazedLathe([[5.2, 3.9], [4.9, 4.2], [2.6, 5.1], [0.9, 6.2], [0.15, 6.9]], 16, C.white, C.pool, { row: 1, rep: 2.5, vrep: 2 }));
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; G.push(prep(new THREE.CylinderGeometry(0.11, 0.13, 3.2, 6), { col: C.gold, mat: 1, m: place(Math.sin(a) * 4.1, 2.5, Math.cos(a) * 4.1) })); G.push(ball(0.2, Math.sin(a) * 5.05, 3.85, Math.cos(a) * 5.05)); }
      G.push(ball(0.32, 0, 7.15, 0));
      const g = wobble(mergeGeometries(G), noise, 0.06); g.applyMatrix4(place(band.x, band.y, band.z)); VG.push(g);
    }
    await ctx.yield();
    // humpback bridge
    {
      const s = new THREE.Shape(); s.moveTo(-5.4, -0.9); s.lineTo(-5.4, 0.2); s.quadraticCurveTo(0, 5.0, 5.4, 0.2); s.lineTo(5.4, -0.9); s.lineTo(2.9, -0.9); s.quadraticCurveTo(0, 3.6, -2.9, -0.9); s.lineTo(-5.4, -0.9);
      const ex = new THREE.ExtrudeGeometry(s, { depth: 3.2, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 1, curveSegments: 10 }); ex.translate(0, 0, -1.6);
      const G = [prep(ex, { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(Math.abs(z) > 1.65 ? C.cobalt : C.pool, Math.abs(z) > 1.65 ? smoothstep(1.2, 0.2, Math.abs(y - 1.2 + x * x * 0.05)) * 0.8 : 0.25) })];
      for (const sz of [-1.55, 1.55]) {
        const rp = []; for (let k = 0; k <= 8; k++) { const x = -5.2 + k * 1.3; rp.push([x, 3.35 - x * x * 0.087, sz]); }
        G.push(prep(tube(rp, 0.08, 16, 5), { col: C.gold, mat: 1 }));
        for (let k = 0; k <= 8; k += 2) { const x = -5.2 + k * 1.3, y = 3.35 - x * x * 0.087; G.push(prep(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 5), { col: C.gold, mat: 1, m: place(x, y - 0.45, sz) })); }
      }
      const g = wobble(mergeGeometries(G), noise, 0.05); g.applyMatrix4(place(bridge.x, 0, bridge.z, bridge.a)); VG.push(g);
    }
    await ctx.yield();
    // lamp posts with glass globes, picket fences, gateposts with tin robins on springs
    const lampAt = [], pineAt = [];
    {
      const lamp = mergeGeometries([glazedLathe([[0.3, -0.3], [0.34, 0.2], [0.16, 0.5], [0.12, 3.6], [0.24, 3.75], [0.1, 3.9]], 7, C.white, C.cobalt),
        prep(new THREE.SphereGeometry(0.5, 10, 7), { col: C.lamp.clone().multiplyScalar(1.25), mat: 3, m: place(0, 4.38, 0) }), ball(0.14, 0, 4.95, 0)]);
      const lampM = [], picketM = [], postM = [], robinM = [], robinPh = [];
      const picket = mergeGeometries([prep(new THREE.BoxGeometry(0.2, 1.0, 0.07), { col: wallCol(), m: place(0, 0.45, 0) }), prep(new THREE.CylinderGeometry(0.0, 0.14, 0.26, 4), { col: C.cobalt, m: place(0, 1.08, 0, Math.PI / 4, 0, 0, 1, 1, 0.5) })]);
      const post = mergeGeometries([glazedLathe([[0.26, -0.3], [0.28, 0.15], [0.18, 0.35], [0.2, 1.25], [0.3, 1.38], [0.12, 1.5]], 7, C.white, C.cobalt)]);
      const bob = { kind: 1, amp: 0.13, phase: 0 };
      const robin = mergeGeometries([
        prep(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 4), { col: C.gold, mat: 1, kind: 1, amp: (x, y) => 0.13 * (y + 0.21) / 0.42, m: place(0, 1.7, 0) }),
        prep(new THREE.SphereGeometry(0.34, 9, 7), { col: (x, y, z, u, v, out) => out.copy(z > 0.02 && y < 0.2 ? C.red : y > 0.12 ? C.cobalt : C.white), ...bob, m: place(0, 2.15, 0, 0, -0.3, 0, 0.9, 0.95, 1.15) }),
        prep(new THREE.SphereGeometry(0.21, 8, 6), { col: (x, y, z, u, v, out) => out.copy(z > 0.06 && y < 0.05 ? C.red : C.cobalt), ...bob, m: place(0, 2.52, 0.22) }),
        prep(new THREE.ConeGeometry(0.06, 0.2, 5), { col: C.gold, mat: 1, ...bob, m: place(0, 2.5, 0.48, 0, Math.PI / 2) }),
        prep(new THREE.BoxGeometry(0.22, 0.05, 0.5), { col: C.cobalt, ...bob, m: place(0, 2.12, -0.5, 0, 0.5) }),
      ]);
      const nRobin = Math.round(40 * density);
      const along = (a, r, ry) => { const x = Math.sin(a) * r, z = Math.cos(a) * r; return [x, hillAt(x, z), z, ry ?? a]; };
      const okSpot = (x, z, m) => clearOf(x, 3, z, m) && padFree(x, z, 0.3) && chanDist(x, z) > 4.5 && Math.hypot(x, z) > 38.5;
      await ctx.yield();
      for (let a = a0 + 1.0, k = 0; a < 5.95; a += 0.115, k++) {
        if (k % 6 === 5) await ctx.yield();
        const side = k % 2 ? 1 : -1, [x, y, z] = along(a, rs + side * 7.4);
        if (k % 3 === 0 && okSpot(x, z, 6.5)) lampM.push(place(x, y, z, 0, 0, 0, 1.15));
        // fence runs on both sides, broken by gates whose posts carry the robins
        for (const sd of [-1, 1]) {
          const gate = (k + (sd > 0 ? 2 : 0)) % 4 === 0, rr = rs + sd * 8.3;
          for (let j = 0; j < 5; j++) {
            const aj = a + j * 0.023, [fx, fy, fz] = along(aj, rr);
            if (!okSpot(fx, fz, 7)) continue;
            if (gate && (j === 0 || j === 4)) { postM.push(place(fx, fy, fz, aj)); if (robinM.length < nRobin) { robinM.push(place(fx, fy, fz, aj + (sd > 0 ? Math.PI : 0) + rng.range(-0.6, 0.6))); robinPh.push(rng() * TAU); } }
            else if (!gate) { picketM.push(place(fx, fy, fz, aj)); const [gx, gy, gz] = along(aj + 0.0115, rr); picketM.push(place(gx, gy, gz, aj)); }
          }
        }
      }
      for (let k = 0; k < 10; k++) { const a = ab + (k + 0.5) / 10 * TAU, x = band.x + Math.sin(a) * 8, z = band.z + Math.cos(a) * 8; if (okSpot(x, z, 7)) { const y = hillAt(x, z); if (k % 2) lampM.push(place(x, y, z)); else { postM.push(place(x, y, z)); robinM.push(place(x, y, z, a + Math.PI)); robinPh.push(rng() * TAU); } } }
      for (const s of [-1, 1]) for (const e of [-6.6, 6.6]) { const x = bridge.x + Math.cos(bridge.a) * e + Math.sin(bridge.a) * s * 2.3, z = bridge.z - Math.sin(bridge.a) * e + Math.cos(bridge.a) * s * 2.3; if (clearOf(x, 4, z, 6)) lampM.push(place(x, hillAt(x, z), z)); }
      await ctx.yield();
      if (lampM.length) VG.push(instances(lamp, lampM));
      for (const m of lampM) lampAt.push([m.elements[12], m.elements[13] + 4.4 * (m.elements[0] > 1.1 ? 1.15 : 1), m.elements[14]]);
      await ctx.yield();
      for (let i = 0; i < picketM.length; i += 120) { VG.push(instances(picket, picketM.slice(i, i + 120))); await ctx.yield(); }
      if (postM.length) VG.push(instances(post, postM));
      await ctx.yield();
      if (robinM.length) VG.push(instances(robin, robinM, (out, n) => { const fx = out.attributes.aFx.array; for (let i = 0; i < robinM.length; i++) for (let k = 0; k < n; k++) fx[(i * n + k) * 4 + 2] = robinPh[i]; }));
      for (const g of [lamp, picket, post, robin]) g.dispose();
    }
    await ctx.yield();
    // sleigh tracks down the main street: two pairs of blue grooves painted on the snow under the lens
    const streetR = (a) => { const kn = [[a0 + 0.9, 48.5], [a0 + 1.3, rs], [4.7, rs], [5.15, rs + 1], [5.6, rs + 4], [6.0, 60]]; let i = 0; while (i < kn.length - 2 && a > kn[i + 1][0]) i++; return lerp(kn[i][1], kn[i + 1][1], smoothstep(kn[i][0], kn[i + 1][0], a)); };
    {
      const P = [], hw = 0.17;
      const rail = (wig, off, aA, aB) => {
        let prev = null;
        for (let a = aA; a <= aB; a += 0.016) {
          const r = streetR(a) + wig(a) + off, x = Math.sin(a) * r, z = Math.cos(a) * r, sx = Math.sin(a), cz = Math.cos(a);
          let cur = null;
          if (padFree(x, z, 0.6) && chanDist(x, z) > 4.5) { const y = hillAt(x, z) + 0.1; cur = [sx * (r - hw), y, cz * (r - hw), sx * (r + hw), y, cz * (r + hw)]; }
          if (prev && cur) P.push(prev[0], prev[1], prev[2], prev[3], prev[4], prev[5], cur[0], cur[1], cur[2], prev[3], prev[4], prev[5], cur[3], cur[4], cur[5], cur[0], cur[1], cur[2]);
          prev = cur;
        }
      };
      for (const o of [-0.72, 0.72]) { rail((a) => 0.4 + 1.3 * Math.sin(a * 2.1 + 0.6), o, a0 + 1.12, 5.9); await ctx.yield(); rail((a) => -0.7 + 2.5 * Math.sin(a * 1.3 + 2.2), o, a0 + 1.45, 5.62); await ctx.yield(); }
      const tg = new THREE.BufferGeometry(), nn = new Float32Array(P.length); for (let i = 1; i < nn.length; i += 3) nn[i] = 1;
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); tg.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
      if (P.length) VG.push(prep(tg, { col: C.sky.clone().lerp(C.cobalt, 0.42) }));
    }
    await ctx.yield();
    const village = new THREE.Mesh(mergeGeometries(VG), glaze); village.frustumCulled = false; scene.add(village);
    for (const g of VG) g.dispose();
    await ctx.yield();

    await ctx.yield();
    // ---- windmill sails, driven by the current
    const sails = (() => {
      const G = [];
      for (let k = 0; k < 4; k++) {
        const R = place(0, 0, 0, 0, 0, k * Math.PI / 2);
        G.push(prep(new THREE.BoxGeometry(0.22, 7.6, 0.22), { col: C.cobalt, m: R.clone().multiply(place(0, 4.0, 0)) }));
        G.push(prep(new THREE.PlaneGeometry(1.8, 5.8, 1, 3), { col: C.white, row: 2, rep: 0.14, vrep: 3, m: R.clone().multiply(place(1.02, 4.8, 0.06, 0, 0, 0.05)) }));
        for (const y of [1.95, 7.7]) G.push(prep(new THREE.BoxGeometry(1.9, 0.12, 0.12), { col: C.gold, mat: 1, m: R.clone().multiply(place(1.0, y, 0.06)) }));
      }
      G.push(prep(new THREE.ConeGeometry(0.55, 1.0, 10), { col: C.gold, mat: 1, m: place(0, 0, 0.35, 0, Math.PI / 2) }));
      const m = new THREE.Mesh(mergeGeometries(G), glaze); for (const g of G) g.dispose();
      m.position.set(mill.x - Math.sin(aw) * 3.75, mill.y + 11.0, mill.z - Math.cos(aw) * 3.75); m.rotation.order = 'YXZ'; m.rotation.y = aw + Math.PI; m.frustumCulled = false; scene.add(m);
      return m;
    })();
    await ctx.yield();
    // weathercocks on every third roof
    const cockGeo = (() => {
      const G = [prep(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5), { col: C.gold, mat: 1, m: place(0, 0.75, 0) })];
      const ar = new THREE.BoxGeometry(1.8, 0.07, 0.07); G.push(prep(ar, { col: C.gold, mat: 1, m: place(0, 1.0, 0) }));
      G.push(prep(new THREE.ConeGeometry(0.16, 0.42, 4), { col: C.gold, mat: 1, m: place(1.05, 1.0, 0, 0, 0, -Math.PI / 2) }));
      G.push(prep(new THREE.BoxGeometry(0.5, 0.42, 0.04), { col: C.gold, mat: 1, m: place(-0.8, 1.0, 0) }));
      G.push(prep(new THREE.SphereGeometry(0.3, 8, 6), { col: C.gold, mat: 1, m: place(0, 1.72, 0, 0, 0, 0, 1.25, 1, 0.3) }));
      G.push(prep(new THREE.SphereGeometry(0.15, 6, 5), { col: C.gold, mat: 1, m: place(0.38, 2.02, 0, 0, 0, 0, 1, 1, 0.4) }));
      G.push(prep(new THREE.SphereGeometry(0.3, 7, 5), { col: C.gold, mat: 1, m: place(-0.42, 1.98, 0, 0, 0, 0.6, 0.6, 1.1, 0.2) }));
      G.push(prep(new THREE.SphereGeometry(0.09, 5, 4), { col: C.red, m: place(0.42, 2.2, 0) }));
      const g = mergeGeometries(G); for (const x of G) x.dispose(); return g;
    })();
    const cockMeshes = cocks.slice(0, 10).map((p, i) => { const m = new THREE.Mesh(cockGeo, glaze); m.position.copy(p); m.userData = { base: Math.atan2(p.z, -p.x) + Math.PI, k: 0.6 + 0.8 * rng(), ph: i * 1.7 }; scene.add(m); return m; });
    if (!cockMeshes.length) cockGeo.dispose();

    // ---- 600 bottle-brush pines: a ridge along the rim and clumps among the houses
    {
      const G = [prep(new THREE.CylinderGeometry(0.009, 0.015, 0.26, 5), { col: new THREE.Color('#3a2a20'), phase: -1, m: place(0, 0.13, 0) })];   // a twisted brown wire
      // six bristled tiers, closer together toward the tip. Each is a flared skirt (steep at the wire, spreading to a drooping, scalloped rim) that stands
      // well clear of the tier above it, so the tree is a stack of brushes from the side and a rosette of rings from above
      const pineGreen = C.green.clone().lerp(new THREE.Color('#2f8a58'), 0.6);      // the brief's pine green, lifted so it still reads green in blue shade
      const NS = 12, tierY = [0.13, 0.3, 0.47, 0.63, 0.78, 0.92], tierR = [0.19, 0.165, 0.14, 0.113, 0.083, 0.052], tierH = [0.27, 0.27, 0.27, 0.25, 0.22, 0.16];
      for (let k = 0; k < 6; k++) {
        const R = tierR[k], h = tierH[k], cg = new THREE.ConeGeometry(R, h, NS, 2, true), p = cg.attributes.position, nr = cg.attributes.normal;
        const midR = 0.36 * R, midY = -0.1 * h;                       // the knee of the skirt
        for (let i = 0; i < p.count; i++) {
          const col = i % (NS + 1), row = Math.floor(i / (NS + 1)), a = col / NS * TAU, odd = col % 2 === 1;
          const r = row === 0 ? 0 : row === 1 ? midR * (odd ? 0.92 : 1.08) : R * (odd ? 1.12 : 0.9);
          const y = row === 0 ? h / 2 : row === 1 ? midY : -h / 2 + (odd ? -0.16 * h : 0.05 * h);
          // normals of the bell: steep near the wire, nearly facing up along the spread of the skirt
          const dr = row < 1 ? midR : R - midR, dy = row < 1 ? h / 2 - midY : (row === 1 ? 0.72 : 0.5) * (midY + h / 2), l = Math.hypot(dr, dy);
          p.setXYZ(i, Math.sin(a) * r, y, Math.cos(a) * r); nr.setXYZ(i, Math.sin(a) * dy / l, dr / l, Math.cos(a) * dy / l);
        }
        // aFx.y = 0 at the wire .. 0.5 at the knee .. 1 at the rim, aFx.z = tier: the fragment shader paints the bristles and the white glaze lip from them
        G.push(prep(cg, { col: (x, y, z, u, v, out) => out.copy(pineGreen).multiplyScalar(1.5 + 0.9 * Math.min(1, Math.hypot(x, z) / R)), amp: (x, y) => (y < -h * 0.4 ? 1 : y < h * 0.25 ? 0.5 : 0), phase: k, m: place(0, tierY[k] + h / 2, 0, k * 0.7) }));
      }
      const pineGeo = mergeGeometries(G); for (const g of G) g.dispose();
      await ctx.yield();
      const want = Math.round(600 * density), M = [], tr = [];
      const tryPine = (a, r, H, R = rng, fat = 1) => {
        const x = Math.sin(a) * r, z = Math.cos(a) * r, y = hillAt(x, z);
        if (!padFree(x, z, 1.6) || chanDist(x, z) < 3.2) return;
        if (!clearOf(x, y + H, z, 4.6) || !clearOf(x, y + H * 0.55, z, 5.2 + H * 0.12) || !clearOf(x, y + 1, z, 6)) return;
        if (Math.hypot(r, y + H - 20) > 76.5 || pts[0].distanceTo(_v.set(x, y + H, z)) < 17) return;
        const pm = place(x, y - 0.2, z, R() * TAU, 0, 0, H * fat * R.range(0.9, 1.15), H, H * fat * R.range(0.9, 1.15)), t0 = R(), t1 = R.range(0.75, 1.2);
        nPine++;
        if (Math.hypot(x - great.x, z - great.z) < 7.2) return;                     // (the great fir stands here; the draws above are made all the same)
        M.push(pm); tr.push(t0, t1); pineAt.push([x, z, H, 0.2 * H * fat]);
      };
      let nPine = 0;
      const _v = new THREE.Vector3();
      for (let k = 0; k < 4000 && nPine < want * 0.66; k++) { if ((k & 127) === 127) await ctx.yield(); const a = rng() * TAU, r = rng.range(61, 73.5); if (noise.n2(Math.sin(a) * 4, Math.cos(a) * 4 + 9) > -0.45) tryPine(a, r, rng.range(8, 14)); }
      for (let k = 0; k < 6000 && nPine < want; k++) { if ((k & 127) === 127) await ctx.yield(); const a = rng() * TAU, r = rng.range(38.5, 61); if (Math.abs(r - rs) < 15.5 && path.nearestXZ(Math.sin(a) * r, Math.cos(a) * r).dist < 15.5 && rng() < 0.85) continue; if (noise.n2(Math.sin(a) * r * 0.06 + 20, Math.cos(a) * r * 0.06) > -0.1) tryPine(a, r, rng.range(6.5, 11.5)); }
      // a rank of tall pines below the reveal, their tips crossing the bottom of the frame as the lens looks out through the glass
      for (let k = 0; k < 200; k++) {
        const a = 6.38 + rx.range(-0.5, 0.5), r = rx.range(69.5, 75.6), x = Math.sin(a) * r, z = Math.cos(a) * r;
        tryPine(a, r, clamp((path.nearestXZ(x, z).y + 2.4 - 5.6 * Math.pow(rx(), 1.4) - hillAt(x, z)) / 1.07, 7.5, 19.5), rx, 1.35);
        if ((k & 31) === 31) await ctx.yield();
      }
      const pines = new THREE.InstancedMesh(pineGeo, hero.kit.mat(PINE_VERT, hero.kit.GLAZE_FRAG, { defines: { PINE: '' } }), M.length);
      await ctx.yield();
      M.forEach((m, i) => pines.setMatrixAt(i, m));
      pineGeo.setAttribute('aTree', new THREE.InstancedBufferAttribute(new Float32Array(tr), 2));
      pines.frustumCulled = false; scene.add(pines);
    }
    await ctx.yield();

    // ---- other sleighs shaken loose, adrift in the current with their ribbons streaming
    const sleighs = (() => {
      const sh = new THREE.Shape(); sh.moveTo(-1.5, 0.3); sh.lineTo(0.9, 0.3); sh.quadraticCurveTo(1.95, 0.35, 1.78, 1.25); sh.quadraticCurveTo(1.72, 1.6, 1.4, 1.45); sh.quadraticCurveTo(1.6, 0.85, 0.9, 0.8);
      sh.lineTo(-0.9, 0.8); sh.lineTo(-1.45, 1.78); sh.lineTo(-1.72, 1.72); sh.lineTo(-1.5, 0.3);
      const ex = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 1, curveSegments: 6 }); ex.translate(0, 0, -0.6);
      const G = [prep(ex, { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, clamp(0.5 - y * 0.4, 0, 0.45)).lerp(C.cobalt, Math.max(smoothstep(0.95, 1.1, y), Math.abs(z) > 0.62 ? smoothstep(0.25, 0.08, Math.abs(Math.sin(x * 3.2 + y * 2.0))) : 0) * 0.9), row: 0, rep: 0.14, vrep: 0.62 })];   // vine scrollwork on the hull
      for (const s of [-0.55, 0.55]) {
        G.push(prep(tube([[-1.7, 0, s], [-0.4, -0.02, s], [1.2, 0, s], [1.9, 0.35, s], [1.95, 0.9, s], [1.7, 1.05, s]], 0.065, 14, 5), { col: C.gold, mat: 1 }));
        for (const x of [-1.0, 0.6]) G.push(prep(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 5), { col: C.gold, mat: 1, m: place(x, 0.16, s) }));
      }
      G.push(ball(0.16, 1.6, 1.62, 0));
      // seen from below it is still a painted thing: a vine panel under the hull, two gilt cross-bars between the runners
      const under = new THREE.PlaneGeometry(2.3, 1.06, 6, 2); under.rotateX(Math.PI / 2);
      G.push(prep(under, { col: (x, y, z, u, v, out) => out.copy(C.white).lerp(C.pool, 0.35), row: 0, rep: 0.5, m: place(-0.3, 0.215, 0) }));
      for (const x of [-1.0, 0.6]) { const bar = new THREE.CylinderGeometry(0.05, 0.05, 1.1, 5); bar.rotateX(Math.PI / 2); G.push(prep(bar, { col: C.gold, mat: 1, m: place(x, 0.02, 0) })); }
      const body = mergeGeometries(G); for (const g of G) g.dispose(); body.applyMatrix4(place(0, 0, 0, -Math.PI / 2));
      // (polish 2) the ribbon is a streaming pennant, not a bar: it tapers to a swallow tail, rises and falls along its
      // length, twists, and is shaded from a deep red hem to a gilt tip
      const rib = new THREE.PlaneGeometry(3.6, 0.52, 16, 2), rp = rib.attributes.position, redDeep = C.red.clone().multiplyScalar(0.5);
      for (let i = 0; i < rp.count; i++) {
        const x = rp.getX(i), y0 = rp.getY(i), t = (x + 1.8) / 3.6;
        rp.setXYZ(i, x - (t > 0.97 && Math.abs(y0) < 0.1 ? 0.55 : 0), y0 * (1 - 0.45 * t) + 0.34 * Math.sin(t * 8.5) * t, 0.22 * Math.sin(t * 6.0 + 1.0) * t);
      }
      rib.computeVertexNormals();
      const ribbon = prep(rib, { col: (x, y, z, u, v, out) => { const t = (x + 1.8) / 3.6; out.copy(redDeep).lerp(C.red, clamp(0.25 + v * 0.9, 0, 1)).lerp(C.gold, smoothstep(0.86, 1.0, t) * 0.85); }, kind: 3, phase: 0, amp: (x) => { const t = (x + 1.8) / 3.6; return 0.6 * t * t; } });
      ribbon.applyMatrix4(place(0, 1.72, -1.7 - 1.8, Math.PI / 2));
      const geo = mergeGeometries([body, ribbon]); body.dispose(); ribbon.dispose();
      const list = [], n = Math.round(8 * density);
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(geo, glaze); m.rotation.order = 'YXZ'; m.scale.setScalar(rng.range(1.25, 1.7));
        const sy = 20 + 15 * (i + rng()) / Math.max(n, 1);                   // never in the eye's exit cone
        m.userData = { sc: m.scale.x, r: rng.range(32.5, 37), y: sy, ph: i / n * TAU + rng.range(-0.3, 0.3), k: rng.range(0.8, 1.2), w: rng() * TAU };
        m.frustumCulled = false; scene.add(m); list.push(m);
      }
      if (!n) geo.dispose();
      return list;
    })();

    await ctx.yield();
    // ---- shaken loose from the crown and caught in the eye's updraft: glass and cobalt stars and a few geese, turning
    // slowly round the last straight run up to the bubble (local +Y = the run's direction, origin at the portal seat)
    const column = await (async () => {
      const { starGeo, goose } = hero.kit, HK = hero.kit.K, G = [];
      const starTpl = (col, mt) => mergeGeometries([prep(starGeo(HK.starPoints, 1.05, 0.25), { col, mat: mt, flat: true }), ball(0.2, 0, 0, 0),
        prep(new THREE.TorusGeometry(0.16, 0.04, 4, 8), { col: C.gold, mat: 1, m: place(0, 1.2, 0) })]);
      const tplA = starTpl(C.sky.clone().lerp(C.glass, 0.35), 2);
      await ctx.yield();
      const tplB = starTpl((x, y, z, u, v, out) => out.copy(C.white).lerp(C.cobalt, smoothstep(0.02, 0.3, Math.hypot(x, y, z)) * 0.96).lerp(C.deep, 0.25), 0);
      const tpls = [tplA, tplB], mats = [[], []], phs = [[], []], NST = 26;
      await ctx.yield();
      // (cure) the column turns about the run's axis, so each star sweeps a ring about it, and the lens comes in to the run
      // from the side: a star whose ring the route passes close by is across the lens whenever the turn brings it round
      // (which turn that is depends on how long the clock has run, and a visitor arrives with it running). So a star drawn
      // lower than 36 m below the mirror (the run is 39 m) stands nearer the mirror, a quarter metre at a time, until the
      // ring it sweeps is 5.5 m from the route (the foot's stars keep the same distance from the lens's line)
      const routeKR = [], rP = new THREE.Vector3();
      for (let j = 0; j <= 300; j++) { path.pointAt(0.8 + 0.2 * j / 300, rP); rP.sub(seat); const a = rP.dot(seatDir); routeKR.push(-a, Math.sqrt(Math.max(0, rP.lengthSq() - a * a))); }
      const ringClear = (k, rho) => { let m = 1e9; for (let j = 0; j < routeKR.length; j += 2) m = Math.min(m, Math.hypot(routeKR[j] - k, routeKR[j + 1] - rho)); return m; };
      for (let i = 0; i < NST; i++) {
        const k0 = 8.5 + (LINE - 1.5) * (i + rx()) / NST, rho = (k0 < 13 || k0 > LINE - 3 ? 6.9 : 4.9) + 2.5 * rx(), phi = i * 2.399 + rx.range(-0.3, 0.3), v = i % 3 === 1 ? 1 : 0;
        let k = k0; while (k > LINE - 3 && ringClear(k, rho) < 5.5) k -= 0.25;
        mats[v].push(place(Math.cos(phi) * rho, -k, Math.sin(phi) * rho, rx() * TAU, rx.range(-0.5, 0.5), rx.range(-0.5, 0.5), rx.range(0.85, 1.35)));
        phs[v].push(rx() * TAU);
      }
      // (polish) the foot of the column: stars and geese loose between the spire's tip and the straight run, bobbing where
      // the last turn of the climb looks up through them at the mirror (none within 5.5 m of the lens's line)
      const RG = [], rm = [[], []], rp = [[], []], A0 = new THREE.Vector3(0, 43, 2), B0 = new THREE.Vector3(0, 58, -17.5), cP = new THREE.Vector3();
      for (let i = 0; i < 30; i++) {
        const t = (i + rx()) / 30, phi = i * 2.399, rho = 2.5 + 6.5 * rx(), v = i % 3 === 1 ? 1 : 0, sc = rx.range(0.9, 1.5), r1 = rx() * TAU, r2 = rx.range(-0.5, 0.5), ph = rx() * TAU;
        cP.lerpVectors(A0, B0, t); cP.x += Math.cos(phi) * rho; cP.z += Math.sin(phi) * rho; cP.y += Math.sin(phi * 1.7) * 2.2;
        if (path.distanceTo(cP.x, cP.y, cP.z) < 5.5 || Math.hypot(cP.x, cP.y - 41, cP.z) < 3) continue;
        rm[v].push(place(cP.x, cP.y, cP.z, r1, r2, 0.3, sc)); rp[v].push(ph);
      }
      await ctx.yield();
      for (let v = 0; v < 2; v++) {
        G.push(instances(tpls[v], mats[v], (out, n) => { const fx = out.attributes.aFx.array; for (let i = 0; i < mats[v].length; i++) for (let j = 0; j < n; j++) { const q = (i * n + j) * 4; fx[q + 1] = 0.45; fx[q + 2] = phs[v][i]; fx[q + 3] = 0; } }));
        await ctx.yield();
      }
      const gs = goose(), gm = [], gp = [];
      // (cure) the column's own geese sweep rings about the run's axis as its stars do, and a goose is wide: no point of one,
      // its wings at the top and the bottom of their beat (the beat runs along the axis), comes within 5.5 m of the route's
      // line (the skein's rule). A goose whose rings are nearer stands further out from the axis, a quarter metre at a time
      // (at most 10 m: never neared)
      const gq = gs.attributes.position, gfx = gs.attributes.aFx.array, gv = new THREE.Vector3();
      const gooseOff = (m) => {
        let e = 1e18;
        for (let i = 0; i < gq.count; i++) {
          gv.set(gq.getX(i), gq.getY(i), gq.getZ(i)).applyMatrix4(m); const kv = -gv.y, rv = Math.hypot(gv.x, gv.z), beat = Math.abs(gfx[i * 4 + 1]);
          for (let j = 0; j < routeKR.length; j += 2) { const dk = Math.abs(routeKR[j] - kv) - beat; if (dk > 8) continue; const dr = routeKR[j + 1] - rv, d = (dk > 0 ? dk * dk : 0) + dr * dr; if (d < e) e = d; }
        }
        return Math.sqrt(e);
      };
      await ctx.yield();
      for (let i = 0; i < 6; i++) {
        const k = 12 + (LINE - 15) * (i + 0.2 + 0.6 * rx()) / 6, rho0 = rx.range(7.2, 9.4), phi = i * 2.05 + 0.8 + rx.range(-0.3, 0.3);
        let rho = rho0, m = place(Math.cos(phi) * rho, -k, Math.sin(phi) * rho, Math.PI - phi, -0.22, 0.3, 1.3);
        await ctx.yield();
        for (let n = 0; n < 40 && gooseOff(m) < 5.5; n++) { rho += 0.25; m = place(Math.cos(phi) * rho, -k, Math.sin(phi) * rho, Math.PI - phi, -0.22, 0.3, 1.3); }
        gm.push(m); gp.push(rx() * TAU);
      }
      G.push(instances(gs, gm, (out, n) => { const fx = out.attributes.aFx.array; for (let i = 0; i < gm.length; i++) for (let j = 0; j < n; j++) fx[(i * n + j) * 4 + 2] = gp[i]; }));
      await ctx.yield();
      {
        const hm = [], hp = [];
        for (let i = 0; i < 7; i++) {
          const t = (i + 0.5) / 7, phi = i * 2.2 + 0.6, rho = 6.5 + 3 * rx(), sc = rx.range(1.4, 1.8), ph = rx() * TAU;
          cP.lerpVectors(A0, B0, t); cP.x += Math.cos(phi) * rho; cP.z += Math.sin(phi) * rho; cP.y += 1.5 + Math.sin(phi * 1.3) * 2;
          if (path.distanceTo(cP.x, cP.y, cP.z) < 6.5) continue;
          hm.push(place(cP.x, cP.y, cP.z, Math.PI * 1.5 - phi, -0.45, 0.25, sc)); hp.push(ph);
        }
        await ctx.yield();
        // (cure) the column turns and the foot stands where it was put, so a goose of the column, which sweeps a ring about
        // the run's axis (its wings' beat runs along the axis), goes through a star or a goose of the foot that stands in
        // that ring whenever the turn brings it round. A foot body whose own ring (with its bob, or its wings' beat) meets
        // the ring of one of the column's six geese therefore stands off: at the nearest place, a tenth of a metre at a
        // time to 6 m and twelve ways round in the plane of the axis and the body's own radius (of several equally near,
        // the one nearest the foot's own line), where its ring is clear of all six, it keeps the foot's own distances from
        // the route (5.5 m a star, 6.5 m a goose) and from the spire's tip, and it is no nearer another foot body than it
        // was or than their two reaches together; a body with no such place within 6 m stays. The column's stars are not
        // asked: a star through a star is not told apart in the swarm.
        // How a ring is taken: the geese's rings are marked on a grid of 0.05 m (k down the axis, r out from it) from
        // points every 0.05 m of every face over the whole of the beat, and every cell within 2 m of them is given its
        // distance to the nearest marked one; a foot body is asked face by face, each face and its bob halved until a
        // piece is surely clear of the rings or is smaller than 0.015 m. So a body that touches a ring is never called
        // clear, and one that is called in a ring is within a quarter of a metre of it.
        {
          const CELL = 0.05, STEP = 0.05, KN = 1040, RN = 640, PAD = 40, TOL = 0.015, MISS = STEP / Math.sqrt(3) + CELL / 2, DEEP = 48, R2 = Math.SQRT2, D = new Float32Array(KN * RN).fill(1e9);
          let k0 = KN, k1 = -1, r0 = RN, r1 = -1;   // (the cells the rings are marked in: from k0 to k1 and r0 to r1; MISS: how far a point of a goose can be from the nearest laid point's run, the beat's ends included)
          const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), seatDir), qi = q0.clone().invert(), up = new THREE.Vector3(0, 1, 0).applyQuaternion(qi);
          const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), mc = new THREE.Matrix4(), mt = new THREE.Matrix4();
          const beat = (i) => Math.abs(gfx[i * 4 + 1]), bob = () => 0.45;
          const mark = (m, from, to) => {   // some faces of one goose of the column, which stands in the column's own frame already
            for (let t = from; t < to; t += 3) {
              va.fromBufferAttribute(gq, t).applyMatrix4(m); vb.fromBufferAttribute(gq, t + 1).applyMatrix4(m); vc.fromBufferAttribute(gq, t + 2).applyMatrix4(m);
              const n = Math.max(1, Math.ceil(Math.max(va.distanceTo(vb), vb.distanceTo(vc), vc.distanceTo(va)) / STEP)), a0 = beat(t), a1 = beat(t + 1), a2 = beat(t + 2);
              for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
                const a = i / n, b = j / n, c = 1 - a - b, y = a * va.y + b * vb.y + c * vc.y, e = a * a0 + b * a1 + c * a2, ri = Math.floor(Math.hypot(a * va.x + b * vb.x + c * vc.x, a * va.z + b * vb.z + c * vc.z) / CELL);
                const ka = Math.max(0, Math.floor((-y - e) / CELL)), kb = Math.min(KN - 1, Math.floor((-y + e) / CELL));   // (the beat's whole run of cells at this r)
                if (ri < RN && ka <= kb) { D.fill(0, ri * KN + ka, ri * KN + kb + 1); if (ka < k0) k0 = ka; if (kb > k1) k1 = kb; if (ri < r0) r0 = ri; if (ri > r1) r1 = ri; }
              }
            }
          };
          for (const m of gm) for (let t = 0; t < gq.count; t += 300) { mark(m, t, Math.min(gq.count, t + 300)); await ctx.yield(); }   // (a hundred faces at a time)
          // every cell's distance to the nearest marked cell, in cells, by steps to its eight neighbours (1 and root 2): never
          // less than the straight distance and at most 1.0824 times it; taken 2 m round the marked cells and no further
          k0 = Math.max(0, k0 - PAD); k1 = Math.min(KN - 1, k1 + PAD); r0 = Math.max(0, r0 - PAD); r1 = Math.min(RN - 1, r1 + PAD);
          const down = (ra, rb) => {
            for (let r = ra; r <= rb; r++) for (let k = k0, i = r * KN + k0; k <= k1; k++, i++) {
              let v = D[i]; if (k > k0 && D[i - 1] + 1 < v) v = D[i - 1] + 1;
              if (r > r0) { if (D[i - KN] + 1 < v) v = D[i - KN] + 1; if (k > k0 && D[i - KN - 1] + R2 < v) v = D[i - KN - 1] + R2; if (k < k1 && D[i - KN + 1] + R2 < v) v = D[i - KN + 1] + R2; }
              D[i] = v;
            }
          };
          const back = (ra, rb) => {
            for (let r = rb; r >= ra; r--) for (let k = k1, i = r * KN + k1; k >= k0; k--, i--) {
              let v = D[i]; if (k < k1 && D[i + 1] + 1 < v) v = D[i + 1] + 1;
              if (r < r1) { if (D[i + KN] + 1 < v) v = D[i + KN] + 1; if (k < k1 && D[i + KN + 1] + R2 < v) v = D[i + KN + 1] + R2; if (k > k0 && D[i + KN - 1] + R2 < v) v = D[i + KN - 1] + R2; }
              D[i] = v;
            }
          };
          for (let r = r0; r <= r1; r += 64) { down(r, Math.min(r1, r + 63)); await ctx.yield(); }
          for (let r = r1; r >= r0; r -= 64) { back(Math.max(r0, r - 63), r); await ctx.yield(); }
          // a point of the column's frame is no nearer any goose's ring than this (metres; a point outside those cells is taken at their edge, which is nearer)
          const clearBy = (x, y, z) => CELL * (D[Math.min(r1, Math.max(r0, Math.floor(Math.hypot(x, z) / CELL))) * KN + Math.min(k1, Math.max(k0, Math.floor(-y / CELL)))] / 1.0824 - R2) - MISS;
          // does a piece of a face (corners A, B, C, each with its bob or beat, which runs along the world's up, the foot being no
          // part of the column) between the heights s0 and s1 of that bob (-1 its lowest, 1 its highest) stand in a ring? Every
          // point of the piece is within rad of its middle; the piece is halved (its longest side, or its heights) until it is clear or small
          const hit = (ax, ay, az, aa, bx, by, bz, ba, cx, cy, cz, ca, s0, s1, deep) => {
            const gx = (ax + bx + cx) / 3, gy = (ay + by + cy) / 3, gz = (az + bz + cz) / 3, ga = (aa + ba + ca) / 3, sm = (s0 + s1) / 2, hi = Math.max(aa, ba, ca);
            const rad = Math.sqrt(Math.max((ax - gx) ** 2 + (ay - gy) ** 2 + (az - gz) ** 2, (bx - gx) ** 2 + (by - gy) ** 2 + (bz - gz) ** 2, (cx - gx) ** 2 + (cy - gy) ** 2 + (cz - gz) ** 2)) + (s1 - s0) / 2 * hi + Math.abs(sm) * (hi - Math.min(aa, ba, ca));
            if (clearBy(gx + up.x * sm * ga, gy + up.y * sm * ga, gz + up.z * sm * ga) > rad) return false;
            if (rad <= TOL || deep >= DEEP) return true;
            const ab = (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2, bc = (bx - cx) ** 2 + (by - cy) ** 2 + (bz - cz) ** 2, ca2 = (cx - ax) ** 2 + (cy - ay) ** 2 + (cz - az) ** 2, side = Math.max(ab, bc, ca2);
            if (((s1 - s0) * hi) ** 2 > side) return hit(ax, ay, az, aa, bx, by, bz, ba, cx, cy, cz, ca, s0, sm, deep + 1) || hit(ax, ay, az, aa, bx, by, bz, ba, cx, cy, cz, ca, sm, s1, deep + 1);
            if (side === ab) { const x = (ax + bx) / 2, y = (ay + by) / 2, z = (az + bz) / 2, e = (aa + ba) / 2; return hit(ax, ay, az, aa, x, y, z, e, cx, cy, cz, ca, s0, s1, deep + 1) || hit(x, y, z, e, bx, by, bz, ba, cx, cy, cz, ca, s0, s1, deep + 1); }
            if (side === bc) { const x = (bx + cx) / 2, y = (by + cy) / 2, z = (bz + cz) / 2, e = (ba + ca) / 2; return hit(ax, ay, az, aa, bx, by, bz, ba, x, y, z, e, s0, s1, deep + 1) || hit(ax, ay, az, aa, x, y, z, e, cx, cy, cz, ca, s0, s1, deep + 1); }
            const x = (cx + ax) / 2, y = (cy + ay) / 2, z = (cz + az) / 2, e = (ca + aa) / 2; return hit(ax, ay, az, aa, bx, by, bz, ba, x, y, z, e, s0, s1, deep + 1) || hit(x, y, z, e, bx, by, bz, ba, cx, cy, cz, ca, s0, s1, deep + 1);
          };
          // does a foot body, moved by (x, y, z) in the column's frame, stand in a ring? (first as one ball about its middle, then face by face)
          const meets = (b, x, y, z) => {
            if (clearBy(b.o.x + x, b.o.y + y, b.o.z + z) > b.reach + b.sway) return false;
            if (!b.F) { b.F = []; mc.makeRotationFromQuaternion(qi).multiply(mt.makeTranslation(-seat.x, -seat.y, -seat.z)).multiply(b.m); for (let i = 0; i < b.pos.count; i++) { va.fromBufferAttribute(b.pos, i).applyMatrix4(mc); b.F.push(va.x, va.y, va.z, b.amp(i)); } }
            const F = b.F;
            for (let i = 0; i < F.length; i += 12) if (hit(F[i] + x, F[i + 1] + y, F[i + 2] + z, F[i + 3], F[i + 4] + x, F[i + 5] + y, F[i + 6] + z, F[i + 7], F[i + 8] + x, F[i + 9] + y, F[i + 10] + z, F[i + 11], -1, 1, 0)) return true;
            return false;
          };
          const far = (pos) => { let r = 0; for (let i = 0; i < pos.count; i++) r = Math.max(r, va.fromBufferAttribute(pos, i).length()); return r; };
          const FB = [], AB = B0.clone().sub(A0), d = new THREE.Vector3(), pn = new THREE.Vector3(), size = (m) => Math.hypot(m.elements[0], m.elements[1], m.elements[2]);
          const foot = (m, pos, amp, sway, off, tip, f) => { const c = new THREE.Vector3().setFromMatrixPosition(m); FB.push({ m, pos, amp, sway, off, tip, reach: f * size(m), c, o: c.clone().sub(seat).applyQuaternion(qi), F: null }); };
          for (let v = 0; v < 2; v++) { const pos = tpls[v].attributes.position, f = far(pos); for (const m of rm[v]) foot(m, pos, bob, 0.45, 5.5, true, f); }
          { const f = far(gq); let w = 0; for (let i = 0; i < gq.count; i++) w = Math.max(w, beat(i)); for (const m of hm) foot(m, gq, beat, w, 6.5, false, f); }
          for (const b of FB) {
            const in0 = meets(b, 0, 0, 0); await ctx.yield();
            if (!in0) continue;
            const out = Math.hypot(b.o.x, b.o.z) || 1, ox = b.o.x / out, oz = b.o.z / out;
            let best = null;
            for (let n = 1; n <= 60 && !best; n++) {   // (60 tenths: the 6 m)
              for (let w = 0; w < 12; w++) {
                const L = n / 10, x = ox * L * Math.sin(w * Math.PI / 6), y = L * Math.cos(w * Math.PI / 6), z = oz * L * Math.sin(w * Math.PI / 6);
                pn.copy(d.set(x, y, z).applyQuaternion(q0)).add(b.c);
                if (path.distanceTo(pn.x, pn.y, pn.z) < b.off || (b.tip && Math.hypot(pn.x, pn.y - 41, pn.z) < 3)) continue;
                if (FB.some((o) => o !== b && pn.distanceTo(o.c) < Math.min(b.c.distanceTo(o.c), b.reach + o.reach) - 1e-9)) continue;
                const in1 = meets(b, x, y, z); await ctx.yield();
                if (in1) continue;
                const t = Math.max(0, Math.min(1, d.copy(pn).sub(A0).dot(AB) / AB.lengthSq())), off = d.copy(A0).addScaledVector(AB, t).distanceTo(pn);
                if (!best || off < best.off) best = { off, p: pn.clone() };
              }
              await ctx.yield();
            }
            if (best) { b.m.setPosition(best.p); b.c.copy(best.p); b.o.copy(best.p).sub(seat).applyQuaternion(qi); }
          }
        }
        for (let v = 0; v < 2; v++) {
          if (rm[v].length) RG.push(instances(tpls[v], rm[v], (out, n) => { const fx = out.attributes.aFx.array; for (let i = 0; i < rm[v].length; i++) for (let j = 0; j < n; j++) { const q = (i * n + j) * 4; fx[q + 1] = 0.45; fx[q + 2] = rp[v][i]; fx[q + 3] = 0; } }));
          tpls[v].dispose();
          await ctx.yield();
        }
        if (hm.length) RG.push(instances(gs, hm, (out, n) => { const fx = out.attributes.aFx.array; for (let i = 0; i < hm.length; i++) for (let j = 0; j < n; j++) fx[(i * n + j) * 4 + 2] = hp[i]; }));
        await ctx.yield();
        if (RG.length) { const rmesh = new THREE.Mesh(mergeGeometries(RG), glaze); for (const g of RG) g.dispose(); rmesh.frustumCulled = false; scene.add(rmesh); }
      }
      gs.dispose();
      await ctx.yield();
      const m = new THREE.Mesh(mergeGeometries(G), glaze); for (const g of G) g.dispose();
      m.position.copy(seat); m.frustumCulled = false; scene.add(m);
      m.userData.q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), seatDir);
      m.quaternion.copy(m.userData.q0);
      return m;
    })();
    await ctx.yield();

    // ---- (polish) a skein of loose geese circling the spire at the height of the last turns, and one sleigh that
    // drifts close across the lens over the pond
    const flock = await (async () => {
      const gs = hero.kit.goose(), gm = [], gp = [], n = 9;
      await ctx.yield();
      // (cure) the skein turns about the spire's axis by the clock, so each goose sweeps a level ring about it, and a visitor
      // arrives with the clock running: whichever goose the turn brings round is beside the lens as it climbs past. No point
      // of a goose comes within 5.5 m of the lens's line (the column's stars keep that distance at their centres' rings):
      // every goose whose ring is nearer, which is nearly all of them, circles closer to the spire, a quarter metre at a time
      // while it is more than 5.5 m out (a wing's tip then passes a metre and more off the spire), and then lower while it
      // is above 33 m (above the crown's rim). The geese keep their heights where they can, so the higher ones end nearest
      // the spire. (The ring test compares squares and takes one root: a hypot for each of 1501 points was a build cost.)
      const routeRY = [], rQ = new THREE.Vector3(), gpos = gs.attributes.position;
      for (let j = 0; j <= 1500; j++) { path.pointAt(j / 1500, rQ); routeRY.push(Math.hypot(rQ.x, rQ.z), rQ.y); }
      const ringOff = (r, y) => { let m = 1e18; for (let j = 0; j < routeRY.length; j += 2) { const dr = routeRY[j] - r, dy = routeRY[j + 1] - y, d = dr * dr + dy * dy; if (d < m) m = d; } return Math.sqrt(m); };
      let reach0 = 0; for (let j = 0; j < gpos.count; j++) reach0 = Math.max(reach0, Math.hypot(gpos.getX(j), gpos.getY(j), gpos.getZ(j)));
      await ctx.yield();
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + rx.range(-0.2, 0.2), r0 = 9.4 + 2.0 * rx(), y0 = 33.6 + 5.4 * ((i * 4) % n) / n + rx.range(-0.4, 0.4), sc = rx.range(1.3, 1.6);
        let r = r0, y = y0; const off = 5.5 + reach0 * sc;
        while (ringOff(r, y) < off) { if (r > 5.5) r -= 0.25; else if (y > 33) y -= 0.25; else break; }
        gm.push(place(Math.sin(a) * r, y, Math.cos(a) * r, a + Math.PI / 2, -0.08, -0.3, sc)); gp.push(rx() * TAU);
      }
      await ctx.yield();
      const g = instances(gs, gm, (out, nv) => { const fx = out.attributes.aFx.array; for (let i = 0; i < gm.length; i++) for (let j = 0; j < nv; j++) fx[(i * nv + j) * 4 + 2] = gp[i]; });
      gs.dispose();
      const m = new THREE.Mesh(g, glaze); m.frustumCulled = false; scene.add(m); return m;
    })();
    const nearSleigh = sleighs.length ? new THREE.Mesh(sleighs[0].geometry, glaze) : null;
    if (nearSleigh) { nearSleigh.rotation.order = 'YXZ'; nearSleigh.frustumCulled = false; nearSleigh.scale.setScalar(0.001); scene.add(nearSleigh); }
    await ctx.yield();

    // ---- settled glitter in the lee of every house (and the mill and bandstand)
    {
      const base = [], sd = [], per = Math.round(120 * density * detail);
      for (const h of [...houses, mill, band]) {
        await ctx.yield();
        const a = Math.atan2(h.x, h.z), tx = Math.cos(a), tz = -Math.sin(a);
        for (let k = 0; k < per; k++) {
          const al = 3.2 + 6.5 * Math.pow(rng(), 0.7), ac = rng.gauss() * 1.5 * (1.15 - al / 12), x = h.x + tx * al + Math.sin(a) * ac, z = h.z + tz * al + Math.cos(a) * ac;
          if (Math.hypot(x, z) < 38) continue;
          base.push(x, hillAt(x, z), z); sd.push(rng(), rng(), al / 9.7);
        }
      }
      await ctx.yield();
      // more drifts along the street, where the lens passes lowest: clumps of settled glitter on both verges
      for (let c = 0, nc = Math.round(70 * density); c < nc; c++) {
        const a = rx.range(a0 + 1.15, 5.9), r = streetR(a) + rx.sign() * (1.8 + 5.2 * Math.pow(rx(), 1.4)), cx = Math.sin(a) * r, cz = Math.cos(a) * r, n = rx.int(14, 30), spread = rx.range(0.7, 1.7);
        for (let k = 0; k < n; k++) {
          const x = cx + rx.gauss() * spread * 1.6 * Math.cos(a) - rx.gauss() * spread * 0.6 * Math.sin(a), z = cz - rx.gauss() * spread * 1.6 * Math.sin(a) - rx.gauss() * spread * 0.6 * Math.cos(a);
          if (Math.hypot(x, z) < 38) continue;
          base.push(x, hillAt(x, z), z); sd.push(rx(), rx(), rx() * 0.9);
        }
        if ((c & 7) === 7) await ctx.yield();
      }
      const gg = new THREE.InstancedBufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); gg.setIndex([0, 1, 2, 0, 2, 3]);
      gg.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 3)); gg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(sd), 3));
      gg.instanceCount = base.length / 3;
      const glitter = new THREE.Mesh(gg, hero.kit.mat(GLIT_VERT, GLIT_FRAG)); glitter.frustumCulled = false; scene.add(glitter);
    }
    await ctx.yield();

    // ---- (polish) warm light and long blue shadows -----------------------------------------------------------------
    // Halos round every lamp, a glow at every door, pools of lamplight on the snow, the carousel's own golden glow; and the
    // low sun's shadows laid across the village as multiplied blue strips draped on the hills.
    {
      const P = [], Kd = [], Nn = [];
      const glowAt = (x, y, z, size, k, kind = 0, nx = 0, ny = 1, nz = 0) => { P.push(x, y, z, size); Kd.push(kind, k, rx()); Nn.push(nx, ny, nz); };
      const pool = (x, z, size, k) => {
        const e = 1.2, y = hillAt(x, z), n = new THREE.Vector3(hillAt(x - e, z) - hillAt(x + e, z), 2 * e, hillAt(x, z - e) - hillAt(x, z + e)).normalize();
        if (Math.hypot(x, z) > 37.5) glowAt(x, y + 0.3, z, size, k, 1, n.x, n.y, n.z);
      };
      for (let i = 0; i < lampAt.length; i++) { const [x, y, z] = lampAt[i]; glowAt(x, y, z, 3.4, 0.5); pool(x, z, 5.5, 0.34); if (i % 12 === 11) await ctx.yield(); }
      await ctx.yield();
      for (let i = 0; i < houses.length; i++) {
        const h = houses[i]; if (i % 6 === 5) await ctx.yield();
        const fx = Math.sin(h.ry), fz = Math.cos(h.ry), d = (h.type === 3 || h.type === 4 ? 3.2 : 3.4) * h.s;
        glowAt(h.x + fx * d, h.y + 2.2 * h.s, h.z + fz * d, 4.2, 0.26);
        pool(h.x + fx * (d + 2.6), h.z + fz * (d + 2.6), 5.2, 0.4);
        pool(h.x - fx * (d + 2.4), h.z - fz * (d + 2.4), 4.2, 0.26);
      }
      await ctx.yield();
      glowAt(mill.x - Math.sin(aw) * 3.6, mill.y + 2, mill.z - Math.cos(aw) * 3.6, 4.5, 0.3);
      glowAt(great.x, great.y + great.H + 1.5, great.z, 6.5, 0.6); glowAt(great.x, great.y + 11, great.z, 17, 0.2);          // the great fir's star and its own light
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.4; pool(great.x + Math.sin(a) * 6.5, great.z + Math.cos(a) * 6.5, 7.5, 0.34); }
      glowAt(0, 15.5, 0, 30, 0.12); glowAt(0, 27, 0, 11, 0.12);                      // the carousel in its own light
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; glowAt(Math.sin(a) * 29, 1.6, Math.cos(a) * 29, 13, 0.16, 1); }   // and that light lying on the bank
      const gg = new THREE.InstancedBufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); gg.setIndex([0, 1, 2, 0, 2, 3]);
      gg.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4)); gg.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(Kd), 3));
      gg.setAttribute('aN', new THREE.InstancedBufferAttribute(new Float32Array(Nn), 3)); gg.instanceCount = P.length / 4;
      const glows = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color(1.0, 0.56, 0.2) } }, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      glows.frustumCulled = false; glows.renderOrder = 3; scene.add(glows);
      await ctx.yield();
      // shadows: from every house, the mill, the bandstand and every pine, away from the sun
      const sdx = -Math.sin(az), sdz = -Math.cos(az), stretch = Math.min(1 / Math.tan(el), 3.2), SP = [], SU = [];
      const strip = (x, z, H, w, n) => {
        const len = Math.min(H * stretch, 30), px = -sdz, pz = sdx; let prev = null;
        for (let k = 0; k <= n; k++) {
          const t = k / n, cx = x + sdx * len * t, cz = z + sdz * len * t, ww = w * (1 - 0.45 * t);
          const ax = cx + px * ww, azz = cz + pz * ww, bx = cx - px * ww, bz = cz - pz * ww;
          const cur = [ax, hillAt(ax, azz) + 0.22, azz, bx, hillAt(bx, bz) + 0.22, bz, t];
          if (Math.hypot(cx, cz) < 36.4 || Math.hypot(cx, cz) > 78) { prev = null; continue; }
          if (prev) { SP.push(prev[0], prev[1], prev[2], prev[3], prev[4], prev[5], cur[0], cur[1], cur[2], prev[3], prev[4], prev[5], cur[3], cur[4], cur[5], cur[0], cur[1], cur[2]); SU.push(-1, prev[6], 1, prev[6], -1, cur[6], 1, prev[6], 1, cur[6], -1, cur[6]); }
          prev = cur;
        }
      };
      for (let i = 0; i < houses.length; i++) { const h = houses[i]; strip(h.x, h.z, houseTop[h.type] * h.s, 3.6 * h.s, 6); if (i % 4 === 3) await ctx.yield(); }
      strip(mill.x, mill.z, 14, 3.2, 6); strip(band.x, band.z, 7, 5, 5); strip(great.x, great.z, great.H, 5.2, 7);
      await ctx.yield();
      for (let i = 0; i < pineAt.length; i++) { const [x, z, H, w] = pineAt[i]; strip(x, z, H * 0.92, w, 3); if (i % 16 === 15) await ctx.yield(); }
      await ctx.yield();
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SP), 3)); sg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(SU), 2));
      const shadows = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { uTint: { value: new THREE.Color(0.5, 0.62, 0.96) }, uK: { value: L.shK ?? (lookId === 'overcast' ? 0.5 : 0.85) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 uTint; uniform float uK; varying vec2 vUv; void main(){ float a = smoothstep(1.0, 0.45, abs(vUv.x)) * smoothstep(1.0, 0.25, vUv.y) * smoothstep(0.0, 0.06, vUv.y) * uK; gl_FragColor = vec4(mix(vec3(1.0), uTint, a), 1.0); }',
        transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      shadows.frustumCulled = false; shadows.renderOrder = 1; scene.add(shadows);
    }
    await ctx.yield();

    // ---- the glass, and the room beyond it
    const visX = -Math.sign(az || 1) * rng.range(0.34, 0.52);                 // where the visitor ends up, away from the sun
    const visCols = [['#7b6a5a', '#d6263a'], ['#8a9a55', '#f2d85c'], ['#b8642f', '#efdcc2']][visitor];
    const DU = {
      uC: { value: A.dome.center.clone() }, uSunR: { value: sunRoom.clone() }, uSunCol: { value: sunCol.clone().lerp(new THREE.Color(1, 1, 1), 0.25).multiplyScalar(L.sunK) },
      uTop: { value: new THREE.Color(L.top) }, uHor: { value: new THREE.Color(L.hor) }, uLawn: { value: new THREE.Color(L.lawn) }, uTrees: { value: new THREE.Color(L.trees) }, uHaze: { value: fogCol.clone() },
      uVisA: { value: new THREE.Color(visCols[0]) }, uVisB: { value: new THREE.Color(visCols[1]) }, uTapDir: { value: new THREE.Vector3(0.2, 0.25, 1).normalize() }, uBub: { value: seatDir.clone() }, uBubH: { value: seatDir.clone() },
      uTilt: { value: new THREE.Matrix3() }, uTime: { value: 0 }, uGrow: { value: 0.2 }, uSnow: { value: L.snow }, uThaw: { value: L.thaw }, uKind: { value: visitor },
      uLand: { value: 0 }, uHop: { value: 0 }, uCock: { value: 0 }, uPeer: { value: 0 }, uVisX: { value: visX + 0.28 * (1 - 0.3 * visitor) }, uTap: { value: 0 }, uSettle: { value: 1 }, uBok: { value: L.bok ?? 1 },
      uWinAz: { value: Math.sign(az || 1) * 0.5 }, uWinK: { value: L.winK ?? 0.8 }, uSeamY: { value: 10.5 }, uBandAz: { value: -Math.sign(az || 1) * 0.42 }, uVisDir: { value: new THREE.Vector3(visX * 0.8 * 300, 69 - 20, 300).normalize() },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(A.dome.radius, 64, 40), new THREE.ShaderMaterial({ uniforms: DU, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide }));
    dome.position.copy(A.dome.center); dome.frustumCulled = false; scene.add(dome);
    // rare: the pressure shell that races through the liquid from the tap
    let shell = null;
    if (rare) {
      shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.ShaderMaterial({
        uniforms: { uK: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: 'varying vec3 vN, vV; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'uniform float uK; varying vec3 vN, vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 4.0); gl_FragColor = vec4(vec3(0.75, 0.9, 1.1) * f * uK, 1.0); }',
      }));
      shell.position.copy(A.dome.center).addScaledVector(DU.uTapDir.value, 79); shell.scale.setScalar(0.001); shell.frustumCulled = false; scene.add(shell);
    }
    U.uWhite.value = new THREE.Color(1.1, 1.1, 1.13);     // flakes a touch brighter than the enamel
    await ctx.yield();

    // ---- scripted beats (all keyed to u)
    const uLand = uReveal - 0.115, uTap = uReveal + 0.075;
    const tiltM = new THREE.Matrix4(), bdir = new THREE.Vector3(), sunW = new THREE.Vector3(), hv = new THREE.Vector3(), ho = new THREE.Vector3(), cw = new THREE.Vector3();
    let lastTilt = 1e9, spin = rng() * TAU, wc = 0, drift = 0, colA = 0, flockA = 0;
    const nsP = new THREE.Vector3(), nsT = new THREE.Vector3();
    const colQ = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0);
    const tapPoint = shell ? shell.position.clone() : null;
    const centre = new THREE.Vector3(0, 19, 0), lowCentre = new THREE.Vector3(0, 8.5, 0), outside = new THREE.Vector3(visX * 0.8 * 300, 17 + 52 + 13, 300);
    const millTop = new THREE.Vector3(sails.position.x, sails.position.y, sails.position.z);
    const heroAt = new THREE.Vector3(), gazeK = [[uDeck - 0.06, 12], [uDeck, 14.2], [uCrown - 0.03, 29], [uCrown + 0.01, 31.5], [uOver - 0.03, 19], [uOver + 0.02, 17], [uSpire, 36], [1, 40]];
    const gazeY = (u) => { let i = 0; while (i < gazeK.length - 2 && u > gazeK[i + 1][0]) i++; return lerp(gazeK[i][1], gazeK[i + 1][1], smoothstep(gazeK[i][0], gazeK[i + 1][0], u)); };

    return {
      scene, path, duration, title: L.title,
      ride: 'sleigh', style: 'none',
      camera: { fov: 62, near: 0.3, far: 700, lookAhead: 15, sway: 0.8, bank: 0.22 },
      pois: [
        { at: centre, from: 0, to: uStreet * 0.75, weight: 0.7 },
        { at: millTop, from: uStreet - 0.09, to: uStreet + 0.02, weight: 0.3 },
        { at: outside, from: uReveal - 0.085, to: uReveal + 0.075, weight: 0.85, fade: 0.35 },
        { at: lowCentre, from: uBridge - 0.02, to: uDeck - 0.03, weight: 0.55 },
        // one gaze held on the carousel all the way up the climb: the reindeer deck at its own height, the crown whole with
        // its finial, down the spiral at the lit village, then the spire's star as the lens comes in over it
        { at: (time, u) => heroAt.set(0, gazeY(u), 0), from: uDeck - 0.06, to: uSpire + 0.02, weight: 0.82, fade: 0.2 },
        { at: seat, from: uSpire - 0.045, to: 1, weight: 0.85, fade: 0.25 },                                         // then up the eye to the mirror
      ],
      portal: { shape: 'circle', radius: 5.5, color: '#e4f2ff', glow: 0.45, tilt: true, revealDistance: 60 },
      post: {
        exposure: L.exp ?? (lookId === 'overcast' ? 0.78 : 0.79), bloom: { strength: 0.3, radius: 0.6, threshold: 1.15 },
        grade: { saturation: L.sat ?? 1.08, contrast: L.con ?? 1.04, tint: L.tint, shadowTint: '#14264a', vignette: 0.34, grain: 0.012, aberration: 0.012 },
      },
      update(dt, time, camera, u) {
        hero.setProgress(u);
        U.uEntry.value = 1 - smoothstep(0.05, 0.1, u);
        U.uOpen.value = 5.2 * smoothstep(40, 17, (1 - u) * path.length);       // the mirror stays whole, then irises open (a mirrored ring is left round the opening)
        DU.uBok.value = lerp(L.bok ?? 1, 0.5, smoothstep(0.22, 0.3, u));
        // rare: the visitor taps the glass and the settling flakes are kicked into a second blizzard
        let tapT = -1;
        if (rare) {
          tapT = (u - uTap) * duration;
          const on = tapT > 0 && tapT < 14;
          if (on) {
            const k = 0.85 * Math.exp(-tapT / 4.5) * smoothstep(0, 0.5, tapT);
            U.uS.value = Math.min(1, U.uS.value + k); U.uSwirl.value += 0.85 * 4.5 * (1 - Math.exp(-tapT / 4.5));
            hero.parts.bubble.scale.setScalar(1 + 0.05 * Math.sin(tapT * 38) * Math.exp(-tapT * 1.6));
            const x = tapT / 2.2; shell.scale.setScalar(4 + 170 * x); shell.material.uniforms.uK.value = 0.55 * smoothstep(0, 0.1, x) * (1 - smoothstep(0.5, 1, x));
          } else hero.parts.bubble.scale.setScalar(1);
          if (!(on && tapT < 2.2)) { shell.scale.setScalar(0.001); shell.material.uniforms.uK.value = 0; }
        }
        const s = U.uS.value;
        // the globe being set down: a damped swing of the room, the sun and the bubble (never the village)
        const x = clamp(u / uTilt, 0, 1);
        const th = 70 * DEG * Math.pow(0.2, x * 2.5) * Math.cos(Math.PI * x * 2.5) * (1 - smoothstep(0.8, 1, x));
        if (Math.abs(th - lastTilt) > 1e-5) {
          lastTilt = th; tiltM.makeRotationZ(th);
          hero.setBubbleDir(bdir.copy(seatDir).transformDirection(tiltM)); DU.uBub.value.copy(bdir);
          U.uSunDir.value.copy(sunW.copy(sunRoom).transformDirection(tiltM));
          DU.uTilt.value.setFromMatrix4(tiltM.makeRotationZ(-th));
        }
        hero.update(dt, time, camera);
        {   // where the lens appears on the glass from here: the ray from the eye through its underside, carried on to the dome
          const C0 = A.dome.center, R0 = A.dome.radius;
          cw.setFromMatrixPosition(camera.matrixWorld);
          hv.copy(C0).addScaledVector(DU.uBub.value, R0 - 6).sub(cw); ho.copy(cw).sub(C0);
          const qa = hv.lengthSq(), qb = 2 * ho.dot(hv), qc = ho.lengthSq() - R0 * R0, disc = qb * qb - 4 * qa * qc;
          if (qa > 1e-3 && disc > 0 && qc < 0) DU.uBubH.value.copy(ho).addScaledVector(hv, (-qb + Math.sqrt(disc)) / (2 * qa)).normalize(); else DU.uBubH.value.copy(DU.uBub.value);
        }
        // the visitor beyond the glass
        const land = smoothstep(uLand, uLand + 0.04, u);
        DU.uTime.value = time; DU.uGrow.value = 0.22 + 0.78 * u; DU.uSettle.value = 1 - smoothstep(0, uTilt * 1.4, u) + 0.06 * Math.sin(time * 0.23);
        DU.uLand.value = land; DU.uHop.value = clamp((u - uLand - 0.05) / 0.022, 0, 1) + clamp((u - uLand - 0.085) / 0.022, 0, 1);
        const tapNod = rare && tapT > -0.5 && tapT < 0.4 ? Math.sin((tapT + 0.5) / 0.9 * Math.PI) : 0;
        DU.uCock.value = land * (0.12 * Math.sin(time * 1.3) * Math.sin(time * 0.37) + 0.55 * smoothstep(uReveal - 0.015, uReveal + 0.01, u) - 0.5 * tapNod);
        DU.uPeer.value = smoothstep(uReveal + 0.01, uReveal + 0.06, u) * (1 - 0.5 * smoothstep(uReveal + 0.2, uReveal + 0.3, u)) + 0.6 * tapNod;
        DU.uTap.value = tapT > 0 ? clamp(tapT / 1.8, 0, 1) : 0;
        // machines and loose things, all slowing as the swirl dies
        spin += dt * TAU * (1 / 12 + (11 / 12) * s * s); wc += dt * 5 * s * s; drift += dt * (0.1 + 1.0 * s);
        sails.rotation.z = spin;
        // (cure) the skein's turn is summed, rate times the step, so it turns one way at every clock and every pace (a rate
        // that falls along the flight, times the whole clock, turns backwards, the faster the later the visitor came in)
        flockA += dt * (0.1 + 0.25 * s); flock.rotation.y = 0.9 + flockA;
        if (nearSleigh) {
          // (polish 3) its coming, its crossing and its going hang on the journey's own places (the reveal at the window, the
          // bridge, the first place of the orbit over the ice): it comes over 9 m of our route before and after the reveal and
          // goes over 10 m before and after the first place over the ice
          const k = smoothstep(uReveal - 9 / path.length, uReveal + 9 / path.length, u) * (1 - smoothstep(uIce - 10 / path.length, uIce + 10 / path.length, u)), uu = Math.min(1, u + 25 / path.length);
          path.pointAt(uu, nsP); path.tangentAt(uu, nsT);
          nearSleigh.scale.setScalar(Math.max(0.001, 1.75 * k));
          const side = (u - uBridge) * 60;                  // it crosses the view from left to right as we come over the pond
          nearSleigh.position.set(nsP.x - nsT.z * side, nsP.y - 4.2 + 0.5 * Math.sin(time * 0.9), nsP.z + nsT.x * side);
          nearSleigh.rotation.set(-0.06 + 0.06 * Math.sin(time * 0.7), Math.atan2(-nsT.z, nsT.x) - 0.35, 0.1 * Math.sin(time * 0.8));
        }
        colA += dt * (0.11 + 0.5 * s); column.quaternion.multiplyQuaternions(column.userData.q0, colQ.setFromAxisAngle(yAxis, colA));
        for (const m of cockMeshes) { const d = m.userData; m.rotation.y = d.base + wc * d.k + 0.35 * (1 - s) * Math.sin(time * 0.7 + d.ph); }
        const entK = 1 - smoothstep(0.04, 0.09, u);     // the entry view keeps one stray sleigh: the others on the near side of the ring hold off until the lens is in
        for (let i = 0; i < sleighs.length; i++) {
          const m = sleighs[i], d = m.userData, w = 34 / (d.r + 8), a = d.ph + drift * w * d.k, bob = Math.sin(time * 0.5 * d.k + d.w);
          m.scale.setScalar(d.sc * Math.max(0.001, 1 - (i ? entK * smoothstep(-0.25, 0.35, Math.cos(a - a0)) : 0)));
          m.position.set(Math.sin(a) * d.r, d.y + 1.6 * bob, Math.cos(a) * d.r);
          m.rotation.set(-0.12 * Math.cos(time * 0.5 * d.k + d.w) - 0.1 * s, a + Math.PI / 2 + 0.15 * Math.sin(time * 0.33 + d.w), -(0.12 + 0.4 * s) + 0.1 * Math.sin(time * 0.8 + d.w));
        }
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
