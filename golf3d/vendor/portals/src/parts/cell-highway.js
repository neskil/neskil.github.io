// Hero set piece for "cell-highway" (The Inner Highway): THE WALKER AND THE MOON.
//
// What it is
//   A watercolour nucleus 520 m across (lilac wash, darker nucleolus stain) whose whole face is a
//   regular field of ~420 eight-petalled pore rings (real instanced geometry, dark teal well with a
//   pencil-spoke basket), its lower half wrapped in folded sea-green reticulum ribbons beaded with
//   running peach ribosomes, pencil messenger threads unspooling from several pores, plus the last
//   ~450 m of banded microtubule (the "branch") that leads to it and, walking on that tube, the
//   vermilion two-footed motor towing a translucent cargo bubble on a twisted tether.
//   One pore, 40 degrees below the equator on the front (+Z) meridian, has no well: the nucleus is
//   cut open there and that ring is the exit portal's seat.
//
// Frame / size
//   Origin = bottom of the nucleus, +Y up, front = +Z. Nucleus centre (0,260,0), R = 260.
//   The tube arrives from +Z (z = 480, y ~ 18), climbs gently to the release point, then bends
//   left and down past the nucleus. radius 300 (tube reaches z = 480), height 520.
//
// opts
//   palette        7 hex strings [paper, seaGreen, lilac, peach, teal, pencil, vermilion]
//   portalStandIn  true: paint a bright disc in the open pore (hide it once the real portal sits there:
//                  hero.portalStandIn.visible = false)
//   vehicle        true: build the walker + tether + bubble (hero.vehicle.object.visible = false to hide)
//   bubble         true: include the cargo bubble (the world may prefer its own round the lens)
//   cargoColors    five THREE.Colors for the cargo dots inside the bubble (default peach, lilac, green)
//
// anchors (hero-local space)
//   portalSeat   { position, normal, radius: 7, pitchDeg: 40 }  centre of the open pore; the portal's
//                front faces `normal` (outward, 40 deg below level); fly in along -normal.
//   release      point 60 m out from the pore along `normal`: where the walker lets go.
//   flyThrough   ordered points: 7.5 m above the tube centreline from its far end to `release`, then
//                straight (60 m, 40 deg up) into the pore. >= 6 m clear of everything but our own tube.
//   tube         { curve, length, radius: 2.5, releaseS, bandLength: 4.8 }  centreline + arc lengths.
//   viewpoints   { reveal, lowFront, side }  good camera spots for the "moon" frame.
//   lensOffset   where the lens sits relative to the walker: 7 m behind it, 7.5 m above the centreline.
//
// Hooks
//   hero.setProgress(u)   0..1: the portal pore's eight petals open (u = 1 fully open). World-driven.
//   hero.setWalker(s, o)  put the walker at arc length s (metres) along anchors.tube; the gait (4.8 m a
//                         step, feet docking on band centres 9.6 m apart, wet footprints on the tube)
//                         is a pure function of s, so drive s from path distance. o.tether 0..1 (1 =
//                         towing, 0 = coiled away), o.bubble = Vector3 to place the bubble yourself,
//                         o.walker = size of the walker (1 = 3 m tall), o.bubbleBasis = Matrix4 rotation that
//                         turns the cargo dots' +Z (the bubble's front) to face where the lens looks.
//                         Until it is called the walker strolls on its own from `time` (viewer only).
//   hero.vehicle          { object, bubble, walker } meshes.
//
// Cost: ~119k triangles, 9 draw calls, no lights, no textures. Build ~250 ms.
//
// Lighting / style: UNLIT watercolour. Every material is a ShaderMaterial that paints three washes
//   from a nominal light high on the left (uLight, hero-local), a cool teal glaze in shadow, a paper
//   crescent as highlight, pigment pooled at silhouette edges with a broken pencil line that re-seeds
//   four times a second, and object-anchored granulation. Scene lights are ignored; scene fog is
//   honoured (set fog colour = paper so distance = dilution). Bloom should be off / threshold high:
//   only the portal stand-in exceeds 1.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const WC = { get NOISE() { return NOISE; }, get VERT_PARS() { return VERT_PARS; }, get VERT_END() { return VERT_END; }, get FRAG_PARS() { return FRAG_PARS; }, get FRAG_END() { return FRAG_END; }, wcMaterial: (...a) => wcMaterial(...a) };
const DEFAULT_PALETTE = ['#F4ECDC', '#7FBFA8', '#B9A3D9', '#F4B899', '#2F6F73', '#4A4A52', '#E2432A'];
const R = 260, PORE_LAT = (40 * Math.PI) / 180;

// ---------------------------------------------------------------- shared GLSL
const NOISE = /* glsl */`
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+17.1; a*=.5; } return s; }
`;
// after the wash: distance dilutes every colour toward whatever part of the sheet lies behind it (backdrop), then the
// sheet itself: screen-fixed tooth, pigment settling in its valleys, dry-brush sparkle, a ragged unpainted frame.
const FRAG_END = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    if (uFogD > 0.) fogF = 1. - exp(-pow(max(vFogDepth, 0.)/uFogD, 1.5));
    vec3 fogTo = fogColor;
    if (uBgK > .001) fogTo = mix(fogColor, backdrop(normalize((vec4(vVP, 0.)*viewMatrix).xyz + vec3(0., 1e-6, 0.))), uBgK);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogTo, fogF);
  #endif
  gl_FragColor.rgb = paperize(gl_FragColor.rgb);
`;
const PAPER = /* glsl */`
uniform vec3 uBgA, uBgB, uBgMoon; uniform float uBgK, uFogD, uFrame, uPoolK, uBgDeep;
vec3 backdrop(vec3 d){
  float w1 = vn(d*2.3 + vec3(0., uTime*.008, 3.)), w2 = vn(d*6.1 + 11.);
  float low = smoothstep(.30 + (w1 - .5)*.36, -.40, d.y);
  float pool = smoothstep(-.18, -.85, d.y + (w2 - .5)*.16);                 // the wash pools darker toward the bottom of the sheet
  float dens = low*(.60 + .34*w2) + .62*pool + .12*(1. - smoothstep(0., .05, abs(low - .12)));
  // THE GROUND IS LAID DEEPER (uBgDeep: the day, dawn and golden sheets; 0 leaves the sheet as it was, and the night sheet is
  // left so). The lower wash no longer thins away to nothing at the level line: it stops at a clear edge, where its pigment
  // has pooled, and has its body from there down; over it, past a sliver of bare paper, the second wash (uBgB) is laid
  // across the upper sheet, with lights left in it.
  float eg = .24 + (w1 - .5)*.36 + (vn(d*.9 + vec3(31., 0., 4.)) - .5)*.62, under = eg - d.y;   // the edge wanders up and down the sheet: a wash's edge, not a level line
  float densD = smoothstep(0., .03, under)*mix(.36, .74, smoothstep(0., .42, under))*(.86 + .28*w2) + .62*pool + .20*(1. - smoothstep(0., .035, abs(under - .022)));
  dens = mix(dens, densD, uBgDeep);
  vec3 c = mix(uPaper, uBgA, clamp(dens, 0., .88));
  c = mix(c, c*mix(vec3(1.), uGlaze*2.1, .5), .5*pool*uPoolK);
  float w3 = vn(d*1.6 + vec3(5., 0., uTime*.006)), over = -under - .05;
  float upD = smoothstep(0., .03, over)*(.40 + .26*w2)*(1. - .80*smoothstep(.52, .70, w3)) + .16*(1. - smoothstep(0., .03, abs(over - .02)));
  c = mix(c, uBgB, clamp(upD, 0., .8)*uBgDeep);
  float lb = smoothstep(.72, .97, dot(d, uBgMoon) + (w1 - .5)*.12);
  return mix(c, uBgB, lb*.8);
}
vec3 paperize(vec3 c){
  vec2 fc = gl_FragCoord.xy * uPx;
  float g = vn(vec3(fc*.55, 1.3))*.6 + vn(vec3(fc*.21, 7.7))*.4, g2 = vn(vec3(fc.x*.05, fc.y*.9, 3.1));
  vec3 dc = c - uPaper; float amt = clamp(length(dc)*3., 0., 1.);
  // A FULL DARK WASH FLOODS THE TOOTH: where the paint is laid much darker than the paper (never on the night sheet, whose
  // paint is lighter than its paper) the sheet's tooth shows finer and quieter through it, and the dry brush leaves no
  // sparkle: the grain of a thin wash on a rough sheet is not the grain of a full one
  float full = smoothstep(.22, .50, dot(uPaper - c, vec3(.3, .5, .2)));
  float gt = mix(g, vn(vec3(fc*.55, 1.3))*.6 + .2, full);
  c = uPaper + dc*(1. + (.55 - .25*uWet)*(1. - .55*full)*(gt - .5));
  c = mix(c, uPaper, (1. - uWet)*.5*amt*(1. - .85*full)*smoothstep(.60, .74, g*.7 + g2*.3));
  c *= 1. - .07*(g - .5) - .03*(g2 - .5);
  vec2 nd = vClip.xy / max(abs(vClip.z), 1e-4), q = abs(nd);
  float br = vn(vec3(nd.x*2.5, nd.y*10., 2.))*.55 + vn(vec3(nd*4., 9.))*.3 + vn(vec3(nd.x*3., nd.y*33., 4.))*.15;
  float fr = smoothstep(.955, 1.0, max(q.x + (br - .5)*.075, q.y + (vn(vec3(nd.x*4., nd.y*2., 5.)) - .5)*.05));
  // one more wet wash laid over the lower corners of the sheet, pooling darker toward them (fixed to the sheet, like its tooth)
  float pw = vn(vec3(nd*1.7, 6.))*.7 + vn(vec3(nd*5.3, 2.))*.3;
  float pl = -nd.y*.62 + q.x*.60 - .30 + (pw - .5)*.34, pk = smoothstep(.10, .95, pl) + .22*(1. - smoothstep(0., .035, abs(pl - .13)));
  c *= mix(vec3(1.), mix(vec3(1.), uBgA, .62)*(1. - .05*(g - .5)), min(pk, 1.)*.62*uPoolK);
  return max(mix(c, uPaper*(1. - .07*(g - .5)), fr*uFrame), vec3(0.));
}
`;
const VERT_PARS = /* glsl */`
varying vec3 vOP; varying vec3 vN; varying vec3 vVN; varying vec3 vVP; varying vec3 vClip;
uniform float uTime;
#include <fog_pars_vertex>
`;
// expects: vec3 p (hero-local position), vec3 n (hero-local normal)
const VERT_END = /* glsl */`
  vOP = p; vN = n; vVN = normalMatrix * n;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); vVP = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition; vClip = gl_Position.xyw;
  #include <fog_vertex>
`;
const FRAG_PARS = /* glsl */`
uniform vec3 uPaper, uGlaze, uPencil, uLight, uHi; uniform float uTime, uWet, uPx, uGouK, uBody;
varying vec3 vOP; varying vec3 vN; varying vec3 vVN; varying vec3 vVP; varying vec3 vClip;
#include <fog_pars_fragment>
${NOISE}
float edgeOf(vec3 vn_){ return 1. - abs(dot(normalize(vn_), normalize(-vVP + vec3(0.,0.,1e-5)))); }
// THE PAINT HAS BODY. One more charge of the same paint darkens every channel by the same share (.6 a layer: the -.737
// is its log2), so a pigment deepens in its own hue by even steps whatever it is: sea-green to viridian, lilac to
// violet. A pigment that is dark already (the tubes, the wells: strongest channel under .59) has that much less charge
// to take, so none runs to black. A warm pigment takes .4 of the charge, keeps more of its red (.75 a layer) and loses
// more of the two others (.48): charged as the cool ones are, peach turns to brown; charged in full, to a coral as hot
// as the walker. wcNear: a form within 120 m of the eye takes the full charge; by 360 m only its thin first wash
// is left and the pencil is down to .15 (at 300 m a sixth of the charge is left). It is a law
// of distance only; k is clamped, so an undefined edge cannot reach the colour. uBody is the sheet's own share: 1 by day, less on the diluted dawn sheet, 0 on the night sheet
// (gouache is body colour already, light on dark: charging it would darken it).
float wcNear(){ return 1. - smoothstep(120., 360., length(vVP)); }
float wcWarm(vec3 pig){ return clamp((pig.r - pig.g)*2.5, 0., 1.); }
vec3 charge(vec3 pig, float k, float warm){
  return pig*exp2(mix(vec3(-.737), vec3(-.415, -1.059, -1.059), warm)*(clamp(k, 0., 2.)*min(1., max(pig.r, max(pig.g, pig.b))*1.7)*(1. - .6*warm)*uBody));
}
// three-band wash: pigment over paper. n = hero-local normal, edge 0..1 pooling, sc = noise scale, hi = highlight amount
vec3 wcWarmGlaze = vec3(.55,.55,.80);   // the glaze laid over warm pigments in shadow; a material may set it before wash()
vec3 wash(vec3 pig, vec3 n, float edge, vec3 op, float sc, float hi){
  float bn = fbm(op*sc), gr = fbm(op*sc*11. + 5.), creep = vn(op*sc*2.3 + vec3(0., uTime*.06, 0.));
  float l = dot(n, uLight) + (bn-.5)*(.45 + .5*uWet) + (creep-.5)*(.08 + .16*uWet);
  float mid = smoothstep(.40,.27,l), sh = smoothstep(-.10,-.24,l), hl = smoothstep(.80,.86,l)*hi;
  float near = wcNear(), nb = .15*near*uBody, warm = wcWarm(pig);          // warm pigments take a cool lilac-grey glaze: teal over peach is mud
  float dens = mix(.70 + nb + (.28 - nb)*mid, .92 - .24*mid, uGouK); dens *= .80 + .40*gr; dens += edge*edge*.34; dens = clamp(dens, 0., 1.);
  // the charge: some in the first wash, twice that in the mid wash, more again in the shadow and where the paint pools at an edge
  vec3 c = mix(uPaper, charge(pig, near*(.5 + .55*mid + .2*sh + .4*edge*edge)*(.80 + .40*gr), warm), dens);
  c = mix(c, c*mix(vec3(1.), mix(uGlaze*2.2, wcWarmGlaze, warm), .74), sh*.92);
  c = mix(c, uHi, hl);
  float jit = h31(vec3(floor(uTime*4.), 1.7, 2.3));
  float ln = smoothstep(.80,.90, edge + (vn(op*sc*3. + jit*9.)-.5)*.14);
  return mix(c, uPencil, ln*(.15 + .45*near)*(1.-hl));
}
${PAPER}
`;

function wcMaterial(shared, own, vertexShader, fragmentShader, extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...own },
    vertexShader, fragmentShader, fog: true, ...extra,
  });
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const col = (hex) => new THREE.Color(hex);

// ---------------------------------------------------------------- nucleus
function buildNucleus(shared, pal, C, portalDir, rng) {
  const geo = new THREE.IcosahedronGeometry(R, 16);
  const nl = V3(rng.range(-0.7, 0.7), rng.range(0.0, 0.6), 1).normalize();
  const mat = wcMaterial(shared, {
    uLilac: { value: pal.lilac }, uPeach: { value: pal.peach }, uGreen: { value: pal.green },
    uPortal: { value: portalDir }, uNucleolus: { value: nl }, uHole: { value: Math.cos(7.15 / R) },
  }, /* glsl */`
    ${VERT_PARS}
    void main(){ vec3 p = position; vec3 n = normalize(position); ${VERT_END} }`, /* glsl */`
    ${FRAG_PARS}
    uniform vec3 uLilac, uPeach, uGreen, uPortal, uNucleolus; uniform float uHole;
    void main(){
      vec3 n = normalize(vN);
      float dp = dot(n, uPortal); if (dp > uHole) discard;
      float m = fbm(vOP*.012 + 3.), m2 = fbm(vOP*.035 - 7.);
      vec3 pig = mix(uLilac, uPeach, smoothstep(.52,.78,m)*.45);
      pig = mix(pig, uGreen, smoothstep(.05,-.75,n.y)*.28);                 // green reflected up from the ribbons
      pig *= mix(vec3(1.), vec3(.80,.74,.92), smoothstep(.45,.7,m2)*.6);   // chromatin blotches
      pig *= 1. - .30*smoothstep(.42,.68,fbm(vOP*.13 + vec3(21., uTime*.22, 21.))) + .06*(vn(vOP*.6 + vec3(0., 0., uTime*.5)) - .5);   // finer mottling for the close pass
      float nu = smoothstep(.80,.93, dot(n,uNucleolus) + (m-.5)*.12);       // nucleolus showing through
      pig = mix(pig, pig*vec3(.52,.42,.68), nu*.8);
      float e = edgeOf(vVN);
      vec3 c = wash(pig, normalize(mix(n, uLight, .18)), e, vOP, .02, .55);
      float tl = dot(n, uLight) + (m - .5)*.34 + (m2 - .5)*.12;               // a painted terminator: an indigo glaze on the limb away
      c = mix(c, c*vec3(.66,.68,.90), .92*smoothstep(.10, -.62, tl));        // from the light, paper showing through on the limb toward it
      c = mix(c, uHi, .30*smoothstep(.30, .92, tl));
      float ring = smoothstep(uHole - .006, uHole, dp);                     // pigment pooled round the open pore
      c = mix(c, c*vec3(.55,.5,.62), ring);
      vec3 pr = n - uPortal*dp; float dM = length(pr)*${R}. + step(dp, 0.)*1e4, fwM = fwidth(dM);   // metres from the pore's centre, on the face
      if (dM < 34.) {
        vec3 t1 = normalize(cross(uPortal, vec3(0., 1., 0.))), t2 = cross(uPortal, t1);
        float halo = 1. - smoothstep(8., 24. + 5.*vn(vOP*.11), dM);
        c = mix(c, c*vec3(.80,.70,.88), halo*.45);                           // a darker lilac pool the petals sit in
        float phi = atan(dot(pr, t2), dot(pr, t1) + 1e-6)*11.459 + (vn(vOP*.09) - .5)*.8;     // 72 radial pencil strokes
        // by day the strokes are lifted out of the dark pool to the paper's light, as a brush lifts wet paint (pencil on a full
        // dark wash is dark on dark); on the night sheet they stay the pale pencil they were
        float sd = abs(fract(phi) - .5)*dM*.0873, lw = mix(max(.105, fwM*.95), max(.09, fwM*.9), uGouK);
        float len = 13. + 12.*h31(vec3(floor(phi), 3., 7.));
        float hatch = (1. - smoothstep(lw*.6, lw*1.4, sd))*smoothstep(7.4, 9.5, dM)*(1. - smoothstep(len*.7, len, dM - 7.))
          *smoothstep(.30, .50, vn(vOP*.45 + floor(uTime*4.)*.11));
        float thin = mix(pow(min(1., .105/max(fwM*.95, 1e-4)), .6), 1., uGouK);   // a lifted stroke narrower than a pixel is diluted by the pixel's own width: far off the rays are a soft light round the pore, not a burr
        c = mix(c, mix(uPaper, uPencil, uGouK), mix(.62*thin, .42, uGouK)*hatch);
      }
      gl_FragColor = vec4(c, 1.);
      ${FRAG_END}
    }`);
  const mesh = new THREE.Mesh(geo, mat); mesh.position.copy(C); mesh.name = 'nucleus';
  // shader works in geometry space (centred sphere): fine, noise only needs to be object-anchored
  return mesh;
}

// ---------------------------------------------------------------- pore rings
// One ring in local space: +Z outward, eight rounded petals r 7..9.6 round a well of r 7.3.
function poreGeometry(nu, nv, wellSeg) {
  const pos = [], idx = [], aux = []; // aux: part (0 petal, 1 well), edge, petal angle
  for (let k = 0; k < 8; k++) {
    const a0 = (k * Math.PI) / 4, base = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * 2 - 1, v = (j / nv) * 2 - 1;
      const px = u * Math.sqrt(1 - (v * v) / 2), py = v * Math.sqrt(1 - (u * u) / 2), rr = Math.min(1, px * px + py * py);
      const ang = a0 + px * 0.335 * (1 - 0.12 * py), rad = 8.65 + py * 1.75 + 0.3 * (1 - px * px);
      const h = 2.0 * Math.pow(1 - rr, 0.55) - 0.3;
      pos.push(Math.cos(ang) * rad, Math.sin(ang) * rad, h); aux.push(0, rr, a0);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, d, b, a, c, d);
    }
  }
  const wb = pos.length / 3; pos.push(0, 0, 0.1); aux.push(1, 0, 0);
  for (let i = 0; i < wellSeg; i++) { const a = (i / wellSeg) * Math.PI * 2; pos.push(Math.cos(a) * 7.4, Math.sin(a) * 7.4, 0.3); aux.push(1, 1, 0); }
  for (let i = 0; i < wellSeg; i++) idx.push(wb, wb + 1 + i, wb + 1 + ((i + 1) % wellSeg));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAux', new THREE.Float32BufferAttribute(aux, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function buildPores(shared, pal, C, portalDir, rng, uOpen) {
  const N = rng.int(396, 444), golden = Math.PI * (3 - Math.sqrt(5)), dirs = [];
  for (let i = 0; i < N; i++) { const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * golden; dirs.push(V3(Math.cos(a) * r, y, Math.sin(a) * r)); }
  // rotate the lattice so one of its points is exactly the portal pore
  let bi = 0, bd = -2; dirs.forEach((d, i) => { const k = d.dot(portalDir); if (k > bd) { bd = k; bi = i; } });
  const q = new THREE.Quaternion().setFromUnitVectors(dirs[bi], portalDir);
  dirs.forEach((d) => d.applyQuaternion(q).normalize());
  const mat = wcMaterial(shared, { uRose: { value: pal.rose }, uTeal: { value: pal.teal }, uOpen: uOpen }, /* glsl */`
    ${VERT_PARS}
    attribute vec3 aAux; attribute vec3 aInst; uniform float uOpen;
    varying vec3 vAux; varying vec3 vInst; varying vec2 vL;
    void main(){
      vec3 lp = position, ln = normal; vAux = aAux; vInst = aInst; vL = position.xy;
      if (aAux.x < .5) {            // petals breathe; the portal's petals fold outward with uOpen, flattening as they do
        lp.z *= 1. - .5*aInst.y*uOpen;
        float th = .07 + .09*sin(uTime*1.3 + aInst.x*6.283 + aAux.z) + aInst.y*uOpen*.50;
        vec2 er = vec2(cos(aAux.z), sin(aAux.z)); float cr = dot(lp.xy, er) - 10.4; vec2 tg = lp.xy - er*dot(lp.xy, er);
        float c = cos(th), s = sin(th); vec2 rz = vec2(c*cr + s*lp.z, -s*cr + c*lp.z);
        lp = vec3(tg + er*(rz.x + 10.4), rz.y);
        float nr = dot(ln.xy, er); vec2 nt = ln.xy - er*nr; vec2 nz = vec2(c*nr + s*ln.z, -s*nr + c*ln.z);
        ln = vec3(nt + er*nz.x, nz.y);
      } else { lp *= 1. - aInst.y; }  // the portal pore has no well
      vec3 p = (instanceMatrix * vec4(lp, 1.)).xyz; vec3 n = normalize(mat3(instanceMatrix) * ln);
      ${VERT_END}
    }`, /* glsl */`
    ${FRAG_PARS}
    uniform vec3 uRose, uTeal; varying vec3 vAux; varying vec3 vInst; varying vec2 vL;
    void main(){
      vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.); vec3 c;
      if (vAux.x < .5) {
        vec2 er = vec2(cos(vAux.z), sin(vAux.z)); float rd = dot(vL, er), tg = dot(vL, vec2(-er.y, er.x));
        vec3 pig = uRose * mix(vec3(.74,.62,.80), vec3(.95,.78,.88), vInst.z);
        pig *= 1. - .34*(1. - smoothstep(7.1, 8.9, rd + (vn(vOP*.6) - .5)*.8));         // the wash pooled at the petal's foot
        if (!gl_FrontFacing) { pig = mix(pig, uPaper, .34)*vec3(.90,.82,.95); n = normalize(mix(n, uLight, .6)); }   // the pale inside of the petal
        float e = max(smoothstep(.30, 1., vAux.y), edgeOf(vVN)*.8);
        c = wash(pig, n, e, vOP, .22, 1.);
        float fan = max(rd - 4.6, .6), vv = tg/fan*2.6;                                  // three pencil veins fanning from the foot
        float vd = abs(fract(vv + .5) - .5)/2.6*fan, vw = max(.09, fwidth(tg)*1.3);
        float vein = (1. - smoothstep(vw*.6, vw*1.5, vd))*step(abs(vv), 1.45)*(1. - smoothstep(.45, .85, vAux.y))
          *smoothstep(.28, .5, vn(vOP*.9 + vInst.x*9.));
        c = mix(c, uPencil, .5*vein);
      } else {
        float r = length(vL)/7.4; float ang = r > .01 ? atan(vL.y, vL.x) : 0.;
        vec3 pig = uTeal * mix(1.25, .8, smoothstep(.2, 1., r));
        c = wash(pig, n, smoothstep(.72, 1., r), vOP, .15, 0.);
        c = mix(c, uPaper, .16*smoothstep(.55,.0,r));
        float sp = abs(fract(ang*1.2732 + .5) - .5) * r * 5.81;            // metres from the nearest of 8 spokes
        float lw = max(.16, .9*fwidth(sp));
        float line = (1. - smoothstep(lw*.6, lw*1.3, sp)) * step(.16, r);
        float rg = abs(r - .2)*7.4; line = max(line, 1. - smoothstep(lw*.6, lw*1.3, rg));
        c = mix(c, uPencil*.75, line*.8*clamp(.2/lw, .25, 1.));
      }
      gl_FragColor = vec4(c, 1.);
      ${FRAG_END}
    }`, { side: THREE.DoubleSide });
  const near = [], far = [];
  dirs.forEach((d, i) => (d.dot(portalDir) > Math.cos(0.5) ? near : far).push(i));
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), Z = V3(0, 0, 1), one = V3(1, 1, 1), p = V3(), spin = new THREE.Quaternion();
  const make = (list, geo) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length), inst = new Float32Array(list.length * 3);
    list.forEach((di, k) => {
      const d = dirs[di]; qq.setFromUnitVectors(Z, d); spin.setFromAxisAngle(Z, rng() * Math.PI); qq.multiply(spin);
      p.copy(d).multiplyScalar(R - 0.12).add(C); const s = di === bi ? 1 : rng.range(0.92, 1.06);
      m4.compose(p, qq, one.set(s, s, 1)); mesh.setMatrixAt(k, m4);
      inst[k * 3] = rng(); inst[k * 3 + 1] = di === bi ? 1 : 0; inst[k * 3 + 2] = rng();
    });
    geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3));
    mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true; return mesh;
  };
  return { meshes: [make(near, poreGeometry(8, 4, 28)), make(far, poreGeometry(3, 2, 10))], dirs, portalIndex: bi };
}

// ---------------------------------------------------------------- reticulum ribbons
function buildRibbons(shared, pal, C, portalDir, rng) {
  const count = rng.int(13, 16), total = count + rng.int(7, 10), pos = [], uv = [], colr = [], idx = [];
  const dir = V3(), mer = V3(), v = V3(), blocked = new Uint8Array(160);
  // the last two flank the open pore: laid along the equator of a frame turned so that its (lat 0, az 0) is the pore and
  // its east is the face's own meridian, they run up the face 18 m to either side of the approach line
  const flankQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
    V3(0, Math.cos(PORE_LAT), Math.sin(PORE_LAT)), V3(-1, 0, 0), portalDir));
  for (let rJ = 0; rJ < total + 2; rJ++) {
    const flank = rJ >= total, PORE_GAP = flank ? 0.05 : 0.125, GAP_W = flank ? 0.03 : 0.06;     // 0.125 rad: about 32 m on the surface
    const rI = rJ % count, lat0 = flank ? (rJ === total ? 0.07 : -0.07) : -1.22 + (rI + rng.range(0.1, 0.9)) * (1.16 / count);
    const L = flank ? rng.range(150, 200) : rng.range(170, 300), lam = rng.range(40, 56), fold = lam * rng.range(0.07, 0.1), ph = rng() * 6.28;
    const azc = flank ? rng.range(-0.08, 0.08) : rJ < 2 ? rng.sign() * rng.range(0.25, 0.5) : rng.gauss() * 1.15, k = flank ? rng.range(-0.03, 0.03) : rng.range(-0.22, 0.22);
    const amp = flank ? rng.range(1.5, 2.5) : rng.range(6, 9), tint = rng.range(0.88, 1.08), seed = rng() * 50, n = Math.floor(L / 2.2), base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const s = i * 2.2, th = (s / lam) * Math.PI * 2 + ph, along = s + fold * Math.sin(2 * th) - L / 2, t = i / n;
      const taper = Math.min(1, 0.25 + Math.min(t, 1 - t) * 9);
      const lat = lat0 + k * (along / L) + ((amp * Math.cos(th)) / R) * (0.3 + 0.7 * taper), az = azc + along / (R * Math.cos(lat0));
      const tau = 0.62 + 0.22 * Math.sin(s * 0.021 + ph), ct = Math.cos(tau), st = Math.sin(tau), rc = R + 2.6 + 6 * ct * taper;
      dir.set(Math.cos(lat) * Math.sin(az), Math.sin(lat), Math.cos(lat) * Math.cos(az));
      mer.set(-Math.sin(lat) * Math.sin(az), Math.cos(lat), -Math.sin(lat) * Math.cos(az));
      if (flank) { dir.applyQuaternion(flankQ); mer.applyQuaternion(flankQ); }
      // the open pore and its approach line stay clear: a ribbon that would cross within PORE_GAP of the pore
      // narrows to a point, stops, and starts again from a point on the far side (it is never bent round the hole)
      const pa = Math.acos(Math.min(1, Math.max(-1, dir.dot(portalDir)))), pk = Math.min(1, Math.max(0, (pa - PORE_GAP) / GAP_W)), gap = pk * pk * (3 - 2 * pk);
      blocked[i] = pa < PORE_GAP + 0.004 ? 1 : 0;
      for (let j = 0; j < 4; j++) {
        const w = -1 + (j * 2) / 3, ww = 6 * w * taper * gap;
        v.copy(dir).multiplyScalar(rc + ww * ct).addScaledVector(mer, ww * st).add(C);
        pos.push(v.x, v.y, v.z); uv.push(s, w); colr.push(tint, seed, 0);
      }
    }
    for (let i = 0; i < n; i++) {
      if (blocked[i] || blocked[i + 1]) continue;
      for (let j = 0; j < 3; j++) { const a = base + i * 4 + j, b = a + 1, c = a + 4, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('aTint', new THREE.Float32BufferAttribute(colr, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const mat = wcMaterial(shared, { uGreen: { value: pal.green }, uPeach: { value: pal.peach } }, /* glsl */`
    ${VERT_PARS}
    attribute vec3 aTint; varying vec2 vUv; varying vec3 vTint;
    void main(){ vUv = uv; vTint = aTint; vec3 n = normal;
      vec3 p = position + normal * sin(uTime*.55 + uv.x*.06 + aTint.y) * .7; ${VERT_END} }`, /* glsl */`
    ${FRAG_PARS}
    uniform vec3 uGreen, uPeach; varying vec2 vUv; varying vec3 vTint;
    void main(){
      vec3 n = normalize(vN) * (gl_FrontFacing ? 1. : -1.);
      vec3 pig = uGreen * vec3(.68,.88,.80) * vTint.x;
      float e = max(smoothstep(.70, 1., abs(vUv.y)), edgeOf(vVN)*.55);
      vec3 c = wash(pig, n, e, vOP, .09, .22);
      float Y = (vUv.y*.5 + .5)*12., row = floor(Y/2.4);                    // ribosomes: running peach beads
      float spd = (mod(row, 2.) < .5 ? 1. : -1.) * (1.6 + 1.8*h31(vec3(row, vTint.y, 3.)));
      float gx = (vUv.x + uTime*spd)/2.4, cell = floor(gx);
      float on = step(.38, h31(vec3(cell, row, vTint.y)));
      float dd = length(vec2(fract(gx) - .5, fract(Y/2.4) - .5))*2.4;
      float aa = max(.08, fwidth(dd));
      float dotm = (1. - smoothstep(.70 - aa, .70 + aa, dd)) * on;
      vec3 dc = mix(uPaper, uPeach, .9) * (1. - .38*smoothstep(.38, .7, dd)) * (.8 + .2*smoothstep(-.2, .3, dot(n, uLight)));
      dc = mix(dc, uPaper, (1. - smoothstep(.12, .26, length(vec2(fract(gx) - .62, fract(Y/2.4) - .62))*2.4))*.8);
      c = mix(c, dc, dotm);
      gl_FragColor = vec4(c, 1.);
      ${FRAG_END}
    }`, { side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'reticulum'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- messenger threads
function buildThreads(shared, pal, C, portalDir, pores, rng) {
  const cand = rng.shuffle(pores.dirs.map((d, i) => i).filter((i) => {
    const d = pores.dirs[i], k = d.dot(portalDir); return i !== pores.portalIndex && d.z > 0.05 && k < 0.985 && d.y > -0.72;
  }));
  const want = rng.int(7, 10), pos = [], nxt = [], side = [], idx = [], p = V3(), a1 = V3(), a2 = V3(), drift = V3(), q = V3();
  const SEG = 96; let made = 0;
  for (const ci of cand) {
    if (made >= want) break;
    const d = pores.dirs[ci], L = rng.range(90, 210), f1 = rng() * 6.28, f2 = rng() * 6.28, ph = rng();
    a1.set(rng.gauss(), rng.gauss(), rng.gauss()).cross(d).normalize(); a2.copy(d).cross(a1);
    drift.set(rng.range(-0.5, 0.5), rng.range(-0.7, 0.1), rng.range(0.2, 0.8));
    const pts = []; let ok = true;
    for (let i = 0; i <= SEG + 1; i++) {
      const t = i / SEG;
      p.copy(d).multiplyScalar(R + 0.4 + L * t * (0.5 + 0.5 * (1 - t * 0.6))).add(C)
        .addScaledVector(a1, Math.sin(t * 6 + f1) * L * 0.11 * t).addScaledVector(a2, Math.sin(t * 9 + f2) * L * 0.07 * t)
        .addScaledVector(drift, t * t * L * 0.45);
      // keep off the approach line and outside the nucleus
      q.copy(p).sub(C); const rad = q.length(), along = q.dot(portalDir), off = Math.sqrt(Math.max(0, rad * rad - along * along));
      if ((along > R - 20 && off < 22) || (i > 3 && rad < R + 3)) { ok = false; break; }
      pts.push(p.clone());
    }
    if (!ok) continue;
    const base = pos.length / 3; let s = 0;
    for (let i = 0; i <= SEG; i++) {
      if (i > 0) s += pts[i].distanceTo(pts[i - 1]);
      for (const sd of [-1, 1]) { pos.push(pts[i].x, pts[i].y, pts[i].z); nxt.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z); side.push(sd, s, i / SEG, ph); }
      if (i < SEG) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    made++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aNext', new THREE.Float32BufferAttribute(nxt, 3));
  geo.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 4));
  geo.setIndex(idx);
  const mat = wcMaterial(shared, { uPeach: { value: pal.peach } }, /* glsl */`
    ${VERT_PARS}
    attribute vec3 aNext; attribute vec4 aSide; varying vec4 vS;
    void main(){
      vS = aSide; float t = aSide.z, ph = aSide.w;
      vec3 sw = vec3(sin(uTime*.5 + ph*6. + t*4.), cos(uTime*.4 + ph*5. + t*5.), sin(uTime*.45 + ph*3. + t*3.)) * t*t*7.;
      vec3 p = position + sw;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.); vec4 mn = modelViewMatrix * vec4(aNext + sw, 1.);
      vec3 tv = normalize(mn.xyz - mvPosition.xyz + vec3(1e-5, 0., 0.));
      vec3 sdv = normalize(cross(tv, normalize(mvPosition.xyz)) + vec3(0., 1e-5, 0.));
      mvPosition.xyz += sdv * aSide.x * 1.3;
      vOP = p; vN = vec3(0., 1., 0.); vVN = vec3(0., 0., 1.); vVP = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition; vClip = gl_Position.xyw;
      #include <fog_vertex>
    }`, /* glsl */`
    ${FRAG_PARS}
    uniform vec3 uPeach; varying vec4 vS;
    void main(){
      float x = vS.x * 1.3, fw = fwidth(x);
      float lw = max(.10, .62*fw);
      float line = (1. - smoothstep(lw*.6, lw*1.25, abs(x))) * (1. - smoothstep(.9, 1., vS.z));
      float bx = (fract((vS.y - uTime*5.)/11. + vS.w) - .5)*11.;
      float bd = length(vec2(bx, x)), bead = (1. - smoothstep(.8, .95, bd)) * step(fw, .9) * step(.04, vS.z);
      if (max(line, bead) < .5) discard;
      vec3 c = mix(mix(uPencil, uPaper, clamp(.18 + fw*.5, .18, .55)), mix(uPaper, uPeach, .9) * (1. - .4*smoothstep(.5, .9, bd)), bead);
      gl_FragColor = vec4(c, 1.);
      ${FRAG_END}
    }`, { side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'messenger'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the branch microtubule
function buildTube(shared, pal, C, rng, lead) {
  const j = () => rng.range(-1, 1);
  const raw = [[30 + 14 * j(), 16 + 4 * j(), 480], [22 + 10 * j(), 24 + 3 * j(), 400], [9 + 5 * j(), 35 + 2 * j(), 322], [0, 46.8, 245.1],
    [-42, 40, 214], [-104, 22 + 6 * j(), 168], [-172, 2 + 8 * j(), 98], [-232, -18 + 8 * j(), 0]];
  // lead-in (world option): the main tube we ride first. It arrives at raw[1] on a bearing `bearingDeg` to the right of
  // the branch, so the branch leaves it bearing left; raw[0] is replaced and `n` points are laid back along the main line.
  let shift = 0, junction = null;
  if (lead) {
    const b = (lead.bearingDeg ?? 30) * Math.PI / 180, bx = raw[2][0] - raw[1][0], bz = raw[2][2] - raw[1][2], bl = Math.hypot(bx, bz);
    const dx = (bx * Math.cos(b) - bz * Math.sin(b)) / bl, dz = (bx * Math.sin(b) + bz * Math.cos(b)) / bl, step = 58, n = Math.max(2, Math.round(lead.length / step));
    raw.shift(); const J = raw[0];
    for (let k = 1; k <= n; k++) raw.unshift([J[0] - dx * step * k + (k > 1 ? 5 * j() : 0), J[1] - 3.2 * k + (k > 1 ? 2 * j() : 0), J[2] - dz * step * k]);
    shift = n - 1; junction = { position: V3(J[0], J[1], J[2]), mainDir: V3(dx, 0.04, dz).normalize() };
  }
  const REL = 3 + shift;
  const pts = raw.map((p, i) => { const v = V3(p[0], p[1], p[2]); if (i > REL) { v.sub(C); if (v.length() < 324) v.setLength(324); v.add(C); } return v; });
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); curve.arcLengthDivisions = 600;
  const length = curve.getLength(), n = Math.round(length / 1.2), RS = 14, TR = 2.5;
  let releaseS = 0, best = 1e9; const P = V3(), T = V3(), S = V3(), U = V3(), Y = V3(0, 1, 0);
  for (let i = 0; i <= 800; i++) { curve.getPointAt(i / 800, P); const d = P.distanceTo(pts[REL]); if (d < best) { best = d; releaseS = (i / 800) * length; } }
  const frame = (s, out) => {
    const u = Math.min(1, Math.max(0, s / length));
    curve.getPointAt(u, out.P); curve.getTangentAt(u, out.T); out.S.crossVectors(out.T, Y).normalize(); out.U.crossVectors(out.S, out.T);
    const over = s - u * length; if (over !== 0) out.P.addScaledVector(out.T, over);
    return out;
  };
  const pos = [], nor = [], su = [], idx = [], f = { P, T, S, U };
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * length; frame(s, f);
    for (let k = 0; k <= RS; k++) {
      const a = (k / RS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const nx = S.x * ca + U.x * sa, ny = S.y * ca + U.y * sa, nz = S.z * ca + U.z * sa;
      pos.push(P.x + nx * TR, P.y + ny * TR, P.z + nz * TR); nor.push(nx, ny, nz); su.push(s, a);
    }
    if (i < n) for (let k = 0; k < RS; k++) { const a = i * (RS + 1) + k, b = a + 1, c = a + RS + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('aSU', new THREE.Float32BufferAttribute(su, 2));
  geo.setIndex(idx);
  const feet = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -1, 0));
  const mat = wcMaterial(shared, { uGreen: { value: pal.green }, uLen: { value: length }, uFoot: { value: feet } }, /* glsl */`
    ${VERT_PARS}
    attribute vec2 aSU; uniform float uLen; varying vec2 vSU;
    void main(){ vSU = aSU; vec3 n = normal;
      float cap = 1. - smoothstep(0., 7., min(aSU.x, uLen - aSU.x));
      vec3 p = position + normal * (.10*cos(aSU.x*1.309) - 2.45*cap*cap);
      ${VERT_END} }`, /* glsl */`
    ${FRAG_PARS}
    uniform vec3 uGreen; uniform vec4 uFoot[4]; varying vec2 vSU;
    void main(){
      vec3 n = normalize(vN); float s = vSU.x, a = vSU.y, b = s/4.8;
      vec3 pig = mix(uGreen, uGlaze, .68) * vec3(.9,1.,.95);
      pig *= mix(.9, 1.08, step(.5, fract(b*.5)));                           // alternate sleepers
      float braid = abs(fract(a*2.069 + s*.11) - .5);                        // 13 twisting strands
      pig *= 1. - .22*(1. - smoothstep(.04, .16, braid));
      float joint = abs(fract(b + .5) - .5)*4.8;                             // band every 4.8 m
      float e = max(edgeOf(vVN), .85*(1. - smoothstep(.10, .42, joint)));
      vec3 c = wash(pig, n, e, vOP, .22, .3);
      float top = smoothstep(0., .5, sin(a));
      for (int i = 0; i < 4; i++) {                                          // wet footprints that dry behind us
        vec4 f = uFoot[i]; float age = f.z;
        float dist = length(vec2(s - f.x, cos(a)*2.5 - f.y));
        float rr = .9 + age*.45, fade = step(0., age) * clamp(1. - age/4., 0., 1.);
        float m = (1. - smoothstep(rr*.55, rr, dist)) + .6*(1. - smoothstep(0., .22, abs(dist - rr)));
        c *= mix(vec3(1.), vec3(.42,.64,.62), clamp(m, 0., 1.)*fade*top);
      }
      gl_FragColor = vec4(c, 1.);
      ${FRAG_END}
    }`);
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'microtubule'; mesh.frustumCulled = false;
  return { mesh, curve, length, releaseS, frame, feet, radius: TR, junction };
}

// ---------------------------------------------------------------- walker, tether, bubble
class Helix extends THREE.Curve {
  constructor(ph) { super(); this.ph = ph; }
  getPoint(t, out = new THREE.Vector3()) { const th = t * 34 + this.ph; return out.set(0.085 * Math.cos(th), t, 0.085 * Math.sin(th)); }
}
function tag(geo, type, index, colour, jitter, rng) {
  const g = geo.index ? geo : mergeVertices(geo), n = g.attributes.position.count, part = new Float32Array(n * 2), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { part[i * 2] = type; part[i * 2 + 1] = index; const k = 1 + jitter * (rng() - 0.5); c[i * 3] = colour.r * k; c[i * 3 + 1] = colour.g * k; c[i * 3 + 2] = colour.b * k; }
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  g.deleteAttribute('uv'); return g;
}
function buildVehicle(shared, pal, tube, rng, opts) {
  const parts = [], verm = pal.vermilion, deep = verm.clone().multiplyScalar(0.8), lite = verm;
  // body: pear-shaped hip, short stalk, knob (lathe, slightly squashed front to back)
  const prof = [[0.001, 0], [0.34, 0.04], [0.52, 0.28], [0.53, 0.55], [0.36, 0.86], [0.16, 1.1], [0.115, 1.45], [0.14, 1.62], [0.27, 1.74], [0.29, 1.88], [0.18, 2.0], [0.001, 2.04]]
    .map((p) => new THREE.Vector2(p[0], p[1]));
  const body = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(22), 16); body.scale(1.1, 1, 0.85); body.computeVertexNormals();
  parts.push(tag(body, 0, 0, verm, 0.06, rng));
  // feet: beans 1.6 m long with a flat sole and a raised toe
  for (let f = 0; f < 2; f++) {
    const g = new THREE.SphereGeometry(1, 16, 10), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) * 0.36, y = p.getY(i) * 0.3, z = p.getZ(i) * 0.8; const zz = z / 0.8;
      x *= 1 - 0.22 * zz * zz + 0.12 * zz; x += (f ? -1 : 1) * 0.1 * (zz * zz - 0.4);     // bean curve, mirrored
      y = Math.max(y, -0.14) + 0.14 + 0.1 * Math.max(0, zz) * Math.max(0, zz);
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals(); parts.push(tag(g, 0, 1 + f, deep, 0.06, rng));
  }
  // springy legs: unit tubes along +Y with coil ridges, bent along a bezier in the shader
  for (let l = 0; l < 2; l++) {
    const g = new THREE.CylinderGeometry(1, 1, 1, 7, 18, true); g.translate(0, 0.5, 0); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), r = 0.115 + 0.04 * Math.sin(y * 44) + 0.045 * Math.pow(Math.abs(y - 0.5) * 2, 3); p.setX(i, p.getX(i) * r); p.setZ(i, p.getZ(i) * r); }
    g.computeVertexNormals(); parts.push(tag(g, 1, l, verm.clone().multiplyScalar(0.62), 0.05, rng));
  }
  // tether: two twisted strands, one pencil and one green wash
  parts.push(tag(new THREE.TubeGeometry(new Helix(0), 56, 0.05, 4), 1, 2, pal.pencil, 0, rng));
  parts.push(tag(new THREE.TubeGeometry(new Helix(Math.PI), 56, 0.06, 4), 1, 2, pal.teal.clone().lerp(pal.green, 0.5), 0, rng));
  // cargo dots inside the bubble
  const cargoCols = opts.cargoColors || [pal.peach, pal.lilac, pal.green, pal.peach, pal.lilac];
  if (opts.bubble !== false) for (let i = 0; i < 5; i++) {
    // small, just under the upper front skin (+Z is the bubble's front), either side of the tether: where the lens looks down through it
    const g = new THREE.SphereGeometry(rng.range(0.08, 0.15), 9, 7), th = rng.range(0.5, 0.82), ph = (i % 2 ? 1 : -1) * (0.16 + 0.1 * i + rng.range(0, 0.08)), rr = rng.range(2.9, 3.12);
    g.translate(rr * Math.sin(th) * Math.sin(ph), rr * Math.cos(th), rr * Math.sin(th) * Math.cos(ph));
    parts.push(tag(g, 0, 3, cargoCols[i], 0.04, rng));
  }
  const geo = mergeGeometries(parts);
  const uM = [0, 1, 2, 3].map(() => new THREE.Matrix4()), uBz = Array.from({ length: 9 }, () => V3()), uTether = { value: 1 }, uWs = { value: 1 };
  const mat = wcMaterial(shared, { uM: { value: uM }, uBz: { value: uBz }, uTether, uWs }, /* glsl */`
    ${VERT_PARS}
    attribute vec2 aPart; attribute vec3 color; uniform mat4 uM[4]; uniform vec3 uBz[9]; uniform float uTether, uWs; varying vec3 vCol;
    void main(){
      vec3 p, n; int k = int(aPart.y + .5); vCol = color;
      if (aPart.x < .5) {
        mat4 M = uM[k]; vec3 lp = position;
        if (k == 3) lp += .14*sin(uTime*vec3(5.1, 6.3, 4.7) + position.yzx*4.);       // cargo jiggle
        p = (M*vec4(lp, 1.)).xyz; n = normalize(mat3(M)*normal);
      } else {
        vec3 A = uBz[k*3], B = uBz[k*3 + 1], Cc = uBz[k*3 + 2]; float t = position.y, w = 1.;
        if (k == 2) { t = 1. - (1. - t)*uTether; w = smoothstep(0., .15, uTether); } else w = uWs;
        float u = 1. - t; vec3 ctr = u*u*A + 2.*u*t*B + t*t*Cc;
        vec3 tg = normalize(2.*u*(B - A) + 2.*t*(Cc - B) + vec3(0., 1e-4, 0.));
        vec3 e1 = normalize(cross(tg, uM[0][0].xyz) + vec3(1e-4, 0., 0.)), e2 = cross(e1, tg);
        p = ctr + (e1*position.x + e2*position.z)*w; n = normalize(e1*normal.x + e2*normal.z + tg*normal.y);
      }
      ${VERT_END}
      vOP = position*1.3 + aPart.y*3.7 + aPart.x*11.;
    }`, /* glsl */`
    ${FRAG_PARS}
    varying vec3 vCol;
    void main(){
      vec3 n = normalize(vN);
      vec3 c = wash(vCol, n, edgeOf(vVN), vOP, .9, .7);
      c = mix(c, vCol*(.60 + .40*smoothstep(-.4, .5, dot(n, uLight))), .5);   // the accent is laid on thick
      gl_FragColor = vec4(c, 1.);
      ${FRAG_END}
    }`);
  const walker = new THREE.Mesh(geo, mat); walker.name = 'walker'; walker.frustumCulled = false;
  const object = new THREE.Group(); object.name = 'vehicle'; object.add(walker);
  let bubble = null;
  if (opts.bubble !== false) {
    const bm = wcMaterial(shared, { uGreen: { value: opts.bubbleTint ? col(opts.bubbleTint) : pal.green }, uForm: { value: 1 }, uLat: { value: 0 }, uGouache: { value: opts.gouache ? 1 : 0 } }, /* glsl */`
      ${VERT_PARS}
      void main(){ vec3 n = normal;
        vec3 p = position * (1. + .018*sin(uTime*2.3 + position.y*1.4) + .012*sin(uTime*3.1 + position.x*1.9)); ${VERT_END} }`, /* glsl */`
      ${FRAG_PARS}
      uniform vec3 uGreen; uniform float uForm, uLat, uGouache;
      float hexEdge(vec2 p){ vec2 r = vec2(1., 1.732), h = r*.5; vec2 a = mod(p, r) - h, b = mod(p - h, r) - h;
        vec2 gv = abs(dot(a, a) < dot(b, b) ? a : b); return .5 - max(dot(gv, vec2(.5, .866)), gv.x); }
      void main(){
        vec3 n = normalize(vN); float e = edgeOf(vVN);
        float l = dot(n, uLight) + (fbm(vOP*.5) - .5)*.5;
        float dens = .12 + .12*smoothstep(.3, .1, l) + .62*e*e*e + .10*vn(vOP*3.);
        dens *= 1. - smoothstep(.62, .74, l);                                          // paper crescent
        dens *= uForm;
        vec3 tint = mix(vec3(1.), charge(uGreen*vec3(.8, 1., .95), wcNear()*(.25 + .75*e*e*e), 0.), clamp(dens, 0., 1.));   // the same charge as every wash: deepest where it pools at the rim
        tint *= 1. - .46*smoothstep(.86, .95, e + (vn(vOP*1.5 + floor(uTime*4.)*3.) - .5)*.1);   // pencil rim
        vec3 dd = normalize(vOP + vec3(1e-4, 0., 0.));                                 // pencil hexagons: the coat it is sketched in
        float he = hexEdge(vec2(atan(dd.z, dd.x)*2.865, asin(clamp(dd.y, -1., 1.))*3.3));
        tint *= 1. - .5*uLat*(1. - smoothstep(.035, .09, he + (vn(vOP*2. + floor(uTime*4.)*5.) - .5)*.04))*smoothstep(1., .8, abs(dd.y));
        float ff = 0.;
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
          #else
            ff = smoothstep(fogNear, fogFar, vFogDepth);
          #endif
        #endif
        if (uGouache > .5) gl_FragColor = vec4(uGreen*(1. - min(tint.r, min(tint.g, tint.b)))*(1. - ff)*.9, 1.);   // pale body colour, screened on
        else gl_FragColor = vec4(mix(tint, vec3(1.), ff), 1.);
      }`, {
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: opts.gouache ? THREE.OneMinusDstColorFactor : THREE.ZeroFactor, blendDst: opts.gouache ? THREE.OneFactor : THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    });
    bubble = new THREE.Mesh(new THREE.SphereGeometry(3.5, 36, 22), bm); bubble.frustumCulled = false; bubble.name = 'bubble'; bubble.renderOrder = 5; object.add(bubble);
  }

  // gait: a pure function of arc length s along the tube (4.8 m a step; each foot docks every 9.6 m)
  const F = { P: V3(), T: V3(), S: V3(), U: V3() }, bodyP = V3(), ank = [V3(), V3()], tmp = V3(), bub = V3(), rot = new THREE.Matrix4(), tmpS = V3();
  const W = 0.35, ease = (e) => e * e * (3 - 2 * e);
  const state = { s: 0, position: V3(), lens: V3() };
  function pose(s, time, o = {}) {
    const phi = s / 4.8, ws = o.walker ?? 1; state.s = s; uWs.value = ws;
    tube.frame(s, F);
    const bob = 0.13 * Math.cos(phi * Math.PI * 2), sway = 0.12 * Math.sin(phi * Math.PI);
    bodyP.copy(F.P).addScaledVector(F.U, tube.radius + (1.22 + bob) * ws).addScaledVector(F.S, sway);
    uM[0].makeBasis(tmpS.copy(F.S).negate(), F.U, F.T).multiply(rot.makeRotationX(0.16 + 0.08 * Math.sin(phi * Math.PI * 2))).scale(tmp.setScalar(ws)).setPosition(bodyP);
    state.position.copy(bodyP); state.lens.copy(F.P).addScaledVector(F.T, -7).addScaledVector(F.U, 7.5);
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1, x = phi - i, n = Math.floor(x / 2), r = x - 2 * n, plant = (2 * n + i + 1) * 4.8;
      let sf = plant, h = 0, lat = side * 0.55 * ws, pitch = 0;
      if (r > 2 - W) {
        const e = (r - (2 - W)) / W, late = Math.max(0, e - 0.72) / 0.28;
        sf = plant + 9.6 * ease(e); h = 1.5 * Math.sin(Math.PI * e) * (1 - 0.25 * e);
        lat += side * 0.75 * Math.sin(Math.PI * e) + 0.22 * Math.sin(late * 16) * late * (1 - late) * 4;     // whip out, then feel for the tube
        pitch = -0.42 * Math.sin(Math.PI * Math.min(1, e * 1.3)) + 0.3 * Math.sin(late * 14) * late * (1 - late) * 4;
      }
      tube.frame(sf, F);
      tmp.copy(F.P).addScaledVector(F.U, tube.radius + 0.08 + h).addScaledVector(F.S, lat);
      uM[1 + i].makeBasis(tmpS.copy(F.S).negate(), F.U, F.T).multiply(rot.makeRotationX(pitch)).scale(tmpS.setScalar(ws)).setPosition(tmp);
      ank[i].copy(tmp).addScaledVector(F.U, 0.42 * ws).addScaledVector(F.T, -0.12);
      tube.feet[i * 2].set(plant, side * 0.55 * ws, r, 0); tube.feet[i * 2 + 1].set(plant - 9.6, side * 0.55 * ws, r + 2, 0);
      if (r > 2 - W) tube.feet[i * 2].z = r;                       // print stays while the foot swings away
    }
    tube.frame(s, F);
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1, hip = uBz[i * 3], knee = uBz[i * 3 + 1];
      hip.copy(bodyP).addScaledVector(F.S, side * 0.3 * ws).addScaledVector(F.U, 0.18 * ws);
      const reach = hip.distanceTo(ank[i]);
      knee.copy(hip).add(ank[i]).multiplyScalar(0.5).addScaledVector(F.U, 0.5 + 0.22 * reach).addScaledVector(F.S, side * 0.3);
      uBz[i * 3 + 2].copy(ank[i]);
    }
    // bubble: follows 10.5 m behind with a soft lag, jerked by each step
    if (o.bubble) bub.copy(o.bubble);
    else {
      tube.frame(s - 10.5 - 0.4 * Math.sin(phi * Math.PI * 2 + 1.2), F);
      bub.copy(F.P).addScaledVector(F.U, 6.4 + 0.18 * Math.sin(time * 1.9)).addScaledVector(F.S, 0.3 * Math.sin(time * 1.1));
    }
    const bs = o.scale ?? 1;
    if (o.bubbleBasis) uM[3].copy(o.bubbleBasis).setPosition(bub); else uM[3].makeTranslation(bub.x, bub.y, bub.z);
    if (bs !== 1) uM[3].scale(tmp.setScalar(Math.max(bs, 1e-3)));
    if (bubble) { bubble.position.copy(bub); bubble.scale.setScalar(Math.max(bs, 1e-3)); }
    uTether.value = o.tether ?? 1;
    const A = uBz[6], B = uBz[7], Cc = uBz[8];
    A.set(0, 1.98, 0).applyMatrix4(uM[0]);
    Cc.copy(A).sub(bub).normalize().multiplyScalar(3.45 * bs).add(bub);
    B.copy(A).add(Cc).multiplyScalar(0.5); B.y -= 0.5 + 0.45 * Math.sin(phi * Math.PI * 2 + 0.6);
  }
  return { object, walker, bubble, pose, state };
}

// ---------------------------------------------------------------- hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, hex = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const shift = (c, h, s, l) => c.clone().offsetHSL(h, s, l);
  const hs = rng.range(-0.018, 0.018), hs2 = rng.range(-0.02, 0.02);
  const pal = {
    paper: col(hex[0]), green: shift(col(hex[1]), hs, 0, 0), lilac: shift(col(hex[2]), hs2, 0, 0), peach: shift(col(hex[3]), hs * 0.5, 0, 0),
    teal: col(hex[4]), pencil: col(hex[5]), vermilion: col(hex[6]),
  };
  pal.rose = pal.lilac.clone().lerp(pal.peach, rng.range(0.3, 0.45)).offsetHSL(0, 0.08, -0.03);
  const shared = {
    uTime: { value: 0 }, uPaper: { value: pal.paper }, uGlaze: { value: pal.teal }, uPencil: { value: pal.pencil },
    uLight: { value: V3(-0.55, 0.72, 0.42).normalize() },
    uHi: { value: col(opts.highlight || hex[0]) }, uWet: { value: opts.wet ?? 0.5 }, uPx: { value: 1 },
    uBgA: { value: col(hex[1]) }, uBgB: { value: col(hex[2]) }, uBgMoon: { value: V3(0, 0.3, -1).normalize() }, uBgK: { value: 0 }, uFogD: { value: 0 }, uFrame: { value: opts.gouache ? 0.45 : 0.8 }, uPoolK: { value: opts.gouache ? 0 : 1 }, uBgDeep: { value: 0 }, uGouK: { value: opts.gouache ? 1 : 0 }, uBody: { value: opts.gouache ? 0 : 1 },
  };
  const C = V3(0, R, 0), portalDir = V3(0, -Math.sin(PORE_LAT), Math.cos(PORE_LAT)), uOpen = { value: 0 };
  const object = new THREE.Group(); object.name = 'cell-highway-hero';
  await ctx.yield?.();

  object.add(buildNucleus(shared, pal, C, portalDir, rng.fork('nucleus')));
  await ctx.yield?.();
  const pores = buildPores(shared, pal, C, portalDir, rng.fork('pores'), uOpen);
  pores.meshes.forEach((m) => object.add(m));
  await ctx.yield?.();
  object.add(buildRibbons(shared, pal, C, portalDir, rng.fork('ribbons')));
  await ctx.yield?.();
  object.add(buildThreads(shared, pal, C, portalDir, pores, rng.fork('threads')));
  await ctx.yield?.();
  const tube = buildTube(shared, pal, C, rng.fork('tube'), opts.lead);
  object.add(tube.mesh);
  await ctx.yield?.();
  const vehicle = opts.vehicle === false ? null : buildVehicle(shared, pal, tube, rng.fork('vehicle'), opts);
  if (vehicle) object.add(vehicle.object);
  await ctx.yield?.();

  // the open pore: a stand-in for the portal (the only thing brighter than paper)
  const seat = C.clone().addScaledVector(portalDir, R + 0.2);
  let standIn = null;
  if (opts.portalStandIn !== false) {
    standIn = new THREE.Mesh(new THREE.CircleGeometry(7.4, 40), wcMaterial(shared, { uA: { value: pal.peach }, uB: { value: pal.lilac } }, /* glsl */`
      ${VERT_PARS}
      varying vec2 vL;
      void main(){ vL = position.xy; vec3 p = position; vec3 n = normal; ${VERT_END} }`, /* glsl */`
      ${FRAG_PARS}
      uniform vec3 uA, uB; varying vec2 vL;
      void main(){
        float r = length(vL)/7.4; vec3 q = vec3(vL*.22, uTime*.12);
        float a = fbm(q + fbm(q*1.7 + 4.)*1.5), b = fbm(q*1.3 - 9.);
        vec3 c = mix(vec3(1., .78, .36), vec3(.30, .78, 1.), smoothstep(.38, .62, a));
        c = mix(c, vec3(1., .42, .62), smoothstep(.48, .7, b)*.7);
        c *= 1.15 * (1. - .4*r*r);
        gl_FragColor = vec4(c, 1.);
        ${FRAG_END}
      }`));
    standIn.position.copy(C).addScaledVector(portalDir, R - 0.9);
    standIn.quaternion.setFromUnitVectors(V3(0, 0, 1), portalDir); standIn.name = 'portalStandIn';
    object.add(standIn);
  }

  // anchors
  const release = C.clone().addScaledVector(portalDir, R + 60), F = { P: V3(), T: V3(), S: V3(), U: V3() }, flyThrough = [];
  for (let s = 0; s < tube.releaseS - 20; s += 30) { tube.frame(s, F); flyThrough.push(F.P.clone().addScaledVector(F.U, 7.5)); }
  flyThrough.push(release.clone(), C.clone().addScaledVector(portalDir, R + 30), seat.clone());
  tube.frame(tube.releaseS - 120, F);
  const anchors = {
    portalSeat: { position: seat.clone(), normal: portalDir.clone(), radius: 7, pitchDeg: 40 },
    release, flyThrough,
    tube: { curve: tube.curve, length: tube.length, radius: tube.radius, releaseS: tube.releaseS, bandLength: 4.8 },
    viewpoints: {
      reveal: { position: F.P.clone().addScaledVector(F.U, 7.5), target: C.clone().add(V3(0, -60, 0)) },
      lowFront: { position: V3(0, 30, 560), target: C.clone() },
      side: { position: V3(430, 190, 340), target: C.clone() },
    },
    lensOffset: { behind: 7, above: 7.5 },
    nucleus: { center: C.clone(), radius: R },
  };

  let driven = false, lastS = 0, lastO = {};
  const s0 = 30, span = tube.releaseS + 50 - s0;
  const hero = {
    object, radius: 300, height: 2 * R, center: C.clone(), anchors, ground: false, groundY: 0,
    vehicle: vehicle ? { object: vehicle.object, walker: vehicle.walker, bubble: vehicle.bubble, state: vehicle.state } : null,
    portalStandIn: standIn, shared, pal, tubeFrame: tube.frame, junction: tube.junction,
    setProgress(u) { uOpen.value = Math.min(1, Math.max(0, u)); },
    setWalker(s, o = {}) { driven = true; lastS = s; lastO = o; },                 // posed once a frame, in update()
    update(dt, time) {
      shared.uTime.value = time;
      if (!vehicle) return;
      if (driven) vehicle.pose(lastS, time, lastO); else vehicle.pose(s0 + ((time * 12) % span), time);
    },
    dispose() {},
  };
  hero.update(0, 0);
  return hero;
}
