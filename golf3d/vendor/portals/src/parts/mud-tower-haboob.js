// Hero set piece for "mud-tower-haboob" (The Wall of Dust): THE SHADOW LINE.
//
// What it is: the 800 m haboob front (a boiling, backlit, lobed dust wall 3.5 km wide), the hard-edged storm
// shadow it throws ahead of itself, and the field of ~480 white-crowned mud-brick tower houses that the shadow
// eats one by one: gold -> umber as the line climbs each wall (parapets go last), sand streaming off the
// parapets, the tower dissolving into brown as the dust arrives. Forty kites on strings stand over the roofs
// and are torn off one by one by a "tear line" that runs ahead of the shadow; carpets lift off the parapets.
//
// LOCAL SPACE (contract: origin base centre, +Y up, front toward +Z):
//   the storm comes from -Z and advances toward +Z; the town is centred on the origin, 420 m wide in X
//   (|x| < 210) and 560 m deep in Z (|z| < 280). To match the brief (storm from world +X, X east, Z south):
//       hero.object.rotation.y = -Math.PI / 2      // local (x, y, z) -> world (-z, y, x)
//   so world X = -local z, world Z = local x. All anchors below are local; use object.localToWorld().
//
// PROGRESS (never wall-clock): hero.setProgress(u) with the world's path progress u. It evaluates the brief's
//   curves: frontX(u) = 2400, 1100, 530, 320, 240 m at u = 0, .53, .67, .83, 1 (distance of the front's foot
//   east of the town centre), shadow line 300 m ahead of it, gust 0..1 over u .60-.66, and the kite tear line
//   sweeping from 300 m east to 300 m west of the centre over u .62-.92. Override with opts.frontX(u),
//   opts.tearX(u), opts.gust(u), or drive directly with hero.setStorm({ front, shadow, tear, gust }) (metres
//   east of centre). Rolling of the lobes, kite dancing, sand scroll and the inner glow are ambient (time).
//
// SHARED SHADING for the rest of the world: hero.patchMaterial(material) patches any built-in lit three.js
//   material (terrain, palms, lane kit, town wall, cairns) so it receives exactly the same shadow line and the
//   same analytic dust fog as the hero (it chains an existing onBeforeCompile). hero.uniforms holds the shared
//   uniforms and hero.glsl the GLSL (hbShadow(heroPos), hbFog(heroPos, camHeroPos)) for custom shaders.
//
// opts: palette (brief palette: lime, mud, umber, dark, ochre, sky, green) | towers (true; false = only the
//   wall, shadow, kites) | ground (true: own shaded ground plane at y = 0; pass false when the world has a
//   terrain and patch that instead) | kites (40) | street (true: keep the 9 m lane of the brief clear, see
//   anchors.lane) | keepOut(x, z, halfW, halfD) -> true to refuse a tower footprint (local metres) |
//   sunDir ([x,y,z] local, toward the sun; default 64 deg up behind the wall) | sunColor | bounce (0.24: fill
//   on tower faces the sun misses, as a fraction of sunColor, cut by the storm shadow; 0 to switch off) | progress (0.8, the
//   stage shown until setProgress is called) | frontX, tearX, gust (curves) | extraTowers ([{ x, z, w, d, h, seed, variant, tint, white,
//   warm, cloth }] in local metres: plots outside the wall that join the instanced town; they fly no kites).
//   kitesAt ([{ x, y, z, size, col }] local metres: extra kites held near those points, each tied to the nearest roof that can
//   hold it, never torn off).
// ARRIVAL: hero.setArrival(k) (0..1) is the look of the last third, when the front stands over the town: the near puff discs go,
//   the wall's foot and the dust under the shadow darken, the shadow's edge on the ground tightens to 24 m of bigger lobes and what
//   the sun still reaches turns warm. hero.setRent(i, x, z, radius, strength), i = 0..2, opens a pool of sun in the storm shadow.
//
// SIZE: town 420 x 560 m, towers 20-37 m; dust wall 3500 m wide, 800 m high, standing at local z = -frontX.
//   radius/height/center returned are FRAMING hints for the town (radius 190); real extents are in hero.extent.
// COST: about 113k triangles, 8 draw calls (3 tower variants, sand, kites, wall, puffs, ground); no lights, no textures,
//   build ~60 ms. ctx.quality.detail only thins the wall grid and the puffs.
// PUFFS: about 90 soft camera-facing discs ride the shell's own surface (the same wallPos) along its foot and its north shoulder,
//   so the wall has a rolling skirt and a ragged profile; edge light on the wall is taken from a smoothed normal, so only the
//   outer silhouette glows, not every fold.
// WORLD HOOKS: opts.wallColors { dark, mid, tan, ochre, dust } recolour the front; hero.setWallLit(k) lights its face
//   directly (sun behind the camera); hero.setLamps(k) lights a few lattices; hero.setBounce(color) retints the fill on
//   tower faces; hero.setSpot(localX, localZ, radius, strength) opens a round hole in the storm shadow (the rare sun shaft).
//   opts.gild (0.85): how strongly a high sun gilds the flank of every billow turned to it (lit heads over brown-black throats, on the wall and
//   on the puffs); opts.gildLow (0): the same under a low sun, in the front's ochre (first light). Near billows are drawn with their depth
//   pulled toward the eye, so the shell does not slice them; close to, the wall's face has a third, 6 m grain.
//   opts.thin (0 | 1, uniform uHbThin): a thin front, a veil whose dust is under half as dense, so towers behind the shadow line show through it.
// SUN SHADOWS: await hero.bakeShadows(sunDirLocal, occluders) sweeps a 1 m height map of the towers (plus the world's boxes
//   { x, z, hx, hz, h } and discs { x, z, r, h }, local metres) along the sun once; every patched material then reads it
//   with one lookup (hbTown / hbTownW in hero.glsl), so lanes, roofs and groves get real cast shadows without a shadow map pass.
//   An occluder with thin: true (a palm's crown disc, or with post: true its trunk) is not swept but laid down where its shade falls.
//   bakeShadows(dir, occluders, { sunSlots: true }) lets bars of sun into the street every 14 m (the brief's sun stripes).
//   Round thirteen: the storm shadow's edge on the ground is 60 m of drifting, torn shade (on towers it stays the hard climbing line);
//   the dust fog hangs in curtains; puffs are modelled balls of dust (dark throat, warm limb toward the sun), 14 more hide the line where
//   the shell crosses the north cliff and 28 near billows come up with hero.setNearBillows(k) over the last third; close to, the wall's
//   face keeps its lobes instead of melting to haze; landmarks stand 55 to 66 m; one roof in four carries a carpet or a mat of dates.
//   opts.landmarks (7): that many houses stand a third taller than the rest, lime-washed further down, clear of the street and the flown line.
//   hero.patchMaterial(material, key, { uniforms, lit }) may add GLSL that runs after the lights (see the world's ground detail).
//   A texel of 0 means no shadow; ground below y = 0 (the riverbed) is tested as if at 0. Inside the town's shadows every patched
//   material is filled by hero.setBounce's colour (uHbBounce), so lanes read warm, not black. The dust shell reaches 2,600 m north.
// LIGHTING: towers and ground are MeshStandardMaterial lit by the scene (one high white sun from behind the
//   wall plus hemisphere/ambient; fog thin). The wall, sand and kites are self-shaded from hero.setSun().
//
// ANCHORS (local): portalSeat {position, facing} (brief's (-110, -440) on the riverbed, centre 9 m up, facing
//   back down the approach) | flyThrough: reveal line from the lane end over the roofs to the portal, 6 m+
//   clear (kites and strings keep 12 m off it) | lane: centre line of the 9 m street kept clear (gate ->
//   square -> low house), laneHalfWidth 4.5 | square {position, size} | gate | lowHouse | revealLook (where the
//   gaze should go at the reveal) | viewpoints | towers: [{x, z, w, d, h, yaw}] roofs for pigeons and lofts |
//   kites: [{anchor, kite}] | stormAxis (unit vector the storm travels along) | windDir.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#F7F1E3', '#C79A63', '#7A4A2A', '#2E1D14', '#D9822B', '#6FA9D8', '#4E7A3A'];
const TOWN_HX = 210, TOWN_HZ = 280, BATTER = 0.052, SHADOW_LEAD = 300, SHADOW_SLOPE = 0.375;
const SH_X0 = -452, SH_Z0 = -452, SH_W = 956, SH_H = 904;      // the sun-shadow map: local x -452..504 (the portal to the cliff foot), z -452..452

// ---------- shared GLSL: the storm shadow and the analytic dust fog (hero space) ----------
const HB_GLSL = /* glsl */`
uniform float uHbTime, uHbFrontZ, uHbShadowZ, uHbTearZ, uHbGust, uHbThin, uHbNear;   // uHbNear: 0 until the front stands over the town, 1 in the arrival (hero.setArrival)
uniform vec3 uHbDust, uHbUmber, uHbBounce;
uniform vec4 uHbSpot;
uniform vec4 uHbRents[3];                                      // rents in the wall in the arrival: x, z of the pool of sun on the ground, radius, strength
uniform vec2 uHbRentDir;                                       // the sun's run per metre of height, so the pool climbs a tower along the beam
uniform mat4 uHbInv;
uniform sampler2D uHbShMap;
uniform vec4 uHbShBox;
float hbSg = 0.;                                               // the storm shadow at this fragment, kept by the lit patch for its fog step
float hbHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hbN2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hbHash(i), hbHash(i + vec2(1., 0.)), f.x), mix(hbHash(i + vec2(0., 1.)), hbHash(i + vec2(1., 1.)), f.x), f.y); }
// lobed edge of the front and of its shadow, metres along the storm axis as a function of the lateral coordinate
float hbLobe(float x){ return 44. * sin(x * 0.0125 + 1.3) + 20. * sin(x * 0.037 + uHbTime * 0.05) + 8. * sin(x * 0.113 + 2.1 - uHbTime * 0.08); }
// 1 inside the storm shadow. The edge is a plane sloping back toward the crest, so the line climbs each tower.
float hbBow(float x){ return 0.00018 * x * x; }
float hbShadow(vec3 p){
  float e = p.z + p.y * ${SHADOW_SLOPE.toFixed(3)} - uHbShadowZ - hbLobe(p.x) + hbBow(p.x);
  float sp = uHbSpot.w * (1. - smoothstep(uHbSpot.z * 0.72, uHbSpot.z, distance(p.xz, uHbSpot.xy)));
  { vec2 rq = p.xz - uHbRentDir * max(p.y, 0.); float rn = 9. * (hbN2(rq * 0.11 + uHbTime * 0.06) - .5);
    for (int i = 0; i < 3; i++) { vec4 R = uHbRents[i]; sp = max(sp, R.w * (1. - smoothstep(R.z * 0.45, R.z, distance(rq, R.xy) + rn))); } }
  float ck = smoothstep(250., 330., abs(p.x)), gk = max(1. - smoothstep(2.5, 7., p.y), ck);   // on the ground the edge is 60 m of drifting dust shade, torn by two scales of moving noise; on a tower it stays the hard line that climbs. Outside the town (the cliffs) it is torn too, by height as well
  vec2 gq = p.xz + vec2(0., 1.6 * max(p.y - 7., 0.));
  e += gk * (34. * (hbN2(gq * 0.018 + uHbTime * 0.03) - .5) + 14. * (hbN2(gq * 0.06 - uHbTime * 0.05) - .5)) * (1. + 0.5 * uHbNear);
  e += ck * 110. * (hbN2(vec2(p.x * 0.006 + uHbTime * 0.02, p.y * 0.013 - uHbTime * 0.03)) - .5) * smoothstep(0., 40., p.y);   // up a cliff the line bellies in and out with the lobes that cast it
  float ew = mix(6., mix(30., 12., uHbNear), gk);              // in the arrival the dark front has an edge again: 24 m of soft shade along bigger lobes, not 60 m of veil
  return (1. - smoothstep(-ew, ew, e)) * (1. - sp);
}
// 1 where the towers, the town wall and the palms shade p (hero space). The map holds, for every square metre, the
// height below which the sun is hidden; n is the surface normal, so a wall is tested just outside itself.
float hbTown(vec3 p, vec3 n){
  vec2 q = (p.xz + n.xz * 1.25 - uHbShBox.xy) * uHbShBox.zw;
  float inb = step(0., q.x) * step(q.x, 1.) * step(0., q.y) * step(q.y, 1.);
  float s = textureLod(uHbShMap, clamp(q, 0., 1.), 0.).r * 48.;
  return smoothstep(0.1, 1.0, s - max(p.y, 0.)) * smoothstep(0.05, 0.4, s) * inb;     // a texel of 0 is 'no shadow', and ground below zero (the riverbed) is tested as if at zero
}
float hbTownW(vec3 hp){
  vec3 g = cross(dFdx(hp), dFdy(hp)); g = g / max(length(g), 1e-7);
  if (dot(g, (uHbInv * vec4(cameraPosition, 1.)).xyz - hp) < 0.) g = -g;
  return hbTown(hp, g);
}
// 0..1 dust between the camera and p: exponential density rising toward the front, integrated along the ray
float hbFog(vec3 p, vec3 cam){
  float cu1 = hbN2(vec2(p.x * 0.011 + uHbTime * 0.03, p.y * 0.017 - uHbTime * 0.045)), cu2 = hbN2(vec2(p.x * 0.037 - uHbTime * 0.05, p.y * 0.05 + 7. + uHbTime * 0.02));
  float cur = 0.45 + 1.15 * (0.62 * cu1 + 0.38 * cu2);          // curtains: the veil is thick here and thin there, and they drift
  float zf = uHbFrontZ + 150. + 0.55 * hbLobe(p.x * 1.7 + 300.) - hbBow(p.x) + 90. * (cu1 - 0.5) + 30. * (cu2 - 0.5);
  float e0 = exp(clamp(-(cam.z - zf) / 55., -40., 5.)), e1 = exp(clamp(-(p.z - zf) / 55., -40., 5.));
  float k = (p.z - cam.z) / 55.;
  float f = abs(k) > 1e-3 ? (e0 - e1) / k : e0;
  f = max(f, min(e0, e1));
  return 1. - exp(-0.028 * cur * mix(1., 0.45, uHbThin) * distance(p, cam) * f * exp(-max(0.5 * (p.y + cam.y), 0.) / 240.));   // a thin front (uHbThin 1) only veils: towers stay as silhouettes inside it
}
`;

// piecewise-linear curve through [u, value] pairs
function curve(pts) {
  return (u) => {
    if (u <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (u <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); }
    }
    return pts[pts.length - 1][1];
  };
}
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lin = (hex) => new THREE.Color(hex);

// ---------- generic patch: any lit built-in material receives the shadow line and the dust fog ----------
function patchLit(mat, U, key, extra) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    for (const k in U) sh.uniforms[k] = U[k];
    if (extra?.uniforms) for (const k in extra.uniforms) sh.uniforms[k] = extra.uniforms[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHbW;' + (extra?.vertPars || ''))
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 hbw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          hbw = instanceMatrix * hbw;
        #endif
          vHbW = (modelMatrix * hbw).xyz; }`);
    if (extra?.vert) sh.vertexShader = extra.vert(sh.vertexShader);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHbW;\n' + HB_GLSL + (extra?.fragPars || ''))
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { vec3 hbP = (uHbInv * vec4(vHbW, 1.0)).xyz;
          float hbS = hbShadow(hbP), hbT = hbTownW(hbP);
          hbSg = hbS;
          reflectedLight.directDiffuse *= (1.0 - 0.95 * hbS) * (1.0 - 0.88 * hbT) * mix(vec3(1.0), vec3(1.16, 1.05, 0.86), uHbNear * (1.0 - hbS));   // in the arrival what the sun still reaches is warm against the dark wall
          reflectedLight.directSpecular *= (1.0 - hbS) * (1.0 - hbT);
          reflectedLight.indirectDiffuse *= mix(vec3(1.0), max(uHbUmber, vec3(0.5, 0.42, 0.36)), hbS) * mix(vec3(1.0), vec3(0.8, 0.94, 1.22), hbT * (1.0 - hbS));
          reflectedLight.indirectDiffuse += diffuseColor.rgb * uHbBounce * (hbT * (1.0 - hbS));       // sun thrown back off the lit ground and walls fills the town's own shadows
          ${extra?.lit || ''} }`)
      .replace('#include <fog_fragment>', `#include <fog_fragment>
        { float hbF = hbFog((uHbInv * vec4(vHbW, 1.0)).xyz, (uHbInv * vec4(cameraPosition, 1.0)).xyz);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uHbDust * (1.0 - 0.3 * uHbNear * hbSg), hbF); }`);     // in the arrival the dust under the wall is dark dust, not a pale sheet
    if (extra?.frag) sh.fragmentShader = extra.frag(sh.fragmentShader);
  };
  mat.customProgramCacheKey = () => 'hb-' + key;
  mat.needsUpdate = true;
  return mat;
}

// ---------- tower geometry ----------
// Every vertex is an anchor in the unit footprint (x, z in -0.5..0.5, y in 0..1) plus an offset in metres, so
// one geometry serves any width, depth and height while parapets, finials and spouts keep their real size.
// aPart: 0 mud wall, 1 lime parapet with crenels cut in the shader, 2 roof terrace, 3 lime-washed mass,
//        4 dark wood, 5..5.9 hung cloth (fraction = how far the vertex flaps).
const SIDES = [[1, 0], [0, 1], [-1, 0], [0, -1]];
function makeTowerGeometry(variant) {
  const P = [], O = [], N = [], K = [];
  const nom = (v) => [v[0] * 14 + v[3], v[1] * 32 + v[4], v[2] * 14 + v[5]];
  const tri = (a, b, c, n, part) => { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); O.push(v[3], v[4], v[5]); N.push(n[0], n[1], n[2]); K.push(v[6] ?? part); } };
  const quad = (a, b, c, d, part, nrm) => {
    let n = nrm;
    if (!n) {
      const A = nom(a), B = nom(b), D = nom(d);
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
      n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
    }
    tri(a, b, c, n, part); tri(a, c, d, n, part);
  };
  // box around one anchor: centre offset c, half sizes h; faces: +x -x +z -z top (bottom optional)
  const box = (ax, ay, az, c, h, part, bottom = false) => {
    const v = (sx, sy, sz) => [ax, ay, az, c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]];
    quad(v(1, -1, 1), v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), part);
    quad(v(-1, -1, -1), v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1), part);
    quad(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1), part);
    quad(v(1, -1, -1), v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1), part);
    quad(v(-1, 1, -1), v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1), part);
    if (bottom) quad(v(-1, -1, 1), v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), part);
  };
  const spike = (ax, ay, az, c, hw, hh, part) => {
    const b = (sx, sz) => [ax, ay, az, c[0] + sx * hw, c[1], c[2] + sz * hw], top = [ax, ay, az, c[0], c[1] + hh, c[2]];
    const f = (p, q) => { const A = nom(p), B = nom(q), T = nom(top); const ux = B[0] - A[0], uz = B[2] - A[2], vx = T[0] - A[0], vy = T[1] - A[1], vz = T[2] - A[2];
      let n = [-uz * vy, uz * vx - ux * vz, ux * vy]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l]; tri(p, q, top, n, part); };
    f(b(-1, 1), b(1, 1)); f(b(1, 1), b(1, -1)); f(b(1, -1), b(-1, -1)); f(b(-1, -1), b(-1, 1));
  };
  for (const [nx, nz] of SIDES) {
    const tx = nz, tz = -nx;
    const c = (a, oy, ay = 1, inset = 0) => [0.5 * nx + 0.5 * a * tx, ay, 0.5 * nz + 0.5 * a * tz, -inset * (nx + a * tx), oy, -inset * (nz + a * tz)];
    quad(c(-1, 0, 0), c(1, 0, 0), c(1, -1.0), c(-1, -1.0), 0);                         // mud wall
    quad(c(-1, -1.0), c(1, -1.0), c(1, 0.12), c(-1, 0.12), 1);                         // crenel band, outer face
    quad(c(1, -1.6, 1, 0.45), c(-1, -1.6, 1, 0.45), c(-1, 0.12, 1, 0.45), c(1, 0.12, 1, 0.45), 1);   // inner face
    // wooden drain spout
    if (nx + nz > 0) {
      const sx = 0.5 * nx + 0.28 * tx, sz = 0.5 * nz + 0.28 * tz;
      box(sx, 1, sz, [nx * 0.62, -1.75, nz * 0.62], [Math.abs(nx) * 0.7 + 0.1, 0.085, Math.abs(nz) * 0.7 + 0.1], 4, true);
    }
  }
  quad([-0.5, 1, -0.5, 0, -1.6, 0], [-0.5, 1, 0.5, 0, -1.6, 0], [0.5, 1, 0.5, 0, -1.6, 0], [0.5, 1, -0.5, 0, -1.6, 0], 2);   // terrace
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                                 // stepped corner finials
    box(0.5 * sx, 1, 0.5 * sz, [-sx * 0.5, -0.25, -sz * 0.5], [0.72, 0.95, 0.72], 3);
    spike(0.5 * sx, 1, 0.5 * sz, [-sx * 0.5, 0.7, -sz * 0.5], 0.46, 1.25, 3);
  }
  // cloth hung over the parapet: [side index, position along the side, width, drop]
  const cloth = (si, at, wdt, drop) => {
    const [nx, nz] = SIDES[si], tx = nz, tz = -nx;
    const v = (a, out, oy, flap) => [0.5 * nx + at * tx, 1, 0.5 * nz + at * tz, a * wdt * 0.5 * tx + out * nx, oy, a * wdt * 0.5 * tz + out * nz, 5 + 0.9 * flap];
    const n = [nx, 0.2, nz];
    quad(v(-1, 0.1, -drop * 0.5, 0.4), v(1, 0.1, -drop * 0.5, 0.4), v(1, 0.08, 0.16, 0), v(-1, 0.08, 0.16, 0), 5, n);
    quad(v(-1, 0.13, -drop, 1), v(1, 0.13, -drop, 1), v(1, 0.1, -drop * 0.5, 0.4), v(-1, 0.1, -drop * 0.5, 0.4), 5, n);
    quad(v(-1, 0.08, 0.16, 0), v(1, 0.08, 0.16, 0), v(1, -0.52, 0.16, 0), v(-1, -0.52, 0.16, 0), 5, [0, 1, 0]);
    quad(v(-1, -0.52, 0.16, 0), v(1, -0.52, 0.16, 0), v(1, -0.55, -0.9, 0.2), v(-1, -0.55, -0.9, 0.2), 5, [-nx, 0.2, -nz]);
  };
  if (variant === 0) {            // stair-house, carpets front and side
    box(-0.2, 1, -0.18, [0, -0.25, 0], [1.7, 1.35, 2.1], 3.3);
    cloth(1, 0.12, 2.1, 2.8);
  } else if (variant === 1) {     // penthouse block with its own little finials
    const y0 = -1.6, y1 = 2.5, I = 1.5;
    const a = (ux, uz, oy) => [ux, 1, uz, -Math.sign(ux) * I, oy, -Math.sign(uz) * I * (uz > 0 ? 0.2 : 1)];
    const xs = [-0.5, 0.5], z0 = -0.5, z1 = 0.08;
    quad(a(xs[1], z1, y0), a(xs[1], z0, y0), a(xs[1], z0, y1), a(xs[1], z1, y1), 3.3);
    quad(a(xs[0], z0, y0), a(xs[0], z1, y0), a(xs[0], z1, y1), a(xs[0], z0, y1), 3.3);
    quad(a(xs[0], z1, y0), a(xs[1], z1, y0), a(xs[1], z1, y1), a(xs[0], z1, y1), 3.3);
    quad(a(xs[1], z0, y0), a(xs[0], z0, y0), a(xs[0], z0, y1), a(xs[1], z0, y1), 3.3);
    quad(a(xs[0], z0, y1), a(xs[0], z1, y1), a(xs[1], z1, y1), a(xs[1], z0, y1), 3.3);
    for (const ux of xs) for (const uz of [z0, z1]) { const q = a(ux, uz, y1); spike(q[0], 1, q[2], [q[3], y1, q[5]], 0.4, 1.0, 3); }
    cloth(0, 0.22, 2.0, 2.6);
  } else {                        // pigeon loft on legs, small stair-house, two cloths
    box(0.22, 1, 0.16, [0, -0.2, 0], [1.25, 0.75, 0.95], 4, true);
    box(0.22, 1, 0.16, [0, -1.25, 0], [0.9, 0.35, 0.6], 4);
    box(-0.24, 1, -0.2, [0, -0.45, 0], [1.4, 1.15, 1.6], 3.3);
    cloth(1, -0.18, 2.2, 3.0); cloth(2, 0.1, 1.8, 2.4);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aOff', new THREE.Float32BufferAttribute(O, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(K, 1));
  return g;
}

// sand streaming off a roof: a drooping sheet from the windward parapet to ~20 m downwind.
// position = (across -0.5..0.5, along 0..1, 0)
function makeSandGeometry() {
  const P = [], I = [];
  const NA = 2, NB = 7;
  for (let j = 0; j <= NB; j++) for (let i = 0; i <= NA; i++) P.push(i / NA - 0.5, j / NB, 0);
  for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  return g;
}

// one kite: paper diamond (part 0), ribbon tail (part 1), string (part 2). position = (part, s, side)
function makeKiteGeometry() {
  const P = [], Q = [], I = [];
  // diamond: centre, top, right, bottom, left as (u, v) in aQ
  const d = [[0, 0.12], [0, 0.62], [0.44, 0.14], [0, -0.7], [-0.44, 0.14]];
  for (const q of d) { P.push(0, 0, 0); Q.push(q[0], q[1]); }
  I.push(0, 1, 4, 0, 2, 1, 0, 3, 2, 0, 4, 3);
  const strip = (part, n) => {
    const base = P.length / 3;
    for (let i = 0; i <= n; i++) for (const s of [-1, 1]) { P.push(part, i / n, s); Q.push(0, 0); }
    for (let i = 0; i < n; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  strip(1, 12); strip(2, 22);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2));
  g.setIndex(I);
  return g;
}

// ---------- tower material: MeshStandardMaterial with the facade painted in the shader ----------
const TOWER_VERT_PARS = /* glsl */`
attribute vec3 aOff; attribute float aPart; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
uniform float uHbTime, uHbTearZ, uHbGust;
varying vec3 vLoc; varying float vPart; flat varying vec3 vN0; flat varying vec4 vB; flat varying vec4 vC;
`;
const TOWER_NORMAL = /* glsl */`vec3 objectNormal = vec3(normal.x * iA.z + normal.z * iA.w, normal.y, -normal.x * iA.w + normal.z * iA.z);
  if (aPart > 4.5) { objectNormal = objectNormal + vec3(0.0, 1.3, 0.0); objectNormal = objectNormal / max(length(objectNormal), 1e-4); }`;
const TOWER_BEGIN = /* glsl */`
  vec3 hbO = aOff;
  if (abs(aPart - 3.0) < 0.05 && iB.y < 12.0) {      // a low house: small corner blocks that step above the merlons, not a tower's tall finials
    hbO.xz *= 0.55;
    hbO.y = min(aOff.y, 0.0) + clamp(aOff.y, 0.0, 0.7) * 0.75 + max(aOff.y - 0.7, 0.0) * 0.06;
  }
  float hbY = position.y * iB.y + hbO.y;
  float hbBat = ${(BATTER * 2).toFixed(4)} * clamp(hbY, 0.0, iB.y);
  vec3 hbL = vec3(position.x * (iB.x - hbBat) + hbO.x, hbY, position.z * (iB.z - hbBat) + hbO.z);
  float hbFlap = aPart > 4.5 ? (aPart - 5.0) / 0.9 : 0.0;
  // four cloths in ten are torn off when the tear line passes; the rest only thrash
  float hbD = max(uHbTearZ - iA.y + (fract(iB.w * 7.31) - 0.5) * 50.0, 0.0) * step(fract(iB.w * 53.7 + position.x * 3.1), 0.4);
  if (aPart > 4.5) {
    float w = sin(uHbTime * (1.6 + 8.0 * uHbGust) + iB.w * 40.0 + position.x * 9.0 + position.z * 7.0 + hbY * 1.3);
    hbL.xz += normal.xz * hbFlap * (0.12 + 1.5 * uHbGust) * (0.65 + 0.35 * w);
    hbL.y += hbFlap * uHbGust * (0.9 + 0.5 * w);
  }
  vLoc = hbL; vN0 = normal; vPart = aPart; vB = iB; vC = iC;
  vec3 transformed = vec3(hbL.x * iA.z + hbL.z * iA.w + iA.x, hbL.y, -hbL.x * iA.w + hbL.z * iA.z + iA.y);
  if (aPart > 4.5 && hbD > 0.0) {       // the cloth is torn off the parapet and carried downwind
    float lift = smoothstep(0.0, 25.0, hbD);
    vec3 fly = vec3(sin(hbD * 0.06 + iB.w * 30.0) * 5.0 * lift, 7.0 * lift + hbD * 0.07 - hbD * hbD * 0.0005, hbD * 0.8);
    fly.y += sin(hbD * 0.33 + position.x * 12.0 + hbFlap * 2.5) * 0.9 * lift;
    vec3 hbA = vec3(position.x * (iB.x - hbBat), iB.y, position.z * (iB.z - hbBat));
    vec3 aW = vec3(hbA.x * iA.z + hbA.z * iA.w + iA.x, hbA.y, -hbA.x * iA.w + hbA.z * iA.z + iA.y);
    vec3 rel = transformed - aW;
    float ang = hbD * 0.13 * lift + 0.6 * sin(hbD * 0.21 + iB.w * 50.0) * lift, ca = cos(ang), sa = sin(ang);
    rel = vec3(rel.x, rel.y * ca - rel.z * sa, rel.y * sa + rel.z * ca);        // it tumbles end over end
    transformed = aW + fly + rel * (1.0 - smoothstep(190.0, 260.0, hbD));
  }
`;
const TOWER_FRAG_PARS = /* glsl */`
uniform vec3 uPLime, uPMud, uPUmber, uPDark, uPOchre, uPSky, uPGreen, uBounce;
uniform float uLamp;
float gHbLamp = 0.0;
varying vec3 vLoc; varying float vPart; flat varying vec3 vN0; flat varying vec4 vB; flat varying vec4 vC;
vec3 hbClothCol(float k){
  vec3 c = k < 0.22 ? vec3(0.5, 0.05, 0.04) : k < 0.44 ? uPOchre * 0.9 : k < 0.62 ? vec3(0.1, 0.19, 0.55) : k < 0.82 ? uPLime * 0.8 : uPGreen * 0.9;
  return mix(c, vec3(dot(c, vec3(0.333))), 0.25) * 0.9;
}
vec3 hbTowerColor(){
  float seed = vB.w, h = vB.y, y = vLoc.y;
  vec3 mud = uPMud * (0.76 + 0.42 * vC.x); mud = mix(mud, mud * vec3(1.1, 0.95, 0.8), vC.z);
  mud = mix(mud, vec3(dot(mud, vec3(0.3, 0.5, 0.2))), 0.12);
  vec3 lime = uPLime * 0.76;
  float px = fwidth(vLoc.x) + fwidth(vLoc.y) + fwidth(vLoc.z);
  if (vPart > 4.5) {                                   // hung carpets and sheets
    float st = fract(y * 1.7 + seed * 3.0);
    vec3 c1 = hbClothCol(fract(vC.w * 3.0 + floor(dot(vLoc.xz, vec2(0.11, 0.07)) + seed * 9.0) * 0.37));
    vec3 c2 = hbClothCol(fract(vC.w * 7.0 + 0.5));
    return mix(c1, c2, step(0.72, st)) * (0.8 + 0.2 * hbN2(vLoc.xy * 3.0));
  }
  if (vPart > 3.5) return mix(uPDark * 1.5, uPUmber * 0.5, hbN2(vLoc.xz * vec2(9.0, 1.5) + y * 3.0));
  if (vPart > 2.5) {                                   // lime-washed finials, stair-houses, penthouses
    float up = y - (h - 1.6);
    vec3 c = lime * (0.84 + 0.16 * hbN2(vLoc.xz * 1.3 + y * 0.8 + seed));
    c = mix(c, mud * 1.05, (1.0 - smoothstep(0.0, 1.4, up)) * 0.4 * hbN2(vLoc.xz * 2.0 + seed));
    if (abs(vN0.y) < 0.5) c *= 1.0 - 0.24 * pow(hbN2(vec2(dot(vLoc.xz, vec2(2.9, 2.3)), seed * 9.0)), 2.0) * (0.5 + 0.5 * hbN2(vec2(dot(vLoc.xz, vec2(7.0, 5.0)), y * 0.4))) - 0.16 * (1.0 - smoothstep(0.0, 0.45, up));
    if (vPart > 3.15 && abs(vN0.y) < 0.5) {
      float hu = dot(vLoc.xz, vec2(vN0.z, -vN0.x));
      float op = (1.0 - smoothstep(0.26, 0.3, abs(fract(hu / 2.3 + seed) - 0.5) * 2.3)) * (1.0 - smoothstep(0.5, 0.54, abs(up - 1.35)));
      float fan = (1.0 - smoothstep(0.26, 0.3, abs(fract(hu / 2.3 + seed) - 0.5) * 2.3)) * (1.0 - smoothstep(0.1, 0.13, abs(up - 2.35)));
      float cu = (fract(hu / 2.3 + seed) - 0.5) * 2.3;
      float sur = (1.0 - smoothstep(0.42, 0.46, abs(cu))) * (1.0 - smoothstep(0.66, 0.7, abs(up - 1.42))) + (1.0 - smoothstep(0.38, 0.42, abs(cu))) * (1.0 - smoothstep(0.2, 0.24, abs(up - 2.35)));
      c = mix(c, lime * 1.12, clamp(sur, 0.0, 1.0) * 0.8);
      vec2 lq = vec2(cu + up, cu - up) * 7.0;
      float lat = smoothstep(0.2, 0.32, abs(fract(lq.x) - 0.5)) * smoothstep(0.2, 0.32, abs(fract(lq.y) - 0.5));
      lat = mix(lat, 0.45, clamp(px * 10.0, 0.0, 1.0));
      vec3 leaf = uPUmber * 0.55 * (0.7 + 0.3 * step(0.07, abs(fract(cu * 4.0) - 0.5)));
      float isDoor = step(0.5, hbHash(vec2(floor(hu / 2.3 + seed), seed * 31.0)));
      vec3 opc = mix(mix(uPUmber * 0.75, uPDark * 0.6, lat), leaf, isDoor);
      c = mix(c, opc, op);
      c = mix(c, mix(uPUmber * 0.7, uPDark * 0.5, lat), fan);
    }
    return c;
  }
  if (vPart > 1.5) {                                   // roof terrace with drying dates and airing carpets
    vec3 c = mix(mud * 1.2, lime, 0.25) * (0.8 + 0.25 * hbN2(vLoc.xz * 0.9 + seed * 5.0));
    vec2 cell = floor(vLoc.xz / 3.4 + seed * 13.0), f = fract(vLoc.xz / 3.4 + seed * 13.0) - 0.5;
    float hh = hbHash(cell + seed * 3.1);
    float rect = (1.0 - smoothstep(0.30, 0.33, abs(f.x))) * (1.0 - smoothstep(0.38, 0.41, abs(f.y)));
    if (hh < 0.12) c = mix(c, mix(uPOchre * 0.5, uPUmber * 0.6, hbHash(floor(vLoc.xz * 7.0))), rect);
    else if (hh < 0.2) c = mix(c, mix(hbClothCol(fract(hh * 31.0)), hbClothCol(fract(hh * 57.0)), step(0.6, fract(f.y * 7.0))), rect);
    { float rk = fract(seed * 91.7);                      // one roof in four carries colour that shows from the rim: a big airing carpet, or a mat of dates as wide as the terrace
      if (rk < 0.27) {
        vec2 q = vLoc.xz / max(0.5 * vB.xz - ${BATTER.toFixed(3)} * h - 1.2, vec2(1.0)) - (vec2(fract(seed * 37.3), fract(seed * 53.1)) - 0.5) * 0.4;
        float big = (1.0 - smoothstep(0.50, 0.54, abs(q.x))) * (1.0 - smoothstep(0.62, 0.66, abs(q.y)));
        vec3 k1 = hbClothCol(fract(rk * 43.0)) * 1.35, k2 = hbClothCol(fract(rk * 71.0 + 0.3)) * 1.35;
        vec3 mat_ = mix(k1, k2, step(0.66, fract(q.y * 3.5 + 0.2)) * step(abs(q.x), 0.42));
        mat_ = mix(mat_, uPLime * 0.7, step(0.56, abs(q.y)) * 0.6);
        if (rk < 0.1) mat_ = mix(uPOchre * 0.62, uPUmber * 0.8, 0.5 * hbN2(vLoc.xz * 4.0)) * (0.85 + 0.3 * step(0.5, fract(q.x * 6.0)));
        c = mix(c, mat_, big);
      } }
    vec2 e = 0.5 * vB.xz - ${BATTER.toFixed(3)} * h - abs(vLoc.xz);
    return c * (0.6 + 0.4 * smoothstep(0.4, 1.8, min(e.x, e.y)));
  }
  float xFace = step(0.5, abs(vN0.x));
  if (vPart > 0.5) {                                   // parapet: stepped merlons cut out of the band
    float yb = y - (h - 1.0), u = mix(vLoc.x, vLoc.z, xFace);
    float m = abs(fract(u / 1.9 + 0.5) - 0.5) * 2.0;
    float top = m < 0.34 ? 1.2 : (m < 0.64 ? 0.66 : 0.22);
    if (yb > top) discard;
    vec3 c = lime * (0.82 + 0.18 * hbN2(vec2(u * 1.7, y * 0.7) + seed));
    return c * (0.8 + 0.2 * smoothstep(-1.6, -0.6, yb)) * (0.86 + 0.14 * step(0.34, m));
  }
  // ---- mud wall ----
  vec2 tng = vec2(vN0.z, -vN0.x);
  float fu = dot(vLoc.xz, tng);
  float wd = mix(vB.x, vB.z, xFace), halfTop = 0.5 * wd - ${BATTER.toFixed(3)} * h;
  float face = vN0.x > 0.5 ? 0.0 : (vN0.z > 0.5 ? 1.0 : (vN0.x < -0.5 ? 2.0 : 3.0));
  float fs = seed * 17.0 + face * 3.7, hw = h - 1.0;
  float nS = max(floor(hw / 4.0 + 0.5), 3.0), sH = hw / nS, si = min(floor(y / sH), nS - 1.0), fy = y - si * sH;
  float bayW = 2.3 + 0.6 * hbHash(vec2(fs, 1.3));
  float nb = max(floor((2.0 * halfTop - 1.2) / bayW), 1.0);
  float cx = fu / bayW + 0.5 * nb, ci = floor(cx), fx = (cx - ci - 0.5) * bayW;
  float inb = step(-0.5, ci) * step(ci, nb - 0.5);
  float hsh = hbHash(vec2(ci + fs, si * 1.91 + fs * 0.37)), hs2 = hbHash(vec2(ci * 3.3 + fs, si + 9.1));
  float n1 = hbN2(vec2(fu, y) * 0.22 + fs), n2 = hbN2(vec2(fu, y) * 2.3 + fs);
  vec3 col = mud * (0.86 + 0.18 * n1) * (0.92 + 0.16 * n2);
  col *= 0.9 + 0.2 * hbN2(vec2(fu * 1.6 + fs, y * 0.08));                         // rain-wash running down the plaster
  float nearK = clamp(1.0 - px * 3.0, 0.0, 1.0);
  { float lq = y / 3.0 + 0.4 * hbHash(vec2(fs, 5.1)) + 0.05 * (n1 - 0.5), lf = fract(lq);      // the plaster was laid in lifts of about 3 m: a faint joint, each lift a shade apart, a paler lip under the joint
    col *= 1.0 - 0.1 * (1.0 - smoothstep(0.01, 0.03, min(lf, 1.0 - lf))) * (0.55 + 0.45 * n2) * clamp(1.3 - px * 5.0, 0.0, 1.0);
    col *= 0.95 + 0.1 * hbHash(vec2(floor(lq), fs)) + 0.05 * smoothstep(0.8, 0.98, lf) * nearK; }
  col *= 1.0 - 0.12 * nearK * smoothstep(0.40, 0.48, abs(fract(y / 0.42 + 0.08 * n2) - 0.5)) * (0.55 + 0.45 * hbHash(vec2(floor(y / 0.42), fs))) * smoothstep(0.3, 0.6, hbN2(vec2(fu * 0.7 + fs, y * 0.9)));          // brick courses showing here and there through the plaster
  float pfN = hbN2(vec2(fu, y) * 1.8 + fs * 1.7) + 0.1 * (n2 - 0.5), pfall = smoothstep(0.6, 0.8, pfN);   // fallen plaster: small soft-edged patches
  col = mix(col, mix(col * 0.78, uPUmber * (0.9 + 0.5 * n2), 0.45), pfall * 0.35);
  col += vec3(0.06, 0.045, 0.015) * smoothstep(0.75, 0.8, pfN) * nearK * step(0.92, hbHash(floor(vec2(fu * 14.0, y * 40.0))));   // straw
  // lime-washed top storeys with a dripping lower edge, and thin lime bands on the storeys below
  float wl = hw - sH * vC.y;
  float drip = (hbN2(vec2(fu * 0.9, fs)) - 0.5) * 1.3 + pow(hbN2(vec2(fu * 4.3, fs + 7.0)), 4.0) * 2.6;
  float wm = smoothstep(0.0, 0.14, y - wl + drip);
  col = mix(col, lime * (0.86 + 0.14 * n2) * (0.9 + 0.1 * n1), wm);
  col *= 1.0 - 0.2 * wm * pow(hbN2(vec2(fu * 2.7, fs + 3.0)), 3.0) * smoothstep(0.0, 3.5, hw - y) * (0.5 + 0.5 * hbN2(vec2(fu * 9.0, y * 0.35)));   // grey rain streaks down the lime
  col *= 1.0 - 0.3 * (1.0 - smoothstep(0.05, 0.22, abs(y - (hw - 0.3)))) - 0.14 * (1.0 - smoothstep(0.0, 1.8, hw - y));       // a string course under the parapet and the shade of the merlons
  float band = (1.0 - smoothstep(0.07, 0.12, abs(fy - 0.14))) * step(nS - 3.5, si);
  col = mix(col, lime * 0.9, band * 0.6 * (0.55 + 0.45 * n1));
  // windows: lime surround, carved lattice, fanlight above; a plank door on the front face
  float top2 = step(nS - 2.5, si);
  float ww = mix(0.36, 0.47, top2), wh = mix(0.56, 0.8, top2), cy = sH * 0.5 + 0.05;
  float door = 0.0;
  if (si < 0.5) { ww = 0.13; wh = 0.3; cy = sH * 0.62;
    if (face == 1.0 && abs(ci - floor(nb * 0.5)) < 0.5) { door = 1.0; ww = 0.78; wh = 1.3; cy = 1.3; } }
  else if (si < 1.5) { ww = 0.2; wh = 0.34; }
  else if (hsh < 0.22) { ww *= 0.7; wh *= 0.7; }
  float show = inb * max(step(0.09, hsh), door);
  float d = max(abs(fx) - ww, abs(fy - cy) - wh);
  if (top2 > 0.5) { float ay = fy - (cy + wh - ww); if (ay > 0.0) d = length(vec2(fx, ay)) - ww; }
  float d2 = max(abs(fx) - 0.2, abs(fy - (cy + wh + 0.5)) - 0.13);
  if (si > 1.5) d = min(d, d2);
  float sur = (1.0 - smoothstep(0.11, 0.16, d + (n2 - 0.5) * 0.06)) * show;
  col = mix(col, lime * 0.95, sur);
  float inside = (1.0 - smoothstep(-0.02, 0.02, d)) * show;
  vec2 q = vec2(fx + fy, fx - fy) * 8.0;
  float lp = smoothstep(0.22, 0.32, abs(fract(q.x) - 0.5)) * smoothstep(0.22, 0.32, abs(fract(q.y) - 0.5));
  lp = mix(lp, 0.4, clamp(px * 14.0, 0.0, 1.0));
  vec3 wcol = mix(mix(uPUmber * 0.62, uPDark * 1.3, 0.3 + 0.5 * hs2), uPUmber * 0.16, lp * 0.85);
  if (hs2 > 0.8) wcol = mix(uPGreen, uPSky, fract(hs2 * 17.0)) * 0.5 * (0.75 + 0.25 * step(0.12, abs(fract(fx * 3.0) - 0.5)));
  if (door > 0.5) wcol = uPUmber * 0.42 * (0.7 + 0.3 * step(0.08, abs(fract(fx * 3.2) - 0.5)))
    + vec3(0.05, 0.04, 0.03) * step(0.8, hbHash(floor(vec2(fx * 6.4, fy * 3.0))));
  wcol *= 0.5 + 0.5 * smoothstep(0.0, 0.3, (cy + wh) - fy);
  { float jamb = (1.0 - smoothstep(0.03, 0.09, fx + ww)) * step(door, 0.5), sillK = (1.0 - smoothstep(0.03, 0.08, fy - (cy - wh))) * step(door, 0.5);
    wcol = mix(wcol, mix(mud, lime, 0.55) * 0.8, max(jamb * 0.85, sillK)); }      // the reveal: one jamb and the sill catch the light, the lattice sits back in the wall
  col = mix(col, wcol, inside);
  gHbLamp = inside * step(0.78, hsh) * step(1.5, si) * step(door, 0.5) * (0.35 + 0.65 * lp);
  float sill = (1.0 - smoothstep(ww * 0.8, ww * 1.4, abs(fx))) * smoothstep(cy - wh - 1.7, cy - wh - 0.2, fy) * step(fy, cy - wh - 0.2);
  col *= 1.0 - 0.16 * sill * show;
  // grey streak under the drain spout, eroded foot, dusty skirt, lane occlusion
  float below = (h - 1.75) - y;
  float streak = exp(-abs(fu - 0.56 * halfTop) / (0.22 + 0.035 * max(below, 0.0))) * (1.0 - smoothstep(0.0, 17.0, below)) * step(0.0, below) * step(face, 1.5);
  col = mix(col, col * vec3(0.4, 0.39, 0.4), streak * 0.8 * (0.45 + 0.55 * hbN2(vec2(fu * 6.0, y * 0.4) + fs)));
  col = mix(col, uPUmber * 0.6, (1.0 - smoothstep(0.3, 3.4, y + (n1 - 0.5) * 2.4)) * 0.5);
  col = mix(col, mud * 1.25, (1.0 - smoothstep(0.0, 0.9, y)) * 0.5);
  return col * mix(0.68, 1.0, smoothstep(0.0, 18.0, y));
}
`;
function makeTowerMaterial(U, PU, bounce, lamp) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94, metalness: 0, side: THREE.DoubleSide });
  return patchLit(mat, { ...U, ...PU, uBounce: bounce, uLamp: lamp }, 'tower', {
    vertPars: TOWER_VERT_PARS,
    vert: (s) => s.replace('#include <beginnormal_vertex>', TOWER_NORMAL).replace('#include <begin_vertex>', TOWER_BEGIN),
    fragPars: TOWER_FRAG_PARS,
    frag: (s) => s.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = hbTowerColor();')
      // light bounced off the sunlit ground and the neighbours fills the faces the sun misses, until the shadow line passes
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  { vec3 hbE = (uHbInv * vec4(vHbW, 1.0)).xyz; totalEmissiveRadiance += diffuseColor.rgb * uBounce * (1.0 - hbShadow(hbE)) * (1.0 - 0.75 * hbTownW(hbE)) + vec3(1.0, 0.55, 0.2) * (2.6 * uLamp * gHbLamp); }'),
  });
}

// ---------- the dust wall: one lobed shell, displaced and rolled in the vertex shader, shaded as a backlit volume ----------
const WALL_NOISE = /* glsl */`
vec3 hg(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx) * 2. - 1.; }
float gn(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f * f * f * (f * (f * 6. - 15.) + 10.);
  return mix(mix(mix(dot(hg(i), f), dot(hg(i + vec3(1., 0., 0.)), f - vec3(1., 0., 0.)), u.x),
                 mix(dot(hg(i + vec3(0., 1., 0.)), f - vec3(0., 1., 0.)), dot(hg(i + vec3(1., 1., 0.)), f - vec3(1., 1., 0.)), u.x), u.y),
             mix(mix(dot(hg(i + vec3(0., 0., 1.)), f - vec3(0., 0., 1.)), dot(hg(i + vec3(1., 0., 1.)), f - vec3(1., 0., 1.)), u.x),
                 mix(dot(hg(i + vec3(0., 1., 1.)), f - vec3(0., 1., 1.)), dot(hg(i + vec3(1., 1., 1.)), f - vec3(1.)), u.x), u.y), u.z); }
// billows: rounded puffs with sharp creases between them (cauliflower)
float bil(vec3 p){ float g = gn(p); return min(sqrt(g * g + 0.003) * 2.7, 1.); }     // the creases are rounded off: dust, not rock
`;
// the shell's surface at grid coordinates st (s -1..1 across, t 0..1 up); needs uHbTime, uHbFrontZ, uWallSeed and WALL_NOISE
const WALL_POS = /* glsl */`
vec3 wallPos(vec2 st, out float cav){
  float s = st.x, t = st.y;
  float x = 1750. * (0.42 * s + 0.58 * s * s * s);
  x *= 1. + 0.5 * (1. - smoothstep(-0.6, 0., s));                          // the shell reaches half as far again to the north: its shoulder stands over the far cliff in the first view from the rim
  float xb = max(x, -1100.);                                               // and up there it no longer bows away from the town
  float tf = min(t / 0.84, 1.);
  float y = 700. * (0.42 * tf + 0.58 * tf * tf);
  float e1 = (y - 150.) / 120.;
  float fwd = 0.27 * y + 55. * exp(-e1 * e1) + 55. * exp(-y / 26.);       // 15 degree lean, nose, foot skirt
  float cf = max(t - 0.84, 0.) / 0.16, a = cf * 1.5708;
  y += 100. * sin(a); fwd -= 100. * (1. - cos(a));                         // the crest rolls back over the top
  float ang = mix(-0.26, 1.4, cf);
  vec3 dir = vec3(0., sin(ang), cos(ang));
  float r = uHbTime, o = uWallSeed;
  float b1 = bil(vec3(x, y + r * 7., r * 2.) / 430. + 3.1 + o);
  float b2 = bil(vec3(x * 0.8 + y * 0.6, y * 0.8 - x * 0.6 + r * 11., r * 4.) / 170. + 7.7 + o);
  float b3 = bil(vec3(x * 0.8 - y * 0.6, y * 0.8 + x * 0.6 + r * 15., r * 6.) / 66. + 1.9 + o);
  cav = b1 * 0.5 + b2 * 0.3 + b3 * 0.2;
  float D = (120. * b1 + 66. * b2 + 25. * b3) * (0.3 + 0.7 * smoothstep(0., 110., y));
  return vec3(x, y, uHbFrontZ + fwd - 0.00018 * xb * xb + 45. * sin(x * 0.0041 + 0.7 + o)) + dir * D;
}
`;
const WALL_VERT = /* glsl */`
uniform float uHbTime, uHbFrontZ, uWallSeed;
varying vec3 vP; varying vec3 vN; varying float vT; varying float vCav;
#include <fog_pars_vertex>
${WALL_NOISE}
${WALL_POS}
void main(){
  float c0, c1;
  vec3 p = wallPos(position.xy, c0);
  vec3 ps = wallPos(position.xy + vec2(0.004, 0.), c1), pt = wallPos(position.xy + vec2(0., 0.006), c1);
  vec3 n = cross(ps - p, pt - p);
  vN = n / max(length(n), 1e-5);
  vP = p; vT = position.y; vCav = c0;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WALL_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uWDark, uWMid, uWTan, uWOchre, uGlow;
uniform float uWLit, uWGild, uWGildLow;
varying vec3 vP; varying vec3 vN; varying float vT; varying float vCav;
#include <fog_pars_fragment>
${HB_GLSL}
${WALL_NOISE}
void main(){
  vec3 N = vN / max(length(vN), 1e-5);
  vec3 cam = (uHbInv * vec4(cameraPosition, 1.)).xyz;
  vec3 V = (cam - vP) / max(distance(cam, vP), 1e-3);
  float farK = smoothstep(350., 1500., distance(cam, vP));                    // 0 where the face stands over us in the last third, 1 from the rim
  float r = uHbTime;
  vec3 q1 = vec3(vP.x * 0.9 + vP.y * 0.44, vP.y * 0.9 - vP.x * 0.44 + r * 17., r * 5.) / 31.;
  vec3 q2 = vec3(vP.x, vP.y + r * 22., r * 8.) / 11.5 + 4.;
  float f1 = bil(q1), f2 = bil(q2);
  float g1 = bil(q1 + vec3(0.44, 0.9, 0.) * (4. / 31.)), g2 = bil(q2 + vec3(0., 4. / 11.5, 0.));
  float det = f1 * 0.62 + f2 * 0.38;
  float slope = ((g1 - f1) * 9. + (g2 - f2) * 3.) / 4.;                       // the fine puffs as a height field
  { float nearD = 1. - smoothstep(260., 700., distance(cam, vP));             // close to (the face over us in the last third) a third octave, 4 m across, grains the puffs
    vec3 q3 = vec3(vP.x * 0.8 - vP.y * 0.6, vP.y * 0.8 + vP.x * 0.6 + r * 9., vP.z * 0.35 + r * 3.) / 6.5 + 9.;
    float f3 = bil(q3), g3 = bil(q3 + vec3(0.6, 0.8, 0.) * (2. / 6.5));
    det = mix(det, det * 0.86 + f3 * 0.14, nearD); slope += (g3 - f3) * 0.5 * nearD; }
  float big = bil(vec3(vP.x, vP.y * 1.3 + r * 9., r * 3.) / 250. + 5.3);       // towers of cloud 250 m across, each with a lit head and a dark throat
  vec3 Nd = N + vec3(0., -slope * 0.55, 0.); Nd /= max(length(Nd), 1e-4);
  float cav = vCav * 0.9 + det * 0.1;
  float crease = smoothstep(0.0, 0.45, cav);
  vec3 col = mix(uWDark * 0.8, uWMid * 0.94, 0.16 + 0.76 * crease);
  col = mix(col, col * 0.62 + uWOchre * 0.035, (1. - smoothstep(0.2, 0.7, det)) * (1. - 0.6 * farK) * 0.7);   // close to, the fine puffs have dark throats of their own
  float shade = 0.5 + 0.5 * Nd.y;                                             // undersides dark, tops catch the sky
  col = mix(col * 0.58, col + uWTan * 0.12, smoothstep(0.15, 0.9, shade));
  #ifdef USE_FOG
  col += fogColor * (0.07 * smoothstep(0.45, 0.95, shade) * (0.4 + 0.6 * crease));   // the open sky fills the tops of the lobes
  #endif
  { float cn = hbN2(vec2(vP.x * 0.07, vP.y * 0.011 + r * 0.35)); col *= mix(0.86 + 0.28 * cn, 0.7 + 0.5 * cn, uHbThin); }   // falling curtains of grit, plainer in a thin front
  float sunHigh = smoothstep(0.1, 0.5, uSunDir.y);                            // a low sun behind the wall cannot spill over its top: it would only draw lines on the folds
  col += uWTan * uSunCol * 0.3 * smoothstep(0.1, 0.8, dot(Nd, uSunDir)) * crease * smoothstep(0.3, 0.9, vT) * sunHigh;   // sun spilling over the crest
  col *= mix(0.6, 1., smoothstep(0., 0.55, vT));
  { // a high sun to one side of the wall gilds the flank of every billow that is turned to it: lit heads over brown-black throats
    // (the light is taken from a direction turned a little toward the face: the true sun stands too far behind the wall to reach any but the steepest flank)
    vec3 gDir = uSunDir + vec3(0., 0.5 * uWGildLow, 0.75 + 0.9 * uWGildLow); gDir /= max(length(gDir), 1e-4);    // (under a low sun it is turned further: the heads take the light, not the folds)
    float sunN = dot(Nd, gDir), gK = uWGild * max(sunHigh, uWGildLow) * max(1. - uWLit, 0.);
    float gild = smoothstep(0.0, 0.65, sunN) * (0.25 + 0.75 * smoothstep(0.2, 0.7, cav)) * (0.55 + 0.45 * smoothstep(0.25, 0.8, det)) * (0.45 + 0.55 * smoothstep(0.1, 0.7, big));
    col *= 1. - 0.32 * gK * (1. - smoothstep(0.1, 0.55, cav));                                           // and the throats go deeper beside them
    col += mix(uWTan * 0.9 + uWOchre * 0.25, uWOchre * 0.8 + uWTan * 0.3, uWGildLow) * uSunCol * (gild * gK); }
  col += uWOchre * uSunCol * (0.085 * crease * smoothstep(0.12, 0.7, vT) * (0.4 + 0.6 * det) * max(1. - uWLit, 0.));   // amber soaking through the heads of the lobes: brown-black in the throats, amber where the dust is thin
  { // face lit directly when the sun is behind the camera: creases, undersides and the lee of every lobe fall back to the dark and mid colours
    float litK = (0.08 + 0.92 * smoothstep(0.25, 0.9, cav)) * (0.10 + 0.90 * smoothstep(0.2, 0.95, dot(Nd, uSunDir))) * mix(0.4, 1.0, smoothstep(0.2, 0.85, shade)) * (0.7 + 0.6 * det);
    litK *= 0.45 + 0.75 * smoothstep(0.12, 0.8, big);
    col *= mix(1., 0.7 + 0.3 * smoothstep(0.1, 0.7, big), min(uWLit, 1.));
    col += (uWTan * 0.75 + uWOchre * 0.35) * uSunCol * uWLit * litK; }
  float rim = 1. - abs(dot(N, V)), thin = rim * rim * rim;
  vec3 Ns = N * 0.4 + vec3(0., 0.26, 0.97) * 0.6; Ns /= max(length(Ns), 1e-4);  // the shell's own facing, with the lobes smoothed away: only the outer silhouette is an edge
  float thinS = 1. - abs(dot(Ns, V));
  float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd;
  vec3 hz = uHbDust * 1.7;
  #ifdef USE_FOG
  hz = mix(hz, fogColor, 0.4);
  #endif
  col = mix(col, hz, smoothstep(0.25, 0.9, thinS) * 0.9 * mix(0.22, 1., farK));                      // the wall's outer edge melts toward the haze (not every fold inside it)
  float hgt = 0.05 + 0.95 * smoothstep(0.35, 0.95, vT);
  float thinL = mix(thin, thinS * thinS, 0.98) * crease * mix(0.45, 1., farK);                      // lit through at the outer silhouette and the puff tops, never as a line on every fold
  col += uWOchre * uSunCol * thinL * (0.12 + 1.7 * fwd) * hgt * 1.4;
  float rimB = min(rim, 0.62);                                                  // capped, so the fold itself is no brighter than the flank beside it
  col += uWOchre * uSunCol * (0.12 * rimB * rimB * smoothstep(0.0, 1.0, crease) * (1. - sunHigh) * max(1. - uWLit, 0.) * (0.35 + 0.65 * hgt));   // first light soaks broadly through the flanks of the lobes
  float crest = smoothstep(0.76, 0.97, vT);
  col = mix(col, uWOchre * uSunCol * (0.75 + 1.1 * det) * 1.5, crest * 0.88);  // the burning rim
  col = mix(col, uHbDust * (1. - 0.42 * uHbNear * (1. - farK)), (1. - smoothstep(0., mix(55., 125., farK), vP.y)) * mix(0.6, 0.8, farK));   // (in the arrival the foot over the town is darker dust: the core comes down to the ground)
  vec2 gd = (vP.xy - uGlow.xy) / 210.;
  col += vec3(1.0, 0.4, 0.09) * uGlow.z * exp(-dot(gd, gd)) * (1.25 - 0.95 * crease);   // dull amber glow in the depths
  col = mix(col, uHbDust, hbFog(vP, cam) * mix(0.3, 0.12, min(uWLit, 1.)));
  gl_FragColor = vec4(col, 1.);
  vec3 pre = col;
  #include <fog_fragment>
  gl_FragColor.rgb = mix(pre, gl_FragColor.rgb, 0.42);
}`;

// ---------- puffs: soft camera-facing discs of dust rolling out of the wall's foot and off its north shoulder ----------
const PUFF_VERT = /* glsl */`
attribute vec4 iP; attribute vec2 iQ;                 // shell s, shell t, metres ahead of the shell, radius | seed, strength
uniform float uHbTime, uHbFrontZ, uWallSeed, uNearK;
uniform vec3 uSunDir;
varying vec2 vUv; varying vec3 vC; varying vec3 vQ; varying float vY; varying vec4 vS;
#include <fog_pars_vertex>
${WALL_NOISE}
${WALL_POS}
void main(){
  float life = fract(uHbTime * (0.016 + 0.014 * fract(iQ.x * 7.31)) + iQ.x);      // each puff is born small against the wall, rolls out and up, and thins away
  float rad = iP.w * (0.6 + 0.55 * life), cav;
  vec3 c = wallPos(vec2(iP.x, iP.y + 0.05 * life), cav);                            // on the shell's own boiling surface
  c += vec3(0., 0.2, 0.98) * (iP.z + rad * (0.55 + 0.45 * life));                   // and far enough ahead of it that the disc is not cut through its middle
  c.y = max(c.y, rad * 0.22);
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
  mvPosition.xy += position.xy * rad;
  float nearB = step(1.5, iQ.y), str = (iQ.y - 2. * nearB) * mix(1., uNearK, nearB);     // the near billows (strength + 2) come up with the gust, over the last third
  vUv = position.xy; vC = c; vQ = vec3(iQ.x, str * 4. * life * (1. - life), life); vY = c.y + position.y * rad;
  vec3 sv = (viewMatrix * modelMatrix * vec4(uSunDir, 0.)).xyz;
  vS = vec4(sv / max(length(sv), 1e-4), -mvPosition.z);                                 // where the sun stands, seen from the puff; how far off it is
  gl_Position = str < 0.004 ? vec4(2., 2., 2., 1.) : projectionMatrix * mvPosition;
  if (str >= 0.004) {                                                                   // the disc's depth is pulled toward the eye by most of its radius: the opaque shell behind it cannot slice it along a contour
    vec4 pb = projectionMatrix * vec4(mvPosition.xy, min(mvPosition.z + rad * 0.9, -1.), 1.);
    gl_Position.z = pb.z / max(pb.w, 1e-4) * gl_Position.w;
  }
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */`
uniform vec3 uSunCol, uSunDir, uWTan, uWOchre, uWDark, uWMid;
uniform float uWLit, uWGild, uWGildLow;
varying vec2 vUv; varying vec3 vC; varying vec3 vQ; varying float vY; varying vec4 vS;
#include <fog_pars_fragment>
${HB_GLSL}
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.) discard;
  float fall = 1. - r2; fall *= fall;
  float r = uHbTime;
  float nearK = 1. - smoothstep(450., 1500., vS.w), rr = r * mix(1., 3., nearK);          // close to, the billows roll visibly
  float n = hbN2(vUv * 2.2 + vQ.x * 31. + vec2(0., -rr * 0.05)) * 0.62 + hbN2(vUv * 5.6 + vQ.x * 57. + vec2(rr * 0.04, -rr * 0.1)) * 0.38;
  float fq = n * 0.75 + fall * 0.5;
  float a = mix(fall, 1. - r2, 0.6 * nearK) * mix(smoothstep(0.12, 0.7, fq), smoothstep(0.3, 0.52, fq), 0.7 * nearK) * vQ.y * smoothstep(-6., 24., vY) * mix(1., 0.55, min(uWLit, 1.));   // on a lit face the pale puffs are thinner: they do not plaster it. Close to, a billow has an edge
  a = min(a * mix(1., 1.6, nearK), 0.97);
  a *= 1. - nearK * mix(0.7 + 0.2 * smoothstep(45., 150., vY), 1., uHbNear);                             // close to, the puffs above the skirt thin to a veil: the wall's own lit billows are the picture, not a haze of discs in front of them. In the arrival (uHbNear) the near discs go altogether: the wall stands dark and sculpted over its own shadow
  float sh = 0.5 + 0.5 * vUv.y;                                                 // tops catch the sky, undersides stay dark
  vec3 pale = uHbDust * 1.5;
  #ifdef USE_FOG
  pale = mix(uHbDust * 1.2, fogColor * 0.8, 0.35 + 0.3 * sh);                 // paler than the wall behind: the profile reads soft and ragged
  #endif
  pale *= mix(1., 0.6, uHbThin);
  vec3 col = pale * (0.72 + 0.5 * sh + 0.36 * (n - 0.5)) + uWTan * 0.08 * sh;
  { // each puff modelled as a ball of dust: lobes from the noise, a brown-black throat, a warm limb on the side the sun stands
    float limb = sqrt(r2), toSun = dot(vUv, vS.xy / max(length(vS.xy), 1e-3)), lobes = smoothstep(0.3, 0.72, n);
    vec3 body = mix(uWDark * 0.9, uWMid * 1.15, 0.2 + 0.8 * lobes);
    body = mix(body * 0.6, body + uWTan * 0.16, smoothstep(0.1, 0.9, 0.5 + 0.3 * vUv.y + 0.3 * toSun));
    body *= 0.62 + 0.38 * smoothstep(0., 0.7, limb);
    float rimK = smoothstep(0.35, 0.95, limb) * smoothstep(-0.15, 0.75, toSun) * (0.45 + 0.9 * n);
    body += uWOchre * uSunCol * (0.5 * rimK * max(1. - uWLit, 0.));
    body += uWOchre * uSunCol * (0.3 * rimK * nearK * max(1. - uWLit, 0.));
    { // lit as a ball: the side turned to the sun is gilded, its throat and its lee stay brown-black (view space; the light is turned a little toward the eye, as on the wall)
      vec3 nb = vec3(vUv, sqrt(max(1. - r2, 0.))), lg = vS.xyz + vec3(0., 0.1, 0.55); lg /= max(length(lg), 1e-4);
      float litP = smoothstep(0.2, 0.85, dot(nb, lg) + 0.5 * (n - 0.5)) * (0.3 + 0.7 * lobes);
      float gKP = uWGild * max(smoothstep(0.1, 0.5, uSunDir.y), uWGildLow) * max(1. - uWLit, 0.);
      body *= 1. - 0.3 * gKP * (1. - litP);
      body += mix(uWTan * 0.9 + uWOchre * 0.25, uWOchre * 0.8 + uWTan * 0.3, uWGildLow) * uSunCol * (0.8 * litP * gKP); }
    col = mix(col, body, mix(0.8, 1., nearK) * mix(1., 0.5, uHbThin)); }
  col += (uWTan * 0.75 + uWOchre * 0.35) * uSunCol * uWLit * (0.16 + 0.5 * sh) * (0.6 + 0.8 * n) * (0.35 + 0.65 * sh);
  vec3 cam = (uHbInv * vec4(cameraPosition, 1.)).xyz;
  col = mix(col, uHbDust, hbFog(vC, cam) * 0.3);
  gl_FragColor = vec4(col, a);
  vec3 pre = col;
  #include <fog_fragment>
  gl_FragColor.rgb = mix(pre, gl_FragColor.rgb, 0.42);
}`;

// ---------- sand streaming off the parapets ----------
const SAND_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
uniform float uHbTime, uHbTearZ, uHbShadowZ;
varying vec3 vP; varying vec2 vUv; varying float vOn; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float on = smoothstep(0., 80., uHbTearZ - iA.y) * 0.22 + smoothstep(-25., 45., uHbShadowZ - iA.y) * 0.78;
  float al = position.y, w = iB.x - ${(BATTER * 2).toFixed(4)} * iB.y;
  float len = iB.z * 0.7 + 6. + 13. * on;
  vec3 p = vec3(iA.x + position.x * (w + 0.6 + al * 3.), iB.y + 0.3 + 0.9 * sin(al * 3.1416) * on - 6. * al * al, iA.y - iB.z * 0.5 + 0.4 + al * len);
  p.y += sin(uHbTime * 5.3 + al * 7. + iB.w * 31. + position.x * 4.) * 0.5 * al;
  vP = p; vUv = vec2(position.z > 0.5 ? position.x * 0.4 : position.x, al); vOn = on; vSeed = iB.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = on < 0.01 ? vec4(2., 2., 2., 1.) : projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SAND_FRAG = /* glsl */`
uniform vec3 uSunCol, uSandLit;
varying vec3 vP; varying vec2 vUv; varying float vOn; varying float vSeed;
#include <fog_pars_fragment>
${HB_GLSL}
void main(){
  float s = hbN2(vec2(vP.x * 2.7 + vSeed * 7., (vP.z - uHbTime * 24.) * 0.1)) * (0.4 + 0.9 * hbN2(vec2(vP.x * 0.33 + vSeed * 37., (vP.z - uHbTime * 15.) * 0.045 + vP.y * 0.3 + vSeed * 11.)));
  float edge = 1. - abs(vUv.x * 2.); edge = 1. - (1. - edge) * (1. - edge) * (1. - edge);
  float a = vOn * smoothstep(0., 0.1, vUv.y) * (1. - smoothstep(0.4, 1., vUv.y)) * (0.03 + 1.3 * s * s) * edge * (0.55 + 0.45 * fract(vSeed * 91.7));
  vec3 cam = (uHbInv * vec4(cameraPosition, 1.)).xyz;
  float fg = hbFog(vP, cam);
  a = min(a, 0.38) * (1. - 0.85 * fg);
  if (a < 0.004) discard;
  float sh = hbShadow(vP);
  vec3 col = mix(uSandLit * uSunCol * (0.55 + 0.7 * s), uHbDust * 1.35, sh);
  col = mix(col, uHbDust, fg);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------- kites: paper diamond, ribbon tail and string in one instanced draw ----------
const KITE_VERT = /* glsl */`
attribute vec2 aQ; attribute vec4 iK0; attribute vec4 iK1; attribute vec4 iK2;
uniform float uHbTime, uHbTearZ, uHbGust, uPxAng;
uniform mat4 uHbInv;
varying vec3 vP; varying vec3 vCol; varying vec3 vUvw; varying float vA;
#include <fog_pars_vertex>
// where the kite is once the tear line has run d metres past its roof (d = 0: still flying on its string)
vec3 kitePos(float d){
  float ph = iK0.w, g = uHbGust, t = uHbTime * (0.7 + 1.7 * g);
  vec3 dance = vec3(sin(t * 0.9 + ph) * 2.6 + sin(t * 2.3 + ph * 1.7) * g, sin(t * 1.7 + ph * 2.) * 1.4 * (1. + g), cos(t * 0.6 + ph) * 1.8);
  vec3 k = iK0.xyz + iK1.xyz * vec3(1., 1. - 0.2 * g, 1. + 0.3 * g) + dance * (1. + 1.2 * g);
  float lift = smoothstep(0., 20., d);
  return k + vec3(sin(d * 0.045 + ph) * 9. * lift, 12. * (1. - exp(-d / 35.)) - d * d * 0.00042, d * 0.82);
}
void main(){
  float part = position.x, s = position.y, side = position.z, ph = iK0.w, g = uHbGust;
  float d = max(uHbTearZ + iK2.w - iK0.z, 0.);
  float r = smoothstep(0., 22., d), vis = 1. - smoothstep(330., 420., d);
  vec3 K = kitePos(d);
  vec3 cam = (uHbInv * vec4(cameraPosition, 1.)).xyz;
  float sz = iK1.w * vis;
  float a1 = mix(0.6 + 0.25 * sin(uHbTime * 1.3 + ph), d * 0.11 + ph, r);
  float a2 = mix(0.22 * sin(uHbTime * (0.9 + 3. * g) + ph * 3.), d * 0.07, r);
  vec3 right = vec3(cos(a2), sin(a2), 0.);
  vec3 up = vec3(-sin(a2) * cos(a1), cos(a2) * cos(a1), sin(a1));
  vec3 nrm = cross(right, up);
  vec3 p, T = vec3(0., 1., 0.); float w0 = 0.; vec3 col = iK2.rgb; float alpha = 1.;
  if (part < 0.5) {
    p = K + (right * aQ.x + up * aQ.y + nrm * (1. - abs(aQ.x) * 2.2) * 0.09) * sz;
    vUvw = vec3(aQ, 0.);
  } else if (part < 1.5) {
    vec3 dirT = mix(vec3(0., -1., 0.3), vec3(0., 0.3, -1.), max(r, 0.5 * g)); dirT = dirT / max(length(dirT), 1e-4);
    p = K - up * 0.7 * sz + dirT * s * sz * 2.8
      + vec3(sin(s * 9. - uHbTime * (6. + 6. * g) + ph), 0.3 * cos(s * 8. - uHbTime * 7. + ph), cos(s * 7. - uHbTime * 5. + ph)) * 0.16 * sz * s * (1. + r);
    T = dirT; w0 = 0.042 * sz * (1. - 0.5 * s);
    col = mix(col, vec3(0.75, 0.72, 0.64), step(0.5, fract(s * 4.5)));
    vUvw = vec3(0., 0., 1.);
  } else {
    vec3 A = iK0.xyz, B = K;
    float L = distance(A, B);
    vec3 pc = mix(A, B, s); pc.y -= sin(s * 3.1416) * L * 0.11 * (1. - 0.7 * g); pc.z += sin(s * 3.1416) * L * 0.05 * g;
    vec3 pt = kitePos(max(d - (1. - s) * 46., 0.));
    pt += vec3(sin(s * 13. - d * 0.3 + ph), cos(s * 11. - d * 0.23), 0.) * (1. - s) * 3. * r - vec3(0., (1. - s) * 9. * r, 0.);
    p = mix(pc, pt, r);
    T = mix((B - A) / max(L, 1e-3), vec3(0., 0.35, 0.94), r); T = T / max(length(T), 1e-4);
    w0 = 0.03 * vis; col = vec3(0.5, 0.46, 0.4);
    vUvw = vec3(0., 0., 2.);
  }
  if (part > 0.5) {
    float dist = distance(cam, p);
    vec3 sd = cross(T, cam - p) + vec3(1e-4, 2e-4, 0.);
    float wMin = dist * uPxAng * 0.8;
    p += sd / max(length(sd), 1e-4) * side * max(w0, wMin) * step(0.001, vis);
    alpha = clamp(w0 / max(wMin, 1e-5), part > 1.5 ? 0.14 : 0.35, 1.) * (part > 1.5 ? 1. - 0.75 * smoothstep(200., 600., dist) : 1.);
  }
  vP = p; vCol = col; vA = alpha * step(0.001, vis);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const KITE_FRAG = /* glsl */`
uniform vec3 uSunCol;
varying vec3 vP; varying vec3 vCol; varying vec3 vUvw; varying float vA;
#include <fog_pars_fragment>
${HB_GLSL}
void main(){
  if (vA < 0.01) discard;
  vec3 col = vCol;
  if (vUvw.z < 0.5) {      // paper with a bamboo cross and a darker glued border
    float cross_ = min(abs(vUvw.x), abs(vUvw.y - 0.14));
    col *= 0.45 + 0.55 * smoothstep(0.012, 0.03, cross_);
    col *= 1.15;
  }
  float sh = hbShadow(vP);
  col *= mix(vec3(1.25) * uSunCol, uHbUmber * 0.5, sh);
  vec3 cam = (uHbInv * vec4(cameraPosition, 1.)).xyz;
  col = mix(col, uHbDust, hbFog(vP, cam));
  gl_FragColor = vec4(col, vA);
  #include <fog_fragment>
}`;

function shaderMat(U, extraU, vert, frag, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extraU },
    vertexShader: vert, fragmentShader: frag, fog: true, ...o,
  });
}

// distance in the XZ plane from (x, z) to a polyline of [x, y, z] points
function distToLineXZ(x, z, pts) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0], az = pts[i - 1][2], bx = pts[i][0], bz = pts[i][2];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / l2));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('haboob') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const [cLime, cMud, cUmber, cDark, cOchre, cSky, cGreen] = pal;
  const detail = (ctx.quality && ctx.quality.detail) || 1;

  // ---- the storm's clock ----
  const frontX = opts.frontX || curve([[0, 2400], [0.53, 1100], [0.67, 530], [0.83, 320], [1, 240]]);
  const tearX = opts.tearX || ((u) => 300 - 600 * (u - 0.62) / 0.30);
  const gustF = opts.gust || ((u) => ss(0.60, 0.66, u));
  const sunDir = new THREE.Vector3().fromArray(opts.sunDir || [0.164, 0.899, -0.406]).normalize();
  const sunCol = lin(opts.sunColor || '#FFF6E0');
  const U = {
    uHbTime: { value: 0 }, uHbFrontZ: { value: -400 }, uHbShadowZ: { value: -100 }, uHbTearZ: { value: 0 }, uHbGust: { value: 1 }, uHbThin: { value: opts.thin ? 1 : 0 }, uHbNear: { value: 0 },
    uHbRents: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] }, uHbRentDir: { value: new THREE.Vector2() },
    uHbDust: { value: cUmber.clone().lerp(cMud, 0.2).multiplyScalar(0.62).lerp(new THREE.Color(0.1, 0.085, 0.07), 0.25) },
    uHbUmber: { value: new THREE.Color(0.5, 0.33, 0.22) },
    uHbBounce: { value: new THREE.Color(0, 0, 0) },
    uHbSpot: { value: new THREE.Vector4(0, 0, 60, 0) },
    uHbInv: { value: new THREE.Matrix4() },
    uHbShMap: { value: null }, uHbShBox: { value: new THREE.Vector4(SH_X0, SH_Z0, 1 / SH_W, 1 / SH_H) },
  };
  const shData = new Uint8Array(SH_W * SH_H);
  const shTex = new THREE.DataTexture(shData, SH_W, SH_H, THREE.RedFormat, THREE.UnsignedByteType);
  shTex.magFilter = shTex.minFilter = THREE.LinearFilter; shTex.generateMipmaps = false; shTex.needsUpdate = true;
  U.uHbShMap.value = shTex;
  const wc = opts.wallColors || {};
  if (wc.dust) U.uHbDust.value.set(wc.dust);
  const PU = { uPLime: { value: cLime }, uPMud: { value: cMud }, uPUmber: { value: cUmber }, uPDark: { value: cDark }, uPOchre: { value: cOchre }, uPSky: { value: cSky }, uPGreen: { value: cGreen } };
  const SU = { uSunDir: { value: sunDir }, uSunCol: { value: sunCol.clone() } };

  const object = new THREE.Group(); object.name = 'haboob-shadow-line';

  // ---- the flown line (local): lane, climb, roof run, riverbed, portal ----
  const DOG = 10;                                      // dog-leg of the lane after the square (toward +z)
  const lane = [[210, 5, 0], [123, 5, 0], [110, 5, DOG * 0.5], [97, 5, DOG], [22, 5, DOG]];
  const flyThrough = [[22, 5, DOG], [0, 11, DOG], [-30, 28, DOG], [-58, 44, DOG + 2], [-120, 44, 30], [-210, 40, 55], [-300, 22, 100], [-360, 9, 110], [-440, 9, 110]];
  const roofRun = flyThrough.slice(3, 7);
  const laneZ = (x) => DOG * (1 - ss(97, 123, x));

  // ---- town layout: rows of towers either side of the street, 5 m side lanes, a few open courts ----
  const towers = [];
  if (opts.towers !== false) {
    const courts = [];
    const nCourt = rng.int(5, 9);
    for (let i = 0; i < nCourt; i++) courts.push([rng.range(-190, 190), rng.range(-260, 260), rng.range(13, 24)]);
    const street = opts.street !== false;
    for (const side of [-1, 1]) {
      let off = street ? 4.5 : 2.5;
      for (let row = 0; row < 16; row++) {
        const rowD = rng.range(13, 16), gapZ = rng.range(4.6, 6.2);
        if (off + rowD > TOWN_HZ - 4) break;
        let x = -TOWN_HX + 6 + rng.range(0, 6);
        while (x < TOWN_HX - 16) {
          const w = rng.range(12, 16), d = row === 0 ? rng.range(12, 15.5) : Math.min(rowD, rng.range(12, 16));
          const cx = x + w / 2;
          const cz = laneZ(cx) + side * (off + d / 2 + (row === 0 ? 0 : rng.range(0, rowD - d)));
          x += w + (rng.chance(0.5) ? rng.range(4.5, 6) : rng.range(1.2, 3.2));
          if (Math.abs(cz) + d / 2 > TOWN_HZ) continue;
          if (cx + w / 2 > 94 && cx - w / 2 < 126 && cz + d / 2 > -9 && cz - d / 2 < 41) continue;        // square and mosque plot
          if (courts.some((c) => Math.hypot(cx - c[0], cz - c[1]) < c[2])) continue;
          if (opts.keepOut && opts.keepOut(cx, cz, w / 2, d / 2)) continue;
          let h = rng.range(28, 36.5);
          if (rng.chance(0.08)) h = rng.range(19, 25);
          const nearRun = distToLineXZ(cx, cz, roofRun) < 14 + Math.max(w, d) / 2;
          if (nearRun) h = Math.min(h, rng.range(33, 35.5));
          towers.push({ x: cx, z: cz, w, d, h, yaw: rng.range(-0.035, 0.035) * (row === 0 ? 0.25 : 1), seed: rng(), variant: rng.int(0, 2), row,
            tint: rng(), white: rng.chance(0.6) ? 1 : (rng.chance(0.6) ? 0.35 : 2), warm: rng(), cloth: rng(), nearRun });
        }
        off += rowD + gapZ;
        await ctx.yield?.();
      }
    }
    // keep the town near five hundred towers: knock out random plots (never on the street or under the roof run)
    const maxT = opts.maxTowers ?? 500;
    const loose = rng.shuffle(towers.filter((t) => t.row > 0 && !t.nearRun));
    for (let i = 0; towers.length - i > maxT && i < loose.length; i++) loose[i].drop = true;
    for (let i = towers.length - 1; i >= 0; i--) if (towers[i].drop) towers.splice(i, 1);
    // A few landmark houses stand a third taller than the rest and are lime-washed further down (two of them to the ground): they
    // break the even roof line from the rim and from the groves. Chosen by each tower's own seed (no draw from the random stream),
    // well clear of the street and of the flown line over the roofs, and at least 80 m from one another.
    { const nLand = opts.landmarks ?? 7, fr = (v) => v - Math.floor(v), marks = [];
      const cand = towers.filter((t) => t.row > 0 && !t.nearRun && Math.abs(t.x) < TOWN_HX - 24 && Math.abs(t.z) < TOWN_HZ - 24 && distToLineXZ(t.x, t.z, flyThrough) > 58 && distToLineXZ(t.x, t.z, lane) > 34)
        .sort((a, b) => fr(a.seed * 977.3) - fr(b.seed * 977.3));
      for (const t of cand) {
        if (marks.length >= nLand) break;
        if (marks.some((m) => Math.hypot(m.x - t.x, m.z - t.z) < 80)) continue;
        t.h = 55 + 11 * fr(t.seed * 313.7); t.white = marks.length % 2 === 0 ? 30 : 9; t.landmark = true; marks.push(t);
      } }
    // Districts (no draw from the random stream): a low quarter of 18 to 23 m houses in the south-west corner (local +x is south, +z is
    // west), and the tallest ordinary houses round the square, so the roof line is not one level from the rim. The street's own rows,
    // the houses under the roof run and the landmarks keep their heights.
    { const fr = (v) => v - Math.floor(v);
      for (const t of towers) {
        if (t.row === 0 || t.nearRun || t.landmark) continue;
        if (t.x > 64 && t.z > 104 + 0.25 * (t.x - 64)) t.h = 18 + 5 * fr(t.seed * 517.3);
        else if (Math.hypot(t.x - 110, t.z - 5) < 78 && distToLineXZ(t.x, t.z, flyThrough) > 40) t.h = Math.min(41, t.h * 1.14);
      } }
    // the low house that closes the lane (the camera climbs over it)
    if (street && !(opts.keepOut && opts.keepOut(3, DOG, 6.5, 4.5))) {
      towers.push({ x: 3, z: DOG, w: 13, d: 9, h: 8.6, yaw: 0, seed: rng(), variant: 0, tint: 0.7, white: 0.35, warm: 0.3, cloth: rng(), low: true });
    }
    // plots the world adds outside the wall (local metres): they join the instanced town, so the shadow line, the sand streams,
    // the lamps, the dissolve and the baked sun shadows treat them like every other tower. No kite is flown from them.
    for (const e of opts.extraTowers || []) towers.push({ yaw: 0, seed: 0.5, variant: 0, row: 1, tint: 0.5, white: 1, warm: 0.5, cloth: 0.5, ...e, extra: true });
  }
  await ctx.yield?.();

  // ---- instanced towers (three variants) and the sand that streams off them ----
  const bounce = { value: sunCol.clone().multiplyScalar(opts.bounce ?? 0.24) };
  const lamp = { value: 0 };
  U.uHbBounce.value.copy(bounce.value).multiplyScalar(0.6);
  const towerMat = makeTowerMaterial(U, PU, bounce, lamp);
  const sandIA = [], sandIB = [];
  for (let v = 0; v < 3; v++) {
    const list = towers.filter((t) => t.variant === v);
    if (!list.length) continue;
    const g = makeTowerGeometry(v);
    const A = new Float32Array(list.length * 4), B = new Float32Array(list.length * 4), C = new Float32Array(list.length * 4);
    list.forEach((t, i) => {
      A.set([t.x, t.z, Math.cos(t.yaw), Math.sin(t.yaw)], i * 4);
      B.set([t.w, t.h, t.d, t.seed], i * 4);
      C.set([t.tint, t.white, t.warm, t.cloth], i * 4);
      if (!t.low) { sandIA.push(t.x, t.z, 1, 0); sandIB.push(t.w, t.h, t.d, t.seed); }
    });
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
    g.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 4));
    g.instanceCount = list.length;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 420);
    const m = new THREE.Mesh(g, towerMat); m.frustumCulled = false; m.name = 'towers-' + v;
    object.add(m);
  }
  let sand = null;
  if (sandIA.length) {
    const g = makeSandGeometry();
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(sandIA), 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(sandIB), 4));
    g.instanceCount = sandIA.length / 4;
    const mat = shaderMat(U, { ...SU, uSandLit: { value: cMud.clone().lerp(cLime, 0.35).multiplyScalar(1.5) } }, SAND_VERT, SAND_FRAG,
      { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    sand = new THREE.Mesh(g, mat); sand.frustumCulled = false; sand.renderOrder = 2; sand.name = 'parapet-sand';
    object.add(sand);
  }
  await ctx.yield?.();

  // ---- forty kites on strings from the roofs (a dozen or more beside the roof run) ----
  const nKites = Math.max(0, Math.round(opts.kites ?? 40));
  const kites = [];
  if (nKites > 0) {
    const roofs = towers.filter((t) => !t.low && !t.extra && t.h > 26);
    const hosts = roofs.length ? roofs : [{ x: 0, z: 0, w: 14, d: 14, h: 0 }];
    const mode = rng();
    const all = [[0.78, 0.035, 0.03], [0.95, 0.47, 0.03], [0.86, 0.83, 0.74], [0.06, 0.08, 0.5]];
    const paper = mode < 0.1 ? [all[2]] : mode < 0.2 ? [all[1]] : all;      // rare seeds: all white or all saffron
    const near = hosts.filter((t) => { const dl = distToLineXZ(t.x, t.z, roofRun); return dl > 20 && dl < 60; });
    let guard = 0;
    while (kites.length < nKites && guard++ < 4000) {
      const wantNear = kites.length < Math.min(14, nKites * 0.35) && near.length > 0;
      const t = rng.pick(wantNear ? near : hosts);
      if (kites.some((k) => k.host === t)) continue;
      const off = [rng.range(-7, 7), rng.range(20, 42), rng.range(4, 18)];
      const ax = t.x + rng.range(-0.25, 0.25) * t.w, az = t.z + rng.range(-0.25, 0.25) * t.d, ay = t.h > 0 ? t.h - 0.4 : 0;
      if (distToLineXZ(ax + off[0], az + off[2], flyThrough) < 12 || distToLineXZ(ax, az, roofRun) < 12) continue;
      kites.push({ host: t, anchor: [ax, ay, az], off, size: rng.range(2.5, 3.6), phase: rng.range(0, 6.283), col: rng.pick(paper), jit: rng.range(-28, 28) });
    }
    // kites the world asks for (opts.kitesAt: [{ x, y, z, size, col, phase }], local metres): each is tied to the roof that can
    // hold it nearest that point (string 16-44 m, leaning downwind) and stays on its string to the end. No draw from rng.
    (opts.kitesAt || []).forEach((q, i) => {
      let best = null, bc = 22;
      for (const t of towers) {
        if (t.low || t.h < 18 || kites.some((k) => k.host === t)) continue;
        const ay = t.h - 0.4, ox = Math.max(-12, Math.min(12, q.x - t.x)), oy = Math.max(16, Math.min(44, q.y - ay)), oz = Math.max(3, Math.min(20, q.z - t.z));
        const c = Math.hypot(t.x + ox - q.x, ay + oy - q.y, t.z + oz - q.z) + 0.1 * Math.hypot(ox, oy - 28, oz - 10);
        if (c < bc) { bc = c; best = { host: t, anchor: [t.x, ay, t.z], off: [ox, oy / 0.8, oz / 1.3] }; }      // (the point asked for is where the kite stands in the gust)
      }
      if (best) kites.push({ ...best, size: q.size ?? 4, phase: q.phase ?? i * 2.1, col: paper[(q.col ?? i) % paper.length], jit: -900 });
    });
    const g = makeKiteGeometry();
    const K0 = new Float32Array(kites.length * 4), K1 = new Float32Array(kites.length * 4), K2 = new Float32Array(kites.length * 4);
    kites.forEach((k, i) => {
      K0.set([k.anchor[0], k.anchor[1], k.anchor[2], k.phase], i * 4);
      K1.set([k.off[0], k.off[1], k.off[2], k.size], i * 4);
      K2.set([k.col[0], k.col[1], k.col[2], k.jit], i * 4);
    });
    g.setAttribute('iK0', new THREE.InstancedBufferAttribute(K0, 4));
    g.setAttribute('iK1', new THREE.InstancedBufferAttribute(K1, 4));
    g.setAttribute('iK2', new THREE.InstancedBufferAttribute(K2, 4));
    g.instanceCount = kites.length;
    const mat = shaderMat(U, { ...SU, uPxAng: { value: 0.0012 } }, KITE_VERT, KITE_FRAG, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3; m.name = 'kites';
    object.add(m);
    object.userData.kiteMat = mat;
  }

  await ctx.yield?.();
  // ---- the dust wall ----
  const NS = Math.round(180 * (detail < 1 ? 0.8 : 1)), NT = 52;
  let wallMat = null;
  const nearK = { value: 0 };
  {
    const P = new Float32Array((NS + 1) * (NT + 1) * 3), I = [];
    for (let j = 0, k = 0; j <= NT; j++) for (let i = 0; i <= NS; i++) { P[k++] = (i / NS) * 2 - 1; P[k++] = j / NT; P[k++] = 0; }
    for (let j = 0; j < NT; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i, b = a + 1, c = a + NS + 1, d = c + 1; I.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 400, -800), 4000);
    const WU = { uWallSeed: { value: rng.range(0, 40) }, uWTan: { value: wc.tan ? lin(wc.tan) : cMud.clone() }, uWOchre: { value: wc.ochre ? lin(wc.ochre) : cOchre.clone() }, uWLit: { value: 0 }, uWGild: { value: opts.gild ?? 0.85 }, uWGildLow: { value: opts.gildLow ?? 0 },
      uWDark: { value: wc.dark ? lin(wc.dark) : cDark.clone().lerp(cUmber, 0.3) }, uWMid: { value: wc.mid ? lin(wc.mid) : cUmber.clone().multiplyScalar(0.85) }, uNearK: nearK };
    wallMat = shaderMat(U, { ...SU, ...WU, uGlow: { value: new THREE.Vector3(0, 250, 0) } }, WALL_VERT, WALL_FRAG, { side: THREE.DoubleSide });
    const m = new THREE.Mesh(g, wallMat); m.frustumCulled = false; m.name = 'dust-wall';
    object.add(m);
    await ctx.yield?.();
    // puffs along the foot and off the north shoulder: they travel with the front (placed from uHbFrontZ in the vertex shader).
    // Laid out from a hash of the wall's own seed, so no draw is taken from the shared random stream.
    // After the 140 of the foot and the shoulder: 22 where the shell crosses the north cliff, shell s -0.63 to -0.39 (its hard line against the rock is lost in them),
    // and 36 near billows on the face that stands over the last third of the flight (world z -100 to -450, 20 to 220 m up).
    const NBASE = Math.round(140 * (detail < 1 ? 0.75 : 1)), NCLIFF = 22, NNEAR = 36, NPUFF = NBASE + NCLIFF + NNEAR, NFOOT = Math.round(NBASE * 0.57), ph = (n) => { const v = Math.sin(n * 91.7 + WU.uWallSeed.value * 3.1) * 43758.5453; return v - Math.floor(v); };
    const pg = new THREE.InstancedBufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
    const IP = new Float32Array(NPUFF * 4), IQ = new Float32Array(NPUFF * 2);
    for (let i = 0; i < NPUFF; i++) {
      const foot = i < NFOOT, a = ph(i + 0.13), b = ph(i + 5.71), c = ph(i + 9.37), d = ph(i + 13.9);
      if (i >= NBASE) {
        const near = i >= NBASE + NCLIFF, high = i >= NBASE + NCLIFF + 36, k = high ? (i - NBASE - NCLIFF - 36 + a) / (NNEAR - 36) : near ? (i - NBASE - NCLIFF + a) / 36 : (i - NBASE + a) / NCLIFF;
        // (the last eighteen ride higher, on the lobes that stand over the caravan track: no bare outline of the shell is left there)
        IP[i * 4] = high ? -0.5 + 0.4 * k : near ? -0.56 + 0.48 * k : -0.63 + 0.24 * k;
        IP[i * 4 + 1] = high ? 0.2 + 0.36 * c : near ? 0.03 + 0.39 * c : 0.02 + 0.44 * c;
        IP[i * 4 + 2] = near ? 6 + 30 * d : 10 * d;
        IP[i * 4 + 3] = high ? 55 + 55 * b : near ? 40 + 50 * b : 60 + 50 * b;
        IQ[i * 2] = ph(i + 21.3); IQ[i * 2 + 1] = near ? 2 + 0.85 + 0.15 * d : 0.8 + 0.15 * d;
        continue;
      }
      const rad = foot ? 38 + 46 * b * b : 90 + 70 * b;
      IP[i * 4] = foot ? -0.78 + 1.42 * ((i + a) / NFOOT) : -0.88 + 0.74 * ((i - NFOOT + a) / Math.max(1, NBASE - NFOOT));   // shell s: north is negative
      IP[i * 4 + 1] = foot ? 0.015 + 0.2 * c * c : 0.2 + 0.44 * c;                   // shell t: the foot (y 5 to 100 m), the shoulder (y 110 to 420 m)
      IP[i * 4 + 2] = foot ? 22 * d : -8 + 16 * d;
      IP[i * 4 + 3] = rad;
      IQ[i * 2] = ph(i + 21.3); IQ[i * 2 + 1] = foot ? 0.62 + 0.3 * d : 0.7 + 0.2 * d;
    }
    pg.setAttribute('iP', new THREE.InstancedBufferAttribute(IP, 4)); pg.setAttribute('iQ', new THREE.InstancedBufferAttribute(IQ, 2));
    pg.instanceCount = NPUFF; pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 200, -800), 4000);
    const puffMat = shaderMat(U, { ...SU, ...WU }, PUFF_VERT, PUFF_FRAG, { transparent: true, depthWrite: false });
    const pm = new THREE.Mesh(pg, puffMat); pm.frustumCulled = false; pm.renderOrder = 1; pm.name = 'dust-puffs';
    object.add(pm);
  }
  await ctx.yield?.();

  // ---- own ground (pass opts.ground = false and patch the world's terrain instead) ----
  const patchMaterial = (m, key = 'ext', extra = null) => patchLit(m, U, key + ':' + (m.type || 'm'), extra);
  if (opts.ground !== false) {
    const g = new THREE.PlaneGeometry(5200, 5200, 1, 1); g.rotateX(-Math.PI / 2);
    const gm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    patchLit(gm, { ...U, uGPale: { value: cLime.clone().lerp(cMud, 0.5).multiplyScalar(0.72) }, uGTown: { value: cMud.clone().lerp(cLime, 0.22).multiplyScalar(0.8) },
      uGSand: { value: cMud.clone().lerp(cLime, 0.3) } }, 'ground', {
      fragPars: 'uniform vec3 uGPale, uGTown, uGSand;\n',
      frag: (s) => s.replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 hp = (uHbInv * vec4(vHbW, 1.0)).xyz;
          float town = (1.0 - smoothstep(${TOWN_HX}.0, ${TOWN_HX + 22}.0, abs(hp.x))) * (1.0 - smoothstep(${TOWN_HZ}.0, ${TOWN_HZ + 22}.0, abs(hp.z)));
          vec3 c = mix(uGPale, uGTown, town) * (0.78 + 0.3 * hbN2(hp.xz * 0.045)) * (0.9 + 0.2 * hbN2(hp.xz * 0.8));
          c *= 0.9 + 0.1 * hbN2(hp.xz * vec2(0.012, 0.11) + 9.0);
          float fl = hbN2(vec2(hp.x * 0.45, (hp.z - uHbTime * 17.0) * 0.055)) * hbN2(vec2(hp.x * 0.13 + 4.0, (hp.z - uHbTime * 11.0) * 0.02));
          float run = smoothstep(-40.0, 60.0, uHbTearZ - hp.z) * 0.5 + hbShadow(hp) * 0.5;
          c = mix(c, uGSand, clamp(fl * fl * 3.2 * run, 0.0, 0.85));       // sand snaking along the ground and down the lanes
          diffuseColor.rgb = c; }`),
    });
    const m = new THREE.Mesh(g, gm); m.name = 'haboob-ground'; m.frustumCulled = false;
    object.add(m);
  }

  // ---- state ----
  let progress = opts.progress ?? 0.8, manual = null;
  const applyStorm = () => {
    const s = manual || { front: frontX(progress), shadow: frontX(progress) - SHADOW_LEAD, tear: tearX(progress), gust: gustF(progress) };
    U.uHbFrontZ.value = -s.front; U.uHbShadowZ.value = -(s.shadow ?? s.front - SHADOW_LEAD);
    U.uHbTearZ.value = -(s.tear ?? s.front - 450); U.uHbGust.value = s.gust ?? 1;
  };
  applyStorm();

  // ---- sun shadows of the town: a height map of everything tall, swept once along the sun (1 m texels, local x by z) ----
  // occluders: [{ x, z, hx, hz, h }] boxes and [{ x, z, r, h }] discs in local metres (the world adds its wall, gate, mosque, palms)
  const bakeShadows = async (dirLocal, occluders = [], bakeOpts = {}) => {
    const W = SH_W, H = SH_H, occ = new Float32Array(W * H), full = new Float32Array(W * H), S = new Float32Array(W * H);
    const box = (x, z, hx, hz, h) => {
      const i0 = Math.max(0, Math.ceil(x - hx - SH_X0 - 0.5)), i1 = Math.min(W - 1, Math.floor(x + hx - SH_X0 - 0.5));
      const j0 = Math.max(0, Math.ceil(z - hz - SH_Z0 - 0.5)), j1 = Math.min(H - 1, Math.floor(z + hz - SH_Z0 - 0.5));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * W + i; if (occ[k] < h) occ[k] = h; }
    };
    await ctx.yield?.();
    for (const t of towers) box(t.x, t.z, Math.max(1, t.w / 2 - 1.6), Math.max(1, t.d / 2 - 1.6), t.h - 0.6);
    let nOcc = 0;
    for (const o of occluders) {
      if ((++nOcc & 1023) === 0) await ctx.yield?.();
      if (o.thin) continue;
      if (o.r === undefined) { box(o.x, o.z, o.hx, o.hz, o.h); continue; }
      const i0 = Math.max(0, Math.floor(o.x - o.r - SH_X0)), i1 = Math.min(W - 1, Math.ceil(o.x + o.r - SH_X0));
      const j0 = Math.max(0, Math.floor(o.z - o.r - SH_Z0)), j1 = Math.min(H - 1, Math.ceil(o.z + o.r - SH_Z0));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const dx = i + 0.5 + SH_X0 - o.x, dz = j + 0.5 + SH_Z0 - o.z, k = j * W + i;
        if (dx * dx + dz * dz <= o.r * o.r && occ[k] < o.h) occ[k] = o.h;
      }
    }
    const hl = Math.hypot(dirLocal.x, dirLocal.z) || 1e-6, ux = dirLocal.x / hl, uz = dirLocal.z / hl, tanEl = Math.max(dirLocal.y, 0.02) / hl;
    full.set(occ);
    await ctx.yield?.();
    if (Math.abs(uz) >= Math.abs(ux)) {          // sweep row by row away from the sun
      const sg = uz >= 0 ? 1 : -1, r = ux / Math.abs(uz), drop = Math.hypot(1, r) * tanEl;
      for (let jj = 0; jj < H - 1; jj++) {
        const j = sg > 0 ? H - 2 - jj : jj + 1, jp = (j + sg) * W, jo = j * W;
        for (let i = 0; i < W; i++) {
          const xf = i + r, i0 = Math.floor(xf), f = xf - i0;
          const a = i0 >= 0 && i0 < W ? full[jp + i0] : 0, b = i0 + 1 >= 0 && i0 + 1 < W ? full[jp + i0 + 1] : 0;
          const v = a + (b - a) * f - drop;
          if (v > 0) { S[jo + i] = v; if (v > full[jo + i]) full[jo + i] = v; }
        }
        if ((jj & 63) === 63) await ctx.yield?.();
      }
    } else {                                      // sweep column by column
      const sg = ux >= 0 ? 1 : -1, r = uz / Math.abs(ux), drop = Math.hypot(1, r) * tanEl;
      for (let ii = 0; ii < W - 1; ii++) {
        const i = sg > 0 ? W - 2 - ii : ii + 1, ip = i + sg;
        for (let j = 0; j < H; j++) {
          const zf = j + r, j0 = Math.floor(zf), f = zf - j0;
          const a = j0 >= 0 && j0 < H ? full[j0 * W + ip] : 0, b = j0 + 1 >= 0 && j0 + 1 < H ? full[(j0 + 1) * W + ip] : 0;
          const v = a + (b - a) * f - drop;
          if (v > 0) { S[j * W + i] = v; if (v > full[j * W + i]) full[j * W + i] = v; }
        }
        if ((ii & 63) === 63) await ctx.yield?.();
      }
    }
    await ctx.yield?.();
    // Thin occluders ({ thin: true }: palm crowns as discs, trunks as posts with post: true). A sweep through 1 m texels wears a narrow
    // shadow away within a few metres, so each is laid down where it falls: a crown's disc where its shade meets the ground, a
    // post's as a bar from its foot to the shade of its top.
    { const stamp = (cx, cz, r, v) => {
        const i0 = Math.max(0, Math.floor(cx - r - SH_X0)), i1 = Math.min(W - 1, Math.ceil(cx + r - SH_X0)), j0 = Math.max(0, Math.floor(cz - r - SH_Z0)), j1 = Math.min(H - 1, Math.ceil(cz + r - SH_Z0));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = i + 0.5 + SH_X0 - cx, dz = j + 0.5 + SH_Z0 - cz, k = j * W + i; if (dx * dx + dz * dz <= r * r && S[k] < v) S[k] = v; }
      };
      let nThin = 0;
      for (const o of occluders) {
        if (!o.thin) continue;
        if ((++nThin & 255) === 0) await ctx.yield?.();
        const r = o.r ?? 0.7, t0 = o.h / tanEl;
        if (o.post) { const n = Math.max(1, Math.ceil(t0 / 0.7)); for (let q = 0; q <= n; q++) { const t = t0 * q / n; stamp(o.x - ux * t, o.z - uz * t, r, Math.max(o.h - t * tanEl, 2.0)); } }
        else stamp(o.x - ux * t0, o.z - uz * t0, r, 2.4);
      } }
    await ctx.yield?.();
    if (bakeOpts.sunSlots) {
      // Sun let into the street. Between 30 m towers the 9 m lane would lie in one even shade, so shafts of sun are let through as if
      // by gaps in the rows: a bar of light every 14 m along the street (1.8 a second at 25 m/s), lying along the sun's bearing, which
      // crosses the floor and stands up the wall that faces the sun. Each bar has its own width and place.
      const P = Math.max(14 * Math.abs(uz), 5), h1 = (n) => { const v = Math.sin(n * 127.1 + 3.7) * 43758.5453; return v - Math.floor(v); };
      const i0 = Math.max(0, Math.floor(22 - SH_X0)), i1 = Math.min(W - 1, Math.ceil(207 - SH_X0));
      for (let i = i0; i <= i1; i++) {
        const x = i + 0.5 + SH_X0, zc = laneZ(x), j0 = Math.max(0, Math.floor(zc - 5.9 - SH_Z0)), j1 = Math.min(H - 1, Math.ceil(zc + 5.9 - SH_Z0));
        for (let j = j0; j <= j1; j++) {
          const z = j + 0.5 + SH_Z0, c = (x * uz - z * ux) / P, k = Math.floor(c), f = (c - k - 0.5) * P + (h1(k) - 0.5) * 0.3 * P;
          const e = Math.abs(f) - (1.0 + 0.9 * h1(k + 0.37));
          if (e < 1.2) S[j * W + i] *= Math.max(0, e) / 1.2;
        }
      }
    }
    for (let k = 0; k < W * H; k++) shData[k] = Math.min(255, Math.round(S[k] * (255 / 48)));
    shTex.needsUpdate = true;
  };
  if (opts.bake !== false) await bakeShadows(sunDir);

  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const anchors = {
    portalSeat: { position: new THREE.Vector3(-440, 9, 110), facing: new THREE.Vector3(1, 0, 0), radius: 7 },
    flyThrough: flyThrough.map(V3),
    lane: lane.map(V3), laneHalfWidth: 4.5,
    gate: new THREE.Vector3(TOWN_HX, 0, 0),
    square: { position: new THREE.Vector3(110, 0, DOG * 0.5 + 0), size: 26, mosquePlot: new THREE.Vector3(110, 0, 29) },
    lowHouse: new THREE.Vector3(3, 8.6, DOG),
    revealLook: new THREE.Vector3(-120, 60, -260),
    viewpoints: [
      { name: 'reveal', position: new THREE.Vector3(-58, 44, DOG + 2), target: new THREE.Vector3(-130, 70, -300) },
      { name: 'threeBands', position: new THREE.Vector3(-40, 46, 330), target: new THREE.Vector3(-20, 110, -300) },
      { name: 'rimOverview', position: new THREE.Vector3(800, 309, 40), target: new THREE.Vector3(0, 20, 0) },
    ],
    towers: towers.map((t) => ({ x: t.x, z: t.z, w: t.w, d: t.d, h: t.h, yaw: t.yaw, low: !!t.low, extra: !!t.extra })),
    kites: kites.map((k) => ({ anchor: V3(k.anchor), kite: new THREE.Vector3(k.anchor[0] + k.off[0], k.anchor[1] + k.off[1], k.anchor[2] + k.off[2]) })),
    stormAxis: new THREE.Vector3(0, 0, 1), windDir: new THREE.Vector3(0, 0, 1),
  };

  // dull amber glow deep in the dust: one at a time, 0.6 s rise, 1.5 s decay, a new one every 5 s at most
  const glowRng = ctx.core?.makeRng ? ctx.core.makeRng(Math.floor(rng() * 1e9)) : rng;
  const glowSeed = glowRng() * 100;
  const hash1 = (n) => { const x = Math.sin(n * 127.1 + glowSeed) * 43758.5453; return x - Math.floor(x); };
  const size = new THREE.Vector2(), inv = new THREE.Matrix4();
  const center = new THREE.Vector3(0, 50, -60);

  return {
    object, radius: 190, height: 110, center, anchors,
    ground: opts.ground === false, groundY: 0,
    extent: { townHalfX: TOWN_HX, townHalfZ: TOWN_HZ, wallWidth: 3500, wallHeight: 800, towerCount: towers.length },
    uniforms: U, glsl: HB_GLSL, patchMaterial,
    setProgress(u) { progress = u; manual = null; applyStorm(); },
    setStorm(s) { manual = s; applyStorm(); },
    setSun(dirLocal, color, intensity = 1) {
      if (dirLocal) sunDir.copy(dirLocal).normalize();
      if (color) SU.uSunCol.value.set(color).multiplyScalar(intensity);
    },
    setWallLit(k) { wallMat.uniforms.uWLit.value = k; },
    setNearBillows(k) { nearK.value = k; },
    setArrival(k) { U.uHbNear.value = k; },
    setRent(i, x, z, radius, strength) { U.uHbRents.value[i].set(x, z, radius, strength); U.uHbRentDir.value.set(sunDir.x, sunDir.z).multiplyScalar(1 / Math.max(sunDir.y, 0.12)); },   // a pool of sun let through the wall (local metres), i = 0..2
    setLamps(k) { lamp.value = k; },
    setBounce(color, k = 1, fill = 0.6) { bounce.value.set(color).multiplyScalar(k); U.uHbBounce.value.copy(bounce.value).multiplyScalar(fill); },   // fill: the share that also lights every patched material inside the town's own shadows
    setSpot(x, z, radius, strength) { U.uHbSpot.value.set(x, z, radius, strength); },
    bakeShadows,
    sunUniforms: SU,
    storm: () => ({ front: -U.uHbFrontZ.value, shadow: -U.uHbShadowZ.value, tear: -U.uHbTearZ.value, gust: U.uHbGust.value }),
    update(dt, time, camera) {
      U.uHbTime.value = time;
      object.updateWorldMatrix(true, false);
      U.uHbInv.value.copy(inv.copy(object.matrixWorld).invert());
      if (camera && object.userData.kiteMat) {
        let h = 1080;
        if (ctx.renderer?.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 1080;
        object.userData.kiteMat.uniforms.uPxAng.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * h);
      }
      const slot = Math.floor(time / 5), ph = time - slot * 5 - hash1(slot) * 2.2;
      const amt = ph < 0 ? 0 : ph < 0.6 ? ss(0, 0.6, ph) : Math.exp(-(ph - 0.6) / 0.65);
      wallMat.uniforms.uGlow.value.set((hash1(slot + 0.37) - 0.5) * 1300, 110 + hash1(slot + 0.71) * 330, amt * 0.8);
    },
    dispose() { shTex.dispose(); },
  };
}
