// STRIPES OF APRIL (pastel-bulb-fields): the style kit (makeStyle) and the hero, THE POLDER UNDER THE CUMULUS.
//
// THE LAW: soft pastel on toothed black paper. Nine sticks, no mixing; no line (an edge is where a stroke stops);
// a mark is a side-stroke, a dab or a smear, each real geometry carrying its own tooth; shadow is paper: nothing
// dark is drawn, black things are left out; distance is finger-blending, never haze; nothing is lit, fogged or
// bloomed. The medium moves by being drawn and rubbed out.
//
// const style = await makeStyle(ctx, { palette, exposure = 2, wind: [x, z], finger = 900, paper })   (ASYNC)
//   ONE instance for the whole world. `exposure` must equal the world's post.exposure: inks are inverted through
//   ACES at that exposure and capped so no shader writes above 1.0 (at exposure 2 white lands near #F0EEE8; at
//   exposure 1 it is a grey 226). World post: bloom strength 0, neutral grade, style 'none'.
//   style.pal     { paper, scarlet, rose, orange, cream, lilac, green, cerulean, white, lavender } linear Colors
//   style.U       shared uniforms { uTime, uTooth, uCloud[5], uWind, uGust, uFinger, uGhost, uPx }, driven by
//   style.update(dt, time, camera)   call once a frame (the hero calls it only when it made the style itself)
//   style.wind    Vector2, unit WORLD xz the wind blows toward (shadows, dust, grass and gusts all go this way)
//   style.batch() -> b;  b.add(a, b, width, colour, { lay, bow, strength, kind, phase, period, off, seed, pivot })
//        a, b: [x, y, z] heel and tip.  lay 1 = flat on the ground (off = comb offset of its row, +-12 m),
//        lay 0 = faces the eye (off = metres the tip sways downwind).  kind 0 side-stroke (heavy heel, dry
//        tail, ragged edges, tooth), 1 smear, 2 dab, 3 trail, 4 blended band.  period > 0: the stroke is laid heel
//        to tip in about a second, stands, thins and is laid again for ever (phase 0..1).  strength = pressure.
//        b.mesh({ shade (true: cloud shadows rub it out), finger (true: softens beyond uFinger), grain (1),
//        sky, field + stripes + parcels + stripeMap, spin + axle + spinUniform, add (lighten-blend smear) })
//        -> ONE draw call.
//   style.dab(list, x, y, z, height, width, colour, off) then  await style.dabs(list, { far, lean })   (ASYNC)
//        single upright triangles with a dab mask that nod, fade in under `far` metres and go out with their row.
//   style.paper({ side })   the black unlit material: ground, dykes, mill bodies, hulls (a mill is a hole in the sky)
//   style.sky({ blue, drag, band, density, lean })   Group: paper dome + about 600 scumble strokes + the horizon
//        smudges; follows the eye by itself.  style.heap(batch, { center, width, height, toward, lumps, strokes })
//        heaps a cloud (returns { discs } for style.paperDiscs(discs), its paper backing): the nine small cumulus.
//   style.dust(rows, { cloud, range })   flecks raised behind the tips where cloud `cloud`'s trailing edge cuts
//        each row.  rows: [{ p: [x, y, z], dir: [dx, dz], off, c }].
//   style.setCloud(i, x, z, a = 130, b = 210, auto)   shadow i: world centre, half-length along / half-width
//        across the wind (park unused ones at z = 1e6; auto = drift at style.windSpeed inside style.range of
//        style.home).  style.setGust(x, z, radius, strength)   the thumb-smear.
//   How the law is kept: black is geometry (paper meshes + discard), coverage = pressure x ragged edge compared
//   with the tooth texture in the stroke's own uv (octave picked per axis from fwidth, so it speckles at every
//   distance without moire); shadow = coverage x (1 - shadow) down to a 1/12 ghost, +15 % fresh behind a trailing
//   edge, each row offset so the edge is a comb; far stripes blend into a mip-mapped stripe texture, then into
//   whole parcels of one stick, at 2/3 strength with soft edges.
//
// const hero = await buildHero(ctx, { style, palette, detail = 1, sky, canal = true, sailcloth = 'scarlet',
//                                     crop ('tulip' | 'hyacinth' | 'daffodil', seeded), bandCloud = 1 })
//   Local space: origin on the canal axis at water level where the bend ends and the embankment runs straight;
//   the eye travels -Z (FRONT is +Z), polder floor at y -7, ring dyke and upland (the world's) behind z = +100.
//   The wind in hero space is (-0.766, 0.643): place the hero so that this maps onto style.wind
//   (world entry heading +Z, wind toward -Z: rotation.y = -130 degrees, origin at the path's 252 m point).
//   Contains: 200-330 stripes as about 3,000 field strokes + 35k tulip dabs within 80 m of the embankment, the
//   embankment and bend (paper) with canal strokes, the mill dyke, seven mills (the first 40 m, red cloth, on the
//   bank at the bend start), grass hatch, sheep, the cumulus (950, 110..1160, -2150), the band of bare paper with
//   its comb and dust, and (when no style is passed, or sky: true) the sky.  Extent 3.1 km; radius/height/center
//   are only the framing of the stand-alone viewer.  Camera far must be >= 3600.
//   anchors (local): entry / entryHeading (bend start), flyThrough (eye line at y 3.2: bend, then straight to the
//   bridge; nothing within 7 m), portalSeat { position [0, 3.2, -173], facing +Z, radius 7 }, reveal, firstMill,
//   millRow (hubs), cumulus, bandCrossing, wind, floorY.  hero.stripes [{ x, w, c, kind, off }], hero.mills.
//   hero.setProgress(p): band from over mills three to five (0), across the embankment at z -100 (bare paper there
//   for p 0.28..0.62), to gone (1). Without it the band loops on the clock. Or drive style.setCloud yourself.
//   Cost: about 125k triangles, 13 draw calls, 250 ms build, no lights.
// Second polish: buildHero opts.lane [x0, x1, zNear, zFar] (local) leaves that strip without the small tulip dabs (the world plants
//   big tulips there); hero.field is the field-stroke mesh (the world lowers field.material.uniforms.uNear when it flies low, so
//   the strokes near the lens thin to a dusting). THE LAW AT THE PIXEL: a stroke, dab, trail or band writes its stick whole or
//   leaves the paper (only a kind 1 smear is soft); the hand-over to the far parcels is speckled, never blended; where the far
//   field has no ink the stroke is discarded so the paper floor shows (no second black on tinted paper); a gust drags, widens
//   and dries strokes but never blurs them; the band (kind 4) takes the tooth, so the ring's rim is a ragged stroke.
// Added by the world builder: makeStyle opts.extra { orange, lilac, lavender } (restrikes the three extra sticks for
// Improve round (the eye over the land): polder floor at y -14, the embankment a 9 m canal between thin banks that fall
//   sheer to the floor (stripes begin 6.6 m from the axis), dyke mills 30-37 m, buildHero opts.upland (the world's upland
//   level; the ring dyke stands a metre over it), mesh({ cap }) (0.5: a rounded heel and a narrowing tail on side-strokes;
//   sky and fields use it), far parcels widen with distance to the side and keep full colour (pbFar), the horizon band is
//   pure sticks. The viewer's eye line is y 6 (anchors below still say 3.2).
//   another hour); style.sky({ low: [sticks] }) (a low layer restruck in other sticks); style.dabs(list, { local: true })
//   (tooth anchored to the mesh, for things that travel); buildHero opts.canalGap (default true: the ring dyke is left
//   open where the world's canal comes through). The embankment's bank top is 0.3 m and its top grass is short, so the
//   polder shows from the barge.
// Polish round: (1) TOOTH IN THE BODY OF EVERY MARK: a side-stroke is cut against the tooth at 0.8 of its pressure, with more
//   streak than speckle, so about a fifth of the paper shows at mid-stroke (uGrainK < 1 still makes a heavier hand: cumulus).
//   Distance softens edges and thins a stroke but never dims it; a line too narrow for tooth is a firm line of the stick and
//   breaks into dots when thinner than a pixel or rubbed out. (2) THE GHOST is a dusting of the stick at full colour (about a
//   grain in ten of strokes, dabs and far parcels), never a darker mark. (3) THE FAR FIELD goes straight from drawn strokes to
//   the parcel map (eight rows, each merging the last in pairs; unfiltered), cut against a world-anchored tooth: a few broad
//   smears of one stick each, a cloud shadow a toothed bite of paper. (4) Mills near the eye are DRAWN: buildHero opts
//   millLit / millShade / millBrick (sticks for the boards in sun, the shade side, the brick below the gallery); the mill dyke
//   bends and its mills stand at growing intervals so every sail cross is seen apart; lattice is dropped once thinner than a
//   pixel; sail trails are the sky's white dragged dry. The ring dyke and the mound are grassed.
// Third polish: CHALK AT THE STROKE'S OWN SCALE. mesh({ streak }) (default 0.7, the sky 1): every side-stroke wide enough on
//   screen is crossed by dry streaks of paper about a sixth of its width running along it (a fifth of the body, least at the
//   heel, most toward the tail), its rim is frayed and its tail broken by a coarse grain, all looked up in the stroke's own uv
//   so they stay put on it; a dab (kind 2) takes the tooth and a frayed rim too. The low 16 degrees of sky are fuller. The far
//   parcels (pbFar) bow with a long wave where we look along the rows and their edges are ragged by the tooth's blotch at about
//   a dozen pixels (pbBlotG), so no far band is ruled.
// Fourth polish (a value order, and the sails' shadow): THE SKY SITS BACK. In the SKY variant every stroke above the low sky
//   lets about half the paper through (dry streaks a sixth of its width and a coarse grain that eats its rim), the lowest band
//   over the horizon is fuller, and style.sky({ low }) keeps the restruck sticks under 8 degrees. heapCloud({ open: 1 }): longer
//   arcs with a gap before the next, narrower, so the strokes of a heap can be told apart (the cumulus and the small clouds).
//   mesh({ rag: 1 }) (uRag): short broad strokes with wandering sides, a frayed rim and a long dry tail (grass pulled down a
//   bank; the first mill's mound is now three narrow ragged pulls where each broad one was). THE SAILS' SHADOW: buildHero opts
//   bladeSun (WORLD direction the light travels) + bladeGround (world y) + bladeStrength throw the first mill's four blades on
//   the ground as four bars of bare paper turning with the cross (COMMON pbBlade; style.U.uBlade / uBladeM / uBladeS). A mark
//   standing upright is taken whole (worked out at its foot in the vertex shader), a mark on the ground and a dab are cut where
//   the bar lies, and a mark is stroked back a little heavier behind the bar. Off (strength 0) unless bladeSun is given.
// Coverage round (the picture as twelve small stills): THE FIELDS ARE SOLID BANDS. The floor itself draws every stripe as one
//   unbroken band of its stick (PAPER_FRAG with FLOOR: style.bandMap(stripes, x0, x1, warp, waver) -> paper({ near, nearMap,
//   rowBox, row, far })); paper shows as fine grain, as the ditch line between two bands, under a cloud shadow or a blade's bar,
//   and as the dry tip that runs along each band as it is laid again (26 m/s, each band in its own time). In uRowBox a band is
//   the leaves of big single tulips: leaf green flecked with the stick, a paper line between rows (uRow). The field strokes are
//   built (hero.field) but not shown; hero.floor is the band floor. THE SKY IS ONE LAY OF BLUE on the dome (SKY_FRAG): white
//   dragged over its low part, fine grain, the hour's sticks as a low band of strokes. CLOUDS ARE WHOLE: a white body
//   (paper({ color })) under the heaped strokes, orange and rose beneath; the cumulus is 1700 m wide. DYKES ARE GRASSED BODIES
//   (paper({ color, grain, dir, band, bandColor })): leaf green pulled down the slope with a flowering verge along the foot
//   (buildHero opts.verge, opts.vergeColor); the canal's trough stays paper.
import * as THREE from 'three';

const PALETTE = ['#0E0D10', '#E23A2C', '#F4A0B5', '#F5E08C', '#5FA356', '#3F9BD8', '#F7F3EA'];
const EXTRA = { orange: '#F58B30', lilac: '#B48BD8', lavender: '#9E9CDA' };
const SEG = 6;                       // segments in one stroke ribbon (12 triangles)

// hex -> the linear value that leaves the post chain (ACES at exposure e, neutral grade) as that hex
function ink(hex, e = 1, gain = 1) {
  const inM = [[.59719, .35458, .04823], [.07600, .90834, .01566], [.02840, .13383, .83777]];
  const outM = [[1.60475, -.53108, -.07367], [-.10208, 1.10813, -.00605], [-.00327, -.07276, 1.07602]];
  const mul = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const fit = (v) => v.map((x) => (x * (x + .0245786) - .000090537) / (x * (.983729 * x + .4329510) + .238081));
  const t = new THREE.Color(hex), want = [t.r * gain, t.g * gain, t.b * gain]; let c = want.slice();
  for (let i = 0; i < 200; i++) {
    const o = mul(outM, fit(mul(inM, c.map((x) => x * e / 0.6))));
    c = c.map((x, k) => Math.min(0.87, Math.max(0, x + (want[k] - Math.min(1, Math.max(0, o[k]))) * 0.6)));   // capped: fresh strokes peak at 1.0
  }
  return new THREE.Color().setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace);
}

// The tooth of the paper: a tiling 256 x 256 texture. R = grain (speckle), G = streak (long along u),
// B = a slow blotch for ragged edges. Each channel is equalised so "tooth < coverage" lets through exactly
// that share of pigment.
async function makeTooth(ctx, rng) {
  const N = 256, data = new Uint8Array(N * N * 4);
  const lattice = (nx, ny) => { const a = new Float32Array(nx * ny); for (let i = 0; i < a.length; i++) a[i] = rng(); return { a, nx, ny }; };
  const samp = (L, x, y) => {       // tiling smooth value noise; x, y in lattice cells
    const x0 = Math.floor(x), y0 = Math.floor(y); let fx = x - x0, fy = y - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const i0 = ((x0 % L.nx) + L.nx) % L.nx, i1 = (i0 + 1) % L.nx, j0 = ((y0 % L.ny) + L.ny) % L.ny, j1 = (j0 + 1) % L.ny;
    const a = L.a[j0 * L.nx + i0], b = L.a[j0 * L.nx + i1], c = L.a[j1 * L.nx + i0], d = L.a[j1 * L.nx + i1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  const defs = [
    [lattice(64, 64), lattice(128, 128), 0.55, lattice(16, 16), 0.3],   // grain
    [lattice(6, 96), lattice(12, 128), 0.5, lattice(3, 40), 0.35],      // streak: long in x
    [lattice(8, 8), lattice(16, 16), 0.4, lattice(4, 4), 0.2],          // blotch
  ];
  for (let ch = 0; ch < 3; ch++) {
    const [A, B, wb, C, wc] = defs[ch], v = new Float32Array(N * N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const u = x / N, w = y / N;
        v[y * N + x] = samp(A, u * A.nx, w * A.ny) + wb * samp(B, u * B.nx, w * B.ny) + wc * samp(C, u * C.nx, w * C.ny);
      }
      if (y % 32 === 31) await ctx.yield();
    }
    // equalise with a 1024-bin histogram (no sort: cheap)
    let lo = Infinity, hi = -Infinity; for (let i = 0; i < v.length; i++) { if (v[i] < lo) lo = v[i]; if (v[i] > hi) hi = v[i]; }
    const bins = new Float32Array(1025), k = 1024 / Math.max(1e-6, hi - lo);
    for (let i = 0; i < v.length; i++) bins[Math.min(1023, Math.floor((v[i] - lo) * k)) + 1]++;
    for (let i = 1; i <= 1024; i++) bins[i] += bins[i - 1];
    await ctx.yield();
    for (let i = 0; i < v.length; i++) data[i * 4 + ch] = Math.round(255 * bins[Math.min(1023, Math.floor((v[i] - lo) * k)) + 1] / v.length);
    await ctx.yield();
  }
  for (let i = 0; i < N * N; i++) data[i * 4 + 3] = 255;
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// GLSL shared by every material of the style: uniforms, the shadow field and the tooth.
const COMMON = /* glsl */`
  uniform float uTime, uFinger, uGhost;
  uniform sampler2D uTooth;
  uniform vec4 uCloud[5];          // world xz of the centre, half-length along the wind, half-width across it
  uniform vec2 uWind;              // unit world xz the wind blows toward
  uniform vec4 uGust;              // world xz, radius, strength 0..1
  float pbHash(float n){ return fract(sin(n * 12.9898 + 4.137) * 43758.5453); }
  // x: how far the drawing is rubbed out here (0..1); y: freshness just behind a trailing edge (0..1)
  vec2 pbShadow(vec2 p, float off, float rag){
    float s = 0., f = 0.;
    vec2 w = uWind, c = vec2(-uWind.y, uWind.x);
    for (int i = 0; i < 5; i++) {
      vec4 C = uCloud[i];
      vec2 d = p - C.xy;
      float al = dot(d, w) + off, qa = al / max(C.z, 1.), qb = dot(d, c) / max(C.w, 1.);
      float m = (1. - sqrt(qa * qa + qb * qb)) * min(C.z, C.w) + rag;      // metres inside the edge
      s = max(s, smoothstep(-1.5, 1.5, m));
      f = max(f, step(m, 0.) * exp(min(m, 0.) * 0.14) * (1. - smoothstep(-0.2, 0.1, qa)));
    }
    return vec2(s, f);
  }
  float pbGust(vec2 p){ vec2 d = (p - uGust.xy) / max(uGust.z, 1.); return uGust.w * exp(-dot(d, d)); }
  // THE SAILS' SHADOW (fourth polish): the first mill's four blades thrown on the bank as four bars of bare paper that turn
  // with the sails. uBlade: world xz of the hub's shadow, the sails' angle, strength; uBladeM: ground offset -> the sail
  // plane (two rows); uBladeS: a blade's bar, across (from, to) and along (from, to), metres in the sail plane.
  // x: rubbed out here (0..1); y: just stroked back behind the bar's trailing edge (0..1)
  uniform vec4 uBlade, uBladeM, uBladeS;
  vec2 pbArm(vec2 a){
    float al = smoothstep(uBladeS.z - 1., uBladeS.z + 1., a.y) * (1. - smoothstep(uBladeS.w - 1., uBladeS.w + 1., a.y));
    float s = smoothstep(uBladeS.x - 0.35, uBladeS.x + 0.35, a.x) * (1. - smoothstep(uBladeS.y - 0.35, uBladeS.y + 0.35, a.x));
    return vec2(s, step(uBladeS.y, a.x) * exp(-max(a.x - uBladeS.y, 0.) * 0.45)) * al;
  }
  vec2 pbBlade(vec2 p){
    if (uBlade.w < 1e-3) return vec2(0.);
    vec2 d = p - uBlade.xy, q = vec2(dot(uBladeM.xy, d), dot(uBladeM.zw, d));
    float cs = cos(uBlade.z), sn = sin(uBlade.z);
    q = vec2(q.x * cs + q.y * sn, q.y * cs - q.x * sn);
    vec2 m = max(max(pbArm(q), pbArm(vec2(q.y, -q.x))), max(pbArm(-q), pbArm(vec2(-q.y, q.x))));
    return m * uBlade.w;
  }
  // pigment taken by the paper. m: the stroke's own uv in metres, fwm: fwidth(m) taken by the caller, cov: the
  // wanted coverage, soft: 1 for a smear. The grain is anchored in the stroke but picks its octave per axis from
  // the pixel footprint, so black speckles through a stroke at every distance and never moires.
  float pbGrain(vec2 uv){ vec2 t = textureLod(uTooth, uv, 0.4).rg; return mix(t.r, t.g, 0.56); }   // more streak than speckle: the paper shows in dry lines along the stroke
  float pbToothG(vec2 m, vec2 fwm){
    vec2 L = log2(max(fwm, vec2(1e-4)) * 200.);          // metres per tooth tile, as a power of two
    vec2 l0 = floor(L), f = L - l0, s0 = exp2(-l0), s1 = s0 * 0.5;
    float g = mix(mix(pbGrain(m * s0), pbGrain(m * vec2(s1.x, s0.y)), f.x),
                  mix(pbGrain(m * vec2(s0.x, s1.y)), pbGrain(m * s1), f.x), f.y);
    float mid = 4. * max(f.x * (1. - f.x), f.y * (1. - f.y));
    return clamp((g - 0.5) * (1.2 + 0.5 * mid) + 0.5, 0., 1.);
  }
  // the slow blotch of the tooth at about a dozen pixels, anchored like the grain: what makes a far band's edge the hand's
  float pbBlot(vec2 uv){ return textureLod(uTooth, uv, 0.).b; }
  float pbBlotG(vec2 m, vec2 fwm){
    vec2 L = log2(max(fwm, vec2(1e-4)) * 110.);
    vec2 l0 = floor(L), f = L - l0, s0 = exp2(-l0), s1 = s0 * 0.5;
    return mix(mix(pbBlot(m * s0), pbBlot(m * vec2(s1.x, s0.y)), f.x), mix(pbBlot(m * vec2(s0.x, s1.y)), pbBlot(m * s1), f.x), f.y);
  }
  // cov: the pressure the tooth is cut against (a full press of the side of the stick still leaves a fifth of the paper);
  // covS: the strength of a smear (soft 1), which is pigment moved by a finger and takes no tooth
  float pbTooth(vec2 m, vec2 fwm, float cov, float covS, float soft){
    float g = pbToothG(m, fwm);
    float hard = smoothstep(-0.07, 0.07, cov * 1.08 - g * 0.88 - 0.02);
    return mix(covS, hard, 1. - soft);
  }
`;

const FAR = /* glsl */`
  // the far field as the finger leaves it: a few broad parcels, each ONE stick at full colour (looked up unfiltered, so a pixel
  // is one stick or paper), merged in pairs with distance (the rows of the parcel map) so that none is thinner than about six
  // pixels; their edges waver and are cut against the tooth, and a cloud shadow is a bite of bare paper with a toothed edge,
  // inside which a dusting of the stick remains. l: local xz, wp: world xz, x0 / inv: the parcel map. Returns the ink.
  vec3 pbFar(vec2 l, vec2 wp, float x0, float inv, sampler2D parcels){
    vec2 fw = max(fwidth(l), vec2(1e-3));
    float foot = fw.x;
    // (sixth round) the hand-over from one row of the parcel map to the next is no ruled line across the polder: it wanders
    // with the tooth's slow blotch, so a far band ends in a ragged run, never on a square step
    float k = clamp(ceil(log2(foot * 0.15) + (pbBlot(l * vec2(0.011, 0.0043) + 0.31) - 0.5) * 1.5), 0., 7.);   // parcels of 40 m x 2^k: six pixels or more
    float amp = min(foot * 3., 70.) * (1. - smoothstep(40., 120., fw.y));            // no wobble where a pixel spans its whole wave
    float wob = (sin(l.y * 0.011 + 2. * sin(l.x * 0.004)) * 0.6 + sin(l.y * 0.027 + 1.3 + l.x * 0.002) * 0.4) * amp;
    // (third polish) seen along the rows a pixel spans the short waves, and the bands came out ruled: a longer wave of the
    // hand takes over there, so a far band still bows by a few pixels and misses its neighbour
    float amp2 = min(foot * 3.4, 150.) * smoothstep(30., 110., fw.y) * (1. - smoothstep(260., 700., fw.y));
    wob += (sin(l.y * 0.0031 + 1.7 * sin(l.x * 0.0012) + 0.6) * 0.65 + sin(l.y * 0.0058 + 2.1 + l.x * 0.0009) * 0.35) * amp2;
    wob += (pbBlotG(l.yx + 37., fw.yx) - 0.5) * min(foot * 3.8, 170.);                 // and its edge is ragged by a few pixels at every distance
    vec4 c = texture2D(parcels, vec2((l.x + wob - x0) * inv, (k + 0.5) / 8.));
    float g = pbToothG(l.yx, fw.yx);                                                  // dry streaks run along the rows
    float ed = min(c.a, 1. - c.a) * 2.;                                               // 0 at a parcel's edge, 1 down its middle
    // (coverage round) A SOLID BAND: the stick pressed hard, the paper showing as fine grain (about a pixel in fourteen) and
    // as a dry ragged line where one parcel meets the next; a cloud shadow leaves a dusting
    vec2 sf = pbShadow(wp, 0., (g - 0.5) * min(foot * 5., 60.));
    float lo = mix(0.42, 0.07, smoothstep(0., 0.1, ed)), hi = mix(1.01, 0.085, sf.x);
    return c.rgb * step(lo, g) * step(g, hi);                                         // the stick whole, or paper
  }
`;

// THE STROKE: one instanced ribbon. Defines: SKY (anchored to the eye, drawn at the far plane), FIELD (a
// ground stripe that finger-blends into the stripe texture with distance), SPIN (rotates about aPivot: sails).
const STROKE_VERT = /* glsl */`
  attribute vec3 aA, aB, aCol;
  attribute vec4 aMisc;            // width (m), bow (m), seed, lay * 2 + strength (lay 0 faces the eye, 1 flat on the ground)
  attribute vec4 aLife;            // phase, period (0 = permanent), comb offset (lay 1) or tip sway (lay 0), kind (0 stroke 1 smear 2 dab 3 trail)
  #ifdef SPIN
  attribute vec4 aPivot;           // hub (local xyz), phase; aA / aB are (x, y) in the sail plane, z along the axle
  uniform vec3 uAxle; uniform float uSpin;
  #endif
  uniform float uPx;               // world size of a pixel at distance 1
  varying vec2 vUv; varying vec3 vDim; varying vec3 vCol; varying vec4 vW; varying vec4 vLife; varying vec3 vK; varying vec2 vLoc; varying vec3 vBl;
  ${COMMON}
  void main(){
    float u = position.x, v = position.y, lay = step(1.5, aMisc.w), strength = aMisc.w - 2. * lay;
    vec3 a = aA, b = aB;
    #ifdef SPIN
      float ang = uSpin * aPivot.w + aPivot.w * 37.;
      float cs = cos(ang), sn = sin(ang);
      vec3 ax = normalize(uAxle + vec3(0., 0., 1e-5)), rx = normalize(cross(vec3(0., 1., 0.), ax) + vec3(1e-5, 0., 0.));
      a = aPivot.xyz + rx * (a.x * cs - a.y * sn) + vec3(0., 1., 0.) * (a.x * sn + a.y * cs) + ax * a.z;
      b = aPivot.xyz + rx * (b.x * cs - b.y * sn) + vec3(0., 1., 0.) * (b.x * sn + b.y * cs) + ax * b.z;
    #endif
    #ifdef SKY
      vec3 A = cameraPosition + a, B = cameraPosition + b;
    #else
      vec3 A = (modelMatrix * vec4(a, 1.)).xyz, B = (modelMatrix * vec4(b, 1.)).xyz;
    #endif
    vec3 d = B - A; float len = length(d); vec3 dir = d / max(len, 1e-4);
    vec3 P = A + d * u;
    vec3 eye = cameraPosition - P; float dist = length(eye);
    #ifdef SPIN
      vec3 side = normalize(cross(normalize(mat3(modelMatrix) * ax), dir) + vec3(1e-5, 2e-5, 0.));    // in the sail plane
    #else
      vec3 side = lay > 0.5 ? normalize(cross(vec3(0., 1., 0.), dir) + vec3(1e-5, 0., 2e-5))
                            : normalize(cross(dir, eye) + vec3(1e-5, 2e-5, 0.));
    #endif
    float hw = 0.5 * aMisc.x * (1. - 0.28 * u * u * u), g = 0.;
    P += side * aMisc.y * sin(3.14159 * u);
    #if !defined(SKY) && !defined(SPIN)
      if (lay > 0.5) { g = pbGust(P.xz); P.xz += uWind * 1.5 * g; hw *= 1. + 0.7 * g; }
      else { P.xz += uWind * (0.5 + 0.5 * sin(uTime * 2.3 + aMisc.z * 40.)) * aLife.z * u * u; }   // lay 0: aLife.z = sway (m) at the tip
    #endif
    float hmin = 0.8 * uPx * dist, fade = 1.;
    if (hw < hmin) { fade = hw / max(hmin, 1e-5); hw = hmin; }
    #ifdef SPIN
      if (aLife.z > 0.5) hw *= smoothstep(0.55, 0.75, fade);             // the lattice is drawn only where the stick can draw it
    #endif
    P += side * hw * v;
    // being laid: the tip runs heel to tip, the stroke stands, thins, and is laid again
    float prog = 2., thin = strength, fresh = 0.;
    if (aLife.y > 0.) {
      float c = fract(uTime / aLife.y + aLife.x);
      prog = c * aLife.y / 0.9;                           // about a second to lay
      thin *= 1. - smoothstep(0.72, 1., c);
      fresh = exp(-c * aLife.y * 0.8);
    }
    vUv = vec2(u, v); vDim = vec3(len, 0.5 * aMisc.x, fade); vCol = aCol;
    vW = vec4(P.xz, dist, lay > 0.5 ? aLife.z : 0.); vLife = vec4(prog, thin, fresh, aLife.w); vK = vec3(aMisc.z, g, position.z);
    // the sails' shadow takes an upright mark whole (a petal, a leaf, a whip goes out at once, each a little before or after
    // its neighbour); a mark laid on the ground is cut where the bar lies (z = -1: worked out per pixel)
    vBl = vec3(0., 0., -1.);
    #if !defined(SKY) && !defined(SPIN)
      if (lay < 0.5) vBl = vec3(pbBlade(A.xz + (aMisc.z - 0.5) * vec2(1.3, 0.9)), 1.);
    #endif
    #ifdef SKY
      vW.w = (P.y - cameraPosition.y) / max(length(P - cameraPosition), 1.);      // the sine of its height over the horizon
    #endif
    vec4 p = projectionMatrix * viewMatrix * vec4(P, 1.);
    #ifdef SKY
      if (abs(p.w) < 1e-4) p.w = 1e-4;
      p = p.xyww; p.z *= 0.99995;
    #endif
    gl_Position = p;
    #ifdef FIELD
      vec3 sl = normalize(cross(vec3(0., 1., 0.), b - a) + vec3(1e-5, 0., 0.));
      vLoc = vec2(mix(a.x, b.x, u) + sl.x * (aMisc.y * sin(3.14159 * u) + hw * v), mix(a.z, b.z, u));   // local xz: the stripe texture's axes
    #else
      vLoc = vec2(0.);
    #endif
  }
`;

const STROKE_FRAG = /* glsl */`
  varying vec2 vUv; varying vec3 vDim; varying vec3 vCol; varying vec4 vW; varying vec4 vLife; varying vec3 vK; varying vec2 vLoc; varying vec3 vBl;
  uniform float uShade, uStrength, uNear, uFingerK, uGrainK, uCap, uStreak, uRag;
  #ifdef FIELD
  uniform sampler2D uStripes, uParcels; uniform vec2 uStripeMap;      // local x0, 1 / span
  #endif
  ${COMMON}
  #ifdef FIELD
  ${FAR}
  #endif
  void main(){
    float u = vUv.x, v = vUv.y, kind = vLife.w;
    vec2 mu = vec2(u * vDim.x, v * vDim.y) + vK.x * vec2(73.1, 31.7);
    vec2 fw = fwidth(mu);
    float wpx = 2. * vDim.y / max(fw.y, 1e-4);                             // the stroke's width in pixels
    float e = texture2D(uTooth, vec2(u * vDim.x / max(vDim.y * 9., 1e-3) + vK.x * 3., vK.x * 5.3 + v * 0.07)).b;
    float fb = smoothstep(uFinger * 0.75, uFinger * 1.5, vW.z);            // the finger: distance
    fb *= uFingerK;
    // smears and bands are pigment moved by a finger (soft); strokes, dabs and trails take the tooth. Distance softens a
    // stroke's edges and thins it, but what is left is still the stick at full colour: a weak stick is paler, never darker
    float isSide = 1. - step(0.5, kind), smear = step(0.5, kind) * step(kind, 1.5);   // (a band, kind 4, takes the tooth too: the ring's rim is a ragged stroke, not a tube)
    float gst = min(1., vK.y * 1.6);                                       // under the thumb a stroke is dragged and widened and goes drier; it keeps its tooth (never a blur)
    float soft = smear;
    float thin = (1. - smoothstep(1.5, 4.5, wpx)) * (1. - smear);         // too narrow for tooth: a firm line of the stick
    float softE = max(soft, max(fb, thin));
    // a side-stroke has a rounded heavy heel and a tail that narrows as the stick lifts
    float hu = u * vDim.x / max(vDim.y, 1e-3);
    float capv = length(vec2(max(0., 1. - hu / max(uCap, 1e-3)) * step(1e-3, uCap), v)) / mix(1., 1. - 0.56 * uCap, smoothstep(0.78, 1., u));   // uCap 0: square
    // (third polish) CHALK AT THE STROKE'S OWN SCALE: the tooth above is picked per pixel (no moire) and so only pinholes a
    // broad stroke. A second look-up in the stroke's own uv gives dry streaks about a sixth of its width running along it
    // (stS) and a coarse grain that frays its rim and breaks its tail (gS); both stay put on the stroke at every distance.
    float isDab = step(1.5, kind) * step(kind, 2.5);
    float sw = uStreak * smoothstep(6., 14., wpx) * (1. - fb);
    float gS = texture2D(uTooth, vec2(hu, v) * 0.1 + vK.x * vec2(5.7, 9.3)).r;
    float stS = texture2D(uTooth, vec2(hu / 18. + vK.x * 9.1, v * 0.03 + vK.x * 3.7)).g;
    float av = mix(abs(v), capv, isSide) + (e - 0.5) * 0.34 * (1. - softE) + (gS - 0.5) * 0.3 * sw * isSide;
    // (fourth polish) uRag: a short broad stroke (grass pulled down a bank) is as ragged as a long one: its sides wander at
    // the stroke's own width, its rim is frayed by the coarse grain and its tail runs dry for the last third
    float e2 = texture2D(uTooth, vec2(hu * 0.13 + vK.x * 7.1, vK.x * 2.9 + v * 0.05)).b;
    av += ((e2 - 0.5) * 0.6 + (gS - 0.5) * 0.35) * uRag * isSide * (1. - thin);
    float edge = 1. - smoothstep(mix(0.6, 0.15, softE), 1., av);
    float press = mix(1.0, 0.55, smoothstep(0.04, 1., u));
    float tail = 1. - smoothstep(0.74 - 0.3 * uRag, 1.02, u + (e - 0.5) * 0.3);
    float heel = smoothstep(0., 0.012, u - (e - 0.3) * 0.02);
    float cov = edge * press * mix(0.18, 1., tail) * heel * (1. - smoothstep(0.985, 1., u));
    if (kind > 3.5) cov = edge;                                                         // a blended band, laid end to end
    else if (kind > 2.5) cov = edge * (1. - u) * sqrt(max(1. - u, 0.)) * 0.8;           // a trail dragged behind a moving thing: dry, all tooth
    else if (kind > 1.5) { vec2 q = vec2((u - 0.5) * 2., v); cov = 1. - smoothstep(0.45, 1., length(q) + (e - 0.5) * 0.5 + (gS - 0.5) * 0.4); }   // a press of the end of the stick: a frayed rim
    else if (kind > 0.5) cov = edge * sin(3.14159 * clamp(u, 0., 1.));
    cov *= uStrength * (1. - 0.3 * gst);
    // laid by the hand
    float tip = 1. - smoothstep(vLife.x - 0.05, vLife.x, u);
    cov *= tip * vLife.y;
    float boost = 0.15 * vLife.z;
    // rubbed out by a cloud shadow, stroked back in behind it: what is left is a dusting of the stick, about a grain in ten
    vec2 sh = vec2(0.), bl = vec2(0.);
    float ghost = 1., ghostS = 1.;
    if (uShade > 0.5) {
      sh = pbShadow(vW.xy, vW.w, (v * v - 0.5) * min(vDim.y, 6.) * 1.6 + (e - 0.5) * 5.);
      bl = vBl.z < 0. ? pbBlade(vW.xy) : vBl.xy;
      sh.y = max(sh.y, bl.y);
      ghost = mix(1., 4. * uGhost, sh.x); ghostS = mix(1., uGhost, sh.x);
      boost += 0.15 * sh.y;
    }
    cov = min(1., cov * (1. + 3. * boost)) * mix(1., 0.667, fb);
    #ifdef FIELD
      cov *= mix(uNear, 1., smoothstep(30., 80., vW.z));                    // the dabs take over near the eye
    #endif
    cov = mix(smoothstep(0.08, 0.34, cov), cov, uGrainK);                  // uGrainK < 1: a heavier hand, less paper showing
    // the side of the stick never fills the tooth: a fifth of the paper shows at mid-stroke, least at the heel, most in the tail
    float dry = mix(1., 0.8, isSide) - 0.14 * isDab;
    float covS = mix(cov * ghostS, smoothstep(0.1, 0.26, cov), thin);
    float a = pbTooth(mu, fw, cov * dry * ghost, covS, max(soft, thin));
    // a line too narrow for tooth is never dimmed: thinner than a pixel, or rubbed out by a shadow, it breaks into dots of the
    // stick like a dry line (the dots are anchored along the stroke)
    float oc = exp2(-floor(log2(max(fw.x, 1e-5) * 24.)));
    float dot1 = texture2D(uTooth, vec2(mu.x * oc * 0.125, vK.x * 7.3)).r;
    a *= step(dot1, min(mix(1.01, 0.22, sh.x * thin), vDim.z < 0.999 ? vDim.z * 1.25 - 0.1 : 1.01));
    // THE LAW AT THE PIXEL: a stroke, dab, trail or band writes its stick whole or leaves the paper; only a finger-smear is soft
    a = mix(step(0.5, a), a, smear);
    // under a blade's bar the mark is gone to bare paper (no dusting is left: the bar must read as paper at a glance); an
    // upright mark goes whole, a mark on the ground is cut along the bar with a grainy edge
    a *= step(bl.x, 0.35 + 0.3 * gS);
    // dry streaks of paper over about a fifth of the body (least at the heel, most toward the tail) and a tail broken into grain
    float dryK = mix(0.05, 0.2, smoothstep(0.03, 0.3, u)) + 0.3 * smoothstep(0.55, 1., u);
    float cut = max(step(stS, dryK * sw), step(gS, 0.75 * smoothstep(0.7, 1., u) * sw)) * isSide;
    cut = max(cut, step(gS, 0.17) * isDab * smoothstep(4., 9., wpx));           // a dab takes the tooth too: flecks of paper in it
    cut = max(cut, step(gS, 0.6 * smoothstep(0.5, 1., u) * uRag) * isSide * (1. - thin));
    #ifdef SKY
      // (fourth polish) THE SKY SITS BACK: scumble is thin pigment. Above the low sky each stroke lets about half the paper
      // through, as dry streaks a sixth of its width and a coarse grain that eats its rim away (so a stroke ends in grain, not
      // on an edge); the lowest band over the horizon is fuller, so the mills and the bridge keep blue behind them
      float open = smoothstep(0.1, 0.27, vW.w);
      float gC = texture2D(uTooth, vec2(hu, v) * 0.045 + vK.x * vec2(3.1, 7.7)).r;
      float skyCut = max(step(stS, mix(0.18, 0.36, open)), step(gC, mix(0.08, 0.18, open) + mix(0.45, 0.72, open) * smoothstep(0.32, 0.95, av)));
      cut = max(cut, skyCut * isSide * smoothstep(5., 10., wpx));
    #endif
    a *= 1. - cut;
    vec3 col = vCol * 0.87 * a;
    #ifdef FIELD
      vec2 suv = vec2((vLoc.x - uStripeMap.x) * uStripeMap.y, 0.5);
      float rel = fwidth(vLoc.x) / max(texture2D(uStripes, suv).a * 16., 0.5);          // pixels a stripe is wide, inverted
      vec3 far = pbFar(vLoc, vW.xy, uStripeMap.x, uStripeMap.y, uParcels);
      float kf = max(smoothstep(0.3, 0.42, rel), smoothstep(uFinger * 0.75, uFinger * 0.9, vW.z));   // past here the hand stops ruling stripes
      // the hand-over to the far parcels is speckled grain by grain, never a blend; where the far field has no ink the paper
      // floor shows (no second black on a tinted paper)
      if (kf > dot1 * 0.98 + 0.01) { col = far; a = step(1e-3, far.r + far.g + far.b); }
    #endif
    if (a < 0.035) discard;
    gl_FragColor = vec4(col, 1.);
  }
`;

// PAPER: what is not drawn. With FLOOR it is also the far field: stripes too fine to draw are finger-blended
// from the mip-mapped stripe texture (rgb = stick, a = stripe width / 16 m), so two hundred stripes never moire.
const PAPER_VERT = /* glsl */`
  varying vec3 vL; varying vec3 vWp; varying vec2 vAx;
  void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.); vWp = w.xyz; vAx = (modelMatrix * vec4(1., 0., 0., 0.)).xz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const PAPER_FRAG = /* glsl */`
  varying vec3 vL; varying vec3 vWp; varying vec2 vAx;
  uniform vec3 uPaper, uBack, uBandCol; uniform float uBodyGrain; uniform vec4 uBodyDir; uniform vec2 uBodyBand; uniform vec2 uBodyOpen; uniform float uPx;      // a body in a stick (a grassed dyke, water, a cloud): uBack shows through as grain
  #ifdef FLOOR
  uniform sampler2D uStripes, uParcels, uNearTex; uniform vec2 uStripeMap; uniform vec2 uStripeZ;
  uniform vec4 uNearMap;           // x0, 1 / span of the band map, warp (0: linear), waver (1: the upland's slow wave of the arm)
  uniform vec4 uRowBox;            // local x0, x1, z0, z1: where a band resolves into rows of plants (leaf green, the stick in flecks)
  uniform vec4 uRow;               // centre x, row period (0: none), the first row's distance from the centre, pressure of the row lines
  uniform vec3 uLeaf; uniform float uFarOn; uniform vec3 uRowCut;   // uRowCut (a, b, c): the rows stand only where a * x + b * z + c < 0 (this side of the mill dyke)
  #endif
  ${COMMON}
  #ifdef FLOOR
  ${FAR}
  // (sixth round) THE BAND OF BARE PAPER ON SOLID BANDS. Looked up on a band's own centre line, so the shadow's edge crosses
  // every band square and each band has its own comb offset. x: rubbed out; y: just stroked back behind the trailing edge
  // (the running tip); z: the stick running dry just ahead of the leading edge (the band goes out in a dry tail)
  vec3 pbBand(vec2 p, float off, float rag){
    float s = 0., f = 0., dr = 0.; vec2 w = uWind, c = vec2(-uWind.y, uWind.x);
    for (int i = 0; i < 5; i++) {
      vec4 C = uCloud[i]; vec2 d = p - C.xy;
      float al = dot(d, w) + off, qa = al / max(C.z, 1.), qb = dot(d, c) / max(C.w, 1.);
      float m = (1. - sqrt(qa * qa + qb * qb)) * min(C.z, C.w) + rag, tr = 1. - smoothstep(-0.2, 0.1, qa);
      s = max(s, step(0., m));
      f = max(f, step(m, 0.) * exp(min(m, 0.) * 0.05) * tr);
      dr = max(dr, step(m, 0.) * (1. - smoothstep(0., min(26., min(C.z, C.w)), -m)) * (1. - tr));
    }
    return vec3(s, f, dr);
  }
  #endif
  void main(){
    vec3 col = uPaper;
    #ifdef FLOOR
      // (coverage round) THE FIELDS ARE SOLID BANDS OF FLOWER COLOUR. Every stripe is one unbroken band of its stick pressed
      // hard: the paper shows through it only as fine grain, as the thin ditch line between two bands, and under a shadow.
      // Where the plants stand as single big tulips (uRowBox) the band is their leaves: rows of leaf green flecked with the
      // stick, a line of paper between rows. Far off the bands merge into parcels (pbFar), as before.
      vec2 l = vL.xz, fw = max(fwidth(l), vec2(1e-4));
      float dist = length(cameraPosition - vWp);
      float bl = pbBlotG(l.yx * 0.5 + 11., fw.yx * 0.5), g = pbToothG(l.yx, fw.yx);
      float x = l.x + (bl - 0.5) * min(0.5 + fw.x * 3., 5.);                 // the band's edge is the hand's: it wanders by a few pixels
      float ax = abs(x), wA = max(0., ax - 45.); wA = min(wA * wA / 1300., 120.) * uNearMap.w;
      x -= wA * (0.62 * sin(l.y * 0.021 + x * 0.004 + 0.8) + 0.38 * sin(l.y * 0.033 + 1.3 - x * 0.003));
      float t = uNearMap.z > 0. ? x / (1. + abs(x) / max(uNearMap.z, 1e-3)) : x;
      vec4 st = texture2D(uNearTex, vec2((t - uNearMap.x) * uNearMap.y, 0.25));
      vec4 st2 = texture2D(uNearTex, vec2((t - uNearMap.x) * uNearMap.y, 0.75));   // across the band 0..1, its width / 64 m, its comb offset
      float inZ = step(uStripeZ.x, l.y) * step(l.y, uStripeZ.y);
      float ink = step(0.1, st.a) * inZ;
      vec3 band = st.rgb;
      vec2 rb = l + (bl - 0.5) * 2.4;
      float inBox = step(uRowBox.x, rb.x) * step(rb.x, uRowBox.y) * step(uRowBox.z, rb.y) * step(rb.y, uRowBox.w) * step(0.75, st.a) * step(dot(uRowCut.xy, rb) + uRowCut.z, 0.);
      float fl = texture2D(uTooth, l * vec2(0.047, 0.026) + 0.21).r, fl2 = texture2D(uTooth, l * vec2(0.061, 0.033) + 0.63).r;
      if (inBox > 0.5) {
        // (sixth round) under the big single tulips the bed is PAPER: only flecks the size of a leaf, of leaf green and of the row's
        // own stick, lie on it, so every cup and leaf standing there is seen whole against the black
        band = fl < 0.3 ? uLeaf : st.rgb;
        if (fl >= 0.3 && fl2 > 0.2) ink = 0.;
        if (uRow.y > 0.) {
          float dc = abs(l.x - uRow.x + (pbBlot(l.yx * vec2(0.021, 0.09) + 0.4) - 0.5) * 0.5), rc = (dc - uRow.z) / max(uRow.y, 1e-3), dr = abs(fract(rc + 0.5) - 0.5) * uRow.y;
          float thin = 1. - smoothstep(0.12, 0.3, fw.x);                      // the line is dropped once thinner than a pixel
          if (dr > uRow.y * 0.5 - (0.1 + 0.1 * bl) * thin * uRow.w - 1e-4 && thin > 0.01) ink = 0.;
          if (dc < uRow.z - 0.62) ink = 0.;                                    // the ditch down the middle of the lane
        }
      }
      float acr = st2.r, bwid = st2.g * 64., ac2 = 2. * acr - 1.;
      vec2 pc = vWp.xz + vAx * ((0.5 - acr) * bwid);                          // this band's centre line
      vec3 sf = pbBand(pc, (st2.b - 0.5) * 60., (g - 0.5) * 2.5 + ac2 * ac2 * min(bwid, 14.) * 0.55);   // a tip is round: the stick's end
      vec2 bd = pbBlade(vWp.xz);
      // THE MEDIUM MOVES: every band is laid again as we watch. A tip runs along it (downwind, 26 m a second, each band in its own
      // time): for nine metres the stick drags dry and the paper shows in streaks, behind it the band stands a little heavier
      // for a while with no grain at all. Under the thumb of a gust the band goes dry too.
      float tp = mod(l.y + uTime * 26. + fract(st.a * 4.5536) * 1100., 1100.);
      float dryT = (1. - smoothstep(0., 9., tp)) * 0.62, fresh = smoothstep(9., 12., tp) * (1. - smoothstep(60., 110., tp));
      float tipF = step(0.45, sf.y);                                           // the running tip: a shade heavier, no grain at all
      float lo = max(0.07 * (1. - fresh) * (1. - tipF), max(max(dryT, 0.86 * sf.z * sf.z), 0.45 * pbGust(vWp.xz)));
      ink *= step(lo, g) * step(g, mix(1.01, 0.085, sf.x)) * step(bd.x, 0.35 + 0.3 * g);
      col = mix(uPaper, band, ink);
      vec2 suv = vec2((vL.x - uStripeMap.x) * uStripeMap.y, 0.5);
      float rel = fw.x / max(texture2D(uStripes, suv).a * 16., 0.5);
      float kf = max(smoothstep(0.3, 0.42, rel), smoothstep(uFinger * 0.75, uFinger * 0.9, dist));
      vec3 far = pbFar(vL.xz, vWp.xz, uStripeMap.x, uStripeMap.y, uParcels);
      if (uFarOn > 0.5 && kf > 0.3 + 0.4 * bl) col = uPaper + far * inZ;
    #else
      // a body in a stick. uBodyDir (a, b, k, on): the stick was pulled DOWN the slope, so its dry streaks run along the height
      // (a grassed flank); uBodyBand (y0, y1): a band of another stick along the foot, its edge the hand's (a flowering verge)
      vec2 bm = mix(vec2(vWp.x * 0.8 + vWp.y * 1.1 - vWp.z * 0.33, vWp.z * 0.8 + vWp.x * 0.45 + vWp.y * 0.5), vec2(vWp.y * uBodyDir.z, vWp.x * uBodyDir.x + vWp.z * uBodyDir.y), uBodyDir.w);
      vec2 bfw = max(fwidth(bm), vec2(1e-4));
      float bg = pbToothG(bm, bfw), bb = pbBlotG(bm.yx * 0.4 + 3., bfw.yx * 0.4), yb = vWp.y + (bb - 0.5) * 2.4;
      col = mix(uPaper, uBack, step(bg + 1e-3, uBodyGrain));
      // (sixth round) A GRASSED BODY IS DRAWN, not filled: the stick pulled DOWN the slope in separate strokes about a metre wide,
      // each with its own width, a heel at the top and a tail that runs dry, paper between them; far off they close into the
      // stick with its grain. THE VERGE is a line of single presses of another stick along the foot (far off, one dry line).
      float ac = vWp.x * uBodyDir.x + vWp.z * uBodyDir.y, fwa = max(fwidth(ac), 1e-4);
      if (uBodyDir.w > 0.5) {
        // no two strokes alike and none ruled: the cells bow and miss each other with a slow wave of the hand (anchored to the
        // ground), every stroke has its own width and length, one in seven is left out, and on a level top they break as well
        // (down a slope a stroke is measured by the height it falls; on a level top the strokes are a hatch of short pulls)
        vec3 fn = normalize(cross(dFdx(vWp), dFdy(vWp)) + vec3(0., 1e-6, 0.));
        float flatK = smoothstep(0.85, 0.97, abs(fn.y)), pc = vWp.z * uBodyDir.x - vWp.x * uBodyDir.y, ln = -vWp.y + pc * 2.2 * flatK;
        float nb = texture2D(uTooth, vec2(ac, ln) * 0.019 + 0.37).b, nb2 = texture2D(uTooth, vec2(ac * 0.043, ln * 0.031) + 0.11).b;
        float cx = ac / 1.15 + (nb - 0.5) * 1.1 + (nb2 - 0.5) * 0.5 + (bb - 0.5) * 0.4, ci = floor(cx), cf = fract(cx), h1 = pbHash(ci * 1.37 + 3.1), h2 = pbHash(ci * 2.91 + 7.7);
        float v = fract(ln / mix(3.5, 8., h2) + h1 * 3.7);                     // 0 at the heel (the top), 1 at the dry tail
        float sS = texture2D(uTooth, vec2(ln * 0.06 + h1 * 5., cx * 0.13)).g;
        float on = step(abs(cf - 0.5 - (h2 - 0.5) * 0.12) * 2. / mix(0.74, 1.0, h1) + (bg - 0.5) * 0.3 + 0.16 * v * v, 1.) * step(0.04 + 0.12 * v + 0.42 * smoothstep(0.78, 1., v), sS) * step(0.03, v) * step(0.07, fract(h1 * 7.3 + h2));
        float nearK = 1. - smoothstep(0.3, 0.6, fwa / 1.15);
        // (ninth round) THE BOARDS OF A BUILT THING (uBodyOpen (a, b) with b above 0; every other body has (0, 0) and keeps the
        // line above): the paper between boards shows only where a gap is wide enough to show. The mean gap is 0.13 of a cell
        // (a board fills 0.74 to all of it); it is measured in pixels of a 1080-line frame at the world's lens (62 degrees: a pixel
        // is 2 tan 31 / 1080 at distance 1), by uPx whatever the frame's own size, so a small still and a large screen open the
        // boards at the same place: from a pixels (shut) to b pixels (open).
        // Where its boards are shut such a body is the filled stick EXACTLY as a body that is not drawn has it (the grain on
        // the first line's own measure, the one a body with on = 0 reads), so far off a tower is live's picture to the pixel.
        if (uBodyOpen.y > 0.) {
          nearK = smoothstep(uBodyOpen.x, uBodyOpen.y, 0.13 * 1.15 * uPx / (fwa * (2. * 0.60086 / 1080.)));
          vec2 bm0 = vec2(vWp.x * 0.8 + vWp.y * 1.1 - vWp.z * 0.33, vWp.z * 0.8 + vWp.x * 0.45 + vWp.y * 0.5);
          col = mix(uPaper, uBack, step(pbToothG(bm0, max(fwidth(bm0), vec2(1e-4))) + 1e-3, uBodyGrain));
        }
        col = mix(col, mix(uBack, uPaper, on), nearK);
        if (uBodyBand.y > uBodyBand.x) {
          float px = ac / 1.5, pi = floor(px), p1 = pbHash(pi * 1.91 + 0.7), p2 = pbHash(pi * 3.3 + 5.1), y0 = uBodyBand.x + 0.9;
          vec2 pq = vec2((fract(px) - 0.5) / (0.3 + 0.12 * p2), (vWp.y - y0 - 0.5 - 1.1 * p1) / (0.55 + 0.35 * p2));
          float press = step(length(pq) + (bg - 0.5) * 0.5, 1.) * step(p2, 0.86);
          press = mix(press, step(abs(vWp.y - y0 - 0.9), 0.7) * step(0.35, bg), smoothstep(0.3, 0.6, fwa / 1.5));
          if (press > 0.5) col = uBandCol;
        }
      }
    #endif
    gl_FragColor = vec4(col, 1.);
  }
`;

// THE DAB: one press of the end of the stick, a single upright triangle that faces the eye and nods.
const DAB_VERT = /* glsl */`
  attribute vec2 aCorner; attribute vec3 aCol; attribute vec4 aDab;   // height, width, seed, comb offset
  uniform float uDabFar, uLean, uPx, uLocal;     // uLocal 1: tooth anchored to the mesh (things that travel), not the world
  varying vec2 vC; varying vec3 vCol; varying vec4 vD; varying vec2 vT;
  ${COMMON}
  void main(){
    vec3 base = (modelMatrix * vec4(position, 1.)).xyz;
    vec3 eye = cameraPosition - base; float dist = length(eye);
    vec3 right = normalize(cross(vec3(0., 1., 0.), eye) + vec3(1e-5, 0., 2e-5));
    float g = pbGust(base.xz);
    float nod = sin(uTime * (2.2 + aDab.z) + aDab.z * 40. + dot(base.xz, uWind) * 0.35);
    float dw = max(aDab.y, 0.55 * uPx * dist);
    vec3 P = base + right * aCorner.x * dw * (1. + g) + vec3(0., aCorner.y * aDab.x, 0.)
           + vec3(uWind.x, 0., uWind.y) * (0.07 * nod + 0.9 * g + uLean * aDab.x * (1. + 0.25 * nod)) * aCorner.y;
    vC = aCorner; vCol = aCol; vT = mix(base.xz, position.xz, uLocal);
    vD = vec4(base.xz, 1. - smoothstep(uDabFar * 0.6, uDabFar, dist), aDab.w);
    gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.);
    if (vD.z < 0.01) gl_Position = vec4(2., 2., 2., 1.);
  }
`;
const DAB_FRAG = /* glsl */`
  varying vec2 vC; varying vec3 vCol; varying vec4 vD; varying vec2 vT;
  ${COMMON}
  void main(){
    vec2 q = vec2(vC.x / 0.5, (vC.y - 0.42) / 0.42);
    vec2 tuv = vC * 0.22 + vCol.rg * 3.7 + vT * 0.013;
    float t = texture2D(uTooth, tuv).r;
    float cov = 1. - smoothstep(0.55, 1., length(q) + (t - 0.5) * 0.5);
    vec2 sh = pbShadow(vD.xy, vD.w, 0.), bl = pbBlade(vD.xy + (vCol.rg - 0.5) * 0.8);
    sh.y = max(sh.y, bl.y);
    cov *= vD.z;
    float a = smoothstep(-0.05, 0.05, cov - 0.25 - 0.5 * t * (1. - sh.y));
    // rubbed out: the dab goes grain by grain, and a dusting of its stick is left on the paper (never a darker dab)
    float t2 = texture2D(uTooth, tuv * 2.7 + 0.37).r;
    if (a < 0.5 || t2 > mix(1.01, 1.5 * uGhost, sh.x) || bl.x > 0.35 + 0.3 * t2) discard;
    gl_FragColor = vec4(vCol * 0.87, 1.);
  }
`;

function ribbonGeometry() {
  const pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) { pos.push(i / SEG, -1, 0, i / SEG, 1, 0); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}

export async function makeStyle(ctx, opts = {}) {
  const P = opts.palette || PALETTE, ex = opts.exposure || 2;
  const pal = {
    paper: ink(opts.paper || P[0], ex), scarlet: ink(P[1], ex), rose: ink(P[2], ex), cream: ink(P[3], ex),
    green: ink(P[4], ex), cerulean: ink(P[5], ex), white: ink(P[6], ex),
    orange: ink(opts.extra?.orange || EXTRA.orange, ex), lilac: ink(opts.extra?.lilac || EXTRA.lilac, ex), lavender: ink(opts.extra?.lavender || EXTRA.lavender, ex),
  };
  // strokes are multiplied by 0.87 (+ up to 0.13 when fresh) in the shaders, so undo that here
  for (const k in pal) if (k !== 'paper') pal[k].multiplyScalar(1 / 0.87);
  await ctx.yield();
  const tooth = await makeTooth(ctx, ctx.rng.fork('tooth'));
  const wind = new THREE.Vector2(0, -1);
  if (opts.wind) wind.set(opts.wind[0], opts.wind[1]).normalize();
  const U = {
    uTime: { value: 0 }, uFinger: { value: opts.finger || 900 }, uGhost: { value: 1 / 12 }, uTooth: { value: tooth },
    uCloud: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 1e6, 130, 210)) },
    uWind: { value: wind }, uGust: { value: new THREE.Vector4(0, 1e6, 40, 0) }, uPx: { value: 0.0012 },
    uBlade: { value: new THREE.Vector4(0, 0, 0, 0) }, uBladeM: { value: new THREE.Vector4(1, 0, 0, 1) }, uBladeS: { value: new THREE.Vector4(-0.7, 2.9, 1.5, 23.5) },
  };
  const ribbon = ribbonGeometry(), mats = new Map(), size = new THREE.Vector2();

  // one ShaderMaterial per variant; all share U
  function strokeMaterial(o = {}) {
    const key = ['sky', 'field', 'spin', 'add'].map((k) => (o[k] ? 1 : 0)).join('') + (o.shade === false ? 0 : 1) + (o.finger === false ? 0 : 1) + (o.strength ?? 1) + '/' + (o.grain ?? 1) + '/' + (o.cap ?? 0) + '/' + (o.streak ?? 0.7) + '/' + (o.rag ?? 0) + (o.stripes ? o.stripes.uuid : '');
    if (mats.has(key)) return mats.get(key);
    const defines = {}; if (o.sky) defines.SKY = 1; if (o.field) defines.FIELD = 1; if (o.spin) defines.SPIN = 1;
    const m = new THREE.ShaderMaterial({
      defines, vertexShader: STROKE_VERT, fragmentShader: STROKE_FRAG, side: THREE.DoubleSide,
      uniforms: { ...U, uShade: { value: o.shade === false || o.sky ? 0 : 1 }, uStrength: { value: o.strength ?? 1 }, uNear: { value: o.near ?? 0.4 }, uFingerK: { value: o.sky || o.finger === false ? 0 : 1 }, uGrainK: { value: o.grain ?? 1 }, uCap: { value: o.cap ?? 0 }, uStreak: { value: o.streak ?? 0.7 }, uRag: { value: o.rag ?? 0 },
        uStripes: { value: o.stripes || null }, uParcels: { value: o.parcels || o.stripes || null }, uStripeMap: { value: o.stripeMap || new THREE.Vector2(0, 1) },
        uAxle: { value: o.axle || new THREE.Vector3(0, 0, 1) }, uSpin: o.spinUniform || { value: 0 } },
    });
    if (o.sky) { m.depthWrite = false; m.depthTest = false; }
    if (o.add) {       // a smear over what is there: lightens (max), so pigment never adds up past 1.0
      m.blending = THREE.CustomBlending; m.blendEquation = THREE.MaxEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor;
      m.depthWrite = false; m.transparent = true;
    }
    mats.set(key, m); return m;
  }
  function paper(o = {}) {
    // (coverage round) o.color: a body in a stick instead of paper (the white of a cloud). o.near / nearMap / rowBox / row /
    // far: the floor that draws the solid bands (see PAPER_FRAG)
    return new THREE.ShaderMaterial({
      defines: o.stripes ? { FLOOR: 1 } : {}, vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: o.side ?? THREE.FrontSide,
      uniforms: { ...U, uPaper: { value: o.color || pal.paper }, uBack: { value: pal.paper }, uBodyGrain: { value: o.grain ?? 0 }, uBodyDir: { value: o.dir || new THREE.Vector4(1, 0, 1, 0) }, uBodyBand: { value: o.band || new THREE.Vector2(1, 0) }, uBodyOpen: { value: o.open || new THREE.Vector2(0, 0) }, uBandCol: { value: o.bandColor || pal.paper }, uStripes: { value: o.stripes || null }, uParcels: { value: o.parcels || o.stripes || null },
        uStripeMap: { value: o.stripeMap || new THREE.Vector2(0, 1) }, uStripeZ: { value: o.stripeZ || new THREE.Vector2(-1e5, 1e5) },
        uNearTex: { value: o.near || o.stripes || null }, uNearMap: { value: o.nearMap || new THREE.Vector4(0, 1, 0, 0) },
        uRowBox: { value: o.rowBox || new THREE.Vector4(1, 0, 1, 0) }, uRow: { value: o.row || new THREE.Vector4(0, 0, 0, 1) },
        uLeaf: { value: o.leaf || pal.green.clone().multiplyScalar(0.87) }, uFarOn: { value: o.far === false ? 0 : 1 }, uRowCut: { value: o.rowCut || new THREE.Vector3(0, 0, -1) } },
    });
  }
  // (coverage round) the band map of a set of stripes [{ x, w, c, kind }]: one row of texels looked up unfiltered, so a pixel is
  // one stick or paper. rgb = the stick, a = 1 bloom, 0.5 leaf rows and ditches, 0 the paper between two bands. warp > 0:
  // texel = x / (1 + |x| / warp), finer near the axis. Returns { tex, map } for paper({ near, nearMap }).
  function bandMap(stripes, x0, x1, warp = 0, waver = 0) {
    const N = 4096, d = new Uint8Array(N * 8), c = new THREE.Color(), e2 = new THREE.Color(), T = (x) => (warp > 0 ? x / (1 + Math.abs(x) / warp) : x), t0 = T(x0), sp = T(x1) - t0;
    let ph = 11;                                           // each band's own phase rides in the alpha (bloom 200..255, leaf rows and ditches 100..155)
    for (const s of stripes) {
      c.copy(s.c).multiplyScalar(0.87).convertLinearToSRGB();
      const i0 = Math.ceil((T(s.x - s.w / 2) - t0) / sp * N - 0.5), i1 = Math.floor((T(s.x + s.w / 2) - t0) / sp * N - 0.5);
      for (let i = Math.max(1, i0); i <= Math.min(N - 2, i1); i++) {
        d[i * 4] = Math.min(255, c.r * 255); d[i * 4 + 1] = Math.min(255, c.g * 255); d[i * 4 + 2] = Math.min(255, c.b * 255); d[i * 4 + 3] = (s.kind === 'bloom' ? 200 : 100) + ph;
        // (sixth round) the second row: where this texel lies across its band (0..1), the band's width / 64 m and its comb offset
        // (+-30 m), written so that the sRGB decode gives the number back
        e2.setRGB((i - i0 + 0.5) / Math.max(1, i1 - i0 + 1), Math.min(1, s.w / 64), Math.min(1, Math.max(0, (s.off || 0) / 60 + 0.5)), THREE.LinearSRGBColorSpace).convertLinearToSRGB();
        const o = (N + i) * 4; d[o] = Math.round(e2.r * 255); d[o + 1] = Math.round(e2.g * 255); d[o + 2] = Math.round(e2.b * 255); d[o + 3] = 255;
      }
      ph = (ph + 37) % 56;
    }
    for (let i = 0; i < N; i++) { const o = (N + i) * 4; if (d[o + 3] === 0) { d[o] = 188; d[o + 1] = 0; d[o + 2] = 188; d[o + 3] = 255; } }   // between bands: centre, no width, no offset
    const tex = new THREE.DataTexture(d, N, 2, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
    return { tex, map: new THREE.Vector4(t0, 1 / sp, warp, waver) };
  }
  // a batch of strokes -> one draw call. add(a, b, width, colour, { bow, lay, strength, phase, period, off, kind, seed, pivot })
  function batch() {
    const A = [], B = [], C = [], M = [], L = [], Pv = []; let n = 0;
    return {
      get count() { return n; },
      add(a, b, w, c, o) {
        o = o || {};
        A.push(a[0], a[1], a[2]); B.push(b[0], b[1], b[2]); C.push(c.r, c.g, c.b);
        M.push(w, o.bow || 0, o.seed ?? ((n * 0.618034 + 0.137) % 1), (o.lay ? 2 : 0) + Math.min(1, o.strength ?? 1));
        L.push(o.phase || 0, o.period || 0, o.off || 0, o.kind || 0);
        if (o.pivot) Pv.push(o.pivot[0], o.pivot[1], o.pivot[2], o.pivot[3]);
        n++;
      },
      mesh(o = {}) {
        const g = new THREE.InstancedBufferGeometry();
        g.index = ribbon.index; g.setAttribute('position', ribbon.getAttribute('position'));
        const at = (name, arr, k) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), k));
        at('aA', A, 3); at('aB', B, 3); at('aCol', C, 3); at('aMisc', M, 4); at('aLife', L, 4);
        if (o.spin) at('aPivot', Pv, 4);
        g.instanceCount = n;
        const mesh = new THREE.Mesh(g, strokeMaterial(o));
        mesh.frustumCulled = false; if (o.sky) mesh.renderOrder = -0.5;
        return mesh;
      },
    };
  }
  // dabs: list of [x, y, z, height, width, colour, combOffset] -> one mesh of single triangles (async: await it)
  async function dabs(list, o = {}) {
    // list is flat, nine numbers a dab: x, y, z, height, width, r, g, b, comb offset (style.dab() pushes one)
    const n = Math.floor(list.length / 9), pos = new Float32Array(n * 9), cor = new Float32Array(n * 6), col = new Float32Array(n * 9), dab = new Float32Array(n * 12);
    await ctx.yield();
    for (let i = 0; i < n; i++) {
      const q = i * 9, seed = (i * 0.754877) % 1;
      for (let k = 0; k < 3; k++) {
        const j = i * 3 + k;
        pos[j * 3] = list[q]; pos[j * 3 + 1] = list[q + 1]; pos[j * 3 + 2] = list[q + 2];
        cor[j * 2] = k === 0 ? -1.5 : k === 1 ? 1.5 : 0; cor[j * 2 + 1] = k === 2 ? 1.3 : 0;
        col[j * 3] = list[q + 5]; col[j * 3 + 1] = list[q + 6]; col[j * 3 + 2] = list[q + 7];
        dab[j * 4] = list[q + 3]; dab[j * 4 + 1] = list[q + 4]; dab[j * 4 + 2] = seed; dab[j * 4 + 3] = list[q + 8];
      }
      if (i % 3000 === 2999) await ctx.yield();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(cor, 2));
    g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aDab', new THREE.BufferAttribute(dab, 4));
    const m = new THREE.ShaderMaterial({ vertexShader: DAB_VERT, fragmentShader: DAB_FRAG, side: THREE.DoubleSide, uniforms: { ...U, uDabFar: { value: o.far || 70 }, uLean: { value: o.lean || 0 }, uLocal: { value: o.local ? 1 : 0 } } });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return mesh;
  }

  // the five cloud shadows: world xz centre, half-length a along the wind, half-width b across it
  const clouds = [0, 1, 2, 3, 4].map(() => ({ x: 0, z: 1e6, a: 130, b: 210, auto: false }));
  const style = {
    pal, U, wind, tooth, clouds, sticks: [pal.scarlet, pal.rose, pal.orange, pal.cream, pal.lilac, pal.green, pal.cerulean, pal.white, pal.lavender],
    strokeMaterial, paper, bandMap, batch, dabs, dab: (list, x, y, z, h, w, c, off = 0) => { list.push(x, y, z, h, w, c.r, c.g, c.b, off); }, windSpeed: 7, home: new THREE.Vector2(0, 0), range: 1400,
    setCloud(i, x, z, a = 130, b = 210, auto = false) { Object.assign(clouds[i], { x, z, a, b, auto }); },
    setGust(x, z, radius = 40, strength = 1) { U.uGust.value.set(x, z, radius, strength); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera && camera.projectionMatrix) {
        let h = 1080; if (ctx.renderer && ctx.renderer.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 1080;
        U.uPx.value = 2 / (Math.max(0.1, camera.projectionMatrix.elements[5]) * h);
      }
      for (let i = 0; i < 5; i++) {
        const c = clouds[i];
        if (c.auto) {            // drift downwind at windSpeed, wrapping inside `range` of `home`
          c.x += wind.x * style.windSpeed * dt; c.z += wind.y * style.windSpeed * dt;
          const s = (c.x - style.home.x) * wind.x + (c.z - style.home.y) * wind.y;
          if (s > style.range) { c.x -= wind.x * 2 * style.range; c.z -= wind.y * 2 * style.range; }
        }
        U.uCloud.value[i].set(c.x, c.z, c.a, c.b);
      }
    },
  };
  style.sky = (o) => buildSky(ctx, style, o);
  style.heap = (b, o) => heapCloud(ctx, style, b, o);
  style.dust = (rows, o) => dustMesh(style, rows, o);
  style.paperDiscs = paperDiscs;
  return style;
}

// THE SKY: black paper stood up as a dome, cerulean scumbled over it in broad side-strokes that all lean 20
// degrees up to the right (one goes the wrong way), gaps widening to the zenith, white dragged thinly low down,
// the horizon finger-blended into a band of lavender and green. One draw call; it follows the eye in the shader.
// o: { blue, drag, band: [c, c], density (1), lean (20 degrees) }
function buildSky(ctx, style, o = {}) {
  const rng = ctx.rng.fork('pb-sky'), pal = style.pal, b = style.batch(), R = 1000, D = Math.PI / 180;
  const blue = o.blue || pal.cerulean, drag = o.drag || pal.white, band = o.band || [pal.lavender, pal.green];
  const lean0 = (o.lean ?? 20) * D, dens0 = (o.density ?? 1) >= 1 ? 1.5 : o.density;
  const put = (az, el, L, lean, wDeg, col, opt) => {
    const ce = Math.cos(el), se = Math.sin(el), sa = Math.sin(az), ca = Math.cos(az);
    const d = [sa * ce, se, -ca * ce], e = [ca, 0, sa], n = [-sa * se, ce, ca * se];
    const cl = Math.cos(lean), sl = Math.sin(lean), h = Math.tan(L / 2);
    const t = [e[0] * cl + n[0] * sl, e[1] * cl + n[1] * sl, e[2] * cl + n[2] * sl];
    const end = (s) => { const v = [d[0] + t[0] * h * s, d[1] + t[1] * h * s, d[2] + t[2] * h * s], k = R / Math.hypot(v[0], v[1], v[2]); return [v[0] * k, v[1] * k, v[2] * k]; };
    b.add(end(-1), end(1), wDeg * D * R, col, opt);
  };
  // (coverage round) THE SKY IS CALM AND SOLID: no field of short dashes. The blue is laid on the dome itself (SKY_FRAG): one
  // broad, even lay of the side of the stick in long strokes leaning up to the right, rubbed in with the finger so that the
  // paper shows only as fine grain and a few dry streaks; white is dragged over it low down, more toward the horizon. On top
  // of it only the low band of the hour's sticks and the horizon smudges are separate strokes.
  if (o.low) for (let j = 0; j < 120; j++) {           // another hour: the low sky restruck in other sticks
    // (fourth polish) it keeps to a narrow band along the horizon (under 8 degrees, lying nearly flat, every third stroke left
    // out), so the hour is a low glow of rose and orange and the blue alone stands above it
    const az = rng() * 6.283, el = 1.2 + (rng.range(1.5, 17) - 1.5) * 0.3, L = rng.range(9, 16), ln = lean0 * 0.3 + rng.range(-5, 5) * D * 0.5, w = rng.range(2.4, 3.8) * 0.62;
    const opt = { bow: rng.range(-5, 5) * 0.5, strength: rng.range(0.6, 0.95) };
    if (j % 3 !== 2) put(az, el * D, L * D, ln, w, o.low[j % o.low.length], opt);
  }
  for (let j = 0; j < 84; j++) {                       // the horizon, finger-blended: overlapping smudges about 2 degrees tall
    // (improve round) pure sticks at full colour, thin and dry, so the band is pale on the black and speckled with paper;
    // it used to be dimmed smears of mixed sticks, which came out navy and maroon
    const c = band[rng.chance(0.55) ? 0 : 1];
    put((j / 84) * 6.283 + rng.range(-0.03, 0.03), rng.range(-0.05, 0.5) * D, rng.range(7, 17) * D, rng.range(-1.2, 1.2) * D, rng.range(0.5, 1.0), c,
      { strength: rng.range(0.62, 0.8), bow: rng.range(-0.6, 0.6) });
  }
  const g = new THREE.Group(), mesh = b.mesh({ sky: true, cap: 0.5, streak: 1 });
  const k87 = (c) => c.clone().multiplyScalar(0.87);
  const back = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthTest: false, depthWrite: false,
    uniforms: { uPaper: { value: pal.paper }, uBlue: { value: k87(blue) }, uDrag: { value: k87(drag) }, uTooth: style.U.uTooth, uDens: { value: dens0 }, uTime: style.U.uTime },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 1000., 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }',
    fragmentShader: SKY_FRAG }));
  back.frustumCulled = false; back.renderOrder = -0.6; g.add(back, mesh);
  return g;

}

// The dome's own lay of blue. Everything is looked up in the dome's own angles (never the screen): az runs five tiles of
// the tooth round the sky (the seam is behind the entry), strokes rise to the right. A pixel is one stick or paper.
const SKY_FRAG = /* glsl */`
  varying vec3 vDir;
  uniform vec3 uPaper, uBlue, uDrag; uniform sampler2D uTooth; uniform float uDens, uTime;
  // (sixth round) THE SKY IS DRAWN AND HAS A TOP. The dome is ruled into rows that lean twenty degrees up to the right; every
  // cell of a row holds ONE side-stroke of the stick (a round heavy heel at the lower left, a body crossed by dry streaks, a
  // tail that narrows and breaks into grain). Low down the strokes are broad, long and pressed hard, so they close into one
  // lay; from about ten degrees up they narrow, shorten and miss each other, and some are left out, so the paper stands
  // between them in gaps that widen to the zenith. Each stroke of the open sky is laid again in its own time.
  const float SKL = 13., SKH = 3.3;                             // a cell: degrees along the stroke, degrees across it
  float skH(vec2 c, float k){ return fract(sin(dot(c, vec2(12.9898, 78.233)) + k * 37.719) * 43758.5453); }
  float skStroke(vec2 ab, vec2 cell, float rowOff, float st, float bl, float thin){
    float h1 = skH(cell, 1.), h2 = skH(cell, 2.), h3 = skH(cell, 3.), h4 = skH(cell, 4.), h5 = skH(cell, 5.);
    float ac = (cell.x + 0.5 + (h1 - 0.5) * 0.36) * SKL - rowOff, bc = (cell.y + 0.5) * SKH;
    float Ec = ac * 0.342 + bc * 0.9397;                         // the stroke's own height over the horizon, degrees
    float t = smoothstep(8., 19., Ec), tl = smoothstep(13., 31., Ec), t2 = smoothstep(22., 60., Ec);
    if (h5 > mix(1.1, 0.9, tl) - 0.36 * t2 - thin) return 0.;
    bc += (h3 - 0.5) * SKH * 0.3 * t;
    float hl = 0.5 * SKL * mix(1.25, 0.66, tl) * (0.8 + 0.4 * h2), hw = SKH * mix(0.85, 0.34, t) * (0.84 + 0.32 * h4);
    float x = ab.x - (ac - hl), u = x / (2. * hl);
    if (u < -0.02 || u > 1.02) return 0.;
    float v = (ab.y - bc - (h4 - 0.5) * 1.3 * sin(3.14159 * clamp(u, 0., 1.))) / (hw * (1. - 0.4 * u * u));
    float av = length(vec2(max(0., 1. - x / hw), v)) + (bl - 0.5) * 0.55;          // a round heel, ragged sides
    float dry = mix(0.04, 0.2, smoothstep(0.05, 0.5, u)) + 0.6 * smoothstep(0.6, 1., u);
    dry *= mix(0.3, 1., t);                                      // low strokes are pressed hard
    float per = mix(15., 36., h3), c = fract(uTime / per + h1 * 7.);
    float open = step(0.3, tl);                                  // only the open sky is restruck: the low lay stands
    float laid = max(1. - open, step(u, c * per / 1.3));
    dry += 0.9 * smoothstep(0.86, 1., c) * open;
    return step(av, 1.) * step(u, 1. - 0.12 * bl) * step(dry, st) * laid;
  }
  float skRow(vec2 ab, float row, float st, float bl, float thin){
    float rowOff = skH(vec2(row, 7.), 9.) * SKL, xi = (ab.x + rowOff) / SKL, i = floor(xi), i2 = i + (fract(xi) > 0.5 ? 1. : -1.);
    return max(skStroke(ab, vec2(i, row), rowOff, st, bl, thin), skStroke(ab, vec2(i2, row), rowOff, st, bl, thin));
  }
  void main(){
    vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
    float el = asin(clamp(d.y, -1., 1.)), az = atan(d.x, abs(d.z) + abs(d.x) < 1e-5 ? 1e-5 : d.z);
    vec2 q = vec2(az, el) * 0.7957747;                           // five tiles round the sky
    vec2 r = vec2(q.x, (q.y - 0.5 * q.x) * 0.4);
    float s1 = texture2D(uTooth, r).g, s2 = texture2D(uTooth, r * vec2(3., 5.) + vec2(0.37, 0.11)).g;
    float A = az * 57.29578, E = el * 57.29578;
    vec2 ab = vec2(-A * 0.9397 + E * 0.342, E * 0.9397 + A * 0.342);       // along a stroke (up to the right on screen), across it
    // the tooth is the paper's own: looked up once in the dome's leaning coordinates
    float stk = textureLod(uTooth, ab * vec2(0.02, 0.03) + vec2(0.13, 0.41), 0.).g, gr = textureLod(uTooth, ab * 0.05 + 0.53, 0.).r;
    float bl = textureLod(uTooth, ab * vec2(0.06, 0.09) + 0.19, 0.).b, st = stk * 0.72 + gr * 0.28;
    float thin = 0.4 * (1. - step(1., uDens)), row = floor(ab.y / SKH);
    float cov = max(skRow(ab, row - 1., st, bl, thin), max(skRow(ab, row, st, bl, thin), skRow(ab, row + 1., st, bl, thin)));
    // one stroke goes the wrong way
    vec2 w2 = vec2(A * 0.9397 + E * 0.342 + 12., E * 0.9397 - A * 0.342 - 31.5);
    float wu = (w2.x + 6.5) / 13., wv = w2.y / (1.35 * (1. - 0.4 * wu * wu)) ;
    if (wu > 0. && wu < 1. - 0.12 * bl) cov = max(cov, step(length(vec2(max(0., 1. - (w2.x + 6.5) / 1.35), wv)) + (bl - 0.5) * 0.55, 1.) * step(mix(0.05, 0.6, wu * wu), st));
    // the closed lay over the horizon: every mill, poplar and tower has the stick whole behind it
    cov = max(cov, step(E, 9.5 + (bl - 0.5) * 4.) * step(0.012, gr));
    vec3 col = uBlue;
    // white dragged thinly over the low blue: most at the horizon, none above twenty degrees
    float w = (1. - smoothstep(0.0, 0.17, d.y + (bl - 0.5) * 0.05)) * 0.86;
    w *= 0.86 + 0.14 * sin(uTime * 0.7 + bl * 31. + q.x * 3.);   // the drag is laid again and again: its streaks come and go, each in its own time
    if (s1 * 0.55 + s2 * 0.45 < w) col = uDrag;
    float paper = max(1. - cov, step(uDens, s1 * 0.6 + bl * 0.4));       // a thin sky (night): mostly paper
    gl_FragColor = vec4(mix(col, uPaper, paper), 1.);
  }
`;

// A CLOUD: heaped strokes on a lumpy mound that faces `toward`. Pale stick on the sunward tops, rose in the
// hollows, lavender beneath, the flat base left as paper. Strokes are laid on the crown and thin away at the
// base for ever. Adds strokes to batch `b`; returns { discs } for a paper backing (see paperDiscs).
// o: { center: [x, yBase, z], width, height, toward: [x, z], lumps (22), strokes (700), top, hollow, under }
function heapCloud(ctx, style, b, o = {}) {
  const rng = (o.rng || ctx.rng).fork('pb-heap'), pal = style.pal;
  const [cx, cy, cz] = o.center, W = o.width, H = o.height, nL = o.lumps || 40, nS = o.strokes || 800;
  const top = o.top || pal.white, hollow = o.hollow || pal.rose, under = o.under || pal.lavender, open = o.open ? 1 : 0;
  let fx = (o.toward ? o.toward[0] : 0) - cx, fz = (o.toward ? o.toward[1] : 0) - cz; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
  const rx = -fz, rz = fx;                                   // billboard right (toward is in front); right x toward = up
  const at = (x, y, d) => [cx + rx * x + fx * d, cy + y, cz + rz * x + fz * d];
  // the mound: a crown off-centre, a shoulder each side, a flat base; lumps are scattered inside it
  const crownX = rng.range(-0.14, 0.14) * W, sh1 = rng.range(0.42, 0.62), sh2 = rng.range(0.3, 0.5), shX = rng.sign() * rng.range(0.24, 0.3) * W;
  const bump = (x, c, w) => { const t = Math.abs(x - c) / w; return t < 1 ? Math.pow(1 - t * t, 0.75) : 0; };
  const prof = (x) => H * Math.max(bump(x, crownX, W * 0.3), sh1 * bump(x, shX, W * 0.3), sh2 * bump(x, -shX * 1.25, W * 0.22), 0.3 * bump(x, 0, W * 0.5));
  const lumps = [];
  for (let i = 0, guard = 0; i < nL && guard < nL * 30; guard++) {
    const x = rng.range(-0.5, 0.5) * W, ph = prof(x), r = W * rng.range(0.09, 0.15) * (nL < 12 ? 1.5 : 1);
    if (ph < r * 1.2) continue;
    const u = rng(), y = Math.max(r * 0.45, (i < nL * 0.4 ? 1 - u * u * 0.5 : u) * (ph - r * 0.75));   // the first lumps crown the profile
    lumps.push({ x, y, r, d: (1 - y / H) * W * 0.12 + rng.range(0, W * 0.02) }); i++;
  }
  if (!lumps.length) lumps.push({ x: 0, y: H * 0.4, r: W * 0.3, d: 0 });
  const cand = [];
  for (const L of lumps) {
    for (let ring = 0; ring < 4; ring++) {
      // (fourth polish) open: the strokes of a heap can be told apart. Each is a longer arc with a clear gap before the next
      // one on its ring, so stroke ends stand round every lump with paper between them (the width is narrowed below)
      const rho = L.r * (0.88 - ring * 0.25), span = (38 + ring * 16 + open * 14) * Math.PI / 180;
      for (let th = Math.PI * 1.14 - rng() * span * 0.5; th > -0.14 * Math.PI; th -= span * (rng.range(0.55, 0.8) + open * 0.52)) {
        const t0 = th + span * 0.5, t1 = th - span * 0.5;      // clockwise: left to right over the top, bow outward
        const ra = rho * rng.range(0.9, 1.1), rc = rho * rng.range(0.86, 1.12), jx = rng.range(-0.05, 0.05) * L.r;
        cand.push({ L, rho, th, a: [L.x + jx + Math.cos(t0) * ra, L.y + Math.sin(t0) * ra * 0.9], c: [L.x + jx + Math.cos(t1) * rc, L.y + Math.sin(t1) * rc * 0.9],
          sag: rho * (1 - Math.cos(span * 0.5)), k: rng() });
      }
    }
  }
  const keep = Math.min(1, nS / Math.max(1, cand.length));
  for (const s of cand) {
    if (!open && s.k > keep && !(s.rho > s.L.r * 0.8 && Math.sin(s.th) > 0.8)) continue;
    if (s.a[1] < s.L.r * 0.08 || s.c[1] < s.L.r * 0.08) continue;          // the base is left as paper
    const L = s.L, hgt = L.y / H, up = Math.sin(s.th) * s.rho / L.r + rng.range(-0.1, 0.1);   // how sunward this face is
    let col = top, strength = rng.range(0.9, 1);
    if (up < -0.02 + (hgt < 0.2 ? 0.42 : 0)) { col = under; strength = rng.range(0.6, 0.85); }
    else if (up < 0.3) { col = rng.chance(0.25) ? top : hollow; strength = rng.range(0.65, 0.9); }
    const period = hgt > 0.6 ? rng.range(7, 14) : hgt < 0.25 ? rng.range(26, 44) : rng.range(16, 30);
    b.add(at(s.a[0], s.a[1], L.d), at(s.c[0], s.c[1], L.d), L.r * rng.range(0.4, 0.56) * (1 - 0.4 * open), col, { bow: s.sag, strength: open ? Math.min(1, strength + 0.1) : strength, phase: rng(), period });
  }
  return { discs: lumps.map((L) => ({ p: at(L.x, L.y, L.d - W * 0.004), r: L.r * 0.8, right: [rx, 0, rz], floor: cy })) };
}

// paper discs (upright, spanned by `right` and +Y, cut flat at `floor`): the backing that keeps the sky out of a
// heaped cloud and leaves its base as paper
function paperDiscs(discs, seg = 14) {
  const pos = [];
  for (const d of discs) for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * 6.2832, a1 = ((i + 1) / seg) * 6.2832, fl = d.floor ?? -1e9;
    const q = (a) => [d.p[0] + d.right[0] * Math.cos(a) * d.r, Math.max(fl, d.p[1] + Math.sin(a) * d.r), d.p[2] + d.right[2] * Math.cos(a) * d.r];
    pos.push(...d.p, ...q(a0), ...q(a1));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
}

// ---------------------------------------------------------------------------------------------------------
// THE HERO: the polder under the cumulus.
const WIND_LOCAL = [-0.766, 0.643];                      // the wind in hero space: it blows from the mills toward the eye
const FLOOR = -14, MILL1 = [-22.8, 91.9], BEND = 50 * Math.PI / 180;
// the mill dyke, local xz. (polish round) It bends gently toward the canal's line, and the mills stand on it at growing
// intervals, so that from the embankment each sail cross is seen apart from the next with sky between them
const DYKE = [[-22.8, 91.9], [80, -60], [139, -187], [199, -337], [251, -534], [299, -798], [342, -1139], [420, -2055]];
function dykeZ(x) {                                       // z of the mill dyke where a stripe at x meets it
  for (let i = 0; i < DYKE.length - 1; i++) {
    const a = DYKE[i], b = DYKE[i + 1];
    if (x >= a[0] && x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
  }
  return null;
}

export async function buildHero(ctx, opts = {}) {
  const palette = opts.palette || PALETTE, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const own = !opts.style;
  const style = opts.style || await makeStyle(ctx, { palette, wind: WIND_LOCAL, paper: opts.paper, exposure: opts.exposure || 1 });
  const pal = style.pal, rng = ctx.rng.fork('pb-hero'), root = new THREE.Group();
  root.name = 'pastel-bulb-fields-hero';
  await ctx.yield();

  // ---- the two hundred stripes: local x of the centre, width, stick, comb offset, where it starts and stops
  const crop = opts.crop || (rng.chance(0.7) ? 'tulip' : rng.chance(0.5) ? 'hyacinth' : 'daffodil');
  const sticks = crop === 'hyacinth' ? [pal.lilac, pal.rose, pal.white, pal.cerulean, pal.lilac]
    : crop === 'daffodil' ? [pal.cream, pal.white, pal.cream, pal.orange, pal.white]
      : [pal.scarlet, pal.cream, pal.lilac, pal.rose, pal.white, pal.scarlet, pal.cream, pal.orange];
  const wScale = crop === 'hyacinth' ? 0.72 : 1, Z_NEAR = 98, Z_FAR = -3050;
  const stripes = [];
  for (const sgn of [-1, 1]) {
    let x = 6.6, last = null, last2 = null, sinceGreen = rng.int(2, 6), sinceDitch = rng.int(6, 14);
    const xMax = sgn < 0 ? 2050 : 1420;
    while (x < xMax) {
      const farOut = Math.max(0, (x - 1000) / 400);
      let w = rng.range(6, 14) * wScale * (1 + farOut * 1.6), c, kind = 'bloom';
      if (--sinceDitch <= 0) { c = pal.cerulean; w = rng.range(2.6, 3.6); kind = 'ditch'; sinceDitch = rng.int(14, 26); }
      else if (--sinceGreen <= 0) { c = pal.green; kind = 'green'; sinceGreen = rng.int(6, 12) - (crop === 'daffodil' ? 2 : 0); }
      else { do { c = rng.pick(sticks); } while (c === last || (c === last2 && rng.chance(0.7))); }
      last2 = last; last = c;
      const cx = sgn * (x + w / 2), dz = sgn > 0 ? dykeZ(cx) : null;
      stripes.push({ x: cx, w, c, kind, off: rng.range(-12, 12), dz, shy: rng.chance(0.22) ? rng.range(6, 30) : rng.range(0, 3) });
      x += w + rng.range(0.7, 1.6) * (1 + farOut);
    }
  }
  // the stripe texture the far field is blended from (rgb stick, a = width / 16 m), 0.9 m a texel
  const TX0 = -2100, TSPAN = 3600, TN = 4096, tdata = new Uint8Array(TN * 4), srgb = new THREE.Color();
  for (const s of stripes) {
    srgb.copy(s.c).multiplyScalar(0.87).convertLinearToSRGB();
    const i0 = Math.ceil((s.x - s.w / 2 - TX0) / TSPAN * TN), i1 = Math.floor((s.x + s.w / 2 - TX0) / TSPAN * TN);
    for (let i = Math.max(0, i0); i <= Math.min(TN - 1, i1); i++) {
      tdata[i * 4] = Math.min(255, srgb.r * 255); tdata[i * 4 + 1] = Math.min(255, srgb.g * 255); tdata[i * 4 + 2] = Math.min(255, srgb.b * 255);
      tdata[i * 4 + 3] = Math.min(255, s.w / 16 * 255);
    }
  }
  for (let i = 0; i < TN; i++) if (tdata[i * 4 + 3] === 0) tdata[i * 4 + 3] = 150;
  const stripeTex = new THREE.DataTexture(tdata, TN, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  stripeTex.colorSpace = THREE.SRGBColorSpace; stripeTex.magFilter = THREE.LinearFilter; stripeTex.minFilter = THREE.LinearMipmapLinearFilter;
  stripeTex.generateMipmaps = true; stripeTex.wrapS = stripeTex.wrapT = THREE.ClampToEdgeWrapping; stripeTex.needsUpdate = true;
  const stripeMap = new THREE.Vector2(TX0, 1 / TSPAN);
  // far off the hand stops ruling stripes: neighbours become one parcel in ONE of their sticks. The parcel map has eight rows:
  // row 0 holds parcels of three to five stripes (about 40 m), each next row merges them in pairs, so the shader can always
  // pick a row whose parcels are six pixels wide or more. rgb = the stick (unfiltered), a = position across the parcel.
  // (its own generator, so that nothing drawn after it changes)
  const prng = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('pb-parcels:' + (ctx.seed ?? 0))) : rng.fork('parcels');
  const PN = 2048, PR = 8, pdata = new Uint8Array(PN * PR * 4), sorted = stripes.slice().sort((a, b) => a.x - b.x);
  for (let i = 0; i < sorted.length;) {                  // (the draws the earlier parcel map took from the hero's generator, kept so the rest is laid as before)
    let n = 0, acc = 0, minX = 1e9; const n0 = rng.int(3, 6), sg0 = Math.sign(sorted[i].x);
    while (i + n < sorted.length && Math.sign(sorted[i + n].x) === sg0) {
      const q = sorted[i + n]; minX = Math.min(minX, Math.abs(q.x));
      if (n >= n0 && acc >= minX * minX / 700) break;
      acc += q.w + 1; n++;
    }
    n = Math.max(1, n);
    const grp = sorted.slice(i, i + n), blooms = grp.filter((q) => q.kind === 'bloom');
    if (blooms.length && !rng.chance(0.12)) rng.pick(blooms); else rng.pick(grp);
    i += n;
  }
  let level = [];
  for (let i = 0; i < sorted.length;) {
    let n = 0, acc = 0; const n0 = prng.int(3, 5), sg0 = Math.sign(sorted[i].x);
    while (i + n < sorted.length && Math.sign(sorted[i + n].x) === sg0 && (n < n0 || acc < 30)) { acc += sorted[i + n].w + 1; n++; }
    n = Math.max(1, n);
    const grp = sorted.slice(i, i + n), blooms = grp.filter((q) => q.kind === 'bloom'), prev = level[level.length - 1];
    let c = (blooms.length && !prng.chance(0.15) ? prng.pick(blooms) : prng.pick(grp)).c;
    if (prev && prev.c === c && blooms.length > 1) c = prng.pick(blooms.filter((q) => q.c !== c) .concat(blooms)).c;
    level.push({ x0: grp[0].x - grp[0].w / 2, x1: grp[n - 1].x + grp[n - 1].w / 2, c, sg: sg0 });
    i += n;
  }
  for (let r = 0; r < PR; r++) {
    for (const q of level) {
      srgb.copy(q.c).multiplyScalar(0.87).convertLinearToSRGB();
      const i0 = Math.ceil((q.x0 - TX0) / TSPAN * PN), i1 = Math.floor((q.x1 - TX0) / TSPAN * PN) - 1;
      for (let k = Math.max(0, i0); k <= Math.min(PN - 1, i1); k++) {
        const o = (r * PN + k) * 4;
        pdata[o] = Math.min(255, srgb.r * 255); pdata[o + 1] = Math.min(255, srgb.g * 255); pdata[o + 2] = Math.min(255, srgb.b * 255);
        pdata[o + 3] = Math.round(255 * (k - i0 + 0.5) / Math.max(1, i1 - i0 + 1));
      }
    }
    const next = [];
    for (let i = 0; i < level.length;) {                  // merge in pairs, never across the embankment; the pair keeps one child's stick
      const a = level[i], b = level[i + 1];
      if (b && b.sg === a.sg) { const pv = next[next.length - 1]; let c = prng.chance(0.5) ? a.c : b.c; if (pv && pv.c === c) c = c === a.c ? b.c : a.c; next.push({ x0: a.x0, x1: b.x1, c, sg: a.sg }); i += 2; }
      else { next.push(a); i++; }
    }
    level = next;
  }
  const parcelTex = new THREE.DataTexture(pdata, PN, PR, THREE.RGBAFormat, THREE.UnsignedByteType);
  parcelTex.colorSpace = THREE.SRGBColorSpace; parcelTex.magFilter = THREE.NearestFilter; parcelTex.minFilter = THREE.NearestFilter;
  parcelTex.generateMipmaps = false; parcelTex.wrapS = parcelTex.wrapT = THREE.ClampToEdgeWrapping; parcelTex.needsUpdate = true;
  await ctx.yield();

  // ---- every stripe laid in side-strokes, heel to tip away from the embankment mouth, joins showing
  const field = style.batch();
  let si = 0;
  for (const s of stripes) {
    const runs = s.dz === null ? [[Z_NEAR, Z_FAR]] : [[Z_NEAR, s.dz + 22 + s.shy], [s.dz - 22 - s.shy * 0.5, Z_FAR]];
    for (const [za, zb] of runs) {
      let z = za - rng.range(0, 9) - (rng.chance(0.15) ? rng.range(6, 20) : 0);
      while (z > zb + 20) {
        const far = Math.max(Math.abs(z + 100), Math.abs(s.x) * 0.8);
        const len = Math.min(z - zb, far < 800 ? rng.range(80, 160) : rng.range(240, 460));
        const miss = rng.range(-0.45, 0.45), y = FLOOR + 0.05 + (si % 5) * 0.012;
        field.add([s.x + miss, y, z], [s.x + miss + rng.range(-0.3, 0.3), y, z - len], s.w, s.c,
          { lay: 1, bow: rng.range(-0.7, 0.7), off: s.off, strength: rng.range(0.82, 1) });
        z -= len + (rng.chance(0.6) ? -rng.range(2, 5) : rng.range(1, 3.5));   // the join shows double, or misses
      }
    }
    if (++si % 40 === 0) await ctx.yield();
  }
  const fieldMesh = field.mesh({ field: true, stripes: stripeTex, parcels: parcelTex, stripeMap, near: 0.92, cap: 0.5 });   // near 0.92: seen from above, the stroke stays under its dabs
  // (coverage round) THE FLOOR DRAWS THE BANDS: every stripe one solid band of its stick (PAPER_FRAG). The field strokes are
  // kept (hero.field, their random draws) but no longer shown: a band made of strokes was half paper between dry streaks.
  const COMB = 1.7, nearBand = style.bandMap(stripes.filter((q) => Math.abs(q.x) < 890).map((q) => ({ ...q, off: q.off * COMB })), -900, 900), lane0 = opts.lane || null;
  const floorGeo = new THREE.PlaneGeometry(5200, 4600, 1, 1); floorGeo.rotateX(-Math.PI / 2); floorGeo.translate(-200, FLOOR - 0.02, -1500);
  const floor = new THREE.Mesh(floorGeo, style.paper({ stripes: stripeTex, parcels: parcelTex, stripeMap, stripeZ: new THREE.Vector2(Z_FAR, Z_NEAR), near: nearBand.tex, nearMap: nearBand.map,
    rowBox: lane0 ? new THREE.Vector4(lane0[0], lane0[1], lane0[3], lane0[2]) : undefined, row: lane0 ? new THREE.Vector4((lane0[0] + lane0[1]) / 2, 1.2, 1.6, 1) : undefined,
    rowCut: lane0 ? new THREE.Vector3(0.828, 0.56, -23.1) : undefined }));                    // the foot of the mill dyke between the first mill and the second
  floor.frustumCulled = false; root.add(floor);
  await ctx.yield();

  // ---- paper bodies: the embankment with its canal trough, the mill dyke, the seven tarred mills
  const pp = [];                                          // triangle soup, one mesh
  const gp = [];                                          // (coverage round) the grassed bodies: dykes, flanks and the mound are solid leaf green
  const quad = (a, b, c, d, T = pp) => T.push(...a, ...b, ...c, ...a, ...c, ...d);
  const sweep = (profileOf, line, T = pp) => {                    // profileOf(i) -> [[offset to the right, y]], line [[x, z]]
    let prev = null;
    for (let i = 0; i < line.length; i++) {
      const p0 = line[Math.max(0, i - 1)], p1 = line[Math.min(line.length - 1, i + 1)];
      let tx = p1[0] - p0[0], tz = p1[1] - p0[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const ring = profileOf(i).map(([o, y]) => [line[i][0] - tz * o, y, line[i][1] + tx * o]);
      if (prev) for (let k = 0; k < ring.length - 1; k++) quad(prev[k], prev[k + 1], ring[k + 1], ring[k], T);
      prev = ring;
    }
  };
  const frustum = (cx, cz, y0, y1, r0, r1, n = 8, rot = 0, T = pp) => {
    for (let k = 0; k < n; k++) {
      const a0 = rot + (k / n) * 6.2832, a1 = rot + ((k + 1) / n) * 6.2832;
      quad([cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0], [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0],
        [cx + Math.cos(a1) * r1, y1, cz + Math.sin(a1) * r1], [cx + Math.cos(a0) * r1, y1, cz + Math.sin(a0) * r1], T);
    }
  };
  const bankLine = [[-35.7 - 0.766 * 34, 76.6 + 0.643 * 34]];
  for (let i = 0; i <= 8; i++) { const th = BEND * (1 - i / 8); bankLine.push([-100 + 100 * Math.cos(th), 100 * Math.sin(th)]); }
  bankLine.push([0, -200], [0, -900], [0, -3100]);
  // (improve round) a canal 9 m wide between thin grassed banks that fall almost sheer to the floor, so that from the
  // barge's heap, 6 m up, the stripes begin at the bank foot and run from the bottom corners of the frame to the horizon
  const bank = () => { const top = 0.3, o1 = 5.1, o2 = 5.7; return { top, o1, o2,
    prof: [[-o2, FLOOR - 0.3], [-o1, top], [-4.6, top], [-4.5, -0.8], [4.5, -0.8], [4.6, top], [o1, top], [o2, FLOOR - 0.3]] }; };
  sweep(() => bank().prof.slice(2, 6), bankLine);          // the canal's trough stays paper: its edges are the black line round the water
  sweep(() => bank().prof.slice(0, 3), bankLine, gp); sweep(() => bank().prof.slice(5), bankLine, gp);
  frustum(MILL1[0], MILL1[1], FLOOR - 0.3, 1.5, 11.5, 7.6, 10, 0, gp); frustum(MILL1[0], MILL1[1], 1.5, 1.52, 7.6, 5.5, 10, 0, gp);
  // the ring dyke: upland behind it (the world's). It is left open where the world's canal comes through.
  const RING_TOP = (opts.upland ?? 0.5) + 1.0;           // the ring dyke stands a metre over the world's upland
  const ringProf = () => [[-10, FLOOR - 0.3], [-10, RING_TOP], [-4, RING_TOP], [0, FLOOR - 0.3]];
  if (opts.canalGap === false) sweep(ringProf, [[1500, 101], [-2200, 101]], gp);
  else { sweep(ringProf, [[1500, 101], [-47, 101]], gp); sweep(ringProf, [[-94, 101], [-2200, 101]], gp); }
  const DYKE_TOP = FLOOR + 6;
  sweep(() => [[-9, FLOOR - 0.3], [-2.6, DYKE_TOP], [2.6, DYKE_TOP], [9, FLOOR - 0.3]], DYKE, gp);

  // mills: 0 is the great red-sailed one on the canal bank, 1..6 step away along the dyke toward the cumulus
  const wl = WIND_LOCAL, AX = [wl[0], 0, wl[1]], RX = [AX[2], 0, -AX[0]];   // sails face downwind (toward the eye); RX = up x AX
  const cloth = pal[opts.sailcloth || 'scarlet'] || pal.scarlet;   // 'scarlet' | 'white' | 'orange'
  const mills = [], misc = style.batch(), sails = style.batch(), arcs = style.batch();
  const mrng = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('pb-milldraw:' + (ctx.seed ?? 0))) : rng.fork('milldraw');   // its own generator
  const millLit = opts.millLit || pal.lavender, millShade = opts.millShade || pal.lilac, millBrick = opts.millBrick || pal.rose;
  const arcCol = pal.white;                              // a trail is the sky's white dragged dry: speckled, never a grey film
  for (let m = 0; m < 7; m++) {
    const H = m === 0 ? 40 : rng.range(30, 37) * (1 + 0.06 * Math.max(0, m - 1)), L = m === 0 ? 23 : H * rng.range(0.55, 0.6) * (m > 1 ? 0.86 : 1);
    const x = m === 0 ? MILL1[0] : DYKE[m][0], z = m === 0 ? MILL1[1] : DYKE[m][1], y0 = m === 0 ? 1.5 : DYKE_TOP;
    const rb = H * 0.15, rt = H * 0.072, yb = y0 + H * 0.8, rAt = (y) => rb + (rt - rb) * (y - y0) / (H * 0.8);
    frustum(x, z, y0 - 1, yb, rb, rt, 8, 0.39);
    frustum(x, z, yb, y0 + H * 0.93, rt * 1.25, rt * 1.0, 8); frustum(x, z, y0 + H * 0.93, y0 + H, rt * 1.0, rt * 0.2, 8);
    const yg = y0 + H * 0.34, rg = rAt(yg) * 1.55;
    frustum(x, z, yg - 0.5, yg, rAt(yg), rg, 8, 0.39); frustum(x, z, yg, yg + 0.01, rg, 0.1, 8, 0.39);
    const on = (ax, rx, y) => [x + AX[0] * ax + RX[0] * rx, y, z + AX[2] * ax + RX[2] * rx];
    // two lavender strokes down the sunlit flank, a white gallery rail, a cream stroke on the cap
    const r1 = rAt(yg + 1), r2 = rAt(yb - 1);
    misc.add(on(r2 * 0.95, -r2 * 0.42, yb - 0.6), on(rb * 1.0, -rb * 0.46, y0 + 0.6), rb * 0.42, pal.lavender, { bow: 0.25, strength: 0.92, seed: rng() });
    misc.add(on(r2 * 1.0, r2 * 0.12, yb - 2.5), on(rb * 1.05, rb * 0.1, y0 + H * 0.12), rb * 0.26, pal.lavender, { bow: -0.2, strength: 0.7, seed: rng() });
    misc.add(on(rg * 1.02, -rg * 1.12, yg + 1.15), on(rg * 1.02, rg * 1.12, yg + 1.05), 0.42, pal.white, { seed: rng() });
    misc.add(on(rg * 1.02, -rg * 1.05, yg + 0.15), on(rg * 1.02, rg * 1.02, yg + 0.2), 0.3, pal.lavender, { strength: 0.6, seed: rng() });
    for (let k = -2; k <= 2; k++) misc.add(on(rg * 1.03, k * rg * 0.5, yg + 1.2), on(rg * 1.03, k * rg * 0.5, yg + 0.1), 0.2, pal.white, { strength: 0.8, seed: rng() });
    misc.add(on(rt * 1.3, -rt * 1.25, y0 + H * 0.87), on(rt * 1.3, rt * 1.2, y0 + H * 0.88), H * 0.035, pal.cream, { bow: -rt * 0.35, seed: rng() });
    // (polish round) a mill near the eye is DRAWN on its paper: weatherboards above the gallery and brick courses below it,
    // stroke by stroke round the tower: the stick where the sun strikes (it stands behind us, a little to the canal side), a
    // half-tone on the turning faces, a deep stick laid thin on the shade side so the paper shows through it as tooth
    if (m <= 2) {
      const nC = m === 0 ? 25 : m === 1 ? 16 : 10, hC = (yb - y0 - 1.2) / nC, sunA = Math.atan2(AX[2] * 0.75 - RX[2] * 0.66, AX[0] * 0.75 - RX[0] * 0.66);
      for (let c = 0; c < nC; c++) {
        const y = y0 + 0.9 + (c + 0.5) * hC, r = rAt(y) + 0.45, below = y < yg - 0.6;
        if (Math.abs(y - yg - 0.4) < 1.0) continue;                             // the gallery and its rail
        for (let k = 0; k < 8; k++) {
          const a0 = 0.39 + k / 8 * 6.2832, a1 = a0 + 6.2832 / 8, lit = Math.cos((a0 + a1) / 2 - sunA), shade = lit <= 0.08;
          const j0 = mrng.range(0.02, 0.1), j1 = 1 - mrng.range(0.02, 0.12), flip = mrng.chance(0.5), sk = mrng(), str = mrng();
          if (!shade && lit < 0.5 && (c + k) % 2 === 0 && sk < 0.6) continue;  // the turning faces: every other board
          const pt = (t) => [x + (Math.cos(a0) * (1 - t) + Math.cos(a1) * t) * r, y + (sk - 0.5) * 0.12, z + (Math.sin(a0) * (1 - t) + Math.sin(a1) * t) * r];
          const col = shade ? millShade : below ? millBrick : millLit, w = hC * (shade ? 0.5 : 0.8), o = { strength: shade ? 0.5 + 0.2 * str : 0.82 + 0.18 * str, bow: (sk - 0.5) * 0.16, seed: mrng() };
          if (below && !shade) {                                                  // brick: two thin courses of three or four, joints staggered
            for (let row = 0; row < 2; row++) {
              const nb = 3 + ((c + k + row) % 2), yo = (row - 0.5) * hC * 0.5;
              for (let q = 0; q < nb; q++) {
                const t0 = j0 + (j1 - j0) * (q + 0.07) / nb, t1 = j0 + (j1 - j0) * (q + 0.93) / nb, A = pt(t0), Bq = pt(t1);
                if (lit < 0.5 && (q + row + c) % 3 === 0) continue;
                A[1] += yo; Bq[1] += yo + (str - 0.5) * 0.06;
                misc.add(A, Bq, hC * 0.38, col, { strength: 0.8 + 0.2 * ((q * 0.37 + str) % 1), seed: (sk + q * 0.31 + row * 0.17) % 1 });
              }
            }
          }
          else misc.add(pt(flip ? j1 : j0), pt(flip ? j0 : j1), w, col, o);
        }
      }
      for (let k = 0; k < 8; k++) {                                              // the cap: short strokes round it
        const a0 = k / 8 * 6.2832, a1 = a0 + 6.2832 / 8, lit = Math.cos((a0 + a1) / 2 - sunA), rc = rt * 1.2 + 0.4, yc = y0 + H * (0.845 + 0.05 * mrng());
        if (lit > 0.75) continue;                                                // the cream stroke is already there
        misc.add([x + Math.cos(a0) * rc, yc, z + Math.sin(a0) * rc], [x + Math.cos(a1) * rc, yc + 0.2, z + Math.sin(a1) * rc], H * 0.05, lit <= 0.08 ? millShade : millLit, { strength: lit <= 0.08 ? 0.6 : 0.9, seed: mrng() });
      }
    }
    // the sail cross: stocks, lattice and cloth, in the sail plane (x right, y up) about the hub
    const hubY = y0 + H * 0.86, hub = on(rt * 1.25 + 1.6, 0, hubY), speed = (m === 0 ? 1 : rng.range(0.8, 1.25)) * (rng.chance(0.5) || m === 0 ? 1 : 1);
    const piv = [hub[0], hub[1], hub[2], speed], bw = L * 0.115 * (1 + 0.22 * Math.max(0, m - 1));   // far off the cloth is drawn broader: a bold X
    for (let k = 0; k < 4; k++) {
      const ca = Math.cos(k * Math.PI / 2 + 0.3 * m), sa = Math.sin(k * Math.PI / 2 + 0.3 * m);
      const P2 = (px, py, pz) => [px * ca - py * sa, px * sa + py * ca, pz];
      const sd = () => rng();
      sails.add(P2(bw * 0.52, L * 0.2, 0.05), P2(bw * 0.5, L * 0.99, 0.05), bw * 0.86, cloth, { pivot: piv, strength: 0.95, bow: 0.1, seed: sd() });
      sails.add(P2(0, -L * 0.04, 0.2), P2(0, L, 0.2), Math.max(0.42, L * 0.022), pal.white, { pivot: piv, seed: sd() });
      sails.add(P2(bw, L * 0.2, 0.2), P2(bw, L * 0.995, 0.2), Math.max(0.3, L * 0.014), pal.white, { pivot: piv, strength: 0.9, seed: sd(), off: 1 });
      for (let j = 0; j < 7; j++) { const yy = L * (0.2 + 0.8 * j / 6); sails.add(P2(-0.1, yy, 0.25), P2(bw + 0.15, yy, 0.25), Math.max(0.26, L * 0.012), pal.white, { pivot: piv, strength: 0.85, seed: sd(), off: 1 }); }   // off 1: lattice, dropped once thinner than a pixel
      const R2 = L - bw * 0.2, s50 = Math.sin(50 * Math.PI / 180), c50 = Math.cos(50 * Math.PI / 180);
      arcs.add(P2(bw * 0.5, R2, 0.1), P2(R2 * s50, R2 * c50, 0.1), bw * 1.25, arcCol, { pivot: piv, kind: 3, strength: 0.8, bow: R2 * 0.094, seed: sd() });
    }
    mills.push({ base: [x, y0, z], hub, height: H, sail: L, speed });
    await ctx.yield();
  }
  const spinU = { value: 0 }, axle = new THREE.Vector3(AX[0], 0, AX[2]);
  const sailMesh = sails.mesh({ spin: true, spinUniform: spinU, axle }), arcMesh = arcs.mesh({ spin: true, spinUniform: spinU, axle, add: true, shade: false });
  arcMesh.renderOrder = 5; root.add(sailMesh, arcMesh);
  await ctx.yield();

  // ---- near the embankment each stripe breaks into its plants: a dab a head, a green flick a leaf, paper between rows
  const along = (line, s) => {                            // point and right-hand normal at arclength s
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s <= l || i === line.length - 2) { const t = s / l, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l; return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, nx: -tz, nz: tx, tx, tz }; }
      s -= l;
    }
    return null;
  };
  const heads = [], drng = rng.fork('dabs'), stepZ = 0.85 / Math.max(0.5, detail), lane = opts.lane || null;   // lane: [x0, x1, zNear, zFar] local, left without dabs
  let nd = 0;
  for (const s of stripes) {
    if (Math.abs(s.x) > 84 || s.kind === 'ditch') continue;
    const rows = Math.max(2, Math.floor((s.w - 0.6) / 0.95));
    for (let r = 0; r < rows; r++) {
      const rx0 = s.x - (rows - 1) * 0.475 + r * 0.95;
      for (let z = 92 - drng() * stepZ; z > -235; z -= stepZ) {
        const j1 = drng(), j2 = drng();
        if (s.dz !== null && Math.abs(z - s.dz) < 24 + s.shy) continue;
        if (s.x < 0 && z > 0 && Math.abs(Math.hypot(rx0 + 100, z) - 100) < 6.6) continue;   // under the bend of the embankment
        if (lane && rx0 > lane[0] && rx0 < lane[1] && z < lane[2] && z > lane[3]) continue;   // the world plants its own big tulips there
        // beside the bend we cross the rows at an angle: there the plants are scattered, so no row ever flickers past the eye
        const sc = Math.min(1, Math.max(0, (z + 10) / 35)), x = rx0 + (j1 - 0.5) * (0.25 + 0.75 * sc), zz = z + (j2 - 0.5) * 0.3;
        if (s.kind === 'green') style.dab(heads, x, FLOOR + 0.05, zz, 0.55 + j1 * 0.2, 0.2, pal.green, s.off);
        else {
          style.dab(heads, x, FLOOR + 0.32, zz, 0.5 + j2 * 0.14, 0.27, s.c, s.off);
          if (j1 < 0.62) style.dab(heads, x + 0.22, FLOOR + 0.03, zz + 0.3, 0.42, 0.15, pal.green, s.off);
        }
        if (++nd % 2500 === 0) await ctx.yield();
      }
    }
  }
  const dabMesh = await style.dabs(heads, { far: 78 });
  root.add(dabMesh);
  await ctx.yield();

  // ---- dyke grass: a hatch of green flicks leaning downwind near the eye, long strokes down the flanks far off
  const grass = [], grng = rng.fork('grass');
  const nG = Math.round(2600 * detail);
  for (let i = 0; i < nG; i++) {
    const sb = 20 + grng() * grng() * 620, q = along(bankLine, sb), sg = grng.sign(), t = grng(), B = bank();
    const o = sg * (4.65 + 0.9 * t);                      // a ragged fringe along the top of each bank
    style.dab(grass, q.x + q.nx * o, B.top - 0.5 * t + 0.03, q.z + q.nz * o, grng.range(0.9, 1.6) * (0.5 + 0.5 * t), grng.range(0.2, 0.34), grng.chance(0.1) ? pal.cream : pal.green, 0);
  }
  for (let i = 0; i < Math.round(2000 * detail); i++) {
    const q = along(DYKE, grng() * 900), t = grng(), o = -(2.2 + 7 * t) * (grng.chance(0.85) ? 1 : -1);
    style.dab(grass, q.x + q.nx * o, DYKE_TOP - 5.6 * t + 0.03, q.z + q.nz * o, grng.range(1.2, 2.1), grng.range(0.2, 0.32), grng.chance(0.1) ? pal.cream : pal.green, 0);
  }
  await ctx.yield();
  const grassMesh = await style.dabs(grass, { far: 460, lean: 0.55 });
  root.add(grassMesh);
  for (let s0 = 330; s0 < 3050; ) {                       // far flanks of the embankment, both sides
    const len = grng.range(70, 130) * (1 + s0 / 1200), a = along(bankLine, s0), b = along(bankLine, Math.min(3200, s0 + len));
    for (const sg of [-1, 1]) {
      const o = sg * grng.range(5.5, 5.9), y = -2.2 + grng.range(-0.5, 0.5);
      misc.add([a.x + a.nx * o, y, a.z + a.nz * o], [b.x + b.nx * o, y - 0.3, b.z + b.nz * o], grng.range(3.6, 5), pal.green, { strength: grng.range(0.55, 0.8), bow: grng.range(-0.4, 0.4) });
    }
    s0 += len + grng.range(-4, 6);
  }
  for (let s0 = 78; s0 < 2300; ) {                        // the mill dyke's sunlit flank
    const len = grng.range(60, 110) * (1 + s0 / 900), a = along(DYKE, s0), b = along(DYKE, s0 + len), o = -grng.range(5, 6.5);
    misc.add([a.x + a.nx * o, DYKE_TOP - 2.4, a.z + a.nz * o], [b.x + b.nx * o, DYKE_TOP - 2.6, b.z + b.nz * o], grng.range(3.6, 5), pal.green, { strength: grng.range(0.55, 0.8) });
    s0 += len + grng.range(-3, 6);
  }
  // twenty sheep on the mill dyke: a cream dab and a smaller one for the head
  for (let i = 0; i < 20; i++) {
    const q = along(DYKE, grng.range(215, 760)), o = -grng.range(0.5, 6.5), y = DYKE_TOP - Math.max(0, -o - 2.6) * 0.95 + 0.55, f = grng.sign();
    const p = [q.x + q.nx * o, y, q.z + q.nz * o];
    misc.add([p[0] - q.tx * 0.9 * f, y, p[2] - q.tz * 0.9 * f], [p[0] + q.tx * 0.9 * f, y, p[2] + q.tz * 0.9 * f], 1.15, pal.cream, { kind: 2 });
    misc.add([p[0] + q.tx * 0.8 * f, y - 0.25, p[2] + q.tz * 0.8 * f], [p[0] + q.tx * 1.5 * f, y - 0.5, p[2] + q.tz * 1.5 * f], 0.5, pal.cream, { kind: 2 });
  }
  // the first mill's mound: grass stroked down its flank all round, so that close by it is a mound and not a slab of paper
  // (fourth polish) each broad pull of the stick is three narrow ragged ones of different lengths side by side, bowed and
  // dry-tailed (mesh rag 1), so that seen close none of them is a straight-sided slab
  const ragB = style.batch(), mdr = ctx.core && ctx.core.makeRng ? ctx.core.makeRng(ctx.core.hashSeed('pb-mound:' + (ctx.seed ?? 0))) : rng.fork('mound');
  const mound = (a, b, w, col, o, tg) => {
    for (let j = -1; j <= 1; j++) {                         // paper between the three; a cream pull keeps one cream stroke among green
      const sh = j * w * 0.42 + mdr.range(-0.2, 0.2), t0 = mdr.range(0, 0.22), t1 = mdr.range(0.62, 1.08), mx = (t) => [a[0] + (b[0] - a[0]) * t + tg[0] * sh, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + tg[1] * sh];
      const c = col === pal.cream ? (j === 0 ? pal.cream : pal.green) : mdr.chance(0.1) ? pal.cream : col;
      ragB.add(mx(t0), mx(t1), w * mdr.range(0.2, 0.32), c, { strength: Math.min(1, (o.strength || 0.7) + 0.15), bow: mdr.range(-0.5, 0.5), seed: mdr() });
    }
  };
  for (let k = 0; k < 10; k++) {
    const an = (k + grng.range(-0.3, 0.3)) / 10 * 6.2832, ca = Math.cos(an), sa = Math.sin(an), r0 = 8.4, r1 = grng.range(10.2, 11.2);
    mound([MILL1[0] + ca * r0, 0.9, MILL1[1] + sa * r0], [MILL1[0] + ca * r1 + sa * 1.2, grng.range(-7.5, -4.5), MILL1[1] + sa * r1 - ca * 1.2], grng.range(2.8, 3.8), grng.chance(0.15) ? pal.cream : pal.green,
      { strength: grng.range(0.55, 0.8), bow: grng.range(-0.4, 0.4) }, [-sa, ca]);
  }
  // (polish round) no paper body near the eye is left as one black mass: the mound gets a second ring of grass and a hatch
  // round the tower's foot, and the ring dyke is grassed along its top and down its polder flank
  for (let k = 0; k < 14; k++) {
    const an = (k + mrng.range(0.2, 0.8)) / 14 * 6.2832, ca = Math.cos(an), sa = Math.sin(an), r0 = mrng.range(8.8, 9.6), r1 = mrng.range(10.6, 11.6);
    mound([MILL1[0] + ca * r0, mrng.range(-2.5, 0.2), MILL1[1] + sa * r0], [MILL1[0] + ca * r1 - sa * 1.0, mrng.range(-12.5, -9), MILL1[1] + sa * r1 + ca * 1.0], mrng.range(2.2, 3.2), mrng.chance(0.2) ? pal.cream : pal.green,
      { strength: mrng.range(0.55, 0.8), bow: mrng.range(-0.4, 0.4), seed: mrng() }, [-sa, ca]);
  }
  for (let k = 0; k < 9; k++) {
    const a0 = (k + mrng.range(-0.2, 0.2)) / 9 * 6.2832, a1 = a0 + 0.62, r = mrng.range(6.7, 7.3);
    misc.add([MILL1[0] + Math.cos(a0) * r, 1.56, MILL1[1] + Math.sin(a0) * r], [MILL1[0] + Math.cos(a1) * r, 1.56, MILL1[1] + Math.sin(a1) * r], mrng.range(1.0, 1.5), pal.green, { lay: 1, strength: mrng.range(0.6, 0.85), bow: -0.5, seed: mrng() });
  }
  for (const [xa, xb] of [[-94 - 4, -640], [-47 + 4, 420]]) {
    const dir = Math.sign(xb - xa);
    for (let xx = xa; (xb - xx) * dir > 20;) {
      const len = mrng.range(26, 54), x1 = xx + dir * len, col = () => (mrng.chance(0.14) ? pal.cream : pal.green);
      misc.add([xx, RING_TOP + 0.06, 108 + mrng.range(-0.6, 0.6)], [x1, RING_TOP + 0.06, 108 + mrng.range(-0.6, 0.6)], mrng.range(4.2, 5.4), col(), { lay: 1, strength: mrng.range(0.55, 0.8), bow: mrng.range(-0.4, 0.4), off: mrng.range(-8, 8), seed: mrng() });
      misc.add([xx + dir * mrng.range(0, 8), RING_TOP - 2.6, 104.0], [x1, RING_TOP - 2.9, 103.9], mrng.range(3.4, 4.6), col(), { strength: mrng.range(0.5, 0.75), bow: mrng.range(-0.3, 0.3), seed: mrng() });
      misc.add([xx + dir * mrng.range(0, 8), RING_TOP - 7.2, 102.2], [x1, RING_TOP - 7.0, 102.1], mrng.range(3.4, 4.6), col(), { strength: mrng.range(0.45, 0.65), bow: mrng.range(-0.3, 0.3), seed: mrng() });
      xx = x1 + dir * mrng.range(-3, 5);
    }
  }
  await ctx.yield();
  // the canal on the embankment: strokes of reflected sky that slide and are laid again
  if (opts.canal !== false) {
    for (let i = 0; i < 64; i++) {
      const s0 = 10 + i * 13 * (1 + i * 0.035) + grng.range(-4, 4), len = grng.range(18, 42) * (1 + i * 0.03), o = grng.range(-3.3, 3.3);
      const a = along(bankLine, s0), b = along(bankLine, s0 + len), wh = grng.chance(0.22);
      misc.add([a.x + a.nx * o, 0.02, a.z + a.nz * o], [b.x + b.nx * o, 0.02, b.z + b.nz * o], grng.range(0.9, 2.1), wh ? pal.white : pal.cerulean,
        { lay: 1, strength: wh ? 0.6 : grng.range(0.7, 0.95), bow: grng.range(-0.3, 0.3), phase: grng(), period: grng.range(5, 10), off: grng.range(-8, 8) });
    }
  }
  const miscMesh = misc.mesh({});
  root.add(miscMesh, ragB.mesh({ cap: 0.5, rag: 1 }));
  await ctx.yield();

  // ---- the cumulus, the brightest thing in the world, still being heaped at its crown
  const CUM = [1010, 110, -2150], CUMW = 1700, CUMH = 1190, cum = style.batch();   // (coverage round) larger, and a whole white body
  const heap = style.heap(cum, { center: CUM, width: CUMW, height: CUMH, toward: [0, -60], lumps: 28, strokes: Math.round(640 * (0.6 + 0.4 * detail)), rng, open: 1, under: pal.orange });
  const cumMesh = cum.mesh({ shade: false, finger: false, grain: 0.35, cap: 0.5 });
  const cumGroup = new THREE.Group(); root.add(cumGroup);
  cumMesh.renderOrder = 2; cumGroup.add(cumMesh);
  const paperMat = style.paper({ side: THREE.DoubleSide });
  const cloudBody = style.paper({ side: THREE.DoubleSide, color: pal.white.clone().multiplyScalar(0.87), grain: 0.1 });   // the cloud is whole: a white body under its heaped strokes
  const discMesh = new THREE.Mesh(paperDiscs(heap.discs), cloudBody); discMesh.frustumCulled = false; cumGroup.add(discMesh);
  const bodyGeo = new THREE.BufferGeometry(); bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  const body = new THREE.Mesh(bodyGeo, paperMat); body.frustumCulled = false; root.add(body);
  const grassBody = style.paper({ side: THREE.DoubleSide, color: pal.green.clone().multiplyScalar(0.87), grain: 0.17, dir: new THREE.Vector4(0.5, 0.866, 0.45, 1),
    band: new THREE.Vector2(FLOOR - 0.6, FLOOR + (opts.verge ?? 3.8)), bandColor: (opts.vergeColor || pal.rose).clone().multiplyScalar(0.87) });   // dykes: grass pulled down the slope, a flowering verge along the foot
  const grassGeo = new THREE.BufferGeometry(); grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
  const grassMesh2 = new THREE.Mesh(grassGeo, grassBody); grassMesh2.frustumCulled = false; root.add(grassMesh2);
  await ctx.yield();

  // ---- the sky (only when the hero stands alone, or when asked for)
  let sky = null;
  if (opts.sky ?? own) { sky = style.sky(); root.add(sky); await ctx.yield(); }

  // ---- dust: a ridge of each stick's colour riding behind the tips at the band's trailing edge
  const BAND = opts.bandCloud ?? 1, rows = [];
  for (const s of stripes) {
    if (Math.abs(s.x) > 760 || s.kind === 'ditch') continue;
    const n = Math.max(2, Math.round((Math.abs(s.x) < 260 ? 9 : 5) * detail));
    for (let i = 0; i < n; i++) rows.push({ p: [s.x + rng.range(-0.4, 0.4) * s.w, FLOOR, 0], dir: [0, -1], off: s.off * COMB, c: s.c });
  }
  const dust = style.dust(rows, { cloud: BAND, range: [-92, 3050] });
  dust.renderOrder = 6; root.add(dust);
  await ctx.yield();

  // ---- the band of bare paper: one small cloud's shadow crossing the polder on the wind
  const E = new THREE.Vector3(), tmp = new THREE.Vector3();
  let progress = null, spin = 0, gustT = rng.range(0, 6);
  const placeBand = (d) => {                               // d: metres downwind of the point where it crosses the embankment
    root.updateMatrixWorld();
    E.set(WIND_LOCAL[0] * d, 0, -100 + WIND_LOCAL[1] * d).applyMatrix4(root.matrixWorld);
    style.setCloud(BAND, E.x, E.z, 130, opts.bandHalfWidth ?? 520, false);
  };
  // (fourth polish) THE SAILS' SHADOW: opts.bladeSun (WORLD direction the light travels, y < 0) and opts.bladeGround (world y
  // of the bank it falls on) switch it on. The first mill's hub and sail plane are projected along the light, and the four
  // bars of bare paper turn with the cross (style.U.uBlade / uBladeM; the bar's size is uBladeS)
  const bSun = opts.bladeSun || null, bGround = opts.bladeGround ?? 0, bHub = new THREE.Vector3(), bRx = new THREE.Vector3();
  const setBlade = () => {
    if (!bSun || bSun[1] > -0.05) return;
    bHub.set(mills[0].hub[0], mills[0].hub[1], mills[0].hub[2]).applyMatrix4(root.matrixWorld); bRx.set(RX[0], 0, RX[2]).transformDirection(root.matrixWorld);
    const k = 1 / -bSun[1], t0 = (bHub.y - bGround) * k, e2x = bSun[0] * k, e2z = bSun[2] * k, det = bRx.x * e2z - bRx.z * e2x;
    if (Math.abs(det) < 1e-4) return;
    style.U.uBlade.value.set(bHub.x + bSun[0] * t0, bHub.z + bSun[2] * t0, (spin + 37) % (Math.PI * 2), opts.bladeStrength ?? 1);
    style.U.uBladeM.value.set(e2z / det, -e2x / det, -bRx.z / det, bRx.x / det);
  };
  const hero = {
    object: root, radius: 105, height: 44, center: new THREE.Vector3(70, 10, -190), extent: 3100, ground: false, groundY: FLOOR,
    style, stripes, mills, crop, field: fieldMesh, floor, cumulus: cumGroup,   // cumulus: the great cloud's group (hero-local; the world may shift it)
           // field.material.uniforms.uNear: pressure of the field strokes near the eye (the world lowers it when it flies low)
    anchors: {
      entry: [-35.7, 3.2, 76.6], entryHeading: [0.766, 0, -0.643],
      flyThrough: [[-35.7, 3.2, 76.6], [-18.1, 3.2, 57.4], [-6.0, 3.2, 34.2], [0, 3.2, 0], [0, 3.2, -60], [0, 3.2, -120], [0, 3.2, -173]],
      portalSeat: { position: [0, 3.2, -173], facing: [0, 0, 1], radius: 7 },
      reveal: { position: [0, 3.2, 0], lookAt: [60, 14, -400] },
      firstMill: { base: mills[0].base.slice(), hub: mills[0].hub.slice(), sail: mills[0].sail },
      millRow: mills.slice(1).map((m) => m.hub.slice()),
      cumulus: { center: [CUM[0], CUM[1] + CUMH / 2, CUM[2]], top: [CUM[0], CUM[1] + CUMH, CUM[2]], width: CUMW },
      bandCrossing: [0, 0, -100], wind: [WIND_LOCAL[0], 0, WIND_LOCAL[1]], floorY: FLOOR,
    },
    // p 0..1: the band starts over mills three to five (0), goes across the embankment (bare paper at the
    // crossing point from about 0.28 to 0.62) to gone downwind (1). Without it the band loops on its own clock.
    setProgress(p) { progress = p; },
    update(dt, time, camera) {
      if (own) {
        gustT += dt; const g = (gustT % 13) / 13;        // a thumb-smear crossing the right-hand field every 13 s
        tmp.set(150 + WIND_LOCAL[0] * (g * 420 - 60), 0, -260 + WIND_LOCAL[1] * (g * 420 - 60)).applyMatrix4(root.matrixWorld);
        style.setGust(tmp.x, tmp.z, 42, Math.sin(Math.PI * g));
      }
      placeBand(progress === null ? -604 + ((time * style.windSpeed) % 1000) : -340 + 760 * progress);
      if (own) style.update(dt, time, camera);
      spin += dt * (Math.PI * 2 / 6.5); spinU.value = spin % (Math.PI * 2 * 4000);
      setBlade();
    },
    dispose() { if (own) { style.tooth.dispose(); } stripeTex.dispose(); parcelTex.dispose(); nearBand.tex.dispose(); fieldMesh.geometry.dispose(); },
  };
  return hero;
}

// DUST: puffs of opaque flecks born at the stroke tips where cloud `o.cloud`'s trailing edge crosses each row, left
// behind along the row and carried downwind, thinning over three seconds. rows: [{ p: [x, y, z] a point on the
// row, dir: [dx, dz] its unit direction, off: the row's comb offset, c: stick }] in the mesh's local space;
// o.range: [min, max] metres along dir from p where the row exists.
const DUST_VERT = /* glsl */`
  attribute vec3 aP, aCol; attribute vec4 aDir;            // dx, dz, comb offset, seed
  uniform int uWhich; uniform vec2 uRange; uniform float uSpeed;
  varying vec2 vC; varying vec4 vCol;
  ${COMMON}
  void main(){
    vec4 C = uCloud[uWhich];
    vec3 Pw = (modelMatrix * vec4(aP, 1.)).xyz;
    vec2 dW = normalize((mat3(modelMatrix) * vec3(aDir.x, 0., aDir.y)).xz + vec2(1e-6, 0.));
    vec2 w = uWind, c = vec2(-uWind.y, uWind.x), d0 = Pw.xz - C.xy;
    float al0 = dot(d0, w) + aDir.z, ac0 = dot(d0, c), zw = dot(dW, w), zc = dot(dW, c);
    float ia = 1. / max(C.z, 1.), ib = 1. / max(C.w, 1.);
    float A = zw * zw * ia * ia + zc * zc * ib * ib, B = al0 * zw * ia * ia + ac0 * zc * ib * ib;
    float disc = B * B - A * (al0 * al0 * ia * ia + ac0 * ac0 * ib * ib - 1.);
    float sg = zw >= 0. ? 1. : -1.;
    float t = (-B - sg * sqrt(max(disc, 0.))) / max(A, 1e-8);          // where the trailing edge cuts this row
    float cyc = uTime / 3. + aDir.w * 7.31, age = fract(cyc) * 3., h = pbHash(aDir.w * 17. + floor(cyc)), h2 = pbHash(h * 91.7);
    float back = uSpeed / (sg * max(abs(zw), 0.25)) * age;             // the tip has run on since this puff was raised
    float tt = t - back;
    float ok = step(0., disc) * step(uRange.x, tt) * step(tt, uRange.y);
    vec3 pos = Pw + vec3(dW.x, 0., dW.y) * tt + vec3(w.x, 0., w.y) * (2.5 * age + (h - 0.5) * 3.) + vec3(c.x, 0., c.y) * (h2 - 0.5) * 5.
             + vec3(0., 0.5 + (0.9 + h2) * age, 0.);
    float size = (1.3 + 2.0 * age) * (0.7 + 0.6 * h);
    float k = 1. - age / 3.;
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    pos += (right * position.x + up * position.y) * size;
    vC = position.xy; vCol = vec4(aCol, ok * k * sqrt(k) * smoothstep(0., 0.25, age) * 0.3);
    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.);
    if (vCol.a < 0.004) gl_Position = vec4(2., 2., 2., 1.);
  }
`;
const DUST_FRAG = /* glsl */`
  varying vec2 vC; varying vec4 vCol;
  ${COMMON}
  void main(){
    float r = length(vC), g = texture2D(uTooth, vC * 0.3 + vCol.rg * 2.3).r;
    float a = (1. - smoothstep(0.1, 1., r)) * vCol.a * 1.6 - g;                     // flecks of pigment, not a glow
    if (a < 0.) discard;
    gl_FragColor = vec4(vCol.rgb * 0.87, 1.);
  }
`;
function dustMesh(style, rows, o = {}) {
  const n = rows.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const P = new Float32Array(n * 3), D = new Float32Array(n * 4), C = new Float32Array(n * 3);
  rows.forEach((r, i) => { P.set(r.p, i * 3); D.set([r.dir[0], r.dir[1], r.off || 0, (i * 0.618034 + 0.31) % 1], i * 4); C.set([r.c.r, r.c.g, r.c.b], i * 3); });
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3)); g.setAttribute('aDir', new THREE.InstancedBufferAttribute(D, 4));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(C, 3)); g.instanceCount = n;
  const m = new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, depthWrite: false,
    uniforms: { ...style.U, uWhich: { value: o.cloud ?? 1 }, uRange: { value: new THREE.Vector2(...(o.range || [-1e5, 1e5])) }, uSpeed: { value: style.windSpeed } } });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return mesh;
}
