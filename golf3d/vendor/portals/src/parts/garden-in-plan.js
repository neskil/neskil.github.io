// garden-in-plan: "The Garden Drawn from Above" - hero set piece: THE POOL AND THE THICKET, one picture in two halves.
// New Kingdom painted sunk relief. A limestone drawing board 240 x 420 m, hinged along its near edge, carries the
// pool in plan (300 x 110 m of Egyptian blue ruled with soot zigzags, a real basin 0.6 m deep, a block border),
// ~130 trees laid flat away from the water on every bank, lotus in profile, their leaves in plan, 30 ducks and 20
// tilapia. On the far bank stands the papyrus fan (rows of umbels, 70 m tall) on a backing panel up which the zigzag
// water climbs register by register, six ranks of birds hidden between the stems until they are let go, the tabby
// on two bent stems, and in front the two palm columns (62 m) with the wreath (15 m opening) between them.
//
// HOW THE STYLE IS MADE (use these for the whole world, so the hero is not pasted in)
//   EXACT COLOUR     the world runs post.flat 1 (no tone map), bloom 0, saturation 1, contrast 1, no vignette or
//                    grain: a pigment is written as its own display-linear colour and shows as that hex. There is
//                    no inverse tone map; nothing a material writes is above 1. Every material ends in edgeTone().
//   STYLE_GLSL       fragment chunk: uPig[7] pigments, stoneAt() chiselled limestone, edgeTone(col, e) the ONLY
//                    shading (e > 0 lit rim, a soft shoulder toward white, e < 0 blue-grey shadow line, 0 flat), stageAt() the finishing
//                    front (0 bare, 1 red grid, 2 black outline, 3 cut, 4 colour), gridAt(), paintAt() (ragged
//                    flood of pigment, flaked patches; uWeather 0..1 = how much paint is gone).
//   WATER_GLSL       waterAt(): blue with zigzags that march in alternate directions, pitch doubling with distance,
//                    melting to the flat tint (no moire); returns the edge term of the raised ribs too.
//   SLAB_VS / SLAB_FS / slabMaterial(U)   the slab family: every figure is a real slab 0.2-0.5 m thick extruded
//                    from a code-authored outline with a bevelled stone rim (slabGeo), its face painted from the
//                    atlas; lit rim / shadow line come from the atlas depth channel sampled along the sun (2 taps),
//                    the rim and wall from their real normals. One vertex format (see SLAB_VS) makes them lie flat
//                    and hinge upright, sway, slide (fish), fly in ranks with two hinged wings (birds), keep a
//                    socket in the floor, or stay at least 1.6 px wide (stems).
//   makeAtlas (via hero.atlas.tile) + curve/offsetPoly/slabGeo/makeBatch + hero.place()   author more figures:
//                    P = hero.atlas.tile(w, h, [x0, y0, x1, y1]) BEFORE the textures upload is not possible after
//                    build, so ask for new figures here; for world-side flat work use stoneMaterial(U, extra, FS)
//                    with your own fragment shader built on STYLE_GLSL (see FLOOR_FS and PANEL_FS for the pattern).
//   makeStyleUniforms()   one uniform set shared by reference (hero.uniforms): uSunL, uFront, uTime, uPig ...
//                    Give your own materials the same objects and the whole world is finished by one front.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update, dispose, ground:false, ... }
//   opts.palette  seven hex strings [stone, blue, green, red ochre, yellow ochre, soot, gypsum]; opts.outline
//   opts.detail   0.6-1 (default ctx.quality.detail): thins margin lotus, leaves and a third of the papyrus
//   opts.weather  0..1 paint lost (default per seed: usually fresh, one seed in four weathered)
//   Per seed: which tree is which in the rows, blue/white lotus mix, fish carrying buds, wreath order, weather.
//   Size: board x -120..120, z -210..210 (hinge at z = +210), thicket to y 75. Origin = centre of the board, level.
//   Cost: ~120k triangles, 4 draw calls (board, panel, two slab batches), two 2048 canvas textures, no lights,
//   ~250 ms build. Expects: stone sky all round, the camera arriving from +z, the sun low on the starboard side.
//
// PROGRESS (nothing here runs on wall-clock time once you call a setter; untouched, it plays a demo loop)
//   setProgress(u)   the brief's schedule: board tipped 30 deg until u 0.275 then laid down by u 0.5 (tiltAt),
//                    the finishing front (frontAt) and the ranks of birds from u 0.7 (flightAt, seconds).
//   setTilt(rad) setFront(z) setFlight(sec) setRise(k|-1) setSun(worldDir)   the same things one by one.
//   Trees, lotus and ducks hinge up by the camera's own position (z ahead of it), read from camera.matrixWorld.
//   The board turns about the hinge: test path clearance against the TILTED board (hero.garden is the tilted
//   group; hero.garden.worldToLocal(p).y is the height above the board).
//
// ANCHORS (hero-local, board level)
//   portalSeat { position, facing, radius }  centre of the wreath; the path's last 60 m rise at 36 deg into it
//   flyThrough   ten points: over the hinge at y 38, down to the water at z 93, along the axis at y 2.2, up from
//                z -100 between the columns; >= 6 m clear of lotus (x +-8.3), ducks, columns (x +-11) and birds
//   hinge {a, b}, pool {center, half}, viewpoints {page, onWater, underTiers}, cat, thicket, columns, tiers, sun
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#EDE3CC', '#2F62A6', '#3F8F5C', '#B5532B', '#DBA640', '#1C1A18', '#F8F4E9'];
export const OUTLINE = '#7A3B22';
// EXACT COLOUR: the world runs the engine's flat post (post: { flat: 1, bloom: { strength: 0 }, ... }): the linear
// colour a material writes reaches the screen as that colour, so pigments are written as themselves and there is no
// inverse tone map anywhere. Nothing is brighter than 1: the lit rim is a soft shoulder toward white (edgeTone).

// ---------------------------------------------------------------------------------------------------------------
// STYLE_GLSL: everything a fragment shader of this world needs. Colours are display-linear throughout.
//   uPig[7]   stone, blue, green, red ochre, yellow ochre, soot, gypsum      uLineC  the red-brown outline
//   uShadeC   the blue-grey of a shadow line     uSunL  sun direction in the space the surface is drawn in
//   uFront    plane (n.xyz, d): metres behind the finishing front = dot(n, p) + d;  uFrontW  metres per stage
//   uFrontMin the least stage of anything standing above the board (2.5 = the fan is at least a line drawing)
// ---------------------------------------------------------------------------------------------------------------
// signed distance (p units, > 0 where the paint is gone) to the border of the set of cells of a jittered tessellation
// whose seed is over tA (x of the result; nA = the normal toward the paint, cA = the nearest lost seed, y = its
// hash) and over tB (z, nB). A seed's loss is base + grad.(seed - p), plus for the large chips the faster octave
// read at the seed itself, plus its own jitter. No textures and no derivatives inside the loops.
const CELLS_GLSL = (name, exact) => /* glsl */`
  vec3 ${name}(vec2 p, vec2 rot, float cell, float tA, float tB, float jit, float base, vec2 grad, out vec2 nA, out vec2 nB, out vec2 cA){
    vec2 q = vec2(rot.x*p.x - rot.y*p.y, rot.y*p.x + rot.x*p.y)/cell, i0 = floor(q), f = q - i0;
    float lA = 9., kA = 9., lB = 9., kB = 9.;
    vec2 plA = vec2(0.), pkA = vec2(1., 0.), plB = vec2(0.), pkB = vec2(1., 0.);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y)), i = i0 + o; float h = h21(i + 11.1);
      vec2 c = o + 0.5 + (vec2(h, fract(h*91.7)) - 0.5)*0.84;
      vec2 wr = (i0 + c)*cell, w = vec2(rot.x*wr.x + rot.y*wr.y, -rot.y*wr.x + rot.x*wr.y);
      float v = base + dot(grad, w - p)${exact ? ' + 0.38*vnoise(w*0.085 + 7.)' : ''} + (fract(h*517.3) - 0.5)*jit;
      vec2 r = c - f; float d = dot(r, r);
      if (v > tA) { if (d < lA) { lA = d; plA = c; } } else if (d < kA) { kA = d; pkA = c; }
      if (v > tB) { if (d < lB) { lB = d; plB = c; } } else if (d < kB) { kB = d; pkB = c; }
    }
    vec2 a = pkA - plA, b = pkB - plB; float la = max(length(a), 1e-3), lb = max(length(b), 1e-3);
    a /= la; b /= lb;
    nA = vec2(rot.x*a.x + rot.y*a.y, -rot.y*a.x + rot.x*a.y); nB = vec2(rot.x*b.x + rot.y*b.y, -rot.y*b.x + rot.x*b.y);
    cA = (plA - f)*cell;
    return vec3((kA - lA)/(2.*la)*cell, h21(i0 + floor(plA) + 5.5), (kB - lB)/(2.*lb)*cell);
  }`;

export const STYLE_GLSL = /* glsl */`
  uniform vec3 uPig[7];
  uniform vec3 uLineC, uShadeC, uSunL, uRimC;
  uniform vec4 uFront;
  uniform float uTime, uFrontW, uFrontX, uWeather, uFrontMin;
  float h21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
  // dressed limestone: long diagonal chisel strokes as fine grey hatching, mean = uPig[0]. p in metres on the
  // surface, px = metres per pixel there (take fwidth outside any loop). Strokes melt into the flat tint when small.
  vec3 stoneAt(vec2 p, float px){
    vec2 q = vec2(p.x*0.8 + p.y*0.6, -p.x*0.6 + p.y*0.8);
    float near = 1. - smoothstep(0.05, 0.16, px), mid = 1. - smoothstep(0.35, 1.1, px);
    float a = vnoise(vec2(q.x*0.42, q.y*9.)) - 0.5;            // fine tooth strokes, 11 cm apart, 2.4 m long
    float b = vnoise(vec2(q.x*0.11 + 3., q.y*1.7 + 9.)) - 0.5; // the broader passes of the claw chisel
    float c = vnoise(p*0.035 + 17.) - 0.5;                     // the bed of the stone
    float nick = smoothstep(0.80, 0.86, vnoise(vec2(q.x*0.9 + 40., q.y*14.)))*near;
    return uPig[0]*(1. + 0.085*a*near + 0.075*b*mid + 0.035*c - 0.07*nick);
  }
  // the edge term, the only shading there is: e > 0 a wall facing the sun (lit rim, to 1.25),
  // e < 0 a wall turned from it (shadow line 0.55, tinted blue-grey). Returns the colour as it is seen.
  // (a chip of lost paint, found by paintAt, brings its own hairline and the red sketch that shows inside it)
  float gChipE = 0., gChipS = 0.;
  vec3 edgeTone(vec3 col, float e){
    col = mix(col, uPig[3], gChipS);
    e = mix(e, gChipE, step(0.05, abs(gChipE)));
    vec3 sh = mix(col, col*uShadeC*1.75, 0.9)*0.56;
    vec3 d = mix(col, sh, clamp(-e, 0., 1.));
    vec3 r = mix(vec3(1.), uRimC*1.25, clamp(e, 0., 1.));         // the lit wall of a cut: d*r, eased so it never passes 1
    return d*r/max(1. + (r - 1.)*d, 0.2);
  }
  // stage of the work at p (in the garden's own space): 0 bare, 1 grid, 2 outline, 3 cut, 4 colour.
  // The work stands in BANDS, each uFrontW metres deep, with a ragged but hard brush edge between one and the
  // next: colour (4.7) | cut, unpainted (3.5) | black outline (2.5) | the red grid being ruled (1..1.9) | bare.
  float stageAt(vec3 p){
    float B = max(uFrontW, 1.), T = max(0.1*B, 1.2), G = 3.*B;
    float rag = (vnoise(p.xz*0.07 + p.y*0.05) - 0.5)*min(0.55*B, 26.) + (vnoise(p.xz*0.43 + p.y*0.37 + 5.) - 0.5)*0.14*B;
    float s = dot(uFront.xyz, p) + uFront.w - uFrontX*abs(p.x) + rag;
    T = max(0.7*fwidth(s), 1e-3);                      // a brush edge is hard: one pixel of the stage value, no ramp
    float st = clamp((s + 2.*B + 2.*G)/G, 0., 1.) + 0.9*clamp((s + 2.*B + G)/G, 0., 1.)
      + 0.6*smoothstep(-T, T, s + 2.*B) + smoothstep(-T, T, s + B) + 1.2*smoothstep(-T, T, s);
    return max(st, uFrontMin*smoothstep(2., 6., p.y));
  }
  // the draughtsman's red grid, squares of 6 m, ruled line by line as the stage passes 0..1; g = line coverage
  float gridAt(vec2 p, float px, float st){
    vec2 c = p/6., f = abs(fract(c + 0.5) - 0.5)*6.;
    float w = max(0.08, 0.8*px);
    vec2 ln = (1. - smoothstep(w, w + px, f))*min(0.08/w + 0.4, 1.);
    float draw = clamp(st, 0., 1.);
    // each line is ruled whole, from the finished side outward: one threshold per line, so lines end at different lengths
    float gx = ln.x*step(fract(floor(c.x + 0.5)*0.618 + 0.11)*0.94, draw);
    float gy = ln.y*step(fract(floor(c.y + 0.5)*0.382 + 0.37)*0.94, draw);
    return max(gx, gy)*(1. - smoothstep(1.2, 2.6, px));
  }
  // old paint lets go as weathering, not as a pattern: a slow loss field (tens of metres) takes the paint away
  // wholesale and leaves whole fields intact; the border between paint and stone is broken into angular chips,
  // the cells of two jittered tessellations turned against each other (large chips, and small ones a third their
  // size that nibble the edge, lie loose in the paint just outside it and stay behind as specks just inside).
  // gLoss: set before paintAt to bias the loss (the fan's panel loses more with height).
  float gLoss = 0., gLost = 0.;
  // value noise with its gradient (x: value, yz: d/dp), from the same four hashes
  vec3 vnoised(vec2 p){ vec2 i = floor(p), f = fract(p), u = f*f*(3. - 2.*f), du = 6.*f*(1. - f);
    float a = h21(i), b = h21(i + vec2(1, 0)), c = h21(i + vec2(0, 1)), d = h21(i + vec2(1, 1)), k1 = b - a, k2 = c - a, k4 = a - b - c + d;
    return vec3(a + k1*u.x + k2*u.y + k4*u.x*u.y, du*vec2(k1 + k4*u.y, k2 + k4*u.x)); }
${CELLS_GLSL('chipBig', true)}${CELLS_GLSL('chipSmall', false)}  // paint at this stage: pigment floods the cut in one ragged brush edge as the stage passes 3.7..4; old paint
  // has let go (uWeather 0..1 = how much is gone). Leaves in gLost how much of the finished paint is lost here.
  float paintAt(vec2 p, float st, float px){
    float fine = 1. - smoothstep(0.25, 1.1, px);
    float n = mix(0.5, vnoise(p*0.55), fine)*0.6 + vnoise(p*0.06 + 11.)*0.4;
    float flood = smoothstep(3.7, 4.0, st - (n - 0.5)*0.3);
    vec2 s2 = vec2(uSunL.x, uSunL.z + uSunL.y); s2 /= max(length(s2), 1e-3);
    float thr = mix(0.84 - 0.6*uWeather, 0.41, smoothstep(0.2, 0.6, uWeather)), pxp = 0.4*px;
    const float C1 = 2.3, C2 = 0.72;
    vec2 n1, n1b, c1, n2a, n2b, c2;
    // the loss field here and its slope: the slow octave is carried to the seeds by its slope, the faster one is
    // read at each large seed; the small seeds take both by slope (they are within a metre)
    vec3 nA = vnoised(p*0.035 + 31.), nB = vnoised(p*0.085 + 7.);
    float LA = 0.62*nA.x + gLoss, L0 = LA + 0.38*nB.x; vec2 gA = nA.yz*0.0217, gB = nB.yz*0.0323;
    vec3 k1 = chipBig(p, vec2(0.8776, 0.4794), C1, thr, thr, 0.05, LA, gA, n1, n1b, c1);
    vec3 k2 = chipSmall(p + 5.3, vec2(0.6216, -0.7833), C2, thr + 0.05, thr - 0.055, 0.19, L0, gA + gB, n2a, n2b, c2);
    float on2 = 1. - smoothstep(0.1*C2, 0.26*C2, pxp), far = smoothstep(0.12*C1, 0.27*C1, pxp);
    float sdA = mix(-4., k2.x, on2), sdB = mix(4., k2.z, on2);
    float sd = k1.x; vec2 nrm = n1;
    if (sdB < sd) { sd = sdB; nrm = n2b; }
    if (sdA > sd) { sd = sdA; nrm = n2a; }
    float m = smoothstep(-pxp, pxp, sd);
    float l0 = L0 - thr, lf = smoothstep(-0.006 - 0.02*pxp, 0.006 + 0.02*pxp, l0);
    float lost = mix(m, lf, far);
    float hl = max(0.05, 2.2*pxp), band = m*(1. - smoothstep(hl - pxp, hl + pxp, sd))*(1. - far);
    gChipE = band*(dot(nrm, s2) > 0. ? -0.9 : 0.45)*flood;
    // the red first sketch shows again where the paint has gone: one stroke through a large chip, here and there
    float lw = max(0.04, 1.6*pxp), sa = k1.y*40.;
    float sk = (1. - smoothstep(lw, lw + pxp, abs(dot(c1, vec2(cos(sa), sin(sa))) - 0.3)))*step(0.72, k1.y)*(1. - smoothstep(0.05*C1, 0.15*C1, pxp));
    gChipS = sk*m*(1. - band)*0.4*flood*smoothstep(0., 0.3, k1.x);
    gLost = lost*flood;
    return flood*(1. - lost);
  }
`;

// Egyptian water, never transparent: flat blue ruled with soot zigzags. Rows run along p.x and are stacked along
// p.y; alternate rows travel opposite ways. The pitch doubles whenever a line would fall under ~1.5 px and the
// whole thing melts to its flat average tint far off, so it cannot moire. Returns display colour + edge term.
export const WATER_GLSL = /* glsl */`
  // one row: x = coverage of the soot line, y = the lit rim beside it, z = the shadow line on its other side.
  // The line is never more than ~4 px thick however near; rim and shadow are hard bands 1.5-3 px wide, no ramp.
  vec2 gFwW = vec2(0.01), gDxW = vec2(0.01, 0.), gDyW = vec2(0., 0.01);   // derivatives of the water's own coordinates, taken once in waterAt
  vec3 zigRow(vec2 p, float P, float px, vec2 sun2){
    float row = floor(p.y/P), dir = mod(row, 2.)*2. - 1.;
    float lam = 0.9*P, A = 0.22*P;
    float x = p.x + dir*uTime*0.42*sqrt(P) + row*1.37;
    float ph = fract(x/lam), up = step(0.5, ph)*2. - 1.;
    float tri = (abs(ph - 0.5)*4. - 1.)*A;
    float sd = (p.y - (row + 0.5)*P - tri)*0.714;          // signed distance to the line (slope ~0.98)
    vec2 n = vec2(-up*0.70, 0.714);                        // normal of this arm of the zigzag
    // what one pixel is worth ACROSS THIS ARM: the footprint measured along the arm's own normal, so the arm that
    // runs toward the eye (where a pixel is long in depth) is as thin on screen as the arm that runs across
    float pl = max(length(vec2(dot(n, gDxW), dot(n, gDyW))), 1e-4);
    float hw0 = 0.058*P, hw = clamp(hw0, 0.75*pl, max(2.1*pl, 0.012)), aa = 0.5*pl, bw = max(0.012, 1.9*pl), ad = abs(sd);
    float cov = (1. - smoothstep(hw - aa, hw + aa, ad))*min(hw0/hw + 0.1, 1.);
    float band = smoothstep(hw - aa, hw + aa, ad)*(1. - smoothstep(hw + bw - aa, hw + bw + aa, ad))*(1. - smoothstep(0.014*P, 0.034*P, px));
    float s = sign(sd)*dot(n, sun2);
    return vec3(cov, band*step(0.15, s), band*step(0.15, -s));
  }
  float gZig = 0.;        // set before waterAt: extra octaves of pitch (the bare black outline of the water is drawn bolder)
  vec4 waterAt(vec2 p, float px, vec2 sun2, float far, out float cov){
    gDxW = dFdx(p); gDyW = dFdy(p); gFwW = abs(gDxW) + abs(gDyW);
    float lv0 = log2(max(px, 1e-4)*2.6), lvl = clamp(lv0 + 0.7 + gZig, -1., 4.), l0 = floor(lvl), f = smoothstep(0.78, 1., lvl - l0);
    vec3 a = zigRow(p, 3.*exp2(l0), px, sun2), b = zigRow(p, 6.*exp2(l0), px, sun2);
    vec3 z = mix(a, b, f);
    float melt = max(smoothstep(2.9, 3.6, lv0), far);      // held steady: flat tint before the rows can shimmer
    z = mix(z, vec3(0.16, 0., 0.), melt); cov = z.x;
    float grain = (vnoise(p*7.) - 0.5)*(1. - smoothstep(0.04, 0.2, px));   // Egyptian blue is laid coarse
    vec3 col = mix(uPig[1]*(1. + 0.16*grain), uPig[5], z.x);
    col = mix(col, uPig[0], max(z.y, z.z));                // the rib's walls are stone: lit cream, or blue-grey in shadow
    return vec4(col, z.y - z.z);
  }
  // the skiff's wake: two zigzags of doubled height that run back from the bow and march astern.
  // uWake: bow x, bow z, strength. Returns x coverage, y rim, z shadow, w the strip of water the wake keeps clear.
  uniform vec4 uWake;
  vec4 wakeAt(vec2 p, float px, vec2 sun2){
    float sg = p.x < uWake.x ? -1. : 1.;
    vec2 q = vec2(abs(p.x - uWake.x) - 1.25, p.y - uWake.y);
    float al = dot(q, vec2(0.584, 0.811)), ac = q.x*0.811 - q.y*0.584;
    float lam = 1.7, A = 0.62, ph = fract((al - uTime*2.4)/lam), up = step(0.5, ph)*2. - 1.;
    float sd = (ac - (abs(ph - 0.5)*4. - 1.)*A)*0.565, ad = abs(sd);
    vec2 nl = vec2(-up*0.825, 0.565);                      // normal of this arm in (along, across)
    vec2 nw = nl.x*vec2(sg*0.584, 0.811) + nl.y*vec2(sg*0.811, -0.584);
    float pl = max(length(vec2(dot(nw, gDxW), dot(nw, gDyW))), 1e-4);
    float hw = clamp(0.09, 0.75*pl, max(2.4*pl, 0.012)), aa = 0.5*pl, bw = max(0.012, 1.9*pl);
    float on = uWake.z*step(0., al)*(1. - smoothstep(46., 52., al))*(1. - smoothstep(0.25, 0.6, px));
    float cov = 1. - smoothstep(hw - aa, hw + aa, ad);
    float band = smoothstep(hw - aa, hw + aa, ad)*(1. - smoothstep(hw + bw - aa, hw + bw + aa, ad));
    float s = sign(sd)*dot(nw, sun2);
    float clearW = on*(1. - smoothstep(A + 0.42 - aa, A + 0.42 + aa, abs(ac)));
    return vec4(cov, band*step(0.15, s), band*step(0.15, -s), clearW);
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// the slab family. One vertex format carries every hinging, swaying, flying thing:
//   position/normal/uv  the figure in its own standing frame (x right, y up from its pivot, +z its painted face)
//   aOrg   pivot in garden space (xyz) and yaw (w)
//   aAnim  mode, trigger, phase 0..1, extra      aAux  secondary hinge: x, y, amplitude (rad), frequency (rad/s)
//   modes: 0 upright (sways by 'extra' with height)   1 lies flat, hinges upright as the camera comes within
//   'trigger' metres ahead   2 fish, lies in the surface and slides along its length   3 bird (trigger = tier,
//   extra = side -1/+1; wings are the parts with aAux.z != 0)   4 socket quad left in the floor   5 always flat
// ---------------------------------------------------------------------------------------------------------------
export const SLAB_VS = /* glsl */`
  attribute vec4 aOrg, aAnim, aAux;
  uniform float uTime, uFlight, uFish, uPxAng, uSlide;
  uniform vec3 uCamL, uEyeL;   // uCamL: the camera that triggers hinging; uEyeL: the eye that is drawing, both in garden space
  uniform vec4 uRise;          // x: all rise 0..1 override (-1 = by camera), y: finish fraction, z: look yaw, w: fish range
  uniform vec4 uFront; uniform float uFrontW, uFrontX;
  varying vec2 vUv; varying vec3 vG, vT, vB, vN; varying float vFace, vMode, vHide, vThin, vFlat, vStage, vInk;
  float vh21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
  float vvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(vh21(i), vh21(i + vec2(1, 0)), f.x), mix(vh21(i + vec2(0, 1)), vh21(i + vec2(1, 1)), f.x), f.y); }
  float kUp, cy, sy, flapA, hingeA; vec2 flight;
  vec3 rig(vec3 v, float w){
    int mode = int(aAnim.x + 0.5);
    // secondary hinge in the plane of the slab (tails, heads, feet, crowns), or a wing about the body's axis
    vec2 h = aAux.xy*w;
    if (mode == 3) { float c = cos(flapA), s = sin(flapA); v.y -= h.y; v = vec3(v.x, v.y*c - v.z*s, v.y*s + v.z*c); v.y += h.y; }
    else { float c = cos(hingeA), s = sin(hingeA); v.xy -= h; v = vec3(v.x*c - v.y*s, v.x*s + v.y*c, v.z); v.xy += h; }
    // lie down: -90 deg about x at the pivot when kUp = 0 (up goes to -z of the figure, the face looks at the sky)
    float a = -1.5707963*(1. - kUp), c = cos(a), s = sin(a);
    v = vec3(v.x, v.y*c - v.z*s, v.y*s + v.z*c);
    v = vec3(v.x*cy + v.z*sy, v.y, -v.x*sy + v.z*cy);
    return v;
  }
  void main(){
    int mode = int(aAnim.x + 0.5);
    float ph = aAnim.z*6.2831853;
    cy = cos(aOrg.w); sy = sin(aOrg.w);
    vec3 org = aOrg.xyz; kUp = 1.; flapA = 0.; flight = vec2(0.); vHide = 0.;
    hingeA = aAux.w < 0. ? aAux.z*uRise.z : aAux.z*sin(uTime*aAux.w + ph);
    if (mode == 1) {
      float d = uCamL.z - org.z;
      float k = 1. - smoothstep(aAnim.y*uRise.y, aAnim.y, d);
      k = uRise.x >= 0. ? clamp(uRise.x*1.6 - aAnim.z*0.6, 0., 1.) : k;
      kUp = k*k*(3. - 2.*k); kUp += 0.06*sin(kUp*3.14159)*sin(uTime*5. + ph);       // a stiff shudder on the way up
      // a lotus lies shut and opens like a fan as it comes upright (its two outer petals are the hinged parts)
      hingeA = hingeA*kUp - 2.7*aAux.z*step(0.1, abs(aAux.z))*step(aAux.w, 2.)*(1. - smoothstep(0.5, 1., kUp));
      org.y += 0.05 + 0.35*sin(kUp*3.14159) + aAnim.w*0.14*kUp*sin(uTime*1.9 + ph);
      org.x += aAnim.w*sign(org.x)*4.5*(1. - smoothstep(0., 45., d))*kUp;
    } else if (mode == 2) {
      kUp = 0.; float dir = aAnim.w, rng = uRise.w;
      float z = mod(org.z - uFish + dir*uTime*aAnim.y + rng*0.5, rng) - rng*0.5;
      org.z = z + uFish; org.y += 0.05; org.x += 0.6*sin(uTime*0.7 + ph);
    } else if (mode == 3) {
      float q = max(uFlight - aAnim.y*1.0 - aAnim.z*0.25, 0.);
      float lift = smoothstep(0., 1.2, q);
      flapA = aAux.z*lift*(0.25 + 0.75*(0.5 + 0.5*sin(uTime*aAux.w + ph*3. + aAnim.y)));
      float rise = 1.7*(q - (1. - exp(-q)));
      org += vec3(aAnim.w*(0.75*q + 2.*(1. - exp(-q*0.5))), rise + 0.5*sin(uTime*2.1 + ph)*lift, 0.8*q + 6.*(1. - exp(-q*0.7)));
      hingeA = 0.;
    } else if (mode == 4 || mode == 5) { kUp = 0.; hingeA = 0.; org.y += mode == 4 ? 0.02 : 0.05; }
    else if (mode == 6) hingeA = 0.;
    float run = 1.;
    if (mode == 7) {
      float rg = max(aAnim.y, 1.), sl = mod(aAnim.z*rg + uTime*aAnim.w + uSlide, rg) - rg*0.5;
      org += vec3(cy, 0., -sy)*sl; run = smoothstep(0., 5., rg*0.5 - abs(sl));
      org.y += 0.12*abs(sin(uTime*aAnim.w*1.4 + ph));
    }
    // rank -1: the umbels the far line drawing keeps are drawn larger there, so each stays a shape and not a dot
    if (mode == 0 && aAnim.y < -0.5) run *= 1. + 1.55*smoothstep(0.26, 0.6, uPxAng*distance(aOrg.xyz, uEyeL));
    // A THING THAT IS ONLY DRAWN IS NOT A SLAB YET. While a figure lies on the board ahead of the cutting front
    // (stage under 4: grid, black outline, or cut but not yet painted) it has no thickness, and its rim is laid out flat round it as the
    // draughtsman's contour: one closed band about two pixels wide on screen whatever the distance and however the
    // board is tipped (the band is widened along the line of sight by 1/sin of the grazing angle). The slab takes
    // its full thickness as the paint front passes.
    vec3 lp = position*run; vFlat = 0.; vStage = -1.; vInk = 1.; vec3 skirt = vec3(0.);
    // (the same holds for a tree that has already stood up beyond the paint front: its contour is its own rim)
    float lie = (mode == 1 || mode == 2 || mode == 5) ? 1. : 0.;
    if (lie > 0.) {
      float FB = max(uFrontW, 1.);
      float rag = (vvn(org.xz*0.07 + org.y*0.05) - 0.5)*min(0.55*FB, 26.) + (vvn(org.xz*0.43 + org.y*0.37 + 5.) - 0.5)*0.14*FB;
      float sF = dot(uFront.xyz, org) + uFront.w - uFrontX*abs(org.x) + rag;
      // the work reaches a lying figure WHOLE, figure by figure (its stage is read once, at its root, and handed to the
      // fragment shader), so its contour, its cut and its paint never disagree across it
      float FR = 0.12*FB, FG = 3.*FB;
      float stv = clamp((sF + 2.*FB + 2.*FG)/FG, 0., 1.) + 0.9*clamp((sF + 2.*FB + FG)/FG, 0., 1.)
        + 0.6*smoothstep(-FR, FR, sF + 2.*FB) + smoothstep(-FR, FR, sF + FB) + 1.2*smoothstep(-FR, FR, sF);
      vStage = stv;
      vec3 ve = org - uEyeL, fn = rig(vec3(0., 0., 1.), 0.);      // fn: the normal of the figure's face, in garden space
      float vl = max(length(ve), 1e-3), sinG = abs(dot(ve, fn))/vl, mpp = uPxAng*vl;
      // flat until the colour comes; and only where the figure's own drawn lines are too fine to carry it (beyond
      // ~35-80 m): near the eye it is the slab it always was, drawn with the lines of its atlas
      vFlat = lie*(1. - smoothstep(3.6, 4.4, stv))*smoothstep(0.09, 0.2, mpp);
      // where the board is seen so flat that a crown is under three pixels deep, the contour stands back to a light line
      // (a mark under three pixels is stipple, not a line); this is a rule of the cutting on the board, never of distance
      vInk = mix(0.5, 1., smoothstep(1.0, 2.8, 5.*sinG/max(mpp, 1e-5)));
      // and a figure under about ten pixels long (a pad, a bud) is left undrawn until it can be a shape: never a ring-dot
      float fsize = mode == 1 ? aAnim.y*0.12 : mode == 2 ? 9. : 3.;
      // one ramp: nothing under 6 pixels, and from 11 pixels of length on the contour is at full strength whatever the angle
      float big = smoothstep(6., 11., fsize/max(mpp, 1e-5)); vInk = mix(vInk, 1., big)*big;
      if (normal.z < 0.5) {
        // the rim is laid a finger above the face, so a neighbour's blank stone never covers part of a contour
        if (normal.z < 0.2 && position.z < 0.) lp.z = mix(lp.z, -lp.z + 0.06, vFlat); else lp.z += 0.22*vFlat;
        vec2 n2 = normal.xy/max(length(normal.xy), 1e-3);
        vec3 ng = rig(vec3(n2, 0.), 0.);
        vec3 vin = ve - fn*dot(ve, fn); vin /= max(length(vin), 1e-3);       // the line of sight laid into the figure's plane
        ng += vin*dot(ng, vin)*(1./clamp(sinG, 0.16, 1.) - 1.);
        skirt = ng*(1.3*uPxAng*vl*smoothstep(0.3, 0.7, vFlat));
      }
    }
    vec3 p = rig(lp, 1.) + org + skirt;
    if (mode == 0 || mode == 6) {       // stems, umbels, wreath: sway that grows with height, shared so that parts stay joined
      float hh = p.y*0.0143; float sw = aAnim.w*hh*hh*(sin(uTime*0.9 + p.x*0.05) + 0.4*sin(uTime*2.3 + ph));
      p.x += sw; p.z += 0.3*sw;
    }
    if (mode == 6) {       // a thin ribbon never draws under ~1.6 px: aAux.xy = offset from its centre line, aAux.z = its width there
      float k = max(1., uPxAng*distance(p, uEyeL)*2.8/max(aAux.z, 1e-3)); p += rig(vec3(aAux.xy, 0.), 0.)*(k - 1.);
    }
    vN = rig(normal, 0.); vT = rig(vec3(1., 0., 0.), 0.); vB = rig(vec3(0., 1., 0.), 0.);
    vFace = step(0.9, abs(normal.z)); vMode = aAnim.x; vUv = uv; vG = p;
    // far off, while a thing is only drawn, the drawing is kept bold and sparse: most stems, umbels and birds are left out
    vThin = (mode == 3 ? 1. : (mode == 0 || mode == 6) ? aAnim.y : 0.) - 1. + smoothstep(0.2, 0.34, uPxAng*distance(p, uEyeL));
    gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.);
  }`;

export const SLAB_FS = /* glsl */`
  ${STYLE_GLSL}
  uniform sampler2D uAtlasC, uAtlasD;     // C: display colour with the outline painted in. D: r depth of cut, g paint, b outline
  varying vec2 vUv; varying vec3 vG, vT, vB, vN; varying float vFace, vMode, vThin, vFlat, vStage, vInk;
  void main(){
    vec2 fw = fwidth(vG.xz) + fwidth(vG.y); float px = max(max(fw.x, fw.y)*0.6, 1e-4);
    float uvpx = length(fwidth(vUv));
    vec4 d = texture2D(uAtlasD, vUv); float fgr = max(fwidth(d.r), 1e-4);      // taken here, outside every branch; never 0
    float st = stageAt(vG); if (vStage > -0.5) st = vStage;     // a figure of the garden is worked whole (see SLAB_VS)
    if (vThin > 0. && st < 3.65) discard;
    vec3 col; float e;
    vec2 sp = vG.xz + vG.y*vec2(0.31, 0.95);
    vec3 stone = stoneAt(sp, px);
    if (vFace > 0.5) {
      vec3 c = texture2D(uAtlasC, vUv).rgb;
      vec2 L = vec2(dot(uSunL, vT), dot(uSunL, vB)); L /= max(length(L), 0.45);
      vec2 o = L*max(5.5/2048., 1.3*uvpx);
      float cut = smoothstep(2.5, 3.5, st);
      float farFlat = vFlat*smoothstep(0.12, 0.3, px);             // far off, a figure not yet painted is a clean drawing: no relief inside it
      e = (texture2D(uAtlasD, vUv + o).r - texture2D(uAtlasD, vUv - o).r)*1.5*cut*(1. - farFlat);
      float sock = step(3.5, vMode)*step(vMode, 4.5);
      float paint = d.g*paintAt(sp, st, px)*(1. - 0.86*sock); gChipE *= d.g; gChipS *= d.g*(1. - d.b);
      vec3 thin = mix(c, stone, 0.22*step(c.r + 0.06, c.g)*vnoise(sp*1.3));       // malachite goes thin
      col = mix(stone*(1. - 0.045*d.r*cut*(1. - farFlat)), thin, paint);
      // the outline drawn before the colour: soot, and never thinner than about 1.5 px however far the figure is
      float lpx = 3./2048./max(uvpx, 1e-6), drawn = smoothstep(1.9, 2.5, st)*(1. - smoothstep(3.6, 4.4, st));
      // far off its inner lines cannot be told apart, so a figure that is only drawn is its contour: one line about
      // two pixels wide where the cut begins (an umbel is an open bell, the cat a shape), from the smooth depth mask
      float contour = 1. - smoothstep(0.7*fgr, 1.7*fgr, abs(d.r - 0.45));
      // (a figure lying on the board has its contour laid round it as geometry, see SLAB_VS: none is read from the mask)
      // and inside it stays clean stone until its inner lines can be told apart; a socket under a lying figure draws no black)
      float first = mix(contour*step(2e-4, fgr)*(1. - vFlat), min(d.b*clamp(2.3/lpx, 1., 8.), 1.), smoothstep(0.4 + 0.3*vFlat, 0.85 + 0.3*vFlat, lpx))*drawn*(1. - sock);
      first = max(first, step(5.5, vMode)*step(vMode, 6.5)*smoothstep(0.12, 0.3, px)*drawn);   // a far stem is one drawn line
      col = mix(col, uPig[5], first*0.96);
      col = mix(col, c, d.b*smoothstep(3.7, 4.2, st)*(1. - paint));               // the outline outlasts the paint it bounds
      col = mix(col, uPig[3], sock*d.b*0.5);                                      // the red sketch left in the socket
      col = mix(col, uPig[3], gridAt(sp, px, st - 1.)*0.55*(1. - smoothstep(3.6, 4.6, st))*(1. - 0.6*smoothstep(1.9, 2.5, st))*(1. - first));
    } else {
      vec3 N = vN/max(length(vN), 1e-4);
      col = stone; e = clamp(dot(N, uSunL)*1.7, -1., 1.);
      e *= max(smoothstep(2.5, 3.5, st), 1. - smoothstep(0.15, 0.5, px));      // far off, what is only drawn has no wall yet
      // the rim of a figure that is only drawn is its black contour (laid flat round it in SLAB_VS)
      float ring = smoothstep(0.3, 0.7, vFlat)*smoothstep(1.9, 2.5, st)*(1. - smoothstep(3.6, 4.4, st));
      col = mix(col, uPig[5], 0.96*ring*vInk); e *= 1. - vFlat;
    }
    gl_FragColor = vec4(edgeTone(col, clamp(e, -1., 1.)), 1.);
  }`;

const FLOOR_VS = /* glsl */`
  varying vec3 vG, vN;
  void main(){ vG = position; vN = normal; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`;
const FLOOR_FS = /* glsl */`
  ${STYLE_GLSL}
  ${WATER_GLSL}
  uniform vec4 uPool;            // centre x, z, half x, half z
  uniform vec4 uSlab;            // half x, half z, water rise (m, for vertical water panels), panel flag
  uniform vec3 uEyeL;
  uniform vec2 uSeason;          // x: metres the inundation covers beyond the basin, y: width of the low-water mud margin
  varying vec3 vG, vN;
  // edge term inside a sunk rectangle (q from its centre, half size hf), band w metres wide
  float pitEdge(vec2 q, vec2 hf, vec2 s2, float w, float px){
    vec2 dd = hf - abs(q); float inside = step(0., min(dd.x, dd.y));
    vec2 b = (1. - smoothstep(w, w + px, dd))*inside;
    float ex = -sign(q.x)*s2.x*b.x, ey = -sign(q.y)*s2.y*b.y;
    return clamp((abs(ex) > abs(ey) ? ex : ey)*2.2, -1., 1.);
  }
  void main(){
    vec2 p = vG.xz; vec2 fw = fwidth(p); float px = max(max(fw.x, fw.y)*0.75, 1e-4);
    vec3 N = vN/max(length(vN), 1e-4);
    float st = stageAt(vG), cut = smoothstep(2.5, 3.5, st), ink = smoothstep(1.9, 2.5, st);
    vec3 stone = stoneAt(p + vG.y*vec2(0.3, 0.9), px); vec3 col = stone; float e = 0.;
    vec2 sun2 = uSunL.xz/max(length(uSunL.xz), 1e-3);
    if (N.y < 0.7) {                           // real walls: the basin and the edge of the board
      e = clamp(dot(N, uSunL)*1.7, -1., 1.)*max(cut, step(uSlab.x - 1., abs(p.x)) + step(uSlab.y - 1., abs(p.y)));
    } else {
      vec2 q = p - uPool.xy; vec2 dq = abs(q) - uPool.zw; float d = max(dq.x, dq.y);
      float farM = smoothstep(300., 400., distance(vG, uEyeL))*smoothstep(3.6, 4.0, st);
      gZig = 1.3*(1. - smoothstep(3.6, 4.0, st));
      float lw = max(0.09, 0.8*px), lk = min(0.09/lw + 0.15, 1.);
      if (d < uSeason.x) {                     // the pool, in plan (in the inundation it covers the banks)
        float zc; vec4 w = waterAt(p, px, sun2, farM, zc);
        vec4 wk = wakeAt(p, px, sun2);
        w = mix(w, vec4(mix(mix(uPig[1], uPig[5], wk.x), uPig[0], max(wk.y, wk.z)), wk.y - wk.z), wk.w); zc = mix(zc, wk.x, wk.w);
        float pnt = paintAt(p*0.5, st, px);
        vec3 bare = mix(stone*(1. - 0.04*cut), mix(uPig[5], uPig[3], gLost), ink*zc*mix(0.85, 0.7, gLost));
        col = mix(bare, w.rgb, pnt);
        e = w.a*cut*step(0.5, pnt + 0.5*cut);
        float mud = smoothstep(-0.5, 0.5, d + uSeason.y + 3.*(vnoise(p*0.21) - 0.5))*step(0.01, uSeason.y)*step(d, 0.);
        col = mix(col, mix(uPig[5], uPig[3], 0.22 + 0.5*step(0.72, vnoise(p*1.7))), mud*pnt); e *= 1. - mud;
        float pe = pitEdge(q, uPool.zw, sun2, 1.3, px)*cut; e = abs(pe) > 0.05 ? min(pe, 0.) : e;
      } else {
        // coping line, then the block border: blue, red, green, yellow between white bars
        float cop = (1. - smoothstep(lw, lw + px, abs(d - 1.1)))*lk;
        float along = dq.x > dq.y ? q.y : q.x, v = d - 5.;              // v across the band, -1.6..1.6
        float cell = floor(along/3.2), f = (fract(along/3.2) - 0.5)*3.2;
        vec2 bq = vec2(f, v), bh = vec2(1.25, 1.25);
        float inB = step(abs(f), bh.x)*step(abs(v), bh.y)*step(max(dq.x, dq.y) , 7.)*(1. - smoothstep(0.5, 1.6, px));
        float inBand = step(abs(v), 1.9);
        float k = mod(cell, 4.);
        vec3 pg = k < 0.5 ? uPig[1] : k < 1.5 ? uPig[3] : k < 2.5 ? uPig[2] : uPig[4];
        vec3 bandFar = mix(uPig[6], (uPig[1] + uPig[3] + uPig[2] + uPig[4])*0.25, 0.5);
        float pnt = paintAt(p*0.5 + 9., st, px); gChipE *= inBand; gChipS *= inBand;
        vec3 bandC = mix(mix(uPig[6], pg, inB), bandFar, smoothstep(0.5, 1.6, px));
        col = mix(col, bandC, inBand*pnt);
        float bl = max(1. - smoothstep(lw, lw + px, abs(abs(v) - 1.9)), inB > 0.5 ? 1. - smoothstep(lw, lw + px, min(bh.x - abs(f), bh.y - abs(v))) : 0.)*lk;
        col = mix(col, mix(uPig[5], uLineC, smoothstep(3.6, 4.4, st)), max(bl*step(abs(v), 2.1), cop)*ink);
        e = pitEdge(bq, bh, dq.x > dq.y ? sun2.yx : sun2, 0.22, px)*inB*cut;
        // the ruled double baseline round the edge of the board
        vec2 ds = uSlab.xy - abs(p); float de = min(ds.x, ds.y);
        float base = max(1. - smoothstep(lw, lw + px, abs(de - 2.)), 1. - smoothstep(lw, lw + px, abs(de - 2.8)))*lk;
        col = mix(col, uLineC, base*ink);
      }
      col = mix(col, uPig[3], gridAt(p, px, st - 1.)*0.6*(1. - smoothstep(3.6, 4.6, st)));
    }
    gl_FragColor = vec4(edgeTone(col, e), 1.);
  }`;

/** the uniforms every material of the style shares (one object: set them once, the whole world follows) */
export function makeStyleUniforms(palette = PALETTE, outline = OUTLINE) {
  const pig = palette.slice(0, 7).map((h) => new THREE.Color(h));
  while (pig.length < 7) pig.push(new THREE.Color(PALETTE[pig.length]));
  return {
    uPig: { value: pig }, uLineC: { value: new THREE.Color(outline) }, uShadeC: { value: new THREE.Color('#8fa3c4') }, uRimC: { value: new THREE.Vector3(1.27, 1.27, 1.27) },
    uSunL: { value: new THREE.Vector3(0.6, 0.28, 0.75).normalize() }, uFront: { value: new THREE.Vector4(0, 0, 1, 1e4) },
    uFrontW: { value: 130 }, uFrontX: { value: 0.35 }, uFrontMin: { value: 0 }, uWeather: { value: 0 }, uTime: { value: 0 }, uFlight: { value: 0 },
    uCamL: { value: new THREE.Vector3(0, 40, 400) }, uEyeL: { value: new THREE.Vector3(0, 40, 400) }, uPxAng: { value: 0.0012 }, uRise: { value: new THREE.Vector4(-1, 0.25, 0, 280) },
    uAtlasC: { value: null }, uAtlasD: { value: null }, uFish: { value: 30 }, uSlide: { value: 0 }, uWake: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
}
/** material for anything built with the slab vertex format (see SLAB_VS); shares the style uniforms */
export function slabMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: SLAB_VS, fragmentShader: SLAB_FS, side: THREE.DoubleSide });
}
/** material for flat stone drawn in the fragment shader: write your own FS around STYLE_GLSL, or use the pool's */
export function stoneMaterial(U, extra = {}, fragmentShader = FLOOR_FS, vertexShader = FLOOR_VS) {
  return new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader, fragmentShader });
}

// ---------------------------------------------------------------------------------------------------------------
// outlines: every figure is authored in code as closed polygons in metres
// ---------------------------------------------------------------------------------------------------------------
const TAU = Math.PI * 2;
/** closed Catmull-Rom through control points -> polygon */
export function curve(ctrl, seg = 5) {
  const n = ctrl.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i + n - 1) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  return out;
}
const area2 = (p) => { let a = 0; for (let i = 0, n = p.length; i < n; i++) { const q = p[(i + 1) % n]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a; };
export const ccw = (p) => (area2(p) < 0 ? p.slice().reverse() : p);
/** move every vertex of a CCW polygon outward by d (inward if negative) along its averaged edge normal */
export function offsetPoly(p, d) {
  const n = p.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = p[(i + n - 1) % n], b = p[i], c = p[(i + 1) % n];
    let nx = (b[1] - a[1]) + (c[1] - b[1]), ny = -(b[0] - a[0]) - (c[0] - b[0]);
    const l = Math.hypot(nx, ny) || 1; out.push([b[0] + nx / l * d, b[1] + ny / l * d]);
  }
  return out;
}
export const ell = (cx, cy, rx, ry, n = 14, rot = 0) => { const o = [], c = Math.cos(rot), s = Math.sin(rot); for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; };
/** a leaf / petal / feather: pointed at both ends, from a to b, half-width w */
export const leaf = (ax, ay, bx, by, w, n = 5, belly = 0.4) => {
  const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, o = [];
  for (let i = 0; i <= n; i++) { const t = i / n, k = Math.sin(Math.PI * Math.pow(t, 1 - belly * 0.6)) * w; o.push([ax + dx * t + nx * k, ay + dy * t + ny * k]); }
  for (let i = n - 1; i > 0; i--) { const t = i / n, k = Math.sin(Math.PI * Math.pow(t, 1 - belly * 0.6)) * w; o.push([ax + dx * t - nx * k, ay + dy * t - ny * k]); }
  return o;
};
export const xfm = (p, sx, sy = sx, tx = 0, ty = 0) => p.map((q) => [q[0] * sx + tx, q[1] * sy + ty]);

// ---------------------------------------------------------------------------------------------------------------
// the atlas: two canvases painted together. C holds the display colour (pigment + the red-brown outline, over
// stone); D holds r = depth of the cut, g = paint mask, b = outline mask. Mip-mapping is the style's far rule:
// marks under a few pixels melt into their flat average.
// ---------------------------------------------------------------------------------------------------------------
export function makeAtlas(size, pal, outline) {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
  const cC = mk(), cD = mk(), gC = cC.getContext('2d'), gD = cD.getContext('2d');
  gC.fillStyle = pal[0]; gC.fillRect(0, 0, size, size); gD.fillStyle = '#000'; gD.fillRect(0, 0, size, size);
  gC.lineJoin = gD.lineJoin = 'round'; gC.lineCap = gD.lineCap = 'round';
  let cx = 8, cyy = 8, rowH = 0;
  const path = (g, pts, close = true) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); };
  /** reserve a tile of w x h pixels showing the metre rectangle b = [x0, y0, x1, y1]; returns the painter */
  function tile(w, h, b) {
    if (cx + w + 8 > size) { cx = 8; cyy += rowH + 16; rowH = 0; }
    const ox = cx, oy = cyy; cx += w + 16; rowH = Math.max(rowH, h);
    const sx = w / (b[2] - b[0]), sy = h / (b[3] - b[1]), ppm = Math.min(sx, sy);
    for (const g of [gC, gD]) g.setTransform(sx, 0, 0, -sy, ox - b[0] * sx, oy + h + b[1] * sy);
    const lw = Math.max(0.085, 2.2 / ppm);            // one line of one weight
    const P = {
      lw, ppm,
      /** a cut filled with pigment i and outlined; o.sketch = false drops the red first sketch */
      poly(pts, i, o = {}) {
        if (o.sketch !== false) { gC.save(); gC.translate(lw * 0.9, lw * 0.6); path(gC, pts); gC.strokeStyle = pal[3]; gC.globalAlpha = 0.55; gC.lineWidth = lw * 0.6; gC.stroke(); gC.restore(); }
        path(gC, pts); gC.fillStyle = pal[i]; gC.fill();
        path(gD, pts); gD.fillStyle = i === 0 ? '#ff0000' : '#ffff00'; gD.fill();
        if (o.line !== false) { gC.strokeStyle = outline; gC.lineWidth = lw; gC.stroke(); gD.strokeStyle = '#a0ffff'; gD.lineWidth = lw; gD.stroke(); }
      },
      /** a ridge left standing inside a cut (a drawn line with a lit and a shadowed side); i = its colour */
      ridge(pts, i = -1, w = 1, close = false) {
        path(gC, pts, close); gC.strokeStyle = i < 0 ? outline : pal[i]; gC.lineWidth = lw * w; gC.stroke();
        path(gD, pts, close); gD.strokeStyle = '#00ffff'; gD.lineWidth = lw * w * 1.15; gD.stroke();
      },
      /** flat paint with no cut and no line (stripes, bars, spots) */
      flat(pts, i) { path(gC, pts); gC.fillStyle = pal[i]; gC.fill(); },
      dot(x, y, r, i, line = true) { P.poly(ell(x, y, r, r, 10), i, { sketch: false, line }); },
    };
    /** metres -> uv for geometry built from this tile */
    P.uv = (x, y) => [(ox + (x - b[0]) * sx) / size, 1 - (oy + h - (y - b[1]) * sy) / size];
    return P;
  }
  const finish = (renderer) => {
    const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
    return [tex(cC, true), tex(cD, false)];
  };
  return { tile, finish };
}

/** extrude an outline (metres) into a slab: painted face at +z, bevelled rim, side wall, open back (the material
 *  is double-sided, so the back shows the same picture). uvf(x, y) maps metres to atlas uv. ~5n triangles. */
export function slabGeo(outline, uvf, o = {}) {
  const t = o.thick ?? 0.5, bv = o.bevel ?? 0.16, out = ccw(outline), n = out.length, face = offsetPoly(out, -bv);
  const tri = THREE.ShapeUtils.triangulateShape(face.map((p) => new THREE.Vector2(p[0], p[1])), []);
  const nv = n * 4, pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = [];
  const put = (k, x, y, z, nx, ny, nz) => { pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; nrm[k * 3] = nx; nrm[k * 3 + 1] = ny; nrm[k * 3 + 2] = nz; const q = uvf(x, y); uv[k * 2] = q[0]; uv[k * 2 + 1] = q[1]; };
  for (let i = 0; i < n; i++) {
    const a = out[(i + n - 1) % n], b = out[i], c = out[(i + 1) % n];
    let nx = (b[1] - a[1]) + (c[1] - b[1]), ny = -(b[0] - a[0]) - (c[0] - b[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    put(i, face[i][0], face[i][1], t / 2, 0, 0, 1);
    put(n + i, face[i][0], face[i][1], t / 2, nx * 0.6, ny * 0.6, 0.8);
    put(2 * n + i, b[0], b[1], t / 2 - bv, nx * 0.92, ny * 0.92, 0.39);
    put(3 * n + i, b[0], b[1], -t / 2, nx, ny, 0);
  }
  for (const f of tri) idx.push(f[0], f[1], f[2]);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; for (const r of [n, 2 * n]) idx.push(r + i, r + n + i, r + j, r + j, r + n + i, r + n + j); }
  return { pos, nrm, uv, idx, nv };
}

/** one merged mesh of slabs in the SLAB_VS vertex format */
export function makeBatch(maxV) {
  const pos = new Float32Array(maxV * 3), nrm = new Float32Array(maxV * 3), uv = new Float32Array(maxV * 2);
  const org = new Float32Array(maxV * 4), anim = new Float32Array(maxV * 4), aux = new Float32Array(maxV * 4), idx = [];
  let nv = 0;
  return {
    get count() { return nv; },
    /** g: slabGeo; at: [x, y, z] pivot; yaw; anim: [mode, trigger, phase, extra]; aux: [hx, hy, amp, freq]; s scale; mir mirror in x */
    add(g, at, yaw, an, ax = [0, 0, 0, 0], s = 1, mir = false, rot = 0) {
      if (nv + g.nv > maxV) return;
      const m = mir ? -1 : 1, rc = Math.cos(rot), rs = Math.sin(rot);
      for (let i = 0; i < g.nv; i++) {
        const k = nv + i;
        pos[k * 3] = g.pos[i * 3] * s * m; pos[k * 3 + 1] = g.pos[i * 3 + 1] * s; pos[k * 3 + 2] = g.pos[i * 3 + 2] * Math.min(s, 1.5);
        nrm[k * 3] = g.nrm[i * 3] * m; nrm[k * 3 + 1] = g.nrm[i * 3 + 1]; nrm[k * 3 + 2] = g.nrm[i * 3 + 2];
        uv[k * 2] = g.uv[i * 2]; uv[k * 2 + 1] = g.uv[i * 2 + 1];
        org[k * 4] = at[0]; org[k * 4 + 1] = at[1]; org[k * 4 + 2] = at[2]; org[k * 4 + 3] = yaw;
        anim[k * 4] = an[0]; anim[k * 4 + 1] = an[1]; anim[k * 4 + 2] = an[2]; anim[k * 4 + 3] = an[3];
        aux[k * 4] = ax[0] * s * m; aux[k * 4 + 1] = ax[1] * s; aux[k * 4 + 2] = ax[2] * m; aux[k * 4 + 3] = ax[3];
        if (g.off) { aux[k * 4] = g.off[i * 2] * s * m; aux[k * 4 + 1] = g.off[i * 2 + 1] * s; aux[k * 4 + 2] = g.wid[i] * s; }
        if (rot) {
          const x = pos[k * 3], y = pos[k * 3 + 1], nx = nrm[k * 3], ny = nrm[k * 3 + 1], hx = aux[k * 4], hy = aux[k * 4 + 1];
          pos[k * 3] = x * rc - y * rs; pos[k * 3 + 1] = x * rs + y * rc; nrm[k * 3] = nx * rc - ny * rs; nrm[k * 3 + 1] = nx * rs + ny * rc;
          aux[k * 4] = hx * rc - hy * rs; aux[k * 4 + 1] = hx * rs + hy * rc;
        }
      }
      if (mir) for (let i = 0; i < g.idx.length; i += 3) idx.push(nv + g.idx[i], nv + g.idx[i + 2], nv + g.idx[i + 1]);
      else for (let i = 0; i < g.idx.length; i++) idx.push(nv + g.idx[i]);
      nv += g.nv;
    },
    mesh(material) {
      const g = new THREE.BufferGeometry(), A = (a, n) => new THREE.BufferAttribute(a.subarray(0, nv * n), n);
      g.setAttribute('position', A(pos, 3)); g.setAttribute('normal', A(nrm, 3)); g.setAttribute('uv', A(uv, 2));
      g.setAttribute('aOrg', A(org, 4)); g.setAttribute('aAnim', A(anim, 4)); g.setAttribute('aAux', A(aux, 4));
      g.setIndex(nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
      const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// the figures. Each returns { parts: [{ geo, hinge: [x, y], amp, freq }], h } ; part 0 is the body.
// A figure is drawn in elevation, sunk in a stone collar 0.25 m wide which is the slab's rim.
// ---------------------------------------------------------------------------------------------------------------
const COL = 0.3;
export const part = (P, outline, o = {}) => ({ uvf: P.uv, outline, geo: slabGeo(outline, P.uv, o), hinge: o.hinge ?? [0, 0], amp: o.amp ?? 0, freq: o.freq ?? 0 });

function figSycamore(A, rng) {
  const P = A.tile(300, 440, [-9, -0.3, 9, 23]);
  const body = curve([[-1.9, 0], [-1.1, 3.2], [-1.3, 6.6], [-6.2, 8.4], [-8.4, 13.2], [-6.8, 19.2], [0, 22.4], [6.8, 19.2], [8.4, 13.2], [6.2, 8.4], [1.3, 6.6], [1.1, 3.2], [1.9, 0]], 4);
  P.poly([[-1.4, 0.25], [-0.75, 3.2], [-0.8, 7.9], [0.8, 7.9], [0.75, 3.2], [1.4, 0.25]], 3);
  P.ridge([[-0.2, 0.8], [-0.1, 7.2]]); P.ridge([[0.35, 1.5], [0.3, 6.4]]);
  const crown = curve([[-5.4, 8.9], [-7.9, 13.2], [-6.4, 18.9], [0, 22], [6.4, 18.9], [7.9, 13.2], [5.4, 8.9], [0, 8.1]], 5);
  P.poly(crown, 2);
  for (let r = 0; r < 6; r++) {                         // overlapping rows of leaves
    const y = 10.3 + r * 1.95, hw = 7.4 * Math.sqrt(Math.max(1 - ((y - 14.6) / 7.6) ** 2, 0.02)) - 0.7, n = Math.max(2, Math.round(hw / 1.15)), pts = [];
    for (let i = 0; i <= n * 6; i++) { const t = i / (n * 6), x = -hw + 2 * hw * t; pts.push([x, y + 0.75 * Math.abs(Math.sin(t * n * Math.PI + (r % 2) * 1.57))]); }
    P.ridge(pts, 5, 0.8);
  }
  for (let i = 0; i < 9; i++) { const a = rng() * TAU, r = 1.5 + rng() * 4; P.dot(Math.cos(a) * r * 1.05, 14.8 + Math.sin(a) * r * 1.1, 0.5, 3); }
  return { parts: [part(P, body)], h: 22.4 };
}

function figDatePalm(A, rng) {
  const P = A.tile(300, 440, [-9, -0.3, 9, 23]);
  const c = [0, 15.2], fr = [], n = 9, out = [[1.5, 0], [0.75, 5], [0.85, 9.5], [3.2, 8.4], [4.4, 9.2], [3.5, 11.7], [2.5, 13.1], [3.7, 13.7]];
  for (let i = 0; i < n; i++) fr.push(-0.42 + (Math.PI + 0.84) * i / (n - 1));
  fr.forEach((a, i) => { const R = 7.3 - 0.9 * Math.abs(Math.cos(a)) * (i % 2); out.push([c[0] + Math.cos(a - 0.1) * R, c[1] + Math.sin(a - 0.1) * R * 0.98], [c[0] + Math.cos(a + 0.1) * R, c[1] + Math.sin(a + 0.1) * R * 0.98]); if (i < n - 1) { const m = a + (fr[1] - fr[0]) / 2; out.push([c[0] + Math.cos(m) * 4.4, c[1] + Math.sin(m) * 4.4]); } });
  out.push([-3.7, 13.7], [-2.5, 13.1], [-3.5, 11.7], [-4.4, 9.2], [-3.2, 8.4], [-0.85, 9.5], [-0.75, 5], [-1.5, 0]);
  const trunk = [[-1.05, 0.25], [-0.45, 5], [-0.5, 14.4], [0.5, 14.4], [0.45, 5], [1.05, 0.25]];
  P.poly(trunk, 3);
  for (let y = 1.4; y < 14; y += 1.25) P.ridge([[-0.55, y + 0.5], [0, y], [0.55, y + 0.5]], 5, 0.7);     // the scars of old fronds
  for (const s of [-1, 1]) { P.poly(leaf(s * 0.9, 13.6, s * 3.5, 9.3, 0.95, 5, 0.1), 4); P.ridge([[s * 1.2, 13.1], [s * 3.2, 9.9]], 3, 0.7); }
  fr.forEach((a, i) => {
    const R = 6.9 - 0.9 * Math.abs(Math.cos(a)) * (i % 2), tx = c[0] + Math.cos(a) * R, ty = c[1] + Math.sin(a) * R * 0.98;
    P.poly(leaf(c[0] + Math.cos(a) * 1.0, c[1] + Math.sin(a) * 1.0, tx, ty, 0.82, 5, 0.25), 2);
    P.ridge([[c[0] + Math.cos(a) * 1.4, c[1] + Math.sin(a) * 1.4], [c[0] + Math.cos(a) * (R - 0.8), c[1] + Math.sin(a) * (R - 0.8) * 0.98]], 5, 0.6);
  });
  P.dot(c[0], c[1] - 0.1, 0.95, 4);
  return { parts: [part(P, curve(out, 2))], h: 22.5 };
}

function figDoum(A, rng) {
  const P = A.tile(300, 440, [-9, -0.3, 9, 23]);
  const fan = (cx, cy, tilt) => { const o = []; for (let i = 0; i <= 12; i++) { const a = tilt - 1.75 + 3.5 * i / 12, R = i % 2 ? 5.3 : 4.5; o.push([cx + Math.sin(a) * R, cy + Math.cos(a) * R]); } return o; };
  const L = fan(-4.4, 15.6, -0.28), R = fan(4.4, 15.6, 0.28);
  const out = [[1.5, 0], [0.8, 4.5], [1.2, 8.2], [4.6, 12.6], ...R.slice().reverse(), [2.6, 13.4], [0, 10.6], [-2.6, 13.4], ...L.slice().reverse(), [-4.6, 12.6], [-1.2, 8.2], [-0.8, 4.5], [-1.5, 0]];
  P.poly([[-1.05, 0.25], [-0.5, 4.5], [-0.75, 8.3], [-4.6, 14.4], [-3.7, 14.9], [0, 9.6], [3.7, 14.9], [4.6, 14.4], [0.75, 8.3], [0.5, 4.5], [1.05, 0.25]], 3);
  for (let y = 1.3; y < 8; y += 1.1) P.ridge([[-0.6, y], [0.6, y]], 5, 0.7);
  for (const [cx, tilt] of [[-4.4, -0.28], [4.4, 0.28]]) {
    for (let i = 0; i < 7; i++) { const a = tilt - 1.5 + 3.0 * i / 6; P.poly(leaf(cx + Math.sin(a) * 0.9, 15.6 + Math.cos(a) * 0.9, cx + Math.sin(a) * 4.9, 15.6 + Math.cos(a) * 4.9, 0.72, 4, 0.5), 2, { sketch: i % 2 === 0 }); }
    for (let i = 0; i < 3; i++) P.dot(cx - 1 + i, 14.3 - (i % 2) * 0.5, 0.52, 4);        // doum nuts
  }
  return { parts: [part(P, curve(out, 2))], h: 21 };
}

function figPomegranate(A, rng) {
  const P = A.tile(260, 300, [-6, -0.3, 6, 13.5]);
  const out = curve([[-1.2, 0], [-0.7, 2.2], [-3.9, 3.9], [-5.4, 7.6], [-3.8, 11.6], [0, 13.1], [3.8, 11.6], [5.4, 7.6], [3.9, 3.9], [0.7, 2.2], [1.2, 0]], 4);
  P.poly([[-0.8, 0.25], [-0.35, 2.4], [-0.3, 5], [0.3, 5], [0.35, 2.4], [0.8, 0.25]], 3);
  P.poly(curve([[-3.3, 4.4], [-4.7, 7.6], [-3.3, 11.1], [0, 12.5], [3.3, 11.1], [4.7, 7.6], [3.3, 4.4], [0, 3.7]], 4), 2);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) P.ridge([[0, 4.2 + k * 2.2], [s * (2.4 + k * 0.3), 6.0 + k * 2.1]], 3, 0.9);   // boughs
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996, r = 0.7 + 3.0 * Math.sqrt((i + 0.5) / 26), x = Math.cos(a) * r * 1.05, y = 8.2 + Math.sin(a) * r * 1.05;
    if (i % 4 === 3) { P.dot(x, y, 0.56, 3); P.flat([[x - 0.2, y + 0.5], [x, y + 0.85], [x + 0.2, y + 0.5]], 3); }
    else P.ridge(leaf(x - 0.6, y - 0.25 + (i % 3) * 0.25, x + 0.6, y + 0.25 - (i % 3) * 0.25, 0.3, 3), 5, 0.6, true);
  }
  return { parts: [part(P, out)], h: 13.1 };
}

// lotus in profile: a stem, a calyx and three inner petals in one slab; the outer petals are two parts that fan
function figLotus(A, pig) {
  const P = A.tile(190, 280, [-3, -0.3, 3, 8.6]);
  const stem = [[0.75, 0], [0.5, 4.7], [1.25, 5.3], [1.5, 7.2], [0.75, 8.2], [0, 8.45], [-0.75, 8.2], [-1.5, 7.2], [-1.25, 5.3], [-0.5, 4.7], [-0.75, 0]];
  P.poly([[-0.22, 0.2], [-0.2, 5], [0.2, 5], [0.22, 0.2]], 2, { sketch: false });
  for (const s of [-1, 0, 1]) { P.poly(leaf(s * 0.3, 5.1, s * 0.85, 8.1 - Math.abs(s) * 0.5, 0.42, 5, 0.3), pig); if (pig === 6) P.flat(leaf(s * 0.62, 6.9 - Math.abs(s) * 0.3, s * 0.83, 7.95 - Math.abs(s) * 0.5, 0.17, 3), 1); else P.ridge([[s * 0.4, 5.6], [s * 0.75, 7.4 - Math.abs(s) * 0.4]], 6, 0.5); }
  P.poly(leaf(-0.62, 5, 0.62, 5, 0.34, 4, 0), 2, { sketch: false });
  const pet = (s) => { P.poly(leaf(s * 0.75, 5.15, s * 2.3, 7.5, 0.47, 5, 0.3), 2); P.ridge([[s * 0.95, 5.5], [s * 2.05, 7.1]], 6, 0.6); return curve([[s * 0.55, 4.75], [s * 1.9, 5.6], [s * 2.85, 7.6], [s * 2.3, 8.0], [s * 1.05, 6.6]], 3); };
  return { parts: [part(P, curve(stem, 2), { thick: 0.4 }), part(P, pet(1), { thick: 0.3, hinge: [0.55, 5.0], amp: -0.2, freq: 0.9 }), part(P, pet(-1), { thick: 0.3, hinge: [-0.55, 5.0], amp: 0.2, freq: 0.9 })], h: 8.4 };
}
// a lotus leaf drawn in plan: round, with its notch and veins; it stays flat on the water
function figPad(A) {
  const P = A.tile(150, 150, [-2.4, -2.4, 2.4, 2.4]);
  const rim = []; for (let i = 0; i <= 22; i++) { const a = 0.3 + (TAU - 0.6) * i / 22; rim.push([Math.cos(a) * 2, Math.sin(a) * 2]); } rim.push([0.25, 0]);
  P.poly(rim, 2); for (let i = 1; i < 8; i++) { const a = i * TAU / 8; P.ridge([[Math.cos(a) * 0.3, Math.sin(a) * 0.3], [Math.cos(a) * 1.6, Math.sin(a) * 1.6]], 5, 0.6); }
  return { parts: [part(P, offsetPoly(ccw(rim), COL), { thick: 0.2, bevel: 0.1 })], h: 4 };
}
// a duck in profile, swimming: body with head, and two feet that swap between two poses
function figDuck(A, rng) {
  const P = A.tile(300, 220, [-3.2, -1.4, 3.2, 3.3]);
  const body = curve([[-2.9, 1.0], [-1.9, 0.05], [0.4, -0.25], [1.6, 0.25], [1.75, 1.3], [2.2, 2.0], [3.0, 2.0], [2.95, 2.35], [2.2, 2.95], [1.4, 2.8], [1.0, 1.9], [-0.6, 1.75], [-2.2, 1.55]], 4);
  P.poly(offsetPoly(ccw(body), -COL), 4);
  P.poly(curve([[1.25, 1.9], [1.5, 2.6], [2.1, 2.7], [2.3, 2.2], [1.8, 1.65]], 3), 2, { sketch: false });       // green head
  P.poly([[2.3, 2.3], [2.9, 2.2], [2.3, 2.05]], 3, { sketch: false }); P.dot(1.95, 2.42, 0.11, 5, false);
  P.poly(leaf(-1.9, 0.9, 0.9, 0.85, 0.5, 5, 0.3), 6); P.ridge([[-1.3, 0.75], [0.5, 0.7]], 5, 0.6); P.ridge([[-1.5, 1.05], [0.3, 1.0]], 5, 0.6);
  P.poly([[-2.6, 1.05], [-1.9, 1.35], [-1.95, 0.75]], 5, { sketch: false });
  const foot = (x) => { const f = [[x - 0.12, -0.1], [x + 0.12, -0.1], [x + 0.1, -0.75], [x + 0.6, -1.0], [x - 0.5, -1.0], [x - 0.1, -0.75]]; P.poly(f, 3, { sketch: false }); return offsetPoly(ccw(f), 0.16); };
  return { parts: [part(P, body, { thick: 0.45 }), part(P, foot(-0.5), { thick: 0.25, bevel: 0.08, hinge: [-0.5, -0.1], amp: 0.55, freq: 5 }), part(P, foot(0.6), { thick: 0.25, bevel: 0.08, hinge: [0.6, -0.1], amp: -0.55, freq: 5 })], h: 3 };
}
// tilapia in profile: blue back, ochre fins, scales as rows of ridges; some carry a lotus bud
function figTilapia(A, bud) {
  const P = A.tile(400, 200, [-4, -1.9, 4.2, 2.2]);
  const o = curve([[-3.8, 1.3], [-3.0, 0.1], [-3.8, -1.2], [-2.5, -0.55], [-0.8, -1.3], [0.4, -1.75], [1.6, -1.2], [3.1, -0.65], [bud ? 4.1 : 3.6, 0.0], [3.0, 0.75], [1.8, 1.45], [0.6, 2.05], [-1.2, 1.75], [-2.4, 0.75]], 3);
  P.poly(curve([[-2.5, 0.1], [-0.9, -1.0], [1.4, -0.95], [3.2, -0.05], [1.6, 1.0], [-0.8, 1.05]], 4), 1);
  P.flat(curve([[-2.2, -0.05], [-0.8, -0.8], [1.4, -0.75], [2.9, -0.15], [1.2, -0.25], [-0.8, -0.3]], 4), 6);       // pale belly
  for (let r = 0; r < 3; r++) { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push([-1.9 + 3.6 * t, 0.62 - r * 0.42 + 0.17 * Math.abs(Math.sin(t * 9 * Math.PI + r * 1.57))]); } P.ridge(pts, 5, 0.6); }
  P.poly([[-1.3, 1.1], [-0.9, 1.6], [0.6, 1.8], [1.6, 1.15], [0.2, 1.12]], 4); for (let i = 0; i < 6; i++) P.ridge([[-0.8 + i * 0.4, 1.15], [-0.7 + i * 0.4, 1.6]], 3, 0.5);
  P.poly([[-0.6, -1.0], [0.3, -1.5], [1.2, -0.98]], 4, { sketch: false });
  P.poly([[-2.55, 0.08], [-3.55, 1.05], [-3.15, 0.1], [-3.55, -0.95]], 4);
  P.dot(2.35, 0.25, 0.2, 6); P.dot(2.4, 0.25, 0.09, 5, false); P.ridge([[1.75, 0.8], [1.6, 0], [1.8, -0.7]], 5, 0.7);
  if (bud) { P.poly(leaf(3.2, -0.05, 4.0, 0.0, 0.2, 4), 1, { sketch: false }); }
  return { parts: [part(P, o, { thick: 0.5 })], h: 4 };
}

// a bird in flight, in profile, facing +x: body (part 0) and one wing outline used twice (near and far wing),
// hinged along the body's axis at the shoulder. o: L half-length, H half-height, neck, up, hh head, bill, tail, span
function figBird(A, o) {
  const { L, H, neck, up, hh, bill, tail, span } = o, x1 = L + neck, top = H + span + 0.5;
  const P = A.tile(o.tw ?? 280, o.th ?? 250, [-L - tail - 0.6, -H - 0.9 - (o.legs ?? 0) * 0.3, x1 + hh + bill + 0.6, top]);
  const body = curve([[-L - tail, 0.25], [-L * 0.75, -H * 0.75], [0, -H], [L * 0.75, -H * 0.72], [L + neck * 0.5, up * 0.45 - hh * 0.9], [x1, up - hh], [x1 + hh * 0.8, up - hh * 0.55], [x1 + hh + bill, up], [x1 + hh * 0.7, up + hh * 0.75], [x1, up + hh], [L + neck * 0.5, up * 0.5 + hh * 0.9], [L * 0.55, H], [-L * 0.5, H * 0.85], [-L, H * 0.5], [-L - tail, 0.55]], 2);
  const inner = offsetPoly(ccw(body), -0.24);
  P.poly(inner, o.body);
  if (o.belly != null) P.flat(curve([[-L * 0.7, -H * 0.2], [0, -H * 0.72], [L * 0.7, -H * 0.5], [L * 0.6, -H * 0.1], [0, -H * 0.25]], 3), o.belly);
  P.poly(curve([[x1 - hh * 0.5, up - hh * 0.7], [x1 + hh * 0.7, up - hh * 0.45], [x1 + hh * 0.75, up + hh * 0.5], [x1 - hh * 0.2, up + hh * 0.72], [x1 - hh * 0.9, up]], 3), o.head, { sketch: false });
  P.poly([[x1 + hh * 0.7, up + hh * 0.3], [x1 + hh + bill - 0.12, up], [x1 + hh * 0.7, up - hh * 0.3]], o.billPig ?? 3, { sketch: false });
  P.dot(x1 + hh * 0.15, up + hh * 0.2, Math.max(0.09, hh * 0.2), 5, false);
  for (let i = 0; i < 3; i++) P.poly(leaf(-L * 0.8, 0.1 + i * 0.15, -L - tail + 0.3, 0.2 + i * 0.12, 0.13, 3), o.tailPig ?? 5, { sketch: false, line: false });
  if (o.ring != null) P.ridge([[L + neck * 0.3, up * 0.3 - hh * 0.6], [L + neck * 0.3, up * 0.3 + hh * 0.7]], o.ring, 1.4);
  if (o.crest) for (let i = 0; i < 5; i++) { const a = 0.5 + i * 0.36; P.poly(leaf(x1, up + hh * 0.6, x1 - Math.cos(a) * hh * 2.6 + 0.3, up + hh * 0.6 + Math.sin(a) * hh * 2.6, 0.16, 3), 4, { sketch: false }); P.dot(x1 - Math.cos(a) * hh * 2.5 + 0.3, up + hh * 0.6 + Math.sin(a) * hh * 2.5, 0.13, 5, false); }
  if (o.legs) for (let i = 0; i < 2; i++) P.ridge([[-L * 0.5, -H * 0.6], [-L - tail * 0.6, -H - 0.2 - i * 0.25], [-L - tail, -H - 0.5 - i * 0.2]], 5, 1.1);
  // the wing: raised, primaries fanned back
  const hy = H * 0.55, wing = curve([[L * 0.5, hy - 0.15], [L * 0.62, hy + span * 0.45], [L * 0.2, hy + span * 0.86], [-L * 0.25, hy + span], [-L * 0.8, hy + span * 0.8], [-L * 1.05, hy + span * 0.42], [-L * 0.7, hy - 0.15]], 2);
  P.poly(offsetPoly(ccw(wing), -0.22), o.wing);
  const nf = 6; for (let i = 0; i < nf; i++) { const t = (i + 0.7) / nf, bx = L * 0.42 - t * L * 1.05, tx = L * 0.3 - t * L * 1.25, ty = hy + span * (0.92 - 0.5 * t * t); P.ridge([[bx, hy + span * 0.3], [tx, ty - 0.2]], o.bar ?? 5, 0.75); }
  if (o.bar != null) P.flat(curve([[L * 0.4, hy + span * 0.2], [-L * 0.75, hy + span * 0.2], [-L * 0.8, hy + span * 0.4], [L * 0.45, hy + span * 0.4]], 2), o.bar);
  const wp = { thick: 0.22, bevel: 0.09, hinge: [0, hy] };
  return { parts: [part(P, body, { thick: 0.4, bevel: 0.12 }), part(P, wing, { ...wp, amp: 1.25, freq: o.hz * TAU }), part(P, wing, { ...wp, amp: -1.25, freq: o.hz * TAU })], h: top, len: 2 * L + neck + tail };
}
function figButterfly(A) {
  const P = A.tile(190, 190, [-1.9, -0.6, 1.9, 3.2]);
  const body = leaf(-1.2, 0, 1.3, 0, 0.24, 5); P.poly(body, 5, { sketch: false }); P.ridge([[1.2, 0.1], [1.75, 0.75]], 5, 0.7); P.ridge([[1.2, 0.1], [1.55, 0.95]], 5, 0.7);
  const wing = curve([[0.5, 0.2], [1.5, 1.3], [1.45, 2.6], [0.5, 2.95], [-0.5, 2.3], [-1.5, 2.0], [-1.6, 1.0], [-0.7, 0.2]], 3);
  const inner = offsetPoly(ccw(wing), -0.2); P.poly(inner, 4);
  for (let i = 0; i < 4; i++) P.flat(leaf(-1.1 + i * 0.75, 0.75 + (i % 2) * 0.2, -0.8 + i * 0.75, 2.1 + (i > 1 ? 0.4 : 0), 0.15, 3), 5);
  P.dot(0.9, 2.2, 0.2, 6, false); P.dot(-1.05, 1.5, 0.17, 6, false);
  const wp = { thick: 0.16, bevel: 0.07, hinge: [0, 0.1] };
  return { parts: [part(P, offsetPoly(ccw(body), 0.2), { thick: 0.3, bevel: 0.08 }), part(P, wing, { ...wp, amp: 1.35, freq: 2.2 * TAU }), part(P, wing, { ...wp, amp: -1.35, freq: 2.2 * TAU })], h: 3, len: 3 };
}

// the tabby, 14 m long, in profile facing -x, gripping two stems; head and tail are hinged parts
function figCat(A, pal) {
  const P = A.tile(660, 430, [-7.8, -3.8, 7.8, 6.6]);
  const body = curve([[-4.0, 0.3], [-3.7, -1.6], [-3.9, -3.0], [-3.2, -3.45], [-2.3, -3.1], [-2.2, -1.3], [-0.6, -1.25], [1.9, -1.1], [2.9, -1.8], [2.6, -3.0], [3.4, -3.45], [4.3, -3.1], [4.6, -1.2], [5.1, 0.6], [4.5, 2.2], [1.6, 2.55], [-1.4, 2.25], [-3.2, 2.4], [-4.1, 1.7]], 3);
  P.poly(offsetPoly(ccw(body), -COL), 4);
  P.flat(curve([[-3.3, -0.4], [-1, -0.95], [2, -0.8], [3.6, -0.2], [1.8, -0.3], [-1.2, -0.45]], 3), 6);
  for (let i = 0; i < 9; i++) { const x = -3.0 + i * 0.92, tp = 2.0 + 0.2 * Math.sin(i * 1.3); const lf = leaf(x, tp, x + 0.35 - (i % 2) * 0.3, 0.35 - (i % 3) * 0.25, 0.2, 4, 0.1); P.flat(lf, 5); if (i % 3 === 1) P.ridge([[x, tp - 0.1], [x + 0.35 - (i % 2) * 0.3, 0.5 - (i % 3) * 0.25]], 5, 2.6); }
  for (const lx of [-3.05, 3.45]) { for (let k = 0; k < 3; k++) P.flat([[lx - 0.55, -1.5 - k * 0.5], [lx + 0.6, -1.4 - k * 0.5], [lx + 0.6, -1.6 - k * 0.5], [lx - 0.55, -1.72 - k * 0.5]], 5); for (let k = -1; k <= 1; k++) P.ridge([[lx + k * 0.3, -3.15], [lx + k * 0.3, -2.8]], 5, 0.6); }
  const head = curve([[-4.35, 0.75], [-5.5, 0.15], [-6.9, 0.7], [-7.45, 1.75], [-6.9, 2.75], [-6.75, 4.2], [-5.85, 3.35], [-5.1, 4.3], [-4.45, 3.2], [-4.1, 1.9]], 3);
  P.poly(offsetPoly(ccw(head), -COL), 4);
  P.flat(curve([[-6.9, 1.1], [-6.2, 0.6], [-5.6, 1.0], [-6.3, 1.6]], 3), 6); P.poly([[-7.1, 1.75], [-6.75, 1.95], [-6.75, 1.5]], 3, { sketch: false });
  P.poly(leaf(-6.5, 2.35, -5.45, 2.6, 0.3, 5), 2, { sketch: false }); P.poly(leaf(-6.02, 2.2, -5.96, 2.75, 0.1, 3), 5, { sketch: false, line: false });
  for (let k = 0; k < 3; k++) { P.ridge([[-5.2 + k * 0.3, 3.0 + k * 0.1], [-4.75 + k * 0.2, 2.2]], 5, 0.8); P.ridge([[-6.6, 1.25 - k * 0.12], [-5.2, 1.5 - k * 0.3]], 5, 0.4); }
  P.flat([[-6.5, 3.6], [-6.62, 3.05], [-6.2, 3.2]], 3); P.flat([[-5.1, 3.7], [-5.3, 3.2], [-4.85, 3.2]], 3);
  const tail = curve([[4.3, 0.9], [6.0, 0.9], [7.25, 2.4], [7.2, 4.9], [6.3, 6.3], [5.5, 5.8], [6.2, 4.6], [6.15, 3.0], [5.4, 2.2], [4.3, 2.1]], 3);
  P.poly(offsetPoly(ccw(tail), -COL), 4);
  for (const [x, y, a] of [[5.7, 1.6, 1.2], [6.5, 2.5, 0.5], [6.7, 3.6, 0.05], [6.6, 4.6, -0.4], [6.1, 5.5, -0.9]]) P.flat(leaf(x - Math.cos(a) * 0.52, y - Math.sin(a) * 0.52, x + Math.cos(a) * 0.52, y + Math.sin(a) * 0.52, 0.16, 3), 5);
  return { parts: [part(P, body), part(P, head, { hinge: [-4.2, 1.6], amp: 1, freq: -1 }), part(P, tail, { hinge: [4.7, 1.5], amp: 0.2, freq: 1.3 })], h: 6 };
}

// papyrus: the umbel is a green bell with a red-ochre fringe; the stem tile is stretched along each culm
function figUmbel(A) {
  const P = A.tile(230, 260, [-3.3, -0.3, 3.3, 7]);
  const out = curve([[0.55, 0], [1.0, 1.7], [2.7, 4.3], [3.05, 5.5], [1.6, 6.35], [0, 6.6], [-1.6, 6.35], [-3.05, 5.5], [-2.7, 4.3], [-1.0, 1.7], [-0.55, 0]], 2);
  const bell = curve([[0.3, 0.9], [0.8, 2.0], [2.35, 4.4], [2.6, 5.1], [1.4, 5.5], [0, 5.65], [-1.4, 5.5], [-2.6, 5.1], [-2.35, 4.4], [-0.8, 2.0], [-0.3, 0.9]], 3);
  P.poly(bell, 2);
  for (let i = -5; i <= 5; i++) { const a = i * 0.085; P.ridge([[Math.sin(a) * 2.2, 1.5 + Math.abs(i) * 0.1], [Math.sin(a) * 5.2 * 0.92, 0.5 + Math.cos(a) * 4.75]], 5, 0.55); }
  for (let i = -6; i <= 6; i++) { const x = i * 0.42, y = 5.55 - Math.abs(i) * Math.abs(i) * 0.014; P.poly(leaf(x, y, x * 1.07, y + 0.62, 0.15, 3), 3, { sketch: false, line: false }); }
  for (const s of [-1, 0, 1]) P.poly(leaf(s * 0.18, 0.15, s * 0.75, 2.1 - Math.abs(s) * 0.3, 0.3, 4, 0.2), 4, { sketch: s === 0 });
  return { parts: [part(P, out, { thick: 0.45 })], h: 6.6 };
}
function tileStem(A) {
  const P = A.tile(48, 400, [-0.6, 0, 0.6, 16]);
  P.poly([[-0.34, -1], [-0.34, 17], [0.34, 17], [0.34, -1]], 2, { sketch: false });
  P.ridge([[-0.08, 0], [-0.08, 16]], 5, 0.5); P.flat([[-0.3, 0], [0.3, 0], [0.02, 2.6]], 4);
  return P;
}
// palm column: the capital is nine fronds bound with five rings striped blue, green and red; the shaft tile is stretched
function figCapital(A) {
  const P = A.tile(400, 560, [-6.6, -0.2, 6.6, 18]);
  const out = [[1.9, 0], [1.95, 5.6]], n = 9, tips = [];
  for (let i = 0; i < n; i++) { const a = -1.12 + 2.24 * i / (n - 1), R = 11.6 - 2.4 * Math.abs(Math.sin(a)); tips.push([Math.sin(a) * R * 0.52, 5.6 + Math.cos(a) * R, a]); }
  for (let i = n - 1; i >= 0; i--) { const t = tips[i]; out.push([t[0] + 0.5, t[1] - 0.25], [t[0] - 0.5, t[1] + 0.05]); if (i > 0) out.push([(t[0] + tips[i - 1][0]) * 0.5 * 0.86, (t[1] + tips[i - 1][1]) * 0.5 - 1.5]); }
  out.push([-1.95, 5.6], [-1.9, 0]);
  [1, 2, 3, 1, 2].forEach((pg, k) => { P.poly([[-1.6, 0.3 + k * 1.05], [1.6, 0.3 + k * 1.05], [1.6, 1.1 + k * 1.05], [-1.6, 1.1 + k * 1.05]], pg, { sketch: false }); });
  tips.forEach((t, i) => { const bx = Math.sin(t[2]) * 1.5, by = 5.9; P.poly(leaf(bx, by, t[0] * 0.97, t[1] - 0.45, 0.62, 6, 0.3), i % 2 ? 2 : (i % 4 ? 1 : 3)); P.ridge([[bx * 1.05, by + 0.6], [t[0] * 0.93, t[1] - 1.3]], 6, 0.6); });
  return { parts: [part(P, curve(out, 2), { thick: 2.2, bevel: 0.3 })], h: 17.6 };
}
function tileShaft(A) {
  const P = A.tile(110, 400, [-2.2, 0, 2.2, 16]);
  P.poly([[-1.3, -1], [-1.3, 17], [1.3, 17], [1.3, -1]], 6, { sketch: false });      // sunk in its collar like every figure, so the far drawing has its two edges
  for (const x of [-0.8, 0, 0.8]) P.ridge([[x, 0], [x, 16]], 4, 0.8);
  [[0.4, 5], [1.6, 1], [14.2, 3], [15.2, 1]].forEach(([y, pg]) => P.poly([[-1.3, y], [1.3, y], [1.3, y + 0.8], [-1.3, y + 0.8]], pg, { sketch: false }));
  return P;
}
// the wreath's makings: lotus petal, small papyrus head, persea leaf with its fruit, and a length of red cord
function figWreath(A) {
  const P = A.tile(420, 170, [-0.2, -0.3, 12.2, 4.6]), mk = (x0, fn) => fn(x0);
  const lotus = mk(1.4, (x) => { for (const s of [-1, 0, 1]) P.poly(leaf(x + s * 0.3, 0.35, x + s * 0.95, 3.9 - Math.abs(s) * 0.5, 0.42, 5, 0.3), s ? 1 : 6, { sketch: false }); P.poly(leaf(x - 0.6, 0.4, x + 0.6, 0.4, 0.3, 4), 2, { sketch: false }); return curve([[x - 0.9, 0], [x - 1.45, 3.2], [x - 0.9, 4.0], [x, 4.35], [x + 0.9, 4.0], [x + 1.45, 3.2], [x + 0.9, 0]], 2); });
  const pap = mk(4.6, (x) => { P.poly(curve([[x - 0.25, 0.3], [x - 1.05, 2.9], [x, 3.4], [x + 1.05, 2.9], [x + 0.25, 0.3]], 3), 2, { sketch: false }); for (let i = -3; i <= 3; i++) P.poly(leaf(x + i * 0.3, 3.1, x + i * 0.36, 3.75, 0.13, 3), 3, { sketch: false, line: false }); return curve([[x - 0.6, 0], [x - 1.45, 3.0], [x - 0.8, 4.1], [x + 0.8, 4.1], [x + 1.45, 3.0], [x + 0.6, 0]], 2); });
  const persea = mk(7.6, (x) => { P.poly(leaf(x, 0.3, x, 3.9, 0.8, 6, 0.1), 2, { sketch: false }); P.ridge([[x, 0.6], [x, 3.5]], 5, 0.6); P.dot(x + 0.75, 0.75, 0.36, 4); return curve([[x - 0.45, 0], [x - 1.2, 2.0], [x - 0.5, 4.1], [x + 0.5, 4.1], [x + 1.2, 2.0], [x + 1.25, 0.4], [x + 0.45, 0]], 2); });
  const cx = 10.6; P.poly([[cx - 0.7, 0], [cx + 0.7, 0], [cx + 0.7, 4.4], [cx - 0.7, 4.4]].map((q) => [q[0], q[1] - 0.1]), 3, { sketch: false });
  for (let y = 0.3; y < 4.3; y += 0.55) P.ridge([[cx - 0.6, y], [cx + 0.6, y + 0.3]], 5, 0.55);
  const re = (o, x0) => slabGeo(o.map((q) => [q[0] - x0, q[1]]), (x, y) => P.uv(x + x0, y), { thick: 0.5, bevel: 0.12 });
  return { P, pieces: [re(lotus, 1.4), re(pap, 4.6), re(persea, 7.6)], cord: (w, h) => slabGeo([[-w, -h], [w, -h], [w, h], [-w, h]], (x, y) => P.uv(cx + x * 0.5 / w, 2.1 + y * 1.9 / h), { thick: 0.5, bevel: 0.14 }) };
}

// the board: top round the pool, the basin sunk 0.6 m with real walls, and the board's own edge 3 m thick
function floorGeo(hx, hz, pool) {
  const pos = [], nrm = [], idx = [];
  const quad = (a, b, c, d, n) => { const k = pos.length / 3; pos.push(...a, ...b, ...c, ...d); for (let i = 0; i < 4; i++) nrm.push(...n); idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
  const [px, pz, phx, phz] = pool, x0 = px - phx, x1 = px + phx, z0 = pz - phz, z1 = pz + phz, up = [0, 1, 0], D = -0.6, B = -8;
  quad([-hx, 0, z1], [-hx, 0, hz], [hx, 0, hz], [hx, 0, z1], up); quad([-hx, 0, -hz], [-hx, 0, z0], [hx, 0, z0], [hx, 0, -hz], up);
  quad([-hx, 0, z0], [-hx, 0, z1], [x0, 0, z1], [x0, 0, z0], up); quad([x1, 0, z0], [x1, 0, z1], [hx, 0, z1], [hx, 0, z0], up);
  quad([x0, D, z0], [x0, D, z1], [x1, D, z1], [x1, D, z0], up);
  quad([x0, 0, z0], [x0, 0, z1], [x0, D, z1], [x0, D, z0], [1, 0, 0]); quad([x1, 0, z1], [x1, 0, z0], [x1, D, z0], [x1, D, z1], [-1, 0, 0]);
  quad([x1, 0, z0], [x0, 0, z0], [x0, D, z0], [x1, D, z0], [0, 0, 1]); quad([x0, 0, z1], [x1, 0, z1], [x1, D, z1], [x0, D, z1], [0, 0, -1]);
  quad([-hx, 0, hz], [-hx, B, hz], [hx, B, hz], [hx, 0, hz], [0, 0, 1]); quad([hx, 0, -hz], [hx, B, -hz], [-hx, B, -hz], [-hx, 0, -hz], [0, 0, -1]);
  quad([hx, 0, hz], [hx, B, hz], [hx, B, -hz], [hx, 0, -hz], [1, 0, 0]); quad([-hx, 0, -hz], [-hx, B, -hz], [-hx, B, hz], [-hx, 0, hz], [-1, 0, 0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette.slice(0, 7) : PALETTE, outline = opts.outline ?? OUTLINE;
  const U = makeStyleUniforms(pal, outline);
  const HX = 120, HZ = 210, POOL = [0, 30, 55, 150];           // board half-size; pool centre x, z and half-size
  const FAN_Z = -165, COL_Z = -159, RING = new THREE.Vector3(0, 44, -156.6);
  const root = new THREE.Group(), garden = new THREE.Group();     // garden turns about the hinge line z = +HZ
  const pivot = new THREE.Group(); pivot.position.set(0, 0, HZ); garden.position.set(0, 0, -HZ); pivot.add(garden); root.add(pivot);

  // per-seed cast
  const cast = { fishBud: rng.int(0, 3), lotusMix: rng.range(0.3, 0.7), tall: rng.shuffle([0, 1, 2]), catSide: 1, weather: rng.chance(0.25) ? rng.range(0.25, 0.5) : rng.range(0, 0.12), rowPhase: rng.int(0, 2) };
  U.uWeather.value = opts.weather ?? cast.weather;

  // ---- the atlas and the figures ----
  await ctx.yield();
  const A = makeAtlas(2048, pal, outline); await ctx.yield();
  const F = {};
  F.trees = [figSycamore(A, rng)]; await ctx.yield(); F.trees.push(figDatePalm(A, rng)); await ctx.yield(); F.trees.push(figDoum(A, rng)); await ctx.yield();
  F.pom = figPomegranate(A, rng); await ctx.yield(); F.lotus = [figLotus(A, 1), figLotus(A, 6)]; await ctx.yield(); F.pad = figPad(A); await ctx.yield();
  F.duck = figDuck(A, rng); await ctx.yield(); F.fish = [figTilapia(A, false), figTilapia(A, true)]; await ctx.yield();
  const B0 = { L: 2.0, H: 0.8, neck: 1.5, up: 0.5, hh: 0.42, bill: 0.6, tail: 0.8, span: 2.5 };
  F.birds = [
    figBird(A, { ...B0, body: 6, head: 5, wing: 6, bar: 5, belly: 4, ring: 6, billPig: 3, hz: 2.0 }),                                   // goose
    figBird(A, { ...B0, L: 1.6, H: 0.68, neck: 1.1, tail: 1.2, span: 2.1, body: 4, head: 2, wing: 1, belly: 6, ring: 6, billPig: 5, hz: 2.6 }), // pintail
    figBird(A, { ...B0, L: 1.15, H: 0.5, neck: 0.35, up: 0.3, hh: 0.36, bill: 0.95, tail: 0.9, span: 1.9, body: 3, head: 3, wing: 6, bar: 5, billPig: 5, crest: true, hz: 3.0 }), // hoopoe
  ]; await ctx.yield();
  F.birds.push(figBird(A, { ...B0, L: 1.7, H: 0.62, neck: 2.3, up: 1.0, hh: 0.36, bill: 1.0, tail: 1.5, span: 2.8, body: 6, head: 6, wing: 6, billPig: 4, legs: 2, tailPig: 6, hz: 2.0 })); // egret
  await ctx.yield(); F.fly = figButterfly(A); await ctx.yield(); F.cat = figCat(A, pal); await ctx.yield();
  F.umbel = figUmbel(A); const Pstem = tileStem(A); await ctx.yield(); F.cap = figCapital(A); await ctx.yield(); const Pshaft = tileShaft(A); F.wreath = figWreath(A); await ctx.yield();
  const [texC, texD] = A.finish(ctx.renderer); U.uAtlasC.value = texC; U.uAtlasD.value = texD;
  const quadGeo = (b, uvf) => slabGeo([[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]], uvf, { thick: 0.02, bevel: 0.001 });

  // ---- the board ----
  const floorMat = stoneMaterial(U, { uPool: { value: new THREE.Vector4(...POOL) }, uSlab: { value: new THREE.Vector4(HX, HZ, 0, 0) }, uSeason: { value: new THREE.Vector2(opts.season === 1 ? 90 : 0, opts.season === 2 ? 10 : 0) } });
  const floor = new THREE.Mesh(floorGeo(HX, HZ, POOL), floorMat); floor.frustumCulled = false; garden.add(floor);
  const slabMat = slabMaterial(U);
  const flat = makeBatch(Math.round(120000 + 40000 * detail)), tall = makeBatch(Math.round(52000 + 26000 * detail));
  const sockGeo = (fig) => {
    if (fig.sock) return fig.sock;
    if (fig.parts.length === 1 && fig.parts[0].outline) return (fig.sock = slabGeo(offsetPoly(ccw(fig.parts[0].outline), 0.22), fig.parts[0].uvf, { thick: 0.02, bevel: 0.001 }));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of fig.parts) for (let i = 0; i < p.geo.nv; i++) { const x = p.geo.pos[i * 3], y = p.geo.pos[i * 3 + 1]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return (fig.sock = quadGeo([x0 - 0.2, y0 - 0.2, x1 + 0.2, y1 + 0.2], fig.parts[0].uvf));
  };
  /** put a figure into a batch. an = [mode, trigger, extra]; o: s scale, mir, rot, sock (leave a socket), rock [amp, freq] */
  const place = (batch, fig, at, yaw, an, o = {}) => {
    const ph = o.ph ?? rng(), s = o.s ?? 1;
    fig.parts.forEach((p, i) => batch.add(p.geo, at, yaw, [an[0], an[1], ph, an[2] ?? 0], (i === 0 && o.rock) ? [0, 0, o.rock[0], o.rock[1]] : [p.hinge[0], p.hinge[1], p.amp, p.freq], s, !!o.mir, o.rot ?? 0));
    if (o.sock) batch.add(sockGeo(fig), at, yaw, [4, 0, ph, 0], undefined, s, !!o.mir, 0);
  };

  // ---- trees, laid flat pointing away from the water on every bank; each hinges up about its roots ----
  const treeAt = (k) => F.trees[cast.tall[k % 3]];
  let nTree = 0;
  for (const side of [-1, 1]) for (let row = 0; row < 2; row++) {
    const n = 22;
    for (let i = 0; i < n; i++) {
      const z = 171 - i * 13.1 - row * 6.5, x = side * (POOL[2] + 13.5 + row * 24.5);
      const kind = (i + row * 2 + cast.rowPhase + (side > 0 ? 1 : 0)) % 4 === 3 ? 2 : (i + row) % 2;
      place(flat, treeAt(kind), [x, 0, z], -side * Math.PI / 2, [1, 150, 0], { s: rng.range(0.93, 1.02), mir: rng.chance(0.5), sock: true, rock: [0.02, rng.range(0.6, 1)] }); nTree++;
      if (i % 6 === 5) await ctx.yield();
    }
    await ctx.yield();
  }
  for (let row = 0; row < 2; row++) for (let i = -9; i <= 9; i++) {
    const x = i * 11.2 + (row ? 5.6 * Math.sign(i || 1) : 0); if (Math.abs(x) < 13 || Math.abs(x) > HX - 8) continue;
    place(flat, row ? F.trees[0] : F.pom, [x, 0, 183.6 + row * 12.8], Math.PI, [1, 70, 0], { s: rng.range(0.84, 0.92) * (row ? 0.585 : 1), mir: rng.chance(0.5), sock: true, rock: [0.025, rng.range(0.7, 1.1)] }); nTree++;
  }
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { place(flat, treeAt(i + 1), [side * (79 + i * 14.5), 0, -125], 0, [1, 120, 0], { s: 0.97, sock: true, rock: [0.02, 0.8] }); nTree++; }
  await ctx.yield();

  // ---- on the pool: lotus in profile with their leaves in plan, ducks, tilapia ----
  let nLotus = 0;
  for (const lane of [8.3, 52]) for (const side of [-1, 1]) for (let i = 0; i < 13; i++) {
    const keep = lane < 10 || detail > 0.75 || i % 2 === 0, blue = rng() < cast.lotusMix, j = rng.range(-2, 2), ph = rng();
    if (!keep) continue;
    const x = side * lane, z = 166 - i * 21.5 + j - (lane > 10 ? 9 : 0);
    place(flat, F.lotus[blue ? 0 : 1], [x, -0.6, z], 0, [1, 62, 0], { s: 0.75, ph }); nLotus++;
    if (detail > 0.75 || i % 2) place(flat, F.pad, [x - side * (lane > 10 ? 4.6 : -4.6), -0.6, z + 3.2], 0, [5, 0, 0], { s: 0.9, rot: ph * TAU });
  }
  await ctx.yield();
  // eight more on a lane 7 m from the axis, between the others (no draw from the seed: they are the same every visit)
  for (const side of [-1, 1]) for (const i of [3, 5, 7, 9]) {
    const z = 166 - (i + 0.5) * 21.5;
    place(flat, F.lotus[(i >> 1) % 2 === (side > 0 ? 1 : 0) ? 0 : 1], [side * 7, -0.6, z], 0, [1, 62, 0], { s: 0.75, ph: (i * 0.37 + side * 0.11 + 1) % 1 }); nLotus++;
  }
  let nDuck = 0;
  for (let i = 0; i < 30; i++) {
    if (i === 3 || i === 4) continue;                          // these two give their water to the duck family and a great tilapia
    const side = i % 2 ? 1 : -1, lane = 13 + 10 * ((i >> 1) % 4), z = 160 - (i >> 1) * 17.8 + rng.range(-3, 3), x = side * (lane + 0.8 + rng.range(-0.4, 0.4));
    place(flat, F.duck, [x, -0.6, z], 0, [1, 75, 1], { s: 1.2, mir: side < 0, rock: [0.05, 1.7] }); nDuck++;
  }
  // tilapia keep to two lanes a side, one speed to a lane, so the water between is free for the great figures
  for (let i = 0; i < 20; i++) {
    const side = i % 2 ? 1 : -1, m = i >> 1, lane = m % 2 ? 47.5 : 18, dir = m % 2 ? 1 : -1;
    place(flat, F.fish[i < cast.fishBud ? 1 : 0], [side * lane, -0.6, 165 - i * 13.7], -dir * Math.PI / 2, [2, m % 2 ? 1.7 : 2.3, dir], { s: 1.25 });
  }
  // size is importance: two great tilapia (under 23 m; each keeps to its own pocket of clear water and does not
  // travel), and a duck (under 14 m) with her four ducklings in file on the line below her
  place(flat, F.fish[1], [-33, -0.6, 120], Math.PI / 2, [2, 0, -1], { s: 2.9, ph: 0.2 });
  place(flat, F.fish[0], [33, -0.6, 20], -Math.PI / 2, [2, 0, 1], { s: 3.0, ph: 0.7 });
  place(flat, F.duck, [30, -0.6, 143.5], 0, [1, 75, 0.4], { s: 2.3, mir: true, ph: 0.15, rock: [0.03, 1.1] }); nDuck++;
  for (let i = 0; i < 4; i++) { place(flat, F.duck, [23.3 + i * 5.6, -0.6, 132.4], 0, [1, 75, 1], { s: 0.72, mir: true, ph: 0.3 + i * 0.17, rock: [0.07, 2.3] }); nDuck++; }
  // small things in the surface close by the course, on either hand: a leaf in plan, a little fish
  for (let i = 0; i < 64; i++) {
    const side = i % 2 ? 1 : -1, z = 168 - i * 4.3, x = side * (3.6 + 0.2 * ((i * 7) % 3));
    if (i % 3 === 2) place(flat, F.fish[0], [x, -0.6, z], (i % 4 < 2 ? 1 : -1) * Math.PI / 2, [5, 0, 0], { s: 0.2, ph: 0.5 });
    else place(flat, F.pad, [x, -0.6, z], 0, [5, 0, 0], { s: 0.3, ph: 0.5, rot: i * 1.9 });
  }
  await ctx.yield();
  const flatMesh = flat.mesh(slabMat); garden.add(flatMesh);
  await ctx.yield();

  // ---- the thicket: a backing panel on which the water climbs, rows of papyrus, the cat, the ranks of birds ----
  const PANEL_FS = /* glsl */`
    ${STYLE_GLSL}
    ${WATER_GLSL}
    uniform float uWater;
    varying vec3 vG, vN;
    void main(){
      vec2 p = vG.xy; vec2 fw = fwidth(p); float px = max(max(fw.x, fw.y)*0.75, 1e-4);
      vec3 N = vN/max(length(vN), 1e-4);
      float st = stageAt(vG), cut = smoothstep(2.5, 3.5, st), ink = smoothstep(1.9, 2.5, st);
      vec3 stone = stoneAt(p*vec2(1., 0.93) + 50., px), col = stone; float e = 0.;
      if (abs(N.z) < 0.7) e = clamp(dot(N, uSunL)*1.7, -1., 1.);
      else if (!gl_FrontFacing) col = mix(col, uPig[3], gridAt(p, px, 1.)*0.6);     // the back is still only ruled
      else {
        vec2 s2 = uSunL.xy/max(length(uSunL.xy), 1e-3);
        float lw = max(0.09, 0.8*px), lk = min(0.09/lw + 0.15, 1.);
        float top = uWater + 0.25*sin(p.x*0.21 + uTime*1.3);
        float inW = 1. - smoothstep(top - px, top + px, p.y), zc;
        vec4 w;
        gZig = 1.3*(1. - smoothstep(3.6, 4.0, st));
        w = waterAt(p, px, s2, 0., zc);
        gLoss = uWeather*(0.6*smoothstep(8., 55., p.y) - 0.26);
        float pnt = paintAt(p*0.5, st, px); gChipE *= inW; gChipS *= inW;
        col = mix(mix(stone, mix(uPig[5], uPig[3], gLost), ink*zc*inW*mix(0.85, 0.42, gLost)), w.rgb, inW*pnt); e = w.a*inW*cut*step(0.5, pnt);
        float base = 1. - smoothstep(lw, lw + px, abs(fract((p.y - 7.)/10. + 0.5) - 0.5)*10.);      // the ruled baselines of the registers
        float brim = 1. - smoothstep(lw*1.4, lw*1.4 + px, abs(p.y - top));
        col = mix(col, uLineC, base*lk*ink*(1. - inW)); col = mix(col, uPig[5], brim*lk*ink);
        // far off and only drawn, the thicket is one clean contour: a fan with a V notch over the course
        float ax = abs(p.x), xo = 48. + 0.27*p.y, xi = 5. + 0.2*p.y, cw = max(0.2, 1.15*px);
        float fd = min(abs(ax - xo)*0.965, abs(ax - xi)*0.98);
        fd = min(fd, abs(p.y - 69.5) + 1e3*(step(ax, xi) + step(xo, ax))) + 1e3*step(69.5 + cw, p.y);
        float fc = (1. - smoothstep(cw, cw + px, fd))*ink*(1. - smoothstep(3.6, 4.4, st))*smoothstep(0.16, 0.3, px);
        // inside the fan's contour the red grid stands back to a third of the outline's strength while the thicket is only drawn
        col = mix(col, uPig[3], gridAt(p, px, st - 1.)*0.6*(1. - smoothstep(3.6, 4.6, st))*mix(1., 0.33, ink*step(ax, xo + 1.)*step(p.y, 71.))*(1. - fc));
        col = mix(col, uPig[5], fc);
        // THE PANEL'S TWO SIDE EDGES TAKE A BORDER REGISTER: the board's own block border (the band of the pool's
        // coping, FLOOR_FS: blue, red, green and yellow blocks of 2.5 m between white bars, 3.8 m across) runs up each
        // slanted side edge on a strip of stone 6 m wide, with the coping line 1.1 m outside the water, so the water
        // that climbs the panel ends against a border as the pool does and not against the bare edge of the slab.
        // It is drawn and painted by the panel's own stage (the same front as its water), with the panel's own loss
        // of paint; far off, while the thicket is only drawn, it is left out with everything but the fan's contour.
        float de = 0.956*(57. - ax) + 0.2932*p.y;                      // metres in from the side edge, square to it
        float bOn = 1. - (1. - smoothstep(3.6, 4.4, st))*smoothstep(0.16, 0.3, px);
        if (de < 6. && bOn > 0.) {
          float sg = p.x < 0. ? -1. : 1., al = 0.2932*(ax - 57.) + 0.956*p.y, bv = de - 2.2;      // al: metres up the edge; bv: across the band
          float bf = (fract(al/3.2) - 0.5)*3.2, bk = mod(floor(al/3.2), 4.), small = smoothstep(0.5, 1.6, px);
          float inB = step(abs(bf), 1.25)*step(abs(bv), 1.25)*(1. - small), inBand = step(abs(bv), 1.9);
          vec3 pg = bk < 0.5 ? uPig[1] : bk < 1.5 ? uPig[3] : bk < 2.5 ? uPig[2] : uPig[4];
          vec3 bandC = mix(mix(uPig[6], pg, inB), mix(uPig[6], (uPig[1] + uPig[3] + uPig[2] + uPig[4])*0.25, 0.5), small);
          float cE = gChipE, cS = gChipS;
          float pb = paintAt(p*0.5 + 9., st, px);
          vec3 bc = mix(stone, bandC, inBand*pb);
          float bl = max(1. - smoothstep(lw, lw + px, abs(abs(bv) - 1.9)), inB > 0.5 ? 1. - smoothstep(lw, lw + px, min(1.25 - abs(bf), 1.25 - abs(bv))) : 0.);
          float cop = 1. - smoothstep(lw, lw + px, abs(de - 4.9));
          bc = mix(bc, mix(uPig[5], uLineC, smoothstep(3.6, 4.4, st)), max(bl, cop)*lk*ink);
          vec2 sb = vec2(dot(s2, vec2(sg*0.2932, 0.956)), dot(s2, vec2(-sg*0.956, 0.2932)));      // the sun up the edge and in from it
          vec2 dd = vec2(1.25) - abs(vec2(bf, bv)), bb = (1. - smoothstep(0.22, 0.22 + px, dd))*inB;
          float ex = -sign(bf)*sb.x*bb.x, ey = -sign(bv)*sb.y*bb.y;
          col = mix(col, bc, bOn); e = mix(e, clamp((abs(ex) > abs(ey) ? ex : ey)*2.2, -1., 1.)*cut, bOn);
          gChipE = mix(cE, gChipE*inBand, bOn); gChipS = mix(cS, gChipS*inBand, bOn);
        }
      }
      gl_FragColor = vec4(edgeTone(col, e), 1.);
    }`;
  const uWater = { value: 2 };
  const panelG = (() => {
    const z = FAN_Z - 5, zb = z - 3, a = [-57, 0], b = [57, 0], c = [80, 75], d = [-80, 75], pos = [], nrm = [], idx = [];
    const quad = (q, n) => { const k = pos.length / 3; for (const v of q) { pos.push(...v); nrm.push(...n); } idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
    quad([[...a, z], [...b, z], [...c, z], [...d, z]], [0, 0, 1]); quad([[...d, z], [...c, z], [...c, zb], [...d, zb]], [0, 1, 0]);
    quad([[...b, z], [...b, zb], [...c, zb], [...c, z]], [0.95, -0.3, 0]); quad([[...a, zb], [...a, z], [...d, z], [...d, zb]], [-0.95, -0.3, 0]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx); return g;
  })();
  const panel = new THREE.Mesh(panelG, stoneMaterial(U, { uWater }, PANEL_FS)); panel.material.side = THREE.DoubleSide; panel.frustumCulled = false; garden.add(panel);

  const vHalf = (y) => 5 + 0.2 * y, fanHalf = (y) => 48 + 0.27 * y;
  const stemGeo = (xb, xt, H, w0 = 0.42, w1 = 0.2) => {
    const g = slabGeo([[xb - w0, 0], [xb + w0, 0], [xt + w1, H], [xt - w1, H]],
      (x, y) => { const t = clamp(y / H, 0, 1), c = xb + (xt - xb) * t, w = w0 + (w1 - w0) * t; return Pstem.uv((x - c) / w * 0.3, t * 16); }, { thick: 0.3, bevel: 0.06 });
    g.off = new Float32Array(g.nv * 2); g.wid = new Float32Array(g.nv);
    for (let i = 0; i < g.nv; i++) { const t = clamp(g.pos[i * 3 + 1] / H, 0, 1); g.off[i * 2] = g.pos[i * 3] - (xb + (xt - xb) * t); g.wid[i] = 2 * (w0 + (w1 - w0) * t); }
    return g;
  };
  const CS = 1.75, inCat = (x, y0, y1) => x > 13.5 && x < 45 && y1 > 22.5 && y0 < 43.5;      // the pocket of clear stone the cat is drawn in
  let nStem = 0;
  for (let k = 0; k < 6; k++) {
    const H = k < 5 ? 17 + 10 * k : 66, us = 0.68, pitch = 4.9, z = FAN_Z - 0.6 * k;
    for (const side of [-1, 1]) for (let j = 0; ; j++) {
      const xa = vHalf(H + 2) + 2.8 + j * pitch; if (xa > fanHalf(H) || j > 40) break;
      const jit = rng.range(-0.35, 0.35), hj = rng.range(-0.5, 0.5), keep = detail > 0.75 || j % 3 !== 1 || (k === 5 && j % 2 === 0);
      const xt = side * (xa + jit), xb = side * (2.6 + (xa - vHalf(H + 2)) * 0.72), Hs = H + hj;
      if (!keep || inCat(xt, Hs, Hs + 4.6)) continue;
      const ph = rng(), rank = k === 5 && j % 2 === 0 ? 0 : 0.3 + 0.7 * ph;      // the far line drawing keeps every other stem of the tallest row
      tall.add(stemGeo(xb, xt, Hs), [0, 0, z], 0, [6, rank, ph, 1.1]);
      place(tall, F.umbel, [xt, Hs - 0.25, z + 0.05], 0, [0, rank || -1, 1.1], { s: us, ph, rot: -Math.atan2(xt - xb, Hs) * 0.9 }); nStem++;
      if (j % 8 === 7) await ctx.yield();
    }
    await ctx.yield();
  }
  // the cat on its two bent stems, 12 m to starboard at y 30
  const CAT = new THREE.Vector3(29, 31, FAN_Z + 1.0);
  for (const [xb, xp, xe] of [[17.5, CAT.x - 3.05 * CS, CAT.x + 2.6 * CS], [27.5, CAT.x + 3.45 * CS, CAT.x + 9.4 * CS]]) {
    const yp = CAT.y - 3.6 * CS, ye = yp + 2.0 * CS, w = 0.5;
    tall.add(slabGeo([[xb - 0.45, 0], [xb + 0.45, 0], [xp + w, yp - 0.6], [xe, ye - w], [xe, ye + w], [xp - w, yp + 0.35]], (x, y) => Pstem.uv(0.12, clamp(y / 28, 0, 1) * 16), { thick: 0.3, bevel: 0.06 }), [0, 0, FAN_Z + 0.4], 0, [0, 0, 0.3, 0.25]);
    place(tall, F.umbel, [xe - 0.2, ye, FAN_Z + 0.45], 0, [0, 0, 0.25], { s: 0.8, rot: -1.85 });
  }
  place(tall, F.cat, [CAT.x, CAT.y, CAT.z], 0, [0, 0, 0.25], { ph: 0.3, s: CS });
  await ctx.yield();

  // six ranks of birds, flat pictures between the stems until their tier is let go
  const tiers = [F.birds[0], F.birds[1], F.birds[2], F.fly, F.birds[3], F.birds[3]], tierY = [12, 22, 32, 42, 52, 62];
  let nBird = 0;
  for (let k = 0; k < 6; k++) {
    const BS = k === 3 ? 1.5 : 1.6, fig = tiers[k], y = tierY[k], pitch = (fig.len + (k === 3 ? 1.0 : 1.9)) * BS;      // size is importance
    for (const side of [-1, 1]) for (let j = 0; ; j++) {
      const xa = vHalf(y) + 3.2 + fig.len * 0.5 * BS + j * pitch; if (xa > fanHalf(y) - 2 || j > 30) break;
      const ph = rng();
      if (inCat(side * xa + fig.len * 0.5 * BS, y - 1, y + fig.h * BS) || inCat(side * xa - fig.len * 0.5 * BS, y - 1, y + fig.h * BS)) continue;
      if (k < 2 && side > 0 && xa < 47) continue;                 // nothing rises across the cat
      place(tall, fig, [side * xa, y, FAN_Z + 1.3], 0, [3, k, side], { ph: (j % 5) * 0.2 * 0.6 + ph * 0.1, mir: side < 0, s: BS }); nBird++;
    }
    await ctx.yield();
  }

  // ---- the two palm columns and the wreath between them ----
  const shaftG = slabGeo([[-2.3, 0], [2.3, 0], [2.3, 1.3], [1.75, 1.8], [1.5, 45], [-1.5, 45], [-1.75, 1.8], [-2.3, 1.3]], (x, y) => Pshaft.uv(clamp(x, -1.9, 1.9), clamp(y / 45, 0, 1) * 16), { thick: 2.6, bevel: 0.3 });
  for (const side of [-1, 1]) {
    tall.add(shaftG, [side * 11, 0, COL_Z], 0, [0, 0, 0, 0]);
    place(tall, F.cap, [side * 11, 44.2, COL_Z], 0, [0, 0, 0], { mir: side < 0 });
    tall.add(F.wreath.cord(0.2, 5.6), [side * 8.15, RING.y + 11.4, RING.z], 0, [0, 0, 0, 0.9], undefined, 1, false, side * 0.42);
  }
  const NW = 22, cordG = F.wreath.cord(0.42, Math.PI * 8.1 / NW + 0.02), order = rng.shuffle([0, 1, 2]);
  for (let i = 0; i < NW; i++) {
    const a = (i + 0.5) / NW * TAU, cx = Math.cos(a), sy = Math.sin(a);
    tall.add(cordG, [RING.x + cx * 8.1, RING.y + sy * 8.1, RING.z], 0, [0, 0, 0.5, 0.9], undefined, 1, false, a);
    tall.add(F.wreath.pieces[order[i % 3]], [RING.x + cx * 8.75, RING.y + sy * 8.75, RING.z], 0, [0, 0, 0.5, 0.9], undefined, 0.72, false, a - Math.PI / 2);
  }
  await ctx.yield();
  const tallMesh = tall.mesh(slabMat); garden.add(tallMesh);
  await ctx.yield();

  // ---- control ----
  const sunW = new THREE.Vector3(0.8, 0.29, 0.53).normalize();
  const S = { tilt: 0, flight: 0, front: -1e4, rise: -1, driven: false, look: 0 };
  /** the brief's schedule for the board: 30 deg until the hinge is crossed (u 0.275), level at u 0.5 */
  const tiltAt = (u) => { const K = [[0, 30], [0.275, 30], [0.35, 18], [0.45, 5], [0.5, 0], [1, 0]]; let i = 0; while (i < K.length - 2 && u > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], t = clamp((u - a[0]) / (b[0] - a[0]), 0, 1); return lerp(a[1], b[1], i === 0 ? 0 : (i === 1 ? t * t * (2 - t) : (i === 3 ? 1 - (1 - t) * (1 - t) : t))) * Math.PI / 180; };
  const frontAt = (u) => (u < 0.225 ? lerp(170, 60, smoothstep(0, 0.225, u)) : u < 0.5 ? lerp(60, 15, (u - 0.225) / 0.275) : lerp(15, -470, smoothstep(0.5, 0.68, u) * 0.6 + 0.4 * clamp((u - 0.5) / 0.18, 0, 1)));
  const flightAt = (u) => Math.max(0, u - 0.7) * 40;
  const setProgress = (u) => { S.driven = true; S.tilt = tiltAt(u); S.front = frontAt(u); S.flight = flightAt(u); };
  const _c = new THREE.Vector3(0, 40, 400), _e = new THREE.Vector3(), _q = new THREE.Quaternion(), _s2 = new THREE.Vector2();
  // the set-piece viewer's orbit and demo loop (no page or URL reads)
  const V = { u: -1, tilt: 0, r: 150, h: 70, c: new THREE.Vector3(0, 18, -30) };
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (!S.driven) {                    // nobody is flying the piece (the set-piece viewer): play the journey on a loop
      const u = V.u >= 0 ? V.u : 0.3 + 0.7 * (((time + 14) / 36) % 1); S.tilt = tiltAt(u) * V.tilt; S.front = frontAt(u); S.flight = flightAt(u);
      _c.set(0, 3, lerp(330, -150, smoothstep(0.1, 0.8, u)));
    }
    pivot.rotation.x = S.tilt; root.updateMatrixWorld(true);
    if (camera) {
      _e.setFromMatrixPosition(camera.matrixWorld); garden.worldToLocal(_e); U.uEyeL.value.copy(_e);
      if (S.driven) _c.copy(_e);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_s2); U.uPxAng.value = 2 / (Math.max(Math.abs(camera.projectionMatrix.elements[5]), 0.1) * Math.max(_s2.y, 1)); }
    }
    U.uCamL.value.copy(_c);
    garden.getWorldQuaternion(_q).invert(); U.uSunL.value.copy(sunW).applyQuaternion(_q).normalize();
    U.uFront.value.set(0, 0, 1, -S.front); U.uFlight.value = S.flight; U.uRise.value.x = S.rise;
    // the water climbs the fan one register for each tier that has gone
    let lvl = 2; for (let k = 0; k < 6; k++) lvl += (k ? 10 : 5) * smoothstep(k * 1.5 + 1, k * 1.5 + 3.2, S.flight); uWater.value = lvl;
    const dy = _c.y - CAT.y - 2, dx = Math.max(Math.hypot(_c.x - CAT.x + 6, _c.z - CAT.z), 6);
    const want = -clamp(Math.atan2(dy, dx) * 1.4 + 0.12 * Math.sin(time * 0.5), -0.3, 0.45);
    S.look += (want - S.look) * Math.min(1, dt * 2.5); U.uRise.value.z = S.look;
  }
  update(0, 0, null);

  const s35 = Math.sin(36.2 * Math.PI / 180), c35 = Math.cos(36.2 * Math.PI / 180);
  const anchors = {
    portalSeat: { position: [RING.x, RING.y, RING.z], facing: [0, -s35, c35], radius: 7.5 },
    flyThrough: [[0, 40, 262], [0, 38, 210], [0, 20, 152], [0, 2.2, 93], [0, 2.2, -40], [0, 2.2, -92], [0, 4, -101], [0, 8.4, -108], [0, 26.2, -132.3], [RING.x, RING.y, RING.z]],
    hinge: { a: [-HX, 0, HZ], b: [HX, 0, HZ] },
    pool: { center: [POOL[0], -0.6, POOL[1]], half: [POOL[2], POOL[3]] },
    viewpoints: { page: [0, 40, 262], onWater: [0, 2.2, 40], underTiers: [0, 6, -104] },
    cat: [CAT.x, CAT.y, CAT.z], thicket: [0, 35, FAN_Z], columns: [[-11, 0, COL_Z], [11, 0, COL_Z]], tiers: tierY,
    sun: sunW.toArray(),
  };
  return {
    object: root, radius: V.r, height: V.h, center: V.c, anchors, ground: false, groundY: 0,
    update, dispose() { texC.dispose(); texD.dispose(); },
    uniforms: U, garden, atlas: A, figures: F, place, batches: { flat, tall }, materials: { slab: slabMat, floor: floorMat, panel: panel.material },
    setProgress, tiltAt, frontAt, flightAt,
    setTilt(rad) { S.driven = true; S.tilt = rad; }, setFlight(sec) { S.driven = true; S.flight = sec; }, setFront(z) { S.driven = true; S.front = z; },
    setRise(k) { S.rise = k; }, setSun(v) { sunW.copy(v).normalize(); },
    counts: { trees: nTree, lotus: nLotus, ducks: nDuck, stems: nStem, birds: nBird, verts: flat.count + tall.count, flat: flat.count, tall: tall.count },
  };
}
