// LIGHT FROM THE LEFT: hero set piece and the style kit of the world (after Johannes Vermeer, 1632 to 1675).
//
// WHAT IT IS. The open casement and what it opens on: a piece of the port wall (plaster inside, brick, stone sill and green
// shutters outside), an oak cross-window with two milky leaded top lights and two lower leaves swung inward on their hinges
// (real lead bars, glass that holds a broken, sliding reflection of the room), the carpet table under it (Turkey carpet pushed
// into a ridge, white jug with pewter lid, bread in a wicker basket, blue cloth, pearls, lemon ribbon, about 900 pointilles),
// a ptc of chequer floor, and (opts.vista) a light version of the harbour: sand quay, water, the town in one band with its
// mirrored double, the pale tower, the yellow wall, a sky dome with the slate cloud.
//
// COORDINATES. Everything is built in ROOM coordinates, the brief's own: +x port (window wall at x = 9), y 0 the marble
// floor, +z the room's length. The hero's local frame has its origin at the foot of the casement (room 9, 0, 29), front (+Z)
// looking into the room. To make hero space equal the brief's world space: hero.object.position.set(9, 0, 29);
// hero.object.rotation.y = -Math.PI / 2 (anchors.placement). roomToLocal / localToRoom convert points. hero.room is the
// Object3D whose local space is room coordinates: add your own room-coordinate meshes to it or to your scene.
//
// SIZE AND COST. radius 9, height 11 (the casement and table; the vista reaches x 230). About 46k triangles and 13 draw calls
// with the vista (30k and 9 without), build about 90 ms in steps under 50 ms, 5 shader programs, no lights, no textures.
//
// OPTS. palette (7 hexes, brief order), detail 0.6..1, weather 'cloud' | 'rain' | 'pearl' (else drawn from the seed), golden 0..1,
// exposure (the world's post.exposure, default 1), flat (true if the world runs post.flat), table / floor / vista / sky (false to
// leave that part to the world), wallZ0, wallZ1 (extent of the wall piece, default 18..40), floorZ0, floorZ1 (12..42), outY0.
//
// ANCHORS (hero-local Vector3s). placement; gap (centre of the opening between the leaves, 8.8 m clear) and gapOut (the way
// out); flyThrough (the brief's course from the door end, along the table, out through the gap, down to the water and to the
// arch: keep 3.5 m from the leaves); portalSeat { position, facing } in the bridge arch; viewpoints { first, reveal, closest,
// threshold }; carpetRidge, jug, basket; leafHinges.
//
// MOTION. update(dt, time, camera) refreshes the build's uniforms (eye, world-to-room matrix, pixel size) and must be called
// every frame, also while seen through a portal. setProgress(u) keys the light to the path: the cloud field slides 570 m over
// u 0..1 and by nothing else (so each window's pool swells and fades in turn, the ten cumulus and the bank's breaks drift to
// starboard, and outdoors the lemon strip runs along the roofs and stands on the arch at z 96 when u = 1). The leaves swing
// on the clock, each from phases of its own. Until setProgress is called the field runs on time (preview only).
//
// STYLE EXPORTS (shade the whole world with these; all take the build's own set, hero.uniforms, so the hero never looks pasted in):
//   Soft contours are painted in the material (melt): one clean edge, no veils. KIND.wash = limewash, KIND.ceil = the pale
//   ceiling with its beams painted soft-edged, KIND.tree = lime crowns (outdoorMaterial({ crown: true }) is their soft outer veil).
//   STYLE_GLSL      fragment/vertex chunk: toScene (display colour -> scene value through the engine's tone map; exact
//                   colour), cloudField, roomPool (the three windows' soft pools with box occluders), roomGrade (the wall's
//                   seamless grade), roomLight, paint (pigment -> shade, never black), wallTone, melt (soft contour),
//                   townSun and paintOut (outdoors: near shade, far strip).
//   STYLE_VERT      the shared vertex stage; Geo writes the attributes it wants (aCol display rgb + melt, aKind, uv in metres).
//   KIND            surface kinds for aKind: object, plaster, floor (the diagonal chequer), carpet, tiles, wood, pane (indoors
//                   milky; in outdoorMaterial a dark leaded light), leaf, brick, roof, water, sand, hull, wash, ceil, tree,
//                   far (outdoorMaterial({ far: true }): the far side of the bridge arch, a canal between house fronts painted
//                   along the ray, in shade until the field's gap lands on it; laid in the opening and, doubled, under the water).
//   hero.uniforms.uBank: the slate bank's place (x of its far edge: 300, which is 36 m beyond the town's far edge at x 264, the rim's line standing 11 m short of it in the mean, so slate stands above the roofs from every eye on the harbour; 335 after rain, 350 in the pearl overcast; y of its belly), wet 0..1, pearl 0..1; uPool: the pools' floor and slowness.
//   roomMaterial(U) indoor surfaces; glassMaterial(U, { leaf }) leaded glass; outdoorMaterial(U, { water }) town, quay, hulls, water;
//                   skyMaterial(U) for a camera-following dome; beadMaterial(U) + makeBeads(list, material) the pointilles. U = hero.uniforms.
//   Geo             mesh builder: quad, box (chamfered), grid, lathe, build().
//   setStyle(U, { exposure, flat, cloud, stripLo, stripHi, indoorFloor, golden }), updateStyle(U, camera, roomObject, time),
//   PALETTE, MIXES, disp(hex), makeStyleUniforms() (uOccMin / uOccMax are the three shadow boxes: table, chair, curtain).
import * as THREE from 'three';

// ------------------------------------------------------------------------------------------------------------
// Pigments (display colours). The first seven are the brief's palette (opts.palette overrides them in order),
// the rest are the workshop's named mixes.
export const PALETTE = ['#E9E6D8', '#E6CE58', '#2B4A8C', '#8D9AA3', '#A3352B', '#86A5CC', '#1C1A1A'];
export const MIXES = { slate: '#5B6570', tile: '#B5472E', ochre: '#B98A3E', sand: '#C8A982', green: '#4C6A72', umber: '#5A4632', cream: '#E4E2D2' };
const hexV = (h) => { const n = parseInt(h.slice(1), 16); return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
export const disp = (h) => { const v = hexV(h); return [v.x, v.y, v.z]; };   // '#hex' -> display rgb 0..1 (NOT linear): albedo attributes hold these

// One set of uniforms for ONE BUILD, shared by every material of that build (same objects, so one write moves everything
// in that build and nothing in another): buildHero makes a fresh set and gives it out as hero.uniforms. No set lives in the module.
export const makeStyleUniforms = () => ({
  uRoomFromWorld: { value: new THREE.Matrix4() },      // world -> room coordinates (the brief's metres)
  uEye: { value: new THREE.Vector3(0, 3.3, -20) },     // camera in room coordinates
  uCloud: { value: 0 },                                // metres the cloud field has slid (3 x path distance)
  uStrip: { value: new THREE.Vector4(0.86, 0.97, 0.55, 0) },   // strip edge lo, hi; indoor floor; golden 0..1
  uToneK: { value: 0.6 },                              // 0.6 / post.exposure
  uFlat: { value: 0 },                                 // 1 when the world runs post.flat (no tone map): colours are written as they are
  uTime: { value: 0 },
  uLive: { value: 0 },                                 // 0..1: the next world's picture stands in the portal (the world eases it)
  uBank: { value: new THREE.Vector4(300, 112, 0, 0) }, // the slate bank: x of its far edge (the edge toward the town's back, paler; 300 = 36 m beyond the town's far edge at x 264; the rim's line stands 11 m short of it in the mean), y of its belly; z = wet 0..1 (after rain); w = pearl 0..1 (overcast)
  uPhase: { value: new THREE.Vector4(0, 0, 0, 0) },    // start phases (seconds) of the clock loops: the water's tremble, the walls' waver, the marble's and the glass's shimmer, the crowns' stir
  uPool: { value: new THREE.Vector2(0.22, 1) },        // a window pool's floor under the field (pearl: faint), and how many times slower it swells (pearl: slow)
  uCloth: { value: 0 },                               // 0 red carpet (default), 1 the blue and ochre carpet
  uPx: { value: 1 / 900 },                             // tan(fov/2)*2 / viewport height: metres per pixel at 1 m, on a picture of 720 lines or more
  uPxLo: { value: 1 / 900 },                           // the same for the picture as it is (100 lines at the least)
  // (with no renderer at hand both stay on the 720 picture: updateStyle below)
  uWhite: { value: hexV(PALETTE[0]) }, uShade: { value: hexV(PALETTE[3]) }, uLemon: { value: hexV(PALETTE[1]) },
  uUltra: { value: hexV(PALETTE[2]) }, uRed: { value: hexV(PALETTE[4]) }, uSky: { value: hexV(PALETTE[5]) }, uBlack: { value: hexV(PALETTE[6]) },
  uLeafA: { value: new THREE.Vector4(1, 0, 0, 0) },    // reflecting leaf plane (room coords): normal xyz, d
  uOccMin: { value: [new THREE.Vector3(3, 0, 15), new THREE.Vector3(-4.1, 0, 8.9), new THREE.Vector3(-9, 0, 1)] },
  uOccMax: { value: [new THREE.Vector3(7.5, 2.3, 27), new THREE.Vector3(-1.9, 3.4, 11.1), new THREE.Vector3(-4, 10.5, 6)] },
});

const TONE = (() => {
  const inv = (e) => new THREE.Matrix3().fromArray(e).invert().elements.map((v) => v.toFixed(6)).join(',');
  return { inI: inv([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]),
    outI: inv([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]) };
})();

// STYLE_GLSL: everything a fragment shader needs to paint in this hand. All positions are ROOM coordinates.
export const STYLE_GLSL = /* glsl */`
uniform mat4 uRoomFromWorld;
uniform vec3 uEye, uWhite, uShade, uLemon, uUltra, uRed, uSky, uBlack;
uniform vec4 uStrip, uLeafA;
uniform float uCloud, uToneK, uTime, uPx, uPxLo, uFlat, uCloth, uLive;
uniform vec4 uBank, uPhase; uniform vec2 uPool;
uniform vec3 uOccMin[3], uOccMax[3];

// display colour (sRGB 0..1, what the picker will read) -> scene-linear value for the engine's ACES + sRGB
vec3 toScene(vec3 D){
  vec3 d = clamp(D, 0., 1.);
  vec3 lin = mix(d/12.92, pow((d + 0.055)/1.055, vec3(2.4)), step(0.04045, d));
  if (uFlat > 0.5) return lin;
  vec3 y = clamp(mat3(${TONE.outI})*clamp(lin, 0., 0.95), 0.0004, 0.97);
  vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, Cc = 0.238081*y + 0.000090537;
  vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
  return max(mat3(${TONE.inI})*v, 0.)*uToneK;
}
float vhash(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(vhash(i), vhash(i + vec2(1., 0.)), f.x), mix(vhash(i + vec2(0., 1.)), vhash(i + vec2(1., 1.)), f.x), f.y); }

// THE CLOUD FIELD: one smooth periodic function of place (room z) sliding with uCloud. x = the sun strip
// outdoors (0 shade .. 1 struck), y = the indoor window light (uStrip.z .. 1). A gap stands at z 96 when uCloud = 570.
// THE POOLS' RULE, the same in every weather: each of the pools' two waves stands at the three windows a fixed share of
// its own period apart, the share the windows' own places (z 7.5, 29, 49) are of the wave's period where it is not
// slowed: 21.5/64 and 41.5/64 of the first wave's period (about a third and two thirds, so one pool is always up),
// 21.5/106.6667 and 41.5/106.6667 of the second's. A slowed weather stretches a wave about each window's own place and
// not about one point of the room, so the pools keep their turns; where a wave is not slowed the added phase is exactly
// nothing and the field is the plain function of place. The start is the field's own (its anchor 474 and its two waves).
float poolPlace(float z){ return 7.5 + 21.5*smoothstep(14., 22., z) + 20.*smoothstep(36., 43., z); }   // the window a place belongs to; it steps in the bare piers
vec2 cloudField(float z){
  float q = z - uCloud + 474.;
  float c = 0.5 + 0.5*cos(6.2831853*q/320.);
  float pb = mix(106.6667, 320., step(1.5, uPool.y)), w = 6.2831853*poolPlace(z);
  float a = 0.5 + 0.5*cos(6.2831853*q/(64.*uPool.y) + 4.67 + w*(uPool.y - 1.)/(64.*uPool.y)), b = 0.5 + 0.5*cos(6.2831853*q/pb + 4. + w*(pb - 106.6667)/(106.6667*pb));
  float f = smoothstep(0.2, 0.62, a + 0.18*(b - 0.5));
  return vec2(smoothstep(uStrip.x, uStrip.y, c), mix(uStrip.z, 1., f));
}
// a window's pool under the field: the room's wash only sinks to uStrip.z, the pool itself nearly goes out, so its
// soft edge is seen travelling along wall and floor
float poolField(float z){ return mix(uPool.x, 1., clamp((cloudField(z).y - uStrip.z)/max(1. - uStrip.z, 0.05), 0., 1.)); }
float occBox(vec3 p, vec3 d, vec3 mn, vec3 mx){
  vec3 inv = 1./d;                                        // d has no zero component by construction (see roomPool)
  vec3 t0 = (mn - p)*inv, t1 = (mx - p)*inv;
  vec3 a = min(t0, t1), b = max(t0, t1);
  float tn = max(max(a.x, a.y), max(a.z, 0.06)), tf = min(b.x, min(b.y, b.z));
  return 1. - smoothstep(0., 0.5 + 0.12*tn, tf - tn);
}
float winRect(vec2 h, float z0, float z1, float soft){
  return smoothstep(z0 - soft, z0 + soft, h.x)*(1. - smoothstep(z1 - soft, z1 + soft, h.x))
       * smoothstep(2. - soft, 2. + soft, h.y)*(1. - smoothstep(10. - soft, 10. + soft, h.y));
}
// the soft pools each window lays. His light is a wash from the north sky, not a beam, so a window is imaged twice:
// down a 35 degree slant (17 m of floor, the table) and along a low 9 degree slant (the pool on the wall that faces
// the windows: at three times life the steep ray alone never reaches that wall). Each ray is tested against the
// three window rectangles in the plane x = 9 with soft edges (0.3 m plus 4 percent of distance) and the three box
// occluders; the cloud is read where the ray meets the glass, so a pool fills from one side and the light travels.
float winAll(vec3 p, vec3 d, out float t){
  t = max(9. - p.x, 0.)/d.x;
  vec2 h = vec2(p.z + d.z*t, p.y + d.y*t);
  float soft = 0.3 + 0.075*t;
  return (winRect(h, 3., 12., soft) + winRect(h, 24., 34., soft) + winRect(h, 45., 53., soft))*poolField(h.x);
}
float occAll(vec3 p, vec3 d){ return occBox(p, d, uOccMin[0], uOccMax[0])*occBox(p, d, uOccMin[1], uOccMax[1])*occBox(p, d, uOccMin[2], uOccMax[2]); }
// wrapK 0: a wall or floor takes the pool by its facing; 1: a round thing in the pool is lit most of the way round
float roomPoolN(vec3 p, vec3 n, float wrapK){
  vec3 dS = vec3(0.7094, 0.5736, 0.4096), dL = vec3(0.9877, 0.1564, 0.0001);
  float tS, tL;
  float s = winAll(p, dS, tS)*occAll(p, dS), l = winAll(p, dL, tL)*occAll(p, dL);
  float lo = mix(-0.2, -0.95, wrapK), hi = mix(0.55, 0.25, wrapK);
  s *= smoothstep(lo, hi, dot(n, dS)); l *= smoothstep(lo, hi, dot(n, dL))*mix(1., 0.45, smoothstep(0.3, 0.9, n.y));
  // and the far window's light slanting onto the closed back wall, across the map
  vec3 dB = vec3(0.8, 0.2, -0.566); float tB;
  float b = winAll(p, dB, tB)*occAll(p, dB)*smoothstep(lo, hi, dot(n, dB))*smoothstep(0.2, 0.7, -n.z + 0.6*wrapK)*smoothstep(40., 46., p.z);
  return clamp(max(max(s, l), b), 0., 1.)*step(p.x, 8.99);
}
float roomPool(vec3 p){ return roomPoolN(p, vec3(0.6, 0.8, 0.), 0.); }
// the wall grade: sky light spreading from the three windows, falling without a step with distance from the
// nearest jamb (faster along the room than across it, so the wall facing a window is lighter than the wall between
// two); surfaces turned to the window take more, the window wall itself (normal -x) almost none; the corner where
// the facing wall meets the closed wall, and the wall under the ceiling, sink to the shade.
float gGrade0;
float roomGrade(vec3 p, vec3 n){
  vec3 w1 = vec3(9., 6., clamp(p.z, 3., 12.)) - p, w2 = vec3(9., 6., clamp(p.z, 24., 34.)) - p, w3 = vec3(9., 6., clamp(p.z, 45., 53.)) - p;
  float d1 = length(w1), d2 = length(w2), d3 = length(w3);
  vec3 an = vec3(0.25, 1.0, 1.6);
  float f1 = cloudField(clamp(p.z, 3., 12.)).y/(1. + dot(w1*w1, an)*0.004), f2 = cloudField(clamp(p.z, 24., 34.)).y/(1. + dot(w2*w2, an)*0.004), f3 = cloudField(clamp(p.z, 45., 53.)).y/(1. + dot(w3*w3, an)*0.004);
  float g = max(f1, max(f2, f3))*0.8 + (f1 + f2 + f3)*0.1;
  vec3 dir = (w1*f1/max(d1, 0.01) + w2*f2/max(d2, 0.01) + w3*f3/max(d3, 0.01))/max(f1 + f2 + f3, 0.01);
  dir = dir + vec3(0.4, 0.22, 0.); dir /= max(length(dir), 1e-3);
  float face = 0.5 + 0.5*dot(n, dir);
  float corner = mix(0.03, 1., smoothstep(0., 6.5, max(p.x + 9., 0.) + max(54. - p.z, 0.)))*mix(0.34, 1., smoothstep(0., 3.4, 11. - p.y + 1.6*smoothstep(-0.5, -0.9, n.y)));
  gGrade0 = g*corner;
  float jz = min(max(abs(p.z - 7.5) - 4.5, 0.), min(max(abs(p.z - 29.) - 5., 0.), max(abs(p.z - 49.) - 4., 0.)));
  float jy = max(max(2. - p.y, p.y - 10.), 0.);
  float bounce = 0.2*smoothstep(-0.2, -0.9, n.x)*smoothstep(0.3, 6.5, jz + 0.8*jy)*(0.55 + 0.45*cloudField(p.z).y)*mix(0.5, 1., smoothstep(0.2, 5., 11. - p.y))*mix(1.75, 0.8, smoothstep(0.4, 8., p.y));   // the window wall takes the floor's light: palest at the skirting
  // the window wall is dark against its glass, but each reveal throws its light back on the plaster beside the jamb
  // (and under the sill, over the head): brightest at the arris, gone into shade two metres along the pier
  float zn = clamp(p.z, 7.5 - 4.5, 7.5 + 4.5); if (abs(p.z - 29.) - 5. < abs(p.z - zn)) zn = clamp(p.z, 24., 34.); if (abs(p.z - 49.) - 4. < abs(p.z - zn)) zn = clamp(p.z, 45., 53.);
  float jamb = smoothstep(-0.2, -0.9, n.x)*exp(-jz*1.05 - jy*1.2)*poolField(zn)*0.5;
  float inner = clamp(g*corner*mix(0.05, 1.1, smoothstep(0.1, 0.6, face))*mix(1., 0.3, smoothstep(-0.3, -0.9, n.x)) + bounce + jamb, 0., 1.);
  // inside the opening itself (reveals, sill, frame) the sky lies on everything turned to it
  return mix(inner, cloudField(p.z).y*mix(0.55, 1., smoothstep(-0.9, 0.3, n.x + 0.6*n.y)), smoothstep(9.02, 9.3, p.x));
}
// obj 0 = the room's own surfaces; 1 = a thing standing in the room: the pool wraps it and the white walls give it back some light
float roomLightK(vec3 p, vec3 n, float obj){
  vec3 ng = n + obj*vec3(0.38, 0.12, 0.); ng /= max(length(ng), 1e-3);            // a thing in the room is lit a little way round: white jug, blue-grey shade side
  float g = roomGrade(p, ng);
  float fill = obj*0.34*gGrade0*(0.7 + 0.3*n.y);
  float pool = roomPoolN(p, n, obj);
  float wash = 0.76*(1. - exp(-2.4*g))*mix(1.0, 0.8, n.y*n.y*step(0., n.y));          // the white wall is the room's sky: light almost everywhere, shade only where the grade sinks
  return clamp(wash + fill*0.5 + pool*(0.58 + 0.3*g), 0., 1.);
}
float roomLight(vec3 p, vec3 n){ return roomLightK(p, n, 0.); }
// how far a pigment is one of the WHITE things (plaster, whitewash, cap, jug, stone): 1 for them, 0 for every coloured thing
float whiteness(vec3 alb){
  float mx = max(alb.r, max(alb.g, alb.b)), mn = min(alb.r, min(alb.g, alb.b));
  return smoothstep(0.42, 0.62, mn)*(1. - smoothstep(0.16, 0.34, (mx - mn)/max(mx, 0.05)));
}
// light 0..1 -> the painted colour: full light shows the pigment. Shade: a WHITE thing is broken with ultramarine and
// black and lands exactly on uShade; a COLOURED thing keeps its pigment and only sinks in value, with a trace of
// ultramarine in it (carpet a deep red, velvet a deep blue, oak a dark umber); never pale grey, never black or brown.
vec3 paint(vec3 alb, float light){
  vec3 k = uShade/max(uWhite, vec3(0.01));
  vec3 shW = alb*k*0.92 + 0.045*uUltra*(1. - alb);
  shW = mix(shW, vec3(dot(shW, vec3(0.3, 0.5, 0.2)))*vec3(0.93, 1., 1.1), 0.12);
  vec3 shC = alb*vec3(0.54, 0.57, 0.64) + 0.04*uUltra*(1. - alb);
  return mix(mix(shC, shW, whiteness(alb)), alb, light);
}
// the bare wall's tone at a point: what contours melt into
vec3 wallTone(vec3 p){ return paint(uWhite, roomGrade(vec3(clamp(p.x, -8.9, 8.9), p.y, p.z), vec3(-0.6, 0., -0.8))); }
// soft contour: mix toward the local wall tone as the normal turns from the eye; the rim widens as the eye nears
vec3 melt(vec3 col, vec3 p, vec3 n, float amount){
  vec3 v = uEye - p; float dist = length(v); v /= max(dist, 1e-3);
  float rim = 1. - abs(dot(n, v));
  float wide = mix(0.78, 0.3, smoothstep(2.5, 40., dist));
  return mix(col, wallTone(p), amount*smoothstep(1. - wide, 1.02, rim)*0.9);
}
// OUTDOORS: the near band in the slate cloud's shade, one strip of the far roofs and the tower struck.
// The slate bank's shadow ends on a slanted plane behind the first row of fronts (the sun is low behind us): every
// wall, gate and roof this side of it stands in shade, the roofs behind and the tower are struck where the field's
// gap lies on them. The bank's edge is not straight: under every second gap of the field it draws back over the
// bridge (arch at 150, 96, its own axes zb into the town and xb to port), and while that gap lies there the gates'
// ridges and spire tips and the yellow wall behind them (zb 15), from its foot, are struck with the roofs.
const float SHADE_X0 = 171., SHADE_X1 = 184.;   // room x: between these two lines the slate bank's shadow ends on the ground
float townSun(vec3 p){
  vec2 q = p.xz - vec2(150., 96.);
  float zb = q.x*0.8988 + q.y*0.4384, xb = q.x*0.4384 - q.y*0.8988;
  float a = p.z - 0.95*max(p.x - 163.5, 0.);
  float far = smoothstep(SHADE_X0, SHADE_X1, p.x + 0.3*max(p.y, 0.));
  float gate = smoothstep(11.5, 15., zb + 1.6*max(p.y - 9., 0.))*(1. - smoothstep(36., 52., abs(xb)));
  float land = smoothstep(0.78, 0.96, 0.5 + 0.5*cos(6.2831853*(a - uCloud + 474.)/640.));
  return cloudField(a).x*max(far, gate*land);
}
vec3 paintOut(vec3 alb, float sun, float up){
  float warm = clamp((alb.g - alb.b)*2.5 - 0.5, 0., 1.);                       // the lemon of the yellow wall
  float tile = clamp((alb.r - alb.g)*3. - 0.3, 0., 1.)*(1. - warm);
  // shade under the bank: a coloured thing keeps its pigment and sinks in value with a trace of ultramarine (brick a
  // deep red, tile a dark red, the limes a dark blue-green, the yellow wall a dark ochre); only the white things
  // (whitewash, stone) go to the blue-grey shade tone
  vec3 shC = mix(alb, vec3(0.725, 0.54, 0.24)*1.06, min(1., 1.5*warm))*mix(0.6, 0.72, up)*mix(vec3(0.97, 0.99, 1.07), vec3(1.04, 0.98, 0.94), warm) + 0.035*uUltra*(1. - alb)*(1. - warm);
  vec3 shW = alb*(uShade/max(uWhite, vec3(0.01)))*mix(0.9, 1.04, up);
  vec3 sh = mix(shC, shW, whiteness(alb));
  // struck: the strip is lemon-cream light lying ON the thing. Whitewash and stone go to warm white, tile to lemon
  // broken with white (never orange), slate to a pale cream-grey, the limes to a pale lemon-green, what is yellow
  // lands on the lemon; each keeps a little of its own colour, stains and modelling, and what is dark stays dark.
  vec3 lem = mix(uLemon, vec3(0.725, 0.54, 0.24), uStrip.w);
  float la = dot(alb, vec3(0.3, 0.5, 0.2));
  float pale = smoothstep(0.45, 0.7, min(alb.r, min(alb.g, alb.b)));
  vec3 lc = mix(lem, uWhite, mix(mix(0.62, 0.34, tile), 0.86, pale)*(1. - warm));
  float keep = mix(0.8, mix(0.3, 0.16, tile), smoothstep(0.14, 0.36, la))*(1. - warm);
  vec3 lit = mix(lc*(0.8 + 0.42*la), min(alb*vec3(1.2, 1.17, 1.08) + 0.03, vec3(1.)), keep);
  lit = mix(lit, lem*clamp(0.5 + 0.5*la/max(dot(uLemon, vec3(0.3, 0.5, 0.2)), 0.05), 0.6, 1.03), min(1., 1.6*warm));
  lit = mix(lit, lit*vec3(1.04, 0.97, 0.8), 0.5*uStrip.w);
  lit *= 1. + 0.06*uBank.z;                                                    // after rain the strip is narrower and brighter
  return mix(sh, min(lit, vec3(1.)), sun);
}
`;

// ------------------------------------------------------------------------------------------------------------
// Shared vertex stage. Geometry attributes: position, normal, uv (metres on patterned surfaces), aCol (vec4: display
// albedo rgb, a = how much the contour melts 0..1), aKind (float, which surface: see KIND).
export const KIND = { object: 0, plaster: 1, floor: 2, carpet: 3, tiles: 4, wood: 5, pane: 6, leaf: 7, brick: 8, roof: 9, water: 10, sand: 11, hull: 12, wash: 13, ceil: 14, tree: 15, far: 17 };
export const STYLE_VERT = /* glsl */`
uniform mat4 uRoomFromWorld; uniform float uTime; uniform vec4 uPhase;
attribute vec4 aCol; attribute float aKind;
varying vec3 vP, vN; varying vec4 vC; varying vec2 vUv; varying float vKind;
void main(){
  vec4 lp = vec4(position, 1.); vec3 ln = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix*lp; ln = mat3(instanceMatrix)*ln;
  #endif
  #ifdef CROWN
    lp.xyz += ln/max(length(ln), 1e-4)*(1.25 + 0.3*sin((uTime + uPhase.w)*0.5 + position.x*0.37 + position.z*0.29 + position.y*0.2));
  #endif
  vec4 w = modelMatrix*lp;
  vP = (uRoomFromWorld*w).xyz; vN = mat3(uRoomFromWorld)*(mat3(modelMatrix)*ln);
  // the double is one piece from the waterline down, drawn out toward us by 14 in a hundred (the share the sky's own double
  // is drawn out by, in the water and on the dome, so town and sky stay one picture), and it sways slowly as a whole: a
  // drift across the course that grows evenly with the depth under the waterline (2 cm a metre at most) and is the same
  // for neighbouring places (two slow waves 300 and 185 m long across the course), so every edge stays one straight piece
  if (vP.y < -11.02) { float dp = -11. - vP.y; float tw = uTime + uPhase.x, wc = vP.x*0.4384 - vP.z*0.8988; w.xz += vec2(0.4384, -0.8988)*(0.02*dp*(0.6*sin(tw*0.5 + wc*0.021) + 0.4*sin(tw*0.31 - wc*0.034 + 1.7))); w.y -= 0.14*dp; }
  vC = aCol; vUv = uv; vKind = aKind;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;

const ROOM_FRAG = /* glsl */`
${STYLE_GLSL}
varying vec3 vP, vN; varying vec4 vC; varying vec2 vUv; varying float vKind;
float chequer(vec2 xz, float soft){
  vec2 c = vec2(xz.x + xz.y, xz.x - xz.y)*(0.70711/1.5);
  c += 0.035*sin(c.yx*0.83 + vec2(0.4, 2.1));                       // the hand: not quite square
  vec2 fw = max(fwidth(c), vec2(soft));                               // a joint is never a ruled line: blended over 4 cm far off, 14 cm under the eye
  vec2 i = 2.*(abs(fract((c - 0.5*fw)*0.5) - 0.5) - abs(fract((c + 0.5*fw)*0.5) - 0.5))/fw;
  return 0.5 - 0.5*i.x*i.y;
}
#define CS(e, x) smoothstep((e) - sw, (e) + sw, (x))
vec3 carpetAt(vec2 uv, out float knot){
  float fwk = sqrt(max(length(dFdx(uv))*length(dFdy(uv)), 1e-10));     // the footprint's mean, so a grazing view of the near pile is not smeared along the gaze
  knot = mix(vhash(floor(uv/0.014)), 0.5, smoothstep(0.004, 0.009, fwk));
  // the weave: small motifs drawn knot-sharp, then softened over a centimetre or two (wool pile, his blended
  // contour); the rows run a little out of true (a slow wander, never a noise blur); far off it sinks to its mean
  vec2 q = uv + 0.016*sin(uv.yx*vec2(2.3, 1.7) + vec2(0.6, 2.2));
  float sw = 0.012 + 0.8*fwk;
  vec3 och = vec3(0.725, 0.54, 0.24), red = mix(uRed, uUltra*0.92, uCloth), blue = mix(uUltra*0.86, och*0.82, uCloth), blk = uBlack*1.3;
  vec3 cream = mix(uWhite, och, 0.5)*0.86, deep = red*0.62 + 0.02*uUltra;
  float W = 6.6, L = 13.;
  float e = min(min(q.y, W - q.y), min(q.x, L - q.x));               // distance in from the edge
  vec3 col = red;
  // field: a lozenge lattice in ochre thread; in each lozenge a deep red star ringed with ochre, a small blue or
  // ochre heart; a small blue note where the threads cross
  float G = 0.62;
  vec2 g = (q - vec2(L*0.5, W*0.5))/G; vec2 gi = floor(g + 0.5), gf = g - gi;
  float dia = abs(gf.x) + abs(gf.y), sq = max(abs(gf.x), abs(gf.y));
  float odd = mod(gi.x + gi.y, 2.);
  sw /= G;
  col = mix(col, mix(red, och, 0.5), CS(0.455, dia)*(1. - CS(0.5, dia)));
  float star = min(dia, sq*1.3);
  col = mix(col, deep, 1. - CS(0.34, star));
  col = mix(col, och, (1. - CS(0.25, star))*CS(0.2, star)*0.7);
  col = mix(col, mix(blue, och*1.08, odd), 1. - CS(0.1, star));
  float nt = min(abs(abs(gf.x) - 0.5) + abs(gf.y), abs(gf.x) + abs(abs(gf.y) - 0.5));
  col = mix(col, blue, 1. - CS(0.075, nt));
  vec2 hk = abs(abs(gf) - 0.29);
  col = mix(col, blk, (1. - CS(0.035, max(hk.x, hk.y)))*CS(0.36, star)*0.55);
  sw *= G;
  // borders, from the field outward: a cream thread, a deep red band of ochre rosettes with blue hearts, ochre and red guards, black edge
  float along = (min(q.y, W - q.y) < min(q.x, L - q.x)) ? q.x : q.y;
  float ro = abs(fract(along/0.42) - 0.5)*0.42, rb = abs(e - 0.62);
  vec3 band = mix(deep, mix(deep, och, 0.75), 1. - CS(0.15, ro + rb));
  band = mix(band, blue, 1. - CS(0.06, ro + rb));
  band = mix(band, mix(deep, och, 0.5), 1. - CS(0.035, abs(ro - 0.21) + rb*0.5));
  col = mix(col, cream, 1. - CS(1.0, e)); col = mix(col, band, 1. - CS(0.955, e));
  col = mix(col, mix(red, och, 0.6), 1. - CS(0.3, e)); col = mix(col, red*0.9, 1. - CS(0.235, e)); col = mix(col, blk, 1. - CS(0.09, e));
  return col;
}
void main(){
  vec3 n = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) n = -n;
  vec3 alb = vC.rgb; float meltK = vC.a, k = vKind, lightAdd = 0.;
  vec3 p = vP;
  if (k > 0.5 && k < 1.5) {                                          // plaster: seamless, the faintest trowel
    vec2 s = abs(n.x) > 0.5 ? p.zy : (abs(n.z) > 0.5 ? p.xy : p.xz);
    alb = uWhite*(1. + 0.022*(vnoise(s*0.55) - 0.5) + 0.012*(vnoise(s*2.3 + 9.) - 0.5));
  } else if (k < 2.5 && k > 1.5) {                                   // marble chequer
    float ch = chequer(p.xz, 0.028 + 0.065*smoothstep(20., 3.5, length(p - uEye)));
    float vein = vnoise(p.xz*vec2(0.9, 2.3) + 3.*vnoise(p.xz*0.35));
    vec3 wm = uWhite*(0.97 - 0.09*smoothstep(0.5, 0.75, vein)), bm = uBlack*1.8 + 0.06*smoothstep(0.62, 0.8, vein);
    alb = mix(bm, wm, ch);
    vec3 v = p - uEye; vec3 r = vec3(v.x, -v.y, v.z);                 // dull polish: the window's own light lying in the stone
    float t = (9. - p.x)/max(r.x, 1e-3);
    vec2 h = vec2(p.z + r.z*t, r.y*t);
    float wl = winRect(h, 3., 12., 0.9)*poolField(7.5) + winRect(h, 24., 34., 0.9)*poolField(29.) + winRect(h, 45., 53., 0.9)*poolField(49.);
    wl *= 0.78 + 0.44*vnoise(p.xz*vec2(0.5, 0.33) + (uTime + uPhase.z)*vec2(0.45, -0.3));   // the polish trembles: the light in the stone is never still
    float fres = 1. - abs(v.y)/max(length(v), 1e-3);
    lightAdd = step(0., r.x)*wl*fres*fres*mix(0.5, 0.14, ch);
    alb = mix(alb, uShade*0.82, fres*fres*0.6*(1. - ch));        // far off the black tiles take the pale room into their polish
  } else if (k < 3.5 && k > 2.5) {                                   // the Turkey carpet
    float knot; alb = carpetAt(vUv, knot); alb *= 0.95 + 0.1*knot;
  } else if (k < 4.5 && k > 3.5) {                                   // blue and white tile skirting
    vec2 t = vUv/0.42; vec2 ti = floor(t), tf = fract(t) - 0.5; float fw = max(fwidth(t.x), fwidth(t.y));
    float fig = vnoise(tf*7. + ti*13.7)*smoothstep(0.34, 0.1, length(tf)) + 0.6*smoothstep(0.1, 0.04, length(abs(tf) - 0.42));
    vec3 tile = mix(uWhite*vec3(0.95, 0.97, 1.), uUltra*1.15, smoothstep(0.3, 0.42, fig)*0.85);
    float grout = smoothstep(0.5 - 0.03 - fw, 0.5 - 0.03, max(abs(tf.x), abs(tf.y)));
    alb = mix(tile, uShade*0.9, grout);
    alb = mix(alb, mix(uWhite, uUltra, 0.2), smoothstep(0.15, 0.4, fw));
  } else if (k > 13.5) {                                             // the ceiling: pale limed boards; the beams are quiet bars with a blended edge
    float bz = abs(mod(p.z + 40.875, 5.75) - 2.875), fz = max(fwidth(p.z), 1e-4);
    float beam = 1. - smoothstep(0.1 - 0.5*fz, 0.5 + 0.5*fz, bz + 0.05*(vnoise(vec2(p.x*0.7, p.z*0.3)) - 0.5));
    vec3 boards = uWhite*(0.93 + 0.03*vnoise(vec2(p.x*0.9, p.z*0.22)) - 0.025*smoothstep(0.42, 0.5, abs(fract(p.x/1.1) - 0.5))*(1. - smoothstep(0.02, 0.06, fwidth(p.x))));
    boards *= 1. - 0.1*(1. - smoothstep(0.3, 1.5, bz));                // the beam's own soft shade on the boards beside it
    alb = mix(boards, alb*(0.94 + 0.12*vnoise(vec2(p.x*0.35, p.z*3.))), beam);
  } else if (k < 5.5 && k > 4.5) {                                   // wood: beams, frames
    alb *= 0.94 + 0.14*vnoise(vec2(dot(p, vec3(0.3, 0.3, 0.9))*0.35, dot(p, vec3(4., 5., 0.6))));
  }
  float light = clamp(roomLightK(p, n, (k < 0.5 || (k > 2.5 && k < 3.5)) ? 1. : 0.) + lightAdd, 0., 1.);
  if (k > 2.5 && k < 3.5) light = clamp(light*1.3, 0., 1.);            // wool in the pool shows its madder at full strength
  if (k > 1.5 && k < 2.5) light *= mix(0.6, 1., smoothstep(0.4, 0.85, light));   // the marble shows where each pool lies: between the pools it sinks to the shade
  vec3 col = paint(alb, light);
  col = melt(col, p, n, meltK);
  gl_FragColor = vec4(toScene(col), 1.);
}`;
// what lies beyond a pane, as paint: sky paling to cream at the horizon, the slate cloud above, the town band,
// the water, the sand. d = unit direction from the eye; used by milky fixed panes and by reflections.
const OUTSIDE_GLSL = /* glsl */`
// THE SKY, in the world's own metres (room coordinates), so it has parallax as we cross and the water doubles it by
// geometry. o = where the ray starts, d = its unit direction with d.y > 0.
// TEN CUMULUS or so stand beyond the town in two ranks (the planes x = 850 and x = 1500, the further ones larger and
// lower in the picture): to every cell of a rank one heap of round puffs, wider than tall, on a level blue-grey base,
// cream on top (lit from behind us); one cell in four is open sky. The ranks slide to starboard with the cloud field.
vec2 heap(vec2 p, float id, float k, float base){   // p = (z from the cell's middle, y), metres -> (cover, tone)
  float h1 = vhash(vec2(id, 3.7)), h2 = vhash(vec2(id, 9.1)), h3 = vhash(vec2(id, 17.3));
  float W = k*(60. + 40.*h1), H = k*(68. + 56.*h2), yb = base + 40.*k*h3;
  vec2 q = vec2(p.x + 16.*(h3 - 0.5), p.y - yb);
  float bil = vnoise(q*0.04/k + id*7.3), bi2 = vnoise(q*0.13/k + id*3.1);
  q += k*vec2(10.*(bil - 0.5), 8.*(bi2 - 0.5));
  float dd = length(q - vec2(0.2*W*(h3 - 0.5), 0.5*H)) - 0.46*H;
  dd = min(dd, length(q - vec2(-0.56*W, 0.3*H)) - 0.3*H*(0.75 + 0.5*h1));
  dd = min(dd, length(q - vec2(0.54*W, 0.28*H)) - 0.28*H*(0.75 + 0.5*h2));
  dd = min(dd, length(q - vec2(-0.96*W, 0.13*H)) - 0.15*H);
  dd = min(dd, length(q - vec2(0.96*W, 0.12*H)) - 0.14*H);
  dd = min(dd, length(q - vec2(0.7*W*(h1 - 0.5), 0.78*H)) - 0.2*H);
  float cover = smoothstep(3.*k, -3.*k, dd)*smoothstep(-5.*k, 7.*k, q.y)*step(vhash(vec2(id, 23.9)), 0.74);
  float tone = smoothstep(0.0, 0.4, q.y/H + 0.16*(bil - 0.5)) - 0.2*smoothstep(-4.*k, -32.*k, dd)*smoothstep(0.6, 0.15, q.y/H) + 0.1*(bi2 - 0.5);
  return vec2(cover, clamp(tone, 0., 1.));
}
vec2 rank(vec3 o, vec3 d, float X, float cw, float k, float base){
  float t = max(X - o.x, 1.)/d.x;
  vec2 hp = vec2(o.z + d.z*t - uCloud, o.y + d.y*t);
  float cell = hp.x/cw, id = floor(cell);
  return heap(vec2((cell - id - 0.5)*cw, hp.y), id + X, k, base);
}
// THE SLATE BANK: one drawn cloud lying level over the near water, the quay and the near town for the town's whole
// length (z -60 to 260), its belly at y uBank.y, its far edge (the edge toward the town's back, paler) over x uBank.x. It reaches behind the town, so slate stands above the roofs from every eye on the harbour: that edge lies 36 m beyond the town's far edge (the back row and the nave's back wall at x 264; 264 + 36 = 300); the rim's own line stands 11 m short of it (the lobes swell over the last 20 m before that line and none passes it, so sky stands over the roofs under the lip); after rain it hangs lower and reaches further (335), the pearl overcast reaches further still (350): settings of the weather.
// ONE BODY: where the cloud field's own gap stands the bank THINS and does not open: through its whole depth its tone
// goes to a paler slate (the design's blue-grey) and the cover stays cloud. The field's fully struck stretch is 72 to 89 m
// of z in the three weathers, never narrower than a tenth of the mass beside it (231 to 248 m), so no blue stands
// through the bank anywhere; the thin place slides to starboard with the field as the break did.
// A FORM: the far rim is drawn in lobes (discs of radius 17 to 26 m at a pitch of 42 m along the town, swelling over
// the last 20 m before the rim's line, their tips at that line and never beyond it), the cloud ending in sky over a rim 6 m deep;
// A LIT LOWER PART: slate is the cloud's top; from the line where its own shadow ends on the ground to that rim its tone rises
// to the warm white at the lip (see the lines below), lobe by lobe, and rides with the rim; the belly is modelled in lobes about 44 m deep
// and 60 m long, each darker slate on the side toward us and paler toward the town (the bright sky lies beyond it),
// meeting its neighbour over a soft edge of about 6 m. Returns the tone and the cover.
vec4 bankAt(vec3 o, vec3 d){
  float t = max(uBank.y - o.y, 1.)/max(d.y, 0.02);
  vec2 h = o.xz + d.xz*t;
  float n1 = vnoise(h*0.012 + vec2(3., 7.)), n2 = vnoise(h*0.04 + 11.);
  float xe = uBank.x - 11. + 26.*(n1 - 0.5);                                         // the rim's line: 11 m short of the bank's far edge, wandering by 13 m either way, so that half the cover stands about 19 to 21 m beyond the town's far edge at x 264
  float dd = h.x - (xe - 20.), ci = floor(h.y/42.);                                // the far rim: the body, and the lobes that swell from it to the edge
  for (int j = -1; j <= 1; j++) {
    float id = ci + float(j), ha = vhash(vec2(id, 4.3)), hb = fract(ha*57.3), rr = 17. + 9.*ha;
    dd = min(dd, length(h - vec2(xe - rr - 6.*hb, (id + 0.5 + 0.5*(hb - 0.5))*42.)) - rr);
  }
  float cx = smoothstep(3., -3., dd);
  float cz = smoothstep(-126., -60., h.y + 30.*(n2 - 0.5))*(1. - smoothstep(260., 326., h.y + 30.*(n1 - 0.5)));
  float g = 0.5 + 0.5*cos(6.2831853*(h.y - uCloud + 474.)/320.);
  float brk = smoothstep(0.9, 0.985, g + 0.06*(n2 - 0.5));                         // where the field's gap stands the bank thins, its whole depth
  float cover = cx*cz;                                                            // one body: the thin place stays cloud
  vec2 bc = vec2(44., 60.), bi = floor(h/bc); float ws = 0., lobe = 0.;           // the belly's lobes: each darker toward us, paler toward the town
  for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) {
    vec2 id = bi + vec2(float(a), float(b)); float hj = vhash(id + 3.1);
    vec2 e = h - (id + 0.5 + 0.6*(vec2(hj, fract(hj*57.3)) - 0.5))*bc;
    float wl = exp(-(e.x*e.x + 0.54*e.y*e.y)/130.);
    ws += wl; lobe += wl*e.x;
  }
  lobe = clamp(lobe/max(ws, 1e-20)/24., -1., 1.);
  vec3 slate = vec3(0.357, 0.396, 0.439);
  vec3 tone = slate*(1.03 + 0.2*lobe + 0.1*(n1 - 0.5));
  tone = mix(tone, uShade*(1. + 0.07*lobe), 0.85*brk);                            // the thin place: a paler slate, still modelled, no blue through it
  // THE LIT LOWER PART: the slate is the cloud's TOP. Over what the bank shades the cloud stays slate as above, lobe by
  // lobe; from the line where its shadow ends on the ground (SHADE_X1, townSun's own) to the rim the tone rises without a
  // step through the blue-grey shade (halfway) to the warm white at the lip. By the place on the cloud alone: its distance
  // to the rim as a share of the way from that line to the rim (85 m in passing cloud, 120 m after rain, 135 m under the
  // pearl overcast, whose own grey lies over it below). The belly's lobes ride on it, fainter as it lightens.
  // RIDING on the shade's own line: a cloud is dark over what it shades, so the tone reads the place where townSun ends
  // the shadow on the ground, from the one constant both now read (the two numbers are the ones townSun had typed). It is
  // the GROUND line (height 0) of the shade's straight edge: townSun's slant with height (a roof's shade ends nearer) and
  // its bay at the gate are not followed by the cloud's tone.
  float sg = clamp(1. + dd/max(xe - 20. - SHADE_X1, 1.), 0., 1.); sg = sg*sg*(3. - 2.*sg);
  tone = mix(tone, uShade*(1. + 0.07*lobe), min(1., 2.*sg));
  tone = mix(tone, uWhite*(1. + 0.04*lobe), max(0., 2.*sg - 1.));
  tone = mix(tone, vec3(0.76, 0.775, 0.78)*(0.96 + 0.1*(n2 - 0.5)), 0.7*uBank.w); // pearl overcast: never dim
  return vec4(tone, cover);
}
vec3 skyTone(vec3 o, vec3 d){
  float e = d.y/max(length(d.xz), 1e-3);
  vec3 cream = vec3(0.895, 0.885, 0.825);
  // blue paling to cream toward the horizon, without a step; a little deeper overhead
  vec3 col = mix(cream, uSky, smoothstep(-0.02, 0.36, e)*0.98);
  col = mix(col, uSky*vec3(0.86, 0.92, 1.02), 0.6*smoothstep(0.3, 0.95, e));
  col = mix(col, vec3(0.86, 0.865, 0.845), 0.55*uBank.w*smoothstep(0.5, 0.05, e));
  if (d.x > 0.02) {
    vec2 c = rank(o, d, 1500., 320., 1.25, 196.);
    col = mix(col, mix(vec3(0.66, 0.71, 0.775), vec3(0.955, 0.95, 0.915), c.y), c.x);
    c = rank(o, d, 850., 260., 1., 148.);
    col = mix(col, mix(vec3(0.6, 0.66, 0.735), vec3(0.975, 0.965, 0.925), c.y), c.x);
  }
  vec4 bank = bankAt(o, d);
  return mix(col, bank.rgb, bank.a);
}
vec3 outsideTone(vec3 p, vec3 d){
  float e = d.y/max(length(d.xz), 1e-3);
  vec3 col = skyTone(p, d);
  float tz = p.z + d.z/max(d.x, 0.05)*(175. - p.x);
  float sun = cloudField(tz).x;
  float roofs = 0.085 + 0.05*vnoise(vec2(tz*0.045, 1.)) + 0.035*vnoise(vec2(tz*0.19, 5.)) + 0.3*smoothstep(7., 2., abs(tz - 150.))*step(0.12, 1.);
  vec3 town = mix(vec3(0.38, 0.36, 0.37), mix(uLemon, uWhite, 0.4), 0.8*sun*smoothstep(0.02, 0.07, e));
  col = mix(col, town, smoothstep(roofs, roofs - 0.012, e));
  vec3 water = mix(vec3(0.62, 0.64, 0.62), town, 0.35*smoothstep(-0.2, -0.05, e));
  col = mix(col, water, smoothstep(-0.055, -0.07, e));
  col = mix(col, vec3(0.6, 0.53, 0.44), smoothstep(-0.42, -0.5, e));
  return col;
}`;

const GLASS_FRAG = /* glsl */`
${STYLE_GLSL}
${OUTSIDE_GLSL}
varying vec3 vP, vN; varying vec4 vC; varying vec2 vUv; varying float vKind;
void main(){
  vec3 n = vN/max(length(vN), 1e-4);
  vec3 v = vP - uEye; float dist = length(v); v /= max(dist, 1e-3);
  vec2 cell = vec2(0.42, 0.62), g = vUv/cell, gi = floor(g), gf = fract(g);
  float h1 = vhash(gi + 3.7), h2 = vhash(gi*1.7 + 11.3);
  if (vKind < 6.5) {                                               // fixed leaded light, milky: glass and leads as paint
    float fw = max(max(fwidth(vUv.x), fwidth(vUv.y)), 1e-4);
    float cl = cloudField(vP.z).y;
    vec3 d = v; if (d.x < 0.) d.x = -d.x;                           // from outside, the glass holds the sky behind the viewer
    vec3 glass = mix(mix(uSky, vec3(0.985, 0.992, 0.985), 0.8 + 0.1*clamp(1. - d.y*2., 0., 1.)), outsideTone(vP, d), 0.05)*(0.95 + 0.05*cl)*(0.985 + 0.03*h1);
    glass = mix(glass, glass*vec3(0.965, 1., 0.975), h2*0.5);
    vec2 ed = min(gf, 1. - gf)*cell; float de = min(ed.x, ed.y);
    float w = max(0.019, 0.7*fw);
    float lead = 1. - smoothstep(w - 0.6*fw, w + 0.6*fw, de);
    lead = mix(lead, 0.11, smoothstep(0.1, 0.16, fw));              // under 3 px a quarrel: the flat mean
    vec3 col = mix(glass, uBlack*1.25 + 0.05*glass, lead);
    gl_FragColor = vec4(toScene(col), 1.);
    return;
  }
  // the open leaf: each quarrel sits a hair out of true, so the room it holds is broken pane by pane and slides
  float fwl = max(max(fwidth(vUv.x), fwidth(vUv.y)), 1e-4);
  vec3 nn = n + vec3(h1 - 0.5, h2 - 0.5, h1*h2 - 0.25)*0.0025 + 0.004*sin((uTime + uPhase.z)*vec3(0.7, 0.9, 0.5) + vP.y*0.6);
  nn /= max(length(nn), 1e-4);
  if (dot(nn, v) > 0.) nn = -nn;
  vec3 r = reflect(v, nn); r += vec3(1e-4)*(1. - 2.*step(r, vec3(0.)));
  vec3 tb = (mix(vec3(-9., 0., -6.), vec3(9., 11., 54.), step(vec3(0.), r)) - vP)/r;
  float t = min(tb.x, min(tb.y, tb.z));
  vec3 hit = vP + r*t;
  vec3 pf = vP + r*tb.y;
  vec2 c = vec2(pf.x + pf.z, pf.x - pf.z)*(0.70711/1.5);
  float ch = mod(floor(c.x) + floor(c.y), 2.);
  vec3 col;
  if (t == tb.x) {
    if (r.x > 0.) {
      float wr = max(winRect(hit.zy, 3., 12., 0.2), max(winRect(hit.zy, 24., 34., 0.2), winRect(hit.zy, 45., 53., 0.2)));
      col = mix(paint(uWhite, roomGrade(hit, vec3(-1., 0., 0.))), mix(uSky, vec3(0.93, 0.935, 0.9), 0.55 + 0.25*smoothstep(0.5, 0., r.y)), wr);
    } else col = paint(uWhite, roomLight(hit, vec3(1., 0., 0.)));
  } else if (t == tb.y) {
    col = r.y < 0. ? paint(mix(uBlack*1.25, uWhite*0.95, ch), roomLight(hit, vec3(0., 1., 0.))) : paint(vec3(0.353, 0.275, 0.196), 0.35);
  } else col = paint(uWhite, roomLight(hit, vec3(0., 0., -sign(r.z))));
  float tab = 1. - occBox(vP, r, uOccMin[0], uOccMax[0] + vec3(0., 1.2, 0.));
  col = mix(col, paint(mix(uRed, uUltra, uCloth), roomLight(vec3(5., 3., 21.), vec3(0.5, 0.8, 0.))), tab*0.9);
  float cs = abs(dot(nn, v));
  float fres = (1. - cs)*(1. - cs);
  col = mix(col, vec3(0.78, 0.83, 0.85), 0.22)*mix(vec3(0.9), vec3(0.7, 0.76, 0.81), vC.a)*(1. + 0.03*h1);
  col = mix(mix(col, vec3(0.9, 0.935, 0.94), 0.62), col, vC.a);          // the near leaf is bright milk-blue glass: the window as light   // the far leaf is a dim sheet of glass holding the room
  vec2 ed = min(gf, 1. - gf)*cell; float de = min(ed.x, ed.y), lw = max(0.022, 0.8*fwl);     // the leads, as paint, over the real bars
  float lead = 1. - smoothstep(lw - 0.6*fwl, lw + 0.6*fwl, de);
  lead = mix(lead, 0.15, smoothstep(0.1, 0.16, fwl));
  col = mix(col, uBlack*1.25 + 0.05*col, lead);
  // vC.a 1 = the far leaf, a sheet holding the room; 0 = the near leaf, looked through to the town
  float al = mix(clamp(0.24 + 0.5*fres, 0., 0.9), 0.86, vC.a);
  gl_FragColor = vec4(toScene(col), max(al, lead));
}`;

// Pointilles: opaque round dots facing the eye. Per instance: iPos (centre), iNrm (the surface normal there),
// iCol (the dot's paint), iBase (the paint under it: a far dot's rim softens into this), iSize.x metres (0.045..0.12),
// iSize.y swell (1; up to 3 on the out-of-focus curtain and chair).
const BEAD_VERT = /* glsl */`
${STYLE_GLSL}
attribute vec3 iPos, iNrm, iCol, iBase; attribute vec2 iSize;
varying vec3 vCol, vBase; varying vec2 vQ; varying float vSoft;
void main(){
  vec4 w = modelMatrix*vec4(iPos, 1.);
  vec3 rp = (uRoomFromWorld*w).xyz, rn = mat3(uRoomFromWorld)*(mat3(modelMatrix)*iNrm);
  rn /= max(length(rn), 1e-4);
  vec3 ev = uEye - rp; float dist = max(length(ev), 0.05);
  float far = smoothstep(8., 30., dist);
  float light = rp.x < 9.3 ? roomLight(rp, rn) : 0.8;
  float size = iSize.x*mix(1., 1.6, far)*iSize.y;
  size *= smoothstep(-0.25, 0.2, dot(rn, ev)/dist)*mix(0.35, 1., smoothstep(0.25, 0.7, light));
  // the floor: 3 px near to 1.7 px far of a picture of 720 lines or more, and not under 2.2 px near (1.7 px far) of the
  // picture as it is; the 0.25 m ceiling and the cap of the unswollen (9 px of the 720 picture) overrule both, and a
  // dot under 2 cm has no floor
  float fl = mix(3., 1.7, smoothstep(45., 170., dist));
  size = min(max(size, max(fl*dist*uPx, min(fl, 2.2)*dist*uPxLo)*step(0.02, size)), 0.25);
  if (iSize.y < 1.05) size = min(size, 9.*dist*uPx);
  vSoft = max(far, clamp(iSize.y - 1., 0., 1.));
  vCol = paint(iCol, max(light, 0.8)); vBase = paint(iBase, light);
  vQ = position.xy*2.;
  vec4 mv = viewMatrix*w;
  mv.xy += position.xy*size; mv.z += 0.04;
  gl_Position = projectionMatrix*mv;
}`;
const BEAD_FRAG = /* glsl */`
${STYLE_GLSL}
varying vec3 vCol, vBase; varying vec2 vQ; varying float vSoft;
void main(){
  float r = length(vQ);
  if (r > 1.) discard;
  gl_FragColor = vec4(toScene(mix(vCol, vBase, vSoft*0.75*smoothstep(0.4, 1., r))), 1.);
}`;

const OUT_FRAG = /* glsl */`
${STYLE_GLSL}
${OUTSIDE_GLSL}
varying vec3 vP, vN; varying vec4 vC; varying vec2 vUv; varying float vKind;
#ifdef FAR
// THE FAR SIDE OF THE ARCH: the canal that runs on behind the bridge between two rows of house fronts to a gabled
// front and a low further bridge 95 m in, painted along the ray in the arch's own axes (x to port, z into the
// town), so it has depth and parallax in the opening. It stands in the bank's shade until the gap of the field that
// lands on the yellow wall lies on it, and then turns to lit fronts over cream-gold water.
float farSun(vec3 q){
  vec3 P = vec3(150. + q.z*0.8988 + q.x*0.4384, q.y, 96. + q.z*0.4384 - q.x*0.8988);
  float a = P.z - 0.95*max(P.x - 163.5, 0.);
  return cloudField(a).x*smoothstep(0.78, 0.96, 0.5 + 0.5*cos(6.2831853*(a - uCloud + 474.)/640.));
}
vec3 farFronts(vec3 q, vec3 e, vec3 P0, vec3 D){
  float ex = abs(e.x) < 1e-3 ? 1e-3 : e.x;
  float tx = ((ex > 0. ? 7. : -7.) - q.x)/ex, te = (95. - q.z)/max(e.z, 1e-3);
  vec3 h = q + e*min(tx, te);
  float sun = farSun(h);
  if (tx < te) {                                                    // a side: fronts 9.5 m wide, each its own height and wall
    float hz = h.z/9.5, id = floor(hz) + (ex > 0. ? 31. : 0.), fx = (hz - floor(hz))*9.5;
    float h1 = vhash(vec2(id, 2.3)), h2 = vhash(vec2(id, 7.9)), eave = 4.5 + 6.*h1;
    if (h.y > eave + 5.5) return skyTone(P0, D);
    if (h.y > eave) return paintOut(mix(vec3(0.71, 0.278, 0.18), vec3(0.357, 0.396, 0.439), step(0.6, h2))*(0.9 + 0.2*vnoise(vec2(h.z*0.9, h.y*1.3))), sun, 0.9);
    vec3 alb = h2 < 0.3 ? vec3(0.84, 0.83, 0.78) : (h2 < 0.75 ? vec3(0.71, 0.278, 0.18) : vec3(0.56, 0.27, 0.19));
    alb *= 0.88 + 0.2*vnoise(vec2(h.z*0.5 + id, h.y*0.7)) + 0.06*vnoise(vec2(h.z*3.1, h.y*4.3));
    alb *= 1. - 0.3*smoothstep(0.42, 0.5, abs(fx/9.5 - 0.5));                                    // the joint between two fronts
    alb = mix(alb, vec3(0.74, 0.72, 0.65), step(abs(h.y - eave + 0.5), 0.22) + step(abs(h.y + 2.1), 0.14));   // eaves cornice, string course
    alb = mix(alb, vec3(0.6, 0.59, 0.54)*0.8, smoothstep(-8.6, -9., h.y));                       // the quay's damp stone foot
    float lights = step(abs(abs(fx - 4.75) - 2.2), 0.75)*(step(abs(h.y + 4.4), 1.4) + step(abs(h.y - 1.), 1.3)*step(1., eave - 4.));
    alb = mix(alb, vec3(0.17, 0.19, 0.22), lights*0.9);
    return paintOut(alb, ex > 0. ? sun : 0., 0.5)*(ex > 0. ? 1.04 : 0.92);      // the sun stands behind us a little to starboard: the port fronts are struck, the starboard fronts keep their own shade
  }
  // the end: a whitewashed front under a stepped gable, a low dark bridge at its foot, the sky above
  float top = 3. + 1.7*floor((7. - abs(h.x))/1.2);
  if (h.y > top) return skyTone(P0, D);
  vec3 alb = vec3(0.86, 0.85, 0.8)*(0.92 + 0.14*vnoise(h.xy*0.6));
  alb = mix(alb, vec3(0.17, 0.19, 0.22), step(abs(abs(h.x) - 2.6), 0.7)*step(abs(h.y - 1.5), 1.5)*0.9);
  alb = mix(alb, vec3(0.6, 0.59, 0.54), step(h.y, -7.2));
  alb = mix(alb, vec3(0.13, 0.15, 0.18), step(h.y, -8.8 + sqrt(max(10.5 - h.x*h.x, 0.)))*step(abs(h.x), 3.24));
  return paintOut(alb, sun, 0.5);
}
// the barrel of the bridge (a half-round of radius 6 about y -8 on piers at x +-6, z 0 to 7): where a ray from q leaves it
// through the stone, the stone's paint (a = 1): courses along the vault, darker toward the middle, the water's light on it
vec4 barrel(vec3 q, vec3 e){
  vec3 b = q + e*((7. - q.z)/e.z);
  if (q.z >= 7. || (abs(b.x) <= 6. && b.y <= -8. + sqrt(max(36. - b.x*b.x, 0.)))) return vec4(0.);
  float ex = abs(e.x) < 1e-3 ? 1e-3 : e.x;
  float t = ((ex > 0. ? 6. : -6.) - q.x)/ex;
  if (t < 0. || q.y + e.y*t > -8.) {
    float A = max(e.x*e.x + e.y*e.y, 1e-5), B = 2.*(q.x*e.x + (q.y + 8.)*e.y), Cq = q.x*q.x + (q.y + 8.)*(q.y + 8.) - 36.;
    t = (-B + sqrt(max(B*B - 4.*A*Cq, 0.)))/(2.*A);
  }
  vec3 h = q + e*t;
  float su = h.y > -8. ? 6.*atan(h.y + 8., abs(h.x) + 1e-3) : h.y + 8.;
  float course = su/0.5, zj = h.z/1.2 + 0.5*mod(floor(course), 2.);
  float joint = max(smoothstep(0.4, 0.5, abs(fract(course) - 0.5)), smoothstep(0.44, 0.5, abs(fract(zj) - 0.5)));
  vec3 alb = vec3(0.74, 0.72, 0.65)*(0.86 + 0.2*vhash(floor(vec2(course, zj))))*(1. - 0.28*joint);
  alb = mix(alb, alb*vec3(0.62, 0.68, 0.66), smoothstep(-9.3, -10.6, h.y));                       // the damp foot
  float mouth = 0.5 + 0.5*max(smoothstep(3.6, 0., h.z), smoothstep(3.4, 7., h.z));
  float tv = uTime + uPhase.y, wav = sin(h.z*1.7 + su*0.9 + tv*0.9 + 3.*vnoise(vec2(su*0.4, h.z*0.5 - tv*0.2)));
  return vec4(paintOut(alb, 0., 0.4)*mouth*(1. + 0.1*wav*smoothstep(-2., -9., h.y)), 1.);
}
vec3 farSide(vec3 p, vec3 d){
  vec2 dp = p.xz - vec2(150., 96.);
  vec3 q = vec3(dp.x*0.4384 - dp.y*0.8988, p.y, dp.x*0.8988 + dp.y*0.4384);
  vec3 e = vec3(d.x*0.4384 - d.z*0.8988, d.y, max(d.x*0.8988 + d.z*0.4384, 0.03));
  float tw = e.y < -1e-3 ? (-11. - q.y)/e.y : 1e6;
  vec3 hw = q + e*min(tw, 1e4);
  bool under = tw < 1e5 && hw.z < 7. && abs(hw.x) < 6.;               // the water under the barrel itself
  if (!under) {
    vec4 bb = barrel(q, e); if (bb.a > 0.5) return bb.rgb;
    float ex = abs(e.x) < 1e-3 ? 1e-3 : e.x;
    if (tw > min(((ex > 0. ? 7. : -7.) - q.x)/ex, (95. - q.z)/e.z)) return farFronts(q, e, p, d);
  }
  // the canal's water: the vault, the fronts and the sky doubled in it, in level trembling ripples; cream-gold where the strip lies
  float tt = uTime + uPhase.x;
  float rip = vnoise(vec2(hw.x*0.3 + tt*0.2, hw.z*1.1 - tt*0.6)) - 0.5 + 0.5*(vnoise(vec2(hw.x*0.8 - tt*0.3, hw.z*3.1 + tt*0.9)) - 0.5);
  vec3 e2 = vec3(e.x, -e.y*0.86 + 0.02 + 0.08*rip, e.z); e2 /= max(length(e2), 1e-3);
  vec4 bb = barrel(hw, e2);
  vec3 col = (bb.a > 0.5 ? bb.rgb : farFronts(hw, e2, p, vec3(d.x, abs(d.y) + 0.02, d.z)))*vec3(0.86, 0.89, 0.93);
  float sun = farSun(hw)*smoothstep(4., 9., hw.z);
  col = mix(col, vec3(0.9, 0.84, 0.6)*(0.95 + 0.3*rip), 0.42*sun);
  return col*(0.94 + 0.3*rip)*mix(0.74, 1., sun);
}
#endif
void main(){
  vec3 n = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) n = -n;
  vec3 p = vP, alb = vC.rgb; float k = vKind;
  vec3 v = p - uEye; float dist = length(v); v /= max(dist, 1e-3);
  float fw = max(max(fwidth(vUv.x), fwidth(vUv.y)), 1e-4);
  // the double under the water is lit as the thing it doubles: pr and nr are the place and normal above the surface
  float mir = step(p.y, -11.02);
  vec3 pr = vec3(p.x, abs(p.y + 11.) - 11., p.z), nr = vec3(n.x, n.y*(1. - 2.*mir), n.z);
  #ifdef FAR
  {
    vec3 eye = vec3(uEye.x, mir > 0.5 ? -22. - uEye.y : uEye.y, uEye.z);
    vec3 dr = pr - eye; dr /= max(length(dr), 1e-3);
    vec3 fc = farSide(pr, dr);
    fc = mix(fc, fc*0.8*vec3(0.96, 0.99, 1.05), mir);
    // within the last metres before the bridge the painted far side gives way to the opening itself, once the next
    // world's picture stands in it (the portal); until there is one it holds
    float zbE = (uEye.x - 150.)*0.8988 + (uEye.z - 96.)*0.4384;
    gl_FragColor = vec4(toScene(fc), mix(1. - uLive*smoothstep(-27., -11., zbE), 1., mir));
    return;
  }
  #endif
  if (k > 9.5 && k < 10.5) {                                        // still harbour water: grey-gold, the sky and the town doubled soft, broken by fine level ripples
    // ripples lie across the course (the last straight's heading), so they read level in the picture; each octave
    // sinks to its mean where it is finer than the pixel
    vec2 w = vec2(p.x*0.4384 - p.z*0.8988, p.x*0.8988 + p.z*0.4384);
    float fwa = max(fwidth(w.y), 1e-4);
    float tw = uTime + uPhase.x;
    // the ripples have no lattice in them: three trains of sines along the course (3.6 m, 1.05 m and 0.38 m from crest to
    // crest, travelling as they did), whose phase wanders across the course and whose strength swells and dies across it
    // (a band is about 14 m, 5.3 m, 2.2 m long and tapers to nothing at its ends)
    float pa = 1.3*sin(w.x*0.071 + 0.4*tw) + 0.9*sin(w.x*0.173 - w.y*0.045 - 0.27*tw + 2.1);
    float pb = 1.2*sin(w.x*0.29 + w.y*0.11 + 0.33*tw + 0.7) + 0.8*sin(w.x*0.53 - w.y*0.07 - 0.21*tw + 4.);
    float r1 = 0.5*sin(w.y*1.75 + tw*1.59 + pa)*(0.55 + 0.45*sin(w.x*0.22 + w.y*0.13 - tw*0.17 + 1.3))*(1. - smoothstep(0.6, 1.8, fwa));
    float r2 = 0.5*sin(w.y*6. - tw*2.5 + 1.7*pb + 0.6*pa)*(0.5 + 0.5*sin(w.x*0.59 - w.y*0.31 + tw*0.23 + 2.9))*(1. - smoothstep(0.12, 0.45, fwa));
    float r3 = 0.5*sin(w.y*16.5 + tw*4.36 + 2.3*pb - 1.1*pa)*(0.5 + 0.5*sin(w.x*1.43 + w.y*0.67 - tw*0.31 + 5.2))*(1. - smoothstep(0.04, 0.16, fwa));
    float rip = r1 + 0.6*r2 + 0.4*r3;
    vec3 r = vec3(v.x, abs(v.y)*0.86 + 0.015 + 0.075*rip, v.z + 0.045*(r2 + r3)); r /= max(length(r), 1e-3);   // doubled a little stretched downward
    // the sky's double: under the bank the water is dark (the bank's own belly lies in it), beyond its edge blue and cream
    vec3 col = skyTone(p, r)*vec3(0.9, 0.95, 1.);
    // where the struck strip's double lies it is cream-gold: the ray's landing on the far roofs reads the same field
    float er = r.y/max(length(r.xz), 1e-3);
    float tz = p.z + r.z/max(r.x, 0.05)*(190. - p.x);
    float gold = cloudField(tz - 25.).x*smoothstep(0.015, 0.06, er)*(1. - smoothstep(0.13, 0.34, er))*step(0., r.x);
    col = mix(col, vec3(0.9, 0.84, 0.6)*(0.94 + 0.3*rip), 0.5*gold);
    col *= 0.97 + 0.24*rip;
    float fres = 1. - abs(v.y);
    float sq = max(r2, 0.), streak = min(1., sq*sq/(0.5*(sq + 0.06)));   // the surface's own light lies across the doubles in level bands with no edge: one train carries it (a band half a metre deep, 5 m long), each band rising from nothing over the whole flank of its crest (a third of its depth and more) and never flat-topped; the two other trains only tremble the double
    gl_FragColor = vec4(toScene(col), clamp(mix(0.3, 0.2, smoothstep(0.2, 0.7, fres)) + 0.3*streak - 0.07*gold, 0.05, 1.));   // thin enough that every double is read, down to the lower edge
    return;
  }
  if (k > 7.5 && k < 8.5) {                                         // brick: sandy, granular, the courses only a breath; mortar is beaded by the bead layer
    vec2 b = vec2(vUv.x/0.66, vUv.y/0.21); b.x += 0.5*mod(floor(b.y), 2.);
    vec2 bf = abs(fract(b) - 0.5); float h = vhash(floor(b));
    float mort = max(smoothstep(0.5 - 0.05 - fw/0.66, 0.5 - 0.02, bf.x), smoothstep(0.5 - 0.11 - fw/0.21, 0.5 - 0.05, bf.y));
    float fine = smoothstep(0.035, 0.07, fw);
    mort = mix(mort, 0.3, fine); h = mix(h, 0.5, fine);
    float grain = vnoise(vUv*7.) + 0.5*vnoise(vUv*19. + 5.), ptc = vnoise(vUv*0.16 + 3.) + 0.5*vnoise(vUv*0.47);
    alb = mix(alb*(0.88 + 0.18*h), vec3(0.74, 0.7, 0.63), mort*0.17);
    alb *= 0.84 + 0.2*mix(grain, 0.75, smoothstep(0.02, 0.06, fw));
    alb = mix(alb, mix(vec3(0.42, 0.36, 0.34), vec3(0.66, 0.5, 0.36), smoothstep(0.5, 1.1, ptc)), 0.3*abs(ptc - 0.75));
    // weathered: soot and damp run down from eaves and sills in soft streaks, and the fired colour wanders course by course
    float run = vnoise(vec2(vUv.x*0.75, vUv.y*0.07 + 3.))*vnoise(vec2(vUv.x*0.23 + 7., vUv.y*0.05));
    alb = mix(alb, alb*vec3(0.7, 0.72, 0.76), smoothstep(0.22, 0.62, run)*0.7);
    alb *= 0.86 + 0.28*vnoise(vec2(vUv.x*0.31 + 2., vUv.y*0.9));
    alb = mix(alb, alb*vec3(1.1, 0.96, 0.86) + vec3(0.03, 0.015, 0.), smoothstep(0.55, 0.9, vnoise(vUv*vec2(0.9, 1.6) + 13.))*0.5);   // harder-fired batches
  } else if (k > 8.5 && k < 9.5) {                                  // pantiles or slates in rows
    float row = abs(fract(vUv.x/0.8) - 0.5), h = vhash(floor(vUv/vec2(0.8, 1.1)));
    float rib = mix(smoothstep(0.1, 0.45, row), 0.5, smoothstep(0.13, 0.27, fw));
    alb *= (0.84 + 0.2*rib)*(0.92 + 0.16*mix(h, 0.5, smoothstep(0.13, 0.27, fw)));
    float mend = vnoise(vUv*vec2(0.21, 0.3) + 4.) + 0.5*vnoise(vUv*vec2(0.6, 0.8) + 9.);
    alb = mix(alb, alb*vec3(0.8, 0.84, 0.86), smoothstep(0.7, 1.15, mend)*0.75);                 // weathered courses
    alb = mix(alb, mix(alb, vec3(0.62, 0.6, 0.5), 0.34), smoothstep(0.52, 0.2, mend));           // lichen, pale
    alb *= 0.93 + 0.14*vnoise(vec2(vUv.x*1.3, vUv.y*0.35 + 6.));
  } else if (k > 10.5 && k < 11.5) {                                // sand
    float rip = vnoise(vec2(p.z*0.42 + 2.2*vnoise(p.xz*0.13), p.x*1.5)), fws = max(fwidth(p.x), fwidth(p.z));
    alb *= 0.985 + 0.07*(vnoise(p.xz*0.3) - 0.5) + 0.09*(mix(rip, 0.5, smoothstep(0.25, 0.6, fws)) - 0.5) + 0.05*(mix(vnoise(p.xz*2.3), 0.5, smoothstep(0.1, 0.25, fws)) - 0.5);
    // the strand's own drawing: long drifts of blown sand lying along the quay, and two dark wrack lines the tide left
    float drift = vnoise(vec2(p.z*0.085 + 2.6*vnoise(p.xz*0.045), p.x*0.36 + 3.));
    alb *= 0.9 + 0.22*mix(drift, 0.5, smoothstep(0.5, 1.5, fws));
    float lvl = p.y + 0.09*(vnoise(vec2(p.z*0.27, 5.)) - 0.5);
    float wrack = (1. - smoothstep(0.012, 0.05, abs(lvl + 10.36)))*step(0.38, vnoise(p.xz*vec2(1.3, 0.7))) + (1. - smoothstep(0.008, 0.035, abs(lvl + 10.16)))*step(0.5, vnoise(p.xz*vec2(0.9, 1.9) + 7.));
    alb = mix(alb, vec3(0.3, 0.27, 0.2), 0.55*wrack*(1. - smoothstep(0.08, 0.3, fws)));
    float wet = smoothstep(-10.45, -10.93, p.y + 0.2*(vnoise(vec2(p.z*0.33, 2.)) - 0.5));
    alb = mix(alb, alb*vec3(0.66, 0.68, 0.7), wet);
    alb = mix(alb, vec3(0.86, 0.85, 0.8), 0.5*smoothstep(-10.78, -10.95, p.y)*smoothstep(-11.12, -10.98, p.y));     // a pale lip of foam where it meets the water
  } else if (k > 5.5 && k < 6.5) {                                  // a leaded light seen from the harbour: dark glass holding a little sky, quarrel by quarrel, in its lattice
    vec2 cell = vec2(0.42, 0.62), gq = vUv/cell, gf = fract(gq); float h1 = vhash(floor(gq) + 3.7);
    vec2 ed = min(gf, 1. - gf)*cell; float lw = max(0.034, 0.8*fw);
    float lead = 1. - smoothstep(lw - 0.6*fw, lw + 0.6*fw, min(ed.x, ed.y));
    lead = mix(lead, 0.2, smoothstep(0.1, 0.16, fw));
    alb = mix(mix(vec3(0.2, 0.225, 0.26), uSky*0.86, 0.2 + 0.45*h1*h1), vec3(0.07, 0.07, 0.08), lead);
  } else if (k > 14.5 && k < 15.5) {                                // lime crowns: soft masses, no facets
    alb *= 0.92 + 0.16*vnoise(p.xz*0.23 + p.y*0.19) + 0.08*vnoise(p.zy*0.9 + p.x*0.7);
    float gap = vnoise(vec2(p.z*0.42 + p.x*0.31, p.y*0.5 + p.x*0.17)) + 0.5*vnoise(vec2(p.z*1.05 - p.x*0.4, p.y*1.2) + 5.);
    alb = mix(alb, alb*vec3(0.5, 0.56, 0.62), smoothstep(0.62, 0.36, gap)*0.85);                 // the dark between the boughs
    alb = mix(alb, alb*vec3(1.3, 1.34, 1.2), smoothstep(1.0, 1.3, gap)*smoothstep(-0.2, 0.5, dot(nr, vec3(-0.8053, 0.5197, -0.2841))));   // leaves turned to the light
  } else if (k > 12.5) {                                            // limewash on brick: patched where it has fallen, stained under every ledge
    float ptc = vnoise(vUv*0.33 + 11.) + 0.5*vnoise(vUv*1.1 + 2.) + 0.25*vnoise(vUv*3.7);
    float streak = vnoise(vec2(vUv.x*1.9, vUv.y*0.16 + 4.))*vnoise(vec2(vUv.x*0.5 + 9., vUv.y*0.07));
    vec3 base = alb*(0.9 + 0.12*vnoise(vUv*5.));
    base = mix(base, base*vec3(0.8, 0.83, 0.82), smoothstep(0.2, 0.6, streak));
    float yel = clamp((alb.g - alb.b)*2.5 - 0.5, 0., 1.);            // the yellow wall is kept clean: his lemon, a little weathered, never mouldy
    base = mix(base, alb*(0.93 + 0.1*vnoise(vUv*1.3)), 0.3*yel);                               // weathered like the rest, only less
    alb = mix(base, mix(base*0.72, vec3(0.6, 0.4, 0.32), 0.45)*(0.9 + 0.2*vnoise(vUv*8.)), smoothstep(1.16, 1.34, ptc)*0.6*(1. - 0.6*yel));
  } else if (k > 11.5) {                                            // tarred hull: strakes
    float st = abs(fract(vUv.y/0.9) - 0.5);
    alb = mix(alb, alb*1.7 + 0.03, smoothstep(0.42 - fw, 0.47, st)*0.6)*(0.9 + 0.2*vnoise(vUv*vec2(0.4, 3.)));
  }
  alb *= 0.9 + 0.2*vnoise(vec2(p.z + p.x, p.y)*0.11);                 // weather: broad patches, and the damp foot above the water
  float damp = smoothstep(-7.2, -11., pr.y)*step(40., p.x)*(step(k, 9.5) + step(12.5, k)*step(k, 14.5));
  alb = mix(alb, alb*0.6 + vec3(0.02, 0.035, 0.03), damp*0.6);
  float sun = townSun(pr)*smoothstep(-0.25, 0.45, dot(nr, vec3(-0.8053, 0.5197, -0.2841)));   // the sun: behind us, 6.6 degrees to starboard of the course's line over the harbour
  vec3 col = paintOut(alb, sun, 0.5 + 0.5*nr.y);
  col *= 1. + (k > 14.5 && k < 15.5 ? 0.3 : 0.11)*dot(nr, vec3(-0.75, 0.3, -0.59))*(1. - sun);       // the open sky over the harbour models what stands in shade
  if (k > 11.5 && k < 12.5) col = mix(col, alb*0.8 + 0.012, 0.78);   // tar is bone black, also in shade
  if (uBank.z > 0. && ((k > 8.5 && k < 9.5) || (k > 10.5 && k < 11.5))) {     // after rain: wet tile, slate and sand are deeper and hold the sky
    vec3 rr = reflect(v, nr); rr.y = abs(rr.y) + 0.03; rr /= max(length(rr), 1e-3);
    float fr = 1. - abs(dot(nr, v));
    col = mix(col*0.84, skyTone(pr, rr), uBank.z*(0.14 + 0.5*fr*fr));
  }
  // the water's light trembling on whatever stands over it: a slow soft waver, strongest at the waterline
  // (two slow sine trains whose phases wander, so it reads neither as blocks nor as stripes)
  float tv = uTime + uPhase.y;
  float wq = vnoise(vec2(p.y*0.37 + tv*0.21, (p.x - p.z)*0.23)), wr = vnoise(vec2((p.x + p.z)*0.19 - tv*0.17, p.y*0.31 + 4.));
  float wav = sin((p.x + p.z)*0.33 + tv*0.8 + 5.*wq)*sin(p.y*0.8 - tv*1.0 + 5.*wr);
  col *= 1. + 0.2*wav*smoothstep(3., -9.5, p.y)*step(40., p.x)*step(-11.01, p.y);
  float rim = 1. - abs(dot(n, v));
  if (k < 14.5) col = mix(col, col*1.16 + 0.012, vC.a*smoothstep(0.55, 1., rim));   // a contour melts into the thing's own paint, a little lighter, never into grey
  col = mix(col, col*mix(0.84, 0.7, smoothstep(-16., -44., p.y))*vec3(0.96, 0.99, 1.05), mir);   // under the surface: the double keeps the thing's pigment, a little deeper, never as bright as the thing
  if (mir > 0.5) {
    // each double is one soft streak: toward its lower end it melts into the water's own tone (the sky's double that lies
    // beside it, as the dome paints it): nothing in the first 10 m under the waterline, four parts in ten from 50 m down;
    // and it melts into the same tone wherever its surface turns more than 60 degrees from the eye: the last 30 degrees
    // of a round side, and likewise a flat face seen at such a slant (the same test from every eye)
    float mk = max(0.4*smoothstep(10., 50., -11. - p.y), k < 14.5 ? 0.6*max(vC.a, 0.5)*smoothstep(0.5, 1., rim) : 0.);
    if (mk > 0.004) {
      vec3 vw = vec3(p.x, p.y - 0.14*(-11. - p.y), p.z) - uEye; vw /= max(length(vw), 1e-3);     // the eye's ray to where the drawn-out double stands
      float dn = max(-vw.y, 0.);
      vec3 dw = vec3(vw.x, abs(vw.y)*0.86 + 0.015, vw.z); dw /= max(length(dw), 1e-4);
      vec3 wt = skyTone(vec3(uEye.x, -22. - uEye.y, uEye.z), dw);
      wt = mix(wt, vec3(0.67, 0.65, 0.55), 0.3)*0.9;
      wt = mix(wt, vec3(0.43, 0.46, 0.49)*(0.78 + 0.6*dot(wt, vec3(0.3, 0.5, 0.2))), 0.34*smoothstep(0.04, 0.4, dn));
      col = mix(col, wt, mk);
    }
  }
  #ifdef CROWN
    // a lime's outer veil: the crown's own paint thinning to nothing at the outline, so the mass has no edge
    float gapV = vnoise(vec2(p.z*0.42 + p.x*0.31, p.y*0.5 + p.x*0.17)) + 0.5*vnoise(vec2(p.z*1.05 - p.x*0.4, p.y*1.2) + 5.);
    float body = (1. - smoothstep(0.12, 0.84, rim))*(0.7 + 0.5*vnoise(p.xz*0.45 + p.y*0.37))*mix(0.35, 1., smoothstep(0.36, 0.7, gapV));
    gl_FragColor = vec4(toScene(col), clamp(body, 0., 0.92));
  #else
    gl_FragColor = vec4(toScene(col), 1.);
  #endif
}`;
const SKY_VERT = /* glsl */`
uniform mat4 uRoomFromWorld; varying vec3 vD;
void main(){ vD = mat3(uRoomFromWorld)*(mat3(modelMatrix)*position); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.); }`;
const SKY_FRAG = /* glsl */`
${STYLE_GLSL}
${OUTSIDE_GLSL}
varying vec3 vD;
void main(){
  vec3 d = vD/max(length(vD), 1e-4); float down = max(-d.y, 0.); d.y = abs(d.y)*0.86 + 0.015;      // below the horizon the dome is the sky's own double, seen through the water
  d /= max(length(d), 1e-4);
  vec3 col = skyTone(vec3(uEye.x, down > 0. ? -22. - uEye.y : uEye.y, uEye.z), d);
  // that double is water: grey-gold, and darker and greyer the steeper we look down into it, under the slate cloud near us
  col = mix(col, mix(col, vec3(0.67, 0.65, 0.55), 0.3)*0.9, step(1e-4, down));
  col = mix(col, vec3(0.43, 0.46, 0.49)*(0.78 + 0.6*dot(col, vec3(0.3, 0.5, 0.2))), 0.34*smoothstep(0.04, 0.4, down));
  gl_FragColor = vec4(toScene(col), 1.);
}`;

// ---- material factories (U = the build's own set, hero.uniforms; each call returns a new material on the SAME program) ----
const shared = (U, extra) => ({ ...U, ...(extra || {}) });
/** Indoor surfaces: object, plaster, floor chequer, carpet, tile skirting, wood (by aKind). */
export function roomMaterial(U, o = {}) { return new THREE.ShaderMaterial({ uniforms: shared(U), vertexShader: STYLE_VERT, fragmentShader: ROOM_FRAG, side: o.side ?? THREE.FrontSide }); }
/** Leaded glass. leaf:false = opaque milky fixed lights (aKind 6); leaf:true = the open leaf's blended reflection (aKind 7). */
export function glassMaterial(U, o = {}) {
  return new THREE.ShaderMaterial({ uniforms: shared(U), vertexShader: STYLE_VERT, fragmentShader: GLASS_FRAG, side: THREE.DoubleSide,
    transparent: !!o.leaf, depthWrite: !o.leaf });
}
/** Outdoor surfaces: object, brick, roof, sand, hull (opaque); water (water:true, blended over the mirrored town);
 *  the soft outer veil of the lime crowns (crown:true: same geometry as the crowns, pushed out, blended);
 *  or the far side of the bridge arch (far:true, on aKind far: blended, so it can give way to the opening). */
export function outdoorMaterial(U, o = {}) {
  const veil = !!(o.water || o.crown || o.far);
  return new THREE.ShaderMaterial({ uniforms: shared(U), vertexShader: STYLE_VERT, fragmentShader: OUT_FRAG, side: o.side ?? THREE.FrontSide,
    defines: o.crown ? { CROWN: 1 } : o.far ? { FAR: 1 } : {}, transparent: veil, depthWrite: !veil });
}
/** Sky for a dome that follows the camera: blue paling to cream, cumulus, the slate cloud along the top. */
export function skyMaterial(U) { return new THREE.ShaderMaterial({ uniforms: shared(U), vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }); }
export function beadMaterial(U) { return new THREE.ShaderMaterial({ uniforms: shared(U), vertexShader: BEAD_VERT, fragmentShader: BEAD_FRAG }); }
/** beads: array of [x,y,z, nx,ny,nz, r,g,b, br,bg,bb, size, swell] (display colours); material: the build's beadMaterial(U). Returns one Mesh (2 triangles a bead). */
export function makeBeads(beads, material) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const n = beads.length, P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), B = new Float32Array(n * 3), S = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const b = beads[i]; P.set([b[0], b[1], b[2]], i * 3); N.set([b[3], b[4], b[5]], i * 3); C.set([b[6], b[7], b[8]], i * 3); B.set([b[9], b[10], b[11]], i * 3); S[i * 2] = b[12]; S[i * 2 + 1] = b[13] ?? 1; }
  const ia = (a, k) => new THREE.InstancedBufferAttribute(a, k);
  g.setAttribute('iPos', ia(P, 3)); g.setAttribute('iNrm', ia(N, 3)); g.setAttribute('iCol', ia(C, 3)); g.setAttribute('iBase', ia(B, 3)); g.setAttribute('iSize', ia(S, 2));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, material); m.frustumCulled = false;
  return m;
}
/** Call once a frame (the hero's update does it) with the build's set: eye, world->room matrix, pixel size, time. roomObject = the Object3D whose local space is room coordinates. */
const _m = new THREE.Matrix4(), _v = new THREE.Vector3();
export function updateStyle(U, camera, roomObject, time) {
  roomObject.updateWorldMatrix(true, false);
  U.uRoomFromWorld.value.copy(roomObject.matrixWorld).invert();
  U.uEye.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(U.uRoomFromWorld.value);
  const pe = camera.projectionMatrix.elements;
  U.uPx.value = 2 / (Math.max(pe[5], 0.1) * 720); U.uPxLo.value = U.uPx.value;
  U.uTime.value = time;
}
/** exposure = the world's post.exposure (so pigments land on their hexes); cloud = metres the field has slid (3 x path distance). */
export function setStyle(U, { exposure, cloud, stripLo, stripHi, indoorFloor, golden, flat } = {}) {
  if (flat != null) U.uFlat.value = flat ? 1 : 0;
  if (exposure != null) U.uToneK.value = 0.6 / exposure;
  if (cloud != null) U.uCloud.value = cloud;
  if (stripLo != null) U.uStrip.value.x = stripLo; if (stripHi != null) U.uStrip.value.y = stripHi;
  if (indoorFloor != null) U.uStrip.value.z = indoorFloor; if (golden != null) U.uStrip.value.w = golden;
}

// ------------------------------------------------------------------------------------------------------------
// Geo: a small mesh builder that writes the attributes the style needs (position, normal, uv, aCol, aKind).
// Colours are display rgb arrays (disp('#hex')); melt 0..1 is how far the contour dissolves into the wall tone.
export class Geo {
  constructor() { this.p = []; this.n = []; this.t = []; this.c = []; this.k = []; this.i = []; this.xf = null; }
  get count() { return this.p.length / 3; }
  v(x, y, z, nx, ny, nz, u, w, col, melt, kind) {
    if (this.xf) { const e = this.xf.elements; const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      const NX = e[0] * nx + e[4] * ny + e[8] * nz, NY = e[1] * nx + e[5] * ny + e[9] * nz, NZ = e[2] * nx + e[6] * ny + e[10] * nz; x = X; y = Y; z = Z; nx = NX; ny = NY; nz = NZ; }
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.t.push(u, w); this.c.push(col[0], col[1], col[2], melt); this.k.push(kind);
    return this.p.length / 3 - 1;
  }
  /** flat quad a,b,c,d (counter-clockwise seen from the lit side); uv = [ua,va, ub,vb, uc,vc, ud,vd] or omitted. */
  quad(a, b, c, d, col, kind = 0, melt = 0, uv = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const q = [a, b, c, d].map((P, j) => this.v(P[0], P[1], P[2], nx, ny, nz, uv ? uv[j * 2] : 0, uv ? uv[j * 2 + 1] : 0, col, melt, kind));
    this.i.push(q[0], q[1], q[2], q[0], q[2], q[3]);
  }
  /** chamfered box with rounded shading: centre, size, colour; o = { bevel, kind, melt } */
  box(cx, cy, cz, sx, sy, sz, col, o = {}) {
    const b = Math.min(o.bevel ?? 0.04, sx * 0.45, sy * 0.45, sz * 0.45), kind = o.kind ?? 0, melt = o.melt ?? 0.5;
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, id = {};
    const key = (a, sxn, syn, szn) => a + sxn + ',' + syn + ',' + szn;
    for (const a of [0, 1, 2]) for (const X of [-1, 1]) for (const Y of [-1, 1]) for (const Z of [-1, 1]) {
      const px = cx + X * (hx - (a === 0 ? 0 : b)), py = cy + Y * (hy - (a === 1 ? 0 : b)), pz = cz + Z * (hz - (a === 2 ? 0 : b));
      const u = a === 0 ? pz : px, w = a === 1 ? pz : py;
      id[key(a, X, Y, Z)] = this.v(px, py, pz, a === 0 ? X : 0, a === 1 ? Y : 0, a === 2 ? Z : 0, u, w, col, melt, kind);
    }
    let CX = cx, CY = cy, CZ = cz; if (this.xf) { const e = this.xf.elements; CX = e[0] * cx + e[4] * cy + e[8] * cz + e[12]; CY = e[1] * cx + e[5] * cy + e[9] * cz + e[13]; CZ = e[2] * cx + e[6] * cy + e[10] * cz + e[14]; }
    const P = this.p, out = (i0, i1, i2) => {        // orient so the face looks away from the centre
      const ax = P[i0 * 3] - CX, ay = P[i0 * 3 + 1] - CY, az = P[i0 * 3 + 2] - CZ;
      const ux = P[i1 * 3] - P[i0 * 3], uy = P[i1 * 3 + 1] - P[i0 * 3 + 1], uz = P[i1 * 3 + 2] - P[i0 * 3 + 2], vx = P[i2 * 3] - P[i0 * 3], vy = P[i2 * 3 + 1] - P[i0 * 3 + 1], vz = P[i2 * 3 + 2] - P[i0 * 3 + 2];
      const d = (uy * vz - uz * vy) * ax + (uz * vx - ux * vz) * ay + (ux * vy - uy * vx) * az;
      if (d >= 0) this.i.push(i0, i1, i2); else this.i.push(i0, i2, i1);
    };
    const q4 = (i0, i1, i2, i3) => { out(i0, i1, i2); out(i0, i2, i3); };
    for (const s of [-1, 1]) {
      q4(id[key(0, s, -1, -1)], id[key(0, s, 1, -1)], id[key(0, s, 1, 1)], id[key(0, s, -1, 1)]);
      q4(id[key(1, -1, s, -1)], id[key(1, 1, s, -1)], id[key(1, 1, s, 1)], id[key(1, -1, s, 1)]);
      q4(id[key(2, -1, -1, s)], id[key(2, 1, -1, s)], id[key(2, 1, 1, s)], id[key(2, -1, 1, s)]);
      for (const t of [-1, 1]) {
        q4(id[key(0, s, t, -1)], id[key(0, s, t, 1)], id[key(1, s, t, 1)], id[key(1, s, t, -1)]);
        q4(id[key(0, s, -1, t)], id[key(0, s, 1, t)], id[key(2, s, 1, t)], id[key(2, s, -1, t)]);
        q4(id[key(1, -1, s, t)], id[key(1, 1, s, t)], id[key(2, 1, s, t)], id[key(2, -1, s, t)]);
        for (const r of [-1, 1]) out(id[key(0, s, t, r)], id[key(1, s, t, r)], id[key(2, s, t, r)]);
      }
    }
  }
  /** smooth grid surface: f(u,v) -> [x,y,z] for u,v in 0..1; col: array or (u,v)->array; uvf: (u,v)->[s,t] metres. Returns sample access for beads. */
  grid(nu, nv, f, col, o = {}) {
    const kind = o.kind ?? 0, melt = o.melt ?? 0.5, base = this.count, pts = [], flip = o.flip ? -1 : 1;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pts.push(f(i / nu, j / nv));
    const at = (i, j) => ((o.ext && (i < 0 || i > nu || j < 0 || j > nv)) ? f(i / nu, j / nv) : pts[Math.min(nv, Math.max(0, j)) * (nu + 1) + Math.min(nu, Math.max(0, i))]), nrm = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), d = at(i, j + 1);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
      let nx = (uy * vz - uz * vy) * flip, ny = (uz * vx - ux * vz) * flip, nz = (ux * vy - uy * vx) * flip; const l = Math.hypot(nx, ny, nz) || 1;
      const P = at(i, j), u = i / nu, w = j / nv, uv = o.uvf ? o.uvf(u, w) : [u, w];
      nrm.push([nx / l, ny / l, nz / l]);
      this.v(P[0], P[1], P[2], nx / l, ny / l, nz / l, uv[0], uv[1], typeof col === 'function' ? col(u, w) : col, melt, kind);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      if (flip > 0) this.i.push(a, b, d, a, d, c); else this.i.push(a, d, b, a, c, d);
    }
    return { pts, nrm, nu, nv };
  }
  /** lathe about the y axis at (cx, cz): profile [[r, y], ...] bottom to top; an oval or dented pot via o.squash(angle, y) -> radius factor. */
  lathe(cx, cy, cz, prof, seg, col, o = {}) {
    const m = prof.length - 1;
    return this.grid(seg, m, (u, w) => { const k = Math.round(w * m), a = -u * Math.PI * 2, r = prof[k][0] * (o.squash ? o.squash(a, prof[k][1]) : 1);
      return [cx + Math.cos(a) * r, cy + prof[k][1], cz + Math.sin(a) * r]; }, col, o);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.t, 2)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 4));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(this.k, 1)); g.setIndex(this.i);
    g.computeBoundingSphere();
    return g;
  }
}

// ------------------------------------------------------------------------------------------------------------
// The pieces. Everything below is in ROOM coordinates (the brief's): +x port (the window wall at x = 9), y up, +z the room's length.
const WIN = { z0: 24, z1: 34, y0: 2, y1: 10, transom: 8, post: 0.4, wallT: 1.3, frameX: 9.85 };
const scl = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function buildCasementWall(g, gOut, gPane, C, o) {
  const { z0, z1, y0, y1, wallT, frameX } = WIN, K = KIND, W = [1, 1, 1];
  const zA = o.wallZ0, zB = o.wallZ1, xi = 9, xo = 9 + wallT;
  // interior plaster around the opening (normal -x), tile skirting along the foot
  const inQ = (za, zb, ya, yb, kind) => g.quad([xi, ya, za], [xi, ya, zb], [xi, yb, zb], [xi, yb, za], W, kind, 0, [za, ya, zb, ya, zb, yb, za, yb]);
  inQ(zA, zB, 0, 0.44, K.tiles); inQ(zA, zB, 0.44, y0, K.plaster); inQ(zA, z0, y0, y1, K.plaster); inQ(z1, zB, y0, y1, K.plaster); inQ(zA, zB, y1, 11, K.plaster);
  g.box(xi - 0.03, 0.47, (zA + zB) / 2, 0.06, 0.06, zB - zA, C.umber, { kind: K.wood, bevel: 0.02, melt: 0.3 });
  // reveals: jambs, head, and a sloped plaster sill under an oak board
  g.quad([xi, y0, z0], [frameX, y0, z0], [frameX, y1, z0], [xi, y1, z0], W, K.plaster);
  g.quad([frameX, y0, z1], [xi, y0, z1], [xi, y1, z1], [frameX, y1, z1], W, K.plaster);
  g.quad([xi, y1, z0], [frameX, y1, z0], [frameX, y1, z1], [xi, y1, z1], W, K.plaster);
  g.box((xi + frameX) / 2 - 0.12, y0 - 0.06, (z0 + z1) / 2, frameX - xi + 0.3, 0.12, z1 - z0 + 0.3, C.umber, { kind: K.wood, bevel: 0.035, melt: 0.6 });
  // the oak frame: posts, head, sill, transom, upper mullion; pegged, with a moulded inner edge
  const fx = frameX + 0.1, wood = C.frame, fo = { kind: K.wood, bevel: 0.07, melt: 0.65 };
  for (const z of [z0 + 0.2, z1 - 0.2]) { g.box(fx, (y0 + y1) / 2, z, 0.34, y1 - y0, 0.4, wood, fo); g.box(fx - 0.2, (y0 + y1) / 2, z + (z < 29 ? 0.16 : -0.16), 0.1, y1 - y0 - 0.3, 0.1, scl(wood, 1.15), fo); }
  g.box(fx, y1 - 0.17, 29, 0.34, 0.34, z1 - z0, wood, fo); g.box(fx, y0 + 0.11, 29, 0.36, 0.22, z1 - z0, wood, fo);
  g.box(fx, WIN.transom + 0.18, 29, 0.4, 0.36, z1 - z0 - 0.6, wood, fo); g.box(fx - 0.22, WIN.transom + 0.3, 29, 0.12, 0.1, z1 - z0 - 0.7, scl(wood, 1.2), fo);
  g.box(fx, (WIN.transom + y1) / 2, 29, 0.34, y1 - WIN.transom - 0.5, 0.34, wood, fo);
  for (const z of [z0 + 0.2, z1 - 0.2]) for (const y of [2.9, 5.0, 7.1]) {            // hinge pintles and straps, iron
    g.box(fx - 0.21, y, z + (z < 29 ? 0.2 : -0.2), 0.09, 0.26, 0.09, C.black, { bevel: 0.03, melt: 0.4 });
  }
  // upper fixed lights, milky leaded glass (uv in metres from each light's corner), iron saddle bars across them
  const ty0 = WIN.transom + 0.36, ty1 = y1 - 0.34;
  for (const [za, zb] of [[z0 + 0.4, 29 - 0.17], [29 + 0.17, z1 - 0.4]]) {
    gPane.quad([fx, ty0, za], [fx, ty0, zb], [fx, ty1, zb], [fx, ty1, za], W, K.pane, 0, [0, 0, zb - za, 0, zb - za, ty1 - ty0, 0, ty1 - ty0]);
    g.box(fx - 0.06, (ty0 + ty1) / 2, (za + zb) / 2, 0.05, 0.05, zb - za, C.black, { bevel: 0.02, melt: 0.3 });
  }
  // outside: brick face with a stone sill and a whitewashed band, and the reveal seen from the harbour
  const B = C.brick, outQ = (za, zb, ya, yb) => gOut.quad([xo, ya, zb], [xo, ya, za], [xo, yb, za], [xo, yb, zb], B, K.brick, 0.3, [zb, ya, za, ya, za, yb, zb, yb]);
  outQ(zA, zB, o.outY0, y0); outQ(zA, z0, y0, y1); outQ(z1, zB, y0, y1); outQ(zA, zB, y1, 11.6);
  gOut.box(xo + 0.1, y0 - 0.14, 29, 0.5, 0.28, z1 - z0 + 0.8, C.stone, { bevel: 0.05, melt: 0.4 });
  gOut.box(xo + 0.06, y1 + 0.2, 29, 0.3, 0.4, z1 - z0 + 0.8, C.stone, { bevel: 0.05, melt: 0.4 });
  gOut.quad([xo, y0, z0], [fx, y0, z0], [fx, y1, z0], [xo, y1, z0], C.white, 0, 0.3); gOut.quad([fx, y0, z1], [xo, y0, z1], [xo, y1, z1], [fx, y1, z1], C.white, 0, 0.3);
  gOut.quad([fx, y1, z0], [xo, y1, z0], [xo, y1, z1], [fx, y1, z1], C.white, 0, 0.3);
  // green shutters folded back against the brick either side (his outdoor green)
  for (const [zc, s] of [[z0 - 2.4, 1], [z1 + 2.4, -1]]) {
    gOut.box(xo + 0.12, (y0 + WIN.transom) / 2, zc, 0.14, WIN.transom - y0, 4.4, C.green, { bevel: 0.04, melt: 0.4 });
    for (let j = 0; j < 3; j++) gOut.box(xo + 0.21, y0 + 0.8 + j * 2.2, zc, 0.06, 0.18, 4.2, scl(C.black, 1.4), { bevel: 0.02, melt: 0.2 });
    for (let j = 0; j < 5; j++) gOut.box(xo + 0.2, (y0 + WIN.transom) / 2, zc - 1.76 + j * 0.88, 0.03, WIN.transom - y0 - 0.2, 0.04, scl(C.green, 0.7), { bevel: 0.01, melt: 0.2 });
  }
}

// One opening leaf in its own hinge space: the hinge line is the local y axis, the leaf lies in x = 0 and runs toward
// +z*dir. Returns the bars' and stiles' geometry in gW and its glass (aKind leaf, uv in metres) in gG.
function buildLeaf(gW, gG, C, dir, rng) {
  const Wd = 4.58, yb = 2.24, yt = WIN.transom - 0.02, st = 0.24, th = 0.13, K = KIND;
  const fo = { kind: K.wood, bevel: 0.055, melt: 0.65 }, Z = (z) => z * dir;
  gW.box(0, (yb + yt) / 2, Z(st / 2 + 0.03), th, yt - yb, st, C.frame, fo); gW.box(0, (yb + yt) / 2, Z(Wd - st / 2), th, yt - yb, st, C.frame, fo);
  gW.box(0, yb + st / 2, Z(Wd / 2), th, st, Wd - 0.1, C.frame, fo); gW.box(0, yt - st / 2, Z(Wd / 2), th, st, Wd - 0.1, C.frame, fo);
  const ia = st + 0.03, ib = Wd - st, ja = yb + st, jb = yt - st, lead = scl(C.black, 2.1), lo = { bevel: 0.01, melt: 0.2 };
  const nz = Math.round((ib - ia) / 0.42), ny = Math.round((jb - ja) / 0.62), cz = (ib - ia) / nz, cy = (jb - ja) / ny;
  for (let i = 1; i < nz; i++) gW.box((rng() - 0.5) * 0.012, (ja + jb) / 2, Z(ia + i * cz), 0.024, jb - ja, 0.032, lead, lo);
  for (let j = 1; j < ny; j++) gW.box((rng() - 0.5) * 0.012, ja + j * cy, Z((ia + ib) / 2), 0.024, 0.032, ib - ia, lead, lo);
  for (const y of [ja + (jb - ja) * 0.33, ja + (jb - ja) * 0.67]) gW.box(-0.06, y, Z((ia + ib) / 2), 0.045, 0.06, ib - ia + 0.1, C.black, lo);   // saddle bars
  gW.box(-0.1, yb + 2.3, Z(Wd - 0.13), 0.07, 0.5, 0.09, C.black, { bevel: 0.03, melt: 0.3 }); gW.box(-0.19, yb + 2.42, Z(Wd - 0.13), 0.2, 0.07, 0.07, C.ochre, { bevel: 0.03, melt: 0.3 });   // latch
  for (const y of [2.9, 5.0, 7.1]) gW.box(0, y, Z(0.3), th + 0.04, 0.12, 0.6, C.black, { bevel: 0.03, melt: 0.3 });                     // hinge straps
  const uv = [0, 0, (ib - ia) * 0.42 / cz, 0, (ib - ia) * 0.42 / cz, (jb - ja) * 0.62 / cy, 0, (jb - ja) * 0.62 / cy];
  gG.quad([0, ja, Z(ia)], [0, ja, Z(ib)], [0, jb, Z(ib)], [0, jb, Z(ia)], [1, 1, 1], K.leaf, dir < 0 ? 1 : 0, uv);
  return { tip: Wd, beadsAt: { ja, jb, ia, ib, cz, cy, nz, ny } };
}

// The carpet table and what lies on it (z 15..27, x 3..7.5, top y 2.3). Pushes pointilles into `beads`.
async function buildTable(ctx, g, C, rng, beads, detail) {
  const K = KIND, TOP = 2.3, ph = [rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28], ridgeZ = 19.1 + rng() * 0.8, ridgeH = 1.4 + rng() * 0.2;
  const bead = (P, N, col, base, size, swell = 1) => beads.push([P[0] + N[0] * 0.025, P[1] + N[1] * 0.025, P[2] + N[2] * 0.025, N[0], N[1], N[2], col[0], col[1], col[2], base[0], base[1], base[2], size, swell]);
  const sz = () => 0.045 + 0.075 * rng() * rng();
  // oak table: top, apron, four bulbous turned legs, stretchers
  const wo = { kind: K.wood, bevel: 0.09, melt: 0.8 };
  g.box(5.25, TOP - 0.1, 21, 4.5, 0.2, 12, C.umber, wo); g.box(5.25, TOP - 0.42, 21, 3.9, 0.44, 11.4, scl(C.umber, 0.85), wo);
  const leg = [[0.26, 0], [0.3, 0.1], [0.24, 0.24], [0.15, 0.34], [0.14, 0.6], [0.2, 0.72], [0.31, 0.95], [0.34, 1.18], [0.27, 1.4], [0.16, 1.52], [0.2, 1.6], [0.2, 1.68]];
  for (const x of [3.5, 7.0]) for (const z of [15.6, 26.4]) g.lathe(x, 0, z, leg, 14, C.umber, { kind: K.wood, melt: 0.7 });
  await ctx.yield();
  for (const x of [3.5, 7.0]) g.box(x, 0.42, 21, 0.2, 0.2, 10.6, C.umber, wo);
  g.box(5.25, 0.42, 21, 3.4, 0.16, 0.2, C.umber, wo);
  // the Turkey carpet: 13 m by 6.6 m, pushed into a ridge, hanging to the floor on the room's side and over the door end
  const CZ0 = 13.0, CZL = 11.5, carpet = (u, v) => { const P = carpet0(u, v), t = 14.93 - P[2]; if (t > 0) { const a = Math.min(t / 0.22, 1) * Math.PI / 2, hang = Math.max(t - 0.22, 0); P[2] = 14.93 - 0.14 * Math.sin(a) - 0.05 * hang * (1 + Math.sin(P[0] * 3.1 + ph[1])); P[1] = Math.max(0.07, P[1] - 0.14 * (1 - Math.cos(a)) - hang * 1.25); } return P; };
  const carpet0 = (u, v) => {
    const s = u * 13, d = v * 6.6; let z = CZ0 + s * (CZL / 13);
    const zr = ridgeZ + 0.8 * Math.sin(d * 0.55 + ph[0]) - 0.1 * d, dz = z - zr, wd = dz < 0 ? 0.6 : 1.05;
    // the ridge sags to a saddle across the middle of the table: from the door end the white jug stands clear in the notch
    const hr = ridgeH * (0.8 + 0.2 * Math.sin(d * 0.9 + ph[1])) * Math.exp(-(dz / wd) * (dz / wd)) * (1 - 0.66 * Math.exp(-(((d - 3.0) / 1.05) ** 2)));
    const h2 = 0.42 * Math.exp(-(((dz - 2.2) / 0.5) ** 2)) * (0.6 + 0.4 * Math.sin(d * 1.3 + ph[2])) + 0.3 * Math.exp(-(((dz + 1.7) / 0.4) ** 2)) * (0.5 + 0.5 * Math.sin(d * 1.7 + ph[3]));
    const H = hr + h2 + 0.035 * Math.sin(z * 2.3 + d * 1.1 + ph[2]) + 0.03;
    z -= 0.3 * hr;
    if (d < 4.25) return [7.35 - d, TOP + 0.03 + H, z, H];
    const drop = d - 4.25, a = Math.min(drop / 0.32, 1) * Math.PI / 2, k = Math.min(drop / 1.5, 1);
    let x = 3.1 - 0.2 * Math.sin(a) - H * 0.55 * Math.exp(-drop * 0.3) - (0.13 * Math.sin(z * 1.7 + ph[3]) + 0.07 * Math.sin(z * 4.1 + ph[0])) * k - 0.1 * k;
    let y = TOP + 0.03 - 0.2 * (1 - Math.cos(a)) - Math.max(drop - 0.32, 0) + H * 0.5 * Math.exp(-drop * 0.9);
    if (y < 0.07) { x -= (0.07 - y) * 0.9; y = 0.07 + 0.02 * Math.sin(z * 3.); }
    return [x, y, z, H];
  };
  const nu = Math.round(140 * detail), nv = Math.round(72 * detail);
  await ctx.yield();
  for (let h = 0; h < 10; h++) {                                             // in ten strips, so no build step is long; o.ext keeps the seams smooth
    g.grid(Math.round(nu / 10), nv, (u, v) => carpet((h + u) / 10, v), C.red, { kind: K.carpet, melt: 0.07, flip: true, ext: true, uvf: (u, v) => [(h + u) / 10 * 13, v * 6.6] });
    await ctx.yield();
  }
  // knots catching the light: gathered in a few dense clusters on the ridge crest (never loose on the flat), and on
  // the fringe at both ends
  const nrmAt = (a, b) => { const e = 0.004, P4 = carpet(a, b), Pa = carpet(a + e, b), Pb = carpet(a, b + e);
    const ux = Pa[0] - P4[0], uy = Pa[1] - P4[1], uz = Pa[2] - P4[2], vx = Pb[0] - P4[0], vy = Pb[1] - P4[1], vz = Pb[2] - P4[2];
    let nx = -(uy * vz - uz * vy), ny = -(uz * vx - ux * vz), nz = -(ux * vy - uy * vx); const l = Math.hypot(nx, ny, nz) || 1; return [P4, [nx / l, ny / l, nz / l]]; };
  const crestA = (b, off = 0) => { const d = b * 6.6, ac = (ridgeZ + off + 0.8 * Math.sin(d * 0.55 + ph[0]) - 0.1 * d - CZ0) / CZL; let best = ac, hb = -1;
    for (let k = -12; k <= 12; k++) { const a = ac + k * 0.004, H = carpet0(a, b)[3]; if (H > hb) { hb = H; best = a; } } return best; };
  const gs = () => (rng() + rng() + rng() + rng() - 2) * 0.87;                    // near enough a unit gaussian
  for (const [b0, off] of [[0.1 + rng() * 0.05, 0], [0.56 + rng() * 0.03, 0], [0.63 + rng() * 0.025, 0], [0.69 + rng() * 0.02, 0], [0.25 + rng() * 0.04, 0], [0.4 + rng() * 0.05, 2.2], [0.53 + rng() * 0.03, 2.2], [0.61 + rng() * 0.02, 2.2]]) {   // the ridge's crest, then the fold beyond it
    const lem = rng() < 0.3;
    for (let i = 0, n = Math.round((34 + rng() * 14) * (0.6 + 0.4 * detail)); i < n; i++) {
      const b = b0 + gs() * 0.022, [P4, N] = nrmAt(crestA(b, off) + gs() * 0.0035, b);
      if (P4[3] > 0.18) bead(P4, N, lem && rng() < 0.6 ? C.lemon : C.white, C.red, 0.045 + 0.05 * rng() * rng());
    }
  }
  for (const [a0, b0, zo] of [[1, 0.12 + rng() * 0.08, 0.2], [1, 0.36 + rng() * 0.06, 0.2], [1, 0.56 + rng() * 0.05, 0.2], [0, 0.5 + rng() * 0.1, -0.06], [0, 0.2 + rng() * 0.1, -0.06]]) {
    for (let i = 0, n = Math.round((30 + rng() * 8) * (0.6 + 0.4 * detail)); i < n; i++) {
      const P4 = carpet(a0, Math.min(0.63, Math.max(0.01, b0 + gs() * 0.03)));
      bead([P4[0], P4[1] + (a0 ? 0 : 0.05 + 0.1 * rng()), P4[2] + zo * (0.3 + rng())], a0 ? [0, 1, 0] : [-0.3, 0.3, -0.9], C.white, a0 ? C.white : C.red, 0.045 + 0.04 * rng() * rng());
    }
  }
  await ctx.yield();
  // white fringe at the carpet's far end, lying on the table
  g.grid(Math.round(40 * detail), 2, (u, v) => { const P = carpet(1, u * 4.2 / 6.6); return [P[0], P[1] - 0.02 - v * 0.03, P[2] + v * (0.3 + 0.06 * Math.sin(u * 90.))]; }, scl(C.white, 0.96), { melt: 0.6, flip: true });
  g.grid(Math.round(40 * detail), 2, (u, v) => { const P = carpet(0, u * 0.64); return [P[0], Math.max(0.03, P[1] - 0.05) + 0.02 * (1 - v), P[2] - 0.03 - v * (0.26 + 0.07 * Math.sin(u * 83.))]; }, scl(C.white, 0.96), { melt: 0.6 });   // and at the door end, lying on the marble
  // white faience jug with a pewter lid
  const jx = 5.75, jz = ridgeZ + 3.3, jy = carpet((jz - CZ0) / CZL, 1.6 / 6.6)[1];
  const jug = [[0.02, 0.0], [0.2, 0.0], [0.215, 0.035], [0.18, 0.09], [0.2, 0.16], [0.27, 0.27], [0.325, 0.4], [0.34, 0.5], [0.315, 0.62], [0.25, 0.73], [0.17, 0.83], [0.135, 0.93], [0.13, 1.0], [0.15, 1.06], [0.165, 1.085]];
  const jg = g.lathe(jx, jy, jz, jug, 28, scl(C.white, 1.05), { melt: 0.3 });
  g.lathe(jx, jy + 1.085, jz, [[0.172, 0], [0.165, 0.035], [0.11, 0.075], [0.05, 0.1], [0.035, 0.13], [0.05, 0.155], [0.0, 0.17]], 20, C.pewter, { melt: 0.7 });
  g.grid(14, 8, (u, v) => {                                                  // the handle, away from the window
    const t = u * Math.PI, a = v * Math.PI * 2, rr = 0.036 + 0.012 * Math.sin(t), cx = 0.2 + 0.2 * Math.sin(t), cy = 0.98 - 0.52 * u - 0.03 * Math.sin(t * 2.);
    const ox = Math.cos(a) * rr, oy = Math.sin(a) * rr * 0.8;
    return [jx - (cx + ox * Math.sin(t) ) * 0.8 - 0, jy + cy + ox * Math.cos(t) * 0.6, jz - (cx + ox * Math.sin(t)) * 0.6 + oy];
  }, C.white, { melt: 0.12 });
  for (let i = 0; i < 80; i++) {                                              // wet rim, the belly's window, the lid
    const a = rng() * 6.28, r = rng();
    if (r < 0.62) bead([jx + Math.cos(a) * 0.168, jy + 1.09, jz + Math.sin(a) * 0.168], [Math.cos(a) * 0.5, 0.86, Math.sin(a) * 0.5], C.white, C.white, sz() * 0.8);
    else { const ii = Math.floor(rng() * 6), row = 5 + Math.floor(rng() * 5), q = row * 29 + ((27 + ii) % 28); bead(jg.pts[q], jg.nrm[q], C.white, scl(C.white, 0.9), sz() * 0.8); }
  }
  await ctx.yield();
  // bread in a basket: wicker bowl, two loaves and a broken roll, crust dotted lemon and white
  const bx = 6.45, bz = Math.min(jz + 1.75, 24.6), by = carpet((bz - CZ0) / CZL, 0.9 / 6.6)[1] - 0.01;
  const bk = [[0.02, 0.02], [0.36, 0.02], [0.4, 0.06], [0.47, 0.2], [0.55, 0.36], [0.6, 0.46], [0.63, 0.5], [0.6, 0.53], [0.55, 0.5]];
  const weave = (a, y) => 1 + 0.022 * Math.sin(a * 22 + (Math.round(y * 16) % 2) * 3.14) * (y > 0.04 && y < 0.47 ? 1 : 0.2);
  const bg = g.lathe(bx, by, bz, bk, 88, (u, v) => scl(C.ochre, 0.82 + 0.3 * (Math.sin(u * 22 * 6.28 + Math.round(v * 8) * 3.14) > 0 ? 1 : 0.55) * 0.5), { melt: 0.65, squash: weave });
  for (let i = 0; i < 150; i++) { const q = (6 + Math.floor(rng() * 2)) * 89 + Math.floor(rng() * 88), s = sz(), c = rng() < 0.55 ? C.lemon : C.white; bead(bg.pts[q], bg.nrm[q], c, C.ochre, s); }
  const loaves = [[bx - 0.12, by + 0.52, bz - 0.14, 0.4, 0.22, 0.3, 0.5], [bx + 0.2, by + 0.5, bz + 0.2, 0.3, 0.2, 0.26, 2.1], [bx - 0.75, by + 0.14 - 0.0, bz + 0.5, 0.26, 0.17, 0.2, 1.2]];
  for (const [lx, ly, lz, ra, rb, rc, rot] of loaves) {
    const p1 = rng() * 6.28, cr = Math.cos(rot), sr = Math.sin(rot);
    const lf = g.grid(20, 12, (u, v) => {
      const a = u * Math.PI * 2, b = (v - 0.5) * Math.PI, lump = 1 + 0.09 * Math.sin(a * 3 + p1) * Math.cos(b * 2) + 0.05 * Math.sin(a * 7 + b * 5 + p1);
      const X = Math.cos(a) * Math.cos(b) * ra * lump, Y = Math.sin(b) * rb * (b < 0 ? 0.55 : 1) * lump, Zz = Math.sin(a) * Math.cos(b) * rc * lump;
      return [lx + X * cr - Zz * sr, ly + Y, lz + X * sr + Zz * cr];
    }, (u, v) => mixc(C.crust, C.ochre, Math.max(0, Math.min(1, v * 1.6 - 0.5 + 0.3 * Math.sin(u * 19 + p1)))), { melt: 0.75, flip: true });
    for (let i = 0; i < 110; i++) { const q = (5 + Math.floor(rng() * 7)) * 21 + Math.floor(rng() * 20), s = sz(), c = rng() < 0.6 ? C.lemon : C.white; bead(lf.pts[q], lf.nrm[q], c, C.ochre, s * 0.9); }
  }
  return { carpet, jug: [jx, jy, jz], basket: [bx, by, bz], ridgeZ, ridgeH };
}

// The blue cloth over the table's far end (in the brightest pool), pearls and a lemon ribbon on it.
function buildCloth(g, C, rng, beads, detail) {
  const TOP = 2.3, A0 = 3.4, B0 = 1.62, ph = rng() * 6.28, hx = 0.9 + rng() * 0.8, hz = 0.4 + rng() * 0.4;
  const roll = (d) => { const a = Math.min(Math.max(d, 0) / 0.25, 1) * Math.PI / 2; return [0.16 * Math.sin(a), 0.16 * (1 - Math.cos(a)) + Math.max(d - 0.25, 0)]; };
  const cloth = (a, b) => {
    const ra = roll(a - A0), rb = roll(b - B0), top = (a < A0 && b < B0) ? 1 : 0;
    let x = 6.4 - Math.min(a, A0) - ra[0], z = 25.4 + Math.min(b, B0) + rb[0];
    const e = Math.min(a, b, 0.5) / 0.5, r2 = (a - hx) * (a - hx) + (b - hz) * (b - hz);
    let y = TOP + 0.025 - Math.max(ra[1], rb[1]) + top * e * (0.05 + 0.045 * Math.sin(a * 3.1 + b * 2.2 + ph) * Math.sin(b * 4.3 + ph) + 0.24 * Math.exp(-r2 / 0.22) + 0.1 * Math.exp(-((a - b * 1.3 - 1.4) ** 2) / 0.05));
    const kA = Math.min(ra[1] / 0.8, 1), kB = Math.min(rb[1] / 0.8, 1);
    x -= (0.09 * Math.sin(z * 5.2 + ph) + 0.05) * kA; z += (0.09 * Math.sin(x * 5.2 + ph * 2.) + 0.05) * kB;
    return [x, y, z];
  };
  const nu = Math.round(46 * detail), nv = Math.round(30 * detail);
  const cg = g.grid(nu, nv, (u, v) => cloth(u * 4.75, v * 2.95), (u, v) => scl(C.ultra, 1 + 0.12 * Math.sin(u * 40 + v * 23)), { melt: 0.7 });
  const onTop = (x, z) => cloth(6.4 - x, z - 25.4);
  // pearls: a string let fall in a loop, one end over the edge
  const pr = 0.058, sph = []; for (let k = 0; k <= 5; k++) { const b = (k / 5 - 0.5) * Math.PI; sph.push([Math.cos(b) * pr, Math.sin(b) * pr + pr]); }
  const cx = 4.55 + rng() * 0.4, cz = 26.05 + rng() * 0.25, tw = rng() * 6.28, np = Math.round(38 * (0.5 + 0.5 * detail));
  for (let i = 0; i < np; i++) {
    const t = i / np * 5.4 + tw, rr = 0.42 + 0.14 * Math.sin(t * 2. + tw), x = cx + Math.cos(t) * rr * 1.25 + (i / np - 0.5) * 0.5, z = cz + Math.sin(t) * rr * 0.72;
    const P = onTop(x, z);
    g.lathe(P[0], P[1] - 0.01, P[2], sph, 8, mixc(C.white, C.shade, 0.18), { melt: 0.85 });
    beads.push([P[0] + 0.035, P[1] + 0.085, P[2] - 0.01, 0.6, 0.75, -0.1, ...C.white, ...C.white, 0.045 + rng() * 0.02, 1]);
  }
  // the lemon ribbon: across the cloth and over the room-side edge
  const r0 = cz - 0.55, rph = rng() * 6.28;
  g.grid(Math.round(34 * detail), 2, (u, v) => {
    const a = 0.9 + u * 3.3, b = (r0 - 25.4) + 0.35 * Math.sin(u * 5. + rph) + u * 0.3 + (v - 0.5) * 0.16, P = cloth(a, b);
    const lift = 0.02 + 0.06 * Math.abs(Math.sin(u * 9. + rph)) * (a < A0 ? 1 : 0.3);
    return [P[0] - (a > A0 ? lift : 0), P[1] + (a < A0 ? lift : 0), P[2]];
  }, C.lemon, { melt: 0.5 });
  for (let i = 0, n = Math.round(60 * detail); i < n; i++) {              // light on the cloth's fold crests
    const q = Math.floor(rng() * nv * 0.5) * (nu + 1) + Math.floor(rng() * nu * 0.7), P = cg.pts[q], N = cg.nrm[q], s = 0.045 + rng() * 0.03;
    if (P[1] > TOP + 0.13) beads.push([P[0], P[1] + 0.02, P[2], N[0], N[1], N[2], ...C.white, ...C.ultra, s, 1]);
  }
}

// ------------------------------------------------------------------------------------------------------------
// What the casement opens on: sand quay, still water, the town in one band (light version: the world coder may
// keep it, add near detail to it, or pass opts.vista = false and build a richer one with outdoorMaterial()).
async function buildVista(ctx, gT, gQ, C, rng, detail) {
  const K = KIND, WY = -11;
  // a house: body, pitched roof, optional stepped gable toward the water; f = 1 ridge along z (eaves to us), 0 ridge along x (gable to us)
  const house = (x, z, w, d, eave, ridge, f, wall, roof, stepped) => {
    const x0 = x - d / 2, x1 = x + d / 2, z0 = z - w / 2, z1 = z + w / 2, m = 0.35, KB = wall[1] > 0.7 ? K.object : K.brick;
    gT.quad([x0, WY, z1], [x0, WY, z0], [x0, eave, z0], [x0, eave, z1], wall, KB, m, [z1, WY, z0, WY, z0, eave, z1, eave]);
    gT.quad([x0, WY, z0], [x1, WY, z0], [x1, eave, z0], [x0, eave, z0], wall, KB, m, [x0, WY, x1, WY, x1, eave, x0, eave]);
    gT.quad([x1, WY, z1], [x0, WY, z1], [x0, eave, z1], [x1, eave, z1], wall, KB, m, [x1, WY, x0, WY, x0, eave, x1, eave]);
    if (f) {
      const sl = Math.hypot(d / 2, ridge - eave);
      gT.quad([x0 - 0.4, eave - 0.3, z1], [x0 - 0.4, eave - 0.3, z0], [x, ridge, z0], [x, ridge, z1], roof, K.roof, m, [z1, 0, z0, 0, z0, sl, z1, sl]);
      gT.quad([x1, eave, z0], [x1, eave, z1], [x, ridge, z1], [x, ridge, z0], roof, K.roof, m, [z0, 0, z1, 0, z1, sl, z0, sl]);
      gT.quad([x0, eave, z0], [x1, eave, z0], [x, ridge, z0], [x, ridge, z0], wall, KB, m); gT.quad([x1, eave, z1], [x0, eave, z1], [x, ridge, z1], [x, ridge, z1], wall, KB, m);
    } else {
      const sl = Math.hypot(w / 2, ridge - eave);
      gT.quad([x0, eave, z0], [x1, eave, z0], [x1, ridge, z], [x0, ridge, z], roof, K.roof, m, [x0, 0, x1, 0, x1, sl, x0, sl]);
      gT.quad([x1, eave, z1], [x0, eave, z1], [x0, ridge, z], [x1, ridge, z], roof, K.roof, m, [x1, 0, x0, 0, x0, sl, x1, sl]);
      if (stepped) { const n = 4; for (let i = 0; i < n; i++) { const t = i / n, ww = w * (1 - t) + 0.6, y0 = eave + (ridge - eave) * t, y1 = eave + (ridge - eave) * (t + 1 / n) + 0.5;
        gT.quad([x0 - 0.05, y0, z + ww / 2], [x0 - 0.05, y0, z - ww / 2], [x0 - 0.05, y1, z - ww / 2], [x0 - 0.05, y1, z + ww / 2], wall, KB, m, [z + ww / 2, y0, z - ww / 2, y0, z - ww / 2, y1, z + ww / 2, y1]); }
      } else gT.quad([x0, eave, z1], [x0, eave, z0], [x0, ridge, z], [x0, ridge, z], wall, KB, m);
    }
    if (rng() < 0.6) { const cz = z + (rng() - 0.5) * w * 0.5; gT.box(x + (f ? 0.8 : (rng() - 0.5) * d * 0.5), ridge + 0.2, cz, 1.3, 3.2, 1.3, C.brick, { bevel: 0.1, melt: 0.3, kind: K.brick }); }
  };
  const walls = [C.brick, scl(C.brick, 0.8), mixc(C.brick, C.ochre, 0.5), scl(C.white, 0.93), scl(C.white, 0.86), mixc(C.brick, C.umber, 0.5)];
  const roofs = [C.brick, C.brick, scl(C.brick, 1.1), mixc(C.brick, C.ochre, 0.3), C.slate, mixc(C.slate, C.umber, 0.3)];
  const n = Math.round(150 * detail);
  for (let i = 0; i < n; i++) {
    const row = i % 3, z = -70 + (i / n) * 340 + (rng() - 0.5) * 5, w = 7 + rng() * 7, d = 10 + rng() * 6, eave = 3 + row * 4 + rng() * 9, ridge = eave + 6 + rng() * 9 + row * 3;
    const x = 157 + row * 17 + rng() * 6, f = rng() < 0.9 ? 1 : 0, wl = walls[Math.floor(rng() * walls.length)], rf = roofs[Math.floor(rng() * roofs.length)], st = rng() < 0.5;
    if (Math.abs(z - 96) < 9 && row === 0) continue;                           // the bridge and its yellow wall stand here
    house(x, z, f ? w * 2.4 : w, d, eave, f ? eave + (ridge - eave) * 0.62 : ridge, f, wl, rf, st);
    if (i % 40 === 39) await ctx.yield();
  }
  // town wall along the water, with the arch gap; the one-arch bridge; the two gates as masses; the yellow wall with its leaded window
  const wallQ = (z0, z1, h, col) => gT.quad([150, WY, z1], [150, WY, z0], [150, h, z0], [150, h, z1], col, K.brick, 0.3, [z1, WY, z0, WY, z0, h, z1, h]);
  wallQ(-70, 60, -5.5, C.brick); wallQ(130, 270, -5, scl(C.brick, 0.9)); wallQ(60, 90, -3, C.brick); wallQ(102, 130, -3, C.brick);
  gT.box(153, -1.4, 96, 7, 1.6, 12.6, C.stone, { bevel: 0.25, melt: 0.4 }); wallQ(90, 102, -0.6, C.stone);       // bridge deck (the arch is the world's portal mouth)
  house(156, 74, 26, 11, 6, 19, 1, C.brick, C.slate, false); house(153.5, 84, 6, 6, 9, 17, 0, scl(C.white, 0.9), C.brick, true);                    // long-roofed gate, to port
  house(157, 116, 16, 12, 8, 17, 1, C.brick, C.brick, false);                                                     // twin-turret gate, to starboard
  for (const z of [109, 123]) { gT.lathe(151.5, WY, z, [[2.6, 0], [2.6, 17], [2.9, 17.4], [2.9, 18.4], [0.3, 27], [0.0, 27.4]], 10, (u, v) => (v > 0.55 ? C.slate : C.brick), { kind: K.object, melt: 0.4 }); }
  gT.box(170, 3, 96, 2, 28, 17, C.lemon, { bevel: 0.2, melt: 0.3 });                                                // the yellow wall, set back above the arch
  gT.quad([168.9, 3, 99.5], [168.9, 3, 93], [168.9, 11, 93], [168.9, 11, 99.5], [1, 1, 1], K.pane, 0, [0, 0, 6.5, 0, 6.5, 8, 0, 8]);
  // the pale church tower, 110 m, lit when the strip stands on it
  let ty = WY; const tw = [[13, 46], [11, 20], [9, 16], [6.5, 12]];
  for (const [s, h] of tw) { gT.box(215, ty + h / 2, 150, s, h, s, C.stone, { bevel: 0.5, melt: 0.5 }); gT.box(215, ty + h, 150, s + 1.2, 1.2, s + 1.2, scl(C.stone, 0.9), { bevel: 0.3, melt: 0.5 }); ty += h; }
  gT.lathe(215, ty, 150, [[3.4, 0], [3.0, 4], [1.2, 12], [0.25, 16.5], [0, 17]], 8, C.slate, { melt: 0.5 });
  for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) gT.lathe(215 + dx, WY + 46, 150 + dz, [[1.2, 0], [1.1, 5], [0, 10]], 6, C.stone, { melt: 0.5 });
  // quay: sand shelf under the house wall, sloping into the water
  gQ.quad([10.3, -10, -90], [10.3, -10, 150], [31, -10, 150], [31, -10, -90], C.sand, K.sand, 0);
  gQ.quad([31, -10, -90], [31, -10, 150], [37, -11.3, 150], [37, -11.3, -90], C.sand, K.sand, 0);
}

// ------------------------------------------------------------------------------------------------------------
const HERO_AT = [9, 0, 29];                                   // room coordinates of the hero's local origin (foot of the casement)
/** room coordinates -> hero-local coordinates, and back */
export const roomToLocal = (p) => [p[2] - HERO_AT[2], p[1] - HERO_AT[1], HERO_AT[0] - p[0]];
export const localToRoom = (p) => [HERO_AT[0] - p[2], p[1] + HERO_AT[1], p[0] + HERO_AT[2]];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? 1)), U = makeStyleUniforms();   // this build's own set
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  [U.uWhite, U.uLemon, U.uUltra, U.uShade, U.uRed, U.uSky, U.uBlack].forEach((u, i) => u.value.copy(hexV(pal[i])));
  const C = { white: disp(pal[0]), lemon: disp(pal[1]), ultra: disp(pal[2]), shade: disp(pal[3]), red: disp(pal[4]), sky: disp(pal[5]), black: disp(pal[6]),
    umber: disp(MIXES.umber), ochre: disp(MIXES.ochre), green: disp(MIXES.green), brick: disp(MIXES.tile), sand: disp(MIXES.sand), slate: disp(MIXES.slate),
    frame: [0.2, 0.165, 0.14], pewter: disp('#9BA3A6'), crust: disp('#8A5A2C'), stone: disp('#BDB7A6') };
  const weather = opts.weather ?? (rng() < 0.6 ? 'cloud' : rng() < 0.6 ? 'rain' : 'pearl');
  setStyle(U, weather === 'rain' ? { stripLo: 0.9, stripHi: 0.975, indoorFloor: 0.56 } : weather === 'pearl' ? { stripLo: 0.92, stripHi: 0.99, indoorFloor: 0.74 } : { stripLo: 0.86, stripHi: 0.97, indoorFloor: 0.6 });
  setStyle(U, { golden: opts.golden ?? (rng() < 0.15 ? 0.6 : 0), exposure: opts.exposure ?? 1, flat: opts.flat ?? false });

  const object = new THREE.Group(); object.name = 'light-from-the-left-hero';
  const room = new THREE.Group(); room.rotation.y = Math.PI / 2; room.position.set(-HERO_AT[2], -HERO_AT[1], HERO_AT[0]); object.add(room);
  const matRoom = roomMaterial(U), matOut = outdoorMaterial(U), matPane = glassMaterial(U), matLeaf = glassMaterial(U, { leaf: true }), matBead = beadMaterial(U);
  const beads = [], g = new Geo(), gOut = new Geo(), gPane = new Geo();
  const wallZ0 = opts.wallZ0 ?? 18, wallZ1 = opts.wallZ1 ?? 40;
  buildCasementWall(g, gOut, gPane, C, { wallZ0, wallZ1, outY0: opts.outY0 ?? -10 });
  if (opts.floor !== false) { const fz0 = opts.floorZ0 ?? 12, fz1 = opts.floorZ1 ?? 42; g.quad([-9, 0, fz0], [-9, 0, fz1], [9, 0, fz1], [9, 0, fz0], [1, 1, 1], KIND.floor); }
  await ctx.yield();
  let table = null;
  if (opts.table !== false) { table = await buildTable(ctx, g, C, rng, beads, detail); await ctx.yield(); buildCloth(g, C, rng, beads, detail); await ctx.yield(); }
  const add = (geo, mat, parent = room) => { const m = new THREE.Mesh(geo.build(), mat); m.frustumCulled = false; parent.add(m); return m; };
  const roomMesh = add(g, matRoom); add(gOut, matOut); add(gPane, matPane);
  void roomMesh;                                            // contours are softened in the paint itself (melt): one clean edge, no veils
  await ctx.yield();
  // the two opening leaves, each on its hinge; their second swing phase comes from a stream of its own, so no draw stands
  // between the two leaves' own draws (bars, then first phase) in the hero's stream
  const leaves = [], leafPhase = ctx.core.makeRng(ctx.core.hashSeed('leafPhase:' + ctx.seed));
  for (const [hz, dir, open] of [[WIN.z0 + 0.4, 1, -(98 + rng() * 8) * Math.PI / 180], [WIN.z1 - 0.4, -1, (70 + rng() * 10) * Math.PI / 180]]) {
    const piv = new THREE.Group(); piv.position.set(WIN.frameX - 0.14, 0, hz); piv.rotation.y = open; room.add(piv);
    const gw = new Geo(), gg = new Geo(); buildLeaf(gw, gg, C, dir, rng);
    add(gw, matRoom, piv); const glass = add(gg, matLeaf, piv); glass.renderOrder = 5;
    leaves.push({ piv, open, dir, ph: rng() * 6.28, ph2: leafPhase() * 6.28 });
  }
  await ctx.yield();
  let dome = null;
  if (opts.vista !== false) {
    const gT = new Geo(), gQ = new Geo(), gW = new Geo();
    await buildVista(ctx, gT, gQ, C, rng, detail); await ctx.yield();
    const town = add(gT, matOut); add(gQ, matOut);
    const mirror = new THREE.Mesh(town.geometry, matOut); mirror.scale.y = -1; mirror.position.y = -22; mirror.frustumCulled = false; room.add(mirror);
    gW.quad([36, -11, -400], [36, -11, 600], [420, -11, 600], [420, -11, -400], [1, 1, 1], KIND.water);
    const water = add(gW, outdoorMaterial(U, { water: true })); water.renderOrder = 3;
    await ctx.yield();
  }
  if (opts.sky ?? (opts.vista !== false)) { dome = new THREE.Mesh(new THREE.SphereGeometry(2600, 24, 12), skyMaterial(U)); dome.renderOrder = -1; dome.frustumCulled = false; object.add(dome); }
  const beadMesh = makeBeads(beads, matBead); room.add(beadMesh);

  const L = (x, y, z) => new THREE.Vector3(...roomToLocal([x, y, z]));
  const anchors = {
    placement: { position: new THREE.Vector3(...HERO_AT), rotationY: -Math.PI / 2 },
    gap: L(9.9, 4.8, 29), gapOut: new THREE.Vector3(0, 0, -1),
    flyThrough: [L(-2, 3.3, 0), L(1.5, 3.3, 14), L(1.5, 3.3, 20), L(4.6, 4.0, 23.8), L(9.9, 4.8, 29), L(20, 2.5, 35.5), L(45, -7, 49), L(69, -7, 61), L(150, -6.5, 96)],
    portalSeat: { position: L(150, -6.5, 96), facing: new THREE.Vector3(-0.4384, 0, 0.8988) },
    viewpoints: { first: L(-2, 3.3, 0), reveal: L(0.8, 3.3, 11), closest: L(1.5, 3.3, 19), threshold: L(8, 4.6, 27.8) },
    carpetRidge: table ? L(5.2, 2.3 + table.ridgeH, table.ridgeZ) : null, jug: table ? L(...table.jug) : null, basket: table ? L(...table.basket) : null,
    leafHinges: [L(WIN.frameX - 0.14, 5, WIN.z0 + 0.4), L(WIN.frameX - 0.14, 5, WIN.z1 - 0.4)],
  };
  const pv = null;
  let progress = -1; const size = new THREE.Vector2();
  const api = {
    object, room, radius: pv ? pv.radius : 9, height: pv ? 0.5 : 11, center: pv ? pv.center : new THREE.Vector3(0, 4.6, 2.5), anchors, ground: false, groundY: 0, weather,
    materials: { room: matRoom, outdoor: matOut, pane: matPane, leaf: matLeaf, bead: matBead },
    uniforms: U,                                              // this build's own set: hand it to every factory, setStyle and updateStyle
    /** u = the world's path parameter 0..1 (path 190 m): slides the cloud field (pools, strip, cumulus, the bank's breaks). */
    setProgress(u) { progress = u; },
    update(dt, time, camera) {
      updateStyle(U, camera, room, time);
      // the pixel a dot's floor is reckoned in is that of a picture of 720 lines or more: on a smaller picture (a phone, a
      // small window, a slowed machine) a dot keeps the share of the picture it has at 720 lines and does not grow fat,
      // down to 2.2 px of the picture as it is, at which a near dot is held (a smaller one flickers as the eye moves); the
      // 0.25 m ceiling overrules it as in live (a far dot is 0.25 m wide at every size), and a dot under 2 cm has no floor
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); const p = Math.max(camera.projectionMatrix.elements[5], 0.1); U.uPxLo.value = 2 / (p * Math.max(size.y, 100)); U.uPx.value = 2 / (p * Math.max(size.y, 720)); }
      if (dome) { dome.position.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(dome.position); }
      U.uCloud.value = progress >= 0 ? 570 * progress : time * 6.6;
      for (const lf of leaves) lf.piv.rotation.y = lf.open + (lf.dir < 0 ? 0.07 : 0.025) * Math.sin(time * 0.5 + lf.ph) + 0.02 * Math.sin(time * 1.3 + lf.ph * 2.) + (lf.dir < 0 ? 0.1 : 0.02) * Math.sin(time * 0.9 + lf.ph2);   // the far leaf swings in the draught through a visible arc
    },
    dispose() {},
  };
  return api;
}
