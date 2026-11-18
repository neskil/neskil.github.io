// THE GREAT EGG: hero set piece of "The Engine-Turned Sea".
// A rose enamel egg 170 m tall and 120 m wide at its gold girdle (y 62), cut with a sunburst of 96 wavy
// rays under the glass and bound in a trellis of 24 gold laurel bands with a rose-cut diamond at every
// crossing. Its twelve gores hinge on the girdle and open like petals, ONCE: the primrose petals inside
// (barleycorn cut, beaded gold ribs, pearls; enamel on both faces) never stand as a closed shell, they rise
// with the rose gores and end as a songbird's fanned tail: five stand as a fan behind the portal, the side
// ones line the rose petals, the front one rolls down into the rose cup as a loop. The portal's ring of gold
// beads and pearls sits on a gold stem in a saucer of eight mauve petals (moire cut) that always lie open,
// inside a ring of great pearls on the floor. On top of the ring perches a small gold clockwork bird (body,
// head with beak, crest and pearl eyes, feet, five gold tail feathers, a winding key): it beats two mauve
// gores as wings and ticks its head from side to side. The inner face of every rose petal is paler rose
// enamel over the same sunburst (the cup and the lowered front gore stay gilt) and carries a row of sapphire
// and emerald cabochons. The front rose gore (+Z) lowers into a straight mirror-gilt
// gangway cut in basketweave (0.5 / 2 / 8 m squares by distance), with a beaded border, real laurel leaves
// and diamonds on its rims, a balustrade of turned gold posts and two rails along both edges, and four gold
// piers that rise out of the sea to carry it: from the side it is a railed bridge on columns, never a blade.
// The portal's light falls on every face near it and is mirrored in the gilt and the top coats (uGlow).
// MIRRORS that mirror: the sea under the Egg shows the Egg itself (rose shell, trellis and girdles drawn again
// upside down under the sea's glass, broken by the sea's cut), and with rampMirror the lowered gore shows the
// primrose fan, the mauve saucer and the portal's disc of light standing in its gilt.
//
// SPACE  origin = centre of the egg at the waterline (y 0 = the sea), +Y up, front = +Z (the lowered gore;
//        the brief points it east, at the sun). Closed: radius 60, height 170. Open: tips reach ~170 m out,
//        the ramp's tip is at (0, 26, 190). radius 150 / height 170 / center (0, 78, 0) are viewer hints.
//        Primrose petals: hinge radius 36 at y 68. Saucer: radius 20, hinge y 77. Bird: on the ring's top at
//        (0, 112, 3.4), about 19 m long, wings 31 m each hinged at y 119.6. Piers at z 92, 122, 152, 178.
// OPTS   palette  [sea, rose, primrose, mauve, green, gold, diamond] hex strings (brief palette by default)
//        detail   0.6..1 thins the real laurel leaves only      progress  initial opening (default 0.56)
//        apron    false = do not build the demo sea disc (the world brings its own sea)
//        apronRadius (2600)    portalGlow  false = hide the stand-in portal light    sunDir  world Vector3
//        rampMirror  true = draw the images in the lowered gore. Needs a background that writes alpha 1 (a
//                    sky dome drawn first): the images mark their pixels in the alpha channel, the rose shell
//                    blends by it, and a last full-screen triangle sets alpha back to 1. Default off.
// PROGRESS  hero.setProgress(u) with the journey's u (0..1); never wall-clock. Rose gores and primrose petals
//        together: 4 deg at 0, about 25 deg by 0.27, fully out and curled over by 0.46; the front gore is down
//        and flat by 0.47 and its piers rise from the sea 0.2 to 0.45; the portal's light rises 0.3 to 0.5; the
//        ramp's images show from 0.48; the sea's image grows with the opening flower. Gores hinge in the vertex
//        shader from uniforms; nothing is rebuilt. Viewer only: ?prog=0.3.
// ANCHORS (local space)
//        portalSeat  { position (0, 94, 0), facing (unit, toward the arriving camera), radius 17, pitchDeg 14 }
//        flyThrough  8 points, far to near, on one straight line climbing 14 degrees to the seat. It stays
//                    17 to 20 m over the ramp and the rose girdle; nothing else lies under it (the bird sits
//                    above the ring, the balustrade 5 m high at the gangway's edges).
//        floorY(r)   height of the floor under that line at r metres from the axis: the ramp's centre line
//                    outside the girdle, then a line rising to just under the portal's sill
//        goreTip, hinges { rose, primrose, mauve }, viewpoints { flower, underGores, rampFoot },
//        waterline { radius, y }, sunDirLocal, reflect { center, radii } (ellipsoid for a sea's mirror).
// ALSO   hero.parts { glow, apron } (set .visible), hero.skyUniforms (the tent's uniforms), export SKY_GLSL.
// COST   about 183k triangles and 23 draw calls alone; the sea's image adds 63k and 4 calls, rampMirror 14k
//        and 4 calls. No lights, no textures, ~350 ms build in small steps (it yields).
// LIGHT  none from the scene: every pixel mirrors the analytic light tent in SKY_GLSL (pearl belt, dark
//        periwinkle zenith, sea-blue under-sky, 3 degree sun 38 degrees up toward local +Z), so scene lights
//        do nothing to it. Scene fog is honoured (the brief's world has none). Enamel, gold and pearl are
//        soft-clamped at 1.4 linear; only diamond flashes (4..8) and the portal light bloom.
// MOVES  gores open on progress; opened petals breathe; a lift wave runs along the laurel at 8 m/s; real
//        leaves shiver; diamonds flash by view angle with a lobe limiter (never over 2.5 a second); the bird's
//        wings beat every 1.6 s (uniforms) and its head turns every 2.6 s (one object's rotation); the
//        apron's cut re-cuts itself (its wave travels along the lines at 0.6 m/s) and its bands of light race out with every metre flown.
// SEA    the apron is one sheet of enamel (periwinkle seen steeply, ultramarine at grazing angles) over engraving: one family of wavy lines,
//        never under two pixels wide, re-cut at twice the pitch as they recede up to the 14 m swell cut and then faded to a satin average (no
//        derivatives: the widths come from the cut's gradient, the range, N.V and uPixelAngle); three swell bands of light at least 5 percent of
//        the frame wide in which the lines themselves turn pearl (etsSeaBands, driven by uTravel); the Egg's own
//        image, and the images of the ten lesser eggs that matter most to the eye (uniforms uLE / uLT in skyUniforms, filled by the world).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEF_PALETTE = ['#8FA8E0', '#F1C9C4', '#F2E3A0', '#B79AD6', '#A9D6A0', '#D9B25A', '#F7F8FF'];

// ---------------------------------------------------------------------------------------------
// The light tent: one analytic function of direction, used for every reflection (and offered to
// the world for its dome as SKY_GLSL). uSunDir is the world-space direction TO the sun.
export const SKY_GLSL = /* glsl */`
uniform vec3 uSunDir;
uniform vec3 uZenith, uBelt, uUnder, uSeaAvg;
vec3 etsSky(vec3 d){
  float h = clamp(d.y, -1., 1.);
  float el = h * 1.5708 * (1.0 + 0.2146 * (1.0 - h * h));          // cheap asin, radians
  float up = smoothstep(-0.012, 0.012, h);
  float belt = smoothstep(-0.02, 0.105, el) * (1.0 - smoothstep(0.105, 0.34, el));   // brightest ~6 deg, gone by ~19
  belt = belt * 0.82 + 0.18 * (1.0 - smoothstep(0.0, 0.5, el));
  vec3 c = mix(uZenith, uBelt, belt);
  // three faint cirrus bars across the zenith, so a top coat has something crisp to mirror
  float bx = d.x / max(0.25, h + 0.25);
  float bars = 0.0;
  bars += (1.0 - smoothstep(0.035, 0.05, abs(bx + 0.42)));
  bars += (1.0 - smoothstep(0.05, 0.07, abs(bx - 0.05)));
  bars += (1.0 - smoothstep(0.03, 0.045, abs(bx - 0.55)));
  c += uBelt * 0.16 * bars * smoothstep(0.45, 0.8, h);
  c = mix(mix(uSeaAvg, uUnder, smoothstep(0.0, 0.6, -h)), c, up);
  return c;
}
float etsSun(vec3 d, float soft){                                    // 3 degree disc (cos 1.5 deg = 0.99966)
  float m = dot(d, uSunDir);
  return smoothstep(0.99966 - soft, 0.99966 + soft * 0.25, m) * step(0.0, d.y);
}
// the sea's own body colour, glass over bright silver: the palette's own periwinkle where the eye looks steeply down, deepening by path length to
// ultramarine at grazing angles (the tint raised to 2.8 and dimmed, so #8FA8E0 lands near #2E418F on screen), where it meets the sky at a hard line
uniform vec3 uSeaTint;
uniform float uTravel;                                               // metres flown, plus the swell's own 0.6 m/s
vec3 etsSeaBase(float nv, vec2 p, float t){
  float gr = smoothstep(0.02, 0.4, nv);
  return exp(log(max(uSeaTint, vec3(0.02))) * mix(2.8, 1.0, gr)) * mix(0.47, 1.1, gr);
}
// THE SEA'S ENGINE TURNING. No derivatives anywhere: d is the rate of a family's phase per pixel, worked out by the caller from the cut's own
// gradient, the range, N.V and uPixelAngle (the brief's w = p N.V / (distance uPixelAngle), taken along and across the line of sight).
// A line is never under two pixels wide; a family whose pitch falls under about six pixels fades out to the satin average.
vec2 etsHair(float f, float dl, float df){                           // x: the lines; y: how far the family has gone to satin
  // dl: the phase's rate per pixel along the family's mean run (it picks the pitch, so a line keeps its pitch along its whole length and never
  // breaks into dashes); df: the rate just here (it holds the width). The cut is re-cut at twice the pitch as it recedes (1.75 m lines up to the
  // 14 m swell cut), so the near and middle sea stay crisp and regular.
  float lv = clamp(log2(max(dl, 1e-5) / 0.5), -5.0, 2.0), n = floor(lv), fr = lv - n;
  float sc = exp2(-n), d0 = df * sc, m0 = dl * sc;
  float keepA = 1.0 - smoothstep(0.97, 1.8, m0 * 0.5), keepB = (1.0 - fr) * (1.0 - smoothstep(0.97, 1.8, m0));
  float la = 1.0 - smoothstep(0.2 * d0, 0.35 * d0, abs(sin(0.25 * f * sc))), lb = 1.0 - smoothstep(0.4 * d0, 0.7 * d0, abs(sin(0.5 * f * sc)));
  // where the wave of the cut crowds the lines locally (seen end on at a grazing angle it is a zigzag finer than the pixels) a two-pixel line would
  // close into a blob: there the line gives way to the satin average instead
  float sA = smoothstep(1.6, 2.6, d0), sB = smoothstep(0.8, 1.3, d0);
  return vec2(max(la * keepA * (1.0 - sA), lb * keepB * (1.0 - sB)), max(1.0 - keepA, sA));
}
// SWELL BANDS OF LIGHT: three bands where the groove families catch the pearl belt. Each is 0.06 of the sine of the depression wide (6.6 percent of
// the frame's height), has a clean edge (px: about a pixel and a half), is born underfoot and races out to the horizon with every metre flown.
float etsBand1(float wv, float c, float px){
  float ctr = 0.045 + 0.96 * (1.0 - c) * (1.0 - c) * (1.0 - c);
  return (1.0 - smoothstep(0.03 - px, 0.03 + px, abs(wv - ctr))) * smoothstep(0.0, 0.05, c) * (1.0 - smoothstep(0.9, 1.0, c));
}
float etsSeaBands(vec3 V, float nv, float px){
  float wv = nv + 0.07 * V.x - 0.045 * V.z, c0 = fract(uTravel / 150.0);
  px = max(px, 1e-4);
  return max(etsBand1(wv, c0, px), max(etsBand1(wv, fract(c0 + 0.3333), px), etsBand1(wv, fract(c0 + 0.6667), px)));
}
// the sea with its cut gone to satin (the far sea, and all of it that the dome draws beyond the sheet's rim): the bands survive in it
vec3 etsSeaSatin(vec3 body, vec3 V, float nv, float px, float cut, float sat){
  float k = cut + 0.13 * sat;                                         // 0.13: the mean cover of the lines where they can still be seen
  vec3 c = body * mix(vec3(1.0), vec3(0.42, 0.5, 0.78), k);           // every cut is a deeper channel of glass: darker and bluer
  // A band is light caught on the engraving, never a sheet over it: inside a band the cut lines themselves turn pearl and run on unbroken over the
  // sea's own colour, whichever way they lie; where the cut has gone to satin the lines too fine to see give their share (0.15, their cover) as a
  // soft sheen through which the sea keeps its enamel colour.
  return mix(c, uBelt * 0.72, (cut + 0.15 * sat) * etsSeaBands(V, nv, px));
}
vec3 etsClamp(vec3 c){                                               // soft clamp at 1.4 linear, hue kept
  float m = max(c.r, max(c.g, c.b));
  float k = m < 1.0 ? 1.0 : (1.0 + 0.4 * (1.0 - exp(-(m - 1.0) / 0.4))) / max(m, 1e-4);
  return c * k;
}
// ENGINE TURNING UNDER THE GLASS at the point p of the sheet (world x, z): one family of long wavy lines, the wave cut. Returns (line, satin).
// Every line is two pixels wide or more; the family is re-cut at twice the pitch as it recedes, and beyond that it fades into the satin average.
// V: unit vector to the eye, nv: its y, dist: range, t: time, pa: the angle one pixel covers. No derivatives.
vec2 etsSeaCut(vec2 p, vec3 V, float nv, float dist, float t, float pa){
  float q1 = 0.21 * p.y - t * 0.126;                               // the cut re-cuts itself: its wave travels along the lines at 0.6 m/s under a surface that never moves
  // the rate of the phase per pixel, analytically: a pixel covers dist * pa metres across the line of sight and that over N.V along it
  vec2 hv = -V.xz; float hl = sqrt(dot(hv, hv) + 1e-8); vec2 fwd = hv / hl, lat = vec2(-fwd.y, fwd.x);
  float fl = dist * pa, fa = fl / max(nv, 0.01);
  // where the wave itself is foreshortened to a few pixels a turn (the lines seen end on, far off) it cannot be drawn: a waving line would break
  // into beads there, so the wave flattens out and the lines run on straight
  float ww = 1.0 - smoothstep(0.35, 0.8, 0.21 * sqrt(lat.y * lat.y * fl * fl + fwd.y * fwd.y * fa * fa + 1e-12));
  float f1 = 3.59 * p.x + 2.4 * ww * sin(q1);
  float gz = 0.504 * ww * cos(q1);
  float a1 = (3.59 * lat.x + gz * lat.y) * fl, b1 = (3.59 * fwd.x + gz * fwd.y) * fa;
  float am = 3.59 * lat.x * fl, bm = 3.59 * fwd.x * fa, aw = 0.356 * ww * lat.y * fl, bw = 0.356 * ww * fwd.y * fa;   // the mean run, and the wave's share of it (rms)
  return etsHair(f1, sqrt(am * am + bm * bm + aw * aw + bw * bw + 1e-12), sqrt(a1 * a1 + b1 * b1 + 1e-12));
}
// the sheet's ground before anything stands mirrored in it: the enamel's body and a little of the tent in the top coat
vec3 etsSeaGround(vec3 V, float nv, float dist){
  float fr = 1.0 - clamp(nv, 0.0, 1.0), f5 = fr * fr; f5 = f5 * f5 * fr;
  return etsSeaBase(nv, vec2(0.0), 0.0) + etsSky(vec3(-V.x, V.y, -V.z)) * 0.05 * mix(0.04 + 0.96 * f5, 1.0, smoothstep(900.0, 2600.0, dist));
}
// a lesser egg standing mirrored in the glass: where the mirrored ray R from the point P of the sheet meets the egg e (x, z, height), the egg upside
// down in its own deep enamel with its gold girdle a bright line; .a is its cover (0 where the ray misses)
vec4 etsEggImage(vec3 P, vec3 R, vec3 e, vec3 tint){
  float eh = max(e.z, 1.0);
  vec3 ir = vec3(1.0 / (0.335 * eh), 1.0 / (0.53 * eh), 1.0 / (0.335 * eh));
  vec3 o = (P - vec3(e.x, 0.47 * eh, e.y)) * ir, dd = R * ir;
  float qa = max(dot(dd, dd), 1e-8), qb = dot(o, dd), qc = dot(o, o) - 1.0, disc = qb * qb - qa * qc;
  if (disc > 0.0 && qb < 0.0 && qc > 0.0) {
    float tt = (-qb - sqrt(max(disc, 0.0))) / qa;
    vec3 hp = o + dd * tt;
    float hy = hp.y * 0.53 + 0.47, facing = clamp(-dot(hp, dd) / max(sqrt(qa), 1e-4), 0.0, 1.0);
    vec3 et = clamp(tint, vec3(0.02), vec3(1.0));
    vec3 ec = et * et * (0.1 + 0.34 * facing) + et * et * 0.12 * smoothstep(0.2, 0.9, hy);
    ec = mix(ec, vec3(0.62, 0.45, 0.16), 1.0 - smoothstep(0.012, 0.022, abs(hy - 0.36)));
    return vec4(ec * mix(vec3(1.0), vec3(0.62, 0.7, 1.0), 0.45), smoothstep(0.0, 0.05, disc / qa));
  }
  return vec4(0.0);
}
// one of the gangway's gold piers standing mirrored in the glass: where the mirrored ray R from the point P of the sheet passes the column e (x, z,
// height), the column upside down in its own gold, a shaft with a wider capital and foot; .a is its cover, soft over one pixel (pa: a pixel's angle).
// The piers rise out of the sea: 'sunk' is how far the column still stands under it, so the image shows what stands above the water and no more
vec4 etsPierImage(vec3 P, vec3 R, vec3 e, float dist, float pa, float sunk){
  vec2 o = P.xz - e.xy, d = R.xz;
  float a = max(dot(d, d), 1e-6), t = -dot(o, d) / a;
  if (t <= 0.0) return vec4(0.0);
  float ys = t * R.y, y = ys + sunk, h = max(e.z, 8.0);            // ys: height above the sea; y: height on the column, which is still sunk by 'sunk'
  vec2 q = o + d * t; float s = sqrt(dot(q, q) + 1e-8);            // the ray's least distance from the column's axis, in plan
  float rad = 1.5 + 1.8 * smoothstep(h - 5.0, h - 1.4, y) + 2.0 * (1.0 - smoothstep(0.2, 3.4, y));   // (the lathe's own profile: shaft 1.5, capital 3.3, foot 3.5)
  float w = max(0.5 * (dist + t) * pa, 0.01);
  float cov = (1.0 - smoothstep(rad - w, rad + w, s)) * smoothstep(-w, w, ys) * (1.0 - smoothstep(h - w, h + w, y));
  float sc = min(s, rad), facing = sqrt(max(1.0 - sc * sc / (rad * rad), 0.0));   // (the coordinate across the column, held to the column before it is squared)
  return vec4(vec3(0.62, 0.45, 0.16) * (0.45 + 0.55 * facing) * mix(vec3(1.0), vec3(0.62, 0.7, 1.0), 0.45), cov);
}
`;

// ---------------------------------------------------------------------------------------------
// One vertex transform for everything that rides on an egg (shell, bands, leaves, beads, gems).
// A vertex is  anchor (gore index, da, s; closed meridian rC, yC, psi)  +  offset in the surface
// frame (position = across, along, out).  s <= 0 is the fixed cup; s > 0 hinges on the girdle.
const POSE_GLSL = /* glsl */`
attribute vec4 aG;      // gore index, da (rad from gore centre), s (m along the meridian from the hinge), spare
attribute vec3 aM;      // closed meridian point: radius, height, psi (lean of the tangent toward the axis)
uniform vec4 uEgg;      // hinge radius, hinge y, gore count, azimuth of gore 0
uniform vec4 uPoseG, uPoseF, uPoseN;   // open pose (theta, straight length, curvature, cross keep): general, front, neighbour
uniform vec3 uE;        // eased opening 0..1: general, front, neighbour
uniform float uHalf;    // 1 = this egg stands half a gore round, so a GAP between two gores faces the front (no lowered front gore: the two beside the gap take the neighbour pose)
uniform vec4 uFan;      // the petals behind the portal stand as a fan: theta, straight length, curvature, amount (0 = all alike)
uniform float uSeed, uTime;
varying vec3 vWPos, vN, vT, vB;
varying vec4 vPat;      // absolute longitude (rad), s, closed radius, gore index
varying vec3 vLoc;      // da, offset.out, front weight
float eh(float n){ return fract(sin(n * 127.1 + uSeed * 31.7) * 43758.5453); }
void etsPose(vec3 off, vec3 nloc, out vec3 P, out vec3 Nn, out vec3 Tt, out vec3 Bb){
  float gi = aG.x, da = aG.y, s = aG.z, n = uEgg.z;
  float wF = (1.0 - uHalf) * (1.0 - step(0.5, gi));
  float wN = mix(step(0.5, gi) * (1.0 - step(1.5, gi)), 1.0 - step(0.5, gi), uHalf) + step(n - 1.5, gi);
  vec4 pp = uPoseG;
  pp.x += (eh(gi + 3.0) - 0.5) * 0.16; pp.z *= 0.8 + 0.4 * eh(gi + 7.0);
  float wB = uFan.w * smoothstep(0.2, 0.8, 0.5 - 0.5 * cos((gi + 0.5 * uHalf) * 6.2831853 / n));
  pp.xyz = mix(pp.xyz, uFan.xyz * vec3(1.0 + (eh(gi + 5.0) - 0.5) * 0.3, 1.0, 1.0), wB);
  pp = mix(pp, uPoseN, wN); pp = mix(pp, uPoseF, wF);
  float e = mix(mix(uE.x, uE.z, wN), uE.y, wF);
  float lag = (eh(gi + 11.0) - 0.5) * 0.12 * (1.0 - wF);
  e = clamp(e * (1.0 + abs(lag)) - max(lag, 0.0), 0.0, 1.0) * step(0.0, s);
  // petals breathe a little once they are out (never the lowered front gore: the camera flies it)
  pp.x += 0.016 * sin(uTime * 0.45 + gi * 1.7) * e * (1.0 - wF);
  pp.z *= 1.0 + 0.06 * sin(uTime * 0.31 + gi * 2.3) * (1.0 - wF);
  float sp = max(s, 0.0);
  // closed pose (exact lathe), in the hinge frame x across, u out, v up
  float psi = aM.z, sd = sin(da), cd = cos(da);
  vec3 Pc = vec3(aM.x * sd, aM.x * cd - uEgg.x, aM.y - uEgg.y);
  vec3 Nc = vec3(cos(psi) * sd, cos(psi) * cd, sin(psi));
  vec3 Bc = vec3(-sin(psi) * sd, -sin(psi) * cd, cos(psi));
  vec3 Tc = vec3(cd, -sd, 0.0);
  float phi = pp.x * e, cph = cos(phi), sph = sin(phi);
  #define ROTX(q) vec3(q.x, q.y * cph + q.z * sph, -q.y * sph + q.z * cph)
  vec3 Pr = ROTX(Pc), Nr = ROTX(Nc), Br = ROTX(Bc), Tr = ROTX(Tc);
  // open pose: a straight run, then a constant-curvature curl
  float sa = min(sp, pp.y), sb = max(sp - pp.y, 0.0), kq = max(pp.z, 2e-4);
  float th = pp.x, th2 = pp.x + kq * sb;
  vec2 c = sa * vec2(sin(th), cos(th)) + vec2(cos(th) - cos(th2), sin(th2) - sin(th)) / kq;
  vec2 t2 = vec2(sin(th2), cos(th2)), n2 = vec2(cos(th2), -sin(th2));
  float dk = da * pp.w, sag = aM.x * (cd - 1.0) * pp.w;
  vec3 No = vec3(sin(dk), n2 * cos(dk));
  vec3 To = vec3(cos(dk), -n2 * sin(dk));
  vec3 Bo = vec3(0.0, t2);
  vec3 Po = vec3(aM.x * sd, c + n2 * sag);
  float m = smoothstep(0.12, 1.0, e);
  vec3 Ph = mix(Pr, Po, m);
  vec3 Nh = mix(Nr, No, m), Bh = mix(Br, Bo, m), Th = mix(Tr, To, m);
  Nh /= max(length(Nh), 1e-4); Bh /= max(length(Bh), 1e-4); Th /= max(length(Th), 1e-4);
  Ph += Th * off.x + Bh * off.y + Nh * off.z;
  vec3 nn = Th * nloc.x + Bh * nloc.y + Nh * nloc.z;
  float az = uEgg.w + gi * 6.2831853 / n;
  vec3 er = vec3(sin(az), 0.0, cos(az)), et = vec3(cos(az), 0.0, -sin(az)), ey = vec3(0.0, 1.0, 0.0);
  #define TOL(q) (et * q.x + er * q.y + ey * q.z)
  P = TOL(Ph) + er * uEgg.x + ey * uEgg.y;
  Nn = TOL(nn); Tt = TOL(Th); Bb = TOL(Bh);
  vPat = vec4(az + da, s, aM.x, gi);
  vLoc = vec3(da, off.z, wF);
}
`;

const VERT_POSED = /* glsl */`
#include <common>
#include <fog_pars_vertex>
POSE_CHUNK
attribute vec4 aUv;     // gold relief: l along, w across (-1..1), spare, spare / gems: stone hash in .x
uniform float uLift;
varying vec4 vUv4;
void main(){
  vec3 off = position;
  // laurel leaves lift in waves that run along each band (real leaves only: uLift > 0)
  off.z += uLift * max(position.y, 0.0) * 0.105 * (0.6 + 0.4 * sin(aG.w * 0.31 - uTime * 2.5));
  vec3 P, Nn, Tt, Bb;
  etsPose(off, normal, P, Nn, Tt, Bb);
  vec4 wp = modelMatrix * vec4(P, 1.0);
  vWPos = wp.xyz;
  mat3 m3 = mat3(modelMatrix);
  vN = m3 * Nn; vT = m3 * Tt; vB = m3 * Bb;
  vUv4 = aUv;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// static pieces (stem, girdle mounts, portal ring, sea apron): ordinary geometry, tangent supplied
const VERT_STATIC = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aUv;
attribute vec3 aTan;
varying vec3 vWPos, vN, vT, vB;
varying vec4 vPat; varying vec3 vLoc; varying vec4 vUv4;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWPos = wp.xyz;
  mat3 m3 = mat3(modelMatrix);
  vN = m3 * normal; vT = m3 * aTan; vB = cross(vT, vN);
  vPat = vec4(position.x, position.z, length(position.xz), 0.0);
  vLoc = vec3(0.0); vUv4 = aUv;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// shared fragment library: environment (tent + one mirrored ellipsoid), engine-turned mirror
const FRAG_LIB = /* glsl */`
#include <common>
#include <fog_pars_fragment>
SKY_CHUNK
uniform float uPixelAngle, uTime;
uniform vec3 uRefC, uRefR, uRefTint;     // one neighbour egg mirrored analytically (radii 0 = none)
uniform float uRefOn;
varying vec3 vWPos, vN, vT, vB;
// MIRROR IMAGES. A copy of a mesh drawn reflected in a plane (the sea, or the lowered gore's gilt face) is shaded as the real thing it mirrors:
// uFlip is -1 on such a copy, uMir its plane in world space (unit normal, offset), uDim how dim the image is.
uniform vec4 uMir;
uniform float uFlip, uDim, uRampImg, uRampOn, uRampL;
uniform vec3 uRampH, uRampA, uRampX;     // the lowered gore in world space: a point on its hinge, the unit direction down it, the unit direction across it
uniform float uOut[17];                  // its half width at 17 stations along its length
vec3 gP;                                 // the shaded point in real space
vec3 mirP(vec3 p){ return p - (1.0 - uFlip) * (dot(uMir.xyz, p) + uMir.w) * uMir.xyz; }
vec3 mirD(vec3 v){ return v - (1.0 - uFlip) * dot(uMir.xyz, v) * uMir.xyz; }
// basketweave squares at three sizes (0.5 m for the close pass, the brief's 2 m, 8 m for the far range): the largest that the pixels still resolve is shown
void etsWeave(vec2 q, float pxm, out float P, out float gap, out float w0){
  float r0 = smoothstep(2.0, 4.5, 0.5 / pxm), r1 = smoothstep(2.0, 4.5, 2.0 / pxm), r2 = smoothstep(2.0, 4.5, 8.0 / pxm);
  w0 = r0; float w1 = (1.0 - r0) * r1, w2 = (1.0 - r0) * (1.0 - r1) * r2;
  vec2 q0 = q * 2.0, q1 = q * 0.5, q2 = q * 0.125;
  P = w0 * mod(floor(q0.x) + floor(q0.y), 2.0) + w1 * mod(floor(q1.x) + floor(q1.y), 2.0) + w2 * mod(floor(q2.x) + floor(q2.y), 2.0) + 0.5 * (1.0 - w0 - w1 - w2);
  vec2 c0 = abs(fract(q0) - 0.5), c1 = abs(fract(q1) - 0.5), c2 = abs(fract(q2) - 0.5);
  gap = w0 * smoothstep(0.42, 0.5, max(c0.x, c0.y)) + w1 * smoothstep(0.45, 0.5, max(c1.x, c1.y)) + w2 * smoothstep(0.47, 0.5, max(c2.x, c2.y));
}
// an image in the gilt ramp: kept only where the eye's ray reaches it through the gore's own outline, tinted gold and broken into the weave's squares
vec3 etsRampImage(vec3 wp, float pixelAngle){
  if (uRampImg < 0.5) return vec3(1.0);
  float sF = dot(uMir.xyz, wp) + uMir.w, sC = dot(uMir.xyz, cameraPosition) + uMir.w;
  if (uRampOn < 0.5 || sF > -0.05 || sC < 0.5) discard;
  vec3 hit = cameraPosition + (wp - cameraPosition) * (sC / max(sC - sF, 1e-3));
  vec3 hr = hit - uRampH; float sA = dot(hr, uRampA), xA = dot(hr, uRampX);
  float t = clamp(sA / max(uRampL, 1.0), 0.0, 1.0) * 16.0, fi = min(floor(t), 15.0); int i = int(fi);
  float hw = mix(uOut[i], uOut[i + 1], t - fi);
  if (sA < 1.0 || sA > uRampL - 0.5 || abs(xA) > hw - 4.3) discard;
  float dh = max(length(hit - cameraPosition), 0.05);
  float P, gap, w0; etsWeave(vec2(xA, sA), max(dh * pixelAngle / max(sC / dh, 0.05), 1e-4), P, gap, w0);
  return vec3(1.0, 0.8, 0.42) * mix(0.7, 1.12, P) * (1.0 - 0.5 * gap);
}
varying vec4 vPat; varying vec3 vLoc; varying vec4 vUv4;
uniform vec4 uPortal;                    // the portal's light: world centre, radius
uniform float uGlow;                     // 0 until the mauve egg cracks, 1 when the corolla is open
const vec3 PORTAL_C = vec3(1.0, 0.9, 0.68);
// the portal seen in a mirror of roughness sig (radians): a soft disc of light, never a hard edge
float etsGlow(vec3 ro, vec3 rd, float sig){
  vec3 oc = uPortal.xyz - ro; float t = dot(oc, rd);
  float d2 = max(dot(oc, oc) - t * t, 0.0);
  float r2 = uPortal.w * uPortal.w, rho2 = max(r2 + sig * sig * t * t, 1e-3);
  return uGlow * step(0.0, t) * (r2 / rho2) * exp(-min(d2 / rho2, 30.0));
}
// its light falling on a face near it (through the glass, so the caller tints it)
float etsNear(vec3 N){
  vec3 L = uPortal.xyz - gP; float d1 = max(sqrt(dot(L, L)), 1e-3); L /= d1;
  float dr = max(d1 - uPortal.w, 0.0);                 // metres out from the ring: the light lies along the edges nearest it and the colour beyond stays deep
  return uGlow * (1.0 / (1.0 + dr * dr / 80.0)) * (0.2 + 0.8 * max(dot(N, L), 0.0));
}
const float SUN_I = 26.0;
vec3 etsImage(){                         // the mirror image under the sea: dimmer, bluer, deepening toward its far end
  float far = smoothstep(10.0, 190.0, gP.y);
  return mix(vec3(1.0), uDim * mix(vec3(1.0), vec3(0.5, 0.56, 0.86), far * (1.0 - uRampImg)), step(uFlip, 0.0));
}
vec3 etsEnv(vec3 ro, vec3 rd){
  vec3 c = etsSky(rd);
  vec3 ir = 1.0 / max(uRefR, vec3(1e-3));
  vec3 o = (ro - uRefC) * ir, d = rd * ir;
  float a = max(dot(d, d), 1e-8), b = dot(o, d), cc = dot(o, o) - 1.0;
  float disc = b * b - a * cc;
  if (uRefOn > 0.5 && disc > 0.0 && b < 0.0 && cc > 0.0) {
    float t = (-b - sqrt(max(disc, 0.0))) / a;
    vec3 nn = (o + d * t) * ir; nn /= max(length(nn), 1e-5);
    vec3 r2 = rd - 2.0 * dot(rd, nn) * nn;
    float edge = smoothstep(0.0, 0.02, disc / a);
    c = mix(c, uRefTint * (0.25 + 0.5 * dot(etsSky(r2), vec3(0.33))) * mix(0.55, 1.0, max(dot(nn, -rd), 0.0)), edge);
  }
  c += PORTAL_C * 1.4 * etsGlow(ro, rd, 0.05);
  return c;
}
// the fine cut seen from afar: a broad pearly lobe, so enamel keeps its body colour away from the bands
vec3 etsWide(vec3 N, vec3 R){
  float t = smoothstep(-0.9, 0.6, 0.6 * R.y + 0.4 * N.y);
  return mix(vec3(0.38, 0.36, 0.45), vec3(0.98, 0.94, 0.86), t);
}
vec3 etsGold(vec3 mir, vec3 tint){
  float lum = dot(mir, vec3(0.3, 0.5, 0.2));
  vec3 warm = vec3(lum * 1.05, lum * 0.98, lum * 0.8);
  mir = mix(warm, mir, 0.45);                          // gold kills most of the tent's blue
  return mir * mix(tint * tint * 1.15, tint, smoothstep(0.1, 0.9, lum));
}
// G: unit groove gradient, S: slope vector (already scaled by line visibility k)
vec3 etsMirror(vec3 N, vec3 V, vec3 G, vec3 S, float k){
  vec3 I = -V;
  vec3 nb = N + 0.35 * S; nb /= max(length(nb), 1e-4);
  vec3 rs = reflect(I, nb);
  vec3 sharp = etsEnv(gP, rs) + SUN_I * etsSun(rs, 0.0012);
  vec3 n1 = N - 0.33 * G; n1 /= max(length(n1), 1e-4);
  vec3 n2 = N + 0.33 * G; n2 /= max(length(n2), 1e-4);
  vec3 r0 = reflect(I, N);
  vec3 satin = (etsEnv(gP, reflect(I, n1)) + etsEnv(gP, r0) + etsEnv(gP, reflect(I, n2))) * 0.3333;
  vec3 Tg = cross(N, G); Tg /= max(length(Tg), 1e-4);
  vec3 H = V + uSunDir; H /= max(length(H), 1e-4);
  float th = dot(Tg, H);
  float st = max(0.0, 1.0 - th * th);
  st *= st; st *= st; st *= st; st *= st; st *= st;
  satin += 1.6 * st * smoothstep(-0.1, 0.5, dot(N, uSunDir));
  return mix(satin, sharp, k);
}
// gilt cut with its groove gradient along Gd: the mirror smeared across the grooves, and the portal's light drawn out into a streak
vec3 etsGilt(vec3 N, vec3 V, vec3 R, vec3 Gd, vec3 e0){
  vec3 n1 = N - 0.3 * Gd; n1 /= max(length(n1), 1e-4);
  vec3 n2 = N + 0.3 * Gd; n2 /= max(length(n2), 1e-4);
  vec3 acc = (etsEnv(gP, reflect(-V, n1)) + e0 + etsEnv(gP, reflect(-V, n2))) * 0.3333;
  vec3 oc = uPortal.xyz - gP; float tt = dot(oc, R);
  vec3 dv = oc - tt * R;
  vec3 Gp = Gd - R * dot(Gd, R); Gp /= max(length(Gp), 1e-4);
  float da = dot(dv, Gp), db2 = max(dot(dv, dv) - da * da, 0.0);
  float r2 = uPortal.w * uPortal.w, tp = max(tt, 0.0);
  float ra2 = max(r2 + 0.5 * tp * tp, 1e-3), rb2 = max(r2 + 0.004 * tp * tp, 1e-3);
  float daw = 5.5 * sqrt(ra2), dac = clamp(da, -daw, daw);          // (the coordinate across the streak, held to the streak's own reach before it is squared)
  float streak = uGlow * step(0.0, tt) * sqrt(sqrt(max(r2 / ra2, 0.0))) * exp(-min(dac * dac / ra2 + db2 / rb2, 30.0));
  return acc + PORTAL_C * 1.5 * streak;
}
// authored line fields. kind: 0 sunburst, 1 barleycorn, 2 moire wave, 3 basketweave, 4 sea swell
// in: a longitude (or x), s meridian (or z), r metric radius, x across in metres. out: gradient (per metre, in T,B), slope, height, phase
void etsCut(float kind, float a, float s, float r, float x, out vec2 g, out vec2 sl, out float h, out float f){
  float ir = 1.0 / max(r, 0.6);
  if (kind < 0.5) {
    float q = s / 3.5;
    f = 96.0 * a + 2.2 * sin(q);
    g = vec2(96.0 * ir, 0.63 * cos(q));
    h = sin(f); sl = cos(f) * g / max(length(g), 1e-4);
  } else if (kind < 1.5) {
    // barleycorn: 48 wavy lines round the egg, alternate lines waving opposite ways, so they close into rows of grains
    float u = 24.0 * a, w = 0.9 * s, su = sin(u), cu = cos(u);
    f = 2.0 * (u + 0.9 * sin(w) * cu);
    g = 2.0 * vec2(24.0 * ir * (1.0 - 0.9 * sin(w) * su), 0.81 * cos(w) * cu);
    h = cos(f); sl = -sin(f) * g / max(length(g), 1e-4);
  } else if (kind < 2.5) {
    float q = 10.0 * a + 0.5 * sin(s * 0.4);
    f = 4.833 * s + 1.6 * sin(q);
    g = vec2(16.0 * cos(q) * ir, 4.833 + 0.32 * cos(q) * cos(s * 0.4));
    h = sin(f); sl = cos(f) * g / max(length(g), 1e-4);
  } else if (kind < 3.5) {
    float par = mod(floor(x * 2.0) + floor(s * 2.0), 2.0);
    f = 62.83 * mix(x, s, par);
    g = mix(vec2(62.83, 0.0), vec2(0.0, 62.83), par);
    // bevel between squares so the weave reads as relief
    vec2 cell = abs(fract(vec2(x, s) * 2.0) - 0.5);
    float gap = smoothstep(0.42, 0.5, max(cell.x, cell.y));
    h = mix(sin(f), -1.0, gap); sl = cos(f) * (1.0 - gap) * g / 62.83;
  } else {
    float q = 0.105 * a;
    f = 0.449 * s + 1.4 * sin(q) - uTime * 0.269;
    g = vec2(0.147 * cos(q), 0.449);
    h = sin(f); sl = cos(f) * g / max(length(g), 1e-4);
  }
}
`;

const FRAG_ENAMEL = /* glsl */`
uniform vec3 uTint, uInTint;
uniform float uWide, uRim, uBand;                            // how much of the broad pearly lobe the silver ground takes (0.5 = satin, less = a sharper mirror); the top coat's mirror at the rim (1 = full)
uniform float uKind, uInKind, uInGlass, uSea, uCollarR;
uniform vec4 uLE[10];                                 // the lesser eggs that matter most to the eye now, for the sea's mirror: x, z, height, how much of the image shows
uniform vec3 uLT[10];                                 // their enamel
uniform vec3 uPier[4];                                // the gangway's four piers, for the sea's mirror: world x, z, height (kept by update())
uniform float uPierSunk;                              // how far the piers still stand under the sea (the piers' own state, kept by update())
uniform float uInPetal;                               // 1 = the inner faces of the gores that open as petals are enamel too (the lowered front gore and the cup stay gilt)
uniform vec3 uPetalTint;
uniform vec2 uDepth;                                  // glass depth (path multiplier): outer face, inner face
uniform float uFlat;                                  // 0..1: how little the glass deepens toward grazing angles (a pale enamel on broad petals: 0.4, so its rims still deepen)
uniform float uGround;                                // how much of the bright ground shows whatever the cut mirrors (0.35 deep glass .. 0.7 pale glass)
uniform vec2 uCoat;                                   // the top coat's mirror at normal incidence: outer face, inner face
uniform vec2 uLum;                                    // bright silver ground under the glass (0..1): outer face, inner face
void main(){
  float ff = gl_FrontFacing ? 1.0 : -1.0;
  vec3 rt = etsRampImage(vWPos, uPixelAngle);
  if (uRampImg > 0.5 && vLoc.z > 0.5) discard;        // the gore does not mirror itself
  gP = mirP(vWPos);
  vec3 N = mirD(vN) / max(length(vN), 1e-4) * ff;
  vec3 T = mirD(vT) / max(length(vT), 1e-4), B = mirD(vB) / max(length(vB), 1e-4);
  vec3 Vv = mirP(cameraPosition) - gP; float dist = max(length(Vv), 0.05); vec3 V = Vv / dist;
  float NV = max(dot(N, V), 0.0);
  float inner = 0.5 - 0.5 * ff;
  float lz = clamp(vLoc.z, 0.0, 1.0);                 // the front-gore weight, held to its own range (a multisampled edge may read it outside)
  float petal = uInPetal * inner * (1.0 - lz) * smoothstep(0.0, 1.5, vPat.y) * smoothstep(1.7, 2.1, (0.2618 - abs(vLoc.x)) * vPat.z);   // rose enamel inside a gilt margin along each laurel edge
  float kind = mix(mix(uKind, uInKind, inner), uKind, step(0.5, petal));
  vec2 g, sl; float h, f;
  float xm = vPat.z * vLoc.x;
  etsCut(kind, vPat.x, vPat.y, vPat.z, xm, g, sl, h, f);
  float bw = step(2.5, kind) * (1.0 - step(3.5, kind));          // gilt basketweave
  float kq = smoothstep(1.5, 5.0, 0.5 * NV / (dist * uPixelAngle));   // squares resolved on screen
  g = mix(g, mix(vec2(44.4, 44.4), g, kq), bw); sl *= mix(1.0, kq, bw);
  if (uSea > 0.5) {                                   // ripple collar at the waterline: f = range / p
    float rg = vPat.z, wc = 1.0 - smoothstep(uCollarR + 2.0, uCollarR + 11.0, rg);
    float f2 = rg * 4.19;
    vec2 gr = vPat.xy / max(rg, 1e-3);
    g = mix(g, gr * 4.19, wc); sl = mix(sl, cos(f2) * gr, wc); h = mix(h, sin(f2), wc); f = mix(f, f2, wc);
  }
  float gl = max(length(g), 1e-3);
  float w = (6.2832 / gl) * NV / (dist * uPixelAngle);
  float k = smoothstep(2.0, 6.0, w), k2 = smoothstep(2.0, 6.0, w / 9.0);
  vec3 G = T * g.x + B * g.y; G /= max(length(G), 1e-4);
  vec3 S = (T * sl.x + B * sl.y) * k + G * (0.45 * k2 * cos(9.0 * f));
  vec3 R = reflect(-V, N);
  vec3 mir = mix(etsMirror(N, V, G, S, k), etsWide(N, R), mix(uWide, 0.5, inner));
  float glass = mix(mix(1.0, uInGlass, inner), 1.0, petal);
  vec3 tint = mix(mix(uTint, uInTint, inner), uPetalTint, petal);
  float lum = mix(mix(uLum.x, uLum.y, inner), 0.56, petal);
  float cd = 0.5 - 0.5 * h, cd2 = cd * cd;                 // depth of the cut: on a pale enamel (uFlat) only the bottom of each cut deepens, as fine amber lines
  float path = (0.72 / max(mix(mix(0.25, 0.5, max(uSea, lum)), 0.72, uFlat), NV) + (0.5 + 0.9 * lum) * mix(cd, 0.3 * cd2 * cd2, uFlat) * k) * mix(uDepth.x, uDepth.y, inner);
  {                                                   // a bright silver ground that still turns with its own cut: light and dark lines, bands that sweep
    vec3 nL = N + 0.6 * S; nL /= max(length(nL), 1e-4);
    vec3 rL = reflect(-V, nL);
    float gt = smoothstep(-0.55, 0.65, 0.75 * rL.y + 0.25 * nL.y);
    mir = mix(mir, mix(vec3(0.3, 0.29, 0.36), vec3(0.8, 0.78, 0.73), mix(gt, 1.0, uGround)), lum);   // never black from below: the petals are glass, the sky comes through
  }
  vec3 body = exp(log(max(tint, vec3(0.02))) * path);
  vec3 enamel = mir * vec3(0.97, 0.97, 0.95) * body;
  enamel += PORTAL_C * exp(log(max(tint, vec3(0.02))) * min(path, 3.0)) * 0.55 * etsNear(N) * (0.55 + 0.45 * h * k) * (1.0 - uSea) * (1.0 - 0.7 * uFlat);   // (a pale enamel is thin glass: it takes less of the portal's light, or the petals by the ring would burn out)
  float fr = 1.0 - NV; float f5 = fr * fr; f5 = f5 * f5 * fr;
  float F0 = mix(uCoat.x, uCoat.y, inner);
  float F = min(F0 + (1.0 - F0) * f5, min(mix(1.0, 0.34, smoothstep(0.0, 0.4, max(lum, inner * glass))), mix(uRim, 1.0, inner)));   // petals keep their colour at grazing angles
  enamel = mix(enamel, etsEnv(gP, R), F) + F * SUN_I * 1.6 * etsSun(R, 0.0008) * (1.0 - 0.85 * uSea);
  enamel += uBand * (1.0 - inner) * uBelt * 0.3 * smoothstep(-0.04, 0.02, R.y) * (1.0 - smoothstep(0.2, 0.34, R.y)) * (0.7 + 0.3 * h * k);   // glass over silver: the pearl belt, unbent, as one crisp band in the top coat
  float soft = 1.0 - 0.85 * inner * (1.0 - glass);
  vec3 gold = etsGold(mix(etsMirror(N, V, G, S * soft, k), etsWide(N, R), 0.22), tint) * (0.86 + 0.08 * h * k * soft);
  if (bw > 0.5) {                                     // mirror gilt in basketweave: alternate squares are cut at right angles, and each smears the tent, the eggs and the portal's light across its own grooves
    float P, gap, w0; etsWeave(vec2(xm, vPat.y), max(dist * uPixelAngle / max(NV, 0.05), 1e-4), P, gap, w0);
    float kf = w0 * smoothstep(0.08, 0.3, NV);
    vec3 e0 = etsEnv(gP, R);
    vec3 gT = etsGilt(N, V, R, T, e0), gB = etsGilt(N, V, R, B, e0);
    float aT = dot(B, V), aB = dot(T, V);                // grooves that run toward the eye are bright, those across it dark: the squares flick as we move
    float dkS = mix(0.66, 0.38, lz), brS = mix(1.2, 1.0, lz);   // on the stair the squares turned from the light fall to deep gold
    gT *= mix(dkS, brS, clamp(aT * aT * 1.6, 0.0, 1.0)); gB *= mix(dkS, brS, clamp(aB * aB * 1.6, 0.0, 1.0));
    vec3 acc = mix(mix(gT, gB, P), etsWide(N, R), 0.3 - 0.2 * lz);   // with a broad warm lobe, so a face turned to the zenith is still bright gold
    float g5 = 1.0 - NV; g5 *= g5; g5 *= g5;
    vec3 gtint = mix(vec3(1.0, 0.74, 0.3), vec3(1.0), 0.04 + 0.3 * g5);     // gold whitens at grazing angles, so the sky stays blue in it
    float wg = NV + 0.2 * V.x;
    float pg = (wg - (0.3 + 0.1 * sin(uTime * 0.21 + 0.02 * gP.y))) / 0.045;
    pg = clamp(pg, -5.5, 5.5);                         // (across the band, held to the band's own reach before it is squared)
    float pb = exp(-min(pg * pg, 30.0));                // one pearl band that slides as we climb
    vec3 gm = acc * gtint * 1.2 + vec3(0.06, 0.034, 0.003);
    gm += PORTAL_C * vec3(1.0, 0.8, 0.42) * 0.45 * etsNear(N);
    gm += PORTAL_C * vec3(1.0, 0.82, 0.5) * 0.55 * uGlow * lz * exp(-min(min(abs(xm), 30.0) * min(abs(xm), 30.0) / 30.0, 30.0)) * (0.7 + 0.3 * P);   // the portal's light lying down the middle of the lowered gore
    gm += uBelt * vec3(1.0, 0.84, 0.5) * pb * (0.34 + 0.12 * kf * h);
    gm *= (1.0 + 0.16 * kf * h) * (1.0 - 0.55 * gap);
    gm *= mix(vec3(1.0), vec3(0.8, 0.66, 0.4), lz);   // the stair is the brief's gold #D9B25A, not pale cream: under a third of its block of the frame may pass 0.85
    // a chased border along both edges of the lowered gore: beads between two wires
    float ex = (0.5 * 0.5236 - abs(vLoc.x)) * vPat.z;    // metres in from the gore's edge
    float wire = (1.0 - smoothstep(0.0, 0.14, abs(ex - 2.4))) + (1.0 - smoothstep(0.0, 0.14, abs(ex - 3.6)));
    float bead = (1.0 - smoothstep(0.2, 0.34, length(vec2(ex - 3.0, (fract(vPat.y / 0.9) - 0.5) * 0.9)))) * smoothstep(1.5, 4.0, 0.9 * NV / (dist * uPixelAngle));
    gm = mix(gm, gm * 0.45 + vec3(0.02, 0.01, 0.0), clamp(wire, 0.0, 1.0) * 0.8 * smoothstep(1.0, 3.0, 0.3 * NV / (dist * uPixelAngle)));
    gm = mix(gm, acc * 0.4 + uBelt * vec3(1.0, 0.92, 0.7) * (0.5 + 0.5 * NV), bead * 0.9);
    gold = gm;
  }
  vec3 col = etsClamp(mix(gold, enamel, glass));
  float seaA = 1.0, zone = 0.0;
  if (uSea > 0.5) {                                   // engine turning under the glass: three wavy line families, sheen bands by view
    vec2 p = gP.xz;
    col = etsSeaBase(NV, p, uTime) + etsSky(R) * 0.05 * mix(F, 1.0, smoothstep(900.0, 2600.0, dist));   // (far off it is exactly what the dome draws beyond the sheet's rim: no seam under the horizon)
    {                                                 // the mirror: where the reflected ray meets the Egg (an ellipsoid round the whole flower) the glass shows the image standing under it
      vec3 ir = 1.0 / max(uRefR, vec3(1e-3));
      vec3 o = (gP - uRefC) * ir, d = R * ir;
      float qa = max(dot(d, d), 1e-8), qb = dot(o, d), qc = dot(o, o) - 1.0;
      float q = (qb * qb - qa * qc) / qa;
      zone = uRefOn * smoothstep(0.0, 0.3, q) * max(step(qb, 0.0), step(qc, 0.0));
    }
    // the lesser eggs stand mirrored in the glass too: each a crisp upside-down egg in its own enamel, its gold girdle a bright line (the cuts and the sheen cross it like everything else under the glass)
    for (int i = 0; i < 10; i++) { vec4 im = etsEggImage(gP, R, uLE[i].xyz, uLT[i]); col = mix(col, im.rgb, 0.85 * uLE[i].w * im.a); }
    // and the gangway's four piers, in the sheet's own shader like the ten eggs (nothing is laid out from the lens): as strong as the eggs' images
    // near by, thinning into the satin with range; where a pier's image falls the Egg's own image under the glass does not show through it
    for (int i = 0; i < 4; i++) { vec4 im = etsPierImage(gP, R, uPier[i], dist, uPixelAngle, uPierSunk); col = mix(col, im.rgb, 0.85 * im.a * (1.0 - 0.75 * smoothstep(700.0, 2600.0, dist))); zone *= 1.0 - im.a; }
    vec2 h1 = etsSeaCut(p, V, NV, dist, uTime, uPixelAngle);            // engine turning under the glass (the wave cut, in the sky chunk)
    float cut = h1.x, sat = h1.y;
    col = etsSeaSatin(col, V, NV, 1.5 * uPixelAngle, cut, sat);
    // the image is cut into by the engraved lines; the sheen lies on top of it
    seaA = 1.0 - zone * 0.78 * (1.0 - 0.55 * cut);
    col = etsClamp(col) * seaA;
  }
  gl_FragColor = vec4(col * etsImage() * rt, seaA * (1.0 - uRampImg));
  #include <fog_fragment>
}`;

// the portal's disc of light, drawn only as its image in the ramp
const FRAG_DISC = /* glsl */`
void main(){
  vec3 rt = etsRampImage(vWPos, uPixelAngle);
  gl_FragColor = vec4(PORTAL_C * 1.7 * uGlow * rt, 0.0);
  #include <fog_fragment>
}`;

// gold mounts and pearls. uMode: 1 laurel band, 2 real leaf, 3 polished / chased gold, 4 pearl
const FRAG_GOLD = /* glsl */`
uniform vec3 uTint;
uniform float uMode;
void main(){
  vec3 rt = etsRampImage(vWPos, uPixelAngle);
  gP = mirP(vWPos);
  vec3 N = mirD(vN) / max(length(vN), 1e-4);
  if (!gl_FrontFacing) N = -N;
  vec3 T = mirD(vT) / max(length(vT), 1e-4), B = mirD(vB) / max(length(vB), 1e-4);
  vec3 Vv = mirP(cameraPosition) - gP; float dist = max(length(Vv), 0.05); vec3 V = Vv / dist;
  float NV = max(dot(N, V), 0.0);
  vec3 col;
  if (uMode > 3.5 && uMode < 4.5) {                   // pearl: a soft mirror with an orient
    vec3 R = reflect(-V, N);
    vec3 nu = N + vec3(0.0, 0.5, 0.0); nu /= max(length(nu), 1e-4);
    float fr = 1.0 - NV;
    col = uTint * (0.62 * etsWide(nu, nu) + 0.30 * etsEnv(gP, R));
    col += vec3(0.10, 0.02, 0.07) * fr * fr + vec3(-0.01, 0.03, 0.02) * NV * NV;
    col += SUN_I * 0.06 * etsSun(R, 0.004) + 0.5 * fr * fr * fr * etsEnv(gP, R);
  } else {
    vec3 D = T * vUv4.z + B * vUv4.w; D /= max(length(D), 1e-4);     // the mount's own long direction
    vec3 Wd = cross(N, D); Wd /= max(length(Wd), 1e-4);
    float l = vUv4.x, wv = vUv4.y, sg = wv < 0.0 ? -1.0 : 1.0;
    vec3 G; vec3 S; float per; float bead = 1.0;
    if (uMode < 1.5) {                                // laurel: paired leaves in chevron, a midrib, beaded edges
      float f = 5.712 * l - 3.3 * abs(wv);
      float edge = smoothstep(0.78, 0.9, abs(wv)), rib = 1.0 - smoothstep(0.03, 0.12, abs(wv));
      vec3 gd = D - 0.75 * sg * Wd; gd /= max(length(gd), 1e-4);
      float fb = 15.7 * l;
      G = mix(gd, D, edge); S = mix(cos(f) * gd * (1.0 - rib), 1.3 * cos(fb) * D, edge); per = mix(1.1, 0.4, edge);
      S *= 0.78 + 0.22 * sin(l * 0.31 - uTime * 2.5);      // the lift of the leaves runs along the band at 8 m/s
    } else if (uMode < 2.5) {                         // leaf: veins from the midrib
      float f = 22.0 * l - 5.0 * abs(wv);
      vec3 gd = D - 0.6 * sg * Wd; gd /= max(length(gd), 1e-4);
      G = gd; S = 0.8 * cos(f) * gd; per = 0.12;
    } else if (uMode < 3.5) {                         // chased veins along the piece
      float f = 31.4 * l + 2.0 * sin(6.0 * wv);
      G = D; S = 0.45 * cos(f) * D; per = 0.2;
    } else {                                          // mode 5, beaded wire: a row of gold beads along the rib
      float f = 7.854 * l;
      G = D; S = 1.5 * cos(f) * D; per = 0.8; bead = 0.5 + 0.5 * sin(f);
    }
    float w = per * NV / (dist * uPixelAngle);
    float k = smoothstep(2.0, 6.0, w);
    vec3 mir = mix(etsMirror(N, V, G, S * k, k), etsWide(N, reflect(-V, N)), 0.22);
    col = etsGold(mir, uTint) * 0.92;
    col *= mix(1.0, 0.5 + 0.6 * bead, k);              // the hollows between beads fall dark
    col += PORTAL_C * uTint * 0.8 * etsNear(N);
    float fr = 1.0 - NV;
    col += 0.25 * fr * fr * fr * etsSky(reflect(-V, N));
  }
  gl_FragColor = vec4(etsClamp(col) * etsImage() * rt, 1.0 - uRampImg);
  #include <fog_fragment>
}`;

// rose-cut diamonds: flat facets mirroring the tent, with a rate-limited flash
const FRAG_GEM = /* glsl */`
uniform float uCamSpeed;
void main(){
  vec3 rt = etsRampImage(vWPos, uPixelAngle);
  gP = mirP(vWPos);
  vec3 N = mirD(vN) / max(length(vN), 1e-4);
  vec3 T = mirD(vT) / max(length(vT), 1e-4), B = mirD(vB) / max(length(vB), 1e-4);
  vec3 Vv = mirP(cameraPosition) - gP; float dist = max(length(Vv), 0.05); vec3 V = Vv / dist;
  float NV = max(dot(N, V), 0.0);
  vec3 R = reflect(-V, N);
  float hs = vUv4.x, hf = vUv4.y;
  vec3 col = etsEnv(gP, R) * vec3(0.92, 0.95, 1.0) * (0.55 + 0.45 * hf);
  // inner light: what the pavilion throws back, cool and dim
  col += vec3(0.36, 0.40, 0.48) * (0.3 + 0.7 * fract(hf * 7.31)) * (0.4 + 0.6 * NV);
  float n = clamp(2.5 * dist / (uCamSpeed + 0.15 * dist + 1e-3), 1.0, 24.0);
  float ang = dot(V, T) * 0.9 + dot(V, B) * 0.6 + dot(V, N) * 0.3;
  float ph = 6.2832 * (n * ang * 0.5 + hf * 3.0 + hs) + uTime * (0.35 + 0.5 * hs);
  float lb = 0.5 + 0.5 * cos(ph);
  lb *= lb; lb *= lb; lb *= lb; lb *= lb;
  vec3 fire = mix(vec3(1.0, 0.97, 0.92), 0.5 + 0.5 * cos(6.2832 * (hf * 5.0 + vec3(0.0, 0.33, 0.67))), 0.35);
  col += fire * lb * (4.0 + 4.0 * fract(hs * 9.7 + hf * 3.1)) * step(0.35, fract(hf * 13.7 + hs * 5.0));
  col += SUN_I * 0.5 * etsSun(R, 0.002);
  gl_FragColor = vec4(col * etsImage() * rt, 1.0 - uRampImg);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------
// Meridians: an egg is two half ellipses meeting at the girdle (the hinge). Tables are uniform in
// arc length s: s > 0 up the gores to the pole, s < 0 down the fixed cup.
function makeEgg(def) {
  const NS = 256, e = { ...def };
  const half = (b, sign) => {
    const fine = 2048, pts = [[def.R, def.Y, 0, 0]]; let s = 0, pr = def.R, py = def.Y;
    for (let i = 1; i <= fine; i++) {
      const t = (i / fine) * Math.PI / 2, r = def.R * Math.cos(t), y = def.Y + sign * b * Math.sin(t);
      s += Math.hypot(r - pr, y - py); pr = r; py = y;
      pts.push([r, y, sign * Math.atan2(def.R * Math.sin(t), b * Math.cos(t)), s]);
    }
    const L = s, tab = new Float32Array((NS + 1) * 3); let j = 0;
    for (let i = 0; i <= NS; i++) {
      const si = (i / NS) * L; while (j < fine - 1 && pts[j + 1][3] < si) j++;
      const a = pts[j], b2 = pts[j + 1], f = clamp((si - a[3]) / Math.max(b2[3] - a[3], 1e-9), 0, 1);
      tab[i * 3] = a[0] + (b2[0] - a[0]) * f; tab[i * 3 + 1] = a[1] + (b2[1] - a[1]) * f; tab[i * 3 + 2] = a[2] + (b2[2] - a[2]) * f;
    }
    return { L, tab };
  };
  e.upT = half(def.up, 1); e.dnT = half(def.dn, -1); e.L = e.upT.L;
  e.mer = (s) => {                                   // -> [r, y, psi]
    const h = s >= 0 ? e.upT : e.dnT, x = clamp(Math.abs(s) / h.L, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(x)), f = x - i, t = h.tab;
    return [t[i * 3] + (t[i * 3 + 3] - t[i * 3]) * f, t[i * 3 + 1] + (t[i * 3 + 4] - t[i * 3 + 1]) * f, t[i * 3 + 2] + (t[i * 3 + 5] - t[i * 3 + 2]) * f];
  };
  // s (negative) at which the cup meets height y
  e.sAtY = (y) => { let lo = 0, hi = e.dnT.L; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (e.mer(-m)[1] > y) lo = m; else hi = m; } return -lo; };
  e.sector = TAU / def.n;
  return e;
}

// Vertex soup in pose space: position = offset in the surface frame, plus the anchor attributes.
class Soup {
  constructor() { this.p = []; this.n = []; this.g = []; this.m = []; this.u = []; this.idx = []; this.count = 0; this.wave = 0; }
  v(egg, gi, da, s, ox, oy, oz, nx, ny, nz, u0 = 0, u1 = 0, u2 = 0, u3 = 1) {
    const mm = egg.mer(s);
    this.p.push(ox, oy, oz); this.n.push(nx, ny, nz); this.g.push(gi, da, s, this.wave); this.m.push(mm[0], mm[1], mm[2]); this.u.push(u0, u1, u2, u3);
    return this.count++;
  }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.idx.push(a, b, c); }
  geometry(radius, cy) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aG', new THREE.Float32BufferAttribute(this.g, 4));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(this.m, 3));
    g.setAttribute('aUv', new THREE.Float32BufferAttribute(this.u, 4));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, cy, 0), radius);
    return g;
  }
  async geometryAsync(ctx, radius, cy) {              // the same, a frame handed back between the big typed arrays
    const g = new THREE.BufferGeometry();
    for (const [name, arr, n] of [['position', this.p, 3], ['normal', this.n, 3], ['aG', this.g, 4], ['aM', this.m, 3], ['aUv', this.u, 4]]) { g.setAttribute(name, new THREE.Float32BufferAttribute(arr, n)); await ctx.yield(); }
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, cy, 0), radius);
    await ctx.yield();
    return g;
  }
  get tris() { return this.idx.length / 3; }
}

// shell: the cup (s < 0, as n closed sectors) and the gores (s > 0)
async function shellSoup(ctx, egg, colsCup, rowsCup, colsGore, rowsGore, sBot, gap, count = egg.n) {       // count: build only the first so many gores
  const S = new Soup(), n = egg.n, hw = egg.sector / 2;
  for (let gi = 0; gi < count; gi++) {
    const grid = (cols, rows, s0, s1, w) => {
      const base = S.count;
      for (let j = 0; j <= rows; j++) {
        const f = j / rows, s = s0 + (s1 - s0) * (s0 < 0 ? f : 1 - (1 - f) * (1 - f) * 0.35 - (1 - f) * 0.65);
        for (let i = 0; i <= cols; i++) S.v(egg, gi, (i / cols * 2 - 1) * w, s, 0, 0, 0, 0, 0, 1);
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = base + j * (cols + 1) + i; S.quad(a, a + 1, a + cols + 2, a + cols + 1); }
    };
    grid(colsCup, rowsCup, sBot, 0, hw);
    await ctx.yield();
    grid(colsGore, rowsGore, 0, egg.L, hw - gap / egg.R);
    await ctx.yield();
  }
  return S;
}

// A half-round gold ribbon along a path on the egg: pts = [{a (absolute longitude), s}], split at
// gore edges so every piece travels with its own gore. width w, height h, uv l runs along.
function ribbon(S, egg, pts, w, h, l0 = 0, lock = -1, tube = false) {
  const n = egg.n, sec = egg.sector, prof = tube ? [[-1, 0], [-0.5, 0.87], [0.5, 0.87], [1, 0], [0.5, -0.87], [-0.5, -0.87], [-1, 0]] : [[-1, 0], [-0.62, 0.74], [0, 1], [0.62, 0.74], [1, 0]], NQ = prof.length - 1;
  let prev = null, l = l0;
  const giOf = (a) => ((Math.round((a - egg.az0) / sec) % n) + n) % n;
  const row = (gi, a, s, dx, dy) => {
    let da = a - egg.az0 - gi * sec; da -= Math.round(da / TAU) * TAU;
    const base = S.count, wx = dy, wy = -dx;                      // across = D turned in the surface
    for (const [pw, ph] of prof) {
      const pz = tube ? ph : ph + 0.25, nl = Math.hypot(pw * 0.8, pz) || 1;
      S.v(egg, gi, da, s, wx * pw * w, wy * pw * w, (tube ? 0 : 0.03) + ph * h, wx * pw * 0.8 / nl, wy * pw * 0.8 / nl, pz / nl, l, tube ? pw * 0.7 : pw, dx, dy);
    }
    return base;
  };
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    const r = Math.max(egg.mer(p.s)[0], 0.3);
    let dx = r * (q.a - o.a), dy = q.s - o.s; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const gi = lock >= 0 ? lock : giOf(p.a);
    if (prev && prev.gi !== gi) {                                   // crossed a gore edge: end one strip, start the next
      const edge = egg.az0 + (prev.gi + (((gi - prev.gi + n) % n) === 1 ? 0.5 : -0.5)) * sec;
      let aa = prev.a - edge; aa -= Math.round(aa / TAU) * TAU; let bb = p.a - edge; bb -= Math.round(bb / TAU) * TAU;
      const f = clamp(aa / ((aa - bb) || 1e-6), 0, 1), se = prev.s + (p.s - prev.s) * f, ae = prev.a + (p.a - prev.a) * f;
      l += Math.hypot(r * (ae - prev.a), se - prev.s);
      const e1 = row(prev.gi, ae, se, dx, dy); for (let k = 0; k < NQ; k++) S.quad(prev.base + k, prev.base + k + 1, e1 + k + 1, e1 + k);
      prev = { gi, a: ae, s: se, base: row(gi, ae, se, dx, dy) };
    }
    if (prev) l += Math.hypot(r * (p.a - prev.a), p.s - prev.s);
    const base = row(gi, p.a, p.s, dx, dy);
    if (prev) for (let k = 0; k < NQ; k++) S.quad(prev.base + k, prev.base + k + 1, base + k + 1, base + k);
    prev = { gi, a: p.a, s: p.s, base };
  }
  return l;
}

// ---------------------------------------------------------------------------------------------
// Small parts, as templates in the surface frame (x across, y along, z out)
function tmplFrom(geo) {                              // from a THREE geometry (non-indexed or indexed)
  const g = geo.index ? geo.toNonIndexed() : geo; const out = { pos: Array.from(g.attributes.position.array), nrm: Array.from(g.attributes.normal.array), fh: null };
  geo.dispose(); if (g !== geo) g.dispose(); return out;
}
function tmplRoseCut() {                              // a rose-cut stone: flat back, 24 triangular facets rising to a point
  const tr = [], apex = [0, 0, 0.62], r1 = [], r2 = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; r1.push([0.52 * Math.cos(a), 0.52 * Math.sin(a), 0.42]); }
  for (let i = 0; i < 12; i++) { const a = (i - 0.5) / 12 * TAU; r2.push([Math.cos(a), Math.sin(a), 0.06]); }
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    tr.push([apex, r1[i], r1[j]]);
    tr.push([r1[i], r2[(2 * i + 1) % 12], r1[j]]);
    tr.push([r1[i], r2[2 * i], r2[(2 * i + 1) % 12]]);
    tr.push([r1[j], r2[(2 * i + 1) % 12], r2[(2 * i + 2) % 12]]);
  }
  const pos = [], nrm = [], fh = [];
  tr.forEach((t, k) => {
    const [a, b, c] = t, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const flip = nz < 0; const order = flip ? [a, c, b] : [a, b, c];
    for (const q of order) { pos.push(q[0], q[1], q[2]); nrm.push(flip ? -nx : nx, flip ? -ny : ny, flip ? -nz : nz); fh.push(((k * 0.61803) % 1)); }
  });
  return { pos, nrm, fh };
}
function tmplLeaf() {                                 // a cupped laurel leaf with a raised midrib, base at the origin, along +y
  const pos = [], rows = 5, P = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows, w = 0.5 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.06 + t * 0.94)), 0.75) * (1 - 0.25 * t);
    const z = 0.10 + 0.34 * t - 0.16 * t * t;
    P.push([[-w, t, z + 0.13 * w * 2], [0, t, z + 0.05], [w, t, z + 0.13 * w * 2]]);
  }
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let j = 0; j < rows; j++) for (let i = 0; i < 2; i++) { const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i]; tri(a, b, c); tri(a, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return tmplFrom(g);
}
function tmplBezel() {                                // the gold collet round a stone: a low scalloped ring
  const pts = [new THREE.Vector2(1.0, 0.0), new THREE.Vector2(1.22, 0.02), new THREE.Vector2(1.2, 0.16), new THREE.Vector2(1.06, 0.24), new THREE.Vector2(0.98, 0.12)];
  const g = new THREE.LatheGeometry(pts, 8); g.rotateX(Math.PI / 2);          // lathe axis y -> z (out)
  return tmplFrom(g);
}
// add a template at an anchor: rot turns it in the surface, sc scales, uv gives (l, w, dir) for the gold relief
function addPart(S, egg, gi, da, s, T, sc, rot, zoff, uvx, uvy, lenUv) {
  const c = Math.cos(rot), sn = Math.sin(rot), mm = egg.mer(s), n = T.pos.length / 3, base = S.count;
  for (let i = 0; i < n; i++) {
    const x = T.pos[i * 3] * sc[0], y = T.pos[i * 3 + 1] * sc[1], z = T.pos[i * 3 + 2], nx = T.nrm[i * 3], ny = T.nrm[i * 3 + 1], nz = T.nrm[i * 3 + 2];
    S.p.push(x * c - y * sn, x * sn + y * c, z * sc[2] + zoff); S.n.push(nx * c - ny * sn, nx * sn + ny * c, sc[2] < 0 ? -nz : nz);
    S.g.push(gi, da, s, S.wave); S.m.push(mm[0], mm[1], mm[2]);
    if (T.fh) S.u.push(uvx, T.fh[i], 0, 1); else if (lenUv) S.u.push(y, x * 2, -sn, c); else S.u.push(uvx + y * 0.3, uvy + x, -sn, c);
    S.idx.push(sc[2] < 0 && i % 3 ? base + i + (i % 3 === 1 ? 1 : -1) : base + i);
  }
  S.count += n;
}

// a round rail standing off a gore's face: z0 metres out (negative = the inner face), along s at the longitude daOf(s)
function rail(S, egg, gi, daOf, s0, s1, step, z0, rad) {
  let prev = -1;
  for (let s = s0; s <= s1 + 1e-6; s += step) {
    const base = S.count, da = daOf(s);
    for (let k = 0; k <= 6; k++) { const a = k / 6 * TAU, cx = Math.cos(a), cz = Math.sin(a); S.v(egg, gi, da, s, cx * rad, 0, z0 + cz * rad, cx, 0, cz, s, cx, 0, 1); }
    if (prev >= 0) for (let k = 0; k < 6; k++) S.quad(prev + k + 1, prev + k, base + k, base + k + 1);
    prev = base;
  }
}

// centre line of a gore in the open pose (JS mirror of etsPose at da = 0, no per-gore jitter): -> [radial, y]
function poseCentre(egg, pp, e, s) {
  const [rC, yC, psi] = egg.mer(s); if (s <= 0) return [rC, yC];
  const phi = pp[0] * e, u = rC - egg.R, v = yC - egg.Y;
  const ur = u * Math.cos(phi) + v * Math.sin(phi), vr = -u * Math.sin(phi) + v * Math.cos(phi);
  const sa = Math.min(s, pp[1]), sb = Math.max(s - pp[1], 0), kq = Math.max(pp[2], 2e-4), th = pp[0], th2 = th + kq * sb;
  const cu = sa * Math.sin(th) + (Math.cos(th) - Math.cos(th2)) / kq, cv = sa * Math.cos(th) + (Math.sin(th2) - Math.sin(th)) / kq;
  const m = smoothstep(0.12, 1, e);
  return [egg.R + ur + (cu - ur) * m, egg.Y + vr + (cv - vr) * m, psi];
}

function finishStatic(geo, lScale = 1) {              // aTan (round the axis) and aUv for ordinary gold geometry
  const p = geo.attributes.position, n = p.count, tan = new Float32Array(n * 3), uv = new Float32Array(n * 4), u0 = geo.attributes.uv;
  for (let i = 0; i < n; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
    if (r > 1e-4) { tan[i * 3] = z / r; tan[i * 3 + 2] = -x / r; } else tan[i * 3] = 1;
    uv[i * 4] = Math.atan2(x, z + 1e-9) * Math.max(r, 0.5) * lScale; uv[i * 4 + 1] = u0 ? u0.getY(i) * 2 - 1 : 0; uv[i * 4 + 2] = 1; uv[i * 4 + 3] = 0;
  }
  geo.setAttribute('aTan', new THREE.BufferAttribute(tan, 3)); geo.setAttribute('aUv', new THREE.BufferAttribute(uv, 4));
  geo.deleteAttribute('uv');
  return geo;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const lin = (c, k = 1) => new THREE.Vector3(c.r * k, c.g * k, c.b * k);
  const [cSea, cRose, cPrim, cMauve, , cGold, cDia] = pal;
  // per-seed character (drawn first, in a fixed order)
  const hand = rng() < 0.5 ? -1 : 1, twist = 2.2 + rng() * 0.9, seedF = rng() * 10, gJit = 0.94 + rng() * 0.12, curlJ = 0.85 + rng() * 0.3, gemTurn = rng() * TAU;

  // ---- the three eggs ----------------------------------------------------------------------
  await ctx.yield();
  const rose = makeEgg({ n: 12, R: 60, Y: 62, up: 108, dn: 70, az0: 0 });
  await ctx.yield();
  const prim = makeEgg({ n: 12, R: 36, Y: 68, up: 80, dn: 23, az0: 0 });
  await ctx.yield();
  const mauv = makeEgg({ n: 8, R: 20, Y: 77, up: 5, dn: 7.5, az0: 0 });      // the portal's saucer: eight short mauve petals that always lie open (never a closed shell)
  // the clockwork bird's wings: two gores of a tiny mauve egg, hinged at its shoulders and swept back 40 degrees so their moire faces show from the gangway (one gore each of two half-eggs)
  const BK = 1.5, wingR = makeEgg({ n: 2, R: 5.4, Y: 119.6, up: 31, dn: 1.6, az0: 130 * Math.PI / 180 });   // the bird is small, as ordered: the live version's size, no larger
  await ctx.yield();
  const wingL = makeEgg({ n: 2, R: 5.4, Y: 119.6, up: 31, dn: 1.6, az0: 230 * Math.PI / 180 });
  await ctx.yield();
  const POSE = {
    rose: { G: [0.74 * gJit, 0.36 * rose.L, curlJ / 50, 1], F: [1.841, rose.L, 0, 0.22], N: [1.0, 0.42 * rose.L, curlJ / 62, 1] },
    // primrose: an orchid. The back five petals stand as a fan behind the portal, the side ones spread, the pair beside the front one line the rose petals,
    // and the front one rolls down into the rose cup as a great loop, so the way in is open and the ramp's mirror is clear. Mauve: a saucer of eight short
    // petals lying open under the portal, its front petal rolled down into the cup the same way; and the bird's two wings, posed by update().
    prim: { G: [0.64 * gJit, 0.5 * prim.L, curlJ / 70, 1], F: [1.7, 2, 1 / 18, 0.6], N: [0.95, 0.45 * prim.L, curlJ / 70, 1], B: [0.14, 0.75 * prim.L, 1 / 90, 1] },
    mauv: { G: [1.0, mauv.L, 1 / 400, 1], F: [1.75, 1.5, 1 / 9.6, 0.6], N: [1.3, mauv.L, 1 / 400, 1] },
    wing: { G: [0.95, 0.7 * wingR.L, 1 / 46, 0.7], F: [0.95, 0.7 * wingR.L, 1 / 46, 0.7], N: [0.95, 0.7 * wingR.L, 1 / 46, 0.7] },
  };
  const shared = {
    uSunDir: { value: new THREE.Vector3(0, 0.6157, 0.788) }, uZenith: { value: lin(new THREE.Color('#7F97D8'), 0.45) },
    uBelt: { value: lin(new THREE.Color('#FFF3E0'), 1.3) }, uUnder: { value: lin(new THREE.Color('#1B2550'), 0.5) },
    uSeaAvg: { value: lin(new THREE.Color('#6E84CC'), 0.8) }, uSeaTint: { value: lin(cSea) }, uPixelAngle: { value: 0.0015 }, uTime: { value: 0 }, uTravel: { value: 0 }, uCamSpeed: { value: 10 },
    uPortal: { value: new THREE.Vector4(0, 94, 0, 17) }, uGlow: { value: 0 },
    uLE: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 1, 0)) }, uLT: { value: Array.from({ length: 10 }, () => new THREE.Vector3(1, 1, 1)) },
    uPier: { value: Array.from({ length: 4 }, () => new THREE.Vector3(0, 0, 0)) }, uPierSunk: { value: 62 },
    uRampOn: { value: 0 }, uRampL: { value: 1 }, uRampH: { value: new THREE.Vector3() }, uRampA: { value: new THREE.Vector3(0, 0, 1) }, uRampX: { value: new THREE.Vector3(1, 0, 0) }, uOut: { value: new Array(17).fill(0) },
  };
  const eggU = (egg, P) => ({
    uEgg: { value: new THREE.Vector4(egg.R, egg.Y, egg.n, egg.az0) }, uPoseG: { value: new THREE.Vector4(...P.G) }, uPoseF: { value: new THREE.Vector4(...P.F) },
    uPoseN: { value: new THREE.Vector4(...P.N) }, uE: { value: new THREE.Vector3(0, 0, 0) }, uSeed: { value: seedF },
    uFan: { value: P.B ? new THREE.Vector4(...P.B) : new THREE.Vector4(0, 0, 0, 0) }, uHalf: { value: egg.az0 ? 1 : 0 },
  });
  const U = { rose: eggU(rose, POSE.rose), prim: eggU(prim, POSE.prim), mauv: eggU(mauv, POSE.mauv), wingR: eggU(wingR, POSE.wing), wingL: eggU(wingL, POSE.wing) };
  U.mauv.uE.value.set(1, 1, 1); U.wingR.uE.value.set(1, 1, 1); U.wingL.uE.value.set(1, 1, 1);          // the saucer and the wings are never closed
  const seaMir = new THREE.Vector4(0, 1, 0, 0), rampMir = new THREE.Vector4(0, 1, 0, 0);   // mirror planes in world space, kept by update()
  const refs = [];                                    // mirrored ellipsoids, kept in world space by update()
  const refU = (c, r, tint) => { const u = { uRefC: { value: new THREE.Vector3() }, uRefR: { value: new THREE.Vector3() }, uRefTint: { value: tint || new THREE.Vector3(1, 1, 1) }, uRefOn: { value: c ? 1 : 0 } }; if (c) refs.push({ u, c, r }); return u; };
  const mats = [];
  const mkMat = (frag, eu, own, ref, side = THREE.FrontSide) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...(eu || {}), ...refU(...(ref || [null])), uLift: { value: 0 }, uFlat: { value: 0 }, uDepth: { value: new THREE.Vector2(1, 1) }, uLum: { value: new THREE.Vector2(0, 0) }, uCoat: { value: new THREE.Vector2(0.04, 0.04) }, uGround: { value: 0.35 }, uInPetal: { value: 0 }, uPetalTint: { value: new THREE.Vector3(1, 1, 1) }, uWide: { value: 0.5 }, uRim: { value: 1 }, uBand: { value: 0 }, uFlip: { value: 1 }, uDim: { value: 1 }, uMir: { value: seaMir }, uRampImg: { value: 0 }, ...own },
      vertexShader: eu ? VERT_POSED.replace('POSE_CHUNK', POSE_GLSL) : VERT_STATIC,
      fragmentShader: FRAG_LIB.replace('SKY_CHUNK', SKY_GLSL) + frag, fog: true, side,
    });
    mats.push(m); return m;
  };
  const deep = (c, k) => lin(c.clone().multiplyScalar(k));
  // a pale enamel needs deeper glass to read as a colour; a dark one (emerald, cobalt) needs less, or it goes black
  const lumP = 0.3 * cPrim.r + 0.5 * cPrim.g + 0.2 * cPrim.b, dP = clamp(lumP / 0.72, 0.45, 1), paleP = smoothstep(0.4, 0.7, lumP);
  const goldRef = new THREE.Vector3(1.0, 0.74, 0.28);
  const root = new THREE.Group(); root.name = 'great-egg';
  const add = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; root.add(m); return m; };
  let tris = 0;
  // the Egg's mirror image: the same geometry and shader program, standing upside down under the sea's glass (only when the hero brings its sea)
  const hasSea = opts.apron !== false, imgU = { uFlip: { value: -1 }, uDim: { value: 0.9 } };
  // ... and its image in the lowered gore's gilt face (opts.rampMirror: the world must draw something with alpha 1 behind the Egg, as its dome does)
  const hasRamp = opts.rampMirror === true, rampU = () => ({ uFlip: { value: -1 }, uDim: { value: 0.92 }, uMir: { value: rampMir }, uRampImg: { value: 1 } });
  const rampTh = 1.841, rampN = new THREE.Vector3(0, Math.sin(rampTh), -Math.cos(rampTh)), rampHinge = new THREE.Vector3(0, 62, 60), rampD = -rampN.dot(rampHinge);
  const rampM4 = new THREE.Matrix4().set(
    1 - 2 * rampN.x * rampN.x, -2 * rampN.x * rampN.y, -2 * rampN.x * rampN.z, -2 * rampD * rampN.x,
    -2 * rampN.y * rampN.x, 1 - 2 * rampN.y * rampN.y, -2 * rampN.y * rampN.z, -2 * rampD * rampN.y,
    -2 * rampN.z * rampN.x, -2 * rampN.z * rampN.y, 1 - 2 * rampN.z * rampN.z, -2 * rampD * rampN.z,
    0, 0, 0, 1);
  const rampImage = (geo, mat, name) => { if (!hasRamp) return null; const m = add(geo, mat, name); m.matrixAutoUpdate = false; m.matrix.copy(rampM4); m.renderOrder = -7.5; tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; return m; };
  const image = (geo, mat, name) => { if (!hasSea) return null; const m = add(geo, mat, name); m.scale.y = -1; m.renderOrder = -9; tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; return m; };
  await ctx.yield();

  // ---- the Great Egg: rose enamel over a sunburst, gilt basketweave inside ------------------
  const sBot = rose.sAtY(-1.5), sTop = rose.L * 0.93;
  {
    const S = await shellSoup(ctx, rose, 6, 20, 16, 48, sBot, 0.14);
    tris += S.tris;
    await ctx.yield();
    const own = () => ({ uWide: { value: 0.42 }, uRim: { value: 0.5 }, uBand: { value: 1 }, uInPetal: { value: 1 }, uPetalTint: { value: lin(cRose).lerp(new THREE.Vector3(1, 0.93, 0.9), 0.2) }, uTint: { value: lin(cRose) }, uInTint: { value: goldRef }, uKind: { value: 0 }, uInKind: { value: 3 }, uInGlass: { value: 0 }, uSea: { value: 0 }, uCollarR: { value: 0 } });
    const ref = [new THREE.Vector3(0, 97, 0), new THREE.Vector3(36, 52, 36), deep(cPrim, 0.9)], geo = await S.geometryAsync(ctx, 210, 80);
    const shell = add(geo, mkMat(FRAG_ENAMEL, U.rose, own(), ref, THREE.DoubleSide), 'rose-shell');
    if (hasRamp) {                                    // where an image was drawn first (it writes alpha 0) the shell gives way to it; everywhere else the shell is itself
      shell.renderOrder = -7; const m = shell.material;
      m.blending = THREE.CustomBlending; m.blendSrc = THREE.DstAlphaFactor; m.blendDst = THREE.OneMinusDstAlphaFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor;
    }
    if (hasSea) image(geo, mkMat(FRAG_ENAMEL, U.rose, { ...own(), ...imgU }, ref, THREE.DoubleSide), 'rose-shell-image');
  }
  await ctx.yield();
  const tGem = tmplRoseCut(), tLeaf = tmplLeaf(), tBezel = tmplBezel();
  const roseGold = mkMat(FRAG_GOLD, U.rose, { uTint: { value: goldRef }, uMode: { value: 1 } });
  const roseLeafMat = mkMat(FRAG_GOLD, U.rose, { uTint: { value: goldRef }, uMode: { value: 2 } }, null, THREE.DoubleSide); roseLeafMat.uniforms.uLift.value = 1;
  const roseBezelMat = mkMat(FRAG_GOLD, U.rose, { uTint: { value: goldRef }, uMode: { value: 3 } });
  const roseGemMat = mkMat(FRAG_GEM, U.rose, {});
  const gemSpots = [];                               // [gi, da, s] of every diamond on the rose egg
  {
    const S = new Soup(), sec = rose.sector, q2s = (q) => sBot + q * (sTop - sBot);
    for (let fam = 0; fam < 2; fam++) {
      const dir = fam === 0 ? hand : -hand;
      for (let i = 0; i < 12; i++) {
        const a0 = i * sec + sec * 0.25, lower = [], upper = [];
        for (let s = sBot; s < 0; s += 2.1) lower.push({ a: a0 + dir * twist * (s - sBot) / (sTop - sBot), s });
        lower.push({ a: a0 + dir * twist * (0 - sBot) / (sTop - sBot), s: -0.02 });
        for (let s = 0.02; s < sTop; s += 1.75) upper.push({ a: a0 + dir * twist * (s - sBot) / (sTop - sBot), s });
        upper.push({ a: a0 + dir * twist, s: sTop });
        S.wave = i * 7.3 + fam * 3.1;
        await ctx.yield();
        const l = ribbon(S, rose, lower, 1.0, 0.4, i * 3.7);
        await ctx.yield();
        ribbon(S, rose, upper, 1.0, 0.4, l);
        await ctx.yield();
      }
      await ctx.yield();
    }
    // crossings: rings where the two families meet
    const K = Math.floor(12 * twist / Math.PI);
    for (let m = 1; m <= K; m++) {
      const s = q2s(m * Math.PI / (12 * twist)); if (Math.abs(s) < 2.2 || rose.mer(s)[0] < 5) continue;
      for (let i = 0; i < 12; i++) {
        const a = i * sec + sec * 0.25 + hand * m * sec * 0.5;
        const gi = ((Math.round(a / sec) % 12) + 12) % 12; let da = a - gi * sec; da -= Math.round(da / TAU) * TAU;
        gemSpots.push([gi, da, s, 0.8]);
      }
    }
    // laurel along both edges of every gore, and a diamond at every tip
    for (let gi = 0; gi < 12; gi++) {
      for (const sd of [-1, 1]) {
        const pts = [];
        for (let s = 0.4; s < rose.L - 1.2; s += 2.3) pts.push({ a: gi * sec + sd * Math.max(0, sec / 2 - 0.16 / Math.max(rose.mer(s)[0], 0.16)), s });
        S.wave = gi * 5.1 + sd; ribbon(S, rose, pts, 0.55, 0.5, gi * 1.3, gi, true);
        await ctx.yield();
      }
      gemSpots.push([gi, 0, rose.L - 2.4, 0.9]);
      for (let k = 1; k <= 5; k++) gemSpots.push([gi, 0, k / 6 * (rose.L - 9) * 0.55 + rose.L * 0.42, 0.42 + 0.03 * k]);
      await ctx.yield();
    }
    for (const sd of [-1, 1]) for (let s = 9; s < rose.L - 6; s += 11.5) gemSpots.push([0, sd * Math.max(0, rose.sector / 2 - 2.6 / rose.mer(s)[0]), s, -0.5]);
    gemSpots.push([0, 0, rose.L - 3.2, -0.8]);
    await ctx.yield();
    tris += S.tris; const geo = await S.geometryAsync(ctx, 210, 80); add(geo, roseGold, 'rose-trellis');
    if (hasSea) image(geo, mkMat(FRAG_GOLD, U.rose, { uTint: { value: goldRef }, uMode: { value: 1 }, ...imgU }), 'rose-trellis-image');
  }
  await ctx.yield();
  {
    const SG = new Soup(), SB = new Soup();
    for (let k = 0; k < gemSpots.length; k++) {
      const [gi, da, s, r] = gemSpots[k];
      const hs = ((k * 0.7548776662) % 1);
      const q = Math.abs(r), sg = Math.sign(r);
      addPart(SG, rose, gi, da, s, tGem, [q, q, r * 1.15], gemTurn + k * 0.9, 0.3 * sg, hs, 0, false);
      addPart(SB, rose, gi, da, s, tBezel, [q, q, r * 1.6], k * 0.5, 0.12 * sg, k * 2.1, 0, false);
      if (k % 6 === 5) await ctx.yield();
    }
    await ctx.yield();
    {
      // the gangway's balustrade: turned gold posts and two rails along both edges of the front gore's gilt face (inside the closed Egg; once the gore is down it is a railed bridge, in profile too)
      const tPost = tmplFrom(new THREE.LatheGeometry([[0.62, 0], [0.26, 0.12], [0.24, 0.45], [0.46, 0.58], [0.24, 0.72], [0.26, 0.93], [0.58, 1.0], [0.0, 1.1]].map(([x, y]) => new THREE.Vector2(x, y)), 6).rotateX(Math.PI / 2));
      const RH = 5.2, s0 = 3, s1 = rose.L - 16, np = 20;
      for (const sd of [-1, 1]) {
        const daOf = (s) => sd * Math.max(0, rose.sector / 2 - 1.9 / Math.max(rose.mer(s)[0], 1.9));
        rail(SB, rose, 0, daOf, s0, s1, (s1 - s0) / 34, -RH, 0.42);
        await ctx.yield();
        rail(SB, rose, 0, daOf, s0, s1, (s1 - s0) / 34, -RH * 0.5, 0.2);
        await ctx.yield();
        for (let i = 0; i <= np; i++) { const s = s0 + (s1 - s0) * i / np, big = i === 0 || i === np ? 1.7 : 1; addPart(SB, rose, 0, daOf(s), s, tPost, [big, big, -RH * (big > 1 ? 1.22 : 1.0)], 0, 0, i * 2.1, 0, false); }
        await ctx.yield();
      }
    }
    tris += SG.tris + SB.tris;
    await ctx.yield();
    add(await SG.geometryAsync(ctx, 210, 80), roseGemMat, 'rose-diamonds'); add(await SB.geometryAsync(ctx, 210, 80), roseBezelMat, 'rose-collets');
  }
  await ctx.yield();
  {
    // real laurel leaves on the rims of the front gore (the close pass) and its neighbours' near edges
    const S = new Soup(), sec = rose.sector, step = 0.62 / detail;
    const n1 = Math.ceil(((rose.L - 2) * 0.5 - 1) / step), nAll = Math.ceil((rose.L - 3) / step);
    for (const sd of [-1, 1]) {
      for (let i = 0; i < nAll; i++) {
        const s = 1 + i * step, k = sd < 0 && i >= n1 ? i - n1 : i; if (s >= rose.L - 2) break;
        const da = sd * Math.max(0, sec / 2 - 0.9 / Math.max(rose.mer(s)[0], 0.9));
        S.wave = s;
        for (const side of [-1, 1]) addPart(S, rose, 0, da, s + (side > 0 ? step * 0.5 : 0), tLeaf, [0.62, 1.25, -1], side * 0.62 + (k % 2 ? 0.08 : -0.08), -0.25, 0, 0, true);
        if (i % 4 === 3) await ctx.yield();
      }
      await ctx.yield();
    }
    tris += S.tris; add(await S.geometryAsync(ctx, 210, 80), roseLeafMat, 'rose-laurel-leaves');
  }
  await ctx.yield();

  // ---- the primrose egg: barleycorn cut, beaded gold ribs, pearls at the crossings ----------
  const tPearl = tmplFrom(new THREE.IcosahedronGeometry(1, 1));
  for (let i = 0; i < tPearl.pos.length; i += 3) { const l = Math.hypot(tPearl.pos[i], tPearl.pos[i + 1], tPearl.pos[i + 2]) || 1; tPearl.nrm[i] = tPearl.pos[i] / l; tPearl.nrm[i + 1] = tPearl.pos[i + 1] / l; tPearl.nrm[i + 2] = tPearl.pos[i + 2] / l; }
  {
    const S = await shellSoup(ctx, prim, 4, 12, 12, 36, prim.sAtY(45.2), 0.1);
    tris += S.tris;
    await ctx.yield();
    const ownP = () => ({
      uTint: { value: lin(cPrim).lerp(new THREE.Vector3(0.96, 1.0, 0.5), 0.15 * paleP) }, uInTint: { value: lin(cPrim).lerp(new THREE.Vector3(0.96, 1.0, 0.5), 0.15 * paleP) }, uFlat: { value: 0.4 * paleP }, uKind: { value: 1 }, uInKind: { value: 1 }, uInGlass: { value: 1 }, uSea: { value: 0 }, uCollarR: { value: 0 }, uDepth: { value: new THREE.Vector2((1.8 - 0.9 * paleP) * dP, (1.75 - 0.5 * paleP) * dP) }, uLum: { value: new THREE.Vector2(0.75, 0.8) }, uCoat: { value: new THREE.Vector2(0.06, 0.22) }, uGround: { value: 0.35 + 0.45 * paleP },   // a pale primrose is thin glass over bright silver (the palette's #F2E3A0 face on, amber only in the cut and at the rims: never the gilt's colour); a dark shell keeps the deeper glass
    });
    const refP = [new THREE.Vector3(0, 95, 0), new THREE.Vector3(20, 28, 20), deep(cMauve, 0.9)], geoP = await S.geometryAsync(ctx, 150, 90);
    add(geoP, mkMat(FRAG_ENAMEL, U.prim, ownP(), refP, THREE.DoubleSide), 'primrose-shell');
    if (hasRamp) rampImage(geoP, mkMat(FRAG_ENAMEL, U.prim, { ...ownP(), ...rampU() }, refP, THREE.DoubleSide), 'primrose-shell-ramp-image');
    const R = new Soup(), P = new Soup(), sec = prim.sector, rings = [-0.5 * prim.dnT.L, 0.14 * prim.L, 0.3 * prim.L, 0.46 * prim.L, 0.62 * prim.L, 0.78 * prim.L];
    for (let gi = 0; gi < 12; gi++) {
      for (const sd of [-1, 1]) {
        const pts = [];
        for (let s = 0.3; s < prim.L - 0.8; s += 1.6) pts.push({ a: gi * sec + sd * Math.max(0, sec / 2 - 0.4 / Math.max(prim.mer(s)[0], 0.4)), s });
        ribbon(R, prim, pts, 0.46, 0.4, gi, gi, true);                 // tubes: the ribs show on both faces
        await ctx.yield();
      }
      const low = []; for (let s = prim.sAtY(47); s < -0.2; s += 1.6) low.push({ a: (gi + 0.5) * sec, s });
      low.push({ a: (gi + 0.5) * sec, s: -0.1 }); ribbon(R, prim, low, 0.26, 0.3, gi, gi);
      await ctx.yield();
      for (const s of rings) {
        const pts = []; for (let k = 0; k <= 6; k++) pts.push({ a: gi * sec + (k / 6 - 0.5) * sec * 0.985, s });
        ribbon(R, prim, pts, 0.24, 0.26, gi * 2, gi, s > 0);
        addPart(P, prim, gi, sec / 2 - 0.6 / prim.mer(s)[0], s, tPearl, [0.7, 0.7, 0.7], 0, 0.1, 0, 0, false);
        if (s > 0) addPart(P, prim, gi, 0, s, tPearl, [0.5, 0.5, 0.5], 0, 0.0, 0, 0, false);
        await ctx.yield();
      }
      addPart(P, prim, gi, 0, prim.L - 1.2, tPearl, [0.5, 0.5, 0.5], 0, 0.3, 0, 0, false);
      await ctx.yield();
    }
    tris += R.tris + P.tris;
    await ctx.yield();
    add(await R.geometryAsync(ctx, 150, 90), mkMat(FRAG_GOLD, U.prim, { uTint: { value: goldRef }, uMode: { value: 5 } }), 'primrose-ribs');
    add(await P.geometryAsync(ctx, 150, 90), mkMat(FRAG_GOLD, U.prim, { uTint: { value: lin(cDia, 0.95) }, uMode: { value: 4 } }), 'primrose-pearls');
  }
  await ctx.yield();
  // ---- cabochons: sapphires and emeralds set down the gilt inner midline of every rose petal but the gangway (the jewelled interior seen from above) ----
  {
    const J = [new Soup(), new Soup()];
    for (let gi = 1; gi < 12; gi++) {
      for (let k = 0; k < 5; k++) { const sg = 13 + k * 17, rg = k < 3 ? 2.5 : 1.8; addPart(J[(gi + k) % 2], rose, gi, 0, sg, tPearl, [rg, rg, -rg * 0.6], 0, -0.25, 0, 0, false); }
      await ctx.yield();
    }
    tris += J[0].tris + J[1].tris;
    add(await J[0].geometryAsync(ctx, 210, 80), mkMat(FRAG_GOLD, U.rose, { uTint: { value: new THREE.Vector3(0.05, 0.1, 0.62) }, uMode: { value: 4 } }), 'rose-sapphires');
    add(await J[1].geometryAsync(ctx, 210, 80), mkMat(FRAG_GOLD, U.rose, { uTint: { value: lin(pal[4], 0.55).multiply(new THREE.Vector3(0.45, 1.0, 0.6)) }, uMode: { value: 4 } }), 'rose-emeralds');
  }
  await ctx.yield();
  // ---- mauve, moire wave cut: the portal's saucer (eight petals lying open) and the bird's two wings ----
  for (const [egg, eu, nm, cc, rc, cg, rg, sb, rib, cnt] of [[mauv, U.mauv, 'mauve', 4, 6, 12, 12, mauv.sAtY(70.25), 1.1, 8], [wingR, U.wingR, 'wing-r', 6, 2, 12, 16, wingR.sAtY(wingR.Y - 1.2), 0.9, 1], [wingL, U.wingL, 'wing-l', 6, 2, 12, 16, wingL.sAtY(wingL.Y - 1.2), 0.9, 1]]) {
    const S = await shellSoup(ctx, egg, cc, rc, cg, rg, sb, 0.06, cnt);
    tris += S.tris;
    await ctx.yield();
    const ownM = () => ({
      uDepth: { value: new THREE.Vector2(1.15, 1.5) }, uLum: { value: new THREE.Vector2(0.45, 0.55) }, uCoat: { value: new THREE.Vector2(0.08, 0.1) }, uTint: { value: lin(cMauve) }, uInTint: { value: lin(cMauve) }, uKind: { value: 2 }, uInKind: { value: 2 }, uInGlass: { value: 1 }, uSea: { value: 0 }, uCollarR: { value: 0 },
    });
    const geoM = await S.geometryAsync(ctx, egg === mauv ? 80 : 40, egg === mauv ? 90 : 126);
    add(geoM, mkMat(FRAG_ENAMEL, eu, ownM(), null, THREE.DoubleSide), nm + '-shell');
    if (hasRamp && egg === mauv) rampImage(geoM, mkMat(FRAG_ENAMEL, eu, { ...ownM(), ...rampU() }, null, THREE.DoubleSide), 'mauve-shell-ramp-image');
    const R = new Soup(), sec = egg.sector;
    for (let gi = 0; gi < cnt; gi++) for (const sd of [-1, 1]) {
      const pts = [];
      for (let s = 0.2; s < egg.L - 0.4; s += rib) pts.push({ a: egg.az0 + gi * sec + sd * Math.max(0, sec / 2 - 0.26 / Math.max(egg.mer(s)[0], 0.26)), s });
      ribbon(R, egg, pts, 0.3, 0.28, gi, gi, true);
      await ctx.yield();
    }
    tris += R.tris;
    await ctx.yield();
    add(await R.geometryAsync(ctx, egg === mauv ? 80 : 40, egg === mauv ? 90 : 126), mkMat(FRAG_GOLD, eu, { uTint: { value: goldRef }, uMode: { value: 5 } }), nm + '-ribs');
  }
  await ctx.yield();

  // ---- fixed gold: girdles, hinge knuckles, stems, waterline wire, the portal's ring ---------
  const statics = [], sPearls = [], girdles = [], _d = new THREE.Vector3();
  const put = (list, geo, m4) => {
    finishStatic(geo);
    if (m4) { geo.applyMatrix4(m4); const t = geo.attributes.aTan; for (let i = 0; i < t.count; i++) { _d.fromBufferAttribute(t, i).transformDirection(m4); t.setXYZ(i, _d.x, _d.y, _d.z); } }
    list.push(geo);
  };
  const V2 = (a) => a.map(([x, y]) => new THREE.Vector2(x, y)), M = () => new THREE.Matrix4();
  put(girdles, new THREE.LatheGeometry(V2([[59.6, 60.2], [60.9, 60.4], [61.5, 61.1], [61.1, 61.8], [61.7, 62.5], [61.1, 63.2], [61.4, 63.8], [60.4, 64.1], [59.7, 63.6]]), 120));
  await ctx.yield();
  put(girdles, new THREE.LatheGeometry(V2([[35.6, 66.9], [36.6, 67.1], [37.0, 67.9], [36.6, 68.7], [35.7, 68.9]]), 72));
  await ctx.yield();
  put(girdles, new THREE.LatheGeometry(V2([[19.7, 76.3], [20.4, 76.5], [20.6, 77.0], [20.3, 77.5], [19.8, 77.6]]), 48));
  await ctx.yield();
  const r0 = rose.mer(rose.sAtY(0))[0];
  put(statics, new THREE.LatheGeometry(V2([[r0 + 1.5, 0.35], [9.5, 0.9], [7, 2.4], [4.4, 6], [3.3, 13.5], [4.7, 16.5], [5.6, 18.5], [4.5, 20.5], [3.1, 23.5], [2.7, 34], [3.7, 38], [7, 41], [13, 44.2], [17.8, 48.2], [22.8, 50.1], [24.9, 51.3]]), 40));
  await ctx.yield();
  put(statics, new THREE.LatheGeometry(V2([[3.4, 45.3], [1.7, 48], [1.25, 62], [1.9, 65], [1.3, 66.5], [2.6, 68.3], [8, 70.2], [15, 72.2], [17.9, 73.7]]), 24));
  put(statics, new THREE.TorusGeometry(r0 + 0.5, 0.5, 6, 96).rotateX(Math.PI / 2).translate(0, 0.2, 0));
  await ctx.yield();
  for (let gi = 0; gi < 12; gi++) for (let k = -1; k <= 1; k++) {            // hinge knuckles, 1.2 m across
    const az = gi * rose.sector + k * rose.sector * 0.3;
    const g = new THREE.SphereGeometry(0.62, 10, 6).scale(1, 1, 1); finishStatic(g, 1); g.scale(2.4, 1, 1);
    g.applyMatrix4(M().makeRotationY(az).setPosition(Math.sin(az) * 61.2, 62.4, Math.cos(az) * 61.2));
    const t = g.attributes.aTan; for (let i = 0; i < t.count; i++) t.setXYZ(i, Math.cos(az), 0, -Math.sin(az));
    statics.push(g);
    await ctx.yield();
  }
  const PITCH = 14 * Math.PI / 180, facing = new THREE.Vector3(0, -Math.sin(PITCH), Math.cos(PITCH)), seat = new THREE.Vector3(0, 94, 0), PR = 17;
  const ringM = M().makeRotationX(PITCH).setPosition(seat);
  put(statics, new THREE.TorusGeometry(PR + 0.9, 0.4, 8, 72), ringM);
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * TAU, pearl = i % 3 === 0, rr = pearl ? 0.66 : 0.4;
    put(pearl ? sPearls : statics, new THREE.SphereGeometry(rr, pearl ? 12 : 8, pearl ? 8 : 5), M().makeRotationX(PITCH).setPosition(seat).multiply(M().makeTranslation(Math.cos(a) * (PR + 0.9), Math.sin(a) * (PR + 0.9), 0.4)));
    if (i % 4 === 3) await ctx.yield();
  }
  await ctx.yield();
  // ---- the clockwork bird: a small gold songbird perched on top of the portal's ring (its wings are the two mauve gores above; its head is its own piece and ticks from side to side) ----
  let birdHead = null;
  {
    const BS = M().makeTranslation(0, 112, 3.4).multiply(M().makeScale(BK, BK, BK)).multiply(M().makeTranslation(0, -112, -4.3));   // the whole bird, scaled about its perch and set back a little
    const at = (x, y, z, rx = 0, ry = 0, rz = 0) => BS.clone().multiply(M().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)).setPosition(x, y, z));
    const hGold = [], hPearl = [], neck = new THREE.Vector3(0, 120.2, 6.0).applyMatrix4(BS);
    put(statics, new THREE.SphereGeometry(1, 16, 10).scale(3.7, 3.8, 6.2), at(0, 115.7, 1.4, -0.22));                 // body, breast lifted
    put(hGold, new THREE.SphereGeometry(2.4, 14, 10), at(0, 120.2, 6.0));                                             // head
    put(hGold, new THREE.ConeGeometry(0.85, 4.2, 8), at(0, 119.9, 9.6, Math.PI / 2 + 0.1));                            // beak
    for (const sx of [-1, 1]) {
      put(hPearl, new THREE.SphereGeometry(0.6, 10, 7), at(sx * 1.72, 120.9, 7.4));                                   // pearl eyes
      put(statics, new THREE.SphereGeometry(0.95, 8, 6).scale(1, 0.8, 1.5), at(sx * 1.2, 112.3, 4.3));                // feet on the ring
      put(statics, new THREE.CylinderGeometry(0.28, 0.28, 2.0, 6), at(sx * 1.2, 113.1, 3.8, 0.35));                   // legs
      await ctx.yield();
    }
    await ctx.yield();
    for (let k = -2; k <= 2; k++)                                                                                     // five gold tail feathers, fanned and cocked up
      put(statics, new THREE.SphereGeometry(1, 8, 6).scale(1.0, 0.18, 4.6).translate(0, 0, -4.6), at(0, 116.8, -3.4, -0.62, k * 0.3, 0));
    for (let k = -1; k <= 1; k++) put(hGold, new THREE.ConeGeometry(0.38, 1.9, 6), at(0, 122.8 - Math.abs(k) * 0.15, 5.9 + k * 0.9, -0.5 + k * 0.3));     // crest
    put(statics, new THREE.CylinderGeometry(0.26, 0.26, 2.0, 6), at(0, 120.2, -1.2));                                 // the winding key on its back
    put(statics, new THREE.TorusGeometry(1.2, 0.26, 6, 16).scale(1, 1.25, 1), at(0, 122.6, -1.2, 0, Math.PI / 2, 0));
    await ctx.yield();
    birdHead = new THREE.Group(); birdHead.name = 'bird-head'; birdHead.position.copy(neck); root.add(birdHead);
    for (const [list, tint, mode, nm] of [[hGold, goldRef, 3, 'bird-head-gold'], [hPearl, lin(cDia, 0.95), 4, 'bird-eyes']]) {
      const g = mergeGeometries(list).translate(-neck.x, -neck.y, -neck.z); list.forEach((x) => x.dispose()); tris += g.index.count / 3;
      const m = new THREE.Mesh(g, mkMat(FRAG_GOLD, null, { uTint: { value: tint }, uMode: { value: mode } })); m.name = nm; m.frustumCulled = false; birdHead.add(m);
    }
    await ctx.yield();
    // the floor round the saucer: a ring of great pearls on a gold wire, inside the primrose petals
    put(statics, new THREE.TorusGeometry(29, 0.35, 6, 72).rotateX(Math.PI / 2), M().makeTranslation(0, 70.2, 0));
    for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * TAU; put(sPearls, new THREE.SphereGeometry(i % 2 ? 1.0 : 1.55, 10, 7), M().makeTranslation(Math.sin(a) * 29, 70.6, Math.cos(a) * 29)); if (i % 3 === 2) await ctx.yield(); }
  }
  await ctx.yield();
  // ---- the gangway's piers: four gold columns that rise out of the sea and carry the lowered gore, so in profile it is a bridge and not a blade ----
  let piers = null;
  {
    const list = [];
    for (const z of [92, 122, 152, 178]) {
      const h = 62 - 0.2769 * (z - 60) - 0.5;
      put(list, new THREE.LatheGeometry(V2([[2.6, -6], [3.5, 0.3], [3.1, 1.6], [1.8, 3.4], [1.55, h * 0.5], [2.2, h * 0.5 + 0.9], [1.5, h * 0.5 + 1.8], [1.4, h - 6], [2.1, h - 4.4], [1.6, h - 3.6], [2.8, h - 1.6], [3.3, h - 0.5], [0.3, h - 0.4]]), 14), M().makeTranslation(0, 0, z));
      await ctx.yield();
    }
    const g = mergeGeometries(list); list.forEach((x) => x.dispose()); tris += g.index.count / 3;
    piers = add(g, mkMat(FRAG_GOLD, null, { uTint: { value: goldRef }, uMode: { value: 3 } }), 'ramp-piers'); piers.position.y = -62;
  }
  const PIER_Z = [92, 122, 152, 178], pierH = (z) => 62 - 0.2769 * (z - 60) - 0.5;   // for the sea's mirror only: the same places and heights as the loop above
  await ctx.yield();
  {
    const g = mergeGeometries(statics); await ctx.yield();
    const gp = mergeGeometries(sPearls); await ctx.yield();
    const gg = mergeGeometries(girdles); await ctx.yield(); statics.concat(sPearls, girdles).forEach((x) => x.dispose());
    tris += (g.index.count + gp.index.count + gg.index.count) / 3;
    add(gg, mkMat(FRAG_GOLD, null, { uTint: { value: goldRef }, uMode: { value: 1 } }), 'gold-girdles');
    if (hasSea) image(gg, mkMat(FRAG_GOLD, null, { uTint: { value: goldRef }, uMode: { value: 1 }, ...imgU }), 'gold-girdles-image');
    add(g, mkMat(FRAG_GOLD, null, { uTint: { value: goldRef }, uMode: { value: 3 } }), 'gold-mounts');
    add(gp, mkMat(FRAG_GOLD, null, { uTint: { value: lin(cDia, 0.95) }, uMode: { value: 4 } }), 'portal-pearls');
  }
  await ctx.yield();
  // the portal's light (a stand-in the world hides once the real portal is seated) and the sea apron
  const glow = new THREE.Mesh(new THREE.CircleGeometry(PR + 0.4, 48).applyMatrix4(ringM), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF4D6').multiplyScalar(1.9), fog: false }));
  glow.name = 'portal-glow'; glow.visible = opts.portalGlow !== false; root.add(glow);
  if (hasRamp) {
    // the portal's light mirrored in the ramp
    const dg = finishStatic(new THREE.CircleGeometry(PR, 40)).applyMatrix4(ringM);
    rampImage(dg, mkMat(FRAG_DISC, null, rampU()), 'portal-ramp-image');
    // one screen-covering triangle that puts alpha back to 1 once the shell has been drawn (colour untouched)
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const fm = new THREE.ShaderMaterial({ vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: 'void main(){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }', depthTest: false, depthWrite: false, fog: false,
      blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.ZeroFactor });
    const fx = add(fg, fm, 'alpha-restore'); fx.renderOrder = -6.5;
  }
  let apron = null, seaRef = null;
  if (opts.apron !== false) {
    const g = new THREE.CircleGeometry(opts.apronRadius ?? 2600, 96).rotateX(-Math.PI / 2); const n = g.attributes.position.count, tan = new Float32Array(n * 3), uv = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) tan[i * 3] = 1;
    g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3)); g.setAttribute('aUv', new THREE.BufferAttribute(uv, 4)); g.deleteAttribute('uv');
    apron = add(g, mkMat(FRAG_ENAMEL, null, {
      uTint: { value: lin(cSea) }, uInTint: { value: goldRef }, uKind: { value: 4 }, uInKind: { value: 4 }, uInGlass: { value: 1 }, uSea: { value: 1 }, uCollarR: { value: r0 },
    }, [new THREE.Vector3(0, 80, 0), new THREE.Vector3(66, 98, 66), deep(cRose, 0.8)]), 'sea-apron');
    seaRef = refs[refs.length - 1];
    // the sea is glass: drawn after the image under it and blended over it (premultiplied), still in the opaque pass so it writes depth for everything above
    apron.renderOrder = -8; apron.material.blending = THREE.CustomBlending; apron.material.blendSrc = THREE.OneFactor; apron.material.blendDst = THREE.OneMinusSrcAlphaFactor;
    tris += 96;
  }

  // ---- opening: all three eggs are smoothsteps of one progress value ------------------------
  let progress = -1;
  const setProgress = (u) => {
    u = clamp(u, 0, 1); if (u === progress) return; progress = u;
    const a = smoothstep(0.02, 0.27, u);
    const eG = 0.065 + 0.335 * a + 0.6 * smoothstep(0.24, 0.46, u), eF = 0.038 + 0.2 * a + 0.762 * smoothstep(0.2, 0.47, u);
    U.rose.uE.value.set(eG, eF, eG);
    U.prim.uE.value.set(eG, eF, eG);                 // the primrose petals rise with the rose gores, one opening: they are the fanned tail behind the portal
    shared.uGlow.value = smoothstep(0.3, 0.5, u); shared.uRampOn.value = u > 0.48 ? 1 : 0;       // the gore is down and flat by 0.47
    if (piers) piers.position.y = -62 * (1 - smoothstep(0.2, 0.45, u));                          // the gangway's four gold piers rise out of the sea to meet it
    if (seaRef) { const t = smoothstep(0.03, 0.5, u); seaRef.c.set(0, 80 - 8 * t, 0); seaRef.r.set(66 + 139 * t, 98 + 40 * t, 66 + 139 * t); }   // the mirror's zone grows with the flower
  };
  // viewer only: ?prog=0..1 poses the opening when no world is driving it (the world's setProgress always wins)
  let dbg = null; try { dbg = new URLSearchParams(globalThis.location?.search || '').get('prog'); } catch (e) { dbg = null; }
  setProgress(dbg !== null && dbg !== '' ? parseFloat(dbg) : (opts.progress ?? 0.56));

  await ctx.yield();
  // ---- anchors (local space) ----------------------------------------------------------------
  const tan14 = Math.tan(PITCH), tip = poseCentre(rose, POSE.rose.F, 1, rose.L);
  const onLine = (z) => new THREE.Vector3(0, seat.y - tan14 * z, z);
  // the floor under the last straight: the lowered rose gore, the primrose lip arching onto it, the mauve lip, then up into the portal
  const rampC = []; for (let i = 0; i <= 48; i++) { const c = poseCentre(rose, POSE.rose.F, 1, rose.L * i / 48); rampC.push([c[0], c[1]]); }
  const floorY = (r) => {                             // the gilt face out to its tip; inside the girdle the cups stand open below, so the line rises to the portal's sill
    if (r < rose.R) return rose.Y + 0.5 + (seat.y - PR - 3 - rose.Y) * smoothstep(rose.R, 6, r);
    for (let i = 0; i < 48; i++) { const a = rampC[i], b = rampC[i + 1]; if (r >= a[0] && r <= b[0]) return a[1] + (b[1] - a[1]) * (r - a[0]) / Math.max(b[0] - a[0], 1e-6); }
    return 0;
  };
  const anchors = {
    portalSeat: { position: seat.clone(), facing: facing.clone(), radius: PR, pitchDeg: 14 },
    flyThrough: [tip[0] + 90, tip[0] + 25, tip[0], (tip[0] + 60) / 2, 60, 25, 10, 0].map(onLine),
    goreTip: new THREE.Vector3(0, tip[1], tip[0]), floorY,
    piers: PIER_Z.map((z) => ({ z, top: pierH(z), shaft: 1.5, cap: 3.3, foot: 3.5 })),   // the gangway's columns on the local z axis: top height, radii of shaft, capital and foot
    bird: { perch: new THREE.Vector3(0, 112, 3.4), crest: new THREE.Vector3(0, 112 + (123.75 - 112) * BK, 3.4 + (5.9 - 4.3) * BK) },   // the clockwork bird's box: its feet on the ring, the tip of its crest
    hinges: { rose: new THREE.Vector3(0, 62, 60), primrose: new THREE.Vector3(0, 68, 36), mauve: new THREE.Vector3(0, 77, 20) },
    viewpoints: {
      flower: new THREE.Vector3(Math.sin(1.15) * 250, 14, Math.cos(1.15) * 250),      // u ~0.45: the Egg open like a flower (mirror x for the other hand)
      underGores: new THREE.Vector3(Math.sin(0.45) * 205, 24, Math.cos(0.45) * 205),   // u ~0.7: gilt overhead, before the turn onto the ramp
      rampFoot: onLine(tip[0] + 25),
    },
    waterline: { radius: r0, y: 0 },
    sunDirLocal: new THREE.Vector3(0, Math.sin(38 * Math.PI / 180), Math.cos(38 * Math.PI / 180)),
    reflect: { center: new THREE.Vector3(0, 78, 0), radii: new THREE.Vector3(60, 92, 60) },   // the ellipsoid a sea shader can mirror
  };

  shared.uRampL.value = rose.L; for (let i = 0; i <= 16; i++) shared.uOut.value[i] = rose.mer(rose.L * i / 16)[0] * Math.sin(rose.sector / 2 - 0.14 / rose.R);
  const _n = new THREE.Vector3(), _p = new THREE.Vector3(), _last = new THREE.Vector3(), _sz = new THREE.Vector2(), _s = new THREE.Vector3(); let hasLast = false, speed = 12;
  const update = (dt, time, camera) => {
    shared.uTime.value = time;
    {                                                 // the clockwork bird beats its two mauve gores: a quick down-stroke and a slower lift, without rest (uniforms only)
      const ph = (time * 0.62) % 1, k = ph < 0.36 ? ph / 0.36 : 1 - (ph - 0.36) / 0.64, e = k * k * (3 - 2 * k), th = 0.48 + 0.74 * e;     // from a raised V down to a shallow one, 20 degrees above level, and up again
      for (const w of [U.wingR, U.wingL]) { w.uPoseG.value.x = th; w.uPoseF.value.x = th; w.uPoseN.value.x = th; }
      if (birdHead) {                                 // its head ticks from one side to the other, with a small nod (an object's turn only)
        const hp = (time * 0.19) % 1, sw = (a, x) => { const t = clamp((x - a) / 0.1, 0, 1); return t * t * (3 - 2 * t); };
        birdHead.rotation.set(0.07 * Math.sin(time * 2.3), 0.85 * (1 - 2 * sw(0.4, hp) + 2 * sw(0.9, hp)), 0);
      }
    }
    root.updateWorldMatrix(true, false);
    const sc = _s.setFromMatrixScale(root.matrixWorld).x;
    if (opts.sunDir) shared.uSunDir.value.copy(opts.sunDir).normalize(); else shared.uSunDir.value.copy(anchors.sunDirLocal).transformDirection(root.matrixWorld);
    _p.copy(seat).applyMatrix4(root.matrixWorld); shared.uPortal.value.set(_p.x, _p.y, _p.z, PR * sc);
    _n.set(0, 1, 0).transformDirection(root.matrixWorld); _p.setFromMatrixPosition(root.matrixWorld); seaMir.set(_n.x, _n.y, _n.z, -_n.dot(_p));
    _n.copy(rampN).transformDirection(root.matrixWorld); _p.copy(rampHinge).applyMatrix4(root.matrixWorld); rampMir.set(_n.x, _n.y, _n.z, -_n.dot(_p));
    shared.uRampH.value.copy(_p); shared.uRampA.value.set(0, Math.cos(rampTh), Math.sin(rampTh)).transformDirection(root.matrixWorld); shared.uRampX.value.set(1, 0, 0).transformDirection(root.matrixWorld);
    for (const r of refs) { r.u.uRefC.value.copy(r.c).applyMatrix4(root.matrixWorld); r.u.uRefR.value.copy(r.r).multiplyScalar(sc); }
    for (let i = 0; i < 4; i++) { _p.set(0, 0, PIER_Z[i]).applyMatrix4(root.matrixWorld); shared.uPier.value[i].set(_p.x, _p.z, pierH(PIER_Z[i]) * sc); }   // the piers' places for the sea's mirror
    shared.uPierSunk.value = piers ? -piers.position.y * sc : 0;                                                   // and how far they still stand under the sea
    if (camera) {
      camera.getWorldPosition(_p);
      if (hasLast && dt > 1e-4) { const v = Math.min(_p.distanceTo(_last) / dt, 80); speed += (v - speed) * Math.min(1, dt * 2); }
      _last.copy(_p); hasLast = true; shared.uCamSpeed.value = speed;
      const h = ctx.renderer?.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(_sz).y : 720;
      const fov = camera.isPerspectiveCamera ? camera.fov : 60;
      shared.uPixelAngle.value = 2 * Math.tan(fov * Math.PI / 360) / Math.max(h, 64);
    }
  };
  update(0, 0, null);
  return {
    object: root, radius: 150, height: 170, center: new THREE.Vector3(0, 78, 0), anchors, update, setProgress,
    getProgress: () => progress, parts: { glow, apron }, skyUniforms: shared, stats: { triangles: Math.round(tris) },
    dispose() {}, ground: false, groundY: 0,
  };
}
