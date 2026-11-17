// World hollow-of-the-wave. A colour woodblock print of an open sea at dawn that the camera flies into: one Prussian
// blue in three strengths on bare cream paper, a cut indigo line round every form, wave backs ribbed in bands, foam
// ending in solid hooked claws that bear smaller claws and fling round paper dots. After Katsushika Hokusai (1760 to
// 1849): an original place in his manner, copying no single print. Nothing lettered, sealed, signed or bordered.
//
// THE LAWS OF THE METRES FLOWN (flown = u * path.length, handed to hero.setFlown; each a plain function of it and of
// nothing else: no timer, no wall clock, no eye, no lens, no window, no seed's number sets a place or a moment):
//  1 THE WAVE'S RISE (the part's hwRise / waveRise): the wall stands 31 m, 36 m by 187 m flown and 46 m by 290 m; its
//    TAIL alone (the wave's own metres under 190, eased out by 215: the far end that stands over the open sea from the
//    entry) stands 42 m from the first metre and 46 m by 290 m, so the wave's top is 8 degrees over the horizon at 0 m.
//  2 THE LIP'S THROW AND FALL (hwCurl / waveCurl): a section at its own metre w begins to throw its lip when the flown
//    point is 150 m short of it, hangs at its fullest from 70 m short of it until 20 m past it, and has fallen by 70 m
//    past it. So from the trough the lip is seen throwing over ahead, and from 290 m one flies down a formed tube.
//  3 THE LOW WIPE'S PRINTING: buff; storm grey comes over it from 150 to 250 m; rose from 390 to 440 m.
//  4 THE STORM BAND behind the great wave (the palette's storm grey, one flat block all round the horizon, its upper
//    edge CUT in twelve scallops 2.4 degrees deep, no grade in it): it is drawn up from the horizon from 96 to 122 m
//    (15 degrees high at its scallops' feet), stands 17 degrees by 150 m (7 degrees under the top band; on the
//    evening look, whose top band is lower, 11 degrees from 122 m), and is let down behind the horizon again from
//    296 to 340 m.
//  5 THE FAR CONE'S PRINTING: its blocks come onto the paper from the summit down between 306 and 334 m, so it is first
//    whole in the hollow's mouth and never beside the wave; the brown-red block comes onto its flank from 330 to 360 m.
//  6 THE WHEEL'S RISE: the wheel stands up out of the water at its place from 325 to 360 m (from a fiftieth of its size),
//    whole before any of it is in sight.
//  7 THE BOATS' PLACES (BOAT_LAW, BOAT_LAW2, boatAt): each boat's metres ahead of the entry are a table of the metres
//    flown joined by a monotone curve. The pair (and the boats beyond it) lies behind the first hill until 110 m,
//    climbs the second hill's face from 125 to 172 m, is over its crest by 195 m and bears left from 218 m of its own
//    way. THE SECOND PAIR rides the starboard swells 28.6 and 37.4 m right of the entry's axis: 47 and 60 m ahead of
//    the entry at 0 m flown, 76 and 88 m at 45 m, 100 and 104.5 m at 100 m, where we pass them rowing our way.
//  8 THE SPRAY'S SHOWING: a lane of the lip's spray is shown by what throws it, the lip's own curl at the lane's metre
//    (law 2, over nine tenths thrown), inside the one window all lanes share: its metre of route from 12 m behind the
//    metres flown (full from 4 m behind) to 46 m ahead (gone by 62 m). The swells' own dots loop on the clock alone.
//  9 THE PLOVERS: the overtaking file is abeam at 70 m flown and goes 9 m of route for every 7 flown (seen from 13 to
//    178 m flown); the burst leaves the lip from 376 to 384 m (to 392 m on the rare visit) and goes 1.35 to 1.75 m of
//    route for every metre flown. The streaming files and the files into the wheel loop on the clock alone.
// ON THE WORLD'S CLOCK, as loops only: ribs slide up every back and face, claws curl and uncurl in a ripple, dots are
// flung and fall, the wipes breathe, cloud rows drift, plovers and oars beat, the fall's ropes run, the wheel runs in,
// the pines sway, the boats roll and fling spray, the foam veins are drawn up the great wave's face with its ribs.
// THE EYE IS READ FOR INK ONLY, never for a shape, a size, a place or a showing: the silhouette line of the wave's
// sheet, the claws, the wheel, the rock, the cone, the pines, the ropes, the boats and the sea's crests is shaded in each
// surface's own material from the direction to the eye, and every cut line is kept 1.5 pixels wide by the fragment's
// own derivatives; the sky is a dome that turns with the gaze. SPRAY DOTS AND SNOW FLAKES ARE ROUND BY THEIR OWN SHAPE
// (DOT_WIDE, dotGeos): no program of theirs reads the eye, the lens or the view.
// No constant in this file is a function of the camera's lens or of the window. Numbers chosen by looking are said
// where they stand in the world's own terms: metres, or degrees over the horizon from the line.
// THE GAZE is lifted only by points of interest fixed by place, each key written as metres of route over the route's
// length: the sea at the great wave's foot (57 to 147 m), the second pair of boats (12 to 86 m), the wall's top (113 to
// 209 m), the pair of boats at their own place by the metres flown (96 to 214 m), the lip throwing over 95 m ahead (220
// to 299 m), the lip's hanging claws 24 m ahead (262 to 332 m), the roof's crown 46 m ahead (328 to 400 m). THE LINE'S
// HEIGHT (the part's HKN) is 17 m over trough water (7 m over the open sea) to 110 m, 25 m at the first hill's crest
// (122 m), falls to 19 m in the valley at 146 m and is 23.6 m over the boats' hill by 170 m; the gaze there goes from
// 4 degrees over the level at 150 m to 10.6 under it at 200 m. THE CAMERA'S BANK into a turn is eight tenths of the
// engine's own (camera.bank): 5.6 degrees at most past the spit (380 to 440 m).
//
// THE PLACE (the hero's local space is the world's: trough water y 0, open sea y 10, entry course -Z; laws in the part's
// makePlace): 0-47 m THE VALLEY OF TWO SWELLS (crests 12 to 14 m over the open sea, 5 to 7 m above the line, 9.3 to
// 11.8 m off it to port and starboard, full from 8 m ahead of the entry; the starboard one falls from 22 m and is gone
// by 35 m, the port one from 33 m and by 47 m; a row of claws curling in from each, the great wave's top in the V ahead);
// 0-110 m nine swells that differ by place (the part's CRESTS: height, claw length, how many of its hands stand), the
// fan of seven at 35 m, the second pair of yellow boats on the starboard swells, a field of foam lace from 61 to 78 m,
// one hill of water 7.6 m over the open sea to port at 80 m, the first hill's foam pierced with lace and capped in two
// scalloped tiers at 100 to 120 m; 110-205 m two hills of water and the yellow boats; 205-290 m the drop into the
// trough along the wall, three low clawed crests crossing its floor (229, 252, 273 m), foam lace in long islands, the
// lip's spray drifting across; 290-420 m the hollow, the lip's spray falling as printed snow through its first third;
// 390-490 m lee water, the pine spit and its rope fall (on the spit's first mass, at 433 m of route, 11.4 m and more
// right of the line), the red-flanked cone (3,200 m off, 580 m high: 10.3 degrees over the horizon, in the hollow's
// mouth); 452-565 m the way to the wheel: islands of lace on the lee water beside the line, small claws on their rims,
// files of plovers flying on into the wheel's eye, the wave's ridge folded and going down into the water at the wheel's
// foot; the wheel and the exit.
// THE SPIT is a rock in the print's manner: twenty-one rounded masses stacked and leaning (closed forms, moved off the
// line at build until 6.5 m clear, a mass standing more than 6 m over the sea until about 11 m clear, 10.9 m at the least counted; each goes down under
// its own water), a front rank across the way out of the hollow, faces of bare paper or thinned ochre, the shadow side
// an overprint of grey-blue behind a scalloped edge, cleft strokes every 2 m of girth, fissures, step arcs, hatch under
// each overhang, a cut line where masses meet; eleven pines at three sizes (flat pads of pine green on brown-red trunks
// leaning out over the water, one bough over the way at 444 m, 4.6 m above the line), foam claws and lace at its foot.
// THE SKY: bare paper; the low wipe; the storm band; ONE TOP BAND along the top of the dome, its lower edge a slow
// scallop of eight lobes, printed in two flat steps of blue (two blocks), breathing on the world's clock. On the
// evening look the top band comes down to 18 degrees over the horizon (the brief had 12).
// THE CLAWS (the part's clawGeometry: a flat tongue of foam curling to a hooked point, bearing hooked fingers, a solid
// with a ridge, the key line on its outline, the pale blue shadow under its hooking edge), three classes fixed in the
// world: the great crest's fans 3 to 7 m; the lip's hanging claws in the hollow 2 to 5 m, none nearer the flown line
// than 6.0 m; the swells' claws 1.5 to 3 m on crests more than 8 m from the line in plan, no longer than 1.2 m
// within 4 m of it, none reaching within 2.6 m of the line (addClaw), a row on every swell's crest, rows on the
// trough's three crests, hands on the lee's lace; at most TRI.clawNear within 32 m of the line in plan and
// TRI.clawFar beyond it are made. On the two crests of the boats' hill (q 178 and 192) no claw is longer than 1.1 m
// from 18 to 74 m left of the entry's axis, and on the second pair's water (crests q 46 to 106, from 1 to 49 m right of it) none
// longer than 1.1 m, so the hulls are not hidden.
// THE COUNT OF TRIANGLES is bounded by the text (TRI, and SUM after the last mesh): 494,120 at most on any deal.
// LOOKS, dealt at build from ctx.rng (ctx.vary.hour leans the deal): dawn squall | snow morning | evening wind.
// RARE (ctx.vary.rare): at 380 m the whole lip lets go as TRI.burst plovers. Post is flat: the inks are sent out as written.
import * as THREE from 'three';
import { makePath, smoothstep, clamp, lerp } from '../kit/core.js';
import { buildHero, makePrintUniforms, printMaterial, overprint, routeKnots, makePlace, clawGeometry, PRINT_GLSL,
  CLAW_EDGE_GLSL, CLAW_FRAG, BODY_FRAG, WAVE_GLSL, PALETTE, INK, SEA } from '../parts/hollow-of-the-wave.js';

const TAU = Math.PI * 2;

// ---- THE SKY: bare paper, the low wipe streaked level with grain, three rows of paper cloud lobes cut out of it, the
// storm wipe behind the great wave, and one top band in two flat steps of blue.
// A far-plane dome that reads only the view's rotation. uLowA/uLowB/uLowC are the low wipe's three printings
// (already laid over paper) and uLowK their weights by the law of metres (set from the metres flown).
const SKY_VERT = /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`varying vec3 vD;
uniform vec3 uTop1, uTop2, uLowA, uLowB, uLowC, uSeaFar, uStormInk; uniform vec3 uLowK; uniform vec4 uSky; uniform vec2 uStorm;
// uSky: the top band's lower edge (deg), the depth of its first step (deg), cloud bar length, low wipe height (deg)
// uStorm.x: the height (deg) of the storm band behind the great wave, by the metres flown
${PRINT_GLSL}
void main(){
  vec3 d = vD / max(length(vD), 1e-4);
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float az = atan(d.x, -d.z + step(abs(d.x) + abs(d.z), 1e-5));
  float azs = az + .35 * sin(az);                              // the seam of atan lies behind the entry
  float br = .6 * sin(uTime * .21 + az * 2.);
  float fe = max(fwidth(el), 1e-3);
  // the low wipe: three printings laid one over another, each streaked out to paper with hard-edged level streaks
  vec3 low = uLowA * uLowK.x + uLowB * uLowK.y + uLowC * uLowK.z;
  float lv = (el + .5 * br) / max(uSky.w, 1.);
  float streak = hwNoise(vec2(azs * 2.3 + 5., el * 5.5)) * .55 + hwNoise(vec2(azs * 6.1, el * 13. + 9.)) * .45;
  float la = lv * .62 + (streak - .5) * .5 * smoothstep(.25, .9, lv), fl2 = max(fwidth(la), 1e-4);
  float l = 1. - smoothstep(.55 - .7 * fl2, .55 + .7 * fl2, la);
  vec3 col = mix(uPaper, low, l);
  // THE STORM BAND behind the great wave: the palette's storm grey (the key indigo at a third over paper), one flat ink
  // with a CUT edge, as every ink of the print: its top a hard scallop of twelve lobes round the whole horizon (it has no
  // end anywhere), 2.4 degrees deep. Its height is a law of the metres flown (uStorm.x, degrees over the horizon at the
  // lobes' feet): the band is drawn up from the horizon and let down again behind it, never thinned.
  float sh = uStorm.x + 2.4 * abs(sin(az * 6.)) + .4 * br;
  float storm = step(.02, uStorm.x) * (1. - smoothstep(sh - fe, sh + fe, el));
  col = mix(col, uStormInk, storm);
  // cloud rows: paper lobes cut out of the low wipe and of the storm band, a key line under the belly only; they drift along the rows
  float cl = max(l, storm);
  for (int i = 0; i < 3; i++) {
    float fi = float(i), e0 = uSky.w * (.3 + .2 * fi);
    float s = (az + uTime * .0035 * (1. + .3 * fi)) * (9. - 1.5 * fi) / max(uSky.z, .2) + fi * 7.3;
    float id = floor(s), f = fract(s), h = hwHash(id + fi * 31.);
    float on = step(.5, h);
    float wdt = .5 + .4 * hwHash(id * 1.7 + 3.);
    float xx = (f - .5) / (.5 * wdt);
    float nb = floor(2. + 3. * hwHash(id * 2.3 + 1.) + 2. * (uSky.z - 1.));
    float bump = .62 + .38 * abs(sin((xx * .5 + .5) * 3.14159 * nb));
    float top = sqrt(max(1. - xx * xx, 0.)) * bump * (.8 + .5 * h) * 1.9 / max(.5 + .5 * uSky.z, .2);
    float y = el - e0;
    float inside = on * step(abs(xx), 1.) * step(0., y) * (1. - smoothstep(top - fe, top + fe, y));
    float belly = on * step(abs(xx), .985) * (1. - smoothstep(1.2 * fe, 2.2 * fe, abs(y + .4 * fe)));
    col = mix(col, uPaper, inside * cl);
    col = mix(col, uKey, belly * cl * step(el, uSky.w * 1.2));
  }
  // THE TOP WIPE: one band along the top of the dome, its lower edge a slow scallop of eight lobes, in two flat steps
  // (a gradation printed from two blocks). It breathes on the world's clock; nothing stands apart from it.
  float e1 = uSky.x + 3.5 * (1. - abs(sin(az * 4.))) + .8 * br;
  float e2 = uSky.x + uSky.y + 3.5 * (1. - abs(sin(az * 4. + .5))) + .8 * br;
  col = mix(col, uTop1, smoothstep(e1 - fe, e1 + fe, el));
  col = mix(col, uTop2, smoothstep(e2 - fe, e2 + fe, el));
  // under the horizon the dome carries the far water's ink, so no paper ever shows under the sea's ruled edge
  col = mix(col, uSeaFar, 1. - smoothstep(-fe, 0., el + .02));
  gl_FragColor = vec4(col, 1.);
}`;

// ---- THE SEA: one print routine for swells, hills, trough floor, lee water and the far sea.
// aSea = (rib coordinate in band pairs, metres below the governing crest, metres off the line, scallop coordinate m).
// aLace = metres outside the nearest island of foam lace or the rock's foot (under zero inside the foam).
const SEA_VERT = /* glsl */`
attribute vec4 aSea; attribute vec2 aLace, aRt;  // aLace: metres outside the nearest lace island | 1 where broad foam lies; aRt: metre of route abeam, metres right of the line
varying vec3 vW, vN; varying vec4 vS; varying float vL, vH; varying vec2 vRt;
void main(){ vec4 wpos = modelMatrix * vec4(position, 1.); vW = wpos.xyz; vN = normal; vS = aSea; vL = aLace.x; vH = aLace.y; vRt = aRt;
  gl_Position = projectionMatrix * viewMatrix * wpos; }`;
const seaFrag = (place) => /* glsl */`
varying vec3 vW, vN; varying vec4 vS; varying float vL, vH; varying vec2 vRt;
uniform float uSeed; uniform vec2 uP0;
${PRINT_GLSL}
${place.lawGLSL}
void main(){
  // the laws that bend a rib line most (the valley's two swells, the trough's crests, the lee's ripple) are worked here, at the point itself
  vec2 val = seaValley(vW.x - uP0.x, uP0.y - vW.z);
  float xr = vS.x + (val.x + .3 * seaTrough(vRt.x, vRt.y) + seaRipple(vRt.x, vRt.y)) / .7;
  vec3 ddx = dFdx(vW), ddy = dFdy(vW);
  float pxm = sqrt(max(min(dot(ddx, ddx), dot(ddy, ddy)), 1e-10));
  vec3 n = vN / max(length(vN), 1e-4);
  float x = xr - 1.3 * uTime, f = fract(x), fw = clamp(fwidth(xr), 1e-4, 1.);
  float e = min(vS.y, val.y), fe = max(fwidth(e), 1e-4);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  float ndv = abs(dot(n, V)), fn = fwidth(ndv);
  // ribs: cut line, the slip, dark band, mid band; steep faces carry more dark, backs more mid
  float duty = mix(.74, .36, smoothstep(.86, .985, n.y));
  float kl = smoothstep(0., fw, f) * (1. - smoothstep(.085, .085 + fw, f));
  float slip = smoothstep(.085, .085 + fw, f) * (1. - smoothstep(.12, .12 + fw, f));
  float dk = smoothstep(.12, .12 + fw, f) * (1. - smoothstep(duty, duty + fw, f));
  vec3 mid = hwGrain(uMid, vS.w, xr * .7, fw * .7), dark = hwGrain(uDark, vS.w, xr * .7, fw * .7);
  vec3 col = mix(mid, dark, dk); col = mix(col, uPaper, slip); col = mix(col, uKey, kl);
  vec3 avg = mix(uMid, uDark, duty - .12) * .9 + uKey * .075 + uPaper * .025;
  col = mix(col, avg, smoothstep(.22, .5, fw));
  // far water: hard-edged level lanes of pale blue that widen with the metres off the line until all is pale
  float far = smoothstep(150., 1100., vS.z), ln = xr * .31, fl = clamp(fwidth(ln), 1e-4, 1.), lf = fract(ln);
  float pl = smoothstep(0., fl, lf) * (1. - smoothstep(far * 1.02, far * 1.02 + fl, lf));
  col = mix(col, uPale, mix(pl, far, smoothstep(.3, .6, fl)) * step(1e-3, far));
  // foam: bare paper to a scalloped edge, the cut line under it, the one printed shadow (pale blue)
  float sc = .3 + .6 * abs(sin(vS.w * .83 + uSeed + 1.7 * sin(vS.w * .19)));
  float ef = e - sc;
  col = mix(col, uPale, 1. - smoothstep(.4 - fe, .4 + fe, ef - .14));
  col = mix(col, uKey, hwLine(max(ef, 0.), .14, fe, 1.));
  col = mix(col, uPaper, 1. - smoothstep(-fe, fe, ef));
  // FOAM LACE (the trough's long islands, the water at the rock's foot): bare paper to a scalloped edge with its cut line
  // and its pale shadow, pierced by scattered round holes that show pale blue; the holes close with distance
  float lz = vL - (.25 + .5 * abs(sin(vS.w * 1.3 + 2.1 * sin(vS.w * .23 + uSeed)))), fl2 = max(fwidth(vL), 1e-4), deep = smoothstep(.3, .55, -lz);
  col = mix(col, uPale, 1. - smoothstep(.45 - fl2, .45 + fl2, lz - .12));
  col = mix(col, uKey, hwLine(max(lz, 0.), .12, fl2, 1.));
  vec2 hp = vW.xz * 1.5; hp.x += .5 * mod(floor(hp.y), 2.); vec2 hc = floor(hp), hf = fract(hp) - .5;
  float hw = max(fwidth(hp.x) + fwidth(hp.y), 1e-4) * .7, hh = hwHash(hc.x * 7.31 + hc.y * 13.7), hd = length(hf) - (.1 + .2 * hh) * step(.3, hh);
  vec3 lc = mix(uPaper, uPale, (1. - smoothstep(-hw, hw, hd)) * deep * (1. - smoothstep(.25, .6, hw)));
  col = mix(col, lc, 1. - smoothstep(-fl2, fl2, lz));
  // THE BROAD FOAM (vH) of the open sea to 140 m of route (the first hill's crest, the valley's two swells, the high hill)
  // is no flat sheet of paper: it is laid in three scalloped tiers (the foam's own edge and two more nearer the crest),
  // each with its cut line and the one printed shadow (pale blue) under its edge, and pierced with the lace's round
  // holes at twice the lace's measure, which close with distance. The boats' hill, beyond 140 m, keeps its own foam:
  // one cap pierced like the lace.
  float t1 = step(vRt.x, 140.), inF = vH * t1 * (1. - smoothstep(-fe, fe, ef)) * smoothstep(-fl2, fl2, lz);
  col = mix(col, uPale, (1. - smoothstep(-hw, hw, hd)) * (1. - smoothstep(.25, .6, hw)) * vH * (1. - t1) * smoothstep(.12, .3, -ef) * smoothstep(-fl2, fl2, lz));
  for (int k = 1; k < 3; k++) { float fk = float(k), tk = .16 * fk - .06 + (.05 + .045 * fk) * abs(sin(vS.w * (1.7 - .33 * fk) + 1.9 * fk + uSeed)), ek = e - tk, on = inF * smoothstep(-fe, fe, ek) * step(tk + .1, sc);      // a tier's edge lies tk metres under the crest, inside the foam's own edge
    col = mix(col, uPale, (1. - smoothstep(.2 - fe, .2 + fe, ek)) * on);
    col = mix(col, uKey, hwLine(max(ek, 0.), .07, fe, 1.) * on); }
  vec2 gp = vW.xz * .62; gp.x += .5 * mod(floor(gp.y), 2.); vec2 gc = floor(gp), gf = fract(gp) - .5;
  float gw = max(fwidth(gp.x) + fwidth(gp.y), 1e-4) * .7, gh = hwHash(gc.x * 5.17 + gc.y * 11.3 + 2.), gd = length(gf) - (.15 + .2 * gh) * step(.35, gh);
  col = mix(col, uPale, (1. - smoothstep(-gw, gw, gd)) * (1. - smoothstep(.25, .6, gw)) * inF * smoothstep(.1, .25, -ef));
  // silhouette line of the crest's dome
  col = mix(col, uKey, hwRim(ndv, 10., .14, pxm, fn) * (1. - smoothstep(1.6, 2.4, e)));
  gl_FragColor = vec4(col, 1.);
}`;

// columns of the sea in metres right of the line: dense by the line, four wide skirt columns to the horizon each side
function seaColumns() {
  const as = [0]; let a = 0;
  while (a > -128) { a -= 1.5 + 4.5 * smoothstep(12, 100, -a); as.unshift(Math.max(a, -128)); }
  a = 0; while (a < 100) { a += 1.5 + 4.5 * smoothstep(12, 100, a); as.push(Math.min(a, 100)); }
  return [-3200, -700, -280, -165, ...as, 135, 260, 700, 3200];
}
// The sea as one mesh laid in the route's own frame (rows by the metre of route, columns by metres off the line).
// Behind the entry it is low sea and nothing else. Folded skirt rows inside the bends lie flat on one another in
// one ink, so no seam shows.
async function buildSea(ctx, path, place, U, seedPhase, footAt) {
  const L = path.length, as = seaColumns(), nc = as.length, ms = [];
  for (let m = -340; m < -20; m += 4) ms.push(m);
  for (let m = -20; m < 300; m += 1.5) ms.push(m);
  for (let m = 300; m < 486; m += 2.2) ms.push(m);
  for (let m = 486; m <= L + 150; m += 3.5) ms.push(m);
  const nr = ms.length, pos = new Float32Array(nr * nc * 3), sea = new Float32Array(nr * nc * 4), lace = new Float32Array((nr * nc) * 2), rt = new Float32Array(nr * nc * 2), o = {}, w = [0, 0];
  for (let i = 0; i < nr; i++) { const m = ms[i];
    for (let j = 0; j < nc; j++) { const a = as[j], k = i * nc + j, skirt = a < -129 || a > 101;
      place.toWorld(m, a, w); let y = place.seaY(m, a, w[0], w[1], o); if (skirt) { y = SEA; o.foam = o.foamNoV = 99; o.lace = 99; o.tc = 0; o.vy = 0; o.rip = 0; }
      rt[k * 2] = m; rt[k * 2 + 1] = a;
      lace[k * 2] = Math.max(Math.min(o.lace, m > 392 && m < 520 && a > -12 && a < 70 ? footAt(w[0], y, w[1]) - 1.9 : 99, 8), -4); lace[k * 2 + 1] = skirt ? 0 : o.hill;
      pos[k * 3] = w[0]; pos[k * 3 + 1] = y; pos[k * 3 + 2] = w[1];
      sea[k * 4] = (y - o.tc - o.vy - o.rip - SEA) / 0.7 + o.q / 14 + o.lane * (skirt ? 0 : a / 2.6); sea[k * 4 + 1] = Math.min(o.foamNoV, 30);      // the rest of the rib coordinate; the valley, the trough's crests and the ripple are added in the fragment program
      sea[k * 4 + 2] = Math.max(Math.abs(a), 150 + (m - L) * 6.4, 150 - m * 2.8); sea[k * 4 + 3] = o.X + 0.6 * o.M; }
    if (i % 24 === 23) await ctx.yield(); }
  // THE RIBS RUN AS DRAWN LINES: from 190 m of route on (in full from 204 m), the rib coordinate of each vertex is taken
  // with its neighbours two columns and two rows to every side (weights 1 2 3 2 1), so that a peaked crest bends a rib
  // over four cells of the mesh instead of breaking it at one; over the trough (196 to 300 m of route, in full from 210
  // to 286 m) it is taken so three times more, which rounds the corner the ribs turn where the floor meets the wave's
  // foot. The water's own height is not touched.
  { const j0 = 4, j1 = nc - 5, K = [1, 2, 3, 2, 1], tmp = new Float32Array(nr * nc);
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < nr; i++) for (let j = j0; j <= j1; j++) { let t = 0; for (let d = -2; d <= 2; d++) t += K[d + 2] * sea[(i * nc + clamp(j + d, j0, j1)) * 4]; tmp[i * nc + j] = t / 9; }
      await ctx.yield();
      for (let i = 0; i < nr; i++) { const wgt = pass ? smoothstep(196, 210, ms[i]) * (1 - smoothstep(286, 300, ms[i])) : smoothstep(190, 204, ms[i]); if (wgt <= 0) continue;
        for (let j = j0; j <= j1; j++) { let t = 0; for (let d = -2; d <= 2; d++) t += K[d + 2] * tmp[clamp(i + d, 0, nr - 1) * nc + j]; sea[(i * nc + j) * 4] = lerp(sea[(i * nc + j) * 4], t / 9, wgt); } }
      await ctx.yield(); } }
  const idx = new Uint32Array((nr - 1) * (nc - 1) * 6); let q = 0;
  for (let i = 0; i < nr - 1; i++) { for (let j = 0; j < nc - 1; j++) { const a = i * nc + j, b = a + nc; idx[q++] = a; idx[q++] = a + 1; idx[q++] = b; idx[q++] = a + 1; idx[q++] = b + 1; idx[q++] = b; }
    if (i % 100 === 99) await ctx.yield(); }
  // normals by central differences on the grid (in short steps)
  const nor = new Float32Array(nr * nc * 3);
  for (let i = 0; i < nr; i++) { const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nr - 1);
    for (let j = 0; j < nc; j++) { const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nc - 1), A = (i1 * nc + j) * 3, B = (i0 * nc + j) * 3, C = (i * nc + j1) * 3, D = (i * nc + j0) * 3;
      const ux = pos[A] - pos[B], uy = pos[A + 1] - pos[B + 1], uz = pos[A + 2] - pos[B + 2], vx = pos[C] - pos[D], vy = pos[C + 1] - pos[D + 1], vz = pos[C + 2] - pos[D + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const nl = Math.hypot(nx, ny, nz) || 1, k = (i * nc + j) * 3; nor[k] = nx / nl; nor[k + 1] = ny / nl; nor[k + 2] = nz / nl; }
    if (i % 60 === 59) await ctx.yield(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aSea', new THREE.BufferAttribute(sea, 4)); g.setAttribute('aLace', new THREE.BufferAttribute(lace, 2)); g.setAttribute('aRt', new THREE.BufferAttribute(rt, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = new THREE.ShaderMaterial({ uniforms: { ...U, uSeed: { value: seedPhase }, uP0: { value: new THREE.Vector2(place.p0.x, place.p0.z) } }, vertexShader: SEA_VERT, fragmentShader: seaFrag(place) });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'sea';
  return mesh;
}

export default {
  id: 'hollow-of-the-wave',
  name: 'The Sea Grows Claws',
  category: 'artists',
  placeKind: 'ocean',
  after: 'Katsushika Hokusai, 1760 to 1849',
  weirdness: 0.5,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), density = clamp(ctx.vary?.density ?? 1, 0.7, 1.3);
    // THE LOOK, dealt at build (the viewer's hour leans the deal; nothing else chooses it)
    const hour = ctx.vary?.hour || 'any', deal = rng();
    const look = hour === 'golden' || hour === 'night' ? 'evening' : hour === 'dawn' ? 'squall' : deal < 0.4 ? 'squall' : deal < 0.7 ? 'snow' : 'evening';
    const rare = !!ctx.vary?.rare;
    // THE COUNT OF TRIANGLES, BOUND BY THE TEXT (no deal over 500,000). Every count that a draw scales (the look, the rare
    // burst, the viewer's density, a seed's lanes and rows) is cut at a greatest value written here; a list that is full takes
    // no more (claws beyond the count are thinned evenly, a dot goes to the next smaller class or is not made). The sum of
    // these greatest values and of the parts that never change is written out under SUM, after the last mesh.
    const TRI = { clawNear: 1800, clawFar: 2000,          // swell claws: 51 faces within 32 m of the line in plan, 30 beyond
      dotBall: 280, dotGrain: 700, dotSpeck: 925,         // spray and claw dots: 120, 20 and 8 faces
      snowBall: 110, snowGrain: 560, snowSpeck: 700,      // snow flakes (the snow morning): the same three solids
      burst: 500, files: 27, cranes: 40, wheel: 6 };      // plovers: the rare burst, the streaming files of nine, the evening's cranes, the files of nine into the wheel
    const seedPhase = rng.range(0, TAU);
    const scene = new THREE.Scene();
    const path = makePath(routeKnots()), L = path.length;
    const place = makePlace(path);
    const U = makePrintUniforms(PALETTE);
    const col = (i) => new THREE.Color(PALETTE[i]);
    const paper = col(0), keyInk = col(1), dark = col(2), mid = col(3), pale = col(4), red = col(5), yellow = col(6);
    await ctx.yield();
    const hero = await buildHero(ctx, { path, uniforms: U, detail, apron: false, sky: false });
    scene.add(hero.object);
    await ctx.yield();

    // ---- sky: the two wipes and the cloud rows; the low wipe's three printings by the look
    const buff = overprint(paper, yellow, 0.5), grey = overprint(paper, keyInk, 1 / 3), rose = overprint(paper, red, 1 / 6);
    const lows = look === 'snow' ? [grey, grey, buff] : look === 'evening' ? [rose, grey, buff] : [buff, grey, rose];
    const skyU = { ...U, uTop1: { value: look === 'evening' ? mid.clone() : pale.clone() }, uTop2: { value: look === 'evening' ? dark.clone() : mid.clone() }, uStormInk: { value: grey.clone() }, uStorm: { value: new THREE.Vector2(0, 0) }, uLowA: { value: lows[0] }, uLowB: { value: lows[1] }, uLowC: { value: lows[2] },
      uLowK: { value: new THREE.Vector3(1, 0, 0) }, uSeaFar: { value: pale.clone() },
      uSky: { value: new THREE.Vector4(look === 'evening' ? 18 : 24, 5.5, look === 'evening' ? 2.6 : 1, 9) } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'paper-sky'; scene.add(sky);
    // the low wipe by the law of metres: first printing, the second entering 150..250 m, the third from 390 m;
    // the storm band behind the wave by the same law: drawn up from the horizon from 96 to 122 m flown (15 degrees high at
    // its scallops' feet then), 7 degrees under the top band's edge by 150 m and never over 21 (17 degrees on the squall and
    // the snow morning; 11 on the evening look, from 122 m), let down behind the horizon again from 296 to 340 m.
    const stormTop = Math.min(21, skyU.uSky.value.x - 7);
    const setWipe = (flown) => { const b = smoothstep(150, 250, flown), c = smoothstep(390, 440, flown); skyU.uLowK.value.set((1 - b) * (1 - c), b * (1 - c), c);
      skyU.uStorm.value.set((Math.min(15, stormTop) * smoothstep(96, 122, flown) + Math.max(0, stormTop - 15) * smoothstep(122, 150, flown)) * (1 - smoothstep(296, 340, flown)), 0); };
    await ctx.yield();


    const ticks = [];
    // THE WHEEL ROLLS UP by the law of metres: the wave's far end lies in the water until 325 m flown and stands whole by 360 m, behind the hollow's wall, before any of it can be seen from the line (first in sight near 380 m)
    { const wheelG = hero.object.getObjectByName('wheel'), c0 = wheelG.position.clone(), footY = SEA - 1;
      ticks.push((dt, time, camera, u, flown) => { const s = 0.02 + 0.98 * smoothstep(325, 360, flown); wheelG.scale.setScalar(s); wheelG.position.set(c0.x, footY + (c0.y - footY) * s, c0.z); }); }

    // ---- SWELL CLAWS: flat tongues of foam bearing smaller hooked fingers, in rows of hands on every crest (one
    // geometry in two weights, instanced). Each stands where its crest stands, its flat turned to the course so that
    // the comer sees the tongue and not its edge. THE SIZE CLASS IS FIXED BY PLACE: 1.5 to 3 m on crests more than
    // 8 m from the line in plan, at most 1.2 m within 4 m of it, growing between the two; and every claw's length is
    // bounded at build by the metres from its root to the line (root less length never under 2.6 m).
    const CLAW_VERT = /* glsl */`
attribute vec4 aRoot, aAim;            // root xyz + length m | yaw of the hook, lean along the crest, pitch, phase
attribute vec3 aHook;
uniform float uGrow;
varying vec3 vB; varying vec2 vS;
${PRINT_GLSL}
${CLAW_EDGE_GLSL}
void main(){
  vec3 Hd = vec3(cos(aAim.x), 0., sin(aAim.x)), Sd = vec3(-Hd.z, 0., Hd.x), Up = vec3(0., 1., 0.);
  float cp = cos(aAim.z), sp = sin(aAim.z), cl = cos(aAim.y), sl = sin(aAim.y);
  vec3 T0 = Up * cp + Hd * sp, X0 = Hd * cp - Up * sp;
  vec3 T1 = T0 * cl + Sd * sl, S1 = Sd * cl - T0 * sl;
  float t = clamp(aHook.x, 0., 1.), ang = .32 * sin(uTime * 1.3 + aAim.w + dot(aRoot.xz, vec2(.21, .13))) * t * sqrt(t);
  float ca = cos(ang), sa = sin(ang);
  vec3 p = vec3(position.x * ca + position.y * sa, -position.x * sa + position.y * ca, position.z);
  float len = aRoot.w * uGrow;
  vec4 wpos = modelMatrix * vec4(aRoot.xyz + (X0 * p.x + T1 * p.y + S1 * p.z) * len, 1.);
  vec3 Vw = cameraPosition - wpos.xyz;
  vec3 Vl = vec3(dot(Vw, X0), dot(Vw, T1), dot(Vw, S1));
  vB = vec3(hwClawEdge(vec3(Vl.x * ca - Vl.y * sa, Vl.x * sa + Vl.y * ca, Vl.z), normal, aHook.z, position.z, aHook.y * len), 0.);
  vS = vec2(aHook.z, aHook.x);
  gl_Position = projectionMatrix * viewMatrix * wpos;
}`;
    const clawList = [];                 // { x, y, z, len, yaw, lean, pitch } for the dots and the count of clear air
    const addClaw = (x, y, z, len, yaw, lean, pitch) => { const d = path.distanceTo(x, y, z); len = Math.min(len, d - 2.6); if (len < 0.35) return false;
      clawList.push({ x, y, z, len, yaw, lean, pitch, ph: 0, seven: 0 }); return true; };
    { const crestRng = rng.fork('swell-claws'), o = {}, P0 = place.p0;
      const mOfQ = (Q, X) => Q + 0.22 * X - 5 * (Math.sin(X * 0.023 + 1.1) - Math.sin(1.1));
      const crests = [10, 22, 34, 46, 58, 70, 82, 94, 106, 120, 130, 142, 154, 166, 178, 192];
      const capAt = (a) => lerp(1.2, 3, smoothstep(4, 8, Math.abs(a)));        // the size class by the metres off the line in plan
      // THE CRESTS DIFFER BY PLACE (fix round 3; the place's CRESTS): a crest's claws are longer or shorter than the class and
      // stand thick or thin by its own row of the table; none stands on the valley's two swells (they bear their own rows)
      for (const Q of crests) { await ctx.yield(); let X = -122 + crestRng.range(0, 2); const hill = Q === 120 || Q === 192, thin = Q > 106 ? (hill ? 1.5 : 2.6) : 1, ck = Q <= 106 ? place.crestOf(Math.round((Q - 10) / 12)) : [1, 1, 1];
        while (X < 97) { const n = 4 + Math.floor(crestRng() * 2.6), sp = crestRng.range(0.41, 0.58) * thin, Lh = crestRng.range(1.5, 3) * ck[1], fwd = crestRng.range(0.2, 0.55), side = crestRng() < 0.82 ? Math.PI : 0, stands = crestRng() < ck[2];
          for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - 0.5 : 0, Xc = X + i * sp, M = mOfQ(Q, Xc), r1 = crestRng(), r2 = crestRng();
            if (M < 5 || !stands) continue;               // nothing but low sea at and behind the entry
            const Mr = M - 0.5, x = P0.x + Xc, z = P0.z - Mr, y = place.seaY(Mr, Xc, x, z, o), A = hill || Q < 100 ? y - SEA : o.amp * 1.5; if (A < 1.3 || (!hill && o.amp < 1.1) || o.vy > 1) continue;
            // THE BOATS' WATER (fix round 2): on the two crests the boats ride over (178 and 192), from 18 to 74 m left of the entry's axis, the claws are of the small class (no longer than 1.1 m), so that hull and rowers stand over the foam they plough
            // THE SECOND BOATS' WATER (fix round 3): on the crests 46 to 106, from 1 to 49 m right of the entry's axis, the same small class
            const cap = Math.min(capAt(place.routeOf(x, z).a), 0.8 * A + 0.5, Q >= 178 ? lerp(1.1, 3, smoothstep(28, 34, Math.abs(Xc + 46))) : Q >= 46 && Q <= 106 ? lerp(1.1, 3, smoothstep(24, 30, Math.abs(Xc - 25))) : 3), len = Math.max(Math.min(1.5 * ck[1], cap), Math.min(cap, Lh * (1 - 0.42 * Math.pow(Math.abs(2 * u), 1.5)))) * (cap < 1.5 ? 0.6 + 0.4 * r1 : 1);
            addClaw(x, y - 0.1, z, len, side + (r2 - 0.5) * 0.5, (side ? -1 : 1) * (fwd + (r1 - 0.5) * 0.2), (side ? -1 : 1) * u * 0.9 + 0.2); }
          X += n * sp + crestRng.range(0.1, 0.45) * thin; } }
      // THE VALLEY'S TWO SWELLS (fix round 3): a row of hands along each crest, hooking in over the valley toward the line and
      // leaning over it, 2 to 3 m (the class of crests more than 8 m from the line),;
      // every length bounded by addClaw (root less length never under 2.6 m from the line)
      for (const V of place.VALLEY) { const sd = V[0]; let M = V[6] + 2.2 + crestRng.range(0, 0.6);
        while (M < V[9] - 1.5) { const n = 3 + Math.floor(crestRng() * 2.6), sp = crestRng.range(0.46, 0.66), Lh = crestRng.range(2, 3), lean0 = crestRng.range(-0.3, 0.3);
          for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - 0.5 : 0, Mc = M + i * sp, xc = V[1] + V[2] * Math.sin(V[3] * Mc + V[4]), r1 = crestRng(), r2 = crestRng();
            const X = sd * xc, x = P0.x + X, z = P0.z - Mc, y = place.seaY(Mc, X, x, z, o); if (o.vy < 3.2) continue;
            const len = Math.min(3, Lh * (1 - 0.3 * Math.pow(Math.abs(2 * u), 1.5))) * Math.min(1, o.vy / 9);
            addClaw(x, y - 0.12, z, Math.max(len, 1.1), (sd < 0 ? 0 : Math.PI) + (r2 - 0.5) * 0.5, lean0 + u * 0.9, 0.45 + 0.4 * r1); }
          M += n * sp + crestRng.range(0.15, 0.6); } }
      // THE HIGH HILL's own hand: nine claws on its top, and the first hill's foam (117 m ahead of the entry at the
      // axis): a thin row of small hands across the foam under and beside the line
      { const H = place.HIGH; for (let i = 0; i < 9; i++) { const u = i / 8 - 0.5, X = H.X + u * 4.4, M = H.M - 0.4, x = P0.x + X, z = P0.z - M, y = place.seaY(M, X, x, z, o);
          addClaw(x, y - 0.15, z, 3 - 0.9 * Math.abs(2 * u), Math.PI + u * 0.4, -0.25, -u * 1.5 + 0.15); }
        for (const Q of [117]) { let X = -64 + crestRng.range(0, 3);
          while (X < 44) { const n = 2 + Math.floor(crestRng() * 2.4), sp = crestRng.range(0.5, 0.8), Lh = crestRng.range(1.1, 2.1), fwd = crestRng.range(0.2, 0.5), side = crestRng() < 0.7 ? Math.PI : 0;
            for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - 0.5 : 0, Xc = X + i * sp, M = mOfQ(Q, Xc), x = P0.x + Xc, z = P0.z - M, y = place.seaY(M, Xc, x, z, o), r1 = crestRng();
              if (y - SEA < 3.5) continue;
              addClaw(x, y - 0.1, z, Math.min(capAt(Xc), Lh * (1 - 0.3 * Math.abs(2 * u))) * (0.7 + 0.3 * r1), side + (r1 - 0.5) * 0.5, (side ? -1 : 1) * fwd, (side ? -1 : 1) * u * 0.9 + 0.2); }
            X += n * sp + crestRng.range(1.6, 3.4); } } }
      // the fan of seven on the horn at 35 m: 2.4 m claws, the nearest tip 3 m right of the line
      { const H = place.HORN, Q = 34;
        for (let i = 0; i < 7; i++) { const u = i / 6 - 0.5, Xc = H.X + u * 2.2, M = mOfQ(Q, Xc), x = P0.x + Xc, z = P0.z - M, y = place.seaY(M, Xc, x, z, o);
          if (addClaw(x, y - 0.15, z, 2.4 - 0.5 * Math.abs(u), Math.PI + u * 0.3, -0.3, -u * 1.5 + 0.15)) clawList[clawList.length - 1].seven = 1; } }
      // the seaward hill's crest, left of the trough: claws hooking toward the trough
      for (let m = 222; m < 346; m += crestRng.range(2.2, 3.6) / density) { const n = 3 + Math.floor(crestRng() * 2.6), lean0 = crestRng.range(-0.25, 0.25);
        for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - 0.5 : 0, mm = m + u * 1.8, w = place.toWorld(mm, -68), y = place.seaY(mm, -68, w[0], w[1], o), tg = path.tangentAtDist(mm, new THREE.Vector3());
          const r1 = crestRng(); if (y - SEA < 2.5) continue;
          addClaw(w[0], y - 0.12, w[1], Math.max(1.5, Math.min(3, 0.75 + 0.3 * (y - SEA)) * (0.62 + 0.38 * r1)), Math.atan2(tg.x, -tg.z) + (crestRng() - 0.5) * 0.6, u * 1.1 + lean0, 0.15 + 0.4 * crestRng()); } }
      // THE TROUGH'S OWN CRESTS (fix round 2): rows of hands on the three low crests that cross the floor ahead of the line
      // (the place's TROUGH_CRESTS, crest lines m + 0.45 a), in the same size classes by the metres off the line in plan
      { const T3 = new THREE.Vector3();
        for (const [C0] of place.TROUGH_CRESTS) { let a = -57 + crestRng.range(0, 2);
          while (a < 15) { const n = 4 + Math.floor(crestRng() * 2.6), sp = crestRng.range(0.5, 0.72), Lh = crestRng.range(1.4, 2.6), fwd = crestRng.range(0.2, 0.5);
            for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - 0.5 : 0, ac = a + i * sp, mm = C0 - 0.45 * ac - 0.4, w = place.toWorld(mm, ac), y = place.seaY(mm, ac, w[0], w[1], o), r1 = crestRng(), r2 = crestRng();
              const A = y - place.seaAt(mm - 6, ac); if (A < 1.1) continue;
              const tg = path.tangentAtDist(mm, T3), cap = Math.min(capAt(ac), 0.8 * A + 0.5), len = Math.max(Math.min(1.3, cap), Math.min(cap, Lh * (1 - 0.42 * Math.pow(Math.abs(2 * u), 1.5)))) * (cap < 1.5 ? 0.6 + 0.4 * r1 : 1);
              addClaw(w[0], y - 0.1, w[1], len, Math.atan2(tg.x, -tg.z) + Math.PI + (r2 - 0.5) * 0.5, -(fwd + (r1 - 0.5) * 0.2), -u * 0.9 + 0.2); }
            a += n * sp + crestRng.range(0.3, 1.2); } } }
      await ctx.yield();
    }

    // ---- THE LEE SPIT: rock cut as a print's rock. A few great rounded masses, stacked and leaning, right of the line
    // from 424 to 493 m, in the room between the line and the great wave's foot; 29 m high at its root, 5 m at its point.
    // Each mass is one closed-form solid (a leaning rounded block with slow lumps); its inks are FLAT BLOCKS FIXED IN THE
    // WORLD: a face of bare paper or of the palette's yellow thinned to a half (ochre), a shadow side in grey-blue (pale
    // blue and a little key indigo over the face), parted by a cut scalloped edge that lies where the surface turns from
    // a direction fixed at build (uBlockDir: no light, no eye). KEY LINES follow the form: long cleft strokes down the
    // mass, swelling 1 to 3 and thinning to points, in broken runs 2 m apart, a thin fissure stroke between every two; short arcs round it (steps); a hatch of
    // short strokes under every overhang and in patches of the shadow; the cut line where one mass meets another (an
    // authored edge coordinate: metres to the nearest other mass); the silhouette line (hwRim).
    const ROCK_VERT = /* glsl */`
attribute vec4 aRock; attribute vec2 aRock2;   // aRock: girth coordinate in clefts, metres down from the crown, cleft count + the mass's seed in 32nds, metres per cleft (negative: ochre face)
varying vec3 vW, vN; varying vec4 vR; varying vec2 vR2;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal; vR = aRock; vR2 = aRock2; gl_Position = projectionMatrix * viewMatrix * w; }`;
    const ROCK_FRAG = /* glsl */`
varying vec3 vW, vN; varying vec4 vR; varying vec2 vR2;
uniform vec3 uBlockDir, uOchre, uShade; uniform float uSnowy;
${PRINT_GLSL}
void main(){
  vec3 ddx = dFdx(vW), ddy = dFdy(vW); float pxm = sqrt(max(min(dot(ddx, ddx), dot(ddy, ddy)), 1e-10));
  vec3 n = vN / max(length(vN), 1e-4), V = cameraPosition - vW; V /= max(length(V), 1e-4);
  float ndv = abs(dot(n, V)), fn = fwidth(ndv);
  float nc = floor(vR.z + .01), sd = floor(fract(vR.z + .01) * 32.), perM = max(abs(vR.w), .05), x = vR.x, v = vR.y;
  float fx = clamp(fwidth(x), 1e-4, 1.), fv = max(fwidth(v), 1e-4), fm = fx * perM, fe = fwidth(vR2.x);
  // the two blocks: face and shadow side, a cut scalloped edge between them; every underside is shadow
  float sh = min(dot(n, uBlockDir) + .1 * sin(v * 1.1 + sd) + .06 * sin(x * 2.1 + sd), n.y + .3), fsh = max(fwidth(sh), 1e-4);
  float shade = 1. - smoothstep(-fsh, fsh, sh);
  vec3 col = mix(mix(uPaper, uOchre, step(vR.w, 0.)), uShade, shade);
  col = mix(col, hwGrain(col, v, x * perM, fm), max(shade, step(vR.w, 0.)));           // paper carries no grain
  // snow morning: the crown of every mass is capped in bare paper to a scalloped edge
  float cap = uSnowy * smoothstep(-fn - .01, fn + .01, n.y - .62 - .07 * sin(x * 3.1 + sd));
  col = mix(col, uPaper, cap);
  // cleft strokes: one to a cleft, in broken runs down the mass
  float c = mod(floor(x), nc), f = fract(x) - .5, h1 = hwHash(c * 1.31 + sd), h2 = hwHash(c * 2.17 + sd + 3.);
  float tv = fract((v + 11. * h1) / (7. + 6. * h2)) / .74;
  float wS = .2 * sqrt(max(sin(3.14159 * min(tv, 1.)), 0.)) * step(tv, 1.);
  float dS = abs(f - .13 * sin(v * .5 + h1 * 6.283) - .05 * sin(v * 1.9 + c)) * perM, Wc = max(wS, 1.5 * fm);
  float cleft = (1. - smoothstep(Wc - .6 * fm, Wc + .6 * fm, dS)) * step(.07, wS) * smoothstep(.55, 1.1, perM) * (1. - smoothstep(.25, .5, fx));
  // fissures: one thin stroke between every two clefts, in short runs, thinning to points; left out where a pixel is wider than the stroke
  float f2 = fract(x + .5) - .5, c2 = floor(x + .5), g1 = hwHash(c2 * 1.93 + sd + 11.), g2 = hwHash(c2 * 3.1 + sd + 5.);
  float tf = fract((v + 9. * g1) / (3.2 + 3. * g2)) / .6, wF = .075 * sqrt(max(sin(3.14159 * min(tf, 1.)), 0.)) * step(tf, 1.);
  float dF = abs(f2 - .16 * sin(v * .8 + g1 * 6.283)) * perM;
  float fis = (1. - smoothstep(wF - .6 * fm, wF + .6 * fm, dF)) * step(.03, wF) * smoothstep(.9, 1.5, perM) * (1. - smoothstep(.035, .075, fm));
  // steps: short arcs round the mass
  float sv = v / 3.3 + .4 * sd, cs = floor(sv), h3 = hwHash(cs * 1.7 + sd * 1.3), run = .2 + .3 * hwHash(cs + 5. + sd);
  float ts = fract(x / nc + h3) / run, wT = .16 * sqrt(max(sin(3.14159 * min(ts, 1.)), 0.)) * step(ts, 1.);
  float dT = abs(fract(sv) - .5 - .12 * sin(x * 1.3 + cs)) * 3.3, Wt = max(wT, 1.5 * fv);
  float arc = (1. - smoothstep(Wt - .6 * fv, Wt + .6 * fv, dT)) * step(.06, wT) * (1. - smoothstep(.6, 1.2, fv));
  // hatch: short strokes under every overhang, and in patches of the shadow side
  float hx = x * 6., hc = floor(hx), hfw = clamp(fwidth(hx), 1e-4, 1.);
  float under = 1. - smoothstep(-.34, -.08, n.y), ptch = shade * step(.74, hwHash(floor(v / 2.6 + h1) + c * 3.7 + sd));
  float hatch = (1. - smoothstep(.14, .14 + hfw, abs(fract(hx) - .5))) * step(fract(v / 1.5 + hwHash(hc + sd)), .6) * (1. - smoothstep(.1, .24, hfw)) * max(under, ptch);
  col = mix(col, uKey, max(max(max(cleft, fis), arc) * (1. - cap), hatch));
  col = mix(col, uKey, hwLine(vR2.x, .16, fe, 4.));                     // the cut line where a mass meets its neighbour
  col = mix(col, uKey, hwRim(ndv, 3.5, .16, pxm, fn));                  // the silhouette line
  gl_FragColor = vec4(col, 1.);
}`;
    const rockMasses = [];                // every mass of the spit as its closed form: for the pines, the fall, the sea's lace and the count
    const rockGeo = { pos: [], nor: [], rk: [], rk2: [], idx: [] };
    { const sr = rng.fork('spit'), T = new THREE.Vector3(), PW = 3, q = 2 / PW, o3 = [0, 0, 0], oa = [0, 0, 0], ob = [0, 0, 0];
      const spow = (c) => Math.sign(c) * Math.pow(Math.abs(c), q);
      // [route metre, metres right of the line, centre above the sea, half-width across, half-height, half-length along,
      //  lean toward the line per metre up, lean along the route per metre up, columns round it]
      // THE SPIT BY PLACE: a front rank ACROSS the way out of the hollow (mass 0, 16 m across and 10 m along, the fall down the
      // face it turns to the hollow; mass 2 taller beside it, mass 1 behind its shoulder), the high masses 18 to 31 m off, and low
      // masses with the foam between them and the line. A mass whose top stands more than 6 m over the sea is TALL.
      const SPEC = [[433, 19.5, 2, 8, 14, 5, 0.03, 0.06, 20], [442.5, 17.6, 2, 6, 10.5, 6, 0.05, 0.04, 20], [438, 31, 2, 7, 21, 7, 0.04, -0.05, 18],
        [450.5, 20.6, 2, 6.8, 14, 6.6, 0.02, 0, 20], [451, 31.5, 3, 7.5, 26, 8.5, 0.07, 0.05, 20], [459, 19.2, 2, 7.4, 12, 7, 0.06, -0.08, 20],
        [464, 28.6, 2, 7, 18, 8, 0.06, 0.1, 20], [446, 24.4, 19.5, 5.6, 6, 6, 0.3, -0.12, 18], [456.5, 24.6, 17.5, 5, 5.5, 5.5, 0.26, 0.16, 16],
        [469, 18.2, 1.5, 6.4, 9, 6.4, 0.08, 0.12, 18], [474.6, 24.6, 1.5, 5.5, 11, 6.5, 0.05, 0.14, 18], [467.4, 21.8, 11.2, 4, 4.2, 4.5, 0.28, 0.2, 14],
        [479.2, 14.2, 0.8, 5.4, 4.8, 5.5, 0.06, 0.16, 16], [488, 12.8, 0.6, 4.2, 4.3, 4.6, 0.05, 0.2, 14],
        [434.6, 9.5, 0.3, 2.2, 2.4, 2.6, 0, 0.1, 12], [443.2, 10, 0.4, 2.4, 2.7, 2.5, 0, -0.1, 12], [463.6, 9.8, 0.3, 2.2, 2.2, 2.6, 0, 0.12, 12], [473.6, 9.2, 0.2, 1.8, 1.8, 2.2, 0, 0.1, 12], [483.6, 8.8, 0.2, 1.5, 1.4, 1.9, 0, 0, 12],
        [427.6, 12.4, 0.3, 2.8, 3.5, 2.4, 0, 0.1, 12], [452.4, 11.2, 0.3, 2.6, 3.1, 2.8, 0, 0.08, 12]];
      SPEC.forEach((s, si) => { const m = s[0] + sr.range(-0.5, 0.5); path.tangentAtDist(m, T); const tl = Math.hypot(T.x, T.z) || 1, e2x = T.x / tl, e2z = T.z / tl, e1x = -e2z, e1z = e2x;
        const M = { m, a: s[1] + sr.range(-0.3, 0.3), ra: s[3] * sr.range(0.95, 1.05), ry: s[4] * sr.range(0.96, 1.04), rm: s[5] * sr.range(0.95, 1.05), la: -s[6], lm: s[7], NL: s[8], NT: s[8] >= 16 ? 10 : 6,
          sd: Math.round(sr.range(3, 28)) / 32, ph: sr.range(0, TAU), ink: si % 3 === 1 || si === 3 || si === 12 ? 1 : 0, cy: SEA + s[2], cx: 0, cz: 0, e1x, e1z, e2x, e2z };
        M.R = 0.5 * (M.ra + M.rm); M.nc = Math.max(5, Math.round(TAU * M.R / 2));
        // a point of the mass: th round it (0 on the side away from the line), ph down from the crown (0..PI)
        M.at = (th, ph, out) => { const hr = Math.pow(Math.abs(Math.sin(ph)), q), ly = M.ry * spow(Math.cos(ph)), lump = 1 + 0.07 * Math.sin(3 * th + M.ph) * Math.sin(2.3 * ph + M.ph * 1.7) + 0.04 * Math.sin(5 * th + 2 * M.ph + 3 * ph);
          const ox = M.ra * hr * spow(Math.cos(th)) * lump + M.la * ly, oz = M.rm * hr * spow(Math.sin(th)) * lump + M.lm * ly;
          out[0] = M.cx + e1x * ox + e2x * oz; out[1] = M.cy + ly; out[2] = M.cz + e1z * ox + e2z * oz; return out; };
        // its closed form at a point of the world: under 1 inside; outside, about (f - 1) * R metres from it
        M.f = (x, y, z) => { const dx = x - M.cx, dy = y - M.cy, dz = z - M.cz, lx = dx * e1x + dz * e1z - M.la * dy, lz = dx * e2x + dz * e2z - M.lm * dy;
          return Math.pow(Math.pow(Math.abs(lx / M.ra), PW) + Math.pow(Math.abs(dy / M.ry), PW) + Math.pow(Math.abs(lz / M.rm), PW), 1 / PW); };
        // CLEAR AIR, at build: the mass is moved off the line until every point of it stands 6.5 m from the flown line or more,
        // and a TALL mass 11 m or more
        const need = s[2] + s[4] > 6 ? 11 : 6.5; for (let it = 0; it < 8; it++) { const w = place.toWorld(M.m, M.a); M.cx = w[0]; M.cz = w[1]; let least = 1e9;
          for (let i = 0; i < 24; i++) for (let j = 0; j <= 12; j++) { M.at(i / 24 * TAU, j / 12 * Math.PI, o3); if (o3[1] > SEA - 2) least = Math.min(least, path.distanceTo(o3[0], o3[1], o3[2])); }
          if (least >= need) break; M.a += need - least + 0.15; }
        // it goes down 1.5 m under the lowest water round its foot (the lee's water climbs from the trough between 402 and 448 m)
        M.wy = SEA; for (const dm of [-1, 0, 1]) for (const da of [-1, 0, 1]) M.wy = Math.min(M.wy, place.seaAt(M.m + dm * M.rm, M.a + da * M.ra));
        const hy0 = (M.wy - 1.5 - M.cy) / M.ry; M.closed = hy0 <= -1; M.phEnd = M.closed ? Math.PI : Math.acos(Math.sign(hy0) * Math.pow(Math.abs(hy0), PW / 2));
        rockMasses.push(M); });
      await ctx.yield();
      for (const M of rockMasses) { const G = rockGeo, b = G.pos.length / 3, NL = M.NL, NT = M.NT, rows = NT + 1; if (b && rockMasses.indexOf(M) % 3 === 0) await ctx.yield();
        for (let j = 0; j <= NT; j++) { const ph = j === 0 ? 1e-3 : M.phEnd * j / NT, hr = Math.pow(Math.abs(Math.sin(ph)), q);
          for (let i = 0; i <= NL; i++) { const th = i / NL * TAU, p = M.at(th, ph, o3), pe = Math.min(Math.max(ph, 0.03), Math.PI - 0.03);
            M.at(th + 0.02, pe, oa); M.at(th - 0.02, pe, ob); const ux = oa[0] - ob[0], uy = oa[1] - ob[1], uz = oa[2] - ob[2];
            M.at(th, pe + 0.02, oa); M.at(th, pe - 0.02, ob); const vx = oa[0] - ob[0], vy = oa[1] - ob[1], vz = oa[2] - ob[2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
            if (nx * (p[0] - M.cx) + ny * (p[1] - M.cy) * 0.3 + nz * (p[2] - M.cz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
            if (j === 0) { nx = 0; ny = 1; nz = 0; }
            let e = 99; for (const K of rockMasses) if (K !== M) e = Math.min(e, (K.f(p[0], p[1], p[2]) - 1) * Math.min(K.R, K.ry));
            G.pos.push(p[0], p[1], p[2]); G.nor.push(nx, ny, nz); G.rk.push(i / NL * M.nc, ph * 0.5 * (M.ry + M.R), M.nc + M.sd, Math.max(TAU * M.R * hr / M.nc, 0.05) * (M.ink ? -1 : 1)); G.rk2.push(e, 0); } }
        for (let j = 0; j < NT; j++) for (let i = 0; i < NL; i++) { const a = b + j * (NL + 1) + i, c = a + NL + 1; if (j > 0) G.idx.push(a, a + 1, c); G.idx.push(a + 1, c + 1, c); }
        if (M.closed) { const c0 = G.pos.length / 3, p = M.at(0, Math.PI - 1e-3, o3); G.pos.push(p[0], p[1], p[2]); G.nor.push(0, -1, 0); G.rk.push(0, 99, M.nc + M.sd, 0.05); G.rk2.push(99, 0);
          for (let i = 0; i < NL; i++) G.idx.push(b + NT * (NL + 1) + i + 1, b + NT * (NL + 1) + i, c0); } }
      { const g = new THREE.BufferGeometry(), mid = rockMasses[5], bd = new THREE.Vector3(-mid.e1x * 0.5 + mid.e2x * 0.6, 0.62, -mid.e1z * 0.5 + mid.e2z * 0.6).normalize();
        g.setAttribute('position', new THREE.Float32BufferAttribute(rockGeo.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(rockGeo.nor, 3));
        g.setAttribute('aRock', new THREE.Float32BufferAttribute(rockGeo.rk, 4)); g.setAttribute('aRock2', new THREE.Float32BufferAttribute(rockGeo.rk2, 2)); g.setIndex(rockGeo.idx);
        const shadeInk = overprint(overprint(paper, pale, 0.8), keyInk, 0.2);
        const rock = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...U, uBlockDir: { value: bd }, uOchre: { value: overprint(paper, yellow, 0.5) }, uShade: { value: shadeInk }, uSnowy: { value: look === 'snow' ? 1 : 0 } }, vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, side: THREE.DoubleSide }));
        rock.name = 'spit-rock'; rock.frustumCulled = false; scene.add(rock); }
      // FOAM CLAWS at the rock's foot, hooking out over the lee water: hands of small claws along every waterline that faces the line
      const phAt = (M, y) => { const hy = clamp((y - M.cy) / M.ry, -1, 1); return Math.acos(Math.sign(hy) * Math.pow(Math.abs(hy), PW / 2)); };
      for (const M of rockMasses) { if (M.closed) continue; const phW = phAt(M, SEA);
        for (let th = Math.PI * 0.5 + sr.range(0, 0.3); th < Math.PI * 1.5; th += sr.range(1.6, 2.6) / M.R / Math.min(1, density)) { let p = M.at(th, phW, o3), rt = place.routeOf(p[0], p[2]); const wy = place.seaY(rt.m, rt.a, p[0], p[2]); p = M.at(th, phAt(M, wy), o3); const ox = p[0] - M.cx, oz = p[2] - M.cz, ol = Math.hypot(ox, oz) || 1, x = p[0] + ox / ol * 0.5, z = p[2] + oz / ol * 0.5;
          const n = 2 + Math.floor(sr() * 3), r1 = sr.range(0.7, 1.5), yaw = Math.atan2(oz, ox) + sr.range(-0.4, 0.4); if (rockMasses.some((K) => K !== M && K.f(x, wy, z) < 1.04)) continue;
          for (let i = 0; i < n; i++) { const u = i / Math.max(n - 1, 1) - 0.5; addClaw(x - oz / ol * u * 1.5, wy - 0.1, z + ox / ol * u * 1.5, r1 * (1 - 0.3 * Math.abs(u)), yaw + u * 0.5, u * 1.1, sr.range(0.1, 0.5)); } } }
      await ctx.yield();
    }
    // metres from a place on the water to the spit's nearest waterline (0 inside a mass): for the lace at the rock's foot
    const rockFoot = (x, y, z) => { let d = 99; for (const K of rockMasses) if (!K.closed && Math.abs(x - K.cx) + Math.abs(z - K.cz) < 60) d = Math.min(d, (K.f(x, y, z) - 1) * K.R); return Math.max(d, 0); };
    // the sea is laid here, after the rock, whose waterline its lace follows
    const sea = await buildSea(ctx, path, place, U, seedPhase, rockFoot); scene.add(sea);
    await ctx.yield();
    const faceMesh = (F, mat, name) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(F.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(F.nor, 3));
      g.setAttribute('aPrint', new THREE.Float32BufferAttribute(F.pr, 4)); g.setIndex(F.idx); const m = new THREE.Mesh(g, mat); m.name = name; m.frustumCulled = false; return m; };

    // ---- PINES on the crag: red-brown elbow-bent trunks that lean out over the water, every bough ending in FLAT PADS of
    // needles (solid lenses 1.6 to 4.6 m long: radiating key-line needles over a green printed as mid blue over yellow).
    // Eleven, at three sizes (two of 11 to 13 m, five of 8 to 9 m, four of 5 to 6 m), rooted on the brows that look at the
    // line, the two largest nearest it. They sway a little on the world's clock. No bough or pad within 3.1 m of the line.
    const SWAY_VERT = /* glsl */`
attribute vec4 aPrint, aSway;          // aSway: metres of sway along x, along z, phase, 0
uniform float uTime;
varying vec3 vW, vN; varying vec4 vP;
void main(){ vec3 p = position; float s = sin(uTime * .8 + aSway.z), c = sin(uTime * .57 + aSway.z * 1.7);
  p.x += aSway.x * s; p.z += aSway.y * c;
  vec4 wpos = modelMatrix * vec4(p, 1.); vW = wpos.xyz; vP = aPrint; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wpos; }`;
    const NEEDLE_FRAG = /* glsl */`
varying vec3 vW, vN; varying vec4 vP;   // vP: cap 0|1 (paper snow), metres to the rim, needle coordinate (one per needle), 0
${PRINT_GLSL}
void main(){
  float fa = clamp(fwidth(vP.z), 1e-4, 1.), f = abs(fract(vP.z) - .5), fe = fwidth(vP.y);
  vec3 green = hwOver(uYel, uMid, 1.);
  float wd = max(.14, .75 * fa), ln = (1. - smoothstep(wd - .5 * fa, wd + .5 * fa, f)) * smoothstep(.07, .16, vP.y);
  vec3 col = mix(green, uKey, mix(ln, .3, smoothstep(.35, .7, fa)));
  col = mix(col, uPaper, step(.5, vP.x) * smoothstep(.2 - fe, .2 + fe, vP.y));
  col = mix(col, uKey, hwLine(vP.y, .03, fe, .15));
  gl_FragColor = vec4(col, 1.);
}`;
    const pineGeo = { wood: { pos: [], nor: [], pr: [], sw: [], idx: [] }, pads: { pos: [], nor: [], pr: [], sw: [], idx: [] } };   // also read by the count of clear air
    { const pr = rng.fork('pines'), wood = pineGeo.wood, pads = pineGeo.pads, snowy = look === 'snow', o3 = [0, 0, 0];
      // a tube along a polyline with radii; sway grows with the height above the pine's foot
      const tube = (pts, radii, foot, phase, amp) => { const b = wood.pos.length / 3, NSD = 5;
        for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
          let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          let ax = -tz, az = tx, al = Math.hypot(ax, az); if (al < 0.05) { ax = 1; az = 0; al = 1; } ax /= al; az /= al;
          const bx = ty * az, by = tz * ax - tx * az, bz = -ty * ax, k = amp * Math.max(0, p[1] - foot);
          for (let s = 0; s < NSD; s++) { const th = s / NSD * TAU, c = Math.cos(th), sn = Math.sin(th), nx = ax * c + bx * sn, ny = by * sn, nz = az * c + bz * sn;
            wood.pos.push(p[0] + nx * radii[i], p[1] + ny * radii[i], p[2] + nz * radii[i]); wood.nor.push(nx, ny, nz); wood.pr.push(INK.red, 99, p[1], th * radii[i]); wood.sw.push(k, k * 0.7, phase, 0); } }
        for (let i = 0; i < pts.length - 1; i++) for (let s = 0; s < NSD; s++) { const a = b + i * NSD + s, c = b + i * NSD + (s + 1) % NSD; wood.idx.push(a, c, a + NSD, c, c + NSD, a + NSD); } };
      // a PAD of needles: a flat solid lens, longer along its bough (dx, dz), its needles radiating as key lines.
      // CLEAR AIR at build: a pad any point of which would come within 3.1 m of the flown line (its sway added) is not made.
      const pad = (cx, cy, cz, r, dx, dz, foot, phase, amp, must) => { const SEG = 12, k = amp * Math.max(0, cy - foot), rx = r * 1.22, rz = r * 0.84, tilt = pr.range(-0.12, 0.12), nd = Math.round(TAU * r / 0.34) / TAU;
        const rim = (t) => { const c = Math.cos(t) * rx, s = Math.sin(t) * rz; return [cx + dx * c - dz * s, cy + c * tilt, cz + dz * c + dx * s]; };
        if (!must) for (let s = 0; s <= SEG; s++) { const p = s < SEG ? rim(s / SEG * TAU) : [cx, cy - 0.1 * r, cz]; if (path.distanceTo(p[0], p[1], p[2]) < 3.1 + 1.3 * k) return false; }
        for (const sgn of [1, -1]) for (let s = 0; s < SEG; s++) { const b = pads.pos.length / 3, t0 = s / SEG * TAU, t1 = (s + 1) / SEG * TAU, p0 = rim(t0), p1 = rim(t1), cap = snowy && sgn > 0 ? 1 : 0;
          pads.pos.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], cx, cy + (sgn > 0 ? 0.15 : -0.09) * r, cz);
          pads.nor.push(0, sgn, 0, 0, sgn, 0, 0, sgn, 0); pads.pr.push(cap, 0, t0 * nd, 0, cap, 0, t1 * nd, 0, cap, rz * 0.95, (t0 + t1) * 0.5 * nd, 0);
          for (let q = 0; q < 3; q++) pads.sw.push(k, k * 0.7, phase, 0);
          if (sgn > 0) pads.idx.push(b, b + 2, b + 1); else pads.idx.push(b, b + 1, b + 2); }
        return true; };
      // ELEVEN PINES AT THREE SIZES, each rooted on a mass of the crag and leaning out over the water toward the line's side:
      // [mass, angle round it (PI faces the line), angle down from its crown, height m, size class 0 large | 1 middle | 2 small]
      // The two largest stand nearest the line; the first reaches one bough over the way at 444 m, 4.6 m above the line.
      const PINES = [[15, 1.0, 0.3, 11, 0], [1, 1.02, 0.5, 12.5, 0], [0, 1.08, 0.4, 8.5, 1], [5, 0.95, 0.5, 9, 1], [7, 1.0, 0.35, 8.5, 1], [9, 1.0, 0.45, 8, 1], [4, 1.0, 0.3, 9, 1],
        [12, 0.95, 0.45, 6, 2], [13, 1.0, 0.45, 5, 2], [11, 1.0, 0.4, 5.5, 2], [16, 1.0, 0.3, 5.5, 2]];
      const lineP = path.posAtDist(444, new THREE.Vector3());
      PINES.forEach(([mi, tha, pha, H0, cls], pi) => { const M = rockMasses[mi], t = M.at(tha * Math.PI + pr.range(-0.15, 0.15), pha, o3).slice(), H = H0 * pr.range(0.94, 1.06), phase = pr.range(0, TAU), amp = 0.035, lean = pr.range(0.3, 0.5), over = pi === 0;
        const toLine = over ? Math.atan2(lineP.z - t[2], lineP.x - t[0]) : Math.atan2(-M.e1z, -M.e1x) + pr.range(-0.6, 0.6), dx = Math.cos(toLine), dz = Math.sin(toLine), rT = 0.028 * H + 0.06;
        const elbow = [t[0] + dx * H * lean * 0.5, t[1] + H * 0.42, t[2] + dz * H * lean * 0.5], topP = [elbow[0] - dx * H * lean * 0.3, t[1] + H, elbow[2] - dz * H * lean * 0.3];
        const mid1 = [t[0] + dx * H * lean * 0.3, t[1] + H * 0.2, t[2] + dz * H * lean * 0.3], mid2 = [elbow[0] - dx * H * lean * 0.05, t[1] + H * 0.7, elbow[2] - dz * H * lean * 0.05];
        tube([[t[0], t[1] - 0.8, t[2]], mid1, elbow, mid2, topP], [rT, rT * 0.88, rT * 0.76, rT * 0.56, rT * 0.3], t[1], phase, amp);
        const nb = [5, 4, 3][cls] + Math.floor(pr() * 2), L0 = [3.4, 2.5, 1.6][cls], L1 = [5.4, 3.8, 2.6][cls], R0 = [1.6, 1.15, 0.8][cls], R1 = [2.3, 1.7, 1.15][cls];
        for (let b = 0; b < nb; b++) { const f = 0.42 + 0.58 * (b + pr() * 0.6) / nb, g1 = (f - 0.42) / 0.28, g2 = (f - 0.7) / 0.3, from = f < 0.7 ? [lerp(elbow[0], mid2[0], g1), lerp(elbow[1], mid2[1], g1), lerp(elbow[2], mid2[2], g1)] : [lerp(mid2[0], topP[0], g2), lerp(mid2[1], topP[1], g2), lerp(mid2[2], topP[2], g2)];
          const ang = toLine + (b % 2 ? 1 : -1) * pr.range(0.4, 2.3), len = pr.range(L0, L1) * (1.15 - 0.5 * f), rise = pr.range(-0.1, 0.22) * len, r = pr.range(R0, R1) * (1.1 - 0.35 * f), r2 = r * pr.range(0.55, 0.75), ex = pr.range(-0.5, 0.5), two = pr() < 0.6; let end, must = false;
          if (over && b === 0) { end = [lerp(from[0], lineP.x, 0.92), lineP.y + 4.6, lerp(from[2], lineP.z, 0.92)]; must = true; }
          else end = [from[0] + Math.cos(ang) * len, from[1] + rise, from[2] + Math.sin(ang) * len];
          const kn = [lerp(from[0], end[0], 0.5), lerp(from[1], end[1], 0.5) + 0.3, lerp(from[2], end[2], 0.5)], bl = Math.hypot(end[0] - from[0], end[2] - from[2]) || 1, bx = (end[0] - from[0]) / bl, bz = (end[2] - from[2]) / bl;
          if (!must && Math.min(path.distanceTo(end[0], end[1], end[2]), path.distanceTo(kn[0], kn[1], kn[2])) < 3.4 + 1.3 * amp * (end[1] - t[1])) continue;
          tube([from, kn, end], [rT * 0.36, rT * 0.27, rT * 0.15], t[1], phase, amp);
          pad(end[0], end[1] + 0.12, end[2], must ? 1.5 : r, bx, bz, t[1], phase, amp, must);
          if (two && !must) pad(lerp(end[0], kn[0], 0.9) - bz * ex, lerp(end[1], kn[1], 0.9) + 0.25 + 0.2 * r2, lerp(end[2], kn[2], 0.9) + bx * ex, r2, bx, bz, t[1], phase, amp, false); }
        pad(topP[0], topP[1] + 0.1, topP[2], pr.range(R0, R1) * 0.75, dx, dz, t[1], phase, amp, false); });
      const mk = (F, mat, name) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(F.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(F.nor, 3));
        g.setAttribute('aPrint', new THREE.Float32BufferAttribute(F.pr, 4)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(F.sw, 4)); g.setIndex(F.idx); const m = new THREE.Mesh(g, mat); m.name = name; m.frustumCulled = false; scene.add(m); };
      // trunks and boughs: the brown-red block under a quarter of key indigo (red-brown), cut line on the silhouette
      const woodMat = printMaterial(U, { size: 'boat', lineWidth: 0.05, slip: 0, rim: 0.25, overInk: INK.key, over: 0.28 }); woodMat.vertexShader = SWAY_VERT;
      mk(wood, woodMat, 'pine-wood');
      mk(pads, new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: SWAY_VERT, fragmentShader: NEEDLE_FRAG }), 'pine-pads');
      await ctx.yield();
    }

    // ---- THE FALL: five ropes of bare paper down the face that the spit's first mass turns to the hollow (about 427 m of
    // route, 12 m and more right of the line: the brief had it at 450 m, where no rope could be seen from the line). The ropes
    // leave the brow, lie on the bulge and fall free under it to the water; their pale bands run down on the world's clock.
    const ropeBodies = [];
    { const fr = rng.fork('fall'), F = { pos: [], nor: [], pr: [], idx: [] };
      const FB = rockMasses[0], o3 = [0, 0, 0], thc = 1.3 * Math.PI, dx = FB.e1x * Math.cos(thc) + FB.e2x * Math.sin(thc), dz = FB.e1z * Math.cos(thc) + FB.e2z * Math.sin(thc), sx = -dz, sz = dx;   // d: out of the face; s: along it
      for (let r = 0; r < 5; r++) { const thr = thc + (r - 2) * 0.17 + fr.range(-0.03, 0.03), rad = fr.range(0.22, 0.34), b = F.pos.length / 3, NS = 6, NR = 12;
        const hp = FB.at(thr, 0.55, o3), top = hp[1] + 0.2, s0 = (hp[0] - FB.cx) * sx + (hp[2] - FB.cz) * sz, rt = place.routeOf(hp[0] + dx * 2, hp[2] + dz * 2), wy = place.seaY(rt.m, rt.a, hp[0] + dx * 2, hp[2] + dz * 2); let out = -1e9, cx = 0, cz = 0;
        for (let i = 0; i <= NR; i++) { const t = i / NR, y = lerp(top, wy - 0.4, t * (0.35 + 0.65 * t)), cph = clamp((y - FB.cy) / FB.ry, -1, 1), ph = Math.acos(Math.sign(cph) * Math.pow(Math.abs(cph), 1.5)), p = FB.at(thr, Math.max(ph, 0.55), o3), rr = rad * (0.7 + 0.6 * t);
          out = Math.max(out, (p[0] - FB.cx) * dx + (p[2] - FB.cz) * dz + 0.12 + 0.5 * t * t);        // metres out of the face from the mass's middle: never back under the bulge
          cx = FB.cx + sx * s0 + dx * (out + rr); cz = FB.cz + sz * s0 + dz * (out + rr);
          for (let s = 0; s < NS; s++) { const th = s / NS * TAU, nx = Math.cos(th) * sx + Math.sin(th) * dx, nz = Math.cos(th) * sz + Math.sin(th) * dz;
            F.pos.push(cx + nx * rr, y, cz + nz * rr); F.nor.push(nx, 0, nz); F.pr.push(INK.paper, 99, y + r * 0.37, th); }
          ropeBodies.push({ x: cx, y, z: cz, r: rr }); }
        for (let i = 0; i < NR; i++) for (let s = 0; s < NS; s++) { const a = b + i * NS + s, c = b + i * NS + (s + 1) % NS; F.idx.push(a, c, a + NS, c, c + NS, a + NS); }
        // foam claws where each rope meets the water
        const fx = cx + dx * 0.5, fz = cz + dz * 0.5;
        for (let c = 0; c < 2; c++) addClaw(fx + fr.range(-0.4, 0.4), wy - 0.1, fz + fr.range(-0.4, 0.4), fr.range(0.6, 1.1), Math.atan2(dz, dx) + fr.range(-0.9, 0.9), fr.range(-0.5, 0.5), fr.range(0.1, 0.5)); }
      scene.add(faceMesh(F, printMaterial(U, { size: 'boat', lineWidth: 0.05, slip: 0, ribs: 1, ribInk: INK.pale, period: 3.6, speed: 5.5, rim: 0.3 }), 'fall-ropes'));
    }

    // ---- SMALL CLAWS ON THE LEE WATER (fix round 3): a hand of five to seven on the far rim of every island of the lee's
    // lace (place.LEE), .5 to 1 m long, hooking the way we go; by the law above none reaches within 2.6 m of the line
    { const lr = rng.fork('lee-claws'), T = new THREE.Vector3();
      place.LEE.forEach((I, ii) => { const n = 5 + Math.floor(lr() * 3);
        for (let c = 0; c < n; c++) { const t = (c / (n - 1) - 0.5) * 1.5, m = I[0] + Math.cos(t) * I[2] * 0.9, a = I[1] + 1.2 * Math.sin(m * 0.21 + ii) + Math.sin(t) * I[3] * 0.9, w = place.toWorld(m, a);
          path.tangentAtDist(Math.min(m, L - 0.5), T);
          addClaw(w[0], place.seaY(m, a, w[0], w[1]) - 0.08, w[1], lr.range(0.5, 1), Math.atan2(T.x, -T.z) + lr.range(-0.5, 0.5), lr.range(-0.4, 0.4), lr.range(0.1, 0.45)); } }); }

    // ---- the swell claws' mesh (every claw of the open sea, the seaward hill, the spit's foot, the fall and the lee)
    const clawU = { ...U, uLineW: { value: 0.04 }, uGrow: { value: 1 } };
    { const cr = rng.fork('claw-phase');
      // THE COUNT (TRI.clawNear, TRI.clawFar, each times the machine's detail): a class with more claws than its count is
      // thinned evenly along its list (every claw's place is kept, some are not made); the fan of seven is never thinned
      const thin = (list, cap) => { const must = list.filter((c) => c.seven), rest = list.filter((c) => !c.seven), n = Math.max(0, Math.min(rest.length, cap - must.length));
        return must.concat(rest.filter((c, i) => Math.floor((i + 1) * n / rest.length) > Math.floor(i * n / rest.length))); };
      for (const c of clawList) c.far = Math.abs(place.routeOf(c.x, c.z).a) > 32 ? 1 : 0;
      const keep = thin(clawList.filter((c) => !c.far), Math.round(TRI.clawNear * detail)).concat(thin(clawList.filter((c) => c.far), Math.round(TRI.clawFar * detail)));
      keep.forEach((c) => { c.ph = cr.range(0, TAU); });
      clawList.length = 0; for (const c of keep) clawList.push(c);
      const cmat = new THREE.ShaderMaterial({ uniforms: clawU, vertexShader: CLAW_VERT, fragmentShader: CLAW_FRAG, side: THREE.DoubleSide });
      for (let cls = 0; cls < 2; cls++) { const part = keep.filter((c) => c.far === cls), g = clawGeometry(1 + cls), aRoot = new Float32Array(Math.max(part.length, 1) * 4), aAim = new Float32Array(Math.max(part.length, 1) * 4);
        part.forEach((c, i) => { aRoot.set([c.x, c.y, c.z, c.len], i * 4); aAim.set([c.yaw, c.lean, c.pitch, c.ph], i * 4); });
        const ig = new THREE.InstancedBufferGeometry(); ig.index = g.index; ig.attributes.position = g.attributes.position; ig.attributes.aHook = g.attributes.aHook; ig.attributes.normal = g.attributes.normal;
        ig.setAttribute('aRoot', new THREE.InstancedBufferAttribute(aRoot, 4)); ig.setAttribute('aAim', new THREE.InstancedBufferAttribute(aAim, 4)); ig.instanceCount = Math.max(part.length, 1);
        const m = new THREE.Mesh(ig, cmat); m.frustumCulled = false; m.name = cls ? 'swell-claws-far' : 'swell-claws'; scene.add(m); }
      await ctx.yield();
    }

    // ---- DOTS flung from the swell claws: rounds of bare paper, small solids ROUND BY THEIR OWN SHAPE (no program of a
    // dot reads the eye or the lens for its shape, size or showing), born at nothing on a claw's tip and dying at nothing
    // at the water. A dot's lane is fixed at build and counted: no point of it within 4 m of the line.
    // THE DOT'S THREE SOLIDS, by place: a dot's class is fixed at build by its radius r over d, the least metres from its
    // lane to the flown line (2r / d is the widest it can ever stand before a comer on the line, in radians):
    //   ball   a round of 120 faces, its outline twelve-sided or finer from every side: 2r / d up to DOT_WIDE[0]
    //   grain  the twenty-faced solid: 2r / d up to DOT_WIDE[1]
    //   speck  the eight-faced solid: 2r / d up to DOT_WIDE[2]
    // (DOT_WIDE in degrees of the angle a dot fills from the nearest point of the line: 4.5, 1.03 and 0.52)
    // A dot too wide for its class is cut down to the class's width; a class that is full hands its dot to the next.
    const DOT_WIDE = [0.078, 0.018, 0.009], dotGeos = [new THREE.SphereGeometry(1, 12, 6), new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0)], DOT_NAMES = ['ball', 'grain', 'speck'];
    // put a dot in its class (or in the class wanted, if that is a smaller one): returns the radius it was made with (0: not made). bins = [{ cap, rows: [] } x 3]
    const putDot = (bins, r, d, row, want = 0) => { let c = Math.max(want, 2 * r > DOT_WIDE[1] * d ? 0 : 2 * r > DOT_WIDE[2] * d ? 1 : 2);
      while (c < 3 && bins[c].rows.length >= bins[c].cap) c++; if (c > 2) return 0;
      r = Math.min(r, 0.5 * DOT_WIDE[c] * d); row.r = r; bins[c].rows.push(row); return r; };
    const dotLanes = [];
    { const dr = rng.fork('dots'), N = Math.round(760 * detail * density), P = new THREE.Vector3();
      const bins = [{ cap: TRI.dotBall, rows: [] }, { cap: TRI.dotGrain, rows: [] }, { cap: TRI.dotSpeck, rows: [] }];
      // the claws' own dots keep to the ball's last places: the lip's spray is laid first in its class (below), so these are dealt after it
      const own = [];
      for (let tries = 0; tries < N * 3 && own.length < N; tries++) { const c = clawList[Math.floor(dr() * clawList.length) % clawList.length];
        const hx = Math.cos(c.yaw), hz = Math.sin(c.yaw), r = dr.range(0.04, 0.15) * (dr() < 0.25 ? 1 : 0.6), per = dr.range(2.4, 4.6), ph = dr(), reach = dr.range(0.5, 2.2) + c.len * 0.6, side = dr.range(-0.8, 0.8), up = dr.range(0.6, 2.2);
        const tip = [c.x + hx * c.len * 0.55, c.y + c.len * 0.8, c.z + hz * c.len * 0.55], vx = hx * reach - hz * side, vz = hz * reach + hx * side;
        const rt = place.routeOf(tip[0] + vx, tip[2] + vz), land = place.seaY(rt.m, rt.a, tip[0] + vx, tip[2] + vz);
        let ok = c.len > 0.6, dmin = 1e9; for (let k = 0; k <= 6 && ok; k++) { const t = k / 6, y = tip[1] + up * t - (tip[1] - land + up) * t * t, d = path.distanceTo(tip[0] + vx * t, y, tip[2] + vz * t); dmin = Math.min(dmin, d); if (d < 4.3 + r) ok = false; }
        if (!ok || place.p0.z - (tip[2] + vz) < 1.5 || place.p0.z - tip[2] < 1.5) continue;     // no dot behind the entry
        own.push({ tip, vx, vz, up, drop: tip[1] - land, r, per, ph, s: 0, kind: 2, d: dmin }); }
      // THE LIP'S SPRAY, as printed snow: the same dot, in the same meshes and under the same count. Two families of lanes,
      // each fixed at build. Kind 1, the hollow's first third: dots let fall from the lip's own edge (11 m left of the line,
      // 10 to 11 m over the trough's water) and flung a little inward, densest just inside the lip and thinning toward the
      // line, from 292 to 352 m of route. Kind 0, the mouth: dots drifting across from the left and falling, between 284 and
      // 320 m of route, where the lip first hangs. A LANE SHOWS BY WHAT THROWS IT: the lip's own curl at the lane's metre
      // (the law the lip's own dots have: nothing until the section's lip hangs at nine tenths of its fullest), and by the
      // window all lanes share: its metre of route from 12 m behind the metres flown to 46 m ahead (fading to 62 m).
      // No point of a lane within 4.4 m of the line.
      await ctx.yield();
      { const sr2 = rng.fork('lip-spray');
        const lane = (s, a0, y0, da, ds, up, r, per, kind, want) => { const w0 = place.toWorld(s, a0), x0 = w0[0], z0 = w0[1], w1 = place.toWorld(s + ds, a0 + da), land = place.seaAt(s + ds, a0 + da), vx = w1[0] - x0, vz = w1[1] - z0, ph = sr2(); let dmin = 1e9;
          for (let k = 0; k <= 8; k++) { const t = k / 8, y = y0 + up * t - (y0 - land + up) * t * t, d = path.distanceTo(x0 + vx * t, y, z0 + vz * t); dmin = Math.min(dmin, d); if (d < 4.4 + r) return; }
          const row = { tip: [x0, y0, z0], vx, vz, up, drop: y0 - land, r, per, ph, s, kind, d: dmin }; if (putDot(bins, r, dmin, row, want)) dotLanes.push(row); };
        const NH = Math.round(560 * detail), NT = Math.round(180 * detail);
        for (let i = 0; i < NH; i++) { const s = 292 + 60 * Math.pow(sr2(), 1.25), k = sr2(), a0 = -11.2 + 0.6 * sr2(), y0 = 10.3 + 0.8 * sr2(), ds = sr2.range(-1.5, 2.5), up = sr2.range(0, 1.2), r = i % 3 ? sr2.range(0.03, 0.07) : sr2.range(0.1, 0.17);
          lane(s, a0, y0, 0.3 + 5.8 * k * k, ds, up, r, sr2.range(1.5, 2.9), 1, i % 3 ? 1 : 0); }
        for (let i = 0; i < NT; i++) { const s = sr2.range(284, 320), a0 = sr2.range(-32, -11.5), y0 = place.lineY(s) + sr2.range(-2, 8), da = sr2.range(4, 12), ds = sr2.range(-2, 5), up = sr2.range(0, 1.5), r = i % 3 ? sr2.range(0.04, 0.09) : sr2.range(0.1, 0.17);
          lane(s, a0, y0, da, ds, up, r, sr2.range(2.6, 4.6), 0, i % 3 ? 1 : 0); } }
      for (const row of own) if (putDot(bins, row.r, row.d, row)) dotLanes.push(row);
      const dotMat = new THREE.ShaderMaterial({ uniforms: { ...U }, fragmentShader: /* glsl */`
uniform vec3 uPaper;
void main(){ gl_FragColor = vec4(uPaper, 1.); }`, vertexShader: /* glsl */`
attribute vec4 aFrom, aFly, aT;      // aT: period s, phase, the lane's metre of route, kind (0 the mouth's spray | 1 the hollow's spray | 2 a swell claw's own)
${PRINT_GLSL}
${WAVE_GLSL}
void main(){ float tau = fract(uTime / max(aT.x, .5) + aT.y), sz = aFrom.w * sqrt(max(sin(3.14159 * tau), 0.)), dm = aT.z - uFlown;
  if (aT.w < 1.5) sz *= smoothstep(-12., -4., dm) * (1. - smoothstep(46., 62., dm)) * smoothstep(.9, 1., hwCurl(-dm, hwEase(aT.z)).x);
  vec3 c = aFrom.xyz + vec3(aFly.x * tau, aFly.z * tau - (aFly.w + aFly.z) * tau * tau, aFly.y * tau);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(c + position * sz, 1.); }` });
      bins.forEach((b, ci) => { const n = b.rows.length, aFrom = new Float32Array(Math.max(n, 1) * 4), aFly = new Float32Array(Math.max(n, 1) * 4), aT = new Float32Array(Math.max(n, 1) * 4);
        b.rows.forEach((d, i) => { aFrom.set([d.tip[0], d.tip[1], d.tip[2], d.r], i * 4); aFly.set([d.vx, d.vz, d.up, d.drop], i * 4); aT.set([d.per, d.ph, d.s, d.kind], i * 4); });
        if (!n) { aFrom.set([0, -50, 0, 0]); aT.set([3, 0, 0, 2]); }
        const g = dotGeos[ci], ig = new THREE.InstancedBufferGeometry(); ig.index = g.index; ig.attributes.position = g.attributes.position;
        ig.setAttribute('aFrom', new THREE.InstancedBufferAttribute(aFrom, 4)); ig.setAttribute('aFly', new THREE.InstancedBufferAttribute(aFly, 4)); ig.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); ig.instanceCount = Math.max(n, 1);
        const m = new THREE.Mesh(ig, dotMat); m.frustumCulled = false; m.name = 'swell-dots-' + DOT_NAMES[ci]; scene.add(m); });
      await ctx.yield();
    }

    // ---- PLOVERS (and, on the evening look, cranes): paper bodies with two indigo wing strokes, in files of nine.
    // Every bird keeps a LANE laid beside the route: its metre of route s, its metres right of the line (a) and above
    // it (h). s = lane start + ( s0 + k * (metres flown - f0) + v * clock ) wrapped over the lane's span: the overtaking
    // file and the burst from the lip read only the metres flown (v 0); the streaming files loop on the clock (k 0).
    // No lane comes nearer the line than 3.6 m at the bird's middle (3 m at a wing tip), none starts behind the entry.
    const birdLanes = [];                 // { s0, k, f0, v, mA, span, a, h, size, lo, hi, gate } for the count
    const NR = 72, routeTab = []; for (let i = 0; i < NR; i++) routeTab.push(path.posAtDist(i * L / (NR - 1), new THREE.Vector3()));
    const birdU = { ...U, uRoute: { value: routeTab }, uRouteStep: { value: L / (NR - 1) } };
    { const br = rng.fork('birds');
      const file = (n, o, tight) => { const da = tight ? -br.range(0.02, 0.2) * (o.a > 0 ? -1 : 1) : br.range(-0.25, 0.25), dh = tight ? br.range(-0.05, 0.05) : br.range(-0.12, 0.12);
        for (let j = 0; j < n; j++) birdLanes.push({ ...o, s0: o.s0 - j * (1.6 * o.size / 0.7), a: o.a + da * j, h: o.h + dh * j + (j % 2) * 0.12, fp: br.range(0, TAU) }); };
      // the overtaking file: 3 m left (nearest wing tip), gaining 2 m on us for every 7 m we fly; abeam at 70 m, born of the foam past the entry
      file(9, { s0: 70 + 6.4, k: 9 / 7, f0: 70, v: 0, mA: -4000, span: 1e5, a: -3.75, h: 0.3, size: 0.7, lo: 3, hi: 215, gate: -100 }, true);
      // streaming files on lanes fixed in the sea: the open sea to the left of the swells and hills, and the lee
      const nFiles = Math.min(TRI.files, Math.round(18 * Math.min(1, detail + 0.2) * density));
      for (let f = 0; f < nFiles; f++) { const lee = f % 3 === 2, mA = lee ? 404 : 4, span = lee ? 132 : 200;
        file(9, { s0: br.range(0, span), k: 0, f0: 0, v: br.range(7, 12), mA, span, a: -br.range(lee ? 9 : 12, lee ? 60 : 72), h: lee ? br.range(0, 8) : br.range(1, 9), size: 0.7, lo: mA + 0.5, hi: mA + span - 0.5, gate: -100 }); }
      if (look === 'evening') for (let c = 0; c < TRI.cranes; c++) { const lee = c % 4 === 3, mA = lee ? 404 : 6, span = lee ? 130 : 196;
        birdLanes.push({ s0: br.range(0, span), k: 0, f0: 0, v: br.range(5, 7), mA, span, a: -br.range(45, 115), h: br.range(8, 22), size: 1.8, lo: mA + 0.5, hi: mA + span - 0.5, gate: -100, fp: br.range(0, TAU) }); }
      // the burst at 380 m: the last claws of the lip let go as plovers that outrun us (the whole lip, TRI.burst of them, on the rare visit)
      const nBurst = rare ? TRI.burst : Math.round(45 * density);
      for (let b = 0; b < nBurst; b++) { let a = 0, h = 0; for (let t = 0; t < 20; t++) { a = -br.range(3.4, 11.5); h = br.range(-3.6, 5); if (Math.hypot(a, h) >= 3.75) break; a = -9; h = 2; }
        birdLanes.push({ s0: br.range(rare ? 296 : 346, 392), k: br.range(1.35, 1.75), f0: 380, v: 0, mA: -4000, span: 1e5, a, h, size: 0.7, lo: 280, hi: L - 28, gate: 376 + br.range(0, rare ? 16 : 8), fp: br.range(0, TAU) }); }
      // THE FILES INTO THE WHEEL (fix round 3): files of nine on lanes close beside the line (3.8 to 9 m off it, to port from
      // 452 m of route, to starboard from 492 m, past the spit's last pine), looping on the clock, that fly on into the
      // wheel's eye and are gone 1 m short of its plane; every bird's middle 3.75 m from the line or more
      { const bw = rng.fork('birds-wheel'), nW = Math.round(TRI.wheel * Math.min(1, detail + 0.2));
        for (let f = 0; f < nW; f++) { const stb = f % 3 === 2, mA = stb ? 492 : 452, span = L - 1 - mA; let a = 0, h = 0;
          for (let t = 0; t < 20; t++) { a = (stb ? 1 : -1) * bw.range(3.8, stb ? 6.5 : 9); h = bw.range(-2.2, 4.5); if (Math.hypot(a, h) >= 4.4) break; a = stb ? 5 : -6; h = 3; }
          const o = { s0: bw.range(0, span), k: 0, f0: 0, v: bw.range(9, 14), mA, span, a, h, size: 0.7, lo: mA + 0.5, hi: mA + span, gate: -100 }, dh = bw.range(-0.04, 0.04), da = (stb ? 1 : -1) * bw.range(0.02, 0.18);
          for (let j = 0; j < 9; j++) birdLanes.push({ ...o, s0: o.s0 - j * 1.6, a: o.a + da * j, h: o.h + dh * j + (j % 2) * 0.12, fp: bw.range(0, TAU), wheel: 1 }); } }
      // the bird: a stretched body, two solid wings, an indigo stroke lying on each wing (unit wingspan). Every corner
      // carries its metres to the bird's outline (aE, in wingspans), so the cut line round the bird is drawn in the
      // bird's own material: 2 cm wide, never under 1.5 px by the pixel's footprint (fwidth), as on every other body.
      const pos = [], ink = [], flap = [], edge = [];
      const tri = (a, b, c, k, fl, ea = 0, eb = 0, ec = 0) => { for (const p of [a, b, c]) { pos.push(p[0], p[1], p[2]); ink.push(k); flap.push(fl); } edge.push(ea, eb, ec); };
      const F = [0, 0, -0.26], B = [0, 0.01, 0.24], R = [0.055, 0, 0], Lf = [-0.055, 0, 0], Tp = [0, 0.05, -0.02], Bt = [0, -0.045, 0];
      for (const [a, b, c] of [[F, R, Tp], [R, B, Tp], [B, Lf, Tp], [Lf, F, Tp], [R, F, Bt], [B, R, Bt], [Lf, B, Bt], [F, Lf, Bt]]) tri(a, b, c, 0, 0, 0, 0, 0.05);
      for (const sd of [1, -1]) { const rf = [0.04 * sd, 0.012, -0.1], rb = [0.04 * sd, 0.012, 0.1], tip = [0.5 * sd, 0.012, 0.07], mt = [0.2 * sd, 0.035, -0.02], cb = [0.19 * sd, 0.012, 0.023];
        const w = (a, b, c, k, ea, eb, ec) => (sd > 0 ? tri(a, b, c, k, sd, ea, eb, ec) : tri(a, c, b, k, sd, ea, ec, eb));
        w(rf, mt, tip, 0, 0, 0.06, 0); w(rb, tip, mt, 0, 0, 0, 0.06); w(rf, rb, mt, 0, 0, 0, 0.06);
        w(rf, tip, cb, 0, 0, 0, 0.05); w(tip, rb, cb, 0, 0, 0, 0.05); w(rb, rf, cb, 0, 0, 0, 0.05);
        const s0 = [0.1 * sd, 0.042, -0.085], s1 = [0.47 * sd, 0.03, 0.055], s2 = [0.14 * sd, 0.045, -0.015], s3 = [0.3 * sd, 0.05, -0.03];
        w(s0, s3, s1, 1, 9, 9, 9); w(s0, s1, s2, 1, 9, 9, 9); }
      const N = birdLanes.length, aA = new Float32Array(N * 4), aB = new Float32Array(N * 4), aC = new Float32Array(N * 4), aD = new Float32Array(N * 2);
      birdLanes.forEach((b, i) => { aA.set([b.s0, b.k, b.f0, b.v], i * 4); aB.set([b.mA, b.span, b.a, b.h], i * 4); aC.set([b.size, b.fp, b.lo, b.hi], i * 4); aD.set([b.gate, b.fp * 1.7], i * 2); });
      const ig = new THREE.InstancedBufferGeometry();
      ig.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ig.setAttribute('aE', new THREE.Float32BufferAttribute(edge, 1));
      ig.setAttribute('aInk', new THREE.Float32BufferAttribute(ink, 1)); ig.setAttribute('aFlap', new THREE.Float32BufferAttribute(flap, 1));
      ig.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); ig.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
      ig.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); ig.setAttribute('aD', new THREE.InstancedBufferAttribute(aD, 2)); ig.instanceCount = N;
      const BIRD_VERT = /* glsl */`
attribute vec4 aA, aB, aC; attribute vec2 aD; attribute float aInk, aFlap, aE;
uniform vec3 uRoute[${NR}]; uniform float uRouteStep;
varying float vInk, vE;
${PRINT_GLSL}
vec3 routeAt(float s){ float x = clamp(s / uRouteStep, 0., ${(NR - 1.001).toFixed(3)}); int i = int(floor(x)); return mix(uRoute[i], uRoute[i + 1], x - float(i)); }
void main(){
  float s = aB.x + mod(aA.x - aB.x + aA.y * (uFlown - aA.z) + aA.w * uTime, max(aB.y, 1.));
  vec3 P = routeAt(s), tg = routeAt(s + 1.) - routeAt(s - 1.); tg.y *= .5;
  tg /= max(length(tg), 1e-4); vec2 r2 = vec2(-tg.z, tg.x) / max(length(tg.xz), 1e-4);
  vec3 Rt = vec3(r2.x, 0., r2.y), Upv = cross(Rt, tg);
  float sc = aC.x * smoothstep(aC.z, aC.z + 8., s) * (1. - smoothstep(aC.w - 8., aC.w, s)) * smoothstep(aD.x, aD.x + 6., uFlown);
  float ang = aFlap * (.8 * sin(uTime * (9. / max(aC.x, .5)) * .7 + aC.y) + .12), ca = cos(ang), sa = sin(ang);
  vec3 p = vec3(position.x * ca - position.y * sa, position.y * ca + position.x * sa, position.z);
  vec3 c = P + Rt * aB.z + vec3(0., aB.w + .15 * sin(uTime * 1.7 + aD.y), 0.);
  vec3 wp = c + (Rt * p.x + Upv * p.y - tg * p.z) * sc;
  vInk = aInk; vE = aE * sc;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
      const BIRD_FRAG = /* glsl */`varying float vInk, vE;
${PRINT_GLSL}
void main(){ float fe = max(fwidth(vE), 1e-5), W = max(.02, 1.5 * fe), ln = 1. - smoothstep(W - .6 * fe, W + .6 * fe, vE);
  gl_FragColor = vec4(mix(uPaper, uKey, max(step(.5, vInk), ln)), 1.); }`;
      const body = new THREE.Mesh(ig, new THREE.ShaderMaterial({ uniforms: birdU, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide }));
      body.frustumCulled = false; body.name = 'plovers'; scene.add(body);
      await ctx.yield();
    }

    // ---- THE YELLOW BOATS: four long open boats (five on the evening look), 15 to 17.6 m, flat yellow hulls with upturned bows, each
    // with fourteen rowers in two rows (plain bent humps of pale blue: no faces, no limbs), oars as ribbons beating
    // together. They ride the hills of water on lanes 29.6 to 64 m left of the entry's axis, rowing the way we fly.
    // A BOAT'S PLACE IS A LAW OF THE METRES FLOWN (BOAT_LAW, boatAt: its metres ahead of the entry by the metres flown, to 215 m
    // flown, where it stays); the hull rides its water, pitching with the slope under it, bow up the face. On the
    // world's clock, as loops: the oars' beat, a little roll, the spray dots flung from the bow. No boat comes nearer
    // the flown line than 22 m at any metre flown (counted, hull, rowers and oars).
    const nBoats = look === 'evening' ? 5 : 4, BOAT_L = 16;
    // metres ahead of the entry (M) by the metres flown, boat by boat: [flown, M] knots joined by a monotone curve, on a lane
    // X metres right of the entry's axis. Boats 0 and 1 (the pair) lie behind the first hill (150 to 157 m ahead of the entry)
    // until we are over it, then row up the second hill's face 32 to 25 m ahead of us while we cross the valley and climb
    // (125 to 172 m flown), go over its crest as we reach it (we close to 24 m at 200 m flown), and away down its back,
    // bearing left from 218 m of their way. Boat 2 crests the hill further out and is passed; boat 3 (and on an evening
    // boat 4) climbs the face further out still.
    const BOAT_LAW = [[-29.6, [[0, 150], [100, 153], [125, 157], [140, 166], [150, 175], [160, 184], [165, 188], [170, 191.5], [175, 195], [180, 199], [185, 204], [190, 210], [195, 216], [205, 228], [215, 238]]],
      [-38.2, [[0, 152], [100, 155], [125, 159], [140, 168], [150, 176.5], [160, 185], [165, 189], [170, 192.5], [175, 196.5], [180, 200.5], [185, 205.5], [190, 211.5], [195, 217.5], [205, 229.5], [215, 239]]],
      [-46.8, [[0, 158], [125, 181], [150, 188], [170, 192], [190, 199], [215, 205]]],
      [-55.4, [[0, 150], [125, 172], [150, 181], [170, 187], [215, 198]]],
      [-64, [[0, 140], [125, 160], [170, 178], [215, 190]]]];
    // THE SECOND GROUP (fix round 3): two boats on the starboard swells of the open sea, on lanes 28.6 and 37.4 m right of the
    // entry's axis (the line is that axis until 205 m, so by the law itself no part of hull, rower or oar, 4.7 m at most from
    // the lane, comes within 22 m of the flown line), rowing the way we fly and slower: 47 and 60 m ahead of the entry when
    // we enter, passed at about 100 m flown, lying 103 and 106 m ahead of the entry, short of the first hill's face, from 130 m on.
    const BOAT_LAW2 = [[28.6, [[0, 47], [15, 56], [45, 76], [75, 92], [100, 100], [130, 103]]], [37.4, [[0, 60], [15, 69], [45, 88], [75, 100], [100, 104.5], [130, 106]]]];
    const boats = []; { const bo = rng.fork('boats'); for (let i = 0; i < nBoats; i++) boats.push({ X: BOAT_LAW[i][0] - bo.range(0, 0.5), law: BOAT_LAW[i][1], dM: bo.range(-0.4, 0.4), yaw: 0, s: bo.range(0.94, 1.1), ph: bo.range(0, TAU) });
      for (const [X, law] of BOAT_LAW2) boats.push({ X: X + bo.range(0, 0.5), law, dM: bo.range(-0.4, 0.4), yaw: 0, s: bo.range(0.94, 1.1), ph: bo.range(0, TAU) }); }
    const nAll = boats.length;
    // a monotone curve through knots [x, y] (Fritsch and Carlson): no overshoot, so a boat never rows backwards
    const mono = (K, x) => { const n = K.length; if (x <= K[0][0]) return K[0][1]; if (x >= K[n - 1][0]) return K[n - 1][1]; let i = 0; while (x > K[i + 1][0]) i++;
      const sl = (j) => (K[j + 1][1] - K[j][1]) / (K[j + 1][0] - K[j][0]), tg = (j) => { if (j === 0) return sl(0); if (j === n - 1) return sl(n - 2); const a = sl(j - 1), b = sl(j); return a * b <= 0 ? 0 : 2 * a * b / (a + b); };
      const h = K[i + 1][0] - K[i][0], t = (x - K[i][0]) / h, t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * tg(i) + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * tg(i + 1); };
    // the hull RIDES ITS WATER: it lies along the slope under it (the water 5 m ahead and astern) and is lifted until no part
    // of its length sits under the water it floats on
    const boatAt = (b, flown, out = {}) => { const M = mono(b.law, flown) + b.dM, tv = clamp((M - 218) / 30, 0, 1), x = place.p0.x + b.X - 20 * tv * tv * (3 - 2 * tv), z = place.p0.z - M;
      const yaw = Math.atan2(20 * 6 * tv * (1 - tv) / 30, 1), hx = -Math.sin(yaw), hz = -Math.cos(yaw);        // from 218 to 248 m ahead of the entry the lane bears 20 m to the left, away from the line's own turn
      const wy = (d) => { const r = place.routeOf(x + hx * d, z + hz * d); return place.seaY(r.m, r.a, x + hx * d, z + hz * d); };
      const y1 = wy(-5), y2 = wy(5), sl = (y2 - y1) / 10, y0 = 0.5 * (y1 + y2); let lift = 0; for (let d = -7.5; d <= 7.5; d += 2.5) lift = Math.max(lift, wy(d) - (y0 + sl * d));
      out.x = x; out.y = y0 + lift + 0.3; out.z = z; out.pitch = clamp(Math.atan(sl), -0.42, 0.42); out.yaw = yaw; out.len = BOAT_L * b.s; out.M = M; out.hx = hx; out.hz = hz; return out; };
    { const F = { pos: [], nor: [], pr: [], idx: [] }, NSt = 15, HL = BOAT_L / 2;
      // hull: a five-point section lofted along 16 m, the bow (local -z) drawn out to a point and upturned 1.6 m, the stern lower
      for (let i = 0; i < NSt; i++) { const t = i / (NSt - 1) * 2 - 1, z = t * HL, w = 1.25 * Math.pow(Math.max(1 - t * t, 0), 0.5) * (1 - 0.3 * Math.pow(Math.max(-t, 0), 3)) + 0.03, up = t < 0 ? 1.8 * Math.pow(-t, 2.6) : 0.8 * t * t * t, g = 0.7 + up, kY = -0.35 + up * 0.92;
        const ring = [[-w, g, 0], [0, kY, 0.62], [w, g, 0], [0.8 * w, g - 0.18, 0.2], [-0.8 * w, g - 0.18, 0.2]];
        for (const [x, y, e] of ring) { F.pos.push(x, y, z); const nl = Math.hypot(x, y - g + 0.3) || 1; F.nor.push(x / nl, (y - g + 0.3) / nl, 0); F.pr.push(INK.yellow, e, z, x + y); } }
      for (let i = 0; i < NSt - 1; i++) for (let s = 0; s < 5; s++) { const a = i * 5 + s, c = i * 5 + (s + 1) % 5; F.idx.push(a, c, a + 5, c, c + 5, a + 5); }
      // fourteen rowers in two files: plain bent humps of pale blue, their backs a metre over the gunwale; no faces, no limbs
      const hump = new THREE.SphereGeometry(1, 6, 4), hp = hump.attributes.position, hi = hump.index;
      for (let r = 0; r < 14; r++) { const b = F.pos.length / 3, rx = (r % 2 ? 0.5 : -0.5), rz = -4.9 + Math.floor(r / 2) * 1.55 + (r % 2) * 0.5;
        for (let v = 0; v < hp.count; v++) { const x = hp.getX(v), y = hp.getY(v), z = hp.getZ(v), yy = Math.max(y, -0.35);
          F.pos.push(rx + x * 0.44, 0.55 + (yy + 0.35) * 0.86, rz + z * 0.52 - (yy + 0.35) * (yy + 0.35) * 0.3); F.nor.push(x, y, z); F.pr.push(INK.pale, 99, y, x); }
        for (let k = 0; k < hi.count; k++) F.idx.push(b + hi.getX(k)); }
      hump.dispose();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(F.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(F.nor, 3));
      g.setAttribute('aPrint', new THREE.Float32BufferAttribute(F.pr, 4)); g.setIndex(F.idx);
      const hulls = new THREE.InstancedMesh(g, printMaterial(U, { size: 'boat', rim: 0 }), nAll); hulls.frustumCulled = false; hulls.name = 'boats'; scene.add(hulls);
      // oars: thin solid ribbons in key indigo, six a side, beating together
      const NO = 12, og = new THREE.BoxGeometry(0.1, 0.07, 3.3); og.translate(0, 0, 1.65); { const n = og.attributes.position.count, pr = new Float32Array(n * 4); for (let i = 0; i < n; i++) pr.set([INK.key, 99, 0, 0], i * 4); og.setAttribute('aPrint', new THREE.BufferAttribute(pr, 4)); }
      const oars = new THREE.InstancedMesh(og, printMaterial(U, { size: 'boat', lineWidth: 0, slip: 0 }), nAll * NO); oars.frustumCulled = false; oars.name = 'oars'; scene.add(oars);
      // spray: paper dots, small solids (the twenty-faced one: no wider than 0.35 m, 20 m and more from the line), flung from the bow and falling to the water (born at nothing, dying at nothing); more as the bow climbs
      const NSP = 16, sg = new THREE.IcosahedronGeometry(1, 0); { const n = sg.attributes.position.count, pr = new Float32Array(n * 4); for (let i = 0; i < n; i++) pr.set([INK.paper, 99, 0, 0], i * 4); sg.setAttribute('aPrint', new THREE.BufferAttribute(pr, 4)); }
      const spray = new THREE.InstancedMesh(sg, printMaterial(U, { size: 'claw', lineWidth: 0, slip: 0 }), nAll * NSP); spray.frustumCulled = false; spray.name = 'boat-spray'; scene.add(spray);
      const sp = rng.fork('boat-spray'), SPR = []; for (let i = 0; i < nAll * NSP; i++) SPR.push({ per: sp.range(0.9, 1.7), ph: sp(), side: sp.range(-1.5, 1.5), up: sp.range(1.4, 3.6), back: sp.range(0.5, 3.5), r: sp.range(0.09, 0.16) });
      const mB = new THREE.Matrix4(), mO = new THREE.Matrix4(), mL = new THREE.Matrix4(), eul = new THREE.Euler(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1), one = new THREE.Vector3(1, 1, 1), st = {};
      ticks.push((dt, time, camera, u, flown) => {
        for (let i = 0; i < nAll; i++) { const b = boats[i]; boatAt(b, flown, st);
          eul.set(st.pitch, st.yaw, 0.05 * Math.sin(time * 0.9 + b.ph), 'YXZ'); q.setFromEuler(eul); mB.compose(v.set(st.x, st.y, st.z), q, sc.setScalar(b.s)); hulls.setMatrixAt(i, mB);
          const beat = Math.sin(time * 2.1), dip = Math.cos(time * 2.1);
          for (let o = 0; o < NO; o++) { const sd = o % 2 ? 1 : -1, oz = -4.6 + Math.floor(o / 2) * 1.55 + (o % 2) * 0.4;
            eul.set(0.3 - 0.16 * dip, sd * (Math.PI / 2 - 0.45 * beat), 0, 'YXZ'); q.setFromEuler(eul); mL.compose(v.set(sd * 1.1, 0.86, oz), q, one); mO.multiplyMatrices(mB, mL); oars.setMatrixAt(i * NO + o, mO); }
          const gate = 0.45 + 0.55 * smoothstep(0.02, 0.2, st.pitch);
          for (let k = 0; k < NSP; k++) { const d = SPR[i * NSP + k], tau = (time / d.per + d.ph) % 1, sz = d.r * Math.sqrt(Math.max(Math.sin(Math.PI * tau), 0)) * gate;
            mL.compose(v.set(d.side * tau, 2.2 + d.up * tau - (2.6 + d.up) * tau * tau, -HL + 0.4 + d.back * tau), q.set(0, 0, 0, 1), sc.setScalar(sz)); mO.multiplyMatrices(mB, mL); spray.setMatrixAt(i * NSP + k, mO); } }
        hulls.instanceMatrix.needsUpdate = true; oars.instanceMatrix.needsUpdate = true; spray.instanceMatrix.needsUpdate = true; });
    }

    // ---- THE CONE: this world's own (broken top, one stepped shoulder, five snow tongues), 3,200 m off and 280 m high.
    // Pale blue before its red; the brown-red block comes onto its flank from 330 to 360 m flown; paper snow above, paper mist at its foot.
    const coneU = { ...U, uRedK: { value: 0 }, uPrint: { value: 0 }, uSnowy: { value: look === 'snow' ? 1 : 0 } };
    { const C = place.cone, NA = 64, NH = 14, pos = [], nor = [], pr = [], idx = [], toRoute = Math.atan2(place.p0.z - C.z, place.p0.x - C.x);
      for (let j = 0; j <= NH; j++) { const t = j / NH;
        for (let i = 0; i <= NA; i++) { const th = i / NA * TAU, rel = th - toRoute, shoulder = Math.exp(-Math.pow((Math.atan2(Math.sin(rel - 1.25), Math.cos(rel - 1.25))) / 0.5, 2));
          const topH = C.height * (1 - 0.09 * (0.5 + 0.5 * Math.sin(th * 3 + 1.3)) - 0.05 * Math.sin(th * 7 + 0.4)), y = SEA - 6 + (topH + 6) * t;
          const r = C.base * Math.pow(1 - t, 1.75) + 38 + 70 * shoulder * smoothstep(0.62, 0.5, t) * smoothstep(0.1, 0.45, t);
          pos.push(C.x + Math.cos(th) * r, y, C.z + Math.sin(th) * r); nor.push(Math.cos(th) * 0.55, 0.83, Math.sin(th) * 0.55); pr.push(t, rel, y - SEA, th); } }
      for (let j = 0; j < NH; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const b0 = pos.length / 3; pos.push(C.x, SEA + C.height * 0.9, C.z); nor.push(0, 1, 0); pr.push(1, 0, C.height, 0);
      for (let i = 0; i < NA; i++) idx.push(NH * (NA + 1) + i, b0, NH * (NA + 1) + i + 1);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aPrint', new THREE.Float32BufferAttribute(pr, 4)); g.setIndex(idx);
      const cone = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: coneU, side: THREE.DoubleSide, vertexShader: /* glsl */`
attribute vec4 aPrint; varying vec4 vP; varying vec3 vW, vN;
void main(){ vP = aPrint; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`, fragmentShader: /* glsl */`
varying vec4 vP; varying vec3 vW, vN;     // vP: height 0..1, angle from the side that faces the route, metres above the sea, angle
uniform float uRedK, uSnowy, uPrint;
${PRINT_GLSL}
void main(){
  float t = vP.x, ft = max(fwidth(t), 1e-5), a = vP.y;
  if (t < 1. - 1.02 * uPrint) discard;                 // the cone's blocks come down onto the sheet from its top, by the metres flown
  vec3 ddx = dFdx(vW), ddy = dFdy(vW); float pxm = sqrt(max(min(dot(ddx, ddx), dot(ddy, ddy)), 1e-10));
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4); vec3 n = vN / max(length(vN), 1e-4); float ndv = abs(dot(n, V)), fn = fwidth(ndv);
  // five snow tongues: the snow line dips and climbs round the cone
  float tong = abs(fract(vP.w * 5. / 6.28318 + .13) - .5) * 2.;
  float snowLine = mix(.46, .7, tong * tong) - .34 * uSnowy, es = t - snowLine;
  // the red block is printed across the flank by the metres flown: a hard edge that crosses from one side to the other
  float redOn = step(sin(a) * .5 + .5, uRedK * 1.25 - .1) * mix(1., step(abs(es + .09), .035), uSnowy);
  vec3 col = mix(uPale, uRed, redOn);
  col = mix(col, uKey, 1. - smoothstep(1.5 * ft, 2.5 * ft, abs(es)));
  col = mix(col, uPaper, smoothstep(-ft, ft, es));
  float mist = .2 + .05 * sin(vP.w * 9. + 1.) * sin(vP.w * 4. + .3);
  col = mix(col, uPaper, 1. - smoothstep(-ft, ft, t - mist));
  col = mix(col, uKey, hwRim(ndv, 900., 2.2, pxm, fn) * smoothstep(mist, mist + .05, t));
  gl_FragColor = vec4(col, 1.);
}` })); cone.frustumCulled = false; cone.name = 'cone'; scene.add(cone);
      ticks.push((dt, time, camera, u, flown) => { coneU.uRedK.value = smoothstep(330, 360, flown); coneU.uPrint.value = smoothstep(306, 334, flown); });
    }

    // ---- SNOW (the snow-morning look): the same paper dot in the same three solids, round by its own shape, falling along
    // the whole route in lanes fixed at build, none within 3.6 m of the line in plan, so a tube round the line is clear from
    // end to end. On the other looks two lanes are dealt and stand at no size: they keep the meshes and their program made
    // at build (nothing is made after it).
    const snowLanes = [];
    const SNOW_VERT = /* glsl */`
attribute vec4 aFrom, aT;
varying vec3 vB;
uniform float uTime, uOn;
void main(){ float tau = fract(uTime / max(aT.y, .5) + aT.z), sz = aFrom.w * sqrt(max(sin(3.14159 * tau), 0.)) * uOn;
  vec3 c = aFrom.xyz + vec3(aT.w * .35 * sin(tau * 6.28318 + aT.z * 40.), -aT.x * tau, 0.);
  vB = vec3(0., 9., 0.);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(c + position * sz, 1.); }`;
    { const sn = rng.fork('snow'), N = look === 'snow' ? Math.round(1370 * detail) : 2;
      const bins = [{ cap: TRI.snowBall, rows: [] }, { cap: TRI.snowGrain, rows: [] }, { cap: TRI.snowSpeck, rows: [] }];
      for (let i = 0, tries = 0; i < N && tries < N * 6; tries++) { const s = sn.range(4, L - 34), far = sn() < 0.5, a = (sn() < 0.62 ? -1 : 1) * (far ? sn.range(12, 46) : sn.range(3.7, 12)), r = sn.range(0.035, 0.13), per = sn.range(4, 7), ph = sn(), dr = sn.range(-0.8, 0.8);
        if (s > 196 && s < 402 && (a > 8 || (a < -8.5 && a > -15 && s > 276))) continue;      // the wall, the lip and its claws
        if (s > 416 && s < 502 && a > 3.8 - 0.01) continue;                                   // the spit
        const w = place.toWorld(s, a), water = place.seaY(s, a, w[0], w[1]), top = place.lineY(s) + (s > 280 && s < 396 && a > -8.5 ? sn.range(3, 9) : sn.range(4, 15));
        if (top - water < 3) continue;
        // the flake's class by its place, as every dot's: its radius over the metres from its lane to the line (the drift taken off)
        const row = { x: w[0], z: w[1], top, water, r, dr, s, a, per, ph }; if (!putDot(bins, r, Math.abs(a) - 0.35 * Math.abs(dr), row, far ? 1 : 0)) continue;
        snowLanes.push(row); i++; }
      const snowMat = new THREE.ShaderMaterial({ uniforms: { ...U, uLineW: { value: 0.01 }, uLine: { value: 0 }, uOn: { value: look === 'snow' ? 1 : 0 } }, fragmentShader: BODY_FRAG, vertexShader: SNOW_VERT });
      bins.forEach((b, ci) => { const n = b.rows.length, aFrom = new Float32Array(Math.max(n, 1) * 4), aT = new Float32Array(Math.max(n, 1) * 4);
        b.rows.forEach((d, i) => { aFrom.set([d.x, d.top, d.z, d.r], i * 4); aT.set([d.top - d.water, d.per, d.ph, d.dr], i * 4); });
        if (!n) { aFrom.set([0, -50, 0, 0]); aT.set([1, 5, 0, 0]); }
        const g = dotGeos[ci], ig = new THREE.InstancedBufferGeometry(); ig.index = g.index; ig.setAttribute('position', g.attributes.position);
        ig.setAttribute('aFrom', new THREE.InstancedBufferAttribute(aFrom, 4)); ig.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4)); ig.instanceCount = Math.max(1, n);
        const m = new THREE.Mesh(ig, snowMat); m.frustumCulled = false; m.name = 'snow-' + DOT_NAMES[ci]; scene.add(m); });
      await ctx.yield();
    }

    // ---- the flight
    const pace = (u) => { const m = u * L; return 1 + 0.15 * smoothstep(100, 135, m) * (1 - smoothstep(262, 296, m)) - 0.2 * smoothstep(275, 305, m) * (1 - smoothstep(378, 410, m)); };
    // THE GAZE KEYS: every key is metres of route over the route's length, at the places the journey means
    // SUM: THE COUNT OF TRIANGLES BY THE TEXT. The greatest value of every count a draw scales (TRI and the tables), times
    // its faces, and the parts that never change:
    //   the wave's sheet 57,600 (96 by 300 cells) + its claws 46,512 (456 of 102) + its dots 20,000 (80 of 120, 520 of 20)
    //   + the wheel 12,192 (4,032 and 160 claws of 51) + the sky 1,216 + the sea 79,032
    //   + the rock 5,824 (twenty-one masses, twice its columns by its rows each) + the pines 4,308 (eleven trunks of 40,
    //     at most 53 boughs of 20, at most 117 pads of 24) + the fall 720 + the cone 1,856
    //   + swell claws 91,800 (TRI.clawNear of 51) + 60,000 (TRI.clawFar of 30)
    //   + dots 55,000 (TRI.dotBall of 120, dotGrain of 20, dotSpeck of 8)
    //   + plovers 20,304 (24 faces: the overtaking nine, TRI.files and TRI.wheel files of nine, TRI.cranes, TRI.burst)
    //   + boats 4,508 (seven of 644) + oars 1,008 (twelve of 12 to a boat) + boat spray 2,240 (sixteen of 20 to a boat)
    //   + snow 30,000 (TRI.snowBall of 120, snowGrain of 20, snowSpeck of 8)
    //   = 494,120 (no deal holds them all: the snow, the cranes and the fifth boat are of different looks).
    const SUM = { 'wave-sheet': 57600, 'wave-claws': 46512, 'wave-dots-ball': 9600, 'wave-dots': 10400, wheel: 12192, 'paper-sky': 1216, sea: 79032, 'spit-rock': 5824,
      'pine-wood': 1500, 'pine-pads': 2808, 'fall-ropes': 720, cone: 1856, 'swell-claws': TRI.clawNear * 51, 'swell-claws-far': TRI.clawFar * 30,
      'swell-dots-ball': TRI.dotBall * 120, 'swell-dots-grain': TRI.dotGrain * 20, 'swell-dots-speck': TRI.dotSpeck * 8,
      plovers: 24 * (9 + 9 * TRI.files + 9 * TRI.wheel + TRI.cranes + TRI.burst), boats: 7 * 644, oars: 7 * 144, 'boat-spray': 7 * 320,
      'snow-ball': TRI.snowBall * 120, 'snow-grain': TRI.snowGrain * 20, 'snow-speck': TRI.snowSpeck * 8 };
    const pois = [];
    { const sp = [0, 0, 0], V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
      const wallTop = V(hero.sectionAt(236, 0.3, 187, sp));
      const seaFoot = V([wallTop.x, SEA, wallTop.z]);
      pois.push({ at: seaFoot, from: 57 / L, to: 147 / L, weight: 0.6 });                                                    // the foot of the great wave over the hills: the gaze stays on the sea
      pois.push({ at: wallTop, from: 113 / L, to: 209 / L, weight: 0.2 });                                                   // the wall revealed across the way
      pois.push({ at: (time, u) => V(hero.sectionAt(Math.min(u * L + 95, 421), 0.5, u * L, sp)), from: 220 / L, to: 299 / L, weight: 0.3 });    // the lip throwing over ahead
      pois.push({ at: (time, u) => V(hero.sectionAt(u * L + 24, 0.5, u * L, sp)), from: 262 / L, to: 332 / L, weight: 0.6 });              // the lip's hanging claws ahead on the left
      pois.push({ at: (time, u) => V(hero.sectionAt(Math.min(u * L + 46, 421), 0.21, u * L, sp)), from: 328 / L, to: 400 / L, weight: 0.42 });   // the roof's crown ahead, to the mouth's rim
    }
    // THE BOATS: the gaze is drawn to the pair's own place at that metre flown (the place between boats 0 and 1, at their
    // rowers' backs), most strongly from the valley to the hill's back, where they race beside us
    { const o = new THREE.Vector3(), sa = {}, sb = {};
      const at = (time, u) => { const f = u * L; boatAt(boats[0], f, sa); boatAt(boats[1], f, sb); return o.set(0.5 * (sa.x + sb.x), 0.5 * (sa.y + sb.y) + 0.8, 0.5 * (sa.z + sb.z)); };
      pois.push({ at, from: 96 / L, to: 214 / L, fade: 0.12, weight: 0.32 });
      pois.push({ at, from: 148 / L, to: 214 / L, fade: 0.27, weight: 0.3 }); }
    // THE SECOND GROUP: the gaze is drawn a little to starboard, to the place between its two boats at that metre flown, from 12 to 86 m
    { const o = new THREE.Vector3(), sa = {}, sb = {};
      pois.push({ at: (time, u) => { const f = u * L; boatAt(boats[nAll - 2], f, sa); boatAt(boats[nAll - 1], f, sb); return o.set(0.5 * (sa.x + sb.x), 0.5 * (sa.y + sb.y) + 0.8, 0.5 * (sa.z + sb.z)); }, from: 12 / L, to: 86 / L, fade: 0.25, weight: 0.3 }); }
    const update = (dt, time, camera, u) => {
      const flown = clamp(u, 0, 1) * L;                     // THE LAW OF METRES
      hero.setFlown(flown); hero.update(dt, time, camera); setWipe(flown);
      for (let i = 0; i < ticks.length; i++) ticks[i](dt, time, camera, u, flown);
    };
    update(0, 0, null, 0);
    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.3, far: 9000, nearThrough: 0.3, bank: 0.8 },   // the bank into a turn: eight tenths of the engine's own (5.6 deg at most past the spit)
      pois,
      portal: { shape: 'circle', radius: 7, style: 'ring', glow: 0, halo: false, color: PALETTE[6], veil: PALETTE[6], revealDistance: 165, drawWithin: 170 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none', look,
      update,
      dispose() { hero.dispose(); },
      // lists of every body's place, for the print-only count of clear air (shots/hollow-of-the-wave/tmp/clear.mjs)
      count: { place, hero, clawList, dotLanes, birdLanes, boats, boatAt, BOAT_L, rockMasses, rockGeo, pineGeo, ropeBodies, snowLanes, TRI, SUM },
    };
  },
};
