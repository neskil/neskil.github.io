// HERO SET PIECE + STYLE KIT for "The Room Turning Red" (a Fauve interior, painted alla prima).
// The goldfish tank: a glass cylinder as big as a gasometer on a rose-pink side table inside a wreath of twelve
// viridian leaves. Glass is drawn, not rendered: two cobalt ellipses that never close, two uprights that ride the
// silhouette, and on the far inside wall the room behind drawn again (mirrored, squeezed to a third, wrong tubes).
// Four goldfish (fat vermilion strokes, rose tails, black dot eyes) circle at mid-depth; a reflection dab floats on
// the water disc over each; where the red front has repainted the glass each fish keeps a moving window of old blue.
//
// SIZE   origin = centre of the table top (world: x -30, y -8, z -450), +Y up, front +Z. Tank radius 30, rim y 68,
//        water y 65. Table top radius 75; pedestal runs down to y -142 (the floor). radius 60, height 68.
// COST   about 8k triangles and 10 draw calls (9k and 12 with opts.stage) as first built, one more since round 5 (the mesh 'ripples'), ~130 ms build in steps under 30 ms, no lights,
//        one 512x256 RG vine map. Every material is an unlit ShaderMaterial. Place the object by TRANSLATION ONLY (the
//        glass and the fields read world axes).
// OPTS   palette  seven hex strings: canvas, vermilion, cobalt, viridian, lemon, rose, black (the brief's order)
//        detail   0.6-1: thins stroke dabs and wreath marks, never the fish
//        stage    default TRUE for the part viewer: a room shell (floor, four walls, ceiling) in the field material so
//                 the piece can be judged in its style. THE WORLD PASSES stage:false and builds its own room.
//        fish     3-5 (default seeded, mostly 4); cat: true draws the cobalt cat in the glass; catAzimuth (radians,
//                 local, 0 = +Z) default PI (the cat sits at -Z behind the tank)
// ANCHORS (local space) see the end of buildHero: portalSeat, flyThrough, viewpoints, rimLanding, fishOrbit, shadowSide.
// PROGRESS  hero.setFront(d): metres the red front has travelled (the front coordinate of a world point is
//        frontCoord(w) = -w.z + noise, so the tank at world z -450 turns at d ~ 450). Without a call the hero runs its
//        own endless demo keyed to `time` (red over blue, then blue over red, ..., 30 s each). hero.setCatAzimuth(a),
//        hero.fishWorld(i, target) (world position of fish i, for the cat's head), hero.style, hero.vine, hero.fishCount.
//        opts.carp: one large black-and-rose carp in place of the goldfish. hero.fishSide: the goldfish shape without its flat
//        fantail, for the world to fly free on the rare seed.
//        The vine in the glass grows from the front (uGrow); contours read style.uniforms.uResY (drawing-buffer height:
//        update() sets it from ctx.renderer when there is one, otherwise set it yourself each frame).
//
// STYLE EXPORTS (shade the whole world with these; every material is unlit and fog-free, and writes each tube as its
//   plain linear colour: the world returns post.flat = 1, so the engine skips the tone map and nothing is pre-corrected.
//   Part viewer: &flat=1&bloom=0 shows the true colours.)
//   PALETTE, EXPOSURE (=1: set post.exposure to this, flat 1, saturation/contrast 1, bloom 0, no vignette or grain),
//        sceneColor(hex) -> THREE.Color, the hex as a linear colour; makeStyle(ctx, palette) -> { tubes, uniforms }
//        (one per world: uniforms.uTime, uFront, uTube[7], uOldA/uOldB/uNewA/uNewB layer tubes, uSeed, uHalo[8]).
//   STYLE_GLSL  hash/noise, frontCoord(w), strokes(): the jittered lattice of 7 x 2.2 m capsule strokes, fieldColor():
//        old layer + new layer + front + halos + canvas slivers, with the >300 m / <2 px solid fallback.
//   fieldMaterial(style, o)  walls, cloth, floor, ceiling. Geometry needs attributes fu, fv (vec3 world axes of the
//        painted plane; fieldPlane() makes such quads). o.single: [tubeA, tubeB] for a one-layer field (rose table).
//   flatMaterial(style)      solid forms; attribute `tube` (float index 0-6) picks the colour; attribute-free wobble.
//   dabMaterial(style, o)    instanced brush dabs (stroke quads with ragged ends); dabGeometry(list) builds them;
//        o.rise = [y0, range] makes them climb for ever (bubbles, steam). DAB_FRAG: the dab's shape function alone.
//        VINE_GLSL: vineCover() for painting the arabesque from the vine map in your own field shader.
//   contourMaterial(style) + contourGeometry(polylines)  the loose ribbon line: camera-facing, 0.5-1.4 m wide, never
//        under 1.6 px, breathing width, 0.3 Hz wobble, a gap of 6-12 % that drifts round the shape.
//   hullMaterial(style, o)   contour of a solid form as a back-face shell (attributes normal, hull = width, tube, seed);
//        o.halo: the wider shell in the old field colour (the pentimento halo, right from every eye).
//   fieldMaterial o.vine paints the arabesque (growing, tile by tile); dabMaterial o.front / o.birth / o.nod; hero opts.layers.
//   makeVineTexture(ctx, o)  RG map: R distance to the arabesque stem, G arc length from its root (grow with uGrow).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#F1E6CC', '#E2341D', '#1F45B5', '#1F8A66', '#F5D83A', '#F28CA6', '#17141A'];
export const EXPOSURE = 1.0;
export const TUBE = { canvas: 0, vermilion: 1, cobalt: 2, viridian: 3, lemon: 4, rose: 5, black: 6 };

// ---- exact colour: with post.flat = 1 the engine shows a linear colour as written, so a tube is just its hex ----
export function sceneColor(hex) { return new THREE.Color(hex); }

// ---- one style object per world: the seven tubes as linear colours and the uniforms every material shares ----
export function makeStyle(ctx, palette = PALETTE) {
  const pal = PALETTE.map((h, i) => (palette && palette[i]) || h);
  const tubes = pal.map((h) => sceneColor(h));
  const v3 = (c) => new THREE.Vector3(c.r, c.g, c.b);
  const halo = []; for (let i = 0; i < 8; i++) halo.push(new THREE.Vector4(0, -9999, 0, 0));
  const uniforms = {
    uTime: { value: 0 }, uFront: { value: -1e4 },
    uTube: { value: tubes.map(v3) },
    uOldA: { value: v3(tubes[2]) }, uOldB: { value: v3(tubes[3]) },   // old layer: cobalt, one stroke in five viridian
    uNewA: { value: v3(tubes[1]) }, uNewB: { value: v3(tubes[1]) },   // new layer: vermilion
    uShOld: { value: v3(tubes[4]) }, uShNew: { value: v3(tubes[3]) }, // shadow stripe: lemon, then viridian
    uVineCol: { value: v3(tubes[2]) },                                // the arabesque's tube (cobalt by default)
    uSeed: { value: new THREE.Vector2(0.13, 0.71) },                  // lattice seeds of old and new layer
    uHalo: { value: halo },                                           // world-space spheres (xyz, r) the new paint cuts round
    // the last lick (off unless the world sets x = 1): the wall behind the rack of canvases and a band of wall round the window that the front leaves
    // for the end. uLate = (on, wall x, window centre z, floor y); uLateB = (window half-width, sill y, head y, length of the wall patch behind the rack)
    uLate: { value: new THREE.Vector4(0, -330, -472, -150) }, uLateB: { value: new THREE.Vector4(55, -20, 280, 200) },
  };
  return { palette: pal, tubes, uniforms };
}

export const STYLE_GLSL = /* glsl */`
  uniform vec3 uTube[7];
  uniform float uTime, uFront;
  uniform vec3 uOldA, uOldB, uNewA, uNewB, uShOld, uShNew;
  uniform vec2 uSeed;
  uniform vec4 uHalo[8];
  uniform vec4 uLate, uLateB;
  float h11(float n){ return fract(sin(n*127.1 + 1.7)*43758.5453); }
  float h21(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
  // metres the front must have travelled before it reaches world point w: distance along -Z plus slow noise
  float frontCoord(vec3 w){
    float base = -w.z + 0.8*max(w.y + 150., 0.)*smoothstep(-600., -638., w.z)
      + 46.*(vn(vec2(w.x, w.y + w.z*0.2)*0.011 + 3.7) - 0.5) + 16.*(vn(vec2(w.x + w.z*0.3, w.y)*0.045 + 9.1) - 0.5);
    if (uLate.x < 0.5) return base;
    // the wall behind the rack of canvases, below them: laid in from the far end toward the window as we pass
    float rag = vn(vec2(w.z, w.y)*0.021 + 5.3) - 0.5, rag2 = vn(vec2(w.z, w.y)*0.023 + 1.7) - 0.5;
    float zr = w.z - uLate.z - uLateB.x;                                   // metres beyond the window's edge, along the rack
    float mf = step(abs(w.x - uLate.y), 3.)*step(34. + 26.*rag2, zr)*step(zr, uLateB.w + 30.*rag)*step(w.y, 18. + 46.*rag2);
    float lf = 1500. + 10.*(15. + (uLateB.w - zr)/1.03) + 130.*(vn(vec2(w.z, w.y)*0.034 + 8.) - 0.5) + 30.*(vn(vec2(w.z, w.y)*0.11 + 2.) - 0.5);      // a slow lean only: the edge itself is stroke ends, not torn noise
    // the wall round the window: the last lick closes in on the frame and stops a hand's width short of it
    float r = length(max(vec2(abs(w.z - uLate.z) - uLateB.x, max(uLateB.y - w.y, w.y - uLateB.z)), 0.));
    float mw = step(abs(w.x - uLate.y), 3.)*step(r, 35. + 13.*rag2);      // an even border round the window, its edge made by whole strokes
    float lw = 1500. + 10.*(20. + 195.*(1. - r/54.)) + 80.*(vn(vec2(w.z, w.y)*0.04 + 4.) - 0.5) + 1.e5*step(r, 2.6);
    return mix(mix(base, lf, mf), lw, mw);
  }
  // an edge that is either a clean sliver two pixels wide or closed: d = signed distance (> 0 in the gap), off = how far the
  // gap is opened on purpose, aa = filter width. Gaps thinner than the filter are shut instead of half covered.
  float gapd(float d, float off, float aa){ float o = max(off, 0.); return d + min(off, 0.) + o*smoothstep(3.*aa, 5.*aa, o) - 1.6*aa; }

  struct Stroke { float d; float h; float g; float along; vec2 off; };   // g = 1 where the stroke is in the layer's second tube
  // one layer of paint: a brick lattice of capsule strokes 7 x 2.2 m laid along a slow flow field.
  // p in metres on the painted plane. off = vector from the stroke's centre to p, back in plane axes.
  Stroke strokes(vec2 p, float seed){
    float ang = 0.3 + seed*2.3, c = cos(ang), s = sin(ang);
    vec2 w = p + 11.*vec2(vn(p*0.012 + seed*7.1), vn(p*0.012 + seed*3.3 + 19.)) + 1.4*vec2(vn(p*0.06 + 5.), vn(p*0.06 + seed + 31.));
    vec2 q = vec2(c*w.x + s*w.y, -s*w.x + c*w.y);
    float rowf = floor(q.y/2.2), bestKey = -1., bh2 = 0., du = 1e3; vec2 bid = vec2(0.);
    Stroke best; best.d = 1e3; best.h = 0.; best.g = 0.; best.along = 0.; best.off = vec2(0.);
    // strokes are fatter than their rows, so they overlap their neighbours; where two cover, the later (higher hash) wins
    for (int j = -1; j <= 1; j++) {
      float row = rowf + float(j), ry = q.y - (row + 0.5)*2.2;
      float x = q.x + h11(row + seed*13.)*7., cell = floor(x/7.);
      for (int i = -1; i <= 1; i++) {
        vec2 id = vec2(cell + float(i), row);
        float h = h21(id + seed*171.), h2 = fract(h*7.31 + 0.37);
        float cx = (id.x + 0.5)*7. + (h - 0.5)*2.6, dx = x - cx, hl = 3.1 + h2*0.9, r = 1.1 + 0.22*h;
        float yy = ry + (h2 - 0.5)*0.4 - 0.13*sin(dx*0.5 + h*6.283);
        float d = length(vec2(max(abs(dx) - hl, 0.), yy)) - r;
        float key = d < 0. ? 2. + h : 1./(1. + d); du = min(du, d);
        if (key > bestKey) { bestKey = key; best.d = d; best.h = h; bh2 = h2; bid = id;
          best.along = clamp((dx + hl + r)/(2.*(hl + r)), 0., 1.); best.off = vec2(c*dx - s*ry, s*dx + c*ry); }
      }
    }
    best.g = step(0.74, 0.42*bh2 + 0.58*vn(bid*vec2(0.3, 0.1) + seed*9.));
    // the edge of the top stroke shows as a hairline of canvas only here and there (drifts), elsewhere the paint is closed
    best.d = mix(du, best.d, smoothstep(0.66, 0.8, vn(p*0.04 + seed*5. + 2.)));

    return best;
  }
  // how much of the new layer is refused round moving things (0 = paint, 1 = leave the old colour)
  float haloAt(vec3 w, float rag){
    float k = 0.;
    for (int i = 0; i < 8; i++) { vec4 hh = uHalo[i]; k = max(k, step(length(w - hh.xyz), hh.w*(0.8 + 0.45*rag))); }
    return k;
  }
  // THE BIG BRUSH. Far off (where a 2.2 m stroke would fall under three pixels) the wall is laid in with the same hand
  // 3.6 times as large: capsule strokes 25 x 8 m that overlap their neighbours, each with its own turn in the front
  // (a few come early, one in ten a beat late), wiped along its length with a round end. A fresh stroke is lean, so the
  // old colour shows between it and its neighbours; it fattens over the next second or two and the gaps close.
  // Binary but for one pixel of edge; where a stroke is under two pixels the filter (thin()) takes over, see the field below.
  float bigCover(vec2 p, vec3 w, vec3 fu, vec3 fv, float aa){
    Stroke b = strokes(p/3.6 + 31.7, uSeed.y);
    vec3 bw = w - (fu*b.off.x + fv*b.off.y)*3.6;
    float lead = uFront - 8. - frontCoord(bw) - (b.h - 0.5)*56. - 80.*step(0.9, fract(b.h*13.7));
    float rim = clamp(1. + b.d/1.2, 0., 1.);
    float e = lead - b.along*32. - 7.*rim*rim, ea = 1.6*aa;
    float fat = -0.1 + 0.75*smoothstep(15., 110. + 60.*b.h, lead);
    return smoothstep(-ea, ea, e)*(1. - smoothstep(-aa, aa, (b.d - fat)*3.6 - 1.6*aa));
  }
  // THE MEAN TONES a filtered stroke fades to (the designer, 7 Oct 11:20: where a stroke would be thinner than two pixels it fades to
  // the mean tone of its strokes and ground together). Shares of the SURFACE, measured on the lattice itself as strokes() lays it:
  // the second tube takes 0.09 of a layer's strokes (M_B), the slivers of bare canvas 0.02 of the old layer (M_CAN), the new layer's
  // shapes cover 0.997 of what the front has passed (M_NEW). BRUSH_W: the brush's width, the least a stroke of the lattice is across.
  const float BRUSH_W = 2.2, M_B = 0.09, M_CAN = 0.02, M_NEW = 0.997;
  // the stroke's own coordinate: metres across the strokes of the layer laid with this seed (strokes() turns the plane by this angle)
  float across(vec2 p, float seed){ float ang = 0.3 + seed*2.3; return dot(p, vec2(-sin(ang), cos(ang))); }
  // THE MEAN FOLLOWS THE RULE BY METRES: it is the mean of what that rule has left standing at this distance. A stroke keeps the second
  // tube while fract(h*5.3 + 0.21) is over far: measured on the lattice as laid (eight seeds), the share of second-tube surface still
  // standing is 1 - far to within 0.04 (0.89 0.81 0.68 0.59 0.50 0.39 0.32 0.24 0.14 at far 0.1 to 0.9), and nothing at far 1.
  float standing(float far){ return 1. - far; }
  // kb = the share of the second tube's strokes standing, kc = the share of the canvas slivers still open (0 wherever a stroke is thin:
  // gapd shuts a sliver once a pixel covers more than about 0.05 m, long before thin() is over 0). At kb 0, kc 0 it is a itself.
  vec3 meanOld(vec3 a, vec3 b, float kb, float kc){ return mix(uTube[0], mix(a, b, M_B*kb), 1. - M_CAN*kc); }
  // the share of the new layer's strokes laid at w: each is wiped over 11 m of the front and takes its turn within 16 m (t in fieldColor)
  float meanLaid(vec3 w){ return M_NEW*smoothstep(0., 27., uFront - frontCoord(w)); }
  // the same for the big brush: nine in ten of its strokes take their turn within 56 m and are wiped over 32 m, one in ten 80 m late (bigCover)
  float meanBig(vec3 w){ float d = uFront - 8. - frontCoord(w); return 0.9*smoothstep(-28., 60., d) + 0.1*smoothstep(52., 140., d); }
  // The painted field. p plane coords (m), w world position, fu/fv the plane's world axes, pix metres per pixel,
  // keep 0..1 extra refusal of the new layer (from a distance texture round static contours).
  // thin = the filter's three readings (CRISP_GLSL, thin()): the old layer's strokes, the new layer's, the big brush's.
  // Tubes are mixed by one rule only (thin(), here as th: a stroke under two pixels fades to the mean of its strokes and ground, the designer's
  // order of 7 Oct; the one-layer fields and the glass use the same rule); otherwise a far stroke of the second tube drops out whole (its own hash against far),
  // and each stroke of the new layer is either its own shape or, far off, part of a big-brush stroke.
  // FAR is a distance from the eye in metres, the same on every screen: the broad strokes begin 240 m from the eye and are complete
  // at 522 m (where, on a picture 720 lines high through this world's lens of 62 degrees, a pixel of a wall seen square on covers
  // 0.34 and 0.74 m of the brush's plane as it is measured here: 0.6 x the length of the plane's change over one pixel).
  vec3 fieldColor(vec2 p, vec3 w, vec3 fu, vec3 fv, float pix, float keep, vec3 th){
    float far = smoothstep(240., 522., length(w - cameraPosition)), aa = max(pix, 1e-3);
    vec3 col = uOldA, nc = uNewA; float cn = 0., pick = 1.;
    if (far < 0.999) {                                               // near and middle distance: the two lattices of 7 x 2.2 m strokes
      Stroke o = strokes(p, uSeed.x), n = strokes(p, uSeed.y);
      vec3 oc = (o.g > 0.5 && fract(o.h*5.3 + 0.21) > far) ? uOldB : uOldA;
      float co = max(1. - smoothstep(-aa, aa, gapd(o.d, 0.2*(vn(p*0.045 + 7.) - 0.3), aa)), step(0.5, far));   // slivers of bare canvas, in drifts
      col = mix(uTube[0], oc, co);
      col = mix(col, meanOld(uOldA, uOldB, standing(far), 0.), th.x);      // the filter: a thin old stroke and its ground, to the mean of what stands at this far (no canvas in it: the slivers are shut by gapd before a stroke is thin)
      vec3 wc = w - fu*n.off.x - fv*n.off.y;                         // the new stroke's centre in the world
      float t = (uFront - frontCoord(wc) - n.h*16.)/11.;             // wiped along its length over 0.25 s
      float wipe = smoothstep(-0.04, 0.04, t - n.along);
      float refuse = max(keep, haloAt(wc, n.h));
      cn = (1. - smoothstep(-aa, aa, gapd(n.d, -0.05, aa)))*wipe*(1. - refuse);
      nc = (n.g > 0.5 && fract(n.h*5.3 + 0.21) > far) ? uNewB : uNewA;
      pick = step(fract(n.h*3.7 + 0.53), far);                       // this stroke's own choice: itself, or part of a big-brush stroke
      // the filter: a thin new stroke and its ground (the old layer under it), to the share of them the front has laid there
      if (th.y > 0.) { cn = mix(cn, meanLaid(w)*(1. - max(keep, haloAt(w, 0.5))), th.y); nc = mix(nc, mix(uNewA, uNewB, M_B*standing(far)), th.y); }
    }
    if (far > 0.001) cn = mix(cn, bigCover(p, w, fu, fv, aa)*(1. - max(keep, haloAt(w, 0.5))), pick);
    if (th.z > 0.) cn = mix(cn, meanBig(w)*(1. - max(keep, haloAt(w, 0.5))), pick*th.z);      // the filter, on a stroke of the big brush
    return mix(col, nc, cn);
  }
  // 0 before the front, 1 after it has passed world point w (for shadow stripes and anything that changes tube)
  float frontState(vec3 w){ return smoothstep(-3., 3., uFront - frontCoord(w) - 8.); }
`;

// fragment shaders only (fwidth): a coverage made binary again, one pixel of edge, so no soft patch survives it
const CRISP_GLSL = /* glsl */`
  float crisp(float c){ return clamp((c - 0.5)/max(fwidth(c), 1e-4) + 0.5, 0., 1.); }
  // THE FILTER, written once (the designer, 7 Oct 11:20; as a texture's far levels are). w = a stroke's width in its own coordinate q
  // (metres across the stroke): its width on the screen is w over the change of q across one pixel. 0 where the stroke is two pixels
  // wide or more (it is drawn as it is), 1 where it is one pixel or less (it and its ground are their mean tone), even between.
  // It reads q and q's change across a pixel and nothing else, and switches nothing on or off.
  float thin(float w, float q){ return clamp(2. - w/max(length(vec2(dFdx(q), dFdy(q))), 1e-6), 0., 1.); }`;

// ---- FIELD: walls, cloth, floor, ceiling. Geometry carries fu, fv: the world axes of its painted plane ----
// o.single = [tubeA, tubeB]: one layer only (a thing that is not repainted, like the rose table top)
// o.haloTex / o.haloRect (x0, y0, w, h in plane metres): R = distance to the nearest static contour / 16 m
export function fieldMaterial(style, o = {}) {
  const single = o.single ? o.single.map((i) => style.uniforms.uTube.value[i]) : null;
  return new THREE.ShaderMaterial({
    side: o.side ?? THREE.DoubleSide,
    defines: { ...(single ? { SINGLE: 1 } : {}), ...(o.haloTex ? { HALOTEX: 1 } : {}), ...(o.vine ? { VINE: 1 } : {}) },
    // o.vine = { tex, rect, len, main, map: Vector4(originU, originV, cos, sin) plane -> vine coords, grow: {value}, off, hw }
    uniforms: { ...style.uniforms, uVine: { value: o.vine ? o.vine.tex : null }, uVineRect: { value: o.vine ? o.vine.rect : new THREE.Vector4(0, 0, 1, 1) },
      uVineLen: { value: o.vine ? o.vine.len : 1 }, uVineMain: { value: o.vine ? o.vine.main : 1 }, uVineMap: { value: o.vine ? o.vine.map : new THREE.Vector4(0, 0, 1, 0) },
      uVineGrow: o.vine ? o.vine.grow : { value: 0 }, uVineOff: { value: o.vine ? (o.vine.off ?? 0) : 0 }, uVineHW: { value: o.vine ? (o.vine.hw ?? 1.6) : 1.6 }, uSA: { value: single ? single[0] : null }, uSB: { value: single ? single[1] : null },
      uHaloTex: { value: o.haloTex || null }, uHaloRect: { value: o.haloRect || new THREE.Vector4(0, 0, 1, 1) } },
    vertexShader: /* glsl */`
      attribute vec3 fu, fv; varying vec3 vW, vFU, vFV;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vFU = mat3(modelMatrix)*fu; vFV = mat3(modelMatrix)*fv;
        gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      ${CRISP_GLSL}
      ${VINE_GLSL}
      uniform sampler2D uVine; uniform vec4 uVineRect, uVineMap; uniform float uVineLen, uVineMain, uVineGrow, uVineOff, uVineHW; uniform vec3 uVineCol;
      uniform vec3 uSA, uSB; uniform sampler2D uHaloTex; uniform vec4 uHaloRect;
      varying vec3 vW, vFU, vFV;
      void main(){
        vec2 p = vec2(dot(vW, vFU), dot(vW, vFV));
        float pix = 0.6*length(fwidth(p));
        #ifdef SINGLE
          float far = smoothstep(212., 494., length(vW - cameraPosition)), aa = max(pix, 1e-3);      // metres from the eye (0.3 and 0.7 m to the pixel at 720 lines)
          Stroke o = strokes(p, 0.47);
          float co = max(1. - smoothstep(-aa, aa, gapd(o.d, 0.2*(vn(p*0.05 + 3.) - 0.3), aa)), step(0.5, far));
          vec3 col = mix(uTube[0], (o.g > 0.5 && fract(o.h*5.3 + 0.21) > far) ? uSB : uSA, co);
          col = mix(col, meanOld(uSA, uSB, standing(far), 0.), thin(BRUSH_W, across(p, 0.47)));      // the filter: a thin stroke and its ground, to the mean of what stands at this far
        #else
          float keep = 0.;
          #ifdef HALOTEX
            vec2 huv = (p - uHaloRect.xy)/max(uHaloRect.zw, vec2(1e-3));
            float hd = texture2D(uHaloTex, huv).r*16.;
            keep = step(hd, 1.6)*step(0., huv.x)*step(huv.x, 1.)*step(0., huv.y)*step(huv.y, 1.);
          #endif
          // the filter's readings for the field's three hands: each by its own strokes' coordinate (the big brush is the new layer's, 3.6 times as large)
          vec3 th = vec3(thin(BRUSH_W, across(p, uSeed.x)), thin(BRUSH_W, across(p, uSeed.y)), thin(BRUSH_W, across(p/3.6, uSeed.y)));
          vec3 col = fieldColor(p, vW, vFU, vFV, pix, keep, th);
          #ifdef VINE
            // the arabesque: drawn in its own tube over the new paint only, growing tile by tile from its root
            vec2 q = p - uVineMap.xy; q = vec2(uVineMap.z*q.x + uVineMap.w*q.y, -uVineMap.w*q.x + uVineMap.z*q.y);
            float tile = floor((q.x - uVineRect.x)/max(uVineRect.z, 1e-3));
            float hwv = uVineHW*(0.85 + 0.3*vn(q*0.05 + 2.));
            float vc = vineCover(uVine, uVineRect, uVineLen, q, max(hwv, 1.1*pix), uVineGrow - uVineOff - tile*uVineMain, max(pix, 1e-3)*1.2);
            vc = smoothstep(0.3, 0.7, vc)*step(0., tile)*step(frontCoord(vW), uFront - 22.)*(1. - keep);
            float gate = step(0., tile)*step(frontCoord(vW), uFront - 22.)*(1. - keep)*step(pix, 0.12);      // the sliver beside the stem: two pixels wide or not there
            float ve = vineCover(uVine, uVineRect, uVineLen, q + vec2(0.5, 0.42), max(hwv, 1.1*pix) + 0.42, uVineGrow - uVineOff - tile*uVineMain, max(pix, 1e-3)*1.2);
            col = mix(col, uTube[0], crisp(ve)*gate*step(0.3, vn(q*0.09 + 5.)));
            col = mix(col, uVineCol, vc);
          #endif
        #endif
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}
// a quad (or grid) lying in the plane through `origin` spanned by unit axes u, v: sx by sy metres, centred
export function fieldPlane(origin, u, v, sx, sy, nx = 1, ny = 1) {
  const pos = [], fu = [], fv = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const a = (i / nx - 0.5) * sx, b = (j / ny - 0.5) * sy;
    pos.push(origin.x + u.x * a + v.x * b, origin.y + u.y * a + v.y * b, origin.z + u.z * a + v.z * b);
    fu.push(u.x, u.y, u.z); fv.push(v.x, v.y, v.z);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('fu', new THREE.Float32BufferAttribute(fu, 3)); g.setAttribute('fv', new THREE.Float32BufferAttribute(fv, 3));
  g.setIndex(idx); return g;
}

// ---- FLAT: solid forms in one tube each. attribute `tube` (float 0-6; 7 = shadow stripe tube by front state) ----
export function flatMaterial(style, o = {}) {
  return new THREE.ShaderMaterial({
    side: o.side ?? THREE.DoubleSide, uniforms: { ...style.uniforms },
    vertexShader: /* glsl */`
      attribute float tube; varying float vTube; varying vec3 vW;
      void main(){ vTube = tube; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying float vTube; varying vec3 vW;
      void main(){ int k = int(clamp(vTube + 0.5, 0., 6.));
        vec3 col = uTube[k];
        if (vTube > 6.5) col = mix(uShOld, uShNew, frontState(vW));
        gl_FragColor = vec4(col, 1.); }`,
  });
}

// ---- DABS: instanced brush marks. Each is a quad bent a little along its length, cut to a stroke with a round
// loaded start and a ragged, bristled lift-off. list items: { p:[x,y,z], a:[..] half-length axis, b:[..] half-width
// axis, tube, seed, bend } (tube 7 = shadow stripe). They shift a hand's width, slowly, so canvas slivers open and close.
export function dabGeometry(list) {
  const base = new THREE.PlaneGeometry(2, 2, 6, 1);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  const n = list.length, iP = new Float32Array(n * 3), iA = new Float32Array(n * 3), iB = new Float32Array(n * 3), iT = new Float32Array(n * 3), iG = new Float32Array(n);
  list.forEach((d, i) => { iP.set(d.p, i * 3); iA.set(d.a, i * 3); iB.set(d.b, i * 3); iT[i * 3] = d.tube; iG[i] = d.born ?? -1e6; iT[i * 3 + 1] = d.seed ?? (i * 0.6180339) % 1; iT[i * 3 + 2] = d.bend ?? 0; });
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 3)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 3));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 3)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 3));
  g.setAttribute('iG', new THREE.InstancedBufferAttribute(iG, 1));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
export const DAB_FRAG = /* glsl */`
  // uv in -1..1 (x along the stroke), ar = length/width, seed. Returns signed coverage (> 0 inside).
  float dabShape(vec2 uv, float ar, float seed){
    float x = uv.x*ar, hl = ar - 1.;
    float edge = 0.12*sin(uv.x*5. + seed*40.) + 0.07*sin(uv.x*13. + seed*91.);
    float d = length(vec2(max(abs(x) - hl, 0.), uv.y + edge*0.5)) - (0.86 + edge*0.5);
    float br = h11(floor((uv.y + 1.)*5.5) + seed*57.);                // bristles: the tail lifts off unevenly
    float lift = smoothstep(0.35, 1.0, uv.x) * (0.25 + 1.3*br);
    return -(d + lift*0.55);
  }`;
export function dabMaterial(style, o = {}) {
  if (!style.uniforms.uResY) style.uniforms.uResY = { value: 900 };
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...style.uniforms, uRise: { value: new THREE.Vector2(o.rise ? o.rise[0] : 0, o.rise ? o.rise[1] : 1) },
      uBirth: o.birth || { value: 1e6 }, uBirthSpan: { value: o.span ?? 1 }, uNod: { value: o.nod ?? 0 }, uMinPx: { value: o.minPx ?? 0 } },
    // o.front: the dab is a stroke of the NEW layer, wiped on along its length when the front reaches it (tube 8 = new, 9 = old layer tube)
    // o.birth = { value }: a clock; a dab with d.born grows from nothing as the clock passes it. o.nod: sway in metres per metre of height
    defines: { ...(o.rise ? { RISE: 1 } : {}), ...(o.front ? { FRONTLAID: 1 } : {}), ...(o.minPx ? { MINPX: 1 } : {}) },      // o.minPx: smallest half-thickness in pixels (see MINPX below)
         // o.rise = [y0, range]: the dabs climb through that band for ever (bubbles, steam commas)
    vertexShader: /* glsl */`
      uniform float uTime; uniform vec2 uRise;
      uniform float uBirth, uBirthSpan, uNod, uMinPx, uResY;
      attribute vec3 iP, iA, iB, iT; attribute float iG; varying vec2 vUv; varying vec3 vT; varying vec3 vW; varying float vAr; varying float vBorn;
      void main(){ vUv = position.xy; vT = iT;
        float ph = iT.y*6.283;
        float born = clamp((uBirth - iG)/max(uBirthSpan, 1e-3), 0., 1.); born = born*born*(3. - 2.*born);
        #ifdef MINPX
          // the style's thinnest mark: a dab whose stroke would be under about two pixels thick on screen (its half-width as
          // projected, foreshortening included) is not laid at all. Each against its own seed, so far dabs drop out whole,
          // one at a time, and come in whole as the eye nears: never a speck, never a fade.
          mat4 pvm = projectionMatrix*viewMatrix*modelMatrix;
          vec4 c0 = pvm*vec4(iP, 1.), c1 = pvm*vec4(iP + iA, 1.), c2 = pvm*vec4(iP + iB, 1.);
          if (c0.w > 0.5 && c1.w > 0.5 && c2.w > 0.5) {
            vec2 sc = 0.5*max(uResY, 1.)*vec2(projectionMatrix[1][1]/max(projectionMatrix[0][0], 1e-4), 1.);
            vec2 s0 = c0.xy/c0.w, sA = (c1.xy/c1.w - s0)*sc, sB = (c2.xy/c2.w - s0)*sc;
            float thick = abs(sA.x*sB.y - sA.y*sB.x)/max(length(sA), 1e-3);
            if (thick < uMinPx*(0.85 + 0.6*iT.y) || length(sA) < uMinPx*3.) born = 0.;
          }
        #endif
        vBorn = born;
        vec3 l = iP + (iA*position.x + iB*(position.y + iT.z*(1. - position.x*position.x)))*born
               + iB*(0.10*sin(uTime*0.9 + ph)) + iA*(0.04*sin(uTime*0.6 + ph*1.7));
        vAr = length(iA)/max(length(iB), 1e-3);
        #ifdef RISE
          l.y = uRise.x + mod(l.y - uRise.x + uTime*(1.3 + 1.8*iT.y), max(uRise.y, 1.));
          l.x += 0.7*sin(uTime*1.3 + ph + l.y*0.2); l.z += 0.5*sin(uTime*1.1 + ph*2.3 + l.y*0.17);
        #endif
        l.xz += uNod*max(l.y, 0.)*vec2(sin(uTime*0.7 + l.x*0.05 + l.y*0.04), cos(uTime*0.53 + l.z*0.05))*0.5;
        vec4 w = modelMatrix*vec4(l, 1.); vW = (modelMatrix*vec4(iP, 1.)).xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      ${DAB_FRAG}
      varying vec2 vUv; varying vec3 vT; varying vec3 vW; varying float vAr; varying float vBorn;
      void main(){
        float sd = floor(vT.y*1024. + 0.5)/1024.;          // whole per dab: an interpolated seed stipples the bristled edge when the dab is large on screen
        if (vBorn < 0.01 || dabShape(vUv, max(vAr, 1.), sd) < 0.) discard;
        int k = int(clamp(vT.x + 0.5, 0., 6.)); vec3 col = uTube[k];
        #ifdef FRONTLAID
          float tw = (uFront - frontCoord(vW) - vT.y*16.)/11.;
          if (vT.x > 7.5 && vT.x < 8.5) { if (tw < vUv.x*0.5 + 0.5 || haloAt(vW, vT.y) > 0.5) discard; col = fract(vT.y*7.31) > 0.8 ? uNewB : uNewA; }
          if (vT.x > 8.5) { if (tw > vUv.x*0.5 + 0.5 && (fract(vT.y*13.7) < 0.72 || abs(vUv.y + 0.3*sin(vUv.x*3. + vT.y*20.)) > 0.2)) discard; col = fract(vT.y*7.31) > 0.8 ? uOldB : uOldA; }   // painted over
        #endif
        if (vT.x > 6.5 && vT.x < 7.5) col = mix(uShOld, uShNew, frontState(vW));
        gl_FragColor = vec4(col, 1.); }`,
  });
}

// ---- CONTOUR: the loose ribbon line. lines: [{ pts:[[x,y,z],...], closed, width (m), tube, seed, gap }] ----
export function contourGeometry(lines) {
  const pos = [], tan = [], a0 = [], a1 = [], idx = []; let base = 0;
  for (const L of lines) {
    const P = L.pts, n = P.length, closed = !!L.closed, cnt = closed ? n + 1 : n;
    let len = 0; const arc = [0];
    for (let i = 1; i < cnt; i++) { const p = P[i % n], q = P[(i - 1) % n]; len += Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); arc.push(len); }
    for (let i = 0; i < cnt; i++) {
      const p = P[i % n];
      const pa = closed ? P[(i - 1 + n) % n] : P[Math.max(i - 1, 0)], pb = closed ? P[(i + 1) % n] : P[Math.min(i + 1, n - 1)];
      let tx = pb[0] - pa[0], ty = pb[1] - pa[1], tz = pb[2] - pa[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      for (let s = -1; s <= 1; s += 2) {
        pos.push(p[0], p[1], p[2]); tan.push(tx, ty, tz);
        a0.push(s, arc[i] / Math.max(len, 1e-3), len, L.width ?? 1);
        a1.push(L.tube ?? 6, L.seed ?? 0, closed ? (L.gap ?? 0.09) : 0, closed ? 1 : 0);
      }
      if (i < cnt - 1) { const k = base + i * 2; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
    }
    base += cnt * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('tan', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('a0', new THREE.Float32BufferAttribute(a0, 4)); g.setAttribute('a1', new THREE.Float32BufferAttribute(a1, 4));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
export function contourMaterial(style, o = {}) {
  if (!style.uniforms.uResY) style.uniforms.uResY = { value: 900 };   // drawing-buffer height; the world may keep it current
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...style.uniforms, uLift: { value: o.lift ?? 0.35 } },
    vertexShader: /* glsl */`
      uniform float uTime, uResY, uLift;
      attribute vec3 tan; attribute vec4 a0, a1; varying vec4 vA; varying float vG;
      void main(){
        float arc = a0.y, len = a0.z, seed = a1.y, s = arc*len;
        // redrawn slowly: a 0.3 Hz wobble of the line itself
        vec3 wob = vec3(sin(s*0.11 + seed*17. + uTime*1.9), sin(s*0.083 + seed*5. - uTime*1.6), sin(s*0.097 + seed*29. + uTime*1.3));
        wob += 0.5*vec3(sin(s*0.31 + seed*3.), sin(s*0.27 + seed*11.), sin(s*0.23 + seed*7.));
        float wscale = min(a0.w, 1.2)*0.34;
        vec4 pv = viewMatrix*modelMatrix*vec4(position + wob*wscale, 1.);
        vec3 tv = mat3(viewMatrix)*mat3(modelMatrix)*tan;
        vec3 c = cross(tv, pv.xyz); c /= max(length(c), 1e-4);
        // the gap drifts round a closed shape; open lines taper at both ends
        float g = fract(arc + seed + uTime*(0.006 + 0.004*fract(seed*7.)));
        float taper = a1.w > 0.5 ? smoothstep(a1.z, a1.z + 0.07, g)*(1. - smoothstep(0.93, 1., g)) : smoothstep(0., 0.08, arc)*(1. - smoothstep(0.9, 1., arc));
        float swell = 0.78 + 0.3*sin(s*0.19 + seed*13. + uTime*0.7) + 0.16*sin(s*0.53 - uTime*1.1 + seed*31.);
        float px = -pv.z*2./(projectionMatrix[1][1]*max(uResY, 1.));       // metres per pixel at this depth
        float w = max(a0.w*swell*(0.3 + 0.7*taper), 1.7*px);
        pv.xyz += c*a0.x*w*0.5; pv.z += uLift;                             // lifted toward the eye, so it sits on its shape
        vA = a1; vG = g; gl_Position = projectionMatrix*pv; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec4 vA; varying float vG;
      void main(){ if (vA.w > 0.5 && vG < vA.z) discard;
        gl_FragColor = vec4(uTube[int(clamp(vA.x + 0.5, 0., 6.))], 1.); }`,
  });
}

// ---- HULL: the contour of a solid form, and its pentimento. The same geometry as the form (position, normal,
// attribute hull = vec3(width m, tube, seed)), drawn back faces only and pushed out along the normal: what shows
// round the silhouette is a loose line that swells, thins and has a soft place that wanders, never under 1.7 px.
// o.halo: a second, wider shell in the OLD field colour: invisible on the old field, a ragged halo once the new
// colour has been cut in behind the form, from any eye and moving with whatever moves.
export function hullMaterial(style, o = {}) {
  if (!style.uniforms.uResY) style.uniforms.uResY = { value: 900 };
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, defines: o.halo ? { HALO: 1 } : {},
    uniforms: { ...style.uniforms, uHaloW: { value: o.width ?? 1.9 } },
    vertexShader: /* glsl */`
      ${STYLE_GLSL}
      uniform float uResY, uHaloW;
      attribute vec3 hull; varying float vTube;
      void main(){
        vec4 pv = modelViewMatrix*vec4(position, 1.);
        vec3 n = normalMatrix*normal; n /= max(length(n), 1e-4);
        float sd = hull.z*31., s = dot(position, vec3(0.21, 0.17, 0.19));
        float swell = 0.85 + 0.3*sin(s*0.9 + sd + uTime*0.7) + 0.16*sin(s*2.3 - uTime*1.1 + sd*3.);
        float soft = smoothstep(-0.75, -0.35, sin(s*0.33 + sd*2. + uTime*0.12));      // the place where the line nearly gives out
        float px = -pv.z*2./(projectionMatrix[1][1]*max(uResY, 1.));
        float w = max(hull.x*swell*(0.3 + 0.7*soft), 1.7*px);
        #ifdef HALO
          float hn = vn(position.xy*0.19 + position.zx*0.16 + sd), hk = smoothstep(0.36, 0.5, hn);      // hk 0: the new colour was cut right up to the line
          float rag = 0.55 + 0.9*vn(position.yz*0.83 + position.x*0.61 + sd*3.) + 0.2*sin(s*1.7 + uTime*0.5 + sd);
          w += hk*max(uHaloW*(0.25 + 2.3*smoothstep(0.42, 0.9, hn))*rag, 2.*px);
          pv.z -= 0.6;
        #endif
        pv.xyz += n*w;
        vTube = hull.y; gl_Position = projectionMatrix*pv; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTube[7]; uniform vec3 uOldA; varying float vTube;
      void main(){
        #ifdef HALO
          gl_FragColor = vec4(uOldA, 1.);
        #else
          gl_FragColor = vec4(uTube[int(clamp(vTube + 0.5, 0., 6.))], 1.);
        #endif
      }`,
  });
}

// ---- ARABESQUE: RG map. R = distance to the stem / 8 m, G = arc length from the root / length. Tiles in x. ----
// Paint cobalt where R*8 < stem half-width and G*length < grow. rect = (x0, y0, w, h) in plane metres.
export async function makeVineTexture(ctx, o = {}) {
  const rng = o.rng || ctx.rng.fork('vine'), W = 512, H = 256, cycles = 3, S = 96, step = 1.2;
  const amp = rng.range(0.85, 1.1), ph = rng.range(0, 6.28);
  const pts = []; let x = 0, y = 0, s = 0;
  const heading = (ss) => amp * Math.sin((ss / S) * Math.PI * 2 + ph) + 0.25 * Math.sin((ss / S) * Math.PI * 4 + ph * 2);
  const nMain = Math.round((cycles * S) / step);
  for (let i = 0; i <= nMain; i++) { pts.push([x, y, s, 1]); const h = heading(s); x += Math.cos(h) * step; y += Math.sin(h) * step; s += step; }
  const period = x, total = s, tendrils = [];
  // curls: a tendril leaves the stem every half S on alternate sides and winds into a spiral
  for (let k = 0; k < cycles * 2; k++) {
    const i0 = Math.round(((k + 0.5 + rng.range(-0.08, 0.08)) * S * 0.5) / step), side = k % 2 ? 1 : -1, p0 = pts[Math.min(i0, nMain)];
    let tx = p0[0], ty = p0[1], h = heading(p0[2]) + side * 0.5, ts = p0[2]; const L = rng.range(44, 60), tp = [];
    for (let d = 0; d < L; d += step) { tp.push([tx, ty, ts, 1 - 0.5 * d / L]); h += side * step * (0.012 + 0.27 * Math.pow(d / L, 2.2)); tx += Math.cos(h) * step; ty += Math.sin(h) * step; ts += step; }
    tendrils.push(tp);
  }
  const tips = tendrils.map((tp) => { const e = tp[tp.length - 1]; return [e[0], e[1], e[2]]; });      // [x, y, arc length] of each curl's end
  let y0 = 1e9, y1 = -1e9; for (const L of [pts, ...tendrils]) for (const p of L) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  y0 -= 10; y1 += 10; const hgt = y1 - y0, data = new Uint8Array(W * H * 2).fill(255), dist = new Float32Array(W * H).fill(8);
  const sx = W / period, sy = H / hgt, rad = 8; let cnt = 0;
  for (const L of [pts, ...tendrils]) for (let i = 0; i < L.length - 1; i++) {
    const a = L[i], b = L[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], el = ex * ex + ey * ey || 1;
    const i0 = Math.floor((mx - rad) * sx), i1 = Math.ceil((mx + rad) * sx), j0 = Math.max(0, Math.floor((my - y0 - rad) * sy)), j1 = Math.min(H - 1, Math.ceil((my - y0 + rad) * sy));
    for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) {
      const px = (ii + 0.5) / sx, py = (j + 0.5) / sy + y0, t = clamp(((px - a[0]) * ex + (py - a[1]) * ey) / el, 0, 1);
      const d = Math.hypot(px - a[0] - ex * t, py - a[1] - ey * t) + (1 - a[3]) * 1.2, k = j * W + (((ii % W) + W) % W);
      if (d < dist[k]) { dist[k] = d; data[k * 2] = Math.round((d / 8) * 255); data[k * 2 + 1] = Math.round(clamp(a[2] / (total + 62), 0, 1) * 255); }
    }
    if (++cnt % 30 === 0) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return { texture: tex, rect: new THREE.Vector4(0, y0, period, hgt), length: total + 62, main: total, period, tips };
}
export const VINE_GLSL = /* glsl */`
  // coverage of the arabesque at plane point p: stem half-width hw, grown as far as arc length grow
  float vineCover(sampler2D t, vec4 rect, float len, vec2 p, float hw, float grow, float aa){
    vec2 uv = (p - rect.xy)/max(rect.zw, vec2(1e-3)); vec2 rg = texture2D(t, uv).rg;
    float inY = step(0., uv.y)*step(uv.y, 1.);
    return (1. - smoothstep(-aa, aa, rg.r*8. - hw))*step(rg.g*len, grow)*inY;
  }`;

// ---- small geometry helpers (all write position + tube) ----
function pushGeo(acc, pos, idx, tube) {
  const base = acc.pos.length / 3;
  for (let i = 0; i < pos.length; i++) acc.pos.push(pos[i]);
  for (let i = 0; i < pos.length / 3; i++) acc.tube.push(tube);
  for (let i = 0; i < idx.length; i++) acc.idx.push(idx[i] + base);
}
function accGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3)); g.setAttribute('tube', new THREE.Float32BufferAttribute(acc.tube, 1));
  g.setIndex(acc.idx); g.computeBoundingSphere(); return g;
}
// surface of revolution from a profile [[r, y], ...]; wob(theta, k) scales the radius so nothing is machine-round
function lathe(acc, prof, seg, tube, wob = () => 1, cy = 0) {
  const pos = [], idx = [], n = prof.length;
  for (let j = 0; j < n; j++) for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2, r = prof[j][0] * wob(a, j); pos.push(Math.sin(a) * r, prof[j][1] + cy, Math.cos(a) * r); }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  pushGeo(acc, pos, idx, tube);
}
// a flat shape in the XZ plane at height y from an outline [[x, z], ...] (fan from its centroid)
function flatShape(acc, outline, y, tube) {
  let cx = 0, cz = 0; for (const p of outline) { cx += p[0]; cz += p[1]; } cx /= outline.length; cz /= outline.length;
  const pos = [cx, y, cz], idx = [], n = outline.length;
  for (const p of outline) pos.push(p[0], y, p[1]);
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n));
  pushGeo(acc, pos, idx, tube);
}
// a leaf: pointed, a little S-bent, drawn by hand. Returns its outline and midrib in XZ.
function leafOutline(cx, cz, ang, L, Wd, bend, rng) {
  const out = [], rib = [], n = 13, ca = Math.cos(ang), sa = Math.sin(ang), k = rng.range(0.38, 0.5), j = [];
  for (let i = 0; i <= n; i++) j.push(rng.range(0.9, 1.1));
  const at = (t, side) => {
    const x = (t - 0.5) * L, mid = bend * L * Math.sin(t * Math.PI) * 0.5 + 0.06 * L * Math.sin(t * Math.PI * 2);
    const prof = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, k / 0.5 * 0.8))), 0.85) * Wd * 0.5 * j[Math.round(t * n)];
    const z = mid + side * prof; return [cx + ca * x - sa * z, cz + sa * x + ca * z];
  };
  for (let i = 0; i <= n; i++) out.push(at(i / n, 1));
  for (let i = n - 1; i >= 1; i--) out.push(at(i / n, -1));
  for (let i = 1; i < n; i++) rib.push(at(0.04 + 0.8 * (i / n), 0));
  return { out, rib };
}

const RT = 30, RIM = 68, WATER = 65, TABLE_R = 75, FLOOR_Y = -142, ROOM_R = 190;
const cp = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
function ring(r, y, n, wob, seed) { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = r * (1 + wob * Math.sin(a * 3 + seed * 9) + wob * 0.6 * Math.sin(a * 5 + seed * 23)); p.push([Math.sin(a) * rr, y, Math.cos(a) * rr]); } return p; }
// a bent dab lying flat at height y along the circle of radius r, from angle a0 to a1, half-width hw
function arcDab(r, a0, a1, y, hw, tube, seed) {
  const am = (a0 + a1) / 2, al = Math.abs(a1 - a0) / 2, c = cp(am, r * Math.cos(al)), t = cp(am + Math.PI / 2, r * Math.sin(al)), o = cp(am, hw);
  return { p: [c[0], y, c[1]], a: [t[0], 0, t[1]], b: [o[0], 0, o[1]], tube, seed, bend: (r * (1 - Math.cos(al))) / hw };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('goldfish-tank');
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const style = opts.style || makeStyle(ctx, opts.palette);
  const U = style.uniforms, T = TUBE;
  const object = new THREE.Group(); object.name = 'goldfish-tank';
  const nFish = clamp(Math.round(opts.fish ?? rng.pick([4, 4, 4, 3, 5])), 3, 5);
  // opts.carp: the other cast. One large carp, about three goldfish long, in place of the goldfish: a black body stroke with rose
  // strokes on its flanks, rose tail and fins, a lemon eye, its own window of the old colour and one reflection dab.
  const carp = !!opts.carp, nShow = carp ? 1 : nFish, FK = carp ? 2.7 : 1;
  const berryTube = rng.pick([T.lemon, T.lemon, T.cobalt, T.canvas]);
  const flat = { pos: [], tube: [], idx: [] }, lines = [], dabs = [];

  // --- the rose-pink side table: moulded edge, turned pedestal, spreading foot ---
  const tw = rng.range(0, 6.28), wobT = (a, j) => 1 + 0.006 * Math.sin(a * 3 + tw) + 0.004 * Math.sin(a * 7 + j);
  lathe(flat, [[75.2, 0], [76.1, -1.3], [75.3, -3.5], [72.6, -5.2], [72.1, -8.6], [68.5, -10.2], [22, -13.5], [13.5, -17]], 56, T.rose, wobT);
  lathe(flat, [[13.5, -17], [10.5, -23], [14.5, -31], [17.5, -41], [12.5, -53], [8.8, -61], [8.2, -90], [10.4, -98], [15.6, -104], [11.5, -112],
    [9.4, -120], [14, -128], [29, -135.5], [39.5, -139.5], [41, FLOOR_Y]], 28, T.rose, (a, j) => 1 + 0.02 * Math.sin(a * 2 + tw + j * 0.4));
  lines.push({ pts: ring(75.9, 0.2, 80, 0.004, tw), closed: true, width: 1.35, tube: T.black, seed: rng(), gap: 0.07 });
  lines.push({ pts: ring(72.4, -8.6, 64, 0.005, tw + 1), closed: true, width: 0.9, tube: T.black, seed: rng(), gap: 0.12 });
  for (const [r, y, w] of [[17.9, -41, 0.9], [15.9, -104, 0.8], [40.4, -139.5, 1.1]]) lines.push({ pts: ring(r, y, 36, 0.02, rng()), closed: true, width: w, tube: T.black, seed: rng(), gap: 0.1 });
  // shadow stripe of the table on the floor: a band of the field's opposite along its right-hand foot
  dabs.push(arcDab(49, 0.75, 2.35, FLOOR_Y + 0.4, 5.2, 7, rng()));
  await ctx.yield();

  // --- the table top: a one-layer rose field (strokes, canvas slivers) ---
  {
    const pos = [0, 0, 0], idx = [], n = 72;
    for (let i = 0; i < n; i++) { const c = cp((i / n) * Math.PI * 2, 75.3 * wobT((i / n) * Math.PI * 2, 0)); pos.push(c[0], 0, c[1]); idx.push(0, 1 + i, 1 + ((i + 1) % n)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const fu = [], fv = []; for (let i = 0; i <= n; i++) { fu.push(1, 0, 0); fv.push(0, 0, -1); }
    g.setAttribute('fu', new THREE.Float32BufferAttribute(fu, 3)); g.setAttribute('fv', new THREE.Float32BufferAttribute(fv, 3)); g.setIndex(idx);
    const top = new THREE.Mesh(g, fieldMaterial(style, { single: [T.rose, T.rose] })); top.name = 'table-top'; object.add(top);
  }

  // --- the wreath: twelve viridian leaves laid flat round the tank, each on its own sliver of bare canvas ---
  const leafDir = rng.chance(0.5) ? 1 : -1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rng.range(-0.05, 0.05), r = 53 + rng.range(-2.5, 2.5), c = cp(a, r);
    const ang = -a + (i % 2 ? 0.42 : -0.3) * leafDir + rng.range(-0.12, 0.12);       // tangential, tipped in and out in turn
    const L = rng.range(27, 32), Wd = rng.range(10, 12.5), lf = leafOutline(c[0], c[1], ang, L, Wd, rng.range(-0.12, 0.12), rng);
    const sh = [rng.range(-0.6, 0.6), rng.range(-0.6, 0.6)];
    flatShape(flat, lf.out.map((p) => [c[0] + (p[0] - c[0]) * 1.07 + sh[0], c[1] + (p[1] - c[1]) * 1.07 + sh[1]]), 0.12, T.canvas);
    flatShape(flat, lf.out, 0.24, T.viridian);
    lines.push({ pts: lf.out.map((p) => [p[0], 0.5, p[1]]), closed: true, width: 1.05, tube: T.black, seed: rng(), gap: 0.1 });
    lines.push({ pts: lf.rib.map((p) => [p[0], 0.5, p[1]]), closed: false, width: 0.7, tube: T.black, seed: rng() });
    for (const i3 of [3, 6, 9]) for (const sd of [0, 1]) {           // side veins, drawn quickly
      const tr = 0.04 + 0.8 * (i3 / 13), j = Math.min(12, Math.round((tr + 0.13) * 13)), e = lf.out[sd ? 26 - j : j], q = lf.rib[i3 - 1];
      const m = [lerp(q[0], e[0], 0.36) + rng.range(-0.3, 0.3), lerp(q[1], e[1], 0.36) + rng.range(-0.3, 0.3)], f = [lerp(q[0], e[0], 0.7), lerp(q[1], e[1], 0.7)];
      lines.push({ pts: [[q[0], 0.5, q[1]], [lerp(q[0], m[0], 0.5), 0.5, lerp(q[1], m[1], 0.5)], [m[0], 0.5, m[1]], [lerp(m[0], f[0], 0.5), 0.5, lerp(m[1], f[1], 0.5)], [f[0], 0.5, f[1]]], closed: false, width: 0.5, tube: T.black, seed: rng() });
    }
    if (i % 3 === 2) await ctx.yield();
    // a berry between this leaf and the next
    if (berryTube !== T.canvas || i % 2 === 0) {
      const b = cp(a + Math.PI / 12, r + rng.range(7, 11)), br = rng.range(2.1, 2.9), bo = [];
      for (let k = 0; k < 12; k++) { const q = cp((k / 12) * Math.PI * 2, br * rng.range(0.9, 1.1)); bo.push([b[0] + q[0], b[1] + q[1]]); }
      flatShape(flat, bo, 0.3, berryTube);
      lines.push({ pts: bo.map((p) => [p[0], 0.55, p[1]]), closed: true, width: 0.75, tube: T.black, seed: rng(), gap: 0.14 });
    }
  }
  await ctx.yield();

  // --- the tank's drawn parts: canvas floor, shadow stripe, cobalt water strokes, the two ellipses ---
  flatShape(flat, ring(29.5, 0, 48, 0.006, 2).map((p) => [p[0], p[2]]), 0.3, T.canvas);
  for (let k = 0; k < 3; k++) dabs.push(arcDab(35.2, 0.72 + k * 0.56, 1.36 + k * 0.56, 0.36 + k * 0.02, 3.4, 7, rng()));   // stripe at the right-hand foot (+X)
  const nFloor = Math.round(7 * detail), nGlass = Math.round(11 * detail), nRipple = Math.round(6 * detail);
  for (let k = 0; k < nFloor; k++) { const a = rng.range(0, 6.28), r = rng.range(6, 24); dabs.push(arcDab(r, a, a + rng.range(4, 9) / r, 0.42, rng.range(0.7, 1.1), T.cobalt, rng())); }
  for (let k = 0; k < nGlass; k++) {       // loose cobalt strokes on the glass itself, all round
    const a = (k / nGlass) * Math.PI * 2 + rng.range(-0.2, 0.2), c = cp(a, 28.5), t = cp(a + Math.PI / 2, 1), g = rng.range(0.9, 1.45) * (rng.chance(0.5) ? 1 : -1);
    const hl = rng.range(3.5, 6), hw = rng.range(0.8, 1.15), cg = Math.cos(g), sg = Math.sin(g);
    dabs.push({ p: [c[0], rng.range(9, 57), c[1]], a: [t[0] * cg * hl, sg * hl, t[1] * cg * hl], b: [-t[0] * sg * hw, cg * hw, -t[1] * sg * hw], tube: T.cobalt, seed: rng() });
  }
  const rip = [];       // (round 5) the loose strokes that lie on the water: a list of their own, see 'ripples' below; dealt as they were
  for (let k = 0; k < nRipple; k++) { const a = rng.range(0, 6.28), r = rng.range(7, 26); rip.push(arcDab(r, a, a + rng.range(5, 11) / r, WATER + 0.05, rng.range(0.45, 0.75), T.cobalt, rng())); }
  { const rr = rng.fork('ripples'), nR2 = Math.round(12 * detail); for (let k = 0; k < nR2; k++) { const a = (k / nR2) * 6.283 + rr.range(-0.2, 0.2), r = 5 + 21 * Math.sqrt((k * 0.618) % 1); rip.push(arcDab(r, a, a + rr.range(3, 8) / r, WATER + 0.05, rr.range(0.35, 0.6), k % 5 === 4 ? T.viridian : T.cobalt, rr())); } }
  lines.push({ pts: ring(RT + 0.3, RIM, 96, 0.004, rng()), closed: true, width: 1.45, tube: T.cobalt, seed: rng(), gap: 0.07 });
  lines.push({ pts: ring(RT + 0.35, 0.6, 96, 0.004, rng()), closed: true, width: 1.3, tube: T.cobalt, seed: rng(), gap: 0.11 });
  lines.push({ pts: ring(RT - 0.5, WATER, 72, 0.006, rng()), closed: true, width: 0.7, tube: T.cobalt, seed: rng(), gap: 0.16 });

  await ctx.yield();
  const nApron = Math.round(34 * detail), apronTube = rng.pick([T.lemon, T.lemon, T.cobalt, T.viridian]);     // a row of dabs round the table's edge
  for (let k = 0; k < nApron; k++) { const a = (k / nApron) * Math.PI * 2 + rng.range(-0.02, 0.02), c = cp(a, 72.9), t = cp(a + Math.PI / 2, 1), sl = rng.range(-0.25, 0.25);
    dabs.push({ p: [c[0], -6.9, c[1]], a: [t[0] * 2.3, sl, t[1] * 2.3], b: [0, 1.05, 0], tube: apronTube, seed: rng() }); }
  await ctx.yield();
  const bub = [], nBub = Math.round(22 * detail);            // bubbles: small cobalt dabs climbing through the water, two crossed quads each
  for (let k = 0; k < nBub; k++) { const c = cp(rng.range(0, 6.28), rng.range(4, 23)), y = rng.range(3, WATER - 3), r = rng.range(0.4, 0.8), ph = rng.range(0, 3.14), sd = rng();
    for (const q of [0, Math.PI / 2]) bub.push({ p: [c[0], y, c[1]], a: [0, r, 0], b: [Math.cos(ph + q) * r, 0, Math.sin(ph + q) * r], tube: T.cobalt, seed: sd }); }
  const bubMesh = new THREE.Mesh(dabGeometry(bub), dabMaterial(style, { rise: [3, WATER - 5] })); bubMesh.name = 'bubbles'; bubMesh.frustumCulled = false; object.add(bubMesh);
  await ctx.yield();
  const flatMesh = new THREE.Mesh(accGeometry(flat), flatMaterial(style)); flatMesh.name = 'flat-forms'; object.add(flatMesh);
  await ctx.yield();
  const dabMesh = new THREE.Mesh(dabGeometry(dabs), dabMaterial(style)); dabMesh.name = 'dabs'; dabMesh.frustumCulled = false; object.add(dabMesh);
  // (round 5) the strokes that lie on the water are laid after the water's canvas and before the fish, and write no depth, so a fish
  // lies on them as it lies on its window and on the water's rings: looked down on from over the rim they used to cut a fish in pieces
  const ripMesh = new THREE.Mesh(dabGeometry(rip), dabMaterial(style)); ripMesh.material.depthWrite = false; ripMesh.name = 'ripples'; ripMesh.frustumCulled = false; ripMesh.renderOrder = 5.5; object.add(ripMesh);
  await ctx.yield();
  const lineMat = contourMaterial(style);
  const lineMesh = new THREE.Mesh(contourGeometry(lines), lineMat); lineMesh.name = 'contours'; lineMesh.frustumCulled = false; object.add(lineMesh);
  await ctx.yield();
  // the two uprights ride the cylinder's silhouette: update() turns them to wherever the outline is for this eye
  const upPts = []; for (let i = 0; i <= 16; i++) upPts.push([0, 0.6 + (RIM - 0.6) * (i / 16), 0]);
  const upGeo = contourGeometry([{ pts: upPts, closed: false, width: 1.3, tube: T.cobalt, seed: rng() }]);
  const uprights = [0, 1].map((k) => { const m = new THREE.Mesh(k ? upGeo.clone() : upGeo, lineMat); m.frustumCulled = false; m.name = 'upright'; object.add(m); return m; });
  await ctx.yield();

  // --- the glass: the far inside wall carries the room behind, drawn again mirrored, squeezed and in swapped tubes ---
  const vine = opts.vine || await makeVineTexture(ctx, { rng: rng.fork('vine') });
  const PERM = [0, 5, 3, 2, 4, 1, 2];      // canvas, vermilion>rose, cobalt>viridian, viridian>cobalt, lemon, rose>vermilion, black>cobalt
  const layers = { old: [T.cobalt, T.viridian], next: [T.vermilion, T.vermilion], ...(opts.layers || {}) };   // opts.layers: { old, next, shOld, shNew } tube indices
  const tv = (i) => U.uTube.value[i];
  const fishU = []; for (let i = 0; i < 5; i++) fishU.push(new THREE.Vector4(0, 17, -999, 0));
  const fishB = []; for (let i = 0; i < 5; i++) fishB.push(new THREE.Vector4(1, 0, 0, 0));
  const G = { uOrigin: { value: new THREE.Vector3() }, uFish: { value: fishU }, uFishB: { value: fishB },
    uVine: { value: vine.texture }, uVineRect: { value: vine.rect }, uVineLen: { value: vine.length }, uGrow: { value: 0 },
    uCatAz: { value: opts.catAzimuth ?? Math.PI }, uCat: { value: opts.cat === false ? 0 : 1 }, uCatS: { value: 0.3 }, uWinS: { value: -0.9 },
    uWinA: { value: tv(2).clone() }, uWinB: { value: tv(3).clone() }, uGOldA: { value: tv(3).clone() }, uGOldB: { value: tv(2).clone() }, uGNewA: { value: tv(5).clone() }, uGNewB: { value: tv(5).clone() } };
  await ctx.yield();
  const glassGeo = new THREE.CylinderGeometry(RT - 0.3, RT - 0.3, RIM - 0.4, 72, 1, true); glassGeo.translate(0, (RIM + 0.4) / 2, 0);
  const glass = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { ...U, ...G },
    vertexShader: /* glsl */`
      varying vec3 vL;
      void main(){ vL = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      ${CRISP_GLSL}
      ${VINE_GLSL}
      uniform vec3 uOrigin, uGOldA, uGOldB, uGNewA, uGNewB; uniform vec4 uFish[5];
      const float FK = ${FK.toFixed(1)};
      uniform sampler2D uVine; uniform vec4 uVineRect; uniform float uVineLen, uGrow, uCatAz, uCat, uCatS, uWinS;
      varying vec3 vL;
      float ell(vec2 p, vec2 c, vec2 r){ return (length((p - c)/r) - 1.)*min(r.x, r.y); }
      // THE GLASS'S OWN HAND. The wall of the tank is bare canvas for the most part, before the front and after it: the room is
      // drawn on it again as loose strokes of the room's own brush (the same capsule, 2.2 to 2.6 m wide and 8.4 to 10.6 m long, on
      // the slant and the slow flow of the room's old layer), but laid APART: the rows stand 3.8 m from one another and the strokes
      // 12.5 m from one to the next along a row, so every stroke has canvas all round it (1.4 m between two rows as a rule and
      // never under 0.5 m as the lattice is laid out, 0.6 m and more end to end) and no patch of one colour is wider than one
      // stroke; and only some of them are laid (G_OLD of them in the old layer's swapped tubes, G_NEW once the front has passed:
      // the front lays its colour over the old strokes, along their length, and lays more on the bare canvas between them).
      // A stroke is its own whole shape or it is not there.
      const float G_ROW = 3.8, G_CELL = 12.5, G_OLD = 0.25, G_NEW = 0.38;
      // for the filter's mean tone: one stroke's share of its cell (a capsule of mean half-length 3.55 and mean radius 1.21 m: 21.8 m2 of
      // the cell's G_ROW x G_CELL = 47.5 m2; 0.459 measured on the lattice as laid) and the second tube's share of the strokes (measured)
      const float G_AREA = 0.459, G_B = 0.10;
      struct GStroke { float d; float h; float g; float along; };
      GStroke gstrokes(vec2 p, float seed){
        float ang = 0.3 + seed*2.3, c = cos(ang), s = sin(ang);
        vec2 w = p + 11.*vec2(vn(p*0.012 + seed*7.1), vn(p*0.012 + seed*3.3 + 19.)) + 1.4*vec2(vn(p*0.06 + 5.), vn(p*0.06 + seed + 31.));
        vec2 q = vec2(c*w.x + s*w.y, -s*w.x + c*w.y);
        float rowf = floor(q.y/G_ROW);
        GStroke best; best.d = 1e3; best.h = 0.; best.g = 0.; best.along = 0.;
        for (int j = -1; j <= 1; j++) {
          float row = rowf + float(j), ry = q.y - (row + 0.5)*G_ROW;
          float x = q.x + h11(row + seed*13.)*G_CELL, cell = floor(x/G_CELL);
          for (int i = -1; i <= 1; i++) {
            vec2 id = vec2(cell + float(i), row);
            float h = h21(id + seed*171.), h2 = fract(h*7.31 + 0.37);
            float cx = (id.x + 0.5)*G_CELL + (h - 0.5)*1.2, dx = x - cx, hl = 3.1 + h2*0.9, r = 1.1 + 0.22*h;
            float yy = ry + (h2 - 0.5)*0.4 - 0.13*sin(dx*0.5 + h*6.283);
            float d = length(vec2(max(abs(dx) - hl, 0.), yy)) - r;
            if (d < best.d) { best.d = d; best.h = h; best.along = clamp((dx + hl + r)/(2.*(hl + r)), 0., 1.);
              best.g = step(0.74, 0.42*h2 + 0.58*vn(id*vec2(0.3, 0.1) + seed*9.)); }
          }
        }
        return best;
      }
      void main(){
        vec3 cam = cameraPosition - uOrigin;
        vec2 f = -cam.xz; float fl = length(f); f = fl < 1e-3 ? vec2(0., -1.) : f/fl;
        float s = dot(vL.xz, vec2(-f.y, f.x))/${RT.toFixed(1)};                   // -1..1 across the glass as seen
        float az = mod(atan(f.x, f.y) - 2.06, 6.2832);                           // which way we look into the room
        float Uc = ${ROOM_R.toFixed(1)}*(az - 0.47*s), V = vL.y;                  // mirrored and squeezed to a third
        vec2 p = vec2(Uc/3., V + 80.);                                             // the brush is the same brush: only the drawing is squeezed
        vec3 wv = vec3(uOrigin.x + 60.*s, uOrigin.y + V, uOrigin.z - 30. + 25.*s);
        // (far, between 212 and 494 m from the eye, where on a picture 720 lines high through this world's lens a pixel covers 0.3 and
        // 0.7 m of the drawing, the same on every screen: what is far away is the fish's windows closed and in one tube and the front as
        // one edge. The lattice's strokes stand at every distance; where they are thin on the screen the filter gives their mean tone.)
        float pix = 0.6*length(fwidth(p)), far = smoothstep(212., 494., length(vL - cam)), aa = max(pix, 1e-3);
        Stroke o = strokes(p, uSeed.x), n = strokes(p, uSeed.y);
        // the windows of old colour that travel with the fish: the new paint is cut in round each of them
        vec3 rd = vL - cam; rd /= max(length(rd), 1e-4);
        float m = 1e3;
        for (int i = 0; i < 5; i++) { vec4 F = uFish[i];
          // four points from the tail tip to the nose (the fish runs from 10.8 m behind its centre to 8 m ahead), widest at the
          // forked tail, so the whole fish lies inside its window with old colour all round it
          for (int j = 0; j < 4; j++) { float th = F.x + (-10.4 + 5.4*float(j))*FK/max(F.y, 1.);
            vec3 pt = vec3(sin(th)*F.y, F.z, cos(th)*F.y);
            m = min(m, length(cross(pt - cam, rd)) + (1. - F.w)*1e3 - (j == 0 ? 2.3 : (j == 3 ? 0.4 : 1.0))*FK); } }
        m /= FK;
        float t = (uFront - frontCoord(wv) - n.h*16.)/11.;
        float painted = smoothstep(-0.04, 0.04, t - n.along)*(1. - smoothstep(-aa, aa, gapd(n.d, 0.03, aa)));
        painted = crisp(mix(painted, step(frontCoord(wv), uFront - 8.), far));
        // each fish keeps its own window: 4 to 6 m of old colour round the stroke, so rose shows between two fish
        float halo = step(m, 4.1*(0.8 + 0.45*n.h))*step(0.5, painted);
        float oB = o.g*step(far, fract(o.h*5.3 + 0.21));
        float co = crisp(mix((1. - smoothstep(-aa, aa, gapd(o.d, mix(0.22*(vn(p*0.06 + 4.) - 0.12), 0.05, halo), aa))), 1., far));     // water: the canvas shows more
        // outside the fish's windows: bare canvas and the glass's own loose strokes; inside a window, the old layer as it was
        // (closed, in the room's own old tubes), so the whole fish has old colour all round it
        GStroke b = gstrokes(p, uSeed.x);
        float bk = fract(b.h*91.7 + 0.31), tb = (uFront - frontCoord(wv) - b.h*16.)/11.;
        float bn = crisp(smoothstep(-0.04, 0.04, tb - b.along))*step(bk, G_NEW);          // the front has reached this stroke (wiped on along its length)
        float bc = (1. - smoothstep(-aa, aa, b.d))*max(step(bk, G_OLD), bn);
        vec3 col = mix(uTube[0], mix(mix(uGOldA, uGOldB, b.g), mix(uGNewA, uGNewB, b.g), bn), crisp(bc));
        // the filter: a thin stroke of the lattice and the canvas round it, to their mean. Of the surface, G_AREA*G_OLD is old strokes before
        // the front and G_AREA*G_NEW new strokes after it; lf = the share of the strokes there that the front has reached (their turn
        // within 16 m, wiped over 11 m, as tb above). The lattice lies on the old layer's slant, so its strokes' coordinate is that layer's.
        float tl = thin(BRUSH_W, across(p, uSeed.x));
        if (tl > 0.) { float lf = smoothstep(0., 27., uFront - frontCoord(wv)), so = G_AREA*G_OLD*(1. - lf), sn = G_AREA*G_NEW*lf;
          col = mix(col, uTube[0]*(1. - so - sn) + mix(uGOldA, uGOldB, G_B)*so + mix(uGNewA, uGNewB, G_B)*sn, tl); }
        col = mix(col, mix(uTube[0], mix(uOldA, uOldB, oB), co), halo);
        col = mix(col, meanOld(uOldA, uOldB, standing(far), 0.), halo*tl);      // and the old layer's strokes inside a fish's window, by the same filter (oB and co above thin and shut them by this far)
        // the arabesque in the old tube (so it shows only on the new field), swapped like everything else
        float vc = crisp(vineCover(uVine, uVineRect, uVineLen, vec2(Uc*0.9, (V - 34.)*1.5), 1.7, uGrow, aa*1.5));
        col = mix(col, uGOldA, vc*(1. - halo)*painted);
        // the window: a lemon band over a lawn in the wrong tube, blossom left as bare canvas
        vec2 wq = vec2(${(ROOM_R * 0.47).toFixed(2)}*(uWinS - s)*1.35, (V - 45.)*1.35);
        float wb = max(abs(wq.x) - 21. - 1.2*sin(V*0.3), abs(wq.y) - 24. - 1.0*sin(Uc*0.21));
        vec3 wcol = wq.y > 9. + 1.4*sin(Uc*0.33) ? uTube[4] : uTube[2];
        float bl = min(ell(wq, vec2(-8., 2.), vec2(8., 5.)), min(ell(wq, vec2(9., -3.), vec2(7., 4.5)), ell(wq, vec2(1., -13.), vec2(9., 4.))));
        wcol = mix(wcol, uTube[0], (1. - smoothstep(-aa, aa, bl)));
        col = mix(col, wcol, (1. - smoothstep(-aa, aa, wb)));
        col = mix(col, uTube[2], (1. - smoothstep(-aa, aa, abs(wb - 1.6) - 0.7))*step(0.12, fract(Uc*0.011 + V*0.007)));
        // the cat, black drawn cobalt: one flat shape, two lemon eye dabs, breathing
        vec2 cq = vec2(${(ROOM_R * 0.47).toFixed(2)}*(uCatS - s)*1.6 + 1.2*sin(uTime*0.4), (V - 1.)*3.9 - 14.);       // it sits on the glass's foot, under the fish
        float cd = min(ell(cq, vec2(0., 10.), vec2(27., 24.)), ell(cq, vec2(2., 44.), vec2(19., 15. + 0.4*sin(uTime*0.8))));
        vec2 e = vec2(abs(cq.x - 2.) - 11., cq.y - 55.);
        cd = min(cd, max(abs(e.x)*1.6 + e.y*0.9 - 10., -e.y - 8.));              // two ears
        cd = min(cd, max(abs(length(cq - vec2(27., 0.)) - 14.) - 3.2, 29. - cq.x));   // the tail curling out behind
        cd += 0.6*sin(V*0.5 + Uc*0.13); cd /= 2.5;
        vec3 ccol = min(ell(cq, vec2(-5.5, 45.5), vec2(5.4, 3.4)), ell(cq, vec2(9.5, 45.5), vec2(5.4, 3.4))) < 0. ? uTube[4] : uTube[2];
        // a sliver of bare canvas is left round it (broken, like every line here), so it never melts into a fish's window
        col = mix(col, uTube[0], (1. - smoothstep(-aa, aa, cd - max(0.34, 3.*aa)))*step(0.2, vn(vec2(Uc*0.16, V*0.3) + 3.))*uCat);
        col = mix(col, ccol, (1. - smoothstep(-aa, aa, cd))*uCat);
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  glass.name = 'glass-room'; object.add(glass);
  await ctx.yield();

  // --- the goldfish: one fat stroke each (a real spindle so it reads from the side and from above), rose tail
  // strokes in a double fan, a dorsal dab, a black dot of an eye. Bent round its circle and waggled in the shader.
  const fa = { pos: [], tube: [], idx: [] }; let fanA = 0, fanB = 0;
  let fishHB = 0;                                    // the body stroke's half-breadth in fish space (its flank), measured on the shape below
  {
    const ns = 22, nr = 14, pos = [], idx = [];
    const hh = (t) => 2.8 * Math.pow(Math.max(0, Math.sin(Math.PI * (0.11 + 0.89 * Math.pow(t, 0.92)))), 0.5);       // t 0 at the tail root, 1 at the nose
    for (let j = 0; j <= ns; j++) { const t = j / ns, x = -4.2 + 10.9 * t, h = hh(t), w = h * 0.62;
      for (let i = 0; i < nr; i++) { const a = (i / nr) * Math.PI * 2, cy = Math.cos(a), sz = Math.sin(a); pos.push(x, cy * h * (cy > 0 ? 0.92 : 1.08) - 0.1 * h, sz * w); } }
    for (let j = 0; j < ns; j++) for (let i = 0; i < nr; i++) { const a = j * nr + i, b = j * nr + ((i + 1) % nr), c = a + nr, d = b + nr; idx.push(a, c, b, b, c, d); }
    pushGeo(fa, pos, idx, carp ? T.black : T.vermilion);
    for (let k = 2; k < pos.length; k += 3) fishHB = Math.max(fishHB, Math.abs(pos[k]));
    // a lobe: a leaf-shaped strip from p0 to p1 (xy or xz plane), half-width w, sagging by `sag`
    const lobe = (x0, a0, x1, a1, w, plane, tube, sag = 0, zo = 0) => { const n = 7, P = [], I = [];
      for (let k = 0; k <= n; k++) { const t = k / n, x = lerp(x0, x1, t), a = lerp(a0, a1, t) + sag * Math.sin(t * Math.PI), hw = w * Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * t)), 0.7) * (1 + 0.12 * Math.sin(k * 2.1 + x0));
        const dx = x1 - x0, da = a1 - a0, dl = Math.hypot(dx, da) || 1, nx = -da / dl, na = dx / dl;
        for (const sd of [-1, 1]) { const px = x + nx * hw * sd, pa = a + na * hw * sd; if (plane === 'y') P.push(px, pa, zo); else P.push(px, 0.15, pa); } }
      for (let k = 0; k < n; k++) { const a = k * 2; I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      pushGeo(fa, P, I, tube); };
    lobe(-3.2, 0.5, -9.0, 3.9, 1.75, 'y', T.rose, 0.5); lobe(-3.2, -0.5, -8.7, -3.6, 1.6, 'y', T.rose, -0.5);      // the tail: a darker rose stroke, forked
    fanA = fa.idx.length;
    lobe(-3.4, 0.4, -7.9, 2.7, 1.2, 'z', T.rose); lobe(-3.4, -0.4, -7.9, -2.7, 1.2, 'z', T.rose);                // and its fantail, for the view from above
    fanB = fa.idx.length;
    lobe(-2.8, 1.5, 3.0, 2.7, 1.05, 'y', carp ? T.rose : T.vermilion, 0.6);                                                       // dorsal dab
    lobe(2.4, -1.9, -0.6, -4.0, 0.8, 'y', T.rose);                                                               // ventral fin
    for (const sd of [-1, 1]) {                                                                                  // the eye: a black dot that stands proud
      const ex = 4.75, ey = 0.55, ez = sd * (hh((ex + 4.2) / 10.9) * 0.62 * 0.9), P = [ex, ey + 0.1, ez + sd * 0.55], I = [];
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; P.push(ex + Math.cos(a) * 0.7, ey + Math.sin(a) * 0.7, ez - sd * 0.1); I.push(0, 1 + k, 1 + ((k + 1) % 8)); }
      pushGeo(fa, P, I, carp ? T.lemon : T.black);
      if (carp) { lobe(-3.0, 0.5, 0.2, 1.2, 0.5, 'y', T.rose, 0.3, sd * 1.72); lobe(0.6, -0.9, 3.6, -0.2, 0.46, 'y', T.rose, -0.25, sd * 1.66); lobe(-1.6, -1.5, 1.4, -1.2, 0.4, 'y', T.rose, 0.2, sd * 1.5); }
      const Q = [], J = [];                                                                                      // pectoral fin, a small rose dab swept back
      for (let k = 0; k <= 4; k++) { const t = k / 4, hw = 0.75 * Math.sin(Math.PI * (0.15 + 0.8 * t)); Q.push(2.6 - 3.2 * t, -1.2 - 1.3 * t + hw, sd * (1.4 + 1.5 * t), 2.6 - 3.2 * t, -1.2 - 1.3 * t - hw, sd * (1.4 + 1.5 * t)); }
      for (let k = 0; k < 4; k++) { const a = k * 2; J.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      pushGeo(fa, Q, J, T.rose);
    }
  }
  await ctx.yield();
  const fishBase = accGeometry(fa), fishGeo = new THREE.InstancedBufferGeometry();
  // the same fish for the world to fly free (the rare event): without the flat fantail, which out of the water would be seen edge-on as a hairline
  const fishSide = new THREE.BufferGeometry(); fishSide.setAttribute('position', fishBase.getAttribute('position')); fishSide.setAttribute('tube', fishBase.getAttribute('tube'));
  fishSide.setIndex(fa.idx.filter((v, i) => i < fanA || i >= fanB)); fishSide.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  fishGeo.index = fishBase.index; fishGeo.setAttribute('position', fishBase.getAttribute('position')); fishGeo.setAttribute('tube', fishBase.getAttribute('tube'));
  fishGeo.setAttribute('iIdx', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2, 3, 4]), 1)); fishGeo.instanceCount = nShow;
  fishGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 32, 0), 60);
  const FISH_VERT = /* glsl */`
    uniform vec4 uFish[5], uFishB[5]; uniform float uTime;
    // q: fish space (x along, head +x; y up; z outward). Returns the local position on the fish's circle.
    vec3 fishPlace(vec3 q, float idx, float yOff){
      int k = int(idx + 0.5); vec4 F = uFish[k], B = uFishB[k]; q *= B.y;
      float big = max(B.y/1.3, 1.);                                    // a carp waggles as one fish, not as three
      float tail = (1. - smoothstep(-8.5*big, 3.5*big, q.x));
      float wig = sin(q.x*0.45/big + B.z)*(0.25 + 1.5*tail*tail)*sqrt(big);
      float th = F.x + q.x/max(F.y, 1.), rr = F.y + q.z + wig;
      return vec3(sin(th)*rr, F.z + q.y + yOff + B.w*q.x, cos(th)*rr);
    }`;
  const fish = new THREE.Mesh(fishGeo, new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...U, ...G },
    vertexShader: /* glsl */`
      ${FISH_VERT}
      attribute float tube, iIdx; varying float vTube;
      void main(){ vTube = tube; gl_Position = projectionMatrix*modelViewMatrix*vec4(fishPlace(position, iIdx, 0.), 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTube[7]; varying float vTube;
      void main(){ gl_FragColor = vec4(uTube[int(clamp(vTube + 0.5, 0., 6.))], 1.); }`,
  }));
  fish.name = 'goldfish'; fish.frustumCulled = false; fish.renderOrder = 6; object.add(fish);
  // --- the water seen from over the rim: bare canvas (never blue), and under each fish a ragged window of the old colour,
  // a handful of the old layer's strokes left where the eye finds the fish. Drawn after the room and before the fish, so
  // the fish lie on it as they would on a painter's canvas; from below the waterline it is not drawn at all.
  const waterGeo = new THREE.CircleGeometry(RT - 0.45, 56); waterGeo.rotateX(-Math.PI / 2); waterGeo.translate(0, WATER - 0.06, 0);
  const water = new THREE.Mesh(waterGeo, new THREE.ShaderMaterial({
    side: THREE.DoubleSide, depthWrite: false, uniforms: { ...U, ...G },
    vertexShader: /* glsl */`
      varying vec3 vL;
      void main(){ vL = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      uniform vec3 uOrigin, uWinA, uWinB; uniform vec4 uFish[5];
      const float FK = ${FK.toFixed(1)};
      varying vec3 vL;
      // how far the eye's ray through water point c passes from the nearest fish (three points along each stroke of a fish)
      float fishRay(vec3 c, vec3 cam){
        vec3 rd = c - cam; rd /= max(length(rd), 1e-4);
        float m = 1e3;
        for (int i = 0; i < 5; i++) { vec4 F = uFish[i];
          for (int j = 0; j < 4; j++) { float th = F.x + (-10.4 + 5.4*float(j))*FK/max(F.y, 1.);
            vec3 pt = vec3(sin(th)*F.y, F.z, cos(th)*F.y);
            m = min(m, length(cross(pt - cam, rd)) + (1. - F.w)*1e3 - (j == 0 ? 1.2 : (j == 3 ? 0. : 0.9))*FK); } }
        return m/FK + 1e3*step(-rd.y, 0.3);
      }
      void main(){
        vec3 cam = cameraPosition - uOrigin;
        if (cam.y < ${(WATER + 0.3).toFixed(1)}) discard;
        float aa = max(0.6*length(fwidth(vL.xz)), 1e-3);
        // a fish's window is a handful of strokes from three hands of the old layer (three slants, three lengths), two in three
        // of each laid, overlapping; what is left between them is canvas, a sliver two pixels wide or shut
        float d = 1e3, g = 0.;
        for (int k = 0; k < 3; k++) {
          float sc = k == 0 ? 2.3 : (k == 1 ? 1.3 : 1.75), sd = fract(uSeed.x + 0.29*float(k));
          Stroke o = strokes(vL.xz*sc + 37.*float(k), sd);
          vec3 pc = vec3(vL.x - o.off.x/sc, vL.y, vL.z - o.off.y/sc);          // the stroke's centre on the water
          float on = step(fishRay(pc, cam), 7.8*(0.7 + 0.6*o.h))*step(0.6, fract(o.h*9.7 + 0.13*float(k)));
          float dk = o.d/sc + (1. - on)*1e3;
          if (dk < d) { d = dk; g = o.g; }
        }
        float co = 1. - smoothstep(-aa, aa, d - 1.6*aa);
        vec3 col = mix(uTube[0], g > 0.5 ? uWinB : uWinA, co);
        // the water is told as water the way the glass is told as glass: loose cobalt rings that do not close, each widening
        // from where a fish has risen and coming apart into a shortening arc as it goes (a whole line or none: never a fade)
        float re = 1e3;
        for (int i = 0; i < 5; i++) { float fi = float(i), cl = uTime*0.1 + fi*0.41 + 0.5*h11(fi*3.1), cyc = floor(cl), ft = fract(cl);
          float ha = h11(fi*7.3 + cyc*1.7), hb = h11(fi*2.9 + cyc*3.1 + 5.);
          vec2 c = vec2(cos(ha*6.2832), sin(ha*6.2832))*(5. + 16.*hb), dv = vL.xz - c; float dl = length(dv); vec2 dn = dv/max(dl, 1e-3);
          vec2 gd = vec2(cos(ha*40. + ft*1.5), sin(ha*40. + ft*1.5));
          float rad = (1.6 + 5.4*ft)*(1. + 0.1*dn.x*dn.y), lw = 0.45*(1. - 0.4*ft)*(0.75 + 0.5*dn.y*dn.y);       // the line swells and thins round the ring
          re = min(re, max(abs(dl - rad) - lw, (dot(dn, gd) - 0.9 + 2.1*ft*ft)*dl)); }      // the gap is part of the same distance: no seam where the arc ends
        float rg = clamp(0.5 - re/max(fwidth(re), 1e-4), 0., 1.);      // cut to one pixel after the loop: a hard edge at any slant
        col = mix(col, uTube[2], rg);
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  water.name = 'water'; water.frustumCulled = false; water.renderOrder = 5; object.add(water);

  // --- the reflections: a separate vermilion dab on the water disc over each fish, stretching as the fish turns ---
  const refBase = new THREE.PlaneGeometry(2, 2, 10, 1), refGeo = new THREE.InstancedBufferGeometry();
  refGeo.index = refBase.index; refGeo.setAttribute('position', refBase.getAttribute('position'));
  refGeo.setAttribute('iIdx', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2, 3, 4]), 1)); refGeo.instanceCount = nShow;
  const refl = new THREE.Mesh(refGeo, new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...U, ...G },
    vertexShader: /* glsl */`
      uniform vec4 uFish[5], uFishB[5]; uniform float uTime; uniform vec3 uOrigin;
      attribute float iIdx; varying vec2 vUv; varying float vAr, vSeed;
      void main(){ int k = int(iIdx + 0.5); vec4 F = uFish[k], B = uFishB[k]; vUv = vec2(-position.x, position.y); vSeed = iIdx*0.37 + 0.11;
        float above = smoothstep(1., 5., cameraPosition.y - uOrigin.y - ${WATER.toFixed(1)});       // looked down on: a dab no larger than its fish
        vec3 cam = cameraPosition - uOrigin, F3 = vec3(sin(F.x)*F.y, F.z, cos(F.x)*F.y);
        float tt = clamp((cam.y - ${WATER.toFixed(1)})/max(cam.y - F3.y, 1.), 0., 1.), sc = mix(1., 0.62*tt, above);
        float st = mix(B.x, min(B.x, 1.25), above), hl = 5.4*st*B.y*sc, hw = 1.55*B.y/sqrt(max(st, 0.5))*mix(1., 1.5*tt, above);
        float th = F.x + (position.x*hl + 0.6*sc)/max(F.y, 1.);
        float rr = F.y + position.y*hw + 0.35*sc*sin(uTime*1.3 + iIdx*2. + position.x*2.5);
        vAr = hl/max(hw, 1e-3);
        vec3 pos = vec3(sin(th)*rr, ${(WATER + 0.18).toFixed(2)}, cos(th)*rr);
        vec3 sh = (cam + (F3 - cam)*tt - F3 + vec3(sin(F.x), 0., cos(F.x))*8.5*tt)*above; pos.xz += sh.xz;
        gl_Position = projectionMatrix*modelViewMatrix*vec4(pos, 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTube[7];
      float h11(float n){ return fract(sin(n*127.1 + 1.7)*43758.5453); }
      ${DAB_FRAG}
      varying vec2 vUv; varying float vAr, vSeed;
      void main(){ float sd = floor(vSeed*100. + 0.5)*0.01;       // the seed is whole per dab: an interpolated one stipples the bristled edge
        if (dabShape(vUv, max(vAr, 1.), sd) < 0.) discard; gl_FragColor = vec4(uTube[${carp ? 6 : 1}], 1.); }`,
  }));
  refl.name = 'reflections'; refl.frustumCulled = false; refl.renderOrder = 7; object.add(refl);
  await ctx.yield();

  // --- optional stage for the part viewer: the room as one field mesh (the world passes stage:false) ---
  if (opts.stage !== false) {
    const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Zn = new THREE.Vector3(0, 0, -1), v = (x, y, z) => new THREE.Vector3(x, y, z);
    const parts = [fieldPlane(v(100, FLOOR_Y, 310), X, Zn, 800, 1000), fieldPlane(v(100, 418, 310), X, Zn, 800, 1000),
      fieldPlane(v(100, 138, -190), X, Y, 800, 560), fieldPlane(v(100, 138, 810), X, Y, 800, 560),
      fieldPlane(v(-300, 138, 310), Zn, Y, 1000, 560), fieldPlane(v(500, 138, 310), Zn, Y, 1000, 560)];
    const acc = { position: [], fu: [], fv: [], idx: [] }; let base = 0;
    for (const g of parts) { for (const k of ['position', 'fu', 'fv']) acc[k].push(...g.getAttribute(k).array); for (const i of g.index.array) acc.idx.push(i + base); base += g.getAttribute('position').count; g.dispose(); }
    const sg = new THREE.BufferGeometry(); for (const k of ['position', 'fu', 'fv']) sg.setAttribute(k, new THREE.Float32BufferAttribute(acc[k], 3)); sg.setIndex(acc.idx);
    const stage = new THREE.Mesh(sg, fieldMaterial(style)); stage.name = 'stage-room'; stage.frustumCulled = false; object.add(stage);
    // the room's corners, told only by a wobbling contour
    const cl = [], seg = (a, b) => { const p = []; for (let i = 0; i <= 24; i++) p.push([lerp(a[0], b[0], i / 24), lerp(a[1], b[1], i / 24), lerp(a[2], b[2], i / 24)]); cl.push({ pts: p, closed: false, width: 2.4, tube: T.black, seed: rng() }); };
    for (const y of [FLOOR_Y + 0.5, 417]) { seg([-299, y, -189], [499, y, -189]); seg([-299, y, -189], [-299, y, 809]); seg([499, y, -189], [499, y, 809]); }
    seg([-299, FLOOR_Y, -189], [-299, 418, -189]); seg([499, FLOOR_Y, -189], [499, 418, -189]);
    const sl = new THREE.Mesh(contourGeometry(cl), lineMat); sl.frustumCulled = false; sl.name = 'stage-corners'; object.add(sl);
  }
  await ctx.yield();

  // --- motion ---
  const fishSeed = []; for (let i = 0; i < 5; i++) fishSeed.push({ r: rng.range(14, 20), y: 0, ph: rng.range(0, 6.28), sc: rng.range(1.12, 1.3), w: rng.range(0.8, 1.25) });
  { const ys = rng.shuffle([0, 1, 2, 3, 4].slice(0, nFish)); for (let i = 0; i < nFish; i++) fishSeed[i].y = 23 + (ys[i] / (nFish - 1)) * 20 + rng.range(-1.5, 1.5); }
  const spread = rng.range(0.74, 0.84), wps = 6 / 17;                       // 6 m/s on a 17 m circle
  // THE GOLDFISH'S CIRCUIT, ONE RULE OF THE TANK, ALL ROUND (in metres from the glass, which stands at RT - 0.3): each goldfish swims
  // close behind the glass, its flank (the widest of its body stroke) never nearer the glass than 2 m and never further than 5 m,
  // and no point of it (the outer lobe of its fantail at the full swing of its waggle, as FISH_VERT below swings it) ever
  // beyond the tank's own canvas floor (FLOOR_R, 0.2 m inside the glass). Each fish's dealt radius and its slow wander in and out
  // (14 to 20 m and 2.6 m either way, as dealt and timed above and in update) are laid onto that band: the far end of the old
  // in-and-out is the flank 5 m inside the glass, the near end is the nearest that fish's own shape allows. Its swimming speed in
  // metres per second is what it was on the 17 m circle: the angle's rate is the old one times 17 over the circuit's radius
  // (ORBIT_R: the middle of the band for the fish at the middle of the dealt scales), from the phase as dealt, on the hero's own
  // clock. The carp is 2.7 times longer and cannot run there (its tail would pass through the glass): it keeps its old circuit.
  const GLASS_R = RT - 0.3, FLOOR_R = 29.5, R_OLD = [14 - 2.6, 20 + 2.6];
  const fishReach = (sc) => { let m = 0; for (let k = 0; k < fa.pos.length; k += 3) { const x = fa.pos[k] * sc; m = Math.max(m, fa.pos[k + 2] * sc + 0.25 + 1.5 * (1 - smoothstep(-8.5, 3.5, x)) ** 2); } return m; };
  const laneOf = (sc) => { const hb = fishHB * sc; return [GLASS_R - 5 - hb, Math.min(GLASS_R - 2 - hb, FLOOR_R - fishReach(sc))]; };      // centre line's radius: [far, near]
  const lanes = fishSeed.map((s) => laneOf(s.sc)), ORBIT_R = (() => { const m = laneOf((1.12 + 1.3) / 2); return (m[0] + m[1]) / 2; })();
  const BLUE = [T.cobalt, T.viridian], RED = [T.vermilion, T.vermilion];
  let fishShown = 1, frontSet = false, demoT = 0, demoCycle = -1, wigT = 0, catAz = G.uCatAz.value;
  const prevTh = new Float32Array(5), prevRate = new Float32Array(5);
  const setLayerUniforms = () => {
    U.uOldA.value.copy(tv(layers.old[0])); U.uOldB.value.copy(tv(layers.old[1])); U.uNewA.value.copy(tv(layers.next[0])); U.uNewB.value.copy(tv(layers.next[1]));
    G.uGOldA.value.copy(tv(PERM[layers.old[0]])); G.uGOldB.value.copy(tv(PERM[layers.old[1]])); G.uGNewA.value.copy(tv(PERM[layers.next[0]])); G.uGNewB.value.copy(tv(PERM[layers.next[1]]));
    const fishy = (t) => t === T.vermilion, wa = fishy(layers.old[0]) ? layers.old[1] : layers.old[0];
    G.uWinA.value.copy(tv(wa)); G.uWinB.value.copy(tv(fishy(layers.old[1]) ? wa : layers.old[1]));
    const red = layers.next[0] === T.vermilion;                             // the stripe is the field's opposite
    U.uShOld.value.copy(tv(layers.shOld ?? (red ? T.lemon : T.viridian))); U.uShNew.value.copy(tv(layers.shNew ?? (red ? T.viridian : T.lemon)));
  };
  if (!opts.style || opts.layers) setLayerUniforms();
  const wp = new THREE.Vector3(), cw = new THREE.Vector3(), size = new THREE.Vector2();
  const fishAngle = (i, t) => wps * t + fishSeed[i].ph * 0.15 + i * (Math.PI * 2 / nFish) * (spread + (1 - spread) * Math.sin(t * 0.083)) + 0.5 * Math.sin(t * 0.19 * fishSeed[i].w + i * 1.9);
  function update(dt, time, camera) {
    U.uTime.value = time;
    object.updateWorldMatrix(true, false); wp.setFromMatrixPosition(object.matrixWorld); G.uOrigin.value.copy(wp);
    if (ctx.renderer?.getDrawingBufferSize) U.uResY.value = ctx.renderer.getDrawingBufferSize(size).y;
    // fish: circling, bunching and stringing out; the reflection stretches with the turn rate
    wigT += dt;
    for (let i = 0; i < nFish; i++) {
      const s = fishSeed[i], th = fishAngle(i, time), r = s.r + 2.6 * Math.sin(time * 0.11 * s.w + s.ph), y = s.y + 2.2 * Math.sin(time * 0.23 * s.w + s.ph * 2);
      const rate = dt > 1e-4 ? clamp((th - prevTh[i]) / dt, 0, 1.2) : wps; prevTh[i] = th; prevRate[i] = lerp(prevRate[i] || rate, rate, clamp(dt * 3, 0, 1));
      const th0 = fishAngle(i, 0), ln = lanes[i];
      fishU[i].set(carp ? th : th0 + (th - th0) * 17 / ORBIT_R, carp ? 17.5 + 1.5 * Math.sin(time * 0.11 * s.w + s.ph) : lerp(ln[0], ln[1], (r - R_OLD[0]) / (R_OLD[1] - R_OLD[0])), carp ? 30 + 2.2 * Math.sin(time * 0.23 * s.w + s.ph * 2) : y, i < nShow ? fishShown : 0);
      fishB[i].set(1 + clamp(Math.abs(prevRate[i] - wps) * 3.2, 0, 0.9), carp ? 2.9 : s.sc, -time * (2.6 + 3.5 * prevRate[i]) + s.ph, 0.05 * Math.cos(time * 0.23 * s.w + s.ph * 2));
    }
    // the front: the world sets it; alone, the hero repaints itself for ever (red over blue, blue over red, ...)
    if (!frontSet) {
      const cyc = Math.floor((time + 8.7) / 30), sd = (c) => (0.13 + c * 0.618034) % 1; demoT = time + 8.7 - cyc * 30;
      if (cyc !== demoCycle) { demoCycle = cyc; const odd = cyc % 2 === 1; layers.old = odd ? RED : BLUE; layers.next = odd ? BLUE : RED; setLayerUniforms(); U.uSeed.value.set(sd(cyc), sd(cyc + 1)); }
      U.uFront.value = -wp.z - 850 + demoT * 45;
    }
    G.uGrow.value = clamp((U.uFront.value + wp.z - 70) * 0.67, 0, vine.length);
    // the two uprights sit where the cylinder's outline is for this eye
    camera.getWorldPosition(cw); const cx = cw.x - wp.x, cz = cw.z - wp.z, d = Math.hypot(cx, cz);
    { // the cat slides the opposite way as we go round, but never out of the glass; the window keeps to the other side
      const dl = Math.atan2(Math.sin(catAz - Math.atan2(-cx, -cz)), Math.cos(catAz - Math.atan2(-cx, -cz))), fade = clamp((Math.PI - Math.abs(dl)) / 0.7, 0, 1);
      const sc = 0.64 * Math.tanh(-dl / 0.3) * fade; G.uCatS.value = sc; G.uWinS.value = sc - 1.28 + 0.1 * Math.tanh(-dl); }
    const phi = Math.atan2(cx, cz), be = d > RT + 0.5 ? Math.acos(clamp((RT + 0.3) / d, -1, 1)) : Math.PI / 2;
    uprights[0].position.set(Math.sin(phi + be) * (RT + 0.3), 0, Math.cos(phi + be) * (RT + 0.3));
    uprights[1].position.set(Math.sin(phi - be) * (RT + 0.3), 0, Math.cos(phi - be) * (RT + 0.3));
  }

  const anchors = {
    // where the 14 x 20 m rect portal stands (the slot between the shutters), and the way the camera is heading there
    portalSeat: { position: new THREE.Vector3(-300, 74, -22), heading: new THREE.Vector3(-1, 0, 0) },
    // a safe camera line, >= 6 m clear of glass, rim and fish: up the +X flank, round the -Z side, over the rim, out along -X
    flyThrough: [[62, 22, 80], [73, 30, 42], [68, 42, 6], [46, 58, -20], [24, 73, -25], [0, 74, -22], [-40, 74, -22], [-110, 74, -22]].map((p) => new THREE.Vector3(...p)),
    viewpoints: { entry: new THREE.Vector3(30, 14, 450), glass: new THREE.Vector3(68, 42, 6), overhead: new THREE.Vector3(0, 108, 4), leaving: new THREE.Vector3(-90, 74, -22) },
    rimLanding: new THREE.Vector3(-20.7, RIM + 0.8, -22),               // where the bee settles: the far rim on the exit line
    fishOrbit: { center: new THREE.Vector3(0, 33, 0), radius: carp ? 17 : ORBIT_R },      // the goldfish's circuit close behind the glass (the carp keeps the old 17 m circle)
    shadowSide: new THREE.Vector3(1, 0, 0), catDirection: new THREE.Vector3(0, 0, -1),
    tankRadius: RT, rimY: RIM, waterY: WATER, tableRadius: TABLE_R, floorY: FLOOR_Y,
  };
  const api = {
    object, radius: 60, height: RIM, center: new THREE.Vector3(0, 30, 0), anchors, style, vine,
    update, dispose() { vine.texture.dispose(); },
    setFront(d) { frontSet = true; U.uFront.value = d; },
    setCatAzimuth(a) { catAz = a; G.uCatAz.value = a; },
    setFishShown(v) { fishShown = v ? 1 : 0; },        // 0: the fish have left; their windows on the glass and the water close
    fishWorld(i, target = new THREE.Vector3()) { const F = fishU[Math.min(i, nFish - 1)]; return target.set(Math.sin(F.x) * F.y, F.z, Math.cos(F.x) * F.y).add(wp); },
    fishCount: nShow, carp, fishSide, ground: false, groundY: FLOOR_Y,
  };
  object.userData.hero = api;
  return api;
}
