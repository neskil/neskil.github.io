// THE CITY IN THE LAKE
// A still mountain lake on a clear morning. In the water hangs a whole evening city, upside down, that
// does not stand on the shore: real geometry mirrored under the surface and lit by its own sun (the hero,
// src/parts/city-in-the-lake.js). Above the waterline there is almost nothing: reeds, a jetty and a boat,
// bare posts, empty punts, birds, mist, poplars and snow peaks. The flight leaves the reed bay, skims out
// over the first hanging church (u 0.08), climbs to the one level view of the whole city with the campanile
// from foot to tip (0.16), swings out along the fourteen-arch bridge to the island church (0.25), comes down to
// the campanile as its pendulum's gold finial kisses the surface from beneath (0.43, seen level from 39 m),
// skims the grand canal down its middle 2.5 m above where nothing stands (the state barge ahead beside the axis),
// rises in a narrowing spiral round the basin with the glass bowl of the dome beside it (0.70 to 0.87), comes
// over its rim and dives into it to the portal in its oculus.
//
// Everything above the water is shaded by this file's own materials (no scene lights); kit: sky dome,
// cumulus field, birds, dragonflies, air particles.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField, skyDirection } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { mountains } from '../kit/terrain.js';
import { buildHero } from '../parts/city-in-the-lake.js';

const TAU = Math.PI * 2;
const HZ = 560;                      // the hero's origin (the campanile's touch point) on the course
const LAKE = { cx: 0, cz: 850, rx: 1050, rz: 800, bx: 0, bz: 45, brx: 108, brz: 132 };   // main water + the reed bay
const DURATION = 50, OLD_DUR = 46;      // OLD_DUR: what was timed on the first route keeps its seconds

// ---------------------------------------------------------------- looks: an hour above and another below
const HOURS = [
  { name: 'morning over dusk',
    up: { zenith: '#5B98D6', horizon: '#CFE4F2', el: 16, sun: '#fff1dc', sunCol: [1.42, 1.27, 1.06], amb: [0.3, 0.43, 0.64], shade: [0.17, 0.27, 0.45], haze: '#B4D0EA', hazeK: 0.00014, preset: 'day', scatter: '#ffe9c8' },
    low: { peach: '#E8935E', rose: '#F0AE98', violet: '#55447A', sun: [1.5, 0.78, 0.4], amb: [0.27, 0.17, 0.27], ambShade: [0.1, 0.085, 0.3], lit: [0.3, 0.85], barA: [1.6, 0.95, 0.6], barB: [0.3, 0.15, 0.38], glow: [1, 0.5, 0.2], moon: 0, win: '#FBE9D0' },
    post: { exposure: 1.0, tint: '#fffaf4' } },
  { name: 'noon over the blue hour',
    up: { zenith: '#3E82CC', horizon: '#BCD9F0', el: 47, sun: '#ffffff', sunCol: [1.5, 1.44, 1.32], amb: [0.36, 0.5, 0.74], shade: [0.2, 0.31, 0.52], haze: '#A8CAEA', hazeK: 0.00013, preset: 'day', scatter: '#ffffff' },
    low: { peach: '#E6966A', rose: '#6F86BE', violet: '#27336B', sun: [0.82, 0.52, 0.42], amb: [0.36, 0.43, 0.66], ambShade: [0.2, 0.26, 0.54], lit: [0.9, 1.0], barA: [1.0, 0.56, 0.5], barB: [0.07, 0.08, 0.25], glow: [1, 0.45, 0.22], moon: 1, win: '#FFB866' },
    post: { exposure: 1.06, tint: '#f8fbff' } },
  { name: 'golden evening over a lemon dawn',
    up: { zenith: '#2C5CB4', horizon: '#F0BE78', el: 11, sun: '#ffd08c', sunCol: [1.66, 1.1, 0.66], amb: [0.24, 0.34, 0.7], shade: [0.09, 0.17, 0.52], haze: '#CDB0BC', hazeK: 0.00007, preset: 'goldenHour', scatter: '#ffb860' },
    low: { peach: '#F4DE7C', rose: '#F0BE96', violet: '#6F8EB6', sun: [1.34, 1.1, 0.6], amb: [0.26, 0.34, 0.46], ambShade: [0.14, 0.22, 0.46], lit: [0.5, 0.05], barA: [1.0, 0.8, 0.44], barB: [0.38, 0.35, 0.52], glow: [1, 0.9, 0.42], moon: 0, win: '#FFF0C8' },
    post: { exposure: 0.95, tint: '#fff4e6' } },
];
const SEASONS = [
  { name: 'June', meadowA: '#5E8F3C', meadowB: '#8FB04A', larch: '#3F6B4E', spruce: '#2C5240', poplar: ['#5F8F3A', '#9DBF58'], reed: ['#55702F', '#A8B060'], plume: '#8A6A4E', snowLine: 760, flower: 1, fluff: 1 },
  { name: 'October', meadowA: '#74873E', meadowB: '#A99C48', larch: '#7E7A3A', spruce: '#3E5C3A', poplar: ['#C9982A', '#F0CF52'], reed: ['#8A7A3C', '#D2B870'], plume: '#9A7A58', snowLine: 620, flower: 0, fluff: 0 },
  { name: 'snow', meadowA: '#C8D2DE', meadowB: '#E2E6EA', larch: '#356458', spruce: '#24524A', poplar: ['#8E9A9A', '#C9D2D4'], reed: ['#9A8E62', '#DACFA6'], plume: '#B8A888', snowLine: -60, flower: 0, fluff: 0, snowy: 1 },
];
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// ---------------------------------------------------------------- the lake's outline
function makeLakeDist(noise) {
  const ell = (x, z, cx, cz, rx, rz) => { const dx = x - cx, dz = z - cz, k = Math.hypot(dx / rx, dz / rz), l = Math.hypot(dx, dz); return k < 1e-4 ? -Math.min(rx, rz) : l * (1 - 1 / k); };
  // signed metres to the shore: negative on the water
  return (x, z) => {
    const a = ell(x, z, LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz), b = ell(x, z, LAKE.bx, LAKE.bz, LAKE.brx, LAKE.brz);
    const h = clamp(0.5 + 0.5 * (b - a) / 40, 0, 1), d = lerp(b, a, h) - 40 * h * (1 - h);
    return d + 16 * noise.n2(x * 0.0035 + 4.1, z * 0.0035 - 2.3) + 4 * noise.n2(x * 0.017, z * 0.017 + 9);
  };
}

// ---------------------------------------------------------------- GLSL shared by everything above the water
const GLSL_N = /* glsl */`
float lh21(vec2 p){ p = fract(p*vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float lvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(lh21(i), lh21(i + vec2(1., 0.)), f.x), mix(lh21(i + vec2(0., 1.)), lh21(i + vec2(1., 1.)), f.x), f.y); }
float lfbm(vec2 p){ return lvn(p)*.5 + lvn(p*2.03 + 7.1)*.28 + lvn(p*4.1 + 3.3)*.15 + lvn(p*8.3 + 1.7)*.07; }
`;
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyAmb, uShade, uHaze;
uniform float uHazeK, uTime;
vec3 hazed(vec3 col, float dist, float y){
  float f = 1. - exp(-dist*uHazeK*(1.25 - .5*clamp(y/900., 0., 1.)));
  return mix(col, uHaze, clamp(f, 0., 1.));
}
`;
// kinds (aW.z): 0 matte, 1 plume / translucent, 2 wood, 3 feather, 4 foliage that flickers, 5 glint (dew)
const ABOVE_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aW;
uniform float uTime, uPx; uniform vec2 uWind; uniform vec4 uBob;
varying vec3 vCol, vN, vWp, vOp; varying vec4 vW;
void main(){
  vec3 p = position, n = normal; vOp = position;
  #ifdef USE_INSTANCING
    p = (instanceMatrix*vec4(p, 1.)).xyz; n = mat3(instanceMatrix)*n;
  #endif
  vec4 wp = modelMatrix*vec4(p, 1.); vec3 wn = mat3(modelMatrix)*n;
  vCol = color;
  #ifdef USE_INSTANCING_COLOR
    vCol *= instanceColor;
  #endif
  float sw = aW.x;
  if (sw > 0.) {
    float g = sin(uTime*1.1 + wp.x*.09 + wp.z*.13) + .55*sin(uTime*2.7 + aW.y*6.283 + wp.x*.37);
    wp.xz += uWind*(sw*sw*(.02 + .013*g));
    wp.y -= sw*sw*.004*(1. + g);
  }
  if (aW.w != 0.) {                                  // a ribbon turned to the lens, never thinner than ~1.6 px
    vec3 tc = cameraPosition - wp.xyz; float d = length(tc);
    vec2 rv = vec2(tc.z, -tc.x); rv /= max(length(rv), 1e-3);
    wp.xz += rv*sign(aW.w)*max(abs(aW.w), d*uPx*.8);
    float a = aW.y*6.283; wn = vec3(cos(a), .55, sin(a));
  }
  #ifdef MIRROR
    float dep = max(wp.y, 0.);
    wp.x += sin(uTime*1.5 + wp.z*1.3 + dep*2.4)*.03*dep; wp.z += cos(uTime*1.2 + wp.x*1.1 + dep*1.9)*.025*dep;
    wp.y = -wp.y*.96; wn.y = -wn.y;
  #endif
  vWp = wp.xyz; vN = wn; vW = aW;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const ABOVE_FRAG = /* glsl */`
varying vec3 vCol, vN, vWp, vOp; varying vec4 vW;
uniform vec3 uMirror;
${GLSL_LIGHT}
${GLSL_N}
void main(){
  vec3 N = vN/max(length(vN), 1e-4);
  vec3 V = cameraPosition - vWp; float dist = length(V); V /= max(dist, 1e-3);
  float kind = vW.z;
  #ifndef MIRROR
  if (kind < 3.5 && vW.w == 0. && dot(N, V) < 0.) N = -N;
  #endif
  vec3 alb = vCol;
  float nl = dot(N, uSunDir), sun = smoothstep(-.12, .7, nl), tr = 0., gl = 0.;
  if (kind > .5 && kind < 1.5) {                     // plumes and petals: light comes through them
    float back = max(dot(-V, uSunDir), 0.); tr = .1 + .6*back*back; sun = max(sun, .4);
  } else if (kind > 1.5 && kind < 2.5) {             // weathered wood
    float g1 = lvn(vec2(dot(vOp.xz, vec2(.73, .68))*26., vOp.y*2.2)), g2 = lvn(vOp.xz*3.1 + vOp.y*.7);
    alb *= .7 + .34*g1 + .2*g2;
    alb = mix(alb, alb*vec3(.5, .62, .5), (1. - smoothstep(.05, .5, abs(vWp.y)))*.7);
  } else if (kind > 2.5 && kind < 3.5) {             // feathers: soft wrap
    sun = smoothstep(-.5, .8, nl);
  } else if (kind > 3.5 && kind < 4.5) {             // poplar leaves, every one flickering
    float fl = lvn(vWp.xz*.8 + vec2(vWp.y*1.1, uTime*1.7)), f2 = lvn(vWp.xy*1.9 + vec2(uTime*2.6, vWp.z*1.4));
    alb *= .62 + .5*fl + .32*f2*f2;
    sun = smoothstep(-.45, .65, nl); tr = .22*max(dot(-V, uSunDir), 0.);
    gl = smoothstep(.83, .98, f2*fl*1.7)*.5*sun;
  } else if (kind > 5.5) {                           // the dark body of a reed bed: streaks, never a slab
    float st = lvn(vWp.xz*vec2(5., 5.)), s2 = lvn(vWp.xz*.9 + 7.);
    if (abs(vWp.y) < .1 + .5*st*s2) discard;         // a ragged edge, not the grid it is built on
    alb *= (.6 + 1.1*st*st)*(.75 + .7*s2);
  } else if (kind > 4.5) {                           // dew
    float tw = sin(uTime*(2.3 + vW.y*3.) + vW.y*71.);
    gl = smoothstep(.93, 1., tw)*1.6*step(.72, fract(vW.y*17.3));
  }
  vec3 col = alb*(uSunCol*sun + mix(uShade, uSkyAmb, N.y*.5 + .5)) + alb*uSunCol*tr + uSunCol*gl;
  #ifdef MIRROR
    col = col*uMirror + uMirror*vec3(.012, .01, .02);
  #endif
  gl_FragColor = vec4(hazed(col, dist, vWp.y), 1.);
}`;

// ---------------------------------------------------------------- a small mesh builder
class G {
  constructor() { this.p = []; this.n = []; this.c = []; this.w = []; this.i = []; this.nv = 0; }
  v(x, y, z, nx, ny, nz, col, w) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); this.w.push(w[0] || 0, w[1] || 0, w[2] || 0, w[3] || 0); return this.nv++; }
  tri(a, b, c, col, w, cb, cc) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, col, w), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, cb || col, w), i2 = this.v(c[0], c[1], c[2], nx, ny, nz, cc || col, w);
    this.i.push(i0, i1, i2);
  }
  quad(a, b, c, d, col, w, col2) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const c2 = col2 || col;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, col, w), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, col, w), i2 = this.v(c[0], c[1], c[2], nx, ny, nz, c2, w), i3 = this.v(d[0], d[1], d[2], nx, ny, nz, c2, w);
    this.i.push(i0, i1, i2, i0, i2, i3);
  }
  box(x0, y0, z0, x1, y1, z1, col, w, faces = 'xXyYzZ') {
    if (faces.includes('Y')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, w);
    if (faces.includes('y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, w);
    if (faces.includes('Z')) this.quad([x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1], col, w);
    if (faces.includes('z')) this.quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], col, w);
    if (faces.includes('X')) this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], col, w);
    if (faces.includes('x')) this.quad([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], col, w);
  }
  // a tube lofted along points [[x,y,z],...] with radii [r,...] (or one number); smooth normals; col may be a function of t
  tube(pts, rad, sides, col, w, squash = 1) {
    const rows = [], n = pts.length;
    for (let k = 0; k < n; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let ux = Math.abs(ty) > 0.9 ? 1 : 0, uy = Math.abs(ty) > 0.9 ? 0 : 1, uz = 0;
      let sx = uy * tz - uz * ty, sy = uz * tx - ux * tz, sz = ux * ty - uy * tx; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      ux = ty * sz - tz * sy; uy = tz * sx - tx * sz; uz = tx * sy - ty * sx;
      const r = typeof rad === 'number' ? rad : rad[k], cc = typeof col === 'function' ? col(k / (n - 1)) : col, row = [];
      for (let s = 0; s < sides; s++) {
        const an = s / sides * TAU, cs = Math.cos(an) * squash, sn = Math.sin(an), nx = sx * cs + ux * sn, ny = sy * cs + uy * sn, nz = sz * cs + uz * sn;
        row.push(this.v(pts[k][0] + nx * r, pts[k][1] + ny * r, pts[k][2] + nz * r, nx, ny, nz, cc, w));
      }
      rows.push(row);
    }
    for (let k = 0; k < n - 1; k++) for (let s = 0; s < sides; s++) {
      const a = rows[k][s], b = rows[k][(s + 1) % sides], c = rows[k + 1][(s + 1) % sides], d = rows[k + 1][s];
      this.i.push(a, c, b, a, d, c);
    }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 4));
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
  async geometryAsync(ctx) {                    // the same, a loading step per attribute
    const g = new THREE.BufferGeometry();
    for (const [name, arr, size] of [['position', this.p, 3], ['normal', this.n, 3], ['color', this.c, 3], ['aW', this.w, 4]]) { g.setAttribute(name, new THREE.Float32BufferAttribute(arr, size)); await ctx.yield(); }
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    await ctx.yield();
    return g;
  }
}
function aboveMaterial(LU, extra = {}) {
  const { defines = {}, ...rest } = extra;
  return new THREE.ShaderMaterial({ uniforms: LU, vertexShader: ABOVE_VERT, fragmentShader: ABOVE_FRAG, side: THREE.DoubleSide, defines, ...rest });
}

// ---------------------------------------------------------------- shore, meadow, larch slopes, snow peaks
const TERRAIN_VERT = /* glsl */`
attribute float aD;
varying vec3 vWp, vN; varying float vD;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz; vN = normal; vD = aD; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const TERRAIN_FRAG = /* glsl */`
varying vec3 vWp, vN; varying float vD;
uniform vec3 uMeadowA, uMeadowB, uLarch, uSpruce, uReedCol; uniform float uSnowLine, uFlower, uTreeLine, uSnowy;
${GLSL_LIGHT}
${GLSL_N}
void main(){
  vec3 N = vN/max(length(vN), 1e-4);
  float dist = distance(cameraPosition, vWp), h = vWp.y; vec2 xz = vWp.xz;
  float n1 = lfbm(xz*.0037), n2 = lfbm(xz*.027), n3 = lvn(xz*.31), n4 = lfbm(xz*.0105 + 17.);
  float lod = smoothstep(400., 2200., dist);
  n2 = mix(n2, lfbm(xz*.0062 + 3.1), lod); n3 = mix(n3, .5, lod);
  float sl = uSnowLine + (n1 - .5)*230.;
  float snowP = smoothstep(sl - 30., sl + 100., h + (n2 - .5)*130.);
  vec3 Nd = N + vec3(n2 - .5, 0., lfbm(xz*mix(.027, .0062, lod) + 31.7) - .5)*(.5 + .4*smoothstep(150., 900., vD))*(1. - .7*snowP);
  Nd /= max(length(Nd), 1e-4);
  float slope = 1. - Nd.y;
  vec3 meadow = mix(uMeadowA, uMeadowB, smoothstep(.3, .7, n2))*(.84 + .32*n3*(1. - lod));
  float butter = uFlower*smoothstep(.5, .72, n4)*(.4 + .6*lvn(xz*.8));
  meadow = mix(meadow, vec3(.86, .7, .1), butter*.6);
  meadow = mix(meadow, uReedCol*(.7 + .5*lvn(xz*vec2(1.7, .9))), (1. - smoothstep(1., 10., vD + n3*4.))*.85);
  float fm = smoothstep(110., 300., vD + n1*170.)*(1. - smoothstep(uTreeLine - 90., uTreeLine + 60., h + (n2 - .5)*230.))*mix(smoothstep(.3, .46, n4 + .25*n1), 1., smoothstep(50., 210., h + (n1 - .5)*90.));
  float crown = mix(lvn(xz*.11)*.55 + lvn(xz*.29)*.45, .35 + .3*lvn(xz*.012), lod);
  vec3 wood = mix(uLarch, uSpruce, smoothstep(.36, .64, .3*lfbm(xz*.0125 + 5.3) + .7*(1. - smoothstep(130., 400., h + (n1 - .5)*120.)) + .2*(n1 - .5)));   // spruce below, larch in a band above
  vec3 alb = mix(meadow, mix(wood*(.45 + 1.0*crown), vec3(.6, .64, .72), uSnowy*(.3 + .35*crown)), fm);   // snow-dusted in winter
  vec3 rock = mix(vec3(.25, .27, .33), vec3(.46, .43, .42), n2)*(.8 + .4*n3)*mix(vec3(1.), vec3(.62, .74, 1.), uSnowy);
  alb = mix(alb, rock, max(smoothstep(.2, .4, slope)*(1. - .55*fm), smoothstep(uTreeLine, uTreeLine + 170., h + (n2 - .5)*160.)*.8));
  float snow = snowP*(1. - smoothstep(mix(.5, .26, uSnowy), mix(.8, .6, uSnowy), slope))*(1. - mix(.5, .92, uSnowy)*fm);
  alb = mix(alb, mix(vec3(.74, .745, .75), vec3(.72, .73, .78), uSnowy), snow);
  float nl = dot(Nd, uSunDir), sun = smoothstep(-.04, mix(.42, .3, uSnowy), nl);
  sun *= mix(.3, .12, uSnowy) + mix(.7, .88, uSnowy)*smoothstep(mix(-.12, -.02, uSnowy), mix(.4, .26, uSnowy), dot(N, uSunDir));           // whole faces turn to the light or away from it
  vec3 col = alb*(uSunCol*sun*.95 + mix(uShade, uSkyAmb, Nd.y*.5 + .5)*.8);
  gl_FragColor = vec4(hazed(col, dist, h), 1.);
}`;
async function buildTerrain(ctx, lakeD, LU, season, sunAz) {
  const noise = ctx.noise;
  const mtn = mountains({ noise, height: 1250, scale: 1500, octaves: 5, ridge: 0.7 });
  const H = (x, z, d) => {
    if (d < 0) return Math.max(-10, d * 0.7) - 0.25;
    const meadow = 0.35 + d * 0.014 + 1.4 * smoothstep(20, 160, d) * (0.5 + 0.5 * noise.n2(x * 0.012, z * 0.012));
    const hills = 46 * smoothstep(90, 600, d) * (0.5 + 0.5 * noise.fbm2(x * 0.0021 + 3, z * 0.0021, 3));
    let da = Math.atan2(z - LAKE.cz, x - LAKE.cx) - sunAz; da = Math.atan2(Math.sin(da), Math.cos(da));
    const pass = 1 - 0.84 * Math.exp(-(da * da) / 0.2);                     // a low saddle where the sun stands
    return meadow + hills + Math.pow(smoothstep(140, 2100, d), 1.25) * (mtn(x, z) * pass + 170);
  };
  const NA = 300, NR = 47;
  const dens = (th) => { let d = th + Math.PI / 2; d = Math.atan2(Math.sin(d), Math.cos(d)); return 1 + 7 * Math.exp(-(d / 0.17) * (d / 0.17)); };
  const cum = [0], SN = 1440; for (let k = 0; k < SN; k++) cum.push(cum[k] + dens(-Math.PI + (k + 0.5) / SN * TAU));
  const thetas = []; { let k = 0; for (let i = 0; i <= NA; i++) { const t = i / NA * cum[SN]; while (k < SN - 1 && cum[k + 1] < t) k++; thetas.push(-Math.PI + (k + (t - cum[k]) / (cum[k + 1] - cum[k])) / SN * TAU); } }
  const S = [0]; { let st = 5; while (S.length <= NR) { S.push(S[S.length - 1] + st); st = Math.min(st * 1.25, 118); } }
  const shoreR = (th) => { const c = Math.cos(th), s = Math.sin(th); let r = 500; while (r < 1400 && lakeD(LAKE.cx + c * r, LAKE.cz + s * r) < 0) r += 6; return r; };
  const nv = (NA + 1) * (NR + 1), pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), aD = new Float32Array(nv);
  for (let i = 0; i <= NA; i++) {
    const th = thetas[i === NA ? 0 : i], c = Math.cos(th), s = Math.sin(th), r0 = shoreR(th) - 22;
    for (let j = 0; j <= NR; j++) {
      const r = r0 + S[j], x = LAKE.cx + c * r, z = LAKE.cz + s * r, d = lakeD(x, z), o = (i * (NR + 1) + j);
      pos[o * 3] = x; pos[o * 3 + 1] = H(x, z, d); pos[o * 3 + 2] = z; aD[o] = d;
    }
    if (i % 10 === 9) await ctx.yield();
  }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3(), idx = [];
  const P = (i, j, out) => { const o = (((i + NA) % NA) * (NR + 1) + clamp(j, 0, NR)) * 3; return out.set(pos[o], pos[o + 1], pos[o + 2]); };
  for (let i = 0; i <= NA; i++) for (let j = 0; j <= NR; j++) {
    P(i + 1, j, a).sub(P(i - 1, j, n)); P(i, j + 1, b).sub(P(i, j - 1, n)); n.crossVectors(b, a).normalize(); if (n.y < 0) n.negate();
    const o = (i * (NR + 1) + j) * 3; nor[o] = n.x; nor[o + 1] = n.y; nor[o + 2] = n.z;
  }
  await ctx.yield();
  for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) { const p = i * (NR + 1) + j, q = p + NR + 1; idx.push(p, p + 1, q + 1, p, q + 1, q); }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aD', new THREE.BufferAttribute(aD, 1)); g.setIndex(idx);
  const U = { ...LU, uMeadowA: { value: new THREE.Color(season.meadowA) }, uMeadowB: { value: new THREE.Color(season.meadowB) }, uLarch: { value: new THREE.Color(season.larch) }, uSpruce: { value: new THREE.Color(season.spruce) },
    uReedCol: { value: new THREE.Color(season.reed[0]) }, uSnowLine: { value: season.snowLine }, uFlower: { value: season.flower }, uTreeLine: { value: 500 }, uSnowy: { value: season.snowy ? 1 : 0 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG, side: THREE.DoubleSide }));
  mesh.frustumCulled = false;
  return { mesh, H: (x, z) => H(x, z, lakeD(x, z)), shoreR };
}

// ---------------------------------------------------------------- Lombardy poplars in rows on the shore
async function buildPoplars(ctx, rng, lakeD, terr, LU, season, count) {
  const g = new G(), SIDES = 7, RINGS = 8, cA = lin(season.poplar[0]), cB = lin(season.poplar[1]);
  const prof = (t) => 0.115 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, 0.62))), 0.8);   // of the height
  const rows = [];
  for (let k = 0; k <= RINGS; k++) {
    const t = k / RINGS, y = 0.1 + 0.9 * t, row = [];
    for (let s = 0; s < SIDES; s++) {
      const an = (s + 0.5 * (k % 2)) / SIDES * TAU, r = prof(t) * (0.72 + 0.56 * rng()) + (k === RINGS ? 0 : 0.012);
      const col = mulc(mixc(cA, cB, clamp(t * 0.8 + rng() * 0.35, 0, 1)), 0.55 + 0.45 * t);
      row.push(g.v(Math.cos(an) * r, y, Math.sin(an) * r, Math.cos(an), 0.35, Math.sin(an), col, [y, 0, 4, 0]));
    }
    rows.push(row);
  }
  for (let k = 0; k < RINGS; k++) for (let s = 0; s < SIDES; s++) { const a = rows[k][s], b = rows[k][(s + 1) % SIDES], c = rows[k + 1][(s + 1) % SIDES], d = rows[k + 1][s]; g.i.push(a, b, c, a, c, d); }
  g.box(-0.012, 0, -0.012, 0.012, 0.16, 0.012, [0.2, 0.17, 0.14], [0, 0, 0, 0], 'xXzZ');
  const geo = g.geometry();
  { const w = geo.attributes.aW; for (let k = 0; k < w.count; k++) w.setX(k, w.getX(k) * 2.2); }   // sway weight for a unit tree
  const pts = [], row = (th0, n, off) => {
    for (let k = 0; k < n && pts.length < count; k++) {
      const r = terr.shoreR(th0) , th = th0 + k * 9.5 / r, rr = terr.shoreR(th) + off + rng.range(-1.5, 1.5);
      const x = LAKE.cx + Math.cos(th) * rr, z = LAKE.cz + Math.sin(th) * rr;
      pts.push([x, terr.H(x, z), z, rng.range(36, 50)]);
    }
  };
  for (const s of [-1, 1]) { row(-Math.PI / 2 + s * 0.19, 9, 16); row(-Math.PI / 2 + s * 0.30, 12, 18); await ctx.yield(); row(-Math.PI / 2 + s * 0.52, 10, 15); await ctx.yield(); }
  for (let guard = 0; pts.length < count && guard < 400; guard++) { const th = rng() * TAU, n = rng.int(5, 15), off = rng.range(12, 30); row(th, n, off); if (rng.chance(0.35)) row(th + 0.004, n - 2, off + 11); await ctx.yield(); }
  const mesh = new THREE.InstancedMesh(geo, aboveMaterial(LU), pts.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (let k = 0; k < pts.length; k++) {
    const [x, y, z, h] = pts[k]; e.set(rng.range(-0.03, 0.03), rng() * TAU, rng.range(-0.03, 0.03)); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y - 0.4, z), q, new THREE.Vector3(h * rng.range(0.85, 1.2), h, h * rng.range(0.85, 1.2))); mesh.setMatrixAt(k, m);
    const v = rng.range(0.8, 1.15); c.setRGB(v * rng.range(0.92, 1.08), v, v * rng.range(0.85, 1.05)); mesh.setColorAt(k, c);
  }
  mesh.frustumCulled = false;
  return mesh;
}

// Tileable fbm for the kit's cumulus (R, G and two shifted copies), made here so that it is a loading step of its own.
function cloudNoise(rng, size = 128) {
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)], i0 = new Int32Array(size), i1 = new Int32Array(size), w = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
    const lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rng();
    for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; i0[x] = i % per; i1[x] = (i + 1) % per; w[x] = t * t * (3 - 2 * t); }
    for (let y = 0, p = 0; y < size; y++) for (let x = 0; x < size; x++, p++) {
      const a = lat[i0[y] * per + i0[x]], b = lat[i0[y] * per + i1[x]], c = lat[i1[y] * per + i0[x]], d = lat[i1[y] * per + i1[x]], ab = a + (b - a) * w[x];
      f[ch][p] += amp * (ab + (c + (d - c) * w[x] - ab) * w[y]);
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1, px = (v) => clamp(((v / norm - 0.5) * 1.75 + 0.5) * 255, 0, 255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const p = y * size + x, s1 = ((y + 45) & m) * size + ((x + 75) & m), s2 = ((y + 17) & m) * size + ((x + 101) & m);
    data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s1]); data[p * 4 + 3] = px(f[0][s2]);
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- mist: bands lying on the far water, streamers lifting off it
const MIST_VERT = /* glsl */`
attribute vec4 aPos; attribute vec4 aDim;      // aPos: base centre xyz + seed; aDim: width, height, kind (0 band, 1 streamer), opacity
uniform float uTime; varying vec2 vUv; varying vec4 vDim; varying float vSeed, vDist; varying vec3 vWp;
void main(){
  vec3 c = aPos.xyz; c.xz += vec2(.55, .2)*uTime*(.4 + .6*fract(aPos.w*7.3));
  vec3 tc = cameraPosition - c; vec2 rv = vec2(tc.z, -tc.x); rv /= max(length(rv), 1e-3);
  float lean = aDim.z*uv.y*uv.y*aDim.y*.35;
  vec3 wp = c + vec3(rv.x, 0., rv.y)*((uv.x - .5)*aDim.x) + vec3(lean, uv.y*aDim.y, lean*.3);
  vUv = uv; vDim = aDim; vSeed = aPos.w; vDist = length(tc); vWp = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const MIST_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vDim; varying float vSeed, vDist; varying vec3 vWp;
uniform float uMistAmt;
${GLSL_LIGHT}
${GLSL_N}
void main(){
  float asp = vDim.x/max(vDim.y, 1.);
  vec2 q = vec2(vUv.x*asp*1.3 + vSeed*31., vUv.y*1.6 + vSeed*17.);
  float rise = mix(.012, .06, vDim.z);
  float n = lfbm(q + vec2(uTime*.013, -uTime*rise)), n2 = lvn(q*3.1 + vec2(-uTime*.02, -uTime*rise*2.));
  float ex = abs(vUv.x - .5)*2.;
  float m = (1. - smoothstep(.35, 1., ex))*smoothstep(0., .1, vUv.y)*(1. - smoothstep(.25, 1., vUv.y + (1. - n)*.35));
  m = mix(m, m*smoothstep(.25, .75, n + n2*.3)*(1. - smoothstep(.1, .6, ex)), vDim.z);
  float a = m*smoothstep(.34, .62, n*.8 + n2*.25)*vDim.w*uMistAmt*1.25;     // streamers with an edge, not a veil
  a *= smoothstep(40., 240., vDist)*(1. - smoothstep(4200., 5600., vDist));
  vec3 col = mix(uSkyAmb*.9 + uSunCol*.25, uSunCol*.62 + uSkyAmb*.3, clamp(n*.9 + vUv.y*.45, 0., 1.));
  col = max(mix(col, vec3(dot(col, vec3(.3333)))*vec3(.96, .98, 1.06), .6), vec3(.6, .64, .72));      // white streamers at every hour
  col = hazed(col, vDist*.6, vWp.y);
  gl_FragColor = vec4(col*a, a);
}`;
async function buildMist(ctx, rng, lakeD, terr, path, LU, count, amount) {
  const base = new THREE.PlaneGeometry(1, 1); base.translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const aPos = [], aDim = [];
  for (let k = 0, guard = 0; k < count && guard < count * 40; guard++) {
    if (guard % 40 === 39) await ctx.yield();
    const kind = k % 7 === 3 ? 1 : 0, land = kind === 0 && k % 4 === 0;
    const th = rng() * TAU, rr = land ? rng.range(1100, 2600) : Math.sqrt(rng()) * 1050, x = LAKE.cx + Math.cos(th) * rr * (land ? 1 : 1.0), z = LAKE.cz + Math.sin(th) * rr * (land ? 1 : 0.78);
    const d = lakeD(x, z), pd = path.nearestXZ(x, z).dist;
    if (land ? d < 60 : (d > -40 || pd < (kind ? 170 : 260))) continue;
    if (kind) { aPos.push(x, -2, z, rng()); aDim.push(rng.range(90, 190), rng.range(60, 130), 1, rng.range(0.22, 0.36)); }
    else if (land) { aPos.push(x, terr.H(x, z) - 14, z, rng()); aDim.push(rng.range(500, 1100), rng.range(60, 130), 0, rng.range(0.4, 0.62)); }
    else { aPos.push(x, -1.5, z, rng()); aDim.push(rng.range(200, 520), rng.range(11, 30), 0, rng.range(0.34, 0.6)); }
    k++;
  }
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(aPos), 4)); g.setAttribute('aDim', new THREE.InstancedBufferAttribute(new Float32Array(aDim), 4));
  g.instanceCount = aPos.length / 4;
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uMistAmt: { value: amount } }, vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 6;
  base.dispose();
  return mesh;
}

// ---------------------------------------------------------------- the other sky as a real dome, for the dive only
function buildLowerDome(hero) {
  const g = new THREE.SphereGeometry(2600, 32, 12, 0, TAU, Math.PI / 2, Math.PI / 2);       // lower hemisphere only
  const mat = new THREE.ShaderMaterial({ uniforms: hero.uniforms, depthWrite: false, depthTest: false, side: THREE.BackSide,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position, 1.); }`,
    fragmentShader: /* glsl */`varying vec3 vDir;
${hero.glsl.uniforms}
${hero.glsl.noise}
${hero.glsl.lowerSky}
void main(){ vec3 d = vDir/max(length(vDir), 1e-3); gl_FragColor = vec4(lowerSky(normalize(vec3(d.x, max(-d.y, 0.) + .004, d.z))), 1.); }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 1; mesh.visible = false;
  return mesh;
}

// ---------------------------------------------------------------- the reed bay
// Channel 15 m wide down the course; beds either side. Returns geometry for the stems, the dark mass under
// them, and the subset by the channel that is drawn again upside down (here the mirror is true).
function reedLayout(noise, lakeD) {
  const ch = (z) => 7.7 + 1.5 * noise.n2(z * 0.07, 3.3);
  const wid = (z, s) => (20 + 26 * (0.5 + 0.5 * noise.n2(z * 0.028, s * 7.1))) * smoothstep(118, 62, z) * smoothstep(-62, -36, z);
  // metres inside the bed (<= 0 outside)
  const inside = (x, z) => {
    const s = x >= 0 ? 1 : -1, ax = Math.abs(x), c = ch(z), w = wid(z, s);
    if (w < 1 || lakeD(x, z) > -3) return 0;
    let e = Math.min(ax - c, c + w - ax);
    if (z > 62) e -= 5.5 * smoothstep(62, 110, z) * (0.5 + 0.5 * noise.n2(x * 0.11, z * 0.11));   // breaks into clumps
    return e;
  };
  return { ch, wid, inside };
}
async function buildReeds(ctx, rng, RL, season, count, flowers) {
  const g = new G(), gm = new G(), mass = new G();
  const cRoot = mulc(lin(season.reed[0]), 0.5), cMid = lin(season.reed[0]), cTip = lin(season.reed[1]), cPl = mulc(lin(season.plume), 0.7), cPlL = mulc(mixc(lin(season.plume), [0.8, 0.7, 0.52], 0.4), 0.78);
  const stem = (o, x, z, h, ph) => {
    const la = rng() * TAU, lean = rng.range(0.05, 0.3), lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
    const P = [[x, 0, z], [x + lx * 0.4 * h, 0.55 * h, z + lz * 0.4 * h], [x + lx * h, h, z + lz * h]], W = [0.02, 0.016, 0.009], C = [cRoot, cMid, mixc(cMid, cTip, 0.6)];
    let pa = -1, pb = -1;
    for (let k = 0; k < 3; k++) {
      const a = o.v(P[k][0], P[k][1], P[k][2], 0, 1, 0, C[k], [P[k][1], ph, 0, -W[k]]), b = o.v(P[k][0], P[k][1], P[k][2], 0, 1, 0, C[k], [P[k][1], ph, 0, W[k]]);
      if (k > 0) o.i.push(pa, pb, b, pa, b, a);
      pa = a; pb = b;
    }
    const t = P[2], ph2 = (ph + 0.37) % 1, pl = rng.range(0.34, 0.56);                      // the plume
    const i0 = o.v(t[0], t[1] - 0.03, t[2], 0, 1, 0, cPl, [h, ph2, 1, -0.008]), i1 = o.v(t[0] + lx * 0.08, t[1] + pl * 0.4, t[2] + lz * 0.08, 0, 1, 0, cPlL, [h + 0.2, ph2, 1, -0.04]);
    const i2 = o.v(t[0] + lx * 0.08, t[1] + pl * 0.4, t[2] + lz * 0.08, 0, 1, 0, cPlL, [h + 0.2, ph2, 1, 0.04]), i3 = o.v(t[0] + lx * 0.3, t[1] + pl, t[2] + lz * 0.3, 0, 1, 0, cPlL, [h + 0.45, ph2, 1, 0.006]);
    o.i.push(i0, i1, i2, i1, i3, i2);
    const nl = rng() < 0.6 ? 2 : 1;                                                          // leaves
    for (let k = 0; k < nl; k++) {
      const f = rng.range(0.3, 0.72), by = f * h, bx = x + lx * f * h * 0.6, bz = z + lz * f * h * 0.6, a = rng() * TAU, ln = rng.range(0.55, 1.05);
      const dew = rng() < 0.35 ? 5 : 0, cl = mixc(cMid, cTip, rng() * 0.5);
      const a0 = o.v(bx, by, bz, 0, 1, 0, cl, [by, ph, dew, -0.017]), a1 = o.v(bx, by + 0.02, bz, 0, 1, 0, cl, [by, ph, dew, 0.017]);
      const a2 = o.v(bx + Math.cos(a) * ln, by + ln * rng.range(0.05, 0.5), bz + Math.sin(a) * ln, Math.cos(a) * 0.3, 0.9, Math.sin(a) * 0.3, mulc(cTip, 1.05), [by + ln * 0.7, ph, dew, 0.004]);
      o.i.push(a0, a1, a2);
    }
  };
  const iris = (o, x, z) => {
    const h = rng.range(0.7, 1.05), ph = rng(), cy = [0.82, 0.6, 0.05], cg = mulc(cMid, 1.1);
    const a = o.v(x, 0, z, 0, 1, 0, cg, [0, ph, 0, -0.014]), b = o.v(x, 0, z, 0, 1, 0, cg, [0, ph, 0, 0.014]), c = o.v(x, h, z, 0, 1, 0, cg, [h * 0.7, ph, 0, -0.01]), d = o.v(x, h, z, 0, 1, 0, cg, [h * 0.7, ph, 0, 0.01]);
    o.i.push(a, b, d, a, d, c);
    for (let k = 0; k < 3; k++) {
      const an = k / 3 * TAU + ph * 6, cx = Math.cos(an), sz = Math.sin(an), w = [h * 0.7, ph, 1, 0];
      o.tri([x, h, z], [x + cx * 0.16 - sz * 0.06, h + 0.05, z + sz * 0.16 + cx * 0.06], [x + cx * 0.2, h - 0.1, z + sz * 0.2], cy, w, cy, mulc(cy, 0.8));
      o.tri([x, h, z], [x + cx * 0.2, h - 0.1, z + sz * 0.2], [x + cx * 0.16 + sz * 0.06, h + 0.05, z + sz * 0.16 - cx * 0.06], cy, w, mulc(cy, 0.8), cy);
      o.tri([x, h, z], [x - cx * 0.05 - sz * 0.03, h + 0.16, z - sz * 0.05 + cx * 0.03], [x - cx * 0.05 + sz * 0.03, h + 0.16, z - sz * 0.05 - cx * 0.03], cy, w, [0.9, 0.74, 0.2], [0.9, 0.74, 0.2]);
    }
  };
  const fill = (o, x, z, h, ph) => {                   // plain stems to thicken the interior
    const lx = rng.range(-0.25, 0.25) * h, lz = rng.range(-0.25, 0.25) * h, ct = mixc(cMid, cTip, 0.3 + 0.5 * rng());
    const a = o.v(x, 0, z, 0, 1, 0, cRoot, [0, ph, 0, -0.03]), b = o.v(x, 0, z, 0, 1, 0, cRoot, [0, ph, 0, 0.03]), c = o.v(x + lx, h, z + lz, 0, 1, 0, ct, [h, ph, 0, -0.012]), d = o.v(x + lx, h, z + lz, 0, 1, 0, ct, [h, ph, 0, 0.012]);
    o.i.push(a, b, d, a, d, c);
  };
  for (let n = 0, N = Math.round(count * 0.75), guard = 0; n < N && guard < N * 8; guard++) {
    const z = rng.range(-58, 116), s = rng.sign(), w = RL.wid(z, s); if (w < 1) continue;
    const x = s * (RL.ch(z) + rng() * w); if (RL.inside(x, z) <= 0.2) continue;
    fill(g, x, z, rng.range(1.5, 2.5), rng()); n++;
    if (n % 300 === 0) await ctx.yield();
  }
  await ctx.yield();
  for (let n = 0, guard = 0; n < count && guard < count * 12; guard++) {
    const z = rng.range(-58, 116), s = rng.sign(), c = RL.ch(z), w = RL.wid(z, s);
    if (w < 1) continue;
    const edge = rng() < 0.62, off = edge ? Math.pow(rng(), 1.6) * Math.min(9, w) : rng() * w, x = s * (c + off), e = RL.inside(x, z);
    if (e <= 0 && !(edge && off < 0.6 && e > -1)) continue;
    const h = rng.range(2.0, 2.85) * (0.82 + 0.18 * smoothstep(0, 2.5, off)), ph = rng();
    stem(g, x, z, h, ph);
    if (off < 6.5 && z > 4 && rng() < 0.75) stem(gm, x, z, h, ph);
    n++;
    if (n % 150 === 0) await ctx.yield();
  }
  if (flowers) for (let n = 0; n < 190; n++) { const z = rng.range(2, 108), s = rng.sign(), x = s * (RL.ch(z) + rng.range(-0.9, 0.9)); if (RL.wid(z, s) > 4) { iris(g, x, z); if (rng() < 0.5) iris(gm, x, z); } }
  await ctx.yield();
  // the mass: a low dark body so the beds read as solid reed, not a comb
  const ST = 2.4, top = (x, z) => { const e = RL.inside(x, z); return e <= 0 ? 0 : (0.75 + 0.3 * ctx.noise.n2(x * 0.3, z * 0.3) + 0.15 * ctx.noise.n2(x * 0.9 + 4, z * 0.9)) * smoothstep(0, 2.2, e); };
  const cLo = mulc(cRoot, 1.0), cHi = mulc(cMid, 0.8);
  for (const s of [-1, 1]) for (let z = -60; z < 118; z += ST) for (let ax = 5; ax < 62; ax += ST) {
    const x0 = s * ax, x1 = s * (ax + ST), y00 = top(x0, z), y10 = top(x1, z), y11 = top(x1, z + ST), y01 = top(x0, z + ST);
    if (y00 + y10 + y11 + y01 <= 0) continue;
    const a = mass.v(x0, y00, z, 0, 1, 0, y00 > 0.3 ? cHi : cLo, [0, 0.3, 6, 0]), b = mass.v(x1, y10, z, 0, 1, 0, y10 > 0.3 ? cHi : cLo, [0, 0.3, 6, 0]);
    const c = mass.v(x1, y11, z + ST, 0, 1, 0, y11 > 0.3 ? cHi : cLo, [0, 0.3, 6, 0]), d = mass.v(x0, y01, z + ST, 0, 1, 0, y01 > 0.3 ? cHi : cLo, [0, 0.3, 6, 0]);
    mass.i.push(a, c, b, a, d, c);
  }
  const out = { stems: await g.geometryAsync(ctx) };
  out.mirror = await gm.geometryAsync(ctx); out.mass = mass.geometry();
  return out;
}

// ---------------------------------------------------------------- jetty, rowing boat, posts, punts, swans
const WOOD = [0, 0, 2, 0];
function buildJetty(rng, x0, x1, z0, z1, deckY) {
  const g = new G(), grey = [0.3, 0.285, 0.26];
  for (let x = x0; x < x1 - 0.1; x += 0.24) { const c = mulc(grey, rng.range(0.75, 1.15)), j = rng.range(-0.012, 0.012); g.box(x, deckY - 0.06 + j, z0 - rng.range(0, 0.07), x + 0.21, deckY + j, z1 + rng.range(0, 0.07), c, WOOD, 'xXYzZ'); }
  for (const z of [z0 + 0.2, z1 - 0.34]) g.box(x0, deckY - 0.24, z, x1, deckY - 0.06, z + 0.14, mulc(grey, 0.6), WOOD, 'xyzZ');
  for (let x = x0 + 0.3; x < x1; x += 3.1) for (const z of [z0 - 0.02, z1 + 0.02]) {
    const top = deckY + (rng() < 0.3 ? 0.75 : 0.22) + rng.range(0, 0.1), lx = rng.range(-0.03, 0.03);
    g.tube([[x, -0.4, z], [x + lx, top * 0.5, z], [x + lx * 2, top, z]], [0.105, 0.1, 0.092], 7, mulc(grey, rng.range(0.7, 0.95)), WOOD);
    g.tube([[x + lx * 2, top, z], [x + lx * 2, top + 0.03, z]], [0.092, 0.02], 7, mulc(grey, 0.5), WOOD);
  }
  return g.geometry();
}
// clinker boat, bow +z, origin on the waterline amidships
function buildBoat(rng, LEN = 4.5, BEAM = 1.5) {
  const g = new G(), NS = 12, NK = 5, white = [0.62, 0.6, 0.55], sheer = [0.1, 0.27, 0.33], tar = [0.1, 0.085, 0.075], wood = [0.36, 0.2, 0.09], woodL = [0.48, 0.3, 0.14];
  const sec = (t) => {      // t -1 stern .. 1 bow -> rows of [x, y] from keel to gunwale
    const fine = t > 0 ? Math.pow(Math.max(0, 1 - Math.pow(t, 2.3)), 0.62) : 1 - 0.2 * t * t, hb = BEAM / 2 * fine + 0.012;
    const yg = 0.34 + 0.16 * t * t + 0.05 * t * t * t, yk = -0.15 + 0.3 * Math.pow(Math.max(0, t - 0.55) / 0.45, 2) + 0.06 * Math.pow(Math.max(0, -t - 0.6) / 0.4, 2), out = [];
    for (let k = 0; k <= NK; k++) { const s = k / NK; out.push([hb * Math.pow(Math.sin(s * Math.PI / 2), 0.75), yk + (yg - yk) * (1 - Math.cos(s * Math.PI / 2))]); }
    return out;
  };
  for (let i = 0; i < NS; i++) {
    const t0 = -1 + 2 * i / NS, t1 = -1 + 2 * (i + 1) / NS, z0 = t0 * LEN / 2, z1 = t1 * LEN / 2, A = sec(t0), B = sec(t1);
    for (let k = 0; k < NK; k++) for (const sx of [-1, 1]) {
      const col = k === NK - 1 ? sheer : k === 0 ? tar : white, lap = 1.035;
      g.quad([sx * A[k][0] * lap, A[k][1], z0], [sx * B[k][0] * lap, B[k][1], z1], [sx * B[k + 1][0], B[k + 1][1], z1], [sx * A[k + 1][0], A[k + 1][1], z0], mulc(col, 0.82), [0, 0, 0, 0], col);
      g.quad([sx * A[k][0] * 0.96, A[k][1] + 0.02, z0], [sx * A[k + 1][0] * 0.96, A[k + 1][1], z0], [sx * B[k + 1][0] * 0.96, B[k + 1][1], z1], [sx * B[k][0] * 0.96, B[k][1] + 0.02, z1], mulc(wood, 0.7), WOOD, woodL);
    }
    if (i % 2 === 1) for (const sx of [-1, 1]) g.box(sx * A[3][0] * 0.94 - 0.02, A[1][1], z0 - 0.02, sx * A[3][0] * 0.94 + 0.02, A[4][1], z0 + 0.02, wood, WOOD, 'xXzZ');   // ribs
  }
  const T = sec(-1), zt = -LEN / 2;                                                           // transom
  for (let k = 0; k < NK; k++) g.quad([-T[k][0], T[k][1], zt], [-T[k + 1][0], T[k + 1][1], zt], [T[k + 1][0], T[k + 1][1], zt], [T[k][0], T[k][1], zt], k === NK - 1 ? sheer : white, [0, 0, 0, 0]);
  for (const sx of [-1, 1]) { const pts = [], rr = []; for (let i = 0; i <= NS; i++) { const t = -1 + 2 * i / NS, S = sec(t); pts.push([sx * S[NK][0], S[NK][1] + 0.015, t * LEN / 2]); rr.push(0.028); } g.tube(pts, rr, 5, woodL, WOOD); }
  for (const t of [-0.52, -0.05, 0.42]) { const S = sec(t), z = t * LEN / 2; g.box(-S[4][0] * 0.95, 0.2, z - 0.11, S[4][0] * 0.95, 0.235, z + 0.11, woodL, WOOD); }
  g.box(-0.3, -0.02, -LEN / 2 + 0.3, 0.3, 0.0, LEN / 2 - 1.1, mulc(wood, 0.8), WOOD, 'Y');   // bottom boards
  for (const sx of [-1, 1]) {                                                                // oars, shipped
    g.tube([[sx * 0.2, 0.27, -1.75], [sx * 0.27, 0.27, 0.9]], [0.022, 0.026], 5, woodL, WOOD);
    g.box(sx * 0.27 - 0.065, 0.262, 0.9, sx * 0.27 + 0.065, 0.283, 1.55, [0.5, 0.12, 0.08], [0, 0, 0, 0]);
  }
  g.tube([[0, 0.5, LEN / 2 - 0.02], [0.5, 0.2, LEN / 2 + 0.5], [1.2, 0.34, LEN / 2 + 0.2], [1.75, 0.82, LEN / 2 - 0.4]], 0.018, 4, [0.42, 0.36, 0.25], [0, 0, 0, 0]);   // the painter
  return g.geometry();
}
function buildPost() {
  const g = new G(), c = [0.27, 0.245, 0.215];
  g.tube([[0, -0.5, 0], [0, 0.2, 0], [0.012, 2.1, 0], [0.02, 3.86, 0]], [0.175, 0.17, 0.155, 0.142], 8, (t) => mulc(c, 0.8 + 0.3 * t), WOOD);
  g.tube([[0.02, 3.86, 0], [0.02, 3.95, 0], [0.02, 4.02, 0]], [0.155, 0.13, 0.02], 8, [0.09, 0.085, 0.085], [0, 0, 0, 0]);
  g.tube([[0.016, 3.2, 0], [0.016, 3.3, 0]], [0.156, 0.156], 8, [0.1, 0.09, 0.085], [0, 0, 0, 0]);
  return g.geometry();
}
function buildPunt(canoe) {
  const g = new G(), w1 = [0.3, 0.19, 0.1], w2 = [0.42, 0.28, 0.14], gr = canoe ? [0.42, 0.1, 0.07] : [0.1, 0.2, 0.16];
  if (canoe) {
    const NS = 10, L = 5.2;
    const sec = (t) => { const f = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.2)), 0.7); return [[0, -0.1 + 0.25 * t * t * t * t], [0.3 * f + 0.008, 0.02 + 0.12 * t * t], [0.4 * f + 0.008, 0.28 + 0.22 * t * t]]; };
    for (let i = 0; i < NS; i++) { const t0 = -1 + 2 * i / NS, t1 = t0 + 2 / NS, A = sec(t0), B = sec(t1), z0 = t0 * L / 2, z1 = t1 * L / 2;
      for (let k = 0; k < 2; k++) for (const sx of [-1, 1]) g.quad([sx * A[k][0], A[k][1], z0], [sx * B[k][0], B[k][1], z1], [sx * B[k + 1][0], B[k + 1][1], z1], [sx * A[k + 1][0], A[k + 1][1], z0], k ? gr : mulc(gr, 0.7), [0, 0, 0, 0], k ? mulc(gr, 1.15) : gr); }
    for (const z of [-1.1, 0.9]) g.box(-0.34, 0.24, z - 0.09, 0.34, 0.27, z + 0.09, w2, WOOD);
    g.tube([[0.12, 0.3, -1.6], [0.2, 0.3, 0.2]], 0.018, 4, w2, WOOD);
    return g.geometry();
  }
  const HB = 0.52, D = 0.36, prof = [[-3, 0.26], [-2.25, 0], [2.25, 0], [3, 0.26]];
  for (let k = 0; k < 3; k++) { const [za, ya] = prof[k], [zb, yb] = prof[k + 1];
    g.quad([-HB, ya, za], [HB, ya, za], [HB, yb, zb], [-HB, yb, zb], mulc(w1, 0.6), WOOD);
    for (const sx of [-1, 1]) { g.quad([sx * HB, ya, za], [sx * HB, yb, zb], [sx * HB, D, zb], [sx * HB, D, za], mulc(gr, 0.8), [0, 0, 0, 0], gr); g.quad([sx * (HB - 0.04), ya + 0.02, za], [sx * (HB - 0.04), yb + 0.02, zb], [sx * (HB - 0.04), D, zb], [sx * (HB - 0.04), D, za], w1, WOOD, w2); } }
  for (const sz of [-1, 1]) { g.quad([-HB, 0.26, sz * 3], [HB, 0.26, sz * 3], [HB, D, sz * 3], [-HB, D, sz * 3], gr, [0, 0, 0, 0]); g.box(-HB, D - 0.03, sz * 3 - (sz > 0 ? 0.9 : 0), HB, D, sz * 3 + (sz > 0 ? 0 : 0.9), w2, WOOD, 'Yy'); }
  for (let z = -2.0; z < 2.05; z += 0.2) g.box(-HB + 0.06, 0.05, z, HB - 0.06, 0.07, z + 0.15, mulc(w2, 0.8 + 0.3 * ((z * 5) % 2 ? 1 : 0.6)), WOOD, 'Y');
  for (const sx of [-1, 1]) g.box(sx * HB - 0.03, D, -3, sx * HB + 0.03, D + 0.03, 3, w2, WOOD, 'xXY');
  g.tube([[-0.3, D + 0.05, -2.6], [0.34, D + 0.05, 2.1]], 0.022, 5, [0.5, 0.42, 0.28], WOOD);        // the pole, left lying across
  return g.geometry();
}
function buildSwan() {
  const g = new G(), w = [0.7, 0.7, 0.68], F3 = [0, 0, 3, 0];
  const body = [], rb = []; for (let k = 0; k <= 8; k++) { const t = k / 8; body.push([0, 0.12 + 0.1 * t * t + (t > 0.8 ? (t - 0.8) * 0.8 : 0) - (t < 0.15 ? 0 : 0), 0.55 - 1.15 * t]); rb.push(0.02 + 0.25 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.06)), 0.6) * (1 - 0.55 * Math.max(0, t - 0.6))); }
  g.tube(body, rb, 8, (t) => mulc(w, 1 - 0.12 * t), F3);
  for (const sx of [-1, 1]) g.tube([[sx * 0.17, 0.2, 0.3], [sx * 0.25, 0.34, 0], [sx * 0.22, 0.4, -0.35], [sx * 0.1, 0.36, -0.72]], [0.03, 0.15, 0.14, 0.03], 6, mulc(w, 1.04), F3, 0.45);   // folded wings, raised
  const neck = [], rn = []; for (let k = 0; k <= 8; k++) { const t = k / 8, a = t * Math.PI * 1.05; neck.push([0, 0.22 + 0.62 * t + 0.02 * Math.sin(a * 2), 0.42 + 0.16 * Math.sin(a) - 0.05 * t]); rn.push(0.075 - 0.035 * t); }
  g.tube(neck, rn, 6, w, F3);
  const hd = neck[8]; g.tube([[hd[0], hd[1] - 0.02, hd[2] - 0.05], [0, hd[1] + 0.02, hd[2] + 0.04], [0, hd[1] - 0.02, hd[2] + 0.12]], [0.04, 0.058, 0.035], 6, w, F3);
  g.tube([[0, hd[1] - 0.02, hd[2] + 0.11], [0, hd[1] - 0.06, hd[2] + 0.24]], [0.032, 0.012], 5, [0.75, 0.3, 0.05], [0, 0, 0, 0]);
  g.tube([[0, hd[1] + 0.02, hd[2] + 0.09], [0, hd[1] + 0.0, hd[2] + 0.13]], [0.022, 0.02], 4, [0.03, 0.03, 0.03], [0, 0, 0, 0]);
  return g.geometry();
}

// ---------------------------------------------------------------- things lying on the water: pads, flowers, shade, fluff, leaves
const SURF_VERT = /* glsl */`
attribute vec4 aPS; attribute vec4 aCol;       // x, z, size, seed | rgb, kind (0 pad, 1 flower, 2 shade, 3 fluff, 4 leaf)
uniform float uTime; varying vec2 vQ; varying vec4 vCol; varying float vSeed; varying vec3 vWp;
void main(){
  float k = aCol.w, loose = step(2.5, k);
  float a = aPS.w*6.283 + loose*uTime*.07*(aPS.w - .5);
  vec2 q = uv - .5; vQ = q*2.;
  vec2 r = vec2(q.x*cos(a) - q.y*sin(a), q.x*sin(a) + q.y*cos(a))*aPS.z;
  vec2 drift = loose*vec2(.1, .045)*uTime*(.4 + aPS.w);
  float lift = .03 + .012*sin(uTime*1.3 + aPS.w*40.) + ((k > .5 && k < 1.5) ? .07 : 0.) + ((k > 1.5 && k < 2.5) ? -.012 : 0.);
  vec3 wp = vec3(aPS.x + r.x + drift.x, lift, aPS.y + r.y + drift.y);
  vCol = aCol; vSeed = aPS.w; vWp = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const SURF_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vCol; varying float vSeed; varying vec3 vWp;
${GLSL_LIGHT}
${GLSL_N}
void main(){
  float kind = vCol.w, r = length(vQ), a = atan(vQ.y, vQ.x + 1e-5), alpha = 1.;
  vec3 V = cameraPosition - vWp; float dist = length(V); V /= max(dist, 1e-3);
  vec3 alb = vCol.rgb, add = vec3(0.); float lit = 1.;
  if (kind < .5) {
    if (r > .96 || (abs(a) < .19 && r > .08)) discard;
    alb *= (.7 + .22*(.5 + .5*cos(a*11.))*smoothstep(.1, .9, r))*(.82 + .36*lvn(vQ*4. + vSeed*9.));
    alb = mix(alb, alb*vec3(1.3, 1.1, .66), smoothstep(.78, .96, r));
    float fr = 1. - clamp(V.y, 0., 1.); fr *= fr; add = uSkyAmb*fr*fr*.9;
  } else if (kind < 1.5) {
    float pet = .5 + .44*abs(cos(a*4.));
    if (r > pet) discard;
    alb = mix(vec3(.85, .6, .08), alb*(.78 + .22*smoothstep(0., pet, r))*(.9 + .1*cos(a*16.)), smoothstep(.13, .2, r));
  } else if (kind < 2.5) {
    float s = 1. - smoothstep(0., 1., r); alpha = s*s*.6; lit = 0.;
  } else if (kind < 3.5) {
    if (r > 1.) discard;
    float s = 1. - r; alpha = s*(.55 + .45*lvn(vQ*5. + vSeed*30.));
  } else if (kind > 4.5) {                           // a drift line of fluff and pollen, drawn out by the air
    float band = 1. - smoothstep(.02, .16, abs(vQ.y + .07*sin(vQ.x*5. + vSeed*20.)));
    float sp = lvn(vec2(vQ.x*26., vQ.y*90.) + vSeed*40.);
    alpha = band*(1. - smoothstep(.45, 1., abs(vQ.x)))*(.1 + .34*smoothstep(.55, .9, sp));
  } else {
    if (abs(vQ.x) > .52*(1. - vQ.y*vQ.y)) discard;
    alb *= .72 + .28*smoothstep(0., .1, abs(vQ.x)) + .15*lvn(vQ*7. + vSeed*20.);
  }
  float up = clamp(uSunDir.y*1.7 + .3, 0., 1.);
  vec3 col = mix(alb, alb*(uSunCol*up + uSkyAmb*.85) + add, lit);
  col = hazed(col, dist, 0.);
  gl_FragColor = vec4(col*alpha, alpha);
}`;
function surfaceMesh(LU, aPS, aCol, dynamic) {
  const base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const ps = new THREE.InstancedBufferAttribute(new Float32Array(aPS), 4); if (dynamic) ps.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aPS', ps); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(aCol), 4)); g.instanceCount = aPS.length / 4;
  const mat = new THREE.ShaderMaterial({ uniforms: LU, vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4.5;
  return mesh;
}

// ---------------------------------------------------------------- the heron (or crane): stands in the reeds, opens its wings, lifts off beside us
function buildHeron(LU, crane, start, path) {
  const S = crane ? 1.42 : 1.3, F3 = [0, 0, 3, 0];
  const grey = crane ? [0.6, 0.61, 0.62] : [0.4, 0.45, 0.52], pale = crane ? [0.72, 0.72, 0.71] : [0.66, 0.67, 0.67], dark = [0.1, 0.115, 0.15], bill = [0.72, 0.5, 0.08], leg = [0.3, 0.27, 0.16];
  const torso = new G(), legs = new G(), wIn = new G(), wOut = new G();
  { const pts = [], rr = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([0, -0.2 + 0.24 * t + 0.03 * Math.sin(t * 3.14), -0.36 + 0.56 * t]); rr.push(0.015 + 0.125 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.9)), 0.7)); }
    torso.tube(pts, rr, 8, (t) => mixc(mulc(grey, 0.85), pale, smoothstep(0.6, 1, t)), F3, 0.82);
    torso.tri([0, -0.2, -0.36], [0.07, -0.24, -0.56], [-0.07, -0.24, -0.56], mulc(grey, 0.7), F3);                                       // tail
    for (const sx of [-1, 1]) torso.tube([[sx * 0.1, 0.02, 0.1], [sx * 0.13, -0.02, -0.12], [sx * 0.09, -0.12, -0.42]], [0.03, 0.085, 0.02], 5, (t) => mixc(dark, grey, t < 0.3 ? 0 : 0.8), F3, 0.5);   // folded wing, dark shoulder
    const neck = [[0, 0.04, 0.2], [0, 0.17, 0.27], [0, 0.3, 0.2], [0, 0.4, 0.17], [0, 0.5, 0.24], [0, 0.56, 0.3]];
    torso.tube(neck, [0.06, 0.045, 0.036, 0.032, 0.034, 0.04], 6, (t) => mixc(pale, [0.7, 0.7, 0.68], t), F3);
    torso.tube([[0, 0.55, 0.26], [0, 0.585, 0.33], [0, 0.57, 0.4]], [0.036, 0.046, 0.026], 6, [0.7, 0.7, 0.68], F3);                    // head
    torso.tube([[0, 0.6, 0.36], [0, 0.6, 0.27], [0, 0.55, 0.14]], [0.018, 0.022, 0.004], 4, crane ? [0.6, 0.06, 0.05] : dark, F3);       // crest / cap
    torso.tube([[0, 0.57, 0.39], [0, 0.555, 0.49], [0, 0.54, 0.6]], [0.024, 0.014, 0.003], 5, bill, [0, 0, 0, 0]); }
  for (const sx of [-1, 1]) legs.tube([[sx * 0.05, 0, 0], [sx * 0.055, -0.3, 0.04], [sx * 0.05, -0.62, 0], [sx * 0.05, -0.84, 0.02]], [0.024, 0.018, 0.019, 0.018], 5, leg, [0, 0, 0, 0]);
  // wings: built for the left side (x > 0), feathers as chordwise strips; the right is the same mesh mirrored
  const strip = (o, x0, x1, lead0, lead1, ch0, ch1, n, tipDark) => { for (let k = 0; k < n; k++) {
    const a = k / n, b = (k + 1) / n, xa = lerp(x0, x1, a), xb = lerp(x0, x1, b), la = lerp(lead0, lead1, a), lb = lerp(lead0, lead1, b), ca = lerp(ch0, ch1, a), cb = lerp(ch0, ch1, b), sh = 0.86 + 0.14 * (k % 2);
    const up = 0.03 * Math.sin(a * 3.14), mid = 0.45;
    o.quad([xa, up, la], [xb, up, lb], [xb, up + 0.012, lb - cb * mid], [xa, up + 0.012, la - ca * mid], mulc(grey, sh), F3, mulc(grey, sh * 0.9));
    o.quad([xa, up + 0.012, la - ca * mid], [xb, up + 0.012, lb - cb * mid], [xb + (tipDark ? 0.05 : 0), up - 0.01, lb - cb * (1 + (tipDark ? 0.25 * b : 0))], [xa, up - 0.01, la - ca], mulc(dark, 1.5 + 0.4 * (k % 2)), F3, mulc(dark, 0.9));
  } };
  strip(wIn, 0, 0.52, 0.1, 0.13, 0.36, 0.34, 5, false);
  strip(wOut, 0, 0.56, 0.13, -0.02, 0.34, 0.16, 6, true);
  const gT = torso.geometry(), gL = legs.geometry(), gI = wIn.geometry(), gO = wOut.geometry();
  const make = (mirror) => {
    const mat = aboveMaterial(LU, mirror ? { defines: { MIRROR: 1 } } : {}), root = new THREE.Group(), body = new THREE.Group();
    const mk = (geo) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; if (mirror) m.renderOrder = 2; return m; };
    const lg = mk(gL), wings = [];
    body.add(mk(gT)); body.add(lg); root.add(body); root.scale.setScalar(S);
    for (const sx of [1, -1]) { const sh = new THREE.Group(), el = new THREE.Group(); sh.position.set(sx * 0.09, 0.03, 0.08); sh.scale.x = sx; el.position.set(0.52, 0, 0.03); sh.add(mk(gI)); el.add(mk(gO)); sh.add(el); body.add(sh); wings.push({ sh, el, sx }); }
    return { root, body, lg, wings };
  };
  const rigs = [make(false), make(true)], T0 = 0.045, TEND = 0.2;
  const group = new THREE.Group(); group.add(rigs[0].root, rigs[1].root);
  const pos = new THREE.Vector3(), poi = new THREE.Vector3(start[0], 1.2, start[1]);
  // its course lies beside the flown line and never crosses it: the line's own ground track from D0 (the point of the line nearest the stand) on,
  // set off to the stand's side by the stand's own distance, easing to SIDE metres. It reads the route, which is a place; never the lens
  const hp = new THREE.Vector3(), ht = new THREE.Vector3(), at = [0, 0], SIDE = 5; let D0 = 0, off0 = 1e9;
  const gap = (d) => { path.posAtDist(d, hp); return Math.hypot(hp.x - start[0], hp.z - start[1]); };
  for (let d = 0; d <= 300; d += 2) { const q = gap(d); if (q < off0) { off0 = q; D0 = d; } }
  for (let h = 1; h > 2e-4; h *= 0.5) for (const d of [D0 - h, D0 + h]) { const q = gap(d); if (q < off0) { off0 = q; D0 = d; } }
  path.posAtDist(D0, hp); path.tangentAtDist(D0, ht);
  const sg = ((start[0] - hp.x) * -ht.z + (start[1] - hp.z) * ht.x) < 0 ? -1 : 1;
  const beside = (d, off, out) => { path.posAtDist(d, hp); path.tangentAtDist(d, ht); const hl = Math.hypot(ht.x, ht.z) || 1; out[0] = hp.x - sg * ht.z / hl * off; out[1] = hp.z + sg * ht.x / hl * off; return out; };
  const base = beside(D0, off0, [0, 0]);
  function update(time, u) {
    const t = (u - T0) * OLD_DUR;                      // seconds since it left the water (journey time)
    group.visible = u < TEND;
    if (!group.visible) return;
    const open = smoothstep(-0.45, 0.1, t), air = smoothstep(0, 0.5, t);
    const s = t <= 0 ? 0 : (t < 1.6 ? 3.25 * t * t : 8.32 + 10.4 * (t - 1.6) + 2.2 * Math.min(t - 1.6, 2.5) * Math.min(t - 1.6, 2.5)), tt = Math.max(0, t);
    beside(D0 + s, lerp(off0, SIDE, smoothstep(0.2, 2.2, tt)), at);                      // (leaves the line's direction there in ht, for the heading below)
    pos.set(start[0] + (at[0] - base[0]), 0.72 * S - 0.12 * S * smoothstep(-0.4, -0.05, t) * (1 - air) + 7.5 * smoothstep(0, 2.6, tt) + 2.6 * Math.max(0, tt - 1.8), start[1] + (at[1] - base[1]));
    poi.copy(pos);
    const fl = time * TAU * 2.3 + 3.5, beat = Math.sin(fl), yaw = lerp(-0.09, Math.atan2(ht.x, ht.z), smoothstep(0.5, 2.2, tt)), pitch = -0.5 * air * (1 - smoothstep(0.8, 2.4, tt)) - 0.06 * air;
    for (const R of rigs) {
      R.root.position.copy(pos); R.root.position.y += 0.05 * beat * air;
      R.root.rotation.set(0, yaw + (1 - air) * 0.9, 0);                 // standing three-quarters on to us, then turning down the channel
      const tilt = lerp(-0.5, 0.12, air) + pitch + (1 - open) * 0.05 * Math.sin(time * 0.8);
      R.body.rotation.set(tilt, 0, 0.04 * Math.sin(time * 0.6) * (1 - air));
      R.lg.rotation.x = 1.4 * smoothstep(0.2, 1.4, tt) - tilt;
      for (const w of R.wings) {
        const fold = 1 - open, a1 = lerp(-1.25, 0.72 * beat + 0.1, open), a2 = lerp(-2.5, 0.45 * Math.sin(fl - 1.0) - 0.15, open);
        w.sh.rotation.set(0, w.sx * fold * 1.1, w.sx * a1); w.sh.scale.set(w.sx * lerp(0.25, 1, open), 1, lerp(0.5, 1, open));
        w.el.rotation.set(0, fold * 1.3, a2);
      }
    }
  }
  return { group, update, poi };
}

// ---------------------------------------------------------------- one dandelion seed (the airship's only counterpart above)
// the way out, announced: a teal glow seated in the dome's oculus, seen through the glass from far up the canal
function buildPortalGlow() {
  const mat = new THREE.ShaderMaterial({ uniforms: { uAmt: { value: 0 }, uSize: { value: 84 }, uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`uniform float uSize; varying vec2 vQ;
void main(){ vQ = position.xy; vec4 mv = modelViewMatrix*vec4(0., 0., 0., 1.); mv.xy += position.xy*uSize; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`uniform float uAmt, uTime; varying vec2 vQ;
void main(){ float r = length(vQ); float core = exp(-r*r*62.), halo = exp(-r*r*7.5)*(1. - smoothstep(.7, 1., r));
  float pulse = .9 + .1*sin(uTime*1.3);
  gl_FragColor = vec4(vec3(.1, .8, .64)*(core*1.5 + halo*.5)*uAmt*pulse, 1.); }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.frustumCulled = false; m.renderOrder = 3.5; return m;
}
function buildSeed(LU) {
  const g = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.ShaderMaterial({ uniforms: { ...LU, uAmt: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`varying vec2 vQ; void main(){ vQ = uv*2. - 1.; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`,
    fragmentShader: /* glsl */`varying vec2 vQ; uniform float uAmt;
${GLSL_LIGHT}
void main(){
  vec2 c = vQ - vec2(0., .32); float r = length(c), a = atan(c.x, c.y + 1e-5);
  float hairs = pow(abs(cos(a*13.)), 26.)*smoothstep(.06, .12, r)*(1. - smoothstep(.5, .62, r))*step(-.2, c.y);
  float tips = (1. - smoothstep(.0, .05, abs(r - .56)))*step(-.1, c.y)*.5;
  float stalk = (1. - smoothstep(.012, .03, abs(vQ.x)))*step(-.78, vQ.y)*step(vQ.y, .34);
  float seed = 1. - smoothstep(.03, .06, length((vQ - vec2(0., -.8))*vec2(1., .32)));
  float al = clamp(hairs*.85 + tips + stalk*.9 + seed, 0., 1.)*uAmt;
  vec3 col = mix(vec3(.74, .74, .7), vec3(.3, .2, .1), seed)*(uSunCol*.85 + uSkyAmb*.6);
  gl_FragColor = vec4(col*al, al);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 8; mesh.visible = false;
  return mesh;
}

// ================================================================= the world
export default {
  id: 'city-in-the-lake',
  name: 'The City in the Lake',
  category: 'bizarre',
  weirdness: 0.82,
  media: ['air', 'water'],
  async build(ctx) {
    const { rng, noise, renderer } = ctx;
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), vary = ctx.vary || {}, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---- which visit is this: the pair of hours, the weather above, the season on the shore, the cast
    const lr = rng.fork('almanac-790');
    let hourIx = lr.pick([0, 0, 0, 1, 1, 2, 2]);
    if (vary.hour === 'dawn') hourIx = 0; else if (vary.hour === 'day' || vary.hour === 'night') hourIx = 1; else if (vary.hour === 'golden') hourIx = 2;
    let weather = lr.pick([0, 0, 0, 1, 1, 2]);                       // 0 lifting mist, 1 breeze, 2 sun-shower
    const seasonIx = lr.pick([0, 0, 0, 1, 1, 2]);
    if (seasonIx === 2 && weather === 2) weather = 0;
    const cast = { crane: lr.chance(0.4), cranes: lr.chance(0.4), canoe: lr.chance(0.4) };
    const HR = HOURS[hourIx], SE = SEASONS[seasonIx], rare = !!vary.rare;

    // ---- light above the water (no scene lights: everything is shaded from these)
    const sunDir = skyDirection(HR.up.el, -100);
    const LU = {
      uSunDir: { value: sunDir.clone() }, uSunCol: { value: V3(HR.up.sunCol) }, uSkyAmb: { value: V3(HR.up.amb) }, uShade: { value: V3(HR.up.shade) },
      uHaze: { value: new THREE.Color(HR.up.haze) }, uHazeK: { value: HR.up.hazeK * (weather === 2 ? 1.25 : 1) }, uTime: { value: 0 }, uPx: { value: 0.0027 },
      uWind: { value: new THREE.Vector2(0.8, 0.5).multiplyScalar(weather === 1 ? 2.1 : 1) }, uBob: { value: new THREE.Vector4() }, uMirror: { value: new THREE.Vector3(0.6, 0.58, 0.66) },
    };
    await ctx.yield();
    const sky = makeSky({ rng, preset: HR.up.preset, zenith: HR.up.zenith, horizon: HR.up.horizon, sunElevation: HR.up.el, sunAzimuth: -100, sunColor: HR.up.sun,
      scatterColor: HR.up.scatter, scatter: hourIx === 2 ? 0.5 : 0.34, horizonPow: hourIx === 2 ? 5.2 : 5.5, clouds: false,
      clouds2: weather === 1 ? { coverage: 0.5, opacity: 0.5, stretch: 1 } : (weather === 2 ? { coverage: 0.6, opacity: 0.6, stretch: 0.4 } : { coverage: 0.34, opacity: 0.3, stretch: 1 }) });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(new THREE.Color(HR.up.haze), HR.up.hazeK * 0.8);

    // ---- the hero: the city, its water, its own sun
    await ctx.yield();
    const hero = await buildHero(ctx, { detail, water: true, waterRadius: 2500, upperSky: [HR.up.horizon, HR.up.zenith], upperSun: [sunDir.x, sunDir.y, sunDir.z], lit: HR.low.lit, airship: rare, sceneFog: 0.3 });
    hero.object.position.set(0, 0, HZ); scene.add(hero.object);
    { const U = hero.uniforms, lo = HR.low;
      U.uSkyPeach.value.set(lo.peach); U.uSkyRose.value.set(lo.rose); U.uSkyViolet.value.set(lo.violet); U.uSunCol.value.fromArray(lo.sun); U.uAmbSky.value.fromArray(lo.amb); U.uAmbShade.value.fromArray(lo.ambShade);
      U.uBarA.value.fromArray(lo.barA); U.uBarB.value.fromArray(lo.barB); U.uSunGlow.value.fromArray(lo.glow); U.uMoon.value.set(0.26, 0.42, 0.87, lo.moon); { const m = U.uMoon.value, l = Math.hypot(m.x, m.y, m.z); m.x /= l; m.y /= l; m.z /= l; }
      U.uWinCol.value.set(lo.win); U.uRain.value = weather === 2 ? 1 : 0; U.uPaws.value.set(weather === 1 ? 1.9 : 1, weather === 1 ? 0.17 : 0);
      U.uUpBand.value.copy(new THREE.Color(HR.up.haze)).lerp(new THREE.Color().setRGB(HR.up.shade[0] * 1.5, HR.up.shade[1] * 1.5, HR.up.shade[2] * 1.5), 0.55).lerp(new THREE.Color(SE.spruce), 0.5);   // the far strip mirrors the slopes, not a pale sky
      const vu = hero.meshes.veil.material.uniforms; vu.uSunUCol.value.set(HR.up.sunCol[0] * 2.8, HR.up.sunCol[1] * 2.8, HR.up.sunCol[2] * 2.8); }
    const A = hero.anchors, ax = (zw) => A.canalAxis(zw - HZ), side = ax(HZ + 105) >= 0 ? 1 : -1;
    await ctx.yield();

    // ---- the flight
    // the reeds; a low skim out to the left over the first hanging church (its boat adrift above it); a climb to the one level view of
    // the whole city with the campanile from foot to tip; a swing out past the island church and the long bridge; down to the finial,
    // seen level from 39 m; the canal down its middle; a rising, narrowing spiral round the bowl; over its rim and down into it
    const pts = [[0, 4, 0], [0, 4, 32], [0, 4.6, 64], [-1, 6.5, 96], [-14, 9.5, 124], [-42, 15, 150], [-68, 31, 172], [-90, 45, 200], [-132, 46, 248], [-176, 42, 300], [-184, 34, 360], [-140, 25, 420], [-84, 16.5, 456], [-44, 12, 478], [-18, 9.4, 496], [-4, 8, 514], [1, 6.8, 536], [2, 5, 560], [2, 3.4, 584]];
    for (let z = 606; z <= 831; z += 25) pts.push([ax(z), 2.5, z]);
    // out of the canal and up in a narrowing spiral round the bowl (it stays on our left), then over its rim and down into it
    const pol = (r, deg, y) => [r * Math.cos(deg * Math.PI / 180), y, 1100 + r * Math.sin(deg * Math.PI / 180)];
    pts.push([0, 3.2, 856], [4, 9, 888], [18, 20, 922], [46, 32, 960], [78, 43, 1000], [104, 52, 1042]);
    pts.push(pol(112, -6, 60), pol(95, 22, 66), pol(77, 52, 65), pol(61, 84, 57), pol(49, 116, 43));
    const DIVE0 = pol(40, 142, 26), DIVE_LEN = Math.hypot(40, 88), SPLASH = [DIVE0[0] * (1 - 26 / 88), 0, DIVE0[2] + (1100 - DIVE0[2]) * 26 / 88];
    for (const k of [0, 0.34, 0.67, 1]) pts.push([DIVE0[0] * (1 - k), 26 - 88 * k, DIVE0[2] + (1100 - DIVE0[2]) * k]);
    const path = makePath(pts), PL = path.length;
    const TOUCH_U = 0.43, uOf = (z) => path.nearestXZ(ax(z), z).u;
    // what was keyed to the first route's u (the heron, the geese, the wake, the swallows ...) keeps its place on the water: the two routes
    // are matched by z as far as the canal's end, then by the crest and the splash
    const OLD_UZ = [0, 0.025, 0.0503, 0.0765, 0.1037, 0.1308, 0.158, 0.1842, 0.2097, 0.2352, 0.261, 0.287, 0.3123, 0.3375, 0.3635, 0.3907, 0.4188, 0.4462, 0.4725, 0.4985, 0.524, 0.549, 0.574, 0.5988, 0.6238, 0.6488, 0.6737, 0.6987, 0.7238, 0.7488];
    const U_SPLASH = 1 - DIVE_LEN * (62 / 88) / PL, mapO = [], mapN = [];
    { let i = 0; const q = new THREE.Vector3(); for (let k = 0; k < OLD_UZ.length; k++) { while (i < 2000 && path.pointAt(i / 2000, q).z < k * 30) i++; mapO.push(OLD_UZ[k]); mapN.push(i / 2000); }
      mapO.push(0.855, 0.933, 1); mapN.push(1 - 170 / PL, U_SPLASH, 1); }
    const pw = (xs, ys, v) => { if (v <= xs[0]) return ys[0]; for (let k = 1; k < xs.length; k++) if (v <= xs[k]) return ys[k - 1] + (ys[k] - ys[k - 1]) * (v - xs[k - 1]) / Math.max(xs[k] - xs[k - 1], 1e-6); return ys[ys.length - 1]; };
    const nu = (uOld) => pw(mapO, mapN, uOld), ou = (uNew) => pw(mapN, mapO, uNew);
    const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), v2 = new THREE.Vector2(), camP = new THREE.Vector3(), camQ = new THREE.Quaternion();

    // ---- land: shore, meadow, larch slopes, snow peaks; poplars; mist; cumulus over the peaks
    const lakeD = makeLakeDist(noise);
    const terr = await buildTerrain(ctx, lakeD, LU, SE, Math.atan2(sunDir.z, sunDir.x));
    scene.add(terr.mesh);
    await ctx.yield();
    scene.add(await buildPoplars(ctx, rng.fork('poplars'), lakeD, terr, LU, SE, Math.round(300 * lerp(0.7, 1, detail))));
    await ctx.yield();
    const mistAmt = [1, 0.6, 0.85][weather] * (seasonIx === 2 ? 1.15 : 1) * (hourIx === 2 ? 0.7 : 1);
    scene.add(await buildMist(ctx, rng.fork('mist'), lakeD, terr, path, LU, Math.round(([150, 70, 110][weather] + (seasonIx === 2 ? 40 : 0)) * detail), mistAmt));
    await ctx.yield();
    const cr = rng.fork('cumulus'), at = [];
    for (let k = 0; k < 7; k++) { const th = 0.06 * Math.PI + (k + cr.range(0.1, 0.9)) / 7 * 0.92 * Math.PI, r = cr.range(3000, 3900); at.push([LAKE.cx + Math.cos(th) * r, cr.range(1150, 1500), LAKE.cz + Math.sin(th) * r, cr.range(750, 1250)]); }
    await ctx.yield();
    const cloudTex = cloudNoise(rng.fork('cloud-noise'));
    await ctx.yield();
    const clouds = makeCloudField({ rng, mode: 'cumulus', at, puffs: 40, noiseTexture: cloudTex, wind: [1.4, 0, 0.5], renderOrder: 6, opacity: 0.9, sunDirection: [sunDir.x, sunDir.y + 0.25, sunDir.z],
      sunColor: HR.up.sun, litColor: hourIx === 2 ? '#ffdcb4' : '#f4f1ea', shadeColor: hourIx === 2 ? '#b2a8d0' : '#aebfd8', hazeColor: HR.up.haze });
    scene.add(clouds.object);
    await ctx.yield();

    // ---- the reed bay: reeds (and their true reflection), iris, jetty, rowing boat, swans, heron
    const bay = new THREE.Group(); scene.add(bay);
    const matAbove = aboveMaterial(LU), matMirror = aboveMaterial(LU, { defines: { MIRROR: 1 } });
    const addBay = (geo, mirror) => { const m = new THREE.Mesh(geo, mirror ? matMirror : matAbove); m.frustumCulled = false; if (mirror) m.renderOrder = 2; bay.add(m); return m; };
    const RL = reedLayout(noise, lakeD);
    const reeds = await buildReeds(ctx, rng.fork('reeds'), RL, SE, Math.round(7400 * detail * lerp(0.85, 1.1, (dens - 0.7) / 0.6)), SE.flower > 0);
    addBay(reeds.stems, false); addBay(reeds.mass, false); addBay(reeds.mirror, true); addBay(reeds.mass, true);
    await ctx.yield();
    const JZ = 27.4, jx0 = RL.ch(JZ) + 3.6, jetty = buildJetty(rng.fork('jetty'), jx0, jx0 + 34, JZ, JZ + 1.8, 0.72);
    addBay(jetty, false); addBay(jetty, true);
    await ctx.yield();
    const boatGeo = buildBoat(rng), boats = [addBay(boatGeo, false), addBay(boatGeo, true)], boatAt = [jx0 - 1.15, 0.02, JZ + 4.4];
    const drift = [[-37, 0.02, 151, 0.7], [-66, 0.02, 262, -0.5]].map((d) => ({ d, m: [addBay(boatGeo, false), addBay(boatGeo, true)] }));   // adrift past the reeds, over the first hanging towers
    const swanGeo = buildSwan(), swans = [new THREE.InstancedMesh(swanGeo, matAbove, 2), new THREE.InstancedMesh(swanGeo, matMirror, 2)];
    for (const s of swans) { s.frustumCulled = false; s.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bay.add(s); } swans[1].renderOrder = 2;
    await ctx.yield();
    const heron = buildHeron(LU, cast.crane, [-(RL.ch(100) + 0.5), 100], path); bay.add(heron.group);

    await ctx.yield();
    // ---- out on the open water: bare posts over the lamp standards below, empty punts over the ferries
    const postGeo = buildPost(), postPts = [];
    for (const [lx, lz] of A.posts) { const x = lx, z = lz + HZ; if (path.distanceTo(x, 2, z) > 8.5 && postPts.length < 140) postPts.push([x, z]); }
    const posts = new THREE.InstancedMesh(postGeo, matAbove, Math.max(1, postPts.length)); posts.frustumCulled = false; scene.add(posts);
    { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pr = rng.fork('posts');
      postPts.forEach(([x, z], k) => { e.set(pr.range(-0.05, 0.05), pr() * TAU, pr.range(-0.05, 0.05)); q.setFromEuler(e); const s = pr.range(0.9, 1.08); m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, s, 1)); posts.setMatrixAt(k, m); }); }
    const NPUNT = 7, punts = new THREE.InstancedMesh(buildPunt(cast.canoe), matAbove, NPUNT); punts.frustumCulled = false; punts.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(punts);
    await ctx.yield();

    // ---- on the water: lily pads and their flowers, poplar fluff, leaves, contact shade
    const sr = rng.fork('surface'), aPS = [], aCol = [], padA = lin(seasonIx === 0 ? '#3f7a36' : '#6f7a3a'), padB = lin(seasonIx === 0 ? '#6a9a3c' : '#9a8a44');
    for (let n = 0, N = Math.round((seasonIx === 2 ? 110 : 330) * detail); n < N; n++) {
      const z = sr.range(-6, 114), s = sr.sign(), c = RL.ch(z), x = sr() < 0.66 ? s * (c - sr.range(-0.5, 3.6)) : sr.range(-1, 1) * c * 0.8;
      const pc = mixc(padA, padB, sr()); aPS.push(x, z, sr.range(0.55, 1.08), sr()); aCol.push(pc[0], pc[1], pc[2], 0);
      if (SE.flower && sr() < 0.14) { aPS.push(x + 0.12, z + 0.1, 0.46, sr()); aCol.push(0.76, 0.75, 0.72, 1); }
    }
    for (const [x, z] of postPts) { aPS.push(x, z, 1.7, 0); aCol.push(0.02, 0.035, 0.07, 2); }
    for (let x = jx0; x < jx0 + 34; x += 1.5) { aPS.push(x, JZ + 0.9, 3, 0); aCol.push(0.02, 0.035, 0.07, 2); }
    const floatAt = (kind, n, size, colFn) => { for (let k = 0, guard = 0; k < n && guard < n * 6; guard++) {
      const uu = nu(sr() < 0.3 ? sr.range(0, 0.09) : sr.range(0.44, 0.8)); path.pointAt(uu, tmpP); const x = tmpP.x + sr.range(-1, 1) * (kind === 3 ? 17 : 28), z = tmpP.z + sr.range(-6, 6);
      if (lakeD(x, z) > -3 || RL.inside(x, z) > 0.5) continue;
      const c = colFn(); aPS.push(x, z, sr.range(size[0], size[1]), sr()); aCol.push(c[0], c[1], c[2], kind); k++; } };
    await ctx.yield();
    { const nF = Math.round(1300 * detail * (SE.fluff ? 1 : 0.45)); for (let k = 0; k < 4; k++) { floatAt(3, Math.round(nF / 4), [0.14, 0.34], () => [0.8, 0.8, 0.78]); await ctx.yield(); } }
    floatAt(5, Math.round(150 * detail), [5, 12], () => seasonIx === 1 ? [0.62, 0.5, 0.2] : [0.74, 0.76, 0.74]);
    await ctx.yield();
    { const lA = lin('#C9982A'), lB = lin('#8A5A1E'), lC = lin('#E0C050'), nL = Math.round([110, 900, 60][seasonIx] * detail);
      for (let k = 0; k < 4; k++) { floatAt(4, Math.round(nL / 4), [0.14, 0.26], () => mixc(lA, sr() < 0.5 ? lB : lC, sr())); await ctx.yield(); } }
    scene.add(surfaceMesh(LU, aPS, aCol, false));
    await ctx.yield();
    const ND = NPUNT * 3 + 4, dPS = new Float32Array(ND * 4), dCol = []; for (let k = 0; k < ND; k++) dCol.push(0.02, 0.035, 0.07, 2);
    const dyn = surfaceMesh(LU, Array.from(dPS), dCol, true), dynAttr = dyn.geometry.attributes.aPS; scene.add(dyn);

    await ctx.yield();
    // ---- birds and insects (kit), lit from above by the morning and from below by the rose of the water
    const rose = lin(HR.low.rose), fauna = F.makeFauna(scene, { light: { sunDir: sunDir.clone(), sunColor: new THREE.Color().setRGB(HR.up.sunCol[0], HR.up.sunCol[1], HR.up.sunCol[2]), sunIntensity: 0.95,
      sky: new THREE.Color().setRGB(HR.up.amb[0] * 1.5, HR.up.amb[1] * 1.5, HR.up.amb[2] * 1.5), ground: new THREE.Color().setRGB(rose[0] * 0.55, rose[1] * 0.55, rose[2] * 0.55) } });
    const fr = rng.fork('fauna');
    fauna.add(F.makeFlock({ rng: fr, species: cast.cranes ? 'flamingos' : 'geese', count: 11, size: cast.cranes ? 2.3 : 1.9, spacing: 3.6,
      cross: { path, u: nu(0.27), lead: 38, angle: 118, side: 1, height: -9, span: 400, window: 0.2, bow: 0 },
      palette: cast.cranes ? { body: '#b9bcc0', belly: '#d6d6d2', wingC: '#a9adb2', trail: '#2a2c30', tip: '#1c1e22', head: '#c8c8c6', neckC: '#c2c4c6', legC: '#33342f' } : undefined }), { always: true });
    await ctx.yield();
    const swOpts = { species: 'swifts', size: 1.55, palette: { body: '#1e2a52', belly: '#e6ddd0', wingC: '#1a2444', trail: '#232a44', tip: '#141a30', head: '#7a2a1e' } };
    fauna.add(F.makeFlock({ rng: fr, ...swOpts, count: Math.round(34 * detail), spread: [8.8, 3.2, 30], wander: [1, 0.5, 1.5, 0.7], maxSigma: 2, along: { path, side: 17, up: 3, lead: 30, from: nu(0.455), to: nu(0.8), drift: 9 } }), { always: true });
    await ctx.yield();
    for (const [uu, sd] of [[0.555, 1], [0.612, -1], [0.668, 1], [0.722, -1]])
      fauna.add(F.makeFlock({ rng: fr, ...swOpts, size: 1.7, count: 2, spread: [1.6, 0.5, 2.2], wander: [1, 0.5, 1.5, 0.7], maxSigma: 2, cross: { path, u: nu(uu), lead: 8, angle: 74, side: sd, height: 5.5, span: 150, sag: 1.4, duration: DURATION } }), { always: true });
    await ctx.yield();
    fauna.add(F.makeDragonflies({ rng: fr, count: Math.round(22 * detail), size: 2.3, path, uFrom: 0, uTo: nu(0.085), clear: 6, spread: 10, maxSigma: 2, lift: [-2.7, 0.3] }));

    await ctx.yield();
    // ---- air: fluff or leaves adrift, rain in a sun-shower
    const air = [];
    if (seasonIx === 0) air.push(fx.makeParticles({ rng: rng.fork('fluff'), preset: 'pollen', count: Math.round(300 * detail), box: [56, 20, 56], size: [0.03, 0.065], colors: ['#ffffff', '#f6f1e2', '#e9eef2'], renderOrder: 7 }));
    else if (seasonIx === 1) air.push(fx.makeParticles({ rng: rng.fork('leaves'), preset: 'leaves', count: Math.round(260 * detail), box: [60, 26, 60], colors: ['#D9A62E', '#F0CF52', '#B9772A'], renderOrder: 7 }));
    else air.push(fx.makeParticles({ rng: rng.fork('frost'), preset: 'dust', count: Math.round(700 * detail), box: [50, 22, 50], colors: ['#ffffff', '#dfeaff', '#fff4e0'], renderOrder: 7 }));
    if (weather === 2) air.push(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', count: Math.round(2600 * detail), colors: ['#fff6e6', '#dfeaff', '#ffffff'], opacity: 0.5, renderOrder: 7 }));
    for (const p of air) scene.add(p.object);

    // ---- the other sky as a dome (the dive only), the rare seed
    const dome = buildLowerDome(hero); scene.add(dome);
    const pglow = buildPortalGlow(); pglow.position.set(0, -62, 1100); scene.add(pglow);
    const seed = rare ? buildSeed(LU) : null; if (seed) { seed.scale.setScalar(0.3); scene.add(seed); }
    await ctx.yield();

    // ---- where the gaze goes
    const lookP = new THREE.Vector3();
    const pois = [
      { at: () => heron.poi, from: nu(0.03), to: nu(0.085), weight: 0.3 },
      { at: [-62, -30, 172], from: 0.04, to: 0.115, weight: 0.5 },                 // the first hanging church, its tower and the boat adrift over it
      { at: [0, -215, HZ], from: 0.1, to: 0.21, weight: 0.7 },                     // the whole city, the campanile from foot to tip
      { at: [-322, -30, 350], from: 0.2, to: 0.3, weight: 0.8 },                   // the island church and the fourteen-arch bridge
      { at: [-40, -60, HZ + 10], from: 0.29, to: 0.4, weight: 0.5 },                      // the campanile's legs, its rings spreading
      { at: [0, -15, HZ], from: 0.385, to: 0.465, weight: 0.8, fade: 0.25 },        // the finial at the surface
      // (down the canal the gaze keeps to the middle of the street: the barge runs ahead beside the axis)
      { at: (time, uu) => lookP.set(0, lerp(-22, -56, smoothstep(0.76, 0.9, uu)), 1100), from: 0.635, to: 0.975, weight: 0.85, fade: 0.2 },   // the bowl of the dome, then its core
    ];

    // ---- per-frame
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(1, 1, 1), p4 = new THREE.Vector3(), fwd = new THREE.Vector3(), rgt = new THREE.Vector3(), upv = new THREE.Vector3();
    const rings = hero.uniforms.uRings.value, ringSt = Array.from({ length: 6 }, () => ({ cyc: -1e9, x: 0, z: 0, ok: false }));
    const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const U_PIGEON = uOf(745);
    function update(dt, time, camera, u = 0) {
      const uo = ou(u);                                                   // where we are, in the first route's measure
      LU.uTime.value = time;
      LU.uPx.value = 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(1, renderer.getDrawingBufferSize(v2).y);
      sky.update(dt, time, camera); clouds.update(dt, time, camera);
      path.pointAt(u, tmpP); const zl = tmpP.z - HZ;                       // the camera's place on the course, in the hero's frame

      // the pendulum locked to the journey; the barge that is only below, pacing us, its wake on the empty surface
      hero.setProgress(u, DURATION, TOUCH_U);
      // down the canal it runs ahead and to one side, 8.5 m off the axis (the most at which its canopy passes under the bridges' vault) on the side the line does not leave by, turned to its
      // own course, nearer as the street ends; it is never held under the line: as the street ends it draws on ahead and bears away to stand off to the left of the bowl, where it is seen whole
      const bq = lerp(clamp(zl + lerp(52, 33, smoothstep(170, 235, zl)), 46, 485), 485, smoothstep(250, 400, zl)), bX = (z) => lerp(A.canalAxis(z) - 8.5, -50, smoothstep(300, 485, z)), bw = smoothstep(0.515, 0.55, uo) * (1 - smoothstep(0.9, 0.93, u));
      hero.setBarge(bX(bq), bq, bw, lerp(Math.atan((bX(bq + 15) - bX(bq - 15)) / 30), -0.79, smoothstep(300, 400, zl)));
      const pk = smoothstep(U_PIGEON - 0.07, U_PIGEON - 0.01, u) * (1 - smoothstep(U_PIGEON + 0.03, U_PIGEON + 0.09, u));
      { const zf = clamp(zl + 26, 62, 318), nb = Math.min(Math.abs(zf - A.bridges[0]), Math.abs(zf - A.bridges[1]));
        hero.uniforms.uFlock.value.set(A.canalAxis(zf) - side * 5, zf, 5 + 10 * (1 - smoothstep(14, 34, nb)), 13); }   // (the pigeons keep to the canal: far off they are not drawn, so the bowl holds no flecks)
      if (rare) { const k = clamp((uo - 0.61) / 0.2, -0.6, 1.6); hero.setAirship(side * lerp(-60, 60, k), 388 + 12 * k, side * 1.5, 44 + 0.7 * Math.sin(time * 0.5)); }
      hero.update(dt, time, camera);
      { const ga = smoothstep(0.5, 0.62, uo); pglow.material.uniforms.uAmt.value = ga * (1 - smoothstep(0.915, 0.94, uo)); hero.uniforms.uPGlow.value.set(0, -62, 1100, ga * (0.85 + 0.15 * Math.sin(time * 1.3))); } pglow.material.uniforms.uTime.value = time;

      // small rings: fish rising, a swallow's dip, the heron leaving, our own dive
      for (let k = 0; k < 6; k++) {
        const sw = k === 5 && uo > 0.47 && uo < 0.78, T = sw ? 2.3 : 5.5, tk = time + k * 1.13, cyc = Math.floor(tk / T), age = tk - cyc * T, st = ringSt[k];
        if (st.cyc !== cyc) { st.cyc = cyc; path.pointAt(Math.min(u + (sw ? 9 + 5 * hash(k, cyc) : 14 + 50 * hash(k, cyc)) / PL, 0.9), p4);
          st.x = p4.x + (hash(cyc, k + 9) - 0.5) * (sw ? 7 : 32); st.z = p4.z + (hash(k + 3, cyc) - 0.5) * 8; st.ok = p4.y < 30 && lakeD(st.x, st.z) < -4 && (Math.hypot(st.x, st.z - HZ - 180) > 670 || A.clear(st.x, st.z - HZ)); }
        rings[k].set(st.x, st.z - HZ, age, st.ok ? (sw ? 0.026 : 0.036) * smoothstep(0, 0.25, age) * (1 - smoothstep(T * 0.55, T * 0.95, age)) : 0);
      }
      { const tH = (uo - 0.045) * OLD_DUR, hs = heron.poi; if (tH < 0) rings[6].set(-(RL.ch(100) + 0.5), 100 - HZ, time % 3.3, 0.012 * (1 - smoothstep(2.2, 3.2, time % 3.3)));
        else rings[6].set(-(RL.ch(100) + 0.5), 100 - HZ, tH, 0.07 * (1 - smoothstep(2.5, 5, tH))); void hs; }
      { const tS = (u - (U_SPLASH - 0.014)) * DURATION; rings[7].set(SPLASH[0], SPLASH[2] - HZ, Math.max(tS, 0), tS > 0 ? 0.12 * (1 - smoothstep(2.6, 4.2, tS)) : 0); }

      // empty punts over the ferries; the boat at its painter; swans; the heron
      const fs = A.ferries(time);
      for (let k = 0; k < NPUNT; k++) {
        const f = fs[k], z = f[1] + HZ, h = f[2] + 0.22 * Math.sin(k * 2.4), c = Math.cos(h), s = Math.sin(h);
        let x = f[0]; { const w = smoothstep(846, 872, z) * (1 - smoothstep(1010, 1030, z)), ax0 = Math.abs(x); if (ax0 < 10) x = (x < 0 ? -1 : 1) * lerp(ax0, 10, w); }   // no punt under the keel as we rise over the basin
        e4.set(0.012 * Math.sin(time * 0.9 + k), h, 0.03 * Math.sin(time * 0.7 + k * 1.7)); q4.setFromEuler(e4); p4.set(x, 0.015 * Math.sin(time * 1.1 + k * 2), z);
        punts.setMatrixAt(k, m4.compose(p4, q4, s4));
        for (let j = 0; j < 3; j++) { const o = (k * 3 + j) * 4, d = (j - 1) * 1.9; dPS[o] = x + s * d; dPS[o + 1] = z + c * d; dPS[o + 2] = 2.9; dPS[o + 3] = 0; }
      }
      punts.instanceMatrix.needsUpdate = true;
      bay.visible = uo < 0.36;
      let o = NPUNT * 12;
      if (bay.visible) {
        for (const b of boats) { b.position.set(boatAt[0], boatAt[1] + 0.02 * Math.sin(time * 1.2), boatAt[2]); b.rotation.set(0.03 * Math.sin(time * 1.15), 0.1 + 0.03 * Math.sin(time * 0.31), 0.05 * Math.sin(time * 0.83 + 1)); }
        for (const { d, m } of drift) for (const b of m) { b.position.set(d[0] + 0.05 * time, d[1] + 0.02 * Math.sin(time * 1.1 + d[2]), d[2] + 0.03 * time); b.rotation.set(0.03 * Math.sin(time * 1.05 + d[2]), d[3] + 0.02 * time, 0.05 * Math.sin(time * 0.8 + d[0])); }
        dPS[o] = boatAt[0]; dPS[o + 1] = boatAt[2] - 0.9; dPS[o + 2] = 3.1; dPS[o + 4] = boatAt[0]; dPS[o + 5] = boatAt[2] + 1.1; dPS[o + 6] = 2.9;
        for (let k = 0; k < 2; k++) {
          const g = time * 0.28 + k * 2.2, x = -(RL.ch(97) + 5.2) - k * 2.6 + 0.8 * Math.sin(g * 0.6), z = 96 + k * 4.2 + 0.3 * time * 0.25 + 0.6 * Math.cos(g * 0.5);
          e4.set(0.02 * Math.sin(time * 0.9 + k), 0.25 * Math.sin(g * 0.45 + k), 0); q4.setFromEuler(e4); p4.set(x, 0.01 * Math.sin(time + k), z); m4.compose(p4, q4, s4);
          swans[0].setMatrixAt(k, m4); swans[1].setMatrixAt(k, m4); dPS[o + 8 + k * 4] = x; dPS[o + 9 + k * 4] = z - 0.1; dPS[o + 10 + k * 4] = 1.7;
        }
        swans[0].instanceMatrix.needsUpdate = true; swans[1].instanceMatrix.needsUpdate = true;
        heron.update(time, uo);
      }
      dynAttr.array.set(dPS); dynAttr.needsUpdate = true;

      fauna.update(dt, time, camera, u);
      for (const p of air) p.update(dt, time, camera);
      camera.getWorldPosition(camP); camera.getWorldQuaternion(camQ);
      dome.visible = camP.y < 1; if (dome.visible) dome.position.copy(camP);
      if (seed) {
        const k = (uo - 0.63) / 0.13, amt = smoothstep(0, 0.12, k) * (1 - smoothstep(0.85, 1, k));
        seed.visible = amt > 0.001;
        if (seed.visible) {
          fwd.set(0, 0, -1).applyQuaternion(camQ); rgt.set(1, 0, 0).applyQuaternion(camQ); upv.set(0, 1, 0).applyQuaternion(camQ);
          seed.position.copy(camP).addScaledVector(fwd, 3.1).addScaledVector(rgt, lerp(1.5, -1.7, k) + 0.12 * Math.sin(time * 1.3)).addScaledVector(upv, 0.8 - 0.4 * k + 0.16 * Math.sin(time * 0.9));
          seed.quaternion.copy(camQ); seed.rotateZ(0.35 * Math.sin(time * 0.7) - 0.2);
          seed.material.uniforms.uAmt.value = amt;
        }
      }
    }
    await ctx.yield();
    { const c0 = new THREE.PerspectiveCamera(62, 16 / 9, 0.4, 7000); c0.position.set(0, 4, 0); c0.updateMatrixWorld(true); update(0, 0, c0, 0); }

    await ctx.yield();
    return {
      scene, path, duration: DURATION,
      pace: (u) => 1 - 0.28 * Math.exp(-((u - TOUCH_U) / 0.045) * ((u - TOUCH_U) / 0.045)),   // linger while the finial touches
      camera: { fov: 62, near: 0.4, far: 7000, lookAhead: 34, sway: 1, bank: 0.06 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#7FE6D2', glow: 1, tilt: true, revealDistance: 430 },
      post: { exposure: HR.post.exposure, bloom: { strength: 0.36, radius: 0.6, threshold: 0.96 },
        grade: { saturation: 1.07, contrast: 1.05, tint: HR.post.tint, vignette: 0.26, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { sky.dispose?.(); clouds.dispose?.(); cloudTex.dispose(); },
    };
  },
};
