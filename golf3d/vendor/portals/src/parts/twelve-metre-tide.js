// Twelve Metres of Tide: the hero. A Breton granite harbour at dead low water that fills while we watch.
//
// WHAT IT IS (local space; origin = middle of the quay foot, +Y up, the harbour and the sea are toward +Z)
//   - the quay: face on z = 0 (battered, foot at z = 1.2), x -100..100, sand at y ~ 0, rim at y = 14. Its granite is
//     banded by the tide in the shader: green weed, ochre wrack, the black lichen line, pale stone with gold lichen.
//   - two moles (rim y 14) closing the basin: the east one ends in the pier head that carries the red-and-white
//     lighthouse (top y 34), the west one in a plain head. The gap between the heads is 29 m wide, centre x = 8, z ~ 151.
//   - on the face: iron ladders, a stone stair, a slipway by the west mole, bollards, mooring chains draped to the sand.
//   - the harbour floor: rippled wet sand with a drainage channel (hero.sandHeight(x, z)), forty boats lying heeled,
//     lobster pots and marker buoys. The tide surface is part of the hero: it floods the floor as a racing edge,
//     and every boat rights itself, floats and swings to its mooring (head to the flood that comes in through the gap) when the
//     water reaches it (vertex shader; nothing moves on the CPU).
//   - seaward of the east mole: the reef it was built against (sea-worn granite in metre facets, meshed from a density so
//     cliffs and overhangs are tiled like ledges: a crest above the parapet, a tall stack at the seaward corner, ledges the
//     swell breaks on, a white daymark), a second stack and a beacon skerry further out, and with opts.arch a sea arch 34 m
//     across and 33 m tall whose throat holds the world's portal (opts.portal, opts.portalDir; the portal's light lies on
//     its stone). hero.reefHeight(x, z) is the reef's footprint; the tide surface breaks white round all of it.
//   - above the rim: slate-roofed houses with shutters, hydrangeas, a market square with a calvary cross and stalls
//     whose striped awnings pop up, bunting, a small church, and a grassy headland behind so the back is closed.
//
// PROGRESS (the world MUST call one of these every frame; they only write uniforms)
//   hero.setProgress(u)   u = the world's path progress 0..1. Default staging: tide rises over u 0.10..0.60,
//                         shutters open and awnings pop over u 0.56..0.84.
//   hero.setTide(t)       0..1 directly (0 = dry floor with a thread of water in the channel, 1 = high water y 12)
//   hero.setVillage(o)    0..1 directly (shutters, awnings)
//   hero.setFront(zAt, slant, xRef, film)   optional: the first flood comes as a front, a wavering bright line of foam on
//                         z = zAt - slant * (x - xRef) that the world sweeps from seaward to the quay foot (water, foam, wet sand
//                         and the boats' righting all follow it). film 0..1: behind the front the sand itself is a mirror, a film of
//                         water a finger deep, until the tide plane has risen over it. zAt = -1e4: everything is reached.
//   hero.tideY()          current water level in local metres (ride the camera at tideY() + 2.6)
//   hero.setLight({ sunDir, sunColor, skyHorizon, skyZenith })   what the wet sand and the water mirror (linear Colours,
//                         sunDir = direction TO the sun). Call once after building the sky.
//   If none of the progress setters is ever called (the set-piece viewer), the piece demonstrates itself: the tide
//   follows the bearing of the orbiting camera, so one orbit shows low water, the flood and high water.
//
// OPTS  { palette: 10 hex strings [granite, black band, ochre, weed, shutter blue, sand, lighthouse red, white, slate, sea],
//         hour: 0..24 (default 8; before 7 or after 19 the lamp and its beams are strong, by day they are faint),
//         wet: 0..1 (rain sheen on stone, slate and paving), season: 'summer' | 'late' (hydrangeas blue-violet or pink-rust),
//         look: 0 | 1 | 2 (shutter and hull colour family: blues / sea-greens / faded reds; default from the seed),
//         water: true (false = the world supplies its own tide surface; boats still float on hero.setTide),
//         floor: true (false = no sand mesh; then supply terrain matching hero.sandHeight),
//         fill: 0.1 (sky-coloured fill added to every surface so shaded walls keep colour; 0 = none),
//         shadows: false (true = the meshes cast and receive the scene's one shadow map; boats and cloth carry depth materials
//         that make the same vertex animation), portal: [x, y, z, radius, colour] (its light is mirrored on the tide: setPortalGlow(k)),
//         pool: [x, z, rx, rz] (one more pool of standing water on the sand, e.g. beside the berth),
//         arch: true (the sea arch round opts.portal), ship3: [x, z, yaw, scale] (a third hull of the tunny boat's lines for the
//         world to sail: hero.moveShip(2, x, z, yaw) writes its instance matrix),
//         ship: [x, z, yaw, scale] (the old sailing tunny boat, 24 m, two masts, tan sails hoisted to dry: she stands on her legs
//         at low water and floats with the others), ship2: the same for a smaller sister, portalDir: [dx, dz] (the way the portal
//         is approached: its light is mirrored for any facing), glitter: 0..1 (strength of the sun's road on the water), keepOut: [[x, z, r], ...] (discs the scattered boats and buoys stay out of),
//         sand: '#hex' (sand colour of this look), sheen: 0..1 (how much sky the wet sand mirrors; lower by moonlight),
//         band: 0.5 (how dark the freshly wetted band ahead of the first flood is: a darker ground for its white line) }
//       world hooks: berth: [x, z] and berthYaw (where the pots gather; default [-66, 40]), fly: [[x, y, z], ...] (the world's own
//         camera line; boats, pots and buoys keep clear of it instead of the default flyThrough), waterSize: 1500 (side of the
//         tide plane, metres), extend: async (api) => {} called before the meshes are made with { G, GC, GW, vcol, mixc, C, blob,
//         sandHeight, hillHeight, wallZ, RIM, pal, flyDist } so a world can merge its own granite, slate and cloth into the
//         same two draw calls.
//       also returned: uniforms, materials { solid, boat, cloth }, setShade(x, z, amount, scale) (cloud shadows sweeping over
//         every surface: pattern offset, darkening 0..1, pattern scale per metre), setWindows(v) (warm light in about half of
//         the windows, 0 = dark glass), setLamp(glow, beams) (lighthouse lamp and beam brightness, overriding `hour`).
//       staging hooks (all optional): lampXs: [x, ...] (up to 8 quay lamps; setPool(v) lights warm pools under them on the
//         setts, the wall and the water), awning: 0 | 1 | 2 (stall stripe family), berthDir: [dx, dz] (which way the pots
//         and buoys fan out from the berth), moorings: [[x, z, yaw, scale], ...] (boats forced to these spots before the
//         scatter), posts: [[x, z, type], ...] (0 = timber mooring pile, 1 = red can perch, 2 = green cone perch),
//         oysters: true (trestle tables on the flats, x -38..-3, z 46..86, plus three tractors that drive off up the west
//         slip: setTractors(q), q 0..1 along their way). setLight also takes { ambient, sunPower } for the reflections.
//       Surface kind 0.1 = basin ironwork and timber (ladders, chains, piles): wet line, weed and barnacles follow the tide.
//       The quay face beside the berth carries fender baulks, mooring rings with rust streaks and tufts of wrack (cloth mesh,
//       animation type 4) that hang until the water reaches them, then swing out and float. The tide surface also draws the
//       swell that runs in through the gap, the white water round the feet of both pier heads and the streaks of the flood
//       in the fairway (the world adds the spray: its beat is 2 pi / 1.25 s, phase z * 0.0334).
//       The solid, boat and cloth materials share one shader text; each carries its own customProgramCacheKey.
//
// ANCHORS (local space)
//   start        where the grounded blue boat lies (kept clear of other boats, pots around it); camera eye ~ +2.6 m
//   berthYaw     heading of that boat (radians about Y; bow toward +X, along the quay)
//   flyThrough   ordered eye points: along the foot of the wall, up with the tide past ladder and weed, over the rim
//                level, a wide turn in the basin, straight out through the gap. >= 6 m clear of everything.
//   portalSeat   { position, facing } centre of the 14 m portal in the gap beside the lighthouse, facing -Z (back at us)
//   viewpoints   floorLookUp / rimReveal / lighthouse: { position, target } pairs worth a poi
//   lighthouse, lamp, square, tide { low, high }, rimY
//
// SIZE true extent ~170 m from the centre (reported radius 120, centre (0, 24, 40)), height 36. COST ~80k triangles,
// 9 draw calls (sand, headland, granite-and-village, shutters-awnings-flowers, boats, their mirror images, buoys, tide, lamp beams;
// 11 with opts.ship: the tunny boat and her image), ~300 ms,
// no lights. LIGHT: a low warm morning sun from the east or south-east (it rakes the quay face), cool hemisphere,
// thin fog. Materials are MeshStandard with injected detail, so scene lights and fog apply; the water and lamp are
// ShaderMaterials writing linear colour with scene fog.
import * as THREE from 'three';
import { makeRng, hashSeed } from '../kit/core.js';

const C = (h) => new THREE.Color(h);
const PAL = ['#8b847c', '#17191b', '#a67a30', '#42561f', '#2c5fa6', '#cdbb93', '#c23a2e', '#efe9dd', '#46536a', '#5d9db3'];
const TIDE_LOW = -0.55, TIDE_HIGH = 12.0, RIM = 14;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- flat-shaded geometry writer with a yaw + translate transform ----------------------------------------------------
class GW {
  constructor(anim = false) { this.p = []; this.n = []; this.c = []; this.k = []; this.kind = 0; this.anim = anim; this.pv = []; this.an = []; this.piv = [0, 0, 0]; this.ani = [0, 0, 0, 0]; this.xf(0, 0, 0, 0); }
  xf(x, y, z, yaw) { this.tx = x; this.ty = y; this.tz = z; this.cs = Math.cos(yaw); this.sn = Math.sin(yaw); }
  T(v) { return [this.tx + v[0] * this.cs + v[2] * this.sn, this.ty + v[1], this.tz - v[0] * this.sn + v[2] * this.cs]; }
  pivot(v, type, delay, par, ph) { this.piv = this.T(v); this.ani = [type, delay, par, ph]; }
  tri(a0, b0, c0, col, colB, colC) {
    const a = this.T(a0), b = this.T(b0), c = this.T(c0);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    const cb = colB || col, cc = colC || col;
    this.c.push(col.r, col.g, col.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
    for (let i = 0; i < 3; i++) { this.n.push(nx, ny, nz); this.k.push(this.kind); if (this.anim) { this.pv.push(this.piv[0], this.piv[1], this.piv[2]); this.an.push(this.ani[0], this.ani[1], this.ani[2], this.ani[3]); } }
  }
  quad(a, b, c, d, col, col2) { this.tri(a, b, c, col, col, col2 || col); this.tri(a, c, d, col, col2 || col, col2 || col); }
  // box centred at (cx,cy,cz), own yaw ry (inside the current transform); taper shrinks the top
  box(cx, cy, cz, sx, sy, sz, col, ry = 0, taper = 1, colTop) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, cs = Math.cos(ry), sn = Math.sin(ry);
    const P = (x, y, z) => { const k = y > 0 ? taper : 1; return [cx + (x * cs + z * sn) * k, cy + y, cz + (-x * sn + z * cs) * k]; };
    const v = [P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(-hx, hy, -hz), P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)];
    const t = colTop || col;
    this.quad(v[4], v[5], v[6], v[7], col, t); this.quad(v[1], v[0], v[3], v[2], col, t);
    this.quad(v[5], v[1], v[2], v[6], col, t); this.quad(v[0], v[4], v[7], v[3], col, t);
    this.quad(v[7], v[6], v[2], v[3], t); this.quad(v[0], v[1], v[5], v[4], col);
  }
  // upright n-gon frustum
  prism(n, r0, r1, y0, y1, col, cx = 0, cz = 0, cap = 3, ph = 0, col1) {
    const c1 = col1 || col;
    for (let i = 0; i < n; i++) {
      const a0 = ph + i / n * Math.PI * 2, a1 = ph + (i + 1) / n * Math.PI * 2;
      const b0 = [cx + r0 * Math.sin(a0), y0, cz + r0 * Math.cos(a0)], b1 = [cx + r0 * Math.sin(a1), y0, cz + r0 * Math.cos(a1)];
      const t0 = [cx + r1 * Math.sin(a0), y1, cz + r1 * Math.cos(a0)], t1 = [cx + r1 * Math.sin(a1), y1, cz + r1 * Math.cos(a1)];
      this.tri(b0, b1, t1, col, col, c1); this.tri(b0, t1, t0, col, c1, c1);
      if (cap & 1) this.tri([cx, y1, cz], t0, t1, c1);
      if (cap & 2) this.tri([cx, y0, cz], b1, b0, col);
    }
  }
  // a bar of square (or n-sided) section from a to b
  beam(a, b, w, col, sides = 4, col2) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1;
    const d = [dx / l, dy / l, dz / l], up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let s = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]; const sl = Math.hypot(s[0], s[1], s[2]) || 1; s = [s[0] / sl, s[1] / sl, s[2] / sl];
    const t = [d[1] * s[2] - d[2] * s[1], d[2] * s[0] - d[0] * s[2], d[0] * s[1] - d[1] * s[0]];
    const ring = (o) => { const r = []; for (let i = 0; i < sides; i++) { const an = (i + 0.5) / sides * Math.PI * 2, cx = Math.cos(an) * w * 0.7, sx = Math.sin(an) * w * 0.7; r.push([o[0] + s[0] * cx + t[0] * sx, o[1] + s[1] * cx + t[1] * sx, o[2] + s[2] * cx + t[2] * sx]); } return r; };
    const r0 = ring(a), r1 = ring(b);
    for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; this.quad(r0[i], r1[i], r1[j], r0[j], col, col2 || col); }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(this.k, 1));
    if (this.anim) { g.setAttribute('aPiv', new THREE.Float32BufferAttribute(this.pv, 3)); g.setAttribute('aAn', new THREE.Float32BufferAttribute(this.an, 4)); }
    return g;
  }
  get tris() { return this.p.length / 9; }
}

// Vertex normals of an indexed mesh, exactly as BufferGeometry.computeVertexNormals() makes them (the same float sums in the same
// order, so the same numbers), but in short steps with yields: three's own, called first on a cold page, is one long stretch.
async function stepNormals(g, pos, idx, ctx) {
  const nrm = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
    const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    if (t % 6000 === 5997) await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < nrm.length; i += 3) { const x = nrm[i], y = nrm[i + 1], z = nrm[i + 2], s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1); nrm[i] = x * s; nrm[i + 1] = y * s; nrm[i + 2] = z * s; }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
}

// ---- shader pieces ----------------------------------------------------------------------------------------------------
const NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fb(vec2 p){ return vn(p) * .5 + vn(p * 2.13 + 7.1) * .3 + vn(p * 4.7 + 3.3) * .2; }
`;
// the front of the first flood: a wavering line that sweeps in from the harbour mouth to the foot of the quay. It stands on
// z + uFront.y * x = uFront.x (uFront.y = how far it slants: the sea comes from ahead and to seaward, not square on)
const FRONT = /* glsl */`
uniform vec2 uFront;
float frontQ(vec2 p){ return p.y + uFront.y * p.x + 9. * (fb(p * .045) - .5) + 1.5 * sin(p.x * .11 + 1.7) - uFront.x; }
`;
// kinds: 0 plain, 1 granite wall (tide bands), 2 slate, 3 render, 4 setts, 5 glow, 6 headland (grass / setts by colour), 8 sand, 9 glass
const SOLID_FRAG_HEAD = /* glsl */`
uniform float uTide, uWetAll, uGlow, uTime, uFill, uWin, uPool, uFilm, uSheen, uBand; uniform vec3 uBlack, uOchre, uWeed, uSkyH, uSkyZ, uSunCol, uSunDir; uniform vec4 uShade, uPoolAt, uPortal, uLH; uniform vec3 uPortalCol; uniform float uLampX[8];
varying float vK; varying vec3 vWp, vWn; varying vec2 vSh;
${NOISE}
${FRONT}
vec3 tideBands(vec3 g, float y, float u, float tone, out float bw, out float bb){
  float nz = fb(vec2(u * .11, 2.3)) * 2.6 + fb(vec2(u * 1.3, y * .6)) * 1.3 - 1.9;
  float yy = y + nz;
  vec3 weed = uWeed * (.3 + 1.5 * fb(vec2(u * 6., y * 1.1))) * (.7 + .5 * smoothstep(0., 4., y));
  weed = mix(weed, uWeed * vec3(1.5, 1.05, .45), smoothstep(.45, .75, fb(vec2(u * .9, y * 2.) + 5.)));
  vec3 ochre = mix(uOchre * (.45 + .6 * tone), g * uOchre * 2.4, .6) * (.7 + .6 * fb(vec2(u * 3., y * .7)));
  ochre.r = min(ochre.r, ochre.g * 1.5); ochre.b = max(ochre.b, ochre.g * .26);      // ochre-brown, never crimson in warm light
  vec3 black = mix(uBlack * 2.4, g * .34, .55) * (.75 + .6 * fb(vec2(u, y) * 1.7));      // the darkest band, with the stone and its joints still showing through
  float bW = 1. - smoothstep(3.2, 5.2, yy + fb(vec2(u * .6, 7.)) * 2. + vn(vec2(u * 5., 1.)) * .9 - 1.4), bO = 1. - smoothstep(8.9, 10.1, yy), bB = 1. - smoothstep(11.0, 12.0, yy);
  float yq = (floor(y / .46) + .5) * .46 + fb(vec2(u * .11, 2.3)) * 2.6 - 1.25 + (tone - .5) * .8;      // the black lichen line steps with the courses
  bB = mix(bB, 1. - smoothstep(11.3, 11.55, yq), .6);
  vec3 c = mix(g, black, bB * .8); c = mix(c, ochre, bO * .68);
  float bN = (1. - smoothstep(7.2, 8.9, yy + vn(vec2(u * 2.3, 3.)) * 1.1)) * smoothstep(3.4, 4.9, yy);      // the barnacle zone: pale, speckled, as tall as the weed below it
  c = mix(c, vec3(.55, .52, .44) * (.6 + .7 * vn(vec2(u, y) * 9.)) + g * .3, bN * .62);
  c = mix(c, weed, bW * .95);
  float li = smoothstep(.5, .68, fb(vec2(u, y) * .8 + 11.)) * (1. - bB) * smoothstep(.34, .6, vn(vec2(u, y) * 4.3 + 2.)) * (.55 + .45 * vn(vec2(u, y) * 15.));      // gold lichen in crusts the size of a hand, not a wash
  c = mix(c, uOchre * vec3(1.55, 1.4, .8), li * .62);
  float lg = smoothstep(.6, .72, vn(vec2(u, y) * 2.3 + 31.)) * smoothstep(.4, .65, vn(vec2(u, y) * 9. + 7.)) * (1. - bB);      // grey-white crusts beside it
  c = mix(c, vec3(.6, .61, .56), lg * .3);
  bw = bW; bb = bB * (1. - bO);
  return c;
}
// warm pools under the quay lamps (x positions in uLampX; d = how the pool falls off away from the lamp line)
float lampPool(float x, float d){ float s = 0.; for (int i = 0; i < 8; i++) { float dx = x - uLampX[i]; s += 1. / (1. + (dx * dx + d * d) * .09); } return s; }
`;
const SOLID_FRAG_COLOR = /* glsl */`
vec3 baseC = diffuseColor.rgb; vec3 wn = normalize(vWn + vec3(0., 1e-5, 0.)); vec3 wp = vWp;
float wetK = uWetAll * .6, sandArg = 0., sandWet = 0., glassK = 0., winK = 0., poolK = 0., lampK = 0., filmK = 0., frontK = 0., bumpH = 0., bumpK = 0., clothT = 1., rockWet = 0.;
vec2 tg = vec2(-wn.z, wn.x); float tl = length(tg);
float wu = tl > .3 ? dot(wp.xz, tg / max(tl, 1e-3)) : wp.x; float wv = tl > .3 ? wp.y : wp.z;
if (vK > .5 && vK < 1.5) {
  // coursed granite: courses 46 cm tall, stones of uneven length (every upright joint shifted), joints raked back, the grain close to
  float row = floor(wv / .46); float uo = wu / 1.02 + h21(vec2(row, 3.7)) * 7.;
  float ci = floor(uo), lo = ci + (h21(vec2(ci, row + .5)) - .5) * .5, hi = ci + 1. + (h21(vec2(ci + 1., row + .5)) - .5) * .5;
  if (uo < lo) { hi = lo; ci -= 1.; lo = ci + (h21(vec2(ci, row + .5)) - .5) * .5; }
  else if (uo > hi) { lo = hi; ci += 1.; hi = ci + 1. + (h21(vec2(ci + 1., row + .5)) - .5) * .5; }
  vec2 cell = vec2(ci, row); float tone = h21(cell), vd = dot(vViewPosition, vViewPosition), jw = .028 + .0011 * sqrt(vd);
  float dxm = min(uo - lo, hi - uo) * 1.02, dym = min(fract(wv / .46), 1. - fract(wv / .46)) * .46;      // metres to the nearest joint
  float mort = smoothstep(0., jw, dxm) * smoothstep(0., jw, dym);
  vec3 g = baseC * (.72 + .52 * tone); g = mix(g * vec3(1.1, .97, .9), g * vec3(.96, 1., 1.05), step(.35, tone));      // warm stones and cool ones
  g *= .84 + .32 * fb(vec2(wu, wv) * 2.3 + cell * 3.7);
  g *= 1. + (vn(vec2(wu, wv) * 27.) - .5) * .36 / (1. + vd * .004);
  g *= mix(mix(.44, .8, smoothstep(900., 14000., vd)), 1., mort);
  float bw, bb; vec3 c = tideBands(g, wp.y, wu, tone, bw, bb);
  float wl = 1. - smoothstep(uTide + .25, uTide + .9, wp.y + fb(vec2(wu * .7, 1.)) * .5);
  wetK = max(wetK, max(wl, bw * .55)); c *= mix(1., mix(.62, .84, bb), wl);
  c = mix(c, vec3(dot(c, vec3(.3, .5, .2))) * vec3(1., 1., .97), .3 * wl);                  // wet stone loses colour, it does not redden
  float lineK = smoothstep(.5, .0, abs(wp.y - uTide - .32 - fb(vec2(wu * .7, 1.)) * .5));   // the dark fresh-wet line just above the water
  c *= 1. - .36 * lineK; rockWet = wl * .5;
  if (uPool > .001 && wp.y < 14.2) lampK = lampPool(wp.x, (14. - wp.y) * 1.35 + 1.2) * step(-104., wp.x) * step(wp.x, 104.) * step(-1., wp.z) * step(wp.z, 3.);
  bumpH = mort * (.75 + .5 * tone) + fb(vec2(wu, wv) * 2.6) * .55; bumpK = 1.;      // rock-faced blocks standing proud of their joints: a low sun rakes them
  diffuseColor.rgb = c;
} else if (vK > 1.5 && vK < 2.5) {
  float row = floor(wp.y * 3.1); float uo = wu * 2.3 + h21(vec2(row, 1.3)) * 5.;
  float tone = h21(vec2(floor(uo), row)); vec2 f = vec2(fract(uo), fract(wp.y * 3.1));
  vec3 c = baseC * (.7 + .5 * tone) * mix(.6, 1., smoothstep(0., .18, f.y)) * mix(.8, 1., smoothstep(0., .08, f.x));
  c = mix(c, uOchre * 1.2, smoothstep(.62, .78, fb(wp.xz * .55 + 3.)) * .45);
  diffuseColor.rgb = c;
} else if (vK > 2.5 && vK < 3.5) {
  vec3 c = baseC * (.86 + .22 * fb(vec2(wu * .9, wp.y * .5)) + .06 * vn(vec2(wu, wp.y) * 9.)) * (1. - .11 * smoothstep(.42, .8, fb(vec2(wu * 2.7, wp.y * .21 + 3.))));      // lime render: blotches, rain streaks
  vec2 dl = wp.xz - uLH.xy; float rl = length(dl);
  if (rl < 3.7 && wp.y > 14.6 && wp.y < 30.5) {
    // the lighthouse: paint over coursed masonry, weathered by rain, rust weeping from the gallery, the lower courses scoured by spray
    float ang = atan(dl.x, dl.y + 1e-5) * 2.6, row = floor(wp.y / .44), uo = ang / .92 + h21(vec2(row, 5.1)) * 3.;
    vec2 f = vec2(fract(uo), fract(wp.y / .44)); float tone = h21(vec2(floor(uo), row)), vd = dot(vViewPosition, vViewPosition), jw = .035 + .0012 * sqrt(vd);
    float mort = smoothstep(0., jw, min(f.x, 1. - f.x) * .92) * smoothstep(0., jw, min(f.y, 1. - f.y) * .44);
    c = baseC * (.9 + .16 * tone) * mix(mix(.66, .9, smoothstep(900., 14000., vd)), 1., mort) * (.94 + .1 * fb(vec2(ang * .8, wp.y * .4)));
    float streak = smoothstep(.5, .8, vn(vec2(ang * 3.3, wp.y * .1 + 3.))) * smoothstep(.2, .7, vn(vec2(ang * 9., wp.y * .45)));
    c *= 1. - .24 * streak;
    float rust = smoothstep(.56, .82, vn(vec2(ang * 2.3 + 7., 1.))) * smoothstep(29.7, 28.2, wp.y) * smoothstep(21.5, 28.4, wp.y) * (.45 + .55 * vn(vec2(ang * 13., wp.y * 1.1)));
    c = mix(c, vec3(.4, .19, .09) * (.7 + .5 * tone), rust * .62);
    float peel = smoothstep(.5, .72, fb(vec2(ang * .9, wp.y * .7) + 3.)) * smoothstep(19.5, 15.4, wp.y);
    c = mix(c, vec3(.5, .47, .43) * (.72 + .5 * tone) * mix(.6, 1., mort), peel * .72);
    c = mix(c, vec3(.2, .24, .1), smoothstep(16.6, 15., wp.y + vn(vec2(ang * 1.7, 2.)) * 1.2) * .5);      // green at the foot
    bumpH = mort * .7 + tone * .25; bumpK = .9;
  }
  diffuseColor.rgb = c;
} else if (vK > 3.5 && vK < 4.5) {
  float row = floor(wp.z / .5); float uo = wp.x / .62 + h21(vec2(row, 9.1)) * 3.;
  float tone = h21(vec2(floor(uo), row)); vec2 f = vec2(fract(uo), fract(wp.z / .5));
  float mort = smoothstep(0., .08, f.x) * smoothstep(1., .92, f.x) * smoothstep(0., .1, f.y) * smoothstep(1., .9, f.y);
  diffuseColor.rgb = baseC * (.7 + .5 * tone) * mix(.55, 1., mort) * (.85 + .3 * fb(wp.xz * .2));
  if (uPool > .001 && wp.z < 1. && wp.z > -11.) lampK = lampPool(wp.x, (wp.z + 1.45) * 1.2 + .1) * 1.3;
} else if (vK > 5.5 && vK < 6.5) {
  float gr = smoothstep(0., .05, baseC.g - baseC.r);
  float row = floor(wp.z / .5); float uo = wp.x / .62 + h21(vec2(row, 9.1)) * 3.;
  float tone = h21(vec2(floor(uo), row)); vec2 f = vec2(fract(uo), fract(wp.z / .5));
  float mort = smoothstep(0., .08, f.x) * smoothstep(1., .92, f.x) * smoothstep(0., .1, f.y) * smoothstep(1., .9, f.y);
  vec3 sett = baseC * (.7 + .5 * tone) * mix(.55, 1., mort);
  vec3 grass = baseC * (.6 + .8 * fb(wp.xz * .3)) * (.8 + .4 * vn(wp.xz * 4.));
  grass = mix(grass, grass * vec3(1.3, 1.12, .6), smoothstep(.55, .8, fb(wp.xz * .08 + 2.)) * .7);
  vec3 top = mix(sett, grass, gr);
  float bw, bb; vec3 rock = tideBands(vec3(.36, .34, .32) * (.6 + .8 * fb(wp.xz * .6)), wp.y, wp.x + wp.z, .5, bw, bb);
  diffuseColor.rgb = mix(rock * (.75 + .5 * fb(wp.xz * 1.7)), top, smoothstep(11.6, 13.4, wp.y + fb(wp.xz * .25) * 2.2));
} else if (vK > 7.5 && vK < 8.5) {
  vec2 p = wp.xz; float n1 = fb(p * .045), n2 = fb(p * .4 + 3.);
  sandArg = (p.x * .86 + p.y * .5) * 3.6 + n2 * 9. + fb(p * .06) * 30.;
  float sfade = 1. / (1. + dot(vViewPosition, vViewPosition) * .00012); float rip = .5 + .5 * sin(sandArg) * sfade;
  vec3 c = baseC * (.74 + .34 * n1) * (.9 + .14 * rip);
  c = mix(c, c * vec3(.62, .66, .6), smoothstep(.5, .75, fb(p * .11 + 9.)) * .6);
  float fq = frontQ(p), ahead = 1. - smoothstep(0., 2.5, fq);                  // fq = metres behind the front of the flood (negative: not reached yet)
  float dryK = max(smoothstep(.12, .55, wp.y - uTide) * (1. - ahead), ahead);     // beyond the reach of the sea the floor is damp, not a mirror
  sandWet = clamp(mix(.74, .44, dryK) - .3 * rip + 1.5 * (fb(p * .028 + 4.) - .5) + smoothstep(.7, -.6, wp.y) * .6 * (1. - .6 * dryK), 0., 1.);
  poolK = smoothstep(.5, .62, fb(p * .052 + 2.3) + .1 * (1. - rip)) * smoothstep(2.4, 1.2, wp.y) * sfade;      // standing water left in the hollows
  { vec2 pd = (p - uPoolAt.xy) / uPoolAt.zw; poolK = max(poolK, smoothstep(1., .72, length(pd) + (fb(p * .7) - .5) * .7)); }      // the pool the boat lies beside
  sandWet = max(sandWet, poolK);
  c *= mix(1.06, .62, sandWet);
  float under = (1. - ahead) * smoothstep(.03, -.08, wp.y - uTide); sandWet *= 1. - under; poolK *= 1. - under; c *= 1. - .22 * under;      // under the sheet the water does the gleaming
  wetK = max(wetK, sandWet * .94);
  c *= 1. - uBand * max(smoothstep(.17, .02, wp.y - uTide + (fb(p * .5) - .5) * .06) * (1. - ahead), smoothstep(-7., -.4, fq) * ahead);      // the dark, freshly wetted band that runs ahead of the front
  // the first flood is a film a finger deep: behind the front the sand itself is the mirror, whatever its height, and the
  // front is a bright ragged line of foam with a second line of lace behind it (the tide plane takes over as the level rises)
  float run = step(-9000., uFront.x), lace = .5 + .5 * vn(p * 2.3 + uTime * .7);
  filmK = uFilm * smoothstep(.2, 2.4, fq) * (1. - under);
  frontK = run * (1. - .7 * under) * (smoothstep(-.4, .5, fq) * smoothstep(3.2, 1., fq) * (.45 + .55 * lace) * 1.8
    + smoothstep(5.5, 7., fq) * smoothstep(11.5, 8.5, fq) * smoothstep(.34, .62, vn(p * 1.6 - uTime * .5)) * .7);
  c *= 1. - .8 * filmK; sandWet *= 1. - .7 * filmK; poolK *= 1. - filmK; wetK = max(wetK, filmK * .86);
  diffuseColor.rgb = c;
} else if (vK > 6.5 && vK < 7.5) {
  glassK = 1.; wetK = 1.; winK = .3 + (vK - 6.6) * 1.75;
} else if (vK > 8.5 && vK < 9.5) {
  glassK = 1.; wetK = 1.;
} else if (vK > 9.5) {
  // sea-worn granite: rounded masses split by joints, pink-gold where the sun finds it, the tide's bands at its foot, lichen,
  // thrift in the hollows of the top, ledges whitened by the gulls
  vec2 q = wp.xz; float n1 = fb(q * .23 + wp.y * .17), n2 = fb(vec2(q.x + q.y * .6, wp.y * 1.3) * .8 + 4.), n3 = vn(q * 3.1 + wp.y * 2.3);
  float j1 = abs(fract(wp.x * .15 + wp.y * .07 + fb(wp.zy * .16) * 1.6) - .5), j2 = abs(fract(wp.y * .27 + fb(q * .19 + 3.) * 1.3) - .5), j3 = abs(fract(wp.z * .19 - wp.x * .05 + fb(wp.xy * .2 + 7.) * 1.5) - .5);
  float jm = min(j1, min(j2, j3)), crack = (1. - smoothstep(0., .07, jm)) * smoothstep(.3, .62, vn(q * .45 + wp.y * .4 + 2.)) * smoothstep(.35, .6, vn(q * 1.3 + wp.y * .9));      // joints are grooves the sun shades, broken every few metres: never an inked line
  float bed = smoothstep(.55, .9, vn(vec2(wp.y * 3.1 + n1 * 5. + q.x * .12, q.y * .22 + q.x * .1)));
  vec3 g = baseC * (.74 + .5 * n1) * (.84 + .32 * n3) * (.93 + .14 * vn(vec2(wp.y * 5.5 + n1 * 6., q.x * .4 + q.y * .3)));
  g = mix(g, g * vec3(1.1, .98, .88), smoothstep(.4, .7, n2));
  g *= 1. + (vn(vec2(wu, wv) * 14.) - .5) * .3 / (1. + dot(vViewPosition, vViewPosition) * .002);      // the grain of the stone, close to
  g *= (1. - .18 * min(crack, 1.)) * (1. - .16 * bed);
  float q3 = (wp.y + .1 * wp.x - .06 * wp.z) / 3. + (n1 - .5) * .22;             // the dipping beds the mesh is cut in: each its own tone, a shadowed parting under every ledge, fine laminae
  g *= .9 + .22 * h21(vec2(floor(q3), 7.3));
  g *= 1. - .3 * (1. - smoothstep(0., .07, abs(fract(q3) - .3))) * smoothstep(.3, .55, vn(q * .5 + 3.));
  g *= 1. - .1 * (1. - smoothstep(0., .12, abs(fract(q3 * 7. + n2 * .6) - .5)));
  float bw, bb; vec3 c = tideBands(g, wp.y, wp.x + wp.z * .7, n2, bw, bb);
  c = mix(c, g, smoothstep(12.4, 14., wp.y) * .6);                                // above the sea's reach the stone is itself, with a little lichen
  { float hw = wp.y - 12.45 + n2 * .9, rn = vn(vec2(wu, wv) * 2.7);              // metres above the high-water line, ragged: what the swell keeps wet
    c = mix(c, g * .3 + uBlack * .7, smoothstep(-.4, .3, hw) * (1. - smoothstep(1.3, 2.5, hw)) * .72);                             // the black lichen line
    c = mix(c, vec3(.62, .6, .52) * (.55 + .7 * vn(vec2(wu, wv) * 11.)), (1. - smoothstep(.4, 1.3, hw + n3 * .5)) * smoothstep(-1.4, -.3, hw) * .55);      // barnacles
    c = mix(c, uWeed * (.4 + 1.2 * vn(vec2(wu, wv) * 5.)), (1. - smoothstep(-.7, .15, hw + (rn - .5) * .9)) * .88);                 // a fringe of wrack at the water
    c = mix(c, uOchre * vec3(1.6, 1.4, .75), smoothstep(1.8, 3., hw) * (1. - smoothstep(6., 9., hw)) * smoothstep(.5, .68, fb(q * .5 + wp.y * .4 + 5.)) * smoothstep(.3, .6, vn(vec2(wu, wv) * 3.7)) * .6); }
  float wl = 1. - smoothstep(uTide + .3, uTide + 1.6, wp.y + n2 * .8);            // the swell keeps the foot of the rock wet
  wetK = max(wetK, max(wl * .9, bw * .5)); c *= mix(1., .58, wl); rockWet = wl;
  float topK = smoothstep(.62, .9, wn.y) * smoothstep(15.5, 17.5, wp.y + n1 * 2.) * smoothstep(.42, .6, fb(q * .31 + 11.));
  c = mix(c, vec3(.2, .27, .1) * (.7 + .7 * n3), topK * .8);
  c = mix(c, vec3(.78, .76, .7), smoothstep(.7, .85, fb(q * .9 + wp.y * .8 + 2.)) * smoothstep(16., 19., wp.y) * .28);
  bumpH = n1 * 1.1 + n2 * .7 + n3 * .45 - crack * 2.2 - bed * .3; bumpK = 2.8;
  diffuseColor.rgb = c;
} else if (vK < .5) {
  diffuseColor.rgb = baseC * (.9 + .2 * vn(wp.xz * 5. + wp.y * 3.));
  if (vK > .05 && vK < .15) {
    float wl = 1. - smoothstep(uTide + .2, uTide + .8, wp.y + vn(wp.xz * 2.) * .3);
    float weed = (1. - smoothstep(3.4, 5., wp.y + vn(wp.xz * 3.1) * 1.2)), barn = (1. - smoothstep(7.2, 8.6, wp.y + vn(wp.zx * 2.3) * 1.));
    vec3 c = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.82, .8, .74) + .04, barn * .6);
    c = mix(c, uWeed * (.5 + .9 * vn(wp.xy * 4. + wp.z)), weed * .85);
    diffuseColor.rgb = c * mix(1., .6, wl); wetK = max(wetK, wl);
  } else if (vK > .46 && vK < .49) {
    // sailcloth: cloths 60 cm wide sewn with doubled seams, reef bands with their points, patches, salt; the sun shows all of it from behind
    float sz = wp.z / .6 + .22 * sin(wp.y * .31), ci = floor(sz + .5), fs = abs(fract(sz + .5) - .5), nearS = 1. / (1. + dot(vViewPosition, vViewPosition) * .0005);
    float seam = 1. - smoothstep(.03, .075, fs), stitch = (1. - smoothstep(0., .016, abs(fs - .058))) * nearS;
    vec3 c = baseC * (.9 + .2 * h21(vec2(ci, 3.1))) * mix(vec3(1.), vec3(1.06, .98, .88), h21(vec2(ci, 9.7)));
    c *= (.9 + .2 * fb(vec2(wp.z * .45, wp.y * .16) + 3.)) * (1. + (vn(vec2(wp.z, wp.y) * 42.) - .5) * .16 * nearS);
    float rbs = (fract(wp.y / 2.7 + .2) - .5) * 2.7, band = 1. - smoothstep(.07, .11, abs(rbs));
    float pts = (1. - smoothstep(.035, .07, abs(fract(sz) - .5))) * smoothstep(-.5, -.42, rbs) * (1. - smoothstep(-.06, 0., rbs)) * nearS;
    vec2 pc = vec2(wp.z / 1.9, wp.y / 1.5 + .37 * floor(wp.z / 1.9)), pf = abs(fract(pc) - .5); float ph = h21(floor(pc) + 17.);
    float ptch = step(.78, ph) * (1. - smoothstep(.26, .28, pf.x)) * (1. - smoothstep(.3, .32, pf.y));
    c = mix(c, c * mix(vec3(1.14, 1.08, .96), vec3(.8, .74, .7), step(.9, ph)), ptch);
    c *= (1. - .2 * seam) * (1. - .34 * stitch) * (1. - .14 * band) * (1. - .5 * pts) * (1. - .3 * ptch * max(smoothstep(.22, .25, pf.x), smoothstep(.26, .29, pf.y)) * nearS);
    clothT = (1. - .55 * seam) * (1. - .4 * band) * (1. - .45 * ptch) * (1. - .6 * pts);
    diffuseColor.rgb = c;
  }
}
// cloud shadows sweeping over everything (the world moves uShade.xy)
diffuseColor.rgb *= 1. - uShade.z * smoothstep(.4, .66, fb(vSh * uShade.w + uShade.xy));
`;
const SOLID_FRAG_EMIT = /* glsl */`
{ float ndv = clamp(dot(normal, normalize(vViewPosition)), 0., 1.); float fr = pow(1. - ndv, 4.);
  if (vK > 4.5 && vK < 5.5) totalEmissiveRadiance += baseC * uGlow;
  if (vK > 9.5) { vec3 pl = uPortal.xyz - vWp; float pd = length(pl);      // the portal's light on the rock that frames it
    totalEmissiveRadiance += diffuseColor.rgb * uPortalCol * ((.25 + .75 * max(dot(normalize(vWn + vec3(0., 1e-5, 0.)), pl / max(pd, 1e-3)), 0.)) * min(7. / (1. + pd * pd * .035), 1.5)); }
  if (vK > .46 && vK < .49) totalEmissiveRadiance += diffuseColor.rgb * uSunCol * (.78 * clothT * max(dot(-normal, normalize((viewMatrix * vec4(uSunDir, 0.)).xyz + vec3(0., 1e-5, 0.))), 0.));      // sailcloth lets the sun through
  totalEmissiveRadiance += vec3(1., .56, .22) * (uWin * winK);
  totalEmissiveRadiance += mix(uSkyZ, uSkyH, clamp(fr * 1.5 + .3, 0., 1.)) * (sandWet * (.06 + .6 * fr) * uSheen) + uSkyH * (glassK * (.1 + .6 * fr)) + diffuseColor.rgb * uSkyH * uFill;
  totalEmissiveRadiance += mix(uSkyH, uSkyZ, .88) * (filmK * (.35 + .3 * fr) * (.9 + .2 * vn(vWp.xz * 1.9 + uTime * vec2(.7, .45)))) + (uSkyH * .62 + uSunCol * .2 + .2) * frontK;
  totalEmissiveRadiance += mix(uSkyZ, uSkyH, clamp(fr * 1.4 + .1, 0., 1.)) * (poolK * (.44 + .5 * fr) * uSheen);      // pools lie between the sand bars as pieces of the sky
  totalEmissiveRadiance += diffuseColor.rgb * vec3(1., .62, .3) * (lampK * uPool);
  totalEmissiveRadiance += mix(uSkyZ, uSkyH, clamp(fr * 1.4 + .15, 0., 1.)) * (rockWet * (.035 + .42 * fr)); }      // wet stone at the water's edge shines with the sky
`;
// one factory: MeshStandard + the procedural surface kinds above + an optional vertex animation
function makeMat(U, vert = {}, extra = {}, key = 'solid') {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, ...extra });
  // three keys a program by the source text of onBeforeCompile, which is the same for every variant made here: without a key of
  // its own the instanced oyster tables would be drawn with the boats' program (and float up with the tide)
  m.customProgramCacheKey = () => 'tmt-' + key;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `attribute float aK; varying float vK; varying vec3 vWp, vWn; varying vec2 vSh; uniform float uTide, uTime, uOpen;\n${vert.head || ''}\n#include <common>`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${vert.normal || ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvK = aK; vWp = transformed; vWn = objectNormal;\n${vert.pos || ''}\nvSh = transformed.xz;\n#ifdef USE_INSTANCING\nvSh = (instanceMatrix * vec4(transformed, 1.)).xz;\n#endif`)
      .replace('#include <color_vertex>', `#include <color_vertex>\n${vert.color || ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `${SOLID_FRAG_HEAD}\n${vert.fragHead || ''}\n#include <common>`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>\n${vert.frag || ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${SOLID_FRAG_COLOR}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .24, wetK); roughnessFactor = mix(roughnessFactor, .16, poolK);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\nif (vK > 7.5 && vK < 8.5) { float vd2 = dot(vViewPosition, vViewPosition), cs = cos(sandArg) * .22 / (1. + vd2 * .00012);
        float gust = smoothstep(.3, .7, vn(vWp.xz * .13 + uTime * vec2(.5, .3))) / (1. + vd2 * .0015);      // cat's-paws of wind crossing the standing water (near the eye only: far off the ripples are below a pixel)
        normal = normalize(normal + (viewMatrix * vec4(cs * .86, 0., cs * .5, 0.)).xyz * (1. - .85 * poolK)
        + (viewMatrix * vec4(sin(dot(vWp.xz, vec2(2.1, 1.3)) + uTime * 2.3) + .6 * sin(dot(vWp.xz, vec2(4.3, -2.9)) + uTime * 3.4), 0., sin(dot(vWp.xz, vec2(-1.2, 2.4)) - uTime * 1.9) + .6 * sin(dot(vWp.xz, vec2(2.2, 4.6)) - uTime * 3.1), 0.)).xyz * (poolK * (.03 + .075 * gust))); }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n{ vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition); float hx = dFdx(bumpH), hy = dFdy(bumpH);
        vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1) * faceDirection, bk = bumpK * .05 / (1. + dot(vViewPosition, vViewPosition) * .0012);
        normal = normalize(abs(det) * normal - sign(det) * bk * (hx * r1 + hy * r2) + normal * 1e-7); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${SOLID_FRAG_EMIT}`)
      // a low sun straight ahead on wet sand: keep the glitter, cap the texels that would otherwise run to thousands (and bloom into a veil over the pots)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular = min(reflectedLight.directSpecular, vec3(vK > 7.5 && vK < 8.5 ? .3 + 1.7 * poolK : 3.));');
  };
  return m;
}
const BOAT_VERT = {
  head: /* glsl */`attribute vec4 aB; attribute vec3 aHue; uniform vec2 uFront;
vec3 boatRoll(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z); }
// the tide where this boat lies: nothing until the front of the first flood has passed it
float boatTide(){
#ifdef USE_INSTANCING
  vec2 bp = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
#else
  vec2 bp = vec2(0.);
#endif
  return uTide - 4. * (1. - smoothstep(-1., 4., bp.y + uFront.y * bp.x + 1.5 * sin(bp.x * .11 + 1.7) - uFront.x)); }
float boatF(){ float d = aB.w * .55; return smoothstep(aB.x + d * .45, aB.x + d * 1.35, boatTide()); }
float boatAng(){ float f = boatF(); return aB.y * (1. - f) - aB.y * sin(f * 3.1416) * .35 + f * .05 * sin(uTime * 1.3 + aB.z); }
// afloat, a hull swings to its mooring: it turns (at most half a radian) to lie head to the flood that comes in through the gap,
// then sheers slowly about that heading. Hulls that stand upright on legs (the tunny boat among them) keep their heading.
vec3 boatYaw(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
float boatSwing(){
#ifdef USE_INSTANCING
  vec2 hd = vec2(instanceMatrix[2].x, instanceMatrix[2].z), to = vec2(8., 151.) - vec2(instanceMatrix[3].x, instanceMatrix[3].z);
  float d = atan(to.x * hd.y - to.y * hd.x, dot(to, hd) + 1e-4);
#else
  float d = 0.;
#endif
  float f = boatF();
  return smoothstep(.1, .22, abs(aB.y)) * f * (clamp(d, -.55, .55) + .07 * sin(uTime * .35 + aB.z * 2.3)); }`,
  normal: 'objectNormal = boatYaw(boatRoll(objectNormal, boatAng()), boatSwing());',
  pos: 'transformed = boatYaw(boatRoll(transformed, boatAng()), boatSwing()); transformed.y += (max(boatTide() - aB.w * .55 - aB.x, 0.) + boatF() * .07 * sin(uTime * .9 + aB.z * 1.7)) / aB.w;',
  color: 'vColor.rgb = mix(vColor.rgb, vColor.rgb * aHue, step(.2, aK) * step(aK, .45));',
};
const CLOTH_VERT = {
  head: /* glsl */`attribute vec3 aPiv; attribute vec4 aAn;
vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
float shutA(){ float o = smoothstep(aAn.y, aAn.y + .2, uOpen); return aAn.z * (o * 2.85 + sin(o * 3.1416) * .3); }`,
  normal: 'if (aAn.x > .5 && aAn.x < 1.5) objectNormal = rotY(objectNormal, shutA());',
  pos: /* glsl */`if (aAn.x > .5 && aAn.x < 1.5) { transformed = aPiv + rotY(transformed - aPiv, shutA()); }
else if (aAn.x > 1.5 && aAn.x < 2.5) { float o = smoothstep(aAn.y, aAn.y + .1, uOpen); float s = o + sin(o * 3.1416) * .32;
  vec3 d = transformed - aPiv; transformed = aPiv + d * mix(.04, 1., s);
  transformed.y += aAn.z * sin(uTime * 2.7 + aAn.w + d.x * 1.3) * .08 * s; }
else if (aAn.x > 2.5 && aAn.x < 3.5) { vec3 d = transformed - aPiv; float w = aAn.z * (.3 + length(d));
  transformed.x += w * sin(uTime * 1.9 + aAn.w + d.y * 2.) * .1; transformed.z += w * cos(uTime * 2.3 + aAn.w * 1.7 + d.x * 3.) * .13; }
else if (aAn.x > 3.5) {      // wrack on the quay face: it hangs until the water reaches its holdfast, then swings out and floats, waving
  vec3 d = transformed - aPiv; float sub = smoothstep(-.3, .45, uTide - aPiv.y);
  float a = sub * (1.3 + .26 * sin(uTime * 1.6 + aAn.w + aPiv.x * .7)) + (1. - sub) * .09 * sin(uTime * 1.3 + aAn.w);
  float ca = cos(a), sa = sin(a);
  transformed = aPiv + vec3(d.x + (.04 + .14 * sub) * sin(uTime * 2.1 + aAn.w * 1.7 - d.y * 3.) * aAn.z, d.y * ca + d.z * sa, d.z * ca - d.y * sa); }`,
};

// the boats' mirror image under the tide surface: the same hull, flipped about the water, wobbling, fading with height
const MIRROR_VERT = {
  head: BOAT_VERT.head + '\nvarying float vMy, vBf;',
  normal: 'objectNormal = -boatYaw(boatRoll(objectNormal, boatAng()), boatSwing());',       // the material draws back faces (the flip turns the winding); this keeps the light on the same side
  pos: BOAT_VERT.pos + /* glsl */`
{ vMy = aB.x + transformed.y * aB.w - uTide; vBf = boatF();
  transformed.y = 2. * (uTide - aB.x) / aB.w - transformed.y;
  float wob = sin(vMy * 2.6 + uTime * 2.1 + aB.z) * .07 * clamp(vMy, 0., 3.) + sin(vMy * 7.3 - uTime * 3.4 + aB.z * 2.) * .025 * clamp(vMy, 0., 2.);
  transformed.x += wob / aB.w; transformed.z += wob * .7 / aB.w; }`,
  color: BOAT_VERT.color,
  fragHead: 'uniform vec3 uSea; varying float vMy, vBf;',
  frag: /* glsl */`{ float ma = .62 * vBf * smoothstep(5.2, .4, vMy) * smoothstep(0., .12, vMy); if (vMy < 0. || ma < .012) discard;
  gl_FragColor = vec4(mix(gl_FragColor.rgb * .66, uSea * (uSkyH * .5 + .12), .3), ma); }`,
};
// shadow casters whose shape is made in the vertex shader need a depth material that makes the same shape
function makeDepthMat(U, vert, key) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.customProgramCacheKey = () => 'tmt-depth-' + key;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTide = U.uTide; sh.uniforms.uTime = U.uTime; sh.uniforms.uOpen = U.uOpen; sh.uniforms.uFront = U.uFront;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `uniform float uTide, uTime, uOpen;\n${vert.head}\n#include <common>`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${vert.pos}`);
  };
  return m;
}

function makeWaterMat(U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec2 vL;
      #include <fog_pars_vertex>
      void main(){ vL = position.xz; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uHt; uniform vec4 uHtBox, uLH; uniform float uTide, uTime, uGlow, uWin, uPool; uniform float uLampX[8];
      uniform vec3 uSkyH, uSkyZ, uSea, uSand, uSunDir, uSunCol, uQuayCol, uHouseCol, uRoofCol, uRedLit, uOchre, uBeamCol, uPortalCol; uniform vec4 uPortal, uHeads, uReefBox, uWake[2]; uniform vec2 uPortalN, uPiles[4]; uniform float uGlit, uWarm;
      varying vec3 vW; varying vec2 vL;
      #include <fog_pars_fragment>
      ${NOISE}
      ${FRONT}
      // foam as lace: the thin closed lines where a drifting noise crosses its middle value, in two sizes
      float lace(vec2 p, float t){      // foam lace: lines drawn along a warped field and broken into arcs (never closed rings of one width)
        vec2 w = p + (vec2(vn(p * .6 + 3.1), vn(p * .6 + 11.7)) - .5) * 1.2;
        float a = abs(vn(w + vec2(t * .11, -t * .07)) - .5), b = abs(vn(w * 2.7 + 9. - vec2(t * .09, t * .13)) - .5);
        float k1 = smoothstep(.3, .62, vn(p * 1.7 + vec2(-t * .05, t * .04) + 21.)), k2 = smoothstep(.28, .6, vn(p * 3.9 + 5. + vec2(t * .07, t * .03)));
        return clamp((1. - smoothstep(0., .085, a)) * .75 * (.22 + .78 * k1) + (1. - smoothstep(0., .1, b)) * .45 * (.2 + .8 * k2), 0., 1.);
      }
      void main(){
        vec2 uvh = (vL - uHtBox.xy) * uHtBox.zw;
        float inside = step(0., uvh.x) * step(uvh.x, 1.) * step(0., uvh.y) * step(uvh.y, 1.);
        float hs = texture2D(uHt, clamp(uvh, 0., 1.)).r;
        vec2 p = vL; float t = uTime;
        // the edge of the first sheet fingers along the sand ripples instead of following the height map's texels
        // (the height map is taken from the sand mesh itself and the fingering only ever raises it: the sheet thins to nothing
        // before it meets the triangles, so their straight edges never show)
        float hf = hs + .02;
        if (uTide - hs < .7) {
          float sandArg = (p.x * .86 + p.y * .5) * 3.6 + fb(p * .4 + 3.) * 9. + fb(p * .06) * 30.;
          hf += fb(p * .13) * .07 + vn(p * .9 + 3.) * .04 + (.5 + .5 * sin(sandArg)) * .024;
        }
        float depth = mix(3., uTide - hf, inside);
        float fq = frontQ(p), run = step(-9000., uFront.x);          // fq = metres behind the front of the first flood
        depth = max(depth, .12 * smoothstep(.3, 2.5, fq) * run * inside);      // behind the front the sheet is whole: ripple crests and hummocks do not break it into lobes
        vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.));
        float dist = length(cameraPosition - vW);
        float calm = 1. / (1. + dist * .02);
        float sh = smoothstep(0., .6, depth);
        vec2 g = vec2(0.), pr = vec2(p.x * .8 + p.y * .6, p.y * .8 - p.x * .6);      // (the noise lattice turned off the axes the boat runs along)
        g += vec2(.8, .6) * cos(dot(p, vec2(.8, .6)) * 1.7 + t * 1.5) * .035;
        g += vec2(-.5, .86) * cos(dot(p, vec2(-.5, .86)) * 2.9 - t * 1.9) * .028;
        g += vec2(.2, -.98) * cos(dot(p, vec2(.2, -.98)) * .7 + t * .8) * .03;
        g += vec2(.96, -.28) * cos(dot(p, vec2(.96, -.28)) * 6.3 + t * 3.1 + vn(p * .7) * 4.) * .017;
        g += vec2(-.34, -.94) * cos(dot(p, vec2(-.34, -.94)) * 9.1 - t * 3.7 + vn(p * .9 + 5.) * 4.) * .013;
        float calmR = mix(.6, 1., smoothstep(10.6, 12., uTide)), openK = smoothstep(128., 172., p.y);      // calmer while the flood runs (the streaks own the surface); outside, the swell does the work, not blotches
        g += (vec2(vn(pr * vec2(1.3, 2.6) + t * vec2(.3, .2)), vn(pr * vec2(2.4, 1.2) + 17. - t * vec2(.2, .35))) - .5) * (.034 * calmR * (1. - .7 * openK));
        g *= (.25 + .75 * sh) * calm * calm * (1. + 2. * calm);
        // the swell of the open sea runs in through the gap between the pier heads and dies in the basin
        float open = smoothstep(128., 172., p.y), gapK = (.16 * smoothstep(14., 60., p.y) + .84 * smoothstep(52., 150., p.y) + .5 * open) * sh;
        float swPh = p.y * .21 + p.x * .025 + t * 1.25 + vn(p * .05) * 1.4, swPh2 = dot(p, vec2(.19, .16)) - t * 1.05 + vn(p * .04 + 9.) * 2.;
        g += (vec2(.12, 1.) * (cos(swPh) * (.085 + .085 * open) + cos(p.y * .47 - p.x * .06 + t * 1.9) * .034) + vec2(.76, .64) * cos(swPh2) * .05 * (.35 + .65 * open)) * gapK;
        // the breeze: ruffled water lies in dark patches between slicks, and carries the chop further than the eye's own ripples
        float ruff = smoothstep(.34, .7, fb(vec2(p.x * .017 + p.y * .009, p.y * .041 - p.x * .012) + t * vec2(.014, .022))) * sh;
        g += (vec2(vn(pr * vec2(.55, .9) + t * vec2(.5, .3)), vn(pr * vec2(.9, .5) + 31. - t * vec2(.3, .45))) - .5) * ((.05 + .07 * ruff) * calmR * (1. - .6 * openK)) * sh / (1. + dist * .012);
        vec3 N = normalize(vec3(-g.x, 1., -g.y));
        float F = min(.03 + .97 * pow(clamp(1. - dot(N, V), 0., 1.), 5.), .84);
        vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-4;
        float thin = 1. - smoothstep(0., 1.1, depth);
        vec3 refl = mix(uSkyH, uSkyZ, max(max(smoothstep(0., .7, R.y), .95 * thin), .6 * sh));      // the first sheet mirrors the cooler sky overhead, not the horizon the wet sand shows; deep water never the horizon's haze alone
        refl = mix(refl, mix(uSkyH, uSkyZ, smoothstep(0., .7, R.y) * .85), uWarm * (1. - .35 * thin));      // at first light the flood is a mirror of the gold low in the sky; it cools as the morning comes on
        refl = mix(refl, refl * vec3(.5, .63, .82) + uSkyZ * .12, ruff * .6 * (1. - thin) * (1. - .6 * uWarm));
        // the mirror: the quay face with its bands, the house fronts and their lit windows, the lamps (the reflected ray meets z = 0)
        if (R.z < -.02 && vL.y > 0.) {
          float tq = vL.y / -R.z, yq = uTide + tq * R.y, xq = vL.x + tq * R.x;
          float onq = step(abs(xq), 104.) * smoothstep(260., 120., tq);
          float cellx = floor(xq / 8.6), hh = 20. + 3.4 * h21(vec2(cellx, 2.));
          float sq = step(25.5, abs(xq));                                            // the square is open: no fronts there
          vec3 wallc = uQuayCol * (.8 + .4 * h21(vec2(floor(xq / 1.02), floor(yq / .46))));
          wallc = mix(wallc, uQuayCol * uOchre * 2.6, (1. - smoothstep(8.9, 10.1, yq)) * .6);
          wallc = mix(wallc, uQuayCol * vec3(.62, .6, .52) * 1.5, (1. - smoothstep(7.2, 8.9, yq)) * .5);
          wallc = mix(wallc, uQuayCol * .22, (smoothstep(9.1, 10.1, yq) - smoothstep(11., 12., yq)) * .85);
          vec3 front = mix(uHouseCol * (.8 + .25 * h21(vec2(cellx, 5.))), uRoofCol, smoothstep(hh - .4, hh + .2, yq));
          vec2 wc = vec2(xq / 2.8, (yq - 14.) / 2.8);
          float win = step(.25, fract(wc.x)) * step(fract(wc.x), .6) * step(.3, fract(wc.y)) * step(fract(wc.y), .82) * step(yq, hh - .6) * step(15., yq);
          front = mix(front, uHouseCol * .12, win * .8) + vec3(1., .56, .22) * (uWin * win * step(.55, h21(floor(wc) + 3.)) * .8);
          vec3 qc = mix(wallc, front, step(14., yq));
          float mq = onq * (1. - smoothstep(hh + 2.6, hh + 3.2, yq)) * mix(1., sq, step(14., yq));
          refl = mix(refl, qc, mq * .92);
          float lg = 0.; for (int i = 0; i < 8; i++) { float dx = xq - uLampX[i]; lg += exp(-(dx * dx * .7 + (yq - 18.2) * (yq - 18.2) * .1)); }
          refl += vec3(1., .72, .38) * (lg * uPool * onq * .9);
        }
        // the lighthouse: its bands and its lamp stand on the water
        { vec2 dl = uLH.xy - vL; float tl = dot(dl, R.xz) / (dot(R.xz, R.xz) + 1e-5);
          if (tl > 0.) { float dmin = length(dl - R.xz * tl), yl = uTide + tl * R.y;
            float m = smoothstep(2.9, 1.9, dmin) * step(14., yl) * step(yl, 29.4) * smoothstep(420., 200., tl);
            float band = abs(mod(floor(max(yl - 15., 0.) / uLH.z), 2.) - uLH.w);
            refl = mix(refl, mix(uRedLit, uHouseCol, band), m * .9);
            refl += uBeamCol * (uGlow * .11 * exp(-(dmin * dmin * .12 + (yl - 31.3) * (yl - 31.3) * .04)) * smoothstep(420., 200., tl)); } }
        float sd = max(dot(R, uSunDir), 0.);
        // sun glitter: sparks the size of a wavelet with dark water between them, never a sheet of white
        float fl = vn(pr * vec2(3.9, 2.3) + t * vec2(1.3, -.9)) * vn(pr * vec2(1.7, 3.5) - t * vec2(.8, 1.2) + 5.);
        float fl2 = vn(p * 9.7 + t * vec2(2.3, -1.9)) * vn(p * 6.3 - t * vec2(1.1, 1.7) + 3.);
        float spark = smoothstep(.27, .5, fl) * 1.5 + smoothstep(.3, .52, fl2) * 1.6;
        spark *= mix(1., .3 + 1.2 * smoothstep(.38, .72, vn(vec2(p.x * 2.1 + t * 1.4, p.y * 6.3 - t * 2.2)) * .6 + vn(p * vec2(4.7, 11.) + t * vec2(-1.7, 2.6)) * .4), openK);      // outside, glints along the wavelets
        // the portal in the gap stands on the water: a glowing road to it
        float pglow = 0.;
        float rdn = dot(R.xz, uPortalN);
        if (rdn > .02) {
          float tp = max(dot(uPortal.xz - vL, uPortalN), 0.) / rdn; float dd = length(vec3(vL.x, uTide, vL.y) + R * tp - uPortal.xyz) / max(uPortal.w, .1);
          pglow = (smoothstep(1.05, .8, dd) * .6 + .34 * exp(-max(dd - 1., 0.) * 2.2)) * smoothstep(260., 50., tp) * (.3 + .62 * min(spark, 1.2));      // its light lies on the water as the sun's does: on the wavelets, dark water between
          refl += uPortalCol * (pglow * .8);
        }
        vec3 glint = uSunCol * (min(pow(sd, 420.) * 3., 1.) * (.05 + .56 * spark) + pow(sd, 36.) * .09) * (1. - .66 * thin);
        { vec3 Hs = normalize(V + uSunDir + vec3(0., 1e-4, 0.)); float nh = clamp(dot(N, Hs), .05, 1.), t2 = (1. - nh * nh) / (nh * nh), s2 = .0075 + .011 * ruff + .006 * gapK;
          float road = exp(-t2 / s2) * (.3 + .7 * pow(1. - clamp(dot(V, Hs), 0., 1.), 3.)) * smoothstep(-.02, .1, uSunDir.y);
          glint += uSunCol * vec3(1., .85, .6) * (min(road * spark, 1.25) * uGlit * (1. - .8 * thin) * smoothstep(.2, 1.2, depth)); }
        // looking down into it beside the boat the first decimetres are clear and the sand shows through; far off the same sheet is a mirror
        float nearK = smoothstep(.14, .46, V.y), shal = smoothstep(0., .06, depth) * smoothstep(1.9, .15, depth);
        vec3 body = mix(mix(uSand, uSea * 1.15, .6) * (.2 + .5 * uSkyH), uSea * .34 + uSkyZ * .05, smoothstep(0., 1.7, depth));      // shallow water over sand is jade, not tea
        float lcN = lace(p * 1.15, t), lcF = mix(lcN, .34, smoothstep(34., 100., dist));
        body += uSunCol * (lace(p * .8 + 13., t * 1.6) * .16 * shal * nearK * smoothstep(-.02, .12, uSunDir.y));      // the net of light the ripples throw on the sand
        float Fm = max(F, .74 * thin * (1. - .78 * nearK));                // the first thin sheet over the sand is a mirror, where the eye meets it at a low angle
        vec3 col = min(mix(body, refl, Fm) + uPortalCol * (pglow * .25), vec3(.92));
        vec3 foamC = min(uSkyH * .34 + uSkyZ * .2 + uSunCol * .2 + .2, vec3(.86));      // foam is white in any light: the sky's tint in it, never the colour of sand
        float edge = smoothstep(.075, .028, depth) * (.6 + .4 * vn(p * 2.3 + t * .7));
        col += foamC * edge * .8;
        // the first flood: a bright ragged line of foam at its leading edge (bright enough to bloom), a second line of lace behind it
        col += (foamC + .14) * run * (smoothstep(-.4, .5, fq) * smoothstep(3.2, 1., fq) * (.45 + .55 * vn(p * 2.3 + t * .7)) * 1.8
          + smoothstep(5.5, 7., fq) * smoothstep(11.5, 8.5, fq) * smoothstep(.34, .62, vn(p * 1.6 - t * .5)) * .7);
        // ---- foam: every source adds to one density, and the density is drawn as lace (solid white only where it is thickest)
        float fo = 0.;
        // the pier heads: the swell breaks round their feet, heaviest on the seaward side, and the flood streams in through the gap
        { vec2 dE = p - uHeads.xy, dW = p - uHeads.zw; float rE = length(dE), rW = length(dW), deep = smoothstep(.2, 1.2, depth);
          float sw = .5 + .5 * sin(t * 1.25 + p.y * .21 + vn(p * .08) * 3.);
          float nE = vn(p * .9 + t * vec2(.3, .8)), sea = smoothstep(-.5, .7, dE.y / max(rE, 1e-3)), seaW = smoothstep(-.5, .7, dW.y / max(rW, 1e-3));
          float wE = (1.3 + 2.8 * sw) * (.6 + .4 * sea) + 1.5 * nE, wW = (1.3 + 2.8 * sw) * (.6 + .4 * seaW) + 1.5 * nE;      // metres of white water out from each foot, surging on the swell
          float surf = max(smoothstep(4.7 + wE, 4.7 + wE * .35, rE), smoothstep(4.7 + wW, 4.7 + wW * .35, rW));
          float wash = max(smoothstep(4.7 + wE * 3.2, 4.7 + wE, rE), smoothstep(4.7 + wW * 3.2, 4.7 + wW, rW));
          float tail = max(exp(-abs(dE.x + 3.) * .3) * smoothstep(7., -2., dE.y) * smoothstep(-46., -3., dE.y), exp(-abs(dW.x - 3.) * .3) * smoothstep(7., -2., dW.y) * smoothstep(-46., -3., dW.y));      // lace carried in past each head
          float gx = (p.x - (uHeads.x + uHeads.z) * .5) / (11. + max(150. - p.y, 0.) * .16);
          float fair = exp(-gx * gx) * smoothstep(40., 118., p.y) * smoothstep(205., 160., p.y);
          float rip = smoothstep(.6, .82, vn(vec2(p.x * 1.1, p.y * .07 + t * .5)) * .6 + vn(vec2(p.x * 2.9 + 4., p.y * .22 + t * 1.)) * .4);      // long thin lines of lace drawn out by the stream
          fo += deep * (surf * 1.05 + wash * .4 + tail * .36 + fair * rip * .46); }
        float inRk = 0.;
        { float rising = 1. - smoothstep(10.6, 12., uTide), deep2 = smoothstep(.3, 1.2, depth), nearQ = smoothstep(46., 6., vL.y);
          // while the flood runs, lines of foam and rafts of torn wrack stream along the quay with it
          float drift = smoothstep(.62, .8, vn(vec2(p.x * .1 + t * .55, (p.y + .7 * vn(vec2(p.x * .12 + t * .2, 3.))) * 1.3)) * .62 + vn(vec2(p.x * .5 + t * .8, p.y * 2.1)) * .38);      // slicks of foam lying along the wall
          float eddy = smoothstep(.6, .82, vn(vec2(p.x * .11 + t * .22, p.y * .34 + 2.)) * .7 + vn(p * .9 + t * vec2(.5, -.1)) * .3);
          fo += (drift * .42 + eddy * .26) * nearQ * rising * deep2;
          float wrack = smoothstep(.63, .77, vn(vec2(p.x * .2 + t * .4, p.y * .8 + 7.)) * .62 + vn(p * 1.9 + t * vec2(.7, .05) + 3.) * .38);
          col = mix(col, vec3(.07, .075, .02) + uSkyH * .05, wrack * .7 * smoothstep(34., 4., vL.y) * rising * deep2);
          float wake = 0.;                                         // each mooring pile parts the stream: a tail of lace down-flood of it
          for (int i = 0; i < 4; i++) { vec2 dp = p - uPiles[i]; float al = -dp.x; wake += exp(-abs(dp.y) * 1.5 / (1. + max(al, 0.) * .22)) * smoothstep(-.3, .5, al) * smoothstep(9., 1., al); }
          fo += clamp(wake, 0., 1.) * .75 * rising * deep2;
          // white horses on the crests of the swell outside (short, broken), and the sea breaking on the reef: a tight white band at
          // the foot of the rock that surges with the swell, a skirt of lace drifting off it
          float cap = smoothstep(.9, 1., sin(swPh)) * smoothstep(.56, .8, vn(vec2(p.x * .3, p.y * .8) + t * .35) * .7 + vn(p * 2.3 - t) * .3) * (.25 * smoothstep(100., 150., p.y) + .75 * open);
          vec2 rb = (p - uReefBox.xy) * uReefBox.zw; float inR = step(0., rb.x) * step(rb.x, 1.) * step(0., rb.y) * step(rb.y, 1.) * inside;
          float dr = uTide - hs, sw2 = .5 + .5 * sin(t * 1.25 + p.y * .21 + vn(p * .08) * 3.);
          float reef = inR * (smoothstep(1.3 + 2.3 * sw2, .15, dr) * 1.05 + smoothstep(4.4 + 3.6 * sw2, 1.2, dr) * .5 * smoothstep(.3, .62, vn(p * .21 + vec2(t * .06, -t * .04)))) * smoothstep(9., 11.5, uTide);
          { vec2 fe = 5. * uReefBox.zw; inRk = smoothstep(0., fe.x, rb.x) * smoothstep(1., 1. - fe.x, rb.x) * smoothstep(0., fe.y, rb.y) * smoothstep(1., 1. - fe.y, rb.y) * inside; }      // (the skirt drifts off in patches)
          fo += (cap * .5 + reef) * smoothstep(0., .25, depth); }
        // the water lapping against the quay face: a pale line that climbs the wall with the tide
        float wz = 1.5 * (1. - (uTide + 2.5) / 16.5);
        float lap = smoothstep(wz + .9 + .7 * vn(vec2(p.x * .5, t * .45)), wz + .1, vL.y) * step(abs(vL.x), 100.5) * smoothstep(0., .5, depth);
        fo += lap * (.45 + .5 * vn(vec2(p.x * 2.6, p.y * 3. - t * 1.1)));
        // the wakes of the vessels under sail (uWake: x, z, heading): churned water astern, the two arms of the bow wave
        for (int i = 0; i < 2; i++) { vec2 dw = p - uWake[i].xy; float al = -dot(dw, uWake[i].zw), sx = abs(dw.x * uWake[i].w - dw.y * uWake[i].z);
          fo += (exp(-sx / (1.1 + max(al, 0.) * .14)) * smoothstep(-8., 3., al) * smoothstep(64., 8., al) * .8
            + exp(-abs(sx - (1.8 + max(al + 8., 0.) * .34)) * 1.2) * smoothstep(-9., -5., al) * smoothstep(34., -2., al) * .62) * smoothstep(.3, 1.2, depth); }
        float foamA = clamp(fo * (lcF * 1.3 + .16) + smoothstep(.86, 1.4, fo) * .72 * (.72 + .28 * vn(p * 5.3 + t * vec2(.9, -.6))), 0., 1.);
        col = mix(col, foamC * (.9 + .12 * lcF), foamA * .94);
        col += glint * (1. - foamA);
        float nearA = nearK * (1. - inRk);      // (round the reef the bed is rock and weed, not sand: the water there keeps its own colour)
        float a = smoothstep(0., .035, depth) * max(mix(.5 - .3 * nearA, .97, smoothstep(0., 1.6 + 1.1 * nearA, depth)), Fm + .08)
          * max(smoothstep(0., 1.7, fq), smoothstep(.42, .62, depth) * .92);      // ahead of the front only the thread in the drainage channel and the deepest hollows hold water
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
}
function makeBeamMat(U) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: U,
    // a fin seen edge-on would be a hard bright line: each fin fades as it turns edge-on to the eye (the other one then faces it)
    vertexShader: 'attribute vec2 aA; attribute vec3 aN; varying vec2 vA; varying float vF; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.); vF = abs(dot(normalize(normalMatrix * aN), normalize(mv.xyz + vec3(0., 0., -1e-4)))); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uBeamCol; uniform float uBeamI; varying vec2 vA; varying float vF; void main(){ float e = 1. - abs(vA.y), p = e * e * (3. - 2. * e); gl_FragColor = vec4(uBeamCol * (uBeamI * vA.x * (.25 + .75 * vA.x) * p * .42 * smoothstep(.4, .9, vF)), 1.); }',
  });
}

// ---- the hero ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  await ctx.yield();
  const lr = (() => { let a = ((Number(ctx.seed) || 1) * 2654435761 + 0x9e3779b9) >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const qr = (() => { let a = ((Number(ctx.seed) || 1) * 40503 + 0x51f15e7) >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const pal = (opts.palette && opts.palette.length >= 10 ? opts.palette : PAL).map(C);
  if (opts.sand) pal[5] = C(opts.sand);
  const [GRAN, BLACK, OCHRE, WEED, BLUE, SAND, RED, WHITE, SLATE, SEA] = pal;
  const hour = opts.hour ?? 8, wetAll = Math.min(1, Math.max(0, opts.wet ?? 0)), season = opts.season || 'summer';
  const look = opts.look ?? (rng.chance(0.64) ? 0 : rng.int(1, 2));
  const lampDay = (hour < 7 || hour > 19) ? 1 : 0.35;
  const vcol = (c, j = 0.08, k = 1) => { const f = k * (1 + (rng() - 0.5) * 2 * j); return new THREE.Color(c.r * f, c.g * f, c.b * f); };
  const mixc = (a, b, t) => a.clone().lerp(b, t);

  const U = {
    uTide: { value: TIDE_LOW }, uTime: { value: 0 }, uOpen: { value: 0 }, uWetAll: { value: wetAll }, uFill: { value: opts.fill ?? 0.1 }, uGlow: { value: 1.6 + 5 * lampDay },
    uBlack: { value: BLACK }, uOchre: { value: OCHRE }, uWeed: { value: WEED }, uSea: { value: SEA }, uSand: { value: SAND },
    uSkyH: { value: C('#cfe0ea') }, uSkyZ: { value: C('#4f86c6') }, uSunDir: { value: new THREE.Vector3(-0.6, 0.7, 0.4).normalize() }, uSunCol: { value: C('#fff1d6') },
    uShade: { value: new THREE.Vector4(0, 0, 0, 0.006) }, uWin: { value: 0 }, uPool: { value: 0 }, uFilm: { value: 0 }, uSheen: { value: opts.sheen ?? 1 }, uBand: { value: opts.band ?? 0.5 }, uHeads: { value: new THREE.Vector4(28.5, 152.5, -12.5, 149.5) }, uReefBox: { value: new THREE.Vector4(18, 154, 1 / 104, 1 / 72) }, uPortalN: { value: new THREE.Vector2(0, 1) }, uGlit: { value: opts.glitter ?? 1 },
    uPiles: { value: Array.from({ length: 4 }, (_, i) => { const q = (opts.posts || []).filter((r) => !r[2])[i]; return new THREE.Vector2(q ? q[0] : 1e5, q ? q[1] : 1e5); }) },
    uWake: { value: [new THREE.Vector4(1e5, 1e5, 0, 1), new THREE.Vector4(1e5, 1e5, 0, 1)] }, uWarm: { value: 0 }, uLensI: { value: 1.6 + 0.55 * (1.6 + 5 * lampDay) },
    uLampX: { value: Array.from({ length: 8 }, (_, i) => (opts.lampXs && opts.lampXs[i] !== undefined ? opts.lampXs[i] : 1e5)) },
    uLH: { value: new THREE.Vector4(28.5, 152.5, 3, 0) }, uQuayCol: { value: C('#5a554e') }, uHouseCol: { value: C('#b9b4a8') }, uRoofCol: { value: C('#2a3140') }, uRedLit: { value: C('#8a2a22') },
    uHt: { value: null }, uHtBox: { value: new THREE.Vector4() }, uPortal: { value: new THREE.Vector4(0, 0, 1e5, 1) }, uPoolAt: { value: new THREE.Vector4(1e5, 1e5, 1, 1) }, uFront: { value: new THREE.Vector2(-1e4, 0) }, uPortalCol: { value: new THREE.Color(0, 0, 0) }, uBeamCol: { value: C('#ffe9b0') }, uBeamI: { value: 2.6 * lampDay - 0.55 },
  };
  const group = new THREE.Group(); group.name = 'twelve-metre-tide-hero';
  const solidMat = makeMat(U), boatMat = makeMat(U, BOAT_VERT, {}, 'boat'), clothMat = makeMat(U, CLOTH_VERT, { side: THREE.DoubleSide }, 'cloth');
  const shadows = !!opts.shadows, boatDepth = makeDepthMat(U, BOAT_VERT, 'boat'), clothDepth = makeDepthMat(U, CLOTH_VERT, 'cloth');
  await ctx.yield();
  if (opts.portal) U.uPortal.value.set(opts.portal[0], opts.portal[1], opts.portal[2], opts.portal[3]);
  if (opts.portalDir) U.uPortalN.value.set(opts.portalDir[0], opts.portalDir[1]).normalize();
  const portalCol = C(opts.portal ? opts.portal[4] : '#000000');
  if (opts.pool) U.uPoolAt.value.set(opts.pool[0], opts.pool[1], opts.pool[2], opts.pool[3]);

  // ---- ground shapes --------------------------------------------------------------------------------------------------
  const chPh = rng.range(0, 6.28), chAmp = rng.range(14, 26), nOff = rng.range(0, 500);
  const chanX = (z) => 8 + chAmp * Math.sin((150 - z) * 0.03 + chPh) * sstep(146, 70, z) * sstep(4, 40, z);
  const sandHeight = (x, z) => {
    const ax = Math.abs(x);
    let h = 1.5 - 2.1 * sstep(0, 150, z) - Math.max(0, z - 150) * 0.0042;
    h += 0.55 * sstep(55, 98, ax) * sstep(170, 120, z);
    const dx = x - chanX(Math.min(z, 150)), cw = 4.5 + Math.max(0, z) * 0.03;
    h -= 0.8 * Math.exp(-(dx * dx) / (cw * cw)) * sstep(2, 26, z);
    h += noise.fbm2(x * 0.03 + nOff, z * 0.03, 3) * 0.34 + noise.n2(x * 0.11, z * 0.11 + nOff) * 0.07;
    h -= 3.5 * sstep(0, 1, (Math.max(ax - 232, 0) + Math.max(z - 372, 0)) / 44);
    return h;
  };
  const hillHeight = (x, z) => {
    const ax = Math.abs(x);
    if (z > -0.2 && ax < 104.5) return -3;
    let h = 13.9 + 2.6 * sstep(-14, -58, z) + 6.5 * sstep(-58, -102, z) * (0.75 + 0.35 * noise.n2(x * 0.012 + nOff, 3.1));
    h += noise.fbm2(x * 0.03, z * 0.03 + nOff, 3) * 2.2 * sstep(-52, -90, z);
    const k = sstep(152, 110, ax + noise.n2(z * 0.03, nOff) * 6) * sstep(36, 2, z) * sstep(-182, -118, z + noise.n2(x * 0.02, nOff + 9) * 10);
    return -2.6 + (h + 2.6) * k;
  };

  // the reef the east mole was built against: sea-worn granite standing behind the mole and beyond the lighthouse (a tall stack at
  // its seaward corner, a crest above the parapet, ledges the swell washes), and a skerry to seaward that carries a beacon tower.
  // [cx, cz, ax, az, top]: a rounded mass, its semi-axes at the high-water line
  // (with opts.arch the two rocks beside the portal are the feet of a sea arch that spans the last straight: see the reef mesh)
  const ARCH_FEET = [[102.1, 190.5, 5.2, 4.4, 19.5], [95.2, 216, 4.8, 4.2, 18.5]];
  const REEF = [[35, 162.5, 7.5, 6, 18.5], [25.5, 159.8, 4.2, 3.4, 14.4], [39, 171, 7.5, 7.5, 23.5], [43.5, 163.5, 6.5, 5.5, 20.8],
    [57, 173, 6, 5, 17], [70, 174, 7, 5, 18.2], [50, 180.5, 7, 3.2, 13.6], [62, 183, 7.5, 3.4, 15.4], [74.5, 184.6, 4.6, 3.5, 23.5], [93, 152.5, 6, 5.5, 20],
    [71, 209.5, 5.5, 4, 15.2], [77.5, 211.5, 3.5, 3, 13.6], [91, 189.5, 3.6, 3, 14.6], [88.5, 215.2, 3.6, 2.8, 13.8], [23.4, 164.2, 2.6, 2.0, 12.5], [25.2, 170.6, 2.2, 1.8, 12.4], ...(opts.arch ? ARCH_FEET : [[96.5, 191.2, 4.2, 3.6, 19.5], [95.5, 216.8, 5, 4, 16.8]])];
  const RIDGE = [50, 163.5, 87, 157.5, 6.5, 23.8];       // the crest: from, to, half-width at high water, top
  const MOLE_E = [[28.5, 152.5], [50, 151.5], [70, 146], [86, 135], [97, 118]];
  const moleOuterZ = (x) => {      // the seaward face of the east mole at this x
    let i = 0; while (i < MOLE_E.length - 2 && x > MOLE_E[i + 1][0]) i++;
    const a = MOLE_E[i], b = MOLE_E[i + 1], m = (b[1] - a[1]) / (b[0] - a[0]); return a[1] + (x - a[0]) * m + 5.3 * Math.sqrt(1 + m * m);
  };
  const reefLump = (d, r, top) => (d < 1 ? TIDE_HIGH + (top - TIDE_HIGH) * Math.pow(1 - d * d, 0.75) : TIDE_HIGH - (d - 1) * r * 1.7);
  const reefHeight = (x, z) => {
    if (x < 14 || x > 122 || z < 146 || z > 226) return -9;
    const w = 1 + 0.2 * noise.n2(x * 0.11 + nOff, z * 0.11) + 0.08 * noise.n2(x * 0.37, z * 0.37 + nOff);
    let h = -9;
    for (let k = 0; k < REEF.length; k++) { const q = REEF[k], d = Math.hypot((x - q[0]) / q[2], (z - q[1]) / q[3]) * w; if (d < 3) h = Math.max(h, reefLump(d, Math.min(q[2], q[3]), q[4])); }
    {
      const dx = RIDGE[2] - RIDGE[0], dz = RIDGE[3] - RIDGE[1], t = Math.min(1, Math.max(0, ((x - RIDGE[0]) * dx + (z - RIDGE[1]) * dz) / (dx * dx + dz * dz)));
      const d = Math.hypot(x - RIDGE[0] - dx * t, z - RIDGE[1] - dz * t) / RIDGE[4] * w; if (d < 3) h = Math.max(h, reefLump(d, RIDGE[4], RIDGE[5] + 1.2 * noise.n2(x * 0.09, nOff + 5)));
    }
    if (h < -8) return -9;
    h += (noise.fbm2(x * 0.16, z * 0.16 + nOff, 3) * 1.0 + noise.n2(x * 0.6 + nOff, z * 0.6) * 0.5 + 0.5 * Math.abs(noise.n2(x * 0.33, z * 0.33 + nOff))) * sstep(-2, 6, h);      // blocks and clefts
    { const st = 3, f = (h + 0.1 * x - 0.06 * z) / st, fr = f - Math.floor(f); h += 0.85 * st * (sstep(0.3, 0.7, fr) - fr) * sstep(-2, 4, h); }      // bedded: dipping ledges and risers
    const mz = moleOuterZ(x);                      // it stands clear of the mole's own masonry and of the pier head
    return Math.max(-9, -5 + (h + 5) * sstep(mz - 0.4, mz + 1.6, z) * sstep(5.0, 6.6, Math.hypot(x - 28.5, z - 152.5)));
  };

  let sandMeshH = sandHeight;       // the height of the sand as the mesh draws it (the tide surface must agree with the triangles, not with the function)
  if (opts.floor !== false) {     // the sand
    const X0 = -276, X1 = 276, Z0 = -4, Z1 = 416, NX = 104, NZ = 80;
    const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), col = new Float32Array((NX + 1) * (NZ + 1) * 3), kk = new Float32Array((NX + 1) * (NZ + 1)).fill(8);
    for (let j = 0, o = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++, o++) {
        const x = X0 + (X1 - X0) * i / NX, z = Z0 + (Z1 - Z0) * j / NZ;
        pos[o * 3] = x; pos[o * 3 + 1] = sandHeight(x, z); pos[o * 3 + 2] = z;
        const t = 0.5 + 0.5 * noise.n2(x * 0.02, z * 0.02 + 40);
        col[o * 3] = SAND.r * (0.9 + 0.2 * t); col[o * 3 + 1] = SAND.g * (0.9 + 0.17 * t); col[o * 3 + 2] = SAND.b * (0.92 + 0.1 * t);
      }
      await ctx.yield();
    }
    const idx = [];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    await ctx.yield();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aK', new THREE.BufferAttribute(kk, 1));
    g.setIndex(idx); await ctx.yield();
    await stepNormals(g, pos, idx, ctx);
    sandMeshH = (x, z) => {
      const fx = Math.min(NX - 1e-4, Math.max(0, (x - X0) / (X1 - X0) * NX)), fz = Math.min(NZ - 1e-4, Math.max(0, (z - Z0) / (Z1 - Z0) * NZ));
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
      const ha = pos[a * 3 + 1], hb = pos[b * 3 + 1], hc = pos[c * 3 + 1], hd = pos[d * 3 + 1];
      return u + v <= 1 ? ha + (hb - ha) * u + (hc - ha) * v : hd + (hc - hd) * (1 - u) + (hb - hd) * (1 - v);
    };
    const sand = new THREE.Mesh(g, solidMat); sand.name = 'sand'; sand.receiveShadow = shadows; group.add(sand);
  }
  await ctx.yield();
  {   // sand height texture for the tide surface (half float, one channel)
    const X0 = -280, Z0 = -8, W = 560, D = 428, N = 256, data = new Uint16Array(N * N);
    for (let j = 0, o = 0; j < N; j++) {
      for (let i = 0; i < N; i++, o++) { const tx = X0 + (i + 0.5) / N * W, tz = Z0 + (j + 0.5) / N * D; data[o] = THREE.DataUtils.toHalfFloat(Math.max(sandMeshH(tx, tz), reefHeight(tx, tz))); }
      if (j % 8 === 0) await ctx.yield();
    }
    const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.HalfFloatType);
    tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
    U.uHt.value = tex; U.uHtBox.value.set(X0, Z0, 1 / W, 1 / D);
  }
  await ctx.yield();
  {   // the headland behind the quay (village plateau, grass ridge, rocky skirts)
    const X0 = -165, X1 = 165, Z0 = -190, Z1 = 40, NX = 66, NZ = 46;
    const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), col = new Float32Array((NX + 1) * (NZ + 1) * 3), kk = new Float32Array((NX + 1) * (NZ + 1)).fill(6);
    const PAVE = mixc(GRAN, WHITE, 0.12), GRASS = C('#4d6630');
    for (let j = 0, o = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++, o++) {
        const x = X0 + (X1 - X0) * i / NX, z = Z0 + (Z1 - Z0) * j / NZ;
        pos[o * 3] = x; pos[o * 3 + 1] = hillHeight(x, z); pos[o * 3 + 2] = z;
        const village = z > -66 && Math.abs(x) < 117, c = village ? PAVE : GRASS, t = 0.9 + 0.2 * noise.n2(x * 0.05, z * 0.05);
        col[o * 3] = c.r * t; col[o * 3 + 1] = c.g * t; col[o * 3 + 2] = c.b * t;
      }
      if (j % 3 === 2) await ctx.yield();
    }
    await ctx.yield();
    const idx = [];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    await ctx.yield();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aK', new THREE.BufferAttribute(kk, 1));
    g.setIndex(idx); await ctx.yield(); await stepNormals(g, pos, idx, ctx); await ctx.yield();
    const hill = new THREE.Mesh(g, solidMat); hill.name = 'headland'; hill.receiveShadow = shadows; group.add(hill);
  }
  await ctx.yield();
  {   // the reef (kind 10: sea-worn granite), faceted like the rest of the world. Above 9.5 m (the high-water line is at 12) it is
      // not a height field: a density (positive inside the rock) is sampled on a one-metre lattice and meshed with surface nets, so
      // a cliff is tiled in metre blocks like a ledge, with the beds standing proud and undercut; every facet has one normal and
      // one tone. Below, the skirts that run down to the sand are a coarse height field, capped inside the rock above. With
      // opts.arch a sea arch stands over the last straight (further down).
    const P = [], N = [], Cc = [], RC = [C('#9c958f'), C('#8b8683'), C('#a89f94'), C('#807c7b'), C('#978d84')];
    const jit = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v) - 0.5; };
    // one facet a, b, c, d (counter-clockwise seen from the air): two triangles that share the facet's normal and tone
    // (vn, ia..id: the summed normals of the facets round each corner. The sea has rounded this rock: every corner's normal is
    // the facet's own leaned 82% toward that mean, so a face still reads as a face but the mass is not a pile of boxes)
    const SMK = 0.82, CORN = [0, 1, 2, 0, 2, 3], cid = [0, 0, 0, 0];
    const facet = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, hsh, vn, ia, ib, ic, id) => {
      const ux = cx - ax, uy = cy - ay, uz = cz - az, vx = dx - bx, vy = dy - by, vz = dz - bz;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const mx = (ax + bx + cx + dx) / 4, my = (ay + by + cy + dy) / 4, mz = (az + bz + cz + dz) / 4;
      const cf = Math.min((0.5 + 0.5 * noise.n2(mx * 0.07 + nOff, mz * 0.07 + my * 0.05)) * 4, 3.999), ci = Math.floor(cf), ct = (cf - ci) * (cf - ci) * (3 - 2 * (cf - ci)), c0 = RC[ci], c1 = RC[ci + 1];      // the tones run into one another: no facet is a patch of its own
      const k = (0.9 + 0.2 * noise.n2(mx * 0.21, mz * 0.21 + nOff)) * (0.97 + 0.06 * hsh), cr = (c0.r + (c1.r - c0.r) * ct) * k, cg = (c0.g + (c1.g - c0.g) * ct) * k, cb = (c0.b + (c1.b - c0.b) * ct) * k;
      P.push(ax, ay, az, bx, by, bz, cx, cy, cz, ax, ay, az, cx, cy, cz, dx, dy, dz);
      cid[0] = ia; cid[1] = ib; cid[2] = ic; cid[3] = id;
      for (let q = 0; q < 6; q++) {
        if (vn) {
          const o = cid[CORN[q]] * 3, sl = Math.hypot(vn[o], vn[o + 1], vn[o + 2]) || 1;
          let px = nx * (1 - SMK) + vn[o] / sl * SMK, py = ny * (1 - SMK) + vn[o + 1] / sl * SMK, pz = nz * (1 - SMK) + vn[o + 2] / sl * SMK; const pl = Math.hypot(px, py, pz) || 1;
          N.push(px / pl, py / pl, pz / pl);
        } else N.push(nx, ny, nz);
        Cc.push(cr, cg, cb);
      }
    };
    // surface nets over a lattice of NI x NJ x NK samples one metre apart; sample (i, j, k) stands at
    // (BX + i * IX + k * KX, BY + j, BZ + i * IZ + k * KZ). One vertex in every cell the surface passes through (the mean of where
    // it cuts the cell's edges), one facet across every lattice edge that passes from rock to air, wound to face the air.
    const EDGE = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], cval = new Float32Array(8);
    const nets = async (val, NI, NJ, NK, BX, BY, BZ, IX, IZ, KX, KZ) => {
      const at = (i, j, k) => (k * NJ + j) * NI + i, cv = new Int32Array(NI * NJ * NK).fill(-1), vs = [], AX = [[IX, 0, IZ], [0, 1, 0], [KX, 0, KZ]];
      for (let k = 0; k < NK - 1; k++) {
        for (let j = 0; j < NJ - 1; j++) for (let i = 0; i < NI - 1; i++) {
          let pos = 0; for (let n = 0; n < 8; n++) { cval[n] = val[at(i + (n & 1), j + ((n >> 1) & 1), k + (n >> 2))]; if (cval[n] > 0) pos++; }
          if (pos === 0 || pos === 8) continue;
          let sx = 0, sy = 0, sz = 0, m = 0;
          for (let e = 0; e < 12; e++) {
            const p = EDGE[e][0], q = EDGE[e][1], va = cval[p], vb = cval[q]; if ((va > 0) === (vb > 0)) continue;
            const tt = va / (va - vb); sx += (p & 1) + ((q & 1) - (p & 1)) * tt; sy += ((p >> 1) & 1) + (((q >> 1) & 1) - ((p >> 1) & 1)) * tt; sz += (p >> 2) + ((q >> 2) - (p >> 2)) * tt; m++;
          }
          const fi = i + sx / m, fk = k + sz / m;
          cv[at(i, j, k)] = vs.length / 3; vs.push(BX + fi * IX + fk * KX, BY + j + sy / m, BZ + fi * IZ + fk * KZ);
        }
        if (k % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      const QL = [], QH = [], vnr = new Float32Array(vs.length);      // the facets (corner ids in winding order), their tones, the normals summed at each corner
      const quad = (c0, c1, c2, c3, ax, sign, hsh) => {
        if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) return;
        const a = c0 * 3, b = c1 * 3, c = c2 * 3, d = c3 * 3;
        const ux = vs[c] - vs[a], uy = vs[c + 1] - vs[a + 1], uz = vs[c + 2] - vs[a + 2], vx = vs[d] - vs[b], vy = vs[d + 1] - vs[b + 1], vz = vs[d + 2] - vs[b + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const keep = (nx * AX[ax][0] + ny * AX[ax][1] + nz * AX[ax][2]) * sign > 0;
        if (!keep) { nx = -nx; ny = -ny; nz = -nz; }
        for (const o of [a, b, c, d]) { vnr[o] += nx; vnr[o + 1] += ny; vnr[o + 2] += nz; }
        if (keep) QL.push(c0, c1, c2, c3); else QL.push(c0, c3, c2, c1);
        QH.push(hsh);
      };
      for (let k = 1; k < NK - 1; k++) {
        for (let j = 1; j < NJ - 1; j++) for (let i = 1; i < NI - 1; i++) {
          const v0 = val[at(i, j, k)], sg = v0 > 0 ? 1 : -1, h = jit(i, j, k + 7) + 0.5;
          if ((v0 > 0) !== (val[at(i + 1, j, k)] > 0)) quad(cv[at(i, j - 1, k - 1)], cv[at(i, j, k - 1)], cv[at(i, j, k)], cv[at(i, j - 1, k)], 0, sg, h);
          if ((v0 > 0) !== (val[at(i, j + 1, k)] > 0)) quad(cv[at(i - 1, j, k - 1)], cv[at(i, j, k - 1)], cv[at(i, j, k)], cv[at(i - 1, j, k)], 1, sg, h);
          if ((v0 > 0) !== (val[at(i, j, k + 1)] > 0)) quad(cv[at(i - 1, j - 1, k)], cv[at(i, j - 1, k)], cv[at(i, j, k)], cv[at(i - 1, j, k)], 2, sg, h);
        }
        if (k % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      for (let q = 0; q < QH.length; q++) {
        const ia = QL[q * 4], ib = QL[q * 4 + 1], ic = QL[q * 4 + 2], id = QL[q * 4 + 3], a = ia * 3, b = ib * 3, c = ic * 3, d = id * 3;
        facet(vs[a], vs[a + 1], vs[a + 2], vs[b], vs[b + 1], vs[b + 2], vs[c], vs[c + 1], vs[c + 2], vs[d], vs[d + 1], vs[d + 2], QH[q], vnr, ia, ib, ic, id);
        if (q % 1500 === 1499) await ctx.yield();
      }
      await ctx.yield();
    };
    // the dipping beds of the reef: a ledge that stands proud, an undercut below it
    const beds = (x, y, z) => { const q = (y + 0.1 * x - 0.06 * z) / 3, fq = q - Math.floor(q); return sstep(0.3, 0.7, fq) - 0.5; };
    const flyR = opts.fly || null;
    const lineDist = (x, z) => { let m = 1e9; for (let i = 0; i < flyR.length - 1; i++) { const a = flyR[i], b = flyR[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t)); } return m; };
    {
      const RX0 = 16, RZ0 = 148, RY0 = 9.5, LX = 105, LY = 22, LZ = 77, h2 = new Float32Array(LX * LZ), val = new Float32Array(LX * LY * LZ);
      for (let k = 0; k < LZ; k++) { for (let i = 0; i < LX; i++) h2[k * LX + i] = reefHeight(RX0 + i, RZ0 + k); if (k % 4 === 3) await ctx.yield(); }
      await ctx.yield();
      for (let k = 0; k < LZ; k++) {
        for (let i = 0; i < LX; i++) {
          const o = k * LX + i, h = h2[o], x = RX0 + i, z = RZ0 + k;
          if (h < RY0 - 3) { for (let j = 0; j < LY; j++) val[(k * LY + j) * LX + i] = h - (RY0 + j); continue; }
          const hx = (h2[o + (i < LX - 1 ? 1 : 0)] - h2[o - (i > 0 ? 1 : 0)]) * 0.5, hz = (h2[o + (k < LZ - 1 ? LX : 0)] - h2[o - (k > 0 ? LX : 0)]) * 0.5, inv = 1 / Math.sqrt(1 + hx * hx + hz * hz);
          const clear = flyR ? lineDist(x, z) - 6.2 : 1e9;
          for (let j = 0; j < LY; j++) {
            const y = RY0 + j; let f = (h - y) * inv;      // about the distance to the surface
            if (f > -2.6 && f < 2.6) f += 0.7 * noise.fbm3(x * 0.14 + nOff, y * 0.14, z * 0.14, 2) + 0.5 * beds(x, y, z) * (1 - inv * 0.6);
            val[(k * LY + j) * LX + i] = Math.min(f, clear);
          }
        }
        await ctx.yield();
      }
      await ctx.yield();
      await nets(val, LX, LY, LZ, RX0, RY0, RZ0, 1, 0, 0, 1);
    }
    {   // the skirts
      const X0 = 16, X1 = 120, Z0 = 148, Z1 = 224, NX = 80, NZ = 58, NV = (NX + 1) * (NZ + 1), hh = new Float32Array(NV), gx = new Float32Array(NV), gz = new Float32Array(NV);
      for (let j = 0, o = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++, o++) { gx[o] = X0 + (X1 - X0) * (i + 0.5 * jit(i, j, 0)) / NX; gz[o] = Z0 + (Z1 - Z0) * (j + 0.5 * jit(i, j, 1)) / NZ; hh[o] = Math.min(10.6, reefHeight(gx[o], gz[o])); }
        if (j % 4 === 3) await ctx.yield();
      }
      const vnr = new Float32Array(NV * 3);
      for (let j = 0; j < NZ; j++) {
        for (let i = 0; i < NX; i++) {
          const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; if (Math.max(hh[a], hh[b], hh[c], hh[d]) < -3.5) continue;
          const ux = gx[d] - gx[a], uy = hh[d] - hh[a], uz = gz[d] - gz[a], vx = gx[b] - gx[c], vy = hh[b] - hh[c], vz = gz[b] - gz[c];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          for (const o of [a * 3, b * 3, c * 3, d * 3]) { vnr[o] += nx; vnr[o + 1] += ny; vnr[o + 2] += nz; }
        }
        if (j % 8 === 7) await ctx.yield();
      }
      for (let j = 0; j < NZ; j++) {
        for (let i = 0; i < NX; i++) {
          const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; if (Math.max(hh[a], hh[b], hh[c], hh[d]) < -3.5) continue;
          facet(gx[a], hh[a], gz[a], gx[c], hh[c], gz[c], gx[d], hh[d], gz[d], gx[b], hh[b], gz[b], jit(i, j, 2) + 0.5, vnr, a, c, d, b);
        }
        if (j % 4 === 3) await ctx.yield();
      }
      await ctx.yield();
    }
    // The sea arch (opts.arch, with opts.portal and opts.portalDir): two piers of the same granite standing either side of the
    // last straight and a span between them, the portal in its throat. Its density is sampled in the arch's own frame (s to
    // starboard, y up, a along our course; the portal at s = 0, a = 0). The way through is cut last and is never nearer than
    // 6.8 m to our line. Its feet stand in ARCH_FEET, so the tide breaks white round them.
    if (opts.arch && opts.portal && opts.portalDir) {
      const PX = opts.portal[0], PY = opts.portal[1], PZ = opts.portal[2], dl = Math.hypot(opts.portalDir[0], opts.portalDir[1]) || 1, DX = opts.portalDir[0] / dl, DZ = opts.portalDir[1] / dl, RX = -DZ, RZ = DX;
      const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
      const field = (s, y, a) => {
        const rl = 6.4 + 1.8 * sstep(25, 11, y) - 3.4 * sstep(25, 34, y), rr = 5.6 + 1.6 * sstep(22, 11, y) - 2.8 * sstep(20, 28.5, y);
        const fl = Math.min(rl - Math.hypot(s + 13.8, (a + 3.4) * 1.15), (34 - y) * 0.8), fr = Math.min(rr - Math.hypot(s - 13.2, (a + 3.2) * 1.2), (28.5 - y) * 0.8);
        const t = Math.min(1, Math.max(0, (s + 11) / 22.5)), hump = Math.sin(t * Math.PI), cy = 29.6 - 2.6 * t + 0.7 * hump, rv = 3.5 - 0.7 * hump, ra = 4.7 - 0.9 * hump, ds = s - (-11 + 22.5 * t);
        const fs = (1 - Math.hypot(ds / 3.2, (y - cy) / rv, (a + 3.3) / ra)) * rv;
        let f = smax(smax(fl, fr, 2.5), fs, 3);
        if (f < -3.6) return f;
        const wx = PX + DX * a + RX * s, wz = PZ + DZ * a + RZ * s;
        f += 1.25 * noise.fbm3(wx * 0.11 + nOff, y * 0.11, wz * 0.11, 3) + 0.45 * noise.n3(wx * 0.37, y * 0.37 + nOff, wz * 0.37) + 0.9 * beds(wx, y, wz);
        const hole = (Math.hypot(s / 7.9, (y - 12) / 15.2) - 1) * 7.9 + 0.55 * noise.n3(wx * 0.3 + 7, y * 0.3, wz * 0.3 + nOff);
        return Math.min(f, hole, Math.hypot(s, y - (PY - 0.4)) - 6.8);
      };
      const S0 = -25, Y0 = 9.5, A0 = -13, NS = 50, NY = 29, NA = 21, val = new Float32Array(NS * NY * NA);
      for (let k = 0; k < NA; k++) {
        for (let j = 0; j < NY; j++) for (let i = 0; i < NS; i++) val[(k * NY + j) * NS + i] = field(S0 + i, Y0 + j, A0 + k);
        await ctx.yield();
      }
      await nets(val, NS, NY, NA, PX + RX * S0 + DX * A0, Y0, PZ + RZ * S0 + DZ * A0, RX, RZ, DX, DZ);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); await ctx.yield();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); await ctx.yield();
    g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(P.length / 3).fill(10), 1));
    await ctx.yield();
    const reef = new THREE.Mesh(g, solidMat); reef.name = 'reef'; reef.receiveShadow = shadows; group.add(reef);      // (it casts none: its shadow would fall on the sea, which takes none, and the pass would draw it twice)
  }
  await ctx.yield();

  // ---- granite: quay face, moles, stair, slipway --------------------------------------------------------------------------
  const G = new GW(), GC = new GW(true);
  // a gull standing (on a pile top, a bollard, the coping): cloth mesh, so it shifts its weight a little; facing +x of its own yaw
  const gullAt = (x, y, z, yaw, ph) => {
    GC.xf(x, y, z, yaw); GC.kind = 0; GC.pivot([0, 0, 0], 3, 0, 0.3, ph);
    const GW1 = C('#f1efe8'), GG = C('#9aa3ac'), GD = C('#2a2c30'), GY = C('#e0b02a');
    GC.box(0, 0.2, 0, 0.36, 0.15, 0.15, GW1, 0, 0.8); GC.box(-0.03, 0.245, 0, 0.34, 0.07, 0.17, GG, 0, 0.7); GC.box(-0.23, 0.23, 0, 0.14, 0.04, 0.08, GD);
    GC.box(0.15, 0.33, 0, 0.1, 0.13, 0.09, GW1, 0, 0.85); GC.beam([0.19, 0.35, 0], [0.29, 0.33, 0], 0.03, GY, 3);
    for (const sz of [-0.035, 0.035]) GC.beam([0.02, 0.13, sz], [0.02, 0, sz], 0.016, GY, 3);
    GC.pivot([0, 0, 0], 0, 0, 0, 0); GC.xf(0, 0, 0, 0);
  };
  // an old tyre hung as a fender (its axis along z: flat against a wall that faces +z), from a point above it
  const tyreAt = (g, x, y, z, r = 0.34) => {
    const TY = C('#17181a'), TL = C('#2b2d30');
    for (let k = 0; k < 9; k++) { const a0 = k / 9 * 6.2832, a1 = (k + 1) / 9 * 6.2832; g.beam([x + Math.sin(a0) * r, y + Math.cos(a0) * r, z], [x + Math.sin(a1) * r, y + Math.cos(a1) * r, z], 0.16, k % 2 ? TY : TL, 5); }
  };
  const BASE = -2.5, wallZ = (y) => 1.5 * (1 - (y - BASE) / (RIM - BASE));
  G.kind = 1;
  for (let x = -100; x < 100; x += 10) {
    const c0 = vcol(GRAN, 0.07), c1 = vcol(GRAN, 0.07);
    G.quad([x, BASE, wallZ(BASE)], [x + 10, BASE, wallZ(BASE)], [x + 10, 6, wallZ(6)], [x, 6, wallZ(6)], c0, c1);
    G.quad([x, 6, wallZ(6)], [x + 10, 6, wallZ(6)], [x + 10, RIM, 0], [x, RIM, 0], c1, vcol(GRAN, 0.07, 1.06));
  }
  G.box(0, RIM - 0.12, 0.1, 200, 0.42, 0.7, vcol(GRAN, 0.02, 1.12));       // coping course
  G.kind = 4; G.quad([-104, RIM + 0.02, 0.4], [104, RIM + 0.02, 0.4], [104, RIM + 0.02, -10.5], [-104, RIM + 0.02, -10.5], mixc(GRAN, WHITE, 0.12));
  // a mole along a centreline: battered walls both sides, sett top, round head, parapet on the sea side
  const mole = (pts, half, outer, parapetTo) => {
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      L.push([-dz / l, dx / l]); R.push([pts[i][0], pts[i][1]]);
    }
    const P = (i, side, off, y) => [R[i][0] + L[i][0] * side * off, y, R[i][1] + L[i][1] * side * off];
    const bat = half + 1.5;
    for (let i = 0; i < n - 1; i++) {
      for (const side of [-1, 1]) {
        const c0 = vcol(GRAN, 0.07), c1 = vcol(GRAN, 0.07, 1.05);
        G.kind = 1;
        const a = P(i, side, bat, BASE), b = P(i + 1, side, bat, BASE), c = P(i + 1, side, half, RIM), d = P(i, side, half, RIM);
        if (side > 0) G.quad(a, b, c, d, c0, c1); else G.quad(b, a, d, c, c0, c1);
        if (side === outer && i < parapetTo) {
          const o0 = P(i, side, half, RIM), o1 = P(i + 1, side, half, RIM), i0 = P(i, side, half - 0.6, RIM), i1 = P(i + 1, side, half - 0.6, RIM), up = (v) => [v[0], v[1] + 1.15, v[2]];
          const pc = vcol(GRAN, 0.05, 1.05);
          if (side > 0) { G.quad(o0, o1, up(o1), up(o0), pc); G.quad(i1, i0, up(i0), up(i1), pc); G.quad(up(o0), up(o1), up(i1), up(i0), pc); }
          else { G.quad(o1, o0, up(o0), up(o1), pc); G.quad(i0, i1, up(i1), up(i0), pc); G.quad(up(o1), up(o0), up(i0), up(i1), pc); }
        }
      }
      G.kind = 4; G.quad(P(i, 1, half, RIM), P(i + 1, 1, half, RIM), P(i + 1, -1, half, RIM), P(i, -1, half, RIM), mixc(GRAN, WHITE, 0.1));
    }
    // round head
    const e = R[n - 1], nl = L[n - 1], a0 = Math.atan2(nl[0], nl[1]);
    const dirOK = -1;
    for (let k = 0; k < 10; k++) {
      const t0 = a0 + Math.PI * k / 10, t1 = a0 + Math.PI * (k + 1) / 10;
      const q = (t, r, y) => [e[0] + Math.sin(t) * r, y, e[1] + Math.cos(t) * r];
      const c0 = vcol(GRAN, 0.07);
      G.kind = 1;
      if (dirOK > 0) G.quad(q(t1, bat, BASE), q(t0, bat, BASE), q(t0, half, RIM), q(t1, half, RIM), c0, vcol(GRAN, 0.07, 1.05));
      else G.quad(q(t0, bat, BASE), q(t1, bat, BASE), q(t1, half, RIM), q(t0, half, RIM), c0, vcol(GRAN, 0.07, 1.05));
      G.kind = 4;
      if (dirOK > 0) G.tri([e[0], RIM, e[1]], q(t1, half, RIM), q(t0, half, RIM), mixc(GRAN, WHITE, 0.1)); else G.tri([e[0], RIM, e[1]], q(t0, half, RIM), q(t1, half, RIM), mixc(GRAN, WHITE, 0.1));
    }
  };
  const subdiv = (pts, step) => { const o = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } o.push(pts[pts.length - 1]); return o; };
  await ctx.yield();
  const LH = [28.5, 152.5], WH = [-12.5, 149.5];
  const eastPts = subdiv([[104, -3], [104, 60], [103, 92], [97, 118], [86, 135], [70, 146], [50, 151.5], LH], 9);
  const westPts = subdiv([[-104, -3], [-104, 60], [-103, 88], [-97, 113], [-85, 130], [-66, 141], [-42, 147.5], WH], 9);
  mole(eastPts, 4.6, -1, eastPts.length - 3); await ctx.yield();
  mole(westPts, 4.6, 1, westPts.length - 2); await ctx.yield();
  // the stone stair down the face (top landing at x = 64, foot at x ~ 42) and the slipway by the west mole
  G.kind = 1;
  for (let i = 0; i < 40; i++) { const ty = RIM - i * 0.35; G.box(64 - i * 0.56, (ty + BASE) / 2, 1.9, 0.57, ty - BASE, 3.8, vcol(GRAN, 0.06, 1.02)); }
  G.box(66.3, (RIM + BASE) / 2, 1.9, 4, RIM - BASE, 3.8, vcol(GRAN, 0.05));
  {
    const xa = -98.6, xb = -90.5, z0 = 3, z1 = 86, y1 = sandHeight(-94, 86) - 0.25, sc = vcol(GRAN, 0.04, 0.95);
    G.kind = 4; G.quad([xa, RIM, z0], [xa, y1, z1], [xb, y1, z1], [xb, RIM, z0], sc);
    G.kind = 1; G.quad([xb, BASE, z0], [xb, RIM, z0], [xb, y1, z1], [xb, BASE, z1], sc);
    G.quad([xb, BASE, z0], [xa, BASE, z0], [xa, RIM, z0], [xb, RIM, z0], sc);
  }
  // iron ladders, bollards, mooring chains
  const IRON = C('#3a2a22'), RUST = C('#7a4322'), IRONB = C('#1c1d1f');
  const ladderXs = [-80, -63, -46, -33, -22, 12, 84];
  G.kind = 0.1;
  for (const lx of ladderXs) {
    for (const s of [-0.26, 0.26]) {
      G.beam([lx + s, sandHeight(lx, 2) - 0.3, wallZ(0) + 0.3], [lx + s, RIM + 0.1, 0.3], 0.11, vcol(RUST, 0.2), 4, vcol(IRON, 0.2));
      G.beam([lx + s, RIM + 0.1, 0.3], [lx + s, RIM + 1.05, 0.05], 0.09, IRON); G.beam([lx + s, RIM + 1.05, 0.05], [lx + s, RIM + 1.0, -0.7], 0.09, IRON); G.beam([lx + s, RIM + 1.0, -0.7], [lx + s, RIM, -0.75], 0.09, IRON);
    }
    for (let y = 0.5; y < RIM; y += 0.36) { const z = wallZ(y) + 0.3 * (1 - y / 30); const c = y < 9 ? vcol(RUST, 0.25, y < 4 ? 0.7 : 1) : vcol(IRON, 0.2); G.beam([lx - 0.26, y, z], [lx + 0.26, y, z], 0.085, c); }
    for (let y = 1.5; y < RIM; y += 3.1) for (const s of [-0.26, 0.26]) G.beam([lx + s, y, wallZ(y) + 0.3], [lx + s, y, wallZ(y) - 0.1], 0.07, IRON);
  }
  await ctx.yield();
  const bollards = [];
  G.kind = 0;
  for (let x = -96; x <= 96; x += 12) {
    const bx = x + rng.range(-1.5, 1.5); if (ladderXs.some((l) => Math.abs(l - bx) < 2) || (bx > 60 && bx < 69)) continue;
    bollards.push(bx);
    G.prism(8, 0.26, 0.19, RIM, RIM + 0.55, IRONB, bx, -0.95, 0); G.prism(8, 0.19, 0.33, RIM + 0.55, RIM + 0.66, IRONB, bx, -0.95, 0); G.prism(8, 0.33, 0.2, RIM + 0.66, RIM + 0.8, IRONB, bx, -0.95, 1);
  }
  const chainEnds = [];
  for (const bx of bollards) {
    if (!rng.chance(0.72) && !(bx > -51 && bx < -38)) continue;
    const near = bx > -100 && bx < 20;          // keep the flight corridor at the foot of the wall clear
    G.kind = 0.1;
    const ex = bx + rng.range(-7, 7), ez = near ? rng.range(4.5, 8) : rng.range(8, 22), ey = sandHeight(ex, ez) + 0.06;
    if (bx < -88) continue;                      // the slipway
    chainEnds.push([ex, ez]);
    const A = [bx, RIM + 0.05, 0.45], N = 34; let prev = [bx, RIM + 0.4, -0.9];
    for (let k = 0; k <= N; k++) {
      const t = k / N, s = Math.pow(t, 0.55), y = ey + (A[1] - ey) * Math.pow(1 - t, 2.4);
      const z = Math.max(A[2] + (ez - A[2]) * s, wallZ(y) + 0.14), cur = [A[0] + (ex - A[0]) * s, y, z];
      const c = y < 4.6 ? vcol(WEED, 0.3, 0.8) : y < 9 ? vcol(RUST, 0.25) : vcol(IRON, 0.25);
      G.beam(prev, cur, k % 2 ? 0.1 : 0.14, c); prev = cur;
    }
  }
  await ctx.yield();
  // the face beside the rise: timber fender baulks strapped in iron, mooring rings with their rust streaks, and wrack that
  // hangs from the lower courses until the water lifts it
  {
    const TIMB = C('#8d7f6a'), TIMBD = C('#6a5d4c'), STREAK = C('#6b3d22');
    for (const fxp of [-67, -53.5, -41, -28.5, -17]) {
      G.kind = 0.1; G.beam([fxp, 1.4, wallZ(1.4) + 0.17], [fxp, 13.6, wallZ(13.6) + 0.17], 0.3, TIMBD, 4, TIMB);
      for (const sy of [3.6, 7.8, 12.2]) G.box(fxp, sy, wallZ(sy) + 0.17, 0.37, 0.1, 0.37, IRONB);
    }
    for (const [rx, ry] of [[-75, 9.4], [-70.5, 4.6], [-57.5, 5.8], [-60.5, 11.6], [-50, 10.2], [-44, 3.9], [-37.5, 6.2], [-36, 11.9], [-24.5, 9.8], [-26, 4.4], [-10, 7.2], [3, 10.4]]) {
      const wz = wallZ(ry), z1 = wallZ(ry - 3.2), RR = 0.4;
      G.kind = 0.1; G.beam([rx, ry + RR, wz - 0.02], [rx, ry + RR, wz + 0.2], 0.11, IRON);
      for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832, a1 = (k + 1) / 8 * 6.2832; G.beam([rx + Math.sin(a0) * RR, ry + Math.cos(a0) * RR, wz + 0.16], [rx + Math.sin(a1) * RR, ry + Math.cos(a1) * RR, wz + 0.16], 0.085, k % 2 ? IRON : RUST); }
      G.kind = 0; G.quad([rx - 0.07, ry - 3.2, z1 + 0.012], [rx + 0.1, ry - 3.2, z1 + 0.012], [rx + 0.2, ry - 0.3, wz + 0.012], [rx - 0.18, ry - 0.3, wz + 0.012], mixc(STREAK, GRAN, 0.8), STREAK);
    }
    // tide gauges: a white board from the sand to the coping, a black bar at every metre and a short one between (no figures)
    for (const gx of [-49.2, -30.6, -13.5]) {
      const BW = C('#e4dfd2'), BK = C('#17181a'), RD = C('#b8322a');
      for (let y = 1; y < 13.5; y += 1) {
        const ya = y, yb = Math.min(13.5, y + 1), za = wallZ(ya) + 0.05, zb = wallZ(yb) + 0.05;
        G.kind = 0.1; G.quad([gx - 0.19, ya, za], [gx + 0.19, ya, za], [gx + 0.19, yb, zb], [gx - 0.19, yb, zb], BW.clone().multiplyScalar(0.9), BW);
        G.quad([gx - 0.19, ya, za + 0.012], [gx + 0.19, ya, za + 0.012], [gx + 0.19, ya + 0.1, za + 0.012], [gx - 0.19, ya + 0.1, za + 0.012], Math.round(y) % 5 === 0 ? RD : BK);
        const ym = ya + 0.5, zm = wallZ(ym) + 0.062; G.quad([gx - 0.19, ym, zm], [gx, ym, zm], [gx, ym + 0.06, zm], [gx - 0.19, ym + 0.06, zm], BK);
      }
      G.kind = 0; G.box(gx, 13.6, wallZ(13.6) + 0.05, 0.5, 0.12, 0.1, IRONB);
    }
    // drains through the wall: a dark mouth under a granite lintel, a green and rust stain running down from it
    for (const [ox, oy] of [[-71.5, 10.6], [-44.5, 9.9], [-20, 10.8], [8, 10.2], [33, 10.5]]) {
      const wz = wallZ(oy), z1 = wallZ(oy - 5.5);
      G.kind = 0; G.quad([ox - 0.3, oy - 0.3, wz + 0.02], [ox + 0.3, oy - 0.3, wz + 0.02], [ox + 0.3, oy + 0.25, wz + 0.02], [ox - 0.3, oy + 0.25, wz + 0.02], C('#0b0c0d'));
      G.kind = 1; G.box(ox, oy + 0.36, wz + 0.05, 0.95, 0.22, 0.16, vcol(GRAN, 0.04, 1.1));
      G.kind = 0; G.quad([ox - 0.14, oy - 5.5, z1 + 0.014], [ox + 0.2, oy - 5.5, z1 + 0.014], [ox + 0.3, oy - 0.3, wz + 0.014], [ox - 0.3, oy - 0.3, wz + 0.014], mixc(C('#3d4a1c'), GRAN, 0.7), mixc(C('#4a4a1e'), STREAK, 0.4));
    }
    const FR = [WEED.clone().multiplyScalar(1.5), WEED.clone().multiplyScalar(2), C('#7d7526'), C('#5d6a1e'), C('#8a7a2a'), C('#4a5218')];
    GC.kind = 0;
    for (let i = 0; i < 520; i++) {      // each a tuft of five tapering fronds on one holdfast
      const fxp = -94 + lr() * 118, fy = 0.6 + Math.pow(lr(), 1.25) * 4.6, z0 = wallZ(fy) + 0.04, c0 = FR[Math.floor(lr() * 6)].clone().multiplyScalar(0.55 + 0.4 * lr());
      GC.pivot([fxp, fy, z0], 4, 0, 0.6 + 0.8 * lr(), lr() * 6.28);
      for (let k = 0; k < 5; k++) {
        const sx = fxp + (k - 2) * 0.11 + (lr() - 0.5) * 0.08, len = 0.45 + lr() * 1.0, w = 0.05 + lr() * 0.05, bend = (lr() - 0.5) * 0.3, c1 = c0.clone().multiplyScalar(0.8 + 0.5 * lr());
        GC.tri([sx + bend, fy - len, z0 + 0.09], [sx + w, fy, z0], [sx - w, fy, z0], c1.clone().multiplyScalar(1.3), c1, c1);
      }
      if (i % 130 === 129) await ctx.yield();
    }
    GC.pivot([0, 0, 0], 0, 0, 0, 0);
  }
  await ctx.yield();

  // ---- the village ------------------------------------------------------------------------------------------------------
  const SHUT = [[BLUE, C('#3f78b8'), C('#27508a'), C('#5b86a8')], [C('#2f7f78'), C('#3f8f6a'), BLUE, C('#5aa0a0')], [C('#8c3b32'), C('#a5523a'), BLUE, C('#6b7f96')]][look % 3];
  const WALLS = [C('#e6e0d2'), C('#d9d2c0'), WHITE, C('#cfc6b4'), C('#e3d6c0'), mixc(GRAN, WHITE, 0.3)];
  const GLASS = C('#16202a'), FRAME = mixc(GRAN, WHITE, 0.25), TERRA = C('#a8553a'), LEAF = [C('#2f5a2a'), C('#3d6b30'), C('#27481f')];
  const FLOWER = (season === 'late' ? ['#c96a8a', '#b5574a', '#d9a0a8', '#9a6a8c', '#c8b08a'] : ['#5b7fd6', '#7a6fd0', '#4f9ad8', '#b48ad6', '#d98ab8', '#6a8fe0']).map(C);
  const OCT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], OF = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
  const blob = (g, cx, cy, cz, r, cols, low, rnd) => {      // rnd: a random source of its own (then ctx.rng is left alone)
    const P = (d) => { const l = Math.hypot(d[0], d[1], d[2]) || 1, j = r * (0.82 + 0.36 * Math.abs(Math.sin(d[0] * 12.9 + d[1] * 78.2 + d[2] * 37.7 + cx))); return [cx + d[0] / l * j, cy + d[1] / l * j * 0.82, cz + d[2] / l * j]; };
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (const f of OF) {
      const a = OCT[f[0]], b = OCT[f[1]], c = OCT[f[2]], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      for (const t of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]) {
        const up = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const col = rnd ? (up > -0.15 && rnd() < 0.78 ? cols[Math.floor(rnd() * cols.length)] : low[Math.floor(rnd() * low.length)]).clone().multiplyScalar(0.86 + 0.28 * rnd())
          : up > -0.15 && rng.chance(0.78) ? vcol(rng.pick(cols), 0.14) : vcol(rng.pick(low), 0.15);
        g.tri(P(t[0]), P(t[1]), P(t[2]), col);
      }
    }
  };
  const house = (x, z, yaw, w, d, h, detail, delay0) => {
    const y0 = Math.min(hillHeight(x, z - 1), hillHeight(x, z - d + 1)) - 0.05; G.xf(x, y0, z, yaw); GC.xf(x, y0, z, yaw);
    const stone = rng.chance(0.3), wall = stone ? vcol(GRAN, 0.06, 1.05) : vcol(rng.pick(WALLS), 0.04), wlow = wall.clone().multiplyScalar(0.86);
    const sh = vcol(rng.pick(SHUT), 0.1), slate = vcol(SLATE, 0.1), frame = stone ? vcol(WHITE, 0.03, 0.92) : vcol(FRAME, 0.05);
    const hw = w / 2, hr = h + d * 0.5 * rng.range(0.95, 1.2), wk = stone ? 1 : 3, ov = 0.28;
    G.kind = wk;
    G.quad([-hw, -1.5, 0], [hw, -1.5, 0], [hw, h, 0], [-hw, h, 0], wlow, wall); G.quad([hw, -1.5, -d], [-hw, -1.5, -d], [-hw, h, -d], [hw, h, -d], wlow, wall);
    G.quad([hw, -1.5, 0], [hw, -1.5, -d], [hw, h, -d], [hw, h, 0], wlow, wall); G.tri([hw, h, 0], [hw, h, -d], [hw, hr, -d / 2], wall);
    G.quad([-hw, -1.5, -d], [-hw, -1.5, 0], [-hw, h, 0], [-hw, h, -d], wlow, wall); G.tri([-hw, h, -d], [-hw, h, 0], [-hw, hr, -d / 2], wall);
    for (const sx of [-1, 1]) {
      if (sx > 0 && rng.chance(0.25)) continue;
      const cxp = sx * (hw - 0.55);
      G.kind = wk; G.box(cxp, hr + 0.25, -d / 2, 0.9, 2.1, 1.15, wall, 0, 0.92); G.kind = 0; G.box(cxp, hr + 1.36, -d / 2, 1.0, 0.14, 1.2, wlow);
      G.prism(6, 0.15, 0.12, hr + 1.43, hr + 1.85, vcol(TERRA, 0.1), cxp, -d / 2 - 0.26, 1); G.prism(6, 0.15, 0.12, hr + 1.43, hr + 1.8, vcol(TERRA, 0.1), cxp, -d / 2 + 0.26, 1);
    }
    G.kind = 2;
    G.quad([-hw - ov, h - 0.12, 0.38], [hw + ov, h - 0.12, 0.38], [hw + ov, hr + 0.05, -d / 2], [-hw - ov, hr + 0.05, -d / 2], slate, vcol(SLATE, 0.1, 1.08));
    G.quad([hw + ov, h - 0.12, -d - 0.38], [-hw - ov, h - 0.12, -d - 0.38], [-hw - ov, hr + 0.05, -d / 2], [hw + ov, hr + 0.05, -d / 2], slate, vcol(SLATE, 0.1, 1.08));
    if (detail >= 1) {
      const floors = Math.max(2, Math.round(h / 2.8)), cols = Math.max(2, Math.round(w / 2.8)), fh = (h - 0.4) / floors, wh = Math.min(1.55, fh - 1.2), doorCol = rng.int(0, cols - 1);
      for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) / cols * w - hw, sy = f * fh + 0.95;
        if (f === 0 && c === doorCol) {
          G.kind = 0; G.quad([cx - 0.68, 0, 0.03], [cx + 0.68, 0, 0.03], [cx + 0.68, 2.3, 0.03], [cx - 0.68, 2.3, 0.03], frame);
          G.quad([cx - 0.5, 0, 0.06], [cx + 0.5, 0, 0.06], [cx + 0.5, 2.12, 0.06], [cx - 0.5, 2.12, 0.06], sh.clone().multiplyScalar(0.85), sh);
          continue;
        }
        G.kind = 0; G.quad([cx - 0.63, sy - 0.14, 0.03], [cx + 0.63, sy - 0.14, 0.03], [cx + 0.63, sy + wh + 0.16, 0.03], [cx - 0.63, sy + wh + 0.16, 0.03], frame);
        G.box(cx, sy - 0.1, 0.1, 1.34, 0.12, 0.24, frame);
        { const hh = Math.sin(x * 12.9898 + z * 4.1 + cx * 78.233 + f * 37.719) * 43758.5453, hf = hh - Math.floor(hh); G.kind = hf < 0.46 ? 6.6 + hf / 0.46 * 0.8 : 9; }
        G.quad([cx - 0.47, sy, 0.06], [cx + 0.47, sy, 0.06], [cx + 0.47, sy + wh, 0.06], [cx - 0.47, sy + wh, 0.06], GLASS);
        if (detail >= 2) {
          const dl = Math.min(0.78, delay0 + rng.range(0, 0.22)), sc = vcol(sh, 0.06);
          GC.kind = 0;
          const sd2 = sc.clone().multiplyScalar(0.74), panel = (xa, xb) => { for (const pz of [0.113, 0.087]) GC.quad([xa, sy + 0.09, pz], [xb, sy + 0.09, pz], [xb, sy + wh - 0.09, pz], [xa, sy + wh - 0.09, pz], sd2, sc.clone().multiplyScalar(0.86)); };      // a sunk panel on both faces of each leaf
          GC.pivot([cx - 0.49, sy, 0.1], 1, dl, -1, 0); GC.quad([cx - 0.49, sy - 0.03, 0.1], [cx, sy - 0.03, 0.1], [cx, sy + wh + 0.03, 0.1], [cx - 0.49, sy + wh + 0.03, 0.1], sc); panel(cx - 0.43, cx - 0.06);
          GC.pivot([cx + 0.49, sy, 0.1], 1, dl + 0.015, 1, 0); GC.quad([cx, sy - 0.03, 0.1], [cx + 0.49, sy - 0.03, 0.1], [cx + 0.49, sy + wh + 0.03, 0.1], [cx, sy + wh + 0.03, 0.1], sc); panel(cx + 0.06, cx + 0.43);
        }
      }
      if (detail >= 2 && !stone) {      // granite dressings on the rendered fronts: a plinth, a string course, quoins, a lintel over every opening (no draw from rng)
        const gq = GRAN.clone().multiplyScalar(1.1), gq2 = GRAN.clone().multiplyScalar(0.95);
        G.kind = 1; G.box(0, 0.36, 0.05, w + 0.1, 0.9, 0.16, gq2, 0, 1, gq); G.box(0, fh + 0.5, 0.04, w + 0.06, 0.17, 0.13, gq);
        for (const sx of [-1, 1]) for (let k = 0, y = 0.85; y < h - 0.3; k++, y += 0.4) { const bw = k % 2 ? 0.36 : 0.58; G.box(sx * (hw - bw / 2 + 0.03), y + 0.19, 0.04, bw, 0.36, 0.13, k % 2 ? gq2 : gq); }
        for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) { const cx = (c + 0.5) / cols * w - hw, top = f === 0 && c === doorCol ? 2.3 : f * fh + 0.95 + wh + 0.16; G.box(cx, top + 0.13, 0.05, 1.56, 0.27, 0.15, gq); }
      }
      const nd = rng.chance(0.6) ? rng.int(1, Math.min(2, cols - 1)) : 0;
      for (let k = 0; k < nd; k++) {
        const cx = ((nd === 1 ? 0.5 : k === 0 ? 0.28 : 0.72)) * w - hw;
        G.kind = wk; G.box(cx, h + 0.7, -0.5, 1.2, 1.5, 1.5, wall); G.kind = 2; G.box(cx, h + 1.72, -0.5, 1.45, 0.6, 1.75, slate, 0, 0.12);
        { const hh = Math.sin(x * 7.13 + z * 2.9 + cx * 51.7) * 43758.5453, hf = hh - Math.floor(hh); G.kind = hf < 0.6 ? 6.6 + hf / 0.6 * 0.8 : 9; }       // dormers have no shutters: their light shows all night
        G.quad([cx - 0.36, h + 0.45, 0.26], [cx + 0.36, h + 0.45, 0.26], [cx + 0.36, h + 1.3, 0.26], [cx - 0.36, h + 1.3, 0.26], GLASS);
      }
      if (detail >= 2) {
        GC.kind = 0;
        const n = rng.int(1, 3);
        for (let k = 0; k < n; k++) {
          const cx = rng.range(-hw + 0.8, hw - 0.8), nb = rng.int(2, 4); GC.pivot([cx, 0, 0.9], 3, 0, 0.22, rng.range(0, 6.28));
          const fc = rng.chance(0.75) ? FLOWER.slice(0, 3) : FLOWER.slice(3);
          for (let b = 0; b < nb; b++) blob(GC, cx + rng.range(-0.7, 0.7), rng.range(0.35, 0.95), rng.range(0.55, 1.2), rng.range(0.45, 0.8), fc, LEAF);
        }
      }
    }
    G.xf(0, 0, 0, 0); GC.xf(0, 0, 0, 0);
    // A gable end that stands free (the -x one in the house's own frame: west in a row, the side the boat arrives from; toward the
    // harbour on the house that closes the west side of the square) is dressed, not a blank slab: two shuttered windows that open
    // with the rest, an attic light, a drainpipe, a slate-roofed lean-to in granite (lean) and a hydrangea at its foot. No draw from
    // ctx.rng (the hero's own generator), so the village is the same with or without it.
    return (lean = true) => {
      G.xf(x, y0, z, yaw); GC.xf(x, y0, z, yaw);
      const gx = -hw, fy = Math.min(3.7, h - 2.35), wh2 = 1.4, dl = Math.min(0.78, delay0 + 0.12), sc = sh.clone().multiplyScalar(0.96), PIPE = C('#2a2c30');
      const qx = (g, ox, za, zb, ya, yb, c1, c2) => g.quad([gx - ox, ya, za], [gx - ox, ya, zb], [gx - ox, yb, zb], [gx - ox, yb, za], c1, c2);      // faces -x
      for (const zc of [-d * 0.28, -d * 0.72]) {
        G.kind = 0; qx(G, 0.03, zc - 0.63, zc + 0.63, fy - 0.14, fy + wh2 + 0.16, frame); G.box(gx - 0.1, fy - 0.1, zc, 0.24, 0.12, 1.34, frame);
        G.kind = zc < -d * 0.5 ? 7.1 : 9; qx(G, 0.06, zc - 0.47, zc + 0.47, fy, fy + wh2, GLASS);
        GC.kind = 0;
        GC.pivot([gx - 0.1, fy, zc + 0.49], 1, dl, 1, 0); qx(GC, 0.1, zc, zc + 0.49, fy - 0.03, fy + wh2 + 0.03, sc);
        GC.pivot([gx - 0.1, fy, zc - 0.49], 1, dl + 0.015, -1, 0); qx(GC, 0.1, zc - 0.49, zc, fy - 0.03, fy + wh2 + 0.03, sc);
      }
      if (hr - h > 2.4) { G.kind = 0; qx(G, 0.03, -d / 2 - 0.42, -d / 2 + 0.42, h + 0.35, h + 1.45, frame); G.kind = 9; qx(G, 0.06, -d / 2 - 0.3, -d / 2 + 0.3, h + 0.47, h + 1.33, GLASS); }
      G.kind = 0; G.beam([gx - 0.1, 0, -0.4], [gx - 0.1, h - 0.2, -0.4], 0.09, PIPE, 5); G.box(gx - 0.1, h - 0.14, -0.4, 0.26, 0.22, 0.26, PIPE);
      if (lean) {   // the lean-to against the back half of the gable
        const za = -d + 0.3, zb = -d * 0.52, zm = (za + zb) / 2, D = 1.7, lw = GRAN.clone().multiplyScalar(1.04), ls = SLATE.clone().multiplyScalar(0.95);
        G.kind = 1; G.box(gx - D / 2, 0.75, zm, D, 2.5, zb - za, lw.clone().multiplyScalar(0.9), 0, 1, lw);
        G.tri([gx, 2.0, zb], [gx, 2.78, zb], [gx - D, 2.0, zb], lw); G.tri([gx, 2.0, za], [gx - D, 2.0, za], [gx, 2.78, za], lw);
        G.kind = 2; G.quad([gx, 2.82, za - 0.2], [gx - D - 0.25, 1.94, za - 0.2], [gx - D - 0.25, 1.94, zb + 0.2], [gx, 2.82, zb + 0.2], ls, ls.clone().multiplyScalar(1.08));
        G.kind = 0; G.quad([gx - 1.3, 0, zb + 0.03], [gx - 0.45, 0, zb + 0.03], [gx - 0.45, 1.8, zb + 0.03], [gx - 1.3, 1.8, zb + 0.03], sh.clone().multiplyScalar(0.7), sh.clone().multiplyScalar(0.9));
        G.kind = 9; qx(G, D + 0.03, zm - 0.38, zm + 0.38, 0.95, 1.5, GLASS);
      }
      GC.kind = 0; GC.pivot([gx - 0.8, 0, -d * 0.24], 3, 0, 0.22, 1.7 + x);
      const fc = FLOWER.slice(0, 3);
      for (let b = 0; b < 4; b++) blob(GC, gx - 0.75 + (lr() - 0.5) * 0.7, 0.4 + 0.55 * lr(), -d * 0.24 + (b - 1.5) * 0.55 + (lr() - 0.5) * 0.3, 0.48 + 0.3 * lr(), fc, LEAF, lr);
      GC.pivot([0, 0, 0], 0, 0, 0, 0); G.kind = 0;
      G.xf(0, 0, 0, 0); GC.xf(0, 0, 0, 0);
    };
  };
  const row = async (x0, x1, zf, detail, bare = false) => {      // bare: the west gable of the first house stands free (it faces the square)
    let x = x0;
    while (x < x1 - 5.2) {
      let w = rng.range(6, 10.5); if (x1 - (x + w) < 5.2) w = x1 - x;
      const d = rng.range(7, 9.5), h = rng.pick([5.6, 5.8, 6.2, 8.4, 8.6, 8.9]);
      const dress = house(x + w / 2, zf + rng.range(-0.7, 0.7), rng.range(-0.035, 0.035), w - 0.04, d, h, detail, Math.abs(x + w / 2) / 115 * 0.55);
      if (bare && detail >= 2) dress();
      const gap = rng.chance(0.14) ? rng.range(2.4, 3.8) : 0;
      x += w + gap; bare = gap > 0;
      await ctx.yield();
    }
    return x;
  };
  const westEnd = await row(-113, -27, -11.5, 2); await row(27, 113, -11.5, 2, true);
  await row(-24, 24, -50, 2);
  // (where the west row stops short of the square, the first of these shows the harbour its gable end: dressed, with the lean-to when there is room)
  for (const zc of [-27, -35.4, -43.8]) { const dress = house(-26, zc, Math.PI / 2, 8.3, rng.range(7, 8.5), rng.pick([5.8, 8.5, 8.8]), 2, rng.range(0, 0.3)); if (zc === -27) dress(westEnd < -27.5); house(26, zc, -Math.PI / 2, 8.3, rng.range(7, 8.5), rng.pick([5.8, 8.5, 8.8]), 2, rng.range(0, 0.3)); }
  await ctx.yield();
  await row(-110, -36, -31.5, 1); await row(36, 110, -31.5, 1);
  await row(-104, -36, -51, 0); await row(36, 104, -51, 0);

  // ---- the square: calvary cross, stalls with pop-up awnings, bunting; the church behind -------------------------------------
  {
    const y0 = hillHeight(0, -24) + 0.02; G.xf(0, y0, -24, 0); G.kind = 1;
    G.prism(8, 2.3, 2.3, -0.5, 0.35, vcol(GRAN, 0.05), 0, 0, 1); G.prism(8, 1.65, 1.65, 0.35, 0.7, vcol(GRAN, 0.05), 0, 0, 1); G.prism(8, 1.0, 1.0, 0.7, 1.05, vcol(GRAN, 0.05), 0, 0, 1);
    G.prism(8, 0.26, 0.17, 1.05, 5.3, vcol(GRAN, 0.05, 1.05), 0, 0, 1); G.box(0, 4.45, 0, 1.5, 0.27, 0.27, vcol(GRAN, 0.05, 1.05)); G.prism(8, 0.36, 0.3, 1.05, 1.5, vcol(GRAN, 0.05), 0, 0, 1);
    G.xf(0, 0, 0, 0);
  }
  const AWN = [[RED, BLUE, C('#d9a327'), C('#2f7f5a'), C('#d06a2c')], [RED, BLUE, RED, C('#27508a'), C('#c9b98a')], [C('#d9a327'), C('#2f7f5a'), C('#d06a2c'), C('#e0b83a'), C('#3f8f6a')]][(opts.awning ?? 0) % 3], PRODUCE = [C('#d9762a'), C('#b8322a'), C('#5f8f2f'), C('#e0b83a'), C('#7a3f6a'), C('#c9c2a8')];
  const WOOD = C('#6b4a2c');
  const stall = (x, z, yaw, c1, delay) => {
    const y0 = hillHeight(x, z) + 0.04; G.xf(x, y0, z, yaw); GC.xf(x, y0, z, yaw);
    G.kind = 0; G.box(0, 0.45, 0, 2.9, 0.9, 1.3, vcol(WOOD, 0.12), 0, 1, vcol(C('#8a6a44'), 0.1));
    for (let i = 0; i < 4; i++) G.box(-1.05 + i * 0.7, 1.04, rng.range(-0.12, 0.12), 0.6, 0.28, 0.85, vcol(rng.pick(PRODUCE), 0.14));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.beam([sx * 1.6, 0, sz * 0.95], [sx * 1.6, sz > 0 ? 2.32 : 2.8, sz * 0.95], 0.08, WOOD);
    const ph = rng.range(0, 6.28), wht = vcol(WHITE, 0.03, 0.95); GC.kind = 0;
    for (let i = 0; i < 8; i++) {
      const xa = -1.84 + i * 0.46, xb = xa + 0.46, col = i % 2 ? wht : c1;
      GC.pivot([0, 1.5, 0], 2, delay, 0.3, ph); GC.quad([xa, 2.34, 1.3], [xb, 2.34, 1.3], [xb, 2.86, -1.1], [xa, 2.86, -1.1], col);
      GC.pivot([0, 1.5, 0], 2, delay, 1.0, ph); GC.quad([xa, 2.0, 1.33], [xb, 2.0, 1.33], [xb, 2.34, 1.3], [xa, 2.34, 1.3], col);
    }
    G.xf(0, 0, 0, 0); GC.xf(0, 0, 0, 0);
  };
  for (const sz of [-15.5, -24, -32.5, -41]) for (const sx of [-16.5, -8.2, 0, 8.2, 16.5]) {
    if (Math.abs(sx) < 5 && sz === -24) continue;
    if (!rng.chance(0.86)) continue;
    stall(sx + rng.range(-0.8, 0.8), sz + rng.range(-0.8, 0.8), rng.range(-0.12, 0.12) + (rng.chance(0.5) ? Math.PI : 0), vcol(rng.pick(AWN), 0.06), rng.range(0, 0.88));
  }
  await ctx.yield();
  for (const [bz, by] of [[-13.5, 21.2], [-22, 20.6], [-34, 21], [-45, 20.8]]) {       // bunting across the square
    let prev = null; const N = 22, ph = rng.range(0, 6);
    for (let k = 0; k <= N; k++) {
      const t = k / N, p = [-25.5 + 51 * t, by - 6.0 * t * (1 - t), bz + Math.sin(t * 3.1) * 0.8];
      if (prev) { G.kind = 0; G.beam(prev, p, 0.045, IRONB, 3); }
      if (k > 0 && k < N) { GC.kind = 0; GC.pivot(p, 3, 0, 0.9, ph + k * 0.7); GC.tri([p[0] - 0.3, p[1], p[2]], [p[0] + 0.3, p[1], p[2]], [p[0], p[1] - 0.68, p[2]], vcol([RED, WHITE, BLUE, AWN[2]][k % 4], 0.05)); }
      prev = p;
    }
  }
  {   // church: nave (a long slate roof) and a square tower with a slated spire
    house(-4, -66, 0, 11, 17, 7.5, 0, 0);
    const y0 = hillHeight(6, -70) - 0.2; G.xf(6.5, y0, -70, 0); G.kind = 1; const tc = vcol(GRAN, 0.04, 1.02);
    G.box(0, 4.6, 0, 4.8, 11.8, 4.8, tc, 0, 0.94, vcol(GRAN, 0.04, 1.1)); G.box(0, 10.7, 0, 5.0, 0.4, 5.0, tc);
    G.kind = 0; G.box(0, 8.6, 0, 4.72, 1.9, 1.0, C('#141618')); G.box(0, 8.6, 0, 1.0, 1.9, 4.72, C('#141618'));
    G.kind = 2; G.prism(4, 3.3, 0.9, 10.9, 14.2, vcol(SLATE, 0.05), 0, 0, 0, Math.PI / 4); G.prism(4, 0.9, 0.05, 14.2, 17.4, vcol(SLATE, 0.05, 1.05), 0, 0, 0, Math.PI / 4);
    G.kind = 0; G.beam([0, 17.3, 0], [0, 18.6, 0], 0.07, IRONB); G.beam([-0.35, 18.15, 0], [0.35, 18.15, 0], 0.07, IRONB);
    G.xf(0, 0, 0, 0);
  }
  await ctx.yield();

  // ---- the lighthouse on the east pier head -------------------------------------------------------------------------------
  const flip = rng.int(0, 1), bands = rng.pick([4, 5, 5, 6]), LAMP_Y = RIM + 17.3;
  {
    G.xf(LH[0], RIM, LH[1], 0);
    G.kind = 1; G.prism(14, 3.7, 3.45, -0.2, 1.0, vcol(GRAN, 0.04), 0, 0, 1);
    const rr = (y) => 2.75 - (y - 1) / 14 * 0.9, bh = 14 / bands;
    for (let b = 0; b < bands; b++) {
      const ya = 1 + b * bh, yb = ya + bh, red = (b % 2) === flip; G.kind = 3;
      G.prism(18, rr(ya), rr(yb), ya, yb, red ? vcol(RED, 0.03) : vcol(WHITE, 0.02, 0.96), 0, 0, 0, 0, red ? vcol(RED, 0.03, 0.92) : vcol(WHITE, 0.02, 0.9));
    }
    G.kind = 0; G.box(0, 2.05, -2.62, 1.05, 2.1, 0.3, vcol(BLUE, 0.05, 0.7)); G.box(0, 3.25, -2.6, 1.4, 0.2, 0.36, vcol(GRAN, 0.04));
    G.box(0, 7.6, -2.22, 0.55, 0.9, 0.3, GLASS); G.box(0, 11.4, 1.98, 0.5, 0.8, 0.3, GLASS); G.box(2.1, 9.5, 0, 0.3, 0.8, 0.5, GLASS);
    {   // seen close from the fairway and the gap (west and south-west): small windows in granite surrounds up the stair, a step and
        // a lamp bracket at the door, corbels under the gallery, a lightning conductor, a lifebuoy on its hook
      const GQ = GRAN.clone().multiplyScalar(1.12), GQ2 = GRAN.clone().multiplyScalar(0.92), at = (a, y, out) => [Math.sin(a) * (rr(y) + out), y, Math.cos(a) * (rr(y) + out)];
      for (const [a, y] of [[-1.35, 5.2], [-2.25, 8.6], [-0.75, 9.2], [-1.6, 12.4], [-2.75, 12.0], [-0.2, 6.2]]) {
        const pw = at(a, y, -0.1); G.kind = 1; G.box(pw[0], y, pw[2], 0.92, 1.3, 0.3, GQ2, a, 1, GQ); G.box(pw[0], y - 0.66, pw[2], 1.08, 0.12, 0.42, GQ, a);
        const pg = at(a, y, -0.02); G.kind = 9; G.box(pg[0], y, pg[2], 0.5, 0.86, 0.2, GLASS, a); G.kind = 0; G.box(pg[0], y, pg[2], 0.06, 0.86, 0.24, WHITE.clone().multiplyScalar(0.8), a); G.box(pg[0], y, pg[2], 0.5, 0.06, 0.24, WHITE.clone().multiplyScalar(0.8), a);
      }
      G.kind = 1; G.box(0, 0.98, -3.1, 1.7, 0.3, 0.9, GQ); G.box(0, 3.5, -2.66, 1.7, 0.3, 0.3, GQ);
      G.kind = 0; G.beam([0.75, 2.9, -2.6], [0.75, 3.1, -3.0], 0.05, IRONB, 4); G.kind = 5; G.prism(6, 0.09, 0.13, 2.72, 2.98, C('#ffcf8a').multiplyScalar(0.3), 0.75, -3.0, 3); G.kind = 0;
      for (let k = 0; k < 14; k++) { const a = (k + 0.5) / 14 * 6.2832; G.kind = 1; G.box(Math.sin(a) * 2.2, 14.05, Math.cos(a) * 2.2, 0.26, 0.75, 0.7, GQ2, a, 0.5, GQ); }
      G.kind = 0; { let prev = at(-1.0, 14.4, 0.04); for (let y = 13; y >= 1; y -= 2) { const cur = at(-1.0, y, 0.04); G.beam(prev, cur, 0.035, IRONB, 3); prev = cur; } }
      { const c = at(-1.75, 2.6, 0.1), a = -1.75; for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832, a1 = (k + 1) / 8 * 6.2832, q = (t) => [c[0] + Math.cos(a) * Math.sin(t) * 0.33, c[1] + Math.cos(t) * 0.33, c[2] - Math.sin(a) * Math.sin(t) * 0.33]; G.beam(q(a0), q(a1), 0.11, k % 2 ? C('#e9e4d6') : C('#d8442e'), 4); } }
    }
    G.prism(18, 1.9, 3.05, 14.55, 15.3, vcol(GRAN, 0.04, 0.8), 0, 0, 0); G.prism(18, 3.05, 3.05, 15.3, 15.5, IRONB, 0, 0, 1);
    for (let k = 0; k < 14; k++) {
      const a0 = k / 14 * 6.2832, a1 = (k + 1) / 14 * 6.2832, p0 = [Math.sin(a0) * 2.9, 15.5, Math.cos(a0) * 2.9], p1 = [Math.sin(a1) * 2.9, 15.5, Math.cos(a1) * 2.9];
      G.beam(p0, [p0[0], 16.55, p0[2]], 0.06, IRONB); G.beam([p0[0], 16.55, p0[2]], [p1[0], 16.55, p1[2]], 0.07, IRONB); G.beam([p0[0], 16.05, p0[2]], [p1[0], 16.05, p1[2]], 0.045, IRONB);
    }
    G.kind = 3; G.prism(12, 1.6, 1.6, 15.5, 16.35, vcol(WHITE, 0.02, 0.95), 0, 0, 0);
    G.kind = 0;
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832; G.beam([Math.sin(a) * 1.5, 16.35, Math.cos(a) * 1.5], [Math.sin(a) * 1.5, 18.35, Math.cos(a) * 1.5], 0.07, IRONB); }
    G.kind = 5; G.prism(8, 0.5, 0.62, 16.6, 17.3, C('#ffd58a'), 0, 0, 0); G.prism(8, 0.62, 0.5, 17.3, 18.0, C('#ffd58a'), 0, 0, 1);
    G.kind = 0; G.prism(12, 1.85, 1.3, 18.35, 19.05, vcol(RED, 0.03, 0.9), 0, 0, 2); G.prism(12, 1.3, 0.22, 19.05, 19.75, vcol(RED, 0.03), 0, 0, 0);
    G.prism(6, 0.2, 0.2, 19.75, 20.05, IRONB, 0, 0, 1); G.beam([0, 20, 0], [0, 21, 0], 0.06, IRONB); G.tri([0, 20.9, 0], [0.75, 20.72, 0], [0, 20.55, 0], IRONB); G.tri([0, 20.9, 0], [0, 20.55, 0], [0.75, 20.72, 0], IRONB);
    G.xf(0, 0, 0, 0);
  }
  U.uLH.value.set(LH[0], LH[1], 14 / bands, flip);
  {
    const BK = C('#1d1f22'), by = reefHeight(68.6, 209) - 0.7; G.xf(68.6, by, 209, 0.3); G.kind = 3;
    G.prism(10, 1.45, 1.2, 0, 2.7, vcol(BK, 0.04), 0, 0, 0); G.prism(10, 1.2, 0.95, 2.7, 5.4, vcol(C('#e2b52e'), 0.04), 0, 0, 1);
    G.kind = 0; G.beam([0, 5.4, 0], [0, 6.75, 0], 0.1, BK, 5); G.prism(6, 0.05, 0.42, 5.55, 6.1, BK, 0, 0, 2); G.prism(6, 0.05, 0.42, 6.2, 6.75, BK, 0, 0, 2);
    const dy2 = reefHeight(63, 161.4) - 0.6; G.xf(63, dy2, 161.4, 0.6); G.kind = 3;
    G.prism(4, 1.5, 0.6, 0, 4.6, vcol(WHITE, 0.03, 0.88), 0, 0, 1, Math.PI / 4, vcol(WHITE, 0.03, 0.96)); G.kind = 0; G.prism(4, 0.62, 0.05, 4.6, 5.5, vcol(BK, 0.04), 0, 0, 0, Math.PI / 4);
    G.xf(0, 0, 0, 0);
  }
  {
    const ROCK = [C('#8b8683'), C('#9c958f'), C('#807c7b')];
    const slab = (x, z, r, top, ph) => { G.kind = 10; G.prism(7, r * 1.25, r, 10.6, top, ROCK[0], x, z, 1, ph, ROCK[1]); G.prism(6, r * 0.62, r * 0.45, top - 0.5, top + 0.42, ROCK[2], x + r * 0.42, z - r * 0.3, 1, ph + 0.7, ROCK[1]); G.kind = 0; };
    slab(23.4, 164.2, 1.9, 12.82, 0.3); slab(25.2, 170.6, 1.5, 12.9, 1.9);
    const sealAt = (x, y, z, yaw, sc, ph, back, belly) => {
      GC.xf(x, y, z, yaw); GC.kind = 0; GC.pivot([-0.7 * sc, 0, 0], 3, 0, 0.1, ph);
      const R = [[-0.98, 0.06, 0.04], [-0.66, 0.12, 0.15], [-0.25, 0.2, 0.27], [0.22, 0.21, 0.26], [0.58, 0.25, 0.18], [0.82, 0.37, 0.125], [0.99, 0.4, 0.05]];
      const P = (i, j) => { const a = j / 6 * 6.2832; return [R[i][0] * sc, (R[i][1] + R[i][2] * Math.cos(a) * 0.78) * sc, R[i][2] * Math.sin(a) * 1.18 * sc]; };
      for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < 6; j++) { const up = Math.cos((j + 0.5) / 6 * 6.2832), c = belly.clone().lerp(back, 0.5 + 0.5 * up).multiplyScalar(0.9 + 0.2 * Math.sin(i * 2.3 + j)); GC.quad(P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j), c); }
      for (const sd of [-1, 1]) { GC.tri([0.3 * sc, 0.12 * sc, sd * 0.26 * sc], [0.1 * sc, 0.02, sd * 0.5 * sc], [0.42 * sc, 0.02, sd * 0.36 * sc], back); GC.tri([-0.95 * sc, 0.08 * sc, 0], [-1.25 * sc, 0.05, sd * 0.2 * sc], [-1.18 * sc, 0.12 * sc, sd * 0.03], back); }
      GC.pivot([0, 0, 0], 0, 0, 0, 0); GC.xf(0, 0, 0, 0);
    };
    const cormAt = (x, y, z, yaw, ph, spread) => {
      GC.xf(x, y, z, yaw); GC.kind = 0; GC.pivot([0, 0.2, 0], 3, 0, spread ? 0.5 : 0.14, ph);
      const K1 = C('#15181a'), K2 = C('#2a3030'), YL = C('#c9a23a');
      GC.box(0, 0.3, 0, 0.17, 0.46, 0.2, K1, 0, 0.7, K2); GC.beam([0.02, 0.5, 0], [0.07, 0.75, 0], 0.07, K2, 4);
      GC.box(0.1, 0.78, 0, 0.14, 0.07, 0.07, K1); GC.beam([0.16, 0.78, 0], [0.28, 0.8, 0], 0.03, YL, 3); GC.box(-0.11, 0.1, 0, 0.22, 0.05, 0.1, K1);
      if (spread) for (const sd of [-1, 1]) { GC.tri([0, 0.5, sd * 0.08], [-0.05, 0.4, sd * 0.64], [0, 0.2, sd * 0.1], K2, K1, K1); GC.tri([0, 0.5, sd * 0.08], [-0.02, 0.56, sd * 0.46], [-0.05, 0.4, sd * 0.64], K2); }
      GC.pivot([0, 0, 0], 0, 0, 0, 0); GC.xf(0, 0, 0, 0);
    };
    const SB = C('#4d4f50'), SL = C('#8f8878'), SB2 = C('#6a5f52'), SL2 = C('#b3a890');
    sealAt(22.9, 12.82, 164.9, 0.5, 1.0, 0.4, SB, SL); sealAt(23.2, 12.82, 163.5, 2.5, 0.82, 2.2, SB2, SL2); sealAt(24.3, 12.82, 164.6, -1.1, 0.7, 4.1, SB, SL2);
    cormAt(24.2, 13.24, 163.6, 2.2, 1.1, true); cormAt(25.9, 13.32, 170.1, 2.6, 3.0, true); cormAt(24.6, 12.9, 171.2, 1.4, 5.2, false); cormAt(25.1, 12.9, 169.7, 3.3, 0.7, false);
    for (const ga of [-1.9, -1.15, -2.75, 0.4]) gullAt(LH[0] + Math.sin(ga) * 3.2, RIM + 1.0, LH[1] + Math.cos(ga) * 3.2, ga + 1.2, ga * 3.1);      // on the plinth of the lighthouse
  }
  let beam, lens;
  {
    // the optic: four bull's-eyes turning with the beams. Each is a pane that brightens as it comes to face the eye, so by day the
    // lamp is seen to turn: a soft flash every two seconds from wherever the lighthouse is in view
    const P = [], UV = [], NB = [], R = 1.95;
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2, nx = Math.sin(a), nz = Math.cos(a), tx = Math.cos(a), tz = -Math.sin(a), q = (u, v) => [nx * R + tx * u * 1.5, v * 1.5, nz * R + tz * u * 1.5];
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { P.push(...q(u, v)); UV.push(u, v); NB.push(nx, 0, nz); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aN', new THREE.Float32BufferAttribute(NB, 3));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: U,
      vertexShader: 'attribute vec2 aA; attribute vec3 aN; varying vec2 vA; varying float vF; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.); vF = max(dot(normalize(normalMatrix * aN), normalize(-mv.xyz + vec3(0., 0., 1e-4))), 0.); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uBeamCol; uniform float uLensI; varying vec2 vA; varying float vF; void main(){ float d = dot(vA, vA), f2 = vF * vF, f8 = f2 * f2 * f2 * f2, fl = f8 * f8; float disc = exp(-d * 9.) * 1.6 + exp(-d * 2.2) * .28 + exp(-vA.y * vA.y * 90.) * exp(-abs(vA.x) * 2.6) * .5; gl_FragColor = vec4(uBeamCol * (uLensI * fl * disc * (1. - smoothstep(.7, 1., d))), 1.); }',
    });
    lens = new THREE.Mesh(g, m); lens.position.set(LH[0], RIM + 17.3, LH[1]); lens.frustumCulled = false; lens.renderOrder = 3; lens.name = 'lamp-optic'; group.add(lens);
  }
  {
    const P = [], A = [], NB = [];
    const q = (a, b, c, d, n) => { P.push(...a, ...b, ...c, ...a, ...c, ...d); A.push(1, -1, 0, -1, 0, 1, 1, -1, 0, 1, 1, 1); for (let k = 0; k < 6; k++) NB.push(n[0], n[1], n[2]); };
    for (const s of [-1, 1]) { q([s * 2, 0, -1.1], [s * 130, 0, -8], [s * 130, 0, 8], [s * 2, 0, 1.1], [0, 1, 0]); q([s * 2, -1.1, 0], [s * 130, -8, 0], [s * 130, 8, 0], [s * 2, 1.1, 0], [0, 0, 1]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 2)); g.setAttribute('aN', new THREE.Float32BufferAttribute(NB, 3));
    beam = new THREE.Mesh(g, makeBeamMat(U)); beam.position.set(LH[0], LAMP_Y, LH[1]); beam.frustumCulled = false; beam.renderOrder = 3; beam.name = 'lamp-beams'; group.add(beam);
  }
  await ctx.yield();

  // ---- the journey line (anchors) and what must stay clear of it ----------------------------------------------------------
  const BERTH = opts.berth || [-66, 40], berthYaw = opts.berthYaw ?? 2.2;       // the blue boat: bow toward the wall and along it
  const eye0 = sandHeight(BERTH[0], BERTH[1]) + 2.6, HI = TIDE_HIGH + 2.6;
  const fly = opts.fly || [[BERTH[0], eye0, BERTH[1]], [-50, eye0 + 0.3, 29], [-34, 8, 20], [-18, HI, 17], [-4, HI + 0.4, 25], [5, HI + 1.0, 44], [8, HI + 2.4, 68], [8, TIDE_HIGH + 7.5, 96], [8, TIDE_HIGH + 7.5, 152]];
  const flyDist = (x, z) => { let m = 1e9; for (let i = 0; i < fly.length - 1; i++) { const a = fly[i], b = fly[i + 1], dx = b[0] - a[0], dz = b[2] - a[2]; const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[2]) * dz) / (dx * dx + dz * dz))); m = Math.min(m, Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t)); } return m; };

  // oyster tables on the flats (a keep-out for boats and buoys) and the posts the world asks for beside its line:
  // [x, z, type] 0 = a timber mooring pile the tide climbs, 1 = a red can perch, 2 = a green cone perch
  const RACK = opts.oysters === false ? null : { x0: -38, x1: -3, z0: 46, z1: 86 };
  const inRacks = (x, z, m = 0) => !!RACK && x > RACK.x0 - m && x < RACK.x1 + m && z > RACK.z0 - m && z < RACK.z1 + m;
  const posts = opts.posts || [];
  // the tractors' way off the flats: along the near edge of the tables, across the sand to the west slip and up it, onto the quay
  const TWAY = [[0, 42.6], [-36, 42.6], [-50, 56], [-70, 80], [-88, 91.5], [-94.5, 89], [-94.5, 86], [-94.5, 3], [-91.5, -3.2], [-84, -5.2], [-58, -5.2]];
  const nearWay = (x, z, m) => { if (!RACK) return false; for (let i = 0; i < 4; i++) { const a = TWAY[i], b = TWAY[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); if (Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) < m) return true; } return false; };
  const PT = RIM - 0.3;
  for (let pi = 0; pi < posts.length; pi++) {
    const type = posts[pi][2], px = posts[pi][0], pz = posts[pi][1];
    const y0 = sandHeight(px, pz) - 1.2, TIMBER = vcol(C('#a39683'), 0.08), TIMBD = vcol(C('#7d6f5c'), 0.1), pyaw = rng.range(0, 3);
    G.xf(px, 0, pz, pyaw); G.kind = 0.1;
    if (!type) {
      // (the top stands 1.7 m over high water, under the eye by then: a pile frames the wall on the way up and never bars the whole height of the picture)
      G.prism(8, 0.27, 0.22, y0, PT, TIMBD, 0, 0, 1, 0, TIMBER); G.prism(8, 0.25, 0.25, PT - 0.3, PT - 0.13, IRONB, 0, 0, 1);
      for (const ry of [5.2, 9.4, 12.6]) { G.prism(8, 0.29, 0.29, ry, ry + 0.16, vcol(RUST, 0.2), 0, 0, 0); G.beam([0.27, ry + 0.08, 0], [0.5, ry - 0.22, 0], 0.045, vcol(RUST, 0.2)); }
      G.kind = 0; G.prism(8, 0.3, 0.27, PT, PT + 0.06, vcol(WHITE, 0.04, 0.8), 0, 0, 1);
      // a few turns of old warp below the head, a tyre on its lanyard, a gull on top
      for (let r = 0; r < 4; r++) G.prism(8, 0.285, 0.285, PT - 0.62 - r * 0.075, PT - 0.555 - r * 0.075, C(r % 2 ? '#b8a070' : '#9c865a'), 0, 0, 0);
      G.beam([0.3, PT - 0.5, 0], [0.36, PT - 1.1, 0], 0.035, C('#b8a070'), 3); tyreAt(G, 0.42, PT - 1.42, 0, 0.3);
      gullAt(px, PT + 0.06, pz, pyaw + 1.3 + pi, pi * 1.9);
      G.xf(px, 0, pz, pyaw); G.kind = 0.1;
    } else {
      // weed and barnacles to the high-water line, bands of paint above it, a cage top-mark of thin bars (a can for red, a cone for green)
      const top = RIM + 3.6, red = type === 1, tc = red ? vcol(RED, 0.04) : vcol(C('#2f7f4a'), 0.05), wc = vcol(WHITE, 0.03, 0.92), Y0 = TIDE_HIGH - 0.3, BH = (top - Y0) / 5;
      G.prism(6, 0.18, 0.15, y0, Y0, TIMBD, 0, 0, 0, 0, TIMBER); G.kind = 0;
      for (let b = 0; b < 5; b++) G.prism(6, 0.15 - b * 0.006, 0.144 - b * 0.006, Y0 + b * BH, Y0 + (b + 1) * BH, b % 2 ? wc : tc, 0, 0, b === 4 ? 1 : 0);
      const y1 = top + 0.12, y2 = top + 1.1, r1 = 0.4, r2 = red ? 0.4 : 0.05;
      for (let k = 0; k < 8; k++) {
        const a0 = k / 8 * 6.2832, a1 = (k + 1) / 8 * 6.2832, P0 = [Math.sin(a0) * r1, y1, Math.cos(a0) * r1], P1 = [Math.sin(a1) * r1, y1, Math.cos(a1) * r1], Q0 = [Math.sin(a0) * r2, y2, Math.cos(a0) * r2], Q1 = [Math.sin(a1) * r2, y2, Math.cos(a1) * r2];
        G.beam(P0, Q0, 0.045, tc, 3); G.beam(P0, P1, 0.045, tc, 3); if (red) G.beam(Q0, Q1, 0.045, tc, 3);
        if (k % 2 === 0) G.beam([0, y1, 0], P0, 0.035, tc, 3);
      }
      G.beam([0, top, 0], [0, y2 + 0.3, 0], 0.06, IRONB, 4);
    }
    G.xf(0, 0, 0, 0);
  }
  // lobster pots: a scatter round the berth, stacks on the quay
  // the D-section pot: a wooden base, a half-round of net over three pale hoops, a twine ring at the entrance; with `gear`
  // a coil of rope and a small float lie beside it
  const POTC = [C('#d9742a'), C('#3f78b8'), C('#d9c23a')];
  const pot = (x, y, z, yaw, gear = false, rnd = null) => {
    G.xf(x, y, z, yaw); G.kind = 0;
    const net = rnd ? C('#3f6660').multiplyScalar(0.8 + 0.4 * rnd()) : vcol(C('#3f6660'), 0.2), netL = net.clone().multiplyScalar(1.6), netD = net.clone().multiplyScalar(0.6), tw = rnd ? POTC[Math.floor(rnd() * 3) % 3].clone().multiplyScalar(0.9 + 0.2 * rnd()) : vcol(rng.pick(POTC), 0.1), hoop = C('#b3a27c');
    const h = 0.49, R = 0.31, N = 6, P = (k, r = R) => { const a = k / N * Math.PI; return [0.05 + Math.sin(a) * r * 1.12, Math.cos(a) * r]; };      // [y, z] round the D
    const lit = (m) => netD.clone().lerp(netL, 0.2 + 0.8 * Math.sin(m / N * Math.PI));
    G.box(0, 0.025, 0, 1.02, 0.05, 0.66, C('#8a7a5c'));
    for (let k = 0; k < N; k++) {
      const [y0, z0] = P(k), [y1, z1] = P(k + 1), [a0, b0] = P(k, R + 0.014), [a1, b1] = P(k + 1, R + 0.014);
      G.quad([-h, y0, z0], [h, y0, z0], [h, y1, z1], [-h, y1, z1], lit(k), lit(k + 1));
      G.tri([h, 0.05, 0], [h, y1, z1], [h, y0, z0], netD); G.tri([-h, 0.05, 0], [-h, y0, z0], [-h, y1, z1], netD);
      for (const hx of [-0.455, 0, 0.455]) G.quad([hx - 0.035, a0, b0], [hx + 0.035, a0, b0], [hx + 0.035, a1, b1], [hx - 0.035, a1, b1], hoop);
    }
    G.box(h + 0.012, 0.22, 0, 0.02, 0.2, 0.2, tw); G.box(0, 0.05 + R * 1.12 + 0.02, 0, 0.5, 0.03, 0.07, tw);
    if (gear) {
      G.prism(8, 0.25, 0.2, 0, 0.08, C('#b8a070'), 0.18, 0.66, 1, 0, C('#96825a')); G.prism(8, 0.1, 0.1, 0.08, 0.085, C('#3a3026'), 0.18, 0.66, 1);
      G.prism(6, 0.05, 0.13, 0, 0.14, tw, -0.34, 0.6, 0); G.prism(6, 0.13, 0.04, 0.14, 0.3, tw, -0.34, 0.6, 1);
    }
    G.xf(0, 0, 0, 0);
  };
  // (in the forward sector of the berth, where the opening view looks; a = angle off the bow, positive to starboard)
  const BD = opts.berthDir || [Math.sin(berthYaw), Math.cos(berthYaw)], sector = (a, r) => { const c = Math.cos(a), sn = Math.sin(a); return [BERTH[0] + (BD[0] * c - BD[1] * sn) * r, BERTH[1] + (BD[1] * c + BD[0] * sn) * r]; };
  for (let i = 0; i < 26; i++) {
    const a = (rng.range(0, 6.28) / 6.28 - 0.5) * 2.1, r = rng.range(2.8, 13) + 0.2, [x, z] = sector(a, r);
    if (flyDist(x, z) < 2.6) continue;
    pot(x, sandHeight(x, z) - 0.04, z, rng.range(0, 3.14), i % 3 === 0);
    if (i % 3 === 2) await ctx.yield();
  }
  await ctx.yield();
  // a few always lie just off the bow, either side of the line, so that a tall narrow screen has them too
  for (const [a, r, yw] of [[-0.3, 9.6, 0.4], [0.31, 10.4, 2.1], [-0.22, 13.4, 1.2], [0.2, 15, 2.7], [0.37, 8.2, 0.9], [-0.42, 7.1, 1.9]]) { const [x, z] = sector(a, r); if (flyDist(x, z) >= 2.6) pot(x, sandHeight(x, z) - 0.04, z, yw, r > 10); }
  await ctx.yield();
  // a second scatter further down the line, either side of it, so the floor ahead is never bare while it is still dry
  for (const [a, r, yw] of [[-0.3, 17.5, 1.1], [0.2, 19, 2.4], [-0.17, 22, 0.3], [0.27, 23.5, 1.7], [-0.36, 14.5, 2.9], [0.4, 16, 0.6], [-0.23, 26.5, 2.0], [0.17, 28, 1.3], [0.33, 31, 0.2]]) { const [x, z] = sector(a, r); if (flyDist(x, z) >= 2.8) pot(x, sandHeight(x, z) - 0.04, z, yw, r > 20, lr); if (r > 20) await ctx.yield(); }
  {   // what may lie on our own line because it is flat: the anchor warp run out over the sand from under the stem to a small
      // anchor, and wrack left by the last tide (a tall screen looks down on them)
    const ROPEC = C('#b8a070'), RUSTD = C('#5a3420'); let prev = null; G.kind = 0;
    for (let k = 0; k <= 18; k++) { const [x, z] = sector(0.045 * Math.sin(k * 0.55), 4.9 + k * 0.49), cur = [x, sandHeight(x, z) + 0.04, z]; if (prev) G.beam(prev, cur, 0.055, ROPEC, 4); prev = cur; }
    const ah = (a, r) => { const [x, z] = sector(a, r); return [x, sandHeight(x, z) + 0.07, z]; };
    G.beam(ah(0.024, 13.7), ah(0.03, 14.75), 0.08, RUSTD, 5); G.beam(ah(0.004, 13.8), ah(0.046, 13.86), 0.06, RUSTD, 4);
    G.beam(ah(0.03, 14.75), ah(0.062, 14.42), 0.09, RUSTD, 4); G.beam(ah(0.03, 14.75), ah(-0.004, 14.4), 0.09, RUSTD, 4);
    G.kind = 0;
    for (const [a, r, rr] of [[-0.17, 3.5, 0.5], [0.13, 4.5, 0.42], [-0.08, 5.9, 0.55], [0.19, 6.8, 0.4], [-0.21, 8.6, 0.6], [0.1, 9.4, 0.45], [-0.12, 11.6, 0.5]]) {
      const [x, z] = sector(a, r), y = sandHeight(x, z);
      G.prism(7, rr, rr * 0.62, y - 0.03, y + 0.06, C('#2c2a14'), x, z, 1, a * 9, C('#4f4a22')); G.prism(5, rr * 0.5, rr * 0.3, y - 0.02, y + 0.08, C('#3f3a16'), x + rr * 0.6, z - rr * 0.3, 1, r, C('#6a5c28'));
    }
  }
  await ctx.yield();
  for (let s = 0; s < 6; s++) {
    const x = rng.range(-95, 95), z = rng.range(-7.5, -3); if (Math.abs(x) < 2) continue;
    await ctx.yield();
    for (let k = 0; k < rng.int(3, 7); k++) pot(x + (k % 3) * 1.05, RIM + 0.03 + Math.floor(k / 3) * 0.47, z + rng.range(-0.1, 0.1), rng.range(-0.1, 0.1));
  }
  await ctx.yield();
  // ---- the quay edge and the top of its face, dressed for the run along it (all from qr: ctx.rng is left alone) -------------
  {
    const ROPEC = C('#b8a070'), NETC = [C('#2f6f78'), C('#27595f'), C('#3a8088'), C('#1f4a52')], BOXC = [C('#d9742a'), C('#e9e4d6'), C('#3f78b8'), C('#d9c23a'), C('#2f7f5a')], FLOAT = [C('#e0621f'), C('#e8c62a'), C('#f0f0e8')];
    const clearOf = (x, m) => !ladderXs.some((l) => Math.abs(l - x) < m) && Math.abs(x + 5.5) > m && !(x > 59 && x < 70);
    // iron stanchions with a chain slung between them along the whole edge (broken at ladders, stair and slip)
    G.kind = 0;
    for (let x = -87; x < 95; x += 3) {
      if (!clearOf(x, 1.3)) continue;
      G.beam([x, RIM, -0.5], [x, RIM + 0.92, -0.5], 0.07, IRONB, 5); G.prism(6, 0.075, 0.03, RIM + 0.92, RIM + 1.02, IRONB, x, -0.5, 1);
      if (!clearOf(x + 3, 1.3) || x + 3 >= 95) continue;
      let prev = [x, RIM + 0.86, -0.5];
      for (let k = 1; k <= 5; k++) { const t = k / 5, cur = [x + 3 * t, RIM + 0.86 - 1.1 * t * (1 - t), -0.5]; G.beam(prev, cur, 0.045, k % 2 ? IRON : RUST, 3); prev = cur; }
    }
    await ctx.yield();
    // a second ladder by the square, mooring rings in the top courses with a chain looped from ring to ring, tyres on lanyards
    G.kind = 0.1;
    { const lx = -5.5;
      for (const sd of [-0.26, 0.26]) { G.beam([lx + sd, sandHeight(lx, 2) - 0.3, wallZ(0) + 0.3], [lx + sd, RIM + 0.1, 0.3], 0.11, RUST, 4, IRON); G.beam([lx + sd, RIM + 0.1, 0.3], [lx + sd, RIM + 1.05, 0.05], 0.09, IRON); G.beam([lx + sd, RIM + 1.05, 0.05], [lx + sd, RIM + 1.0, -0.7], 0.09, IRON); G.beam([lx + sd, RIM + 1.0, -0.7], [lx + sd, RIM, -0.75], 0.09, IRON); }
      for (let y = 0.5; y < RIM; y += 0.36) { const z = wallZ(y) + 0.3 * (1 - y / 30); G.beam([lx - 0.26, y, z], [lx + 0.26, y, z], 0.085, y < 9 ? RUST : IRON); } }
    const ringXs = []; for (let x = -84; x < 16; x += 5.2 + 2.2 * qr()) if (clearOf(x, 1.6)) ringXs.push(x);
    for (let i = 0; i < ringXs.length; i++) {
      const rx = ringXs[i], ry = 12.95 + 0.25 * qr(), wz = wallZ(ry), RR = 0.24;
      G.kind = 0.1; G.beam([rx, ry + RR, wz - 0.02], [rx, ry + RR, wz + 0.16], 0.09, IRON);
      for (let k = 0; k < 6; k++) { const a0 = k / 6 * 6.2832, a1 = (k + 1) / 6 * 6.2832; G.beam([rx + Math.sin(a0) * RR, ry + Math.cos(a0) * RR, wz + 0.13], [rx + Math.sin(a1) * RR, ry + Math.cos(a1) * RR, wz + 0.13], 0.07, k % 2 ? IRON : RUST); }
      G.kind = 0; G.quad([rx - 0.05, ry - 1.9, wallZ(ry - 1.9) + 0.012], [rx + 0.07, ry - 1.9, wallZ(ry - 1.9) + 0.012], [rx + 0.14, ry - 0.2, wz + 0.012], [rx - 0.13, ry - 0.2, wz + 0.012], mixc(C('#6b3d22'), GRAN, 0.8), C('#6b3d22'));
      const nx = ringXs[i + 1], pick = qr();
      if (nx !== undefined && nx - rx < 8 && pick < 0.55) {       // a chain looped to the next ring
        G.kind = 0.1; let prev = [rx, ry - RR, wz + 0.14]; const n2 = 9, ry2 = ry, sag = 0.7 + 0.5 * qr();
        for (let k = 1; k <= n2; k++) { const t = k / n2, y = ry2 - RR - sag * 4 * t * (1 - t), cur = [rx + (nx - rx) * t, y, wallZ(y) + 0.14]; G.beam(prev, cur, k % 2 ? 0.08 : 0.11, k % 3 ? IRON : RUST); prev = cur; }
      } else if (pick > 0.5) {                                    // or a tyre hung from it
        G.kind = 0; const ty = ry - 0.75 - 0.3 * qr(); G.beam([rx, ry - RR, wz + 0.14], [rx, ty + 0.3, wallZ(ty) + 0.2], 0.035, ROPEC, 3); tyreAt(G, rx, ty, wallZ(ty) + 0.2, 0.33);
      }
      if (i % 6 === 5) await ctx.yield();
    }
    await ctx.yield();
    // what the boats have landed, between the bollards from the last house of the west row to the first of the east one:
    // pots in stacks, fish boxes, coiled warps, heaps of net with their floats, nets hung over the edge to dry, and gulls on the coping
    const fishBoxes = (x, z, n) => {
      G.kind = 0;
      for (let k = 0; k < n; k++) {
        const col = Math.floor(k / 3), lv = k % 3, c = BOXC[Math.floor(qr() * BOXC.length) % BOXC.length], bx = x + col * 0.86 + (qr() - 0.5) * 0.06, bz = z + (qr() - 0.5) * 0.08, yw = (qr() - 0.5) * 0.16;
        G.box(bx, RIM + 0.03 + 0.14 + lv * 0.285, bz, 0.78, 0.28, 0.5, c.clone().multiplyScalar(0.82), yw, 1.06, c);
        if (lv === 2 || k === n - 1) G.box(bx, RIM + 0.03 + 0.275 + lv * 0.285, bz, 0.66, 0.02, 0.38, qr() < 0.5 ? C('#aeb9bd') : C('#3a2a20'), yw);      // ice and fish, or empty
      }
    };
    const netHeap = (x, z, s) => {
      G.kind = 0;
      const c = NETC[Math.floor(qr() * 4) % 4];
      G.box(x, RIM + 0.03 + 0.2 * s, z, 1.7 * s, 0.4 * s, 1.2 * s, c.clone().multiplyScalar(0.7), qr() * 3, 0.5, c.clone().multiplyScalar(1.25));
      G.box(x + 0.5 * s, RIM + 0.03 + 0.12 * s, z + 0.5 * s, 1.1 * s, 0.24 * s, 0.9 * s, c.clone().multiplyScalar(0.6), qr() * 3, 0.55, c);
      for (let k = 0; k < 7; k++) { const a = qr() * 6.28, r = (0.2 + 0.6 * qr()) * s; G.prism(5, 0.09, 0.07, RIM + 0.2 * s + 0.1 * qr(), RIM + 0.34 * s + 0.1 * qr(), FLOAT[k % 3], x + Math.cos(a) * r, z + Math.sin(a) * r * 0.7, 1); }
    };
    const coil = (x, z) => { G.kind = 0; for (let r = 0; r < 3; r++) G.prism(9, 0.42 - r * 0.06, 0.39 - r * 0.06, RIM + 0.03 + r * 0.08, RIM + 0.11 + r * 0.08, r % 2 ? C('#c2aa78') : ROPEC, x, z, 1, r * 0.4); };
    const hungNet = (x0, w) => {          // a net over the chain and down the face: cloth, so it stirs; a row of floats along its foot
      GC.kind = 0; const n = Math.round(w / 0.42), c0 = NETC[Math.floor(qr() * 4) % 4], ph = qr() * 6.28;
      for (let k = 0; k < n; k++) {
        const xa = x0 + k * w / n, xb = xa + w / n, c = c0.clone().multiplyScalar(0.75 + 0.5 * qr()), len = 1.7 + 0.5 * Math.sin(k * 0.9 + ph), yb = RIM + 0.3 - len;
        GC.pivot([xa, RIM + 0.62, -0.5], 3, 0, 0.16, ph + k * 0.5);
        GC.quad([xa, RIM + 0.62, -0.52], [xb, RIM + 0.62, -0.52], [xb, RIM + 0.3, 0.5], [xa, RIM + 0.3, 0.5], c.clone().multiplyScalar(1.2), c);
        GC.quad([xa, RIM + 0.3, 0.5], [xb, RIM + 0.3, 0.5], [xb, yb, wallZ(yb) + 0.12], [xa, yb, wallZ(yb) + 0.12], c, c.clone().multiplyScalar(0.7));
        if (k % 2 === 0) GC.box((xa + xb) / 2, yb, wallZ(yb) + 0.16, 0.13, 0.13, 0.13, FLOAT[(k / 2) % 3]);
      }
      GC.pivot([0, 0, 0], 0, 0, 0, 0);
    };
    const xs = [-25.2, -21.3, -17.2, -15.7, -8.6, -3.2, 1.6, 5.6, 9.4, 11.9];
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i] + (qr() - 0.5) * 0.8, z = -1.9 - 0.9 * qr(), kind = i % 5;
      if (kind === 0) { const n = 5 + Math.floor(qr() * 4); for (let k = 0; k < n; k++) pot(x + (k % 3) * 1.05, RIM + 0.03 + Math.floor(k / 3) * 0.47, z + (qr() - 0.5) * 0.14, (qr() - 0.5) * 0.2, false, qr); coil(x - 0.9, z + 0.3); }
      else if (kind === 1) { fishBoxes(x, z, 5 + Math.floor(qr() * 4)); fishBoxes(x + 0.3, z - 0.7, 3); }
      else if (kind === 2) { netHeap(x, z, 1 + 0.25 * qr()); coil(x + 1.6, z + 0.2); }
      else if (kind === 3) { fishBoxes(x, z, 4 + Math.floor(qr() * 3)); pot(x + 2.1, RIM + 0.03, z, 0.4, true, qr); }
      else { for (let k = 0; k < 4; k++) pot(x + (k % 2) * 1.05, RIM + 0.03 + Math.floor(k / 2) * 0.47, z, (qr() - 0.5) * 0.2, false, qr); netHeap(x + 2.6, z - 0.2, 0.9); }
      await ctx.yield();
    }
    hungNet(-18.9, 2.5); hungNet(2.9, 2.1); hungNet(-44.5, 2.3); hungNet(-66.2, 2.0);
    for (const [gx, gph] of [[-23.1, 0.3], [-11.4, 2.1], [-6.9, 4.4], [0.6, 1.2], [11.2, 5.0], [-31.5, 3.3], [-52.5, 0.9]]) gullAt(gx, RIM + 0.09, 0.05, gph * 1.3, gph);
    G.kind = 0; G.xf(0, 0, 0, 0);
  }
  await ctx.yield();

  // ---- boats: one hull, forty instances; they right themselves and float in the vertex shader ---------------------------------
  const boatGeo = (() => {
    const B = new GW(), L = 7.2, NS = 14, NG = 7;
    const W = C('#f2efe6'), ANTI = C('#6e2f25'), DECK = C('#b9a886'), CAB = C('#ece6d6'), DARK = C('#1c2228'), WD = C('#7a5a36'), PALE = C('#d8d2c2'), WIRE = C('#2a2c30');
    const hb = (t) => Math.max(0.03, 1.28 * (0.76 + 0.24 * sstep(0, 0.4, t)) * (1 - Math.pow(sstep(0.42, 1, t), 2.1)));
    const ky = (t) => 0.55 * Math.pow(Math.max(0, (t - 0.72) / 0.28), 2) + 0.1 * (1 - sstep(0, 0.14, t));
    const sy = (t) => 1.2 + 0.72 * Math.pow(t, 2.2) + 0.1 * (1 - t) * (1 - t);
    const pt = (i, j, sd) => { const t = i / NS, q = j / NG, k = ky(t); return [sd * hb(t) * Math.pow(Math.sin(q * Math.PI / 2), 0.72), k + (sy(t) - k) * Math.pow(1 - Math.cos(q * Math.PI / 2), 0.85), -L / 2 + L * t]; };
    // seven strakes a side, each lighter at its upper edge and darker at its lower (the laps of the planking, not facets):
    // antifouling below the waterline, three strakes in the boat's own colour, a white sheer strake
    const strake = (j) => (j < 3 ? [ANTI.clone().multiplyScalar(0.74), ANTI.clone().multiplyScalar(1.08), 0] : j < 6 ? [W.clone().multiplyScalar(0.74), W, 0.4] : [W.clone().multiplyScalar(0.86), W, 0]);
    for (let i = 0; i < NS; i++) for (let j = 0; j < NG; j++) {
      const [lo, hi, k] = strake(j); B.kind = k;
      B.quad(pt(i + 1, j, 1), pt(i, j, 1), pt(i, j + 1, 1), pt(i + 1, j + 1, 1), lo, hi); B.quad(pt(i, j, -1), pt(i + 1, j, -1), pt(i + 1, j + 1, -1), pt(i, j + 1, -1), lo, hi);
    }
    for (let j = 0; j < NG; j++) { const [lo, hi, k] = strake(j); B.kind = k; B.quad(pt(0, j, 1), pt(0, j, -1), pt(0, j + 1, -1), pt(0, j + 1, 1), lo, hi); }
    B.kind = 0;
    const dk = 0.24, RUB = C('#22262b'), BULW = C('#c9c3b2');
    for (let i = 0; i < NS; i++) {
      const a = pt(i, NG, 1), b = pt(i + 1, NG, 1);
      B.quad([-a[0] * 0.93, a[1] - dk, a[2]], [-b[0] * 0.93, b[1] - dk, b[2]], [b[0] * 0.93, b[1] - dk, b[2]], [a[0] * 0.93, a[1] - dk, a[2]], DECK, DECK.clone().multiplyScalar(0.85));
      for (const sd of [-1, 1]) {
        const o0 = [sd * (a[0] + 0.035), a[1], a[2]], o1 = [sd * (b[0] + 0.035), b[1], b[2]], l0 = [sd * (a[0] + 0.035), a[1] - 0.11, a[2]], l1 = [sd * (b[0] + 0.035), b[1] - 0.11, b[2]];
        const i0 = [sd * a[0] * 0.93, a[1] - dk, a[2]], i1 = [sd * b[0] * 0.93, b[1] - dk, b[2]], t0 = [sd * a[0] * 0.93, a[1] + 0.02, a[2]], t1 = [sd * b[0] * 0.93, b[1] + 0.02, b[2]];
        if (sd > 0) { B.quad(l1, l0, o0, o1, RUB); B.quad(i0, i1, t1, t0, BULW.clone().multiplyScalar(0.8), BULW); B.quad(t0, t1, o1, o0, W); }      // rubbing strake, bulwark, cap rail
        else { B.quad(l0, l1, o1, o0, RUB); B.quad(i1, i0, t0, t1, BULW.clone().multiplyScalar(0.8), BULW); B.quad(o0, o1, t1, t0, W); }
      }
    }
    // wheelhouse: a pale frame round three panes forward and two a side, a coloured roof, a whip aerial and a masthead light
    const dy = sy(0.3) - dk, cz = -L * 0.2;
    B.box(0, dy + 0.75, cz, 1.3, 1.5, 1.6, CAB, 0, 0.92, CAB.clone().multiplyScalar(1.04)); B.kind = 0.4; B.box(0, dy + 1.56, cz + 0.06, 1.52, 0.12, 1.95, W); B.kind = 0;
    B.box(0, dy + 1.07, cz + 0.775, 1.02, 0.5, 0.05, PALE);
    B.box(0.6, dy + 1.07, cz + 0.08, 0.05, 0.48, 1.06, PALE); B.box(-0.6, dy + 1.07, cz + 0.08, 0.05, 0.48, 1.06, PALE);
    B.kind = 9;
    for (const wx of [-0.32, 0, 0.32]) B.quad([wx - 0.135, dy + 0.88, cz + 0.81], [wx + 0.135, dy + 0.88, cz + 0.81], [wx + 0.135, dy + 1.27, cz + 0.81], [wx - 0.135, dy + 1.27, cz + 0.81], DARK);
    for (const wz of [-0.2, 0.32]) {
      B.quad([0.635, dy + 0.88, cz + wz + 0.2], [0.635, dy + 0.88, cz + wz - 0.2], [0.635, dy + 1.27, cz + wz - 0.2], [0.635, dy + 1.27, cz + wz + 0.2], DARK);
      B.quad([-0.635, dy + 0.88, cz + wz - 0.2], [-0.635, dy + 0.88, cz + wz + 0.2], [-0.635, dy + 1.27, cz + wz + 0.2], [-0.635, dy + 1.27, cz + wz - 0.2], DARK);
    }
    B.kind = 0;
    B.box(0, dy + 0.62, cz - 0.83, 0.5, 1.1, 0.05, WD); B.beam([0.45, dy + 1.62, cz - 0.5], [0.52, dy + 3.0, cz - 0.62], 0.03, WIRE, 4); B.box(-0.35, dy + 1.72, cz + 0.3, 0.3, 0.2, 0.3, PALE);
    // spars and standing rigging: mast with a derrick boom and its topping lift, a forestay, two shrouds; a mizzen with a furled tan sail
    const mz = L * 0.13, mh = dy + 3.7, tm = 0.5 + mz / L;
    B.beam([0, dy, mz], [0, mh, mz - 0.1], 0.085, WD, 5); B.box(0, mh - 0.12, mz - 0.1, 0.16, 0.1, 0.16, PALE);
    B.beam([0, dy + 0.75, mz + 0.06], [0.25, dy + 2.25, mz + 1.85], 0.06, WD, 4); B.beam([0.25, dy + 2.25, mz + 1.85], [0, mh - 0.2, mz - 0.1], 0.03, WIRE, 3);
    B.beam([0.25, dy + 2.25, mz + 1.85], [0.27, dy + 1.5, mz + 1.87], 0.03, WIRE, 3); B.box(0.27, dy + 1.42, mz + 1.87, 0.12, 0.16, 0.12, RUST);
    B.beam([0, mh - 0.25, mz - 0.1], [0, sy(1) + 0.02, L / 2 - 0.12], 0.035, WIRE, 3);
    for (const sd of [-1, 1]) B.beam([0, mh - 0.3, mz - 0.1], [sd * hb(tm - 0.05) * 0.97, sy(tm - 0.05), mz - 0.42], 0.035, WIRE, 3);
    B.beam([0, dy, -L * 0.43], [0, dy + 2.5, -L * 0.45], 0.06, WD, 4); B.beam([0, dy + 0.85, -L * 0.435], [0, dy + 1.1, -L * 0.2 - 0.9], 0.045, WD, 4);
    B.beam([0, dy + 0.95, -L * 0.418], [0, dy + 2.3, -L * 0.438], 0.13, C('#a8824e'), 6, C('#c79f66'));
    for (const ty of [1.15, 1.6, 2.05]) B.prism(6, 0.105, 0.105, dy + ty, dy + ty + 0.05, C('#3a2c20'), 0, -L * 0.418 - (ty - 0.95) * 0.105, 0);
    B.beam([0, mh, mz - 0.1], [0, mh + 0.55, mz - 0.1], 0.03, WIRE, 3); B.kind = 0.4;
    B.tri([0, mh + 0.55, mz - 0.1], [0, mh + 0.25, mz - 0.1], [0.04, mh + 0.38, mz - 0.95], W); B.tri([0, mh + 0.25, mz - 0.1], [0, mh + 0.55, mz - 0.1], [0.04, mh + 0.38, mz - 0.95], W); B.kind = 0;
    // rudder, keel, and the gear on deck: pots stacked aft of the hatch, a fish box, a pair of pick-up buoys
    B.box(0, 0.42, -L / 2 - 0.08, 0.07, 1.0, 0.36, DARK); B.box(0, 0.06, -0.3, 0.14, 0.2, L * 0.8, ANTI);
    const POT = C('#26383a'), POTL = C('#3d5a58');
    B.box(0.42, dy + 0.21, L * 0.02, 0.62, 0.42, 0.86, POT, 0.2, 0.8, POTL); B.box(-0.4, dy + 0.21, L * 0.0, 0.62, 0.42, 0.86, POT, -0.1, 0.8, POTL); B.box(0.05, dy + 0.63, L * 0.01, 0.62, 0.42, 0.86, POT, 0.5, 0.8, POTL);
    B.box(-0.45, dy + 0.14, L * 0.27, 0.5, 0.28, 0.72, C('#d9742a'), 0.1, 1, C('#e6904a')); B.box(0.4, dy + 0.12, L * 0.3, 0.42, 0.24, 0.6, C('#cfd4d6'), -0.2);
    B.prism(6, 0.05, 0.17, dy + 0.02, dy + 0.2, C('#e0457a'), 0.1, L * 0.36, 0); B.prism(6, 0.17, 0.05, dy + 0.2, dy + 0.38, C('#e0457a'), 0.1, L * 0.36, 1);
    // the riding line from the stem head down to its mooring (it goes under the water, or under the sand at low tide)
    B.beam([0, sy(1) - 0.05, L / 2 - 0.06], [0.25, 0.2, L / 2 + 2.6], 0.045, C('#b8a070'), 3); B.beam([0.25, 0.2, L / 2 + 2.6], [0.4, -1.5, L / 2 + 4.4], 0.045, C('#8a7a58'), 3);
    return B.build();
  })();
  // ---- the old sailing tunny boat that dries out on her legs beside the fairway (opts.ship = [x, z, yaw]): 24 m, two masts,
  // tan sails hoisted to dry, her fishing poles raised. Same material as the small boats: she rights and floats with them.
  const shipGeometry = () => {
    const B = new GW(), L = 24, NS = 12, NG = 7, WL = 0.55, dk = 0.6;
    const HULLC = C('#1b2025'), HULLL = C('#30373e'), ANTI = C('#6e2f25'), W = C('#ece7da'), DECK = C('#a8946c'), WD = C('#6b4f30'), WDL = C('#8f7146'), WIRE = C('#23252a'), SAIL = C('#c79f66'), SAILD = C('#a8824e'), SAILL = C('#dcb87f');
    const hb = (t) => Math.max(0.05, 3.1 * (0.55 + 0.45 * sstep(0, 0.32, t)) * (1 - Math.pow(sstep(0.48, 1, t), 2.2)));
    const sy = (t) => WL + 1.75 + 1.9 * Math.pow(t, 2.6) + 0.55 * (1 - t) * (1 - t);
    const ky = (t) => -1.6 + 2.3 * Math.pow(Math.max(0, (t - 0.8) / 0.2), 2) + 2.9 * (1 - sstep(0, 0.16, t));
    const pt = (i, j, sd) => { const t = i / NS, q = j / NG, k = ky(t); return [sd * hb(t) * Math.pow(Math.sin(q * Math.PI / 2), 0.62), k + (sy(t) - k) * Math.pow(1 - Math.cos(q * Math.PI / 2), 0.8), -L / 2 + L * t]; };
    const strake = (j) => (j < 4 ? [ANTI.clone().multiplyScalar(0.66), ANTI, 0] : j < 6 ? [HULLC, HULLL, 0] : [W.clone().multiplyScalar(0.8), W, 0.4]);
    for (let i = 0; i < NS; i++) for (let j = 0; j < NG; j++) {
      const [lo, hi, k] = strake(j); B.kind = k;
      B.quad(pt(i + 1, j, 1), pt(i, j, 1), pt(i, j + 1, 1), pt(i + 1, j + 1, 1), lo, hi); B.quad(pt(i, j, -1), pt(i + 1, j, -1), pt(i + 1, j + 1, -1), pt(i, j + 1, -1), lo, hi);
    }
    for (let j = 0; j < NG; j++) { const [lo, hi, k] = strake(j); B.kind = k; B.quad(pt(0, j, 1), pt(0, j, -1), pt(0, j + 1, -1), pt(0, j + 1, 1), lo, hi); }
    B.kind = 0;
    for (let i = 0; i < NS; i++) {
      const a = pt(i, NG, 1), b = pt(i + 1, NG, 1);
      { const ra = pt(i, 6, 1), rb = pt(i + 1, 6, 1), o = (v, sd, dy2) => [sd * (v[0] + 0.05), v[1] + dy2, v[2]];
        B.quad(o(rb, 1, -0.09), o(ra, 1, -0.09), o(ra, 1, 0.09), o(rb, 1, 0.09), W); B.quad(o(ra, -1, -0.09), o(rb, -1, -0.09), o(rb, -1, 0.09), o(ra, -1, 0.09), W); }
      B.quad([-a[0] * 0.95, a[1] - dk, a[2]], [-b[0] * 0.95, b[1] - dk, b[2]], [b[0] * 0.95, b[1] - dk, b[2]], [a[0] * 0.95, a[1] - dk, a[2]], DECK, DECK.clone().multiplyScalar(0.86));
      for (const sd of [-1, 1]) {
        const o0 = [sd * (a[0] + 0.05), a[1] + 0.04, a[2]], o1 = [sd * (b[0] + 0.05), b[1] + 0.04, b[2]], i0 = [sd * a[0] * 0.95, a[1] - dk, a[2]], i1 = [sd * b[0] * 0.95, b[1] - dk, b[2]], t0 = [sd * a[0] * 0.95, a[1] + 0.04, a[2]], t1 = [sd * b[0] * 0.95, b[1] + 0.04, b[2]];
        if (sd > 0) { B.quad(i0, i1, t1, t0, HULLL, W.clone().multiplyScalar(0.8)); B.quad(t0, t1, o1, o0, W); } else { B.quad(i1, i0, t0, t1, HULLL, W.clone().multiplyScalar(0.8)); B.quad(o0, o1, t1, t0, W); }
      }
    }
    const dy = (z) => sy((z + L / 2) / L) - dk, zM = 3.4, zZ = -9.2, hbz = (z) => hb((z + L / 2) / L), syz = (z) => sy((z + L / 2) / L);
    {   // what shows at eight metres: the seams of the topside planking, a proud rubbing strake in oiled wood, scuppers, chainplates
        // and the rust that weeps from them (a strip of the hull's own surface, stood off it; i and j may be fractions)
      const RUBC = C('#8f6c3c'), SEAMC = C('#0d1013'), RUSTC = C('#7a4322'), STRAP = C('#17181a');
      const patch = (i0, i1, ja, jb, off, col, col2) => {
        for (const sd of [-1, 1]) {
          const a = pt(i0, ja, sd), b = pt(i1, ja, sd), c = pt(i1, jb, sd), d = pt(i0, jb, sd); for (const v of [a, b, c, d]) v[0] += sd * off;
          if (sd > 0) B.quad(b, a, d, c, col, col2 || col); else B.quad(a, b, c, d, col, col2 || col);
        }
      };
      for (let i = 0; i < NS; i++) { for (const js of [4.33, 4.67, 5.0, 5.33]) patch(i, i + 1, js - 0.028, js + 0.028, 0.012, SEAMC); patch(i, i + 1, 5.58, 5.8, 0.09, RUBC.clone().multiplyScalar(0.6), RUBC); }
      for (let i = 2; i < 10; i++) patch(i + 0.36, i + 0.62, 6.42, 6.6, 0.014, SEAMC);
      for (const ii of [6.85, 7.35, 7.85, 1.45, 0.95]) { patch(ii - 0.035, ii + 0.045, 4.9, 6.25, 0.016, RUSTC.clone().multiplyScalar(0.75), RUSTC); patch(ii - 0.03, ii + 0.03, 6.2, 7.0, 0.07, STRAP); }
    }
    // deckhouse aft, hatch, windlass, fish baskets, rudder, the legs she stands on
    B.box(0, dy(-6.6) + 0.9, -6.6, 2.4, 1.8, 3.2, W.clone().multiplyScalar(0.92), 0, 0.95, W); B.kind = 0.4; B.box(0, dy(-6.6) + 1.87, -6.6, 2.7, 0.14, 3.6, W); B.kind = 9;
    for (const wz of [-7.4, -6.6, -5.8]) for (const sd of [-1, 1]) {      // glass in a varnished frame
      const x = sd * 1.222, xf = sd * 1.208, y = dy(-6.6) + 1.05, fr = (xx, m, col) => { if (sd > 0) B.quad([xx, y - m, wz + 0.25 + m], [xx, y - m, wz - 0.25 - m], [xx, y + 0.5 + m, wz - 0.25 - m], [xx, y + 0.5 + m, wz + 0.25 + m], col); else B.quad([xx, y - m, wz - 0.25 - m], [xx, y - m, wz + 0.25 + m], [xx, y + 0.5 + m, wz + 0.25 + m], [xx, y + 0.5 + m, wz - 0.25 - m], col); };
      B.kind = 0; fr(xf, 0.08, WDL); B.kind = 9; fr(x, 0, HULLC);
    }
    for (const wx of [-0.6, 0.6]) B.quad([wx - 0.3, dy(-6.6) + 1.05, -4.97], [wx + 0.3, dy(-6.6) + 1.05, -4.97], [wx + 0.3, dy(-6.6) + 1.55, -4.97], [wx - 0.3, dy(-6.6) + 1.55, -4.97], HULLC);
    B.kind = 0;
    B.box(0, dy(-0.4) + 0.3, -0.4, 2.3, 0.6, 2.8, C('#3d4d46'), 0, 0.9, C('#55665c')); B.box(0, dy(7.6) + 0.35, 7.6, 1.5, 0.7, 0.7, C('#2a2c30'));
    {   // the deckhouse dressed: a door and a lifebuoy on its after end (the end we come up on), a rail along the roof, a stovepipe
      const hy0 = dy(-6.6), ry = hy0 + 1.94, za = -8.215, DOOR = C('#2f5f8a'), BRASS = C('#c9a23a');
      B.quad([0.95, hy0 + 0.02, za], [0.2, hy0 + 0.02, za], [0.2, hy0 + 1.62, za], [0.95, hy0 + 1.62, za], WD);
      B.quad([0.89, hy0 + 0.08, za - 0.012], [0.26, hy0 + 0.08, za - 0.012], [0.26, hy0 + 1.56, za - 0.012], [0.89, hy0 + 1.56, za - 0.012], DOOR.clone().multiplyScalar(0.8), DOOR);
      B.box(0.33, hy0 + 0.85, za - 0.03, 0.05, 0.14, 0.04, BRASS);
      B.kind = 9; B.quad([0.7, hy0 + 1.05, za - 0.02], [0.45, hy0 + 1.05, za - 0.02], [0.45, hy0 + 1.36, za - 0.02], [0.7, hy0 + 1.36, za - 0.02], HULLC); B.kind = 0;
      for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832, a1 = (k + 1) / 8 * 6.2832; B.beam([-0.55 + Math.sin(a0) * 0.3, hy0 + 1.0 + Math.cos(a0) * 0.3, za - 0.07], [-0.55 + Math.sin(a1) * 0.3, hy0 + 1.0 + Math.cos(a1) * 0.3, za - 0.07], 0.1, k % 2 ? C('#e9e4d6') : C('#e0621f'), 4); }
      for (const sd of [-1, 1]) { B.beam([sd * 1.26, ry + 0.3, -8.1], [sd * 1.26, ry + 0.3, -5.1], 0.045, WDL, 4); for (const rz of [-8.1, -7.1, -6.1, -5.1]) B.beam([sd * 1.26, ry, rz], [sd * 1.26, ry + 0.3, rz], 0.04, WIRE, 3); }
      B.prism(6, 0.1, 0.1, ry, ry + 0.95, WIRE, -0.62, -7.5, 0); B.prism(6, 0.16, 0.05, ry + 0.95, ry + 1.1, WIRE, -0.62, -7.5, 1);
      // on the side we pass: a coiled warp, a stack of fish boxes, a heap of net with its floats
      const cy0 = dy(0.6); for (let r = 0; r < 3; r++) B.prism(9, 0.56 - r * 0.07, 0.52 - r * 0.07, cy0 + r * 0.1, cy0 + 0.1 + r * 0.1, C('#a8905e'), 2.05, 0.6, 1, r * 0.4, C('#c2aa78'));
      B.prism(6, 0.2, 0.2, cy0 + 0.3, cy0 + 0.31, C('#3a3026'), 2.05, 0.6, 1);
      const by0 = dy(-3.9); B.box(1.95, by0 + 0.16, -3.9, 0.95, 0.32, 0.6, C('#d9742a'), 0.08, 1.06, C('#e6904a')); B.box(1.93, by0 + 0.48, -3.92, 0.95, 0.32, 0.6, C('#d8d4c8'), -0.05, 1.06, C('#e9e5da')); B.box(1.97, by0 + 0.8, -3.88, 0.95, 0.32, 0.6, C('#3f78b8'), 0.12, 1.06, C('#5b8fca'));
      B.box(1.95, by0 + 0.975, -3.88, 0.85, 0.03, 0.5, C('#9aa7ac'), 0.12);
      const ny0 = dy(6.0); B.box(1.5, ny0 + 0.26, 6.0, 1.5, 0.52, 1.15, C('#1f3a3c'), 0.25, 0.55, C('#37605c')); B.box(1.35, ny0 + 0.12, 6.9, 1.0, 0.24, 0.8, C('#1f3a3c'), -0.3, 0.6, C('#2f5450'));
      for (let k = 0; k < 6; k++) B.prism(5, 0.09, 0.09, ny0 + 0.38 + 0.05 * Math.sin(k * 2.1), ny0 + 0.52 + 0.05 * Math.sin(k * 2.1), C('#e0621f'), 1.1 + 0.16 * k + 0.1 * Math.sin(k * 1.7), 5.65 + 0.14 * k * Math.cos(k), 1);
    }
    B.box(1.5, dy(-2.6) + 0.25, -2.6, 0.8, 0.5, 0.8, C('#b08a52'), 0.3, 1.12); B.box(-1.6, dy(-2.2) + 0.2, -2.2, 0.9, 0.4, 0.6, C('#cfd4d6'), -0.2); B.box(-1.3, dy(5.2) + 0.25, 5.2, 0.7, 0.5, 0.7, C('#b08a52'), 0.5, 1.12);
    B.box(0, -0.3, -L / 2 + 1.0, 0.14, 2.6, 0.9, HULLC);
    for (const sd of [-1, 1]) B.beam([sd * (hbz(0.6) + 0.12), syz(0.6) + 0.15, 0.6], [sd * (hbz(0.6) + 0.55), -1.6, 0.6], 0.24, WD, 4, WDL);
    // spars
    B.beam([0, dy(zM), zM], [0, 17.6, zM - 0.25], 0.36, WD, 6, WDL); B.beam([0, 16.4, zM - 0.05], [0, 24.6, zM - 0.45], 0.2, WDL, 5);
    B.beam([0, dy(zZ), zZ], [0, 15.6, zZ - 0.3], 0.27, WD, 6, WDL);
    B.beam([0, syz(11.4) - 0.1, 11.2], [0, syz(12) + 1.5, 18.4], 0.26, WD, 5); B.beam([0, syz(-11.6) - 0.15, -11.4], [0, syz(-12) + 0.25, -15.3], 0.16, WD, 4);
    const sail = (T, Cw, H, P, n, belly) => {      // a gaff sail in n cloths, tack-clew along the boom, throat-peak along the gaff
      const mix3 = (a, b, k, bx) => [a[0] + (b[0] - a[0]) * k + bx, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
      for (let k = 0; k < n; k++) {
        const b0 = belly * Math.sin(Math.PI * k / n), b1 = belly * Math.sin(Math.PI * (k + 1) / n), f0 = mix3(T, Cw, k / n, b0), f1 = mix3(T, Cw, (k + 1) / n, b1), h0 = mix3(H, P, k / n, b0 * 0.5), h1 = mix3(H, P, (k + 1) / n, b1 * 0.5);
        const c = k % 2 ? SAIL : SAILD.clone().lerp(SAIL, 0.5);
        B.kind = 0.47; B.quad(f0, f1, h1, h0, c, SAILL); B.quad(f1, f0, h0, h1, c.clone().multiplyScalar(0.9), SAILL.clone().multiplyScalar(0.92)); B.kind = 0;
        if (k > 0) B.beam([f0[0], f0[1] + 0.2, f0[2]], [h0[0], h0[1] - 0.2, h0[2]], 0.035, SAILD.clone().multiplyScalar(0.8), 3);      // the seams of the cloths
      }
      B.beam(T, Cw, 0.17, WD, 4); B.beam(H, P, 0.14, WD, 4);
      for (let k = 1; k < n * 2; k++) { const q = mix3(T, Cw, k / (n * 2), belly * Math.sin(Math.PI * k / (n * 2)) * 0.9), u2 = mix3(H, P, k / (n * 2), 0); const y = q[1] + (u2[1] - q[1]) * 0.24; B.beam([q[0] + 0.03, y, q[2]], [q[0] + 0.03, y - 0.5, q[2]], 0.03, WDL, 3); }      // a row of reef points
    };
    // (sails hoisted to dry, booms swung out to port: we pass under the clew of her mainsail)
    const MC = [4.7, 5.3, -6.2], MP = [4.1, 20.0, -3.6], ZC = [2.5, 5.1, -14.5], ZP = [2.1, 14.8, -12.6];
    sail([0.1, 4.9, zM - 0.5], MC, [0.1, 15.3, zM - 0.6], MP, 6, 0.55);
    sail([0.05, 4.8, zZ - 0.45], ZC, [0.05, 11.4, zZ - 0.5], ZP, 4, 0.35);
    { const a = [0, syz(11.6) + 0.3, 11.5], b = [0.55, 5.2, zM + 1.3], c = [0, 16.0, zM + 0.15]; B.kind = 0.47; B.tri(a, b, c, SAILD, SAIL, SAILL); B.tri(b, a, c, SAIL.clone().multiplyScalar(0.9), SAILD, SAILL); B.kind = 0; }
    B.beam(MC, [0.4, dy(-9) + 0.5, -9.4], 0.05, WIRE, 3); B.beam(ZC, [0, syz(-12) + 0.3, -15.2], 0.045, WIRE, 3);      // the sheets
    {   // the main sheet's tackle and its blocks, topping lifts to both mastheads, lazy jacks; guys fore and aft on each fishing pole,
        // its tunny lines hanging with their lures
      const ROPEC = C('#b8a070'), BLK = C('#4a3a26'), LURE = [C('#e0457a'), C('#e8c62a'), C('#f0f0e8')];
      B.box(MC[0], MC[1] - 0.3, MC[2], 0.2, 0.34, 0.24, BLK); B.box(0.5, dy(-9) + 0.62, -9.4, 0.2, 0.3, 0.24, BLK);
      B.beam([MC[0], MC[1] - 0.4, MC[2] - 0.05], [0.62, dy(-9) + 0.7, -9.5], 0.07, ROPEC, 3); B.beam([MC[0], MC[1] - 0.4, MC[2] + 0.07], [0.38, dy(-9) + 0.7, -9.3], 0.07, ROPEC, 3);
      B.beam(MC, [0, 17.0, zM - 0.3], 0.06, WIRE, 3); B.beam(ZC, [0, 15.2, zZ - 0.3], 0.05, WIRE, 3);
      for (const kk of [0.45, 0.75]) B.beam([0.1 + (MC[0] - 0.1) * kk, 4.9 + (MC[1] - 4.9) * kk - 0.1, zM - 0.5 + (MC[2] - zM + 0.5) * kk], [0.05, 12.5, zM - 0.35], 0.04, ROPEC, 3);
      for (const sd of [-1, 1]) {
        const tip = [sd * 8.4, 17.2, zM + 1.7], root = [sd * 1.3, dy(zM) + 0.3, zM + 0.7];
        B.beam(tip, [sd * hbz(10) * 0.9, syz(10) + 0.1, 10], 0.055, WIRE, 3); B.beam(tip, [sd * hbz(-7.5) * 0.95, syz(-7.5) + 0.1, -7.5], 0.055, WIRE, 3);
        B.box(tip[0], tip[1] + 0.05, tip[2], 0.2, 0.3, 0.2, BLK);
        for (let k = 0; k < 4; k++) {
          const t = 0.5 + k * 0.16, q = [root[0] + (tip[0] - root[0]) * t, root[1] + (tip[1] - root[1]) * t, root[2] + (tip[2] - root[2]) * t], end = [q[0] + sd * 0.15, 9.2 + k * 0.9, q[2] - 1.6 - k * 0.5];
          B.beam(q, end, 0.04, ROPEC, 3); B.box(end[0], end[1] - 0.12, end[2], 0.09, 0.26, 0.09, LURE[k % 3]);
        }
      }
    }
    // standing rigging, the fishing poles, a pennant, the riding light, the chain
    B.beam([0, syz(12) + 1.45, 18.3], [0, 21.6, zM - 0.3], 0.07, WIRE, 3); B.beam([0, syz(12) + 1.8, 17.2], [0, 12.5, 9.6], 0.2, SAILD, 4);
    B.beam(MP, [0, 23.6, zM - 0.4], 0.06, WIRE, 3); B.beam(ZP, [0, 15.5, zZ - 0.3], 0.06, WIRE, 3); B.beam([0, 17.4, zM - 0.25], [0, 15.4, zZ - 0.3], 0.06, WIRE, 3);
    for (const sd of [-1, 1]) {
      for (const dz of [-1.0, 0, 1.0]) B.beam([0, 16.8, zM - 0.2], [sd * hbz(zM - 0.7 + dz) * 0.98, syz(zM), zM - 0.7 + dz], 0.07, WIRE, 3);
      for (const dz of [-0.5, 0.5]) B.beam([0, 14.2, zZ - 0.25], [sd * hbz(zZ - 0.4 + dz) * 0.98, syz(zZ), zZ - 0.4 + dz], 0.06, WIRE, 3);
      B.beam([sd * 1.3, dy(zM) + 0.3, zM + 0.7], [sd * 8.4, 17.2, zM + 1.7], 0.16, WDL, 5); B.beam([sd * 8.4, 17.2, zM + 1.7], [0, 20.6, zM - 0.3], 0.05, WIRE, 3);
    }
    B.kind = 0.4; B.tri([0, 24.6, zM - 0.45], [0, 24.0, zM - 0.45], [0.1, 24.3, zM - 2.3], W); B.tri([0, 24.0, zM - 0.45], [0, 24.6, zM - 0.45], [0.1, 24.3, zM - 2.3], W);
    B.kind = 5; B.prism(6, 0.11, 0.11, 8.6, 8.84, C('#ffcf8a').multiplyScalar(0.3), 0, zM + 0.75, 3);
    B.kind = 0; B.beam([0.9, syz(10.4) - 0.5, 10.5], [1.6, 0.6, 14.4], 0.1, WIRE, 4); B.beam([1.6, 0.6, 14.4], [2.0, -1.8, 16.8], 0.1, WIRE, 4);
    return B.build();
  };
  const HUES = [[BLUE, C('#3f78b8'), C('#27508a'), WHITE, RED, C('#2f7f5a'), C('#d9b23a')], [C('#2f7f78'), C('#3f8f6a'), WHITE, BLUE, C('#d9b23a'), RED], [C('#a5523a'), RED, WHITE, C('#27508a'), C('#d9a327'), C('#3f6f5a')]][look % 3];
  const placed = [[BERTH[0], BERTH[1]]], boats = [], keep = opts.keepOut || [], kept = (x, z, m = 0) => keep.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + m);
  const NBOAT = 40;
  for (const f of opts.moorings || []) {       // [x, z, yaw, scale]: boats the world wants beside its camera line
    placed.push([f[0], f[1]]);
    boats.push({ x: f[0], z: f[1], s: f[3] ?? 1.2, yaw: f[2] ?? Math.PI, heel: rng.range(0.26, 0.46) * (rng.chance(0.5) ? 1 : -1), ph: rng.range(0, 6.28), hue: vcol(rng.pick(HUES), 0.08) });
  }
  // the boats scattered on the sand are dealt from a stream of their own (the keep-out is where the piles stand)
  const sr = makeRng(hashSeed('tide-boat-scatter:' + ctx.seed));
  for (let tries = 0; tries < 2400 && boats.length < NBOAT; tries++) {
    const z = sr.range(11, 128), lim = 86 - Math.max(0, z - 78) * 1.3, x = sr.range(-lim, lim);
    if (lim < 12 || flyDist(x, z) < (z > 45 ? 7.5 : 11) || Math.abs(x - chanX(z)) < 4 || (x < -82 && z < 94) || (x > 36 && x < 72 && z < 13) || inRacks(x, z, 5) || nearWay(x, z, 5)) continue;
    if (posts.some((q) => Math.hypot(q[0] - x, q[1] - z) < 5) || kept(x, z)) continue;
    if (placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 9) || chainEnds.some((p) => Math.hypot(p[0] - x, p[1] - z) < 4.5)) continue;
    placed.push([x, z]);
    const s = sr.range(0.82, 1.5), legs = sr.chance(0.12);
    boats.push({ x, z, s, yaw: sr.chance(0.6) ? Math.PI + sr.range(-0.5, 0.5) : sr.range(0, 6.28), heel: legs ? sr.range(-0.04, 0.04) : sr.range(0.24, 0.5) * (sr.chance(0.5) ? 1 : -1), ph: sr.range(0, 6.28), hue: sr.pick(HUES).clone().multiplyScalar(1 + (sr() - 0.5) * 0.16) });
  }
  for (const wx of [-71, -57.2, -38.5, -26.2, -11.5, 2]) {      // (no draw from ctx.rng; clear of the chains' ends)
    // (they lie alongside, a fender's width off the face, on legs at low water: a hull that keeps its heading does not swing into the stone,
    // and from our line 12 m off they are whole boats under the ladders, not a gunwale in the corner of the eye)
    const wz = 3.05 + 0.3 * lr(), ws = 1.0 + 0.3 * lr(), wh = (0.28 + 0.16 * lr()) * (lr() < 0.6 ? -1 : 1) * 0.16, wy = lr() < 0.5 ? Math.PI / 2 : -Math.PI / 2, wp = lr() * 6.28, wc = HUES[Math.floor(lr() * HUES.length) % HUES.length].clone().multiplyScalar(0.94 + 0.12 * lr());
    if (chainEnds.some((q) => Math.hypot(q[0] - wx, q[1] - wz) < 3.4) || flyDist(wx, wz) < 8 || wx > -30) continue;
    boats.push({ x: wx, z: wz, s: ws, yaw: wy + (lr() - 0.5) * 0.06, heel: wh, ph: wp, hue: wc });
  }
  // moored along the quay by the square, between our line and the stone: their masts, stays and pennants pass the eye
  for (const [ax, as] of [[-24.4, 1.08], [-10.6, 1.14], [6.6, 1.1]]) {
    const hz = 1.28 * as + 1.62 + 0.15 * qr();
    boats.push({ x: ax + (qr() - 0.5) * 0.8, z: hz, s: as, yaw: (qr() < 0.5 ? 1 : -1) * Math.PI / 2 + (qr() - 0.5) * 0.05, heel: 0.05 * (qr() < 0.5 ? 1 : -1), ph: qr() * 6.28, hue: HUES[Math.floor(qr() * HUES.length) % HUES.length].clone().multiplyScalar(0.94 + 0.12 * qr()) });
  }
  let shipMesh = null, shipList = [];
  const mkInst = (geo, list, name) => {
    const m = new THREE.InstancedMesh(geo, boatMat, list.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
    const aB = new Float32Array(list.length * 4), aH = new Float32Array(list.length * 3);
    list.forEach((b, i) => {
      const y = b.y ?? sandHeight(b.x, b.z) - 0.1 * b.s;
      M.compose(new THREE.Vector3(b.x, y, b.z), Q.setFromAxisAngle(UP, b.yaw), new THREE.Vector3(b.s, b.s, b.s)); m.setMatrixAt(i, M);
      aB.set([y, b.heel, b.ph, b.s], i * 4); aH.set([b.hue.r, b.hue.g, b.hue.b], i * 3);
    });
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); geo.setAttribute('aHue', new THREE.InstancedBufferAttribute(aH, 3));
    m.frustumCulled = false; m.name = name; m.castShadow = m.receiveShadow = shadows; if (shadows) m.customDepthMaterial = boatDepth; group.add(m); return m;
  };
  const boatMesh = mkInst(boatGeo, boats, 'boats');
  {   // the mirror image of every boat afloat (the same instances, one more draw call)
    const mirrorMat = makeMat(U, MIRROR_VERT, { transparent: true, side: THREE.BackSide }, 'boat-mirror');
    const mir = new THREE.InstancedMesh(boatGeo, mirrorMat, boats.length);
    mir.instanceMatrix = boatMesh.instanceMatrix; mir.frustumCulled = false; mir.renderOrder = 2.5; mir.name = 'boat-mirrors'; group.add(mir);
    if (opts.ship) {      // the tunny boat and her image: the same two programs, two more draw calls
      await ctx.yield();
      const sg = shipGeometry();
      await ctx.yield();
      // opts.ship = [x, z, yaw, scale]; opts.ship2 = a smaller sister, moored where the world wants a second set of masts
      const ships = [opts.ship, opts.ship2, opts.ship3, opts.ship4].filter(Boolean).map((q, i) => ({ x: q[0], z: q[1], s: q[3] ?? 1, yaw: q[2], heel: 0.05, ph: 1.3 + i * 2.1, hue: i === 1 ? C('#c8553c') : i === 3 ? C('#d9a327') : i ? C('#2f7f5a') : HUES[0].clone(), y: sandHeight(q[0], q[1]) + 1.5 * (q[3] ?? 1) }));
      shipMesh = mkInst(sg, ships, 'ship'); shipList = ships;
      const smir = new THREE.InstancedMesh(sg, mirrorMat, ships.length); smir.instanceMatrix = shipMesh.instanceMatrix; smir.frustumCulled = false; smir.renderOrder = 2.5; smir.name = 'ship-mirror'; group.add(smir);
    }
  }
  await ctx.yield();
  const buoyGeo = (() => {
    const B = new GW(), W = C('#f4efe4'); B.kind = 0.4;
    B.prism(8, 0.08, 0.36, 0, 0.22, W, 0, 0, 2); B.prism(8, 0.36, 0.36, 0.22, 0.5, W, 0, 0, 0); B.prism(8, 0.36, 0.1, 0.5, 0.74, W, 0, 0, 1);
    B.kind = 0; B.beam([0, 0.7, 0], [0, 1.9, 0], 0.035, C('#2a2420'), 4); B.tri([0, 1.9, 0], [0.42, 1.75, 0], [0, 1.6, 0], C('#c8372d')); B.tri([0, 1.9, 0], [0, 1.6, 0], [0.42, 1.75, 0], C('#c8372d'));
    return B.build();
  })();
  const buoys = [], BH = [C('#e8642a'), C('#e0457a'), C('#e8c62a'), C('#f0f0e8'), C('#d9302a')];
  for (let i = 0; i < 34; i++) {
    const nearB = i < 14, a = (rng.range(0, 6.28) / 6.28 - 0.5) * 2.3, r = rng.range(3.2, 12) + 0.6, sp = sector(a, r);
    const x = nearB ? sp[0] : rng.range(-80, 80), z = nearB ? sp[1] : rng.range(12, 120);
    if (flyDist(x, z) < 3 || (!nearB && placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 3.5)) || inRacks(x, z, 1.5) || nearWay(x, z, 2.5) || kept(x, z, -2)) continue;
    buoys.push({ x, z, s: rng.range(0.8, 1.35), yaw: rng.range(0, 6.28), heel: rng.range(1.15, 1.4) * (rng.chance(0.5) ? 1 : -1), ph: rng.range(0, 6.28), hue: vcol(rng.pick(BH), 0.06) });
  }
  for (const [a, r] of [[-0.36, 8.8], [0.3, 11.2], [-0.26, 12]]) { const [x, z] = sector(a, r); if (flyDist(x, z) >= 3) buoys.push({ x, z, s: 1.1, yaw: a * 9, heel: 1.3 * Math.sign(a), ph: r, hue: BH[Math.round(r) % BH.length].clone() }); }
  mkInst(buoyGeo, buoys, 'buoys');
  await ctx.yield();

  // ---- oyster tables on the flats, and the tractors that leave them for the west slip ahead of the flood --------------------
  let tractors = null; const route = [], TM = new THREE.Matrix4(), TE = new THREE.Euler(0, 0, 0, 'YXZ'), TP = new THREE.Vector3(), TS = new THREE.Vector3(1, 1, 1), TS3 = new THREE.Vector3(1, 1, 1), TQ = new THREE.Quaternion();
  let routeLen = 0, lastQ = -1;
  if (RACK) {
    const B = new GW(), IRONR = C('#2b2622'), BAG = [C('#2e3a34'), C('#3b4a3e'), C('#262e2c')];
    for (const sx of [-0.42, 0.42]) B.beam([sx, 0.5, -1.5], [sx, 0.5, 1.5], 0.06, IRONR);
    for (const sz of [-1.3, 1.3]) { B.beam([-0.42, -0.2, sz], [-0.42, 0.5, sz], 0.06, IRONR); B.beam([0.42, -0.2, sz], [0.42, 0.5, sz], 0.06, IRONR); }
    for (let k = 0; k < 3; k++) B.box(0, 0.61, -1 + k, 1.02, 0.17, 0.92, BAG[k], 0.05 * (k - 1), 0.9, BAG[(k + 1) % 3].clone().multiplyScalar(1.35));
    const list = [];
    for (let r = 0; r < 6; r++) {
      const rx = RACK.x0 + 2 + r * 6.2 + rng.range(-0.5, 0.5), skip = rng.int(2, 9);
      for (let k = 0; k < 11; k++) { const z = RACK.z0 + 2 + k * 3.6, x = rx + 0.25 * Math.sin(k * 1.7 + r); if (k === skip || rng.chance(0.08)) continue; list.push([x, sandHeight(x, z) - 0.02, z, rng.range(-0.05, 0.05)]); }
    }
    const racks = new THREE.InstancedMesh(B.build(), solidMat, list.length);
    list.forEach((q, i) => { TE.set(0, q[3], 0); racks.setMatrixAt(i, TM.compose(TP.set(q[0], q[1], q[2]), TQ.setFromEuler(TE), TS)); });
    racks.frustumCulled = false; racks.name = 'oyster-tables'; racks.castShadow = racks.receiveShadow = shadows; group.add(racks);
    await ctx.yield();
    // a tractor and its trailer (forward = +z), an amber beacon on the cab roof
    const T = new GW(), TR = vcol(RED, 0.03), DK = C('#17181a'), GREY = C('#6f7478'), AMBER = new THREE.Color(1.0, 0.5, 0.08);
    T.kind = 0;
    T.box(0, 1.2, 0.75, 0.86, 0.72, 1.9, TR); T.box(0, 1.75, -0.45, 1.2, 1.5, 1.25, TR.clone().multiplyScalar(0.8), 0, 0.9); T.box(0, 2.56, -0.45, 1.3, 0.1, 1.4, vcol(WHITE, 0.02, 0.9));
    for (const sx of [-0.78, 0.78]) { T.box(sx, 0.8, -0.55, 0.42, 1.6, 1.6, DK); T.box(sx, 0.47, 1.35, 0.3, 0.94, 0.94, DK); T.box(sx, 0.5, -4.3, 0.3, 1.0, 1.0, DK); }
    T.beam([0, 0.8, -1.2], [0, 0.95, -2.5], 0.07, DK); T.box(0, 0.98, -4.0, 2.0, 0.16, 3.3, GREY);
    T.box(-0.4, 1.4, -3.3, 1.0, 0.66, 1.2, C('#26383a')); T.box(0.45, 1.3, -4.6, 0.9, 0.5, 1.3, C('#39463c')); T.box(-0.45, 1.25, -4.9, 0.8, 0.4, 0.8, C('#d9742a'));
    T.kind = 5; T.box(0, 2.82, -0.45, 0.42, 0.42, 0.42, AMBER);
    tractors = new THREE.InstancedMesh(T.build(), solidMat, 3); tractors.frustumCulled = false; tractors.name = 'tractors'; tractors.castShadow = tractors.receiveShadow = shadows; group.add(tractors);
    const way = TWAY;
    const slipY = (z) => RIM + (sandHeight(-94, 86) - 0.25 - RIM) * (z - 3) / 83;
    for (let i = 0; i < way.length - 1; i++) {
      const a = way[i], b = way[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
      for (let k = 0; k < n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; route.push([x, z <= 3 ? RIM + 0.03 : x < -92 && z <= 86 ? slipY(z) : sandHeight(x, z), z]); }
    }
    route.push([-58, RIM + 0.03, -5.2]); routeLen = (route.length - 1) * 2;
  }
  const placeTractors = (q) => {
    if (!tractors || Math.abs(q - lastQ) < 1e-5) return; lastQ = q;
    for (let i = 0; i < 3; i++) {
      const d0 = [70, 36, 4][i], d1 = routeLen - 3 - i * 9, d = (d0 + (d1 - d0) * Math.min(1, Math.max(0, q * (1 + 0.12 * i)))) / 2;
      const k = Math.min(route.length - 2, Math.floor(d)), f = d - k, a = route[k], b = route[k + 1];
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1;
      TE.set(-Math.atan2(dy, l), Math.atan2(dx, dz), 0);
      tractors.setMatrixAt(i, TM.compose(TP.set(a[0] + dx * f, a[1] + dy * f, a[2] + dz * f), TQ.setFromEuler(TE), TS));
    }
    tractors.instanceMatrix.needsUpdate = true;
  };
  placeTractors(0);

  // ---- the world's own additions, merged into the same two meshes (opts.extend) ---------------------------------------------
  if (opts.extend) { await ctx.yield(); await opts.extend({ G, GC, GW, vcol, mixc, C, blob, sandHeight, hillHeight, wallZ, RIM, pal: { GRAN, BLACK, OCHRE, WEED, BLUE, SAND, RED, WHITE, SLATE, SEA }, flyDist }); }
  // ---- meshes ---------------------------------------------------------------------------------------------------------------
  await ctx.yield();
  const solidGeo = G.build(); await ctx.yield();
  const solid = new THREE.Mesh(solidGeo, solidMat); solid.name = 'granite-and-village'; solid.castShadow = solid.receiveShadow = shadows; group.add(solid);
  await ctx.yield();
  const clothGeo = GC.build(); await ctx.yield();
  const cloth = new THREE.Mesh(clothGeo, clothMat); cloth.name = 'shutters-awnings-flowers'; cloth.castShadow = cloth.receiveShadow = shadows; if (shadows) cloth.customDepthMaterial = clothDepth; group.add(cloth);
  let water = null;
  if (opts.water !== false) {
    const ws = opts.waterSize ?? 1500; const g = new THREE.PlaneGeometry(ws, ws, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, 150);
    water = new THREE.Mesh(g, makeWaterMat(U)); water.name = 'tide'; water.renderOrder = 2; water.frustumCulled = false; water.position.y = TIDE_LOW; group.add(water);
  }
  await ctx.yield();

  // ---- progress and animation -------------------------------------------------------------------------------------------------
  let driven = false, tide01 = 0, open01 = 0;
  const applyTide = (t) => { tide01 = Math.min(1, Math.max(0, t)); U.uTide.value = TIDE_LOW + (TIDE_HIGH - TIDE_LOW) * tide01; };
  const applyOpen = (o) => { open01 = Math.min(1, Math.max(0, o)); U.uOpen.value = open01; };
  const stage = (u) => { const t = sstep(0.10, 0.60, u); applyTide(t * (0.35 + 0.65 * t)); applyOpen(sstep(0.56, 0.84, u)); };
  const _v = new THREE.Vector3(), _lit = new THREE.Color(), DBG = false, CEN = DBG ? new THREE.Vector3(0, 17, -6) : new THREE.Vector3(0, 24, 40);
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  return {
    object: group, radius: DBG ? 14 : 120, height: DBG ? 16 : 36, center: CEN, ground: false, groundY: 0,
    anchors: {
      start: new THREE.Vector3(BERTH[0], sandHeight(BERTH[0], BERTH[1]), BERTH[1]), berthYaw,
      flyThrough: fly.map(V3),
      portalSeat: { position: new THREE.Vector3(8, TIDE_HIGH + 7.5, 152), facing: new THREE.Vector3(0, 0, -1) },
      viewpoints: {
        floorLookUp: { position: new THREE.Vector3(-46, eye0, 24), target: new THREE.Vector3(-30, 11, 0) },
        rimReveal: { position: new THREE.Vector3(-10, HI, 19), target: new THREE.Vector3(2, 19, -26) },
        lighthouse: { position: new THREE.Vector3(8, TIDE_HIGH + 6, 84), target: new THREE.Vector3(LH[0], RIM + 13, LH[1]) },
      },
      lighthouse: new THREE.Vector3(LH[0], RIM, LH[1]), lamp: new THREE.Vector3(LH[0], LAMP_Y, LH[1]), westHead: new THREE.Vector3(WH[0], RIM, WH[1]),
      square: new THREE.Vector3(0, RIM, -28), tide: { low: TIDE_LOW, high: TIDE_HIGH }, rimY: RIM,
    },
    sandHeight, hillHeight, reefHeight, uniforms: U, materials: { solid: solidMat, boat: boatMat, cloth: clothMat },
    setShade(x, z, amount, scale) { U.uShade.value.set(x, z, amount, scale ?? U.uShade.value.w); },
    setWindows(v) { U.uWin.value = v; },
    setPool(v) { U.uPool.value = v; },
    // the front of the first flood stands on the line z = zAt - slant * (x - xRef) (wavering); zAt = -1e4: everything is reached.
    // film (0..1): behind the front the sand is a mirror, a film of water a finger deep, until the tide plane has covered it
    setFront(zAt, slant = 0, xRef = 0, film = 0) { if (zAt < -9000) U.uFront.value.set(-1e4, 0); else U.uFront.value.set(zAt + slant * xRef, slant); U.uFilm.value = film; },
    setPortalGlow(k) { U.uPortalCol.value.copy(portalCol).multiplyScalar(k); },      // the portal's light standing on the water (opts.portal = [x, y, z, radius, colour])                 // warm pools under the quay lamps (wall, paving, their mirror in the water)
    // sail one of the ships (0 the tunny boat, 1 her sister, 2 opts.ship3) to x, z on a heading: only its instance matrix is written
    moveShip(i, x, z, yaw) { const b = shipList[i]; if (!shipMesh || !b) return; TE.set(0, yaw, 0); shipMesh.setMatrixAt(i, TM.compose(TP.set(x, b.y, z), TQ.setFromEuler(TE), TS3.set(b.s, b.s, b.s))); shipMesh.instanceMatrix.needsUpdate = true; },
    setTractors(q) { placeTractors(q); },              // 0 = at the oyster tables, 1 = parked on the quay
    setLamp(glow, beams) { U.uGlow.value = glow; U.uBeamI.value = beams; U.uLensI.value = 1.6 + 0.55 * glow; },
    setWarm(v) { U.uWarm.value = v; },                 // 1 = the water mirrors the gold low in the sky (first light), 0 = the sky as it is
    setWake(i, x, z, yaw) { U.uWake.value[i].set(x, z, Math.sin(yaw), Math.cos(yaw)); },      // the wake of a vessel under way (two at most)
    setProgress(u) { driven = true; stage(u); },
    setTide(t) { driven = true; applyTide(t); },
    setVillage(o) { driven = true; applyOpen(o); },
    tideY() { return U.uTide.value; },
    setLight(l = {}) {
      if (l.sunDir) U.uSunDir.value.copy(l.sunDir).normalize(); if (l.sunColor) U.uSunCol.value.copy(l.sunColor);
      if (l.skyHorizon) U.uSkyH.value.copy(l.skyHorizon); if (l.skyZenith) U.uSkyZ.value.copy(l.skyZenith);
      // what the water mirrors of the quay, the house fronts and the lighthouse: their colours as the present light leaves them
      const sd = U.uSunDir.value, sc = U.uSunCol.value, am = l.ambient || U.uSkyH.value, k = Math.max(0, sd.z) * (l.sunPower ?? 0.8), ak = l.ambient ? 0.75 : 0.45;
      _lit.setRGB(am.r * ak + sc.r * k, am.g * ak + sc.g * k, am.b * ak + sc.b * k);
      U.uQuayCol.value.copy(GRAN).multiply(_lit); U.uHouseCol.value.copy(WHITE).multiply(_lit).multiplyScalar(0.85); U.uRoofCol.value.copy(SLATE).multiply(_lit); U.uRedLit.value.copy(RED).multiply(_lit);
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven && camera) {       // set-piece viewer: the tide follows the bearing of the orbiting camera
        _v.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(_v);
        let a = Math.atan2(_v.x - CEN.x, _v.z - CEN.z); if (a < -0.7) a += Math.PI * 2;
        stage(DBG ? (a < 0.7 ? 1 : 0.05) : Math.min(1, Math.max(0, (a + 0.3) / (Math.PI * 1.5))));
      }
      if (water) water.position.y = U.uTide.value;
      beam.rotation.y = time * 0.8; lens.rotation.y = time * 0.8;
    },
    dispose() { U.uHt.value?.dispose(); boatDepth.dispose(); clothDepth.dispose(); },
  };
}

// the flat-shaded geometry writer, for the world's own additions (bow, sails, figures)
export { GW, stepNormals };
