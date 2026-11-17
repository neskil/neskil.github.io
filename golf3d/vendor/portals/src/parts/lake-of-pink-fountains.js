// lake-of-pink-fountains: THE FOUNTAIN, after Hieronymus Bosch. One shell-pink thing 140 m tall, turned like
// blown glass and armed like a thistle, standing in a round lake; a blue glass tube 67 m long stands free on the lake
// beside it, 17 m clear of the skirt (the camera flies down it; until the outside review's fifth round it pierced the skirt,
// and the code that cuts a bore and sets collars where a tube crosses the skirt is still here for a tube that does);
// a dark round window in its globe is the way out.
//
// HOW THE STYLE IS MADE (flat pigment: the world must return
//   post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }; no tone-map inverse).
//   1. Every form is a loft with smooth normals whose vertices carry aPig (pigment), aAxis (the form's axis there),
//      aUV (turn round the axis, metres along the profile) and aPat (pattern, cells, row height, profile fraction).
//      Build forms with FormBuilder (loft / lathe), thorn(), smoothProfile().
//   2. glazeMaterial(U): the one unlit glaze. Full pigment at the rim, mixed toward the chalk ground by
//      uPale * facing^1.5 where the form faces us, toward blue-black by 0.3 in the last sixth before the rim; one hard
//      ivory streak 5 degrees of lathe angle wide, upper left of the camera's bearing, fraying into dashes at each end
//      of the profile (so it breaks at every collar); ruled interior hairlines (PAT.scales / veins / rings / tube / dots /
//      scallops) drawn in the surface's own coordinates and replaced by their flat average under ~4 px spacing.
//      THE MEDIUM MOVES because streak and glaze are functions of cameraPosition: every streak slides round its form
//      at once as the camera travels, forms pale and fill; the frayed ends shimmer on uTime (uWet).
//   3. hullMaterial(U): the contour. Draw the SAME geometry again with it (BackSide, pushed out in clip space by 0.15 %
//      of buffer height, never under 1.5 px, sunk a little along the view ray). hullMaterial(U, { ghost: true }) on
//      FormBuilder.ghostGeometry() is the paler second contour of the underdrawing (forms lofted with ghost: true).
//   4. dotMaterial(U): pearls, seeds, eyes (instanced camera-facing discs, hairline rim; a negative radius = a pearl that opens with uEve). bubbleMaterial(U): ring + arc +
//      6 % fill, blended, drawn last. ribbonMaterial(U, { color, flow, sway }): jets, stalks, skeins (never under 1.6 px).
//      filmMaterial, waterMaterial, lawnMaterial: the film across an opening, the lake, the banded lawn.
//   5. makeStyleUniforms(palette) -> U, shared by all of the above: pass the hero's (hero.uniforms) to your own
//      materials, or pass yours in as opts.uniforms. trackResolution(mesh, U) keeps U.uRes right (already set here).
//      True openings (the tube's bore through the skirt, the window, the tube's ports) are discards driven by
//      U.uBoreA/D/R and U.uWinP/D/R (written in hero.update from the hero's world matrix): nothing transparent is sorted.
//
// buildHero(ctx, opts) -> { object, radius 62, height 140, center, anchors, uniforms, seed, setProgress(u), update, dispose }
//   LOCAL SPACE = the brief's world coordinates minus (0, 0, 380): put object.position at (0, 0, 380), NO rotation.
//   The camera arrives from -Z (so the piece's "front" is -Z, not the contract's +Z; the brief's numbers win).
//   opts: palette (7 hex, brief order) | uniforms (a shared U) | detail 0.6..1 (bubbles only; nothing else is plentiful)
//         colourway 'blue' (fountain slate, tubes pink) | tube: false (omit the great tube and its cut)
//         lake: false (omit the water disc, radius opts.lakeRadius 170) | backdrop: false (omit the bowl of banded lawn,
//         r 170..1500, which follows the brief's three lawns: it is there for the viewer; a world with its own ground
//         MUST pass backdrop: false) | filmAt 0.52 (path u at which the film across the tube's far mouth bursts).
//   setProgress(u): call every frame with the path's u; it only moves the film (a pure function of u).
//   update(dt, time, camera): ambient motion on time (jets fall, bubbles climb, ripples spread, streak ends shimmer).
//   anchors (local): portalSeat { position, facing, radius 7 } 6 m inside the window; window { center, dir, radius, left };
//     owlPerch { position, facing (into the dark), along (rim direction for the sidestep) }; tube { a, b, dir, bore 7.25,
//     length, portEvery 9, firstPort 4.5, portsRound 3 (three ports round the bore at each station, the next station turned
//     a sixth), pierce [s in, s out] (empty: the tube stands clear of the skirt) }; flyThrough [ordered points: lake, tube mouth, tube end,
//     the climbing right-hand loop, the last straight, the portal]; viewpoints { entry, reveal, loopApex, lastStraight };
//     globe { center, radius }; top; footRadius; tubeMouths[3]; jetLandings[3]; finialTips[4]; hornSeat.
//   Per seed: spire bulbs 3..5 and its crescent, thorn lengths and curl, petal lengths, curl and twist, hoop heights and
//     thorn count, the three small tubes' bearings, pitch and length, finial tilt and length, which forms show underdrawing.
//   Cost: about 63k triangles of forms drawn twice (glaze + contour) + ~4k underdrawing + ~4k pearls: ~135k triangles
//     (+4k for the backdrop), 9 draw calls (glaze, contour, underdrawing, pearls, jets, bubbles, film, lake, backdrop),
//     build ~120-300 ms in steps under 50 ms, no lights, no textures.
//   Expects around it: lawn green on all sides (pink reads against green), the horn at anchors.hornSeat, birds and fruit.
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------
// 1. PIGMENTS. The seven of the brief, in its order. Flat pipeline (post.flat = 1): the linear
//    value written is the colour shown, so there is no tone-map inverse anywhere in this file.
// ---------------------------------------------------------------------------------------------
export const PALETTE = ['#E9A6A1', '#6F93B8', '#8DB36A', '#3E5A3A', '#F3E7C9', '#C2362B', '#1F2A33'];
export const PIG = { pink: 0, slate: 1, lawn: 2, deep: 3, ground: 4, vermilion: 5, ink: 6 };

// Pattern ids for the aPat.x attribute (add 10 * cut: 1 = skirt bore, 2 = globe window, 3 = tube ports).
export const PAT = { plain: 0, scales: 1, veins: 2, rings: 3, tube: 4, dots: 5, scallops: 6, orchard: 7, head: 8, pits: 9 };   // pits = a strawberry's seeds, each an ivory seed in a dark crescent pit   // head = the goldfinch's: mask, cheek, cap and band as hard-edged areas, scalloped   // orchard = dots, some of them vermilion fruit

// One set of uniforms shared by every material of the world (the factories below all take it).
export function makeStyleUniforms(palette = PALETTE) {
  const c = (i) => new THREE.Color(palette[i] || PALETTE[i]);
  return {
    uGround: { value: c(4) },                 // chalk ground / lead white: the light inside everything
    uInk: { value: c(6) },                    // blue-black hairline
    uVerm: { value: c(5) },                   // vermilion: fruit dots (PAT.orchard)
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1920, 1080) },   // drawing-buffer size; kept current by trackResolution()
    uStreakDeg: { value: 35 },                // streak sits this far to the left of the camera's bearing
    uWet: { value: 1 },                       // 0 freezes the wet-paint shimmer of the streak's frayed ends
    uBoreA: { value: new THREE.Vector3(0, -1e4, 0) }, // great tube: a point on its axis (world)
    uBoreD: { value: new THREE.Vector3(0, 0, 1) },    // great tube: unit direction (world)
    uBoreR: { value: 7.0 },
    uWinP: { value: new THREE.Vector3(0, -1e4, 0) },  // window: centre on the globe's surface (world)
    uWinD: { value: new THREE.Vector3(1, 0, 0) },     // window: outward unit direction (world)
    uWinR: { value: 7.5 },
    uInTube: { value: 0 },
    uPierce: { value: new THREE.Vector2(-1e3, -1e3) },   // metres along the great tube where it enters and leaves the skirt
    uTubeLen: { value: 140 },                 // the great tube's length in metres (its two lips keep their glass at any distance)
    uEve: { value: 0 },                       // 0 forenoon .. 1 the day turned: lawns deepen, far water pales to chalk under short pink smears, the window's second pearl ring opens
    uSkyLow: { value: c(4) },                 // the sky's colour at the skyline (the world keeps it current)                    // 0 outside the great tube, 1 with the eye inside it: the wall thins to clear glass
  };
}

// ---------------------------------------------------------------------------------------------
// 2. GLSL. GLAZE_VERT / GLAZE_FRAG are the whole look; HULL_VERT / HULL_FRAG the contour.
//    Geometry attributes every glazed form carries (see loft() below, which writes them):
//      position, normal (smooth), aPig vec3 (pigment, linear), aAxis vec3 (unit axis of the form at
//      this vertex), aUV vec2 (x = turns round the axis 0..1, y = metres along the profile),
//      aPat vec4 (pattern id + 10*cut, cells per turn, row height in metres, profile fraction 0..1).
// ---------------------------------------------------------------------------------------------
export const STYLE_VARY = /* glsl */`
varying vec3 vPig; varying vec3 vN; varying vec3 vWP; varying vec3 vAx; varying vec2 vUV; varying vec4 vPat;
`;

export const GLAZE_VERT = /* glsl */`
attribute vec3 aPig; attribute vec3 aAxis; attribute vec2 aUV; attribute vec4 aPat;
${STYLE_VARY}
void main() {
  mat4 M = modelMatrix;
  #ifdef USE_INSTANCING
    M = modelMatrix * instanceMatrix;
  #endif
  vPig = aPig;
  #ifdef USE_INSTANCING_COLOR
    vPig = aPig * instanceColor;
  #endif
  vec4 wp = M * vec4(position, 1.0);
  vWP = wp.xyz;
  vN = mat3(M) * normal;
  vAx = mat3(M) * aAxis;
  vUV = aUV; vPat = aPat;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

// Shared by glaze and hull: what is cut away (true openings, no transparency) and the pattern lines.
export const STYLE_GLSL = /* glsl */`
uniform vec3 uGround; uniform vec3 uInk; uniform vec3 uVerm; uniform float uTime; uniform float uStreakDeg; uniform float uWet;
uniform vec3 uBoreA; uniform vec3 uBoreD; uniform float uBoreR;
uniform vec3 uWinP; uniform vec3 uWinD; uniform float uWinR; uniform float uInTube; uniform float uEve; uniform vec2 uPierce; uniform float uTubeLen;
${STYLE_VARY}
vec3 safeN(vec3 v, vec3 fb) { float l = length(v); return l > 1e-5 ? v / l : fb; }
// distance (m) to the edge of the opening this surface is cut by; negative = inside the hole (discard)
float cutDist(float cut) {
  float d = 1e3;
  if (cut > 0.5 && cut < 1.5) { vec3 r = vWP - uBoreA; d = length(cross(r, uBoreD)) - uBoreR; }
  else if (cut > 1.5 && cut < 2.5) { vec3 r = vWP - uWinP; float along = dot(r, uWinD);
    d = length(r - uWinD * along) - uWinR; float behind = -along - 3.0; if (behind > 0.0) d = max(d, behind); }
  else if (cut > 2.5) { float circ = vPat.y; float s = vUV.y;
    float k = floor(s / 9.0 - 0.5);                          // the two nearest ports, so the distance has no jump
    // three ports round the bore at each station, the next station turned a sixth: the glass is an openwork of round windows
    float du0 = (fract((vUV.x - mod(k, 2.0) / 6.0) * 3.0 + 0.5) - 0.5) * circ / 3.0;
    float du1 = (fract((vUV.x - mod(k + 1.0, 2.0) / 6.0) * 3.0 + 0.5) - 0.5) * circ / 3.0;
    d = min(length(vec2(du0, s - k * 9.0 - 4.5)), length(vec2(du1, s - k * 9.0 - 13.5))) - 3.3; }
  return d;
}
// interior hairlines. returns x = dark line cover 0..1, y = ivory dot cover 0..1
vec2 patternLines(float id, vec2 cuv, vec2 dc) {
  float dmax = max(dc.x, dc.y);
  float crisp = 1.0 - smoothstep(0.11, 0.25, dmax);          // spacing over ~9 px crisp, under 4 px flat
  float row = floor(cuv.y);
  vec2 res = vec2(0.0);
  if (id > 0.5 && id < 1.5) {                                // scales: ruled rows, tip down, one vein each
    float x = fract(cuv.x + 0.5 * mod(row, 2.0)) - 0.5; float y = fract(cuv.y);
    float e = sqrt(4.0 * x * x + y * y);                     // arc hangs from the row line above
    float w = (4.0 * abs(x) * dc.x + y * dc.y) / max(e, 0.25);
    w = max(min(1.5 * w, 0.11), 1e-4);
    float ln = 1.0 - smoothstep(0.5 * w, w, abs(e - 1.0));
    float wv = max(min(1.2 * dc.x, 0.06), 1e-4);
    float vein = (1.0 - smoothstep(0.5 * wv, wv, abs(x))) * (1.0 - smoothstep(0.7, 0.82, y)) * step(0.18, y) * 0.7;
    res.x = mix(0.2, max(ln, vein), crisp);
  } else if (id > 1.5 && id < 2.5) {                         // veins: lines along the profile
    float x = abs(fract(cuv.x) - 0.5); float w = max(min(1.5 * dc.x, 0.1), 1e-4);
    float c1 = 1.0 - smoothstep(0.11, 0.25, dc.x);
    res.x = mix(0.14, 1.0 - smoothstep(0.5 * w, w, x), c1);
  } else if (id > 2.5 && id < 3.5) {                         // rings: joint lines across the profile
    float y = abs(fract(cuv.y) - 0.5); float w = max(min(1.5 * dc.y, 0.1), 1e-4);
    float c1 = 1.0 - smoothstep(0.11, 0.25, dc.y);
    res.x = mix(0.14, 1.0 - smoothstep(0.5 * w, w, y), c1);
  } else if (id > 3.5 && id < 4.5) {                         // tube: a double ring joint every 6 m
    float s = vUV.y / 6.0; float ds = dc.y * vPat.z / 6.0;
    float y = abs(abs(fract(s) - 0.5) - 0.035); float w = max(min(1.5 * ds, 0.03), 1e-4);
    res.x = 1.0 - smoothstep(0.5 * w, w, y);
    // the glass between the joints is ruled like everything else: fine veins that are whole by the joint and fray into
    // dashes midway, a row of small arcs hanging off each joint, and the ivory streak broken into dashes
    float tn = vUV.x; float dtn = max(dc.x / max(vPat.y, 1e-3), 1e-6);   // turns round the bore, and turns per pixel
    float e = abs(fract(s) - 0.5);                            // 0 on the joint, 0.5 midway to the next
    float vx = abs(fract(tn * 22.0) - 0.5); float dv = dtn * 22.0; float wv = max(min(1.5 * dv, 0.08), 1e-4);
    float dsh = 0.5 + 0.5 * sin(vUV.y * 5.0 + floor(tn * 22.0) * 2.4 - uTime * 1.3 * uWet);   // wet paint: the dashes creep up the glass
    float vein = (1.0 - smoothstep(0.5 * wv, wv, vx)) * step(dsh, 1.15 - 1.9 * e) * step(0.07, e);
    res.x = max(res.x, mix(0.1, vein * 0.7, 1.0 - smoothstep(0.1, 0.24, dv)));
    float ya = (e - 0.05) / 0.1;
    if (ya > 0.0 && ya < 1.06) {
      float xa = fract(tn * 44.0) - 0.5; float da = dtn * 44.0; float dy = ds / 0.1;
      float ea = sqrt(4.0 * xa * xa + ya * ya);
      float wa = (4.0 * abs(xa) * da + ya * dy) / max(ea, 0.25); wa = max(min(1.5 * wa, 0.11), 1e-4);
      res.x = max(res.x, mix(0.18, 1.0 - smoothstep(0.5 * wa, wa, abs(ea - 1.0)), 1.0 - smoothstep(0.11, 0.25, max(da, dy))));
    }
    float sw = max(0.007, 0.75 * dtn);
    float st = 1.0 - smoothstep(sw - 0.5 * dtn, sw + 0.5 * dtn, abs(tn - 0.165));
    float dash2 = 0.5 + 0.5 * sin(vUV.y * 9.0 + 1.6 * uWet * sin(uTime * 0.6 + vUV.y * 0.13));
    res.y = st * smoothstep(dash2 - 0.04, dash2 + 0.04, smoothstep(0.04, 0.2, e) * 1.25) * step(0.04, e);
    // two ruled rows of single ivory touches between the veins, midway and a third of the way from each joint
    float cw = vPat.y / 22.0; float dpx = max(max(dtn * vPat.y, ds * 6.0), 1e-4);
    float d1 = length(vec2((fract(tn * 22.0 + 0.5) - 0.5) * cw, (e - 0.5) * 6.0));
    float d2 = length(vec2((fract(tn * 22.0) - 0.5) * cw, (e - 0.27) * 6.0));
    float dq = min(d1, d2 + 0.05); float cd2 = 1.0 - smoothstep(0.07, 0.16, dpx);
    res.y = max(res.y, mix(0.04, 1.0 - smoothstep(0.2 - 0.5 * dpx, 0.2 + 0.5 * dpx, dq), cd2));
    res.x = max(res.x, (1.0 - smoothstep(0.2 + dpx, 0.2 + 2.5 * dpx, dq)) * smoothstep(0.2, 0.2 + dpx, dq) * cd2 * 0.8);
  } else if ((id > 4.5 && id < 5.5) || (id > 6.5 && id < 7.5)) {   // dots: ruled rows of single ivory touches
    float x = fract(cuv.x + 0.5 * mod(row, 2.0)) - 0.5; float y = fract(cuv.y) - 0.5;
    float dd = length(vec2(x, y)); float wd = max(dmax, 1e-4);
    res.y = mix(id > 6.5 ? 0.07 : 0.12, 1.0 - smoothstep(0.2, 0.2 + wd, dd), crisp);
    res.x = mix(0.06, (1.0 - smoothstep(0.2 + wd, 0.2 + 2.5 * wd, dd)) * smoothstep(0.2, 0.2 + wd, dd), crisp);
  } else if (id > 5.5 && id < 6.5) {                         // scallops: feather rows, tip down, no vein
    float x = fract(cuv.x + 0.5 * mod(row, 2.0)) - 0.5; float y = fract(cuv.y);
    float e = sqrt(4.0 * x * x + y * y);
    float w = (4.0 * abs(x) * dc.x + y * dc.y) / max(e, 0.25); w = max(min(1.5 * w, 0.11), 1e-4);
    res.x = mix(0.16, 1.0 - smoothstep(0.5 * w, w, abs(e - 1.0)), crisp);
    if (id > 6.35) { res.y = res.x * 0.85; res.x = 0.0; }    // 6.45, a folded wing: every feather edged in ivory on the dark
    else if (id > 6.1) res.x *= smoothstep(0.07, 0.27, abs(vUV.x - 0.5)) * (0.55 + 0.45 * smoothstep(0.2, 0.75, vPat.w));   // 6.25, plumage: fine scallops gathered on nape, back and flank, thinning to a smooth breast
  } else if (id > 8.5) {                                     // pits: ruled rows of seeds, each an ivory seed sunk in a dark crescent pit
    float x = fract(cuv.x + 0.5 * mod(row, 2.0)) - 0.5; float y = fract(cuv.y) - 0.5;
    float wd = max(dmax, 1e-4);
    float sd = 1.0 - smoothstep(0.17, 0.17 + wd, length(vec2(x * 1.2, y + 0.05)));
    float pit = 1.0 - smoothstep(0.29, 0.29 + wd, length(vec2(x, y - 0.045)));
    res.y = mix(0.07, sd, crisp);
    res.x = mix(0.13, pit * (1.0 - sd), crisp);
  }
  return res;
}
`;

export const GLAZE_FRAG = /* glsl */`
${STYLE_GLSL}
uniform float uBackDark; uniform float uPale;
void main() {
  float cut = floor(vPat.x / 10.0 + 0.01); float id = vPat.x - cut * 10.0;
  float cd = cutDist(cut);
  if (cd < 0.0) discard;
  vec3 V = safeN(cameraPosition - vWP, vec3(0.0, 0.0, 1.0));
  vec3 N = safeN(vN, vec3(0.0, 1.0, 0.0));
  bool back = !gl_FrontFacing; if (back) N = -N;
  float f = clamp(dot(N, V), 0.0, 1.0);
  // interior hairlines, drawn in the surface's own coordinates
  vec2 cuv = vec2(vUV.x * vPat.y, vUV.y / max(vPat.z, 1e-3));
  vec2 dc = min(fwidth(cuv), vec2(2.0));
  vec2 pl = patternLines(id > 7.5 && id < 8.5 ? 6.0 : id, cuv, dc);
  vec3 pig = vPig; float seam = 0.0;
  if (id > 7.5 && id < 8.5) {                                 // the goldfinch's head: each area laid flat to a hard curved edge, a hairline between
    float th = (1.0 - vPat.w) * 3.14159265;                   // angle from the beak's base round the ball: 0 at the beak, pi at the nape
    float ph = min(vUV.x, 1.0 - vUV.x) * 6.2831853;           // 0 on the crown, pi under the chin
    float sp = sin(ph);
    // the vermilion mask: a rounded patch round the base of the beak, widest at the side (just past the eye), narrow on the forehead
    float fm = (0.66 + 0.4 * sp * sp + 0.1 * (1.0 - cos(ph))) - th;
    // the blue-black cap on the crown, and behind the ivory cheek its crescent coming down, a point at the throat
    float bw = 0.3 * sqrt(max(1.0 - ph * ph / 6.2, 0.0));
    float thB = 1.92 - 0.16 * cos(ph);                        // the cheek's back edge, a curve
    float fcap = min((0.72 + 0.14 * smoothstep(1.1, 2.0, th)) - ph, 2.5 - th);
    float fc = max(fcap, bw - abs(th - thB - bw));
    float am = max(fwidth(fm), 1e-5); float ac = max(fwidth(fc), 1e-5);
    float inM = smoothstep(-0.5 * am, 0.5 * am, fm); float inC = smoothstep(-0.5 * ac, 0.5 * ac, fc) * (1.0 - inM);
    pig = mix(mix(vPig, uInk, inC), uVerm, inM);
    seam = max(1.0 - smoothstep(0.7 * am, 1.4 * am, abs(fm)), (1.0 - smoothstep(0.7 * ac, 1.4 * ac, abs(fc))) * (1.0 - inM));
    pl.x *= 1.0 - 0.75 * inM;
  } else if (id > 2.5 && id < 3.5 && vPat.y > 1.5) {          // a barred ball (the owl's head, seen from behind): level bars of thin blue-black ruled across it
    float hgt = sin(vPat.w * 3.14159265) * cos(vUV.x * 6.2831853) * 0.5 * vPat.y;
    float ab = max(fwidth(hgt), 1e-5);
    float bar = smoothstep(0.25 - 0.5 * ab, 0.25 + 0.5 * ab, abs(fract(hgt) - 0.5));
    bar = mix(0.5, bar, 1.0 - smoothstep(0.2, 0.45, ab));     // bars under about 4 px keep their flat average
    pig = mix(vPig, mix(uInk, vPig, 0.2), bar);
    pl.x = 0.0;
  }
  // glaze: full pigment at the rim, the chalk ground showing where the form faces us
  float lum = dot(pig, vec3(0.3, 0.5, 0.2));                  // dark glazes are laid thicker: blue-black and deep green pale less
  vec3 col = mix(pig, uGround, uPale * mix(0.3, 1.0, smoothstep(0.03, 0.25, lum)) * f * sqrt(f));
  float sr = sqrt(max(1.0 - f * f, 0.0));
  col = mix(col, uInk, 0.3 * smoothstep(0.8333, 1.0, sr));
  col = mix(col, mix(pig, uInk, 0.6), pl.x * 0.9);
  col = mix(col, uInk, seam * 0.9);
  vec3 dotCol = uGround;
  if (id > 6.5) {                                             // orchard: about a third of the dots are vermilion fruit
    float row = floor(cuv.y); vec2 cell = vec2(floor(cuv.x + 0.5 * mod(row, 2.0)), row);
    float isFruit = step(0.62, fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453));
    float crispM = 1.0 - smoothstep(0.11, 0.25, max(dc.x, dc.y));
    dotCol = mix(mix(uGround, uVerm, 0.38), mix(uGround, uVerm, isFruit), crispM);
  }
  col = mix(col, dotCol, pl.y);
  // the streak: one hard ivory band, 5 degrees of lathe angle, upper left of the camera's bearing
  vec3 d = safeN(vAx, vec3(0.0, 1.0, 0.0));
  vec3 rt = safeN(cross(vec3(0.0, 1.0, 0.0), V), vec3(1.0, 0.0, 0.0));
  vec3 upv = cross(V, rt);
  float a = radians(uStreakDeg) + uWet * 0.04 * sin(uTime * 0.45 + d.x * 3.1 + d.z * 2.3);   // wet paint: the streak never quite sits still
  vec3 L = safeN(V * cos(a) - rt * sin(a) + upv * 0.42, V);
  vec3 nP = N - d * dot(N, d); vec3 lP = L - d * dot(L, d);
  float ln = length(nP); float ll = length(lP);
  float ay = dot(cross(lP, nP), d); float ax = dot(nP, lP);
  float ang = atan(ay, ax + step(abs(ax) + abs(ay), 1e-6) * 1e-5);
  float aa = clamp(fwidth(ang), 1e-4, 0.2);
  float hw = max(radians(2.5), 0.75 * aa);
  float band = 1.0 - smoothstep(hw - 0.5 * aa, hw + 0.5 * aa, abs(ang));
  band *= smoothstep(0.2, 0.35, ln) * smoothstep(0.2, 0.35, ll);
  band *= 1.0 - smoothstep(0.06, 0.16, aa);                    // a form under ~30 px across keeps its flat average: no streak
  float t = vPat.w;
  float env = smoothstep(0.04, 0.16, t) * (1.0 - smoothstep(0.84, 0.96, t));
  float dash = 0.5 + 0.5 * sin(t * 300.0 + uWet * 1.6 * sin(uTime * 0.6 + vWP.y * 0.13 + vWP.x * 0.07));
  band *= smoothstep(dash - 0.04, dash + 0.04, env * 1.08) * step(0.001, env);
  if (back) {
    band = 0.0;
    if (cut > 1.5 && cut < 2.5) col = uInk;                                      // inside the globe: thin blue-black
    else if (cut < 2.5) col = mix(col, uInk, uBackDark);                         // inside the skirt: deeper glaze
  }
  col = mix(col, uGround, band);
  // a hairline round every true opening
  float cw = max(fwidth(cd), 1e-4) * 1.6;
  float rimL = (1.0 - smoothstep(0.6 * cw, cw, cd)) * step(0.5, cut);
  #ifdef GLASS
    rimL *= 1.0 - 0.55 * uInTube;
  #endif
  col = mix(col, uInk, rimL);
  #ifdef GLASS
    // seen from inside, the great tube is clear glass: thin where the wall is beside us, gathering to full azurite down the bore;
    // every joint, vein, dot and the streak stay as painted on it
    float ga = mix(0.96, 0.3, smoothstep(0.08, 0.42, f));
    // (outside review, round 5) no veil at the lens: within a few metres of the eye the glass is all but clear and only what is
    // painted on it shows; it takes its azurite again with distance down the bore
    // (the last metres at each mouth keep theirs, so the ring we fly out through is whole)
    float lipS = min(vUV.y, uTubeLen - vUV.y);
    ga *= mix(0.16, 1.0, max(smoothstep(6.0, 42.0, length(vWP - cameraPosition)), 1.0 - smoothstep(2.5, 6.0, lipS)));
    // inside the skirt there is only its scaled wall beyond the glass: there the wall keeps most of its azurite and the round ports do the showing
    ga = max(ga, 0.8 * smoothstep(uPierce.x - 5.0, uPierce.x + 5.0, vUV.y) * (1.0 - smoothstep(uPierce.y - 5.0, uPierce.y + 5.0, vUV.y)));
    float keep = max(max(pl.x, pl.y) * mix(1.0, 0.4, smoothstep(0.1, 0.4, f)), max(band, rimL));   // the fine veins and touches thin with the glass beside us; joints, streak and port rims stay
    gl_FragColor = vec4(col, mix(1.0, max(ga, keep), uInTube));
  #else
    gl_FragColor = vec4(col, 1.0);
  #endif
}`;

export const HULL_VERT = /* glsl */`
attribute vec3 aPig; attribute vec3 aAxis; attribute vec2 aUV; attribute vec4 aPat;
uniform vec2 uRes; uniform vec2 uOff; uniform float uPush; uniform vec2 uBack;
${STYLE_VARY}
void main() {
  mat4 M = modelMatrix;
  #ifdef USE_INSTANCING
    M = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = M * vec4(position, 1.0);
  vWP = wp.xyz; vN = mat3(M) * normal; vAx = aAxis; vUV = aUV; vPat = aPat; vPig = aPig;
  vec3 ray = wp.xyz - cameraPosition; float rl = max(length(ray), 1e-3);
  vec4 cp = projectionMatrix * viewMatrix * vec4(wp.xyz + ray / rl * (uBack.x + uBack.y * rl), 1.0);   // sink the hull along the view ray: same pixel, a little deeper
  vec3 nv = mat3(viewMatrix) * vN;
  vec2 dir = nv.xy * vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
  float l = length(dir);
  dir = dir / max(l, 1e-4) * min(1.0, l / max(0.3 * length(nv), 1e-4));
  float px = max(0.0015 * uRes.y, 1.5) * uPush;            // 0.15 % of buffer height, never under 1.5 px
  cp.xy += (dir * px + uOff) * 2.0 / uRes * cp.w;
  gl_Position = cp;
}`;

export const HULL_FRAG = /* glsl */`
${STYLE_GLSL}
uniform float uGhost;
void main() {
  float cut = floor(vPat.x / 10.0 + 0.01);
  if (cutDist(cut) < 0.0) discard;
  if (cut > 2.5 && uInTube > 0.9) discard;                    // from inside the glass tube its outer contour is not drawn
  gl_FragColor = vec4(mix(uInk, uGround, uGhost), 1.0);
}`;

// Glaze: the one unlit material for every form. opts.side (default DoubleSide so true openings show
// the inside), opts.backDark (extra blue-black on inner faces, default 0.14).
export function glazeMaterial(U, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uBackDark: { value: opts.backDark ?? 0.14 }, uPale: { value: opts.pale ?? 0.55 } },
    vertexShader: GLAZE_VERT, fragmentShader: GLAZE_FRAG, side: opts.side ?? THREE.DoubleSide,
    ...(opts.glass ? { defines: { GLASS: 1 }, transparent: true, depthWrite: true } : {}),
  });
}
// Contour: draw the SAME geometry a second time with this (inverted hull, pushed out in clip space).
// opts.ghost = true gives the paler second contour of the underdrawing, a hand's breadth off.
export function hullMaterial(U, opts = {}) {
  const g = !!opts.ghost;
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uOff: { value: new THREE.Vector2(g ? 3.5 : 0, g ? 3 : 0) }, uPush: { value: opts.push ?? 1 }, uGhost: { value: g ? 0.45 : 0 }, uBack: { value: new THREE.Vector2(g ? 0.5 : 0.05, g ? 0.008 : 0.002) } },
    vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, side: THREE.BackSide,
  });
}
// Keeps uRes equal to the size of whatever buffer is being drawn into (screen or a portal's target).
// Call it on one mesh that is always drawn (it only writes a uniform; nothing is compiled).
const _sz = new THREE.Vector2();
export function trackResolution(mesh, U) {
  mesh.onBeforeRender = (renderer) => {
    const rt = renderer.getRenderTarget();
    if (rt) U.uRes.value.set(rt.width, rt.height); else { renderer.getDrawingBufferSize(_sz); U.uRes.value.copy(_sz); }
  };
}

// Pearls, seeds, eyes: single dots laid last. Instanced camera-facing discs: geometry = one quad
// (position.xy in -1..1), instance attribute aDot vec4 (centre xyz, radius m), aTint vec3 (rim glaze).
export function dotMaterial(U, opts = {}) {                // opts.solid 0..1: the dot keeps its own pigment (seeds, eyes, berries)
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uSolid: { value: opts.solid ?? 0 } },
    vertexShader: /* glsl */`
      attribute vec4 aDot; attribute vec3 aTint; uniform vec2 uRes; uniform float uEve;
      varying vec2 vQ; varying vec3 vTint; varying float vPx;
      void main() {
        vec4 mv = viewMatrix * modelMatrix * vec4(aDot.xyz, 1.0);
        float sc = length(modelMatrix[0].xyz);
        float r = abs(aDot.w) * sc * mix(1.0, smoothstep(0.1, 0.85, uEve), step(aDot.w, -1e-5));   // a negative radius marks a pearl that opens as the day turns (uEve)
        float pxm = projectionMatrix[1][1] * uRes.y * 0.5 / max(-mv.z, 0.1);   // pixels per metre here
        vPx = r * pxm;
        mv.xy += position.xy * r;
        vQ = position.xy; vTint = aTint;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGround; uniform vec3 uInk; uniform float uSolid; varying vec2 vQ; varying vec3 vTint; varying float vPx;
      void main() {
        float r = length(vQ); if (r > 1.0) discard;
        float lw = clamp(1.6 / max(vPx, 1.0), 0.05, 0.45);            // hairline, ~1.6 px
        vec3 col = mix(uGround, vTint, mix(0.5 * smoothstep(0.35, 1.0, r), 0.6 + 0.4 * smoothstep(0.2, 1.0, r), uSolid));
        float hl = length(vQ - vec2(-0.32, 0.36));                     // the one touch of pure ground, upper left
        col = mix(col, uGround, 1.0 - smoothstep(0.16, 0.24, hl));
        col = mix(col, uInk, smoothstep(1.0 - lw, 1.0 - 0.5 * lw, r) * 0.9);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// Bubbles and films: a camera-facing hairline ring, one streak arc and a 6 % ivory fill, blended, drawn last.
// Instanced quad; aBub vec4 (base xyz, radius), aRise vec4 (phase, rise speed m/s, rise height m, wobble m).
export function bubbleMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aBub; attribute vec4 aRise; uniform vec2 uRes; uniform float uTime; uniform float uEve;
      varying vec2 vQ; varying float vPx; varying float vLife;
      void main() {
        float h = max(aRise.z, 1e-3);
        float k = fract(aRise.x + uTime * aRise.y / h);
        float wob = abs(aRise.w);                                // a negative wobble marks a bubble of the evening rise: it swells out of nothing as the day turns (uEve)
        vec3 c = aBub.xyz + vec3(sin(k * 9.0 + aRise.x * 40.0) * wob, k * h, cos(k * 7.0 + aRise.x * 23.0) * wob);
        vLife = smoothstep(0.0, 0.08, k) * (1.0 - smoothstep(0.9, 1.0, k));
        vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.0);
        float r = aBub.w * length(modelMatrix[0].xyz) * (0.55 + 0.45 * k) * mix(1.0, smoothstep(0.35, 0.95, uEve), step(aRise.w, -1e-4));
        vPx = r * projectionMatrix[1][1] * uRes.y * 0.5 / max(-mv.z, 0.1);
        mv.xy += position.xy * r; vQ = position.xy;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGround; uniform vec3 uInk; varying vec2 vQ; varying float vPx; varying float vLife;
      void main() {
        float r = length(vQ); if (r > 1.0) discard;
        float lw = clamp(1.6 / max(vPx, 1.0), 0.02, 0.5);
        float ring = smoothstep(1.0 - lw, 1.0 - 0.5 * lw, r);
        float ang = atan(vQ.y, vQ.x - 1e-4 * step(abs(vQ.x) + abs(vQ.y), 1e-5));
        float arc = (1.0 - smoothstep(0.03, 0.05, abs(r - 0.74))) * (1.0 - smoothstep(0.45, 0.5, abs(ang - 2.3)));
        vec3 col = mix(uGround, uInk, ring * (1.0 - arc));
        float al = max(max(ring * 0.9, arc), 0.07 + 0.2 * r * r * r * r) * vLife;   // the film gathers toward its rim, so a bubble is a glass ball and not a bare ring
        gl_FragColor = vec4(col, al);
      }`,
  });
}

// Jets, stalks, skeins: ribbons that face the camera and never thin below 1.5 px.
// Attributes: position (on the centre line), aTan vec3 (tangent), aRib vec3 (side -1/+1, t along 0..1, width m).
export function ribbonMaterial(U, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uCol: { value: new THREE.Color(opts.color ?? PALETTE[4]) }, uFlow: { value: opts.flow ?? 0 }, uSway: { value: opts.sway ?? 0 } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aTan; attribute vec3 aRib; uniform vec2 uRes; uniform float uTime; uniform float uSway;
      varying vec2 vR; varying float vPxW;
      void main() {
        vec3 p = position;
        p.xz += uSway * aRib.y * aRib.y * vec2(sin(uTime * 1.3 + p.y * 0.2), cos(uTime * 1.1 + p.y * 0.17));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec3 tv = mat3(modelViewMatrix) * aTan;
        vec2 perp = vec2(-tv.y, tv.x); float l = length(perp);
        perp = l > 1e-5 ? perp / l : vec2(1.0, 0.0);
        float pxm = projectionMatrix[1][1] * uRes.y * 0.5 / max(-mv.z, 0.1);
        float w = max(aRib.z * length(modelMatrix[0].xyz), 1.6 / pxm);
        vPxW = w * pxm;
        mv.xy += perp * aRib.x * w * 0.5;
        vR = aRib.xy;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGround; uniform vec3 uInk; uniform vec3 uCol; uniform float uTime; uniform float uFlow;
      varying vec2 vR; varying float vPxW;
      void main() {
        // falling water breaks into dashes toward its end; the dashes run down with uFlow
        float t = vR.y;
        float dash = 0.5 + 0.5 * sin(t * 70.0 - uTime * uFlow);
        float gate = uFlow > 0.0 ? smoothstep(dash - 0.05, dash + 0.05, 1.25 - t * 1.1) : 1.0;
        if (gate < 0.5) discard;
        float e = abs(vR.x);
        float lw = clamp(1.5 / max(vPxW, 1.0), 0.02, 0.6);
        vec3 col = mix(uCol, uInk, step(3.5, vPxW) * smoothstep(1.0 - lw, 1.0 - 0.5 * lw, e) * 0.8);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------
// 3. FORMS. Everything is a loft (rings round a spine) so that every vertex knows its axis, its
//    turn round it and its place along the profile: that is what the streak and the ruled rows need.
// ---------------------------------------------------------------------------------------------
const V3 = THREE.Vector3;
const _a = new V3(), _b = new V3(), _c = new V3();

export class FormBuilder {
  constructor() { this.pos = []; this.nor = []; this.pig = []; this.axis = []; this.uv = []; this.pat = []; this.idx = []; this.ghost = []; this.bone = []; this.useBones = false; }
  // rings: [{ c: Vector3 centre, r: radius, rz?: second radius (flattened section) }], in final local space.
  // o: { segs, pig: THREE.Color, pat: PAT.x, cells: cells per turn, row: row height m, cut: 0..3,
  //      ref: Vector3 (which way angle 0 of the section points; default +X or +Z), ghost: bool, uv0: start arc }
  loft(rings, o = {}) {
    const segs = o.segs ?? 12, n = rings.length, base = this.pos.length / 3;
    const pig = o.pig, patId = (o.pat ?? 0) + 10 * (o.cut ?? 0), cells = o.cells ?? 1, row = o.row ?? 1;
    // tangents and parallel-transported frames
    const T = [], S = [];
    for (let i = 0; i < n; i++) {
      const p0 = rings[Math.max(0, i - 1)].c, p1 = rings[Math.min(n - 1, i + 1)].c;
      const t = rings[i].t ? rings[i].t.clone() : new V3().subVectors(p1, p0); if (t.lengthSq() < 1e-10) t.set(0, 1, 0); T.push(t.normalize());
    }
    const ref = o.ref ? o.ref.clone() : (Math.abs(T[0].y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0));
    let side = ref.clone().addScaledVector(T[0], -ref.dot(T[0])); if (side.lengthSq() < 1e-8) side.set(0, 0, 1); side.normalize();
    for (let i = 0; i < n; i++) {
      side = side.clone().addScaledVector(T[i], -side.dot(T[i])).normalize(); S.push(side);
    }
    // arc length of the profile (centre movement and change of radius)
    const arc = [o.uv0 ?? 0];
    for (let i = 1; i < n; i++) arc.push(arc[i - 1] + Math.hypot(rings[i].c.distanceTo(rings[i - 1].c), o.flatArc ? 0 : rings[i].r - rings[i - 1].r));
    const a0 = arc[0], total = Math.max(arc[n - 1] - a0, 1e-6);
    const P = this.pos, W = segs + 1;
    for (let i = 0; i < n; i++) {
      const R = rings[i], t = T[i], s = S[i], u2 = _a.crossVectors(t, s), rz = R.rz ?? R.r;
      for (let j = 0; j <= segs; j++) {
        const a = (j / segs) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        P.push(R.c.x + s.x * ca * R.r + u2.x * sa * rz, R.c.y + s.y * ca * R.r + u2.y * sa * rz, R.c.z + s.z * ca * R.r + u2.z * sa * rz);
        // o.paint(t along 0..1, turn 0..1, ring index) -> Color or null: regions painted on one form (a mask, a cap, a wing bar)
        const pg = (o.paint && o.paint((arc[i] - a0) / total, j / segs, i)) || R.pig || pig;
        this.axis.push(t.x, t.y, t.z); this.pig.push(pg.r, pg.g, pg.b);
        this.uv.push(j / segs, arc[i]); this.pat.push(patId, cells, row, (arc[i] - a0) / total);
        // o.bone: joint index for vertex-shader bending (0 = none); o.boneW(t) -> weight 0..1 along the form
        this.bone.push(o.bone ?? 0, o.bone ? (o.boneW ? o.boneW((arc[i] - a0) / total) : 1) : 0);
      }
    }
    // smooth normals from the grid itself
    const at = (i, j, out) => { const k = (base + i * W + j) * 3; return out.set(P[k], P[k + 1], P[k + 2]); };
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), t = T[i], s = S[i], u2 = new V3().crossVectors(t, s);
      for (let j = 0; j <= segs; j++) {
        const j0 = (j - 1 + segs) % segs, j1 = (j + 1) % segs;
        at(i, j1, _a).sub(at(i, j0, _b)); at(i1, j, _b).sub(at(i0, j, _c));
        const nn = new V3().crossVectors(_a, _b);
        if (nn.lengthSq() < 1e-12) {                       // a pole: point along the spine
          nn.copy(t).multiplyScalar(i < n / 2 ? -1 : 1);
        } else {
          nn.normalize();
        }
        this.nor.push(nn.x, nn.y, nn.z);
      }
    }
    const tgt = o.ghost ? [this.idx, this.ghost] : [this.idx];
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) {
      const a = base + i * W + j, b = a + 1, c = a + W, d = c + 1;
      for (const ix of tgt) ix.push(a, b, c, b, d, c);
    }
    return this;
  }
  // lathe: profile [[r, y], ...] turned round an axis. o.m (Matrix4) places it; o.smooth resamples it.
  lathe(profile, o = {}) {
    const pts = o.smooth ? smoothProfile(profile, o.smooth) : profile;
    const rings = pts.map(([r, y]) => { const c = new V3(0, y, 0); if (o.m) c.applyMatrix4(o.m); return { c, r: Math.max(r, 0) * (o.scale ?? 1) }; });
    let ref = new V3(0, 0, 1); if (o.m) ref.transformDirection(o.m);
    return this.loft(rings, { ...o, ref });
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aPig', new THREE.Float32BufferAttribute(this.pig, 3));
    g.setAttribute('aAxis', new THREE.Float32BufferAttribute(this.axis, 3));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aPat', new THREE.Float32BufferAttribute(this.pat, 4));
    if (this.useBones) g.setAttribute('aBone', new THREE.Float32BufferAttribute(this.bone, 2));
    g.setIndex(this.idx);
    return g;
  }
  // the forms flagged ghost, as a second geometry sharing the same buffers (for the underdrawing contour)
  ghostGeometry(g) {
    const h = new THREE.BufferGeometry();
    for (const k of ['position', 'normal', 'aPig', 'aAxis', 'aUV', 'aPat']) h.setAttribute(k, g.getAttribute(k));
    h.setIndex(this.ghost.length ? this.ghost : [0, 0, 0]);
    return h;
  }
}

// Catmull-Rom through [r, y] control points, n samples per span: blown glass, no corners.
export function smoothProfile(pts, n = 4) {
  const out = [], N = pts.length;
  for (let i = 0; i < N - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(N - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([Math.max(0, f(p0[0], p1[0], p2[0], p3[0])), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[N - 1].slice());
  return out;
}

// A thorn: a slim curved cone from `base` along `dir`, bending toward `bend`, with a swollen foot.
export function thorn(fb, base, dir, len, rad, o = {}) {
  const rings = [], n = o.rings ?? 5, bend = o.bend ?? null, k = o.curl ?? 0.25;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), c = new V3().copy(base).addScaledVector(dir, len * t);
    if (bend) c.addScaledVector(bend, len * k * t * t);
    const r = i === 0 ? rad * 1.35 : rad * Math.pow(1 - t, 0.8) * (1 - 0.25 * Math.exp(-((t - 0.12) ** 2) * 90));
    rings.push({ c, r: i === n - 1 ? 0 : r });
  }
  fb.loft(rings, { segs: o.segs ?? 5, pig: o.pig, pat: PAT.plain, ghost: o.ghost });
}

// ---------------------------------------------------------------------------------------------
// 4. THE FOUNTAIN
// ---------------------------------------------------------------------------------------------
// the great tube's axis, low mouth to far mouth. (Outside review, round 5: the tube used to pierce the skirt at x -34, and the
// flight into it ran along the scale wall. It now stands free on the lake, west of the fountain, 17 m clear of the skirt.)
const TUBE_A = new V3(-65.5, 16, -23), TUBE_B = new V3(-70, 36, 41);     // (it bears 4 degrees away from the fountain)
const GLOBE_C = new V3(0, 96, 0), GLOBE_R = 27;
const WIN_D = new V3(53, 0, 32).normalize();                             // the window looks east-north-east
const mixc = (a, b, t) => a.clone().lerp(b, t);

// skirt radius at height y (also used to find where the tube pierces it)
const SKIRT = [[45.5, -3], [46.6, 2], [48, 12], [48.4, 24], [48, 36], [46.2, 45], [42, 52], [34, 57.5], [24, 61], [17.5, 63.5]];
function skirtR(y) {
  for (let i = 0; i < SKIRT.length - 1; i++) { const a = SKIRT[i], b = SKIRT[i + 1]; if (y <= b[1]) { const t = Math.max(0, (y - a[1]) / (b[1] - a[1])); return a[0] + (b[0] - a[0]) * t; } }
  return SKIRT[SKIRT.length - 1][0];
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  const U = opts.uniforms ?? makeStyleUniforms(pal);
  const C = pal.map((h) => new THREE.Color(h));
  const blue = opts.colourway === 'blue';                    // the brief's blue colourway: fountain slate, tubes pink
  const body = blue ? C[1] : C[0], glass = blue ? C[0] : C[1], ink = C[6], ivory = C[4];
  const bodyDeep = mixc(body, ink, 0.3), glassDeep = mixc(glass, ink, 0.3), bodyThin = mixc(body, ivory, 0.3);
  const fb = new FormBuilder();
  const dots = [];                                           // [x, y, z, radius, r, g, b]
  const tubeOn = opts.tube !== false, tdir0 = new V3().subVectors(TUBE_B, TUBE_A).normalize(), tlen0 = TUBE_A.distanceTo(TUBE_B);
  // where the tube's axis crosses the skirt (nowhere, since it was moved clear: then no bore is cut and no hoop thorn is left out)
  const pierce = [];
  if (tubeOn) { let prev = null; for (let s = 0; s <= tlen0; s += 0.5) { _a.copy(TUBE_A).addScaledVector(tdir0, s); const inside = Math.hypot(_a.x, _a.z) < skirtR(_a.y); if (prev !== null && inside !== prev) pierce.push(s); prev = inside; } }
  const pierces = pierce.length === 2;
  const dot = (p, r, tint) => {
    if (tubeOn && r < 1) { _b.subVectors(p, TUBE_A); const al = _b.dot(tdir0); if (al > -2 && al < tlen0 + 2 && _b.addScaledVector(tdir0, -al).length() < 7.9) return; }   // nothing inside the bore
    dots.push(p.x, p.y, p.z, r, tint.r, tint.g, tint.b);
  };
  const group = new THREE.Group(); group.name = 'lake-of-pink-fountains';

  // per-seed variety (drawn first, in a fixed order)
  const seed = {
    spireBulbs: rng.int(3, 5), collarThorns: 24, thornLen: rng.range(11, 15), thornCurl: rng.range(0.15, 0.45),
    petalCurl: rng.range(0.25, 0.6), petalTwist: rng.range(-0.12, 0.12), hoopA: rng.range(9, 14), hoopB: rng.range(40, 45),
    tubeAz: [Math.PI + rng.range(-0.18, 0.18), Math.PI * 1.62 + rng.range(-0.15, 0.15), Math.PI * 0.78 + rng.range(-0.1, 0.12)],
    tubeLat: [rng.range(-0.3, -0.05), rng.range(-0.05, 0.25), rng.range(-0.35, -0.12)],
    tubeLen: [rng.range(15, 20), rng.range(13, 18), rng.range(12, 16)],
    finialTilt: rng.range(0.7, 1.0), finialLen: rng.range(13, 17), finialAz: rng.range(0, Math.PI / 2),
    crescentTop: rng.chance(0.6), ghostPhase: rng.int(0, 5),
    petalLen: Array.from({ length: 12 }, () => rng.range(0.9, 1.04)), hoopThorns: rng.pick([28, 32, 36]),
  };
  let formCount = seed.ghostPhase;
  const ghostNext = () => (formCount++ % 6) === 0;           // one form in six shows its underdrawing

  // --- skirt: a swelling gourd, ruled rows of scales, veined in darker pink ---
  {
    const prof = smoothProfile(SKIRT, 5);
    // three bands, broken at the hoops: fluted foot, scaled belly, feathered shoulder
    const iA = prof.findIndex((q) => q[1] >= seed.hoopA), iB = prof.findIndex((q) => q[1] >= seed.hoopB);
    fb.lathe(prof.slice(0, iA + 1), { segs: 96, pig: body, pat: PAT.veins, cells: 84, row: 1, cut: 1 });
    await ctx.yield();
    fb.lathe(prof.slice(iA, iB + 1), { segs: 96, pig: body, pat: PAT.scales, cells: 126, row: 2.1, cut: 1 });
    await ctx.yield();
    fb.lathe(prof.slice(iB), { segs: 96, pig: body, pat: PAT.scallops, cells: 104, row: 2.6, cut: 1 });
    await ctx.yield();
    // two raised hoops and the foot roll: joints, never a bare curve
    for (const [y, rr, pg] of [[seed.hoopA, 1.3, bodyDeep], [seed.hoopB, 1.1, bodyDeep], [0.4, 1.7, bodyThin]]) {
      const R = skirtR(y) + rr * 0.35, ring = [];
      for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI; ring.push([R + Math.sin(a) * rr, y - Math.cos(a) * rr * 1.1]); }
      fb.lathe(ring, { segs: 72, pig: pg, pat: PAT.rings, cells: 1, row: 0.9, cut: 1 });
      const np = Math.round((Math.PI * 2 * (R + rr)) / (y < 1 ? 1.75 : 1.5));
      if (y === seed.hoopB) for (let i = 0; i < seed.hoopThorns; i++) {
        const a = (i / seed.hoopThorns) * Math.PI * 2, o = new V3(Math.sin(a), 0, Math.cos(a));
        const b0 = new V3().copy(o).multiplyScalar(R + rr * 0.8).setY(y + 0.5);
        const gap = Math.hypot(b0.x + 34, 0) < 11 && Math.abs(b0.z) < 46;      // where the great tube's collars used to be
        if (gap && pierces) continue;
        thorn(fb, b0, new V3().copy(o).setY(0.25).normalize(), i % 2 ? 4.2 : 7, 0.7, { bend: new V3(0, 1, 0), curl: 0.4, pig: bodyDeep, ghost: gap ? false : ghostNext() });
      }
      for (let i = 0; i < np; i++) { const a = (i / np) * Math.PI * 2; dot(new V3(Math.sin(a) * (R + rr + 0.3), y + (y < 1 ? 0.5 : 0), Math.cos(a) * (R + rr + 0.3)), y < 1 ? 0.75 : 0.5, body); }
    }
  }
  await ctx.yield();

  // --- neck collar and its 24 thorns ---
  {
    fb.lathe([[17.5, 63.2], [19.5, 64.2], [20.2, 65.6], [18.6, 67], [15.5, 67.8], [14.2, 69.5], [15.2, 71]], { smooth: 3, segs: 48, pig: bodyDeep, pat: PAT.rings, cells: 1, row: 1.1, ghost: ghostNext() });
    const n = seed.collarThorns;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, out = new V3(Math.sin(a), 0, Math.cos(a));
      const len = seed.thornLen * (i % 2 ? 0.72 : 1);
      thorn(fb, new V3().copy(out).multiplyScalar(19.6).setY(65.6), new V3().copy(out).setY(i % 2 ? 0.35 : 0.1).normalize(), len, 1.0, { bend: new V3(0, 1, 0), curl: seed.thornCurl, pig: bodyDeep, rings: 7, segs: 6, ghost: ghostNext() });
      dot(new V3().copy(out).multiplyScalar(20.6).setY(64.4), 0.42, body);
    }
  }
  await ctx.yield();

  // --- calyx: twelve toothed petals, 30 m long, cupping the globe ---
  {
    const Rp = GLOBE_R + 1.2;
    for (let k = 0; k < 12; k++) {
      const az = (k / 12) * Math.PI * 2 + Math.atan2(WIN_D.x, WIN_D.z) + Math.PI / 12, rings = [], N = 36;
      const nearWin = k === 0 || k === 11, lenK = nearWin ? 0.6 : seed.petalLen[k];
      for (let i = 0; i <= N; i++) {
        const t = i / N, th = 0.5 + t * 1.08 * lenK;                         // polar angle from the bottom pole
        const curl = seed.petalCurl * Math.max(0, t - 0.62) * Math.max(0, t - 0.62) * 60;   // tips lean out
        const rr = Rp + curl + 1.2 * Math.sin(t * Math.PI), a2 = az + seed.petalTwist * t;
        const c = new V3(Math.sin(a2) * Math.sin(th) * rr, GLOBE_C.y - Math.cos(th) * rr, Math.cos(a2) * Math.sin(th) * rr);
        const wEnv = Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.88)), 0.75) * (1 - 0.35 * t);
        const tooth = 1 + 0.34 * (((t * 9) % 1) - 0.5) * (t > 0.1 ? 1 : 0);
        const w = i === N ? 0 : 7.4 * wEnv * tooth;
        rings.push({ c, r: w, rz: i === N ? 0 : Math.min(0.9, 0.2 + w * 0.12) });
      }
      const tang = new V3(Math.cos(az), 0, -Math.sin(az));
      fb.loft(rings, { segs: 8, pig: k % 2 ? body : bodyThin, pat: PAT.veins, cells: 6, row: 1, ref: tang, ghost: ghostNext() });
    }
  }
  await ctx.yield();

  // --- globe: 54 m across, scaled, pearled along every seam, cut by the window ---
  const winC = new V3().copy(GLOBE_C).addScaledVector(WIN_D, GLOBE_R);
  {
    const prof = [];
    for (let i = 0; i <= 44; i++) { const th = 0.44 + (i / 44) * (Math.PI - 0.22 - 0.44); prof.push([GLOBE_R * Math.sin(th), GLOBE_C.y - GLOBE_R * Math.cos(th)]); }
    fb.lathe(prof, { segs: 84, pig: body, pat: PAT.scales, cells: 88, row: 1.75, cut: 2 });
    const lin = [];                                          // a dark liner, so the window shows only thin blue-black
    for (let i = 0; i <= 14; i++) { const th = 0.5 + (i / 14) * (Math.PI - 0.3 - 0.5); lin.push([(GLOBE_R - 0.9) * Math.sin(th), GLOBE_C.y - (GLOBE_R - 0.9) * Math.cos(th)]); }
    fb.lathe(lin, { segs: 32, pig: ink, pat: PAT.plain, cut: 2 });
    const pearl = (th, az, r) => {
      const d = new V3(Math.sin(az) * Math.sin(th), -Math.cos(th), Math.cos(az) * Math.sin(th));
      const along = d.dot(WIN_D); if (along > 0 && Math.sqrt(Math.max(0, 1 - along * along)) * GLOBE_R < 10.4) return;
      dot(new V3().copy(GLOBE_C).addScaledVector(d, GLOBE_R + r * 0.45), r, body);
    };
    for (let m = 0; m < 8; m++) for (let i = 0; i < 50; i++) pearl(0.72 + (i / 50) * 2.16, (m / 8) * Math.PI * 2 + 0.39, 0.4);
    for (const [th, n] of [[1.97, 136], [2.56, 80]]) for (let i = 0; i < n; i++) pearl(th, (i / n) * Math.PI * 2, 0.4);
    // globe-top collar under the spire
    fb.lathe([[5.6, 121.6], [7.6, 122.4], [8.1, 123.5], [6.4, 124.5], [4.4, 125]], { smooth: 3, segs: 32, pig: bodyDeep, pat: PAT.rings, cells: 1, row: 0.8, ghost: ghostNext() });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, o = new V3(Math.sin(a), 0, Math.cos(a)); thorn(fb, new V3().copy(o).multiplyScalar(7.7).setY(123.4), new V3().copy(o).setY(0.3).normalize(), i % 2 ? 3.2 : 5, 0.45, { bend: new V3(0, 1, 0), curl: 0.35, pig: bodyDeep }); }
  }
  await ctx.yield();

  // --- the window: a round hole 15 m wide in a toothed, pearled collar ---
  const winUp = new V3(0, 1, 0), winLeft = new V3().crossVectors(winUp, new V3().copy(WIN_D).negate()).normalize();   // left as seen flying in
  {
    const Rr = 8.65, cen = new V3().copy(GLOBE_C).addScaledVector(WIN_D, Math.sqrt(GLOBE_R * GLOBE_R - Rr * Rr) + 0.35);
    const ring = [], N = 56, e1 = winLeft, e2 = winUp;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2, c = new V3().copy(cen).addScaledVector(e1, Math.cos(a) * Rr).addScaledVector(e2, Math.sin(a) * Rr);
      ring.push({ c, r: 1.2, rz: 1.45, t: new V3().copy(e1).multiplyScalar(-Math.sin(a)).addScaledVector(e2, Math.cos(a)) });
    }
    fb.loft(ring, { segs: 12, pig: bodyDeep, pat: PAT.rings, cells: 1, row: 1.23, ref: WIN_D, ghost: true });
    const nt = 22;
    for (let i = 0; i < nt; i++) {
      const a = ((i + 0.5) / nt) * Math.PI * 2, rad = new V3().copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
      const base = new V3().copy(cen).addScaledVector(rad, Rr + 0.7).addScaledVector(WIN_D, 0.5);
      thorn(fb, base, new V3().copy(rad).addScaledVector(WIN_D, 0.55).normalize(), i % 2 ? 2.6 : 4.2, 0.55, { bend: WIN_D, curl: 0.3, pig: bodyDeep, rings: 6 });
      const a2 = (i / nt) * Math.PI * 2, r2 = new V3().copy(e1).multiplyScalar(Math.cos(a2)).addScaledVector(e2, Math.sin(a2));
      dot(new V3().copy(cen).addScaledVector(r2, Rr).addScaledVector(WIN_D, 1.55), 0.46, body);
    }
    // a second ruled ring of single pearls on the globe just outside the thorn bases: it opens as the day turns (negative
    // radius: grown by scale on uEve in the dot's vertex shader; nothing in the forenoon)
    const np2 = 40, rho = 11.7, cph = Math.sqrt(1 - (rho / GLOBE_R) * (rho / GLOBE_R));
    for (let i = 0; i < np2; i++) {
      const a = (i / np2) * Math.PI * 2, rad = new V3().copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
      const d = new V3().copy(WIN_D).multiplyScalar(cph).addScaledVector(rad, rho / GLOBE_R);
      dot(new V3().copy(GLOBE_C).addScaledVector(d, GLOBE_R + 0.3), -0.56, body);
    }
  }
  await ctx.yield();

  // --- three slate-blue tubes let into the globe through thorned collars, each leaking a thin jet ---
  const jets = [], bubbleSeats = [];
  for (let k = 0; k < 3; k++) {
    const az = seed.tubeAz[k], lat = seed.tubeLat[k], len = seed.tubeLen[k];
    const d = new V3(Math.sin(az) * Math.cos(lat), Math.sin(lat), Math.cos(az) * Math.cos(lat));
    const base = new V3().copy(GLOBE_C).addScaledVector(d, GLOBE_R - 0.4), rings = [], N = 22;
    const spine = (t) => new V3().copy(base).addScaledVector(d, (len + 0.4) * t).add(new V3(0, -len * 0.2 * t * t, 0));
    for (let i = 0; i <= N; i++) {
      const t = i / N, flare = Math.exp(-((1 - t) * (1 - t)) * 60) * 1.25, jq = ((t * 4) % 1) - 0.5, joint = 0.22 * Math.exp(-jq * jq * 40);
      rings.push({ c: spine(t), r: 2.25 - 0.55 * t + flare + joint });
    }
    fb.loft(rings, { segs: 16, pig: glass, pat: PAT.rings, cells: 1, row: 2.2, ghost: ghostNext() });
    // collar where it enters the globe
    const m = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d)).setPosition(new V3().copy(GLOBE_C).addScaledVector(d, GLOBE_R - 0.6));
    fb.lathe([[3.0, -0.6], [4.5, 0.2], [4.9, 1.3], [3.9, 2.3], [2.9, 2.8], [2.5, 3.6]], { smooth: 3, segs: 20, pig: bodyDeep, pat: PAT.rings, cells: 1, row: 0.8, m, ghost: ghostNext() });
    const e1 = new V3(0, 1, 0).cross(d).normalize(), e2 = new V3().crossVectors(d, e1);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, rad = new V3().copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
      thorn(fb, new V3().copy(GLOBE_C).addScaledVector(d, GLOBE_R + 0.6).addScaledVector(rad, 4.6), new V3().copy(rad).addScaledVector(d, 0.7).normalize(), i % 2 ? 3 : 4.6, 0.5, { bend: d, curl: 0.3, pig: bodyDeep });
      const a2 = ((i + 0.5) / 10) * Math.PI * 2, r2 = new V3().copy(e1).multiplyScalar(Math.cos(a2)).addScaledVector(e2, Math.sin(a2));
      dot(new V3().copy(GLOBE_C).addScaledVector(d, GLOBE_R + 1.9).addScaledVector(r2, 4.3), 0.4, body);
    }
    const mouth = spine(1), vel = spine(1).sub(spine(0.96)).normalize();
    jets.push({ mouth: mouth.clone().add(new V3(0, -1.2, 0)), vel });
    bubbleSeats.push(mouth);
  }
  await ctx.yield();

  // --- four crescent finials on jointed stalks ---
  const crescent = (tip, e1, e2, R, pig, flat) => {          // horns up along e2, lying in the e1/e2 plane
    const rings = [], N = 18, cen = new V3().copy(tip).addScaledVector(e2, R);
    for (let i = 0; i <= N; i++) {
      const t = i / N, ph = (150 + 240 * t) * Math.PI / 180, w = Math.pow(Math.sin(Math.PI * t), 0.7);
      rings.push({ c: new V3().copy(cen).addScaledVector(e1, Math.cos(ph) * R).addScaledVector(e2, Math.sin(ph) * R), r: i === 0 || i === N ? 0 : R * 0.3 * w, rz: i === 0 || i === N ? 0 : R * 0.3 * w * flat });
    }
    fb.loft(rings, { segs: 8, pig, pat: PAT.plain, ref: e2, ghost: ghostNext() });
  };
  const finialTips = [];
  for (let k = 0; k < 4; k++) {
    const az = seed.finialAz + k * Math.PI / 2, out = new V3(Math.sin(az), 0, Math.cos(az)), tang = new V3(Math.cos(az), 0, -Math.sin(az));
    const base = new V3().copy(GLOBE_C).addScaledVector(out, GLOBE_R * Math.sin(0.62) - 0.4).add(new V3(0, GLOBE_R * Math.cos(0.62) - 0.4, 0));
    const d = new V3().copy(out).multiplyScalar(Math.sin(seed.finialTilt)).add(new V3(0, Math.cos(seed.finialTilt), 0)).normalize();
    const L = seed.finialLen, rings = [], N = 26;
    for (let i = 0; i <= N; i++) {
      const t = i / N, bulb = (c, w, h) => h * Math.exp(-((t - c) * (t - c)) / (w * w));
      const r = 0.42 + 1.5 * Math.exp(-t * t * 260) + bulb(0.3, 0.05, 1.25) + bulb(0.42, 0.018, 0.5) + bulb(0.66, 0.04, 0.9) + bulb(0.76, 0.016, 0.4) + bulb(0.97, 0.03, 0.5);
      rings.push({ c: new V3().copy(base).addScaledVector(d, L * t).add(new V3(0, L * 0.12 * t * t, 0)), r });
    }
    fb.loft(rings, { segs: 10, pig: k % 2 ? body : bodyDeep, pat: PAT.rings, cells: 1, row: 0.9, ghost: ghostNext() });
    const tip = rings[N].c; finialTips.push(tip.clone());
    crescent(tip, tang, new V3(0, 1, 0), 3.7, glass, 0.45);
    dot(new V3().copy(tip).add(new V3(0, 0.2, 0)), 0.6, body);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, rad = new V3().copy(tang).multiplyScalar(Math.cos(a)).addScaledVector(new V3().crossVectors(d, tang), Math.sin(a)); thorn(fb, new V3().copy(base).addScaledVector(d, L * 0.3).addScaledVector(rad, 1.3), new V3().copy(rad).addScaledVector(d, 0.5).normalize(), 2.6, 0.3, { bend: d, curl: 0.4, pig: bodyDeep, segs: 5, rings: 5 }); }
  }
  await ctx.yield();

  // --- spire of stacked bulbs, to y 140 ---
  {
    const nB = seed.spireBulbs, prof = [[4.2, 124.6]], necks = [];
    let y = 124.8; const top = seed.crescentTop ? 135.2 : 136.6, wsum = (1 - Math.pow(0.78, nB)) / (1 - 0.78);
    for (let b = 0; b < nB; b++) {
      const h = (top - 124.8) * Math.pow(0.78, b) / wsum, rb = 5.3 * Math.pow(0.7, b), neck = rb * 0.34;
      for (let i = 1; i <= 8; i++) { const s = i / 8; prof.push([neck + (rb - neck) * Math.pow(Math.sin(Math.PI * Math.min(0.999, s * 0.93 + 0.035)), 0.85), y + h * s]); }
      y += h; necks.push([y, neck, rb]);
    }
    if (seed.crescentTop) prof.push([0.34, y + 0.6], [0.24, 137.0], [0, 137.25]);
    else prof.push([0.34, y + 0.6], [0.2, 138.6], [0, 140]);
    fb.lathe(prof, { segs: 28, pig: body, pat: PAT.dots, cells: 16, row: 1.05, ghost: true });
    for (const [ny, neck, rb] of necks) for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + ny, o = new V3(Math.sin(a), 0, Math.cos(a));
      thorn(fb, new V3().copy(o).multiplyScalar(neck * 0.9).setY(ny), new V3().copy(o).setY(0.45).normalize(), rb * 0.95, 0.12 + rb * 0.05, { bend: new V3(0, 1, 0), curl: 0.4, pig: bodyDeep, segs: 5, rings: 5 });
      dot(new V3().copy(o).multiplyScalar(neck + 0.25).setY(ny - 0.1), 0.16 + rb * 0.035, body);
    }
    if (seed.crescentTop) crescent(new V3(0, 137.1, 0), new V3(Math.cos(seed.finialAz), 0, Math.sin(seed.finialAz)), new V3(0, 1, 0), 1.45, glass, 0.5);
  }
  await ctx.yield();

  // --- the great blue tube (free of the skirt now; pierce stays empty): one glass wall, true ports, thorned and pearled collars ---
  const tubeDir = new V3().subVectors(TUBE_B, TUBE_A), tubeLen = tubeDir.length(); tubeDir.normalize();
  const TUBE_R = 7.25, fbT = new FormBuilder();   // the tube's wall is its own mesh: blended glass when the eye is inside it
  if (opts.tube !== false) {
    const rings = [], offs = [0, 0.45, 0.95, 3, 5.05, 5.55];
    for (let s0 = -3; s0 < tubeLen + 6; s0 += 6) for (const o of offs) {
      const s = s0 + o; if (s < 0 || s > tubeLen) continue;
      const j = Math.abs((s % 6) - 3), bump = 0.42 * Math.exp(-j * j * 6);
      const lip = 1.25 * (Math.exp(-s * s / 2.2) + Math.exp(-(tubeLen - s) * (tubeLen - s) / 2.2));
      rings.push({ c: new V3().copy(TUBE_A).addScaledVector(tubeDir, s), r: TUBE_R + bump + lip, t: tubeDir });
    }
    rings.push({ c: TUBE_B.clone(), r: TUBE_R + 1.25, t: tubeDir });
    fbT.loft(rings, { segs: 32, pig: glass, pat: PAT.tube, cells: Math.PI * 2 * TUBE_R, row: 1, cut: 3, ref: new V3(1, 0, 0), flatArc: true });
    await ctx.yield();
    {
      const e1 = new V3(1, 0, 0), e2 = new V3().crossVectors(tubeDir, e1).normalize(), circ = Math.PI * 2 * TUBE_R;
      const inPort = (turn, s, pad) => { const k = Math.round((s - 4.5) / 9), dt = ((((turn - (k % 2 ? 1 / 6 : 0)) * 3 + 0.5) % 1 + 1) % 1) - 0.5; return Math.hypot(dt * circ / 3, s - 4.5 - 9 * k) < 3.3 + pad; };
      for (let s = 3; s < tubeLen - 2; s += 6) {
        const cen = new V3().copy(TUBE_A).addScaledVector(tubeDir, s);
        for (let i = 0; i < 24; i++) {
          const turn = (i + 0.5) / 24, a = turn * Math.PI * 2, rad = new V3().copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
          if (inPort(turn, s, 0.5)) continue;
          dot(new V3().copy(cen).addScaledVector(rad, TUBE_R - 0.02), 0.33, glass);
          if (s > 6 && s < tubeLen - 6) dot(new V3().copy(cen).addScaledVector(rad, TUBE_R + 0.62), 0.3, glass);
          if (i % 3 === 1) thorn(fb, new V3().copy(cen).addScaledVector(rad, TUBE_R + 0.3).addScaledVector(tubeDir, 0.55), new V3().copy(rad).multiplyScalar(-1).addScaledVector(tubeDir, 0.75).normalize(), 1.05, 0.2, { bend: tubeDir, curl: 0.3, pig: glassDeep, rings: 3, segs: 4 });
        }
      }
    }
    // where the axis crosses the skirt
    await ctx.yield();
    const collars = [[2.2, -1], [tubeLen - 2.2, 1]]; if (pierce.length === 2) collars.push([pierce[0] - 3.5, -1], [pierce[1] + 3.5, 1]);
    const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), tubeDir), e1 = new V3(1, 0, 0), e2 = new V3().crossVectors(tubeDir, e1).normalize();
    for (const [s, sg] of collars) {
      await ctx.yield();
      const cen = new V3().copy(TUBE_A).addScaledVector(tubeDir, s), m = new THREE.Matrix4().makeRotationFromQuaternion(q).setPosition(cen);
      fb.lathe([[TUBE_R + 0.3, -1.5], [TUBE_R + 1.5, -0.9], [TUBE_R + 2.0, 0], [TUBE_R + 1.5, 0.9], [TUBE_R + 0.3, 1.5]], { smooth: 3, segs: 36, pig: glassDeep, pat: PAT.rings, cells: 1, row: 0.8, m, ghost: ghostNext() });
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2, rad = new V3().copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
        thorn(fb, new V3().copy(cen).addScaledVector(rad, TUBE_R + 1.7), new V3().copy(rad).addScaledVector(tubeDir, sg * 0.45).normalize(), i % 2 ? 3.6 : 5.6, 0.6, { bend: tubeDir, curl: 0.35 * sg, pig: glassDeep });
        const a2 = ((i + 0.5) / 18) * Math.PI * 2, r2 = new V3().copy(e1).multiplyScalar(Math.cos(a2)).addScaledVector(e2, Math.sin(a2));
        dot(new V3().copy(cen).addScaledVector(r2, TUBE_R + 2.15), 0.5, glass);
      }
    }
  }
  await ctx.yield();

  // --- meshes: glaze, contour, underdrawing, dots ---
  const geo = fb.geometry();
  geo.boundingSphere = new THREE.Sphere(new V3(0, 68, 0), 160);
  await ctx.yield();
  const glaze = new THREE.Mesh(geo, glazeMaterial(U)); glaze.name = 'fountain-glaze';
  const hull = new THREE.Mesh(geo, hullMaterial(U)); hull.name = 'fountain-contour';
  const ghostGeo = fb.ghostGeometry(geo); ghostGeo.boundingSphere = geo.boundingSphere;
  await ctx.yield();
  const ghost = new THREE.Mesh(ghostGeo, hullMaterial(U, { ghost: true, push: 1 })); ghost.name = 'fountain-underdrawing';
  ghost.renderOrder = -0.5;
  trackResolution(glaze, U);
  group.add(glaze, hull, ghost);
  if (opts.tube !== false) {
    const tg = fbT.geometry(); tg.boundingSphere = geo.boundingSphere;
    const tw = new THREE.Mesh(tg, glazeMaterial(U, { glass: true })); tw.name = 'tube-glass'; tw.renderOrder = 3;
    const th = new THREE.Mesh(tg, hullMaterial(U)); th.name = 'tube-glass-contour';
    group.add(tw, th);
  }
  await ctx.yield();

  const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
  {
    const n = dots.length / 7, aDot = new Float32Array(n * 4), aTint = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { aDot.set(dots.slice(i * 7, i * 7 + 4), i * 4); aTint.set(dots.slice(i * 7 + 4, i * 7 + 7), i * 3); }
    const g = quad(); g.setAttribute('aDot', new THREE.InstancedBufferAttribute(aDot, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 3));
    g.instanceCount = n;
    const m = new THREE.Mesh(g, dotMaterial(U)); m.frustumCulled = false; m.name = 'fountain-pearls'; group.add(m);
  }

  // --- jets: thin ivory ribbons falling from the three tubes, breaking into dashes ---
  const landings = [];
  {
    const P = [], T = [], R = [], I = [];
    jets.forEach((j, k) => {
      const N = 40, v0 = 6.5, g = 9.8, tEnd = (v0 * j.vel.y + Math.sqrt(Math.max(0, v0 * v0 * j.vel.y * j.vel.y + 2 * g * (j.mouth.y - 0.3)))) / g;
      const b = P.length / 3;
      for (let i = 0; i <= N; i++) {
        const t = i / N, tau = t * tEnd;
        const p = new V3().copy(j.mouth).addScaledVector(j.vel, v0 * tau); p.y -= 0.5 * g * tau * tau;
        const tg = new V3().copy(j.vel).multiplyScalar(v0); tg.y -= g * tau; tg.normalize();
        for (const s of [-1, 1]) { P.push(p.x, p.y, p.z); T.push(tg.x, tg.y, tg.z); R.push(s, t, 0.42 + 0.3 * t); }
        if (i < N) { const a = b + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        if (i === N) landings.push(new V3(p.x, 0, p.z));
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(T, 3)); g.setAttribute('aRib', new THREE.Float32BufferAttribute(R, 3)); g.setIndex(I);
    const m = new THREE.Mesh(g, ribbonMaterial(U, { color: pal[4], flow: 7 })); m.frustumCulled = false; m.name = 'fountain-jets'; group.add(m);
  }

  // --- bubbles climbing out of the small tubes and off the skirt's foot (ambient, on world time) ---
  {
    const nb = Math.round(30 * detail), aBub = new Float32Array(nb * 4), aRise = new Float32Array(nb * 4);
    for (let i = 0; i < nb; i++) {
      const fromTube = i < nb / 2, seat = fromTube ? bubbleSeats[i % 3] : null, a = rng.range(0, Math.PI * 2);
      const p = fromTube ? new V3().copy(seat).add(new V3(0, 1.5, 0)) : new V3(Math.sin(a) * rng.range(52, 70), 0.2, Math.cos(a) * rng.range(52, 70));
      aBub.set([p.x, p.y, p.z, fromTube ? rng.range(0.7, 1.7) : rng.range(1.2, 3.2)], i * 4);
      aRise.set([rng(), fromTube ? rng.range(2, 3.5) : rng.range(1.2, 2.2), fromTube ? rng.range(22, 40) : rng.range(10, 24), rng.range(0.6, 1.8)], i * 4);
    }
    const g = quad(); g.setAttribute('aBub', new THREE.InstancedBufferAttribute(aBub, 4)); g.setAttribute('aRise', new THREE.InstancedBufferAttribute(aRise, 4)); g.instanceCount = nb;
    const m = new THREE.Mesh(g, bubbleMaterial(U)); m.frustumCulled = false; m.renderOrder = 20; m.name = 'fountain-bubbles'; group.add(m);
  }

  // --- the film across the tube's far mouth: bursts into ivory drops when setProgress passes opts.filmAt ---
  const filmU = { ...U, uBurst: { value: 0 } };
  if (opts.tube !== false) {
    const e1 = new V3(1, 0, 0), e2 = new V3().crossVectors(tubeDir, e1).normalize(), R = TUBE_R * 2.6, c = TUBE_B;
    const g = new THREE.BufferGeometry(), P = [], Q = [];
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = new V3().copy(c).addScaledVector(e1, x * R).addScaledVector(e2, y * R); P.push(p.x, p.y, p.z); Q.push(x * 2.6, y * 2.6); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(g, filmMaterial(filmU)); m.renderOrder = 21; m.name = 'tube-film'; group.add(m);
  }
  await ctx.yield();

  // --- the round lake and (for the viewer, or as the world's own ground) the tilted bowl of lawns ---
  const footR = skirtR(0);
  const waterU = { ...U, uPig: { value: C[1] }, uBodyPig: { value: body }, uAxis: { value: new V3() }, uFootR: { value: footR }, uSmearH: { value: 56 },
    uSplash: { value: [new V3(), new V3(), new V3()] } };
  if (opts.lake !== false) {
    const g = new THREE.CircleGeometry(opts.lakeRadius ?? 170, 96); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, waterMaterial(waterU)); m.position.y = 0; m.name = 'lake'; group.add(m);
  }
  if (opts.backdrop !== false) {
    const prof = [[170, 0], [250, 10], [262, 30], [700, 160], [715, 185], [1350, 390], [1500, 470]];
    const yAt = (r) => { for (let i = 0; i < prof.length - 1; i++) if (r <= prof[i + 1][0]) return prof[i][1] + (prof[i + 1][1] - prof[i][1]) * (r - prof[i][0]) / (prof[i + 1][0] - prof[i][0]); return 470; };
    const g = new THREE.RingGeometry(169.5, 1500, 72, 30); g.rotateX(-Math.PI / 2);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) p.setY(i, yAt(Math.hypot(p.getX(i), p.getZ(i))));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, lawnMaterial(U, { pig: pal[2], deep: pal[3] })); m.name = 'backdrop-lawn'; group.add(m);
  }

  // --- anchors (local space = world minus (0, 0, 380); no rotation) ---
  const loop = [];
  for (let i = 0; i <= 8; i++) { const ph = (i / 8) * (240 * Math.PI / 180); loop.push(new V3(36 - 70 * Math.cos(ph), 66 + 30 * (i / 8), 103 + 70 * Math.sin(ph))); }
  const winRing = new V3().copy(GLOBE_C).addScaledVector(WIN_D, Math.sqrt(GLOBE_R * GLOBE_R - 8.65 * 8.65) + 0.35);
  const anchors = {
    portalSeat: { position: new V3().copy(winC).addScaledVector(WIN_D, -6), facing: WIN_D.clone(), radius: 7 },
    window: { center: winC.clone(), dir: WIN_D.clone(), radius: 7.5, left: winLeft.clone() },
    owlPerch: { position: new V3().copy(winRing).addScaledVector(winLeft, 0.74 * 8.2).addScaledVector(winUp, -0.67 * 8.2 + 1.4).addScaledVector(WIN_D, 0.6), facing: WIN_D.clone().negate(), along: new V3().copy(winLeft).multiplyScalar(0.67).addScaledVector(winUp, 0.74) },
    tube: { a: TUBE_A.clone(), b: TUBE_B.clone(), dir: tubeDir.clone(), bore: TUBE_R, length: tubeLen, portEvery: 9, firstPort: 4.5, portsRound: 3, pierce: pierce.slice() },
    flyThrough: [new V3(0, 8, -180), new V3(-20, 10, -135), TUBE_A.clone(), TUBE_B.clone(), new V3().copy(TUBE_B).addScaledVector(tubeDir, 30), ...loop, new V3().copy(winC).addScaledVector(WIN_D, 30), new V3().copy(winC).addScaledVector(WIN_D, -6)],
    viewpoints: { entry: new V3(0, 100, -380), reveal: new V3(0, 40, -230), loopApex: new V3(36, 77, 173), lastStraight: new V3(71, 96, 42) },
    globe: { center: GLOBE_C.clone(), radius: GLOBE_R }, top: new V3(0, 140, 0), footRadius: footR,
    tubeMouths: bubbleSeats.map((p) => p.clone()), jetLandings: landings.map((p) => p.clone()),
    finialTips, hornSeat: new V3(36, 0, 153),
  };

  const filmAt = opts.filmAt ?? 0.52, m3 = new THREE.Matrix3();
  const hero = {
    object: group, radius: 62, height: 140, center: new V3(0, 74, 0), anchors, uniforms: U, seed,
    ground: false, groundY: 0,
    // u = the world's path progress: the film across the tube's far mouth bursts at opts.filmAt (0.52)
    setProgress(u) { filmU.uBurst.value = Math.min(1, Math.max(0, (u - filmAt) / 0.035)); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera && opts.tube !== false) {                   // is the eye inside the great tube? (eased over the first and last metres)
        _a.setFromMatrixPosition(camera.matrixWorld).sub(U.uBoreA.value); const al = _a.dot(U.uBoreD.value);
        const rad = _a.addScaledVector(U.uBoreD.value, -al).length();
        const k = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
        U.uInTube.value = rad < TUBE_R + 0.4 ? k((al + 14) / 15) * k((tubeLen + 1 - al) / 5) : 0;   // (the glass clears as we line up on the mouth, so we look down a glass tube before we are in it)
      }
      group.updateWorldMatrix(true, false);
      const M = group.matrixWorld; m3.setFromMatrix4(M);
      U.uBoreA.value.copy(TUBE_A).applyMatrix4(M); U.uBoreD.value.copy(tubeDir).applyMatrix3(m3).normalize();
      U.uBoreR.value = opts.tube !== false && pierces ? TUBE_R + 0.48 : -1;   // the skirt is cut only where a tube really passes through it
      if (pierce.length === 2) U.uPierce.value.set(pierce[0], pierce[1]);
      U.uTubeLen.value = tubeLen;
      U.uWinP.value.copy(winC).applyMatrix4(M); U.uWinD.value.copy(WIN_D).applyMatrix3(m3).normalize();
      waterU.uAxis.value.setFromMatrixPosition(M);
      for (let i = 0; i < 3; i++) waterU.uSplash.value[i].copy(landings[i]).applyMatrix4(M);
    },
    dispose() {},
  };
  hero.update(0, 0);
  return hero;
}

// ---------------------------------------------------------------------------------------------
// 5. FILM, WATER, LAWN
// ---------------------------------------------------------------------------------------------
// A soap film across an opening (uv = position in units of the opening's radius, quad out to 2.6).
// uBurst 0..1: the film snaps open and twenty ivory drops fly out and fall. A pure function of uBurst.
export function filmMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGround; uniform vec3 uInk; uniform float uBurst; uniform float uTime; varying vec2 vQ;
      void main() {
        float b = uBurst;
        float r = length(vQ); float fw = max(fwidth(r), 1e-4);
        float open = b * 1.4;                                        // the hole in the film grows from the middle
        float film = step(r, 0.97) * step(open, r) * (1.0 - smoothstep(0.6, 0.75, b));
        float ring = (1.0 - smoothstep(0.75 * fw, 1.5 * fw, abs(r - max(open, 0.001)))) * step(0.001, b) * step(r, 0.97);
        float ang = atan(vQ.y, vQ.x + 1e-4 * step(abs(vQ.x) + abs(vQ.y), 1e-5));
        float wob = 0.012 * sin(ang * 5.0 + uTime * 1.3);
        float arc = (1.0 - smoothstep(0.012, 0.012 + fw, abs(r - 0.72 - wob))) * (1.0 - smoothstep(0.5, 0.55, abs(ang - 2.2)));
        float arc2 = (1.0 - smoothstep(0.008, 0.008 + fw, abs(r - 0.5 + wob))) * (1.0 - smoothstep(0.22, 0.26, abs(ang + 0.9)));
        float a = film * max(0.06, max(arc, arc2) * 0.9);
        vec3 col = uGround;
        a = max(a, ring * 0.9 * (1.0 - smoothstep(0.6, 0.75, b)));
        // drops
        vec2 q = vQ + vec2(0.0, 1.1 * b * b);
        float qa = atan(q.y, q.x + 1e-4 * step(abs(q.x) + abs(q.y), 1e-5));
        float sec = floor((qa + 3.14159265) / 6.2831853 * 20.0);
        float h = fract(sin(sec * 12.9898 + 4.1) * 43758.5453);
        float ca = (sec + 0.5) / 20.0 * 6.2831853 - 3.14159265;
        float rd = 0.25 + 0.6 * h + b * (0.7 + 1.1 * fract(h * 7.3));
        float dd = length(q - rd * vec2(cos(ca), sin(ca)));
        float sz = (0.035 + 0.05 * fract(h * 3.7)) * (1.0 - 0.5 * b);
        float drop = (1.0 - smoothstep(sz, sz + fw, dd)) * step(0.001, b) * (1.0 - smoothstep(0.85, 1.0, b));
        a = max(a, drop);
        if (a < 0.01) discard;
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// Water: slate glaze paling where we look down into it, a deeper ring round the foot, ivory ripple
// rings (hairlines, flat when finer than 4 px), and a short smear of the fountain's own colour:
// the lower 0.4 of it, in ragged upright strokes, which slides as the camera moves. As the day turns (uEve) the far water
// pales toward the chalk ground (never toward the sky's pink: no lilac) and short ragged smears of uSkyLow stand under the far shore.
// U must also hold uPig, uBodyPig, uAxis (world), uFootR, uSmearH, uSplash [3 x vec3 world].
export function waterMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`varying vec3 vWP; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGround; uniform vec3 uInk; uniform vec3 uPig; uniform vec3 uBodyPig; uniform vec3 uAxis;
      uniform float uFootR; uniform float uSmearH; uniform float uTime; uniform vec3 uSplash[3]; uniform float uEve; uniform vec3 uSkyLow;
      varying vec3 vWP;
      float rings(float ph, float fw) {
        float w = max(min(1.5 * fw, 0.12), 1e-4);
        return (1.0 - smoothstep(0.5 * w, w, abs(fract(ph) - 0.5))) * (1.0 - smoothstep(0.11, 0.25, fw));
      }
      float splash(vec3 c) {
        float d = length(vWP.xz - c.xz); float ph = d / 1.7 - uTime * 0.8;
        return rings(ph, min(fwidth(d) / 1.7, 1.0)) * (1.0 - smoothstep(3.0, 10.0, d));
      }
      void main() {
        vec3 tc = cameraPosition - vWP; float tl = max(length(tc), 1e-3);
        float f = clamp(tc.y / tl, 0.0, 1.0);
        vec3 col = mix(uPig, uGround, 0.42 * f * sqrt(f));
        col = mix(col, uGround, 0.36 * uEve * (1.0 - smoothstep(0.1, 0.5, f)));   // as the day turns the far water pales to the chalk ground: it stays azurite, never lilac
        vec2 q = vWP.xz - uAxis.xz; float r = length(q); float fr = max(fwidth(r), 1e-4);
        // the fountain's smear
        vec2 pc = vWP.xz - cameraPosition.xz; float dpc = max(length(pc), 1e-3); vec2 dn = pc / dpc;
        float tA = dot(-q, dn); float lat = q.x * dn.y - q.y * dn.x;
        float te = tA - sqrt(max(uFootR * uFootR - lat * lat, 0.0));
        float h = te * max(tc.y, 0.0) / dpc;
        float cid = floor(lat / 2.4); float hs = fract(sin(cid * 12.9898) * 43758.5453);
        float sm = step(abs(lat), uFootR * 0.985) * step(0.0, te) * step(0.0, h) * step(h, uSmearH * (0.5 + 0.5 * hs)) * step(te, 38.0 * (0.45 + 0.55 * hs));
        col = mix(col, uBodyPig, sm * 0.38);
        // and the turned skyline's smear: short ragged upright strokes of its pink, hard-edged, under the far shore only (they
        // lengthen out of nothing with uEve and slide along the shore as the eye moves, like the fountain's own)
        float tfar = tA + sqrt(max(169.0 * 169.0 - lat * lat, 0.0));           // metres of water from here to the far shore, along the sight line
        float kid = floor(lat / 3.1); float ks = fract(sin(kid * 78.233 + 2.1) * 43758.5453);
        float sky2 = step(0.0, tfar) * step(0.3, ks) * step(tfar * max(tc.y, 0.0) / dpc, 9.0 * uEve * ks) * step(tfar, 64.0 * uEve * (0.35 + 0.65 * ks)) * (1.0 - sm);
        col = mix(col, uSkyLow, 0.8 * sky2);
        // contact ring: deeper slate, no direction
        float cr = uFootR + 8.0;
        col = mix(col, mix(uPig, uInk, 0.3), (1.0 - smoothstep(cr - fr, cr + fr, r)) * (1.0 - sm));
        // ripples
        float ph = (r - uFootR) / 6.5 - uTime * 0.11;
        float rp = rings(ph, min(fr / 6.5, 1.0)) * smoothstep(1.0, 5.0, r - uFootR) * (1.0 - smoothstep(25.0, 80.0, r - uFootR));
        rp = max(rp, max(splash(uSplash[0]), max(splash(uSplash[1]), splash(uSplash[2]))));
        col = mix(col, uGround, rp * 0.85);
        // wavelets: ruled rows of short ivory ticks laid across the line of sight; they slide as the eye moves
        float pxw = max(length(dFdx(vWP.xz)), length(dFdy(vWP.xz)));
        vec2 wid = floor(vWP.xz / 7.0); float hh = fract(sin(dot(wid, vec2(127.1, 311.7))) * 43758.5453);
        vec2 wc = (wid + 0.3 + 0.4 * vec2(hh, fract(hh * 7.13))) * 7.0; vec2 wp2 = vWP.xz - wc;
        float wal = dot(wp2, vec2(-dn.y, dn.x)); float wac = dot(wp2, dn) + 0.22 * sin(uTime * 0.9 + hh * 6.2832);
        float wlen = 1.1 + 1.5 * hh; float ww = max(0.06, 0.8 * pxw);
        float tick = (1.0 - smoothstep(0.6 * ww, ww, abs(wac - 0.2 * cos(clamp(wal / wlen, -1.0, 1.0) * 1.5708)))) * (1.0 - smoothstep(0.8 * wlen, wlen, abs(wal)));
        col = mix(col, uGround, tick * 0.6 * step(0.3, hh) * (1.0 - smoothstep(0.45, 0.95, pxw)) * (1.0 - sm));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// Lawn: copper green over the chalk ground, paling in level contour bands (a step every opts.band m of
// height), a deep-green hairline on each step. No light, no fog.
export function lawnMaterial(U, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uPig: { value: new THREE.Color(opts.pig ?? PALETTE[2]) }, uDeep: { value: new THREE.Color(opts.deep ?? PALETTE[3]) }, uBand: { value: opts.band ?? 26 } },
    vertexShader: /* glsl */`varying vec3 vWP; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGround; uniform vec3 uPig; uniform vec3 uDeep; uniform float uBand; varying vec3 vWP;
      void main() {
        float k = vWP.y / max(uBand, 0.1) + 0.35; float i = floor(k);
        float pale = 0.05 + 0.2 * fract(i * 0.381966);
        vec3 col = mix(uPig, uGround, pale);
        float fw = min(fwidth(k), 1.0); float w = max(min(1.5 * fw, 0.1), 1e-4);
        float e = min(fract(k), 1.0 - fract(k));
        col = mix(col, mix(uPig, uDeep, 0.35), (1.0 - smoothstep(0.5 * w, w, e)) * (1.0 - smoothstep(0.1, 0.3, fw)));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}
