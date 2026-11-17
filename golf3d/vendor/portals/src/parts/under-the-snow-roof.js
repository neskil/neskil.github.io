// HERO SET PIECE for "under-the-snow-roof": THE STRIKE.
// A great grey owl comes through the snow roof feet first. The glowing roof bulges, pales and cracks, bursts,
// and two feathered legs with spread black talons drive down a column of white daylight among tumbling snow
// blocks, clench on nothing, hold with the dark belly hanging in the hole, then wrench up and out trailing a plume.
// What is left is a ragged 65 degree shaft of banded snow rising to the sky, the owl rowing away across its
// mouth, late blocks and a down feather falling, and a place for the exit portal in the crater mouth.
//
// LOCAL SPACE  origin = the point on the gallery FLOOR where the feet land (y = 0 is the floor), +Y up.
//   The camera arrives along -Z (FRONT = +Z faces the incoming camera) down a gallery 20 m wide whose roof
//   underside is at y = ROOF_Y = 11 (exported); the snow surface is at y = 58. The shaft axis leaves the origin along
//   AX = (0, sin65, -cos65): it leans AWAY from the incoming camera, so a pull-up through 65 degrees (radius
//   12, starting at z = +6.2) puts the camera dead on the axis. Sun (default) is on the camera's left (-X),
//   13 degrees up: it whitens the +X (right) shaft wall. The owl leaves to the upper left (-X, +Z, up).
//
// SIZE     radius 40, height 64 (strike + shaft + crater; the flying owl, span 140, travels beyond that).
//          In the set-piece viewer the returned radius/height/center are smaller so that the orbit runs at
//          gallery eye level round the legs (the shaft then shows above the roof disc as a cutaway).
// COST     about 50k triangles, 11 draw calls, no lights, no textures, about 80 ms build.
// LIGHT    self-lit: every material is a ShaderMaterial fed by uniforms, not by scene lights. It expects the
//          dim cobalt/turquoise subnivean gloom (roof emissive 1-3, shadows #0E1E4A) and supplies the one cone
//          of white daylight itself. Scene fog is honoured everywhere (fog: true). Linear HDR out: daylight
//          column, cracks and sparks 2-6, surfaces under 0.8 albedo.
// OPTS     palette  [shadow, cobalt, turquoise, ice, sedge, berry, daylight] hex strings (brief order)
//          keys     { bulge: 0.79, burst: 0.83, wrench: 0.875 } world path u of the three beats
//          secondsPerU  how many seconds of strike choreography one unit of u is worth (default 53: the brief's
//                   2.4 s between burst and pull-out); gravity (default 32 m/s2, cinematic)
//          hour     'noon' | 'twilight' | 'night'     weather  'clear' | 'blizzard' | 'thaw'
//          sunDir   [x,y,z] toward the sun, local      roofGlow emissive level of the roof disc (default 2.4)
//          exitSide -1 (default: owl leaves to -X, the camera's upper left) or +1
// PROGRESS hero.setProgress(u) with the WORLD path u every frame. Everything scripted (bulge, cracks, burst,
//          plunge, clench, re-grip, pull-out, plume, every block's ballistic path, the owl's departure, the
//          feathers) is a pure function of u; only shimmer, wingbeat phase, sparks and spindrift loop on time.
//          Until setProgress is called the piece plays the strike on a 15 s loop (that is what the viewer shows).
//          hero.state = { t (strike seconds, 0 = burst), bulge, hole, day, clench, legs (visible), owl (visible) }.
//          hero.owlAt(u, out): is the owl out at path u, and where (into out); pure, for a look that follows the bird.
//          hero.owlShadowAt(u, o): is the owl's shadow on the snow over the gallery at path u, and where: metres up the
//          gallery from the roof hole, metres to its side, how it is turned, its half span, its edge, how dark, and where
//          its wings stand in their beat and its tilt (into o); pure. The world lays it into the disc's uniforms uShadow,
//          uShadowN and uShadowW and draws it on its own roof with the same shape and the same shade (OWL_GLSL); the disc
//          draws it too: the gliding shadow is gone before it reaches the disc, and the wings the bird spreads on the snow
//          as it strikes lie over the disc.
// ANCHORS  strikePoint   where the feet land (origin)            shaftAxis { origin, direction, radius, footY, surfaceY }
//          roofHole      { center, radiusX, radiusZ, discRadius, y }: the world's roof must be cut or discarded
//                        inside this ellipse; the hero's own roof disc (radius discRadius, 0.2 m under y) covers
//                        the cut until the burst and fades to transparent at its rim
//          flyThrough    ordered camera line: strike gallery (eye y = 3), pull-up arc, 60 m straight at 65 deg
//          portalSeat    { position, facing, up, radius }: centre of the 14 m portal in the crater mouth (its low
//                        edge sits on the far ejecta rim), facing back down the shaft; use portal tilt: true
//          lookAt        the bulge / the legs: hold the gaze here from u 0.78 to 0.89
//          closestPass   camera point when the legs wrench out, 27 m away
//          owl           live Vector3 (local) of the flying owl, for a poi after the pull-up
//          daylight      { origin, axis, radius }: add this cone (x hero.state.day) to floor and wall materials
//          sunDir, gallery { width, height }, timeline (the keys)
//          While the legs stand in the gallery the owl is known only by them and by the belly that hangs in the hole: a mass of
//          broad barred breast feathers, lit from above where it stands in the daylight (no head is ever seen under the snow).
//          In the plane of the roof's underside the belly's skin stands inside the hole across the gallery and toward us,
//          and the daylight falls past it there into the gallery; on the side away from us the belly comes to the hole's edge
//          where that edge stands at its nearest.
//          The breast feathers stand out from the skin, and their tips can touch the snow where the edge stands at its
//          nearest (the figures stand at the BELLY constants).
//          The feet close on the matted sedge of the floor (buildSedge); the torn edge of the roof hangs round the hole as
//          slabs of layered snow (buildLip); once the roof is through its lip springs back, so the legs show whole under it.
//          After the wrench the owl rows away up and out to the camera's upper left, seen from below: one continuous flight in
//          strike seconds (it starts 1.2 s after the wrench), one scale (span 126 m), the wingbeat on time at 1.6 a second. It
//          starts low over the crater, its barred underwings right across the shaft's mouth, its body beside the portal's ring
//          on the upper left, and slides away that way faster than the ring grows. setClimb(u0) is kept for callers.
//          The roof disc draws in the transparent pass (renderOrder -5) but writes depth; emissive = mix(turquoise,
//          cobalt, thickness) x roofGlow x exp(-1.5 thickness), thickness about 0.5: match the world's roof to that.
import * as THREE from 'three';

const V3 = THREE.Vector3;
const DEFAULT_PALETTE = ['#0E1E4A', '#2456B8', '#3FC9C4', '#D6F6F2', '#B4975A', '#C21F2E', '#F7FBFF'];
const DEG = Math.PI / 180, TAU = Math.PI * 2;
const EYE_Y = 2.6;
const PITCH = 65 * DEG, SIN_P = Math.sin(PITCH), COS_P = Math.cos(PITCH);
const AX = new V3(0, SIN_P, -COS_P);
export const ROOF_Y = 11;
const SURF_Y = 58, SHAFT_R = 11, PLUG_R = 34, HOLE_Z = -ROOF_Y * COS_P / SIN_P;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bellf = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return Math.sin(t * Math.PI) ** 2; };

// ---------------------------------------------------------------------------------------------------------
// geometry builder: position, colour, two free vec4 attributes; normals are computed at the end
// ---------------------------------------------------------------------------------------------------------
class GB {
  constructor() { this.p = []; this.c = []; this.a = []; this.b = []; this.i = []; this.n = 0; }
  v(x, y, z, col, a, b) {
    this.p.push(x, y, z); this.c.push(col[0], col[1], col[2]);
    this.a.push(a ? a[0] : 0, a ? a[1] : 0, a ? a[2] : 0, a ? a[3] : 0);
    this.b.push(b ? b[0] : 0, b ? b[1] : 0, b ? b[2] : 0, b ? b[3] : 0);
    return this.n++;
  }
  vv(p, col, a, b) { return this.v(p.x, p.y, p.z, col, a, b); }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // join rings of vertex indices (arrays of equal length); wrap closes each ring
  loft(rings, wrap = true) {
    for (let j = 0; j + 1 < rings.length; j++) {
      const r0 = rings[j], r1 = rings[j + 1], n = r0.length, m = wrap ? n : n - 1;
      for (let k = 0; k < m; k++) { const k1 = (k + 1) % n; this.quad(r0[k], r0[k1], r1[k1], r1[k]); }
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('a', new THREE.Float32BufferAttribute(this.a, 4));
    g.setAttribute('b', new THREE.Float32BufferAttribute(this.b, 4));
    g.setIndex(this.i);
    g.computeVertexNormals();
    return g;
  }
}

// ---------------------------------------------------------------------------------------------------------
// shared GLSL
// ---------------------------------------------------------------------------------------------------------
const GLSL_N = /* glsl */`
const vec3 AX = vec3(0.0, ${SIN_P.toFixed(5)}, ${(-COS_P).toFixed(5)});
float h11(float n){ return fract(sin(n*127.1+1.7)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x), mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x), f.y);
  float b=mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x), mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x), f.y);
  return mix(a,b,f.z); }
float fbm2(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*vn2(p); p=p*2.03+17.1; a*=.5; } return s/0.9375; }
float axisDist(vec3 p){ vec3 q = p - AX*dot(p, AX); return length(q); }
vec3 rotAx(vec3 p, vec3 ax, float an){ float c=cos(an), s=sin(an); return p*c + cross(ax,p)*s + ax*dot(ax,p)*(1.-c); }
`;
// fragment-only helpers: lighting uniforms, flat facets, glitter
const GLSL_F = /* glsl */`
uniform vec3 uCamL, uDayCol, uAmb, uShadowCol, uSunL, uSunCol, uSkyCol, uTurq, uCobalt;
uniform float uDay, uTime, uT;
vec3 facetN(vec3 p, vec3 N, vec3 V){ vec3 c = cross(dFdx(p), dFdy(p)); float l = length(c); vec3 f = l > 1e-12 ? c/l : N; return dot(f, V) < 0. ? -f : f; }
float glitter(vec3 p, vec3 V, float sc){ vec3 q = p*sc, c = floor(q); float h = h31(c);
  vec3 f = fract(q) - 0.5; float m = 1. - smoothstep(0.06, 0.26, length(f));
  vec3 d = vec3(h31(c+3.1), h31(c+7.7), h31(c+11.3))*2.-1.;
  float s = max(0., sin(dot(d, V)*9. + h*40. + uTime*1.7)); s *= s; s *= s; s *= s; return s*s*step(0.72, h)*m; }
float worley(vec2 p){ vec2 i = floor(p), f = fract(p); float d = 1.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y));
    vec2 r = g + vec2(h21(i+g), h21(i+g+17.3)) - f; d = min(d, dot(r, r)); }
  return sqrt(d); }
// nearest and second nearest cell point, and a hash of the nearest cell
vec3 wor3(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8., id = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 c = i + g;
    vec2 r = g + vec2(h21(c), h21(c+17.3)) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h21(c + 5.1); } else if (d < d2) { d2 = d; } }
  return vec3(sqrt(d1), sqrt(d2), id); }
// snow lit by the daylight cone (below the roof), the sky down the shaft (above it) and the roof glow
vec3 snowLight(vec3 p, vec3 N, float skyVis){
  float below = 1. - smoothstep(${(ROOF_Y - 1).toFixed(1)}, ${(ROOF_Y + 6).toFixed(1)}, p.y);
  float ad = axisDist(p)/12.5; float cone = exp(-ad*ad);
  float dl = max(dot(N, AX)*0.6+0.4, 0.);
  vec3 L = uDayCol*uDay*1.5*dl*cone*below;
  L += uSkyCol*skyVis*(0.55+0.45*max(dot(N, AX), 0.));
  L += uDayCol*uDay*0.42*exp(-dot(p.xz, p.xz)/1300.)*below;
  L += mix(uShadowCol*0.5, uAmb*(1. + 1.6*below), N.y*0.5+0.5)*mix(0.35, 1., below);
  return L;
}
`;
const FOG_VP = '#include <fog_pars_vertex>', FOG_V = '#include <fog_vertex>';
const FOG_FP = '#include <fog_pars_fragment>', FOG_F = '#include <fog_fragment>';
// fog for additive layers: fade to nothing instead of to the fog colour
const FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb *= 1.0 - fogF;
#endif`;
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// Fractures that run out from the bulge along the gallery roof toward the incoming camera (+Z): seven wandering lines with a spur
// each, which fan out of the dome and then keep to the gallery. The disc draws them, and the world draws the same ones on its own
// roof beyond the disc (it shares the uniforms uCrA and uCrGrow of the disc's material), so they join.
// q = xz from the hole centre (m), grow 0..1, pw = the width of a pixel there (m; taken by the caller, outside any loop).
// A fracture is a hairline that opens to a hand's width toward the dome and wider as the dome comes down: it runs in straight,
// kinked stretches (no even wave), throws two short spurs, gapes unevenly along its length and lies in a seam of sheared
// snow; the broken edge of the gap is a pale lip, in stretches. Returns (the gap, the seam either side of it, the pale lip); the
// caller colours them.
export const CRACK_GLSL = /* glsl */`
uniform vec4 uCrA[7];
float crTri(float x){ return abs(fract(x) - 0.5)*4. - 1.; }
float crackX(vec4 c, float d){
  return c.x*(1. - exp(-d/11.)) + c.w*(sin(d*0.19 + c.z) + 0.45*sin(d*0.53 + c.z*2.7) + 0.5*crTri(d*0.115 + c.z*1.9) + 0.2*crTri(d*0.37 + c.z*4.3));
}
vec3 galleryCracks(vec2 q, float grow, float pw){
  vec3 acc = vec3(0.);
  float d = q.y;
  if (d < 1. || grow < 0.004) return acc;
  float wide = 0.5 + 0.8*grow;
  for (int i = 0; i < 7; i++) {
    vec4 c = uCrA[i];
    float len = grow*c.y;
    float x = crackX(c, d);
    float taper = clamp(1. - d/max(len, 0.01), 0., 1.), on = step(d, len)*smoothstep(1., 5., d);
    float un = vn2(vec2(d*0.33, c.z*9.));
    float w = (0.05 + 0.5*taper*sqrt(taper))*wide*(0.5 + 1.0*un), ww = max(w, pw*0.75);
    float dist = abs(q.x - x), sd = q.x < x ? 0. : 3.3;
    float l = (1. - smoothstep(ww, ww + pw + 0.01, dist))*min(1., sqrt(w/ww))*on;
    float lip = (1. - smoothstep(ww*1.5 + 0.04, ww*2.6 + 0.14 + pw, dist))*on*(0.35 + 0.65*taper)*smoothstep(0.25, 0.7, vn2(vec2(d*0.9 + sd, c.z*5. + sd)));
    float seam = (1. - smoothstep(w*2. + 0.05, w*5. + 0.3 + pw, dist))*on*(0.45 + 0.55*taper);
    // two spurs leave it, one to each side, and die out after a few metres
    float sg = fract(c.z*7.3) < 0.5 ? -1. : 1.;
    for (int k = 0; k < 2; k++) {
      float fk = float(k), db = c.y*(0.14 + 0.2*fract(c.z*3.7) + fk*(0.3 + 0.16*fract(c.z*5.3))), e = d - db, lb = 4. + 6.*fract(c.z*1.9 + fk*0.37);
      float xb = crackX(c, db) + (1. - 2.*fk)*sg*(e*0.55 + 0.25*crTri(e*0.4 + c.z)), tb = clamp(1. - e/lb, 0., 1.);
      float w2 = 0.02 + 0.06*tb*taper, ww2 = max(w2, pw*0.75), on2 = step(0., e)*step(e, lb)*step(db + e, len), d2 = abs(q.x - xb)*0.87;
      l = max(l, (1. - smoothstep(ww2, ww2 + pw + 0.01, d2))*min(1., w2/ww2)*on2*0.8);
      seam = max(seam, (1. - smoothstep(w2*2. + 0.04, w2*5. + 0.2 + pw, d2))*on2*0.5);
    }
    acc.x = max(acc.x, l);
    acc.y = max(acc.y, seam);
    acc.z = max(acc.z, lip*(1. - l));
  }
  return acc;
}
// the daylight that stands in a crack's gap until the roof goes through: its colour, from the daylight's colour (day) and the
// turquoise (turq). A gap is mixed toward LEAK_GAP times it by the callers, where their measure of the gap is over 0.5
const float LEAK_GAP = 1.9;
vec3 leakCol(vec3 day, vec3 turq){ return mix(day, turq*1.3 + day*0.35, 0.3); }
`;
// The paling dome brightens the snow round it, for the disc and for the world: each multiplies its roof's own light by
// 1 + domeGain times how far the dome has paled (the caller's factor). DOME_GAIN is how many times brighter than itself the roof
// stands at the hole's centre when the dome has fully paled, less one; domeGain is DOME_GAIN at the hole's centre, falling off
// with the square of the distance in plan from it (d2, m2) to 1/e at 30 m. With the dim of the pressed snow at its greatest
// there (0.07 of itself) the roof at the centre then stands (1 + 1.0)*(1 - 0.07) = 1.86 times itself.
export const DOME_GLSL = /* glsl */`
const float DOME_GAIN = 1.0;
float domeGain(float d2){ return DOME_GAIN*exp(-d2/900.); }
`;
// The owl's shadow on the snow above, for the disc and for the world's roof (the world lays it by the hero's own law, owlShadowAt,
// into the three uniforms, which are the disc's own objects): the bird seen from below with its wings spread. uShadow.xy: its middle
// in plan, z: how dark, w: how many times longer than the bird it lies along the way it flies; uShadowN.xy: the way it flies,
// z: half its span (m), w: the width of its soft edge (m); uShadowW.x: how far the wings are off the level at this moment of the
// beat (0 level, 1 full up or full down: they are shorter in plan then, and their tips lag behind), y: how far the bird is tilted
// (one wing reaches further than the other). Measured in half spans, a forward along the bird and b out along a wing: two long
// wings, the wrist carried a little forward, the hind edge scalloped by the feathers' ends; at each tip five primaries spread
// like fingers from the wrist, each round at its end, with air between them from half their length out; the body, with the head a
// blunt round bump between the wings; the short tail behind, fanned, its end scalloped. The edge is soft by uShadowN.w, half of
// it to either side of the outline, so that a broad edge blurs the fingers together and does not shrink the bird
// owlShaded: the snow's light c under the shadow: a shade of the lit snow and not a hole in it. Light is weighed here as
// everywhere in these shaders (0.3 red, 0.5 green, 0.2 blue), and all of this holds in the shader's light, before the picture's
// tone curve. Where the shadow is whole (0.5 dark) the snow's light is the lesser of its own light there and one even tone
// (owlTone), 0.484*ref*(light/ref)^0.3, ref being the light of snow of middling depth: the share it keeps is
// 0.484*(ref/light)^0.7, at most 1. So snow as bright as ref keeps 0.484 of its light, snow twice as bright 0.30, three times
// as bright 0.22 (the tone itself rises only by 1.23 and 1.39 there: the bright and the middling under the bird come out
// nearly alike, and the outline is the bird's); snow at 0.355 of ref or dimmer (0.484^(1/0.7)) is under the tone already and
// keeps its own light untouched, as dark ground shows no shadow. Never more than its own light without the shadow; there is no
// least share. The hue goes toward a blue-grey of the same light (its three weights sum to one, so the greying changes no
// light): 0.45 of the way where the point keeps 0.7 of its light or less (plain snow from 0.59 of ref up), and less, by the
// square of the light taken over 0.3, as the share kept goes from 0.7 to 1, so that untouched snow is untouched in hue too.
// At the shadow's soft edge, or where it is fainter, the share kept lies between that and 1 and the hue follows it by the same
// rule. owlShaded is this for the roof's light that falls on everything under it. owlShadedFace is the same law for the snow's
// own face with its hoar cups, on the disc and on the world's roof alike: there the tone is the tone of the snow without its
// cups, times the cups evened (0.2 of the cup's cut and 0.64: the cut of the scallops runs from 0.21 in a rib to 1.41 in a
// cup's centre, the evened one from 0.68 to 0.92; the world's cut also carries its close facets and wind ribs), times the
// face's grain as it is. On snow as bright as ref a cup's brightest centre then keeps
// 0.32 of its light, a middling cup (cut 0.7) 0.54, and a rib of cut 0.34 or less is under the tone and stays as it is; under
// the bird the face runs from 0.21 to 0.45 of ref there, where outside it runs from 0.21 to 1.41. owlShadedK is the law
// itself, for one who has the shadow's strength (k) and the tone's light
export const OWL_GLSL = /* glsl */`
uniform vec4 uShadow; uniform vec4 uShadowN; uniform vec2 uShadowW;
float owlShade(vec2 p){
  if (uShadow.z <= 0.) return 0.;
  vec2 d = p - uShadow.xy; float S = max(uShadowN.z, 1.), a = dot(d, uShadowN.xy)/(S*max(uShadow.w, 0.2)), bs = (d.x*uShadowN.y - d.y*uShadowN.x)/S, ab = abs(bs);
  if (abs(a) > 0.9 || ab > 1.5) return 0.;
  float b = ab/((1. - 0.2*uShadowW.x)*(1. + 0.14*uShadowW.y*sign(bs))), aw = a + 0.1*uShadowW.x*b*b;
  float arm = min(min(0.13 + 0.2*b - 0.3*b*b - aw, aw + 0.22 - 0.1*b*b - 0.012*cos(b*40.)), 0.8 - b);
  vec2 h = vec2(b - 0.66, aw + 0.03); float r = length(h), th = r > 1e-4 ? atan(h.y, h.x) : 0., ph = (th + 1.2)/0.44, u = abs(fract(ph) - 0.5)*2.;
  float hand = min(min(0.38 - 0.07*(th - 0.1)*(th - 0.1) - 0.05*u*u - r, (1. - 0.36*smoothstep(0.2, 0.31, r) - u)*0.22*r + 0.004), min(ph, 5. - ph)*r);
  float body = max(0.105 - length(vec2((a - 0.02)/2.5, bs)), 0.125 - length(vec2(a - 0.175, bs)));
  float tail = min(min(a + 0.46 - 1.3*ab*ab + 0.01*cos(ab*90.), -0.15 - a), 0.085 + 0.3*(-a - 0.15) - ab);
  float w = 0.5*max(uShadowN.w, 0.05);
  return uShadow.z*smoothstep(-w, w, max(max(arm, hand), max(body, tail))*S);
}
float owlTone(float l, float ref){ return 0.484*ref*pow(max(l, 1e-4)/ref, 0.3); }
vec3 owlShadedK(vec3 c, float k, float tone){
  if (k <= 0.) return c;
  float l = max(dot(c, vec3(0.3, 0.5, 0.2)), 1e-4), s = mix(1., min(tone/l, 1.), min(2.*k, 1.)), g = min((1. - s)/0.3, 1.);
  return mix(c, vec3(l)*vec3(0.861, 1.001, 1.206), 0.45*g*g)*s;
}
vec3 owlShaded(vec3 c, vec2 p, float ref){ return owlShadedK(c, owlShade(p), owlTone(dot(c, vec3(0.3, 0.5, 0.2)), ref)); }
vec3 owlShadedFace(vec3 face, float k, float lSnow, float cell, float ref){
  return owlShadedK(face, k, owlTone(lSnow, ref)*(0.2 + 0.64/max(cell, 0.05))*dot(face, vec3(0.3, 0.5, 0.2))/max(lSnow, 1e-4));
}
`;
// the seven fractures: (side offset they settle at, length, phase, wander), from the disc's seed alone (no random draws)
const crackTable = (seed) => {
  const h = (n) => { const v = Math.sin(n * 127.1 + seed * 3.7 + 1.7) * 43758.5453; return v - Math.floor(v); };
  return Array.from({ length: 7 }, (_, i) => new THREE.Vector4((i - 3) * 2.45 + (h(i + 0.3) - 0.5) * 1.5, 54 + 20 * h(i + 7.1) + (i === 3 ? 6 : 0), h(i + 13.7) * 6.28318, 0.45 + 0.4 * h(i + 21.3)));
};

// The measures of the hole's torn edge (holeRag, below): it stands HOLE_R from the hole's centre, more or less by three noises of
// the direction, each of which runs from 0 to 1: lobes of RAG_LOBE either way (twice RAG_LOBE times the noise less a half),
// notches (RAG_NOTCH times the noise less RAG_NOTCH_0) and teeth (RAG_TOOTH times the noise less a half). HOLE_BITE is the
// furthest the edge can stand inside HOLE_R, with all three noises at 0: 1.9 + 0.9*0.3 + 0.55/2 = 2.445 m
const HOLE_R = 10.4, RAG_LOBE = 1.9, RAG_NOTCH = 0.9, RAG_NOTCH_0 = 0.3, RAG_TOOTH = 0.55;
const HOLE_BITE = RAG_LOBE + RAG_NOTCH * RAG_NOTCH_0 + RAG_TOOTH / 2;
// The hole in the roof disc, shared by the disc and by the broken lip that hangs from its edge (buildLip): how far the torn edge
// stands from the hole's centre in a given direction, and how far the disc has sagged at a point (q = xz from the disc's centre).
const HOLE_GLSL = /* glsl */`
uniform float uBulge, uHole, uSeed;
float holeRag(vec2 dir){ return ${HOLE_R.toFixed(1)} + ${RAG_LOBE.toFixed(1)}*(vn2(dir*2.6+uSeed) - 0.5)*2. + ${RAG_NOTCH.toFixed(1)}*(vn2(dir*9.+1.7) - ${RAG_NOTCH_0.toFixed(1)}) + ${RAG_TOOTH.toFixed(2)}*(vn2(dir*27.+4.1) - 0.5); }
float discDrop(vec2 q){
  float r = length(q);
  float sc = vn2(q*0.21+uSeed)*1.0 + vn2(q*0.62+3.3)*0.4;
  float edge = 1. - smoothstep(20., ${PLUG_R.toFixed(1)}, r);
  return sc*edge + uBulge*6.8*exp(-r*r/300.)*(0.8+0.4*vn2(q*0.3+9.+uSeed)) + uHole*0.9*exp(-abs(r-11.5)/2.2);
}
`;

// ---------------------------------------------------------------------------------------------------------
// THE ROOF DISC: the patch of glowing roof that bulges, pales, cracks and bursts
// ---------------------------------------------------------------------------------------------------------
async function buildRoof(U, seed, pause) {
  const g = new GB(), NR = 36, NA = 96, rings = [], W = [1, 1, 1];
  for (let j = 0; j <= NR; j++) {
    const r = 0.4 + (PLUG_R - 0.4) * (j / NR), ring = [];
    for (let k = 0; k < NA; k++) { const th = k / NA * TAU; ring.push(g.v(Math.cos(th) * r, 0, Math.sin(th) * r, W)); }
    rings.push(ring);
  }
  const c = g.v(0, 0, 0, W);
  for (let k = 0; k < NA; k++) g.tri(c, rings[0][k], rings[0][(k + 1) % NA]);
  for (let j = 0; j < NR; j++) for (let k = 0; k < NA; k++) { const k1 = (k + 1) % NA; g.quad(rings[j][k], rings[j + 1][k], rings[j + 1][k1], rings[j][k1]); }
  await pause();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uBulge: { value: 0 }, uCrack: { value: 0 }, uHole: { value: 0 }, uSeed: { value: seed }, uGlow: { value: 3 }, uGreen: { value: 0 },
      uCrA: { value: crackTable(seed) }, uCrGrow: { value: 0 }, uDim: { value: 0 }, uDomeK: { value: 1 },
      uShadow: { value: new THREE.Vector4(0, 0, 0, 1) }, uShadowN: { value: new THREE.Vector4(1, 0, 13, 2.5) }, uShadowW: { value: new THREE.Vector2(0, 0) } },
    fog: true, transparent: true, depthWrite: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
varying vec3 vP; varying vec3 vL;
${FOG_VP}
${GLSL_N}
${HOLE_GLSL}
void main(){
  vec3 p = position;
  p.y -= discDrop(p.xz);
  vP = position; vL = p + vec3(0., ${(ROOF_Y - 0.2).toFixed(2)}, ${HOLE_Z.toFixed(3)});
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
uniform float uCrack, uGlow, uGreen, uCrGrow, uDim, uDomeK;
varying vec3 vP; varying vec3 vL;
${FOG_FP}
${GLSL_N}
${GLSL_F}
${HOLE_GLSL}
${CRACK_GLSL}
${DOME_GLSL}
${OWL_GLSL}
// distance (m) to the nearest of nc wiggling radial cracks; id comes back in 'cell'
float crackD(float r, float ang, float nc, float sd, out float cell){
  float k = (ang/6.28318 + 0.5)*nc; cell = floor(k);
  float f = fract(k) - 0.5;
  float wig = (vn2(vec2(r*0.2, cell*7.3+sd)) - 0.5)*0.34 + (vn2(vec2(r*1.4, cell*3.1+sd)) - 0.5)*0.11 + (h11(cell+sd) - 0.5)*0.4;
  return abs(f - wig)*r*(6.28318/nc);
}
void main(){
  float r = length(vP.xz);
  vec2 dir = vP.xz/max(r, 1e-3);
  float rr = length((vP.xz - vec2(0., 1.5))*vec2(1., 0.82));
  // the torn edge: big lobes, bites and small teeth
  float rag = holeRag(dir);
  float lipD = rr - rag*uHole;
  if (lipD < 0.) discard;
  float alpha = 1. - smoothstep(24., ${(PLUG_R - 0.5).toFixed(1)}, r);
  if (alpha < 0.02) discard;
  vec3 V = normalize(uCamL - vL);
  // snow thickness sets colour and brightness
  // (the roof over the strike is the thin patch at the far end of the last straight: a place, thin the whole flight, whatever the
  // drift does on this seed; the bulge then whitens it once)
  float patchK = exp(-r*r/2116.);
  float thick = clamp(0.5 + 0.8*(1. - 0.85*patchK)*(fbm2(vP.xz*0.045+uSeed) - 0.5) - 0.3*patchK, 0.12, 1.);
  float thin = min(uBulge*1.25, 1.)*exp(-r*r/250.)*(1. - 0.6*uHole);
  thick = mix(thick, 0.03, thin);
  vec3 col = mix(uTurq, uCobalt, smoothstep(0.2, 0.8, thick))*uGlow*exp(-1.5*thick);
  col = mix(col, vec3(col.g*0.9, col.g*1.25, col.g*0.8), uGreen);
  // the paling dome brightens the snow round it: the disc's own colour is multiplied by 1 + domeGain (at r from the disc's
  // centre), the same gain as the gallery roof beyond the disc takes, times the same factor, the bulge times 1.25 (at most 1)
  // times one less the hole's opening. The disc applies it here, before the bands, the hoar's cut, the dim (uDim) and the flank's
  // shade below; the world applies it to its roof after its dim
  col *= 1. + domeGain(r*r)*min(uBulge*1.25, 1.)*(1. - uHole);
  col *= 0.8 + 0.2*sin(vP.x*0.2 + vP.z*0.08 + fbm2(vP.xz*0.04)*6. - uTime*0.4);
  float lSnow = dot(col, vec3(0.3, 0.5, 0.2));                           // the snow's light here without its hoar cups (for the owl's shade below)
  // hoar scallops at two sizes, the same cut as the gallery roof: thin bright cup centres, thick dark ribs
  vec2 wq = vL.xz + vec2(vL.y*0.35);
  float cup = worley(wq*0.3 + uSeed), cup2 = worley(wq*0.95 + 3.7);
  float cell = (1.28 - 0.95*smoothstep(0.08, 0.62, cup))*(1.1 - 0.46*smoothstep(0.1, 0.6, cup2));
  float nearK = 1. - smoothstep(10., 34., length(uCamL - vL));          // grain of the hoar where it is close enough to resolve
  col *= cell*(0.82 + 0.36*vn2(wq*1.1 + 5.))*(1. + nearK*(0.5*vn3(vL*2.9) + 0.35*vn3(vL*8.3) - 0.42));
  float fine = 1. - smoothstep(5., 16., length(uCamL - vL));           // close to, the hoar is separate crystals: small facets, each of its own brightness
  if (fine > 0.01) { vec3 w3 = wor3(wq*3.1 + 9.1); col *= mix(1., (0.8 + 0.42*w3.z)*(0.7 + 0.3*smoothstep(0., 0.42, w3.y - w3.x)), fine*0.85); }
  float wK = smoothstep(0.26, 0.66, thin);
  // as the owl's weight comes on, the pressed snow round the bulge darkens: by at most 0.07 of itself (uDim's greatest) at the
  // disc's centre, falling to 1/e of that 60 m out. The dome's gain, applied above, falls to 1/e 30 m out: at the centre, with
  // the dome fully paled and this dim at its greatest, the disc's own colour stands (1 + DOME_GAIN)*(1 - 0.07) times itself, so
  // that the roof there grows brighter while it is pressed when that product is over 1. The white dome, the daylight in the
  // gaps and the pale lip, mixed and added below, do not take the dim
  col *= 1. - uDim*exp(-r*r/3600.);                                       // the pressed snow round the bulge darkens
  col = owlShadedFace(col, owlShade(vL.xz), lSnow, cell, dot(mix(uTurq, uCobalt, 0.5), vec3(0.3, 0.5, 0.2))*uGlow*0.47);   // the bird's wings on the snow above, seen through it (0.47: what snow of middling depth lets through, exp(-1.5*0.5))
  col *= 1. - 0.4*uBulge*(1. - uHole)*smoothstep(8., 12.5, r)*(1. - smoothstep(15., 26., r));   // the flank of the sagging dome is in its own shade
  col = mix(col, mix(uDayCol, uTurq*1.5 + uDayCol*0.4, smoothstep(5., 13., r)*0.6)*uDomeK*(2.9 - 1.2*smoothstep(2.5, 12., r)), wK*0.92);   // whitest at the apex, turquoise and dimmer up the flank
  // cracks: gaps with a pale lip growing out from the bulge, dark on the white dome and, off it, daylight where the gap's measure
  // is over 0.5 (the two mixes below); they close to nothing once the roof has gone through
  float ang = r > 1e-3 ? atan(vP.z, vP.x) : 0.;
  float c1, c2; float d1 = crackD(r, ang, 11., uSeed, c1); float d2 = crackD(r, ang + 0.31, 19., uSeed+5., c2);
  float len1 = uCrack*(16. + 19.*h11(c1+uSeed)), len2 = uCrack*(10. + 16.*h11(c2+3.+uSeed))*step(0.3, h11(c2+9.));
  float dr = abs(r - (5. + 9.*h11(c2+1.7)));                 // short ring fractures tying the radials together
  float px1 = min(fwidth(d1), 1.6), px2 = min(fwidth(d2), 1.2), px3 = min(fwidth(dr), 0.4);   // widen toward a pixel far away and dim to match
  float t1 = clamp(1. - r/max(len1, 0.01), 0., 1.), w1 = 0.03 + 0.13*t1*t1, ww1 = max(w1, px1*0.75), ww2 = max(0.035, px2*0.75), ww3 = max(0.03, px3*0.7);
  float l1 = (1. - smoothstep(ww1, ww1+px1+0.01, d1))*min(1., 1.6*w1/ww1)*(1. - smoothstep(len1-2.5, len1, r));
  float l2 = (1. - smoothstep(ww2, ww2+px2+0.01, d2))*min(1., 0.07/ww2)*(1. - smoothstep(len2-2., len2, r))*smoothstep(4., 7., r)*0.8;
  float l3 = (1. - smoothstep(ww3, ww3+px3+0.01, dr))*min(1., 0.05/ww3)*0.7*step(0.5, h11(c2+4.4))*step(r, len1*0.8)*uCrack;
  float halo = exp(-d1/0.6)*(1. - smoothstep(len1-4., len1, r))*0.12;
  float crackK = (0.55 + 0.45*uBulge)*(1. - uHole);
  vec3 gc = galleryCracks(vP.xz, uCrGrow, min(fwidth(vP.x), 1.2));
  float lines = max(max(l1, gc.x), max(l2, l3));
  float seam = max(gc.y, (1. - smoothstep(w1*2. + 0.05, w1*5. + 0.35 + px1, d1))*(1. - smoothstep(len1-2.5, len1, r))*(0.4 + 0.6*t1));
  col *= 1. - 0.5*seam*(1. - wK)*crackK;                                                      // each gap lies in a dark seam of sheared snow
  col = mix(col, mix(col*0.12 + vec3(0.008, 0.02, 0.05), vec3(0.07, 0.17, 0.36), wK), min(lines*1.6 + seam*0.5*wK, 1.)*0.9*(1. - uHole));   // every crack is first drawn a dark, branching gap, on the white dome and out along the roof
  // off the white dome (1 - wK), until the roof goes through (1 - uHole), a gap is open to the day, as on the gallery roof beyond
  // the disc: where the gap's measure (lines: the greatest of the first radials l1, the second radials l2, 0.8 at most, the ring
  // fractures l3, 0.7 uCrack at most, and the gallery's fractures gc.x) is over 0.5 the colour is mixed toward LEAK_GAP times
  // the leak's colour, by a smoothstep of lines from 0.5 to 1; so a second radial takes at most 0.648 of it. The ring fractures
  // keep the dark: the part holds uCrack at 0.72 or less until the roof bursts, so l3 is 0.504 at most and takes 2 parts in
  // 10,000 of it at most; after the burst uCrack rises while 1 - uHole falls to nothing in 0.26 s, and a ring fracture's share
  // is then about 1 part in 100 at most. Where lines is under 0.5 (at a gap's soft edge, and where a gap is so thin in its
  // pixel that its measure is dimmed under 0.5), and on the white dome, the gap keeps the dark of the line above. Nothing is
  // added to the sheared snow either side
  col = mix(col, leakCol(uDayCol, uTurq)*LEAK_GAP, smoothstep(0.5, 1., lines)*(1. - wK)*(1. - uHole));
  col += mix(uDayCol, uTurq*1.3 + uDayCol*0.35, 0.4)*(0.6*gc.z*(1. - wK) + halo*uCrack)*crackK;   // its broken edge is a pale lip
  // the torn lip once it is open: a bright broken face at the edge, a ring of compressed dark snow behind it
  float face = (1. - smoothstep(0.15, 1.5, lipD))*uHole;
  float ring = smoothstep(0.8, 2.2, lipD)*(1. - smoothstep(2.6, 6.5, lipD))*uHole;
  col *= 1. - 0.5*ring;
  col = mix(col, (uDayCol*uDay*1.5 + uTurq*0.5)*(0.6 + 0.6*vn2(vP.xz*1.7 + 2.)), face*0.85);
  col += uDayCol*glitter(vec3(vL.x, 0.125, vL.z), V, 4.)*1.8*(0.4+thin);
  col = max(col, vec3(0.));
  gl_FragColor = vec4(col, alpha);
  ${FOG_F}
}`,
  });
  await pause();
  const mesh = new THREE.Mesh(g.build(), mat);
  mesh.position.set(0, ROOF_Y - 0.2, HOLE_Z); mesh.renderOrder = -5; mesh.frustumCulled = false; mesh.name = 'strike-roof';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// THE SHAFT: ragged tube of banded snow from the roof to the surface, with the crater lip and ejecta apron.
// Faces point inward only, so from outside (the viewer) the near wall folds away like a cutaway.
// ---------------------------------------------------------------------------------------------------------
async function buildShaft(U, noise, rng, pause) {
  const g = new GB(), NS = 56, NL = 12, NA = 96, rings = [], W = [1, 1, 1], sd = rng.range(0, 50);
  const lens1 = rng.range(18.5, 23), lens2 = rng.range(30, 37);
  const topR = [], layerOff = Array.from({ length: 40 }, () => rng.range(-0.5, 0.5));   // each stratum stands in or out a little
  for (let j = 0; j <= NS + NL; j++) {
    const ring = [];
    for (let k = 0; k < NA; k++) {
      const th = k / NA * TAU, cx = Math.cos(th), sz = Math.sin(th);
      let y, R, e = -1;
      if (j <= NS) {
        y = lerp(ROOF_Y - 0.9, SURF_Y, j / NS);
        const fl = sstep(44, 58, y);
        R = SHAFT_R + 0.9 + 2.9 * sstep(ROOF_Y - 0.9, ROOF_Y + 3.5, y) * (1 - sstep(ROOF_Y + 3.5, ROOF_Y + 12, y)) + 4.6 * fl * fl + layerOff[Math.floor(y / 2.3)] * (1 - fl)
          + noise.fbm3(cx * 1.6 + sd, sz * 1.6, y * 0.085, 3) * 1.7 + noise.n3(cx * 5 + sd, sz * 5, y * 0.42) * 0.38
          - 0.75 * Math.exp(-(((y - lens1) / 0.5) ** 2)) - 0.5 * Math.exp(-(((y - lens2) / 0.4) ** 2))     // ice lenses stand proud
          + 0.5 * sstep(lens1 - 6, lens1 - 1, y) * (1 - sstep(lens1 - 1, lens1 - 0.4, y));                  // hoar undercut below them
        if (j === NS) topR[k] = R;
      } else {
        const q = (j - NS) / NL; e = q * 2.5 + q * q * 19;
        const lump = 0.65 + 0.5 * noise.fbm2(cx * 3 + sd, sz * 3 + q * 2, 3) + 0.25 * noise.n2(th * 9, q * 5 + sd);
        y = SURF_Y + 3.3 * Math.exp(-(((e - 3.2) / 3.0) ** 2)) * lump * (1 - 0.35 * cx) + 0.5 * (1 - q) * noise.n2(cx * 7 + q * 6, sz * 7 + sd) * (1 - q) + 0.06;
        R = topR[k] + e;
      }
      const zc = -Math.min(y, SURF_Y) * COS_P / SIN_P;
      ring.push(g.v(cx * R, y, zc + sz * R / SIN_P, W, [e, 0, 0, 0]));
    }
    rings.push(ring);
    if ((j & 7) === 7) await pause();
  }
  await pause();
  g.loft(rings, true);
  await pause();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uSeed: { value: sd }, uLay: { value: new THREE.Vector4(rng.range(15, 18), lens1, lens2, rng.range(43, 47)) }, uSlash: { value: 16 } },
    fog: true,
    vertexShader: /* glsl */`
attribute vec4 a;
varying vec3 vL; varying vec3 vN; varying float vE;
${FOG_VP}
void main(){
  vL = position; vN = normal; vE = a.x;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
uniform float uSeed, uSlash; uniform vec4 uLay;
varying vec3 vL; varying vec3 vN; varying float vE;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 V = normalize(uCamL - vL);
  vec3 N = normalize(vN);
  vec3 F = facetN(vL, N, V);
  vec3 Nn = normalize(mix(N, F, 0.6));
  float y = vL.y, apron = step(0., vE);
  vec2 q = (vL.xz - vec2(0., -min(y, ${SURF_Y.toFixed(1)})*${(COS_P / SIN_P).toFixed(5)}))*vec2(1., ${SIN_P.toFixed(5)});
  vec2 cyl = q/max(length(q), 1e-3);
  // strata, warped and dipping a little
  float h = y + (fbm2(cyl*2.1 + y*0.03 + uSeed) - 0.5)*5. + cyl.x*1.6 - cyl.y*0.9;
  float hoar = 1. - smoothstep(uLay.x-1.5, uLay.x+1.5, h);
  float e1 = (h - uLay.y)/0.5, e2 = (h - uLay.z)/0.32;
  float lens = clamp(exp(-e1*e1) + 0.7*exp(-e2*e2), 0., 1.);
  float powder = max(smoothstep(uLay.w-2., uLay.w+2., h), apron);
  float slab = (1. - hoar)*(1. - powder);
  float grain = vn3(vL*1.5);
  float stri = 0.5 + 0.5*sin(h*5.2 + fbm2(cyl*3. + vec2(h*0.35, 0.))*5.);
  float band = fbm2(vec2(h*0.5, 3.7 + uSeed));
  vec3 alb = vec3(0.60, 0.70, 0.79);
  alb = mix(alb, vec3(0.46, 0.60, 0.74)*(0.7 + 0.5*grain), hoar);
  alb *= mix(1., 0.84 + 0.16*stri, slab)*(0.74 + 0.42*band);
  float li = h/2.3 + (vn2(cyl*1.5 + 7.) - 0.5)*0.7, lid = floor(li), lf = fract(li);
  float tone = 0.52 + 0.56*h11(lid + uSeed), seam = 1. - 0.5*(1. - smoothstep(0., 0.1, lf))*(0.4 + 0.6*h11(lid*3.1 + 1.));
  alb *= tone*seam;
  alb = mix(alb, vec3(0.76, 0.80, 0.84)*(0.9 + 0.14*grain)*mix(1., tone*seam, 0.45), powder);
  alb = mix(alb, vec3(0.42, 0.85, 0.9), lens*0.85);
  // light: sky down the hole, the sun slash on the wall that faces it, glow inside the pack
  float depth = clamp((${SURF_Y.toFixed(1)} - y)/50., 0., 1.);
  float skyVis = mix(mix(1., 0.15, pow(depth, 0.65)), 1., apron);
  vec2 sxz = uSunL.xz/max(length(uSunL.xz), 1e-3);
  float facing = max(dot(-cyl, sxz), 0.);
  float litDepth = uSlash*pow(facing, 0.8)*(0.75 + 0.5*vn2(cyl*4. + 2.));
  float sunWall = smoothstep(-1.4, 1.4, y - (${SURF_Y.toFixed(1)} - litDepth))*step(0.02, facing);
  float sunAp = max(dot(Nn, uSunL), 0.)*1.3 + 0.12;
  float sun = mix(sunWall*max(dot(F, uSunL)*0.7 + 0.3, 0.)*0.36, sunAp*0.6, apron);
  vec3 L = snowLight(vL, Nn, skyVis) + uSunCol*sun;
  vec3 col = alb*L;
  col += alb*mix(uCobalt, uTurq, 1. - depth)*(0.13 + 0.22*(1. - depth))*(1. - apron);       // light inside the snow
  float sp = max(dot(reflect(-V, Nn), AX), 0.); sp *= sp; sp *= sp;
  col += uSkyCol*lens*sp*sp*1.4*skyVis;
  col += (uSunCol*sun + uSkyCol*skyVis + uDayCol*uDay*0.4)*glitter(vL, V, 3.6)*(1.2 + 2.*hoar);
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`,
  });
  const mesh = new THREE.Mesh(g.build(), mat); mesh.frustumCulled = false; mesh.name = 'strike-shaft';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// THE DAYLIGHT: a soft cone drawn on its back faces only (so the legs stand dark against it) and its pool
// ---------------------------------------------------------------------------------------------------------
function buildDaylight(U) {
  const g = new GB(), NA = 28, NJ = 14, rings = [], W = [1, 1, 1];
  const e1 = new V3(1, 0, 0), e2 = new V3().crossVectors(AX, e1);
  for (let j = 0; j <= NJ; j++) {
    const s = -3 + 74 * (j / NJ), R = lerp(10.2, 10.6, j / NJ), ring = [];
    for (let k = 0; k < NA; k++) {
      const th = k / NA * TAU, cx = Math.cos(th), sy = Math.sin(th);
      ring.push(g.v(AX.x * s + (e1.x * cx + e2.x * sy) * R, AX.y * s + (e1.y * cx + e2.y * sy) * R, AX.z * s + (e1.z * cx + e2.z * sy) * R, W, [s, th, 0, 0]));
    }
    rings.push(ring);
  }
  g.loft(rings, true);
  const cone = new THREE.Mesh(g.build(), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uConeK: { value: 1 } }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: /* glsl */`
attribute vec4 a;
varying vec3 vL; varying vec3 vN; varying vec2 vA;
${FOG_VP}
void main(){ vL = position; vN = normal; vA = a.xy;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
uniform float uConeK;
varying vec3 vL; varying vec3 vN; varying vec2 vA;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 V = normalize(uCamL - vL);
  float nv = abs(dot(normalize(vN), V));
  // brightest through the middle with a soft edge; brightest of all under the hole and thinning toward the floor; in rays, with
  // dark lanes between them, that slant down the shaft's own lean: a column of light with air in it, never a flat white card
  float body = nv*nv*(0.4 + 0.6*nv);
  float inGal = 1. - smoothstep(${(ROOF_Y - 1).toFixed(1)}, ${(ROOF_Y + 9).toFixed(1)}, vL.y);
  float prof = mix(0.06, 1., inGal)*smoothstep(-1., 2.5, vL.y)*(1. - smoothstep(60., 70., vA.x))*mix(0.5, 1.2, smoothstep(0.5, ${ROOF_Y.toFixed(1)}, vL.y));
  vec2 sc = vec2(cos(vA.y), sin(vA.y));
  float rays = fbm2(vec2(sc.x*7.5 + sc.y*3.3, vA.x*0.05 + uTime*0.12) + sc.y*3.1);
  float streak = 0.55 + 1.1*smoothstep(0.3, 0.7, rays)*(0.75 + 0.5*fbm2(vec2(sc.x*3. + sc.y*1.7, vA.x*0.16 + uTime*0.9) + sc.y*2.3));
  gl_FragColor = vec4(uDayCol*uDay*2.1*uConeK*body*prof*streak, 1.);
  ${FOG_ADD}
}`,
  }));
  cone.renderOrder = 3; cone.frustumCulled = false; cone.name = 'strike-daylight';
  // pool on the floor
  const pg = new THREE.CircleGeometry(19, 40); pg.rotateX(-Math.PI / 2);
  const pool = new THREE.Mesh(pg, new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
varying vec3 vL;
${FOG_VP}
void main(){ vL = position; vec4 mvPosition = modelViewMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
varying vec3 vL;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec2 p = vL.xz*vec2(1., 0.9); float r = length(p);
  float rag = 0.8 + 0.4*vn2(vL.xz*0.35 + 4.);
  float I = exp(-r*r/(74.*rag)) + 0.2*exp(-r*r/260.);
  I *= (0.75 + 0.5*vn2(vL.xz*1.3 + vec2(0., uTime*0.6)))*(1. - smoothstep(11., 18.5, r));
  gl_FragColor = vec4(uDayCol*uDay*1.35*I, 1.);
  ${FOG_ADD}
}`,
  }));
  pool.position.set(0, 0.08, 0.6); pool.renderOrder = 1; pool.frustumCulled = false; pool.name = 'strike-pool';
  return { cone, pool };
}

// ---------------------------------------------------------------------------------------------------------
// THE STRIKER: two feathered legs, four-toed feet with black talons that clench in the vertex shader, and the
// dark belly that hangs in the hole. One mesh. Attribute a = leg: (t along leg, 0,0,0); toe: (azimuth, w1, w2, w3).
// Attribute b = (v along a feather card, hash, part, side) with part 0 leg, 1 toe, 2 talon, 3 belly.
// ---------------------------------------------------------------------------------------------------------
const TOE_L = [1.7, 1.45, 1.25];
// the belly: the lower end of the owl's body, an ellipsoid on the shaft axis (semi-axis BELLY_A along it, radius BELLY_R) whose pole
// hangs BELLY_Y above the floor. It comes down through the hole with the legs, which leave it low on either side, and it is clothed
// in broad barred breast feathers that take the daylight falling past it where it stands in the hole
// BELLY_R, the radius of the ellipsoid's equator, is HOLE_R less HOLE_BITE (7.955 m). The skin is drawn at 0.97 of the ellipsoid's
// radius. The breast feathers are rooted 0.05 m outside the ellipsoid (two rows more stand above its equator, 1.5 and 3 m up the
// axis, 0.05 m outside the equator's radius). A feather is a straight card 3.3 to 4.4 m long that runs from its root toward the
// pole (down the ellipsoid's slope at the root; in the two rows above the equator straight down the axis), and the middle of its
// tip is raised 0.03 m plus its lift of 0.3 to 0.6 m along the root's normal; where the ellipsoid curves away under the card the
// tip stands further off the ellipsoid than that. The shader moves each tip in and out by up to 0.05 + 0.5 uShake m, and the whole belly by
// 0.14 m about its centre. The legs' drop (uDrop) takes the belly down the axis: by 0.9 m as the owl stands, by 2.2 m at its greatest.
// The equator's centre stands 17.0 m above the floor as built and 15.0 m at the greatest drop, above the roof's underside
// (ROOF_Y), and in the plane of that underside the ellipsoid's section is narrower than its equator: it reaches 6.04 m to either
// side across the gallery as built and 7.16 m at the greatest drop. The hole's edge is measured from a centre 1.5 m toward us of
// where the axis crosses that plane, with z taken at 0.82 of itself: at its nearest it stands HOLE_R less HOLE_BITE off across the
// gallery (7.955 m), and that over 0.82 off toward us and away from us (9.70 m; 12.9 m with each of holeRag's noises at its middle).
// So across the gallery the ellipsoid stands inside the hole, and toward us too, where its section reaches 2.64 m from that centre
// as built and 4.48 m at the greatest drop: the daylight falls past it there. On the side away from us its section reaches 9.79 m
// from that centre as built and 10.25 m at the greatest drop: there it comes to the edge, and where the edge stands at its nearest
// it meets the snow.
// These figures are the ellipsoid's. The feathers reach beyond it (their cards run straight where the ellipsoid curves away), so
// across the gallery too a feather's tip can touch the snow where the edge stands at its nearest
const BELLY_A = 9.5, BELLY_R = HOLE_R - HOLE_BITE, BELLY_Y = 8.4, BELLY_SC = BELLY_Y / SIN_P + BELLY_A;
async function buildStriker(U, rng, pause) {
  const g = new GB(), hubs = [];
  const X = new V3(1, 0, 0), T = new V3(), C = new V3(), N1 = new V3(), N2 = new V3(), D = new V3(), S = new V3(), P = new V3();
  const grey = (v, warm = 0) => [v * (1 + warm * 0.12), v, v * (1 - warm * 0.1)];
  // one feather lying on a surface: root B, surface normal out, pointing direction down, side S. A 3 by 3 grid, cupped across and
  // lifted toward its tip; its round outline, bars, shaft and lit fringe are drawn in the fragment shader from a = (t along the leg,
  // across -1..1, 1, 0) and b = (along 0..1, hash, part, side)
  const feather = (B, out, down, side, len, wid, lift, tone, part, si, tt) => {
    const h = rng(), col = grey(tone, 0.1), id = [];
    for (let j = 0; j < 3; j++) {
      const f = j * 0.5, l = 0.03 + lift * f * f;
      for (let k = -1; k <= 1; k++) {
        const w = wid * 0.5 * k, o = l - 0.14 * wid * k * k * (0.4 + 0.6 * f);
        id.push(g.v(B.x + down.x * len * f + side.x * w + out.x * o, B.y + down.y * len * f + side.y * w + out.y * o, B.z + down.z * len * f + side.z * w + out.z * o, col, [tt, k, 1, 0], [f, h, part, si]));
      }
    }
    for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) g.quad(id[j * 3 + k], id[j * 3 + k + 1], id[(j + 1) * 3 + k + 1], id[(j + 1) * 3 + k]);
  };
  for (const sgn of [-1, 1]) {
    const si = sgn < 0 ? 0 : 1;
    const hub = new V3(sgn * (5.3 + rng.range(-0.4, 0.5)), 0, sgn > 0 ? rng.range(-2.2, -1.0) : rng.range(0.4, 1.5));
    hubs.push(hub);
    // ---- leg: a bezier from the ankle up into the belly
    const p0 = new V3(hub.x, 1.15, hub.z - 0.3), p1 = new V3(hub.x + sgn * 0.6, 10.5, hub.z - 1.0), p2 = new V3(sgn * 3.4, 20.6, -9.4);
    const at = (t) => { C.set(0, 0, 0).addScaledVector(p0, (1 - t) * (1 - t)).addScaledVector(p1, 2 * t * (1 - t)).addScaledVector(p2, t * t);
      T.set(0, 0, 0).addScaledVector(p0, -2 * (1 - t)).addScaledVector(p1, 2 - 4 * t).addScaledVector(p2, 2 * t).normalize();
      N1.copy(X).addScaledVector(T, -T.dot(X)).normalize(); N2.crossVectors(T, N1); };
    const rad = (t) => 1.05 + 0.85 * sstep(0.02, 0.3, t) + 0.9 * sstep(0.45, 1, t);
    const rings = [], NT = 14, NAL = 12;
    for (let j = 0; j <= NT; j++) {
      const t = j / NT, ring = []; at(t); const r = rad(t) * 0.88;
      for (let k = 0; k < NAL; k++) { const an = k / NAL * TAU; P.copy(C).addScaledVector(N1, Math.cos(an) * r).addScaledVector(N2, Math.sin(an) * r); ring.push(g.vv(P, grey(0.13, 0.2), [t, 0, 0, 0], [0, 0.5, 0, si])); }
      rings.push(ring);
    }
    g.loft(rings, true);
    // the leg's feathers: 24 rows of ten, each broad enough to be read one by one from the far end of the gallery
    for (let i = 0; i < 24; i++) {
      const t = 0.012 + (i / 24) * 0.97; at(t); const r = rad(t), nk = 10;
      for (let k = 0; k < nk; k++) {
        const an = (k + (i % 2) * 0.5 + rng.range(-0.18, 0.18)) / nk * TAU;
        D.set(0, 0, 0).addScaledVector(N1, Math.cos(an)).addScaledVector(N2, Math.sin(an));
        P.copy(C).addScaledVector(D, r * 0.9); S.crossVectors(T, D);
        const down = T.clone().multiplyScalar(-1);
        feather(P, D, down, S, rng.range(2.5, 3.5) * (0.72 + 0.55 * t), rng.range(1.45, 1.85) * (0.62 + 0.3 * r), rng.range(0.35, 0.8) * (0.6 + 0.5 * t), rng.range(0.34, 0.46), 0, si, t);
      }
      if ((i & 3) === 3) await pause();
    }
    await pause();
    // ---- palm
    const palm = [];
    for (let j = 0; j <= 6; j++) {
      const la = -Math.PI / 2 + (j / 6) * Math.PI, ring = [];
      for (let k = 0; k < 10; k++) { const an = k / 10 * TAU; ring.push(g.v(hub.x + Math.cos(an) * Math.cos(la) * 1.45, 0.85 + Math.sin(la) * 0.95, hub.z + Math.sin(an) * Math.cos(la) * 1.45, la < 0 ? [0.2, 0.17, 0.11] : grey(0.33, 0.2), [0, 0, 0, 0], [0, 0.5, 0, si])); }
      palm.push(ring);
    }
    g.loft(palm, true);
    // ---- toes (toe-local rest pose: x out along the toe, y up, z across) and talons
    const AZ = [-20, 46, 134, -150];
    for (let ti = 0; ti < 4; ti++) {
      const az = sgn * AZ[ti] * DEG + rng.range(-0.12, 0.12), ts = (ti === 3 ? 0.86 : 1) * rng.range(0.94, 1.07), th = rng();
      const xs = [0, 0.45, 0.9, 1.35, 1.7, 2.1, 2.5, 2.85, 3.15, 3.5, 3.85, 4.15, 4.4], toe = [], piv1 = TOE_L[0], piv2 = TOE_L[0] + TOE_L[1], end = piv2 + TOE_L[2];
      const wOf = (x) => [az, sstep(-0.25, 0.5, x), sstep(piv1 - 0.4, piv1 + 0.4, x), sstep(piv2 - 0.35, piv2 + 0.35, x)];
      for (const x0 of xs) {
        const r = (lerp(0.68, 0.45, x0 / end) + 0.1 * Math.exp(-(((x0 - piv1) / 0.28) ** 2)) + 0.09 * Math.exp(-(((x0 - piv2) / 0.26) ** 2)) + 0.07 * Math.exp(-(((x0 - end) / 0.25) ** 2))) * ts, ring = [];
        for (let k = 0; k < 8; k++) {
          const an = k / 8 * TAU, up = Math.cos(an);
          const col = up > -0.2 ? grey(0.36 + 0.08 * Math.sin(x0 * 5 + th * 6), 0.2) : [0.21, 0.17, 0.10];
          ring.push(g.v(x0 * ts, up * r * 0.88, Math.sin(an) * r, col, wOf(x0), [0, th, 1, si]));
        }
        toe.push(ring);
      }
      // little feather tufts on the top of each toe
      for (let f = 0; f < 5; f++) {
        const x0 = 0.2 + f * 0.75, B = new V3(x0 * ts, 0.5 * ts, rng.range(-0.15, 0.15));
        const h = rng(), tone = rng.range(0.34, 0.46), w = wOf(x0 + 0.5);
        const q = (dx, dy, dz, f2) => g.v(B.x + dx, B.y + dy, B.z + dz, grey(tone * (0.7 + 0.5 * f2), 0.2), w, [0, h, 1, si]);
        const v0 = q(0, 0, -0.45, 0), v1 = q(0, 0, 0.45, 0), v2 = q(0.6, 0.25, -0.5, 0.5), v3 = q(0.6, 0.25, 0.5, 0.5), v4 = q(1.25, 0.3, 0, 1);
        g.tri(v0, v3, v1); g.tri(v0, v2, v3); g.tri(v2, v4, v3);
      }
      // talon: a tapering hook, 3.1 m along its curve
      const RT = 1.8 * ts, NTn = 8;
      for (let j = 0; j <= NTn; j++) {
        const al = (j / NTn) * 1.75, r = 0.5 * Math.pow(1 - j / NTn, 0.8) * ts + 0.02, ring = [];
        const cx = end * ts + RT * Math.sin(al) - 0.05, cy = -RT * (1 - Math.cos(al)) + 0.05;
        const col = j === 0 ? [0.09, 0.085, 0.08] : [0.012, 0.012, 0.016];
        for (let k = 0; k < 8; k++) { const an = k / 8 * TAU; ring.push(g.v(cx + Math.sin(al) * Math.cos(an) * r, cy + Math.cos(al) * Math.cos(an) * r, Math.sin(an) * r * 0.78, col, [az, 1, 1, 1], [0, th, 2, si])); }
        toe.push(ring);
      }
      g.loft(toe, true);
    }
    await pause();
  }
  // ---- belly: a smooth dark skin on the shaft axis, its lower pole hanging through the hole, under rows of breast feathers
  const e1 = new V3(1, 0, 0), e2 = new V3().crossVectors(AX, e1);
  const NBA = 36, NBE = 11, br = [];
  // the skin's rings, as [the distance along the axis, the radius]: the ellipsoid from its pole (ring 0) to its equator (ring NBE);
  // above the equator five rings more, 26 m on up the axis, the radius BELLY_R less nine tenths of itself times the cube of the
  // way up (q), so that the body is nowhere wider than at its equator
  const bellyAt = (j) => {
    if (j <= NBE) { const ph = (j / NBE) * Math.PI / 2; return [BELLY_SC - BELLY_A * Math.cos(ph), Math.max(BELLY_R * Math.sin(ph), 0.02)]; }
    const q = (j - NBE) / 5; return [BELLY_SC + 26 * q, BELLY_R * (1 - 0.9 * q * q * q)];
  };
  for (let j = 0; j <= NBE + 5; j++) {
    const [sj, rj] = bellyAt(j), ring = [];
    for (let k = 0; k < NBA; k++) { const an = k / NBA * TAU; P.copy(AX).multiplyScalar(sj).addScaledVector(e1, Math.cos(an) * rj * 0.97).addScaledVector(e2, Math.sin(an) * rj * 0.97); ring.push(g.vv(P, [1, 1, 1], [1, 0, 0, 0], [0, 0.5, 3, 0])); }
    br.push(ring);
  }
  g.loft(br, true);
  await pause();
  const down = new V3(), ROWS = 13;
  for (let i = 1; i < ROWS + 3; i++) {
    const ph = Math.min(i / ROWS, 1) * Math.PI / 2, sj = i <= ROWS ? BELLY_SC - BELLY_A * Math.cos(ph) : BELLY_SC + (i - ROWS) * 1.5, rj = BELLY_R * Math.sin(ph), nk = Math.max(5, Math.round(rj * TAU / 2.05));
    for (let k = 0; k < nk; k++) {
      const an = (k + (i % 2) * 0.5 + rng.range(-0.2, 0.2)) / nk * TAU;
      D.set(0, 0, 0).addScaledVector(e1, Math.cos(an)).addScaledVector(e2, Math.sin(an));
      P.copy(AX).multiplyScalar(sj).addScaledVector(D, rj);
      // surface normal and the down-slope direction (toward the pole) on the ellipsoid
      N1.copy(D).multiplyScalar(Math.sin(ph) / BELLY_R).addScaledVector(AX, -Math.cos(ph) / BELLY_A).normalize();
      down.copy(D).multiplyScalar(-Math.cos(ph) * BELLY_R).addScaledVector(AX, -Math.sin(ph) * BELLY_A).normalize();
      S.crossVectors(down, N1);
      feather(P.addScaledVector(N1, 0.05), N1, down, S, rng.range(3.3, 4.4), rng.range(2.3, 3.0), rng.range(0.3, 0.6), rng.range(0.3, 0.4), 3, 0, 1);
    }
    if ((i & 3) === 3) await pause();
  }
  await pause();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uHub: { value: hubs }, uFoot: { value: [new THREE.Vector2(), new THREE.Vector2()] }, uLegS: { value: 0 }, uDrop: { value: 0 }, uShake: { value: 0 } },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 a; attribute vec4 b; attribute vec3 color;
uniform vec3 uHub[2]; uniform vec2 uFoot[2]; uniform float uLegS, uDrop, uShake, uTime;
varying vec3 vL; varying vec3 vN; varying vec3 vC; varying vec4 vB; varying vec3 vR; varying vec2 vA;
${FOG_VP}
${GLSL_N}
void bend(inout vec3 p, inout vec3 n, float px, float an){
  float c = cos(an), s = sin(an); vec2 d = p.xy - vec2(px, 0.);
  p.xy = vec2(px, 0.) + vec2(d.x*c + d.y*s, -d.x*s + d.y*c);
  n.xy = vec2(n.x*c + n.y*s, -n.x*s + n.y*c);
}
void main(){
  vec3 p = position, n = normal; float part = b.z, side = b.w;
  vec2 foot = mix(uFoot[0], uFoot[1], side); vec3 hub = mix(uHub[0], uHub[1], side);
  float cl = foot.x, lift = 3.1*max(cl, 0.) + foot.y;
  vA = vec2(a.y, a.z);
  if (part > 0.5 && part < 2.5) {
    float tv = h11(b.y*9. + a.x);
    vec3 ang = mix(vec3(-0.06, 0.06, 0.12), vec3(0.50, 0.74, 0.66)*(0.9+0.2*tv), max(cl, 0.)) + min(cl, 0.)*vec3(0.55, 0.3, 0.15);
    bend(p, n, ${(TOE_L[0] + TOE_L[1]).toFixed(2)}, ang.z*a.w);
    bend(p, n, ${TOE_L[0].toFixed(2)}, ang.y*a.z);
    bend(p, n, 0., ang.x*a.y);
    float sa = sin(a.x), ca = cos(a.x);
    p = vec3(p.x*sa - p.z*ca, p.y, p.x*ca + p.z*sa);
    n = vec3(n.x*sa - n.z*ca, n.y, n.x*ca + n.z*sa);
    p += hub + vec3(0., 0.62 + lift, 0.);
    vA = vec2(0.);
  } else if (part < 0.5) {
    float t = a.x, k = (1. - t)*(1. - t);
    p.y += lift*k; p -= AX*uDrop*t;
    p.x += (side*2. - 1.)*sin(3.1416*t)*(0.22*lift + 0.5*uDrop);
    p.z += sin(3.1416*t)*(0.3*lift + 0.4*uDrop);
  } else {
    p -= AX*uDrop;
    p += normalize(p - AX*${BELLY_SC.toFixed(2)})*0.14*sin(uTime*2.3 + p.y*0.2);
  }
  // feather tips lift and shiver
  float fl = b.x*b.x*(0.05 + 0.5*uShake);
  p += n*fl*sin(uTime*(7. + 5.*b.y) + b.y*40.);
  p += AX*uLegS;
  vL = p; vN = n; vC = color; vB = b; vR = position;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
varying vec3 vL; varying vec3 vN; varying vec3 vC; varying vec4 vB; varying vec3 vR; varying vec2 vA;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 V = normalize(uCamL - vL);
  vec3 N = normalize(vN);
  float part = vB.z, talon = step(1.5, part)*step(part, 2.5), belly = step(2.5, part), legP = step(part, 0.5);
  float isF = step(0.5, vA.y)*max(legP, belly);
  // a feather: broad, round-tipped, barred grey and white across, a dark shaft down the middle, a pale loose fringe
  float v = vB.x, across = vA.x, ax = abs(across), h = vB.y;
  float nb = 2.5 + 1.5*fract(h*7.3);
  float w = sqrt(clamp(v/0.1, 0., 1.))*sqrt(max(1. - pow(max(v - 0.4, 0.)/0.6, 2.), 0.));
  float e = clamp(ax/max(w, 0.05), 0., 1.);
  float cb = v*nb + 0.3*e*e + h*5.;
  float fcb = fwidth(cb);
  float ragE = 0.14*vn2(vec2(v*13. + h*40., across*2. + h*9.))*smoothstep(0.3, 1., v);
  if (isF > 0.5 && ax > w*(1. - ragE)) discard;
  vec3 alb = vC;
  float edgeK = 0., occ = 1.;
  if (isF > 0.5) {
    float bar = smoothstep(0.34, 0.66, 0.5 + 0.5*sin(cb*6.2832));
    bar = mix(bar, 0.5, smoothstep(0.3, 0.7, fcb));
    // the legs are mid-grey with dark bars; the breast feathers that hang in the hole are darker than either
    vec3 dk = mix(vec3(0.085, 0.09, 0.10), vec3(0.045, 0.048, 0.056), belly), wh = mix(vec3(0.62, 0.62, 0.61), vec3(0.19, 0.195, 0.205), belly);
    alb = mix(dk, wh, bar)*(0.86 + 0.28*h);
    alb *= 1. - 0.5*(1. - smoothstep(0.03, 0.1, ax))*step(v, 0.88);
    alb = mix(alb, wh*1.1, 0.6*smoothstep(0.86, 1., v));
    occ = mix(0.3, 1., smoothstep(0., 0.42, v));
    edgeK = smoothstep(0.55, 1., e)*smoothstep(0.1, 0.3, v) + 0.7*smoothstep(0.8, 1., v);
  } else if (belly > 0.5) {
    alb = vec3(0.07, 0.072, 0.08);
  }
  if (dot(N, V) < 0.) N = -N;
  // from far off the single feathers merge: broad light and dark bands round the leg carry the pattern, and the foot is darker than the feathered leg
  float farK = smoothstep(34., 56., length(uCamL - vL)), legK = (1. - belly)*(1. - talon), legF = farK*legP*smoothstep(1.8, 2.6, vR.y);
  // broad dark bars round the leg, some 5 m apart, at every distance
  float band = smoothstep(0.34, 0.66, 0.5 + 0.5*sin(vR.y*1.25 + vR.x*0.5 + 1.1*sin(vR.z*0.9 + vR.y*0.3)));
  alb *= mix(1., 0.3, (1. - band)*legP*smoothstep(1.8, 2.6, vR.y));
  alb = mix(alb, mix(vec3(0.08), vec3(0.54), band), legF*0.8);
  alb = mix(alb, mix(vec3(0.05), vec3(0.19), step(0.5, fract(h*3.7)))*(0.75 + 0.5*smoothstep(0.6, 0.95, v)), farK*belly*isF*0.6);
  alb *= mix(1., 0.5, legK*(1. - smoothstep(1.7, 2.5, vR.y))*(0.5 + 0.5*farK));
  float ad = axisDist(vL)/12.5; float cone = exp(-ad*ad);
  float wide = exp(-dot(vL.xz, vL.xz)/1100.);
  float dl = max(dot(N, AX)*0.62 + 0.38, 0.);
  // daylight down the shaft (most on what stands in the hole itself), daylight thrown back by the lit snow and floor, roof glow
  float topK = smoothstep(${(ROOF_Y - 3.4).toFixed(1)}, ${(ROOF_Y + 1.2).toFixed(1)}, vL.y)*belly;
  vec3 key = uDayCol*uDay*(0.9*dl*dl*cone*(1. - 0.7*belly) + 0.3*topK*(0.4 + 0.6*dl));
  vec3 fill = uDayCol*uDay*(0.5 + 0.3*max(-N.y, 0.))*wide*(1. - 0.92*talon)*(1. - 0.6*belly);
  vec3 L = key*(1. - 0.7*talon) + fill + mix(uShadowCol*0.6, uAmb*1.1, N.y*0.5 + 0.5);
  vec3 col = alb*occ*L;
  col += (uDayCol*uDay*(0.5*cone + 0.28*wide + 0.3*topK) + uAmb*0.7)*edgeK*0.22*mix(alb, vec3(1.), 0.25);
  float fr = 1. - max(dot(N, V), 0.); fr *= fr*fr;
  col += (uDayCol*uDay*(0.6*cone + 0.2*wide) + uAmb*0.5)*fr*mix(1., 0.015, talon)*(1. - 0.75*isF)*(1. - 0.7*belly);
  // the daylight on the outline of the legs and toes (legK: not the belly, not the talons): nothing where the surface faces the eye
  // by 0.55 or more, rising to 0.8 of the daylight where it faces the eye by 0.05 or less, times cone (the fall-off from the shaft's axis)
  col += uDayCol*uDay*cone*legK*0.8*smoothstep(0.45, 0.95, 1. - max(dot(N, V), 0.));
  vec3 Hh = normalize(AX + V + vec3(0., 1e-3, 0.));
  float sp = max(dot(N, Hh), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col += uDayCol*vec3(0.78, 0.9, 1.1)*uDay*sp*sp*3.4*talon*(0.3 + 0.7*cone);
  col = max(col, vec3(0.));
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`,
  });
  const mesh = new THREE.Mesh(g.build(), mat); mesh.frustumCulled = false; mesh.name = 'strike-legs';
  return { mesh, hubs };
}

// ---------------------------------------------------------------------------------------------------------
// THE LIP: the broken edge of the roof round the hole, bent down like a burr: slabs of layered snow (wind slab, an ice lens,
// depth hoar) hanging from the torn edge, short on the side we come from and long at the sides. Its vertices are placed in
// the vertex shader from position = (angle round the hole, v down the slab 0..1, 0 inner wall .. 1 outer wall), with the
// disc's own edge and sag (HOLE_GLSL), so that it follows the hole as it opens.
// ---------------------------------------------------------------------------------------------------------
function buildLip(U, RU) {
  const CELLS = 22, NA = CELLS * 8, PROF = [[0, 0], [0, 0.34], [0, 0.67], [0, 1], [0.5, 1], [1, 1], [1, 0.55], [1, 0]];
  const pos = [], idx = [], NP = PROF.length;
  for (let k = 0; k <= NA; k++) for (const [wl, v] of PROF) pos.push(k / NA * TAU, v, wl);
  for (let k = 0; k < NA; k++) for (let j = 0; j + 1 < NP; j++) { const a = k * NP + j, b = a + NP; idx.push(a, b, b + 1, a, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uBulge: RU.uBulge, uHole: RU.uHole, uSeed: RU.uSeed },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
varying vec3 vL; varying vec3 vQ;
${FOG_VP}
${GLSL_N}
${HOLE_GLSL}
void main(){
  float th = position.x, v = position.y, wall = position.z;
  vec2 e = vec2(cos(th), sin(th)), c = vec2(0., 1.5);
  float cu = th/6.28318*${CELLS.toFixed(1)}, ci = mod(floor(cu), ${CELLS.toFixed(1)}), cf = fract(cu);
  float h1 = h11(ci*7.3 + uSeed), h2 = h11(ci*3.1 + 9. + uSeed);
  float notch = smoothstep(0., 0.14, cf)*(1. - smoothstep(0.86, 1., cf));
  float len = (mix(1.6, 0.85, smoothstep(0.1, 0.8, e.y))*(0.55 + 0.75*h1)*(0.3 + 0.7*notch) + 0.3)*uHole;
  float thick = (0.9 + 0.9*h2)*(0.45 + 0.55*notch);
  vec2 q = c + e*${HOLE_R.toFixed(1)}/vec2(1., 0.82);
  for (int i = 0; i < 3; i++) { vec2 d = q/max(length(q), 1e-3); q = c + e*(holeRag(d)*uHole + 0.1 + wall*thick)/vec2(1., 0.82); }
  vec2 qc = q - c;
  q -= qc/max(length(qc), 1e-3)*(0.2 + 0.45*h2)*v*len*(1. - 0.5*wall);
  float d = v*len*(1. - 0.3*wall*(h1 - 0.3));
  vec3 p = vec3(q.x, 0.45*(1. - v) - discDrop(q) - d, q.y);
  vL = p + vec3(0., ${(ROOF_Y - 0.2).toFixed(2)}, ${HOLE_Z.toFixed(3)});
  vQ = vec3(d, wall, h1);
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
varying vec3 vL; varying vec3 vQ;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 V = normalize(uCamL - vL);
  vec3 N = facetN(vL, vec3(0., -1., 0.), V);
  // strata: layers some 0.45 m thick, each of its own tone, with a dark seam under it; one glassy lens
  float d = vQ.x + 0.3*(vn2(vL.xz*0.5 + 3.) - 0.5);
  float li = d/0.45, lid = floor(li), lf = fract(li);
  float tone = 0.12 + 0.88*h11(lid*5.3 + 2.1), seam = 1. - 0.7*(1. - smoothstep(0., 0.2, lf));
  float gr = vn3(vL*2.1), gr2 = vn3(vL*6.3);
  vec3 alb = mix(vec3(0.20, 0.33, 0.60), vec3(0.42, 0.56, 0.82), tone)*seam*(0.8 + 0.25*gr + 0.15*gr2);
  float lens = exp(-(d - 0.72)*(d - 0.72)/0.012);
  alb = mix(alb, vec3(0.30, 0.78, 0.86), lens*0.8);
  float inner = 1. - vQ.y;
  float wide = exp(-dot(vL.xz, vL.xz)/1300.);
  vec3 L = uDayCol*uDay*((0.06 + 0.75*inner)*(0.7 + 0.3*N.y) + (0.2 + 0.3*inner)*wide*max(-N.y*0.6 + 0.4, 0.)) + uSkyCol*0.45*inner + uAmb*(0.75 + 0.5*inner) + uTurq*0.3*(1. - inner) + uShadowCol*0.5;
  vec3 col = alb*L;
  col += (uDayCol*uDay*1.6 + uAmb)*glitter(vL, V, 4.)*(0.5 + inner);
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  ${FOG_F}
}`,
  }));
  mesh.position.set(0, ROOF_Y - 0.2, HOLE_Z); mesh.frustumCulled = false; mesh.name = 'strike-lip';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// THE SEDGE the feet close on: bleached blades matted on the floor round each foot. The ones under a foot are drawn in and up
// as the toes clench (uFoot.x). position = the blade's own shape, a = (hub x, hub z, side, hash), b = (across, along, 0, 0).
// ---------------------------------------------------------------------------------------------------------
function buildSedge(U, rng, hubs, footU) {
  const g = new GB(), P = new V3(), Dv = new V3(), Sd = new V3();
  hubs.forEach((hub, si) => {
    for (let i = 0; i < 46; i++) {
      const an = rng.range(0, TAU), r0 = rng.range(0.4, 5.2), dir = an + rng.range(-1.1, 1.1), len = rng.range(3.2, 6.5), wid = rng.range(0.26, 0.4), arch = rng.range(0.15, 1.3) * (rng() < 0.3 ? 2 : 1), h = rng();
      const tone = rng.range(0.7, 1.15), col = [0.56 * tone, 0.45 * tone, 0.23 * tone], NS = 6, rows = [];
      Dv.set(Math.cos(dir), 0, Math.sin(dir)); Sd.set(-Dv.z, 0, Dv.x);
      for (let j = 0; j <= NS; j++) {
        const f = j / NS, w = wid * 0.5 * Math.pow(1 - f, 0.6) * (0.5 + 0.5 * Math.min(f * 6, 1)) + 0.012;
        P.set(hub.x + Math.cos(an) * r0, 0.1 + arch * Math.sin(Math.PI * Math.min(f * 1.15, 1)) + 0.5 * arch * f * f, hub.z + Math.sin(an) * r0).addScaledVector(Dv, len * f);
        rows.push([g.v(P.x - Sd.x * w, P.y, P.z - Sd.z * w, col, [hub.x, hub.z, si, h], [-1, f, 0, 0]), g.v(P.x, P.y + w * 0.5, P.z, col, [hub.x, hub.z, si, h], [0, f, 0, 0]), g.v(P.x + Sd.x * w, P.y, P.z + Sd.z * w, col, [hub.x, hub.z, si, h], [1, f, 0, 0])]);
      }
      for (let j = 0; j < NS; j++) { g.quad(rows[j][0], rows[j][1], rows[j + 1][1], rows[j + 1][0]); g.quad(rows[j][1], rows[j][2], rows[j + 1][2], rows[j + 1][1]); }
    }
  });
  const mesh = new THREE.Mesh(g.build(), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uFoot: footU }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 a; attribute vec4 b; attribute vec3 color;
uniform vec2 uFoot[2]; uniform float uTime;
varying vec3 vL; varying vec3 vN; varying vec3 vC; varying vec4 vB;
${FOG_VP}
void main(){
  vec3 p = position; vec2 foot = mix(uFoot[0], uFoot[1], a.z);
  vec2 dh = p.xz - a.xy; float near = exp(-dot(dh, dh)/9.), cl = max(foot.x, 0.)*near;
  p.xz -= dh*0.5*cl; p.y += 1.6*cl*b.y + 0.04*sin(uTime*2.1 + a.w*40.)*b.y;
  vL = p; vN = normal; vC = color; vB = vec4(b.xy, a.w, 0.);
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
varying vec3 vL; varying vec3 vN; varying vec3 vC; varying vec4 vB;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 V = normalize(uCamL - vL);
  vec3 N = normalize(vN); if (dot(N, V) < 0.) N = -N;
  float ax = abs(vB.x), v = vB.y, h = vB.z;
  vec3 alb = vC*(0.7 + 0.4*vn2(vec2(vB.x*4. + h*30., v*9.)))*(1. - 0.45*(1. - smoothstep(0.03, 0.14, ax)));
  alb = mix(alb, vec3(0.62, 0.72, 0.8), smoothstep(0.7, 1., ax)*0.5 + 0.3*smoothstep(0.8, 1., v));
  float ad = axisDist(vL)/12.5, cone = exp(-ad*ad), wide = exp(-dot(vL.xz, vL.xz)/1100.);
  vec3 L = uDayCol*uDay*(1.0*cone + 0.45*wide)*(0.45 + 0.55*N.y) + uAmb*(1.3 + 0.8*N.y) + uShadowCol*0.8;
  gl_FragColor = vec4(alb*L, 1.);
  ${FOG_F}
}`,
  }));
  mesh.frustumCulled = false; mesh.name = 'strike-sedge';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// THE SEDGE AND THE CAMERA'S ROUTE. clearSedge(mesh, route, pause) measures every blade of the built sedge against the route (an
// object with length and posAtDist(d, out)) and turns, or lowers, the blades that come too near it. It draws from no random
// stream, and it leaves the vertices of a blade that clears as it was dealt as they are.
// SEDGE_CLEAR is the clear air asked for, in metres. The route is taken as its points at every SEDGE_STEP of its length, from its
// start to its end; SEDGE_STEP is added to SEDGE_CLEAR for the route between two neighbouring points.
// A blade is 21 vertices, seven rows of three (edge, midrib, edge). Its root is the middle vertex of its first row in x and z, at the
// height of the first vertex of that row. It is measured as seven centres (the point half way between the first and the third
// vertex of each row) and the six straight spans from each centre to the next. Each row has an allowance: the largest, over its
// three vertices, of the vertex's distance from the row's centre + the length of the move the vertex shader above gives that vertex
// at the grip SEDGE_GRIP (dh*0.5*cl in x and z, 1.6*cl*b.y in y, where cl = SEDGE_GRIP*near and dh and near are the shader's own)
// + the shader's sway at its largest, 0.04*b.y. a.xy is read from the blade's first vertex and b.y from the row's first vertex.
// SEDGE_GRIP is the highest uFoot.x that apply() in buildHero sets. A blade clears when no point taken of the route is nearer to
// any of its spans than SEDGE_CLEAR + SEDGE_STEP + the larger allowance of the span's two rows.
// Only the route's points within nearR of the root are measured. nearR starts at 0 for each blade; whenever a pose of the blade
// reaches further than nearR (the furthest of its centres from the root + its largest allowance + SEDGE_CLEAR + SEDGE_STEP), the
// points are gathered anew, SEDGE_WIDER beyond that reach.
// A blade that does not clear as dealt is turned about the upright line through its root, all its vertices by the same angle: by
// SEDGE_TURN, by twice SEDGE_TURN and so on up to SEDGE_TURNS times SEDGE_TURN (half a circle), at each size first the way the
// angle dir of buildSedge grows and then the other way. The first pose that clears is kept, so no smaller turn of these clears.
// If none clears, the height of each row above the root is lowered by one part in SEDGE_LOWERS (a row's height is its first
// vertex's, and each vertex keeps its own height above the first vertex of its row), and at that height the direction as dealt
// and then the same turns in the same order are gone through; then by two parts, and so on down to flat. If nothing clears, the
// blade is laid flat in the direction it was dealt. The pose kept is written over the blade's vertices.
// pause is awaited before the route's points are taken, after them, and after each height of a blade that did not clear as dealt.
// If any blade was changed, the positions are marked as changed and the normals of the whole mesh are made again from them.
// ---------------------------------------------------------------------------------------------------------
const SEDGE_CLEAR = 2.0;
const SEDGE_STEP = 0.05, SEDGE_WIDER = 1, SEDGE_GRIP = 0.36, SEDGE_TURN = DEG, SEDGE_TURNS = 180, SEDGE_LOWERS = 20;
async function clearSedge(mesh, route, pause) {
  const geo = mesh.geometry, pos = geo.attributes.position, p = pos.array, a = geo.attributes.a.array, b = geo.attributes.b.array;
  await pause();
  const nq = Math.ceil(route.length / SEDGE_STEP) + 1, q = new Float64Array(nq * 3), v = new V3();
  for (let i = 0; i < nq; i++) { route.posAtDist(Math.min(i * SEDGE_STEP, route.length), v); q[i * 3] = v.x; q[i * 3 + 1] = v.y; q[i * 3 + 2] = v.z; }
  await pause();
  const w = new Float32Array(63), c = new Float64Array(21), al = new Float64Array(7), far = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
  let near = [], nearR = 0, changed = false;
  for (let o = 0; o < pos.count; o += 21) {
    const rx = p[o * 3 + 3], ry = p[o * 3 + 1], rz = p[o * 3 + 5], hx = a[o * 4], hz = a[o * 4 + 1];
    nearR = 0;
    // the blade turned by turn about its root, each row set at low times its height above the root (a row's height is its first
    // vertex's; each vertex keeps its own height above the first vertex of its row), into w; true when that pose clears
    const clears = (turn, low) => {
      const cs = Math.cos(turn), sn = Math.sin(turn);
      let out = 0, most = 0;
      for (let j = 0; j < 7; j++) {
        const r = (o + j * 3) * 3, e = j * 9, f = b[(o + j * 3) * 4 + 1], ye = ry + (p[r + 1] - ry) * low;
        for (let k = 0; k < 9; k += 3) { const dx = p[r + k] - rx, dz = p[r + k + 2] - rz; w[e + k] = rx + dx * cs - dz * sn; w[e + k + 1] = ye + (p[r + k + 1] - p[r + 1]); w[e + k + 2] = rz + dx * sn + dz * cs; }
        const cx = (w[e] + w[e + 6]) / 2, cy = (w[e + 1] + w[e + 7]) / 2, cz = (w[e + 2] + w[e + 8]) / 2;
        c[j * 3] = cx; c[j * 3 + 1] = cy; c[j * 3 + 2] = cz; al[j] = 0;
        for (let k = 0; k < 9; k += 3) {
          const dhx = w[e + k] - hx, dhz = w[e + k + 2] - hz, cl = SEDGE_GRIP * Math.exp(-(dhx * dhx + dhz * dhz) / 9);
          al[j] = Math.max(al[j], far(w[e + k] - cx, w[e + k + 1] - cy, w[e + k + 2] - cz) + far(dhx * 0.5 * cl, 1.6 * cl * f, dhz * 0.5 * cl) + 0.04 * f);
        }
        out = Math.max(out, far(cx - rx, cy - ry, cz - rz)); most = Math.max(most, al[j]);
      }
      const reach = out + most + SEDGE_CLEAR + SEDGE_STEP;
      if (reach > nearR) {
        nearR = reach + SEDGE_WIDER; near = [];
        for (let i = 0; i < nq * 3; i += 3) if (far(q[i] - rx, q[i + 1] - ry, q[i + 2] - rz) <= nearR) near.push(i);
      }
      for (let j = 0; j < 6; j++) {
        const ax = c[j * 3], ay = c[j * 3 + 1], az = c[j * 3 + 2], ex = c[j * 3 + 3] - ax, ey = c[j * 3 + 4] - ay, ez = c[j * 3 + 5] - az;
        const least = SEDGE_CLEAR + SEDGE_STEP + Math.max(al[j], al[j + 1]);
        for (const i of near) {
          const x = q[i] - ax, y = q[i + 1] - ay, z = q[i + 2] - az, t = clamp((x * ex + y * ey + z * ez) / (ex * ex + ey * ey + ez * ez), 0, 1);
          if (far(x - ex * t, y - ey * t, z - ez * t) < least) return false;
        }
      }
      return true;
    };
    if (clears(0, 1)) continue;
    let ok = false;
    for (let m = 0; m <= SEDGE_LOWERS && !ok; m++) {
      for (let n = m ? 0 : 1; n <= SEDGE_TURNS && !ok; n++) ok = clears(n * SEDGE_TURN, 1 - m / SEDGE_LOWERS) || (n > 0 && clears(-n * SEDGE_TURN, 1 - m / SEDGE_LOWERS));
      await pause();
    }
    if (!ok) clears(0, 0);
    p.set(w, o * 3); changed = true;
  }
  if (changed) { pos.needsUpdate = true; geo.computeVertexNormals(); }
}

// ---------------------------------------------------------------------------------------------------------
// SNOW BLOCKS on ballistic paths keyed to strike time, and the debris mound they build under the hole
// ---------------------------------------------------------------------------------------------------------
function buildBlocks(U, rng, nearR, noise, G, TW, detail, hubs) {
  // base chunk: a chamfered, lumpy box (2x2 quads a face). The ten big pieces that come to rest beside the eye's line are cut finer
  // (7x7 quads a face): broken snow, its arrises crumbled away in bites and its faces pitted
  const chunk = (seg, fine) => {
    const base = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg).toNonIndexed(), bp = base.getAttribute('position');
    for (let i = 0; i < bp.count; i++) {
      let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
      const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z), mid = ax + ay + az - Math.max(ax, ay, az) - Math.min(ax, ay, az);
      const l = Math.hypot(x, y, z) || 1, k = 0.62 / l;                         // pull corners in: chamfer
      x = lerp(x, x * k, 0.45); y = lerp(y, y * k, 0.45); z = lerp(z, z * k, 0.45);
      let d = 1 + 0.22 * noise.n3(x * 2.3 + 7, y * 2.3, z * 2.3) + 0.1 * noise.n3(x * 6, y * 6 + 3, z * 6);
      if (fine) d += 0.045 * noise.n3(x * 13 + 1, y * 13, z * 13 + 5) - 0.2 * sstep(0.3, 0.5, mid) * Math.max(0, 0.35 + noise.n3(x * 4.5 + 11, y * 4.5 + 5, z * 4.5));
      bp.setXYZ(i, x * d, y * d, z * d);
    }
    return bp;
  };
  const count = Math.round(330 * (0.6 + 0.4 * detail));
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4), iC = new Float32Array(count * 4), iD = new Float32Array(count * 4);
  // rest places must leave the camera line clear (it runs along x = 0, eye 3 m up, then climbs the shaft)
  const restOK = (x, z, size) => size < 0.8 ? Math.abs(x) > 2.4 || z < -14 : ((Math.abs(x) > 4.3 + size * 0.5 || z < -16) && !(z > -2.5 && z < 16 && Math.abs(x) < 10) && !(z >= 16 && Math.abs(x) < 8.2));
  // the first ten are the brief's foreground: pieces of the lip 2 to 3 m across, knocked out as the feet come through, while the owl
  // holds and as it wrenches out, which thud down and roll to rest 4 m either side of the gallery's middle line. Their rest places
  // are places of the gallery: five a side, 4.3 m and half a block from the line. Each side's stretch of floor runs from the end of
  // its own foot's reach (the z of that side's hub, then TOE_REACH, the length of a toe, and half the block's own size) to
  // WRENCH_AHEAD, and one block rests in each fifth of it, dealt by a stream of their own; so is the moment each breaks off: one in
  // each tenth of the strike's own time, from the burst to the wrench (0 to TW)
  // WRENCH_AHEAD, the design: 'they wrench out 27 m ahead (0.68 of frame, the closest pass), then run on under the hole with blocks
  // thudding and rolling 4 m either side'
  const WRENCH_AHEAD = 27;
  const TOE_REACH = TOE_L[0] + TOE_L[1] + TOE_L[2];
  const nNear = 10, NEAR_Z = [nearR.shuffle([0, 1, 2, 3, 4]), nearR.shuffle([0, 1, 2, 3, 4])];
  for (let i = 0; i < count; i++) {
    let x, y, z, vx, vy, vz, t0, size, tl, roll, gy, gz, tries = 0;
    const near = i < nNear;
    do {
      gy = G; gz = 0;
      const f = i / count, an = rng.range(0, TAU);
      size = f < 0.1 ? rng.range(2.0, 3.0) : f < 0.36 ? rng.range(1.0, 2.0) : f < 0.82 && rng() < 0.55 ? rng.range(1.1, 2.3) : rng.range(0.5, 1.0);
      if (near) {
        const sd = i % 2 ? 1 : -1; t0 = (i + nearR()) / nNear * TW; roll = nearR.range(0.3, 0.8);
        x = sd * nearR.range(2.5, 7); z = HOLE_Z + nearR.range(1, 8); y = ROOF_Y + nearR.range(0, 4.5); vy = nearR.range(0, 5);
        tl = (vy + Math.sqrt(vy * vy + 2 * G * Math.max(y - size * 0.36, 0))) / G;
        const z0 = hubs.find((h) => h.x * sd > 0).z + TOE_REACH + size * 0.5;
        const zr = z0 + (WRENCH_AHEAD - z0) * (NEAR_Z[i % 2][i >> 1] + nearR()) / 5, xr = sd * (4.3 + size * 0.5 + nearR.range(0, 1.3)), air = tl + roll * 0.45;
        vx = (xr - x) / air; vz = (zr - z) / air;
      } else if (f < 0.42) {          // the roof itself breaking up as the feet come through
        const r = Math.sqrt(rng()) * 9.5; x = Math.cos(an) * r; z = HOLE_Z + Math.sin(an) * r * 1.1; y = ROOF_Y - 1.5 - rng.range(0, 2.5);
        const out = rng.range(2.5, 13) * (0.5 + r / 9.5) * (Math.sin(an) > 0 ? 1.5 : 1); vx = Math.cos(an) * out; vz = Math.sin(an) * out + 2; vy = -rng.range(1, 15) + rng.range(0, 5) * (r / 9.5);
        t0 = rng() * rng() * 0.5;
      } else if (f < 0.82) {         // the rim crumbling while the owl holds
        const r = rng.range(9, 12.5); x = Math.cos(an) * r; z = HOLE_Z + Math.sin(an) * r * 1.1; y = ROOF_Y - rng.range(0.5, 2);
        vx = -Math.cos(an) * rng.range(0, 2.5); vz = -Math.sin(an) * rng.range(0, 2.5); vy = -rng.range(0, 3);
        t0 = 0.3 + Math.pow(rng(), 0.95) * (TW - 0.2);
      } else if (f < 0.94) {         // torn loose by the pull-out
        const r = rng.range(5, 12); x = Math.cos(an) * r; z = HOLE_Z + Math.sin(an) * r; y = ROOF_Y + rng.range(-1, 6);
        vx = Math.cos(an) * rng.range(-1, 5); vz = Math.sin(an) * rng.range(-1, 5); vy = rng.range(-2, 9);
        t0 = TW + 0.1 + Math.pow(rng(), 1.3) * 2.2;
      } else {                       // late blocks down the shaft while the camera climbs
        const s = rng.range(30, 56), r = rng.range(5.5, 9); x = Math.cos(an) * r; y = s * SIN_P; z = -s * COS_P + Math.sin(an) * r;
        vx = 0; vz = rng.range(0.2, 1.2); vy = -rng.range(0, 4); t0 = TW + 2.2 + rng() * 4.5; size = rng.range(0.5, 1.3);
        gy = 0.8 * G * SIN_P; gz = 0.8 * G * COS_P;      // these slide down the leaning shaft, not straight down through its wall
      }
      const hr = size * 0.36;
      tl = (vy + Math.sqrt(vy * vy + 2 * gy * Math.max(y - hr, 0))) / gy;
      if (!near) roll = rng.range(0.25, 0.8);
    } while (!near && !restOK(x + vx * tl + vx * roll * 0.45, z + vz * tl + 0.5 * gz * tl * tl + vz * roll * 0.45, size) && ++tries < 80);
    if (tries >= 80) size = Math.min(size, 0.7);
    const ax = new V3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)).normalize();
    iA.set([x, y, z, size], i * 4); iB.set([vx, vy, vz, t0], i * 4);
    iC.set([ax.x, ax.y, ax.z, rng.range(1.5, 6) * rng.sign() / Math.sqrt(size)], i * 4);
    iD.set([tl, Math.min(0.24 * Math.abs(vy - gy * tl), 5.5), roll + (gz > 0 ? 10 : 0), rng()], i * 4);
  }
  const lands = [];
  for (let i = 0; i < nNear; i++) { const o = i * 4, tl = iD[o]; lands.push([iA[o] + iB[o] * tl, iA[o + 2] + iB[o + 2] * tl, iB[o + 3] + tl, iB[o], iB[o + 2], iD[o + 2], iA[o + 3]]); }
  const geoOf = (bp, i0, n) => {
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', bp); g.instanceCount = n;
    [['iA', iA], ['iB', iB], ['iC', iC], ['iD', iD]].forEach(([nm, a]) => g.setAttribute(nm, new THREE.InstancedBufferAttribute(a.slice(i0 * 4, (i0 + n) * 4), 4)));
    return g;
  };
  const SNOW_FRAG = /* glsl */`
uniform float uStr, uFacet;
varying vec3 vL; varying vec3 vN; varying float vH; varying vec3 vP;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 V = normalize(uCamL - vL);
  vec3 Ns = normalize(vN); if (dot(Ns, V) < 0.) Ns = -Ns;
  vec3 N = normalize(mix(Ns, facetN(vL, Ns, V), uFacet));
  float dep = clamp((${SURF_Y.toFixed(1)} - vL.y)/50., 0., 1.);
  float skyVis = mix(1., 0.09, pow(dep, 0.65))*smoothstep(${(ROOF_Y - 1).toFixed(1)}, ${(ROOF_Y + 6).toFixed(1)}, vL.y);
  // snow: white, soft lumps of two sizes laid in the block's own space (they turn with it), no grain fine enough to stipple
  float gr = vn3(vP*1.3 + vH*20.), gr2 = vn3(vP*3.3 + vH*9.);
  vec3 alb = vec3(0.90, 0.93, 0.96)*(0.82 + 0.12*gr + 0.08*gr2);
  alb = mix(alb, vec3(0.60, 0.77, 0.90), smoothstep(0.55, 0.8, vn3(vP*0.7 + vH*31.))*0.3);       // bluer, denser lumps of old snow
  // a block is a piece of the layered roof (uStr): strata some 0.4 m thick across it (depth hoar, wind slab, powder, now and then a
  // glassy blue ice lens), each of its own tone with a soft seam
  float li = vP.y/0.42 + 0.35*(vn2(vP.xz*1.4 + vH*13.) - 0.5), lf = fract(li), lh = h11(floor(li)*5.3 + vH*31.);
  alb *= mix(1., (0.74 + 0.26*lh)*(1. - 0.4*(1. - smoothstep(0., 0.2, lf)))*(0.92 + 0.16*vn3(vP*1.1 + vH*7.)), uStr);
  alb = mix(alb, vec3(0.50, 0.74, 0.95), 0.55*uStr*step(0.86, h11(floor(li)*9.1 + vH*3.))*smoothstep(0., 0.2, lf));
  vec3 col = alb*snowLight(vL, N, skyVis);
  float frS = 1. - max(dot(N, V), 0.); col += alb*(uAmb*1.2 + uDayCol*uDay*0.25*exp(-dot(vL.xz, vL.xz)/900.))*frS*frS;
  float ad = axisDist(vL)/12.5;
  col += alb*(uTurq*0.07*(1. - N.y) + uCobalt*0.16*smoothstep(${ROOF_Y.toFixed(1)}, ${(ROOF_Y + 8).toFixed(1)}, vL.y));   // a little light inside the lump
  // a block in the gallery stands in the daylight that pours from the hole: white on the side turned to it, blue in its own shade
  { vec3 toH = normalize(vec3(-vL.x, 9., ${HOLE_Z.toFixed(2)} - vL.z)); float dH = max(dot(N, toH)*0.6 + 0.4, 0.), blw = 1. - smoothstep(${(ROOF_Y - 1).toFixed(1)}, ${(ROOF_Y + 6).toFixed(1)}, vL.y);
    col += alb*(uDayCol*uDay*1.1*dH*dH*exp(-min(dot(vL.xz, vL.xz)/2600., 40.)) + (uDayCol*0.3 + uTurq*0.06)*(0.35 + 0.65*max(N.y, 0.)))*blw*uStr; }
  col += uDayCol*uDay*exp(-ad*ad)*3.*glitter(vL, V, 4.)*mix(1., 0.35, uStr);
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  ${FOG_F}
}`;
  const BLOCK_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD;
uniform float uT, uG;
varying vec3 vL; varying vec3 vN; varying float vH; varying vec3 vP;
${FOG_VP}
${GLSL_N}
void main(){
  float tau = uT - iB.w, vis = step(0., tau);
  float tA = clamp(tau, 0., iD.x), tB = max(tau - iD.x, 0.);
  float sh = step(5., iD.z), roll = iD.z - 10.*sh;                      // sh: slides down the leaning shaft
  vec3 c = iA.xyz + iB.xyz*tA + mix(vec3(0., -1., 0.), -AX*0.8, sh)*0.5*uG*tA*tA;
  float tb = min(tB, 2.*iD.y/uG);                                     // one bounce
  c.y += iD.y*tb - 0.5*uG*tb*tb;
  c.xz += iB.xz*roll*0.45*(1. - exp(-tB/0.45));                       // then it rolls to rest
  float an = iC.w*tA + iC.w*0.4*(1. - exp(-tB/0.4));
  vec3 sc = vec3(1., 0.62 + 0.5*iD.w, 0.72 + 0.5*fract(iD.w*7.3))*iA.w*vis*smoothstep(0., 0.12, tau);
  vec3 p = rotAx(position*sc, iC.xyz, an);
  vL = c + p; vN = rotAx(normalize(position), iC.xyz, an); vH = iD.w; vP = position*sc;
  vec4 mvPosition = modelViewMatrix*vec4(vL, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`;
  const blockMat = (facet) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uG: { value: G }, uStr: { value: 1 }, uFacet: { value: facet } }, fog: true, vertexShader: BLOCK_VERT, fragmentShader: SNOW_FRAG });
  const blocks = new THREE.Mesh(geoOf(chunk(2, false), nNear, count - nNear), blockMat(0.3));
  blocks.frustumCulled = false; blocks.name = 'strike-blocks';
  const nearBlocks = new THREE.Mesh(geoOf(chunk(7, true), 0, nNear), blockMat(0.35));
  nearBlocks.frustumCulled = false; nearBlocks.name = 'strike-blocks-near'; blocks.add(nearBlocks);

  // the mound: fallen snow heaped under the hole, growing with strike time; kept low on the camera line
  const m = new GB(), NR = 20, NA = 56, rings = [], W = [1, 1, 1];
  for (let j = 0; j <= NR; j++) {
    const r = 0.3 + 15.5 * (j / NR), ring = [];
    for (let k = 0; k < NA; k++) {
      const th = k / NA * TAU, x = Math.cos(th) * r * (1 + 0.12 * noise.n2(th * 2 + 5, r * 0.1)), z = Math.sin(th) * r * 1.15 - 1.5;
      const lane = (0.45 + 0.55 * sstep(2.5, 6.5, Math.abs(x))) * Math.max(1 - sstep(-5, 0.5, z), 0.75 * sstep(8.5, 11.5, Math.abs(x)));
      const hgt = (2.1 * Math.exp(-r * r / 80) * (0.55 + 0.6 * (noise.fbm2(x * 0.22 + 3, z * 0.22, 3) + 0.5)) + 0.35 * Math.max(0, noise.n2(x * 0.7, z * 0.7 + 9))) * lane * (1 - sstep(11, 15.5, r));
      ring.push(m.v(x, hgt > 0.05 ? hgt : hgt * 12 - 0.6, z, W, [hgt, 0, 0, 0]));
    }
    rings.push(ring);
  }
  const cv = m.v(0, 0.5, -1.5, W, [0.5, 0, 0, 0]);
  for (let k = 0; k < NA; k++) m.tri(cv, rings[0][(k + 1) % NA], rings[0][k]);
  for (let j = 0; j < NR; j++) for (let k = 0; k < NA; k++) { const k1 = (k + 1) % NA; m.quad(rings[j][k], rings[j][k1], rings[j + 1][k1], rings[j + 1][k]); }
  const mound = new THREE.Mesh(m.build(), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uGrow: { value: 0 }, uStr: { value: 0 }, uFacet: { value: 0.3 } }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
uniform float uGrow;
varying vec3 vL; varying vec3 vN; varying float vH; varying vec3 vP;
${FOG_VP}
void main(){
  vec3 p = position; p.y = p.y > 0. ? p.y*uGrow : p.y;
  vL = p; vN = normalize(vec3(normal.x*uGrow, normal.y, normal.z*uGrow) + vec3(0., 1e-3, 0.)); vH = 0.3; vP = p;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: SNOW_FRAG,
  }));
  mound.frustumCulled = false; mound.name = 'strike-mound';
  return { blocks, mound, lands };
}

// ---------------------------------------------------------------------------------------------------------
// POWDER (soft puffs: burst cloud, impact ring, pull-out plume, sifting, spindrift) and GLITTER (sparks)
// ---------------------------------------------------------------------------------------------------------
function buildDust(U, rng, G, TW, THIT, detail, blizzard, lands = []) {
  // ---- puffs. aP = start xyz + size, aV = velocity xyz + t0, aM = (life, drag, mode, hash); mode 1 loops on time
  const P = [], Vv = [], M = [];
  const add = (x, y, z, size, vx, vy, vz, t0, life, drag, mode) => { P.push(x, y, z, size); Vv.push(vx, vy, vz, t0); M.push(life, drag, mode, rng()); };
  const n1 = Math.round(170 * detail), n2 = Math.round(90 * detail), n3 = Math.round(150 * detail), n4 = Math.round(110 * detail), n5 = Math.round((blizzard ? 200 : 80) * detail);
  for (let i = 0; i < n1; i++) {     // the burst: roof snow blown down and out
    const an = rng.range(0, TAU), r = Math.sqrt(rng()) * 10, o = rng.range(2, 11);
    add(Math.cos(an) * r, ROOF_Y - rng.range(0.5, 3), HOLE_Z + Math.sin(an) * r, rng.range(1.6, 3.4), Math.cos(an) * o, -rng.range(4, 20), Math.sin(an) * o + 1.5, rng() * 0.3, rng.range(1.0, 1.9), rng.range(1.2, 2.4), 0);
  }
  for (let i = 0; i < n2; i++) {     // the feet hitting the floor: a low ring
    const an = rng.range(0, TAU), o = rng.range(7, 20), sx = rng.sign() * 5.3;
    add(sx + Math.cos(an) * 2, rng.range(0.3, 1.2), Math.sin(an) * 2, rng.range(1.8, 3.6), Math.cos(an) * o, rng.range(0.5, 5), Math.sin(an) * o, THIT + rng() * 0.08, rng.range(0.9, 1.7), rng.range(2.5, 4), 0);
  }
  for (let i = 0; i < n3; i++) {     // the pull-out: a plume dragged up the shaft that falls back
    const s = rng.range(0, 26), an = rng.range(0, TAU), r = rng.range(1, 8.5), up = rng.range(14, 46);
    add(AX.x * s + Math.cos(an) * r, AX.y * s + rng.range(0, 2), AX.z * s + Math.sin(an) * r, rng.range(2.4, 4.6), Math.cos(an) * 2.5, up * SIN_P, -up * COS_P + Math.sin(an) * 2.5, TW + rng() * 0.25 + s * 0.006, rng.range(0.8, 1.25), rng.range(0.9, 1.7), 0);
  }
  for (let i = 0; i < n4; i++) {     // fine snow sifting off the torn rim for as long as the hole is open
    const an = rng.range(0, TAU), r = rng.range(8.5, 11.5);
    add(Math.cos(an) * r, ROOF_Y + rng.range(-1.5, 1), HOLE_Z + Math.sin(an) * r * 1.1, rng.range(1.2, 2.6), rng.range(-0.6, 0.6), -rng.range(2, 5), rng.range(-0.6, 0.6), rng() * 3, rng.range(2.2, 3.2), 0.3, 1);
  }
  for (let i = 0; i < n5; i++) {     // spindrift streaming across the crater mouth from the sun side
    add(-34 + rng.range(-6, 6), SURF_Y + rng.range(0.6, 3.4), -38 + rng.range(-9, 8), rng.range(1.6, 3.4), rng.range(13, 20), rng.range(-0.2, 0.5), rng.range(-1.5, 1.5), rng() * 4, rng.range(3.4, 4.2), 0.02, 2);
  }
  // powder knocked off each big block as it lands and shed along its roll (hashed from the block's number: no random draws)
  lands.forEach(([lx, lz, tL, vx, vz, roll, size], bi) => {
    const hh = (n) => { const v = Math.sin((bi * 13 + n) * 127.1 + 4.3) * 43758.5453; return v - Math.floor(v); };
    for (let k = 0; k < 9; k++) {
      const an = hh(k) * TAU, o = 2 + 5 * hh(k + 20), late = k < 5 ? 0 : (k - 4) * 0.16, e = roll * 0.45 * (1 - Math.exp(-late / 0.45));
      P.push(lx + vx * e + Math.cos(an) * size * 0.4, 0.3 + 0.8 * hh(k + 40), lz + vz * e + Math.sin(an) * size * 0.4, (k < 5 ? 1.0 : 0.7) * size * (0.7 + 0.5 * hh(k + 60)));
      Vv.push(Math.cos(an) * o + vx * 0.4, 1 + 3 * hh(k + 80), Math.sin(an) * o + vz * 0.4, tL + late);
      M.push(0.9 + 0.7 * hh(k + 100), 3, 0, hh(k + 120));
    }
  });
  const pg = new THREE.BufferGeometry(), np = P.length / 4;
  pg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(np * 3), 3));
  pg.setAttribute('aP', new THREE.Float32BufferAttribute(P, 4)); pg.setAttribute('aV', new THREE.Float32BufferAttribute(Vv, 4)); pg.setAttribute('aM', new THREE.Float32BufferAttribute(M, 4));
  const puffs = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uG: { value: G }, uPx: { value: 400 }, uHole: { value: 0 } }, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
attribute vec4 aP; attribute vec4 aV; attribute vec4 aM;
uniform float uT, uTime, uG, uPx, uHole;
varying float vA; varying vec3 vL; varying float vMode;
${FOG_VP}
void main(){
  float mode = aM.z, loop = step(0.5, mode);
  float tau = mix(uT - aV.w, mod(uTime + aV.w, aM.x), loop);
  float f = tau/aM.x, k = aM.y;
  float e = (1. - exp(-k*max(tau, 0.)))/k;
  vec3 p = aP.xyz + aV.xyz*e;
  p.y -= 0.5*uG*0.16*tau*tau*step(mode, 0.5);
  p.y = max(p.y, 0.25 + 0.4*aM.w);
  if (mode > 1.5) { p.y += sin(p.x*0.22 + aM.w*20.)*0.7; }
  float on = step(0., tau)*step(f, 1.)*mix(1., uHole, loop*step(mode, 1.5));
  float fa = smoothstep(0., 0.08, f)*(1. - f); 
  vA = on*fa*fa*mix(0.15, mode > 1.5 ? 0.3 : 0.2, loop);
  vL = p; vMode = mode;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  vA *= smoothstep(2.5, 10., -mvPosition.z);                           // never a sheet across the lens
  gl_PointSize = clamp(aP.w*(1. + 1.7*f)*uPx/max(-mvPosition.z, 0.5), 0., uPx*0.3)*on;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
varying float vA; varying vec3 vL; varying float vMode;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec2 q = gl_PointCoord*2. - 1.; float r2 = dot(q, q);
  if (r2 > 1. || vA < 0.004) discard;
  float soft = (1. - r2); soft *= soft;
  float ad = axisDist(vL)/13.; float cone = exp(-ad*ad)*(1. - smoothstep(${(ROOF_Y + 2).toFixed(1)}, ${(ROOF_Y + 14).toFixed(1)}, vL.y));
  float up = smoothstep(${(ROOF_Y + 4).toFixed(1)}, ${SURF_Y.toFixed(1)}, vL.y);
  vec3 col = uDayCol*uDay*0.95*cone + uAmb*1.2 + (uSkyCol*0.8 + uSunCol*0.35)*up + uTurq*0.45*smoothstep(4., 11., vL.y)*(1. - up);
  gl_FragColor = vec4(col*0.8, vA*soft);
  ${FOG_F}
}`,
  }));
  puffs.frustumCulled = false; puffs.renderOrder = 5; puffs.name = 'strike-powder';

  // ---- glitter: crystals falling through the daylight (and sifting from the roof before the burst)
  // (a fifth of them fall only through the lowest 16 m of the column, behind the legs and beside them, so the legs stay dark shapes)
  const ng = Math.round(3000 * detail), gp = new Float32Array(ng * 3), ga = new Float32Array(ng * 4), gs = new Float32Array(ng);
  for (let i = 0; i < ng; i++) {
    const sift = i < ng * 0.15, low = !sift && i < ng * 0.33, an = low ? rng.range(Math.PI - 0.25, TAU + 0.25) : rng.range(0, TAU);
    if (sift) { const r = Math.sqrt(rng()) * 30; gp[i * 3] = Math.cos(an) * r; gp[i * 3 + 1] = rng.range(0, ROOF_Y); gp[i * 3 + 2] = HOLE_Z + Math.sin(an) * r; }
    else { const s = rng.range(0, low ? 17.5 : 70), r = Math.sqrt(rng()) * (low ? 10.5 : 9.5); gp[i * 3] = Math.cos(an) * r; gp[i * 3 + 1] = s * SIN_P; gp[i * 3 + 2] = -s * COS_P + Math.sin(an) * r; }
    ga.set([rng.range(1.2, 4.5), rng(), sift ? 1 : 0, low ? rng.range(0.16, 0.36) : rng.range(0.08, 0.2)], i * 4);
    gs[i] = sift ? ROOF_Y : low ? 17.5 * SIN_P : 70 * SIN_P;
  }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('aG', new THREE.Float32BufferAttribute(ga, 4)); gg.setAttribute('aSp', new THREE.Float32BufferAttribute(gs, 1));
  const glit = new THREE.Points(gg, new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uPx: { value: 400 }, uSift: { value: 0 } }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
attribute vec4 aG; attribute float aSp;
uniform float uTime, uPx, uSift, uDay; uniform vec3 uCamL;
varying float vI; varying float vS;
${FOG_VP}
void main(){
  vec3 p = position; float sift = aG.z;
  float span = aSp;
  float y = mod(p.y - uTime*aG.x*mix(1., 0.5, sift), span);
  p.z += (p.y - y)*${(COS_P / SIN_P).toFixed(4)}*(1. - sift);         // stay inside the leaning column
  p.y = y; p.x += sin(uTime*1.3 + aG.y*40.)*0.4; p.z += cos(uTime*1.1 + aG.y*31.)*0.4;
  vec3 d = vec3(fract(aG.y*13.1), fract(aG.y*27.7), fract(aG.y*51.3))*2. - 1.;
  float tw = max(0., sin(uTime*(3. + 5.*aG.y) + aG.y*90. + dot(d, normalize(uCamL - p))*8.)); tw *= tw; tw *= tw;
  vI = (0.28 + 0.72*tw*tw)*mix(uDay, uSift*0.55, sift); vS = sift;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  gl_PointSize = clamp(aG.w*uPx/max(-mvPosition.z, 0.5), 1.8, 4.2)*step(0.004, vI);
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
uniform vec3 uDayCol, uTurq;
varying float vI; varying float vS;
${FOG_FP}
void main(){
  vec2 q = gl_PointCoord*2. - 1.; float r2 = dot(q, q);
  if (r2 > 1.) discard;
  float core = (1. - r2); core *= core;
  gl_FragColor = vec4(mix(uDayCol*5., uTurq*4. + uDayCol, vS)*vI*core, 1.);
  ${FOG_ADD}
}`,
  }));
  glit.frustumCulled = false; glit.renderOrder = 6; glit.name = 'strike-glitter';
  return { puffs, glit };
}

// ---------------------------------------------------------------------------------------------------------
// DOWN FEATHERS knocked loose: one falls past the climbing camera, one turns in the crater mouth
// a = (start s along the axis, offset angle, t0, fall speed), b = (hash, v along barb, size, 0)
// ---------------------------------------------------------------------------------------------------------
function buildFeathers(U, rng, TW) {
  const g = new GB();
  const spec = [[46, rng.range(2.3, 3.6), TW + 2.6, 3.0, 2.6], [79, rng.range(-0.4, 0.5), TW + 3.6, 2.6, 2.2], [30, rng.range(0.2, 1.4), TW + 0.5, 3.4, 1.6], [24, rng.range(3.4, 4.6), TW + 0.9, 3.8, 1.4], [58, rng.range(4.6, 5.8), TW + 3.0, 3.2, 1.8]];
  for (const [s0, an, t0, sp, size] of spec) {
    const h = rng(), A = [s0, an, t0, sp], L = 1.0, NB = 26;
    const col = [0.74, 0.76, 0.78], colT = [0.6, 0.63, 0.67];
    const r = [];
    for (let i = 0; i <= 6; i++) { const f = i / 6, y = (f - 0.25) * L, w = 0.02 * (1 - f * 0.7), z = 0.12 * f * f; r.push([g.v(-w, y, z, col, A, [h, 0, size, 0]), g.v(w, y, z, col, A, [h, 0, size, 0])]); }
    for (let i = 0; i < 6; i++) g.quad(r[i][0], r[i][1], r[i + 1][1], r[i + 1][0]);
    for (const sd of [-1, 1]) for (let i = 0; i < NB; i++) {
      const f = i / (NB - 1), y = (f - 0.2) * L, len = (0.34 + 0.2 * Math.sin(f * Math.PI) - 0.14 * f) * rng.range(0.8, 1.15), up = 0.25 + 0.5 * f, cz = 0.12 * f * f;
      const wv = 0.02, curl = rng.range(0.05, 0.22);
      const v0 = g.v(0, y - wv, cz, col, A, [h, 0, size, 0]), v1 = g.v(0, y + wv, cz, col, A, [h, 0, size, 0]);
      const mx = sd * len * 0.6, my = y + len * 0.6 * up;
      const v2 = g.v(mx, my - wv, cz + curl * 0.5, col, A, [h, 0.6, size, 0]), v3 = g.v(mx, my + wv, cz + curl * 0.5, col, A, [h, 0.6, size, 0]);
      const v4 = g.v(sd * len, y + len * up * 1.05, cz + curl * 1.6, colT, A, [h, 1, size, 0]);
      g.quad(v0, v2, v3, v1); g.tri(v2, v4, v3);
    }
  }
  const mesh = new THREE.Mesh(g.build(), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 a; attribute vec4 b; attribute vec3 color;
uniform float uT, uTime;
varying vec3 vL; varying vec3 vN; varying vec3 vC;
${FOG_VP}
${GLSL_N}
void main(){
  float tau = uT - a.z, on = step(0., tau), h = b.x;
  vec3 p = position*b.z*on;
  p.z += b.y*b.y*0.25*b.z*sin(uTime*3. + h*20.);                      // barbs breathe
  float rock = sin(tau*1.7 + h*6.)*0.9;
  vec3 n = normal;
  p = rotAx(p, vec3(0., 1., 0.), tau*0.9 + h*5.); n = rotAx(n, vec3(0., 1., 0.), tau*0.9 + h*5.);
  p = rotAx(p, vec3(0., 0., 1.), 1.2 + rock); n = rotAx(n, vec3(0., 0., 1.), 1.2 + rock);
  vec3 c = AX*a.x + vec3(cos(a.y), 0., sin(a.y))*4.6;
  c -= AX*a.w*tau*(0.75 + 0.25*cos(tau*3.4 + h*6.));                  // falls in swoops, down the shaft
  c += vec3(cos(tau*1.7 + h*6.), 0., sin(tau*1.1 + h*3.))*0.9;
  vL = c + p; vN = n; vC = color;
  vec4 mvPosition = modelViewMatrix*vec4(vL, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
varying vec3 vL; varying vec3 vN; varying vec3 vC;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 N = normalize(vN);
  float up = smoothstep(${ROOF_Y.toFixed(1)}, ${(SURF_Y - 8).toFixed(1)}, vL.y);
  vec3 L = uSkyCol*(0.35 + 0.75*up) + uSunCol*(0.25 + 0.5*abs(dot(N, uSunL)))*smoothstep(${(SURF_Y - 16).toFixed(1)}, ${SURF_Y.toFixed(1)}, vL.y) + uAmb + uDayCol*uDay*0.5*(1. - up);
  gl_FragColor = vec4(vC*L, 1.);
  ${FOG_F}
}`,
  }));
  mesh.frustumCulled = false; mesh.name = 'strike-feathers';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// THE OWL IN FLIGHT, seen from below: barred flight feathers laid one by one, coverts, fanned tail, trailing
// feathered legs. Owl space: nose +Z, back +Y, wings along X; span 140. Two-bone wingbeat in the shader.
// a = (on wing, beyond wrist, side, v along feather), b = (hash, across feather -1..1, pattern, tip flex)
// pattern 0 body, 1 flight feather, 2 covert, 3 leg
// ---------------------------------------------------------------------------------------------------------
const WRIST_X = 42;
function buildOwl(U, rng) {
  const g = new GB();
  const SEC = [[31, 0.5, 0.5, 2], [29, 6.4, 6.8, 2], [25, 10.6, 10.8, 2.2], [20, 11.6, 11.6, 2], [14, 8.8, 8.8, 1.2], [8, 9.2, 9, 0.5], [0, 9, 8.6, 0], [-8, 7.8, 7.2, 0], [-15, 5.8, 5, 0.5], [-21, 3.4, 2.4, 1], [-24, 1.2, 0.8, 1.2]];
  const body = [];
  for (const [z, rx, ry, yo] of SEC) {
    const ring = [];
    for (let k = 0; k < 16; k++) { const an = k / 16 * TAU, sy = Math.sin(an); ring.push(g.v(Math.cos(an) * rx, yo + sy * ry, z, sy < 0.2 ? [0.55, 0.54, 0.51] : [0.3, 0.3, 0.31], [0, 0, 0, 0], [0.5, 0, 0, 0])); }
    body.push(ring);
  }
  g.loft(body, true);
  // one feather: tapered strip with a rounded tip
  const feather = (root, beta, sgn, len, w0, yOff, A, flex) => {
    const dx = sgn * Math.sin(beta), dz = -Math.cos(beta), sx = Math.cos(beta), szz = sgn * Math.sin(beta), h = rng(), rows = [];
    const wW = (x) => A[0] * sstep(WRIST_X - 5, WRIST_X + 5, Math.abs(x));
    for (let i = 0; i <= 5; i++) {
      const f = i / 5, hw = 0.5 * w0 * (f < 0.75 ? 0.82 + 0.18 * f / 0.75 : Math.sqrt(Math.max(0.02, 1 - ((f - 0.75) / 0.25) ** 2)));
      const cx = root.x + dx * len * f, cz = root.z + dz * len * f, y = root.y + yOff - 0.9 * f * f;
      rows.push([g.v(cx - sx * hw, y - 0.12, cz - szz * hw, [1, 1, 1], [A[0], wW(cx - sx * hw), sgn, f], [h, -1, 1, flex * f * f]),
        g.v(cx, y + 0.1, cz, [1, 1, 1], [A[0], wW(cx), sgn, f], [h, 0, 1, flex * f * f]),
        g.v(cx + sx * hw, y - 0.12, cz + szz * hw, [1, 1, 1], [A[0], wW(cx + sx * hw), sgn, f], [h, 1, 1, flex * f * f])]);
    }
    for (let i = 0; i < 5; i++) { g.quad(rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]); g.quad(rows[i][1], rows[i][2], rows[i + 1][2], rows[i + 1][1]); }
  };
  for (const sgn of [-1, 1]) {
    const Sh = new V3(sgn * 8, 3, 8), Wr = new V3(sgn * WRIST_X, 3.5, 13), Tp = new V3(sgn * 58, 3.5, 8), R = new V3();
    for (let i = 0; i < 13; i++) { const f = i / 12; R.lerpVectors(Sh, Wr, f); feather(R, lerp(-5, 8, f) * DEG, sgn, lerp(24, 28.5, f) * rng.range(0.97, 1.03), 5.6, -0.3 - i * 0.05, [1], 1); }
    for (let j = 0; j < 11; j++) { const f = j / 10; R.lerpVectors(Wr, Tp, f); feather(R, lerp(12, 84, Math.pow(f, 0.9)) * DEG, sgn, (30 + 7 * Math.sin(f * 2.6) - 3 * f) * rng.range(0.97, 1.03), 4.8 - 0.9 * f, -1.0 - j * 0.05, [1], 1.6); }
    // underwing coverts and the thick leading edge: a sheet from the arm line back over the feather roots
    const NC = 16, rowsZ = [[2.2, 2.4], [3.6, 0.9], [2.4, -0.9], [-4, -1.5], [-9.5, -1.6], [-13.5, -1.45]], cg = [];
    for (let r = 0; r < rowsZ.length; r++) {
      const row = [];
      for (let c = 0; c <= NC; c++) {
        const f = c / NC, arm = f < 0.7 ? R.lerpVectors(Sh, Wr, f / 0.7) : R.lerpVectors(Wr, Tp, (f - 0.7) / 0.3);
        const chord = 1 - 0.55 * sstep(0.7, 1, f), x = arm.x + sgn * (r > 2 ? 1.5 * sstep(0.7, 1, f) * (r - 2) : 0);
        const z = arm.z + rowsZ[r][0] * chord + (r === rowsZ.length - 1 ? (c % 2) * 1.3 : 0);
        row.push(g.v(x, arm.y + rowsZ[r][1] * (0.6 + 0.4 * chord), z, [1, 1, 1], [1, sstep(WRIST_X - 5, WRIST_X + 5, Math.abs(x)), sgn, r / (rowsZ.length - 1)], [rng(), f, 2, 0]));
      }
      cg.push(row);
    }
    g.loft(cg, false);
    // trailing leg with a clenched foot
    const leg = [];
    for (let j = 0; j <= 5; j++) {
      const f = j / 5, ring = [], cy = lerp(-7, -11.5, f), cz = lerp(-5, -22, f), r = j === 5 ? 0.4 : lerp(2.4, 1.5, f) + (j === 4 ? 1.1 : 0);
      for (let k = 0; k < 8; k++) { const an = k / 8 * TAU; ring.push(g.v(sgn * 4.2 + Math.cos(an) * r, cy + Math.sin(an) * r, cz + (j === 5 ? 1.2 : 0), j >= 4 ? [0.05, 0.05, 0.055] : [0.4, 0.39, 0.37], [0, 0, 0, 0], [0.5, 0, 3, 0])); }
      leg.push(ring);
    }
    g.loft(leg, true);
  }
  for (let i = 0; i < 12; i++) { const f = i / 11; feather(new V3(lerp(-3.4, 3.4, f), 1.5, -17), lerp(-54, 54, f) * DEG, 1, 26 - 4 * Math.abs(f - 0.5), 5.6, -Math.abs(i - 5.5) * 0.06, [0], 0.3); }
  const mesh = new THREE.Mesh(g.build(), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, uFlap: { value: 0 }, uCamO: { value: new V3() }, uSunO: { value: new V3(0, 1, 0) }, uUpO: { value: new V3(0, 1, 0) }, uSnowCol: { value: new THREE.Color(0.75, 0.83, 0.95) }, uFade: { value: 0 }, uBarN: { value: rng.range(5.5, 7.5) } },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 a; attribute vec4 b; attribute vec3 color;
uniform float uFlap;
varying vec3 vL; varying vec3 vR; varying vec3 vN; varying vec3 vC; varying vec4 vA; varying vec4 vB;
${FOG_VP}
void rz(inout vec3 p, inout vec3 n, vec2 piv, float an){ float c = cos(an), s = sin(an); vec2 d = p.xy - piv;
  p.xy = piv + vec2(d.x*c - d.y*s, d.x*s + d.y*c); n.xy = vec2(n.x*c - n.y*s, n.x*s + n.y*c); }
void main(){
  vec3 p = position, n = normal; float sg = a.z;
  float a1 = (0.08 + 0.36*sin(uFlap))*a.x, a2 = (0.05 + 0.28*sin(uFlap - 1.0))*a.y;
  p.y -= cos(uFlap)*b.w*2.6*a.x;                                      // feather tips lag the stroke
  rz(p, n, vec2(sg*${WRIST_X.toFixed(1)}, 3.5), sg*a2);
  rz(p, n, vec2(sg*8., 3.), sg*a1);
  p.y -= 1.7*sin(uFlap)*(1. - a.x);                                   // the body rides against the wings
  vR = position; vL = p; vN = n; vC = color; vA = a; vB = b;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${FOG_V}
}`,
    fragmentShader: /* glsl */`
uniform vec3 uCamO, uSunO, uUpO, uSnowCol; uniform float uFade, uBarN;
varying vec3 vL; varying vec3 vR; varying vec3 vN; varying vec3 vC; varying vec4 vA; varying vec4 vB;
${FOG_FP}
${GLSL_N}
${GLSL_F}
void main(){
  vec3 V = normalize(uCamO - vL);
  vec3 N = normalize(vN); if (dot(N, V) < 0.) N = -N;
  float pat = vB.z, v = vA.w;
  vec3 pale = vec3(0.64, 0.62, 0.57), dark = vec3(0.17, 0.16, 0.15), alb;
  if (pat < 0.5) {            // body: long dark streaks on pale grey
    float s = vn2(vec2(vR.x*1.3 + vn2(vR.xz*0.2)*2., vR.z*0.17));
    alb = vC*mix(0.5, 1.12, smoothstep(0.35, 0.65, s));
  } else if (pat < 1.5) {     // flight feathers: bars, dark tip, shaded edges
    float bars = smoothstep(0.3, 0.7, 0.5 + 0.5*sin(v*uBarN*6.2832 + vB.x*0.3));
    alb = mix(dark, pale, bars);
    alb = mix(alb, dark*0.8, smoothstep(0.86, 1., v));
    alb *= 1. - 0.4*smoothstep(0.55, 1., abs(vB.y));
  } else if (pat < 2.5) {     // coverts: mottled rows
    float m = vn2(vR.xz*0.55 + 3.), rw = 0.5 + 0.5*sin(v*15.7 + vn2(vR.xz*0.3)*3.);
    alb = mix(pale*0.95, dark*1.3, smoothstep(0.42, 0.72, m)*0.8)*(0.8 + 0.25*rw);
  } else alb = vC;
  float under = 0.5 - 0.5*dot(N, uUpO);
  vec3 L = uSnowCol*(0.2 + 0.8*under) + uSkyCol*0.45*(1. - under) + uSunCol*max(dot(N, uSunO), 0.)*1.2;
  // by night the snow below still throws enough light up for the bars of the underwing to be read
  L = max(L, vec3(0.40, 0.45, 0.54)*(0.3 + 0.7*under));
  vec3 col = alb*L;
  float fr = 1. - max(dot(N, V), 0.); fr *= fr*fr;
  col += uSkyCol*0.25*fr;
  col = mix(col, uSnowCol*0.9, uFade);
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`,
  }));
  mesh.frustumCulled = false; mesh.name = 'strike-owl';
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------
// the hero
// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  // every builder of the strike and its choreography draws from a stream of its own, made from the world's seed and its name
  const stream = (name) => (ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('snow-roof-strike-' + name + ':' + ctx.seed)) : ctx.rng.fork ? ctx.rng.fork(name) : ctx.rng);
  const noise = ctx.noise;
  const detail = (ctx.quality && ctx.quality.detail) || 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cShadow, cCobalt, cTurq, , , , cDay] = pal;
  const inViewer = !!opts.viewer;
  const hour = opts.hour || 'noon', weather = opts.weather || 'clear', exitSide = opts.exitSide === 1 ? 1 : -1;
  const K = { bulge: 0.79, burst: 0.83, wrench: 0.875, ...(opts.keys || {}) };
  const SPU = opts.secondsPerU ?? 53, G = opts.gravity ?? 32;
  const T_BULGE = (K.bulge - K.burst) * SPU, TW = (K.wrench - K.burst) * SPU, THIT = 0.42;

  // ---- light for the hour and the weather (no warm light in any of them)
  const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  let dayCol = cDay.clone(), skyCol = C('#2B6FD6').lerp(C('#ffffff'), 0.22).multiplyScalar(1.25), sunCol = cDay.clone().multiplyScalar(1.7), glow = 2.4, green = 0;
  let snowCol = new THREE.Color(0.75, 0.83, 0.95);
  if (hour === 'twilight') { dayCol = C('#FFD9C6'); skyCol = C('#D7A9A6').lerp(C('#6E78C8'), 0.45).multiplyScalar(0.85); sunCol = C('#FFD2BC', 0.9); glow = 1.7; snowCol = C('#B9A9C9', 0.8); }
  if (hour === 'night') { dayCol = C('#DCE6FF', 0.62); skyCol = C('#0E2148').lerp(C('#3FD98A'), 0.18).multiplyScalar(0.9); sunCol = C('#DCE6FF', 0.75); glow = 0.75; green = 0.35; snowCol = C('#5E7FB5', 0.6); }
  if (weather === 'blizzard') { skyCol.lerp(C('#C9D3DE'), 0.75); sunCol.multiplyScalar(0.35); glow *= 0.8; snowCol.lerp(C('#C9D3DE'), 0.6); }
  if (weather === 'thaw') { glow *= 1.35; green = Math.max(green, 0.6); }
  if (opts.roofGlow !== undefined) glow = opts.roofGlow;
  const sunL = new V3().fromArray(opts.sunDir || [-0.96, 0.225, 0.169]).normalize(), dayGain = hour === 'night' ? 1.4 : 1;
  const U = {
    uCamL: { value: new V3(0, 3, 60) }, uDayCol: { value: dayCol }, uAmb: { value: cCobalt.clone().lerp(cTurq, 0.45).multiplyScalar(0.42 * Math.min(1, glow / 2.2 + 0.25)) },
    uShadowCol: { value: cShadow.clone().multiplyScalar(0.5) }, uSunL: { value: sunL }, uSunCol: { value: sunCol }, uSkyCol: { value: skyCol },
    uTurq: { value: cTurq.clone() }, uCobalt: { value: cCobalt.clone() }, uDay: { value: 0 }, uTime: { value: 0 }, uT: { value: -10 },
  };

  const group = new THREE.Group(); group.name = 'under-the-snow-roof-hero';
  const pause = () => ctx.yield?.();
  await pause();
  const roof = await buildRoof(U, stream('roof').range(0, 40), pause); roof.material.uniforms.uGlow.value = glow; roof.material.uniforms.uGreen.value = green; roof.material.uniforms.uDomeK.value = hour === 'night' ? 1.5 : 1;
  await ctx.yield?.();
  const shaft = await buildShaft(U, noise, stream('shaft'), pause);
  await ctx.yield?.();
  const striker = await buildStriker(U, stream('striker'), pause);
  await ctx.yield?.();
  const { blocks, mound, lands } = buildBlocks(U, stream('blocks'), stream('near-blocks'), noise, G, TW, detail, striker.hubs);
  await ctx.yield?.();
  const { puffs, glit } = buildDust(U, stream('dust'), G, TW, THIT, detail, weather === 'blizzard', lands);
  await ctx.yield?.();
  const feathers = buildFeathers(U, stream('feathers'), TW);
  await ctx.yield?.();
  const owl = buildOwl(U, stream('owl')); owl.material.uniforms.uSnowCol.value = snowCol; owl.scale.setScalar(0.9);
  await ctx.yield?.();
  const { cone, pool } = buildDaylight(U);
  await ctx.yield?.();
  const lip = buildLip(U, roof.material.uniforms);
  await ctx.yield?.();
  const sedge = buildSedge(U, stream('sedge'), striker.hubs, striker.mesh.material.uniforms.uFoot);
  group.add(roof, lip, shaft, striker.mesh, sedge, mound, blocks, pool, cone, puffs, glit, feathers, owl);

  // ---- the camera's line (an anchor), with the portal's seat at its end
  const fly = [new V3(0, EYE_Y, 92), new V3(0, EYE_Y, 60), new V3(0, EYE_Y, 30), new V3(0, EYE_Y, 6.24)];
  for (const d of [22, 44, 65]) fly.push(new V3(0, EYE_Y + 12 - 12 * Math.cos(d * DEG), 6.24 - 12 * Math.sin(d * DEG)));
  const arcEnd = fly[fly.length - 1].clone();
  for (const s of [15, 30, 45, 60]) fly.push(arcEnd.clone().addScaledVector(AX, s));
  // ---- per-seed choreography
  const chor = stream('choreography'), regrip = chor.int(0, 1), tRegrip = chor.range(1.1, 1.45), exitAng = chor.range(-0.08, 0.08);
  // the owl's way out: up the frame and to its left as the climbing camera sees it (dirL), square to the shaft's axis (dirP)
  const dirL = new V3(exitSide * 0.45, 0.17, 0.88).applyAxisAngle(new V3(0, 1, 0), exitAng * exitSide).normalize();
  const dirP = dirL.clone().addScaledVector(AX, -dirL.dot(AX)).normalize(), headL = new V3(dirL.x, 0.22, dirL.z).normalize();
  let climbU = 0.92;
  const state = { t: -10, bulge: 0, hole: 0, day: 0, clench: 0, legs: false, owl: false };
  // Is the owl out, and where? A pure question of the strike's own seconds (sT): it reads only, and writes nothing but the bird's
  // place into `out`, the asker's own vector, when one is given. The bird is out from 1.2 s after the wrench. apply() asks it for
  // the bird it moves; a look of the world asks it for its aim (owlAt below)
  const owlOutAt = (sT, out) => {
    const to = sT - (TW + 1.2); if (!(to > 0)) return false;
    if (out) out.copy(AX).multiplyScalar(120 + 85 * (1 - Math.exp(-to / 1.6))).addScaledVector(dirP, 33 + 5 * to + 0.75 * to * to * to);
    return true;
  };
  // The owl's shadow on the snow over the gallery, before it strikes: where it lies at the strike's own seconds (sT), the same clock
  // the bulge and the burst run on. A pure question: it reads only, and writes nothing but the answer into `o`, the asker's own
  // object. The bird hunts by ear what runs under the snow, down the gallery toward the place it will strike, and comes over it
  // twice. Its ground is its own: 14.07 m a second down the gallery (RUN_V), 64.5 m short of the roof hole at the burst (RUN_D),
  // and the shadow's middle is so many metres further down the gallery than that (lead). First, high: a small shadow with a soft
  // edge, small enough to lie whole on the crown of the narrow roof there, comes over from behind, draws ahead, tilting from wing
  // to wing as it glides, and slides off to the side. Then, low: a broader shadow comes over from behind, its wings beating, hangs
  // for a second and a quarter over the place where the gallery's roof grows broad (88 to 85 m up from the hole: HOVER_D), its
  // edge growing crisper as the bird comes down, and darts on down the gallery to the place it will strike, going out on the way
  // as the bird comes down onto the snow and the roof begins to sag. It is gone 7 m short of the hero's own roof disc. Both lie
  // 2.4 times as long down the gallery as the bird is broad for its span (SH_LONG), the last twice: seen from under the roof,
  // looking along it, the bird then has its own shape. Last, as it goes through: the bird is on the snow over the hole and holds its wings spread over it; their
  // shade lies on the roof just up the gallery from the hole (its middle 21 m from the hole's: MANTLE_D), the whole bird's shape
  // across the gallery, head toward the hole, the wings opening as it lands and heaving, from a half second before the burst
  // until the bird has heaved itself out after the wrench, when it tips toward the side it leaves by. o.dark is 0.5 where the
  // shade is whole (less as it comes and goes): the snow under it then has the lesser of its own light and one even tone, 0.484
  // of the light of middling snow where the snow is of that light, and never more than its own (owlShaded, above).
  //   o.d     metres up the gallery from the middle of the roof hole to the shadow's middle
  //   o.side  metres to the right of the gallery's line (as one goes down it)
  //   o.turn  how far the bird is turned from the way down the gallery (radians)      o.long  how long it lies (1: as the bird is)
  //   o.half  half its span (m)      o.soft  the width of its soft edge (m)      o.dark  how dark it is, 0..1
  //   o.lift  how far the wings are off the level at this moment of the beat, 0..1    o.tilt  how far the bird is tilted, -1..1
  const RUN_D = 64.5, RUN_V = 14.07, SH_LONG = 2.4, HOVER_D = 88, MANTLE_D = 21, SH1 = { t0: -5.95, t1: -4.6, half: 2, soft: 0.28, dark: 0.5 }, SH2 = { t0: -4.5, t1: T_BULGE + 0.17, half: 5.4, soft: 0.4, dark: 0.5 };
  const owlShadowAt = (sT, o) => {
    let q = (sT - SH1.t0) / (SH1.t1 - SH1.t0);
    o.turn = 0; o.long = SH_LONG; o.side = 0; o.lift = 0; o.tilt = 0;
    if (q > 0 && q < 1) {
      o.d = RUN_D - RUN_V * sT - (-12 + 27 * sstep(0, 0.3, q) + 4 * sstep(0.3, 0.75, q) + 9 * sstep(0.75, 1, q)); o.side = 9 * sstep(0.6, 1, q); o.half = SH1.half; o.soft = SH1.soft; o.dark = SH1.dark * sstep(0, 0.12, q) * (1 - sstep(0.7, 1, q));
      o.tilt = 0.8 * Math.sin(sT * 2.6); o.lift = 0.3 * (0.5 - 0.5 * Math.cos(sT * 5.2));
      return true;
    }
    q = (sT - SH2.t0) / (SH2.t1 - SH2.t0);
    if (q > 0 && q < 1) {
      o.d = lerp(lerp(RUN_D - RUN_V * SH2.t0 + 14, HOVER_D, sstep(SH2.t0, SH2.t0 + 0.6, sT)) - 3 * sstep(SH2.t0 + 0.6, SH2.t0 + 1.85, sT), PLUG_R + 7, sstep(SH2.t0 + 1.85, SH2.t1, sT)); o.half = SH2.half; o.soft = lerp(SH2.soft, 0.12, sstep(0.1, 0.6, q)); o.dark = SH2.dark * sstep(0, 0.2, q) * (1 - sstep(0.84, 1, q));
      o.lift = 0.5 - 0.5 * Math.cos(sT * 10.5); o.tilt = 0.3 * Math.sin(sT * 2.3);
      return true;
    }
    if (sT > -0.5 && sT < TW + 0.9) {
      o.d = MANTLE_D; o.long = 2; o.half = lerp(4.4, 5.6, sstep(-0.5, 0.5, sT)); o.soft = 0.2; o.dark = 0.5 * sstep(-0.5, 0.1, sT) * (1 - sstep(TW - 0.1, TW + 0.9, sT));
      o.lift = 0.35 * (0.5 + 0.5 * Math.sin(sT * 6.5)); o.tilt = 0.3 * exitSide * sstep(TW - 0.6, TW + 0.4, sT);
      return true;
    }
    o.dark = 0; return false;
  };
  const owlPos = owl.position, tA = new V3(), tB = new V3(), tC = new V3(), tQ = new THREE.Quaternion(), m4 = new THREE.Matrix4(), v2 = new THREE.Vector2(), UP = new V3(0, 1, 0);

  const apply = (sT, time) => {
    U.uT.value = sT; U.uTime.value = time; state.t = sT;
    const pre = sT < 0, ru = roof.material.uniforms;
    state.bulge = pre ? lerp(0.8 * sstep(T_BULGE, T_BULGE * 0.45, sT), 1, sstep(T_BULGE * 0.15, 0, sT)) : 1 - 0.8 * sstep(0, 0.7, sT);          // once it is through, the roof round the hole springs back: the lip stands high, and the legs show whole under it
    ru.uBulge.value = state.bulge;
    ru.uCrack.value = pre ? 0.72 * sstep(T_BULGE * 0.85, 0, sT) : 0.72 + 0.28 * sstep(0, 0.5, sT);
    ru.uCrGrow.value = sstep(T_BULGE * 0.9, T_BULGE * 0.4, sT);                    // the long fractures race down the gallery roof in the first half of the bulge
    ru.uDim.value = 0.07 * sstep(T_BULGE, T_BULGE * 0.45, sT) * (1 - sstep(0, 0.5, sT));
    state.hole = sstep(0, 0.26, sT); ru.uHole.value = state.hole;
    if (hour === 'night') ru.uGreen.value = green * (0.6 + 0.4 * Math.sin(time * 0.45));
    state.day = sstep(0, 0.3, sT) * (1 - 0.3 * sstep(0.3, 0.9, sT)) + 0.25 * sstep(TW + 0.2, TW + 1.6, sT);
    U.uDay.value = state.day * dayGain;
    // legs: plunge, hit, hold, wrench out
    let legS = 0;
    if (sT < THIT) { const x = clamp(sT / THIT, 0, 1); legS = 62 * (1 - x) * (1 + 0.6 * (1 - x)) / 1.6; }
    else if (sT > TW) { const q = sT - TW; legS = 0.5 * 95 * q * q; }
    state.legs = sT >= 0 && legS < 125;
    const su = striker.mesh.material.uniforms, tau = sT - THIT;
    let drop = tau > 0 ? 3.0 * Math.exp(-3.5 * tau) * Math.sin(7 * tau) + 0.9 * (1 - Math.exp(-2 * tau)) : 0;
    drop += 1.3 * sstep(TW - 0.45, TW - 0.02, sT); drop *= 1 - sstep(TW, TW + 0.3, sT);
    su.uLegS.value = legS; su.uDrop.value = drop;
    const c = lerp(-0.4, 0.36, sstep(THIT - 0.03, THIT + 0.3, sT)), rg = bellf(sT, tRegrip, tRegrip + 0.62), arch = 1.5 * sstep(THIT, THIT + 0.3, sT);          // the toes lie spread and nearly flat, the talons hooked down into the floor
    for (let i = 0; i < 2; i++) su.uFoot.value[i].set(c - (i === regrip ? 0.8 * rg : 0.1 * rg), arch + (i === regrip ? 1.1 * rg : 0));
    state.clench = c;
    su.uShake.value = 0.12 + (tau > 0 ? Math.exp(-tau * 3) : 1) + (sT > TW - 0.1 ? Math.exp(-Math.max(sT - TW, 0) * 1.5) : 0);
    mound.material.uniforms.uGrow.value = 0.5 * sstep(0.1, 1.5, sT) + 0.22 * sstep(1.5, TW, sT) + 0.28 * sstep(TW, TW + 2.5, sT);
    puffs.material.uniforms.uHole.value = state.hole;
    glit.material.uniforms.uSift.value = sstep(T_BULGE - 5, T_BULGE + 1, sT);
    // the owl rowing away, seen from below: one continuous flight in strike seconds. It starts 1.2 s after the wrench, low over the
    // crater, its wings right across the shaft's mouth and its body a little to the upper left of the axis; it climbs in the first
    // two seconds and slides away along dirP, slowly at first and then faster, nose leading and wings square to its way: its body
    // stays beside the portal's ring as the ring grows in the climbing camera's view, and it leaves by the upper left
    const to = sT - (TW + 1.2);
    state.owl = owlOutAt(sT, owlPos);
    if (state.owl) {
      const k = 0.72 + 0.28 * sstep(0, 2.2, to);
      tA.copy(AX).lerp(headL, k).normalize();
      tB.crossVectors(UP, tA).normalize(); tC.crossVectors(tA, tB);
      owl.quaternion.setFromRotationMatrix(m4.makeBasis(tB, tC, tA));
      owl.quaternion.multiply(tQ.setFromAxisAngle(tA.set(0, 0, 1), exitSide * -0.15 * k + 0.06 * Math.sin(time * 1.3)));
      const ou = owl.material.uniforms;
      ou.uFlap.value = time * TAU * 1.6;
      tQ.copy(owl.quaternion).invert();
      ou.uSunO.value.copy(sunL).applyQuaternion(tQ); ou.uUpO.value.copy(UP).applyQuaternion(tQ);
      ou.uFade.value = weather === 'blizzard' ? sstep(1.5, 4, to) : 0;
    }
    roof.visible = true; lip.visible = state.hole > 0.02; shaft.visible = !pre; striker.mesh.visible = state.legs; blocks.visible = !pre; mound.visible = sT > 0.1;
    { const c = U.uCamL.value, d = c.dot(AX); tA.copy(c).addScaledVector(AX, -d); cone.material.uniforms.uConeK.value = sstep(11.5, 20, tA.length()); }   // the column is a thing seen from outside: it fades as the camera enters it
    cone.visible = pool.visible = state.day > 0.002; puffs.visible = !pre; feathers.visible = sT > TW; owl.visible = state.owl;
  };

  let progU = null;
  const update = (dt, time, camera) => {
    let sT = progU === null ? ((time - 8.3) % 15 + 15) % 15 - 2.6 : (progU - K.burst) * SPU;
    group.updateWorldMatrix(true, false);
    if (camera) {
      camera.getWorldPosition(U.uCamL.value); group.worldToLocal(U.uCamL.value);
      const px = ctx.renderer ? ctx.renderer.getDrawingBufferSize(v2).y * 0.5 * camera.projectionMatrix.elements[5] : 400;
      puffs.material.uniforms.uPx.value = px; glit.material.uniforms.uPx.value = px;
    }
    apply(sT, time);
    if (state.owl) { owl.updateWorldMatrix(false, false); owl.material.uniforms.uCamO.value.copy(U.uCamL.value).applyMatrix4(group.matrixWorld); owl.worldToLocal(owl.material.uniforms.uCamO.value); }
  };
  apply(-10, 0);

  // ---- anchors
  const anchors = {
    strikePoint: new V3(0, 0, 0),
    shaftAxis: { origin: new V3(0, 0, 0), direction: AX.clone(), radius: SHAFT_R, footY: ROOF_Y, surfaceY: SURF_Y },
    roofHole: { center: new V3(0, ROOF_Y, HOLE_Z), radiusX: 14.5, radiusZ: 16, discRadius: PLUG_R, y: ROOF_Y },
    flyThrough: fly,
    portalSeat: { position: fly[fly.length - 1].clone(), facing: AX.clone().multiplyScalar(-1), up: new V3(0, COS_P, SIN_P), radius: 7 },
    lookAt: new V3(0, 6.2, -1.0),
    closestPass: new V3(0, EYE_Y, 27),
    owl: owlPos,
    daylight: { origin: new V3(0, 0, 0), axis: AX.clone(), radius: 10 },
    feet: striker.hubs.map((h) => h.clone()),
    sunDir: sunL.clone(), gallery: { width: 20, height: ROOF_Y }, timeline: { ...K, secondsPerU: SPU },
  };

  return {
    object: group,
    radius: inViewer ? 20 : 40, height: inViewer ? 7 : 64, center: inViewer ? new V3(0, 4, -2) : new V3(0, 12, -3),
    anchors, state, update,
    setProgress(u) { progU = u; },
    // is the owl out at the world's progress u, and where (into out): pure, it changes nothing of the hero
    owlAt(u, out) { return owlOutAt((u - K.burst) * SPU, out); },
    // is the owl's shadow on the snow over the gallery at the world's progress u, and where (into o: d, side, turn, long, half, soft,
    // dark): pure
    owlShadowAt(u, o) { return owlShadowAt((u - K.burst) * SPU, o); },
    setClimb(u0) { climbU = clamp(u0, 0.5, 0.99); },
    // route: the camera's route through the world this hero stands in (length, posAtDist); see clearSedge above. Returns a promise
    clearSedge(route) { return clearSedge(sedge, route, pause); },
    dispose() {},
    ground: true, groundY: 0,
  };
}
