// city-closing-overhead, LIGHT AND FAR LAND (builder C): makeLight, makeFar, makeGlow (the design's section 8).
// EVERY x IS WORLD x (we fly toward +z; the hinge and the curl are at +x, the open side with its afterglow at -x).
//
// THE ONE RULE OF THE HANGING HALF (the owner's line 5), kept everywhere in this file, the flat town included:
//   UP IS AWAY FROM ONE'S OWN GROUND. Smoke leaves its roof along its ground's normal (overhead it comes down toward
//   us), then drifts toward +z at 0.8 m/s; fountain water lies still in its basin; lamps and trees stand along the
//   same normal.
// Here: a lamp's light stands h metres along its ground's normal (the bend's own axes at its a); a puff of smoke
// rises along that same normal and only then drifts along +z, which lies in every ground's own plane.
//
// THE HOUR: the blue hour, no sun in the sky, no shadow pass. Light you can see: lit panes (plain panes, nothing
// lettered), a street wash on every wall, floods on the towers and the hall, lamp sprites, and the afterglow.
// WHAT READS THE EYE'S PLACE HERE (the design's section 13), and nothing else does:
//  - fwidth on a face's own coordinates: a pane, a door and a roof's tiles are filtered by the pixel's footprint, and
//    a cell under the footprint gives its MEAN (so far and overhead fronts glow and never sparkle);
//  - THE SPRITES' FACING: a lamp's glow is a ball of lit air, drawn as a quad turned to the eye, its size in true metres;
//  - THE SPRITES' FOOTPRINT FILTER: a core smaller than 2.5 pixels is drawn 2.5 pixels wide with its radiance times
//    (true area / drawn area): the same light, never more, so a far lamp neither vanishes nor shimmers;
//  - THE LANTERN'S DEPTH: a lamp's sprite is depth-tested its own CORE RADIUS (true metres, the same at every
//    distance) nearer the eye than its middle; a puff by its own radius in metres; a pool of light not at all;
//  - AIR BY DISTANCE: the scene's own fog on every surface and on the smoke; on a lamp's sprite the same law at 0.4
//    of the air's density, named here as THE MEDIUM'S OWN LAW: a lamp is a source, and the haze that dims a surface's
//    reflected light also scatters a source's light forward into its own halo, so its glow outlasts the wall it hangs on;
//  - THE LANTERN'S FORM is part of that footprint filter: a lantern under about 4 pixels wide is drawn as its point
//    (the one level-of-detail cut here; the pixel's footprint ALONE decides it: the form stands whole whatever the
//    gaze). Its up is the lamp's own up as it falls on the sprite's plane (the facing above), nothing more;
//  - A PUFF'S AND THE RIM-LIGHT'S SHADING, THE ROLL'S OWN AIR AND THE RING'S WASH take the afterglow's way and a
//    face's place back and forth between the world and the eye's frame (viewMatrix, cameraPosition): the light, the
//    air and the place are the world's, not the eye's (the same from wherever they are seen);
//  - fwidth on the far plain's own metres (its fields, hedges and lanes to their mean);
//  - the dome round the camera (the kit's sky).
// All else reads ctx time alone: panes light one by one and never go out; nothing twinkles or wavers.
import * as THREE from 'three';
import { makeSky } from '../kit/sky.js';
import { BEND_GLSL, B0, bendKnots, bendAt, PLAN } from './city-closing-overhead.js';

const PI = Math.PI, DEG = PI / 180;
const lin = (hex) => new THREE.Color(hex);                    // an sRGB hex as the renderer's linear colour

// THE AFTERGLOW'S PLACE (section 5): the sun 5 deg under the horizon, 25 deg off +z toward the open side (-x), so the
// glow's core stands beside the ring. The kit's azimuth: 0 looks down -z, +90 is +x; +z is 180 and -x is 270.
export const GLOW_AZIMUTH = 205, SUN_UNDER = -5, GLOW_LIGHT_UP = 6;
// the two glows a seed may deal (section 7): the band's colour and its core's
export const GLOWS = {
  rose: { core: '#ff8f6a', band: '#d9708a' },
  amber: { core: '#ffa24e', band: '#e08a5a' },
};
// the lamps' colours (section 5): old town, its halo, promenade and squares, the flat town's cool one in seven
const LAMP = { old: '#ffb057', halo: '#ff8a3a', pale: '#ffd9a0', cool: '#dfe8ff' };
// a house's ONE pane colour, by its seed: 55, 25, 12 and 8 in 100
const PANES = ['#ffbe6e', '#ff9a48', '#ffe2b0', '#bfdcff'];

// ---------------------------------------------------------------- THE NIGHT'S GLSL (the house and tree programs)
// Seen from the core's programs: varying vec4 vFac (s along the face, h up it from its ground's line, the face's width
// when it has openings else 0, the eaves' height), varying vec2 vKind (the class, the house's seed), diffuseColor,
// totalEmissiveRadiance. Classes: 1 brick, 2 stucco, 3 lime, 4 garden wall, 5 hedge, 6 tower, 7 LIT PLAIN (its gain
// in the seed channel when over 1, else 2.5), 8 hall, 9 roof; 0 plain.
// Direct3D-safe: no loop, no pow, sqrt or normalize; every division by a clamped positive; exp of a clamped value.
const NIGHT_HELP = /* glsl */`
uniform float uClock; uniform vec3 uWash; uniform vec3 uFlood; uniform float uPaneGain; uniform vec3 uPaneC[4];
uniform vec3 uRimAt; uniform vec3 uRimC; uniform vec3 uGlow3;
uniform vec4 uRollAir; uniform vec2 uRollAt; uniform vec4 uRingAt; uniform vec3 uRingC; uniform vec3 uShade;
vec3 ntGlow;
float ntHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
// a box-filtered pulse: 1 where a < x < b, softened over the footprint w
float ntBox(float x, float a, float b, float w) { float k = 1.0 / max(w, 0.001); return clamp((x - a) * k + 0.5, 0.0, 1.0) * clamp((b - x) * k + 0.5, 0.0, 1.0); }
// box-filtered lines of width f (a share of the period) on a period-1 coordinate; their own mean f from 0.8 periods
float ntLines(float x, float w, float f) {
  float n = 1.0 / f, a = x + 0.5 * w, b = x - 0.5 * w;
  float c = clamp((floor(a) + min(fract(a) * n, 1.0) - floor(b) - min(fract(b) * n, 1.0)) / max(n * w, 0.0001), 0.0, 1.0);
  return mix(c, f, smoothstep(0.35, 0.8, w));
}
`;
// (the core's night hook declares vFac and vKind in both programs before these strings: they are not declared here)
// THE HOUSE'S COLOUR AND ITS LIGHT (one hash a fragment on a wall, two on a roof), in place of the old facade call:
//  - masonry: a soft unevenness on stucco and lime, a socle, bed courses on a garden wall, the eaves' tile courses;
//    every wall 30 in 100 darker in its lowest 0.6 m (grounding without shadows);
//  - OPENINGS cell by cell along the face (2.3 to 3.4 m) and floor by floor (3.1 m): a LIT WINDOW 1.3 by 1.7 m with
//    a pale surround, a timber frame, glazing bars and cloth (their figures stand at the pane's own lines below); on the ground floor ONE cell dealt by the seed holds a door for its pane (a
//    dark leaf 1.1 by 2.3 m; on one house in three a lit fanlight 1.1 by 0.5 m over it); a hall has one tall pane a cell;
//  - per house from its seed: lit share 0.60 to 0.95, shutters shut on one in ten (its rooms' light shows all the same
//    through the louvres, so a shut house is a lived-in one), wholly dark one in twenty,
//    radiance 2.5 to 5, ONE room tone of its own (the lead's ruling R1: an unlit pane is the exception);
//    each room its own steady brightness, 0.55 to 1 of the house's (the cell's one hash again: mean 0.775);
//  - PANES LIGHT ONE BY ONE and never go out: L(t) = 0.80 + 0.15 (1 - exp(-t / 40)); a pane is lit by
//    smoothstep(0, 0.004, L share / 0.775 - hash) (0.775 the mean share), so it comes on over about a second: no flash;
//  - UNDER THE FOOTPRINT a pane gives way to its ROW'S MEAN (its lit chance times its pane's share of the wall), by the
//    pane's own size in pixels: no sparkle and no dots; then THE ROLL'S OWN AIR by the place (the law stands below);
//  - THE STREET WASH: every wall adds its own colour x uWash (#ffb057 x 0.52) x exp(-h / 3), h the height up its own face;
//  - THE FLOOD (towers 6 and the hall 8): lamps at the foot, so its own colour x uFlood x 1.2 / (1 + (h / 20)^2):
//    whole at the foot, a half 17 m up, a fifth at 45 m, the top left to the dusk and its lit belfry (the lamps stand
//    about 20 m out from the shaft's foot: the inverse square from there); a tower's and the hall's brick is ONE
//    TONE on every face, with its true courses alone (0.075 m), to their mean by the footprint;
//  - LIT PLAIN (7): its own colour x its gain.
const NIGHT_HOUSE = /* glsl */`
  {
    float nCls = floor(vKind.x + 0.5), nSeed = vKind.y;
    float nS = vFac.x, nH = vFac.y, nW = vFac.z, nE = vFac.w;
    vec2 nFw = fwidth(vFac.xy); float ws = max(nFw.x, 0.0005), wh = max(nFw.y, 0.0005);
    vec3 nBase = diffuseColor.rgb, nCol = nBase;
    ntGlow = vec3(0.0);
    if (nCls > 8.5) {
      // ROOF TILES: the shade between the tiles' backs every 0.21 m along the eaves, each course's lap every 0.15 m of
      // rise, and patches of older and newer tiles (2.4 by 1.8 m cells), all faded to their mean by the footprint
      float rib = ntLines(nS / 0.21, ws / 0.21, 0.35), lap = ntLines(nH / 0.15, wh / 0.15, 0.2);
      float pf = smoothstep(0.3, 0.8, max(ws / 2.4, wh / 1.8));
      float ph = ntHash(floor(vec2(nS / 2.4, nH / 1.8)) + nSeed * 53.0 + 11.0);
      vec3 pt = ph > 0.85 ? vec3(0.86, 0.87, 0.90) : (ph < 0.15 ? vec3(1.14, 1.08, 1.0) : vec3(1.0));
      nCol = nBase * mix(pt, vec3(1.0), pf) * ((1.0 - 0.22 * rib - 0.12 * lap) / 0.899);
    } else if (abs(nCls - 7.0) < 0.5) {
      ntGlow = nBase * (nSeed > 1.0 ? nSeed : 2.5);
    } else if (nCls > 0.5 && abs(nCls - 5.0) > 0.5) {
      float brick = (nCls < 1.5 || nCls > 5.5) ? 1.0 : 0.0, hall = nCls > 7.5 ? 1.0 : 0.0, lamped = nCls > 5.5 ? 1.0 : 0.0;
      if (nCls > 1.5 && nCls < 3.5) {
        float mf = smoothstep(0.15, 0.6, max(ws, wh) / 2.5);
        float mo = (sin(nS * 1.31 + nSeed * 23.0) * sin(nH * 1.73 + nS * 0.41) + 0.6 * sin(nS * 0.53 - nH * 0.37 + nSeed * 9.0)) * (1.0 - mf);
        nCol = nBase * (1.0 + 0.05 * mo);
        nCol = mix(nCol, nCls > 2.5 ? vec3(0.62, 0.36, 0.07) : nBase * 0.8, ntBox(nH, -3.0, 0.5, wh));
      } else if (nCls > 3.5 && nCls < 4.5) {
        nCol = nBase * (1.0 - 0.3 * (ntLines(nH / 0.30, wh / 0.30, 0.1) - 0.1));
      }
      if (nCls < 5.5 || hall > 0.5) nCol = mix(nCol, vec3(0.32, 0.12, 0.055), 0.75 * ntBox(nH, nE - 0.3, nE + 0.02, wh));
      nCol *= mix(0.7, 1.0, smoothstep(0.0, 0.6, nH));
      if (lamped > 0.5) {
        // A TOWER'S AND THE HALL'S BRICK IS ONE TONE on every face (no patch, no band, no hole): only its COURSES, at
        // their true size (a course 0.075 m with its 0.01 m bed joint; bricks 0.25 m long, each course half a brick
        // along from the one under it; the mortar the brick's own tone, 0.22 darker), to their mean by the footprint:
        // they read near the way and are one plain tone from farther off
        float bed = ntLines(nH / 0.075, wh / 0.075, 0.133);
        float hdj = ntLines(nS / 0.25 + 0.5 * step(0.5, fract(0.5 * floor(nH / 0.075))), ws / 0.25, 0.04);
        nCol *= (1.0 - 0.22 * max(bed, mix(hdj, 0.04, smoothstep(0.35, 0.8, wh / 0.075)))) / 0.963;
      }
      if (nW > 1.2) {
        float d1 = fract(nSeed * 7.31 + 0.137), d2 = fract(nSeed * 13.73 + 0.291), d3 = fract(nSeed * 29.17 + 0.713);
        float d4 = fract(nSeed * 53.9 + 0.419), d5 = fract(nSeed * 3.77 + 0.61), d6 = fract(nSeed * 17.3 + 0.2);
        float share = mix(0.60, 0.95, d1), dark = step(d2, 0.05), shut = step(0.05, d2) * step(d2, 0.15) * (1.0 - hall);
        float rad = mix(2.5, 5.0, d3) * uPaneGain;
        // A HOUSE'S OWN ROOM TONE: 92 in 100 warm, anywhere from deep amber through gold to honey by its die; 8 a cool white
        float tw = d4 / 0.92;
        vec3 pc = d4 < 0.92 ? (tw < 0.5 ? mix(uPaneC[1], uPaneC[0], tw * 2.0) : mix(uPaneC[0], uPaneC[2], tw * 2.0 - 1.0)) : uPaneC[3];
        float nC = max(1.0, floor(nW / mix(2.6, 3.6, hall) + 0.35)), cw = nW / nC;
        float ci = clamp(floor(nS / cw), 0.0, nC - 1.0), x = nS - (ci + 0.5) * cw, fi = max(floor(nH / 3.1), 0.0);
        float y = mix(nH - fi * 3.1, nH, hall), hw = min(0.65, 0.5 * cw - 0.22);
        float y0 = mix(0.95, 3.0, hall), y1 = mix(2.65, max(nE - 1.4, 4.0), hall);
        float whole = mix(step((fi + 1.0) * 3.1, nE + 0.25), 1.0, hall);       // only a whole floor under the eaves holds a pane
        float isDoor = (1.0 - hall) * (1.0 - step(0.5, fi)) * (1.0 - step(0.5, abs(ci - floor(d5 * nC))));
        float cell = whole * (1.0 - isDoor);
        float L = 0.80 + 0.15 * (1.0 - exp(-clamp(uClock, 0.0, 4000.0) / 40.0)), on = 1.0 - dark;
        float pLit = clamp(L * share / 0.775, 0.0, 1.0) * on;
        float hsh = ntHash(vec2(ci + 13.0 * nSeed, fi + nW));
        float lit = smoothstep(0.0, 0.004, L * share / 0.775 - hsh) * on;
        float drawn = mix(0.55, 1.0, fract(hsh * 7.3));                       // a room's own brightness (curtains, a small lamp): steady
        // THE PANE'S OWN FOOTPRINT (not its cell's): a pane 3 pixels wide begins to give way to ITS ROW'S MEAN GLOW (the
        // house's lit share x its panes' share of the wall), one under 1.2 pixels wide, a dot, is that mean alone: a far
        // row of the hanging town is a calm band of warm wall, never a shimmer of dots
        float nFar = smoothstep(0.33, 0.85, max(ws / (2.0 * hw), wh / max(y1 - y0, 0.5)));
        float aWin = 2.0 * hw * (y1 - y0) / (cw * mix(3.1, max(nE, 3.0), hall));
        float win = ntBox(x, -hw, hw, ws) * ntBox(y, y0, y1, wh) * cell;
        float ring = ntBox(x, -hw - 0.12, hw + 0.12, ws) * ntBox(y, y0 - 0.14, y1 + 0.12, wh) * cell;
        float fine = 1.0 - smoothstep(0.04, 0.16, max(ws, wh));
        // A WINDOW, not a lit rectangle (all of it to its mean by the footprint): a timber frame 0.05 m inside the pane's
        // edge; GLAZING BARS 0.04 m, two lights across and three or four up by the house's die (a hall's tall pane six up);
        // A ROOM'S CLOTH by the room's own die: 35 in 100 curtains drawn back to the sides (the outer 0.4 of each half, folds
        // every 0.07 m), 25 a blind half drawn (its hem 0.35 to 0.6 of the way down, a lath at the hem), 40 bare. Cloth
        // lets 0.62 of the room's light through. Nothing lettered; no figure and no shadow of one: cloth and light alone.
        float nv = mix(d6 < 0.5 ? 3.0 : 4.0, 6.0, hall), pv = (y1 - y0) / nv, cd = fract(hsh * 13.7);
        float hem = y1 - (y1 - y0) * mix(0.35, 0.6, fract(hsh * 29.3)), isBlind = step(0.35, cd) * step(cd, 0.60) * (1.0 - hall);
        float frame = 1.0 - ntBox(x, -hw + 0.05, hw - 0.05, ws) * ntBox(y, y0 + 0.05, y1 - 0.05, wh);
        float bars = max(max(ntBox(x, -0.02, 0.02, ws), ntLines((y - y0) / pv + 0.02 / pv, wh / pv, 0.04 / pv)), max(frame, isBlind * ntBox(y, hem - 0.02, hem + 0.02, wh))) * fine;
        float curt = step(cd, 0.35) * (1.0 - hall) * (1.0 - ntBox(x, -0.6 * hw, 0.6 * hw, ws));
        float cloth = max(curt * (0.78 + 0.22 * sin(x * 90.0)), isBlind * ntBox(y, hem, y1 + 1.0, wh));
        float clothK = mix(0.90, 1.0 - 0.38 * cloth, fine);                    // (0.90: the cloth's mean over a front)
        float door = isDoor * ntBox(x, -0.55, 0.55, ws) * ntBox(nH, -1.0, 2.3, wh) * (1.0 - nFar);
        float fan = isDoor * step(d6, 0.333) * (1.0 - dark) * ntBox(x, -0.55, 0.55, ws) * ntBox(nH, 2.38, 2.88, wh) * (1.0 - nFar);
        vec3 trimC = brick > 0.5 ? vec3(0.60, 0.55, 0.46) : min(nBase * 1.3 + 0.04, vec3(0.9));
        vec3 shutC = d3 < 0.4 ? vec3(0.030, 0.070, 0.045) : (d3 < 0.75 ? vec3(0.100, 0.045, 0.022) : vec3(0.050, 0.085, 0.130));
        vec3 inC = mix(vec3(0.03, 0.035, 0.045), shutC * (1.0 - 0.45 * ntBox(x, -0.03, 0.03, ws) * fine), shut);
        float mask = mix(win, aWin * cell, nFar);
        nCol = mix(nCol, trimC, 0.8 * mix(ring, min(1.0, aWin * 1.4) * cell, nFar));
        nCol = mix(nCol, inC, mask);
        nCol = mix(nCol, vec3(0.023, 0.012, 0.007), door);
        // a room is brightest under its ceiling and in the pane's middle, its curtains drawn back to the sides (mean 1)
        float grad = mix((0.55 + 0.9 * clamp((y - y0) / max(y1 - y0, 0.1), 0.0, 1.0)) * (1.15 - 0.45 * (x / hw) * (x / hw)), 1.0, nFar);
        // shut shutters let the room's light through their louvres: slats every 0.12 m, 3 parts in 10 open, 0.8 of the light
        float through = mix(1.0, 0.8 * mix(ntLines(y / 0.12, wh / 0.12, 0.3), 0.3, nFar), shut);
        ntGlow += pc * rad * (mix(lit * drawn, pLit * 0.775, nFar) * mask * mix(1.0 - bars, 0.88, nFar) * clothK * grad * through + 0.8 * fan);
        // THE REVEAL LIT BY ITS PANE: the 0.12 m band round a lit pane (the surround, or a set-back pane's own reveal
        // faces, which carry this band's s or h) takes 0.16 of the room's light (a third through shut shutters)
        ntGlow += pc * rad * (0.16 * lit * drawn * max(ring - win, 0.0) * (1.0 - nFar) * (1.0 - 0.67 * shut));
      }
      float nUp = max(nH, 0.0);
      ntGlow += nCol * mix(uWash * exp(-nUp / 3.0), uFlood * (1.2 / (1.0 + nUp * nUp / 400.0)), lamped);
    } else if (nCls < 0.5 && nE > 0.5) {
      // A LEVEL FACE OF A WALLED BODY (the writer gives every level face of a body the plain class and leaves its
      // wall's eaves in vFac.w: a ledge's or a course's top and soffit, a sill, a cornice, a pot's top): it stands in
      // its own wall's shade. Its own tone under the town's warm bounce and a share of its street's lamps (uShade),
      // given as radiance, and the rig's light taken off it: no strip of the sky's blue along a lamp-lit wall
      ntGlow = nBase * uShade; nCol = vec3(0.0);
    }
    diffuseColor.rgb = nCol;
  }
`;
// THE ROLL'S OWN AIR, A LAW OF THE PLACE (the eye is not asked): the town's evening air lies along the roll, and each
// row stands in a little more of it than the row before, so the ceiling steps back row behind row. A drawn place's
// metres along the roll are taken from the place itself: its height over the paving (the flank's leg) and, from 60 m
// up, its reach back over the hinge line toward the open side (the ceiling's leg, eased in over 90 m of height so no
// roof of the flat town has it): 71 m at the flank's bulge, 208 over the promenade, 357 over the flat town's
// middle, 490 at the brink. The air's share is 1 - exp(-metres / 3,000): 0.02, 0.07, 0.11 and 0.15 there (thin: the
// hanging town keeps its own colours; only its far rows pale a little, each behind the last). Its colour is the scene's own haze. W: the place; E: the
// name of the radiance so far (the rig's light is thinned through diffuseColor, which the lights read after this).
const rollAir = (W, E) => `    {
      float aUp = max(${W}.y - uRollAt.y, 0.0);
      float aD = aUp + max(uRollAt.x - ${W}.x, 0.0) * clamp((aUp - 60.0) / 90.0, 0.0, 1.0);
      float aS = 1.0 - exp(-min(aD * uRollAir.w, 20.0));
      diffuseColor.rgb *= 1.0 - aS;
      ${E} = ${E} * (1.0 - aS) + uRollAir.rgb * aS;
    }`;
// THE AFTERGLOW UNDER THE CEILING'S EDGE (the hanging town's rim toward the open side): the low light rakes in under
// the hanging half from its open edge, so what faces the glow there (roof slopes, chimneys, the brink's back walls) is
// edged with rose: whole at the brink's last metre (a 595, the plan's farthest cut), a third 70 m in from it across
// the bend's own section, gone by 140 m (the rows before it shade it). The fall is measured from THAT PLACE in the
// world (uRimAt: the brink's x and y by the bend's own law, and the 70 m); the fragment's place and its face's way are
// taken back to the world from the eye's frame (a place, not a view: the same rose from wherever it is seen).
const NIGHT_EMIT = /* glsl */`
  {
    vec3 rW = cameraPosition - vViewPosition * mat3(viewMatrix);
    vec3 rN = normal * mat3(viewMatrix);
    vec2 rD = (rW.xy - uRimAt.xy) / max(uRimAt.z, 1.0);
    float rFall = exp(-min(dot(rD, rD), 20.0)) * smoothstep(-0.6, 0.4, dot(rN, uGlow3));   // whole on what faces the glow, a half on a roof that looks straight away from its ground (the band's low light and the lit land's bounce), nothing on a face turned from it
    ntGlow += uRimC * (0.18 + 0.8 * diffuseColor.rgb) * rFall;   // a tile's or a wall's own colour and its grazing sheen
    // THE RING'S PLACE (the plan's: uRingAt = the ring's foot x, the paving's y, the ring's z, 1 / (30 m)^2): the light
    // about the ring's base washes the fronts beside it, by the face's own place: whole at the foot, 0.64 at 20 m (the
    // fronts of the two rows), 0.37 at 30 m, gone by 60; a third 13 m up a front
    vec2 gD = rW.xz - uRingAt.xz;
    ntGlow += diffuseColor.rgb * uRingC * (exp(-min(dot(gD, gD) * uRingAt.w, 20.0)) * exp(-clamp(rW.y - uRingAt.y, 0.0, 240.0) / 12.0));
${rollAir('rW', 'ntGlow')}
  }
  totalEmissiveRadiance += ntGlow;
`;
// A TREE (the core gives it vFac.y, its height over its own ground): the lamps' light caught among its lower leaves, its own
// colour x uWash x 0.4 x exp(-h / 3.5): warm under the lanterns' 5.5 m, its crown left to the sky's blue from the rig
const TREE_HELP = 'uniform vec3 uWash; uniform vec4 uRollAir; uniform vec2 uRollAt;\n';
const TREE_EMIT = `
  totalEmissiveRadiance += diffuseColor.rgb * uWash * (0.4 * exp(-clamp(vFac.y, 0.0, 60.0) / 3.5));
  {
    vec3 tW = cameraPosition - vViewPosition * mat3(viewMatrix);   // the leaf's own place in the world
${rollAir('tW', 'totalEmissiveRadiance')}
  }
`;

// ---------------------------------------------------------------- THE LIGHT
// the look as the world deals it (section 7): look.glow 'rose' | 'amber' (or { name } or { core, band }); look.haze a
// density (or { density }): 0.0009, 0.0011 or 0.0013. Undealt: amber, 0.0011.
function readLook(look = {}) {
  const g = look.glow, name = String(typeof g === 'string' ? g : (g && (g.name || g.id || g.key)) || '').toLowerCase();
  const glow = GLOWS[name] || (g && g.core && g.band ? { core: g.core, band: g.band } : GLOWS.amber);
  const h = look.haze, d = typeof h === 'number' ? h : (h && typeof h.density === 'number' ? h.density : 0.0011);
  return { glow, density: Math.min(0.0013, Math.max(0.0009, d)) };     // (the three dealt densities' own range)
}
// THE DOME'S OPTIONS (the kit's blueHour, retyped to section 5's targets): zenith, mid and far horizon (horizonPow 20:
// the pale far horizon keeps to the lowest 3 deg, so the haze, the dome's own colour at 2 deg up, stays a deep blue);
// the afterglow as the kit's wash on the sun side: 160 deg wide (scatter 2, scatterPow 4: whole within 45 deg of the
// sun, a half 65 deg off, which is the open side abeam, an eighth at 90), 12 deg high (scatterFall 9: whole to 5 deg
// up, a quarter at 12, a tenth at 16), its core the sun's own glow from under the horizon
const DOME = { zenith: '#0b1b4d', mid: '#2a479c', horizon: '#6a5aa8', horizonPow: 20, midPow: 1.5, scatter: 2.0, scatterPow: 4, scatterFall: 9 };
const BAND_GAIN = 1.25;                                       // the band is a light: its colour as radiance, a quarter over its hex
// a mirror of the kit's clear-sky gradient for a direction over the horizon (its own law, section by section): the height
// ramp, then the wash on the sun side. dy the direction's y, side = 0.5 + 0.5 cos(angle off the sun)
function domeAt(dy, side, band, out = new THREE.Color()) {
  const inv = 1 - Math.min(1, Math.max(0, dy));
  out.copy(lin(DOME.zenith)).lerp(lin(DOME.mid), Math.pow(inv, DOME.midPow)).lerp(lin(DOME.horizon), Math.pow(inv, DOME.horizonPow));
  return out.lerp(band, Math.min(1, Math.max(0, Math.pow(side, DOME.scatterPow) * Math.pow(inv, DOME.scatterFall) * DOME.scatter)));
}
// THE HAZE'S COLOUR: the dome's own at 2 deg up, averaged over the half of the horizon away from the sun (air by distance)
function hazeOf(band) {
  const c = new THREE.Color(0, 0, 0), t = new THREE.Color(), dy = Math.sin(2 * DEG), cs = Math.cos(2 * DEG);
  for (let i = 0; i <= 6; i++) { const off = (90 + 30 * i) * DEG; domeAt(dy, 0.5 + 0.5 * Math.cos(off) * cs * Math.cos(SUN_UNDER * DEG), band, t); c.r += t.r / 7; c.g += t.g / 7; c.b += t.b / 7; }
  return c;
}

export function makeLight(ctx, o = {}) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const look = readLook(o.look);
  const band = lin(look.glow.band).multiplyScalar(BAND_GAIN), core = lin(look.glow.core);
  const fogColor = hazeOf(band);
  const sky = makeSky({
    rng: stream('closing-skydome'), preset: 'blueHour', bake: true, renderer: ctx.renderer,
    zenith: DOME.zenith, mid: DOME.mid, horizon: DOME.horizon, ground: fogColor.clone(), horizonPow: DOME.horizonPow, midPow: DOME.midPow,
    scatterColor: band.clone(), scatter: DOME.scatter, scatterPow: DOME.scatterPow, scatterHigh: 0, scatterFall: DOME.scatterFall,
    sunElevation: SUN_UNDER, sunAzimuth: GLOW_AZIMUTH, sunColor: core.clone(), sunIntensity: 0, sunGlow: 1.6, sunGlowTight: 0.3,
    stars: 0.35, starDensity: 0.15, twinkle: 0, milkyWay: 0, bodies: [], clouds: false, clouds2: false,   // first stars only; nothing twinkles
  });
  // THE RIG (Lambert is albedo / pi, so pi stands in each): the sky's blue from above and the lamp-lit town's warm bounce
  // from below (the hanging half faces down and lives on it); the afterglow from 6 deg up at the sun's azimuth, casting nothing
  const hemi = new THREE.HemisphereLight(lin('#5f7fd6'), lin('#a8705a'), 0.8 * PI);   // 0.8: the share of its half of the dome that a face in this town sees (the fronts across its street and the roll overhead hide a fifth)
  const glow = new THREE.DirectionalLight(lin('#ff9a70'), 0.5 * PI);
  const az = GLOW_AZIMUTH * DEG, up = GLOW_LIGHT_UP * DEG;
  glow.position.set(Math.sin(az) * Math.cos(up), Math.sin(up), -Math.cos(az) * Math.cos(up)).multiplyScalar(1000);
  glow.castShadow = false;
  // THE SHARED UNIFORMS (section 5's gains and colours; one object each, read by every program of the night)
  const lit = {
    uClock: { value: 0 },
    uWash: { value: lin(LAMP.old).multiplyScalar(0.52) },     // the street wash: #ffb057 x 0.52: a wall's foot stands 4 m from the point under the lantern that lights it, and a lantern 5.5 m up gives there (5.5 / 6.8)^3 = 0.52 of what it gives straight under it (the pool's own law, h^3 / (h^2 + r^2)^1.5)
    uFlood: { value: lin('#ffc890') },                        // the towers' and the hall's flood
    uPaneGain: { value: 0.4 },                                // the panes' radiance x 0.4 (1 to 2): a pane shows its room's lit walls and ceiling through glass, not the lamp: a room's pale plaster gives back about 0.4 of its lamp's own 2.5 to 5
    uPaneC: { value: PANES.map(lin) },
    uPool: { value: new THREE.Vector4().fromArray([...lin(LAMP.old).toArray(), 1.3]) },   // the pools: #ffb057, gain 1.3: the ground straight under a lantern is the brightest lit thing of a street after its panes and stands among them (a pane 1 to 2), two and a half times its wall's foot (0.52)
    uBand: { value: band.clone() },                           // the afterglow's band as radiance (the sheen mirrors it)
    uBack: { value: fogColor.clone().multiplyScalar(0.8) },   // the land's back face and the sheen's dark: the fog's colour x 0.8
    uGlowDir: { value: new THREE.Vector2(Math.sin(az), -Math.cos(az)) },   // the way to the glow on the ground plane (x, z)
    uLampOld: { value: lin(LAMP.old) }, uLampHalo: { value: lin(LAMP.halo) }, uLampPale: { value: lin(LAMP.pale) }, uLampCool: { value: lin(LAMP.cool) },
    uSprite: { value: new THREE.Vector4(3.0, 0.36, 0.4, 2.5) },   // a far lamp's point radiance, halo radiance (0.36 over 2.4 m: the old 0.8 over 1.6 m, the same light spread wider), the air's share on a source, least pixels
    uGlow3: { value: new THREE.Vector3(Math.sin(az) * Math.cos(up), Math.sin(up), -Math.cos(az) * Math.cos(up)) },   // the way to the afterglow's light
    uRimC: { value: band.clone().multiplyScalar(1.4) },       // the rim-light: the band's own radiance x 1.4 (the light itself comes from the core, brighter than the band)
    uRimAt: { value: new THREE.Vector3() },                   // the brink's last metre in the world (x, y) and the fall's 70 m
    uRollAir: { value: new THREE.Vector4(fogColor.r, fogColor.g, fogColor.b, 1 / 3000) },   // the roll's own air: the haze's colour, 1 / its 3,000 m (the scene's own haze is whole by about 1.5 km of sight: the roll's lies thinner, along 600 m of land)
    uRollAt: { value: new THREE.Vector2(PLAN.HX, PLAN.Y0) },  // the hinge line's x and the paving's y (the plan's)
    uRingAt: { value: new THREE.Vector4(PLAN.RING_X, PLAN.Y0, PLAN.RING_Z, 1 / (30 * 30)) },   // the ring's foot on the paving (the plan's), 1 / (30 m)^2
    uRingC: { value: lin(LAMP.old).multiplyScalar(0.3) },     // the light about the ring's base on a front: three fifths of a wall's own wash (0.52): eight low lamps 15 m off, one more lamp-lit place and no flood
    uShade: { value: lin('#a8705a').multiplyScalar(0.8 * 0.6).add(lin(LAMP.old).multiplyScalar(0.52 * 0.3)) },   // a level face in its wall's shade: the rig's warm bounce (x 0.8) at six tenths (its ledge hides the rest) and three tenths of its street's wash
  };
  const brinkAt = bendAt(bendKnots(B0), 595, 0, 0, 0);        // a 595: the plan's farthest cut of the hanging edge
  lit.uRimAt.value.set(brinkAt.x, brinkAt.y, 70);
  const landUniforms = { uPool: lit.uPool, uBack: lit.uBack, uRollAir: lit.uRollAir, uRollAt: lit.uRollAt };   // (the last two: the roll's own air, for the land's program when it takes the law)
  const night = {
    house: { pars: NIGHT_HELP, colour: NIGHT_HOUSE, emit: NIGHT_EMIT, key: 'closing-night-house-4',
      uniforms: { uClock: lit.uClock, uWash: lit.uWash, uFlood: lit.uFlood, uPaneGain: lit.uPaneGain, uPaneC: lit.uPaneC, uRimAt: lit.uRimAt, uRimC: lit.uRimC, uGlow3: lit.uGlow3,
        uRollAir: lit.uRollAir, uRollAt: lit.uRollAt, uRingAt: lit.uRingAt, uRingC: lit.uRingC, uShade: lit.uShade } },
    tree: { pars: TREE_HELP, colour: '', emit: TREE_EMIT, key: 'closing-night-tree-3', uniforms: { uWash: lit.uWash, uRollAir: lit.uRollAir, uRollAt: lit.uRollAt } },
  };
  return {
    sky, fogColor, fogDensity: look.density, lights: [hemi, glow],
    post: { exposure: 1.04, bloomStrength: 0.38, bloomThreshold: 0.9, bloomRadius: 0.6, contrast: 1.0, saturation: 1.06, vignette: 0.22, grain: 0.02 },
    night, landUniforms, lit, glow: look.glow,
    update(dt, time, camera) { lit.uClock.value = time; sky.update(dt, time, camera); },
    prewarm(renderer, camera, scene) { return sky.prewarm(renderer, camera, scene); },
    dispose() { sky.dispose(); },
  };
}

// ---------------------------------------------------------------- THE FAR LAND
// THE COUNTRY GOES ON AT DUSK on every side of the flat town and beyond the street's end. No sea, lake or long water.
// WHAT IS BUILT (one geometry, one program, ONE draw):
//  - THE PLAIN at the town's own level (no step, no cut earth): one sheet at y 6.6 (0.4 m under the paving's y 7) from
//    the town out to 2,500 m, left open under the flat town's own ground (x -160 to 80, z -80 to its far end: 10 m inside that
//    ground's edges), so two level skins never share a pixel there;
//  - THREE RIDGES about the town's middle (x 20, z 600), stepping back: crest lines near 2.0, 3.2 and 4.5 km, 60 to
//    150 m, 150 to 270 m and 270 to 420 m high (each rises about 2 to 5 deg over the plain, so a farther one shows in a
//    nearer one's dips and the afterglow's band, whole to 5 deg up, reaches down to the far ridge), each crest its own
//    seeded sum of waves; only the slope toward the town is built (the back is never seen from inside the ring);
//  - 150 HEDGEROW FLATS: upright strips 60 to 160 m long and 7 to 13 m high, standing ON the plain's own field lines,
//    60 to 900 m out from the town's outline: the tree lines of the outskirts;
//  - the lights (their sprites are makeGlow's): steadings of 1 to 4 lit yards, thick by the town's edge and thinning
//    outward (a steading is kept by the chance 1 / (1 + (its metres out / 350)^2)); TWO VILLAGES on the plain, one
//    150 to 450 m beyond the flat land's far end, one 400 to 800 m out on the open side, 18 lights each within 90 m; four
//    hamlets of 6 on the first ridge's near slope, each light on the slope's own line (so none floats).
// WHAT IS PAINT (the program below):
//  - on the plain: FIELDS in three dusk tones (ploughed earth, pasture, pale stubble: 40, 35 and 25 in 100), rows
//    90 m deep on a lattice turned 17 deg from the street (no ruled grid), each row's fields 110 to 170 m long; a dark
//    hedge 4 m wide on every field's edge; a pale lane 5 m wide on one row line in three; all to their mean by the
//    pixel's footprint (fwidth), then into the scene's own haze by distance;
//  - on a hedgerow flat: the crowns' outline (a sum of three waves along it, cut out) and one gap in five;
//  - on a ridge: its haze, typed into its vertices from ITS PLACE alone: each ridge is the silhouette's #141a33 mixed
//    toward the dome's own colour low over the horizon AT ITS BEARING (so the ridges under the afterglow take its rose)
//    by 0.75 (1 - exp(-its metres out / 2,600)): 0.40, 0.53 and 0.62 for the three, more at each foot (valley mist) and
//    the first ridge's foot the scene's haze itself, so it rises out of the plain's far edge with no line. A ridge
//    stands past the scene's fog law (which is whole by 1.5 km), so it carries this air of its own and no other.
const FAR = { cx: 20, cz: 600, y: 6.6, sheetR: 2500, farm: 340, village: 60, hedges: 150 };
const RIDGES = [                                              // foot, crest line (m from the town's middle), crest lowest and highest (m), columns
  { r0: 1600, rc: 2000, h0: 60, h1: 150, cols: 96 },
  { r0: 2700, rc: 3200, h0: 150, h1: 270, cols: 72 },
  { r0: 4000, rc: 4500, h0: 270, h1: 420, cols: 72 },
];
const FIELD = { turn: 17 * DEG, row: 90, len0: 110, len1: 170 };   // the fields' lattice (the program below types the same figures)
const FIELD_TONES = ['#3e3a56', '#243642', '#5a5368', '#111830', '#746f8a'];   // ploughed, pasture, stubble (a mauve straw, never a water's blue), hedge, lane: dusk tones as seen
const TOWN_BOX = { x0: -170, x1: 215, z0: -60 };              // the town's outline: the flat town's far row to the curl's farthest reach; its far end (z1) is the PLAN'S, read in makeFar
const FAR_VERT = /* glsl */`
attribute vec4 aTone; attribute vec3 aUv;             // aTone: a tone and the kind (0 plain, 1 ridge, 2 hedgerow); aUv: metres along a flat, its height's share, its phase
varying vec4 vTone; varying vec3 vUv3; varying vec2 vW; varying float vFarD;
void main() {
  vTone = aTone; vUv3 = aUv; vW = position.xz;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFarD = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const FAR_FRAG = /* glsl */`
#ifdef USE_FOG
uniform vec3 fogColor; uniform float fogDensity;
#endif
uniform vec3 uField[5];
varying vec4 vTone; varying vec3 vUv3; varying vec2 vW; varying float vFarD;
float frHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec3 c = vTone.rgb; float kind = vTone.a, air = 1.0;
#ifdef USE_FOG
  float fd = fogDensity * max(vFarD, 0.0); air = exp(-min(fd * fd, 40.0));
#endif
  if (kind < 0.5) {
    // the fields' lattice: turned 17 deg (cos 0.9563, sin 0.2924), rows 90 m deep, a row's fields 110 to 170 m long
    vec2 q = vec2(0.9563 * vW.x + 0.2924 * vW.y, -0.2924 * vW.x + 0.9563 * vW.y);
    float fw = max(max(fwidth(q.x), fwidth(q.y)), 0.01);
    float row = floor(q.y / 90.0), rh = frHash(vec2(row, 3.0)), len = 110.0 + 60.0 * rh, u = q.x / len + rh * 7.0;
    float h = frHash(vec2(floor(u), row));
    vec3 tone = h < 0.4 ? uField[0] : (h < 0.75 ? uField[1] : uField[2]);
    vec3 mean = 0.4 * uField[0] + 0.35 * uField[1] + 0.25 * uField[2];
    // furrows and drill rows every 6 m, along or across the row by the field's own die: land that is worked, never water
    float fur = sin((frHash(vec2(floor(u), row) + 9.0) < 0.5 ? q.x : q.y) * 1.05) * (1.0 - smoothstep(1.5, 5.0, fw));
    tone = mix(tone * (1.0 + 0.10 * fur), mean, smoothstep(40.0, 110.0, fw));
    float dE = min(len * (0.5 - abs(fract(u) - 0.5)), 90.0 * (0.5 - abs(fract(q.y / 90.0) - 0.5)));   // metres to the field's edge
    float hedge = mix(1.0 - smoothstep(2.0 - 0.5 * fw, 2.0 + 0.5 * fw + 0.01, dE), 0.075, smoothstep(6.0, 24.0, fw));
    float li = floor(q.y / 90.0 + 0.5), dl = abs(q.y - li * 90.0), isLane = 1.0 - step(0.5, li - 3.0 * floor(li / 3.0));
    float lane = isLane * mix(1.0 - smoothstep(2.5 - 0.5 * fw, 2.5 + 0.5 * fw + 0.01, dl), 0.055, smoothstep(6.0, 24.0, fw));
    c = mix(mix(tone, uField[3], hedge * (1.0 - isLane * step(dl, 6.0))), uField[4], lane);
#ifdef USE_FOG
    c = mix(fogColor, c, air);
#endif
  } else if (kind > 1.5) {
    // a hedgerow's crowns: their outline along the flat (vUv3.x metres, .y the height's share, .z its phase), one gap in five
    float s = vUv3.x + vUv3.z * 61.0;
    float top = 0.66 + 0.17 * sin(s * 0.9) * sin(s * 0.37 + 1.3) + 0.13 * sin(s * 2.3 + vUv3.z * 9.0);
    float gap = step(frHash(vec2(floor(s / 9.0), 5.0)), 0.2);
    if (vUv3.y > mix(top, 0.22, gap)) discard;
#ifdef USE_FOG
    c = mix(fogColor, c, air);
#endif
  }
  gl_FragColor = vec4(c, 1.0);
}
`;
export function makeFar(ctx, o = {}) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const group = new THREE.Group(); group.name = 'closing-far';
  const light = o.light || {}, fog = light.fogColor ? light.fogColor.clone() : lin('#3f4d93');
  const band = light.lit && light.lit.uBand ? light.lit.uBand.value.clone() : lin(GLOWS.amber.band).multiplyScalar(BAND_GAIN);
  // THE FLAT LAND'S FAR END IS THE PLAN'S (o.plan.flat.z1 when the world hands the plan; else the plan's own tip and its
  // 12 m, and never short of the ring's parapet 22 m past the ring): the outline and the plain's hole follow it
  const flatZ1 = o.plan && o.plan.flat && o.plan.flat.z1 > 0 ? o.plan.flat.z1 : Math.max(PLAN.Z_TIP + 12, PLAN.RING_Z + 22);
  const TB = { ...TOWN_BOX, z1: flatZ1 };
  const pos = [], tone = [], uv = [], idx = [], none = new THREE.Color(0, 0, 0);
  const vert = (x, y, z, c, kind, u = 0, v = 0, w = 0) => { pos.push(x, y, z); tone.push(c.r, c.g, c.b, kind); uv.push(u, v, w); return pos.length / 3 - 1; };
  // THE PLAIN: the hole's outline walked side by side (16 steps a side), each point joined to the rim at its own bearing
  const hx0 = -160, hx1 = 80, hz0 = -80, hz1 = flatZ1 - 10, per = [];
  for (let i = 0; i < 16; i++) per.push([hx0 + (hx1 - hx0) * i / 16, hz0]);
  for (let i = 0; i < 16; i++) per.push([hx1, hz0 + (hz1 - hz0) * i / 16]);
  for (let i = 0; i < 16; i++) per.push([hx1 - (hx1 - hx0) * i / 16, hz1]);
  for (let i = 0; i < 16; i++) per.push([hx0, hz1 - (hz1 - hz0) * i / 16]);
  const mx = (hx0 + hx1) / 2, mz = (hz0 + hz1) / 2;
  for (let i = 0; i < per.length; i++) {
    const [x, z] = per[i], d = Math.hypot(x - mx, z - mz);
    vert(x, FAR.y, z, none, 0); vert(mx + (x - mx) / d * FAR.sheetR, FAR.y, mz + (z - mz) / d * FAR.sheetR, none, 0);
    const a = 2 * i, b = 2 * ((i + 1) % per.length); idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  // THE THREE RIDGES: foot, shoulder (0.45 of the crest's height) and crest, a column at a time; each vertex's tone is
  // its ridge's own air (the head of this section), read at its bearing from the town's middle
  const R = stream('closing-ridge'), gx = Math.sin(GLOW_AZIMUTH * DEG), gz = -Math.cos(GLOW_AZIMUTH * DEG), sil = lin('#141a33'), lines = [];
  RIDGES.forEach((rd, j) => {
    const ph = [R() * 2 * PI, R() * 2 * PI, R() * 2 * PI, R() * 2 * PI, R() * 2 * PI], jag = [];
    for (let i = 0; i < rd.cols; i++) jag.push((R() - 0.5) * 0.24);   // each crest point's own eighth of the range up or down: no ruled curve
    const crestAt = (t) => rd.h0 + (rd.h1 - rd.h0) * Math.min(1, Math.max(0, 0.5 + 0.26 * Math.sin((3 + j) * t + ph[0]) + 0.16 * Math.sin((7 + 2 * j) * t + ph[1]) + 0.08 * Math.sin(13 * t + ph[2])));
    const rcAt = (t) => rd.rc + 100 * Math.sin(5 * t + ph[3]), rmAt = (t) => (rd.r0 + rcAt(t)) / 2 + 40 * Math.sin(9 * t + ph[4]);
    lines.push({ crestAt, rmAt });
    const air = 0.75 * (1 - Math.exp(-rd.rc / 2600)), base = pos.length / 3;
    for (let i = 0; i < rd.cols; i++) {
      const t = i / rd.cols * 2 * PI, cs = Math.cos(t), sn = Math.sin(t), rm = rmAt(t), rc = rcAt(t);
      const H = Math.min(rd.h1, Math.max(rd.h0, crestAt(t) + jag[i] * (rd.h1 - rd.h0)));
      const sky = domeAt(Math.sin(1.5 * DEG), 0.5 + 0.5 * (cs * gx + sn * gz), band);   // the dome low over the horizon at this bearing
      vert(FAR.cx + rd.r0 * cs, FAR.y, FAR.cz + rd.r0 * sn, j === 0 ? fog : sil.clone().lerp(sky, Math.min(1, air + 0.16)), 1);
      vert(FAR.cx + rm * cs, FAR.y + 0.45 * H, FAR.cz + rm * sn, sil.clone().lerp(sky, Math.min(1, air + 0.08)), 1);
      vert(FAR.cx + rc * cs, FAR.y + H, FAR.cz + rc * sn, sil.clone().lerp(sky, air), 1);
    }
    for (let i = 0; i < rd.cols; i++) { const a = base + 3 * i, b = base + 3 * ((i + 1) % rd.cols); idx.push(a, a + 1, b, b, a + 1, b + 1, a + 1, a + 2, b + 1, b + 1, a + 2, b + 2); }
  });
  // metres out from the town's outline; the promenade's tail behind the entry (x 20 to 130, z under -60) is kept clear
  const outBy = (x, z) => Math.hypot(Math.max(TB.x0 - x, 0, x - TB.x1), Math.max(TB.z0 - z, 0, z - TB.z1));
  const tail = (x, z) => z < TB.z0 && x > 20 && x < 130;
  // THE HEDGEROW FLATS: every flat's dice are drawn before any test; each is snapped to the nearest row line of the
  // fields' lattice and kept by the outskirts' own thinning (1 / (1 + (metres out / 500)^2)) when all of it stands
  // 60 to 900 m out
  const Hd = stream('closing-hedgerows'), cT = Math.cos(FIELD.turn), sT = Math.sin(FIELD.turn), hedgeC = lin(FIELD_TONES[3]);
  for (let k = 0, n = 0; k < 40 * FAR.hedges && n < FAR.hedges; k++) {
    const t = Hd() * 2 * PI, r = 100 + 1500 * Math.sqrt(Hd()), L = 60 + 100 * Hd(), H = 7 + 6 * Hd(), ph = Hd(), keep = Hd();
    const x = FAR.cx + r * Math.cos(t), z = FAR.cz + r * Math.sin(t);
    const qx = cT * x + sT * z, qy = Math.round((-sT * x + cT * z) / FIELD.row) * FIELD.row;
    const at = (s) => [cT * (qx + s) - sT * qy, sT * (qx + s) + cT * qy];
    let ok = keep < 1 / (1 + (outBy(x, z) / 500) ** 2);
    for (let s = -0.5; s <= 0.5; s += 0.25) { const [px, pz] = at(s * L), d = outBy(px, pz); if (d < 60 || d > 900 || tail(px, pz)) ok = false; }
    if (!ok) continue;
    const [x0, z0] = at(-L / 2), [x1, z1] = at(L / 2);
    const a = vert(x0, FAR.y, z0, hedgeC, 2, 0, 0, ph), b = vert(x1, FAR.y, z1, hedgeC, 2, L, 0, ph);
    const c = vert(x1, FAR.y + H, z1, hedgeC, 2, L, 1, ph), d = vert(x0, FAR.y + H, z0, hedgeC, 2, 0, 1, ph);
    idx.push(a, b, c, a, c, d); n++;
  }
  // THE STEADINGS' LIGHTS: thick by the town's edge, thinning outward; each light keeps the same bounds as its steading
  const F = stream('closing-farms'), lights = [];
  for (let k = 0, most = 16 * FAR.farm; k < most && lights.length < FAR.farm; k++) {
    const t = F() * 2 * PI, r = 100 + 1750 * Math.sqrt(F()), n = 1 + Math.floor(F() * 4), keep = F(), d = [F(), F(), F(), F(), F(), F(), F(), F()];
    const x = FAR.cx + r * Math.cos(t), z = FAR.cz + r * Math.sin(t), out = outBy(x, z);
    if (out < 60 || out > 1200 || tail(x, z) || keep > 1 / (1 + (out / 350) ** 2)) continue;
    for (let j = 0; j < n && lights.length < FAR.farm; j++) {
      const lx = x + (d[2 * j] - 0.5) * 50, lz = z + (d[2 * j + 1] - 0.5) * 50, lo = outBy(lx, lz);
      if (lo >= 60 && lo <= 1200) lights.push({ x: lx, y: FAR.y + 4, z: lz, kind: 'farm' });
    }
  }
  // THE TWO VILLAGES ON THE PLAIN (18 lights each, within 90 m, 3 to 6 m up): one beyond the street's end (150 to 450 m: on the plain, its last light 90 m and more short of the first ridge's foot;
  // on from the flat land's far end (the plan's), within 30 deg either side of the street's own line at x 72); one on the open side
  // (400 to 800 m out from the flat town's far row at x -170, between a quarter and three quarters of the town's length)
  const V = stream('closing-villages');
  const v1r = 150 + 300 * V(), v1b = (V() - 0.5) * 60 * DEG, v2o = 400 + 400 * V(), v2z = TB.z0 + (TB.z1 - TB.z0) * (0.25 + 0.5 * V());
  for (const [vx, vz] of [[72 + v1r * Math.sin(v1b), TB.z1 + v1r * Math.cos(v1b)], [TB.x0 - v2o, v2z]]) for (let j = 0; j < 18; j++) {
    const a = V() * 2 * PI, rr = 90 * Math.sqrt(V());
    lights.push({ x: vx + rr * Math.cos(a), y: FAR.y + 3 + 3 * V(), z: vz + rr * Math.sin(a), kind: 'hamlet' });
  }
  // four hamlets of 6 on the first ridge's near slope, each light on the slope's own line (so none floats)
  for (let v = 0; v < 4; v++) {
    const t0 = (v + 0.2 + 0.6 * V()) / 4 * 2 * PI;
    for (let j = 0; j < 6; j++) {
      const t = t0 + (V() - 0.5) * 0.09, q = 0.1 + 0.5 * V(), r = RIDGES[0].r0 + (lines[0].rmAt(t) - RIDGES[0].r0) * q;
      lights.push({ x: FAR.cx + r * Math.cos(t), y: FAR.y + 0.45 * lines[0].crestAt(t) * q + 4, z: FAR.cz + r * Math.sin(t), kind: 'village' });
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 4));
  geo.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 3)); geo.setIndex(idx);
  const uniforms = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uField: { value: FIELD_TONES.map(lin) } });
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: FAR_VERT, fragmentShader: FAR_FRAG, fog: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'closing-farland'; mesh.frustumCulled = false; mesh.castShadow = false; group.add(mesh);
  return { group, lights, tris: idx.length / 3, dispose() { geo.dispose(); mat.dispose(); } };
}

// ---------------------------------------------------------------- THE GLOW: lamp sprites, then smoke (one program, two draws)
// A LAMP IS A LANTERN in a ball of lit air, drawn as ONE quad turned to the eye, its size in TRUE METRES, carried by the
// bend (its place is h metres up its own ground's normal at its a, and its cap points along that normal: THE ONE
// RULE). Near, the lantern itself is seen (glass, cap, posts, a small bright heart: the figures stand at GLOW_FRAG) in
// a soft halo 4.8 m across at 0.36; far off it is a point 0.5 m across at radiance 3 (a string's bulb 0.16 and 0.8 m,
// always a point). Always on, steady.
//  - THE FOOTPRINT FILTER: a core or a halo that would be under 2.5 pixels across is drawn 2.5 pixels across with its
//    radiance times (true area / drawn area): the same light, never more.
//  - THE DEPTH TEST'S PLACE: the quad's depth is the lamp's own core radius (true metres, never the drawn radius)
//    nearer the eye than its middle, so its bracket does not cut the lantern; a wall behind a lantern hides the half
//    of its halo that lies behind that wall, as a wall does.
//  - A POOL OF LIGHT is no sprite turned to the eye: a quad laid in its own ground's plane under its lamp (the plan's
//    place), added to the paving it lies on.
//  - AIR: the scene's fog law at 0.4 of its density on a lamp (the medium's own law, at the head); whole on smoke.
// SMOKE (section 6): 7 soft puffs a chimney (10 near the way), each a pure function of the world's clock, by the ONE
// rule at this file's head: A SHORT SOFT PLUME IN ITS HOUSE'S OWN UP. It leaves its roof along its ground's normal (8 m
// in its life of 5 to 7 s, fast then slowing), then drifts toward +z at 0.8 m/s (its speed 0.8 (1 - exp(-4 age)):
// nothing at the pot; 3 to 4.2 m in a life), so a plume is under 10 m from pot to end; 1 to 3 m across, thinning by
// (1 - age)^2 to nothing: pale, rose on the side that faces the afterglow, never a streak across the houses; far off
// the air takes it (its cover falls with the air's own law).
// One blend for both draws: the output is premultiplied (a lamp's alpha is 0, so it only adds; a puff covers by its own).
const GLOW_VERT = /* glsl */`
${BEND_GLSL}
attribute vec2 aCorner; attribute vec4 aQ;            // a lamp: (core radius, halo radius, tint, 0 a lantern or 0.25 a plain point); a puff: (its life s, its phase, its size's die, 1 or, near the way, 2); a pool of light: (its radius, its lamp's height over its ground, tint, MINUS its gain)
uniform vec4 uSprite; uniform float uGlowT; uniform float uViewH; uniform vec3 uGlow3;
uniform vec3 uLampOld; uniform vec3 uLampHalo; uniform vec3 uLampPale; uniform vec3 uLampCool; uniform vec3 uSmokeC;
#ifdef USE_FOG
uniform float fogDensity;
#endif
varying vec2 vM; varying vec4 vP; varying vec3 vC; varying vec3 vH; varying vec2 vS; varying vec4 vL; varying vec3 vG; varying vec3 vU;
void main() {
  bendFrameAt(aAnchor);
  vec3 p = position;
  float smoke = step(0.5, aQ.w), nigh = step(1.5, aQ.w), pool = step(aQ.w, -0.01), age = 0.0;
  if (smoke > 0.5) {
    age = fract(uGlowT / max(aQ.x, 1.0) + aQ.y);
    p.y += 8.0 * age * (1.6 - 0.6 * age);               // away from its own ground, in its house's own up: 8 m in a life
    p.z += 0.8 * aQ.x * (age - 0.25 * (1.0 - exp(-4.0 * age)));   // then toward +z: its speed grows from 0 to 0.8 m/s as it leaves (3 to 4.2 m in its 5 to 7 s)
  }
  if (pool > 0.5) p += vec3(aCorner.x * aQ.x, 0.0, -aCorner.y * aQ.x);   // a pool lies IN ITS OWN GROUND'S PLANE (the bend's frame at its lamp's a): never turned to the eye
  vec4 mv = modelViewMatrix * vec4(bendPoint(p), 1.0);
  // UP for this lamp or puff is its own ground's normal (THE ONE RULE), here in the eye's frame
  vec3 upV = (modelViewMatrix * vec4(aAnchor < 0.0 ? vec3(0.0, 1.0, 0.0) : vec3(-bendF.y, bendF.x, 0.0), 0.0)).xyz;
  float u2 = dot(upV.xy, upV.xy), ul = sqrt(max(u2, 0.000001));
  float depth = max(-mv.z, 0.1);
  float mpp = depth * 2.0 / max(projectionMatrix[1][1] * uViewH, 1.0);   // metres a pixel at the lamp's depth
  float air = 1.0;
#ifdef USE_FOG
  float fd = fogDensity * depth * mix(uSprite.z, 1.0, max(smoke, pool));   // (a pool is lit ground: the air's whole law)
  air = exp(-min(fd * fd, 40.0));
#endif
  float rc, rh, hf, form = 0.0;
  if (smoke > 0.5) {
    rh = 0.5 * mix(1.0, 3.0, age) * (0.85 + 0.3 * aQ.z) * (1.0 + 0.2 * nigh); rc = rh; hf = rh;   // a pot's breath 1 m across; 3 m (3.6 near the way) where it ends
    float fade = smoothstep(0.0, 0.08, age) * (1.0 - age) * (1.0 - age);   // whole from its first metre, a quarter by half its life, nothing at its end: a short soft plume, never a streak
    vP = vec4(rh, rh, (0.5 + 0.1 * nigh) * fade, 0.0); vC = uSmokeC; vH = uSmokeC;
  } else {
    float least = 0.5 * uSprite.w * mpp;                // the least drawn radius: 2.5 pixels across
    float kc = max(1.0, least / max(aQ.x, 0.01)), kh = max(1.0, least / max(aQ.y, 0.01));
    rc = aQ.x * kc; rh = aQ.y * kh; hf = max(rh, rc);
    vP = vec4(rc, rh, uSprite.x / (kc * kc), uSprite.y / (kh * kh));
    vC = aQ.z < 0.5 ? uLampOld : (aQ.z < 1.5 ? uLampPale : uLampCool);
    vH = aQ.z < 0.5 ? uLampHalo : mix(vC, uLampHalo, 0.35);
    // THE LANTERN'S FORM, by the footprint ALONE: whole while a pixel is under 0.05 m there (its 0.6 m is 12 pixels),
    // its point from 0.16 m a pixel (under 4); no turn of the gaze changes it
    form = (1.0 - step(0.1, aQ.w)) * (1.0 - smoothstep(0.05, 0.16, mpp));
  }
  if (pool > 0.5) { hf = 0.0; form = 0.0; vP = vec4(aQ.x, aQ.y, -aQ.w, 0.0); }
  vM = aCorner * mix(hf, aQ.x, pool); vS = vec2(smoke + 2.0 * pool, air); vU = upV;
  // the form's up on the sprite's plane: the lamp's own up as it falls there, always of length 1 (where that up lies
  // dead along the sprite's normal it has no fall: the sprite's own up then, so the form is never stretched)
  vL = vec4(u2 > 0.000001 ? upV.xy / ul : vec2(0.0, 1.0), mpp, form);
  vG = (viewMatrix * vec4(uGlow3, 0.0)).xyz;            // the way to the afterglow's light, in the eye's frame (a puff's shading)
  gl_Position = projectionMatrix * (mv + vec4(aCorner * hf, 0.0, 0.0));
  vec3 toEye = mv.xyz * inversesqrt(max(dot(mv.xyz, mv.xyz), 0.0001));
  // THE DEPTH TEST'S PLACE: a lamp's own CORE RADIUS in true metres (aQ.x, the same at every distance) nearer the eye
  // than its middle, so the bracket it hangs by does not cut the lantern; a puff, a ball, by its own radius in metres;
  // a pool, a face of its ground, by nothing
  float poleBy = mix(aQ.x, rh, smoke) * (1.0 - pool);
  vec4 pole = projectionMatrix * vec4(mv.xyz - toEye * min(poleBy, 0.5 * depth), 1.0);
  gl_Position.z = pole.z / max(pole.w, 0.0001) * gl_Position.w;
}
`;
// A LANTERN (true metres about its heart, lx across and ly along ITS OWN UP; the old town's great street lantern, 1.3 of
// these figures: 0.6 m across under its cap and 1.0 m from foot to cap's tip): tapered glass 0.30 m wide at its foot
// and 0.46 under the cap, 0.62 tall; an iron cap 0.12 and a foot plate; corner posts and a middle one; the HEART a
// small mantle (0.09 m) at radiance 6 in glass at 0.6 (under white, so its amber, its posts and its dark cap are seen): about the light of its far point.
// A PUFF is a soft ball: pale in the sky's fill (uSmokeC), ROSE where it faces the afterglow (uSmokeG, the band's own
// colour: the open side's light), warm where it faces its own ground's lamps (uSmokeW).
const GLOW_FRAG = /* glsl */`
#ifdef USE_FOG
uniform vec3 fogColor;
#endif
uniform vec3 uSmokeG; uniform vec3 uSmokeW;
varying vec2 vM; varying vec4 vP; varying vec3 vC; varying vec3 vH; varying vec2 vS; varying vec4 vL; varying vec3 vG; varying vec3 vU;
float gBox(float x, float a, float b, float w) { float k = 1.0 / max(w, 0.0005); return clamp((x - a) * k + 0.5, 0.0, 1.0) * clamp((b - x) * k + 0.5, 0.0, 1.0); }
void main() {
  float r = sqrt(max(dot(vM, vM), 0.000001));
  if (vS.x > 1.5) {
    // A POOL OF LIGHT on its own ground: a lamp h metres over level ground lights it by h^3 / (h^2 + r^2)^1.5 (a point's
    // own law: whole straight under it, a half 0.77 h out, a tenth 1.9 h out), eased to nothing over the outer 0.4 of
    // the pool's radius. vM: metres in the ground's plane from the point under the lamp; vP: radius, h, gain
    float hh = vP.y * vP.y, q = hh / max(hh + r * r, 0.0001);
    float e = q * sqrt(q) * (1.0 - smoothstep(0.6, 1.0, r / max(vP.x, 0.01)));
    gl_FragColor = vec4(vC * (vP.z * e * vS.y), 0.0);
  } else if (vS.x > 0.5) {
    float q = clamp(1.0 - r / max(vP.x, 0.01), 0.0, 1.0), a = q * q * (3.0 - 2.0 * q) * vP.z;
    vec2 n2 = vM / max(vP.x, 0.01); vec3 n = vec3(n2, sqrt(max(1.0 - dot(n2, n2), 0.0)));
    vec3 c = vC + uSmokeG * max(dot(n, vG), 0.0) + uSmokeW * max(-dot(n, vU), 0.0);
#ifdef USE_FOG
    c = mix(fogColor, c, vS.y);
    a *= vS.y;                                          // the air takes the puff itself too: far off it thins away, never a pale patch on what stands behind it
#endif
    gl_FragColor = vec4(c * a, a);
  } else {
    float core = 1.0 - smoothstep(0.55, 1.0, r / max(vP.x, 0.01)), hq = clamp(1.0 - r / max(vP.y, 0.01), 0.0, 1.0);
    vec3 lightC = vC * (vP.z * core * (1.0 - vL.w)) + vH * (vP.w * hq * hq);
    float cover = 0.0;
    if (vL.w > 0.001) {
      vec2 l = vec2(vM.x * vL.y - vM.y * vL.x, dot(vM, vL.xy)) / 1.3; float px = max(vL.z / 1.3, 0.0005);
      float w = 0.19 + 0.13 * l.y, wc = 0.29 - 1.9 * (l.y - 0.31);
      float glass = gBox(l.x, -w, w, px) * gBox(l.y, -0.31, 0.31, px);
      float iron = max(gBox(l.x, -wc, wc, px) * gBox(l.y, 0.31, 0.43, px), gBox(l.x, -0.17, 0.17, px) * gBox(l.y, -0.36, -0.29, px));
      iron = max(iron, gBox(l.x, -0.012, 0.012, px) * gBox(l.y, 0.43, 0.80, px));   // the rod it hangs by, from its wall's bracket or its arcade's vault: no post stands under it
      float bars = max(1.0 - gBox(l.x, -w + 0.03, w - 0.03, px), gBox(l.x, -0.012, 0.012, px));
      float heart = exp(-min(dot(l, l) / 0.0081, 20.0));
      vec3 lit = vC * (0.6 * (1.0 - 0.75 * bars) * (0.7 + 0.3 * clamp(1.0 - abs(l.y) / 0.31, 0.0, 1.0)) + 6.0 * heart);
      lightC += mix(lit * glass, vec3(0.012, 0.011, 0.012), iron) * vL.w;
      cover = vL.w * max(glass, iron);
    }
    gl_FragColor = vec4(lightC * vS.y, cover);
  }
}
`;
// a lamp's size (core radius, halo radius, in metres), tint and form by its kind (section 5): old town amber (street,
// wide, gate, post), promenade and squares pale (square, bracket): LANTERNS, each in 2.4 m of lit air (the old 1.6 m
// read small beside its 6 m pool); the strings' BULBS warm and small (the old town's amber, 0.16 m across in 0.4 m of
// lit air); the far land's lit yards and village lights are larger things far off: plain points. The flat town's cool
// one in seven is dealt below. ON THE PROMENADE every lamp is a WALL LANTERN on its bracket or an ARCADE LANTERN hung in
// its vault ('bracket', 'wall', 'arcade'): none stands on a post, and each has its POOL OF LIGHT on the paving under it
const LAMP_KIND = {
  street: [0.25, 2.4, 0, 0], wide: [0.25, 2.4, 0, 0], gate: [0.25, 2.4, 0, 0], post: [0.25, 2.4, 0, 0],
  square: [0.25, 2.4, 1, 0], bracket: [0.25, 2.4, 1, 0], wall: [0.25, 2.4, 1, 0], arcade: [0.2, 2.0, 1, 0], bulb: [0.08, 0.4, 0, 0.25],   // (wall: a bracket by its other name; arcade: the smaller lantern hung in a vault)
  farm: [1.5, 6.0, 0, 0.25], village: [2.0, 8.0, 0, 0.25], hamlet: [1.0, 4.0, 0, 0.25],   // a steading's lit yard 3 m across in 12 m of lit air; a ridge hamlet's 4 m in 16; a plain village's lit fronts 2 m in 8
};
// the quads of a list of points { anchor, x, y, z, q: [4] } as one geometry (4 corners each, 2 triangles)
function quadGeometry(list) {
  const n = list.length, pos = new Float32Array(n * 12), anc = new Float32Array(n * 4), cor = new Float32Array(n * 8), q = new Float32Array(n * 16);
  const idx = n * 4 > 65535 ? new Uint32Array(n * 6) : new Uint16Array(n * 6), C = [-1, -1, 1, -1, 1, 1, -1, 1];
  for (let i = 0; i < n; i++) {
    const L = list[i];
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      pos[v * 3] = L.x; pos[v * 3 + 1] = L.y; pos[v * 3 + 2] = L.z; anc[v] = L.anchor; cor[v * 2] = C[k * 2]; cor[v * 2 + 1] = C[k * 2 + 1];
      q[v * 4] = L.q[0]; q[v * 4 + 1] = L.q[1]; q[v * 4 + 2] = L.q[2]; q[v * 4 + 3] = L.q[3];
    }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aAnchor', new THREE.BufferAttribute(anc, 1));
  g.setAttribute('aCorner', new THREE.BufferAttribute(cor, 2)); g.setAttribute('aQ', new THREE.BufferAttribute(q, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
const MOST_LAMPS = 3600, MOST_SMOKING = 150, PUFFS = 7;       // section 5's most; section 6's chimneys; 7 puffs a chimney (at 4 a plume was four separate balls: from the second on, 7 overlap)
export function makeGlow(ctx, o = {}) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  const group = new THREE.Group(); group.name = 'closing-glow';
  const plan = o.plan || {}, flat = plan.flat || {}, lit = (o.light && o.light.lit) || {}, lamps = [];
  const add = (anchor, x, y, z, kind, tint) => {
    if (lamps.length >= MOST_LAMPS) return false;
    const K = LAMP_KIND[kind] || LAMP_KIND.street; lamps.push({ anchor, x, y, z, q: [K[0], K[1], tint === undefined ? K[2] : tint, K[3]] }); return true;
  };
  // THE POOLS OF LIGHT (places of the plan, drawn before the lamps in their own mesh): under every wall and arcade
  // lantern a pool laid on its own ground 0.08 m over the paving (clear of the slabs' own skin), 1.6 lamp heights in
  // radius (8.8 m under a 5.5 m lantern: just over half the rows' 16 m step, so neighbours' pools only touch and each reads as its own), at 0.5 of its lamp's pale colour straight under it: SEEN
  // on paving that the rig alone leaves at about a fifth
  const pools = [], POOLED = { bracket: 1, wall: 1, arcade: 1 };
  const pool = (anchor, x, y, z, R, h, gain, tint) => pools.push({ anchor, x, y, z, q: [R, h, tint, -gain] });
  // 1. THE CURL'S LAMPS (the plan's { a, z, h, kind }): each h metres up its own ground's normal at its a
  let bulbs = 0, brackets = 0;
  for (const l of plan.lamps || []) { if (l.kind === 'bulb') bulbs++; if (l.kind === 'bracket') brackets++; const a = Math.min(596.5, Math.max(0, l.a)); add(a, 0, l.h, l.z, l.kind); if (POOLED[l.kind]) pool(a, 0, 0.08, l.z, 1.6 * l.h, l.h, 0.5, 1); }
  // 2. THE FLAT TOWN'S (the plan's { x, y, z, kind }): one street lamp in seven cool (its brackets on the promenade stay pale), by its own stream (every die drawn)
  const C = stream('closing-lampcool');
  for (const l of flat.lamps || []) {
    const cool = C() < 1 / 7, k = l.kind || 'street'; if (k === 'bulb') bulbs++; if (k === 'bracket') brackets++;
    add(-1, l.x, l.y, l.z, k, cool && (k === 'street' || k === 'wide') ? 2 : undefined);
    if (POOLED[k]) { const h = Math.max(2, l.y - PLAN.Y0); pool(-1, l.x, PLAN.Y0 + 0.08, l.z, 1.6 * h, h, 0.5, 1); }
  }
  // 3. THE PROMENADE'S BRACKET LANTERNS, from the lattice the sheen's program knows, when the plan's lists do not carry
  // them: both rows of fronts at z0 + step k from the town's first house (z -60) to the last front before the ring
  // (the plan's TOWN_Z1; without it 10 m short of the ring's plane), none along the hinge square's open side (gapL); the left row hangs on the
  // curl's first fronts (a = xL - 90, its height over the paving's y 7), the right row on the flat side's
  const lt = flat.lattice;
  if (lt && !brackets) for (let z = lt.z0 - lt.step * Math.floor((lt.z0 + 60) / lt.step); z <= (PLAN.TOWN_Z1 || PLAN.RING_Z - 10); z += lt.step) {
    const h = lt.y - PLAN.Y0, aL = Math.max(0, lt.xL - PLAN.HX);
    if (!(lt.gapL && z > lt.gapL[0] && z < lt.gapL[1])) { add(aL, 0, h, z, 'bracket'); pool(aL, 0, 0.08, z, 1.6 * h, h, 0.5, 1); }
    add(-1, lt.xR, lt.y, z, 'bracket'); pool(-1, lt.xR, PLAN.Y0 + 0.08, z, 1.6 * h, h, 0.5, 1);
  }
  // 3b. THE WORLD'S OWN LAMPS (o.own: flat-world places { x, y, z, kind } of the joiner's pier lanterns and the ring
  // base's low lamps): each a lantern like any other
  for (const l of o.own || []) add(-1, l.x, l.y, l.z, LAMP_KIND[l.kind] ? l.kind : 'gate');
  // 3c. THE RING'S PLACE (the plan's RING_X, RING_Z on the paving's Y0; never the lens): ONE warm pool on the forecourt's
  // paving, as from a light at the ring's own middle height over the paving (RING_Y - Y0), three such heights in
  // radius, 0.7 of the old town's amber straight under it (its stepped base hides that middle: on the paving round the
  // base, 16 m out, it stands at 0.22, at 30 m 0.06: a warm tint on the slabs, under a lantern's own pool). The fronts beside it take the same place's wash (the house program)
  { const h = PLAN.RING_Y - PLAN.Y0; pool(-1, PLAN.RING_X, PLAN.Y0 + 0.1, PLAN.RING_Z, 3 * h, h, 0.7, 0); }
  // 4. THE FAR LAND'S farm and village lights (makeFar's { x, y, z })
  for (const l of o.far || []) add(-1, l.x, l.y, l.z, LAMP_KIND[l.kind] ? l.kind : 'farm');
  // 5. THE STRINGS' BULBS, last (the first thing cut when the most is reached), when the plan's lists carry no bulb: one
  // every 1.5 m along each string { a0, z0, a1, z1, h, h0, h1 }, hanging 0.3 m lower at mid span; a under 0 is the flat side
  // of the hinge (x = 90 + a, over the paving's y 7)
  if (!bulbs) for (const s of plan.strings || []) {
    const len = Math.hypot(s.a1 - s.a0, s.z1 - s.z0), n = Math.max(1, Math.floor(len / 1.5));
    for (let j = 1; j < n; j++) {
      const t = j / n, a = s.a0 + (s.a1 - s.a0) * t, z = s.z0 + (s.z1 - s.z0) * t, e0 = s.h0 === undefined ? s.h : s.h0, e1 = s.h1 === undefined ? s.h : s.h1;
      const h = e0 + (e1 - e0) * t - 0.3 * 4 * t * (1 - t);   // from its one end's height to the other's, less the sag
      if (a >= 0) add(a, 0, h, z, 'bulb'); else add(-1, 90 + a, 7 + h, z, 'bulb');
    }
  }
  // THE SMOKE: 150 chimneys at most, taken evenly through the town's list from a seeded start (none where a is under 60:
  // the ring's height rule), each with its own life (5 to 7 s), phase and size from its own stream
  const S = stream('closing-smoke'), start = S(), puffs = [];
  const ch = (o.chimneys || []).filter((c) => !(c.a >= 0 && c.a < 60)), nS = Math.min(MOST_SMOKING, ch.length);
  for (let k = 0; k < nS; k++) {
    const c = ch[Math.min(ch.length - 1, Math.floor((k + start) * ch.length / nS))], life = 5 + 2 * S(), ph = S(), size = S();
    const curl = c.a >= 0, x = curl ? 0 : c.x, y = curl ? c.top : c.y, z = c.z;
    // THICKER NEAR THE WAY: a chimney within 150 m of the promenade's axis (x 72: a + 18 along the curl's ground) gives 10
    // puffs for 7, each a third larger and denser
    const nearWay = (curl ? c.a + 18 : Math.abs(c.x - 72)) < 150, n = nearWay ? 10 : PUFFS;
    for (let j = 0; j < n; j++) puffs.push({ anchor: curl ? Math.min(596.5, c.a) : -1, x, y, z, q: [life, ph + j / n, size, nearWay ? 2 : 1] });
  }
  const knots = o.bend && o.bend.uniforms ? o.bend.uniforms.uBendK : { value: new Float32Array(4 * 65) };
  const uniforms = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
    uBendK: knots, uGlowT: { value: 0 },
    uViewH: { value: 450 },                                   // the view's height in pixels: set before every draw from the renderer's own target
    uSprite: lit.uSprite || { value: new THREE.Vector4(3.0, 0.36, 0.4, 2.5) },
    uLampOld: lit.uLampOld || { value: lin(LAMP.old) }, uLampHalo: lit.uLampHalo || { value: lin(LAMP.halo) },
    uLampPale: lit.uLampPale || { value: lin(LAMP.pale) }, uLampCool: lit.uLampCool || { value: lin(LAMP.cool) },
    uSmokeC: { value: lin('#9a96b4').multiplyScalar(0.45) },  // a pale plume in the dusk sky's fill
    uSmokeG: { value: (lit.uBand ? lit.uBand.value.clone() : lin(GLOWS.amber.band)).multiplyScalar(0.7) },   // where it faces the afterglow: 0.7 of the band's radiance
    uSmokeW: { value: lin('#c88a6a').multiplyScalar(0.22) },  // where it faces its own ground: the lamps' light
    uGlow3: lit.uGlow3 || { value: new THREE.Vector3(Math.sin(GLOW_AZIMUTH * DEG), 0.1, -Math.cos(GLOW_AZIMUTH * DEG)) },
  });
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, fog: true, transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const size = new THREE.Vector2();
  const seeView = (renderer) => { const rt = renderer.getRenderTarget(); uniforms.uViewH.value = rt ? rt.height : renderer.getDrawingBufferSize(size).y; };
  const geos = [], mesh = (list, name, order) => {
    const g = quadGeometry(list), m = new THREE.Mesh(g, mat); geos.push(g);
    m.name = name; m.frustumCulled = false; m.renderOrder = order; m.castShadow = false; m.onBeforeRender = seeView; group.add(m); return m;
  };
  mesh(pools.concat(lamps), 'closing-lamps', 5); mesh(puffs, 'closing-smoke', 6);
  return {
    group, count: lamps.length, pools: pools.length, smoking: nS, tris: 2 * (lamps.length + pools.length + puffs.length),
    update(time) { uniforms.uGlowT.value = time; },
    dispose() { for (const g of geos) g.dispose(); mat.dispose(); },
  };
}
