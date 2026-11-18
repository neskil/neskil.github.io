// HERO SET PIECE for "folding-market" (The Folding Market): THE FOLDING WAVE.
//
// A stretch of Thai railway-market lane roofed by hinged cloth awnings that fold back in a travelling
// wave ahead of a yellow railcar and drop shut again behind it. Everything (cloth angle, the sun that
// pours through the slot, the cloth-coloured shade ahead, trays sliding off the rail, hanging scales
// and bulbs swinging in the cab's wind, parasols tilting and furling) is one function of the cab's
// distance along the lane, `camS`, and nothing else.
//
// LOCAL SPACE: origin = centre of the lane on the ground, +Y up. The lane runs along Z: lane distance
// s = length/2 - z, so the entry (s=0) is at +Z (the FRONT: rails running into a wall of cloth) and the
// train travels toward -Z. +X is the RIGHT of travel (east), -X the left. Rail head y=0.15, cab eye y=2.55.
// Walls (hinge lines) at x=+-3.5, hinges 3.7 up, awning cells 3 m along the lane, stall benches 1.25 deep.
//
// opts:
//   palette    7 hex strings, brief order [saffron, orange, bleachedGreen, fadedBlue, sunWhite, umber, red]
//   length     lane length in metres (default 72, rounded to 3 m cells; the world passes ~369)
//   offsetAt   (s)=>x lateral offset of the lane centre at lane distance s (gentle bends are sheared in)
//   sunDir     direction TOWARD the sun, local (default behind-right, 62 deg up: [0.269,0.883,0.385])
//   railcar    true: draw the yellow railcar riding the wave (false when the world parents its own cab)
//   walls      true: ground-floor shopfront strip the awnings hinge on (4.5-5 m; world adds storeys above/behind)
//   ground     true: lane floor strip (ballast, sleepers, concrete) that receives the cloth-edge shadows
//   rails      true: two steel rails (gauge 1.0)
//   dust       true: sunlit dust motes / marigold petals (one Points draw)
//   detail     0.25..1 density of true-geometry goods and props (default auto = clamp(100/length); <=0.5 is the
//              thinned long-lane build: fewer real fruit, 2 front trays per stall, simpler frames and cloth grid)
//   lead       wave lead in metres (default 9: cloth stands open to 9 m ahead of the eye and is shut by 18 m); see setLead
//   bulbGain   multiplier on the bare bulbs' brightness (the world raises it at night)
//   zones      rooms of the lane, [[s0, s1, side, kind], ...] (at most 8, boundaries on 3 m cells): side -1 left, +1 right, 0 both;
//              kind 0 open ground (no shops, stalls or cloth), 1 stalls without cloth, 2 a roofed hall (the world builds the roof:
//              ridge 9.2 m, eaves 7.9 m; no cloth, no sun but through three roof slits, lantern light), 3 flower quarter (cloth and
//              goods in marigold colours). The shared light function knows them (uZone, uHall, uFlower).
//   heightAt   (s)=>metres the railhead stands above the ground; where it is above 0 the rails ride a timber trestle built here
//   span       [s0, s1] of that trestle carried on a steel girder between two stone piers (over water)
//   bridge     [s0, s1] where the lane floor shows no ballast (the rails are overhead);  waterCut [s0, s1] where it has no floor at all
//   freeParasols  [[s, x, baseY, scale], ...] market umbrellas standing in the open, instanced with the stall parasols, never furled
//   hold       [s0, s1] awning rows that always stand raised (the world keeps them up either side of its trestle ramp)
//   ramp       metres over which the cloth goes from open to shut ahead of the lead (default 9);  cullAhead  street chunks that
//              start further ahead of the cab than this are not drawn (default: all drawn)
//   swing      [shut angle above level (rad), swing (rad), extra depth of the valance while shut, extra depth of the front skirt while shut]
//              (default, as built: [-0.42, 1.642, 1.6, 2.5]; the design's geometry is [-0.214, 1.309, ...])
//   clear      [h, ahead, ease, wall]: the clearance rule over the flight line (see fmClearK): within `ahead` metres in front of the cab no
//              part of a panel's frame further than `wall` out from its own wall is lower than `h` above the flight line (a panel that
//              would be swings further up); it eases off over `ease` metres beyond (default: no rule)
//
// RETURN extras:
//   setProgress(u)  u 0..1 -> camS from -30 to length+30 (use this OR setCamS). null = auto loop on time.
//   setCamS(s)      cab eye lane distance in metres (the world feeds path distance here every frame).
//   setLead(m)      wave lead (9 normally; stretch to 40 over the last third as in the brief).
//   uniforms        shared uniforms (uCamS, uLead, uTime, uLen, uSun, uSunCol, uSkyCol, uShade, uCamL, uPal).
//   glsl            GLSL chunk declaring those uniforms plus fmSun(P, off, vis, tint) and fmShade(alb, N, P, off)
//                   so the world's own materials (patched kit facades, extra goods) take the same sun/cloth light.
//   laneToLocal(s, x, y, out)   lane coordinates -> local Vector3 (honours offsetAt).
//
// anchors (local space):
//   entry        { position, direction }: cab eye where the lane starts (s=-16, the open crossing).
//   flyThrough   ordered Vector3 list along the rail centreline at eye height from s=-30 to length+30. The
//                brief deliberately breaks the 6 m rule: the guaranteed clear box is 3.0 wide x 3.8 high
//                round this line once the wave has opened (trays leave it 20 m ahead of the nose).
//   portalSeat   { position, normal(+Z), radius 7 }: on the rails 65 m beyond the last awning, at eye height.
//   waveFront    (camS)=>Vector3 helper: where the zip is right now (for a camera POI).
//   viewpoints   { entryView, sideHigh, exitBack } good camera positions looking at `center`.
//   hinges       { x: 3.5, y: 3.7, cell: 3 }, railHeadY, eyeY, clearBox {w,h}.
//
// SIZE (length 72): 7.4 m wide (9.9 with the shop strip) x 72 m long; cloth tips reach 7.6 m when raised.
// `radius` (19) and `height` (7) are claimed small so the orbit viewer comes close; the true half-length is length/2.
// COST (length 72): ~98k triangles, 7 draw calls (2 street chunks of 48 m, awnings, parasols, ground, dust,
// railcar), ~140 ms build, no lights, no textures. Cost scales with length: at length 369 the goods thin
// automatically (detail 0.27) to ~170-190k triangles and 13 draw calls, ~300 ms build. That is over the
// 150k hero budget but it replaces the awning, goods, props and rail lines of the world's own budget;
// pass detail: 0.25, walls: false or dust: false to go lower.
// LIGHTING: self-lit ShaderMaterials (linear HDR, scene fog honoured). Wants a hot late-morning day sky,
// almost no fog, bloom only catching bulbs and ice glints. The scene's own lights do not affect it;
// change uniforms.uSun / uSunCol / uSkyCol / uShade for other hours.
import * as THREE from 'three';

const DEF_PAL = ['#F4C21B', '#F08A2C', '#A9B45A', '#6F9BC4', '#FFF6DC', '#2E2A1C', '#C8281E'];

// ---------------------------------------------------------------- shared GLSL: the wave and its light
const FM_GLSL = /* glsl */`
uniform float uCamS, uLead, uTime, uLen;
uniform vec3 uSun, uSunCol, uSkyCol, uShade, uCamL, uLamp;
uniform vec2 uGust, uHall, uFlower, uBridge, uBlue;
uniform vec4 uTree, uTree2, uPortal;
uniform vec4 uZone[8];
uniform float uRamp, uTintK;
uniform vec3 uHallLamp;
uniform vec3 uPortalCol;
uniform float uWet;
uniform vec3 uPal[4];
uniform vec2 uHold;
uniform vec4 uYard;
uniform vec4 uUmb[16];
uniform float uBandK;
uniform vec4 uAwn;     // the cloth's swing: (shut angle above level, swing, how much deeper the valance hangs shut, how much deeper the front skirt hangs shut)
uniform vec4 uClear;   // the clearance rule over the flight line: (least angle of a panel near the cab, metres ahead of the cab it holds for, metres over which it eases off, unused)
float fmH1(float n){ n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float fmH2(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float fmN2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(fmH2(i), fmH2(i+vec2(1.,0.)), f.x), mix(fmH2(i+vec2(0.,1.)), fmH2(i+vec2(1.,1.)), f.x), f.y); }
// ballast: irregular stones (jittered cells) with a finer octave, fading to their mean with distance so they never shimmer
float fmStone(vec2 w, float dist){
  vec2 j = vec2(fmN2(w * 9.0 + 3.0), fmN2(w * 9.0 + 41.0)) - 0.5;
  float a = fmH2(floor(w * 19.0 + j * 2.4)), b = fmH2(floor(w * 43.0 - j * 3.0 + 7.0));
  return mix(a * 0.62 + b * 0.2 + fmN2(w * 5.0) * 0.18, 0.5, clamp(dist / 40.0, 0.0, 0.85));
}
// the crossing road in front of the lane (lane w = (x, s), s = -45..-0.5): asphalt with darker repairs and cracks, a worn
// centre line, stop bars before the rails, a hatched keep-clear box either side of the track where the railcar comes in,
// and the planks between and beside the rails
vec3 fmRoad(vec2 w, float n1, float n2, float n3){
  float x = w.x, s = w.y, ax = abs(x);
  vec3 asph = vec3(0.115, 0.115, 0.12) * (0.75 + 0.5 * n3) * (0.85 + 0.3 * n2);
  asph *= 1.0 - 0.28 * smoothstep(0.56, 0.6, fmN2(w * 0.3 + 90.0)) - 0.2 * (1.0 - smoothstep(0.0, 0.03, abs(fmN2(w * 0.5 + 33.0) - 0.5)));
  float paint = (1.0 - smoothstep(0.07, 0.11, abs(s + 8.8))) * step(0.45, fract(x * 0.22)) + (1.0 - smoothstep(0.2, 0.26, abs(ax - 10.2))) * step(abs(s + 8.8), 7.2);
  float box = step(1.85, ax) * step(ax, 4.7) * step(-16.6, s) * step(s, -11.2);
  paint += box * max(step(0.8, fract((x + s) * 0.55)), max(step(4.52, ax), max(step(ax, 2.03), step(2.52, abs(s + 13.9)))));
  asph = mix(asph, vec3(0.55, 0.50, 0.30) * (0.5 + 0.5 * n1), clamp(paint, 0.0, 1.0) * (0.3 + 0.5 * n2));
  float plank = (1.0 - smoothstep(1.55, 1.6, ax)) * step(0.09, abs(ax - 0.5));
  vec3 pl = vec3(0.17, 0.125, 0.08) * (0.6 + 0.6 * fmN2(vec2(x * 30.0, s * 1.5))) * (0.55 + 0.45 * smoothstep(0.0, 0.02, abs(fract(x * 4.0) - 0.5)));
  return mix(asph, pl, plank);
}
// the station yard's packed earth: dark and gritty, with pale pebbles near the eye, and grass that creeps in with a crisp
// ragged edge and blade-scale light and dark (the fine structure fades with distance so it never shimmers)
vec3 fmEarth(vec2 w, float n1, float n2, float n3, float dist){
  float near = clamp(1.0 - dist / 34.0, 0.0, 1.0), near2 = clamp(1.0 - dist / 16.0, 0.0, 1.0);
  vec3 earth = vec3(0.145, 0.117, 0.078) * (0.7 + 0.45 * n2) * (0.8 + 0.4 * fmStone(w * 1.2 + 5.0, dist) * n1);
  float peb = fmH2(floor(w * 14.0 + vec2(n1, n3) * 1.5));
  earth = mix(earth, vec3(0.30, 0.275, 0.23) * (0.6 + 0.6 * n3), step(0.93, peb) * near2 * 0.8);
  earth *= 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.035, abs(fmN2(w * 0.7 + 51.0) - 0.5))) * smoothstep(0.45, 0.6, fmN2(w * 0.23 + 9.0)) * near;   // dried cracks
  float gk = smoothstep(0.58, 0.65, fmN2(w * 0.9 + 5.0) * 0.75 + n3 * 0.25);
  float blade = fmN2(w * vec2(38.0, 29.0)), tuft = fmN2(w * 6.5 + 17.0);
  vec3 grass = vec3(0.105, 0.20, 0.05) * (0.6 + 0.8 * n1) * mix(1.0, (0.62 + 0.76 * blade) * (0.8 + 0.4 * tuft), near);
  grass = mix(grass, vec3(0.26, 0.27, 0.09) * (0.7 + 0.6 * blade), smoothstep(0.62, 0.8, tuft) * 0.5 * near);   // dry, straw-coloured tufts among the green
  return mix(earth, grass, gk * 0.78);
}
// distance of an awning cell ahead of the cab, ragged per awning, sides half a beat apart
float fmCellD(float cell, float side){
  return (cell + 0.5) * 3.0 - uCamS + (fmH1(cell * 2.0 + side * 0.5 + 7.0) - 0.5) * 1.6 + side * 0.9; }
// the rooms of the lane, uZone[i] = (s0, s1, side, kind): side -1 left, +1 right, 0 both; kind 0 open ground (no shops, stalls or
// cloth), 1 stalls without cloth, 2 the roofed hall (no cloth), 3 the flower quarter (cloth, in one colour).
// Returns (no cloth left, no cloth right, no wall left, no wall right) for the awning cell whose centre is at lane distance cc
vec4 fmGap(float cc){
  vec4 g = vec4(0.0);
  for (int i = 0; i < 8; i++) { vec4 z = uZone[i];
    float k = step(z.x, cc) * step(cc, z.y) * step(z.w, 2.5), l = k * step(z.z, 0.5), r = k * step(-0.5, z.z), op = step(z.w, 0.5);
    g = max(g, vec4(l, r, l * op, r * op)); }
  return g; }
// the roofed hall: 1 under its roof (ridge 9.2 m over the rails, eaves 7.9 m at the house fronts), with a soft edge at the mouths
float fmHallK(vec3 P, float off){
  float s = uLen * 0.5 - P.z, xp = abs(P.x - off);
  return smoothstep(uHall.x - 0.5, uHall.x + 1.5, s) * (1.0 - smoothstep(uHall.y - 1.5, uHall.y + 0.5, s)) * step(xp, 5.4) * step(P.y, 9.2 - xp * 0.245); }
float fmOpenD(float d){ float o = (1.0 - smoothstep(uLead, uLead + uRamp, d)) * smoothstep(-14.0, -6.0, d);
  o = max(o, step(uHold.x, d + uCamS) * step(d + uCamS, uHold.y));   // rows that always stand raised (either side of the trestle's ramp)
  return max(o, uGust.y * (1.0 - smoothstep(uGust.x - 16.0, uGust.x, d + uCamS)) * step(-6.0, d)); }
// cloth angle above horizontal: closed slopes down 24 deg (so the cab looks onto a valley of cloth), open stands 70 deg up, with a snap overshoot
// (uAwn = -0.42, 1.642 as built; the design's own numbers, a free edge 2.7 m above the rail and a 75 degree swing, are -0.214, 1.309)
float fmAngle(float o){ float e = o*o*(3.-2.*o);
  return uAwn.x + uAwn.y * e + 0.10 * sin(3.14159 * smoothstep(0.55, 1.0, o)) * o; }
// THE CLEARANCE RULE, one for the whole line (uClear = least angle, metres ahead, metres of easing; the world works the angle out from a
// height above the flight line): within uClear.y metres ahead of the cab (and beside it, until the cloth falls behind), a lifted or lifting
// panel stands at least uClear.x above level, which is to say no part of its frame further than a stated distance from its own wall is
// lower than a stated height above the flight line (the hinge rail runs 1.15 m above the flight line everywhere, on the trestle too). A
// panel that would hang lower swings further up on its hinge; none is moved. Over the next uClear.z metres the rule eases off, so the rows
// further ahead lift exactly as the wave has them. d: the panel's distance ahead of the cab; a: the angle the wave gives it.
float fmClearK(float d){ return (1.0 - smoothstep(uClear.y, uClear.y + uClear.z, d)) * smoothstep(-14.0, -6.0, d); }
float fmAngleD(float o, float d){ float a = fmAngle(o); return mix(a, max(a, uClear.x), fmClearK(d)); }
vec3 fmClothCol(float cell, float side){
  float h = fmH1(cell * 3.7 + side * 11.3 + 2.0);
  vec3 c = uPal[0];
  c = mix(c, uPal[1], step(0.40, h)); c = mix(c, uPal[2], step(0.70, h)); c = mix(c, uPal[3], step(0.86, h));
  float cc = (cell + 0.5) * 3.0, fl = step(uFlower.x, cc) * step(cc, uFlower.y);   // the last straight: saffron, bleached green, white and faded blue, mixed
  c = mix(c, mix(mix(vec3(0.905, 0.539, 0.011), vec3(0.397, 0.456, 0.102), step(0.36, h)), mix(vec3(0.80, 0.78, 0.68), vec3(0.158, 0.328, 0.552), step(0.82, h)), step(0.62, h)), fl);
  float bw = step(uBlue.x, cc) * step(cc, uBlue.y);                                    // the run after the bridge: blue and white only
  c = mix(c, mix(vec3(0.115, 0.27, 0.56), vec3(0.80, 0.79, 0.72), step(0.5, h)), bw);
  return c * (0.82 + 0.3 * fmH1(cell * 9.1 + side * 3.0)); }
// a tree's shade on whatever lies under it: tr = (x, crown height, z, radius), 0 radius = no tree
float fmTreeShade(vec3 P, vec4 tr){
  vec3 Qt = P + uSun * (max(tr.y - P.y, 0.0) / max(uSun.y, 0.05)); float dt = length(Qt.xz - tr.xz) / max(tr.w, 0.01);
  float dap = fmN2(Qt.xz * 0.55 + vec2(sin(uTime * 0.6), cos(uTime * 0.47)) * 0.22) * 0.65 + fmN2(Qt.xz * 1.7 + vec2(cos(uTime * 0.9), sin(uTime * 0.8)) * 0.15) * 0.35;
  return 1.0 - step(1e-3, tr.w) * (1.0 - smoothstep(0.78, 1.05, dt + (dap - 0.5) * 0.3)) * (1.0 - 0.75 * smoothstep(0.42, 0.62, dap)) * 0.9; }
// sun visibility, cloth tint (zero where no cloth is overhead) and sky openness at local point P
// (off = lane-centre lateral offset there)
void fmSunEx(vec3 P, float off, out float vis, out vec3 tint, out float sky){
  float t = max(3.3 - P.y, 0.0) / max(uSun.y, 0.05);
  vec3 Q = P + uSun * t;
  float sq = uLen * 0.5 - Q.z, xq = Q.x - off, xp = abs(P.x - off);
  float cell = floor(sq / 3.0);
  float dL = fmCellD(cell, -1.0), dR = fmCellD(cell, 1.0);
  float oL = fmOpenD(dL), oR = fmOpenD(dR);
  float cc = (cell + 0.5) * 3.0; vec4 g = fmGap(cc);   // cells with no cloth, and with no wall either
  oL = max(oL, g.x); oR = max(oR, g.y);
  float cl = mix((xq + 3.5) - 4.0 * cos(fmAngleD(oL, dL)), 9.0, g.x);
  float cr = mix((3.5 - xq) - 4.0 * cos(fmAngleD(oR, dR)), 9.0, g.y);
  float f = fract(sq / 3.0) * 3.0;
  float slit = (1.0 - smoothstep(0.02, 0.07, min(f, 3.0 - f))) * 0.8;
  float inside = step(0.0, sq) * step(sq, uLen) * step(P.y, 3.3) * step(xp, 4.8);
  float v = max(smoothstep(-0.10, 0.10, min(cl, cr)), slit);
  float nowall = mix(g.w, g.z, step(xq, 0.0));
  v *= 1.0 - smoothstep(3.42, 3.6, abs(xq)) * (1.0 - nowall);
  vis = mix(1.0, v, inside);
  float pick = step(cl, cr), oc = mix(oR, oL, pick);
  vec3 mean = (uPal[0] + uPal[1] + uPal[2] + uPal[3]) * 0.25;
  tint = mix(mix(fmClothCol(cell, 1.0), fmClothCol(cell, -1.0), pick), mean, 0.45) * (1.0 - oc * oc) * inside * (1.0 - v);
  sky = mix(1.0, max(v, 0.5 * (oL + oR)) * (1.0 - 0.8 * smoothstep(3.5, 4.5, xp) * (1.0 - nowall)), inside);
  // the hall: no sun but through three slits in the roof and in at the two mouths; a little sky near the mouths
  float hk = fmHallK(P, off);
  vec3 Qr = P + uSun * (max(8.6 - P.y, 0.0) / max(uSun.y, 0.05));
  float sr = uLen * 0.5 - Qr.z, xr = abs(Qr.x - off), fsl = abs(fract((sr - uHall.x - 3.0) / 18.0) - 0.5) * 18.0;
  float hv = (1.0 - smoothstep(0.55, 0.8, fsl)) * (1.0 - smoothstep(2.3, 2.7, xr)) * step(uHall.x + 6.0, sr) * step(sr, uHall.y - 6.0);
  // the hall's roof is glazed between iron bars: whitewashed glass lets a quarter of the sun through, and the bars lay a lattice of shade
  float gbx = (0.5 - abs(fract(xr / 1.43) - 0.5)) * 1.43, gbs = (0.5 - abs(fract((sr - uHall.x) / 1.5) - 0.5)) * 1.5;
  hv = max(hv, 0.25 * smoothstep(0.05, 0.13, min(gbx, gbs)) * step(xr, 4.3) * step(uHall.x, sr) * step(sr, uHall.y));
  hv = max(hv, (1.0 - step(uHall.x, sr) * step(sr, uHall.y)) * step(xr, 5.0));
  float sp0 = uLen * 0.5 - P.z, mouth = exp(-max(min(sp0 - uHall.x, uHall.y - sp0), 0.0) * 0.16);
  vis = mix(vis, hv, hk); tint *= 1.0 - hk; sky = mix(sky, max(max(hv * 0.5, mouth * 0.7), 0.45), hk);
  vis *= fmTreeShade(P, uTree) * fmTreeShade(P, uTree2);
  // the open square: the house fronts on the sun's side lay their shade across its edge (uYard = s0, s1, front x, eaves height)
  float px0 = P.x - off, yk = step(uYard.x, sp0) * step(sp0, uYard.y) * step(abs(px0), uYard.z - 0.05);
  float eav = uYard.w + 3.2 * step(0.5, fmH1(floor((sp0 + 2.0 * uSun.z / max(uSun.y, 0.2)) / 7.5) + 3.0));
  float hr = P.y + (uYard.z - px0 * sign(uSun.x)) / max(abs(uSun.x), 0.02) * uSun.y;
  vis *= 1.0 - yk * (1.0 - smoothstep(eav - 0.5, eav + 0.5, hr));
  // slow cloud shadows drifting over the open square, its house fronts and its roofs
  vec2 cq = vec2(P.x * 0.8 + P.z * 0.6, P.z * 0.8 - P.x * 0.6);
  float cdk = 0.5 + 0.5 * sin(cq.x * 0.15 + 1.1 * sin(cq.y * 0.11 + 1.7) - uTime * 0.42);
  float ck = smoothstep(uYard.x - 14.0, uYard.x + 2.0, sp0) * (1.0 - smoothstep(uYard.y - 4.0, uYard.y + 10.0, sp0));
  vis *= 1.0 - 0.42 * ck * smoothstep(0.6, 0.86, cdk);
}
// market umbrellas standing in the square, uUmb[i] = (x, z, radius, rim height): x = how much sun they let through to the ground at P, y = the pools of their bulbs
vec2 fmUmb(vec3 P){
  float sh = 1.0, lamp = 0.0; vec2 so = uSun.xz / max(uSun.y, 0.25);
  for (int i = 0; i < 16; i++) { vec4 q = uUmb[i]; float on = step(0.5, q.z), r = max(q.z, 0.01);
    vec2 d = P.xz - q.xy + so * q.w, e = P.xz - q.xy;
    sh *= 1.0 - 0.85 * on * (1.0 - smoothstep(r * 0.8, r * 1.08, length(d)));
    lamp += on * exp(-dot(e, e) * 0.10); }
  return vec2(sh, lamp);
}
void fmSun(vec3 P, float off, out float vis, out vec3 tint){ float sky; fmSunEx(P, off, vis, tint, sky); }
vec3 fmShade(vec3 alb, vec3 N, vec3 P, float off){
  float vis, sky; vec3 tint; fmSunEx(P, off, vis, tint, sky);
  float ndl = max(dot(N, uSun), 0.0), up = N.y * 0.5 + 0.5;
  vec3 L = uSunCol * ndl * vis;
  L += tint * uSunCol * (0.07 + 0.17 * up) * uTintK;
  float hk = fmHallK(P, off);
  L += mix(uShade * mix(1.0, 0.8, hk), uSkyCol, 0.1 + 0.75 * sky) * (0.35 + 0.65 * up);
  L += uSunCol * vec3(0.20, 0.17, 0.12) * max(vis, sky * 0.55) * (0.3 + 0.7 * (1.0 - up));
  float xp = abs(P.x - off), sp = uLen * 0.5 - P.z;   // bare-bulb warmth deep in the shopfronts
  L += vec3(0.40, 0.25, 0.10) * smoothstep(3.55, 4.1, xp) * step(xp, 4.8) * step(P.y, 3.3) * step(0.0, sp) * step(sp, uLen) * (0.45 + 0.55 * up);
  float bx = (fract(sp / 3.0) - 0.5) * 3.0;            // lamp light pools round each stall's bulb, dim between stalls and over the rails
  float pool = (0.25 + 1.2 * exp(-bx * bx * 0.9)) * mix(0.5, 1.0, smoothstep(0.6, 2.4, xp)) * (1.0 - 0.5 * smoothstep(1.2, 3.3, P.y));
  float cellp = floor(sp / 3.0) + step(P.x, off) * 0.5;   // bare bulbs waver a little, each at its own pace
  pool *= 0.91 + 0.09 * sin(uTime * (4.0 + 5.0 * fmH1(cellp * 2.0 + 3.0)) + cellp * 4.7);
  float brK = step(uBridge.x - 2.0, sp) * step(sp, uBridge.y + 2.0) * step(xp, 2.9);   // the trestle's deck and rails, under their own bulbs
  L += uLamp * step(xp, 4.9) * max(step(P.y, 4.6), brK) * step(-1.0, sp) * step(sp, uLen + 1.0) * (0.4 + 0.6 * up) * pool * (1.0 + 2.2 * brK * smoothstep(1.0, 2.5, P.y));
  // the square: bulbs under the umbrellas and strings of bulbs across it, warm on the stalls and the house fronts
  float yk2 = smoothstep(uYard.x - 1.0, uYard.x + 3.0, sp) * (1.0 - smoothstep(uYard.y - 3.0, uYard.y + 1.0, sp));
  L += uLamp * yk2 * step(4.9, xp) * step(xp, uYard.z + 1.5) * (1.0 - smoothstep(3.4, 9.0, P.y)) * (0.4 + 0.6 * up) * (0.5 + 0.55 * exp(-(xp - 8.2) * (xp - 8.2) * 0.04));
  // the square's house fronts take the light of the bulb strings and of a bulb under each sign band; the corner houses that face the train too
  float fbx = (fract(sp / 3.2) - 0.5) * 3.2, frontK = smoothstep(uYard.z - 2.6, uYard.z - 0.4, xp) * step(xp, uYard.z + 1.5);
  L += uLamp * yk2 * frontK * (1.0 - smoothstep(2.5, 11.0, P.y)) * (0.55 + 0.75 * exp(-fbx * fbx * 0.8) * (1.0 - smoothstep(2.0, 6.0, P.y))) * 0.85;
  float cfx = (fract(xp / 3.2) - 0.5) * 3.2;
  L += uLamp * smoothstep(uYard.y - 3.6, uYard.y - 1.0, sp) * step(sp, uYard.y + 0.3) * step(4.9, xp) * step(xp, uYard.z) * (1.0 - smoothstep(2.5, 11.5, P.y)) * (0.42 + 0.8 * exp(-cfx * cfx * 0.8) * (1.0 - smoothstep(2.0, 6.0, P.y)));
  // the station: a row of lamps under the platform canopy, two lamp standards in the yard
  float px = P.x - off, stK = smoothstep(uLen + 6.0, uLen + 11.0, sp) * (1.0 - smoothstep(uLen + 58.0, uLen + 64.0, sp));
  float pk = (fract((sp - uLen - 10.5) / 7.0 + 0.5) - 0.5) * 7.0;
  L += uLamp * stK * smoothstep(1.0, 2.6, px) * (1.0 - smoothstep(8.6, 13.0, px)) * (1.0 - smoothstep(3.7, 4.6, P.y)) * (0.45 + 0.55 * up) * (0.5 + 1.2 * exp(-pk * pk * 0.14));
  vec2 dl1 = vec2(px + 5.6, sp - uLen - 27.0), dl2 = vec2(px + 5.6, sp - uLen - 42.5);
  L += uLamp * step(P.y, 5.0) * 1.5 * (exp(-dot(dl1, dl1) * 0.022) + exp(-dot(dl2, dl2) * 0.022)) * (0.4 + 0.6 * up);
  // the hall's paper lanterns: three rows under the trusses, warm on the stalls and the walls, fading into the roof
  float lrow = 0.7 + 0.3 * exp(-min(min(abs(P.x - off), abs(P.x - off - 2.4)), abs(P.x - off + 2.4)) * 0.9), lk = fract(sp / 6.0) - 0.5;
  L += max(uHallLamp - uLamp * 0.6, vec3(0.0)) * hk * (0.45 + 0.55 * up + 0.9 * (1.0 - up) * smoothstep(6.0, 7.6, P.y)) * lrow * (0.7 + 0.5 * exp(-lk * lk * 14.0)) * (1.0 - 0.42 * smoothstep(3.4, 5.0, xp))
    * (0.93 + 0.07 * sin(uTime * 2.3 + floor(sp / 6.0) * 2.1));
  L += uSunCol * vec3(0.055, 0.047, 0.035) * hk * (1.0 - 0.4 * up);   // daylight from the roof slits and the two mouths, thrown back up off the floor
  // the level crossing in front of the lane: a street-lamp pool on the road, and the two warning lamps winking in turn
  float rd = sp + 6.0, road = (1.0 - smoothstep(-0.6, 0.4, sp)) * (0.4 + 0.6 * up);
  L += uLamp * road * 1.1 * exp(-(rd * rd * 0.016 + xp * xp * 0.005)) * (1.0 - 0.7 * smoothstep(2.5, 9.0, P.y));
  vec2 dq = vec2(xp - 4.9, sp + 2.6);
  L += vec3(1.0, 0.07, 0.03) * (uLamp.r * 0.9 * road * (0.5 + 0.5 * sin(uTime * 4.4 + step(P.x, off) * 3.14159)) * exp(-dot(dq, dq) * 0.075));
  vec3 dp = P - uPortal.xyz;   // warm light spilling out of the portal onto the rails and ballast in front of it
  L += uPortalCol * (uPortal.w * exp(-length(dp.xz) * 0.085) * smoothstep(-1.0, 2.0, dp.z)) * (0.45 + 0.55 * up);
  return alb * L;
}
`;

// ---------------------------------------------------------------- geometry batch (vertex-coloured, flat or smooth)
const BOX_F = [[3, 2, 6, 7, 0, 0, 1], [1, 0, 4, 5, 0, 0, -1], [2, 1, 5, 6, 1, 0, 0], [0, 3, 7, 4, -1, 0, 0], [7, 6, 5, 4, 0, 1, 0], [0, 1, 2, 3, 0, -1, 0]];
const BOX_X = [-1, 1, 1, -1, -1, 1, 1, -1], BOX_Z = [-1, -1, 1, 1, -1, -1, 1, 1];
export class Batch {
  // vertex data goes straight into typed arrays that grow by doubling (five push() calls a vertex were a fifth of the build)
  constructor(offFn, len) { this.cap = 2048; this.P = new Float32Array(this.cap * 3); this.N = new Float32Array(this.cap * 3); this.C = new Float32Array(this.cap * 3); this.L = new Float32Array(this.cap * 3); this.A = new Float32Array(this.cap * 4);
    this.icap = 8192; this.I = new Uint32Array(this.icap); this.ni = 0; this.nv = 0;
    this.off = offFn; this.len = len; this.mat = 0; this.anim = [0, 0, 0, 0]; this.M = new THREE.Matrix4(); this.aux = 0; }
  _grow() { const c = this.cap * 2, g = (a, k) => { const b = new Float32Array(c * k); b.set(a); return b; };
    this.P = g(this.P, 3); this.N = g(this.N, 3); this.C = g(this.C, 3); this.L = g(this.L, 3); this.A = g(this.A, 4); this.cap = c; }
  // v: local-space position (before lane offset), nrm: normal, col: THREE.Color-ish {r,g,b}
  vert(x, y, z, nx, ny, nz, r, g, b) {
    const e = this.M.elements, v = this.nv; if (v >= this.cap) this._grow();
    let X = x, Y = y, Z = z, NX = nx, NY = ny, NZ = nz;
    if (!(e[0] === 1 && e[5] === 1 && e[10] === 1 && e[12] === 0 && e[13] === 0 && e[14] === 0 && e[1] === 0 && e[2] === 0 && e[4] === 0 && e[6] === 0 && e[8] === 0 && e[9] === 0)) {
      X = e[0] * x + e[4] * y + e[8] * z + e[12]; Y = e[1] * x + e[5] * y + e[9] * z + e[13]; Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      NX = e[0] * nx + e[4] * ny + e[8] * nz; NY = e[1] * nx + e[5] * ny + e[9] * nz; NZ = e[2] * nx + e[6] * ny + e[10] * nz; }
    const il = 1 / (Math.sqrt(NX * NX + NY * NY + NZ * NZ) || 1), o = this.off(this.len * 0.5 - Z), i3 = v * 3, i4 = v * 4, A = this.anim;
    const P = this.P, N = this.N, C = this.C, L = this.L, An = this.A;
    P[i3] = X + o; P[i3 + 1] = Y; P[i3 + 2] = Z; N[i3] = NX * il; N[i3 + 1] = NY * il; N[i3 + 2] = NZ * il; C[i3] = r; C[i3 + 1] = g; C[i3 + 2] = b;
    L[i3] = o; L[i3 + 1] = this.mat; L[i3 + 2] = this.aux; An[i4] = A[0]; An[i4 + 1] = A[1]; An[i4 + 2] = A[2]; An[i4 + 3] = A[3];
    return this.nv++;
  }
  _idx(n) { if (this.ni + n > this.icap) { this.icap *= 2; const b = new Uint32Array(this.icap); b.set(this.I); this.I = b; } }
  tri(a, b, c) { this._idx(3); const I = this.I, k = this.ni; I[k] = a; I[k + 1] = b; I[k + 2] = c; this.ni = k + 3; }
  quad(a, b, c, d) { this._idx(6); const I = this.I, k = this.ni; I[k] = a; I[k + 1] = b; I[k + 2] = c; I[k + 3] = a; I[k + 4] = c; I[k + 5] = d; this.ni = k + 6; }
  get tris() { return this.ni / 3; }
  // box with optional top taper (tx,tz scale of the top face), colour darkened toward the bottom
  box(cx, cy, cz, sx, sy, sz, col, tx = 1, tz = 1, shade = 0.82) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, r = col.r, g = col.g, b = col.b, rs = r * shade, gs = g * shade, bs = b * shade, lowTop = hy < 0;
    for (let f = 0; f < 6; f++) {
      const F = BOX_F[f], nx = F[4], ny = F[5], nz = F[6]; let i0 = 0;
      for (let k = 0; k < 4; k++) { const q = F[k], top = q > 3, kx = top ? tx : 1, kz = top ? tz : 1, dark = top === lowTop;
        const id = this.vert(cx + BOX_X[q] * hx * kx, cy + (top ? hy : -hy), cz + BOX_Z[q] * hz * kz, nx, ny, nz, dark ? rs : r, dark ? gs : g, dark ? bs : b); if (k === 0) i0 = id; }
      this.quad(i0, i0 + 1, i0 + 2, i0 + 3);
    }
  }
  // cylinder / cone frustum along Y from y0 to y1, smooth sides
  cyl(cx, y0, cz, r0, r1, h, seg, col, cap = true, shade = 0.85, col2 = null) {
    const base = this.nv, c2 = col2 || col;
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), sl = (r0 - r1) / (h || 1);
      this.vert(cx + ca * r0, y0, cz + sa * r0, ca, sl, sa, col.r * shade, col.g * shade, col.b * shade);
      this.vert(cx + ca * r1, y0 + h, cz + sa * r1, ca, sl, sa, c2.r, c2.g, c2.b);
    }
    for (let k = 0; k < seg; k++) { const a = base + k * 2; this.quad(a, a + 1, a + 3, a + 2); }
    if (cap && r1 > 1e-4) {
      const c = this.vert(cx, y0 + h, cz, 0, 1, 0, c2.r, c2.g, c2.b), b2 = this.nv;
      for (let k = 0; k <= seg; k++) { const a = (k / seg) * Math.PI * 2; this.vert(cx + Math.cos(a) * r1, y0 + h, cz + Math.sin(a) * r1, 0, 1, 0, c2.r, c2.g, c2.b); }
      for (let k = 0; k < seg; k++) this.tri(c, b2 + k + 1, b2 + k);
    }
  }
  // low-poly ellipsoid: lat rings x lon segments, smooth; half=true makes a dome
  blob(cx, cy, cz, rx, ry, rz, col, lon = 5, lat = 3, half = false, topCol = null) {
    const base = this.nv, tc = topCol || col;
    for (let j = 0; j <= lat; j++) {
      const ph = half ? (j / lat) * Math.PI * 0.5 : (j / lat) * Math.PI - Math.PI / 2, cp = Math.cos(ph), sp = Math.sin(ph);
      const t = half ? j / lat : (sp * 0.5 + 0.5), s = 0.72 + 0.28 * t;
      for (let k = 0; k <= lon; k++) {
        const a = (k / lon) * Math.PI * 2 + j * 0.3, x = Math.cos(a) * cp, z = Math.sin(a) * cp;
        this.vert(cx + x * rx, cy + sp * ry, cz + z * rz, x / rx, sp / ry, z / rz, (col.r + (tc.r - col.r) * t) * s, (col.g + (tc.g - col.g) * t) * s, (col.b + (tc.b - col.b) * t) * s);
      }
    }
    for (let j = 0; j < lat; j++) for (let k = 0; k < lon; k++) { const a = base + j * (lon + 1) + k, b = a + lon + 1; this.quad(a, b, b + 1, a + 1); }
  }
  // tube through points [[x,y,z],...] with radius r, `seg` sides
  tube(pts, r, seg, col) {
    const base = this.nv, n = pts.length, T = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3();
    for (let j = 0; j < n; j++) {
      const a = pts[Math.max(0, j - 1)], b = pts[Math.min(n - 1, j + 1)];
      T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      U.set(0, 1, 0); if (Math.abs(T.y) > 0.9) U.set(1, 0, 0);
      V.crossVectors(T, U).normalize(); U.crossVectors(V, T);
      for (let k = 0; k < seg; k++) {
        const an = (k / seg) * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an);
        const nx = U.x * ca + V.x * sa, ny = U.y * ca + V.y * sa, nz = U.z * ca + V.z * sa;
        this.vert(pts[j][0] + nx * r, pts[j][1] + ny * r, pts[j][2] + nz * r, nx, ny, nz, col.r, col.g, col.b);
      }
    }
    for (let j = 0; j < n - 1; j++) for (let k = 0; k < seg; k++) { const a = base + j * seg + k, b = base + j * seg + (k + 1) % seg; this.quad(a, b, b + seg, a + seg); }
  }
  build() {
    const g = new THREE.BufferGeometry(), nv = this.nv;
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.slice(0, nv * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, nv * 3), 3));
    g.setAttribute('aLane', new THREE.BufferAttribute(this.L.slice(0, nv * 3), 3));
    g.setAttribute('aAnim', new THREE.BufferAttribute(this.A.slice(0, nv * 4), 4));
    g.setIndex(nv > 65535 ? new THREE.BufferAttribute(this.I.slice(0, this.ni), 1) : new THREE.BufferAttribute(new Uint16Array(this.I.subarray(0, this.ni)), 1));
    g.computeBoundingSphere(); g.boundingSphere.radius += 3;
    return g;
  }
}

// ---------------------------------------------------------------- materials
const FOG_V = '#include <common>\n#include <fog_pars_vertex>\n';
const FOG_F = '#include <common>\n#include <fog_pars_fragment>\n';
function mkMat(U, vertexShader, fragmentShader, extra = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...(extra.uniforms || {}) }, vertexShader, fragmentShader, fog: true,
    vertexColors: !!extra.vertexColors, side: extra.side ?? THREE.FrontSide, transparent: !!extra.transparent, depthWrite: extra.depthWrite ?? true, blending: extra.blending ?? THREE.NormalBlending });
}

// props, walls, goods, rails, railcar: one shader, material id per vertex
// aLane = (laneOffset, matId, aux)   aAnim = (anchorS, kind, param, phase)
// matId 0 matte | 1 emissive (x aux) | 2 wet/glossy with glints | 3 metal | 4 fruit heap (aux = cells per metre) | 5 plaster
// kind 0 static | 1 slides sideways by param when the wave arrives | 2 swings about (anchorS, y=param) | 3 wire, widened with distance
// kind 4 hanging cloth | 5 flag | 6 a lamp that winks with the level crossing (phase in w)
export function propMaterial(U, shift) {
  const vs = FOG_V + FM_GLSL + /* glsl */`
attribute vec3 aLane; attribute vec4 aAnim; uniform vec3 uShift; uniform float uLocalTex;
varying vec3 vP, vN, vC, vL, vT;
void main(){
  vec3 p = position; vec3 n = normal;
  float d = aAnim.x - uCamS;
  if (aAnim.y > 0.5 && aAnim.y < 1.5) {
    float k = (1.0 - smoothstep(uLead + 5.0, uLead + 11.0, d + aAnim.w)) * smoothstep(-15.0, -9.0, d + aAnim.w);
    p.x += aAnim.z * k; p.y += 0.03 * sin(k * 3.14159) ;
  } else if (aAnim.y > 1.5 && aAnim.y < 2.5) {
    float A = d < 0.0 ? exp(d * 0.09) : (1.0 - smoothstep(0.0, 7.0, d)) ;
    float g2 = (aAnim.y - 2.0) * 10.0;   // kind 2.1 and so on: a wider pendulum sway of its own (the hall's lanterns)
    float an = 0.42 * A * sin(-d * 1.25 + aAnim.w) + 0.035 * (1.0 + g2) * sin(uTime * 1.9 + aAnim.w * 7.0) + 0.03 * g2 * sin(uTime * 3.3 + aAnim.w * 3.0);
    float amb = step(aAnim.x, 0.0);   // out at the lane mouth (anchor before the first awning) they hang in the open wind all the time
    an += amb * 0.07 * sin(uTime * 1.3 + aAnim.w * 3.0);
    float pz = uLen * 0.5 - aAnim.x; float c = cos(an), s = sin(an);
    vec2 q = vec2(p.z - pz, p.y - aAnim.z);
    p.z = pz + q.x * c - q.y * s; p.y = aAnim.z + q.x * s + q.y * c;
    n.yz = vec2(n.y * c + n.z * s, n.z * c - n.y * s);
    p.x += amb * max(aAnim.z - p.y, 0.0) * (0.15 * sin(uTime * 1.4 + aAnim.w * 3.0 + p.y * 1.5) + 0.06 * sin(uTime * 3.1 + aAnim.w * 11.0));
  } else if (aAnim.y > 2.5 && aAnim.y < 3.5) {
    float dist = length(uCamL - (p + uShift));
    p += n * max(dist * 0.0011 - aAnim.z, 0.0);
  } else if (aAnim.y > 3.5 && aAnim.y < 4.5) {   // cloth hanging below y = aAnim.z (laundry, bunting, lanterns)
    float w = max(aAnim.z - p.y, 0.0), A = d < 0.0 ? exp(d * 0.12) : (1.0 - smoothstep(0.0, 7.0, d));
    p.z += (sin(uTime * 2.6 + aAnim.w + p.x * 2.0) * 0.32 + 0.10 * sin(uTime * 5.3 + aAnim.w * 3.0) + A * 0.5 * sin(-d * 1.1 + aAnim.w)) * w;
    p.x += cos(uTime * 2.1 + aAnim.w) * 0.07 * w;
  } else if (aAnim.y > 4.5 && aAnim.y < 5.5) {   // flag flying along x from a pole at lane x = aAnim.z
    float w = abs(p.x - aLane.x - aAnim.z);
    p.z += sin(uTime * 5.0 + aAnim.w - w * 4.0) * 0.27 * w; p.y += sin(uTime * 3.7 + aAnim.w - w * 3.0) * 0.09 * w - 0.07 * w * w;
  } else if (aAnim.y > 6.5 && aAnim.y < 7.5) {   // a sparrow on a front tray: a hop or two on the spot, then off to the back of the stall as the nose comes (param = side)
    float k = 1.0 - smoothstep(6.0, 11.0, d), hp = max(sin(uTime * 7.0 + aAnim.w * 9.0), 0.0) * step(0.55, sin(uTime * 0.8 + aAnim.w * 5.0));
    p.y += 0.04 * hp * hp * (1.0 - k) + 0.5 * sin(k * 3.14159) + 0.25 * k; p.x += aAnim.z * 0.92 * k; p.z -= 0.45 * k;
  } else if (aAnim.y > 7.5 && aAnim.y < 8.5) {   // a pigeon feeding on the rails (param = the ground under it): it pecks, and is up and away as the flock bursts
    float pk = max(sin(uTime * (2.3 + 0.9 * fract(aAnim.w * 3.1)) + aAnim.w * 7.0), 0.0); pk *= pk; pk *= pk;
    float hd = smoothstep(0.10, 0.17, p.y - aAnim.z); p.y -= pk * 0.085 * hd;
    float k = 1.0 - smoothstep(14.0, 16.5, d); p.y += 0.9 * k * k - 60.0 * step(0.985, k);
  } else if (aAnim.y > 8.5 && aAnim.y < 9.5) {   // a sleeping cat's ear: now and then it flicks
    float fk = smoothstep(0.93, 1.0, sin(uTime * 1.1 + aAnim.w)) * sin(uTime * 31.0);
    p.x += 0.022 * fk * aAnim.z; p.y -= 0.008 * abs(fk);
  } else if (aAnim.y > 9.5 && aAnim.y < 10.5) {  // a drop of meltwater: it hangs on the bench's edge, lets go and falls (param = the drop to the ground)
    float ph = fract(uTime * (0.55 + 0.35 * fract(aAnim.w * 5.7)) + aAnim.w), f = max(ph - 0.35, 0.0) / 0.65;
    p.y -= f * f * aAnim.z;
  } else if (aAnim.y > 10.5 && aAnim.y < 11.5) { // a weed or a spray of morning glory between the sleepers (param = its root height): it stirs, and lies flat as the nose comes over
    float hgt = max(p.y - aAnim.z, 0.0), k = (1.0 - smoothstep(4.0, 8.5, d)) * (0.15 + 0.85 * smoothstep(-70.0, -25.0, d));
    p.x += hgt * 0.22 * sin(uTime * 2.1 + aAnim.w + p.z * 0.7) * (1.0 - k); p.z -= hgt * 1.5 * k; p.y -= hgt * 0.86 * k;
  }
  // a bulb's flex (matte, aux -1): a thin cord near the eye, kept a pixel and a half wide far off
  if (aLane.z < -0.5 && aLane.y < 0.5) p += normalize(n + vec3(0.0, 1e-5, 0.0)) * max(length(uCamL - (p + uShift)) * 0.0011 - 0.0075, 0.0);
  vP = p + uShift; vN = n; vC = color; vL = aLane;
  vT = uLocalTex > 0.5 ? position : vP;   // texture space: a moving mesh keeps its grain and glints fixed to itself
  if (aAnim.y > 5.5 && aAnim.y < 6.5) vC *= 0.12 + 0.88 * (0.5 + 0.5 * sin(uTime * 4.4 + aAnim.w));   // kind 6: a lamp that winks (phase aAnim.w)
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  const fs = FOG_F + FM_GLSL + /* glsl */`
uniform float uLocalTex, uLaneOff;
varying vec3 vP, vN, vC, vL, vT;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCamL - vP + vec3(0.0, 1e-4, 0.0));
  float m = vL.y; vec3 alb = vC; vec3 col;
  float off = uLocalTex > 0.5 ? uLaneOff : vL.x;   // moving meshes (cab, boat, tuk-tuks) are told the lane offset where they are
  float vis; vec3 tint; fmSun(vP, off, vis, tint);
  vec3 H = normalize(uSun + V); float ndh = max(dot(N, H), 0.0);
  if (m > 0.5 && m < 1.5) {
    col = alb * vL.z * (0.94 + 0.06 * sin(uTime * 4.1 + vT.z * 0.9 + vT.x * 0.7) * sin(uTime * 2.7 + vT.z * 1.3));   // bulbs and paper lanterns waver a little
  } else if (m > 3.5 && m < 4.5) {
    // cellular heap of fruit: every cell a little lit sphere
    vec2 uv = (vP.xz + vP.y * vec2(0.7, 0.45)) * vL.z; vec2 ic = floor(uv), fc = fract(uv);
    float best = 9.0; vec2 bo = vec2(0.0); float bh = 0.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)); float h = fmH2(ic + g);
      vec2 o = g + vec2(h, fract(h * 17.3)) * 0.8 + 0.1 - fc; float dd = dot(o, o);
      if (dd < best) { best = dd; bo = o; bh = h; }
    }
    float r = clamp(1.0 - best * 2.2, 0.0, 1.0);
    alb *= (0.55 + 0.6 * fract(bh * 7.7)) * (0.25 + 0.85 * sqrt(r));
    alb = mix(alb, alb.grb * vec3(0.8, 1.0, 0.6), step(0.86, bh) * 0.8);
    vec3 n2 = normalize(N + vec3(-bo.x, 0.0, -bo.y) * 1.3);
    col = fmShade(alb, n2, vP, off);
    float sp = max(dot(n2, H), 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    col += uSunCol * sp * sp * 0.5 * vis;
  } else {
    if (m > 4.5 && m < 5.5) {
      // rain streaks run straight down the wall, strongest in the metre and a half under each floor line; a faint cloudiness besides
      float alw = vP.z * abs(N.x) + vP.x * abs(N.z), flr = fract((vP.y - 4.6) / 3.2 + 1.0);
      float st = mix(1.0, fmN2(vec2(alw * 1.4, vP.y * 0.12)), 0.45 + 0.55 * smoothstep(0.5, 1.0, flr));
      float bl = fmN2(vec2(alw, vP.y) * 0.9);
      float peel = smoothstep(0.74, 0.8, fmN2(vP.zy * 1.7 + vP.x + 13.0) + 0.25 * fmN2(vP.zy * 7.0));
      alb = mix(alb, vec3(0.42, 0.40, 0.36), peel * 0.5);
      alb *= 0.86 * (0.82 + 0.16 * st) * (0.9 + 0.14 * bl);
      alb *= 0.6 + 0.4 * smoothstep(0.0, 1.1, vP.y);
    } else {
      if (m > 6.5 && m < 7.5) alb = vL.z > 1.5 ? vec3(0.30, 0.06, 0.04) : vec3(0.06, 0.08, 0.10);   // glass: the colour channels carry (pane u, v, window hash)
      alb *= 0.86 + 0.28 * fmN2(vT.xz * 9.0 + vT.y * 9.0);
      if (m > 5.5 && m < 6.5) alb *= 1.0 - 0.6 * step(0.3, fract((vP.x + vP.z) * 10.0)) * step(0.32, fract(vP.y * 9.0)) * (1.0 - abs(N.y));
      if (m > 7.5 && m < 8.5) { float sf = fract(vP.y * 11.0);
        alb *= 0.5 + 0.5 * smoothstep(0.0, 0.12, sf) * (1.0 - 0.35 * smoothstep(0.5, 1.0, sf));
        float al = vP.z * abs(N.x) + vP.x * abs(N.z), bh = fmH1(floor(al / 3.0) * 3.7 + 1.3), band = step(1.72, vP.y) * step(vP.y, 2.38) * step(abs(N.y), 0.5) * step(0.25, bh);
        vec3 ink = bh < 0.5 ? vec3(0.50, 0.07, 0.05) : (bh < 0.75 ? vec3(0.08, 0.20, 0.42) : vec3(0.62, 0.50, 0.08));
        float edge = step(0.06, abs(vP.y - 2.05) - 0.24), let = step(0.42, fmH2(floor(vec2(al * 4.5, vP.y * 5.0)))) * step(abs(vP.y - 2.05), 0.2) * step(0.2, fract(al * 4.5));
        alb = mix(alb, mix(mix(vec3(0.60, 0.57, 0.46), ink, let), ink, 1.0 - edge) * (0.75 + 0.25 * smoothstep(0.0, 0.12, sf)), band * 0.85);
        N = normalize(N + vec3(0.0, (sf - 0.45) * 1.1, 0.0)); }
    }
    col = fmShade(alb, N, vP, off);
    { float sq = uLen * 0.5 - vP.z, xq = abs(vP.x - off);   // by day the square's shopfronts stand in the shade of their own awnings
      col *= 1.0 - 0.42 * step(uYard.x, sq) * step(sq, uYard.y) * step(uYard.z - 1.2, xq) * step(xq, uYard.z + 1.0) * (1.0 - smoothstep(2.5, 3.0, vP.y)) * smoothstep(0.5, 1.4, uSunCol.g); }
    if (m > 6.5 && m < 7.5) {
      float fr = 1.0 - abs(dot(N, V)); fr *= fr;
      vec2 wf = fract(vC.rg); float wid = floor(vC.r) * 7.3 + floor(vC.b * 1024.0 + 0.5) / 1024.0 * 37.0, h1 = fmH1(wid + 1.0), h2 = fmH1(wid + 5.0);
      float bar = smoothstep(0.035, 0.06, abs(wf.x - 0.5)) * smoothstep(0.02, 0.04, abs(wf.y - 0.62));       // mullion cross and frame
      bar *= smoothstep(0.03, 0.07, min(wf.x, 1.0 - wf.x)) * smoothstep(0.02, 0.05, min(wf.y, 1.0 - wf.y));
      vec3 cur = h1 < 0.5 ? vec3(1.0, 0.74, 0.42) : (h1 < 0.72 ? vec3(1.0, 0.56, 0.34) : (h1 < 0.9 ? vec3(0.78, 0.86, 0.5) : vec3(0.55, 0.75, 1.0)));   // curtain tint
      float drape = 0.45 + 0.55 * smoothstep(0.0, 0.05, abs(wf.x - (0.25 + 0.5 * h2)) - 0.1 - 0.16 * h1);    // a curtain drawn part of the way
      drape *= 0.62 + 0.38 * smoothstep(0.0, 0.5, wf.y) * (0.8 + 0.2 * sin(wf.x * 40.0 + h2 * 9.0));
      float litw = step(0.5, vL.z) * step(0.22 - uLamp.r * 0.4, fmH1(wid + 9.0));
      float tv = step(0.8, h2) * step(vL.z, 1.5);   // one lit room in five has a television on: a cool glow that wanders slowly
      cur = mix(cur, vec3(0.45, 0.68, 1.0) * (0.6 + 0.4 * sin(uTime * 2.1 + h1 * 40.0) * sin(uTime * 0.83 + h2 * 20.0)), tv * 0.85);
      vec3 frame = col * (vL.z > 1.5 ? vec3(2.2, 6.0, 3.0) : vec3(5.0, 3.5, 2.4));
      col = col * 0.6 + uSkyCol * (0.25 + 0.9 * fr) + uLamp * (vL.z > 1.5 ? vec3(2.4, 1.2, 0.5) : vec3(2.0, 1.45, 0.8) * cur) * litw * drape;
      col = mix(frame, col, bar);
    }
    if (m > 1.5 && m < 2.5) {
      float s2 = ndh * ndh; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;
      vec3 cq = floor(vT * 38.0);
      float fl = sin(fmH1(cq.x + cq.y * 57.0 + cq.z * 113.0) * 40.0 + dot(V, vec3(13.0, 7.0, 11.0)) * 5.0 + uTime * 0.7);
      fl = max(fl, 0.0); fl *= fl; fl *= fl; fl *= fl; fl *= fl; fl *= fl;
      col += uSunCol * (s2 * 1.2 + fl * mix(0.4, 1.3, vis) * vL.z * smoothstep(0.2, 0.9, vL.z)) * (0.03 + 0.97 * vis) + uSkyCol * 0.25 * (1.0 - abs(dot(N, V))) ;
      col += alb * (uSkyCol * 0.7 + uShade * 0.12 + tint * uSunCol * 0.12) * step(0.9, vL.z);   // crushed ice keeps a pale body in the shade
    } else if (m > 8.5) {
      float s9 = ndh * ndh; s9 *= s9; s9 *= s9;
      float nl9 = max(dot(N, uSun), 0.0);
      col = col * 0.55 + alb * uSunCol * (s9 * 0.9 + nl9 * nl9 * 0.35) * vis + alb * uLamp * (2.2 + 1.6 * (1.0 - N.y * N.y));
    } else if (m > 2.5 && m < 3.5) {
      float s3 = ndh * ndh; s3 *= s3; s3 *= s3; s3 *= s3;
      col = col * 0.55 + alb * uSunCol * s3 * 2.2 * (0.1 + 0.9 * vis) + alb * uSkyCol * 0.5 * (1.0 - abs(dot(N, V)));
    }
  }
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <fog_fragment>
}`;
  return mkMat(U, vs, fs, { vertexColors: true, side: THREE.DoubleSide, uniforms: { uShift: { value: shift || new THREE.Vector3() }, uLocalTex: { value: shift ? 1 : 0 }, uLaneOff: { value: 0 } } });
}

// ---------------------------------------------------------------- awnings: one instanced cloth
function awningGeometry(nu, nv, lo) {
  const P = [], K = [], I = []; let n = 0;
  const W = 1.45, Lc = 4.0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { P.push(-W + (2 * W * i) / nu, 0, (Lc * j) / nv); K.push(0, 0, 0); n++; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + nu + 1; I.push(a, b, b + 1, a, b + 1, a + 1); }
  // scalloped valance hanging from the free edge
  const vs = nu * 2, vb = n;
  for (let i = 0; i <= vs; i++) { const u = -W + (2 * W * i) / vs; P.push(u, 0, Lc); K.push(2, 0, 0); P.push(u, 0, Lc); K.push(2, i % 2 ? 0.34 : 0.2, 0); n += 2; }
  for (let i = 0; i < vs; i++) { const a = vb + i * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  // the front flap: a scalloped skirt along the edge that faces the oncoming train. It hangs deep while the cloth is
  // shut, so the closed rows ahead read as a chevron wall of cloth across the lane, and is drawn up as the cloth lifts
  const fs = 8, fb = n;
  for (let j = 0; j <= fs; j++) { const v = (Lc * j) / fs, k = Math.min(1, j / 2) * (j % 2 ? 0.34 : 0.27); P.push(-W, 0, v); K.push(3, 0, 0); P.push(-W, 0, v); K.push(3, k, 0); n += 2; }
  for (let j = 0; j < fs; j++) { const a = fb + j * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  // two bamboo poles under the edges and a cross batten at the free edge
  const tube = (u0, v0, v1, r, alongU) => {
    const b = n, segs = 1;
    for (let j = 0; j <= segs; j++) for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.785, t = j / segs;
      if (alongU) P.push(-W + 2 * W * t, Math.sin(a) * r - r, v0 + Math.cos(a) * r); else P.push(u0 + Math.cos(a) * r, Math.sin(a) * r - r, v0 + (v1 - v0) * t);
      K.push(1, 0, Math.sin(a)); n++;
    }
    for (let j = 0; j < segs; j++) for (let k = 0; k < 4; k++) { const a = b + j * 4 + k, c = b + j * 4 + (k + 1) % 4; I.push(a, c, c + 4, a, c + 4, a + 4); }
  };
  tube(-W + 0.05, -0.15, Lc + 0.12, 0.03, false); tube(W - 0.05, -0.15, Lc + 0.12, 0.03, false); if (!lo) tube(0, Lc - 0.03, 0, 0.022, true);
  // the pull-cords: each a ribbon from a corner of the free edge up to a ring on the house wall (aK = 4, 0 at the cloth .. 1 at the wall, side of the ribbon)
  for (const u of [-W + 0.06, W - 0.06]) { const b = n; for (const e of [0, 1]) for (const sd of [-1, 1]) { P.push(u, 0, Lc); K.push(4, e, sd); n++; } I.push(b, b + 1, b + 3, b, b + 3, b + 2); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 3));
  g.setIndex(I);
  return g;
}

function awningMaterial(U) {
  const vs = FOG_V + FM_GLSL + /* glsl */`
attribute vec3 aK; attribute vec4 iA; attribute float iL;   // iL: how far this row's hinge is lifted (the rows that step down the trestle's ramp with the rails)
varying vec3 vP, vN, vN0; varying vec4 vUV; varying vec3 vI; varying float vSh, vO; varying vec3 vBase; varying vec4 vH;
float gD;   // this awning's distance ahead of the cab
vec3 awn(float u, float n, float v, float o, float ang, float cl){
  float sC = iA.x, side = iA.y, hsh = iA.w;
  float w = clamp(u / 1.45, -1.0, 1.0), mid = 1.0 - w * w, al = sin(3.14159 * clamp(v * 0.25, 0.0, 1.0));
  float mv = 4.0 * o * (1.0 - o);
  float v4 = clamp(v * 0.25, 0.0, 1.0), e2 = v4 * v4;
  float sag = -(0.30 + 0.14 * hsh) * mid * (0.3 + 0.7 * al) * (0.6 + 0.4 * hsh) * (1.0 - 0.6 * o) - uWet * 0.10 * mid * al * (1.0 - o);   // shut, the cloth hangs in a deep belly between its poles
  sag -= 0.15 * e2 * e2 * abs(sin(u * 3.25 + 1.57));                 // the free edge hangs in scallops between its ties
  float hq = 1.0 - 0.55 * step(uHold.x, sC) * step(sC, uHold.y);   // the rows that stand raised all the time hang smoother: taut cloth, not crumpled paper
  sag -= 0.45 * o * mid * e2 * hq;                                   // raised, the cloth bellies like a sail between its two poles
  sag += 0.12 * hq * o * sin(uTime * 3.77 + hsh * 40.0 + sC * 0.37) * mid * (0.25 + 0.75 * v4);   // and breathes slowly, each cell in its own time, so far rows are seen to move
  sag += 0.08 * o * exp(-max(uLead - gD, 0.0) / 9.0) * sin(uTime * 37.7 - v * 4.0 + u * 2.0 + hsh * 9.0) * mid * (0.3 + 0.7 * v4);   // a ripple runs down it after the snap and dies away
  sag += 0.022 * sin(u * 6.3 + hsh * 20.0) * (0.4 + 0.6 * al);       // soft folds running from hinge to edge
  float mouth = (1.0 - smoothstep(3.0, 20.0, sC)) * (1.0 - o);   // the first rows stand in the open wind off the crossing: shut, they luff harder
  sag += 0.09 * (1.0 + 0.9 * mouth) * sin(uTime * (1.3 + 0.8 * hsh) + hsh * 40.0) * mid * al * (1.0 - o);   // shut cloth breathes slowly
  float wind = 0.9 + 1.4 * o + 1.5 * mouth;
  float bil = (sin(uTime * (2.0 + hsh) - v * 1.7 + u * 0.8 + hsh * 40.0) * 0.06 * (0.3 + 0.7 * v4) + sin(uTime * 3.3 - v * 3.1 - u * 2.3 + hsh * 17.0) * 0.02) * wind;
  float shv = sin(uTime * 21.0 + v * 6.0 + u * 4.0 + hsh * 9.0) * 0.07 * mv;
  float nn = n + (sag + (bil + shv) * mid * (0.35 + al)) * cl;
  float r = v * cos(ang) - nn * sin(ang), h = v * sin(ang) + nn * cos(ang);
  return vec3(iA.z + side * (3.5 - r), 3.7 + iL + side * 0.08 + (hsh - 0.5) * 0.1 + h, uLen * 0.5 - (sC + u));
}
void main(){
  float side = iA.y, cell = floor(iA.x / 3.0);
  float d = fmCellD(cell, side), o = fmOpenD(d), ang = fmAngle(o); gD = d;
  float clearK = fmClearK(d);
  float xb = -14.0 - d; ang += -0.10 * sin(xb * 1.7) * exp(-max(xb, 0.0) * 0.4) * step(0.0, xb);
  ang += uGust.y * 0.13 * sin(uTime * 7.0 - iA.x * 0.5) * smoothstep(uLead + 8.0, uLead + 14.0, d) * (1.0 - smoothstep(uGust.x - 16.0, uGust.x, iA.x));
  ang += 0.035 * o * sin(uTime * 3.1 + iA.w * 40.0 + iA.x * 0.21);   // raised panels rock a little on their hinges
  ang = mix(ang, max(ang, uClear.x), clearK);   // the clearance rule (fmClearK): near the cab a panel that would hang too low over the line swings further up
  vSh = 0.0;
  float cl = aK.x > 0.5 && aK.x < 1.5 ? 0.0 : 1.0;
  vec3 p = awn(position.x, position.y, position.z, o, ang, cl);
  vec3 up = vec3(side * sin(ang), cos(ang), 0.0);
  vec3 n = up;
  if (aK.x < 0.5) {
    vec3 pu = awn(position.x + 0.12, position.y, position.z, o, ang, cl), pv = awn(position.x, position.y, position.z + 0.12, o, ang, cl);
    vec3 c = cross(pu - p, pv - p); n = normalize(c + up * 1e-5); if (dot(n, up) < 0.0) n = -n;
  } else if (aK.x > 3.5) {   // a pull-cord: taut from the cloth's corner to its ring on the house wall, widened with distance
    vec3 ring = vec3(iA.z + side * 5.02, 6.35 + iL + (iA.w - 0.5) * 0.5, p.z + position.x * 0.12);
    vec3 rd = ring - p; rd.z = 0.0; rd = normalize(rd + vec3(1e-4, 0.0, 0.0));
    p = mix(p, ring, aK.y); p += vec3(rd.y, -rd.x, 0.0) * aK.z * max(0.017, length(uCamL - p) * 0.0019);
    n = vec3(0.0, 1.0, 0.0); up = n;
  } else if (aK.x > 2.5) {
    float fl = sin(uTime * 3.1 + position.z * 3.0 + iA.w * 30.0);
    float drop = aK.y * (0.3 + uAwn.w * (1.0 - o));
    p.y -= drop; p.z += fl * 0.16 * drop + 0.25 * drop * sin(3.14159 * o); n = normalize(vec3(0.0, 0.3, 1.0));
    up = n;
  } else if (aK.x > 1.5) {
    float fl = sin(uTime * 4.3 + position.x * 5.0 + iA.w * 30.0);
    vSh = uWet * smoothstep(0.12, 0.3, o) * (1.0 - smoothstep(0.7, 0.9, o));   // sun-shower: water tips off the folding cloth in a bright sheet
    p.y -= aK.y * (1.6 + uAwn.z * (1.0 - o) + vSh * 8.0); p.x += fl * 0.12 * aK.y * (0.5 + o + 1.5 * (1.0 - o)); n = normalize(vec3(-side * 0.85, 0.5, 0.1 * fl));
    up = n;
  } else { n = normalize(up * (aK.z + 0.25) + vec3(0.0, 0.0, 0.3)); }
  vP = p; vN = n; vN0 = up; vO = o; vUV = vec4(position.x, position.z, aK.x, aK.y); vI = vec3(cell, side, iA.w);
  // the cloth colour and its two pattern hashes are worked out here, where cell, side and the instance hash are exact:
  // hashed per pixel from interpolated values they flipped colour pixel by pixel on some awnings
  float ccq = (cell + 0.5) * 3.0;
  vBase = fmClothCol(cell, side); vH = vec4(fmH1(iA.w * 91.0 + 3.0), fmH1(iA.w * 37.0 + 5.0), step(uFlower.x, ccq) * step(ccq, uFlower.y), step(uBlue.x, ccq) * step(ccq, uBlue.y));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  const fs = FOG_F + FM_GLSL + /* glsl */`
varying vec3 vP, vN, vN0; varying vec4 vUV; varying vec3 vI; varying float vSh, vO; varying vec3 vBase; varying vec4 vH;
void main(){
  float u = vUV.x, v = vUV.y, kind = vUV.z, hsh = vI.z;
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0)), V = normalize(uCamL - vP + vec3(0.0, 1e-4, 0.0));
  vec3 col;
  if (kind > 3.5) {
    col = vec3(0.44, 0.37, 0.24) * (uSunCol * 0.3 + uSkyCol * 0.6 + uLamp * 1.0);
  } else if (kind > 0.5 && kind < 1.5) {
    vec3 alb = vec3(0.50, 0.40, 0.19) * (0.75 + 0.25 * step(0.08, fract(v * 2.3 + hsh)));
    col = alb * (uSunCol * (0.25 + 0.6 * max(dot(N, uSun), 0.0)) + uSkyCol * 0.4 + uLamp * 0.7);
  } else {
    vec3 base = vBase;
    float h2 = vH.x, h3 = vH.y, runK = max(vH.z, vH.w);
    // every panel is striped, each in its own way: broad even stripes, pin stripes, or wide bands with a fine line beside them. The second colour is
    // cream on a coloured cloth and one of the roof's colours on a pale one (in the last straight the brief's four cloths, after the bridge blue on white)
    float pale = smoothstep(0.42, 0.52, dot(base, vec3(0.3, 0.6, 0.1)));
    vec3 dk = h3 < 0.5 ? uPal[3] : uPal[1]; dk = mix(dk, vec3(0.158, 0.328, 0.552), smoothstep(0.42, 0.52, dot(dk, vec3(0.3, 0.6, 0.1))));
    dk = mix(dk, h3 < 0.4 ? vec3(0.158, 0.328, 0.552) : (h3 < 0.7 ? vec3(0.397, 0.456, 0.102) : vec3(0.905, 0.539, 0.011)), vH.z); dk = mix(dk, vec3(0.115, 0.27, 0.56), vH.w);
    vec3 sCol = mix(vec3(0.80, 0.78, 0.70), dk, pale);
    float us = kind > 2.5 ? v * 0.9 - 1.8 : u, pat = mix(h2, 0.2, vH.w);
    float stA = smoothstep(0.22, 0.27, abs(fract(us * mix(1.6, 1.25, vH.w) + 0.25) - 0.5));
    float stB = 1.0 - smoothstep(0.07, 0.11, abs(fract(us * 2.2 + h3) - 0.5));
    float fc = abs(fract(us * 0.86 + 0.5 * h3) - 0.5), stC = max(smoothstep(0.27, 0.31, fc), (1.0 - smoothstep(0.012, 0.03, abs(fc - 0.19))) * 0.9);
    float stripe = pat < 0.4 ? stA : (pat < 0.72 ? stB : stC);
    base = mix(base, sCol, stripe * 0.92);
    // a pale cloth set carries one broad band of its saturated colour across every panel, so that its folds read as cloth
    if (kind < 0.5) base = mix(base, uPal[3], uBandK * (1.0 - smoothstep(0.23, 0.26, abs(v - 2.75 - 0.5 * h3))) * (1.0 - runK));
    // the hem: a band of the second colour along the free edge with a pale piping, and the scalloped valance under it in alternate teeth of the two colours
    vec3 hemC = mix(sCol, vBase, 0.12) * 0.9;
    if (kind < 0.5) { base = mix(base, hemC, smoothstep(3.50, 3.55, v)); base = mix(base, vec3(0.82, 0.80, 0.72), (1.0 - smoothstep(0.0, 0.03, abs(v - 3.5))) * 0.8); }
    if (kind > 1.5 && kind < 2.5) base = mix(hemC, vBase, step(0.5, fract(u * 2.07 + 0.25)));
    // the skirt that faces the oncoming train carries a broad border in the second colour along its scallops, so a shut row reads as dressed cloth
    if (kind > 2.5) base = mix(base, hemC, smoothstep(0.17, 0.185, vUV.w) * 0.92);
    vec2 pc = vec2((h2 - 0.5) * 1.8, 1.0 + h3 * 2.2), ps = vec2(0.25 + h3 * 0.35, 0.3 + h2 * 0.4);
    vec2 pd = abs(vec2(u, v) - pc) - ps; float inP = step(max(pd.x, pd.y), 0.0) * step(0.35, h3);
    float edge = inP * step(-0.035, max(pd.x, pd.y));
    base = mix(base, mix(mix(uPal[3], uPal[1], step(0.6, h2)), mix(vBase, sCol, 0.5), runK) * 0.85, inP); base *= 1.0 - 0.3 * edge;
    base = mix(base, vec3(0.78, 0.74, 0.62), inP * step(-0.06, max(pd.x, pd.y)) * (1.0 - step(-0.045, max(pd.x, pd.y))) * step(0.45, fract((u + v) * 14.0)));   // the patch's stitches
    float seam = 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.025, abs(fract(u + 0.5) - 0.5)));
    float dirt = fmN2(vec2(u * 1.3 + hsh * 10.0, v * 0.7)), dist = length(uCamL - vP);
    float weave = 1.0 + 0.10 * sin(u * 150.0) * sin(v * 150.0) * clamp(1.0 - dist / 7.0, 0.0, 1.0) + 0.05 * (fmN2(vec2(u, v) * 23.0) - 0.5);
    float fold = 0.93 + 0.07 * sin(u * 6.3 + hsh * 20.0 + 0.5 * sin(v * 1.4 + hsh * 9.0)) + 0.03 * sin(u * 14.0 + v * 0.8 + hsh * 31.0);
    vec3 alb = base * 0.62 * seam * (0.74 + 0.28 * dirt) * weave * fold;
    alb = mix(alb, alb * 1.12 + 0.03, v * 0.2);
    alb *= 0.75 + 0.25 * smoothstep(0.0, 0.5, v);
    float hem = 1.0 - smoothstep(1.36, 1.45, abs(u));
    alb *= 0.7 + 0.3 * max(hem, step(2.5, kind));
    if (kind > 1.5) alb *= 1.0 - 0.45 * smoothstep(0.0, 0.3, vUV.w) * (1.0 - 0.75 * step(2.5, kind));   // skirts darken toward their scallops
    // which face is seen is decided by the panel as a whole, not by its ripples, so the lit and back-lit sides never mix in bands
    vec3 N0 = normalize(vN0 + vec3(0.0, 1e-4, 0.0)); float sd = dot(N0, V) >= 0.0 ? 1.0 : -1.0;
    float l = dot(N, uSun) * sd;
    vec3 thru = pow(max(base, vec3(0.0)) * 0.9 + 1e-4, vec3(1.45)) * seam * (0.7 + 0.3 * fold);   // back-lit cloth glows in its own colour
    float ribs = 1.0 - 0.24 * (1.0 - smoothstep(0.012, 0.045, min(abs(v - 1.34), abs(v - 2.67)))) * step(kind, 0.5);   // the bamboo battens under it show through as soft dark lines
    thru *= ribs; alb *= 0.5 + 0.5 * ribs;
    thru *= mix(1.0, 0.55, smoothstep(0.45, 0.75, dot(base, vec3(0.3, 0.6, 0.1))));   // pale cloth lets less through, so white sets never blow out
    // cloth is never a grey sheet: turned edge-on to a low sun, or seen on its sunny side at a grazing angle, it still glows through
    float back = smoothstep(0.0, 0.5, -l);
    float nightK = 1.0 - smoothstep(0.5, 1.4, uSunCol.g), topK = smoothstep(-0.2, 0.2, sd * N0.y);   // topK: the cloth's upper side is the one seen
    col = alb * uSunCol * (0.2 + 0.78 * max(l, 0.0)) * (1.0 - 0.5 * nightK * topK) + thru * uSunCol * (0.95 + 1.05 * (1.0 - vO)) * back * (0.75 + 0.4 * dirt) + alb * uSkyCol * 0.35;
    col += (alb * 0.6 + thru * 0.5) * uSunCol * ((0.5 + 0.2 * step(2.5, kind)) * (1.0 - max(l, 0.0)) * (1.0 - 0.7 * vO));   // light scattered in the weave: strongest on shut cloth that the sun only grazes
    col += pow(max(alb, vec3(0.0)) + 1e-4, vec3(1.2)) * uLamp * mix(0.5, 1.5, smoothstep(-0.2, 0.2, -sd * N0.y));
    col += thru * uLamp * 0.8 * topK * (1.0 - 0.6 * vO);   // seen from above by lamplight, shut cloth glows through in its own colour
    // the stall's bare bulb hangs under every cloth: a pool of its light on the underside, and the same pool glowing through the weave from above
    { vec2 bq = vec2(u - (h3 - 0.5) * 1.1, v - 1.55); float pool = exp(-dot(bq, bq) * 0.75) * step(kind, 0.5);
      col += (pow(max(alb, vec3(0.0)) + 1e-4, vec3(1.1)) * mix(0.25, 2.3, smoothstep(-0.2, 0.2, -sd * N0.y)) + thru * 1.5 * topK) * uLamp * pool; }
    col += (thru * uSunCol * 0.22 + alb * uLamp * 0.5) * smoothstep(3.0, 3.9, v) * step(kind, 0.5);   // the hem catches the light
    if (kind > 1.5 && vSh > 0.02) { float dr = fmH1(floor(u * 46.0) + floor(vI.x + 0.5) * 7.0), fall = fract(uTime * (1.6 + dr) + dr * 9.0 - vP.y * 1.3);
      float lit = step(0.22, dr) * smoothstep(0.0, 0.25, fall) * (1.0 - smoothstep(0.55, 1.0, fall));
      col = mix(col, uSunCol * 1.25 + uSkyCol * 1.5, clamp(vSh * 1.5, 0.0, 1.0) * lit * step(0.02, vUV.w)); if (vUV.w > 0.02 && lit < 0.2 && vSh > 0.3) discard; }
    else col = min(col, vec3(1.6));
  }
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <fog_fragment>
}`;
  return mkMat(U, vs, fs, { side: THREE.DoubleSide });
}

// ---------------------------------------------------------------- parasols: instanced, tilt back and half furl with the wave
function parasolGeometry() {
  const P = [], K = [], I = []; let n = 0; const seg = 10, rings = [0.04, 0.55, 1.0];
  for (let j = 0; j < rings.length; j++) for (let k = 0; k <= seg; k++) { const a = (k / seg) * Math.PI * 2; P.push(Math.cos(a), rings[j], Math.sin(a)); K.push(0, 0, k % 2); n++; }
  for (let k = 0; k <= seg; k++) { const a = (k / seg) * Math.PI * 2; P.push(Math.cos(a), 1.0, Math.sin(a)); K.push(0, 0.16, k % 2); n++; }
  for (let j = 0; j < 3; j++) for (let k = 0; k < seg; k++) { const a = j * (seg + 1) + k, b = a + seg + 1; I.push(a, b + 1, b, a, a + 1, b + 1); }
  const b0 = n;
  for (let j = 0; j <= 1; j++) for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; P.push(Math.cos(a) * 0.028, j * 2.12, Math.sin(a) * 0.028); K.push(1, 0, 0); n++; }
  for (let k = 0; k < 4; k++) { const a = b0 + k, c = b0 + (k + 1) % 4; I.push(a, a + 4, c + 4, a, c + 4, c); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 3));
  g.setIndex(I);
  return g;
}
function parasolMaterial(U) {
  const vs = FOG_V + FM_GLSL + /* glsl */`
attribute vec3 aK; attribute vec4 iA; attribute vec3 iB;   // iB = (lateral x, base height, scale); side 0 = free-standing, always open
varying vec3 vP, vN, vD; varying vec3 vI; varying float vTr;
void main(){
  float side = iA.y, hsh = iA.w;
  float o = fmOpenD(fmCellD(floor(iA.x / 3.0), side) - 3.0) * abs(side);
  float e = o * o * (3.0 - 2.0 * o);
  vec3 q; vec3 n;
  if (aK.x < 0.5) {
    float t = position.y, R = (1.05 + 0.2 * hsh) * (1.0 - 0.4 * e) * (1.0 - 0.07 * aK.z * t);
    float droop = 0.26 + 0.85 * e;
    float flut = sin(uTime * 3.1 + hsh * 20.0 + position.x * 3.0) * 0.03 * t * (1.0 + 3.0 * e * (1.0 - e)) * (1.0 + 1.6 * (1.0 - abs(side))) + (1.0 - abs(side)) * 0.035 * t * sin(uTime * 1.7 + hsh * 31.0 + position.z * 2.0);
    q = vec3(position.x * t * R, 2.1 - t * t * droop - aK.y + flut, position.z * t * R);
    n = normalize(vec3(position.x * droop * 2.0, R, position.z * droop * 2.0));
  } else { q = position; n = normalize(vec3(position.x, 0.0, position.z) + vec3(1e-4)); }
  float th = 0.30 * e + 0.03 * sin(uTime * 1.3 + hsh * 9.0), c = cos(th), s = sin(th);
  vec3 p = vec3(q.x * c + side * q.y * s, q.y * c - side * q.x * s, q.z);
  n = vec3(n.x * c + side * n.y * s, n.y * c - side * n.x * s, n.z);
  p = p * iB.z + vec3(iA.z + iB.x, iB.y, uLen * 0.5 - iA.x);
  vP = p; vN = n; vD = vec3(position.x, position.z, aK.x); vI = vec3(hsh, aK.y, iA.z); vTr = position.y;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  const fs = FOG_F + FM_GLSL + /* glsl */`
uniform vec3 uRed; varying vec3 vP, vN, vD; varying vec3 vI; varying float vTr;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0)), V = normalize(uCamL - vP + vec3(0.0, 1e-4, 0.0));
  float off = vI.z; vec3 col;
  if (vD.z > 0.5) { col = fmShade(vec3(0.42, 0.42, 0.40), N, vP, off); }
  else {
    float ga = (atan(vD.y, vD.x + 1e-5) / 6.28318 + 0.5) * 10.0, g = floor(ga), gf = fract(ga);
    float skirt = vI.y / 0.16;                                  // 0 on the canopy, 1 at the hem of the skirt
    if (skirt > 0.5 + 0.5 * sin(gf * 3.14159)) discard;         // the hem hangs in a scallop under each gore
    float h = vI.x; vec3 a = h < 0.3 ? uRed : (h < 0.55 ? uPal[3] : (h < 0.8 ? uPal[0] : uPal[2]));
    vec3 alb = mix(a, vec3(0.80, 0.78, 0.70), step(0.5, fract(g * 0.5)) * step(0.25, fract(h * 7.0))) * 0.66;
    alb *= 0.8 + 0.25 * fmN2(vP.xz * 5.0 + h * 9.0);
    float rib = min(gf, 1.0 - gf);
    alb *= 0.62 + 0.38 * smoothstep(0.0, 0.14, rib);            // each gore darkens into its rib
    alb *= 0.9 + 0.16 * sin(gf * 3.14159);                      // and bellies between ribs
    alb *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.03, abs(vTr - 0.55))) - 0.35 * smoothstep(0.02, 0.25, skirt);   // a seam ring, a darker skirt
    alb = mix(alb, vec3(0.2, 0.19, 0.17), 1.0 - smoothstep(0.05, 0.09, vTr));   // the cap at the tip
    float vis; vec3 tint; fmSun(vP, off, vis, tint);
    float below = 1.0 - step(0.0, dot(N, V));
    col = fmShade(alb, mix(N, -N, below), vP, off);
    col += below * pow(alb, vec3(1.35)) * uSunCol * 0.5 * vis * max(dot(N, uSun), 0.0);
  }
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <fog_fragment>
}`;
  return mkMat(U, vs, fs, { side: THREE.DoubleSide, uniforms: { uRed: { value: U.uRed.value } } });
}

// ---------------------------------------------------------------- lane floor: ballast, sleepers, concrete, the travelling shadow front
function groundMaterial(U) {
  const vs = FOG_V + /* glsl */`
attribute float aOff; varying vec3 vP; varying float vOff;
void main(){ vP = position; vOff = aOff;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
  const fs = FOG_F + FM_GLSL + /* glsl */`
varying vec3 vP; varying float vOff;
void main(){
  float s = uLen * 0.5 - vP.z, x = vP.x - vOff, ax = abs(x);
  vec2 w = vec2(x, s);
  float n1 = fmN2(w * 3.0), n2 = fmN2(w * 0.45 + 7.0), n3 = fmN2(w * 17.0);
  // ballast
  float cdist = length(uCamL - vP);
  vec3 bal = mix(vec3(0.13, 0.118, 0.10), vec3(0.34, 0.32, 0.275), fmStone(w, cdist)) * (0.7 + 0.5 * n1);
  bal = mix(bal, vec3(0.16, 0.27, 0.08), smoothstep(0.72, 0.85, fmN2(w * 2.6 + 3.0)) * 0.45 * step(0.0, s));
  float fsl = fract(s / 0.65);
  float sl = (1.0 - smoothstep(0.34, 0.38, fsl)) * smoothstep(0.0, 0.03, fsl) * (1.0 - smoothstep(0.92, 0.97, ax));
  vec3 wood = vec3(0.19, 0.14, 0.10) * (0.6 + 0.7 * fmN2(vec2(x * 3.0, s * 40.0))) ;
  vec3 col = mix(bal, wood, sl * (0.55 + 0.45 * smoothstep(0.3, 0.6, n2 + 0.2)));
  // concrete either side, ragged edge, slab joints, cracks, wet patches under the ice trays
  float edge = smoothstep(1.28, 1.42, ax + (n1 - 0.5) * 0.25);
  vec3 con = vec3(0.275, 0.262, 0.235) * (0.72 + 0.4 * n2) * (0.88 + 0.24 * n3);
  float joint = smoothstep(0.0, 0.03, abs(fract(s / 2.4) - 0.5) * 2.4 - 0.0) ;
  vec4 zg = fmGap(floor(s / 3.0) * 3.0 + 1.5); float openK = min(zg.z, zg.w);   // an open square: the same slabs as the ground around it
  con *= mix(0.65 + 0.35 * joint, 0.68 + 0.32 * smoothstep(0.0, 0.05, min(abs(fract(s / 3.0) - 0.5), abs(fract(x / 3.0) - 0.5)) * 3.0), openK);
  // the open square's paint and wear: old stains, a worn yellow line either side of the track
  float sqK = openK * step(uYard.x, s) * step(s, uYard.y);
  con *= 1.0 - 0.24 * sqK * smoothstep(0.45, 0.75, fmN2(w * 0.21 + 13.0));
  con = mix(con, vec3(0.50, 0.40, 0.10) * (0.6 + 0.4 * n3), sqK * (1.0 - smoothstep(0.06, 0.09, abs(ax - 2.2))) * (0.25 + 0.6 * n2));
  edge = max(edge, smoothstep(uBridge.x - 1.0, uBridge.x + 1.0, s) * (1.0 - smoothstep(uBridge.y - 1.0, uBridge.y + 1.0, s)));   // the rails are up on the trestle: no ballast under it
  float crack = smoothstep(0.0, 0.02, abs(fmN2(w * 0.55 + 20.0) - 0.5));
  con *= 1.0 - 0.2 * (1.0 - crack) * smoothstep(0.5, 0.7, fmN2(w * 0.3 + 60.0));
  float wet = smoothstep(0.55, 0.7, fmN2(w * vec2(0.9, 0.35) + 40.0)) * step(0.0, s) * step(s, uLen) * edge * (1.0 - openK);
  con *= 1.0 - 0.5 * wet;
  float yardK = smoothstep(uLen - 1.0, uLen + 3.0, s);
  float pud = uWet * smoothstep(0.62, 0.72, fmN2(w * vec2(0.8, 0.5) + 11.0)) * (1.0 - yardK);   // sun-shower: everything darker, puddles that mirror the sky (in the yard only its own puddles do)
  con *= 1.0 - 0.35 * uWet; col *= 1.0 - 0.3 * uWet;
  // the level crossing in front: planks by the rails, asphalt road beyond
  float road = 1.0 - smoothstep(-0.6, 0.0, s);
  con = mix(con, fmRoad(w, n1, n2, n3), road);
  float plank = road * (1.0 - smoothstep(1.55, 1.6, ax)) * step(0.09, abs(ax - 0.5));
  vec3 pl = vec3(0.17, 0.125, 0.08) * (0.6 + 0.6 * fmN2(vec2(x * 30.0, s * 1.5))) * (0.55 + 0.45 * smoothstep(0.0, 0.02, abs(fract(x * 4.0) - 0.5) - 0.0));
  // the station yard beyond the last awning: packed earth and gravel, grass creeping in, oil by the rails, a puddle or two
  vec3 earth = fmEarth(w, n1, n2, n3, cdist);
  earth *= 1.0 - 0.55 * smoothstep(0.6, 0.8, fmN2(w * vec2(1.7, 0.45) + 31.0)) * (1.0 - smoothstep(1.6, 3.2, ax));
  float pn = fmN2(w * 1.0 + 80.0), pudIn = yardK * smoothstep(1.5, 2.2, ax) * (1.0 - smoothstep(6.5, 8.5, ax));   // small puddles with a dark wet rim
  float pudY = smoothstep(0.765, 0.80, pn + (n3 - 0.5) * 0.02) * pudIn;
  earth *= 1.0 - 0.45 * smoothstep(0.66, 0.765, pn) * pudIn;
  con = mix(con, earth, yardK);
  col = mix(col, con, edge);
  col = mix(col, pl, plank);
  vec3 N = vec3(0.0, 1.0, 0.0);
  vec3 lit = fmShade(col, N, vP, vOff);
  if (s > uYard.x - 6.0 && s < uYard.y + 6.0) { vec2 um = fmUmb(vP);   // the umbrellas' shade by day, the pools of their bulbs by night
    lit *= 1.0 - 0.72 * (1.0 - um.x) * smoothstep(0.3, 1.2, uSunCol.g); lit += col * uLamp * 1.5 * um.y; }
  float vis, skyK; vec3 tint; fmSunEx(vP, vOff, vis, tint, skyK);
  lit += col * vec3(0.18, 0.26, 0.48) * skyK * (0.13 / (0.08 + dot(col, vec3(0.333)))) * (1.0 - smoothstep(0.5, 1.4, uSunCol.g));   // by night open ground lies in a wash of moonlight, never black
  vec3 V = normalize(uCamL - vP + vec3(0.0, 1e-4, 0.0)), H = normalize(uSun + V);
  float sp = max(H.y, 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  lit += wet * (uSunCol * sp * 1.5 * vis + mix(tint * 0.5, uSkyCol, vis) * 0.22 * (1.0 - V.y) );
  float fr = 1.0 - max(V.y, 0.0); fr *= fr; fr *= fr;
  float open2 = max(vis, 0.6 * (1.0 - step(1e-3, dot(tint, tint))));   // under shut cloth the wet ground mirrors the cloth, not the sky
  lit += (uWet * 0.09 + pud * 1.5) * (uSunCol * sp * 2.2 * vis + mix(tint * uSunCol * 0.35, uSkyCol * 1.3, open2) * (0.12 + 0.9 * fr));
  // the yard's puddles are water: the sky by fresnel, a muddy bottom seen from above, the rain tree's shade, ripples and sun glints
  float rp = fmN2(w * 5.0 + vec2(uTime * 0.45, -uTime * 0.3)), rp2 = fmN2(w * 13.0 - vec2(uTime * 0.6, uTime * 0.35));
  vec3 pw = mix(uSkyCol * 0.5, uSkyCol * 1.6 + uSunCol * 0.05, fr) * (0.8 + 0.4 * rp) * mix(0.5, 1.0, vis);
  pw += col * (uSkyCol * 0.5 + uSunCol * 0.12 * vis) * (1.0 - fr);
  pw += uSunCol * vis * (sp * mix(0.4, 2.0, smoothstep(0.5, 1.4, uSunCol.g)) * (0.3 + 0.7 * rp) * (0.6 + 0.4 * rp2) + smoothstep(0.80, 0.86, rp2) * smoothstep(0.5, 0.7, rp) * 0.45 * (0.5 + 0.5 * sin(uTime * 5.0 + rp * 40.0)));
  lit = mix(lit, pw, pudY);
  // by day the far rails swim in the heat: pale pools of sky that waver over the hot ballast well ahead of the cab, wherever the sun lies on it
  { float hot = smoothstep(1.5, 2.0, uSunCol.g) * (1.0 - uWet) * vis * smoothstep(12.0, 30.0, cdist) * (1.0 - edge);
    float wv = fmN2(vec2(x * 1.1 + 0.3 * sin(uTime * 1.3 + s * 0.4), s * 0.22 - uTime * 0.5));
    lit = mix(lit, uSkyCol * 3.2 + uSunCol * 0.16, hot * smoothstep(0.46, 0.62, wv) * (0.62 + 0.14 * sin(uTime * 9.0 + s * 2.0))); }
  gl_FragColor = vec4(max(lit, vec3(0.0)), 1.0);
  #include <fog_fragment>
}`;
  return mkMat(U, vs, fs);
}
function groundGeometry(len, offFn, after = 30, cut = null) {
  const P = [], O = [], I = []; let n = 0;
  const strip = (s0, s1, hw) => {
    const rows = Math.max(1, Math.round((s1 - s0) / 3)), b = n;
    for (let j = 0; j <= rows; j++) { const s = s0 + ((s1 - s0) * j) / rows, o = offFn(s);
      P.push(-hw + o, 0.02, len / 2 - s, hw + o, 0.02, len / 2 - s); O.push(o, o); n += 2; }
    for (let j = 0; j < rows; j++) { const a = b + j * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  };
  strip(-48, 0, 9); if (cut) { strip(0, cut[0], 3.62); strip(cut[1], len, 3.62); } else strip(0, len, 3.62); strip(len, len + after, 9);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aOff', new THREE.Float32BufferAttribute(O, 1));
  g.setIndex(I); g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- dust motes and marigold petals, lit only where the sun gets in
function dustMaterial(U) {
  const vs = FOG_V + FM_GLSL + /* glsl */`
attribute vec4 aSeed; attribute float aOff; uniform float uPx; varying vec4 vC;
void main(){
  vec3 p = position;
  p.x += sin(uTime * (0.2 + aSeed.x * 0.3) + aSeed.y * 40.0) * 0.5;
  p.y = 0.25 + mod(p.y + sin(uTime * 0.31 + aSeed.z * 30.0) * 0.4 - uTime * 0.05 * aSeed.w, 3.6);
  p.z += cos(uTime * (0.15 + aSeed.y * 0.3) + aSeed.x * 40.0) * 0.6;
  float d = (uLen * 0.5 - p.z) - uCamS;
  p.z -= 2.5 * exp(-d * d * 0.02) * (0.5 + aSeed.z);
  float vis; vec3 tint; fmSun(p, aOff, vis, tint);
  float petal = step(0.9, aSeed.w);
  float tw = 0.55 + 0.45 * sin(uTime * (2.0 + aSeed.x * 5.0) + aSeed.y * 50.0);
  vC = vec4(mix(vec3(1.0, 0.93, 0.78), vec3(1.0, 0.5, 0.05), petal) * uSunCol * (0.9 + 0.8 * petal), vis * tw * (0.5 + 0.5 * petal));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(uPx * (0.012 + 0.02 * petal + 0.012 * aSeed.z) / max(-mvPosition.z, 0.5), 1.0, 9.0);
  #include <fog_vertex>
}`;
  const fs = FOG_F + /* glsl */`
varying vec4 vC;
void main(){ vec2 q = gl_PointCoord - 0.5; float a = 1.0 - smoothstep(0.1, 0.5, length(q));
  gl_FragColor = vec4(max(vC.rgb * vC.a * a * 0.5, vec3(0.0)), 1.0);
}`;
  return mkMat(U, vs, fs, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPx: U.uPx } });
}

// ---------------------------------------------------------------- street builders
const rgb = (r, g, b) => ({ r, g, b });
const sc = (c, k) => ({ r: c.r * k, g: c.g * k, b: c.b * k });
const mx = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });

// goods on a shop shelf, seen only from the lane: front, top and the end that faces the oncoming train
const hs = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };   // a hash for detail that must not touch the street's random streams
const HANGC = [rgb(0.7, 0.25, 0.4), rgb(0.62, 0.6, 0.5), rgb(0.2, 0.45, 0.65), rgb(0.72, 0.5, 0.08), rgb(0.6, 0.12, 0.08)];
const STOCK = [rgb(0.50, 0.12, 0.08), rgb(0.52, 0.38, 0.06), rgb(0.14, 0.28, 0.44), rgb(0.20, 0.36, 0.16), rgb(0.50, 0.47, 0.38), rgb(0.44, 0.24, 0.08), rgb(0.40, 0.14, 0.26), rgb(0.12, 0.34, 0.34), rgb(0.54, 0.30, 0.10)];
function shelfItem(b, side, ax, y, z, sx, sy, sz, col, taper = 1, shade = 0.72) {
  const xf = side * (ax - sx / 2), xb = side * (ax + sx / 2), hz = sz / 2, tz = hz * taper, xt = side * (ax - (sx / 2) * taper), lo = { r: col.r * shade, g: col.g * shade, b: col.b * shade }, hi = { r: col.r * 1.1, g: col.g * 1.1, b: col.b * 1.1 };
  let a = b.vert(xf, y, z - hz, -side, 0, 0, lo.r, lo.g, lo.b), c = b.vert(xf, y, z + hz, -side, 0, 0, lo.r, lo.g, lo.b), d = b.vert(xt, y + sy, z + tz, -side, 0, 0, col.r, col.g, col.b), e = b.vert(xt, y + sy, z - tz, -side, 0, 0, col.r, col.g, col.b);
  b.quad(a, c, d, e);
  a = b.vert(xt, y + sy, z - tz, 0, 1, 0, hi.r, hi.g, hi.b); c = b.vert(xt, y + sy, z + tz, 0, 1, 0, hi.r, hi.g, hi.b); d = b.vert(xb, y + sy, z + tz, 0, 1, 0, hi.r, hi.g, hi.b); e = b.vert(xb, y + sy, z - tz, 0, 1, 0, hi.r, hi.g, hi.b);
  b.quad(a, c, d, e);
  a = b.vert(xf, y, z + hz, 0, 0, 1, lo.r * 0.8, lo.g * 0.8, lo.b * 0.8); c = b.vert(xb, y, z + hz, 0, 0, 1, lo.r * 0.8, lo.g * 0.8, lo.b * 0.8); d = b.vert(xb, y + sy, z + tz, 0, 0, 1, col.r * 0.8, col.g * 0.8, col.b * 0.8); e = b.vert(xt, y + sy, z + tz, 0, 0, 1, col.r * 0.8, col.g * 0.8, col.b * 0.8);
  b.quad(a, c, d, e);
}

// a batch that keeps nothing: a stall built into it takes its random draws and leaves no geometry (so a stall can be replaced by another kind
// without moving any later draw of the street)
const SINK = { mat: 0, aux: 0, anim: [0, 0, 0, 0], M: new THREE.Matrix4(), nv: 0, vert() { return 0; }, tri() {}, quad() {}, box() {}, cyl() {}, blob() {}, tube() {} };
function ownRng(seed) { let a = seed >>> 0;
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r(); r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r()); r.pick = (arr) => arr[Math.floor(r() * arr.length)]; r.chance = (q) => r() < q; return r; }
// a fluorescent tube in its fitting, lying along the lane
function tubeLight(S, b, x, y, z, len) { b.anim = [0, 0, 0, 0]; b.mat = 1; b.aux = S.tubeGain; b.box(x, y, z, 0.05, 0.04, len, rgb(0.74, 0.90, 1.0), 1, 1, 0.45); b.mat = 0; b.aux = 0; }
// a sparrow perched on the rim of a front tray; it hops off to the back of the stall as the nose comes (kind 7)
function sparrow(S, b, x, y, s, side, ph) {
  const z = S.Z(s), br = rgb(0.36, 0.24, 0.13), pale = rgb(0.62, 0.56, 0.46), dz = ph > 3.1 ? 1 : -1;
  b.anim = [s, 7, side, ph]; b.mat = 0; b.aux = 0;
  b.blob(x, y + 0.045, z, 0.04, 0.038, 0.06, pale, 4, 2, false, br); b.blob(x, y + 0.085, z - dz * 0.05, 0.027, 0.026, 0.03, sc(br, 0.8), 3, 2, false, rgb(0.42, 0.22, 0.1));
  const i0 = b.vert(x - 0.014, y + 0.055, z + dz * 0.05, 0, 1, 0, br.r * 0.7, br.g * 0.7, br.b * 0.7); b.vert(x + 0.014, y + 0.055, z + dz * 0.05, 0, 1, 0, br.r * 0.7, br.g * 0.7, br.b * 0.7); b.vert(x, y + 0.06, z + dz * 0.125, 0, 1, 0, br.r * 0.6, br.g * 0.6, br.b * 0.6); b.tri(i0, i0 + 1, i0 + 2);
  b.anim = [0, 0, 0, 0]; }
// a cat asleep on top of a stack of crates, curled nose to tail; its ears flick now and then (kind 9)
function cat(S, b, x, y, s, q) {
  const z = S.Z(s), c = q < 0.4 ? rgb(0.60, 0.33, 0.10) : q < 0.75 ? rgb(0.30, 0.28, 0.26) : rgb(0.66, 0.63, 0.56), dk = sc(c, 0.6), sd = x < 0 ? 1 : -1, ph = q * 40;
  b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
  b.blob(x, y + 0.078, z, 0.15, 0.085, 0.2, dk, 6, 3, false, c);                                            // the curled back
  b.blob(x + sd * 0.05, y + 0.082, z - 0.17, 0.068, 0.06, 0.072, c, 5, 3, false, sc(c, 1.15));               // the head, tucked in
  b.tube([[x - sd * 0.1, y + 0.03, z + 0.17], [x + sd * 0.15, y + 0.028, z + 0.06], [x + sd * 0.15, y + 0.03, z - 0.14]], 0.022, 3, dk);   // the tail, wrapped round
  for (const e of [-1, 1]) { const hx = x + sd * 0.05 + e * 0.036, hy = y + 0.13, hz = z - 0.17;
    b.anim = [s, 9, e, ph]; const i0 = b.vert(hx - 0.024, hy, hz + 0.01, 0, 0.4, -1, dk.r, dk.g, dk.b); b.vert(hx + 0.024, hy, hz + 0.01, 0, 0.4, -1, dk.r, dk.g, dk.b); b.vert(hx + e * 0.008, hy + 0.058, hz, 0, 0.4, -1, c.r, c.g, c.b); b.tri(i0, i0 + 1, i0 + 2); }
  b.anim = [0, 0, 0, 0]; }
// drops of meltwater falling from the bench's edge under a tray of ice (kind 10)
function drips(S, b, x, y, s, sz, n = 2) {
  const side = x < 0 ? -1 : 1, xf = side * 2.245;
  for (let k = 0; k < n; k++) { const q = hs(s * 3.71 + k * 9.13 + side), ss = s + (q - 0.5) * sz * 0.8, z = S.Z(ss);
    b.anim = [ss, 10, 0.72, q * 6.283]; b.mat = 2; b.aux = 0.9; b.tube([[xf, y - 0.05, z], [xf, y - 0.11, z]], 0.011, 3, rgb(0.66, 0.74, 0.82)); }
  b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0; }
// a long tray of crushed ice with squid, with crabs, or with a row of mackerel
function iceTray(S, b, x, y, s, sx, sz, kind) {
  const R = S.R, z = S.Z(s), y0 = y + 0.045, side = x < 0 ? -1 : 1;
  b.anim = [0, 0, 0, 0]; b.mat = 2; b.aux = 0.25; b.box(x, y + 0.03, z, sx, 0.06, sz, kind === 'crab' ? rgb(0.16, 0.36, 0.62) : kind === 'squid' ? rgb(0.60, 0.14, 0.10) : rgb(0.50, 0.52, 0.54), 1.1, 1.06, 0.7);
  const ih = R.range(0.06, 0.09); b.aux = 0.7; b.box(x, y0 + ih / 2, z, sx * 0.9, ih, sz * 0.94, rgb(0.60, 0.68, 0.76), 0.74, 0.9, 0.7);   // the heap of crushed ice
  const flat = (x0, x1, z0, z1, c, k) => { const i0 = b.vert(-x0, 0.004, z0, 0, 1, 0, c.r, c.g, c.b); b.vert(x0, 0.004, z0, 0, 1, 0, c.r, c.g, c.b); b.vert(x1, -0.012, z1, 0, 1, 0, c.r * k, c.g * k, c.b * k); b.vert(-x1, -0.012, z1, 0, 1, 0, c.r * k, c.g * k, c.b * k); b.quad(i0, i0 + 1, i0 + 2, i0 + 3); };
  for (let k = 0; k < 3; k++) { const pz = z + ((k + 0.5) / 3 - 0.5) * sz * 0.8, px = x + R.range(-0.04, 0.04), a = R.range(-0.4, 0.4) + (side > 0 ? 0 : Math.PI);
    b.M.makeRotationY(Math.PI / 2 + a).setPosition(px, y0 + ih + 0.03, pz); b.mat = 2; b.aux = 0.6;
    if (kind === 'squid') { b.blob(0, 0.01, -0.04, 0.075, 0.05, 0.2, rgb(0.70, 0.50, 0.56), 4, 2, false, rgb(0.52, 0.16, 0.34));   // the mantle
      flat(0.04, 0.12, 0.13, 0.37, rgb(0.70, 0.30, 0.40), 0.75); }                                                               // the arms, fanned on the ice
    else if (kind === 'crab') { b.blob(0, 0.01, 0, 0.15, 0.055, 0.11, rgb(0.56, 0.22, 0.10), 4, 2, false, rgb(0.90, 0.30, 0.04));   // the shell
      b.aux = 0.1; flat(0.2, 0.15, -0.07, -0.18, rgb(0.84, 0.22, 0.03), 0.75); }                                                  // the claws, folded in front
    else b.blob(0, 0.01, 0, 0.06, 0.032, 0.21, rgb(0.50, 0.56, 0.62), 4, 2, false, rgb(0.05, 0.22, 0.38));                          // a mackerel
    b.M.identity(); }
  b.mat = 0; b.aux = 0; if (kind !== 'fish') drips(S, b, x, y, s, sz, 1);
}
// a stall of the blue-and-white run after the bridge: squid and crab on crushed ice in front, mackerel behind, a fluorescent tube over it. Where the
// line is still coming down off its trestle the stall stands on a timber staging level with the sleepers (h), on the posts that carry the cloth's hinge
function fishStall(S, b, side, s, c, para, pot, h) {
  const S3 = S.S3, R = S3.R, z = S.Z(s), C = S.C, wc = sc(rgb(0.33, 0.24, 0.14), R.range(0.8, 1.2)), white = rgb(0.70, 0.69, 0.64), timber = rgb(0.21, 0.155, 0.10);
  b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
  if (h > 0.12) { b.box(side * 2.93, h - 0.05, z, 1.62, 0.1, 3.0, sc(timber, 1.15), 1, 1, 0.7);                                   // the staging
    b.box(side * 3.6, (h + 3.7) / 2, z + 1.5, 0.14, h + 3.7, 0.14, timber, 1, 1, 0.6);                                           // its post (one at each joint of the staging) runs on up to the hinge
    b.tube([[side * 3.6, h + 3.72, z - 1.5], [side * 3.6, h + 3.72, z + 1.5]], 0.055, 3, sc(timber, 1.2));                       // the hinge rail
    b.tube([[side * 3.6, h + 3.7, z + 1.5], [side * 5.02, h + 6.5, z + 1.5]], 0.035, 3, rgb(0.44, 0.36, 0.2)); }                 // a bamboo outrigger for the pull-cords
  b.box(side * 2.87, h + 0.83, z, 1.2, 0.05, 2.72, wc, 1, 1, 0.8); b.box(side * 3.17, h + 0.98, z, 0.56, 0.25, 2.62, sc(wc, 0.9));
  for (let k = 0; k < 4; k++) { const cc = k % 2 ? sc(C.blue, 0.7) : white, xs = side * 2.262, za = z - 1.3 + k * 0.65, i0 = b.vert(xs, h + 0.23, za, -side, 0, 0, cc.r * 0.8, cc.g * 0.8, cc.b * 0.8);   // a blue and white skirt on the bench
    b.vert(xs, h + 0.81, za, -side, 0, 0, cc.r, cc.g, cc.b); b.vert(xs, h + 0.81, za + 0.65, -side, 0, 0, cc.r, cc.g, cc.b); b.vert(xs, h + 0.23, za + 0.65, -side, 0, 0, cc.r * 0.8, cc.g * 0.8, cc.b * 0.8); b.quad(i0, i0 + 1, i0 + 2, i0 + 3); }
  const sw = (c + (side > 0 ? 1 : 0)) % 2;
  iceTray(S3, b, side * 2.56, h + 0.855, s - 0.67, 0.52, 1.24, sw ? 'squid' : 'crab'); iceTray(S3, b, side * 2.56, h + 0.855, s + 0.67, 0.52, 1.24, sw ? 'crab' : 'squid');
  iceTray(S3, b, side * 3.17, h + 1.105, s, 0.5, 2.5, 'fish');
  b.mat = 6; b.aux = 0; b.box(side * 2.85, h + 0.17, z + (sw ? -0.6 : 0.6), 0.42, 0.3, 0.58, sc(sw ? C.blue : C.red, 0.7), 1.06, 1.04, 0.7); b.mat = 0;   // a crate under the bench
  if (pot) { b.mat = 3; const pz = S.len / 2 - pot[0]; b.cyl(side * 2.2, h, pz, 0.16, 0.2, 0.42, 8, rgb(0.3, 0.2, 0.15)); b.cyl(side * 2.2, h + 0.42, pz, 0.22, 0.24, 0.26, 10, rgb(0.62, 0.63, 0.64)); b.cyl(side * 2.2, h + 0.68, pz, 0.24, 0.05, 0.07, 10, rgb(0.66, 0.67, 0.68)); b.mat = 0; }
  if (hs(c * 5.3 + side * 2.1) < 0.3) sparrow(S, b, side * 2.33, h + 0.905, s + (hs(c * 1.9 + side) - 0.5) * 2.2, side, hs(c * 7.7 + side) * 6.283);
  if (para) return;
  const fx = side * 2.3, ry = h + R.range(2.9, 3.08), bc = sc(rgb(0.5, 0.41, 0.2), R.range(0.8, 1.15));
  for (const e of [-1.3, 1.3]) b.tube([[fx, h + 0.85, z + e], [fx, ry, z + e]], 0.03, 3, bc); b.box(fx, ry, z, 0.045, 0.045, 2.8, bc, 1, 1, 0.9);   // a bamboo frame
  { const yT = ry - 0.02, len = R.range(0.35, 0.7), zb = S.Z(s - 0.85); b.anim = [s - 0.85, 2, yT, R.range(0, 6.28)];                                // its bare bulb on a flex
    b.mat = 0; b.aux = -1; b.tube([[fx, yT, zb], [fx, yT - len, zb]], 0.0075, 3, rgb(0.10, 0.065, 0.04));
    b.mat = 1; b.aux = R.range(4.5, 7) * (S.bulbGain || 1); b.blob(fx, yT - len - 0.07, zb, 0.045, 0.062, 0.045, rgb(1.0, 0.72, 0.36), 4, 2); b.mat = 0; b.aux = 0; b.anim = [0, 0, 0, 0]; }
  if (sw) { const yb = ry - 0.32, zc = S.Z(s + 0.8); b.anim = [s + 0.8, 2, ry - 0.02, R.range(0, 6.28)];                                             // a balance: a brass beam and two pans
    b.mat = 0; b.aux = -1; b.tube([[fx, ry - 0.02, zc], [fx, yb, zc]], 0.0075, 3, rgb(0.10, 0.065, 0.04)); b.aux = 0;
    b.mat = 3; b.box(fx, yb, zc, 0.03, 0.03, 0.5, rgb(0.75, 0.56, 0.2));
    for (const e of [-0.24, 0.24]) { b.tube([[fx, yb, zc + e], [fx, yb - 0.42, zc + e]], 0.012, 3, rgb(0.5, 0.38, 0.14)); b.cyl(fx, yb - 0.47, zc + e, 0.07, 0.15, 0.05, 6, rgb(0.78, 0.58, 0.2), false, 0.6); }
    b.mat = 0; b.anim = [0, 0, 0, 0]; }
  tubeLight(S, b, fx + side * 0.2, ry - 0.14, z, 1.3);
}

async function buildShops(S) {
  const { R, B, Z, cells, C } = S;
  const wallCols = [rgb(0.56, 0.36, 0.11), rgb(0.33, 0.50, 0.40), rgb(0.62, 0.60, 0.52), rgb(0.60, 0.42, 0.20), rgb(0.40, 0.50, 0.56)];
  const signCols = [C.red, C.saffron, C.blue, C.green, rgb(0.6, 0.58, 0.5), C.orange];
  for (const side of [-1, 1]) {
    let c = 0;
    while (c < cells) {
      if (S.inGap(c * 3 + 1.5, side)) { c++; continue; }
      const w = R.chance(0.45) && c + 1 < cells && !S.inGap(c * 3 + 4.5, side) ? 2 : 1, s0 = c * 3, s1 = (c + w) * 3, sm = (s0 + s1) / 2, ln = s1 - s0, b = B(sm);
      const H = R.range(4.45, 5.15), wc = sc(R.pick(wallCols), R.range(0.85, 1.1)), z = Z(sm);
      b.anim = [0, 0, 0, 0]; b.mat = 5; b.aux = 0;
      b.box(side * 3.66, H / 2, Z(s0 + 0.22), 0.32, H, 0.44, wc); b.box(side * 3.66, H / 2, Z(s1 - 0.22), 0.32, H, 0.44, wc);
      b.box(side * 3.65, (2.8 + H) / 2, z, 0.28, H - 2.8, ln - 0.86, wc, 1, 1, 0.9);
      b.box(side * 4.86, H / 2, z, 0.2, H, ln, sc(wc, 0.9));
      b.box(side * 3.62, H - 0.1, z, 0.46, 0.16, ln, sc(wc, 0.8));
      const lo = S.detail <= 0.5;
      if (!lo) b.box(side * 3.6, 0.18, z, 0.1, 0.36, ln - 0.86, sc(wc, 0.55));
      b.mat = 0;
      b.box(side * 4.26, H + 0.05, z, 1.42, 0.1, ln + 0.02, rgb(0.33, 0.32, 0.31), 1, 1, 1);
      b.box(side * 4.72, 1.4, z, 0.06, 2.8, ln - 0.86, rgb(0.10, 0.085, 0.06));
      b.box(side * 4.2, 0.03, z, 1.1, 0.06, ln - 0.86, rgb(0.16, 0.15, 0.13));
      for (let k = 0, nk = S.detail > 0.5 ? 2 + w * 2 : 0; k < nk; k++) { // shelves of stock deep in the shade
        const ss = s0 + 0.7 + ((ln - 1.4) * (k + 0.5)) / nk, hh = R.range(0.5, 1.9);
        b.box(side * 4.48, hh / 2 + 0.06, Z(ss), 0.4, hh, (ln - 1.4) / nk * 0.8, sc(R.pick([C.blue, C.red, C.saffron, rgb(0.45, 0.35, 0.2), C.green]), 0.55), 0.9, 0.95);
      }
      if (R.chance(0.22)) { // a shop that is shut: a slatted roller shutter with a handle bar, posters and a hanging sign
        b.mat = 8; b.box(side * 3.74, 1.42, z, 0.05, 2.76, ln - 0.9, sc(R.pick([rgb(0.34, 0.40, 0.44), rgb(0.26, 0.36, 0.30), rgb(0.42, 0.38, 0.30), rgb(0.24, 0.30, 0.42)]), R.range(0.85, 1.15))); b.mat = 0;
        b.box(side * 3.7, 0.5, z, 0.04, 0.07, ln - 1.1, rgb(0.2, 0.22, 0.24));
        for (let k = 0, nk = R.int(1, 3); k < nk; k++) { const pz = z + R.range(-0.4, 0.4) * (ln - 1.4), pw = R.range(0.35, 0.6), ph = R.range(0.45, 0.75), py = R.range(1.3, 1.9), pc = R.pick(signCols);
          b.box(side * 3.705, py, pz, 0.012, ph, pw, rgb(0.66, 0.63, 0.52)); b.box(side * 3.698, py + ph * 0.16, pz, 0.012, ph * 0.42, pw * 0.8, sc(pc, 0.6)); b.box(side * 3.698, py - ph * 0.3, pz, 0.012, ph * 0.1, pw * 0.7, rgb(0.12, 0.12, 0.14)); }
      } else { b.box(side * 3.72, 2.62, z, 0.26, 0.34, ln - 0.9, rgb(0.12, 0.095, 0.07));
        // open: shelf boards at the back stocked with boxes, tins, jars and bottles; a counter; crates
        const wd = sc(rgb(0.33, 0.24, 0.14), R.range(0.7, 1.1)), nsh = R.chance(0.3) ? 4 : 3, zl = ln - 1.1;
        const R2 = S.R2, f0 = Math.floor(R2() * STOCK.length), fam = [STOCK[f0], STOCK[(f0 + 1 + Math.floor(R2() * 3)) % STOCK.length], STOCK[(f0 + 5 + Math.floor(R2() * 3)) % STOCK.length]], famOf = (c) => fam[STOCK.indexOf(c) % 3];   // each shop keeps to three colours
        for (let j = 0; j < nsh; j++) {
          const sy = 0.62 + j * (nsh > 3 ? 0.56 : 0.7) + R.range(-0.04, 0.04);
          b.mat = 0; b.box(side * 4.5, sy, z, 0.36, 0.035, zl, wd, 1, 1, 0.8);
          const kind = R.int(0, 3), base = famOf(R.pick(STOCK)), n = Math.max(3, Math.round(zl / R.range(0.36, 0.5)));
          for (let k = 0; k < n; k++) {
            if (R.chance(0.12)) continue;
            const zz = z - zl / 2 + ((k + 0.5) * zl) / n + R.range(-0.03, 0.03), col = sc(R.chance(0.6) ? base : famOf(R.pick(STOCK)), R.range(0.75, 1.1)), xs = side * 4.46;
            const hq = hs(k * 7.13 + j * 3.71 + c * 1.37), hv = 0.7 + hq, room = (nsh > 3 ? 0.56 : 0.7) - 0.1;   // (heights vary along a shelf: no row of equal blocks)
            if (kind === 0) { const cx = R.range(0.16, 0.22), ch = Math.min(room, R.range(0.14, 0.25) * hv), cw = Math.min(0.26, (zl / n) * 0.8);                                                                        // cartons, and sacks among them
              if (R2() < 0.4) b.blob(xs, sy + 0.018 + ch * 0.55, zz, 0.11, ch * 0.6, Math.min(0.15, (zl / n) * 0.42), sc(mx(col, rgb(0.5, 0.44, 0.3), 0.55), 1.1), 5, 2);
              else { shelfItem(b, side, 4.44, sy + 0.018, zz, cx, ch, cw, col, 1); R2();   // every carton carries a paper label with a block of print
                shelfItem(b, side, 4.44 - cx / 2 - 0.002, sy + 0.018 + ch * 0.26, zz, 0.008, ch * 0.5, cw * 0.74, rgb(0.68, 0.64, 0.52), 1, 1);
                shelfItem(b, side, 4.44 - cx / 2 - 0.007, sy + 0.018 + ch * 0.42, zz + (hq - 0.5) * cw * 0.2, 0.006, ch * 0.2, cw * 0.4, sc(col, 0.4), 1, 1); } }
            else if (kind === 1) { const bh = Math.min(room, R.range(0.2, 0.3) * (0.8 + 0.5 * hq)), br = 0.036 + 0.014 * hs(k * 3.3 + j), y0 = sy + 0.018;   // bottles: a body, a shoulder, a neck with a cap
              b.mat = 2; b.aux = 0.04; b.cyl(xs, y0, zz, br, br, bh * 0.58, 5, col, false, 0.7, sc(col, 1.1)); b.cyl(xs, y0 + bh * 0.58, zz, br, 0.014, bh * 0.2, 4, sc(col, 1.1), false, 1);
              b.cyl(xs, y0 + bh * 0.78, zz, 0.014, 0.016, bh * 0.22, 4, sc(col, 1.2), false, 0.9, hq < 0.5 ? rgb(0.62, 0.6, 0.5) : rgb(0.55, 0.1, 0.06)); b.mat = 0; b.aux = 0; }
            else if (kind === 2) { const jh = Math.min(room - 0.05, (R.range(0.12, 0.18) + 0.03) * hv), jr = 0.06 + 0.03 * hs(k * 5.1 + j * 2.3);   // round jars with brass lids
              b.mat = 2; b.aux = 0.04; b.cyl(xs, sy + 0.018, zz, jr, jr * 0.94, jh, 7, col, false, 0.7, sc(col, 1.15)); b.mat = 0; b.aux = 0; b.cyl(xs, sy + 0.018 + jh, zz, jr * 0.85, jr * 0.7, 0.03, 7, rgb(0.5, 0.42, 0.2), true, 0.8); }
            else { const st = R.int(1, 2);                                                                                                                      // stacked tins, or enamel bowls nested rim up
              if (R2() < 0.5) for (let q = 0; q <= st; q++) b.cyl(xs, sy + 0.018 + q * 0.045, zz, 0.05, 0.105, 0.07, 5, sc(col, 0.7), false, 0.8, q % 2 ? rgb(0.62, 0.6, 0.54) : col);
              else for (let q = 0; q < st; q++) shelfItem(b, side, 4.44 + 0.02 * q, sy + 0.018 + q * 0.13, zz, 0.2, 0.12, Math.min(0.24, (zl / n) * 0.78), q ? sc(col, 0.8) : col, 1); }
          }
        }
        // bags, strings of garlic and onions and little baskets on hooks under the lintel: they swing in the cab's wind
        for (let k = 0, nk = w > 1 ? 3 : 2; k < nk; k++) { const hq = hs(c * 9.7 + side * 3.3 + k * 5.9), h2 = hs(hq * 91.7), hz = z + ((k + 0.5) / nk - 0.5) * (ln - 1.6) + (hq - 0.5) * 0.3, hl = 0.1 + 0.28 * h2, hx = side * 3.93, yT = 2.44;
          b.anim = [S.len / 2 - hz, 2, yT, hq * 6.28]; b.mat = 0; b.aux = -1; b.tube([[hx, yT, hz], [hx, yT - hl, hz]], 0.0075, 3, rgb(0.3, 0.26, 0.16)); b.aux = 0;
          if (hq < 0.4) { b.mat = 2; b.aux = 0.04; b.blob(hx, yT - hl - 0.13, hz, 0.085, 0.14, 0.085, HANGC[Math.floor(h2 * 5) % 5], 5, 3, false, rgb(0.7, 0.68, 0.6)); b.mat = 0; b.aux = 0; }
          else if (hq < 0.78) { const gc = h2 < 0.4 ? rgb(0.74, 0.7, 0.6) : h2 < 0.7 ? rgb(0.5, 0.16, 0.2) : rgb(0.62, 0.36, 0.08); for (let q = 0; q < 4; q++) b.blob(hx + (q % 2 ? 0.03 : -0.03), yT - hl - 0.05 - q * 0.085, hz + (q % 2 ? -0.02 : 0.025), 0.05, 0.048, 0.05, sc(gc, 0.85 + 0.1 * q), 4, 2); }
          else b.cyl(hx, yT - hl - 0.2, hz, 0.06, 0.12, 0.2, 6, rgb(0.36, 0.27, 0.13), false, 0.7, rgb(0.56, 0.44, 0.22)); }
        b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
        if (R.chance(0.6)) b.box(side * 4.1, 0.5, z + R.range(-0.3, 0.3), 0.5, 0.86, ln * 0.45, sc(R.pick([C.blue, rgb(0.45, 0.33, 0.2), C.green, C.orange]), 0.4), 1, 1, 0.8);
        if (R.chance(0.5)) { b.mat = 6; const cz = z + R.range(-0.35, 0.35) * ln, cc = sc(R.pick([C.blue, C.red, C.green]), R.range(0.55, 0.8)); for (let q = 0, st = R.int(1, 3); q < st; q++) b.box(side * 4.05, 0.17 + q * 0.31, cz, 0.42, 0.3, 0.58, cc, 1.06, 1.04, 0.7); }
        b.mat = 0; }
      for (const e of [s0 + 0.22, s1 - 0.22]) if (R.chance(0.5)) { // a poster or a meter box on the pilaster
        const py = R.range(1.4, 2.2), pc = R.pick(signCols);
        if (R.chance(0.7)) { b.box(side * 3.495, py, Z(e), 0.012, 0.44, 0.3, rgb(0.66, 0.63, 0.52)); b.box(side * 3.488, py + 0.07, Z(e), 0.012, 0.2, 0.24, sc(pc, 0.6)); }
        else { b.box(side * 3.47, py, Z(e), 0.07, 0.3, 0.22, rgb(0.42, 0.43, 0.42)); b.box(side * 3.43, py + 0.03, Z(e), 0.012, 0.1, 0.12, rgb(0.07, 0.08, 0.09)); } }
      const sg = R.pick(signCols), sl = ln * R.range(0.5, 0.82), sy = R.range(3.02, 3.3);
      const sz0 = z + R.range(-0.2, 0.2), sgc = sc(sg, Math.min(0.75, 0.55 / Math.max(sg.r, sg.g, sg.b))), pale = mx(sg, rgb(0.75, 0.72, 0.6), 0.8);
      b.box(side * 3.47, sy, sz0, 0.06, 0.46, sl, sgc, 1, 1, 0.9);
      b.box(side * 3.435, sy + 0.2, sz0, 0.02, 0.04, sl, sc(pale, 0.8)); b.box(side * 3.435, sy - 0.2, sz0, 0.02, 0.04, sl, sc(pale, 0.8));
      for (let k = 0, nk = Math.max(3, Math.round(sl / (lo ? 0.62 : 0.42))), tw = sl / nk; k < nk; k++) { // striped, scalloped cloth valance, stirring
        b.anim = [sm, 4, sy - 0.23, k * 1.7 + c]; const th = k % 2 ? 0.2 : 0.27;
        b.box(side * 3.455, sy - 0.23 - th / 2, sz0 - sl / 2 + (k + 0.5) * tw, 0.014, th, tw * 0.96, k % 2 ? sc(pale, 0.75) : sc(sgc, 0.85), 1, 0.55, 0.9); }
      b.anim = [0, 0, 0, 0];
      if (!lo) b.box(side * 3.43, sy, z, 0.03, 0.13, sl * 0.8, mx(sg, rgb(0.75, 0.72, 0.6), 0.75), 1, 1, 1);
      b.mat = 3; b.box(side * 3.43, 3.72, z, 0.05, 0.05, ln, rgb(0.4, 0.4, 0.42));
      b.mat = 0;
      const top = lo && R.chance(0.55) ? 1 : R();
      if (top < 0.3) { const tx = side * 4.3, tz = z + R.range(-0.6, 0.6); b.cyl(tx, H + 0.1, tz, 0.42, 0.42, 0.85, 9, sc(C.blue, 0.75)); b.cyl(tx, H + 0.95, tz, 0.44, 0.1, 0.12, 9, sc(C.blue, 0.6)); }
      else if (top < 0.62) for (let k = 0, nk = R.int(2, 4); k < nk; k++) { // potted bougainvillea
        const px = side * R.range(3.85, 4.6), pz = z + R.range(-ln * 0.4, ln * 0.4), ph = R.range(0.3, 0.6);
        b.cyl(px, H + 0.1, pz, 0.13, 0.17, 0.26, 6, rgb(0.42, 0.2, 0.1));
        b.blob(px, H + 0.36 + ph * 0.5, pz, ph * 0.7, ph * 0.6, ph * 0.7, rgb(0.10, 0.26, 0.07), 5, 3, false, R.chance(0.6) ? rgb(0.62, 0.07, 0.3) : rgb(0.25, 0.42, 0.1));
      } else if (top < 0.8) { b.box(side * 4.3, H + 0.3, z, 0.6, 0.4, 0.9, rgb(0.5, 0.5, 0.48)); b.box(side * 4.3 - side * 0.31, H + 0.3, z, 0.02, 0.3, 0.7, rgb(0.15, 0.15, 0.15)); }
      // wire post where a bundle crosses
      c += w;
      await S.pause();   // one shop per step
    }
  }
}

// one tray of goods at lane position (x, y = tray base, s), sx deep, sz along the lane
function tray(S, b, x, y, s, sx, sz, kind, real) {
  const { R, Z, C } = S, z = Z(s), nReal = (n) => (real ? Math.round(n * S.detail) : 0);
  const lon = S.detail > 0.6 ? 6 : 5, hl = S.detail > 0.5 ? 3 : 2;
  b.mat = 2; b.aux = 0.25;
  b.box(x, y + 0.025, z, sx, 0.05, sz, R.pick([rgb(0.66, 0.66, 0.62), rgb(0.62, 0.64, 0.66), rgb(0.25, 0.42, 0.6), rgb(0.5, 0.52, 0.5)]), 1.08, 1.05, 0.7);
  const y0 = y + 0.045, rx = sx * 0.44, rz = sz * 0.45;
  const onDome = (h) => { const a = R.range(0, 6.283), t = Math.sqrt(R()) * 0.92, k = Math.sqrt(Math.max(0, 1 - t * t)); return [x + Math.cos(a) * t * rx, y0 + h * k, z + Math.sin(a) * t * rz]; };
  const heap = (col, top, h, cellsPerM) => { b.mat = 4; b.aux = cellsPerM; b.blob(x, y0, z, rx, h, rz, col, lon, hl, true, top); };
  if (kind === 'lime' || kind === 'mango' || kind === 'tomato') {
    const col = kind === 'lime' ? rgb(0.30, 0.50, 0.06) : kind === 'mango' ? rgb(0.17, 0.05, 0.13) : rgb(0.62, 0.09, 0.04);
    const h = R.range(0.14, 0.3), r = kind === 'lime' ? 0.036 : 0.043;
    heap(sc(col, 0.8), col, h, kind === 'lime' ? 15 : 12);
    b.mat = 2; b.aux = 0.15;
    for (let k = 0, n = nReal(9); k < n; k++) { const p = onDome(h); const q = sc(col, R.range(0.8, 1.25));
      b.blob(p[0], p[1] + r * 0.5, p[2], r, r * 0.92, r, q, 5, 2);
      if (kind === 'mango') b.blob(p[0], p[1] + r * 1.35, p[2], r * 0.5, r * 0.22, r * 0.5, rgb(0.25, 0.4, 0.12), 4, 1, true); }
  } else if (kind === 'chilliR' || kind === 'chilliG') {
    const col = kind === 'chilliR' ? rgb(0.66, 0.05, 0.03) : rgb(0.22, 0.46, 0.06), h = R.range(0.08, 0.16);
    heap(sc(col, 0.75), col, h, 26);
    b.mat = 2; b.aux = 0.1;
    for (let k = 0, n = nReal(8); k < n; k++) { const p = onDome(h), a = R.range(0, 3.14);
      b.M.makeRotationY(a).setPosition(p[0], p[1] + 0.012, p[2]);
      b.blob(0, 0, 0, 0.013, 0.013, 0.065, sc(col, R.range(0.85, 1.3)), 4, 2); b.M.identity(); }
  } else if (kind === 'papaya') {
    b.mat = 0; b.box(x, y0 + 0.008, z, sx * 0.95, 0.012, sz * 0.95, rgb(0.12, 0.33, 0.08), 1, 1, 1);
    for (let k = 0, n = 3 + nReal(3); k < n; k++) { const pz = z + ((k + 0.5) / n - 0.5) * sz * 0.85, px = x + R.range(-0.04, 0.04);
      b.mat = 2; b.aux = 0.2; b.blob(px, y0 + 0.01, pz, sx * 0.36, 0.06, sz * 0.36 / n * 1.5, rgb(0.20, 0.36, 0.08), 6, 2, true, rgb(0.80, 0.33, 0.04));
      b.mat = 4; b.aux = 60; b.blob(px, y0 + 0.055, pz, sx * 0.22, 0.014, sz * 0.1 / n * 1.5, rgb(0.05, 0.04, 0.03), 4, 1, true); }
  } else if (kind === 'fish' || kind === 'squid') {
    b.mat = 2; b.aux = 1.0; b.blob(x, y0, z, rx * 1.02, R.range(0.06, 0.1), rz * 1.02, rgb(0.62, 0.67, 0.72), lon, 2, true, rgb(0.78, 0.80, 0.82));
    const n = 3 + nReal(4), fishy = kind === 'fish';
    for (let k = 0; k < n; k++) { const pz = z + ((k + 0.5) / n - 0.5) * sz * 0.8, a = R.range(-0.25, 0.25) + (x > 0 ? 0 : Math.PI);
      b.M.makeRotationY(Math.PI / 2 + a).setPosition(x + R.range(-0.03, 0.03), y0 + 0.085, pz);
      b.aux = 0.6;
      if (fishy) { b.blob(0, 0, 0, 0.042, 0.022, 0.15, rgb(0.52, 0.56, 0.6), 5, 3, false, rgb(0.10, 0.22, 0.30)); b.blob(0, 0, -0.17, 0.035, 0.006, 0.04, rgb(0.12, 0.2, 0.26), 4, 2); }
      else { b.blob(0, 0, 0, 0.035, 0.026, 0.1, rgb(0.62, 0.50, 0.50), 5, 2, false, rgb(0.66, 0.4, 0.45)); b.blob(0, 0, 0.13, 0.03, 0.012, 0.06, rgb(0.6, 0.45, 0.5), 4, 2); }
      b.M.identity(); }
    if (real && y > 0.6 && b.anim[1] === 0) drips(S, b, x, y, s, sz);   // meltwater off the bench's edge
  } else if (kind === 'crab') {
    heap(rgb(0.36, 0.2, 0.1), rgb(0.6, 0.3, 0.1), 0.1, 9);
    b.mat = 2; b.aux = 0.1;
    for (let k = 0, n = nReal(5); k < n; k++) { const p = onDome(0.1); b.blob(p[0], p[1] + 0.02, p[2], 0.075, 0.03, 0.055, rgb(0.62, 0.26, 0.07), 5, 2, false, rgb(0.42, 0.3, 0.2)); }
  } else if (kind === 'orchid') {
    const h = R.range(0.12, 0.24); heap(rgb(0.34, 0.07, 0.32), rgb(0.62, 0.24, 0.6), h, 17);
    b.mat = 0;
    for (let k = 0, n = nReal(7); k < n; k++) { const p = onDome(h), w = R.chance(0.35); b.blob(p[0], p[1] + 0.02, p[2], 0.045, 0.03, 0.045, w ? rgb(0.74, 0.7, 0.72) : rgb(0.6, 0.16, 0.56), 5, 2); }
  } else if (kind === 'marigold') {
    const h = R.range(0.12, 0.26); heap(rgb(0.72, 0.36, 0.02), rgb(0.86, 0.56, 0.04), h, 19);
    b.mat = 0;
    for (let k = 0, n = nReal(7); k < n; k++) { const p = onDome(h), w = R.chance(0.3); b.blob(p[0], p[1] + 0.02, p[2], 0.04, 0.03, 0.04, w ? rgb(0.72, 0.7, 0.6) : rgb(0.88, 0.5, 0.03), 5, 2); }
  } else { // greens: bundles of morning glory and herbs on banana leaf
    heap(rgb(0.07, 0.22, 0.05), rgb(0.2, 0.42, 0.1), R.range(0.1, 0.2), 8);
    b.mat = 0;
    for (let k = 0, n = nReal(5); k < n; k++) { const p = onDome(0.14);
      b.M.makeRotationY(R.range(-0.4, 0.4)).setPosition(p[0], p[1] + 0.02, p[2]);
      b.blob(0, 0, 0, 0.16, 0.03, 0.04, rgb(0.13, 0.36, 0.08), 4, 2, false, rgb(0.3, 0.5, 0.14)); b.M.identity(); }
  }
  b.mat = 0; b.aux = 0;
}
const STALLS = {
  fruit: ['lime', 'mango', 'papaya', 'tomato', 'lime', 'mango'],
  veg: ['chilliR', 'chilliG', 'greens', 'lime', 'chilliR', 'tomato'],
  fish: ['fish', 'squid', 'crab', 'fish', 'fish', 'squid'],
  flowers: ['marigold', 'marigold', 'greens', 'marigold', 'lime', 'marigold'],
  quarter: ['marigold', 'orchid', 'marigold', 'marigold', 'orchid', 'marigold'],   // the flower quarter: heaps of marigold and orchid only
};

// things hung from a stall rail at (x, yTop, s); they swing about the rail when the cab's wind hits them
function hang(S, b, x, yTop, s, what) {
  const { R, Z, C } = S, z = Z(s);
  b.anim = [s, 2, yTop, R.range(0, 6.28)];
  const flex = (len) => { b.mat = 0; b.aux = -1; b.tube([[x, yTop, z], [x, yTop - len, z]], 0.0075, 3, rgb(0.10, 0.065, 0.04)); b.aux = 0; };   // (aux -1: kept a pixel and a half wide at distance by the shader)
  if (what === 'bulbHigh') {   // a bulb close under its wires: the same draws as a stall bulb, but its flex is short, so it clears the cab's roof by more than two metres
    const len = Math.min(R.range(0.35, 0.75), 0.12); flex(len);
    b.cyl(x, yTop - len - 0.05, z, 0.022, 0.022, 0.06, 5, rgb(0.08, 0.08, 0.08));
    b.mat = 1; b.aux = R.range(4.5, 7) * (S.bulbGain || 1); b.blob(x, yTop - len - 0.1, z, 0.045, 0.058, 0.045, rgb(1.0, 0.72, 0.36), 5, 3);
    b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0; return; }
  if (what === 'bulb') {
    const len = R.range(0.35, 0.75); flex(len);
    b.cyl(x, yTop - len - 0.05, z, 0.022, 0.022, 0.06, 5, rgb(0.08, 0.08, 0.08));
    b.mat = 1; b.aux = R.range(4.5, 7) * (S.bulbGain || 1); b.blob(x, yTop - len - 0.1, z, 0.045, 0.058, 0.045, rgb(1.0, 0.72, 0.36), 5, 3);
  } else if (what === 'scale') {
    const len = 0.3; flex(len); const yb = yTop - len;
    b.mat = 3; b.box(x, yb, z, 0.03, 0.03, 0.5, rgb(0.75, 0.56, 0.2));
    for (const e of [-0.24, 0.24]) {
      b.tube([[x, yb, z + e], [x - 0.11, yb - 0.42, z + e]], 0.014, 3, rgb(0.5, 0.38, 0.14)); b.tube([[x, yb, z + e], [x + 0.11, yb - 0.42, z + e]], 0.014, 3, rgb(0.5, 0.38, 0.14));
      b.cyl(x, yb - 0.47, z + e, 0.07, 0.15, 0.05, 8, rgb(0.78, 0.58, 0.2), true, 0.6);
    }
  } else if (what === 'bags') {
    for (let k = 0, n = S.detail > 0.5 ? R.int(2, 4) : 2; k < n; k++) { const zz = z + (k - (n - 1) / 2) * 0.2, len = R.range(0.25, 0.5);
      b.mat = 0; b.aux = -1; b.tube([[x, yTop, zz], [x, yTop - len, zz]], 0.0075, 3, rgb(0.5, 0.5, 0.5)); b.aux = 0;
      b.mat = 2; b.aux = 0.04; b.blob(x, yTop - len - 0.11, zz, 0.07, 0.115, 0.07, R.pick([rgb(0.7, 0.25, 0.4), rgb(0.62, 0.6, 0.5), rgb(0.2, 0.45, 0.65), rgb(0.72, 0.5, 0.08), rgb(0.6, 0.12, 0.08)]), 6, 4, false, rgb(0.7, 0.68, 0.6)); }
  } else { // garland strands: marigold and jasmine
    const hi = S.detail > 0.5;
    for (let k = 0, n = hi ? R.int(3, 5) : 2; k < n; k++) { const zz = z + (k - (n - 1) / 2) * 0.13, len = R.range(0.5, 0.95), nb = Math.round(len / (hi ? 0.074 : 0.1)), og = R.range(0.40, 0.54);
      b.mat = 0;
      for (let j = 0; j < nb; j++) { const yy = yTop - 0.05 - (len * (j + 0.5)) / nb, w = j % 5 === 4 || j === 0;
        b.blob(x, yy, zz, hi ? 0.037 : 0.045, hi ? 0.036 : 0.043, hi ? 0.037 : 0.045, w ? rgb(0.74, 0.72, 0.62) : rgb(0.86, og + 0.04 * (j % 2), 0.03), hi ? 5 : 4, 3); }
      b.blob(x, yTop - len - 0.06, zz, 0.022, 0.05, 0.022, rgb(0.74, 0.72, 0.62), 4, 2); b.blob(x, yTop - len - 0.15, zz, 0.034, 0.06, 0.034, C.red, 5, 3); }
  }
  b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
}

// a hand of bananas, or a cluster of net bags of fruit, on a stall's crossbar (drawn with S.R2 only, so the street's other random draws stay as they were)
function hangBunch(S, b, x, yTop, s, quarter) {
  const R2 = S.R2, z = S.Z(s), len = 0.16 + 0.2 * R2();
  b.anim = [s, 2, yTop, R2() * 6.28]; b.mat = 0; b.aux = 0;
  b.tube([[x, yTop, z], [x, yTop - len, z]], 0.014, 3, rgb(0.3, 0.26, 0.16));
  if (R2() < (quarter ? 0.3 : 0.6)) {   // bananas: two tiers of fingers curving out and down from the stalk
    const ripe = 0.4 + 0.6 * R2(), y0 = yTop - len;
    b.cyl(x, y0 - 0.34, z, 0.02, 0.028, 0.36, 4, rgb(0.24, 0.3, 0.1), false);
    for (let t = 0; t < 2; t++) for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.283 + t * 0.6, r = 0.07 + 0.012 * t, c = mx(rgb(0.36, 0.5, 0.08), rgb(0.82, 0.62, 0.08), Math.min(1, ripe + 0.25 * R2()));
      b.blob(x + Math.cos(a) * r, y0 - 0.1 - t * 0.14, z + Math.sin(a) * r, 0.03, 0.085, 0.03, sc(c, 0.75), 4, 2, false, c); }
  } else {                              // net bags of limes, oranges, mangosteen or marigold heads
    for (let k = 0, n = 2 + Math.floor(R2() * 2); k < n; k++) { const zz = z + (k - (n - 1) / 2) * 0.17, l2 = len + 0.1 + 0.25 * R2(), q = R2();
      const c = quarter ? (q < 0.6 ? rgb(0.86, 0.5, 0.04) : rgb(0.62, 0.2, 0.56)) : q < 0.35 ? rgb(0.36, 0.56, 0.08) : q < 0.7 ? rgb(0.84, 0.42, 0.04) : rgb(0.3, 0.07, 0.2);
      b.mat = 0; b.tube([[x, yTop, zz], [x, yTop - l2, zz]], 0.012, 3, rgb(0.5, 0.5, 0.46));
      b.mat = 4; b.aux = 16; b.blob(x, yTop - l2 - 0.13, zz, 0.085, 0.15, 0.085, sc(c, 0.7), 5, 3, false, c); }
  }
  b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
}

async function buildStalls(S) {
  const { R, B, Z, cells, C } = S;
  const wood = rgb(0.33, 0.24, 0.14), bamboo = rgb(0.5, 0.41, 0.2);
  const parasolCells = [], cats = {};
  for (const side of [-1, 1]) {
    let type = R.pick(Object.keys(STALLS));
    for (let c = 0; c < cells; c++) {
      const s = c * 3 + 1.5, z = Z(s), inBlue = !!S.blue && s > S.blue[0] && s < S.blue[1], bReal = B(s), b = inBlue ? SINK : bReal;
      if (S.inGap(s, side)) continue;
      await S.pause();   // one stall per step
      // the blue-and-white run: the stall the street would have drawn here is drawn into nothing (its random draws are taken as before), and a
      // fishmonger's stands in its place on a timber staging level with the sleepers
      const np0 = parasolCells.length, nq0 = S.pots.length;
      cell: {
      if (!R.chance(0.55)) type = R.pick(['fruit', 'veg', 'fish', 'flowers', 'fruit', 'veg']);
      const quarter = S.inKind(s, 3), real = !S.inKind(s, 2);   // (in the dim hall the heaps are shader-drawn only)
      if (quarter) type = 'flowers';
      b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
      if (R.chance(0.09)) { // a gap in the stalls: stacked crates, stools and baskets
        let top = null;
        for (let k = 0, n = R.int(3, 6); k < n; k++) { const xx = side * R.range(2.5, 3.2), zz = z + R.range(-1.1, 1.1), st = R.int(1, 3);
          if (!top || st > top[2] || (st === top[2] && Math.abs(xx) < Math.abs(top[0]))) top = [xx, zz, st];
          b.mat = 6; for (let j = 0; j < st; j++) b.box(xx, 0.17 + j * 0.31, zz, 0.42, 0.3, 0.58, sc(R.pick([C.blue, C.blue, C.red, C.green]), R.range(0.6, 0.9)), 1.06, 1.04, 0.7); b.mat = 0; }
        // the first stack of crates on each side of the lane has a cat asleep on it
        if (!inBlue && real && s > 6 && !cats[side]) { cats[side] = 1; cat(S, b, top[0], 0.32 + (top[2] - 1) * 0.31, S.len / 2 - top[1], hs(c * 1.31 + side * 0.77)); b.mat = 0; }
        for (let k = 0; k < 3; k++) { const xx = side * 2.6, zz = z + 1.2 - k * 0.02; b.cyl(xx, 0.02 + k * 0.1, zz, 0.15, 0.13, 0.42, 6, sc(R.pick([C.red, C.blue]), 0.8)); }
        break cell;
      }
      const wc = sc(wood, R.range(0.8, 1.2));
      b.box(side * 2.87, 0.83, z, 1.2, 0.05, 2.72, wc, 1, 1, 0.8);
      const lo = S.detail <= 0.5;
      for (const ex of lo ? [] : [2.33, 3.4]) for (const ez of [-1.28, 1.28]) b.box(side * ex, 0.4, z + ez, 0.06, 0.8, 0.06, sc(wc, 0.8));
      b.box(side * 3.17, 0.98, z, 0.56, 0.25, 2.62, sc(wc, 0.9));
      if (lo || R.chance(0.6)) b.box(side * 2.262, 0.52, z, 0.02, 0.58, 2.6, sc(R.pick([C.blue, C.green, C.red, rgb(0.55, 0.53, 0.45), C.saffron]), R.range(0.45, 0.7)), 1, 1, 0.75);
      const goods = STALLS[quarter ? 'quarter' : type], o = R.int(0, 5);
      for (let k = 0; k < 3; k++) {
        if (!lo) tray(S, b, side * (2.56 + R.range(-0.02, 0.02)), 0.855, s + (k - 1) * 0.9, 0.52, 0.82, goods[(k + o) % 6], real);
        else if (k < 2) tray(S, b, side * 2.56, 0.855, s + (k - 0.5) * 1.34, 0.52, 1.24, goods[(k + o) % 6], real);
        if (!lo) tray(S, b, side * 3.17, 1.105, s + (k - 1) * 0.88, 0.5, 0.8, goods[(k + o + 3) % 6], false);
        else if (k === 1) tray(S, b, side * 3.17, 1.105, s, 0.5, 2.5, goods[(k + o + 3) % 6], false);
      }
      // under the bench
      if (R.chance(0.35 + 0.5 * S.detail)) for (let k = 0, n = R.int(1, 3); k < n; k++) {
        const xx = side * R.range(2.6, 3.1), zz = z + (k - 1) * 0.85 + R.range(-0.1, 0.1);
        if (R.chance(0.5)) { b.mat = 6; b.box(xx, 0.17, zz, 0.42, 0.3, 0.6, sc(C.blue, R.range(0.55, 0.85)), 1.06, 1.04, 0.7); b.mat = 0; }
        else { b.cyl(xx, 0.02, zz, 0.2, 0.27, 0.3, 7, rgb(0.42, 0.31, 0.15), false, 0.7); b.mat = 4; b.aux = 14; b.blob(xx, 0.3, zz, 0.25, 0.1, 0.25, sc(R.pick([C.orange, C.green, C.red]), 0.6), 5, 2, true); b.mat = 0; }
      }
      const para = R.chance(0.18);
      if (para) { parasolCells.push([s + R.range(-0.5, 0.5), side, 0]); if (!inBlue && real && hs(c * 5.3 + side * 2.1) < 0.2) sparrow(S, b, side * 2.33, 0.905, s + (hs(c * 1.9 + side) - 0.5) * 2.2, side, hs(c * 7.7 + side) * 6.283); break cell; }
      // bamboo frame over the stall front with things hung on it
      const fx = side * 2.3, ry = R.range(2.9, 3.08), bc = sc(bamboo, R.range(0.8, 1.15));
      b.box(fx, (0.85 + ry) / 2, z - 1.3, 0.05, ry - 0.85, 0.05, bc, 0.9, 0.9); b.box(fx, (0.85 + ry) / 2, z + 1.3, 0.05, ry - 0.85, 0.05, bc, 0.9, 0.9);
      b.box(fx, ry, z, 0.045, 0.045, 2.8, bc, 1, 1, 0.9);
      const nh = S.detail > 0.6 ? R.int(2, 4) : R.int(1, 2);
      for (let k = 0; k < nh; k++) {
        const hs = s - 1.1 + (2.2 * (k + 0.5)) / nh + R.range(-0.15, 0.15);
        hang(S, b, fx, ry - 0.02, hs, k === 0 ? 'bulb' : type === 'flowers' ? 'garland' : R.pick(['scale', 'bags', 'garland', 'bulb', 'bags']));
      }
      if ((s < 66 || quarter) && S.R2() < 0.85) hangBunch(S, b, fx, ry - 0.02, s + (S.R2() < 0.5 ? -1 : 1) * (0.95 + 0.2 * S.R2()), quarter);
      // an aluminium pot on a charcoal stove now and then
      if (R.chance(0.12)) { b.mat = 3; const pz = z + R.range(-0.9, 0.9); S.pots.push([S.len / 2 - pz, side * 2.2, 0.75]); b.cyl(side * 2.2, 0.0, pz, 0.16, 0.2, 0.42, 8, rgb(0.3, 0.2, 0.15)); b.cyl(side * 2.2, 0.42, pz, 0.22, 0.24, 0.26, 10, rgb(0.62, 0.63, 0.64)); b.cyl(side * 2.2, 0.68, pz, 0.24, 0.05, 0.07, 10, rgb(0.66, 0.67, 0.68)); b.mat = 0; }
      if (!inBlue) {   // small life and light that take no draw of the street's: a fluorescent tube over some stalls, a sparrow on a front tray
        if (hs(c * 3.7 + side * 1.3) < (quarter ? 0.2 : 0.34)) tubeLight(S, b, fx + side * 0.2, ry - 0.14, z + (hs(c * 2.3 + side) - 0.5) * 0.8, 1.3);
        if (real && hs(c * 5.3 + side * 2.1) < 0.2) sparrow(S, b, side * 2.33, 0.905, s + (hs(c * 1.9 + side) - 0.5) * 2.2, side, hs(c * 7.7 + side) * 6.283); }
      }
      if (inBlue) { const h = S.hAt(s), para = parasolCells.length > np0, pot = S.pots.length > nq0 ? S.pots[S.pots.length - 1] : null;
        if (para) parasolCells[parasolCells.length - 1][2] = h; if (pot) pot[2] += h;
        fishStall(S, bReal, side, s, c, para, pot, h); }
    }
  }
  return parasolCells;
}

// low wheeled trays that stand on the rail and are whipped back when the wave arrives
async function buildRailTrays(S) {
  const { R, B, Z, cells, C } = S;
  for (let c = 1; c < cells; c++) {
    if (!R.chance(0.42)) continue;
    await S.pause();
    const side = R.chance(0.5) ? 1 : -1, s = c * 3 + R.range(0.4, 2.6), z = Z(s), b = B(s), x = side * R.range(0.62, 0.8);
    if (S.hAt(s) > 0.02 || S.inGap(s, -1) || S.inGap(s, 1)) { R.range(0, 1); R.range(0, 1); R.pick([0, 1, 2, 3, 4]); continue; }
    b.anim = [s, 1, side * R.range(0.92, 1.05), R.range(-2, 2)]; b.mat = 0; b.aux = 0;
    if (S.detail > 0.5) b.box(x, 0.3, z, 0.74, 0.05, 1.0, rgb(0.3, 0.3, 0.32), 1, 1, 0.8); else b.box(x, 0.19, z, 0.74, 0.27, 1.0, rgb(0.2, 0.2, 0.22), 1, 1, 0.5);
    if (S.detail > 0.5) for (const ex of [-0.31, 0.31]) for (const ez of [-0.42, 0.42]) { b.box(x + ex, 0.2, z + ez, 0.04, 0.2, 0.04, rgb(0.22, 0.22, 0.24)); b.M.makeRotationZ(Math.PI / 2).setPosition(x + ex + 0.03, 0.1, z + ez); b.cyl(0, 0, 0, 0.07, 0.07, 0.04, 6, rgb(0.06, 0.06, 0.06)); b.M.identity(); }
    const kinds = R.pick([['mango', 'lime'], ['fish', 'squid'], ['chilliR', 'chilliG'], ['papaya', 'tomato'], ['marigold', 'greens']]);
    tray(S, b, x, 0.325, s - 0.25, 0.66, 0.46, kinds[0], true); tray(S, b, x, 0.325, s + 0.25, 0.66, 0.46, kinds[1], true);
    b.anim = [0, 0, 0, 0];
  }
}

// rails (they follow S.hAt, the height of the line above the ground), and black wire bundles sagging across the lane
// every 9 m with a bare bulb on the middle (none where the line is up on its trestle or the ground is open)
async function buildRailsAndWires(S, rails) {
  const { R, B, Z, cells, len } = S;
  const lo = S.detail <= 0.5, rl = lo ? 6 : 3;
  if (rails) for (let s = -48; s < len + S.after;) {
    const up = S.hAt(s) > 1e-3 || S.hAt(s + rl) > 1e-3, l = up ? 1.5 : rl, h0 = S.hAt(s), h1 = S.hAt(s + l);
    const b = B(Math.min(Math.max(s + l / 2, 0), len - 0.01)); b.anim = [0, 0, 0, 0];
    b.M.makeRotationX(Math.atan2(h1 - h0, l)).setPosition(0, (h0 + h1) / 2, Z(s + l / 2)); const L = Math.hypot(l, h1 - h0) + (up ? 0.02 : 0);
    for (const x of [-0.5, 0.5]) { b.mat = 0; b.aux = 0; b.box(x, 0.08, 0, 0.035, 0.1, L, rgb(0.17, 0.11, 0.08)); if (!lo) b.box(x, 0.045, 0, 0.12, 0.03, L, rgb(0.15, 0.1, 0.08));
      b.mat = 3; b.box(x, 0.135, 0, 0.065, 0.035, L, rgb(0.62, 0.62, 0.64), 0.8, 1, 0.45); }
    b.M.identity(); s += l;
    await S.pause();
  }
  for (let c = 1; c < cells; c += 3) {
    const s = c * 3, z = Z(s), b = B(s), y0 = 4.95 + R.range(-0.15, 0.3), y1 = 4.95 + R.range(-0.15, 0.3);
    b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
    const skip = S.hAt(s) > 0.3 || S.inGap(s, -1) || S.inGap(s, 1), xL = -3.72, nw = lo ? 2 : 3, sags = [], wobs = [];
    for (let w = 0; w < nw; w++) { sags.push(R.range(0.25, 0.6)); wobs.push(R.range(-0.04, 0.04)); }
    // the whole bundle is carried high enough that its lowest wire, and the bulb close under it, clear the cab by more than two metres (S.wireMin)
    let low = 1e9; for (let w = 0; w < nw; w++) low = Math.min(low, (y0 + y1) / 2 - sags[w] + w * 0.04);
    const lift = S.wireMin ? Math.max(0, S.wireMin - low) : 0;
    if (!skip) { b.box(-3.72, 4.7 + lift / 2, z, 0.09, 1.7 + lift, 0.09, rgb(0.25, 0.2, 0.15), 0.8, 0.8); b.box(3.72, 4.7 + lift / 2, z, 0.09, 1.7 + lift, 0.09, rgb(0.25, 0.2, 0.15), 0.8, 0.8); }
    for (let w = 0; w < nw; w++) {
      const sag = sags[w], pts = [], dz = (w - 1) * 0.03, wob = wobs[w];
      if (skip) continue;
      for (let k = 0, nk = lo ? 6 : 8; k <= nk; k++) { const t = k / nk; pts.push([xL + (3.72 - xL) * t, lift + y0 + (y1 - y0) * t - sag * 4 * t * (1 - t) + w * 0.04, z + dz + wob * Math.sin(t * 6.28)]); }
      b.anim = [s, 3, 0.016, 0]; b.tube(pts, 0.016, 3, rgb(0.03, 0.03, 0.035));
    }
    if (R.chance(0.7) && !skip) { if (S.wireMin) hang(S, b, R.range(-0.4, 0.4), low + lift - 0.01, s, 'bulbHigh'); else hang(S, b, R.range(-0.4, 0.4), Math.min(y0, y1) - 0.3, s, 'bulb'); }
    b.anim = [0, 0, 0, 0];
    await S.pause();
  }
  // weeds and sprays of morning glory in the ballast between the sleepers, wherever the line runs on the ground in the open: they stir, and lie flat as the nose
  // comes over them (kind 11). Placed by a hash of the place, so no draw of the street's is taken
  if (rails && S.weeds) for (let s = -38, n = 0; s < len + Math.min(S.after, 96); s += 1.5) {
    const q = hs(s * 1.37 + 3.1); if (q > 0.4 || S.hAt(s) > 0.02 || S.hAt(s + 2) > 0.02 || S.inKind(s, 2) || (S.inGap(s, -1) && S.inGap(s, 1)) || (s > -14 && s < 1.5)) continue;   // (none in the hall, on the paved square or on the planked crossing)
    const b = B(Math.min(Math.max(s, 0), len - 0.01)), q2 = hs(s * 2.91 + 7.7), q3 = hs(s * 5.13 + 1.9), ss = s + (q2 - 0.5), z = Z(ss);
    const x = q3 < 0.55 ? (q2 - 0.5) * 0.66 : (q3 < 0.78 ? -1 : 1) * (0.68 + 0.3 * q2), y = 0.035;
    b.anim = [ss, 11, y, q * 40]; b.mat = 0; b.aux = 0;
    const blade = (dx, dz, hh, lean, c) => { const i0 = b.vert(x + dx - 0.022, y, z + dz, 0, 0.5, 1, c.r * 0.6, c.g * 0.6, c.b * 0.6); b.vert(x + dx + 0.022, y, z + dz, 0, 0.5, 1, c.r * 0.6, c.g * 0.6, c.b * 0.6); b.vert(x + dx + lean, y + hh, z + dz - 0.03, 0, 0.7, 0.7, c.r, c.g, c.b); b.tri(i0, i0 + 1, i0 + 2); };
    if (q < 0.2) {   // morning glory: a low trailing mat of leaves with two or three flowers held up on it
      b.blob(x, y, z, 0.2 + 0.1 * q2, 0.05, 0.26 + 0.14 * q3, rgb(0.07, 0.19, 0.05), 5, 1, true, rgb(0.16, 0.36, 0.09));
      for (let k = 0; k < 3; k++) { const fx = (hs(s + k * 3.3) - 0.5) * 0.3, fz = (hs(s * 1.7 + k * 5.1) - 0.5) * 0.4, c = k === 1 ? rgb(0.7, 0.62, 0.74) : rgb(0.56, 0.3, 0.66);
        const i0 = b.vert(x + fx - 0.04, y + 0.075, z + fz, 0, 1, 0.2, c.r, c.g, c.b); b.vert(x + fx + 0.04, y + 0.075, z + fz, 0, 1, 0.2, c.r, c.g, c.b); b.vert(x + fx, y + 0.1, z + fz - 0.07, 0, 1, 0.2, c.r * 1.2, c.g * 1.2, c.b * 1.2); b.tri(i0, i0 + 1, i0 + 2); }
    } else for (let k = 0, nb = 3 + Math.floor(q3 * 3); k < nb; k++) { const a = hs(s * 3.3 + k * 1.7);   // a tuft of grass or dock gone to seed
      blade((a - 0.5) * 0.16, (hs(s + k * 2.3) - 0.5) * 0.14, 0.16 + 0.24 * hs(s * 0.7 + k), (a - 0.5) * 0.22, k === 0 && q3 > 0.5 ? rgb(0.46, 0.42, 0.16) : rgb(0.16 + 0.1 * a, 0.36 + 0.1 * q2, 0.08)); }
    b.anim = [0, 0, 0, 0];
    if (++n % 40 === 0) await S.pause();
  }
}

// the timber trestle that lifts the line off the ground (wherever S.hAt > 0), and the steel girder span over the water
async function buildTrestle(S, span) {
  const { B, Z, hAt, len } = S, timber = rgb(0.20, 0.145, 0.10), steel = rgb(0.13, 0.22, 0.19), stone = rgb(0.40, 0.385, 0.35);
  const inSpan = (s) => span && s > span[0] + 0.5 && s < span[1] - 0.5;
  let n = 0;
  for (let s = 0; s < len; s += 0.75) { const h = hAt(s); if (h < 0.02) continue;      // sleepers
    const b = B(s); b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
    b.M.makeRotationX(Math.atan((hAt(s + 0.4) - hAt(s - 0.4)) / 0.8)).setPosition(0, h, Z(s));
    b.box(0, -0.02, 0, 2.3, 0.1, 0.24, sc(timber, 0.8 + 0.5 * ((s * 7.31) % 1)), 1, 1, 0.8); b.M.identity();
    if (++n % 24 === 0) await S.pause(); }
  for (let s = 0; s < len; s += 3) { const h0 = hAt(s), h1 = hAt(s + 3), hm = (h0 + h1) / 2; if (hm < 0.04) continue;
    const b = B(s + 1.5), L = Math.hypot(3, h1 - h0) + 0.03; b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
    b.M.makeRotationX(Math.atan2(h1 - h0, 3)).setPosition(0, hm, Z(s + 1.5));
    if (!inSpan(s + 1.5)) for (const x of [-0.5, 0.5]) b.box(x, -0.26, 0, 0.2, 0.38, L, timber, 1, 1, 0.8);            // stringers under the rails
    if (hm < 1.0) b.box(0, -0.44 - hm / 2, 0, 2.1, hm + 0.1, L, rgb(0.15, 0.13, 0.105), 1.0, 1, 0.7);                   // the foot of the ramp: a ballast bank
    else for (const x of [-1, 1]) {                                                                                     // a plank walkway and a hand rail either side
      b.box(x * 1.5, 0.0, 0, 0.62, 0.05, L, sc(timber, 1.3), 1, 1, 0.85); b.box(x * 1.815, 1.02, 0, 0.07, 0.07, L, sc(timber, 1.1)); b.box(x * 1.815, 0.55, 0, 0.04, 0.04, L, timber);
      b.box(x * 1.815, 0.5, 1.2, 0.08, 1.04, 0.08, timber); }
    b.M.identity();
    await S.pause(); }
  for (let s = 0; s <= len; s += 6) { const h = hAt(s); if (h < 1.0 || inSpan(s)) continue;                              // bents: a cap on two battered legs, a sill, cross braces
    const b = B(s), z = Z(s), yt = h - 0.45, fx = 1.0 + 0.15 * yt; b.anim = [0, 0, 0, 0]; b.mat = 0; b.aux = 0;
    b.box(0, yt - 0.15, z, 2.8, 0.3, 0.32, timber);
    for (const sx of [-1, 1]) b.tube([[sx * 1.0, yt - 0.3, z], [sx * fx, 0, z]], 0.13, 5, timber);
    b.box(0, 0.12, z, fx * 2 + 0.5, 0.24, 0.36, sc(timber, 0.8));
    if (yt > 2.0) { b.tube([[-fx + 0.1, 0.3, z + 0.14], [0.95, yt - 0.5, z + 0.14]], 0.055, 4, sc(timber, 1.2)); b.tube([[fx - 0.1, 0.3, z - 0.14], [-0.95, yt - 0.5, z - 0.14]], 0.055, 4, sc(timber, 1.2)); }
    await S.pause(); }
  if (span) { const [a, c] = span, L = c - a, zm = Z((a + c) / 2), h = hAt((a + c) / 2), b = B((a + c) / 2); b.anim = [0, 0, 0, 0]; b.aux = 0;
    b.mat = 3;
    for (const x of [-0.95, 0.95]) { b.box(x, h - 0.78, zm, 0.12, 1.2, L + 1.6, steel, 1, 1, 0.75); b.box(x, h - 0.17, zm, 0.36, 0.06, L + 1.6, sc(steel, 1.3)); b.box(x, h - 1.4, zm, 0.36, 0.06, L + 1.6, sc(steel, 0.9));
      for (let s = a + 1; s < c; s += 2) b.box(x + Math.sign(x) * 0.09, h - 0.78, Z(s), 0.07, 1.14, 0.1, sc(steel, 1.15)); }
    for (let s = a + 1.5; s < c; s += 3) { b.box(0, h - 0.4, Z(s), 1.9, 0.1, 0.1, steel); b.tube([[-0.9, h - 1.3, Z(s)], [0.9, h - 0.35, Z(s)]], 0.04, 4, steel); }
    b.mat = 5;
    for (const [s, d] of [[a, -1], [c, 1]]) { const ph = h - 1.45; b.box(0, ph / 2 - 0.2, Z(s + d * 0.7), 3.6, ph + 0.4, 1.5, stone, 0.9, 0.86, 0.72); b.box(0, ph + 0.11, Z(s + d * 0.7), 3.5, 0.22, 1.5, sc(stone, 1.15)); }
    b.mat = 0; await S.pause(); }
}

// the yellow diesel railcar that rides the wave (own coordinates: eye above origin, nose toward -Z)
export function buildRailcar(R, C, livery) {
  const b = new Batch(() => 0, 0), body = livery[0], stripe = livery[1], dark = rgb(0.07, 0.07, 0.08), glass = rgb(0.05, 0.08, 0.10);
  const zc = 2.9, L = 9.2;
  b.box(0, 0.78, zc, 2.5, 0.36, L, dark);
  b.box(0, 1.58, zc, 2.8, 1.3, L, body, 1, 1, 0.7);
  b.box(0, 1.02, zc, 2.82, 0.2, L + 0.02, sc(body, 0.45));
  b.box(0, 2.05, zc, 2.84, 0.17, L + 0.02, stripe, 1, 1, 0.95);
  b.mat = 2; b.aux = 0.05; b.box(0, 2.7, zc, 2.74, 0.95, L - 0.1, glass, 1, 1, 1); b.mat = 0;
  for (let k = 0; k <= 6; k++) b.box(0, 2.7, zc - L / 2 + 0.12 + (k * (L - 0.24)) / 6, 2.8, 0.95, k === 0 || k === 6 ? 0.24 : 0.16, body);
  b.box(0, 3.26, zc, 2.8, 0.2, L, body, 0.97, 1, 0.85);
  b.box(0, 3.46, zc, 2.7, 0.22, L - 0.1, rgb(0.42, 0.42, 0.40), 0.72, 0.98, 0.9);
  for (let k = 0; k < 4; k++) b.box(R.range(-0.3, 0.3), 3.62, zc - 3 + k * 2, 0.5, 0.14, 0.7, rgb(0.33, 0.33, 0.32), 0.8, 0.8);
  // nose, tapered forward
  const RX = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  b.M.copy(RX).setPosition(0, 1.58, -2.05); b.box(0, 0, 0, 2.8, 0.7, 1.3, body, 0.86, 0.92, 1);
  b.M.copy(RX).setPosition(0, 2.05, -2.07); b.box(0, 0, 0, 2.84, 0.72, 0.17, stripe, 0.86, 1, 1);
  b.M.copy(RX).setPosition(0, 2.7, -1.98); b.mat = 2; b.aux = 0.05; b.box(0, 0, 0, 2.7, 0.56, 0.9, glass, 0.84, 0.9, 1); b.mat = 0;
  b.M.copy(RX).setPosition(0, 3.26, -2.0); b.box(0, 0, 0, 2.8, 0.62, 0.2, body, 0.84, 1, 1);
  b.M.identity();
  b.box(-1.3, 2.7, -1.75, 0.14, 0.95, 0.14, body); b.box(1.3, 2.7, -1.75, 0.14, 0.95, 0.14, body); b.box(0, 2.7, -2.24, 0.1, 0.95, 0.1, body);
  b.box(0, 3.2, -2.42, 2.4, 0.06, 0.3, sc(body, 0.7));
  b.box(0, 1.02, -2.42, 2.5, 0.3, 0.14, stripe);
  for (const x of [-0.78, 0.78]) { b.M.copy(RX).setPosition(x, 1.02, -2.5); b.mat = 3; b.cyl(0, 0, 0, 0.06, 0.06, 0.26, 6, rgb(0.3, 0.3, 0.32), false); b.M.copy(RX).setPosition(x, 1.02, -2.76); b.cyl(0, 0, 0, 0.2, 0.2, 0.06, 10, rgb(0.5, 0.5, 0.52)); b.M.identity(); b.mat = 0; }
  b.box(0, 0.98, -2.6, 0.1, 0.12, 0.3, dark);
  b.cyl(0, 1.94, -2.44, 0.17, 0.17, 0.02, 10, rgb(0.6, 0.6, 0.6));
  b.M.copy(RX).setPosition(0, 2.32, -2.4); b.cyl(0, 0, 0, 0.17, 0.19, 0.1, 10, rgb(0.5, 0.5, 0.5), false); b.M.identity();
  b.mat = 1; b.aux = 6; b.blob(0, 2.32, -2.5, 0.13, 0.13, 0.05, rgb(1.0, 0.9, 0.7), 8, 3); b.mat = 0; b.aux = 0;
  // marigold and jasmine garland on the hook
  for (let k = 0; k < 13; k++) { const t = k / 12, x = (t - 0.5) * 0.9, y = 1.5 - 0.42 * Math.sin(t * Math.PI);
    b.blob(x, y, -2.72 - 0.05 * Math.sin(t * Math.PI), 0.05, 0.05, 0.05, k % 3 === 1 ? rgb(0.75, 0.73, 0.62) : rgb(0.9, 0.5, 0.03), 5, 2); }
  // bogies and wheels
  for (const bz of [-0.3, 6.1]) {
    b.box(0, 0.45, bz, 1.9, 0.4, 2.3, dark, 1, 0.9);
    for (const wz of [-0.75, 0.75]) for (const x of [-0.5, 0.5]) { b.M.makeRotationZ(Math.PI / 2).setPosition(x + 0.05, 0.56, bz + wz); b.mat = 3; b.cyl(0, 0, 0, 0.41, 0.41, 0.1, 12, rgb(0.2, 0.2, 0.21)); b.mat = 0; b.M.identity(); }
  }
  b.box(0, 0.65, 2.9, 2.2, 0.5, 2.6, rgb(0.1, 0.09, 0.08), 1, 1);
  b.box(0, 1.95, zc + L / 2 + 0.02, 1.0, 1.9, 0.06, sc(body, 0.8));
  return b.build();
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const R = ctx.rng.fork ? ctx.rng.fork('folding-market-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map((h) => new THREE.Color(h));
  const C = { saffron: pal[0], orange: pal[1], green: pal[2], blue: pal[3], sun: pal[4], umber: pal[5], red: pal[6] };
  const cells = Math.max(6, Math.round((opts.length ?? 72) / 3)), len = cells * 3;
  const offFn = opts.offsetAt || (() => 0);
  const detail = Math.min(1, Math.max(0.25, opts.detail ?? 100 / len)) * (ctx.quality?.detail ?? 1);
  const Z = (s) => len / 2 - s;

  // per-seed cloth set: which colours dominate the roof
  const white = new THREE.Color(0.82, 0.79, 0.68), sets = [
    [C.saffron, C.green, white, C.blue], [C.green, C.saffron, C.blue, white], [C.saffron, white, C.green, C.orange],
    [white, C.blue, C.saffron, C.green], [C.orange, C.saffron, C.green, white]];
  const clothSet = sets[R.chance(0.45) ? 0 : R.int(1, sets.length - 1)];
  const sunDir = new THREE.Vector3(...(opts.sunDir ? (opts.sunDir.toArray ? opts.sunDir.toArray() : opts.sunDir) : [0.269 + R.range(-0.06, 0.06), 0.883, 0.385])).normalize();
  const U = {
    uCamS: { value: 0 }, uLead: { value: opts.lead ?? 9 }, uTime: { value: 0 }, uLen: { value: len },
    uSun: { value: sunDir }, uSunCol: { value: C.sun.clone().multiplyScalar(2.4) },
    uSkyCol: { value: new THREE.Color(0.30, 0.42, 0.62).multiplyScalar(0.55) },
    uShade: { value: C.umber.clone().multiplyScalar(3.2) }, uCamL: { value: new THREE.Vector3(0, 5, 100) },
    uPal: { value: clothSet.map((c) => c.clone()) }, uRed: { value: C.red.clone() }, uPx: { value: 600 },
    uLamp: { value: new THREE.Color(0, 0, 0) }, uGust: { value: new THREE.Vector2(0, 0) }, uTree: { value: new THREE.Vector4(0, 13, 0, 0) },
    uPortal: { value: new THREE.Vector4(0, 0, 0, 0) }, uPortalCol: { value: new THREE.Color(1, 0.8, 0.45) }, uWet: { value: 0 },
    uZone: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(-1e4, -1e4, 0, 9)) }, uHall: { value: new THREE.Vector2(-1e4, -1e4) }, uFlower: { value: new THREE.Vector2(-1e4, -1e4) },
    uBridge: { value: new THREE.Vector2(-1e4, -1e4) }, uTree2: { value: new THREE.Vector4(0, 13, 0, 0) }, uRamp: { value: opts.ramp ?? 9 }, uTintK: { value: 1 }, uHallLamp: { value: new THREE.Color(0.6, 0.34, 0.14) },
    uAwn: { value: new THREE.Vector4(...(opts.swing || [-0.42, 1.642, 1.6, 2.5])) }, uClear: { value: new THREE.Vector4(...(opts.clear ? [Math.atan((opts.clear[0] - 1.15) / Math.max(opts.clear[3], 0.05)), opts.clear[1], Math.max(opts.clear[2], 0.01), 0] : [-9, 0, 1, 0])) },
    uBandK: { value: 0 }, uHold: { value: new THREE.Vector2(...(opts.hold || [-1e4, -1e4])) }, uYard: { value: new THREE.Vector4(-1e4, -1e4, 14, 9.5) }, uBlue: { value: new THREE.Vector2(...(opts.blue || [-1e4, -1e4])) }, uUmb: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 0, 0)) },
  };
  const object = new THREE.Group(); object.name = 'folding-market-hero';

  // batches in 48 m chunks so the lane culls
  const nB = Math.max(1, Math.ceil(len / 48)), batches = [];
  for (let i = 0; i < nB; i++) batches.push(new Batch(offFn, len));
  const B = (s) => batches[Math.min(nB - 1, Math.max(0, Math.floor(s / 48)))];
  // the rooms of the lane: [s0, s1, side (-1 left, 1 right, 0 both), kind (0 open ground, 1 stalls without cloth, 2 roofed hall, 3 flower quarter)]
  const zones = (opts.zones || (opts.gaps || []).map((g) => [g[0], g[1], g[2], 0])).slice(0, 8);
  const zoneAt = (s, side, pred) => zones.some((z) => s >= z[0] && s < z[1] && (z[2] === 0 || z[2] === side) && pred(z[3]));
  const inGap = (s, side) => zoneAt(s, side, (k) => k === 0), noCloth = (s, side) => zoneAt(s, side, (k) => k <= 2), inKind = (s, kind) => zones.some((z) => s >= z[0] && s < z[1] && z[3] === kind);
  const hAt = opts.heightAt || (() => 0);
  let r2 = (Math.imul((Number(ctx.seed) || 1) | 0, 0x9E3779B1) ^ 0x5fa1c3) | 0;
  const R2 = () => { r2 = (r2 + 0x6D2B79F5) | 0; let t = Math.imul(r2 ^ (r2 >>> 15), 1 | r2); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const S = { R, R2, B, Z, cells, len, C, detail, inGap, noCloth, inKind, hAt, pots: [], after: opts.after ?? 30, bulbGain: opts.bulbGain ?? 1, pause: () => ctx.yield?.(), blue: opts.blue || null, tubeGain: opts.tubeGain ?? 1.2, wireMin: opts.wireMin ?? 0, weeds: !!opts.weeds };
  S.S3 = { ...S, R: ownRng(((Number(ctx.seed) || 1) * 2654435761) ^ 0x3b1f5) };   // the blue-and-white run draws from a stream of its own
  zones.forEach((z, i) => U.uZone.value[i].set(z[0], z[1], z[2], z[3]));
  { const hz = zones.find((z) => z[3] === 2), fz = zones.find((z) => z[3] === 3); if (hz) U.uHall.value.set(hz[0], hz[1]); if (fz) U.uFlower.value.set(fz[0], fz[1]); }
  if (opts.bridge) U.uBridge.value.set(opts.bridge[0], opts.bridge[1]);

  if (opts.walls !== false) await buildShops(S);
  await ctx.yield?.();
  const parasolCells = await buildStalls(S);
  await ctx.yield?.();
  await buildRailTrays(S);
  await buildRailsAndWires(S, opts.rails !== false);
  await ctx.yield?.();
  if (opts.heightAt) await buildTrestle(S, opts.span || null);
  await ctx.yield?.();
  const propMat = propMaterial(U);
  const street = [];
  for (const [i, b] of batches.entries()) { if (!b.nv) continue; const m = new THREE.Mesh(b.build(), propMat); m.name = 'fm-street'; m.userData.s0 = i * 48; object.add(m); street.push(m); await ctx.yield?.(); }

  // awnings
  {
    const g = awningGeometry(detail > 0.6 ? 8 : 6, detail > 0.6 ? 12 : 7, detail <= 0.5), iA = new Float32Array(cells * 2 * 4), iL = new Float32Array(cells * 2); let k = 0;
    for (let c = 0; c < cells; c++) for (const side of [-1, 1]) { const s = c * 3 + 1.5, h = R(); if (noCloth(s, side)) continue; iL[k / 4] = hAt(s); iA[k++] = s; iA[k++] = side; iA[k++] = offFn(s); iA[k++] = h; }
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iL', new THREE.InstancedBufferAttribute(iL, 1)); g.instanceCount = k / 4;
    const m = new THREE.Mesh(g, awningMaterial(U)); m.frustumCulled = false; m.name = 'fm-awnings'; object.add(m);
  }
  await ctx.yield?.();
  const free = opts.freeParasols || [];   // [s, x, base y, scale]: big market umbrellas standing in the open, never furled
  if (parasolCells.length + free.length) {
    const np = parasolCells.length + free.length, g = parasolGeometry(), iA = new Float32Array(np * 4), iB = new Float32Array(np * 3); let k = 0, j = 0;
    for (const [s, side, lift] of parasolCells) { iA[k++] = s; iA[k++] = side; iA[k++] = offFn(s); iA[k++] = R(); iB[j++] = side * 2.78; iB[j++] = 0.88 + (lift || 0); iB[j++] = 1; }
    for (const [s, x, y0, k2] of free) { iA[k++] = s; iA[k++] = 0; iA[k++] = offFn(s); iA[k++] = R(); iB[j++] = x; iB[j++] = y0; iB[j++] = k2; }
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 3)); g.instanceCount = np;
    const m = new THREE.Mesh(g, parasolMaterial(U)); m.frustumCulled = false; m.name = 'fm-parasols'; object.add(m);
  }
  await ctx.yield?.();
  if (opts.ground !== false) { const m = new THREE.Mesh(groundGeometry(len, offFn, S.after, opts.waterCut || null), groundMaterial(U)); m.frustumCulled = false; m.name = 'fm-ground'; object.add(m); }
  await ctx.yield?.();
  if (opts.dust !== false) {
    const n = Math.round(len * 9 * (ctx.quality?.detail ?? 1)), P = new Float32Array(n * 3), Sd = new Float32Array(n * 4), Of = new Float32Array(n);
    for (let i = 0; i < n; i++) { const s = R.range(0, len); Of[i] = offFn(s); P[i * 3] = R.range(-3.1, 3.1) + Of[i]; P[i * 3 + 1] = R.range(0, 3.6); P[i * 3 + 2] = Z(s); Sd[i * 4] = R(); Sd[i * 4 + 1] = R(); Sd[i * 4 + 2] = R(); Sd[i * 4 + 3] = R(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(Sd, 4)); g.setAttribute('aOff', new THREE.BufferAttribute(Of, 1));
    const m = new THREE.Points(g, dustMaterial(U)); m.frustumCulled = false; m.name = 'fm-dust'; object.add(m);
  }
  let car = null; const carShift = new THREE.Vector3();
  if (opts.railcar !== false) {
    const liveries = [[rgb(0.80, 0.52, 0.03), sc(C.red, 0.85)], [rgb(0.80, 0.52, 0.03), sc(C.red, 0.85)], [rgb(0.78, 0.33, 0.05), rgb(0.72, 0.68, 0.55)], [rgb(0.16, 0.30, 0.55), rgb(0.74, 0.72, 0.64)]];
    car = new THREE.Mesh(buildRailcar(R, C, R.pick(liveries)), propMaterial(U, carShift)); car.frustumCulled = false; car.name = 'fm-railcar'; object.add(car);
  }
  await ctx.yield?.();

  const laneToLocal = (s, x = 0, y = 0, out = new THREE.Vector3()) => out.set(x + offFn(s), y, Z(s));
  const EYE = 2.55, fly = [];
  for (let s = -30; s <= len + 30.01; s += 6) fly.push(laneToLocal(s, 0, EYE));
  const anchors = {
    entry: { position: laneToLocal(-16, 0, EYE), direction: new THREE.Vector3(0, 0, -1) },
    flyThrough: fly,
    portalSeat: { position: laneToLocal(len + 65, 0, EYE), normal: new THREE.Vector3(0, 0, 1), radius: 7 },
    waveFront: (camS, out = new THREE.Vector3()) => laneToLocal(camS + U.uLead.value + 5, 0, 3.2, out),
    viewpoints: { entryView: laneToLocal(-16, 0, EYE), sideHigh: new THREE.Vector3(24, 11, 0), exitBack: laneToLocal(len + 8, 0, 1.8) },
    hinges: { x: 3.5, y: 3.7, cell: 3 }, railHeadY: 0.15, eyeY: EYE, clearBox: { w: 3.0, h: 3.8 },
  };

  let progress = null, camS = 0; const tmp = new THREE.Vector3(), size = new THREE.Vector2(), cullAhead = opts.cullAhead ?? 1e9;
  const hero = {
    object, radius: Math.max(14, len * 0.265), height: 7, center: new THREE.Vector3(0, 2.6, 0), anchors,
    uniforms: U, glsl: FM_GLSL, laneToLocal, length: len, ground: true, groundY: 0, pots: S.pots, propMat, offsetAt: offFn,
    makeBatch: (flat) => new Batch(flat ? () => 0 : offFn, flat ? 0 : len), makePropMaterial: (shift) => propMaterial(U, shift),
    setProgress(u) { progress = u; if (u != null) camS = -30 + (len + 60) * Math.min(1, Math.max(0, u)); },
    setCamS(s) { progress = 0; camS = s; },
    setLead(m) { U.uLead.value = m; },
    street, zones, heightAt: hAt,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (progress == null) { const per = len + 50; camS = -25 + ((time * 9) % per); }
      U.uCamS.value = camS;
      for (let i = 0; i < street.length; i++) { const s0 = street[i].userData.s0; street[i].visible = s0 < camS + cullAhead && s0 + 48 > camS - 80; }
      if (camera) {
        object.updateWorldMatrix(true, false);
        U.uCamL.value.copy(object.worldToLocal(tmp.setFromMatrixPosition(camera.matrixWorld)));
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = size.y / (2 * Math.tan(((camera.fov || 60) * Math.PI) / 360)); }
      }
      if (car) {
        carShift.set(offFn(camS), 0.012 * Math.sin(camS * 0.52) , Z(camS));
        car.position.copy(carShift); car.rotation.z = 0.008 * Math.sin(camS * 0.52 + 1.0);
      }
    },
    dispose() {},
  };
  hero.update(0, 0, null);
  return hero;
}

// ---------------------------------------------------------------- the cab the camera rides in (built by the world)
// CAB SPACE: the eye is at the origin looking down -Z, +Y up, +X right. Everything sits at the edges of the frame:
// dash ledge and sloping nose along the bottom, pillars at the far left and right, a visor along the top, a convex
// mirror on the left pillar. Returns { object, garland, mirror, shift, livery } ; the world places `object` at the
// camera every frame and copies its world position into `shift` (the cab takes the lane's sun and cloth shade).
export const CAB_LIVERIES = [[[0.62, 0.40, 0.03], [0.42, 0.06, 0.04]], [[0.60, 0.26, 0.04], [0.60, 0.56, 0.45]], [[0.13, 0.25, 0.46], [0.62, 0.60, 0.53]], [[0.60, 0.56, 0.46], [0.42, 0.06, 0.04]]];
export function buildCab(hero, R, liveryIndex = 0) {
  const U = hero.uniforms, lv = CAB_LIVERIES[liveryIndex % CAB_LIVERIES.length];
  const body = rgb(...lv[0]), stripe = rgb(...lv[1]), dark = rgb(0.05, 0.05, 0.055), steel = rgb(0.52, 0.52, 0.54);
  const shift = new THREE.Vector3(), object = new THREE.Group(); object.name = 'fm-cab';
  const b = new Batch(() => 0, 0), RX = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  // dash ledge and windscreen sill along the very bottom of the frame
  b.box(0, -0.86, -1.0, 2.7, 0.06, 0.62, rgb(0.085, 0.08, 0.075), 1, 1, 0.9);
  b.box(0, -0.80, -1.32, 2.8, 0.07, 0.07, dark);
  // the nose: a crowned bonnet with rounded shoulders that slopes forward and rolls over to the buffer beam
  const ROWS = [[-1.34, -0.845], [-1.56, -0.872], [-1.78, -0.905], [-1.98, -0.945], [-2.16, -0.992], [-2.30, -1.05], [-2.39, -1.13], [-2.43, -1.26], [-2.43, -1.44]];
  const nose = (u, v, lift = 0) => { const f = Math.min(ROWS.length - 1.001, v * (ROWS.length - 1)), j = Math.floor(f), t = f - j, z = ROWS[j][0] + (ROWS[j + 1][0] - ROWS[j][0]) * t, y = ROWS[j][1] + (ROWS[j + 1][1] - ROWS[j][1]) * t;
    const q = u * 2 - 1, hw = 1.33 - 0.17 * Math.min(1, v * 1.3), a = Math.abs(q), sh = a > 0.78 ? ((a - 0.78) / 0.22) ** 2 : 0, top = Math.min(1, (1 - v) * 4);
    return [q * hw * (1 - 0.03 * sh), y + (0.075 * (1 - q * q) - 0.2 * sh) * (0.35 + 0.65 * top) + lift, z + 0.05 * sh * (1 - top)]; };
  const surf = (nu, nv, f, colf) => { const base = b.nv, e = 0.004;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv, p = f(u, v), a0 = f(Math.max(0, u - e), v), a1 = f(Math.min(1, u + e), v), b0 = f(u, Math.max(0, v - e)), b1 = f(u, Math.min(1, v + e));
      const ax = a1[0] - a0[0], ay = a1[1] - a0[1], az = a1[2] - a0[2], bx = b1[0] - b0[0], by = b1[1] - b0[1], bz = b1[2] - b0[2], c = colf(u, v);
      b.vert(p[0], p[1], p[2], ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx + 1e-9, c.r, c.g, c.b); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, c = a + nu + 1; b.quad(a, a + 1, c + 1, c); } };
  b.mat = 2; b.aux = 0.03;
  surf(14, 16, (u, v) => nose(u, v), (u, v) => { const q = Math.abs(u * 2 - 1), g = (1 - 0.3 * v * v * v) * (0.74 + 0.26 * (1 - q * q)) * (0.8 + 0.2 * Math.min(1, v * 9)) * (v > 0.8 ? 0.62 : 1); return sc(body, g); });
  // the stripe across the bonnet with its two whiskers, the buffer-beam band, panel seams and a hatch
  const band = (v0, v1, u0, u1, col, lift = 0.004, nu = 12) => surf(nu, 2, (u, v) => nose(u0 + (u1 - u0) * u, v0 + (v1 - v0) * v, lift), () => col);
  band(0.47, 0.56, 0.02, 0.98, stripe); band(0.585, 0.605, 0.04, 0.96, sc(stripe, 0.8)); band(0.86, 0.97, 0.03, 0.97, stripe);
  b.mat = 0; b.aux = 0;
  for (const u of [0.27, 0.73]) band(0.03, 0.45, u - 0.0035, u + 0.0035, sc(body, 0.3), 0.003, 1);
  band(0.2, 0.207, 0.27, 0.73, sc(body, 0.3), 0.003, 6); band(0.0, 0.03, 0.0, 1.0, dark, 0.004);
  for (let k = -2; k <= 2; k++) { const p = nose(0.5 + k * 0.035, 0.1, 0.012); b.M.makeRotationX(-0.14).setPosition(p[0], p[1], p[2] - 0.16); b.box(0, 0, 0, 0.03, 0.014, 0.34, dark); }
  b.M.identity();
  // the centre headlamp: a steel housing with a bright rim and a warm glass, standing on the front of the bonnet
  // (its own little mesh, so that the world can keep it round when the cab is stretched to a tall or wide screen)
  const lampAt = nose(0.5, 0.6, 0), lb = new Batch(() => 0, 0);
  { const ly = 0.035;
    lb.mat = 3; lb.M.copy(RX).setPosition(0, ly, 0.06); lb.cyl(0, 0, 0, 0.095, 0.112, 0.18, 12, rgb(0.34, 0.34, 0.36), false, 0.8, steel); lb.cyl(0, 0.18, 0, 0.128, 0.128, 0.03, 12, rgb(0.74, 0.74, 0.76), false);
    lb.M.identity(); lb.blob(0, ly, 0.07, 0.095, 0.095, 0.06, rgb(0.3, 0.3, 0.32), 10, 4);
    lb.mat = 1; lb.aux = 2.6; lb.blob(0, ly, -0.135, 0.108, 0.108, 0.025, rgb(1.0, 0.86, 0.6), 10, 3); }
  b.mat = 3;
  for (const x of [-0.8, 0.8]) {
    b.M.copy(RX).setPosition(x, -1.38, -2.42); b.cyl(0, 0, 0, 0.065, 0.065, 0.34, 6, rgb(0.3, 0.3, 0.32), false);
    b.M.copy(RX).setPosition(x, -1.38, -2.76); b.cyl(0, 0, 0, 0.21, 0.2, 0.07, 12, steel, true, 0.7, rgb(0.66, 0.66, 0.68)); b.M.identity();
  }
  b.mat = 0;
  // pillars at the far edges, visor along the top, wipers parked on the sill
  for (const sx of [-1, 1]) {
    b.box(sx * 1.62, 0.0, -1.25, 0.13, 1.7, 0.1, body, 1, 1, 0.85); b.box(sx * 1.553, 0.0, -1.25, 0.012, 1.66, 0.08, dark);
    b.tube([[sx * 0.6, -0.765, -1.3], [sx * 0.07, -0.72, -1.31]], 0.012, 4, dark); b.tube([[sx * 0.52, -0.742, -1.3], [sx * 0.03, -0.697, -1.31]], 0.008, 3, rgb(0.02, 0.02, 0.02));
    b.mat = 3; b.cyl(sx * 0.6, -0.79, -1.3, 0.03, 0.03, 0.05, 6, steel); b.mat = 0;
  }
  b.box(0, 1.10, -1.12, 2.86, 0.2, 0.56, sc(body, 0.75), 1, 1, 0.55); b.box(0, 0.992, -1.38, 2.6, 0.02, 0.1, dark);
  // (the mirror's arm is not drawn: with the mirror hidden its tip read as a dark stub cut by the left edge)
  const mesh = new THREE.Mesh(b.build(), propMaterial(U, shift)); mesh.frustumCulled = false; mesh.renderOrder = 6; object.add(mesh);
  const lampG = lb.build(); lampG.scale(0.74, 0.74, 0.74);
  const lamp = new THREE.Mesh(lampG, mesh.material); lamp.frustumCulled = false; lamp.renderOrder = 6; lamp.position.set(lampAt[0], lampAt[1] - 0.035, lampAt[2]); object.add(lamp);
  // marigold and jasmine garland laid over the lamp and the nose edge, tails over the front; it swings on its own pivot
  const gb = new Batch(() => 0, 0);
  for (let k = 0; k < 25; k++) { const t = k / 24, x = (t - 0.5) * 1.5, sag = Math.sin(t * Math.PI);
    gb.blob(x, 0.035 + 0.05 * sag - 0.02 * Math.abs(Math.sin(t * Math.PI * 3)), 0.11 * sag - 0.03, 0.043, 0.04, 0.043, k % 4 === 2 ? rgb(0.74, 0.72, 0.6) : rgb(0.86, R.range(0.38, 0.52), 0.03), 8, 5); }
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) gb.blob(sx * (0.76 + 0.012 * k), 0.0 - k * 0.07, -0.04 - 0.03 * k, 0.04, 0.045, 0.04, k === 2 ? rgb(0.6, 0.08, 0.05) : rgb(0.74, 0.72, 0.6), 8, 5);
  const garland = new THREE.Mesh(gb.build(), mesh.material); garland.frustumCulled = false; garland.renderOrder = 6; garland.position.set(0, -0.985, -2.2); object.add(garland);
  // the convex mirror: not a reflection, a little shader that redraws the lane behind from the same wave function
  const mm = mkMat(U, FOG_V + /* glsl */`
varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`, FOG_F + FM_GLSL + /* glsl */`
varying vec2 vUv;
void main(){
  float r = length(vUv); if (r > 1.0) discard;
  vec3 col = vec3(0.025);
  if (r < 0.87) {
    vec2 q = vUv / 0.87; q.x = -q.x; q *= 1.0 + 0.45 * dot(q, q);
    vec3 d = normalize(vec3(q.x * 1.1, q.y * 1.1 - 0.06, 1.0));
    float tf = d.y < -0.01 ? -2.4 / d.y : 1e4, tr = d.y > 0.01 ? 0.75 / d.y : 1e4, tw = 3.3 / max(abs(d.x), 1e-3);
    float t = min(min(tf, tr), tw); vec3 h = d * t;
    float cell = floor((uCamS - h.z) / 3.0), side = d.x > 0.0 ? -1.0 : 1.0;
    vec4 zg = fmGap((cell + 0.5) * 3.0);
    float oL = max(fmOpenD(fmCellD(cell, -1.0)), zg.x), oR = max(fmOpenD(fmCellD(cell, 1.0)), zg.y), o = side < 0.0 ? oL : oR;
    float dayK = smoothstep(0.5, 1.5, uSunCol.g); vec3 sky = uSkyCol * mix(1.2, 2.6, dayK) + uSunCol * 0.05 * dayK, lampF = uLamp * 0.35, cloth = fmClothCol(cell, side) * (uSunCol * 0.34 + uSkyCol * 0.5 + uLamp);
    float sun = min(oL, oR);
    float sM = uCamS - h.z, inLane = step(0.0, sM) * step(sM, uLen);   // behind the cab is the lane only while it is still in it
    sun = max(sun, 1.0 - inLane);
    if (t == tr) col = mix(uSkyCol * mix(1.2, 1.3, dayK), mix(cloth, sky, smoothstep(0.35, 0.6, o) * (1.0 - smoothstep(1.2, 3.3, abs(h.x)) * (1.0 - o))), inLane);
    else if (t == tf) { float rail = 1.0 - smoothstep(0.05, 0.11, abs(abs(h.x) - 0.5));
      col = mix(vec3(0.20, 0.18, 0.15), vec3(0.6), rail) * (mix(cloth * 0.9 + uShade * 0.2, uSunCol * 0.5, sun) + lampF) * (0.7 + 0.3 * step(0.5, fract(h.z / 0.65))); }
    else { float hsh = fmH1(cell * 5.3 + side * 3.0);
      col = mix(vec3(0.03, 0.025, 0.02), fmClothCol(cell + 3.0, side) * 0.5, step(h.y, -1.2) * step(0.3, hsh)) * (mix(cloth + uShade * 0.3, uSunCol * 0.45, sun) + lampF) + vec3(1.0, 0.6, 0.25) * (0.5 + uLamp.r) * step(0.8, hsh) * step(abs(h.y + 0.2), 0.12);
      vec3 yard = mix(vec3(0.10, 0.085, 0.06) * (uSunCol * 0.5 + uSkyCol + uLamp * 1.5), uSkyCol * mix(1.2, 1.3, dayK), smoothstep(-0.6, 0.3, h.y));   // open yard or road: dark earth below, sky above
      col = mix(yard, col, inLane); }
    col = mix(col, (uPal[0] + uPal[2]) * 0.5 * (uSunCol * 0.2 + uLamp) + uShade * 0.15, smoothstep(25.0, 80.0, h.z) * inLane * (1.0 - min(zg.x, zg.y)));
    col = mix(col, col * 0.22 + uHallLamp * 0.10, step(uHall.x, sM) * step(sM, uHall.y));
    col += (uSkyCol * 0.25 * r * r + vec3(0.9) * uSunCol * 0.08 * smoothstep(0.5, 0.85, q.y - q.x * 0.5)) * max(smoothstep(0.2, 1.2, uSunCol.g), 0.25) + uLamp * 0.05 * smoothstep(0.5, 0.85, q.y - q.x * 0.5);
    // by night the glass is dark blue, with the warm streaks of the bulbs falling behind
    float nk = 1.0 - smoothstep(0.5, 1.4, uSunCol.g), bs = fract(h.z / 3.0 + 0.5) - 0.5;
    col = mix(col, col * vec3(0.22, 0.28, 0.5) + uSkyCol * 0.35 + uLamp * 0.9 * exp(-bs * bs * 60.0) * step(abs(h.y + 0.1), 0.35) * step(t, 60.0), nk);
  }
  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
  #include <fog_fragment>
}`, { side: THREE.DoubleSide });
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), mm); mirror.position.set(-1.2, -0.2, -1.44); mirror.lookAt(0, 0, 0); mirror.frustumCulled = false; mirror.renderOrder = 6; object.add(mirror);
  return { object, mesh, garland, mirror, lamp, shift };
}
