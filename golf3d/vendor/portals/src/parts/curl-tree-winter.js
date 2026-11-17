// The Wood of Shaved Trees: THE OLD STICK, and the shaved-limewood style the whole world is carved in.
//
// THE HERO. A pole 210 m tall, 9 m thick at the foot, 28 knife flats. It starts BARE. A blade (never seen, only its
// bright fresh-cut line) climbs it: under each of 30 tiers it digs 14 scoops 12 m long and the tier springs open, each
// curl unrolling out of its own roll in 0.4 s, swinging past rest, quivering at 2 beats a second and hanging: 419
// instanced ribbons (one draw call), longest about 60 m and 4 m wide at the foot, 2 m ringlets at the crown. Backlit
// they are amber lamps, from the sun side cream paper. One curl of the ninth tier ran too long: it leaves north-west,
// runs as a rail beside the exit line and rolls its end into a ring 16.4 m across round the portal seat; it unrolls
// like a carpet (3.6 s) when its tier is cut, and its end then winds itself into the ring (2.2 s): no ring hangs by the bare pole. A sawdust puff leaves every tier as it opens; fine dust sifts after.
//
// buildHero(ctx, opts) opts: toward (see the code: the curls that run long toward the lens), style (the world's makeStyle instance; without it the piece stands alone and brings its
//   own sky and board), palette (7 hexes), detail 0.6..1 (thins sawdust only), cutRate (m/s assumed when the cut is
//   set in a jump, 5), shadowSlot (which style.setShadow slot the hero writes every frame, 0), backdrop (false: none).
// Returns { object, radius 75 (with the long curl; the tower itself is 38 m), height 210, center, anchors, style,
//   setCut(y), setProgress(u), getCut(), update(dt, time, camera), dispose() }.
//   POLISH 4 opts: seatHeading (degrees, 50), longAz (where the long curl leaves the trunk), railJoin, railSide (the long curl comes in
//   along the ring's own winding from this many metres off, not as a rail beside the exit line), fit(c) (the world trims a curl in the lens's way).
//   PROGRESS: call hero.setCut(yLocal) every frame before hero.update (camera height + 20 on the climb; -8 = bare,
//   over 216 = finished), or setProgress(0..1). Tiers below the blade open at the moment it passes (a jump back-dates
//   them, so a posed frame is settled). If neither is ever called the cut plays on a 46 s loop (the part viewer).
// anchors (local; foot at origin, sun and course +Z, west = -X):
//   portalSeat { position (15,92,67), direction (unit, 50 deg right of +Z, 25 deg up), facing, radius 7, ringRadius 8.2 }
//               (opts.seatY, opts.seatPitch move it: the world hangs it at 64 m on a 14 degree line; opts.railPsi -PI/2 brings the long curl in under the line)
//   exitStart   start of the straight 60 m; flyThrough: 9 points, south approach -> west side climb -> exitStart ->
//               seat, never nearer than 8 m to any curl or the ring (48 to 42 m from the trunk);
//   viewpoints { reveal, climb, rail }, longCurlRoot, crown, cutAbove 20, shadowLength 400, tierHeights[30], reachAt(y).
// COST: about 55k triangles, 5 draw calls (trunk, curls, long curl, puff, sift; +2 alone: sky, board), 5 programs,
//   build under 100 ms in six yielded steps, no lights, no textures.
//
// STYLE (styleNote -> how it is done here)
//   One material, raw limewood, three thicknesses, ONE shading function family (GLSL in WOOD_GLSL):
//     board / stick  style.wood({grain:'y'|'z'|'x'})   opaque cream, drawn grain lines + rare knots, soft lambert, umber shade.
//     chip           style.wood({chip:true})           the same, hard-edged light (a chip is a thick flat).
//     shaving        style.shaving (baked ribbons: aS,aV,aOver attributes via style.ribbonGeometry)
//                    style.curl    (instanced: the vertex shader rolls each ribbon into a hanging curl)
//                    translucent: amber when the sun is behind it (deeper where layers overlap, paler at the torn
//                    edge), matte cream with a sheen along the grain when the sun is on our side. No blending:
//                    the glow is the material's own transmission, so it already works through a portal.
//     ground         style.board   planed boards 9 m wide along Z, grain 40:1 along Z, soft umber shadow streaks
//                    along the grain from style.shadows (casters you register), faded to a flat tone far off.
//     sky            style.sky     straw halo kept round the sun -> cool grey-blue, a step deeper overhead; small soft sun disc, no rays. At night the moon's disc (a ball once it is golden: darker toward its rim, since the world's thirteenth round) stands on the light's direction in the sun's place.
//   THE KEY (style.rekey, on by default): the tone map pales a bright orange to ochre, so the amber, honey, sky and halo
//   uniforms are solved (displayLinear) to be the linear colours the tone map SHOWS as the brief's hexes; the sky and the
//   board sit a clear step under backlit shaving, shade is deep umber, and the wood's floor is streaked with long shadows.
//   Gloss > 0 (the stream) is ICE: a pale cool mirror of that sky carrying the sun's straw path (at night the moon's track) from the horizon to the lens and,
//   upside down, every caster of the board's shadow slots but slot 0: a pole with tiers of rings in the lamp colours up to its cut; far off the rings close into their average and their colour with them. In the lane the board's shadows are
//   separate umber stripes with cream slits (laneStripes, shared with the drift). hero.setTone lifts the trunk on the climb.
//   The night is keyed like every hour: the world calls the key with the night's own four numbers. rekey:false (the unkeyed arm) is passed by no hour.
//     sawdust        style.dust    points sized from the drawing buffer, never pure white.
//   A line is a grain line or a facet edge (facets are real flats: the stick shader takes its normal from
//   derivatives), never an outline. Only backlit shaving and the sun exceed 1.0 (honey edges reach about 2.5 in red so that they show as #FFD98A).
import * as THREE from 'three';
import { smoothstep as core_ss, clamp } from '../kit/core.js';

export const PALETTE = ['#EAD9B0', '#C9A56A', '#7A4A22', '#F4B45A', '#FFD98A', '#F3E8CF', '#B8C6D2'];
const TAU = Math.PI * 2;

// Shared GLSL: uniforms, noise, grain, the opaque wood light and the shaving light.
export const WOOD_GLSL = /* glsl */`
uniform vec3 uSun;        // unit vector toward the sun
uniform vec3 uCam;        // camera world position
uniform float uTime;
uniform float uGlow;      // peak of backlit amber (1.5)
uniform vec3 cCream, cGrain, cKnot, cAmber, cAmberHi, cDust, cSky, cStraw, cShade;   // cShade = umber/cream ratio
// THE KEY (set in makeStyle; all linear, chosen so that the tone map SHOWS the brief's colours):
//   cAmberB / cAmberE / cAmberD = backlit shaving: body (shows as the palette amber), torn edge and single thickness square
//   to the sun (shows as the palette honey), overlap (burnt amber). cSkyLo = the sky away from the sun, cHalo = the straw
//   round it, cLitB = how much of the low sun the level board takes. uKey = (shade depth on board, shade depth on wood, halo tightness, streaks in the wood).
uniform vec3 cAmberB, cAmberE, cAmberD, cSkyLo, cHalo, cLitB; uniform vec4 uKey;
// POLISH 2, the second colour (all from the palette: sawdust #F3E8CF and the sky's grey-blue #B8C6D2). uFrost = (sawdust lying on
// the board like snow, how far shade is filled by the cold sky instead of umber, how pale the lit face of a shaving is, how far a SHAVING's shade stays umber whatever the second slot says).
uniform vec4 uFrost;
// POLISH 4: cSunC = the low sun's colour on a lit face; uSkyK = (how deep the sky is overhead, the honey aureole round the sun, the honey every shaving on the sun's side keeps, spare).
// The world sinks the sun and warms these through the flight, so the end is lit differently from the arrival.
uniform vec3 cSunC; uniform vec4 uSkyK;
uniform vec4 uMoon;       // NIGHT 1, the night alone: rgb = the moon's light as thin wood passes it (linear; the world's piece C moves it half of the way the disc goes), w = the disc's radius in radians; zero at every other hour, and every statement that reads it stands behind uMoon.w != 0.
uniform vec3 cDisc;       // PIECE C (the world's twelfth round), the night alone: the moon's light as the heart of its disc shows it in the sky and as its track shows it on the ice (linear; the world starts it as uMoon.rgb and turns it golden by place); zero at every other hour, read only behind uMoon.w != 0.
uniform vec3 cRim, cDiscLo, cRimLo;   // THE MOON AS A BALL (the world's thirteenth round), the night alone: three more colours of the disc, each solved by the world at the build (style.shownShare) and keyed by it exactly as cDisc is: at each end of the world's key (a straight line between the two solves in between) cRim = the linear colour the tone map SHOWS as cDisc's shown colour at 0.70 of its light (the golden disc at its rim; how much of it the disc takes is uBall's); cDiscLo and cRimLo = the same two as low air shows them (0.90 of their shown light). At the night's own end cRim and cRimLo are never shown as they stand (uBall is 0 there): they only give the line the disc darkens along once the key begins. Zero at every other hour, read only behind uMoon.w != 0.
uniform float uBall;      // THE MOON AS A BALL, the night alone: how far the disc is a ball, keyed by the world with the disc's colour (the same kp): 0 at the night's own pale moon (no darker toward its rim), 1 at the golden moon (the rim at 0.70 of the heart's shown light). 0 at every other hour, read only behind uMoon.w != 0.
uniform vec3 cWarmT;      // PIECE C, the night alone: the mend's ratio, the night's own lamp body over the lamp body as the world's key has it now, channel by channel; (1, 1, 1) at every other hour and until the key begins; read only behind uMoon.w != 0.
uniform vec3 cMoonE;      // NIGHT 2, the night alone: the night's own honey for the aureole round the moon, whatever the wood (the world copies the night's cAmberE into it before a cedar's is keyed); zero at every other hour, read only behind uMoon.w != 0.
vec3 skyFill(){ return cSkyLo * vec3(0.84, 0.98, 1.18); }
vec3 coolAlb(vec3 a){ return mix(a, vec3(dot(a, vec3(0.3333))), 0.68); }   // limewood is yellow: under sky light alone it would go olive, so the fill sees it nearly neutral
vec3 skyCol(vec3 d){
  float c = max(dot(d, uSun), 0.), h = max(d.y, 0.);
  vec2 dh = d.xz / max(length(d.xz), 1e-3), sh = uSun.xz / max(length(uSun.xz), 1e-3);
  float az = dot(dh, sh) * 0.5 + 0.5;                                                   // 1 toward the sun's side, 0 behind us
  vec3 col = mix(cSkyLo * 1.16, cSkyLo * uSkyK.x, smoothstep(0.0, 0.62, h));            // cool grey-blue, clearly deeper overhead, pale at the horizon
  float band = (1. - smoothstep(0.0, 0.30 + 0.16 * az, h));
  col = mix(col, mix(cSkyLo * 1.2, cHalo * 0.92, 0.25 + 0.75 * az * az), band * band * (0.30 + 0.60 * az));   // cream to straw along the horizon, warmest under the sun
  col = mix(col, cHalo * 0.78, c*c*c*c * 0.55 * (1. - smoothstep(0.10, 0.70, h)));      // a wide breath of warmth toward the sun
  col = mix(col, cHalo, pow(c, uKey.z));                                                // the straw halo, kept round the sun
  float c16 = c*c; c16 *= c16; c16 *= c16; c16 *= c16; float c128 = c16*c16; c128 *= c128; c128 *= c128;
  return col + (uMoon.w != 0. ? cMoonE : cAmberE) * uSkyK.y * (0.75 * c128 * c16 * c16 + 0.25 * c16 * c16 * c16);   // and inside it a honey aureole, hottest at the disc; NIGHT 2: at night the aureole is the night's honey, not the wood's (one moon over every wood)
}
float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h1(i), h1(i+vec2(1.,0.)), f.x), mix(h1(i+vec2(0.,1.)), h1(i+vec2(1.,1.)), f.x), f.y); }
// g.x = metres across the grain, g.y = metres along it. Returns albedo: cream, grain lines about every 15 cm, rare knots.
vec3 woodAlbedo(vec2 g, float knots){
  float wob = vn(vec2(g.x*1.7, g.y*0.045));
  float a = g.x*6.6 + wob*1.3;
  float fw = fwidth(a);
  float d = abs(fract(a) - 0.5);
  float line = mix(0.21, 1. - smoothstep(0.05, 0.16 + fw, d), clamp(1.2 - fw*3.2, 0., 1.));   // far off the lines melt into their own average tone, with no step
  float wide = vn(vec2(g.x*0.9, g.y*0.02));                    // broad early/late wood bands
  float fine = vn(vec2(g.x*23., g.y*0.6));
  vec3 c = mix(cCream, cGrain, line*(0.35 + 0.4*wob) + wide*0.16 + smoothstep(0.52, 0.66, wide)*0.14 + fine*0.05);
  vec2 cell = vec2(2.6, 11.), id = floor(g/cell), q = fract(g/cell) - 0.5;
  float r = h1(id + 7.3);
  q -= (vec2(h1(id+1.1), h1(id+2.7)) - 0.5) * 0.5;
  float kd = length(q * cell * vec2(1., 0.42));
  float kn = step(1. - 0.16*knots, r) * (1. - smoothstep(0.10, 0.34, kd));
  float ringK = step(1. - 0.16*knots, r) * (1. - smoothstep(0.3, 0.9, kd)) * (0.5 + 0.5*sin(kd*46.));
  c = mix(c, cGrain, ringK*0.5);
  c = mix(c, cKnot, kn*0.85);
  return c;
}
// Opaque wood: soft (hard=0) or chip-hard (hard=1) sun, warm umber shade, a breath of sky from above.
vec3 woodLight(vec3 alb, vec3 N, float hard, float sh){
  float ndl = dot(N, uSun);
  float lit = mix(smoothstep(-0.42, 0.50, ndl), smoothstep(0.0, 0.07, ndl), hard) * sh;
  vec3 shade = alb * cShade * uKey.y + alb * cSkyLo * (0.30 + 0.14*N.y);
  shade = mix(shade, alb * cShade * uKey.y * 0.40 + coolAlb(alb) * skyFill() * (0.62 + 0.16*N.y), uFrost.y);   // the shaded side of a pole takes the sky: a cool value under the lit cream (repair 5: paler, more of the sky's grey-blue and less umber, so a bare pole against the light is a pale pole, not a dark spike)
  float gr = min(dot(alb, vec3(0.33)) / max(dot(cCream, vec3(0.33)), 1e-3), 1.);
  shade *= mix(1., gr*gr, 0.75) * (0.74 + 0.50 * abs(N.x) + 0.10 * N.y) * (1. + 0.20 * sin(N.x*31. + N.z*17. + N.y*9.));       // POLISH 3: each knife flat takes the sky by its own turn, and the grain is drawn in the shade too
  return mix(shade, alb * cSunC * 0.9, lit);
}
// In the lane every pole ahead throws a shadow many times its height down the grain: umber stripes with cream slits of sun.
// P = world xz, cover 0..1 = under an opened tree's cone (more shade, narrower slits). Returns 0..1 shade.
float laneStripes(vec2 P, float cover){
  vec2 sd = -uSun.xz / max(length(uSun.xz), 1e-3);
  float crs = P.x*sd.y - P.y*sd.x, al = dot(P, sd);
  float st = vn(vec2(crs*1.05, al*0.004)) * 0.62 + vn(vec2(crs*2.3 + 17., al*0.007)) * 0.38;   // long: under an 8 degree sun a 30 to 70 m pole throws 200 to 500 m of shadow down the grain
  st += (vn(vec2(crs*0.8 + 3., al*0.12)) - 0.5) * 0.17 * (0.45 + 0.55*cover);   // POLISH 3: a shadow of tiers of curls is dappled along its length (scalloped edges, strings of patches), not one drawn-out streak
  float fw = fwidth(crs) * 1.05, thr = mix(0.515, 0.40, cover);
  return mix(smoothstep(thr - 0.035 - fw, thr + 0.035 + fw, st), 0.42 + 0.3*cover, clamp(fw*1.6 - 0.25, 0., 1.));
}
// Shaving. N must face the viewer; T = unit tangent along the ribbon; V = unit vector to the camera;
// v = -1..1 across; edgeM = metres from the nearer edge; over = 0..1 layers overlapping; inner = 0..1 depth inside a tree.
float gCast = 0.;         // 0..1: this point stands in the shadow another curl throws (set by the caller before shavingLight)
float gEdgeW = 0.16;     // metres: width of the paler torn edge (the caller may widen it for a ribbon metres wide seen far off, so that its rim shows there too)
float gThin = 0.;   // NIGHT 2, the night alone (0 at every other hour; the shaving's main sets it behind uMoon.w): gThin 0..1 = how thin the shaving is at this point of its width (the lens law: 0 down its middle, 1 at its margins). NIGHT 4: 0 on the two gilt things (uGilt), which are not shaving
vec3 shavingLight(vec3 alb, vec3 N, vec3 T, vec3 V, float edgeM, float over, float inner, float shadowed){
  float ndl = dot(N, uSun);
  float back = clamp(-ndl * 1.7 + 0.10, 0., 1.);               // the sun is on the far face: it shines through
  float fs = max(dot(V, -uSun), 0.);                           // 1 when we look straight at the sun
  float Tr = back * (0.70 + 0.30 * (0.6*fs*fs + 0.4*fs));      // thin wood glows all round, most toward the lens
  Tr = max(Tr, uSkyK.z * (1. - 0.75*shadowed) * (1. - 0.6*inner) * (0.55 + 0.45*smoothstep(-0.5, 0.3, ndl)));   // polish 4: on the sun's side of a tree every shaving holds some of its honey, whichever way it faces
  float edge = 1. - smoothstep(0.0, gEdgeW, edgeM);
  float layers = smoothstep(0.16, 0.80, clamp(over + inner*0.55 + shadowed*0.32 + gCast*0.30, 0., 1.));   // a step you can count: one layer or two
  float g = dot(alb, vec3(0.33)) / max(dot(cCream, vec3(0.33)), 1e-3);        // grain lines hold the light back
  float gk = uGlow / 1.5;
  vec3 single = mix((uMoon.w != 0. ? mix(cAmberB, uMoon.rgb, gThin) : cAmberB), cAmberE, 0.55 * back * back * fs) * gk;          // squarer to the sun: honey; NIGHT 2, the lens law for every shaving: thin wood, at the margins, passes the moon's light (uMoon.rgb), the thicker heart colours it straw (uMoon.rgb is over cAmberB on every channel: it only adds). PIECE C: until the world's key begins uMoon.rgb is the colour the disc's heart shows; from then on the heart shows cDisc, which goes the whole way to golden, and thin wood passes uMoon.rgb, which goes half of the way
  vec3 amber = mix(single, cAmberD * gk, layers) * (0.46 + 0.54*g*g);
  if (uMoon.w != 0.) amber *= 1. + (cWarmT - 1.) * (1. - smoothstep(0.30, 0.80, Tr));   // PIECE C, THE MEND (the night alone; times one while cWarmT is (1, 1, 1)): wood that passes little light (Tr under 0.30: a face turned to the moon or nearly edge-on to it) takes the whole ratio, which brings its body and its two layers back to the night's own straw, so that mixed into its blue-grey shade it stays a grey of the wood and does not go pink; only wood the moon shines well through (Tr 0.80 and over) is left wholly the warmed colour. The 0.30 and 0.80 are TYPED, not worked out. The honey (squarer to the sun) and the moon's light at the margins, both mixed into a single thickness on the line above, lie under this factor with the body; the torn edge is mixed in on the next line, after it, and is not mended
  amber = mix(amber, cAmberE * gk, edge * 0.92 * (1. - 0.6*layers));
  float lit = smoothstep(-0.34, 0.50, ndl) * (1. - 0.80*inner*inner) * (1. - 0.55*shadowed) * (1. - 0.55*over) * (1. - 0.50*gCast);   // raking light wraps round thin wood
  vec3 shade = alb * cShade * (uKey.y + 0.25 + 0.4*back) + alb * cSkyLo * 0.22;
  vec3 pale = mix(alb, cDust * mix(1., g*g*g, 0.85), 0.62 * uFrost.z);          // the lit face of a shaving: pale paper, not board; POLISH 3: it keeps its grain lines (darker, drawn), so a near curl is ruled wood, not a blank strip
  shade = mix(shade, pale * cShade * 0.22 + coolAlb(pale) * skyFill() * 0.84, uFrost.y);      // polish 2: filled with the sky's grey-blue (repair 5: on every hour; the next lines give the cast shade back its umber)
  // REPAIR 3 (uFrost.w): a shaving's shade is the wood's own warm umber (the brief: "warm umber shade", "cream paper with long umber shadows").
  // REPAIR 5: that is the shade that is CAST: the shadow another curl throws on it (gCast: the brief's "long umber shadows on the tiers
  // beneath"), the inside of its own tree, two layers lying over one another. A face out in the open air that is only turned from the sun
  // is lit by the sky (the brief: "cool grey-blue #B8C6D2 overhead and behind us") and takes its grey-blue, as board and stick do: so on
  // every tree the cool colour stands beside the amber.
  float warm = clamp(max(gCast * (1. - shadowed), 0.8 * inner * inner + 0.3 * over), 0., 1.);   // a shadow is cast only where the sun would reach: on the tree's side away from the sun every open face has the sky alone
  shade = mix(shade, alb * cShade * (uKey.y + 0.12 + 0.3*back) + alb * cSkyLo * 0.08, uFrost.w * (0.22 + 0.78 * warm));
  alb = mix(alb, pale * vec3(1.06, 1.04, 1.04), uFrost.z);
  vec3 H = normalize(V + uSun + vec3(0., 1e-4, 0.));
  float th = dot(T, H);
  float sheen = pow(max(1. - th*th, 0.), 24.) * max(ndl, 0.) * 0.22;
  vec3 cream = mix(shade, alb * cSunC + cDust * sheen, lit);
  cream = mix(cream, cDust * mix(0.5, 0.9, lit), edge * 0.45);         // torn edge paler than the middle
  cream *= 1. - 0.22 * smoothstep(gEdgeW, gEdgeW + 0.24, edgeM) * (1. - smoothstep(gEdgeW + 0.24, gEdgeW + 0.94, edgeM));   // and inside it a soft darker margin, the shaving's thickness turning away: the edge is drawn
  return mix(cream, amber, clamp(Tr, 0., 1.));
}
`;

export const HAZE_GLSL = /* glsl */`
uniform float uHaze;      // aerial haze per metre (distance pales toward the sky, straw toward the sun)
vec3 hazed(vec3 col, vec3 W){
  vec3 d = W - uCam; float dist = length(d);
  float f = 1. - exp(-dist * uHaze);
  float toSun = max(dot(d / max(dist, 1e-3), uSun), 0.);
  float t2 = toSun*toSun, t8 = t2*t2*t2*t2;
  return mix(col, mix(cSkyLo * 1.06, cHalo * 0.8, t8*t8*0.8), f);
}
`;
const NT = 32;      // tiers a curl mesh can address (uTierT)
const NSH = 24;     // shadow casters the board can draw

// Curl vertex stage: position.x = t (0..1 along), position.y = v (-1..1 across). Per instance:
//   aRoot  azimuth, root height, trunk radius at the root, slot 0..31 (-> uTierT[slot] = time the cut reached it; the hero uses one slot per tier, a wood can use one per tree)
//   aShape ribbon length L, width W, arm length A, inner end radius of the roll
//   aPose  arm start angle, arm end angle (radians above horizontal), yaw off the radial, seed 0..1
//   aMisc  k (roll tightening per radian), helical pitch (widths per turn), reach of its tier (for depth shade), delay in seconds after its slot's time
// The ribbon is a sagging arm (quadratic Bezier) that ends in a logarithmic roll. Opening unrolls the arm out of the roll
// in 0.4 s (length is conserved), swings past rest and quivers at 13 rad/s: shape only, never brightness.
const CURL_VERT = /* glsl */`
uniform float uTime; uniform vec3 uSun; uniform float uTierT[${NT}];
attribute vec4 aRoot, aShape, aPose, aMisc; attribute vec3 aBase;   // aBase: foot of this curl's tree in the mesh (0 when one mesh is one tree)
varying vec3 vN, vT, vW; varying vec4 vUv; varying vec2 vInner;
vec2 dir(float a){ return vec2(cos(a), sin(a)); }
void main(){
  float t = position.x, v = position.y;
  int ti = int(clamp(aRoot.w + 0.5, 0., ${NT - 1}.));
  float tau = uTime - uTierT[ti] - aMisc.w;
  float tp = max(tau, 0.);
  float o = clamp(tp / 0.4, 0., 1.); o = o*o*(3. - 2.*o);
  float em = smoothstep(0., 0.10, tp);
  float ring = exp(-5.*tp) * cos(13.*tp);
  float L = aShape.x, W = aShape.y, A = aShape.z * o, rhoE = max(aShape.w, 0.05), k = max(aMisc.x, 0.02);
  float sk = sqrt(1. + k*k);
  float rollLen = max(L - A, 0.01);
  float rho0 = rhoE + rollLen * k / sk;
  float PHI = log(rho0 / rhoE) / k;
  float seed = aPose.w;
  float amb = 0.030*sin(uTime*1.9 + seed*40.) + 0.016*sin(uTime*3.3 + seed*17.);
  float a0 = aPose.x + ring*0.55 + amb*0.4, a1 = aPose.y + ring*1.15 + amb;
  float ta = 0.24 * o;
  vec2 d0 = dir(a0), d1 = dir(a1), p, tg; float s, phi = 0.;
  if (t < ta) {
    float g = t / max(ta, 1e-4);
    p = A*0.5*(d0*(2.*g - g*g) + d1*(g*g));
    tg = normalize(d0*(1. - g) + d1*g + vec2(1e-5, 0.));
    s = A*g;
  } else {
    float f = (t - ta) / max(1. - ta, 1e-4);
    phi = PHI * f;
    float e = exp(-k*phi);
    float beta = a1 + 1.5708 + atan(k);
    p = A*0.5*(d0 + d1) + rho0*(e*dir(beta - phi) - dir(beta));
    tg = dir(a1 - phi);
    s = A + rollLen * (1. - e) / max(1. - exp(-k*PHI), 1e-3);
  }
  float sl = s / max(L, 1e-3);
  float w = W*0.5 * mix(1., 0.28, smoothstep(0.84, 1., sl)) * mix(0.42, 1., smoothstep(0., 0.10, sl)) * em;
  float yaw = aRoot.x + aPose.z;
  vec3 er = vec3(sin(yaw), 0., cos(yaw)), et = vec3(cos(yaw), 0., -sin(yaw)), up = vec3(0., 1., 0.);
  vec3 T3 = tg.x*er + tg.y*up, N3 = -tg.y*er + tg.x*up;
  float lat = aMisc.y * W * phi / 6.2832 + sl*sl * L * 0.022 * sin(uTime*0.8 + seed*31.);
  float tw = sl * (0.22*sin(uTime*0.6 + seed*11.) + 0.5*(seed - 0.5));
  vec3 across = cos(tw)*et + sin(tw)*N3;
  vec3 root = vec3(sin(aRoot.x)*aRoot.z, aRoot.y, cos(aRoot.x)*aRoot.z);
  vec3 pos = root + em*(p.x*er + p.y*up + lat*et) + across * (v * w);
  vec3 nrm = cos(tw)*N3 - sin(tw)*et;
  vec4 wp = modelMatrix * vec4(pos + aBase, 1.);
  vW = wp.xyz; vN = mat3(modelMatrix) * nrm; vT = mat3(modelMatrix) * T3;
  float over = smoothstep(2.4, max(PHI, 2.5), phi) * (1. - 0.55*clamp(aMisc.y, 0., 1.));
  vUv = vec4(s, v, w, over);
  float rad = length(pos.xz);
  float inn = clamp(1. - (rad - aRoot.z) / max(aMisc.z, 1.), 0., 1.);
  vec2 sx = uSun.xz / max(length(uSun.xz), 1e-3);
  float side = dot(pos.xz, sx) / max(aMisc.z + aRoot.z, 1.);            // -1 far side from the sun .. +1 sun side
  vInner = vec2(pow(inn, 0.9), (1. - smoothstep(-0.45, 0.35, side))) * step(0., aMisc.z);   // polish 5: reach < 0 marks a loose curl lying alone: no tree shades it
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
// Baked ribbons (style.ribbonGeometry): attributes position, normal, aTan (unit tangent), aSV (s metres, v -1..1, half width m, overlap 0..1).
const RIBBON_VERT = /* glsl */`
attribute vec3 aTan; attribute vec4 aSV; uniform float uTime, uWave; uniform vec2 uWaveEnd;   // uWaveEnd = (s where the free end starts, extra swing in metres)
varying vec3 vN, vT, vW; varying vec4 vUv; varying vec2 vInner;
void main(){
  float fe = smoothstep(uWaveEnd.x, uWaveEnd.x + 34., aSV.x);
  vec3 pw = position + normal * ((sin(uTime*1.3 + aSV.x*0.09) * 0.22 + sin(uTime*2.9 + aSV.x*0.31) * 0.06) * uWave
    + fe * fe * uWaveEnd.y * (sin(uTime*2.3 - aSV.x*0.12) + 0.35 * sin(uTime*6.1 - aSV.x*0.3)));   // a loose shaving breathes; its free end quivers
  vec4 wp = modelMatrix * vec4(pw, 1.);
  vW = wp.xyz; vN = mat3(modelMatrix) * normal; vT = mat3(modelMatrix) * aTan; vUv = aSV; vInner = vec2(0.);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SHAVING_FRAG = /* glsl */`
${WOOD_GLSL}${HAZE_GLSL}
uniform float uGloss, uRule, uGilt;   // uRule (the Old Stick's curls only): its ribbons are metres wide, so their torn edge holds a pixel or two at any distance; uGilt (NIGHT 4; read only behind uMoon.w): 1 on the two GILT things, the hoop with its tail and the scroll (made things set into the wood, not wood: the night's lens law does not thin them, and the world gives them the night's own gold whatever the wood), 0 on everything cut of the wood: every curl, the fallen curl, the Old Stick's over-long curl with its rail and the exit ring
#ifdef ICE
uniform vec4 uShA[${NSH}], uShB[${NSH}];
#endif
varying vec3 vN, vT, vW; varying vec4 vUv; varying vec2 vInner;
void main(){
  float s = vUv.x, v = vUv.y, w = vUv.z;
  float tear = vn(vec2(s*1.1, v*2.5 + 5.)) * 0.30 * smoothstep(0.2, 1.2, w) + vn(vec2(s*5.3, 9. + v)) * 0.07;
  float edgeM = (1. - abs(v)) * w - tear;
  if (edgeM < 0.) discard;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)) * (gl_FrontFacing ? 1. : -1.);
  vec3 T = normalize(vT + vec3(1e-5, 0., 0.));
  vec3 V = normalize(uCam - vW + vec3(0., 1e-4, 0.));
  vec3 alb = woodAlbedo(vec2(v*w, s), 0.25);
  if (uRule > 0.) {
    // REPAIR 3: the Old Stick's ribbons are 2 to 5 m wide, and beyond about 20 m their 12 cm torn edge is under a pixel: the edge holds a pixel
    // or two however far off (never more than a seventh of the ribbon's half width): "at 50 m each curl is a separate spiral with a bright rim".
    // ROUND 2: the coarse grain lines half a metre apart that round 1 drew on these ribbons are gone (the brief has grain lines at 5 m, none at
    // 50 m; they showed as pinstripes on the crown's ribbons in the close pass).
    gEdgeW = max(0.16, min(1.7 * fwidth(edgeM), 0.15 * w) * uRule);
  }
  float ch = 0.5 + 0.5*sin(s*7.3 + vn(vec2(v*2., s*0.3))*2.);            // faint chatter ridges across the shaving
  alb *= 1. - 0.06*ch*ch;
  {                                                                      // the long soft shadows curls throw on one another: a pattern fixed along the sun's own line,
    vec2 sxz = uSun.xz / max(length(uSun.xz), 1e-3);                     // so a shadow keeps its shape from curl to curl and lies down the tiers; deeper in the tower, more of it
    float al = dot(vW.xz, sxz), tanE = uSun.y / max(length(uSun.xz), 1e-3);
    vec2 sq = vec2(vW.x*sxz.y - vW.z*sxz.x, vW.y - al * tanE);
    // POLISH 3: the shade lies in long bands ALONG the grain (the ribbon's own length), a few to each width, drifting slowly with the
    // sun's line so neighbours differ; it was a round world-space noise that read as grey camouflage patches on pale shaving.
    float sn = vn(vec2(v*w*0.55 + sq.x*0.05 + 3.1, s*0.045 + sq.y*0.03)) * 0.62 + vn(vec2(v*w*1.3 + 17., s*0.11 + sq.x*0.04)) * 0.38;
    float thr = mix(0.60, 0.36, clamp(vInner.y * 0.75 + vInner.x * 0.55, 0., 1.));
    gCast = smoothstep(thr - 0.04, thr + 0.04, sn);
  }
  if (uMoon.w != 0.) gThin = (1. - uGilt) * (1. - (1. - v*v) * (1. - v*v));   // NIGHT 2: a shaving is lens-shaped across its width, thickest down its middle, (1 - v*v) squared (the law the fallen curl had alone); NIGHT 4: a gilt thing is not a shaving and is not thinned, so its single thickness is the seventh's line to the letter; the line below stays letter for letter (the world's ANCHOR looks for it)
  vec3 col = shavingLight(alb, N, T, V, edgeM, vUv.w, vInner.x, vInner.y);
  #ifdef ICE
  {                                                                      // ice (the stream): the planed face is a pale cool mirror of the sky
    float nv = max(dot(N, V), 0.), q = 1. - nv;
    float F = 0.80 + 0.20 * q*q;
    vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.02; R = normalize(R);
    float rl = max(length(R.xz), 1e-3); vec2 rh = R.xz / rl; float rise = R.y / rl;
    float slide = 0.96 + 0.08 * vn(vec2(v*w*0.7 + R.x*9., s*0.04 + R.z*5.));         // long streaks of sheen that slide as we move
    float gr = dot(alb, vec3(0.33)) / max(dot(cCream, vec3(0.33)), 1e-3);
    vec3 refl = skyCol(R) * 1.10 * slide;
    float am = 0., pole = 0., blob = 0.;
    float fRise = fwidth(rise), fP = fwidth(vW.x) + fwidth(vW.z);        // derivatives are taken before the loop
    for (int i = 1; i < ${NSH}; i++) {                                   // every caster of the board's shadow slots but slot 0 stands in it upside down: a pole and, up to its cut, tiers of rings
      vec4 a = uShA[i], b = uShB[i];
      vec2 r = a.xy - vW.xz;
      float al = dot(r, rh), px = r.x*rh.y - r.y*rh.x, ax = abs(px);
      float hgt = al * rise, fH = abs(al) * fRise + fP * rise + 1e-4;
      float taper = clamp(1. - hgt / max(b.z, 1.), 0., 1.);
      float wC = b.x * (0.3 + 0.7*taper) + 0.5;
      float in0 = step(0., al) * (1. - smoothstep(b.z - fH, b.z, hgt));
      float open = smoothstep(hgt - 1., hgt + 1., b.y) * smoothstep(5.5, 6.5 + fH, hgt);
      vec2 cq = vec2(px / 2.9, hgt / 3.1); cq.x += 0.5 * mod(floor(cq.y), 2.) + float(i) * 0.37;
      vec2 cf = fract(cq) - 0.5; float hsh = h1(floor(cq) + float(i) * 3.7);
      float rd = length(cf + (vec2(hsh, fract(hsh * 7.3)) - 0.5) * 0.14), aw = max(fH / 3.1, fP / 2.9) * 1.2 + 0.01;
      float ring = smoothstep(0.17 - aw, 0.17 + aw, rd) * (1. - smoothstep(0.43 - aw, 0.43 + aw, rd)) * step(0.12, hsh);
      float shut = clamp(aw * 3.5 - 0.35, 0., 1.);                                // how far the rings have closed: 0 while aw (above) is at most 0.1, 1 once it reaches 1.35 / 3.5. aw is 1.2 times the greater of two spans of a pixel, each as a share of a cell, plus 0.01: the ground it covers (fP, metres) over the cell's 2.9 m across, the mirrored height it covers (fH, metres) over the cell's 3.1 m. So shut is 0 while the greater share is at most 0.075 and 1 from about 0.313 on (a ring's own width is 0.26 of a cell)
      ring = mix(ring, 0.42, shut);                                               // far off the rings close up into their own average
      float m = (1. - smoothstep(wC, wC + 0.4 + fP * 2., ax)) * open * in0 * b.w * ring;
      if (m > am) { am = m; blob = mix(smoothstep(0.3, 0.7, hsh), (0.5 * (0.7 - 0.3) + (1. - 0.7)) / (1. - 0.12), shut * 0.42 / max(ring, 1e-4)); }   // blob: the lamp's colour factor, 0 the torn edge's (cAmberE), 1 the body's (cAmberB), a cell's own by its hash. THE FAR ICE: of a cell's light (ring) the share shut * 0.42 is the closed rings' average and takes the cells' AVERAGE factor; the rest is the ring's own shape and keeps the cell's own. The average: over the cells that carry a ring (hsh from 0.12 to 1, taken as even) the mean of smoothstep(0.3, 0.7, hsh) is half the step's width plus what lies above the step, over the share of cells that carry a ring: it is written out in the line from the line's own 0.3, 0.7 and 0.12 (the designer's term: worked in the code, not typed as a finished figure). While shut is 0 the factor is the cell's own, to the bit. (In the eleventh version the rings closed and the colour did not: far off each cell was flat and kept its own colour between the two. A cell is 2.9 m across and 3.1 m of the caster's height.)
      pole = max(pole, (1. - smoothstep(a.z*0.5, a.z*0.5 + 0.08 + fP * 1.5, ax)) * in0 * b.w);
    }
    float gk = uGlow / 1.5;
    refl = mix(refl, cCream * cShade * 0.55 + cSkyLo * 0.2, pole * 0.7);
    refl = mix(refl, mix(cAmberE, cAmberB, blob) * gk * 0.80, am * 0.92);
    vec2 sx = uSun.xz / max(length(uSun.xz), 1e-3), pc = vW.xz - uCam.xz;             // the sun's straw path, laid from the horizon to the lens
    float cr = pc.x*sx.y - pc.y*sx.x, ahead = dot(pc, sx), pw = 0.36 + 0.0072 * max(ahead, 0.);
    float sp = exp(-cr*cr / (pw*pw)) * smoothstep(0., 2.5, ahead) * (0.80 + 0.20 * vn(vec2(cr*2.3, s*0.33 + ahead*0.4)));
    float sg = max(dot(R, uSun), 0.), sg2 = sg*sg, sg8 = sg2*sg2*sg2*sg2, sg64 = sg8*sg8*sg8*sg8*sg8*sg8*sg8*sg8;
    refl = mix(refl, cHalo * 1.12, sp * 0.82 * (1. - 0.8*am));
    if (uMoon.w != 0.) { float k5 = sp * 0.82 * (1. - 0.8*am); refl = (refl - cHalo * 1.12 * k5) / (1. - k5); }   // NIGHT 1: the line above is taken out again at night, exactly (k5 is never over 0.82): the keyed straw is darker than the mirrored halo it lies on and would run as a greyer seam down the moon's track
    refl += cHalo * sg64 * sg64 * 0.25;
    float far = smoothstep(196., 228., vW.z), sg4 = sg2*sg2;                           // out in the clearing the ice lies off the sun's line: a long soft streak of its straw slides on the far half
    refl = mix(refl, cHalo * 1.02, far * sg4*sg4*sg2 * 0.62 * smoothstep(0.25, 0.75, vn(vec2(v*w*0.9 + R.x*7., s*0.03))) * (1. - 0.8*am));
    if (uMoon.w != 0.) {                                                               // NIGHT 1, the moon's track: a flat mirror shows a disc as wide as the disc, so its half width grows by the tangent of the moon's radius per metre ahead
      float tw = 0.36 + tan(uMoon.w) * max(ahead, 0.);                                  // on the path's own 0.36 m at the lens; broken along travel by the path's own lengthwise noise; the casters mirrored in the ice stay in front; (1 - far): where the ice leaves the light's line
      float tr = exp(-cr*cr / (tw*tw)) * smoothstep(0., 2.5, ahead) * (0.80 + 0.20 * vn(vec2(cr*2.3, s*0.33 + ahead*0.4))) * (1. - 0.8*am) * (1. - 0.7*pole) * (1. - far);
      refl = mix(refl, cDisc, 0.40 * tr);                                               // the colour of the disc's heart (PIECE C: cDisc, the value the sky draws the disc's heart in; since the thirteenth round the golden disc is darker toward its rim and the track is not), so disc and track are one light; a mix toward it never passes the heart's 0.85, so the track does not bloom
    }
    float rim = 1. - smoothstep(0.0, 0.5, edgeM);                                     // sawdust lies along its torn edge: the rim stays matte
    float chat = 0.5 + 0.5 * sin(s * 0.4488 + 1.3 * vn(vec2(v * 1.5, s * 0.05)));          // faint chatter ridges across the shaving, at the board's own 14 m period
    refl *= 1. - 0.06 * chat * chat * (1. - smoothstep(70., 220., length(vW - uCam)));
    col = mix(col * 0.8, refl * (0.94 + 0.06 * gr * gr), uGloss * F * (1. - 0.75*rim));
    col = mix(col, max(col, cDust * cLitB * 1.45), (1. - smoothstep(0.0, 0.26, edgeM)) * 0.55);   // its torn feathered edge is paler than its middle
  }
  #endif
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;
// Stick / board / chip. Facets are real flats: the normal comes from screen derivatives of the world position.
// With CUT: aScoop = (blade height at which this vertex is cut, inward depth in metres, 0); uCutY = blade height (local y).
const WOOD_VERT = /* glsl */`
uniform float uCutY;
#ifdef CUT
attribute vec3 aScoop;
#endif
varying vec3 vW, vL; varying float vCut;
void main(){
  vec3 p = position; vCut = 0.;
  #ifdef CUT
    float c = smoothstep(-0.5, 1.0, uCutY - aScoop.x) * step(1e-4, aScoop.y);
    p.xz -= p.xz / max(length(p.xz), 1e-3) * aScoop.y * c; vCut = c;
  #endif
  vL = p;
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.)).xyz;
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const WOOD_FRAG = /* glsl */`
${WOOD_GLSL}${HAZE_GLSL}
uniform float uCutY, uKnots, uTone, uBark;
varying vec3 vW, vL; varying float vCut;
void main(){
  vec3 N = normalize(cross(dFdx(vW), dFdy(vW)) + vec3(0., 1e-9, 0.));
  vec3 V = normalize(uCam - vW + vec3(0., 1e-4, 0.));
  if (dot(N, V) < 0.) N = -N;
  #if GRAIN == 0
    vec2 tn = normalize(vec2(N.z, -N.x) + vec2(1e-4, 0.));
    vec2 g = vec2(dot(vL.xz, tn), vL.y);
  #elif GRAIN == 1
    vec2 g = vec2(vL.x + vL.y*0.6, vL.z);
  #else
    vec2 g = vec2(vL.z + vL.y*0.6, vL.x);
  #endif
  vec3 alb = woodAlbedo(g, uKnots) * uTone;
  if (uBark > 0.) {                                                         // birch: white bark with dark dashes across the stick
    vec2 bc = vec2(g.x*0.9, g.y*2.2), bi = floor(bc), bf = fract(bc);
    float dash = step(0.62, h1(bi + 3.1)) * (1. - smoothstep(0.10, 0.22, abs(bf.y - 0.5))) * smoothstep(0.02, 0.12, bf.x) * (1. - smoothstep(0.55 + 0.4*h1(bi), 0.98, bf.x));
    alb = mix(alb, mix(vec3(0.86, 0.85, 0.82), cKnot * 0.6, dash), uBark);
  }
  float bl = 0.;
  #ifdef CUT
    alb = mix(alb * vec3(0.95, 0.93, 0.90), mix(alb, cDust, 0.5), vCut);   // old surface a little duller, fresh scoop pale
    bl = 1. - smoothstep(0.0, 1.5, abs(vL.y - uCutY));
  #endif
  vec3 col = woodLight(alb, N, HARD, 1.);
  {                                                                       // polish 4: against the sun a pole is not a grey spike: its flats that turn away catch a warm rim, each flat its own
    float fsV = max(dot(V, -uSun), 0.), q = 1. - abs(dot(N, V));
    col += alb * cHalo * (0.07 + 0.62 * q * q) * fsV * (0.6 + 0.4 * fsV);
  }
  col = mix(col, cAmberHi * 1.25, bl * 0.85);                             // the blade's bright fresh-cut line
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;
// The planed board. World XZ; boards 9 m wide and everything strong running along Z (the course).
// uShA[i] = (x, z, trunk half width, shadow length), uShB[i] = (reach at the foot, cut height, tree height, strength 0..1).
const BOARD_FRAG = /* glsl */`
${WOOD_GLSL}${HAZE_GLSL}
uniform vec4 uShA[${NSH}], uShB[${NSH}]; uniform float uBoardW; uniform vec4 uClear;   // uClear = (x, z, radius of the clearing, half width of the lane)
varying vec3 vW;
void main(){
  vec2 P = vW.xz;
  float dist = length(vW - uCam);
  float far = smoothstep(120., 260., dist);
  float bx = P.x / uBoardW, id = floor(bx + 0.5);
  float fwb = fwidth(P.x);
  float joint = 1. - smoothstep(0.03, 0.07 + fwb, abs(P.x - id*uBoardW));
  joint *= clamp(1.4 - fwb*0.6, 0., 1.);
  vec3 alb = woodAlbedo(vec2(P.x + id*3.7, P.y + id*41.), 0.5);
  alb *= 0.955 + 0.09*h1(vec2(id, 3.));                                   // each board its own tone
  float zb = (P.y + h1(vec2(id, 9.))*56.) / 56.;                           // butt joints, 56 m apart per board
  float butt = (1. - smoothstep(0.04, 0.09 + fwidth(P.y), abs(fract(zb) - 0.5)*56.)) * 0.35;
  float chat = 0.5 + 0.5*sin(P.y * 0.4488 + id*1.3);                       // plane chatter, 14 m period, 2 percent
  alb *= 1. - 0.022*chat;
  alb = mix(alb, cGrain*0.8, max(joint*0.55, butt));
  alb = mix(alb, cCream*0.93, far*0.8);
  vec2 sd = -uSun.xz / max(length(uSun.xz), 1e-3);                         // shadows lie away from the sun, along the grain
  float tanE = uSun.y / max(length(uSun.xz), 1e-3);
  float sh = 1., cores = 0., cover = 0., road = 0., roadCore = 0.;
  for (int i = 0; i < ${NSH}; i++) {
    vec4 a = uShA[i], b = uShB[i];
    vec2 r = P - a.xy;
    float d = dot(r, sd), x = abs(r.x*sd.y - r.y*sd.x);
    float hgt = d * tanE;
    float taper = clamp(1. - hgt / max(b.z, 1.), 0., 1.);
    float wTrunk = a.z * (0.25 + 0.75*taper);
    float wCone = b.x * taper + 1.;
    float open = smoothstep(hgt - 4., hgt + 4., b.y);
    float soft = 1.2 + d * 0.03;
    float along = smoothstep(-1., 2., d) * (1. - smoothstep(a.w * (i == 0 ? 0.72 : 0.3), a.w, d)) * step(hgt, b.z);   // the Old Stick's shadow is a road 400 m long: it holds its depth for most of that
    float core = (1. - smoothstep(wTrunk - soft*0.5, wTrunk + soft*0.5, x));
    if (i == 0) {                                                        // the Old Stick's own road (drawn below, after the loop)
      float pen = 0.5 + d * 0.012;                                       // the trunk's own shadow keeps a clean edge: the sun's small disc blurs it by a metre or two in a hundred
      roadCore = (1. - smoothstep(wTrunk - pen*0.5, wTrunk + pen*0.5, x)) * along * b.w;
      road = (1. - smoothstep(wCone*0.55, wCone + soft*2., x)) * open * along * b.w;
    }
    else {                                                               // the lane: each trunk a stripe of its own, the opened tiers a field the slits run through
      cores = max(cores, (1. - smoothstep(wTrunk + 0.2 - soft*0.3, wTrunk + 0.2 + soft*0.5, x)) * along * b.w);
      cover = max(cover, (1. - smoothstep(wCone*0.75, wCone + soft*2., x)) * open * along * b.w);
    }
  }
  // in the wood every pole throws a shadow many times its height: the floor there is long streaks of shade with slits of sun, all along the grain
  float crs = P.x*sd.y - P.y*sd.x, alongS = dot(P, sd);
  float inWood = smoothstep(uClear.z - 6., uClear.z + 40., length(P - uClear.xy)) * smoothstep(uClear.w, uClear.w + 16., abs(P.x) + 30.*smoothstep(290., 336., P.y));   // the lane's floor runs as far as its rows do (they stand to z 318, at the clearing's edge; it closed at z 215, and from there to the clearing the floor under the lens was the far wood's broad soft streaks)
  float st = vn(vec2(crs*0.15, alongS*0.006)) * 0.62 + vn(vec2(crs*0.47 + 31., alongS*0.011)) * 0.38 + (vn(vec2(crs*0.5 + 7., alongS*0.07)) - 0.5) * 0.10;
  float fwS = fwidth(crs) * 0.15;
  float streak = smoothstep(0.40 - fwS, 0.56 + fwS, st) * mix(1., 0.75, far);
  float wood = smoothstep(uClear.z - 6., uClear.z + 40., length(P - uClear.xy)), lane = wood * (1. - inWood);
  // REPAIR 3: the Old Stick's road is the shadow of tiers of curls, so it is drawn as the lane's shadows are: long umber stripes down the grain
  // with slits of sun between them, cut clean (fwidth-filtered) at any distance from the lens. It was one wide soft field mottled by a slow
  // noise, which under the lens (the course runs up it for 250 m) was a dark smear with nothing sharp in it. One call serves lane and road.
  // ROUND 2: the stripes of the road stand on sunlit sawdust (no fill of shade between them, and less dappled along their length: the fill
  // was the soft dark field under the lens); down its middle runs the trunk's own shadow, one clean dark stripe, and sawdust lies along the
  // road as evenly as in the open (in its shade the bare boards between the drifts of sawdust were dark blotches).
  float stripes = laneStripes(P, max(cover, 0.3 * road));
  sh *= 1. - max(roadCore * 0.9, road * 0.9 * stripes);
  sh *= 1. - max(cores * 0.95, lane * 0.93 * stripes);     // in the lane the stripes stand apart: umber, with cream slits of sun
  sh *= 1. - uKey.w * inWood * streak;
  // POLISH 2: the open clearing is striped too: the wood on its sun side throws shadows hundreds of metres long over the sawdust
  float stC = vn(vec2(crs*0.21 + 5., alongS*0.004)) * 0.6 + vn(vec2(crs*0.9 + 11., alongS*0.008)) * 0.4 + (vn(vec2(crs*0.6 + 2., alongS*0.06)) - 0.5) * 0.07;
  float fwC = fwidth(crs) * 0.3;
  sh *= 1. - 0.66 * (1. - wood) * uFrost.x * smoothstep(0.53 - fwC, 0.60 + fwC, stC) * mix(1., 0.6, far);
  vec3 V = normalize(uCam - vW + vec3(0., 1e-4, 0.));
  // sawdust lies on the board like snow, in long drifts down the grain, deepest in the open; the boards show through between
  float fr = vn(vec2(P.x*0.11, P.y*0.028)) * 0.55 + vn(vec2(P.x*0.41 + 9., P.y*0.085)) * 0.30 + vn(vec2(P.x*1.7 + 3., P.y*0.30)) * 0.15;
  float snow = uFrost.x * smoothstep(0.34, 0.60, fr + 0.38 * (1. - wood) + 0.18 * lane + 0.10 * far + 0.34 * road) * (1. - 0.55 * joint);
  alb = mix(alb, cDust * (0.96 + 0.06 * vn(P * vec2(3.1, 0.7))), snow * 0.9);
  vec3 shadeC = mix(alb * cShade * uKey.x + alb * cSkyLo * 0.20, alb * cShade * uKey.x * 0.30 + coolAlb(alb) * skyFill() * (0.66 + 0.20 * snow), uFrost.y);
  vec3 col = mix(shadeC, alb * cLitB * (1.10 + 0.24 * lane + 0.30 * (1. - wood)) * (1. + 0.42 * snow), sh);
  float gl = pow(max(dot(reflect(-V, vec3(0., 1., 0.)), uSun), 0.), 90.);
  col += cHalo * gl * 0.16 * sh;
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;
const SKY_FRAG = /* glsl */`
${WOOD_GLSL}${HAZE_GLSL}
varying vec3 vD;
void main(){
  vec3 d = normalize(vD + vec3(0., 1e-5, 0.));
  float c = dot(d, uSun), h = d.y;
  vec3 col = skyCol(d);
  float c1 = max(c, 0.), k = c1*c1; k = k*k; k = k*k; k = k*k; k = k*k; k = k*k;   // c^64
  col += cHalo * k * k * k * 0.30;
  col += cHalo * smoothstep(0.99935, 0.99975, c) * 2.4;                          // the sun: a small soft disc, bright enough to bloom; at night the moon's disc (below) covers this dot and does not bloom
  if (uMoon.w != 0.) {   // NIGHT 1: the full moon on the light's own direction; it covers the dot above; no rays, no face. THE MOON AS A BALL (the thirteenth round): the disc is no longer one flat colour.
    float ang = atan(length(cross(d, uSun)), c), q = min(ang / uMoon.w, 1.), low = 1. - smoothstep(0., uSun.y, h);   // q: 0 at the disc's heart, 1 at its rim; low: 0 from the light's own height up, 1 at the horizon (at night the light stands 6.5 to 8 degrees up)
    vec3 w = vec3(q * q * uBall), hi = cDisc * pow(cRim / cDisc, w), lo = cDiscLo * pow(cRimLo / cDiscLo, w), body = hi * pow(lo / hi, vec3(low));   // a ball lit from our side is darker toward its rim: heart to rim by the square of the distance from the heart, as deep as uBall says (not at all at the night's own pale moon, wholly at the golden moon), and the air's small dimming toward the horizon (through the whole night).
    // The three colours beside cDisc are solved, not typed: at each end of the world's key each is the linear colour the tone map shows as the disc's own shown colour (cDisc's) at a share of its light (rim 0.70, low air 0.90, both 0.63),
    // so under this world's own grade the rim is darker in VALUE and keeps the disc's own hue (not on a device without float buffers, where the golden heart's red is cut at 1 and the rim shows redder than the heart, nor under another world's grade);
    // between the ends the world keys each on a straight line, and the disc's hue then stands up to 1.4 degrees toward yellow of its heart's (counted before rounding). Darkening the linear colour instead turns it orange under the tone map:
    // a rim that goes red says setting sun. Between two solved colours each channel goes by equal RATIOS, not equal steps (a straight mix passes through colours up to 1.7 degrees redder on the way; by ratios 0.7);
    // all four are above zero at night in every channel (cDisc is the night's honey and the golden amber at luminance 0.85, the three are solves of shown colours above zero, and a straight line between two such stays above zero). cDisc, the three colours and uBall are keyed by the world's piece C key, as cDisc has been since the twelfth round; nothing here reads the lens, the seed or the clock.
    col = mix(col, body, 1. - smoothstep(uMoon.w - 0.008, uMoon.w + 0.008, ang));   // a soft limb 0.016 rad wide (0.9 degrees, a seventh of its radius; it was 0.007 rad)
  }
  vec3 dh = normalize(vec3(d.x, 0., d.z) + vec3(0., 0., 1e-5));
  vec3 ground = hazed(cCream * 0.93 * mix(cLitB, cShade * uKey.x, 0.3), uCam + dh * 3400.);    // what the board fades to at its far edge
  col = mix(col, ground, (1. - smoothstep(-0.03, 0.0, h)));
  gl_FragColor = vec4(col, 1.);
}`;
// Sawdust points. position = where it is let go; aDust = (seed, size m, fall m, slot or -1); it sifts down and drifts.
const DUST_VERT = /* glsl */`
uniform float uTime, uPx; uniform float uTierT[${NT}]; uniform vec3 uCam;
attribute vec4 aDust; varying float vA;
void main(){
  float seed = aDust.x, ph = fract(uTime * (0.05 + 0.05*fract(seed*7.3)) + seed);
  vec3 p = position;
  p.y -= ph * aDust.z;
  p.x += sin(uTime*0.4 + seed*50.) * 1.5 + ph * 3.; p.z += cos(uTime*0.33 + seed*31.) * 1.5 - ph * 5.;
  float on = 1.;
  if (aDust.w > -0.5) on = smoothstep(0., 0.6, uTime - uTierT[int(clamp(aDust.w + 0.5, 0., ${NT - 1}.))]);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec4 mv = viewMatrix * wp;
  vA = on * smoothstep(0., 0.12, ph) * (1. - smoothstep(0.7, 1., ph)) * step(0., wp.y);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aDust.y * uPx / max(-mv.z, 0.5), 1.5, 4.);
}`;
const DUST_FRAG = /* glsl */`
${WOOD_GLSL}
varying float vA;
void main(){
  vec2 q = gl_PointCoord - 0.5; float r = dot(q, q) * 4.;
  float a = (1. - smoothstep(0.2, 1., r)) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(cDust * 0.60, a * 0.6);
}`;

// The engine's tone map (ACES, exposure 1) pales and yellows a bright orange: the brief's amber written as it stands
// shows as ochre. displayLinear(c) returns the linear colour that the tone map SHOWS as c (a small fixed-point solve).
function displayLinear(col, cap = 2.6) {
  // the same fixed-point solve as before, written without arrays (it ran to 25 ms of garbage in one build step)
  const fit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
  const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const tr = col.r, tg = col.g, tb = col.b; let cr = tr, cg = tg, cb = tb;
  for (let it = 0; it < 900; it++) {
    const ar = cr / 0.6, ag = cg / 0.6, ab = cb / 0.6;
    const ir = fit(0.59719 * ar + 0.35458 * ag + 0.04823 * ab), ig = fit(0.076 * ar + 0.90834 * ag + 0.01566 * ab), ib = fit(0.0284 * ar + 0.13383 * ag + 0.83777 * ab);
    const or = sat(1.60475 * ir - 0.53108 * ig - 0.07367 * ib), og = sat(-0.10208 * ir + 1.10813 * ig - 0.00605 * ib), ob = sat(-0.00327 * ir - 0.07276 * ig + 1.07602 * ib);
    cr = clamp(cr + (tr - or) * 0.5 * (0.2 + cr), 0, cap); cg = clamp(cg + (tg - og) * 0.5 * (0.2 + cg), 0, cap); cb = clamp(cb + (tb - ob) * 0.5 * (0.2 + cb), 0, cap);
  }
  return new THREE.Vector3(cr, cg, cb);
}
// THE MOON AS A BALL (the world's thirteenth round). displayShare(lin, share) returns the linear colour that the tone map SHOWS as `share` of what it shows the linear colour `lin` as:
// the same curve that displayLinear solves against, taken forward once, then that solve. Darker in value, the same in hue. (The curve's forward step stands here a second time so that the live solve above stays untouched.)
function displayShare(lin, share) {
  const fit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
  const sat = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const ar = lin.x / 0.6, ag = lin.y / 0.6, ab = lin.z / 0.6;
  const ir = fit(0.59719 * ar + 0.35458 * ag + 0.04823 * ab), ig = fit(0.076 * ar + 0.90834 * ag + 0.01566 * ab), ib = fit(0.0284 * ar + 0.13383 * ag + 0.83777 * ab);
  return displayLinear({ r: share * sat(1.60475 * ir - 0.53108 * ig - 0.07367 * ib), g: share * sat(-0.10208 * ir + 1.10813 * ig - 0.00605 * ib), b: share * sat(-0.00327 * ir - 0.07276 * ig + 1.07602 * ib) });
}

// ---------------------------------------------------------------------------------------------------------------------
// opts.rekey (default true): the low-sun key, with the sky and board a step down so backlit shaving is the brightest warm
// thing on screen; false keeps the palette's own values (no hour passes it: the night is keyed like every hour). style.rekey() after changing palette colours.
// makeStyle(ctx, opts) -> the one style instance a world shares. opts: palette (7 hexes), sunElevation (deg, 8),
// sunAzimuth (deg from +Z toward +X, 0), haze (per metre, 0.00045), glow (1.5).
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE, C = (h) => new THREE.Color(h);
  const palette = { cream: C(hex[0]), grain: C(hex[1]), knot: C(hex[2]), amber: C(hex[3]), amberHi: C(hex[4]), sawdust: C(hex[5]), sky: C(hex[6]), straw: C('#F2E3B6'), umber: C('#8A6A44') };
  const el = (opts.sunElevation ?? 8) * Math.PI / 180, az = (opts.sunAzimuth ?? 0) * Math.PI / 180;
  const sh = palette.umber, cr = palette.cream;
  const uniforms = {
    uSun: { value: new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)) },
    uCam: { value: new THREE.Vector3(0, 2, 0) }, uTime: { value: 0 }, uGlow: { value: opts.glow ?? 1.5 }, uHaze: { value: opts.haze ?? 0.00045 },
    uPx: { value: 600 },
    cCream: { value: palette.cream }, cGrain: { value: palette.grain }, cKnot: { value: palette.knot }, cAmber: { value: palette.amber },
    cAmberHi: { value: palette.amberHi }, cDust: { value: palette.sawdust }, cSky: { value: palette.sky }, cStraw: { value: palette.straw },
    cShade: { value: new THREE.Vector3(sh.r / cr.r, sh.g / cr.g, sh.b / cr.b) },
    cAmberB: { value: new THREE.Vector3() }, cAmberE: { value: new THREE.Vector3() }, cAmberD: { value: new THREE.Vector3() },
    cSkyLo: { value: new THREE.Vector3() }, cHalo: { value: new THREE.Vector3() }, cLitB: { value: new THREE.Vector3() }, uKey: { value: new THREE.Vector4() },
    uFrost: { value: new THREE.Vector4(0, 0, 0, 0) },
    cSunC: { value: new THREE.Vector3(1.03, 0.93, 0.76) }, uSkyK: { value: new THREE.Vector4(0.74, 0.2, 0.24, 0) },
    uMoon: { value: new THREE.Vector4(0, 0, 0, 0) },
    cMoonE: { value: new THREE.Vector3() },
    cRim: { value: new THREE.Vector3() }, cDiscLo: { value: new THREE.Vector3() }, cRimLo: { value: new THREE.Vector3() }, uBall: { value: 0 },   // THE MOON AS A BALL (the world's thirteenth round): zero but at night, where the world solves and keys the three colours and keys uBall (0 until the key begins)
    cDisc: { value: new THREE.Vector3() }, cWarmT: { value: new THREE.Vector3(1, 1, 1) },   // PIECE C (the world's twelfth round): the colour of the disc's heart (zero but at night) and the mend's ratio ((1, 1, 1) at every hour but night, and at night until the key begins)
  };
  const V = (c, k = 1) => new THREE.Vector3(c.r * k, c.g * k, c.b * k);
  const rekey = (o = {}) => {
    const u = uniforms, pa = palette, um = pa.umber, cm = pa.cream;
    u.cShade.value.set(um.r / cm.r, um.g / cm.g, um.b / cm.b);
    if (o.rekey ?? opts.rekey ?? true) {
      u.cAmberB.value.copy(displayLinear(pa.amber)); u.cAmberE.value.copy(displayLinear(pa.amberHi));
      u.cAmberD.value.copy(u.cAmberB.value).multiply(new THREE.Vector3(0.40, 0.36, 0.5));
      u.cSkyLo.value.copy(displayLinear(pa.sky.clone().multiplyScalar(o.sky ?? 0.80)));       // multiplyScalar acts on the linear colour
      u.cHalo.value.copy(displayLinear(pa.straw)).multiplyScalar(0.74);                      // under the bloom threshold: only backlit shaving and the sun's own disc bloom; at night the moon's disc does not bloom (it stands 0.01 under the threshold) and the blade's fresh-cut line blooms faintly
      u.cLitB.value.set(0.53, 0.48, 0.40).multiplyScalar(o.board ?? 1);
      u.uKey.value.set(o.shadeBoard ?? 0.28, o.shadeWood ?? 0.60, o.halo ?? 40, o.streaks ?? 0.72);
    } else {
      u.cAmberB.value.copy(V(pa.amber.clone().lerp(pa.amberHi, 0.3), 1.35)); u.cAmberE.value.copy(V(pa.amberHi, 1.5));
      u.cAmberD.value.copy(V(pa.amber, 0.87)).multiply(new THREE.Vector3(0.90, 0.62, 0.38));
      u.cSkyLo.value.copy(V(pa.sky, 0.92)); u.cHalo.value.copy(V(pa.straw, 1.3)); u.cLitB.value.setScalar(0.66 * (o.board ?? 1));
      u.uKey.value.set(o.shadeBoard ?? 1.1, o.shadeWood ?? 0.92, o.halo ?? 5, o.streaks ?? 0.5);
    }
  };
  rekey();
  const allT = () => new Float32Array(NT).fill(-1e3);          // slot times: -1e3 = long open, +1e6 = not yet cut
  const shA = [], shB = [];
  for (let i = 0; i < NSH; i++) { shA.push(new THREE.Vector4(0, 0, 1, 1)); shB.push(new THREE.Vector4(0, 0, 1, 0)); }
  const style = {
    palette, uniforms, NT, NSH, rekey,
    shown: displayLinear,   // PIECE C (the world's twelfth round): the key's own solve, for a world that needs the lamp colour of a hex it holds: shown(colour) is the linear colour the tone map SHOWS as that colour (what rekey writes into cAmberB for the palette's amber)
    shownShare: displayShare,   // THE MOON AS A BALL (the world's thirteenth round): shownShare(linear colour, share) is the linear colour the tone map shows as that share of the colour's own shown light (the moon's rim and its low air)
    // opaque wood. grain: axis the grain runs along in the mesh's local space; chip: hard light; cut: aScoop + uniforms.uCutY.
    wood({ grain = 'y', chip = false, cut = false, knots = 0.6, tone = 1, bark = 0, side = THREE.FrontSide } = {}) {
      const defines = { GRAIN: grain === 'y' ? 0 : grain === 'z' ? 1 : 2, HARD: chip ? '1.' : '0.' };
      if (cut) defines.CUT = '';
      return new THREE.ShaderMaterial({ defines, side, vertexShader: WOOD_VERT, fragmentShader: WOOD_FRAG,
        uniforms: { ...uniforms, uCutY: { value: -1e4 }, uKnots: { value: knots }, uTone: { value: tone }, uBark: { value: bark } } });
    },
    // baked shaving ribbons (ribbonGeometry). gloss 0..1: 1 for the stream.
    shaving({ gloss = 0, wave = 0 } = {}) {
      const ice = gloss > 0;                                       // ice: a mirror that carries the board's shadow casters (all but slot 0) and the sun's path
      return new THREE.ShaderMaterial({ side: THREE.DoubleSide, defines: ice ? { ICE: '' } : {}, vertexShader: RIBBON_VERT, fragmentShader: SHAVING_FRAG,
        uniforms: { ...uniforms, uGloss: { value: gloss }, uGilt: { value: 0 }, uWave: { value: wave }, uWaveEnd: { value: new THREE.Vector2(1e5, 0) }, ...(ice ? { uShA: { value: shA }, uShB: { value: shB } } : {}) } });   // uGilt: one object for each material (a uniform's value belongs to the GL program, and only the uniforms a material holds are uploaded)
    },
    // instanced curls. slotTimes: Float32Array(32) you own and write (time the cut reached slot i; see allT()).
    curl(slotTimes = allT()) {
      return new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: CURL_VERT, fragmentShader: SHAVING_FRAG, uniforms: { ...uniforms, uGloss: { value: 0 }, uGilt: { value: 0 }, uTierT: { value: slotTimes } } });
    },
    dust(slotTimes = allT()) {
      return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, uniforms: { ...uniforms, uTierT: { value: slotTimes } } });
    },
    slotTimes: allT,
    // the ground: use on a flat mesh at y = 0 (any size). Register shadow casters with setShadow.
    board: new THREE.ShaderMaterial({ vertexShader: 'varying vec3 vW; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }',
      fragmentShader: BOARD_FRAG, uniforms: { ...uniforms, uShA: { value: shA }, uShB: { value: shB }, uBoardW: { value: 9 }, uClear: { value: new THREE.Vector4(0, 0, 1e5, 1e5) } } }),
    // i 0..23; x,z world; halfW of the bare stick; len of shadow drawn; reach of the opened cone at the foot; cutY (0 = bare); tree height; strength.
    setShadow(i, x, z, halfW, len, reach = 0, cutY = 0, height = 50, strength = 0.8) { shA[i].set(x, z, halfW, len); shB[i].set(reach, cutY, height, strength); },
    sky: new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*vec4(position + cameraPosition, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }',
      fragmentShader: SKY_FRAG }),
    skyMesh() { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 3), style.sky); m.renderOrder = -10; m.frustumCulled = false; return m; },
    // drive every frame (the camera may be the one behind a portal: world matrix only).
    update(dt, time, camera) {
      uniforms.uTime.value = time;
      if (camera) {
        camera.getWorldPosition(uniforms.uCam.value);
        let hgt = 720; if (ctx.renderer) hgt = ctx.renderer.getDrawingBufferSize(_v2).y;
        uniforms.uPx.value = hgt * 0.5 * camera.projectionMatrix.elements[5];
      }
    },
    curlGeometry, curlMesh, ribbonGeometry, stickGeometry,
  };
  return style;
}
const _v2 = new THREE.Vector2();

// Base ribbon for instanced curls: segs stations along (2 triangles each), x = t, y = v.
export function curlGeometry(segs = 56) {
  const pos = new Float32Array((segs + 1) * 2 * 3), idx = [];
  for (let i = 0; i <= segs; i++) { const t = Math.pow(i / segs, 1.15); pos.set([t, -1, 0, t, 1, 0], i * 6); if (i < segs) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
// list: [{ az, y, r, slot, L, W, A, rhoE, a0, a1, yaw, seed, k, pitch, reach, delay }] -> one Mesh (one draw call).
// Place the mesh at the tree's foot; bound = [centre Vector3, radius] for culling (or leave unculled).
export function curlMesh(list, material, segs = 56, bound = null) {
  const g = curlGeometry(segs), n = list.length;
  const a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n * 4), d = new Float32Array(n * 4), e = new Float32Array(n * 3);
  list.forEach((q, i) => { a.set([q.az, q.y, q.r, q.slot ?? 0], i * 4); b.set([q.L, q.W, q.A, q.rhoE], i * 4); c.set([q.a0, q.a1, q.yaw ?? 0, q.seed ?? 0.5], i * 4); d.set([q.k, q.pitch ?? 0.5, q.reach ?? 10, q.delay ?? 0], i * 4); e.set([q.bx ?? 0, q.by ?? 0, q.bz ?? 0], i * 3); });
  g.setAttribute('aRoot', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aShape', new THREE.InstancedBufferAttribute(b, 4));
  g.setAttribute('aPose', new THREE.InstancedBufferAttribute(c, 4)); g.setAttribute('aMisc', new THREE.InstancedBufferAttribute(d, 4)); g.setAttribute('aBase', new THREE.InstancedBufferAttribute(e, 3));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, material);
  if (bound) g.boundingSphere = new THREE.Sphere(bound[0], bound[1]); else m.frustumCulled = false;
  return m;
}
// A baked shaving: pts[i] centre line, nrm[i] unit face normal, halfW number or (i, s01) => m, over (i, s01) => 0..1.
// Stations may also carry a twist by giving nrm that turns. Returns BufferGeometry for style.shaving().
export function ribbonGeometry(pts, nrm, halfW = 1, over = null) {
  const n = pts.length, pos = new Float32Array(n * 6), nor = new Float32Array(n * 6), tan = new Float32Array(n * 6), sv = new Float32Array(n * 8), idx = [];
  let s = 0, total = 0; const T = new THREE.Vector3(), X = new THREE.Vector3();
  for (let i = 1; i < n; i++) total += pts[i].distanceTo(pts[i - 1]);
  for (let i = 0; i < n; i++) {
    if (i > 0) s += pts[i].distanceTo(pts[i - 1]);
    T.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    X.crossVectors(T, nrm[i]).normalize();
    const s01 = s / Math.max(total, 1e-6), w = typeof halfW === 'function' ? halfW(i, s01) : halfW, ov = over ? over(i, s01) : 0;
    for (let k = 0; k < 2; k++) {
      const v = k ? 1 : -1, o = (i * 2 + k) * 3;
      pos[o] = pts[i].x + X.x * w * v; pos[o + 1] = pts[i].y + X.y * w * v; pos[o + 2] = pts[i].z + X.z * w * v;
      nor[o] = nrm[i].x; nor[o + 1] = nrm[i].y; nor[o + 2] = nrm[i].z; tan[o] = T.x; tan[o + 1] = T.y; tan[o + 2] = T.z;
      sv.set([s, v, w, ov], (i * 2 + k) * 4);
    }
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3)); g.setAttribute('aSV', new THREE.BufferAttribute(sv, 4)); g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
// A knife-faceted stick, foot at the origin, grain along +Y. cols flats round it; long facets (facet m) staggered per
// column; optional scoops [{ col, y (root height), len, depth }] dig a groove below each curl root. Writes aScoop so a
// material made with wood({cut:true}) digs each scoop only when uCutY has climbed past it (depth 0 = never moves).
// PIECE A (the world's twelfth round): with dealOnly the stick is DEALT AND NOT MADE: the facets' draws are taken from rng exactly as for a stick that is made
// (they depend on cols, height and facet alone) and null is returned; no buffer is made.
export function stickGeometry({ height = 50, r0 = 1, r1 = 0.2, cols = 12, ring = 2.5, facet = 12, scoops = [], rng = null, taper = 0.85, dealOnly = false } = {}) {
  const jit = [], off = [];
  for (let c = 0; c < cols; c++) { off.push(rng ? rng() * facet : (c * 5.3) % facet); jit.push([]); for (let k = 0; k < Math.ceil(height / facet) + 2; k++) jit[c].push(rng ? rng.range(-1, 1) : Math.sin(c * 12.9 + k * 78.2)); }
  if (dealOnly) return null;
  const rings = Math.max(2, Math.round(height / ring)), nV = (rings + 1) * cols + 1;
  const pos = new Float32Array(nV * 3), sc = new Float32Array(nV * 3), idx = [];
  const byCol = Array.from({ length: cols }, () => []);
  for (const s of scoops) byCol[((s.col % cols) + cols) % cols].push(s);
  for (let j = 0; j <= rings; j++) {
    const y = (j / rings) * height, f = y / height, rT = r1 + (r0 - r1) * Math.pow(1 - f, taper);
    for (let c = 0; c < cols; c++) {
      const a = (c / cols) * TAU, r = rT * (1 + 0.045 * jit[c][Math.floor((y + off[c]) / facet)]) + (j === 0 ? rT * 0.06 : 0);
      let depth = 0;
      for (const s of byCol[c]) { const q = (y - (s.y - s.len)) / s.len; if (q > 0 && q <= 1.0001) depth = Math.max(depth, s.depth * Math.pow(q, 0.6)); }
      const o = (j * cols + c) * 3;
      pos[o] = Math.sin(a) * r; pos[o + 1] = y; pos[o + 2] = Math.cos(a) * r;
      sc[o] = y; sc[o + 1] = Math.min(depth, rT * 0.45); sc[o + 2] = 0;
      if (j < rings) { const i0 = j * cols + c, i1 = j * cols + (c + 1) % cols, i2 = i0 + cols, i3 = i1 + cols; idx.push(i0, i1, i2, i1, i3, i2); }
    }
  }
  const tip = nV - 1; pos[tip * 3 + 1] = height + r1 * 2.5; sc[tip * 3] = height;
  for (let c = 0; c < cols; c++) idx.push(rings * cols + c, rings * cols + (c + 1) % cols, tip);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aScoop', new THREE.BufferAttribute(sc, 3)); g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE OLD STICK
const H = 210, R_FOOT = 4.5, R_TOP = 0.45, TIERS = 30, PER = 14, Y0 = 21, Y1 = 204, LONG_TIER = 8;
const trunkR = (y) => R_TOP + (R_FOOT - R_TOP) * Math.pow(Math.max(1 - y / H, 0), 0.85);
const tierY = (i) => Y0 + (i / (TIERS - 1)) * (Y1 - Y0);

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? 1;
  const standalone = !opts.style;
  const style = opts.style || makeStyle(ctx, { palette: opts.palette || PALETTE });
  const object = new THREE.Group();
  const tierT = style.slotTimes().fill(1e6);                  // the hero starts bare
  await ctx.yield();

  // --- trunk: 28 flats (two per curl), a scoop 12 m long under every curl root, dug as the blade passes -------------
  const cols = PER * 2, scoops = [], curls = [];
  const handed = 0.2 + 0.6 * rng();                           // per seed: how many curls roll left-handed
  const longAz = opts.longAz ?? -0.78;                        // the over-long curl leaves toward the north-west (polish 4: the world may aim it at the ring)
  const hand = rng.range(0.85, 1.15), droop = rng.range(-0.08, 0.08), SPAN = opts.span ?? 1, WIDE = opts.wide ?? 1;
  let longCol = 0;
  for (let i = 0; i < TIERS; i++) {
    const f = i / (TIERS - 1), y = tierY(i), rT = trunkR(y);
    const A0 = 30 * Math.pow(1 - f, 0.9) + 0.9, W0 = 3.9 * Math.pow(1 - f, 0.75) + 0.8 * f + 0.3;
    const splitAt = rng.chance(0.3) ? rng.int(0, PER - 1) : -1;
    for (let j = 0; j < PER; j++) {
      const col = (j * 2 + (i % 2)) % cols;
      let az = (col / cols) * TAU;
      scoops.push({ col, y, len: Math.min(12, y - 2), depth: rT * rng.range(0.16, 0.26) });
      const isLong = i === LONG_TIER && Math.abs(((az - longAz + Math.PI * 3) % TAU) - Math.PI) < TAU / cols + 1e-3;
      const u1 = rng(), u2 = rng(), u3 = rng(), u4 = rng(), u5 = rng(), u6 = rng();
      if (isLong) { longCol = col; continue; }
      const n = j === splitAt ? 2 : 1;                         // the hand's fault: a split curl, two unequal halves
      for (let h = 0; h < n; h++) {
        // opts.span (1): how far the arms reach, the ribbon's length kept (a longer arm unrolls out of the same roll): the world passes 1.18,
        // which makes the opened tower the brief's "90 m across"; opts.wide (1) widens the ribbons (1.18: the lowest "5 m wide").
        const Ab = A0 * (0.82 + 0.36 * u1) * hand * (h ? 0.7 : 1), A = Ab * SPAN, W = (W0 * WIDE * (0.85 + 0.3 * u2)) / n;
        const rollLen = Math.max(Ab * (1.05 + 0.5 * u3) + 1.5 - (A - Ab), 0.55 * Ab), rhoE = 0.3 * W0 + 0.3, k = 0.11 + 0.05 * u4;
        const rho0 = rhoE + rollLen * k / Math.sqrt(1 + k * k);
        curls.push({ az, y, r: rT * 0.97, slot: i, L: A + rollLen, W, A, rhoE, k,
          a0: 0.22 + 0.25 * u5 + f * 0.25, a1: -0.92 + 0.3 * u6 + droop + f * 0.2 + h * 0.2, yaw: (u2 - 0.5) * 0.22 + (n > 1 ? (h - 0.5) * 0.16 : 0),
          seed: u1 * 0.6 + u5 * 0.4, pitch: (0.35 + 0.55 * u3) * (u4 > handed ? 1 : -1), reach: A * 0.8 + rho0, delay: 0.03 + 0.3 * u6 + h * 0.12 });
      }
    }
  } await ctx.yield();
  const trunkMat = style.wood({ grain: 'y', cut: true, knots: 0.8 }); await ctx.yield();
  const trunk = new THREE.Mesh(stickGeometry({ height: H, r0: R_FOOT, r1: R_TOP, cols, ring: 2.1, facet: 12, scoops, rng: rng.fork ? rng.fork('facets') : rng }), trunkMat);
  object.add(trunk);
  await ctx.yield();

  // --- 419 curls, one draw call ----------------------------------------------------------------------------------------
  const curlMat = style.curl(tierT); await ctx.yield();
  curlMat.uniforms.uRule = { value: opts.rule ?? 0 };                 // opts.rule (0..1): the rim its metres-wide ribbons keep far off (see SHAVING_FRAG)
  const curlObj = curlMesh(curls, curlMat, opts.curlSegs ?? 56, [new THREE.Vector3(0, H * 0.5, 0), H * 0.62]);
  object.add(curlObj);
  await ctx.yield();

  // --- the curl that ran too long: out from the ninth tier, a rail beside the exit line, its end rolled into the ring --
  const E = new THREE.Vector3(opts.seatX ?? 15, opts.seatY ?? 92, opts.seatZ ?? 67), RK = opts.ringScale ?? 1;   // polish 5: the world may hang the ring anywhere (seatX, seatZ) and make it larger (ringScale)                     // centre of the ring = portal seat (local); polish 3: the world may hang it lower (seatY, seatPitch in degrees)
  const hd = (opts.seatHeading ?? 50) * Math.PI / 180, pt = (opts.seatPitch ?? 25) * Math.PI / 180;   // polish 4: the world may turn the exit line (seatHeading, degrees from +Z toward +X)
  const D = new THREE.Vector3(Math.sin(hd) * Math.cos(pt), Math.sin(pt), Math.cos(hd) * Math.cos(pt));   // exit direction
  const RT = new THREE.Vector3(Math.cos(hd), 0, -Math.sin(hd)), UP = new THREE.Vector3().crossVectors(D, RT).normalize();
  const RING_R = 8.2 * RK, PSI0 = opts.railPsi ?? -0.35, A_JOIN = opts.railJoin ?? -44, A_COIL = -16;   // polish 4: railJoin (metres short of the ring where the long curl meets the exit line)   // polish 3: the world may bring the rail in under the exit line (railPsi -PI/2) instead of beside it
  const radial = (psi, out = new THREE.Vector3()) => out.copy(RT).multiplyScalar(Math.cos(psi)).addScaledVector(UP, Math.sin(psi));
  const lAz = (longCol / cols) * TAU, lY = tierY(LONG_TIER), lR = trunkR(lY) * 0.97;
  for (const c of curls) { const da = Math.abs(((c.az - lAz + Math.PI * 3) % TAU) - Math.PI); if (((c.slot > LONG_TIER && c.slot <= LONG_TIER + 4) || (opts.railPsi !== undefined && c.slot < LONG_TIER && c.slot >= LONG_TIER - 5)) && da < 0.62) { c.A *= 0.45; c.L *= 0.5; c.reach *= 0.5; } }
  // opts.toward(y) -> { az, dist } | null: where the lens passes the tier at height y (local azimuth and distance from the trunk).
  // The two or three curls of that tier that point at the lens ran long (the hand's uneven curls), so they unroll close to it, 10 m clear.
  if (opts.fit) { for (let i = 0; i < curls.length; i++) { opts.fit(curls[i]); if (i % 16 === 15) await ctx.yield(); } }   // polish 4: the world cuts shorter any curl that would hang in the lens's way
  if (opts.toward) for (const c of curls) {
    if (c.slot < 1 || c.slot >= LONG_TIER) continue;
    const t = opts.toward(c.y); if (!t) continue;
    const da = Math.abs(((c.az - t.az + Math.PI * 3) % TAU) - Math.PI); if (da > 0.44) continue;
    const want = clamp((t.dist - 10) / Math.max(c.reach, 1), 1, 1.7), dA = c.A * (want - 1) * (1 - 0.5 * da / 0.44);
    c.A += dA; c.L += dA; c.reach += dA * 0.8;
  }
  {
    const g = curlObj.geometry, b = g.getAttribute('aShape'), m = g.getAttribute('aMisc');
    const ps = g.getAttribute('aPose');                             // polish 5: the world's fit may also re-pose a curl (the arches over the lens on the west flank)
    curls.forEach((c, i) => { b.setXYZW(i, c.L, c.W, c.A, c.rhoE); ps.setXYZ(i, c.a0, c.a1, c.yaw ?? 0); m.setZ(i, c.reach); });
  }
  const lp = [], ln = []; await ctx.yield();
  const R0 = new THREE.Vector3(Math.sin(lAz) * lR, lY, Math.cos(lAz) * lR), out0 = new THREE.Vector3(Math.sin(lAz), 0, Math.cos(lAz));
  const J = E.clone().addScaledVector(D, A_JOIN).add(radial(PSI0).multiplyScalar(RING_R));
  // polish 4 (opts.railSide): the long curl comes in SIDEWAYS, along the ring's own winding, so it runs from the tower straight to the
  // ring and is never a rail beside the lens; without it it joins along the exit line as before.
  const tanJ = RT.clone().multiplyScalar(-Math.sin(PSI0)).addScaledVector(UP, Math.cos(PSI0));
  const C1 = R0.clone().addScaledVector(out0, opts.railSide ? 24 : 17).add(new THREE.Vector3(0, 6, 0)), C2 = opts.railSide ? J.clone().addScaledVector(tanJ, -opts.railSide) : J.clone().addScaledVector(D, -17);
  // REPAIR 3 (opts.railBank, radians): the rail lies banked, its face turned off the ring's cylinder by this much, so that from the exit line we
  // look at the face the low sun is BEHIND (translucent amber, "with the sun behind it it glows amber"); it twists back onto the cylinder as it
  // winds into the ring. opts.railHalf: its half width in metres (2).
  const BANK = opts.railBank ?? 0, nR = radial(PSI0 - BANK), RAIL_HW = opts.railHalf ?? 2.0;
  const bez = new THREE.CubicBezierCurve3(R0, C1, C2, J), nJ = radial(PSI0), tmp = new THREE.Vector3();
  for (let i = 0; i < 44; i++) {
    const q = i / 44, p = bez.getPoint(q), T = bez.getTangent(q);
    const n0 = tmp.set(0, nR.y < -0.5 ? -1 : 1, 0).lerp(nR, q * q * (3 - 2 * q)).clone();
    n0.addScaledVector(T, -n0.dot(T)).normalize(); lp.push(p); ln.push(n0);
  }
  if (Math.abs(A_COIL - A_JOIN) > 0.5) for (let i = 0; i < 12; i++) { const a = A_JOIN + (i / 12) * (A_COIL - A_JOIN); lp.push(E.clone().addScaledVector(D, a).add(radial(PSI0).multiplyScalar(RING_R))); ln.push(radial(PSI0 - BANK * (1 - 0.35 * core_ss(0.6, 1, i / 12)))); }
  // The end of the long curl makes most of one turn round the exit line, opening out from the rail to the barrel's mouth.
  const B_A0 = -9.5 * RK, B_A1 = 0.5, B_R0 = 10.4 * RK, B_R1 = 9.0 * RK, B_TURNS = 3.3, PSI_L = 5.6;   // polish 3: a little smaller and shorter: the ring is entire in the frame along the last line until the lens is about 25 m short of it
  const funnel = (psi, tilt, out = new THREE.Vector3()) => radial(psi, out).multiplyScalar(Math.cos(tilt)).addScaledVector(D, Math.sin(tilt));   // the inner face to us
  const bTilt = (psi) => 0.9 + 0.14 * Math.sin(psi * 1.3 + 1.1);
  const NC = 70, coil0 = lp.length;
  for (let i = 0; i <= NC; i++) {
    const q = i / NC, e = q * q * (3 - 2 * q), a = A_COIL + (B_A0 - A_COIL) * q, psi = PSI0 + PSI_L * q;
    lp.push(E.clone().addScaledVector(D, a).addScaledVector(radial(psi), RING_R + (B_R0 - RING_R) * e)); ln.push(funnel(psi - 0.65 * BANK * (1 - core_ss(0, 0.3, q)), bTilt(psi) * e));
  }
  const nL = lp.length; await ctx.yield();
  const longGeo = ribbonGeometry(lp, ln, (i, s) => (opts.railSide ? 0.9 + 1.1 * core_ss(0.62, 0.9, s) : RAIL_HW) * (0.55 + 0.45 * core_ss(0, 0.04, s)) * (0.55 + 0.45 * (1 - core_ss(0.985, 1, s))), null);
  // THE RING: a short barrel of shaving rolled round the portal seat, three turns and more, each band tilted like a funnel with
  // its inner face to us, so from the exit line the bands lie wide round the opening and overlap. It is the long curl's own end
  // (the same line, radius and winding carry on from the long curl's last station) and it appears only when that curl has run out to it.
  const ring = {}; await ctx.yield();
  {
    const bp = [], bn = [], NB = 230, sun = style.uniforms.uSun.value;
    for (let i = 0; i <= NB; i++) {
      const q = i / NB, psi = PSI0 + PSI_L + q * B_TURNS * TAU;
      bp.push(E.clone().addScaledVector(D, B_A0 + (B_A1 - B_A0) * q).addScaledVector(radial(psi), B_R0 + (B_R1 - B_R0) * q)); bn.push(funnel(psi, bTilt(psi)));
    }
    const bGeo = ribbonGeometry(bp, bn, (i, s) => 1.9 * RK * (0.75 + 0.25 * core_ss(0, 0.05, s)) * (0.35 + 0.65 * (1 - core_ss(0.94, 1, s))), null);
    const pa = bGeo.getAttribute('position'), sv = bGeo.getAttribute('aSV'), c0 = new THREE.Vector3(), c1 = new THREE.Vector3(); await ctx.yield();
    for (let i = 0; i <= NB; i++) for (let k = 0; k < 2; k++) {       // where another turn stands on the sun's line through this point: two layers, burnt amber
      const vi = i * 2 + k; c0.fromBufferAttribute(pa, vi); let occ = 0;
      for (let j = 0; j <= NB; j += 2) {
        if (Math.abs(j - i) < 40) continue;
        const t = c1.subVectors(bp[j], c0).dot(sun), d = Math.sqrt(Math.max(c1.lengthSq() - t * t, 0)), w = sv.getZ(j * 2);
        occ = Math.max(occ, 1 - core_ss(w * 0.5, w * 1.15, d));
      }
      sv.setW(vi, 0.05 + 0.9 * occ);
      if (k === 1 && i % 20 === 19) await ctx.yield();   // this loop ran to 30 ms, once to 61 ms, in one stretch on a busy machine
    }
    // REPAIR 2: the ring is the END of the long curl ("a ribbon 70 m out from the trunk whose end rolled itself into a ring"), so it is not
    // there while the Old Stick stands bare: it winds itself round the seat when the long curl has run out to it (unrollU below).
    ring.geo = bGeo; ring.p = bp; ring.n = bn;
  }
  await ctx.yield();
  // A baked ribbon that unrolls like a carpet: stations past the front are wound on the roll that rides it. uWob = (swing of the laid length, 1 = held at its root).
  const UNROLL_VERT = /* glsl */`
attribute vec3 aTan; attribute vec4 aSV;
uniform float uFront, uRollR, uLen, uTime, uShow; uniform vec3 uFP, uFT, uFN; uniform vec2 uWob;
varying vec3 vN, vT, vW; varying vec4 vUv; varying vec2 vInner;
void main(){
  vec3 p = position, n = normal, tg = aTan;
  float d = aSV.x - uFront, sl = aSV.x / max(uLen, 1.);
  if (d > 0.) {                                             // not yet unrolled: wound on the roll that rides the front
    float th = d / max(uRollR, 0.2), rr = uRollR * exp(-0.035*th);
    p = uFP + uFN*uRollR + rr*(sin(th)*uFT - cos(th)*uFN) + cross(uFT, uFN) * (aSV.y * aSV.z);
    n = cos(th)*uFN - sin(th)*uFT; tg = cos(th)*uFT + sin(th)*uFN;
  } else {
    p += n * (sin(uTime*1.3 + aSV.x*0.09) * 0.22 + sin(uTime*2.9 + aSV.x*0.31) * 0.06) * uWob.x * mix(1., smoothstep(0.03, 0.4, sl), uWob.y);
  }
  p = mix(uFP, p, uShow);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vN = mat3(modelMatrix)*n; vT = mat3(modelMatrix)*tg; vUv = vec4(aSV.xy, aSV.z * uShow, aSV.w); vInner = vec2(0.);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
  const unrollU = (P, N, wob, held) => {                    // the stations' running length and tangents, and the uniforms of one unrolling ribbon
    const n = P.length, S = new Float32Array(n), T = [];
    for (let i = 0; i < n; i++) { S[i] = i ? S[i - 1] + P[i].distanceTo(P[i - 1]) : 0; T.push(new THREE.Vector3().subVectors(P[Math.min(i + 1, n - 1)], P[Math.max(i - 1, 0)]).normalize()); }
    const U = { uFront: { value: 0 }, uRollR: { value: 6 }, uFP: { value: P[0].clone() }, uFT: { value: T[0].clone() }, uFN: { value: N[0].clone() }, uLen: { value: S[n - 1] }, uShow: { value: 0 }, uWob: { value: new THREE.Vector2(wob, held) } };
    const setFront = (front, done) => {
      let k = 0; while (k < n - 2 && S[k + 1] < front) k++;
      const f = clamp((front - S[k]) / Math.max(S[k + 1] - S[k], 1e-4), 0, 1);
      U.uFront.value = done ? S[n - 1] + 1 : front;
      U.uFP.value.lerpVectors(P[k], P[k + 1], f); U.uFT.value.lerpVectors(T[k], T[k + 1], f).normalize(); U.uFN.value.lerpVectors(N[k], N[k + 1], f).normalize();
    };
    return { U, len: S[n - 1], setFront, mat: new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: UNROLL_VERT, fragmentShader: SHAVING_FRAG, uniforms: { ...style.uniforms, uGloss: { value: 0 }, uGilt: { value: 0 }, ...U } }) };   // uGilt 0: the Old Stick's over-long curl, its rail and the ring it winds into round the portal are cut of the wood, not gilt: the night's lens law thins them like every curl of the tree. PIECE C (the world's twelfth round): once the world's key has begun the long curl and its rail turn with the tree's curls and THE RING DOES NOT: the world gives the ring's material its own copies of the night's colours, so it keeps the night's straw to the end. It keeps it by the designer's word: "If you cannot choose, the ring keeps the night's straw." No other reason is claimed. One object for each material, as above
  };
  const longR = unrollU(lp, ln, 1, 1), longLen = longR.len, longU = longR.U;
  const longCurl = new THREE.Mesh(longGeo, longR.mat); longCurl.frustumCulled = false;
  object.add(longCurl);
  await ctx.yield();
  const ringR = unrollU(ring.p, ring.n, 0.3, 0), LONG_T = 3.6, RING_T = 2.2;   // seconds: the long curl runs out, then its end winds itself into the ring
  const barrel = new THREE.Mesh(ring.geo, ringR.mat); barrel.frustumCulled = false; barrel.name = 'exit-ring'; object.add(barrel);   // PIECE C (the world's twelfth round): named, so the world can give the ring's material its own copies of the night's colours
  await ctx.yield();

  // --- sawdust: a puff flung from every tier as it springs open, and a fine sift from the opened tiers ----------------
  const nPuff = Math.round(TIERS * 110 * detail), pp = new Float32Array(nPuff * 3), pv = new Float32Array(nPuff * 3), pd = new Float32Array(nPuff * 4);
  for (let i = 0; i < nPuff; i++) {
    const t = i % TIERS, y = tierY(t), a = rng() * TAU, r = trunkR(y), sp = rng.range(3, 11) * (1 - 0.6 * t / TIERS);
    pp.set([Math.sin(a) * r, y - rng() * 6, Math.cos(a) * r], i * 3);
    pv.set([Math.sin(a) * sp, rng.range(-1, 4), Math.cos(a) * sp], i * 3);
    pd.set([rng(), rng.range(0.16, 0.42) * (1.3 - t / TIERS), t, rng() * 0.7], i * 4); if (i % 256 === 255) await ctx.yield();
  }
  const puffGeo = new THREE.BufferGeometry();
  puffGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3)); puffGeo.setAttribute('aVel', new THREE.BufferAttribute(pv, 3)); puffGeo.setAttribute('aDust', new THREE.BufferAttribute(pd, 4));
  const puffMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fragmentShader: DUST_FRAG, uniforms: { ...style.uniforms, uTierT: { value: tierT } },
    vertexShader: /* glsl */`
uniform float uTime, uPx; uniform float uTierT[${NT}];
attribute vec3 aVel; attribute vec4 aDust; varying float vA;
void main(){
  float age = uTime - uTierT[int(clamp(aDust.z + 0.5, 0., ${NT - 1}.))] - aDust.w;
  float a = max(age, 0.);
  vec3 p = position + aVel * (1. - exp(-1.5*a)) / 1.5 + vec3(0.6, -0.9, -1.4) * a * (0.5 + aDust.x);
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.);
  vA = step(0., age) * smoothstep(0., 0.08, a) * (1. - smoothstep(1.2, 4.5, a)) * 0.8;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aDust.y * (1. + a*0.5) * uPx / max(-mv.z, 0.5), 1.5, 4.5);
}` });
  const puff = new THREE.Points(puffGeo, puffMat); puff.frustumCulled = false; object.add(puff); await ctx.yield();
  const nSift = Math.round(900 * detail), sp = new Float32Array(nSift * 3), sd = new Float32Array(nSift * 4);
  for (let i = 0; i < nSift; i++) {
    const t = rng.int(0, TIERS - 1), y = tierY(t), a = rng() * TAU, r = trunkR(y) + rng() * (26 * (1 - t / TIERS) + 2);
    sp.set([Math.sin(a) * r, y - rng() * 8, Math.cos(a) * r], i * 3); sd.set([rng(), rng.range(0.12, 0.3), rng.range(14, 34), t], i * 4);
  }
  const siftGeo = new THREE.BufferGeometry();
  siftGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); siftGeo.setAttribute('aDust', new THREE.BufferAttribute(sd, 4));
  const sift = new THREE.Points(siftGeo, style.dust(tierT)); sift.frustumCulled = false; object.add(sift);
  await ctx.yield();

  // --- standing alone (the part viewer): bring our own sky and board so the piece is judged in its own hand -----------
  const shadowSlot = opts.shadowSlot ?? 0;
  if (standalone && opts.backdrop !== false) {
    const sky = style.skyMesh(); sky.renderOrder = -0.5; object.add(sky);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000), style.board); board.rotation.x = -Math.PI / 2; object.add(board);
  }
  const low = opts.view === 'low', close = opts.view === 'close';                 // viewer aids only (framing of the piece alone)

  // --- anchors (local space; the tree's foot is the origin, the sun and the course are +Z) ----------------------------
  const S0 = E.clone().addScaledVector(D, -60);                                 // start of the straight 60 m to the portal
  const anchors = {
    portalSeat: { position: E.clone(), direction: D.clone(), facing: D.clone().negate(), radius: 7 * RK, ringRadius: RING_R },
    exitStart: S0,
    flyThrough: [[0, 2, -105], [0, 2, -80], [-23.7, 4, -57.3], [-37, 14, -36.5], [-44.6, 27, -17.7], [-46, 40, 1], [-40.2, 53, 18], [S0.x, S0.y, S0.z], [E.x, E.y, E.z]].map((p) => new THREE.Vector3(...p)),
    viewpoints: { reveal: new THREE.Vector3(0, 2, -130), climb: new THREE.Vector3(-46, 40, 1), rail: S0.clone().addScaledVector(D, 20) },
    longCurlRoot: R0.clone(), crown: new THREE.Vector3(0, H, 0), cutAbove: 20, shadowLength: 400, longTier: LONG_TIER, longSeconds: LONG_T + RING_T,   // longSeconds: from the ninth tier's cut until the long curl has run out and wound its end into the ring
    tierHeights: Array.from({ length: TIERS }, (_, i) => tierY(i)),
    reachAt: (y) => 4 + 34 * Math.pow(clamp(1 - (y - 6) / (H - 6), 0, 1), 0.9),     // outer radius of the opened tower at height y
  };

  let cutY = -8, manual = false, cutAge = null;
  const rate = opts.cutRate ?? 5, wp = new THREE.Vector3();
  const api = {
    object, radius: close ? 20 : 75, height: close ? 20 : low ? 40 : H, center: new THREE.Vector3(0, close ? 52 : low ? 58 : 84, 0), anchors, style,
    ground: !(standalone && opts.backdrop !== false), groundY: 0,
    // The blade's height in local metres (-8 = bare; the world sets camera height + 20 during the climb; > 216 = done).
    // ageOf(y) (optional): seconds since the blade passed the height y, by the world's own law of the cut; a tier found already cut (a posed
    // frame, a jump) is dated from it. Without it such a tier is dated as if the blade had climbed at opts.cutRate.
    setCut(y, ageOf = null) { manual = true; cutY = y; cutAge = ageOf; },
    // The same as a 0..1 value.
    setProgress(u) { manual = true; cutY = -8 + clamp(u, 0, 1) * (H + 20); },
    getCut: () => cutY,
    // The trunk's tone (1 = as cut): the world lifts it on the climb, when the opened curls throw their light back on it.
    setTone(v) { trunkMat.uniforms.uTone.value = v; },
    update(dt, time, camera) {
      if (standalone) style.update(dt, time, camera);
      if (!manual) cutY = clamp(((time % 46) - 3) * 12, -8, H + 12);           // nobody drives it: play the cut on a loop
      for (let i = 0; i < TIERS; i++) {
        const y = tierY(i);
        if (cutY < y) tierT[i] = 1e6;
        else if (!manual) tierT[i] = time - (cutY - y) / 12;
        else if (tierT[i] > 1e5 || time < tierT[i]) tierT[i] = time - Math.min(cutAge ? cutAge(y) : (cutY - y) / rate, 60);
      }
      trunkMat.uniforms.uCutY.value = cutY > H + 4 ? 1e4 : cutY;
      const tl = time - tierT[LONG_TIER], open = tierT[LONG_TIER] < 1e5 && tl > 0, tr = tl - LONG_T;
      longU.uShow.value = open ? clamp(tl / 0.15, 0, 1) : 0;
      ringR.U.uShow.value = open && tr > 0 ? clamp(tr / 0.15, 0, 1) : 0;
      if (open) {
        const e = clamp(tl / LONG_T, 0, 1), front = longLen * (1 - Math.pow(1 - e, 2.2));
        longR.setFront(front, e >= 1);
        longU.uRollR.value = 1.6 + 5 * (1 - front / longLen);
        if (tr > 0) {                                                  // the roll that rode the long curl's front winds on round the seat
          const eb = clamp(tr / RING_T, 0, 1);
          ringR.setFront(ringR.len * (1 - Math.pow(1 - eb, 1.7)), eb >= 1);
          ringR.U.uRollR.value = 1.6 - 0.9 * eb;
        }
      }
      object.getWorldPosition(wp);
      style.setShadow(shadowSlot, wp.x, wp.z, R_FOOT, anchors.shadowLength, 34, Math.max(cutY, 0), H, 0.93);
    },
    dispose() {},
  };
  api.update(0, 0, null);
  return api;
}
