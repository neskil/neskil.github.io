// THE WEIGHT OF GLASS. A flat pearl sky, a shallow opal sea, and one water-clear glass arch (the Span, src/parts) with a
// herd of black ballast-walkers crossing its back. The only colour anywhere is strain: photoelastic fringes that bloom
// in the glass under every pad, root and support and crawl as the loads move. Style: no pigment, no shading, no fog;
// glass bodies are drawn as multiply + additive passes over what is behind them (see the part's header).
// Flight (41.5 s, about 716 m; see "Fix round 3" below): in low and near toward the Span, a wader whole in the lane's
// shallows (u 0.08), gliders across the bow (0.115), the near springing (0.16), 12 m under the haunch as a pad lands
// overhead (0.25), up beside the +Z flank with the glass filling the frame (0.28-0.38), over the crown between two
// walkers (0.44), out over the flat with the glider ribbon (0.52), round two groves of blade-trees with waders (0.61,
// 0.70), then the pierced abutment obliquely (0.79), its bore straight on (0.87) and the throat (0.94).
// Seeded looks: sky (pearl | ivory sun veil | sea mist | dusk for night), load (nine | clump of five | one giant),
// glass (clear | smoke | deep), wind (gusts | gale), cast (glider count, ribbon-flexors). Rare: a walker settles near the
// crown and every nest pools into one eye.
// The hero's glass refracts the analytic sky, veil and sea (shared uniforms, see the part); sea mist is an analytic
// layer in every shader (no mist geometry); the glider stream is placed from the gaze each frame at its two crossings
// (u 0.20 and 0.665); the giant strides 2.5 times as far as the others (herdProgress) and is ahead on the crown at u 0.6.
// Fix round 1: under the haunch the gaze goes steeply UP into the glass (underPoi leads the lens along Z, so the heading
// never swings) and the lane is 5 m lower there; the rain veil is a standing band and the far sea a step darker than
// what it mirrors (a horizon line); the mist look is a white band whose top rises with distance under a darker dome;
// reeds are pale lens rods with beads; on the rare visit the herd is in place by u 0.50 and the nests pool into one
// closed eye seen side-on from the flank climb (u 0.50-0.56), parted again by 0.61 while the others plod on.
// Fix round 2: THE SETTING HAS VALUES. The sea is a tidal flat (SEA_BARS_GLSL, shared with the part's refracted view):
// long opal sand bars with megaripples and slate channels in sweeping parallel curves, a dark far band, dark gust
// fronts; the sky darkens to the zenith in slow shoals, the rain band stands all round (tallest ahead, streaks falling)
// over a thin pale line of haze. Blade-trees are flushed at the root by their own lean; two are placed by hand outside
// the long turn with a wader laying rings below them (u 0.62-0.80). The glider stream is in sight from the entry and
// crosses closer on its second pass; a bed of tall reeds stands in the entry's foreground; out from under the haunch
// the gaze follows the herd (flankNear); the giant is over the under-pass at u 0.40 with a nest that shows round it.
// Fix round 3: THE STRANGER'S STILLS. The line (part: anchors.flyThrough) is shorter and nearer: no long far approach,
// no long run at the block. The script keeps its old clock: so(u) maps progress on this line to progress on the old
// 820 m line by place (under-pass 0.411, crown 0.585), so pads, pooling and the giant still happen where they did. One
// moving target (spanPoi) carries the gaze from the ceiling to the flank; the rain band is a deck with a flat base and
// slanted curtains with gaps (VEIL_GLSL, shared with the glass); reeds stay pale (their two walls no longer square the
// ramp); gliders have veined blades and three placements blended (bow crossing, over the back, a ribbon in frame over
// the flat); the groves face the lens; three waders stand where a still falls, each whole with its rings.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, HIPS, STRIDE, SEA_BARS_GLSL, VEIL_GLSL } from '../parts/weight-of-glass.js';

const PALETTE = ['#CBC7C0', '#E9D58A', '#C2386A', '#2B2F86', '#2D9CC9', '#5DBF8F', '#15161B'];
const lin = (hex) => new THREE.Color(hex);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const NOISE_GLSL = /* glsl */`
float h21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm3(vec2 p) { return vn(p) * 0.55 + vn(p * 2.13 + 7.1) * 0.29 + vn(p * 4.31 + 3.7) * 0.16; }
`;
// sea mist (a seeded look) is analytic: a layer 9 m deep lying on the water. mistSeg = how much of it a sight line from the
// eye to a point crosses (0..1). No mist geometry: nothing to break when the camera is exactly level.
const MIST_GLSL = /* glsl */`
float mistSeg(vec3 eye, vec3 P) {
  vec3 d = P - eye; float len = length(d), py = abs(P.y);
  float T = 9.0 + 0.034 * length(d.xz);                    // the top of the layer as seen from here: it stands taller with distance
  float y0 = min(eye.y, py), y1 = max(eye.y, py), dy = y1 - y0;
  float inside = max(min(y1, T) - min(y0, T), 0.0);
  float frac = dy > 0.01 ? clamp(inside / max(dy, 0.01), 0.0, 1.0) : 1.0 - step(T, y0);
  float band = 1.0 - smoothstep(0.55 * T, 1.05 * T, py);  // a clean top: what stands above the band is clear
  return (1.0 - exp(-max(len * frac - 35.0, 0.0) / 120.0)) * band;
}
`;

// ---------- the sky: an analytic pearl dome whose lower half mirrors the upper (for the sea) ----------
const SKY_VERT = /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uSunDir, uZen, uHor, uVeilC, uPatch, uMistC; uniform float uTime, uMist, uVeilAmt;
varying vec3 vD;
${NOISE_GLSL}
${VEIL_GLSL}
void main() {
  vec3 d = normalize(vD + vec3(0.0, 1e-4, 0.0)); float y = abs(d.y);
  vec3 c = mix(uHor, uZen, smoothstep(0.0, 0.6, y));
  // the faintest slow marbling of the overcast, so the dome is alive but never shows a cloud edge
  vec2 sp = d.xz / (y + 0.35);
  float mar = fbm3(sp * 1.6 + vec2(uTime * 0.012, -uTime * 0.008)) - 0.5;
  float mar2 = 0.6 * vn(sp * 3.4 - vec2(uTime * 0.012, uTime * 0.008) + 4.0) + 0.4 * vn(sp * 1.3 + vec2(uTime * 0.006, 2.0)) - 0.5;        // and broad slow shoals of lighter and darker overcast
  c *= (1.0 + 0.06 * mar + 0.24 * mar2 * smoothstep(0.1, 0.5, y)) * (1.0 - 0.09 * smoothstep(0.55, 1.0, y));    // a little darker still straight overhead
  float s = max(dot(vec3(d.x, y, d.z), uSunDir), 0.0);
  c += uPatch * s * s * s;
  // the rain band (VEIL_GLSL, shared with the glass): a dark deck with a flat base, curtains hanging from it to the sea,
  // gaps of light between them and a little more light under the deck where no rain falls
  vec2 rb = rainBand(d, uTime);
  vec2 hh = d.xz / max(length(d.xz), 1e-3);
  float st = rbN(vec2(y * 30.0 + 2.5 * rbN(hh * 1.6 + 2.0), dot(hh, vec2(1.3, 0.9)) * 1.4 + uTime * 0.004)) - 0.5;      // long level shoals of stratus above the band
  c *= 1.0 - 0.10 * st * smoothstep(0.07, 0.20, y) * (1.0 - smoothstep(0.42, 0.85, y));
  c = mix(c, uVeilC * mix(0.98, 0.88, rb.y), 0.94 * rb.x * uVeilAmt);
  // sea mist (a seeded look): a white band that swallows the horizon
  c = mix(c, uMistC, 0.4 * (1.0 - uMist) * (1.0 - smoothstep(0.002, 0.013, y)));    // a thin pale line of haze between the dark band and the dark far sea: the band's sharp lower edge
  c = mix(c, uMistC, uMist * (1.0 - smoothstep(0.034, 0.078, y)));
  c *= 1.0 - 0.14 * step(d.y, 0.0);                        // the half the sea mirrors: water gives back a little less than it is shown
  gl_FragColor = vec4(c, 1.0);
}`;

// ---------- the sea: one transparent plane over the mirrored things; sand, depth tint, swell, caustic net, rings ----------
const SEA_VERT = /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SEA_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uHor, uZen, uSunDir, uSand, uDeep, uMistC; uniform float uMist;
uniform vec4 uRings[8]; uniform vec4 uWind, uGust;       // xz centre, age (s), strength
varying vec3 vW;
${NOISE_GLSL}
${SEA_BARS_GLSL}
${MIST_GLSL}
void main() {
  vec3 Vv = cameraPosition - vW; float d = max(length(Vv), 1e-3); vec3 V = Vv / d;
  float up = clamp(abs(V.y), 0.0, 1.0);
  vec2 p = vW.xz;
  float fw = max(fwidth(p.x) + fwidth(p.y), 1e-4);        // metres per pixel on the sand
  // depth 0.2..1.5 m: broad bars and channels, read from height as well as from the deck
  // a tidal flat: long sand bars barely awash and slate channels between them, sweeping in roughly parallel curves;
  // small runnels (chan) fret the edges of the bars
  float bars = seaBars(p), chan = fbm3(p * 0.035 + vec2(bars * 2.0, 11.0));
  float dn = bars + 0.10 * (chan - 0.5) * (1.0 - smoothstep(1.5, 6.0, fw));
  float lodB = 1.0 - smoothstep(10.0, 36.0, fw);
  float deepT = mix(0.5, smoothstep(0.465, 0.515, dn), lodB);       // 0 on a bar .. 1 in a channel
  float deepM = mix(0.3, smoothstep(0.53, 0.82, dn), lodB);       // the bed of the channel: the second, darker opal tone
  // rippled sand: wavy crests about 1.4 m apart, a finer set across them; each fades out before it would alias
  float wob = 1.7 * sin(p.y * 0.23 + bars * 5.0) + 1.1 * sin(p.x * 0.11);
  float r1 = sin(p.x * 4.4 + wob * 2.2 + chan * 9.0);
  float r2 = sin(p.y * 9.0 + 1.3 * sin(p.x * 0.9) + bars * 14.0);
  float r3 = sin((p.x + p.y) * 0.9 + wob);
  float r4 = sin(p.x * 1.75 + wob * 1.4 + chan * 6.0 + 0.8 * sin(p.y * 0.35));
  float ripple = 0.55 * r1 * (1.0 - smoothstep(0.25, 0.7, fw)) + 0.25 * r2 * (1.0 - smoothstep(0.12, 0.35, fw)) + 0.4 * r4 * (1.0 - smoothstep(0.6, 1.7, fw)) + 0.4 * r3 * (1.0 - smoothstep(1.4, 4.0, fw));
  // the shallowest bars: paler sand barely awash, with a darker wet line where each one shelves away
  float bar = 1.0 - smoothstep(0.26, 0.40, dn), lip = (1.0 - smoothstep(0.0, 0.016, abs(dn - 0.46))) * (1.0 - smoothstep(3.0, 9.0, fw));
  // megaripples on the bars, read from the air: crests square to the run of the bar, their troughs holding slate water
  float aB = 0.80 * p.x + 0.60 * p.y;
  float mr = sin(aB * 1.05 + 2.4 * sin((p.y * 0.8 - p.x * 0.6) * 0.06) + chan * 5.0);
  float mega = (0.5 - 0.5 * mr) * (1.0 - deepT) * smoothstep(0.12, 0.5, fw) * (1.0 - smoothstep(1.6, 4.5, fw));
  // the caustic net: two drifting cell patterns multiplied, bright threads on the sand
  vec2 q = p * 0.55 + vec2(uTime * 0.55, uTime * 0.36);
  float n1 = abs(vn(q) - 0.5), n2 = abs(vn(q * 1.7 - vec2(uTime * 0.66, 3.0)) - 0.5);
  float net = (1.0 - smoothstep(0.0, 0.11, n1 + n2 * 0.6)) * (1.0 - smoothstep(0.5, 1.4, fw));
  vec2 q2 = p * 0.12 + vec2(uTime * 0.28, -uTime * 0.18);
  float m1 = abs(vn(q2) - 0.5), m2 = abs(vn(q2 * 1.9 + vec2(4.0, uTime * 0.36)) - 0.5);
  net += 0.9 * (1.0 - smoothstep(0.0, 0.12, m1 + m2 * 0.6)) * smoothstep(0.3, 1.2, fw) * (1.0 - smoothstep(2.5, 7.0, fw));
  vec3 sand = uSand * (1.0 + 0.26 * ripple) * (1.0 + 0.36 * net) * (1.06 - 0.16 * chan) * (1.0 + 0.09 * bar - 0.10 * lip);
  vec3 col = mix(sand, (uDeep * 1.45 + vec3(0.0, 0.012, 0.010)) * (1.0 + 0.10 * net), 0.06 + 0.80 * deepT);     // shelving blue-green at a channel's edge
  col = mix(col, uDeep * 0.92, 0.75 * deepM);
  col = mix(col, uDeep * 1.15, 0.30 * mega);
  // ring sources from the waders' pads: three crests spreading at 3.2 m/s and thinning
  float ring = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 R = uRings[i];
    float rr = length(p - R.xy), front = R.z * 3.2;
    float w = sin((rr - front) * 2.4) * exp(-abs(rr - front + 2.0) * 0.32) * step(rr, front + 1.0);
    ring += w * R.w * exp(-R.z * 0.33) / (1.0 + 0.04 * rr);
  }
  // the slow swell tilts the mirror: bands of brighter and darker reflection sliding over the surface
  float swell = sin(p.x * 0.07 + p.y * 0.045 + uTime * 0.5) * 0.6 + sin(p.y * 0.13 - p.x * 0.05 - uTime * 0.37) * 0.4;
  float chop = (vn(p * 0.8 + vec2(uTime * 0.35, -uTime * 0.2)) - 0.5) * (1.0 - smoothstep(0.5, 2.5, fw));
  // cat's-paws: the same gust fronts that bow the reeds ruffle the water, darker and less of a mirror, and run on
  float along = dot(p, uWind.xy);
  float g1 = sin(along * 0.021 - uTime * 0.55 + 1.3 * sin(dot(p, vec2(-uWind.y, uWind.x)) * 0.013));
  float paw = smoothstep(0.45, 0.70, g1) * uWind.w * (0.75 + 0.25 * fbm3(p * 0.03 + uWind.xy * uTime * 0.4)) + 0.45 * uWind.z;
  paw += uGust.w * (1.0 - smoothstep(0.35 * uGust.z, uGust.z, distance(p, uGust.xy)));
  float ruffle = 0.6 + 0.4 * vn(p * 1.1 + uWind.xy * uTime * 2.4) * (1.0 - smoothstep(0.6, 2.0, fw));
  // in a gale the wind lays long streaks down the water and drives them on (steady wind only: uWind.z)
  float crossW = dot(p, vec2(-uWind.y, uWind.x));
  float wstr = vn(vec2(crossW * 0.075, along * 0.011 - uTime * 0.55)) * 0.65 + vn(vec2(crossW * 0.21 + 3.0, along * 0.027 - uTime * 1.1)) * 0.35;
  paw += 1.1 * uWind.z * (wstr - 0.5) * (1.0 - smoothstep(6.0, 22.0, fw));
  col = mix(col, uDeep * 1.2, 0.55 * clamp(paw, 0.0, 1.0) * ruffle);
  col *= 1.0 + 0.42 * uWind.z * (wstr - 0.5) * (1.0 - smoothstep(6.0, 22.0, fw));      // the streaks themselves, lighter and darker       // a ruffled patch loses the mirror and shows the water's own slate: dark fronts running over the flat
  float tilt = 0.035 * swell + 0.05 * chop + 0.2 * ring;
  float upT = clamp(up + tilt, 0.0, 1.0);
  col *= 1.0 + (0.2 + 0.3 * smoothstep(0.04, 0.3, fw)) * ring + 0.03 * swell;     // rings stay readable from the crown
  // seen flat, a bar is a pale mirror of the sky and a channel keeps most of its own slate: the flat has values at any height
  float a = mix(mix(0.36, 0.60, deepT), 0.94, smoothstep(0.03, 0.45, upT)); a = min(1.0, a + 0.5 * clamp(paw, 0.0, 1.0));
  // sheen of the bright patch where the surface tilts toward it
  vec3 Rv = reflect(-V, normalize(vec3(tilt * 1.5, 1.0, tilt)));
  float sd = max(dot(Rv, uSunDir), 0.0); float s2 = sd * sd; s2 *= s2; s2 *= s2; s2 *= s2;
  col += uHor * 0.35 * s2 * s2;
  // distance: the sand and the tint go to the pearl veil, the mirror takes over
  float far = 1.0 - exp(-d / 1300.0);
  col = mix(col, mix(uDeep, uHor, 0.2) * 0.62, far);       // the far sea is a dark band under the horizon
  a = mix(a, 0.86, far);
  // white only where the sight line runs along the water: a band on the horizon, clear from height. The mist lies in
  // wisps that drift down the wind, thinning and thickening over the flat
  float wisp = 1.0 + 0.7 * (vn(p * 0.013 - uWind.xy * uTime * 0.27) - 0.6) * (1.0 - smoothstep(30.0, 120.0, fw));
  float mi = min(0.92 * uMist * mistSeg(cameraPosition, vW) * wisp, 0.96);
  col = mix(col, uMistC, mi);
  a = mix(a, 1.0, mi);
  gl_FragColor = vec4(col, a);
}`;

// ---------- small glass things (reeds, blade-trees, floats, gliders, flexors, far arches) ----------
// One fragment shader and ONE multiply pass each (the target is HDR, so the sheen and glint are factors above 1: they
// brighten the pearl behind them and vanish in front of a walker, and nothing glows).
// vK: x fringe order, y how solid the body is (0 hair .. 1 body), z strength (fades sub-pixel things), w metres to an edge.
const WISP_FRAG = /* glsl */`
uniform sampler2D uRamp; uniform vec3 uSunDir, uLine; uniform float uVeil, uGlint, uPix;
uniform float uMist;
varying vec3 vWN; varying vec3 vWP; varying vec4 vK;
#ifdef GLIDER
varying vec2 vG;
#endif
${MIST_GLSL}
void main() {
  vec3 n = normalize(vWN + vec3(0.0, 1e-5, 0.0));
  vec3 Vv = cameraPosition - vWP; float dist = max(length(Vv), 1e-3); vec3 V = Vv / dist;
  float ndv = abs(dot(n, V)), flat_ = step(vK.y, -0.001), body = abs(vK.y);
  float veil = 1.0 - exp(-dist / uVeil) * (1.0 - 0.92 * uMist * mistSeg(cameraPosition, vWP));
  vec3 col = texture2D(uRamp, vec2(clamp(vK.x, 0.0, 5.2) / 5.2, 0.5)).rgb;
  #ifdef REED
    // a clear rod is a lens: a pale bright core between two fine dark edges, and a brighter bead at its tip. Both walls
    // of the tube are drawn (two multiplies), so each carries the square root of the look.
    // (multiplies compound where reeds overlap, so the brightening is kept small and only for reeds near the lens)
    col = sqrt(col);                                        // both walls multiply: each carries the root of the band colour too
    float nearR = smoothstep(0.1, 0.55, (vK.z - 0.3) / 0.7), core = smoothstep(0.2, 0.8, ndv);
    col *= mix(mix(vec3(0.875, 0.89, 0.885), vec3(1.0) + vec3(0.07, 0.068, 0.06) * nearR, core), mix(vec3(0.80, 0.84, 0.83), vec3(1.0) + vec3(0.20, 0.195, 0.18) * nearR, core), body);
  #else
    col *= mix(uLine, vec3(1.0), max(flat_, clamp(smoothstep(0.04, mix(0.5, 0.26, body), ndv) * mix(1.0, 0.85, body) + mix(0.2, 0.15, body), 0.0, 1.0)));
  #endif
  float lw = max(0.05, 1.5 * uPix * dist);
  col *= mix(uLine, vec3(1.0), mix(0.35, 1.0, smoothstep(lw * 0.4, lw, vK.w)));
  #ifndef REED
    col *= mix(vec3(1.0), mix(vec3(0.90, 0.96, 0.92), vec3(0.80, 0.88, 0.84), flat_), body);
  #endif
  #ifdef GLIDER
    // a wing is a clear blade with a dark spar along its leading edge, fine veins raking back from it, and a bright rim
    // where the trailing edge and the tip catch the sky: it reads as a wing from above as well as from below
    if (flat_ > 0.5) {
      float gs = vG.x, gf = vG.y;
      float spar = 1.0 - smoothstep(0.0, 0.18, gf);
      float rib = (1.0 - smoothstep(0.0, 0.11, abs(fract(gs * 4.0 + 0.9 * gf) - 0.5))) * smoothstep(0.12, 0.3, gf) * (1.0 - smoothstep(22.0, 55.0, dist));
      float rim = clamp(smoothstep(0.78, 0.97, gf) + smoothstep(0.88, 1.0, gs), 0.0, 1.0);
      col *= mix(vec3(0.76, 0.84, 0.85), vec3(0.62, 0.71, 0.75), 0.6 * gs);
      col *= mix(vec3(1.0), uLine * 1.1, max(0.8 * spar, 0.4 * rib));
      col *= 1.0 + 0.5 * rim;
    }
  #endif
  vec3 R = reflect(-V, n);
  float fz = 1.0 - ndv, F = min(0.04 + 0.96 * fz * fz * fz, 0.5);
  float sd = max(dot(vec3(R.x, abs(R.y), R.z), uSunDir), 0.0);
  float s2 = sd * sd, s8 = s2 * s2 * s2 * s2, s32 = s8 * s8 * s8 * s8;
  col *= 1.0 + 0.22 * F * body + uGlint * 0.9 * s32 * s8 * (0.3 + 0.7 * body);
  col = mix(vec3(1.0), col, vK.z * (1.0 - veil));
  gl_FragColor = vec4(col, 1.0);
}`;
function wispMaterial(U, vertexShader, defines = {}) {
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader, fragmentShader: WISP_FRAG, defines, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide });
  m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.DstColorFactor; m.blendDst = THREE.ZeroFactor;
  m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor;
  return m;
}
// one mesh from an instanced geometry; flip adds a y-mirrored copy for the sea
function wispMesh(scene, mirror, geo, mat, flip) {
  const me = new THREE.Mesh(geo, mat); me.frustumCulled = false; me.renderOrder = 12; scene.add(me);
  if (flip) { const r = new THREE.Mesh(geo, mat); r.frustumCulled = false; r.renderOrder = 3; mirror.add(r); }
  return me;
}

// ---------- stems: glass reeds and blade-trees. Unit-height geometry, bent by the wind in the vertex shader ----------
// aD: x = t along the stem (0 root .. 1 tip), y = c across (-1..1), z = body (0 rod, 1 bead or blade), w = metres to an edge
// aI0: root x, root z, height, phase;  aI1: lean azimuth, radius scale, lean amount, flex
const STEM_VERT = /* glsl */`
attribute vec4 aD; attribute vec4 aI0; attribute vec4 aI1;
uniform float uTime, uPix; uniform vec4 uWind;     // wind: dir x, dir z, steady, gust gain
uniform vec4 uGust;                                // scripted gust: centre x, z, radius, strength
varying vec3 vWN; varying vec3 vWP; varying vec4 vK;
void main() {
  float t = aD.x, hgt = aI0.z;
  vec2 root = aI0.xy;
  // gust fronts: bands marching down the wind, plus the scripted one that runs along the path
  float along = dot(root, uWind.xy);
  float g1 = sin(along * 0.021 - uTime * 0.55 + 1.3 * sin(dot(root, vec2(-uWind.y, uWind.x)) * 0.013));
  float g2 = sin(along * 0.047 - uTime * 0.9 + aI0.w);
  float gust = smoothstep(0.35, 1.0, g1) * (0.75 + 0.25 * g2);
  float sg = uGust.w * (1.0 - smoothstep(0.35 * uGust.z, uGust.z, distance(root, uGust.xy)));
  float bend = clamp(uWind.z + uWind.w * gust + sg, 0.0, 1.6);
  float flutter = 0.06 * sin(uTime * (2.2 + 0.7 * fract(aI0.w)) + aI0.w * 7.0) * (0.3 + bend);
  float widen = 1.0;
  #ifdef REED
    float d0 = distance(cameraPosition, vec3(root.x, 1.0, root.y));
    widen = max(1.0, 1.25 * uPix * d0 / (0.035 * aI1.y));
  #endif
  vec3 p = vec3(position.x * aI1.y * widen, position.y * hgt, position.z * aI1.y * widen);
  #ifdef REED
    // the bead keeps a round look however far off: once the rod is widened to a pixel the bead grows taller with it
    p.y = hgt * min(position.y, 0.92) + max(position.y - 0.92, 0.0) / 0.08 * max(0.08 * hgt, 0.21 * widen * aI1.y);
  #endif
  vec3 nn = normal;
  #ifndef REED
    float ca = cos(aI1.x + 1.5708), sa = sin(aI1.x + 1.5708);     // blades face across their lean
    p.xz = vec2(p.x * ca - p.z * sa, p.x * sa + p.z * ca); nn.xz = vec2(nn.x * ca - nn.z * sa, nn.x * sa + nn.z * ca);
  #endif
  vec2 ld = vec2(cos(aI1.x), sin(aI1.x));
  float k = t * t;
  vec2 off = ld * aI1.z * k * hgt + uWind.xy * (bend + flutter) * aI1.w * k * hgt;
  p.xz += off; p.y -= 0.5 * dot(off, off) / max(hgt, 0.5) * t;
  vec4 wp = modelMatrix * vec4(p.x + root.x, p.y, p.z + root.y, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * nn;
  float root2 = (1.0 - t) * (1.0 - t);
  #ifdef REED
    // a short ladder of bands that climbs from the root with the bend and drains back
    float N = min(1.2 * bend, 0.90) * root2 * root2 * (1.0 - t) * (0.55 + 0.45 * abs(aD.y));     // straw, then one step of magenta, in the bottom fifth only
    vK = vec4(N, aD.z, mix(0.3, 1.0, 1.0 / widen) * mix(1.0, 0.22, smoothstep(55.0, 260.0, d0)), 999.0);
  #else
    float N = 3.4 * (bend * 0.8 + 0.12 + 1.15 * aI1.z) * root2 * (0.3 + 0.7 * abs(aD.y)) + 0.5 * bend * aD.z * t * abs(aD.y);   // a leaning blade is loaded at its root by its own weight: flushed there in any wind
    vK = vec4(N, 1.0, 1.0, aD.w * aI1.y);
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
function stemGeometry(kind) {
  const P = [], N = [], D = [], I = [];
  if (kind === 'reed') {
    // a tapering three-sided rod (base radius 3.5 cm at scale 1) tipped with a bead
    const rings = [[0, 1.0, 0], [0.5, 0.8, 0], [0.92, 0.55, 0], [0.955, 2.3, 1], [0.985, 2.1, 1], [1.0, 0.3, 1]];
    rings.forEach(([t, r, bead], j) => {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        P.push(Math.cos(a) * r * 0.035, t, Math.sin(a) * r * 0.035); N.push(Math.cos(a), 0, Math.sin(a)); D.push(t, [1, -1, 0][k], bead, 999);
      }
      if (j) for (let k = 0; k < 3; k++) { const a = (j - 1) * 3 + k, b = (j - 1) * 3 + (k + 1) % 3; I.push(a, b, b + 3, a, b + 3, a + 3); }
    });
  } else {
    // a clear blade: one lens-curved sheet, half-width 1 m at scale 1, drawn two-sided
    const NS = 12, CS = [-1, -0.4, 0.4, 1];
    for (let j = 0; j <= NS; j++) {
      const t = j / NS, w = (0.3 + 0.7 * Math.sin(Math.PI * (0.12 + 0.6 * t))) * (1 - t * t * t) + 0.02;
      for (const c of CS) { P.push(c * w, t, 0.12 * w * (1 - c * c)); const l = Math.hypot(c * 0.7, 1); N.push((-c * 0.7) / l, 0, 1 / l); D.push(t, c, 1, (1 - Math.abs(c)) * w); }
      if (j) for (let k = 0; k < 3; k++) { const a = (j - 1) * 4 + k; I.push(a, a + 1, a + 5, a, a + 5, a + 4); }
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 4)); g.setIndex(I);
  return g;
}
function setInstances(g, a0, a1, count) {
  g.setAttribute('aI0', new THREE.InstancedBufferAttribute(a0.subarray(0, count * 4), 4));
  if (a1) g.setAttribute('aI1', new THREE.InstancedBufferAttribute(a1.subarray(0, count * 4), 4));
  g.instanceCount = count;
  return g;
}

// ---------- floats: clear lens-shaped drifters, each holding one ring of bands round the weight beneath it ----------
// aD: x = r (0 centre .. 1 rim), y = angle;  aI0: x, z, radius, phase
const FLOAT_VERT = /* glsl */`
attribute vec2 aD; attribute vec4 aI0;
uniform float uTime;
varying vec3 vWN; varying vec3 vWP; varying vec4 vK;
void main() {
  float r = aD.x, R = aI0.z, ph = aI0.w;
  vec2 c = aI0.xy + 1.2 * vec2(sin(uTime * 0.07 + ph), cos(uTime * 0.053 + ph * 1.7));
  float sw = sin(c.x * 0.07 + c.y * 0.045 + uTime * 0.5), bob = 0.05 * sin(uTime * 0.9 + ph * 3.0) + 0.04 * sw;
  vec2 tl = 0.07 * vec2(sin(uTime * 0.8 + ph * 5.0), cos(uTime * 0.67 + ph * 2.0));       // rocking
  vec3 p = vec3(position.x * R, position.y * R + 0.03 + bob + R * dot(position.xz, tl), position.z * R);
  vec4 wp = modelMatrix * vec4(p.x + c.x, p.y, p.z + c.y, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * normalize(normal + vec3(tl.x, 0.0, tl.y));
  float breathe = 0.80 + 0.20 * sin(uTime * 0.9 + ph * 3.0);
  float ring = exp(-(r - 0.36) * (r - 0.36) / 0.035);
  vK = vec4(breathe * ring + 0.35 * (1.0 - smoothstep(0.0, 0.12, r)), 1.0, mix(1.0, 0.25, smoothstep(40.0, 170.0, distance(cameraPosition, wp.xyz))), min((1.0 - r) * R, abs(r - 0.09) * R * 2.0 + 0.02));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
function floatGeometry() {
  const P = [], N = [], D = [], I = [], SEG = 10, RS = [0.09, 0.36, 0.62, 0.86, 1.0];
  P.push(0, 0.2, 0); N.push(0, 1, 0); D.push(0, 0);
  RS.forEach((r, j) => {
    for (let k = 0; k < SEG; k++) {
      const a = (k / SEG) * Math.PI * 2, y = 0.2 * (1 - r * r);
      P.push(Math.cos(a) * r, y, Math.sin(a) * r); const l = Math.hypot(r * 0.55, 1); N.push((Math.cos(a) * r * 0.55) / l, 1 / l, (Math.sin(a) * r * 0.55) / l); D.push(r, a);
      const k2 = (k + 1) % SEG, b = 1 + j * SEG;
      if (j === 0) I.push(0, b + k2, b + k); else I.push(b - SEG + k, b - SEG + k2, b + k2, b - SEG + k, b + k2, b + k);
    }
  });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 2)); g.setIndex(I);
  return g;
}

// ---------- gliders: clear fliers of 2.4 m span whose wing roots flash straw then magenta at each downstroke ----------
// aD: x = span 0..1, y = side (-1, 1; 0 body), z = wing (1) or body (0), w = metres behind the leading edge
// aG: offset along the stream, across it, up, phase
const GLIDER_VERT = /* glsl */`
attribute vec4 aD; attribute vec4 aG;
uniform float uTime; uniform vec3 uGC, uGH; uniform vec2 uGS;   // flock centre, heading (unit, level), stream axis (unit xz)
varying vec3 vWN; varying vec3 vWP; varying vec4 vK; varying vec2 vG;
void main() {
  float ph = aG.w, cyc = uTime / 1.4 + ph, beat = sin(6.2832 * cyc);
  vG = vec2(aD.x, aD.w / (0.64 * (1.0 - 0.75 * aD.x * sqrt(max(aD.x, 0.0))) + 0.03)) * aD.z;      // span and chord fraction, for the blade's spar, veins and rim
  float flap = 0.62 * beat + 0.30, s = aD.x * 1.2;       // wings beat about a raised V, so a level lens always sees blade, not an edge
  vec3 p = position; vec3 nn = normal;
  if (aD.z > 0.5) {
    float ang = flap * (0.55 + 0.45 * aD.x), ca = cos(ang), sa = sin(ang);
    p.y = s * sa + position.y; p.z = aD.y * s * ca;
    nn = vec3(0.0, ca, -aD.y * sa);
  }
  p.y -= 0.16 * beat;                                             // the body rides against the wings
  vec3 H = uGH, S = vec3(-H.z, 0.0, H.x);
  vec3 wob = vec3(sin(uTime * 0.31 + ph * 9.0), sin(uTime * 0.43 + ph * 5.0), sin(uTime * 0.27 + ph * 13.0)) * vec3(2.2, 1.1, 2.2);
  vec3 c = uGC + vec3(uGS.x, 0.0, uGS.y) * aG.x + vec3(-uGS.y, 0.0, uGS.x) * aG.y + vec3(0.0, aG.z, 0.0) + wob;
  float roll = 0.45 * sin(uTime * 0.43 + ph * 5.0);
  p.yz = vec2(p.y * cos(roll) - p.z * sin(roll), p.y * sin(roll) + p.z * cos(roll));
  nn.yz = vec2(nn.y * cos(roll) - nn.z * sin(roll), nn.y * sin(roll) + nn.z * cos(roll));
  vec3 w = c + H * p.x + S * p.z + vec3(0.0, p.y, 0.0);
  vec4 wp = modelMatrix * vec4(w, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * (H * nn.x + S * nn.z + vec3(0.0, nn.y, 0.0));
  // the flash: 0.3 s at the top of each downstroke, straw on the way up the ramp and magenta at the peak
  float f = fract(cyc - 0.22), fl = smoothstep(0.0, 0.07, f) * (1.0 - smoothstep(0.12, 0.28, f));
  float root = (1.0 - aD.x) * (0.35 + 0.65 * (1.0 - aD.x));       // the inner half of each wing takes the colour
  vK = vec4((0.07 + 0.93 * fl * root) * aD.z + 0.5 * fl * (1.0 - aD.z), mix(0.9, -0.9, aD.z), 1.0, aD.w * 0.6);   // w scaled: a broader leading-edge line
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
function gliderGeometry() {
  const P = [], N = [], D = [], I = [];
  const body = [[0.95, 0.012], [0.55, 0.075], [-0.35, 0.06], [-0.95, 0.012]];
  body.forEach(([x, r], j) => {
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.52; P.push(x, Math.sin(a) * r, Math.cos(a) * r); N.push(0, Math.sin(a), Math.cos(a)); D.push(0, 0, 0, 999); }
    if (j) for (let k = 0; k < 3; k++) { const a = (j - 1) * 3 + k, b = (j - 1) * 3 + (k + 1) % 3; I.push(a, b, b + 3, a, b + 3, a + 3); }
  });
  for (const side of [-1, 1]) {
    const base = P.length / 3, NSP = 5;
    for (let j = 0; j <= NSP; j++) {
      const s = j / NSP, lead = 0.36 - 0.55 * s * s, chord = 0.64 * (1 - 0.75 * s * Math.sqrt(s)) + 0.03;      // a slender swept blade
      for (let e = 0; e < 3; e++) { const f = e / 2; P.push(lead - chord * f, 0.03 * Math.sin(Math.PI * f), side * s * 1.2); N.push(0, 1, 0); D.push(s, side, 1, chord * f); }
      if (j) for (let e = 0; e < 2; e++) { const a = base + (j - 1) * 3 + e; I.push(a, a + 1, a + 4, a, a + 4, a + 3); }
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 4)); g.setIndex(I);
  return g;
}

// ---------- ribbon-flexors (a seeded cast): clear swimmers 8 m long that carry one band down the body ----------
// aD: x = s along the body (0 head .. 1 tail), y = c across (-1..1);  aI0: orbit centre x, z, radius, phase;  aI1: speed, length, width
const FLEX_VERT = /* glsl */`
attribute vec2 aD; attribute vec4 aI0; attribute vec4 aI1;
uniform float uTime;
varying vec3 vWN; varying vec3 vWP; varying vec4 vK;
void main() {
  float s = aD.x, R = max(aI0.z, 4.0), ph = aI0.w;
  float ang = ph + uTime * aI1.x / R - s * aI1.y / R * sign(aI1.x);
  float und = sin(s * 7.0 - uTime * 3.1 + ph * 4.0) * (0.15 + 0.85 * s);
  float rad = R + 0.55 * und + aD.y * aI1.z * (1.0 - 0.75 * s * s) * (0.35 + 0.65 * smoothstep(0.0, 0.12, s));
  float y = 0.16 + 0.10 * cos(s * 7.0 - uTime * 3.1 + ph * 4.0) * aD.y + 0.05 * sin(uTime * 0.9 + ph);
  vec4 wp = modelMatrix * vec4(aI0.x + cos(ang) * rad, y, aI0.y + sin(ang) * rad, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * normalize(vec3(cos(ang) * aD.y * 0.6, 1.0, sin(ang) * aD.y * 0.6));
  float b = s - fract(uTime * 0.23 + ph);
  float N = 1.35 * exp(-b * b / 0.012) + 0.5 * (1.0 - smoothstep(0.0, 0.1, s));
  vK = vec4(N, -0.8, 1.0, (1.0 - abs(aD.y)) * aI1.z);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
function flexGeometry() {
  const P = [], D = [], I = [], NS = 22, CS = [-1, 0, 1];
  for (let j = 0; j <= NS; j++) {
    for (const c of CS) { P.push(0, 0, 0); D.push(j / NS, c); }
    if (j) for (let k = 0; k < 2; k++) { const a = (j - 1) * 3 + k; I.push(a, a + 1, a + 4, a, a + 4, a + 3); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 2)); g.setIndex(I);
  return g;
}

// ---------- the country of lesser arches, baked into one geometry; peacock eyes at their feet breathe ----------
// aD: x = fringe order at rest, y = phase, z = metres to the nearest arris
const FAR_VERT = /* glsl */`
attribute vec3 aD;
uniform float uTime;
varying vec3 vWN; varying vec3 vWP; varying vec4 vK;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * normal;
  vK = vec4(aD.x * (0.88 + 0.12 * sin(uTime * 0.7 + aD.y)), 1.0, 1.0, aD.z);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
function farArchGeometry(list) {
  const P = [], N = [], D = [], I = [];
  for (const A of list) {
    const { x, z, span, rise, yaw, ph } = A, h = span / 2, th = span * 0.075, wd = span * 0.055, ST = 30;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), rows = [];
    for (let i = 0; i <= ST; i++) {
      const t = -1.06 + (2.12 * i) / ST, mx = h * t, my = rise * (1 - t * t);
      const l = Math.hypot(h, 2 * rise * t), nx = (2 * rise * t) / l, ny = h / l;            // in-plane normal of the midline
      const thick = th * (1 + 0.5 * t * t), foot = Math.pow(sm(0.5, 1.0, Math.abs(t)), 1.5);
      const order = 2.7 * foot + 0.25 * (1 - Math.abs(t)), row = [];
      // four faces: back, +w flank, underside, -w flank; each with its own two vertices
      const corner = (a, w) => [mx + nx * a * thick / 2, my + ny * a * thick / 2, w * wd];
      const faces = [[[1, -1], [1, 1], [nx, ny, 0], 2 * wd], [[1, 1], [-1, 1], [0, 0, 1], thick], [[-1, 1], [-1, -1], [-nx, -ny, 0], 2 * wd], [[-1, -1], [1, -1], [0, 0, -1], thick]];
      for (const [c0, c1, n, fw] of faces) {
        const trio = [];
        for (const [c, e] of [[c0, 0], [[(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2], fw / 2], [c1, 0]]) {
          const q = corner(c[0], c[1]);
          P.push(x + q[0] * cy + q[2] * sy, q[1], z - q[0] * sy + q[2] * cy); N.push(n[0] * cy + n[2] * sy, n[1], -n[0] * sy + n[2] * cy);
          D.push(order * (c[0] < 0 ? 1 : 0.7), ph, e); trio.push(P.length / 3 - 1);
        }
        row.push(trio);
      }
      rows.push(row);
    }
    for (let i = 0; i < ST; i++) for (let f = 0; f < 4; f++) {
      const a = rows[i][f], b = rows[i + 1][f];
      for (let k = 0; k < 2; k++) I.push(a[k], a[k + 1], b[k + 1], a[k], b[k + 1], b[k]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 3)); g.setIndex(I);
  return g;
}

const SKIES = {
  pearl:   { zen: '#A5A6AD', hor: '#CECAC3', veil: '#7F8098', patch: [0.020, 0.019, 0.016], glint: 1.6, mist: 0, veilAmt: 1, sand: '#A9A398', deep: '#44575F', exposure: 1.0 },
  sunveil: { zen: '#A29E96', hor: '#D6CEBC', veil: '#8A879E', patch: [0.075, 0.066, 0.046], glint: 1.9, mist: 0, veilAmt: 1, sand: '#AFA690', deep: '#485B56', exposure: 0.98 },
  mist:    { zen: '#8F9199', hor: '#B2B2B9', veil: '#84859A', patch: [0.016, 0.016, 0.016], glint: 1.3, mist: 1, veilAmt: 0.75, sand: '#A6A198', deep: '#43555D', exposure: 1.0 },
  dusk:    { zen: '#6A6E86', hor: '#8E8C9E', veil: '#5D5F7C', patch: [0.030, 0.028, 0.034], glint: 1.5, mist: 0, veilAmt: 1, sand: '#807D88', deep: '#333A4C', exposure: 1.12 },
};

export default {
  id: 'weight-of-glass',
  name: 'The Weight of Glass',
  category: 'alien',
  weirdness: 0.6,
  media: ['air', 'open', 'water'],
  async build(ctx) {
    const vary = ctx.vary ?? {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const vr = ctx.rng.fork('looks'), rng = ctx.rng.fork('scatter');
    const rare = !!vary.rare;
    // ---- the seeded look
    const hour = vary.hour ?? 'any';
    const skyKind = hour === 'night' ? 'dusk' : (hour === 'dawn' || hour === 'golden') ? 'sunveil' : hour === 'day' ? vr.pick(['pearl', 'pearl', 'mist']) : vr.pick(['sunveil', 'pearl', 'mist', 'pearl', 'sunveil', 'pearl', 'mist']);
    const loadPick = vr.pick(['nine', 'nine', 'clump', 'giant']), loadKind = rare ? 'nine' : loadPick;
    const glassKind = vr.pick(['clear', 'clear', 'clear', 'smoke', 'deep']);
    const gale = vr.chance(0.3), withFlexors = vr.chance(0.55);
    const nGliders = Math.max(28, Math.round(vr.int(40, 70) * Math.min(1.15, density) * detail));
    const SK = SKIES[skyKind];

    const scene = new THREE.Scene();
    scene.background = lin(SK.hor);
    const hero = await buildHero(ctx, { palette: PALETTE, detail, glass: glassKind, load: loadKind, herd: rare ? 'even' : undefined, padBeat: rare ? 0.46 : 0.4, reflection: false, preview: false });
    scene.add(hero.object);
    scene.add(hero.makeReflection());
    const HU = hero.uniforms;
    HU.uZen.value.copy(lin(SK.zen)); HU.uHor.value.copy(lin(SK.hor)); HU.uGlint.value = SK.glint;
    if (skyKind === 'mist') HU.uVeil.value = 1350;
    // the hero's glass bends the same analytic sky, veil and sea the world draws, so they share these uniforms
    HU.uVeilC.value.copy(lin(SK.veil)); HU.uPatch.value.set(...SK.patch); HU.uMistC.value.copy(lin('#D0CFCC')); HU.uMist.value = SK.mist; HU.uVeilAmt.value = SK.veilAmt;
    HU.uSand.value.copy(lin(SK.sand)); HU.uDeep.value.copy(lin(SK.deep));
    const sunDir = HU.uSunDir.value;
    await ctx.yield();

    // ---- the path: the artist's line through the Span (entry, under the haunch, up the flank, over the crown, the long turn, the oculus)
    const path = makePath(hero.anchors.flyThrough);
    const A = hero.anchors;
    // THE SCRIPT CLOCK. Every scripted moment of the herd was written against the first line of flight (820 m; under the
    // haunch at 0.411, over the crown at 0.585). This line is shorter before the Span and longer after it, so the script
    // reads so(u): the old progress at the same place. un() is its inverse, for placing moments in u.
    const L = path.length, _sp = new THREE.Vector3();
    const scanD = (x, y, z) => { let best = 1e9, bd = 0; for (let i = 0; i <= 1500; i++) { path.posAtDist((i / 1500) * L, _sp); const dd = (_sp.x - x) ** 2 + (_sp.y - y) ** 2 + (_sp.z - z) ** 2; if (dd < best) { best = dd; bd = (i / 1500) * L; } } return bd; };
    const dU = scanD(-73, 26, 0), dC = scanD(0, 104, 0), OL = 819.8, OU = 0.411, OC = 0.585;
    const so = (u) => { const d = u * L; return d < dU ? OU - (dU - d) / OL : d < dC ? OU + ((d - dU) / (dC - dU)) * (OC - OU) : OC + ((d - dC) / (L - dC)) * (1 - OC); };
    const un = (o) => (o < OU ? dU - (OU - o) * OL : o < OC ? dU + ((o - OU) / (OC - OU)) * (dC - dU) : dC + ((o - OC) / (1 - OC)) * (L - dC)) / L;
    await ctx.yield();

    // shared uniforms: everything of the hero's, plus the wind, the flock and the mist
    const U = { ...HU,
      uWind: { value: new THREE.Vector4(0.83, 0.55, gale ? 0.8 : 0.07, gale ? 0.6 : 0.95) },
      uGust: { value: new THREE.Vector4(0, 0, 40, 0) },
      uGC: { value: new THREE.Vector3() }, uGH: { value: new THREE.Vector3(1, 0, 0) }, uGS: { value: new THREE.Vector2(1, 0) },
      uRings: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 99, 0)) },
    };

    // ---- sky dome and sea
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3500, 40, 20), new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);
    const sea = new THREE.Mesh(new THREE.CircleGeometry(3400, 72), new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG.replace('uRings[8]', 'uRings[16]').replace('i < 8', 'i < 16'), transparent: true, depthWrite: false, fog: false }));
    sea.rotation.x = -Math.PI / 2; sea.renderOrder = 5; sea.frustumCulled = false; scene.add(sea);
    const mirror = new THREE.Group(); mirror.scale.y = -1; scene.add(mirror);
    await ctx.yield();

    // ---- where things may stand: off the lane, out of the glass
    const inGlass = (x, z, m = 0) => (Math.abs(Math.abs(x) - 152) < 33 + m && Math.abs(z) < 38 + m) || (Math.abs(x) < 135 + m && Math.abs(z) < 15 + m && Math.abs(x) > 96 - m);
    const lane = (x, z) => { const n = path.nearestXZ(x, z); return n.y < 34 ? n.dist : 99; };
    const P3 = new THREE.Vector3(), T3 = new THREE.Vector3();
    const at = (u) => path.pointAt(u, new THREE.Vector3());
    const dirAt = (u) => { const t = path.tangentAt(u, new THREE.Vector3()); t.y = 0; return t.lengthSq() > 1e-6 ? t.normalize() : t.set(0, 0, 1); };

    // ---- reeds: beds beside the lane wherever the flight is low, and loose beds farther out
    const beds = [];
    for (let d = 14; d < path.length - 40; d += rng.range(34, 52)) {
      path.posAtDist(d, P3); path.tangentAtDist(d, T3);
      if (P3.y > 42) continue;                           // seen from the air a bed is only specks: beds stand where the flight is low
      for (const side of rng.chance(0.5) ? [1, -1] : [-1, 1]) {
        if (rng.chance(0.2)) continue;
        const r = rng.range(11, 24), off = side * (r * rng.range(0.55, 1.0) + rng.range(3, 16) + (P3.y > 34 ? 10 : 0));
        beds.push([P3.x + T3.z * off + T3.x * rng.range(-10, 10), P3.z - T3.x * off + T3.z * rng.range(-10, 10), r]);
      }
    }
    for (let i = 0; i < 16; i++) { const a = rng.range(0, 6.283), rr = rng.range(120, 480); beds.push([Math.cos(a) * rr * 1.2, Math.sin(a) * rr - 60, rng.range(16, 32)]); }
    // the entry's foreground: one bed of tall rods to port of the lane, 20 to 45 m ahead of the first view (twice in the list: twice as dense)
    for (let k = 0; k < 1; k++) beds.push([-85, -163, 12, 1]);
    const nReed = Math.round(5200 * detail * Math.min(1.2, 0.5 + 0.5 * density)), r0 = new Float32Array(nReed * 4), r1 = new Float32Array(nReed * 4);
    let nr = 0;
    for (let guard = 0; nr < nReed && guard < nReed * 6; guard++) {
      const b = beds[guard % beds.length], a = rng.range(0, 6.283), rr = b[2] * Math.pow(rng(), 0.7);
      const cl = ctx.noise.n2(b[0] * 0.3 + Math.cos(a) * rr * 0.16, b[1] * 0.3 + Math.sin(a) * rr * 0.16);     // tussocks within the bed
      if (cl < -0.25) continue;
      const x = b[0] + Math.cos(a) * rr, z = b[1] + Math.sin(a) * rr;
      if (inGlass(x, z, 3) || lane(x, z) < 5.5) continue;
      const edge = 1 - 0.45 * (rr / b[2]), h = rng.range(2, 5) * edge * (b[3] ? 1.3 : 1);
      r0.set([x, z, h, rng.range(0, 6.283)], nr * 4);
      r1.set([rng.range(0, 6.283), rng.range(0.8, 1.35) * (b[3] ? 2.3 : 1), rng.range(0.02, 0.1), rng.range(0.16, 0.3)], nr * 4);
      nr++;
    }
    const reedMat = wispMaterial(U, STEM_VERT, { REED: 1 });
    wispMesh(scene, mirror, setInstances(stemGeometry('reed'), r0, r1, nr), reedMat, false);
    await ctx.yield();

    // ---- blade-trees: fans of clear leaning blades on low reefs of glass shards, 120 to 500 m off
    const trees = [], b0 = [], b1 = [];
    for (let guard = 0; trees.length < 14 && guard < 600; guard++) {
      const a = rng.range(0, 6.283), rr = rng.range(150, 520), x = Math.cos(a) * rr * 1.15, z = Math.sin(a) * rr - 40;
      if (inGlass(x, z, 60) || path.nearestXZ(x, z).dist < 55 || trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 90)) continue;
      trees.push([x, z]);
      const lean = rng.range(0, 6.283), nb = rng.int(3, 5);
      for (let k = 0; k < nb; k++) {                       // the tall blades
        const h = rng.range(30, 60) * (k ? rng.range(0.55, 0.95) : 1), az = lean + rng.range(-0.9, 0.9);
        b0.push(x + rng.range(-5, 5), z + rng.range(-5, 5), h, rng.range(0, 6.283)); b1.push(az, h * rng.range(0.055, 0.08), rng.range(0.1, 0.3), rng.range(0.035, 0.06));
      }
      for (let k = 0; k < 9; k++) {                        // the reef: short shards round the roots
        const h = rng.range(2.5, 9), ra = rng.range(0, 6.283), rd = rng.range(2, 15);
        b0.push(x + Math.cos(ra) * rd, z + Math.sin(ra) * rd, h, rng.range(0, 6.283)); b1.push(ra + rng.range(-0.5, 0.5), h * rng.range(0.12, 0.2), rng.range(0.15, 0.5), 0.02);
      }
    }
    // a few shard reefs right beside the lane, so the low flight always has glass at hand
    for (const u of [0.10, 0.145, 0.83]) {
      const c = at(u), t = dirAt(u), side = rng.chance(0.5) ? 1 : -1, off = side * rng.range(16, 26);
      const x = c.x + t.z * off, z = c.z - t.x * off;
      if (inGlass(x, z, 8)) continue;
      for (let k = 0; k < 7; k++) {
        const h = rng.range(2, 7.5), ra = rng.range(0, 6.283), rd = rng.range(0, 6);
        const bx = x + Math.cos(ra) * rd, bz = z + Math.sin(ra) * rd;
        if (lane(bx, bz) < 9) continue;
        b0.push(bx, bz, h, rng.range(0, 6.283)); b1.push(ra, h * rng.range(0.1, 0.17), rng.range(0.1, 0.45), 0.03);
      }
    }
    // two blade-trees placed by hand on the outside of the long turn, for the high open stretch (u 0.62-0.80): the tall
    // one stands in the left third of the view at u 0.75, its mirror image under it; both lean away from the lane
    for (const [x, z, az, hs] of [[68, -193, -1.33, [58, 44, 33, 38, 26]], [140, -172, -0.3, [50, 38, 28, 33]]]) {
      trees.push([x, z]);
      hs.forEach((h, k) => {
        b0.push(x + [0, 6, -5, -9, 9][k], z + [0, -4, 5, -3, 4][k], h, 1.7 * k + 0.4); b1.push(az + [0, 0.55, -0.5, -0.95, 1.0][k], h * 0.095, [0.30, 0.36, 0.24, 0.42, 0.4][k], 0.045);
      });
      for (let k = 0; k < 9; k++) {
        const ra = k * 0.7 + 0.3, rd = 3 + (k * 5) % 12, h = 3 + (k * 3.7) % 6;
        b0.push(x + Math.cos(ra) * rd, z + Math.sin(ra) * rd, h, k * 1.3); b1.push(ra + 0.3, h * 0.16, 0.2 + 0.03 * k, 0.02);
      }
    }
    // an outer ring of groves: twelve more blade-trees, one in each twelfth of a turn round the Span's centre, 300 to 480 m
    // out, each built as the seeded ones above. Their dice come from a stream of their own (the seed and a name, no draw
    // from rng) and ALL of a grove's dice are drawn before its one test: a grove within 90 m of a tree above is not built.
    const og = ctx.core.makeRng(ctx.core.hashSeed('outer-groves:' + ctx.seed));
    for (let i = 0; i < 12; i++) {
      const a = ((i + og.range(0.15, 0.85)) / 12) * 6.283, rr = og.range(300, 480), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      const lean = og.range(0, 6.283), nb = og.int(3, 5), g0 = [], g1 = [];
      for (let k = 0; k < nb; k++) {                       // the tall blades
        const h = og.range(30, 60) * (k ? og.range(0.55, 0.95) : 1), az = lean + og.range(-0.9, 0.9);
        g0.push(x + og.range(-5, 5), z + og.range(-5, 5), h, og.range(0, 6.283)); g1.push(az, h * og.range(0.055, 0.08), og.range(0.1, 0.3), og.range(0.035, 0.06));
      }
      for (let k = 0; k < 9; k++) {                        // the reef: short shards round the roots
        const h = og.range(2.5, 9), ra = og.range(0, 6.283), rd = og.range(2, 15);
        g0.push(x + Math.cos(ra) * rd, z + Math.sin(ra) * rd, h, og.range(0, 6.283)); g1.push(ra + og.range(-0.5, 0.5), h * og.range(0.12, 0.2), og.range(0.15, 0.5), 0.02);
      }
      if (!trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 90)) { b0.push(...g0); b1.push(...g1); }   // it does not stand in a live tree
    }
    const bladeMat = wispMaterial(U, STEM_VERT);
    wispMesh(scene, mirror, setInstances(stemGeometry('blade'), new Float32Array(b0), new Float32Array(b1), b0.length / 4), bladeMat, true);

    // ---- floats: most within 70 m of the lane, the rest out to 450 m
    const nFloat = Math.round(520 * detail * Math.min(1.2, density)), f0 = new Float32Array(nFloat * 4);
    let nf = 0;
    for (let guard = 0; nf < nFloat && guard < nFloat * 8; guard++) {
      let x, z;
      if (rng.chance(0.72)) { path.posAtDist(rng.range(0, path.length - 30), P3); const a = rng.range(0, 6.283), rr = 3 + 52 * Math.pow(rng(), 1.6); x = P3.x + Math.cos(a) * rr; z = P3.z + Math.sin(a) * rr; }
      else { const a = rng.range(0, 6.283), rr = rng.range(60, 450); x = Math.cos(a) * rr; z = Math.sin(a) * rr - 60; }
      if (inGlass(x, z, 2.5)) continue;
      f0.set([x, z, rng.range(0.5, 1.5) * (rng.chance(0.15) ? 1.4 : 1), rng.range(0, 6.283)], nf * 4); nf++;
    }
    wispMesh(scene, mirror, setInstances(floatGeometry(), f0, null, nf), wispMaterial(U, FLOAT_VERT), false);
    await ctx.yield();

    // ---- gliders: one loose stream; where it flies is scripted from u in update()
    const g0 = new Float32Array(nGliders * 4);
    for (let i = 0; i < nGliders; i++) {
      const s = rng.range(-1, 1), along = s * 27 + rng.range(-4, 4);
      g0.set([along, 0.6 * rng.range(0, 9) + 1.5 * Math.abs(s), 0.6 * (rng.range(-4, 4) + 2 * Math.sin(s * 3)), 0.5 + along * 0.03 + rng.range(-0.06, 0.06)], i * 4);   // phase runs along the stream: slow waves of flashes
    }
    const gliderGeo = gliderGeometry(); gliderGeo.setAttribute('aG', new THREE.InstancedBufferAttribute(g0, 4)); gliderGeo.instanceCount = nGliders;
    wispMesh(scene, mirror, gliderGeo, wispMaterial(U, GLIDER_VERT, { GLIDER: 1 }), true);

    // ---- ribbon-flexors (a seeded cast): schools circling the piers and two shoals beside the lane
    if (withFlexors) {
      const nFlex = Math.round(44 * detail), x0 = new Float32Array(nFlex * 4), x1 = new Float32Array(nFlex * 4);
      const eA = at(0.13), eB = at(0.80);
      const hubs = [[-152, 0, 48, 74], [152, 0, 48, 74], [eA.x + 30, eA.z + 10, 6, 22], [eB.x - 12, eB.z - 24, 6, 26]];
      for (let i = 0; i < nFlex; i++) {
        const hb = hubs[i % hubs.length], dirn = hb[2] > 20 ? 1 : (i % 8 < 4 ? 1 : -1);
        x0.set([hb[0], hb[1], rng.range(hb[2], hb[3]), rng.range(0, 6.283)], i * 4);
        x1.set([dirn * rng.range(2.2, 3.4), rng.range(6.5, 9.5), rng.range(0.32, 0.5), 0], i * 4);
      }
      wispMesh(scene, mirror, setInstances(flexGeometry(), x0, x1, nFlex), wispMaterial(U, FLEX_VERT), false);
    }

    // ---- the country of lesser arches, out to the veil
    const far = [], nFar = Math.max(7, Math.round(12 * detail));
    for (let i = 0, guard = 0; far.length < nFar && guard < 400; guard++) {
      const a = ((far.length + rng.range(0.15, 0.85)) / nFar) * 6.283 + 0.4, rr = rng.range(700, 2500);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr, span = rng.range(60, 150) * (1 + rr / 2600);
      if (path.nearestXZ(x, z).dist < 150 + span || far.some((f) => Math.hypot(f.x - x, f.z - z) < 260)) continue;
      far.push({ x, z, span, rise: span * rng.range(0.3, 0.46), yaw: rng.range(0, 3.1416), ph: rng.range(0, 6.283) });
    }
    wispMesh(scene, mirror, farArchGeometry(far), wispMaterial(U, FAR_VERT), true);
    await ctx.yield();

    // ---- three waders in the shallows (the hero's walker, on the same gait clock)
    const NWAD = 3, waders = new THREE.InstancedMesh(hero.walkerGeometry, hero.walkerMaterial, NWAD);
    waders.frustumCulled = false; waders.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(waders);
    const wadersR = new THREE.InstancedMesh(hero.walkerGeometry, hero.walkerMaterial, NWAD);
    wadersR.instanceMatrix = waders.instanceMatrix; wadersR.frustumCulled = false; mirror.add(wadersR);
    // each stands at its spot when the script clock reads its moment: the first 45 m ahead and to port of the lane at
    // u 0.08, walking across the view, whole, over its mirror image; the second beside the low turn at u 0.70; the
    // third near the tall blade-tree
    const wad = [[so(0.08), -70, -91, 0.25], [so(0.70), 118, -170, -0.5], [so(0.60), 52, -203, 2.6]].map(([u, x, z, yaw], i) => (
      { u, x, z, dx: Math.cos(yaw), dz: Math.sin(yaw), ph: hero.herd[i].ph, sc: hero.herd[i].sc > 1.6 ? 1 : hero.herd[i].sc }));

    // ---- THE ROUND: nine more ballast-walkers wade a ring about the pierced pier, in three files of three (40 m apart in a
    // file, centre to centre, the files a third of the ring apart), one calf to a file: twelve bodies, each with its mirror
    // image in the sea. A thing of the place. The ring's centre is the pier's own axis (the hero's oculus anchor). Its radius
    // starts as the Span's own half-span (the hero's crown and springing anchors: 118 m) and is drawn in, never out, until the
    // band the herd sweeps (6 m outside the ring; 13.5 m inside, where the calves walk) stands clear of every blade live has
    // laid (b0 and b1, read, never written) that is taller than the belly of the smallest adult the round can deal, as it
    // wades: by 6 m from the root of a blade over 12 m, and from the root of a shorter one by that blade's own reach (its
    // half-breadth, and its lean at the tip: b1's lean times its height). The belly's height is read from the walker's own
    // vertices. A guard: the ring comes no nearer the pier's axis than twice the distance from that axis to the Span's far
    // springing (68 m; the pierced block's corner stands 46 m from the axis, so a calf keeps 8 m of water off its glass); on
    // a visit whose blades would draw the ring nearer, the round does not come (no body, no ring source).
    // Said plainly: the half-span is the start, and not the pier's distance from the crown (152 m), because of where live's
    // waders walk: as live lays them, the first wader's track ends 144 m from the pier's axis, and a ring of 118 m or less
    // leaves over 10 m of water between a hull of the round and that wader's hull. That was looked at on the whole field (the
    // waders' places and tracks are the same on every seed); NOTHING OF THE WADERS IS READ HERE, so if a wader's place or
    // moment is ever changed the ring does not follow it. The round walks on the world's clock and live's waders on the
    // herd's progress; with the band clear of their ground, no pairing of the two clocks brings two hulls together.
    // Nothing of the route, the lens or the share of the flight is read: the herd walks on the world clock at the design's
    // 3 m/s. The walker is live's: the hero's geometry buffers and shader text and the hero's uniform objects, with a gait
    // travel and gait phases of the round's own. Live's waders' sink into the sand (here scaled with the body) and live's ring
    // law are copied from the waders' lines in update(): live gives neither a name to call. Dice: one stream of its own
    // (the seed and a name), every die drawn, none tested: the direction, the start, then file by file three scales and gait
    // phases, which walker has the calf, and the calf's gait phase (on a visit the guard holds, only the first two).
    const RD = { cx: A.oculus.x, cz: A.oculus.z, R: Math.hypot(A.springings[1].x - A.crown.x, A.springings[1].z - A.crown.z), sink: 0.45, list: [] };
    {
      const wp = hero.walkerGeometry.attributes.position, wa = hero.walkerGeometry.attributes.aA, scLo = 0.9, scHi = 1.1;
      let nose = 0, belly = Infinity;                      // the walker's nose (its farthest vertex forward) and the lowest vertex of its body (plates and belly: aA.z 0)
      for (let i = 0; i < wp.count; i++) { nose = Math.max(nose, wp.getX(i)); if (wa.getZ(i) < 0.5) belly = Math.min(belly, wp.getY(i)); }
      const low = scLo * (belly - RD.sink);                // how high the smallest adult's belly stands over the sand
      for (let again = true; again;) {
        again = false;
        for (let i = 0; i < b0.length; i += 4) {
          const h = b0[i + 2]; if (h <= low) continue;
          const keep = h > 12 ? 6 : b1[i + 1] + b1[i + 2] * h, q = Math.hypot(b0[i] - RD.cx, b0[i + 1] - RD.cz);
          if (RD.R > q - 6 - keep && RD.R < q + 13.5 + keep) { RD.R = q - 6 - keep; again = true; }
        }
      }
      const rd = ctx.core.makeRng(ctx.core.hashSeed('wading-round:' + ctx.seed)), C = 2 * Math.PI * RD.R;
      RD.turn = rd.chance(0.5) ? 1 : -1; RD.start = rd.range(0, C / 3);
      const files = RD.R < 2 * Math.hypot(RD.cx - A.springings[1].x, RD.cz - A.springings[1].z) ? 0 : 3;   // the guard
      for (let f = 0; f < files; f++) {
        const base = RD.list.length;
        for (let i = 0; i < 3; i++) RD.list.push({ s: (f * C) / 3 + i * 40, r: RD.R, sc: rd.range(scLo, scHi), ph: rd.range(0, 1), k: 1 });
        const par = RD.list[base + rd.int(0, 2)], sc = 0.5 * par.sc;
        // the calf: half its parent's size, 10 m to the pier side of it, its nose 5 m behind its parent's nose (s is metres on the adults' ring)
        RD.list.push({ s: par.s + ((nose * (par.sc - sc) - 5) * RD.R) / (RD.R - 10), r: RD.R - 10, sc, ph: rd.range(0, 1), k: 0.5 });
      }
      // their rings: live's sea loop takes them as it takes live's sixteen (the array grows by eight a body, the two numbers in the shader text follow)
      RD.list.forEach((w, i) => { w.slot = U.uRings.value.length + i * 8; });
      for (let i = 0; i < RD.list.length * 8; i++) U.uRings.value.push(new THREE.Vector4(0, 0, 99, 0));
      const NR = U.uRings.value.length;
      sea.material.fragmentShader = sea.material.fragmentShader.replace('uRings[16]', 'uRings[' + NR + ']').replace('i < 16', 'i < ' + NR);
      // two instanced meshes (adults; calves, whose gait clock runs apart), each with its mirror image, as live's waders have
      const herdMesh = (k) => {
        const list = RD.list.filter((w) => w.k === k), g = new THREE.BufferGeometry(), hg = hero.walkerGeometry, hm = hero.walkerMaterial;
        g.setAttribute('position', hg.attributes.position); g.setAttribute('normal', hg.attributes.normal); g.setAttribute('aA', hg.attributes.aA); g.setIndex(hg.index);
        g.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(list.flatMap((w) => [w.ph, 0])), 2));
        const trav = { value: 0 }, mat = new THREE.ShaderMaterial({ uniforms: { ...HU, uTravel: trav }, vertexShader: hm.vertexShader, fragmentShader: hm.fragmentShader, fog: hm.fog, side: hm.side });
        const mesh = new THREE.InstancedMesh(g, mat, list.length); mesh.name = 'wading-round'; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh);
        const mr = new THREE.InstancedMesh(g, mat, list.length); mr.name = 'wading-round'; mr.instanceMatrix = mesh.instanceMatrix; mr.frustumCulled = false; mirror.add(mr);
        return { list, k, mesh, trav };
      };
      RD.sets = [herdMesh(1), herdMesh(0.5)];
    }

    // ---- the herd's clock. Ordinary visits: progress = u. The rare visit: the herd hurries a little after the pad
    //      lands overhead, a walker stops just short of the crown and settles, every nest pools under it, and it rises again.
    const herdProgress = (u) => {
      if (loadKind === 'giant') {       // the giant strides 2.5 times as far: a slower start (it is on the near haunch at the entry) and an easier descent
        const t = Math.min(1, Math.max(0, (u - 0.58) / 0.08)), ease = 0.08 * (t * t * t - 0.5 * t * t * t * t) + Math.max(0, u - 0.66);
        return u + 0.134 * (1 - sm(0, 0.3, u)) + 0.114 * sm(0.40, 0.57, u) - 0.58 * ease;      // ends 108 m down the far side, short of the abutment
      }
      if (!rare) return u;
      // the rare visit: the herd walks a little faster from the start (0.46 at u 0.40), is in place by u 0.50, stands
      // while the nests pool (seen side-on from the flank climb) and walks on from 0.62, as the lens leaves the crown
      if (u <= 0.40) return 1.15 * u;
      if (u < 0.50) { const x = (u - 0.40) / 0.10; return 0.46 + 0.14 * (0.82 * x + 1.11 * x * x - 0.93 * x * x * x); }
      // while one walker sits the rest plod on at a third of their pace, then pick up again
      const t = Math.min(1, Math.max(0, (u - 0.62) / 0.04));
      return 0.60 + 0.35 * (u - 0.50) + 0.65 * (u < 0.66 ? 0.02 * t * t : u - 0.64);
    };
    const holdBack = (u) => (rare ? 0.35 * Math.min(0.12, Math.max(0, u - 0.50)) * 125 : 0);       // metres the settled walker falls behind its place
    const poolAmount = (u) => (rare ? sm(0.455, 0.505, u) * (1 - sm(0.565, 0.612, u)) : 0);

    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), SC = new THREE.Vector3();
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3();
    const camW = new THREE.Vector3(), poiNest = new THREE.Vector3(), poiFlank = new THREE.Vector3(), _unused8 = 0;
    // ONE point of interest from the approach to the crown, so the gaze never swings through open sky: under the arch
    // it is in the underside overhead (12 m up: glass fills the frame); as the lens comes out past the +Z face it slides
    // over to a point inside the flank wall, a little ahead of the lens and level with the middle of the section, so the
    // climb is one glass-filled shot with the walkers along its top and the far sea seen through the wall.
    const EYE = new THREE.Vector3(-22, 80, 0);
    const spanPoi = (time, u) => {
      path.pointAt(u, poiNest); const cx = poiNest.x, cy = poiNest.y, cz = poiNest.z, k = sm(2, 18, cz), x2 = cx + 9;
      if (loadKind === 'giant') { const g = hero.herd[1].pos; poiNest.set(g.x - 4, g.y - 14, Math.max(-6, Math.min(cz + 9.5, 6))); }
      else poiNest.set(cx + 4, cy + 30, Math.max(-6, Math.min(cz + 9.5, 7)));
      poiFlank.set(x2, 86 * (1 - (x2 / 117) * (x2 / 117)) + 6, 0);
      if (rare) poiFlank.lerp(EYE, 0.7 * poolAmount(so(u) + 0.02));
      return poiNest.lerp(poiFlank, k);
    };
    const gaze = new THREE.Vector3();

    // while the world is only seen through the previous portal (u stays 0) the herd still walks: up to 24 m, easing
    // off, and the head start is given back before u 0.39 (never walking backwards) so every beat still falls at its u
    let idle = 0;
    const ahead = new THREE.Vector3(), UP4 = new THREE.Vector3(0, 4, 0), UP9 = new THREE.Vector3(0, 8, 0);
    const crownPoi = () => (loadKind === 'giant' ? ahead.copy(hero.herd[1].pos).add(UP9)
      : loadKind === 'clump' ? ahead.copy(hero.herd[3].pos).lerp(hero.herd[4].pos, 0.6).add(UP4) : ahead.copy(hero.herd[2].pos).add(UP4));
    function update(dt, time, camera, u) {
      if (u <= 0) idle = Math.max(0, Math.min(time, 60));     // the world's own clock, which already runs behind the portal
      const o0 = so(u), o = rare ? o0 + 0.02 * sm(0.40, 0.45, o0) : o0, p = herdProgress(o) + (24 * (1 - Math.exp(-idle / 12)) * (1 - sm(0.2, 0.39, o))) / 125;
      hero.setProgress(p); hero.setPool(poolAmount(o), 1, holdBack(o));
      hero.update(dt, time, camera);
      camera.getWorldPosition(camW);                     // never camera.position alone: a ride may carry the camera
      dome.position.copy(camW);
      sea.position.set(camW.x, 0, camW.z);

      // the scripted gust that runs through the reeds either side of the lane (u 0.28)
      path.pointAt(Math.min(1, u + 0.04), pa);
      U.uGust.value.set(pa.x, pa.z, 48, 1.15 * sm(0.03, 0.075, u) * (1 - sm(0.13, 0.19, u)));

      // THE GLIDER STREAM, one mesh placed three ways and blended between them (uniforms only):
      // 1. the opening: in sight from the entry as specks over the Span, closing, crossing the bow from starboard to port
      //    at u 0.115 and flying on ahead toward the crown (placed from the gaze read this frame, never a kept camera);
      // 2. the flank climb: in the world, over the back of the arch ahead of the lens, bound for the crown: the fliers in
      //    the bare corner of sky above the walkers;
      // 3. out over the sea: a ribbon that runs away from the lens, low left to far right, sliding across at u 0.52 and
      //    then leaving ahead.
      camera.getWorldDirection(gaze);
      const pitch = Math.max(-0.75, Math.min(0.2, gaze.y)), lvl = Math.sqrt(1 - pitch * pitch);
      pa.set(gaze.x, 0, gaze.z); if (pa.lengthSq() < 1e-6) pa.set(0, 0, 1); pa.normalize();
      const sx = pa.z, sz = -pa.x;                         // to port of the gaze
      const far1 = 75 * (1 - sm(0.02, 0.115, u)) + 55 * sm(0.125, 0.175, u), lim1 = 0.42 * (10 + far1);
      const s1 = Math.max(-lim1, Math.min(lim1, (u - 0.115) * 900)), reach1 = 10 + 0.25 * Math.abs(s1) + far1;
      const s3 = (0.52 - u) * 320, reach3 = 26 + 130 * sm(0.60, 0.74, u);
      const w1 = 1 - sm(0.185, 0.235, u), w3 = sm(0.40, 0.455, u), w2 = 1 - w1 - w3, k2 = sm(0.22, 0.42, u);
      const GC = U.uGC.value;
      GC.set(0, 0, 0);
      GC.x += w1 * (camW.x + pa.x * reach1 * lvl + sx * s1); GC.y += w1 * Math.max(camW.y + pitch * reach1 + 2.5 + 0.13 * far1, 6); GC.z += w1 * (camW.z + pa.z * reach1 * lvl + sz * s1);
      GC.x += w2 * (-48 + 48 * k2); GC.y += w2 * (101 + 13 * k2); GC.z += w2 * (2 - 6 * k2);
      GC.x += w3 * (camW.x + pa.x * reach3 * lvl + sx * s3); GC.y += w3 * Math.max(camW.y + pitch * reach3 - 7, 6); GC.z += w3 * (camW.z + pa.z * reach3 * lvl + sz * s3);
      // the stream's axis: across the gaze, along the arch, then away from the lens (near end to port)
      pb.set(w1 * sx + w2 + w3 * (0.55 * pa.x - 0.84 * sx), 0, w1 * sz + w3 * (0.55 * pa.z - 0.84 * sz)); if (pb.lengthSq() < 1e-6) pb.set(1, 0, 0); pb.normalize();
      const gl = 1 - 0.38 * w3;                             // the ribbon is shorter and tighter than the crossing stream: all of it is in the frame
      U.uGS.value.set(pb.x * gl, pb.z * gl);
      pc.set(w1 * (pa.x * 0.7 + sx * 0.75) + w2 + w3 * pb.x, 0, w1 * (pa.z * 0.7 + sz * 0.75) + w3 * pb.z); if (pc.lengthSq() < 1e-6) pc.set(1, 0, 0);
      U.uGH.value.copy(pc.normalize());

      // waders, and the ring each planted pad lays on the sea
      const travel = HU.uTravel.value, R = U.uRings.value;
      for (let i = 0; i < NWAD; i++) {
        const w = wad[i], adv = (p - w.u) * 125, x = w.x + w.dx * adv, z = w.z + w.dz * adv;
        Q.setFromAxisAngle(UP, Math.atan2(-w.dz, w.dx));
        M4.compose(pb.set(x, -0.45, z), Q, SC.set(w.sc, w.sc, w.sc)); waders.setMatrixAt(i, M4);
        if (i > 1) continue;
        for (let l = 0; l < 4; l++) {
          const cyc = travel / STRIDE + w.ph + HIPS[l][2], fr = cyc - Math.floor(cyc);
          const lx = (HIPS[l][0] + 0.31 * STRIDE) * w.sc, lz = HIPS[l][1] * w.sc;
          for (let gen = 0; gen < 2; gen++) {
            const m = (fr + gen) * STRIDE, age = m / 3;
            R[i * 8 + l * 2 + gen].set(x - w.dx * m + lx * w.dx - lz * w.dz, z - w.dz * m + lx * w.dz + lz * w.dx, age, sm(0, 0.25, age) * (1 - sm(4.4, 6, age)));
          }
        }
      }
      waders.instanceMatrix.needsUpdate = true;

      // the round: every body turns about the pier on the world clock (time: it stands while the visit is paused and keeps its
      // rate when the flight is hurried, as the reeds' and the sea's uTime does), the adults at 3 m/s on the ring, a calf through
      // the same angle on its shorter ring. A body's gait runs from the metres it has walked, in strides of its own size (so a
      // calf steps 2 (R - 10) / R times to its parent's once), and each planted pad lays live's rings, a calf's at half
      // strength and gone in half the time.
      for (let s = 0; s < 2; s++) {
        const set = RD.sets[s], k = set.k;
        for (let i = 0; i < set.list.length; i++) {
          const w = set.list[i], v = (3 * w.r) / RD.R, trav = (v * time) / k;      // its speed on its own ring (m/s); its gait clock
          if (i === 0) set.trav.value = trav % (40 * STRIDE);                     // one clock a mesh (its bodies share a ring), wrapped at a whole number of strides
          const a = RD.turn * ((RD.start + w.s + 3 * time) / RD.R), hx = -Math.sin(a) * RD.turn, hz = Math.cos(a) * RD.turn;
          Q.setFromAxisAngle(UP, Math.atan2(-hz, hx));
          M4.compose(pb.set(RD.cx + Math.cos(a) * w.r, -RD.sink * w.sc, RD.cz + Math.sin(a) * w.r), Q, SC.set(w.sc, w.sc, w.sc)); set.mesh.setMatrixAt(i, M4);
          for (let l = 0; l < 4; l++) {
            const cyc = trav / STRIDE + w.ph + HIPS[l][2], fr = cyc - Math.floor(cyc);
            const lx = (HIPS[l][0] + 0.31 * STRIDE) * w.sc, lz = HIPS[l][1] * w.sc;
            for (let gen = 0; gen < 2; gen++) {
              const m = (fr + gen) * STRIDE * k, age = m / v, b = a - (RD.turn * m) / w.r, bx = -Math.sin(b) * RD.turn, bz = Math.cos(b) * RD.turn;
              R[w.slot + l * 2 + gen].set(RD.cx + Math.cos(b) * w.r + lx * bx - lz * bz, RD.cz + Math.sin(b) * w.r + lx * bz + lz * bx, age, k * sm(0, 0.25, age) * (1 - sm(4.4 * k, 6 * k, age)));
            }
          }
        }
        set.mesh.instanceMatrix.needsUpdate = true;
      }
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 4000); path.pointAt(0, c0.position); c0.updateMatrixWorld(); update(0, 0, c0, 0); }

    return {
      scene, path, duration: 41.5,
      // linger under and beside the Span (the nests overhead, the flank climb), make up the time over the open sea
      pace: (u) => 1 - 0.2 * sm(0.19, 0.25, u) * (1 - sm(0.40, 0.47, u)) + 0.14 * sm(0.47, 0.54, u) * (1 - sm(0.62, 0.72, u)),
      title: 'The Weight of Glass',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 24, sway: 0.6, bank: 0.25 },
      pois: [
        { at: new THREE.Vector3(45, 28, 0), from: 0.02, to: 0.115, weight: 0.8 },            // the whole Span, low, across the first view
        { at: new THREE.Vector3(-88, 64, -2), from: 0.095, to: 0.20, weight: 0.85 },         // the near springing: the peacock eye whole, the herd above it
        { at: spanPoi, from: 0.165, to: 0.41, weight: 0.92, fade: 0.15 },                   // up the haunch from the eye into the underside, then the flank
        { at: rare ? new THREE.Vector3(-22, 95, 0) : crownPoi, from: rare ? 0.355 : 0.39, to: 0.50, weight: rare ? 0.8 : 0.9 },       // the walkers ahead on the back (the settled one on the rare visit)
        { at: new THREE.Vector3(68, 25, -193), from: 0.53, to: 0.66, weight: 0.5 },         // the tall blade-tree outside the turn
        { at: new THREE.Vector3(134, 20, -172), from: 0.63, to: 0.745, weight: 0.5 },       // the second tree and the wader below it, low over the flat
        { at: new THREE.Vector3(128, 26, 0), from: 0.72, to: 0.85, weight: 0.75 },          // the far haunch coming down to its eye beside the pierced block
        { at: A.oculus.clone(), from: 0.80, to: 0.95, weight: 0.7 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#2B2F86', glow: 1, revealDistance: 420 },
      post: {
        exposure: SK.exposure,
        bloom: { strength: 0.22, radius: 0.5, threshold: 1.0 },
        grade: { saturation: 1.0, contrast: 1.06, tint: '#ffffff', shadowTint: '#000000', vignette: 0.12, grain: 0, aberration: 0 },
      },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
