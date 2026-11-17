// THE BIRDS of the digging wheel: gulls follow the wheel as they follow a plough. Where earth is turned, gulls come for what
// is in it: a flock of thirty-two about the wheel's bay, wheeling slowly in WIDE rounds. Thirteen fly before the wheel,
// over the fresh cut and the fan of fallen earth, in two strings of long ovals, seven and six, one 4 m over the other
// and flown the other way: each oval lies along the cut, LOW IN THE WEST (34 to 40 m) AND HIGH IN THE EAST over the
// lip (40 to 45 m), as the lens's own line climbs, so that the flight comes on them from below, against the sky; these
// beat their wings seven to nine tenths of the time (gulls working low over turned earth), the others a few beats and
// then a glide. Six fly rounds over the terrace's edge west of the wheel (40 to 47 m up); nine over the lip and the
// torn edge of the field, before the limes (44 to 56 m); four fly the widest rounds about the wheel itself, over the
// boom and behind it. White bodies, pale grey backs and upper wings, dark wing tips, a yellow bill: each a body 1.3 to
// 1.4 m across the wings. Nobody is here; the gulls are the only life, and the eye's measure of the machine.
// (No loop lies LOW over the terrace or the pit, where the flight would see it only from behind and above. SAID
// PLAINLY: abreast of the wheel the lens is level with the strings, and a gull flying straight and level, seen from
// its own height, is a thin stroke: there the picture holds few birds and thin ones. The air before the wheel is 10 m
// deep between the wheel's swept round and the lens's line: a round wide enough to be slow does not fit it.)
//
// THE LAW OF A BIRD. Its place and its pose are a pure function of the world's clock uT, worked in the vertex shader from its
// own fifteen typed constants (BIRDS: one row a bird, the same on every seed and every visit; nothing in update(), nothing
// kept from frame to frame, no chance at all in the build). With f = 2 pi (uT / P + ph), going the way of P's sign:
//   in the loop's own plan   u = A (cos f + e cos(2f + q)),   v = B (sin f + e sin(2f + q))      a lobed oval: CLOSED, once round in |P| seconds
//   in the frame             x = cx + u cos rho - v sin rho,  z = cz + u sin rho + v cos rho
//   its height               y = cy + H (sin(f + qh) + 0.25 sin(2f + 2.3 qh + 1))
// It heads along its own way (the law's first derivative, taken in the shader), noses up and down with its climb (to 26
// degrees), and BANKS INTO THE TURN by the turn's own pull: the angle whose tangent is its sideways acceleration (the law's
// second derivative, across its heading) over g, nine tenths of it, to 60 degrees. ITS WINGS: every Tc seconds a few beats
// (the nearest whole number to 3.1 a second, in the first D seconds) and then a glide, as gulls fly. Each wing is two
// lengths, arm and hand, hinged at the shoulder and the wrist about lines along the body: in the beat the arm swings 34
// degrees either way and the hand follows it a sixth of a beat late (the tips' corners go round the body's line); in the
// glide the arm is held 11 degrees up and the hand 10 down, the gull's own bow.
// THEY ARE BODIES. No bird comes within 8 m of the lens's line (the core's ROUTE), within 3 m of any body of the land's,
// the machine's or the works' lists (the wheel's swept round, the boom, the stays, the fall among them), nor within 3 m of
// the land or the crop; all keep within 70 m of the hub in plan and south of the shelter row of limes; none is ever in the
// exit ring's part of the sky. AND OF ONE ANOTHER: AS GULLS WHEEL, every loop is a wide round flown once in 7.2, in 8 or
// in 9 seconds, at 8 to 12 m a second taken round the whole loop (65 to 96 m): a round's bird keeps between 7.6 and
// 12.4 everywhere; a long oval's goes 12.6 along its sides and slows to 3.2 in its two end turns (an oval of one
// time is slow where it is tight). The three times are whole shares of 72 s (ten, nine and eight rounds), so the
// whole flock's motion comes round again only every 72 s, twice the flight's 35, and over those 72 s no two birds'
// middles come within 1.6 m (their wings never cross). PROVED IN NODE by shots/the-digging-wheel/round3/birds/prove.mjs,
// which runs birdAt (this file's own mirror of the shader's law) round every bird's whole loop; the rows were dealt,
// once, by deal.mjs beside it (a fixed generator with a typed seed, each loop tried against the same lists and the
// birds already kept, and kept only if clear with room to spare and, but for the four widest rounds, only if it comes
// within 13 to 17 m of the lens's line somewhere) and TYPED here.
// DRAWN BY THE PIXEL'S FOOTPRINT: NO TICKS AND NO SINGLE PIXELS. A bird whose span in the picture would be under 9 pixels
// is NOT DRAWN AT ALL: the vertex shader draws it to a point at its middle (no fragment). From 13 pixels of span it is
// drawn whole; between 9 and 13 it eases in evenly AT ITS OWN SIZE, growing solid (the fragment's alpha, a smoothstep of
// its span in pixels: the material blends for this alone, as the land's poles fade by their footprint). It is NEVER
// SHRUNK: a shrunk bird is a tick, and its dark wing tips single dark pixels (tried, seen in a still, and taken out).
// At 644 by 363 that is whole within 31 m of the lens and nothing beyond 45 m: the high look back and the far views
// show no bird, the near views keep their gulls. Never by the lens's distance alone, a still's position, a seed or
// the flight's clock.
// WHAT THE SHADERS READ OF THE LENS AND OF NEIGHBOURING PIXELS, each named:
//   1. the footprint, in the VERTEX shader, at the bird's middle: the bird's depth before the lens (the w of its middle
//      through projectionMatrix * viewMatrix), over the projection's scale (projectionMatrix[1][1]) and half the
//      height in pixels of the target being drawn into (the uniform uBirdPx). mesh.onBeforeRender does ONE thing: it
//      sets uBirdPx to half the height of the render target (or of the canvas) that this draw goes to. No other state.
//   2. the core's faceNormal(vW), in the fragment shader: the flat face's normal from the slopes of the world place
//      between NEIGHBOURING PIXELS; used for the light, and to tell which side of a wing's one sheet is seen.
//   3. the core's haze(colour, vW), in the fragment shader: the air between the lens's place and the bird.
// LIGHT: the core's own sun and sky on each flat face, the sun's cut at the fragment's place by the core's shadeOnce (the
// bodies' shadows and the clouds', as the works take it); a face that looks down takes the lit ground's warm light back;
// a wing's feathers let four tenths of the sun through. A wing is one sheet: the side that is seen is told by the
// face's normal against the bird's own up (grey above, a paler soft grey below, the tips dark on both). No shadow of their own on the ground.
// ONE MESH, ONE MATERIAL, ONE DRAW CALL; 39 triangles a bird.
//
// WHAT THE OTHER FILES USE: buildBirds(ctx, uniforms) -> { mesh, triangles, birds }  (async; the material is made here);
//   BIRDS, birdAt(row, t) -> [x, y, z] (the JS mirror of the shader's law), birdLoop(row) (its length, metres), SPAN, REACH
import * as THREE from 'three';
import { Geo, GLSL_COMMON, GLSL_CLOCK, GLSL_MOTION_DEFAULT, GLSL_SHADE } from './the-digging-wheel.js';

export const SPAN = 1.35;                                     // a gull's span, metres, before its own size (0.965 to 1.035 of it: 1.30 to 1.40 m)
export const REACH = 0.72;                                    // the farthest any corner of a bird stands from its middle (a wing tip of the largest, flat out)
const S0 = 0.045, WRIST = 0.31, TIP = 0.675;                  // across the bird from its middle line: the shoulder, the wrist, the wing's tip (metres)

// THE FLOCK: one row a bird, [cx, cy, cz, A, B, rho, e, q, H, qh, P, ph, Tc, phf, D] as the head says (metres, radians,
// seconds; P's sign is the way round; phf: where in its Tc seconds its beats begin at clock 0).
// (dealt by shots/the-digging-wheel/round3/birds/deal.mjs and typed: the rows are the law)
export const BIRDS = [
  // wide rounds about the wheel itself, over the boom and behind it
  [80.07, 47.01, 0.23, 15.66, 12.63, -0.086, 0.013, 5.465, 5.62, 2.749, 9, 0.015, 5.9, 0.01, 2.33],
  [79.89, 47.98, 0.45, 16.44, 13.07, -0.005, 0.012, 4.287, 4.74, 2.573, 9, 0.39, 4.45, 0.571, 1.48],
  [82.52, 47.88, 0, 15.8, 12.59, 0.046, 0.022, 3.337, 4.83, 3.061, 9, 0.601, 4.75, 0.109, 1.22],
  [79.27, 47.89, 0.43, 14.99, 12.51, 0.066, 0.024, 4.623, 4.18, 2.537, 9, 0.778, 4.4, 0.893, 1.49],
  // the lower string: long ovals before the wheel, over the fresh cut and the fan, low in the west and high over the lip
  [80.12, 38.24, 12.77, 15.25, 4.22, -0.097, 0.02, 0.647, 3.02, 1.508, 8, 0.125, 4.97, 0.159, 3.91],
  [78.68, 38.37, 12.71, 14.85, 4.39, -0.012, 0.024, 5.282, 3.67, 1.437, 8, 0.273, 3.3, 0.49, 2.88],
  [79.72, 38.33, 12.71, 14.74, 4.2, 0.086, 0.034, 4.455, 3.33, 1.527, 8, 0.358, 4.44, 0.057, 3.95],
  [82.56, 38.25, 12.78, 14.96, 4.23, 0.096, 0.022, 1.967, 3.28, 1.841, 8, 0.541, 5.64, 0.094, 4.84],
  [81.02, 38.33, 12.71, 14.36, 4.26, 0.081, 0.021, 1.227, 3.34, 1.685, 8, 0.673, 5.68, 0.619, 4.32],
  [80.02, 38.28, 12.56, 14.95, 4.45, 0.049, 0.045, 5.979, 3.58, 1.45, 8, 0.776, 4.39, 0.165, 3.5],
  [81.33, 38.15, 12.78, 14.75, 4.21, 0.067, 0.027, 5.074, 2.99, 1.461, 8, 0.916, 5.38, 0.189, 4.84],
  // the upper string: the same ovals 4 m higher, flown the other way
  [77.98, 42.25, 14.52, 14.98, 5.21, 0.078, 0.031, 5.866, 3.72, 1.573, -8, 0.158, 4.08, 0.746, 3.61],
  [82.2, 42.6, 13.45, 15.09, 5.28, -0.054, 0.036, 2.925, 3.17, 1.425, -8, 0.318, 3.26, 0.516, 2.86],
  [81.19, 42.07, 13.69, 14.82, 4.72, 0.035, 0.029, 5.291, 3.76, 1.411, -8, 0.437, 5.61, 0.329, 3.95],
  [79.49, 41.61, 14.42, 14.22, 4.65, -0.098, 0.021, 6.157, 3.15, 1.513, -8, 0.507, 3.72, 0.714, 3.28],
  [82.14, 42.16, 13.96, 14.97, 4.62, -0.053, 0.027, 3.59, 3.07, 1.362, -8, 0.715, 4.43, 0.357, 3.8],
  [82.34, 42.55, 14.04, 14.48, 4.51, 0.086, 0.037, 2.264, 3.34, 1.558, -8, 0.971, 4.4, 0.775, 3.69],
  // rounds over the terrace's edge, west of the wheel
  [62.4, 43.57, 15.66, 11.39, 10.6, 0.651, 0.03, 4.282, 2.9, 0.895, -7.2, 0.076, 5.81, 0.269, 1.74],
  [63.9, 44.02, 14.5, 10.33, 11.24, 2.757, 0.029, 1.52, 2.54, 3.237, -8, 0.324, 4.69, 0.797, 2.15],
  [63, 43.46, 13.89, 11.27, 10.72, 0.028, 0.017, 5.549, 2.99, 2.644, -7.2, 0.458, 3.65, 0.223, 0.97],
  [63.82, 44.77, 15.96, 10.88, 9.96, 2.344, 0.013, 4.961, 1.58, 5.408, -7.2, 0.666, 5.99, 0.235, 1.56],
  [62.56, 45.06, 14.06, 11.6, 9.91, 0.441, 0.016, 5.335, 2.44, 2.279, -7.2, 0.808, 5.34, 0.947, 1.36],
  [69.16, 45.12, 15.55, 10.59, 10.29, 2.57, 0.033, 3.782, 1.77, 3.739, -7.2, 0.857, 3.91, 0.222, 1.84],
  // rounds over the lip and the torn edge of the field, before the limes
  [100.95, 53.51, 10.3, 12.08, 11.28, 0.553, 0.033, 0.134, 3.02, 4.639, -7.2, 0.025, 4.62, 0.982, 2.08],
  [93.48, 51.49, 8.47, 11.99, 11.1, 0.123, 0.022, 0.008, 3.47, 4.659, -7.2, 0.171, 3.31, 0.669, 1.17],
  [92.77, 51.26, 6.82, 11.1, 10.55, 1.321, 0.015, 4.169, 2.3, 0.987, 7.2, 0.269, 3.23, 0.526, 1.55],
  [98.84, 53.5, 11.7, 11.18, 11.01, 1.094, 0.036, 0.793, 2.28, 5.097, -7.2, 0.432, 4.28, 0.159, 1.19],
  [97.98, 51.68, 6.83, 12.42, 10.11, 0.065, 0.036, 4.486, 2.79, 2.371, -7.2, 0.468, 5.43, 0.803, 2.58],
  [96.75, 47.23, 9.55, 11.82, 9.92, 1.93, 0.019, 0.066, 2.94, 1.633, 7.2, 0.585, 5.87, 0.263, 2.26],
  [100.96, 52.51, 9.18, 10.38, 9.89, 0.268, 0.015, 3.703, 2.36, 3.277, -7.2, 0.739, 4.73, 0.588, 1.55],
  [98.88, 50.45, 5.23, 10.92, 11.15, 0.785, 0.021, 0.503, 1.63, 3.829, -7.2, 0.876, 4.92, 0.406, 2.4],
  [95.79, 50.9, 9.39, 11.81, 9.88, 2.46, 0.016, 6.105, 1.65, 4.682, 7.2, 0.943, 4.12, 0.916, 1.86],
];

const f = 2 * Math.PI;
// where a bird's middle is at clock t (the JS mirror of the shader's law)
export function birdAt(b, t) {
  const [cx, cy, cz, A, B, rho, e, q, H, qh, P, ph] = b, sg = Math.sign(P), x = t / Math.abs(P) + ph, a = f * (x - Math.floor(x)) * sg;
  const u = A * (Math.cos(a) + e * Math.cos(2 * a + q)), v = B * (Math.sin(a) + e * Math.sin(2 * a + q)), c = Math.cos(rho), s = Math.sin(rho);
  return [cx + c * u - s * v, cy + H * (Math.sin(a + qh) + 0.25 * Math.sin(2 * a + 2.3 * qh + 1)), cz + s * u + c * v];
}
// the length of a bird's loop, metres (walked in 720 steps)
export function birdLoop(b) {
  const P = Math.abs(b[10]); let L = 0, p = birdAt(b, 0);
  for (let i = 1; i <= 720; i++) { const n = birdAt(b, P * i / 720); L += Math.hypot(n[0] - p[0], n[1] - p[1], n[2] - p[2]); p = n; }
  return L;
}

// the colours (linear): the white of head, breast and tail (a grey white, 0.62: square to the low sun
// its red reaches 1.02, the sun's 1.5 and 1.3 of the sky's 0.112 on that 0.62, a little over full; its green 0.81, its blue 0.55); the pale grey of back and upper wing; the dark tips; the bill
const WHITE = [0.62, 0.62, 0.60], MANTLE = [0.30, 0.325, 0.36], TIPC = [0.035, 0.035, 0.04], BILL = [0.78, 0.50, 0.06];

// ONE GULL in its own frame, written as position = (ahead, up, to its right), metres: a spindle of four-sided rounds from
// the head to the rump (29 triangles with the bill and the tail's fan) and two wings of five triangles each (arm, hand, tip)
function gull(G) {
  const ring = (fx, c, ru, rs) => [[fx, c + ru, 0], [fx, c, rs], [fx, c - ru, 0], [fx, c, -rs]];   // top, right, belly, left
  const head = ring(0.21, 0.010, 0.042, 0.040), sh = ring(0.07, 0, 0.060, 0.056), rump = ring(-0.17, 0.006, 0.036, 0.040), nose = [0.262, 0.004, 0];   // (a slim spindle: a thick neck, its fullest 12 cm through at the shoulder, a long taper to the rump)
  G.mark = [G.mark[0], G.mark[1], G.mark[2], 0];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, back = i === 0 || i === 3;                  // (the two faces that meet at the top are the back)
    G.tri(nose, head[i], head[j], WHITE);
    G.quad(head[i], sh[i], sh[j], head[j], WHITE);
    G.quad(sh[i], rump[i], rump[j], sh[j], back ? MANTLE : WHITE); }
  const bb = [[0.238, 0.018, 0], [0.238, -0.008, 0.013], [0.238, -0.008, -0.013]], bt = [0.315, -0.004, 0];   // the bill
  for (let i = 0; i < 3; i++) G.tri(bt, bb[i], bb[(i + 1) % 3], BILL);
  const tl = [-0.305, 0.004, -0.068], tr = [-0.305, 0.004, 0.068];                                  // the tail: a flat fan
  for (const k of [0, 2]) { G.tri(rump[k], rump[1], tr, WHITE); G.tri(rump[k], tr, tl, WHITE); G.tri(rump[k], tl, rump[3], WHITE); }
  G.mark = [G.mark[0], G.mark[1], G.mark[2], 1];                                                    // THE WINGS (the shader bends them at the shoulder and the wrist)
  for (const sd of [-1, 1]) { const at = (fx, s) => [fx, 0.015, sd * s];                           // (the sheet's height: at the shoulder's round the slim body's side stands 4.2 cm out there, the wing's root 4.5)
    // (a gull's wing: the arm goes a little FORWARD to the wrist, narrowing from 19 to 17 cm; from the wrist the hand
    // sweeps BACK, narrowing to 14 cm half way along it and to a point at the tip, 29 cm behind the wrist's leading edge)
    const r0 = at(0.130, S0), r1 = at(-0.060, S0), w0 = at(0.165, WRIST), w1 = at(-0.005, WRIST), m0 = at(0.085, 0.50), m1 = at(-0.055, 0.49), tip = at(-0.125, TIP);
    G.quad(r0, w0, w1, r1, MANTLE); G.quad(w0, m0, m1, w1, MANTLE); G.tri(m0, tip, m1, TIPC); }
}

const VERT = /* glsl */`${GLSL_CLOCK}
  ${GLSL_MOTION_DEFAULT}
  attribute vec3 color; attribute vec4 mark; attribute vec4 aux; attribute vec4 bA; attribute vec4 bB;
  uniform float uBirdPx;                                      // half the picture's height, pixels
  varying vec3 vW, vC, vUp; varying float vWing, vEase;
  void main(){
    // THE LOOP: where the bird's middle is now, how fast it goes and how it is pulled (the law and its two derivatives)
    float P = abs(bA.w), sg = sign(bA.w), w = 6.2831853 / P * sg, a = 6.2831853 * fract(uT / P + bB.x) * sg;
    float A = aux.x, B = aux.y, e = aux.w, q = bA.x, H = bA.y, qh = bA.z;
    float c1 = cos(a), s1 = sin(a), c2 = cos(2. * a + q), s2 = sin(2. * a + q), cr = cos(aux.z), sr = sin(aux.z);
    vec2 o = vec2(A * (c1 + e * c2), B * (s1 + e * s2));
    vec2 d1 = vec2(-A * (s1 + 2. * e * s2), B * (c1 + 2. * e * c2)) * w;
    vec2 d2 = vec2(-A * (c1 + 4. * e * c2), -B * (s1 + 4. * e * s2)) * w * w;
    o = vec2(cr * o.x - sr * o.y, sr * o.x + cr * o.y); d1 = vec2(cr * d1.x - sr * d1.y, sr * d1.x + cr * d1.y); d2 = vec2(cr * d2.x - sr * d2.y, sr * d2.x + cr * d2.y);
    float hy = 2. * a + 2.3 * qh + 1.;
    vec3 c = vec3(mark.x + o.x, mark.y + H * (sin(a + qh) + 0.25 * sin(hy)), mark.z + o.y);
    float vy = H * (cos(a + qh) + 0.5 * cos(hy)) * w, vh = max(length(d1), 1e-3); vec2 fh = d1 / vh;
    // ITS FRAME: ahead along its way (nosing up and down with its climb), banked into the turn by the turn's own pull
    float gam = clamp(atan(vy, vh), -0.45, 0.45);
    vec3 F = vec3(fh.x * cos(gam), sin(gam), fh.y * cos(gam)), R0 = vec3(-fh.y, 0., fh.x), U0 = cross(R0, F);
    float bank = clamp(0.9 * atan(dot(d2, vec2(-fh.y, fh.x)) / 9.81), -1.05, 1.05);
    vec3 U = cos(bank) * U0 + sin(bank) * R0, R = cos(bank) * R0 - sin(bank) * U0;
    // ITS SIZE: its own (0.965 to 1.035). HOW SOLID: nothing where its span would be under 9 pixels' footprints (there it
    // is drawn to a point: no fragment at all), whole from 13, evenly between (the fragment's alpha: it is never shrunk)
    float size = 0.965 + 0.07 * fract(bB.x * 37.71 + 0.13);
    vec4 cc = projectionMatrix * viewMatrix * vec4(c, 1.);
    float foot = max(cc.w, 1e-3) / (projectionMatrix[1][1] * uBirdPx);
    vEase = smoothstep(9., 13., ${SPAN.toFixed(3)} * size / foot);
    float k = vEase > 0. ? size : 0.;
    // ITS WINGS: a few beats, then a glide
    vec3 p = position;
    if (mark.w > 0.5) {
      float Tc = bB.y, D = bB.w, sc = fract(uT / Tc + bB.z) * Tc, fb = floor(D * 3.1 + 0.5) / D, hb = 0.5 / fb;
      float env = smoothstep(0., hb, sc) * (1. - smoothstep(D - hb, D, sc)), psi = 6.2831853 * fb * sc;
      float t1 = mix(0.20, 0.08 + 0.60 * sin(psi), env), t2 = mix(-0.17, t1 + 0.50 * sin(psi - 1.05), env);
      float sa = abs(p.z), e1 = min(sa, ${WRIST.toFixed(3)}) - ${S0.toFixed(3)}, e2 = max(sa - ${WRIST.toFixed(3)}, 0.);
      p.y += sin(t1) * e1 + sin(t2) * e2; p.z = sign(p.z) * (${S0.toFixed(3)} + cos(t1) * e1 + cos(t2) * e2);
    }
    vW = c + (F * p.x + U * p.y + R * p.z) * k; vC = color; vUp = U; vWing = mark.w;
    gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
  }`;
const FRAG = /* glsl */`${GLSL_COMMON}${GLSL_SHADE}
  varying vec3 vW, vC, vUp; varying float vWing, vEase;
  void main(){
    vec3 n = faceNormal(vW), col = vC; float through = 0.;
    if (vWing > 0.5) { through = 0.4;                         // a wing: one sheet, grey above; below a soft pale grey, 0.68 to 0.70: paler than the mantle and, as typed, a little paler than the body's WHITE, 0.62 (its tip dark on both sides)
      if (dot(n, vUp) < 0.) col = dot(vC, vec3(1.)) < 0.3 ? vec3(0.08, 0.08, 0.085) : vec3(0.68, 0.69, 0.70); }
    float sun = dot(n, uSun), cut = shadeOnce(vW);
    vec3 light = SUNC * (max(sun, 0.) + through * max(-sun, 0.)) * (1. - cut) + 1.3 * skyAmb(n)
      + vec3(0.30, 0.285, 0.25) * max(-n.y, 0.) * (1. - 0.6 * cut);         // (what the lit earth and the grain throw back up)
    gl_FragColor = vec4(haze(col * light, vW), vEase);         // (whole from 13 pixels of span; easing in from 9: see the head)
  }`;

export async function buildBirds(ctx, uniforms) {
  const G = new Geo(BIRDS.length * 117);
  for (const b of BIRDS) { G.mark = [b[0], b[1], b[2], 0]; G.aux = [b[3], b[4], b[5], b[6]]; gull(G); }
  if (ctx && ctx.yield) await ctx.yield();
  const K = G.n / BIRDS.length, bA = new Float32Array(G.n * 4), bB = new Float32Array(G.n * 4);      // (every bird has the same count of corners)
  BIRDS.forEach((b, i) => { for (let j = i * K; j < (i + 1) * K; j++) { bA.set([b[7], b[8], b[9], b[10]], j * 4); bB.set([b[11], b[12], b[13], b[14]], j * 4); } });
  const px = { value: 181.5 };
  // (see-through ONLY for the ease between 9 and 13 pixels of span; it writes depth as a solid does, and is drawn first of
  // the see-through things, so that the farm's wires, which write none, lie rightly over it or behind it; both sides in
  // ONE pass, forceSinglePass: one draw call still)
  const material = new THREE.ShaderMaterial({ side: THREE.DoubleSide, transparent: true, forceSinglePass: true, uniforms: { ...uniforms, uBirdPx: px }, vertexShader: VERT, fragmentShader: FRAG });
  const mesh = G.mesh(uniforms, { material }); mesh.renderOrder = -1;
  mesh.geometry.setAttribute('bA', new THREE.BufferAttribute(bA, 4)); mesh.geometry.setAttribute('bB', new THREE.BufferAttribute(bB, 4));
  // the picture's height in pixels, told as the mesh is drawn (the buffer it is being drawn into): for the footprint alone
  mesh.onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); px.value = 0.5 * (rt ? rt.height : renderer.domElement.height); };
  return { mesh, triangles: G.triangles, birds: BIRDS.length };
}
