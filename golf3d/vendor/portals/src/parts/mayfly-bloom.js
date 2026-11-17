// THE RIVER OF WINGS: hero set piece of "mayfly-bloom" (The Tisza in Flower), after Emile Galle:
// Nancy cameo glass seen from inside the vase. This file is also the world's STYLE KIT.
//
// WHAT IT IS. The swarm of long-tailed mayflies over the whole river, in closed form of (seed, progress u):
//   - swarm: 26,000 instanced animals (2 wing triangles hinged on the back + a body-and-tails quad) in a
//     window 120 m long that travels with the eye; hatching from the water round an emergence line
//     (u 0 .. 0.3, each animal rising again and again from its dimple while its moment lasts), dancing in
//     columns over the whole river, then gathered into the band (40 m wide, ~4 m deep, 0.5 m above the
//     water, braided, following the bend) as the turn sweeps past from behind (u 0.455 .. 0.535);
//   - far band: 16,000 single foil flecks from 27 m to 790 m both ways along the course, never under ~3.5 px;
//   - neighbours: 24 whole animals (ringed body, two tails, six legs, four veined wings, ~560 tris each) on
//     lanes within 2 m of the eye; no. 0 holds centre frame at 0.42 m for u 0.56-0.64, no. 1 carries a wing
//     across the frame at 0.3 m at u 0.6;
//   - hunters: 6 dragonflies cut in plan weaving through the band at +11 m/s; no. 0 is the ESCORT (0.66 m
//     ahead, back turned to us, ranging over the frame by station (opts.escortStations), hangs at u 0.25-0.3,
//     strikes at u 0.31, 0.52, 0.8, flies far ahead out of sight for u 0.5-0.66);
//   - the fall: 1,500 torn flakes of gold leaf round the eye, tumbling down and lying on the water (u > 0.82).
//   Size: the band runs the whole course (about 1.5 km); radius/height/center describe the stretch the viewer
//   orbits (radius 16, height 6, centre on the band at course s 330). Cost: ~141k triangles, 5 draw calls,
//   ~60 ms build, no lights, no textures. Around it the world supplies the blank (sky), water, banks, flora.
//
// LOCAL SPACE = the brief's world coordinates: origin at the entry, +Y up, +Z upstream, water at y 0.
// Add hero.object to the scene untransformed, call hero.setProgress(u) and hero.update(dt, time, camera)
// every frame (update also writes the shared uTime). Until setProgress is called the piece is "exhibited":
// band everywhere, flowing on time (that is what the _part viewer shows).
//
// opts: palette (7 hex, brief order: citron, honey, rose, olive, amber, aubergine, foil), edition
//   ('honey' | 'thunder' | 'autumn'), glass (a makeGlass() result to share with the world), detail 0.6..1
//   (thins swarm, far flecks and leaf; never neighbours or hunters), count, farCount, leafCount, dragonflies,
//   course { bendStart, radius, angle, side }, bandWidth, riverWidth, emergeAt (course s of the emergence
//   line, 55), window (half length of the animal window, 60), wingLength (0.05), pathLength (520), exitAngle,
//   escort (true), strikes ([u...]), backdrop (true = add the viewer's sky, water and two plain banks),
//   neighboursAway ((u) => 0..1: how far the neighbours are withdrawn at u; (p3) the world withdraws them while its route is under the water).
// returns: { object, radius, height, center, anchors, glass, setProgress(u), setFall(0..1 | -1 = by u),
//   setViewport(drawingBufferHeightPx), update, dispose, ground: false }.
// anchors: course / courseAt(s) / courseNearest(x,z) (river centre line); bandPoint(s, h 0..1, side m) -> a
//   point in the band (follows its braid); band { halfWidth, depth, base }; flyThrough: 11 points, a safe
//   camera line (entry, the dance at 5 m, the drop, the ride inside the band round the bend, out through
//   the outer bank at exitS, 62 m straight to the portal); portalSeat { position (x 170, y 4, z 431), normal
//   (facing back down the path), radius 7 }; viewpoints { reveal, drop, closest, bendAway }; exitS.
//
// STYLE EXPORTS (shade the whole world with these; all unlit, opaque, fog-free, for post.flat = 1):
//   makeGlass(palette, edition) -> { uniforms, tints, colors }: the shared uniform objects and the three
//     overlay multipliers (pigment / citron, so each lands on its hex over the lightest glass).
//   GLASS_GLSL: glassGround(dir) = the blank for any view direction (citron band, honey, rose, aubergine
//     collar, honey water, drifting pour, seed bubbles); cameoCut(...) = the stepped cut with pale rim, soft
//     slope under each step, wandering edge, undercut bays and the distance bite; wheelLine(...) = one
//     engraved line never under 1.5 px; aaStep, gHash, gNoise.
//   overlayMaterial(glass, opts): THE material for every cut form; needs attribute "cut" (relief, wheel
//     coordinate, round flag). blankMaterial(glass): the sky shell. waterMaterial(glass, { flow }): martele.
//   WING_GLSL (wingShape, wingGlass), mayflyGeometry() + mayflyMaterial(glass), dragonflyGeometry() +
//     DRAGONFLY_STYLE, COURSE_GLSL / courseAt / courseNearest / DEFAULT_COURSE, GALLE_PALETTE.
// Viewer-only: with "part=mayfly-bloom" in the query the piece adds its own blank, water and two plain banks;
// "&hv=s,height,side,u[,yawDeg,fall]" carries the piece so the orbiting camera rides in the band at course s.
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------
// 1. THE GLASS: pigments, shared uniforms, GLSL
// ---------------------------------------------------------------------------------------------
export const GALLE_PALETTE = ['#EFE8A6', '#E9A24C', '#C4788A', '#8A8A3E', '#9A5326', '#3E1B2C', '#F7D56A'];
const lin = (hex) => new THREE.Color(hex); // three converts sRGB hex to linear; post.flat shows it as written

// One set of uniform OBJECTS shared by every material of the world (same references, so one write
// in update() reaches them all). makeGlass() fills them for a palette / edition.
export function makeGlass(palette = GALLE_PALETTE, edition = 'honey') {
  const P = palette.map(lin);
  let citron = P[0].clone(), honey = P[1].clone(), rose = P[2].clone();
  let olive = P[3].clone(), amber = P[4].clone(), aub = P[5].clone();
  const foil = P[6].clone();
  if (edition === 'thunder') { // smoked grey-violet blank, aubergine overlays alone, a thin citron band
    honey = lin('#B59A8E'); rose = lin('#8E7088'); olive = aub.clone().lerp(rose, 0.45); amber = aub.clone().lerp(rose, 0.2);
  } else if (edition === 'autumn') { // rose ground to the horizon, amber-brown overlays
    honey = honey.clone().lerp(rose, 0.55); citron = citron.clone().lerp(P[1], 0.35); olive = amber.clone().lerp(P[1], 0.45);
  }
  // an overlay is a multiplier on the ground; divided by citron so that over the lightest glass it
  // lands exactly on its pigment hex, and over honey or rose it is that pigment seen on warmer glass
  const tint = (c) => new THREE.Vector3(Math.min(1, c.r / citron.r), Math.min(1, c.g / citron.g), Math.min(1, c.b / citron.b));
  const uniforms = {
    uTime: { value: 0 }, uProgress: { value: 0 },
    uCitron: { value: citron }, uHoney: { value: honey }, uRose: { value: rose }, uAub: { value: aub }, uFoil: { value: foil },
    uWest: { value: new THREE.Vector2(-1, 0) },        // horizontal unit vector (x,z) toward the warm side (port)
    uSun: { value: new THREE.Vector4(0.3, 0.954, 0, 0) }, // (x, z) unit vector toward the lamp's hot side; z = how strongly the bands flare there (0 = no flare)
    uBand: { value: new THREE.Vector4(8, 17, 27, edition === 'thunder' ? 0.45 : 1) }, // band tops in degrees; w = citron band scale
    uViewH: { value: 900 },                              // drawing-buffer height in px (for minimum mark sizes)
    uWell: { value: new THREE.Vector4(0, 0, 0, 0) },      // (p3) THE WELL: xyz = the route's own point, w = the radius of its round (0 = no well: the world as it was)
  };
  return { uniforms, tints: { olive: tint(olive), amber: tint(amber), aubergine: tint(aub) }, colors: { citron, honey, rose, olive, amber, aub, foil }, edition };
}

// GLSL for fragment shaders (declares the shared uniforms). ground first, then the cut.
export const GLASS_GLSL = /* glsl */`
uniform float uTime, uProgress, uViewH;
uniform vec3 uCitron, uHoney, uRose, uAub, uFoil;
uniform vec2 uWest;
uniform vec4 uBand, uSun, uWell;
float gHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float gNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gHash(i), gHash(i + vec2(1., 0.)), f.x), mix(gHash(i + vec2(0., 1.)), gHash(i + vec2(1., 1.)), f.x), f.y); }
// THE BLANK. d = unit direction from the eye to the fragment. Citron band, honey, rose, the aubergine
// collar (the neck of the vase); below the horizon the water mirrors the wall a tone deeper; streaks of the pour;
// a seed bubble here and there. Every surface in the world is this colour times an overlay.
vec3 glassGround(vec3 d){
  vec2 h = d.xz; if (dot(h, h) < 1e-8) h = vec2(0., 1.);
  float az = atan(h.x, h.y);
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float west = 0.5 + 0.5 * dot(normalize(h), uWest);
  // the pour: long sideways streaks that slide slowly inside the wall and drag the band edges with them
  vec2 nh = normalize(h);
  float pour = gNoise(nh * 2.6 + vec2(uTime * 0.012, el * 0.14 + 3.)) * 0.65 + gNoise(nh * 6.3 + vec2(el * 0.45, -uTime * 0.02)) * 0.35;
  float e = el + (pour - 0.5) * 3.6;
  // the lamp stands behind one side of the vase: there the bands flare upward (citron, honey and rose each reach
  // higher, a tall flame of light in the wall, never a disc) and the same light lies down the water toward the eye
  float sd = dot(nh, uSun.xy);
  float sk = uSun.z * smoothstep(0.74, 0.992, sd), skw = uSun.z * smoothstep(0.9, 0.999, sd);
  float cTop = uBand.x * uBand.w * (0.72 + 0.56 * west) * (1. + 1.9 * sk);
  float hTop = uBand.y * (1. + 1.7 * sk), aTop = uBand.z * (1. + 1.5 * sk);
  vec3 cit = mix(mix(uCitron, uHoney, 0.42), uCitron, max(smoothstep(0.1, 0.75, west), sk));
  vec3 c = mix(cit, uHoney, smoothstep(cTop - 2.5 - 5. * sk, cTop + 2.0 + 5. * sk, e));
  c = mix(c, uRose, smoothstep(hTop - 3.5 - 6. * sk, hTop + 3.0 + 6. * sk, e));
  c = mix(c, uAub, smoothstep(aTop - 3.0, aTop + 10.0 + 12. * sk, e) * 0.9);   // the collar closes softly: rose deepening to plum, never a hard band
  c = mix(c, min(uCitron * 1.13, vec3(1.)), skw * (1. - smoothstep(1., 15., abs(e))) * 0.9);   // the hot heart of the flare, low in the band
  // (o7) THE LOW SUN of the landscape vases: one round of deeper honey left standing in the citron band where the lamp
  // is, with the pale bitten rim every cut edge has (uSun.w = its elevation in degrees, 0 = none). The far tree lines
  // and everything else are overlays in front of it, so it burns through them as the lamp does through a vase.
  float sunEl = radians(uSun.w), sunOn = step(0.01, uSun.w);
  vec3 sdir = vec3(uSun.x * cos(sunEl), sin(sunEl), uSun.y * cos(sunEl));
  float sang = degrees(acos(clamp(dot(d, sdir), -1., 1.))), srad = 3.1 + (pour - 0.5) * 0.5;
  c = mix(c, min(uCitron * 1.16, vec3(1.)), (1. - smoothstep(srad + 0.5, srad + 0.75, sang)) * sunOn * 0.85);
  c = mix(c, mix(uHoney, uRose, 0.12) * vec3(1.04, 0.86, 0.7), (1. - smoothstep(srad - 0.1, srad + 0.1, sang)) * sunOn);
  // water: all honey, taking the band's light only in the last degrees under the horizon
  // (round 3) the water is the MIRROR of the wall, a tone deeper: the band's light lies on it under the far bank,
  // honey below that, then the rose of the upper wall and, under the eye, the plum of the vase's foot. So the
  // river is a second ground, cooler and darker than the sky, and pads, flowers, foil and insects stand on it.
  float we = -el + (pour - 0.5) * 2.4;
  vec3 w = mix(mix(cit, uHoney, 0.5 * (1. - skw)), uHoney, smoothstep(0.0, 2.6 + 9. * skw, we));
  w = mix(w, uRose, smoothstep(1.6 + 7. * skw, 7.5 + 20. * skw, we));
  w = mix(w, mix(uRose, uAub, 0.62), smoothstep(6.0 + 14. * skw, 24.0 + 22. * skw, we));
  c = mix(w, c, smoothstep(-0.6, 0.6, el));
  c *= 0.965 + 0.07 * pour;
  // seed bubbles in the wall (sky only): a faint pale bead, a few pixels across
  vec2 bc = vec2(az * 57.3, el) / 4.5; vec2 bi = floor(bc), bf = fract(bc) - 0.5;
  float bh = gHash(bi + 7.7);
  float bub = (1. - smoothstep(0.02, 0.05, length(bf - (vec2(gHash(bi), gHash(bi + 3.1)) - 0.5) * 0.6))) * step(0.86, bh) * step(1.0, el);
  c = mix(c, min(c * 1.12, vec3(1.)), bub * 0.6);
  return c;
}
// (p3) THE WELL. Round the route's own point (uWell.xyz) the water's skin (the plane y 0) is bitten through, uWell.w metres
// about that point (the radius is the world's law of progress, 1.2 to 2.4 to 0.24 m: the hole on the skin is 1.2 m in radius
// as the route goes through the skin, widest, 2.35 m, 3 m of route inside each touch, and is not there where the route's point
// is further from the skin than the radius; its rim wanders 0.08 m). The whole law of the passage under the skin is typed here once:
//   wellOn(p) = 1 where the place of the skin under or over p lies inside that round (for the skin itself and what lies on it);
//   wellIn(P) = 1 where the sight line from the eye to the fragment at P crosses the skin inside that round.
// A thing under the skin, seen from above, is drawn only where wellIn is 1; the skin seen from beneath (the hall's ceiling)
// and what floats on it are not drawn where wellOn is 1; a fragment over the skin, seen from beneath, is not drawn where
// wellHid is 1 (the sight line to it crosses the skin outside the round: the opaque skin stands before it). With uWell.w = 0
// all three are 0 everywhere and the world is as it was. cameraPosition is read here for that one question and nothing else.
float wellOnM(vec3 p, float m){
  float rim = (gNoise(p.xz * 2.3) - 0.5) * 0.16;
  return step(length(vec3(p.x, 0., p.z) - uWell.xyz), uWell.w + rim + m) * step(1e-4, uWell.w);
}
float wellOn(vec3 p){ return wellOnM(p, 0.); }
float wellIn(vec3 P){
  float ey = cameraPosition.y, den = ey - P.y;
  if (ey * P.y > 0.) return 0.;                                // eye and fragment on the same side of the skin: no crossing
  return wellOn(mix(cameraPosition, P, abs(den) > 1e-6 ? ey / den : 0.));
}
// (p3 hall) wellHid keeps 0.06 m back from the rim: within that of the round's edge a thing over the skin is left to the
// ceiling, which stands before it by depth and whose own reckoning of the rim is the rim (two reckonings of one edge, the far
// thing's and the ceiling's, differ by a part of a pixel: taken to the very edge, the rule left single pixels of the blank on
// the rim's row; hall/prints/nibble.txt). The picture is the same: what it leaves, the opaque skin hides.
float wellHid(vec3 P){
  if (!(uWell.w > 0. && cameraPosition.y < 0. && P.y > 0.)) return 0.;
  return 1. - wellOnM(mix(cameraPosition, P, cameraPosition.y / (cameraPosition.y - P.y)), 0.06);
}
// (p3) THE HALL'S GROUND, under the skin: the lit wall is overhead. Upward honey at the horizon to citron by 38 degrees
// (sooner toward the lamp: uSun.xy, the bearing the world takes from the eye's place to the lamp's foot, as live's blank
// has it: the one thing under the skin that is lit by where the eye is); downward honey, rose by 12 degrees, then the plum of the foot by 45 (rose with two fifths of
// aubergine: never darker, never black). The pour drags the edges as it does in the blank and adds no tone of its own.
vec3 hallGround(vec3 d){
  vec2 h = d.xz; if (dot(h, h) < 1e-8) h = vec2(0., 1.);
  vec2 nh = normalize(h);
  float el = degrees(asin(clamp(d.y, -1., 1.)));
  float pour = gNoise(nh * 2.6 + vec2(uTime * 0.012, el * 0.14 + 3.)) * 0.65 + gNoise(nh * 6.3 + vec2(el * 0.45, -uTime * 0.02)) * 0.35;
  float e = el + (pour - 0.5) * 3.6;
  float sk = smoothstep(0.5, 0.995, dot(nh, uSun.xy));
  vec3 up = mix(uHoney, uCitron, smoothstep(0., 38. - 16. * sk, e));
  vec3 dn = mix(mix(uHoney, uRose, smoothstep(0., 12., -e)), mix(uRose, uAub, 0.4), smoothstep(12., 45., -e));
  return mix(dn, up, smoothstep(-0.6, 0.6, el));
}
float aaStep(float edge, float x, float fw){ return smoothstep(edge - fw * 0.75, edge + fw * 0.75, x); }
// THE WHEEL: one pale engraved line where coordinate c crosses 0; halfW in units of c, never under 1.5 px.
float wheelLine(float c, float halfW, float fw){ float w = max(halfW, 0.8 * fw); return 1. - smoothstep(w - fw * 0.6, w + fw * 0.6, abs(c)); }
// THE CUT. r = relief coordinate (0 at the bitten edge, 1 at the heart), fw = fwidth(r) (take it in
// main, never in a loop), dist = metres to the eye (scaled by the material's bite scale), skins = how
// many overlays the thing carries (1 far gallery .. 3 nearest), t1..t3 = the multipliers of each
// terrace, wob = a slow noise value 0..1 for the acid's wander. Returns the fragment colour:
// pale rim, then terraces with hard edges, each lower terrace paling in a soft slope under the step.
// The thresholds slide with distance (the bite): one step beyond 120 m, two to 40 m, three inside;
// each new terrace arrives at the heart and the lower one then eats inward from the edge.
vec3 cameoCut(vec3 ground, float r, float fw, float dist, float skins, vec3 t1, vec3 t2, vec3 t3, float wob){
  float bay = max(wob - 0.78, 0.) * 1.6;                       // an undercut that bit too far
  r = r + (wob - 0.5) * 0.07 - bay;
  float w0 = min(max(0.055, 2.0 * fw), 0.3);
  float s = 0.05 + 0.5 * fw;                                  // width of the soft slope under a step
  float e2 = mix(0.40, 0.15, smoothstep(55., 108., dist)) + 1.3 * smoothstep(104., 124., dist) + step(skins, 1.5) * 3.;
  float e3 = mix(0.70, 0.38, smoothstep(10., 34., dist)) + 1.3 * smoothstep(34., 44., dist) + step(skins, 2.5) * 3.;
  e2 = max(e2, w0 + 0.08); e3 = max(e3, e2 + 0.12);
  vec3 rimC = mix(ground, max(ground, uCitron), 0.5);
  vec3 col = mix(ground, rimC, smoothstep(0., w0, r));
  vec3 c1 = ground * mix(t1, vec3(1.), 0.42 * smoothstep(e2 - s * 1.6, e2, r) * step(e2, 1.5));
  col = mix(col, c1, aaStep(w0, r, fw));
  vec3 c2 = ground * mix(t2, vec3(1.), 0.34 * smoothstep(e3 - s * 1.6, e3, r) * step(e3, 1.5));
  col = mix(col, c2, aaStep(e2, r, fw));
  col = mix(col, ground * t3, aaStep(e3, r, fw));
  // a form only a few pixels wide has no room for a rim: it is its flat average skin
  col = mix(col, ground * mix(t1, vec3(1.), 0.22), smoothstep(0.22, 0.45, fw));
  return col;
}
`;

// ---------------------------------------------------------------------------------------------
// 2. MATERIAL FACTORIES (all unlit, opaque, no fog, no lights: colour = ground(view dir) x overlay)
// ---------------------------------------------------------------------------------------------
const VERT_COMMON = /* glsl */`
varying vec3 vWpos; varying vec3 vWn; varying vec3 vCut;
`;
// overlayMaterial: THE material for every cut form (trees, fronds, bluff, hogweed, bodies, frames).
// Geometry needs: position, normal, and attribute "cut" (vec3): x = relief r (0 edge .. 1 heart),
// y = wheel coordinate (a line is engraved where y = 0, or uVeins lines per unit when veins > 0),
// z = 1 for round forms (trunks, bodies: relief is then taken from the facing term), else 0.
// opts: skins 1..3, tints [t1,t2,t3] (default olive, amber, aubergine from glass.tints), biteScale
// (multiplies distance before the bite thresholds: 1 for trees, ~40 for insects), veins (lines per
// unit of cut.y, 0 = single line at 0), veinHalf (half width in cut.y units), wobble (noise per
// metre), vertexDecl / vertexMove (GLSL: declarations, and statements that may change "vec3 p" in
// object space and "vec3 n"; instancing is applied after), side. fragDecl / fragMod / fragPost (GLSL:
// declarations; statements that may change "float r" (relief) and "float wy" (wheel coordinate) before
// the cut, or discard; statements that may change "vec3 col" after it; g, d, dist are in scope there).
// (p3) ground: the name of the GLSL ground function behind the form ('glassGround' unless given; 'hallGround' under the skin).
export function overlayMaterial(glass, o = {}) {
  const T = glass.tints, t = o.tints || [T.olive, T.amber, T.aubergine];
  if (o.thinFirst) t[0] = new THREE.Vector3(Math.pow(t[0].x, o.thinFirst), Math.pow(t[0].y, o.thinFirst), Math.pow(t[0].z, o.thinFirst)); // a thinner first skin
  return new THREE.ShaderMaterial({
    side: o.side ?? THREE.DoubleSide,
    uniforms: {
      ...glass.uniforms,
      uT1: { value: t[0] }, uT2: { value: t[1] }, uT3: { value: t[2] },
      uCutP: { value: new THREE.Vector4(o.skins ?? 3, o.biteScale ?? 1, o.veins ?? 0, o.veinHalf ?? 0.03) },
      uWob: { value: o.wobble ?? 0.3 }, ...(o.uniforms || {}),
    },
    vertexShader: /* glsl */`
      attribute vec3 cut; ${VERT_COMMON} uniform float uTime, uProgress; ${o.vertexDecl || ''}
      void main(){
        vec3 p = position; vec3 n = normal; vCut = cut;
        ${o.vertexMove || ''}
        vec4 wp = vec4(p, 1.);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n;
        #endif
        wp = modelMatrix * wp; vWpos = wp.xyz; vWn = mat3(modelMatrix) * n;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${GLASS_GLSL} ${VERT_COMMON}
      uniform vec3 uT1, uT2, uT3; uniform vec4 uCutP; uniform float uWob; ${o.fragDecl || ''}
      void main(){
        vec3 V = vWpos - cameraPosition; float dist = length(V); vec3 d = V / max(dist, 1e-4);
        vec3 n = vWn * inversesqrt(max(dot(vWn, vWn), 1e-8));
        float fc = abs(dot(n, d));
        float rr = 1. - sqrt(max(1. - fc * fc, 0.));
        float r = mix(vCut.x, rr, step(0.5, vCut.z));
        float wy = vCut.y;
        ${o.fragMod || ''}
        float fw = fwidth(r);
        float wob = gNoise(vWpos.xy * uWob + vWpos.z * uWob * 0.61);
        vec3 g = ${o.ground || 'glassGround'}(d);
        vec3 col = cameoCut(g, r, fw, dist * uCutP.y, uCutP.x, uT1, uT2, uT3, wob);
        // the wheel: engraved pale lines, drawing themselves in as the thing comes inside 40 m
        float y = uCutP.z > 0.5 ? wy * uCutP.z : wy;
        float fy = fwidth(y);
        float c = uCutP.z > 0.5 ? fract(y) - 0.5 : y;
        float nearK = 1. - smoothstep(26., 42., dist * uCutP.y);
        float ln = wheelLine(c, uCutP.w * (uCutP.z > 0.5 ? uCutP.z : 1.) * nearK, fy) * nearK * step(0.12, r) * (1. - smoothstep(0.3, 0.6, fy));
        col = mix(col, mix(g, max(g, uCitron), 0.35), ln * 0.85);
        ${o.fragPost || ''}
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// blankMaterial: the uncut wall of the vase. Put it on a sphere that follows the camera
// (renderOrder -1, frustumCulled false). Object-space position is used as the direction.
export function blankMaterial(glass) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { ...glass.uniforms },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `${GLASS_GLSL} varying vec3 vDir; void main(){ vec3 d = vDir * inversesqrt(max(dot(vDir, vDir), 1e-8)); gl_FragColor = vec4(glassGround(d), 1.); }`,
  });
}

// waterMaterial: honey glass worked in martele. A flat plane at the water level; the ovals are
// 0.3 m near the eye and grow to ~2.4 m at distance (two octaves cross-faded), slide along uFlow
// (xz, m/s) and flatten to their average tint before they get finer than about 3 px.
export function waterMaterial(glass, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...glass.uniforms, uFlow: { value: o.flow || new THREE.Vector2(0, -0.6) } },
    vertexShader: 'varying vec3 vWpos; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWpos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: /* glsl */`
      ${GLASS_GLSL} varying vec3 vWpos; uniform vec2 uFlow;
      float martele(vec2 p){                                   // 0 at an oval's rim .. 1 at its dished centre
        p.y *= 0.62; vec2 i = floor(p), f = fract(p); float best = 9.;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 o = vec2(float(x), float(y)); vec2 c = o + 0.5 + (vec2(gHash(i + o), gHash(i + o + 17.3)) - 0.5) * 0.7 - f;
          best = min(best, dot(c, c));
        }
        return 1. - smoothstep(0.02, 0.36, best);
      }
      void main(){
        vec3 V = vWpos - cameraPosition; float dist = length(V); vec3 d = V / max(dist, 1e-4);
        vec3 g = glassGround(d);
        vec2 p = vWpos.xz - uFlow * uTime;
        float l = log2(clamp(dist / 5., 1., 8.)); float l0 = floor(l), lf = l - l0;
        float s0 = 0.3 * exp2(l0);
        vec2 q = p / s0; float fq = max(fwidth(q.x), fwidth(q.y));
        float m = mix(martele(q), martele(q * 0.5 + 11.), smoothstep(0.2, 0.9, lf));
        m = mix(m, 0.42, smoothstep(0.16, 0.42, fq));
        gl_FragColor = vec4(g * (0.925 + 0.11 * m), 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------
// 3. THE COURSE of the river (closed form, the same in JS and GLSL): straight up +Z to bendStart,
//    then an arc of the given radius toward side*X through `angle` radians, then straight on.
// ---------------------------------------------------------------------------------------------
export const DEFAULT_COURSE = { bendStart: 250, radius: 170, angle: 2.25, side: 1 };
export function courseAt(s, C = DEFAULT_COURSE) { // -> { x, z, tx, tz } (centre line and unit tangent)
  if (s <= C.bendStart) return { x: 0, z: s, tx: 0, tz: 1 };
  const a = Math.min((s - C.bendStart) / C.radius, C.angle), rest = s - C.bendStart - a * C.radius;
  const tx = Math.sin(a) * C.side, tz = Math.cos(a);
  return { x: C.side * C.radius * (1 - Math.cos(a)) + tx * rest, z: C.bendStart + C.radius * Math.sin(a) + tz * rest, tx, tz };
}
export function courseNearest(x, z, C = DEFAULT_COURSE) { // -> arc length s of the nearest centre-line point
  let best = Math.min(z, C.bendStart), bd = (x * x) + (z - best) * (z - best);
  const cx = C.side * C.radius, a = THREE.MathUtils.clamp(Math.atan2(z - C.bendStart, (cx - x) * C.side), 0, C.angle);
  const pa = courseAt(C.bendStart + a * C.radius, C), da = (x - pa.x) ** 2 + (z - pa.z) ** 2;
  if (da < bd) { bd = da; best = C.bendStart + a * C.radius; }
  const e = courseAt(C.bendStart + C.angle * C.radius, C), t = Math.max(0, (x - e.x) * e.tx + (z - e.z) * e.tz);
  const de = (x - e.x - e.tx * t) ** 2 + (z - e.z - e.tz * t) ** 2;
  if (t > 0 && de < bd) best = C.bendStart + C.angle * C.radius + t;
  return best;
}
export const COURSE_GLSL = /* glsl */`
uniform vec4 uCourse;                                         // bendStart, radius, angle, side
vec4 coursePT(float s){                                       // xy = centre (x,z), zw = unit tangent (x,z)
  if (s <= uCourse.x) return vec4(0., s, 0., 1.);
  float a = min((s - uCourse.x) / max(uCourse.y, 1.), uCourse.z), rest = s - uCourse.x - a * uCourse.y;
  vec2 t = vec2(sin(a) * uCourse.w, cos(a));
  return vec4(vec2(uCourse.w * uCourse.y * (1. - cos(a)), uCourse.x + uCourse.y * sin(a)) + t * rest, t);
}
`;

// ---------------------------------------------------------------------------------------------
// 4. THE SWARM: one instanced mayfly (two wing triangles hinged on the back + one body-and-tails
//    quad turned to the eye about the body axis = 4 triangles), placed in closed form.
// ---------------------------------------------------------------------------------------------
// Fragment GLSL shared by the swarm and the neighbours: the wing as the workshop cut it.
// q = wing coordinates (x forward, y outward from the root, wing length 1). Returns relief r
// (<0 outside), t = fan coordinate (0 leading edge .. 1 trailing edge), rho = distance from root.
export const WING_GLSL = /* glsl */`
vec3 wingShape(vec2 q){
  float rho = length(q);
  float th = rho > 1e-4 ? atan(q.x, q.y) : 0.;
  float t = (0.20 - th) / 1.25;
  float tc = clamp(t, 0., 1.);
  float rmax = 1. - 0.44 * tc * sqrt(tc) - 0.20 * smoothstep(0.66, 0.74, tc) + 0.10 * smoothstep(0.74, 0.92, tc);
  float a = min(t, 1. - t) * 1.25 * max(rho, 0.12);
  float b = rmax - rho;
  return vec3(min(a, b), t, rho);
}
// the wing's glass: clear membrane, a thicker amber costa, radiating wheel-cut veins (never a net),
// torn flecks of gold foil that turn from dull honey to bright gold with the beat (turn 0..1).
// px = wing length in pixels (marks finer than ~3 px give way to their flat average).
vec3 wingGlass(vec3 g, vec3 w, vec2 q, float fwq, float turn, float seed, float px, vec3 amberT){
  float fine = smoothstep(9., 26., px);
  // the membrane is a thin amber skin, a step thicker toward the root (a wandering hard edge), thickest along the costa
  vec3 memb = g * mix(vec3(1.), amberT, 0.58);
  float rootE = 0.42 + 0.16 * gNoise(vec2(w.y * 7. + seed * 13., 2.7));
  memb = mix(g * mix(vec3(1.), amberT, 0.8), memb, aaStep(rootE, w.z, fwq * 1.5));
  vec3 col = mix(memb, g * mix(vec3(1.), amberT, 0.95), aaStep(0.9, 1. - w.y, 1.25 * fwq / max(w.z, 0.1)) * fine);
  col = mix(mix(g, max(g, uCitron), 0.5), col, aaStep(0.045, w.x, fwq));
  float ft = w.y * 8.; float fv = 8. * 1.25 * fwq / max(w.z, 0.1);
  float vein = wheelLine(fract(ft) - 0.5, 0.05 * (1. - 0.6 * w.z), fv) * smoothstep(0.1, 0.22, w.z) * (1. - smoothstep(0.35, 0.7, fv));
  col = mix(col, mix(g, max(g, uCitron), 0.6), vein * 0.9 * fine);
  float n = gNoise(q * 6.5 + seed * 37.) * 0.6 + gNoise(q * 15. + seed * 91.) * 0.4;
  float fleck = aaStep(0.56, n, fwq * 9.) * smoothstep(0.03, 0.09, w.x) * (1. - vein * 0.7);
  vec3 foil = mix(uHoney, uFoil, 0.25 + 0.75 * turn);
  col = mix(col, foil, fleck * fine);
  // far: one fleck of foil that turns
  return mix(mix(mix(uHoney, uFoil, 0.5 + 0.5 * turn), uCitron, 0.22), col, fine);
}
`;

function swarmMaterial(glass, courseU, U) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...glass.uniforms, uCourse: courseU, ...U, uAmber: { value: glass.tints.amber } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed;
      uniform float uTime, uProgress, uViewH; uniform vec3 uCamL;
      uniform vec4 uWin;      // x = camera's course s, y = half window length, z = flow (m travelled by the band), w = front (s relative to camera)
      uniform vec4 uBandP;    // x = half width, y = depth, z = base height above water, w = river half width (dance)
      uniform vec4 uBraid;    // x,y = braid wavelengths (1/m), z = braid amplitude (m), w = wing length (m)
      uniform vec4 uFarP;     // x = 1 for the far set, y = its reach (m)
      uniform vec4 uLife;     // x = emergence line s, y = exhibit (1 = all hatched), z = fall, w = dance amount
      uniform vec4 uSight;    // xyz = a far thing the swarm leaves in view (the portal), w = how much (0..1)
      ${COURSE_GLSL}
      varying vec2 vQ; varying float vPart; varying vec3 vWpos; varying vec4 vInfo; // vInfo: turn, seed, px, gather
      void main(){
        float L = uWin.y;
        float flow = uWin.z * (0.9 + 0.2 * aSeed.w), sRel, keep;
        if (uFarP.x < 0.5) {
          sRel = mod(aSeed.x * 2. * L + flow - uWin.x + L, 2. * L) - L;
          keep = step(smoothstep(0.45 * L, L, abs(sRel)) * 0.9, fract(aSeed.w * 17.3));   // the window thins toward its ends
        } else {
          float sd = fract(aSeed.y * 7.31) < 0.62 ? 1. : -1.;
          float r = fract(aSeed.x + sd * (flow - uWin.x) / 800.);
          sRel = sd * (0.45 * L + uFarP.y * r * r * sqrt(sqrt(r)));
          keep = smoothstep(0., 0.012, r) * (1. - smoothstep(0.96, 1., r));
        }
        float s = uWin.x + sRel;
        vec4 ct = coursePT(s);
        vec2 tan2 = ct.zw, nor2 = vec2(ct.w, -ct.z);
        float gather = (1. - smoothstep(uWin.w - 30., uWin.w, sRel));
        float ph = aSeed.w * 6.2831;
        // hatching: each animal has its moment, spreading from the emergence line
        float hatchU = abs(s - uLife.x) / 900. + aSeed.z * 0.10 + fract(aSeed.w * 7.3) * 0.06;
        float hatch = max(uLife.y, smoothstep(hatchU, hatchU + 0.035, uProgress + 0.09));
        // while its moment lasts an animal keeps rising from its dimple, again and again (the bloom never stands still)
        float popping = step(0.001, hatch) * step(hatch, 0.999);
        float pop = fract(uTime * 0.21 + aSeed.w * 5.);
        float hatchK = mix(1., smoothstep(0., 0.12, pop) * (1. - smoothstep(0.9, 1., pop)), popping);
        hatch = mix(hatch, pop, popping);
        // dance: columns over the whole river, rising fast and sinking slowly
        float lane = aSeed.y * 2. - 1.;
        float col = floor(aSeed.y * 23.) / 23. * 2. - 1. + 0.04;
        float lc = mix(lane, col, 0.7);
        float latD = lc * (0.3 + 0.7 * abs(lc)) * uBandP.w * 0.8 + sin(uTime * 0.6 + ph) * 0.7;
        float saw = fract(uTime * 0.22 + aSeed.w); float rise = saw < 0.3 ? saw / 0.3 : 1. - (saw - 0.3) / 0.7;
        float yD = 0.6 + aSeed.z * 2.2 + rise * 3.0;
        // band: lanes 40 m wide and 4 m deep, braided, denser low and toward the middle
        float braid = sin(s * uBraid.x + 1.3) * uBraid.z + sin(s * uBraid.y) * uBraid.z * 0.5;
        float latB = lane * (0.24 + 0.76 * lane * lane) * uBandP.x + braid + sin(uTime * 0.9 + ph * 3.) * 0.35;
        float yB = uBandP.z + uBandP.y * aSeed.z * (0.45 + 0.55 * aSeed.z) + sin(uTime * 1.3 + ph * 5.) * 0.18;
        float lat = mix(latD, latB, gather), y = mix(yD, yB, gather) * hatch;
        // far off the swarm lies low on the water (a line of foil drawn along the river), so no fleck ever stands
        // in front of a tree as a speck: only the animals round the eye fill the air
        vec2 cxz = ct.xy + nor2 * lat;
        float lowK = smoothstep(5., 15., length(cxz - uCamL.xz));
        y = mix(y, min(y, 0.12 + 0.1 * y), lowK);
        cxz = ct.xy + nor2 * lat * mix(1., mix(0.17, 0.55, gather), lowK);   // and gathers toward mid-river, clear of the bars
        keep *= mix(1., step(fract(aSeed.w * 41.7), mix(0.25, 1., gather)), lowK);   // (round 3) before the turn the far stream is a thread, not a field
        vec3 c = vec3(cxz.x, y, cxz.y);
        // attitude: nose upstream, pitched up (steeply while a dancer rises)
        float yaw = (fract(aSeed.w * 13.7) - 0.5) * mix(2.2, 0.35, gather) + sin(uTime * 0.7 + ph) * 0.15;
        vec2 f2 = tan2 * cos(yaw) + nor2 * sin(yaw);
        float pitch = mix(0.35 + 0.9 * step(saw, 0.3), 0.22, gather);
        vec3 fw = vec3(f2.x * cos(pitch), sin(pitch), f2.y * cos(pitch));
        vec3 rt = vec3(f2.y, 0., -f2.x);
        vec3 up = cross(fw, rt);
        float beat = uTime * (11. + 5. * aSeed.z) + ph * 9.;
        float sb = sin(beat);
        float ang = 0.85 + 0.6 * sb;
        // never under ~2 px: far animals are enlarged into single flecks
        vec3 toC = c - uCamL; float dist = max(length(toC), 0.05);
        float W = uBraid.w * 1.35 * (0.85 + 0.3 * fract(aSeed.w * 3.1));
        float px = W * uViewH * 0.5 * projectionMatrix[1][1] / dist;
        // the swarm parts along the line of sight to the portal: a cone that is nothing at the eye and the opening's width there
        vec3 sg = uSight.xyz - uCamL; float st = clamp(dot(toC, sg) / max(dot(sg, sg), 1e-3), 0., 1.);
        float sr = st * 13.5 + 0.02, sightK = mix(1., smoothstep(sr * 0.7, sr, length(toC - sg * st)), uSight.w);
        // one animal in seven is held large through the middle distance (a wing pair of 1 to 4 percent of the
        // frame), most of all in the band, so the swarm is wings in the air and not dust: size, not count
        float big = step(0.94, fract(aSeed.w * 29.7)) * (1. - uFarP.x);
        float pmin = mix(uFarP.x < 0.5 ? 3.0 : 3.6, 4. + 5. * gather * fract(aSeed.w * 71.3), big);
        float k = max(1. + 0.8 * gather * smoothstep(1.5, 5., dist), pmin / max(px, 1e-3)) * step(0.02, hatch) * keep * hatchK * sightK;
        vec3 p;
        if (position.z < 1.5) {
          float sd = position.z;
          vec3 wdir = rt * sd * cos(ang) + up * sin(ang);
          p = c + (fw * position.x + wdir * position.y) * W * k;
        } else {
          vec3 side = cross(fw, toC / dist); side = side * inversesqrt(max(dot(side, side), 1e-6));
          p = c + (fw * position.x + side * position.y) * (W / 1.35) * smoothstep(7., 15., px) * step(0.02, hatch) * keep * hatchK * sightK;
        }
        vQ = position.xy; vPart = position.z; vec4 wp = modelMatrix * vec4(p, 1.); vWpos = wp.xyz;
        vInfo = vec4(0.5 + 0.5 * sin(beat + 0.9), aSeed.w, px * k, gather);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${GLASS_GLSL} ${WING_GLSL}
      uniform vec3 uAmber;
      varying vec2 vQ; varying float vPart; varying vec3 vWpos; varying vec4 vInfo;
      void main(){
        vec3 V = vWpos - cameraPosition; float dist = length(V); vec3 d = V / max(dist, 1e-4);
        vec3 g = glassGround(d);
        float fwq = max(fwidth(vQ.x), fwidth(vQ.y));
        vec3 col;
        if (vPart < 1.5) {
          vec3 w = wingShape(vQ);
          if (w.x < 0.) discard;
          col = wingGlass(g, w, vQ, fwq, vInfo.x, vInfo.y, vInfo.z, uAmber);
        } else {
          // body: head, thorax, tapering abdomen in three steps of amber; two long tails as wheel lines
          float x = vQ.x, y = vQ.y;
          float hw = mix(0.035, 0.105, smoothstep(-0.62, 0.02, x)) * (1. - 0.45 * smoothstep(0.12, 0.2, x) + 0.3 * smoothstep(0.2, 0.27, x)) * step(-0.62, x) * (1. - smoothstep(0.3, 0.34, x));
          float r = 1. - abs(y) / max(hw, 1e-3);
          float tl = clamp((-0.6 - x) / 1.65, 0., 1.);
          float tail = wheelLine(abs(y) - mix(0.02, 0.2, tl), 0.014 * (1. - 0.7 * tl), fwq) * step(x, -0.58) * step(-2.25, x);
          if (r < 0. && tail < 0.3) discard;
          vec3 t1 = pow(uAmber, vec3(0.42)), t2 = pow(uAmber, vec3(0.72));
          col = r >= 0. ? cameoCut(g, r, fwidth(r), dist * 28., 3., t1, t2, uAmber, 0.5) : g * t1;
          col = mix(g * t1, col, smoothstep(10., 24., vInfo.z));
        }
        if (wellHid(vWpos) > 0.5) discard;                     // (p3) from beneath the skin: only through the well
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

function swarmGeometry(count, rng, far = false) {
  const g = new THREE.InstancedBufferGeometry();
  const A = [0.15, -0.1], B = [0.5, 1.22], Cc = [-1.05, 0.45];
  const pos = [];
  for (const sd of [-1, 1]) for (const v of (sd < 0 ? [A, B, Cc] : [A, Cc, B])) pos.push(v[0], v[1], sd);
  const bx0 = 0.36, bx1 = -2.3, by = 0.26;
  if (far) pos.length = 9; else pos.push(bx0, -by, 2, bx0, by, 2, bx1, by, 2, bx0, -by, 2, bx1, by, 2, bx1, -by, 2);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) seed[i] = rng();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// ---------------------------------------------------------------------------------------------
// 6. THE NEIGHBOURS: 24 whole animals (body in rings, two tails, six legs, four veined wings) at
//    arm's length. Units: wing length = 1; x forward, y up, z to the right.
// ---------------------------------------------------------------------------------------------
export function mayflyGeometry() {
  const pos = [], nor = [], cut = [], wing = [], idx = [];
  const v = new THREE.Vector3(), t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  // a tube along pts with radii; cut = (0, ringCoord, 1): relief comes from the facing term
  const tube = (pts, rad, sides, yc, squash = 1) => {
    const base = pos.length / 3, n = pts.length;
    for (let i = 0; i < n; i++) {
      t.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
      a.set(0, 1, 0).addScaledVector(t, -t.y).normalize(); b.crossVectors(t, a);
      for (let k = 0; k < sides; k++) {
        const an = k / sides * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
        v.copy(pts[i]).addScaledVector(a, c * rad[i] * squash).addScaledVector(b, sn * rad[i]);
        pos.push(v.x, v.y, v.z); nor.push(a.x * c + b.x * sn, a.y * c + b.y * sn, a.z * c + b.z * sn);
        cut.push(0, yc[i], 1); wing.push(0, 0, 0, 0);
      }
      if (i < n - 1) for (let k = 0; k < sides; k++) {
        const p0 = base + i * sides + k, p1 = base + i * sides + (k + 1) % sides;
        idx.push(p0, p1, p0 + sides, p1, p1 + sides, p0 + sides);
      }
    }
  };
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  // body: head with a brow, humped thorax, ten abdominal rings curving up to the tail
  const bp = [], br = [], by = [];
  const prof = [[0.50, 0.0, 0.012], [0.47, 0.0, 0.05], [0.42, 0.005, 0.075], [0.37, 0.0, 0.066], [0.33, 0.0, 0.05],
    [0.29, 0.02, 0.085], [0.21, 0.045, 0.118], [0.10, 0.05, 0.128], [0.0, 0.03, 0.112], [-0.08, 0.01, 0.086]];
  prof.forEach((q, i) => { bp.push(P(q[0], q[1], 0)); br.push(q[2]); by.push(-2 + i * 0.2); });
  for (let i = 1; i <= 10; i++) {
    const f = i / 10, x = -0.08 - 0.74 * f, y = 0.01 + 0.10 * f * f;
    const r = (0.084 - 0.05 * f) * (i % 1 === 0 ? 1 : 1);
    bp.push(P(x + 0.03, y, 0)); br.push(r * 0.9); by.push(i - 0.42);   // the pinch between rings
    bp.push(P(x, y, 0)); br.push(r); by.push(i);
  }
  bp.push(P(-0.86, 0.125, 0)); br.push(0.012); by.push(10.5);
  for (let i = 0; i < br.length; i++) br[i] *= 1.45;
  tube(bp, br, 8, by, 1.0);
  // tails: two long cerci, spreading and arching
  for (const sd of [-1, 1]) {
    const tp = [], tr = [], ty = [];
    for (let i = 0; i <= 8; i++) { const f = i / 8; tp.push(P(-0.84 - 1.75 * f, 0.12 + 0.22 * Math.sin(f * 2.4) - 0.1 * f * f, sd * (0.02 + 0.34 * f * (0.6 + 0.4 * f)))); tr.push(0.02 * (1 - 0.72 * f)); ty.push(20.25); }
    tube(tp, tr, 4, ty);
  }
  // legs: the long forelegs held out ahead, the others trailing under the thorax
  for (const sd of [-1, 1]) {
    tube([P(0.26, -0.04, sd * 0.07), P(0.5, -0.1, sd * 0.16), P(0.86, 0.0, sd * 0.2), P(1.22, 0.1, sd * 0.17)], [0.02, 0.016, 0.012, 0.006], 3, [20.25, 20.25, 20.25, 20.25]);
    tube([P(0.14, -0.06, sd * 0.08), P(0.1, -0.2, sd * 0.2), P(-0.1, -0.3, sd * 0.24), P(-0.3, -0.33, sd * 0.22)], [0.018, 0.014, 0.01, 0.005], 3, [20.25, 20.25, 20.25, 20.25]);
    tube([P(0.03, -0.06, sd * 0.08), P(-0.06, -0.19, sd * 0.17), P(-0.3, -0.25, sd * 0.2), P(-0.52, -0.25, sd * 0.17)], [0.018, 0.014, 0.01, 0.005], 3, [20.25, 20.25, 20.25, 20.25]);
  }
  // wings: fore and hind on each side, cut in the fragment shader (wingShape), hinged on the back
  const tri = [[0.15, -0.1], [0.5, 1.22], [-1.05, 0.45]];
  for (const sd of [-1, 1]) for (const [rx, sc] of [[0.14, 1.45], [-0.02, 0.6]]) {
    const base = pos.length / 3;
    for (const q of tri) { pos.push(rx, 0.1, sd * 0.05); nor.push(0, 1, 0); cut.push(0, 0, 0); wing.push(q[0], q[1], sd, sc * (sc < 1 ? -1 : 1)); }
    idx.push(base, base + 1, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('cut', new THREE.Float32BufferAttribute(cut, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 4));
  g.setIndex(idx);
  return g;
}

// material for mayflyGeometry (instanced; instance attribute aN = beat phase, foil seed)
export function mayflyMaterial(glass, wingLength = 0.05) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...glass.uniforms, uAmber: { value: glass.tints.amber }, uWingLen: { value: wingLength } },
    vertexShader: /* glsl */`
      attribute vec3 cut; attribute vec4 aWing; attribute vec2 aN;
      uniform float uTime, uViewH, uWingLen;
      varying vec3 vWpos; varying vec3 vWn; varying vec3 vCut; varying vec2 vQ; varying vec4 vInfo;
      void main(){
        vec3 p = position, n = normal; float isW = abs(aWing.z);
        float beat = uTime * (10. + 4. * aN.y) + aN.x * 6.2831 - step(aWing.w, 0.) * 0.7;
        if (isW > 0.5) {
          float ang = 0.82 + 0.62 * sin(beat);
          vec3 o = vec3(0., sin(ang), aWing.z * cos(ang));
          p += (vec3(1., 0., 0.) * aWing.x + o * aWing.y) * abs(aWing.w);
          n = cross(vec3(1., 0., 0.), o);
        }
        vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.);
        vWpos = wp.xyz; vWn = mat3(modelMatrix) * mat3(instanceMatrix) * n; vCut = cut; vQ = aWing.xy;
        float dist = max(length(wp.xyz - cameraPosition), 0.05);
        vInfo = vec4(0.5 + 0.5 * sin(beat + 0.9), aN.y + step(aWing.w, 0.) * 0.37, uWingLen * abs(aWing.w) * uViewH * 0.5 * projectionMatrix[1][1] / dist, isW);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${GLASS_GLSL} ${WING_GLSL}
      uniform vec3 uAmber;
      varying vec3 vWpos; varying vec3 vWn; varying vec3 vCut; varying vec2 vQ; varying vec4 vInfo;
      void main(){
        vec3 V = vWpos - cameraPosition; float dist = length(V); vec3 d = V / max(dist, 1e-4);
        vec3 g = glassGround(d); vec3 col;
        if (vInfo.w > 0.5) {
          vec3 w = wingShape(vQ);
          if (w.x < 0.) discard;
          col = wingGlass(g, w, vQ, max(fwidth(vQ.x), fwidth(vQ.y)), vInfo.x, vInfo.y, vInfo.z, uAmber);
        } else {
          vec3 n = vWn * inversesqrt(max(dot(vWn, vWn), 1e-8));
          float fc = abs(dot(n, d)); float r = 1. - sqrt(max(1. - fc * fc, 0.));
          vec3 t1 = pow(uAmber, vec3(0.42)), t2 = pow(uAmber, vec3(0.72));
          float wob = gNoise(vWpos.xy * 60. + vWpos.z * 37.);
          col = cameoCut(g, r, fwidth(r), dist * 28., 3., t1, t2, uAmber, 0.35 + 0.3 * wob);
          float fy = fwidth(vCut.y);
          float ln = wheelLine(fract(vCut.y) - 0.5, 0.07, fy) * step(0.2, r) * (1. - smoothstep(0.3, 0.6, fy)) * (1. - smoothstep(30., 44., dist * 28.));
          col = mix(col, mix(g, max(g, uCitron), 0.4), ln * 0.8);
        }
        if (wellHid(vWpos) > 0.5) discard;                     // (p3) from beneath the skin: only through the well
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------
// 7. THE HUNTERS: a dragonfly cut in plan, four wings spread. Units: metres at scale 1 (span 0.13);
//    x forward, y up, z right. Shade it with overlayMaterial(glass, DRAGONFLY_STYLE).
// ---------------------------------------------------------------------------------------------
export function dragonflyGeometry() {
  const pos = [], nor = [], cut = [], idx = [];
  const ring = (x, y, ry, rz, yc, sides = 8) => { for (let k = 0; k < sides; k++) { const a = k / sides * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); pos.push(x, y + c * ry, sn * rz); nor.push(0, c, sn); cut.push(0, yc, 1); } };
  // body: broad head with two eye lobes, deep thorax, long thin abdomen of ten rings, clubbed tip
  const prof = [[0.0345, 0, 0.001, 0.001], [0.031, 0, 0.0042, 0.0074], [0.027, 0, 0.005, 0.0088], [0.0235, 0, 0.0036, 0.0052], [0.021, 0.0005, 0.0058, 0.0064],
    [0.014, 0.001, 0.0078, 0.0082], [0.004, 0.001, 0.0072, 0.0074], [-0.003, 0.0005, 0.0048, 0.0046]];
  prof.forEach((q, i) => ring(q[0], q[1], q[2], q[3], 20.25));
  for (let i = 1; i <= 10; i++) { const f = i / 10, r = 0.0037 - 0.0013 * f + (i >= 9 ? 0.0008 : 0); ring(-0.003 - 0.046 * f + 0.0016, 0, r * 0.82, r * 0.82, i - 0.42); ring(-0.003 - 0.046 * f, 0, r, r, i); }
  ring(-0.0515, 0, 0.0003, 0.0003, 10.2);
  const rings = pos.length / 3 / 8;
  for (let i = 0; i < rings - 1; i++) for (let k = 0; k < 8; k++) { const a = i * 8 + k, b = i * 8 + (k + 1) % 8; idx.push(a, b, a + 8, b, b + 8, a + 8); }
  // wings: fore pair swept a little forward, hind pair broader and swept back; relief capped low (a thin skin)
  for (const sd of [-1, 1]) for (const [rx, sweep, len, chord] of [[0.012, 0.16, 0.066, 0.0125], [0.004, -0.2, 0.062, 0.0155]]) {
    const base = pos.length / 3, n = 7;
    for (let i = 0; i <= n; i++) {
      const f = i / n, w = chord * (0.28 + 0.72 * Math.sin(Math.min(1, f * 1.5) * Math.PI * 0.5)) * Math.sqrt(Math.max(0, 1 - Math.pow(f, 5)));
      const cx = rx + Math.sin(sweep) * len * f - 0.0015 * f, cz = sd * (0.004 + Math.cos(sweep) * len * f), y = 0.0052 + 0.004 * f;
      const lead = w * 0.42, trail = w * 0.58;
      pos.push(cx + lead, y, cz, cx, y, cz, cx - trail, y, cz);
      nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      const rm = f > 0.72 ? 0.66 : 0.33;                    // the wing is one thin skin; only its tip is left thick
      cut.push(0, 20.0, 0, rm, 22.0, 0, 0, 24.0, 0);
      if (i < n) { const a = base + i * 3; idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('cut', new THREE.Float32BufferAttribute(cut, 3));
  g.setIndex(idx);
  return g;
}
// The workshop's dragonfly, cut in plan: head, thorax and ringed abdomen in aubergine with ONE pale rim, four
// wings of amber-olive glass with wheel-cut veins that can be counted, the tips left thick.
const DRAGONFLY_CUT = {
  skins: 3, biteScale: 22, veins: 1, veinHalf: 0.085, wobble: 55,
  vertexMove: 'if (cut.z < 0.5) { float fl = sin(uTime * 34. + p.x * 160.) * 0.16; p.y += abs(p.z) * fl; }',
  fragMod: /* glsl */`
    float dE = 9.;
    float dfr = fwidth(rr) + 1e-4, dRp = max(1.6, 0.0035 * uViewH / (max(dist, 0.1) * 1.2)), dBody = step(0.5, vCut.z);
    dE = mix(9., rr / (dfr * dRp) + 9. * smoothstep(0.25, 0.5, dfr * dRp), dBody); r = mix(r, 0.92, dBody);
    float fdE = fwidth(dE);`,
  fragPost: 'col = mix(mix(g, max(g, uCitron), 0.5), col, aaStep(1., dE, fdE)); if (wellHid(vWpos) > 0.5) discard;',   // (p3) from beneath the skin: only through the well
};
export function dragonflyStyle(glass) {
  const T = glass.tints, pw = (v, k) => new THREE.Vector3(Math.pow(v.x, k), Math.pow(v.y, k), Math.pow(v.z, k)), mul = (a, c) => new THREE.Vector3(a.x * c.x, a.y * c.y, a.z * c.z);
  return { ...DRAGONFLY_CUT, tints: [mul(pw(T.olive, 0.45), pw(T.amber, 0.28)), mul(pw(T.amber, 0.8), pw(T.aubergine, 0.6)), T.aubergine] };
}
export const DRAGONFLY_STYLE = DRAGONFLY_CUT;   // (kept for the viewer; worlds use dragonflyStyle(glass))

// ---------------------------------------------------------------------------------------------
// 8. THE FALL: spent wings coming down like gold leaf (torn flakes, tumbling, then lying on the water)
// ---------------------------------------------------------------------------------------------
function leafMaterial(glass, U) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...glass.uniforms, uCamL: U.uCamL, uLeaf: { value: new THREE.Vector4(0, 40, 11, 0.034) } }, // amount 0..1, box xz, box height, flake size
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime, uViewH; uniform vec3 uCamL; uniform vec4 uLeaf;
      varying vec2 vQ; varying vec3 vWpos; varying vec3 vInfo;
      void main(){
        vec2 xz = uCamL.xz + mod(aSeed.xy * uLeaf.y - uCamL.xz, uLeaf.y) - 0.5 * uLeaf.y;
        float f = fract(aSeed.z - uTime * (0.035 + 0.02 * aSeed.w));
        float air = smoothstep(0.3, 0.34, f);
        float y = 0.03 + max(f - 0.3, 0.) / 0.7 * uLeaf.z;
        float ph = aSeed.w * 6.2831;
        xz += vec2(sin(uTime * 0.8 + ph), cos(uTime * 0.6 + ph * 1.7)) * 0.5 * air + vec2(0., -0.5) * uTime * (1. - air) * 0.0;
        float a = (uTime * (1.2 + aSeed.w) + ph) * air;
        float yaw = ph * 3. + uTime * 0.3 * air;
        vec3 e1 = vec3(cos(yaw), 0., sin(yaw));
        vec3 e2 = vec3(-sin(yaw) * cos(a), sin(a), cos(yaw) * cos(a));
        vec3 c = vec3(xz.x, y, xz.y);
        float dist = max(length(c - uCamL), 0.05);
        float size = uLeaf.w * (0.6 + 0.9 * aSeed.z);
        float px = size * uViewH * 0.5 * projectionMatrix[1][1] / dist;
        float k = max(1., 2.6 / max(px, 1e-3)) * step(aSeed.x * 0.999, uLeaf.x) * smoothstep(0., 0.03, f) ;
        vec3 p = c + (e1 * position.x + e2 * position.y) * size * k;
        vec4 wp = modelMatrix * vec4(p, 1.); vWpos = wp.xyz; vQ = position.xy;
        vInfo = vec3(mix(0.75, abs(cos(a)), air), aSeed.w, px * k);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${GLASS_GLSL}
      varying vec2 vQ; varying vec3 vWpos; varying vec3 vInfo;
      void main(){
        float fine = smoothstep(5., 14., vInfo.z);
        float n = gNoise(vQ * 2.6 + vInfo.y * 53.) * 0.7 + gNoise(vQ * 7. + vInfo.y * 11.) * 0.3;
        float shape = 1. - dot(vQ, vQ) * 1.05 - (0.62 - n) * 1.7 * fine;      // a torn edge near; a plain fleck far
        if (shape < 0.) discard;
        vec3 foil = mix(uHoney, uFoil, 0.2 + 0.8 * vInfo.x);
        if (wellHid(vWpos) > 0.5) discard;                     // (p3) from beneath the skin: only through the well
        gl_FragColor = vec4(foil, 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------
// 9. THE HERO
// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('mayfly-bloom-hero') : ctx.rng;
  const detail = THREE.MathUtils.clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const C = { ...DEFAULT_COURSE, ...(opts.course || {}) };
  const glass = opts.glass || makeGlass(opts.palette || GALLE_PALETTE, opts.edition || 'honey');
  const GU = glass.uniforms;
  const pathLength = opts.pathLength ?? 520;
  const object = new THREE.Group(); object.name = 'river-of-wings';
  // viewer-only hooks (the _part viewer has "part=" in its query; a world never does)
  let preview = false, pin = null;
  try {
    const q = new URLSearchParams(globalThis.location?.search || '');
    preview = q.get('part') === 'mayfly-bloom';
    if (preview && q.get('hv')) pin = q.get('hv').split(',').map(Number); // s, height, side offset, progress(-1 = exhibit), yaw degrees
  } catch (e) { /* no location: not the viewer */ }

  // per-seed character of the band
  const bandHalf = (opts.bandWidth ?? 40) * 0.5 * rng.range(0.9, 1.12), bandDepth = rng.range(3.6, 4.6);
  const U = {
    uCamL: { value: new THREE.Vector3() },
    uWin: { value: new THREE.Vector4(0, opts.window ?? 60, 0, 1e4) },
    uBandP: { value: new THREE.Vector4(bandHalf, bandDepth, 0.5, (opts.riverWidth ?? 90) * 0.46) },
    uBraid: { value: new THREE.Vector4(rng.range(0.018, 0.03), rng.range(0.05, 0.08), rng.range(1.5, 3.2), opts.wingLength ?? 0.05) },
    uLife: { value: new THREE.Vector4(opts.emergeAt ?? 55, 1, 0, 0) },
    uFarP: { value: new THREE.Vector4(0, 760, 0, 0) },
    uSight: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const courseU = { value: new THREE.Vector4(C.bendStart, C.radius, C.angle, C.side) };

  // --- the swarm ---
  const nSwarm = Math.round((opts.count ?? 26000) * detail);
  const swarmMat = swarmMaterial(glass, courseU, U);
  const swarm = new THREE.Mesh(swarmGeometry(nSwarm, rng.fork ? rng.fork('swarm') : rng), swarmMat);
  swarm.frustumCulled = false; swarm.name = 'swarm'; object.add(swarm);
  await ctx.yield();

  // --- the far band: single foil flecks (one triangle each) from 40 m out to 800 m both ways, thickest near ---
  const nFar = Math.round((opts.farCount ?? 16000) * detail);
  const farMat = swarmMaterial(glass, courseU, { ...U, uFarP: { value: new THREE.Vector4(1, 760, 0, 0) } });
  const far = new THREE.Mesh(swarmGeometry(nFar, rng.fork ? rng.fork('far') : rng, true), farMat);
  far.frustumCulled = false; far.name = 'far-band'; object.add(far);
  await ctx.yield();

  // --- the neighbours ---
  const NN = 32, W = U.uBraid.value.w, nrng = rng.fork ? rng.fork('neighbours') : rng;
  const nbGeo = mayflyGeometry();
  const aN = new Float32Array(NN * 2), lanes = [];
  for (let i = 0; i < NN; i++) {
    aN[i * 2] = nrng(); aN[i * 2 + 1] = nrng();
    const near = i < 10;
    lanes.push({ x: nrng.range(0.18, near ? 0.75 : 1.9) * (i % 2 ? 1 : -1), y: nrng.range(-0.42, near ? 0.3 : 0.75), z: nrng.range(0, 6),
      v: nrng.range(0.12, 0.45) * (nrng() < 0.3 ? -1 : 1), ph: nrng.range(0, 6.28), sc: nrng.range(0.9, 1.18), yaw: nrng.range(-0.25, 0.25) });
  }
  nbGeo.setAttribute('aN', new THREE.InstancedBufferAttribute(aN, 2));
  const neighbours = new THREE.InstancedMesh(nbGeo, mayflyMaterial(glass, W), NN);
  neighbours.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  neighbours.frustumCulled = false; neighbours.name = 'neighbours'; object.add(neighbours);
  await ctx.yield();

  // --- the hunters ---
  const ND = opts.dragonflies ?? 6, drng = rng.fork ? rng.fork('dragonflies') : rng, dlanes = [];
  const hunters = new THREE.InstancedMesh(dragonflyGeometry(), overlayMaterial(glass, dragonflyStyle(glass)), ND);
  for (let i = 0; i < ND; i++) dlanes.push({ z: drng.range(0, 120), v: drng.range(9, 13), lat: drng.range(-0.8, 0.8), h: drng.range(0.25, 0.8), wl: drng.range(0.05, 0.11), ph: drng.range(0, 6.28), sc: drng.range(1.0, 1.35) });
  hunters.instanceMatrix.setUsage(THREE.DynamicDrawUsage); hunters.frustumCulled = false; hunters.name = 'hunters'; object.add(hunters);
  // --- the fall ---
  const nLeaf = Math.round((opts.leafCount ?? 1500) * detail), lg = new THREE.InstancedBufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const ls = new Float32Array(nLeaf * 4), lrng = rng.fork ? rng.fork('leaf') : rng; for (let i = 0; i < ls.length; i++) ls[i] = lrng();
  lg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(ls, 4)); lg.instanceCount = nLeaf; lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const leafMat = leafMaterial(glass, U), leaf = new THREE.Mesh(lg, leafMat);
  leaf.frustumCulled = false; leaf.name = 'gold-leaf'; object.add(leaf);
  await ctx.yield();


  // --- viewer-only backdrop: the blank and the martele water, so the piece is judged on its own glass ---
  let sky = null;
  if (preview || opts.backdrop) {
    sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), blankMaterial(glass));
    sky.renderOrder = -0.5; sky.frustumCulled = false; object.add(sky);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), waterMaterial(glass));
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0, 250); object.add(water);
    // two plain gallery walls in the cut, only so the band is seen between its willow banks (the world builds the real ones)
    const brng = rng.fork ? rng.fork('banks') : rng, bp = [], bc = [], bi = [];
    for (const sd of [-1, 1]) {
      const base = bp.length / 3, p1 = brng.range(0, 6), p2 = brng.range(0, 6), n = 420;
      for (let i = 0; i <= n; i++) {
        const sB = -250 + i * 3, c = courseAt(sB, C), lat = sd * (48 + 5 * Math.sin(sB * 0.021 + p1));
        const h = 8.5 + 6 * Math.sqrt(Math.abs(Math.sin(sB * 0.052 + p1))) + 2.2 * Math.sqrt(Math.abs(Math.sin(sB * 0.131 + p2))) + 1.5 * Math.sin(sB * 0.023 + p2);
        bp.push(c.x + c.tz * lat, -0.5, c.z - c.tx * lat, c.x + c.tz * lat, h, c.z - c.tx * lat); bc.push(1.05, 9, 0, 0, 9, 0);
        if (i < n) { const a = base + i * 2; bi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('cut', new THREE.Float32BufferAttribute(bc, 3));
    bg.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(bp.length).fill(0).map((_, k) => (k % 3 === 2 ? 1 : 0)), 3));
    bg.setIndex(bi);
    const banks = new THREE.Mesh(bg, overlayMaterial(glass, { skins: 3, wobble: 0.22 })); banks.frustumCulled = false; object.add(banks);
  }
  await ctx.yield();

  // --- anchors (local space = the brief's world coordinates: entry at the origin, +Z upstream) ---
  const exitS = C.bendStart + C.radius * (opts.exitAngle ?? 1.2217);       // where the path leaves the band (70 degrees round)
  const ex = courseAt(exitS, C), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const portalPos = V3(ex.x + ex.tx * 62, 4, ex.z + ex.tz * 62);
  const braidAt = (s) => { const b = U.uBraid.value; return Math.sin(s * b.x + 1.3) * b.z + Math.sin(s * b.y) * b.z * 0.5; };
  const bandPoint = (s, h = 0.5, side0 = 0) => { const p = courseAt(s, C), side = side0 + braidAt(s); return V3(p.x + p.tz * side, U.uBandP.value.z + bandDepth * h, p.z - p.tx * side); };
  const flyThrough = [V3(0, 2.5, 0), V3(0, 2.6, 60), V3(0, 5, 150), V3(0, 4.6, 235), bandPoint(275, 0.12), bandPoint(330, 0.1), bandPoint(390, 0.1),
    bandPoint(440, 0.12), V3(ex.x, 1.6, ex.z), V3(ex.x + ex.tx * 30, 3.2, ex.z + ex.tz * 30), portalPos.clone()];
  const cS = opts.centerS ?? 330, cP = bandPoint(cS, 0.5);
  const anchors = {
    course: C, courseAt: (s) => courseAt(s, C), courseNearest: (x, z) => courseNearest(x, z, C), bandPoint,
    portalSeat: { position: portalPos, normal: V3(-ex.tx, 0, -ex.tz), radius: 7 },
    flyThrough, exitS,
    viewpoints: { reveal: V3(0, 5, 150), drop: V3(0, 4.6, 235), closest: bandPoint(300, 0.1), bendAway: bandPoint(380, 0.1) },
    band: { halfWidth: bandHalf, depth: bandDepth, base: 0.5 },
  };

  // --- state ---
  let fallOverride = pin && pin[5] >= 0 ? pin[5] : -1;
  const escort = opts.escort ?? true, strikes = opts.strikes || [0.31, 0.52, 0.8];
  const nbAway = typeof opts.neighboursAway === 'function' ? opts.neighboursAway : null;   // (p3)
  // the escort's stations: [u, right, up, ahead (m from the eye), scale, pitch, yaw]
  // (o5) it ranges: low left at the entry, high right over the lily raft, large while it hangs, away to the right over the
  // water lily, gone far ahead through the umbel gate (u 0.5-0.66), back on the left for the lone willow, high right
  // in the channel, then ahead on the centre line into the portal. Its tail never reaches the foot of the frame.
  const ESC = opts.escortStations || [[0, -0.3, -0.1, 0.66, 2.1, 0.85, 0.1], [0.05, -0.3, -0.1, 0.66, 2.1, 0.85, 0.1], [0.09, -0.4, -0.02, 0.72, 2.0, 0.8, 0.2], [0.15, 0.33, 0.1, 0.8, 2.0, 0.7, -0.25], [0.18, 0.33, 0.1, 0.8, 2.0, 0.7, -0.25],
    [0.245, -0.15, -0.07, 0.5, 2.45, 0.95, 0], [0.3, -0.15, -0.07, 0.5, 2.45, 0.95, 0], [0.335, 0.5, 0.06, 0.85, 2.0, 0.75, -0.3], [0.37, 0.4, 0.0, 0.8, 2.1, 0.8, -0.2], [0.455, 0.36, -0.02, 0.8, 2.2, 0.8, -0.2],
    [0.5, 0.2, 0.3, 9, 1.6, 0.4, 0], [0.655, -0.3, 0.3, 9, 1.6, 0.4, 0], [0.695, -0.44, 0.0, 0.8, 2.1, 0.8, 0.3], [0.72, -0.44, 0.0, 0.8, 2.1, 0.8, 0.3], [0.78, 0.37, 0.12, 0.8, 2.0, 0.7, -0.25], [0.8, 0.37, 0.12, 0.8, 2.0, 0.7, -0.25],
    [0.865, -0.24, -0.04, 0.7, 2.1, 0.8, 0.15], [0.885, -0.24, -0.04, 0.7, 2.1, 0.8, 0.15], [0.93, 0.03, -0.09, 0.86, 2.3, 0.5, 0], [1.01, 0, -0.08, 0.9, 2.3, 0.45, 0]];
  let progress = -1;                                  // progress < 0: exhibit (band everywhere, flowing on time)
  if (pin && pin[3] >= 0) progress = pin[3];
  const inv = new THREE.Matrix4(), camL = new THREE.Vector3(), tmpM = new THREE.Matrix4(), tmpV = new THREE.Vector3(), fwd = new THREE.Vector3();
  const org = new THREE.Vector3(), rgt = new THREE.Vector3(), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
  const sstep = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  if (pin) object.matrixAutoUpdate = false;

  function update(dt, time, camera) {
    if (pin) { // viewer: carry the piece so the orbiting camera sits at a chosen place in the band
      const cp = courseAt(pin[0], C), yaw0 = Math.atan2(cp.tx, cp.tz) + (pin[4] || 0) * Math.PI / 180;
      camera.getWorldDirection(fwd); const yawC = Math.atan2(fwd.x, fwd.z);
      camera.getWorldPosition(tmpV);
      object.matrix.makeRotationY(yawC - yaw0);
      const po = (pin[2] || 0) + braidAt(pin[0]);
      const lp = V3(cp.x + cp.tz * po, pin[1], cp.z - cp.tx * po).applyMatrix4(object.matrix);
      object.matrix.setPosition(tmpV.x - lp.x, tmpV.y - lp.y, tmpV.z - lp.z);
      object.matrixWorld.copy(object.matrix); object.updateMatrixWorld(true);
    }
    object.updateWorldMatrix(true, false);
    inv.copy(object.matrixWorld).invert();
    camera.getWorldPosition(camL).applyMatrix4(inv);
    U.uCamL.value.copy(camL);
    GU.uTime.value = time;
    const camS = courseNearest(camL.x, camL.z, C);
    const u = progress;
    GU.uProgress.value = u < 0 ? 1 : u;
    U.uLife.value.y = u < 0 ? 1 : 0;
    const flow = u < 0 ? time * 9.0 : 1.3 * pathLength * Math.max(0, u - 0.47) + time * 1.5;
    const front = u < 0 ? 1e4 : -120 + 240 * THREE.MathUtils.clamp((u - 0.455) / 0.08, 0, 1) + 3000 * sstep(0.53, 0.6, u);
    U.uWin.value.set(camS, U.uWin.value.y, flow, front);
    U.uSight.value.set(portalPos.x, portalPos.y + 1.5, portalPos.z, u < 0 ? 0 : sstep(0.58, 0.66, u));
    if (sky) sky.position.copy(camL);
    // neighbours: lanes in a frame that rides with the eye (or stands at the centre while exhibited)
    const riding = u >= 0 || !!pin, un = u >= 0 ? u : 0.5;
    const tc = courseAt(riding ? camS : cS, C);
    let tilt = 0;
    if (riding) { camera.getWorldDirection(fwd).transformDirection(inv); tilt = Math.tan(THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(fwd.y, -1, 1)), -0.25, 0.85)); fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(tc.tx, 0, tc.tz); fwd.normalize(); org.copy(camL); }
    else { fwd.set(tc.tx, 0, tc.tz); org.copy(cP); }
    rgt.set(-fwd.z, 0, fwd.x);
    const gatherN = u < 0 ? 1 : sstep(0.47, 0.53, u), spread = riding ? 1 : 5;
    const clock = u >= 0 ? u * 40 : time;
    const nbK = nbAway && u >= 0 ? 1 - THREE.MathUtils.clamp(nbAway(u), 0, 1) : 1;   // (p3) 1 = as ever; 0 = none (they are held 0.15 m over the water and would line up on the skin above a route under it)
    for (let i = 0; i < NN; i++) {
      const l = lanes[i];
      let z = ((l.z + l.v * clock) % 4.6 + 4.6) % 4.6 - 1.0;
      let sc = l.sc * 1.55 * sstep(3.6, 3.0, z) * sstep(-1.0, -0.7, z), w0 = 0;
      const dn = 1 - gatherN;   // the dance: the neighbours spread to every quarter of the frame, larger, rising and falling
      let x = l.x * (1 + 0.55 * dn) + Math.sin(time * 0.7 + l.ph) * 0.07, y = l.y * (1 + 0.5 * dn) + 0.1 * dn + Math.sin(time * 0.9 + l.ph * 2) * 0.05 + dn * Math.sin(time * 1.4 + l.ph) * 0.3;
      sc *= 1 + 0.45 * dn; z = z * (1 - 0.1 * dn) + 2.0 * dn;
      if (riding && z < 1.0) { const k = 1.0 - z; x += Math.sign(l.x) * k * 0.25; }   // nobody flies through the lens
      if (riding) { const zl = Math.max(z, 0.5); x = Math.max(-0.8 * zl, Math.min(0.8 * zl, x)); y = Math.max(-0.42 * zl, Math.min(0.4 * zl, y)); }   // (round 3) and nobody is cut in half by the edge of the frame
      if (i === 0 && riding) { const w = sstep(0.53, 0.56, un) * (1 - sstep(0.64, 0.67, un)); w0 = w; x += (0.085 - x) * w; y += (-0.125 - y) * w; z += (0.46 - z) * w; sc += (2.5 - sc) * w; }
      if (i === 1 && riding) { const w = sstep(0.572, 0.584, un) * (1 - sstep(0.616, 0.628, un)); x += (-0.34 + 1.1 * (un - 0.584) / 0.032 - x) * w; y += (0.1 - y) * w; z += (0.3 - z) * w; sc += (2.3 - sc) * w; }
      tmpV.copy(org).addScaledVector(rgt, x * spread).addScaledVector(fwd, z * spread); tmpV.y += y * (riding ? 1 : 2.5) + tilt * Math.max(z, 0) * spread;
      if (tmpV.y < 0.15) tmpV.y = 0.15;
      const yaw = (l.yaw * (1.6 - gatherN) + Math.sin(time * 0.5 + l.ph) * 0.12) * (1 - 0.8 * w0), pitch = (0.2 + 0.35 * (1 - gatherN) + Math.sin(time * 1.1 + l.ph) * 0.06) * (1 - w0) + 0.98 * w0;
      const hx = tc.tx * Math.cos(yaw) + tc.tz * Math.sin(yaw), hz = tc.tz * Math.cos(yaw) - tc.tx * Math.sin(yaw);
      bx.set(hx * Math.cos(pitch), Math.sin(pitch), hz * Math.cos(pitch)); bz.set(-hz, 0, hx).negate(); by.crossVectors(bz, bx);
      const S = W * sc * nbK;
      tmpM.makeBasis(bx, by, bz).scale(tmpV2.set(S, S, S)).setPosition(tmpV);
      neighbours.setMatrixAt(i, tmpM);
    }
    neighbours.instanceMatrix.needsUpdate = true;
    // hunters: faster than anything else, weaving through the band and wrapping far ahead
    for (let i = 0; i < ND; i++) {
      const l = dlanes[i], zz = ((l.z + l.v * clock) % 130 + 130) % 130 - 30;
      const sD = (riding ? camS : cS) + (riding ? zz : zz * 0.35), cc = courseAt(sD, C);
      const wv = Math.sin(sD * l.wl + l.ph), dw = Math.cos(sD * l.wl + l.ph) * l.wl * bandHalf * 0.5;
      const lat = l.lat * bandHalf * 0.5 + wv * bandHalf * 0.5 * 0.5;
      tmpV.set(cc.x + cc.tz * lat, 0.5 + bandDepth * (l.h + 0.15 * Math.sin(sD * 0.07 + l.ph * 2)), cc.z - cc.tx * lat);
      const yw = Math.atan(dw * 0.5), hx = cc.tx * Math.cos(yw) + cc.tz * Math.sin(yw), hz = cc.tz * Math.cos(yw) - cc.tx * Math.sin(yw);
      bx.set(hx, 0, hz); bz.set(-hz, 0, hx).negate(); by.set(0, 1, 0);
      by.addScaledVector(bz, -yw * 0.8).normalize(); bz.crossVectors(bx, by);
      const S = l.sc * sstep(100, 85, zz) * sstep(-30, -24, zz);
      tmpM.makeBasis(bx, by, bz).scale(tmpV2.set(S, S, S)).setPosition(tmpV);
      hunters.setMatrixAt(i, tmpM);
    }
    if (escort && riding && ND > 0) {
      // the escort: hunter 0 holds 0.5-0.8 m ahead and below the eye, off centre, back toward us (the plan view);
      // it hangs at u 0.3, then strikes there and three times in the band, and is back within 3 s
      let dart = 0; for (const us of strikes) { const k = (un - us) / 0.07; if (k > 0 && k < 1) dart = Math.sin(Math.min(1, k * 3.2) * Math.PI * 0.5) * (1 - sstep(0.3, 1, k)); }
      // it is never in the same place twice: low and left at the entry, a third of the frame and nearer while it
      // hangs (u 0.27-0.3), up and left through the turn, right of centre in the band, then ahead on the centre
      // line leading us into the portal, seen from behind
      let ka = ESC[0], kb = ESC[0];
      for (let i = 0; i < ESC.length - 1; i++) if (un >= ESC[i][0]) { ka = ESC[i]; kb = ESC[i + 1]; }
      const kt = sstep(ka[0], kb[0], un), kx = (j) => ka[j] + (kb[j] - ka[j]) * kt;
      const hang = sstep(0.25, 0.27, un) * (1 - sstep(0.3, 0.31, un));
      const ex = kx(1) + Math.sin(time * 0.43) * 0.05 * (1 - hang) + dart * 0.9, ey = kx(2) + Math.sin(time * 0.61) * 0.03 * (1 - hang) + dart * 0.35;
      const ez = kx(3) + Math.sin(time * 0.37) * 0.08 * (1 - hang) + dart * 2.6;
      tmpV.copy(camL).addScaledVector(rgt, ex).addScaledVector(fwd, ez); tmpV.y = Math.max(0.12, tmpV.y + ey + tilt * Math.min(ez, 1.2));
      const pt = kx(5) - dart * 0.5, yw = dart * 0.5 + Math.sin(time * 0.5) * 0.06 + kx(6);
      const hx = fwd.x * Math.cos(yw) - rgt.x * Math.sin(yw), hz = fwd.z * Math.cos(yw) - rgt.z * Math.sin(yw);
      bx.set(hx * Math.cos(pt), Math.sin(pt), hz * Math.cos(pt)); bz.set(-hz, 0, hx).negate(); by.crossVectors(bz, bx);
      const S = kx(4);
      tmpM.makeBasis(bx, by, bz).scale(tmpV2.set(S, S, S)).setPosition(tmpV);
      hunters.setMatrixAt(0, tmpM);
    }
    hunters.instanceMatrix.needsUpdate = true;
    leafMat.uniforms.uLeaf.value.x = fallOverride >= 0 ? fallOverride : (u < 0 ? 0 : sstep(0.82, 0.9, u));
  }

  return {
    object, radius: opts.radius ?? 16, height: 6, center: cP, anchors, glass,
    setProgress(u) { progress = u; },
    setFall(f) { fallOverride = f; },
    setViewport(h) { GU.uViewH.value = h; },
    update, dispose() {}, ground: false, groundY: 0,
  };
}
