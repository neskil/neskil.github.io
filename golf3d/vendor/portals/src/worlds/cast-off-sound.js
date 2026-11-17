// CAST OFF: a northern sound that is knitted, not built. Hand knitting in chunky wool: one yarn, eight shades,
// every surface stitches (garter sea, stocking hill, k2-p2 cliff, a cable for running water, moss turf, a Fair Isle
// band round the island like the yoke of a jumper, and the sky itself the inside of a yoke knitted in the round: a
// cream hem at the horizon, a band of madder diamonds, deep indigo overhead). No lights, no fog, no full-screen pass:
// every material is an unlit ShaderMaterial built from the hero's wool routine; post.flat = 1, so the wool colour
// written is the colour on screen.
//
// The story (changed in the polish round): the piece is FINISHED and its last row is being cast off. The garter Sound
// is whole to the horizon. On the Needles the row of live loops shrinks as each is passed over and laid into the
// cast-off chain along the top of the headland; the one working strand runs taut to the hill-sized yarn ball, which
// turns as it pays out; the exit is the last stitch, in red, held on a horn cable-needle.
//
// Layout (world metres; +Z is the course; the brief's map is used literally, so on screen the island lies to
// starboard): entry (0,3,0) on the garter Sound, the ribbed West Banks at z 150-400, the cable burn (a true
// three-strand plait lying to starboard of the keel) climbing a gorge to the saddle (-168,101,548) where it goes
// under the hill, the crest, then down a knitted spur of the north arm to the exit stitch at (56,58,694), with
// the Needles (src/parts/cast-off-sound.js) at (240,0,790).
// The hill has one stitch lattice (LATT_GLSL): the land shader knits it everywhere (stocking slopes, moss tops, rib on
// the shoulders, a garter hem at the shore), and a window of real yarn Vs and purl bumps follows the eye on the same
// lattice (heights from a small half-float texture of the land grid); the low end of the Banks has its own real stitches.
// NEAREST THE EYE the yarn is in its round gauge (FAT_GLSL, fatVGeometry): within about 13 m of a point ahead of the bow on land every stitch is two fat
// round strands of plied yarn meeting in a V (or a purl bump lying across), the ground between them only the deeper lot;
// on the Sound, round the bow, each garter ridge is two interlocked rows of fat strands (arched bumps and the loops of the
// next row) with the knit Vs lying in the trough behind, and every fifth ridge is the cream one.
// The wool has hair: tufts (TUFT_*: cards drawn as separate splayed hairs, counted in pixels, never longer than about
// 24 px, gone when seen end-on) on that window, on the convex outlines of the hill, the cliff top and the far cable.
// The yoal is built here round the camera (ride: 'none'); the eye rides at its BOW, so only the prow is in the frame
// (mast and sail are behind the eye). Variations by seed: colourway (indigo / grey-green / winter: sea, sky and band
// change), band set (sheep / ponies / gannets), weather (gale / breeze / mohair), hour (afternoon / golden).
// Rare event: the dropped stitch and the horn crochet hook.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, PALETTE, STYLE, woolMaterial, fabricMaterial, yarnTubeGeometry, yarnMaterial, fuzzGeometry, fuzzMaterial, woodMaterial } from '../parts/cast-off-sound.js';

const BLACK = '#2A2522', HORN = '#D9C7A0', HORN_DARK = '#9C8358';
const EXPOSURE = 1, DURATION = 42;
const HERO_POS = new THREE.Vector3(240, 0, 790);
const ROW_SPEED = 10;                     // m/s the garter rows travel shoreward
const SEA_ST = 1.5;                       // stitch width and row height on the sea (a ridge is two rows: 3 m)

// the island: a hook. Spine points [x, z, crest height, half width]; the shore is where r = d/w reaches RS.
const SPINE = [[-150, 120, 40, 150], [-165, 300, 118, 205], [-185, 450, 128, 215], [-168, 548, 96, 190], [-175, 645, 97, 170], [-80, 690, 84, 115], [20, 715, 62, 95], [120, 735, 30, 70]];
const RS = 0.62;
function spineAt(x, z, out) {
  let best = 1e9, bh = 0, bw = 1;
  for (let i = 0; i < SPINE.length - 1; i++) {
    const a = SPINE[i], b = SPINE[i + 1], ex = b[0] - a[0], ez = b[1] - a[1];
    const t = clamp(((x - a[0])*ex + (z - a[1])*ez)/(ex*ex + ez*ez), 0, 1), dx = x - a[0] - ex*t, dz = z - a[1] - ez*t, d = dx*dx + dz*dz;
    if (d < best) { best = d; bh = a[2] + (b[2] - a[2])*t; bw = a[3] + (b[3] - a[3])*t; }
  }
  out.r = Math.sqrt(best)/bw; out.h = bh; return out;
}
// the yoke: between raw heights 36 and 64 the hillside is terraced, so the band at y 44..56 stands as a riser
function terrace(h) {
  if (h <= 36 || h >= 64) return h;
  if (h < 48) return 36 + 8*smoothstep(36, 48, h);
  if (h < 52) return 44 + 12*(h - 48)/4;
  return 56 + 8*smoothstep(52, 64, h);
}

// The Sound's wool, at any distance. Rows finer than a few pixels are gathered into bands of 3, 9, 27... ridges (a
// coarser gauge drawn at the same size), alternately a darker and a lighter lot, every ninth band the cream one, and
// every band edge is its row of purl bumps (never a ruled line). st = (column, row) in stitches; pill = bump relief.
const GARTER_GLSL = /* glsl */`
  vec3 gBand(float ridge, float n, float L, float odd, vec3 dp, vec3 lt, vec3 fm, vec3 avg){
    float g = floor(ridge/n), m9 = mod(g + 1., L < 0.5 ? 5. : 9.), h = hash11(g*1.37 + L*7.31);      // near the eye every fifth ridge is the cream one
    vec3 c = L < 0.5 ? (h < 0.15 ? lt : (h > 0.9 ? mix(dp, lt, 0.4) : (mod(g, 2.) < 0.5 ? dp*0.9 : mix(dp, lt, 0.26)))) : (mod(g, 2.) < 0.5 ? dp*0.92 : mix(dp, lt, h > 0.8 ? 0.85 : 0.45));
    if (m9 < 0.5) c = mix(dp, fm, L < 0.5 ? odd : 0.72);
    return mix(c, avg, min(0.1*L, 0.3));
  }
  vec3 garterCol(vec2 st, float fwx, float fwy, vec3 dp, vec3 lt, vec3 fm, out float pill){
    vec3 avg = dp*0.76 + lt*0.21 + fm*0.03;
    float graze = smoothstep(3., 12., fwy/max(fwx, 1e-4));            // seen along the water the rows crowd: gather them sooner, into bands 3 to 9 px tall
    float lod = clamp(log2(max(fwy*mix(1.3, 4.4, graze), 1.))/1.585, 0., 5.99), L0 = floor(lod), n0 = pow(3., L0), fr = lod - L0;
    float lw = log2(max(9.*fwx, 1.)), w0 = exp2(floor(lw));
    float bx = mix(abs(sin(3.14159265*st.x/w0)), abs(sin(1.5707963*st.x/w0)), smoothstep(0.3, 1., fract(lw)));
    float sy = st.y + (bx - 0.5)*max(mix(0.9, 1.3, graze)*n0, min(3.*fwy, 1.6*n0));
    float row = floor(sy), ridge = floor(row*0.5), odd = step(0.5, mod(row, 2.));
    vec3 c = mix(gBand(ridge, n0, L0, odd, dp, lt, fm, avg), gBand(ridge, n0*3., L0 + 1., odd, dp, lt, fm, avg), smoothstep(0.45, 1., fr));
    float flatS = smoothstep(0.16, 0.36, max(fwx, fwy));
    pill = (1. - bx*sin(3.14159265*fract(sy/(2.*n0))))*flatS*(1. - smoothstep(0.5, 1., fr))*(1. - smoothstep(4.5, 5.5, lod));
    return mix(c, avg, smoothstep(5., 5.9, lod));
  }`;
// THE WOOL'S HAIR. Every outline wears tufts: a card that stands off the yarn, leans leeward with the gusts and is drawn
// as separate hairs. The hairs are counted in pixels (never closer than about 2.5 px, never thinner than 1.4 px) and a
// tuft never stands under uMinPx pixels tall, so a far cliff top keeps its fringe and a near one is hairs, not a veil.
// A tuft source is GLSL defining  void tuft(out vec3 root, out vec3 d, out vec3 col, out vec2 cr, out float seed, out float aMul)
// (root and d = hair vector in world space, cr = (signed half width in metres, 0 root .. 1 tip)).
const TUFT_MAIN = /* glsl */`
  uniform float uPx, uMinPx, uGrowMax, uMaxPx; uniform vec2 uNearFade, uFarFade; varying vec3 vC; varying vec4 vT; varying float vD;
  void main(){
    vec3 root, d, col; vec2 cr; float seed, aMul;
    tuft(root, d, col, cr, seed, aMul);
    float len = max(length(d), 1e-4); vec3 toCam = cameraPosition - root; float dist = max(length(toCam), 1e-3);
    float grow = clamp(dist*uPx*uMinPx/(len*uFuzz), 1., uGrowMax);
    float g = gust(root + seed*40.);
    vec3 nh = d/len, lee = uWind - nh*min(dot(uWind, nh), 0.);               // the gale lays a hair over along its yarn, never into it
    vec3 tip = (d + lee*len*(0.3 + 0.6*g)*uGale)*uFuzz*grow; tip += nh*sin(uTime*7. + seed*40.)*0.1*len*grow;
    float tl = max(length(tip), 1e-4); tip *= min(1., dist*uPx*uMaxPx/tl); tl = max(length(tip), 1e-4);      // no hair is longer than about 24 px: near the eye a tuft is short hairs, never streamers
    aMul *= 1. - smoothstep(0.35, 0.8, abs(dot(tip, toCam))/(tl*dist));      // seen end-on a tuft thins to nothing instead of filling in
    vec3 side = cross(tip, toCam); side = side/max(length(side), 1e-4);
    float w = min(max(abs(cr.x)*2., dist*uPx*22.), dist*uPx*44.);      // a card is always wide enough for six hairs or more
    vec3 wp = root + tip*cr.y + side*(cr.x < 0. ? -0.5 : 0.5)*w*(1. + 0.7*cr.y);
    vC = col; vD = dist; vT = vec4(step(0., cr.x), cr.y, seed, aMul*smoothstep(uNearFade.x, uNearFade.y, dist)*(1. - smoothstep(uFarFade.x, uFarFade.y, dist)));
    gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
  }`;
const TUFT_FRAG = /* glsl */`
  uniform float uHairs, uAlpha, uHairW; varying vec3 vC; varying vec4 vT; varying float vD;
  void main(){
    float v = vT.y, fu = max(fwidth(vT.x), 1e-4), fv = max(fwidth(vT.y), 1e-4);
    float N = clamp(floor((uHairW < 0.5 ? 0.3 : 0.23)/fu), 1., uHairs), px = fu*N;                // hairs at least 4 px apart (3 for fine hair); px = one pixel, in hair spacings
    float spread = 0.22 + 0.78*v, x = N*0.5 + (vT.x*N - N*0.5)/spread, k0 = floor(x), hw = uHairW*px, sd = floor(vT.z*64.)*7.;      // the hairs of a tuft part from one root
    float a = 0., kb = 0., tall = min(px/fv, 9.);                          // tall: the card's height in hair spacings
    for (int j = -2; j <= 2; j++) {                                        // each hair: its own root, its own lean, its own length, and a curve that is a share of that length (a short hair bends as a long one does)
      float k = k0 + float(j), id = k + sd;
      float h1 = hash11(id*1.31 + 3.), h2 = hash11(id*2.17 + 11.), h3 = hash11(id*0.73 + 29.);
      float lenK = 0.3 + 0.7*hash11(id*3.3 + 7.), vn = clamp(v/lenK, 0., 1.), splay = clamp((k + 0.5 - N*0.5)/max(N*0.5, 1.), -1., 1.);
      float bend = (h3 < 0.5 ? -1. : 1.)*(0.2 + 0.5*abs(h3 - 0.5)) + 0.25*splay;
      float c = k + 0.5 + (h1 - 0.5)*1.2 + ((h2 - 0.5)*0.5*vn + bend*vn*vn)*lenK*tall/spread;
      float hair = (1. - smoothstep(hw, hw + px, abs(x - c)*spread))*(1. - smoothstep(lenK*0.8, lenK, v))*step(-0.5, k)*step(k, N - 0.5)*step(0.14, hash11(id*5.9 + 41.));
      if (hair > a) { a = hair; kb = id; }
    }
    a *= (1. - 0.4*v)*uAlpha*vT.w*(1. - smoothstep(0.3, 0.6, fv))*step(4.5, N);      // five hairs or none: never a lone bar or a pair
    if (a < 0.02) discard;
    // two lots of fibre in every tuft: the pale halo (it shows against wool and sea) and the wool's own deeper lot (it shows against the pale sky); pale at the tip
    vec3 c = hash11(kb*2.3 + 17.) < 0.38 ? mix(vC*0.5, vC*0.8, v) : mix(vC, uCream, 0.25 + 0.45*v);
    c = mix(c, uCream, uPale.x*(1. - exp(-vD/max(uPale.y, 1.))));
    gl_FragColor = vec4(toScene(c), a);
  }`;
const TUFT_LAND = /* glsl */`
  attribute vec3 aDir, aCol; attribute vec4 aCorner;
  void tuft(out vec3 root, out vec3 d, out vec3 col, out vec2 cr, out float seed, out float aMul){
    root = position; d = aDir; col = aCol; cr = aCorner.xy; seed = aCorner.z;
    vec3 tc = cameraPosition - root; aMul = (1. - 0.7*smoothstep(0.15, 0.55, abs(dot(aDir, tc))/max(length(aDir)*length(tc), 1e-3)))*(1. - 0.4*smoothstep(60., 220., length(tc))); }`;
const TUFT_STATIC = /* glsl */`
  attribute vec3 aDir, aCol; attribute vec4 aCorner;
  void tuft(out vec3 root, out vec3 d, out vec3 col, out vec2 cr, out float seed, out float aMul){
    root = (modelMatrix*vec4(position, 1.)).xyz; d = mat3(modelMatrix)*aDir; col = aCol; cr = aCorner.xy; seed = aCorner.z; aMul = 1.; }`;
function tuftMaterial(source, pxU, { near = [0, 0.001], far = [1e5, 2e5], minPx = 4.5, grow = 4, hairW = 0.8, maxPx = 24, hairs = 9, alpha = 0.8, uniforms = {} } = {}) {
  return woolMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: source + TUFT_MAIN, fragmentShader: TUFT_FRAG,
    uniforms: { uPx: pxU, uMinPx: { value: minPx }, uGrowMax: { value: grow }, uHairW: { value: hairW }, uMaxPx: { value: maxPx }, uNearFade: { value: new THREE.Vector2(near[0], near[1]) }, uFarFade: { value: new THREE.Vector2(far[0], far[1]) }, uHairs: { value: hairs }, uAlpha: { value: alpha }, ...uniforms } });
}

// FAT YARN AT ARM'S LENGTH. A real strand near the eye is round, plied and lies on its fabric: the plies twist round it
// (grooves in the deeper lot, about a third of the strand's width apart, curving over its back), it is light on top and
// goes to the recess lot where it turns under, and a strand too thin on screen to show any of that is its plain pigment.
// uvT = (length along the strand in diameters, 0..1 round it); up = the fabric's normal there; seed shifts the twist.
const FAT_GLSL = /* glsl */`
  vec3 fatYarn(vec3 base, vec3 N, vec3 up, vec3 V, vec2 uvT, float seed, float dist){
    float ph = uvT.y*4. + uvT.x*2.4 + seed, fw = fwidth(uvT.x)*2.4 + fwidth(uvT.y)*4.;
    float thin = smoothstep(0.08, 0.3, fwidth(uvT.y)), fine = 1. - smoothstep(0.25, 0.6, fw);
    float s = abs(sin(ph*3.14159265)), groove = (1. - smoothstep(0.0, 0.34, s))*fine;
    float nu = dot(N, up), under = 1. - smoothstep(-0.7, 0.2, nu);
    vec3 nr = mix(N, V, max(thin, 0.55)); nr = nr/max(length(nr), 1e-4);
    vec3 nd = mix(N, uSunDir, thin*0.65); nd = nd/max(length(nd), 1e-4);
    vec3 b = base*mix(1., 0.8 + 0.26*s, fine)*(1. + 0.06*clamp(nu, 0., 1.));              // each ply lighter along its own back, the deeper lot in the groove between two
    return woolShadeR(b, nd, nr, V, max(groove*0.92, under*0.95)*(1. - thin), dist);
  }`;
// one knit V of fat yarn for instancing on a lattice, in stitch units: position = (column, row, lift in metres) of the
// strand's centre line, aOff = the cross-section's offset (in the fabric's column, row and normal directions, radius 1),
// aT = (0 at the point of the V .. 1 at the leg's top, the offset across the strand), uv = (diameters along, 0..1 round).
// The point lies on the tops of the row below; the tops narrow and tuck under the next row's point.
function fatVGeometry(sides, rings, tubeR) {
  const pos = [], off = [], uv = [], tt = [], idx = [];
  for (const mir of [0, 1]) {
    const a0 = 0.5, b0 = -0.32, a1 = mir ? 0.87 : 0.13, b1 = 0.86, L = Math.hypot(a1 - a0, b1 - b0), ta = (a1 - a0)/L, tb = (b1 - b0)/L, base = pos.length/3;
    rings.forEach(([t, rf, lift], k) => {
      for (let j = 0; j <= sides; j++) {
        const an = (j/sides)*Math.PI*2, c = Math.cos(an)*rf, sn = Math.sin(an)*rf;
        pos.push(a0 + (a1 - a0)*t, b0 + (b1 - b0)*t, lift); off.push(tb*c, -ta*c, sn); tt.push(t, c); uv.push(t*L*1.5/(tubeR*2) + mir*0.37, j/sides);
        if (k < rings.length - 1 && j < sides) { const p = base + k*(sides + 1) + j, q = p + sides + 1; if (mir) idx.push(p, p + 1, q, p + 1, q + 1, q); else idx.push(p, q, p + 1, p + 1, q, q + 1); }
      }
    });
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 2)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
const FATV_NEAR = [[-0.07, 0.3, 0.24], [0, 0.82, 0.3], [0.12, 1, 0.35], [0.4, 1, 0.35], [0.68, 1, 0.3], [0.86, 0.9, 0.14], [1, 0.55, -0.1]];      // t, radius factor, lift (m)
const FATV_FAR = [[0, 0.88, 0.27], [0.28, 1, 0.35], [0.72, 1, 0.29], [1, 0.76, -0.05]];      // the middle-distance gauge: fewer rings, but as round and as blunt as the near one

// pace: hurry the run-in, linger on the crest (pure function of u, smooth, 1 over the last tenth)
function pace(u) {
  const s = smoothstep;
  return 1.45 - 0.45*s(0.22, 0.30, u) + 0.05*s(0.40, 0.46, u) - 0.5*s(0.60, 0.66, u) + 0.55*s(0.77, 0.83, u) - 0.1*s(0.86, 0.9, u);
}

// Fair Isle charts, 10 x 8, '#' = motif stitch. Two leg frames and a turned head for each walker.
const MOTIFS = {
  sheep: ['..####..##', '.########.', '##########', '##########', '.########.', '.#.#..#.#.', '.#.#..#.#.', '..........'],
  sheep2: ['..####..##', '.########.', '##########', '##########', '.########.', '..##..##..', '.#..#.#..#', '..........'],
  pony: ['.......##.', '......####', '#.######..', '.########.', '.########.', '.#.#..#.#.', '.#.#..#.#.', '..........'],
  pony2: ['.......##.', '......####', '#.######..', '.########.', '.########.', '..##..##..', '.#..#.#..#', '..........'],
  gannet: ['..........', '#........#', '.##....##.', '..######..', '...####...', '....##....', '..........', '..........'],
  gannet2: ['..........', '..........', '..##..##..', '.########.', '#..####..#', '....##....', '..........', '..........'],
};
const BORDERS = {
  waves: ['#...#...', '.#.#.#.#', '..#...#.', '........'],
  diamonds: ['...#....', '..#.#...', '.#.#.#..', '..#.#...'],
  anchors: ['..#.....', '.###....', '..#.....', '#.#.#...'],
};

export default {
  id: 'cast-off-sound',
  name: 'Cast Off',
  category: 'ocean',
  weirdness: 0.4,
  media: ['water', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------- the knitter's choices for this visit ----------
    const colourway = rng.int(0, 2), bandSet = rng.int(0, 2), weather = rng.int(0, 2);
    const golden = vary.hour === 'golden' || (vary.hour !== 'day' && rng.chance(0.25));
    const rare = !!vary.rare;
    const pal = PALETTE.slice();
    let sailHex = pal[6], sailEdge = pal[0];
    if (colourway === 1) { pal[4] = '#3F5F58'; pal[5] = '#86A294'; sailHex = '#A8532A'; }          // indigo over-dyed on fawn, rust sail
    if (colourway === 2) { pal[4] = '#5F88B6'; pal[5] = '#B4C6D6'; sailHex = BLACK; sailEdge = pal[6]; }   // winter sea, black sail edged in red
    if (golden) pal[0] = '#F2E2B8';                                                               // cream turned to butter
    const C = (h) => new THREE.Color(h);
    const cream = C(pal[0]), fawn = C(pal[1]), moorit = C(pal[2]), grey = C(pal[3]), indigo = C(pal[4]), indigo2 = C(pal[5]), red = C(pal[6]), black = C(BLACK);
    const gale = weather === 1 ? 0.55 : 1, mohair = weather === 2;
    const SU = STYLE.uniforms, pxU = { value: 0.0027 };                 // pxU: metres per pixel at one metre from the eye
    SU.uExposure.value = EXPOSURE; SU.uGale.value = gale; SU.uFuzz.value = mohair ? 3 : 1;
    SU.uPale.value.set(mohair ? 0.3 : 0.2, mohair ? 1100 : 1700);          // distance: a little paler, never beige (far things keep their colour) SU.uCream.value.copy(cream);
    SU.uCool.value.set(golden ? '#E9E2DA' : '#DCE6EE');
    const sunAz = 165*Math.PI/180, sunEl = (golden ? 12 : 26)*Math.PI/180;
    SU.uSunDir.value.set(Math.sin(sunAz)*Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz)*Math.cos(sunEl)).normalize();
    SU.uWind.value.set(0.34, 0, 0.94).normalize();
    const rowSpeed = ROW_SPEED*(weather === 1 ? 0.6 : 1);

    // ---------- the course ----------
    const path = makePath([[0, 3, 0], [0, 3, 70], [-3, 3, 160], [-12, 3, 270], [-21, 3.5, 362], [-40, 9, 400], [-72, 31, 436], [-110, 58, 477],
      [-150, 91, 520], [-168, 101, 548], [-174, 106.5, 577], [-156, 110.5, 603], [-120, 101, 612], [-61.3, 90, 639.3], [-2.7, 74, 666.7], [56, 58, 694]]);
    const _np = { r: 0, h: 0 }, _lp = new THREE.Vector3(), _lt = new THREE.Vector3();
    // the cable lies this far to starboard of the keel: in full view beside the bow on the climb, back under it over the saddle
    const cabOff = (u) => 3.5*smoothstep(0.375, 0.425, u)*(1 - smoothstep(0.69, 0.74, u));
    const CROFT_SPEC = [[0.672, 27, 5, 1.8, -0.55], [0.70, 34, 13, 2.2, -0.95]];          // u, metres to starboard, metres above the course, scale, yaw
    const CROFTS = CROFT_SPEC.map(([u, side, up]) => { const p = path.pointAt(u), t = path.tangentAt(u), sx = -t.z, sz = t.x, l = Math.hypot(sx, sz) || 1;
      return new THREE.Vector3(p.x + sx/l*side, p.y + up, p.z + sz/l*side); });
    // the doorstep: how far (x, z) lies outside house k's footprint (0 inside), and the radius at which a ray from its
    // centre at local angle th leaves the footprint grown by r
    const croftBox = (k) => { const HS = CROFT_SPEC[k][3]; return [(13 - k*1.5)*HS/2, 3.2*HS, Math.cos(CROFT_SPEC[k][4]), Math.sin(CROFT_SPEC[k][4])]; };
    const croftSd = (k, x, z) => { const [a, b, cy, sy] = croftBox(k), dx = x - CROFTS[k].x, dz = z - CROFTS[k].z;
      return Math.hypot(Math.max(Math.abs(dx*cy - dz*sy) - a, 0), Math.max(Math.abs(dx*sy + dz*cy) - b, 0)); };
    const croftRho = (k, th, r) => { const [a, b] = croftBox(k), c = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th));
      const t1 = (a + r)/Math.max(c, 1e-6), t2 = (b + r)/Math.max(sn, 1e-6);
      if (t1*sn <= b) return t1; if (t2*c <= a) return t2;
      const m = a*c + b*sn; return m + Math.sqrt(Math.max(m*m - (a*a + b*b - r*r), 0)); };
    // ground height: the hook, terraced, with the burn's gorge cut 7 m under the course
    const landRaw = (x, z) => {
      spineAt(x, z, _np);
      if (_np.r >= 1.15) return -12;
      const n = noise.fbm2(x*0.006 + 3.1, z*0.006 - 1.7, 3), r = _np.r*(1 + 0.07*noise.n2(x*0.011, z*0.011));
      let h = _np.h*(1 - r*r)*(1 + 0.12*n) + 7*n;
      h *= 0.3 + 0.7*smoothstep(25, 135, Math.hypot(x + 38, z - 402));
      h = terrace(h);
      const edge = smoothstep(RS - 0.13, RS - 0.06, r);
      return lerp(h, -12, edge);
    };
    let _underCable = 0, _spur = 0, _bank = 0, _cabE = 30;
    const land = (x, z) => {
      let h = landRaw(x, z); _underCable = 0; _spur = 0; _bank = 0; _cabE = 30;
      if (h > -4 && z > 330 && z < 760 && x > -260 && x < 110) {
        const q = path.nearestXZ(x, z); let e = q.dist;  // a groove for the cable, banks 3 m under the eye at 10 m, then a gorge
        _bank = smoothstep(0.405, 0.43, q.u)*(1 - smoothstep(0.69, 0.73, q.u))*(1 - smoothstep(lerp(14, 9, smoothstep(0.5, 0.54, q.u)), lerp(24, 17, smoothstep(0.5, 0.54, q.u)), q.dist));      // beside the keel the banks are the hill's own stitches from the mouth of the burn on (never the big rib of a cliff at arm's length)
        const co = e < 45 ? cabOff(q.u) : 0;
        if (co > 0.05) { path.pointAt(q.u, _lp); path.tangentAt(q.u, _lt); e = Math.abs(((x - _lp.x)*(-_lt.z) + (z - _lp.z)*_lt.x)/(Math.hypot(_lt.x, _lt.z) || 1) - co); }
        const lim = q.y - 7.5 - 2.5*smoothstep(7, 3, e) + Math.max(0, Math.min(e, 10) - 5.5) + Math.max(0, e - 10)*(0.26 + 0.46*smoothstep(0.44, 0.53, q.u));      // the mouth of the burn opens wide to the Sound
        if (lim < h) h = lim;
        if (e < 7.2 && q.u > 0.36 && q.u < 0.652) _underCable = 1;
        if (q.u > 0.36 && q.u < 0.652) _cabE = Math.min(e + 26*smoothstep(0.64, 0.652, q.u) - 1.6*(1 - smoothstep(0.43, 0.52, q.u)), 30);      // (past 0.652 the cable has gone under: the hill's own stitches close over it)
        // from the saddle on the keel skims a knitted spur: the hill is brought up under the course (and let go before the exit)
        const ap = smoothstep(0.645, 0.70, q.u); if (q.u > 0.655 && q.dist < 75) _spur = 1;
        if (ap > 0 && q.dist < 60) { const hm = q.y - 3.9 - 5*smoothstep(0.79, 0.86, q.u) - 9*smoothstep(0.87, 0.95, q.u) - 0.5*Math.max(0, q.dist - 4); if (hm > h) h = lerp(h, hm, ap); }
      }
      for (let k = 0; k < 2; k++) { if (Math.abs(x - CROFTS[k].x) + Math.abs(z - CROFTS[k].z) > 60) continue; const d = croftSd(k, x, z); if (d < 16) h = lerp(CROFTS[k].y, h, smoothstep(1.5, 16, d)); }
      return h;
    };
    await ctx.yield();

    // ---------- sky: the yoke of the jumper, knitted in the round ----------
    // Rows are rings of elevation: small stitches at the bright cream hem (the horizon), larger ones overhead; each decrease
    // round takes the stitch count down (288, 192, 128, 64, 32, 16 round the whole sky). From the hem up: cream, a pale
    // indigo field, a Fair Isle band of madder diamonds on cream between two madder rounds (the diamonds walk round the yoke
    // a stitch at a time), then the deep indigo yoke with lice of the lighter lot. The sun is knitted in: a disc of cream
    // stitches with a check ring where the sun patch is. The whole yoke sways a little on its pins.
    const madder = C(colourway === 1 ? sailHex : pal[6]);
    const skyU = { uPxDeg: { value: 0.14 }, uGrey: { value: grey }, uGold: { value: golden ? 1 : 0 }, uMadder: { value: madder }, uFawnS: { value: fawn },
      uUnder: { value: 1 }, uRowS: { value: rowSpeed }, uDeepS: { value: indigo }, uLightS: { value: indigo2 } };
    await ctx.yield();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), woolMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: skyU,
      vertexShader: /* glsl */`
        varying vec3 vD;
        void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*vec4(cameraPosition + position*100., 1.);
          if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
        uniform float uPxDeg, uGold, uUnder, uRowS; uniform vec3 uGrey, uDeepS, uLightS, uMadder, uFawnS; varying vec3 vD;
        ${GARTER_GLSL}
        float ringN(float r){ return r < 7.5 ? 288. : (r < 12.5 ? 192. : (r < 21.5 ? 128. : (r < 27.5 ? 64. : (r < 31.5 ? 32. : 16.)))); }
        vec3 yokeCol(float r, float c, float walk){
          if (r < 5.5) return uCream;
          if (r < 6.5) return mod(c, 4.) < 0.5 ? uLightS : uCream;
          if (r < 7.5) return mod(c + r, 2.) < 0.5 ? uLightS : uCream;
          if (r < 12.5) return uLightS;
          if (r < 13.5 || (r > 20.5 && r < 21.5)) return uMadder;
          if (r < 20.5) { float m = mod(c - walk, 8.), k = r - 14., dm = abs(m - 3.);
            bool on = (k < 0.5 || k > 5.5) ? (m > 6.5) : (dm < 2.51 - abs(k - 3.) && !(k > 2.5 && k < 3.5 && dm < 0.5));
            return on ? uMadder : uCream; }
          if (r < 22.5) return uLightS;
          if (r < 23.5) return mod(c + r, 2.) < 0.5 ? uLightS : uDeepS;
          return (mod(r, 3.) < 0.5 && mod(c + 2.*floor(r/3.), 4.) < 0.5) ? uLightS : uDeepS*(r > 27.5 ? 0.9 : 1.);
        }
        void main(){
          vec3 d = vD/max(length(vD), 1e-4);
          // Before we arrive (seen through the previous portal the engine clips everything behind the entry, sea included)
          // the sky below the horizon carries the Sound's own garter bands, so the opening shows sea and not a blank.
          vec2 sp = cameraPosition.xz + d.xz*(max(cameraPosition.y, 0.2)/max(-d.y, 0.002));
          float sy = (sp.y - uRowS*uTime)/${SEA_ST.toFixed(2)}, fwy = min(fwidth(sp.y)/${SEA_ST.toFixed(2)}, 4000.), fwxS = min(fwidth(sp.x)/${SEA_ST.toFixed(2)}, 4000.), pillS;
          vec3 seaC = garterCol(vec2(sp.x/${SEA_ST.toFixed(2)}, sy), fwxS, fwy, uDeepS, uLightS, uCream, pillS)*(0.94 - 0.16*pillS);
          seaC *= mix(1., 0.86 + 0.2*smoothstep(0.15, 0.85, abs(fract(sy*0.5) - 0.5)*2.), 1. - smoothstep(0.35, 0.9, fwy));      // the ridge and the furrow
          float el = asin(clamp(d.y, -1., 1.))*57.2958, az = atan(d.x, d.z + 1e-6)*57.2958;
          az += 0.7*sin(uTime*0.23 + el*0.05) + 0.3*sin(uTime*0.41); el += 0.35*sin(uTime*0.19 + az*0.03);
          float v = 20.*log(1. + max(el, 0.)/20.), r = floor(v), N = ringN(r), cx = (az/360. + 0.5)*N, c = floor(cx);
          float walk = floor(uTime*0.8);
          float rc = floor(v - 1.7*abs(fract(cx) - 0.5) + 0.42);                  // the colour of a stitch has the stitch's own shape: a V, point down
          vec3 base = yokeCol(rc, c, walk);
          // the sun, knitted in: stitch by stitch
          float elC = 20.*(exp((r + 0.5)/20.) - 1.)*0.0174533, azC = ((c + 0.5)/N - 0.5)*TAU;
          float sun = dot(vec3(sin(azC)*cos(elC), sin(elC), cos(azC)*cos(elC)), uSunDir);
          vec3 sunC = mix(uCream, vec3(0.97, 0.9, 0.7), 0.35 + 0.4*uGold);
          if (sun > 0.982) base = sunC; else if (sun > 0.95 && mod(c + r, 2.) < 0.5) base = sunC;
          vec4 sf = stitchField(vec2(cx, v), 0., 0.27);
          vec3 wool = mix(base, base*base*0.55 + base*0.22, clamp(sf.y, 0., 1.)*0.6)*(0.95 + 0.07*sf.x);
          wool = mix(wool, uCream, 0.1*smoothstep(0.6, 1., max(dot(d, uSunDir), 0.)));                 // the wool a little paler toward the light
          // below the horizon there is nothing knitted yet: cool bright cream
          vec3 col = mix(mix(mix(uCream, vec3(0.93), 0.35), seaC, uUnder*step(d.y, -0.002)), wool, smoothstep(-2.5 + 2.3*uUnder, 0.5 - 0.3*uUnder, el));
          gl_FragColor = vec4(toScene(col), 1.);
        }`,
    }));
    sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);
    await ctx.yield();

    // ---------- the Sound: garter stitch, whole to the horizon, rows arriving and travelling shoreward ----------
    const seaU = {
      uRowSpeed: { value: rowSpeed }, uOrigin: { value: new THREE.Vector3() }, uNearS: { value: new THREE.Vector3() }, uNearK: { value: 1 }, uPatch: { value: 0 },
      uDeep: { value: indigo }, uLight: { value: indigo2 }, uFoam: { value: cream }, uDive: { value: [new THREE.Vector4(0, 0, -9, 0), new THREE.Vector4(0, 0, -9, 0), new THREE.Vector4(0, 0, -9, 0)] },
    };
    const seaMat = (patch) => woolMaterial({
      uniforms: { ...seaU, uPatch: { value: patch } },
      vertexShader: /* glsl */`
        uniform float uRowSpeed, uPatch; uniform vec3 uOrigin; varying vec3 vW; varying float vSl;
        void main(){
          vec3 p = position; p.xz += uOrigin.xz*uPatch;
          float sy = (p.z - uRowSpeed*uTime)/${SEA_ST.toFixed(2)};
          vec2 dq = p.xz - uOrigin.xz; if (dq.y > 0.) dq.y *= 0.66;
          float fade = uPatch*(1. - smoothstep(16., 27., length(dq)));
          float amp = 0.34*fade*(0.75 + 0.25*sin(p.x*0.21 + floor(sy*0.5)*2.1));
          p.y = amp*(0.5 - 0.5*sin(3.14159265*sy)); vSl = -amp*0.5*3.14159265*cos(3.14159265*sy)/${SEA_ST.toFixed(2)};
          vW = p; gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
        }`,
      fragmentShader: /* glsl */`
        uniform float uRowSpeed, uPatch, uNearK; uniform vec3 uOrigin, uNearS, uDeep, uLight, uFoam; uniform vec4 uDive[3];
        varying vec3 vW; varying float vSl;
        ${GARTER_GLSL}
        void main(){
          vec2 q = abs(vW.xz - uOrigin.xz);
          float dzq = vW.z - uOrigin.z;
          if (uPatch < 0.5 && q.x < 27.5 && dzq > -27.5 && dzq < 42.5) discard;         // the fine patch covers this rectangle
          vec2 st = vec2(vW.x, vW.z - uRowSpeed*uTime)/${SEA_ST.toFixed(2)};
          float fwx = fwidth(vW.x)/${SEA_ST.toFixed(2)}, fwy = fwidth(vW.z)/${SEA_ST.toFixed(2)};
          float pill;
          vec3 base = garterCol(st, fwx, fwy, uDeep, uLight, uFoam, pill);
          // far out the Sound has a quiet satin sheen: there, some bands of rows are knitted in the lighter lot (stepped, band by band)
          float dS = distance(vW.xz, uOrigin.xz), shK = floor(3.*smoothstep(260., 560., dS)*(1. - smoothstep(1500., 2800., dS)) + 0.5)/3.;
          base = mix(base, mix(uLight, uFoam, 0.2), 0.34*shK*step(0.42, hash11(floor(st.y/18.)*1.7 + 2.)));
          // where a gannet went in: a purl bump of cream carried shoreward with its row
          for (int i = 0; i < 3; i++) { vec2 dv = (vW.xz - uDive[i].xy - vec2(0., uRowSpeed*uDive[i].z))/${SEA_ST.toFixed(2)};
            float rr = length(dv), age = uDive[i].z;
            if (age > 0. && age < 6. && abs(rr - age*1.2) < 0.6 + 0.2*age && mod(floor(st.y), 2.) > 0.5) base = uFoam; }
          vec3 N = normalize(vec3(0., 1., -vSl));
          vec4 sf = stitchField(st, 1., 0.21);
          vec3 dp1 = dFdx(vW), dp2 = dFdy(vW); vec2 d1 = dFdx(st), d2 = dFdy(st);
          vec3 T = dp1*d2.y - dp2*d1.y, B = dp2*d1.x - dp1*d2.x; float inv = 1./max(sqrt(max(dot(T, T), dot(B, B))), 1e-6); T *= inv; B *= inv;
          vec3 n = N*max(sf.x, 0.3) + (T*sf.z + B*sf.w)*0.9; n = n/max(length(n), 1e-4);
          vec3 V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
          vec3 nr = mix(N, V, 0.6); nr = nr/max(length(nr), 1e-4);
          vec3 c = woolShadeR(base, n, nr, V, clamp(sf.y + pill*0.5, 0., 1.), dist);
          // under the real strands round the bow the fabric is only the deeper lot between them
          float und = uPatch*uNearK*(1. - smoothstep(9., 12., distance(vW.xz, uNearS.xz)));
          if (und > 0.001) c = mix(c, mix(uDeep, uDeep*uDeep*0.55 + uDeep*0.22, 0.85), und);      // flat: the indigo two shades deeper, no light on it and no halo
          gl_FragColor = vec4(toScene(c), 1.);
        }`,
    });
    // the far sea: one coarse sheet; the near sea: a fine patch that follows the camera on the same lattice
    await ctx.yield();
    const farGeo = new THREE.PlaneGeometry(9000, 9000, 60, 60); farGeo.rotateX(-Math.PI/2); farGeo.translate(200, 0, 600);
    await ctx.yield();
    const seaFar = new THREE.Mesh(farGeo, seaMat(0)); seaFar.frustumCulled = false; scene.add(seaFar);
    await ctx.yield();
    const nearGeo = new THREE.PlaneGeometry(60, 75, 60, 150);
    await ctx.yield();
    nearGeo.rotateX(-Math.PI/2); nearGeo.translate(0, 0, 7.5);
    await ctx.yield();
    const seaNear = new THREE.Mesh(nearGeo, seaMat(1)); seaNear.frustumCulled = false; scene.add(seaNear);
    await ctx.yield();

    // ---------- the Fair Isle chart: 64 x 32 stitches, four frames (two leg frames x head forward / turned) ----------
    const walker = ['sheep', 'pony', 'gannet'][bandSet], border = BORDERS[['waves', 'diamonds', 'anchors'][bandSet]];
    await ctx.yield();
    const chartCv = document.createElement('canvas'); chartCv.width = 64; chartCv.height = 128;
    const avgCv = document.createElement('canvas'); avgCv.width = 4; avgCv.height = 128;
    {
      const g2 = chartCv.getContext('2d'), img = g2.createImageData(64, 128), hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      const K = { c: hexRGB(pal[0]), f: hexRGB(pal[1]), m: hexRGB(pal[2]), g: hexRGB(pal[3]), k: hexRGB(BLACK) };
      const put = (col, row, c) => { const o = ((127 - row)*64 + col)*4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; };
      for (let fr = 0; fr < 4; fr++) {
        const bmp = MOTIFS[walker + (fr % 2 ? '2' : '')].map((s) => s.split(''));
        if (fr >= 2 && bandSet < 2) { for (let c = 6; c < 10; c++) { bmp[0][c] = '.'; bmp[1][c] = '.'; } bmp[1][7] = bmp[1][8] = bmp[1][9] = '#'; bmp[2][7] = bmp[2][9] = '#'; bmp[2][8] = '.'; bmp[3][8] = '#'; }
        for (let row = 0; row < 32; row++) for (let col = 0; col < 64; col++) {
          let c = K.g;
          if (row < 2 || row >= 30) c = K.m;
          else if (row < 6) c = border[row - 2][col % 8] === '#' ? K.c : K.m;
          else if (row >= 26) c = border[29 - row][col % 8] === '#' ? K.c : K.m;
          else if (row === 6 || row === 25) c = K.c;
          else if (row === 7 || row === 24) c = (col % 2) ? K.k : K.f;
          else if (row >= 12 && row < 20) { const cc = col % 16, n = (col >> 4) % 2; if (cc < 10 && bmp[19 - row][cc] === '#') c = n ? K.k : K.c; }
          else if (row === 9 || row === 22) c = (col % 4 === 0) ? K.f : K.g;
          put(col, fr*32 + row, c);
        }
      }
      g2.putImageData(img, 0, 0);
      // the band seen small: flat tints, never a blur. Column 0: each row's own average; 1: rows gathered in fours; 2: the whole band
      const a2 = avgCv.getContext('2d'), im2 = a2.createImageData(4, 128), LIN = new Float32Array(256).map((_, i) => Math.pow(i/255, 2.2)), lin = (v) => LIN[v], enc = (v) => Math.round(255*Math.pow(v, 1/2.2)), seen = new Map();
      const mean = (r0, r1) => { const s = [0, 0, 0]; let n = 0; for (let r = r0; r < r1; r++) for (let c = 0; c < 64; c++, n++) { const o = (r*64 + c)*4; for (let k = 0; k < 3; k++) s[k] += lin(img.data[o + k]); } return s.map((v) => enc(v/n)); };
      for (let r = 0; r < 128; r++) { const g4 = Math.floor(r/4)*4, f0 = Math.floor(r/32)*32, once = (a, b) => { const k = a*1000 + b; if (!seen.has(k)) seen.set(k, mean(a, b)); return seen.get(k); }, rr = r % 32, m = [mean(r, r + 1), once(g4, g4 + 4), once(f0, f0 + 32), rr >= 12 && rr < 20 ? K.g : mean(r, r + 1)];      // (canvas rows; the walkers stand on chart rows 12..19, the same span turned over)
        for (let k = 0; k < 4; k++) { const o = (r*4 + k)*4; im2.data[o] = m[k][0]; im2.data[o + 1] = m[k][1]; im2.data[o + 2] = m[k][2]; im2.data[o + 3] = 255; } }
      a2.putImageData(im2, 0, 0);
    }
    const chartTex = new THREE.CanvasTexture(chartCv); chartTex.colorSpace = THREE.SRGBColorSpace; chartTex.wrapS = THREE.RepeatWrapping;
    chartTex.magFilter = chartTex.minFilter = THREE.NearestFilter; chartTex.generateMipmaps = false;
    const avgTex = new THREE.CanvasTexture(avgCv); avgTex.colorSpace = THREE.SRGBColorSpace; avgTex.magFilter = avgTex.minFilter = THREE.NearestFilter; avgTex.generateMipmaps = false;
    await ctx.yield();

    // ---------- the island: stocking-stitch hill, moss turf, ribbed steeps and the band round its yoke ----------
    const landU = { uChart: { value: chartTex }, uChartAvg: { value: avgTex }, uStep: { value: 0 }, uTurn: { value: 0 }, uFawn: { value: fawn }, uMoorit: { value: moorit }, uGrey: { value: grey }, uBlack: { value: black }, uCreamL: { value: cream }, uLandTex: { value: null }, uWinC: { value: new THREE.Vector3() }, uWinK: { value: 0 }, uWinGrow: { value: 0 }, uPxL: pxU };
    // one lattice for the whole hill, turned so its rows cross the north arm square and run along the burn's banks
    const GX0 = -430, GZ0 = 60, GS = 5, GNX = 136, GNZ = 164, LWIN_R = Math.round(28*Math.sqrt(Math.max(detail, 0.6)));      // LWIN_R: the radius of the window of real stitches
    const LATT_GLSL = /* glsl */`
      uniform sampler2D uLandTex; uniform vec3 uFawn, uMoorit, uGrey, uBlack, uCreamL;
      const vec2 LR = vec2(-0.4210, 0.9071), LC = vec2(0.9071, 0.4210);
      const float STEEP_NY = 0.62;
      float lh1(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
      float lh2(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
      float lvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
        return mix(mix(lh2(i), lh2(i + vec2(1., 0.)), f.x), mix(lh2(i + vec2(0., 1.)), lh2(i + vec2(1., 1.)), f.x), f.y); }
      float gSpur = 0.;      // set by landAt: 1 on the spur under the keel (no band is knitted there)
      // the knitted ground at world xz: x height (exactly the mesh's triangle), y turf, zw slope
      vec4 landAt(vec2 xz){
        vec2 g = (xz - vec2(${GX0}., ${GZ0}.))/${GS}., i = clamp(floor(g), vec2(0.), vec2(${GNX - 1}., ${GNZ - 1}.)), f = clamp(g - i, 0., 1.);
        ivec2 ii = ivec2(i);
        vec3 a = texelFetch(uLandTex, ii, 0).rga, b = texelFetch(uLandTex, ii + ivec2(1, 0), 0).rga, c = texelFetch(uLandTex, ii + ivec2(0, 1), 0).rga, d = texelFetch(uLandTex, ii + ivec2(1, 1), 0).rga;      // height, turf (+4 by the cable), metres from the cable's middle
        float h; vec2 gr;
        if (f.x + f.y < 1.) { gr = vec2(b.x - a.x, c.x - a.x); h = a.x + gr.x*f.x + gr.y*f.y; }
        else { gr = vec2(d.x - c.x, d.x - b.x); h = d.x - gr.x*(1. - f.x) - gr.y*(1. - f.y); }
        vec4 mk = step(2.5, vec4(a.y, b.y, c.y, d.y)), tf = vec4(a.y, b.y, c.y, d.y) - 4.*mk;      // + 8 where the cable lies
        vec4 sp = step(50., vec4(a.z, b.z, c.z, d.z)), ce = vec4(a.z, b.z, c.z, d.z) - 100.*sp;      // (+ 100 on the spur)
        gSpur = step(0.5, mix(mix(sp.x, sp.y, f.x), mix(sp.z, sp.w, f.x), f.y));
        return vec4(h, mix(mix(tf.x, tf.y, f.x), mix(tf.z, tf.w, f.x), f.y) + 8.*step(mix(mix(ce.x, ce.y, f.x), mix(ce.z, ce.w, f.x), f.y), 5.5), gr/${GS}.);      // + 8 where the cable lies
      }
      float landNy(vec2 xz){                                                  // how steep the knitted ground is there (smooth)
        vec2 g = clamp((xz - vec2(${GX0}., ${GZ0}.))/${GS}., vec2(0.), vec2(${GNX}. - 0.001, ${GNZ}. - 0.001)), i = floor(g), f = g - i; ivec2 ii = ivec2(i);
        return mix(mix(texelFetch(uLandTex, ii, 0).b, texelFetch(uLandTex, ii + ivec2(1, 0), 0).b, f.x), mix(texelFetch(uLandTex, ii + ivec2(0, 1), 0).b, texelFetch(uLandTex, ii + ivec2(1, 1), 0).b, f.x), f.y);
      }
      // one stitch of the hill: its wool and its pattern (0 stocking, 1 the garter hem, 2 rib on a shoulder, 3 moss turf). Stripes are whole
      // rows; every 64 columns a seam where the stripe sits one row off (the hand's fault)
      vec3 landCell(vec2 cell, float hc, float turf, float ny, out float pat){
        if (hc < 5.5) { pat = 1.; return uCreamL; }
        if (ny < 0.66) { pat = 2.; return mix(uGrey, uGrey*0.86, step(0.7, lh1(floor(cell.y/7.) + 3.))); }      // shoulders: k2-p2 rib in the hill's own stitches
        float r = cell.y + floor(cell.x/64.), m = mod(r, 17.);
        pat = turf > 0.5 ? 3. : 0.;                                             // moss stitch on the tops, stocking stitch on the slopes
        if (m < 2.) return uMoorit; if (m > 2.5 && m < 3.5) return uCreamL; if (m > 9.5 && m < 10.5) return uGrey;
        if (turf > 0.5) return mix(uFawn, uMoorit, (m > 5.5 && m < 8.5) || m > 13.5 ? 0.5 : 0.14);      // heathery rows on the turf
        return mix(uFawn, uFawn*0.9, step(0.6, lh1(floor(r/5.))));
      }`;
    // where the Sound ends: a sea stitch is let go as the knitted ground comes up under it (1 on open water .. 0 on the shore)
    const SHORE_GLSL = LATT_GLSL + /* glsl */`
      float shoreK(vec2 xz){ return 1. - smoothstep(-0.9, 0.05, landAt(xz).x); }`;
    const LAND_FRAG = LATT_GLSL + /* glsl */`
      uniform sampler2D uChart, uChartAvg; uniform float uStep, uTurn, uWinK, uWinGrow, uPxL; uniform vec3 uWinC; float gLatt = 0.;
      vec3 gTrueW = vec3(0.); float gBandS = 0.;            // set by a caller that hands landWool a re-scaled band (the ledge): the true world point and metres per band metre
      // colour, stitch coordinates and pattern for a point of knitted land. Returns the base colour.
      vec3 landWool(vec3 wp, vec3 N, float turf, float force, out vec2 st, out float pat, out float rec){
        float ny = max(N.y, 0.05); rec = 0.;
        bool ax = force > 0.5 || abs(N.x) > abs(N.z); float cont = ax ? wp.z : wp.x;
        vec2 sb = vec2(cont, wp.y - 44.)/0.375;
        // fq: stitches to a pixel, across the band's columns and up its rows, each measured along its own coordinate only (the
        // screen gradient of that coordinate), so a band seen at a grazing angle is not counted finer than it is
        vec2 fq = vec2(length(vec2(dFdx(cont), dFdy(cont))), length(vec2(dFdx(wp.y), dFdy(wp.y))))/0.375;
        if (force > -0.5 && wp.y > 44. && wp.y < 56. && ny < 0.86) {    // the Fair Isle band, 0.375 m stitches (not on the spur under the keel)
          st = sb; float row = floor(st.y), col = floor(st.x);
          float walk = step(11.5, row)*step(row, 19.5), sh = uStep*walk*(ax ? 1. : -1.);
          float frame = mod(uStep, 2.) + 2.*uTurn;
          // Stepped at every size, never soft. The border rows: a stitch is its own colour while it is two pixels or so; smaller
          // than that across, the row is one flat tint (its own average); smaller up the band too, rows are gathered in fours, then
          // the whole band is one tint; each switch is made stitch by stitch (a hash), so its border is stitch-stepped as well.
          // THE WALKERS are whole or not there: one decision for each motif (its sixteen columns), made from how large its
          // stitches stand on screen at the motif's own middle (no screen derivative: every pixel of a walker agrees). Under about
          // 2 px a stitch the walker is not knitted and its rows are the plain ground.
          float hs = lh2(vec2(col, row) + 0.37), hg = lh2(vec2(floor(col/6.), floor(row/4.)) + 5.1), ty = (row + 0.5 + frame*32.)/128.;
          vec3 bc = textureLod(uChart, vec2((col + 0.5 - sh)/64., ty), 0.).rgb;
          if (walk > 0.5) {
            float mc = floor((col - sh)/16.), cM = (mc*16. + 5. + sh)*0.375, sc = gBandS > 0.5 ? gBandS : 1.;
            vec3 tw = gBandS > 0.5 ? gTrueW : wp, mp = tw; float dc = (cM - cont)*sc;
            if (ax) mp.z += dc; else mp.x += dc;
            mp.y += (50. - wp.y)*sc;
            vec3 dv = mp - cameraPosition; float dm = max(length(dv), 1e-3), along = (ax ? dv.z : dv.x)/dm;
            float pxSt = 0.375*sc*sqrt(max(1. - along*along, 0.))/(dm*max(uPxL, 1e-6));       // pixels to a stitch, across the motif
            if (pxSt < 2.1 + 0.5*lh1(mc*3.7 + 1.3)) bc = fq.y > 1.7 + 0.8*hg ? textureLod(uChartAvg, vec2(0.625, ty), 0.).rgb : textureLod(uChartAvg, vec2(0.875, ty), 0.).rgb;
          }
          else if (fq.y > 1.7 + 0.8*hg) bc = textureLod(uChartAvg, vec2(0.625, ty), 0.).rgb;
          else if (fq.y > 0.5 + 0.2*hg) bc = textureLod(uChartAvg, vec2(0.375, ty), 0.).rgb;
          else if (fq.x > 0.42 + 0.2*hs) bc = textureLod(uChartAvg, vec2(0.125, ty), 0.).rgb;
          pat = 0.; return bc;
        }
        vec2 stL = vec2(dot(wp.xz, LR), dot(wp.xz, LC))/1.5, cellL = floor(stL);
        float nyS = ny;                                                // the hill decides steep or not per stitch, so the rib's border steps stitch by stitch
        if (turf < -0.5) nyS = landNy((LR*(cellL.x + 0.5) + LC*(cellL.y + 0.5))*1.5) + (lh2(cellL + 0.7) - 0.5)*0.05;
        if (turf < -0.5) {                                             // too steep for the plan lattice (a stitch would be stretched into a blade): clean k2-p2 columns, half-metre stitches, in the bank's own wool
          vec4 Lq = landAt((LR*(cellL.x + 0.5) + LC*(cellL.y + 0.5))*1.5); float nyT = 1./sqrt(1. + dot(Lq.zw, Lq.zw)) + (lh2(cellL + 0.7) - 0.5)*0.05;
          if (nyT < STEEP_NY && nyS >= 0.42 && Lq.x > 5.5 && Lq.y < 4.) {
            st = vec2(cont, wp.y)/0.5; pat = 2.; rec = step(2., mod(floor(st.x), 4.))*0.45;
            float lot = hash11(floor(st.y/9.) + 3.); vec3 wl = nyS < 0.66 ? uGrey : uFawn; return mix(wl, wl*0.88, step(0.6, lot));
          }
        }
        if (nyS < 0.42) {                                              // true steeps (gorge walls): k2-p2 rib, 2 m stitches, grey
          st = vec2(cont, wp.y)/2.; pat = 2.; rec = step(2., mod(floor(st.x), 4.))*0.3;
          float lot = hash11(floor(st.y/7.) + 3.); return mix(uGrey, uGrey*0.86, step(0.7, lot));
        }
        st = vec2(dot(wp.xz, LR), dot(wp.xz, LC))/1.5; vec2 cell = floor(st), cc = (LR*(cell.x + 0.5) + LC*(cell.y + 0.5))*1.5;
        float hc = wp.y - (N.x*(cc.x - wp.x) + N.z*(cc.y - wp.z))/ny, tf = turf;      // colours change stitch by stitch
        if (turf < -0.5) { vec4 L = landAt(cc); hc = L.x + 6.*step(1./sqrt(1. + dot(L.zw, L.zw)), 0.78); tf = L.y - 8.*step(4., L.y); }
        vec3 lc = landCell(cell, hc, tf, nyS, pat); if (pat > 1.5 && pat < 2.5) rec = step(2., mod(cell.x, 4.))*0.3;
        gLatt = 1.; return lc;
      }`;
    const lpos = new Float32Array((GNX + 1)*(GNZ + 1)*3), lturf = new Float32Array((GNX + 1)*(GNZ + 1)), lmask = new Uint8Array((GNX + 1)*(GNZ + 1)), lspur = new Float32Array((GNX + 1)*(GNZ + 1)), lbank = new Float32Array((GNX + 1)*(GNZ + 1)), lcab = new Float32Array((GNX + 1)*(GNZ + 1));
    for (let j = 0, o = 0; j <= GNZ; j++) {
      for (let i = 0; i <= GNX; i++, o++) { const x = GX0 + i*GS, z = GZ0 + j*GS; lpos[o*3] = x; lpos[o*3 + 1] = land(x, z); lpos[o*3 + 2] = z; lmask[o] = _underCable; lspur[o] = _spur; lbank[o] = _bank; lcab[o] = _cabE; }
      if (j % 4 === 3) await ctx.yield();
    }
    const lidx = [];
    for (let j = 0; j < GNZ; j++) for (let i = 0; i < GNX; i++) {
      const a = j*(GNX + 1) + i, b = a + 1, c = a + GNX + 1, d = c + 1;
      if (Math.max(lpos[a*3 + 1], lpos[b*3 + 1], lpos[c*3 + 1], lpos[d*3 + 1]) < -6) continue;
      lidx.push(a, c, b, b, c, d);
    }
    const landGeo = new THREE.BufferGeometry(); landGeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); landGeo.setIndex(lidx);
    landGeo.setAttribute('aSpur', new THREE.BufferAttribute(lspur, 1));
    await ctx.yield();
    landGeo.computeVertexNormals();
    await ctx.yield();
    { const nn = landGeo.getAttribute('normal');
      for (let o = 0; o < lturf.length; o++) { lturf[o] = smoothstep(0.86, 0.97, nn.getY(o))*(0.55 + 0.6*noise.n2(lpos[o*3]*0.013, lpos[o*3 + 2]*0.013)) + smoothstep(84, 100, lpos[o*3 + 1])*0.5; if (o % 3000 === 2999) await ctx.yield(); } }
    await ctx.yield();
    { const half = new Uint16Array(lturf.length*4), H = THREE.DataUtils.toHalfFloat, nn = landGeo.getAttribute('normal');      // height and turf, for the true stitches and the stitch colours
      // how steep, gathered over about ten metres: a shoulder is rib or it is not, as one piece (never a patchwork of the two ribs)
      let nyS = new Float32Array(lturf.length); for (let o = 0; o < nyS.length; o++) nyS[o] = nn.getY(o);
      for (let pass = 0; pass < 0; pass++) { const src = nyS; nyS = src.slice(); const W1 = GNX + 1;
        for (let j = 1; j < GNZ; j++) for (let i = 1; i < GNX; i++) { const o = j*W1 + i; nyS[o] = (src[o - W1 - 1] + src[o - W1] + src[o - W1 + 1] + src[o - 1] + src[o] + src[o + 1] + src[o + W1 - 1] + src[o + W1] + src[o + W1 + 1])/9; }
        await ctx.yield(); }
      for (let o = 0; o < lturf.length; o++) { half[o*4] = H(lpos[o*3 + 1]); half[o*4 + 1] = H(clamp(lturf[o], 0, 2) + 4*lmask[o]); half[o*4 + 2] = H(lerp(nyS[o], Math.max(nyS[o], 0.9), lbank[o])); half[o*4 + 3] = H(lcab[o] + 100*lspur[o]); if (o % 3000 === 2999) await ctx.yield(); }
      const t = new THREE.DataTexture(half, GNX + 1, GNZ + 1, THREE.RGBAFormat, THREE.HalfFloatType);
      t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; landU.uLandTex.value = t; }
    await ctx.yield();
    const landMat = woolMaterial({
      uniforms: landU,
      vertexShader: /* glsl */`
        attribute float aSpur; varying vec3 vW, vN; varying float vSp;
        void main(){ vW = position; vN = normal; vSp = aSpur; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
      fragmentShader: LAND_FRAG + /* glsl */`
        varying vec3 vW, vN; varying float vSp;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4); vec2 st; float pat, rec;
          vec3 base = landWool(vW, N, -1., -vSp, st, pat, rec);
          vec3 c = fabricShade(base, st, pat, 0.2, N, vW, rec);
          // where the real yarn stitches lie (the window round the eye) the ground under them is only the deeper lot between the strands
          vec2 cl = floor(vec2(dot(vW.xz, LR), dot(vW.xz, LC))/1.5), ccl = (LR*(cl.x + 0.5) + LC*(cl.y + 0.5))*1.5;      // (stitch by stitch, as the window's own edge is)
          float under = uWinK*gLatt*(1. - step(1.5, pat)*step(pat, 2.5)*step(36. + 6.*lh2(cl + 8.3), distance(ccl, cameraPosition.xz)))*step(distance(ccl, uWinC.xz), (${(LWIN_R - 2.5).toFixed(1)} - 9.*lh2(cl + 4.4))*uWinGrow - 0.8);
          if (under > 0.001) { vec3 V = cameraPosition - vW; float dist = length(V); c = mix(c, woolShadeR(base*(0.9 + 0.2*lvn(vW.xz*3.1)), N, N, V/max(dist, 1e-4), 1., dist)*0.92, under); }
          gl_FragColor = vec4(toScene(c), 1.);
        }`,
    });
    const landMesh = new THREE.Mesh(landGeo, landMat); scene.add(landMesh);
    await ctx.yield();

    // ---------- the West Banks: a cliff in k2-p2 ribbing, the ribs real, and one rib laddered (the dropped stitch) ----------
    const rAt = (x, z) => spineAt(x, z, _np).r*(1 + 0.07*noise.n2(x*0.011, z*0.011));
    let realNear = () => {}; const realZU = { value: 300 };
    const CLIFF_REAL = 300, CLIFF_FULL = 327.6;          // from CLIFF_REAL to the mouth of the burn the Banks' hem and the rib under the ledge band are real yarn (the yoal passes them at arm's length); from CLIFF_FULL (where the band ends) every stitch of the face is
    const CZ0 = 128, CZ1 = 404, CSTEP = 0.5, CN = Math.round((CZ1 - CZ0)/CSTEP), CROWS = 14, LADDER_Z = 286;
    const cpos = new Float32Array((CN + 1)*(CROWS + 2)*3), carc = new Float32Array((CN + 1)*(CROWS + 2)), cidx = [], cliffX = new Float32Array(CN + 1), cliffTop = new Float32Array(CN + 1);
    for (let i = 0; i <= CN; i++) {
      const z = CZ0 + i*CSTEP; let a = -150, b = 60;
      for (let k = 0; k < 13; k++) { const m = (a + b)/2; if (rAt(m, z) < RS - 0.03) a = m; else b = m; }
      cliffX[i] = a; cliffTop[i] = Math.max(Math.min(land(a - 30, z) + 0.4, 2 + 0.7*(388 - z)), -3);
      if (i % 80 === 79) await ctx.yield();
    }
    for (let i = 0, o = 0; i <= CN; i++) {
      const z = CZ0 + i*CSTEP, top = cliffTop[i], rib = smoothstep(-0.45, 0.45, Math.cos(Math.PI*2*(z/2 - 1)/4)) - 0.5;
      for (let j = 0; j <= CROWS; j++, o++) {
        const t = j/CROWS, y = -3 + (top + 3)*t, belly = 2.6*Math.sin(Math.min(1, y/30)*Math.PI*0.5) - 5*t*t + 1.6*smoothstep(8, 0, y);
        cpos[o*3] = cliffX[i] + 1.2*rib*smoothstep(-3, 4, top) + belly; cpos[o*3 + 1] = y; cpos[o*3 + 2] = z;
        carc[o] = j === 0 ? -3 : carc[o - 1] + Math.hypot(cpos[o*3] - cpos[o*3 - 3], y - cpos[o*3 - 2]);          // metres up the face: the rows are counted along the wool, not by height
        { const p = o, q = o + CROWS + 2; if (i < CN) cidx.push(p, p + 1, q, p + 1, q + 1, q); }
      }
      cpos[o*3] = cliffX[i] - 31; cpos[o*3 + 1] = top - 0.3; cpos[o*3 + 2] = z; carc[o] = top; o++;          // the cap: turf back to the hill
    }
    await ctx.yield();
    const cliffGeo = new THREE.BufferGeometry(); cliffGeo.setAttribute('position', new THREE.BufferAttribute(cpos, 3)); cliffGeo.setIndex(cidx); cliffGeo.computeVertexNormals(); cliffGeo.setAttribute('aArc', new THREE.BufferAttribute(carc, 1));
    { const ct = new Float32Array(carc.length); for (let i = 0; i <= CN; i++) for (let j = 0; j < CROWS + 2; j++) ct[i*(CROWS + 2) + j] = carc[i*(CROWS + 2) + CROWS]; cliffGeo.setAttribute('aTop', new THREE.BufferAttribute(ct, 1)); }
    await ctx.yield();
    const cliff = new THREE.Mesh(cliffGeo, woolMaterial({
      uniforms: { ...landU, uLadder: { value: LADDER_Z }, uRealZ: realZU },
      vertexShader: /* glsl */`
        attribute float aArc, aTop; varying vec3 vW, vN; varying float vArc, vTop;
        void main(){ vW = position; vN = normal; vArc = aArc; vTop = aTop; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
      fragmentShader: LAND_FRAG + /* glsl */`
        uniform float uLadder, uRealZ; varying vec3 vW, vN; varying float vArc, vTop;
        void main(){
          if (vW.z > uLadder && vW.z < uLadder + 6. && vW.y > 2. && vN.y < 0.7) discard;          // the ladder: only its rungs are left
          vec3 N = vN/max(length(vN), 1e-4); vec2 st; float pat, rec;
          bool cap = N.y > 0.7;
          // a second band, low on the Banks, in a gauge the eye can count from the yoal: 0.6 m stitches, the walkers five metres tall
          bool ledge = !cap && vArc > 9. && vArc < 28.2 && vW.z > 150. && vW.z < 327.6;
          if (ledge) { gTrueW = vW; gBandS = 1.6; }
          vec3 base = landWool(cap ? vW : (ledge ? vec3(vW.x, 44. + (vArc - 9.)*0.625, vW.z*0.625) : vec3(vW.x, vArc, vW.z)), cap ? N : vec3(1., 0., 0.), cap ? 0.8 : 0., cap ? 0. : 1., st, pat, rec);
          bool realZ = vW.z > uRealZ;                                    // (three whole garter rows where the hem is real yarn)
          float hemTop = 4.5 + (mod(floor(vW.z*0.5), 2.) < 0.5 ? 0.55 : 0.) + 0.4*sin(3.14159265*fract(vW.z*0.5));      // (a stepped row of stitch tops, never a ruled line)
          bool hem = !cap && (realZ ? vArc < hemTop : vW.y < 4. + sin(vW.z*0.8));
          if (hem) { base = uCream; pat = 1.; st = vec2(vW.z, vArc)/1.5; }      // the cast-on hem in the surf
          vec3 c = fabricShade(base, st, pat, 0.2, N, vW, rec);
          // under the real yarn of the low end the face is only the deeper lot between the strands
          if (realZ && !cap && !ledge && (hem ? (floor(st.y) + 0.9)*1.5 < min(vTop - 0.2, 7.) : (floor(st.y) > 1.5 && (floor(st.y) + 1.)*2. < (vW.z > ${CLIFF_FULL} ? vTop - 0.5 : min(vTop - 0.5, 9.))))) { if (hem && vArc >= 4.5) c = c; else c = hem ? mix(c, c*c*0.55 + c*0.22, 0.85) : mix(c, c*c*0.55 + c*0.22, 0.5)*(mod(floor(st.x), 4.) < 2. ? 1. : 0.92); }
          gl_FragColor = vec4(toScene(c), 1.);
        }`,
    }));
    scene.add(cliff);
    await ctx.yield();
    // ... and where the Banks run down low to the mouth of the burn (the last sixty metres) every stitch of the face is real
    // yarn: Vs on the knit columns of the rib, Vs and purl bumps on the cream garter hem, each lying on the stitch the
    // shader knits there, so the shoulder and the hem have a knitted outline and not a modelled one
    {
      const R1 = CROWS + 2, P = new THREE.Vector3(), Q = new THREE.Vector3(), cst = [];
      // the face at (z, arc): a point of the cliff mesh (bilinear in its own grid)
      const colAt = (i, arc, out) => { const b = i*R1; let j = 0; while (j < CROWS - 1 && carc[b + j + 1] < arc) j++;
        const t = clamp((arc - carc[b + j])/Math.max(carc[b + j + 1] - carc[b + j], 1e-4), 0, 1), o = (b + j)*3;
        return out.set(lerp(cpos[o], cpos[o + 3], t), lerp(cpos[o + 1], cpos[o + 4], t), lerp(cpos[o + 2], cpos[o + 5], t)); };
      const face = (z, arc, out) => { const g = clamp((z - CZ0)/CSTEP, 0, CN - 1e-3), i = Math.floor(g); colAt(i, arc, P); colAt(i + 1, arc, Q); return out.copy(P).lerp(Q, g - i); };
      const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), Nn = new THREE.Vector3(), T1 = new THREE.Vector3(), T2 = new THREE.Vector3();
      // one yarn from stitch coordinates a -> b (in stitches of size S), lifted off the face in the middle
      // (a round strand, six sides, lying proud of the face from end to end, each end drawn in to a blunt dome: a fat sausage of
      // wool, never a blade tapering into the cloth; it carries the face's normal for its shading)
      const END = [0.5, 0.9, 1, 1, 0.9, 0.5];
      const yarn = (S, ax, ay, bx, by, col, r, sides = 8) => {
        const pts = [], up = new THREE.Vector3();
        for (let k = 0; k <= 5; k++) { const t = k === 0 ? 0 : k === 5 ? 1 : (k - 0.5)/4, sx = lerp(ax, bx, t)*S, sy = lerp(ay, by, t)*S; face(sx, sy, A); face(sx + 0.4, sy, B); face(sx, sy + 0.4, Cc);
          T1.subVectors(B, A); T2.subVectors(Cc, A); Nn.crossVectors(T2, T1).normalize(); if (Nn.x < 0) Nn.negate(); up.add(Nn);
          pts.push(A.clone().addScaledVector(Nn, r*(0.8 + 0.4*Math.sin(Math.PI*t)))); }
        up.normalize();
        const g = yarnTubeGeometry(pts, r, sides), pa = g.getAttribute('position'), n = pa.count, ca = new Float32Array(n*3), ua = new Float32Array(n*3);
        for (let q = 0; q < n; q++) { const c = pts[Math.floor(q/(sides + 1))], f = END[Math.floor(q/(sides + 1))]; pa.setXYZ(q, c.x + (pa.getX(q) - c.x)*f, c.y + (pa.getY(q) - c.y)*f, c.z + (pa.getZ(q) - c.z)*f); }
        for (let q = 0; q < n; q++) { ca[q*3] = col.r; ca[q*3 + 1] = col.g; ca[q*3 + 2] = col.b; ua[q*3] = up.x; ua[q*3 + 1] = up.y; ua[q*3 + 2] = up.z; }
        g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); g.setAttribute('aUp', new THREE.BufferAttribute(ua, 3)); cst.push(g);
        if (cst.length >= 120) { chunks.push(mergeGeometries(cst)); for (const q of cst) q.dispose(); cst.length = 0; }      // (merged a hundred or so at a time: no one long step at the end)
      };
      const chunks = [];
      const glot = (row) => { const f = Math.sin((Math.floor(row/7) + 3)*127.1 + 3.7)*43758.5453; return (f - Math.floor(f)) > 0.7 ? grey.clone().multiplyScalar(0.86) : grey; };
      const Z0 = CLIFF_REAL, Z1 = CZ1 - 1; let made = 0;
      // (two passes: first the stretch from the old seam on, then the stretch the yoal passes at arm's length, so that this second part is the
      // tail of the mesh and is only drawn while the eye is anywhere near it: realMesh's draw range, set in update)
      let farCount = 0;
      for (const pass of [0, 1]) {
      for (let cz = Math.floor(Z0/2); cz*2 < Z1; cz++) {                      // the rib: 2 m stitches, knit on columns 0 and 1 of every four, a purl bump sunk in the groove on 2 and 3
        if (((cz + 0.5)*2 < 336) !== (pass === 1)) continue;
        const knit = ((cz % 4) + 4) % 4 < 2;
        const i = Math.round(((cz + 0.5)*2 - CZ0)/CSTEP), top = carc[i*R1 + CROWS];
        const lim = (cz + 0.5)*2 > CLIFF_FULL ? top - 0.5 : Math.min(top - 0.5, 9), sd0 = cz*2 < 352 ? 7 : 6;
        for (let ry = 2; (ry + 1)*2 < lim; ry++) { const sd = ry > 8 ? 5 : sd0;      // (high on the face the yarn is far from the eye: fewer sides)
          if (knit) { yarn(2, cz + 0.5, ry - 0.32, cz + 0.14, ry + 0.78, glot(ry), 0.56, sd); yarn(2, cz + 0.5, ry - 0.32, cz + 0.86, ry + 0.78, glot(ry), 0.56, sd); }
          else if (cz*2 < 368) yarn(2, cz + 0.0, ry + 0.55, cz + 1.0, ry + 0.55, glot(ry).clone().multiplyScalar(0.88), 0.36, 5);
          else { const gc = glot(ry).clone().multiplyScalar(0.88); yarn(2, cz + 0.05, ry + 0.3, cz + 0.95, ry + 0.3, gc, 0.43, 5); yarn(2, cz + 0.05, ry + 0.8, cz + 0.95, ry + 0.8, gc, 0.43, 5); }      // (the groove: purl bumps stacked close, no bare cloth)
          made++; if (made > 8) { made = 0; await ctx.yield(); } }
      }
      for (let cz = Math.floor(Z0/1.5); cz*1.5 < Z1; cz++) {              // the hem: 1.5 m garter, a knit row then a purl row, from the water up
        if (((cz + 0.5)*1.5 < 336) !== (pass === 1)) continue;
        const i = clamp(Math.round(((cz + 0.5)*1.5 - CZ0)/CSTEP), 0, CN), top = carc[i*R1 + CROWS];
        for (let ry = 0; ry < 3 && (ry + 0.9)*1.5 < Math.min(top - 0.2, 7); ry++) { const r = 0.41, sd = cz*1.5 < 352 ? 8 : 6;
          if (ry % 2 === 0) { yarn(1.5, cz + 0.5, ry - 0.32, cz + 0.14, ry + 0.78, cream, r, sd); yarn(1.5, cz + 0.5, ry - 0.32, cz + 0.86, ry + 0.78, cream, r, sd); }
          else yarn(1.5, cz + 0.09, ry + 0.5, cz + 0.91, ry + 0.5, cream, r*1.2, sd);      // (a purl bump: its own sausage, the deeper lot showing between it and the next)
          made++; if (made > 8) { made = 0; await ctx.yield(); } }
      }
      if (cst.length) { chunks.push(mergeGeometries(cst)); for (const q of cst) q.dispose(); cst.length = 0; }
      if (pass === 0) farCount = chunks.reduce((a, g) => a + g.index.count, 0);
      await ctx.yield();
      }
      if (chunks.length) {
        const half = Math.ceil(chunks.length/2), gA = mergeGeometries(chunks.slice(0, half)); await ctx.yield();
        const gB = chunks.length > half ? mergeGeometries(chunks.slice(half)) : null; await ctx.yield();
        const gAll = gB ? mergeGeometries([gA, gB]) : gA; for (const q of chunks) q.dispose(); if (gB) { gA.dispose(); gB.dispose(); }
        await ctx.yield();
        const allCount = gAll.index.count; realNear = (on) => gAll.setDrawRange(0, on ? allCount : farCount);
        scene.add(new THREE.Mesh(gAll, woolMaterial({
          vertexShader: /* glsl */`
            attribute vec3 color, aUp; varying vec3 vW, vN, vC, vUp; varying vec2 vUv;
            void main(){ vW = position; vN = normal; vC = color; vUp = aUp; vUv = uv; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
          fragmentShader: FAT_GLSL + /* glsl */`
            varying vec3 vW, vN, vC, vUp; varying vec2 vUv;
            void main(){
              vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
              vec3 up = vUp/max(length(vUp), 1e-4) + V*0.7; up = up/max(length(up), 1e-4);      // seen along the face a strand is light on the side it shows and deep where it goes into the cloth
              gl_FragColor = vec4(toScene(fatYarn(vC, N, up, V, vUv, 0.3, dist)), 1.);
            }`,
        }))); }
    }
    await ctx.yield();
    // behind the ladder: the wrong side of the fabric, dark; and the rungs, loose yarn with cream running down them
    const li = Math.round((LADDER_Z + 3 - CZ0)/CSTEP), ladX = cliffX[li], ladTop = cliffTop[li];
    { const bg = new THREE.PlaneGeometry(14, ladTop + 4, 1, 1); bg.rotateY(Math.PI/2); bg.translate(ladX - 5.6, (ladTop - 4)/2 + 1, LADDER_Z + 3);
      const uvA = bg.getAttribute('uv'); for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uvA.getX(i)*9, uvA.getY(i)*(ladTop + 4));
      scene.add(new THREE.Mesh(bg, fabricMaterial({ pattern: 5, stitch: [2, 2], color: '#' + moorit.clone().lerp(black, 0.55).getHexString(), side: THREE.DoubleSide }))); }
    const rungs = [], NRUNG = Math.floor((ladTop - 3)/2);
    for (let k = 0; k < NRUNG; k++) {
      const y = 3.2 + k*2, sag = rng.range(0.35, 1.0), bow = rng.range(0.4, 1.5), pts = [], t01 = y/Math.max(ladTop, 1);
      const face = 2.6*Math.sin(Math.min(1, y/30)*Math.PI*0.5) - 5*t01*t01 + 1.6*smoothstep(8, 0, y);
      for (let i = 0; i <= 12; i++) { const t = i/12, b4 = 4*t*(1 - t); pts.push(new THREE.Vector3(ladX + face + bow*b4, y - sag*b4, LADDER_Z - 0.4 + 6.8*t)); }
      const g = yarnTubeGeometry(pts, 0.36, 5), n = g.getAttribute('position').count, id = new Float32Array(n).fill(k);
      g.setAttribute('aRung', new THREE.BufferAttribute(id, 1)); rungs.push(g);
      if (k % 8 === 7) await ctx.yield();
    }
    await ctx.yield();
    const rungMesh = new THREE.Mesh(mergeGeometries(rungs), woolMaterial({
      uniforms: { uColor: { value: grey }, uFall: { value: cream }, uN: { value: NRUNG } },
      vertexShader: /* glsl */`
        attribute float aRung; varying vec3 vW, vN; varying vec2 vUv; varying float vR;
        void main(){ vec3 p = position; float mid = sin(clamp((p.z - ${LADDER_Z.toFixed(1)})/6., 0., 1.)*3.14159265);
          p.x += mid*(0.5*sin(uTime*2.3 + aRung*1.3) + 0.6*gust(p))*uGale; p.y += mid*0.2*sin(uTime*3.1 + aRung*2.1);
          vW = p; vN = normal; vUv = uv; vR = aRung; gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor, uFall; uniform float uN; varying vec3 vW, vN; varying vec2 vUv; varying float vR;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
          float ph = fract((uN - vR)*0.09 - uTime*0.55), run = smoothstep(0.0, 0.06, ph)*(1. - smoothstep(0.16, 0.34, ph));   // cream pouring rung to rung
          gl_FragColor = vec4(toScene(yarnShade(mix(uColor, uFall, run), N, V, vUv, 3., dist)), 1.);
        }`,
    }));
    scene.add(rungMesh); for (const g of rungs) g.dispose();
    await ctx.yield();

    // ---------- the burn: a three-ply cable of the sea's own indigo, worked uphill under the keel ----------
    // A true three-strand plait: strand k runs side to side as sin(phi) and over and under as sin(2 phi), so where two
    // strands cross they are a full ply apart (never through one another). Each strand is one round, matt rope of three
    // plies (lobes of its section, turning as they slide uphill: in the outline and in the shading). It lies to starboard of the
    // keel on the climb, in full view beside the bow, and comes back under the keel over the saddle.
    // At its foot the plait is let go: the three ropes come down the last twenty metres side by side and go into the Sound
    // one by one, each under its own slop of cream purl bumps (no cut end is ever above the water).
    const CAB0 = 0.40, CAB1 = 0.675, cabN = Math.round((CAB1 - CAB0)*path.length/1.0), plies = [], cabFoot = [];
    const fanSlot = [0, 1, 2].map((k) => Math.sin(0.435*path.length/84*Math.PI*2 + k*Math.PI*2/3)).map((v, k, a) => a.filter((w) => w < v).length - 1);      // the order they hold where the plait begins
    const CAB_A = 3.2, CAB_B = 1.55, PLY_R = 1.2, CSIDES = 15, cabFuzz = [];
    let cabSeed = 48271; const cabRand = () => (cabSeed = (cabSeed*16807) % 2147483647)/2147483647;
    const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    for (let ply = 0; ply < 3; ply++) {
      const pts = [], tws = [], flare = [];
      for (let i = 0; i <= cabN; i++) {
        const u = CAB0 + (CAB1 - CAB0)*i/cabN, s = u*path.length, th = s/84*Math.PI*2 + ply*Math.PI*2/3;
        path.pointAt(u, _p); path.tangentAt(u, _t); _s.crossVectors(_t, UP).normalize(); _u.crossVectors(_s, _t);
        const end = smoothstep(0, 0.055, CAB1 - u), wv = smoothstep(0.415, 0.458, u), dive = 8*Math.pow(1 - smoothstep(0.405, 0.44, u), 2);
        const off = cabOff(u), yy = -5.3, fl = 1 - smoothstep(0.43, 0.52, u);
        _p.addScaledVector(_u, yy - 7*(1 - end) - dive + wv*CAB_B*(1 + 0.3*fl)*Math.sin(2*th)).addScaledVector(_s, lerp(fanSlot[ply]*3.1, CAB_A*(1 + 0.5*fl)*Math.sin(th), wv) + off);
        if (cabFoot.length === ply && _p.y > 0.15) cabFoot.push(_p.clone());      // where this rope comes out of the water
        pts.push(_p.clone()); tws.push(s/10*Math.PI*2 + ply*2.1); flare.push(fl*wv);
        if ((i & 31) === 31) await ctx.yield();
      }
      await ctx.yield();
      const g = yarnTubeGeometry(pts, PLY_R, CSIDES), pos = g.getAttribute('position'), nor = g.getAttribute('normal'), n = pos.count, ring = CSIDES + 1;
      await ctx.yield();
      const lobe = new Float32Array(n), tan = new Float32Array(n*3), col = new Float32Array(n*3), c = [indigo, indigo2, indigo.clone().lerp(indigo2, 0.5)][ply];
      for (let v = 0; v < n; v++) {
        const i = Math.floor(v/ring), j = v % ring, a = (j/CSIDES)*Math.PI*2 - tws[i], k = PLY_R*0.12*flare[i];
        pos.setXYZ(v, pos.getX(v) + nor.getX(v)*k, pos.getY(v) + nor.getY(v)*k, pos.getZ(v) + nor.getZ(v)*k); lobe[v] = a;
        _t.subVectors(pts[Math.min(i + 1, cabN)], pts[Math.max(i - 1, 0)]).normalize(); tan[v*3] = _t.x; tan[v*3 + 1] = _t.y; tan[v*3 + 2] = _t.z;
        col[v*3] = c.r; col[v*3 + 1] = c.g; col[v*3 + 2] = c.b;
        if ((v & 1023) === 1023) await ctx.yield();
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aLobe', new THREE.BufferAttribute(lobe, 1)); g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3));
      plies.push(g);
      await ctx.yield();
      for (let i = 6; i < (cabN - 6)*2; i++) { if (cabRand() > 0.75*detail || pts[i >> 1].y < 1.5) continue;
        const j = i >> 1, tn = new THREE.Vector3().subVectors(pts[Math.min(j + 1, cabN)], pts[Math.max(j - 1, 0)]).normalize(); cabRand(); cabRand();
        cabFuzz.push({ p: pts[j].clone().addScaledVector(tn, (i & 1)*0.5), n: tn, len: 0.3 + 0.3*cabRand(), w: 0.7 + 0.6*cabRand(), color: c }); }
      await ctx.yield();
    }
    await ctx.yield();
    // FAT WOOL, as the stitches beside it are (the same rule as FAT_GLSL): every rope is round, matt and plainly plied. Four plies
    // twist round it; the groove between two is the deeper lot, each ply is lighter along its own back, takes its light as one
    // piece (from the middle of its back, so the light on a rope is steps, ply by ply, never a soft sheen) and is its own dye
    // lot, a hard step of the two indigos; where the rope turns under it goes to the recess lot. The plies slide uphill.
    const cable = new THREE.Mesh(mergeGeometries(plies), woolMaterial({
      uniforms: { uIndD: { value: indigo }, uIndL: { value: indigo2 } },
      vertexShader: /* glsl */`
        attribute vec3 color, aTan; varying vec3 vW, vN, vC, vT; varying vec2 vUv;
        void main(){
          float ph = uv.y*3. + (uv.x - uTime*1.6)*0.5 + color.b*7.;                 // three plies, real in the outline too: each a lobe of the section, turning as it slides uphill
          vec3 p = position + normal*${PLY_R.toFixed(2)}*(0.2*abs(sin(ph*3.14159265)) - 0.12);
          vW = p; vN = normal; vC = color; vUv = uv; vT = aTan; gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uIndD, uIndL; varying vec3 vW, vN, vC, vT; varying vec2 vUv;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4), T = vT/max(length(vT), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
          float x = vUv.x - uTime*1.6, seed = vC.b*7.;
          // (a long lay: a groove comes round every two diameters, so seen along the rope from the bow, foreshortened, the plies still cross it on the slant)
          float ph = vUv.y*3. + x*0.5 + seed, fw = fwidth(vUv.x)*0.5 + fwidth(vUv.y)*3., fine = 1. - smoothstep(0.25, 0.6, fw);
          float id = floor(ph), fr = ph - id, sn = abs(sin(ph*3.14159265)), p = mod(id, 3.);
          float e = (fr - 0.5)*1.5*fine, groove = (1. - smoothstep(0.0, 0.2, sn))*fine;
          vec3 Nc = N*cos(e) + cross(T, N)*sin(e) + T*(fr - 0.5)*0.3*fine; Nc = Nc/max(length(Nc), 1e-4);      // each ply has a round back of its own
          vec3 lot = p < 0.5 ? vC : (p < 1.5 ? mix(vC, uIndL, 0.85) : mix(vC, uIndD, 0.85));      // marled: each ply its own lot, a hard step of the two indigos
          // ... and each ply is four strands laid side by side along it (a groove of the deeper lot between two, each strand lighter along its
          // back and a step of its own in the lot), and each strand is fibre, seen when the rope is at arm's length: all of it runs with the lay
          float ph2 = ph*4., fw2 = fw*4., fine2 = (1. - smoothstep(0.3, 0.7, fw2))*fine;
          float s2 = abs(sin(ph2*3.14159265)), g2 = (1. - smoothstep(0.0, 0.3, s2))*fine2, hl = hash11(mod(floor(ph2), 57.)*1.7 + seed);
          float fine3 = (1. - smoothstep(0.3, 0.7, fw*12.))*fine2, s3 = abs(sin(ph*12.*3.14159265));
          vec3 base = mix(mix(vC, uIndL, 0.05), lot, fine)*mix(1., 0.9 + 0.13*sn, fine)*mix(1., (0.84 + 0.22*s2)*(0.93 + 0.14*hl), fine2)*mix(1., 0.94 + 0.09*s3, fine3);
          groove = max(groove, max(g2*0.8, (1. - smoothstep(0.0, 0.35, s3))*fine3*0.3));
          float under = 1. - smoothstep(-0.75, 0.05, N.y);
          vec3 nr = mix(N, V, 0.6); nr = nr/max(length(nr), 1e-4);                       // (no pale film at the outline: the fringe is real hairs)
          gl_FragColor = vec4(toScene(woolShadeR(base, Nc, nr, V, max(groove*0.92, under*0.9), dist)), 1.);
        }`,
    })); scene.add(cable);
    { const cf = new THREE.Mesh(fuzzGeometry(cabFuzz), tuftMaterial(/* glsl */`
      attribute vec3 aDir, aCol; attribute vec4 aCorner;                              // position = a point of the rope's centre line, aDir = its tangent x the hair's length
      void tuft(out vec3 root, out vec3 d, out vec3 col, out vec2 cr, out float seed, out float aMul){
        float len = max(length(aDir), 1e-4), h = fract(aCorner.z*7.31); vec3 T = aDir/len, tc = cameraPosition - position;
        vec3 sd = cross(T, tc); float sl = length(sd); sd = sd/max(sl, 1e-4); if (sd.y < 0.) sd = -sd;      // the rope's upper outline, as the eye sees it
        root = position + sd*${(PLY_R*0.99).toFixed(3)}; d = (sd + T*(h - 0.5)*0.8)*len; col = aCol; cr = aCorner.xy; seed = aCorner.z;
        aMul = smoothstep(0.2, 0.5, sl/max(length(tc), 1e-3));                          // (a rope seen end-on has no outline to fringe)
      }`, pxU, { near: [2.5, 6], far: [70, 120], minPx: 3, grow: 2, hairW: 0.3, maxPx: 10, hairs: 7, alpha: 0.85 })); cf.frustumCulled = false; cf.renderOrder = 3; scene.add(cf); }
    for (const g of plies) g.dispose();
    await ctx.yield();
    // the slop: where the cable comes down into the Sound, rings of cream purl bumps spread from it over the water
    const slopBumps = new THREE.Group(); scene.add(slopBumps);
    { _p.set(0, 0, 0); for (const f of cabFoot) _p.addScaledVector(f, 1/cabFoot.length); _p.y = 0.42;
      // round each rope where it goes under: a ring of real cream purl bumps lying on the water, and a looser one outside it
      const sb = [], arch = (sc) => { const a = []; for (let i = 0; i <= 5; i++) { const t = i/5; a.push(new THREE.Vector3((-0.78 + 1.56*t)*sc, (0.42*Math.sin(t*Math.PI) - 0.1)*sc, 0.16*Math.sin(t*Math.PI*2)*sc)); } return a; };
      let sd = 7193; const rnd = () => (sd = (sd*16807) % 2147483647)/2147483647;
      for (const f of cabFoot) for (const [n, rad, sc] of [[8, 1.9, 1], [9, 3.3, 0.8]]) for (let j = 0; j < n; j++) {
        const a = (j + rnd()*0.5)/n*Math.PI*2, g = yarnTubeGeometry(arch(sc*(0.85 + 0.3*rnd())), 0.3*sc, 5); g.rotateY(a + Math.PI/2 + (rnd() - 0.5)*0.5);
        g.translate(f.x + Math.cos(a)*rad*(0.9 + 0.2*rnd()), 0.16 + 0.1*rnd(), f.z + Math.sin(a)*rad*(0.9 + 0.2*rnd())); sb.push(g); }
      if (sb.length) { slopBumps.add(new THREE.Mesh(mergeGeometries(sb), yarnMaterial({ color: pal[0], plies: 2 }))); for (const g of sb) g.dispose(); }
      const sg = new THREE.PlaneGeometry(22, 22); sg.rotateX(-Math.PI/2); sg.translate(_p.x, _p.y, _p.z);
      const slop = new THREE.Mesh(sg, woolMaterial({
        uniforms: { uC: { value: _p.clone() } },
        vertexShader: /* glsl */`
          varying vec3 vW;
          void main(){ vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform vec3 uC; varying vec3 vW;
          void main(){
            vec2 q = vW.xz - uC.xz; float rad = length(q)/11., ang = atan(q.y, q.x + 1e-5);
            float ring = rad*3.4 - fract(uTime*0.3), bump = abs(fract(ring) - 0.5)*2.;      // the rings spread and are replaced from the middle
            float seg = abs(sin(ang*11.));
            float wd = (0.5 - 0.28*rad)*(0.5 + 0.5*seg);
            if (rad > 0.97 || rad < 0.3 || bump > wd) discard;
            vec3 V = cameraPosition - vW; float dist = length(V);
            float rnd = sqrt(max(1. - (bump/wd)*(bump/wd), 0.));
            gl_FragColor = vec4(toScene(woolShade(uCream, normalize(vec3(0., 1., 0.) + vec3(q.x, 0., q.y)/max(length(q), 1e-3)*(fract(ring) - 0.5)), V/max(dist, 1e-4), 1. - rnd, dist)), 1.);
          }`,
      }));
      scene.add(slop); }
    await ctx.yield();

    // ---------- the Needles (the hero), still knitting the last headland ----------
    const hero = await buildHero(ctx, { palette: pal, detail });
    hero.object.position.copy(HERO_POS); hero.object.rotation.y = hero.anchors.rotationY; scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    await ctx.yield();

    // ---------- true stitches at arm's length: the purl bumps of the garter rows round the boat (real tube) ----------
    const bumpPts = []; for (let i = 0; i <= 5; i++) { const t = i/5; bumpPts.push(new THREE.Vector3(-0.78 + 1.56*t, 0.42*Math.sin(t*Math.PI) - 0.12, 0.16*Math.sin(t*Math.PI*2))); }
    const bumpBase = yarnTubeGeometry(bumpPts, 0.3, 5), bumpGeo = new THREE.InstancedBufferGeometry();
    bumpGeo.index = bumpBase.index; for (const k of ['position', 'normal', 'uv']) bumpGeo.setAttribute(k, bumpBase.getAttribute(k));
    const ringK = { value: 1 };
    const BI = 30, BJ = Math.round(18*Math.max(detail, 0.7)), cells = new Float32Array(BI*BJ*2);
    for (let j = 0, o = 0; j < BJ; j++) for (let i = 0; i < BI; i++, o++) { cells[o*2] = i - BI/2; cells[o*2 + 1] = j - 4; }
    bumpGeo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2)); bumpGeo.instanceCount = BI*BJ;
    bumpGeo.setAttribute('aRing', new THREE.InstancedBufferAttribute(new Float32Array(BI*BJ*4).map((v, i) => (i % 4 < 2 ? 1 : 0)), 4));
    const ringPts = []; for (let i = 0; i <= 4; i++) { const t = i/4; ringPts.push(new THREE.Vector3(-0.78 + 1.56*t, 0.42*Math.sin(t*Math.PI) - 0.12, 0.16*Math.sin(t*Math.PI*2))); }
    const ringBase = yarnTubeGeometry(ringPts, 0.3, 3), ringGeo = new THREE.InstancedBufferGeometry(), ringCells = [], ringPar = [];
    ringGeo.index = ringBase.index; for (const k of ['position', 'normal', 'uv']) ringGeo.setAttribute(k, ringBase.getAttribute(k));
    for (const [G, nR, size, r1] of [[1.4, 2, 1.3, 72], [3, 3, 2.6, 165], [7, 9, 5.4, 380]]) {
      const ni = Math.ceil(r1*0.72/(1.5*G)), nj = Math.ceil(r1/(3*nR)), keep = Math.max(detail, 0.7);
      for (let j = Math.floor(r1*0.36/(3*nR)) - 1; j <= nj; j++) for (let i = -ni; i <= ni; i++) {
        const lx = Math.abs(i)*1.5*G, lz = j*3*nR; if (Math.hypot(lx, lz) > r1*1.03 || lx > 1.15*lz + 22 || (keep < 1 && ((i*7 + j*13) & 3) === 0)) continue;
        ringCells.push(i, j); ringPar.push(G, nR, size, r1); }
    }
    ringGeo.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(ringCells), 2)); ringGeo.setAttribute('aRing', new THREE.InstancedBufferAttribute(new Float32Array(ringPar), 4));
    ringGeo.instanceCount = ringCells.length/2;
    const bumpMat = (sel) => woolMaterial({
      uniforms: { ...seaU, ...landU, uRingK: ringK, uSel: { value: sel } },
      vertexShader: SHORE_GLSL + /* glsl */`
        attribute vec2 aCell; attribute vec4 aRing; uniform float uRowSpeed, uRingK, uSel, uNearK; uniform vec3 uOrigin, uNearS, uDeep, uLight, uFoam; varying vec3 vW, vN, vC; varying vec3 vUs;
        void main(){
          // aRing = (column width in stitches, every n-th ridge, size, the ring's outer edge in metres; 0 = the rows round the keel)
          vec2 ctr = uSel > 0.5 ? uOrigin.xz : uNearS.xz;                    // the round near gauge counts its cells from just ahead of the bow
          float S = ${SEA_ST.toFixed(2)}, G = aRing.x, nR = aRing.y, camRow = (ctr.y - uRowSpeed*uTime)/S;
          float col = G*(floor(ctr.x/(S*G)) + aCell.x), row = 2.*nR*(floor(camRow*0.5/nR) + aCell.y) + 1.;
          vec3 c = vec3(col*S + 0.5*S*G, 0., (row + 0.66)*S + uRowSpeed*uTime);
          vec2 dq = c.xz - uOrigin.xz; if (dq.y > 0.) dq.y *= 0.66;
          float dist = length(dq), fade = 1. - smoothstep(17., 26., dist);
          if (aRing.w > 0.5) { dist = length(c.xz - uOrigin.xz); fade = uRingK*aRing.z*smoothstep(aRing.w*0.38, aRing.w*0.52, dist)*(1. - smoothstep(aRing.w*0.8, aRing.w, dist)); }
          else { float nearSel = uNearK*step(distance(c.xz, uNearS.xz), 10.5); fade *= mix(nearSel, 1. - nearSel, uSel)*shoreK(c.xz); }
          float amp = 0.34*(1. - smoothstep(16., 27., dist))*(0.75 + 0.25*sin(c.x*0.21 + floor(row*0.5)*2.1));
          c.y = amp*(0.5 - 0.5*sin(3.14159265*(row + 0.66)));
          vec3 p = c + position*fade*(0.9 + 0.2*hash11(col*7.3 + row));
          float ridge = floor(row*0.5/nR), m9 = mod(ridge + 1., nR < 1.5 ? 5. : 9.), h = hash11(ridge*1.37 + (nR - 1.)*7.31);
          vC = m9 < 0.5 ? uFoam : (h < 0.15 ? uLight : (h > 0.9 ? mix(uDeep, uLight, 0.4) : (mod(ridge, 2.) < 0.5 ? uDeep*0.9 : mix(uDeep, uLight, 0.26))));
          vW = p; vN = normal; vUs = vec3(uv, hash11(col*3.1 + row*1.7)); gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
        }`,
      fragmentShader: FAT_GLSL + /* glsl */`
        varying vec3 vW, vN, vC; varying vec3 vUs;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
          gl_FragColor = vec4(toScene(fatYarn(vC, N, vec3(0., 1., 0.), V, vUs.xy, vUs.z, dist)), 1.);
        }`,
    });
    const bumps = new THREE.Mesh(bumpGeo, bumpMat(1)); bumps.frustumCulled = false; scene.add(bumps);
    const bumpRings = new THREE.Mesh(ringGeo, bumps.material); bumpRings.frustumCulled = false; scene.add(bumpRings);
    // ... and round the bow the garter is real yarn in its round gauge: the purl bumps as fat plied strands arched over a dark
    // recess, the knit rows between them as fat Vs lying in the troughs, and hairs on the bumps' backs (the same cells, counted
    // from a point just ahead of the bow; beyond about ten metres the lighter bumps above and the sea's own shader carry on)
    const SNI = 7, SNJ = 4, seaCells = [];
    for (let j = -SNJ; j <= SNJ; j++) for (let i = -SNI; i <= SNI; i++) seaCells.push(i, j);
    const seaCellAttr = new THREE.InstancedBufferAttribute(new Float32Array(seaCells), 2);
    const bumpHiPts = []; for (let i = 0; i <= 8; i++) { const t = i/8; bumpHiPts.push(new THREE.Vector3(-0.82 + 1.64*t, 0.66*Math.sin(t*Math.PI) - 0.14, 0.16*Math.sin(t*Math.PI*2))); }
    const bumpHiBase = yarnTubeGeometry(bumpHiPts, 0.25, 6), bumpHiGeo = new THREE.InstancedBufferGeometry();
    bumpHiGeo.index = bumpHiBase.index; for (const k of ['position', 'normal', 'uv']) bumpHiGeo.setAttribute(k, bumpHiBase.getAttribute(k));
    bumpHiGeo.setAttribute('aCell', seaCellAttr); bumpHiGeo.instanceCount = seaCells.length/2;
    bumpHiGeo.setAttribute('aRing', new THREE.InstancedBufferAttribute(new Float32Array(seaCells.length*2).map((v, i) => (i % 4 < 2 ? 1 : 0)), 4));
    const bumpsNear = new THREE.Mesh(bumpHiGeo, bumpMat(0)); bumpsNear.frustumCulled = false; scene.add(bumpsNear);
    const SEA_LATT = /* glsl */`
      uniform float uRowSpeed, uNearK; uniform vec3 uOrigin, uNearS, uDeep, uLight, uFoam;
      float seaY(vec2 xz, out float sl){                                      // the swell under a point of the Sound (as the near sea's own vertex shader has it)
        float sy = (xz.y - uRowSpeed*uTime)/${SEA_ST.toFixed(2)};
        vec2 dq = xz - uOrigin.xz; if (dq.y > 0.) dq.y *= 0.66;
        float amp = 0.34*(1. - smoothstep(16., 27., length(dq)))*(0.75 + 0.25*sin(xz.x*0.21 + floor(sy*0.5)*2.1));
        sl = -amp*0.5*3.14159265*cos(3.14159265*sy)/${SEA_ST.toFixed(2)};
        return amp*(0.5 - 0.5*sin(3.14159265*sy));
      }
      vec3 ridgeWool(float ridge, float purl){
        float m5 = mod(ridge + 1., 5.), h = hash11(ridge*1.37);
        return m5 < 0.5 ? mix(uDeep, uFoam, purl) : (h < 0.15 ? uLight : (h > 0.9 ? mix(uDeep, uLight, 0.4) : (mod(ridge, 2.) < 0.5 ? uDeep*0.9 : mix(uDeep, uLight, 0.26))));
      }`;
    // the other half of each garter ridge: the loops of the next row, lying forward of the bumps and half a stitch along, so
    // every ridge is two interlocked rows of fat strands and no flat fabric shows between them
    const loopPts = []; for (let i = 0; i <= 8; i++) { const t = i/8, sn = Math.sin(t*Math.PI); loopPts.push(new THREE.Vector3(-0.82 + 1.64*t, 0.2*sn - 0.06, -0.62*sn)); }
    const loopBase = yarnTubeGeometry(loopPts, 0.25, 6), seaVGeo = new THREE.InstancedBufferGeometry();
    seaVGeo.index = loopBase.index; for (const k of ['position', 'normal', 'uv']) seaVGeo.setAttribute(k, loopBase.getAttribute(k));
    seaVGeo.setAttribute('aCell', seaCellAttr); seaVGeo.instanceCount = seaCells.length/2;
    const seaVs = new THREE.Mesh(seaVGeo, woolMaterial({
      uniforms: { ...seaU, ...landU },
      vertexShader: SHORE_GLSL + SEA_LATT + /* glsl */`
        attribute vec2 aCell; varying vec3 vW, vN, vC; varying vec3 vUs;
        void main(){
          float S = ${SEA_ST.toFixed(2)}, nearRow = (uNearS.z - uRowSpeed*uTime)/S;
          float col = floor(uNearS.x/S) + aCell.x, row = 2.*(floor(nearRow*0.5) + aCell.y) + 1.;
          vec2 cc = vec2((col + 1.)*S, (row + 0.52)*S + uRowSpeed*uTime);
          float sc = uNearK*step(distance(vec2(cc.x - 0.5*S, cc.y + 0.14*S), uNearS.xz), 10.5)*shoreK(vec2(cc.x - 0.5*S, cc.y + 0.14*S)), sl;
          vec3 p = vec3(cc.x, seaY(cc, sl), cc.y) + position*sc*(0.9 + 0.2*hash11(col*4.7 + row*1.3));
          vC = ridgeWool(floor(row*0.5), 1.)*0.94;
          vW = p; vN = normal; vUs = vec3(uv, hash11(col*2.3 + row*5.1)); gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
        }`,
      fragmentShader: FAT_GLSL + /* glsl */`
        varying vec3 vW, vN, vC; varying vec3 vUs;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
          gl_FragColor = vec4(toScene(fatYarn(vC, N, vec3(0., 1., 0.), V, vUs.xy, vUs.z, dist)), 1.);
        }`,
    }));
    seaVs.frustumCulled = false; scene.add(seaVs);
    // ... and the knit row of each ridge lies in the trough behind it as fat Vs (seen from above when the bow turns across the rows)
    const seaKnitGeo = fatVGeometry(6, [[-0.07, 0.3, 0.24], [0, 0.82, 0.3], [0.4, 1, 0.35], [0.86, 0.9, 0.14], [1, 0.55, -0.1]], 0.26); seaKnitGeo.setAttribute('aCell', seaCellAttr); seaKnitGeo.instanceCount = seaCells.length/2;
    const seaKnit = new THREE.Mesh(seaKnitGeo, woolMaterial({
      uniforms: { ...seaU, ...landU }, side: THREE.DoubleSide,
      vertexShader: SHORE_GLSL + SEA_LATT + /* glsl */`
        attribute vec2 aCell, aT; attribute vec3 aOff; varying vec3 vW, vN, vC, vUp; varying vec3 vUs;
        void main(){
          float S = ${SEA_ST.toFixed(2)}, nearRow = (uNearS.z - uRowSpeed*uTime)/S;
          float col = floor(uNearS.x/S) + aCell.x, row = 2.*(floor(nearRow*0.5) + aCell.y);
          vec2 cc = vec2((col + 0.5)*S, (row + 0.5)*S + uRowSpeed*uTime);
          float sc = uNearK*(1. - smoothstep(9., 11.5, distance(cc, uNearS.xz)))*shoreK(cc);
          vec2 xz = vec2((col + position.x)*S, (row + position.y)*S + uRowSpeed*uTime);
          float sl, y = seaY(xz, sl);
          vec3 nrm = normalize(vec3(0., 1., -sl)), Tb = normalize(vec3(0., sl, 1.));
          vec3 n = vec3(aOff.x, 0., 0.) + Tb*aOff.y + nrm*aOff.z;
          vec3 p = vec3(xz.x, y, xz.y) + nrm*(position.z - 0.2) + n*0.26*(0.92 + 0.2*hash11(col*7.3 + row));
          p = mix(vec3(cc.x, -0.4, cc.y), p, sc);
          vC = ridgeWool(floor(row*0.5), 0.)*0.9;
          vW = p; vN = n; vUp = nrm; vUs = vec3(uv, hash11(col*2.3 + row*5.1)); gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
        }`,
      fragmentShader: FAT_GLSL + /* glsl */`
        varying vec3 vW, vN, vC, vUp; varying vec3 vUs;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
          gl_FragColor = vec4(toScene(fatYarn(vC, N, vUp/max(length(vUp), 1e-4), V, vUs.xy, vUs.z, dist)), 1.);
        }`,
    }));
    seaKnit.frustumCulled = false; scene.add(seaKnit);
    const seaTuftGeo = new THREE.InstancedBufferGeometry();
    seaTuftGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0], 3)); seaTuftGeo.setIndex([0, 1, 2, 2, 1, 3]);
    seaTuftGeo.setAttribute('aCell', seaCellAttr); seaTuftGeo.instanceCount = seaCells.length/2;
    const seaTufts = new THREE.Mesh(seaTuftGeo, tuftMaterial(SHORE_GLSL + SEA_LATT + /* glsl */`
      attribute vec2 aCell;
      void tuft(out vec3 root, out vec3 d, out vec3 col, out vec2 cr, out float seed, out float aMul){
        float S = ${SEA_ST.toFixed(2)}, nearRow = (uNearS.z - uRowSpeed*uTime)/S;
        float c0 = floor(uNearS.x/S) + aCell.x, row = 2.*(floor(nearRow*0.5) + aCell.y) + 1.;
        float h = hash11(c0*5.3 + row*2.9), sl;
        vec2 xz = vec2((c0 + 0.5)*S + (h - 0.5)*0.5, (row + 0.66)*S + uRowSpeed*uTime);      // rooted on the crest of its bump
        root = vec3(xz.x, seaY(xz, sl) + 0.62, xz.y);
        d = vec3((h - 0.5)*0.4, 0.34 + 0.3*hash11(c0*1.9 + row), 0.08);
        col = ridgeWool(floor(row*0.5), 1.);
        cr = vec2(position.x*(1.0 + 0.6*h), position.y); seed = h;
        aMul = uNearK*step(0.3, hash11(c0*9.1 + row*4.3))*(1. - smoothstep(10., 13., distance(xz, uNearS.xz)))*step(0.5, shoreK(xz));
      }`, pxU, { near: [4.5, 8], minPx: 3, grow: 1.5, hairW: 0.3, maxPx: 15, hairs: 9, alpha: 0.85, uniforms: { ...seaU, ...landU } }));
    seaTufts.frustumCulled = false; seaTufts.renderOrder = 3; scene.add(seaTufts);
    await ctx.yield();

    // ---------- loose cords, instanced: loop-stitch grass that lies over in the gusts, i-cord kelp at the cliff foot ----------
    const cordMaterial = (kind) => woolMaterial({
      uniforms: { uKind: { value: kind }, uRowSpeed: seaU.uRowSpeed },
      vertexShader: /* glsl */`
        attribute vec3 iPos, iCol; attribute vec4 iPar; uniform float uKind, uRowSpeed; varying vec3 vW, vN, vC; varying vec2 vUv;
        void main(){
          float cy = cos(iPar.x), sy = sin(iPar.x); vec3 p = position*iPar.y, n = normal;
          p = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy); n = vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy);
          vec3 w = iPos + p;
          if (uKind < 0.5) { float hgt = clamp(position.y/1.6, 0., 1.), g = gust(iPos + iPar.z*9.);
            float lean = hgt*hgt*(0.35 + 0.9*g)*uGale*iPar.y*1.1 + hgt*0.12*sin(uTime*5. + iPar.z*40.);
            w += uWind*lean; w.y -= lean*0.45*hgt; }
          else { float al = clamp(position.x/8., 0., 1.);
            w.y += al*(0.9*sin(uTime*0.9 + iPar.z*6.283 + position.x*0.5) + 0.5) + 0.3*sin(3.14159265*(w.z - uRowSpeed*uTime)/1.5)*al;
            w.z += al*al*1.6*sin(uTime*0.6 + iPar.z*17.); }
          vW = w; vN = n; vC = iCol; vUv = uv; gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vW, vN, vC; varying vec2 vUv;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
          gl_FragColor = vec4(toScene(yarnShade(vC, N, V, vUv, 2., dist)), 1.);
        }`,
    });
    const loose = [];
    const instanced = (base, list) => {
      loose.push(base); const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k of ['position', 'normal', 'uv']) g.setAttribute(k, base.getAttribute(k));
      const n = list.length, ip = new Float32Array(n*3), ic = new Float32Array(n*3), ia = new Float32Array(n*4);
      list.forEach((e, i) => { ip.set([e.p.x, e.p.y, e.p.z], i*3); ic.set([e.c.r, e.c.g, e.c.b], i*3); ia.set([e.yaw, e.s, e.ph, 0], i*4); });
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 3)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(ic, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(ia, 4));
      g.instanceCount = n; return g;
    };
    // where things may stand beside the course on land: u along the path, metres to the side
    const beside = (u, side, out) => { path.pointAt(u, _p); path.tangentAt(u, _t); _s.crossVectors(_t, UP).normalize(); out.copy(_p).addScaledVector(_s, side > 0 ? side + 1.6 + 2*cabOff(u) : side - 1.6); out.y = land(out.x, out.z); return out; };      // clear of the cable
    const steepAt = (x, z) => Math.hypot(land(x + 1.5, z) - land(x - 1.5, z), land(x, z + 1.5) - land(x, z - 1.5))/3 > 0.75;
    const grassPts = []; for (let i = 0; i <= 5; i++) { const a = Math.PI*(i/5); grassPts.push(new THREE.Vector3(-0.42*Math.cos(a), 1.6*Math.sin(a)*(0.75 + 0.25*Math.sin(a)), 0)); }
    const grassList = [], NG = Math.round(1200*detail*density), grassCols = [fawn, fawn, moorit, fawn.clone().lerp(cream, 0.4), fawn.clone().lerp(moorit, 0.4)];
    for (let i = 0; i < NG; i++) {
      const u = rng.range(0.43, 0.955), side = (rng.chance(0.5) ? 1 : -1)*(5.5 + 13*Math.pow(rng(), 1.6)), p = beside(u, side, new THREE.Vector3());
      const gi = { p, c: rng.pick(grassCols), yaw: rng.range(0, Math.PI), s: rng.range(0.6, 1.05), ph: rng() }; if (!steepAt(p.x, p.z)) grassList.push(gi);
      if (i % 60 === 59) await ctx.yield();
    }
    const grass = new THREE.Mesh(instanced(yarnTubeGeometry(grassPts, 0.16, 4), grassList), cordMaterial(0)); grass.frustumCulled = false; scene.add(grass);
    const kelpPts = []; for (let i = 0; i <= 10; i++) kelpPts.push(new THREE.Vector3(i*0.8, -0.2, 0.25*Math.sin(i*0.9)));
    const kelpList = [], NK = Math.round(100*Math.max(detail, 0.7));
    for (let i = 0; i < NK; i++) {
      const ci = rng.int(20, CN - 60), z = CZ0 + ci*CSTEP;
      kelpList.push({ p: new THREE.Vector3(cliffX[ci] + 3.2, 0.1, z), c: i % 5 === 0 ? moorit.clone().lerp(fawn, 0.35) : moorit, yaw: rng.range(-0.5, 0.5), s: rng.range(0.8, 1.25), ph: rng() });
    }
    const kelp = new THREE.Mesh(instanced(yarnTubeGeometry(kelpPts, 0.33, 5), kelpList), cordMaterial(1)); kelp.frustumCulled = false; scene.add(kelp);
    await ctx.yield();

    // ---------- the yoal, knitted round the camera. The eye rides at the BOW, just behind the stem: mast, thwarts and
    // sail are behind it, and what stays in view is the prow (the stem post and the two gunwales meeting) low at the bottom
    // of the frame. Everything carried with the camera is under this one group (boat space: the hull runs from z 0.9 at the
    // stern to -6.4 at the stem; BOW puts the eye 2.1 m behind the stem and 0.9 m above its head). ----------
    const boat = new THREE.Group(); boat.name = 'carried'; boat.matrixAutoUpdate = false; scene.add(boat);
    const BOW = new THREE.Vector3(0, -1.0, 3.3);
    const BST = 0.12;
    {
      const NS_ = 26, NA = 14, hp = new Float32Array((NS_ + 1)*(NA + 1)*3), huv = new Float32Array((NS_ + 1)*(NA + 1)*2), hi = [], gunL = [], gunR = [];
      for (let i = 0, o = 0; i <= NS_; i++) {
        const t = i/NS_, z = 0.9 - 7.3*t, bm = 1.22*Math.pow(Math.sin(Math.PI*clamp(0.2 + 0.8*t, 0, 1)), 0.62)*(1 - smoothstep(0.86, 1, t)*0.92);
        const yk = -2 + 1.25*t*t*t, yg = -1.08 + 0.78*Math.pow(t, 2.4);
        for (let j = 0; j <= NA; j++, o++) {
          const a = -1 + 2*j/NA, aa = Math.abs(a), x = Math.sign(a)*bm*Math.pow(aa, 0.62), y = lerp(yk, yg, Math.pow(aa, 1.9));
          hp[o*3] = x; hp[o*3 + 1] = y; hp[o*3 + 2] = z; huv[o*2] = a*1.9; huv[o*2 + 1] = t*7.3;
          if (i < NS_ && j < NA) { const p = o, q = o + NA + 1; hi.push(p, q, p + 1, p + 1, q, q + 1); }
        }
        gunL.push(new THREE.Vector3(-bm - 0.02, yg + 0.03, z)); gunR.push(new THREE.Vector3(bm + 0.02, yg + 0.03, z));
      }
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.BufferAttribute(hp, 3)); hg.setAttribute('uv', new THREE.BufferAttribute(huv, 2)); hg.setIndex(hi); hg.computeVertexNormals();
      boat.add(new THREE.Mesh(hg, fabricMaterial({ pattern: 0, stitch: [BST, BST], color: pal[2], stripe: [7, 2], stripeColor: pal[0], side: THREE.DoubleSide })));
      // cream i-cord gunwale, fawn stays and sheets (single plies)
      const cords = [yarnTubeGeometry(gunL, 0.075, 6), yarnTubeGeometry(gunR, 0.075, 6)];
      const withCol = (g, c) => { const n = g.getAttribute('position').count, a = new Float32Array(n*3); for (let i = 0; i < n; i++) { a[i*3] = c.r; a[i*3 + 1] = c.g; a[i*3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
      cords.forEach((g) => withCol(g, cream));
      const V = (x, y, z) => new THREE.Vector3(x, y, z), MAST = V(-0.3, 0, -3.0), sagLine = (a, b, sag, n = 10) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i/n; pts.push(a.clone().lerp(b, t).add(V(0, -sag*4*t*(1 - t), 0))); } return pts; };
      for (const [a, b, sag] of [[V(-0.3, 5.6, -3.0), V(1.25, -0.9, 0.6), 0.1], [V(-0.3, 5.6, -3.0), V(-1.2, -0.9, 0.6), 0.1],      // the shrouds lead aft of the eye: nothing but the forestay crosses the view
        [V(-3.75, 0.95, -4.1), V(-1.15, -0.9, -1.2), 0.3]]) cords.push(withCol(yarnTubeGeometry(sagLine(a, b, sag), 0.022, 4), fawn));
      boat.add(new THREE.Mesh(mergeGeometries(cords), yarnMaterial({ vertexColors: true, plies: 2 }))); cords.forEach((g) => g.dispose());
      // the gunwale cord's hair: a fine halo standing off the i-cord, streaming forward (the gale is behind us)
      { const gl = []; let sd = 5531; const rnd = () => (sd = (sd*16807) % 2147483647)/2147483647;
        for (const [pts, sx] of [[gunL, -1], [gunR, 1]]) for (let i = 1; i < pts.length - 1; i++) for (let k = 0; k < 3; k++) {
          const p = pts[i].clone().lerp(pts[i + 1], rnd());
          gl.push({ p: p.add(V(sx*0.03, 0.055, 0)), n: V(sx*0.45, 0.89, 0), len: 0.012 + 0.014*rnd(), w: 0.16 + 0.1*rnd(), color: cream }); }
        const gm = new THREE.Mesh(fuzzGeometry(gl), tuftMaterial(TUFT_STATIC, pxU, { near: [0.5, 1.4], minPx: 2.5, hairs: 16, alpha: 0.5 }));
        gm.frustumCulled = false; gm.renderOrder = 3; boat.add(gm); }
      // two garter thwarts
      const thw = [];
      for (const z of [-2.35, -4.3]) { const t = (0.9 - z)/7.3, bm = 1.22*Math.pow(Math.sin(Math.PI*(0.2 + 0.8*t)), 0.62), y = -1.08 + 0.78*Math.pow(t, 2.4) - 0.2;
        const g = new THREE.BoxGeometry(bm*2 - 0.1, 0.07, 0.34); g.translate(0, y, z); const uvA = g.getAttribute('uv'), pA = g.getAttribute('position');
        for (let i = 0; i < uvA.count; i++) uvA.setXY(i, pA.getX(i), pA.getZ(i) + pA.getY(i)); thw.push(g); }
      boat.add(new THREE.Mesh(mergeGeometries(thw), fabricMaterial({ pattern: 1, stitch: [BST, BST*0.8], color: pal[1] }))); thw.forEach((g) => g.dispose());
      // the mast and the yard: wooden needles
      const needle = (len, r) => { const pts = [[0, 0], [r*0.5, len*0.01], [r, len*0.07], [r, len*0.94], [r*0.7, len*0.95], [r*1.9, len*0.965], [r*2.1, len*0.98], [r*1.5, len*0.995], [0.001, len]].map((q) => new THREE.Vector2(q[0], q[1])); const g = new THREE.LatheGeometry(pts, 10); g.rotateZ(-Math.PI/2); return g; };
      const woodM = woodMaterial({});
      const mast = new THREE.Mesh(needle(7.9, 0.07), woodM); mast.rotation.z = -Math.PI/2; mast.position.set(MAST.x, 5.9, MAST.z); boat.add(mast);     // point down in the keel? no: knob down, point up
      const yard = new THREE.Mesh(needle(4.6, 0.045), woodM); yard.position.set(-4.1, 4.62, -3.72); yard.rotation.y = -0.215; boat.add(yard);
      const stem = new THREE.Mesh(needle(0.62, 0.05), woodM); stem.rotation.z = -Math.PI/2; stem.position.set(0, -0.16, -6.44); boat.add(stem);          // the stem post: a turned peg, point up
    }
    // the sail: madder garter, bellied hard, set to port; its foot rides above the horizon so the middle stays clear
    const SAIL_GLSL = /* glsl */`uniform float uFull;
        vec3 sailP(vec2 q){
          vec3 a = mix(vec3(-3.75, 0.95, -4.1), vec3(0.12, 1.12, -2.92), q.x), b = mix(vec3(-3.95, 4.55, -3.7), vec3(0.2, 4.6, -2.8), q.x);
          vec3 p = mix(a, b, q.y); float bel = sin(q.x*3.14159265)*sin(clamp(q.y*1.15, 0., 1.)*3.14159265*0.9 + 0.15);
          float g = gust((modelMatrix*vec4(p, 1.)).xyz);
          p.z -= bel*(0.85 + 0.22*g + 0.05*sin(uTime*5.3 + q.y*9.))*uFull; p.y += bel*0.12;
          p.z -= (1. - q.y)*sin(q.x*3.14159265)*0.12*sin(uTime*7. + q.x*11.);      // the foot shivers
          return p; }`;
    const sailGeo = new THREE.PlaneGeometry(1, 1, 18, 14);
    const sailU = { uSail: { value: C(sailHex) }, uEdgeC: { value: C(sailEdge) }, uEdgeOn: { value: colourway === 2 ? 1 : 0 }, uFull: { value: weather === 1 ? 1.25 : 1 } };
    const sail = new THREE.Mesh(sailGeo, woolMaterial({
      side: THREE.DoubleSide, uniforms: sailU,
      vertexShader: /* glsl */`
        varying vec3 vW, vN; varying vec2 vUv;
        ${SAIL_GLSL}
        void main(){ vec2 q = uv; vec3 p = sailP(q), dx = sailP(q + vec2(0.02, 0.)) - p, dy = sailP(q + vec2(0., 0.02)) - p;
          vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = mat3(modelMatrix)*cross(dx, dy); vUv = uv*vec2(4.0, 3.6);
          gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSail, uEdgeC; uniform float uEdgeOn; varying vec3 vW, vN; varying vec2 vUv;
        void main(){
          vec3 N = vN/max(length(vN), 1e-4); if (dot(N, cameraPosition - vW) < 0.) N = -N;
          vec2 st = vUv/vec2(${BST.toFixed(2)}, ${(BST*0.8).toFixed(3)});
          float e = min(min(vUv.x, 4.0 - vUv.x), min(vUv.y, 3.6 - vUv.y));
          vec3 base = mix(mix(uSail, uSail*uSail*1.25, 0.3 + 0.25*step(0.6, hash11(floor(st.y/9.)))), uEdgeC, uEdgeOn*step(e, 0.3));      // deep-dyed, lot by lot
          gl_FragColor = vec4(toScene(fabricShade(base, st, 1., 0.22, N, vW, 0.1)), 1.);
        }`,
    }));
    sail.frustumCulled = false; boat.add(sail);
    // the sail's hair: along its foot and its inner edge, carried by the same bellying cloth
    { const sl = [], sc = C(sailHex); let sd = 7741; const rnd = () => (sd = (sd*16807) % 2147483647)/2147483647, dn = new THREE.Vector3(0, -1, 0.2).normalize(), out = new THREE.Vector3(1, 0, 0.2).normalize();
      for (let i = 0; i < 64; i++) sl.push({ p: new THREE.Vector3(0.02 + 0.96*rnd(), 0.004, 0), n: dn, len: 0.018 + 0.02*rnd(), w: 0.2 + 0.14*rnd(), color: sc });
      for (let i = 0; i < 40; i++) sl.push({ p: new THREE.Vector3(0.997, 0.02 + 0.96*rnd(), 0), n: out, len: 0.016 + 0.018*rnd(), w: 0.2 + 0.14*rnd(), color: sc });
      const sm = new THREE.Mesh(fuzzGeometry(sl), tuftMaterial(SAIL_GLSL + /* glsl */`
        attribute vec3 aDir, aCol; attribute vec4 aCorner;
        void tuft(out vec3 root, out vec3 d, out vec3 col, out vec2 cr, out float seed, out float aMul){
          root = (modelMatrix*vec4(sailP(position.xy), 1.)).xyz; d = mat3(modelMatrix)*aDir; col = aCol; cr = aCorner.xy; seed = aCorner.z; aMul = 1.; }`,
        pxU, { near: [0.5, 1.4], minPx: 2.5, hairs: 16, alpha: 0.6, uniforms: { uFull: sailU.uFull } }));
      sm.frustumCulled = false; sm.renderOrder = 3; boat.add(sm); }
    await ctx.yield();

    const tick = [];          // (dt, time, camera, u, camPos) for every later piece
    // seconds of flight at u (the engine's own rule: pace clamped to 0.35..2.5 and scaled to the duration)
    const FT = new Float32Array(129); { let acc = 0; for (let i = 1; i <= 128; i++) { acc += 1/clamp(pace((i - 0.5)/128), 0.35, 2.5); FT[i] = acc; } for (let i = 1; i <= 128; i++) FT[i] *= DURATION/acc; }
    const flightT = (u) => { const x = clamp(u, 0, 1)*128, i = Math.min(127, Math.floor(x)); return lerp(FT[i], FT[i + 1], x - i); };

    // ---------- a second yoal, under her own sail: dead ahead as we arrive, she crosses our bow to starboard as we come up with
    // her, runs on along the foot of the Banks past the laddered rib, and lies to in the slop off the low end of the Banks at the
    // mouth of the burn, where we pass her close enough to count her stitches. The same knitting as ours (the same geometry and
    // wool), set down on the Sound at twice the size and mirrored, so that her sail is set away from our course. ----------
    const yoal2 = new THREE.Group(); scene.add(yoal2);
    { const hullG = new THREE.Group(); hullG.scale.set(-2, 2, 2); hullG.position.y = 3.55; yoal2.add(hullG);
      for (const c of boat.children) { let mat = c.material;
        if (c === sail && colourway === 2) { mat = c.material.clone(); for (const k in c.material.uniforms) mat.uniforms[k] = c.material.uniforms[k]; mat.uniforms.uSail = { value: C(pal[6]) }; mat.uniforms.uEdgeOn = { value: 0 }; }      // (she sails under madder in every colourway)
        const m = new THREE.Mesh(c.geometry, mat); m.position.copy(c.position); m.quaternion.copy(c.quaternion); m.scale.copy(c.scale); m.frustumCulled = false; m.renderOrder = c.renderOrder; hullG.add(m); } }
    const cxAt = (z) => cliffX[clamp(Math.round((z - CZ0)/CSTEP), 0, CN)];
    const Y2K = [[0, 5, 112], [0.08, 4, 121], [0.16, -13, 172], [0.25, cxAt(276) + 15, 276], [0.33, cxAt(350) + 13, 350], [0.385, cxAt(371) + 9, 371], [0.45, cxAt(377) + 7, 377]];      // u, x, z
    const y2At = (u, out) => {          // her place at u: a smooth curve through the keys (cubic Hermite)
      const n = Y2K.length; u = clamp(u, 0, Y2K[n - 1][0]); let i = 0; while (i < n - 2 && u > Y2K[i + 1][0]) i++;
      const a = Y2K[i], b = Y2K[i + 1], h = b[0] - a[0], t = (u - a[0])/h, t2 = t*t, t3 = t2*t, pa = Y2K[Math.max(i - 1, 0)], nb = Y2K[Math.min(i + 2, n - 1)];
      for (let k = 1; k <= 2; k++) { const m0 = (b[k] - pa[k])/(b[0] - pa[0]), m1 = i + 2 > n - 1 ? 0 : (nb[k] - a[k])/(nb[0] - a[0]);
        const v = (2*t3 - 3*t2 + 1)*a[k] + (t3 - 2*t2 + t)*h*m0 + (-2*t3 + 3*t2)*b[k] + (t3 - t2)*h*m1; if (k === 1) out.x = v; else out.z = v; }
      return out; };
    { const y2p = new THREE.Vector3(), y2a = new THREE.Vector3(), y2b = new THREE.Vector3();
      tick.push((dt, time, camera, u) => {
        yoal2.visible = u < 0.52; if (!yoal2.visible) return;
        const ua = clamp(u, 0.004, 0.43); y2At(u, y2p); y2At(ua + 0.004, y2a); y2At(ua - 0.004, y2b);
        const ph = Math.PI*(y2p.z - rowSpeed*time)/SEA_ST, way = 1 - smoothstep(0.385, 0.45, u);      // (she loses her way as she comes in to the mound)
        yoal2.position.set(y2p.x, 0.12*Math.sin(ph), y2p.z);
        yoal2.rotation.set(0.018*Math.cos(ph)*(0.5 + 0.5*way), Math.atan2(-(y2a.x - y2b.x), -(y2a.z - y2b.z)), 0.04 + 0.02*Math.sin(time*0.9), 'YXZ');
      }); }

    // ---------- bobble tussocks, nodding; and the fuzz every outline wears ----------
    const bobList = [], NB_ = Math.round(300*density*Math.max(detail, 0.7)), fuzzList = [], NUP = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < NB_; i++) {
      const u = rng.range(0.44, 0.97), side = (rng.chance(0.5) ? 1 : -1)*(7 + 30*Math.pow(rng(), 1.4)), p = beside(u, side, new THREE.Vector3()), s = rng.range(0.5, 1.05);
      p.y += s*0.35; const bi = { p, c: rng.chance(0.8) ? fawn : fawn.clone().lerp(moorit, 0.5), yaw: rng.range(0, 6.28), s, ph: rng() }; if (!steepAt(p.x, p.z)) bobList.push(bi);
      if (i % 3 === 0) fuzzList.push({ p: p.clone().setY(p.y + s*0.8), n: NUP, len: rng.range(0.5, 0.9), w: rng.range(1.0, 1.8), color: fawn });
      if (i % 25 === 24) await ctx.yield();
    }
    for (let i = 0, n = Math.round(220*density*Math.max(detail, 0.7)); i < n; i++) {
      const u = rng.range(0.66, 0.965), side = (rng.chance(0.72) ? 1 : -1)*(5.5 + 20*Math.pow(rng(), 1.5)), p = beside(u, side, new THREE.Vector3()), sc = rng.range(0.45, 0.95);
      p.y += sc*0.35; bobList.push({ p, c: rng.chance(0.7) ? fawn : (rng.chance(0.5) ? fawn.clone().lerp(moorit, 0.5) : fawn.clone().lerp(cream, 0.45)), yaw: rng.range(0, 6.28), s: sc, ph: rng() });
      if (i % 100 === 99) await ctx.yield();
    }
    await ctx.yield();
    // buoys on the Sound: a cream wool ball with a moorit cork, one line to port on the run-in, one to starboard along the Banks
    for (let k = 0; k < 11; k++) { const port = k < 6, pu = path.pointAt((port ? 30 + k*23 : 215 + (k - 6)*20)/path.length, new THREE.Vector3()), x = pu.x + (port ? 8.6 : -8.2) + 0.6*Math.sin(k*2.4);
      bobList.push({ p: new THREE.Vector3(x, 0.5, pu.z), c: cream, yaw: k*1.3, s: 0.85, ph: (k*0.37) % 1 }, { p: new THREE.Vector3(x, 1.05, pu.z), c: moorit, yaw: k, s: 0.36, ph: (k*0.37) % 1 }); }
    const bobbles = new THREE.Mesh(instanced(new THREE.IcosahedronGeometry(1, 1), bobList), woolMaterial({
      vertexShader: /* glsl */`
        attribute vec3 iPos, iCol; attribute vec4 iPar; varying vec3 vW, vN, vC, vO;
        void main(){ vec3 p = position*iPar.y*vec3(1., 0.8, 1.); float g = gust(iPos);
          vec3 w = iPos + p + uWind*max(p.y, 0.)*(0.12 + 0.3*g)*uGale + vec3(0., 0.06*sin(uTime*3. + iPar.z*30.)*max(p.y, 0.), 0.);
          vW = w; vN = normal; vC = iCol; vO = position; gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.); }`,
      fragmentShader: /* glsl */`
        varying vec3 vW, vN, vC, vO;
        void main(){ vec3 N = vN/max(length(vN), 1e-4); vec3 n = vO/max(length(vO), 1e-4);
          vec2 st = vec2(atan(n.z, n.x + 1e-5)*2.2, asin(clamp(n.y, -1., 1.))*2.6);
          gl_FragColor = vec4(toScene(fabricShade(vC, st, 0., 0.22, N, vW, 0.1)), 1.); }`,
    }));
    bobbles.frustumCulled = false; scene.add(bobbles);
    // a skerry to port of the run-in, knitted in moss stitch with a cream hem in the surf, and three seals hauled out on it
    { const pu = path.pointAt(214/path.length, new THREE.Vector3()), parts = [], M = new THREE.Matrix4(), Qr = new THREE.Quaternion(), E = new THREE.Euler();
      const lump = (x, y, z, sx, sy, sz, yaw, roll, col, seg) => { const g = new THREE.SphereGeometry(1, seg, Math.max(5, Math.round(seg*0.6))); E.set(0, yaw, roll, 'YXZ');
        g.applyMatrix4(M.compose(new THREE.Vector3(x, y, z), Qr.setFromEuler(E), new THREE.Vector3(sx, sy, sz))); const n = g.getAttribute('position').count, ca = new Float32Array(n*3);
        for (let q = 0; q < n; q++) { ca[q*3] = col.r; ca[q*3 + 1] = col.g; ca[q*3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); g.computeVertexNormals(); parts.push(g); };
      const rock = grey.clone().multiplyScalar(0.8), sealC = [moorit.clone().multiplyScalar(0.9), grey.clone().lerp(indigo, 0.35), moorit.clone().lerp(fawn, 0.45)];
      lump(0, -0.25, 0, 6.4, 2.6, 3.6, 0.4, 0, rock, 22); lump(-3.4, -0.3, 1.6, 3.2, 1.9, 2.4, -0.3, 0, rock, 16); lump(3.9, -0.4, -1.5, 2.6, 1.5, 1.9, 0.9, 0, rock, 14);
      [[-1.6, 2.6, 0.2, 0.5], [1.7, 2.56, -0.5, 2.5], [-3.6, 1.93, 1.7, -0.7]].forEach(([x, y, z, yaw], k) => { const c = Math.cos(yaw), s = Math.sin(yaw), L = 1.5 - 0.2*k;      // a seal: a fat body, head and flippers lifted
        lump(x, y, z, L, 0.5, 0.56, yaw, 0, sealC[k], 12); lump(x + c*L*0.92, y + 0.34, z - s*L*0.92, 0.42, 0.36, 0.36, yaw, 0.5, sealC[k], 8); lump(x - c*L*0.98, y + 0.22, z + s*L*0.98, 0.5, 0.14, 0.34, yaw, -0.6, sealC[k], 8); });
      const sk = new THREE.Mesh(mergeGeometries(parts), woolMaterial({ uniforms: { uFoam: { value: cream } },
        vertexShader: /* glsl */`
          attribute vec3 color; varying vec3 vW, vN, vC;
          void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vC = color; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader: /* glsl */`
          uniform vec3 uFoam; varying vec3 vW, vN, vC;
          void main(){ vec3 N = vN/max(length(vN), 1e-4); bool ax = abs(N.x) > abs(N.z);
            vec2 st = vec2(ax ? vW.z : vW.x, vW.y*1.25 + (ax ? vW.x : vW.z)*0.6)/0.62; float row = floor(st.y);
            bool hem = vW.y < 0.75 + 0.15*sin(vW.x*1.7 + vW.z*1.3);
            vec3 base = hem ? uFoam : vC*(mod(row, 5.) < 1. ? 0.84 : 1.);
            gl_FragColor = vec4(toScene(fabricShade(base, st, hem ? 1. : 3., 0.22, N, vW, 0.)), 1.); }`,
      }));
      for (const g of parts) g.dispose();
      sk.scale.setScalar(1.35); sk.position.set(pu.x + 11.8, 0.1, pu.z); scene.add(sk); }
    for (let i = 0; i <= CN; i += 2) if (cliffTop[i] > 1.5) fuzzList.push({ p: new THREE.Vector3(cliffX[i] - 4.4 + 2.6, cliffTop[i] + 0.2, CZ0 + i*CSTEP), n: NUP, len: rng.range(0.6, 1.2), w: rng.range(1.6, 2.6), color: grey });
    const NFZ = Math.round(2600*detail);
    for (let i = 0; i < NFZ; i++) {
      const u = rng.range(0.42, 0.98), side = (rng.chance(0.5) ? 1 : -1)*(5.5 + 34*Math.pow(rng(), 1.3)), p = beside(u, side, new THREE.Vector3());
      fuzzList.push({ p, n: NUP, len: rng.range(0.45, 1.0), w: rng.range(1.2, 2.4), color: p.y > 44 && p.y < 56 ? grey : fawn });
      if (i % 200 === 199) await ctx.yield();
    }
    await ctx.yield();
    // the hill's own hair: wherever the knitted ground is convex (a skyline, a shoulder, the lip of the shore or of a
    // terrace) tufts stand along it, so no outline of the island is a clean modelled edge
    {
      let sd = 90817; const rnd = () => (sd = (sd*16807) % 2147483647)/2147483647, W1 = GNX + 1;
      const hAt = (x, z) => { const gx = clamp((x - GX0)/GS, 0, GNX - 1e-3), gz = clamp((z - GZ0)/GS, 0, GNZ - 1e-3), i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j, o = j*W1 + i;
        return lerp(lerp(lpos[o*3 + 1], lpos[(o + 1)*3 + 1], fx), lerp(lpos[(o + W1)*3 + 1], lpos[(o + W1 + 1)*3 + 1], fx), fz); };
      const moor = fawn.clone().lerp(moorit, 0.5), lnor = landGeo.getAttribute('normal');
      for (const c of fuzzList) {                    // the tufts scattered beside the course: each stands along its own ground and wears that ground's wool
        if (c.color !== fawn) continue;
        const i = clamp(Math.round((c.p.x - GX0)/GS), 0, GNX), j = clamp(Math.round((c.p.z - GZ0)/GS), 0, GNZ), o = j*W1 + i, ny = lnor.getY(o);
        c.n = new THREE.Vector3(lnor.getX(o), ny, lnor.getZ(o)); if (ny < 0.8 || (c.p.y > 42 && c.p.y < 58)) c.skip = true; else if (lturf[o] > 0.5 && rnd() < 0.4) c.color = moor;
      }
      for (let j = 1; j < GNZ; j++) {
        for (let i = 1; i < GNX; i++) {
          const o = j*W1 + i, h = lpos[o*3 + 1]; if (h < 0.5 || lmask[o]) continue;
          const steep = lnor.getY(o) < 0.66, nrm = new THREE.Vector3(lnor.getX(o), lnor.getY(o), lnor.getZ(o));
          const cv = h - 0.25*(lpos[(o - 1)*3 + 1] + lpos[(o + 1)*3 + 1] + lpos[(o - W1)*3 + 1] + lpos[(o + W1)*3 + 1]);
          if (cv < 0.16 || (h > 43 && h < 55.5)) continue;                    // (the band's face stays clean: its lip above wears the fringe)
          const n = Math.min(3, Math.floor((0.7 + cv*1.6)*detail*(steep ? (cv > 0.5 ? 0.6 : 0) : 1) + rnd()));
          for (let k = 0; k < n; k++) {
            const x = lpos[o*3] + (rnd() - 0.5)*GS, z = lpos[o*3 + 2] + (rnd() - 0.5)*GS, y = hAt(x, z);
            fuzzList.push({ p: new THREE.Vector3(x, y + 0.25, z), n: nrm, len: 0.5 + 0.5*rnd(), w: 1.5 + 1.2*rnd(), color: y < 6 ? cream : (steep ? grey : (rnd() < 0.3 ? moor : fawn)) });
          }
        }
        if (j % 12 === 11) await ctx.yield();
      }
    }
    await ctx.yield();
    const fuzz = new THREE.Mesh(fuzzGeometry(fuzzList.filter((c) => !c.skip)), tuftMaterial(TUFT_LAND, pxU, { near: [7, 15], minPx: 4, grow: 2, hairW: 0.3, maxPx: 18, hairs: 9, alpha: 0.85 }));
    fuzz.frustumCulled = false; fuzz.renderOrder = 3; scene.add(fuzz);        // (near the keel the window's own tufts take over)
    await ctx.yield();

    // ---------- skerries and far hills at 1, 3 and 6 km: finer gauge, paler wool, only ribs and bands left ----------
    {
      const far = [];
      const lump = (cx, cz, rad, hgt, col) => {
        const NR_ = 20, NH = 5, pos = [], uv = [], colr = [], idx = [], skew = rng.range(-0.3, 0.3);
        for (let j = 0; j <= NH; j++) for (let i = 0; i <= NR_; i++) {
          const a = (i/NR_)*Math.PI*2, t = j/NH, rr = rad*(1 - t)*(0.8 + 0.2*Math.sin(a*2 + cx) + 0.12*Math.sin(a*5 + cz)), y = hgt*(1 - (1 - t)*(1 - t)) - 4;
          pos.push(cx + Math.cos(a)*rr + skew*y, y, cz + Math.sin(a)*rr*0.7); uv.push(a*rad*0.8, t*hgt*1.6); colr.push(col.r, col.g, col.b);
          if (i < NR_ && j < NH) { const p = j*(NR_ + 1) + i, q = p + NR_ + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx); g.computeVertexNormals(); far.push(g);
      };
      const farCols = [indigo.clone().lerp(grey, 0.45), grey, moorit.clone().lerp(grey, 0.35), indigo2.clone().lerp(grey, 0.35), fawn.clone().lerp(moorit, 0.3)];
      for (let i = 0; i < 11; i++) {
        const ring = i < 4 ? 1 : i < 8 ? 3 : 6, a = rng.range(-0.25, 0.25) + [-1.9, -1.2, 1.5, 2.6, -2.4, -0.75, 0.5, 2.2, -1.5, 0.1, 1.2][i], d = ring*rng.range(950, 1150);
        lump(Math.sin(a)*d, 400 + Math.cos(a)*d, rng.range(160, 300)*Math.sqrt(ring)*1.3, rng.range(50, 110)*Math.sqrt(ring)*1.25, rng.pick(farCols));
      }
      const farMesh = new THREE.Mesh(mergeGeometries(far), fabricMaterial({ pattern: 2, stitch: [16, 11], vertexColors: true, stripe: [7, 2], stripeColor: pal[0] }));
      scene.add(farMesh); far.forEach((g) => g.dispose());
    }
    await ctx.yield();

    // ---------- gannets: nine stitches in a chevron, wheeling over the Sound; three fold to a column and dive ----------
    const tern = bandSet === 2, BS = tern ? 0.6 : 0.85;                     // one stitch of a bird, metres
    const birdBase = (() => { const pos = [], uv = [], kk = [];
      for (let k = -4; k <= 4; k++) for (let c = 0; c < 4; c++) { pos.push((c & 1) - 0.5, 0, (c >> 1) - 0.5); uv.push(c & 1, c >> 1); kk.push(k); }
      const idx = []; for (let q = 0; q < 9; q++) idx.push(q*4, q*4 + 2, q*4 + 1, q*4 + 1, q*4 + 2, q*4 + 3);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 1)); g.setIndex(idx); return g; })();
    const NGAN = Math.round(60*density*Math.max(detail, 0.7)), birdGeo = new THREE.InstancedBufferGeometry();
    birdGeo.index = birdBase.index; for (const k of ['position', 'uv', 'aK']) birdGeo.setAttribute(k, birdBase.getAttribute(k));
    { const a = new Float32Array(NGAN*4), b = new Float32Array(NGAN*4);
      for (let i = 0; i < NGAN; i++) {
        const near = i < NGAN*0.36, z = near ? rng.range(30, 420) : rng.range(-100, 700), x = near ? rng.range(-64, 60) : rng.range(-240, 420);
        a.set([x, near ? rng.range(6, 15) : rng.range(18, 70), z, near ? rng.range(14, 30) : rng.range(30, 90)], i*4);
        b.set([rng.range(0, 6.28), (rng.chance(0.5) ? 1 : -1)*rng.range(0.7, 1.2), rng(), 0], i*4);
      }
      for (const [i, ox, oy, oz, rad] of [[0, -12, 7, 2, 7], [1, -5.5, 14.5, 3, 3], [2, -32, 7, 40, 11]]) if (i < NGAN) { a.set([ox, oy, oz, rad], i*4); b[i*4 + 2] = 0.1 + 0.1*i; b[i*4 + 3] = 1; }
      if (NGAN > 1) { b[4] = 0; b[5] = 0.004; }      // the lead gannet: it flies on ahead of the bow, just to starboard, low against the sky's hem (it barely wheels)
      birdGeo.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); birdGeo.setAttribute('iB', new THREE.InstancedBufferAttribute(b, 4)); birdGeo.instanceCount = NGAN; }
    const birdEsc = { value: new THREE.Vector3(0, 0, 40) };          // where the escort keeps station: a point of the course ahead of the bow
    const birdHero = { value: new THREE.Vector3(HERO_POS.x - 40, 1, HERO_POS.z - 90) };      // xz: the middle of the ball and the piece; y: 1 while the rule holds
    const birdThin = { value: 0 };                      // over the island only a few gannets follow: the flock belongs to the Sound
    const diveU = [0, 1, 2].map(() => ({ uDive: { value: new THREE.Vector4(0, 60, 0, 0) } }));        // xyz position, w = fold 0..1
    const birdMat = (dive) => woolMaterial({
      side: THREE.DoubleSide, uniforms: { uS: { value: BS }, uPx: pxU, uThin: birdThin, uEsc: birdEsc, uHeroAt: birdHero, uHead: { value: tern ? black : fawn }, uBody: { value: cream }, uTip: { value: tern ? grey : black }, uIsDive: { value: dive ? 1 : 0 }, ...(dive || { uDive: { value: new THREE.Vector4() } }) },
      vertexShader: /* glsl */`
        attribute vec4 iA, iB; attribute float aK; uniform float uS, uIsDive, uPx, uThin; uniform vec4 uDive; uniform vec3 uEsc, uHeroAt; varying vec3 vW, vN, vC; varying vec2 vUv; uniform vec3 uHead, uBody, uTip;
        void main(){
          float ak = abs(aK), fold = uIsDive*uDive.w;
          vec3 c; float hd; float flap, sz = 1., lead = iB.w*step(abs(iB.z - 0.2), 0.01);      // lead: the one gannet that flies on ahead of the bow
          if (uIsDive > 0.5) { c = uDive.xyz; hd = 1.2; flap = 0.3*sin(uTime*9.)*(1. - fold); }
          else { float a = iB.x + uTime*iB.y*12./iA.w; c = iA.xyz + uEsc*iB.w + vec3(cos(a), 0., sin(a))*iA.w; c.y += 2.5*sin(uTime*0.6 + iB.z*30.);
            vec2 dc = mod(c.xz - cameraPosition.xz + 260., 520.) - 260.; sz = (1. - smoothstep(170., 215., length(dc)))*(1. - uThin*step(iB.z, 0.85))*(1. - smoothstep(95., 135., length(dc))*step(0.4, iB.z));      // the air is a block 520 m square round the eye; a bird is knitted on as it comes within 215 m
            float dl = length(dc), dn = sqrt(dl*dl + 676.);
            vec2 hv = uHeroAt.xz - cameraPosition.xz; sz *= 1. - smoothstep(0.9, 0.955, dot(dl > 1e-3 ? dc/dl : vec2(0., 1.), hv/max(length(hv), 1e-3)))*uHeroAt.y*(1. - lead);      // none wheels in front of the Needles and the ball while they are far off
            sz *= smoothstep(22., 34., distance(c.xz, cameraPosition.xz));      // and none flaps in the bow's face: a bird is let go as the yoal comes within about 30 m of it
            c.y = max(c.y, cameraPosition.y + 9.*(1. - smoothstep(30., 48., dn)));
            hd = a + 1.5708*sign(iB.y); float gl = smoothstep(0.2, 0.8, sin(uTime*0.5 + iB.z*40.)); flap = mix(0.5*sin(uTime*7. + iB.z*50.), 0.12, gl); }
          // chevron: wings swept back, flapping; folded: one column of stitches, head down
          vec3 fw = vec3(cos(hd), 0., sin(hd)), sd = vec3(-fw.z, 0., fw.x);
          vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
          float span = 0.6 + 0.4*abs(dot(sd, cr));                              // the chevron narrows as the bird turns away
          float S = max(uS, distance(c, cameraPosition)*uPx*3.0/span)*sz*(1. + 0.15*lead);        // a stitch is never under about 3 px: far birds are small flecks, and the bay has its depth
          vec2 l = vec2((aK + position.x)*S*span, (-ak*(0.5 + flap) - position.z)*S);
          vec2 fl = vec2(position.x*S, (-aK - position.z)*S);
          vec2 q = mix(l, fl, fold);
          vec3 w = c + cr*q.x + cu*q.y;
          vC = ak > 3.5 ? uTip : (ak < 0.5 ? uHead : uBody); vW = w; vN = cameraPosition - c; vUv = vec2(uv.x, 1. - uv.y);
          gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vW, vN, vC; varying vec2 vUv;
        void main(){
          // one stitch: the two legs of a knit V drawn as yarn (apex down), the deeper lot in the gap between them, nothing outside
          vec4 s1 = yarnSeg(vUv, vec2(0.5, 0.1), vec2(0.23, 0.92), 0.19), s2 = yarnSeg(vUv, vec2(0.5, 0.1), vec2(0.77, 0.92), 0.19);
          vec4 b = s1.z > s2.z ? s1 : s2; float d2 = min(dot(s1.xy, s1.xy), dot(s2.xy, s2.xy));
          if (d2 > 2.6 && !(vUv.y > 0.35 && abs(vUv.x - 0.5) < 0.27*vUv.y)) discard;
          float fw = fwidth(vUv.y), ply = smoothstep(0.55, 0.95, abs(sin((b.w*2.2 + b.x*0.3)*TAU)))*(1. - smoothstep(0.03, 0.08, fw))*step(0.001, b.z);
          vec3 N = vN/max(length(vN), 1e-4), V = N; float dist = length(cameraPosition - vW);
          N = mix(N, uSunDir, 0.5); N = N/max(length(N), 1e-4);                                // small bright things: mostly their pigment
          float rec = max(1. - smoothstep(0., 0.55, b.z), ply*0.45);
          gl_FragColor = vec4(toScene(woolShadeR(vC*(0.82 + 0.18*b.z), N, N, V, rec, dist)), 1.);
        }`,
    });
    const birds = new THREE.Mesh(birdGeo, birdMat(null)); birds.frustumCulled = false; scene.add(birds);
    const DIVES = [0.057, 0.125, 0.205], divers = DIVES.map((du, i) => { const m = new THREE.Mesh(birdBase, birdMat(diveU[i])); m.frustumCulled = false; scene.add(m); return m; });
    const diveAt = DIVES.map((du, i) => path.pointAt(du + 0.062, new THREE.Vector3()).add(new THREE.Vector3(i === 1 ? 15 : -10 - i*2, 0, 0)));      // 28 m ahead when it goes in
    tick.push((dt, time, camera, u) => {
      birdThin.value = smoothstep(0.42, 0.52, u); birdHero.value.y = 1 - smoothstep(0.3, 0.4, u); path.pointAt(Math.min(u + 0.034, 1), birdEsc.value); birdEsc.value.y = 220*smoothstep(0.31, 0.39, u);      // the escort climbs away before the mouth of the burn
      for (let i = 0; i < 3; i++) {
        const t = (u - DIVES[i])/0.03, d = diveU[i].uDive.value, s = seaU.uDive.value[i];        // t 0..1: stoop; then the bump travels
        const fall = smoothstep(0.25, 1, t);
        d.set(diveAt[i].x - 14*(1 - smoothstep(0, 1, t)), lerp(26, -3, fall*fall), diveAt[i].z - 10*(1 - smoothstep(0, 1, t)), smoothstep(0.15, 0.45, t));
        divers[i].visible = t > -1.5 && t < 1.02;
        s.set(diveAt[i].x, diveAt[i].z, t > 1 ? (t - 1)*0.03*DURATION/1.45 : -9, 0);
      }
    });
    await ctx.yield();

    // ---------- unspun fleece: torn wisps racing over from behind us, and what the croft chimneys pay out ----------
    const NW_ = Math.round(16*Math.max(detail, 0.7)), wispGeo = new THREE.InstancedBufferGeometry(), quad = new THREE.PlaneGeometry(1, 1, 6, 1);
    wispGeo.index = quad.index; wispGeo.setAttribute('position', quad.getAttribute('position')); wispGeo.setAttribute('uv', quad.getAttribute('uv'));
    const wA = new Float32Array((NW_ + 12)*4), wB = new Float32Array((NW_ + 12)*4);
    for (let i = 0; i < NW_; i++) { wA.set([rng.range(-260, 260), rng.range(38, 110), rng.range(0, 900), rng.range(60, 140)], i*4); wB.set([rng.range(34, 52)*gale, rng(), 0, rng.range(0.035, 0.07)], i*4); }
    const wisps = new THREE.Mesh(wispGeo, woolMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uOrigin: seaU.uOrigin },
      vertexShader: /* glsl */`
        attribute vec4 iA, iB; uniform vec3 uOrigin; varying vec2 vUv; varying float vSeed, vA;
        void main(){
          vec3 c = iA.xyz; float len = iA.w; vA = 1.;
          if (iB.z < 0.5) { c.z = uOrigin.z - 350. + mod(iA.z + uTime*iB.x - uOrigin.z + 350., 900.); c.x += uOrigin.x*0.6 + 0.36*(c.z - uOrigin.z); c.y = max(c.y + uOrigin.y*0.9, uOrigin.y + 24.);
            vA = 0.; len = 0.; }
          else { float t = fract(uTime*0.22*uGale + iB.y); c += uWind*t*26. + vec3(0., 1.5*t*(1. - 0.5*t), 0.); len *= 0.4 + 1.6*t; vA = (1. - t)*smoothstep(0., 0.1, t)*1.6; }
          vec3 along = normalize(uWind + vec3(0., 0.08*sin(uTime*0.7 + iB.y*20.), 0.)), toC = cameraPosition - c;
          vec3 up = normalize(cross(along, toC) + vec3(0., 1e-3, 0.));
          float wob = sin(position.x*5. + uTime*1.3 + iB.y*30.)*0.12;
          vec3 w = c + along*position.x*len + up*(position.y + wob)*len*iB.w;
          vUv = uv; vSeed = iB.y; gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUv; varying float vSeed, vA;
        void main(){
          float x = vUv.x, y = vUv.y - 0.5;
          float env = max(sin(x*3.14159265), 0.02)*(0.35 + 0.65*vnoise(vec2(x*5. + vSeed*31., vSeed*7.))), yy = y + 0.22*(vnoise(vec2(x*3.3 + vSeed*11., 2.)) - 0.5);
          float body = (1. - smoothstep(0.1, 0.5, abs(yy)/env*0.5))*smoothstep(0., 0.2, x)*(1. - smoothstep(0.7, 1., x));
          float fib = vnoise(vec2(x*3. + vSeed*17., y*26. + vSeed*9.))*0.6 + vnoise(vec2(x*9. - uTime*0.15, y*70.))*0.4;
          float a = body*(0.2 + 0.8*smoothstep(0.3, 0.8, fib + body*0.3))*0.5*vA;
          gl_FragColor = vec4(toScene(mix(uCream, vec3(0.93, 0.94, 0.95), 0.25 + 0.3*fib)), a);
        }`,
    }));
    wisps.frustumCulled = false; wisps.renderOrder = 4; scene.add(wisps);

    // two croft houses on the saddle skyline: grey moss-stitch walls, gabled fawn stocking-stitch roofs with eaves, black
    // doors and windows knitted in; each stands on a bluff of k2-p2 ribbing that runs from its doorstep down to the burn
    const metreUV = (g) => { const p = g.getAttribute('position'), n = g.getAttribute('normal'), uv = g.getAttribute('uv');
      for (let i = 0; i < p.count; i++) uv.setXY(i, Math.abs(n.getX(i)) > 0.6 ? p.getZ(i) : p.getX(i), Math.abs(n.getY(i)) > 0.9 ? p.getZ(i) : p.getY(i)*1.2); return g; };
    { const tp = new THREE.Vector3(), walls = [], roofs = [], trims = [], bluffs = [];
      const flat = (pts, uvs, idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
      for (let h = 0; h < 2; h++) {
        const p = CROFTS[h].clone(), HS = CROFT_SPEC[h][3], yaw = CROFT_SPEC[h][4], L = (13 - h*1.5)*HS, Wd = 6.4*HS, Hw = 4.6*HS, Hr = 3.6*HS, ov = 0.7*HS, m = Hr/(Wd/2); p.y -= 0.4;
        const w = metreUV(new THREE.BoxGeometry(L, Hw + 1.5, Wd)); w.translate(0, (Hw - 1.5)/2, 0);
        const ch = metreUV(new THREE.BoxGeometry(1.5*HS, Hr + 1.6*HS, 1.5*HS)); ch.translate(L/2 - 1.3*HS, Hw + (Hr + 1.6*HS)/2, 0);
        const X = L/2, gab = flat([-X, Hw, -Wd/2, -X, Hw, Wd/2, -X, Hw + Hr, 0, X, Hw, -Wd/2, X, Hw + Hr, 0, X, Hw, Wd/2],
          [-Wd/2, Hw*1.2, Wd/2, Hw*1.2, 0, (Hw + Hr)*1.2, -Wd/2, Hw*1.2, 0, (Hw + Hr)*1.2, Wd/2, Hw*1.2], [0, 1, 2, 3, 4, 5]);
        const XO = X + ov, ye = Hw - ov*m, yr = Hw + Hr + 0.05, ze = Wd/2 + ov, sl = Math.hypot(ze, yr - ye);
        const rf = flat([-XO, ye, ze, XO, ye, ze, -XO, yr, 0, XO, yr, 0, -XO, ye, -ze, XO, ye, -ze, -XO, yr, 0, XO, yr, 0],
          [-XO, 0, XO, 0, -XO, sl, XO, sl, -XO, 0, XO, 0, -XO, sl, XO, sl], [0, 1, 3, 0, 3, 2, 4, 7, 5, 4, 6, 7]);
        const door = new THREE.BoxGeometry(1.4*HS, 2.7*HS, 0.4); door.translate(0.5*HS, 1.35*HS - 0.3, -Wd/2);
        const tr = [door]; for (const sx of [-1, 1]) { const g = new THREE.BoxGeometry(1.3*HS, 1.3*HS, 0.4); g.translate(sx*L*0.31, 2.6*HS, -Wd/2); tr.push(g); }
        { const g = new THREE.BoxGeometry(0.4, 1.2*HS, 1.2*HS); g.translate(-X, 2.7*HS, 0); tr.push(g); }
        for (const g of [w, ch, gab, rf, ...tr]) { g.rotateY(yaw); g.translate(p.x, p.y, p.z); }
        walls.push(w, ch, gab); roofs.push(rf); trims.push(...tr);
        for (let k = 0; k < 6; k++) { const o = (NW_ + h*6 + k)*4; tp.set(L/2 - 1.3*HS, Hw + Hr + 1.9*HS, 0).applyAxisAngle(UP, yaw).add(p); wA.set([tp.x, tp.y, tp.z, 8*HS], o); wB.set([0, k/6 + h*0.07, 1, 0.3], o); }
        // the bluff: a skirt of real ribs round the doorstep, flaring to its foot under the hill's own stitches
        const c = CROFTS[h], cyw = Math.cos(yaw), syw = Math.sin(yaw), ths = [0], arc = [0];
        for (let i = 1; i <= 720; i++) { const t0 = (i - 1)/720*Math.PI*2, t1 = i/720*Math.PI*2, r0 = croftRho(h, t0, 6), r1 = croftRho(h, t1, 6);
          arc.push(arc[i - 1] + Math.hypot(r1*Math.cos(t1) - r0*Math.cos(t0), r1*Math.sin(t1) - r0*Math.sin(t0))); }
        const nCol = 4*Math.round(arc[720]/3.6), NA_ = nCol*3, NRW = 10;
        for (let i = 1, k = 1; i <= NA_; i++) { const want = arc[720]*i/NA_; while (k < 720 && arc[k] < want) k++; ths.push((k - (arc[k] - want)/Math.max(arc[k] - arc[k - 1], 1e-6))/720*Math.PI*2); }
        const bp = [], bst = [], bh = [], bi = [], ring = NRW + 2;
        for (let i = 0; i <= NA_; i++) {
          const th = ths[i], cl = Math.cos(th), sl = Math.sin(th), cs = cl*cyw + sl*syw, sn = -cl*syw + sl*cyw, Rt = croftRho(h, th, 1.8), Rb = croftRho(h, th, 9.5), col = (i/NA_)*nCol, rib = smoothstep(-0.45, 0.45, Math.cos(Math.PI*2*(col - 1)/4)) - 0.5;
          const top = c.y + 0.12, bot = Math.min(land(c.x + cs*Rb, c.z + sn*Rb) - 1.5, top - 0.2), H = top - bot;
          bp.push(c.x + cs*Rt*0.6, top + 0.02, c.z + sn*Rt*0.6); bst.push(col, -4); bh.push(H);
          for (let j = 0; j <= NRW; j++) { const t = j/NRW, r = Rt + (Rb - Rt)*t + 0.4*rib*Math.min(1, 0.25 + t*2), y = top - H*t*t*t;                  // a plinth: it stands proud of the hill and drops steeply at its foot
            bp.push(c.x + cs*r, y, c.z + sn*r); bst.push(col, t*Math.hypot(Rb - Rt, H)/0.9); bh.push(H); }
          if (i < NA_) for (let j = 0; j < ring - 1; j++) { const a = i*ring + j, b = a + ring; bi.push(a, a + 1, b, a + 1, b + 1, b); }
          if (i % 30 === 29) await ctx.yield();
        }
        const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('aSt', new THREE.Float32BufferAttribute(bst, 2));
        bg.setAttribute('aH', new THREE.Float32BufferAttribute(bh, 1)); bg.setIndex(bi); bg.computeVertexNormals(); bluffs.push(bg);
      }
      scene.add(new THREE.Mesh(mergeGeometries(walls), fabricMaterial({ pattern: 3, stitch: [0.9, 0.9], color: pal[3], stripe: [4, 0], stripeColor: '#' + grey.clone().lerp(cream, 0.55).getHexString() })));
      scene.add(new THREE.Mesh(mergeGeometries(roofs), fabricMaterial({ pattern: 0, stitch: [0.9, 0.9], color: pal[1], stripe: [3, 1], stripeColor: pal[2], side: THREE.DoubleSide })));
      scene.add(new THREE.Mesh(mergeGeometries(trims), fabricMaterial({ pattern: 1, stitch: [0.45, 0.45], color: BLACK })));
      const bluff = new THREE.Mesh(mergeGeometries(bluffs), woolMaterial({
        uniforms: landU, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec2 aSt; attribute float aH; varying vec3 vW, vN; varying vec2 vSt; varying float vH;
          void main(){ vW = position; vN = normal; vSt = aSt; vH = aH; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
        fragmentShader: LAND_FRAG + /* glsl */`
          varying vec3 vW, vN; varying vec2 vSt; varying float vH;
          void main(){
            vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
            float col = floor(vSt.x), pat = 2., rec = 0.; vec2 st = vSt; vec3 base;
            if (vSt.y > 0.) {
              if (vH + (hash11(col*3.7) - 0.5)*1.6 < 2.8) discard;                  // the bluff ends column by column where the hill comes up to the door
              if (floor(vW.y/0.9)*0.9 < landAt(vW.xz).x + 0.15) discard;           // and meets the hill row by row
              rec = step(2., mod(col, 4.))*0.3;
              base = mix(uGrey, uGrey*0.86, step(0.7, hash11(floor(st.y/6.) + 3.)));
              if (st.y < 1.) base = uCreamL;                                       // one cream row under the doorstep
            } else { pat = 3.; st = vW.xz/1.1; base = mix(uFawn, uMoorit, 0.3); }
            gl_FragColor = vec4(toScene(fabricShade(base, st, pat, 0.2, N, vW, rec)), 1.);
          }`,
      }));
      scene.add(bluff); for (const g of [...walls, ...roofs, ...trims, ...bluffs]) g.dispose();
    }
    wispGeo.setAttribute('iA', new THREE.InstancedBufferAttribute(wA, 4)); wispGeo.setAttribute('iB', new THREE.InstancedBufferAttribute(wB, 4)); wispGeo.instanceCount = NW_ + 12;
    await ctx.yield();

    // ---------- the exit: one live stitch of red yarn held open on a curved horn cable-needle ----------
    const exitG = new THREE.Group(); exitG.matrixAutoUpdate = false; path.frameAt(1, exitG.matrix, true); scene.add(exitG);
    {
      const R = 9.4, pts = [], leg = (sx) => [[sx*1.5, -18, -sx*0.7], [sx*1.3, -14.5, -sx*0.7], [sx*2.2, -11.6, -sx*0.6], [sx*3.6, -9.6, -sx*0.4]];
      for (const q of leg(-1)) pts.push(new THREE.Vector3(q[0], q[1], q[2]));
      for (let i = 0; i <= 44; i++) { const th = (-152 + 304*i/44)*Math.PI/180; pts.push(new THREE.Vector3(R*Math.sin(th), R*Math.cos(th), 0.5*Math.sin(th*0.5))); }
      for (const q of leg(1).reverse()) pts.push(new THREE.Vector3(q[0], q[1], q[2]));
      const sm = new THREE.CatmullRomCurve3(pts).getPoints(96);
      const loop = new THREE.Mesh(yarnTubeGeometry(sm, 0.8, 8), yarnMaterial({ color: PALETTE[6], plies: 3, slide: 0.12 })); exitG.add(loop);
      const lf = [], redC = C(PALETTE[6]);
      for (let i = 0; i < Math.round(70*detail); i++) { const p = sm[rng.int(8, 88)], n = new THREE.Vector3(p.x, p.y, 0).normalize().multiplyScalar(rng.chance(0.75) ? 1 : -1); n.z = rng.range(-0.5, 0.5); n.normalize();
        lf.push({ p: p.clone().addScaledVector(n, 0.75), n, len: rng.range(0.5, 1.1), w: rng.range(1.0, 1.9), color: redC }); }
      const lfm = new THREE.Mesh(fuzzGeometry(lf), fuzzMaterial()); lfm.frustumCulled = false; lfm.renderOrder = 3; exitG.add(lfm);
      // the cable-needle: horn, 40 m, a shallow crook in the middle where the stitch sits, a point at each end
      const prof = [[0, 0], [0.25, 0.4], [0.62, 3.5], [0.7, 8], [0.7, 32], [0.62, 36.5], [0.25, 39.6], [0.001, 40]].map((q) => new THREE.Vector2(q[0], q[1]));
      const ng = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(40), 12); ng.rotateZ(-Math.PI/2); ng.translate(-20, 0, 0);
      const np = ng.getAttribute('position'); for (let i = 0; i < np.count; i++) { const x = np.getX(i), b = Math.exp(-x*x/40); np.setY(i, np.getY(i) + 2.4*(1 - b) - 0.0025*x*x); }
      ng.computeVertexNormals();
      const horn = new THREE.Mesh(ng, woodMaterial({ color: HORN, dark: HORN_DARK })); horn.rotation.y = Math.PI/2 + 0.2; horn.position.set(0, R - 1.5, 2); exitG.add(horn);
    }
    await ctx.yield();

    // ---------- the rare event: a dropped stitch ladders the new headland, and a horn crochet hook works it back up ----------
    const hookG = new THREE.Group(); hookG.visible = false; scene.add(hookG);
    {
      const prof = [[0.01, 0], [1.8, 1.5], [2.5, 6], [1.9, 12], [2.5, 20], [3.1, 60], [3.1, 112], [4.2, 116], [1.9, 119.6], [0.01, 120]].map((q) => new THREE.Vector2(q[0], q[1]));
      const hg = new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(50), 12); hg.rotateZ(-Math.PI/2);
      const hp = hg.getAttribute('position');            // crook the first 9 m back on itself: the hook
      for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), y = hp.getY(i); if (x < 10) { const a = (10 - x)/10*2.5, r = 5.5 - y; hp.setXY(i, 10 - Math.sin(a)*r, 5.5 - Math.cos(a)*r); } }
      hg.computeVertexNormals();
      hookG.add(new THREE.Mesh(hg, woodMaterial({ color: HORN, dark: HORN_DARK })));
    }
    const DROP_RIB = 8, dropP = new THREE.Vector3(), hookDir = new THREE.Vector3(), hookQ = new THREE.Quaternion(), XAX = new THREE.Vector3(1, 0, 0);
    if (rare) tick.push((dt, time, camera, u) => {
      // the ladder runs down in four seconds (u 0.665..0.725 at the crest's pace), then is worked back up to the needle by u 0.97
      const run = smoothstep(0.665, 0.725, u), mend = smoothstep(0.75, 0.97, u), depth = u > 0.66 ? 172*run*(1 - mend) : 0;
      hero.setDrop(DROP_RIB, depth);
      const swing = smoothstep(0.70, 0.755, u), away = (1 - swing);
      hookG.visible = u > 0.69 && u < 0.995;
      hero.ribPoint(DROP_RIB, Math.max(depth, 6), dropP); dropP.z += 5 + 3*Math.sin(time*2.1)*swing; hero.object.localToWorld(dropP);
      hookDir.set(0.62 + 0.9*away, 0.4 + 0.4*away, 0.68).normalize().transformDirection(hero.object.matrixWorld);
      hookG.quaternion.setFromUnitVectors(XAX, hookDir); hookQ.setFromAxisAngle(hookDir, 0.5*Math.sin(time*2.1)); hookG.quaternion.premultiply(hookQ);
      hookG.position.copy(dropP).addScaledVector(hookDir, 150*away*away);
    });

    // ---------- true stitches round the keel: real yarn Vs on the hill's own lattice, in a window that follows the eye ----------
    // (each V lies exactly on the V the land shader knits there, takes the same wool, and is scaled in over the last 7 m)
    let winTufts = null;
    const TUBE_R = 0.32, NEAR_R = 13, WIN_R = LWIN_R;
    const winU = { ...landU, uNearC: { value: new THREE.Vector3() }, uTubeR: { value: TUBE_R }, uNearOn: { value: 1 } };
    {
      // two gauges of the same V on the same cells: within NEAR_R of the eye a round strand (8 sides, blunt tucked ends), beyond it a lighter one
      // (cells from the middle outward, so that while the window is being knitted on only the cells it has reached are drawn: instanceCount, in update)
      const disc = (rc) => { const a = []; for (let j = -rc; j <= rc; j++) for (let i = -rc; i <= rc; i++) if (i*i + j*j <= rc*rc) a.push([i, j]); a.sort((p, q) => (p[0]*p[0] + p[1]*p[1]) - (q[0]*q[0] + q[1]*q[1])); return new Float32Array(a.flat()); };
      const cellsFar = disc(Math.ceil(WIN_R/1.5)), cellsNear = disc(Math.ceil(NEAR_R/1.5) + 1);
      const WIN_SHOW = /* glsl */`
            vec2 cell = floor(vec2(dot(uCtr.xz, LR), dot(uCtr.xz, LC))/1.5) + aCell;
            vec2 cc = (LR*(cell.x + 0.5) + LC*(cell.y + 0.5))*1.5;
            vec4 Lc = landAt(cc); float ny = 1./sqrt(1. + dot(Lc.zw, Lc.zw)), pat, nyC = landNy(cc) + (lh2(cell + 0.7) - 0.5)*0.05;
            float under = step(4., Lc.y), spur = gSpur; vec3 col = landCell(cell, Lc.x + 6.*step(ny, 0.78), Lc.y - 8.*under, nyC, pat);      // (the cream hem lies on the strand only: up a bank its stitches would stand as cream blades)
            float show = (1. - under)*step(0.42, nyC)*step(STEEP_NY, ny + (lh2(cell + 0.7) - 0.5)*0.05)*(1. - (1. - spur)*step(43., Lc.x)*step(Lc.x, 57.)*step(ny, 0.9));
            float knit = pat < 0.5 ? 1. : (pat > 2.5 ? step(mod(cell.x + cell.y, 2.), 0.5) : (pat > 1.5 ? step(mod(cell.x, 4.), 1.5) : step(mod(cell.y, 2.), 0.5)));
            float purl = 1. - knit, rib = step(1.5, pat)*step(pat, 2.5);                    // a purl bump: the same yarn lying across the stitch (sunk, in a rib's groove)
            vec2 gq = (cc - vec2(${GX0}., ${GZ0}.))/${GS}.; show *= step(1., gq.x)*step(gq.x, ${GNX - 1}.)*step(1., gq.y)*step(gq.y, ${GNZ - 1}.);
            show *= 1. - step(1.5, pat)*step(pat, 2.5)*smoothstep(-0.8, 0., distance(cc, cameraPosition.xz) - 36. - 6.*lh2(cell + 8.3));      // (rib on a shoulder is real yarn only near the eye; beyond, the shader's clean columns)
            float nearSel = uNearOn*step(distance(cc, uNearC.xz), ${NEAR_R.toFixed(1)});
            float edge = (${(WIN_R - 2.5).toFixed(1)} - 9.*lh2(cell + 4.4))*uWinGrow;      // the window's edge is ragged stitch by stitch: a stitch is whole or it is not there yet
            float sc = show*(1. - smoothstep(edge - 1.6, edge, distance(cc, uWinC.xz)));`;
      const stitchMesh = (sel, sides, rings, cells) => {
        const g = fatVGeometry(sides, rings, TUBE_R);
        g.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2)); g.instanceCount = cells.length/2;
        const m = new THREE.Mesh(g, woolMaterial({
          uniforms: { ...winU, uCtr: sel ? winU.uWinC : winU.uNearC, uSel: { value: sel } }, side: THREE.DoubleSide,
          vertexShader: LATT_GLSL + /* glsl */`
          attribute vec2 aCell, aT; attribute vec3 aOff; uniform vec3 uWinC, uNearC, uCtr; uniform float uTubeR, uSel, uNearOn, uWinGrow; varying vec3 vW, vN, vC, vUp; varying vec3 vUs;
          void main(){
            ${WIN_SHOW}
            sc *= max(knit, purl)*mix(nearSel, 1. - nearSel, uSel);
            float t = aT.x;
            vec2 pq = mix(position.xy, vec2(0.5 + (position.x - 0.5)*1.3, 0.56), purl); float lift = mix(position.z, 0.05 - 0.22*rib + (0.5 - 0.12*rib)*(1. - t*t), purl);
            vec2 ab = cell + pq, xz = (LR*ab.x + LC*ab.y)*1.5;
            vec4 L = landAt(xz);
            vec3 nrm = normalize(vec3(-L.z, 1., -L.w));
            vec3 Ta = normalize(vec3(LR.x, dot(L.zw, LR), LR.y)), Tb = normalize(vec3(LC.x, dot(L.zw, LC), LC.y));
            vec3 n = mix(Ta*aOff.x + Tb*aOff.y, Tb*aT.y, purl) + nrm*aOff.z;
            float fat = (0.92 + 0.2*lh2(cell + 3.7))*(1. + 0.15*purl)*min(pow(1. + dot(Lc.zw, Lc.zw), 0.4), 1.8);      // on a steep bank the rows stand further apart: fatter yarn closes them
            vec3 p = vec3(xz.x, L.x, xz.y) + nrm*lift + n*uTubeR*fat;
            p = mix(vec3(cc.x, Lc.x - 0.3, cc.y), p, sc);
            vW = p; vN = n; vC = col; vUp = nrm; vUs = vec3(uv, lh2(cell + 1.9)); gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
          }`,
          fragmentShader: FAT_GLSL + /* glsl */`
          varying vec3 vW, vN, vC, vUp; varying vec3 vUs;
          void main(){
            vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
            gl_FragColor = vec4(toScene(fatYarn(vC, N, vUp/max(length(vUp), 1e-4), V, vUs.xy, vUs.z, dist)), 1.);
          }`,
        }));
        m.frustumCulled = false; scene.add(m); return m;
      };
      const stitches = stitchMesh(1, 6, FATV_FAR, cellsFar), stitchesNear = stitchMesh(0, 8, FATV_NEAR, cellsNear), g = stitches.geometry; let winN = 1;
      // ... and every one of those Vs wears its tuft (one card a stitch, on the same lattice, in the stitch's own wool)
      const tg = new THREE.InstancedBufferGeometry();
      tg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0], 3)); tg.setIndex([0, 1, 2, 2, 1, 3]);
      tg.setAttribute('aCell', g.getAttribute('aCell')); tg.instanceCount = g.instanceCount;
      winTufts = new THREE.Mesh(tg, tuftMaterial(LATT_GLSL + /* glsl */`
        attribute vec2 aCell; uniform vec3 uWinC; uniform float uWinGrow;
        void tuft(out vec3 root, out vec3 d, out vec3 col, out vec2 cr, out float seed, out float aMul){
          vec2 cell = floor(vec2(dot(uWinC.xz, LR), dot(uWinC.xz, LC))/1.5) + aCell;
          vec2 cc = (LR*(cell.x + 0.5) + LC*(cell.y + 0.5))*1.5;
          vec4 Lc = landAt(cc); float ny = 1./sqrt(1. + dot(Lc.zw, Lc.zw)), pat, nyC = landNy(cc) + (lh2(cell + 0.7) - 0.5)*0.05;
          float under = step(4., Lc.y), spur = gSpur; col = landCell(cell, Lc.x + 6.*step(ny, 0.78), Lc.y - 8.*under, nyC, pat);
          float show = (1. - under)*step(0.42, nyC)*step(STEEP_NY, ny + (lh2(cell + 0.7) - 0.5)*0.05)*(1. - (1. - spur)*step(43., Lc.x)*step(Lc.x, 57.)*step(ny, 0.9));
          show *= pat < 0.5 ? 1. : (pat > 2.5 ? step(mod(cell.x + cell.y, 2.), 0.5) : (pat > 1.5 ? step(mod(cell.x, 4.), 1.5)*step(distance(cc, cameraPosition.xz), 35. + 6.*lh2(cell + 8.3)) : step(mod(cell.y, 2.), 0.5)));
          vec2 gq = (cc - vec2(${GX0}., ${GZ0}.))/${GS}.; show *= step(1., gq.x)*step(gq.x, ${GNX - 1}.)*step(1., gq.y)*step(gq.y, ${GNZ - 1}.);
          float h = lh2(cell + 9.1);
          vec2 ab = cell + vec2(h < 0.5 ? 0.17 : 0.83, 0.8), xz = (LR*ab.x + LC*ab.y)*1.5;
          vec4 L = landAt(xz); vec3 nrm = normalize(vec3(-L.z, 1., -L.w));
          root = vec3(xz.x, L.x, xz.y) + nrm*0.6;
          d = nrm*(0.34 + 0.34*lh2(cell + 1.3)) + (LR*(lh2(cell + 4.3) - 0.5) + LC*(lh2(cell + 6.1) - 0.5)).xyy*vec3(0.5, 0., 0.5);
          vec3 tc = cameraPosition - root; float face = dot(nrm, tc)/max(length(tc), 1e-3);
          show *= step(0.12, lh2(cell + 2.9))*(1. - smoothstep(0.12, 0.34, face));      // (a bank that faces the eye still has a lip against the sky)
          cr = vec2(position.x*(1.1 + 0.6*h), position.y); seed = lh2(cell + 5.7);
          aMul = show*step(distance(cc, uWinC.xz), (${(WIN_R - 2.5).toFixed(1)} - 9.*lh2(cell + 4.4))*uWinGrow - 1.6);
        }`, pxU, { near: [3, 6.5], far: [20, 34], minPx: 3, grow: 1.5, hairW: 0.3, maxPx: 18, hairs: 9, alpha: 0.85, uniforms: winU }));
      winTufts.frustumCulled = false; winTufts.renderOrder = 3; scene.add(winTufts);
      // The hand-over from the Sound to the shore has no swap: while the yoal comes in, the sea's real stitches and the hill's are
      // both there, and each stitch decides by the ground under it (a sea stitch is let go where the land comes up, a land stitch
      // is knitted on from the middle of its window outward). A whole set is only put away when it is out of sight.
      tick.push((dt, time, camera, u) => { const landOn = u > 0.352, seaOn = u < 0.455, nearBanks = u > 0.17 && u < 0.5;
        realNear(nearBanks); realZU.value = nearBanks ? 300 : 336;
        stitches.visible = winTufts.visible = landOn; stitchesNear.visible = u > 0.415; winU.uNearOn.value = u > 0.415 ? 1 : 0; /* (until then the few land stitches within the near gauge's reach are in the middle gauge) */ landU.uWinK.value = winU.uWinGrow.value = smoothstep(0.352, 0.385, u);
        { const rc = ((WIN_R - 2.5)*winU.uWinGrow.value + 2.6)/1.5, r2 = rc*rc, nAll = cellsFar.length/2; let n = winN;      // the cells the window has reached (they are in order of radius)
          while (n < nAll && cellsFar[n*2]*cellsFar[n*2] + cellsFar[n*2 + 1]*cellsFar[n*2 + 1] <= r2) n++;
          while (n > 1 && cellsFar[n*2 - 2]*cellsFar[n*2 - 2] + cellsFar[n*2 - 1]*cellsFar[n*2 - 1] > r2) n--;
          winN = n; stitches.geometry.instanceCount = tg.instanceCount = n; }
        slopBumps.position.y = 0.07*Math.sin(time*1.9);
        bumpsNear.visible = seaVs.visible = seaKnit.visible = seaTufts.visible = bumps.visible = seaOn; bumpRings.visible = u < 0.36; ringK.value = 1 - smoothstep(0.325, 0.358, u); });
    }
    await ctx.yield();
    // ==== UPDATE ====
    const camPos = new THREE.Vector3(), camDir = new THREE.Vector3(), size = new THREE.Vector2(), _m = new THREE.Matrix4(), _e = new THREE.Euler(), _q = new THREE.Vector3();
    let sinceIn = 5;
    const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _mi = new THREE.Matrix4(), heroBalls = [[0, 100, 0, 150], [-193, 40, 6, 95], ...[-320, -240, -160, -80, 0, 80, 160, 240, 320].map((x) => [x, 160, 0, 75])].map(([x, y, z, r]) => new THREE.Sphere(new THREE.Vector3(x, y, z).applyMatrix4(hero.object.matrixWorld), r));      // the piece, the ball, the two needles
    function update(dt, time, camera, u) {
      camPos.setFromMatrixPosition(camera.matrixWorld);
      ctx.renderer.getDrawingBufferSize(size);
      const e5 = Math.max(camera.projectionMatrix.elements[5], 0.1);
      skyU.uPxDeg.value = 2*Math.atan(1/e5)*57.2958/Math.max(size.y, 64); pxU.value = SU.uPxS.value = 2/(e5*Math.max(size.y, 64));
      seaU.uOrigin.value.copy(camPos); seaU.uNearS.value.copy(camPos).addScaledVector(camDir, 6); seaNear.material.uniforms.uOrigin.value.copy(camPos);
      skyU.uUnder.value = 1 - smoothstep(0, 0.06, u);
      landU.uStep.value = Math.floor(time*2); landU.uTurn.value = (u > 0.455 && u < 0.56) || (u > 0.2 && u < 0.33) ? 1 : 0;
      hero.setClock(1 + 0.42*flightT(u));                   // a loop cast off every 2.4 s of flight: half the row is off at the crest
      hero.update(dt, time, camera);
      // while the yoal is at the mouth of the burn and in the gorge the Needles are behind the eye or behind the hill: they are not drawn
      // when their whole bounding ball is outside the view (the frame cost of that stretch is the shore's own stitches)
      if (u > 0.415 && u < 0.6) hero.object.visible = false;      // (in the gorge the hill stands between)
      else if (u > 0.3 && u < 0.7) { _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, _mi.copy(camera.matrixWorld).invert())); let seen = false; for (const b of heroBalls) if (_fr.intersectsSphere(b)) { seen = true; break; } hero.object.visible = seen; } else hero.object.visible = true;
      // the yoal: carried by the camera, lifted over every garter row, then passed up the cable crossing by crossing
      {
        const onCable = smoothstep(0.38, 0.43, u)*(1 - smoothstep(0.61, 0.67, u)), sea = 1 - smoothstep(0.37, 0.42, u);
        const ph = Math.PI*(camPos.z - rowSpeed*time)/SEA_ST, s = u*path.length/13.5*Math.PI*2;
        const pitch = 0.022*sea*Math.cos(ph) + 0.012*onCable*Math.sin(s*2), roll = 0.012*sea*Math.sin(ph*0.5 + 1) + 0.05*onCable*Math.sin(s) + 0.01*Math.sin(time*0.9);
        const heave = 0.07*sea*Math.sin(ph) + 0.05*onCable*Math.sin(s*2 + 1);
        // the boat heads along the course; where the gaze turns off it (a point of interest, a bend) the prow slides aside in the frame
        let yawB = 0;
        if (u > 0) { path.tangentAt(u, _lt); const me = camera.matrixWorld.elements; let dy = Math.atan2(_lt.x, _lt.z) - Math.atan2(-me[8], -me[10]);
          dy = Math.atan2(Math.sin(dy), Math.cos(dy)); yawB = 0.8*clamp(dy, -0.32, 0.32); }
        // Seen through the previous portal nothing is carried (the engine would slice it at the opening); once we are across
        // the prow comes up into the bottom of the frame over the first second.
        // (it is put out of sight by its matrix, not by .visible, so its programs are compiled with the rest before we arrive)
        const thr = !!ctx.through; sinceIn = thr ? 0 : Math.min(sinceIn + dt, 5);
        _m.makeRotationFromEuler(_e.set(pitch, yawB, roll)); _q.copy(BOW).applyMatrix4(_m); _m.setPosition(_q.x, _q.y + heave - 1.3*(1 - smoothstep(0, 0.9, sinceIn)), _q.z);
        if (thr) boat.matrix.makeScale(1e-4, 1e-4, 1e-4).setPosition(camPos.x, -400, camPos.z); else boat.matrix.multiplyMatrices(camera.matrixWorld, _m);
        boat.matrixWorldNeedsUpdate = true;
      }
      camDir.set(-camera.matrixWorld.elements[8], 0, -camera.matrixWorld.elements[10]); if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, 1); camDir.normalize();
      winU.uNearC.value.copy(camPos).addScaledVector(camDir, 11);
      winU.uWinC.value.copy(camPos).addScaledVector(camDir, lerp(44, 18, smoothstep(0.405, 0.47, u)));      // coming in from the Sound the window reaches ahead to the shore
      for (const f of tick) f(dt, time, camera, u, camPos);
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(0, 3, 0), projectionMatrix: new THREE.Matrix4().makePerspective(-1, 1, 0.6, -0.6, 1, 100) }, 0);

    const poiA = new THREE.Vector3(), poiC = new THREE.Vector3(), poiD = new THREE.Vector3(), poiE = new THREE.Vector3(), poiT = new THREE.Vector3();
    return {
      scene, path, duration: DURATION, pace,
      title: rare ? 'Cast Off: The Dropped Stitch' : mohair ? 'Cast Off: A Mohair Day' : colourway === 2 ? 'Cast Off: Winter Colourway' : 'Cast Off',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 9000, lookAhead: 34, sway: 0.5, bank: 0.2 },      // nearThrough: the Sound lies behind the entry too, so the opening shows sea to its foot
      pois: [
        // Until the second yoal has crossed the bow the eye looks down the course (the ball, the piece on its needles, the red sail and
        // the Banks whole in one frame); then it turns right off the bow to the Banks (the band of walkers, the laddered rib, the other
        // yoal running along their foot) far enough that the Needles are plainly out of the frame, not cut by its edge, and holds
        // there to the cream mound at the mouth of the burn.
        // (from there the eye goes to the other yoal as she comes in to lie off the mound, and comes back to the course as the gorge wall closes off the bay)
        { at: (time, u) => { const k = smoothstep(0.28, 0.34, u), z = clamp(path.pointAt(clamp(u, 0, 1), poiA).z + lerp(38, 32, k), CZ0 + 12, 372); poiA.set(cliffX[Math.round((z - CZ0)/CSTEP)] + 1, lerp(20, 9, k), z);
          y2At(u, poiT).setY(8); return poiA.lerp(poiT, smoothstep(0.345, 0.385, u)); }, from: 0.18, to: 0.428, weight: 0.92, fade: 0.2 },
        { at: [CROFTS[0].x, CROFTS[0].y + 5, CROFTS[0].z], from: 0.48, to: 0.6, weight: 0.4 },                            // the crofts on the saddle
        { at: () => poiC.set(-70, 95, 0).applyMatrix4(hero.object.matrixWorld), from: 0.62, to: 0.88, weight: 0.8 },      // the ball, the Needles and the piece, whole
        { at: () => poiD.copy(hero.crossing).lerp(hero.anchors.ball, 0.4).setY(170).applyMatrix4(hero.object.matrixWorld), from: 0.82, to: 0.95, weight: 0.2 },
        // down the north arm the eye is tipped up off the course, so the ball, the piece and its cast-off chain stay whole above the exit stitch
        { at: (time, u) => { path.pointAt(clamp(u, 0, 1), poiE); path.tangentAt(clamp(u, 0, 1), poiT); const l = Math.hypot(poiT.x, poiT.z) || 1; return poiE.set(poiE.x + poiT.x/l*100, poiE.y + 37, poiE.z + poiT.z/l*100); }, from: 0.86, to: 1.0, weight: 0.45 },
      ],
      portal: { shape: 'circle', radius: 7, color: pal[0], glow: 0.25, revealDistance: 260, tilt: true, blendDistance: 25 },
      // flat pigments: the engine skips its tone map, so every wool colour written is the colour on screen; nothing glows
      post: { exposure: EXPOSURE, flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.06, grain: 0, aberration: 0 } },
      update,
      dispose() { hero.dispose(); bumpBase.dispose(); ringBase.dispose(); quad.dispose(); for (const g of loose) g.dispose(); },
    };
  },
};
