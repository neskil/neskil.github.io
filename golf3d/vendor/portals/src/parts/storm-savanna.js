// THE ELDER BAOBAB - hero set piece for the world "storm-savanna".
//
// One enormous bottle-trunked baobab, alone on a low rise: a deeply folded trunk 16 m across and 28 m tall
// (fused columns, root toes, burls, an arched hollow you could walk into on the side the camera passes),
// a crown of thick bare limbs that swell out of the trunk's shoulders and fork four times into twigs "like
// roots in the air", ~120 pendant weaver nests swinging on their strings (a low limb carries a cluster of
// them at the camera's eye level), surface roots snaking over the rise, termite spires, boulders, tussock
// grass rolling in the wind, yellow weaver birds flitting round the nests, wind-blown seeds streaking gold
// toward the storm, and (optional) a double rainbow standing behind it, antisolar and camera-following.
//
// LOCAL SPACE  origin = ground level at the centre of the rise, +Y up, front = +Z. The camera of the brief
//   arrives from +Z flying toward -Z, with the sun at its back (sun direction = +Z, 9 degrees up) and the
//   storm wall beyond the tree at -Z. The final flight axis is x = -30 (the tree stands 30 m to the RIGHT
//   of the camera, so the portal 180 m beyond shows just left of the trunk), y = 12.
// SIZE   crown radius ~29 m (hero.radius), rise radius 50 m and ~3.5 m high; the trunk base sits on the
//   rise at y ~3.6, trunk top ~33 m, crown top ~52-55 m (hero.height).
// COST   120-130k triangles, 6 draw calls (tree+roots+termites+rise merged into one mesh, instanced nests,
//   grass, birds, seeds, rainbow), no lights, no textures, ~200-450 ms of build (yields between steps).
// LIGHT  Tree, rise and nests are MeshStandardMaterial (vertex colour + procedural detail and bump) and
//   take the scene's lights and fog: give it a hard low gold DirectionalLight from +Z (behind the camera,
//   intensity ~3-3.5) and a cool indigo HemisphereLight (~0.8), so it stands gold on dark. Grass and birds
//   are custom shaders that read the scene's FIRST DirectionalLight and first HemisphereLight (lights:
//   true) and scene fog. No shadow maps needed: crease and underside occlusion are baked in vertex colour.
//   The rise's normals lean toward opts.sunDir so the low sun lights it like the grass standing on it.
//
// OPTS   palette    7 hex strings, brief order: indigo, storm violet, gold, ochre, brown, umber, cream
//        sunDir     [x,y,z] local direction TOWARD the sun (default [0, sin 9deg, cos 9deg]); used by the
//                   built-in rainbow and the rise's baked lean
//        rainbow    true | false   built-in double rainbow (default true; set false to use fx.makeRainbow)
//        rainbowStrength  0..2 (default 1)
//        windDir    [x,z] local wind heading (default toward the storm and a little right: [0.45,-0.9])
//        wind       0..2 wind strength (default 1)
//        rise       false to build without the rise (trunk base at y = 0, no earth, roots, grass)
//        grass      false to omit the tussock grass on the rise
//        groundColor  (x, z, outColor) => outColor: the world's ground colour (linear); the rise blends into it
//                   beyond ~13 m from the trunk so its rim does not show as a disc
//        nests      number of pendant nests (default 120)        birds   number of weavers (default 80)
// HERO API (besides the contract)
//   hero.setProgress(u)   world progress 0..1 (never wall-clock): the rainbow strengthens as the camera
//                         settles on its final heading (0.3 -> 0.62) and the weavers flush out of the nests
//                         and wheel wide at u = 0.66-0.8, in step with the quelea burst the world adds at
//                         0.75. If never called the piece shows its full look (bow on, birds half roused).
//   hero.setFlash(x, dir) lightning: x 0..2 lights the tree's storm side blue-white (a rim, seen from the
//                         approach) for as long as you hold it; drive it from the same envelope as the sky
//                         flash. dir = optional local direction toward the bolt (default [0.2, 0.35, -1]).
//   hero.groundHeight(x, z)  local height of the rise (-0.6 outside its 50 m radius: it sinks under your
//                         terrain), so terrain, grass and herds can be seated on it.
//   hero.uniforms         uTime, uWind (vec3, local), uFlash, uFlashCol, uBurst, uRainbow, uRainAxis
//   hero.rainbow          the rainbow mesh (or null); hero.stats { triangles, drawCalls, clearance }
// ANCHORS (all local space)
//   portalSeat   { position [-30,12,-180], facing [0,0,1], radius 7 } the 14 m portal, 12 m above the
//                grass, 180 m beyond the tree, facing back up the final run.
//   flyThrough   ordered points of the final straight (x = -30): 260 m out, past the tree at 12 m, to the
//                portal. Nothing solid of the tree comes within anchors.clearance of that line (measured
//                at build, always > 8 m; typically 11-13 m).
//   viewpoints   { reveal, pass, under } camera positions: the far reveal on axis, the close pass beside
//                the low limb, and a spot under the crown looking up.
//   crown        { position, radius } centre and radius of the crown: the origin of the quelea burst.
//   nests        up to 24 nest positions (burst sources / pois).   trunkTop, hollow { position, facing },
//   lowLimb      tip of the low limb that reaches toward the flight line (close-pass detail), termites.
//   sunDir, antisolar   unit vectors; rainbowApex = direction of the top of the primary bow.
//   lightning    two suggested strike points behind the tree that frame well from the final run.
//   rise         { radius, height }.
// VIEWER  opts.view = 'close' only shrinks the reported radius/height so the orbit comes closer.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#2a2f4f', '#5b5f86', '#f2b25c', '#c98f3a', '#7a5a2a', '#2e2416', '#fff2c0'];
const FLY_X = -30, FLY_Y = 12;

// ---------- shared GLSL ----------
const GLSL_NOISE = /* glsl */`
float hh1(vec3 p){ p = fract(p*0.3183099+vec3(0.1,0.2,0.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float hn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hh1(i),hh1(i+vec3(1,0,0)),f.x), mix(hh1(i+vec3(0,1,0)),hh1(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hh1(i+vec3(0,0,1)),hh1(i+vec3(1,0,1)),f.x), mix(hh1(i+vec3(0,1,1)),hh1(i+vec3(1,1,1)),f.x),f.y),f.z); }
float hfbm(vec3 p){ return 0.5*hn3(p)+0.3*hn3(p*2.03+3.1)+0.2*hn3(p*4.1+7.7); }
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
`;

// reads the scene's first directional + hemisphere light inside a ShaderMaterial with lights: true
const GLSL_SCENE_LIGHT = /* glsl */`
vec3 heroAmbient(){ vec3 irr = ambientLightColor;
  #if NUM_HEMI_LIGHTS > 0
    irr += getHemisphereLightIrradiance(hemisphereLights[0], normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz))*0.8
         + getHemisphereLightIrradiance(hemisphereLights[0], normalize((viewMatrix*vec4(0.,-1.,0.,0.)).xyz))*0.2;
  #endif
  return irr*0.3183; }
vec3 heroSunCol(){
  #if NUM_DIR_LIGHTS > 0
    return directionalLights[0].color*0.3183;
  #else
    return vec3(0.0);
  #endif
}
vec3 heroSunDir(){
  #if NUM_DIR_LIGHTS > 0
    return directionalLights[0].direction;
  #else
    return vec3(0.,1.,0.);
  #endif
}
`;

// ---------- geometry accumulator ----------
function makeAcc() { return { pos: [], nor: [], col: [], hero: [], idx: [], n: 0 }; }
function accGeometry(G) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
  g.setAttribute('aHero', new THREE.Float32BufferAttribute(G.hero, 3));   // material flag, metres along, sway weight
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(G.idx), 1));
  return g;
}

const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3();
// A tapered, lumpy tube along a polyline. pts: [[x,y,z]...], rad: per-point radius, sway: per-point weight.
function addTube(G, pts, rad, radial, o) {
  const n = pts.length, base = G.n, c0 = o.c0, c1 = o.c1 || o.c0, lump = o.lump ?? 0.06, ph = o.phase ?? 0;
  const aoMin = o.aoMin ?? 0.62, shade = o.shade ?? 1, flag = o.flag || 0;
  let v = o.v0 || 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], p = pts[i];
    _T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    if (i === 0) { _N.set(0, 1, 0); if (Math.abs(_T.y) > 0.85) _N.set(1, 0, 0); }
    _N.addScaledVector(_T, -_N.dot(_T)).normalize();
    _B.crossVectors(_T, _N);
    if (i > 0) v += Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]);
    const t = i / (n - 1), r = rad[i], sw = o.sway ? o.sway[i] : 0;
    for (let j = 0; j < radial; j++) {
      const ang = (j / radial) * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
      const nx = _N.x * ca + _B.x * sa, ny = _N.y * ca + _B.y * sa, nz = _N.z * ca + _B.z * sa;
      const lu = lump * Math.sin(ang * 2 + ph + v * 0.55) + lump * 0.7 * Math.sin(ang * 3 - v * 0.9 + ph * 2.1);
      const rr = r * (1 + lu);
      G.pos.push(p[0] + nx * rr, p[1] + ny * rr, p[2] + nz * rr); G.nor.push(nx, ny, nz);
      const ao = aoMin + (1 - aoMin) * (ny * 0.5 + 0.5), sh = ao * (1 + (lump > 0 ? (lu / lump) * 0.09 : 0)) * shade * (o.shadeAt ? o.shadeAt(t) : 1);
      G.col.push(lerp(c0.r, c1.r, t) * sh, lerp(c0.g, c1.g, t) * sh, lerp(c0.b, c1.b, t) * sh);
      G.hero.push(flag, v, sw);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = base + i * radial + j, b = base + i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
    G.idx.push(a, b, c, b, d, c);
  }
  G.n += n * radial;
}

// A lumpy ellipsoid (boulders). f(nx,ny,nz) -> radius multiplier, col(nx,ny,nz) -> [r,g,b]
function addBlob(G, cx, cy, cz, rx, ry, rz, seg, rings, flag, f, col) {
  const base = G.n;
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI, sp = Math.sin(phi), cp = Math.cos(phi);
    for (let j = 0; j < seg; j++) {
      const th = (j / seg) * TAU, nx = sp * Math.sin(th), ny = cp, nz = sp * Math.cos(th), m = f(nx, ny, nz);
      G.pos.push(cx + nx * rx * m, cy + ny * ry * m, cz + nz * rz * m);
      const l = Math.hypot(nx / rx, ny / ry, nz / rz); G.nor.push(nx / rx / l, ny / ry / l, nz / rz / l);
      const c = col(nx, ny, nz, m); G.col.push(c[0], c[1], c[2]); G.hero.push(flag, cy + ny * ry, 0);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = base + i * seg + j, b = base + i * seg + ((j + 1) % seg), c = a + seg, d = b + seg;
    G.idx.push(a, c, b, b, c, d);
  }
  G.n += (rings + 1) * seg;
}

// 1D non-uniform cubic through control points [[x,y]...]
function curve1(cp, x) {
  let i = 0; while (i < cp.length - 2 && x > cp[i + 1][0]) i++;
  const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
  const h = p2[0] - p1[0], t = clamp((x - p1[0]) / h, 0, 1);
  const m1 = ((p2[1] - p0[1]) / Math.max(1e-6, p2[0] - p0[0])) * h, m2 = ((p3[1] - p1[1]) / Math.max(1e-6, p3[0] - p1[0])) * h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
}
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

// ---------- the MeshStandardMaterial patch shared by the tree/rise mesh and the nests ----------
function patchStandard(mat, U, mode) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime; sh.uniforms.uWind = U.uWind; sh.uniforms.uFlash = U.uFlash;
    sh.uniforms.uFlashCol = U.uFlashCol; sh.uniforms.uFlashDir = U.uFlashDir;
    const sway = mode === 'nest' ? /* glsl */`
      vHeroUv = vec2(1.0, position.y);
      #ifdef USE_INSTANCING
      { vec3 hp = instanceMatrix[3].xyz; float ph = hp.x*1.7 + hp.z*2.3 + hp.y*0.9; float wl = length(uWind);
        float s1 = (sin(uTime*1.7 + ph)*0.16 + sin(uTime*2.9 + ph*1.3)*0.06)*wl, s2 = (cos(uTime*1.3 + ph*0.7)*0.11 + 0.05)*wl;
        float c1 = cos(s1), n1 = sin(s1), c2 = cos(s2), n2 = sin(s2);
        transformed.xy = mat2(c1, n1, -n1, c1)*transformed.xy; transformed.zy = mat2(c2, n2, -n2, c2)*transformed.zy; }
      #endif` : /* glsl */`
      vHeroUv = aHero.xy;
      { float w = aHero.z, ph = dot(position.xz, vec2(0.045, 0.06));
        float g = sin(uTime*0.8 + ph) + 0.5*sin(uTime*1.9 + ph*2.3 + position.y*0.12);
        transformed += w*(uWind*g + vec3(0.0, 0.3*sin(uTime*1.3 + ph*1.7)*length(uWind), 0.0)); }`;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aHero; uniform float uTime; uniform vec3 uWind; varying vec3 vHeroPos; varying vec2 vHeroUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeroPos = position;\n' + sway);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFlash; uniform vec3 uFlashCol, uFlashDir; varying vec3 vHeroPos; varying vec2 vHeroUv; float heroH = 0.0;\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
      { float m = vHeroUv.x; vec3 p = vHeroPos; float dist = length(vViewPosition), fine = 1.0 - smoothstep(30.0, 110.0, dist);
        float n1 = hfbm(p*0.4), n2 = hfbm(p*2.6 + 11.0), n3 = mix(0.5, hn3(p*11.0), fine);
        if (m < 0.5) {                      // baobab bark: elephant-skin wrinkle rings, drip streaks, lichen
          float wz = smoothstep(0.38, 0.62, hfbm(p*0.23 + 5.0));
          float wr = mix(1.0, smoothstep(0.0, 0.3, abs(sin(vHeroUv.y*1.9 + n1*12.0 + n2*2.0))), wz*mix(0.25, 1.0, fine));
          float st = hn3(vec3(p.x*1.3, p.y*0.12, p.z*1.3));
          vec3 c = diffuseColor.rgb*(0.78 + 0.22*wr)*(0.76 + 0.48*n2)*(0.8 + 0.4*st)*(0.9 + 0.2*n3);
          c = mix(c, c*vec3(1.16, 0.9, 0.82), smoothstep(0.42, 0.7, n1));
          c = mix(c, c*0.4 + vec3(0.34, 0.31, 0.2), 0.4*smoothstep(0.6, 0.68, hfbm(p*0.8 + 31.0)));
          diffuseColor.rgb = c; heroH = wr*0.25 + n2*0.5 + n3*0.2;
        } else if (m < 1.5) {               // woven straw
          float f1 = sin((p.x + p.z)*58.0 + p.y*21.0 + n2*6.0), f2 = sin((p.x - p.z)*52.0 - p.y*66.0 + n1*5.0);
          float hs = mix(0.5, 0.5 + 0.25*f1 + 0.25*f2, 1.0 - smoothstep(12.0, 50.0, dist));
          diffuseColor.rgb *= (0.8 + 0.34*hs)*(0.72 + 0.56*n2); heroH = hs*0.6;
        } else if (m < 2.5) {               // dry earth, dust, straw stubble
          float cr = smoothstep(0.03, 0.12, abs(hn3(p*vec3(1.6, 0.4, 1.6)) - 0.5));
          vec3 c = diffuseColor.rgb*(0.72 + 0.5*n2)*(0.85 + 0.15*cr);
          c = mix(c, c*vec3(1.25, 1.12, 0.8), smoothstep(0.62, 0.8, n3)*0.6);
          diffuseColor.rgb = c; heroH = n2*0.6 + n3*0.3 + cr*0.2;
        } else {                            // termite clay with rain runnels
          float ru = abs(sin(atan(p.x - floor(p.x/9.0)*9.0, p.z)*9.0 + n2*5.0));
          diffuseColor.rgb *= (0.7 + 0.45*n2)*(0.86 + 0.14*ru); heroH = n2*0.7 + ru*0.3;
        }
      }`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
      { vec3 sp = -vViewPosition; vec3 dpx = dFdx(sp), dpy = dFdy(sp); float hx = dFdx(heroH), hy = dFdy(heroH);
        vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
        det = (det < 0.0 ? -1.0 : 1.0)*max(abs(det), 1e-7);
        float bf = 0.03*(1.0 - smoothstep(14.0, 60.0, length(vViewPosition)));
        normal = normalize(normal - bf*(hx*r1 + hy*r2)/det); }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
      { vec3 fd = normalize((viewMatrix*vec4(uFlashDir, 0.0)).xyz); float fl = max(dot(normal, fd)*0.75 + 0.25, 0.0);
        float rim = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 3.0);
        totalEmissiveRadiance += uFlash*uFlashCol*diffuseColor.rgb*fl*(0.8 + 1.6*rim); }`);
  };
  mat.customProgramCacheKey = () => 'storm-savanna-hero-' + mode;
  return mat;
}

// =====================================================================================================
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('elder-baobab') : ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cIndigo, cStorm, cGold, cOchre, cBrown, cUmber, cCream] = pal;
  const mixc = (a, b, t) => a.clone().lerp(b, t);
  const view = opts.view || '';
  await ctx.yield();

  // ----- per-seed character -----
  const hasRise = opts.rise !== false, RM = 50, RISE = hasRise ? rng.range(3.0, 3.9) : 0;
  const H = 28 * rng.range(0.95, 1.06), R0 = 8 * rng.range(0.97, 1.04);
  const belly = rng.range(1.0, 1.1), neck = rng.range(0.72, 0.83), twist = rng.range(-0.5, 0.5);
  const NL = rng.int(6, 9), leanA = rng.range(0, TAU), leanK = rng.range(0.2, 1.1);
  const windXZ = opts.windDir || [0.45, -0.9], wl = Math.hypot(windXZ[0], windXZ[1]) || 1, windK = opts.wind ?? 1;
  const windDir = new THREE.Vector3(windXZ[0] / wl, 0, windXZ[1] / wl);
  const sunDir = new THREE.Vector3().fromArray(opts.sunDir || [0, Math.sin(9 * Math.PI / 180), Math.cos(9 * Math.PI / 180)]).normalize();

  const barkBase = mixc(cBrown, cOchre, 0.45).lerp(cStorm, rng.range(0.24, 0.36)).lerp(cCream, 0.2);
  const barkPale = mixc(barkBase, cCream, 0.3).lerp(cStorm, 0.12);
  const barkDark = mixc(cUmber, cBrown, 0.25);
  const earth = mixc(cBrown, cOchre, 0.5), dust = mixc(cOchre, cCream, 0.35), strawC = mixc(cOchre, cGold, 0.55);

  // ----- the rise -----
  const groundH = (x, z) => {
    if (!hasRise) return 0;
    const d = Math.hypot(x, z) / RM; if (d >= 1) return -0.6;
    const b = (1 - d * d) * (1 - d * d);
    return RISE * b * (1 + 0.16 * noise.fbm2(x * 0.028 + 9.1, z * 0.028 - 4.2, 3)) + 0.4 * noise.fbm2(x * 0.1, z * 0.1, 3) * b
      + 0.7 * Math.exp(-d * RM / 9) - 0.6 * smoothstep(0.78, 1, d);
  };
  const baseY = groundH(0, 0) - 0.25;

  // ----- trunk surface -----
  const prof = [[0, 1.1], [0.05, 1.0], [0.3, belly], [0.56, 0.94], [0.76, neck], [0.88, neck * 1.02], [0.95, 0.52], [1, 0.16]];
  const widths = []; let wsum = 0; for (let k = 0; k < NL; k++) { const w = rng.range(0.7, 1.4); widths.push(w); wsum += w; }
  const cum = [0]; for (let k = 0; k < NL; k++) cum.push(cum[k] + (widths[k] / wsum) * TAU);
  const lobe0 = rng.range(0, TAU), lobeM = [], lobeSub = [];
  for (let k = 0; k < NL; k++) { lobeM.push(rng.range(0.93, 1.1)); lobeSub.push(rng.int(2, 3)); }
  const burls = []; for (let i = rng.int(3, 6); i > 0; i--) burls.push({ th: rng.range(0, TAU), y: rng.range(4, H * 0.8), h: rng.range(0.3, 0.7), s: rng.range(0.9, 1.8) });
  const hollow = { th: rng.range(-0.8, -0.15), h: rng.range(5.5, 9), w: rng.range(1.8, 2.7) };
  const axisAt = (y) => { const k = leanK * Math.pow(Math.max(0, y) / H, 1.6); return [Math.sin(leanA) * k, Math.cos(leanA) * k]; };
  const lobeTwist = (y) => twist * (y / H) + 0.12 * noise.n2(y * 0.11, 3.3);
  const lobeCentre = (k, y) => lobe0 + (cum[k] + cum[k + 1]) * 0.5 - lobeTwist(y);
  const tr = { r: 0, ao: 0, c: 0, q: 9 };
  const trunkAt = (th, y) => {
    const yn = y / H, a2 = (((th + lobeTwist(y) - lobe0) % TAU) + TAU) % TAU;
    let k = 0; while (k < NL - 1 && a2 >= cum[k + 1]) k++;
    const t = (a2 - cum[k]) / (cum[k + 1] - cum[k]), c = Math.sin(Math.PI * t), cr = Math.pow(1 - c, 1.5);
    const e = smoothstep(0, 0.6, Math.min(t, 1 - t) * 2);
    const nb = t < 0.5 ? lobeM[(k + NL - 1) % NL] : lobeM[(k + 1) % NL], mk = lerp((lobeM[k] + nb) * 0.5, lobeM[k], e);
    const d = (0.2 * Math.exp(-y / 4.5) + 0.085 + 0.14 * smoothstep(0.6, 0.9, yn)) * (1 - 0.75 * smoothstep(0.9, 1.0, yn));
    const sub = Math.abs(Math.sin(Math.PI * t * lobeSub[k])), subd = 0.035 * (1 - sub) * (1 - sub) * c;
    let r = R0 * curve1(prof, yn) * mk * (1 - d * cr - subd);
    r *= 1 + 0.24 * c * c * Math.exp(-Math.max(0, y) / 1.7);
    r += 0.3 * noise.fbm3(Math.sin(th) * 3.2, y * 0.16, Math.cos(th) * 3.2, 3);
    for (const b of burls) { const ds = angDiff(th, b.th) * r, dy = y - b.y; r += b.h * Math.exp(-(ds * ds + dy * dy) / (b.s * b.s)); }
    let q = 9;
    if (hollow) {
      const s = angDiff(th, hollow.th) * r / hollow.w, yy = Math.max(0, y - 0.6) / hollow.h; q = s * s + yy * yy;
      r -= 3.1 * (1 - smoothstep(0.5, 1.0, q)); r += 0.42 * Math.exp(-Math.pow((q - 1.15) / 0.25, 2));
    }
    tr.r = r; tr.ao = clamp(cr * d / 0.3 + (1 - sub) * (1 - sub) * 0.25 * c, 0, 1); tr.c = c; tr.q = q;
    return tr;
  };

  const G = makeAcc();
  {
    const SEG = 144, ROWS = 84, base = G.n, P = new Float32Array((ROWS + 2) * SEG * 3);
    const dustC = mixc(earth, dust, 0.4), polish = mixc(barkBase, cCream, 0.35), hollowC = barkDark.clone().multiplyScalar(0.2);
    for (let i = 0; i <= ROWS + 1; i++) {
      const cap = i === ROWS + 1, y = cap ? H + 0.5 : -1.6 + (H + 1.6) * Math.pow(i / ROWS, 0.92), ax = axisAt(y);
      for (let j = 0; j < SEG; j++) {
        const th = (j / SEG) * TAU, o = (i * SEG + j) * 3, t = trunkAt(th, Math.min(y, H)), r = cap ? 0.25 : t.r;
        P[o] = ax[0] + Math.sin(th) * r; P[o + 1] = baseY + y; P[o + 2] = ax[1] + Math.cos(th) * r;
        const yn = clamp(y / H, 0, 1);
        let sh = (1 - 0.68 * t.ao) * (0.9 + 0.14 * t.c) * (1 - 0.3 * smoothstep(0.9, 1.0, yn));
        const col = barkBase.clone().lerp(barkPale, 0.5 * yn);
        col.lerp(dustC, 0.55 * Math.exp(-Math.max(0, y) / 2.3));
        const rub = smoothstep(0.1, 0.45, noise.fbm2(th * 3.1 + 5, y * 0.35, 3)) * smoothstep(1.2, 2.4, y) * (1 - smoothstep(4.5, 6.5, y));
        col.lerp(polish, 0.45 * rub);
        if (hollow) { const hq = 1 - smoothstep(0.5, 0.95, t.q); col.lerp(hollowC, hq); sh *= 1 - 0.5 * hq; col.lerp(polish, 0.35 * Math.exp(-Math.pow((t.q - 1.15) / 0.3, 2))); }
        G.col.push(col.r * sh, col.g * sh, col.b * sh); G.hero.push(0, y, 0);
      }
      if ((i & 3) === 3) await ctx.yield();
    }
    await ctx.yield();
    const a3 = new THREE.Vector3(), b3 = new THREE.Vector3();
    for (let i = 0; i <= ROWS + 1; i++) for (let j = 0; j < SEG; j++) {
      const o = (i * SEG + j) * 3, jl = (i * SEG + ((j + SEG - 1) % SEG)) * 3, jr = (i * SEG + ((j + 1) % SEG)) * 3;
      const iu = (Math.min(ROWS + 1, i + 1) * SEG + j) * 3, id = (Math.max(0, i - 1) * SEG + j) * 3;
      a3.set(P[jr] - P[jl], P[jr + 1] - P[jl + 1], P[jr + 2] - P[jl + 2]); b3.set(P[iu] - P[id], P[iu + 1] - P[id + 1], P[iu + 2] - P[id + 2]);
      a3.cross(b3).normalize(); if (i === ROWS + 1) a3.set(0, 1, 0);
      G.pos.push(P[o], P[o + 1], P[o + 2]); G.nor.push(a3.x, a3.y, a3.z);
    }
    await ctx.yield();
    for (let i = 0; i <= ROWS; i++) for (let j = 0; j < SEG; j++) {
      const a = base + i * SEG + j, b = base + i * SEG + ((j + 1) % SEG), c = a + SEG, d = b + SEG;
      G.idx.push(a, b, c, b, d, c);
    }
    G.n += (ROWS + 2) * SEG;
  }
  await ctx.yield();

  // ----- the crown: limbs forking four times into twigs -----
  const nestSpots = [], crownPts = [];
  const STEPS = [10, 7, 5, 4, 2], RADIAL = [11, 9, 7, 5, 3], KINK = [0.16, 0.3, 0.42, 0.55, 0.6];
  const LEN = [[10.5, 14.5], [5.5, 8.5], [3.4, 5.8], [2.0, 3.6], [1.0, 2.1]];
  const vv = new THREE.Vector3(), wv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const randUnit = (o) => { const z = rng.range(-1, 1), a = rng.range(0, TAU), s = Math.sqrt(1 - z * z); return o.set(Math.cos(a) * s, z, Math.sin(a) * s); };
  let twigBudget = 1100;
  function grow(start, dir, r0, L, level, w0, o = {}) {
    const steps = STEPS[level], pts = [], rad = [], sway = [], dirs = [];
    const p = start.slice(), d = new THREE.Vector3().copy(dir).normalize(), wand = randUnit(new THREE.Vector3());
    const bias = rng.range(-0.1, 0.24), terminal = level === 4, flare = o.flare ?? 0.28, endK = terminal ? 0.12 : 0.5;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push(p.slice()); dirs.push(d.clone());
      rad.push(r0 * (1 - (1 - endK) * Math.pow(t, 0.85)) * (1 + flare * Math.exp(-t * 8)) * (o.bud ? 0.6 + 0.4 * smoothstep(0, 0.2, t) : 1));
      sway.push(w0 + L * t * 0.011 * (level >= 3 ? 1.8 : 1));
      if (i === steps) break;
      wand.lerp(randUnit(vv), 0.55).normalize();
      if (o.target) { const tg = o.target(t, vv); d.lerp(tg, 0.34); d.addScaledVector(wand, KINK[level]); }
      else { d.addScaledVector(wand, KINK[level]); d.y += bias * 0.5; const ol = Math.hypot(p[0], p[2]) || 1; d.x += (p[0] / ol) * 0.07; d.z += (p[2] / ol) * 0.07; }
      d.normalize();
      const st = L / steps; let nx = p[0] + d.x * st, ny = p[1] + d.y * st, nz = p[2] + d.z * st;
      if (Math.hypot(nx - FLY_X, ny - FLY_Y) < 12) { d.x = Math.abs(d.x) * 0.3; d.y = Math.abs(d.y) + 0.5; d.normalize(); nx = p[0] + d.x * st; ny = p[1] + d.y * st; nz = p[2] + d.z * st; }
      if (ny < 14) { const gy = groundH(nx, nz) + 6; if (ny < gy) { ny = gy; d.y = Math.abs(d.y) + 0.2; d.normalize(); } }
      p[0] = nx; p[1] = ny; p[2] = nz;
    }
    const tipC = level >= 3 ? barkPale : mixc(barkBase, barkPale, 0.35 + 0.15 * level);
    addTube(G, pts, rad, RADIAL[level], { c0: o.c0 || mixc(barkBase, barkPale, 0.25 + 0.12 * level), c1: tipC, lump: level < 2 ? 0.1 : 0.06, phase: rng.range(0, 6),
      sway, shade: rng.range(0.86, 1.08), aoMin: 0.5, shadeAt: level === 0 ? (t) => 0.86 + 0.14 * smoothstep(0.0, 0.3, t) : null, v0: rng.range(0, 9) });
    for (let i = 1; i <= steps; i++) {
      const q = pts[i]; if (level <= 2 && i % 2 === 0) crownPts.push(q);
      if (((level >= 2 && rad[i] < 0.5 && rad[i] > 0.05) || o.low) && Math.abs(dirs[i].y) < 0.75 && i < steps)
        nestSpots.push({ p: [q[0], q[1] - rad[i] * 0.9, q[2]], low: !!o.low });
    }
    if (terminal) return pts;
    const tipP = pts[steps], tipD = dirs[steps], tipR = rad[steps];
    const child = (pos, cd, r, wS) => {
      const nl = level + 1; if (nl === 4) { if (twigBudget-- <= 0) return; }
      grow(pos, cd, r, rng.range(LEN[nl][0], LEN[nl][1]) * (o.lenK ?? 1), nl, wS, { low: o.low, lenK: o.lenK, flare: 0.12 });
    };
    const nTip = o.nTip ?? 2;
    for (let c = 0; c < nTip; c++) {
      randUnit(wv); wv.addScaledVector(tipD, -wv.dot(tipD)).normalize();
      const cd = tipD.clone().multiplyScalar(rng.range(0.9, 1.3)).addScaledVector(wv, (c === 0 ? 1 : -1) * rng.range(0.45, 0.85)); if (c > 1) randUnit(cd).lerp(tipD, 0.5);
      child(tipP.slice(), cd, tipR * rng.range(0.78, 0.92), sway[steps]);
    }
    const sideP = o.nSide ?? [3, 1.4, 0.75, 0.3][level], nSide = Math.floor(sideP) + (rng.chance(sideP % 1) ? 1 : 0);
    for (let c = 0; c < nSide; c++) {
      const i = rng.int(Math.max(1, Math.floor(steps * 0.3)), steps - 1), q = pts[i], dd = dirs[i];
      randUnit(wv); wv.addScaledVector(dd, -wv.dot(dd)).normalize(); if (level === 0) wv.y = Math.abs(wv.y) * 0.6 + 0.1;
      const cd = dd.clone().multiplyScalar(0.45).add(wv);
      child(q.slice(), cd, rad[i] * rng.range(0.58, 0.8), sway[i]);
    }
    return pts;
  }

  const crownFlat = rng.range(0.75, 1.15);
  for (let k = 0; k < NL; k++) {
    const y0 = H - rng.range(5.0, 6.6), az0 = lobeCentre(k, y0) + rng.range(-0.08, 0.08), ax = axisAt(y0);
    const r0 = rng.range(2.0, 2.6) * Math.sqrt(widths[k] / (wsum / NL)), rs = trunkAt(az0, y0).r - r0;
    const drift = rng.range(-0.5, 0.5), e0 = rng.range(70, 80), e1 = rng.range(6, 24) * crownFlat, e2 = rng.range(16, 44);
    const start = [ax[0] + Math.sin(az0) * rs, baseY + y0, ax[1] + Math.cos(az0) * rs];
    const target = (t, o) => { const el = (t < 0.6 ? lerp(e0, e1, smoothstep(0.12, 0.6, t)) : lerp(e1, e2, smoothstep(0.6, 1, t))) * Math.PI / 180, az = az0 + drift * t; return o.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); };
    grow(start, target(0, new THREE.Vector3()), r0, rng.range(LEN[0][0], LEN[0][1]) + 3, 0, 0.01, { target, flare: 0.1, bud: true });
    await ctx.yield();
  }
  { // central leader
    const ax = axisAt(H), target = (t, o) => o.set(Math.sin(leanA) * 0.25 * t, 1, Math.cos(leanA) * 0.25 * t).normalize();
    grow([ax[0], baseY + H - 2.5, ax[1]], up, rng.range(1.5, 1.9), rng.range(8, 11), 0, 0.01, { target, flare: 0.5, nSide: 2 });
  }
  await ctx.yield();
  // low limbs: one reaches toward the flight line at eye level, hung with nests; sometimes a second elsewhere
  let lowTip = null;
  const lowCount = rng.chance(0.6) ? 2 : 1;
  for (let k = 0; k < lowCount; k++) {
    const az0 = k === 0 ? -Math.PI / 2 + rng.range(-0.25, 0.5) : rng.range(0.4, 2.6), y0 = rng.range(8.5, 11) + (k ? rng.range(0, 4) : 0);
    const ax = axisAt(y0), rs = trunkAt(az0, y0).r - 1.6, e0 = rng.range(8, 20), e1 = rng.range(25, 45), drift = rng.range(-0.35, 0.35);
    const target = (t, o) => { const el = lerp(e0, e1, smoothstep(0.35, 1, t)) * Math.PI / 180, az = az0 + drift * t; return o.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); };
    const pts = grow([ax[0] + Math.sin(az0) * rs, baseY + y0, ax[1] + Math.cos(az0) * rs], target(0, new THREE.Vector3()), rng.range(1.15, 1.45), rng.range(9.5, 12), 0, 0.01, { target, flare: 0.5, low: true, nSide: 2, lenK: 0.62 });
    if (k === 0) lowTip = pts[pts.length - 1];
  }
  await ctx.yield();

  // ----- surface roots over the rise -----
  if (hasRise) for (let k = 0; k < NL; k++) {
    let az = lobeCentre(k, 0) + rng.range(-0.1, 0.1); const L = rng.range(9, 21), r0 = rng.range(0.85, 1.35), n = 12;
    if (hollow && Math.abs(angDiff(az, hollow.th)) < hollow.w / R0 + 0.24) continue;
    const root = (az, L, r0, sx, sz, t0) => {
      const pts = [], rad = []; let x = sx, z = sz;
      for (let i = 0; i <= n; i++) {
        const t = i / n, r = r0 * Math.pow(1 - t, 1.25) + 0.05;
        pts.push([x, groundH(x, z) + r * lerp(0.45, -0.7, Math.pow(t, 1.5)) + (i === 0 && t0 === 0 ? 0.5 : 0), z]); rad.push(r);
        az += rng.range(-0.28, 0.28); x += Math.sin(az) * L / n; z += Math.cos(az) * L / n;
      }
      addTube(G, pts, rad, 7, { c0: mixc(barkBase, dust, 0.35), c1: mixc(earth, dust, 0.5), lump: 0.1, phase: rng.range(0, 6), aoMin: 0.55, shade: rng.range(0.85, 1.0) });
      return pts;
    };
    const pts = root(az, L, r0, Math.sin(az) * R0 * 0.98, Math.cos(az) * R0 * 0.98, 0);
    if (rng.chance(0.65)) { const q = pts[rng.int(3, 6)]; root(az + rng.sign() * rng.range(0.5, 1.0), L * 0.5, r0 * 0.5, q[0], q[2], 1); }
  }

  // ----- termite spires and a few boulders on the rise -----
  const termites = [];
  if (hasRise) {
    const clay = mixc(cOchre, cBrown, 0.45).lerp(cCream, 0.08), clayTop = mixc(clay, cCream, 0.3);
    for (let k = rng.int(2, 3); k > 0; k--) {
      const az = rng.range(0.15, Math.PI * 0.95), d = rng.range(21, 40), x = Math.sin(az) * d, z = Math.cos(az) * d;
      const hgt = rng.range(3.0, 5.2); termites.push([x, groundH(x, z) + hgt, z]);
      for (let s = 0; s < 5; s++) {
        const h = s === 0 ? hgt : hgt * rng.range(0.3, 0.68), r = s === 0 ? rng.range(1.3, 1.7) : rng.range(0.6, 1.0), tp = rng.range(0, 6);
        const ox = s === 0 ? 0 : rng.range(-1.4, 1.4), oz = s === 0 ? 0 : rng.range(-1.4, 1.4), lx = rng.range(-0.25, 0.25), lz = rng.range(-0.25, 0.25);
        const pts = [], rad = [];
        for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([x + ox + lx * h * t * t, groundH(x + ox, z + oz) - 0.4 + (h + 0.4) * t, z + oz + lz * h * t * t]); rad.push(r * Math.pow(1 - t, 0.75) * (1 + 0.2 * Math.sin(t * 8 + tp)) * (1 + 0.3 * Math.exp(-t * 7)) + 0.07); }
        addTube(G, pts, rad, 8, { c0: clay, c1: clayTop, lump: 0.24, phase: rng.range(0, 6), flag: 3, aoMin: 0.7, shade: rng.range(0.9, 1.05) });
      }
    }
    const rockC = mixc(cStorm, cBrown, 0.55).lerp(cCream, 0.12);
    for (let k = rng.int(5, 8); k > 0; k--) {
      const az = rng.range(0, TAU), d = rng.range(11, 40), x = Math.sin(az) * d, z = Math.cos(az) * d, r = rng.range(0.5, 1.7), so = rng.range(0, 90);
      addBlob(G, x, groundH(x, z) + r * 0.15, z, r * rng.range(1, 1.5), r * rng.range(0.55, 0.8), r, 8, 5, 2,
        (nx, ny, nz) => 1 + 0.3 * noise.fbm3(nx * 1.4 + so, ny * 1.4, nz * 1.4, 2),
        (nx, ny) => { const s = 0.55 + 0.45 * (ny * 0.5 + 0.5); return [rockC.r * s, rockC.g * s, rockC.b * s]; });
    }
    // the rise itself: trampled earth round the trunk, straw-gold further out, sinking under the world's terrain
    const sunH = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize();
    const SEG = 72, NR = 20, base = G.n, gold = mixc(cOchre, cGold, 0.5).multiplyScalar(0.8), col = new THREE.Color(), wcol = new THREE.Color();
    for (let i = 0; i <= NR; i++) {
      const r = 5 + 45 * Math.pow(i / NR, 1.12);
      for (let j = 0; j < SEG; j++) {
        const th = (j / SEG) * TAU + (i % 2) * (Math.PI / SEG), x = Math.sin(th) * r, z = Math.cos(th) * r, y = groundH(x, z), e = 0.6;
        const dx = groundH(x + e, z) - groundH(x - e, z), dz = groundH(x, z + e) - groundH(x, z - e), l = Math.hypot(dx, 2 * e, dz);
        const lean = 0.8 - 0.7 * smoothstep(16, 40, r), nnx = -dx / l + sunH.x * lean, nny = 2 * e / l, nnz = -dz / l + sunH.z * lean, nl = Math.hypot(nnx, nny, nnz);
        G.pos.push(x, i === NR ? -0.7 : y, z); G.nor.push(nnx / nl, nny / nl, nnz / nl);
        const n = noise.fbm2(x * 0.07 + 3, z * 0.07, 3), bare = (1 - smoothstep(11, 22 + 6 * n, r));
        col.copy(gold).lerp(mixc(cOchre, cBrown, 0.3), 0.35 + 0.3 * n).lerp(earth.clone().lerp(dust, 0.45 + 0.3 * n), bare);
        // opts.groundColor(x, z, out): the world's own ground colour, so the rise melts into the plain toward its rim
        if (opts.groundColor) col.lerp(opts.groundColor(x, z, wcol), smoothstep(13, 30, r));
        const sh = 0.85 + 0.2 * noise.n2(x * 0.3, z * 0.3) * (1 - 0.7 * smoothstep(20, 40, r)) - 0.25 * Math.exp(-Math.max(0, r - 8) / 2.5);
        G.col.push(col.r * sh, col.g * sh, col.b * sh); G.hero.push(2, 0, 0);
      }
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < SEG; j++) {
      const a = base + i * SEG + j, b = base + i * SEG + ((j + 1) % SEG), c = a + SEG, d = b + SEG;
      G.idx.push(a, c, b, b, c, d);
    }
    G.n += (NR + 1) * SEG;
  }
  await ctx.yield();

  // ----- shared uniforms and the merged tree/rise mesh -----
  const U = {
    uTime: { value: 0 }, uWind: { value: windDir.clone().multiplyScalar(windK) }, uFlash: { value: 0 },
    uFlashCol: { value: new THREE.Color(0.9, 1.1, 1.75) }, uFlashDir: { value: new THREE.Vector3(0.2, 0.35, -1).normalize() },
    uBurst: { value: 0.35 }, uRainbow: { value: opts.rainbowStrength ?? 1 }, uRainAxis: { value: sunDir.clone().negate() },
  };
  const object = new THREE.Group(); object.name = 'elder-baobab';
  const treeGeo = accGeometry(G); treeGeo.computeBoundingSphere();
  const treeMat = patchStandard(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 }), U, 'tree');
  treeMat.userData.heroUniforms = U;
  const tree = new THREE.Mesh(treeGeo, treeMat); tree.name = 'baobab'; object.add(tree);
  let triangles = G.idx.length / 3;
  await ctx.yield();

  // crown extents + clearance to the flight line (everything but the ground)
  let top = 0, crownR = 0, clearance = 1e9, cx = 0, cy = 0, cz = 0;
  for (const q of crownPts) { cx += q[0]; cy += q[1]; cz += q[2]; }
  const crownC = new THREE.Vector3(cx, cy, cz).divideScalar(Math.max(1, crownPts.length));
  for (let i = 0; i < G.n; i++) {
    const x = G.pos[i * 3], y = G.pos[i * 3 + 1], z = G.pos[i * 3 + 2];
    if (G.hero[i * 3] > 1.5) continue;
    if (y > top) top = y; if (y > baseY + H * 0.8) crownR = Math.max(crownR, Math.hypot(x, z));
    const dl = Math.hypot(x - FLY_X, y - FLY_Y); if (dl < clearance) clearance = dl;
  }

  await ctx.yield();
  // ----- pendant weaver nests -----
  const nestWant = opts.nests ?? 120, chosen = [];
  {
    rng.shuffle(nestSpots);
    const seeds = nestSpots.slice(0, rng.int(7, 11));
    for (const s of nestSpots) {
      if (chosen.length >= nestWant) break;
      const p = s.p; if (Math.hypot(p[0] - FLY_X, p[1] - 3.2 - FLY_Y) < 8.5 || p[1] - 3.4 < groundH(p[0], p[2]) + 2.5) continue;
      let dm = 1e9; for (const c of seeds) dm = Math.min(dm, Math.hypot(p[0] - c.p[0], p[1] - c.p[1], p[2] - c.p[2]));
      if (!(s.low ? rng.chance(0.7) : rng() < Math.exp(-dm / 3.2))) continue;
      let ok = true; for (const c of chosen) if (Math.hypot(p[0] - c[0], p[2] - c[2]) < 0.95 && Math.abs(p[1] - c[1]) < 3) { ok = false; break; }
      if (ok) chosen.push(p);
    }
  }
  let nests = null;
  if (chosen.length) {
    const NG = makeAcc(), nA = mixc(cGold, cCream, 0.35), nB = mixc(strawC, cBrown, 0.2);
    addTube(NG, [[0, 0.05, 0], [0, -0.45, 0], [0, -0.85, 0], [0, -1.0, 0], [0, -1.2, 0], [0, -1.5, 0], [0, -1.8, 0], [0, -2.02, 0], [0, -2.1, 0]],
      [0.035, 0.03, 0.04, 0.15, 0.37, 0.48, 0.43, 0.23, 0.02], 7, { c0: nA, c1: nB, lump: 0.07, flag: 1, aoMin: 0.6 });
    addTube(NG, [[0.24, -1.72, 0], [0.35, -2.1, 0], [0.38, -2.5, 0], [0.38, -2.52, 0]], [0.21, 0.18, 0.17, 0.1], 6,
      { c0: nB, c1: mixc(cUmber, nB, 0.3), lump: 0.05, flag: 1, aoMin: 0.5, shadeAt: (t) => 1 - 0.75 * smoothstep(0.6, 1, t) });
    const ng = accGeometry(NG), nm = patchStandard(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }), U, 'nest');
    nests = new THREE.InstancedMesh(ng, nm, chosen.length); nests.name = 'weaver-nests';
    const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), ic = new THREE.Color();
    chosen.forEach((p, i) => {
      const s = rng.range(0.7, 1.2); qt.setFromAxisAngle(up, rng.range(0, TAU)); sc.set(s, s * rng.range(0.8, 1.45), s); ps.set(p[0], p[1], p[2]);
      nests.setMatrixAt(i, m4.compose(ps, qt, sc));
      nests.setColorAt(i, ic.setRGB(1, 1, 1).lerp(new THREE.Color(0.72, 0.62, 0.5), rng()).multiplyScalar(rng.range(0.85, 1.1)));
    });
    nests.instanceMatrix.needsUpdate = true; nests.instanceColor.needsUpdate = true; nests.frustumCulled = false;
    object.add(nests); triangles += (NG.idx.length / 3) * chosen.length;
  }
  await ctx.yield();

  // ----- tussock grass on the rise: three crossed cards per tuft, blades drawn in the shader -----
  let grass = null;
  if (hasRise && opts.grass !== false) {
    const COUNT = 4200, off = new Float32Array(COUNT * 4), vr = new Float32Array(COUNT * 4); let n = 0, guard = 0;
    while (n < COUNT && guard++ < COUNT * 12) {
      const r = Math.sqrt(rng()) * 49.5, a = rng.range(0, TAU), x = Math.sin(a) * r, z = Math.cos(a) * r;
      const dens = (0.5 + 0.5 * noise.fbm2(x * 0.06 + 20, z * 0.06, 2)) * smoothstep(9.5, 17, r) * (1 - 0.8 * smoothstep(42, 50, r));
      if (rng() > dens + 0.12 * smoothstep(9.5, 12, r)) continue;
      const tall = 0.75 + 0.5 * rng() + 0.3 * noise.n2(x * 0.09, z * 0.09);
      off.set([x, groundH(x, z) - 0.06, z, rng.range(0, TAU)], n * 4); vr.set([rng.range(1.3, 2.0), 1.15 * tall, rng(), rng()], n * 4); n++;
    }
    const gg = new THREE.InstancedBufferGeometry(), gp = [], gu = [], gc = [], gi = [];
    for (let c = 0; c < 3; c++) {
      const a = (c / 3) * Math.PI + 0.3, dx = Math.cos(a) * 0.5, dz = Math.sin(a) * 0.5, b = c * 4;
      gp.push(-dx, 0, -dz, dx, 0, dz, -dx, 1, -dz, dx, 1, dz); gu.push(0, 0, 1, 0, 0, 1, 1, 1); gc.push(c, c, c, c); gi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2));
    gg.setAttribute('aCard', new THREE.Float32BufferAttribute(gc, 1)); gg.setIndex(gi);
    gg.setAttribute('aOff', new THREE.InstancedBufferAttribute(off.subarray(0, n * 4), 4)); gg.setAttribute('aVar', new THREE.InstancedBufferAttribute(vr.subarray(0, n * 4), 4));
    gg.instanceCount = n;
    const gm = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, fog: true, lights: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, THREE.UniformsLib.fog, {
        uRoot: { value: mixc(cBrown, cOchre, 0.3).multiplyScalar(0.7) }, uMid: { value: mixc(cOchre, cGold, 0.45) }, uTip: { value: mixc(cGold, cCream, 0.55).multiplyScalar(0.85) } }]),
      vertexShader: /* glsl */`
        attribute vec4 aOff; attribute vec4 aVar; attribute float aCard;
        uniform float uTime; uniform vec3 uWind;
        varying vec2 vUv; varying vec3 vVar; varying vec3 vView; varying float vGust;
        #include <common>
        #include <fog_pars_vertex>
        void main(){
          vec3 p = position; float c = cos(aOff.w), s = sin(aOff.w); p.xz = mat2(c, -s, s, c)*p.xz; p.xz *= aVar.x; p.y *= aVar.y;
          vec3 b = aOff.xyz; float wl = length(uWind); vec3 wd = uWind/max(wl, 1e-4);
          float ph = dot(b.xz, wd.xz)*0.16 - uTime*1.7 + sin(b.x*0.06 - b.z*0.045)*2.2;
          float gust = 0.5 + 0.5*sin(ph); gust *= gust;
          float fl = sin(uTime*5.3 + aVar.z*40.0 + aCard*2.0)*0.05;
          float bend = (0.2 + 0.62*gust + fl)*wl*uv.y;
          p.xz += wd.xz*bend*aVar.y; p.y -= bend*bend*aVar.y*0.35;
          vec4 mvPosition = modelViewMatrix*vec4(b + p, 1.0);
          vUv = uv; vVar = vec3(aVar.z + aCard*0.37, aVar.w, aVar.y); vGust = gust; vView = mvPosition.xyz;
          gl_Position = projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uRoot, uMid, uTip;
        varying vec2 vUv; varying vec3 vVar; varying vec3 vView; varying float vGust;
        #include <common>
        #include <lights_pars_begin>
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${GLSL_SCENE_LIGHT}
        void main(){
          float N = 8.0, x = vUv.x*N, id = floor(x), hit = 0.0, tipK = 0.0, edge = 0.0, head = 0.0;
          for (int k = -1; k <= 1; k++) {
            float bi = id + float(k);
            float h1 = h21(vec2(bi, vVar.x*17.0)), h2 = h21(vec2(bi + 31.0, vVar.x*29.0));
            float hh = 0.45 + 0.55*h2, v = vUv.y/hh;
            float xc = bi + 0.5 + (h1 - 0.5)*0.6 + (h1 - 0.5)*1.5*v*v;
            float hd = step(0.45, h2)*smoothstep(0.7, 0.8, v)*(1.0 - smoothstep(0.93, 1.0, v));
            float w = 0.27*(1.0 - 0.8*v) + 0.2*hd, d = abs(x - xc);
            if (v <= 1.0 && d < w && bi >= 0.0 && bi <= N - 1.0) { hit = 1.0; tipK = max(tipK, v); edge = d/w; head = max(head, hd); }
          }
          if (hit < 0.5) discard;
          vec3 alb = mix(uRoot, uMid, smoothstep(0.0, 0.45, tipK)); alb = mix(alb, uTip, min(1.0, smoothstep(0.55, 1.0, tipK)*0.7 + head*0.4));
          alb *= (0.8 + 0.4*vVar.y)*(1.0 - 0.25*edge);
          vec3 V = normalize(-vView), L = heroSunDir();
          float back = pow(max(dot(-V, L), 0.0), 3.0), occ = mix(0.45, 1.0, smoothstep(0.0, 0.6, vUv.y));
          vec3 col = alb*(heroAmbient() + heroSunCol()*(0.6 + 0.32*vGust + 0.9*back*smoothstep(0.2, 1.0, vUv.y)))*occ;
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    gm.uniforms.uTime = U.uTime; gm.uniforms.uWind = U.uWind;
    grass = new THREE.Mesh(gg, gm); grass.name = 'rise-grass'; grass.frustumCulled = false; object.add(grass); triangles += n * 6;
  }
  await ctx.yield();

  // ----- weaver birds flitting round the nests (flush outward with uBurst) -----
  let birds = null;
  const birdCount = chosen.length ? (opts.birds ?? 80) : 0;
  if (birdCount > 0) {
    const bg = new THREE.InstancedBufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.17, -0.05, 0, 0, 0.05, 0, 0, 0, 0, -0.22,
      -0.03, 0.01, 0.08, -0.03, 0.01, -0.07, -0.32, 0.01, -0.03, 0.03, 0.01, 0.08, 0.03, 0.01, -0.07, 0.32, 0.01, -0.03], 3));
    bg.setAttribute('aWing', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 1, 0, 0, 1], 1));
    bg.setAttribute('aTint', new THREE.Float32BufferAttribute([0, 0, 0, 0.5, 0.2, 0.2, 1, 0.2, 0.2, 1], 1));
    bg.setIndex([0, 1, 2, 1, 3, 2, 4, 6, 5, 7, 8, 9]);
    const home = new Float32Array(birdCount * 3), seed = new Float32Array(birdCount * 4);
    for (let i = 0; i < birdCount; i++) { const p = chosen[rng.int(0, chosen.length - 1)]; home.set([p[0], p[1] - 1.4, p[2]], i * 3); seed.set([rng(), rng(), rng(), rng()], i * 4); }
    bg.setAttribute('aHome', new THREE.InstancedBufferAttribute(home, 3)); bg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
    bg.instanceCount = birdCount;
    const bm = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, fog: true, lights: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, THREE.UniformsLib.fog, {
        uBody: { value: mixc(cGold, cCream, 0.25).multiplyScalar(0.95) }, uWingC: { value: mixc(cUmber, cBrown, 0.5) } }]),
      vertexShader: /* glsl */`
        attribute vec3 aHome; attribute vec4 aSeed; attribute float aWing, aTint;
        uniform float uTime, uBurst; varying float vTint;
        #include <common>
        #include <fog_pars_vertex>
        vec3 track(float t){
          float r = (1.2 + 3.6*aSeed.x)*(1.0 + 2.6*uBurst*aSeed.w), f = 0.55 + 0.8*aSeed.y, a = t*f + aSeed.z*6.283;
          return aHome + vec3(sin(a)*r, sin(a*2.0 + aSeed.x*5.0)*r*0.32 + 0.4 + uBurst*5.0*aSeed.w*aSeed.y, sin(a*1.31 + aSeed.y*4.0)*r*0.85); }
        void main(){
          vec3 c = track(uTime), fw = normalize(track(uTime + 0.07) - c), rt = normalize(cross(fw, vec3(0., 1., 0.))), upv = cross(rt, fw);
          float flap = sin(uTime*(24.0 + 9.0*aSeed.x) + aSeed.z*30.0);
          vec3 lp = position; lp.y += aWing*flap*0.24; lp.x *= 1.0 - aWing*0.25*abs(flap);
          vec3 wp = c + (rt*lp.x + upv*lp.y + fw*lp.z)*2.4;
          vec4 mvPosition = modelViewMatrix*vec4(wp, 1.0); vTint = aTint;
          gl_Position = projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uBody, uWingC; varying float vTint;
        #include <common>
        #include <lights_pars_begin>
        #include <fog_pars_fragment>
        ${GLSL_SCENE_LIGHT}
        void main(){
          vec3 col = mix(uBody, uWingC, vTint)*(heroAmbient() + heroSunCol()*0.8);
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    bm.uniforms.uTime = U.uTime; bm.uniforms.uBurst = U.uBurst;
    birds = new THREE.Mesh(bg, bm); birds.name = 'weavers'; birds.frustumCulled = false; object.add(birds); triangles += birdCount * 4;
  }

  await ctx.yield();
  // ----- wind-blown seeds: gold glints streaming toward the storm -----
  let seeds = null;
  {
    const COUNT = 420, sg = new THREE.InstancedBufferGeometry(), ap = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT * 4; i++) ap[i] = rng();
    sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); sg.setIndex([0, 1, 2, 1, 3, 2]);
    sg.setAttribute('aP', new THREE.InstancedBufferAttribute(ap, 4)); sg.instanceCount = COUNT;
    const sm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: mixc(cGold, cCream, 0.25) } }]),
      vertexShader: /* glsl */`
        attribute vec4 aP; uniform float uTime; uniform vec3 uWind; varying vec2 vQ; varying float vI;
        #include <common>
        #include <fog_pars_vertex>
        void main(){
          float w = aP.w; vec3 p = vec3(aP.x*150.0, 0.0, aP.z*150.0);
          p.xz += uWind.xz*uTime*(6.0 + 8.0*w); p.x += sin(uTime*0.9 + w*50.0)*1.3;
          p.xz = mod(p.xz, 150.0); float e = min(min(p.x, 150.0 - p.x), min(p.z, 150.0 - p.z)); p.xz -= 75.0;
          float hy = fract(aP.y + uTime*0.012*(w - 0.4)); p.y = 1.0 + 44.0*pow(hy, 3.0) + sin(uTime*0.7 + w*30.0)*1.2;
          float tw = pow(0.5 + 0.5*sin(uTime*(3.0 + 5.0*w) + w*90.0), 4.0);
          vQ = position.xy;
          vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
          vec3 wv = (modelViewMatrix*vec4(normalize(uWind + vec3(1e-4, 0.0, 0.0)), 0.0)).xyz;
          vec2 ax = normalize(wv.xy + vec2(1e-4, 0.0)), sd = vec2(-ax.y, ax.x);
          vI = (0.3 + 1.1*tw)*smoothstep(0.0, 14.0, e)*smoothstep(6.0, 28.0, -mvPosition.z)*(1.0 - 0.85*smoothstep(70.0, 150.0, -mvPosition.z));   // far glints would read as stars on the storm
          mvPosition.xy += ax*position.x*(0.28 + 0.5*w)*(0.35 + 0.65*length(wv.xy)) + sd*position.y*(0.05 + 0.04*w);
          gl_Position = projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; varying vec2 vQ; varying float vI;
        #include <common>
        #include <fog_pars_fragment>
        void main(){
          float a = smoothstep(1.0, 0.0, abs(vQ.y))*smoothstep(1.0, 0.25, abs(vQ.x)), ff = 0.0;
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              ff = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
            #else
              ff = smoothstep(fogNear, fogFar, vFogDepth);
            #endif
          #endif
          gl_FragColor = vec4(uCol*vI*a*(1.0 - ff), 1.0);
        }`,
    });
    sm.uniforms.uTime = U.uTime; sm.uniforms.uWind = U.uWind;
    seeds = new THREE.Mesh(sg, sm); seeds.name = 'wind-seeds'; seeds.frustumCulled = false; seeds.renderOrder = 2; object.add(seeds); triangles += COUNT * 2;
  }

  await ctx.yield();
  // ----- the double rainbow: antisolar, camera-following, drawn at the far plane behind everything solid -----
  let rainbow = null;
  if (opts.rainbow !== false) {
    const SEG = 96, rp = [], ri = [];
    for (let j = 0; j <= SEG; j++) { const a = (j / SEG) * TAU; rp.push(Math.cos(a), Math.sin(a), 0, Math.cos(a), Math.sin(a), 1); }
    for (let j = 0; j < SEG; j++) { const a = j * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
    const rm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uRainAxis: U.uRainAxis, uRainbow: U.uRainbow, uTime: U.uTime },
      vertexShader: /* glsl */`
        uniform vec3 uRainAxis; varying vec3 vDir;
        void main(){
          vec3 ax = normalize(uRainAxis), e1 = normalize(cross(vec3(0., 1., 0.), ax)), e2 = cross(ax, e1);
          float al = radians(mix(20.0, 58.0, position.z));
          vDir = ax*cos(al) + (e1*position.x + e2*position.y)*sin(al);
          vec4 cp = projectionMatrix*viewMatrix*vec4(cameraPosition + vDir*500.0, 1.0); cp.z = cp.w*0.99999; gl_Position = cp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uRainAxis; uniform float uRainbow, uTime; varying vec3 vDir;
        vec3 spec(float s){ return vec3(smoothstep(0.42, 0.78, s) + 0.4*(1.0 - smoothstep(0.0, 0.2, s)),
          smoothstep(0.12, 0.45, s)*(1.0 - smoothstep(0.62, 0.95, s)), 1.0 - smoothstep(0.22, 0.52, s)); }
        void main(){
          vec3 d = normalize(vDir); float a = degrees(acos(clamp(dot(d, normalize(uRainAxis)), -1.0, 1.0)));
          float s1 = (a - 40.2)/1.9, e1 = smoothstep(0.0, 0.18, s1)*(1.0 - smoothstep(0.82, 1.0, s1));
          float s2 = 1.0 - (a - 49.4)/4.4, e2 = smoothstep(0.0, 0.2, s2)*(1.0 - smoothstep(0.8, 1.0, s2));
          vec3 col = spec(clamp(s1, 0.0, 1.0))*e1 + spec(clamp(s2, 0.0, 1.0))*e2*0.16;
          col += vec3(0.95, 0.88, 0.7)*0.055*exp(-max(40.5 - a, 0.0)/4.5)*(1.0 - smoothstep(40.2, 41.2, a))*smoothstep(20.0, 26.0, a);
          float az = atan(d.x, d.z), rain = 0.78 + 0.22*sin(az*9.0 + uTime*0.21)*sin(az*4.0 - uTime*0.13);
          float hz = smoothstep(-0.03, 0.08, d.y)*(1.0 + 0.5*(1.0 - smoothstep(0.05, 0.4, d.y)));
          gl_FragColor = vec4(mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))), 0.12)*uRainbow*0.37*rain*hz, 1.0);
        }`,
    });
    rainbow = new THREE.Mesh(rg, rm); rainbow.name = 'double-rainbow'; rainbow.frustumCulled = false; rainbow.renderOrder = 1; object.add(rainbow); triangles += SEG * 2;
  }

  await ctx.yield();
  // ----- anchors -----
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const antiLocal = sunDir.clone().negate(), flashLocal = V(0.2, 0.35, -1).normalize();
  const apexEl = (42 * Math.PI / 180) - Math.asin(clamp(sunDir.y, -1, 1)), sh = Math.hypot(sunDir.x, sunDir.z) || 1;
  const height = top, radius = Math.max(26, Math.min(34, crownR));
  const anchors = {
    portalSeat: { position: V(FLY_X, FLY_Y, -180), facing: V(0, 0, 1), radius: 7 },
    flyThrough: [V(FLY_X, 16, 260), V(FLY_X, 13, 150), V(FLY_X, FLY_Y, 70), V(FLY_X, FLY_Y, 0), V(FLY_X, FLY_Y, -90), V(FLY_X, FLY_Y, -180)],
    clearance,
    viewpoints: { reveal: V(FLY_X, 14, 240), pass: V(FLY_X, FLY_Y, 20), under: V(-13, baseY + 4, 15) },
    crown: { position: crownC.clone(), radius: crownR },
    nests: chosen.slice(0, 24).map((p) => V(p[0], p[1] - 1.5, p[2])),
    trunkTop: V(axisAt(H)[0], baseY + H, axisAt(H)[1]),
    hollow: { position: V(Math.sin(hollow.th) * R0, baseY + hollow.h * 0.45, Math.cos(hollow.th) * R0), facing: V(Math.sin(hollow.th), 0, Math.cos(hollow.th)) },
    lowLimb: lowTip ? V(lowTip[0], lowTip[1], lowTip[2]) : null,
    termites: termites.map((p) => V(p[0], p[1], p[2])),
    sunDir: sunDir.clone(), antisolar: antiLocal.clone(),
    rainbowApex: V(-sunDir.x / sh * Math.cos(apexEl), Math.sin(apexEl), -sunDir.z / sh * Math.cos(apexEl)),
    lightning: [V(70, 0, -650), V(-150, 0, -900)],
    rise: { radius: RM, height: RISE },
  };

  const strength = opts.rainbowStrength ?? 1;
  const hero = {
    object, radius, height, center: V(0, baseY + H * 0.78, 0), anchors,
    ground: true, groundY: 0, uniforms: U, rainbow,
    stats: { triangles: Math.round(triangles), drawCalls: object.children.length, clearance },
    groundHeight: groundH,
    setProgress(u) {
      U.uBurst.value = smoothstep(0.66, 0.8, u) * (1 - 0.45 * smoothstep(0.88, 1, u));
      U.uRainbow.value = strength * (0.3 + 0.7 * smoothstep(0.3, 0.62, u));
    },
    setFlash(x, dir) { U.uFlash.value = Math.max(0, x || 0); if (dir) flashLocal.fromArray(dir.isVector3 ? dir.toArray() : dir).normalize(); },
    update(dt, time) {
      U.uTime.value = time;
      object.updateWorldMatrix(true, false);
      U.uRainAxis.value.copy(antiLocal).transformDirection(object.matrixWorld);
      U.uFlashDir.value.copy(flashLocal).transformDirection(object.matrixWorld);
    },
    dispose() {},
  };
  if (view === 'close') { hero.radius = 13; hero.height = 22; hero.center = V(0, baseY + 13, 0); }   // viewer-only framing hint
  return hero;
}
