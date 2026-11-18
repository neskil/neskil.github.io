// THE WELL OF RAIN
// A purely vertical journey. The camera skims a sunlit sea of tree crowns through a sun shower, tips over the lip
// of a natural light-well and falls 860 m on a 15 m helix inside the Spiral Fall (the hero set piece,
// src/parts/well-of-rain.js): past the crown storey, the basin terraces, the hanging village with its lifts and
// kites, and the organ-pipe roots, until the rainbow closes into a full circle around the portal's glow. The last
// turn opens and levels out along the root bridge to the portal in its braided arch.
//
// The gaze on the helix is ACROSS the well and nearly level (a point of interest on the far wall that travels with the lens), so each
// storey is a picture on the far wall with the shaft's depth below it and its water standing level; it looks down into the village's
// lanterns, follows the Root Fall down from 25 m under the Cathedral's top, and goes to the portal over u = 0.80..0.87. Three storeys have one great subject on one trunk
// face, and the gaze dwells on it while that storey passes: the GREAT FALL with its rainbow (crown storey), the GRAND STAIR of pale
// basins with the herons (terraces), the CATHEDRAL of two ranks of pipes with water from every mouth (organ-pipe roots).
// Down the Cathedral's middle runs the ROOT FALL, one white column from its top shelf to the stair's basins under the lowest mouths;
// the gaze follows it down, and from there looks to the Ring (never steeper than about 48 degrees plus what keeps the Ring whole).
// The walls are a place: the bark is laid in 13 m courses (parts file), and on the courses stand shelves furnished by storey:
//   y 888..700  the crown storey: moss shelves with bromeliads (coloured hearts), orchid sprays, vines and thin falls; on one trunk the
//               Great Fall drops the storey's whole height from a moss lip, a bow standing in its spray at the lens's height;
//   y 700..505  the basin terraces: pools 6.5 m apart stepping across each trunk face and back, each spilling into the next, lotus
//               lights on the water, rainbow fragments in the spray; on one trunk they are the Grand Stair, great pale basins 13 m apart
//               pouring one into the next down the face's middle, the tall herons standing in them;
//   y 505..335  the hanging village: plank balconies with rope rails, washing and lanterns, houses slung beneath, above the old pods,
//               rope bridges, lifts and kites; its lantern light warms the walls above and below (hero uniform uVil);
//   y 335..186  the organ-pipe roots: ranks of great pale pipes hanging from dark shelves, water falling from their mouths,
//               glow-worm specks on the wet and glow-worm threads in the gaps; on one trunk the Cathedral, two great ranks one under the other
//               (pale; the lesser ranks are wet moss-bronze with amber mouths), the Root Fall dropping between its towers;
//   below       the gathering pool under the root bridge (foam turning in a spiral, the portal's gold on it) and the Ring.
// Storey meshes are all built in build() and shown by camera height (they share materials, so nothing compiles in view).
//
// Layout: hero at the world origin (canopy rim y = 900, bridge deck y = 30). Everything lives in cylindrical
// coordinates round the well axis. Small things (leaf rosettes, vines, root-hairs, butterflies, seeds) exist only
// in a 160 m band that travels with the camera: the vertex shader wraps their height and re-hashes their place.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep as sst } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, GL_TRUNK, trunkRadius } from '../parts/well-of-rain.js';

const PALETTE = ['#BFE9F2', '#F6F0B8', '#6DBB4A', '#1F6B4A', '#0D3338', '#3A2A22', '#FF5A3C'];
const V3 = THREE.Vector3, TAU = Math.PI * 2, D2R = Math.PI / 180;
const C = (h) => new THREE.Color(h);
const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };

// ---------------------------------------------------------------- shared GLSL
const FOGP_V = '\n#include <fog_pars_vertex>\n', FOG_V = '\n#include <fog_vertex>\n', FOGP_F = '\n#include <fog_pars_fragment>\n', FOG_F = '\n#include <fog_fragment>\n';
const G = /* glsl */`
uniform float uT,uTime,uCamY,uHand,uSunGain; uniform vec3 uAmbA,uAmbB,uAmbC,uAmbD,uSunCol,uCamP;
float h13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
vec3 ambAt(float y){ float d=900.0-y; vec3 c=mix(uAmbA,uAmbB,smoothstep(0.0,200.0,d));
  c=mix(c,uAmbC,smoothstep(200.0,550.0,d)); return mix(c,uAmbD,smoothstep(550.0,880.0,d)); }
float sunAt(vec3 p){ float d=900.0-p.y; vec2 q=p.xz*0.07;
  float n=vn3(vec3(q,uTime*0.11+p.y*0.003))*0.72+vn3(vec3(q*2.9+5.0,uTime*0.37))*0.28;
  return smoothstep(0.40,0.60,n)*mix(1.0,0.5,smoothstep(0.0,880.0,d))*mix(0.7,1.0,smoothstep(0.0,170.0,d))*uSunGain; }
vec3 ambN(float y){ vec3 a=ambAt(y); return mix(a,vec3(dot(a,vec3(0.3,0.5,0.2))),0.6)*1.15; }   // neutral fill for built things, so browns are not black under green light
const float BAND=160.0, LO=-124.0;
float wrapY(float s,float fall,out float wid){ float q=s*BAND-fall-uCamY-LO; wid=floor(q/BAND); return uCamY+LO+(q-wid*BAND); }
float bandFade(float y){ float d=y-uCamY; return smoothstep(LO,LO+20.0,d)*(1.0-smoothstep(LO+BAND-14.0,LO+BAND,d)); }
${GL_TRUNK}
float trunkD(vec2 p){ float a=atan(p.x,p.y+1e-4); float ac=(floor(a/1.0471976)+0.5)*1.0471976; return length(p-60.0*vec2(sin(ac),cos(ac))); }
float stairOK(vec2 p,float y){ float a=atan(p.x,p.y+1e-4); float i=68.0-uHand*(3.14159265-a)/0.5235988;
  float dy=mod(y-(895.0-12.5*i),150.0); return step(18.0,dy)*step(dy,124.0); }
// anchor on the inner face of one of the six trunks; n = outward normal of the bark there
vec3 wallAnchor(vec2 hh,float y,float off,out vec3 n){ float kt=floor(hh.x*6.0), ac=(kt+0.5)*1.0471976; vec2 c=60.0*vec2(sin(ac),cos(ac));
  float b=ac+3.14159265+(hh.y-0.5)*3.5; vec2 d=vec2(sin(b),cos(b)); n=vec3(d.x,0.0,d.y); float R=trunkR(kt,1.5707963-b,y)-0.35+off; return vec3(c.x+d.x*R,y,c.y+d.y*R); }
`;

// ---------------------------------------------------------------- merged-mesh helpers
function makeBuf() { return { p: [], n: [], c: [], fx: [], i: [] }; }
const _T = new V3(), _N = new V3(), _B = new V3();
// fx = [sway metres, glow, kind, dir/phase]; kinds: 0 bark, 1 woven, 2 cloth, 3 fur, 4 rope (widens with distance)
function addTube(B, pts, rad, sides, col, fx) {
  const n = pts.length, base = B.p.length / 3;
  _N.set(0.31, 0.2, 0.93).normalize();
  for (let i = 0; i < n; i++) {
    _T.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    _B.crossVectors(_T, _N); if (_B.lengthSq() < 1e-5) _B.set(_T.y, _T.z, _T.x).cross(_T); _B.normalize();
    _N.crossVectors(_B, _T).normalize();
    const t = i / (n - 1), r = rad(t), c = col(t), f = fx(t), P = pts[i];
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const nx = _N.x * ca + _B.x * sa, ny = _N.y * ca + _B.y * sa, nz = _N.z * ca + _B.z * sa;
      B.p.push(P.x + nx * r, P.y + ny * r, P.z + nz * r); B.n.push(nx, ny, nz);
      B.c.push(c[0], c[1], c[2]); B.fx.push(f[0], f[1], f[2], f[3]);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
    const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, d = b + sides;
    B.i.push(a, b, c, b, d, c);
  }
}
// ellipsoid with axes ax, ay, az (Vector3 half-axes); colTop/colBot blend by the local up coordinate
function addBlob(B, c, ax, ay, az, colTop, colBot, fx, seg = 8, rows = 6) {
  const base = B.p.length / 3;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= seg; i++) {
    const th = (j / rows) * Math.PI, ph = (i / seg) * TAU, sx = Math.sin(th) * Math.cos(ph), sy = Math.cos(th), sz = Math.sin(th) * Math.sin(ph);
    B.p.push(c.x + ax.x * sx + ay.x * sy + az.x * sz, c.y + ax.y * sx + ay.y * sy + az.y * sz, c.z + ax.z * sx + ay.z * sy + az.z * sz);
    _T.set(0, 0, 0).addScaledVector(ax, sx / ax.lengthSq()).addScaledVector(ay, sy / ay.lengthSq()).addScaledVector(az, sz / az.lengthSq()).normalize();
    B.n.push(_T.x, _T.y, _T.z);
    const k = sy * 0.5 + 0.5, f = typeof fx === 'function' ? fx(sx, sy, sz) : fx;
    B.c.push(lerp(colBot[0], colTop[0], k), lerp(colBot[1], colTop[1], k), lerp(colBot[2], colTop[2], k)); B.fx.push(f[0], f[1], f[2], f[3]);
  }
  const W = seg + 1;
  for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = base + j * W + i; B.i.push(a, a + 1, a + W, a + 1, a + W + 1, a + W); }
}
function addQuad(B, a, b, c, d, col, fa, fb, fc, fd) {
  const base = B.p.length / 3; _T.subVectors(b, a); _N.subVectors(d, a); _B.crossVectors(_T, _N).normalize();
  for (const [P, f] of [[a, fa], [b, fb], [c, fc || fb], [d, fd || fa]]) { B.p.push(P.x, P.y, P.z); B.n.push(_B.x, _B.y, _B.z); B.c.push(col[0], col[1], col[2]); B.fx.push(f[0], f[1], f[2], f[3]); }
  B.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
function bufGeo(B) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(B.fx, 4));
  g.setIndex(B.i); g.boundingSphere = new THREE.Sphere(new V3(0, 450, 0), 2500); return g;
}
function instGeo(base, count, attrs) {   // attrs: { name: [itemSize, (i) => array] }
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const name in attrs) { const [sz, fn] = attrs[name], a = new Float32Array(count * sz);
    for (let i = 0; i < count; i++) { const v = fn(i); for (let j = 0; j < sz; j++) a[i * sz + j] = v[j]; }
    g.setAttribute(name, new THREE.InstancedBufferAttribute(a, sz)); }
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new V3(0, 450, 0), 2500); return g;
}

// ---------------------------------------------------------------- the four hours
const HOURS = {
  morning: { sky: { preset: 'day', sunElevation: 84, sunAzimuth: 150, zenith: '#6fb6e6', horizon: '#BFE9F2', clouds: { coverage: 0.34, scale: 1.2 } },
    amb: [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]], sun: '#FFF4C8', sunK: 2.6, gain: 1, fog: ['#7fb26c', '#3b7d4c', '#1a6048', '#0e3a41'],
    disc: '#fff6d0', discK: 3.0, ray: '#fff0c0', rayK: 0.16, lamp: 1.0, exposure: 1.0, crownSun: '#fff2c4', crownK: 1.25, crownAmb: '#7fb0c8', rainbow: 1, fire: 0, hair: 0 },
  noon: { sky: { preset: 'day', sunElevation: 88, sunAzimuth: 40, zenith: '#4f9fe0', horizon: '#b4e0f2', clouds: { coverage: 0.16, scale: 1.4 } },
    amb: [[0.66, 0.68, 0.64], [0.68, 0.72, 0.7], [0.74, 0.8, 0.8], [0.82, 0.9, 0.92]], sun: '#FFFBE6', sunK: 3.3, gain: 1.15, fog: ['#74ad63', '#2f7447', '#145643', '#0c353d'],
    disc: '#ffffee', discK: 4.2, ray: '#fff8dc', rayK: 0.18, lamp: 0.8, exposure: 0.92, crownSun: '#fffbe6', crownK: 1.45, crownAmb: '#6fa6c8', rainbow: 1.25, fire: 0, hair: 0 },
  dusk: { sky: { preset: 'goldenHour', sunElevation: 11, sunAzimuth: 200, clouds: { coverage: 0.4, scale: 1.1 } },
    amb: [[1.0, 0.62, 0.42], [0.74, 0.6, 0.52], [0.72, 0.76, 0.84], [0.9, 1.0, 1.2]], sun: '#FF9A4A', sunK: 1.5, gain: 0.7, fog: ['#b98562', '#4d6b58', '#1f5052', '#15434c'],
    disc: '#ffb878', discK: 2.2, ray: '#ffae66', rayK: 0.12, lamp: 2.2, exposure: 1.08, crownSun: '#ff9c58', crownK: 1.5, crownAmb: '#6a5f96', rainbow: 0.7, fire: 1, hair: 0.35 },
  night: { sky: { preset: 'night', bodyOverrides: { 0: { elevation: 74, azimuth: 150, size: 3.2, phase: 1, glow: 0.5 } }, clouds: { coverage: 0.22 } },
    amb: [[0.4, 0.62, 0.52], [0.42, 0.68, 0.54], [0.52, 0.82, 0.66], [0.7, 1.02, 0.86]], sun: '#D6E2E8', sunK: 1.9, gain: 0.95, fog: ['#143c30', '#10382c', '#0c322a', '#0a2c2a'],
    disc: '#cfe2ff', discK: 2.6, ray: '#bcd6ff', rayK: 0.16, lamp: 2.6, exposure: 1.15, crownSun: '#b4ceff', crownK: 1.0, crownAmb: '#35548a', rainbow: 1.3, fire: 1, hair: 1 },
};

export default {
  id: 'well-of-rain',
  name: 'The Well of Rain',
  category: 'alien',
  weirdness: 0.45,
  media: ['air'],
  async build(ctx) {
    const { rng, noise } = ctx, vary = ctx.vary || {};
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- which visit is this: hour, weather, cast, rare event
    const vr = rng.fork('look');
    // (the first draws of a fresh stream lean one way for small seeds, so the hour is taken from two of them folded together)
    const h1 = vr(), h2 = vr(), hx = h1 * 9.1 + h2 * 4.3, hourRoll = ['morning', 'morning', 'noon', 'dusk', 'night'][Math.floor((hx - Math.floor(hx)) * 5)], dayRoll = h2 < 0.5 ? 'morning' : 'noon';
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'dusk' : vary.hour === 'dawn' ? 'morning' : vary.hour === 'day' ? dayRoll : hourRoll;
    let weather = vr.pick(['shower', 'shower', 'downpour', 'mist', 'blossom', 'seeding']);
    if (vary.hour === 'dawn') weather = 'mist';
    const rare = !!vary.rare;                                    // the Great Tipping
    const castMoth = vr.chance(hour === 'night' ? 0.8 : 0.25);   // pale moths instead of scarlet gliders
    const castBalloon = vr.chance(hour === 'dusk' || hour === 'night' ? 0.7 : 0.25);   // lantern balloons instead of kites
    const giantRoll = vr.int(1, 3), turnPick = vr.pick([1154.5, 1214.5]);   // degrees of helix; the odd 14.5 puts the level entry line through the middle of a gap between two trunks
    const castLeapers = vr.chance(0.35), giantCount = castLeapers ? 0 : giantRoll;   // a troop of small leapers on the rope bridges instead of the giants
    const H = HOURS[hour];
    const scene = new THREE.Scene();
    const disposables = [];

    // ---- hero
    const hero = await buildHero(ctx, { palette: PALETTE, moonbow: hour === 'night', trunkArc: 115 });
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors, hand = A.helix.hand, seat = A.portalSeat.position.clone(), SR = hero.info.stairRadius;
    const mulU = (u, m, k = 1) => { const v = u.value; if (v.isColor) { v.r *= m[0] * k; v.g *= m[1] * k; v.b *= m[2] * k; } else { v.x *= m[0] * k; v.y *= m[1] * k; v.z *= m[2] * k; } };
    const wetK = weather === 'downpour' ? 0.82 : 1;
    mulU(HU.uAmbA, H.amb[0], wetK); mulU(HU.uAmbB, H.amb[1], wetK); mulU(HU.uAmbC, H.amb[2], wetK); mulU(HU.uAmbD, H.amb[3], wetK);
    HU.uSunCol.value.copy(C(H.sun)).multiplyScalar(H.sunK * (weather === 'downpour' ? 0.75 : 1)); HU.uSunGain.value = H.gain;
    if (weather === 'downpour') HU.uRate.value *= 1.55;
    HU.uHourK.value = hour === 'night' ? 0.4 : hour === 'dusk' ? 0.75 : 1;
    hero.parts.strip.material.uniforms.uK.value = 0.13; hero.parts.poolGlow.material.uniforms.uK.value = 0.22;      // the deck's roots stay readable in the portal's light
    HU.uVil.value.set(318, 0.2 * Math.min(H.lamp, 2.2) + 0.1, 2 * 85 * 85, 112);          // the village's lantern light on the walls above and below it
    const rate0 = HU.uRate.value, lag0 = HU.uLag.value;
    await ctx.yield();

    const U = {
      uT: { value: 0 }, uTime: HU.uTime, uCamY: { value: 931 }, uHand: { value: hand }, uSunGain: HU.uSunGain, uCamP: { value: new V3(0, 931, 200) },
      uAmbA: HU.uAmbA, uAmbB: HU.uAmbB, uAmbC: HU.uAmbC, uAmbD: HU.uAmbD, uSunCol: HU.uSunCol,
      uLeafA: HU.uLeafA, uLeafB: HU.uLeafB, uPale: HU.uPale, uScarlet: HU.uScarlet, uBark: HU.uBark,
      uLamp: { value: H.lamp }, uHair: { value: H.hair },
    };
    const mkU = (extra = {}) => Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), U, extra);
    const fxTime = { value: 0 };

    // ---- the path: level run over the crown sea, tip over the lip, helix down, one opening turn, the bridge
    // The camera helix (radius 15) stays inside the stair (basin rims at 19-21 m) until it is below the last basins of
    // its sector, then opens into one slow turn that ends on the bridge axis 46 m from the portal.
    const YH = 900, EASE = 220, TE = 70, yEnd = seat.y, K = (YH - yEnd) / (turnPick - EASE / 2 - TE / 2);       // K: metres fallen per degree turned
    const yOf = (th) => (th < EASE ? yEnd + K * th * th / (2 * EASE) : th > turnPick - TE ? YH - K * (turnPick - th) * (turnPick - th) / (2 * TE) : yEnd + K * (th - EASE / 2));   // eased at both ends
    const ZS = 20, RC = 10, C1 = [-RC * hand, ZS], R0 = 15;
    const helixAt = (th) => { const e = 1 - sst(110, 215, th), a = hand * (90 - th) * D2R, r = lerp(R0, RC, e);
      return new V3(C1[0] * e + Math.sin(a) * r, yOf(th), C1[1] * e + Math.cos(a) * r); };
    const aTop = hand * (90 - turnPick) * D2R, pTop = helixAt(turnPick), dirTop = new V3(hand * Math.cos(aTop), 0, -hand * Math.sin(aTop));
    const pts = [];
    for (const s of [150, 120, 92, 66, 44, 24, 8]) pts.push(new V3(pTop.x - dirTop.x * s, YH + 15 * (1 - Math.cos(Math.PI * s / 150)), pTop.z - dirTop.z * s));
    for (let th = turnPick; th > EASE + 20; th -= (th > turnPick - 90 ? 15 : 30)) pts.push(helixAt(th));
    for (let th = EASE; th > 1; th -= 15) pts.push(helixAt(th));
    pts.push(new V3(0, yEnd, ZS), new V3(0, yEnd, ZS - 12), new V3(0, yEnd, ZS - 24), new V3(0, yEnd, seat.z + 11), seat.clone());
    await ctx.yield();
    const path = makePath(pts, { samples: 900 });
    await ctx.yield();
    const _pp = new V3(), camYAt = (u) => path.pointAt(u, _pp).y;
    const uAtY = (y) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (camYAt(m) > y) lo = m; else hi = m; } return lo; };
    const uVillage = uAtY(392), uFlock = uAtY(690);
    const thAtY = (y) => EASE / 2 + (y - yEnd) / K;                                            // helix angle of the camera at height y (above the ease)
    // stair helper (same formula as the shader): metres above the stair ribbon at this place, 0..150
    const stairDy = (x, z, y) => { const a = Math.atan2(x, z), i = 68 - hand * (Math.PI - a) / (Math.PI / 6); return (((y - (895 - 12.5 * i)) % 150) + 150) % 150; };
    const stairClear = (x, z, y, lo = 20, hi = 122) => { const d = stairDy(x, z, y); return d > lo && d < hi; };
    // ---- one great subject per storey, each on the inward face of one trunk, and the gaze dwells on it while its storey passes:
    // the Great Fall (crown storey), the Grand Stair of basins (terraces), the Cathedral rank (organ-pipe roots). The trunks are
    // chosen from the helix itself: the lens meets the Fall from across the well and closes on it, swings a little on to the Stair
    // on the next trunk, and passes the Cathedral across the well's whole width (it stands opposite the lens at the middle of its storey). dl = how far round the helix the lens is from the subject.
    const camAz = (y) => hand * (90 - thAtY(y)) * D2R, trunkOf = (az) => ((Math.round(az / (Math.PI / 3) - 0.5) % 6) + 6) % 6;
    const kFall = trunkOf(camAz(880) - hand * 110 * D2R), kStair = (kFall + hand + 6) % 6, kCath = trunkOf(camAz(335) - hand * 100 * D2R);
    const subjAt = (k, r) => { const ac = (k + 0.5) * Math.PI / 3; return [Math.sin(ac) * r, Math.cos(ac) * r]; };
    // y0..y1: the lens heights over which the gaze dwells (it leaves the Fall before passing its foot, and the Cathedral once below its mouths)
    const SUBJ = [{ k: kFall, y0: 884, y1: 720, p: subjAt(kFall, 31) }, { k: kStair, y0: 716, y1: 508, p: subjAt(kStair, 33.5) }, { k: kCath, y0: 338, y1: 226, p: subjAt(kCath, 36) }];

    // ---- sky, clouds, fog, a token light rig (the world is self-lit; the rig is for rides and companions)
    const skyOpts = { rng: rng.fork('sky'), ...H.sky };
    if (weather === 'downpour') skyOpts.clouds = { coverage: 0.62, scale: 1.1 };
    if (hour === 'night') { skyOpts.bake = true; skyOpts.renderer = ctx.renderer; }
    await ctx.yield();
    const sky = makeSky(skyOpts); scene.add(sky.object);
    sky.material.transparent = true; if (sky.materialLow) sky.materialLow.transparent = true;      // the dome fades with setOpacity below the rim: both halves must be in the transparent pass from the start (kit finding, 6 Oct)
    await ctx.yield();
    const cr = rng.fork('clouds'), towers = [];
    for (let i = 0; i < 6; i++) { const a = (i + cr.range(-0.3, 0.3)) / 6 * TAU, d = cr.range(620, 1050); towers.push([Math.sin(a) * d, cr.range(985, 1060), Math.cos(a) * d, cr.range(340, 560)]); }
    // one field per tower (they share the noise texture), so no single kit call holds the page for long
    const cloudFields = []; let cloudTex = null;
    for (const tw of towers) { const cf = makeCloudField({ rng: cr, sky, at: [tw], wind: [2.2, 0, 0.8], puffs: 40, fogFade: 0.15, noiseTexture: cloudTex }); cloudTex = cf.noiseTexture; scene.add(cf.object); cloudFields.push(cf); await ctx.yield(); }
    await ctx.yield();
    const fogTop = sky.fogColor.clone(), fogRamp = H.fog.map(C), fogCol = fogTop.clone();
    if (weather === 'mist') for (const c of fogRamp) c.lerp(C('#dfeee0'), 0.10);
    if (weather === 'downpour') for (const c of fogRamp) c.multiplyScalar(0.85);
    scene.fog = new THREE.FogExp2(fogCol, 0.0011); scene.background = fogCol;
    const hemi = new THREE.HemisphereLight(C(H.crownAmb), C('#20402c'), 1.4), dirL = new THREE.DirectionalLight(C(H.sun), 2.0);
    dirL.position.copy(sky.lightDirection).multiplyScalar(100); scene.add(hemi, dirL);
    const sunDir = sky.lightDirection.clone().normalize();
    await ctx.yield();

    // ---- the crown sea: cellular crowns (each a dome with a dark crease round it) out to the haze, six trunk crowns round
    // the well, four emergents on the far horizon, and a leafy skirt that hangs over the lip and hides the trunk tops
    const crU = { uLipGold: { value: C(hour === 'night' ? '#ffb45a' : hour === 'dusk' ? '#ffac58' : '#ffd070').multiplyScalar(hour === 'night' ? 0.5 : 0.8) }, uCrSun: { value: C(H.crownSun).multiplyScalar(H.crownK * wetK) }, uCrAmb: { value: C(H.crownAmb).multiplyScalar(0.8) }, uSunDir: { value: sunDir } };
    const crownSpots = [], skirtSpots = [], topOnly = [];
    {
      const hOff = rng.range(0, 60), er = rng.fork('emergent'), entryA = Math.atan2(-dirTop.x, -dirTop.z), emer = [];
      for (let i = 0; i < 4; i++) { const a = entryA + Math.PI + [-0.66, -0.25, 0.3, 0.72][i] + er.range(-0.08, 0.08), d = er.range(230, 430); emer.push([Math.sin(a) * d, Math.cos(a) * d, er.range(30, 40), er.range(46, 66)]); }
      // two more stand either side of the entry axis, 95 m ahead of the entry point, heavy with scarlet blossom: they frame the well's mouth
      for (const e of [-1, 1]) emer.push([pTop.x - dirTop.x * 55 - dirTop.z * e * 54, pTop.z - dirTop.z * 55 + dirTop.x * e * 54, 27, 33 + 5 * e, 0.97]);
      const h2 = (x, z, k) => { const s = Math.sin(x * 127.1 + z * 311.7 + k * 74.7 + hOff) * 43758.5453; return s - Math.floor(s); };
      const cell = (x, z, S, k, out) => { const gx = Math.floor(x / S), gz = Math.floor(z / S); let d1 = 9, d2 = 9, id = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cz = gz + j, a = h2(cx, cz, k), b = h2(cx, cz, k + 3.3);
          const d = Math.hypot(x - (cx + 0.15 + 0.7 * a) * S, z - (cz + 0.15 + 0.7 * b) * S) / S; if (d < d1) { d2 = d1; d1 = d; id = a; } else if (d < d2) d2 = d; }
        out[0] = d2 - d1; out[1] = id; };
      const c1 = [0, 0], c2 = [0, 0];
      const crownH = (x, z, out) => {
        const r = Math.hypot(x, z), fine = sst(900, 420, r);
        cell(x, z, 54, 0, c1); cell(x, z, 15, 5, c2);
        const dome = Math.sqrt(Math.min(1, c1[0] / 0.5)), sub = Math.sqrt(Math.min(1, c2[0] / 0.45));
        let hgt = 876 + 15 * dome + 9 * c1[1] * Math.min(1, c1[0] / 0.25) + 3.4 * sub * (0.35 + 0.65 * dome) * fine + 5 * noise.n2(x / 330 + 4, z / 330);
        let ao = dome * (0.55 + 0.45 * lerp(1, sub, fine)), tint = c1[1], dMin = 99;
        for (const T of A.trunks) { const d = Math.hypot(x - T.x, z - T.z); if (d < dMin) dMin = d;
          if (d < 46) { const e = 925 - (d / 36) * (d / 36) * 20 + 3.2 * sub; if (e > hgt) { hgt = e; ao = clamp(1.1 - d / 44, 0, 1) * (0.6 + 0.4 * sub); tint = 0.5 + 0.2 * h2(T.x, T.z, 9); } } }
        for (const E of emer) { const d = Math.hypot(x - E[0], z - E[1]); if (d < E[2]) { const q = Math.sqrt(1 - (d / E[2]) * (d / E[2])), e = 884 + E[3] * q + 3.5 * sub; if (e > hgt) { hgt = e; ao = (0.25 + 0.75 * q) * (0.6 + 0.4 * sub); tint = E[4] || 0.72; } } }
        if (r < 54) { const k = sst(54, 38, r) * sst(21, 28, dMin); hgt -= k * 36; ao *= 1 - 0.8 * k; }
        if (r < 260 && Math.abs((x - pTop.x) * dirTop.z - (z - pTop.z) * dirTop.x) < 30 && (x - pTop.x) * dirTop.x + (z - pTop.z) * dirTop.z < 60) { const q = path.nearestXZ(x, z); if (q.dist < 16 && q.y > 890) { let lim = q.y - 9.5 + 8.5 * sst(8.5, 16, q.dist); if (dMin < 26) lim = Math.max(lim, 907 - Math.max(0, dMin - 22.5) * 3.5);      // a leafy cutting; the two trunk tops beside it stay under leaves
            if (lim < hgt) { hgt = lim; ao = Math.max(ao, 0.55); } } }
        out[0] = hgt; out[1] = ao; out[2] = tint;
      };
      const S = 192, J = 112, KS = 5, RW = S + 1, NV = RW * (J + KS + 1), pos = new Float32Array(NV * 3), aA = new Float32Array(NV * 2), idx = [], o = [0, 0, 0];
      for (let jj = 0; jj <= J + KS; jj++) {
        const j = jj - KS, r = j <= 0 ? 38 : 38 * Math.pow(1700 / 38, Math.pow(j / J, 1.25));
        for (let s = 0; s <= S; s++) { const a = (s / S) * TAU + (jj % 2) * Math.PI / S, sa = Math.sin(a), ca = Math.cos(a), k = jj * RW + s;
          crownH(sa * r, ca * r, o);
          let rr = r, y = o[0], ao = o[1];
          if (j < 0) { const t = -j / KS; rr = 38 - 1.7 * Math.sin(t * Math.PI / 2); y -= (13 + 6 * noise.n2(sa * 7, ca * 7) + 4 * noise.n2(sa * 23 + 5, ca * 23)) * Math.pow(t, 1.4); ao *= 1 - 0.55 * t; }
          pos[k * 3] = sa * rr; pos[k * 3 + 1] = y; pos[k * 3 + 2] = ca * rr; aA[k * 2] = ao; aA[k * 2 + 1] = o[2];
          if (s === 64 || s === 128) await ctx.yield(); }
        await ctx.yield();
      }
      await ctx.yield();
      for (let j = 0; j < J + KS; j++) for (let s = 0; s < S; s++) { const a = j * RW + s, b = a + RW; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 2)); g.setIndex(idx); g.computeVertexNormals();
      await ctx.yield();
      const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide,
        uniforms: mkU(crU),
        vertexShader: /* glsl */`${FOGP_V} uniform float uT; attribute vec2 aA; varying vec3 vP,vN; varying vec2 vA;
          void main(){ vec3 p=position; p.y+=sin(uT*0.9+p.x*0.11+p.z*0.07)*0.35*aA.x; vP=p; vN=normal; vA=aA;
            vec4 mvPosition=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uCrSun,uCrAmb,uSunDir,uLeafA,uLeafB,uPale,uScarlet,uLipGold; varying vec3 vP,vN; varying vec2 vA;
          vec3 h33(vec3 p){ p=fract(p*vec3(0.1031,0.1030,0.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
          // 3D cellular leaf clumps (no stretching on steep faces): xyz = vector to the clump centre, w = distance; id = clump hash
          vec4 wor(vec3 x,out float id){ vec3 n=floor(x-0.5), f=x-n, mr=vec3(0.0), mi=n; float md=8.0;
            for(int k=0;k<2;k++) for(int j=0;j<2;j++) for(int i=0;i<2;i++){ vec3 g=vec3(float(i),float(j),float(k)); vec3 r=g+0.15+0.7*h33(n+g)-f; float d=dot(r,r); if(d<md){ md=d; mr=r; mi=n+g; } }
            id=h13(mi+7.3); return vec4(mr,sqrt(md)); }
          void main(){ vec3 N=normalize(vN); if(N.y<0.0) N=-N; float dist=distance(vP,uCamP), l1=smoothstep(520.0,150.0,dist), l2=smoothstep(170.0,30.0,dist), id1, id2;
            vec3 wp=vP+vec3(sin(uT*0.7+vP.z*0.05),0.0,cos(uT*0.6+vP.x*0.05))*0.35;
            vec3 wq=vec3(vn3(wp*0.21+3.0),vn3(wp*0.21+17.0),vn3(wp*0.21+31.0))-0.5, wr=vec3(vn3(wp*0.63+5.0),vn3(wp*0.63+23.0),vn3(wp*0.63+41.0))-0.5;
            vec4 w1=wor(wp/7.4+vn3(wp*0.07)*0.8+wq*0.7,id1), w2=wor(wp/2.3+w1.xyz*0.5+wq*1.3+wr*0.9,id2);
            float wind=vn3(vec3(vP.xz*0.02-uT*vec2(0.13,0.06),uT*0.08));
            float l3=smoothstep(34.0,8.0,dist), id3; vec4 lw=wor(wp/0.72+w2.xyz*0.4+wr*1.5,id3);             // leaf-sized clumps where the canopy is at the lens
            float f1=vn3(wp*vec3(1.9,2.6,1.9)+wr*2.0), f2=vn3(wp*vec3(5.3,6.0,5.3)+9.0), fleck=mix(0.5,f1*0.6+f2*0.4,l2);      // leaf-scale light and dark
            vec3 Nd=normalize(N-w1.xyz*0.45*l1-w2.xyz*0.8*l2-lw.xyz*1.1*l3+(vec3(f1,0.5,f2)-0.5)*0.7*l2);
            float ao=(0.42+0.58*smoothstep(0.0,0.7,vA.x))*(1.0-0.3*l1*smoothstep(0.3,0.8,w1.w))*(1.0-0.34*l2*smoothstep(0.25,0.75,w2.w))*(0.58+0.84*fleck)*(1.0-0.5*l3*smoothstep(0.2,0.62,lw.w))*mix(1.0,0.7+0.6*id3,l3);
            vec3 alb=mix(uLeafB*0.7,uLeafA,clamp(0.08+0.5*vA.y+0.42*vA.x,0.0,1.0));
            alb*=mix(1.0,0.7+0.6*id1,l1); alb=mix(alb,uPale*0.72,clamp(0.3*vA.x*vA.x+0.3*l2*step(0.62,id2)*(1.0-w2.w)+0.3*smoothstep(0.62,0.9,fleck)*vA.x,0.0,0.62)*mix(0.3,1.0,smoothstep(0.3,0.75,N.y)));      // (r4) steep banks are leaf-dark, not marbled pale
            alb=mix(uLeafB*0.3,alb,clamp(0.2+0.8*ao,0.0,1.0));
            alb=mix(alb,uScarlet*1.2,step(0.8,vA.y)*step(vA.y>0.955?0.45:0.78,id1)*smoothstep(0.6,0.3,w1.w)*l1);
            vec3 sd=normalize(uSunDir+normalize(vec3(uSunDir.x,0.0,uSunDir.z)+vec3(1e-3,0.0,0.0))*0.75);
            float dl=max(dot(Nd,sd),0.0)*0.7+0.3*max(N.y,0.0), w3=wind*wind*wind;
            float aoF=max(ao,0.6);                                                      // steep banks beside the entry are leaf-lit from within, never black
            vec3 col=alb*(uCrAmb*(0.4+0.6*Nd.y)*ao+uCrSun*dl*ao*(0.75+0.5*wind))+alb*uCrSun*0.4*w3*ao+alb*(uCrAmb*0.9+uCrSun*0.2+vec3(0.1,0.26,0.12)*smoothstep(60.0,12.0,dist))*aoF*(1.0-0.6*dl);
            // the underside, seen from inside the well, is leaf-light: sun coming through the canopy, emerald, never black
            float us=smoothstep(880.0,900.0,vP.y+20.0*step(900.0,uCamY))*step(0.0,dot(N,uCamP-vP));
            vec3 under=mix(uLeafB,uLeafA,0.3+0.5*fleck)*(uCrAmb*0.9+uCrSun*(0.3+0.5*fleck*id1)+vec3(0.05,0.14,0.07))*(0.6+0.4*ao)*(0.7+0.6*id3*l3);
            col=mix(under,col,us);
            col*=mix(0.8,1.0,smoothstep(36.5,42.0,length(vP.xz)));                       // emerald shadow on the inner lip
            col+=alb*uLipGold*smoothstep(84.0,34.0,length(vP.xz))*(0.35+0.65*fleck)*(0.5+0.5*ao);      // the light of the lamps far below, welling out of the mouth onto the leaves round it
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh); topOnly.push(mesh);
      await ctx.yield();
      // leaf rosettes standing on the crowns round the well and along the approach, so the near canopy is leaves, not surface
      const cs = rng.fork('crownLeaves'), NC = Math.round(2300 * dens);
      for (let t = 0; t < 26000 && crownSpots.length < NC; t++) {
        const a = cs.range(0, TAU), r0 = 39 + 190 * Math.pow(cs(), 1.6), near = cs.chance(0.5), al = cs.range(-10, 150), lt = cs.sign() * (6.5 + 55.5 * Math.pow(cs(), 1.7));
        const x = near ? pTop.x - dirTop.x * al - dirTop.z * lt : Math.sin(a) * r0, z = near ? pTop.z - dirTop.z * al + dirTop.x * lt : Math.cos(a) * r0, r = Math.hypot(x, z), q = path.nearestXZ(x, z);
        if ((t & 31) === 31) await ctx.yield();
        if (r < 39) continue;
        crownH(x, z, o); if (q.y > 890 && q.dist < 7.5 && o[0] > q.y - 15) continue;
        if (q.dist > 70 && r > 100 && cs.chance(0.6)) continue;
        if (o[1] < 0.5 && q.dist > 16 && cs.chance(q.dist < 60 ? 0.45 : 0.75)) continue;          // ridges and domes first, creases stay dark
        crownSpots.push([x, o[0] - 0.4, z, cs() * 0.999]);
      }
      // a thicket on the two leafy mounds (the covered trunk tops) that flank the entry: real leaves where the canopy is nearest the lens
      for (let t = 0, added = 0; t < 6000 && added < Math.round(540 * dens); t++) {
        const al = cs.range(18, 72), lt = cs.sign() * cs.range(7.5, 17.5), x = pTop.x - dirTop.x * al - dirTop.z * lt, z = pTop.z - dirTop.z * al + dirTop.x * lt, q = path.nearestXZ(x, z);
        if ((t & 31) === 31) await ctx.yield();
        if (Math.hypot(x, z) < 39 || q.dist < 7.5) continue;
        crownH(x, z, o); if (o[0] < q.y - 5) continue;
        crownSpots.push([x, o[0] - 0.4, z, cs() * 0.999]); added++;
      }
      // the skirt: wall-hung rosettes and strap leaves down the inside of the lip, thickest over the six trunk tops (w >= 1)
      for (let i = 0, n = Math.round(790 * dens); i < n; i++) {
        const a = cs.chance(0.7) ? (cs.int(0, 5) + 0.5) * Math.PI / 3 + cs.range(-0.36, 0.36) : cs.range(0, TAU), rr = 37.7 - cs.range(0, 1.3);
        crownH(Math.sin(a) * 38.2, Math.cos(a) * 38.2, o);
        skirtSpots.push([Math.sin(a) * rr, o[0] + 1 - Math.pow(cs(), 1.25) * 30, Math.cos(a) * rr, 1 + cs() * 0.999]);
        if ((i & 127) === 127) await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- second ring of twelve trunks: pale fog silhouettes seen through the gaps; behind them a wall of forest gloom in the
    // well's own depth colour, so from the lip the gaps under the canopy never show daylight
    const backU = { value: C(H.fog[0]) }, mistU = { value: C(H.fog[0]) }, goldU = { value: C('#ffb85a') }, mist0 = C(H.fog[1]).lerp(C(hour === 'dusk' ? '#e0c0a0' : '#9fe0c8'), 0.25).multiplyScalar(hour === 'night' ? 0.8 : 0.6), gold0 = C(hour === 'night' ? '#ffb45a' : hour === 'dusk' ? '#ffac58' : '#ffd070');
    {
      const B = makeBuf();
      for (let k = 0; k < 12; k++) { const a = (k + 0.5 + rng.range(-0.2, 0.2)) / 12 * TAU, d = rng.range(150, 185), rr = rng.range(17, 25);
        addTube(B, [new V3(Math.sin(a) * d, -60, Math.cos(a) * d), new V3(Math.sin(a) * d, 420, Math.cos(a) * d), new V3(Math.sin(a) * d, 864, Math.cos(a) * d)], () => rr, 10, () => [1, 1, 1], () => [0, 0, 0, 0]); }
      // both are fog-exempt and take their base tone from the view direction alone, so a trunk melts into the wall behind it
      const GB = /* glsl */`vec3 backCol(vec3 dv){ float g=mix(0.66,1.2,smoothstep(-0.5,0.42,dv.y)); return uBack*mix(1.0,g,smoothstep(-0.93,-0.62,dv.y)); }`;
      const m = new THREE.ShaderMaterial({ fog: true, uniforms: mkU({ uDim: { value: weather === 'mist' ? 0.24 : 0.36 }, uBack: backU, uMist: mistU, uGold: goldU }),
        vertexShader: /* glsl */`${FOGP_V} varying vec3 vP,vN; void main(){ vP=position; vN=normal; vec4 mvPosition=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform float uDim,uLamp; uniform vec3 uBack,uMist,uGold,uLeafA,uLeafB; varying vec3 vP,vN; ${GB}
          void main(){ vec3 dv=normalize(vP-uCamP), N=normalize(vN); float n=vn3(vec3(vP.xz*0.2,vP.y*0.012)), b1=vn3(vP*vec3(0.55,0.09,0.55)+5.0), b2=vn3(vP*vec3(0.07,0.03,0.07)+2.0);
            float k=min(uDim*mix(1.0,1.35,smoothstep(780.0,864.0,vP.y))*(0.5+0.4*n+0.3*b1+0.35*b2)*smoothstep(260.0,60.0,abs(vP.y-uCamY+30.0)),0.8);
            float rim=smoothstep(0.02,0.62,abs(dot(N.xz,normalize(dv.xz+vec2(1e-4,0.0))))); k*=rim;     // edges breathe out into the fog: silhouettes, not slabs (measured in plan, so it holds when the lens looks down the trunk)
            float kd=smoothstep(-0.93,-0.62,dv.y);
            // THE FAR TRUNKS ARE TREES (polish r4): they stood as flat tan and grey slabs in every gap. Now each carries fluted bark laid in
            // the well's own 13 m courses, hanging gardens with lit crowns, vines down the face and the lamps of other villages, all of it
            // melting into the mist at the silhouette. Worked out in world space from the bark's own normal, so it holds at every height.
            float an=atan(N.x,N.z+1e-4), flute=vn3(vec3(an*11.0,vP.y*0.035,vP.x*0.02+3.0)), fine=vn3(vec3(an*31.0,vP.y*0.11,7.0));
            float bark=flute*0.62+fine*0.38, cy13=vP.y/13.0+b2*1.5, course=smoothstep(0.36,0.5,abs(fract(cy13)-0.5));
            float gm=vn3(vec3(an*2.6+floor(cy13)*3.7,vP.y*0.05,vP.z*0.02))*0.6+vn3(vec3(an*8.0,vP.y*0.15,5.0))*0.4, gard=smoothstep(0.5,0.66,gm+0.16*course), gtop=smoothstep(0.66,0.5,gm)*gard;
            float vine=smoothstep(0.7,0.86,vn3(vec3(an*46.0,vP.y*0.012,9.0)))*smoothstep(0.3,0.6,vn3(vec3(an*5.0,vP.y*0.02,2.0)));
            float tex=(0.35+1.25*bark)*(1.0-0.45*course);
            vec3 base=backCol(dv)*(1.0-k*clamp(tex,0.0,1.25));
            vec3 leaf=mix(uLeafB,uLeafA,0.25+0.6*fine)*(dot(backCol(dv),vec3(0.5))*1.6+0.03)*(0.45+0.9*gtop+0.5*fine);
            base=mix(base,leaf,(0.62*gard+0.5*vine*(1.0-gard))*rim*step(0.001,k)*min(k*3.0,1.0));
            vec3 light=(uMist*(0.16+0.3*b2+0.22*n*(1.0-k))+uGold*0.2*smoothstep(0.12,-0.7,dv.y))*mix(1.0,(0.3+1.25*bark)*(1.0-0.5*course)*(1.0-0.55*gard),rim*0.85);
            vec2 g=vec2(an*7.0,vP.y*0.09), gi=floor(g), gf=fract(g)-0.5; float h=h13(vec3(gi,3.0)+floor(vP.x*0.01));
            float lamp=step(0.86,h)*smoothstep(0.16,0.03,length(gf-(vec2(h13(vec3(gi,5.0)),h13(vec3(gi,9.0)))-0.5)*0.6))*(0.75+0.25*sin(uT*2.6+h*40.0))*rim;
            gl_FragColor=vec4(base+light*kd+vec3(1.0,0.55,0.18)*lamp*(0.5+0.5*uLamp)*kd*smoothstep(880.0,700.0,vP.y),1.0); }` });
      const mesh = new THREE.Mesh(bufGeo(B), m); mesh.frustumCulled = false; scene.add(mesh);
      const bm = new THREE.ShaderMaterial({ fog: false, side: THREE.BackSide, uniforms: { uBack: backU, uCamP: U.uCamP, uT: U.uT, uMist: mistU, uGold: goldU, uLamp: U.uLamp },
        vertexShader: /* glsl */`varying vec3 vP; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vP=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */`uniform vec3 uBack,uCamP,uMist,uGold; uniform float uT,uLamp; varying vec3 vP; ${GB}
          float h13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
          float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
          void main(){ vec3 dv=normalize(vP-uCamP);
            float band=vn3(vec3(vP.x*0.045,vP.y*0.0022,vP.z*0.045))*0.62+vn3(vec3(vP.x*0.11,vP.y*0.006,vP.z*0.11)+7.0)*0.38, big=vn3(vP*vec3(0.009,0.005,0.009)+3.0);
            float k=smoothstep(-0.93,-0.62,dv.y);                                         // straight down it is the plain fog colour
            vec3 col=backCol(dv)*mix(1.0,(1.0-0.3*smoothstep(0.42,0.7,band))*(0.84+0.32*big),k);
            // beyond the second ring the forest goes on: banks of lit mist between far trunks, light slanting down through it,
            // the lamps of other villages, and the gold of the pool's light coming up from below
            float ang=atan(vP.x,vP.z+1e-4); vec2 d2=vP.xz/215.0;
            float t1=vn3(vec3(d2*13.0,vP.y*0.0035)), t2=vn3(vec3(d2*31.0+4.0,vP.y*0.007));
            float trunks=1.0-0.8*smoothstep(0.5,0.62,t1)-0.42*smoothstep(0.54,0.66,t2)*(1.0-smoothstep(0.5,0.62,t1));
            float mist=vn3(vec3(d2*3.2+uT*0.006,vP.y*0.011-uT*0.012))*0.6+vn3(vec3(d2*9.0+9.0,vP.y*0.034+uT*0.02))*0.4;
            float sh=vn3(vec3(d2*17.0+vP.y*0.021,uT*0.04)); sh=smoothstep(0.5,0.85,sh)*(0.4+0.6*band);
            float leafM=smoothstep(0.5,0.75,vn3(vec3(d2*26.0+5.0,vP.y*0.05))*0.6+vn3(vec3(d2*70.0,vP.y*0.16))*0.4);      // hanging leaf masses, darker
            vec3 lit=uMist*(0.22+1.0*mist*mist+0.8*sh)*trunks*(1.0-0.45*leafM);
            vec2 g=vec2(ang*23.0,vP.y*0.085), gi=floor(g), gf=fract(g)-0.5; float h=h13(vec3(gi,3.0));
            float clus=smoothstep(0.6,0.78,vn3(vec3(d2*5.0+11.0,vP.y*0.008)));
            float lamp=step(0.8,h)*clus*smoothstep(0.13,0.02,length(gf-(vec2(h13(vec3(gi,5.0)),h13(vec3(gi,9.0)))-0.5)*0.7))*(0.75+0.25*sin(uT*2.6+h*40.0));
            lit+=vec3(1.0,0.55,0.18)*lamp*(1.2+0.9*uLamp)+vec3(1.0,0.6,0.25)*clus*0.05*uLamp*trunks;
            float t3=vn3(vec3(d2*61.0+9.0,vP.y*0.012)); trunks*=1.0-0.5*smoothstep(0.5,0.62,t3);      // (r4) the gold is light BETWEEN far trunks and under leaf masses, never a flat wash
            lit+=uGold*(0.02+0.75*mist*mist+0.6*sh)*smoothstep(0.12,-0.7,dv.y)*trunks*trunks*(1.0-0.8*leafM);
            gl_FragColor=vec4(col+lit*k,1.0); }` });
      const back = new THREE.Mesh(new THREE.CylinderGeometry(215, 215, 1640, 40, 1, true), bm); back.position.y = 48; back.frustumCulled = false; scene.add(back);
    }

    await ctx.yield();
    // ---- the lit depth: banks of gold haze standing in the shaft far below the lens (the pool's and the village's light coming up
    // through the spray), so every look down has a warm destination and the stair is seen against it. Additive, fog-exempt,
    // depth-tested: basins, curtains and shelves nearer than a bank stand dark in front of it. The banks travel with the lens.
    const deepU = { value: 0 };
    {
      const dp = [], di = [], NL = 4, SEG = 20;
      for (let l = 0; l < NL; l++) { const b = dp.length / 3; dp.push(0, l, 0);
        for (let q = 0; q < SEG; q++) { const a = q / SEG * TAU; dp.push(Math.sin(a), l, Math.cos(a)); }
        for (let q = 0; q < SEG; q++) di.push(b, b + 1 + q, b + 1 + (q + 1) % SEG); }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setIndex(di); dg.boundingSphere = new THREE.Sphere(new V3(0, 450, 0), 2500);
      const dm = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uCamY: U.uCamY, uK: deepU, uGold: { value: gold0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`uniform float uCamY; varying vec3 vQ; varying float vF;
          void main(){ float l=position.y, off=62.0+l*46.0+l*l*9.0; vec3 p=vec3(position.x*58.0,max(uCamY-off,13.0+l),position.z*58.0); vQ=vec3(p.xz,l); vF=smoothstep(24.0,110.0,uCamY-off);      // a bank thins away before it would lie on the pool
            gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0); }`,
        fragmentShader: /* glsl */`uniform float uT,uK; uniform vec3 uGold; varying vec3 vQ; varying float vF;
          float h13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
          float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,0,1)+vec3(0,1,0)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
          void main(){ float r2=dot(vQ.xy,vQ.xy), l=vQ.z; float c=cos(uT*0.03+l), s=sin(uT*0.03+l); vec2 q=vec2(c*vQ.x-s*vQ.y,s*vQ.x+c*vQ.y);
            float n=vn3(vec3(q*0.07,l*7.0+uT*0.05))*0.65+vn3(vec3(q*0.21+3.0,l*3.0-uT*0.08))*0.35;
            float a=exp(-r2/1150.0)*(0.25+1.1*n*n)*(0.2+0.13*l)*(1.0-smoothstep(2600.0,3364.0,r2));
            gl_FragColor=vec4(uGold*uK*a*vF,1.0); }` });
      const deep = new THREE.Mesh(dg, dm); deep.frustumCulled = false; deep.renderOrder = 3; scene.add(deep);
    }
    await ctx.yield();

    // ---- the sky disc and its halo (fog-exempt, so "up" stays legible all the way down), and the god rays
    const shaftU = { value: 1 }; let plume = null;
    const discU = { uDisc: { value: 0 }, uDiscCol: { value: C(H.disc).multiplyScalar(H.discK) } };
    {
      const m = new THREE.ShaderMaterial({ uniforms: { ...discU, uT: U.uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`varying vec2 vQ; void main(){ vQ=position.xz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: /* glsl */`${G} uniform float uDisc; uniform vec3 uDiscCol; varying vec2 vQ;
          void main(){ float r=length(vQ); float n=vn3(vec3(vQ*0.16,uT*0.25))*0.6+vn3(vec3(vQ*0.5+3.0,uT*0.6))*0.4;
            float core=smoothstep(47.0,27.0,r+n*16.0)*(0.55+0.75*n); float halo=exp(-r*r/5200.0)*0.16;
            gl_FragColor=vec4(uDiscCol*uDisc*(core+halo)*(1.0-smoothstep(120.0,150.0,r)),1.0); }` });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(150, 40).rotateX(-Math.PI / 2), m); disc.position.y = 903; disc.renderOrder = 3; scene.add(disc);
      const rr = rng.fork('rays'), NR = 14, quad = new THREE.PlaneGeometry(2, 2);
      const gg = instGeo(quad, NR, { aG: [4, (i) => { const a = rr.range(0, TAU), r = rr.range(4, 34), w = rr.range(2.2, 6.5), wide = i < 4, rw = wide ? 1.5 + r * 0.24 : r;      // four broad beams close to the axis: the bright column down the middle
          const sd = rr(); if (i === 0) return [Math.sin(a) * 5, Math.cos(a) * 5, 4.4, 1.5];      // the one shaft from the mouth that travels all the way down, rain glinting in it
          return [Math.sin(a) * rw, Math.cos(a) * rw, i === 2 || i === 3 || i >= 10 ? 0 : wide ? 7 + w * 0.5 : w, sd]; }] });
      const rm = new THREE.ShaderMaterial({ uniforms: mkU({ uRay: { value: C(H.ray).multiplyScalar(H.rayK * (weather === 'mist' ? 1.6 : 1)) }, uDisc: discU.uDisc }),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`uniform float uCamY,uT; uniform vec3 uCamP; attribute vec4 aG; varying vec3 vL,vW; varying float vY,vS;
          void main(){ vec2 dx=aG.xy-uCamP.xz+vec2(1e-3,0.0); float dh=length(dx); vec2 rt=vec2(-dx.y,dx.x)/dh;
            float y=min(uCamY+mix(-135.0,70.0,position.y*0.5+0.5),902.0);
            vec3 p=vec3(aG.x+rt.x*position.x*aG.z,y,aG.y+rt.y*position.x*aG.z);
            vL=vec3(position.x,(y-uCamY),aG.w>1.25?1.1*smoothstep(2.0,9.0,dh):aG.z>6.9?0.24*smoothstep(aG.z*0.3,aG.z*1.3,dh):0.6*smoothstep(aG.z*0.8,aG.z*3.0,dh)); vY=y; vS=aG.w; vW=p;
            gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0); }`,
        fragmentShader: /* glsl */`${G} uniform vec3 uRay; uniform float uDisc; varying vec3 vL,vW; varying float vY,vS;
          void main(){ float a=1.0-vL.x*vL.x; a*=a; a*=smoothstep(-135.0,-70.0,vL.y)*(1.0-smoothstep(30.0,70.0,vL.y));
            float fl=vn3(vec3(vS*37.0,vY*0.018-uT*0.22,uT*0.45+vS*9.0)); a*=0.35+1.1*fl*fl;
            float gl=vn3(vec3(vW.x*2.3,vW.y*0.8+uT*15.0,vW.z*2.3)); gl*=gl; gl*=gl; gl*=gl; a*=1.0+9.0*gl*step(1.25,vS);
            a*=mix(1.0,0.55,smoothstep(0.0,880.0,900.0-vY))*vL.z*uSunGain*uDisc*smoothstep(1.0,13.0,distance(vW,uCamP));
            gl_FragColor=vec4(uRay*a,1.0); }` });
      const rays = new THREE.Mesh(gg, rm); rays.frustumCulled = false; rays.renderOrder = 4; scene.add(rays);
      // seen from the canopy: shafts of light standing in the mouth and a breath of mist rising out of it, so the well is
      // the signature of the first view (and of the view through the previous portal)
      const sg = instGeo(quad, 16, { aG: [4, () => { const a = rr.range(0, TAU), r = rr.range(3, 32); return [Math.sin(a) * r, Math.cos(a) * r, rr.range(1.5, 4.2), rr()]; }] });
      const sm = new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uCamP: U.uCamP, uRay: { value: C(H.ray).multiplyScalar(H.rayK * 2.2) }, uSd: { value: sunDir }, uK: shaftU },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`uniform vec3 uCamP,uSd; attribute vec4 aG; varying vec3 vL;
          void main(){ float t=position.y*0.5+0.5; vec3 d=normalize(uSd+vec3(aG.x*0.014,0.8,aG.y*0.014)); vec3 c=vec3(aG.x,866.0,aG.y)+d*(t*(175.0+95.0*aG.w));
            vec3 rt=normalize(cross(d,c-uCamP)+vec3(1e-4,0.0,0.0)); vec3 p=c+rt*position.x*aG.z*1.5*(1.0+1.2*t); vL=vec3(position.x,t,aG.w);
            gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0); }`,
        fragmentShader: /* glsl */`${G} uniform vec3 uRay; uniform float uK; varying vec3 vL;
          void main(){ float a=1.0-vL.x*vL.x; a*=a*smoothstep(0.0,0.1,vL.y)*(1.0-vL.y)*(1.0-vL.y);
            float fl=vn3(vec3(vL.z*37.0,vL.y*3.0-uT*0.15,uT*0.3+vL.z*9.0)); gl_FragColor=vec4(uRay*uK*a*(0.35+1.1*fl),1.0); }` });
      const shafts = new THREE.Mesh(sg, sm); shafts.frustumCulled = false; shafts.renderOrder = 4; scene.add(shafts); topOnly.push(shafts);
      await ctx.yield();
      plume = fx.makeSmokeColumn({ rng: rng.fork('plume'), time: fxTime, position: [0, 868, 0], height: 84, radius: [5, 15], size: [9, 21], count: 28, color: hour === 'night' ? '#5d7f8c' : hour === 'dusk' ? '#f3c79c' : '#e6f2df', colorTop: hour === 'night' ? '#8fb0c0' : hour === 'dusk' ? '#ffe2c0' : '#ffffff',
        shadowColor: hour === 'night' ? '#1c3038' : hour === 'dusk' ? '#8a6a70' : '#9fc3a6', ambient: hour === 'night' ? '#16262c' : hour === 'dusk' ? '#6a5560' : '#6f9078', opacity: 0.14, rate: 0.03, wind: [0.5, 0, 0.2], bend: 0.2, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: H.crownSun });
      scene.add(plume.object); topOnly.push(plume.object);
    }
    await ctx.yield();

    // ---- static growth and the built world: gap branches, organ-pipe roots, the hanging village, the giants
    const B = makeBuf(), sr = rng.fork('static');
    const cBark = lin(PALETTE[5]), cBarkD = [0.05, 0.032, 0.022], cRope = [0.4, 0.31, 0.19], cWeave = [0.5, 0.37, 0.18], cWeaveD = [0.26, 0.18, 0.09], cAmber = lin('#FFB45A');
    const F0 = [0, 0, 0, 0], cBarkS = [0.26, 0.2, 0.13];
    const gapPoint = (g, rr, lat, y) => { const a = g * Math.PI / 3; return new V3(Math.sin(a) * rr + Math.cos(a) * lat, y, Math.cos(a) * rr - Math.sin(a) * lat); };
    const branches = [];
    const addBranch = (g, y, rr, rad) => {
      const dy = sr.range(-5, 5), arch = sr.range(1, 5), pp = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6; pp.push(gapPoint(g, rr + Math.sin(t * Math.PI) * sr.range(-1.5, 1.5), lerp(-14, 14, t), y + dy * (t - 0.5) + Math.sin(t * Math.PI) * arch)); }
      addTube(B, pp, (t) => rad * (1.25 - 0.5 * Math.sin(t * Math.PI)), 7, () => cBarkS, () => F0);
      const br = { g, y: y + arch, rr, rad, mid: pp[3].clone(), dir: new V3().subVectors(pp[4], pp[2]).normalize() }; branches.push(br); return br;
    };
    for (let g = 0; g < 6; g++) {
      let y = 872 - sr.range(0, 25);
      while (y > 62) { if ((y > 78 || (g !== 0 && g !== 3)) && (y > 470 || y < 320) && sr.chance(0.6)) addBranch(g, y, sr.range(46, 59), sr.range(1.3, 3.4)); y -= sr.range(20, 40); }
    }
    await ctx.yield();
    // organ-pipe aerial roots: under the deep basins, and long ones in the gaps
    const addPipe = (x, z, yTop, len, rad, ph) => {
      const pp = [], n = 7; let ok = n;
      for (let i = 0; i <= n; i++) { const t = i / n, y = yTop - len * t; if (y < 46 && !path.isClear(x, y, z, rad, 9)) { ok = i; break; } pp.push(new V3(x + Math.sin(t * 5 + ph) * 0.6 * t, y, z + Math.cos(t * 4 + ph) * 0.6 * t)); }
      if (pp.length < 3) return;
      addTube(B, pp, (t) => rad * (1 - 0.72 * t), 5, (t) => [lerp(0.34, 0.62, t), lerp(0.3, 0.64, t), lerp(0.2, 0.44, t)], (t) => [t * t * 1.3, 0, 0, ph]);
    };
    for (let i = 26; i < A.basinCount; i++) {
      const b = A.basinAt(i), n = i > 44 ? sr.int(1, 3) : (sr.chance(0.4) ? 1 : 0);
      for (let k = 0; k < n; k++) { const a = b.angle + sr.range(-0.2, 0.2), r = SR + sr.range(-5.5, 7), x = Math.sin(a) * r, z = Math.cos(a) * r;
        const len = sr.range(40, 122); if (b.y - len < 150 && !path.isClear(x, Math.max(b.y - len, 40), z, 1, 10)) continue;
        addPipe(x, z, b.y - 2.6, Math.min(len, b.y - 14), sr.range(0.35, 1.0), sr.range(0, TAU)); }
    }
    for (let g = 0; g < 6; g++) for (let k = 0; k < 5; k++) { const p = gapPoint(g, sr.range(44, 60), sr.range(-8, 8), 0), yT = sr.range(150, 330), len = sr.range(90, 230);
      addPipe(p.x, p.z, yT, (g === 0 || g === 3) ? Math.min(len, yT - 66) : len, sr.range(0.5, 1.3), sr.range(0, TAU)); }
    await ctx.yield();

    const nB0 = B.i.length;                                      // everything added to B from here on belongs to the village and is drawn only below y = 720
    // the hanging village, 480-560 m down: woven pods with amber windows and a lantern over every roof, rope bridges, laundry
    const lampPos = [], pods = [], bridges = [];
    const cRoof = [0.5, 0.42, 0.2], cRoofD = [0.27, 0.21, 0.1], cVine = [0.3, 0.3, 0.14], F4 = [0, 0, 4, 0];
    const addPod = (c, topY, ph) => {
      const sw = 0.3, fxp = [sw, 0.17, 1, ph], R = sr.range(2.3, 3.0), hgt = R * sr.range(1.1, 1.35);
      addBlob(B, c, new V3(R, 0, 0), new V3(0, hgt, 0), new V3(0, 0, R), cWeave, cWeaveD, fxp, 12, 7);
      { const y0 = c.y + hgt * 0.5, rp = [R * 1.2, R * 0.86, R * 0.5, R * 0.2, 0.14], yp = [0, 0.3, 0.62, 0.9, 1.12];
        addTube(B, yp.map((k) => new V3(c.x, y0 + k * hgt, c.z)), (t) => rp[Math.round(t * 4)], 12, (t) => [lerp(cRoofD[0], cRoof[0], t), lerp(cRoofD[1], cRoof[1], t), lerp(cRoofD[2], cRoof[2], t)], () => [sw, 0.08, 1, ph]); }
      const toAxis = Math.atan2(-c.x, -c.z), nW = 5;
      for (let w = 0; w < nW; w++) { const a = toAxis + (w - 2) * 1.2 + sr.range(-0.2, 0.2), d = new V3(Math.sin(a), 0, Math.cos(a)), s = new V3(d.z, 0, -d.x), q = c.clone().addScaledVector(d, R * 0.99);
        const ws = 0.6, wh = 1.0, fw = [sw, 1.15, 5, ph];      // windows 1.2 x 1.6 m, bright enough to bloom
        addQuad(B, q.clone().addScaledVector(s, -ws).add(new V3(0, -wh * 0.6, 0)), q.clone().addScaledVector(s, ws).add(new V3(0, -wh * 0.6, 0)), q.clone().addScaledVector(s, ws).add(new V3(0, wh, 0)).addScaledVector(d, -0.12), q.clone().addScaledVector(s, -ws).add(new V3(0, wh, 0)).addScaledVector(d, -0.12), cAmber, fw, fw);
        if (w === 2) lampPos.push([q.x + d.x * 0.3, q.y, q.z + d.z * 0.3]); }
      // a lantern on the hanging rope above the roof: from above (where the camera is) each house is a point of amber light
      const ly = c.y + hgt * 1.28 + 1.0;
      addBlob(B, new V3(c.x + 0.45, ly, c.z), new V3(0.3, 0, 0), new V3(0, 0.38, 0), new V3(0, 0, 0.3), cAmber, cAmber, [sw, 1.4, 1, ph], 6, 4);
      lampPos.push([c.x + 0.45, ly, c.z]);
      addTube(B, [new V3(c.x, c.y + hgt, c.z), new V3(c.x, (c.y + topY) / 2, c.z), new V3(c.x, topY, c.z)], () => 0.14, 4, () => cVine, (t) => [sw * (1 - t), 0, 4, ph]);
      pods.push({ c, R, ph });
    };
    const villageBranches = [];
    for (let g = 0; g < 6; g++) for (const y of [432, 394]) if (sr.chance(0.85)) villageBranches.push(addBranch(g, y + sr.range(-8, 8), sr.range(46, 54), sr.range(1.5, 2.4)));
    for (const br of villageBranches) for (const lat of [-5.5, 5.5]) { if (pods.length >= 24 || sr.chance(0.2)) continue;
      const c = gapPoint(br.g, br.rr + sr.range(-2, 2), lat + sr.range(-1.5, 1.5), br.y - sr.range(9, 20)); addPod(c, br.y - 0.5, sr.range(0, TAU)); }
    // sixteen pods hung in the stair itself, each placed where the camera will be looking when it is 22-60 m above it
    const ring = [];
    for (let tries = 0; tries < 2500 && ring.length < 16; tries++) {
      const y = sr.range(338, 426), th = thAtY(y + sr.range(22, 60)), a = hand * ((90 - th) * D2R + sr.range(0.1, 1.5)), r = sr.range(24.5, 30.5), x = Math.sin(a) * r, z = Math.cos(a) * r, dy = stairDy(x, z, y);
      if (dy < 78 || dy > 112 || ring.some((q) => Math.hypot(q.x - x, q.z - z) < 9 && Math.abs(q.y - y) < 12)) continue;
      ring.push({ x, y, z, a, top: y + (150 - dy) - 1.2 });
    }
    await ctx.yield();
    for (const q of ring) addPod(new V3(q.x, q.y, q.z), q.top, sr.range(0, TAU));
    await ctx.yield();
    const villageC = new V3(0, 385, 0); if (ring.length) { villageC.set(0, 0, 0); for (const q of ring) villageC.add(new V3(q.x, q.y, q.z)); villageC.multiplyScalar(1 / ring.length); }
    // rope bridges between neighbouring ring pods; laundry lines between others
    ring.sort((p, q) => p.y - q.y);
    const cloths = [lin('#F6F0B8'), lin('#FF5A3C'), lin('#BFE9F2'), lin('#FFB45A'), [0.5, 0.5, 0.46]], used = new Set();
    const span = (p, q, force) => {
      const d = Math.hypot(p.x - q.x, p.z - q.z);
      const mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, my = (p.y + q.y) / 2 - 2.5;
      if (!force && (d > 26 || d < 8 || Math.abs(p.y - q.y) > 13 || !stairClear(mx, mz, my, 26, 118) || Math.hypot(mx, mz) < 26)) return false;
      const along = new V3(q.x - p.x, 0, q.z - p.z).normalize(), side = new V3(along.z, 0, -along.x), N = 10, ph = sr.range(0, TAU), laundry = !force && bridges.length >= 2 && sr.chance(0.45);
      const at = (t) => new V3(lerp(p.x, q.x, t), lerp(p.y, q.y, t) - 1.2 - Math.sin(t * Math.PI) * 2.6, lerp(p.z, q.z, t));
      for (let k = 0; k < N; k++) { const t0 = k / N, t1 = (k + 1) / N, a0 = at(t0), a1 = at(t1), s0 = Math.sin(t0 * Math.PI) * 0.35, s1 = Math.sin(t1 * Math.PI) * 0.35;
        if (laundry) { if (k % 2 === 0 || k === N - 1) continue; const col = sr.pick(cloths), w = 0.42, dr = sr.range(1.3, 2.1);
          addQuad(B, a0.clone().lerp(a1, 0.5 - w), a0.clone().lerp(a1, 0.5 + w), a0.clone().lerp(a1, 0.5 + w).add(new V3(0, -dr, 0)), a0.clone().lerp(a1, 0.5 - w).add(new V3(0, -dr, 0)), col, [s0, 0, 2, ph], [s1, 0, 2, ph], [s1 + 0.7, 0, 2, ph + k], [s0 + 0.7, 0, 2, ph + k]);
        } else addQuad(B, a0.clone().addScaledVector(side, -0.7), a0.clone().addScaledVector(side, 0.7), a1.clone().addScaledVector(side, 0.7), a1.clone().addScaledVector(side, -0.7), k % 2 ? cWeave : cWeaveD, [s0, 0.1, 2, ph], [s0, 0.1, 2, ph], [s1, 0.1, 2, ph], [s1, 0.1, 2, ph]); }
      for (const e of laundry ? [0] : [-0.75, 0.75]) { const rail = []; for (let k = 0; k <= N; k++) rail.push(at(k / N).addScaledVector(side, e).add(new V3(0, laundry ? 0 : 1.1, 0)));
        addTube(B, rail, () => 0.09, 3, () => cRope, (t) => [Math.sin(t * Math.PI) * 0.35, 0, 4, ph]); }
      if (!laundry) { const nb = bridges.length;      // washing pegged along one rail of every bridge
        for (let k = 1; k < N - 1; k++) { if ((k + nb) % 3 === 0) continue; const t0 = (k + 0.12) / N, t1 = (k + 0.88) / N, a0 = at(t0).addScaledVector(side, 0.75), a1 = at(t1).addScaledVector(side, 0.75), dr = 1.2 + 0.4 * ((k * 7 + nb) % 3);
          a0.y += 1.05; a1.y += 1.05; const s0 = Math.sin(t0 * Math.PI) * 0.35, s1 = Math.sin(t1 * Math.PI) * 0.35;
          addQuad(B, a0, a1, a1.clone().add(new V3(0, -dr, 0)), a0.clone().add(new V3(0, -dr, 0)), cloths[(k * 3 + nb) % cloths.length], [s0, 0.06, 2, ph], [s1, 0.06, 2, ph], [s1 + 0.6, 0.06, 2, ph + k], [s0 + 0.6, 0.06, 2, ph + k]); }
        bridges.push({ p: [p.x, p.y, p.z], q: [q.x, q.y, q.z], ph }); }
      return true;
    };
    for (let i = 0; i < ring.length; i++) for (let j = i + 1; j < ring.length && j < i + 4; j++) { const k = i + ':' + j; if (!used.has(i) || !used.has(j)) if (span(ring[i], ring[j], false)) { used.add(i); used.add(j); used.add(k); } }
    for (let i = 0; bridges.length < 2 && i + 1 < ring.length; i++) span(ring[i], ring[i + 1], true);
    // lift ropes: one pair near the axis (9 m inside the camera helix), two pairs at gap mouths. Each rope is part of its
    // basket and ends there, so no line runs on below a basket through the middle of the view.
    const liftA = sr.range(0, TAU), liftLines = [];
    for (const [r, a] of [[5.5, liftA], [5.5, liftA + Math.PI], [40.5, Math.PI / 3 * sr.pick([1, 2])], [42.5, Math.PI / 3 * sr.pick([1, 2]) + 0.05], [40.5, Math.PI / 3 * sr.pick([4, 5])], [42.5, Math.PI / 3 * sr.pick([4, 5]) + 0.05]])
      liftLines.push({ x: Math.sin(a) * r, z: Math.cos(a) * r });
    await ctx.yield();

    // the hanging giants: sloth-like, 20 m long, moving hand over hand beneath their branches
    const cFur = [0.085, 0.07, 0.052], cMoss = [0.11, 0.24, 0.07];
    {
      const gaps = sr.shuffle([1, 2, 4, 5, 0, 3]), ys = sr.shuffle([292, 478, 566]);
      for (let n = 0; n < giantCount; n++) {
        const br = addBranch(gaps[n], ys[n], 47.5, 3.0), d = br.dir, up = new V3(0, 1, 0), pr = new V3().crossVectors(d, up).normalize(), M = br.mid.clone(), da = Math.atan2(d.z, d.x) + n * TAU, fb = [0, 0, 3, da];
        const flip = sr.sign(), dd = d.clone().multiplyScalar(flip);
        const body = M.clone().add(new V3(0, -7.2, 0));
        addBlob(B, body, dd.clone().multiplyScalar(6.6), up.clone().multiplyScalar(2.7), pr.clone().multiplyScalar(3.0), cFur, cMoss, fb, 10, 7);
        const head = body.clone().addScaledVector(dd, 7.6).add(new V3(0, 1.3, 0)), fh = [0.5, 0, 3, da];
        addBlob(B, head, dd.clone().multiplyScalar(2.3), up.clone().multiplyScalar(1.9), pr.clone().multiplyScalar(2.0), cFur, [0.13, 0.11, 0.08], fh, 8, 6);
        addBlob(B, head.clone().addScaledVector(dd, 1.9).add(new V3(0, -0.5, 0)), dd.clone().multiplyScalar(1.0), up.clone().multiplyScalar(0.8), pr.clone().multiplyScalar(0.95), [0.16, 0.13, 0.1], [0.1, 0.08, 0.06], fh, 6, 4);
        for (const e of [-1, 1]) addBlob(B, head.clone().addScaledVector(dd, 1.55).addScaledVector(pr, e * 1.0).add(new V3(0, 0.35, 0)), dd.clone().multiplyScalar(0.3), up.clone().multiplyScalar(0.3), pr.clone().multiplyScalar(0.3), cAmber, cAmber, [0.5, 0.8, 3, da], 5, 3);
        let li = 0;
        for (const fa of [1, -1]) for (const e of [-1, 1]) { const sgn = (li++ % 3 === 0) ? 1 : -1;
          const sh = body.clone().addScaledVector(dd, fa * 4.4).addScaledVector(pr, e * 1.9).add(new V3(0, 0.8, 0));
          const handP = M.clone().addScaledVector(dd, fa * (5.4 + e * 1.3)).addScaledVector(pr, e * 0.9).add(new V3(0, -br.rad * 0.8, 0));
          const elbow = sh.clone().lerp(handP, 0.5).addScaledVector(pr, e * 2.2).add(new V3(0, 0.8, 0));
          const curve = new THREE.QuadraticBezierCurve3(sh, elbow, handP);
          addTube(B, curve.getPoints(6), (t) => 0.95 - 0.35 * t, 6, () => cFur, (t) => [sgn * t, 0, 3, da]);
          addBlob(B, handP, dd.clone().multiplyScalar(0.9), up.clone().multiplyScalar(0.7), pr.clone().multiplyScalar(0.8), cFur, cFur, [sgn, 0, 3, da], 6, 3); }
      }
    }
    await ctx.yield();
    // ---- THE WALLS ARE A PLACE. On the courses of the strata, shelves stand out of the trunk faces that look into the well, and
    // each storey furnishes them in its own way: gardens of bromeliads and orchids under the crowns, pools stepping down like
    // rice terraces and spilling one into the next, plank balconies with lanterns in the village, and ranks of pale organ-pipe
    // roots hanging from the lowest shelves. Everything here is static geometry with its motion in the shaders.
    const wr = makeRng(hashSeed(ctx.seed + ':wall')), lr = makeRng(hashSeed(ctx.seed + ':lamps')), detail = ctx.quality?.detail ?? 1;
    const WB = { p: [], n: [], c: [], w: [], i: [] }, WL = { p: [], n: [], c: [], w: [], i: [] };      // upper storeys / lower storeys
    const FU = { p: [], n: [], c: [], w: [], i: [] }, FL = { p: [], n: [], c: [], w: [], i: [] };      // their falling water (transparent)
    const WT = { p: [], n: [], c: [], w: [], i: [] }, FT = { p: [], n: [], c: [], w: [], i: [] }, fallBuf = new Map([[WB, FU], [WT, FT], [WL, FL]]);   // the terraces
    const PB = makeBuf();                                                                             // organ pipes (static material)
    const wv = (Wb, x, y, z, nx, ny, nz, c, k, a, b, sd) => { const l = Math.hypot(nx, ny, nz) || 1; Wb.p.push(x, y, z); Wb.n.push(nx / l, ny / l, nz / l); Wb.c.push(c[0], c[1], c[2]); Wb.w.push(k, a, b, sd); return Wb.p.length / 3 - 1; };
    const _f = new V3();
    // a point on the inward face of trunk k: beta = angle round the trunk from its inward direction, off = metres out of the bark
    const face = (k, beta, y, off) => { const ac = (k + 0.5) * Math.PI / 3, b = ac + Math.PI + beta, R = trunkRadius(k, Math.PI / 2 - b, y) + off;
      return { x: 60 * Math.sin(ac) + Math.sin(b) * R, z: 60 * Math.cos(ac) + Math.cos(b) * R, nx: Math.sin(b), nz: Math.cos(b) }; };
    const courseY = (k, n) => 13 * n - 3 * Math.sin(k * 2.4);                                         // top line of course n on trunk k (same as the bark shader)
    const cMossT = [0.16, 0.36, 0.1], cMossD = [0.07, 0.2, 0.08], cPoolF = [0.05, 0.16, 0.15], cPlank = [0.42, 0.3, 0.17], cGill = [0.27, 0.21, 0.13], cTrav = [0.6, 0.56, 0.42], cTravL = [0.86, 0.84, 0.7], cTravD = [0.4, 0.34, 0.22], cPoolG = [0.05, 0.6, 0.5];
    const shelves = [];
    // sub: 0 moss garden, 1 pool, 2 plank deck. Returns the shelf record (lip points along it) or null where the stair is in the way.
    const addShelf = (Wb, k, y, b0, b1, depth, sub) => {
      const mid = face(k, (b0 + b1) / 2, y, depth * 0.5), dy = stairDy(mid.x, mid.z, y);
      if (dy < 9 || dy > 136) return null;
      const segs = Math.max(5, Math.round((b1 - b0) / 0.12)), sd = wr(), base = Wb.p.length / 3, lip = [], NR = 5;
      const top = sub === 3 ? cTrav : sub === 1 ? cPoolF : sub === 2 ? cPlank : cMossT, pool = sub === 1 || sub === 3;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs, f = face(k, lerp(b0, b1, t), y, -0.7), tp = Math.pow(Math.sin(Math.PI * t), sub === 2 ? 0.3 : sub === 3 ? 0.36 : 0.55), d = Math.max(0.5, depth * tp * (1 + 0.1 * Math.sin(t * 17 + sd * 40)));
        const rim = sub === 3 ? 0.6 : sub === 1 ? 0.34 : sub === 2 ? 0.02 : 0.12, dish = sub === 3 ? -0.9 : sub === 1 ? -0.55 : sub === 2 ? 0 : 0.22;
        const rows = [[0.0, 0.1, 0, 1, 0, 0], [0.55, dish, 0, 1, 0, 0.5], [0.94, rim, 0.3, 1, 0, 0.9], [1.0, -0.3, 1, -0.1, 0, 1.0], [0.0, -2.2 - 0.42 * d, 0.6, -0.8, 0, 2.0]];
        for (const [fr, hy, no, ny, , v] of rows) wv(Wb, f.x + f.nx * (0.7 + d * fr), y + hy, f.z + f.nz * (0.7 + d * fr), f.nx * no, ny, f.nz * no, v > 1.2 ? (sub === 3 ? cTravD : cGill) : v > 0.95 ? (sub === 3 ? cTravL : cMossD) : top, sub * 0.1, t * (b1 - b0) * 19, v, sd);
        lip.push({ x: f.x + f.nx * (0.7 + d), z: f.z + f.nz * (0.7 + d), nx: f.nx, nz: f.nz, d, wx: f.x, wz: f.z });
      }
      for (let s = 0; s < segs; s++) for (let r = 0; r < NR - 1; r++) { const a = base + s * NR + r, b = a + NR; Wb.i.push(a, b, a + 1, a + 1, b, b + 1); }
      if (pool) { // the water: a sheet just under the rim
        const wb = Wb.p.length / 3;
        for (let s = 0; s <= segs; s++) { const L = lip[s]; for (const fr of [0.02, 0.9]) wv(Wb, L.wx + L.nx * (0.7 + L.d * fr), y + (sub === 3 ? 0.42 : 0.2), L.wz + L.nz * (0.7 + L.d * fr), 0, 1, 0, sub === 3 ? cPoolG : cPoolF, 1, s / segs, fr, sd); }
        for (let s = 0; s < segs; s++) { const a = wb + s * 2, b = a + 2; Wb.i.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      const rec = { k, y, b0, b1, depth, sub, lip, segs, sd }; shelves.push(rec); return rec;
    };
    // a sheet of falling water from the lip at parameter t (0..1 along the shelf), H metres down, half-width hw metres
    const addFall = (W0, S, t, H, hw) => {
      const Wb = fallBuf.get(W0), s = clamp(Math.round(t * S.segs), 1, S.segs - 1), L = S.lip[s], tx = L.nz, tz = -L.nx, sd = wr(), base = Wb.p.length / 3, NV = 4;
      for (let v = 0; v <= NV; v++) { const q = v / NV, out = 0.25 + 1.5 * Math.sqrt(q) * Math.min(1, H / 10);
        for (const e of [-1, 0, 1]) wv(Wb, L.x + tx * e * hw * (1 + 0.25 * q) + L.nx * out, S.y + 0.25 - H * q, L.z + tz * e * hw * (1 + 0.25 * q) + L.nz * out, L.nx, 0.2, L.nz, [q, 1, 1], 2, e, q * H / 13, sd); }
      for (let v = 0; v < NV; v++) for (let e = 0; e < 2; e++) { const a = base + v * 3 + e, b = a + 3; Wb.i.push(a, a + 1, b, a + 1, b + 1, b); }
    };
    // a rosette of strap leaves (bromeliad): heart colour hc at the base of each leaf, green at the tip
    const addRosette = (Wb, x, y, z, R, hc, nl) => {
      const sd = wr(), a0 = wr() * TAU;
      for (let j = 0; j < nl; j++) { const a = a0 + j / nl * TAU + wr.range(-0.2, 0.2), el = wr.range(0.35, 1.0), dx = Math.cos(a) * Math.cos(el), dz = Math.sin(a) * Math.cos(el), dyv = Math.sin(el), L = R * wr.range(0.75, 1.15), w = L * 0.17, base = Wb.p.length / 3;
        const g = [wr.range(0.1, 0.2), wr.range(0.36, 0.52), wr.range(0.06, 0.14)];
        for (let q = 0; q <= 2; q++) { const t = q / 2, ww = w * (1 - 0.75 * t * t), px = x + dx * L * t, py = y + dyv * L * t - 0.45 * L * t * t, pz = z + dz * L * t, c = q === 0 ? hc : q === 1 ? [lerp(hc[0], g[0], 0.6), lerp(hc[1], g[1], 0.6), lerp(hc[2], g[2], 0.6)] : g;
          wv(Wb, px - dz * ww, py + 0.12 * ww, pz + dx * ww, -dx * 0.5, 1, -dz * 0.5, c, 3, -1, t, sd); wv(Wb, px + dz * ww, py + 0.12 * ww, pz - dx * ww, -dx * 0.5, 1, -dz * 0.5, c, 3, 1, t, sd); }
        for (let q = 0; q < 2; q++) { const a2 = base + q * 2; Wb.i.push(a2, a2 + 1, a2 + 2, a2 + 1, a2 + 3, a2 + 2); } }
    };
    // a hanging vine or orchid spray from a lip point: a ribbon L metres long with blossoms of colour bc along it
    const addVine = (Wb, Lp, L, bc) => {
      const sd = wr(), base = Wb.p.length / 3, tx = Lp.nz, tz = -Lp.nx, w = 0.16 + 0.1 * wr(), NQ = 4, g = [0.12, 0.34, 0.1];
      for (let q = 0; q <= NQ; q++) { const t = q / NQ, c = bc && q > 0 && (q & 1) ? bc : g, ww = bc && (q & 1) ? w * 3.2 : w;
        wv(Wb, Lp.x - tx * ww + Lp.nx * 0.2, Lp.y - 0.3 - L * t, Lp.z - tz * ww + Lp.nz * 0.2, Lp.nx, 0.3, Lp.nz, c, 4, -1, t * L, sd); wv(Wb, Lp.x + tx * ww + Lp.nx * 0.2, Lp.y - 0.3 - L * t, Lp.z + tz * ww + Lp.nz * 0.2, Lp.nx, 0.3, Lp.nz, c, 4, 1, t * L, sd); }
      for (let q = 0; q < NQ; q++) { const a = base + q * 2; Wb.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    };
    const addFallAt = (Wb, x, y, z, nx, nz, H, hw) => addFall(Wb, { y: y - 0.25, segs: 2, lip: [null, { x, z, nx, nz }, null] }, 0.5, H, hw);
    const HEARTS = [lin('#FF5A3C'), lin('#FF9A2E'), lin('#E8408A'), lin('#FFD23C'), lin('#FF5A3C')], ORCH = [lin('#F6F0B8'), lin('#FFB0D0'), lin('#FFE27A'), lin('#E8408A')];
    const lipAt = (S, t, fr = 1) => { const s = clamp(Math.round(t * S.segs), 0, S.segs), L = S.lip[s]; return { x: L.wx + L.nx * (0.7 + L.d * fr), y: S.y, z: L.wz + L.nz * (0.7 + L.d * fr), nx: L.nx, nz: L.nz }; };
    const terraces = [];
    // where the Cathedral hangs: the longest run of heights on its trunk's middle that the hero stair leaves free
    let cathTop = 332, cathBot = 250, rootFall = null;
    { const ac = (kCath + 0.5) * Math.PI / 3, runs = []; let top = null;
      for (let y = 340; y >= 190; y--) { const d = stairDy(Math.sin(ac) * 33, Math.cos(ac) * 33, y), ok = d > 15 && d < 127 && y > 190; if (ok && top === null) top = y; if (!ok && top !== null) { runs.push([top, y + 1]); top = null; } }
      runs.sort((p, q) => (q[0] - q[1]) - (p[0] - p[1])); if (runs.length) { cathTop = runs[0][0] - 4; cathBot = runs[0][1]; } }
    for (let k = 0; k < 6; k++) {
      // gardens under the crowns: one or two shelves on every course, bromeliads with coloured hearts, orchid sprays and vines from the lip
      for (let n = 68; courseY(k, n) > 700; n--) { const y = courseY(k, n); if (y > 888) continue;
        const nS = wr.chance(0.45) ? 2 : wr.chance(0.9) ? 1 : 0, side = wr.sign();
        for (let q = 0; q < nS; q++) { const hw = wr.range(0.22, 0.44); let bc = nS === 2 ? side * (q ? -1 : 1) * wr.range(0.42, 0.62) : wr.range(-0.7, 0.7);
          if (k === kFall && Math.abs(bc) < 0.4 + hw) bc = (bc < 0 ? -1 : 1) * (0.4 + hw);                    // the Great Fall has this face's middle: its gardens stand either side of the water
          const S = addShelf(WB, k, y, bc - hw, bc + hw, wr.range(2.8, 4.6), 0); if (!S) continue;
          const nr = Math.max(1, Math.round((2 + wr.int(0, 2)) * detail));
          for (let j = 0; j < nr; j++) { const P = lipAt(S, wr.range(0.22, 0.78), wr.range(0.35, 0.7)); addRosette(WB, P.x, P.y + 0.2, P.z, wr.range(1.5, 2.6), wr.pick(HEARTS), 7); }
          const nv = Math.round((2 + wr.int(0, 3)) * detail);
          for (let j = 0; j < nv; j++) { const P = lipAt(S, wr.range(0.12, 0.88)); P.y -= 0.3; addVine(WB, P, wr.range(4, 12), wr.chance(0.6) ? wr.pick(ORCH) : null); }
          if (wr.chance(0.3)) { const P = lipAt(S, wr.range(0.3, 0.7)); addFallAt(WB, P.x, P.y - 0.3, P.z, P.nx, P.nz, wr.range(12, 24), wr.range(0.5, 1.0)); }
        }
        if ((n & 3) === 0) await ctx.yield();
      }
      await ctx.yield();
      // the basin terraces: pools 6.5 m apart in height that step across the face and back like rice terraces, each spilling into the next
      let prev = null, m = 0;
      for (let y = courseY(k, 53); y > 505 && k !== kStair; y -= 6.5, m++) {
        const z = (m + k * 3) % 8, tw = z < 4 ? z / 4 : (8 - z) / 4, zn = (m + 1 + k * 3) % 8, twn = zn < 4 ? zn / 4 : (8 - zn) / 4, bc = -0.7 + 1.4 * tw, dirn = twn > tw ? 1 : -1;
        const S = addShelf(WT, k, y, bc - 0.4, bc + 0.4, 6.2 + wr.range(-0.5, 0.9), 1);
        if (!S) { prev = null; continue; }
        S.dirn = dirn; terraces.push(S);
        const below = y - 6.5 > 505, P = lipAt(S, dirn > 0 ? 0.76 : 0.24);
        addFallAt(WT, P.x, P.y + 0.1, P.z, P.nx, P.nz, below ? 6.4 : 20, wr.range(1.3, 2.0));
        if (wr.chance(0.5)) { const Q = lipAt(S, dirn > 0 ? 0.3 : 0.7); addFallAt(WT, Q.x, Q.y + 0.1, Q.z, Q.nx, Q.nz, wr.range(5, 6.4), wr.range(0.4, 0.8)); }
        for (let j = 0, nf = wr.int(1, 2); j < nf; j++) { const L = lipAt(S, wr.range(0.25, 0.75), wr.range(0.3, 0.75)); addRosette(WT, L.x, L.y + 0.22, L.z, wr.range(0.8, 1.2), wr.chance(0.5) ? [1.0, 0.55, 0.7] : [1.0, 0.92, 0.7], 6); const b = WT.w.length; for (let e = 1; e <= 6 * 6; e++) WT.w[b - e * 4 + 3] += 2; }
        if (wr.chance(0.4)) { const L = lipAt(S, wr.range(0.1, 0.9)); L.y -= 0.3; addVine(WT, L, wr.range(3, 7), null); }
        if (lr.chance(0.4)) { const L = lipAt(S, dirn > 0 ? 0.12 : 0.88, 0.9), phl = lr.range(0, TAU);      // a lantern on a pole at the still end of a pool
          addTube(B, [new V3(L.x, y, L.z), new V3(L.x, y + 2.6, L.z)], () => 0.08, 4, () => cBarkS, () => F0);
          addBlob(B, new V3(L.x, y + 2.9, L.z), new V3(0.36, 0, 0), new V3(0, 0.46, 0), new V3(0, 0, 0.36), cAmber, cAmber, [0.04, 1.4, 1, phl], 6, 4); lampPos.push([L.x, y + 2.9, L.z]); }
        prev = S; if ((m & 7) === 7) await ctx.yield();
      }
      await ctx.yield();
    }
    for (let k = 0; k < 6; k++) {
      // the village reaches up the wall: plank balconies with a rope rail, washing, a lantern at each end and a house slung beneath
      for (let n = 38; n >= 26; n--) { const y = courseY(k, n); if (y > 505 || y < 335 || !wr.chance(0.86)) continue;
        const hw = wr.range(0.3, 0.5), bc = wr.range(-0.62, 0.62), S = addShelf(WL, k, y, bc - hw, bc + hw, wr.range(3.3, 4.4), 2); if (!S) continue;
        const ph = wr.range(0, TAU), rail = [];
        for (let s = 1; s < S.segs; s++) { const P = lipAt(S, s / S.segs, 0.95); rail.push(new V3(P.x, y + 1.15, P.z));
          if (s % 2) addTube(B, [new V3(P.x, y - 0.1, P.z), new V3(P.x, y + 1.2, P.z)], () => 0.09, 4, () => cBarkS, () => F0);
          if (s > 1 && s % 2 === 0 && wr.chance(0.55)) { const Q = rail[rail.length - 2], dr = wr.range(0.8, 1.05), col = wr.pick(cloths);
            addQuad(B, Q.clone(), rail[rail.length - 1].clone(), rail[rail.length - 1].clone().add(new V3(0, -dr, 0)), Q.clone().add(new V3(0, -dr, 0)), col, [0.05, 0.06, 2, ph], [0.05, 0.06, 2, ph], [0.4, 0.06, 2, ph + s], [0.4, 0.06, 2, ph + s]); } }
        if (rail.length > 2) addTube(B, rail, () => 0.07, 3, () => cRope, () => [0.03, 0, 4, ph]);
        for (const t of [0.14, 0.86]) { const P = lipAt(S, t, 0.8);
          addTube(B, [new V3(P.x, y, P.z), new V3(P.x, y + 2.5, P.z)], () => 0.08, 4, () => cBarkS, () => F0);
          addBlob(B, new V3(P.x, y + 2.75, P.z), new V3(0.34, 0, 0), new V3(0, 0.44, 0), new V3(0, 0, 0.34), cAmber, cAmber, [0.04, 1.4, 1, ph], 6, 4); lampPos.push([P.x, y + 2.75, P.z]); }
        if (pods.length < 64 && wr.chance(0.6)) { const P = lipAt(S, wr.range(0.35, 0.65), 0.78); addPod(new V3(P.x, y - 7.6, P.z), y - 1.4, ph); }
        if ((n & 1) === 0) await ctx.yield();
      }
      await ctx.yield();
      // the organ-pipe roots: dark wet shelves with a rank of great pale pipes hanging from each, the water sounding down them
      for (let n = 25; n >= 8; n--) { const y = courseY(k, n); if (y > 335 || y < 186 || (k === kCath && y < cathTop + 12 && y > cathBot - 8) || !wr.chance(0.66)) continue;
        const hw = wr.range(0.32, 0.52), bc = wr.range(-0.6, 0.6), S = addShelf(WL, k, y, bc - hw, bc + hw, wr.range(3.0, 4.4), 0); if (!S) continue;
        for (const t of [0.07, 0.93]) { const P = lipAt(S, t, 0.9), dl = lr.range(2.2, 5.5), phl = lr.range(0, TAU);
          addTube(B, [new V3(P.x, y - 0.3, P.z), new V3(P.x, y - dl, P.z)], () => 0.07, 4, () => cRope, (tt) => [0.25 * tt, 0, 4, phl]);
          addBlob(B, new V3(P.x, y - dl - 0.5, P.z), new V3(0.42, 0, 0), new V3(0, 0.55, 0), new V3(0, 0, 0.42), cAmber, cAmber, [0.25, 1.4, 1, phl], 6, 4); lampPos.push([P.x, y - dl - 0.5, P.z]); }
        const np = wr.int(4, 7), flip = wr.sign(), ph0 = wr.range(0, TAU);
        for (let i = 0; i < np; i++) { const t = 0.13 + 0.74 * i / (np - 1), prof = flip > 0 ? i / (np - 1) : 1 - i / (np - 1);
          const L = Math.min(lerp(10, 44, prof * prof) * wr.range(0.9, 1.1), y - 150), rad = 0.75 + 0.032 * L, P = lipAt(S, t, 0.86), ph = ph0 + i, lean = wr.range(-0.6, 0.6);
          if (L < 8) continue;
          const pp = []; for (let q = 0; q <= 3; q++) { const tt = q / 3; pp.push(new V3(P.x + P.nz * lean * tt * tt, y - 0.4 - L * tt, P.z - P.nx * lean * tt * tt)); }
          addTube(PB, pp, (tt) => rad * (1 - 0.1 * tt), 8, (tt) => [lerp(0.13, 0.34, tt * tt), lerp(0.2, 0.36, tt * tt), lerp(0.12, 0.2, tt * tt)], (tt) => [0.5 * tt * tt, 0, 6, ph]);
          if (wr.chance(0.3)) addFallAt(WL, P.x, y - 0.4 - L, P.z, P.nx, P.nz, wr.range(14, 30), rad * 0.5);
        }
        if ((n & 3) === 0) await ctx.yield();
      }
      await ctx.yield();
    }
    // ---- THE THREE GREAT SUBJECTS (one to a storey; the gaze dwells on each while its storey passes).
    // GW holds their water, spray and bow (one material, premultiplied: it is both the white water and the additive rainbow).
    const GW = { p: [], n: [], c: [], w: [], i: [] }, gr = makeRng(hashSeed(ctx.seed + ':great'));
    const trunkC = (k) => { const ac = (k + 0.5) * Math.PI / 3; return { ac, cx: 60 * Math.sin(ac), cz: 60 * Math.cos(ac) }; };
    // the heights at a place where the hero stair is not in the way, as runs [top, bottom] between yHi and yLo
    const clearRuns = (x, z, yHi, yLo) => { const runs = []; let top = null;
      for (let y = yHi; y >= yLo - 0.5; y -= 1) { const d = stairDy(x, z, y), ok = d > 15 && d < 127 && y > yLo; if (ok && top === null) top = y; if (!ok && top !== null) { if (top - y > 16) runs.push([top, y + 1]); top = null; } }
      return runs; };
    // a soft puff of spray: a quad facing the well's axis (the lens is always inside the stair), rad metres across
    const addPuff = (x, y, z, rad, dens, kind = 1) => { const l = Math.hypot(x, z) || 1, nx = -x / l, nz = -z / l, tx = nz, tz = -nx, sd = gr(), base = GW.p.length / 3;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) wv(GW, x + tx * a * rad, y + b * rad, z + tz * a * rad, nx, 0, nz, [dens, rad, 0], kind, a, b, sd);
      GW.i.push(base, base + 1, base + 2, base, base + 2, base + 3); };
    // THE GREAT FALL (crown storey): white water leaving a moss lip under the crowns and dropping the storey's whole height down the
    // middle of one trunk face, in as many leaps as the hero stair leaves room for; a pool, spray and a rainbow at the foot of each.
    const fallFeet = [];
    {
      const k = kFall, T = trunkC(k), b = T.ac + Math.PI, nx = Math.sin(b), nz = Math.cos(b), tx = nz, tz = -nx;
      const runs = clearRuns(T.cx + nx * 29, T.cz + nz * 29, 886, 702);
      for (const [ya0, yb] of runs) {
        const ya = ya0 - 2, H = ya - yb, NV = Math.max(8, Math.ceil(H / 2.5)), sd = gr(), R0 = Math.max(trunkRadius(k, Math.PI / 2 - b, ya), 21.5) + 6.2;
        // the lip: a deep moss shelf with bromeliads either side of the notch the water leaves by
        const S = addShelf(WB, k, ya, -0.42, 0.42, 7.2, 0);
        if (S) for (const t of [0.12, 0.2, 0.28, 0.72, 0.8, 0.88]) { const P = lipAt(S, t, gr.range(0.5, 0.85)); addRosette(WB, P.x, P.y + 0.2, P.z, gr.range(2.2, 3.4), wr.pick(HEARTS), 8); const V = lipAt(S, t + 0.03); V.y -= 0.3; addVine(WB, V, gr.range(8, 16), wr.pick(ORCH)); }
        for (const layer of [0, 1]) {     // 0: the water itself; 1: a wider veil of fine spray standing off it
          const base = GW.p.length / 3, NE = 6;
          for (let v = 0; v <= NV; v++) { const q = v / NV, fallen = H * q, R = R0 + 2.6 * Math.sqrt(Math.min(fallen, 50) / 50) + layer * 0.9, hw = (4.6 + 3.0 * Math.min(fallen / 70, 1)) * (layer ? 1.7 : 1);
            for (let e = 0; e <= NE; e++) { const ee = e / NE * 2 - 1, bul = 1.3 * (1 - ee * ee);
              wv(GW, T.cx + nx * (R + bul) + tx * ee * hw, ya + 0.3 - fallen, T.cz + nz * (R + bul) + tz * ee * hw, nx, 0.15, nz, [q, 1, layer], 0, ee, fallen, sd); } }
          for (let v = 0; v < NV; v++) for (let e = 0; e < NE; e++) { const a = base + v * (NE + 1) + e, c = a + NE + 1; GW.i.push(a, a + 1, c, a + 1, c + 1, c); }
        }
        // the foot: a wide pool on the bark that takes the water, three spills from its rim, spray standing over it
        const Rf = R0 + 2.6, fx0 = T.cx + nx * (Rf + 1), fz0 = T.cz + nz * (Rf + 1);
        const Pl = addShelf(yb > 760 ? WB : WT, k, yb - 1.5, -0.5, 0.5, 10.5, 1);
        if (Pl) for (const t of [0.2, 0.5, 0.8]) { const P = lipAt(Pl, t); addFallAt(yb > 760 ? WB : WT, P.x, P.y + 0.1, P.z, P.nx, P.nz, gr.range(9, 14), gr.range(1.6, 2.4)); }
        for (let j = 0; j < 7; j++) addPuff(fx0 + tx * gr.range(-9, 9) + nx * gr.range(0, 3), yb + gr.range(0, 12), fz0 + tz * gr.range(-9, 9) + nz * gr.range(0, 3), gr.range(6, 10), gr.range(0.5, 0.9));
        fallFeet.push([fx0, yb, fz0, ya]);
        await ctx.yield();
      }
      // the bow: one arc hanging in the spray in front of the water, 4 m nearer the axis. A rainbow stands where its watcher is, so
      // the arc's centre rides at the lens's height (vertex shader), clamped to the fall's own heights.
      const top = runs.length ? runs[0][0] : 880, bot = runs.length ? runs[runs.length - 1][1] : 702, bx = T.cx + nx * 33.5, bz = T.cz + nz * 33.5, base = GW.p.length / 3, sd = gr();
      for (const [a, c] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) wv(GW, bx + tx * a * 27, c * 27, bz + tz * a * 27, nx, 0, nz, [top - 30, bot + 4, 0], 2, a, c, sd);
      GW.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    await ctx.yield();
    // THE GRAND STAIR (basin terraces): this trunk's pools are one stair of great pale basins, 18 m wide and 13 m apart, standing
    // left and right of the face's middle by turns, each pouring a broad sheet down the middle into the next; lotus lights, a lantern
    // at each still end, spray where each sheet lands. The herons stand in these.
    const grand = [];
    {
      const k = kStair; let i = 0;
      for (let y = 697; y > 512; y -= 13, i++) {
        const side = (i & 1) ? 1 : -1, bc = side * 0.22, S = addShelf(WT, k, y, bc - 0.46, bc + 0.46, 9.4 + gr.range(-0.3, 0.9), 3);
        if (!S) continue;
        S.dirn = -side; S.grand = true; grand.push(S);
        const tIn = side < 0 ? 0.8 : 0.2, P = lipAt(S, tIn), last = y - 13 <= 512;
        addFallAt(WT, P.x - P.nx * 1.3, P.y + 0.15, P.z - P.nz * 1.3, P.nx, P.nz, last ? 24 : 13.1, 2.9);
        addPuff(P.x + P.nx * 0.4, y - 12.2, P.z + P.nz * 0.4, gr.range(4.2, 5.6), gr.range(0.45, 0.7));
        const Q = lipAt(S, side < 0 ? 0.3 : 0.7); addFallAt(WT, Q.x - Q.nx * 0.6, Q.y + 0.1, Q.z - Q.nz * 0.6, Q.nx, Q.nz, gr.range(6, 11), gr.range(0.5, 0.9));
        for (let j = 0; j < 3; j++) { const L = lipAt(S, gr.range(0.2, 0.8), gr.range(0.3, 0.8)); addRosette(WT, L.x, L.y + 0.24, L.z, gr.range(1.0, 1.6), j & 1 ? [1.0, 0.55, 0.7] : [1.0, 0.92, 0.7], 6); const b = WT.w.length; for (let e = 1; e <= 6 * 6; e++) WT.w[b - e * 4 + 3] += 2; }
        for (let j = 0; j < 3; j++) { const L = lipAt(S, gr.range(0.08, 0.92)); L.y -= 0.4; addVine(WT, L, gr.range(4, 9), j === 0 ? wr.pick(ORCH) : null); }
        { const L = lipAt(S, side < 0 ? 0.1 : 0.9, 0.86), phl = gr.range(0, TAU);
          addTube(B, [new V3(L.x, y, L.z), new V3(L.x, y + 3.2, L.z)], () => 0.1, 4, () => cBarkS, () => F0);
          addBlob(B, new V3(L.x, y + 3.6, L.z), new V3(0.45, 0, 0), new V3(0, 0.58, 0), new V3(0, 0, 0.45), cAmber, cAmber, [0.04, 1.4, 1, phl], 6, 4); lampPos.push([L.x, y + 3.6, L.z]); }
        if ((i & 3) === 3) await ctx.yield();
      }
    }
    await ctx.yield();
    // THE CATHEDRAL (organ-pipe roots): two ranks of great pipes, one under the other, each hung from a dark shelf across the whole
    // face with its mouths in towers like an organ's front; white water falls from every mouth (the upper rank's onto the lower shelf,
    // the lower rank's toward the gathering pool), glow-worm threads hang in the gaps, a big lantern at each shelf end.
    {
      const k = kCath, T = trunkC(k), b = T.ac + Math.PI, nx = Math.sin(b), nz = Math.cos(b), room = cathTop - cathBot;
      const rank = async (yTop, NP, Lmax, bw, towers, yStop) => {
        const S = addShelf(WL, k, yTop, -bw, bw, 6.4, 0); if (!S) return;
        for (let i = 0; i < NP; i++) { const t = 0.06 + 0.88 * i / (NP - 1), c = Math.abs(2 * i / (NP - 1) - 1), cs = Math.cos(c * towers * Math.PI);
          const L = Lmax * (0.36 + 0.64 * cs * cs * (1 - 0.2 * c)) * gr.range(0.97, 1.03), rad = 1.15 + 0.014 * L, P = lipAt(S, t, 0.8), ph = gr.range(0, TAU), lean = gr.range(-0.4, 0.4);
          const pp = []; for (let q = 0; q <= 4; q++) { const tt = q / 4; pp.push(new V3(P.x + P.nz * lean * tt * tt, yTop - 0.4 - L * tt, P.z - P.nx * lean * tt * tt)); }
          addTube(PB, pp, (tt) => rad * (1 - 0.08 * tt), 10, (tt) => [lerp(0.2, 0.7, tt), lerp(0.2, 0.6, tt), lerp(0.13, 0.39, tt)], (tt) => [0.5 * tt * tt, 0, 6, ph]);
          // the water from its mouth: a narrow white fall that widens and breaks into spray as it drops
          const ym = yTop - 0.4 - L, Hf = clamp(ym - yStop, 10, 44), base = GW.p.length / 3, NV = Math.ceil(Hf / 3), sd = gr(), mx = pp[4].x, mz = pp[4].z;
          for (let v = 0; v <= NV; v++) { const q = v / NV, hw = rad * (0.75 + 1.5 * q);
            for (const e of [-1, 0, 1]) wv(GW, mx + P.nz * e * hw + P.nx * (e ? 0 : 0.5), ym - Hf * q, mz - P.nx * e * hw + P.nz * (e ? 0 : 0.5), nx, 0.15, nz, [q, 0, 0], 0, e, Hf * q, sd); }
          for (let v = 0; v < NV; v++) for (let e = 0; e < 2; e++) { const a = base + v * 3 + e, d = a + 3; GW.i.push(a, a + 1, d, a + 1, d + 1, d); }
          // a glow-worm thread in the gap to the next pipe: dark silk with beads of green light
          if (i < NP - 1) { const G0 = lipAt(S, t + 0.44 / (NP - 1), 0.92), Lt = L * gr.range(0.45, 0.8), pht = gr.range(0, TAU), nb = Math.round(Lt / 2.4 * Math.min(1, detail + 0.2));
            addTube(B, [new V3(G0.x, yTop - 0.5, G0.z), new V3(G0.x, yTop - 0.5 - Lt * 0.5, G0.z), new V3(G0.x, yTop - 0.5 - Lt, G0.z)], () => 0.04, 3, () => [0.03, 0.1, 0.07], (tt) => [0.5 * tt, 0, 4, pht]);
            for (let j = 1; j <= nb; j++) { const tt = j / nb; addBlob(B, new V3(G0.x, yTop - 0.5 - Lt * tt, G0.z), new V3(0.17, 0, 0), new V3(0, 0.2, 0), new V3(0, 0, 0.17), [0.1, 0.95, 0.62], [0.1, 0.95, 0.62], [0.5 * tt, 0.42, 4, pht], 4, 2); } }
          if ((i & 3) === 3) await ctx.yield();
        }
        for (const t of [0.02, 0.98]) { const P = lipAt(S, t, 0.9), dl = gr.range(4, 7), phl = gr.range(0, TAU);
          addTube(B, [new V3(P.x, yTop - 0.3, P.z), new V3(P.x, yTop - dl, P.z)], () => 0.08, 4, () => cRope, (tt) => [0.25 * tt, 0, 4, phl]);
          addBlob(B, new V3(P.x, yTop - dl - 0.7, P.z), new V3(0.6, 0, 0), new V3(0, 0.78, 0), new V3(0, 0, 0.6), cAmber, cAmber, [0.25, 1.4, 1, phl], 6, 4); lampPos.push([P.x, yTop - dl - 0.7, P.z]); }
      };
      const two = room > 84, L1 = two ? clamp(room * 0.42, 34, 48) : clamp(room - 6, 30, 50), y2 = cathTop - L1 - 9;
      await rank(cathTop, 13, L1, 0.68, 2.2, two ? y2 : cathBot - 14);
      if (two) await rank(y2, 9, clamp(y2 - cathBot - 4, 26, 44), 0.6, 1.0, cathBot - 18);
      // THE ROOT FALL (polish r4): the Cathedral is an organ front with a river down its middle. From the notch of the top shelf one
      // white column drops before the centre pipes, between the two towers, past the lower rank, and lands in spray on the basins of
      // the Spiral Fall where the stair crosses this face under the lowest mouths: the pipes' water joins the stair and goes on with
      // it to the gathering pool. It is the storey's long line, in view from the first pipes to the last, and the gaze follows it down.
      {
        const yLow = (two ? y2 - clamp(y2 - cathBot - 4, 26, 44) : cathTop - L1) - 4, yA = cathTop + 0.3, sd = gr(), tx = nz, tz = -nx, NE = 6;
        const faceR = (y) => Math.max(trunkRadius(k, Math.PI / 2 - b, y), 21.5), Rat = (y) => faceR(y) + 7.5;
        const at = (y, o) => [T.cx + nx * (Rat(y) + o), T.cz + nz * (Rat(y) + o)];
        let yB = yLow - 46;                                                                            // the stair's ribbon under the Cathedral (stairDy counts metres above it)
        for (let y = yLow + 6; y > yLow - 46; y -= 0.5) { const [px, pz] = at(y, 2.5); if (stairDy(px, pz, y) < 2.5) { yB = y; break; } }
        const Hh = yA - yB, NV = Math.ceil(Hh / 3.2);
        for (const layer of [0, 1]) { const base = GW.p.length / 3;
          for (let v = 0; v <= NV; v++) { const q = v / NV, fallen = Hh * q, y = yA - fallen, R = Rat(y) + 1.6 * Math.sqrt(Math.min(fallen, 60) / 60) + layer * 1.0, hw = (3.6 + 3.8 * Math.min(fallen / 100, 1)) * (layer ? 1.7 : 1);
            for (let e = 0; e <= NE; e++) { const ee = e / NE * 2 - 1, bul = 1.2 * (1 - ee * ee);
              wv(GW, T.cx + nx * (R + bul) + tx * ee * hw, y, T.cz + nz * (R + bul) + tz * ee * hw, nx, 0.15, nz, [q, 1, layer], 0, ee, fallen, sd); } }
          for (let v = 0; v < NV; v++) for (let e = 0; e < NE; e++) { const a = base + v * (NE + 1) + e, c = a + NE + 1; GW.i.push(a, a + 1, c, a + 1, c + 1, c); }
          await ctx.yield(); }
        for (const yy of [y2 + 3, yLow]) for (let j = 0; j < 3; j++) { const [px, pz] = at(yy, 2.5), o = gr.range(-6, 6); addPuff(px + tx * o, yy + gr.range(-3, 6), pz + tz * o, gr.range(5, 7.5), gr.range(0.4, 0.7)); }
        { const [px, pz] = at(yB, 3); for (let j = 0; j < 9; j++) { const o = gr.range(-10, 10); addPuff(px + tx * o + nx * gr.range(0, 4), yB + 2 + gr.range(0, 16), pz + tz * o + nz * gr.range(0, 4), gr.range(6, 11), gr.range(0.6, 0.95)); }
          rootFall = [px, yA, pz, yB]; }
      }
    }
    await ctx.yield();
    // herons of the terraces: tall pale waders (7 m, this is a well of giants) standing in the pools the lens will look at
    const HB = makeBuf(), farAng = (h) => hand * (90 - thAtY(h + 37)) * D2R + Math.PI;                  // the angle of the far wall's middle when the gaze rests on height h
    {
      const cHer = [0.72, 0.76, 0.74], cHerD = [0.2, 0.26, 0.3], cBeak = [0.9, 0.62, 0.14], used = new Set();
      for (const h of [655, 610, 560, 520]) {
        let best = null, bd = 1e9; const fa = farAng(h);
        for (const S of (grand.length ? grand : terraces)) { if (used.has(S)) continue; const P = lipAt(S, 0.5, 0.5), da = Math.atan2(P.x, P.z) - fa, d = (S.grand ? 0 : Math.abs(Math.atan2(Math.sin(da), Math.cos(da))) * 30) + Math.abs(S.y - h); if (d < bd) { bd = d; best = S; } }
        if (!best) continue; used.add(best);
        const P = lipAt(best, 0.42 + 0.16 * wr(), 0.62), yaw = Math.atan2(P.nz, P.nx) + wr.range(-1.2, 1.2), f = new V3(Math.cos(yaw), 0, Math.sin(yaw)), sdv = new V3(-f.z, 0, f.x), up = new V3(0, 1, 0), ph = wr.range(0, TAU), sc = wr.range(1.45, 1.75);
        const at = (a, b, c) => new V3(P.x, best.y + 0.2, P.z).addScaledVector(f, a * sc).addScaledVector(up, b * sc).addScaledVector(sdv, c * sc), g = 0.07;
        for (const e of [-0.35, 0.35]) addTube(HB, [at(-0.2, 0, e), at(-0.05, 1.7, e), at(-0.3, 3.3, e * 0.8)], () => 0.09 * sc, 4, () => cBeak, () => [0, g, 4, ph]);
        addBlob(HB, at(-0.3, 3.9, 0), f.clone().multiplyScalar(1.9 * sc), up.clone().multiplyScalar(0.95 * sc).addScaledVector(f, 0.35 * sc), sdv.clone().multiplyScalar(0.8 * sc), cHer, cHerD, [0.03, g, 2, ph], 8, 6);
        addBlob(HB, at(-1.5, 3.6, 0), f.clone().multiplyScalar(1.5 * sc).addScaledVector(up, -0.5 * sc), up.clone().multiplyScalar(0.4 * sc), sdv.clone().multiplyScalar(0.6 * sc), cHerD, cHerD, [0.06, g * 0.5, 2, ph], 6, 4);
        const neck = [at(1.1, 4.3, 0), at(1.9, 5.0, 0), at(1.5, 5.9, 0), at(1.2, 6.6, 0), at(1.7, 7.1, 0)];
        addTube(HB, neck, (t) => (0.34 - 0.16 * t) * sc, 6, () => cHer, (t) => [0.12 * t, g, 2, ph]);
        addBlob(HB, at(1.95, 7.15, 0), f.clone().multiplyScalar(0.55 * sc), up.clone().multiplyScalar(0.3 * sc), sdv.clone().multiplyScalar(0.28 * sc), cHer, cHer, [0.14, g, 2, ph], 6, 4);
        addTube(HB, [at(2.3, 7.15, 0), at(3.2, 7.0, 0), at(4.0, 6.8, 0)], (t) => (0.16 - 0.14 * t) * sc, 4, () => cBeak, () => [0.14, g * 2.0, 2, ph]);
        addTube(HB, [at(1.7, 7.35, 0), at(0.9, 7.5, 0), at(0.1, 7.2, 0)], (t) => (0.07 - 0.04 * t) * sc, 3, () => cHerD, (t) => [0.14 + 0.2 * t, 0, 2, ph]);
      }
    }
    await ctx.yield();
    const staticMat = new THREE.ShaderMaterial({ fog: true, vertexColors: true, side: THREE.DoubleSide, uniforms: mkU(),
      vertexShader: /* glsl */`${FOGP_V} uniform float uT; uniform vec3 uCamP; attribute vec4 aFx; varying vec3 vP,vN,vC; varying vec4 vFx;
        void main(){ vec3 p=(modelMatrix*vec4(position,1.0)).xyz; vec2 dir=vec2(cos(aFx.w),sin(aFx.w)); float ph=aFx.w*3.7;
          if(aFx.z>2.5&&aFx.z<3.5){ float s=0.7*sin(uT*0.33+ph)+aFx.x*1.5*sin(uT*0.66+ph); p.xz+=dir*s; p.y+=0.25*sin(uT*0.5+ph)+abs(aFx.x)*0.5*max(sin(uT*0.66+ph+1.57)*sign(aFx.x),0.0); }
          else { float s=aFx.x*sin(uT*0.8+ph); p.xz+=dir*s; p.x+=aFx.x*0.4*sin(uT*1.9+ph*1.7+p.y*0.3); }
          if(aFx.z>3.5&&aFx.z<4.5) p+=normal*max(0.0,distance(p,uCamP)*0.0021-0.1);          // ropes never thinner than about 1.5 px
          vP=p; vN=normal; vC=color; vFx=aFx; vec4 mvPosition=viewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
      fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uLeafA,uLeafB; uniform float uLamp,uHair; varying vec3 vP,vN,vC; varying vec4 vFx;
        void main(){ vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N; float kind=vFx.z, pipeK=0.0; vec3 alb=vC, fill=ambAt(vP.y);
          float n1=vn3(vP*vec3(0.9,0.2,0.9)), n2=vn3(vP*vec3(3.1,0.8,3.1)+11.0);
          if(kind<0.5){ alb*=(0.7+0.5*n1)*(0.75+0.5*n2); float m=smoothstep(0.5,0.8,N.y*0.5+0.5*n1+0.1); alb=mix(alb,mix(uLeafB,uLeafA,n2*0.5)*0.6,m*0.7); fill=mix(fill,ambN(vP.y)*1.3,0.7); }
          else if(kind<1.5){ float w=0.5+0.5*sin(vP.y*8.0)*sin((vP.x-vP.z)*7.0+vP.y*2.0), hoop=smoothstep(0.34,0.5,abs(fract(vP.y*0.7)-0.5)); alb*=(0.62+0.55*w)*(1.0-0.38*hoop); fill=ambN(vP.y)*1.15; }
          else if(kind<2.5){ alb*=(0.8+0.3*n2)*(0.78+0.22*sin((vP.x+vP.z)*5.0+vP.y*1.5+vFx.w*3.0)); fill=ambN(vP.y); }
          else if(kind<3.5){ float fur=vn3(vP*vec3(2.5,0.5,2.5)); alb*=0.6+0.8*fur; fill=mix(fill,ambN(vP.y),0.5); }
          else if(kind<4.5){ alb*=0.8+0.4*n2; fill=ambN(vP.y)*1.2; N=normalize(N+vec3(0.0,0.6,0.0)); }
          else if(kind<5.5){ fill=ambN(vP.y); }                                   // a lit window
          else { float a=atan(N.x,N.z+1e-4), jt=smoothstep(0.4,0.5,abs(fract(vP.y*0.19+vFx.w*0.37)-0.5));      // an organ-pipe root: pale, fluted, jointed, wet
            alb*=(0.72+0.28*abs(sin(a*5.0)))*(0.8+0.4*n2)*(1.0-0.5*jt); pipeK=0.3+0.9*max(dot(N.xz,-normalize(vP.xz+vec2(1e-3,0.0))),0.0); fill=ambN(vP.y)*1.3*pipeK; }
          vec3 col=alb*(fill*(0.62+0.38*N.y)+uSunCol*sunAt(vP)*(0.25+0.75*max(N.y,0.0)));
          if(pipeK>0.0){ float tt=sqrt(clamp(vFx.x*2.0,0.0,1.0)), gw=smoothstep(0.8,0.9,vn3(vP*2.6+vFx.w))*(0.5+0.5*sin(uT*1.7+vP.y*0.8+vFx.w*5.0));    // glow-worms caught in the wet
            col+=vec3(0.1,0.95,0.62)*gw*(0.7+0.7*uHair)+alb*vec3(1.0,0.56,0.2)*(0.18+0.2*uLamp)*pipeK*smoothstep(150.0,250.0,vP.y)+alb*vec3(1.0,0.82,0.5)*0.34*smoothstep(300.0,150.0,vP.y)*max(-N.y*0.6+0.5,0.0)
            +vec3(1.0,0.55,0.16)*smoothstep(0.78,1.0,tt)*(0.5+0.35*uLamp)*(0.8+0.2*sin(uT*2.3+vFx.w*7.0)); }
          float fl=0.8+0.2*sin(uT*7.0+vFx.w*13.0)*sin(uT*3.1+vFx.w*5.0);
          col+=vC*vFx.y*(0.6+0.4*uLamp)*fl*4.4;
          gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
    const villageMesh = new THREE.Mesh(new THREE.BufferGeometry(), staticMat);
    { const sg0 = new THREE.BufferGeometry();
      sg0.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); await ctx.yield(); sg0.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3)); await ctx.yield();
      sg0.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3)); await ctx.yield(); sg0.setAttribute('aFx', new THREE.Float32BufferAttribute(B.fx, 4)); await ctx.yield();
      sg0.setIndex(B.i.slice(0, nB0)); sg0.boundingSphere = new THREE.Sphere(new V3(0, 450, 0), 2500); await ctx.yield();
      const mesh = new THREE.Mesh(sg0, staticMat); mesh.frustumCulled = false; scene.add(mesh);
      const sgV = villageMesh.geometry; for (const k in sg0.attributes) sgV.setAttribute(k, sg0.attributes[k]); sgV.setIndex(B.i.slice(nB0)); sgV.boundingSphere = sg0.boundingSphere;
      villageMesh.frustumCulled = false; scene.add(villageMesh); }
    await ctx.yield();
    const pipeMesh = new THREE.Mesh(bufGeo(PB), staticMat); pipeMesh.frustumCulled = false; scene.add(pipeMesh);
    await ctx.yield();
    const heronMesh = new THREE.Mesh(bufGeo(HB), staticMat); heronMesh.frustumCulled = false; scene.add(heronMesh);
    await ctx.yield();
    const wallGeo = (Wb) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(Wb.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Wb.n, 3));
      g.setAttribute('aC', new THREE.Float32BufferAttribute(Wb.c, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wb.w, 4)); g.setIndex(Wb.i); g.boundingSphere = new THREE.Sphere(new V3(0, 450, 0), 2500); return g; };
    const wallMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: mkU({ uVil: HU.uVil, uSky: HU.uSky }),
      vertexShader: /* glsl */`${FOGP_V} uniform float uT; attribute vec3 aC; attribute vec4 aW; varying vec3 vP,vN,vC; varying vec4 vW;
        void main(){ vec3 p=position; float kind=aW.x, ph=aW.w*40.0;
          if(kind>2.5&&kind<3.5){ p.y+=sin(uT*1.1+ph+p.x*0.7)*0.1*aW.z*aW.z; p.x+=sin(uT*0.8+ph*1.7)*0.08*aW.z; }
          else if(kind>3.5){ float l=aW.z; p.x+=sin(uT*0.7+ph+l*0.4)*0.035*l; p.z+=cos(uT*0.55+ph*1.3+l*0.35)*0.035*l; }
          else if(kind>1.5){ p.x+=sin(uT*1.3+ph+aW.z*9.0)*0.2*aW.z; p.z+=cos(uT*1.1+ph+aW.z*7.0)*0.2*aW.z; }
          vP=p; vN=normal; vC=aC; vW=aW; vec4 mvPosition=viewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
      fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uLeafA,uLeafB,uPale,uSky; uniform float uLamp,uHair; uniform vec4 uVil; varying vec3 vP,vN,vC; varying vec4 vW;
        void main(){ vec3 N=normalize(vN); float kind=vW.x, D=900.0-vP.y, sun=sunAt(vP), key=uSunGain*mix(1.0,0.5,smoothstep(0.0,880.0,D));
          vec3 amb=ambAt(vP.y), col; float n1=vn3(vP*1.3), n2=vn3(vP*vec3(4.5,3.0,4.5)+7.0);
          float vd=max(abs(vP.y-uVil.x)-uVil.w,0.0), vil=uVil.y*exp(-vd*vd/uVil.z); vec3 lampC=vec3(1.0,0.56,0.2)*vil;      // lantern light reaching up and down from the village
          if(kind<0.5){ float sub=kind*10.0, v=vW.z; vec3 alb;
            if(v>1.05){ float g=0.5+0.5*sin(vW.y*7.0+n1*2.5); alb=vC*(0.45+0.55*g)*(0.7+0.5*n2); col=alb*(mix(amb,ambN(vP.y)*1.2,step(2.5,sub)*0.8)*0.55+lampC*0.5+uSunCol*key*0.05); }
            else { float up=max(N.y,0.0);
              if(sub<0.5){ alb=mix(vC,uLeafA*0.8,smoothstep(0.35,0.75,n1+0.3*n2))*(0.65+0.7*n2); alb=mix(alb,uPale*0.5,smoothstep(0.8,0.98,v)*0.35); }
              else if(sub<1.5){ alb=mix(vC*(0.6+0.8*n2),mix(uLeafB,uLeafA,0.4+0.6*n1)*0.95,smoothstep(0.6,0.88,v)); alb=mix(alb,vec3(0.5,0.47,0.33),smoothstep(0.95,1.0,v)*0.5*(0.5+n2)); }
              else if(sub<2.5){ float pl=smoothstep(0.4,0.5,abs(fract(vW.y*1.3)-0.5)); alb=vC*(0.7+0.6*n2)*(1.0-0.55*pl); }
              else { float fl=0.5+0.5*sin(v*38.0+n1*3.0); alb=vC*(0.72+0.4*n2)*(0.8+0.2*fl); alb=mix(alb,mix(uLeafB,uLeafA,n1)*0.8,smoothstep(0.62,0.9,n1+0.25*n2)*0.45*smoothstep(0.97,0.8,v)); amb=mix(amb,ambN(vP.y)*1.25,0.75); }
              col=alb*(amb*(0.55+0.45*up)+uSunCol*(sun*(0.3+0.6*up)+0.34*key*up)+lampC*(sub>1.5?1.5:0.6)); } }
          else if(kind<1.5){ vec2 q=vP.xz; vec3 V=normalize(uCamP-vP);
            float r1=vn3(vec3(q*1.6,uT*0.8)), r2=vn3(vec3(q*4.0+3.0,uT*1.4));
            vec3 Nw=normalize(vec3((r1-0.5)*0.5,1.0,(r2-0.5)*0.5)); float fr=0.1+0.9*pow(1.0-max(dot(Nw,V),0.0),3.0);
            float al=dot(amb,vec3(0.3,0.5,0.2));
            vec3 deep=vec3(0.02,0.14,0.13)*(amb*0.9+uSunCol*sun*0.4+0.03), skyc=mix(uSky,vec3(1.0),0.2)*(al*1.25+dot(uSunCol,vec3(0.33))*key*0.16)+lampC*0.5;
            float grand=step(0.4,vC.g); deep=mix(deep,vec3(0.03,0.44,0.4)*(amb*0.9+uSunCol*(sun*0.5+0.3*key)+al*0.8+0.1),grand);
            col=mix(deep,skyc,clamp(0.06+0.62*smoothstep(0.35,1.0,vW.z)*(0.45+r1)+fr*0.3,0.0,1.0)*(1.0-0.35*grand));        // a dark mirror by the wall, bright where it sheets to the rim
            float g=vn3(vec3(q*3.3,uT*1.2)); g*=g; g*=g; g*=g; col+=uSunCol*(sun+0.4*key)*g*1.6;
            vec2 cq=q/2.6, ci=floor(cq), cf=fract(cq)-0.5; float h=h13(vec3(ci,7.0)); vec2 dq=cf-(vec2(h,fract(h*7.3))-0.5)*0.4; float r=length(dq), pr=0.24+0.2*fract(h*3.7);
            float pad=step(h,0.3)*smoothstep(pr,pr-0.05,r)*smoothstep(0.0,0.3,abs(atan(dq.y,dq.x+1e-4)-(h*5.0-2.5)))*smoothstep(0.1,0.2,vW.z)*smoothstep(0.92,0.84,vW.z);
            vec3 padc=mix(uLeafB,uLeafA,0.3+0.6*fract(h*5.1))*(0.65+0.45*smoothstep(0.0,pr,r))*(amb*0.9+uSunCol*(sun*0.6+0.4*key)+lampC*0.5);
            col=mix(col,padc,pad); col=mix(col,vec3(0.8,0.92,1.0)*(dot(amb,vec3(0.4))+0.2),smoothstep(0.86,0.94,vW.z)*0.55*r1); }
          else { if(N.y<0.0) N=-N; float warm=smoothstep(0.0,0.3,vC.r-vC.g), lot=step(1.5,vW.w);
            vec3 alb=vC*(0.75+0.5*n2)*(kind<3.5?0.6+0.4*smoothstep(0.0,0.5,abs(vW.y)):1.0);
            col=alb*(amb*(0.7+0.3*N.y)+uSunCol*(sun*0.6+0.3*key)+lampC*0.6)+vC*(warm*(0.14+0.4*uHair)+lot*(0.25+0.5*uLamp)); }
          col=mix(fogColor,col,smoothstep(175.0,140.0,uCamY-vP.y));                      // far below the lens the shelves melt into the depth (they are switched on there)
          gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
    const fallMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, uniforms: mkU({ uVil: HU.uVil }),
      vertexShader: wallMat.vertexShader,
      fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec4 uVil; varying vec3 vP,vN,vC; varying vec4 vW;
        void main(){ float u=vW.y, m=vW.z*13.0, D=900.0-vP.y, sun=sunAt(vP), key=uSunGain*mix(1.0,0.5,smoothstep(0.0,880.0,D)); vec3 amb=ambAt(vP.y);
          float st=vn3(vec3(u*4.0+vW.w*30.0,m*0.3-uT*2.2,vW.w*9.0)), fine=vn3(vec3(u*15.0+vW.w*11.0,m*0.8-uT*4.6,3.0));
          float edge=1.0-smoothstep(0.35,1.0,abs(u)*(1.0+0.5*vC.x)+0.45*(fine-0.5)+0.35*(st-0.5)), core=smoothstep(0.34,0.72,st*0.62+fine*0.38+0.2*(1.0-min(m/6.0,1.0)));
          float a=mix(0.8,0.4,min(m/20.0,1.0))*(0.3+0.7*core)*edge*smoothstep(0.0,0.3,m)*(1.0-0.85*smoothstep(0.62,1.0,vC.x+0.3*(st-0.5)));     // ragged sides, and it breaks into spray before it lands
          float vd=max(abs(vP.y-uVil.x)-uVil.w,0.0), vil=uVil.y*exp(-vd*vd/uVil.z);
          vec3 col=vec3(0.80,0.92,1.0)*min(dot(amb,vec3(0.3,0.5,0.2))*1.1+0.16+dot(uSunCol,vec3(0.2))*(sun+0.5*key),1.4)*(0.6+0.6*core)+vec3(1.0,0.56,0.2)*vil*0.5;
          gl_FragColor=vec4(col,a*smoothstep(175.0,140.0,uCamY-vP.y)); ${FOG_F} }` });
    const wallUp = new THREE.Group(), wallLo = new THREE.Group(), wallMid = new THREE.Group();
    for (const [grp, Wb, Fb] of [[wallUp, WB, FU], [wallMid, WT, FT], [wallLo, WL, FL]]) { const m = new THREE.Mesh(wallGeo(Wb), wallMat); m.frustumCulled = false; grp.add(m); await ctx.yield();
      const f = new THREE.Mesh(wallGeo(Fb), fallMat); f.frustumCulled = false; f.renderOrder = 2; grp.add(f); scene.add(grp); await ctx.yield(); }
    // the great subjects' water: the Great Fall's two layers (kind 0), spray puffs (1), the bow (2), the Cathedral's mouth-falls (kind 0 again).
    // Premultiplied blending, so white water covers and the bow adds, in one program; the mesh is in the scene and drawn from build() on.
    const greatU = mkU({ uBowK: { value: 0.62 * H.rainbow * (hour === 'night' ? 0.8 : 1) } });
    const greatMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, uniforms: greatU,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`${FOGP_V} uniform float uT,uCamY; attribute vec3 aC; attribute vec4 aW; varying vec3 vP,vC; varying vec4 vW;
        void main(){ vec3 p=position; if(aW.x>1.5) p.y+=clamp(uCamY-15.0,min(aC.y,aC.x),aC.x);
          else if(aW.x>0.5){ p.y+=sin(uT*0.31+aW.w*40.0)*1.2; }
          vP=p; vC=aC; vW=aW; vec4 mvPosition=viewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
      fragmentShader: /* glsl */`${FOGP_F} ${G} uniform float uBowK; varying vec3 vP,vC; varying vec4 vW;
        vec3 spec(float t){ float h=mix(0.70,0.0,clamp(t,0.0,1.0)); vec3 c=clamp(abs(fract(h+vec3(0.0,0.6667,0.3333))*6.0-3.0)-1.0,0.0,1.0); return c*c*(0.55+0.45*c); }
        void main(){ float kind=vW.x, sd=vW.w, D=900.0-vP.y, sun=sunAt(vP), key=uSunGain*mix(1.0,0.5,smoothstep(0.0,880.0,D)); vec3 amb=ambAt(vP.y);
          float L=min(dot(amb,vec3(0.3,0.5,0.2))*1.2+0.2+dot(uSunCol,vec3(0.2))*(sun+0.5*key),1.08), melt=smoothstep(185.0,145.0,uCamY-vP.y);
          vec3 col=vec3(0.0); float a=0.0, dc=distance(vP,uCamP);
          if(kind<0.5){ float u=vW.y, m=vW.z, q=vC.x, thin=step(vC.y,0.21);
            float st=vn3(vec3(u*3.0+sd*30.0,m*0.15-uT*2.4,sd*9.0)), fine=vn3(vec3(u*10.0+sd*11.0,m*0.5-uT*5.6,3.0)), rib=vn3(vec3(u*25.0,m*0.95-uT*8.5,7.0));
            float nearK=smoothstep(34.0,12.0,dc), rib2=vn3(vec3(u*62.0+sd*5.0,m*2.6-uT*15.0,11.0));
            float body=mix(st*0.5+fine*0.32+rib*0.18,st*0.34+fine*0.26+rib*0.2+rib2*0.2,nearK), edge=1.0-smoothstep(0.42,1.0,abs(u)+0.42*(fine-0.5)+0.3*(st-0.5));
            if(vC.z<0.5){ a=edge*(0.5+0.5*smoothstep(0.22,0.62,body))*smoothstep(0.0,1.6,m)*(1.0-0.75*smoothstep(0.88,1.0,q+0.1*(st-0.5)))*(0.45+0.55*smoothstep(5.0,16.0,dc));
              a*=mix(1.0,(1.0-q)*(0.5+0.5*smoothstep(0.3,0.6,body)),thin);
              col=mix(vec3(0.5,0.72,0.84),vec3(0.94,0.99,1.0),smoothstep(0.25,0.7,body))*L*(0.66+0.42*body); }
            else { a=edge*0.3*smoothstep(0.3,0.8,st*0.6+fine*0.4)*smoothstep(3.0,26.0,m)*(1.0-0.6*smoothstep(0.9,1.0,q))*smoothstep(13.0,38.0,dc); col=vec3(0.82,0.94,1.0)*L*0.85; } }
          else if(kind<1.5){ float r2=dot(vW.yz,vW.yz), n=vn3(vec3(vP.xz*0.14+sd*17.0,vP.y*0.14-uT*0.4));
            a=exp(-r2*3.2)*(0.25+0.95*n)*vC.x*0.6*(1.0-smoothstep(0.8,1.0,r2))*smoothstep(13.0,38.0,dc); col=vec3(0.84,0.95,1.0)*L*0.9; }
          a*=melt; gl_FragColor=vec4(col,a); ${FOG_F}
          gl_FragColor.rgb*=a;
          if(kind>1.5){ float r=length(vW.yz), ang=atan(vW.y,vW.z+1e-4), x1=(r-0.8)/0.075, band=smoothstep(-1.3,-0.5,x1)*(1.0-smoothstep(0.5,1.3,x1));
            float br=vn3(vec3(ang*2.0+sd*9.0,sd*7.0,uT*0.2)), arc=smoothstep(1.35,0.7,abs(ang));
            gl_FragColor=vec4(spec(x1*0.5+0.5)*band*arc*(0.55+0.45*br)*uBowK*melt,0.0); } }` });
    const greatMesh = new THREE.Mesh(wallGeo(GW), greatMat); greatMesh.frustumCulled = false; greatMesh.renderOrder = 2; scene.add(greatMesh);
    await ctx.yield();
    // lift baskets: counterweighted pairs; a woven basket under four cords, a small lantern on a hook, 190 m of rope above
    const lifts = [];
    {
      const LB = makeBuf(), fl = [0.1, 0.12, 1, 1.0], fr4 = [0, 0, 4, 1.0];
      addBlob(LB, new V3(0, 0, 0), new V3(1.15, 0, 0), new V3(0, 0.95, 0), new V3(0, 0, 1.15), cWeave, cWeaveD, fl, 10, 5);
      const rim = []; for (let k = 0; k <= 12; k++) { const a = k / 12 * TAU; rim.push(new V3(Math.sin(a) * 1.12, 0.62, Math.cos(a) * 1.12)); }
      addTube(LB, rim, () => 0.1, 4, () => cRoof, () => fl);
      for (const [x, z] of [[0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]]) addTube(LB, [new V3(x, 0.6, z), new V3(x * 0.5, 1.7, z * 0.5), new V3(0, 2.7, 0)], () => 0.05, 3, () => cRope, () => fr4);
      addTube(LB, [new V3(0, 2.7, 0), new V3(0, 8, 0), new V3(0, 13.4, 0)], () => 0.08, 4, () => cRope, () => fr4);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; addBlob(LB, new V3(Math.sin(a) * 1.15, 15 + (k % 2) * 0.5, Math.cos(a) * 1.15), new V3(1.2, 0, 0), new V3(0, 1.7, 0), new V3(0, 0, 1.2), [0.62, 0.22, 0.07], [0.95, 0.42, 0.12], [0.1, 0.17, 1, 1.0], 10, 7); }
      addBlob(LB, new V3(0, 1.95, 0), new V3(0.24, 0, 0), new V3(0, 0.32, 0), new V3(0, 0, 0.24), cAmber, cAmber, [0.1, 1.5, 1, 1.0], 6, 4);
      const lg = bufGeo(LB);
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(lg, staticMat); m.position.set(liftLines[i].x, 385, liftLines[i].z); m.frustumCulled = false; scene.add(m); lifts.push(m); lampPos.push([liftLines[i].x, 386.6, liftLines[i].z]); }
    }
    const glows = fx.makeGlows({ positions: lampPos, color: '#FFB45A', size: 3.4, intensity: 1.5 * Math.min(H.lamp, 2), flicker: 0.25, time: fxTime, rng: rng.fork('glows') });
    scene.add(glows.object); glows.object.frustumCulled = false;
    const nPodLamps = lampPos.length - 6;
    await ctx.yield();

    // ---- the recycling band: leaf rosettes, ferns, bromeliads and blossoms; vines, moss and root-hairs
    const br = rng.fork('band'); let bandLeaves = null, bandN = 0, staticLeaves = null, staticAll = 0, staticSkirt = 0, staticNear = 0;
    {
      const lv = [0, 0, 0, -0.7, 0.3, 0.1, 0, 0.33, 0, 0.7, 0.3, 0.1, -0.85, 0.62, 0.14, 0, 0.66, 0, 0.85, 0.62, 0.14, 0, 1, 0.05];
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(lv, 3));
      base.setIndex([0, 2, 1, 0, 3, 2, 1, 2, 5, 1, 5, 4, 2, 3, 6, 2, 6, 5, 4, 5, 7, 5, 6, 7]);
      const NL = Math.round(11000 * dens / 8) * 8; let cs = [0, 0, 0, 0];
      const g = instGeo(base, NL, { aS: [4, (i) => { if (i % 8 === 0) cs = [br(), br(), br(), br()]; return cs; }], aR: [4, () => [br(), br(), br(), br()]] });
      const leafMat = (st) => new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, defines: st ? { STATIC: 1 } : {}, uniforms: mkU({ uRimRed: HU.uRimRed, uBloom: { value: weather === 'blossom' ? 0.66 : 0.84 }, ...crU }),
        vertexShader: /* glsl */`${FOGP_V} ${G} uniform vec3 uLeafA,uLeafB,uPale,uScarlet; uniform float uRimRed,uBloom; attribute vec4 aS,aR;
          varying vec3 vP,vN,vCol; varying vec3 vK; varying float vLy;
          void main(){
          #ifdef STATIC
            float y=aS.y, show=1.0, fw=fract(aS.w); vec4 hs=vec4(0.0,fract(fw*17.0),fract(fw*29.0),fw); float ty=aS.w<1.0?hs.w*0.7:0.2+hs.w*0.58, bl=step(uBloom+0.04,fract(hs.w*13.7)), deep=0.0;
            vec3 c=aS.xyz, n=aS.w<1.0?normalize(vec3(sin(fw*40.0)*0.35,1.0,cos(fw*31.0)*0.35)):normalize(vec3(-c.x,14.0,-c.z));
          #else
            float wid; float y=wrapY(aS.x,0.0,wid); vec4 hs=fract(aS+wid*vec4(0.0,0.618034,0.324718,0.754878)); float D=900.0-y;
            float ty=hs.w, bl=step(uBloom,fract(hs.w*13.7))*step(D,240.0), deep=smoothstep(470.0,640.0,D);
            if(fract(hs.w*11.9)<deep*0.75) ty=0.46+0.31*fract(hs.w*5.3);                 // the deep storeys are ferns and long strap leaves
            float wl=mix(1.0,0.8,smoothstep(180.0,420.0,D)); wl=mix(wl,0.7,smoothstep(520.0,700.0,D)); wl=mix(wl,0.8,smoothstep(100.0,66.0,y));
            float show=step(fract(hs.w*29.3),wl)*bandFade(y)*step(y,893.0)*step(10.0,y);
            vec3 n, c;
            if(fract(hs.w*7.31)<0.62){ c=wallAnchor(hs.yz,y,0.0,n); }
            else { show*=step(52.0,y); float a=hs.y*6.2831853, r=mix(38.5,63.0,hs.z); vec2 q=r*vec2(sin(a),cos(a)); show*=step(22.0,trunkD(q)); c=vec3(q.x,y,q.y); n=normalize(vec3(-q.x,r*0.9,-q.y)); }
          #endif
            vec3 t1=normalize(cross(n,vec3(0.02,1.0,0.03))), t2=cross(n,t1);
            float psi=aR.x*6.2831853, el=ty<0.45?mix(0.05,0.95,aR.y):(ty<0.78?mix(-0.15,0.5,aR.y):mix(0.55,1.15,aR.y));
            float L=ty<0.45?mix(1.8,3.0,aR.z):(ty<0.78?mix(2.6,4.4,aR.z)*(1.0+0.38*deep):mix(1.5,2.5,aR.z));
            float W=ty<0.45?0.5*L:(ty<0.78?0.2*L:0.34*L), droop=ty<0.45?0.22:(ty<0.78?0.5:-0.05);
            if(bl>0.5){ el=mix(0.25,1.2,aR.y); L=mix(1.3,2.1,aR.z); W=0.6*L; droop=0.1; }
          #ifndef STATIC
            float nl=mix(0.55,1.0,smoothstep(14.0,32.0,distance(c,uCamP))); L*=nl; W*=nl;
          #endif
            vec3 dir=cos(el)*(cos(psi)*t1+sin(psi)*t2)+sin(el)*n; vec3 sd=normalize(cross(dir,n)+t1*0.03), upl=cross(sd,dir);
            vec3 lp=position; vec3 P=c+dir*(lp.y*L)+sd*(lp.x*W)+upl*(lp.z*L); P.y-=lp.y*lp.y*L*droop;
            float ph=hs.y*40.0+aR.x*17.0;
            P+=sd*(sin(uT*1.3+ph)*0.05*L*lp.y)+vec3(0.0,1.0,0.0)*(sin(uT*0.9+ph*1.3)*0.045*L*lp.y*lp.y);
            P=mix(c,P,show); vP=P; vN=upl;
            vec3 col=mix(uLeafB,uLeafA,fract(hs.w*3.1+aR.w*0.35)); if(ty>=0.45&&ty<0.78) col*=0.75;
            col=mix(col,uPale,(0.12+0.2*deep*step(0.45,ty))*lp.y); if(ty>=0.78) col=mix(col,uScarlet,uRimRed*0.6*lp.y);
            col=mix(col,uScarlet*(1.0+0.5*lp.y),bl);
          #ifdef STATIC
            if(aS.w>=1.0) col*=mix(0.62,1.0,smoothstep(862.0,892.0,P.y));
          #endif
            vCol=col; vK=vec3(bl,(ty>=0.78&&bl<0.5)?1.0-smoothstep(0.0,0.3,lp.y):0.0,lp.x); vLy=lp.y;
            vec4 mvPosition=viewMatrix*vec4(P,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uCrSun,uCrAmb; varying vec3 vP,vN,vCol; varying vec3 vK; varying float vLy;
          void main(){ vec3 N=normalize(vN); if(N.y<0.0) N=-N; float sun=sunAt(vP);
            float ax=abs(vK.z), rib=smoothstep(0.0,0.09,ax), vein=smoothstep(0.0,0.3,abs(fract(vLy*6.0-ax*1.6)-0.5));
            // a toothed outline cut inside the card, so a leaf near the lens is a leaf and not a paper shard
            float hw=min(min(vLy*2.33,0.7+0.469*(vLy-0.3)),0.85*(1.0-vLy)/0.38), saw=mix(0.76+0.24*abs(fract(vLy*6.5+0.25)-0.5)*2.0,0.94,vK.x);
            if(ax>hw*saw) discard;
            float thru=step(dot(N,uCamP-vP),0.0);                                        // seen from below: the light comes through the blade
            vec3 alb=vCol*(0.78+0.4*vn3(vP*1.9))*(0.5+0.5*rib)*(0.82+0.18*vein)*(1.0-0.3*ax*ax);
            vec3 amb=ambAt(vP.y);
          #ifdef STATIC
            float wv=vn3(vec3(vP.xz*0.02-uT*vec2(0.13,0.06),uT*0.08));
            vec3 col=alb*(uCrAmb*(0.45+0.55*N.y)+uCrSun*(0.25+0.75*N.y)*(0.7+0.5*wv))+alb*vK.x*0.6+alb*uCrSun*0.35*thru;
          #else
            vec3 col=alb*(amb*(0.68+0.32*N.y)+uSunCol*sun*(0.3+0.45*N.y))+alb*vK.x*0.75+(amb*0.8+uSunCol*sun*0.7)*vK.y*0.55+alb*(uSunCol*(0.12+0.5*sun)+amb*0.3)*0.35*thru;
          #endif
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      await ctx.yield();
      const mesh = new THREE.Mesh(g, leafMat(false)); mesh.frustumCulled = false; scene.add(mesh); bandLeaves = g; bandN = NL;
      await ctx.yield();
      { // the lip's skirt comes first in the buffer: once the camera is inside the well only that part is drawn
        crownSpots.sort((p, q) => Math.hypot(p[0], p[2]) - Math.hypot(q[0], q[2]));       // nearest the mouth first: the far ones go as soon as the camera is under the rim
        let nearN = 0; while (nearN < crownSpots.length && Math.hypot(crownSpots[nearN][0], crownSpots[nearN][2]) < 78) nearN++;
        staticNear = (skirtSpots.length + nearN) * 4;
        const spots = skirtSpots.concat(crownSpots);
        const g2 = instGeo(base, spots.length * 4, { aS: [4, (i) => spots[(i / 4) | 0]], aR: [4, () => [br(), br(), br(), br()]] });
        await ctx.yield();
        const m2 = new THREE.Mesh(g2, leafMat(true)); m2.frustumCulled = false; scene.add(m2); topOnly.push(m2); staticLeaves = g2; staticAll = spots.length * 4; staticSkirt = skirtSpots.length * 4; }
    }
    await ctx.yield();
    {
      const SEG = 8, pv = [], ix = [];
      for (let i = 0; i <= SEG; i++) pv.push(-1, i / SEG, 0, 1, i / SEG, 0);
      for (let i = 0; i < SEG; i++) { const a = i * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3)); base.setIndex(ix);
      const g = instGeo(base, Math.round(900 * dens), { aS: [4, () => [br(), br(), br(), br()]] });
      const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: mkU(),
        vertexShader: /* glsl */`${FOGP_V} ${G} attribute vec4 aS; varying vec3 vP; varying vec3 vK;
          void main(){ float wid; float y=wrapY(aS.x,0.0,wid); vec4 hs=fract(aS+wid*vec4(0.0,0.618034,0.324718,0.754878)); float D=900.0-y;
            float hair=step(640.0,D+(hs.w-0.5)*90.0), mode=fract(hs.w*7.31), show=bandFade(y)*step(y,mode<0.5?910.0:888.0)*step(mode<0.5?12.0:50.0,y);
            vec3 n, c;
            if(mode<0.5){ c=wallAnchor(hs.yz,y,0.8,n); }
            else { float a=hs.y*6.2831853, r=mode<0.8?mix(40.5,63.0,hs.z):mix(37.8,39.6,hs.z); vec2 q=r*vec2(sin(a),cos(a)); show*=step(21.3,trunkD(q)); c=vec3(q.x,y,q.y); n=vec3(-sin(a),0.0,-cos(a)); }
            vec3 t=vec3(n.z,0.0,-n.x); float f3=fract(hs.w*3.3);
            float L=hair>0.5?mix(8.0,17.0,f3):mix(7.0,21.0,f3*f3), w=hair>0.5?max(0.14,distance(c,uCamP)*0.0036):mix(0.2,0.6,fract(hs.w*5.7));
            float ly=position.y, ph=hs.y*31.0;
            vec3 P=c-vec3(0.0,ly*L,0.0)+t*(position.x*w*(1.0-0.55*ly));
            P+=(t*sin(uT*0.7+ph+ly*2.5)+n*0.6*cos(uT*0.5+ph*1.3+ly*2.0))*ly*ly*(hair>0.5?1.7:1.1);
            P=mix(c,P,show); vP=P; vK=vec3(hair,ly*L,position.x);
            vec4 mvPosition=viewMatrix*vec4(P,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uLeafA,uLeafB,uPale; uniform float uHair; varying vec3 vP; varying vec3 vK;
          void main(){ float sun=sunAt(vP), n=vn3(vP*vec3(1.2,0.5,1.2)); vec3 amb=ambAt(vP.y);
            float lf=0.7+0.5*vn3(vec3(vK.y*0.8,vK.z*1.5,vP.x*0.3));
            vec3 alb=mix(uLeafB*0.55,uLeafA*0.6,n)*lf; vec3 col=alb*(amb*0.85+uSunCol*sun*0.7);
            if(vK.x>0.5){ float bead=smoothstep(0.3,0.46,abs(fract(vK.y*0.55+vP.x*0.37)-0.5))*smoothstep(0.9,0.3,abs(vK.z));     // glow-worm threads: a dark silk with beads of light
              col=uPale*vec3(0.2,0.26,0.2)*(amb*1.1+uSunCol*sun)+vec3(0.2,1.0,0.72)*bead*(0.7+1.3*uHair)*(0.55+0.45*sin(uT*1.3+vK.y*0.7+vP.x)); }
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- shelf ledges: a bracket of wood and moss 3-4 m deep with a fan of fern on it, standing on the trunk faces that look into
    // the well in tiers 20 m apart (they travel with the band like the leaves), so every trunk shows storeys
    {
      const P = [], Nn = [], Vv = [], I = [], SG = 7;
      const pushV = (x, y, z, nx, ny, nz, k, t, a) => { const l = Math.hypot(nx, ny, nz) || 1; P.push(x, y, z); Nn.push(nx / l, ny / l, nz / l); Vv.push(k, t, a); return P.length / 3 - 1; };
      const c0 = pushV(0, 0.16, 0.08, 0, 1, 0.1, 0, 0, 0.5), rings = [];
      for (const [r, y, ny, no, t] of [[0.58, 0.13, 1, 0.25, 0.55], [1.0, 0.0, 0.5, 1, 1.0], [0.56, -0.3, -0.8, 0.7, 0.4]]) { const row = [];
        for (let q = 0; q <= SG; q++) { const th = q / SG * Math.PI, x = Math.cos(th), z = Math.sin(th), rr = r * (1 + 0.08 * Math.sin(q * 2.7 + r * 9)); row.push(pushV(x * rr, y + 0.03 * Math.sin(q * 1.9), z * rr, x * no, ny, z * no, 0, t, q / SG)); }
        rings.push(row); }
      const c1 = pushV(0, -0.6, 0.02, 0, -0.6, 1, 0, 0.1, 0.5);
      for (let q = 0; q < SG; q++) { I.push(c0, rings[0][q + 1], rings[0][q]);
        for (let k = 0; k < 2; k++) { const a = rings[k][q], b = rings[k][q + 1], c = rings[k + 1][q], d = rings[k + 1][q + 1]; I.push(a, b, c, b, d, c); }
        I.push(c1, rings[2][q], rings[2][q + 1]); }
      for (let j = 0; j < 6; j++) { const phi = (j / 5 - 0.5) * 2.7, dx = Math.sin(phi), dz = Math.cos(phi), Lf = 1.25 - 0.25 * Math.abs(j - 2.5) / 2.5, b0 = P.length / 3;
        for (let q = 0; q <= 3; q++) { const t = q / 3, w = 0.3 * (1 - 0.8 * t) + 0.02, d = t * Lf, y = 0.14 + 0.95 * t - 0.85 * t * t, sl = 0.95 - 1.7 * t;
          for (const e of [-1, 1]) pushV(dx * d + 0.1 * dx + dz * w * e, y + 0.05 * Math.abs(e), dz * d + 0.2 - dx * w * e, -dx * sl, 1, -dz * sl, 1, t, e); }
        for (let q = 0; q < 3; q++) { const a = b0 + q * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      base.setAttribute('aV', new THREE.Float32BufferAttribute(Vv, 3)); base.setIndex(I);
      const g = instGeo(base, Math.round(170 * dens), { aS: [4, () => [br(), br(), br(), br()]] });
      const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: mkU(),
        vertexShader: /* glsl */`${FOGP_V} ${G} attribute vec4 aS; attribute vec3 aV; varying vec3 vP,vN,vK;
          void main(){ float wid; float y=wrapY((floor(aS.x*8.0)+0.5+(aS.w-0.5)*0.3)/8.0,0.0,wid); vec4 hs=fract(aS+wid*vec4(0.0,0.618034,0.324718,0.754878));
            vec3 n; vec3 c=wallAnchor(vec2(hs.y,0.22+0.56*hs.z),y,-1.0,n); vec3 t=vec3(n.z,0.0,-n.x);
            float a=atan(c.x,c.z+1e-4), ib=68.0-uHand*(3.14159265-a)/0.5235988, dy=mod(y-(895.0-12.5*ib),150.0);
            float show=bandFade(y)*step(y,886.0)*step(52.0,y)*step(5.0,dy)*step(dy,133.0), S=mix(2.9,4.2,hs.w);
            vec3 lp=position; if(aV.x>0.5){ float ph=hs.y*40.0+aV.z; lp.y+=sin(uT*1.1+ph+position.x*3.0)*0.07*aV.y*aV.y; lp.x+=sin(uT*0.8+ph*1.7)*0.05*aV.y; }
            vec3 P=c+(t*lp.x+n*lp.z+vec3(0.0,lp.y,0.0))*S*show; vP=P; vN=t*normal.x+n*normal.z+vec3(0.0,normal.y,0.0); vK=vec3(aV.x,aV.y,aV.z+hs.w*7.0*(1.0-aV.x));
            vec4 mvPosition=viewMatrix*vec4(P,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uLeafA,uLeafB,uPale,uBark; varying vec3 vP,vN,vK;
          void main(){ vec3 N=normalize(vN), alb; float sun=sunAt(vP), n=vn3(vP*1.6), n2=vn3(vP*vec3(5.0,2.0,5.0)+3.0); vec3 amb=ambAt(vP.y);
            if(vK.x<0.5){ float top=smoothstep(0.0,0.45,N.y), gr=0.6+0.4*sin(vK.y*26.0+n*5.0);       // growth lines round the bracket
              alb=mix(uBark*3.4*vec3(1.1,0.95,0.75)*(0.55+0.6*n2)*gr,mix(uLeafB,uLeafA,n)*0.62,top*smoothstep(0.3,0.6,n+0.25*n2)*(1.0-0.6*smoothstep(0.8,1.0,vK.y)));
              alb=mix(alb,uPale*0.42,smoothstep(0.84,1.0,vK.y)*0.75*top); alb*=mix(0.8,1.0,smoothstep(-0.5,0.3,N.y)); }
            else { if(N.y<0.0) N=-N; float ax=abs(vK.z), tooth=step(0.42,fract(vK.y*9.0+ax*0.6));
              if(ax>(0.2+0.8*tooth)*(1.0-0.55*vK.y*vK.y)) discard;                                   // pinnae
              alb=mix(uLeafB,uLeafA,0.3+0.55*vK.y)*(0.5+0.5*smoothstep(0.0,0.22,ax))*(0.8+0.4*n); alb=mix(alb,uPale*0.8,0.3*vK.y*vK.y); }
            float key=0.24*max(N.y,0.0)*uSunGain*mix(1.0,0.5,smoothstep(0.0,880.0,900.0-vP.y));     // every ledge catches the shaft
            vec3 col=alb*(amb*(0.74+0.26*N.y)+uSunCol*(sun*(0.3+0.5*max(N.y,0.0))+key)+vec3(0.95,0.78,0.46)*0.16*max(-N.y,0.0)*smoothstep(420.0,60.0,vP.y));
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- the gathering pool under the root bridge: the whole fall turning slowly in the dark, foam in a spiral, the portal's gold on it
    {
      const pm = new THREE.ShaderMaterial({ fog: true, uniforms: mkU({ uGlow: HU.uGlow, uGlowCol: HU.uGlowCol, uSeat: { value: seat.clone() } }),
        vertexShader: /* glsl */`${FOGP_V} varying vec3 vP; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vP=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform float uGlow; uniform vec3 uGlowCol,uSeat; varying vec3 vP;
          void main(){ float r=length(vP.xz), a=atan(vP.x,vP.z+1e-4), w=vn3(vec3(vP.xz*0.06,uT*0.1));
            float sp=sin(a*2.0*uHand+r*0.21-uT*0.45+4.0*w)*0.5+0.5, n=vn3(vec3(vP.xz*0.45,uT*0.6)), n2=vn3(vec3(vP.xz*1.7+5.0,uT*1.1));
            float foam=smoothstep(0.5,0.95,sp)*(0.3+0.7*n)*(0.6+0.4*n2)+smoothstep(52.0,60.0,r)*0.5*n;
            vec3 amb=ambAt(30.0); float al=dot(amb,vec3(0.3,0.5,0.2));
            vec2 d=vP.xz-uSeat.xz; float g=exp(-dot(d,d)/1100.0), g2=exp(-dot(d,d)/160.0);
            float gl=n2*n2; gl*=gl; gl*=gl;
            vec3 col=vec3(0.02,0.11,0.1)*(amb*1.3+0.04)*(0.6+0.8*sp)+vec3(0.8,0.92,1.0)*(al*1.0+0.12)*foam*0.75;
            col+=uGlowCol*uGlow*(0.05*g+0.16*g*foam+0.1*g2+0.5*g*gl);
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      const pool = new THREE.Mesh(new THREE.CircleGeometry(66, 40).rotateX(-Math.PI / 2), pm); pool.position.y = 7; pool.frustumCulled = false; scene.add(pool);
    }
    await ctx.yield();

    // ---- rainbow fragments in the spray: broken arcs hanging across the well from the terraces down, before the Ring closes round the portal
    {
      const hs = [667, 571, 470, 282, 185], g = instGeo(new THREE.PlaneGeometry(2, 2), hs.length, { aB: [4, (i) => { const jit = wr.range(-0.25, 0.25), sub = i < 2 ? kStair : i === 3 ? kCath : -1, a = sub < 0 ? farAng(hs[i] - 17) + jit : (sub + 0.5) * Math.PI / 3 + jit * 0.4, r = sub < 0 ? 19 : 25;      // the terraces' two arcs hang in the spray of the Grand Stair, the roots' upper one before the Cathedral
          return [Math.sin(a) * r, i === 3 ? cathTop - 44 : i < 2 ? 697 - 13 * 4 * (i + 1) : hs[i], Math.cos(a) * r, wr()]; }] });      // i < 2: where the Stair's fourth and eighth sheets land (basins from y 697 down, 13 m apart)
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        uniforms: { uT: U.uT, uCamP: U.uCamP, uK: { value: 0.5 * H.rainbow * (hour === 'night' ? 0.8 : 1) } },
        vertexShader: /* glsl */`uniform vec3 uCamP; attribute vec4 aB; varying vec3 vL;
          void main(){ vec3 c=aB.xyz, z=normalize(uCamP-c+vec3(1e-3,0.0,0.0)), x=normalize(cross(vec3(0.0,1.0,0.0),z)+vec3(1e-4,0.0,0.0)), y=cross(z,x); float R=mix(15.0,19.0,aB.w);
            float dy=uCamP.y-c.y; vL=vec3(position.xy,aB.w+2.0*smoothstep(75.0,45.0,abs(dy-20.0))*smoothstep(12.0,24.0,distance(uCamP,c)));
            gl_Position=projectionMatrix*viewMatrix*vec4(c+(x*position.x+y*position.y)*R,1.0); }`,
        fragmentShader: /* glsl */`uniform float uT,uK; varying vec3 vL;
          float h13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
          float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
                       mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
          vec3 spec(float t){ float h=mix(0.70,0.0,clamp(t,0.0,1.0)); vec3 c=clamp(abs(fract(h+vec3(0.0,0.6667,0.3333))*6.0-3.0)-1.0,0.0,1.0); return c*c*(0.55+0.45*c); }
          void main(){ float sd=fract(vL.z), k=floor(vL.z)*0.5, r=length(vL.xy), ang=atan(vL.x,vL.y+1e-4);
            float x1=(r-0.8)/0.09, band=smoothstep(-1.3,-0.5,x1)*(1.0-smoothstep(0.5,1.3,x1));
            float a0=(sd-0.5)*1.6, arc=smoothstep(1.0,0.35,abs(ang-a0)), br=vn3(vec3(ang*2.2+sd*9.0,sd*7.0,uT*0.2));
            gl_FragColor=vec4(spec(x1*0.5+0.5)*band*arc*smoothstep(0.25,0.6,br)*k*uK,1.0); }` });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 6; scene.add(mesh);
    }
    await ctx.yield();

    // ---- flyers: butterflies in the god rays, spinning samaras, and the glider flock spiralling up the shaft
    const hourDim = hour === 'night' ? 0.4 : hour === 'dusk' ? 0.75 : 1;
    const flyU = { uFlockY: { value: -500 }, uFlyCol: { value: C(castMoth ? '#cbbd94' : PALETTE[6]) }, uBfCol: { value: C(hour === 'night' ? '#eef4d0' : PALETTE[1]) }, uMoth: { value: castMoth ? 1 : 0 }, uBfAmb: { value: hour === 'night' ? 0.4 : 0.9 },
      uHourDim: { value: hourDim }, uFlyGlow: { value: castMoth ? 0.2 : 0.5 }, uEnt: { value: new THREE.Vector4(pts[0].x, pts[0].z, dirTop.x, dirTop.z) } };
    {
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -0.25, -1, 0, 0.15, 0, 0, -0.4, 0, 0, 0.45, 1, 0, -0.25, 1, 0, 0.15], 3));
      base.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]);
      const nB = Math.round(520 * dens), nS = Math.round((weather === 'seeding' ? 900 : 300) * dens), nG = 500, nM = 70, nE = 56, fr = rng.fork('fly');
      const g = instGeo(base, nB + nS + nG + nM + nE, { aS: [4, () => [fr(), fr(), fr(), fr()]], aKind: [1, (i) => [i < nB ? 0 : i < nB + nS ? 1 : i < nB + nS + nG ? 2 : i < nB + nS + nG + nM ? 3 : 4]] });
      const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: mkU(flyU),
        vertexShader: /* glsl */`${FOGP_V} ${G} uniform float uFlockY,uMoth; uniform vec4 uEnt; attribute vec4 aS; attribute float aKind; varying vec3 vP; varying vec3 vK;
          void main(){ float k=aKind, wid=0.0, size=1.0, flap=0.0, show=1.0, ph=aS.w*6.2831853; vec3 c, f, upv=vec3(0.0,1.0,0.0); vec3 lp=position;
            if(k<0.5){ float y=wrapY(aS.x,uT*0.5,wid); vec4 hs=fract(aS+wid*vec4(0.0,0.618034,0.324718,0.754878));
              float a=hs.y*6.2831853, r=36.0*sqrt(hs.z); c=vec3(r*sin(a),y,r*cos(a));
              c+=vec3(sin(uT*0.6+ph)*2.2,sin(uT*1.7+ph*2.0)*0.9,cos(uT*0.5+ph*1.3)*2.2);
              float ha=ph+uT*0.4+sin(uT*0.9+ph)*1.2; f=normalize(vec3(sin(ha),0.25*cos(uT*1.7+ph*2.0),cos(ha)));
              size=0.34+0.26*hs.w; flap=1.15*sin(uT*(8.0+4.0*hs.w)+ph); show=bandFade(y)*step(y,896.0)*step(46.0,y)*step(21.5,trunkD(c.xz)); }
            else if(k<1.5){ float y=wrapY(aS.x,uT*6.5,wid); vec4 hs=fract(aS+wid*vec4(0.0,0.618034,0.324718,0.754878));
              float a=hs.y*6.2831853, r=(y>899.0?120.0:37.0)*sqrt(hs.z); c=vec3(r*sin(a),y,r*cos(a)); c.xz+=vec2(sin(uT*0.4+ph),cos(uT*0.33+ph))*1.5;
              float sp=uT*(5.0+3.0*hs.w)+ph; f=vec3(sin(sp),0.0,cos(sp)); size=(0.62+0.3*hs.w)*(y>899.0?1.5:1.0)*mix(0.6,1.0,smoothstep(8.0,22.0,distance(c,uCamP))); flap=0.3; lp.z*=0.42;
              if(lp.x<0.0){ lp.x*=0.14; lp.z*=0.6; } show=bandFade(y)*step(46.0,y)*smoothstep(4.0,9.0,distance(c,uCamP)); }
            else if(k>3.5){ float fy=fract(aS.z-uT*0.03-aS.w*0.5), lat=(aS.y<0.5?-1.0:1.0)*mix(5.0,36.0,fract(aS.y*2.0));                 // seeds spinning down over the approach
              c=vec3(uEnt.x,0.0,uEnt.y)+vec3(uEnt.z,0.0,uEnt.w)*mix(10.0,150.0,aS.x)+vec3(-uEnt.w,0.0,uEnt.z)*lat; c.y=904.0+52.0*fy;
              c.xz+=vec2(sin(uT*0.4+ph),cos(uT*0.33+ph))*1.5; float sp=uT*(5.0+3.0*aS.w)+ph; f=vec3(sin(sp),0.0,cos(sp)); size=0.95+0.45*aS.w; flap=0.3; lp.z*=0.42;
              if(lp.x<0.0){ lp.x*=0.14; lp.z*=0.6; } show=sin(fy*3.14159265)*step(884.0,uCamY)*smoothstep(3.0,7.0,distance(c,uCamP)); k=1.0; }
            else if(k>2.5){ float dr=aS.w<0.5?1.0:-1.0, r=mix(9.0,46.0,aS.z), a=aS.y*6.2831853+dr*uT*(0.5+0.4*aS.w)*14.0/r; float y=905.0+aS.x*aS.x*52.0+sin(uT*0.6+ph)*3.0;
              c=vec3(r*sin(a),y,r*cos(a)); f=normalize(vec3(dr*cos(a),0.12*cos(uT*0.6+ph),-dr*sin(a))); size=1.5; lp.z-=abs(lp.x)*0.45; flap=0.15+0.45*sin(uT*4.5+ph); }
            else { float ys=uFlockY+(aS.x-0.5)*230.0+sin(uT*0.7+ph)*2.0; float a=aS.y*6.2831853+ys*0.03+uT*0.3;
              float r=aS.z<0.45?mix(0.8,9.5,aS.z/0.45):mix(17.6,19.0,(aS.z-0.45)/0.55);
              c=vec3(r*sin(a),ys,r*cos(a))+vec3(sin(uT*1.1+ph),0.0,cos(uT*0.9+ph))*0.6;
              f=normalize(vec3(cos(a),1.3,-sin(a))); size=mix(0.85,0.4+0.5*aS.w,uMoth); lp.z-=abs(lp.x)*0.45*(1.0-uMoth); flap=mix(0.18+0.5*sin(uT*5.5+ph),0.95*sin(uT*(9.0+5.0*aS.w)+ph),uMoth);
              show=step(ys,890.0)*step(52.0,ys); if(uMoth>0.5&&fract(aS.w*7.3)<0.5) show*=smoothstep(12.0,17.0,distance(c,uCamP)); }      // moths: all sizes, and only half of them come near the lens
            vec3 rt=normalize(cross(f,upv)+vec3(1e-4,0.0,0.0)), u2=cross(rt,f);
            vec3 wl=vec3(lp.x*cos(flap),abs(lp.x)*sin(flap),lp.z);
            show*=k<0.5?smoothstep(5.0,11.0,distance(c,uCamP)):smoothstep(2.5,6.5,distance(c,uCamP));          // nothing fills the frame at the lens
            vec3 P=c+size*show*(rt*wl.x+u2*wl.y+f*wl.z); vP=P; vK=vec3(k,position.x,position.z);
            vec4 mvPosition=viewMatrix*vec4(P,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uFlyCol,uBfCol; uniform float uHourDim,uFlyGlow,uMoth,uBfAmb; varying vec3 vP; varying vec3 vK;
          void main(){ float sun=max(sunAt(vP),step(900.0,vP.y)*uSunGain); vec3 amb=ambAt(vP.y), col; float ax=abs(vK.y);
            if(vK.x<0.5){ float sh=min(length(vec2((ax-0.5)/0.5,(vK.z-0.1)/0.2)),length(vec2((ax-0.34)/0.34,(vK.z+0.13)/0.19))); if(sh>1.0) discard;      // two wings a side
              col=uBfCol*(amb*uBfAmb+uSunCol*sun*(1.4-uBfAmb)+0.5)*(1.0-0.5*smoothstep(0.55,1.0,sh))*(0.55+0.45*uHourDim)*(0.45+0.55*smoothstep(0.02,0.1,ax)); }
            else if(vK.x<1.5){ float x=vK.y, z=vK.z;                                    // a winged seed: teardrop blade with a nub, translucent amber-green
              if(x>0.0){ float hw=0.36*pow(max(x,1e-4),0.4)*(1.0-0.72*x*x*x); if(abs(z-0.04)>hw) discard;
                float rib=smoothstep(0.05,0.0,abs(z+hw*0.78-0.04)), vein=smoothstep(0.16,0.0,abs(fract(x*7.0+z*5.0)-0.5));
                col=vec3(0.62,0.56,0.12)*(1.0-0.35*vein-0.5*rib)*(amb*0.95+uSunCol*sun*0.5+0.45); }
              else { if(x*x+z*z*6.9>1.0) discard; col=vec3(0.62,0.44,0.16)*(amb*1.1+uSunCol*sun*0.5+0.45); } }
            else if(uMoth>0.5&&vK.x<2.5){ float sh=min(length(vec2((ax-0.5)/0.5,(vK.z-0.03)/0.25)),length(vec2((ax-0.3)/0.3,(vK.z+0.13)/0.17))), body=step(ax,0.07)*step(abs(vK.z),0.3);
              if(sh>1.0&&body<0.5) discard;                                                 // a moth: broad forewings, small hindwings, a dark furred body
              float lum=dot(amb,vec3(0.3,0.5,0.2))*0.75+dot(uSunCol,vec3(0.33))*sun*0.55+0.34;
              col=uFlyCol*lum*(1.0-0.6*smoothstep(0.5,1.0,sh))*(0.82+0.18*sin(sh*17.0))*mix(1.0,0.6,max(body,smoothstep(0.16,0.05,ax)*0.7)); }
            else { if(abs(vK.z-mix(0.02,-0.05,ax))>mix(0.43,0.03,pow(max(ax,1e-4),1.4))) discard;
              col=uFlyCol*(dot(amb,vec3(0.3,0.5,0.2))*1.1+dot(uSunCol,vec3(0.33))*sun*1.2*uFlyGlow+uFlyGlow)*(1.0-0.5*smoothstep(0.7,0.95,ax))*(0.75+0.25*step(-0.1,vK.z)); }
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh);
    }
    await ctx.yield();

    // ---- frogs leaping basin to basin down the stair (always), and the troop of leapers on the rope bridges (cast swap)
    {
      const cv = [0, 0.1, 0.55, 0, 0.04, -0.5, 0, 0.34, -0.05, 0, -0.16, 0, -0.32, 0.02, 0, 0.32, 0.02, 0, -0.8, -0.14, -0.42, 0.8, -0.14, -0.42, -0.3, 0, -0.45, 0.3, 0, -0.45];
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(cv, 3));
      base.setIndex([0, 2, 4, 0, 5, 2, 1, 4, 2, 1, 2, 5, 0, 4, 3, 0, 3, 5, 1, 3, 4, 1, 5, 3, 4, 6, 8, 5, 9, 7]);
      const qr = rng.fork('critters'), NF = Math.round(120 * dens);
      const fg = instGeo(base, NF, { aF: [4, (i) => [qr(), i % 12, qr(), qr()]] });
      const critMat = (leaper) => new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, defines: leaper ? { LEAPER: 1 } : {},
        uniforms: mkU({ uRate: HU.uRate, uLag: HU.uLag, uSeeds: { value: hero.info.seeds }, uScales: { value: hero.info.scales } }),
        vertexShader: /* glsl */`${FOGP_V} ${G} varying vec3 vP; varying vec3 vK;
        #ifdef LEAPER
          attribute vec4 aA,aB;
        #else
          uniform float uRate,uLag,uSeeds[68],uScales[68]; attribute vec4 aF;
          vec3 onBasin(float idx,float phi){ int ii=int(clamp(idx,0.0,67.0)); float seed=uSeeds[ii], sc=uScales[ii];
            float ph=fract(uTime*uRate-idx*uLag+seed*0.07), lvl=smoothstep(0.0,0.60,ph)*(1.0-smoothstep(0.64,0.84,ph));
            float q=fract(ph-0.82), shud=exp(-q*11.0)*sin(q*46.0)*smoothstep(0.0,0.02,q);
            float tip=smoothstep(0.60,0.72,ph)*(1.0-smoothstep(0.78,0.92,ph))*0.30+0.035*sin(uTime*0.8+seed*9.0)+0.06*shud;
            vec3 p=vec3(cos(phi)*9.55,0.8,sin(phi)*9.55)*sc; float c=cos(tip), s=sin(tip); p=vec3(p.x*c+p.y*s,-p.x*s+p.y*c,p.z);
            p.y-=2.0*lvl*lvl*(3.0-2.0*lvl)*0.6+1.2*lvl-0.75*shud;
            float ang=3.14159265-uHand*(68.0-idx)*0.5235988; vec3 er=vec3(sin(ang),0.0,cos(ang)), et=uHand*vec3(cos(ang),0.0,-sin(ang));
            return er*(${SR.toFixed(1)}+p.z)+et*p.x+vec3(0.0,895.0-12.5*idx+p.y,0.0); }
        #endif
          void main(){ vec3 c, f; float e=0.0, size, show=1.0; vec3 lp=position;
        #ifdef LEAPER
            float t=fract(uT*aB.w+aA.w)*2.0, sg=1.0; if(t>1.0){ t=2.0-t; sg=-1.0; }
            float hp=fract(uT*(1.5+aA.w)+aA.w*40.0); e=hp;
            c=mix(aA.xyz,aB.xyz,t); c.y+=-0.9-sin(t*3.14159265)*2.6+1.1*4.0*hp*(1.0-hp);
            f=normalize(vec3(aB.x-aA.x,0.0,aB.z-aA.z)+vec3(1e-4,0.0,0.0))*sg; size=0.85;
            if(lp.z<-0.44&&abs(lp.x)<0.01){ lp.z-=0.3; lp.y+=0.6+0.2*sin(uT*6.0+aA.w*30.0); }          // a tail carried high
            else if(abs(lp.x)>0.5){ lp=vec3(sign(lp.x)*0.42,-0.3,-0.3); }                               // legs tucked under a stout body
            else { lp.x*=1.6; lp.y*=1.6; }
        #else
            float hop=uT*(0.3+0.22*aF.w)+aF.x*9.0, n=floor(hop), s=fract(hop);
            float iTop=floor((895.0-(uCamY+28.0))/12.5), idx=iTop+mod(aF.y+n-iTop,12.0);
            vec3 A=onBasin(idx,1.0+fract(aF.z*7.13+n*0.37)*4.3), Bq=onBasin(idx+1.0,1.0+fract(aF.z*7.13+(n+1.0)*0.37)*4.3);
            e=clamp((s-0.64)/0.36,0.0,1.0); c=mix(A,Bq,e); c.y+=6.0*4.0*e*(1.0-e)+0.12;
            f=normalize(vec3(Bq.x-A.x,0.0,Bq.z-A.z)+vec3(1e-4,0.0,0.0)); size=1.0;
            show=step(0.0,idx)*step(idx,66.0)*bandFade(c.y);
        #endif
            float air=step(0.02,e)*step(e,0.98); f=normalize(f+vec3(0.0,(0.5-e)*2.2*air,0.0));
            vec3 rt=normalize(cross(f,vec3(0.0,1.0,0.0))), up=cross(rt,f);
            if(abs(position.x)>0.5) lp.z-=0.55*air;                                  // hind legs trail in the air
            lp.z*=1.0+0.35*air;
            show*=smoothstep(1.5,4.0,distance(c,uCamP));
            vec3 P=c+size*show*(rt*lp.x+up*(lp.y+0.18)+f*lp.z); vP=P; vK=vec3(position.y,position.z,abs(position.x));
            vec4 mvPosition=viewMatrix*vec4(P,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uLeafA,uPale; varying vec3 vP; varying vec3 vK;
          void main(){ float back=smoothstep(-0.16,-0.02,vK.x);
        #ifdef LEAPER
            vec3 alb=mix(vec3(0.8,0.66,0.42),vec3(0.66,0.25,0.07),back); alb=mix(alb,vec3(0.95,0.9,0.75),smoothstep(-0.48,-0.56,vK.y)*step(vK.z,0.01)); float glow=0.22;
        #else
            vec3 alb=mix(uPale*0.55,vec3(0.5,0.78,0.08),back); alb=mix(alb,vec3(1.0,0.3,0.12),smoothstep(0.4,0.6,vK.z)); float glow=0.2;
        #endif
            vec3 col=alb*(ambN(vP.y)*1.1+uSunCol*sunAt(vP)*0.25+glow);
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      const frogs = new THREE.Mesh(fg, critMat(false)); frogs.frustumCulled = false; scene.add(frogs);
      if (castLeapers && bridges.length) {
        const lg = instGeo(base, 30, { aA: [4, (i) => { const b = bridges[i % bridges.length]; return [b.p[0], b.p[1], b.p[2], qr()]; }], aB: [4, (i) => { const b = bridges[i % bridges.length]; return [b.q[0], b.q[1], b.q[2], qr.range(0.035, 0.07)]; }] });
        const leapers = new THREE.Mesh(lg, critMat(true)); leapers.frustumCulled = false; scene.add(leapers);
      }
    }
    await ctx.yield();

    // ---- kites with scarlet tails in the updraught above the village (or paper-lantern balloons)
    const kr = rng.fork('kites'), kitePos = [], kA = kr.range(0, TAU);
    for (let t = 0; t < 300 && kitePos.length < (castBalloon ? 18 : 12); t++) {
      const a = kA + kr.range(-1.1, 1.1), r = kr.range(23, 35), x = Math.sin(a) * r, z = Math.cos(a) * r, y = kr.range(castBalloon ? 330 : 428, castBalloon ? 520 : 482), dy = stairDy(x, z, y);
      if (dy > 34 && dy < 112) kitePos.push([x, y, z, kr()]);
    }
    // sky lanterns: the village lets paper lanterns go, and they come up the shaft and out of the mouth into the shower, one after another
    const slr = makeRng(hashSeed(ctx.seed + ':skyl')), skyL = [];
    for (let i = 0; i < 30; i++) skyL.push([slr.range(0, TAU), 4 + 24 * Math.sqrt(slr()), slr(), slr.range(0.7, 1.3)]);
    const skyLan = fx.makeGlows({ positions: skyL.map((q) => [Math.sin(q[0]) * q[1], 880, Math.cos(q[0]) * q[1]]), colors: ['#FFB45A', '#FF8A4C', '#FFD27A'], sizes: skyL.map((q) => q[3]), size: 8.5, intensity: 2.6 * (hour === 'night' ? 1 : hour === 'dusk' ? 1.1 : 1.3), flicker: 0.2, halo: 1.2, near: [2, 6], time: fxTime, rng: rng.fork('skyl') });
    skyLan.object.frustumCulled = false; scene.add(skyLan.object);
    let balloons = null;
    if (castBalloon) {
      balloons = fx.makeGlows({ positions: kitePos.map((p) => [p[0], p[1], p[2]]), colors: ['#FFB45A', '#FF7A4C', '#FFD27A'], size: 5.2, intensity: 1.7, flicker: 0.15, halo: 1.2, time: fxTime });
      balloons.object.frustumCulled = false; scene.add(balloons.object);
    } else if (kitePos.length) {
      const pv = [0, 1.3, 0, -0.9, 0, 0, 0, -1.5, 0, 0.9, 0, 0], av = [0, 0, 0, 0], ix = [0, 1, 2, 0, 2, 3], TS = 9;
      for (let i = 0; i <= TS; i++) { const t = i / TS; pv.push(-0.13, -1.5 - t * 5.5, 0, 0.13, -1.5 - t * 5.5, 0); av.push(t + 0.001, t + 0.001); }
      for (let i = 0; i < TS; i++) { const a = 4 + i * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3)); base.setAttribute('aV', new THREE.Float32BufferAttribute(av, 1)); base.setIndex(ix);
      const g = instGeo(base, kitePos.length, { aK: [4, (i) => kitePos[i]] });
      const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: mkU(),
        vertexShader: /* glsl */`${FOGP_V} ${G} attribute vec4 aK; attribute float aV; varying vec3 vP; varying vec3 vK;
          void main(){ float s=aK.w; vec3 c=aK.xyz+vec3(sin(uT*0.5+s*9.0),sin(uT*0.8+s*5.0)*0.8,cos(uT*0.43+s*7.0))*1.6;
            float yaw=s*6.2831853+0.4*sin(uT*0.6+s*3.0); vec3 rt=vec3(cos(yaw),0.0,-sin(yaw)), fw=vec3(sin(yaw),0.0,cos(yaw)); vec3 lp=position*1.8;
            vec3 P=c+rt*lp.x+(vec3(0.0,0.77,0.0)+fw*0.64)*lp.y;
            P+=(rt*sin(uT*3.0-aV*7.0+s*20.0)+fw*0.7*cos(uT*2.3-aV*5.0))*aV*1.5;
            vP=P; vK=vec3(aV,position.xy); vec4 mvPosition=viewMatrix*vec4(P,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
        fragmentShader: /* glsl */`${FOGP_F} ${G} uniform vec3 uLeafA,uPale,uScarlet; varying vec3 vP; varying vec3 vK;
          void main(){ vec3 amb=ambAt(vP.y); float sun=sunAt(vP);
            vec3 col=mix(uLeafA,uPale,smoothstep(0.12,0.0,abs(vK.y))*0.8+0.15)*(amb*1.2+uSunCol*sun*0.3);
            if(vK.x>0.0005) col=uScarlet*(amb+uSunCol*sun*0.4+0.9);
            gl_FragColor=vec4(col,1.0); ${FOG_F} }` });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh);
    }

    await ctx.yield();

    // ---- our own samara wing: a soft fan that sweeps the top edge of the frame every 1.5 s
    const wingU = { uT: U.uT, uWing: { value: 0 }, uWingCol: { value: C('#b7bf58') } };
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: wingU, transparent: true, depthWrite: false, depthTest: false, fog: false,
      vertexShader: /* glsl */`varying vec2 vQ; void main(){ vec3 p=vec3(position.x*3.4,0.95+position.y*0.55,-2.0); vQ=p.xy; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(p,1.0); }`,
      fragmentShader: /* glsl */`uniform float uT,uWing; uniform vec3 uWingCol; varying vec2 vQ;
        void main(){ vec2 v=vQ-vec2(0.75,2.47); float r=length(v), ang=atan(v.x,-v.y);
          float th=mod(uT*4.18879+2.84,6.2831853)-3.14159265, s=mod(ang-th+3.14159265,6.2831853)-3.14159265;      // s<0: behind the leading edge
          float tip=smoothstep(1.86,1.40,r+0.5*s*s*8.0)*smoothstep(0.6,1.0,r);
          float body=smoothstep(0.05,-0.05,s)*smoothstep(-0.44,-0.13,s), trail=smoothstep(0.02,-0.1,s)*smoothstep(-1.25,-0.25,s);
          float rib=smoothstep(0.016,0.004,abs(s+0.04)), q=r*11.0+s*17.0-s*s*60.0, vein=smoothstep(0.07,0.015,abs(fract(q)-0.5))*smoothstep(-0.045,-0.07,s);
          float fine=smoothstep(0.16,0.04,abs(fract(q*3.0)-0.5))*0.3*smoothstep(-0.07,-0.12,s);
          vec3 col=uWingCol*(1.0-0.2*max(vein,fine)-0.3*rib)*(0.72+0.5*smoothstep(-0.22,0.0,s));
          float a=tip*max(body*mix(0.3,0.5,smoothstep(-0.2,0.0,s)),trail*0.3);
          gl_FragColor=vec4(col,a*uWing); }` }));
    wing.frustumCulled = false; wing.renderOrder = 60; wing.matrixAutoUpdate = false; scene.add(wing);

    // ---- weather in the air: rain and petals that fall almost as fast as we do, fireflies after dark, smoke, dragonflies
    const rain = fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time: fxTime, count: Math.round(1100 * dens * (weather === 'downpour' ? 3.4 : weather === 'mist' ? 0.5 : 1)), box: [46, 52, 46], velocity: [0.5, -17.5, 0.3], near: [3.5, 10],
      intensity: 0.6 * (hour === 'night' ? 0.45 : hour === 'dusk' ? 0.7 : 1) });
    await ctx.yield();
    const petals = fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', time: fxTime, count: Math.round((weather === 'blossom' ? 2600 : 250) * dens), box: [44, 44, 44], velocity: [0.4, -12.5, 0.25],
      colors: ['#FF5A3C', '#ff7648', '#e8452c'], size: [0.28, 0.62] });
    await ctx.yield();
    scene.add(rain.object, petals.object);
    let flies = null;
    if (H.fire) { flies = fx.makeParticles({ rng: rng.fork('flies'), preset: 'fireflies', time: fxTime, count: Math.round(900 * dens), box: [72, 56, 72], colors: ['#d8ff8a', '#9affc0', '#ffe28a'] }); scene.add(flies.object); }
    await ctx.yield();
    const smokes = [];
    const camAngAt = (y) => hand * (90 - thAtY(y)) * D2R, angOff = (q) => { const d = Math.atan2(q.x, q.z) - camAngAt(q.y + 26); return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))); };
    const smokePods = ring.slice().sort((p, q) => angOff(q) - angOff(p));
    for (let i = 0; i < Math.min(2, smokePods.length); i++) { const q = smokePods[i];
      const s = fx.makeSmokeColumn({ rng: rng.fork('smoke' + i), time: fxTime, position: [q.x, q.y + 3.6, q.z], height: 30, radius: [0.5, 2.8], size: [1.4, 5], count: 28, color: '#6f8a78', colorTop: '#a9bfae', shadowColor: '#2f4a3c', opacity: 0.2, wind: [0.25, 0, 0.12], bend: 0.25 });
      scene.add(s.object); smokes.push(s); await ctx.yield(); }
    const dfPos = []; for (let i = 3; i < A.basinCount - 2; i += 2) { const b = A.basinAt(i), r = SR - 6.0; dfPos.push([Math.sin(b.angle) * r, b.y + 2.2 + (i % 3), Math.cos(b.angle) * r]); }
    const dfl = F.makeDragonflies({ rng: rng.fork('df'), positions: dfPos, count: dfPos.length, size: 3.4,
      selfLit: 0.6, varieties: [['#18d8c8', '#1a8aa0'], ['#ff5a3c', '#b03a24'], ['#6dff8a', '#2a9a4a'], ['#ffc02a', '#b07818'], ['#F6F0B8', '#a0a060']],
      light: { sunDir: [0.1, 1, 0.05], sunColor: H.sun, sunIntensity: 1.6 * H.gain, sky: '#a8d8a0', skyIntensity: hour === 'night' ? 1.5 : 1.3, ground: '#3fae6a', groundIntensity: 1.5 } });
    scene.add(dfl.object);
    await ctx.yield();

    // ---- rare event, the Great Tipping: a ring of white water that overtakes the camera
    let tipRing = null; const uTip = 0.52, iTip = (895 - camYAt(uTip)) / 12.5;
    if (rare) {
      const tp = [], ti = [], SG = 64, RD = [18, 26, 34, 42];
      for (let l = 0; l < 3; l++) { const b0 = tp.length / 3;
        for (let k = 0; k < 4; k++) for (let q = 0; q <= SG; q++) { const a = q / SG * TAU; tp.push(Math.sin(a) * RD[k], (l - 1) * 7, Math.cos(a) * RD[k]); }
        for (let k = 0; k < 3; k++) for (let q = 0; q < SG; q++) { const a = b0 + k * (SG + 1) + q, b = a + SG + 1; ti.push(a, a + 1, b, a + 1, b + 1, b); } }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setIndex(ti);
      tipRing = new THREE.Mesh(tg, new THREE.ShaderMaterial({ uniforms: { uT: U.uT, uK: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`uniform float uT; varying vec3 vL; varying vec2 vQ; void main(){ vec3 p=position; float a=atan(p.x,p.z), r=length(p.xz);
          vL=vec3(a,(r-18.0)/24.0,p.y/7.0); vQ=p.xz; p.y+=sin(a*5.0+uT*2.2)*1.6+sin(a*9.0-uT*3.0+p.y)*0.8+(r-30.0)*0.25*sin(a*3.0+uT*1.3);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
        fragmentShader: /* glsl */`${G} uniform float uK; varying vec3 vL; varying vec2 vQ; void main(){
          float n=vn3(vec3(vQ*0.2,uT*1.1+vL.z*2.0)), n2=vn3(vec3(vQ*0.63+7.0,uT*2.1+vL.z*5.0));
          float e=smoothstep(0.0,0.3,vL.y)*(1.0-smoothstep(0.55,1.0,vL.y));
          gl_FragColor=vec4(vec3(0.82,0.93,1.0)*uK*e*(0.08+0.92*n*n)*(0.5+0.7*n2)*(1.0-0.35*abs(vL.z))*0.5,1.0); }` }));
      tipRing.frustumCulled = false; tipRing.renderOrder = 5; scene.add(tipRing);
    }
    await ctx.yield();

    await ctx.yield();
    await sky.prewarm?.(ctx.renderer, null, scene);

    // ---- flight
    const uBasin0 = uAtY(838), uBasin1 = uAtY(768), closeB = A.basinAt(8).position;
    const uSeat = Math.max(0.66, uVillage + 0.055);
    const _wq = new V3(), _wp = new V3();
    // the gaze on the helix: ACROSS the well and a little down, so each storey is seen on the far wall with the shaft's depth below it
    // (the gaze also nods slowly: steeper onto the terraces and the pipes' mouths, wider across the well between them)
    // THE GAZE IS LEVEL (polish, 6 Oct): the far wall was looked at 26 +- 11 m below the lens from 49 m (28 degrees down, 35 with the
    // path's own fall), which stood every trunk and pool 20-35 degrees askew at the frame's sides. Now the target lies 5 degrees
    // below the lens (13 with the path's fall), 22 in the village (30 with the fall: its lanterns lie below, and that storey is kept as it was), and tips down again from the pipes on for the Root Fall, the pool and the Ring.
    // Its bearing is the far wall's, turned onto the storey's subject while that storey passes (angles blended, never positions).
    const lerpAng = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
    const wallAt = (time, u) => { path.pointAt(u, _wq); const cy = _wq.y, k = -34 / Math.max(Math.hypot(_wq.x, _wq.z), 1);
      let ang = Math.atan2(_wq.x * k - _wq.x, _wq.z * k - _wq.z), dist = 49;
      for (const S of SUBJ) { const w = sst(S.y0 + 26, S.y0 - 8, cy) * sst(S.y1 - 24, S.y1 + 10, cy); if (w <= 0) continue;
        const dx = S.p[0] - _wq.x, dz = S.p[1] - _wq.z; ang = lerpAng(ang, Math.atan2(dx, dz), w); dist = lerp(dist, Math.hypot(dx, dz), w); }
      const pit = (5 + 17 * sst(520, 480, cy) * sst(cathTop - 6, cathTop + 30, cy) + 28 * sst(cathTop - 25, 172, cy)) * D2R;      // (r4) from the pipes the gaze follows the Root Fall down toward the pool (was 23 * sst(285, 185, cy))
      return _wp.set(_wq.x + Math.sin(ang) * dist, cy - dist * Math.tan(pit), _wq.z + Math.cos(ang) * dist); };
    // (r4) THE LOOK DOWN TO THE RING: straight down the shaft every trunk, vine and fall is a line running to the middle of the frame,
    // which read as smear. One ceiling on how steeply the gaze may look down at the seat, the same wherever it looks at it from above:
    // up to 48 degrees it is the true pitch; steeper than that it eases toward 60 degrees and never passes it.
    const _ws = new V3(), _wt = new V3(), capDown = (from, to) => { const hd = Math.max(Math.hypot(to.x - from.x, to.z - from.z), 1), pit = Math.atan2(from.y - to.y, hd), cap = 48 * D2R, top = 12 * D2R;
      if (pit > cap) to.y = from.y - hd * Math.tan(cap + top * (1 - Math.exp(-(pit - cap) / top))); return to; };
    const gazeAt = (time, u) => { wallAt(time, u); const k = sst(0.80, 0.87, u); return k > 0 ? capDown(_wq, _ws.copy(_wp).lerp(seat, k)) : _wp; };
    const seatAt = (time, u) => capDown(path.pointAt(u, _wt), _ws.copy(seat));
    SUBJ[2].y0 = cathTop + 8; SUBJ[2].y1 = rootFall ? rootFall[3] - 10 : 226;      // (r4) the bearing stays on the Cathedral's trunk while the Root Fall drops below it, until the gaze goes to the Ring
    const pois = [
      { at: [0, 868, 0], from: 0.02, to: 0.15, weight: 0.5 },
      { at: gazeAt, from: 0.12, to: 0.99, weight: 0.86, fade: 0.1 },
      { at: closeB, from: uBasin0, to: uBasin1, weight: 0.3 },
      { at: villageC, from: uVillage - 0.07, to: uVillage + 0.05, weight: 0.45 },
      { at: seatAt, from: 0.86, to: 1.0, weight: 0.75, fade: 0.2 },
    ];
    let thruK = 1.6; const camP = new V3(), tmpC = new THREE.Color(), wingBase = C('#b7bf58'), fogAbove = weather === 'downpour' ? 0.0019 : weather === 'mist' ? 0.0021 : 0.0011;

    return {
      scene, path, duration: 50,
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 4200, lookAhead: 14, sway: 0.4, bank: 0.25 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#fff0c4', glow: 1.1, revealDistance: 420 },
      post: { exposure: H.exposure * (weather === 'mist' ? 0.9 : 1), bloom: { strength: 0.5, radius: 0.7, threshold: 0.93 },
        grade: { saturation: 1.08, contrast: 1.05, tint: hour === 'dusk' ? '#fff2e4' : '#fbfff6', shadowTint: '#04181c', vignette: 0.36, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        camera.updateMatrixWorld(); camP.setFromMatrixPosition(camera.matrixWorld);
        const cy = camP.y, D = 900 - cy, inK = sst(908, 888, cy);
        U.uT.value = time; fxTime.value = time; U.uCamY.value = cy; U.uCamP.value.copy(camP);
        // fog: colour from the depth ramp, density from being inside the well
        tmpC.copy(fogRamp[0]).lerp(fogRamp[1], sst(0, 200, D)).lerp(fogRamp[2], sst(200, 550, D)).lerp(fogRamp[3], sst(550, 880, D));
        fogCol.copy(fogTop).lerp(tmpC, inK); backU.value.copy(tmpC); mistU.value.copy(mist0).multiplyScalar(lerp(1, 0.5, sst(0, 880, D)) * inK); goldU.value.copy(gold0).multiplyScalar(lerp(0.04, 0.5, sst(60, 760, D)) * inK); deepU.value = lerp(0.6, 1, sst(80, 520, D)) * sst(40, 130, cy - seat.y);
        let dn = lerp(0.0056, 0.0086, sst(60, 330, D)); if (weather === 'mist') dn *= 1.0 + 0.35 * Math.sin(D / 62); else if (weather === 'downpour') dn *= 1.12;
        scene.fog.color.copy(fogCol); scene.fog.density = lerp(fogAbove, dn, inK);
        const skyK = 1 - sst(891, 908, cy) ; sky.setOpacity(1 - skyK); sky.object.visible = skyK < 0.99; const cloudsOn = cy > 872; for (const cf of cloudFields) cf.object.visible = cloudsOn;
        discU.uDisc.value = sst(897, 866, cy); thruK += ((ctx.through ? 1.6 : 1) - thruK) * Math.min(1, dt * 1.2); shaftU.value = sst(880, 912, cy) * thruK * (0.4 + 0.6 * sst(45, 120, Math.hypot(camP.x, camP.z)));      // close to, the shafts thin so the mouth and its first falls show through
        const top = cy > 835; for (const m of topOnly) m.visible = top;
        wallUp.visible = cy > 610; wallMid.visible = cy < 880 && cy > 430; wallLo.visible = cy < 680; pipeMesh.visible = cy < 520; heronMesh.visible = wallMid.visible; villageMesh.visible = cy < 790;
        bandLeaves.instanceCount = Math.round(bandN * (0.4 + 0.6 * sst(903, 884, cy)) / 8) * 8; staticLeaves.instanceCount = cy > 899 ? staticAll : cy > 890 ? staticNear : staticSkirt;   // from over the canopy only the lip's own growth shows
        if (plume.uniforms.uOpacity) plume.uniforms.uOpacity.value = 0.14 * sst(45, 120, Math.hypot(camP.x, camP.z));
        hemi.intensity = lerp(1.4, 0.8, inK);
        sky.update(dt, time, camera); if (cloudsOn) for (const cf of cloudFields) cf.update(dt, time, camera);
        // hero: basin cycles, rainbow and glow reveal; the Great Tipping pulls every basin into one phase
        let tHero = time;
        if (rare) { const k = sst(0.4, 0.47, u) * (1 - sst(0.6, 0.7, u)), lag = lerp(lag0, 0.012, k); HU.uLag.value = lag; tHero = time + iTip * (lag - lag0) / rate0;
          const ry = camYAt(uTip) + (uTip - u) * 2400; tipRing.position.y = ry; tipRing.material.uniforms.uK.value = 0.85 * sst(170, 50, Math.abs(ry - cy)) * sst(0.3, 0.4, u); }
        const elev = sst(55, 110, cy - seat.y); HU.uMistK.value = 1 - 0.7 * elev; hero.parts.column.material.uniforms.uK.value = 0.085 * (1 - 0.85 * elev);      // from high above, the spray and the light column must not veil the bridge
        hero.setProgress(u); HU.uRainbow.value *= H.rainbow; HU.uGlow.value *= 1 - 0.72 * sst(0.9, 0.975, u); hero.update(dt, tHero, camera);
        // lifts: the near pair is keyed to the flight (one rises past the lens in the village), the others loop
        const s0 = clamp((u - uVillage) * 430, -105, 105), s1 = 72 * Math.sin(time * 0.11 + 1), s2 = 84 * Math.sin(time * 0.09 + 4);
        const ly = [385 + s0, 385 - s0, 402 + s1, 402 - s1, 378 + s2, 378 - s2];
        for (let i = 0; i < 6; i++) { lifts[i].position.y = ly[i]; glows.setPosition(nPodLamps + i, liftLines[i].x, ly[i] + 1.95, liftLines[i].z); }
        if (balloons) for (let i = 0; i < kitePos.length; i++) { const p = kitePos[i]; balloons.setPosition(i, p[0] + Math.sin(time * 0.31 + i) * 1.4, p[1] + Math.sin(time * 0.17 + i * 2.1) * 7, p[2] + Math.cos(time * 0.27 + i * 1.3) * 1.4); }
        for (let i = 0; i < skyL.length; i++) { const q = skyL[i], h = (time * 2.4 * q[3] + q[2] * 150) % 150, a = q[0] + 0.3 * Math.sin(time * 0.13 + i);      // 150 m of climb, then the next one starts
          skyLan.setPosition(i, Math.sin(a) * q[1] + h * 0.1 + Math.sin(time * 0.21 + i * 1.7) * 1.6, 852 + h, Math.cos(a) * q[1] + h * 0.04 + Math.cos(time * 0.17 + i * 2.3) * 1.6); }
        flyU.uFlockY.value = camYAt(uFlock) + (u - uFlock) * 900;
        if (flies) flies.setOpacity(inK * (0.3 + 0.7 * sst(430, 650, D)));
        dfl.update(dt, time, camera, u);
        // our wing rides with the lens; it is not drawn while this world is only seen through a portal
        wing.matrix.copy(camera.matrixWorld); wing.matrixWorld.copy(camera.matrixWorld);
        wingU.uWing.value = clamp(u * 150, 0, 1) * (1 - sst(0.9, 0.96, u));       // gone before it could cross the portal
        wingU.uWingCol.value.copy(wingBase).multiplyScalar(hourDim * lerp(1.15, 0.5, sst(0, 880, D)));
      },
      dispose() { sky.dispose?.(); hero.dispose?.(); for (const d of disposables) d.dispose?.(); },
    };
  },
};
