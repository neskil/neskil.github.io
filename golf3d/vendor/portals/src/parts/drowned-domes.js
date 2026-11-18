// THE DROWNED DOMES, hero set piece: a 74 m white bell tower standing in black glass ice, nine onion domes that
// break the surface like buoys, a half-buried Holy Gate, their continuations under the ice and their mirrors.
// Coordinates are the brief's: X east, Z south, Y up, ice at y 0, tower at (0,0), gate at (-300,-44) facing east.
// The base tier of the tower has real recessed blind arches (a facing panel 0.4 m proud of the core), paired pilasters whose raking
// shadows are analytic in the shader, and a rusticated plinth under a snow ledge; the ice-shove collars are thin glassy plates and shards.
// Everything above and below the ice is ONE merged mesh with one shader (mat id per vertex); the mirror is the same
// geometry drawn again with a shader that flips y and slides every vertex along the view ray onto the ice plane.
// The mirror is the look of the place: the ice is a black mirror from under the runner outward, so every dome, drum, wall, the bell tower and the
// gate lie in it WHOLE, crisp and nearly as strong as the thing itself from the waterline to the cross: no waver, no dissolve with height, no dashes
// (strangers preferred this to a softened, rippled mirror). Only what lies on the ice hides it: a drift tongue, a frosted band near by and off our track.
// (only the near side of each mirrored thing is drawn, modelled like the thing itself; gilt mirrors a deeper gold).
// (the mirror writes depth and the mirror of a nearer thing lies nearer, so it is one surface, not a stack of panes).
// A building of many layers mirrors as ONE building: the mirror of limewash is solid and lit like the wall, glassy collar slabs have no mirror, and
// whatever lies on a wall (windows, bands, sunk panels: a level in the fraction of its mat id) is drawn a hand nearer than the wall in the mirror.
// The cathedral stands 17 m from the tower's west face (the lane we fly): its walls and five domes throw an analytic shadow on the tower (domeSh),
// the tower's sunlit face throws light back on the cathedral's shaded wall, and no collar slab stands in the lane.
// Round them stand the town's lesser churches, in a second merged mesh with the same two shaders: twenty-one lone domes (EXTRA), most of them close
// beside the track so that we fly between domes all the way to the gate (gilt, starred cobalt, green copper with gilt ribs or silver shingle, the
// nearer ones on tall drums with slit windows), thirteen churches whose walls or belfries still stand out of the ice: the cathedral beside the
// bell tower (its great dome is the sixth of the nine), one 60 m off to port of the channel and a belfry 24 m from the track, the rest out to the horizon (CHURCHES), and the monastery's own
// three-tier bell tower behind the wall (TOWER2). They get mirrors and (near the track) drowned bodies like the nine; SHADOWS and KEEPOUT
// tell the world's ice shader and town where they are. Stay chains bow and sway, shutters and gates swing, in the vertex shader.
// THE MASSED CITY (buildCity): a third merged mesh with the same two shaders, plus a far ring without mirror: churches, tent roofs, belfries,
// a kremlin wall with round towers, a monastery and a convent, laid out by a fixed sequence (not ctx.rng) clear of the track, the rivals'
// courses and the sun's road. Their windows, merlons and slits are drawn in the shader (MAT.CITY, MAT.DRUM); CITY_KEEP tells the town
// where no house may stand. Blown snow hangs in veils off the cathedral's eave and the tower's cornices (plumeMaterial).
import * as THREE from 'three';

const D2R = Math.PI / 180;
export const DOMES = [   // x, z, diameter, gilt: five down the channel (the third and fourth stand as a gate), the cathedral's two, the two that flank the avenue
  [-195, 466, 8, 1], [-146, 404, 7, 0], [-96.2, 236, 7, 1], [-71.8, 248, 8, 0], [-61, 137, 9, 1],
  [-35.2, 13.9, 10, 1], [-32, 67, 7, 0], [-217, -61, 9, 0], [-221, -21, 8, 1]];
export const GATE = [-300, -44];
export const BED_Y = -11;
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
export const COL = {
  lime: lin('#E6E8E1', 0.93), limeDark: lin('#E6E8E1', 0.7), plinth: lin('#7F8A82', 2.1), gold: lin('#E8B030'), blue: lin('#1D4E9E'),
  lead: lin('#7d8790'), shingle: lin('#aeb4b6'), copper: lin('#2a7462', 0.8), silver: lin('#b9c1c6', 0.9), green: lin('#3d5f55', 0.8), slab: lin('#7fd6d8'), snow: [0.77, 0.77, 0.77],
  roof: lin('#b9b7a6'), log: lin('#3a2f26'), bed: lin('#525c5e'), stone: lin('#a9a89c', 1.1), tree: lin('#9aa08c'),
};
// mat ids: 0 limewash, 1 gold, 2 starred blue, 3 lead / shingle, 4 green iron, 5 ice slab, 6 snow, 7 plank roof, 8 bed, 9 plain, 10 fresco,
// 11 log wall with carved windows (panes light with the lamp ring), 12 street lamp, 13 lantern / lit canvas (uGlowK), 14 arcade wall, 15 bridge stone,
// 16 spruce bough (ragged skirts cut in the shader, snow on the windward flank), 17 stay chain (bows and sways in the wind, pinned at both ends),
// 18 shutter or yard gate under the ice (swings slowly about a vertical hinge whose world x, z ride in uv),
// 19 a green copper dome with gilt ribs, 20 a silver aspen-shingle dome,
// 21 a wall of the massed city (storeys of round-headed windows between lesenes, drawn in the shader: uv = metres along the face from its middle,
// the wall's top + a sixteenth of the bay width; the fraction of the mat id is the storey height; no bay width = a kremlin wall with merlons),
// 22 a drum with eight slit windows (uv of the cylinder),
// 23 a frieze of glazed tiles (the shader sets the tiles by metres along the wall and height), 24 a perched crow (it bobs and shuffles in the
// vertex shader; uv = its own phase, the height of its feet)
export const MAT = { LIME: 0, GOLD: 1, BLUE: 2, LEAD: 3, GREEN: 4, SLAB: 5, SNOW: 6, ROOF: 7, BED: 8, PLAIN: 9, FRESCO: 10, LOG: 11, LAMP: 12, GLOW: 13, ARC: 14, BRIDGE: 15, SPRUCE: 16, CHAIN: 17, SWING: 18, COPPER: 19, SILVER: 20, CITY: 21, DRUM: 22, TILE: 23, BIRD: 24 };

// ---------- geometry accumulator: non-indexed, world-space, with colour, uv and mat id ----------
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
// (the five streams are Float32Arrays, sized once from the caller's estimate of the vertex count and doubled only if that falls short:
// no long stall while a huge plain array is regrown or converted, and nothing thrown away for the collector to sweep in the middle of the build)
export class Acc {
  constructor(cap = 512) { this.cap = cap; this.count = 0; const k = this.cap; this.p = new Float32Array(k * 3); this.n = new Float32Array(k * 3); this.c = new Float32Array(k * 3); this.u = new Float32Array(k * 2); this.m = new Float32Array(k); }
  grow(need) {
    let cap = this.cap; while (cap < need) cap *= 2;
    const k = this.count, g = (a, sz) => { const b = new Float32Array(cap * sz); b.set(a.subarray(0, k * sz)); return b; };
    this.p = g(this.p, 3); this.n = g(this.n, 3); this.c = g(this.c, 3); this.u = g(this.u, 2); this.m = g(this.m, 1); this.cap = cap;
  }
  add(geo, mtx, col, mat, uvFix) {      // uvFix: one uv for every vertex (a hinge position for MAT.SWING)
    let g = geo;
    if (geo.index) { g = geo.userData.ni || (geo.userData.ni = geo.toNonIndexed()); }
    const P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv;
    _nm.getNormalMatrix(mtx);
    const k0 = this.count, cnt = P.count;
    if (k0 + cnt > this.cap) this.grow(k0 + cnt);
    const p = this.p, n = this.n, c = this.c, u = this.u, m = this.m;
    for (let i = 0; i < cnt; i++) {
      const k = k0 + i, k3 = k * 3, k2 = k * 2;
      _v.fromBufferAttribute(P, i).applyMatrix4(mtx); p[k3] = _v.x; p[k3 + 1] = _v.y; p[k3 + 2] = _v.z;
      _n.fromBufferAttribute(N, i).applyMatrix3(_nm); const l = _n.length() || 1; n[k3] = _n.x / l; n[k3 + 1] = _n.y / l; n[k3 + 2] = _n.z / l;
      c[k3] = col[0]; c[k3 + 1] = col[1]; c[k3 + 2] = col[2];
      if (uvFix) { u[k2] = uvFix[0]; u[k2 + 1] = uvFix[1]; } else { u[k2] = UV ? UV.getX(i) : 0; u[k2 + 1] = UV ? UV.getY(i) : 0; }
      m[k] = mat;
    }
    this.count = k0 + cnt;
  }
  build() {
    const g = new THREE.BufferGeometry(), k = this.count;
    g.setAttribute('position', new THREE.BufferAttribute(this.p.slice(0, k * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.n.slice(0, k * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.c.slice(0, k * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(this.u.slice(0, k * 2), 2));
    g.setAttribute('aMat', new THREE.BufferAttribute(this.m.slice(0, k), 1));
    g.computeBoundingSphere();
    return g;
  }
  async buildAsync(ctx) {      // the same geometry with a frame handed back between the attributes
    const g = new THREE.BufferGeometry(), k = this.count;
    const take = (a, len) => (a.length <= len * 1.15 ? a.subarray(0, len) : a.slice(0, len));      // (the stream itself when it was sized about right, else an exact copy)
    g.setAttribute('position', new THREE.BufferAttribute(take(this.p, k * 3), 3)); this.p = null; await ctx.yield();
    g.setAttribute('normal', new THREE.BufferAttribute(take(this.n, k * 3), 3)); this.n = null; await ctx.yield();
    g.setAttribute('color', new THREE.BufferAttribute(take(this.c, k * 3), 3)); this.c = null; await ctx.yield();
    g.setAttribute('uv', new THREE.BufferAttribute(take(this.u, k * 2), 2)); this.u = null;
    g.setAttribute('aMat', new THREE.BufferAttribute(take(this.m, k), 1)); this.m = null;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-110, 0, 250), 4000);
    await ctx.yield();
    return g;
  }
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _t = new THREE.Vector3();
// matrix from position, scale, euler (YXZ)
export function M(x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_t.set(x, y, z), _q, _s.set(sx, sy, sz));
}
export const UNIT = {};
async function initUnits(ctx) {      // (frames are handed back between the lathes; UNIT.bell is made last)
  if (UNIT.bell) return;
  UNIT.box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);            // base at y 0
  UNIT.cyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).translate(0, 0.5, 0);
  UNIT.cyl16 = new THREE.CylinderGeometry(1, 1, 1, 18, 1, false).translate(0, 0.5, 0);
  UNIT.cone8 = new THREE.ConeGeometry(1, 1, 8, 1, true).translate(0, 0.5, 0);
  UNIT.cone = new THREE.ConeGeometry(1, 1, 14, 1, true).translate(0, 0.5, 0);
  UNIT.ball = new THREE.SphereGeometry(1, 10, 8);
  UNIT.ball6 = new THREE.SphereGeometry(1, 6, 4);
  UNIT.oct = new THREE.OctahedronGeometry(1, 0);
  await ctx.yield();
  // gable prism: x -.5...5, y 0..1 (ridge along z), z -.5...5
  const pr = new THREE.BufferGeometry();
  const a = [-.5, 0, .5], b = [.5, 0, .5], c = [0, 1, .5], d = [-.5, 0, -.5], e = [.5, 0, -.5], f = [0, 1, -.5];
  const tri = [a, b, c, e, d, f, a, c, f, a, f, d, b, e, f, b, f, c].flat();
  pr.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3));
  pr.setAttribute('uv', new THREE.Float32BufferAttribute([a, b, c, e, d, f, a, c, f, a, f, d, b, e, f, b, f, c].flatMap((v) => [v[0] + 0.5, v[1]]), 2));
  pr.computeVertexNormals(); UNIT.prism = pr;
  await ctx.yield();
  // onion dome profile, radius 1 at the belly, height 2.4
  const prof = [[0, .5], [.08, .72], [.2, .93], [.33, 1], [.45, .95], [.57, .78], [.68, .55], [.77, .36], [.85, .22], [.92, .12], [1, .02]];
  const cv = new THREE.CatmullRomCurve3(prof.map(([t, r]) => new THREE.Vector3(r, t * 2.4, 0)));
  UNIT.onion = new THREE.LatheGeometry(cv.getPoints(22).map((v) => new THREE.Vector2(Math.max(v.x, 0.01), v.y)), 20);
  await ctx.yield();
  UNIT.onionLo = new THREE.LatheGeometry(cv.getPoints(13).map((v) => new THREE.Vector2(Math.max(v.x, 0.01), v.y)), 14);     // lesser churches
  UNIT.onionFar = new THREE.LatheGeometry(cv.getPoints(9).map((v) => new THREE.Vector2(Math.max(v.x, 0.01), v.y)), 10);     // the horizon
  UNIT.cyl8 = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false).translate(0, 0.5, 0);
  UNIT.cyl12 = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false).translate(0, 0.5, 0);
  await ctx.yield();
  // the massed city's light pieces: an onion of 8 gores, one of 6, an open six-sided drum, a four-sided hip roof
  UNIT.onionC = new THREE.LatheGeometry(cv.getPoints(7).map((v) => new THREE.Vector2(Math.max(v.x, 0.01), v.y)), 8);
  UNIT.onionS = new THREE.LatheGeometry(cv.getPoints(6).map((v) => new THREE.Vector2(Math.max(v.x, 0.01), v.y)), 6);
  UNIT.cyl6 = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0);
  UNIT.pyr = new THREE.ConeGeometry(1, 1, 4, 1, true).rotateY(Math.PI / 4).translate(0, 0.5, 0);
  await ctx.yield();
  // a stay chain: two crossed ribbons, six spans, uv.y 0 at the foot and 1 at the head (it bows between them in the vertex shader)
  { const a = new THREE.PlaneGeometry(1, 1, 1, 6).translate(0, 0.5, 0), b = a.clone().rotateY(Math.PI / 2), pp = [], nn = [], uu = [];
    for (const g of [a, b]) { const ni = g.toNonIndexed(); pp.push(...ni.attributes.position.array); nn.push(...ni.attributes.normal.array); uu.push(...ni.attributes.uv.array); }
    const ch = new THREE.BufferGeometry(); ch.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); ch.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3));
    ch.setAttribute('uv', new THREE.Float32BufferAttribute(uu, 2)); UNIT.chain = ch; }
  // a wind-sculpted drift: a low dune lying along +z (its lee), blunt and steep at the windward end, drawn out to a ragged tail, its crest a little
  // off centre and its skirt scalloped; nothing of it lies under the ice (y 0 at the rim). Length 1 along z (0..1), half-width 0.5, height 1
  const dune = (NU, NV) => { const pos = [], uv = [], idx = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = i / NU, v = j / NV, a = (v - 0.5) * Math.PI;
      const env = Math.pow(Math.sin(Math.min(1, u * 3.2) * Math.PI / 2), 0.7) * Math.pow(1 - Math.pow(u, 2.2), 0.55) * (1 - 0.3 * u);   // plan: blunt nose, a long tail that ends in a blunt ragged tongue, never a point
      const wob = 1 + 0.22 * Math.sin(u * 17 + j * 1.3) + 0.12 * Math.sin(u * 41 + j * 2.9);
      const half = 0.5 * env * wob, sx = Math.sin(a), hgt = Math.cos(a) * env * (0.8 + 0.2 * Math.sin(u * 23 + 1.0));
      pos.push(sx * half + 0.07 * Math.sin(u * 9) * env, Math.max(hgt, 0) * (1 - 0.35 * sx), u); uv.push(u, v); }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.computeVertexNormals(); return g; };
  UNIT.drift = dune(12, 6); UNIT.driftLo = dune(7, 4);
  UNIT.mound = new THREE.SphereGeometry(1, 9, 3, 0, Math.PI * 2, 0, Math.PI / 2);      // the upper half of a ball: a bank of snow that lies ON the ice
  UNIT.icicle = new THREE.ConeGeometry(1, 1, 5, 1, true).rotateX(Math.PI).translate(0, -0.5, 0);      // root at y 0, point at y -1
  // what lies flat on a wall (a window, its round head, a sunk panel) is drawn as the one face that shows: the front of the unit box, the far cap of
  // the unit cylinder (two triangles for twelve, ten for forty-eight; the mirror draws every one of them a second time)
  UNIT.face = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0.5);
  UNIT.disc = new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2).translate(0, 1, 0);
  await ctx.yield();
  const bell = [[0.05, 1], [.35, .98], [.5, .8], [.58, .45], [.75, .2], [1, 0], [1.08, -.04]];
  UNIT.bell = new THREE.LatheGeometry(bell.map(([r, y]) => new THREE.Vector2(r, y)), 14);
}

// ---------- shared GLSL ----------
export const NFOOT = 48;               // the feet nearest our track that carry a snow collar (uFootA, uFootB)
export const GLSL_COMMON = /* glsl */`
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n * 17.3 + 3.1)); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
  float fb(vec2 p){ return 0.55*vn(p) + 0.3*vn(p*2.13+3.7) + 0.15*vn(p*4.31+9.1); }
  float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-4), 0., 1.); return length(pa-ba*h); }
  uniform float uLaneK, uSnakeK;        // how wide our wind-swept lane is: 1 on a clear day, narrower in a hoar morning or a ground blizzard
  float laneD(vec2 p){                  // metres to our track (the slalom line, the sweep west of the tower, the avenue)
    float d = min(segD(p, vec2(-226.6,556.3), vec2(-41.,165.)), segD(p, vec2(-41.,165.), vec2(-15.,118.)));
    d = min(d, min(segD(p, vec2(-15.,118.), vec2(0.,75.)), segD(p, vec2(0.,75.), vec2(-7.9,29.9))));
    d = min(d, min(segD(p, vec2(-7.9,29.9), vec2(-28.2,-22.3)), segD(p, vec2(-28.2,-22.3), vec2(-48.,-46.))));
    return min(d, min(segD(p, vec2(-48.,-46.), vec2(-81.,-56.8)), min(segD(p, vec2(-81.,-56.8), vec2(-155.,-46.)), segD(p, vec2(-155.,-46.), vec2(-300.,-44.)))));
  }
  float snowTh(vec2 p, float cover){    // how much of the drift noise counts as a tongue here
    float ld = laneD(p); float nearT = 1. - smoothstep(100., 140., length(p));      // (round the tower the tongues come to within 10 m of our track)
    float lane = mix(smoothstep(26. * uLaneK, 90. * uLaneK, ld), smoothstep(10. * uLaneK, 40. * uLaneK, ld), nearT);
    return mix(0.93, 0.64 - (cover - 1.) * 0.12, lane);            // (on our own track every weather has the clear day's threshold: no drift lies across it)
  }
  float snowApron(vec2 p){ return 1. - smoothstep(15., 30., length((p - vec2(-297., -44.)) * vec2(1., 0.7))); }   // the drift banked against the gate (hides the buried rim of the portal)
  float snowAt(vec2 p, float cover){
    vec2 pj = p + (vec2(vn(p * 0.6), vn(p * 0.6 + 7.3)) - 0.5) * 2.2;          // the edge of a drift is scalloped and feathered, not a drawn curve
    vec2 w = vec2(dot(pj, vec2(0.788,-0.616)), dot(pj, vec2(0.616,0.788)));
    float n = fb(vec2(w.x*0.03, w.y*0.1)) * 0.7 + fb(vec2(w.x*0.011+7., w.y*0.028)) * 0.5;
    float th = snowTh(p, cover);
    return max(smoothstep(th, th + 0.06, n), snowApron(p));
  }
  // the same with its far level of detail: where a tongue is finer than a pixel (px = a pixel's footprint on the ice, metres) the drifts are a thin even
  // veil instead of stripes that shimmer, so the far ice is a calm mirror and whatever lies mirrored there is whole
  float snowLod(vec2 p, float cover, float px){
    float k = smoothstep(5., 16., px);
    return mix(snowAt(p, cover), max(0.2 * clamp((0.9 - snowTh(p, cover)) / 0.26, 0., 1.4), snowApron(p)), k);
  }
  // frosted bands: matt, wind-scoured streaks of rime lying across the black mirror, long down the wind. They are strongest round the
  // cathedral and the tower (within 200 m of the tower), where the mirror is broken into lengths, and faint elsewhere; our own track stays clear
  float satinN(vec2 p){                 // the bands themselves (the mirror is broken by them everywhere, our own track included)
    vec2 w = vec2(dot(p, vec2(0.788, -0.616)), dot(p, vec2(0.616, 0.788)));
    float n = vn(vec2(w.x * 0.011 + 3., w.y * 0.085)) * 0.62 + vn(vec2(w.x * 0.035 + 7., w.y * 0.27 + 2.)) * 0.38;
    return smoothstep(0.48, 0.6, n + 0.1 * (vn(p * 0.9) - 0.5)) * mix(0.5, 1., 1. - smoothstep(130., 260., length(p)));
  }
  float satinAt(vec2 p){                // as they show on the ice and in the mirrors: faint within a few metres of our own track, which the wind keeps polished
    return satinN(p) * mix(0.2, 1., smoothstep(4., 12., laneD(p)));
  }
  float softRefl(float ndv){ return 0.08 + 0.87 * smoothstep(0., 1., 1. - clamp(ndv * 18., 0., 1.)); }
  // snow snakes streaming north-east: thin sunlit streamers gathered in bands, meandering. fa = a pixel's footprint across the wind:
  // the streamers are drawn at the octave that footprint can hold (a hand wide under the eye, metres wide far off), cross-faded, so they never shimmer
  float filam(vec2 w, float wy, float tw, float sc, float th){
    float f = smoothstep(0.3 + th, 0.62 + th, vn(vec2(w.x * 0.035 - tw * 0.32, wy * 2.4 * sc)) * vn(vec2(w.x * 0.1 - tw * 0.9, wy * 6. * sc + 5.)));
    f *= 0.5 + 0.5 * vn(vec2(w.x * 0.9 - tw * 6., wy * 14. * sc));   // grain: blown snow is combed into fine threads along the wind, never a smooth ribbon
    f *= 0.55 + 0.45 * vn(vec2(w.x * 0.3 - tw * 2.4, wy * 1.1 * sc + 9.));   // and comes in puffs
    return f * f * 3.;                                               // a bright core in a gauzy skirt
  }
  float snakeAt(vec2 p, float tw, float sk1, float fa, float thin){     // thin 0..1: fewer streamers (our own wind-swept track), each as bright
    vec2 w = vec2(dot(p, vec2(0.788, -0.616)), dot(p, vec2(0.616, 0.788)));
    float wy = w.y + sin(w.x * 0.06 + tw * 0.5) * 1.3 + sin(w.x * 0.021 - tw * 0.23) * 2.8 + sin(w.x * 0.19 - tw * 1.3 + w.y * 0.23) * 0.45;
    float band = smoothstep(0.56 - 0.16 * sk1, 0.84 - 0.14 * sk1, vn(vec2(w.x * 0.02 - tw * 0.18, wy * 0.16)));
    // (never finer than a soft wisp a metre and more across: hair-thin streamers read as scratches)
    float lv = clamp(log2(max(fa, 0.22) / 0.05), 0., 5.5); float l0 = floor(lv); float sA = exp2(-l0);
    float fil = mix(filam(w, wy, tw, sA, 0.13 * thin - 0.09 * sk1), filam(w, wy + 31.7, tw, sA * 0.5, 0.13 * thin - 0.09 * sk1), lv - l0);   // (a ground blizzard is told by its streamers)
    return band * mix(fil, 0.2, smoothstep(2.5, 6., fa)) * (1. - 0.11 * lv);          // (the broad far streamers are gauzier)
  }
  // the ground blizzard's veil: loose snow smoking over the ice in long sheets combed down the wind, 16 m and more from our own track
  float gauzeAt(vec2 p, float tw){
    vec2 w = vec2(dot(p, vec2(0.788, -0.616)), dot(p, vec2(0.616, 0.788)));
    float g = smoothstep(0.3, 0.7, vn(vec2(w.x * 0.012 - tw * 0.2, w.y * 0.05)) * 0.6 + vn(vec2(w.x * 0.04 - tw * 0.55, w.y * 0.19 + 3.)) * 0.4);
    g *= 0.55 + 0.45 * vn(vec2(w.x * 0.5 - tw * 3., w.y * 6.));                // (combed into threads: never a smooth milky sheet)
    return g * smoothstep(16., 38., laneD(p)) * clamp(uSnakeK - 1., 0., 1.);
  }
  // low mist lying on the far ice in slow banks down the wind: how much of it stands between the eye and a point y metres up, dist metres off.
  // The feet of the distant city stand in it and its domes rise clear; nothing within 70 m of the eye is touched
  uniform float uMistK; uniform vec3 uMistCol;
  float mistAt(vec2 p, float y, float dist, float t){
    vec2 w = vec2(dot(p, vec2(0.788, -0.616)), dot(p, vec2(0.616, 0.788)));
    float bank = 0.6 + 0.4 * vn(vec2(w.x * 0.0035 - t * 0.012, w.y * 0.011 + 3.));
    return uMistK * (1. - exp(-max(dist - 70., 0.) * 0.0042)) * exp(-max(y, 0.) * 0.08) * bank;
  }
  // ---- WHAT LIES ON THE ICE, across the sky and the mirror images alike (the ice shader draws these, the mirror shader gives way to them) ----
  // a line of true width tw seen with a pixel footprint w across it: full where it is wider than a pixel, fading as it gets finer
  float hair(float d, float w, float tw){ float r = max(tw, w) * 0.5; return (1. - smoothstep(r, r + w + 0.003, d)) * min(1., 1.5 * tw / max(w, 1e-4)); }
  // snow banked round every wall and drum that pierces the ice near our track, with a short drift in its lee (north-east): metres to the nearest
  // of it, negative inside. uFootA: x, z, half-width of a square foot (0 for a round one), radius; uFootB: cos and sin of its yaw, the drift's length and root radius
  uniform vec4 uFootA[${NFOOT}]; uniform vec4 uFootB[${NFOOT}];
  float footD(vec2 p){
    float d = 60.;
    for (int i = 0; i < ${NFOOT}; i++) {
      vec4 a = uFootA[i], b = uFootB[i]; vec2 q = p - a.xy;
      vec2 r = abs(vec2(b.x * q.x - b.y * q.y, b.y * q.x + b.x * q.y)) - a.z;
      float df = length(max(r, 0.)) + min(max(r.x, r.y), 0.) - a.w;                          // to the wall itself
      float h = clamp(dot(q, vec2(0.788, -0.616)) / max(b.z, 0.1), 0., 1.);
      float dt = length(q - vec2(0.788, -0.616) * (b.z * h)) - b.w * (1. - h);              // to the drift in its lee
      d = min(d, min(df - 0.5, dt));
    }
    return d + 2.5 * (1. - smoothstep(2.5, 7., laneD(p)));                                    // (our own track is wind-swept to the last metre)
  }
  // a frost flower: a ragged clump of hoar feathers, each its own size and turned its own way, most cells bare (q in cells)
  float frostFl(vec2 q, float sd){ vec2 i = floor(q); vec2 o = h22(i + sd); vec2 d = fract(q) - 0.25 - 0.5 * o; float ang = atan(d.y + 1e-6, d.x + 1e-5);
    float sz = 0.06 + 0.3 * o.x * o.x;                                                         // (small ones far commoner than large)
    float r = length(d) * (1. + 0.3 * sin(ang * 5. + o.x * 6.28) + 0.2 * sin(ang * 11. + o.y * 6.28)) * (0.75 + 0.5 * vn(q * 6. + o * 5.));
    return (1. - smoothstep(sz * 0.45, sz, r)) * smoothstep(0.25, 0.6, vn(q * 9. + o * 9.)) * step(0.45, h21(i + sd + 2.9)); }
  // x: the white collar and lee drift (fd = footD, fw = its screen footprint, both taken outside every branch); y: the frost that feathers out from it and
  // the frost flowers that grow in clusters round every foot; z: the dark tide ring of wind-scoured wet ice between the bank and the flowers.
  // They fade where they are finer than a pixel; far off the feet of things stand in the low mist
  vec3 footCue(vec2 p, float fd, float fw, float dist){
    float nz = (vn(p * 1.3 + 4.1) - 0.5) * 0.7 + (vn(p * 4.7 + 9.) - 0.5) * 0.3;               // a scalloped, feathered edge
    float e = max(0.12, fw * 0.75); float far = 1. - smoothstep(70., 130., dist);
    float snow = (1. - smoothstep(-e, e, fd + nz)) * far;
    float frost = (1. - smoothstep(0.1, 2.2, fd + nz * 1.6)) * (0.3 + 0.7 * smoothstep(0.3, 0.7, vn(p * 0.8 + 7.3))) * far * 0.3;
    float ring = smoothstep(1.2, 2.2, fd + nz) * (1. - smoothstep(4., 9., fd + nz * 4.)) * smoothstep(0.42, 0.62, vn(p * 0.37 + 3.3));      // clusters, bare ice between
    float fine = 1. - smoothstep(0.12, 0.5, fw);
    float flw = max(frostFl(p * 1.25, 3.1), 0.8 * frostFl(p * 2.7 + 5., 7.7));
    frost = max(frost, ring * far * mix(0.16, 0.75 * flw, fine));
    float tide = smoothstep(0.55, 0.85, fd + nz * 0.5) * (1. - smoothstep(1.3, 2.3, fd + nz)) * far;
    return vec3(snow, frost, tide);
  }
  // a few thin drifts of blown snow lying across the polished ice down the wind, each a pace or two wide and some tens of metres long, tapering
  float wispAt(vec2 p){
    vec2 w = vec2(dot(p, vec2(0.788, -0.616)), dot(p, vec2(0.616, 0.788)));
    float wy = w.y + (vn(vec2(w.x * 0.04, w.y * 0.03) + 5.) - 0.5) * 2.4;
    float n = vn(vec2(w.x * 0.022 + 11., wy * 0.6));
    float core = smoothstep(0.86, 0.9, n + 0.03 * (vn(vec2(w.x * 0.7, wy * 6.)) - 0.5));                 // (few, narrow and clean-edged: a drift, not a veil)
    core *= smoothstep(0.42, 0.56, vn(vec2(w.x * 0.004 + 3., wy * 0.11 + 17.)));                           // (and whole reaches of ice have none)
    core *= smoothstep(0.34, 0.56, vn(vec2(w.x * 0.1 + 5., wy * 0.8 + 2.)));                               // (each broken into scalloped lengths of a dozen metres: never one long blade)
    return core * smoothstep(7., 17., laneD(p));                                                            // (combed along the wind; our own track is swept clean)
  }
  // fine runner scratches along our own track only: hairlines the yachts ahead of us have cut, a plank's width apart, coming and going.
  // sl = laneD(p) + a slow wander, fw = its screen footprint (taken outside every branch)
  float scratchAt(vec2 p, float sl, float fw){
    float s = hair(abs(sl - 0.8), fw, 0.006) * smoothstep(0.52, 0.66, vn(p * 0.13 + 1.1));               // (short stretches, finer than a crack)
    s += hair(abs(sl - 2.1), fw, 0.005) * smoothstep(0.55, 0.68, vn(p * 0.11 + 5.7));
    s += hair(abs(sl - 3.4), fw, 0.006) * smoothstep(0.52, 0.66, vn(p * 0.15 + 9.2));
    return min(s, 1.);
  }
  float scratchW(vec2 p){ return (vn(p * 0.035 + 2.3) - 0.5) * 1.2; }
  // a faint sheen: the ice is not one glass. Broad soft lanes of duller ice lie down the wind between the polished ones, and at grazing angles a
  // slight cool haze lies on all of it (ndv = the height of the eye over the distance): over the sky and over every mirror image alike
  float sheenAt(vec2 p){
    vec2 w = vec2(dot(p, vec2(0.788, -0.616)), dot(p, vec2(0.616, 0.788)));
    return smoothstep(0.3, 0.72, vn(vec2(w.x * 0.006 + 2., w.y * 0.045)) * 0.6 + vn(vec2(w.x * 0.017 + 9., w.y * 0.13 + 4.)) * 0.4);
  }
  float hazeAt(vec2 p, float ndv){ return (0.045 + 0.07 * sheenAt(p)) * smoothstep(0., 1., 1. - clamp(ndv * 5., 0., 1.)); }
  // THE ONE CRACK that races us from under our runner to the tower's foot (the world runs uCrack 0..1 along it and lets uCrackF fall once it has run):
  // a CRACK, not a line: short straight runs with a kink every few metres and a smaller one every pace, forking twice into forks that wander off 30 m.
  // raceD: x = distance to it (stem and forks), y = metres along its run, z = its length, w = signed distance to the stem alone.
  // raceP: x = its dark core (open water a finger wide), y = the white lips of shattered ice either side, ragged and broken into flakes, widest
  // behind the running head, z = the ice dust glowing at the head. wC = the screen footprint of raceD's x, taken outside every branch.
  // The ice draws it and the mirror gives way to it (raceK)
  uniform float uCrack, uCrackF; uniform vec2 uCrackA;
  float raceJ(float rs){
    float z1 = rs / 7., z2 = rs / 1.3, z3 = rs / 3.1;      // long straight runs joined by oblique ones, a sharp sideways jog every few paces, a kink every pace
    return (mix(h21(vec2(floor(z1), 3.)), h21(vec2(floor(z1) + 1., 3.)), smoothstep(0.3, 0.7, fract(z1))) - 0.5) * 4.2
      + (mix(h21(vec2(floor(z3), 5.)), h21(vec2(floor(z3) + 1., 5.)), smoothstep(0.38, 0.62, fract(z3))) - 0.5) * 1.5
      + (mix(h21(vec2(floor(z2), 9.)), h21(vec2(floor(z2) + 1., 9.)), fract(z2)) - 0.5) * 0.8;
  }
  vec4 raceD(vec2 p){
    vec2 rba = vec2(-7., 13.) - uCrackA; float rlen = max(length(rba), 1.); vec2 rdir = rba / rlen;
    vec2 rrel = p - uCrackA; float rs = dot(rrel, rdir);
    float rt = dot(rrel, vec2(-rdir.y, rdir.x)) - raceJ(rs) * (0.3 + 0.7 * sin(clamp(rs / rlen, 0., 1.) * 3.14159));
    rt -= 9. * max(0., 1. - abs(rs - 67.) / 46.);      // (it goes round the green copper dome that stands on its straight line 67 m along: a crack does not run through a drum)
    float rf1 = rs - rlen * 0.38, rf2 = rs - rlen * 0.66; float d = abs(rt);
    if (rf1 > 0. && rf1 < 34.) d = min(d, abs(rt - rf1 * 0.42 - raceJ(rs + 57.) * 0.5 * min(rf1 * 0.2, 1.)) + max(rf1 - 30., 0.) * 0.3);
    if (rf2 > 0. && rf2 < 28.) d = min(d, abs(rt + rf2 * 0.5 - raceJ(rs + 131.) * 0.5 * min(rf2 * 0.2, 1.)) + max(rf2 - 24., 0.) * 0.3);
    return vec4(d, rs, rlen, rt);
  }
  // its side cracks: short hairlines that leave the stem at a slant, one to a cell of 2.3 m, a few cells bare, each its own length (in the stem's own
  // frame: s metres along, t metres across)
  float raceF1(float s, float t, float ci){ vec2 h = h22(vec2(ci, 4.7)); float sg = h.x > 0.5 ? 1. : -1.; float L = 0.45 + 2.4 * h.y * h.y;
    float s0 = (ci + 0.2 + 0.6 * h.x) * 2.3; float sl = (fract(h.x * 7.3) - 0.3) * 1.5;
    return h.y < 0.14 ? 9. : segD(vec2(s, t), vec2(s0, 0.), vec2(s0 + sl * L, sg * L)); }
  float raceFd(vec4 rd){ float ci = floor(rd.y / 2.3); return min(raceF1(rd.y, rd.w, ci), min(raceF1(rd.y, rd.w, ci - 1.), raceF1(rd.y, rd.w, ci + 1.))); }
  // fD, wF: the distance to the nearest side crack and its screen footprint (9 and 1 where they are not wanted)
  vec3 raceP(vec4 rd, float wC, float dist, vec2 p, float fD, float wF){
    float head = uCrack * rd.z, fresh = clamp((uCrackF - 0.35) / 0.65, 0., 1.), on = step(0.001, uCrack);
    float run = step(0., rd.y) * (1. - smoothstep(head - 1.5, head, rd.y)) * on;
    float wv = vn(vec2(rd.y * 0.9, 3.));                                                       // its width comes and goes along its run
    float coreW = 0.04 + 0.12 * wv * wv;
    float core = hair(rd.x, wC, coreW) * (1. - smoothstep(0.04, 0.22, wC));
    // the lips: a rim of crushed ice hugging the core, a hand wide, broken into flakes, wider where the crack kinks and for the metres behind its head
    float nearHead = smoothstep(head - 45., head - 6., rd.y) * fresh;                              // (behind the running head while it is fresh: whole for the last 6 m, easing back to flakes by 45 m behind it)
    float lw = coreW + 0.05 + 0.1 * smoothstep(0.5, 0.9, vn(vec2(rd.y * 0.45, 9.))) + 0.12 * exp(-abs(rd.y - head) * 0.6) * fresh + dist * mix(0.001, 0.005, fresh);   // (drawn a little wider with distance, so the head can be followed to the tower)
    float lips = hair(rd.x, wC, coreW + 1.2 * lw) * mix((0.12 + 0.88 * smoothstep(0.3, 0.6, vn(p * 9.3 + 1.7))) * (0.5 + 0.5 * smoothstep(0.25, 0.5, vn(p * 3.1 + 8.))), 1., nearHead);   // (flakes and gaps: never an even band, but whole and bright behind the running head)
    // the fracture plane under the surface catches the light: a milky gleam that dies a pace from the crack
    float milk = exp(-rd.x * 3.4) * 0.2 * (0.35 + 0.65 * vn(vec2(rd.y * 0.3, 5.))) * (1. - smoothstep(15., 60., dist));
    float fea = hair(fD, wF, 0.02) * 0.7 * step(0., rd.y) * (1. - smoothstep(head - 4., head - 1., rd.y)) * (1. - smoothstep(25., 70., dist));
    float back = mix(mix(0.35, 0.75, fresh), 1., smoothstep(head - 45., head - 6., rd.y));
    // the ice dust thrown up at its running head: a small ragged puff that travels with the tip
    float glow = exp(-rd.x / (0.35 + dist * 0.01)) * exp(-abs(rd.y - head) * 0.4) * step(uCrack, 0.999) * step(-3., rd.y) * on * smoothstep(0.2, 0.75, vn(p * 1.9 - uCrack * vec2(140., 90.)));
    return vec3(core * run, max(lips, max(milk, fea)) * run * back, glow * 0.7) * (uCrackF * (1. - smoothstep(190., 330., dist)) * mix(0.5, 1., smoothstep(3., 10., dist)));
  }
  float raceK(vec4 rd, float wC, float dist, vec2 p){ vec3 k = raceP(rd, wC, dist, p, 9., 1.); return clamp(k.y + k.z + 0.5 * k.x, 0., 1.); }
`;
export function makeUniforms() {
  return {
    uSun: { value: new THREE.Vector3(-0.771, 0.208, 0.602) }, uSunCol: { value: new THREE.Color('#FFF1D6') }, uSunK: { value: 3.4 },
    uSky: { value: new THREE.Color('#5E8FD8') }, uGnd: { value: new THREE.Color('#BFD3E8') }, uHemiK: { value: 1.8 },
    uZen: { value: new THREE.Color('#1D4E9E') }, uHor: { value: new THREE.Color('#C6DBEE') },
    uTime: { value: 0 }, uFogCol: { value: new THREE.Color('#C6DBEE') }, uFogDen: { value: 0.00055 }, uCover: { value: 1 },
    uDeep: { value: new THREE.Color('#0A2440') }, uLampR: { value: 0 }, uWinK: { value: 0.4 }, uGlowK: { value: 0 }, uRime: { value: 0 }, uMirK: { value: 1 }, uUnderK: { value: 1 },
    uWind: { value: 1 }, uSnakeK: { value: 0.3 }, uLaneK: { value: 1 }, uRimeW: { value: 0.3 },
    uMistK: { value: 0 }, uMistCol: { value: new THREE.Color('#dfe9f4') },      // low mist lying on the far ice: the feet of the distant city stand in it
    uMid: { value: new THREE.Color('#4E86C8') }, uCrack: { value: 0 }, uCrackF: { value: 1 }, uCrackA: { value: new THREE.Vector2(-76, 224) },
    uFootA: { value: Array.from({ length: NFOOT }, () => new THREE.Vector4(1e5, 1e5, 0, 1)) }, uFootB: { value: Array.from({ length: NFOOT }, () => new THREE.Vector4(1, 0, 1, 0.1)) },
  };
}
// GILT LEAF laid in fish scales: one function for the dome above the ice and for its image in the ice, so the two show the same metal.
// N the surface normal, V the way to the eye (for the mirror image: to the eye's own image under the ice), uv the lathe's, fwS the screen
// footprint of one scale, occ the sun's share (shadow)
const GLSL_GILT = /* glsl */`
  vec3 giltLeaf(vec2 uv, vec3 N, vec3 V, float fwS, float occ){
    vec2 sc = vec2(uv.x * 40., uv.y * 14.); sc.x += 0.5 * floor(sc.y); vec2 f = fract(sc) - vec2(0.5, 0.2);
    float lod = (1. - smoothstep(0.3, 1.1, fwS)) * step(0.01, uv.y);
    float seam = smoothstep(0.4, 0.5, length(f)) * lod;                                         // dulled seams, streaked green
    float tone = mix(1., 0.74 + 0.52 * h21(floor(sc) + 3.3), lod);                              // every leaf its own age
    float bev = mix(1., 1.16 - 0.36 * smoothstep(-0.15, 0.4, f.y), lod);                        // the rounded lower edge of each scale catches the light
    vec3 R = reflect(-V, N);
    vec3 env = mix(uHor, uZen, smoothstep(0., 0.7, R.y) * 0.8); if (R.y < 0.) env = mix(uHor, vec3(0.05, 0.1, 0.16), smoothstep(0., 0.3, -R.y));
    float fr0 = clamp(1. - dot(N, V), 0., 1.); float fr = 0.6 + 0.4 * fr0 * fr0 * fr0;
    float rs = max(dot(R, uSun), 0.); float rs4 = rs * rs; rs4 *= rs4; float rs12 = rs4 * rs4 * rs4; float rs96 = rs12 * rs12; rs96 *= rs96; rs96 *= rs96;
    float hl = rs96 * 9. + rs12 * 1.3;                                                          // the gilt highlight (HDR 4 to 6)
    float ndl = max(dot(N, uSun), 0.);
    vec3 hemi = mix(uGnd, uSky, 0.5 + 0.5 * N.y) * uHemiK;
    vec3 base = vec3(0.93, 0.56, 0.13) * (uSunCol * uSunK * (0.12 + 0.5 * ndl) * occ + hemi * 0.5) * 0.3183;      // the leaf's own deep gold
    vec3 metal = vec3(1.0, 0.68, 0.22) * (env * 1.1 * fr + uSunCol * hl * min(uSunK * 0.3, 1.) * occ);            // what it mirrors: the sky and the sun
    vec3 col = (base * 1.45 + metal * 0.6) * tone * bev;
    return mix(col, vec3(0.16, 0.26, 0.14) * (uSunCol * uSunK * (0.2 + 0.8 * ndl) * occ + hemi) * 0.3183, seam * 0.5);
  }`;
const SURF_VERT = /* glsl */`
  attribute float aMat; uniform float uTime;
  varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vUv; varying float vM;
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    if (wp.y < 0.) wp.y *= 0.76;
    vec3 wn = mat3(modelMatrix) * normal;
    if (aMat > 12.5 && aMat < 13.5 && color.b > 0.2) {      // the tent canvas bellies with the gusts and drums (pinned along ridge, eaves and ends)
      float env = sin(clamp(uv.x, 0., 1.) * 3.14159) * sin(clamp(uv.y, 0., 1.) * 3.14159);
      wp.xyz += wn * env * (0.08 + 0.05 * sin(uTime * 2.1 + wp.x) + 0.025 * sin(uTime * 11. + wp.x * 3. + wp.y * 4.));
    }
    if (aMat > 16.5 && aMat < 17.5) {                        // stay chains bow down the wind and sway, pinned at the dome and at the cross
      float bow = sin(clamp(uv.y, 0., 1.) * 3.14159);
      wp.xz += vec2(0.788, -0.616) * bow * (0.09 + 0.07 * sin(uTime * 2.3 + wp.x * 0.7 + wp.z * 0.4) + 0.03 * sin(uTime * 7.1 + wp.y * 3.));
      wp.y -= 0.05 * bow;
    }
    if (aMat > 17.5 && aMat < 18.5) {                        // shutters and yard gates swing slowly in the current, each about its own hinge (uv = the hinge's x, z)
      float ph = uv.x * 0.37 + uv.y * 0.23; float sa = 0.5 * sin(uTime * 0.6 + ph) + 0.14 * sin(uTime * 1.7 + ph * 2.3);
      float cs = cos(sa), sn = sin(sa); vec2 dq = wp.xz - uv;
      wp.xz = uv + vec2(cs * dq.x - sn * dq.y, sn * dq.x + cs * dq.y);
      wn.xz = vec2(cs * wn.x - sn * wn.z, sn * wn.x + cs * wn.z);
    }
    if (aMat > 23.5 && aMat < 24.5) {                        // a perched crow bobs, shuffles a step along its ledge and settles again (uv.x = its own phase, uv.y = the height of its feet)
      float ph = uv.x * 6.2832; float bob = max(sin(uTime * 0.9 + ph * 3.), 0.); bob *= bob;
      wp.y += (wp.y - uv.y) * 0.22 * bob * sin(uTime * 7. + ph) + 0.03 * bob;
      wp.xz += vec2(sin(ph * 2.), cos(ph * 2.)) * 0.07 * sin(uTime * 0.35 + ph);
    }
    vW = wp.xyz; vN = wn; vC = color; vUv = uv; vM = aMat;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const SURF_FRAG = /* glsl */`
  uniform vec3 uSun, uSunCol, uSky, uGnd, uZen, uHor, uFogCol, uDeep; uniform float uSunK, uHemiK, uTime, uFogDen, uLampR, uGlowK, uRime, uUnderK, uRimeW, uWinK;
  varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vUv; varying float vM;
  ${GLSL_COMMON}
  ${GLSL_GILT}
  // the shadow one onion dome of the cathedral throws along the sun's ray (all in the cathedral's own frame): q the point, d the unit way to the sun on the
  // ground, y the point's height, ty the ray's rise per metre, a the dome's axis, R its radius, y1 the top of its drum
  float domeSh(vec2 q, vec2 d, float y, float ty, vec2 a, float R, float y1){
    float t0 = dot(a - q, d); float dp = length((a - q) - d * t0); float h = y + max(t0, 0.) * ty;
    float sq = clamp((h - y1) / (2.4 * R), 0., 1.);
    float r = h < y1 ? 0.62 * R : R * (sq < 0.33 ? mix(0.5, 1., smoothstep(0., 0.33, sq)) : mix(1., 0.02, pow(clamp((sq - 0.33) / 0.67, 0., 1.), 1.3)));
    return (1. - smoothstep(r - 0.3, r + 0.3, dp)) * step(0., t0) * (1. - smoothstep(y1 + 2.4 * R, y1 + 2.4 * R + 0.4, h));
  }
  vec2 gridAB(vec2 xz){ vec2 q = xz - vec2(-205., 510.); return vec2(dot(q, vec2(0.42, -0.908)), dot(q, vec2(0.908, 0.42))); }
  float ringAt(float d){ return 1. - smoothstep(uLampR - 30., uLampR, d); }          // the lamp ring spreading from the tower (0 while uLampR is 0)
  float footRime(float y, float along){ return 1. - smoothstep(0.1, 0.42, y + (vn(vec2(along * 1.3, 5.)) - 0.5) * 0.3); }      // a ragged band a hand to a foot and a half up the wall
  float litAt(vec2 xz){                                                              // ... taken house by house
    vec2 ab = gridAB(xz); vec2 id = vec2(floor((ab.x + 148.) / 16.), floor((ab.y + 25.) / 25.));
    vec2 c = vec2(-205., 510.) + vec2(0.42, -0.908) * (id.x * 16. - 140.) + vec2(0.908, 0.42) * (id.y * 25. - 12.5);
    return ringAt(length(c) + (h21(id + 3.7) - 0.5) * 50.);
  }
  void main(){
    vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
    vec3 toC = cameraPosition - vW; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
    vec3 alb = vC; float spec = 0.; float m = floor(vM + 0.5); float occ = 1.; float glow = 0.; float csK = 0.;
    vec3 R = reflect(-V, N);
    float up = N.y; float side = 1. - smoothstep(0.35, 0.6, abs(up));
    float hY = vW.y < 0. ? vW.y / 0.76 : vW.y;                 // true height (the vertex shader squashes y under the ice)
    float fwY = fwidth(hY); float tq = (vW.x + vW.z) * 0.5; float fwT = fwidth(tq);
    float bxx = dot(vW.xz, vec2(-N.z, N.x)); float fwB = fwidth(bxx);          // (derivatives are taken here, outside the branches)
    float fq = dot(vW, vec3(1.3, 2.1, 0.7)); float fwQ = fwidth(fq); float fwP = fwidth(vW.x) + fwidth(vW.z); float fwU = fwidth(vUv.x);
    float cglow = 0.; bool lw = m < 0.5 || (m > 20.5 && m < 23.5); float rmK = 0.; float fwS = fwidth(vUv.x * 40.);                          // (limewash and the city's walls and drums are lit alike)
    vec3 emis = vec3(0.);
    if (m < 0.5) {                       // limewash: brick courses, rust tears under the cornices, damp at the ice, snow on ledges
      alb *= 0.9 + 0.1 * vn(vW.xy * 0.8 + vW.z * 0.8);
      // (the soffit of each cornice lies exactly on its level, so the test below starts a little under it: no speckle)
      float e = 16.3 - vW.y; float cs = step(-0.05, e) * (1. - smoothstep(0.2, 3.2, e)); float bc = step(0., e) * (1. - smoothstep(0.5, 8., e));
      float corn = step(-0.95, e) * step(e, 0.03);
      float lw = (vn(vec2(tq * 1.7, 4.)) - 0.5) * 0.3; float lip = step(-0.9, e) * (1. - smoothstep(0.1, 0.24, e + 0.9 + lw));
      e = 30.1 - vW.y; cs = max(cs, step(-0.05, e) * (1. - smoothstep(0.2, 3.0, e))); bc = max(bc, step(0., e) * (1. - smoothstep(0.5, 7., e))); lip = max(lip, step(-0.9, e) * (1. - smoothstep(0.1, 0.24, e + 0.9 + lw))); corn = max(corn, step(-0.95, e) * step(e, 0.03));
      e = 42.1 - vW.y; cs = max(cs, step(-0.05, e) * (1. - smoothstep(0.2, 2.6, e))); bc = max(bc, step(0., e) * (1. - smoothstep(0.5, 6., e))); lip = max(lip, step(-0.9, e) * (1. - smoothstep(0.1, 0.24, e + 0.9 + lw))); corn = max(corn, step(-0.95, e) * step(e, 0.03));
      e = 52.1 - vW.y; cs = max(cs, step(-0.05, e) * (1. - smoothstep(0.2, 2.2, e))); bc = max(bc, step(0., e) * (1. - smoothstep(0.5, 5., e))); lip = max(lip, step(-0.9, e) * (1. - smoothstep(0.1, 0.24, e + 0.9 + lw))); corn = max(corn, step(-0.95, e) * step(e, 0.03));
      e = 59.1 - vW.y; cs = max(cs, step(-0.05, e) * (1. - smoothstep(0.2, 2.0, e))); bc = max(bc, step(0., e) * (1. - smoothstep(0.5, 4., e))); lip = max(lip, step(-0.9, e) * (1. - smoothstep(0.1, 0.24, e + 0.9 + lw))); corn = max(corn, step(-0.95, e) * step(e, 0.03));
      lip *= side * step(100., abs(vW.x + 150.));          // snow lipping over each cornice of the tower (not the gate)
      float pl = step(vC.r * 1.1, vC.g) * step(hY, 2.45);  // the grey-green plinth
      // brick courses (not on the cornice fascias or the plinth; gone before a course is a pixel)
      float row = floor(hY * 3.3);
      float cf = side * (1. - smoothstep(0.06, 0.3, fwY * 3.3)) * (1. - smoothstep(0.04, 0.2, fwB * 1.6)) * (1. - corn) * (1. - pl);
      float bq = bxx * 1.6 + 0.5 * row;
      alb *= 1. - cf * (0.13 * max(1. - step(0.13, fract(hY * 3.3)), 1. - step(0.07, fract(bq))) + 0.07 * (h21(vec2(floor(bq), row)) - 0.5));
      alb *= 1. - 0.05 * side * step(0.75, fract(hY * 0.55)) * (1. - pl);
      // lost limewash: brick showing in ragged patches, more of it low on the wall; long grey weather stains
      float offT = step(17., length(vW.xz)) * (1. - step(vW.x, -287.) * step(abs(vW.z + 44.), 15.));   // (the gate's facade is treated like the tower's)
      // (away from the tower the lost patches are smaller and rarer: a church wall 25 m off must not read as camouflage)
      // (near the tower, where a course is several pixels high, a lost patch ends along the courses and at the brick ends: whole bricks showing, not smooth blots)
      float stepK = (1. - offT) * (1. - smoothstep(0.1, 0.25, fwY * 3.3));
      vec2 fl = mix(vec2(bxx, hY), vec2((floor(bq) + 0.5 - 0.5 * row) / 1.6, (row + 0.5) / 3.3), stepK);
      float flake = smoothstep(mix(0.7, 0.78, offT), mix(0.74, 0.82, offT), fb(vec2(fl.x, fl.y * 1.5) * mix(0.5, 1.2, offT) + 3.) + 0.14 * (vn(vec2(fl.x * 3.1, fl.y * 3.7)) - 0.5) + 0.07 * (1. - smoothstep(2.4, 6., hY)))
        * side * (1. - pl) * (1. - corn) * step(0.3, hY) * mix(1., 0.5, smoothstep(10., 14., hY) * (1. - offT));
      alb = mix(alb, vec3(0.4, 0.23, 0.16) * (0.75 + 0.5 * mix(0.5, h21(vec2(floor(bq), row)), cf)), flake * mix(0.45 + 0.3 * vn(vec2(bxx * 5.3, hY * 6.1)), 0.3 + 0.2 * vn(vec2(bxx * 5.3, hY * 6.1)), offT) * (1. - smoothstep(0.3, 1.2, fwY * 3.3)));
      alb = mix(alb, vec3(0.6, 0.58, 0.52), 0.55 * flake * stepK * cf * max(1. - step(0.13, fract(hY * 3.3)), 1. - step(0.07, fract(bq))));      // pale mortar between the bared bricks
      alb *= 1. - 0.1 * side * (1. - pl) * smoothstep(0.45, 0.8, vn(vec2(bxx * 1.1 + 7., hY * 0.05)));
      // rusticated plinth: 0.6 m courses of 1.2 m blocks, staggered, with sunk joints and a light chamfer
      float fy = hY / 0.6; float prow = floor(fy); float fxb = bxx / 1.2 + 0.5 * prow;
      float jy = smoothstep(0.4 - fwY * 1.7, 0.47, abs(fract(fy) - 0.5)); float jx = smoothstep(0.44 - fwB * 0.85, 0.485, abs(fract(fxb) - 0.5));
      float pk = pl * side * (1. - smoothstep(0.25, 0.8, fwY * 1.7));
      float bvy = fract(fy), bvx = fract(fxb), nj = (1. - jy) * (1. - jx);
      alb *= 1. + pk * (0.2 * (h21(vec2(floor(fxb), prow)) - 0.5) - 0.42 * max(jy, jx) + (0.3 * smoothstep(0.76, 0.9, bvy) - 0.2 * (1. - smoothstep(0.1, 0.24, bvy))
        + 0.14 * (1. - smoothstep(0.06, 0.13, bvx)) - 0.14 * smoothstep(0.87, 0.94, bvx)) * nj + 0.16 * (vn(vec2(bxx * 5., hY * 7.)) - 0.5));
      alb *= mix(1., 1.28, pl * step(0., hY));                                                               // (pale dressed stone above the ice, not a dark slab)
      alb = mix(alb, vec3(dot(alb, vec3(0.3333))), 0.45 * pl);                                               // grey-green stone, not glazed tile
      alb = mix(alb, vec3(0.77), 0.35 * smoothstep(0.25, 0.45, fract(fy) - 0.5) * (1. - 0.5 * jy) * pk * step(0., hY));   // rime caught on the top of each block
      float tears = vn(vec2(tq * 1.6, vW.y * 0.06)) * vn(vec2(tq * 0.45 + 5., vW.y * 0.16 + 3.));
      alb = mix(alb, vec3(0.4, 0.22, 0.12), smoothstep(0.25, 0.65, tears) * 0.5 * bc * side * (1. - smoothstep(0.25, 0.8, fwT)));
      float damp = (1. - smoothstep(0., 4.5, hY + (vn(vec2(tq * 0.5, 2.)) - 0.5) * 3.)) * step(0., vW.y) * side;
      alb = mix(alb, alb * vec3(0.62, 0.66, 0.62), damp * mix(0.35, 0.15, pl));
      // THE TIDE LINE: a dark, wet, ice-glazed band a metre up every wall and drum that stands in the ice (the rime at the very foot lies white under it)
      alb = mix(alb, alb * vec3(0.46, 0.53, 0.56), 0.8 * step(0., vW.y) * side * (1. - smoothstep(0.95, 1.5, hY + (vn(vec2(bxx * 0.9, 7.)) - 0.5) * 0.7)));
      // CARVED SURROUNDS on a church wall that stands out of the ice (the wall's top rides in its uv): a colonnette either side of every window with a
      // ring at its middle and a cap, an ogee head over the archivolt, and a painted dado: a brick-red band with a chain of white lozenges
      float wtop = floor(vUv.y / 64. + 0.01) * 0.25;
      float surK = step(0.03, fract(vM)) * step(fract(vM), 0.08) * side * step(4., wtop) * step(0.3, hY) * (1. - smoothstep(0.08, 0.3, fwB));
      if (surK > 0.001) {
        float bwid = max(mod(vUv.y, 64.), 1.6); float bx = vUv.x - floor(vUv.x / bwid + 0.5) * bwid; float ax = abs(bx);
        float y0 = wtop * 0.28 - 0.3, y1 = wtop * 0.7;
        float coln = (1. - smoothstep(0.1, 0.14, abs(ax - 1.12))) * step(y0, hY) * step(hY, y1 + 0.25);
        float ringc = (1. - smoothstep(0.16, 0.2, abs(ax - 1.12))) * max(1. - smoothstep(0.1, 0.14, abs(hY - (y0 + y1) * 0.5)), 1. - smoothstep(0.12, 0.16, abs(hY - y1 - 0.2)));
        float og = hY - y1; float ogee = step(0., og) * step(og, 1.9) * (1. - smoothstep(0.07, 0.12, abs(ax - 1.3 * pow(clamp(1. - og / 1.9, 0., 1.), 0.6))));
        float rel = max(max(coln, ringc), ogee);
        float shd = (1. - smoothstep(0.0, 0.14, abs(ax - 1.34))) * step(y0, hY) * step(hY, y1) * (1. - rel);
        alb = mix(alb, alb * 1.13 + 0.02, rel * surK); alb *= 1. - 0.3 * shd * surK;
        float dz = hY - 1.6; float dado = step(0., dz) * step(dz, 0.5);
        float loz = 1. - smoothstep(0.1, 0.14, abs(fract(bxx / 0.5) - 0.5) + abs(dz - 0.25) * 1.6);
        alb = mix(alb, mix(vec3(0.42, 0.13, 0.08), vec3(0.74, 0.72, 0.64), loz), dado * surK * 0.85);
      }
      // a drowned church's walls under the ice (flagged in the mat id): bays between lesenes, round-headed windows in one or two tiers, a string course,
      // silt banked at the foot: a building going down into the dark, never a pale pane lying in the water
      float bodyK = step(0.03, fract(vM)) * step(fract(vM), 0.08) * side * (1. - smoothstep(-1.2, -0.5, hY)) * (1. - smoothstep(0.25, 0.9, fwB));
      if (bodyK > 0.001) {
        float hb = hY + 11.; float bwid = max(mod(vUv.y, 64.), 1.6); float bay = floor(vUv.x / bwid + 0.5); float bx = vUv.x - bay * bwid;      // (uv: metres along the wall from its middle, the width of a bay)
        float wy1 = hb - 1.3, wy2 = hb - 6.0;
        float win = max(step(abs(bx), 0.5) * step(0., wy1) * step(wy1, 1.9), step(length(vec2(bx, wy1 - 1.9)), 0.5) * step(1.9, wy1));
        win = max(win, max(step(abs(bx), 0.5) * step(0., wy2) * step(wy2, 2.3), step(length(vec2(bx, wy2 - 2.3)), 0.5) * step(2.3, wy2)));
        float arch = max(step(length(vec2(bx, wy1 - 1.9)), 0.72) * step(1.9, wy1), step(length(vec2(bx, wy2 - 2.3)), 0.72) * step(2.3, wy2)) * (1. - win);
        float les = smoothstep(bwid * 0.5 - 0.36, bwid * 0.5 - 0.3, abs(bx)); float lsh = (1. - smoothstep(0.0, 0.16, abs(abs(bx) - (bwid * 0.5 - 0.46)))) * (1. - les);
        float strc = step(4.15, hb) * step(hb, 4.5), ssh = step(3.9, hb) * step(hb, 4.15);
        alb *= 1. + bodyK * (0.14 * max(les, strc) - 0.3 * max(lsh, ssh) * (1. - win) + 0.08 * arch);
        alb = mix(alb, vec3(0.025, 0.04, 0.065), win * bodyK);
        alb = mix(alb, alb * vec3(0.42, 0.5, 0.46), bodyK * (1. - win) * (1. - smoothstep(0.2, 2.6, hb + (vn(vec2(bxx * 0.7, 3.)) - 0.5) * 1.6)));
        glow = win * bodyK * ringAt(length(vW.xz)) * 0.3 * step(0.35, h21(vec2(bay + floor(vW.x * 0.05) * 3., floor(hb / 5.) + 7.)));      // (on the rare visit some of them are lit)
      }
      if (hY < -1. && pl > 0.5) glow = ringAt(length(vW.xz)) * 0.035 * (1. - smoothstep(0., 6., hY + 11.)) * side;       // (the square's lamps wash the foot of the tower's plinth)
      alb = mix(alb, vec3(0.77), max(smoothstep(0.55, 0.8, up), lip));
      alb = mix(alb, vec3(0.77), 0.85 * footRime(hY, bxx) * step(0., vW.y) * side);             // snow and rime banked against the foot of the wall: the line of the ice
      occ = 1. - 0.8 * cs * step(up, 0.5) * (1. - lip);
      // the cathedral's shadow on the bell tower: its walls and its five domes, cut out of the low sun on the tower's face across the lane
      if (dot(vW.xz, vW.xz) < 300. && vW.y > 0.) {
        float sl = max(length(uSun.xz), 1e-3); vec2 sd = uSun.xz / sl; float ty = uSun.y / sl;
        vec2 rc = vW.xz - vec2(-35.2, 13.9); vec2 cq = vec2(0.913 * rc.x - 0.408 * rc.y, 0.408 * rc.x + 0.913 * rc.y);
        vec2 cd = vec2(0.913 * sd.x - 0.408 * sd.y, 0.408 * sd.x + 0.913 * sd.y);
        vec2 cds = vec2(abs(cd.x) < 1e-3 ? 1e-3 : cd.x, abs(cd.y) < 1e-3 ? 1e-3 : cd.y);
        vec2 t1 = (vec2(-11.) - cq) / cds, t2 = (vec2(11.) - cq) / cds;
        float tn = max(min(t1.x, t2.x), min(t1.y, t2.y)), tf = min(max(t1.x, t2.x), max(t1.y, t2.y));
        float csh = step(max(tn, 0.), tf) * (1. - smoothstep(8.0, 8.8, vW.y + max(tn, 0.) * ty));
        csh = max(csh, domeSh(cq, cd, vW.y, ty, vec2(0.), 5., 15.4));
        csh = max(csh, max(domeSh(cq, cd, vW.y, ty, vec2(-6.82, -6.82), 3.5, 11.55), domeSh(cq, cd, vW.y, ty, vec2(6.82, -6.82), 3.5, 11.55)));
        csh = max(csh, max(domeSh(cq, cd, vW.y, ty, vec2(-6.82, 6.82), 3.5, 11.55), domeSh(cq, cd, vW.y, ty, vec2(6.82, 6.82), 3.5, 11.55)));
        occ = min(occ, 1. - 0.92 * csh); csK = csh;
      }
      // the tower's base tier: analytic raking shadows of the pilasters on the wall and of the reveal in the blind arch
      vec2 tl = vec2(0.3907 * vW.x + 0.9205 * vW.z, -0.9205 * vW.x + 0.3907 * vW.z);
      if (max(abs(tl.x), abs(tl.y)) < 9.6 && vW.y > 2.4 && vW.y < 16.3 && side > 0.5) {
        vec2 sl = vec2(0.3907 * uSun.x + 0.9205 * uSun.z, -0.9205 * uSun.x + 0.3907 * uSun.z);
        vec2 nl = vec2(0.3907 * N.x + 0.9205 * N.z, -0.9205 * N.x + 0.3907 * N.z);
        bool zf = abs(nl.y) > abs(nl.x);
        float fxl = zf ? tl.x : tl.y; float dn = zf ? abs(tl.y) : abs(tl.x);
        float snf = zf ? sl.y * sign(nl.y) : sl.x * sign(nl.x); float stf = zf ? sl.x : sl.y;
        if (snf > 0.02) {
          float k = clamp(stf / snf, -5., 5.), ky = clamp(uSun.y / snf, 0., 5.);
          float mid = fxl + 0.225 * k, hw = 0.5 + abs(0.225 * k);
          float d4 = min(min(abs(mid + 8.1), abs(mid + 6.3)), min(abs(mid - 6.3), abs(mid - 8.1)));
          float rk = (1. - smoothstep(hw - 0.07, hw + 0.07, d4)) * step(8.9, dn) * step(dn, 9.1);
          vec2 ap = vec2(fxl + 0.4 * k, vW.y + 0.4 * ky);
          float ad = ap.y > 9.9 ? length(vec2(ap.x, ap.y - 9.9)) - 3. : abs(ap.x) - 3.;
          rk = max(rk, smoothstep(-0.07, 0.07, ad) * step(8.5, dn) * step(dn, 8.8) * step(abs(fxl), 3.2));
          occ = min(occ, 1. - 0.88 * rk);
        }
      }
    } else if (m < 1.5) {                // gilt: fish-scale leaf, green at the seams
      vec2 sc = vec2(vUv.x * 40., vUv.y * 14.); sc.x += 0.5 * floor(sc.y); vec2 f = fract(sc) - vec2(0.5, 0.2);
      float seam = smoothstep(0.42, 0.5, length(f));
      alb = mix(alb, vec3(0.16, 0.26, 0.14), seam * 0.5 * step(0.01, vUv.y));      // (the look under the ice; above it giltLeaf, further down, sets the metal)
      spec = 0.;
    } else if (m < 2.5) {                // cobalt with rings of eight-pointed gilt stars
      vec2 st = vec2(fract(vUv.x * 8.) - 0.5, fract(vUv.y * 4.) - 0.5) * vec2(1., 1.25);
      float r = length(st); float a = atan(st.y, st.x + 1e-5);
      float star = 1. - smoothstep(0.0, 0.03, r - 0.13 - 0.1 * abs(cos(a * 4.)));
      alb = mix(alb, vec3(0.83, 0.45, 0.04), star); spec = star + 0.15;
    } else if (m < 3.5) {                // lead ribs / aspen shingles, snow packed on the windward flank
      alb *= 0.75 + 0.25 * smoothstep(0.1, 0.3, abs(fract(vUv.x * 16.) - 0.5)) * (0.8 + 0.2 * step(0.5, fract(vW.y * 2.)));
      float dry = step(0., vW.y);                                                             // (no snow lies on a roof under the ice: there it is dark, weed-grown timber in courses)
      float wsn = smoothstep(0.15, 0.6, dot(N, vec3(-0.75, 0.3, 0.59)) + (vn(vec2(vW.y * 1.3, tq * 0.9)) - 0.5) * 0.7) * dry;
      alb = mix(alb, vec3(0.77), max(smoothstep(0.6, 0.85, up) * 0.8 * dry, wsn * 0.7)); spec = 0.25 * (1. - wsn);
      alb *= mix(0.42 * (0.7 + 0.3 * step(0.35, fract(hY * 1.6))) * (0.8 + 0.4 * vn(vec2(vUv.x * 60., hY * 2.))), 1., dry);
    } else if (m < 4.5) { alb *= 0.8 + 0.2 * vn(vW.xz * 0.7);
    } else if (m < 5.5) {                // upthrust ice slab: turquoise, glows where thin
      float t1 = clamp(1. - abs(dot(N, V)), 0., 1.);
      alb = mix(vec3(0.03, 0.16, 0.22), vec3(0.5, 0.86, 0.9), t1 * t1);                       // dark glassy core, bright rim
      alb *= 0.7 + 0.6 * vn(vW.xz * 1.7 + vW.y * 2.3); alb *= 0.85 + 0.3 * vn(vW.xy * 5.3 + vW.z * 4.1);
      float fi = floor(fq * 0.8);                                                             // white fracture planes at irregular spacings (a hash per plane)
      alb += 0.3 * step(0.62, h21(vec2(fi, 7.))) * (1. - smoothstep(0.03, 0.09, abs(fract(fq * 0.8) - 0.5))) * (1. - smoothstep(0.1, 0.4, fwQ));
      alb = mix(alb, vec3(0.42, 0.62, 0.66), 0.5 * smoothstep(0.5, 0.8, fb(vW.xz * 1.1 + vW.y * 1.7 + 4.)));     // milky, bubbled ice clouding the glass
      float back = max(dot(-V, uSun), 0.);
      emis = vec3(0.35, 0.85, 0.9) * uSunCol * (uSunK * 0.3183 * 0.5) * back * back * (1. - smoothstep(-0.2, 0.3, dot(N, uSun)));   // the sun coming through, brightest where the slab is thin
      emis *= (0.25 + 1.1 * vn(vW.xy * 2.3 + vW.z * 1.9) * vn(vW.xz * 4.7 + vW.y * 3.1 + 5.)) * (1. - 0.5 * step(0.8, fract(fq * 0.45)) * (1. - smoothstep(0.2, 0.8, fwQ)));
      alb = mix(alb, vec3(0.77), smoothstep(0.2, 0.55, up + (vn(vW.xz * 2.1) - 0.5) * 0.3)); spec = 0.5 * t1 * t1 * (1. - smoothstep(0.2, 0.55, up));
      float icl = step(0.95, vC.r);                                                           // (an icicle: clear pale ice with a bright rim)
      alb = mix(alb, mix(vec3(0.5, 0.64, 0.76), vec3(0.86, 0.94, 1.0), t1), icl); emis *= 1. + icl; spec = mix(spec, 0.9, icl);
    } else if (m < 6.5) {                // snow: wind-sculpted, combed along the wind into ridges (sastrugi), never a smooth pale blade
      alb *= 0.93 + 0.07 * vn(vW.xz * 2.3);
      vec2 ws = vec2(dot(vW.xz, vec2(0.788, -0.616)), dot(vW.xz, vec2(0.616, 0.788)));
      float rip = vn(vec2(ws.x * 0.3, ws.y * 2.2 + vW.y * 3.)) * 0.6 + vn(vec2(ws.x * 1.1 + 3., ws.y * 6. + vW.y * 7.)) * 0.4;
      float rpk = (1. - smoothstep(0.3, 2.5, fwP)) * step(0.02, vW.y);
      alb *= mix(1., 0.5 + 0.85 * rip, rpk);
      alb = mix(alb, alb * vec3(0.56, 0.7, 1.0), 0.75 * rpk * (1. - smoothstep(0.28, 0.56, rip)));      // (cobalt in the troughs between the wind ridges)
    } else if (m < 7.5) {                // roofs under the ice, silted pale: plank roofs, and one house in three under sheet iron (rust red or green)
      vec2 nh = N.xz / max(length(N.xz), 1e-3); float alongR = dot(vW.xz, vec2(-nh.y, nh.x));      // metres along the ridge
      float iron = max(step(vC.b * 1.5, vC.r), step(vC.r * 1.25, vC.g));                            // (flagged by the roof's own colour)
      float slope = step(0.25, abs(up));
      alb *= vec3(1.2, 1.27, 1.27); alb *= 0.8 + 0.4 * vn(vW.xz * 0.5);        // (silted pale, as the town always was: the ridge cap, the silt in the lee and the courses lie on it)
      float rl = 1. - smoothstep(0.25, 0.9, fwP * 2.2); float rl2 = 1. - smoothstep(1.2, 5., fwP * 2.2);
      if (iron > 0.5) {                  // sheet iron: standing seams up the slope, rust running down the sheets, a sheet gone here and there
        float sm = abs(fract(alongR / 0.75) - 0.5);
        alb *= 1. - rl * 0.5 * (1. - smoothstep(0.03, 0.09, sm)) * slope; alb *= 1. + rl * 0.22 * smoothstep(0.38, 0.46, sm) * slope;
        alb *= 0.72 + 0.56 * vn(vec2(alongR * 0.9, vUv.y * 2.3));
        alb = mix(alb, vec3(0.3, 0.13, 0.07), 0.45 * smoothstep(0.5, 0.8, vn(vec2(alongR * 2.3 + 3., vUv.y * 1.1))) * rl2);
        alb *= 1. - 0.25 * rl2 * (1. - smoothstep(0.0, 0.08, abs(fract(vUv.y * 2.) - 0.5))) * slope;        // the lap between the two rows of sheets
        alb = mix(alb, vec3(0.02, 0.028, 0.035), 0.9 * rl * step(0.955, h21(vec2(floor(alongR / 0.75), floor(vUv.y * 2.) + 3.))) * slope);
      } else {                           // boards: courses that hold to 80 m (a dark shadow line under each lap, pale silt on the ledge above it), a board lost here and there
        float bd = alongR * 2.2; vec2 bc = vec2(floor(bd), floor(vUv.y * 3.));
        alb *= 0.8 + 0.2 * step(0.2, fract(bd));
        float lapF = fract(vUv.y * 4.), lapI = floor(vUv.y * 4.);
        alb *= 1. - rl2 * (0.62 * (1. - smoothstep(0.0, 0.2, lapF)) * step(0.26, vUv.y) + 0.16 * (h21(vec2(lapI, floor(vW.x * 0.07) + floor(vW.z * 0.07))) - 0.5));
        alb = mix(alb, vec3(0.86, 0.9, 0.9), 0.42 * rl2 * smoothstep(0.72, 0.95, lapF) * step(vUv.y, 0.74));
        alb *= 1. - 0.3 * rl * (1. - smoothstep(0.0, 0.1, fract(vUv.y * 3.))) * step(0.34, vUv.y);
        alb *= 1. + rl * 0.3 * (h21(bc + 1.3) - 0.5);
        alb = mix(alb, vec3(0.02, 0.028, 0.035), 0.9 * rl * step(0.93, h21(bc + 5.7)) * step(0.06, fract(vUv.y * 3.)) * step(vUv.y, 0.95));
      }
      alb *= 0.35 + 0.65 * smoothstep(0.0, 0.12, vUv.y);                              // dark eaves
      // the ridge: a capping board pale with silt, a dark line of shadow under it; pale silt drifted in the lee of the ridge like snow
      alb *= 1. - 0.55 * rl2 * smoothstep(0.83, 0.87, vUv.y) * (1. - smoothstep(0.89, 0.92, vUv.y)) * slope;
      alb = mix(alb, vec3(0.8, 0.86, 0.9), (0.35 + 0.5 * rl2) * smoothstep(0.91, 0.94, vUv.y));
      alb = mix(alb, vec3(0.86, 0.9, 0.9), 0.45 * smoothstep(0.52, 0.8, fb(vW.xz * 0.35 + 2.)) * smoothstep(0.1, 0.5, vUv.y));
    } else if (m < 8.5) {                // the bed: black streets, pale yards, drowned-grass squares (grid aligned to the main street)
      vec2 ab = gridAB(vW.xz);
      float street = 1. - smoothstep(6., 8., abs(mod(ab.y + 25., 50.) - 25.));
      street = max(street, 1. - smoothstep(5., 7., abs(mod(ab.x + 48., 96.) - 48.)));
      float chd = dot(vW.xz - vec2(-25., 125.), vec2(0.42, -0.908)) / 16.; float ch = exp(-chd * chd);
      // yards: one plot per house, each its own tint, a dark fence line round it, furrows in every other one
      vec2 pc = vec2((ab.x + 148.) / 16., (ab.y + 25.) / 25.); vec2 pid = floor(pc); vec2 pf = fract(pc);
      float fl = min(min(pf.x, 1. - pf.x) * 16., min(pf.y, 1. - pf.y) * 25.); float ph = h21(pid + 1.7);
      vec3 yard = alb * 1.6 * (0.8 + 0.4 * ph) * (0.9 + 0.2 * vn(vW.xz * 0.6));
      yard *= 1. - 0.12 * step(0.5, ph) * step(0.5, fract(ab.x * 0.7)) * (1. - smoothstep(0.3, 1.2, fwP));
      yard *= 1. - 0.75 * (1. - smoothstep(0.15, 0.3 + fwP, fl)) * (1. - smoothstep(1., 4., fwP));
      alb = mix(yard, vec3(0.012, 0.014, 0.016), max(street * 0.92, ch));
      float sq = 1. - smoothstep(0., 2., max(abs(ab.x - 334.) - 37., abs(ab.y) - 13.5));
      sq = max(sq, 1. - smoothstep(30., 37., length(vW.xz)));
      vec3 grass = vec3(0.4, 0.46, 0.3) * (0.7 + 0.6 * vn(vW.xz * 1.3)) * (0.8 + 0.2 * step(0.25, fract(ab.x * 0.5)) * step(0.25, fract(ab.y * 0.5)));
      float tsq = 1. - smoothstep(30., 37., length(vW.xz));                                // (the cathedral square round the tower is cobbled: setts in courses, worn pale down the middle of each lane)
      vec3 cob = vec3(0.4, 0.4, 0.37) * (0.75 + 0.5 * vn(vW.xz * 0.9)) * (0.72 + 0.28 * step(0.16, fract(ab.x * 1.2 + 0.5 * floor(ab.y * 1.2))) * step(0.16, fract(ab.y * 1.2)) * (1. - smoothstep(0.5, 1.6, fwP)))
        * (0.85 + 0.3 * h21(floor(vec2(ab.x * 1.2 + 0.5 * floor(ab.y * 1.2), ab.y * 1.2))));
      grass = mix(grass, cob, tsq);
      alb = mix(alb, grass, sq * (1. - ch));
      // the lime avenue on its rise of ground: pale gravel between dark verges, drowned grass under the trees
      float avz = abs(vW.z + 44.); float avk = smoothstep(-304., -299., vW.x) * (1. - smoothstep(-56., -50., vW.x)) * (1. - smoothstep(15., 19., avz));
      vec3 gravel = vec3(0.62, 0.66, 0.6) * (0.82 + 0.36 * vn(vW.xz * 2.7)) * (0.9 + 0.1 * step(0.3, fract(vW.x * 0.5)));
      gravel *= 0.86 + 0.14 * smoothstep(0.3, 0.9, abs(avz - 1.6));                    // two wheel ruts
      vec3 avg = vec3(0.34, 0.42, 0.3) * (0.7 + 0.6 * vn(vW.xz * 0.9)) * (0.85 + 0.3 * vn(vW.xz * 4.3));
      vec3 avc = mix(gravel, vec3(0.02, 0.025, 0.03), smoothstep(4.2, 4.6, avz));
      avc = mix(avc, avg, smoothstep(6.3, 6.9, avz));
      alb = mix(alb, avc, avk);
      float front = abs(mod(ab.y + 25., 50.) - 25.) - 7.6;
      float ha = mod(ab.x + 148., 16.) - 8.; float wc = (fract(ha / 4.17 + 0.5) - 0.5) * 4.17;
      float hk = step(12., abs(mod(ab.x + 48., 96.) - 48.)) * step(24., abs(ab.x - 423.)) * step(44., length(vW.xz - vec2(-60., 200.))) * step(36., length(vW.xz));   // (only where houses stand)
      glow = exp(-front * front * 0.3) * exp(-wc * wc * 0.5) * step(abs(ha), 6.25) * litAt(vW.xz) * 0.17 * (1. - avk) * hk * step(0.22, h21(pid + 5.3));   // window light lying in pools on the street
      vec2 av = vec2(mod(vW.x + 67.8, 11.6) - 5.8, abs(vW.z + 44.) - 6.);
      glow += exp(-dot(av, av) * 0.09) * step(-300., vW.x) * step(vW.x, -52.) * ringAt(length(vW.xz)) * 0.45;   // pools under the avenue lamps
      vec2 sp = mod(vW.xz + 9., 18.) - 9.;                                                  // (the squares are lit in pools under their lamps, not evenly)
      glow += sq * ringAt(length(vW.xz)) * (0.008 + 0.075 * exp(-dot(sp, sp) * 0.035));
    } else if (m < 9.5) {                // plain
    } else if (m < 10.5) {               // faded fresco: ochre, terracotta and blue blotches under a chalk bloom
      alb = mix(vec3(0.62, 0.3, 0.17), vec3(0.16, 0.3, 0.58), smoothstep(0.38, 0.62, vn(vec2(vW.z * 0.6, vW.y * 0.9))));
      alb = mix(alb, vec3(0.78, 0.58, 0.2), smoothstep(0.5, 0.75, vn(vec2(vW.z * 1.4 + 5., vW.y * 1.8))));
      alb *= 0.75 + 0.25 * step(0.12, abs(fract(vW.z * 0.45) - 0.5) * 2.);
      alb = mix(alb, vec3(0.8, 0.8, 0.76), 0.2 + 0.35 * vn(vW.zy * 2.6));
    } else if (m < 11.5) {               // log wall: courses, white carved frames, an eaves board; the panes light with the lamp ring
      alb *= 0.7 + 0.3 * step(0.3, fract(vUv.y * 9.));
      vec2 wq = vec2(abs(fract(vUv.x * 3.) - 0.5), vUv.y);
      float fr = (1. - smoothstep(0.23, 0.26, wq.x)) * smoothstep(0.27, 0.3, wq.y) * (1. - smoothstep(0.76, 0.79, wq.y));
      float pane = (1. - smoothstep(0.14, 0.16, wq.x)) * smoothstep(0.36, 0.38, wq.y) * (1. - smoothstep(0.67, 0.69, wq.y));
      pane *= smoothstep(0.012, 0.03, wq.x) * smoothstep(0.01, 0.025, abs(wq.y - 0.53));                  // glazing bars
      alb = mix(alb, vec3(0.74, 0.76, 0.72), fr * side); alb = mix(alb, vec3(0.02, 0.03, 0.04), pane * side);
      alb = mix(alb, vec3(0.66, 0.68, 0.64), smoothstep(0.9, 0.93, vUv.y) * side);
      float wid = h21(vec2(floor(vUv.x * 3.) + floor(vW.x * 0.09) * 7., floor(vW.z * 0.09)));
      glow = pane * side * max(litAt(vW.xz) * step(0.22, wid) * (0.55 + 0.45 * wid), uWinK * step(0.86, wid));   // (a few panes are lit whatever the hour: someone is still home)
    } else if (m < 12.5) {               // street lamp head
      glow = max(ringAt(length(vW.xz)) * 1.6, step(0.6, vC.r) * uWinK * 0.8);      // (a dormer's lit pane is flagged by its colour)
    } else if (m < 13.5) {               // lantern, lit canvas (above the ice): light running over the drumming canvas
      if (vC.b > 0.2) alb *= 1. + 0.16 * sin(clamp(vUv.x, 0., 1.) * 3.14159) * sin(clamp(vUv.y, 0., 1.) * 3.14159) * sin(uTime * 11. + vW.x * 3. + vW.y * 4.);
    } else if (m < 14.5) {               // market arcade: white wall, dark arched openings
      vec2 ab = gridAB(vW.xz); float al = abs(dot(N.xz, vec2(0.42, -0.908))) > 0.7 ? ab.y : ab.x;
      float ax = (fract(al / 4.35 + 0.5) - 0.5) * 4.35; float hy = hY + 11.;
      float inA = max(step(abs(ax), 1.45) * step(hy, 2.7), step(length(vec2(ax, hy - 2.7)), 1.45) * step(2.7, hy)) * side;
      alb = mix(alb, vec3(0.012, 0.016, 0.022), inA);
      float lampA = exp(-(ax * ax + (hy - 1.7) * (hy - 1.7)) * 2.6);                    // a lamp hung in the arch: a warm core, the arch dark round it
      glow = inA * ringAt(length(vW.xz)) * (0.35 + 0.3 * h21(vec2(floor(al / 4.35 + 0.5), 2.))) * lampA;      // (the arcade's lamps come on with the town's windows, on the rare visit)
    } else if (m < 15.5) {               // bridge stone: ashlar, three arched openings between the piers
      vec2 ab = gridAB(vW.xz); float bx = mod(ab.x - 402., 14.) - 7.; float by = hY + 8.4;
      float open = by < 0. ? step(abs(bx), 4.6) : step(length(vec2(bx, by)), 4.6);
      if (open > 0.5 && abs(ab.x - 423.) < 21. && abs(up) < 0.5) discard;
      alb *= 0.78 + 0.22 * vn(vW.xz * 1.1 + vW.y * 0.7); alb *= 0.85 + 0.15 * step(0.1, fract(hY * 1.6));
      // built stone, not a card with a hole in it: darker under the ice, a paler ring of voussoirs with their joints round each opening, a dark soffit
      alb *= 0.7;
      float vr = length(vec2(bx, max(by, 0.))); float vous = (1. - smoothstep(0.26, 0.4, abs(vr - 4.95))) * step(abs(ab.x - 423.), 21.) * step(abs(up), 0.5) * step(-5.5, by);
      alb *= 1. + vous * (0.3 + 0.3 * step(0.14, fract(atan(max(by, 0.) + 1e-4, bx + 1e-4) * 3.5)));
      if (up < -0.5 || (abs(up) < 0.5 && abs(dot(N.xz, vec2(0.42, -0.908))) > 0.7)) alb *= 0.4;
      if (up > 0.5) { float pr = floor(ab.x * 0.8); alb *= (0.7 + 0.3 * step(0.1, fract(ab.x * 0.8))) * (0.8 + 0.2 * step(0.08, fract(ab.y * 0.7 + 0.5 * pr))) * (0.85 + 0.3 * h21(vec2(pr, floor(ab.y * 0.7 + 0.5 * pr)))); }
    } else if (m < 16.5) {               // spruce bough: ragged skirts, needle streaks, snow packed on the windward flank
      float rag = 0.15 + 0.4 * h21(vec2(floor(vUv.x * 26.), floor(vW.y * 1.4) + 3.));
      if (vUv.y < rag) discard;
      alb *= 0.5 + 1.0 * vn(vec2(vUv.x * 46., vUv.y * 5. + vW.y));
      alb *= 0.55 + 0.45 * smoothstep(rag, rag + 0.3, vUv.y);
      float wsn = smoothstep(0.2, 0.65, dot(N, vec3(-0.75, 0.3, 0.59)) + (vn(vec2(vUv.x * 9., vW.y * 2.3)) - 0.5) * 0.9);
      alb = mix(alb, vec3(0.77), wsn * 0.75);
    } else if (m < 17.5) {               // stay chain: links, hoar on the upper side
      alb *= 0.6 + 0.4 * step(0.5, fract(vUv.y * 9.));
      alb = mix(alb, vec3(0.77), 0.45);
    } else if (m > 18.5 && m < 19.5) {   // green copper, verdigris running down it, gilt ribs on the meridians
      float rib = 1. - smoothstep(0.035, 0.07, abs(fract(vUv.x * 16.) - 0.5));
      alb *= 0.72 + 0.5 * vn(vec2(vUv.x * 70., vUv.y * 7.)); alb = mix(alb, vec3(0.5, 0.78, 0.66), 0.25 * smoothstep(0.55, 0.9, vn(vec2(vUv.x * 23. + 4., vUv.y * 3.))));
      alb = mix(alb, vec3(0.83, 0.5, 0.08), rib); spec = rib + 0.1;
    } else if (m > 19.5 && m < 20.5) {   // silver aspen shingles in stepped courses, each a little its own grey
      vec2 sc = vec2(vUv.x * 36., vUv.y * 16.); sc.x += 0.5 * floor(sc.y); vec2 f = fract(sc);
      alb *= (0.58 + 0.42 * smoothstep(0.0, 0.55, f.y)) * (0.84 + 0.16 * step(0.09, f.x)) * (0.82 + 0.36 * h21(floor(sc) + 2.3)); spec = 0.22;
    } else if (m > 20.5 && m < 21.5) {   // a wall of the massed city: storeys of round-headed windows between lesenes, a string course over each storey
      float top = floor(vUv.y + 0.02), bw = fract(vUv.y + 0.02) * 16., sth = 2. + clamp(vM - 21., 0., 0.45) * 40.;
      float dn = mod(max(top - hY, 0.), sth);                                       // metres down from the top of this storey
      if (bw < 0.4) {                    // a kremlin wall: swallowtail merlons cut out of its top, a walk shadow under them, weather stains
        float mq = fract(vUv.x / 3.2);
        if (hY > top - 1.6 && (mq > 0.6 || (hY > top - 0.55 && abs(mq - 0.3) < 0.085))) discard;
        alb *= 1. - 0.3 * side * step(top - 2.15, hY) * step(hY, top - 1.6);                 // the shadow under the wall walk
        alb *= 1. + 0.08 * side * step(top - 2.6, hY) * step(hY, top - 2.15);
        alb *= 1. - 0.14 * side * smoothstep(0.4, 0.8, vn(vec2(vUv.x * 0.9, hY * 0.07)));
        alb *= 0.9 + 0.1 * step(0.14, fract(hY * 1.1)) * (1. - smoothstep(0.1, 0.5, fwY));
        alb = mix(alb, alb * vec3(0.6, 0.66, 0.62), side * (1. - smoothstep(0., 2.2, hY + (vn(vec2(vUv.x * 0.5, 2.)) - 0.5) * 1.6)) * step(0., hY));
      } else {
        float bx = vUv.x - floor(vUv.x / bw + 0.5) * bw; float ww = min(0.2 * bw, 1.15);
        float y0 = 0.36 * sth, y1 = 0.76 * sth;
        float win = max(step(abs(bx), ww) * step(y0, dn) * step(dn, y1), step(length(vec2(bx, dn - y0)), ww) * step(dn, y0));
        float arch = step(length(vec2(bx, dn - y0)), ww + 0.4) * step(dn, y0) * (1. - win);
        float les = smoothstep(bw * 0.5 - 0.42, bw * 0.5 - 0.34, abs(bx));
        float lsh = (1. - smoothstep(0., 0.22, abs(abs(bx) - (bw * 0.5 - 0.56)))) * (1. - les);
        float band = step(dn, 0.5), bsh = step(0.5, dn) * step(dn, 0.95);
        float kf = side * (1. - smoothstep(0.5, 2.4, fwB / ww));                    // (gone where a window is finer than a pixel: the wall keeps its average)
        alb *= 1. + kf * (0.1 * max(les, band) - 0.26 * max(lsh, bsh) * (1. - win) + 0.07 * arch);
        alb = mix(alb, vec3(0.035, 0.05, 0.085), win * kf);
        alb *= 1. - 0.13 * (1. - kf) * side;
        alb *= 1. - 0.1 * side * smoothstep(0.45, 0.8, vn(vec2(vUv.x * 0.8 + top, hY * 0.06)));      // weather stains
        alb *= mix(1., 0.8 + 0.2 * smoothstep(0., 5., hY), side * step(0., hY));                     // darker and damp toward the ice
        cglow = win * kf * step(0.8, h21(vec2(floor(vUv.x / bw + 0.5) + top * 3.1, floor((top - hY) / sth) + 1.7)));   // a few panes lit at dawn, dusk and by night
      }
      alb = mix(alb, vec3(0.77), smoothstep(0.55, 0.8, up));
      alb = mix(alb, alb * vec3(0.46, 0.53, 0.56), 0.8 * step(0., vW.y) * side * (1. - smoothstep(0.95, 1.5, hY + (vn(vec2(bxx * 0.9, 7.)) - 0.5) * 0.7)));      // the tide line
      alb = mix(alb, vec3(0.77), 0.85 * footRime(hY, vUv.x) * step(0., vW.y) * side);
    } else if (m > 21.5 && m < 22.5) {   // a drum: eight slit windows between flat pilasters, a cornice ring under the dome
      float sl = abs(fract(vUv.x * 8.) - 0.5); float kf = side * (1. - smoothstep(0.015, 0.07, fwU * 8.));
      float win = step(sl, 0.12) * step(0.4, vUv.y) * step(vUv.y, 0.82);
      if (fract(vM + 0.01) > 0.1) {      // a wall tower's shaft: two staggered rows of arrow slits, machicolation under the gallery, courses, a damp foot
        float rowA = step(0.34, vUv.y) * step(vUv.y, 0.47), rowB = step(0.62, vUv.y) * step(vUv.y, 0.75);
        win = step(abs(fract(vUv.x * 6. + 0.5 * rowB) - 0.5), 0.08) * max(rowA, rowB);
        alb *= 1. - 0.45 * step(0.9, vUv.y) * step(0.5, fract(vUv.x * 18.)) * kf - 0.14 * step(0.86, vUv.y) * step(vUv.y, 0.9);
        alb *= 0.9 + 0.1 * step(0.14, fract(hY * 1.1)) * (1. - smoothstep(0.1, 0.5, fwY));
        alb = mix(alb, alb * vec3(0.6, 0.66, 0.62), side * (1. - smoothstep(0., 2.4, hY)) * step(0., hY));
      } else
      alb *= 1. + kf * (0.08 * step(0.36, sl) - 0.12 * step(0.3, sl) * step(sl, 0.36)) + 0.07 * step(0.92, vUv.y) - 0.14 * step(0.86, vUv.y) * step(vUv.y, 0.92);
      alb = mix(alb, vec3(0.035, 0.05, 0.085), win * kf); alb *= 1. - 0.08 * (1. - kf);
      cglow = win * kf * step(0.72, h21(vec2(floor(vUv.x * 8.), floor(vW.x * 0.3) + floor(vW.z * 0.3))));
      alb = mix(alb, alb * vec3(0.46, 0.53, 0.56), 0.8 * step(0., vW.y) * side * (1. - smoothstep(0.95, 1.5, hY + (vn(vec2(bxx * 0.9, 7.)) - 0.5) * 0.7)));      // the tide line
      alb = mix(alb, vec3(0.77), 0.85 * footRime(hY, bxx) * step(0., vW.y) * side);
    } else if (m > 22.5 && m < 23.5) {   // a frieze of glazed tiles in a moulded frame: green, ochre, cobalt and cream, a rosette in each
      vec2 tq2 = vec2(bxx, hY) / 0.42; vec2 ti = floor(tq2), tf = fract(tq2) - 0.5; float th = h21(ti + 1.7);
      float lodT = (1. - smoothstep(0.15, 0.7, (fwB + fwY) / 0.42)) * side;
      vec3 tc = th < 0.3 ? vec3(0.08, 0.34, 0.2) : th < 0.55 ? vec3(0.72, 0.48, 0.1) : th < 0.8 ? vec3(0.07, 0.19, 0.5) : vec3(0.7, 0.68, 0.6);
      float ros = 1. - smoothstep(0.0, 0.04, length(tf) - 0.2 - 0.09 * cos(atan(tf.y, tf.x + 1e-5) * 4.));
      vec3 tile = mix(tc, th < 0.55 ? vec3(0.78, 0.74, 0.62) : vec3(0.76, 0.48, 0.09), ros);
      tile *= 1. - 0.6 * smoothstep(0.42, 0.5, max(abs(tf.x), abs(tf.y)));
      alb = mix(vC, tile, lodT); spec = 0.3 * lodT;
    }                                    // (18: shutters and gates are plain; 24: a perched crow)
    vec3 col;
    if (vW.y < -0.02) {                  // under the ice: refracted sun 48 deg off vertical, light ribbons, absorption
      vec3 Lw = normalize(vec3(-0.72, 0.6, 0.2));   // refracted sun, swung west so the roof slopes along the main street part
      float ndl = max(dot(N, Lw), 0.);
      float rib = vn(vW.xz * 0.21 + vec2(uTime * 0.11, -uTime * 0.07)); rib = 1. - abs(rib * 2. - 1.); rib = rib * rib * rib * rib;
      float rib2 = vn(vW.xz * 0.33 - vec2(uTime * 0.09, uTime * 0.05) + 7.); rib2 = 1. - abs(rib2 * 2. - 1.); rib *= rib2 * rib2 * 2.2;
      col = alb * (uSunCol * (uSunK * 0.5 * ndl * (0.75 + 1.9 * rib * max(up, 0.))) + vec3(0.085, 0.13, 0.19) * (uHemiK * 0.5556 * uUnderK) * (0.55 + 0.45 * up));
      // white walls just under the ice take the sky's light through it and lose it with depth: plinth, drums and gate are seen going down into the dark
      if (lw) { col *= mix(1., exp(hY * 0.06), side);      // (and the sun reaches less of a wall the deeper it stands)
        col += alb * vec3(0.25, 0.4, 0.5) * (uHemiK * 0.5556) * exp(hY * mix(0.25, 0.5, step(0.5, uGlowK))) * side; }
      col *= vec3(0.64, 0.84, 1.0);
      float apr = smoothstep(-10., 40., vW.z);                                             // the town along the main street (the lime avenue of the last run keeps its paler bed)
      if (m > 6.5 && m < 7.5) col *= mix(vec3(1.38, 1.24, 1.08), vec3(1.34, 1.23, 1.09), apr);                               // (the pale roofs are what tells the town: sunlit slopes warm against the blue)
      float pathLen = -vW.y * (1. + 0.15 / max(V.y, 0.2)) + dist * 0.004;
      // THE TOWN LIES BELOW THE SURFACE: the water takes the red first and the green next, so roofs and walls go a little bluer and dimmer with
      // depth, but lightly: the brief's town is 'pale silted roofs on black streets, big legible shapes (rows, square, arcade, bridge)', and at
      // the full strength of round 11 (0.12, 0.07, 0.022) the rows and the arcade no longer read
      col *= mix(vec3(1.), exp(-clamp(pathLen, 0., 60.) * vec3(0.05, 0.028, 0.009)) * 0.96, apr);
      col = mix(uDeep * 0.9, col, exp(-pathLen * 0.105));
      col += vec3(1.0, 0.5, 0.13) * glow * mix(5.5, 7.5, apr) * exp(-pathLen * 0.045);
    } else {
      if (uRime > 0.001) {               // hoar morning: everything furred white on its upper and windward sides
        float rm = uRime * smoothstep(0.25, 0.9, 0.6 * up + 0.4 * dot(N, vec3(-0.75, 0., 0.59)) + 0.25 * (vn(vW.xz * 7. + vW.y * 9.) - 0.5));
        float rw = m > 23.5 ? 0. : ((m > 0.5 && m < 2.5) || (m > 18.5 && m < 20.5)) ? uRimeW : ((m > 8.5 && m < 9.5) || (m > 12.5 && m < 13.5)) ? 0.2 : 0.8;   // light on gilt, stars, yachts and lanterns, none on a bird
        alb = mix(alb, vec3(0.77), rm * rw); spec *= 1. - rm * rw * 0.6; rmK = rm * rw;
      }
      float ndl = max(dot(N, uSun), 0.);
      if (m > 5.5 && m < 6.5) ndl = 0.34 + 0.66 * ndl;      // (snow scatters the low sun through itself: a bank is white on top like the drifts the ice shader lays, blue only in its lee)
      vec3 hemi = mix(uGnd, uSky, 0.5 + 0.5 * up) * uHemiK + uHor * 0.5 * max(-up, 0.) + uGnd * 0.35 * (1. - abs(up));
      // (the light thrown up off the ice wavers on the walls as the blown snow crosses it: slow soft ripples, never a flicker)
      float wv = vn(vec2(bxx * 0.3 + uTime * 0.36, hY * 0.42 - uTime * 0.5)) * 0.6 + vn(vec2(bxx * 0.8 - uTime * 0.45, hY * 1.1 + uTime * 0.3) + 3.7) * 0.4;
      // (and the spindrift streaming off the cornices throws soft travelling shadows on the sunlit faces: strongest in the lane by the tower)
      float sdw = smoothstep(0.42, 0.78, vn(vec2(bxx * 0.22 - uTime * 0.8, hY * 0.3 + uTime * 0.42)) * 0.65 + vn(vec2(bxx * 0.6 - uTime * 1.5, hY * 0.75 + uTime * 0.7) + 5.1) * 0.35);
      if (lw) occ *= 1. - sdw * mix(0.07, 0.24, 1. - smoothstep(50., 90., length(vW.xz))) * (1. - abs(up));
      if (lw) hemi += uSunCol * uSunK * (1. - abs(up)) * max(1. - smoothstep(0., 0.5, ndl), 0.7 * csK)
        * (0.3 * (1. - smoothstep(0., 30., vW.y)) + 0.22 * (1. - smoothstep(0., 7., vW.y))) * (0.6 + 0.8 * wv);           // sun bounced up off the ice onto the shaded faces
      // the rare visit: the lamps of the drowned square burn under the ice and throw a warm wavering light up the feet of the tower and the cathedral
      if (m < 0.5) hemi += vec3(1.0, 0.5, 0.17) * 2.6 * ringAt(length(vW.xz)) * (1. - abs(up)) * (1. - smoothstep(0.5, 12., vW.y)) * (1. - smoothstep(40., 56., length(vW.xz))) * (0.3 + 1.5 * wv * wv);
      if (m < 0.5) { vec2 rc2 = vW.xz - vec2(-35.2, 13.9);       // the tower's sunlit face throws its light back across the lane onto the cathedral's shaded wall
        hemi += uSunCol * uSunK * 0.2 * max(dot(N, vec3(0.913, 0., -0.408)), 0.) * (1. - smoothstep(15., 21., length(rc2))) * (0.4 + 0.6 * smoothstep(0., 9., vW.y)); }
      col = alb * (uSunCol * uSunK * ndl * occ + hemi * (0.7 + 0.3 * occ)) * 0.3183;
      vec3 pd = vW - vec3(-300., 2.6, -44.); float spill = 1. - smoothstep(4., 12.5, length(pd));
      col += alb * vec3(0.72, 0.86, 1.0) * spill * 0.55;                                                // the portal's light on the vault and the snow sill
      if (m > 12.5 && m < 13.5) {                                                                       // lanterns; canvas lit from inside by the stove
        vec2 tc = vW.xz - vec2(-198., 526.); float along = dot(tc, vec2(0.13, -0.99));
        float cg = exp(-dot(tc, tc) * 0.16) * (1. - 0.75 * smoothstep(0.2, 2.5, vW.y)) * (0.9 + 0.1 * sin(uTime * 7.) * sin(uTime * 2.3 + 1.));
        cg *= (0.75 + 0.25 * vn(vW.xy * 2.1 + vW.z)) * (0.6 + 0.4 * smoothstep(0.04, 0.1, abs(fract(along * 0.9 + 0.5) - 0.5)));
        col += vec3(1.0, 0.5, 0.16) * uGlowK * mix(4., 2.5 * cg + 0.12, step(0.2, vC.b));
      }
      col += emis * (1. - 0.6 * smoothstep(0.2, 0.55, up));
      col += vec3(1.0, 0.55, 0.16) * cglow * uGlowK * 2.4;                                              // the city's lit panes
      if (spec > 0.) {
        vec3 env = mix(uHor, uZen, smoothstep(0., 0.7, R.y) * 0.8); if (R.y < 0.) env = mix(uHor, vec3(0.05, 0.1, 0.16), smoothstep(0., 0.3, -R.y));
        float fr0 = clamp(1. - dot(N, V), 0., 1.); float fr = 0.6 + 0.4 * fr0 * fr0 * fr0;
        float hl = pow(max(dot(R, uSun), 0.), 90.) * 9. + pow(max(dot(R, uSun), 0.), 12.) * 1.3;
        vec3 mcol = (m < 2.5 || (m > 18.5 && m < 19.5)) ? vec3(1.0, 0.72, 0.28) : vec3(0.8, 0.9, 1.0);
        vec3 metal = mcol * (env * 1.25 * fr + uSunCol * hl * min(uSunK * 0.3, 1.));
        col = mix(col, metal + col * 0.35, clamp(spec, 0., 1.) * 0.85);
      }
      if (m > 0.5 && m < 1.5) {          // gilt: the same leaf the mirror image shows (rime lies white on it in a hoar morning)
        vec3 gl = giltLeaf(vUv, N, V, fwS, occ);
        if (vW.y > 63. && dot(vW.xz, vW.xz) < 4.) gl *= 1.6;                                           // the spire carries 600 m
        col = mix(gl, col, rmK);
      }
    }
    float f = 1. - exp(-dist * dist * uFogDen * uFogDen);
    col = mix(col, uFogCol, f);
    if (vW.y > -0.02) col = mix(col, uMistCol, mistAt(vW.xz, vW.y, dist, uTime));
    gl_FragColor = vec4(col, 1.0);
  }`;
export function makeSurfaceMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, vertexColors: true, side: THREE.DoubleSide });
}
// the mirror: same geometry, y flipped, every vertex slid along the view ray onto the ice plane (same pixel, plane depth)
function makeMirrorMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -30,      // (no slope-scaled offset: seen at a grazing angle it reordered the layers of the mirror)
    vertexShader: /* glsl */`
      attribute float aMat; uniform float uTime;
      varying vec3 vQ; varying vec3 vN; varying vec3 vC; varying float vH; varying float vM; varying float vT; varying vec3 vVm; varying vec2 vUv; varying float vUnder;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vT = 1. - smoothstep(15., 17., length(wp.xz));          // 1 on the bell tower
        float y = max(wp.y, 0.);
        vec3 pm = vec3(wp.x, -y, wp.z);
        vVm = cameraPosition - pm;                             // from the mirrored point to the eye
        float cy = max(cameraPosition.y, 0.05);
        // the mirror is a true, whole image: black ice is a plate, not water. Only a breath of sway with height, so it lives
        // (a wall that goes down under the ice is mirrored from the waterline up)
        float wob = sin(y * 0.55 + uTime * 1.2 + wp.z * 0.05) * 0.011 * y / (1. + y * 0.03);
        vec3 side = normalize(vec3(cameraPosition.z - wp.z, 0., wp.x - cameraPosition.x) + vec3(1e-4, 0., 0.));
        pm += side * wob;
        // (slid a little nearer than the ice along the same ray: the same pixel, safely in front; the mirror of a nearer thing lies nearer still and
        // the mirror writes depth, so a drum's mirror hides the wall mirrored behind it: one surface, not a stack of panes.
        // The slide is 0.98 t0 / (1 + 0.05 t0), a collineation centred on the eye: it keeps planes plane, so a long wall of two triangles lies
        // exactly where each of its points belongs and never cuts through the mirror of the building behind it; the 0.98 keeps the mirror of a
        // tall thing, which lands close under the eye, clear of the ice sheet's own depth)
        float t0 = cy / max(cy + y, 1e-3);
        float t = 0.98 * t0 / (1. + 0.05 * t0) * (1. - 0.00012 * floor(fract(aMat) * 5. + 0.5));
        vec3 q = cameraPosition + (pm - cameraPosition) * t;
        vQ = cameraPosition + (pm - cameraPosition) * t0;      // where the ray meets the ice itself: frost, drifts and ripples lie exactly where the ice shows them
        vH = y; vUnder = step(wp.y, 0.02); vN = mat3(modelMatrix) * normal; vC = color; vM = aMat;
        gl_Position = projectionMatrix * viewMatrix * vec4(q, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uSunCol, uSky, uGnd, uFogCol, uMid, uHor, uZen; uniform float uSunK, uHemiK, uFogDen, uCover, uMirK, uTime, uWind, uRime, uRimeW;
      varying vec3 vQ; varying vec3 vN; varying vec3 vC; varying float vH; varying float vM; varying float vT; varying vec3 vVm; varying vec2 vUv; varying float vUnder;
      ${GLSL_COMMON}
      ${GLSL_GILT}
      void main(){
        float fa = fwidth(dot(vQ.xz, vec2(0.616, 0.788)));          // (taken before the discard)
        float fpx = fwidth(vQ.x) + fwidth(vQ.z);
        float fdF = footD(vQ.xz); float fwF = clamp(fwidth(fdF), 0.01, 3.);                 // what lies on the ice over the mirror: collars and lee drifts at every foot,
        vec4 rcD = raceD(vQ.xz); float wCr = clamp(fwidth(rcD.x), 0.003, 0.7); float slS = laneD(vQ.xz) + scratchW(vQ.xz); float fwS = clamp(fwidth(slS), 0.003, 0.7);      // runner scratches along our track
        // WHERE THIS PIXEL REALLY LIES ON A MIRRORED WALL. The slide onto the ice is right at the vertices, but across a big face (a long wall is two
        // triangles) every varying is interpolated over the slid triangle, not over the wall: heights and uv came out stretched, so the merlons and
        // windows of a far wall were drawn over most of its mirror, as arcs of ripples. P0 = the mirrored point as interpolated (on the wall's plane,
        // but not on this pixel's ray); X = where the ray through this pixel meets that plane; height and uv are carried from P0 to X along their
        // own screen gradients (they are affine on the face, so this is exact). Walls and drums only; a dome's small triangles need none of it
        vec3 N0 = normalize(vN + vec3(0., 1e-5, 0.)); vec3 P0 = cameraPosition - vVm;
        // (a drum, or a wall seen nearly edge on, takes the upright plane that faces the eye instead of its own)
        vec3 rd = vQ - cameraPosition; vec3 rdn = rd / max(length(rd), 1e-4); vec3 pn = vec3(N0.x, -N0.y, N0.z);
        if (abs(dot(rdn, pn)) < 0.15 || vM > 21.5) pn = vec3(rdn.x, 0., rdn.z) / max(length(rdn.xz), 1e-3);
        float den = dot(rd, pn); den = abs(den) < 1e-5 ? (den < 0. ? -1e-5 : 1e-5) : den;
        vec3 dX = rd * (dot(-vVm, pn) / den) + vVm;                                           // X - P0
        float flat1 = (vM < 0.5 || vM > 20.5) ? 1. : 0.; if (dot(dX, dX) > 90000.) flat1 = 0.;
        dX *= flat1;
        vec3 dPx = dFdx(P0), dPy = dFdy(P0); float gE = dot(dPx, dPx), gF = dot(dPx, dPy), gG = dot(dPy, dPy), gD = gE * gG - gF * gF;
        vec2 ab = gD > 1e-14 ? vec2(dot(dX, dPx) * gG - dot(dX, dPy) * gF, dot(dX, dPy) * gE - dot(dX, dPx) * gF) / gD : vec2(0.);
        vec2 uvT = vUv + ab.x * dFdx(vUv) + ab.y * dFdy(vUv);
        float hT = max(vH + ab.x * dFdx(vH) + ab.y * dFdy(vH), 0.);
        float bxx = dot(P0.xz + dX.xz, vec2(-N0.z, N0.x));                                    // metres along the mirrored wall
        float fwH = fwidth(hT), fwB = fwidth(bxx); float fwSm = fwidth(uvT.x * 40.);
        // only the near side of each mirrored thing is drawn (mirroring turns the winding round, so that is the back-facing side):
        // a dome's far, sunlit side no longer shines through its near one
        if (vUnder > 0.999 || gl_FrontFacing) discard;                // (a face wholly under the ice has no mirror; one that crosses the surface is mirrored from the waterline)
        if (vM > 5.5 && vM < 6.5 && hT < 1.2) discard;               // (a low drift has no mirror worth drawing: it showed as a stray pale patch)
        if (vM > 4.5 && vM < 5.5) discard;                           // (nor have the glassy slabs of the ice-shove collars: they showed as torn shards at the waterline)
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
        vec3 toC = cameraPosition - vQ; float dist = length(toC);
        float ndv = max(toC.y, 0.) / max(dist, 1e-3);
        float m = floor(vM + 0.5);
        float ndl = max(dot(N, uSun), 0.);
        float nv = abs(dot(vec3(N.x, -N.y, N.z), normalize(vVm + vec3(0., 1e-4, 0.))));        // roundness: a mirrored dome darkens toward its rim
        vec3 alb = vC; if (N.y > 0.7 && (m < 0.5 || (m > 20.5 && m < 23.5))) alb = vec3(0.77);
        float sdM = 1. - smoothstep(0.35, 0.6, abs(N.y));
        float tideM = 0.8 * sdM * (1. - smoothstep(0.95, 1.5, hT + (vn(vec2(bxx * 0.9, 7.)) - 0.5) * 0.7));      // the tide line of every wall and drum, mirrored
        float rimeM = 0.85 * (1. - smoothstep(0.1, 0.42, hT + (vn(vec2(bxx * 1.3, 5.)) - 0.5) * 0.3)) * sdM;       // and the rime banked at its foot
        if (m > 0.5 && m < 1.5) {            // gilt: giltLeaf, below (the same leaf as the dome above the ice)
        } else if (m > 1.5 && m < 2.5) {     // the rings of gilt stars
          vec2 st = vec2(fract(uvT.x * 8.) - 0.5, fract(uvT.y * 4.) - 0.5) * vec2(1., 1.25);
          float star = 1. - smoothstep(0.0, 0.03, length(st) - 0.13 - 0.1 * abs(cos(atan(st.y, st.x + 1e-5) * 4.)));
          alb = mix(alb, vec3(0.83, 0.45, 0.04) * 1.6, star);
        } else if (m > 18.5 && m < 19.5) {   // and the gilt ribs
          alb = mix(alb, vec3(0.83, 0.45, 0.04) * 1.6, 1. - smoothstep(0.035, 0.07, abs(fract(uvT.x * 16.) - 0.5)));
        } else if (m < 0.5) {                // limewash keeps its brick courses and its plinth blocks: a wall close by lies in the ice as masonry, not as a pale pane
          float sd = 1. - smoothstep(0.35, 0.6, abs(N.y)); float pl = step(vC.r * 1.1, vC.g) * step(hT, 2.45);
          float row = floor(hT * 3.3); float bq = bxx * 1.6 + 0.5 * row;
          float cf = sd * (1. - smoothstep(0.06, 0.3, fwH * 3.3)) * (1. - smoothstep(0.04, 0.2, fwB * 1.6)) * (1. - pl);
          alb *= 1. - cf * (0.14 * max(1. - step(0.13, fract(hT * 3.3)), 1. - step(0.07, fract(bq))) + 0.08 * (h21(vec2(floor(bq), row)) - 0.5));
          alb *= 0.9 + 0.14 * vn(vec2(bxx * 0.5, hT * 0.4) + 3.);
          float fy = hT / 0.6; float fxb = bxx / 1.2 + 0.5 * floor(fy);
          float pj = max(smoothstep(0.4, 0.47, abs(fract(fy) - 0.5)), smoothstep(0.44, 0.485, abs(fract(fxb) - 0.5))) * pl * sd * (1. - smoothstep(0.25, 0.8, fwH * 1.7));
          alb *= mix(1., 1.25, pl) * (1. - 0.4 * pj);
          alb = mix(alb, alb * vec3(0.46, 0.53, 0.56), tideM); alb = mix(alb, vec3(0.77), rimeM);
        } else if (m > 20.5 && m < 21.5) {   // the city's walls keep their windows (and the kremlin wall its merlons) in the mirror
          float top = floor(uvT.y + 0.02), bw = fract(uvT.y + 0.02) * 16., sth = 2. + clamp(vM - 21., 0., 0.45) * 40.;
          float dn = mod(max(top - hT, 0.), sth); float mk = 1. - smoothstep(110., 380., dist);
          if (bw < 0.4) { if (hT > top - 1.6 && fract(uvT.x / 3.2) > 0.6) discard; }
          else { float bx = uvT.x - floor(uvT.x / bw + 0.5) * bw; float ww = min(0.2 * bw, 1.15); float y0 = 0.36 * sth, y1 = 0.76 * sth;
            float win = max(step(abs(bx), ww) * step(y0, dn) * step(dn, y1), step(length(vec2(bx, dn - y0)), ww) * step(dn, y0)) * step(abs(N.y), 0.5);
            alb = mix(alb, vec3(0.035, 0.05, 0.085), win * mk); alb *= 1. - 0.13 * (1. - mk); }
          alb = mix(alb, alb * vec3(0.46, 0.53, 0.56), tideM); alb = mix(alb, vec3(0.77), rimeM);
        } else if (m > 21.5 && m < 22.5) {
          float win = step(abs(fract(uvT.x * 8.) - 0.5), 0.12) * step(0.4, uvT.y) * step(uvT.y, 0.82) * (1. - smoothstep(110., 380., dist));
          if (fract(vM + 0.01) > 0.1) win = step(abs(fract(uvT.x * 6.) - 0.5), 0.08) * step(0.34, uvT.y) * step(uvT.y, 0.47) * (1. - smoothstep(110., 380., dist));
          alb = mix(alb, vec3(0.035, 0.05, 0.085), win);
          alb = mix(alb, alb * vec3(0.46, 0.53, 0.56), tideM); alb = mix(alb, vec3(0.77), rimeM);
        }
        float rmK = 0.;
        if (uRime > 0.001) {                 // hoar morning: the rime that furs the thing itself lies in its image too
          float rm = uRime * smoothstep(0.25, 0.9, 0.6 * N.y + 0.4 * dot(N, vec3(-0.75, 0., 0.59)) + 0.25 * (vn((P0.xz + dX.xz) * 7. + hT * 9.) - 0.5));
          float rw = m > 23.5 ? 0. : ((m > 0.5 && m < 2.5) || (m > 18.5 && m < 20.5)) ? uRimeW : ((m > 8.5 && m < 9.5) || (m > 12.5 && m < 13.5)) ? 0.2 : 0.8;
          alb = mix(alb, vec3(0.77), rm * rw); rmK = rm * rw;
        }
        vec3 col = alb * (uSunCol * uSunK * ndl + mix(uGnd, uSky, 0.5 + 0.5 * N.y) * uHemiK) * 0.3183;
        if (m > 0.5 && m < 1.5) {            // gilt: the very leaf the dome shows, seen from the eye's own image under the ice
          vec3 gl = giltLeaf(uvT, N, normalize(vec3(vVm.x, -vVm.y, vVm.z) + vec3(0., 1e-4, 0.)), fwSm, 1.);
          if (vT > 0.5 && hT > 63.) gl *= 1.6;
          col = mix(gl, col, rmK);
        }
        // how strongly the ice mirrors depends on how far off the pixel lies on the ice, not on how high the thing mirrored stands:
        // the tower's streak runs unbroken from its foot toward the eye, and the roofs under the nearest 30 m still show through it
        bool wall = vT < 0.5 && (m < 0.5 || (m > 8.5 && m < 9.5) || m > 20.5);         // limewash and its dark windows away from the tower: one solid mirrored building
        if (wall && (m < 0.5 || m > 20.5)) col += alb * uSunCol * uSunK * 0.3183 * 0.25 * (1. - abs(N.y)) * (1. - smoothstep(0., 0.5, ndl));   // the ice's bounce on shaded walls, as above the ice
        col *= (wall || (m > 0.5 && m < 1.5)) ? 0.88 + 0.12 * nv : 0.6 + 0.4 * nv;
        float dxz = length(toC.xz);
        // (the tower's streak survives the snow tongues as a paler mark, so it reaches toward us from the first frame; under the eye the mirror
        // thins, so the plinth is seen going down to the cobbles)
        // (the ice is a mirror from under the runner outward: a dome 13 m off lies whole and clean in it; only close under the tower the streak
        // thins, by how near the EYE is to the tower, so the plinth is seen going down)
        float heelK = smoothstep(45., 95., length(cameraPosition.xz));
        float flo = mix(wall ? mix(0.8, 0.97, smoothstep(2., 9., dxz)) : 0.86, mix(0.62, 0.8, heelK), vT);      // (the bell tower lies in the ice like every dome, close by too)
        float snw = snowLod(vQ.xz, uCover, fpx);                                            // (a drift tongue near by hides the tower's mirror almost wholly: it is crossed, not printed over)
        float a = mix(flo, 0.94, smoothstep(10., 120., dxz)) * (wall ? 1. : 0.93 + 0.07 * softRefl(ndv)) * uMirK * (1. - mix(1., mix(0.88, 0.6, smoothstep(120., 300., dxz)), vT) * snw);
        a = min(a * mix(1., 1.8, smoothstep(150., 400., dxz) * vT), 0.95);
        if (m > 0.5 && m < 1.5) a = min(a * 1.35, 0.95);                              // gilt mirrors hardest: the near end of the tower's streak is gold
        a *= wall ? 1. : 0.88 + 0.12 * vn(vQ.xz * 0.6);
        // THE MIRROR IS WHOLE: crisp and nearly as strong as the thing itself from the waterline to the cross. Nothing dissolves it with height and
        // nothing breaks it into dashes; only what really lies on the ice hides it: a drift tongue, a frosted band off our track, blown snow, far mist
        float sat = satinAt(vQ.xz) * (1. - 0.8 * smoothstep(0.5, 2.2, fa)) * (1. - 0.85 * smoothstep(35., 100., dist));   // (far off, where a band is finer than a pixel, the mirror is whole)
        a *= 1. - 0.72 * sat;                                                          // frosted bands break the mirror into lengths (away from our own track)
        a *= 1. - 0.2 * smoothstep(50., 74., hT);                                      // (the very top of the bell tower's long streak is a little fainter)
        if (m > 0.5 && m < 1.5) a = max(a, 0.9 * uMirK * (1. - snw) * (1. - 0.72 * sat) * (1. - smoothstep(40., 60., dxz)));   // (gilt close by lies in the ice as deep gold)
        float lane = smoothstep(8. * uLaneK, 45. * uLaneK, laneD(vQ.xz));
        a *= 1. - clamp(snakeAt(vQ.xz, uTime * uWind, clamp(uSnakeK - 1., 0., 1.2), fa, 1. - lane) * mix(0.7, 1., lane) * min(uSnakeK, 1.6) * mix(0.6, 0.3, vT), 0., 0.8);   // snow snakes cross it
        a *= 1. - 0.6 * gauzeAt(vQ.xz, uTime * uWind);
        a *= 1. - mistAt(vQ.xz, 0., dist, uTime);                                      // (the far ice lies under low mist: a mirror fades into it)
        // WHAT LIES ON THE ICE LIES ACROSS THE MIRROR: the snow collar and lee drift at every foot, the frost feathering out from it, a few thin drifts of
        // blown snow, the runner scratches along our track; and at grazing angles the cool haze of the surface itself veils the image a little
        // (never its edges: the mirror stays crisp). These are what say "a sheet of ice with an image in it", not "a second dome hanging below"
        vec3 fc = footCue(vQ.xz, fdF, fwF, dist);
        a *= (1. - fc.x) * (1. - 0.75 * fc.y);
        col *= 1. - 0.4 * fc.z;                                                        // (the dark tide ring of scoured ice lies across the image too)
        a *= 1. - raceK(rcD, wCr, dist, vQ.xz);                                               // (the racing crack runs across every image in the ice)
        a *= 1. - 0.92 * wispAt(vQ.xz) * (1. - smoothstep(0.6, 2.4, fa)) * (1. - smoothstep(50., 110., dist));
        a *= 1. - 0.17 * scratchAt(vQ.xz, slS, fwS) * (1. - smoothstep(6., 16., dist));
        // AN IMAGE IN ICE IS A LITTLE DARKER AND COOLER THAN THE THING ITSELF (the ice keeps a share of the light); its edges stay as crisp as they were
        col *= vec3(0.74, 0.79, 0.87);
        col = mix(col, mix(uMid, uHor, 0.55), hazeAt(vQ.xz, ndv) * (m > 0.5 && m < 1.5 ? 0.6 : 1.));
        float f = 1. - exp(-dist * dist * uFogDen * uFogDen);
        col = mix(col, uFogCol, f);
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// ---------- builders (all write into one accumulator, world coordinates) ----------
function archFace(w, h, a, b0, ys) {       // wall panel w x h with an arched opening of half-width a, sill b0, springing ys
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const hole = new THREE.Path();
  hole.moveTo(-a, b0); hole.lineTo(-a, ys); hole.absarc(0, ys, a, Math.PI, 0, true); hole.lineTo(a, b0); hole.lineTo(-a, b0);
  s.holes.push(hole);
  return s;
}
async function buildTower(acc, ctx) {
  const RY = -67 * D2R, C = COL;
  const T = (x, y, z, sx, sy, sz, ry = 0) => new THREE.Matrix4().makeRotationY(RY).multiply(M(x, y, z, sx, sy, sz, ry));
  // base tier: solid, plinth, pilasters, blind arches
  // (the core stands 0.4 m back; each face is a facing panel with its blind arch cut through, so the arch is a real recess)
  acc.add(UNIT.box, T(0, BED_Y, 0, 17.2, 17 - BED_Y, 17.2), C.lime, MAT.LIME);
  acc.add(UNIT.box, T(0, BED_Y, 0, 19.4, 2.4 - BED_Y, 19.4), C.plinth, MAT.LIME);
  acc.add(UNIT.box, T(0, 2.4, 0, 19.7, 0.25, 19.7), C.snow, MAT.SNOW);                      // snow lying on the plinth ledge
  acc.add(UNIT.box, T(0, 16.3, 0, 20, 0.9, 20), C.lime, MAT.LIME);
  acc.add(UNIT.box, T(0, 15.75, 0, 18.7, 0.55, 18.7), C.lime, MAT.LIME);                    // bed moulding under the cornice
  const faceG = new THREE.ExtrudeGeometry(archFace(18, 13.9, 3, 1.0, 7.5), { depth: 0.4, bevelEnabled: false, curveSegments: 10 });
  await ctx.yield();
  const blind = new THREE.Shape(); blind.moveTo(-3, 0); blind.lineTo(3, 0); blind.lineTo(3, 6.5); blind.absarc(0, 6.5, 3, 0, Math.PI, false); blind.lineTo(-3, 0);
  const blindG = new THREE.ShapeGeometry(blind, 10);
  const ir = lcg(7741);
  for (let k = 0; k < 4; k++) {
    const ry = k * Math.PI / 2;
    const F = (x, y, z, sx, sy, sz) => T(0, 0, 0, 1, 1, 1, ry).multiply(M(x, y, z, sx, sy, sz));
    acc.add(faceG, F(0, 2.4, 8.6, 1, 1, 1), C.lime, MAT.LIME);
    for (const px of [-8.1, -6.3, 6.3, 8.1]) {                                              // paired pilasters with a base and a cap
      acc.add(UNIT.box, F(px, 2.65, 9.225, 1.0, 12.6, 0.45), C.lime, MAT.LIME);
      acc.add(UNIT.box, F(px, 2.65, 9.25, 1.3, 0.7, 0.6), C.lime, MAT.LIME);
      acc.add(UNIT.box, F(px, 15.1, 9.25, 1.3, 0.65, 0.6), C.lime, MAT.LIME);
    }
    acc.add(blindG, F(0, 3.4, 8.63, 1, 1, 1), C.limeDark, MAT.LIME + D1);
    acc.add(UNIT.box, F(0, 2.65, 9.0, 7.4, 0.75, 0.5), C.lime, MAT.LIME);                   // sill under the blind arch
    acc.add(UNIT.box, F(0, 12.9, 9.05, 1.1, 1.3, 0.35), C.lime, MAT.LIME);                  // keystone
    acc.add(UNIT.box, F(0, 14.05, 9.0, 11.0, 0.95, 0.12), TILEC, MAT.TILE + D1);            // a frieze of glazed tiles between the inner pilasters, gilt fillets over and under it
    for (const gy of [13.93, 15.02]) acc.add(UNIT.box, F(0, gy, 9.02, 11.2, 0.09, 0.12), C.gold, MAT.GOLD);
    acc.add(UNIT.ball6, F(0, 13.55, 9.42, 0.3, 0.3, 0.16), C.gold, MAT.GOLD);               // a gilt boss on the keystone
    // icicles under the snow of the plinth ledge and, longer, under the first cornice; hooded crows on the ledge, on the sill and up on the cornice
    icicles(acc, ir, F, -9.6, 9.6, 2.42, 9.82, 0.8, 0.25, 0.95); icicles(acc, ir, F, -9.8, 9.8, 16.3, 9.92, 1.0, 0.5, 1.9);
    icicles(acc, ir, F, -3.6, 3.6, 2.68, 9.22, 0.7, 0.15, 0.5);
    for (const [cx, cy2, cz] of [[-7.2 + ir() * 3, 2.65, 9.6], [3 + ir() * 5, 2.65, 9.62], [(ir() - 0.5) * 5, 3.4, 9.05], [(ir() - 0.5) * 16, 17.2, 9.7]])
      perch(acc, F(cx, cy2, cz, 1, 1, 1).multiply(M(0, 0, 0, 1, 1, 1, (ir() - 0.5) * 2.4 + Math.PI)), ir());
    await ctx.yield();
  }
  await ctx.yield();
  // open tiers: one tall arch per face between paired columns under a pediment
  const tiers = [[15, 17.2, 31], [12.5, 31, 43], [10, 43, 53], [8, 53, 60]];
  for (const [w, y0, y1] of tiers) {
    const h = y1 - y0 - 0.9, a = w * 0.25, ys = h * 0.56;
    const g = new THREE.ExtrudeGeometry(archFace(w, h, a, 1.0, ys), { depth: 1.3, bevelEnabled: false, curveSegments: 9 });
    await ctx.yield();
    for (let k = 0; k < 4; k++) {
      const ry = k * Math.PI / 2;
      const F = (x, y, z, sx = 1, sy = 1, sz = 1) => T(0, 0, 0, 1, 1, 1, ry).multiply(M(x, y, z, sx, sy, sz));
      acc.add(g, F(0, y0, w / 2 - 1.3), C.lime, MAT.LIME);
      for (const cx of [a + 0.75, a + 1.55]) for (const sg of [-1, 1]) acc.add(UNIT.cyl, F(sg * cx, y0 + 0.6, w / 2 + 0.28, 0.3, ys + 0.6, 0.3), C.lime, MAT.LIME);
      acc.add(UNIT.box, F(0, y0, w / 2 + 0.1, w * 0.86, 0.6, 0.9), C.lime, MAT.LIME);
      acc.add(UNIT.box, F(0, y0 + ys + 1.2, w / 2 + 0.1, a * 2 + 4.2, 0.45, 0.8), C.lime, MAT.LIME);
      acc.add(UNIT.prism, F(0, y0 + h - 1.9, w / 2 + 0.25, a * 2 + 3.6, 1.7, 0.6), C.lime, MAT.LIME);
      await ctx.yield();
    }
    acc.add(UNIT.box, T(0, y1 - 0.9, 0, w + 1.7, 0.9, w + 1.7), C.lime, MAT.LIME);          // cornice (snow on top by shader)
    acc.add(UNIT.box, T(0, y0, 0, w - 2.6, 0.5, w - 2.6), C.limeDark, MAT.LIME);            // floor
    await ctx.yield();
  }
  // cupola, spire, ball and cross
  acc.add(UNIT.cyl16, T(0, 60, 0, 3.3, 0.9, 3.3), C.lime, MAT.LIME);
  acc.add(UNIT.ball, T(0, 60.8, 0, 3.4, 3.6, 3.4), C.lead, MAT.LEAD);
  acc.add(UNIT.cone, T(0, 63.6, 0, 0.75, 8.6, 0.75), C.gold, MAT.GOLD);
  acc.add(UNIT.ball, T(0, 72.1, 0, 0.5, 0.5, 0.5), C.gold, MAT.GOLD);
  acc.add(UNIT.box, T(0, 72.4, 0, 0.14, 1.9, 0.14), C.gold, MAT.GOLD);
  acc.add(UNIT.box, T(0, 73.5, 0, 0.9, 0.12, 0.12), C.gold, MAT.GOLD);
  acc.add(UNIT.box, T(0, 73.0, 0, 0.55, 0.1, 0.12, 0, 0, 0.3), C.gold, MAT.GOLD);
}
// WHAT HAS NO IMAGE IN THE ICE (glassy slabs, icicles, low drifts, a perched bird: the mirror shader throws them away) goes into the one mesh
// that is not drawn a second time as a mirror: NM, set by buildHero while it builds (null afterwards, when the world adds drifts to its own mesh)
let NM = null;
// a small fixed generator for the dressing (icicles, perched crows): its own sequence, so no other draw moves
const lcg = (seed) => { let s = ((seed | 0) >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
// a row of icicles hanging from an edge of a wall: F places a point of the wall's own frame (x along it, y up, z out); from x0 to x1 at height y
function icicles(acc, r, F, x0, x1, y, z, step, lmin, lmax) {
  const out = NM || acc;
  for (let x = x0 + r() * step; x < x1; x += step * (0.5 + r())) { const l = lmin + (lmax - lmin) * r() * r(), w = 0.035 + 0.05 * r() + l * 0.035;
    if (r() < 0.18) continue;                                                                    // (gaps: they hang in ragged groups)
    out.add(UNIT.icicle, F(x, y, z, w, l, w), [1, 1, 1], MAT.SLAB); }
}
// a hooded crow perched on a ledge (MAT.BIRD: it bobs, shuffles and settles in the vertex shader): grey body, black head, wings and tail.
// mtx: its feet, -z the way it faces; ph: its own phase
export function perch(acc, mtx, ph) {
  const P = (px, py, pz, sx, sy, sz, rx = 0) => mtx.clone().multiply(M(px, py, pz, sx, sy, sz, 0, rx)), uvf = [ph, mtx.elements[13]], blk = [0.012, 0.012, 0.016], gry = [0.2, 0.21, 0.24], out = NM || acc;
  out.add(UNIT.ball6, P(0, 0.24, 0, 0.12, 0.14, 0.25, -0.35), gry, MAT.BIRD, uvf);
  for (const sx of [-1, 1]) out.add(UNIT.ball6, P(sx * 0.085, 0.26, 0.05, 0.05, 0.1, 0.25, -0.3), blk, MAT.BIRD, uvf);      // the folded black wings
  out.add(UNIT.oct, P(0, 0.45, -0.19, 0.09, 0.1, 0.11), blk, MAT.BIRD, uvf);
  out.add(UNIT.oct, P(0, 0.44, -0.33, 0.028, 0.03, 0.09), blk, MAT.BIRD, uvf);
  out.add(UNIT.oct, P(0, 0.21, 0.26, 0.11, 0.025, 0.26, 0.35), blk, MAT.BIRD, uvf);
}
// (the shards draw from their own generator, carried on the caller's rng as rng.slab, so every other draw keeps its order)
function collar(accIn, rng, x, z, r, n, hmax, lane) {      // upthrust ice slabs round a foot, each with two shards leaning on it (lane true: none within 7 m of the lane's axis at the tower; 'track': none nearer the yachts' lane, wherever it runs, than a slab's greatest half length, 1.7 m)
  const acc0 = accIn.isVoid ? accIn : (NM || accIn);
  const rs = rng.slab || rng, VOID = lane ? new Acc(64) : null; let acc = acc0;
  for (let i = 0; i < n; i++) {
    const a = (i + rng() * 0.6) / n * Math.PI * 2, rr = r + rng() * 1.2;
    const len = 0.8 + rng() * 2.6, hgt = 0.4 + rng() * hmax, th = 0.12 + rng() * 0.18, ry = -a + Math.PI / 2 + (rng() - 0.5), rx = (rng() - 0.5) * 1.3, rz = (rng() - 0.5) * 0.7;
    const cx = x + Math.cos(a) * rr, cz = z + Math.sin(a) * rr;
    if (lane) acc = (lane === 'track' ? laneGap(cx, cz) < 1.7 : Math.abs((cx + 17) * -0.932 + (cz - 6.6) * 0.363) < 6.5) ? VOID : acc0;
    acc.add(rs() < 0.45 ? UNIT.prism : UNIT.box, M(cx, -0.3, cz, len, hgt, th, ry, rx, rz), COL.slab, MAT.SLAB);
    for (let k = 0; k < 2; k++) {
      const sa = a + (rs() - 0.5) * 0.5, sr = rr + (k ? 0.5 : -0.45) + (rs() - 0.5) * 0.5;
      acc.add(UNIT.prism, M(x + Math.cos(sa) * sr, -0.15, z + Math.sin(sa) * sr, 0.5 + rs() * 0.4, 0.35 + rs() * 0.55, 0.07 + rs() * 0.1, ry + (rs() - 0.5) * 1.6, (k ? 1 : -1) * (0.5 + rs() * 0.6), (rs() - 0.5) * 0.9), COL.slab, MAT.SLAB);
    }
  }
}
function buildCross(acc, x, y, z, h, lean, dir, lod = 0) {      // lod 0: ball, three bars, two swaying stay chains; 1: no chains; 2: a mark for the horizon
  const B = (px, py, pz, sx, sy, sz, rz = 0) => M(x, y, z, 1, 1, 1, dir, lean, 0).multiply(M(px, py, pz, sx, sy, sz, 0, 0, rz));
  const k = h / 2.2, t = lod > 1 ? 0.3 : 0.11 * Math.sqrt(k);
  acc.add(lod ? UNIT.ball6 : UNIT.ball, B(0, 0.25 * k, 0, 0.32 * k, 0.32 * k, 0.32 * k), COL.gold, MAT.GOLD);
  acc.add(UNIT.box, B(0, 0.4, 0, t, h, t), COL.gold, MAT.GOLD);
  acc.add(UNIT.box, B(0, 0.4 + h * 0.68, 0, h * 0.5, t * 0.9, t * 0.9), COL.gold, MAT.GOLD);
  if (lod > 1) return;
  acc.add(UNIT.box, B(0, 0.4 + h * 0.85, 0, h * 0.24, 0.09, 0.1), COL.gold, MAT.GOLD);
  acc.add(UNIT.box, B(0, 0.4 + h * 0.32, 0, h * 0.34, 0.09, 0.1, 0.42), COL.gold, MAT.GOLD);
  if (lod < 1) for (const s of [-1, 1]) acc.add(UNIT.chain, B(s * 0.5 * k, -0.9 * k, 0, 0.07, 1.9 * k, 0.07, s * 0.55), COL.lead, MAT.CHAIN);   // stay chains
}
const WY = Math.atan2(0.788, -0.616);      // the yaw that lays a drift's length down the wind (north-east)
// the drift in the lee of a foot of radius R: wind-sculpted, rooted against the foot, drawn out north-east; a second, smaller crest beside it
export function driftTail(acc, x, z, R, lod, k = 1) {
  const G = lod ? UNIT.driftLo : UNIT.drift, h = Math.min(0.42 + 0.07 * R, 0.85); acc = NM || acc;
  acc.add(G, M(x + 0.788 * R * 0.3, -0.01, z - 0.616 * R * 0.3, R * 1.35 * k, h, R * 2.3 * k, WY + 0.07), COL.snow, MAT.SNOW);
  if (!lod) acc.add(UNIT.driftLo, M(x + 0.788 * R * 0.9 + 0.616 * R * 0.5, -0.01, z - 0.616 * R * 0.9 + 0.788 * R * 0.5, R * 0.7 * k, h * 0.6, R * 1.9 * k, WY - 0.12), COL.snow, MAT.SNOW);
  // (the drift breaks up down the wind: two dunelets beyond its end, each off to its own side, so its end is never one drawn point)
  const q = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1, L = R * 2.7 * k;
  for (const [f, sd, sc] of [[0.84 + 0.2 * q, 0.42 - 0.9 * q, 0.42], [1.22 + 0.25 * q, -0.3 + 0.75 * q, 0.3]]) {
    const px = x + 0.788 * (R * 0.3 + L * f) + 0.616 * R * sd, pz = z - 0.616 * (R * 0.3 + L * f) + 0.788 * R * sd;
    const hw = R * 0.9 * k * sc;      // (its half width)
    if (laneGap(px, pz) < hw || laneGap(px + 0.788 * L * sc * 0.9, pz - 0.616 * L * sc * 0.9) < hw) continue;      // (none on the yachts' lane, anywhere along it)
    acc.add(UNIT.driftLo, M(px, -0.01, pz, R * 1.35 * k * sc, h * (0.35 + 0.3 * sc), L * sc * 0.9, WY + 0.5 * (q - 0.5)), COL.snow, MAT.SNOW); }
}
async function buildDome(acc, rng, d, i, giltFlag, ctx, o = {}) {       // o.lod 1: a lesser church (lighter onion, no sunk side dome, a smaller collar); o.drum: metres of drum above the ice
  const [x, z, dia] = d, gilt = giltFlag === undefined ? d[3] : giltFlag, R = dia / 2, lod = o.lod || 0;      // gilt: 0 starred cobalt, 1 gilt, 2 green copper with gilt ribs, 3 silver shingles
  const dCol = [COL.blue, COL.gold, COL.copper, COL.silver][gilt] || COL.blue, dMat = [MAT.BLUE, MAT.GOLD, MAT.COPPER, MAT.SILVER][gilt] || MAT.BLUE;
  let drum = 1 + rng() * 2; if (o.drum !== undefined) drum = o.drum;
  acc.add(UNIT.cyl16, M(x, BED_Y + 4, z, R * 0.62, drum - BED_Y - 4, R * 0.62), COL.lime, MAT.LIME);          // drum, on down into the dark
  acc.add(UNIT.cyl16, M(x, drum - 0.35, z, R * 0.7, 0.35, R * 0.7), COL.lime, MAT.LIME);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; acc.add(UNIT.face, M(x + Math.cos(a) * R * 0.63, -0.2, z + Math.sin(a) * R * 0.63, 0.5, drum - 0.4, 0.12, -a + Math.PI / 2), COL.limeDark, MAT.LIME + D1); }
  if (drum > 3.4) {                                                                                             // a tall drum: slit windows between the pilasters, a string course under them
    const h = Math.min(drum - 1.8, 4.2);
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; acc.add(UNIT.face, M(x + Math.cos(a) * R * 0.612, drum - 0.9 - h, z + Math.sin(a) * R * 0.612, 0.11 * R, h, 0.16, -a + Math.PI / 2), WIN, MAT.PLAIN + D2);
      acc.add(UNIT.disc, M(x + Math.cos(a) * R * 0.6, drum - 0.9, z + Math.sin(a) * R * 0.6, 0.055 * R, 0.14, 0.055 * R, -a + Math.PI / 2, Math.PI / 2), WIN, MAT.PLAIN + D2); }
    acc.add(UNIT.cyl16, M(x, drum - 1.3 - h, z, R * 0.66, 0.22, R * 0.66), COL.lime, MAT.LIME);
    acc.add(UNIT.cyl, M(x, drum - 0.86, z, R * 0.635, 0.46, R * 0.635), TILEC, MAT.TILE + D1);      // a frieze of glazed tiles under the cornice
    if (!lod) acc.add(UNIT.cyl, M(x, drum - 0.03, z, R * 0.58, 0.2, R * 0.58), COL.gold, MAT.GOLD);   // a gilt ring at the onion's neck
  }
  await ctx.yield();
  acc.add(lod ? UNIT.onionLo : UNIT.onion, M(x, drum, z, R, R, R, rng() * 6), dCol, dMat);
  const top = drum + 2.4 * R;
  buildCross(acc, x, top - 0.25, z, 2.2, (4 + rng() * 14) * D2R * (rng() < 0.5 ? -1 : 1), rng() * 6.28);
  await ctx.yield();
  // the church below: green iron roof, body, a lesser dome that did not reach the surface
  const bw = o.slim ? 0.55 : 1;
  acc.add(UNIT.cone, M(x, -6.5 + i * 0.013, z, R * 2.75 * bw, 2.9, R * 2.75 * bw), COL.green, MAT.GREEN);      // (the roof oversails the walls)
  bodyBox(acc, M(x, BED_Y, z, R * 3.6 * bw, 4.5 + i * 0.013, R * 3.6 * bw, 0.44), R * 3.6 * bw, R * 3.6 * bw > 14 ? 5 : 3);
  const la = rng() * 6.28, lr = R * 1.9;
  if (!lod && !o.slim) {
    acc.add(UNIT.cyl, M(x + Math.cos(la) * lr, -7, z + Math.sin(la) * lr, R * 0.3, 3.2, R * 0.3), COL.lime, MAT.LIME);
    acc.add(UNIT.onionLo, M(x + Math.cos(la) * lr, -3.8, z + Math.sin(la) * lr, R * 0.45, R * 0.45, R * 0.45), COL.green, MAT.GREEN);
  }
  collar(acc, rng, x, z, R * 0.75, lod ? 6 : 9, 1.3);
  // snow-drift tail to the north-east
  driftTail(acc, x, z, R, lod);
  return [x, top + 2.4, z];
}
// ---------- the lesser drowned churches (the town had forty): domes near the track, churches and bell towers standing higher further off ----------
// lone domes: x, z, diameter, gilt. The opening (a three-domed chapel left of the channel, one gilt dome right of the tent), the cathedral west of
// the tower made five-domed, five marks either side of the link after the heel (north, south, north, south, north, then the brief's F1 and F2).
// Every one is 26 m or more from the track and clear of the black rival's course.
// Then the domes we fly between: one or two close by at every tenth of the run, 12 to 19 m from the track, alternately gilt and starred,
// from the market square past the cathedral and down the sweep to the avenue, and a chapel dome either side of the gate.
// x, z, diameter, kind (0 starred, 1 gilt, 2 green copper, 3 silver shingle), drum above the ice in metres (0: by seed), slim (the church below is narrow)
export const EXTRA = [
  [-224, 497, 8.5, 0, 5.5], [-232, 491, 4.5, 1, 0], [-221, 488.5, 5, 1, 0], [-162.3, 508.3, 7, 3, 0],
  [-159, 447, 10, 2, 6], [-166, 384, 9, 3, 5.5],
  [-55, 160, 9, 2, 5, 1], [-12, 141, 9, 0, 0], [-90, 76, 9, 3, 5], [-87.5, 1, 8, 1, 4], [-114, -7, 10, 2, 6], [-147, -62, 9, 1, 4.5, 1], [-171, -26, 11, 0, 5, 1],
  [-281, -66, 8, 1, 0, 1], [-281, -22, 8, 0, 0, 1],
  [-50, -70, 11, 1, 6], [-66, -18, 9, 2, 4, 1], [-98, -76, 8, 1, 0], [-128, -86, 7, 3, 0],
  [10, 94, 9, 0, 5], [-84, -40, 10, 0, 5, 1]];      // (the last two: right of the run-in to the canyon; inside the bend after it)
// churches that stood on higher ground and show their walls: x, z, yaw, body width, wall top above the ice, lod (1 middle distance, 2 horizon),
// domes [dx, dz, diameter, gilt, drum top], belfry [dx, dz, width, shaft top, tent height] or null
const five = (D, d, top, g) => [[0, 0, D, g, top], [-1, -1, d, 1 - g, 0], [1, -1, d, 1 - g, 0], [-1, 1, d, 1 - g, 0], [1, 1, d, 1 - g, 0]];
// (the first is the cathedral beside the bell tower: its walls stand 5 m out of the ice under four corner domes; its great central dome on a 12 m drum is the
// sixth of the nine DOMES, so the whole stands 27 m high, 45 m to starboard as we sweep past, with the tower rising behind it)
export const CHURCHES = [
  { x: -35.2, z: 13.9, ry: 0.42, w: 22, top: 7.6, lod: 1, domes: [[-1, -1, 7, 0, 0], [1, -1, 7, 0, 0], [-1, 1, 7, 0, 0], [1, 1, 7, 0, 0]], bel: null, hi: 1 },
  { x: -131, z: 288, ry: 0.42, w: 15, top: 5.6, lod: 1, domes: five(10, 4.6, 11.8, 1), bel: null, hi: 1 },                      // drowned to its window sills, close on the left of the channel
  { x: -29, z: 199, ry: 0.42, w: 0, top: 0, lod: 1, domes: [[9.5, 2, 5, 1, 2.6]], bel: [0, 0, 7, 10, 10] },              // a tent-roofed belfry on the right, by the market square (low enough to stand whole in the frame until we are past it)
  { x: 102, z: 103, ry: 0.3, w: 15, top: 8, lod: 1, domes: [[0, 0, 10, 1, 12.9], [0, 5.2, 4, 0, 10.6]], bel: [0, -14, 5.6, 16.3, 11] },   // east of the heel
  { x: -348, z: -84, ry: 0, w: 20, top: 9, lod: 1, domes: five(12, 5.6, 16.3, 1), bel: null },                           // the monastery's cathedral
  { x: -352, z: 0, ry: 0, w: 14, top: 7.5, lod: 1, domes: [[0, 0, 9, 1, 12.8], [0, -4.6, 4.4, 0, 10], [0, 4.6, 4.4, 0, 10]], bel: null },   // and its winter church
  { x: -187, z: -203, ry: 0.5, w: 14, top: 7.5, lod: 2, domes: [[0, 0, 9, 0, 12.9]], bel: [-12, 0, 5, 27, 11] },
  { x: -60, z: -226, ry: 0.2, w: 18, top: 9, lod: 2, domes: five(15.5, 5, 16.3, 1), bel: null },
  { x: 325, z: 125, ry: 0.9, w: 16, top: 7, lod: 2, domes: [[0, 0, 10, 1, 12.5], [-6.5, 0, 6, 0, 10], [6.5, 0, 6, 0, 10]], bel: null },
  { x: 224, z: 296, ry: 0.42, w: 16, top: 8, lod: 2, domes: five(10, 4.6, 14, 0), bel: [13, 4, 5, 29, 12] },
  { x: -600, z: -170, ry: 0.1, w: 18, top: 9, lod: 2, domes: [[0, 0, 16, 1, 15]], bel: [0, 15, 6, 16.3, 13] },
  { x: -450, z: -290, ry: 0.6, w: 16, top: 8, lod: 2, domes: five(10, 4.6, 14, 1), bel: null },
  { x: -520, z: 110, ry: 0.3, w: 16, top: 8, lod: 2, domes: [[0, 0, 11, 1, 14]], bel: [-13, 2, 5.5, 26, 12] },
  // the town gate of churches: the third and fourth of the nine DOMES are the great domes of two walled, five-domed churches that stand either side of
  // our track (16 m wall to wall) with the bell tower framed between them
  { x: -96.2, z: 236, ry: 0.42, w: 11, top: 4.4, lod: 1, domes: [[-1, -1, 3.2, 1, 0], [1, -1, 3.2, 1, 0], [-1, 1, 3.2, 1, 0], [1, 1, 3.2, 1, 0]], bel: null, hi: 1 },
  { x: -71.8, z: 248, ry: 0.42, w: 11, top: 4.8, lod: 1, domes: [[-1, -1, 3.0, 0, 0], [1, -1, 3.0, 0, 0], [-1, 1, 3.0, 0, 0], [1, 1, 3.0, 0, 0]], bel: null, hi: 1 },
];
export const DRUMS = { 2: 7.2, 3: 7.8, 5: 15.4, 6: 4.6 };      // the great domes that stand on a church: the top of the drum above the ice
export const TOWER2 = [-365, -125];
// THE CATHEDRAL OF THE APPROACH: a tall five-domed church with a refectory, an apse chapel and a tent-roofed belfry, standing in the ice 38 m to
// starboard of the channel a seventh of the way up, beside the green copper dome: one tight cluster of white walls, six domes and a spire with its
// mirror at its feet, so the first third of the run has a second kind of subject (a massed building, not a lone dome) from the first frame on
export const SOBOR = { x: -131, z: 441, ry: 0.42 + Math.PI / 2, w: 14, top: 8.5, lod: 1, hi: 1,
  domes: [[0, 0, 9, 1, 15.5], [-1, -1, 4.6, 0, 0], [1, -1, 4.6, 0, 0], [-1, 1, 4.6, 0, 0], [1, 1, 4.6, 0, 0]], bel: [-15.5, 0, 6, 15, 9] };
const SOBOR_BEL = [SOBOR.x + Math.cos(SOBOR.ry) * SOBOR.bel[0], SOBOR.z - Math.sin(SOBOR.ry) * SOBOR.bel[0]];
// (it is turned a quarter round from the street grid's long way, so that from the whole first reach its five-domed body stands BESIDE its belfry
// and the green copper dome, not behind them: green dome, cathedral, belfry, left to right)
// THE HALF-SUNK CHURCH on the open ice to port of the channel, a fifth of the way up: walls drowned to their window heads, round gables, five domes
// (the great one starred) and a small tent belfry, with its whole image at its feet; 33 m from the track, left of the line to the bell tower
export const SUNK = { x: -192, z: 398, ry: 0.62, w: 13, top: 4.6, lod: 1, hi: 1,
  domes: [[0, 0, 9, 0, 10.4], [-1, -1, 4, 1, 0], [1, -1, 4, 1, 0], [-1, 1, 4, 1, 0], [1, 1, 4, 1, 0]], bel: [-11.5, 1, 4.6, 8.6, 7] };
const SUNK_BEL = [SUNK.x + Math.cos(SUNK.ry) * SUNK.bel[0] + Math.sin(SUNK.ry) * SUNK.bel[1], SUNK.z - Math.sin(SUNK.ry) * SUNK.bel[0] + Math.cos(SUNK.ry) * SUNK.bel[1]];
// SPIRE TIPS: the tops of the town's lesser chapels that only just break the ice: a cupola drowned to its shoulders, the last metres of a shingled
// tent roof, a gilt needle and its cross. A RULE OF THE TOWN'S PLAN: a chapel stands on every second house plot (32 m) of the main street, from
// the first house plot past the street grid's origin (20 m) to the market arcade, alternately in the starboard and the port row, square to the street, its street wall in line
// with the house fronts (its centre 12.45 m from the street's centre line); the cross streets' mouths fall between these plots; a plot on a greater
// church's ground, on the fishers' camp, on the pitch over the square or at a well has none. Each stands in a ring of broken ice with a small drift in its lee; its chapel goes down into the dark under it. x, z, kind
const ST_O = [-205, 510], ST_A = [0.42, -0.908], ST_B = [0.908, 0.42], ST_YAW = Math.atan2(ST_A[0], ST_A[1]);      // (the world's street grid: its origin, along the main street, across it, its yaw)
const stXZ = (a, b) => [ST_O[0] + ST_A[0] * a + ST_B[0] * b, ST_O[1] + ST_A[1] * a + ST_B[1] * b];
const GROUNDS = [...DOMES.map((d) => [d[0], d[1], d[2] * 2 + 9]), ...EXTRA.map((d) => [d[0], d[1], d[2] * 2 + 9]), ...CHURCHES.map((c) => [c.x, c.z, Math.max(c.w, 8) * 0.75 + 12]), [TOWER2[0], TOWER2[1], 16],
  [SOBOR.x, SOBOR.z, 23], [SOBOR_BEL[0], SOBOR_BEL[1], 13], [SUNK.x, SUNK.z, 21], [SUNK_BEL[0], SUNK_BEL[1], 11], [-198, 526, 20], [...stXZ(338, 11), 10],
  ...[[103, -11], [185, 11], [7, 11], [333, 8]].map(([a, b]) => [...stXZ(a, b), 6]), [16, 24, 6]];      // (the camp, the pitch, and the town's five wells with their sweeps)
export const TIPS = [];
for (let i = 0; 20 + i * 32 < 306; i++) { const [x, z] = stXZ(20 + i * 32, (i % 2 ? -1 : 1) * 12.45);      // (the arcade's wings begin at 310 m of street)
  if (!GROUNDS.some((d) => Math.hypot(x - d[0], z - d[1]) < d[2])) TIPS.push([x, z, TIPS.length % 3]); }
const TIP_R = [1.65, 1.2, 0.4];
// what the ice needs to know of them: analytic shadows (x, z, effective diameter) and where no house may stand (x, z, radius)
export const SHADOWS = [...EXTRA.map((d) => [d[0], d[1], d[2]]), [-35.2, 13.9, 15], [-131, 288, 13], [-96.2, 236, 13], [-71.8, 248, 13], [-29, 199, 18], [-348, -84, 20], [-352, 0, 15], [-365, -125, 20], [SOBOR.x, SOBOR.z, 16], [SOBOR_BEL[0], SOBOR_BEL[1], 11], [SUNK.x, SUNK.z, 13], [SUNK_BEL[0], SUNK_BEL[1], 8]];
export const KEEPOUT = [...EXTRA.map((d) => [d[0], d[1], d[2] * 2 + 9]), ...CHURCHES.map((c) => [c.x, c.z, Math.max(c.w, 8) * 0.75 + 12]), [TOWER2[0], TOWER2[1], 16], [SOBOR.x, SOBOR.z, 23], [SOBOR_BEL[0], SOBOR_BEL[1], 13],
  [SUNK.x, SUNK.z, 21], [SUNK_BEL[0], SUNK_BEL[1], 11], ...TIPS.map((t) => [t[0], t[1], 8])];
// the feet that pierce the ice (the world gives the nearest to our track a snow collar and a lee drift in the ice and mirror shaders):
// x, z, half-width of a square foot (0: round), radius, yaw
const rot2 = (c, dx, dz) => [c.x + Math.cos(c.ry) * dx + Math.sin(c.ry) * dz, c.z - Math.sin(c.ry) * dx + Math.cos(c.ry) * dz];
export const FEET = [
  [0, 0, 9.7, 0, -67 * D2R],
  ...DOMES.filter((d, i) => i !== 2 && i !== 3 && i !== 5).map((d) => [d[0], d[1], 0, d[2] * 0.31 + 0.1, 0]),
  ...EXTRA.map((d) => [d[0], d[1], 0, d[2] * 0.31 + 0.1, 0]),
  ...CHURCHES.filter((c) => c.lod < 2 && c.w > 0).map((c) => [c.x, c.z, c.w / 2, 0, c.ry]),
  ...CHURCHES.filter((c) => c.lod < 2 && c.bel).map((c) => [...rot2(c, c.bel[0], c.bel[1]), c.bel[2] / 2, 0, c.ry]),
  ...CHURCHES.filter((c) => c.lod < 2 && c.w === 0).flatMap((c) => c.domes.map((d) => [...rot2(c, d[0], d[1]), 0, d[2] * 0.31 + 0.1, 0])),
  [SOBOR.x, SOBOR.z, SOBOR.w / 2, 0, SOBOR.ry], [SOBOR_BEL[0], SOBOR_BEL[1], SOBOR.bel[2] / 2, 0, SOBOR.ry],
  [...rot2(SOBOR, -SOBOR.w / 2 - 2.75, 0), 2.9, 0, SOBOR.ry], [...rot2(SOBOR, SOBOR.w / 2 + 0.6, 0), 0, 3.4, 0],
  [SUNK.x, SUNK.z, SUNK.w / 2, 0, SUNK.ry], [SUNK_BEL[0], SUNK_BEL[1], SUNK.bel[2] / 2, 0, SUNK.ry],
  ...TIPS.map((t) => [t[0], t[1], 0, TIP_R[t[2]], 0]),
];
const DARK = [0.03, 0.045, 0.07], WIN = [0.06, 0.1, 0.19], OCHRE = [0.6, 0.42, 0.24], TILEC = [0.3, 0.31, 0.25];
// a thing that lies on a wall (a window, a band, a sunk panel) carries a level in the fraction of its mat id: the mirror, where every layer lies on one plane,
// draws level 1 a hand nearer than the wall and level 2 (the dark openings) a hand nearer again, so they never fight the wall or each other
const D1 = 0.2, D2 = 0.4, BODY = 0.05;
// a wall box that goes down under the ice: its uv carries (metres along the face from its middle, the width of one bay) and its mat id the BODY flag,
// so the shader sets lesenes and round-headed windows on it under the ice, in step with what stands above (bays: an odd count)
function bodyBox(acc, mtx, w, bays, top = 0) {      // top: the wall's top above the ice, for the carved surrounds the shader sets round its windows (0: none)
  const g = UNIT.box.userData.ni || (UNIT.box.userData.ni = UNIT.box.toNonIndexed());
  const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { uv[i * 2] = (Math.abs(N.getX(i)) > 0.5 ? P.getZ(i) : P.getX(i)) * w; uv[i * 2 + 1] = Math.min(w / bays, 60) + 64 * Math.round(top * 4); }
  const b = new THREE.BufferGeometry(); b.setAttribute('position', P); b.setAttribute('normal', N); b.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  acc.add(b, mtx, COL.lime, MAT.LIME + BODY);
}
// a drum from y0 to y1 with slit windows, its onion and cross
function drumAndDome(acc, x, z, R, y0, y1, gilt, lod, crossH, lean, dir) {
  const cy = lod > 1 ? UNIT.cyl8 : UNIT.cyl12;
  acc.add(cy, M(x, y0, z, R * 0.62, y1 - y0, R * 0.62), COL.lime, MAT.LIME);
  acc.add(cy, M(x, y1 - 0.4, z, R * 0.72, 0.4, R * 0.72), COL.lime, MAT.LIME);
  if (lod < 2) for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, h = Math.min(y1 - y0 - 1.2, 4.5);
    if (h > 0.8) acc.add(UNIT.face, M(x + Math.cos(a) * R * 0.61, y1 - 0.8 - h, z + Math.sin(a) * R * 0.61, 0.16 * R, h, 0.18, -a + Math.PI / 2), DARK, MAT.PLAIN + D2); }
  acc.add(lod > 1 ? UNIT.onionFar : UNIT.onionLo, M(x, y1, z, R, R, R, dir), gilt ? COL.gold : COL.blue, gilt ? MAT.GOLD : MAT.BLUE);
  buildCross(acc, x, y1 + 2.4 * R - 0.25, z, crossH, lean, dir, lod > 1 ? 2 : 1);
}
// a tent-roofed belfry: square shaft, an open bell stage the sky shows through, an octagon, a shingled tent, a small onion and cross
function buildBelfry(acc, rng, x, z, ry, w, st, th, lod, gilt) {
  const y0 = lod > 1 ? -0.5 : BED_Y, bh = w * 0.95, pw = w * 0.24, cy = lod > 1 ? UNIT.cyl8 : UNIT.cyl12;
  const W = (px, py, pz, sx, sy, sz, r2 = 0) => M(x, 0, z, 1, 1, 1, ry).multiply(M(px, py, pz, sx, sy, sz, r2));
  if (lod < 2) bodyBox(acc, W(0, y0, 0, w, st - bh - y0, w), w, 1); else acc.add(UNIT.box, W(0, y0, 0, w, st - bh - y0, w), COL.lime, MAT.LIME);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) acc.add(UNIT.box, W(sx * (w - pw) / 2, st - bh, sz * (w - pw) / 2, pw, bh * 0.78, pw), COL.lime, MAT.LIME);
  acc.add(UNIT.box, W(0, st - bh * 0.22, 0, w, bh * 0.22, w), COL.lime, MAT.LIME);
  acc.add(UNIT.box, W(0, st, 0, w + 0.9, 0.9, w + 0.9), COL.lime, MAT.LIME);
  if (lod < 2) {
    acc.add(UNIT.box, W(0, st - bh - 0.3, 0, w + 0.5, 0.3, w + 0.5), COL.lime, MAT.LIME);                       // string course under the bell stage
    acc.add(UNIT.bell, W(0, st - bh * 0.22 - w * 0.24, 0, w * 0.17, w * 0.22, w * 0.17), [0.12, 0.11, 0.08], MAT.PLAIN);
    for (let k = 0; k < 4; k++) acc.add(UNIT.face, M(x, 0, z, 1, 1, 1, ry + k * Math.PI / 2).multiply(M(0, Math.max(1.2, st - bh - 6), w / 2, 0.7, 2.6, 0.16)), DARK, MAT.PLAIN + D2);
    collar(acc, rng, x, z, w * 0.7, 6, 1.1);
    driftTail(acc, x, z, w * 0.62, 1);
  }
  const yT = st + 0.9, r = w * 0.2;
  acc.add(cy, W(0, yT, 0, w * 0.5, 0.9, w * 0.5), COL.lime, MAT.LIME);
  acc.add(UNIT.cone8, W(0, yT + 0.9, 0, w * 0.6, th, w * 0.6, 0.39), COL.shingle, MAT.LEAD);
  acc.add(cy, W(0, yT + 0.9 + th * 0.84, 0, r * 0.62, th * 0.16 + 0.5, r * 0.62), COL.lime, MAT.LIME);
  acc.add(lod > 1 ? UNIT.onionFar : UNIT.onionLo, W(0, yT + 1.4 + th, 0, r, r, r), gilt ? COL.gold : COL.blue, gilt ? MAT.GOLD : MAT.BLUE);
  buildCross(acc, x, yT + 1.4 + th + 2.4 * r - 0.2, z, lod > 1 ? 3 : 2.2, (rng() - 0.5) * 0.16, ry, lod > 1 ? 2 : 1);
}
// a church whose walls still stand out of the ice: a white cube with round gables, slit windows and snow on the vaults, its domes, perhaps a belfry
async function buildChurch(acc, rng, c, flip, ctx) {
  const { x, z, ry, w, top, lod } = c, y0 = lod > 1 ? -0.5 : BED_Y, cy = lod > 1 ? UNIT.cyl8 : UNIT.cyl12;
  if (w > 0) {
    if (lod < 2) bodyBox(acc, M(x, y0, z, w, top - y0, w, ry), w, 3, c.hi ? top : 0); else acc.add(UNIT.box, M(x, y0, z, w, top - y0, w, ry), COL.lime, MAT.LIME);
    acc.add(UNIT.box, M(x, top, z, w - 0.7, 0.3, w - 0.7, ry), COL.snow, MAT.SNOW);
    const r = w / 6 - 0.15, gk = c.hi ? 0.7 : 1, ir = lcg(Math.round(x * 7 + z * 13) + 99), nearT = trackD(x, z) < 24;
    for (let k = 0; k < 4; k++) {
      const F = (px, py, pz, sx, sy, sz, rx = 0) => M(x, 0, z, 1, 1, 1, ry + k * Math.PI / 2).multiply(M(px, py, pz, sx, sy, sz, 0, rx));
      for (let j = -1; j <= 1; j++) {
        acc.add(cy, F(j * w / 3, top - 0.1, w / 2 - (c.hi ? 0.72 : 0.62), r, 0.6, r * gk, Math.PI / 2), COL.lime, MAT.LIME);               // round gables, flush with the wall
        if (lod < 2) acc.add(UNIT.disc, F(j * w / 3, top + r * gk * 0.42, w / 2 - 0.1, r * 0.2, 0.14, r * 0.2, Math.PI / 2), WIN, MAT.PLAIN + D2);   // an oculus in each
        if (lod < 2 && top > 4) acc.add(UNIT.face, F(j * w / 3, top * 0.28, w / 2, c.hi ? 1.1 : 0.75, top * 0.42, 0.16), WIN, MAT.PLAIN + D2);   // slit windows
        if (c.hi && top > 4) { acc.add(UNIT.disc, F(j * w / 3, top * 0.7, w / 2 + 0.08, 0.55, 0.16, 0.55, Math.PI / 2), WIN, MAT.PLAIN + D2);              // their round heads
          acc.add(UNIT.disc, F(j * w / 3, top * 0.7, w / 2 + 0.02, 0.85, 0.14, 0.85, Math.PI / 2), OCHRE, MAT.LIME + D1);                                   // an ochre archivolt round each head
          acc.add(UNIT.box, F(j * w / 3, top * 0.28 - 0.3, w / 2 + 0.12, 1.7, 0.22, 0.3), COL.lime, MAT.LIME); }                               // and sills
        if (c.hi) acc.add(UNIT.disc, F(j * w / 3, top - 0.1 + r * gk * 0.4, w / 2 - 0.14, r * 0.5, 0.12, r * gk * 0.42, Math.PI / 2), COL.limeDark, MAT.LIME + D1);   // a sunk tympanum in each gable
      }
      if (lod < 2) for (const sx of [-1, 1]) acc.add(UNIT.box, F(sx * (w / 2 - 0.4), -0.3, w / 2, 0.9, top + 0.3, 0.22), COL.lime, MAT.LIME);
      if (c.hi) { for (const sx of [-1, 1]) acc.add(UNIT.box, F(sx * w / 6, -0.3, w / 2, 0.7, top + 0.3, 0.2), COL.lime, MAT.LIME);              // lesenes between the bays, a cornice band
        acc.add(UNIT.box, F(0, top - 0.86, w / 2, w + 0.5, 0.52, 0.3), TILEC, MAT.TILE + D1);                                                     // a frieze of glazed tiles under the gables
        acc.add(UNIT.box, F(0, top - 0.97, w / 2 + 0.03, w + 0.3, 0.09, 0.3), COL.gold, MAT.GOLD);                                                // a gilt fillet under it
        if (top > 4) { const nb = Math.round(w / 2.2);                                                                                         // a frieze of small blind arches under the band
          for (let b = 0; b < nb; b++) { const bx = (b + 0.5 - nb / 2) * (w - 2.4) / nb; if (Math.abs(Math.abs(bx) - w / 6) < 0.8) continue;
            acc.add(UNIT.face, F(bx, top - 2.0, w / 2 + 0.03, 0.8, 0.8, 0.1), COL.limeDark, MAT.LIME + D1); acc.add(UNIT.disc, F(bx, top - 1.2, w / 2 + 0.03, 0.4, 0.1, 0.4, Math.PI / 2), COL.limeDark, MAT.LIME + D1); } }
        // plates of shoved ice leaning on the wall itself (none stand out in the lane between cathedral and tower)
        const rs = rng.slab || rng;
        for (let q = 0; q < 6; q++) { const sx = (rs() - 0.5) * (w - 2), low = k === 1 ? 0.45 : 1;
          (NM || acc).add(rs() < 0.5 ? UNIT.prism : UNIT.box, F(sx, -0.25, w / 2 + 0.35 + rs() * 0.9, 0.9 + rs() * 2.2, (0.35 + rs() * 0.9) * low, 0.1 + rs() * 0.14, (rs() - 0.5) * 0.7, -0.25 - rs() * 0.5), COL.slab, MAT.SLAB); }
        // icicles under the frieze and under every sill, hooded crows on the snow of the eave (more of both on the walls our track brushes)
        if (top > 4) { icicles(acc, ir, F, -w / 2 + 0.3, w / 2 - 0.3, top - 0.97, w / 2 + 0.2, nearT ? 0.75 : 1.5, 0.2, 0.8);
          if (nearT) for (let j = -1; j <= 1; j++) icicles(acc, ir, F, j * w / 3 - 0.8, j * w / 3 + 0.8, top * 0.28 - 0.3, w / 2 + 0.24, 0.42, 0.12, 0.45); }
        for (let q = 0; q < (nearT ? 2 : 1); q++) if (ir() < 0.8) perch(acc, F((ir() - 0.5) * (w - 2), top + 0.28, w / 2 - 0.55, 1, 1, 1).multiply(M(0, 0, 0, 1, 1, 1, (ir() - 0.5) * 2.6 + Math.PI)), ir()); }
    }
    if (lod < 2) collar(c.hi ? Object.assign(new Acc(64), { isVoid: true }) : acc, rng, x, z, w * 0.74, 10, 1.2);          // (a walled church takes its collar as plates along the walls; the draws are kept)
    if (!(c.hi && top > 4)) driftTail(acc, x, z, w * 0.6, 1);
    await ctx.yield();
  }
  const cs = Math.cos(ry), sn = Math.sin(ry);
  for (let j = 0; j < c.domes.length; j++) {
    let [dx, dz, dia, g, dt] = c.domes[j];
    if (dt === 0) { dx *= w * 0.31; dz *= w * 0.31; dt = top + 2.2 + dia * 0.25; }
    const wx = x + cs * dx + sn * dz, wz = z - sn * dx + cs * dz, R = dia / 2;
    drumAndDome(acc, wx, wz, R, w > 0 ? top - 0.2 : BED_Y + 4, dt, flip ? 1 - g : g, lod, Math.max(2.2, dia * (lod > 1 ? 0.36 : 0.3)), (2 + rng() * 7) * D2R * (rng() < 0.5 ? -1 : 1), rng() * 6.28);
    if (w === 0) { collar(acc, rng, wx, wz, R * 0.75, 6, 1.2); driftTail(acc, wx, wz, R, 1); }
    await ctx.yield();
  }
  if (c.bel) { const [bx, bz, bw, st, th] = c.bel; buildBelfry(acc, rng, x + cs * bx + sn * bz, z - sn * bx + cs * bz, ry, bw, st, th, lod, flip ? 0 : 1); await ctx.yield(); }
}
// the monastery's own bell tower behind the wall: three tiers (solid, an open arch per face with a bell, an octagon under a lead cap and gilt spire)
async function buildTower2(acc, rng, ctx) {
  const [x, z] = TOWER2, ry = 0.25, C = COL;
  const F = (k, px, py, pz, sx = 1, sy = 1, sz = 1) => M(x, 0, z, 1, 1, 1, ry + k * Math.PI / 2).multiply(M(px, py, pz, sx, sy, sz));
  acc.add(UNIT.box, F(0, 0, BED_Y, 0, 9.6, 16.3 - BED_Y, 9.6), C.lime, MAT.LIME);
  acc.add(UNIT.box, F(0, 0, BED_Y, 0, 10.6, 1.6 - BED_Y, 10.6), C.plinth, MAT.LIME);
  acc.add(UNIT.box, F(0, 0, 1.6, 0, 10.8, 0.22, 10.8), C.snow, MAT.SNOW);
  acc.add(UNIT.box, F(0, 0, 16.3, 0, 10.8, 0.9, 10.8), C.lime, MAT.LIME);
  const g2 = new THREE.ExtrudeGeometry(archFace(7.6, 12.9, 1.9, 1.0, 7.4), { depth: 1.0, bevelEnabled: false, curveSegments: 6 });
  await ctx.yield();
  const bl = new THREE.Shape(); bl.moveTo(-1.8, 0); bl.lineTo(1.8, 0); bl.lineTo(1.8, 5.2); bl.absarc(0, 5.2, 1.8, 0, Math.PI, false); bl.lineTo(-1.8, 0);
  const blG = new THREE.ExtrudeGeometry(bl, { depth: 0.14, bevelEnabled: false, curveSegments: 6 });
  for (let k = 0; k < 4; k++) {
    acc.add(blG, F(k, 0, 4.2, 4.78), DARK, MAT.PLAIN + D2);
    for (const sx of [-1, 1]) acc.add(UNIT.box, F(k, sx * 4.15, 1.8, 4.92, 0.9, 14.5, 0.3), C.lime, MAT.LIME);
    acc.add(g2, F(k, 0, 17.2, 2.8), C.lime, MAT.LIME);
    await ctx.yield();
  }
  acc.add(UNIT.box, F(0, 0, 17.2, 0, 5.5, 0.4, 5.5), C.limeDark, MAT.LIME);
  acc.add(UNIT.box, F(0, 0, 30.1, 0, 8.8, 0.9, 8.8), C.lime, MAT.LIME);
  acc.add(UNIT.box, F(0, 0, 26.6, 0, 5.6, 0.3, 0.3), [0.12, 0.11, 0.08], MAT.PLAIN);
  acc.add(UNIT.bell, F(0, 0, 24.3, 0, 1.2, 2.2, 1.2), [0.12, 0.11, 0.08], MAT.PLAIN);
  acc.add(UNIT.cyl12, F(0, 0, 31, 0, 2.7, 3.2, 2.7), C.lime, MAT.LIME);
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; acc.add(UNIT.face, M(x + Math.cos(a) * 2.68, 31.6, z + Math.sin(a) * 2.68, 0.5, 1.9, 0.16, -a + Math.PI / 2), DARK, MAT.PLAIN + D2); }
  acc.add(UNIT.ball, F(0, 0, 34.2, 0, 2.95, 2.8, 2.95), C.lead, MAT.LEAD);
  acc.add(UNIT.cone, F(0, 0, 36.4, 0, 0.6, 5.6, 0.6), C.gold, MAT.GOLD);
  buildCross(acc, x, 41.8, z, 2.4, 0.03, ry, 1);
  collar(acc, rng, x, z, 7.2, 10, 1.1);
  driftTail(acc, x, z, 5.4, 1);
}
// the cathedral of the approach (SOBOR): the walled five-domed church itself (as the gate churches are built), then what makes it a cluster:
// a low refectory to the west under a green iron roof, the belfry at its end, a round apse to the east with a half dome and a chapel dome over it
async function buildSobor(acc, rng, flip, ctx) {
  const c = SOBOR, { x, z, ry, w, top } = c;
  await buildChurch(acc, rng, c, flip, ctx);
  const W = (px, py, pz, sx, sy, sz, r2 = 0, rx = 0) => M(x, 0, z, 1, 1, 1, ry).multiply(M(px, py, pz, sx, sy, sz, r2, rx));
  const lx = -(w / 2 + 2.75), lh = 5.4;
  acc.add(UNIT.box, W(lx, BED_Y, 0, 5.7, lh - BED_Y, 8.4), COL.lime, MAT.LIME);
  acc.add(UNIT.box, W(lx, lh - 0.5, 0, 5.75, 0.4, 8.8), OCHRE, MAT.LIME + D1);
  acc.add(UNIT.prism, W(lx, lh, 0, 9.2, 2.3, 5.7, Math.PI / 2), COL.green, MAT.LEAD);
  for (const sz of [-1, 1]) for (const dx of [-1.35, 1.35]) {
    acc.add(UNIT.face, W(lx + dx, 1.3, sz * 4.2, 0.85, 1.9, 0.16, sz < 0 ? Math.PI : 0), WIN, MAT.PLAIN + D2);
    acc.add(UNIT.disc, W(lx + dx, 3.2, sz * 4.28, 0.425, 0.16, 0.425, sz < 0 ? Math.PI : 0, Math.PI / 2), WIN, MAT.PLAIN + D2);
    acc.add(UNIT.disc, W(lx + dx, 3.2, sz * 4.22, 0.7, 0.14, 0.7, sz < 0 ? Math.PI : 0, Math.PI / 2), OCHRE, MAT.LIME + D1);
    acc.add(UNIT.box, W(lx + dx, 1.0, sz * 4.3, 1.4, 0.2, 0.3), COL.lime, MAT.LIME);
  }
  await ctx.yield();
  const ax = w / 2 + 0.6, ah = top - 2.2;
  acc.add(UNIT.cyl12, W(ax, BED_Y, 0, 3.3, ah - BED_Y, 3.3), COL.lime, MAT.LIME);
  acc.add(UNIT.cyl12, W(ax, ah - 0.45, 0, 3.5, 0.45, 3.5), OCHRE, MAT.LIME);
  acc.add(UNIT.ball, W(ax, ah, 0, 3.45, 2.3, 3.45), COL.green, MAT.LEAD);
  for (const a of [-1.0, 0, 1.0]) { acc.add(UNIT.face, W(ax + Math.cos(a) * 3.26, 1.4, Math.sin(a) * 3.26, 0.75, 2.5, 0.16, -a + Math.PI / 2), WIN, MAT.PLAIN + D2);
    acc.add(UNIT.box, W(ax + Math.cos(a) * 3.3, 1.1, Math.sin(a) * 3.3, 1.2, 0.2, 0.3, -a + Math.PI / 2), COL.lime, MAT.LIME); }
  const cp = rot2(c, ax + 0.9, 0);
  drumAndDome(acc, cp[0], cp[1], 1.7, ah + 0.6, ah + 3.8, flip ? 0 : 1, 1, 2.2, 0.06, 1.2);
  for (const sx of [-1, 1]) acc.add(UNIT.mound, W(lx + sx * 1.2, -0.01, 5.2, 2.4, 0.5, 1.3, 0.3 * sx), COL.snow, MAT.SNOW);      // snow banked against the refectory's wall
  await ctx.yield();
}
function buildTip(acc, rng, t, i, flip) {
  const [x, z, kind] = t, lean = (5 + rng() * 12) * D2R * (rng() < 0.5 ? -1 : 1), dir = rng() * 6.28, g = ((i >> 1) + flip) % 2;
  if (kind === 0) {            // a cupola drowned to its shoulders
    acc.add(UNIT.cyl8, M(x, -7, z, 1.0, 5.3, 1.0), COL.lime, MAT.LIME);
    acc.add(UNIT.onionC, M(x, -1.75, z, 1.7, 1.7, 1.7, dir), g ? COL.gold : COL.blue, g ? MAT.GOLD : MAT.BLUE);
    buildCross(acc, x, 2.1, z, 2.0, lean, dir, 1);
  } else if (kind === 1) {     // the last metres of a shingled tent roof, a small onion on its neck
    acc.add(UNIT.cone8, M(x, -6.5, z, 3.3, 10.2, 3.3, ST_YAW), COL.shingle, MAT.LEAD);
    acc.add(UNIT.cyl8, M(x, 3.1, z, 0.3, 1.0, 0.3), COL.lime, MAT.LIME);
    acc.add(UNIT.onionS, M(x, 4.0, z, 0.62, 0.62, 0.62), g ? COL.gold : COL.blue, g ? MAT.GOLD : MAT.BLUE);
    buildCross(acc, x, 5.3, z, 1.8, lean * 0.6, dir, 1);
  } else {                     // a gilt needle and its cross; its dome lies a fathom down
    acc.add(UNIT.cone8, M(x, -5, z, 0.75, 7.6, 0.75), COL.gold, MAT.GOLD);
    acc.add(UNIT.onionS, M(x, -7.2, z, 2.0, 2.0, 2.0), COL.green, MAT.GREEN);
    buildCross(acc, x, 2.4, z, 2.2, lean, dir, 1);
  }
  acc.add(UNIT.cone8, M(x, -8.7, z, 4.4, 2.2, 4.4, ST_YAW), COL.green, MAT.GREEN);      // the chapel below: an iron roof on white walls, square to the street like its body
  bodyBox(acc, M(x, BED_Y, z, 6.4, 2.5, 6.4, ST_YAW), 6.4, 1);
  collar(acc, rng, x, z, TIP_R[kind] + 0.4, 5, 0.9, 'track');      // (no slab of its ring lies on the yachts' lane, measured from the flown track: a margin in space, as at the tower)
  driftTail(acc, x, z, 1.5, 1, 1.5);
}
async function buildGate(acc, rng, ctx) {
  const [gx, gz] = GATE, C = COL;
  const F = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0) => M(gx, 0, gz, 1, 1, 1, Math.PI / 2).multiply(M(x, y, z, sx, sy, sz, ry));   // local z = passage axis -> world x
  const s = new THREE.Shape(); s.moveTo(-13, -5); s.lineTo(13, -5); s.lineTo(13, 15); s.lineTo(-13, 15); s.lineTo(-13, -5);
  const hole = new THREE.Path(); hole.moveTo(-8, -5); hole.lineTo(-8, 2); hole.absarc(0, 2, 8, Math.PI, 0, true); hole.lineTo(8, -5); hole.lineTo(-8, -5);
  s.holes.push(hole);
  acc.add(new THREE.ExtrudeGeometry(s, { depth: 8, bevelEnabled: false, curveSegments: 14 }), F(0, 0, -4), C.lime, MAT.LIME);
  const och = [0.6, 0.42, 0.24];
  const ring = (ri, ro, dep, col) => {     // one step of the archivolt, jambs included, on both faces
    const r = new THREE.Shape(); r.moveTo(ro, -5); r.lineTo(ro, 2); r.absarc(0, 2, ro, 0, Math.PI, false); r.lineTo(-ro, -5); r.lineTo(-ri, -5); r.lineTo(-ri, 2);
    r.absarc(0, 2, ri, Math.PI, 0, true); r.lineTo(ri, -5); r.lineTo(ro, -5);
    const g = new THREE.ExtrudeGeometry(r, { depth: dep, bevelEnabled: false, curveSegments: 14 });
    acc.add(g, F(0, 0, 4), col, MAT.LIME); acc.add(g, F(0, 0, -4 - dep), col, MAT.LIME);
  };
  await ctx.yield();
  ring(8, 9.7, 0.45, C.lime); await ctx.yield(); ring(8, 9.1, 0.9, och); await ctx.yield(); ring(8, 8.5, 1.35, C.lime);
  await ctx.yield();
  for (const fz of [-1, 1]) {
    acc.add(UNIT.box, F(0, 12.3, fz * 4.05, 21, 1.55, 0.16), [0.6, 0.45, 0.3], MAT.FRESCO + D1);          // fresco band over the arch
    for (const px of [-10.6, 10.6]) { acc.add(UNIT.box, F(px, -5, fz * 4.55, 1.0, 18.3, 1.9), C.lime, MAT.LIME); acc.add(UNIT.box, F(px, 13.3, fz * 4.3, 1.3, 0.65, 1.7), C.lime, MAT.LIME); }
    for (const px of [-12.2, 12.2]) acc.add(UNIT.box, F(px, 13.3, fz * 4.2, 2, 0.65, 1.1), C.lime, MAT.LIME);
    for (const px of [-8.6, 0, 8.6]) acc.add(UNIT.cyl16, F(px, 17.2 + (px === 0 ? 0.5 : 0), fz * 4.25, 1.2, 1.2, 0.2, 0).multiply(M(0, 0, 0, 1, 1, 1, 0, Math.PI / 2)), [0.6, 0.45, 0.3], MAT.FRESCO);
  }
  for (const fz of [-1, 1]) {                                                                              // relief beside the arch:
    acc.add(UNIT.box, F(0, 13.5, fz * 4.3, 26.4, 0.45, 0.5), C.limeDark, MAT.LIME + D1);                    // the cornice's shadow under the three gables
    for (const sx of [-1, 1]) {
      acc.add(UNIT.box, F(sx * 10.6, 1.5, fz * 4.6, 1.5, 0.7, 2.2), och, MAT.LIME);                        // an ochre impost block and a neck band on each pilaster
      acc.add(UNIT.box, F(sx * 10.6, 12.2, fz * 4.6, 1.4, 0.4, 2.1), och, MAT.LIME);
      acc.add(UNIT.box, F(sx * 12.25, 3.2, fz * 4.58, 1.05, 7.4, 0.12), C.limeDark, MAT.LIME + D1);        // a sunk round-headed niche in each corner pier, an ochre sill under it
      acc.add(UNIT.cyl16, F(sx * 12.25, 10.6, fz * 4.58, 0.525, 0.525, 0.12).multiply(M(0, 0, 0, 1, 1, 1, 0, Math.PI / 2)), C.limeDark, MAT.LIME + D1);
      acc.add(UNIT.box, F(sx * 12.25, 2.75, fz * 4.62, 1.5, 0.4, 0.3), och, MAT.LIME);
      acc.add(UNIT.cyl16, F(sx * 8.15, 10.2, fz * 4.02, 1.3, 1.3, 0.22).multiply(M(0, 0, 0, 1, 1, 1, 0, Math.PI / 2)), och, MAT.LIME + D1);   // a painted medallion in each spandrel, in an ochre ring
      acc.add(UNIT.cyl16, F(sx * 8.15, 10.2, fz * 4.02, 1.02, 1.02, 0.3).multiply(M(0, 0, 0, 1, 1, 1, 0, Math.PI / 2)), [0.6, 0.45, 0.3], MAT.FRESCO + D1);
    }
  }
  await ctx.yield();
  acc.add(UNIT.box, F(0, 13.95, 0, 28, 0.45, 10), och, MAT.LIME);
  acc.add(UNIT.box, F(0, 14.4, 0, 28.8, 0.8, 10.8), C.lime, MAT.LIME);
  for (const px of [-12.2, 12.2]) for (const pz of [-4.2, 4.2]) acc.add(UNIT.box, F(px, -5, pz, 1.6, 20, 0.7), C.lime, MAT.LIME);
  const kok = (w, h) => { const k = new THREE.Shape(); k.moveTo(-w / 2, 0); k.bezierCurveTo(-w / 2, h * 0.8, -w * 0.1, h * 0.62, 0, h); k.bezierCurveTo(w * 0.1, h * 0.62, w / 2, h * 0.8, w / 2, 0); k.lineTo(-w / 2, 0);
    return new THREE.ExtrudeGeometry(k, { depth: 8.6, bevelEnabled: false, curveSegments: 10 }); };
  for (const px of [-8.6, 0, 8.6]) acc.add(kok(8.6, px === 0 ? 5.8 : 4.6), F(px, 15.2, -4.3), C.lime, MAT.LIME);
  for (const px of [-4.3, 4.3, -12.6, 12.6]) acc.add(UNIT.ball6, F(px, 15.25, 0, 1.5, 0.75, 4.6), C.snow, MAT.SNOW);          // snow in the valleys between the gables
  for (const fz of [-1, 1]) acc.add(UNIT.ball6, F(2.5, 15.2, fz * 4.9, 9, 0.35, 0.55), C.snow, MAT.SNOW);                     // and along the cornice
  acc.add(UNIT.cyl16, F(0, 17, 0, 4.4, 3.4, 4.4), C.lime, MAT.LIME);
  acc.add(UNIT.cone8, F(0, 20.4, 0, 5.3, 11.5, 5.3, 0.39), C.shingle, MAT.LEAD);
  acc.add(UNIT.cyl16, F(0, 30.4, 0, 0.95, 1.6, 0.95), C.lime, MAT.LIME);
  acc.add(UNIT.onion, F(0, 31.9, 0, 1.75, 1.75, 1.75), C.blue, MAT.BLUE);
  buildCross(acc, gx, 35.85, gz, 2.6, 0.06, 1.57);
  await ctx.yield();
  // wall tops with merlons, 120 m north and south, a shingled corner-tower roof at each end
  for (const sg of [-1, 1]) {
    acc.add(UNIT.box, F(sg * 73, -5, 0, 120, 5.9, 2.6), C.lime, MAT.LIME);
    for (let i = 0; i < 30; i++) acc.add(UNIT.box, F(sg * (15 + i * 4), 0.9, 0, 1.7, 0.5 + rng() * 0.9, 2.6), C.lime, MAT.LIME);
    acc.add(UNIT.cyl16, F(sg * 133, -5, 0, 6, 9.4, 6), C.lime, MAT.LIME);                 // corner tower: 4 m of drum, a merlon ring, a shingled cone, a finial
    acc.add(UNIT.cyl16, F(sg * 133, 3.5, 0, 6.5, 0.5, 6.5), C.lime, MAT.LIME);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; acc.add(UNIT.box, F(sg * 133 + Math.cos(a) * 6.1, 4.0, Math.sin(a) * 6.1, 1.5, 1.3, 0.7, -a + Math.PI / 2), C.lime, MAT.LIME); }
    acc.add(UNIT.cone8, F(sg * 133, 4.6, 0, 6.3, 9.5, 6.3), C.shingle, MAT.LEAD);
    acc.add(UNIT.cyl, F(sg * 133, 13.6, 0, 0.16, 1.5, 0.16), C.gold, MAT.GOLD);
    acc.add(UNIT.ball6, F(sg * 133, 15.2, 0, 0.42, 0.42, 0.42), C.gold, MAT.GOLD);
    await ctx.yield();
  }
  acc.add(UNIT.ball, F(0, -0.05, 0, 9.5, 0.4, 6), C.snow, MAT.SNOW);       // the snow sill in the arch
  collar(acc, rng, gx + 5, gz - 15, 3, 6, 1); await ctx.yield(); collar(acc, rng, gx + 5, gz + 15, 3, 6, 1);
}

// ---------- THE MASSED CITY: one drowned cathedral-city behind and round the bell tower ----------
// Seen whole from the first frame as ONE skyline climbing to the tower: a kremlin wall with tent-roofed towers along its near edges (north of the
// avenue, east of the channel), tiers of five-domed churches, tent churches and belfries rising behind it to the great Sobor right of the tower.
// Light pieces (an onion of 8 gores, walls whose windows are drawn in the shader); mirrored like everything else. A ring of far churches beyond it
// (no mirrors) dots the horizon. The layout is the composition and is the same on every visit; which domes are gilt changes with the seed.
const TRACK = [[-226.6, 556.3], [-41, 165], [-15, 118], [0, 75], [-7.9, 29.9], [-28.2, -22.3], [-48, -46], [-81, -56.8], [-155, -46], [-300, -44]];
let laneOut = null;                     // metres outside the yachts' lane along the FLOWN track: the world hands this measure down before it builds anything
export function setLane(f) { laneOut = f; }
function laneGap(x, z) { return laneOut ? laneOut(x, z) : trackD(x, z) - 6; }      // (without the world's measure the shaders' polyline serves, six metres either side)
function trackD(x, z) {                 // metres to our track (the polyline the shaders use)
  let best = 1e9;
  for (let i = 0; i < TRACK.length - 1; i++) { const ax = TRACK[i][0], az = TRACK[i][1], dx = TRACK[i + 1][0] - ax, dz = TRACK[i + 1][1] - az;
    const h = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); best = Math.min(best, Math.hypot(x - ax - dx * h, z - az - dz * h)); }
  return best;
}
export const CITY_KEEP = [];            // where no drowned house may stand (filled by buildCity: x, z, radius)
const CLIME = COL.lime.map((v) => v * 0.9);
const CWALL = [CLIME, CLIME, CLIME, [0.74, 0.68, 0.52], [0.68, 0.53, 0.45]];
const DCOL = [COL.blue, COL.gold, COL.copper, COL.silver], DMAT = [MAT.BLUE, MAT.GOLD, MAT.COPPER, MAT.SILVER];
// a wall box whose windows the shader draws: top rounded to a whole metre (it rides in the uv), sth = the height of one storey (0: a kremlin wall)
function cityBox(acc, x, y0, z, w, y1, d, ry, col, sth, nbMin = 1) {
  y1 = Math.round(y1);
  const g = UNIT.box.userData.ni || (UNIT.box.userData.ni = UNIT.box.toNonIndexed());
  const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { const sx = Math.abs(N.getX(i)) > 0.5, fw = sx ? d : w, nb = Math.max(2 * Math.floor(fw / 9) + 1, nbMin);
    uv[i * 2] = (sx ? P.getZ(i) : P.getX(i)) * fw; uv[i * 2 + 1] = y1 + (sth > 0 ? Math.min(fw / nb, 15) / 16 : 0); }
  const b = new THREE.BufferGeometry(); b.setAttribute('position', P); b.setAttribute('normal', N); b.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  acc.add(b, M(x, y0, z, w, y1 - y0, d, ry), col, MAT.CITY + (sth > 0 ? Math.min(Math.max((sth - 2) / 40, 0), 0.45) : 0));
  return y1;
}
function cityMark(acc, x, y, z, h, dir) {      // a cross for the skyline: an upright and a bar, stout enough to hold a pixel far off
  const t = Math.max(0.28, h * 0.1);
  acc.add(UNIT.box, M(x, y, z, t, h, t, dir), COL.gold, MAT.GOLD);
  acc.add(UNIT.box, M(x, y + h * 0.66, z, h * 0.5, t, t, dir), COL.gold, MAT.GOLD);
}
// a drum from y0 to y1 (slit windows in the shader), its onion and cross. lod 0: beside our track; 1: the city; 2: corner domes and the horizon
function cityDome(acc, x, z, R, y0, y1, kind, lod, dir) {
  acc.add(lod > 1 ? UNIT.cyl6 : UNIT.cyl, M(x, y0, z, R * 0.62, y1 - y0, R * 0.62), CLIME, MAT.DRUM);
  acc.add(lod > 1 ? UNIT.onionS : lod ? UNIT.onionC : UNIT.onionLo, M(x, y1, z, R, R, R, dir), DCOL[kind], DMAT[kind]);
  const top = y1 + 2.4 * R;
  if (lod) cityMark(acc, x, top - 0.2, z, Math.max(2.6, R * 0.8), dir); else buildCross(acc, x, top - 0.25, z, Math.max(2.4, R * 0.62), 0.04, dir, 1);
  return top;
}
// a cube church: storeyed walls, a cornice, a low hipped iron roof, a great dome on a tall drum and (o.five) four lesser ones on the corners
function cityChurch(acc, o) {
  const { x, z, ry, w, lod } = o, ns = Math.max(1, Math.round(o.top / 6.5));
  const top = cityBox(acc, x, lod === 0 ? BED_Y : -1.5, z, w, o.top, w, ry, o.col, Math.round(o.top) / ns);
  acc.add(UNIT.box, M(x, top - 0.15, z, w + 0.9, 0.55, w + 0.9, ry), o.band || CLIME, MAT.LIME);
  acc.add(UNIT.pyr, M(x, top + 0.4, z, w * 0.74, 1.2 + w * 0.12, w * 0.74, ry), o.roof || COL.green, MAT.LEAD);
  const R = o.D / 2;
  cityDome(acc, x, z, R, top, Math.round(top + 2.2 + o.D * 0.6), o.kind, lod, ry);
  if (o.five) { const r2 = R * 0.52, c = Math.cos(ry), s = Math.sin(ry), q = w * 0.31;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cityDome(acc, x + c * dx * q + s * dz * q, z - s * dx * q + c * dz * q, r2, top, Math.round(top + 1.6 + r2), o.kind2, lod ? 2 : 1, ry); }
}
// a tent-roofed church: a cube, an octagon, a tall shingled tent, a small onion on a neck
function cityTent(acc, o) {
  const { x, z, ry, w } = o, ns = Math.max(1, Math.round(o.top / 6.5));
  const top = cityBox(acc, x, o.near ? BED_Y : -1.5, z, w, o.top, w, ry, o.col, Math.round(o.top) / ns);
  acc.add(UNIT.box, M(x, top - 0.15, z, w + 0.9, 0.55, w + 0.9, ry), CLIME, MAT.LIME);
  const r8 = w * 0.4, h8 = Math.round(w * 0.45), r = w * 0.085 + 0.5, yn = top + h8 + o.th * 0.86, nk = o.th * 0.14 + 0.6;
  acc.add(UNIT.cyl, M(x, top, z, r8, h8, r8), CLIME, MAT.DRUM);
  acc.add(UNIT.cone8, M(x, top + h8 - 0.2, z, r8 * 1.14, o.th, r8 * 1.14, ry), o.roof || COL.shingle, o.roofMat || MAT.LEAD);
  acc.add(UNIT.cyl6, M(x, yn, z, r * 0.62, nk, r * 0.62), CLIME, MAT.LIME);
  acc.add(UNIT.onionS, M(x, yn + nk - 0.1, z, r, r, r), DCOL[o.kind], DMAT[o.kind]);
  cityMark(acc, x, yn + nk + 2.4 * r - 0.3, z, Math.max(2.6, r * 1.7), ry);
}
// a tiered bell tower: each tier a pace narrower, one tall arch to a face, a cornice between; a cupola or a gilt spire on top
function cityBelfry(acc, o) {
  const { x, z, ry } = o; let y = o.near ? BED_Y : -1.5, w = o.w, base = 0;
  for (let i = 0; i < o.tiers.length; i++) { const yt = Math.round(base + o.tiers[i]);
    cityBox(acc, x, y, z, w, yt, w, ry, o.col, i ? yt - y : yt);
    acc.add(UNIT.box, M(x, yt - 0.1, z, w + 1.0, 0.6, w + 1.0, ry), CLIME, MAT.LIME);
    y = yt + 0.5; base = y; if (i < o.tiers.length - 1) w *= 0.8; }
  if (o.spire) {
    acc.add(UNIT.cyl, M(x, y - 0.5, z, w * 0.42, 2.2, w * 0.42), CLIME, MAT.DRUM);
    acc.add(UNIT.cone8, M(x, y + 1.6, z, w * 0.56, 2.4, w * 0.56, ry), COL.lead, MAT.LEAD);
    acc.add(UNIT.cone8, M(x, y + 3.2, z, w * 0.17, w * 1.7, w * 0.17), COL.gold, MAT.GOLD);
    cityMark(acc, x, y + 3.0 + w * 1.7, z, 3, ry);
  } else cityDome(acc, x, z, w * 0.5, y - 0.5, Math.round(y + 2), o.kind, Math.max(o.lod, 1), ry);
}
// a wall tower: a shaft, an overhanging gallery, a shingled tent with a finial
function cityTower(acc, x, z, r, h, th, round, near) {
  const y0 = near ? BED_Y : -1.5;
  if (round) { if (near) acc.add(UNIT.cyl, M(x, y0, z, r, 0.4 - y0, r), CLIME, MAT.LIME); acc.add(UNIT.cyl, M(x, near ? 0 : y0, z, r, h - (near ? 0 : y0), r), CLIME, MAT.DRUM + 0.2); }
  else cityBox(acc, x, y0, z, r * 1.8, h, r * 1.8, 0.42, CLIME, Math.round(h) / 2, 3);                  // (two rows of three arrow slits to a face)
  acc.add(round ? UNIT.cyl : UNIT.box, M(x, Math.round(h) - 0.3, z, r * (round ? 1.16 : 2.1), 1.6, r * (round ? 1.16 : 2.1), 0.42), CLIME, MAT.LIME);
  acc.add(UNIT.cone8, M(x, Math.round(h) + 1.3, z, r * 1.36, th, r * 1.36, 0.39), COL.shingle, MAT.LEAD);
  acc.add(UNIT.box, M(x, Math.round(h) + 1.0 + th, z, 0.3, 2.2, 0.3), COL.gold, MAT.GOLD);
}
function cityWall(acc, x0, z0, x1, z1, top, near) {      // a length of kremlin wall (merlons cut in the shader)
  const dx = x1 - x0, dz = z1 - z0;
  cityBox(acc, (x0 + x1) / 2, near ? BED_Y : -1.5, (z0 + z1) / 2, Math.hypot(dx, dz), top, 2.4, Math.atan2(-dz, dx), CLIME, 0);
}
// the great Sobor: a three-storeyed cube with round gables, a great dome on a tall drum and four lesser ones
function citySobor(acc, x, z, ry, K) {
  const w = 30, top = cityBox(acc, x, -1.5, z, w, 18, w, ry, CLIME, 6), r = w / 6 - 0.15;
  acc.add(UNIT.box, M(x, top - 0.15, z, w + 1, 0.6, w + 1, ry), OCHRE, MAT.LIME);
  for (let k = 0; k < 4; k++) for (let j = -1; j <= 1; j++) acc.add(UNIT.cyl8, M(x, 0, z, 1, 1, 1, ry + k * Math.PI / 2).multiply(M(j * w / 3, top + 0.2, w / 2 - 0.6, r, 0.6, r * 0.8, 0, Math.PI / 2)), CLIME, MAT.LIME);
  acc.add(UNIT.pyr, M(x, top + 0.4, z, w * 0.72, 4, w * 0.72, ry), COL.green, MAT.LEAD);
  cityDome(acc, x, z, 10, top, 36, K(1), 0, ry);
  const c = Math.cos(ry), s = Math.sin(ry), q = w * 0.32;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cityDome(acc, x + c * dx * q + s * dz * q, z - s * dx * q + c * dz * q, 4.75, top, 26, K(0), 1, ry);
}
export async function buildCity(acc, accFar, ctx, flip) {
  const K = (k) => (flip && k < 2 ? 1 - k : k);                                  // gilt and starred change places by seed
  let sd = 20240917; const r = () => { sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0; return sd / 4294967296; };      // the layout's own fixed generator
  const placed = []; CITY_KEEP.length = 0;
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const wallX = (z) => (z < -84 ? 100 : z < -10 ? 100 + (z + 84) / 74 * 60 : z < 70 ? 160 + (z + 10) / 80 * 12 : 172 - (z - 70) / 80 * 44);   // the east wall
  const free = (x, z, rad) => {
    if (trackD(x, z) < 58 + rad * 0.3) return false;
    if (z < 175 && Math.abs((x - (32.5 - 0.445 * z)) * 0.914) < 13 + rad) return false;      // the red-sailed rival's course round the tower and on through the city
    if (Math.abs(x + 250) < 11 + rad && z > -210 && z < 90) return false;                    // the cream-sailed rival's
    if ((x < -45 && z > -84) || x < -272) return false;                                                    // (the sweep toward the low sun and the avenue stay as they are)
    if (Math.hypot(x, z) < 32 + rad) return false;
    for (const d of DOMES) if (Math.hypot(x - d[0], z - d[1]) < d[2] + 6 + rad) return false;
    for (const d of EXTRA) if (Math.hypot(x - d[0], z - d[1]) < d[2] + 6 + rad) return false;
    for (const c of CHURCHES) if (Math.hypot(x - c.x, z - c.z) < Math.max(c.w, 8) * 0.75 + (c.bel ? 20 : 8) + rad) return false;
    if (Math.hypot(x - TOWER2[0], z - TOWER2[1]) < 14 + rad) return false;
    for (const p of placed) if (Math.hypot(x - p[0], z - p[1]) < p[2] + rad + 3) return false;
    return true;
  };
  const put = (x, z, rad) => { placed.push([x, z, rad]); if (trackD(x, z) < 125) CITY_KEEP.push([x, z, rad + 7]); return trackD(x, z) < 135; };
  // ---- the landmarks, placed by hand ----
  citySobor(acc, 118, -95, 0.42, K); put(118, -95, 24); await ctx.yield();
  cityBelfry(acc, { x: 150, z: -62, ry: 0.42, w: 10, tiers: [18, 11, 9, 8], spire: 1, col: CLIME, lod: 1 }); put(150, -62, 8); await ctx.yield();
  cityTent(acc, { x: -64, z: -172, ry: 0.42, w: 15, top: 12, th: 33, col: CLIME, kind: K(1), roof: DCOL[K(0)], roofMat: DMAT[K(0)] }); put(-64, -172, 11); await ctx.yield();
  cityBelfry(acc, { x: -198, z: -158, ry: 0.3, w: 10, tiers: [18, 11, 9, 8], spire: 1, col: CWALL[3], lod: 1 }); put(-198, -158, 8); await ctx.yield();
  cityChurch(acc, { x: -152, z: -146, ry: 0.42, w: 22, top: 13, D: 10, kind: K(0), kind2: K(1), five: 1, lod: put(-152, -146, 17) ? 0 : 1, col: CLIME, band: OCHRE }); await ctx.yield();
  cityTent(acc, { x: 6, z: -204, ry: 0.3, w: 14, top: 11, th: 29, col: CWALL[3], kind: K(0), roof: COL.copper, roofMat: MAT.COPPER }); put(6, -204, 10); await ctx.yield();
  cityChurch(acc, { x: 150, z: -196, ry: 0.5, w: 24, top: 15, D: 11, kind: K(1), kind2: K(0), five: 1, lod: 1, col: CLIME, band: OCHRE }); put(150, -196, 18); await ctx.yield();
  cityBelfry(acc, { x: 206, z: -138, ry: 0.42, w: 9, tiers: [14, 9, 7, 6], spire: 0, kind: K(1), col: CLIME, lod: 1 }); put(206, -138, 8); await ctx.yield();
  cityChurch(acc, { x: 96, z: 12, ry: 0.42, w: 17, top: 10, D: 8, kind: K(1), kind2: K(0), five: 1, lod: put(96, 12, 13) ? 0 : 1, col: CLIME, band: OCHRE }); await ctx.yield();
  cityTent(acc, { x: 82, z: -44, ry: 0.42, w: 11, top: 9, th: 17, col: CLIME, kind: K(1), roof: DCOL[K(1)], roofMat: DMAT[K(1)] }); put(82, -44, 9); await ctx.yield();
  cityBelfry(acc, { x: 132, z: 58, ry: 0.42, w: 7.5, tiers: [12, 7, 6], spire: 1, col: CLIME, lod: 1 }); put(132, 58, 7); await ctx.yield();
  cityChurch(acc, { x: -30, z: -136, ry: 0.42, w: 18, top: 11, D: 8.5, kind: K(1), kind2: K(0), five: 1, lod: put(-30, -136, 14) ? 0 : 1, col: CLIME, band: OCHRE }); await ctx.yield();
  // ---- a walled monastery east of the channel, 120 m off our track: the city's near arm, in the middle distance from the first frame ----
  cityChurch(acc, { x: 12, z: 304, ry: 0.42, w: 20, top: 12, D: 9.5, kind: K(1), kind2: K(0), five: 1, lod: 1, col: CLIME, band: OCHRE }); put(12, 304, 15);
  cityTent(acc, { x: 40, z: 276, ry: 0.42, w: 12, top: 9, th: 21, col: CWALL[3], kind: K(1), roof: COL.copper, roofMat: MAT.COPPER }); put(40, 276, 9);
  cityBelfry(acc, { x: -16, z: 276, ry: 0.42, w: 8.5, tiers: [14, 9, 7, 6], spire: 1, col: CLIME, lod: 1 }); put(-16, 276, 7); await ctx.yield();
  cityChurch(acc, { x: 44, z: 326, ry: 0.42, w: 11, top: 8, D: 7, kind: K(0), five: 0, lod: 1, col: CWALL[4] }); put(44, 326, 8);
  cityChurch(acc, { x: -22, z: 322, ry: 0.42, w: 10, top: 7, D: 6.4, kind: K(2), five: 0, lod: 1, col: CLIME }); put(-22, 322, 8);
  { const MW = [[-42, 300, -30, 252], [-30, 252, 32, 240], [32, 240, 66, 284], [66, 284, 58, 344], [58, 344, -8, 352], [-8, 352, -42, 300]];
    for (const [x0, z0, x1, z1] of MW) { cityWall(acc, x0, z0, x1, z1, 6, false); cityTower(acc, x0, z0, 3.6, 13, 8, 1, false); put(x0, z0, 6); } }
  await ctx.yield();
  // (its outer ward, nearer the start: a tall starred tent church, a five-domed church and a chapel inside their own length of wall)
  cityTent(acc, { x: -38, z: 372, ry: 0.42, w: 13, top: 10, th: 24, col: CLIME, kind: K(1), roof: DCOL[K(0)], roofMat: DMAT[K(0)] }); put(-38, 372, 10);
  cityChurch(acc, { x: -6, z: 388, ry: 0.42, w: 16, top: 10, D: 8, kind: K(1), kind2: K(0), five: 1, lod: 1, col: CWALL[3], band: OCHRE }); put(-6, 388, 12);
  cityChurch(acc, { x: -50, z: 340, ry: 0.42, w: 10, top: 7, D: 6.6, kind: K(3), five: 0, lod: 1, col: CLIME }); put(-50, 340, 8); await ctx.yield();
  { const MW = [[-42, 300, -68, 338], [-68, 338, -52, 408], [-52, 408, -14, 420], [-14, 420, 20, 398], [20, 398, -8, 352]];
    for (const [x0, z0, x1, z1] of MW) { cityWall(acc, x0, z0, x1, z1, 6, false); if (z0 > 300) { cityTower(acc, x0, z0, 3.6, 12, 8, 1, false); put(x0, z0, 6); } } }
  await ctx.yield();
  // ---- a small convent west of the ice road, in the middle distance on the left of the first frames ----
  cityChurch(acc, { x: -238, z: 198, ry: 0.42, w: 18, top: 11, D: 9, kind: K(0), kind2: K(1), five: 1, lod: 1, col: CLIME, band: OCHRE }); put(-238, 198, 14);
  cityBelfry(acc, { x: -214, z: 216, ry: 0.42, w: 8, tiers: [13, 8, 7], spire: 1, col: CWALL[3], lod: 1 }); put(-214, 216, 7);
  cityChurch(acc, { x: -260, z: 218, ry: 0.42, w: 10, top: 7, D: 6.6, kind: K(1), five: 0, lod: 1, col: CLIME }); put(-260, 218, 8); await ctx.yield();
  // ---- the kremlin wall along the city's near edges, a water gate where each rival sails through, towers at its corners ----
  const WALL = [[-298, -124, -270, -120], [-228, -116, -150, -100], [-150, -100, -62, -104], [-62, -104, 48, -93], [100, -84, 160, -10], [160, -10, 172, 70], [172, 70, 128, 150]];
  for (const [x0, z0, x1, z1] of WALL) { const near = trackD((x0 + x1) / 2, (z0 + z1) / 2) < 125; cityWall(acc, x0, z0, x1, z1, 7, near);
    if (near) { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 12); for (let i = 0; i <= n; i++) CITY_KEEP.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, 10]); } }
  await ctx.yield();
  const TOWERS = [[-270, -120, 5.2, 20, 12, 1], [-228, -116, 5.2, 20, 12, 1], [-150, -100, 4.6, 17, 10, 1], [-62, -104, 4.6, 18, 10, 1], [48, -93, 5.2, 21, 12, 1], [100, -84, 5.2, 21, 12, 1],
    [160, -10, 4.8, 17, 10, 1], [172, 70, 4.6, 16, 9, 1], [128, 150, 4.6, 15, 9, 1], [-193, -104, 3.4, 12, 7, 1], [-106, -102, 3.4, 12, 7, 1], [-7, -98, 3.4, 12, 7, 1], [130, -47, 3.4, 12, 7, 1], [152, 110, 3.4, 11, 7, 1]];
  for (const t of TOWERS) { cityTower(acc, t[0], t[1], t[2], t[3], t[4], t[5], trackD(t[0], t[1]) < 125); put(t[0], t[1], t[2] + 2); }
  await ctx.yield();
  // ---- the fill: a jittered grid, each building as tall as the skyline wants it there (highest behind the tower, falling away to both sides, the front rows lower) ----
  let row = 0;
  for (let cz = -322; cz < 170; cz += 42, row++) for (let cx = -282 + (row % 2) * 21; cx < 290; cx += 42) {
    const x = cx + (r() - 0.5) * 24, z = cz + (r() - 0.5) * 24, ty = r(), rc = r(), rk = r(), rr = r(), rs = r();
    const north = z < -116, east = z >= -116 && x > 32.5 - 0.445 * z + 18 && x < wallX(z) - 13;
    if (!(north || east) || rs < 0.1) continue;
    const s = x * 0.926 + z * 0.377, t = x * 0.377 - z * 0.926;
    const H = Math.min(62, Math.max(28, 62 - 0.13 * Math.abs(s - 25))) * (north ? 0.55 + 0.45 * sm(10, 120, -112 - z) : 0.5 + 0.25 * sm(40, 140, x)) * (0.85 + 0.3 * rr);
    const col = CWALL[Math.floor(rc * 5)], kind = K(rk < 0.3 ? 0 : rk < 0.7 ? 1 : rk < 0.85 ? 2 : 3), ry = 0.42 + (rr - 0.5) * 0.5;
    const tr = rr < 0.3 ? [COL.shingle, MAT.LEAD] : rr < 0.55 ? [COL.copper, MAT.COPPER] : rr < 0.8 ? [DCOL[K(0)], DMAT[K(0)]] : [DCOL[K(1)], DMAT[K(1)]];      // a tent's roof: shingle, ribbed copper, starred cobalt or gilt
    if (ty < 0.38) { const w = Math.min(30, Math.max(10, (H - 5) / 1.45)); if (!free(x, z, w * 0.75)) continue;
      cityChurch(acc, { x, z, ry, w, top: w * 0.62, D: w * 0.5, kind, kind2: kind === K(1) ? K(0) : K(1), five: 1, lod: put(x, z, w * 0.75) ? 0 : 1, col, band: rc > 0.5 ? OCHRE : CLIME });
    } else if (ty < 0.6) { const w = Math.min(18, Math.max(8, (H - 5) / 1.87)); if (!free(x, z, w * 0.75)) continue;
      cityChurch(acc, { x, z, ry, w, top: w * 0.75, D: w * 0.62, kind, five: 0, lod: put(x, z, w * 0.75) ? 0 : 1, col, roof: rr > 0.5 ? COL.shingle : COL.green });
    } else if (ty < 0.8) { const w = Math.min(18, Math.max(8, (H * 1.15 - 3) / 3.1)); if (!free(x, z, w * 0.75)) continue;
      cityTent(acc, { x, z, ry, w, top: w * 0.7, th: w * 1.7, col, kind, roof: tr[0], roofMat: tr[1], near: put(x, z, w * 0.75) });
    } else { const w = Math.min(13, Math.max(6, (H * 1.2 - 3) / 4.1)); if (!free(x, z, w)) continue;
      cityBelfry(acc, { x, z, ry, w, tiers: [w * 1.5, w, w * 0.8], spire: rk > 0.55 ? 1 : 0, kind, col, lod: 1, near: put(x, z, w) }); }
    await ctx.yield();
  }
  // ---- the horizon: far churches with their belfries, pale in the haze ----
  for (const [x, z, w, k] of [[300, 430, 18, 1], [430, 320, 20, 0], [372, -24, 22, 1], [500, 130, 20, 1], [336, -262, 22, 0], [-424, -424, 22, 1], [-700, -330, 24, 1], [-560, -40, 20, 0]]) {
    cityChurch(accFar, { x, z, ry: 0.42, w, top: w * 0.62, D: w * 0.44, kind: K(k), kind2: K(1 - k), five: 1, lod: 2, col: CLIME });
    cityBelfry(accFar, { x: x + w * 1.1, z: z - w * 0.5, ry: 0.42, w: w * 0.42, tiers: [w * 0.8, w * 0.5, w * 0.4], spire: k, kind: K(1), col: CLIME, lod: 2 });
    await ctx.yield();
  }
}

export async function buildHero(ctx, opts = {}) {
  await initUnits(ctx);
  await ctx.yield();
  const rng = ctx.rng.fork('domes-hero');
  const slabRng = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:slabs:' + ctx.seed)) : null;
  if (slabRng) rng.slab = slabRng;
  const U = opts.uniforms || makeUniforms();
  const object = new THREE.Group();
  const acc = new Acc(102000), accFar = new Acc(64000); NM = accFar;
  await ctx.yield();
  await buildTower(acc, ctx); await ctx.yield();
  collar(acc, rng, 0, 0, 13.5, 22, 1.1, true); await ctx.yield();
  const domeTops = [];
  for (let i = 0; i < DOMES.length; i++) { domeTops.push(await buildDome(acc, rng, DOMES[i], i, opts.gilt ? opts.gilt[i] : undefined, ctx, i === 5 || i === 2 || i === 3 ? { slim: true, drum: DRUMS[i] } : i === 6 ? { drum: DRUMS[6] } : { slim: i >= 7 })); await ctx.yield(); }
  await ctx.yield();
  await buildGate(acc, rng, ctx); await ctx.yield();
  // the lesser churches draw from their own generator, after everything else, so the nine domes, tower and gate are built as they always were
  const xr = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:lesser:' + ctx.seed)) : rng, flip = opts.flip ? 1 : 0;
  if (slabRng) xr.slab = slabRng;
  // (they go into a mesh of their own: two smaller vertex arrays are built with shorter stalls than one large one)
  const acc2 = new Acc(292000);
  for (let i = 0; i < EXTRA.length; i++) { const d = EXTRA[i]; const dr = 1.5 + xr() * xr() * (i >= 6 ? 5 : 3.5);
    await buildDome(acc2, xr, d, 9 + i, flip && d[3] < 2 ? 1 - d[3] : d[3], ctx, { lod: 1, drum: d[4] || dr, slim: !!d[5] }); await ctx.yield(); }
  for (const c of CHURCHES) { await buildChurch(acc2, xr, c, flip, ctx); await ctx.yield(); }
  await buildTower2(acc2, xr, ctx); await ctx.yield();
  // (the cathedral of the approach draws from a generator of its own, after everything else: every earlier draw keeps its place)
  { const sr = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:sobor:' + ctx.seed)) : xr; if (slabRng) sr.slab = slabRng;
    await buildSobor(acc2, sr, flip, ctx); await ctx.yield(); }
  { const mk = (tag) => { const g = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('drowned-domes:' + tag + ':' + ctx.seed)) : xr; if (slabRng) g.slab = slabRng; return g; };
    await buildChurch(acc2, mk('sunk'), SUNK, flip, ctx); await ctx.yield();
    const tr = mk('tips'); for (let i = 0; i < TIPS.length; i++) { buildTip(acc2, tr, TIPS[i], i, flip); await ctx.yield(); } }
  // the massed city behind and round the tower (its own mesh, mirrored like the rest) and the far churches on the horizon (no mirror)
  const acc3 = new Acc(100000);
  await ctx.yield();
  await buildCity(acc3, accFar, ctx, flip); await ctx.yield();
  NM = null;
  const geo = await acc.buildAsync(ctx);
  const geo2 = await acc2.buildAsync(ctx);
  const geo3 = await acc3.buildAsync(ctx);
  const geoFar = await accFar.buildAsync(ctx);
  await ctx.yield();
  const surfMat = makeSurfaceMaterial(U);
  await ctx.yield();
  const body = new THREE.Mesh(geo, surfMat); body.frustumCulled = false; object.add(body);
  const mirrorMat = makeMirrorMaterial(U);
  await ctx.yield();
  const mirror = new THREE.Mesh(geo, mirrorMat); mirror.frustumCulled = false; mirror.renderOrder = 3; object.add(mirror);
  const body2 = new THREE.Mesh(geo2, surfMat); body2.frustumCulled = false; object.add(body2);
  const mirror2 = new THREE.Mesh(geo2, mirrorMat); mirror2.frustumCulled = false; mirror2.renderOrder = 3; object.add(mirror2);
  await ctx.yield();
  const body3 = new THREE.Mesh(geo3, surfMat); body3.frustumCulled = false; object.add(body3);
  const mirror3 = new THREE.Mesh(geo3, mirrorMat); mirror3.frustumCulled = false; mirror3.renderOrder = 3; object.add(mirror3);
  const bodyFar = new THREE.Mesh(geoFar, surfMat); bodyFar.frustumCulled = false; object.add(bodyFar);
  object.userData.cityTris = Math.round((geo3.attributes.position.count + geoFar.attributes.position.count) / 3);

  await ctx.yield();
  // the one bell left, in tier three, swinging; its rope trailing in the wind
  const bellMat = new THREE.MeshStandardMaterial({ color: '#4b4a3a', metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide });
  const bellPivot = new THREE.Group(); bellPivot.position.set(0, 41.2, 0); bellPivot.rotation.y = -67 * D2R;
  const bell = new THREE.Mesh(UNIT.bell.clone().scale(1.5, 2.0, 1.5).translate(0, -2.6, 0), bellMat);
  const rope = new THREE.Mesh(new THREE.BoxGeometry(0.07, 5, 0.07).translate(0, -2.5, 0), new THREE.MeshStandardMaterial({ color: '#8d8572', roughness: 1 }));
  rope.position.y = -2.6; bell.add(rope); bellPivot.add(bell); object.add(bellPivot);
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 0.4), bellMat); yoke.position.set(0, 41.4, 0); yoke.rotation.y = -67 * D2R; object.add(yoke);

  await ctx.yield();
  // spindrift streaming north-east off the top cornices: two crossed sheets, scrolling noise
  const plumeMaterial = (aK) => new THREE.ShaderMaterial({
    uniforms: Object.assign({}, U, { uPlA: { value: aK } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; uniform float uTime;
      void main(){ vUv = uv; vec3 p = position; p.y += sin(uv.x * 5. - uTime * 1.3) * 1.4 * uv.x + uv.x * uv.x * 5.; p.z += sin(uv.x * 3.3 - uTime * 0.9 + 1.) * 1.8 * uv.x;
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`varying vec2 vUv; varying vec3 vW; uniform float uTime, uFogDen, uSunK, uHemiK, uPlA; uniform vec3 uSunCol, uFogCol, uSky, uGnd;
      ${GLSL_COMMON}
      void main(){
        float n = fb(vec2(vUv.x * 7. - uTime * 1.5, vUv.y * 3. + vUv.x * 2.)) * fb(vec2(vUv.x * 2.2 - uTime * 0.6, vUv.y * 1.5 + 4.));
        float a = smoothstep(0.1, 0.42, n) * (1. - vUv.x) * smoothstep(0., 0.07, vUv.x) * (1. - abs(vUv.y * 2. - 1.));
        float dist = length(cameraPosition - vW); float f = 1. - exp(-dist * dist * uFogDen * uFogDen);
        gl_FragColor = vec4(mix((uSunCol * uSunK * 0.5 + mix(uGnd, uSky, 0.6) * uHemiK) * (0.3183 * 0.85), uFogCol, f), a * uPlA);        // lit by the hour
      }`,
  });
  const windYaw = Math.atan2(0.616, 0.788);   // +x of the sheet -> north-east
  const plumeMat = plumeMaterial(0.75), veilMat = plumeMaterial(1.5);
  await ctx.yield();
  // (and snow sifting off the tower's first cornice down its lane face and off the cathedral's eave across the lane: the walls that fill the frame there are never still)
  for (const [vx, vy, vz, wid, drop, yaw] of [[-9.5, 16.4, 4.0, 15, 13, -67 * D2R], [-24.6, 8.0, 9.2, 17, 9, 0.42 + Math.PI / 2]]) {
    const vg = new THREE.PlaneGeometry(drop, wid, 12, 3).translate(drop / 2, 0, 0).rotateZ(-Math.PI / 2);
    const vm = new THREE.Mesh(vg, veilMat); vm.position.set(vx, vy, vz); vm.rotation.y = yaw; vm.renderOrder = 6; vm.frustumCulled = false; object.add(vm);
  }
  { const pg = new THREE.PlaneGeometry(24, 4, 12, 2).translate(12, 0, 0), pm = new THREE.Mesh(pg, plumeMat); pm.position.set(-35.2, 9.6, 13.9); pm.rotation.y = Math.atan2(0.616, 0.788); pm.renderOrder = 6; pm.frustumCulled = false; object.add(pm); }
  for (const [y, len, hgt, flat] of [[60.2, 46, 9, 0], [53.2, 34, 7, 0], [60.4, 44, 12, 1], [43.2, 26, 6, 0], [17.2, 30, 6, 0], [31.0, 30, 6, 0]]) {
    const pg = new THREE.PlaneGeometry(len, hgt, 20, 3).translate(len / 2, 0, 0); if (flat) pg.rotateX(-Math.PI / 2);
    const pm = new THREE.Mesh(pg, plumeMat); pm.position.set(2.5, y + (flat ? 0 : hgt * 0.35), -2); pm.rotation.y = windYaw; pm.renderOrder = 6; pm.frustumCulled = false; object.add(pm);
  }

  await ctx.yield();
  const anchors = {
    towerBase: new THREE.Vector3(0, 0, 0), spireTip: new THREE.Vector3(0, 74, 0), belfry: new THREE.Vector3(0, 38, 0),
    domes: domeTops.map((d) => new THREE.Vector3(d[0], d[1], d[2])), domeCentres: DOMES.map((d) => new THREE.Vector3(d[0], 0, d[1])),
    portalSeat: new THREE.Vector3(GATE[0], 2.6, GATE[1]), portalNormal: new THREE.Vector3(1, 0, 0),
  };
  let swing = opts.swing || 0.32;
  return {
    object, radius: 320, height: 74, center: new THREE.Vector3(0, 26, 0), anchors, uniforms: U, geometry: geo, surfaceMaterial: surfMat, mirrorMaterial: mirrorMat,      // (the mirror material itself, for what the world moves over the ice: a twin mesh of it lies in the ice like every dome)
    setSwing(v) { swing = v; },
    update(dt, time, camera) {
      U.uTime.value = time;
      bell.rotation.x = Math.sin(time * 1.15) * swing;
      rope.rotation.x = -bell.rotation.x * 0.7 + 0.25 + Math.sin(time * 2.3) * 0.08; rope.rotation.z = 0.3 + Math.sin(time * 1.7) * 0.1;
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
