// Across the Sea of Ice, the hero set piece: THE SEA OF ICE. A river of ice heaved into frozen waves and split by rifts whose
// walls glow blue far down, its run out into the flat floes of a frozen ocean, and the makers of what crosses it: the bounding
// figure (a tall dark shape in a long coat, without a face), the ship locked in the ice, the dog sledge, the arch of blue ice.
// Everything here is a maker: the world lays the place (where the ice lies, how wide, how high) and hands it in.
//
// One ground material for land, snow and ice (makeLandMaterial): the albedo is the vertex's, the light is the world's (uniforms
// kept by the world: sun, sky, ground, the storm's flash, the height below which the low sun does not reach, the portal's light),
// and ice glows from inside by its DEPTH below the surface it was cut from (a vertex measure, so a rift's wall deepens in blue
// by geometry). Rifts are cut by the mesh's own rows: a rift is a few rows of the strip (lip, wall, floor, wall, lip).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';

const TAU = Math.PI * 2;
export const col3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------- the world's light, shared by every material made here
// LIGHT BY EACH THING'S OWN PLACE. The world holds four hours, each standing over its own country along the plan's north
// (s = -z): hour 0 south of the first join, hour 1 to the second, hour 2 to the third, hour 3 beyond. A fragment takes the
// sun, the sky light, the ground light and the fog of the place IT lies at; nothing here reads where the eye is, except the
// distance the fog needs. The storm's flash (on the world's clock) reaches a ground by that ground's own distance from hour 0.
const v3s = (n) => { const a = []; for (let i = 0; i < n; i++) a.push(new THREE.Vector3()); return a; };
export function makeLightUniforms() {
  return {
    // the joins: plan metres where each begins (uJA) and ends (uJB)
    uJA: { value: new THREE.Vector3(1e6, 2e6, 3e6) }, uJB: { value: new THREE.Vector3(1e6 + 1, 2e6 + 1, 3e6 + 1) },
    uSunDirH: { value: v3s(4) }, uSunColH: { value: v3s(4) }, uSkyColH: { value: v3s(4) }, uGndColH: { value: v3s(4) },
    uFogColH: { value: v3s(4) }, uFogDenH: { value: new THREE.Vector4(0, 0, 0, 0) }, uZenH: { value: v3s(4) },
    uFlashPos: { value: new THREE.Vector3(0, 300, 0) }, uFlashCol: { value: new THREE.Color(0.8, 0.86, 1) }, uFlashAmt: { value: 0 },
    // the low sun's shade line of hour 1 (a band of heights), the cloud shadows of hour 2, the glow inside the ice, the clock
    uShadeY: { value: new THREE.Vector2(-1000, -999) }, uShadeOn: { value: 0 }, uGlow: { value: 1 }, uCloudAmt: { value: 0 }, uTime: { value: 0 },
    // the floor that shade line is measured above: a valley floor rising from plan metre x over y metres by z metres (power w)
    uFloorK: { value: new THREE.Vector4(0, 1, 0, 1) },
    // the wind over the open ice (metres a second along x and z): the drift snow runs before it
    uWind: { value: new THREE.Vector2(5, -1.5) },
    uPortal: { value: new THREE.Vector4(0, -9999, 0, 1) }, uPortalCol: { value: new THREE.Color(0, 0, 0) },
    // a fire's own light on what stands round it (place and reach in metres, colour)
    uFire: { value: new THREE.Vector4(0, -9999, 0, 1) }, uFireCol: { value: new THREE.Color(0, 0, 0) },
    // two lamps (a ship's lanterns, her stern window): their warm light on the faces round them
    uLamp: { value: new THREE.Vector4(0, -9999, 0, 1) }, uLamp2: { value: new THREE.Vector4(0, -9999, 0, 1) }, uLampCol: { value: new THREE.Color(0, 0, 0) },
    // the broken ice (floes only): how far the leads stand open (0..1) and the swell's height
    uOpen: { value: 0 }, uSwell: { value: 0 },
  };
}
// one hour's light written into its place of the four: o = { sunDir (Vector3), sun, sky, gnd, fog, zen ([r, g, b] linear), fogDen }
export function setHour(U, i, o) {
  U.uSunDirH.value[i].copy(o.sunDir).normalize();
  for (const [k, n] of [['sun', 'uSunColH'], ['sky', 'uSkyColH'], ['gnd', 'uGndColH'], ['fog', 'uFogColH'], ['zen', 'uZenH']]) if (o[k]) U[n].value[i].set(o[k][0], o[k][1], o[k][2]);
  U.uFogDenH.value.setComponent(i, o.fogDen ?? 0.0005);
}
const PLACE = /* glsl */`uniform vec3 uJA, uJB, uSunDirH[4], uSunColH[4], uSkyColH[4], uGndColH[4], uFogColH[4], uZenH[4], uFlashPos, uFlashCol, uPortalCol, uFireCol, uLampCol;
uniform vec4 uFogDenH, uPortal, uFire, uFloorK, uLamp, uLamp2; uniform float uFlashAmt, uGlow, uCloudAmt, uTime, uShadeOn; uniform vec2 uShadeY, uWind;
// how far the low sun reaches down at a place: 0 in the shade under the band of heights over the valley's own floor, 1 above it
float sunReach(vec3 w){ float f = uFloorK.z*pow(max(clamp((-w.z - uFloorK.x)/max(uFloorK.y, 1.), 0., 1.), .0001), uFloorK.w); return smoothstep(uShadeY.x, uShadeY.y, w.y - f); }
struct PlaceLight { vec3 k; vec3 sunDir; vec3 sunCol; vec3 skyCol; vec3 gndCol; vec3 fogCol; vec3 flashDir; float fogDen; float shadeK; float cloud; float flash; };
vec3 hourK(float s){ return smoothstep(uJA, uJB, vec3(s)); }
vec3 mixH(vec3 a, vec3 b, vec3 c, vec3 d, vec3 k){ return mix(mix(mix(a, b, k.x), c, k.y), d, k.z); }
PlaceLight placeLight(vec3 w){
  PlaceLight L; vec3 k = hourK(-w.z); L.k = k;
  L.sunDir = normalize(mixH(uSunDirH[0], uSunDirH[1], uSunDirH[2], uSunDirH[3], k));
  L.sunCol = mixH(uSunColH[0], uSunColH[1], uSunColH[2], uSunColH[3], k);
  L.skyCol = mixH(uSkyColH[0], uSkyColH[1], uSkyColH[2], uSkyColH[3], k);
  L.gndCol = mixH(uGndColH[0], uGndColH[1], uGndColH[2], uGndColH[3], k);
  L.fogCol = mixH(uFogColH[0], uFogColH[1], uFogColH[2], uFogColH[3], k);
  L.fogDen = mix(mix(mix(uFogDenH.x, uFogDenH.y, k.x), uFogDenH.z, k.y), uFogDenH.w, k.z);
  L.shadeK = uShadeOn*k.x*(1.-k.y); L.cloud = uCloudAmt*k.y*(1.-k.z);
  L.flash = uFlashAmt*(1.-smoothstep(uJA.x, uJB.x + 160., -w.z)); L.flashDir = normalize(uFlashPos - w);
  L.fogCol = mix(L.fogCol, vec3(.27, .36, .6), min(.6, .35*L.flash));
  return L;
}
// a small light at a place: what a surface at w facing n takes of it
vec3 pointLight(vec4 at, vec3 col, vec3 w, vec3 n){ vec3 pd = at.xyz - w; float pl = max(length(pd), .001), pk = clamp(1. - pl/max(at.w, 1.), 0., 1.); return col*pk*pk*(.35 + .65*clamp(dot(n, pd/pl), 0., 1.)); }
// every small light of the place on a face: the ring, the fire, the lamps
vec3 smallLights(vec3 w, vec3 n){ return pointLight(uPortal, uPortalCol, w, n) + pointLight(uFire, uFireCol, w, n) + pointLight(uLamp, uLampCol, w, n) + pointLight(uLamp2, uLampCol, w, n); }
vec3 placeFog(vec3 c, PlaceLight L, float d){ return mix(c, L.fogCol, 1.-exp(-L.fogDen*L.fogDen*d*d)); }`;
// the first lines of a fragment's main: the light of this fragment's own place, under the names the shading below uses
const PLACE_HEAD = /* glsl */`  PlaceLight PL = placeLight(vW);
  vec3 uSunDir = PL.sunDir, uSunCol = PL.sunCol, uSkyCol = PL.skyCol, uGndCol = PL.gndCol, uFlashDir = PL.flashDir; float uFlash = PL.flash;
`;

// ---------------------------------------------------------------- the ground: land, snow, ice
// attributes: position, normal, aCol (linear albedo), aMix (ice 0..1, snow 0..1, depth in metres below the surface it was cut from)
// floe: the same look for plates of ice that part and rock (aFloe: the plate's middle x, z and its drift x, z at the full)
export function makeLandMaterial(U, o = {}) {
  const floe = !!o.floe;
  return new THREE.ShaderMaterial({
    uniforms: { ...U }, defines: floe ? { FLOE: 1 } : {},
    vertexShader: /* glsl */`attribute vec3 aCol, aMix; varying vec3 vCol, vMix, vW, vN;
#ifdef FLOE
attribute vec4 aFloe; uniform float uOpen, uSwell, uTime;
#endif
varying float vFd;
void main(){
  vec3 p = position, n = normal;
#ifdef FLOE
  // a plate of ice: it drifts by its own measure as the leads open (aFloe.zw: metres at the full), turns a little about its
  // own middle, rides the swell that runs under the ice and rocks
  vec2 c = aFloe.xy; float ph = fract(c.x*.137 + c.y*.071)*6.283;
  float sw = sin(c.y*.045 + uTime*.9 + ph*.3), sw2 = cos(c.x*.05 - uTime*.7 + ph);
  float tiltX = uSwell*(.05*sw + .025*sin(uTime*1.3+ph)), tiltZ = uSwell*(.04*sw2);
  vec3 q = p - vec3(c.x, 0., c.y);
  float ang = (fract(ph*3.7)-.5)*.11*uOpen, ca = cos(ang), sa = sin(ang);
  q.xz = vec2(q.x*ca - q.z*sa, q.x*sa + q.z*ca);
  n.xz = vec2(n.x*ca - n.z*sa, n.x*sa + n.z*ca);
  q.y += q.x*tiltZ + q.z*tiltX;
  n = normalize(n + vec3(-tiltZ, 0., -tiltX)*n.y);
  q.xz += aFloe.zw*uOpen;
  q.y += uSwell*.55*sw;
  p = q + vec3(c.x, 0., c.y);
#endif
  vec4 wp = modelMatrix*vec4(p, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*n); vCol = aCol; vMix = aMix;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  vFd = -mvPosition.z;
}`,
    fragmentShader: /* glsl */`${PLACE}
varying vec3 vCol, vMix, vW, vN;
${fx.GLSL_NOISE}
varying float vFd;
void main(){
${PLACE_HEAD}
  float ice = clamp(vMix.x, 0., 1.), snow = clamp(vMix.y, 0., 1.), depth = clamp(vMix.z, 0., 60.), rock = clamp(1.-ice-snow, 0., 1.);
  // the facet's own normal (crisp ice, masonry-hard rock) mixed with the smooth one
  vec3 cr = cross(dFdx(vW), dFdy(vW)); float cl = length(cr);
  vec3 N = normalize(vN), fn = cl > 1e-9 ? cr/cl : N; if (dot(fn, N) < 0.) fn = -fn;
  N = normalize(mix(N, fn, .2 + .5*ice + .65*rock));
  float n1 = vnoise(vW.xz*.31), n2 = vnoise(vW.xz*1.9 + vW.y*.7), n3 = vnoise(vec2(vW.x*.6+vW.z*.6, vW.y*1.6)*.35), n4 = vnoise(vW.xz*.045);
  // small relief from the noise's own slope
  vec2 g = vec2(vnoise(vW.xz*1.9 + vec2(.35, 0.) + vW.y*.7) - n2, vnoise(vW.xz*1.9 + vec2(0., .35) + vW.y*.7) - n2);
  N = normalize(N + vec3(g.x, 0., g.y)*(.9*rock*smoothstep(.45, .9, fn.y) + .45*snow + .3*ice));
  // ROCK takes its grain in world space on three planes, each weighed by how the facet faces it (no stripes drawn down a
  // face): masses 20 m across, blocks of 5 m, a grain of 0.8 m and one of 0.25 m that holds at 5 m from the eye
  vec3 tw = fn*fn; tw /= (tw.x + tw.y + tw.z);
  float r1 = vnoise(vW.zy*.05)*tw.x + vnoise(vW.xz*.05)*tw.y + vnoise(vW.xy*.05)*tw.z, r2 = vnoise(vW.zy*.21 + 3.)*tw.x + vnoise(vW.xz*.21 + 3.)*tw.y + vnoise(vW.xy*.21 + 3.)*tw.z;
  float r3 = vnoise(vW.zy*1.3)*tw.x + vnoise(vW.xz*1.3)*tw.y + vnoise(vW.xy*1.3)*tw.z, r4 = vnoise(vW.zy*4.1)*tw.x + vnoise(vW.xz*4.1)*tw.y + vnoise(vW.xy*4.1)*tw.z;
  vec3 albedo = vCol*mix((.84 + .2*n1 + .12*n2)*(.9 + .2*n4), (.58 + .56*r1)*(.76 + .48*r2)*(.84 + .32*r3)*(.9 + .2*r4), rock);
  // steep rock shows its beds (a dark line 0.8 m thick every 8 m of height, lifted by the masses: it reads from 200 m) and
  // its upright joints, about 11 m apart along the face
  float steep = rock*(1. - smoothstep(.5, .88, normalize(vN).y));
  float bed = abs(fract(vW.y*.125 + .9*r1) - .5);
  vec2 along = normalize(vec2(-vN.z, vN.x) + vec2(1e-4));
  float jv = abs(vnoise(vec2(dot(vW.xz, along)*.09, vW.y*.012) + 3.7) - .5);
  albedo *= mix(1., (.68 + .32*smoothstep(.0, .05, bed))*(.76 + .24*smoothstep(.0, .022, jv)), steep);
  float inner = 1.-exp(-depth*.2);
  // ice deepens to blue with its depth below the surface
  albedo = mix(albedo, vec3(.1, .34, .62), ice*inner*.82);
  float wrap = .3*max(ice, snow), ndl = dot(N, uSunDir), dif = clamp((ndl + wrap)/(1. + wrap), 0., 1.);
  // the low sun does not reach below the valley's shade line; cloud shadows cross the open ice
  float shade = mix(1., sunReach(vW), PL.shadeK);
  float cloud = 1.-PL.cloud*smoothstep(.42, .7, vnoise(vW.xz*.0042 + uTime*vec2(.05, .02)));
  float ao = exp(-depth*.075);
  vec3 amb = mix(uGndCol, uSkyCol, N.y*.5 + .5);
  vec3 c = albedo*(uSunCol*dif*shade*cloud*ao + amb*(.3 + .7*ao));
  // light from inside the ice: strongest far down the rifts, a little on every lit facet's edge
  float lum = dot(uSkyCol + uSunCol*.35, vec3(.3, .5, .2));
  c += ice*uGlow*vec3(.1, .52, .95)*(inner*inner*(.75 + .5*n2)*(.35 + lum*.55) + .04*lum*(1.-N.y));
  // snow glitter in the sun
  float sp = smoothstep(.93, 1., vnoise(vW.xz*9. + N.xz*3.));
  c += (snow + .5*ice)*(1.-inner)*sp*uSunCol*dif*shade*.5;
  // drift snow running low over the open ice before the wind, on the world's clock: pale streaks that pass over the snow
  // and the ice of the ice river and the frozen ocean (never down a rift's wall)
  float wl = max(length(uWind), .01); vec2 wd = uWind/wl; float al = dot(vW.xz, wd) - uTime*wl, ac = dot(vW.xz, vec2(-wd.y, wd.x));
  float sn = vnoise(vec2(al*.045, ac*.26))*.6 + vnoise(vec2(al*.11 + 7., ac*.6))*.4;
  // (r2: and fine snakes of it, 3 m long, within 120 m of the eye, gone by 380 m where they would be finer than the picture)
  sn = mix(sn, vnoise(vec2(al*.3 + 3., ac*1.3)), .4*(1. - smoothstep(120., 380., length(cameraPosition - vW))));
  // (r2: over the great waves too: on every face lying flatter than 60 degrees, at .65 of the snow's light)
  // (its own place: it comes on over the 50 m about the snout's brink, 20 m before the ice's hour begins to 30 m after, and
  // holds from there to the ice's edge: a thing of the ice, not of the hour)
  float drift = (smoothstep(.3, .8, sn) - .45)*smoothstep(uJA.y - 20., uJA.y + 30., -vW.z)*(snow + .6*ice)*(1. - inner)*smoothstep(.45, .8, N.y);
  c *= 1. + .65*drift;
  // the storm's flash, and the ring's light on what stands round it
  c += albedo*uFlashCol*uFlash*(.3 + .7*clamp(dot(N, uFlashDir), 0., 1.));
  c += albedo*smallLights(vW, N);
  // the lights of the north stand faintly on the snow and ice of the dusk's own country
  c += (snow + ice)*vec3(.1, 1., .48)*.04*PL.k.z*max(N.y, 0.)*(.5 + vnoise(vW.xz*.012 + uTime*.03));
  // OPEN WATER in a lead (a depth of -1): dark, mirroring the sky of its place; the low sun's light stands in it, and the
  // green of the north
  float water = 1. - smoothstep(-.9, -.5, vMix.z);
  if (water > 0.) {
    vec3 Vw = normalize(cameraPosition - vW), wa = vnoised(vW.xz*.7 + uTime*vec2(.3, .2));
    vec3 Nw = normalize(vec3(-wa.y*.22, 1., -wa.z*.22)), Rw = reflect(-Vw, Nw);
    float fr = .04 + .96*pow(1. - clamp(dot(Nw, Vw), 0., 1.), 5.), sr = max(dot(Rw, uSunDir), 0.);
    vec3 skyw = mix(PL.fogCol, mixH(uZenH[0], uZenH[1], uZenH[2], uZenH[3], PL.k), pow(clamp(Rw.y, 0., 1.), .45));
    vec3 wc = mix(vec3(.004, .008, .014), skyw, fr) + uSunCol*(pow(sr, 90.)*5. + pow(sr, 10.)*.45) + vec3(.1, 1., .48)*.07*PL.k.z*fr + smallLights(vW, Nw)*.25;
    c = mix(c, wc, water);
  }
  gl_FragColor = vec4(c, 1.);
  gl_FragColor.rgb = placeFog(gl_FragColor.rgb, PL, vFd);
}`,
  });
}

// ---------------------------------------------------------------- accumulators
// land: indexed corners with (albedo, ice, snow, depth); smooth normals from the faces
export function makeAcc() {
  const P = [], C = [], M = [], I = [], F = [];
  const A = {
    get count() { return P.length / 3; }, get triangles() { return I.length / 3; },
    v(x, y, z, c, ice = 0, snow = 0, depth = 0) { P.push(x, y, z); C.push(c[0], c[1], c[2]); M.push(ice, snow, depth); return P.length / 3 - 1; },
    floe(cx, cz, dx, dz) { while (F.length / 4 < P.length / 3) F.push(cx, cz, dx, dz); },
    tri(a, b, c) { I.push(a, b, c); },
    quad(a, b, c, d) { I.push(a, b, c, a, c, d); },
    async buildBy(ctx, withFloe = false) {
      const n = P.length / 3, pos = new Float32Array(P), nor = new Float32Array(n * 3);
      for (let k = 0; k < I.length; k += 3) {
        const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
        if (ctx && k % 90000 === 89997) await ctx.yield();
      }
      for (let k = 0; k < n * 3; k += 3) { const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1; nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l; }
      if (ctx) await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(C), 3)); g.setAttribute('aMix', new THREE.BufferAttribute(new Float32Array(M), 3));
      if (withFloe) { while (F.length / 4 < n) F.push(0, 0, 0, 0); g.setAttribute('aFloe', new THREE.BufferAttribute(new Float32Array(F), 4)); }
      g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(I), 1) : new THREE.BufferAttribute(new Uint16Array(I), 1));
      g.computeBoundingSphere();
      return g;
    },
  };
  return A;
}
// props (ship, castle, stump, sledge): flat faces with a colour each, for a lit vertex-colour material
export function makeProp() {
  const P = [], N = [], C = [], T = [];
  let tag = null;
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3();
  const B = {
    get triangles() { return P.length / 9; },
    tri(a, b, c, col, col2) {
      _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]); _c.set(c[0], c[1], c[2]); _n.subVectors(_b, _a).cross(_c.sub(_a)).normalize();
      P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      for (let k = 0; k < 3; k++) { N.push(_n.x, _n.y, _n.z); const q = col2 && k === 2 ? col2 : col; C.push(q[0], q[1], q[2]); if (tag) T.push(tag[0], tag[1], tag[2], tag[3]); else T.push(0, 0, 0, 0); }
    },
    // a mark of four numbers carried by every corner added while it is set (a leg's joint and phase, for a gait in the shader)
    tag(t) { tag = t; },
    quad(a, b, c, d, col, colTop) { B.tri(a, b, c, col, colTop); B.tri(a, c, d, colTop || col, colTop); },
    // a box: middle (x, y, z), half sizes, turned by yaw about y and leaned by pitch about its own x
    box(x, y, z, hx, hy, hz, col, yaw = 0, pitch = 0, top) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const w = (lx, ly, lz) => { const y1 = ly * cp - lz * sp, z1 = ly * sp + lz * cp; return [x + lx * cy + z1 * sy, y + y1, z - lx * sy + z1 * cy]; };
      const q = [w(-hx, -hy, -hz), w(hx, -hy, -hz), w(hx, hy, -hz), w(-hx, hy, -hz), w(-hx, -hy, hz), w(hx, -hy, hz), w(hx, hy, hz), w(-hx, hy, hz)];
      B.quad(q[1], q[0], q[3], q[2], col); B.quad(q[4], q[5], q[6], q[7], col); B.quad(q[0], q[4], q[7], q[3], col); B.quad(q[5], q[1], q[2], q[6], col);
      B.quad(q[3], q[7], q[6], q[2], top || col); B.quad(q[0], q[1], q[5], q[4], col);
    },
    // a tapered round between two points (a mast, a yard, a trunk)
    cyl(a, b, r0, r1, sides, col, col1) {
      const ax = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), u = new THREE.Vector3(1, 0, 0);
      if (Math.abs(ax.x) > 0.9) u.set(0, 1, 0);
      const e1 = new THREE.Vector3().crossVectors(ax, u).normalize(), e2 = new THREE.Vector3().crossVectors(ax, e1);
      const ring = (p, r, k) => { const t = k / sides * TAU, c = Math.cos(t) * r, s = Math.sin(t) * r; return [p[0] + e1.x * c + e2.x * s, p[1] + e1.y * c + e2.y * s, p[2] + e1.z * c + e2.z * s]; };
      for (let k = 0; k < sides; k++) B.quad(ring(a, r0, k), ring(a, r0, k + 1), ring(b, r1, k + 1), ring(b, r1, k), col, col1);
    },
    // a flat band between two points, w wide, lying in the plane that holds the up vector (rope stiff with ice, a ribbon of wood)
    band(a, b, w, col, up = [0, 1, 0]) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      let sx = dy * up[2] - dz * up[1], sy = dz * up[0] - dx * up[2], sz = dx * up[1] - dy * up[0]; const l = Math.hypot(sx, sy, sz) || 1; sx *= w / 2 / l; sy *= w / 2 / l; sz *= w / 2 / l;
      const A1 = [a[0] - sx, a[1] - sy, a[2] - sz], A2 = [a[0] + sx, a[1] + sy, a[2] + sz], B1 = [b[0] - sx, b[1] - sy, b[2] - sz], B2 = [b[0] + sx, b[1] + sy, b[2] + sz];
      B.quad(A1, A2, B2, B1, col); B.quad(A2, A1, B1, B2, col);
    },
    build(withTag = false) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      if (withTag) g.setAttribute('aTag', new THREE.Float32BufferAttribute(T, 4));
      g.computeBoundingSphere();
      return g;
    },
  };
  return B;
}

// ---------------------------------------------------------------- a strip of ground on a grid of rows and columns
// rows nr (advancing toward -z), columns nc (advancing toward +x); at(j, i, o) fills o.x, o.y, o.z, o.c (albedo), o.ice, o.snow, o.depth for a corner; skip(j, i) leaves a
// cell out. Normals come of the corners themselves. Returns the geometry (land attributes).
export async function stripMesh(ctx, nr, nc, at, skip) {
  const n = nr * nc, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), mixA = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  const o = { x: 0, y: 0, z: 0, c: [0, 0, 0], ice: 0, snow: 0, depth: 0 };
  for (let j = 0; j < nr; j++) {
    for (let i = 0; i < nc; i++) {
      const k = (j * nc + i) * 3; o.ice = 0; o.snow = 0; o.depth = 0;
      at(j, i, o);
      pos[k] = o.x; pos[k + 1] = o.y; pos[k + 2] = o.z; col[k] = o.c[0]; col[k + 1] = o.c[1]; col[k + 2] = o.c[2]; mixA[k] = o.ice; mixA[k + 1] = o.snow; mixA[k + 2] = o.depth;
    }
    if (j % 3 === 2) await ctx.yield();
  }
  const idx = [];
  for (let j = 0; j < nr - 1; j++) {
    for (let i = 0; i < nc - 1; i++) {
      if (skip && skip(j, i)) continue;
      const a = j * nc + i, b = a + 1, c = a + nc, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    if (j % 60 === 59) await ctx.yield();
  }
  for (let k = 0; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
    if (k % 90000 === 89997) await ctx.yield();
  }
  for (let k = 0; k < n * 3; k += 3) { const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1; nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l; }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aMix', new THREE.BufferAttribute(mixA, 3));
  g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- THE SEA OF ICE
// The world hands in the place F:
//   route(s) the strip's middle x at plan metre s (z = -s), axis(s) the ice river's middle, offs the columns (metres aside)
//   s0 the snout, sGate where the river ends and the ocean begins, sBreak where the floes begin, sEdge the ice's edge
//   level(s) the ice's mean height, inside(x, s) metres inside the ice's margin (under 0: land), land(x, z, o) the land's corner
//   lane(x, s) metres aside of the flight's plan (the floes' middle), noise, dens (0.7..1.3), streams R { rifts, leads, floes }
// It returns the meshes, the surface's height anywhere (surfAt), the cuts (rifts and leads) and the floes' plates.
const WAVE_L = 36, WAVE_A = 2.4, FURROW = [6, 18];
const C_SNOW = col3('#e6edf6'), C_ICE = col3('#b4dcee'), C_ICE_OLD = col3('#93c4dd'), C_MORAINE = col3('#55595c'), C_WATER = col3('#05090f');
export async function makeIceSea(ctx, U, F, R) {
  const noise = F.noise, dens = F.dens ?? 1;
  // the slow warp that bends crests and rifts alike (metres along the flow, by the place across it)
  const warp = (x, sw) => 14 * noise.n2(x * 0.006 + 3.1, sw * 0.004) + 5 * noise.n2(x * 0.02, sw * 0.011 + 7);
  // the row coordinate of a place: s = sw + warp(x, sw) * k, k the share of the warp the place has (none on land)
  const warpK = (x, s) => smoothstep(0, 30, F.inside(x, s)) * (1 - smoothstep(F.sBreak - 90, F.sBreak - 30, s));
  const swOf = (x, s) => { const k = warpK(x, s); if (k <= 0) return s; let sw = s - k * warp(x, s); sw = s - k * warp(x, sw); return sw; };
  // how heaved the ice is: a troubled sea on the river, long low swells of old snow on the ocean
  const amp = (s) => lerp(1, 0.2, smoothstep(F.sGate - 70, F.sGate + 50, s));
  // THE WAVES OF THE SEA OF ICE. Beside the line they are great frozen waves 6 to 14 m from trough to crest (a wave of
  // 36 m cannot stand higher than about 14 m; under 6 m it is a ripple from the eye's height): a quarter of the height
  // lies under the ice's mean level and three quarters over it, so the crests stand 4.5 to 10.5 m over the mean. Which
  // hand has the higher sea changes slowly along the river (the two hands' shares sum to one, so one hand at least has
  // waves of 10 m and more at every place). ALONG THE LINE'S PLAN LIES A FURROW, the medial furrow of the ice river (the
  // line of old melt water): within 6 m of it the ice is 1.2 m under the mean with waves of 2.4 m only (bare blue
  // ice with drifts of snow lying on it), and the great waves come on between 6 and 18 m aside. The line runs in the furrow, so the crests on its hands stand to and over it.
  const hph = 6.283 * (0.5 + 0.5 * noise.n2(F.s0 * 0.013, 7.7));
  const waveAt = (x, sw, s = sw) => {
    // (a wave's crest wanders a few metres about its row and rises and dies along its own length; its lee side is steeper)
    const ph0 = sw * TAU / WAVE_L + 0.5 * noise.n2(x * 0.011, sw * 0.004) + 0.3 * noise.n2(x * 0.03 + 5, sw * 0.02), ph = ph0 + 0.6 * Math.sin(ph0 + 0.8);
    const t = 0.5 + 0.5 * Math.sin(ph), u = x - F.route(sw), fur0 = 1 - smoothstep(FURROW[0], FURROW[1], Math.abs(u));
    // (r3, THE FIGURE'S PLACE: in the whole wedge between the line and his round, from where he comes within sight, the ice
    // lies at the furrow's own low law (zk: the place gives the wedge's reach aside at every row), and at his round stands
    // an ice rise (bw its share, rise its height over the mean): its brow tilts up away from the line and up along the way,
    // 4.4 to 8 m over the mean, its own waves kept under a knee, so every place on the brow faces the line)
    // (the place is laid in true metres of the way, s, not in the rows' bent coordinate)
    const Z = F.figZone, zl = Z ? Z.lim(s) : 0, uD = zl > 0 ? (x - F.route(s)) * Z.D : 0, zk = zl > 0 && uD > 0 ? Z.on(s) * (1 - smoothstep(zl, zl + 14, uD)) : 0, fur = Math.max(fur0, zk);
    const bw = zk > 0 ? smoothstep(Z.b0 - 9, Z.b0, uD) * smoothstep(Z.sA - 14, Z.sA, s) * (1 - smoothstep(Z.sB, Z.sB + 14, s)) : 0;
    const rise = bw > 0 ? bw * (4.4 + 2 * clamp((uD - Z.b0) / (Z.b1 - Z.b0), 0, 1) + 1.6 * clamp((s - Z.sA) / (Z.sB - Z.sA), 0, 1)) : 0;
    const share = 0.5 + 0.5 * Math.sin(sw * TAU / 230 + hph) * (u >= 0 ? 1 : -1);
    const H = 6 + 8 * clamp(0.62 * share + 0.38 * (0.5 + 0.5 * noise.n2(x * 0.017 + 3, sw * 0.012)) + 0.19, 0, 1);
    // (a crest is sharp and its back is rough with wind-cut ridges; the hollows between are wide)
    const great = H * (Math.pow(t, 2.1) - 0.25) + 1.5 * noise.n2(x * 0.045, sw * 0.045) + 1.3 * t * Math.abs(noise.n2(x * 0.1 + 4, sw * 0.035)), small = 2.4 * (Math.pow(t, 1.5) - 0.5) - 1.2 + 0.5 * noise.n2(x * 0.045, sw * 0.045);
    return lerp(great, small * (1 - 0.9 * bw) + rise, fur) + 0.3 * (1 - 0.8 * bw) * noise.n2(x * 0.13, sw * 0.13);
  };
  // CUTS: rifts across the river (deep, blue) and leads across the ocean (to black water). Each: its row coordinate sw, its
  // greatest width w and depth D, its reach x0..x1 (metres aside of the axis), tapering to nothing over its last 40 m
  const cuts = [];
  {
    // (a rift opens where the ice is bent most: on the upstream face of a wave, where the surface climbs to the crest, so
    // its downstream wall stands higher than its upstream lip; nine waves in ten have one, fewer where the ice is thinner)
    const rr = R.rifts;
    for (let k = Math.ceil((F.s0 + 46) / WAVE_L); k * WAVE_L < F.sGate + 10; k++) {
      const w = rr.range(5, 10), len = rr.range(240, 330), mid = rr.range(-30, 30), D = rr.range(13, 22), off = rr.range(0, 5), on = rr.chance(Math.min(0.95, 0.9 * dens));
      // (r3: the place may bound a cut's reach aside of the axis at its row: the sledges' round is crossed by none)
      const swk = k * WAVE_L + off, lim = (F.cutLimit && F.cutLimit(swk, (x) => swk + warp(x, swk) * warpK(x, swk))) || [-1e9, 1e9];
      // (an end the place has set tapers over the place's own length, lim[2]: a rift may end short at a standing mass)
      const x0 = mid - len / 2, x1 = mid + len / 2;
      if (on) cuts.push({ kind: 0, sw: k * WAVE_L + off, w, D, x0: Math.max(x0, lim[0]), x1: Math.min(x1, lim[1]), tap: 40, tapA: lim[0] > x0 ? lim[2] : undefined, tapB: lim[1] < x1 ? lim[2] : undefined });
    }
    const lr = R.leads; let s = F.sGate + lr.range(40, 60);
    while (s < F.sBreak - 30) {
      const w = lr.range(3, 10), len = lr.range(160, 420), mid = lr.range(-120, 120), lim = F.leadLimit || [-1e9, 1e9];
      // (the place may bound the leads' reach aside of the axis: a sledge's way is kept whole)
      const sl = s, lim2 = (F.cutLimit && F.cutLimit(sl, (x) => sl + warp(x, sl) * warpK(x, sl))) || [-1e9, 1e9];
      cuts.push({ kind: 1, sw: s, w, D: 1.5, x0: Math.max(mid - len / 2, lim[0], lim2[0]), x1: Math.min(mid + len / 2, lim[1], lim2[1]), tap: 30 });
      s += lr.range(46, 80) / dens + w;
    }
  }
  const taper = (c, xa) => smoothstep(c.x0, c.x0 + (c.tapA || c.tap), xa) * (1 - smoothstep(c.x1 - (c.tapB || c.tap), c.x1, xa));
  // a cut's depth at a row coordinate (its section: lip, a wall 0.5 m thick, a floor)
  const cutDepth = (x, s, sw) => {
    let d = 0;
    for (let k = 0; k < cuts.length; k++) {
      const c = cuts[k], t = Math.abs(sw - c.sw);
      if (t > c.w * 0.5) continue;
      const tp = taper(c, x - F.axis(s)), hw = c.w * 0.5 * tp;
      if (t >= hw) continue;
      const wall = Math.min(0.5, hw * 0.4), dd = c.D * Math.pow(tp, 0.7) * (c.kind ? 1 : 1 - 0.15 * (t / hw));
      d = Math.max(d, t > hw - wall ? dd * 0.85 * (hw - t) / wall : dd * (0.85 + 0.15 * (1 - t / (hw - wall))));
    }
    return d;
  };
  // the uncut surface (what a rift's depth is measured below) and the surface itself, anywhere on the ice
  const _l = { x: 0, y: 0, z: 0, c: [0, 0, 0], ice: 0, snow: 0, depth: 0 };
  // (r3: where the place sweeps the ice level, the sledges' ground and the wedge between it and the line, the swells keep
  // a sixteenth of their height)
  const topAt = (x, s, sw, ins) => F.level(s) + waveAt(x, sw, s) * amp(s) * smoothstep(4, 40, ins) * (F.swept ? 1 - 0.9375 * F.swept(x, s) : 1);
  const surfAt = (x, z) => {
    const s = -z, ins = F.inside(x, s);
    if (ins <= 0) { F.land(x, z, _l); return _l.y; }
    const sw = swOf(x, s), top = topAt(x, s, sw, ins) - cutDepth(x, s, sw);
    const k = smoothstep(0, F.rim ?? 12, ins);
    if (k >= 1) return top;
    F.land(x, z, _l);
    return lerp(_l.y, top, k);
  };
  // ROWS: every 2.6 m on the river, 6 m on the ocean, and five rows to each cut (lips, walls' feet, floor), none nearer a cut
  // than its half width and 1.3 m
  const rows = [];
  for (let s = F.s0 - 40; s < F.sEdge + 0.01; s += (s < F.sGate + 60 ? 2.6 : 6)) {
    let near = false; for (const c of cuts) if (Math.abs(s - c.sw) < c.w * 0.5 + 1.3) near = true;
    if (!near && Math.abs(s - F.sBreak) > 2.5) rows.push({ sw: s, cut: null, t: 0 });
  }
  rows.push({ sw: F.sBreak, cut: null, t: 0 });
  // (a cut's rows: t -2 and 2 its lips, -1 and 1 its walls' feet, 0 its floor)
  for (const c of cuts) for (const t of [-2, -1, 0, 1, 2]) rows.push({ sw: c.sw, cut: c, t });
  const rowKey = (r) => r.sw + (r.cut ? r.t * r.cut.w * 0.25 : 0);
  rows.sort((a, b) => rowKey(a) - rowKey(b));
  await ctx.yield();
  // THE STRIP: one mesh of land, margin and ice. A corner on land is the land's; on the ice it is the surface, cut where a
  // rift's row passes; within the rim of the margin the ice comes down to the land (the snout's cliff, the moraine's edge)
  const offs = F.offs, nc = offs.length, nr = rows.length, rim = F.rim ?? 12;
  const at = (j, i, o) => {
    const r = rows[j], x0 = F.route(r.sw) + offs[i];
    let sw = r.sw, depth = 0, lead = 0;
    if (r.cut) {
      const c = r.cut, tp = taper(c, x0 - F.axis(c.sw)), hw = c.w * 0.5 * tp, wall = Math.min(0.5, hw * 0.4), dd = c.D * Math.pow(tp, 0.7);
      const a = Math.abs(r.t);
      sw = c.sw + Math.sign(r.t) * (a === 2 ? hw : a === 1 ? hw - wall : 0);
      depth = a === 2 ? 0 : a === 1 ? dd * 0.85 : dd;
      lead = c.kind && a < 2 && tp > 0.05 ? 1 : 0;
      // (a lead's water lies level from wall to wall, 1.3 m under its lips)
      if (lead) depth = 1.3;
    }
    // the place of the corner: across by its column, along by its row coordinate and the warp there
    const k0 = warpK(x0, sw), s = sw + (k0 > 0 ? k0 * warp(x0, sw) : 0), x = F.route(s) + offs[i], z = -s, ins = F.inside(x, s);
    o.x = x; o.z = z;
    if (ins <= 0) { F.land(x, z, o); o.y -= 0.02; if (ins > -9) { const m = smoothstep(-9, -1, ins) * 0.7; o.c = mix3(o.c, C_MORAINE, m); o.snow *= 1 - m; } return; }
    const top = topAt(x, s, sw, ins), k = smoothstep(0, rim, ins), old = smoothstep(-0.4, 0.5, noise.n2(x * 0.016 + 9, s * 0.016));
    let y = top - depth;
    if (k < 1) { F.land(x, z, _l); y = lerp(_l.y - 1.5, y, k); }
    o.y = y;
    // snow lies on the crests and all over the ocean; the troughs and the rifts' lips are bare blue ice
    const crest = smoothstep(-1.2, 1.6, (top - F.level(s)) / Math.max(0.25, amp(s))), ocean = smoothstep(F.sGate - 40, F.sGate + 80, s);
    // (the furrow's floor is bare blue ice with drifts of snow across it)
    const furK = (1 - smoothstep(FURROW[0], FURROW[1], Math.abs(offs[i]))) * (1 - ocean), driftS = smoothstep(-0.15, 0.35, noise.n2(x * 0.05 + 2, s * 0.11 + 5));
    const snow = clamp(lerp(0.25 + 0.6 * crest, 0.86 + 0.14 * crest, ocean) - 0.35 * old * (1 - ocean), 0, 1) * (depth > 0.01 ? 0 : 1) * k * (1 - furK * (1 - driftS) * 0.85);
    o.c = mix3(mix3(C_ICE, C_ICE_OLD, old), C_SNOW, snow);
    // the margin's ice is dirty with the moraine's grit
    if (k < 1) o.c = mix3(mix3(C_MORAINE, C_ICE_OLD, 0.35), o.c, smoothstep(0.15, 1, k));
    // (the hollows of the great waves are bare old ice in blue shade)
    o.ice = 1 - snow; o.snow = snow; o.depth = depth + (1 - k) * 2 + (depth > 0.01 ? 0 : Math.max(1.7 * (1 - crest) * (1 - furK), 1.1 * furK * (1 - driftS)) * (1 - ocean) * k);
    // (water: the ground material knows it by a depth of -1 and draws the sky and the low sun standing in it)
    if (lead) { o.c = C_WATER; o.ice = 0; o.snow = 0; o.depth = -1; }
  };
  // (cells of the middle where the floes lie are left out: the plates are their own mesh)
  const skip = (j, i) => { const r = rows[j + 1]; return r.sw > F.sBreak && Math.abs(offs[i] + offs[i + 1]) * 0.5 < F.floeHalf; };
  const geo = await stripMesh(ctx, nr, nc, at, skip);
  const mesh = new THREE.Mesh(geo, makeLandMaterial(U)); mesh.name = 'sea-of-ice';
  await ctx.yield();
  return { mesh, material: mesh.material, warp, swOf, amp, waveAt, cuts, taper, cutDepth, topAt, surfAt, rows };
}

// ---------------------------------------------------------------- blocks of ice (seracs, the slabs of a pressure ridge, bergy bits)
// an irregular block: middle of its foot (x, y, z), half sizes, turned and tipped; snow on its top, old blue ice on its sides
export function blockInto(A, rng, x, y, z, hx, hy, hz, yaw, tipX = 0, tipZ = 0, sink = 0.6) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), id = [], cap = [], skirt = [], j = () => rng.range(0.72, 1.12);
  for (let k = 0; k < 8; k++) {
    const sx = k & 1 ? 1 : -1, top = k & 2 ? 1 : 0, sz = k & 4 ? 1 : -1, lx = sx * hx * j() * (top ? 0.8 : 1), lz = sz * hz * j() * (top ? 0.8 : 1);
    const ly = top ? 2 * hy * j() + lx * tipZ + lz * tipX : -sink;
    // (the sides are old blue ice from foot to brow, darkest at the foot where the block meets the snow: no pale pane)
    const px = x + lx * cy + lz * sy, pz = z - lx * sy + lz * cy;
    // (r2: the brow is dusted with snow, 0.65 of it, so a heap of them reads as thrown-up ice under snow and not as blue dice)
    id.push(A.v(px, y + ly, pz, top ? C_ICE : C_ICE_OLD, top ? 0.35 : 1, top ? 0.65 : 0, top ? 0.15 : 1.2));
    if (!top) skirt.push([px, pz, x + (px - x) * 1.55, z + (pz - z) * 1.55]);
    if (top) cap.push(A.v(px, y + ly + 0.02, pz, C_SNOW, 0.1, 0.9, 0));
  }
  // corners: bit 0 x, bit 1 top, bit 2 z (the cap has corners of its own: snow)
  // (bedded in a drift: a skirt of snow from 0.3 of its height up its sides out to half its width beyond its foot)
  if (hy > 0.6) { const inn = skirt.map((q) => A.v(q[0], y + 0.3 * hy, q[1], C_SNOW, 0.15, 0.85, 0.8)), out = skirt.map((q) => A.v(q[2], y - sink * 0.5, q[3], C_SNOW, 0.05, 0.95, 0));
    for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]]) A.quad(out[b], out[a], inn[a], inn[b]); }
  A.quad(cap[0], cap[2], cap[3], cap[1]); A.quad(id[0], id[2], id[3], id[1]); A.quad(id[5], id[7], id[6], id[4]); A.quad(id[4], id[6], id[2], id[0]); A.quad(id[1], id[3], id[7], id[5]);
  return Math.hypot(hx, hz) * 1.12;
}

// AN ICE TOWER (a serac of the ice fall, a leaning block): a six-sided column of old blue ice H high and r in radius at its
// foot, in three storeys that step in and lean (lean metres aside at the top, toward the bearing la), broken at its brow,
// snow on its cap and on its ledges, a contact shade at its foot, and bedded in a drift of snow all round (a skirt 1.7 r
// wide rising 0.07 H up its sides), so that it stands in the snow and never on it. Opaque: every face is ice or snow.
export function towerInto(A, rng, x, y, z, r, H, lean, la) {
  const n = 6, a0 = rng.range(0, TAU), lv = [[-1.5, 1.08, 3.4], [0.34 * H, 0.94, 1.5], [0.68 * H, 0.74, 0.8], [H, 0.5, 0.35]], rings = [], lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
  for (let k = 0; k < lv.length; k++) {
    const f = Math.max(0, lv[k][0]) / H, ring = [];
    for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU + rng.range(-0.22, 0.22) + k * 0.2, rr = r * lv[k][1] * rng.range(0.8, 1.15), yy = y + lv[k][0] + (k === 3 ? rng.range(-0.16, 0.06) * H : k ? rng.range(-0.05, 0.05) * H : 0); ring.push([x + Math.cos(a) * rr + lx * f * f, yy, z + Math.sin(a) * rr + lz * f * f]); }
    rings.push(ring);
  }
  // each storey's faces have corners of their own (a hard edge between storeys); a ledge of snow on each step
  for (let k = 0; k < 3; k++) {
    const lo = rings[k].map((q) => A.v(q[0], q[1], q[2], C_ICE_OLD, 1, 0, lv[k][2])), hi = rings[k + 1].map((q) => A.v(q[0], q[1], q[2], k === 2 ? C_ICE : C_ICE_OLD, 1, 0, lv[k + 1][2]));
    for (let i = 0; i < n; i++) { const i1 = (i + 1) % n; A.quad(lo[i1], lo[i], hi[i], hi[i1]); }
  }
  { const top = rings[3], c = [0, 0, 0]; for (const q of top) { c[0] += q[0] / n; c[1] += q[1] / n; c[2] += q[2] / n; }
    const m = A.v(c[0], c[1] + 0.05 * H, c[2], C_SNOW, 0.05, 0.95, 0), tv = top.map((q) => A.v(q[0], q[1] + 0.03, q[2], C_SNOW, 0.1, 0.9, 0)); for (let i = 0; i < n; i++) A.tri(m, tv[(i + 1) % n], tv[i]); }
  // the drift it is bedded in
  { const inn = [], out = []; for (let i = 0; i < n; i++) { const q = rings[0][i], dx = q[0] - x, dz = q[2] - z; inn.push(A.v(x + dx * 0.98, y + 0.07 * H * rng.range(0.5, 1.3), z + dz * 0.98, C_SNOW, 0.15, 0.85, 1.2)); out.push(A.v(x + dx * 1.75, y - 0.4, z + dz * 1.75, C_SNOW, 0.05, 0.95, 0)); }
    for (let i = 0; i < n; i++) { const i1 = (i + 1) % n; A.quad(out[i1], out[i], inn[i], inn[i1]); } }
  return r * 1.25 + Math.abs(lean);
}

// ---------------------------------------------------------------- the floes of the break: plates that part as the leads open
// The plates are the cells about the points of a shaken lattice (each plate the six middles of the triangles round its point),
// laid in the hole the strip leaves: u aside of the lane (|u| < half), s between sBreak and sEdge. keep(x, z, r) says whether a
// plate may lie there (the arch's foot and the raft keep their own water). Returns the mesh and the plates.
export async function makeFloes(ctx, U, F, rng, keep) {
  const half = F.floeHalf, ni = Math.round(2 * half / (27 / Math.sqrt(F.dens ?? 1))), a = 2 * half / ni, rowH = a * 0.866, nj = Math.ceil((F.sEdge - F.sBreak) / rowH) + 1;
  const top = F.level(F.sBreak), sea = top - 0.9;
  // (the lattice's points: a quarter and three quarters of a step in on alternate rows, so that every plate's point lies
  // inside the hole and the plates fill it to its sides)
  const pt = [];
  for (let j = -1; j <= nj + 1; j++) { const row = []; for (let i = -1; i <= ni; i++) row.push([-half + (i + 0.25 + 0.5 * (j & 1)) * a + rng.range(-0.2, 0.2) * a, F.sBreak + (j + 0.5) * rowH + rng.range(-0.26, 0.26) * rowH]); pt.push(row); }
  const P = (j, i) => pt[j + 1][i + 1];
  // the six neighbours of a point of the lattice, in order round it
  const ring = (j, i) => { const o = j & 1; return [[j, i + 1], [j + 1, i + o], [j + 1, i + o - 1], [j, i - 1], [j - 1, i + o - 1], [j - 1, i + o]]; };
  const A = makeAcc(), plates = [];
  for (let j = 0; j < nj; j++) {
    for (let i = 0; i < ni; i++) {
      const c = P(j, i), nb = ring(j, i), cor = [];
      for (let k = 0; k < 6; k++) {
        const p1 = P(nb[k][0], nb[k][1]), p2 = P(nb[(k + 1) % 6][0], nb[(k + 1) % 6][1]);
        // the triangle's middle, held inside the hole (0.4 m off its sides; the edge toward the open water is ragged as dealt)
        cor.push([clamp((c[0] + p1[0] + p2[0]) / 3, -half + 0.4, half - 0.4), Math.max((c[1] + p1[1] + p2[1]) / 3, F.sBreak + 0.4)]);
      }
      const cu = c[0], cs = c[1];
      if (cs > F.sEdge + rowH * 0.3) continue;
      const cx = F.route(cs) + cu, cz = -cs;
      let r = 0; for (const q of cor) r = Math.max(r, Math.hypot(q[0] - cu, q[1] - cs));
      // its drift at the full: toward the open water, more the nearer the edge it lies (3.5 m for each row of plates), and a
      // little of its own
      const drift = [rng.range(-0.6, 0.6), -((cs - F.sBreak) / rowH) * 3.5 - rng.range(0, 1.4)];
      if (keep && !keep(cx, cz, r, drift)) continue;
      const h = rng.range(0, 0.5), mid = A.v(cx, top + h + rng.range(0.1, 0.5), cz, C_SNOW, 0.1, 0.9, 0), tp = [], ft = [];
      for (const q of cor) {
        // each corner drawn in 0.5 m toward the plate's middle: the crack
        const dx = q[0] - cu, ds = q[1] - cs, l = Math.hypot(dx, ds) || 1, x = F.route(cs) + q[0] - dx / l * 0.5, z = -(q[1] - ds / l * 0.5);
        tp.push(A.v(x, top + h, z, mix3(C_SNOW, C_ICE, 0.35), 0.4, 0.6, 0.2)); ft.push(A.v(x, sea - 1.6, z, C_ICE_OLD, 1, 0, 3.2));
      }
      for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; A.tri(mid, tp[k], tp[k1]); A.quad(tp[k1], tp[k], ft[k], ft[k1]); }
      A.floe(cx, cz, drift[0], drift[1]);
      plates.push({ x: cx, z: cz, r, drift });
    }
    await ctx.yield();
  }
  const mesh = new THREE.Mesh(await A.buildBy(ctx, true), makeLandMaterial(U, { floe: true })); mesh.name = 'floes';
  // the plates move in the shader: the mesh is never culled by its still bounds
  mesh.frustumCulled = false;
  return { mesh, plates, sea, top };
}
// one plate by itself (the raft): a ragged round of ice, its top at y = 0 over a freeboard, for a mesh the world moves
export function raftInto(A, rng, R) {
  const n = 9, mid = A.v(0, 0.35, 0, C_SNOW, 0.1, 0.9, 0), tp = [], ft = [];
  for (let k = 0; k < n; k++) { const t = k / n * TAU, r = R * rng.range(0.72, 1.1); tp.push(A.v(Math.cos(t) * r, 0, Math.sin(t) * r, mix3(C_SNOW, C_ICE, 0.3), 0.4, 0.6, 0.2)); ft.push(A.v(Math.cos(t) * r * 0.9, -2.6, Math.sin(t) * r * 0.9, C_ICE_OLD, 1, 0, 3.2)); }
  for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; A.tri(mid, tp[k1], tp[k]); A.quad(tp[k], tp[k1], ft[k1], ft[k]); }
}

// ---------------------------------------------------------------- the arch of blue ice
// It stands across the way (its opening along z) on a foot of ice: the middle of its opening at (0, ringY, 0) is the ring's.
// The limb is a lumpy round laid along half an ellipse; its inner side keeps `clear` metres from the ring's middle everywhere.
export function archInto(A, rng, noise, o = {}) {
  const ax = o.ax ?? 14.5, ay = o.ay ?? 17, yc = o.yc ?? 4, segs = 26, sides = 9, th0 = -0.32, th1 = Math.PI + 0.32;
  const ids = [];
  for (let i = 0; i <= segs; i++) {
    const th = lerp(th0, th1, i / segs), cx = ax * Math.cos(th), cy = yc + ay * Math.sin(th), up = Math.max(0, Math.sin(th));
    // tangent of the limb and the two directions across it (n in the arch's plane, pointing out; z through it)
    let tx = -ax * Math.sin(th), ty = ay * Math.cos(th); const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
    const nx = ty, ny = -tx, r0 = lerp(4.6, 2.9, Math.pow(up, 0.8));
    const row = [];
    for (let k = 0; k < sides; k++) {
      const a = k / sides * TAU, lump = 1 + 0.2 * noise.n3(cx * 0.16 + 7, cy * 0.16, Math.cos(a) * 1.3 + Math.sin(a) * 2.1) + 0.08 * noise.n3(cx * 0.5, cy * 0.5, a * 2), r = r0 * lump;
      // deeper (thicker in z) than it is wide in the arch's plane, so that it reads as a wall of ice pierced
      const pn = Math.cos(a) * r, pz = Math.sin(a) * r * 1.5, x = cx + nx * pn, y = cy + ny * pn, facing = ny * Math.cos(a);
      const snow = smoothstep(0.35, 0.8, facing) * 0.9;
      row.push(A.v(x, y, pz, mix3(C_ICE, C_SNOW, snow), 1 - snow, snow, 1.2 + 2.6 * (1 - snow) * (0.6 + 0.4 * noise.n2(x * 0.3, y * 0.3 + pz))));
    }
    ids.push(row);
  }
  for (let i = 0; i < segs; i++) for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; A.quad(ids[i][k], ids[i + 1][k], ids[i + 1][k1], ids[i][k1]); }
  // its foot: two low bergs under the legs joined by a tongue of ice behind the ring's plane
  for (const sg of [-1, 1]) for (let k = 0; k < 5; k++) blockInto(A, rng, sg * (ax + rng.range(-1, 7.5)), -1.2, rng.range(-7, 7), rng.range(3, 5), rng.range(1.2, 3.2), rng.range(3.5, 6.5), rng.range(0, TAU), rng.range(-0.2, 0.2), rng.range(-0.2, 0.2), 2);
  return { ax, ay, yc, top: yc + ay + 3.2, half: ax + 6.5 };
}

// ---------------------------------------------------------------- THE FIGURE: tall, dark, in a long coat, without a face
// One mesh of stiff pieces (trunk, head and hair, thighs, shins, arms, the coat's skirts), each carried by a joint's matrix
// (uB). 2.7 m to the crown. The world sets its place and calls pose(): a run of long bounds (c counts the strides: two to a
// cycle; fly 0..1 is the share of the bound flown), a stand (stand 0..1) with the head turned to either side (look -1..1).
const NB = 12;
export function makeFigure(U, o = {}) {
  const P = [], N = [], C = [], Bn = [];
  const coat = col3(o.coat || '#15171c'), coat2 = col3(o.coat2 || '#1d2026'), hair = col3(o.hair || '#050506'), skin = col3(o.skin || '#3b3a34'), boot = col3(o.boot || '#0b0b0d');
  // a tapered box in a joint's own frame: foot (y0) half sizes (ax, az), top (y1) half sizes (bx, bz), middle line at (cx, cz)
  const piece = (bone, cx, cz, y0, y1, ax, az, bx, bz, col, colTop) => {
    const q = [[cx - ax, y0, cz - az], [cx + ax, y0, cz - az], [cx + ax, y0, cz + az], [cx - ax, y0, cz + az], [cx - bx, y1, cz - bz], [cx + bx, y1, cz - bz], [cx + bx, y1, cz + bz], [cx - bx, y1, cz + bz]];
    const face = (a, b, c, d, c0, c1) => {
      const ux = q[b][0] - q[a][0], uy = q[b][1] - q[a][1], uz = q[b][2] - q[a][2], vx = q[d][0] - q[a][0], vy = q[d][1] - q[a][1], vz = q[d][2] - q[a][2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      for (const k of [a, b, c, a, c, d]) { P.push(q[k][0], q[k][1], q[k][2]); N.push(nx, ny, nz); const cc = q[k][1] === y1 ? c1 : c0; C.push(cc[0], cc[1], cc[2]); Bn.push(bone); }
    };
    const c1 = colTop || col;
    face(0, 1, 2, 3, col, c1); face(4, 7, 6, 5, col, c1); face(1, 0, 4, 5, col, c1); face(2, 1, 5, 6, col, c1); face(3, 2, 6, 7, col, c1); face(0, 3, 7, 4, col, c1);
  };
  // 0 trunk (joint: the hips), 1 head (the neck), 2 3 left thigh and shin, 4 5 right, 6 7 left arm, 8 9 right, 10 11 skirts
  piece(0, 0, 0, -0.05, 0.86, 0.27, 0.17, 0.37, 0.2, coat, coat2);
  piece(0, 0, 0.02, 0.8, 0.95, 0.2, 0.14, 0.11, 0.1, coat2);
  piece(1, 0, 0.01, 0.0, 0.4, 0.125, 0.14, 0.14, 0.15, skin);
  piece(1, 0, -0.06, -0.3, 0.46, 0.2, 0.14, 0.17, 0.15, hair);
  piece(1, 0, 0.02, 0.3, 0.47, 0.16, 0.17, 0.14, 0.14, hair);
  for (const [b, sx] of [[2, -1], [4, 1]]) {
    piece(b, 0, 0, -0.7, 0, 0.11, 0.115, 0.14, 0.14, coat);
    piece(b + 1, 0, 0, -0.66, 0, 0.085, 0.09, 0.105, 0.11, boot);
    piece(b + 1, 0, 0.1, -0.7, -0.56, 0.09, 0.2, 0.085, 0.16, boot);
    piece(b === 2 ? 6 : 8, sx * 0.02, 0, -0.56, 0.04, 0.085, 0.09, 0.11, 0.115, coat);
    piece(b === 2 ? 7 : 9, sx * 0.02, 0, -0.52, 0, 0.07, 0.075, 0.082, 0.088, coat);
    piece(b === 2 ? 7 : 9, sx * 0.02, 0.01, -0.68, -0.5, 0.05, 0.06, 0.06, 0.07, skin);
    // the coat's skirt on this side: hung at the hip, wrapping the side and the back, wider at its hem
    piece(b === 2 ? 10 : 11, sx * 0.17, -0.1, -1.0, 0.02, 0.2, 0.05, 0.16, 0.09, coat, coat2);
    piece(b === 2 ? 10 : 11, sx * 0.31, 0.02, -0.92, 0.02, 0.035, 0.16, 0.04, 0.15, coat, coat2);
    // (a cloak, where asked: its lower half hangs from the hip on the skirt's joint and swings with the stride, 1.05 m long
    // and 0.3 m wider at the hem than at the hip)
    if (o.cloak) piece(b === 2 ? 10 : 11, sx * 0.2, -0.26, -1.05, 0.04, 0.3, 0.05, 0.22, 0.05, coat, coat2);
  }
  // (the cloak's upper half: a panel across the back from the shoulders, 0.74 m wide, to the hips, 0.84 m wide, 0.25 m behind)
  if (o.cloak) piece(0, 0, -0.25, -0.02, 0.9, 0.42, 0.05, 0.37, 0.07, coat, coat2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(Bn, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.4, 0), 3.2);
  const bones = []; for (let i = 0; i < NB; i++) bones.push(new THREE.Matrix4());
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uB: { value: bones } },
    vertexShader: /* glsl */`uniform mat4 uB[${NB}]; attribute float aB; attribute vec3 aCol; varying vec3 vCol, vN, vW;
varying float vFd;
void main(){
  mat4 B = uB[int(aB + .5)];
  vec4 wp = modelMatrix*(B*vec4(position, 1.)); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*(mat3(B)*normal)); vCol = aCol;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  vFd = -mvPosition.z;
}`,
    fragmentShader: /* glsl */`${PLACE}
varying vec3 vCol, vN, vW;
varying float vFd;
void main(){
${PLACE_HEAD}
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float dif = clamp(dot(N, uSunDir)*.6 + .4, 0., 1.);
  vec3 c = vCol*(uSunCol*dif*.8 + mix(uGndCol, uSkyCol, N.y*.5 + .5));
  // a thin edge of sky light, so the dark shape keeps its outline against dark ice
  float rim = 1.-clamp(dot(N, V), 0., 1.); c += (uSkyCol*.5 + uSunCol*.12)*rim*rim*rim*.22;
  c += vCol*uFlashCol*uFlash*(.4 + .6*clamp(dot(N, uFlashDir), 0., 1.));
  gl_FragColor = vec4(c, 1.);
  gl_FragColor.rgb = placeFog(gl_FragColor.rgb, PL, vFd);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'figure'; mesh.frustumCulled = false;
  const HIP = 1.34, _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), root = new THREE.Matrix4();
  const mul = (out, parent, x, y, z, rx, ry = 0, rz = 0) => {
    out.copy(parent).multiply(_m.makeTranslation(x, y, z));
    if (ry) out.multiply(_r.makeRotationY(ry)); if (rx) out.multiply(_r.makeRotationX(rx)); if (rz) out.multiply(_r.makeRotationZ(rz));
    return out;
  };
  const I = new THREE.Matrix4();
  // o: { c (strides run), fly (0..1 of the bound), rise (m the hips are carried up at the bound's top), stand 0..1, look -1..1, time }
  const pose = (o) => {
    const st = o.stand || 0, run = 1 - st, ph = (o.c || 0) * Math.PI, sw = Math.sin(ph) * run, t = o.time || 0;
    const lean = lerp(0.34, 0.04, st), lift = (o.rise || 0) * 4 * (o.fly || 0) * (1 - (o.fly || 0)) * run;
    const twist = (o.look || 0) * 0.85 * st;
    mul(root, I, 0, HIP - 0.1 * run * (1 - Math.abs(sw)) + lift, 0, lean);
    mul(bones[0], root, 0, 0, 0, 0, twist + 0.12 * sw);
    mul(bones[1], bones[0], 0, 0.93, 0, -lean * 0.7 + 0.1 * st, (o.look || 0) * 1.25 * st);
    for (const [b, sx] of [[2, -1], [4, 1]]) {
      const a = sx * sw * 1.05, back = Math.max(0, -a);
      mul(bones[b], root, sx * 0.14, 0, 0, -a - 0.12 * run);
      mul(bones[b + 1], bones[b], 0, -0.7, 0, (0.22 + 1.25 * back) * run + 0.04);
      const arm = b === 2 ? 6 : 8, as = -a * 0.85;
      mul(bones[arm], bones[0], sx * 0.45, 0.8, 0, -as + 0.1 * st, 0, sx * (0.1 + 0.05 * st));
      mul(bones[arm + 1], bones[arm], 0, -0.56, 0, -(0.95 * run + 0.18));
      // the skirts stream behind in the run and hang, stirred by the wind, when he stands
      mul(bones[b === 2 ? 10 : 11], root, 0, 0, 0, (0.75 + 0.22 * Math.sin(ph * 2 + sx)) * run + (0.1 + 0.07 * Math.sin(t * 2.3 + sx * 1.7)) * st - lean, 0, sx * 0.05);
    }
  };
  pose({});
  return { mesh, geometry: g, material: mat, bones, pose, height: 2.7 };
}

// ---------------------------------------------------------------- THE SHIP locked in the ice
// A three-masted ship of the time, her sails furled, her hull dark, her rigging stiff and white with frost. Length along z (bow
// at +z), the ice's surface at y = 0. Returns the geometry (vertex colours) and where her lanterns, galley smoke and tops are.
const C_HULL = col3('#1c1511'), C_WALE = col3('#5d4a2b'), C_DECK = col3('#4a3b2c'), C_SPAR = col3('#3a2c1f'), C_FROST = col3('#d9e3ee'), C_SAIL = col3('#c9d2dc');
export function makeShip(rng) {
  const B = makeProp(), L = 40, lanterns = [], crew = [];
  const half = (t) => 4.7 * (0.6 + 0.4 * smoothstep(0, 0.28, t)) * (1 - Math.pow(smoothstep(0.58, 1, t), 1.7));
  const sheer = (t) => 4.0 + 1.9 * (2 * t - 1) * (2 * t - 1) + (t < 0.24 ? 1.5 : 0);
  const NS = 14, zAt = (t) => (t - 0.5) * L;
  for (let i = 0; i < NS; i++) {
    const t0 = i / NS, t1 = (i + 1) / NS;
    for (const sg of [-1, 1]) {
      const P = (t, lv) => { const b = half(t), y = lv === 0 ? -1.6 : lv === 1 ? 0.9 : lv === 2 ? sheer(t) - 1.1 : sheer(t), x = lv === 0 ? 0.25 * b + 0.05 : lv === 1 ? 0.93 * b + 0.05 : b + 0.05; return [sg * x, y, zAt(t)]; };
      for (let lv = 0; lv < 3; lv++) {
        const col = lv === 2 ? C_WALE : C_HULL, a = P(t0, lv), b = P(t1, lv), c = P(t1, lv + 1), d = P(t0, lv + 1);
        if (sg > 0) B.quad(b, a, d, c, col, lv === 1 ? mix3(C_HULL, C_FROST, 0.25) : col); else B.quad(a, b, c, d, col, lv === 1 ? mix3(C_HULL, C_FROST, 0.25) : col);
      }
      // the bulwark's inner face and the rail's frosted cap
      const a = P(t0, 3), b = P(t1, 3), ai = [a[0] - sg * 0.3, a[1], a[2]], bi = [b[0] - sg * 0.3, b[1], b[2]];
      if (sg > 0) B.quad(a, b, bi, ai, C_FROST); else B.quad(b, a, ai, bi, C_FROST);
    }
    // the deck, snow lying on it in drifts
    const d0 = sheer(t0) - 0.95, d1 = sheer(t1) - 0.95, b0 = half(t0), b1 = half(t1), snow = rng.chance(0.55) ? mix3(C_DECK, C_FROST, rng.range(0.4, 0.9)) : C_DECK;
    B.quad([-b0, d0, zAt(t0)], [b0, d0, zAt(t0)], [b1, d1, zAt(t1)], [-b1, d1, zAt(t1)], C_DECK, snow);
  }
  // the stern's flat, its windows' frame, and the step of the quarterdeck
  { const b = half(0), y = sheer(0); B.quad([b, -1.6, zAt(0)], [-b, -1.6, zAt(0)], [-b, y, zAt(0)], [b, y, zAt(0)], C_HULL, C_WALE);
    const zq = zAt(0.24), bq = half(0.24); B.quad([-bq, sheer(0.25) - 0.95, zq], [bq, sheer(0.25) - 0.95, zq], [bq, sheer(0.23) - 0.95, zq], [-bq, sheer(0.23) - 0.95, zq], C_WALE); }
  // the galley's house amidships with its chimney, a boat turned over on the deck
  B.box(0, sheer(0.42) - 0.95 + 1.0, zAt(0.42), 1.7, 1.0, 2.3, C_WALE, 0, 0, C_FROST);
  B.cyl([0.9, sheer(0.42) + 1.0, zAt(0.42) + 1.2], [0.9, sheer(0.42) + 2.6, zAt(0.42) + 1.2], 0.2, 0.18, 6, C_HULL);
  const smokeAt = [0.9, sheer(0.42) + 2.7, zAt(0.42) + 1.2];
  B.box(0, sheer(0.62) - 0.95 + 0.45, zAt(0.62), 0.95, 0.45, 2.6, C_FROST, 0, 0, C_FROST);
  // masts (lower, top and topgallant), their tops, yards with furled sails white with rime
  const masts = [];
  for (const [t, H, k] of [[0.74, 28, 0.92], [0.47, 32, 1], [0.2, 24, 0.78]]) {
    const z = zAt(t), y0 = sheer(t) - 1, rake = -0.035 * H;
    const at = (f) => [0, y0 + H * f, z + rake * f];
    B.cyl(at(0), at(0.46), 0.44, 0.34, 7, C_SPAR, mix3(C_SPAR, C_FROST, 0.5)); B.cyl(at(0.42), at(0.78), 0.28, 0.2, 6, C_SPAR, mix3(C_SPAR, C_FROST, 0.6)); B.cyl(at(0.74), at(1), 0.16, 0.08, 5, mix3(C_SPAR, C_FROST, 0.5), C_FROST);
    { const p = at(0.44); B.box(p[0], p[1], p[2], 1.3, 0.09, 1.0, mix3(C_SPAR, C_FROST, 0.6)); }
    let yi = 0;
    for (const [f, len] of [[0.36, 21 * k], [0.62, 16 * k], [0.84, 11 * k]]) {
      const p = at(f), tip = rng.range(-0.5, 0.5) * (yi === 0 ? 1.4 : 0.6), yaw = rng.range(-0.08, 0.08) * len;
      const a = [-len / 2, p[1] - tip, p[2] + 0.5 - yaw], b = [len / 2, p[1] + tip, p[2] + 0.5 + yaw];
      B.cyl(a, b, 0.17, 0.17, 5, C_SPAR, mix3(C_SPAR, C_FROST, 0.5));
      // the sail furled along the yard: a lumpy white roll, thickest at the bunt
      const n = 6;
      for (let q = 0; q < n; q++) { const u0 = 0.06 + 0.88 * q / n, u1 = 0.06 + 0.88 * (q + 1) / n, r = (0.24 + 0.2 * Math.sin(Math.PI * (q + 0.5) / n)) * rng.range(0.8, 1.2);
        B.cyl([lerp(a[0], b[0], u0), lerp(a[1], b[1], u0) + 0.3, lerp(a[2], b[2], u0)], [lerp(a[0], b[0], u1), lerp(a[1], b[1], u1) + 0.3, lerp(a[2], b[2], u1)], r, r * rng.range(0.8, 1.1), 5, C_SAIL, C_FROST); }
      // lifts to the mast above the yard
      const up = at(Math.min(1, f + 0.14)); B.band(a, up, 0.1, C_FROST, [0, 0, 1]); B.band(b, up, 0.1, C_FROST, [0, 0, 1]);
      yi++;
    }
    // shrouds to the rail on either hand, with ratlines; a stay forward and a backstay
    const top = at(0.44), bh = half(t);
    for (const sg of [-1, 1]) {
      const feet = []; for (let q = 0; q < 4; q++) feet.push([sg * (bh + 0.1), sheer(t), z - 2.4 + q * 1.5]);
      for (const f of feet) B.band([sg * 0.5, top[1], top[2]], f, 0.11, C_FROST, [0, 0, 1]);
      for (let q = 1; q < 6; q++) { const u = q / 6.5; B.band([lerp(feet[0][0], sg * 0.5, u), lerp(feet[0][1], top[1], u), lerp(feet[0][2], top[2], u)], [lerp(feet[3][0], sg * 0.5, u), lerp(feet[3][1], top[1], u), lerp(feet[3][2], top[2], u)], 0.07, C_FROST, [sg, 0, 0]); }
      B.band(at(0.78), [sg * (bh + 0.1), sheer(Math.max(0, t - 0.12)), z - 5.2], 0.09, C_FROST, [0, 0, 1]);
    }
    masts.push({ z, top: y0 + H, yard: 21 * k / 2, at });
  }
  // the bowsprit and the stays that run to it and between the masts; a spanker's gaff on the mizzen
  const bow = [0, sheer(1) + 0.2, zAt(1) - 1], sprit = [0, sheer(1) + 4.6, zAt(1) + 11];
  B.cyl(bow, sprit, 0.3, 0.14, 6, C_SPAR, mix3(C_SPAR, C_FROST, 0.6));
  B.band(masts[0].at(0.46), sprit, 0.11, C_FROST, [1, 0, 0]); B.band(masts[0].at(0.78), sprit, 0.1, C_FROST, [1, 0, 0]); B.band(masts[0].at(1), [0, sprit[1] + 0.4, sprit[2] - 1], 0.09, C_FROST, [1, 0, 0]);
  B.band(masts[1].at(0.46), masts[0].at(0.12), 0.11, C_FROST, [1, 0, 0]); B.band(masts[1].at(0.78), masts[0].at(0.46), 0.1, C_FROST, [1, 0, 0]);
  B.band(masts[2].at(0.46), masts[1].at(0.12), 0.11, C_FROST, [1, 0, 0]); B.band(masts[2].at(0.78), masts[1].at(0.46), 0.1, C_FROST, [1, 0, 0]);
  { const m = masts[2], a = m.at(0.3), b = [0, a[1] + 3.2, a[2] - 8.5]; B.cyl(a, b, 0.14, 0.09, 5, C_SPAR, C_FROST); B.cyl([0, a[1] + 0.2, a[2]], [0, b[1] - 0.2, b[2] + 0.4], 0.3, 0.2, 5, C_SAIL, C_FROST); }
  // her lanterns: at the stern (the great one), in the main and fore shrouds, at the bow, and the galley's door
  lanterns.push([0, sheer(0) + 1.6, zAt(0) - 0.5, 1.5], [half(0.47) - 0.4, sheer(0.47) + 3.0, zAt(0.47) - 1, 1], [-half(0.47) + 0.4, sheer(0.47) + 3.0, zAt(0.47) - 1, 1],
    [half(0.74) - 0.4, sheer(0.74) + 2.6, zAt(0.74), 0.9], [0, sheer(1) + 1.4, zAt(1) - 1.5, 1], [-1.9, sheer(0.42) + 0.2, zAt(0.42), 0.9], [1.6, sheer(0) - 1.6, zAt(0) - 0.25, 0.8], [-1.6, sheer(0) - 1.6, zAt(0) - 0.25, 0.8]);
  // her lit stern windows: three panes of warm light in the stern's flat (faces that give light of their own)
  for (const wx of [-1.7, 0, 1.7]) B.box(wx, sheer(0) - 1.55, zAt(0) - 0.05, 0.52, 0.4, 0.05, [2.6, 1.45, 0.5]);
  for (const q of lanterns.slice(0, 5)) { B.box(q[0], q[1], q[2], 0.16, 0.24, 0.16, col3('#2a2018')); B.box(q[0], q[1] + 0.34, q[2], 0.2, 0.05, 0.2, C_FROST); }
  // small figures at her rail (wrapped men, never seen close)
  // (r3: three or four at EACH rail, each rail's own places along her: she shows as many to either hand)
  for (let i = 0, n = 2 * rng.int(3, 4); i < n; i++) {
    const t = rng.range(0.1, 0.9), sg = i % 2 ? 1 : -1, x = sg * (half(t) - 0.75), y = sheer(t) - 0.95, z = zAt(t), c = mix3(col3('#3a2f28'), col3('#24303a'), rng());
    B.box(x, y + 0.72, z, 0.24, 0.72, 0.2, c, rng.range(0, 3)); B.box(x, y + 1.6, z, 0.14, 0.16, 0.14, col3('#6a5648'), rng.range(0, 3));
    crew.push([x, y + 1.6, z]);
  }
  return { geometry: B.build(), triangles: B.triangles, length: L, beam: 9.5, lanterns, smokeAt, masts, crew, mastTop: 32 + 4, sheer, half, zAt };
}

// ---------------------------------------------------------------- THE DOG SLEDGE
// A low carriage fixed on a sledge, drawn by dogs in pairs on one trace; it runs toward +z of its own frame. The dogs' legs
// swing in the shader by the metres the team has run (uRun), so their gait is tied to the ground they cover.
export function makeSledge(U, rng) {
  const B = makeProp(), wood = col3('#3b2b1d'), dark = col3('#17130f'), fur = [col3('#2a2622'), col3('#6f6a62'), col3('#191715'), col3('#8d867a')], rope = col3('#b9b3a6');
  // the sledge: two runners turned up before, cross bars, the carriage's low body with a dash and a seat's back
  for (const sg of [-1, 1]) { B.box(sg * 0.62, 0.08, 0, 0.05, 0.07, 1.9, wood); B.box(sg * 0.62, 0.3, 2.05, 0.05, 0.07, 0.34, wood, 0, -0.9); for (const z of [-1.2, 0, 1.2]) B.box(sg * 0.62, 0.3, z, 0.04, 0.2, 0.04, wood); }
  B.box(0, 0.78, -0.1, 0.78, 0.3, 1.5, dark, 0, 0, col3('#2c241c')); B.box(0, 1.1, 1.25, 0.72, 0.32, 0.1, dark, 0, 0.35); B.box(0, 1.3, -1.5, 0.74, 0.5, 0.08, dark, 0, -0.12); B.box(0, 1.0, -0.4, 0.5, 0.14, 0.7, col3('#5a5348'));
  // the trace and the dogs: pairs either side of it, the leader alone before them
  const pairs = rng.int(4, 5), gap = 2.3, z0 = 3.6, dogs = [];
  B.band([0, 0.55, 2.2], [0, 0.42, z0 + pairs * gap + 0.8], 0.06, rope, [1, 0, 0]);
  for (let p = 0; p <= pairs; p++) for (const sg of p === pairs ? [0] : [-1, 1]) dogs.push({ x: sg * 0.55, z: z0 + p * gap + rng.range(-0.2, 0.2), s: rng.range(0.9, 1.1), ph: rng.range(0, TAU), c: rng.pick(fur) });
  for (const d of dogs) {
    const s = d.s, c = d.c, c2 = mix3(c, [0.5, 0.5, 0.5], 0.25);
    // body, neck and head, ears, the tail carried up; then four legs, each marked with its joint (y, z), phase and swing
    B.tag([0, 0, d.ph, 0]);
    B.box(d.x, 0.58 * s, d.z, 0.16 * s, 0.17 * s, 0.46 * s, c, 0, 0, c2);
    B.box(d.x, 0.74 * s, d.z + 0.52 * s, 0.1 * s, 0.11 * s, 0.17 * s, c, 0, -0.6); B.box(d.x, 0.84 * s, d.z + 0.7 * s, 0.09 * s, 0.09 * s, 0.13 * s, c2, 0, 0.1);
    B.box(d.x, 0.8 * s, d.z + 0.86 * s, 0.05 * s, 0.045 * s, 0.07 * s, dark); B.box(d.x, 0.82 * s, d.z - 0.55 * s, 0.035 * s, 0.035 * s, 0.2 * s, c2, 0, 0.9);
    for (const [lx, lz, lph] of [[-1, 0.34, 0], [1, 0.34, 0.5], [-1, -0.34, 2.6], [1, -0.34, 3.1]]) {
      B.tag([0.5 * s, d.z + lz * s, d.ph + lph, 0.75]);
      B.box(d.x + lx * 0.11 * s, 0.26 * s, d.z + lz * s, 0.04 * s, 0.26 * s, 0.05 * s, c);
    }
    B.tag(null);
    if (d.x) B.band([d.x, 0.62 * s, d.z - 0.2], [0, 0.45, d.z - 1.0], 0.04, rope, [0, 1, 0]);
  }
  const lead = dogs[dogs.length - 1];
  if (lead) B.band([0, 0.6, lead.z - 0.2], [0, 0.42, lead.z - 0.9], 0.04, rope, [1, 0, 0]);
  const run = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uRun: run }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform float uRun; attribute vec4 aTag; attribute vec3 color; varying vec3 vCol, vN, vW;
varying float vFd;
void main(){
  vec3 p = position, n = normal;
  // a leg swings about its joint; the body rises and falls twice to the stride
  float g = uRun*3.9, a = aTag.w*sin(g + aTag.z), ca = cos(a), sa = sin(a);
  vec2 d = p.yz - aTag.xy; p.yz = aTag.xy + vec2(d.x*ca - d.y*sa, d.x*sa + d.y*ca)*step(.01, aTag.w) + d*(1.-step(.01, aTag.w));
  n.yz = mix(n.yz, vec2(n.y*ca - n.z*sa, n.y*sa + n.z*ca), step(.01, aTag.w));
  p.y += .05*sin(g*2. + aTag.z)*step(.001, abs(aTag.z));
  vec4 wp = modelMatrix*vec4(p, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*n); vCol = color;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  vFd = -mvPosition.z;
}`,
    fragmentShader: /* glsl */`${PLACE}
varying vec3 vCol, vN, vW;
varying float vFd;
void main(){
${PLACE_HEAD}
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float dif = clamp(dot(N, uSunDir)*.6 + .4, 0., 1.);
  vec3 c = vCol*(uSunCol*dif*.8 + mix(uGndCol, uSkyCol, N.y*.5 + .5));
  gl_FragColor = vec4(c, 1.);
  gl_FragColor.rgb = placeFog(gl_FragColor.rgb, PL, vFd);
}`,
  });
  const mesh = new THREE.Mesh(B.build(true), mat); mesh.name = 'sledge'; mesh.frustumCulled = false;
  return { mesh, run, dogs: dogs.length, length: z0 + pairs * gap + 2, seat: [0, 0.9, -0.55] };
}

// ---------------------------------------------------------------- THE SKY, standing by place like the ground under it
// One dome about the eye. Every piece of it belongs to a place of the world: the place a low vault `vault` metres over the
// eye's own height would put it over (the nearer overhead, the farther toward the horizon), and it shows that place's hour:
// its colours, its clouds, its own sun or moon, its stars, its lights of the north. So the storm stands over the lake and
// the dusk over the frozen ocean for every visitor, and each is seen from the other. Clouds lie on a high plane of their own
// and go with the wind on the world's clock. S: per-hour arrays of four (see the uniforms below).
export function makeSkyDome(U, S = {}) {
  const u = {
    ...U, uVault: { value: S.vault ?? 40 }, uRag: { value: S.rag ?? 45 },
    uCloudLitH: { value: v3s(4) }, uCloudShadeH: { value: v3s(4) }, uDiscH: { value: v3s(4) }, uDiscDirH: { value: v3s(4) },
    uCovH: { value: new THREE.Vector4(0.3, 0.3, 0.3, 0.3) }, uScatH: { value: new THREE.Vector4(0, 0, 0, 0) }, uDiscSizeH: { value: new THREE.Vector4(1, 1, 1, 1) },
    uStarH: { value: new THREE.Vector4(0, 0, 0, 0) }, uAurH: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false,
    vertexShader: /* glsl */`varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`,
    fragmentShader: /* glsl */`${PLACE}
uniform float uVault, uRag; uniform vec3 uCloudLitH[4], uCloudShadeH[4], uDiscH[4], uDiscDirH[4]; uniform vec4 uCovH, uScatH, uDiscSizeH, uStarH, uAurH;
varying vec3 vDir;
${fx.GLSL_NOISE}
float w4(vec4 a, vec3 k){ return mix(mix(mix(a.x, a.y, k.x), a.z, k.y), a.w, k.z); }
void main(){
  vec3 d = normalize(vDir), E = cameraPosition; float up = max(d.y, 0.);
  // the place this piece of sky stands over
  vec2 P = E.xz + d.xz*(uVault/max(d.y, .033));
  float rag = (vnoise(P*.0045) - .5)*2.*uRag + (vnoise(P*.016) - .5)*.7*uRag;
  vec3 k = hourK(-P.y + rag);
  vec4 w = vec4(1.-k.x, k.x*(1.-k.y), k.y*(1.-k.z), k.z);
  vec3 zen = mixH(uZenH[0], uZenH[1], uZenH[2], uZenH[3], k), hor = mixH(uFogColH[0], uFogColH[1], uFogColH[2], uFogColH[3], k);
  vec3 col = mix(hor, zen, pow(up, .5));
  // clouds on their own high plane, going with the wind (r2: 14 m a second at their height; their shadows on the ice 13)
  vec2 cp = (E.xz + d.xz*(1600./max(d.y, .05)))*.00042 + uTime*vec2(.006, .00274);
  float n = fbm(cp), n2 = fbm(cp*2.6 + 9.3), cov = w4(uCovH, k);
  float cl = smoothstep(1.02 - cov - .2, 1.02 - cov + .2, n*.62 + n2*.38);
  vec3 lit = mixH(uCloudLitH[0], uCloudLitH[1], uCloudLitH[2], uCloudLitH[3], k), shd = mixH(uCloudShadeH[0], uCloudShadeH[1], uCloudShadeH[2], uCloudShadeH[3], k);
  vec3 cc = mix(shd, lit, clamp(n2*1.5 - .3 + .5*(1. - cl), 0., 1.));
  // each hour's own sun or moon, in its own sky only
  vec3 sunAdd = vec3(0.);
  for (int i = 0; i < 4; i++) {
    float sd = max(dot(d, uDiscDirH[i]), 0.), e = 1. - .00012*uDiscSizeH[i];
    sunAdd += w[i]*uDiscH[i]*(smoothstep(e - .00008*uDiscSizeH[i], e, sd)*14. + pow(sd, 240.)*.5 + pow(sd, 9.)*uScatH[i]);
  }
  // stars, and the lights of the north: folded curtains with rays, going slowly on the clock
  vec3 sg = d*170., sf = fract(sg) - .5; float sh = hash13(floor(sg));
  float star = step(.9962, sh)*(1. - smoothstep(.06, .34, length(sf)))*smoothstep(.02, .16, up)*(.65 + .35*sin(uTime*2.7 + sh*870.));
  vec2 q = d.xz/(up + .3)*1.5;
  float wv = vnoise(vec2(q.x*.8 + uTime*.025, q.y*.3 - uTime*.011));
  float band = pow(1. - abs(sin(q.x*2.1 + wv*5.5 + q.y*.5)), 5.), rays = .45 + .55*vnoise(vec2(q.x*13. + wv*5., uTime*.4));
  // (curtains from 3 degrees over the horizon to near the zenith)
  float hg = smoothstep(.05, .2, up)*(1. - smoothstep(.72, .98, up));
  vec3 aur = hg*band*rays*(vec3(.1, 1., .48) + vec3(.5, .14, .8)*smoothstep(.3, .75, up))*1.5;
  col += (sunAdd + w4(uStarH, k)*star*vec3(.8, .9, 1.)*1.7 + w4(uAurH, k)*aur)*(1. - cl);
  col = mix(col, cc, cl);
  // the storm's fire inside its own cloud
  vec3 fd = normalize(uFlashPos - E);
  col += uFlashCol*uFlashAmt*w.x*(.07 + .6*pow(max(dot(d, fd), 0.), 4.))*(.35 + .65*cl)*(.25 + 1.5*smoothstep(.25, .8, n)*(.5 + n2));
  // the horizon's haze is the fog of that place; below the horizon the same
  col = mix(col, hor, pow(clamp(1. - up, 0., 1.), 9.)*.92);
  col = mix(col, hor*.85, (1. - smoothstep(-.1, 0., d.y)));
  gl_FragColor = vec4(col, 1.);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 20), mat); mesh.name = 'sky'; mesh.renderOrder = -1; mesh.frustumCulled = false;
  // one hour's sky written into its place of the four: o = { cloudLit, cloudShade, disc ([r, g, b]), discDir (Vector3), cov, scat, discSize, stars, aurora }
  const setSky = (i, o) => {
    if (o.cloudLit) u.uCloudLitH.value[i].set(...o.cloudLit); if (o.cloudShade) u.uCloudShadeH.value[i].set(...o.cloudShade);
    u.uDiscH.value[i].set(...(o.disc || [0, 0, 0])); u.uDiscDirH.value[i].copy(o.discDir || U.uSunDirH.value[i]).normalize();
    u.uCovH.value.setComponent(i, o.cov ?? 0.3); u.uScatH.value.setComponent(i, o.scat ?? 0); u.uDiscSizeH.value.setComponent(i, o.discSize ?? 1);
    u.uStarH.value.setComponent(i, o.stars ?? 0); u.uAurH.value.setComponent(i, o.aurora ?? 0);
  };
  return { mesh, material: mat, uniforms: u, setSky };
}

// ---------------------------------------------------------------- props' material (castle, stump, ship): flat faces with a
// colour each, lit by the world's own light: the sun above the valley's shade line only, the sky, the storm's flash
export function makePropMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 color; varying vec3 vCol, vN, vW;
varying float vFd;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vCol = color;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  vFd = -mvPosition.z;
}`,
    fragmentShader: /* glsl */`${PLACE}
varying vec3 vCol, vN, vW;
varying float vFd;
void main(){
${PLACE_HEAD}
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float shade = mix(1., sunReach(vW), PL.shadeK);
  float dif = clamp(dot(N, uSunDir), 0., 1.);
  vec3 c = vCol*(uSunCol*dif*shade + mix(uGndCol, uSkyCol, N.y*.5 + .5));
  c += vCol*uFlashCol*uFlash*(.3 + .7*clamp(dot(N, uFlashDir), 0., 1.));
  c += vCol*smallLights(vW, N);
  // (a face whose colour is over 1.5 in red gives light of its own: a lit window)
  c = mix(c, vCol*.55, step(1.5, vCol.r));
  gl_FragColor = vec4(c, 1.);
  gl_FragColor.rgb = placeFog(gl_FragColor.rgb, PL, vFd);
}`,
  });
}

// ---------------------------------------------------------------- puffs: powder, spindrift, sea smoke, the avalanche's cloud
// Soft sheets that turn about their own place to face the eye. Each puff: its birth place, its drift (m/s), its size (m), and
// its clock: it is born every `per` seconds (at clock phase `ph`), lives `life` seconds, grows by `grow`. list: [{ p, v, size,
// per, ph, life, grow, a (opacity), tone (0 white .. 1 the shade colour) }]
export function makePuffs(U, list, o = {}) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const iP = new Float32Array(n * 4), iV = new Float32Array(n * 4), iT = new Float32Array(n * 4);
  let cx = 0, cy = 0, cz = 0, rad = 0;
  list.forEach((q, i) => { iP.set([q.p[0], q.p[1], q.p[2], q.size], i * 4); iV.set([q.v[0], q.v[1], q.v[2], q.grow ?? 1.5], i * 4); iT.set([q.per, q.ph, q.life, (q.a ?? 0.5) + Math.floor((q.tone ?? 0) * 8) * 2], i * 4); cx += q.p[0] / n; cy += q.p[1] / n; cz += q.p[2] / n; });
  list.forEach((q) => { rad = Math.max(rad, Math.hypot(q.p[0] - cx, q.p[1] - cy, q.p[2] - cz) + q.size * 4 + Math.hypot(q.v[0], q.v[1], q.v[2]) * q.life); });
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), rad || 1);
  const amount = { value: 1 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U, uAmount: amount, uShade: { value: new THREE.Color(o.shade || '#8fa3c0') }, uTint: { value: new THREE.Color(o.tint || '#ffffff') } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`uniform float uTime; attribute vec4 iP, iV, iT; varying vec2 vUv; varying vec4 vK; varying vec3 vW; varying float vNear;
varying float vFd;
void main(){
  float age = mod(uTime + iT.y, max(iT.x, .01)), k = clamp(age/max(iT.z, .01), 0., 1.), live = step(age, iT.z);
  float size = iP.w*(1. + iV.w*k)*live;
  vec3 c = iP.xyz + iV.xyz*age; vW = c;
  vec4 mvPosition = viewMatrix*vec4(c, 1.);
  // a medium's law: it fades only inside 0.6 to 2.5 m of the lens (no step, nothing else read)
  vNear = smoothstep(.6, 2.5, length(mvPosition.xyz));
  mvPosition.xy += position.xy*size;
  vUv = position.xy; float tone = floor(iT.w*.5)/8.;
  vK = vec4(k, fract(iT.w*.5)*2., tone, fract(iP.x*.37 + iP.z*.71)*40.);
  gl_Position = projectionMatrix*mvPosition;
  vFd = -mvPosition.z;
}`,
    fragmentShader: /* glsl */`${PLACE}
uniform float uAmount; uniform vec3 uShade, uTint; varying vec2 vUv; varying vec4 vK; varying vec3 vW; varying float vNear;
${fx.GLSL_NOISE}
varying float vFd;
void main(){
${PLACE_HEAD}
  float r = length(vUv); if (r > 1.) discard;
  float k = clamp(vK.x, 0., 1.);
  float body = 1.-smoothstep(.25, 1., r);
  float n = vnoise(vUv*1.7 + vK.w + vec2(0., -k*.8))*.6 + vnoise(vUv*4.1 - vK.w)*.4;
  float a = clamp(body*smoothstep(.18 + .3*k, .75, n + body*.55), 0., 1.)*smoothstep(0., .12, k)*(1.-k)*(1.-k*.4)*vK.y*uAmount*vNear;
  // lit from above by the sky and the sun, shaded below
  float up = clamp(vUv.y*.5 + .5 + (n - .5)*.5, 0., 1.);
  vec3 light = uSkyCol*1.05 + uSunCol*(.25 + .45*up) + uFlashCol*uFlash*.8;
  vec3 c = mix(uTint, uShade, clamp(vK.z + (1.-up)*.35, 0., 1.))*light;
  gl_FragColor = vec4(c, a);
  gl_FragColor.rgb = placeFog(gl_FragColor.rgb, PL, vFd);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = o.renderOrder ?? 3; mesh.name = o.name || 'puffs';
  return { mesh, amount, count: n };
}

// ---------------------------------------------------------------- water: the lake under the storm, the torrent's pool, the black sea
// A level sheet (attributes: position, aShore = metres of water under a corner, 0 at the land). It mirrors the sky's two
// colours, keeps its ripples' size in metres, whitens where it meets land or ice, and takes the storm's flash as a sheet of fire.
export function makeWaterMaterial(U, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uDeep: { value: new THREE.Color(o.deep || '#0a1a2c') }, uBandW: { value: o.band ?? 0.12 }, uRipple: { value: o.ripple ?? 1 }, uFoam: { value: o.foam ?? 1 }, uFireK: { value: o.fire ?? 1 } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`attribute float aShore; varying float vShore; varying vec3 vW;
varying float vFd;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vW = wp.xyz; vShore = aShore; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  vFd = -mvPosition.z;
}`,
    fragmentShader: /* glsl */`${PLACE}
uniform vec3 uDeep; uniform float uBandW, uRipple, uFoam, uFireK; varying float vShore; varying vec3 vW;
${fx.GLSL_NOISE}
varying float vFd;
void main(){
${PLACE_HEAD}
  vec3 V = cameraPosition - vW; float dist = max(length(V), .01); V /= dist;
  // ripples of two sizes, driven two ways; they flatten with distance so the far water is calm glass, never streaks
  float fl = 1./(1. + dist*.012);
  vec2 q = vW.xz, t = uTime*vec2(.5, .32);
  vec3 a = vnoised(q*.42 + t), b = vnoised(q*1.35 - t*1.6 + 7.), c = vnoised(q*.09 + t*.2);
  vec2 slope = (a.yz*.55 + b.yz*.3*fl + c.yz*.5)*uRipple*.5*(.35 + .65*fl);
  vec3 N = normalize(vec3(-slope.x, 1., -slope.y));
  float ndv = clamp(dot(N, V), 0., 1.), fres = .03 + .97*pow(1.-ndv, 5.);
  vec3 Rr = reflect(-V, N); float up = clamp(Rr.y, 0., 1.);
  vec3 uZen = mixH(uZenH[0], uZenH[1], uZenH[2], uZenH[3], PL.k), uHor = PL.fogCol;
  vec3 sky = mix(uHor, uZen, pow(up, .45));
  // the far shore's dark mirror lies in the low part of the reflection
  sky = mix(uHor*.45, sky, smoothstep(uBandW*.5, uBandW*1.6, up + (a.x - .5)*.04));
  float glint = pow(clamp(dot(Rr, uSunDir), 0., 1.), 220.)*3. + pow(clamp(dot(Rr, uSunDir), 0., 1.), 24.)*.2;
  // night water under the storm is never a black sheet: it mirrors the lighter bands of the storm's roof, and its wave
  // crests are pale (only where the storm stands: 1 - k.x)
  float st = 1. - PL.k.x;
  sky *= 1. + st*1.6*smoothstep(.3, .75, vnoise(Rr.xz/max(Rr.y, .1)*.9 + uTime*.012));
  vec3 col = mix(uDeep*(uSkyCol*.8 + uSunCol*.25), sky, fres) + uSunCol*glint;
  col += st*uSkyCol*.34*smoothstep(.6, .92, a.x*.6 + b.x*.4 + .12*c.x)*(.3 + .7*fl);
  // a small light's broken path on the water toward the eye (the fire on the shore, the ring): where a ripple's mirror
  // faces the light, less with the light's distance from that water
  vec3 tf = uFire.xyz - vW; float lf = max(length(tf), .01);
  col += uFireCol*(pow(max(dot(Rr, tf/lf), 0.), 120.)*1.3 + pow(max(dot(Rr, tf/lf), 0.), 28.)*.16)/(1. + lf*lf/8100.)*uFireK;
  vec3 tp = uPortal.xyz - vW; float lp = max(length(tp), .01);
  col += uPortalCol*(pow(max(dot(Rr, tp/lp), 0.), 90.)*1.1 + pow(max(dot(Rr, tp/lp), 0.), 20.)*.14)/(1. + lp*lp/6400.);
  // the flash: the whole sheet takes fire, brightest where the ripples face the bolt
  float fire = uFlash*uFireK*(.1 + .9*pow(clamp(dot(reflect(-V, normalize(vec3(-slope.x*2.5, 1., -slope.y*2.5))), uFlashDir), 0., 1.), 3.));
  col += uFlashCol*fire*(.3 + .5*fres);
  // white where it breaks on the shore, in ragged lines that come and go
  float sh = clamp(vShore, 0., 40.);
  float foam = (1.-smoothstep(.0, 1.6, sh - .5*a.x))*smoothstep(.35, .7, b.x + .25*sin(sh*2.2 - uTime*1.3))*uFoam;
  col = mix(col, (uSkyCol + uSunCol*.6)*.85, clamp(foam, 0., 1.));
  float alpha = smoothstep(0., .5, sh)*(.72 + .28*fres);
  gl_FragColor = vec4(col, clamp(alpha + foam, 0., 1.));
  gl_FragColor.rgb = placeFog(gl_FragColor.rgb, PL, vFd);
}`,
  });
}

// ---------------------------------------------------------------- mountains: needles of rock, the great dome
const C_ROCK = col3('#5c636a'), C_ROCK2 = col3('#787b7e'), C_ROCKWARM = col3('#7d7166');
// a peak into the land accumulator: middle (x, z), foot height y0, radius R, height H; kind 'needle' (a sharp spire of bare
// rock, snow only on its ledges) or 'dome' (a broad white head over bands of rock). Ribs run down it by its own draws.
export function peakInto(A, rng, noise, o) {
  const dome = o.kind === 'dome', rings = o.rings ?? (dome ? 16 : 11), seg = o.seg ?? (dome ? 34 : 16);
  const ribs = rng.int(4, 7), rp = rng.range(0, TAU), ox = rng.range(0, 90), lean = dome ? 0 : 0.3 * rng.range(-0.18, 0.18), la = rng.range(0, TAU);
  const snowLine = o.snowLine ?? (dome ? 0.3 : 0.9), id = [];
  for (let i = 0; i <= rings; i++) {
    const f = i / rings, q = dome ? Math.pow(f, 1.25) : Math.pow(f, 1.6);
    for (let j = 0; j < seg; j++) {
      const th = j / seg * TAU + (i & 1) * Math.PI / seg, rib = Math.pow(Math.abs(Math.sin(th * ribs / 2 + rp)), 0.7);
      const rr = o.R * q * (1 + (dome ? 0.12 : 0.3) * (rib - 0.5) + 0.16 * noise.n2(Math.cos(th) * 1.7 + ox, Math.sin(th) * 1.7 + f * 2));
      // the profile: a dome is round above and steep below its shoulders; a needle is a spire that sharpens to its point
      const h = dome ? Math.pow(1 - Math.pow(Math.min(1, q), 1.9), 0.62) : Math.pow(1 - q, 1.35) * (0.86 + 0.28 * rib) + 0.1 * (1 - q) * noise.n2(th * 3 + ox, f * 5);
      const y = o.y0 + o.H * Math.max(0, h) * (1 + (i > 0 ? 0.05 * noise.n2(Math.cos(th) * 4 + ox, Math.sin(th) * 4 + f * 7) : 0));
      const x = o.x + Math.cos(th) * rr + Math.cos(la) * lean * (y - o.y0), z = o.z + Math.sin(th) * rr + Math.sin(la) * lean * (y - o.y0);
      const hh = (y - o.y0) / o.H;
      // snow: all of a dome above its snow line, and ledges; rock shows on its steep shoulders in dark bands
      const band = dome ? smoothstep(0.42, 0.6, noise.n2(th * 2.2 + ox, hh * 6.5)) * (1 - smoothstep(0.55, 0.85, hh)) : 0;
      const snow = dome ? clamp(smoothstep(snowLine - 0.12, snowLine + 0.1, hh) * (1 - 0.85 * band) + 0.25 * (1 - rib), 0, 1) : clamp(smoothstep(snowLine - 0.5, snowLine, hh) * 0.3 + 0.5 * smoothstep(0.55, 0.9, noise.n2(th * 4 + ox, hh * 9)) * (1 - rib), 0, 1);
      const rock = mix3(mix3(C_ROCK, C_ROCK2, noise.n2(th * 3 + ox, hh * 4) * 0.5 + 0.5), C_ROCKWARM, o.warm ?? 0.2);
      id.push(A.v(x, y, z, mix3(rock, C_SNOW, snow), 0, snow, 0));
    }
  }
  // a needle MEETS its ground: an apron of dark rubble and dirty snow round its foot, half its radius wide, falling a
  // tenth of its height
  let nr = rings;
  if (!dome) {
    nr = rings + 1;
    for (let j = 0; j < seg; j++) { const th = j / seg * TAU + (nr & 1) * Math.PI / seg, rr = o.R * 1.5 * (1 + 0.14 * noise.n2(Math.cos(th) * 2.3 + ox, Math.sin(th) * 2.3)), sn = 0.3 + 0.3 * noise.n2(th * 3 + ox, 1.7);
      id.push(A.v(o.x + Math.cos(th) * rr, o.y0 - 0.1 * o.H, o.z + Math.sin(th) * rr, mix3(C_MORAINE, C_SNOW, clamp(sn, 0, 1) * 0.6), 0, clamp(sn, 0, 1) * 0.6, 0)); }
  }
  for (let i = 0; i < nr; i++) for (let j = 0; j < seg; j++) {
    const a = id[i * seg + j], b = id[i * seg + (j + 1) % seg], c = id[(i + 1) * seg + j], d = id[(i + 1) * seg + (j + 1) % seg];
    if (i & 1) { A.tri(a, d, c); A.tri(a, b, d); } else { A.tri(a, b, c); A.tri(b, d, c); }
  }
}
// THE PERPENDICULAR ROCK: a sheer face along a line (pts: [[x, z], ...], the ice on the left of the line's direction), from
// its foot (yFoot at each point) to its ragged top; buttresses, chimneys and ledges with snow by its own draws. The face leans
// back a little and its top runs back `depth` metres as a sloping shoulder.
export function wallInto(A, rng, noise, pts, o) {
  const nv = o.levels ?? 11, n = pts.length, id = [], ox = rng.range(0, 90);
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    // the face's outward (toward the ice): the left of the line's direction
    const nx = tz, nz = -tx, end = Math.min(1, i / 3, (n - 1 - i) / 3), H = o.H(i) * (0.35 + 0.65 * smoothstep(0, 1, end)) * (1 + 0.16 * noise.n2(i * 0.31 + ox, 3.3));
    const row = [];
    // THE WALL MEETS ITS GROUND: a moraine apron of dark rubble and dirty ice at its foot, from the ice 26 m out up to
    // 10 m on the face (the face's own lowest corners begin above it)
    { const b0 = 9 * noise.n2(i * 0.42 + ox, 0) + 4 * noise.n2(i * 1.1, ox) + 14, g = 0.5 + 0.5 * noise.n2(i * 0.7 + ox, 9.3);
      row.push(A.v(p[0] + nx * (b0 + 26 + 8 * g), p[2] + 1.5, p[1] + nz * (b0 + 26 + 8 * g), mix3(C_MORAINE, C_ICE_OLD, 0.3 + 0.3 * g), 0.3, 0.1, 0.6));
      row.push(A.v(p[0] + nx * (b0 + 9), p[2] + 10 + 5 * g, p[1] + nz * (b0 + 9), mix3(C_MORAINE, C_ROCK, 0.4 * g), 0, 0.12 * g, 0)); }
    for (let k = 1; k <= nv; k++) {
      const f = Math.min(1, k / (nv - 2)), back = Math.max(0, k - (nv - 2)) / 2;
      const but = 9 * noise.n2(i * 0.42 + ox, f * 1.6) + 4 * noise.n2(i * 1.1, f * 5 + ox) + 14 * Math.pow(1 - f, 2.2);
      const out = but - f * 10 - back * o.depth, y = p[2] + (back > 0 ? H * (1 + 0.12 * back) + 30 * back : H * f);
      const ledge = smoothstep(0.5, 0.8, noise.n2(i * 0.5 + ox, f * 7)) * 0.55 + (back > 0 ? 0.75 : 0);
      const c = mix3(mix3(C_ROCK2, C_ROCKWARM, 0.45 + 0.4 * noise.n2(i * 0.2 + ox, f * 2.4)), C_ROCK, 0.5 * noise.n2(i * 0.9, f * 11) + 0.3);
      row.push(A.v(p[0] + nx * out, y, p[1] + nz * out, mix3(c, C_SNOW, ledge), 0, ledge, 0));
    }
    id.push(row);
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < id[i].length - 1; k++) A.quad(id[i][k], id[i][k + 1], id[i + 1][k + 1], id[i + 1][k]);
}

// ---------------------------------------------------------------- the ruined castle, the blasted stump, the bolts
// a ruin on its crag: origin at the middle of its foot, its gate side toward +z. Returns its reach { radius, height }.
export function castleInto(B, rng) {
  const stone = () => { const k = rng.range(0.8, 1.15), c = mix3(col3('#55554f'), col3('#6b655a'), rng()); return [c[0] * k, c[1] * k, c[2] * k]; };
  const cap = col3('#aeb6bd'), dark = col3('#0d0d10');
  // a length of wall between two points, whole or broken down in steps
  const wall = (a, b, h, ruin) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(len / 3.2));
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n, hh = h * (ruin ? clamp(1 - ruin * (0.3 + 0.7 * Math.abs(Math.sin(k * 1.7 + ruin * 9))), 0.25, 1) : 1) + (k % 2 ? 0.9 : 0);
      B.box(lerp(a[0], b[0], u), hh / 2 - 1, lerp(a[1], b[1], u), 0.7, hh / 2 + 1, len / n / 2 + 0.02, stone(), yaw, 0, cap);
    }
  };
  // a round tower: drum, a corbelled head with merlons, or a broken top
  const tower = (x, z, r, h, broken) => {
    const c = stone(); B.cyl([x, -3, z], [x, h, z], r * 1.06, r, 9, c, c);
    if (broken) { for (let k = 0; k < 5; k++) { const a = rng.range(0, TAU) , hh = rng.range(1, 5.5); B.box(x + Math.cos(a) * r * 0.62, h + hh / 2, z + Math.sin(a) * r * 0.62, r * 0.42, hh / 2, r * 0.3, stone(), -a, 0, cap); } }
    else { B.cyl([x, h, z], [x, h + 1.6, z], r * 1.16, r * 1.16, 9, stone(), cap); for (let k = 0; k < 8; k += 2) { const a = k / 8 * TAU + 0.3; B.box(x + Math.cos(a) * r * 1.05, h + 2.2, z + Math.sin(a) * r * 1.05, 0.55, 0.65, 0.45, stone(), -a, 0, cap); } }
    for (let k = 0; k < 2; k++) { const a = rng.range(0, TAU); B.box(x + Math.cos(a) * r * 1.0, h * rng.range(0.45, 0.8), z + Math.sin(a) * r * 1.0, 0.28, 0.75, 0.12, dark, Math.PI / 2 - a); }
  };
  const R = rng.range(13, 16), n = 5, cor = [];
  for (let k = 0; k < n; k++) { const a = k / n * TAU + rng.range(-0.2, 0.2) + 0.3, r = R * rng.range(0.82, 1.1); cor.push([Math.cos(a) * r, Math.sin(a) * r]); }
  // A LOW ROOFLESS RUIN: every wall broken down in steps (5 to 7 m where it stands highest), every tower a broken stump
  // of 7 to 11 m (no whole tower, no head, no roof), the keep a shell of 9 to 11 m; no light in it
  const hs = cor.map(() => 4 + 0.28 * rng.range(13, 20)); hs[rng.int(0, n - 1)] = 4 + 0.28 * rng.range(22, 26);
  const brk = rng.int(0, n - 1);
  for (let k = 0; k < n; k++) { const ru = k === brk || rng.chance(0.3) ? rng.range(0.5, 0.9) : 0.42; wall(cor[k], cor[(k + 1) % n], 0.75 * rng.range(7, 9.5), ru); rng.chance(0.25); tower(cor[k][0], cor[k][1], rng.range(2.6, 3.6), hs[k], true); }
  // the keep's shell, its top broken down
  const kw = rng.range(4, 5), kd = rng.range(3.6, 4.4), kh = 0.45 * rng.range(21, 25), kx = rng.range(-2, 2), kz = rng.range(-3, 1), kc = stone();
  B.box(kx, kh / 2 - 1.5, kz, kw, kh / 2 + 1.5, kd, kc, 0.2, 0, cap);
  for (let k = 0; k < 4; k++) B.box(kx + (k % 2 ? 1 : -1) * kw * 0.5, kh + rng.range(0.5, 2.2), kz + (k < 2 ? 1 : -1) * kd * 0.5, kw * 0.42, rng.range(0.6, 2.4), kd * 0.4, stone(), 0.2, 0, cap);
  for (let k = 0; k < 5; k++) B.box(kx + rng.range(-0.6, 0.6) * kw, kh * rng.range(0.3, 0.85), kz + kd * 1.02, 0.3, 0.9, 0.1, dark, 0.2);
  return { radius: R * 1.1 + 3.6, height: Math.max(kh + 4, ...hs) + 3 };
}
// a cottage: w wide (across its ridge), d long, walls h high, turned by yaw; origin at the middle of its floor. Returns the
// chimney's top (for a thread of smoke).
export function cottageInto(B, x, y, z, yaw, w, d, h) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), P = (lx, ly, lz) => [x + lx * cy + lz * sy, y + ly, z - lx * sy + lz * cy];
  const wall = col3('#6f6558'), wall2 = col3('#877c6c'), roof = col3('#4a4640'), snow = col3('#dfe6ee'), dark = col3('#17140f');
  B.box(x, y + h / 2 - 0.6, z, w / 2, h / 2 + 0.6, d / 2, wall, yaw, 0, wall2);
  const rh = 0.42 * w, e = 0.5;
  for (const sg of [-1, 1]) {
    const a = P(sg * (w / 2 + e), h - 0.15, -d / 2 - e), b = P(sg * (w / 2 + e), h - 0.15, d / 2 + e), c = P(0, h + rh, d / 2 + e), dd = P(0, h + rh, -d / 2 - e);
    if (sg > 0) B.quad(a, dd, c, b, roof, snow); else B.quad(b, c, dd, a, roof, snow);
    const g0 = P(-w / 2, h, sg * d / 2), g1 = P(w / 2, h, sg * d / 2), g2 = P(0, h + rh - 0.1, sg * d / 2);
    if (sg > 0) B.tri(g0, g1, g2, wall2); else B.tri(g1, g0, g2, wall2);
  }
  // a door and one shuttered window on the long side, dark; the chimney at one gable
  { const q = P(w / 2 + 0.03, 0.95, -d * 0.2); B.box(q[0], q[1], q[2], 0.05, 0.95, 0.5, dark, yaw); const q2 = P(w / 2 + 0.03, 1.5, d * 0.22); B.box(q2[0], q2[1], q2[2], 0.05, 0.4, 0.45, dark, yaw); }
  const ch = P(0, h + rh + 0.5, d / 2 - 0.7); B.box(ch[0], ch[1] - 0.6, ch[2], 0.4, 1.0, 0.4, wall, yaw, 0, dark);
  return [ch[0], ch[1] + 0.5, ch[2]];
}
// A FIRE'S FLAME: tongues of fire on crossed upright sheets w wide and H high, origin at the fire's foot. The tongues climb
// and flicker on the world's clock (uTime): yellow-white at the foot, orange to red at the tips; added light, no shadow.
export function makeFlame(U, o = {}) {
  const w = o.width ?? 3, H = o.height ?? 9, n = o.sheets ?? 4, pos = [], uv = [], idx = [];
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI, c = Math.cos(a) * w / 2, sn = Math.sin(a) * w / 2, b = pos.length / 3;
    pos.push(-c, 0, -sn, c, 0, sn, c, H, sn, -c, H, -sn); uv.push(-1, 0, k, 1, 0, k, 1, 1, k, -1, 1, k); idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 3)); g.setIndex(idx); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'attribute vec3 aUv; varying vec3 vUv; void main(){ vUv = aUv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
    fragmentShader: /* glsl */`uniform float uTime; varying vec3 vUv;
${fx.GLSL_NOISE}
void main(){
  float x = vUv.x, y = vUv.y, sd = vUv.z*3.7;
  float n = vnoise(vec2(x*2.1 + sd, y*2.6 - uTime*2.8))*.6 + vnoise(vec2(x*5.3 - sd, y*6. - uTime*4.6))*.4;
  // a tongue: widest at the foot, narrowing and breaking toward its tip, swaying
  float sway = (vnoise(vec2(sd, uTime*.9 + y*1.3)) - .5)*.7*y;
  float half_ = (1. - y*(.72 + .5*n))*(.5 + .5*n);
  float hw_ = max(half_, .002), body = 1. - smoothstep(hw_*.3, hw_, abs(x - sway));
  float a = clamp(body*(1. - smoothstep(.5, 1., y + (1. - n)*.5))*smoothstep(0., .05, y), 0., 1.);
  vec3 col = mix(vec3(1., .46, .07), vec3(1., .93, .62), (1. - smoothstep(0., .5, y + abs(x - sway)*.7)));
  col = mix(col, vec3(1., .2, .03), smoothstep(.45, 1., y));
  gl_FragColor = vec4(col*a*(o_k), a);
}`.replace('o_k', (o.gain ?? 1.5).toFixed(2)),
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = o.name || 'flame'; mesh.renderOrder = 4;
  return { mesh };
}
// the blasted stump: a charred butt and what is left of the trunk, split into thin ribbons of pale wood that stand and hang
// from it; splinters thrown on the ground about it. Origin at the trunk's foot.
export function stumpInto(B, rng) {
  const char = col3('#0e0c0b'), pale = col3('#c8b287'), mid = col3('#6b5234');
  B.cyl([0, -0.6, 0], [0, 1.5, 0], 1.25, 0.95, 9, char, mix3(char, mid, 0.4));
  B.cyl([0, 1.5, 0], [0.15, 2.5, 0.1], 0.95, 0.7, 9, mix3(char, mid, 0.5), char);
  for (let k = 0, n = rng.int(16, 22); k < n; k++) {
    const a = rng.range(0, TAU), r0 = rng.range(0.15, 0.7), len = rng.range(1.4, 5.2), out = rng.range(0.1, 0.95), w = rng.range(0.1, 0.3);
    const a0 = [Math.cos(a) * r0, 2.3 + rng.range(-0.3, 0.3), Math.sin(a) * r0], mid1 = [a0[0] + Math.cos(a) * len * out * 0.4, a0[1] + len * 0.55, a0[2] + Math.sin(a) * len * out * 0.4];
    const tip = [mid1[0] + Math.cos(a + rng.range(-0.5, 0.5)) * len * out * 0.6, mid1[1] + len * (0.45 - out * 0.7), mid1[2] + Math.sin(a + rng.range(-0.5, 0.5)) * len * out * 0.6];
    B.band(a0, mid1, w, pale, [Math.cos(a), 0, Math.sin(a)]); B.band(mid1, tip, w * 0.7, mix3(pale, char, rng.range(0.2, 0.8)), [Math.cos(a), 0, Math.sin(a)]);
  }
  for (let k = 0, n = rng.int(10, 14); k < n; k++) {
    const a = rng.range(0, TAU), r = rng.range(1.6, 7.5), l = rng.range(0.8, 3.2), b = a + rng.range(-1.2, 1.2);
    B.band([Math.cos(a) * r, 0.12, Math.sin(a) * r], [Math.cos(a) * r + Math.cos(b) * l, 0.2 + rng.range(0, 0.5), Math.sin(a) * r + Math.sin(b) * l], rng.range(0.12, 0.3), mix3(pale, mid, rng()), [0, 1, 0]);
  }
  return { top: [0.1, 2.6, 0.05] };
}
// a bolt: a jagged way between two points with forks, as two crossed bands w wide (for an unlit, added material)
export function boltGeometry(rng, a, b, w, forks = 3) {
  const B = makeProp(), white = [1, 1, 1];
  const run = (p0, p1, wd, depth) => {
    let pts = [p0, p1];
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    for (let it = 0, amp = len * 0.11; it < 4; it++, amp *= 0.52) {
      const nx = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; nx.push([(p[0] + q[0]) / 2 + rng.range(-amp, amp), (p[1] + q[1]) / 2 + rng.range(-amp, amp) * 0.4, (p[2] + q[2]) / 2 + rng.range(-amp, amp)], q); }
      pts = nx;
    }
    for (let i = 0; i < pts.length - 1; i++) { const k = 1 - 0.5 * i / pts.length; B.band(pts[i], pts[i + 1], wd * k, white, [1, 0, 0.2]); B.band(pts[i], pts[i + 1], wd * k, white, [0.2, 0, 1]); }
    if (depth > 0) for (let f = 0; f < forks; f++) {
      const i = rng.int(2, pts.length - 4), p = pts[i], l = len * rng.range(0.15, 0.4), an = rng.range(0, TAU);
      run(p, [p[0] + Math.cos(an) * l * 0.7, p[1] - l * 0.75, p[2] + Math.sin(an) * l * 0.7], wd * 0.5, depth - 1);
    }
  };
  run(a, b, w, 1);
  return B.build();
}

// ---------------------------------------------------------------- THE FIGURE'S ROUND
// A CLOSED ROUND of bounds over the ice, run on the world's clock whether anyone is there or not. curve(q, o) gives the plan
// place (o.x, o.s) at q metres round the loop (0..Q; it closes). Footfalls are laid round it about a stride apart, clear of
// every rift's lips (a bound is lengthened or shortened to clear one), and the last bound closes on the first footfall.
// at(q, o) gives his place, his heading and his bound at q metres round, for any q (it wraps).
export async function makeRound(rng, sea, curve, Q, stride = 9, ctx = null) {
  const c = {}, bad = []; let open = null;
  for (let q = 0, i = 0; q <= Q; q += 0.25, i++) {
    if (ctx && i % 160 === 159) await ctx.yield();
    curve(q, c); const cut = sea.cutDepth(c.x, c.s, sea.swOf(c.x, c.s)) > 0.01;
    if (cut && !open) open = [q - 1.1, q]; if (cut && open) open[1] = q + 1.1;
    if (!cut && open && q > open[1]) { bad.push(open); open = null; }
  }
  if (open) bad.push(open);
  const inBad = (q) => { for (const b of bad) { if (q > b[0] && q < b[1]) return b; if (q - Q > b[0] && q - Q < b[1]) return [b[0] + Q, b[1] + Q]; } return null; };
  // the first footfall: the loop's own start, or the far lip of the rift that lies there
  const b0 = inBad(0), f0 = b0 ? b0[1] : 0, fs = [f0]; let f = f0;
  while (f < f0 + Q - stride * 1.45) {
    let next = f + stride * rng.range(0.9, 1.1); const b = inBad(next);
    if (b) next = b[0] - f >= 3.5 ? b[0] : b[1];
    fs.push(next); f = next;
  }
  fs.push(f0 + Q);
  const gy = fs.map((q) => { curve(q % Q, c); return sea.surfAt(c.x, -c.s); }), rise = fs.map((q, k) => { const l = (fs[k + 1] ?? q + stride) - q; return 0.25 + 0.012 * l * l; });
  gy[gy.length - 1] = gy[0];
  const at = (q, o) => {
    const qq = ((((q - f0) % Q) + Q) % Q) + f0;
    let lo = 0, hi = fs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (fs[m] <= qq) lo = m; else hi = m; }
    const fly = (qq - fs[lo]) / (fs[hi] - fs[lo]);
    curve((qq + 1.5) % Q, c); const x1 = c.x, s1 = c.s; curve(qq % Q, c);
    o.x = c.x; o.z = -c.s; o.s = c.s; o.y = lerp(gy[lo], gy[hi], fly); o.yaw = Math.atan2(x1 - c.x, -(s1 - c.s)); o.c = lo + fly; o.fly = fly; o.rise = rise[lo]; o.len = fs[hi] - fs[lo];
    return o;
  };
  return { at, footfalls: fs, heights: gy, rifts: bad, f0, Q };
}
// the strip's columns: metres aside of its middle, `fine` apart out to `near`, then widening by `grow` to `reach`
export function stripOffsets(fine = 2.5, near = 30, grow = 1.15, reach = 1300) {
  const half = []; let d = fine, x = 0;
  while (x < reach) { half.push(x); if (x >= near) d *= grow; x += d; }
  half.push(reach);
  return half.slice(1).reverse().map((v) => -v).concat(half);
}

// ---------------------------------------------------------------- buildHero: the sea of ice with the figure crossing it
// opts.field: the place (see makeIceSea); without it a stretch of its own is laid, for the set-piece viewer. opts.U: the
// world's light; opts.streams: { rifts, leads, floes, figure }. With a place handed in nothing moves here by itself: the
// world drives the figure and the break. Alone, the figure runs the ice on the clock.
export async function buildHero(ctx, opts = {}) {
  const own = !opts.field, U = opts.U || makeLightUniforms(), rng = ctx.rng, noise = ctx.noise;
  const R = opts.streams || { rifts: rng.fork('rifts'), leads: rng.fork('leads'), floes: rng.fork('floes'), figure: rng.fork('figure') };
  const F = opts.field || {
    noise, dens: 1, offs: stripOffsets(2.5, 30, 1.2, 420), s0: 0, sGate: 250, sBreak: 330, sEdge: 420, floeHalf: 0, rim: 10,
    route: () => 0, axis: () => 0, level: (s) => 22 + 0.03 * clamp(s, 0, 250),
    inside: (x, s) => (s > 250 ? 400 : Math.min(150 - Math.abs(x) + Math.max(0, s - 200) * 3, s + 6 - (x / 150) * (x / 150) * 50)),
    land: (x, z, o) => { o.x = x; o.z = z; o.y = Math.max(0, Math.abs(x) - 150) * 0.9 + 3 * noise.n2(x * 0.02, z * 0.02); o.c = mix3(C_ROCK, C_ROCK2, 0.5 + 0.5 * noise.n2(x * 0.05, z * 0.05)); o.ice = 0; o.snow = 0; o.depth = 0; },
  };
  if (own) { const offs = F.offs; F.floeHalf = offs.find((v) => v >= 90); }
  const object = new THREE.Group();
  const sea = await makeIceSea(ctx, U, F, R);
  object.add(sea.mesh);
  await ctx.yield();
  const floes = await makeFloes(ctx, U, F, R.floes, opts.keep || null);
  object.add(floes.mesh);
  const figure = makeFigure(U, { cloak: true });
  object.add(figure.mesh);
  await ctx.yield();
  let update = () => {};
  if (own) {
    // alone: a low sun for the viewer, black water under the floes, and the figure running the river on the clock
    for (let i = 0; i < 4; i++) setHour(U, i, { sunDir: new THREE.Vector3(-0.6, 0.55, -0.4), sun: [1.0, 0.9, 0.75], sky: [0.2, 0.28, 0.46], gnd: [0.13, 0.17, 0.22], fog: [0.33, 0.5, 0.75], zen: [0.02, 0.08, 0.4], fogDen: 0.0004 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 300).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#05090f' })); water.position.set(0, floes.sea, -F.sBreak - 100); object.add(water);
    // (a closed round on the clock: out by one line, round, back by another)
    const QV = 2 * 200 + TAU * 14, lap = (q, o) => { if (q < 200) { o.x = -14; o.s = 35 + q; } else if (q < 200 + Math.PI * 14) { const a = (q - 200) / 14; o.x = -14 * Math.cos(a); o.s = 235 + 14 * Math.sin(a); } else if (q < 400 + Math.PI * 14) { o.x = 14; o.s = 235 - (q - 200 - Math.PI * 14); } else { const a = (q - 400 - Math.PI * 14) / 14; o.x = 14 * Math.cos(a); o.s = 35 - 14 * Math.sin(a); } };
    const runner = await makeRound(R.figure, sea, lap, QV, 8, ctx), st = {};
    object.position.set(0, -F.level(0), 200);
    update = (dt, time) => {
      U.uTime.value = time; U.uOpen.value = 0.5 + 0.5 * Math.sin(time * 0.3); U.uSwell.value = 1;
      runner.at(time * 16, st);
      figure.mesh.position.set(st.x, st.y, st.z); figure.mesh.rotation.y = st.yaw; figure.pose({ c: st.c, fly: st.fly, rise: st.rise, time });
    };
  }
  return { object, radius: 150, height: 40, center: new THREE.Vector3(0, 12, 60), anchors: {}, ground: false, U, field: F, sea, floes, figure, update, dispose() {} };
}
