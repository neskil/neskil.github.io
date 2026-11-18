// THE LIGHTHOUSE LENS (hero of the world "lens-works")
// A first-order lighthouse optic on its clockwork pedestal, built 25 times life size, standing with its axis on the
// local y axis and its base on y = 0. The hero must sit at the world origin, unrotated: its light is worked out in
// world space round the y axis.
//   pedestal   octagonal iron case (y 0..20) with a glazed south face (+z) showing a train of brass wheels, a
//              fly-ball governor on the plinth, a chain over a sheave to a weight that sinks into a pit
//   optic      lower tier of 8 prism rings (y 20..35), drum of 24 bull's-eye panels 7 m x 24 m (y 35..59, radius 27),
//              upper tier of 18 prism rings stepping in to a crown (y 59..85), all in a bronze frame of 12 standards
//   bays       local bearing b = atan(x, z); panel i covers b = i*15 .. (i+1)*15 degrees. Panels 0 and 1 (bay 0) have
//              no glass; panels LEAF and LEAF+1 hang on hinges as a pair of leaves that swing outward
//   lamp       four-wick burner and glass chimney at the focus (0, 47, 0); it does not turn with the optic
//   light      no three.js lights. makeLensLight() gives one family of ShaderMaterials sharing uniforms: overcast
//              top light, fog, the flame inside the optic, and the BEAM TERM: 24 stations 15 degrees apart turning
//              with uLensAng, each a gaussian slab 7 m wide; the same expression lights every surface (the sliding
//              patch), the dust, and the 24 analytic blade volumes
//   glass      from far off every bar is sea-green glass graded from a deep edge to a pale one. From within the optic, and
//              from outside within about 40 m, every facet (a prism ring's face, a panel's step) is clear glass holding
//              the hall once, squeezed: a pale silver body (the roof), one thin line of red brick, a deep green arris;
//              green is an edge colour (the rim of each bar), and each ring carries one hard glint of the flame
//   lit lens   from outside the glass is a dark clear body that carries the lamp: the panel turned toward the eye fills
//              (uFlare), every boss holds a small upright flame image, a column of glints runs up the tiers on the eye's
//              bearing, now and then one facet flashes white-gold (uSpark; never a colour of its own), every bar's edge is a
//              hairline of the rim green, and far off the whole waist band burns; this light is added after the fog
//   spectra    lwRainbow: three slow sheets of spectrum thrown by the prism tiers (floor arcs, a band on the walls, one
//              on the trusses), one bay in four, turning with the optic; strength uRain
//   spokes     uFloorK: under every blade the lowest rings spill a spoke of light on the floor, from the pedestal's foot outward
//   blades     a blade seen along its length is many times brighter than one seen through its face, and dust throws light
//              onward (uBladePh), so the fan parts into separate blades with darker air between; they
//              start at the glass (the mesh's inner end follows the optic's outline), hottest there (uBladeHot) and
//              thinning outward; their outer ends are slid in to the hall's walls. uExit can shutter station 2, the
//              blade beside the empty bay (the world leaves it burning: it lights the wall beside the hatch)
//              uBayBeam lets the bare flame throw a faint unfocused blade through the northern half of the empty bay;
//              uBayDim puts the lit inner glass beside the bay into shadow (the world raises it on the way out)
//   hatch      uHatch is the tunnel mouth's centre and uLan a signal lantern's place off it (out, up, sideways): the two
//              lanterns light brick, shutters and the first ribs; uLan2 (metres in, up, sideways) is a second pair hung
//              inside the tunnel, whose centre line leaves the wall at the slope uTun; past the mouth (x > 80) only they and the portal's
//              cool light (uPortalPos, uPortalCol) reach the black plate (surf id TUNNEL: seams, rivets, rubbed paint)
// buildHero(ctx, { light, leafBay, quality }) -> { object, radius, height, center, anchors, light, setAngle(a),
//   setLeaves(k), setWeight(k), update(dt, time, camera), dispose() }
// anchors: axis, flame, bayBearing (local bearing of the empty bay's centre), leafBearing (of the leaf pair's centre),
//   drumRadius, hollowRadius, flyRadius (a safe radius inside the hollow).
import * as THREE from 'three';
import * as INT from '../kit/interior.js';

export const LENS = { RD: 27, Y0: 20, YD0: 35, YD1: 59, Y1: 85, FY: 47, PITCH: Math.PI / 12, RIN: 26 };
const TAU = Math.PI * 2, PITCH = LENS.PITCH, PRISM_FILL = 0.965;      // how much of its course a prism bar fills
const lin = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

// surf ids: the kit's 0 plain, 1 wood, 2 fabric, 3 stone, and ours
export const SID = { PLAIN: 0, WOOD: 1, FABRIC: 2, STONE: 3, BRICK: 4, FLOOR: 5, BELT: 6, PLATE: 7, LAP: 8, TUNNEL: 9, ROOF: 20, WINDOW: 21 };
export const sf = (id, gloss = 0.2, metal = 0, emissive = 0, sway = 0) => INT.surf(id, gloss, metal, emissive, sway);

const GLSL_UNI = /* glsl */`
uniform float uLensAng, uTime, uBeamGain, uTopGain, uFogDen, uLeafOpen, uLeafSt, uFlare, uFlameGain, uJet, uBlind, uSnow, uBladeDen, uSway, uExit, uBladeHot, uRain, uBladeK, uSpark, uBayDim, uBayBeam, uFloorK, uBladePh;
uniform vec3 uBeamCol, uTopCol, uFogCol, uFlameCol, uRimCol, uPortalPos, uPortalCol, uShadowCol, uJetCol, uRoofCol, uGlassTint, uHatch, uLan, uLan2; uniform float uTun;
`;
const GLSL_FN = /* glsl */`
const float LW_PITCH = 0.2617994;
float lwHash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.23)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float lwNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(lwHash(i), lwHash(i + vec3(1,0,0)), f.x), mix(lwHash(i + vec3(0,1,0)), lwHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(lwHash(i + vec3(0,0,1)), lwHash(i + vec3(1,0,1)), f.x), mix(lwHash(i + vec3(0,1,1)), lwHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float lwBearing(vec2 xz){ return atan(xz.x, abs(xz.y) + abs(xz.x) < 1e-5 ? 1e-5 : xz.y); }
float lwMask(float i){ float k = mod(i, 24.0); float m = max(step(1.5, k) * (1.0 - uExit * (1.0 - step(0.5, abs(k - 2.0)))), uBayBeam * step(0.5, k) * (1.0 - step(1.5, k))); m *= 1.0 - uLeafOpen * (1.0 - step(1.0, abs(k - uLeafSt - 0.5))); return m; }
// x: metres sideways from the nearest blade's centre plane, y: radius, z: that station's mask, w: station index
vec4 lwStation(vec3 wp){ float r = length(wp.xz); float s = (lwBearing(wp.xz) - uLensAng) / LW_PITCH - 0.5; float i = floor(s + 0.5);
  return vec4(r * sin((s - i) * LW_PITCH), r, lwMask(i), i); }
float lwHeight(float y){ float a = smoothstep(16.0, 26.0, y) * (1.0 - smoothstep(77.0, 88.0, y)); float b = smoothstep(33.0, 38.0, y) * (1.0 - smoothstep(56.0, 61.0, y)); return 0.38 * a + 0.62 * b; }
float lwRadial(float r){ return smoothstep(27.0, 42.0, r) * (0.4 + 0.6 * exp(-r * 0.008)) / (1.0 + r * 0.0065); }
// (uFloorK: the lowest rings' spill, a spoke of light on the floor under every blade, from the foot of the pedestal outward)
float lwBeam(vec3 wp){ vec4 st = lwStation(wp); float lo = uFloorK * (1.0 - smoothstep(3.0, 17.0, wp.y)) * smoothstep(15.5, 25.0, st.y) * (0.4 + 0.6 * exp(-st.y * 0.008)) / (1.0 + st.y * 0.0065);
  return exp(-st.x * st.x * 0.09) * (lwHeight(wp.y) * lwRadial(st.y) + lo) * st.z * (1.0 - smoothstep(80.2, 82.2, wp.x)); }
// the optic's outline (glass radius at height y), as lensRadius() below
float lwLensR(float y){ float a = clamp((y - 59.5) / 25.5, 0.0, 1.0), b = clamp((35.0 - y) / 15.0, 0.0, 1.0); return 26.9 - 11.3 * a * sqrt(a) - 5.3 * b * sqrt(b); }
vec3 lwFog(vec3 col, vec3 wp){ float f = 1.0 - exp(-distance(wp, cameraPosition) * uFogDen); return mix(col, uFogCol * (1.0 - smoothstep(80.3, 82.5, wp.x)), f); }
// THE SPECTRA. Where a blade leaves a bull's-eye it is white-gold, but the prism rings beside the standards also throw
// thin sheets of dispersed light: each leaves the axis at one height between two slopes (red on one side, violet on the
// other) and only in a few bays. They turn with the optic, so broad soft bands of colour slide over floor, brick, rack,
// truss and dust: arcs on the floor round the pedestal, a low band across the walls and racks, a high one in the trusses.
vec3 lwHue(float t){ return clamp(abs(fract(t + vec3(0.0, 0.6667, 0.3333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
vec3 lwSheet(float slope, float t0, float t1){ float t = (slope - t0) / (t1 - t0); float e = sin(clamp(t, 0.0, 1.0) * 3.14159); return (lwHue(clamp(t, 0.0, 1.0) * 0.76) * 0.85 + 0.15) * e * e; }
float lwBay(float lb, float a){ float x = (fract((lb - a) * 0.25 + 0.5) - 0.5) * 4.0; return exp(-x * x * 2.6); }
vec3 lwRainbow(vec3 wp){
  float r = length(wp.xz); if (r < 28.5) return vec3(0.0);
  float lb = (lwBearing(wp.xz) - uLensAng) / LW_PITCH, m = mod(lb, 24.0);
  float glass = smoothstep(2.2, 2.9, m) * (1.0 - smoothstep(23.5, 24.0, m));
  vec3 c = lwSheet(wp.y - 30.0 > 0.0 ? 9.0 : (wp.y - 30.0) / r, -0.40, -0.68) * lwBay(lb, 3.0)
         + lwSheet((wp.y - 47.0) / r, -0.03, -0.10) * lwBay(lb, 2.4) * 0.85 * (1.0 - smoothstep(150.0, 220.0, r))
         + lwSheet((wp.y - 72.0) / r, 0.12, 0.27) * lwBay(lb, 0.4) * 0.8;
  return c * glass * smoothstep(28.5, 40.0, r) / (1.0 + r * 0.011) * (1.0 - smoothstep(80.2, 82.2, wp.x)) * uRain;
}
`;
// albedo detail, the two luminous surfaces (roof glass, ground-glass windows) and the lighting
const GLSL_SURF = /* glsl */`
vec3 lwRoof(vec3 wp){
  float sx = wp.x + 40.0, s = abs(sx), zc = wp.z;
  float bz = abs(fract(zc / 7.5 + 0.5) - 0.5) * 7.5, bs = abs(fract(s / 20.0 + 0.5) - 0.5) * 20.0;
  float bar = smoothstep(0.3, 0.85, bz) * smoothstep(0.5, 1.3, bs), soot = smoothstep(0.3, 3.0, bz);
  float pane = lwHash(vec3(floor(zc / 7.5), floor(s / 20.0), 7.0));
  float cloud = lwNoise(vec3(wp.x * 0.011, wp.z * 0.011, uTime * 0.03));
  vec3 c = uRoofCol * (0.7 + 0.16 * pane + 0.24 * cloud) * mix(0.6, 1.0, soot);
  c = mix(c, c * vec3(0.6, 0.98, 0.62), (1.0 - soot) * smoothstep(92.0, 118.0, s) * 0.75);
  float sl = s - uTime * 1.8;
  float sv = lwNoise(vec3(zc * 0.019 + step(0.0, sx) * 40.0, sl * 0.027, 3.0)) + 0.08 * lwNoise(vec3(zc * 0.21, sl * 0.3, 5.0));
  float sn = smoothstep(0.5, 0.52, sv) * uSnow, lip = (1.0 - smoothstep(0.02, 0.075, abs(sv - 0.52))) * uSnow;
  // snow lies on the glass in sheets that slide toward the eaves: from below they are blue-grey shadows on the bright panes
  c = mix(c, uRoofCol * vec3(0.2, 0.3, 0.5) * (0.8 + 0.3 * lwNoise(vec3(zc * 0.05, sl * 0.07, 9.0))), sn * 0.96) * (1.0 - 0.45 * lip);
  // the blinds: dark warm canvas running down from the ridge, bay by bay, a hard edge and a batten against the bright glass
  float bp = 126.0 * clamp(uBlind * 2.2 - 1.2 * fract(floor(zc / 30.0 + 0.4) * 0.618 + 0.3), 0.0, 1.0), on = step(0.05, bp);
  float bl = (1.0 - smoothstep(-0.35, 0.0, s - bp)) * on;
  vec3 canvas = uRoofCol * vec3(0.33, 0.215, 0.1) * (0.72 + 0.34 * lwNoise(vec3(zc * 0.35, s * 0.05, 1.0))) * (0.8 + 0.2 * step(0.06, fract(zc / 30.0 + 0.4))) * (0.86 + 0.14 * step(0.07, fract(s / 6.5)));
  c = mix(c, canvas, bl);
  c = mix(c, uRoofCol * vec3(0.045, 0.03, 0.018), (1.0 - smoothstep(0.75, 1.25, abs(s - bp + 0.3))) * on * (1.0 - step(125.9, bp)));
  float pg = 0.0;
  for (int i = 0; i < 12; i++) { float fi = float(i); vec3 h = vec3(lwHash(vec3(fi, 1.0, 2.0)), lwHash(vec3(fi, 5.0, 9.0)), lwHash(vec3(fi, 3.0, 4.0)));
    vec2 c0 = vec2(-150.0 + h.x * 220.0, -110.0 + h.y * 300.0); float ph = uTime * (0.25 + 0.3 * h.z) + h.x * 30.0;
    c0 += vec2(sin(ph) + 0.5 * sin(ph * 2.7), cos(ph * 0.8) + 0.4 * sin(ph * 3.1)) * 5.0;
    float fly = step(fi, 1.5) * smoothstep(0.8, 1.0, fract(uTime * 0.09 + h.y)); c0 += fly * vec2(46.0, 30.0 - 60.0 * h.z);
    float d = length((wp.xz - c0) * vec2(1.0, 0.75)); pg = max(pg, (1.0 - smoothstep(1.8, 3.6 + 6.0 * fly, d)) * (1.0 - 0.6 * fly)); }
  c *= 1.0 - 0.55 * pg * (1.0 - bl);
  return c * bar + uRoofCol * 0.035;
}
vec3 lwWindow(vec3 wp){
  float x = wp.x, y = wp.y, g = 0.8 + 0.12 * lwNoise(vec3(x * 0.05, y * 0.05, 2.0));
  float line = 50.0 + (x + 160.0) * 0.11, slope = 1.0 - smoothstep(line - 2.0, line + 2.0, y);
  float ch = (1.0 - smoothstep(3.0, 4.5, abs(x + 30.0))) * (1.0 - smoothstep(line + 24.0, line + 26.0, y));
  float sy = y - (line + 26.0), sxx = x + 30.0 - sy * 0.9 - 3.0 * sin(sy * 0.12 - uTime * 0.45);
  float sm = (1.0 - smoothstep(2.0 + sy * 0.25, 5.0 + sy * 0.45, abs(sxx))) * smoothstep(0.0, 3.0, sy) * (1.0 - smoothstep(22.0, 46.0, sy)) * (0.45 + 0.55 * lwNoise(vec3(sxx * 0.2, sy * 0.15 - uTime * 0.6, 1.0)));
  vec3 c = uRoofCol * 0.78 * g * (1.0 - 0.26 * max(slope, ch) - 0.16 * sm);
  float bx = abs(fract(x / 7.5 + 0.5) - 0.5) * 7.5, by = abs(fract(y / 9.0 + 0.5) - 0.5) * 9.0;
  return (c * smoothstep(0.25, 0.7, bx) * smoothstep(0.25, 0.7, by) + uRoofCol * 0.03) * uTopGain;
}
vec3 lwDetail(float id, vec3 q, vec3 qo, vec3 n, vec3 alb, inout float gloss, inout float emis){
  if (id < 0.5) { alb *= 0.8 + 0.3 * lwNoise(q * 0.9) + 0.12 * (lwNoise(q * 4.7) - 0.5); }
  else if (id < 1.5) { float g1 = lwNoise(vec3(q.x * 2.4, q.y * 0.2, q.z * 2.4)), g2 = lwNoise(vec3(q.x * 9.0, q.y * 0.7, q.z * 9.0)); alb *= 0.7 + 0.42 * g1 + 0.16 * (g2 - 0.5); }
  else if (id < 2.5) { alb *= 0.72 + 0.3 * lwNoise(q * 5.5) + 0.26 * lwNoise(q * 1.1); }
  else if (id < 3.5) { alb *= 0.8 + 0.25 * lwNoise(q * 2.2) + 0.1 * (lwHash(floor(q * 6.0)) - 0.5); }
  else if (id < 4.5) {
    vec2 uv = abs(n.x) > 0.6 ? q.zy : (abs(n.z) > 0.6 ? q.xy : q.xz);
    float row = floor(uv.y / 1.75), bu = uv.x / 5.6 + 0.5 * mod(row, 2.0), bi = floor(bu); vec2 f = vec2(fract(bu), fract(uv.y / 1.75));
    float h = lwHash(vec3(bi, row, 3.0));
    float body = smoothstep(0.0, 0.03, f.x) * (1.0 - smoothstep(0.97, 1.0, f.x)) * smoothstep(0.0, 0.1, f.y) * (1.0 - smoothstep(0.9, 1.0, f.y));
    float lb = smoothstep(0.16, 0.55, max(fwidth(uv.x) / 5.6, fwidth(uv.y) / 1.75)); h = mix(h, 0.45, lb); body = mix(body, 0.86, lb);
    vec3 brick = alb * (0.66 + 0.6 * h); brick = mix(brick, brick * vec3(0.6, 0.62, 0.72), step(0.86, h));
    brick = mix(brick, dot(brick, vec3(0.3, 0.5, 0.2)) * vec3(1.45, 0.82, 0.6), 0.3);       // warm red, a little browned
    brick *= 0.86 + 0.28 * lwNoise(q * 0.3);
    float lum = dot(alb, vec3(0.3, 0.5, 0.2));
    alb = mix(vec3(0.5, 0.47, 0.43) * (lum * 1.5 + 0.03), brick, body);
    alb *= mix(1.0, 0.55, smoothstep(88.0, 112.0, q.y)) * mix(0.62, 1.0, smoothstep(13.0, 15.0, q.y));
    // soot round the photometry hatch and up the wall above its lanterns
    vec2 hq = vec2(q.z - uHatch.z, (q.y - uHatch.y) * 0.75 - 4.0); float st = (1.0 - smoothstep(13.0, 40.0, length(hq))) * step(70.0, q.x) * (0.45 + 0.55 * lwNoise(vec3(q.z * 0.16, q.y * 0.05, 4.0)));
    alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))) * vec3(0.7, 0.52, 0.42), st * 0.8);
  }
  else if (id < 5.5) {
    float row = floor(q.z / 9.0), bu = q.x / 14.0 + 0.37 * row; vec2 f = vec2(fract(bu), fract(q.z / 9.0));
    float h = lwHash(vec3(floor(bu), row, 5.0));
    float joint = smoothstep(0.0, 0.02, f.x) * (1.0 - smoothstep(0.98, 1.0, f.x)) * smoothstep(0.0, 0.03, f.y) * (1.0 - smoothstep(0.97, 1.0, f.y));
    float wear = lwNoise(vec3(q.x * 0.045, 0.0, q.z * 0.045)), rouge = smoothstep(0.52, 0.8, lwNoise(vec3(q.x * 0.03 + 9.0, 2.0, q.z * 0.03)));
    alb *= (0.7 + 0.45 * h) * (0.75 + 0.5 * wear) * mix(0.45, 1.0, joint);
    alb = mix(alb, alb * vec3(1.9, 0.75, 0.55), rouge * 0.7);
    alb *= 1.0 + 0.5 * (1.0 - smoothstep(4.0, 17.0, abs(q.x))) * smoothstep(40.0, 70.0, q.z);
    gloss += 0.25 * wear;
  }
  else if (id < 6.5) { float t = qo.y * 0.11 + uTime * 1.3 * (emis > 0.5 ? 1.0 : -1.0); float lace = 1.0 - smoothstep(0.02, 0.05, abs(fract(t) - 0.5));
    alb *= 0.75 + 0.35 * lwNoise(vec3(q.x * 3.0, fract(t) * 9.0, q.z * 3.0)); alb = mix(alb, vec3(0.42, 0.36, 0.26), lace); emis = 0.0; }
  else if (id < 7.5) { vec2 p = (q.xz + q.yy * 0.5) * 1.1; vec2 d = abs(fract(vec2(p.x + p.y, p.x - p.y)) - 0.5); float stud = smoothstep(0.12, 0.2, min(d.x, d.y) + 0.25 * max(d.x, d.y));
    alb *= mix(1.25, 0.8, stud) * (0.8 + 0.3 * lwNoise(q * 0.5)); gloss += 0.2 * (1.0 - stud); }
  else if (id < 8.5) { float r = length(qo.xz); float a = atan(qo.z, abs(qo.x) + abs(qo.z) < 1e-5 ? 1e-5 : qo.x) + uTime * 2.4;
    float st = lwNoise(vec3(cos(a) * 3.0, sin(a) * 3.0, r * 1.6)); float wet = smoothstep(0.25, 0.45, r) * (1.0 - smoothstep(0.86, 0.97, r));
    alb = mix(alb, vec3(0.56, 0.1, 0.055) * (0.55 + 0.9 * st), wet * step(0.0, n.y - 0.5)); gloss = mix(gloss, 0.85, wet); }
  else {      // the tunnel's black-painted iron plate: seams, a row of rivets down each seam, the paint rubbed and streaked
    float ua = q.x / 3.3, ub = (abs(n.y) > 0.6 ? q.z : q.y) / 4.1;
    vec2 f = abs(fract(vec2(ua, ub)) - 0.5);
    float seam = max(smoothstep(0.478, 0.494, f.x), smoothstep(0.482, 0.495, f.y));
    vec2 r1 = vec2((0.5 - f.x) * 3.3 - 0.42, (fract(ub * 6.0) - 0.5) * 0.683), r2 = vec2((0.5 - f.y) * 4.1 - 0.42, (fract(ua * 5.0) - 0.5) * 0.66);
    float stud = 1.0 - smoothstep(0.1, 0.19, min(length(r1), length(r2)));
    float wear = lwNoise(vec3(q.x * 0.12, q.y * 0.9, q.z * 0.9)), pl = lwHash(vec3(floor(ua), floor(ub), 11.0));
    alb *= (0.5 + 0.5 * wear + 0.3 * pl) * (1.0 - 0.7 * seam);
    alb = mix(alb, alb * 1.3 + 0.004, stud); gloss = clamp(gloss + 0.35 * stud + 0.2 * (wear - 0.5), 0.05, 0.95);
  }
  return alb;
}
vec3 lwLight(vec3 wp, vec3 n, vec3 V, vec3 alb, float gloss, float metal){
  float up = n.y * 0.5 + 0.5;
  float ao = mix(0.42, 1.0, smoothstep(-2.0, 30.0, wp.y)) * mix(0.3, 1.0, max(smoothstep(21.0, 28.0, length(wp.xz)), 1.0 - smoothstep(17.0, 21.0, wp.y)));
  float dw = min(min(wp.x + 160.0, 80.0 - wp.x), min(wp.z + 150.0, 230.0 - wp.z));
  ao *= mix(1.0, mix(0.5, 1.0, smoothstep(0.0, 34.0, dw)), smoothstep(0.3, 0.7, n.y));
  float tun = smoothstep(79.6, 82.6, wp.x); ao *= 1.0 - 0.97 * tun;
  vec3 lit = uTopCol * uTopGain * (0.16 + 0.84 * pow(max(up, 0.0), 1.3)) * ao + uShadowCol * 0.035 * (1.0 - tun);
  float r = max(length(wp.xz), 1e-3); vec3 rad = vec3(wp.x, 0.0, wp.z) / r;
  float bm = lwBeam(wp) * uBeamGain * 1.5;      // where a blade lands it is a bright patch
  // under the warm lights (the blades, the lanterns, the gas) a surface gives back a browner, less saturated colour than
  // its own, so lit brick stays brown-red and never burns orange
  float lum = dot(alb, vec3(0.3, 0.5, 0.2)); vec3 albW = mix(alb, lum * vec3(1.2, 0.94, 0.74), 0.4);
  vec3 gasL = mix(uJetCol, vec3(1.0, 0.86, 0.68), 0.65);      // gaslight on a surface is pale straw, whatever the colour of the flame's own glow
  vec3 warm = uBeamCol * bm * clamp(dot(n, -rad) * 0.62 + 0.38, 0.0, 1.0);
  vec3 Lf = vec3(0.0, 47.0, 0.0) - wp; float d2 = dot(Lf, Lf); Lf /= sqrt(max(d2, 1e-3));
  float fl = (1.0 - smoothstep(27.0, 30.5, r)) * 520.0 / (d2 + 70.0); fl = 1.25 * (1.0 - exp(-fl / 1.25)) * uFlameGain;
  float fw = clamp(dot(n, Lf) * 0.86 + 0.14, 0.0, 1.0); lit += uFlameCol * fl * fw * fw * (1.0 - 0.7 * metal);
  if (uJet > 0.001) {
    float zj = clamp(floor((wp.z + 135.0) / 60.0 + 0.5), 0.0, 5.0) * 60.0 - 135.0;
    vec3 a = vec3(-156.0, 36.0, zj) - wp; float zk = clamp(floor((wp.z + 181.5) / 61.0 + 0.5), 1.0, 6.0) * 61.0 - 181.5; vec3 b = vec3(76.0, 36.0, zk) - wp;
    float da = dot(a, a), db = dot(b, b);
    warm += gasL * uJet * 0.42 * (600.0 / (da + 90.0) * clamp(dot(n, a / sqrt(max(da, 1e-3))) * 0.7 + 0.3, 0.0, 1.0) + 600.0 / (db + 90.0) * clamp(dot(n, b / sqrt(max(db, 1e-3))) * 0.7 + 0.3, 0.0, 1.0)) * (1.0 - tun);
  }
  vec3 col = (alb * lit + albW * warm) * (1.0 - 0.55 * metal);
  col += (albW * 0.55 + 0.06) * lwRainbow(wp) * clamp(dot(n, -rad) * 0.45 + 0.55 + 0.4 * n.y, 0.25, 1.0) * mix(0.6, 1.0, abs(n.y)) * (1.0 - tun);
  // the two signal lanterns hung in the upper corners of the hatch
  vec3 hv = vec3(uHatch.x + uLan.x, uHatch.y + uLan.y, uHatch.z + (wp.z > uHatch.z ? uLan.z : -uLan.z)) - wp; float hd = dot(hv, hv); hv /= sqrt(max(hd, 1e-3));
  float hs = wp.z > uHatch.z ? 1.7 : 0.0, hf = 0.86 + 0.09 * sin(uTime * 9.1 + hs) + 0.05 * sin(uTime * 23.7 + hs * 2.3);      // the flames breathe
  vec3 lanC = gasL * hf * 380.0 / (hd + 60.0) * (1.0 - 0.5 * tun);      // (inside the mouth the black plate takes less of it)
  // (inside the mouth the iron stays dark: the lanterns give it a lit edge and a highlight, and the portal's cool light carries the depth)
  col += albW * lanC * clamp(dot(n, hv) * 0.8 + 0.2, 0.0, 1.0) * (1.0 - 0.5 * metal) * (1.0 - 0.72 * tun);
  // and the pair hung inside the tunnel (uLan2: metres in, up, sideways off its centre line, which runs skew to the wall)
  float zc2 = uHatch.z - uLan2.x * uTun, s2 = wp.z > uHatch.z - max(wp.x - uHatch.x, 0.0) * uTun ? 1.0 : -1.0;
  vec3 hv2 = vec3(uHatch.x + uLan2.x, uHatch.y + uLan2.y, zc2 + s2 * uLan2.z) - wp; float hd2 = dot(hv2, hv2); hv2 /= sqrt(max(hd2, 1e-3));
  vec3 lanC2 = gasL * (0.86 + 0.09 * sin(uTime * 8.3 + s2) + 0.05 * sin(uTime * 21.1 + s2 * 2.3)) * 75.0 / (hd2 + 90.0) * tun;
  col += albW * lanC2 * clamp(dot(n, hv2) * 0.8 + 0.2, 0.0, 1.0) * (1.0 - 0.5 * metal) * 0.3;
  vec3 R = reflect(-V, n); vec3 f0 = mix(vec3(0.045), alb, metal);
  float sky = 0.3 + 0.7 * smoothstep(-0.2, 0.85, R.y), rl = max(dot(R, Lf), 0.0);
  sky = mix(sky, 0.03 + 0.5 * smoothstep(0.1, 0.95, R.y), (1.0 - smoothstep(24.0, 30.0, r)) * metal);
  col += f0 * gloss * (uTopCol * uTopGain * sky * ao * (0.3 + 1.5 * metal)
       + uBeamCol * bm * 2.2 * pow(max(dot(R, -rad), 0.0), 6.0 + 40.0 * gloss)
       + uFlameCol * fl * (3.0 * pow(rl, 8.0 + 60.0 * gloss) + 0.2 * metal * rl * rl * rl * rl)
       + lanC * 2.2 * (1.0 - 0.75 * tun) * pow(max(dot(R, hv), 0.0), 8.0 + 50.0 * gloss) + lanC2 * 0.7 * pow(max(dot(R, hv2), 0.0), 8.0 + 50.0 * gloss));
  // turned brass and bronze by the flame: dark where it faces the eye, bright round its limb, a broad warm gleam on the side toward the fire
  float rimM = 1.0 - max(dot(n, V), 0.0), glM = max(dot(n, Lf), 0.0);
  col += f0 * metal * uFlameCol * fl * (0.9 * rimM * rimM * rimM + 0.75 * glM * glM * glM) * (0.4 + 0.6 * gloss);
  // the portal's own cool light down the tunnel: on the plate and, at a glancing angle, mirrored along walls, floor and ribs
  vec3 pv = uPortalPos - wp; float pd = max(length(pv), 1e-3); pv /= pd;
  float pk = tun * 84.0 / (pd + 10.0), fr = 1.0 - max(dot(n, V), 0.0); fr *= fr; fr *= fr;
  col += uPortalCol * pk * ((alb * 1.7 + 0.008) * clamp(dot(n, pv) * 0.56 + 0.44, 0.0, 1.0) * (1.0 - 0.5 * metal)
       + (f0 + (1.0 - f0) * fr * 0.6) * gloss * 1.4 * pow(max(dot(R, pv), 0.0), 3.0 + 16.0 * gloss));
  return col;
}
`;
const SURF_VERT = /* glsl */`
attribute vec4 surf;
#ifdef LW_SPIN
attribute vec2 aSpin;
#endif
varying vec3 vW, vN, vC, vO; varying vec4 vS;
void main(){
  vec3 p = position, n = normal;
  #ifdef LW_SPIN
    float a = uTime * aSpin.x + aSpin.y, c = cos(a), s = sin(a); p.xz = vec2(c * p.x + s * p.z, -s * p.x + c * p.z); n.xz = vec2(c * n.x + s * n.z, -s * n.x + c * n.z);
  #endif
  vO = position; vS = surf; vC = color;
  #ifdef USE_INSTANCING_COLOR
    vC *= instanceColor;
  #endif
  #ifdef USE_INSTANCING
    mat4 m = modelMatrix * instanceMatrix;
  #else
    mat4 m = modelMatrix;
  #endif
  vec4 w = m * vec4(p, 1.0);
  float sw = (1.0 - surf.w) * uSway;
  w.xz += sw * vec2(sin(uTime * 1.3 + w.y * 0.21 + w.z * 0.13), cos(uTime * 1.07 + w.x * 0.17 + w.y * 0.19));
  vW = w.xyz; vN = normalize(mat3(m) * n);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SURF_FRAG = /* glsl */`
varying vec3 vW, vN, vC, vO; varying vec4 vS;
void main(){
  vec3 n = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  if (!gl_FrontFacing) n = -n;
  float id = floor(vS.x + 0.001), gloss = clamp((fract(vS.x) - 0.02) / 0.95, 0.0, 1.0), metal = vS.y, emis = vS.z;
  vec3 col;
  if (id > 20.5) col = lwWindow(vW);
  else if (id > 19.5) col = lwRoof(vW);
  else {
    #ifdef LW_OBJ
      vec3 q = vO; vec3 qn = n;
    #else
      vec3 q = vW; vec3 qn = n;
    #endif
    vec3 alb = lwDetail(id, q, vO, qn, vC, gloss, emis);
    col = lwLight(vW, n, V, alb, gloss, metal) + alb * emis;
  }
  gl_FragColor = vec4(lwFog(col, vW), 1.0);
}`;

// ---- glass: opaque and shaded, and never grey. Every bar of glass (a prism ring's 15 degree segment, a step of a
// bull's-eye panel) is a near-black body holding a squeezed, upside-down strip of the hall: one narrow band of the
// roof with its glazing bars, a dim strip of brick under it, then the black floor. A hairline of sea-green runs along
// its two long edges, a dark arris inside that, and one hard glint of the flame slides along it as the lens turns.
// uv.y = s, the place across the bar's section (0..1); aK = 0 a bar face, 1 a prism's two inner faces (arris at
// s 0.4), 2 an end cap, 3 a step's riser (glass seen edge-on), 4 the bull's-eye boss (uv.y = 0 centre .. 1 rim),
// 5 the boss seen from behind (a flat pane, uv 0..1 over it)
const GLASS_VERT = /* glsl */`
attribute float aK;
#ifdef LW_PRISM
attribute vec4 aRing; attribute float aSt;
#endif
varying vec3 vW, vN, vP; varying vec2 vUv; varying float vK, vG;
void main(){
  vP = position; vG = 0.0;
  #ifdef LW_PRISM
    float cl = cos(aRing.z), sl = sin(aRing.z);
    vec2 sec = vec2(position.z, position.y) * aRing.w; sec = vec2(cl * sec.x - sl * sec.y, sl * sec.x + cl * sec.y);
    vec2 ns = vec2(normal.z, normal.y); ns = vec2(cl * ns.x - sl * ns.y, sl * ns.x + cl * ns.y);
    float b = (aSt + 0.5 + position.x * 0.992) * LW_PITCH;
    vec3 er = vec3(sin(b), 0.0, cos(b)), et = vec3(cos(b), 0.0, -sin(b));
    vec3 p = er * (aRing.x + sec.x) + vec3(0.0, aRing.y + sec.y, 0.0);
    vec3 n = er * ns.x + vec3(0.0, ns.y, 0.0) + et * normal.x;
    vec4 w = modelMatrix * vec4(p, 1.0); vN = normalize(mat3(modelMatrix) * n);
  #else
    #ifdef USE_INSTANCING
      mat4 m = modelMatrix * instanceMatrix;
    #else
      mat4 m = modelMatrix;
    #endif
    vec4 w = m * vec4(position, 1.0); vN = normalize(mat3(m) * normal);
    vG = dot(normalize(cameraPosition - m[3].xyz), normalize(m[0].xyz));      // how far to one side of this piece the eye stands (the same at every corner)
  #endif
  vW = w.xyz; vUv = uv; vK = aK;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GLASS_FRAG = /* glsl */`
varying vec3 vW, vN, vP; varying vec2 vUv; varying float vK, vG;
// the hall as a piece of glass holds it: pewter roof with its glazing bars above, red brick and the north windows round
// the horizon (with the gold patches of the blades standing on the walls), the dark floor below
vec3 lwEnv2(vec3 d, float wk, float bk){
  float az = lwBearing(d.xz), up = d.y / max(length(d), 1e-3);
  float bars = smoothstep(0.06, 0.2, abs(fract(az * 7.0) - 0.5));
  vec3 roof = uRoofCol * uTopGain * mix(vec3(1.0), vec3(0.34, 0.28, 0.19), uBlind) * (0.5 + 0.38 * bars) * (0.72 + 0.28 * smoothstep(0.2, 0.9, up));
  float win = smoothstep(0.55, 0.8, -cos(az)) * smoothstep(0.1, 0.25, abs(fract(az * 5.0) - 0.5));
  vec3 wall = vec3(0.30, 0.085, 0.052) * wk * uTopCol * uTopGain * (0.6 + 0.4 * sin(az * 9.0) * sin(az * 23.0 + 1.3));
  wall = mix(wall, uRoofCol * uTopGain * 0.5, win * (1.0 - 0.6 * uBlind));
  float sx = (fract((az - uLensAng) / LW_PITCH) - 0.5) * 5.0;
  wall += uBeamCol * bk * exp(-sx * sx) + uJetCol * uJet * 1.4 * pow(0.5 + 0.5 * cos(az * 12.0), 60.0);
  vec3 ground = uShadowCol * 0.05 + vec3(0.05, 0.036, 0.026) * uTopCol * uTopGain;
  return mix(mix(ground, wall, smoothstep(-0.2, -0.05, up)), roof, smoothstep(0.08, 0.24, up));
}
vec3 lwEnv(vec3 d){ return lwEnv2(d, 1.0, 0.16); }
void main(){
  vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN); if (dot(N, V) < 0.0) N = -N;
  float s = vK > 4.5 ? length(vUv * 2.0 - 1.0) : vUv.y, fw = min(fwidth(s), 1.0);
  vec3 px = dFdx(vW), py = dFdy(vW); float sx = dFdx(s), sy = dFdy(s);
  float rr = max(length(vW.xz), 1e-3); vec3 rad = vec3(vW.x, 0.0, vW.z) / rr;
  vec3 Lf = vec3(0.0, 47.0, 0.0) - vW; float dl = max(length(Lf), 1e-3); Lf /= dl;
  float dist = distance(vW, cameraPosition);
  float inner = smoothstep(0.05, 0.3, dot(N, Lf));          // a face the flame shines on: seen from the hollow, or through a gap
  float camIn = 1.0 - smoothstep(24.5, 27.5, length(cameraPosition.xz));      // the eye is inside the optic
  vec2 vh = V.xz; float vl = length(vh); vh = vl > 1e-3 ? vh / vl : rad.xz;
  float wb = lwBearing(vW.xz), fwb = min(fwidth(wb), 0.2);
  #ifdef LW_STOCK
    float xp = 0.0, stM = 0.0, stI = 0.0, bayDim = 0.0; inner = 0.0; camIn = 0.0;
  #else
    vec4 st = lwStation(vW); float xp = clamp(st.x / (rr * LW_PITCH), -0.6, 0.6), stM = st.z, stI = st.w;
    // the glass beside the empty bay stands in its own shadow as we leave by it: dark standards, not walls of lit glass
    float bayDim = uBayDim * inner * (1.0 - smoothstep(1.0, 6.0, abs(mod(stI + 11.5, 24.0) - 12.0)));
  #endif
  // the axis across the bar (the way s grows), and how far round it the eye stands
  #ifdef LW_PRISM
    vec3 Ac = vec3(0.0, 1.0, 0.0) - N * N.y; float al = length(Ac); Ac = al > 0.05 ? Ac / al : vec3(0.0, 1.0, 0.0);
    float sh = vK < 0.5 ? dot(V, Ac) : V.y;
  #else
    float ga = dot(px, px), gb = dot(px, py), gc = dot(py, py), det = ga * gc - gb * gb;
    vec3 Ac = det > 1e-12 ? px * ((sx * gc - sy * gb) / det) + py * ((sy * ga - sx * gb) / det) : vec3(0.0, 1.0, 0.0);
    float al = length(Ac); Ac = al > 1e-5 ? Ac / al : vec3(0.0, 1.0, 0.0);
    float sh = dot(V, Ac);
  #endif
  float c = clamp(0.56 - 0.4 * sh, 0.36, 0.86);
  // GLASS. A bar is a little cylinder lens: through it the far side of the hall is seen flipped across the bar and
  // squeezed into its width (so every bar and every step holds the roof, a line of brick and the floor), its face
  // mirrors the hall at a glancing angle, and thick glass is a deep bottle colour of its own.
  float sq = s - 0.5, bendK = (vK > 0.5 && vK < 1.5) ? 1.5 : 1.15;
  vec3 Nc = normalize(N + Ac * sq * bendK);
  float f1 = 1.0 - max(dot(Nc, V), 0.0), f5 = f1 * f1; f5 *= f5 * f1; float F = 0.05 + 0.95 * f5;
  vec3 side = vec3(-V.z, 0.0, V.x) * (xp * 1.7);
  vec3 Td = -V + side - Ac * sq * 2.5;
  vec3 Rc = reflect(-V, Nc);
  vec3 black = uShadowCol * 0.04 + uRimCol * 0.004;
  vec3 deep = black + uRimCol * uTopGain * (0.010 + 0.05 * f1 * f1);
  vec3 thru = lwEnv(Td) * uGlassTint;
  if (inner > 0.01) {      // from within, a ring holds a soft band of pewter roof over red brick (no black floor), the bright roof held down
    vec3 Ti = -V + side - Ac * sq * 1.3 + vec3(0.0, 0.1, 0.0); float til = max(length(Ti.xz), 1e-3); Ti.y = max(Ti.y, -0.03 * til);
    vec3 ti = lwEnv(Ti) * uGlassTint; float tl = dot(ti, vec3(0.3, 0.5, 0.2));
    ti = ti * 1.9 / (1.0 + 3.0 * tl) * mix(vec3(1.45, 0.95, 0.85), vec3(1.0), smoothstep(0.06, 0.26, Ti.y / til)) + uFlameCol * uFlameGain * 0.015;
    thru = mix(thru, ti, inner);
  }
  vec3 body = deep + thru * (0.17 + 0.4 * inner) * (1.0 - F) + lwEnv(Rc) * F * (0.48 + 0.02 * inner);
  // thick glass has a colour of its own: sea-green, graded across each bar from a deep edge to a pale one (the pale side
  // slides with the eye), so a panel reads as stepped glass and not as stripes
  float ramp = smoothstep(-0.1, 1.1, s + 0.45 * sh);
  body += (uRimCol * (0.04 + 0.3 * ramp * ramp) + uRoofCol * 0.04 * ramp * ramp * ramp) * uTopGain * (1.0 - 0.6 * uBlind) * (1.0 - inner);
  body += uRoofCol * uTopGain * (1.0 - 0.6 * uBlind) * 0.28 * pow(max(Rc.y, 0.0), 10.0) * (1.0 - inner);      // the ridge light, a soft band to a bar
  vec3 pd = uPortalPos - vW; vec2 ph = pd.xz; float pl = length(ph); ph = pl > 1e-3 ? ph / pl : vec2(1.0, 0.0);
  vec2 hl = Td.xz; float hll = length(hl); hl = hll > 1e-3 ? hl / hll : -vh; float tdy = Td.y / max(length(Td), 1e-3);
  body += uPortalCol * smoothstep(0.988, 0.9985, dot(hl, ph)) * exp(-tdy * tdy * 90.0) * 2.4;
  float ed = min(s, 1.0 - s);
  body *= mix(0.45 + 0.55 * smoothstep(0.0, 0.3 + fw, ed), 1.0, 0.62 * inner);     // each bar deepens toward its two edges
  if (vK > 0.5 && vK < 1.5) body *= mix(0.6 + 0.4 * smoothstep(0.0, 0.12 + fw, abs(s - 0.4)), 1.0, 0.4 * inner);    // and the ridge of a prism seen from within
  // the edges: a hairline of sea-green that the light splits into a thread of spectrum, sliding as the lens turns
  float hair = (1.0 - smoothstep(0.02 + 0.5 * fw, 0.042 + fw, ed)) * 0.03 / (0.03 + fw);
  float fringe = (1.0 - smoothstep(0.03, 0.2 + fw, ed)) * 0.42 * (1.0 - smoothstep(0.25, 0.7, fw)) * (1.0 - 0.9 * inner);
  vec3 rimC = (uRimCol * 0.55 + uRimCol * (0.25 + uRimCol.g) * 0.42) * (0.56 * uTopGain + 0.14 * uFlameGain * inner);
  // one glint of the flame to a bar: it stands where the eye's line meets the flame's, shifted by the panel's
  // figure, so it slides along the bar as the lens turns; the bars level with the eye hold the hardest ones
  float a = rad.x * vh.y - rad.z * vh.x;
  float farK = smoothstep(30.0, 90.0, dist);
  float f = a + 0.6 * xp, wa = 0.034 + dist * 0.0007;
  float sg = clamp(mix(c + 0.2, c - 0.36, smoothstep(0.55, 0.65, c)), 0.12, 0.88), ws = max(0.05, fw * 0.8);
  float dy = (vW.y - cameraPosition.y) / 9.0;
  float gl = exp(-f * f / (wa * wa) - a * a * 9.0 * farK) * exp(-(s - sg) * (s - sg) / (ws * ws)) * mix(0.22 + 0.78 * exp(-dy * dy), 0.8, farK) * (0.05 / ws) * (1.0 - inner);
  // the flame's own light on the faces that look at it: a soft warm sheen, and its mirror image
  vec3 Nb = vK > 4.5 ? normalize(N - Ac * s * 0.8) : normalize(N + Ac * (s - 0.5) * 0.9); vec3 Rr = reflect(-V, Nb); float rl = max(dot(Rr, Lf), 0.0);
  float sheen = inner * (0.035 * pow(rl, 10.0) + 4.0 * pow(rl, 220.0) + 0.012 * max(dot(N, Lf), 0.0)) * (1.0 - 0.85 * bayDim);
  // far off, a bar is thinner than a pixel: use its mean
  float lod = smoothstep(0.14, 0.55, fw);
  float n1 = 1.0 - max(dot(N, V), 0.0), n5 = n1 * n1; n5 *= n5 * n1;
  vec3 mean = deep + (lwEnv(-V + side + Ac * 0.8) + lwEnv(-V + side) + lwEnv(-V + side - Ac * 0.8)) * uGlassTint * ((0.15 + 0.3 * inner) / 3.0) + lwEnv(reflect(-V, N)) * (0.05 + 0.95 * n5) * 0.7 + (uRoofCol * 0.03 + uRimCol * 0.085) * uTopGain * (1.0 - 0.6 * uBlind) * (1.0 - inner);
  vec3 col = mix(mix(mix(body, body * 0.6 + rimC * 0.5, fringe), rimC, hair), mean, lod * (1.0 - inner * (1.0 - smoothstep(0.3, 0.8, fw))));
  if (vK > 3.5) {             // the boss: a small lens; the hall hangs upside down in it
    vec3 Nd = vK > 4.5 ? Nb : N;
    vec3 tilt = vK > 4.5 ? Ac * s * 0.9 : Nd - V * dot(Nd, V);
    vec3 Tb = -V + side - tilt * 2.4;
    float nd1 = 1.0 - max(dot(Nd, V), 0.0), nd5 = nd1 * nd1; nd5 *= nd5 * nd1;
    col = deep * (1.0 + 2.0 * (1.0 - s)) + lwEnv(Tb) * uGlassTint * (0.5 + 0.3 * inner) * (1.0 - smoothstep(0.55, 1.0, s)) + lwEnv(reflect(-V, Nd)) * (0.04 + 0.96 * nd5);
    col = mix(col, rimC, smoothstep(0.9, 0.95, s) * (1.0 - smoothstep(0.97, 1.03, s)) * (1.0 - lod));
    col += uRoofCol * uTopGain * 0.9 * pow(max(reflect(-V, Nd).y, 0.0), 24.0) * (1.0 - smoothstep(0.5, 0.8, s)) * (1.0 - inner);
    gl = exp(-f * f / (wa * wa)) * (1.0 - smoothstep(0.08, 0.34, s)) * exp(-dy * dy) * (1.0 - inner) * 0.6;
  } else if (vK > 2.5) {      // risers: glass seen edge-on, deep at the root, a pale lip, the hall mirrored at a glancing angle
    float lip = smoothstep(0.55, 1.0, s);
    col = black + rimC * (0.025 + 0.13 * lip * lip) * (1.0 - 0.5 * inner) + uRimCol * uTopGain * (1.0 - 0.6 * uBlind) * (0.045 + 0.13 * lip) * (1.0 - inner) + uRimCol * 0.02 * uFlameGain * inner * (0.3 + 0.7 * lip) + lwEnv(reflect(-V, N)) * (0.03 + 0.6 * n5)
        + lwEnv(-V + side) * uGlassTint * 0.26 * inner;      // from within a riser is glass too, not a black line
  }
  else if (vK > 1.5) col = rimC * 0.1 + black;
  #ifndef LW_STOCK
  float inK = max(camIn, 0.85 * inner);
  // close to, from outside, a bar holds the hall in the same way (nearO): the close sweep passes glass, not paint
  float nearO = 0.0;      // (from outside the bars keep their sea-green body at every distance: blind viewers chose it over clear grey glass at close range)
  if (inK > 0.001 || nearO > 0.001) {
    // FROM WITHIN the optic is a cool room walled in clear, finely stepped glass. Every facet (each of a prism ring's two
    // inner faces, each step of a bull's-eye panel) is a small lens that holds the hall once, squeezed and upside down:
    // the pewter roof as a pale silver body that grades away from the facet's edge, the red brick as one thin line with
    // the gold of a blade sliding along it, then the dark floor. Green is an edge colour only: a rim along a bar's free
    // edges. The flame gives the glass one hard glint to a bar, so it stays the one gold thing in the room.
    float isP = (vK > 0.5 && vK < 1.5) ? 1.0 : 0.0;
    float tt, faceW, rimD;      // tt: 0..1 across one facet; faceW: the facet's share of s; rimD: how far from a free edge
    float stepK = 1.0;      // a panel's step has one free edge and takes a thinner rim than a prism bar
    if (isP > 0.5) { if (s > 0.4) { tt = (s - 0.4) / 0.6; faceW = 0.6; } else { tt = s / 0.4; faceW = 0.4; } rimD = min(s, 1.0 - s) * 2.0; stepK = 0.0; }
    else if (vK > 4.5) { tt = clamp(s * 0.75, 0.0, 1.0); faceW = 1.0; rimD = 1.0; }
    else { tt = s; faceW = 1.0; rimD = s; }
    float wI = fw / faceW, lodI = smoothstep(0.1, 0.4, wI);      // a pixel's width across the facet
    float tv = mix(tt * 1.15 + 0.05 + 0.1 * sh, tt + 0.2 * sh - 0.04, inK);      // the picture slides in the facet as the eye moves
    vec2 hh = -V.xz + vec2(-V.z, V.x) * (xp * 0.9); float hhl = length(hh); hh = hhl > 1e-3 ? hh / hhl : rad.xz;
    vec3 roofI = lwEnv2(vec3(hh.x * 0.8, 0.6, hh.y * 0.8), 2.2, 0.3), wallI = lwEnv2(vec3(hh.x, -0.02, hh.y), 2.2, 0.3);
    roofI = roofI / (1.0 + 0.9 * dot(roofI, vec3(0.3, 0.5, 0.2))) * (vec3(0.52, 0.92, 0.80) + uRimCol * 0.34);      // thick glass: the roof light comes through it sea-green
    wallI = wallI / (1.0 + 0.6 * dot(wallI, vec3(0.3, 0.5, 0.2))) * (1.3 - 0.3 * inK) * vec3(1.18, 0.82, 0.74);      // (seen through from outside the brick is in the open light)
    float wrapL = clamp(dot(N, Lf) * 0.55 + 0.45, 0.0, 1.0);
    vec3 floorI = uShadowCol * 0.07 + uRimCol * mix(0.045, 0.07, inK) * (uTopGain + 0.2 * uFlameGain);      // the arris: deep green, never black
    // across the facet: bright at its edge, greying toward the brick line (the roof seen lower and lower), with the faint
    // ladder of the glazing bars; then the brick; then the floor
    float gradeI = mix(1.05, 0.5, smoothstep(0.0, 0.6, tv)) * (0.9 + 0.1 * smoothstep(0.3 - wI, 0.34 + wI, abs(fract(tv * 5.0 + 0.5) - 0.5) * 2.0));
    float a1 = smoothstep(0.57 - wI, 0.62 + wI, tv), a2 = smoothstep(0.71 - wI, 0.8 + wI, tv);
    vec3 gI = mix(mix(roofI * gradeI, wallI, a1), floorI, a2) * (0.72 + 0.28 * wrapL);
    vec3 meanI = (roofI * 0.46 + wallI * 0.2 + floorI * 0.2) * (0.72 + 0.28 * wrapL) + uRimCol * 0.03 * uTopGain;
    gI = mix(gI, meanI, lodI);
    // the green rim along a bar's free edges, and inside it a hairline of shadow where bar meets bar
    // (from outside it is a hairline: its width is held to the edge band however few pixels the facet has, and it thins instead of spreading)
    float rimI = (1.0 - smoothstep(mix(0.015, 0.05, inK) + 0.5 * wI, mix(0.05, 0.15 - 0.06 * stepK, inK) + wI, rimD)) * (1.0 - lodI) * mix(0.05 / (0.05 + wI), 1.0, inK);
    gI = mix(gI, uRimCol * (0.95 * uTopGain + 0.15 * uFlameGain) + uRoofCol * 0.06 * uTopGain, rimI * 0.9);
    gI *= mix(1.0, 0.45 + 0.55 * smoothstep(0.0, 0.03 + wI, rimD), 1.0 - lodI);
    gI = mix(gI, gI * (uRimCol * 1.5 + 0.25), (0.5 - 0.25 * stepK) * inK * (1.0 - smoothstep(0.0, 0.32 - 0.1 * stepK, rimD)) * (1.0 - lodI));      // the green runs a little way in from the rim
    gI += uFlameCol * uFlameGain * 0.012 * wrapL;
    // one hard glint of the flame to a bar: each ring carries it at a bearing of its own on the wall beyond the lamp, and
    // they slide along the bars as the lens turns
    if (isP > 0.5) {
      float rid = floor(vW.y / 1.36), gh = lwHash(vec3(rid, 3.0, 7.0));
      float gd = wb - lwBearing(-cameraPosition.xz) - (gh - 0.5) * 2.6 - uLensAng * (0.6 + 0.8 * gh);
      gd = (fract(gd / 6.2832 + 0.5) - 0.5) * 6.2832;
      float gw = 0.011 + 0.4 * fwb, gt = (tt - 0.22) / (0.1 + wI);
      gI += uFlameCol * vec3(1.0, 0.86, 0.55) * uFlameGain * 2.6 * exp(-gd * gd / (gw * gw) - gt * gt) * min(1.0, 0.011 / gw * 2.0) * (1.0 - 0.8 * lodI) * inK;
    }
    float oK = nearO * (vK < 1.5 ? 0.94 : (vK > 2.5 && vK < 3.5 ? 0.85 : 0.0));
    vec3 colO = mix(col, vK < 1.5 ? gI * vec3(0.9, 0.98, 0.97) * 0.95 : meanI * 0.42 + uRimCol * 0.02 * uTopGain, oK);
    if (vK > 4.5) {          // the boss pane holds the flame, upright and gold
      vec2 bq = vUv * 2.0 - 1.0; float fim = exp(-bq.x * bq.x * 12.0 * (1.0 + 1.6 * max(bq.y + 0.2, 0.0)) - (bq.y + 0.05) * (bq.y + 0.05) * 5.0);
      gI = mix(gI, col, 0.3) * (0.55 + 0.45 * smoothstep(0.2, 1.0, s)) + uFlameCol * vec3(1.0, 0.8, 0.46) * uFlameGain * (2.3 * fim + 0.1 * exp(-dot(bq, bq) * 1.5)) * (1.0 - 0.85 * bayDim);
    }
    else if (vK > 3.5) gI = mix(gI, col, 0.6);
    else if (vK > 1.5) gI = mix(gI * 0.7, uRimCol * 0.1 * uTopGain, 0.45);      // risers and end caps: glass seen edge-on, deeper and greener
    col = mix(colO, gI, inK);
  }
  #endif
  col *= 1.0 - 0.8 * bayDim;
  #ifdef LW_STOCK
    // glass in stock is dark clear glass: the hall dim in it, a pale line where its ground edge catches the roof, and
    // (below) one glint; no bright stripes, and green only as a thread on that edge
    float pe = max(abs(vP.x) / 3.32, abs(vP.y) / 11.75), edge = smoothstep(0.955, 0.972, pe) * (1.0 - smoothstep(0.985, 1.0, pe)) * step(0.2, vP.z) * step(2.8, max(abs(vP.x), abs(vP.y)));
    vec3 clear = black + lwEnv(Td) * uGlassTint * 0.09 * (1.0 - F) + lwEnv(Rc) * F * 0.8 + uRimCol * uTopGain * 0.006;
    clear *= 0.75 + 0.25 * smoothstep(0.02, 0.1 + fw, ed);
    col = mix(clear, col, 0.16) + (uRoofCol * 0.13 + uRimCol * 0.05) * uTopGain * edge * (1.0 - lod);
  #endif
  // sparkle: now and then one facet in fourteen throws the roof straight at the eye for an instant, white-gold
  #ifdef LW_STOCK
    vec2 cp = vec2(vW.z * 0.8 + vW.x * 0.31, vW.y * 0.8); float swing = vh.x * 23.0 + vh.y * 17.0 + V.y * 9.0 + uTime * 0.7;
  #else
    vec2 cp = vec2((wb - uLensAng) * 24.0, vW.y * 0.75); float swing = wb * 31.0 + lwBearing(vh) * 17.0 + V.y * 9.0;
  #endif
  vec2 ci = floor(cp), cf = fract(cp) - 0.5; float hs = lwHash(vec3(ci, 3.0));
  float fwc = min(max(fwidth(cp.x), fwidth(cp.y)), 1.0);
  float tw = max(sin(hs * 6.2832 * 7.0 + swing), 0.0); tw *= tw; tw *= tw; tw *= tw; tw *= tw; tw *= tw;
  float spark = tw * step(0.93, hs) * exp(-dot(cf, cf) / (0.012 + fwc * fwc * 0.6)) * min(1.0, 0.3 / max(fwc, 0.03)) * (1.0 - inner) * uSpark;
  vec3 sparkC = uRoofCol * uTopGain * (1.0 - 0.5 * uBlind) * 0.3 + uFlameCol * vec3(1.0, 0.9, 0.68) * 0.5;      // roof-white warmed by the flame: never a colour of its own (the brief forbids spectra)
  vec3 emis = vec3(0.0);
  #ifdef LW_STOCK
    // glass in stock (racks, benches, the cradle): it catches the blade as it slides over, and the spectra
    float bm = lwBeam(vW) * uBeamGain;
    col += uBeamCol * bm * (0.05 + 0.4 * hair + 0.5 * edge + 0.2 * smoothstep(0.05, 0.4, tdy) + 0.5 * pow(max(dot(reflect(-V, N), -rad), 0.0), 24.0));
    col += lwRainbow(vW) * (0.05 + 0.3 * hair + 0.3 * edge);
    // one glint to a panel: the roof caught at one place on its top edge, sliding along it as the eye moves
    float gx = (vP.x - 2.4 * vG) / 0.3;
    emis += uRoofCol * uTopGain * (1.0 - 0.6 * uBlind) * 1.5 * edge * step(10.5, vP.y) * exp(-gx * gx) * (1.0 - 0.7 * lod);
    emis += sparkC * spark * (0.5 + 2.0 * min(bm, 1.5));
  #else
    emis += sparkC * spark * 3.2;
    // THE LIT LENS, seen from outside. Light that leaves the glass is added after the fog, so the lamp shows through dust.
    float outK = 1.0 - inner;
    vec2 ce = cameraPosition.xz; float cr = length(ce); vec2 e2 = cr > 1e-3 ? ce / cr : rad.xz;
    float bi = (stI + 0.5) * LW_PITCH + uLensAng; vec2 p2 = vec2(sin(bi), cos(bi));
    float cd = dot(p2, e2), sd = e2.x * p2.y - e2.y * p2.x;              // cos and sin of the eye's bearing off this panel's own axis
    float limb = max(dot(rad.xz, e2), 0.0), away = smoothstep(27.5, 33.0, cr) * outK;
    col += uFlameCol * uFlameGain * sheen;
    // the glints, and far off a lantern's worth of stray light in the body of the glass
    float farK2 = smoothstep(100.0, 200.0, dist);
    emis += uFlameCol * uFlameGain * (gl * (5.0 + 7.0 * farK + 5.0 * farK2) + away * limb * limb * (0.012 + 0.06 * farK + 0.05 * farK2));
    // the panel turned toward the eye fills with the flame: boss blooming, steps burning, and the bars of its bay in the tiers
    float hy = (cameraPosition.y - 47.0) / 13.0;
    #ifdef LW_PRISM
      float hk = smoothstep(14.0, 26.0, cameraPosition.y) * (1.0 - smoothstep(77.0, 90.0, cameraPosition.y)) * 0.34 * farK, q = 0.5;
    #else
      float hk = exp(-hy * hy), q = clamp(max(abs(xp) * 2.0, abs(vW.y - 47.0) / 12.0), 0.0, 1.0);
      emis += uBeamCol * away * limb * (0.34 * farK + 0.2 * farK2) * (vK > 3.5 ? 1.0 : 0.62);      // far off the whole waist band burns
    #endif
    float face = exp(-(1.0 - cd) * 64.0) * stM * away * hk;
    // close to, a lit step is a dark bar with one line of fire down its middle; far off the lines run together and the panel is full
    float core = mix(0.3 + 0.7 * (1.0 - smoothstep(0.08, 0.5, abs(s - 0.5))), 0.62, max(lod, farK));
    float flr = mix(uFlare * 0.8, max(uFlare, 1.0), farK) * (1.0 + 0.35 * farK2);
    float bx = st.x / (1.0 + dist * 0.004), by = (vW.y - 47.0) / (2.0 + dist * 0.006);      // the boss burns from its middle, not as a flat pane
    emis += uBeamCol * face * flr * (1.0 - (vK > 3.5 ? 0.3 : 0.9) * nearO) * (vK > 3.5 ? 0.22 + 2.8 * exp(-bx * bx - by * by) : (1.7 - 1.1 * q) * core * (vK > 2.5 ? 1.0 : smoothstep(0.0, 0.08, ed)));
    // and every boss holds a small upright image of the flame, leaning toward the eye's side; far off it fills the boss
    if (vK > 3.5) {
      float wx = 0.22 + dist * 0.0028, wy = 0.75 + dist * 0.0032;
      float fx = (st.x - 0.42 * sd) / wx, fy = (vW.y - 46.7) / wy;
      float img = exp(-fx * fx * (1.0 + 0.9 * max(fy, 0.0)) - fy * fy);
      emis += uFlameCol * uFlameGain * img * (0.9 + 2.4 * max(cd, 0.0)) * outK;
    }
  #endif
  gl_FragColor = vec4(lwFog(col, vW) + emis * exp(-dist * uFogDen * 0.6), 1.0);
}`;

// ---- blades: one box per station; the fragment integrates a gaussian slab along the view ray analytically
// The mesh is this box with its inner end shaped to the optic's outline (so every course starts at the glass) and its
// outer end slid in to the hall's walls (so its far faces are never hidden behind a wall).
const BLADE_MIN = [-7.6, 13, 15], BLADE_MAX = [7.6, 92, 262];
const BLADE_VERT = /* glsl */`
attribute float aSt; varying vec3 vL, vO, vWp; varying float vM;
void main(){
  float a = (aSt + 0.5) * LW_PITCH + uLensAng, c = cos(a), s = sin(a);
  vec3 lp = position;
  if (lp.z > 100.0) {
    float m = 1000.0;
    if (s > 1e-4) m = min(m, (79.6 - c * lp.x) / s); else if (s < -1e-4) m = min(m, (-159.6 - c * lp.x) / s);
    if (c > 1e-4) m = min(m, (229.6 + s * lp.x) / c); else if (c < -1e-4) m = min(m, (-149.6 + s * lp.x) / c);
    lp.z = clamp(m, 32.0, lp.z);
  }
  vec3 w = vec3(c * lp.x + s * lp.z, lp.y, -s * lp.x + c * lp.z);
  vWp = w; vL = lp; vO = vec3(c * cameraPosition.x - s * cameraPosition.z, cameraPosition.y, s * cameraPosition.x + c * cameraPosition.z);
  vM = lwMask(aSt);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const BLADE_FRAG = /* glsl */`
varying vec3 vL, vO, vWp; varying float vM;
uniform vec3 uBMin, uBMax; uniform float uBladeGain, uBladeVeil;
float lwErf(float x){ float a = abs(x); float t = 1.0 - exp(-a * a * (1.2732 + 0.14 * a * a) / (1.0 + 0.14 * a * a)); return sign(x) * sqrt(max(t, 0.0)); }
// a blade in the dust is a tall plank of light with three bright courses, one from each tier of the optic: a ribbon
// off the crown rings (seen from below it passes overhead), the hot core off the bull's-eyes, a ribbon off the lowest
// rings. lwBand is the mean of one soft course over the heights y0..y1 that a ray crosses inside the plank.
float lwQ(float x){ float c = clamp(x, 0.0, 1.0); return 0.5 * c * c + max(x - 1.0, 0.0); }
float lwBand(float y0, float y1, float a, float b, float e){
  float d = y1 - y0;
  if (abs(d) < 0.05) { float y = 0.5 * (y0 + y1); return clamp((y - a) / e, 0.0, 1.0) - clamp((y - b) / e, 0.0, 1.0); }
  return e * ((lwQ((y1 - a) / e) - lwQ((y1 - b) / e)) - (lwQ((y0 - a) / e) - lwQ((y0 - b) / e))) / d;
}
// density of lit dust at p, t metres down the ray. Seen from far off (the aisle, the previous portal) a blade starts at
// the glass, is thickest and hottest there and thins outward; close to the eye the root is left clear, so that on the
// orbit the lens is not lost in its own glare. x: density, y: density weighted by the root's heat, z: weight
vec3 lwHR(vec3 p, float t){ float r = length(p.xz), r0 = lwLensR(p.y) + 0.9, far = smoothstep(42.0, 105.0, t), root = exp(-max(r - r0, 0.0) * 0.024);
  float w = smoothstep(r0, r0 + 2.4, r) * exp(-t * uFogDen) * (0.3 * smoothstep(0.5, 7.0, t) + 0.7 * smoothstep(3.0, 30.0, t));
  float dn = 0.03 + 0.75 * smoothstep(27.0, 70.0, r) * exp(-r * 0.005), df = 0.2 + 0.8 * root;
  return vec3(w * mix(dn, df, far), w * root * far, w); }
void main(){
  if (vM < 0.004) discard;
  vec3 ro = vO, d = vL - vO; float dl = length(d); if (dl < 1e-3) discard; vec3 rd = d / dl;
  vec3 sg = vec3(rd.x < 0.0 ? -1.0 : 1.0, rd.y < 0.0 ? -1.0 : 1.0, rd.z < 0.0 ? -1.0 : 1.0);
  vec3 inv = sg / max(abs(rd), vec3(1e-5));
  vec3 t1 = (uBMin - ro) * inv, t2 = (uBMax - ro) * inv; vec3 tn = min(t1, t2), tx = max(t1, t2);
  float t0 = max(max(tn.x, tn.y), tn.z), tE = min(min(tx.x, tx.y), tx.z);
  // the plank stops at the hall's walls and floor
  vec3 wd = vWp - cameraPosition; wd /= max(length(wd), 1e-4);
  float hx = ((wd.x > 0.0 ? 80.0 : -160.0) - cameraPosition.x) / (abs(wd.x) < 1e-5 ? (wd.x < 0.0 ? -1e-5 : 1e-5) : wd.x);
  float hz = ((wd.z > 0.0 ? 230.0 : -150.0) - cameraPosition.z) / (abs(wd.z) < 1e-5 ? (wd.z < 0.0 ? -1e-5 : 1e-5) : wd.z);
  float hy = wd.y < -1e-4 ? -cameraPosition.y / wd.y : 1e6;
  tE = min(tE, min(min(hx, hz), hy));
  if (tE <= max(t0, 0.0)) discard;
  // near faces draw the plank where it starts more than a metre off, far faces where it starts nearer (or round the eye);
  // the two hand over across a soft band, so no seam shows where they meet
  float wgt = smoothstep(0.8, 1.2, t0); if (!gl_FrontFacing) wgt = 1.0 - wgt;
  if (wgt < 0.002) discard;
  float ta = max(t0, 0.0), tb = tE, len = tb - ta;
  float K = uBladeK;
  float ax = abs(rd.x), ua = (ro.x + rd.x * ta) * K, ub = (ro.x + rd.x * tb) * K, tm = 0.5 * (ta + tb);
  float gA = 0.8862 / (K * max(ax, 1e-3)) * abs(lwErf(ub) - lwErf(ua));
  float um = (ro.x + rd.x * tm) * K, gB = exp(-um * um) * len;
  float gi = min(mix(gB, gA, smoothstep(0.0005, 0.002, ax)), len);
  gi = 30.0 * (1.0 - exp(-gi / 30.0));      // (a blade seen along its length is many times brighter than one seen through its face: that is what parts the fan)
  // sample the stretch of the ray that lies inside the plank's body (within 5 m of its centre plane)
  float ivx = 1.0 / (rd.x + (rd.x < 0.0 ? -1e-5 : 1e-5)), i1 = (-5.0 - ro.x) * ivx, i2 = (5.0 - ro.x) * ivx;
  float s0 = clamp(min(i1, i2), ta, tb), s1 = clamp(max(i1, i2), ta, tb);
  float tA = mix(s0, s1, 0.15), ts = mix(s0, s1, 0.5), tC = mix(s0, s1, 0.85);
  vec3 h3 = (lwHR(ro + rd * tA, tA) + lwHR(ro + rd * ts, ts) + lwHR(ro + rd * tC, tC)) / 3.0;
  float hr = h3.x, heat = h3.y / max(h3.z, 1e-3);
  float yA = ro.y + rd.y * s0, yC = ro.y + rd.y * s1;
  hr *= 0.04 * lwBand(yA, yC, 18.0, 84.0, 5.0) + 0.34 * lwBand(yA, yC, 35.0, 59.0, 4.0) + 0.6 * lwBand(yA, yC, 72.5, 80.5, 4.5) + 0.55 * lwBand(yA, yC, 15.5, 22.5, 4.0);
  vec3 pc = ro + rd * ts;
  float grain = 0.4 + 0.72 * lwNoise(vec3(pc.x * 0.16, pc.y * 0.11 - uTime * 0.07, pc.z * 0.045 + uTime * 0.05)) + 0.56 * lwNoise(vec3(pc.x * 0.5 + 7.0, pc.y * 0.34 - uTime * 0.16, pc.z * 0.12 + uTime * 0.11));
  // dust throws light mostly onward: a blade that comes toward the eye stands out as a slab, one that goes away is faint,
  // so the fan is a set of separate blades with darker air between and not one even haze
  // (only once it is clear of the optic: in front of the glass a blade keeps its plain strength, so the lens is not lost in glare)
  vec3 pm = ro + rd * mix(s0, s1, 0.5);
  float fwd = clamp(0.5 - 0.5 * rd.z, 0.0, 1.0), phase = mix(1.0, mix(0.72, 0.42 + 2.2 * fwd * fwd * fwd, smoothstep(34.0, 76.0, pm.z)), uBladePh);
  float glow = wgt * (1.0 - exp(-gi * hr * grain * uBladeDen * vM * phase)) * mix(0.5, 1.0, max(smoothstep(1.5, 8.0, abs(ro.x)), 1.0 - smoothstep(20.0, 29.0, ro.z)));
  // hottest and most golden where it leaves the glass
  vec3 bc = uBeamCol * mix(vec3(1.0, 0.78, 0.46), vec3(1.08, 0.9, 0.6), heat) * (1.0 + uBladeHot * heat);
  gl_FragColor = vec4(bc * uBeamGain * uBladeGain * glow, glow * uBladeVeil);
}`;

// ---- the shared light: uniforms, the material family and the look (colours and strengths) of a visit
export function makeLensLight(o = {}) {
  const U = {
    uLensAng: { value: 0 }, uTime: { value: 0 }, uBeamGain: { value: 2.0 }, uTopGain: { value: 1 }, uFogDen: { value: 0.0042 },
    uLeafOpen: { value: 0 }, uLeafSt: { value: o.leafStation ?? 14 }, uFlare: { value: 1 }, uFlameGain: { value: 1 }, uJet: { value: 0 },
    uBlind: { value: 0 }, uSnow: { value: 0 }, uBladeDen: { value: 0.05 }, uSway: { value: 0.45 }, uRain: { value: 0.6 }, uBladeK: { value: 0.3 }, uSpark: { value: 1 }, uBayDim: { value: 0 }, uBayBeam: { value: 0 }, uFloorK: { value: 1.3 }, uBladePh: { value: 1 },
    uBeamCol: { value: lin('#FFE7AE') }, uTopCol: { value: lin('#a9b0b6', 1.15) }, uFogCol: { value: lin('#8f8c86', 0.42) },
    uFlameCol: { value: lin('#ffdf9c') }, uRimCol: { value: lin('#3FBF9F') }, uPortalPos: { value: new THREE.Vector3(86, 47, 12) }, uHatch: { value: new THREE.Vector3(80, 47, -29) },
    uPortalCol: { value: lin('#ffe7ae', 0) }, uShadowCol: { value: lin('#23201E') }, uJetCol: { value: lin('#ffb36a') },
    uRoofCol: { value: lin('#C4CACB', 1.25) }, uGlassTint: { value: lin('#dfeee8') }, uLan: { value: new THREE.Vector3(-2.4, 8.2, 9.2) }, uLan2: { value: new THREE.Vector3(13.4, 6.9, 7.9) }, uTun: { value: 0 },
    uBMin: { value: new THREE.Vector3(...BLADE_MIN) }, uBMax: { value: new THREE.Vector3(...BLADE_MAX) }, uBladeGain: { value: 0.22 }, uBladeVeil: { value: 0.08 }, uExit: { value: 0 }, uBladeHot: { value: 2.0 },
  };
  const cache = new Map();
  const surface = (k = {}) => {
    const key = (k.obj ? 'o' : 'w') + (k.spin ? 's' : '') + (k.side ?? THREE.FrontSide);
    if (cache.has(key)) return cache.get(key);
    const defines = {}; if (k.obj || k.spin) defines.LW_OBJ = 1; if (k.spin) defines.LW_SPIN = 1;
    const m = new THREE.ShaderMaterial({ uniforms: U, defines, vertexColors: true, side: k.side ?? THREE.FrontSide,
      vertexShader: GLSL_UNI + SURF_VERT, fragmentShader: GLSL_UNI + GLSL_FN + GLSL_SURF + SURF_FRAG });
    cache.set(key, m); return m;
  };
  const glass = (kind) => {     // true: the instanced prism rings; 'stock': glass that is not part of the optic; else a panel
    const key = 'g' + (kind === true ? 'p' : kind === 'stock' ? 's' : 'm'); if (cache.has(key)) return cache.get(key);
    const m = new THREE.ShaderMaterial({ uniforms: U, defines: kind === true ? { LW_PRISM: 1 } : kind === 'stock' ? { LW_STOCK: 1 } : {}, side: THREE.DoubleSide,
      vertexShader: GLSL_UNI + GLSL_FN + GLASS_VERT, fragmentShader: GLSL_UNI + GLSL_FN + GLASS_FRAG });
    cache.set(key, m); return m;
  };
  const blade = () => new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    vertexShader: GLSL_UNI + GLSL_FN + BLADE_VERT, fragmentShader: GLSL_UNI + GLSL_FN + BLADE_FRAG });
  return { uniforms: U, surface, glass, blade, GLSL_UNI, GLSL_FN, dispose() { for (const m of cache.values()) m.dispose(); } };
}

// ---------------------------------------------------------------- geometry
const _m4 = new THREE.Matrix4(), _vx = new THREE.Vector3(), _vy = new THREE.Vector3(), _vz = new THREE.Vector3();
const BRONZE = '#8a6a34', BRONZE_D = '#5c4524', BRASS = '#c79a45', IRON = '#34383b', IRON_D = '#1f2224';
const S_BRONZE = sf(SID.PLAIN, 0.62, 0.9), S_BRASS = sf(SID.PLAIN, 0.8, 1), S_IRON = sf(SID.PLAIN, 0.35, 0.55), S_IRONM = sf(SID.PLAIN, 0.12, 0.2);
// a box from a to c: w across, d along the hint direction (made square to the axis)
export function strut(b, a, c, w, d, hint, color, surf) {
  _vy.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); const len = _vy.length() || 1e-3; _vy.divideScalar(len);
  _vz.set(hint[0], hint[1], hint[2]); _vz.addScaledVector(_vy, -_vz.dot(_vy));
  if (_vz.lengthSq() < 1e-6) _vz.set(_vy.y, -_vy.x, 0.01); _vz.normalize();
  _vx.crossVectors(_vy, _vz);
  _m4.makeBasis(_vx, _vy, _vz).setPosition((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2);
  b.add(new THREE.BoxGeometry(w, len, d), { m: _m4, c: color, surf });
}
// the optic's outline: glass radius at height y (lower tier leans out as it rises, upper tier leans in to the crown)
export function lensRadius(y) {
  if (y >= 59.5) return 26.9 - 11.3 * Math.pow(Math.min(1, (y - 59.5) / 25.5), 1.5);
  if (y <= 35) return 26.9 - 5.3 * Math.pow(Math.min(1, (35 - y) / 15), 1.5);
  return 27;
}
// one prism bar: x = fraction of the 15 degree arc, y = up, z = radial; three faces with their own uv (v across)
function prismGeometry(seg = 4) {
  const P = [], N = [], UV = [], IX = [], KK = [];
  const A = [0, 0.5], B = [0, -0.5], C = [-0.9, -0.1];   // (radial, up)
  const faces = [[B, A, [1, 0], 0], [C, B, [-0.406, -0.914], 1], [A, C, [-0.555, 0.832], 1]];
  for (const [p0, p1, n, kind] of faces) {
    const base = P.length / 3;
    for (let i = 0; i <= seg; i++) { const x = i / seg - 0.5; for (let k = 0; k < 2; k++) { const q = k ? p1 : p0; P.push(x, q[1], q[0]); N.push(0, n[1], n[0]); UV.push(i / seg, q[1] + 0.5); KK.push(kind); } }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; IX.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  for (const x of [-0.5, 0.5]) { const base = P.length / 3; for (const q of [A, B, C]) { P.push(x, q[1], q[0]); N.push(Math.sign(x), 0, 0); UV.push(x < 0 ? 0 : 1, 0.5); KK.push(2); } IX.push(base, base + 1, base + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('aK', new THREE.Float32BufferAttribute(KK, 1));
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(IX);
  return g;
}
// one bull's-eye panel, 7 m x 24 m: a boss ringed by nine rectangular steps of glass (x across, y up, z outward)
export function panelGeometry(steps = 9) {
  const P = [], N = [], UV = [], IX = [], KK = [];
  const quad = (a, b, c, d, uv, kind = 0) => {     // a-b outer edge, d-c inner edge
    const base = P.length / 3; _vx.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _vy.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]); _vz.crossVectors(_vx, _vy).normalize();
    if (_vz.z < 0 || (Math.abs(_vz.z) < 1e-4 && _vz.x * a[0] + _vz.y * a[1] < 0)) _vz.negate();
    const q = [a, b, c, d], uvs = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let k = 0; k < 4; k++) { P.push(q[k][0], q[k][1], q[k][2]); N.push(_vz.x, _vz.y, _vz.z); UV.push(uvs[k][0], uvs[k][1]); KK.push(kind); }
    IX.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const HA = 3.32, HB = 11.75, DA = 0.272, DB = 1.02, ZO = 0.52, ZI = 0.08;
  const rect = (k, z) => { const a = HA - k * DA, b = HB - k * DB; return [[a, -b, z], [a, b, z], [-a, b, z], [-a, -b, z]]; };
  for (let k = 0; k < steps; k++) {
    const o = rect(k, ZO), i = rect(k + 1, ZI);
    for (let s = 0; s < 4; s++) quad(o[s], o[(s + 1) % 4], i[(s + 1) % 4], i[s]);
    if (k < steps - 1) { const r0 = rect(k + 1, ZI), r1 = rect(k + 1, ZO); for (let s = 0; s < 4; s++) quad(r1[s], r1[(s + 1) % 4], r0[(s + 1) % 4], r0[s], [[0, 0.5], [1, 0.5], [1, 0.5], [0, 0.5]], 3); }
  }
  const c = rect(steps, ZI); quad(c[0], c[1], c[2], c[3], null, 5);
  // the boss: a low dome
  const seg = 14, rows = 5, base = P.length / 3, R = 0.84, a0 = HA - steps * DA;
  for (let j = 0; j <= rows; j++) { const ph = (j / rows) * 1.12, rr = Math.sin(ph) / Math.sin(1.12), zz = (Math.cos(ph) - Math.cos(1.12)) / (1 - Math.cos(1.12));
    for (let i = 0; i <= seg; i++) { const th = (i / seg) * TAU, x = Math.cos(th) * rr * R * (a0 / R) * 0.96, y = Math.sin(th) * rr * R * 1.9;
      P.push(x, y, ZI + zz * 0.85); _vz.set(Math.cos(th) * Math.sin(ph), Math.sin(th) * Math.sin(ph) * 0.6, Math.cos(ph)).normalize(); N.push(_vz.x, _vz.y, _vz.z); UV.push(0.5, j / rows); KK.push(4); } }
  for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i, b = a + seg + 1; IX.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(KK, 1)); g.setIndex(IX); g.computeBoundingSphere();
  return g;
}
// a spoked, toothed wheel of radius 1 about the y axis (gear train, pulleys, flywheels)
export function wheelGeometry({ teeth = 20, spokes = 6, thick = 0.18, color = BRASS, surf = S_BRASS, rim = 0.14 } = {}) {
  const b = INT.makeBuilder();
  const prof = [[1 - rim, -thick / 2], [1, -thick / 2], [1, thick / 2], [1 - rim, thick / 2], [1 - rim, -thick / 2]].map((p) => new THREE.Vector2(p[0], p[1]));
  b.add(new THREE.LatheGeometry(prof, 28), { c: color, surf });
  b.add(new THREE.CylinderGeometry(0.2, 0.2, thick * 1.7, 12), { c: color, surf });
  b.add(new THREE.CylinderGeometry(0.09, 0.09, thick * 3.2, 8), { c: IRON, surf: S_IRON });
  for (let i = 0; i < spokes; i++) { const a = (i / spokes) * TAU; b.add(new THREE.BoxGeometry(0.72, thick * 0.55, 0.11), { p: [Math.cos(a) * 0.52, 0, -Math.sin(a) * 0.52], r: [0, a, 0], c: color, surf }); }
  for (let i = 0; i < teeth; i++) { const a = (i / teeth) * TAU; b.add(new THREE.BoxGeometry(0.09, thick * 0.9, 0.5 * TAU / teeth), { p: [Math.cos(a) * 1.035, 0, -Math.sin(a) * 1.035], r: [0, a, 0], c: color, surf }); }
  return b.build();
}
const er = (b, r = 1, y = 0) => [Math.sin(b) * r, y, Math.cos(b) * r];

export async function buildHero(ctx, opts = {}) {
  const own = !opts.light, LEAF = opts.leafStation ?? 14, Q = ctx.quality?.detail ?? 1;
  const LT = opts.light || makeLensLight({ leafStation: LEAF }), U = LT.uniforms;
  U.uLeafSt.value = LEAF;
  const object = new THREE.Group(), rotor = new THREE.Group(); object.add(rotor);
  const matW = LT.surface(), matO = LT.surface({ obj: true }), matSpin = LT.surface({ spin: true });

  // ------------------------------------------------------------ rotor: bronze frame, deck, crown
  {
    const b = INT.makeBuilder();
    const ys = [20, 23.75, 27.5, 31.25, 35, 59.5, 63, 66.5, 70, 73.5, 77, 80.5, 83, 85];
    for (let j = 0; j < 24; j++) {
      const bay = j >> 1, mull = j & 1, bb = j * PITCH, w = mull ? 0.5 : 1.15, d = mull ? 0.95 : 1.6, col = mull ? BRONZE : BRONZE_D;
      for (let k = 0; k < ys.length - 1; k++) {
        const y0 = ys[k], y1 = ys[k + 1], drum = y0 >= 35 && y1 <= 59.5;
        if (drum && mull && (bay === 0 || bay === LEAF / 2)) continue;
        const r0 = lensRadius(y0) + 0.25, r1 = lensRadius(y1) + 0.25, so = drum ? 0 : (mull ? 0.14 : 0.3), sd = drum ? d : d - 2 * so + 0.04;
        strut(b, er(bb, r0 + so, y0), er(bb, r1 + so, y1), w, sd, er(bb), col, S_BRONZE);
        if (!drum) {     // inside, a slim flat strip of bronze lies on the arrises of the bars: from the hollow a standard is one clean line
          const fo = (y0 < 35 ? 1.7 : 1.35) * 0.9 * PRISM_FILL + 0.38;
          strut(b, er(bb, r0 - fo, y0), er(bb, r1 - fo, y1), mull ? 0.42 : 0.7, 0.2, er(bb), mull ? '#9a7636' : '#86652e', S_BRONZE);
        }
        if (!mull && drum) {     // and inside: a rib, a brass bead either side of it and bolt heads, so that from the hollow a standard is a built thing
          strut(b, er(bb, r0 - 0.95, y0), er(bb, r1 - 0.95, y1), 0.46, 0.4, er(bb), '#9a7636', S_BRONZE);
          for (const sx of [-0.5, 0.5]) strut(b, er(bb + sx / r0, r0 - 0.84, y0), er(bb + sx / r1, r1 - 0.84, y1), 0.12, 0.14, er(bb), '#d9b25a', S_BRASS);
          for (let q = 0; q < 10; q++) { const y = y0 + (y1 - y0) * (q + 0.5) / 10; b.add(new THREE.CylinderGeometry(0.15, 0.19, 0.3, 6), { p: er(bb, r0 - 1.2, y), r: [Math.PI / 2, bb, 0], c: BRASS, surf: S_BRASS }); }
        }
        if (!mull) {     // a raised rib and bolt heads down the outside of every standard
          strut(b, er(bb, r0 + 0.85, y0), er(bb, r1 + 0.85, y1), 0.4, 0.35, er(bb), BRONZE, S_BRONZE);
          const nb = drum ? 8 : 1;
          for (let q = 0; q < nb; q++) { const t = (q + 0.5) / nb, y = y0 + (y1 - y0) * t, r = r0 + (r1 - r0) * t + 0.82;
            for (const sx of [-0.4, 0.4]) { const p = er(bb + sx / r, r, y); b.add(new THREE.CylinderGeometry(0.17, 0.2, 0.3, 6), { p, r: [Math.PI / 2, bb, 0], c: BRASS, surf: S_BRASS }); } }
        }
      }
      await ctx.yield();
    }
    await ctx.yield();
    for (const [y, w, d] of [[20, 1.5, 1.9], [35, 1.3, 1.7], [59.5, 1.3, 1.7], [85, 1.4, 1.8]]) {
      const r = lensRadius(y) + 0.3;
      for (let i = 0; i < 24; i++) strut(b, er(i * PITCH, r, y), er((i + 1) * PITCH, r, y), w, d, er((i + 0.5) * PITCH), BRONZE_D, S_BRONZE);
      await ctx.yield();
    }
    // light hoops between the prism rings' tiers (cames), so the tiers read as built
    for (const y of [27.5, 66.5, 73.5, 80.5]) { const r = lensRadius(y) + 0.2; for (let i = 0; i < 24; i++) strut(b, er(i * PITCH, r, y), er((i + 1) * PITCH, r, y), 0.34, 0.5, er((i + 0.5) * PITCH), BRONZE, S_BRONZE); await ctx.yield(); }
    const crown = [[15.9, 85.2], [16.4, 86.4], [13.2, 88.6], [7.4, 91.0], [3.2, 92.2], [3.2, 95.0], [4.6, 95.7], [2.2, 96.6], [0.01, 98.2]].map((p) => new THREE.Vector2(p[0], p[1]));
    b.add(new THREE.LatheGeometry(crown, 24), { c: BRONZE, surf: S_BRONZE });
    for (let i = 0; i < 12; i++) strut(b, er(i * PITCH * 2, 15.6, 86.4), er(i * PITCH * 2, 3.4, 92.3), 0.45, 0.6, [0, 1, 0], BRASS, S_BRASS);
    await ctx.yield();
    // THE CROWN FROM WITHIN: the vent cowl. A brass smoke bell hangs over the chimney on a flue that runs up through the
    // crown; twelve spokes carry the flue from the crown ring, six stay rods steady the bell from the upper hoop, and the
    // underside of the crown is ribbed and ringed, with a ring of louvres round the flue
    {
      const BR_L = '#d9b25a', BR_D = '#6e5222';
      const bell = [[4.75, 65.1], [4.95, 65.5], [4.7, 66.0], [4.2, 66.5], [3.3, 68.3], [2.6, 70.4], [2.2, 72.6], [2.2, 79.6], [2.5, 79.9], [2.5, 80.6], [2.2, 80.9], [2.2, 91.9]].map((p) => new THREE.Vector2(p[0], p[1]));
      b.add(new THREE.LatheGeometry(bell, 24), { c: '#b58c3e', surf: S_BRASS, grad: [65, 92, 1.15, 0.7] });
      b.add(new THREE.TorusGeometry(4.9, 0.24, 6, 28).rotateX(Math.PI / 2), { p: [0, 65.4, 0], c: BR_L, surf: S_BRASS });
      for (const [y, r, c] of [[66.6, 4.15, BR_D], [68.3, 3.35, BR_L], [70.4, 2.66, BR_D], [72.7, 2.3, BR_L], [76.4, 2.3, BR_D], [84.2, 2.3, BR_L], [88.0, 2.3, BR_D]])
        b.add(new THREE.TorusGeometry(r, 0.15, 5, 22).rotateX(Math.PI / 2), { p: [0, y, 0], c, surf: S_BRASS });
      await ctx.yield();
      for (let i = 0; i < 12; i++) {
        const a = i * PITCH * 2 + PITCH;
        strut(b, er(a, 2.35, 80.2), er(a, 15.5, 85.5), 0.34, 0.55, [0, 1, 0], BRASS, S_BRASS);                        // spoke
        b.add(new THREE.SphereGeometry(0.42, 7, 5), { p: er(a, 2.6, 80.25), c: BR_L, surf: S_BRASS }); b.add(new THREE.SphereGeometry(0.5, 7, 5), { p: er(a, 15.3, 85.4), c: BR_L, surf: S_BRASS });
        b.add(new THREE.BoxGeometry(0.5, 1.5, 0.12), { p: er(a, 2.24, 74.6), r: [0, a, 0], c: '#120c05', surf: S_IRONM });      // the cowl's louvre slots
        b.add(new THREE.BoxGeometry(0.62, 0.14, 0.3), { p: er(a, 2.34, 75.42), r: [0, a, 0], c: BR_L, surf: S_BRASS });
        // a rib under the crown, in three runs that follow its slope
        const ar = i * PITCH * 2;
        strut(b, er(ar, 15.7, 85.9), er(ar, 13.1, 88.2), 0.3, 0.7, [0, 1, 0], BR_D, S_BRONZE); strut(b, er(ar, 13.1, 88.2), er(ar, 7.4, 90.6), 0.3, 0.7, [0, 1, 0], BR_D, S_BRONZE); strut(b, er(ar, 7.4, 90.6), er(ar, 2.3, 91.9), 0.3, 0.6, [0, 1, 0], BR_D, S_BRONZE);
        if (i % 2 === 0) { const as = a + PITCH * 2; strut(b, er(as, 4.55, 66.05), er(as, lensRadius(73.5) - 0.2, 73.5), 0.2, 0.2, [0, 1, 0], '#a88238', S_BRASS); b.add(new THREE.SphereGeometry(0.36, 7, 5), { p: er(as, 4.6, 66.1), c: BR_L, surf: S_BRASS }); }
        if (i % 3 === 2) await ctx.yield();
      }
      for (const [r, y, c] of [[13.0, 88.0, BRASS], [10.2, 89.2, BR_D], [7.3, 90.4, BRASS], [4.4, 91.2, BR_D]]) b.add(new THREE.TorusGeometry(r, 0.2, 5, 36).rotateX(Math.PI / 2), { p: [0, y, 0], c, surf: S_BRASS });
      for (let i = 0; i < 24; i++) b.add(new THREE.BoxGeometry(1.5, 0.12, 0.7), { p: er(i * PITCH + PITCH / 2, 10.2, 89.55), r: [0, i * PITCH + PITCH / 2 + Math.PI / 2, 0.42], c: '#1a1208', surf: S_IRONM });      // vent slots in the crown plate
    }
    await ctx.yield();
    // the deck the optic rides on: a chequer-plate annulus with a kerb, open in the middle for the lamp post
    const deck = new THREE.RingGeometry(3.4, 21.9, 48, 3); deck.rotateX(-Math.PI / 2);
    b.add(deck, { p: [0, 20.35, 0], c: '#4a4d4c', surf: sf(SID.PLATE, 0.3, 0.5) });
    b.add(new THREE.CylinderGeometry(21.9, 21.9, 1.1, 48, 1, true), { p: [0, 19.8, 0], c: IRON, surf: S_IRON });
    b.add(new THREE.TorusGeometry(3.5, 0.28, 6, 24).rotateX(Math.PI / 2), { p: [0, 20.6, 0], c: BRASS, surf: S_BRASS });
    for (let i = 0; i < 12; i++) strut(b, er(i * PITCH * 2 + PITCH, 3.6, 20.5), er(i * PITCH * 2 + PITCH, 21.6, 20.5), 0.3, 0.22, [0, 1, 0], '#3a3d3c', S_IRON);
    await ctx.yield();
    const g = b.build(), m = new THREE.Mesh(g, LT.surface({ obj: true, side: THREE.DoubleSide })); rotor.add(m);
  }
  await ctx.yield();

  // ------------------------------------------------------------ glass: 26 prism rings and 24 bull's-eye panels
  {
    const base = prismGeometry(4), g = new THREE.InstancedBufferGeometry();
    g.index = base.index; for (const k of ['position', 'normal', 'uv', 'aK']) g.setAttribute(k, base.attributes[k]);
    const ring = [], st = [];
    const addRing = (y, pitch) => { const r = lensRadius(y), dr = lensRadius(y + 0.5) - lensRadius(y - 0.5), lean = Math.atan(-dr);
      for (let i = 0; i < 24; i++) { ring.push(r, y, lean, pitch * PRISM_FILL); st.push(i); } };
    for (let k = 0; k < 8; k++) addRing(20.9 + (k + 0.5) * (13.6 / 8), 13.6 / 8);
    for (let k = 0; k < 18; k++) addRing(60.2 + (k + 0.5) * (24.3 / 18), 24.3 / 18);
    g.setAttribute('aRing', new THREE.InstancedBufferAttribute(new Float32Array(ring), 4)); g.setAttribute('aSt', new THREE.InstancedBufferAttribute(new Float32Array(st), 1));
    g.instanceCount = st.length; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 52, 0), 46);
    rotor.add(new THREE.Mesh(g, LT.glass(true)));
  }
  const panelGeo = panelGeometry(9), glassMat = LT.glass(false);
  {
    const list = []; for (let i = 0; i < 24; i++) if (i > 1 && i !== LEAF && i !== LEAF + 1) list.push(i);
    const im = new THREE.InstancedMesh(panelGeo, glassMat, list.length), o = new THREE.Object3D();
    list.forEach((i, k) => { const bb = (i + 0.5) * PITCH; o.position.set(...er(bb, 26.6, 47)); o.rotation.set(0, bb, 0); o.updateMatrix(); im.setMatrixAt(k, o.matrix); });
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); rotor.add(im);
  }
  await ctx.yield();
  // the pair of leaves: each hangs on its standard and swings outward, driven by a brass quadrant and worm
  const leaves = [];
  for (const side of [0, 1]) {
    const hb = (LEAF + side * 2) * PITCH, sgn = side ? -1 : 1, grp = new THREE.Group();
    grp.position.set(...er(hb, 26.85, 47)); grp.userData = { closed: hb + sgn * PITCH / 2, sgn: -sgn };
    const pane = new THREE.Mesh(panelGeo, glassMat); pane.position.set(sgn * 3.5, 0, -0.2); grp.add(pane);
    const b = INT.makeBuilder(), x0 = sgn * 0.12, x1 = sgn * 6.9;
    strut(b, [x0, -11.95, 0], [x0, 11.95, 0], 0.55, 0.9, [0, 0, 1], BRONZE_D, S_BRONZE); strut(b, [x1, -11.95, 0], [x1, 11.95, 0], 0.42, 0.8, [0, 0, 1], BRONZE, S_BRONZE);
    strut(b, [x0, 11.95, 0], [x1, 11.95, 0], 0.5, 0.85, [0, 0, 1], BRONZE, S_BRONZE); strut(b, [x0, -11.95, 0], [x1, -11.95, 0], 0.5, 0.85, [0, 0, 1], BRONZE, S_BRONZE);
    for (const y of [-9, 0, 9]) { b.add(new THREE.CylinderGeometry(0.42, 0.42, 1.7, 10), { p: [0, y, 0.1], c: BRASS, surf: S_BRASS }); b.add(new THREE.SphereGeometry(0.3, 8, 6), { p: [x1, y * 0.5, 0.75], c: BRASS, surf: S_BRASS }); }
    const quadrant = new THREE.CylinderGeometry(2.6, 2.6, 0.22, 20, 1, false, 0, Math.PI); quadrant.rotateY(sgn > 0 ? -Math.PI / 2 : Math.PI / 2);
    b.add(quadrant, { p: [sgn * 0.2, -12.3, 0], c: BRASS, surf: S_BRASS });
    grp.add(new THREE.Mesh(b.build(), LT.surface({ obj: true, side: THREE.DoubleSide })));
    rotor.add(grp); leaves.push(grp);
  }
  const setLeaves = (k) => { const s = Math.max(0, Math.min(1, k)) * 1.95; for (const L of leaves) L.rotation.y = L.userData.closed + L.userData.sgn * s; U.uLeafOpen.value = Math.min(1, k * 4); };
  setLeaves(0);
  await ctx.yield();

  // ------------------------------------------------------------ the blades
  {
    const box = new THREE.BoxGeometry(BLADE_MAX[0] - BLADE_MIN[0], BLADE_MAX[1] - BLADE_MIN[1], BLADE_MAX[2] - BLADE_MIN[2], 1, 20, 1);
    box.translate(0, (BLADE_MAX[1] + BLADE_MIN[1]) / 2, (BLADE_MAX[2] + BLADE_MIN[2]) / 2);
    { const pa = box.attributes.position; for (let i = 0; i < pa.count; i++) if (pa.getZ(i) < BLADE_MIN[2] + 0.01) pa.setZ(i, lensRadius(pa.getY(i)) + 1.5); }
    const g = new THREE.InstancedBufferGeometry(); g.index = box.index; g.setAttribute('position', box.attributes.position);
    g.setAttribute('aSt', new THREE.InstancedBufferAttribute(new Float32Array(24).map((_, i) => i), 1)); g.instanceCount = 24;
    const blades = new THREE.Mesh(g, LT.blade()); blades.frustumCulled = false; blades.renderOrder = 6; object.add(blades);
  }

  // ------------------------------------------------------------ pedestal: plinth, octagonal case, glazed south face
  const A8 = Math.PI / 4, APO = 13.86;
  {
    const b = INT.makeBuilder();
    b.add(new THREE.CylinderGeometry(19.2, 19.8, 4.2, 8, 1).rotateY(A8 / 2), { p: [0, 2.1, 0], c: '#3b3d3c', surf: sf(SID.STONE, 0.12), grad: [0, 4.2, 0.6, 1] });
    b.add(new THREE.CylinderGeometry(17.6, 19.2, 1.0, 8, 1).rotateY(A8 / 2), { p: [0, 4.7, 0], c: IRON, surf: S_IRON });
    for (let i = 0; i < 8; i++) {
      const a = i * A8, south = i === 0, nx = Math.sin(a), nz = Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a);
      const at = (u, y, o = 0) => [nx * (APO + o) + tx * u, y, nz * (APO + o) + tz * u];
      if (!south) {
        b.add(new THREE.BoxGeometry(11.6, 14.2, 0.6), { p: at(0, 12.2), r: [0, a, 0], c: IRON, surf: S_IRON, grad: [5, 19, 0.7, 1] });
        b.add(new THREE.BoxGeometry(8.6, 10.6, 0.5), { p: at(0, 12.2, 0.3), r: [0, a, 0], c: '#2a2d2f', surf: S_IRONM });
        b.add(new THREE.BoxGeometry(7.4, 9.4, 0.4), { p: at(0, 12.2, 0.55), r: [0, a, 0], c: IRON, surf: S_IRON });
        for (let q = 0; q < 10; q++) for (const y of [6.2, 18.2]) b.add(new THREE.SphereGeometry(0.2, 6, 4), { p: at(-4.95 + q * 1.1, y, 0.38), c: '#4a4e50', surf: S_IRON });
      } else {     // the glazed face: an iron frame with brass beading; the wheels show behind it
        for (const [u, y, w, h] of [[-5.1, 12.2, 1.4, 14.2], [5.1, 12.2, 1.4, 14.2], [0, 18.5, 11.6, 1.6], [0, 5.9, 11.6, 1.6]]) b.add(new THREE.BoxGeometry(w, h, 0.7), { p: at(u, y), r: [0, a, 0], c: IRON, surf: S_IRON });
        for (const [u, y, w, h] of [[-4.3, 12.2, 0.22, 11], [4.3, 12.2, 0.22, 11], [0, 17.6, 8.8, 0.22], [0, 6.8, 8.8, 0.22]]) b.add(new THREE.BoxGeometry(w, h, 0.3), { p: at(u, y, 0.4), r: [0, a, 0], c: BRASS, surf: S_BRASS });
        b.add(new THREE.BoxGeometry(11.4, 14, 0.3), { p: at(0, 12.2, -6.5), r: [0, a, 0], c: '#17191a', surf: S_IRONM });
      }
      await ctx.yield();
      const ca = a + A8 / 2;      // corner pilaster with base and cap
      b.add(new THREE.CylinderGeometry(0.62, 0.72, 14.4, 10), { p: er(ca, 15.0, 12.2), c: '#40444a', surf: S_IRON, grad: [5, 19, 0.7, 1.05] });
      b.add(new THREE.CylinderGeometry(0.95, 1.05, 0.7, 10), { p: er(ca, 15.0, 5.35), c: BRONZE_D, surf: S_BRONZE });
      b.add(new THREE.CylinderGeometry(1.1, 0.8, 0.8, 10), { p: er(ca, 15.0, 19.0), c: BRONZE_D, surf: S_BRONZE });
      // bracket out to the roller track
      strut(b, er(ca, 15.4, 15.5), er(ca, 21.2, 18.9), 0.5, 0.8, [0, 1, 0], IRON, S_IRON); strut(b, er(ca, 15.4, 18.9), er(ca, 21.2, 18.9), 0.5, 0.6, [0, 1, 0], IRON, S_IRON);
    }
    await ctx.yield();
    b.add(new THREE.CylinderGeometry(16.6, 15.2, 1.2, 8, 1).rotateY(A8 / 2), { p: [0, 19.7, 0], c: '#2c2f31', surf: S_IRON });
    const track = [[20.4, 18.9], [22.2, 18.9], [22.2, 19.5], [20.4, 19.5], [20.4, 18.9]].map((p) => new THREE.Vector2(p[0], p[1]));
    b.add(new THREE.LatheGeometry(track, 48), { c: '#2c2f31', surf: S_IRON });
    // the lamp post through the middle of the deck, the service table, the burner
    const post = [[2.6, 19.9], [2.6, 21.2], [1.5, 22.4], [1.15, 30], [1.35, 30.6], [1.0, 31.2], [0.95, 38.6], [2.6, 39.6], [2.8, 40.2], [1.3, 40.8], [1.3, 42.4], [1.75, 42.9], [1.75, 43.6], [1.25, 44.0]].map((p) => new THREE.Vector2(p[0], p[1]));
    b.add(new THREE.LatheGeometry(post, 24), { c: '#b0883a', surf: S_BRASS, grad: [20, 44, 0.6, 1.1] });
    await ctx.yield();
    for (let i = 0; i < 4; i++) b.add(new THREE.CylinderGeometry(0.28 + i * 0.24, 0.28 + i * 0.24, 0.5, 14, 1, true), { p: [0, 44.1, 0], c: '#d9b25a', surf: S_BRASS });
    // turned beads and dark bands down the post, the pierced air gallery under the wicks, a milled wick wheel
    for (const [y, r, c] of [[21.3, 2.62, BRONZE_D], [22.5, 1.56, BRASS], [26.2, 1.34, BRONZE_D], [30.3, 1.4, '#d9b25a'], [34.8, 1.02, BRONZE_D], [38.7, 1.1, '#d9b25a'], [39.9, 2.86, BRONZE_D], [40.9, 1.36, '#d9b25a'], [42.6, 1.5, BRONZE_D], [43.7, 1.8, '#d9b25a']])
      b.add(new THREE.TorusGeometry(r, 0.11, 5, 20).rotateX(Math.PI / 2), { p: [0, y, 0], c, surf: S_BRASS });
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16; b.add(new THREE.BoxGeometry(0.2, 0.42, 0.1), { p: er(a, 1.77, 43.25), r: [0, a, 0], c: '#140e06', surf: S_IRONM }); b.add(new THREE.BoxGeometry(0.34, 0.5, 0.1), { p: er(a + 0.2, 2.72, 39.9), r: [0, a + 0.2, 0], c: '#2a1e0e', surf: S_IRONM }); }
    b.add(new THREE.CylinderGeometry(0.5, 0.5, 0.16, 14), { p: [2.25, 43.2, 0], r: [0, 0, Math.PI / 2], c: '#d9b25a', surf: S_BRASS }); b.add(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6), { p: [1.95, 43.2, 0], r: [0, 0, Math.PI / 2], c: BRONZE_D, surf: S_BRASS });
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.5; strut(b, er(a, 2.5, 40.0), er(a, 1.55, 45.2), 0.12, 0.12, [0, 1, 0], BRASS, S_BRASS); strut(b, er(a, 1.0, 31), er(a, 5.2, 20.6), 0.3, 0.3, [0, 1, 0], BRONZE_D, S_BRONZE); }
    b.add(new THREE.TorusGeometry(1.62, 0.09, 5, 20).rotateX(Math.PI / 2), { p: [0, 45.2, 0], c: BRASS, surf: S_BRASS });
    {   // the oil reservoir: a turned brass vessel on a foot, a bead round its belly, a rolled rim, a knurled filler cap
      const rv = [[0.01, -1.3], [0.75, -1.3], [0.8, -1.12], [0.5, -1.0], [0.55, -0.82], [1.25, -0.5], [1.58, 0.02], [1.66, 0.1], [1.58, 0.18], [1.3, 0.6], [0.78, 0.86], [0.86, 0.94], [0.8, 1.04], [0.4, 1.06], [0.4, 1.3], [0.52, 1.32], [0.52, 1.52], [0.3, 1.6], [0.01, 1.62]].map((q) => new THREE.Vector2(q[0], q[1]));
      b.add(new THREE.LatheGeometry(rv, 20), { p: [3.6, 39.5, 0.6], c: '#b0883a', surf: S_BRASS, grad: [38.2, 41.1, 0.55, 1.2] });
      b.add(new THREE.TorusGeometry(1.6, 0.07, 5, 18).rotateX(Math.PI / 2), { p: [3.6, 39.6, 0.6], c: '#8a6a34', surf: S_BRASS });
      b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.9, 6), { p: [4.9, 39.5, 0.6], r: [0, 0, 1.2], c: '#d9b25a', surf: S_BRASS });      // the level cock
    }
    strut(b, [3.2, 39.6, 0.6], [1.2, 41.4, 0.2], 0.16, 0.16, [0, 1, 0], BRASS, S_BRASS);
    // the chimney's coupling: a brass band where the two lengths of glass meet, on three thin stays from the gallery ring
    b.add(new THREE.CylinderGeometry(1.36, 1.24, 0.7, 18, 1, true), { p: [0, 56.75, 0], c: '#b58c3e', surf: S_BRASS });
    for (const y of [56.4, 57.1]) b.add(new THREE.TorusGeometry(1.36, 0.1, 5, 18).rotateX(Math.PI / 2), { p: [0, y, 0], c: '#d9b25a', surf: S_BRASS });
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.5; strut(b, er(a, 1.62, 45.2), er(a, 2.25, 48.2), 0.11, 0.11, [0, 1, 0], BRASS, S_BRASS); strut(b, er(a, 2.25, 48.2), er(a, 1.42, 56.5), 0.11, 0.11, [0, 1, 0], BRASS, S_BRASS); }
    await ctx.yield();
    // governor pillar and drive, the sheave bracket, the pit kerb
    const gb = 0.62, gp = er(gb, 17.2, 0);
    b.add(new THREE.CylinderGeometry(1.2, 1.5, 3.2, 10), { p: [gp[0], 6.6, gp[2]], c: IRON, surf: S_IRON });
    b.add(new THREE.CylinderGeometry(0.2, 0.2, 9.2, 8), { p: [gp[0], 12.6, gp[2]], c: '#9aa0a4', surf: sf(0, 0.8, 0.9) });
    strut(b, [gp[0], 16.9, gp[2]], er(gb, 15.2, 16.9), 0.5, 0.5, [0, 1, 0], IRON, S_IRON);
    const sb = -0.56, sp = er(sb, 22.4, 0);
    strut(b, er(sb, 15.2, 17.2), er(sb, 23.4, 17.2), 0.7, 0.9, [0, 1, 0], IRON, S_IRON); strut(b, er(sb, 15.2, 12.5), er(sb, 21.6, 16.9), 0.5, 0.6, [0, 1, 0], IRON, S_IRON);
    strut(b, er(sb, 15.3, 16.2), er(sb, 21.3, 16.2), 0.2, 0.2, [0, 1, 0], '#6a6f72', sf(SID.BELT, 0.5, 0.8, 1));
    strut(b, [sp[0], 16.2, sp[2]], [sp[0], -2, sp[2]], 0.24, 0.24, [1, 0, 0], '#6a6f72', sf(SID.BELT, 0.5, 0.8, 0));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + sb, c = Math.cos(a), s = Math.sin(a); b.add(new THREE.BoxGeometry(9.6, 2.6, 1.1), { p: [sp[0] + s * 4.3, 1.3, sp[2] + c * 4.3], r: [0, a, 0], c: '#3a3c3b', surf: sf(SID.STONE, 0.1) }); }
    b.add(new THREE.BoxGeometry(7.6, 0.2, 7.6), { p: [sp[0], 0.5, sp[2]], r: [0, sb, 0], c: '#050505', surf: S_IRONM });
    await ctx.yield();
    object.add(new THREE.Mesh(b.build(), matW));
    await ctx.yield();

    // wheels behind the glass, rollers under the optic, the sheave: one instanced, self-turning draw each
    const wg = wheelGeometry(), spin = [], wheels = [[-2.6, 13.6, 3.4, 0.5], [1.6, 10.9, 1.6, -1.06], [3.0, 14.2, 2.0, 0.85], [0.4, 15.6, 1.1, -1.55], [-0.4, 8.7, 1.5, 1.13], [sp[0], 17.0, 1.3, 0.55, 1], [gp[0], 8.6, 1.0, 2.4, 2]];
    const wm = new THREE.InstancedMesh(wg, matSpin, wheels.length), o = new THREE.Object3D();
    wheels.forEach(([x, y, r, w, kind], k) => {
      if (kind === 1) { o.position.set(sp[0], y, sp[2]); o.rotation.set(0, sb, Math.PI / 2); o.scale.set(r, 3.4, r); }
      else if (kind === 2) { o.position.set(x, y, gp[2]); o.rotation.set(0, 0, 0); o.scale.set(r, 2.2, r); }
      else { o.position.set(x, y, APO - 1.6 - k * 0.55); o.rotation.set(Math.PI / 2, 0, 0); o.scale.set(r, 2.6, r); }
      o.updateMatrix(); wm.setMatrixAt(k, o.matrix); spin.push(w, k * 1.3);
    });
    wg.setAttribute('aSpin', new THREE.InstancedBufferAttribute(new Float32Array(spin), 2)); wm.computeBoundingSphere(); object.add(wm);
    const rb = INT.makeBuilder();
    rb.add(new THREE.CylinderGeometry(0.62, 0.74, 1.5, 12), { c: BRONZE, surf: S_BRONZE }); rb.add(new THREE.CylinderGeometry(0.16, 0.16, 2.3, 6), { c: IRON, surf: S_IRON });
    for (let i = 0; i < 4; i++) rb.add(new THREE.BoxGeometry(0.2, 1.52, 0.2), { p: [Math.cos(i * 1.571) * 0.6, 0, Math.sin(i * 1.571) * 0.6], c: BRONZE_D, surf: S_BRONZE });
    const rg = rb.build(), rm = new THREE.InstancedMesh(rg, matSpin, 24), rs = [];
    for (let i = 0; i < 24; i++) { const a = i * PITCH + 0.1; o.position.set(...er(a, 21.3, 19.72)); o.rotation.set(Math.PI / 2, 0, 0); o.rotation.order = 'YXZ'; o.rotation.y = a; o.scale.set(1, 1, 1); o.updateMatrix(); rm.setMatrixAt(i, o.matrix); rs.push(-2.1, i); }
    rg.setAttribute('aSpin', new THREE.InstancedBufferAttribute(new Float32Array(rs), 2)); rm.computeBoundingSphere(); object.add(rm);
  }
  await ctx.yield();
  // the pane over the wheels and the lamp's chimney: thin glass, drawn as a rim and a sheen
  const sheen = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: GLSL_UNI + /* glsl */`varying vec3 vW, vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_UNI + GLSL_FN + /* glsl */`varying vec3 vW, vN; void main(){ vec3 V = normalize(cameraPosition - vW); vec3 n = normalize(vN); float f = 1.0 - abs(dot(n, V)); f = f * f;
      vec3 R = reflect(-V, n); float sk = smoothstep(0.3, 0.95, abs(R.y)) * (0.6 + 0.4 * lwNoise(vW * 0.7));
      float nearL = 1.0 - smoothstep(2.0, 6.0, length(vW.xz));
      vec3 c = uRimCol * f * 0.34 + uRoofCol * uTopGain * (0.03 + 0.1 * sk * (0.3 + f)) + uFlameCol * uFlameGain * 0.05 * f * nearL;
      // heat shimmer: the hot air climbing the chimney, wavering threads of warm light that rise and thin
      float ang = lwBearing(vW.xz), hy = vW.y * 0.5 - uTime * 2.4;
      float sh1 = lwNoise(vec3(ang * 2.2 + 0.7 * sin(hy * 0.9), hy, uTime * 0.35)), sh2 = lwNoise(vec3(ang * 5.0 - 3.0, hy * 1.7 + 4.0, uTime * 0.5));
      float shim = smoothstep(0.45, 0.8, sh1 * 0.65 + sh2 * 0.35) * smoothstep(49.5, 53.0, vW.y) * (1.0 - 0.6 * smoothstep(58.0, 66.5, vW.y));
      c = c * (0.75 - 0.25 * smoothstep(56.0, 60.0, vW.y)) + (uFlameCol * 0.42 + vec3(0.05, 0.07, 0.08)) * uFlameGain * shim * nearL * (0.5 + 0.5 * (1.0 - f));
      gl_FragColor = vec4(c * exp(-distance(vW, cameraPosition) * uFogDen), 1.0); }` });
  {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(8.7, 10.9), sheen); pane.position.set(0, 12.2, APO + 0.2); pane.renderOrder = 3; object.add(pane);
    const prof = [[1.5, 44.4], [1.72, 45.6], [1.95, 47.4], [1.78, 49.6], [1.3, 51.4], [1.18, 53.4], [1.2, 56.4], [1.34, 57.1], [1.42, 61.0], [1.62, 64.6], [1.75, 66.6]].map((p) => new THREE.Vector2(p[0], p[1]));
    const ch = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), sheen); ch.renderOrder = 5; object.add(ch);
  }
  // governor: two balls the size of barrels flying round on their arms
  const governor = new THREE.Group();
  {
    const b = INT.makeBuilder();
    for (const s of [-1, 1]) {
      strut(b, [0, 7.4, 0], [s * 2.5, 4.2, 0], 0.22, 0.3, [0, 0, 1], '#9aa0a4', sf(0, 0.8, 0.9)); strut(b, [s * 2.5, 4.2, 0], [s * 0.5, 1.9, 0], 0.16, 0.24, [0, 0, 1], '#9aa0a4', sf(0, 0.8, 0.9));
      b.add(new THREE.SphereGeometry(1.25, 14, 10), { p: [s * 2.6, 4.1, 0], s: [1, 1.12, 1], c: '#b88a3c', surf: S_BRASS });
      b.add(new THREE.TorusGeometry(1.26, 0.09, 5, 16), { p: [s * 2.6, 4.1, 0], r: [Math.PI / 2, 0, 0], c: IRON_D, surf: S_IRON });
    }
    b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.8, 10), { p: [0, 1.9, 0], c: BRASS, surf: S_BRASS }); b.add(new THREE.SphereGeometry(0.6, 10, 8), { p: [0, 7.7, 0], c: BRASS, surf: S_BRASS });
    governor.add(new THREE.Mesh(b.build(), matO)); const gp = er(0.62, 17.2, 0); governor.position.set(gp[0], 9.2, gp[2]); object.add(governor);
  }
  // the driving weight on its chain
  const weight = new THREE.Group();
  {
    const b = INT.makeBuilder(), prof = [[0.01, 0], [2.1, 0], [2.3, 0.5], [2.3, 4.4], [1.9, 5.0], [0.9, 5.3], [0.5, 6.2], [0.01, 6.3]].map((p) => new THREE.Vector2(p[0], p[1]));
    b.add(new THREE.LatheGeometry(prof, 16), { c: '#2b2e30', surf: S_IRON, grad: [0, 6, 0.75, 1.1] });
    for (const y of [1.2, 2.6, 4.0]) b.add(new THREE.TorusGeometry(2.32, 0.1, 5, 20).rotateX(Math.PI / 2), { p: [0, y, 0], c: '#4a4e50', surf: S_IRON });
    b.add(new THREE.TorusGeometry(0.6, 0.14, 6, 12), { p: [0, 6.6, 0], c: '#6a6f72', surf: sf(0, 0.6, 0.8) });
    weight.add(new THREE.Mesh(b.build(), matO)); const sp = er(-0.56, 22.4, 0); weight.position.set(sp[0], 9, sp[2]); object.add(weight);
  }
  const setWeight = (k) => { weight.position.y = 10.5 - 18 * Math.max(0, Math.min(1, k)); };
  await ctx.yield();

  // ------------------------------------------------------------ the flame: four wicks in one upright sprite
  const flame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: GLSL_UNI + /* glsl */`varying vec2 vUv; void main(){ vUv = uv; vec3 c = vec3(0.0, 48.6, 0.0); vec2 t = cameraPosition.xz; float l = length(t); t = l > 1e-3 ? t / l : vec2(0.0, 1.0);
      vec3 p = c + vec3(t.y, 0.0, -t.x) * position.x * 11.0 + vec3(0.0, 1.0, 0.0) * position.y * 13.0; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: GLSL_UNI + GLSL_FN + /* glsl */`varying vec2 vUv; void main(){ vec2 p = (vUv - 0.5) * vec2(11.0, 13.0); p.y += 4.0; float body = 0.0;
      for (int i = 0; i < 4; i++) { float fi = float(i); float x0 = (fi - 1.5) * 0.52; float h = 4.2 + 0.9 * sin(uTime * (7.0 + fi * 1.7) + fi * 2.1) * (0.5 + 0.5 * sin(uTime * 2.3 + fi)) + 0.5 * sin(fi * 1.9);
        float y = clamp(p.y / h, 0.0, 1.0); float lean = 0.28 * y * y * sin(uTime * 5.0 + fi * 1.3 + p.y);
        float w = 0.62 * sqrt(y) * (1.0 - y) * 2.1 + 0.03; float d = abs(p.x - x0 * (1.0 - 0.6 * y) - lean) / w;
        body = max(body, (1.0 - smoothstep(0.3, 1.0, d)) * (0.55 + 0.45 * smoothstep(0.0, 0.6, d)) * step(0.0, p.y) * (1.0 - smoothstep(0.8, 1.0, p.y / h))); }
      float r = length(p - vec2(0.0, 2.0)); float halo = 0.5 / (1.0 + r * r * 0.5) * (1.0 - smoothstep(2.5, 6.5, r)) * (0.9 + 0.1 * sin(uTime * 11.0));
      vec3 c = mix(vec3(1.0, 0.62, 0.22), uFlameCol, smoothstep(0.2, 2.6, p.y)) * body * (1.25 + 1.0 * smoothstep(0.0, 2.5, p.y)) + uFlameCol * halo * 0.3 + vec3(0.2, 0.32, 0.6) * body * (1.0 - smoothstep(0.0, 0.9, p.y)) * 1.2;
      gl_FragColor = vec4(c * uFlameGain * exp(-distance(vec3(0.0, 47.0, 0.0), cameraPosition) * uFogDen * 0.6), 1.0); }` }));
  flame.frustumCulled = false; flame.renderOrder = 4; object.add(flame);

  const setAngle = (a) => { rotor.rotation.y = a; U.uLensAng.value = a; };
  return {
    object, radius: 30, height: 98, center: new THREE.Vector3(0, 47, 0), light: LT, ground: true, groundY: 0,
    anchors: { axis: new THREE.Vector3(0, 0, 0), flame: new THREE.Vector3(0, 47, 0), bayBearing: PITCH, leafBearing: (LEAF + 1) * PITCH, drumRadius: LENS.RD, hollowRadius: LENS.RIN, flyRadius: 12,
      governor: governor.position.clone().setY(13), weight: new THREE.Vector3(weight.position.x, 8, weight.position.z) },
    setAngle, setLeaves, setWeight,
    update(dt, time) {
      governor.rotation.y = time * 2.6;
      if (own) { U.uTime.value = time; setAngle(-time * 0.0654); setLeaves(0.5 - 0.5 * Math.cos(time * 0.35)); setWeight((time % 40) / 40); }
    },
    dispose() { if (own) LT.dispose(); },
  };
}
