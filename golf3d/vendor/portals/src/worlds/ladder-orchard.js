// THE LADDER ORCHARD: a stained blue evening with no horizon; an orchard of hair-thin ink ladders grows out
// of a ragged island of red earth, bearing stars, crescents and red suns for fruit. The flight runs along the
// furrows, turns round the feet of the Long Ladder (src/parts/ladder-orchard.js), climbs beside it past its
// great mobile and leaves through the missing rung at its top.
// Style: flat unlit ink and stain (post.flat = 1), no lights, no fog. Passes by renderOrder as in the hero:
// -1 wash, 0 earth, 3 knock-out, 4 stain, 5 ink, 6 white asterisks.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, inkKit } from '../parts/ladder-orchard.js';

const PALETTE = ['#14246A', '#0C0D12', '#E23B2A', '#F2C230', '#F3EEDD', '#8A3B1E', '#2F9A6B'];

// The orchard's own motion chunk (replaces the hero's MOVE): every point moves with its owner.
// modes: 0 still, 1 ladder flex from the owner's foot, 6 flex + fruit bob (iW.z = bob metres), 2 tender hop
// (iW.z = heading + 10 * (ten times its scale - 10)), 3 the tender that hops across the route (hop count from
// uCross, riding the sag of its hair), 7 a tender that keeps its place, hopping to and fro, 16 a tender climbing
// its ladder one rung a hop (iW.z = the ladder's heading + 10 * (200 * (its elevation - 1)), iOwn.w = phase +
// 100 * (ten times the rung spacing)), 4 kite drift, 5 spin about the owner (asterisk twinkle by turning), 8 dot
// rain, 9 the wind line (p.x = arc parameter), 10..13 scripted groups moved by uOff[g] (xyz offset, w scale about
// the owner): 10 crossing kites, 11 comet, 12 eclipse disc.
const MOVE = /* glsl */`
  attribute vec3 iA, iB, iC, iQ; attribute vec4 iW, iOwn;
  uniform float uTime, uHop, uShower, uCross; uniform vec2 uRes; uniform vec4 uOff[4];
  vec3 rotK(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
  vec3 whip(vec3 p) {
    float d = max(iOwn.x - p.x, 0.), ph = iOwn.w;
    p.y += sin(uTime * 4.2 - d * 0.6 + ph) * d * 0.085;
    p.z += cos(uTime * 3.1 - d * 0.5 + ph * 1.3) * d * 0.06;
    return p;
  }
  vec3 moveP(vec3 p) {
    int mode = int(iW.w + 0.5);
    if (mode == 1 || mode == 6) {
      float h = max(p.y - iOwn.y, 0.), ph = iOwn.w;
      float k = min(h * h * 0.0005, h * 0.03);
      p.x += sin(uTime * 0.5 + ph) * k; p.z += cos(uTime * 0.37 + ph * 1.7) * k;
      if (mode == 6) { p.y += sin(uTime * 1.1 + ph * 3.3) * iW.z; p.x += cos(uTime * 0.8 + ph * 2.1) * iW.z * 0.6; }
    } else if (mode == 2 || mode == 3 || mode == 7) {
      float q = floor(iW.z / 10.), hd = iW.z - 10. * q, S = 1. + 0.1 * q;
      vec3 foot = iOwn.xyz; vec3 dir = vec3(cos(hd), 0., sin(hd));
      float k = mode == 3 ? uCross : mode == 7 ? uTime * 0.75 + iOwn.w : mod(uHop + iOwn.w, 16.);
      float n = floor(k), f = k - n;
      float air = smoothstep(0.3, 0.8, f), arc = sin(3.14159 * air);
      float c1 = smoothstep(0.03, 0.27, f) * (1. - smoothstep(0.27, 0.4, f));
      float c2 = smoothstep(0.78, 0.86, f) * (1. - smoothstep(0.86, 1., f));
      float leg = 1. - 0.6 * c1 - 0.45 * c2 + 0.3 * arc;
      float h = p.y - foot.y, top = 0.8 * S;
      float h2 = h < top ? h * leg : h - top * (1. - leg);
      p.y += h2 - h;
      if (mode == 7) {
        float fwd = mod(n, 2.) < 0.5 ? 1. : -1., to = fwd > 0. ? air : 1. - air;
        p += dir * (max(h - top, 0.) * 0.2 * arc * fwd + (to - 0.5) * 1.9 * S) + vec3(0., 1.1 * S * arc, 0.);
      } else {
        p += dir * (max(h - top, 0.) * 0.22 * arc);
        float sc = smoothstep(0., 0.7, k) * (1. - smoothstep(15.2, 16., k));
        p = foot + (p - foot) * sc;
        if (mode == 3) { float x = 1.05 * (n + air) - 8.4; p += dir * x + vec3(0., 1.2 * arc - 2.4 * (1. - x * x / 81.), 0.); }
        else p += dir * (2.6 * (n + air) - 20.8) + vec3(0., 1.3 * arc, 0.);
      }
    } else if (mode == 16) {
      float sq = floor(iOwn.w / 100.), sp = sq * 0.1, ph = iOwn.w - 100. * sq;
      float q = floor(iW.z / 10.), hd = iW.z - 10. * q, el = 1. + q / 200.;
      vec3 foot = iOwn.xyz, up = vec3(cos(hd) * cos(el), sin(el), sin(hd) * cos(el));
      float k = mod(uHop + ph, 16.), n = floor(k), f = k - n;
      float air = smoothstep(0.3, 0.8, f), arc = sin(3.14159 * air);
      float c1 = smoothstep(0.03, 0.27, f) * (1. - smoothstep(0.27, 0.4, f));
      float c2 = smoothstep(0.78, 0.86, f) * (1. - smoothstep(0.86, 1., f));
      float leg = 1. - 0.6 * c1 - 0.45 * c2 + 0.3 * arc;
      float h = p.y - foot.y, top = 0.8;
      float h2 = h < top ? h * leg : h - top * (1. - leg);
      p.y += h2 - h;
      float sc = smoothstep(0., 0.7, k) * (1. - smoothstep(15.2, 16., k));
      p = foot + (p - foot) * sc;
      p += up * (sp * (n + air)) + vec3(0., 0.5 * arc, 0.);
    } else if (mode == 4) {
      p = whip(p);
      float k = mod(uTime * 0.021 + iW.z, 1.);
      float sc = smoothstep(0., 0.06, k) * (1. - smoothstep(0.94, 1., k));
      p = iOwn.xyz + (p - iOwn.xyz) * sc;
      p.x += (k - 0.5) * 520.; p.y += sin(uTime * 0.7 + iOwn.w) * 2.5 + sin(k * 14. + iOwn.w) * 6.;
    } else if (mode == 5) {
      vec3 nr = cross(iB, iC); float nl = length(nr);
      nr = nl > 1e-6 ? nr / nl : vec3(0., 0., 1.);
      p = iOwn.xyz + rotK(p - iOwn.xyz, nr, uTime * (0.25 + 0.2 * fract(iOwn.w)) + iOwn.w);
    } else if (mode == 8) {
      float fall = mod(uTime * (5. + 3. * fract(iOwn.w * 3.7)) + iOwn.w * 9., max(iOwn.y, 1.));
      p = iOwn.xyz + (p - iOwn.xyz) * uShower * smoothstep(0., 2., iOwn.y - fall);
      p.y -= fall;
    } else if (mode == 9) {
      float s = p.x, t = uTime, a = iW.z;
      vec3 D = vec3(sin(a), 0., cos(a)), S = vec3(D.z, 0., -D.x);
      float ph = s * 55. - t * 0.5, r = sin(s * 9.4 + t * 0.17 + iOwn.w); r = 9. * r * r * step(0., r);
      p = iOwn.xyz + D * ((s - 0.5) * 200. + r * cos(ph)) + S * (5. * sin(s * 5. - t * 0.13))
        + vec3(0., 10. + 4. * sin(s * 11. + t * 0.21) + r * sin(ph), 0.);
    } else if (mode >= 10) {
      int g = mode - 10; g = g > 3 ? 3 : g;
      if (g == 0) p = whip(p);
      p = iOwn.xyz + (p - iOwn.xyz) * uOff[g].w + uOff[g].xyz;
    }
    return p;
  }
`;

// WASH: the ground of the painting, in every direction including down. Pools, tide-marks, scrubbed patches,
// a faint weave; the quietest, deepest pool lies along uPool (behind the top of the Long Ladder).
const WASH_VERT = /* glsl */`
  varying vec3 vDir;
  void main() { vDir = position; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; }
`;
const WASH_FRAG = /* glsl */`
  uniform sampler2D uNoise; uniform vec3 uLow, uDeep, uScrub, uPool, uGlow, uRubK; uniform float uTime; uniform vec4 uSun;
  varying vec3 vDir;
  float tri(vec3 d, float sc, vec2 off, int ch) {
    vec3 w = d * d;
    vec4 a = texture2D(uNoise, d.yz * sc + off), b = texture2D(uNoise, d.xz * sc + off.yx), c = texture2D(uNoise, d.xy * sc - off);
    vec4 m = a * w.x + b * w.y + c * w.z;
    return ch == 0 ? m.r : ch == 1 ? m.g : m.b;
  }
  void main() {
    vec3 d = normalize(vDir);
    float creep = uTime * 0.004;
    float w1 = tri(d, 0.11, vec2(creep, 0.3), 0);
    vec3 dw = normalize(d + (vec3(w1, tri(d, 0.09, vec2(0.6, creep), 1), w1) - 0.5) * 0.5);
    float n = tri(dw, 0.17, vec2(0.2, creep * 0.7), 1) * 0.65 + tri(dw, 0.41, vec2(creep, 0.8), 2) * 0.35;
    float quiet = smoothstep(0.80, 0.97, dot(d, uPool));
    float k = clamp(d.y * 0.45 + 0.5 + (n - 0.5) * 1.5 * (1. - 0.8 * quiet) + 0.5 * quiet, 0., 1.);
    vec3 col = mix(uLow, uDeep, smoothstep(0.1, 0.9, k));
    // THE RED SUN'S RUBBED PLACE (the designers' ruling, B): paint, not light. One more scrubbed patch of the wash, where
    // the sun's stalk holds the disc. uSun.xyz: from the eye to that place in world metres (the place is a fixed point of
    // the world: it does not swing with the disc, follow its facing, or change with the clock or the progress; only the
    // eye moves), uSun.w its reach in metres. Its outline is a fixed lobed shape about that point in the world's own
    // axes: c is the way from the place to this ray's nearest point to it, and the reach along c is long to port and
    // down (uRubK, away from the Long Ladder), short toward the ladder, and carried in and out by the wash's noise
    // texture read in the place's own metres and directions (no time in it). So it is lopsided, soft-edged and the same
    // size in the world from near and far. It is mixed in HERE, before the tide-marks, the scrub, the pools and the weave
    // are laid, so all of them run through it; from the wash's blue through the scrub colour to the hour's palest at its
    // heart, and the wash is never left paler than that palest colour.
    float st = dot(uSun.xyz, d);
    vec3 rc = d * st - uSun.xyz; float rl = length(rc); vec3 re = rc / max(rl, 1e-3);
    float rk = dot(re, uRubK);
    float lobe = 1. + 0.6 * rk + 0.16 * (2. * re.y * re.y - 1.)
      + 0.5 * (texture2D(uNoise, re.xz * 0.11 + re.y * 0.07 + 0.37).r - 0.5) + 0.3 * (texture2D(uNoise, rc.xz * 0.006 + rc.y * 0.0041 + 0.11).b - 0.5);
    float rb = rl / (max(uSun.w, 1.) * clamp(lobe, 0.4, 1.9));
    float rub = (1. - smoothstep(0.42, 1., rb)) * smoothstep(0., 10., st);
    col = mix(col, uScrub, 0.85 * rub);
    col = mix(col, uGlow, 0.8 * rub * (1. - smoothstep(0.25, 0.9, rb)));
    float tide = 1. - smoothstep(0., 0.035, abs(n - 0.5));
    col *= 1. - 0.12 * tide * (1. - quiet);
    float sc = tri(dw, 0.27, vec2(0.71, 0.13 + creep), 0);
    col = mix(col, uScrub, smoothstep(0.7, 0.8, sc) * 0.55 * (1. - quiet));
    // depth of tone: broad pools where the stain lies thick and dark, others where it was lifted off pale
    float big = tri(dw, 0.045, vec2(0.33, 0.71 + creep * 0.5), 0), lit = tri(dw, 0.062, vec2(0.83 - creep * 0.4, 0.21), 2);
    col *= mix(0.58, 1.06, smoothstep(0.3, 0.62, big));
    col = mix(col, uGlow, 0.2 * smoothstep(0.56, 0.8, lit) * (1. - quiet));
    col = min(col, uGlow);                                            // nothing in the wash is paler than the hour's palest colour
    float az = atan(d.z, abs(d.x) + 1e-4), el = d.y;
    float pitch = 1. / max(length(fwidth(d)) * 229., 1e-3);            // pixels per weave thread (quarter degree)
    col *= 1. + 0.03 * sin(1440. * az) * sin(1440. * el) * smoothstep(2., 4., pitch);
    gl_FragColor = vec4(col, 1.);
  }
`;
// EARTH: a flat dry-brushed island of red earth whose edge breaks up into the wash; furrows painted in.
const EARTH_VERT = /* glsl */`
  varying vec2 vP; varying vec2 vUv;
  void main() { vUv = uv * 2. - 1.; vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }
`;
// THE ISLAND'S BACK: the island is not a plane. Along its length (the way the approach flies) a strip 24 to 60 m wide (each
// side wanders in and out on its own) lies level
// at y 0, where the route, the nearest rows and the Long Ladder's feet are; to either side of that strip the earth falls
// away like the back of a whale, gently at first and never steeper than 24 degrees (12.6 m * (sqrt(1 + (d / 28)^2) - 1),
// d the metres beyond the strip). So from the low flight the earth ends at a rounded brow on either hand with the blue
// below it, the furrows bend over the shoulders, and the island's far end is the point of an arch, never a level line.
const ISLAND_VERT = /* glsl */`
  uniform vec4 uIsle;
  varying vec2 vP; varying vec2 vUv;
  void main() {
    vUv = uv * 2. - 1.; vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xz;
    vec2 o = wp.xz - uIsle.xy; float mx = o.x * uIsle.z - o.y * uIsle.w, my = o.x * uIsle.w + o.y * uIsle.z;
    float dd = max(abs(mx) - (21. + 9. * sin(my * 0.041 + (mx < 0. ? -2.2 : 2.2) + 5.3)), 0.) / 28.;
    wp.y -= 12.6 * (sqrt(1. + dd * dd) - 1.);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const EARTH_FRAG = /* glsl */`
  uniform sampler2D uNoise; uniform vec3 uEarth; uniform float uInk; uniform vec4 uIsle; uniform vec2 uIsleR;
  varying vec2 vP; varying vec2 vUv;
  void main() {
    // ONE broad island (world metres) under the whole approach and round the Long Ladder's feet. uIsle: centre xz and the
    // cosine and sine of its turn, uIsleR: half width and half length; m.y runs the island's length, the way the approach
    // flies. Its two long shores go in and out in bays and headlands (each side its own), so from the low flight the blue
    // comes in close on one side and then the other and the shore is never one level line. It has no outline and no
    // darker rim: toward its shore the stain breaks up into dry-brush tongues that run its length with the blue between
    // them; at the far end (beyond the Long Ladder's feet) that fringe is the last third of the radius.
    vec2 o = vP - uIsle.xy, m = vec2(o.x * uIsle.z - o.y * uIsle.w, o.x * uIsle.w + o.y * uIsle.z);
    float sgn = m.x < 0. ? -1. : 1.;
    float wd = uIsleR.x * (1. + 0.45 * sin(m.y * 0.048 + sgn * 1.7 + 0.6) + 0.14 * sin(m.y * 0.081 + sgn * 0.7 + 2.));
    vec2 p = vec2(m.x / max(wd, 20.), m.y / uIsleR.y);
    float q = length(p);
    float n1 = texture2D(uNoise, vP * 0.0021).r, n2 = texture2D(uNoise, vP * 0.011).g, n3 = texture2D(uNoise, vP * 0.09).b;
    float e = q + (n1 - 0.5) * 0.12 + (n2 - 0.5) * 0.05;          // 1 on the shore
    float far = smoothstep(0.15, 0.8, p.y / max(q, 1e-3));
    e += far * 0.16 * (0.6 * sin(m.x * 0.21 + 1.3 * sin(m.x * 0.057 + 0.4)) + 0.4 * sin(m.x * 0.52 + 2.1));   // the far shore: tongues 12 to 30 m wide, some 70 m longer than their neighbours
    float st = texture2D(uNoise, vec2(m.x * 0.012, m.y * 0.0016) + 0.3).g * 0.7 + texture2D(uNoise, vec2(m.x * 0.045, m.y * 0.006) + 0.7).a * 0.3;
    float cut = st - (smoothstep(mix(0.9, 0.64, far), 1.06, e) * 1.08 - 0.03);            // the dry brush: above 0 there is paint
    float cov = smoothstep(0., max(fwidth(cut) * 1.5, 1e-4), cut);
    if (cov < 0.01) discard;
    float px = max(length(fwidth(vP)), 1e-4);
    float fine = 1. - smoothstep(0.3, 1.2, px * 0.09 * 64.);
    vec3 col = uEarth * (1. + 0.12 * (n2 - 0.5) + 0.1 * (n3 - 0.5) * fine);
    float pool = texture2D(uNoise, vP * 0.0043 + 0.37).a * 0.65 + texture2D(uNoise, vP * 0.0125 + 0.11).r * 0.35;
    col *= mix(0.6, 1.0, smoothstep(0.22, 0.5, pool));                     // umber where the stain pooled
    col = mix(col, uEarth * vec3(1.75, 1.5, 1.15), 0.55 * smoothstep(0.55, 0.82, pool));   // dry orange where it was brushed thin
    // furrows as live paints them: ink strokes 3 m apart that curve with the rows; every third is drawn with a loaded
    // brush, so the field still reads as furrowed from far off
    float fx = vP.x + 9. * sin(vP.y * 0.012) + 4. * sin(vP.y * 0.031 + 1.7) + 0.22 * sin(vP.y * 0.21 + vP.x * 0.37);
    float pf = clamp(fwidth(fx), 1e-4, 6.);                               // metres across the furrow per pixel (not the grazing length)
    float brk = smoothstep(0.35, 0.5, texture2D(uNoise, vec2(fx * 0.05, vP.y * 0.004)).a + 0.25);
    float f = abs(fract(fx / 3.) - 0.5) * 3., w = max(0.075 + 0.05 * n3, 1.05 * pf);
    float line = (1. - smoothstep(w, w + max(pf, 0.01), f)) * brk * (1. - smoothstep(0.5, 1.6, px));
    float f9 = abs(fract(fx / 9.) - 0.5) * 9., w9 = max(0.2 + 0.08 * n3, 0.8 * pf);
    line = max(line, (1. - smoothstep(w9, w9 + max(pf, 0.01), f9)) * (0.55 + 0.45 * brk) * (1. - smoothstep(2.2, 4., pf)));
    col = mix(col, vec3(0.012, 0.011, 0.014), 0.96 * line * uInk);
    gl_FragColor = vec4(col, cov);
  }
`;

// ISLE: a slab of the same red earth hung under the Long Ladder, parallel to it, seen down to port during the climb.
// It stands from the start (nothing soaks in by progress). No outline and no rim: a dry-brush fringe, as the island's.
// vUv -1..1; uHalf: the quad's half size in metres.
const ISLE_FRAG = /* glsl */`
  uniform sampler2D uNoise; uniform vec3 uEarth; uniform vec2 uHalf;
  varying vec2 vP; varying vec2 vUv;
  void main() {
    vec2 m = vUv * uHalf;
    float n1 = texture2D(uNoise, m * 0.0021 + 0.4).r, n2 = texture2D(uNoise, m * 0.011 + 0.2).g, n3 = texture2D(uNoise, m * 0.045).b;
    float q = length(vUv) / 0.62, a = atan(vUv.y, abs(vUv.x) > 1e-4 ? vUv.x : 1e-4);
    float lobe = 1. + 0.12 * sin(2. * a + 2.3) + 0.08 * sin(3. * a + 0.5) + 0.05 * sin(5. * a + 1.9);
    float e = q / max(lobe, 0.5) + (n1 - 0.5) * 0.12 + (n2 - 0.5) * 0.05;
    float st = texture2D(uNoise, vec2(m.x * 0.012, m.y * 0.0016) + 0.55).g * 0.7 + texture2D(uNoise, vec2(m.x * 0.045, m.y * 0.006) + 0.15).a * 0.3;
    float cut = st - (smoothstep(0.8, 1.06, e) * 1.08 - 0.03);
    float cov = smoothstep(0., max(fwidth(cut) * 1.5, 1e-4), cut);
    if (cov < 0.01) discard;
    vec3 col = uEarth * (1. + 0.12 * (n2 - 0.5));
    float pool = texture2D(uNoise, m * 0.0075 + 0.61).a;
    col *= mix(0.6, 1.0, smoothstep(0.22, 0.5, pool));
    col = mix(col, uEarth * vec3(1.75, 1.5, 1.15), 0.55 * smoothstep(0.55, 0.82, pool));
    float fx = m.x + 6. * sin(m.y * 0.02) + 2. * sin(m.y * 0.06 + 1.7);
    float f = abs(fract(fx / 5.) - 0.5) * 5., pf = clamp(fwidth(fx), 1e-4, 2.5);
    float w = max(0.12, 1.05 * pf);
    float line = (1. - smoothstep(w, w + max(pf, 0.01), f)) * smoothstep(0.35, 0.5, texture2D(uNoise, vec2(fx * 0.05, m.y * 0.004)).a + 0.25);
    col = mix(col, vec3(0.012, 0.011, 0.014), 0.9 * line * (1. - smoothstep(1.2, 2.5, pf)));
    gl_FragColor = vec4(col, cov);
  }
`;

const lin = (hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };

export default {
  id: 'ladder-orchard',
  name: 'The Ladder Orchard',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- variations: ground, season, cast (drawn first so the same seed always gives the same visit)
    let ground = rng.pick(['evening', 'evening', 'night', 'ochre']);
    if (vary.hour === 'night') ground = 'night'; else if (vary.hour === 'golden' || vary.hour === 'dawn') ground = 'ochre'; else if (vary.hour === 'day') ground = 'evening';
    const season = rng.pick(['harvest', 'harvest', 'blossom', 'seed']);
    const cast = rng.pick(['tenders', 'kites', 'winds']);
    const rare = !!vary.rare;
    const G = {
      evening: { low: '#2E5FB4', deep: '#14246A', scrub: '#3E78C6', glow: '#79B0EE', stars: 40 },
      night: { low: '#1B3478', deep: '#0C1440', scrub: '#25469A', glow: '#4C80DA', stars: 120 },
      ochre: { low: '#D9A942', deep: '#C9952E', scrub: '#E3BC5E', glow: '#F5E3A6', stars: 30 },
    }[ground];
    // on ochre the signs are blue, black and red: yellow stains become blue
    const palette = PALETTE.slice();
    if (ground === 'ochre') { palette[3] = '#14246A'; palette[6] = '#2E5FB4'; palette[4] = '#F3EEDD'; }

    const scene = new THREE.Scene();
    const noiseTex = await inkKit.makeNoiseTex(rng.fork('noise'), ctx);
    const disposables = [noiseTex];

    // ---- wash
    const washU = { uNoise: { value: noiseTex }, uLow: { value: lin(G.low) }, uDeep: { value: lin(G.deep) }, uScrub: { value: lin(G.scrub) },
      uPool: { value: new THREE.Vector3(-0.545, 0.53, 0.65).normalize() }, uTime: { value: 0 }, uGlow: { value: lin(G.glow) },
      uSun: { value: new THREE.Vector4(0, 500, 0, 44) }, uRubK: { value: new THREE.Vector3(0.766, -0.55, 0.643).normalize() } };      // uRubK: to port of the Long Ladder and down
    const wash = new THREE.Mesh(new THREE.SphereGeometry(2200, 32, 20),
      new THREE.ShaderMaterial({ vertexShader: WASH_VERT, fragmentShader: WASH_FRAG, uniforms: washU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
    wash.renderOrder = -1; wash.frustumCulled = false; scene.add(wash);
    // ---- earth: one broad island with a rounded back (ISLAND_VERT), 45 to 165 m by 450 m, lying along the approach (its long axis 9.5 degrees off +Z, as the route runs) from
    // behind the entry to beyond the Long Ladder's feet. ISLAND: centre x, z, cosine and sine of the turn, half width, half length.
    const ISLAND = [92, 262, Math.cos(0.166), Math.sin(0.166), 52, 225];
    const earth = new THREE.Mesh(new THREE.PlaneGeometry(250, 600, 50, 24),       // in the island's own axes: 5 m across its back, 25 m along it
      new THREE.ShaderMaterial({ vertexShader: ISLAND_VERT, fragmentShader: EARTH_FRAG, uniforms: { uNoise: { value: noiseTex }, uEarth: { value: lin(PALETTE[5]) }, uInk: { value: 1 },
        uIsle: { value: new THREE.Vector4(ISLAND[0], ISLAND[1], ISLAND[2], ISLAND[3]) }, uIsleR: { value: new THREE.Vector2(ISLAND[4], ISLAND[5]) } }, transparent: true, fog: false, toneMapped: false }));
    earth.rotation.x = -Math.PI / 2; earth.rotation.z = 0.166; earth.position.set(ISLAND[0], 0, ISLAND[1]); earth.renderOrder = 0; earth.frustumCulled = false; scene.add(earth);
    const isleU = { uNoise: { value: noiseTex }, uEarth: { value: lin(PALETTE[5]) }, uHalf: { value: new THREE.Vector2(85, 95) } };
    const isle = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: EARTH_VERT, fragmentShader: ISLE_FRAG, uniforms: isleU, transparent: true, fog: false, toneMapped: false }));
    isle.renderOrder = 0; isle.frustumCulled = false; scene.add(isle); disposables.push(isle.geometry, isle.material);
    await ctx.yield();

    // ---- the Long Ladder
    const hero = await buildHero(ctx, { palette, detail, gain: 1, earth: false, duration: 45, noiseTex });
    hero.object.position.set(90, 0, 380); hero.object.rotation.y = Math.PI - 0.699;
    hero.object.updateMatrixWorld(true); scene.add(hero.object);
    const toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    await ctx.yield();

    // ---- path: in low and level over the island's furrows from the south-east (the brief: y 14, dipping to 9 before the
    // feet), the Long Ladder and its sun ahead to starboard, round the feet, up beside the port rail, onto the axis,
    // through the ring. In plan it is the route as it was; only the approach's height is the brief's.
    const ft = hero.anchors.flyThrough.slice(0, 9).map(toWorld);
    ft[0] = toWorld(hero.anchors.at(40, -15, 7)); ft[1] = toWorld(hero.anchors.at(120, -11.5, 10.5)); ft[2] = toWorld(hero.anchors.at(200, -11.5, 10.5)); ft[3] = toWorld(hero.anchors.at(248, -12, 9));   // above and just outside the port rail: rungs pass below like sleepers
    ft[4] = toWorld(hero.anchors.at(292, -11, 7.5)); ft[5] = toWorld(hero.anchors.at(328, -2, 8));   // cross the port rail a little higher, so it is a line and not a slab
    const pts = [[67, 14, 116], [72, 14, 168], [84, 14, 222], [97, 13, 285], [106, 10.5, 335], [109, 10, 360], [102, 16.5, 397]]
      .concat(ft.map((p) => [p.x, p.y, p.z]));
    const path = makePath(pts);
    const sunC = new THREE.Vector3(), _v = new THREE.Vector3();
    const nearPath = (x, z) => path.nearestXZ(x, z);

    // ---- instance collectors (same 20-float layout as the hero): strokes a, bow control, c; quads centre, U, V
    const shortS = inkKit.collector(), longS = inkKit.collector(), inkQ = inkKit.collector(), blotQ = inkKit.collector(), whiteQ = inkKit.collector();
    let irng = rng.fork('ink');
    // (round 4e) everything new draws from streams of its own, forked here, after the last draw the live version takes from
    // the visit's stream (ground, season, cast, the noise, the Long Ladder, 'ink'): hour, season and cast come out as before
    const rowsR = rng.fork('rows'), castR = rng.fork('cast'), upR = rng.fork('upper');
    // (the owner's rule of 7 Oct) every loop of the orchard whose number of draws depends on what this round changed (the
    // island's shape, the route's height, the window and pool rules) draws from a fork of its own, taken here once, after
    // every fork there was; what the round did not touch (the kites, the wind) stays on
    // 'ink'; the shower, placed anew, has a fork of its own taken where it is built. No draw is taken only to keep another's place.
    const ink = irng, FK = {};
    for (const n of ['tall', 'short', 'trellis', 'far', 'sky', 'stars', 'blossom', 'sprouts', 'seeds', 'prints', 'roam', 'hair', 'bold', 'isle']) FK[n] = rng.fork(n);
    const withR = (r, fn) => { const keep = irng; irng = r; const out = fn(); irng = keep; return out; };
    const sd = () => irng.range(0, 40);
    const NO = [0, 0, 0, 0];
    const mid = (a, c, bow) => [(a[0] + c[0]) / 2 + (bow ? bow[0] : 0), (a[1] + c[1]) / 2 + (bow ? bow[1] : 0), (a[2] + c[2]) / 2 + (bow ? bow[2] : 0)];
    const stroke = (col, a, c, bow, width, o = {}) => col.push(a, mid(a, c, bow), c, [width, sd(), o.g || 0, o.mode || 0], o.own || NO, [o.minPx ?? 2, o.taper || 0, o.chain ? 1 : 0]);
    const dot = (p, r, o = {}) => inkQ.push(p, [r, 0, 0], [0, r, 0], [o.rag ?? 0.7, sd(), o.g || 0, o.mode || 0], o.own || NO, [0, 0, o.keep ? 1 : 2]);
    // world-fixed blot: shape 0 disc, 1 crescent, 2 lozenge, 3 hourglass, 4 asterisk, 5 plate; colour 0 ink, 2 red, 3 yellow, 6 green
    const blot = (p, U, V, shape, colour, o = {}) => (colour === 0 ? inkQ : colour === 4 ? whiteQ : blotQ).push(p, U, V, [o.rag ?? 1, sd(), o.g || 0, o.mode || 0], o.own || NO, [shape, colour, 0]);

    // ---- a ladder: two bowed rails that never run quite parallel, smiling rungs, knots, fruit on curved stalks
    const qd = (a, b, c, t) => { const m = 1 - t; return [a[0] * m * m + b[0] * 2 * m * t + c[0] * t * t, a[1] * m * m + b[1] * 2 * m * t + c[1] * t * t, a[2] * m * m + b[2] * 2 * m * t + c[2] * t * t]; };
    const fruitKinds = season === 'blossom' ? [4, 4, 4, 0, 4] : [0, 0, 2, 1, 4, 4, 3, 2, 1, 4, 0];
    const fruit = (at, out, size, own, face, o = {}) => {
      // at: attach point; out: stalk vector; face: horizontal unit normal the blot shows itself to
      const end = [at[0] + out[0], at[1] + out[1], at[2] + out[2]];
      if (path.distanceTo(end[0], end[1], end[2]) < size + 6.5) return;
      const L = Math.hypot(out[0], out[1], out[2]);
      const st = L > 9 ? longS : shortS;
      stroke(st, [at[0] - out[0] * 0.25, at[1] - out[1] * 0.25 - 0.3, at[2] - out[2] * 0.25], end, [0, L * 0.16, 0], o.w || 0.09, { mode: 6, g: o.bob ?? 0.25, own, minPx: o.minPx ?? 2 });
      dot([at[0] - out[0] * 0.25, at[1] - out[1] * 0.25 - 0.3, at[2] - out[2] * 0.25], Math.max(size * 0.13, 0.16), { mode: 6, g: o.bob ?? 0.25, own });
      const kind = o.kind ?? irng.pick(fruitKinds), roll = irng.range(-0.7, 0.7), cr = Math.cos(roll), sr = Math.sin(roll);
      const ux = -face[1], uz = face[0];
      const U = [ux * cr * size, sr * size, uz * cr * size], V = [-ux * sr * size, cr * size, -uz * sr * size];
      const colour = kind === 0 ? 2 : kind === 2 ? 3 : kind === 4 ? 3 : kind === 3 ? 6 : 0;
      blot(end, U, V, kind, colour, { mode: 6, g: o.bob ?? 0.25, own, rag: 1 });
    };
    const ladder = (fx, fy, fz, H, hd, el, w, o = {}) => {
      const own = [fx, fy, fz, irng.range(0, 6.28)];
      const dx = Math.cos(hd) * Math.cos(el), dz = Math.sin(hd) * Math.cos(el), dy = Math.sin(el);
      const rx = -Math.sin(hd), rz = Math.cos(hd), w2 = w * irng.range(0.65, 1.2);
      const top = [fx + dx * H, fy + dy * H, fz + dz * H];
      const rw = o.rail || 0.13, mode = 1;
      const rails = [-1, 1].map((s) => {
        const a = [fx + rx * w * 0.5 * s, fy, fz + rz * w * 0.5 * s], c = [top[0] + rx * w2 * 0.5 * s, top[1] + irng.range(-0.04, 0.04) * H, top[2] + rz * w2 * 0.5 * s];
        const k = irng.range(-0.035, 0.035) * H, k2 = irng.range(0.01, 0.05) * H;
        const b = mid(a, c, [rx * k - dx * k2, 0, rz * k - dz * k2]);
        longS.push(a, b, c, [rw, sd(), 0, mode], own, [o.px || 2, 0, 0]);
        return [a, b, c];
      });
      const sp = o.spacing || clamp(H / 9, 1.5, 6), n = Math.max(2, Math.floor(H / sp) - 1);
      for (let i = 1; i <= n; i++) {
        const t = (i + irng.range(-0.15, 0.15)) / (n + 1);
        const p = qd(...rails[0], t), q = qd(...rails[1], t + irng.range(-0.01, 0.01));
        stroke(shortS, p, q, [0, -0.09 * w, 0], rw * 0.8, { mode, own, minPx: o.px ? o.px * 0.75 : -2 });
        if (!o.far) { dot(p, rw * 1.25, { mode, own }); dot(q, rw * 1.25, { mode, own }); }
      }
      const nf = o.fruit ?? 0, face = o.face || [0, -1];
      for (let i = 0; i < nf; i++) {
        const s = irng.chance(0.5) ? 0 : 1, t = irng.range(0.55, 1), at = qd(...rails[s], t), side = (s ? 1 : -1) * irng.range(0.5, 1);
        const L = clamp(H * irng.range(0.12, 0.22), 2, o.far ? 40 : 12), size = clamp(H * irng.range(0.05, 0.11), 1, o.far ? 13 : 4.5);
        fruit(at, [rx * side * L + irng.range(-0.2, 0.2) * L, irng.range(-0.1, 0.7) * L, rz * side * L + irng.range(-0.2, 0.2) * L], size, own, face, { w: rw * 0.7, bob: clamp(H * 0.006, 0.12, 0.9) });
      }
      top.rails = rails;
      return top;
    };
    const faceTo = (x, z, tx, tz) => { const ax = tx - x, az = tz - z, l = Math.hypot(ax, az) || 1; return [ax / l, az / l]; };
    const nFruit = () => (season === 'seed' ? 0 : season === 'blossom' ? irng.int(1, 3) : irng.int(1, 3));
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();

    // ---- the WINDOW: from the approach the Long Ladder, its sun and its ring stand to starboard and above, and the cones
    // of sight to them are kept clear of far blots and bold far lines. It is tested from an eye every 2.5 m of the route
    // from the entry to the place where it passes the Long Ladder's foot (feetM, the route's nearest place to the foot in
    // plan): the whole approach.
    const L = path.length, uNew = (uo) => 1 - (1 - uo) * 883.5 / L;      // moments written for the first, longer route
    const feetM = path.nearestXZ(90, 380).u * L;
    const eyes = []; for (let m = 0; m <= feetM; m += 2.5) eyes.push(path.pointAt(m / L, new THREE.Vector3()));
    const sights = [0, 80, 160, 240, 320, 400, 474].map((s) => toWorld(hero.anchors.at(s, 0, 2))).concat([toWorld(hero.anchors.at(300, -70, 9))]);
    const _e = new THREE.Vector3(), _s = new THREE.Vector3();
    const inWindow = (x, y, z, r, deg = 6) => {
      for (const eye of eyes) {
        _e.set(x - eye.x, y - eye.y, z - eye.z); const dl = _e.length(); if (dl < 1) return true; _e.multiplyScalar(1 / dl);
        const lim = Math.cos(Math.min((deg * Math.PI) / 180 + Math.atan2(r, dl), 1.2));
        for (const st of sights) { _s.copy(st).sub(eye).normalize(); if (_s.dot(_e) > lim) return true; }
      }
      return false;
    };
    // THE QUIET POOL (the brief, built: "Behind it is the deepest pool of the blue, kept clear of signs for 25 degrees around
    // except five white asterisks"): true for a thing of radius r that stands behind the ring's plane and comes within 25
    // degrees of the ring (plus its own angular radius) from any eye of the last straight (the brief, journey
    // F: "150 m dead straight ... on the ladder's axis"), an eye every 2.5 m of the route's last 150 m.
    const ringW = toWorld(hero.anchors.at(474, 0, 5)), ringAx = toWorld(hero.anchors.axis.clone()).sub(toWorld(new THREE.Vector3())).normalize(), poolEyes = [];
    for (let m = L - 150; m < L; m += 2.5) poolEyes.push(path.pointAt(m / L, new THREE.Vector3()));
    const inPool = (x, y, z, r) => {
      if ((x - ringW.x) * ringAx.x + (y - ringW.y) * ringAx.y + (z - ringW.z) * ringAx.z < -1) return false;
      for (const eye of poolEyes) {
        _e.set(x - eye.x, y - eye.y, z - eye.z); const dl = Math.max(_e.length(), 1); _s.copy(ringW).sub(eye); const sl = Math.max(_s.length(), 1);
        if (_e.dot(_s) / (dl * sl) > Math.cos(Math.min(0.4363 + Math.atan2(r, dl), 1.2))) return true;
      }
      return false;
    };
    // a ladder against the pool: four places up its own leaning length, each with a sixth of its height about it
    const alongInPool = (x, fy, z, H, hd, el) => {
      for (let t = 0.25; t <= 1; t += 0.25) if (inPool(x + Math.cos(hd) * Math.cos(el) * H * t, fy + Math.sin(el) * H * t, z + Math.sin(hd) * Math.cos(el) * H * t, H / 6)) return true;
      return false;
    };
    const lane = (d, lat, out) => { path.pointAt(d / L, _p); path.tangentAt(d / L, _t); const tl = Math.hypot(_t.x, _t.z) || 1; out[0] = _p.x - (_t.z / tl) * lat; out[1] = _p.z + (_t.x / tl) * lat; return out; };
    const xz = [0, 0];
    const onEarth = (x, z, m = 0.86) => {                                                    // the island as the earth shader paints it (solid paint: short of the fringe)
      const ox = x - ISLAND[0], oz = z - ISLAND[1], mx = ox * ISLAND[2] - oz * ISLAND[3], my = ox * ISLAND[3] + oz * ISLAND[2], sg = mx < 0 ? -1 : 1;
      const wd = ISLAND[4] * (1 + 0.45 * Math.sin(my * 0.048 + sg * 1.7 + 0.6) + 0.14 * Math.sin(my * 0.081 + sg * 0.7 + 2));
      const pz = my / ISLAND[5], q = Math.hypot(mx / Math.max(wd, 20), pz), far = smoothstep(0.15, 0.8, pz / Math.max(q, 1e-3));
      return q + far * 0.16 * (0.6 * Math.sin(mx * 0.21 + 1.3 * Math.sin(mx * 0.057 + 0.4)) + 0.4 * Math.sin(mx * 0.52 + 2.1)) < m * lerp(1, 0.64 / 0.9, far);
    };

    // the height of the island's back at a place (see ISLAND_VERT): 0 on the level strip, falling away to either side
    // the furrows run along the island's own long axis: ladders that stand in them lean along it, their fruit hangs facing
    // down the furrows toward the island's near end, and tenders that keep their place hop across them (rules of the
    // island, not of the route)
    const ROW_HD = Math.atan2(ISLAND[2], ISLAND[3]), ROW_FACE = [-ISLAND[3], -ISLAND[2]];
    const groundY = (x, z) => {
      const ox = x - ISLAND[0], oz = z - ISLAND[1], mx = ox * ISLAND[2] - oz * ISLAND[3], my = ox * ISLAND[3] + oz * ISLAND[2];
      const dd = Math.max(Math.abs(mx) - (21 + 9 * Math.sin(my * 0.041 + (mx < 0 ? -2.2 : 2.2) + 5.3)), 0) / 28; return -12.6 * (Math.sqrt(1 + dd * dd) - 1);
    }; await ctx.yield();

    // ORCHARD: a few bold ladders with air between. Tall ones stand to port of the approach (screen left, lat < 0),
    // some with their feet lost in the blue before the island; short ones to starboard, under the window.
    const nTall = Math.round(lerp(9, 14, (detail - 0.6) / 0.4) * Math.min(dens, 1.1));
    irng = FK.tall;
    for (let i = 0; i < nTall; i++) {
      const d = 34 + (i / nTall) * 300 + irng.range(-8, 8); let lat = -(11 + irng.range(0, 1) ** 1.6 * 46 + (i % 3 === 2 ? 30 : 0));
      if (d > 0.16 * L - 6 && d < 0.16 * L + 56 && lat > -30) lat -= 24;          // air round the tender on its hair
      lane(d, lat, xz); path.pointAt(d / L, _p);
      const fy = onEarth(xz[0], xz[1]) ? groundY(xz[0], xz[1]) : -irng.range(20, 60), H = _p.y - fy + irng.range(4, 26) + 10;
      const top = ladder(xz[0], fy, xz[1], H, ROW_HD + irng.range(-0.5, 0.5), irng.range(1.3, 1.5), irng.range(3, 4.4), { rail: 0.34, px: 3.8, spacing: clamp(H / 11, 3, 6), fruit: season === 'seed' ? 1 : irng.int(2, 3), face: ROW_FACE });
      if (i % 2 === 1) await ctx.yield();
    }
    const nShort = Math.round(lerp(7, 11, (detail - 0.6) / 0.4));
    irng = FK.short;
    for (let i = 0; i < nShort; i++) {
      const d = 216 + (i / nShort) * 124 + irng.range(-6, 6), lat = 9 + irng.range(0, 60);
      lane(d, lat, xz); path.pointAt(d / L, _p);
      if (Math.hypot(xz[0] - 90, xz[1] - 380) < 20 || !onEarth(xz[0], xz[1], 1)) continue;
      const H = irng.range(8, 17);
      ladder(xz[0], groundY(xz[0], xz[1]), xz[1], H, irng.range(0, 6.28), irng.range(1.2, 1.48), irng.range(2.2, 3.2), { rail: 0.26, px: 3, fruit: i % 2 ? 1 : 0, face: ROW_FACE });
    }
    await ctx.yield();
    // ROWS (round 4e; the brief: "orchard rows 24 m apart either side of the path ... none within 5 m", "ladder feet 6 to 12
    // m either side", "a hundred ladders sliding against one another"): three rows a side along the whole approach, their
    // feet in the island's furrows. To port they are tall, the inner ones rising past the flight so that their fruit hangs
    // overhead; to starboard, under the view of the Long Ladder, they are short. Each leans along its furrow (the island's
    // own long axis) and a little outward; none comes within 5 m of the route; the further rows are drawn finer.
    const climbers = [];
    { const keep = irng; irng = rowsR;
      for (let row = 0; row < 3; row++) for (const side of [-1, 1]) {
        const step = 19 + row * 3;
        for (let d = 8 + (side > 0 ? step * 0.5 : 0) + row * 5; d < feetM; d += step) {
          const dd = d + irng.range(-4, 4), lat = side * (9 + 24 * row + irng.range(-3, 3));
          lane(dd, lat, xz); path.pointAt(dd / L, _p);
          const H = side < 0 ? irng.range(17, 30) + row * irng.range(0, 14) : irng.range(7, 12.5), el = irng.range(1.15, 1.48);
          const hd = ROW_HD + side * irng.range(0, 0.5), w = irng.range(2.2, 3.4) * (side < 0 ? 1.2 : 1), climb = row === 0 && side < 0;
          // the brief: "none within 5 m" of the path. Where the ladder as it leans would pass nearer than 5.5 m (its middle
          // line at nine places, less its half width), its foot stands that much further out
          { let near = 1e9; for (let t = 0; t <= 1; t += 0.125) near = Math.min(near, path.distanceTo(xz[0] + Math.cos(hd) * Math.cos(el) * H * t, Math.sin(el) * H * t, xz[1] + Math.sin(hd) * Math.cos(el) * H * t));
            if (near - 0.62 * w < 5.5) lane(dd, lat + side * (5.5 + 0.62 * w - near), xz); }
          if (!onEarth(xz[0], xz[1], 0.93) || Math.hypot(xz[0] - 90, xz[1] - 380) < 24) continue;
          ladder(xz[0], groundY(xz[0], xz[1]), xz[1], H, hd, el, w, { rail: [0.28, 0.2, 0.15][row], px: [3, 2.3, 1.8][row], spacing: climb ? H / 17 : clamp(H / 8, 1.5, 4),
            fruit: season === 'seed' ? (row ? 0 : 1) : row === 0 ? 2 : 1, face: ROW_FACE });
          if (climb) climbers.push([xz[0], xz[1], H, hd, el, groundY(xz[0], xz[1])]);
        }
        await ctx.yield();
      }
      // the orchard goes on past the island's shore: ladders standing in the blue round the Long Ladder's feet, their
      // feet lost below. A seeded scatter all round the foot (90, 380): where they stand is decided by the island, the
      // route's 45 m, the window and the pool.
      for (let i = 0; i < 33; i++) {
        const a = irng.range(0, 6.2832), r = irng.range(85, 210), x = 90 + Math.cos(a) * r, z = 380 + Math.sin(a) * r;
        const H = irng.range(60, 120), fy = -irng.range(15, 50), hd = irng.range(0, 6.28), el = irng.range(1.25, 1.48), w = irng.range(4, 7), nf = season === 'seed' ? 1 : irng.int(2, 3);
        if (onEarth(x, z, 1.1) || nearPath(x, z).dist < 45 || inWindow(x, fy + H * 0.6, z, H * 0.5, 4) || alongInPool(x, fy, z, H, hd, el)) continue;
        ladder(x, fy, z, H, hd, el, w, { rail: 0.4, px: 2.8, spacing: 7, fruit: nf, face: faceTo(x, z, 90, 380) });      // fruit turned to the Long Ladder's foot, which they stand round
      }
      await ctx.yield();
      irng = keep; }
    // TRELLIS: prop-ladders standing under and beside the Long Ladder, their tops just below and beside the climb
    irng = FK.trellis;
    for (let i = 0; i < 9; i++) {
      const s = 140 + i * 36, side = i % 3 === 0 ? 1 : -1;
      const top = toWorld(hero.anchors.at(s, side * irng.range(24, 46) - 4, -irng.range(10, 28)));
      const H = top.y / Math.sin(1.4), hd = irng.range(0, 6.28);
      const fx = top.x - Math.cos(hd) * Math.cos(1.4) * H, fz = top.z - Math.sin(hd) * Math.cos(1.4) * H;
      ladder(fx, onEarth(fx, fz, 1) ? groundY(fx, fz) : 0, fz, H, hd, 1.4, irng.range(4, 7), { rail: 0.36, px: 2.6, spacing: 6, fruit: season === 'seed' ? 1 : 3, face: [0.643, -0.766] });
      if (i % 4 === 3) await ctx.yield();
    }
    // FAR: giants in every direction, half with their feet lost in the blue; none across the window
    const nFar = Math.round(26 * (detail < 1 ? 0.6 : 1));
    irng = FK.far;
    for (let i = 0; i < nFar; i++) {
      const a = irng.range(0, 6.28), d = irng.range(320, 900), x = 20 + Math.cos(a) * d, z = 350 + Math.sin(a) * d;
      const lost = i % 2 === 1 || d > 480, H = irng.range(150, 320), fy = lost ? -irng.range(60, 260) : 0;
      const hd = irng.range(0, 6.28), el = irng.range(1.1, 1.45);
      if (nearPath(x, z).dist < 150 || inWindow(x, fy + H * 0.5, z, H * 0.5, 4) || alongInPool(x, fy, z, H, hd, el)) continue;
      ladder(x, fy, z, H, hd, el, irng.range(9, 16),
        { rail: 0.7, px: 2.6, spacing: 14, far: true, fruit: season === 'seed' ? 0 : irng.int(0, 2), face: faceTo(x, z, 40, 300) });
      if (i % 10 === 9) await ctx.yield();
    }
    await ctx.yield();

    // SKY signs: loose stars, crescents and dots hung at real depths, below us too once we are high
    const upright = (size, roll) => { const c = Math.cos(roll) * size, s = Math.sin(roll) * size; return [[0.643 * c, s, 0.766 * c], [-0.643 * s, c, -0.766 * s]]; };
    const nSky = Math.round(64 * detail * dens);
    irng = FK.sky;
    for (let i = 0; i < nSky; i++) {
      const a = irng.range(0, 6.28), d = irng.range(110, 600), x = 20 + Math.cos(a) * d, z = 420 + Math.sin(a) * d, y = irng.range(-220, 460);
      const size = irng.range(2.5, 6.5) * (1 + d / 400), kind = irng.pick([4, 4, 1, 0, 0, 2, 4]);
      if (path.distanceTo(x, y, z) < (z < 420 && y < 130 ? 80 : 45) + size || inWindow(x, y, z, size) || inPool(x, y, z, size)) continue;
      const [U, V] = upright(size, irng.range(-0.8, 0.8)), own = [x, y, z, irng.range(0, 6.28)];
      const colour = kind === 0 ? 2 : kind === 1 ? 0 : 3;
      blot([x, y, z], U, V, kind, season === 'seed' && kind === 0 ? 0 : colour, { mode: kind === 4 ? 5 : 6, g: 1.5, own });
    }
    // white asterisks in the wash
    irng = FK.stars;
    for (let i = 0; i < G.stars; i++) {
      const a = irng.range(0, 6.28), e = irng.range(-0.5, 1.3), d = irng.range(500, 1100);
      const x = 20 + Math.cos(a) * Math.cos(e) * d, y = 120 + Math.sin(e) * d, z = 420 + Math.sin(a) * Math.cos(e) * d;
      const [U, V] = upright(irng.range(7, 16), irng.range(0, 1.5)), ph = irng.range(0, 6.28);
      if (inPool(x, y, z, 16)) continue;                                                   // the pool has its own five
      blot([x, y, z], U, V, 4, 4, { mode: 5, own: [x, y, z, ph], rag: 0.6 });
    }
    // blossom: small yellow asterisks drifting among the tall ladders to port and low over the island
    irng = FK.blossom;
    if (season === 'blossom') {
      const nB = Math.round(520 * detail);
      for (let i = 0; i < nB; i++) { if (i % 60 === 59) await ctx.yield();      // the window is tested from every eye of the approach: no long step
        const d = irng.range(20, 360), port = i % 4 !== 0, lat = port ? -irng.range(8, 60) : irng.range(8, 50);
        lane(d, lat, xz); path.pointAt(d / L, _p);
        const y = port ? _p.y + irng.range(-24, 20) : irng.range(1, 9), size = irng.range(0.45, 1.1);
        if (path.distanceTo(xz[0], y, xz[1]) < 7 || inWindow(xz[0], y, xz[1], size, 3)) continue;
        blot([xz[0], y, xz[1]], [size, 0, 0], [0, size, 0], 4, 3, { mode: 5, own: [xz[0], y, xz[1], irng.range(0, 6.28)], rag: 0.5 });
      }
    }
    await ctx.yield();
    // EARTH cover on the island near the path: sprouts, seed dots on the painted furrows, wandering footprints
    const furrowX = (x, z) => { const wob = 9 * Math.sin(z * 0.012) + 4 * Math.sin(z * 0.031 + 1.7); return 3 * Math.round((x + wob) / 3) - wob; };
    const nSprout = Math.round(70 * detail * (season === 'seed' ? 2 : 1));
    const sprouts = (n, d0, d1) => { for (let i = 0; i < n; i++) {
      lane(irng.range(d0, d1), irng.range(-30, 30) * (i % 3 ? 1 : 0.45), xz);
      if (!onEarth(xz[0], xz[1])) continue;
      const z = xz[1], x = furrowX(xz[0], z) + 1.5, h = irng.range(1.4, 3), w = h * 0.3, hd = irng.range(0, 3.14), gy = groundY(x, z);
      const rx = Math.cos(hd) * w * 0.5, rz = Math.sin(hd) * w * 0.5, own = [x, gy, z, irng.range(0, 6.28)], curl = irng.chance(0.3) ? h * 0.45 : h * 0.06;
      const lx = irng.range(-0.25, 0.25) * h, o = { mode: 6, g: 0.05, own, minPx: -1.8 };
      stroke(shortS, [x - rx, gy, z - rz], [x - rx + lx + curl * 0.5, gy + h, z - rz], [-curl, curl * 0.3, 0], 0.07, o);
      stroke(shortS, [x + rx, gy, z + rz], [x + rx + lx + curl * 0.5, gy + h * 0.94, z + rz], [-curl, curl * 0.3, 0], 0.07, o);
      for (let k = 1; k <= 3; k++) { const t = k / 4, m = 4 * t * (1 - t) * -curl * 0.5; stroke(shortS, [x - rx + lx * t + m, gy + h * t, z - rz], [x + rx + lx * t + m, gy + h * t * 0.96, z + rz], [0, -0.03, 0], 0.055, o); }
    } };
    irng = FK.sprouts; sprouts(nSprout, 214, 335);
    await ctx.yield();
    const nSeed = Math.round(700 * detail);
    const seeds = (n, d0, d1) => { for (let i = 0; i < n; i++) {
      lane(irng.range(d0, d1), irng.range(-34, 34) * (i % 2 ? 1 : 0.4), xz);
      if (!onEarth(xz[0], xz[1], 0.9)) continue;
      { const fx = furrowX(xz[0], xz[1]) + irng.range(-0.1, 0.1); dot([fx, groundY(fx, xz[1]) + 0.12, xz[1]], irng.range(0.1, 0.24), { rag: 0.9 }); }
    } };
    irng = FK.seeds; seeds(nSeed, 212, 345);
    await ctx.yield();
    // (round 4e) the same cover along the whole approach, where the island now lies under the flight: sprouts and seed dots
    // on the painted furrows from the entry to where live's own begin, and footprints wandering between the ladder feet
    { const keep = irng; irng = rowsR;
      for (let k = 0; k < 2; k++) { sprouts(Math.round(85 * detail * (season === 'seed' ? 2 : 1)), 2, 214); await ctx.yield(); }
      for (let k = 0; k < 4; k++) { seeds(Math.round(300 * detail), 2, 212); await ctx.yield(); }
      for (let k = 0; k < 6; k++) {
        lane(irng.range(10, 205), irng.range(-22, 22), xz); let x = xz[0], z = xz[1], hd = irng.range(0, 6.28);
        for (let i = 0; i < 70; i++) { hd += irng.range(-0.3, 0.3); x += Math.cos(hd) * 0.7; z += Math.sin(hd) * 0.7; if (onEarth(x, z)) dot([x, groundY(x, z) + 0.1, z], 0.11, { rag: 1 }); }
      }
      irng = keep; }
    irng = FK.prints;
    for (let k = 0; k < 3; k++) {
      let x = irng.range(70, 125), z = irng.range(350, 420), hd = irng.range(0, 6.28);
      for (let i = 0; i < 70; i++) { hd += irng.range(-0.3, 0.3); x += Math.cos(hd) * 0.7; z += Math.sin(hd) * 0.7; if (onEarth(x, z)) dot([x, groundY(x, z) + 0.1, z], 0.11, { rag: 1 }); }
    }
    await ctx.yield();

    // ---- TENDERS: a bent line, a dot carried to one side, one zigzag leg, a plate-sized blot. Never a person.
    // S: scale (tenths, 1..2.5); bold: drawn with the near ladders' rail width, a wider zigzag, a bigger dot and plate
    // (round 4e: every tender is the brief's 2.4 m, S 1; bold ones keep the brief's half-metre dot and plate. climb: the
    // ladder it climbs, { hd, el, sp }, for mode 16)
    const tender = (x, y, z, hd, mode, ph, S = 1, bold = 0, climb = null) => {
      hd = ((hd % 6.2832) + 6.2832) % 6.2832;
      const zz = bold ? 0.34 : 0.2, wz = bold ? 0.14 * S : 0.085, k = 1;
      const g = climb ? (((climb.hd % 6.2832) + 6.2832) % 6.2832) + 10 * Math.round((clamp(climb.el, 1, 1.5) - 1) * 200) : hd + 10 * Math.round((S - 1) * 10);
      const own = [x, y, z, climb ? ph + 100 * Math.round(climb.sp * 10) : ph], o = { mode, g, own, minPx: bold ? 2.2 : -1.8 }, cx = Math.cos(hd), cz = Math.sin(hd), s = irng.chance(0.5) ? 1 : -1;
      const P = (a, h) => [x + cx * a * S, y + h * S, z + cz * a * S];
      stroke(shortS, P(0, 0), P(zz, 0.27), null, wz, o); stroke(shortS, P(zz, 0.27), P(-zz, 0.53), null, wz, o); stroke(shortS, P(-zz, 0.53), P(0, 0.8), null, wz, o);
      const bw = (bold ? 0.5 : 0.16) * s * S;
      stroke(shortS, P(0, 0.8), P(0.08 * s, 2.4), [cx * bw, 0, cz * bw], bold ? 0.3 * S : 0.11, bold ? { ...o, minPx: 3 } : o);
      stroke(shortS, P(0.08 * s, 2.4), P(0.5 * s * k, 2.62), [0, 0.08 * S, 0], bold ? 0.09 * S : 0.04, o);
      inkQ.push(P(0.62 * s * k, 2.66), [0.25 * S * k, 0, 0], [0, 0.25 * S * k, 0], [0.7, sd(), g, mode], own, [0, 0, 1]);
      blotQ.push(P(-0.3 * s * k, 1.5), [cx * 0.36 * S * k, 0, cz * 0.36 * S * k], [0, 0.3 * S * k, 0], [1, sd(), g, mode], own, [5, irng.chance(0.6) ? 2 : 3, 0]);
    };
    // small ones roaming the island (they vanish when they would be thinner than a pixel and a half)
    const nTend = Math.round(48 * detail * (cast === 'tenders' ? 1.5 : 1));
    irng = FK.roam;
    for (let i = 0; i < nTend * 2; i++) { lane(irng.range(8, 345), irng.range(-45, 45) * (i % 4 ? 0.5 : 1.3), xz); if (!onEarth(xz[0], xz[1])) continue;
      const hd = irng.range(0, 6.28), hx = Math.cos(hd) * 20.8, hz = Math.sin(hd) * 20.8;       // it hops 20.8 m either way along its heading: only where that whole line lies on the level strip
      if (groundY(xz[0] + hx, xz[1] + hz) > -1 && groundY(xz[0] - hx, xz[1] - hz) > -1) tender(xz[0], 0, xz[1], hd, 2, irng.range(0, 16), 1); }
    await ctx.yield();
    // ---- THE CAST, large and close
    {
      // the scripted tender (u 0.16): over six metres tall, above the flight's own height against the open blue, hopping
      // away to port along a hair that sags from a red disc with a black sickle (it floats just starboard of the path,
      // seven metres up) to a tall bold ladder ahead to port; the flight passes under the hair behind the tender. The
      // hair is lashed to the ladder's inner rail and seeds are threaded on it. Its sag (2.4 m over 18 m) is the same
      // parabola the tender rides in the shader.
      irng = FK.hair;
      path.pointAt(0.16, _p); path.tangentAt(0.16, _t);
      const tl = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / tl, tz = _t.z / tl, ex = -tz, ez = tx;          // e: to starboard (screen right)
      const hxd = -ex * 0.906 + tx * 0.423, hzd = -ez * 0.906 + tz * 0.423;                              // the hair: to port and a little ahead
      const hy = _p.y + 4.5, hx = _p.x + tx * 20 - ex * 6, hz = _p.z + tz * 20 - ez * 6, hdT = Math.atan2(tz, tx);
      const po = ladder(hx + hxd * 10.6 - tx * 3.4, 0, hz + hzd * 10.6 - tz * 3.4, hy + 20, hdT + irng.range(-0.08, 0.08), irng.range(1.4, 1.46), 3.2, { rail: 0.34, px: 4, spacing: (hy + 20) / 9.5, fruit: 3, face: [-tx, -tz] });
      const E = [[hx + hxd * 9, hy, hz + hzd * 9], [hx - hxd * 9, hy, hz - hzd * 9]];
      stroke(longS, E[0], E[1], [0, -4.8, 0], 0.12, { minPx: 2.4 });
      const tie = qd(...po.rails[1], clamp(hy / Math.max(po[1], 1), 0, 1));
      stroke(shortS, E[0], tie, [0, 0.5, 0], 0.12, { minPx: 2.4 }); dot(E[0], 0.26, { keep: true }); dot(tie, 0.42, { rag: 1.1, keep: true });
      const K = [E[1][0] - hxd * 0.5, hy + 2.7, E[1][2] - hzd * 0.5];
      stroke(shortS, E[1], K, [-hxd * 0.8, -0.2, -hzd * 0.8], 0.12, { minPx: 2.4 }); dot(E[1], 0.3, { keep: true });
      blotQ.push(K, [ex * 1.05, 0, ez * 1.05], [0, 1.05, 0], [1, sd(), 0, 0], NO, [0, 2, 0]);
      inkQ.push([K[0] - ex * 1.5, K[1] + 2.3, K[2] - ez * 1.5], [ex * 1.8, 0.4, ez * 1.8], [-ex * 0.4, 1.8, -ez * 0.4], [1, sd(), 0, 0], NO, [1, 0, 0]);
      for (const t of [-0.78, -0.52, -0.3, 0.36, 0.6, 0.83]) dot([hx + hxd * 9 * t, hy - 2.4 * (1 - t * t) - 0.2, hz + hzd * 9 * t], 0.14 + 0.08 * Math.abs(t), { rag: 0.9, keep: true });
      tender(hx, hy, hz, Math.atan2(hzd, hxd), 3, 0, 1, 1);
      await ctx.yield();
      // bold tenders that keep their place, hopping to and fro on the island all along the route, under and beside the flight
      irng = FK.bold;
      for (let d = 14, i = 0; d < feetM; d += 17, i++) {
        const j = irng.range(-4, 4), side = i % 2 ? 1 : -1;      // j: the station is moved along the route by a draw of up to 4 m either way (the rows' own jitter)
        for (const lat of [side * irng.range(3.5, 8), -side * irng.range(11, 19)]) {
          lane(d + j, lat, xz);
          if (Math.hypot(xz[0] - 90, xz[1] - 380) < 9 || !onEarth(xz[0], xz[1])) continue;
          tender(xz[0], groundY(xz[0], xz[1]), xz[1], ROW_HD + 1.5708 + irng.range(-0.5, 0.5), 7, irng.range(0, 20), 1, 1);
        }
      }
      irng = ink;
      await ctx.yield();
      // (round 4e; the brief, journey B: "tenders climb the nearest ladders rung by rung beside us") one tender climbs each
      // ladder of the inner port row, a rung a hop, from its foot to its top and begins again
      withR(castR, () => { for (const [x, z, H, hd, el, gy] of climbers) tender(x, gy, z, hd + 1.5708, 16, irng.range(0, 16), 1, 1, { hd, el, sp: H / 17 }); });
      await ctx.yield();
      // the island under the climb (parallel to the Long Ladder, down to port of it) and the trellis that stands on it
      const o0 = toWorld(new THREE.Vector3()), iC = toWorld(hero.anchors.at(243, -114, -72));
      const iX = toWorld(new THREE.Vector3(1, 0, 0)).sub(o0), iA = toWorld(hero.anchors.axis.clone()).sub(o0), iN = toWorld(hero.anchors.normal.clone()).sub(o0);
      isle.position.copy(iC); isle.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(iX, iA, iN)); isle.scale.set(85, 95, 1);
      irng = FK.isle;
      for (let i = 0; i < 6; i++) {
        const f = iC.clone().addScaledVector(iX, irng.range(-0.42, 0.42) * 85).addScaledVector(iA, irng.range(-0.4, 0.4) * 95);
        const dv = iN.clone().multiplyScalar(0.75).add(new THREE.Vector3(irng.range(-0.2, 0.2), 0.45, irng.range(-0.2, 0.2))).normalize();
        ladder(f.x, f.y, f.z, irng.range(42, 80), Math.atan2(dv.z, dv.x), Math.asin(clamp(dv.y, -1, 1)), irng.range(4, 7), { rail: 0.36, px: 2.6, spacing: 6, fruit: season === 'seed' ? 1 : 3, face: [0.643, -0.766] });
      }
    }
    await ctx.yield();
    irng = ink;
    // ---- KITES: a red dot, a black sickle and a waving hair
    const kite = (x, y, z, mode, g, ph) => {
      const own = [x, y, z, ph];
      blotQ.push([x, y, z], [0.6, 0, 0], [0, 0.6, 0], [1, sd(), g, mode], own, [0, 2, 0]);
      inkQ.push([x - 1.5, y + 0.9, z], [1.15, 0.25, 0], [-0.25, 1.15, 0], [1, sd(), g, mode], own, [1, 0, 0]);
      longS.push([x, y, z], [x - 4.5, y + 1, z], [x - 9, y - 1.2, z], [0.09, sd(), g, mode], own, [2, 0.7, 0]);
    };
    const nFlock = cast === 'kites' ? 6 : 3;
    for (let f = 0; f < nFlock; f++) {
      const n = irng.int(5, 8), fy = 52 + irng.range(-30, 0) + (f % 2 ? 90 : 0), fz = irng.range(200, 460), g = irng();     // over the orchard's tops or high over the climb (the island lies where they flew below)
      for (let i = 0; i < n; i++) kite(40 + irng.range(-9, 9), fy + irng.range(-5, 5), fz + irng.range(-8, 8), 4, g, irng.range(0, 6.28));
    }
    for (let i = 0; i < 9; i++) kite(irng.range(-7, 7) + (i - 4) * 0.8, irng.range(-2.2, 3.2), irng.range(-2.5, 2.5), 10, 0, irng.range(0, 6.28));
    // ---- THE WIND: one endless line that strolls through the orchard tying and untying loops
    const wind = (x, z, a, ph) => { for (let i = 0; i < 60; i++) longS.push([i / 60, 0, 0], [(i + 0.5) / 60, 0, 0], [(i + 1) / 60, 0, 0], [0.1, 7.7, a, 9], [x, 0, z, ph], [2, 0, 1]); };
    // (round 4e; the brief, journey A: "the wind line ties a loop 10 m off to port") the one line strolls along the whole
    // approach 10 m to port of the route's line; it wanders 5 m to either side and ties its loops in its own upright plane
    { const a = lane(10, -10, [0, 0]), b = lane(210, -10, [0, 0]); wind((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1]), irng.range(0, 6)); }
    if (cast === 'winds') wind(170, 190, -0.3, irng.range(0, 6));
    // ---- dot rain (u 0.18-0.3, or all the time in seed-time): dots fall along dotted tracks and settle, to port of the path
    path.pointAt(0.27, _p); path.tangentAt(0.27, _t);
    for (let k = 0; k < 20; k++) {
      const lat = -(6 + irng.range(0, 11)), fw = irng.range(14, 44), x = _p.x - _t.z * lat + _t.x * fw, z = _p.z + _t.x * lat + _t.z * fw, top = irng.range(34, 60);
      for (let i = 0; i < 12; i++) inkQ.push([x, top, z], [irng.range(0.28, 0.6), 0, 0], [0, 0.3, 0], [0.8, sd(), 0, 8], [x, top, z, k * 0.37 + i * (top / 12) / 9], [0, 0, 1]);
    }
    // ---- the comet (u 0.58-0.68): a hairline 120 m long with a 2 m dot; built about the origin, moved by uOff[1]
    const fwd = new THREE.Vector3(-0.545, 0.53, 0.65).normalize(), port = new THREE.Vector3(0.766, 0, 0.643);
    const cT = fwd.clone().multiplyScalar(0.8).addScaledVector(new THREE.Vector3(0, 1, 0), 0.35).normalize();
    inkQ.push([0, 0, 0], [1.3, 0, 0], [0, 1.3, 0], [0.8, 3.1, 0, 11], NO, [0, 0, 1]);
    longS.push([0, 0, 0], [-cT.x * 60, -cT.y * 60 - 16, -cT.z * 60], [-cT.x * 120, -cT.y * 120, -cT.z * 120], [0.09, 4.2, 0, 11], NO, [2, 0.9, 0]);
    // ---- rare: the eclipse, a second disc 90 m across that drifts behind the red sun through E (uOff[2])
    const nUp = toWorld(hero.anchors.normal.clone()).sub(toWorld(new THREE.Vector3())).normalize();
    blotQ.push([0, 0, 0], [port.x * 45, 0, port.z * 45], [nUp.x * 45, nUp.y * 45, nUp.z * 45], [1, 9.3, 0, 12], NO, [0, 3, 0]);
    await ctx.yield();

    // ---- meshes: six draws over the orchard's instances, in the hero's pass order
    const cols = palette.map(lin);
    const U = {
      uTime: { value: 0 }, uHop: { value: 0 }, uShower: { value: 0 }, uCross: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) },
      uOff: { value: [new THREE.Vector4(0, -900, 0, 0), new THREE.Vector4(0, -900, 0, 0), new THREE.Vector4(0, -900, 0, 0), new THREE.Vector4(0, 0, 0, 1)] },
      uNoise: { value: noiseTex }, uCol: { value: cols }, uGain: { value: 1 },
    };
    const SV = inkKit.strokeVert(MOVE), QV = inkKit.quadVert(MOVE);
    const sBase = inkKit.strokeGeometry(6), lBase = inkKit.strokeGeometry(24), qBase = inkKit.quadGeometry();
    // loose sky signs over the climb, by a seeded rule in the Long Ladder's own axes (round 4e; they were four signs laid out
    // from one place on the route): from 120 m up the ladder to its top, 45 to 150 m out to either side, 20 to 110 m above
    // the plane of the rungs; under the orchard's rule of distance from the route, the window rule and the pool rule
    withR(upR, () => {
      for (let i = 0; i < 16; i++) {
        const p = toWorld(hero.anchors.at(irng.range(120, 470), (i % 2 ? 1 : -1) * irng.range(45, 150), irng.range(20, 110)));
        const size = irng.range(7, 13), kind = irng.pick([4, 4, 1, 0, 0, 2, 4]), [sU, sV] = upright(size, irng.range(-0.8, 0.8));
        if (path.distanceTo(p.x, p.y, p.z) < 45 + size || inPool(p.x, p.y, p.z, size) || inWindow(p.x, p.y, p.z, size)) continue;
        blot([p.x, p.y, p.z], sU, sV, kind, season === 'seed' && kind === 0 ? 0 : kind === 0 ? 2 : kind === 1 ? 0 : 3, {});
      }
    });
    disposables.push(sBase, lBase, qBase);
    const orchard = new THREE.Group(); orchard.name = 'orchard'; scene.add(orchard);
    const mk = (geo, mat, order, name) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = order; m.frustumCulled = false; m.name = name; orchard.add(m); return m; };
    const blotGeo = inkKit.instanced(qBase, blotQ);
    mk(blotGeo, inkKit.passMaterial(QV, inkKit.QUAD_FRAG, { ...U, uInk: { value: 1 }, uUseCol: { value: 0 } }, 'mul'), 3, 'knock-out');
    mk(blotGeo, inkKit.passMaterial(QV, inkKit.QUAD_FRAG, { ...U, uInk: { value: 1 }, uUseCol: { value: 1 } }, 'stain'), 4, 'stain');
    await ctx.yield();
    mk(inkKit.instanced(qBase, inkQ), inkKit.passMaterial(QV, inkKit.QUAD_FRAG, { ...U, uInk: { value: 0.975 }, uUseCol: { value: 0 } }, 'mul'), 5, 'ink-dots');
    await ctx.yield();
    mk(inkKit.instanced(sBase, shortS), inkKit.passMaterial(SV, inkKit.STROKE_FRAG, { ...U, uInk: { value: 0.975 }, uWave: { value: new THREE.Vector2(0.8, 1.7) } }, 'mul'), 5, 'ink-short');
    await ctx.yield();
    mk(inkKit.instanced(lBase, longS), inkKit.passMaterial(SV, inkKit.STROKE_FRAG, { ...U, uInk: { value: 0.975 }, uWave: { value: new THREE.Vector2(2.3, 5.1) } }, 'mul'), 5, 'ink-long');
    // exit dressing: five white asterisks round the ring, and the ring's own round glow (the portal's square halo
    // quad showed its straight edge on the flat wash, so it is switched off and painted here with a round falloff)
    const exC = path.pointAt(1, new THREE.Vector3()), exT = path.tangentAt(1, new THREE.Vector3()).normalize();
    const exR = new THREE.Vector3().crossVectors(exT, new THREE.Vector3(0, 1, 0)).normalize(), exU = new THREE.Vector3().crossVectors(exR, exT).normalize();
    for (let i = 0; i < 5; i++) {
      const a = 0.5 + i * 1.257, r = 11.5 + (i % 2) * 3.5;
      const p = exC.clone().addScaledVector(exR, Math.cos(a) * r).addScaledVector(exU, Math.sin(a) * r * 0.85 + 1).addScaledVector(exT, 2);
      const [aU, aV] = upright(1.3 + (i % 3) * 0.4, i * 0.5);
      blot([p.x, p.y, p.z], aU, aV, 4, 4, { mode: 5, own: [p.x, p.y, p.z, i * 1.3], rag: 0.6 });
    }
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { uTime: washU.uTime, uColor: { value: new THREE.Color('#F3EEDD') } },
      vertexShader: /* glsl */`varying vec2 vL; void main(){ vL = position.xy; vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.); mv.xy += position.xy; mv.z -= 0.4; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uColor; varying vec2 vL;
        void main(){ float r = length(vL) / 7.; float x = max(r - 0.985, 0.);
          float edge = (1. - smoothstep(1.2, 2.4, x)) * smoothstep(0.93, 0.985, r);
          float g = exp(-x * x * 900.) * 3.2 + exp(-x * 7.) * 0.75 * (0.9 + 0.1 * sin(uTime * 0.9)) + exp(-x * 2.2) * 0.07;
          gl_FragColor = vec4(uColor * g * edge * edge, 1.); }`,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, fog: false });
    const ringGlow = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), glowMat);
    ringGlow.position.copy(exC); ringGlow.renderOrder = 6; ringGlow.frustumCulled = false; scene.add(ringGlow); disposables.push(ringGlow.geometry, glowMat);
    // the white asterisks are the painting's only lights: written above 1 (no clamp) so the bloom, whose threshold sits
    // at 1 above every pigment, gives them and the ring a real glow while ink and stain stay exactly as written
    const GLINT_FRAG = inkKit.QUAD_FRAG.replace('min(col * (cov * vInfo.z), vec3(1.))', 'col * (cov * vInfo.z)');
    const whiteMat = inkKit.passMaterial(QV, GLINT_FRAG, { ...U, uInk: { value: 1 }, uUseCol: { value: 1 }, uGain: { value: ground === 'ochre' ? 1.25 : 1.4 } }, 'mul');
    whiteMat.blending = THREE.AdditiveBlending;
    mk(inkKit.instanced(qBase, whiteQ), whiteMat, 6, 'asterisks');
    await ctx.yield();

    // ---- scripted positions (pure functions of u)
    const win = (u, a, b, c, d) => smoothstep(a, b, u) * (1 - smoothstep(c, d, u));
    const kiteQ = path.pointAt(0.08, new THREE.Vector3()).addScaledVector(path.tangentAt(0.08, new THREE.Vector3()), 14); kiteQ.y -= 3.2;
    const cometQ = path.pointAt(uNew(0.62), new THREE.Vector3()).addScaledVector(port, 18);
    const size = new THREE.Vector2(), camP = new THREE.Vector3();
    const sunPlace = toWorld(hero.anchors.signs[0].hold);      // where the sun's stalk holds the disc when the mobile is at rest: the rubbed place of the wash
    const sunWorld = (out) => hero.signPose(0, out).applyMatrix4(hero.object.matrixWorld);
    // for the gaze: where the sun's disc is at a moment u of the flight and t of the clock, worked out from those two in
    // the gaze entry's own function (it was read from the pose the last update had left)
    const sunAt = (t, u) => hero.signPoseAt(0, Math.max(1 - (1 - u) * L / 883.5, 0), t, sunC).applyMatrix4(hero.object.matrixWorld);
    const isleGaze = toWorld(hero.anchors.at(330, -100, -240));
    const pace = (u) => 1.08 - 0.26 * smoothstep(0.36, 0.45, u) + 0.18 * smoothstep(0.76, 0.84, u);

    return {
      scene, path, duration: 45, pace,
      title: ground === 'night' ? 'The Ladder Orchard, Night' : ground === 'ochre' ? 'The Ladder Orchard, Ochre' : 'The Ladder Orchard',
      camera: { fov: 62, near: 0.3, far: 2500, lookAhead: 22, sway: 0.5, bank: 0.6 },
      pois: [
        { at: (t, u) => sunAt(t, u), from: 0, to: 0.42, weight: 0.4 },
        { at: isleGaze, from: uNew(0.44), to: uNew(0.64), weight: 0.32 },     // down and to port across the rungs: the island under the climb
        { at: (t, u) => sunAt(t, u), from: uNew(0.58), to: uNew(0.8), weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#F3EEDD', glow: 1, halo: false, revealDistance: 500 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0.2, radius: 0.45, threshold: 1.0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        camera.getWorldPosition(camP); wash.position.copy(camP);
        const uo = Math.max(1 - (1 - u) * L / 883.5, 0);      // the same moment on the first, longer route (the climb is unchanged)
        hero.setProgress(uo); hero.update(dt, time, camera);
        washU.uTime.value = time % 3600;
        washU.uSun.value.set(sunPlace.x - camP.x, sunPlace.y - camP.y, sunPlace.z - camP.z, 44);      // the rubbed place stays where it is; only the eye moves
        U.uTime.value = time % 3600; U.uHop.value = (time * 0.6) % 16;
        if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); if (size.y > 0) U.uRes.value.copy(size); }
        U.uShower.value = season === 'seed' ? 1 : win(u, 0.2, 0.235, 0.295, 0.33);
        U.uCross.value = clamp((u - 0.12) / 0.005, 0, 16);
        const o = U.uOff.value;
        o[0].set(kiteQ.x + clamp((u - 0.076) * 2600, -160, 160), kiteQ.y, kiteQ.z, win(u, 0.02, 0.035, 0.125, 0.14));
        const ck = (uo - 0.622) * 3000;
        o[1].set(cometQ.x + cT.x * ck, cometQ.y + cT.y * ck, cometQ.z + cT.z * ck, win(uo, 0.565, 0.58, 0.68, 0.695));
        if (rare) {
          sunWorld(_v).addScaledVector(fwd, 14).addScaledVector(port, lerp(-80, 80, clamp((uo - 0.64) / 0.2, 0, 1)));
          o[2].set(_v.x, _v.y, _v.z, win(uo, 0.5, 0.62, 0.86, 0.93));
        }
      },
      dispose() { hero.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
