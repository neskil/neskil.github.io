// Hero set piece for "flying-boat-karst-bay" (Alighting among the Towers).
//
// TWO EXPORTS, ONE IMAGE
//   buildHero(ctx, opts)    the four-engined high-wing flying boat (40 m span, 28 m hull, 3.4 m propellers) with everything
//                           that belongs to its alighting: spray sheets off both chines, float feathers, droplets, the wake
//                           and contact footprint, shimmering propeller discs that run down to countable blades.
//   buildTower(ctx, opts)   one tower-karst block (sheer fluted walls, flat shoulders, overhangs with stalactite curtains,
//                           cave mouths, black streaks and rust under every ledge, creepers, a tidal notch with a barnacle
//                           line and a foam ring, a jungle cap). opts.pierced bores the 18 x 22 m sea tunnel into its +Z face.
//   makeTowerMaterials(opts) the three tower materials, to share between any number of towers.
//   swiftLine, swiftAt, swiftFlock, swiftWob, swiftArch, swiftMouth, buildSwiftlets
//                           the swiftlets' stream: the world's own flock on a line of four points that comes into a cave
//                           mouth level and on the mouth's axis (THE SWIFTLETS' STREAM, at the foot of this file).
//
// AIRCRAFT FRAME: origin on the water under the hull (waterline of a hull planing on its step), +Y up, nose toward +Z,
// so port is +X and starboard is -X. radius 22, height 9 (fin top 8.6 single, 6.9 twin), wing underside 4.2-4.6.
//
// buildHero opts: palette (the brief's seven), livery 'silver' | 'white' | 'cream' (seeded), twinFin bool (seeded),
//   sprayColor (hex; gold by default, pink at dawn, blue-green at night), sprayGain, lamp (landing-lamp emissive, 2.4),
//   cabin (porthole glow for night, 0), scale, progress (initial clock, default 3.5 = full spray so the viewer shows it),
//   uniforms (a shared light set; normally leave unset and pass hero.uniforms on to buildTower).
// Returned extras:
//   setProgress(s)   s = seconds since the keel first kissed (negative = still flying). Drives burst, skip, the six-second
//                    sheets, float feather, wake, contact shadow, bow wave and the engines running down (blades countable
//                    from s = 9). Map your u to s; nothing here reads wall-clock time except ambient shimmer.
//   heave(s), pitch(s)  suggested keel height and nose-up angle for the same clock (the kiss, the skip, settling off the step).
//   set({ spray, feather, wake, ground, rpm, wet, bow, flow, aileron, elevator, rudder })  direct control, after setProgress.
//   setLight({ sunDir, sunColor, sky, horizon, shade, water, spray, cabin, lamp, foam, ambient })  world-space sun direction and
//                    linear colours; ambient is a gain on the airframe's own fill light (1; about 1.6 by moonlight); fleck (0..1) breaks
//                    the foam footprint into sparkling flecks (the plankton glow of the night variant). Until it is called the piece copies the first DirectionalLight and HemisphereLight in the scene.
//   seatPose(eye, forward, roll, pitch, shift)  poses the aircraft so the strut seat sits at `eye`; call it every frame with the
//                    camera's world position. roll > 0 is right wing down. shift (aircraft frame) lets it drop astern.
//   seatAt(eye, quat, shift)  the same from a whole world quaternion (for a pose built against the camera's own frame).
//   uniforms         the shared light uniforms (uSunDir, uSunCol, uSkyCol, uHorizonCol, uShadeCol, uWaterCol, uSprayCol, uTime).
//   parts            { skin, disc }: the airframe and propeller-disc meshes, so a world can draw the same geometry and
//                    materials a second time (the sister boat of the rare event) without a new shader program.
// anchors (aircraft frame): seat { position, look } the eye point on the starboard float strut, 10.9 m out and 1.6 m under
//   the wing, looking forward and 8 degrees inboard; propHub (outboard starboard propeller, 7 m from the seat); floatNose;
//   bow; sprayCentre (middle of the starboard sheet); wakeOrigin; tail; lamp; departLine (the way the camera slips forward
//   off the strut: swing the aircraft left and astern with seatPose's shift, the propeller disc is 1.5 m inboard of it);
//   flyThrough (an outside pass 6 m clear of the starboard wingtip); viewpoints (three good outside stations).
//   There is no portal seat on the aircraft: the portal sits in the Pierced Tower (buildTower's anchors.portalSeat).
//
// buildTower opts: height, width, depth, pierced, segments, rows, shoulders, crowns, lipTrees, materials (from makeTowerMaterials or a
//   previous tower's .materials), uniforms (pass hero.uniforms so one setLight lights everything), palette, rng, wet.
//   caveAt { x, y, hw, hh } puts one more cave mouth on the +Z face at that place (tower frame), last in anchors.caves.
//   Origin at the foot on the water, +Z is the pierced face; the uv seam runs down the -Z side. anchors: top, front, caves
//   (each cave mouth's centre on the wall, tower frame, with halfWidth and halfHeight), and
//   for a pierced tower tunnelMouth, tunnelSize, portalSeat { position (water level, 8 m inside), normal, width 15, height 13 },
//   approach (three points of the straight run-in). Update: tower.update(dt, time) only if it does not share hero.uniforms.
//
// SPRAY: the starboard hull sheet is the image: two layers 56 x 22 whose root bows out from the chine, thrown 12.6 m/s up and
//   only 1-2.6 m/s aft so it stands ahead of the seat; the throw is lobed along the chine (tongues of 3-9 m that wander aft),
//   the sheet billows in depth, both ends dissolve behind a moving noise front, and above mid-height only filaments, separate
//   tongues and beads are left (dense gold at the chine, mist with open holes above; alpha <= 0.5). Float feathers: two crossed
//   cards per float eroded to streaks and beads. Points (sized from the drawing buffer) are the flying droplets and a mist
//   skirt of soft puffs along the sheets' feet and round their ends. buildAirframe and buildAirframe2 yield between lofts.
// TOWERS: walls stand vertical to a hard shoulder (a 3 m rounded lip in the last 5.5 m), the summit line is nearly level, and
//   the cap is a low hummocked roof (rise 3 m + 3.5% of the width) painted as a mosaic of crown heads by LEAF_FRAG (aSw.z = 1)
//   and covered with modelled crowns (a third ring the lip); sunward half yellow-green, lee half dark green (a floor keeps a
//   shaded crown off black) with a thin gold rim on edges turned to the sun. Rock (ROCK_FRAG) is weathered limestone with
//   weight: warm grey stone under a rain-blackened, lichened skin (dark grey to grey-green) that hangs in irregular curtains
//   30-60 m long, paler ribs between the rain-cut flutes (flute(), rill(): they shift from bed to bed and come and go), a
//   few pale scars where a slab has come away, and distinct black streaks and rust runs hanging from ledges (run()). Beds
//   are of unequal thickness (3-30 m, jointAt()), nearly level, and pinch out; a joint shows as a parting along about half
//   its length, a fifth of it a real ledge with a pale lip, tufts on top and frayed creepers below; joint blocks are laid out
//   bed by bed, and of a block's borders fewer than half are open cracks (cells() also gives the hash of the block across the
//   border), so no course, net or masonry pattern forms. Every layer fades before it is finer than a pixel, and everything
//   that runs down the wall fades where the lathe's (u, y) is stretched over the surface (sK), so nothing smears; far off
//   the skin settles to its mean and the tower stays dark. CLOSE TO (cross-fades gNear inside 100-180 m, nearB inside
//   170-300 m) the vertical families step back and the face is jointed, pitted stone: joint blocks 3-8 m across, each with
//   a tone of its own and a clean edge (some edges open cracks), solution hollows a metre or two across, pits and grain as
//   one height field whose slope is taken by differences in (u, y) (never from screen-space derivatives, which drew a 2 x 2
//   pixel dither), darker in its hollows; the skin keeps to the blocks; thin white rain runnels (thread()) slide down the
//   wetter runs. A face turned from the sun stands in jade-blue shade (shadeK), never grey or olive.
//   Cave mouths are drawn on the flat wall (no dent in the mesh): an arch with a hard ragged rim one pixel wide, stalactite
//   teeth along the upper lip, a pale lit sill and a shadowed brow; inside, the eye's ray is carried on into a narrowing
//   throat with a floor that rises inward, lit by the sun that comes in through the mouth, by sky light falling off inward
//   and by the lit floor's warm bounce (jade-brown deep in, never black); beyond about 150 m they are recessed shadow in the
//   wall's own shade. The foot stands in a wet near-black tide band five or six metres
//   high (never under a pixel or two) with a pale barnacle line. Relief is read from the height field in sun and in shade;
//   the wet sheen in shade takes the rock's own colour; a moving jade water shimmer climbs the lowest 36 m.
//   opts.lipTrees (a count, scaled by detail) stands pale-trunked leaning trees, fan palms and cycads on the wall's lips and
//   shoulders (LEAF material, the crowns' draw). With antialiasing a sliver triangle is shaded outside its own area, so the
//   rock and leaf shaders clamp the varyings that feed exponents and products and cap their colour.
// COST: aircraft about 24k triangles in 7 draws (skin, discs, blades, wires, foam footprint, sheets, droplets + mist),
//   130-260 ms. A 240 x 150 m pierced tower is about 26k triangles, a 150 m tower with crowns: 260 about 12k, 3 draws each,
//   3 shader programs for all towers together (plus one more for the pierced one). finishTower yields inside every loop.
// LIGHT: everything is lit by the shared uniforms, not by scene lights: a low warm key (about 2.4 x #FFD9A0), jade-blue
//   shade, sky and water colours for reflections and bounce. All materials take scene fog except spray and droplets.
//   Bloom should catch only the wet glints, the lamp, the propeller tips' sheen and the backlit spray (gold: sheets, beads
//   and droplets are capped at under twice the spray colour, never white). The propeller disc takes uDim (1; a world sets it
//   lower for a faint idle shimmer by night).
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#2F8F78', '#17574C', '#C9C6B8', '#1E3B24', '#F2B27A', '#2B3340', '#B3402A'];
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------- geometry builder
// Collects lofted patches into one buffer. Every vertex carries: position, uv (metres along / across the
// skin, used for panel lines and rivets), colour (paint) and aTag = (surface kind, hinge id, porthole u, v).
class Geo {
  constructor() { this.p = []; this.uv = []; this.c = []; this.t = []; this.i = []; this.n = 0; }
  // rings[s][k] = [x,y,z]; all rings the same length. o: { col(pt,s,k)->[r,g,b], surf(pt,s,k), move(pt,s,k), ph(pt,s,k)->[u,v], u0 }
  grid(rings, o = {}) {
    const S = rings.length, K = rings[0].length, base = this.n;
    let u = o.u0 || 0;
    const mid = K >> 1;
    for (let s = 0; s < S; s++) {
      const r = rings[s];
      if (s > 0) { const a = rings[s - 1][mid], b = r[mid]; u += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); }
      let v = 0;
      for (let k = 0; k < K; k++) {
        const pt = r[k];
        if (k > 0) { const q = r[k - 1]; v += Math.hypot(pt[0] - q[0], pt[1] - q[1], pt[2] - q[2]); }
        this.p.push(pt[0], pt[1], pt[2]);
        this.uv.push(o.uOf ? o.uOf(pt, s, k) : u, o.vOf ? o.vOf(pt, s, k) : v);
        const c = o.col ? o.col(pt, s, k) : [0.6, 0.6, 0.6];
        this.c.push(c[0], c[1], c[2]);
        const ph = o.ph ? o.ph(pt, s, k) : [0, 99];
        this.t.push(o.surf ? o.surf(pt, s, k) : 0, o.move ? o.move(pt, s, k) : 0, ph[0], ph[1]);
      }
    }
    for (let s = 0; s < S - 1; s++) for (let k = 0; k < K - 1; k++) {
      const a = base + s * K + k, b = a + 1, c = a + K, d = c + 1;
      if (o.flip) this.i.push(a, b, c, b, d, c); else this.i.push(a, c, b, b, c, d);
    }
    this.n += S * K;
  }
  // a fan closing a ring to a point
  cap(ring, tip, o = {}) { this.grid([ring, ring.map(() => tip)], o); }
  // async so the page gets a frame between the attribute copies and inside the normal pass (the same area-weighted vertex
  // normals computeVertexNormals would give, accumulated in slices)
  async build(ctx) {
    const brk = async () => { if (ctx) await ctx.yield(); };
    const g = new THREE.BufferGeometry(), P = new Float32Array(this.p), I = this.i, N = new Float32Array(P.length);
    await brk();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uv), 2)); await brk();
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3)); await brk();
    g.setAttribute('aTag', new THREE.BufferAttribute(new Float32Array(this.t), 4)); await brk();
    g.setIndex(I); await brk();
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = P[c] - P[b], uy = P[c + 1] - P[b + 1], uz = P[c + 2] - P[b + 2], vx = P[a] - P[b], vy = P[a + 1] - P[b + 1], vz = P[a + 2] - P[b + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      N[a] += nx; N[a + 1] += ny; N[a + 2] += nz; N[b] += nx; N[b + 1] += ny; N[b + 2] += nz; N[c] += nx; N[c + 1] += ny; N[c + 2] += nz;
      if (t % 12000 === 11997) await brk();
    }
    for (let i = 0; i < N.length; i += 3) { const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1; N[i] /= l; N[i + 1] /= l; N[i + 2] /= l; }
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    return g;
  }
}

// NACA-like section: returns K points from the trailing edge over the top, round the nose, back underneath.
// le = leading-edge point, cd = unit chord direction (aft), nd = unit thickness direction, cut = chord fraction kept.
function airfoil(le, cd, nd, chord, thick, camber, K = 23, cut = 1) {
  const out = [], h = (K - 1) / 2;
  for (let k = 0; k < K; k++) {
    const side = k < h ? 1 : -1;
    const f = Math.abs(k - h) / h;                 // 1 at trailing edge, 0 at nose
    const x = cut * (1 - Math.cos(f * Math.PI * 0.5)) ** 1.25;   // points bunched at the nose
    const yt = 5 * thick * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1036 * x * x * x * x);
    const yc = camber * 4 * x * (1 - x);
    const y = yc + side * yt + (cut < 1 && f > 0.999 ? 0 : 0);
    out.push([le.x + cd.x * x * chord + nd.x * y * chord, le.y + cd.y * x * chord + nd.y * y * chord, le.z + cd.z * x * chord + nd.z * y * chord, x]);
  }
  return out;
}

// ---------------------------------------------------------------- shared GLSL
const GLSL_NOISE = /* glsl */`
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p+n*17.3+3.1)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm3(vec2 p){ return vnoise(p)*0.55 + vnoise(p*2.13+7.1)*0.3 + vnoise(p*4.31+3.7)*0.15; }
`;

// Skin of the aircraft: paint or bare metal, doped fabric, glass, rubber, lamp. Lit by uniforms only.
const SKIN_VERT = /* glsl */`
attribute vec4 aTag;
uniform vec3 uHP[6]; uniform vec3 uHD[6]; uniform float uHA[6];
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN; varying vec2 vUv; varying vec3 vCol; varying vec4 vTag;
#include <fog_pars_vertex>
vec3 hrot(vec3 q, vec3 d, float a){ float c = cos(a), s = sin(a); return q*c + cross(d, q)*s + d*dot(d, q)*(1.-c); }
void main(){
  vec3 p = position, n = normal;
  int id = int(aTag.y + 0.5);
  if (id > 0) { p = uHP[id] + hrot(p - uHP[id], uHD[id], uHA[id]); n = hrot(n, uHD[id], uHA[id]); }
  vL = p; vLN = n; vUv = uv; vCol = color; vTag = aTag;
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vN = mat3(modelMatrix) * n;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SKIN_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizonCol, uShadeCol, uWaterCol, uLampCol;
uniform float uTime, uWet, uMetal, uCabin, uLamp, uRunway, uAmbK;
uniform vec2 uPh; uniform vec3 uStripe; uniform float uStripeOn;
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec3 vLN; varying vec2 vUv; varying vec3 vCol; varying vec4 vTag;
#include <fog_pars_fragment>
${GLSL_NOISE}
vec3 envCol(vec3 r, float t){
  float up = clamp(r.y, 0., 1.);
  vec3 sky = mix(uHorizonCol, uSkyCol, pow(up, 0.55));
  float sh = vnoise(r.xz*5. / max(0.25, -r.y) + vec2(t*0.35, -t*0.2));
  vec3 wat = mix(uWaterCol * 0.55, uHorizonCol * 0.42, 0.62) * (0.45 + 0.4*sh*sh);
  wat = mix(uHorizonCol*0.5, wat, smoothstep(0., 0.35, -r.y));
  return mix(wat, sky, smoothstep(-0.02, 0.04, r.y));
}
void main(){
  vec3 Ng = normalize(vN); if (!gl_FrontFacing) Ng = -Ng;
  vec3 N = Ng;
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(uSunDir);
  float surf = vTag.x;
  float isFab = step(0.5, surf) * step(surf, 1.5);
  float isGlass = step(1.5, surf) * step(surf, 2.5);
  float isDark = step(2.5, surf) * step(surf, 3.5);
  float isLamp = step(3.5, surf);
  float isMetal = 1. - step(0.5, surf);
  vec3 base = vCol;
  float gloss = mix(0.55, 0.12, isFab); gloss = mix(gloss, 0.08, isDark);
  // ---- panel lines, per-panel tone, rivet rows (metal skin)
  vec2 g = vUv / vec2(0.92, 0.46);
  vec2 gw = fwidth(g) + 1e-5;
  vec2 gc = 0.5 - abs(fract(g) - 0.5);
  vec2 ln = 1. - smoothstep(vec2(0.), gw*1.6 + vec2(0.006, 0.012), gc);
  float lfade = 1. - smoothstep(0.1, 0.4, max(gw.x, gw.y));
  float line = max(ln.x, ln.y) * lfade;
  float tone = h21(floor(g) + 3.7);
  float mm = isMetal;
  base *= 1. + mm * (tone - 0.5) * 0.22 * lfade;
  gloss *= 1. + mm * (tone - 0.5) * 0.5;
  base *= 1. - mm * line * mix(0.26, 0.34, uMetal);
  vec2 duv = fwidth(vUv);
  float rfade = (1. - smoothstep(0.02, 0.05, max(duv.x, duv.y))) * mm;
  vec2 em = gc * vec2(0.92, 0.46);                 // metres to the nearest seam on each axis
  float r1 = length(vec2((fract(vUv.x/0.085) - 0.5)*0.085, em.y - 0.036));
  float r2 = length(vec2((fract(vUv.y/0.085) - 0.5)*0.085, em.x - 0.036));
  float riv = (1. - smoothstep(0.007, 0.015, min(r1, r2))) * rfade;
  base *= 1. - riv * 0.5;
  // ---- doped fabric: ribs showing through, slight scallop between them
  float rb = fract(vUv.x / 0.31);
  float rib = smoothstep(0.38, 0.5, abs(rb - 0.5));
  float ribw = 1. - smoothstep(0.1, 0.5, fwidth(vUv.x / 0.31));
  base *= 1. - isFab * ribw * (0.16 * rib - 0.07 * cos(rb * 6.2832));
  // ---- grime and rain streaks running aft
  float gr = fbm3(vec2(vL.z * 0.35, (vL.x + vL.y) * 2.6));
  float gr2 = fbm3(vL.xz * 1.7 + vL.y);
  base *= 1. - (1. - isLamp) * (0.3 * smoothstep(0.4, 0.85, gr) + 0.12 * gr2 - 0.05);
  // ---- portholes on the hull side
  float inRow = step(uPh.x, vTag.z) * step(vTag.z, uPh.y);
  float pu = (fract(vTag.z / 1.3) - 0.5) * 1.3;
  float pd = length(vec2(pu, vTag.w));
  float pd2 = length(vec2(pu, vTag.w - 1.15)) + 9. * step(vTag.z, uPh.x + 5.2) + 9. * step(uPh.y - 2.6, vTag.z);
  pd = min(pd, pd2) + 9. * (1. - inRow);
  float pw = fwidth(pd) + 1e-4;
  float pGlass = 1. - smoothstep(0.17 - pw, 0.17 + pw, pd);
  float pRim = (1. - smoothstep(0.225 - pw, 0.225 + pw, pd)) * (1. - pGlass);
  base = mix(base, base * 0.55 + 0.05, pRim);
  float sw = fwidth(vTag.w) + 1e-4;
  float stripe = step(vTag.w, 50.) * smoothstep(0.52 - sw, 0.52 + sw, vTag.w) * (1. - smoothstep(0.70 - sw, 0.70 + sw, vTag.w)) * uStripeOn;
  base = mix(base, uStripe, stripe * (1. - pGlass) * (1. - pRim));
  isGlass = max(isGlass, pGlass);
  // ---- glazing bars on the flight deck
  vec2 fr = 0.5 - abs(fract(vUv / vec2(0.62, 0.5)) - 0.5);
  float bar = step(1.5, surf) * step(surf, 2.5) * (1. - smoothstep(0.035, 0.05, min(fr.x * 0.62, fr.y * 0.5)));
  isGlass *= 1. - bar;
  base = mix(base, vec3(0.012, 0.018, 0.022), isGlass);
  base = mix(base, vec3(0.42, 0.43, 0.42), bar);
  gloss = mix(gloss, 0.95, isGlass);
  // ---- rain beads crawling aft
  vec3 an = abs(normalize(vLN));
  vec2 q = an.y > 0.55 ? vL.xz : (an.x > an.z ? vL.yz : vL.xz + vL.y);
  q.y += uTime * (0.55 + 0.5 * uRunway);
  vec2 bq = q * vec2(26., 7.);
  vec2 bi = floor(bq); vec2 bf = fract(bq);
  vec2 bo = h22(bi);
  float bfade = 1. - smoothstep(0.25, 0.8, max(fwidth(bq.x), fwidth(bq.y)));
  vec2 bd = (bf - 0.3 - 0.4 * bo) / vec2(26., 7.);
  float bdm = length(vec2(bd.x, bd.y * (bd.y > 0. ? 0.2 : 1.)));
  float bead = (1. - smoothstep(0.003, 0.0065, bdm)) * step(0.66, bo.x) * bfade * uWet * (1. - isLamp) * (1. - isGlass * 0.5);
  N = normalize(N + bead * vec3(bd.x, 0.004, min(bd.y, 0.01)) * 22.);
  // ---- light
  float ndl = dot(N, L);
  float lit = smoothstep(-0.08, 0.55, ndl);
  float skyv = Ng.y * 0.5 + 0.5;
  float cau = vnoise(vL.xz * 1.6 + vec2(uTime * 0.6, uTime * 0.37)) * vnoise(vL.xz * 3.3 - vec2(uTime * 0.45, -uTime * 0.5));
  vec3 shd = mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.5);
  vec3 bounce = mix(uHorizonCol, vec3(dot(uHorizonCol, vec3(0.3333))), 0.45);
  vec3 amb = mix(shd * 0.4 + bounce * 0.44 + mix(uWaterCol, bounce, 0.35) * 1.1 * cau * cau, uSkyCol * 0.8 + uHorizonCol * 0.3, smoothstep(0.25, 0.8, skyv));
  vec3 col = base * (uSunCol * lit * (0.55 + 0.45 * max(ndl, 0.)) * 0.74 + amb * 0.62 * uAmbK);
  // ---- reflections: sky above, shimmering jade below, the sun as a wet glint
  vec3 R = reflect(-V, N);
  float ndv = clamp(dot(N, V), 0., 1.);
  float f0 = mix(0.045, 0.4, isMetal * uMetal); f0 = mix(f0, 0.07, isGlass); f0 += bead * 0.25;
  float fres = f0 + (1. - f0) * pow(1. - ndv, 5.);
  vec3 env = envCol(R, uTime);
  vec3 tint = mix(vec3(1.), base * 1.25 + 0.08, isMetal * uMetal * (1. - isGlass));
  float wetg = clamp(gloss + uWet * 0.3 * (1. - isFab), 0., 1.);
  float downF = mix(1., 0.3, smoothstep(0.2, 0.75, -Ng.y));
  col = mix(col, env * tint, clamp(fres * (0.35 + 0.65 * wetg), 0., 1.) * (1. - isLamp) * downF);
  float rl = max(dot(R, L), 0.);
  float sp = pow(rl, mix(18., 140., wetg)) * mix(0.25, 2.2, wetg) + pow(rl, 420.) * bead * 9.;
  col += uSunCol * tint * sp * (0.25 + 0.75 * smoothstep(-0.25, 0.1, dot(Ng, L)));
  // ---- lit cabin behind the portholes, landing lamp
  col += pGlass * uCabin * vec3(1.0, 0.72, 0.38) * (0.55 + 0.45 * vnoise(vec2(vTag.z * 3., 1.)));
  float lens = 0.6 + 0.4 * cos(length(fract(vUv * 28.) - 0.5) * 9.);
  col = mix(col, uLampCol * (0.08 + uLamp * lens * (0.5 + 0.5 * ndv)), isLamp);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the airframe (aircraft frame: +Z nose, +Y up, +X port)
const WING = { rootChord: 6.3, tipChord: 3.0, leZ: 3.3, sweep: 0.085, leY: 4.72, dihedral: 0.012, ailIn: 11.2, ailOut: 18.6, ailCut: 0.74 };
const wingChord = (ax) => {
  const c = ax < 1.8 ? WING.rootChord : lerp(WING.rootChord, WING.tipChord, (ax - 1.8) / 16.2);
  return ax > 18 ? c * Math.sqrt(Math.max(0.02, 1 - ((ax - 18) / 2.03) ** 2)) : c;
};
const wingLE = (x) => {
  const ax = Math.abs(x), full = ax < 1.8 ? WING.rootChord : lerp(WING.rootChord, WING.tipChord, (ax - 1.8) / 16.2);
  return V3(x, WING.leY + WING.dihedral * ax, WING.leZ - WING.sweep * ax - (full - wingChord(ax)) * 0.45);
};
const wingThick = (ax) => lerp(0.17, 0.105, sat(ax / 20));
// lower-surface height of the wing at span x and chord fraction f
const wingUnderY = (x, f) => { const ax = Math.abs(x), c = wingChord(ax), t = wingThick(ax);
  const yt = 5 * t * (0.2969 * Math.sqrt(f) - 0.126 * f - 0.3516 * f * f + 0.2843 * f ** 3 - 0.1036 * f ** 4);
  return wingLE(x).y - 0.05 * f * c + (0.03 * 4 * f * (1 - f) - yt) * c; };

const HULL = {
  keel(z, fore) {
    if (z > 1 || (z === 1 && fore)) return -0.55 + 3.3 * ((z - 1) / 12) ** 3;
    if (z > -7 || (z === -7 && fore)) return -0.33 + ((1 - z) / 8) * 0.75;
    return 0.6 + 2.5 * ((-7 - z) / 8) ** 1.2;
  },
  beam(z) {
    if (z > 6) return 1.75 * Math.max(0, 1 - ((z - 6) / 7) ** 2) ** 0.55;
    if (z > -1) return 1.75;
    if (z > -7) return lerp(1.75, 0.55, ((-1 - z) / 6) ** 1.3);
    return lerp(0.55, 0.1, (-7 - z) / 8);
  },
  upper(z) {
    if (z > 6) return 1.6 * Math.max(0, 1 - ((z - 6) / 7) ** 2) ** 0.55;
    if (z > -1) return 1.6;
    return lerp(1.6, 0.12, ((-1 - z) / 14) ** 1.15);
  },
  top(z) {
    if (z > 6) return 4.0 - 0.7 * ((z - 6) / 7) ** 2;
    if (z > -4) return 4.0;
    const t = (-4 - z) / 11; return 4.0 - 0.45 * Math.sin(Math.PI * t) + 0.3 * t;
  },
};
const ROW_Y = 2.15;   // lower porthole row

function hullSection(z, fore) {
  const yk = HULL.keel(z, fore), bw = HULL.beam(z), wu = HULL.upper(z), top = HULL.top(z);
  const aft = z < -7 ? (-7 - z) / 8 : 0;
  const bowS = z > 6 ? ((z - 6) / 7) ** 2 : 0;
  const yc = yk + Math.min((0.5 + 0.55 * bowS) * (1 - aft) + 0.15 * aft, (top - yk) * 0.45);
  const crown = Math.min(1.05, (top - yc) * 0.45), ys = top - crown;
  const bottom = [], upper = [];
  for (let k = 0; k <= 4; k++) { const f = k / 4; bottom.push([bw * f, lerp(yk, yc, f) + 0.05 * Math.sin(Math.PI * f) * (1 - aft), z]); }
  for (let k = 0; k <= 6; k++) { const f = k / 6; upper.push([lerp(bw, wu, sstep(0, 0.45, f)), lerp(yc, ys, f), z]); }
  for (let j = 1; j <= 7; j++) { const a = (j / 7) * Math.PI * 0.5; upper.push([wu * Math.cos(a) ** 0.75, ys + crown * Math.sin(a) ** 0.85, z]); }
  return { bottom, upper };
}

function strut(G, a, b, chord, thick, col, flare = 1.5) {
  const ax = V3().subVectors(b, a), len = ax.length(); ax.normalize();
  const cz = V3(0, 0, 1).addScaledVector(ax, -ax.z).normalize();       // chord direction: fore-aft, square to the strut
  const cx = V3().crossVectors(ax, cz).normalize();
  const rings = [];
  for (const [f, s] of [[0, flare], [0.08, 1.1], [0.2, 1], [0.8, 1], [0.92, 1.1], [1, flare]]) {
    const c = V3().lerpVectors(a, b, f), r = [];
    for (let k = 0; k <= 10; k++) {
      const t = (k / 10) * Math.PI * 2, cc = Math.cos(t), ss = Math.sin(t);
      const ch = (cc > 0 ? 0.42 : 0.58) * chord * s * cc, th = thick * 0.5 * s * ss * (cc > 0 ? 1 : Math.sqrt(Math.max(0, 1 + cc * 0.55)));
      r.push([c.x + cz.x * ch + cx.x * th, c.y + cz.y * ch + cx.y * th, c.z + cz.z * ch + cx.z * th]);
    }
    rings.push(r);
  }
  G.grid(rings, { col: () => col, uOf: (p, s) => s < 3 ? [0, 0.08, 0.2][s] * len : [0.8, 0.92, 1][s - 3] * len });
  return len;
}

async function buildAirframe(rng, L, ctx) {
  const G = new Geo();
  const body = L.body, dark = L.bottom, trim = L.trim, fab = L.fabric;
  // ---- hull: bottom port, bottom starboard, and the upper shell in one ring; crease at keel and chine
  const zs = [];
  for (let z = 12.98; z > 12; z -= 0.25) zs.push([z, true]);
  for (let z = 12; z > 1.01; z -= 0.5) zs.push([z, true]);
  zs.push([1, true], [1, false]);
  for (let z = 0.5; z > -6.99; z -= 0.5) zs.push([z, false]);
  zs.push([-7, true], [-7, false]);
  for (let z = -7.5; z > -15.01; z -= 0.5) zs.push([z, false]);
  const secs = zs.map(([z, f]) => hullSection(z, f));
  const hullCol = (p) => {
    const wl = sstep(0.34, 0.42, p[1] - 0.0);                      // boot-topping at the waterline
    let c = mixc(dark, body, wl);
    const nose = sstep(8.6, 9.6, p[2]) * sstep(HULL.top(p[2]) - 0.75, HULL.top(p[2]) - 0.35, p[1]);
    c = mixc(c, L.glare, nose);                                    // anti-glare panel ahead of the windscreen
    return c;
  };
  const hullPh = (p) => [p[2], p[1] - ROW_Y];
  const uOfZ = (p) => 13 - p[2];
  for (const sx of [1, -1]) {
    G.grid(secs.map((s) => s.bottom.map((p) => [p[0] * sx, p[1], p[2]])), { col: () => dark, uOf: uOfZ, flip: sx < 0, ph: () => [0, 99] });
  }
  await ctx.yield();
  G.grid(secs.map((s) => [...s.upper.map((p) => [p[0], p[1], p[2]]), ...s.upper.slice(0, -1).reverse().map((p) => [-p[0], p[1], p[2]])]),
    { col: hullCol, uOf: uOfZ, ph: hullPh });
  await ctx.yield();
  // tail cone closure
  { const s = secs[secs.length - 1]; const ring = [...s.upper, ...s.upper.slice(0, -1).reverse().map((p) => [-p[0], p[1], p[2]])];
    G.grid([ring, ring.map((p) => [0, p[1], p[2] - 0.12])], { col: () => body }); }
  // step faces are part of the bottom patches (the doubled stations)
  // ---- flight deck glazing
  { const st = [[9.75, -0.02, 1.0, 2], [9.15, 0.5, 1.22, 2], [8.3, 0.66, 1.3, 2], [7.4, 0.66, 1.3, 2], [7.38, 0.66, 1.3, 0], [6.2, 0.45, 1.2, 0], [4.9, 0.0, 0.9, 0]];
    const rings = st.map(([z, h, w]) => { const r = []; const y0 = HULL.top(z) - 0.42;
      for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI; r.push([w * Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.7, y0 + (h + 0.42) * Math.sin(a) ** 0.6, z]); }
      return r; });
    G.grid(rings, { col: () => body, surf: (p, s) => st[s][3], uOf: (p) => 9.75 - p[2] + 0.31, vOf: (p, s, k) => k * 0.25 + 0.25 }); }
  // ---- wing: one loft tip to tip; aileron stations doubled so the control surface shears cleanly
  const xs = [];
  { const half = [0, 1.0, 1.8, 2.6, 3.5, 4.4, 5.5, 6.5, 7.4, 8.4, 9.6, 10.4, WING.ailIn, 'A', 12.6, 14.2, 15.8, 17.4, WING.ailOut, 'B', 19.0, 19.5, 19.8, 19.97, 20.02];
    const mk = (sgn) => { const o = []; let ail = false, prev = 0;
      for (const h of half) { if (h === 'A') { ail = true; o.push([sgn * prev, true]); } else if (h === 'B') { ail = false; o.push([sgn * prev, false]); } else { o.push([sgn * h, ail]); prev = h; } }
      return o; };
    const port = mk(1), stb = mk(-1); stb.shift();
    xs.push(...stb.reverse().map(([x, a]) => [x, a]), ...port);
  }
  const cd = V3(0, -0.05, -1).normalize(), nd = V3(0, 1, -0.05).normalize();
  await ctx.yield();
  const wingRings = xs.map(([x]) => { const ax = Math.abs(x); return airfoil(wingLE(x), cd, nd, wingChord(ax), wingThick(ax), 0.03, 27); });
  const isAil = (p, s) => xs[s][1] && p[3] > WING.ailCut;
  G.grid(wingRings, {
    uOf: (p, s) => xs[s][0] + 40, flip: true,
    col: (p, s) => { if (isAil(p, s)) return fab; const boot = sstep(0.035, 0.02, p[3]) * sstep(2.2, 2.6, Math.abs(xs[s][0])); return mixc(body, L.glare, boot); },
    surf: (p, s) => (isAil(p, s) ? 1 : 0),
    move: (p, s) => (isAil(p, s) ? (xs[s][0] > 0 ? 1 : 2) : 0),
  });
  await ctx.yield();
  const hinge = (x0, x1, f) => { const a = wingLE(x0).addScaledVector(cd, f * wingChord(Math.abs(x0))), b = wingLE(x1).addScaledVector(cd, f * wingChord(Math.abs(x1)));
    return { p: a.clone().lerp(b, 0.5), d: b.sub(a).normalize() }; };
  const hinges = [null, hinge(WING.ailIn, WING.ailOut, WING.ailCut), hinge(-WING.ailIn, -WING.ailOut, WING.ailCut)];
  // ---- landing lamps let into the underside, one each side
  const lamps = [];
  for (const sx of [1, -1]) {
    const lx = sx * 10.15, f = 0.13, c = wingLE(lx).addScaledVector(cd, f * wingChord(10.15)); c.y = wingUnderY(lx, f) - 0.012;
    const ringAt = (r, dy) => { const o = []; for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2; o.push([c.x + Math.cos(a) * r, c.y + dy - Math.sin(a) * r * 0.04, c.z + Math.sin(a) * r]); } return o; };
    G.grid([ringAt(0.23, 0.01), ringAt(0.2, -0.03), ringAt(0.165, -0.035)], { col: () => L.glare, surf: () => 3, flip: true });
    G.grid([ringAt(0.165, -0.035), ringAt(0.09, -0.065), ringAt(0.001, -0.075)], { col: () => [1, 1, 1], surf: () => 4, flip: true, uOf: (p) => p[0] * 0.5, vOf: (p) => p[2] * 0.5 });
    lamps.push(c.clone());
  }
  return { G, hinges, cd, nd, lamps };
}

const NAC_X = [3.5, 7.4, -3.5, -7.4];
const FLOAT_X = 11.9, FLOAT_DZ = 0.9;
const nacHub = (x) => { const le = wingLE(x); return V3(x, le.y + 0.06, le.z + 2.32); };   // propeller centre

async function buildAirframe2(G, L, rng, variant, ctx) {
  const body = L.body, dark = L.bottom, fab = L.fabric;
  // ---- four radial-engine nacelles: lipped cowl with bronze collector ring, gills, tapering fairing over the wing
  const prof = [[0.1, 0.5, 2], [0.0, 0.6, 1], [0.05, 0.69, 1], [0.16, 0.75, 1], [0.38, 0.8, 0], [0.6, 0.815, 0], [0.62, 0.823, 3], [0.67, 0.823, 3], [0.69, 0.82, 0], [0.9, 0.83, 0], [1.2, 0.84, 0], [1.3, 0.87, 3], [1.31, 0.68, 3], [2.0, 0.63, 0], [3.0, 0.5, 0], [4.0, 0.32, 0], [4.8, 0.06, 0]];
  for (const x of NAC_X) {
    const hub = nacHub(x), z0 = hub.z - 0.22, cy = hub.y;
    const ring = (d, r, drop = 0) => { const o = []; for (let k = 0; k <= 18; k++) { const a = (k / 18) * Math.PI * 2; o.push([x + Math.cos(a) * r, cy - drop + Math.sin(a) * r, z0 - d]); } return o; };
    const rings = prof.map(([d, r]) => ring(d, r, d > 1.4 ? (d - 1.4) * -0.02 : 0));
    G.grid(rings, { uOf: (p, s) => prof[s][0] + 0.2, vOf: (p, s, k) => k * 0.262,
      col: (p, s) => { const t = prof[s][2]; return t === 1 ? L.bronze : t === 2 ? [0.02, 0.02, 0.022] : t === 3 ? mixc(body, [0.05, 0.05, 0.05], 0.6) : body; },
      surf: (p, s) => (prof[s][2] === 2 ? 3 : 0) });
    // engine face: dark, with cylinder heads catching a little light
    G.grid([ring(0.1, 0.5), ring(0.14, 0.3), ring(0.02, 0.2)], { col: (p, s, k) => (s === 1 ? [0.16, 0.15, 0.14] : k % 2 ? [0.09, 0.09, 0.09] : [0.03, 0.03, 0.03]), surf: () => 3 });
    // hub and spinner
    G.grid([ring(0.02, 0.2), ring(-0.2, 0.2), ring(-0.36, 0.17), ring(-0.5, 0.1), ring(-0.57, 0.005)], { col: () => L.spinner, uOf: (p, s) => s * 0.11 + 0.05, vOf: (p, s, k) => k * 0.05 });
    // exhaust stub under the cowl
    for (const [ea, er] of [[-1.2, 0.075], [-1.9, 0.06], [-0.45, 0.06]]) { const e = [], ca = Math.cos(ea) * Math.sign(x), sa = Math.sin(ea);
      for (const [d, rr] of [[1.12, 0.8], [1.4, 0.89], [1.8, 0.89]]) { const o = []; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI * 2; o.push([x + ca * rr + Math.cos(a) * er, cy + sa * rr + Math.sin(a) * er, z0 - d]); } e.push(o); }
      G.grid(e, { col: (p, s) => (s === 2 ? [0.03, 0.028, 0.025] : L.bronze), surf: () => 3 }); }
    await ctx.yield();
  }
  // ---- wing floats: little planing hulls with their own step
  const fl = (zz) => {
    const z = zz - FLOAT_DZ, t = (3.2 - z) / 5.8;                                           // 0 nose, 1 stern
    const bw = 0.5 * Math.max(0, Math.sin(Math.PI * Math.min(1, t * 1.02) ** 0.62)) ** 0.7;
    const fore = z >= 0.2;
    const yk = fore ? -0.12 + 0.75 * ((z - 0.2) / 3) ** 2.4 : -0.02 + 0.55 * ((0.2 - z) / 2.8) ** 1.3;
    const top = 0.98 - 0.25 * (2 * t - 1) ** 2 * (t > 0.5 ? 1.6 : 1);
    return { bw, yk, yc: Math.min(yk + 0.2, top - 0.1), top };
  };
  const fz = []; for (let i = 0; i <= 16; i++) fz.push(3.2 - 0.01 - (i / 16) * 5.78); fz.splice(9, 0, 0.2001, 0.1999); fz.sort((a, b) => b - a); for (let i = 0; i < fz.length; i++) fz[i] += FLOAT_DZ;
  for (const sx of [1, -1]) {
    const X = sx * FLOAT_X;
    const rings = fz.map((z) => { const f = fl(z), r = [];
      r.push([X, f.yk, z], [X + f.bw * 0.55, lerp(f.yk, f.yc, 0.6), z], [X + f.bw, f.yc, z], [X + f.bw, f.yc, z], [X + f.bw * 1.02, lerp(f.yc, f.top, 0.4), z]);
      for (let j = 1; j <= 5; j++) { const a = (j / 5) * Math.PI * 0.5; r.push([X + f.bw * Math.cos(a) ** 0.7, lerp(f.yc, f.top, 0.4) + (f.top - lerp(f.yc, f.top, 0.4)) * Math.sin(a) ** 0.8, z]); }
      return r; });
    for (const m of [1, -1]) G.grid(rings.map((r) => r.map((p) => [X + (p[0] - X) * m, p[1], p[2]])), { uOf: (p) => 4.4 - p[2], flip: m < 0,
      col: (p) => mixc(dark, body, sstep(0.28, 0.36, p[1])) });
    // N struts, inboard diagonal brace
    const wy = (x, z) => { const le = wingLE(x); const f = sat((le.z - z) / wingChord(Math.abs(x))); return wingUnderY(x, f) + 0.04; };
    const foot = (z) => V3(X, fl(z).top - 0.05, z);
    for (const [fa, fb] of [[foot(1.3), V3(X, wy(X, 0.3), 0.3)], [foot(-0.9), V3(X, wy(X, -1.9), -1.9)]]) {
      strut(G, fa, fb, 0.32, 0.105, body);
      strut(G, fa.clone().lerp(fb, -0.04), fa.clone().lerp(fb, 0.11), 0.52, 0.19, mixc(body, L.bottom, 0.4), 0.55);      // boot fairing on the float
      strut(G, fa.clone().lerp(fb, 0.9), fa.clone().lerp(fb, 1.02), 0.5, 0.18, mixc(body, L.bottom, 0.5), 0.6);   // cuff under the wing
    }
    strut(G, foot(-0.75), V3(X - sx * 2.6, wy(X - sx * 2.6, -2.3), -2.3), 0.28, 0.095, body);
  }
  await ctx.yield();
  // ---- tail: tailplane with fabric elevators, single fin or twin end-plate fins with fabric rudders
  const cdT = V3(0, 0, -1), up = V3(0, 1, 0), sideX = V3(1, 0, 0);
  const tz = -11.2, ty = variant.twin ? 4.5 : 4.62, tSpan = variant.twin ? 5.4 : 5.9;
  const tx = [-1, -0.985, -0.95, -0.86, -0.6, -0.3, -0.06, 0, 0.06, 0.3, 0.6, 0.86, 0.95, 0.985, 1].map((v) => v * tSpan);
  const tCh = (ax) => lerp(3.1, 1.75, ax / tSpan) * (variant.twin ? 1 : Math.sqrt(Math.max(0.03, 1 - Math.max(0, (ax - tSpan * 0.86) / (tSpan * 0.142)) ** 2)));
  const tLE = (x) => { const ax = Math.abs(x); return V3(x, ty + ax * 0.02, tz - ax * 0.16 - (lerp(3.1, 1.75, ax / tSpan) - tCh(ax)) * 0.4); };
  G.grid(tx.map((x) => airfoil(tLE(x), cdT, up, tCh(Math.abs(x)), 0.11, 0, 19)), { uOf: (p, s) => tx[s] + 20, flip: true,
    col: (p, s) => (p[3] > 0.58 && Math.abs(tx[s]) > 0.2 ? fab : body), surf: (p, s) => (p[3] > 0.58 && Math.abs(tx[s]) > 0.2 ? 1 : 0), move: (p, s) => (p[3] > 0.58 && Math.abs(tx[s]) > 0.2 ? 3 : 0) });
  const hinges = [];
  hinges[3] = { p: tLE(0).addScaledVector(cdT, 0.58 * 3.1), d: sideX.clone() };
  const fin = (x0, y0, y1, zLE, c0, c1, rake, id) => {
    const N = 9, rings = [];
    for (let i = 0; i <= N; i++) { const f = i / N, e = f < 0.85 ? 1 : Math.sqrt(Math.max(0.04, 1 - ((f - 0.85) / 0.152) ** 2)), c = lerp(c0, c1, f) * e;
      rings.push(airfoil(V3(x0, lerp(y0, y1, f), zLE - rake * f - (lerp(c0, c1, f) - c) * 0.35), cdT, sideX, c, 0.1, 0, 19)); }
    const mv = (p, s) => id > 0 && p[3] > 0.55 && s > 0;
    G.grid(rings, { uOf: (p, s) => (s / N) * (y1 - y0) + 3, col: (p, s) => { if (!mv(p, s)) return body; return L.rudderStripe && Math.floor((s / N) * 4.99) % 2 === 0 ? L.trim : fab; },
      surf: (p, s) => (mv(p, s) ? 1 : 0), move: (p, s) => (mv(p, s) ? id : 0) });
    return { p: V3(x0, (y0 + y1) / 2, zLE - rake * 0.5 - 0.55 * (c0 + c1) / 2), d: V3(0, y1 - y0, -rake - 0.55 * (c1 - c0)).normalize() };
  };
  if (variant.twin) { hinges[4] = fin(tSpan, ty - 1.25, ty + 2.35, tz - tSpan * 0.16 + 0.35, 2.5, 1.5, 0.5, 4); fin(-tSpan, ty - 1.25, ty + 2.35, tz - tSpan * 0.16 + 0.35, 2.5, 1.5, 0.5, 4);
    // faired stub where a single fin would stand
    fin(0, HULL.top(-12.5) - 0.3, HULL.top(-12.5) + 0.75, -10.4, 3.4, 2.2, 0.9, 0);
  } else { hinges[4] = fin(0, HULL.top(-11.5) - 0.35, 8.55, -10.1, 4.3, 1.9, 1.5, 4); }
  strut(G, V3(0, 5.1, 4.4), V3(0, 6.4, 4.3), 0.2, 0.07, body, 1.0);   // aerial mast
  return { hinges };
}

// ---- real propeller blades (shown as the engines run down) and the bracing wires
function buildBlades() {
  const p = [], hub = [], ph = [], idx = []; let n = 0;
  NAC_X.forEach((x, e) => {
    const h = nacHub(x);
    for (let b = 0; b < 3; b++) {
      const S = 7, K = 6, base = n;
      for (let s = 0; s <= S; s++) {
        const r = 0.16 + (s / S) * 1.54, f = s / S;
        const ch = 0.06 + 0.16 * Math.sin(Math.PI * Math.min(1, f * 1.15) ** 0.7) * (f > 0.9 ? 1 - (f - 0.9) * 5 : 1), tw = lerp(1.05, 0.3, f), th = lerp(0.07, 0.012, f);
        for (let k = 0; k < K; k++) { const a = (k / K) * Math.PI * 2, cx = Math.cos(a) * ch, cz = Math.sin(a) * th;
          p.push(cx * Math.cos(tw) - cz * Math.sin(tw), r, cx * Math.sin(tw) + cz * Math.cos(tw)); hub.push(h.x, h.y, h.z); ph.push(b * Math.PI * 2 / 3 + e * 0.7, f, e); n++; }
      }
      for (let s = 0; s < S; s++) for (let k = 0; k < K; k++) { const a = base + s * K + k, b2 = base + s * K + (k + 1) % K; idx.push(a, b2, a + K, b2, b2 + K, a + K); }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('aHub', new THREE.Float32BufferAttribute(hub, 3));
  g.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function buildWires(variant) {
  // each wire: a strip of quads; the vertex shader widens it to stay over a pixel and makes it thrum
  const a = [], b = [], t = [], idx = []; let n = 0;
  const add = (A, B, seed) => { const S = 10;
    for (let s = 0; s <= S; s++) for (const side of [-1, 1]) { a.push(A.x, A.y, A.z); b.push(B.x, B.y, B.z); t.push(s / S, side, seed); }
    for (let s = 0; s < S; s++) { const i = n + s * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    n += (S + 1) * 2; };
  let seed = 1;
  for (const sx of [1, -1]) {
    const X = sx * FLOAT_X, wy = (x, z) => wingUnderY(x, sat((wingLE(x).z - z) / wingChord(Math.abs(x))));
    add(V3(X, 0.95, 1.2), V3(X, wy(X, -1.8), -1.8), seed++); add(V3(X, 0.9, -0.8), V3(X, wy(X, 0.2), 0.2), seed++);          // X between the struts
    add(V3(X - sx * 0.25, 0.9, 3.2), V3(X + sx * 0.9, wy(X + sx * 0.9, 1.5), 1.5), seed++);                              // from the float nose, outboard
    add(V3(X + sx * 0.25, 0.9, 3.2), V3(X - sx * 0.45, wy(X - sx * 0.45, 1.5), 1.5), seed++);                            // from the float nose, inboard
    add(V3(X, 0.85, -1.2), V3(X + sx * 1.0, wy(X + sx, -2.6), -2.6), seed++);
  }
  // aerial from the fin to a mast behind the flight deck
  add(V3(0, 6.35, 4.4), variant.twin ? V3(0, 4.9, -11.4) : V3(0, 7.3, -11.75), seed++);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(b, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 3));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- small materials
const DISC_VERT = /* glsl */`
attribute vec3 aHub; varying vec2 vUv; varying float vSeed;
#include <fog_pars_vertex>
void main(){ vUv = uv; vSeed = aHub.x;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DISC_FRAG = /* glsl */`
uniform float uSpin, uGhost, uDim; uniform vec3 uSunCol, uTipCol;
varying vec2 vUv; varying float vSeed;
#include <fog_pars_fragment>
void main(){
  float r = length(vUv);
  if (r > 1. || uSpin < 0.004) discard;
  float ang = atan(vUv.y, abs(vUv.x) + abs(vUv.y) < 1e-5 ? 1e-5 : vUv.x);
  float plan = smoothstep(0.1, 0.22, r) * (1. - smoothstep(0.93, 1., r));
  float dens = clamp(0.05 / (r + 0.1), 0.06, 0.4) * plan;
  float lobe = 0.5 + 0.5 * cos(3. * (ang - uGhost - vSeed * 0.9));
  float ghost = lobe * lobe * plan;
  float lobe2 = 0.5 + 0.5 * cos(3. * (ang + uGhost * 0.37 + vSeed));
  float sheen = (pow(abs(cos(ang - 0.9)), 14.) + 0.6 * pow(abs(cos(ang + 0.5 + 0.2 * sin(uGhost * 0.7))), 30.)) * plan * (0.4 + 0.6 * r);
  float tip = smoothstep(0.9, 0.935, r) * (1. - smoothstep(0.955, 0.985, r));
  vec3 col = vec3(0.05, 0.055, 0.06) + uSunCol * (sheen * 0.42 + 0.03 * lobe2) + uTipCol * tip * 0.35 * (0.3 + 0.7 * ghost);
  float a = 0.12 * plan + dens * 0.5 + ghost * 0.24 + lobe2 * lobe2 * 0.06 * plan + sheen * 0.2;
  a = max(a, tip * (0.1 + 0.16 * ghost));
  gl_FragColor = vec4(col, a * uSpin * uDim);
  #include <fog_fragment>
}`;
const BLADE_VERT = /* glsl */`
attribute vec3 aHub; attribute vec3 aPh; uniform float uAng; varying vec3 vN; varying vec3 vW; varying float vF;
#include <fog_pars_vertex>
void main(){
  float a = uAng * (1. + 0.07 * aPh.z) + aPh.x; float c = cos(a), s = sin(a);
  vec3 p = vec3(position.x * c - position.y * s, position.x * s + position.y * c, position.z) + aHub;
  vec3 n = vec3(normal.x * c - normal.y * s, normal.x * s + normal.y * c, normal.z);
  vF = aPh.y; vN = mat3(modelMatrix) * n; vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BLADE_FRAG = /* glsl */`
uniform float uAlpha; uniform vec3 uSunDir, uSunCol, uSkyCol, uShadeCol, uTipCol;
varying vec3 vN; varying vec3 vW; varying float vF;
#include <fog_pars_fragment>
void main(){
  if (uAlpha < 0.01) discard;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 L = normalize(uSunDir), V = normalize(cameraPosition - vW);
  vec3 base = mix(vec3(0.05, 0.055, 0.06), uTipCol * 0.8, smoothstep(0.9, 0.92, vF));
  vec3 col = base * (uSunCol * smoothstep(-0.1, 0.6, dot(N, L)) + uSkyCol * 0.5 + uShadeCol * 0.5);
  col += uSunCol * pow(max(dot(reflect(-V, N), L), 0.), 40.) * 0.6;
  gl_FragColor = vec4(col, uAlpha);
  #include <fog_fragment>
}`;
const WIRE_VERT = /* glsl */`
attribute vec3 aB; attribute vec3 aT; uniform float uTime, uPx, uThrum; varying float vA; varying float vS;
#include <fog_pars_vertex>
void main(){
  vec4 m0 = modelViewMatrix * vec4(position, 1.), m1 = modelViewMatrix * vec4(aB, 1.);
  vec4 mvPosition = mix(m0, m1, aT.x);
  vec3 d = m1.xyz - m0.xyz; vec3 n = cross(d, mvPosition.xyz); float nl = length(n); n = nl > 1e-6 ? n / nl : vec3(1., 0., 0.);
  float len = length(d);
  mvPosition.xyz += n * sin(3.14159 * aT.x) * sin(uTime * (31. + 60. / max(len, 1.)) + aT.z * 5.) * 0.0035 * uThrum * min(len, 6.);
  float w = 0.013, px = uPx * max(0.05, -mvPosition.z), ww = max(w, px);
  mvPosition.xyz += n * aT.y * ww * 0.5;
  vA = clamp(w / ww, 0.22, 1.); vS = aT.y;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WIRE_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol; varying float vA; varying float vS;
#include <fog_pars_fragment>
void main(){
  float e = 1. - vS * vS;
  vec3 col = vec3(0.05, 0.055, 0.06) + (uSkyCol * 0.35 + uSunCol * 0.3) * smoothstep(0.3, 1., e) * 0.6;
  gl_FragColor = vec4(col, vA * smoothstep(0., 0.35, e + 0.2));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- spray: sheets thrown from the chines and floats
const SHEET_VERT = /* glsl */`
attribute vec2 aAB; attribute vec3 aV; attribute vec4 aK;
uniform float uTime, uAmpH, uAmpF, uSkip;
varying vec2 vAB; varying vec4 vK; varying vec3 vW; varying float vTau; varying float vAmp; varying float vH;
void main(){
  float amp = aK.x < 0.5 ? uAmpH : uAmpF;
  float tau = aAB.y * aK.w, a = aAB.x;
  // the throw is uneven along the chine: tongues from 3 to 9 m that wander aft, so the crest is lobed, never a level line
  float lobe = 0.76 + 0.3 * sin(a * 13. + uTime * 1.7 + aK.z * 2.) * sin(a * 5.3 - uTime * 0.9 + aK.z) + 0.13 * sin(a * 31. - uTime * 4.3 + aK.z * 2.);
  float h = clamp(amp, 0., 1.4) * lobe;
  float lay = 1. + 0.14 * aK.y;
  vec3 p = position;
  p.x += aV.x * (1. - exp(-tau / 0.45)) * (0.5 + 0.5 * h) * lay;
  float yy = (aV.y * tau - 4.9 * tau * tau) * h * (1. - 0.1 * aK.y);
  p.y += max(-0.05, yy);
  p.z -= aV.z * tau * (1. + 0.3 * aK.y);
  // the sheet billows in depth as it rises: a veil, not a pane
  p.x += (sin(tau * 5. + uTime * 2.3 + a * 7.) * 0.3 + sin(a * 19. + uTime * 1.3 + aK.z * 4.) * 0.34) * tau;
  vAB = aAB; vK = aK; vTau = tau; vAmp = amp; vH = yy / (aK.x < 0.5 ? 8. : 2.4);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SHEET_FRAG = /* glsl */`
uniform float uTime, uGain; uniform vec3 uSunDir, uSprayCol, uShadeCol;
varying vec2 vAB; varying vec4 vK; varying vec3 vW; varying float vTau; varying float vAmp; varying float vH;
${GLSL_NOISE}
void main(){
  if (vAmp < 0.01) discard;
  float a = vAB.x, b = vAB.y, hull = 1. - step(0.5, vK.x);
  float len = mix(3., 9., hull);
  vec2 q = vec2(a * len + vK.z * 3.7 + vK.y * 1.9, vTau * 5. - uTime * (4.2 + vK.y));
  vec2 qd = q * vec2(9., 1.5), qd2 = q * vec2(23., 3.7) + 17.;
  float bfade = 1. - smoothstep(0.3, 0.9, max(fwidth(qd.x), fwidth(qd.y)));
  float cfade = 1. - smoothstep(0.3, 0.9, max(fwidth(qd2.x), fwidth(qd2.y)));
  float warp = fbm3(q * vec2(0.5, 0.22) + 5.);
  q.x += (warp - 0.5) * 1.5;                                               // the drawn-out fingers wander: no ruled streaks
  float fing = vnoise(vec2(q.x * 2.6, q.y * 0.5)) * 0.6 + vnoise(vec2(q.x * 6.5 + 3., q.y * 0.9)) * 0.4;
  float tear = fbm3(q * vec2(0.55, 0.3) + 2.);
  float fil = smoothstep(0.5, 0.92, vnoise(vec2(q.x * 11., q.y * 0.9)));
  float big = fbm3(vec2(a * len * 0.45 + vK.z * 5., b * 2.6 - uTime * 0.35));           // slow holes torn through the whole sheet
  float hgt = clamp(vH, 0., 1.);
  // both ends dissolve behind a ragged, moving noise front over a third of the length: there is no end line
  float endN = fbm3(vec2(b * 3.2 - uTime * 0.5, a * 13. + vK.z * 3.));
  float ends = smoothstep(0.02, 0.4, a - 0.32 * endN + 0.06) * (1. - smoothstep(0.68, 1., a + 0.28 * endN - 0.04));
  float thick = 1. - smoothstep(0.08, 0.6, hgt);                           // dense at the chine, mist toward the crest
  float th = mix(0.4, 0.74, hgt) + 0.08 * vK.y + 0.34 * (1. - ends) + 0.15 * (1. - hull);
  float veil = smoothstep(th, th + 0.13, fing * 0.4 + tear * 0.5 + big * 0.42);
  // open holes a metre or two across torn right through the sheet at every height (hull, chine and portholes show through them)
  float hole = fbm3(vec2(a * len * 1.1 + vK.z * 9. + vK.y * 2.3, b * 4.2 - uTime * 0.55) + 13.);
  veil *= smoothstep(0.36, 0.5, hole + 0.1 * (fing - 0.5));
  veil *= mix(1., fil * 0.85, smoothstep(0.3, 0.62, hgt));                 // above mid-height only filaments are left
  float tongue = smoothstep(0.34, 0.6, vnoise(vec2(a * len * 1.9 + vK.z * 7., uTime * 0.45 + vK.y)));
  veil *= mix(1., tongue, smoothstep(0.5, 0.82, hgt));                     // the crest breaks into separate tongues
  veil *= 1. - 0.75 * smoothstep(0.52, 0.85, b);                           // what falls back is beads and mist
  float edge = ends * (1. - smoothstep(0.5, 1., b + (fing - 0.5) * 0.45)) * smoothstep(0., 0.04, b);
  veil *= edge;
  // droplets drawn out along the throw, in two sizes
  vec2 bq = qd; vec2 bi = floor(bq), bf = fract(bq); vec2 bo = h22(bi + 11.);
  float br = 0.04 + 0.13 * bo.x * bo.x;
  float bead = smoothstep(br, br * 0.3, length(bf - 0.3 - 0.4 * bo)) * step(0.42 - 0.2 * b, bo.y) * (0.35 + 0.65 * h21(bi + 3.)) * bfade;
  vec2 ci = floor(qd2), cf = fract(qd2); vec2 co = h22(ci);
  bead += (1. - smoothstep(0.03, 0.12, length(cf - 0.3 - 0.4 * co))) * step(0.4, co.y) * 0.7 * cfade;
  float beadEdge = smoothstep(0., 0.3, a - 0.2 * endN + 0.12) * (1. - smoothstep(0.8, 1., a + 0.15 * endN)) * (1. - smoothstep(0.7, 1., b)) * smoothstep(0., 0.04, b);
  bead *= beadEdge * smoothstep(0.03, 0.25, b) * (0.35 + 0.65 * tear);      // beads fly on past the veil's torn ends
  vec3 V = normalize(vW - cameraPosition);
  float fwd = max(dot(V, normalize(uSunDir)), 0.); fwd = fwd * fwd;
  float amp = clamp(vAmp, 0., 1.);
  float haze = edge * thick * 0.025 * hull;                                // the faint mist the sheet stands in, at its foot only
  float va = clamp(clamp(veil, 0., 1.) * (0.14 + 0.36 * thick) + haze, 0., 0.44) * amp * mix(0.8, 1., hull);
  vec3 deepGold = mix(uSprayCol * uSprayCol, uSprayCol, 0.3);
  // (capped below clipping: against the light the veil stays the spray's own gold and a bead is a gold spark, never white)
  vec3 vc = min(mix(deepGold * 0.6 + uShadeCol * 0.1, deepGold * 1.5 + uSprayCol * 0.9, fwd) * (0.75 + 0.5 * fil), deepGold * 0.5 + uSprayCol * 0.95);
  vec3 bc = uSprayCol * min(1.1 + 4.6 * fwd, 1.9);
  float ba = bead * amp * (0.4 + 0.6 * fwd);
  vec3 rgb = (vc * va + bc * ba) * uGain;
  gl_FragColor = vec4(rgb, clamp(va + ba * 0.5, 0., 1.));
}`;

function buildSheets() {
  const p = [], ab = [], v = [], k = [], idx = []; let n = 0;
  const sheet = (S, B, rootFn, velFn, kind, layer, seed, T) => {
    for (let s = 0; s <= S; s++) { const a = s / S, r = rootFn(a), vv = velFn(a);
      for (let j = 0; j <= B; j++) { p.push(r[0], r[1], r[2]); ab.push(a, j / B); v.push(vv[0], vv[1], vv[2]); k.push(kind, layer, seed, T); } }
    for (let s = 0; s < S; s++) for (let j = 0; j < B; j++) { const i = n + s * (B + 1) + j; idx.push(i, i + B + 1, i + 1, i + 1, i + B + 1, i + B + 2); }
    n += (S + 1) * (B + 1);
  };
  let seed = 1;
  // hull sheets: the root bows outward from the chine amidships, so the plume is a curved wall, not a plane
  for (const sx of [1, -1]) for (const layer of [0, 1]) {
    if (sx > 0) sheet(44, 14, (a) => { const z = lerp(9.6, 0.4, a); return [sx * (HULL.beam(z) * 0.98 + 0.4 * Math.sin(Math.PI * a)), 0.04, z]; },
      (a) => [sx * 5.8 * (0.45 + 0.55 * Math.sin(Math.PI * a ** 0.8)), 9.3 * (0.5 + 0.5 * Math.sin(Math.PI * a ** 0.7)), 3 + 4 * a], 0, layer, seed++, 2.0);
    else sheet(56, 22, (a) => { const z = lerp(10.6, 0.2, a); return [sx * (HULL.beam(z) * 0.98 + 0.5 * Math.sin(Math.PI * a)), 0.04, z]; },
      (a) => [sx * (3.3 + 0.8 * layer) * (0.5 + 0.5 * Math.sin(Math.PI * a ** 0.8)), 12.6 * (0.25 + 0.75 * Math.sin(Math.PI * a ** 0.7)), 0.9 + 1.7 * a], 0, layer, seed++, 2.3);
  }
  // float feathers: two crossed cards off each float's bow chines, fanning apart and aft; the shader erodes them to streaks
  // and beads (they pass within two metres of the lens)
  for (const fx of [FLOAT_X, -FLOAT_X]) for (const sx of [1, -1]) {
    sheet(18, 12, (a) => [fx + sx * 0.36, 0.03, lerp(2.9, 0.7, a) + FLOAT_DZ],
      (a) => [sx * (0.5 + 1.5 * a), 6.9 * (0.35 + 0.65 * Math.sin(Math.PI * a ** 0.7)), 0.8 + 2.6 * a], 1, sx > 0 ? 0 : 1, seed++, 1.35);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('aAB', new THREE.Float32BufferAttribute(ab, 2));
  g.setAttribute('aV', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 4));
  g.setIndex(idx);
  return g;
}

// droplets and mist: points sized from the drawing buffer. aS = (phase, life, size in metres, kind): kind 0 hull beads,
// 1 float beads, 2 mist puffs along the hull sheets' feet and round their ends, 3 mist at the float feather
const DROP_VERT = /* glsl */`
attribute vec3 aVel; attribute vec4 aS;
uniform float uTime, uAmpH, uAmpF, uPxScale, uMaxPx;
varying float vA; varying vec3 vW; varying float vMist;
void main(){
  float mist = step(1.5, aS.w);
  float amp = (aS.w < 0.5 || (aS.w > 1.5 && aS.w < 2.5)) ? uAmpH : uAmpF;
  float ph = fract(aS.x + uTime / aS.y); float tau = ph * aS.y;
  vec3 p = position + aVel * tau * vec3(1., clamp(amp, 0.3, 1.2), 1.); p.y -= mix(4.9, 1.2, mist) * tau * tau;
  p.y = mix(p.y, max(p.y, 0.15), mist);
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  vec4 mv = viewMatrix * w;
  float size = aS.z * mix(1., 0.55 + 0.9 * ph, mist) * uPxScale / max(0.6, -mv.z);
  vA = smoothstep(0., 0.08, ph) * (1. - smoothstep(mix(0.7, 0.35, mist), 1., ph)) * clamp(amp, 0., 1.) * clamp(size / 1.6, 0.25, 1.) * step(-0.05, p.y);
  vA *= mix(1., smoothstep(0.7, 2.2, -mv.z), mist);
  vMist = mist;
  gl_PointSize = clamp(size, 1.6, mix(42., uMaxPx, mist));
  gl_Position = projectionMatrix * mv;
  if (amp < 0.01) gl_Position = vec4(2., 2., 2., 1.);
}`;
const DROP_FRAG = /* glsl */`
uniform vec3 uSunDir, uSprayCol; varying float vA; varying vec3 vW; varying float vMist;
void main(){
  vec2 c = gl_PointCoord - 0.5; float r = length(c) * 2.;
  vec3 V = normalize(vW - cameraPosition);
  float fwd = max(dot(V, normalize(uSunDir)), 0.); float f2 = fwd * fwd;
  if (vMist > 0.5) {
    float soft = exp(-r * r * 3.2) * (1. - smoothstep(0.7, 1., r));
    float a = soft * vA * 0.1;
    gl_FragColor = vec4(mix(uSprayCol * uSprayCol, uSprayCol, 0.4) * min(0.45 + 1.5 * f2, 1.45) * a, a * 0.75);
  } else {
    float soft = (1. - smoothstep(0.25, 1., r));
    float a = soft * vA;
    gl_FragColor = vec4(uSprayCol * min(0.6 + 2.6 * f2 * fwd, 1.9) * a * (0.5 + 0.5 * (1. - smoothstep(0., 0.6, r))), a * 0.6);
  }
}`;

function buildDrops(rng, count) {
  const p = [], v = [], s = [];
  for (let i = 0; i < count; i++) {
    const kind = i % 4 === 0 ? 1 : 0;       // a quarter come off the starboard float, close to the seat
    if (kind === 0) { const sx = i % 8 < 5 ? -1 : 1, z = rng.range(0.5, 9.5);
      p.push(sx * HULL.beam(z), 0.1, z); v.push(sx * rng.range(2.5, 8), rng.range(4, 9.5), -rng.range(2, 9)); s.push(rng(), rng.range(0.9, 1.7), rng.range(0.025, 0.075), 0);
    } else { const near = rng.chance(0.5);
      p.push(-FLOAT_X + rng.range(-0.4, 0.5), 0.15, rng.range(0.5, 3.0) + FLOAT_DZ); v.push(near ? rng.range(0.2, 1.6) : rng.range(-2, 2), rng.range(4.5, 8.5), -rng.range(2.5, 8)); s.push(rng(), rng.range(0.7, 1.3), rng.range(0.025, 0.07), 1); }
  }
  // the mist skirt: soft puffs boiling up along the foot of both hull sheets, thicker round their bow and step ends
  // (where a sheet would otherwise end in a line), and a small cloud of them at each float feather
  const nMist = Math.round(count * 0.42);
  for (let i = 0; i < nMist; i++) {
    if (i % 6 === 5) { const fx = i % 12 === 5 ? -FLOAT_X : FLOAT_X;
      p.push(fx + rng.range(-0.5, 0.5), 0.2, rng.range(0.4, 3.2) + FLOAT_DZ); v.push(rng.range(-0.9, 0.9), rng.range(1.2, 3.4), -rng.range(1.5, 4.5)); s.push(rng(), rng.range(0.7, 1.2), rng.range(0.45, 0.9), 3);
    } else { const sx = i % 3 === 0 ? 1 : -1, e = rng(), z = e < 0.3 ? rng.range(8.6, 11.4) : (e < 0.5 ? rng.range(-0.6, 1.6) : rng.range(0.5, 10));
      p.push(sx * (HULL.beam(Math.min(z, 12.5)) + rng.range(0, 0.9)), 0.2, z); v.push(sx * rng.range(0.8, 3.2), rng.range(1.5, 5.5), -rng.range(0.6, 3)); s.push(rng(), rng.range(0.9, 1.7), rng.range(0.8, 1.9), 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('aVel', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(s, 4));
  return g;
}

// foam footprint: contact shadow, bow wave, the wake V and its lace, float trails; lies on the water in the aircraft frame
const FOAM_VERT = /* glsl */`
varying vec3 vL;
#include <fog_pars_vertex>
void main(){ vL = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FOAM_FRAG = /* glsl */`
uniform float uTime, uWake, uGround, uFlow, uBow, uFleck; uniform vec3 uFoamCol, uDeepCol;
varying vec3 vL;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float x = vL.x, z = vL.z, ax = abs(x);
  vec2 fl = vec2(x, z + uFlow);
  float n = fbm3(fl * 0.55) * 0.65 + vnoise(fl * 2.3 + 3.) * 0.35;
  float n2 = fbm3(fl * vec2(1.6, 0.5) + 9.);
  float aft = max(0., 8.5 - z);
  // V arms leaving the chine, thickening and breaking into lace as they go aft
  float arm = ax - (1.5 + 0.30 * aft + 0.5 * sin(aft * 0.35 + uTime) * smoothstep(5., 30., aft));
  float armW = 0.5 + 0.11 * aft;
  float armM = (1. - smoothstep(0., armW, abs(arm))) * smoothstep(0., 1.5, aft) * (1. - smoothstep(40., 78., aft));
  // churned water inside the V behind the step
  float inner = (1. - smoothstep(-armW, 0.3, arm)) * smoothstep(6., 10., aft) * (1. - smoothstep(18., 70., aft));
  // bow wave hugging the forebody
  float hq = max(0., (z - 6.) / 7.);
  float hw = 1.75 * pow(max(1e-4, 1. - hq * hq), 0.55);
  float bow = (1. - smoothstep(0.1, 1.0 + 1.3 * uBow, ax - hw)) * step(-1., z) * (1. - smoothstep(7.5, 10.5, z)) * step(hw - 0.25, ax);
  // float trails
  float fa = max(0., 3.5 - z);
  float ft = (1. - smoothstep(0.25, 0.7 + 0.07 * fa, abs(ax - 11.9))) * smoothstep(3., 8.5, fa) * (1. - smoothstep(14., 46., fa));
  float fw = clamp(fwidth(z) * 1.2, 0., 1.);
  n = mix(n, 0.52, fw); n2 = mix(n2, 0.5, fw);
  float lace = smoothstep(0.42, 0.68, n);
  float foam = armM * (0.45 + 0.55 * lace) + inner * smoothstep(0.38, 0.75, n2 * 0.6 + n * 0.5) * 0.85 + bow * (0.3 + 0.7 * lace) + ft * (0.4 + 0.6 * lace);
  foam = clamp(foam, 0., 1.) * uWake;
  foam *= mix(1., smoothstep(0.6, 0.72, vnoise(fl * vec2(3.1, 2.2) + 1.) * 0.7 + vnoise(fl * vec2(9., 6.) + 4.) * 0.3) * 1.5, uFleck);     // glowing plankton (night): sparse sparkling flecks, no smooth sheet
  float sA = x / 2.6, sB = (z + 1.) / 11., sC = (ax - 11.9) / 0.9, sD = (z - 1.2) / 3.2, sE = x / 17., sF = (z - 0.6) / 3.4;
  sE *= sE;
  float shadow = exp(-sA * sA - sB * sB) * 0.62 + exp(-sC * sC - sD * sD) * 0.5 + exp(-sE * sE - sF * sF) * 0.3;
  shadow *= uGround;
  float edge = (1. - smoothstep(15., 22., ax)) * smoothstep(-78., -60., z);
  vec3 col = mix(uDeepCol * 0.35, uFoamCol * (0.75 + 0.35 * n), foam);
  float a = max(shadow * (1. - foam), foam) * edge;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the hero
const SEAT = V3(-10.9, 3.0, -1.1);
const LIVERIES = ['silver', 'white', 'cream'];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = (ctx.quality && ctx.quality.detail) || 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  // ---- per-seed variety (all draws up front, before any yield)
  const liveryName = opts.livery || rng.pick(LIVERIES);
  const variant = { twin: opts.twinFin !== undefined ? !!opts.twinFin : rng.chance(0.4) };
  const trimPick = rng.int(0, 2), tipPick = rng.int(0, 1), spinPick = rng.chance(0.5), ghost0 = rng.range(0, 6.28);
  const dropRng = rng.fork('drops');
  const slate = pal[5], jade = pal[1];
  const trim = [jade, mixc(slate, [0.03, 0.09, 0.2], 0.5), mixc(slate, jade, 0.4)][trimPick];
  const L = { glare: mixc(slate, [0, 0, 0], 0.45), bronze: lin('#4a382a'), bottom: mixc(slate, [0, 0, 0], 0.35), trim };
  let metal = 1, stripeOn = 0;
  if (liveryName === 'white') { L.body = lin('#d6d4ca'); L.fabric = lin('#cbc9bd'); metal = 0.08; stripeOn = 1; L.rudderStripe = true; }
  else if (liveryName === 'cream') { L.body = lin('#d3c398'); L.fabric = lin('#c9bb92'); metal = 0.05; stripeOn = 1; L.rudderStripe = false; }
  else { L.body = lin('#b3b6b3'); L.fabric = lin('#bdbbb0'); metal = 1; stripeOn = trimPick === 0 ? 0 : 1; L.rudderStripe = trimPick === 2; }
  L.spinner = spinPick ? L.body : trim;
  const tipCol = new THREE.Color().setRGB(...(tipPick ? pal[4] : lin('#e8c24a')));

  const object = new THREE.Group(); object.name = 'flying-boat';
  const scale = opts.scale || 1; object.scale.setScalar(scale);

  // ---- shared light uniforms (brief defaults: low warm key from the left, jade-blue shade)
  const U = opts.uniforms || makeBayUniforms(pal);
  if (opts.sprayColor) U.uSprayCol.value.set(opts.sprayColor);
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const share = (names, extra) => { const o = { ...fogU(), ...extra }; for (const n of names) o[n] = U[n]; return o; };

  // ---- airframe skin
  const A = await buildAirframe(rng, L, ctx);
  await ctx.yield();
  const A2 = await buildAirframe2(A.G, L, rng, variant, ctx);
  await ctx.yield();
  const hinges = [null, A.hinges[1], A.hinges[2], A2.hinges[3], A2.hinges[4], A2.hinges[4]];
  const skinGeo = await A.G.build(ctx);
  await ctx.yield();
  const skinMat = new THREE.ShaderMaterial({
    vertexShader: SKIN_VERT, fragmentShader: SKIN_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide,
    uniforms: share(['uSunDir', 'uSunCol', 'uSkyCol', 'uHorizonCol', 'uShadeCol', 'uWaterCol', 'uTime'], {
      uHP: { value: hinges.map((h) => (h ? h.p.clone() : V3())) }, uHD: { value: hinges.map((h) => (h ? h.d.clone() : V3(1, 0, 0))) }, uHA: { value: [0, 0, 0, 0, 0, 0] },
      uWet: { value: 1 }, uMetal: { value: metal }, uCabin: { value: opts.cabin || 0 }, uAmbK: { value: 1 }, uLamp: { value: opts.lamp !== undefined ? opts.lamp : 2.4 },
      uLampCol: { value: new THREE.Color('#ffe2b0') }, uRunway: { value: 0 }, uPh: { value: new THREE.Vector2(-7.6, 8.4) },
      uStripe: { value: new THREE.Color().setRGB(...trim) }, uStripeOn: { value: stripeOn },
    }),
  });
  const skin = new THREE.Mesh(skinGeo, skinMat); skin.frustumCulled = false; object.add(skin);

  // ---- propellers: shimmering discs, real blades for the run-down
  const discGeo = new THREE.BufferGeometry();
  { const p = [], uv = [], hub = [], idx = [];
    NAC_X.forEach((x, e) => { const h = nacHub(x), r = 1.72;
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { p.push(h.x + u * r, h.y + v * r, h.z); uv.push(u, v); hub.push(e * 1.7 + 0.3, 0, 0); }
      idx.push(e * 4, e * 4 + 1, e * 4 + 2, e * 4, e * 4 + 2, e * 4 + 3); });
    discGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); discGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    discGeo.setAttribute('aHub', new THREE.Float32BufferAttribute(hub, 3)); discGeo.setIndex(idx); }
  const discMat = new THREE.ShaderMaterial({ vertexShader: DISC_VERT, fragmentShader: DISC_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: share(['uSunCol'], { uSpin: { value: 1 }, uGhost: { value: ghost0 }, uDim: { value: 1 }, uTipCol: { value: tipCol } }) });
  const disc = new THREE.Mesh(discGeo, discMat); disc.frustumCulled = false; disc.renderOrder = 3; object.add(disc);
  const bladeMat = new THREE.ShaderMaterial({ vertexShader: BLADE_VERT, fragmentShader: BLADE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: share(['uSunDir', 'uSunCol', 'uSkyCol', 'uShadeCol'], { uAng: { value: 0 }, uAlpha: { value: 0 }, uTipCol: { value: tipCol } }) });
  const blades = new THREE.Mesh(buildBlades(), bladeMat); blades.frustumCulled = false; blades.renderOrder = 2; object.add(blades);
  const wireMat = new THREE.ShaderMaterial({ vertexShader: WIRE_VERT, fragmentShader: WIRE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: share(['uSunCol', 'uSkyCol', 'uTime'], { uPx: { value: 0.002 }, uThrum: { value: 1 } }) });
  await ctx.yield();
  const wires = new THREE.Mesh(buildWires(variant), wireMat); wires.frustumCulled = false; wires.renderOrder = 2; object.add(wires);
  await ctx.yield();

  // ---- water contact, spray sheets, droplets
  const foamGeo = new THREE.PlaneGeometry(44, 92, 1, 1); foamGeo.rotateX(-Math.PI / 2); foamGeo.translate(0, 0.03, -32);
  const foamMat = new THREE.ShaderMaterial({ vertexShader: FOAM_VERT, fragmentShader: FOAM_FRAG, fog: true, transparent: true, depthWrite: false,
    uniforms: share(['uTime'], { uWake: { value: 0 }, uGround: { value: 0 }, uFlow: { value: 0 }, uBow: { value: 0 }, uFleck: { value: 0 },
      uFoamCol: { value: new THREE.Color('#e9dcc0') }, uDeepCol: { value: new THREE.Color().setRGB(...pal[1]) } }) });
  const foam = new THREE.Mesh(foamGeo, foamMat); foam.frustumCulled = false; foam.renderOrder = 1; object.add(foam);
  const sprayU = { uAmpH: { value: 0 }, uAmpF: { value: 0 } };
  const sheetMat = new THREE.ShaderMaterial({ vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    premultipliedAlpha: true, uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uSprayCol: U.uSprayCol, uShadeCol: U.uShadeCol, uSkip: { value: 0 }, uGain: { value: opts.sprayGain || 1 }, ...sprayU } });
  const sheets = new THREE.Mesh(buildSheets(), sheetMat); sheets.frustumCulled = false; sheets.renderOrder = 2.5; object.add(sheets);
  const dropMat = new THREE.ShaderMaterial({ vertexShader: DROP_VERT, fragmentShader: DROP_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
    uniforms: { uTime: U.uTime, uSunDir: U.uSunDir, uSprayCol: U.uSprayCol, uPxScale: { value: 400 }, uMaxPx: { value: 120 }, ...sprayU } });
  await ctx.yield();
  const drops = new THREE.Points(buildDrops(dropRng, Math.round(860 * detail)), dropMat); drops.frustumCulled = false; drops.renderOrder = 5; object.add(drops);
  await ctx.yield();

  // ---- state
  const S = { spray: 0, feather: 0, wake: 0, ground: 0, rpm: 1, wet: 1, bow: 0, flow: 26, aileron: 0, elevator: 0, rudder: 0 };
  let lightSet = false, propAng = 0, flowZ = 0, ghost = ghost0;
  const hero = {
    object, radius: 22 * scale, height: 9 * scale, center: V3(0, 3.6 * scale, 0), ground: true, groundY: 0,
    livery: liveryName, twinFin: variant.twin, state: S, uniforms: U,
    parts: { skin, disc },   // the world draws these again for the sister boat of the rare event
    anchors: {
      seat: { position: SEAT.clone().multiplyScalar(scale), look: V3(Math.sin(0.14), 0, Math.cos(0.14)) },
      propHub: nacHub(-7.4).multiplyScalar(scale), floatNose: V3(-FLOAT_X, 0.6, 3.2 + FLOAT_DZ).multiplyScalar(scale), bow: V3(0, 2.7, 13).multiplyScalar(scale),
      sprayCentre: V3(-6.5, 2.6, 4).multiplyScalar(scale), wakeOrigin: V3(0, 0, 1).multiplyScalar(scale), tail: V3(0, 4.2, -15).multiplyScalar(scale),
      lamp: A.lamps[1].clone().multiplyScalar(scale),
      departLine: [SEAT.clone(), V3(-11.3, 2.9, 4), V3(-12.2, 2.8, 14), V3(-12.5, 3.2, 30)].map((v) => v.multiplyScalar(scale)),
      flyThrough: [V3(-30, 6, -40), V3(-28, 5, -12), V3(-27, 4.5, 18), V3(-25, 5.5, 60)].map((v) => v.multiplyScalar(scale)),
      viewpoints: [V3(-34, 5, 30), V3(-9, 2.6, 34), V3(26, 9, -26)].map((v) => v.multiplyScalar(scale)),
    },
    // seconds since the keel first kissed the water (negative while still flying): the world maps its u to this
    setProgress(s) {
      const b1 = sstep(0, 0.28, s) * (1 - sstep(0.45, 0.85, s)), main = sstep(1.05, 1.7, s) * (1 - 0.9 * sstep(5.6, 10.5, s));
      S.spray = Math.max(b1 * 0.85, main * 1.08);
      S.feather = sstep(1.3, 2.2, s) * (1 - 0.92 * sstep(5.8, 10, s));
      S.wake = sstep(0, 0.5, s) * (1 - 0.45 * sstep(8, 14, s));
      S.ground = sstep(-2.2, 0.1, s);
      S.bow = sstep(5.5, 10.5, s);
      S.rpm = 1 - 0.9 * sstep(6, 10.5, s);
      S.flow = lerp(30, 12, sstep(0, 11, s));
    },
    // suggested keel height above its planing level, and nose-up pitch (radians), for the same clock
    heave(s) { if (s < 0) return 0; return 0.42 * Math.sin(Math.PI * sat((s - 0.4) / 0.72)) - 0.38 * sstep(5.8, 11, s); },
    pitch(s) { return s < 0 ? 0.075 * sstep(-3, 0, s) : lerp(0.075, 0.03, sstep(0, 2.5, s)) * (1 - sstep(5.8, 11, s)); },
    set(o) { Object.assign(S, o); },
    setLight(o = {}) {
      lightSet = true;
      if (o.sunDir) U.uSunDir.value.copy(o.sunDir).normalize();
      if (o.sunColor) U.uSunCol.value.copy(o.sunColor);
      if (o.sky) U.uSkyCol.value.copy(o.sky);
      if (o.horizon) U.uHorizonCol.value.copy(o.horizon);
      if (o.shade) U.uShadeCol.value.copy(o.shade);
      if (o.water) U.uWaterCol.value.copy(o.water);
      if (o.spray) U.uSprayCol.value.copy(o.spray);
      if (o.cabin !== undefined) skinMat.uniforms.uCabin.value = o.cabin;
      if (o.lamp !== undefined) skinMat.uniforms.uLamp.value = o.lamp;
      if (o.ambient !== undefined) skinMat.uniforms.uAmbK.value = o.ambient;
      if (o.foam) foamMat.uniforms.uFoamCol.value.copy(o.foam);
      if (o.fleck !== undefined) foamMat.uniforms.uFleck.value = o.fleck;
    },
    // put the aircraft so that the seat sits at `eye` (world), nose along `forward` (world, horizontal part used),
    // rolled right-wing-down by `roll`, nose up by `pitch`; `shift` moves the aircraft in its own frame (to let it drop astern)
    seatPose(eye, forward, roll = 0, pitch = 0, shift = null) {
      const yaw = Math.atan2(forward.x, forward.z);
      _e.set(-pitch, yaw, roll, 'YXZ'); object.quaternion.setFromEuler(_e);
      _v.copy(SEAT).multiplyScalar(scale); if (shift) _v.sub(_w.copy(shift).multiplyScalar(scale));
      object.position.copy(eye).sub(_v.applyQuaternion(object.quaternion));
    },
    // the same with the attitude given whole: `quat` is the aircraft's world quaternion (a world that poses the airframe against
    // the camera's own frame builds it there); the seat, less `shift`, is put at `eye`
    seatAt(eye, quat, shift = null) {
      object.quaternion.copy(quat);
      _v.copy(SEAT).multiplyScalar(scale); if (shift) _v.sub(_w.copy(shift).multiplyScalar(scale));
      object.position.copy(eye).sub(_v.applyQuaternion(object.quaternion));
    },
    update(dt, time, camera) {
      const t = time;
      U.uTime.value = t;
      if (!lightSet && object.parent) {
        let root = object.parent; while (root.parent) root = root.parent;
        for (const c of root.children) {
          if (c.isDirectionalLight) { U.uSunDir.value.copy(c.position).sub(c.target.position).normalize(); U.uSunCol.value.copy(c.color).multiplyScalar(c.intensity * 0.85); }
          else if (c.isHemisphereLight) { U.uSkyCol.value.copy(c.color).multiplyScalar(0.6 * c.intensity + 0.2); }
        }
      }
      const su = skinMat.uniforms;
      su.uWet.value = S.wet; su.uRunway.value = sat(S.flow / 30);
      const flut = Math.sin(t * 0.9) * 0.02 + Math.sin(t * 2.3 + 1) * 0.012;
      su.uHA.value[1] = S.aileron + flut; su.uHA.value[2] = S.aileron - flut * 0.8;
      su.uHA.value[3] = S.elevator + Math.sin(t * 1.3) * 0.02; su.uHA.value[4] = S.rudder + Math.sin(t * 0.7 + 2) * 0.03; su.uHA.value[5] = su.uHA.value[4];
      propAng += dt * (2 + S.rpm * 40) * (S.rpm > 0.001 ? 1 : 0); ghost += dt * (0.6 + 1.6 * S.rpm);
      discMat.uniforms.uSpin.value = sstep(0.16, 0.5, S.rpm); discMat.uniforms.uGhost.value = ghost;
      bladeMat.uniforms.uAng.value = propAng; bladeMat.uniforms.uAlpha.value = 1 - sstep(0.18, 0.45, S.rpm);
      flowZ += dt * S.flow;
      const fu = foamMat.uniforms; fu.uWake.value = S.wake; fu.uGround.value = S.ground; fu.uFlow.value = flowZ % 400; fu.uBow.value = S.bow;
      sprayU.uAmpH.value = S.spray; sprayU.uAmpF.value = S.feather;
      if (camera && ctx.renderer) {
        ctx.renderer.getDrawingBufferSize(_s);
        const p11 = camera.projectionMatrix.elements[5] || 1.5, hpx = Math.max(64, _s.y);
        wireMat.uniforms.uPx.value = 1.6 * 2 / (p11 * hpx);
        dropMat.uniforms.uPxScale.value = hpx * p11 * 0.5 * scale; dropMat.uniforms.uMaxPx.value = Math.min(256, hpx * 0.3);
      }
    },
    dispose() {},
  };
  hero.setProgress(opts.progress !== undefined ? opts.progress : 3.5);
  return hero;
}
const _e = new THREE.Euler(), _v = V3(), _w = V3(), _s = new THREE.Vector2();

// ================================================================ karst towers (the other half of the image)
const ROCK_VERT = /* glsl */`
attribute vec4 aCave; attribute vec4 aRock;      // aRock = (metres below the ledge above, occlusion, outer-shell flag, cave weight)
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv; varying vec4 vCave; varying vec4 vRock;
#include <fog_pars_vertex>
void main(){
  vL = position; vUv = uv; vCave = aCave; vRock = aRock;
  vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ROCK_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uShadeCol, uWaterCol, uRockCol, uRustCol, uLeafCol, uHorizonCol;
uniform float uTime, uWetRock, uBumpK; uniform vec4 uHole;
varying vec3 vN; varying vec3 vW; varying vec3 vL; varying vec2 vUv; varying vec4 vCave; varying vec4 vRock;
#include <fog_pars_fragment>
${GLSL_NOISE}
// one water stain hanging from a ledge. u metres round the tower, d metres below the ledge it hangs from (nothing above it),
// row an id for that ledge; cw the spacing of possible runs, thr the share of them left out, a length range, the widest width.
// Each run has its own place, width and length, wanders a little, tapers, and dies out: a distinct mark, never a curtain.
float gNear;                                   // 1 within about 100 m of the eye, 0 beyond 180 m (set in main)
float gFu;                                     // metres of wall one pixel covers along u (set in main)
float run(float u, float d, float row, float cw, float thr, float lmin, float lmax, float wmax){
  float q = u / cw + h11(row * 1.37 + cw) * 9.;
  float ci = floor(q), cf = fract(q);
  vec2 hh = h22(vec2(ci, row * 3.1 + cw));
  float k = fract(hh.x * 57.3 + hh.y * 13.1);
  float len = mix(lmin, lmax, hh.y);
  float w0 = mix(0.3, 1., k) * wmax * (1. - 0.6 * smoothstep(0., len, d));
  float w = max(w0, 1.3 * gFu);                                                 // never thinner than a pixel and a third: it widens and pales instead
  float cx = (cf - (0.25 + 0.5 * k)) * cw + (vnoise(vec2(ci * 7.7 + row, d * 0.22)) - 0.5) * 0.9;
  float body = (1. - smoothstep(w * mix(0.3, 0.72, gNear), w, abs(cx))) * (w0 / w);          // close to, a run has an edge: a distinct mark, not an airbrushed band
  return smoothstep(thr + 0.05 * gNear - 0.02, thr + 0.05 * gNear + 0.02, hh.x) * body * (1. - smoothstep(len * 0.4, len, d)) * smoothstep(-0.05, 0.3, d);
}
// a thread of falling water under a ledge: its own place and length like run(), one constant width w (the caller never lets
// it go under a pixel and a half: it widens it and thins its alpha instead), wandering a little
float thread(float u, float d, float row, float cw, float thr, float lmin, float lmax, float w){
  float q = u / cw + h11(row * 1.37 + cw) * 9.;
  float ci = floor(q), cf = fract(q);
  vec2 hh = h22(vec2(ci, row * 3.1 + cw));
  float len = mix(lmin, lmax, hh.y);
  float cx = (cf - (0.25 + 0.5 * fract(hh.x * 57.3 + hh.y * 13.1))) * cw + (vnoise(vec2(ci * 7.7 + row, d * 0.21)) - 0.5) * 2.2 + (vnoise(vec2(ci * 3.1 + row, d * 0.9)) - 0.5) * 0.5;
  return step(thr, hh.x) * (1. - smoothstep(w * 0.45, w, abs(cx))) * (1. - smoothstep(len * 0.6, len, d)) * smoothstep(0., 0.6, d);
}
// the height field of the rain-cut flutes: broad ribs 20 m and 6 m apart that wander and die out over 30-60 m of height
float sabs(float x){ return sqrt(x * x + 0.02); }
float flute(float u, float y){ return sabs(fbm3(vec2(u * 0.15, y * 0.034)) * 2. - 1.) + 0.4 * sabs(vnoise(vec2(u * 0.5, y * 0.085) + 7.) * 2. - 1.) + 0.15 * vnoise(vec2(u * 1.9, y * 0.3)); }
float rill(float ru, float y){ return sabs(vnoise(vec2(ru, y * 0.05 + 3.)) * 2. - 1.); }
// where bedding joint k lies (in units of the mean bed, 17 m): each joint has its own level and its own slow wander round the
// tower, so beds are 3 to 30 m thick and two joints can run together (a bed pinching out); joints never cross
float jointAt(float k, float u){ return k + 0.5 + 0.62 * (h11(k * 1.31 + 0.7) - 0.5) + 0.34 * (vnoise(vec2(u * 0.013 + k * 7.3, k * 3.1)) - 0.5); }
// jittered cells: x = distance to the nearest cell border, y = the cell's own hash, z = distance to its site (cell units),
// w = the hash of the cell across that border. No texture look-up and no derivative inside the loop.
vec4 cells(vec2 p){
  vec2 ci = floor(p), cf = fract(p); float d1 = 9., d2 = 9., id = 0., id2 = 0.;
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
    vec2 o = vec2(float(xx), float(yy)); vec2 h = h22(ci + o); vec2 d = o + 0.1 + 0.8 * h - cf; float dd = dot(d, d);
    if (dd < d1) { d2 = d1; id2 = id; d1 = dd; id = h.x; } else if (dd < d2) { d2 = dd; id2 = h.x; } }
  return vec4(sqrt(d2) - sqrt(d1), id, sqrt(d1), id2);
}
void main(){
  float holeD = 9.;
  if (uHole.w > 0.5 && vRock.z > 0.5 && vL.z > 0.) { float hx = (vL.x - uHole.x) / uHole.y, hy = vL.y / uHole.z; holeD = hx * hx + hy * hy; if (holeD < 1.) discard; }
  float holeGate = 1. - smoothstep(1.0, 1.25, holeD);          // (nothing with a screen-space slope right at the tunnel's cut edge)
  vec3 Ng = normalize(vN); if (!gl_FrontFacing) Ng = -Ng;
  vec3 L = normalize(uSunDir);
  // (with antialiasing a sliver triangle is shaded outside its own area and its varyings run on past their ends: every one
  // that feeds an exponent or a product is clamped to its true range here, and the colour is capped at the end)
  float u = vUv.x, y = vL.y, rim = max(vRock.x, 0.), ao = clamp(vRock.y, 0., 1.);
  float wall = 1. - smoothstep(0.5, 0.85, abs(Ng.y));
  // how many metres of rock one pixel covers: every layer of detail fades out before it is finer than a pixel
  float fu = fwidth(u), fy = fwidth(y), fw = fu + fy; gFu = fu;
  // the footprint that round (isotropic) detail fades by leans on the smaller of the two axes: looking along a wall the
  // pixel is long in u only, and pits, joints and grain must not all blur out with it (each still fades two pixels wide)
  float fwP = 0.7 * fw + 0.6 * min(fu, fy);
  float gfade = 1. - smoothstep(0.045, 0.14, fwP);         // decimetre grain
  float g2fade = 1. - smoothstep(0.12, 0.35, fwP);         // grain a third of a metre across
  float pfade = 1. - smoothstep(0.23, 0.7, fwP);           // pits, hairline cracks (half a metre)
  float qfade = 1. - smoothstep(0.55, 1.6, fwP);           // solution hollows (two metres)
  float tfade = 1. - smoothstep(0.3, 1.3, fw);            // rills and thin runs (a metre or two)
  float cfade = 1. - smoothstep(1.1, 3.4, fwP);           // joint blocks (three to eight metres)
  float dEye = length(cameraPosition - vW);
  gNear = 1. - smoothstep(100., 180., dEye);              // at arm's length the wall is pitted, jointed stone: the long curtains and flutes step back
  float nearB = 1. - smoothstep(170., 300., dEye);        // and its blocks, hollows and cracks carry relief of their own
  float jfade = 1. - smoothstep(1.4, 4.2, fw);            // bedding
  float ffade = 1. - smoothstep(1.6, 5.5, fw);            // broad flutes and the weathering skin (six to twenty metres)
  // how far the lathe's own (u, y) is stretched over the real surface here (a shelf, a cave's throat, the underside of an
  // overhang: metres of rock per metre of (u, y)). Everything that runs down the wall fades with it, so nothing smears.
  float sK = 1. - smoothstep(1.6, 3.0, (length(dFdx(vW)) + length(dFdy(vW))) / max(fw, 1e-4));
  vec3 T = cross(vec3(0., 1., 0.), Ng); float tl = length(T); T = tl > 1e-4 ? T / tl : vec3(1., 0., 0.);
  float pit = vnoise(vec2(u * 1.7, y * 1.5)), big = fbm3(vec2(u * 0.03, y * 0.045) + 3.);
  float grain = vnoise(vec2(u * 7.1, y * 5.3)), grain2 = vnoise(vec2(u * 3.4 + 5., y * 3.1));
  float hol = vnoise(vec2(u * 0.55 + 31., y * 0.6 + 7.)) * 0.65 + vnoise(vec2(u * 1.05 + 3., y * 1.1 + 17.)) * 0.35;      // solution hollows and bosses, one to two metres
  // BEDDING: beds of unequal thickness, nearly level, that pinch out here and there (jointAt). A bed's joint is a parting,
  // never a course line: it shows along part of its length only.
  float bwarp = (vnoise(vec2(u * 0.011, 1.)) - 0.5) * 7. + (vnoise(vec2(u * 0.06, 3.)) - 0.5) * 1.6 + (vnoise(vec2(u * 0.37, 3.)) - 0.5) * 0.4;
  float bq = (y + bwarp) / 17.;
  float bk = floor(bq);
  float bed = bq < jointAt(bk, u) ? bk : bk + 1.;                         // this bed lies between joint bed-1 and joint bed
  float jlo = jointAt(bed - 1., u), jhi = jointAt(bed, u);
  float bm = max(jhi - jlo, 0.02) * 17.;                                  // its thickness here, metres
  float bf = clamp((bq - jlo) / max(jhi - jlo, 0.02), 0., 1.);            // 0 at its foot .. 1 under the joint above
  float dTop = (jhi - bq) * 17., dBot = (bq - jlo) * 17.;
  float jrow = dTop < dBot ? bed : bed - 1.;                              // the joint this point is nearest
  float jd = dTop < dBot ? dTop : -dBot;                                  // metres below that joint (negative above it)
  float thick = smoothstep(2.5, 8., bm);                                  // a bed that has all but pinched out carries no lines
  // FLUTING follows the rock irregularly: each bed shifts the ribs a little, they come and go in patches, and they fade
  // where the surface is stretched or finer than a pixel
  float uf = u + (h11(bed * 1.9) - 0.5) * 5.;
  float f0 = flute(uf, y), f1 = flute(uf + 0.4, y);
  float ru = uf * 0.72 + 0.7 * vnoise(vec2(u * 0.06, y * 0.045));
  float r0 = rill(ru, y), r1 = rill(ru + 0.13, y);
  float sfam = mix(1., 0.4, gNear);                                                               // (the streak family at 40% close to)
  float rillM = smoothstep(0.3, 0.62, vnoise(vec2(u * 0.05 + 17., y * 0.028))) * tfade * sK * sfam;      // rills come and go in patches
  float fl = (0.35 + 0.65 * smoothstep(0.25, 0.6, vnoise(vec2(u * 0.017 + 5., y * 0.021)))) * ffade * sK * sfam;
  // joint blocks and hairline cracks: two sizes of jittered cells, their borders as thin dark lines. The larger set is laid
  // out bed by bed (its own offset in every bed), so a vertical joint never runs through from one bed to the next
  vec4 c1 = cells(vec2((u + h11(bed * 2.3) * 23.) * 0.2, bed * 3.7 + bf * bm / 5.5) + (vnoise(vec2(u * 0.09, y * 0.08)) - 0.5) * 0.5);
  vec4 c2 = cells(vec2(u * 1.6 + 13., y * 1.45));
  // a joint is a fracture, not a net: of a block's borders fewer than half are open (each border has its own hash, the same
  // from both sides), so cracks run a block or two and stop; a block's own tone fades out toward its borders, so where no
  // crack runs there is no outline either
  float eh = fract((c1.y + c1.w) * 9.73 + c1.y * c1.w * 31.7);
  // (a crack's and a block edge's own distance over one pixel, from the footprint's longer axis: no derivative of the cell
  // field itself, which jumps from block to block and turned lines to dots)
  float pc1 = clamp(0.19 * max(fu, fy), 1e-4, 0.5);
  // a block's own tone: the same all over the block, meeting its neighbour's half-way at the border over a pixel or two, so
  // two blocks that weathered differently stand side by side with a clean edge (a joint, whether or not a crack is open in it)
  float blockT = mix(0.5 * (c1.y + c1.w), c1.y, smoothstep(0., max(pc1 * 2., 0.02), c1.x)) - 0.5;
  // (a crack keeps its own width, a few centimetres: thinner than a pixel it fades, it never fattens)
  float px1 = max(fwP * 0.2, 1e-4), px2 = max(fwP * 1.2, 1e-4);
  float crackM = smoothstep(0.5, 0.72, vnoise(vec2(u * 0.045 + 7., y * 0.04)));
  crackM = mix(crackM, smoothstep(0.52, 0.6, eh + 0.3 * (crackM - 0.5)), nearB);
  // (an open joint is a hand to a forearm wide; under a pixel and a third it keeps that width and loses contrast instead)
  float cw1 = 0.014 + 0.034 * fract(eh * 5.3);
  float crack1 = (1. - smoothstep(max(cw1, pc1 * 1.3) * 0.4, max(cw1, pc1 * 1.3), c1.x)) * clamp(cw1 * 1.3 / pc1, 0., 1.) * cfade * crackM;
  float crack2 = clamp((0.04 - c2.x) / px2 + 0.5, 0., 1.) * clamp(0.13 / px2, 0., 1.) * pfade * smoothstep(0.42, 0.66, vnoise(vec2(u * 0.17 + 3., y * 0.12)));
  float pitR = 0.07 + 0.15 * fract(c2.y * 5.7);                           // pockmarks of unlike size, in clusters (never a dotted grid)
  float pitD = (1. - smoothstep(pitR * 0.5, pitR, c2.z)) * step(0.55, c2.y) * smoothstep(0.45, 0.62, vnoise(vec2(u * 0.23 + 11., y * 0.27))) * pfade * clamp(pitR * 1.2 / px2, 0., 1.)
    * (1. - smoothstep(0.1, 0.3, fwP));                                   // (a pockmark is a hand across: under two pixels it is only pepper, so it goes)
  float bend = (f1 - f0) * 1.25 * fl + (r1 - r0) * 0.7 * rillM + (pit - 0.5) * 0.45 * pfade * (1. - nearB) + (c1.y - 0.5) * 0.1 * (1. - nearB) * cfade;
  vec3 N0 = normalize(Ng - T * bend * wall + vec3(0., ((vnoise(vec2(u * 1.3 + 9., y * 1.6)) - 0.5) * 0.4 * pfade * (1. - nearB) + (c2.y - 0.5) * 0.08 * pfade) * wall, 0.));
  // CLOSE TO, the face has relief of its own, the same in every direction: solution hollows and bosses a metre or two
  // across, pits half a metre across and grain, as one height field in metres whose slope is taken by differences in (u, y)
  // (never from screen-space derivatives: those are one value per 2 x 2 pixels and drew a chequered dither). Its hollows
  // are darker too (cav, the field's own zero-mean part); open joints and pockmarks are dark marks on top.
  float cav = ((hol - 0.5) * 0.6 * qfade + (pit - 0.5) * 0.3 * pfade + (grain2 - 0.5) * 0.2 * g2fade - 0.4 * pitD) * nearB * wall;
  float eB = max(0.16, 0.6 * fwP);
  float holU = vnoise(vec2((u + eB) * 0.55 + 31., y * 0.6 + 7.)) * 0.65 + vnoise(vec2((u + eB) * 1.05 + 3., y * 1.1 + 17.)) * 0.35;
  float holY = vnoise(vec2(u * 0.55 + 31., (y + eB) * 0.6 + 7.)) * 0.65 + vnoise(vec2(u * 1.05 + 3., (y + eB) * 1.1 + 17.)) * 0.35;
  float pitU = vnoise(vec2((u + eB) * 1.7, y * 1.5)), pitY = vnoise(vec2(u * 1.7, (y + eB) * 1.5));
  float g2U = vnoise(vec2((u + eB) * 3.4 + 5., y * 3.1)), g2Y = vnoise(vec2(u * 3.4 + 5., (y + eB) * 3.1));
  vec2 dH = vec2((holU - hol) * 0.7 * qfade + (pitU - pit) * 0.26 * pfade + (g2U - grain2) * 0.05 * g2fade,
                 (holY - hol) * 0.7 * qfade + (pitY - pit) * 0.26 * pfade + (g2Y - grain2) * 0.05 * g2fade) / eB;
  // (a slope is never steeper than the stone; the relief comes in patches, calm stone between: never one even pebble-dash)
  float relM = 0.3 + 0.7 * smoothstep(0.36, 0.64, vnoise(vec2(u * 0.07 + 51., y * 0.09 + 13.)));
  dH = clamp(dH, vec2(-1.3), vec2(1.3)) * nearB * wall * (1. - holeGate) * relM * 0.8;
  vec3 N = normalize(N0 - T * dH.x - vec3(0., 1., 0.) * dH.y);
  // WEATHERED LIMESTONE: warm grey stone under a rain-blackened, lichened skin (dark grey to grey-green) that hangs in
  // irregular curtains 30-60 m long from the shoulder and the ledges; paler ribs stand between the flutes, and here and
  // there a slab has come away and left a pale scar. Far off the skin settles to its mean, so a distant tower stays dark.
  vec3 base = uRockCol * (0.5 + 0.42 * big) * mix(1., 0.8 + 0.2 * smoothstep(0., 0.55, f0), fl) * mix(0.9 + 0.2 * pit, 0.8 + 0.4 * pit, pfade);
  base *= (1. + mix((c1.y - 0.5) * 0.07, blockT * 0.24, nearB) * cfade) * (1. + (c2.y - 0.5) * 0.1 * pfade) * (1. + (grain - 0.5) * 0.24 * gfade) * (1. + (grain2 - 0.5) * 0.16 * g2fade);
  base *= (1. - mix(0.3, 0.5, nearB) * crack1 * wall) * (1. - 0.5 * crack2 * wall) * (1. - 0.45 * pitD * wall);
  base *= 1. + clamp(cav, -0.34, 0.26);
  float under = max(exp(-rim / 40.), 0.6 * exp(-dTop / 9.) * thick);
  float st = fbm3(vec2(uf * 0.1 + 11., y * 0.021)) * 0.75 + vnoise(vec2(uf * 0.42 + 3., y * 0.05)) * 0.35;
  // close to, the skin lies in patches that keep to the joint blocks (a block is weathered or it is not) and to the hollows:
  // no more than about two and a half times taller than wide, with an edge
  float stN = fbm3(vec2(uf * 0.1 + 11., y * 0.047)) * 0.5 + vnoise(vec2(uf * 0.3 + 3., y * 0.13)) * 0.2 + 0.17 + blockT * 0.42 * cfade + (hol - 0.5) * 0.1 * qfade;
  st = mix(st, stN, gNear);
  float se = mix(0.1, 0.055, gNear);
  float skin = mix(0.56, smoothstep(0.5 - se, 0.5 + se, st + 0.15 * under), ffade * sK) * mix(1., 0.75 + 0.25 * under, wall);
  float scar = smoothstep(0.62, 0.72, fbm3(vec2(u * 0.035 + bed * 0.9, y * 0.05) + 23.)) * (1. - smoothstep(2.4, 7., fw)) * wall;
  skin *= 1. - 0.85 * scar;
  base = mix(base, base * vec3(0.27, 0.31, 0.31), skin * 0.9 * (0.3 + 0.7 * wall));
  base = mix(base, base * vec3(0.86, 1.0, 0.8), 0.6 * smoothstep(0.35, 0.7, vnoise(vec2(u * 0.05 + 40., y * 0.06))) * skin);     // lichen: grey-green
  base = mix(base, base * vec3(1.12, 1.04, 0.9), scar * 0.7);
  // a joint shows as a parting with a shadow under it along about half its length (it comes and goes, so the face runs on
  // across it); about a fifth of it is a real ledge with a pale lip, tufts on top and creepers hanging below
  float jline = smoothstep(0.36, 0.66, vnoise(vec2(u * 0.038 + jrow * 7.3, jrow * 5.1))) * jfade * wall * vRock.z * thick;
  float jmask = smoothstep(0.58, 0.7, vnoise(vec2(u * 0.075 + jrow * 17.3, jrow * 3.1))) * jfade * wall * vRock.z * thick;
  float jbelow = smoothstep(-0.05, 0.1, jd);
  float seam = (1. - smoothstep(mix(0.1, 0.07, gNear), mix(0.32, 0.2, gNear) + fw, abs(jd - 0.12))) * jline * mix(1., 1.5, gNear);      // (a crisp level line close to)
  float lip = smoothstep(-0.7 - fw, -0.3, jd) * (1. - smoothstep(-0.08, 0.1 + fw, jd)) * max(jmask, mix(0.1, 0.5, gNear) * jline) * smoothstep(5., 10., bm);
  float jsh = jbelow * exp(-max(jd, 0.) / mix(0.8, 1.9, jmask)) * max(jmask, 0.3 * jline);
  base *= (1. - 0.5 * jsh) * (1. - 0.32 * seam);
  // THIN BEDS close to: the limestone lies in courses a forearm to a stride thick, and their partings are level lines laid
  // in world space (height, and the wall's own run in x and z: nothing stretches where the lathe's u does), each with a
  // shadow in it and a lit lip under it, open along part of its length only. They fade by the pixel's height alone, so
  // they hold when the wall is seen along its length from 40 m.
  float hcW = vW.z * 0.83 + vW.x * 0.56;
  float lmQ = (y + 0.5 * vnoise(vec2(hcW * 0.045, y * 0.11)) + 2.2 * vnoise(vec2(hcW * 0.013 + 3., y * 0.16 + 9.))) / 1.15, lmR = floor(lmQ);      // (courses of unlike thickness: never ruled lines)
  float lmD = (fract(lmQ) - 0.25 - 0.5 * h11(lmR * 1.71 + 3.)) * 1.15;             // metres above this course's parting
  float lmW = max(0.045, 0.75 * fy);
  float lmF = (1. - smoothstep(0.16, 0.5, fy)) * nearB * wall * vRock.z * step(0.42, h11(lmR * 3.3 + 1.)) * smoothstep(0.36, 0.56, vnoise(vec2(hcW * 0.1 + lmR * 3.1, lmR * 1.7)));
  float lmLine = (1. - smoothstep(lmW * 0.5, lmW, abs(lmD))) * clamp(0.09 / lmW, 0., 1.);
  float lmLip = (1. - smoothstep(lmW, lmW * 2.6, abs(lmD + 1.7 * lmW))) * clamp(0.12 / lmW, 0., 1.);
  base *= (1. - 0.5 * lmLine * lmF) * (1. + 0.2 * lmLip * lmF) * (1. + (h11(lmR * 2.9) - 0.5) * 0.14 * lmF);
  // and within a course, at arm's length, hair partings a hand apart that come and go (the same rule, a third of the scale)
  float lnQ = (y + 0.2 * vnoise(vec2(hcW * 0.11, y * 0.3 + 7.))) / 0.36, lnR = floor(lnQ);
  float lnD = (fract(lnQ) - 0.25 - 0.5 * h11(lnR * 1.37 + 5.)) * 0.36, lnW = max(0.02, 0.75 * fy);
  float lnF = (1. - smoothstep(0.07, 0.2, fy)) * nearB * wall * vRock.z * step(0.6, h11(lnR * 2.1 + 9.)) * smoothstep(0.45, 0.62, vnoise(vec2(hcW * 0.21 + lnR * 1.3, lnR * 0.7)));
  base *= 1. - 0.3 * (1. - smoothstep(lnW * 0.5, lnW, abs(lnD))) * clamp(0.045 / lnW, 0., 1.) * lnF;
  float rimE = min(rim, max(jd, 0.) + (1. - jmask * jbelow) * 90.);      // metres below the nearest ledge of either kind
  float tuft = smoothstep(-2.4, -0.4, jd) * (1. - smoothstep(-0.1, 0.5, jd)) * (0.3 + 0.7 * jmask)
    * smoothstep(0.52, 0.72, vnoise(vec2(u * 0.3, jrow * 5.3)) * 0.6 + vnoise(vec2(u * 1.1, y * 0.7)) * 0.4) * wall * vRock.z * jfade;
  // distinct black rain streaks and rust runs, each hanging from a ledge: the top of this bed, the bed above, the shoulder
  float sfil = 0.7 + 0.3 * mix(vnoise(vec2(u * 2.6, y * 0.09)), pit, gNear);
  float runF = wall * (1. - smoothstep(1.2, 3.6, fw)) * sK;
  float streak = max(run(u, dTop, bed, 12., 0.55, 7., 30., 2.2), run(u, dTop + bm, bed + 1., 12., 0.6, 7., 30., 2.2));
  streak = max(streak, run(u, rim, 77., 13., 0.4, 16., 55., 3.2)) * sfil * runF;
  // the thin rain runnels the shower left: white threads of falling water down the middle of the wetter runs, sliding
  float rnw = min(max(0.34, 1.6 * fu), mix(4., 0.5, gNear));                 // close to a runnel stays a hair: it thins out instead of fattening
  float runnel = max(thread(u + 1.1, dTop, bed + 7., 31., 0.68, 8., 24., rnw), thread(u + 2.3, rim, 53., 26., 0.45, 25., 75., rnw * 1.15))
    * runF * clamp(0.5 / rnw, 0., 1.) * clamp(rnw / max(1.6 * fu, 1e-3), 0.25, 1.) * mix(1., 0.64, gNear) * (1. - smoothstep(1.4, 3.2, fw)) * (0.5 + 0.5 * vnoise(vec2(u * 0.4, y * 0.7 + uTime * 3.5)));
  base = mix(base, base * vec3(0.2, 0.21, 0.24), streak * 0.9);
  // rust: thin runs a hand to an arm wide and 7 to 36 m long, each from its own ledge, streaked along their fall: never a patch
  float rust = max(run(u + 5., dTop, bed + 40., 8.5, 0.6, 7., 24., 0.85), run(u + 5., rim, 91., 10.5, 0.5, 12., 36., 1.15));
  rust *= (0.55 + 0.45 * vnoise(vec2(u * 3.1, y * 0.1))) * runF;
  base = mix(base, uRustCol * (0.55 + 0.5 * pit), rust * 0.72);
  base = mix(base, base * vec3(1.1, 0.9, 0.74), 0.5 * exp(-rim / 16.) * smoothstep(0.35, 0.7, big) * wall);     // a faint warm wash under the shoulder
  // creepers hanging in ragged curtains from the cap and from every ledge, swaying; their feet fray into strands
  float sway = sin(uTime * 0.8 + u * 0.3) * 0.3;
  float strand = vnoise(vec2(u * 2.9 + sway, y * 0.13));
  float cl = (6. + 16. * vnoise(vec2(u * 0.11, 2.))) * (0.3 + 0.7 * vnoise(vec2(u * 0.7, 9.)));
  float hang = clamp(rim / cl, 0., 1.);
  float cn = vnoise(vec2((u + sway * hang) * 0.8, y * 0.06));
  float creeper = smoothstep(0.42, 0.6, cn + 0.55 * (1. - hang)) * (1. - smoothstep(0.8, 1., hang)) * smoothstep(0.1, 0.5, strand + 1.2 * (1. - hang));
  float clJ = (5. + 9. * vnoise(vec2(u * 0.13 + jrow * 5.1, 7.))) * jmask + 0.02;                 // a fringe of strands, each its own length, tapering out at the ledge's ends
  float hangJ = clamp(max(jd, 0.) / clJ, 0., 1.);
  float uS = u + sway * hangJ;
  float lenN = (0.28 + 0.72 * vnoise(vec2(uS * 2.3 + jrow * 3.3, 5.))) * (0.45 + 0.55 * vnoise(vec2(uS * 0.31 + jrow * 9.1, 2.)));
  float cnJ = vnoise(vec2(uS * 0.85 + jrow * 3.7, y * 0.07));
  float creeperJ = (1. - smoothstep(lenN - 0.16, lenN, hangJ)) * smoothstep(0.22, 0.42, cnJ + 0.45 * (1. - hangJ)) * smoothstep(0.02, 0.3, jmask) * jbelow;
  creeper = max(creeper, creeperJ) * wall * vRock.z;
  float leafn = vnoise(vec2(u * 2.3, y * 1.9)), leaff = vnoise(vec2(u * 6.1, y * 5.3));
  float cvar = vnoise(vec2(u * 0.21 + 5., y * 0.16));                       // dark-green curtains (never black), shadowed under the ledge they hang from
  vec3 creepCol = (uLeafCol * 2.3 + vec3(0.01, 0.026, 0.005)) * (0.42 + 0.8 * leafn + 0.5 * (leaff - 0.5) * pfade) * (0.55 + 0.9 * cvar) * mix(0.45, 1., smoothstep(0.3, 4., rimE));
  float green = max(creeper, tuft * 0.9);
  base = mix(base, creepCol, green);
  // the tunnel's lip: paler, wet rock catching the portal's light
  float lipRim = (1. - smoothstep(1.02, 1.5, holeD)) * step(0.5, uHole.w);
  base = mix(base, uRockCol * 0.95, lipRim * 0.5);
  // cave mouths: an arch over a flattish floor with a ragged rim and stalactite teeth along the upper lip; a pale sill that
  // catches the light below, a shadowed brow above, and depth inside: the throat darkens inward and upward, while the floor
  // just inside the sill and the inner wall turned to the sun are still lit. Far off (over half a metre of rock to a pixel)
  // the teeth go and the mouth is a recessed shadow in the shade colour, never a black spot.
  vec2 chw = max(vCave.zw, vec2(1.));
  vec2 cq = (vUv - vCave.xy) / chw;
  float craw = length(vec2(cq.x, cq.y < 0. ? cq.y * 1.9 : cq.y));
  float cfar = smoothstep(0.5, 1.5, fw), cfar2 = smoothstep(1.0, 2.4, fw);
  float topK = smoothstep(0.05, 0.5, cq.y);
  float tq = u * 0.34 + 0.5 * vnoise(vec2(u * 0.23, 3.));
  float tri = 1. - abs(fract(tq) * 2. - 1.);
  float tooth = tri * sqrt(tri) * (0.05 + 0.3 * h11(floor(tq) + vCave.x)) * topK * (1. - cfar);         // stalactite teeth three metres apart, half a metre to four long
  float carch = craw + 0.16 * (fbm3(vUv * 0.21 + 3.) - 0.5) + 0.09 * (vnoise(vUv * 0.9 + 7.) - 0.5) * (1. - cfar);      // the arch itself, ragged
  float cdist = carch + tooth;
  float cgate = smoothstep(0.6, 0.95, vRock.w);
  float caa = clamp(fwidth(carch), 0.003, 0.25) * 0.75;                                   // a hard rim: one pixel, whatever the range (from the arch alone: the teeth's field jumps from tooth to tooth)
  float caaT = caa + min(0.15 * fu, 0.2) * topK;                                           // the teeth's own edge
  float mouth = (1. - smoothstep(1. - caaT, 1. + caaT, cdist)) * cgate;
  float cave = mouth;
  float inArch = (1. - smoothstep(1. - caa, 1. + caa, carch)) * cgate;                    // the teeth are what is inside the arch but not open
  float sill = (1. - smoothstep(1.02, 1.3, cdist)) * (1. - mouth) * (1. - smoothstep(-0.3, -0.12, cq.y)) * cgate;
  float brow = (1. - smoothstep(1.0, 1.0 + 1.1 / chw.y + caa, carch)) * (1. - inArch) * smoothstep(0., 0.3, cq.y) * cgate;      // a metre of shadow under the brow, above the lip
  float tipK = smoothstep(0.4, 1., (1. - carch) / max(tooth, 0.02)) * clamp(inArch - mouth, 0., 1.);      // teeth: pale at the root, dark-tipped
  base *= (1. + 1.1 * sill) * (1. - 0.55 * brow) * (1. + 0.3 * (inArch - mouth)) * (1. - 0.55 * tipK);
  // inside: the eye's ray is carried on into a throat that narrows to under half the mouth over its depth, with a level
  // floor; where it lands (floor, wall or roof of the throat, or the back) is lit by what sun comes in through the mouth, by
  // the sky's light falling off inward and by the lit floor's bounce. No look-up and no derivative in here.
  vec3 caveCol = vec3(0.);
  if (mouth > 0.002) {
    vec3 Vd = normalize(vW - cameraPosition + vec3(1e-5));
    float vt = dot(Vd, T), vb = Vd.y, dz = max(-dot(Vd, Ng), 0.24);
    vec2 p0 = vUv - vCave.xy;
    float Dc = 1.15 * chw.x + 2.5, kz = 0.58 / Dc;
    vec2 e0 = p0 / chw; e0 *= 0.97 / max(length(e0), 0.97);
    vec2 ed = vec2(vt, vb) / chw;
    float qa = dot(ed, ed) - kz * kz * dz * dz, qb = dot(e0, ed) + kz * dz, qc = dot(e0, e0) - 1.;
    float den = qb + sqrt(max(qb * qb - qa * qc, 0.));
    float tw = den > 1e-4 ? -qc / den : 1e3;
    float yf = -0.5 * chw.y, fs = 0.5;                                   // the floor rises inward (silt and fallen blocks): half a metre a metre
    float fden = fs * dz - vb;
    float tf = fden > 1e-3 ? max(e0.y * chw.y - yf, 0.) / fden : 1e3;
    float tbk = Dc / dz;
    float tt = min(min(tw, tf), tbk);
    float isF = tf <= min(tw, tbk) ? 1. : 0., isB = (tbk < tw && tbk < tf) ? 1. : 0.;
    vec2 hp = e0 * chw + tt * vec2(vt, vb); float hz = tt * dz;
    vec2 en = hp / (chw * chw); en /= max(length(en), 1e-4);
    vec3 nIn = isF > 0.5 ? vec3(0., 1., 0.) : (isB > 0.5 ? Ng : normalize(-(T * en.x + vec3(0., en.y, 0.)) + Ng * 0.3));
    float Ln = dot(L, Ng), Lt = dot(L, T);
    vec2 sp = (hp + hz * vec2(Lt, L.y) / max(Ln, 0.06)) / chw;
    float sunIn = smoothstep(0.02, 0.22, Ln) * (1. - smoothstep(0.78, 1.02, length(vec2(sp.x, sp.y < 0. ? sp.y * 1.9 : sp.y))));
    float dk = exp(-hz / 2.6);
    float tex = vnoise(vec2(hp.x * 0.9 + hz * 0.8, hp.y * 0.9 - hz * 0.35)) * 0.6 + vnoise(vec2(hp.x * 2.3 - hz * 1.7, hp.y * 2.1 + hz)) * 0.4;
    vec3 albIn = mix(uRockCol * vec3(0.78, 0.66, 0.52), uRockCol * vec3(1.0, 0.96, 0.84), isF * 0.8) * (0.5 + 0.55 * tex);      // warm stone; the floor's silt is cream
    vec3 shdI = mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.3);
    vec3 ambIn = (shdI * 1.5 + uSkyCol * 0.55 + uHorizonCol * 0.2) * (0.1 + 1.0 * dk) * (0.5 + 0.5 * max(nIn.y, 0.) + 0.25 * max(dot(nIn, Ng), 0.));
    vec3 bncIn = uSunCol * vec3(1.0, 0.84, 0.62) * 0.3 * smoothstep(0.02, 0.22, Ln) * (0.1 + 0.9 * dk) * (0.55 + 0.45 * max(-nIn.y, 0.));     // the lit floor and far wall throw warm light back on roof and walls
    caveCol = albIn * (uSunCol * sunIn * (0.25 + 0.75 * max(dot(nIn, L), 0.)) * 0.6 * (0.22 + 0.78 * exp(-hz / 4.5)) + ambIn + bncIn) + mix(uShadeCol, vec3(0.2, 0.14, 0.08), 0.45) * 0.05;     // deep in: jade-brown, never black
  }
  // the tide band: wet near-black rock up to a ragged line five or six metres above the water (never thinner than a pixel
  // or two, so every foot far off still stands on a dark base), a pale barnacle line across it close to
  float yy = y + 0.5 * (vnoise(vec2(u * 0.25, 4.)) - 0.5) + 0.12 * sin(uTime * 0.9 + u * 0.15);
  float wet = 1. - smoothstep(2.5, 3.4, yy);
  float tideTop = 5.8 + 1.8 * (vnoise(vec2(u * 0.12, 4.)) - 0.5) + min(fw, 5.) * 1.3;
  float tide = (1. - smoothstep(tideTop - 1.4, tideTop, yy)) * vRock.z;
  float barn = smoothstep(1.8, 2.2, yy) * (1. - smoothstep(2.9, 3.5, yy)) * (1. - smoothstep(0.5, 2., fw));
  base = mix(base, base * 0.2 + vec3(0.003, 0.007, 0.007), max(wet, tide * 0.88) * (1. - barn));
  base = mix(base, vec3(0.40, 0.39, 0.32) * (0.65 + 0.55 * pit), barn * 0.85);
  // light: gold sunward face, jade-blue shade. The sun stands nearly square to the lit wall and the sky fill square to the
  // shaded one, so relief is read from the height field itself (a raking term and darker grooves) in sun and in shade alike
  float ndl = dot(N, L);
  float lit = smoothstep(-0.05, 0.5, ndl);
  float ndl0 = dot(N0, L);
  float bumpS = clamp(1. + 1.6 * uBumpK * (ndl - ndl0), 1. - 0.5 * uBumpK, 1. + 0.5 * uBumpK), bumpA = clamp(1. + uBumpK * (1.3 * (N.y - N0.y) + 0.5 * (ndl - ndl0)), 1. - 0.34 * uBumpK, 1. + 0.34 * uBumpK);     // the close relief, read in sun and (from the sky above) in shade
  float rel = ((f1 - f0) * 3.4 * fl + (r1 - r0) * 1.0 * rillM + (pit - 0.5) * 0.36 * pfade + (c1.y - 0.5) * 0.08 * cfade) * wall * (1. - green);
  float groove = mix(1., 0.72 + 0.28 * smoothstep(0.14, 0.6, r0), rillM * wall * (1. - green)) * mix(1., 0.74 + 0.26 * smoothstep(0.1, 0.6, f0), fl * wall * (1. - green));
  float relA = clamp(1. + rel * 0.85, 0.6, 1.45) * groove, relS = clamp(1. + rel * 1.25, 0.45, 1.65) * (0.3 + 0.7 * groove);
  float s1 = 1. - abs(vnoise(vec2(u * 0.3 + uTime * 0.35, y * 0.42 - uTime * 0.6)) * 2. - 1.), s2 = 1. - abs(vnoise(vec2(u * 0.55 - uTime * 0.3, y * 0.3 + uTime * 0.28)) * 2. - 1.);
  float shim = s1 * s1 * s2 + 0.35 * s1 * s2 * s2;
  float low = 1. - smoothstep(3., 36., y);
  vec3 shd = mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.5);
  float sunSide = 0.5 + 0.5 * dot(normalize(Ng.xz + vec2(1e-4)), normalize(L.xz + vec2(1e-4)));
  vec3 amb = (shd * (1.3 + 0.3 * Ng.y) + uSkyCol * (0.37 + 0.4 * max(Ng.y, 0.))) * mix(1., 0.8 + 0.22 * smoothstep(0., 0.6, sunSide), wall) + uHorizonCol * (0.1 + 0.16 * sunSide) * wall;   // a face turned from the sun is a step darker: towers stand dark against the light
  // ... and it stands in jade-blue shade, never in grey or olive: the sky's cool fill, with its relief readable
  // (seen against the light, with the sun behind it, a tower keeps more of its darkness: the Sentinel stands dark in the glitter)
  float cjour = max(dot(normalize(vW.xz - cameraPosition.xz + vec2(1e-4)), normalize(L.xz + vec2(1e-4))), 0.);
  float shadeK = wall * (1. - smoothstep(0.15, 0.6, sunSide)) * (1. - 0.5 * cjour * cjour);
  amb += (mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.15) * 1.05 + uSkyCol * 0.15 - uHorizonCol * 0.05) * shadeK;
  vec3 bounce = uWaterCol * low * (0.1 + 1.25 * shim) * (1. - 0.6 * wet);
  vec3 col = base * (uSunCol * lit * (0.3 + 0.24 * max(ndl, 0.)) * relS * bumpS + amb * relA * bumpA + bounce) * ao;
  col += creepCol * green * dot(uSkyCol + shd, vec3(0.3333)) * 0.9 * ao * (1. - cave);               // a floor: creepers in shade stay dark green, never black
  col += base * (uHorizonCol * 0.55 + uSkyCol * 0.3) * lip * (1. - green) * ao * (1. - cave) * mix(1., 1.9, gNear);       // the ledge's lip catches the low light: a thin gold rim
  // rain runnels: white threads, blue-white in shade, a few catching the gold
  col = mix(col, (uSkyCol * 0.8 + shd * 0.7 + uHorizonCol * 0.25 + uSunCol * lit * 0.34) * (1. - 0.5 * green), runnel * 0.55 * (1. - cave));
  vec3 V = normalize(cameraPosition - vW); vec3 R = reflect(-V, N);
  float ndv = max(dot(N, V), 0.);
  float gl = uWetRock * (0.2 + 0.6 * streak) * (1. - green) + wet;
  col += uSunCol * pow(max(dot(R, L), 0.0), 22.) * gl * 0.5 * smoothstep(-0.1, 0.2, dot(Ng, L)) * (1. - cave) * ao;
  float fres = (1. - ndv) * (1. - ndv);
  col += uSkyCol * fres * 0.3 * wet * (1. - ndv) + base * uSkyCol * fres * 0.6 * uWetRock * (0.15 + 0.85 * streak) * (1. - green) * (1. - cave) * wall * ao;   // wet sheen in shade: the rock's own colour, strongest on the runs
  col += vec3(0.5, 0.82, 0.72) * 0.42 * lipRim * (0.6 + 0.4 * pit);
  // the cave's inside; far off it is a recessed shadow in the wall's own shade, never a black spot
  col = mix(col, mix(caveCol, base * amb * 0.55 + uShadeCol * 0.02, cfar2) * ao, cave);
  gl_FragColor = vec4(clamp(col, vec3(0.), uSunCol * 1.1 + 0.3), 1.);
  #include <fog_fragment>
}`;
const LEAF_VERT = /* glsl */`
attribute vec3 aSw; uniform float uTime; uniform vec3 uSunDir;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec2 vRoof;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  p.x += sin(uTime * 1.1 + aSw.y) * 0.35 * aSw.x; p.z += cos(uTime * 0.9 + aSw.y * 1.7) * 0.3 * aSw.x; p.y += sin(uTime * 1.7 + aSw.y * 0.6) * 0.12 * aSw.x;
  vCol = color; vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = mat3(modelMatrix) * normal;
  // how far toward the sun this point sits on its own summit (-1 the lee side .. 1 the sunward side)
  vec2 sx = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  vRoof = vec2(aSw.z, clamp(dot(w.xz - modelMatrix[3].xz, sx) / 55., -1., 1.));
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LEAF_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uShadeCol; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec2 vRoof;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); vec3 L = normalize(uSunDir);
  float mott = vnoise(vW.xz * 0.9 + vW.y * 0.7) * vnoise(vW.xz * 2.3 - vW.y);
  float gap = 0., tone = 1.;
  if (vRoof.x > 0.5) {
    // the roof between the modelled crowns: a mosaic of rounded heads (nearest-cell bump), dark in the gaps between them
    vec2 q = vW.xz / 7.5 + vec2(sin(uTime * 0.7 + vW.z * 0.05), cos(uTime * 0.6 + vW.x * 0.05)) * 0.02;
    vec2 qi = floor(q), qf = fract(q), best = vec2(0.); float bd = 9., bh = 0.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), hsh = h22(qi + o), d = o + 0.15 + 0.7 * hsh - qf; float dd = dot(d, d);
      if (dd < bd) { bd = dd; best = d; bh = hsh.x; } }
    float rr = sqrt(bd);
    N = normalize(N - vec3(best.x, 0., best.y) * 1.9 * smoothstep(0.05, 0.6, rr));
    gap = smoothstep(0.42, 0.7, rr); tone = 0.65 + 0.7 * bh;
  }
  float ndl = dot(N, L);
  vec3 vc = clamp(vCol, 0., 1.);                                          // (never past its ends on a sliver, see the rock)
  vec3 base = vc * (0.55 + 1.6 * mott) * tone * (1. - 0.6 * gap);
  float side = smoothstep(-0.9, 0.7, vRoof.y);
  float lit = smoothstep(-0.2, 0.55, ndl) * mix(0.42, 1.1, side);
  vec3 fresh = vec3(0.26, 0.31, 0.04);
  vec3 shd = mix(uShadeCol, vec3(dot(uShadeCol, vec3(0.3333))), 0.5);
  vec3 col = base * (uSunCol * lit * 0.85 + shd * 1.2 + uSkyCol * 0.6 * max(N.y, 0.)) + fresh * uSunCol * 0.2 * lit * lit * (0.35 + mott * 2.2) * tone * (1. - gap);
  // a floor so a crown in shade is dark green, never black: leaf colour under the sky's own brightness, fuller on top
  float skyL = dot(uSkyCol + shd, vec3(0.3333));
  col += vc * (0.45 + 1.5 * mott) * tone * (1. - 0.5 * gap) * skyL * (1.9 + 1.3 * N.y);
  // and a thin gold rim where a crown's edge is turned to the sun
  vec3 V = normalize(cameraPosition - vW);
  float edge = 1. - abs(dot(N, V)); edge *= edge * edge;
  col += uSunCol * vec3(0.3, 0.27, 0.06) * edge * smoothstep(-0.05, 0.6, ndl) * (0.35 + 1.3 * mott) * (1. - gap) * mix(0.5, 0.12, step(0.5, vRoof.x));
  gl_FragColor = vec4(clamp(col, vec3(0.), uSunCol * 0.8 + 0.3), 1.);
  #include <fog_fragment>
}`;
const SLOP_VERT = /* glsl */`
attribute float aOn; varying vec2 vUv; varying float vOn;
#include <fog_pars_vertex>
void main(){ vUv = uv; vOn = aOn; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SLOP_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uFoamCol, uDeepCol;
varying vec2 vUv; varying float vOn;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float u = vUv.x, v = vUv.y;
  float surge = sin(uTime * 0.7 + u * 0.08) * 0.5 + 0.5;
  float n = fbm3(vec2(u * 0.33, v * 3.2 - uTime * 0.22 - surge * 0.5)) * 0.7 + vnoise(vec2(u * 1.3 + uTime * 0.1, v * 7. - uTime * 0.4)) * 0.4;
  float foam = smoothstep(mix(0.22, 0.85, v), mix(0.45, 1.0, v), n) * (1. - smoothstep(0.75, 1., v));
  foam = max(foam, (1. - smoothstep(0.02, 0.12 + 0.1 * surge, abs(v - 0.2))) * (0.5 + 0.5 * n));
  float dark = (1. - smoothstep(0.1, 0.55, v)) * 0.55;
  float a = max(foam, dark * (1. - foam)) * vOn;
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uDeepCol * 0.3, uFoamCol * (0.7 + 0.3 * n), foam), a);
  #include <fog_fragment>
}`;

// Light and palette uniforms shared by the aircraft and every tower: pass hero.uniforms as opts.uniforms to buildTower.
function makeBayUniforms(pal) {
  return {
    uSunDir: { value: V3(-0.84, 0.375, 0.39).normalize() },
    uSunCol: { value: new THREE.Color('#FFD9A0').multiplyScalar(2.4) },
    uSkyCol: { value: new THREE.Color('#6E97A8') },
    uHorizonCol: { value: new THREE.Color('#E8C89A') },
    uShadeCol: { value: new THREE.Color('#2C5560') },
    uWaterCol: { value: new THREE.Color().setRGB(...pal[0]) },
    uSprayCol: { value: new THREE.Color('#FFCF8A') },
    uTime: { value: 0 },
  };
}

// One set of three materials serves any number of towers (per-tower data lives in vertex attributes).
export function makeTowerMaterials(opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const U = opts.uniforms || makeBayUniforms(pal);
  const fog = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const rockU = (hole) => ({ ...fog(), uHorizonCol: U.uHorizonCol, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uShadeCol: U.uShadeCol, uWaterCol: U.uWaterCol, uTime: U.uTime,
    uRockCol: { value: new THREE.Color().setRGB(...pal[2]) }, uRustCol: { value: new THREE.Color('#7c4526') }, uBumpK: { value: 1 }, uLeafCol: { value: new THREE.Color().setRGB(...pal[3]) },
    uWetRock: { value: opts.wet !== undefined ? opts.wet : 1 }, uHole: { value: hole || new THREE.Vector4(0, 1, 1, 0) } });
  const makeRock = (hole) => new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true, side: THREE.DoubleSide, uniforms: rockU(hole) });
  const rock = makeRock(null);
  const canopy = new THREE.ShaderMaterial({ vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide,
    uniforms: { ...fog(), uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uShadeCol: U.uShadeCol, uTime: U.uTime } });
  const slop = new THREE.ShaderMaterial({ vertexShader: SLOP_VERT, fragmentShader: SLOP_FRAG, fog: true, transparent: true, depthWrite: false,
    uniforms: { ...fog(), uTime: U.uTime, uFoamCol: { value: new THREE.Color('#e9dcc0') }, uDeepCol: { value: new THREE.Color().setRGB(...pal[1]) } } });
  return { rock, canopy, slop, makeRock, uniforms: U, pal };
}

// the 20 faces of a unit icosahedron as 60 loose vertices (worked out here: no geometry object is made at import time)
const ICO = (() => { const t = (1 + Math.sqrt(5)) / 2, l = Math.hypot(1, t), a = 1 / l, b = t / l;
  const v = [-a, b, 0, a, b, 0, -a, -b, 0, a, -b, 0, 0, -a, b, 0, a, b, 0, -a, -b, 0, a, -b, b, 0, -a, b, 0, a, -b, 0, -a, -b, 0, a];
  const f = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  const o = []; for (const i of f) o.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); return o; })();

// A true tower-karst block: sheer fluted walls, flat shoulders, overhangs with stalactite curtains, cave mouths,
// a tidal notch with foam, a jungle cap. opts.pierced adds the sea tunnel in the +Z face (the exit).
export async function buildTower(ctx, opts = {}) {
  const rng = (opts.rng || ctx.rng).fork('tower'), noise = ctx.noise, detail = (ctx.quality && ctx.quality.detail) || 1;
  const M = opts.materials || makeTowerMaterials(opts);
  const H = opts.height || 160, W = opts.width || 120, D = opts.depth || W * rng.range(0.62, 0.95), pierced = !!opts.pierced;
  const A = opts.segments || Math.min(140, Math.max(48, Math.round((W + D) * 1.6 / 6.5 / 2) * 2)), ROWS = opts.rows || 30;
  const ox = rng.range(-50, 50), oy = rng.range(-50, 50), TAU = Math.PI * 2;
  const angd = (a, b) => { let d = Math.abs(a - b) % TAU; return d > Math.PI ? TAU - d : d; };
  const sector = (th, c, span) => 1 - sstep(span * 0.5 - 0.3, span * 0.5, angd(th, c));
  // ---- features (all random draws here, before any yield)
  const shoulders = [], hangs = [], caves = [];
  const nSh = opts.shoulders !== undefined ? opts.shoulders : rng.int(1, 2);
  for (let i = 0; i < nSh; i++) shoulders.push({ th: rng.range(0, TAU), span: rng.range(1.1, 2.3), t: rng.range(0.45, 0.8), cut: rng.range(0.16, 0.3) });
  const nHg = rng.int(2, 3);
  for (let i = 0; i < nHg; i++) hangs.push({ th: pierced && i === 0 ? rng.range(-0.3, 0.3) : rng.range(0, TAU), span: rng.range(0.9, 1.9), t: pierced && i === 0 ? rng.range(0.3, 0.38) : rng.range(0.14, 0.5), bulge: rng.range(3, 5.5) });
  const nCv = rng.int(3, 5);
  for (let i = 0; i < nCv; i++) caves.push({ j: Math.floor(lerp(0.12, 0.88, (i + rng.range(0.2, 0.8)) / nCv) * A), t: rng.range(0.12, 0.6), hw: rng.range(5, 9), hh: rng.range(7, 14) });
  if (pierced) for (const c of caves) { const fr = c.j / A; if (fr > 0.36 && fr < 0.64) c.j = Math.floor((fr < 0.5 ? 0.3 : 0.7) * A); }
  const stal = []; for (let i = 0; i < 400; i++) stal.push(rng());
  const crownR = []; const nCrown = Math.round((opts.crowns !== undefined ? opts.crowns : Math.min(520, Math.max(110, W * D / 60))) * detail); for (let i = 0; i < 2600; i++) crownR.push(rng());
  // ---- outline and rows
  const a2 = W / 2, b2 = D / 2, EX = 2.3;
  const th = [], r0 = [], uArc = [], hCol = [];
  for (let j = 0; j <= A; j++) {
    const t = Math.PI + (j / A) * TAU, s = Math.sin(t), c = Math.cos(t);
    const rE = 1 / (Math.abs(s / a2) ** EX + Math.abs(c / b2) ** EX) ** (1 / EX);
    th.push(t);
    r0.push(rE * (1 + 0.19 * noise.n2(s * 1.3 + ox, c * 1.3 + oy) + 0.09 * noise.n2(s * 3.1 + oy, c * 3.1 + ox) + 0.05 * noise.n2(s * 6.3 + ox, c * 6.3 - oy)));
    hCol.push(H * (1 - 0.1 * (0.5 + 0.5 * noise.n2(s * 0.9 + ox + 9, c * 0.9 + oy)) - 0.03 * (0.5 + 0.5 * noise.n2(s * 2.7 + oy, c * 2.7 + ox))));
  }
  r0[A] = r0[0]; hCol[A] = hCol[0];
  uArc.push(0); for (let j = 1; j <= A; j++) uArc.push(uArc[j - 1] + Math.hypot(r0[j] * Math.sin(th[j]) - r0[j - 1] * Math.sin(th[j - 1]), r0[j] * Math.cos(th[j]) - r0[j - 1] * Math.cos(th[j - 1])));
  const NY = [-4, -0.6, 0.4, 1.6, 2.7, 3.3], NOFF = [-1.5, -2.2, -3.3, -3.5, -2.6, -0.3], NAO = [0.8, 0.6, 0.42, 0.4, 0.5, 0.8];
  const ts = [0]; for (let i = 1; i <= ROWS; i++) ts.push(i / ROWS);
  for (const s of shoulders) ts.push(s.t, s.t + 0.003); for (const h of hangs) ts.push(h.t - 0.004, h.t);
  const tLip = 1 - 5.5 / H; ts.push(tLip, 1 - 2.2 / H);          // the hard shoulder: the wall stands vertical to here, then a 3 m rounded lip
  ts.sort((p, q) => p - q);
  const rows = [...NY.map((y, i) => ({ notch: i, y })), ...ts.map((t) => ({ t })), { t: 1, top: 1 }];
  const zF = r0[A / 2 | 0];                       // front face distance (theta = 0 sits at column A/2)
  const yAt = (j, t) => 4.4 + t * (hCol[j] - 4.4);
  // opts.caveAt { x, y, hw, hh }: one more cave mouth at a given place on the +Z face (tower frame; no random draw), for a
  // world that needs a cave where its story happens; a seeded cave whose field would mix with it gives way
  let forced = null;
  if (opts.caveAt) { const q = opts.caveAt, j = Math.max(1, Math.min(A - 1, Math.round(A * (0.5 + Math.atan2(q.x, zF) / TAU))));
    forced = { j, t: Math.min(0.8, Math.max(0.05, (q.y - 4.4) / (hCol[j] - 4.4))), hw: q.hw || 7, hh: q.hh || 10 }; caves.push(forced); }
  for (const c of caves) { c.u = uArc[c.j]; c.v = yAt(c.j, c.t); }
  if (forced) for (let i = caves.length - 1; i >= 0; i--) { const c = caves[i]; if (c !== forced && Math.hypot((c.u - forced.u) / 9, (c.v - forced.v) / 14) < 6.5) caves.splice(i, 1); }
  const pos = [], uv = [], rock = [], cave = [], idx = [];
  const K = A + 1, R = rows.length;
  const radius = (j, t) => {
    const lip = Math.max(0, t - tLip) / (1 - tLip);
    let r = r0[j] * (1 - 0.02 * t) - 3.2 * lip * lip;                     // sheer to the shoulder: no taper, no skirt
    r -= 4.6 * Math.max(0, 1 - Math.abs(noise.n2(uArc[j] / 26 + oy * 2, t * 0.5 + ox)) * 3.2) * (0.4 + 0.6 * sstep(0, 0.12, t));   // clefts between buttresses
    for (const s of shoulders) if (t > s.t + 0.001) r *= 1 - s.cut * sector(th[j], s.th, s.span);
    for (const h of hangs) if (t >= h.t - 0.001) r += h.bulge * sector(th[j], h.th, h.span) * Math.max(0, 1 - (t - h.t) / 0.1);
    r += 2.6 * noise.n2(uArc[j] / 16 + ox, t * 1.2 + oy) + 1.3 * noise.n2(uArc[j] / 7 + oy, t * 3 + ox);
    return r;
  };
  for (let i = 0; i < R; i++) {
    const row = rows[i];
    for (let j = 0; j <= A; j++) {
      const jj = j === A ? 0 : j, t = row.notch !== undefined ? 0 : row.t;
      let y = row.notch !== undefined ? row.y : yAt(jj, t), r = radius(jj, t) + (row.notch !== undefined ? NOFF[row.notch] : 0);
      if (row.top) { r -= 2.6; y += 0.9; }
      // caves: remember the nearest mouth (the mouth, its teeth and the throat behind it are drawn by ROCK_FRAG on the flat wall:
      // a dent in a mesh this coarse was only a soft dimple round it)
      let best = 1e9, best2 = 1e9, bc = null;
      for (const c of caves) { let du = Math.abs(uArc[jj] - c.u); du = Math.min(du, uArc[A] - du); const d = Math.hypot(du / c.hw, (y - c.v) / c.hh); if (d < best) { best2 = best; best = d; bc = c; } else if (d < best2) best2 = d; }
      let x = r * Math.sin(th[jj]), z = r * Math.cos(th[jj]);
      if (pierced && z > 0) { const w = (1 - sstep(11, 21, Math.abs(x))) * (1 - sstep(25, 38, y)); z = lerp(z, zF, w); }
      pos.push(x, y, z); uv.push(j === A ? uArc[A] : uArc[jj], y);
      // metres below the nearest ledge above (cap rim, shoulder, overhang lip)
      let rim = Math.max(0, hCol[jj] - y);
      for (const s of shoulders) if (t <= s.t + 0.001 && sector(th[jj], s.th, s.span) > 0.5) rim = Math.min(rim, Math.max(0, yAt(jj, s.t) - y));
      let ao = row.notch !== undefined ? NAO[row.notch] : 1;
      for (const h of hangs) if (t < h.t - 0.001 && sector(th[jj], h.th, h.span) > 0.4) { rim = Math.min(rim, Math.max(0, yAt(jj, h.t) - y)); if (Math.abs(t - (h.t - 0.004)) < 0.001) ao = 0.5; }
      rock.push(rim, ao, 1, best < 3.4 && best2 > best + 2.2 ? 1 : 0); cave.push(bc.u, bc.v, bc.hw, bc.hh);      // (the gate reaches a whole mesh cell past the mouth; none where two caves' fields would mix)
    }
    await ctx.yield();
  }
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < A; j++) { const a = i * K + j, b = a + 1, c = a + K, d = c + 1; idx.push(a, b, c, b, d, c); }
  await ctx.yield();
  let nv = R * K;
  // ---- stalactite curtains under every overhang lip
  let si = 0; const sr = () => stal[si++ % stal.length];
  const cone = (x, y, z, len, rad, u, rimv, ao, shell) => {
    const b = nv; for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; pos.push(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad); uv.push(u + k * 0.3, y); rock.push(rimv, ao, shell, 0); cave.push(0, -999, 1, 1); }
    pos.push(x + (sr() - 0.5) * rad, y - len, z + (sr() - 0.5) * rad); uv.push(u, y - len); rock.push(rimv + len * 0.4, ao, shell, 0); cave.push(0, -999, 1, 1);
    for (let k = 0; k < 5; k++) idx.push(b + k, b + (k + 1) % 5, b + 5);
    nv += 6;
  };
  for (const h of hangs) {
    const i1 = rows.findIndex((r) => r.t === h.t), i0 = i1 - 1;
    for (let j = 0; j < A; j++) { if (j % 8 === 7) await ctx.yield();
      if (sector(th[j], h.th, h.span) < 0.45) continue;
      const n = 2 + (sr() > 0.5 ? 1 : 0);
      for (let q = 0; q < n; q++) { const f = sr() * 0.75 + 0.2, g = sr(), a = (i0 * K + j) * 3, b = (i1 * K + j) * 3, a1 = a + 3, b1 = b + 3;
        const x = lerp(lerp(pos[a], pos[a1], g), lerp(pos[b], pos[b1], g), f), z = lerp(lerp(pos[a + 2], pos[a1 + 2], g), lerp(pos[b + 2], pos[b1 + 2], g), f), y = lerp(pos[a + 1], pos[b + 1], f) + 0.4;
        if (pierced && z > 0 && Math.abs(x) < 20 && y < 38) continue;
        cone(x, y, z, 1.5 + sr() * sr() * 9, 0.35 + sr() * 0.75, uArc[j] + g * 4, 0.5, 0.7, 1); } }
  }
  await ctx.yield();
  // ---- the sea tunnel: an arched bore narrowing to the portal seat, closed with dark rock behind it
  const anchors = { top: V3(0, H, 0), front: V3(0, 0, zF) };
  anchors.caves = caves.map((c) => { const r = radius(c.j, c.t); return { position: V3(r * Math.sin(th[c.j]), c.v, r * Math.cos(th[c.j])), halfWidth: c.hw, halfHeight: c.hh }; });     // each cave mouth's centre on the wall (tower frame)
  if (pierced) {
    const st = [[0, 9, 22], [3, 8.5, 18.5], [8, 7.6, 13.4], [14, 6.6, 11.5], [22, 4.2, 8], [24, 0.3, 4]], PN = 16, b0 = nv;
    st.forEach(([d, w, h], s) => {
      for (let k = 0; k <= PN; k++) {
        let x, y; if (k === 0) { x = -w; y = -3; } else if (k === PN) { x = w; y = -3; } else { const a = Math.PI * (1 - (k - 1) / (PN - 2)); x = Math.cos(a) * w; y = Math.sin(a) * h; }
        if (s > 0) { x += 0.9 * noise.n2(k * 0.7 + ox, d * 0.3); y += 0.9 * noise.n2(k * 0.7 + oy, d * 0.3 + 5) * (y > 1 ? 1 : 0); }
        pos.push(x, y, zF - d); uv.push(x * 1.3 + d * 2.1 + 500, y + d * 0.4); rock.push(Math.max(0, h - y) * 0.5, lerp(0.85, 0.16, sat(d / 20)), 0, 0); cave.push(0, -999, 1, 1);
      } });
    for (let s = 0; s < st.length - 1; s++) for (let k = 0; k < PN; k++) { const a = b0 + s * (PN + 1) + k, b = a + 1, c = a + PN + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    nv += st.length * (PN + 1);
    await ctx.yield();
    for (let q = 0; q < 26; q++) { const d = 0.6 + sr() * 9, a = Math.PI * (0.22 + 0.56 * sr()), f = sat(d / 8), w = lerp(9, 7.6, f), h = lerp(22, 13.4, f);
      cone(Math.cos(a) * w * 0.97, Math.sin(a) * h * 0.985 + 0.3, zF - d, 1.2 + sr() * sr() * 5.5, 0.3 + sr() * 0.5, 520 + q * 3, 0.5, lerp(0.8, 0.4, f), 0); }
    anchors.tunnelMouth = V3(0, 0, zF); anchors.tunnelSize = { width: 18, height: 22 };
    anchors.portalSeat = { position: V3(0, 0, zF - 8), normal: V3(0, 0, 1), width: 15, height: 13 };
    anchors.approach = [V3(0, 2.6, zF + 96), V3(0, 4.2, zF + 40), V3(0, 5.5, zF - 8)];
  }
  const rockGeo = new THREE.BufferGeometry();
  rockGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rockGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  await ctx.yield();
  rockGeo.setAttribute('aRock', new THREE.Float32BufferAttribute(rock, 4)); rockGeo.setAttribute('aCave', new THREE.Float32BufferAttribute(cave, 4));
  rockGeo.setIndex(idx);
  await ctx.yield();
  rockGeo.computeVertexNormals();
  await ctx.yield();
  // weld the normals across the wrap seam
  { const n = rockGeo.getAttribute('normal'); for (let i = 0; i < R; i++) { const a = i * K, b = a + A; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
  const object = new THREE.Group(); object.name = pierced ? 'pierced-tower' : 'karst-tower';
  const rockMat = pierced ? M.makeRock(new THREE.Vector4(0, 9, 22, 1)) : M.rock;
  object.add(new THREE.Mesh(rockGeo, rockMat));
  return finishTower(ctx, { object, M, rows, K, R, A, pos, th, hCol, uArc, shoulders, sector, yAt, crownR, nCrown, pierced, zF, H, W, D, anchors, noise, ox, oy, lipTrees: Math.round((opts.lipTrees || 0) * detail) });
}

async function finishTower(ctx, T) {
  const { object, M, K, R, A, pos, th, uArc, shoulders, sector, crownR, nCrown, pierced, zF, H, W, D, anchors, noise, ox, oy, rows } = T;
  const pal = M.pal, leaf = pal[3];
  const p = [], n = [], c = [], sw = [], idx = []; let nv = 0, ci = 0;
  const cr = () => crownR[ci++ % crownR.length];
  const top = (R - 1) * K, capH = 3 + 0.035 * Math.min(W, D);
  let meanY = 0; for (let j = 0; j < A; j++) meanY += pos[(top + j) * 3 + 1]; meanY /= A;
  // ---- the cap: a nearly flat, hummocked jungle roof (rise under a tenth of the width). The summit rim's own height fades
  // to the mean toward the middle so the roof never pinches to a point; crown-sized relief is painted by LEAF_FRAG (aSw.z = 1)
  const capY = (j, f) => { const x = pos[(top + j) * 3] * f, z = pos[(top + j) * 3 + 2] * f;
    return lerp(meanY, pos[(top + j) * 3 + 1], Math.pow(f, 1.5)) + capH * (1 - Math.pow(f, 2.5)) + 2.8 * noise.n2(x * 0.028 + ox, z * 0.028 + oy) + 1.3 * noise.n2(x * 0.085 + oy, z * 0.085 + ox); };
  const rings = [1.035, 1.0, 0.93, 0.83, 0.71, 0.58, 0.44, 0.3, 0.16, 0.03];
  for (let s = 0; s < rings.length; s++) { const f = rings[s];
    for (let j = 0; j <= A; j++) { const jj = j === A ? 0 : j, x = pos[(top + jj) * 3] * f, z = pos[(top + jj) * 3 + 2] * f;
      const y = s === 0 ? pos[(top + jj) * 3 + 1] - 1.1 : (s === 1 ? pos[(top + jj) * 3 + 1] + 0.7 : capY(jj, f));
      const v = 0.75 + 0.3 * noise.n2(x * 0.05 + oy, z * 0.05 + ox) + (s === 0 ? -0.3 : 0);
      p.push(x, y, z); n.push(0, 1, 0); c.push(leaf[0] * v, leaf[1] * v, leaf[2] * v); sw.push(s === 0 ? 0.5 : 0.08, j * 0.7, 1); }
    await ctx.yield(); }
  for (let s = 0; s < rings.length - 1; s++) for (let j = 0; j < A; j++) { const a = s * (A + 1) + j, b = a + 1, cc = a + A + 1, d = cc + 1; idx.push(a, b, cc, b, d, cc); }
  nv = rings.length * (A + 1);
  const domeVerts = nv, domeIdx = idx.length;
  await ctx.yield();
  // ---- crowns: rounded fig and evergreen heads, 5-11 m across, shoulder to shoulder; a third of them ring the lip
  const crown = (x, y, z, rad) => {
    const yaw = cr() * 6.283, cy = Math.cos(yaw), sy = Math.sin(yaw), tone = 0.7 + 0.7 * cr(), fresh = cr() < 0.2 ? 1 : 0, sq = 0.55 + 0.25 * cr(), ph = cr() * 6.283;
    for (let k = 0; k < ICO.length; k += 3) {
      const ix = ICO[k], iy = ICO[k + 1], iz = ICO[k + 2], rx = ix * cy - iz * sy, rz = ix * sy + iz * cy;
      p.push(x + rx * rad, y + iy * rad * sq, z + rz * rad);
      const nl = Math.hypot(rx * 0.85, iy * 0.8 + 0.45, rz * 0.85); n.push(rx * 0.85 / nl, (iy * 0.8 + 0.45) / nl, rz * 0.85 / nl);
      const v = tone * (iy < -0.2 ? 0.45 : 0.8 + 0.35 * iy);
      c.push(lerp(leaf[0] * v, 0.16 * v, fresh * 0.5), lerp(leaf[1] * v, 0.22 * v, fresh * 0.5), lerp(leaf[2] * v, 0.035 * v, fresh * 0.5));
      sw.push(Math.max(0, iy + 0.4), ph, 0);
      idx.push(nv++);
    }
  };
  for (let i = 0; i < nCrown; i++) {
    const j = Math.floor(cr() * A), lipC = cr() < 0.34, f = lipC ? 0.9 + 0.12 * cr() : Math.sqrt(cr()) * 0.9, rad = 2.6 + 3.0 * cr() * cr() + (lipC ? 0 : 0.6);
    crown(pos[(top + j) * 3] * f, capY(j, Math.min(1, f)) + rad * (lipC ? 0.05 : 0.2), pos[(top + j) * 3 + 2] * f, rad);
    if (i % 12 === 11) await ctx.yield();
  }
  for (const s of shoulders) {
    const i0 = rows.findIndex((r) => r.t === s.t), i1 = i0 + 1;
    for (let j = 0; j < A; j++) { if (sector(th[j], s.th, s.span) < 0.5) continue;
      const cnt = 1 + (cr() > 0.4 ? 1 : 0);
      for (let q = 0; q < cnt; q++) { const f = 0.1 + 0.8 * cr(), a = (i0 * K + j) * 3, b = (i1 * K + j) * 3, rad = 1.8 + 2.2 * cr();
        crown(lerp(pos[a], pos[b], f), pos[a + 1] + rad * 0.35, lerp(pos[a + 2], pos[b + 2], f), rad); }
      if (j % 6 === 5) await ctx.yield(); }
  }
  await ctx.yield();
  // ---- on the lips (T.lipTrees of them, for the towers next to the flight): pale-trunked trees leaning out over the drop,
  // fan palms and cycads. A trunk is a three-sided tapering spar that leans outward; a palm's head is a fan of drooping
  // blades, a cycad's a low rosette, a tree's a small crown. Half stand on the summit's lip, half on the shoulders' lips.
  const nLip = T.lipTrees || 0;
  if (nLip) {
    const trunkC = [0.085, 0.078, 0.062], tri3 = (a, b, c2, col, s0, s1, s2, ph) => { for (const [q, sv] of [[a, s0], [b, s1], [c2, s2]]) { p.push(q[0], q[1], q[2]); n.push(0.2, 0.9, 0.2); c.push(col[0], col[1], col[2]); sw.push(sv, ph, 0); idx.push(nv++); } };
    const shRows = shoulders.map((s) => rows.findIndex((r) => r.t === s.t));
    for (let i = 0; i < nLip; i++) {
      let j = Math.floor(cr() * A), bx, by, bz;
      const kind = cr(), ph = cr() * 6.283, sh = shoulders.length && i % 2 ? i % shoulders.length : -1;
      if (sh >= 0) { for (let k = 0; k < 12 && sector(th[j], shoulders[sh].th, shoulders[sh].span) < 0.6; k++) j = Math.floor(cr() * A); const a = (shRows[sh] * K + j) * 3; bx = pos[a]; by = pos[a + 1]; bz = pos[a + 2]; }
      else { bx = pos[(top + j) * 3]; by = pos[(top + j) * 3 + 1]; bz = pos[(top + j) * 3 + 2]; }
      const ox2 = Math.sin(th[j]), oz2 = Math.cos(th[j]), tx = oz2, tz = -ox2;                  // outward, and along the lip
      const len = kind < 0.3 ? 1.6 + cr() : 5.5 + 5 * cr(), lean = kind < 0.3 ? 0.2 : 0.45 + 0.5 * cr(), side = (cr() - 0.5) * 0.5, w = kind < 0.3 ? 0.5 : 0.3;
      bx -= ox2 * 0.8; bz -= oz2 * 0.8; by -= 0.4;
      const ex = bx + (ox2 * Math.sin(lean) + tx * side) * len, ey = by + Math.cos(lean) * len, ez = bz + (oz2 * Math.sin(lean) + tz * side) * len;
      const b0 = [bx + tx * w, by, bz + tz * w], b1 = [bx - tx * w, by, bz - tz * w], b2 = [bx + ox2 * w, by, bz + oz2 * w], e0 = [ex, ey, ez];
      tri3(b0, b1, e0, trunkC, 0, 0, 0.5, ph); tri3(b1, b2, e0, [trunkC[0] * 0.7, trunkC[1] * 0.7, trunkC[2] * 0.7], 0, 0, 0.5, ph); tri3(b2, b0, e0, trunkC, 0, 0, 0.5, ph);
      if (kind > 0.62) { crown(ex, ey + 0.6, ez, 2.2 + 1.6 * cr()); continue; }                  // a leaning evergreen
      const nB = kind < 0.3 ? 7 : 9, R = kind < 0.3 ? 2.4 : 3.3, tone = 0.8 + 0.5 * cr(), gc = [leaf[0] * 1.5 * tone + 0.012, leaf[1] * 1.7 * tone + 0.03, leaf[2] * 1.1 * tone];
      for (let b = 0; b < nB; b++) { const a = (b / nB) * 6.283 + ph, ca = Math.cos(a), sa = Math.sin(a), up = kind < 0.3 ? 0.9 : 0.45 + 0.5 * cr(), wB = R * 0.3;
        const tipx = ex + ca * R, tipy = ey + up * R * 0.5 - R * 0.35, tipz = ez + sa * R, mx = ex + ca * R * 0.55, my = ey + up * R * 0.55, mz = ez + sa * R * 0.55;
        tri3([ex, ey, ez], [mx - sa * wB, my, mz + ca * wB], [mx + sa * wB, my, mz - ca * wB], gc, 0.5, 0.9, 0.9, ph);
        tri3([mx - sa * wB, my, mz + ca * wB], [tipx, tipy, tipz], [mx + sa * wB, my, mz - ca * wB], [gc[0] * 0.75, gc[1] * 0.8, gc[2] * 0.75], 0.9, 1.4, 0.9, ph); }
      if (i % 6 === 5) await ctx.yield();
    }
  }
  await ctx.yield();
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); await ctx.yield();
  cg.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); await ctx.yield();
  cg.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); await ctx.yield();
  cg.setAttribute('aSw', new THREE.Float32BufferAttribute(sw, 3)); await ctx.yield();
  cg.setIndex(idx);
  await ctx.yield();
  // roof normals from its own faces (the crowns keep their soft sphere normals)
  { const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(p.slice(0, domeVerts * 3), 3)); dg.setIndex(idx.slice(0, domeIdx));
    await ctx.yield();
    dg.computeVertexNormals(); const dn = dg.getAttribute('normal').array, cn = cg.getAttribute('normal').array;
    for (let i = 0; i < domeVerts * 3; i += 3) { const s = dn[i + 1] < 0 ? -1 : 1; cn[i] = dn[i] * s; cn[i + 1] = dn[i + 1] * s; cn[i + 2] = dn[i + 2] * s; } dg.dispose(); }
  await ctx.yield();
  const canopy = new THREE.Mesh(cg, M.canopy); object.add(canopy);
  await ctx.yield();
  // ---- slop and foam ring in the notch
  { const sp = [], su = [], so = [], si = [];
    for (let j = 0; j <= A; j++) { const jj = j === A ? 0 : j, a = (2 * K + jj) * 3, x = pos[a], z = pos[a + 2], dx = Math.sin(th[jj]), dz = Math.cos(th[jj]);
      const on = pierced && z > 0 && Math.abs(x) < 12 ? 0 : 1;
      sp.push(x - dx * 1.6, 0.06, z - dz * 1.6, x + dx * 7, 0.06, z + dz * 7); su.push(j === A ? uArc[A] : uArc[jj], 0, j === A ? uArc[A] : uArc[jj], 1); so.push(on, on); }
    for (let j = 0; j < A; j++) { const a = j * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
    sg.setAttribute('aOn', new THREE.Float32BufferAttribute(so, 1)); sg.setIndex(si);
    const slop = new THREE.Mesh(sg, M.slop); slop.renderOrder = 1; object.add(slop); }
  await ctx.yield();
  const U = M.uniforms;
  return { object, radius: Math.max(W, D) * 0.5, height: H + capH, center: V3(0, H * 0.5, 0), anchors, materials: M, uniforms: U, ground: true, groundY: 0,
    update(dt, time) { U.uTime.value = time; }, dispose() {} };
}

// ================================================================ the swiftlets' stream (the world's own flock, on a line of four points)
// THE LINE (swiftLine) is laid in plan through four points: P0 the far end, P1, P2, P3 the mouth's end. It is three straight
// runs, P0 to P1, P1 to P2 and P2 to P3, joined at P1 and at P2 by two turns, each an arc of a circle of radius rho that
// touches both of its runs: so the heading runs on through every joint with no corner, and from the end of the second
// turn to P3 the line lies ON the straight run P2 to P3 to the last bit (a world that puts P2 on a cave mouth's outward
// axis has its stream on that axis from there in). The line is measured in metres along itself from P0; beyond either
// end it runs on straight. Its level is the stream maker's (below): the mouth's height from the head of the last run in.
// swiftLine returns null where a run is too short for its turns; else the line as plain numbers (x0, z0: P0; s1, s2, s3,
// s4: metres of line at the end of the first run, the first turn, the middle run, the second turn; len; run, the last
// run's length; the three headings d0, d1, d2; each turn's centre, the bearing of its start from that centre and its
// sense over rho (cA, aA, kA; cB, aB, kB); mx, mz where the middle run starts and jx, jz where the last one does; turn,
// both turns' angles together; tA, how much of the first run the first turn takes).
export function swiftLine(x0, z0, x1, z1, x2, z2, x3, z3, rho) {
  const l0 = Math.hypot(x1 - x0, z1 - z0), l1 = Math.hypot(x2 - x1, z2 - z1), l2 = Math.hypot(x3 - x2, z3 - z2);
  if (l1 < 1e-9 || l2 < 1e-9) return null;
  const d1x = (x2 - x1) / l1, d1z = (z2 - z1) / l1, d2x = (x3 - x2) / l2, d2z = (z3 - z2) / l2, d0x = l0 < 1e-9 ? d1x : (x1 - x0) / l0, d0z = l0 < 1e-9 ? d1z : (z1 - z0) / l0;
  const cA = d0x * d1z - d0z * d1x, cB = d1x * d2z - d1z * d2x, fA = Math.atan2(Math.abs(cA), d0x * d1x + d0z * d1z), fB = Math.atan2(Math.abs(cB), d1x * d2x + d1z * d2z);
  const tA = rho * Math.tan(fA / 2), tB = rho * Math.tan(fB / 2), gA = cA < 0 ? -1 : 1, gB = cB < 0 ? -1 : 1;
  const r0 = l0 - tA, r1 = l1 - tA - tB, r2 = l2 - tB;
  if (!(r0 > -1e-9) || !(r1 > -1e-9) || !(r2 > -1e-9) || fA > 3.1 || fB > 3.1) return null;
  const ax = x1 - d0x * tA, az = z1 - d0z * tA, cAx = ax - d0z * gA * rho, cAz = az + d0x * gA * rho, mx = x1 + d1x * tA, mz = z1 + d1z * tA;      // the first turn: from (ax, az), about (cAx, cAz), to (mx, mz)
  const bx = x2 - d1x * tB, bz = z2 - d1z * tB, cBx = bx - d1z * gB * rho, cBz = bz + d1x * gB * rho, jx = x2 + d2x * tB, jz = z2 + d2z * tB;      // the second: from (bx, bz), about (cBx, cBz), to (jx, jz)
  const s1 = Math.max(0, r0), s2 = s1 + rho * fA, s3 = s2 + Math.max(0, r1), s4 = s3 + rho * fB;
  return { x0, z0, x1, z1, x2, z2, x3, z3, rho, s1, s2, s3, s4, len: s4 + r2, run: r2, d0x, d0z, d1x, d1z, d2x, d2z, cAx, cAz, aA: Math.atan2(az - cAz, ax - cAx), kA: gA / rho, cBx, cBz, aB: Math.atan2(bz - cBz, bx - cBx), kB: gB / rho, mx, mz, jx, jz, turn: fA + fB, tA };
}
// the line's place in plan at s metres from its far end: o[0], o[1] = x, z and o[2], o[3] = its heading there (SWIFT_VERT's own lines)
export function swiftAt(L, s, o) {
  if (s < L.s1) { o[0] = L.x0 + L.d0x * s; o[1] = L.z0 + L.d0z * s; o[2] = L.d0x; o[3] = L.d0z; }
  else if (s < L.s2) { const a = L.aA + L.kA * (s - L.s1), c = Math.cos(a), n = Math.sin(a), g = L.kA < 0 ? -1 : 1; o[0] = L.cAx + c * L.rho; o[1] = L.cAz + n * L.rho; o[2] = -n * g; o[3] = c * g; }
  else if (s < L.s3) { o[0] = L.mx + L.d1x * (s - L.s2); o[1] = L.mz + L.d1z * (s - L.s2); o[2] = L.d1x; o[3] = L.d1z; }
  else if (s < L.s4) { const a = L.aB + L.kB * (s - L.s3), c = Math.cos(a), n = Math.sin(a), g = L.kB < 0 ? -1 : 1; o[0] = L.cBx + c * L.rho; o[1] = L.cBz + n * L.rho; o[2] = -n * g; o[3] = c * g; }
  else { o[0] = L.jx + L.d2x * (s - L.s4); o[1] = L.jz + L.d2z * (s - L.s4); o[2] = L.d2x; o[3] = L.d2z; }
  return o;
}
// THE FLOCK's draws, the same and in the same order as the world's own bird maker makes them for any of its flocks: four
// numbers a bird (its place in the loop, two phases, its pace and size) and its offset from the line: across, up, along,
// each a bell of the spread given; every `stray`-th bird flies 3.2 times as wide across and up. `reach` is the flock's own
// greatest offset as drawn: across (either side), up, down and along the line (either way); `spread` the spreads it was
// drawn with. A world that measures anything by the flock (a margin, the lip of a mouth) draws THE WHOLE FLOCK here and
// gives buildSwiftlets the count to show: the measures are then the same whatever share of the birds is shown.
// swiftWob: how far a bird's wobble carries it from its place across and up (SWIFT_VERT's own two amplitudes, metres).
export const swiftWob = [0.6, 0.5];
export function swiftFlock(n, o, br) {
  const A = [], O = [];
  for (let i = 0; i < n; i++) { const k = o.stray && i % o.stray === 0 ? 3.2 : 1;
    A.push(br(), br(), br(), br()); O.push(br.gauss() * o.spread[0] * k, br.gauss() * o.spread[1] * k, br.gauss() * o.spread[2]); }
  const aA = new Float32Array(A), aOff = new Float32Array(O), reach = { across: 0, up: 0, down: 0, along: 0 };
  for (let i = 0; i < aOff.length; i += 3) { reach.across = Math.max(reach.across, Math.abs(aOff[i])); reach.up = Math.max(reach.up, aOff[i + 1]); reach.down = Math.max(reach.down, -aOff[i + 1]); reach.along = Math.max(reach.along, Math.abs(aOff[i + 2])); }
  return { n, aA, aOff, reach, spread: o.spread };
}
// THE MOUTH AS THE WALL CARRIES IT, seen along its axis. A cave mouth is painted on the wall by ROCK_FRAG (no hollow in the
// mesh), and a wall is seldom flat: so the opening a stream on the axis can fly into is read from the tower's own faces.
// Every rock face of `tower` is walked in points half a metre apart, each as (across the axis, over the mouth's height,
// out along the axis) from `end`, the point the axis is drawn through; a point is PAINTED MOUTH where ROCK_FRAG's own arch
// holds there (its craw under 1 with the gate open: the lines below are that shader's, without the rim's ragged noise and
// the teeth), else it is rock. `arch` measures a place across the axis in the arch's own shape: 1 on the arch of half width
// hw and half height hh (its floor hh / 1.9 under the middle, as painted). Rock is IN THE WAY where it stands inside the
// flock's own unfunnelled reach of the axis (reach: across, up, down), no farther than `far` along it, and no painted mouth
// stands more than a metre in front of it over the same metre across and up (rock behind the painting is behind the
// birds' way in: the tower's far side, the inside of a fold). Of the rock in the way:
//   lip   how far out along the axis the outermost of it stands (the lip of the mouth's surroundings: on a flat wall about
//         nothing, before a mouth that lies back in a hollow the hollow's depth); -Infinity where there is none;
//   free  the least `arch` of it: the largest arch of the mouth's own shape about the axis that holds no rock (1 where the
//         axis goes through the middle of a mouth painted on a flat wall; Infinity where there is none).
// And of the rock BEHIND ALL THE PAINTING (not in the way, and deeper in than back, the deepest point of the painted mouth in
// reach), inside that free arch: deep, how far in along the axis from `end` the nearest of it stands (where a bird that went
// in at the mouth would come out of the tower again; Infinity where there is none within `far`).
export const swiftArch = (x, y, hw, hh) => Math.hypot(x / hw, (y < 0 ? 1.9 : 1) * y / hh);
export async function swiftMouth(ctx, tower, cave, end, nx, nz, reach, far) {
  const o = tower.object, g = o.children[0].geometry, pa = g.getAttribute('position').array, uv = g.getAttribute('uv').array, cv = g.getAttribute('aCave').array, rk = g.getAttribute('aRock').array, ix = g.index.array;
  o.updateMatrixWorld(true);
  const e = o.matrixWorld.elements, hw = cave.halfWidth, hh = cave.halfHeight, P = [0, 0, 0, 0, 0, 0, 0, 0, 0], sm = (w) => sstep(0.6, 0.95, w);
  let lip = -Infinity, free = Infinity, deep = Infinity, back = Infinity, w = 0; const R = [], front = new Map();      // (R: every rock point as out, arch, its cell; front: the painting's outermost place over each cell, a metre across and up)
  for (let k = 0; k < ix.length; k += 3) {
    if ((w += 1) >= 2048) { w = 0; await ctx.yield(); }      // (the engine rests after 2,048 faces passed by, or 32 walked)
    for (let c = 0; c < 3; c++) { const i = ix[k + c] * 3, x = pa[i], y = pa[i + 1], z = pa[i + 2], wx = e[0] * x + e[4] * y + e[8] * z + e[12] - end.x, wy = e[1] * x + e[5] * y + e[9] * z + e[13] - end.y, wz = e[2] * x + e[6] * y + e[10] * z + e[14] - end.z;
      P[c * 3] = wx * nz - wz * nx; P[c * 3 + 1] = wy; P[c * 3 + 2] = wx * nx + wz * nz; }
    if (Math.min(P[0], P[3], P[6]) > reach.across || Math.max(P[0], P[3], P[6]) < -reach.across || Math.min(P[1], P[4], P[7]) > reach.up || Math.max(P[1], P[4], P[7]) < -reach.down || Math.min(P[2], P[5], P[8]) > far || Math.max(P[2], P[5], P[8]) < -far) continue;
    const i0 = ix[k], i1 = ix[k + 1], i2 = ix[k + 2], n = Math.max(1, Math.ceil(2 * Math.max(Math.hypot(P[3] - P[0], P[4] - P[1], P[5] - P[2]), Math.hypot(P[6] - P[0], P[7] - P[1], P[8] - P[2]), Math.hypot(P[6] - P[3], P[7] - P[4], P[8] - P[5]))));
    for (let a = 0; a <= n; a++) for (let b = 0; b <= n - a; b++) { const w1 = a / n, w2 = b / n, w0 = 1 - w1 - w2, x = w0 * P[0] + w1 * P[3] + w2 * P[6], y = w0 * P[1] + w1 * P[4] + w2 * P[7], out = w0 * P[2] + w1 * P[5] + w2 * P[8];
      if (Math.abs(x) > reach.across || y > reach.up || y < -reach.down || Math.abs(out) > far) continue;
      const cu = w0 * cv[i0 * 4] + w1 * cv[i1 * 4] + w2 * cv[i2 * 4], cy = w0 * cv[i0 * 4 + 1] + w1 * cv[i1 * 4 + 1] + w2 * cv[i2 * 4 + 1], cw = Math.max(1, w0 * cv[i0 * 4 + 2] + w1 * cv[i1 * 4 + 2] + w2 * cv[i2 * 4 + 2]), ch = Math.max(1, w0 * cv[i0 * 4 + 3] + w1 * cv[i1 * 4 + 3] + w2 * cv[i2 * 4 + 3]);
      const qx = (w0 * uv[i0 * 2] + w1 * uv[i1 * 2] + w2 * uv[i2 * 2] - cu) / cw, qy = (w0 * uv[i0 * 2 + 1] + w1 * uv[i1 * 2 + 1] + w2 * uv[i2 * 2 + 1] - cy) / ch;      // ROCK_FRAG: cq, craw, cgate
      const key = (Math.floor(x) + 512) * 1024 + Math.floor(y) + 512;
      if (Math.hypot(qx, qy < 0 ? qy * 1.9 : qy) < 1 && sm(w0 * rk[i0 * 4 + 3] + w1 * rk[i1 * 4 + 3] + w2 * rk[i2 * 4 + 3]) > 0.5) { const f = front.get(key); if (f === undefined || out > f) front.set(key, out); if (out < back) back = out; continue; }      // painted mouth
      R.push(out, swiftArch(x, y, hw, hh), key); }
    w += 63;
  }
  const way = (i) => { const f = front.get(R[i + 2]); return f === undefined || R[i] > f - 1; };
  for (let i = 0; i < R.length; i += 3) if (way(i)) { if (R[i] > lip) lip = R[i]; if (R[i + 1] < free) free = R[i + 1]; }
  for (let i = 0; i < R.length; i += 3) if (R[i] < back && !way(i) && R[i + 1] < free && -R[i] < deep) deep = -R[i];
  return { lip, free, deep, back: -back, hw, hh };
}
// THE BIRDS (buildSwiftlets): the world's own bird and flight, on that line. SWIFT_VERT is the world's BIRD_VERT with its
// loop on, line for line, but for where a bird stands: the flight's clock t (the bird's own place in the loop, its own
// pace) carries a place along the line evenly in the line's own measure, which here is metres; the bird stands its offset
// along (aOff.z) farther along the line itself, heading as the line heads there; its offsets across and up are laid about
// the line as before, and over the last run THE FUNNEL draws them in. Its size, wingbeat, wobble, fade and colours are
// that maker's lines (makeBirds and BIRD_VERT, in the world file). dir -1 flies the line from the mouth's end to the far end (they pour out).
//   The line's level: the mouth's height (y) from the head of the last run in; a far end `lift` over that comes to it by
// the smooth step's own curve over the whole of the line before the last run (level at the far end and at the head of the
// last run: the level runs on with no break).
//   THE FUNNEL: from the head of the last run (funnel.head metres from the mouth's end) in to the lip (funnel.lip), eased
// by the smooth step, each bird's offset across and up is drawn toward the line by one law for every bird: measured in the
// arch's own shape (swiftArch) as q, it becomes q / (1 + (q / lim)^4)^(1/4), which leaves the body of the stream all but
// as it is and brings the widest straggler inside lim. lim is the free arch swiftMouth found (funnel.free), less the
// depth of the painted rim's raggedness (an eighth of the arch's radius: ROCK_FRAG's 0.16 and 0.09 of noise about their
// means) and less the birds' own wobble across (0.6 m) and up (0.5 m): so a bird crosses the wall inside the painted arch.
// (The painted teeth under the brow are not allowed for.) THE FLOCK IS NEVER DRAWN IN TIGHTER THAN ITS OWN SPREAD across
// (lim is no less than the flock's spread across over the arch's half width, nor than its spread up over the arch's
// height): where the free arch is smaller than that, rock or a stalactite of the tower's own curtains stands inside the
// stream's own body in front of the painting; nothing that flies the axis passes clear of it, and a flock drawn tighter
// than its spread would be a thread and no flock.
// And a bird that has gone in is drawn no farther past the mouth's end than the rock is deep there (funnel.deep, less the
// bird's own length; never short of funnel.back, the deepest of the painting): it is inside the rock from the painted wall
// to there, and would come out of the tower's far side.
//   THE TUCK (o.tuck; none where it is not given): over one stretch of the line, from tuck.from to tuck.to metres of line
// from the far end, every bird's offset across and up is drawn toward the line by the funnel's own law, measured against
// tuck.across and tuck.up: no bird then stands farther from the line than tuck.across across it or tuck.up over or under
// it, wobble apart; the drawing in is eased on by the smooth step over tuck.ease metres before the stretch and off over as
// many after it. (A world lays the stretch where something flies that the flock at its full width would reach.)
//   THE BENDS (o.bend): in a turn a bird on the inside flies an arc of its own about the turn's centre, the turn's radius
// less its offset across; one that stood as wide as the radius would turn on the spot, and one wider would fly its arc
// backward. So on the inside of each turn, and there only, a bird's offset across is held under bend.lim by the funnel's
// own law (x / (1 + (x / lim)^4)^(1/4): the body all but as it is), eased on over bend.ease metres of the straight run
// before the turn and off over as many after it: every bird's own arc is then wider than the radius less bend.lim and the
// wobble, and every bird flies forward through the turn. The outside of a turn is left as it is.
const SWIFT_VERT = /* glsl */`
attribute vec4 aA; attribute vec3 aOff;
uniform float uTime; uniform float uRate; uniform float uSize; uniform float uFar; uniform float uNear; uniform float uDir; uniform float uIn;
uniform vec4 uLnA; uniform vec4 uLnB; uniform vec4 uLnC; uniform vec4 uLnD; uniform vec4 uLnE; uniform vec4 uS; uniform vec4 uLev; uniform vec4 uFun;
uniform vec3 uTk; uniform vec2 uTkL; uniform vec2 uBend;
varying float vShade; varying float vFade;
#include <fog_pars_vertex>
void main(){
  float t = fract(aA.x + uTime*uRate*(0.8 + 0.4*aA.w));
  float len = uLnE.w, rho = uLnE.z;
  float sl = (uDir > 0. ? t : 1. - t)*len + uDir*aOff.z;                      // the bird's own place: metres of line from the far end
  vec2 pl; vec2 tg;
  if (sl < uS.x) { tg = uLnA.xy; pl = uLev.xy + tg*sl; }                      // the first run
  else if (sl < uS.y) { float a = uLnB.z + uLnB.w*(sl - uS.x); vec2 e = vec2(cos(a), sin(a)); pl = uLnB.xy + e*rho; tg = vec2(-e.y, e.x)*sign(uLnB.w); }      // the first turn
  else if (sl < uS.z) { tg = uLnA.zw; pl = uLnD.xy + tg*(sl - uS.y); }        // the middle run
  else if (sl < uS.w) { float a = uLnC.z + uLnC.w*(sl - uS.z); vec2 e = vec2(cos(a), sin(a)); pl = uLnC.xy + e*rho; tg = vec2(-e.y, e.x)*sign(uLnC.w); }      // the second turn
  else { tg = uLnE.xy; pl = uLnD.zw + tg*(sl - uS.w); }                       // the last run, and on past the mouth's end
  float lv = clamp(sl/uS.w, 0., 1.);
  vec3 c = vec3(pl.x, uLev.z + uLev.w*(1. - lv*lv*(3. - 2.*lv)), pl.y);
  vec3 f = normalize(vec3(tg.x, -uLev.w*6.*lv*(1. - lv)/uS.w, tg.y))*uDir;
  vec3 s = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-3, 0., 0.));
  vec3 u = cross(s, f);
  vec2 q = vec2(aOff.x, aOff.y*(aOff.y < 0. ? 1.9 : 1.))/uFun.zw;             // the funnel
  float q2 = dot(q, q);
  float fun = mix(1., inversesqrt(sqrt(1. + q2*q2)), 1. - smoothstep(uFun.x, uFun.y, len - sl));
  vec2 off = aOff.xy;
  vec2 qt = off/uTkL; float qt2 = dot(qt, qt);                                // the tuck
  off *= mix(1., inversesqrt(sqrt(1. + qt2*qt2)), smoothstep(uTk.x - uTk.z, uTk.x, sl)*(1. - smoothstep(uTk.y, uTk.y + uTk.z, sl)));
  float qa = max(0., off.x*sign(uLnB.w)*uDir)/uBend.x; qa *= qa;              // the inside of the first turn
  off.x *= mix(1., inversesqrt(sqrt(1. + qa*qa)), smoothstep(uS.x - uBend.y, uS.x, sl)*(1. - smoothstep(uS.y, uS.y + uBend.y, sl)));
  float qb = max(0., off.x*sign(uLnC.w)*uDir)/uBend.x; qb *= qb;              // the inside of the second
  off.x *= mix(1., inversesqrt(sqrt(1. + qb*qb)), smoothstep(uS.z - uBend.y, uS.z, sl)*(1. - smoothstep(uS.w, uS.w + uBend.y, sl)));
  c += (s*off.x + u*off.y) * fun;
  c += s*sin(uTime*1.3 + aA.y*40.)*${swiftWob[0].toFixed(1)} + u*sin(uTime*1.7 + aA.z*40.)*${swiftWob[1].toFixed(1)};
  float flap = sin(uTime*(9. + 6.*aA.w) + aA.y*60.);
  float sc = uSize * (0.75 + 0.5*aA.z);
  sc *= smoothstep(0., 0.04, t) * (1. - smoothstep(0.96, 1., t));
  sc *= step(sl, uIn);                                                        // (inside the rock, as deep as the tower is there: drawn no farther)
  float dEye = length(c - cameraPosition);
  sc *= mix(uNear, 1., smoothstep(6., 55., dEye));
  vFade = 1. - smoothstep(uFar*0.4, uFar, dEye);                             // a flock thins out with distance: birds near the eye, never pepper on a far wall
  float wx = abs(position.x);
  vec3 p = c + (s*position.x*(1. - 0.25*wx*abs(flap)) + f*position.z + u*(wx*0.45 + wx*wx*0.5)*flap) * sc;
  vShade = 0.55 + 0.45*flap*wx + 0.25*step(wx, 0.14);
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SWIFT_FRAG = /* glsl */`
uniform vec3 uCol; uniform vec3 uRim;
varying float vShade; varying float vFade;
#include <fog_pars_fragment>
void main(){
  if (vFade < 0.02) discard;
  gl_FragColor = vec4(uCol*vShade + uRim*max(vShade - 0.7, 0.), vFade);
  #include <fog_fragment>
}`;
// o: base (the bird's own geometry, the world's), flock (swiftFlock), count (how many of the flock's birds are shown, the
// first of them as drawn: all where it is not given), line (swiftLine, in the world's own metres), y (the mouth's height),
// lift, dir, rate, size, near, far, col, rim, time (the world's shared clock uniform), funnel { lip, head, free, deep,
// back, hw, hh }, tuck { from, to, ease, across, up } or nothing, bend { lim, ease } or nothing. Returns the mesh (one
// instanced draw; not yet in any scene); mesh.userData.swift holds what it flies.
export function buildSwiftlets(o) {
  const L = o.line, F = o.funnel, T = o.tuck, B = o.bend, n = Math.min(o.flock.n, o.count === undefined ? o.flock.n : o.count), lim = Math.max(o.flock.spread[0] / F.hw, o.flock.spread[1] / F.hh, Math.min(1e3, F.free) * 0.875 - swiftArch(swiftWob[0], -swiftWob[1], F.hw, F.hh)), lip = Math.max(0, F.lip), head = Math.max(lip + 1e-3, F.head), cut = F.deep < 1e6 ? L.len + Math.max(F.deep - o.size, F.back > -1e6 ? F.back : -1e6) : 1e9;
  const g = new THREE.InstancedBufferGeometry(); g.index = o.base.index; g.setAttribute('position', o.base.getAttribute('position'));
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(o.flock.aA.subarray(0, n * 4), 4)); g.setAttribute('aOff', new THREE.InstancedBufferAttribute(o.flock.aOff.subarray(0, n * 3), 3)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ vertexShader: SWIFT_VERT, fragmentShader: SWIFT_FRAG, fog: true, side: THREE.DoubleSide, transparent: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: o.time, uFar: { value: o.far }, uNear: { value: o.near }, uRate: { value: o.rate }, uSize: { value: o.size }, uDir: { value: o.dir < 0 ? -1 : 1 }, uIn: { value: cut }, uCol: { value: o.col }, uRim: { value: o.rim },
      uLnA: { value: new THREE.Vector4(L.d0x, L.d0z, L.d1x, L.d1z) }, uLnB: { value: new THREE.Vector4(L.cAx, L.cAz, L.aA, L.kA) }, uLnC: { value: new THREE.Vector4(L.cBx, L.cBz, L.aB, L.kB) }, uLnD: { value: new THREE.Vector4(L.mx, L.mz, L.jx, L.jz) }, uLnE: { value: new THREE.Vector4(L.d2x, L.d2z, L.rho, L.len) },
      uS: { value: new THREE.Vector4(L.s1, L.s2, L.s3, L.s4) }, uLev: { value: new THREE.Vector4(L.x0, L.z0, o.y, o.lift || 0) }, uFun: { value: new THREE.Vector4(lip, head, F.hw * lim, F.hh * lim) },
      uTk: { value: new THREE.Vector3(T ? T.from : 1e6, T ? T.to : 1e6, T ? T.ease : 1) }, uTkL: { value: new THREE.Vector2(T ? T.across : 1, T ? T.up : 1) }, uBend: { value: new THREE.Vector2(B ? B.lim : 1e6, B ? B.ease : 1) } } });      // (no tuck: its stretch lies a thousand kilometres past the line; no bend: a limit no bird reaches)
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  m.userData.swift = { points: [new THREE.Vector3(L.x0, o.y + (o.lift || 0), L.z0), new THREE.Vector3(L.x1, o.y, L.z1), new THREE.Vector3(L.x2, o.y, L.z2), new THREE.Vector3(L.x3, o.y, L.z3)], line: L, y: o.y, lift: o.lift || 0, dir: o.dir < 0 ? -1 : 1, lip, head, lim, cut, hw: F.hw, hh: F.hh, tuck: T || null, bend: B || null };
  return m;
}
