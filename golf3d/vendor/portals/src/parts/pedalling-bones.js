// THE PEDALLING BONES: hero set piece. After José Guadalupe Posada (1852-1913): the bone horse and its rider.
//
// WHAT IT IS
//   A galloping skeleton horse about 90 m to the crown of its skull, 100 m nose to tail, ridden by a skeleton
//   in a charro sombrero (about 24 m wide) with one arm flung up, standing in the stirrups and leaning out to the
//   side of that arm; hat top about 125 m. Every bone is bare
//   paper inside a 0.5 m black contour; a long bone is a shaft swelling to a two-lobed knuckle at each end,
//   with a comb bundle under each knuckle; the rib cage is a solid-ink barrel cut with comb bundles 2.7 m wide,
//   24 paper ribs laid over it; hooves and hat are solid ink cut with the comb. Each hoof fall throws a heap of
//   paper dust curls (14 m) and sits on a cluster of dashes. The horse carries its head low and well to one side (opposite
//   the rider's flung arm, by seed) so the rider shows over the withers from in front and no eye meets the lens.
//   One mesh, one material, one draw call; 61 rigid bones posed on the CPU each frame into two vec4 arrays.
//
// HOW THE STYLE IS MADE (shade the whole world with these exports so nothing looks pasted in)
//   makeStyleUniforms(palette)  ONE uniform set shared by reference by every material: uInk, uStarve, uPaper
//                               (the one paper of the current sheet: set it from u inside a Rule slab), uTime,
//                               uResY (drawing-buffer height, set in update), uWear (0 fresh .. 1 worn block),
//                               uRoller (x strength, y world z, z half width: grooves clog to solid black there).
//                               Pass yours as opts.style, or use hero.style for everything else.
//   STYLE_GLSL                  uniforms + pbHash, pbNoise, pbPixel (world size of a pixel) for both shader stages.
//   STYLE_FRAG_GLSL             pbPaper (3 % dye mottle), pbStarved (rare starved patches), pbClog (roller),
//                               pbComb (THE MARK: a brick field of bundles of 4..6 tapered parallel cuts in the
//                               surface's own UV in metres; when a line pitch falls under ~2.5 px the bundle is
//                               drawn as one pointed cut, and when that is under ~2.5 px the black goes solid),
//                               pbBundle (one bundle of lines on paper), pbEdge (ink band along a flat shape's
//                               edge, never under 2.5 px), pbPrint (ink 0..1 -> ink / starved ink / paper).
//                               Every fragment ends in pbPrint, so a pixel is ink, starved ink or the one paper.
//   inkMaterial(style, opts)    the unlit ShaderMaterial family (attributes uv in metres, aMark, aAux, see there);
//                               opts.bones, opts.vertexPre / vertexMove for instancing or pedalling in the shader.
//   makeBuilder, loft, longBone, blob, bar, appendHulls, finishGeometry
//                               geometry in the style: lofted closed tubes with smooth normals; every paper shape
//                               gets an INVERTED HULL (flipped copy pushed out along the normal in the vertex
//                               shader by the contour width, never under 2.5 px, wobbling a little with uTime):
//                               that is the contour, it is geometry, and far and near share one pen.
//                               longBone() is the knuckled bone for riders and dogs (scale L, R, K, bw to taste).
//   Added by the world builder: inkMaterial opts fragPre / fragExtra / fragPost (modes 6 and up, the world's own marks),
//   starveLift (rarer starved patches on large solids), a free varying vX; aAux.x < 0 = a thin ink tube whose own
//   skin never thins under 0.8 px; the set-piece viewer is recognised by opts.style being absent (no location read).
//   No lights, no fog, no textures, no tone-map inverse: return post { flat: 1, bloom: { strength: 0 }, grade:
//   { saturation: 1, contrast: 1, vignette: 0, grain: 0 } } and the hexes are exact.
//
// OPTS  palette [ink, starved, magenta, canary, green] (brief default); paper (index into palette, default 2);
//   style (shared uniforms); detail 0.6..1 (thins only the dust curls); impression 'fresh' | 'worn' (else by
//   seed); arm -1 | 1 (which arm is flung up; the head turns the other way; else by seed); brim (metres, else
//   15.2..16.8 by seed, times 1.2); backdrop (a paper sphere round the camera; on only in the set-piece viewer).
//   By seed as well: girth, withers, skull length, bone thickness, hat crown and curl.
//
// PROGRESS HOOKS (the horse is a function of u, never of the clock)
//   setGallop(s)       stride count: integer part = strides run, fraction = phase. Hooves stay planted when the
//                      object advances STRIDE_LENGTH (96 m) per stride along its own +Z. Until first called the
//                      horse gallops on `time` at 3.2 s a stride (demo). setProgress(u) = setGallop(u * 12.5).
//   anchors.hoofPhase  phase at which each hoof comes down [fore L 0.40, fore R 0.50, hind L 0, hind R 0.12];
//                      a hoof is down for stanceFraction (0.26) of the stride; anchors.hoofPsi is live.
//   setLeap(k, pitch)  0..1 blends into the jump over the border (fore legs tucked, hind legs trailing, nose up by
//                      pitch radians, default 0.34); lift and move hero.object yourself.
//   setGroundSpeed(k)  1 (default): dust curls are left behind at stride speed; 0: they stay under the horse.
//   setReach(k)        0..1.3: the share of the 96 m stride really covered (a collected, prancing stride at low k):
//                      move the object k * 96 m per stride and the hooves stay planted at any speed.
//   setPuffSide(k)     centre of each dust heap at x = +-10 k (default 1.12); opts.puff scales the heaps (default 1).
//   setPuffScale(k)    the heaps' size over opts.puff (default 1).
//   setPuffHold(a)     the horse object's rotation.y in radians, so that each heap keeps its place on the street while the horse turns
//                      (default 0: the heaps turn with the horse).
//   setHatTilt(a)      the sombrero's tilt in radians (default -0.1): about +0.5 when the horse comes at a low camera,
//                      about -0.6 when it is seen from behind and below, so the crown stands over the brim either way.
//   setPaper(hex)      the sheet's paper. Ambient only on time: contour wobble, tail lash, rider's arm, jaw.
//
// ANCHORS (local space; the horse faces +Z; turn the object by PI when it comes at the camera)
//   flyThrough   camera line under the horse from in front to behind: between the fore cannon bones (x +-10),
//                34 m up under the rib tips (ribTipY 42.4, 8 m overhead), out between the hind legs. Nothing
//                within 6 m of it except the dust curls. underRibs = its middle.
//   hoofLand     where each hoof comes down; hooves (live Vector3s), riderHat, horseSkull (live).
//   portalSeat   where the 14 m ring sits under the leaping horse (setLeap(1), object origin 23 m up, belly over
//                the 30 m gate): position and facing (back along the path).
//   viewpoints   front (first frame), below, behind, look.
//
// SIZE radius 64, height 126, hooves 7 m across at x = +-10. COST about 105k triangles, 1 draw call, 61 bones
//   (122 uniform vec4), no textures, no lights; build about 100-250 ms in steps under 30 ms. ground: false (it
//   stands on paper: give it the street). Expects the flat pipeline and nothing lit near it.
//   Viewer only: opts.pbcam seats the orbit camera at the brief's frames (far front, reveal, under, behind, sides).
import * as THREE from 'three';

export const PB_PALETTE = ['#14110F', '#3A322C', '#E86AA6', '#F2D33B', '#7FB87A'];

// ---------------------------------------------------------------------------------------------
// STYLE: one set of uniforms shared by every material of the world (same object references).
// ---------------------------------------------------------------------------------------------
export function makeStyleUniforms(palette = PB_PALETTE) {
  return {
    uInk: { value: new THREE.Color(palette[0]) },
    uStarve: { value: new THREE.Color(palette[1]) },
    uPaper: { value: new THREE.Color(palette[2]) },
    uTime: { value: 0 },
    uResY: { value: 720 },
    uWear: { value: 0.3 },                               // 0 fresh block .. 1 worn block
    uRoller: { value: new THREE.Vector4(0, 0, 6, 0) },   // x strength 0..1, y world z of the wet roller, z half width (m)
    uAccent: { value: new THREE.Color('#D8391C') },      // THE SECOND PRINTING: one flat vermilion block, struck first and a little off register (aMark.w >= 4 marks a shape it fills)
    uReg: { value: new THREE.Vector2(0.0045, -0.007) },  // its misregister, in clip units: the same slip everywhere on the sheet
  };
}

// GLSL shared by vertex and fragment shaders. Needs the uniforms above.
export const STYLE_GLSL = /* glsl */`
uniform vec3 uInk, uStarve, uPaper, uAccent; uniform vec2 uReg;
uniform float uTime, uResY, uWear;
uniform vec4 uRoller;
float pbHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float pbNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(pbHash(i), pbHash(i + vec2(1., 0.)), f.x), mix(pbHash(i + vec2(0., 1.)), pbHash(i + vec2(1., 1.)), f.x), f.y); }
// coverage of a line of half width hw at distance d from its centre, with pixel footprint aa (0 when the line is thinner than a pixel can carry)
float pbLine(float hw, float d, float aa){ return clamp((hw - d) / aa + 0.5, 0., 1.) * clamp(1.6 * hw / aa - 0.3, 0., 1.); }
// world size of one pixel at clip-space w (vertex shader: pbPixel(gl_Position.w, projectionMatrix[1][1]))
float pbPixel(float w, float p11){ return 2. * abs(w) / max(p11 * uResY, 1.); }
`;

// Fragment-only part: the paper, the ink, the comb.
export const STYLE_FRAG_GLSL = /* glsl */`
// the stock: dyed right through, mottled 3 percent where dye pooled. q = any surface coordinate in metres.
vec3 pbPaper(vec2 q){ float m = pbNoise(q * 0.045) * 0.6 + pbNoise(q * 0.21 + 7.3) * 0.4; return uPaper * (0.985 + 0.03 * m); }
// starved ink: a rare HARD-EDGED fault of the press. Small ragged patches inside the big solids, each a mottle of
// crisp speckles that thicken toward its middle (one pixel of edge at any distance: never a cloud, never a ramp).
// lift raises the threshold (rarer); lift > 0.5: never (hats, bones, riders); lift < -0.5: a whole starved impression.
float pbStarvedK(vec2 q, float px, float lift){
  float m = pbNoise(q * 0.47 + 3.1) * 0.7 + pbNoise(q * 1.9 + 11.7) * 0.3 + 0.04 * (pbNoise(q * 6.1 + 1.9) - 0.5);
  float d = m - (mix(0.835, 0.805, uWear) + lift);
  float e = max(fwidth(m) * 0.6, 1e-4);
  float pat = smoothstep(-e, e, d);
  // the mottle: crisp speckles, sparse at the patch's edge and close in its middle; a coarse grain that is still
  // there at a distance and a fine one for close to (each dropped, never blurred, when it is finer than 3 px)
  float mid = 1. - smoothstep(0.035, 0.07, px), fine = 1. - smoothstep(0.008, 0.018, px);
  float s = pbNoise(q * 4.7 + 5.7) * (1. - 0.45 * fine) + pbNoise(q * 19. + 2.3) * 0.45 * fine;
  float cut = mix(-1., mix(0.74, 0.2, clamp(d / 0.045, 0., 1.)), mid);
  float es = max(fwidth(s) * 0.6, 1e-4);
  float v = pat * smoothstep(-es, es, s - cut);            // (no early return: the derivatives above stay outside any branch)
  return lift < -0.5 ? 1. : lift > 0.5 ? 0. : v;
}
float pbStarved(vec2 q, float px){ return pbStarvedK(q, px, 0.); }
// the wet roller: 1 where grooves are clogged with ink. wz = world z of the fragment.
float pbClog(float wz){ float d = abs(wz - uRoller.y) / max(uRoller.z, 0.01); return uRoller.x * (1. - smoothstep(0.55, 1., d)); }
// THE COMB: a field of bundles laid side by side like bricks, never crossing. p in metres (x across the
// lines, y along them), cell = (bundle width, bundle length), n = lines per bundle (4..6 by cell),
// fw = fwidth(p) taken by the caller OUTSIDE any loop; seed must be an EXACT constant (snap a varying with floor).
// Returns 1 where the cutter opened the black to paper.
float pbComb(vec2 p, vec2 cell, vec2 fw, float seed){
  float col = floor(p.x / cell.x);
  float h0 = pbHash(vec2(col, seed));
  float yy = p.y / cell.y + h0 * 7.31;
  float row = floor(yy);
  float h1 = pbHash(vec2(col * 1.7 + 3., row + seed * 13.));
  float a = fract(p.x / cell.x), b = fract(yy);
  float n = 4. + floor(pbHash(vec2(col * 3.3 + 1., seed + 5.)) * 2.99);      // 4..6 cuts, one count per column so the rows line up end to end
  float fy = fw.y / max(cell.y, 0.01), endK = smoothstep(0.03, 0.12, fy);
  float skew = (pbHash(vec2(row, col + seed)) - 0.5) * 0.10 * (1. - endK);
  a += skew * (b - 0.5);
  float la = (a - 0.14) / 0.72 * n;                       // 72 percent of the cell is cut, the rest is the bar between bundles
  float idx = floor(la);
  float inside = step(0., la) * step(la, n);
  float pitch = cell.x * 0.72 / n;                         // metres between lines
  float d = abs(fract(la) - 0.5) * pitch;                  // metres from the line centre
  float lh = pbHash(vec2(idx + col * 5., row * 3. + seed));
  float b0 = 0.05 + 0.16 * lh, b1 = 0.95 - 0.16 * pbHash(vec2(idx * 3.1 + row, col + seed + 2.));
  float t = clamp((b - b0) / max(b1 - b0, 0.01), 0., 1.);
  float taper = sin(3.14159 * t); taper = sqrt(max(taper, 0.));   // lens: full in the middle, pointed at both ends
  // seen so edge-on that a pixel spans a good part of a bundle's length: the cuts run on unbroken (no chopped dashes)
  taper = mix(taper, 0.8, endK);
  float hw = pitch * mix(0.25, 0.35, uWear) * taper;
  float aa = max(fw.x, 1e-5);
  hw *= smoothstep(1.6, 3.2, pitch / aa);                  // pitch under ~2.5 px: the cut closes, the black goes solid
  float line = pbLine(hw, d, aa) * inside;
  // too far to count the lines: the whole bundle is drawn as ONE pointed cut, until that too is under 2.5 px
  float vis = smoothstep(1.6, 3.2, pitch / aa);
  float hc = cell.x * 0.19 * taper * (1. - vis) * smoothstep(1.3, 2.6, cell.x * 0.38 / aa);
  float coarse = pbLine(hc, abs(a - 0.5) * cell.x, aa);
  float ends = smoothstep(b0 - fy, b0 + fy, b) * (1. - smoothstep(b1 - fy, b1 + fy, b));
  return max(line, coarse) * mix(ends, 1., endK);
}
// ONE bundle of n lines centred on the origin (for a joint on a paper bone): returns 1 on a line.
// p in metres (x across, y along), size = (width, length). The outer lines are shorter. Lines fatten toward the middle.
float pbBundle(vec2 p, vec2 size, float n, vec2 fw){
  float la = (p.x / size.x + 0.5) * n;
  float inside = step(0., la) * step(la, n);
  float idx = floor(la);
  float pitch = size.x / n;
  float d = abs(fract(la) - 0.5) * pitch;
  float edge = abs((idx + 0.5) / n - 0.5) * 2.;            // 0 centre line .. 1 outer lines
  float half_ = size.y * 0.5 * (1. - 0.45 * edge * edge);
  float t = clamp(abs(p.y) / max(half_, 0.01), 0., 1.);
  float taper = sqrt(max(1. - t * t, 0.));
  float hw = pitch * 0.27 * taper;
  float aa = max(fw.x, 1e-5);
  float vis = smoothstep(1.2, 2.6, pitch / aa);            // too fine to draw: the lines fatten until the bundle is one solid wedge
  hw = mix(pitch * 0.5, hw, vis);
  float cov = mix(1., clamp((hw - d) / aa + 0.5, 0., 1.), vis);
  float thin = clamp(1.6 * hw / aa - 0.3, 0., 1.);        // a tip thinner than a pixel can carry is not drawn
  float wedge = step(t, 0.999) * smoothstep(1.3, 2.6, size.x / aa);   // and a wedge under ~2.5 px is not drawn either
  return cov * mix(wedge, thin, vis) * inside;
}
// ink band along the edge of a flat shape. e = distance to the edge in metres, w = band width, fe = fwidth(e).
float pbEdge(float e, float w, float fe){ float ww = max(w, 2.5 * fe); return 1. - smoothstep(ww - fe * 0.6, ww + fe * 0.6, e); }
// final print: ink 0..1 over the one paper. q = surface coordinate in metres (for mottle and starving).
vec3 pbPrint(float ink, vec2 q, float px){ return mix(pbPaper(q), mix(uInk, uStarve, pbStarved(q, px)), clamp(ink, 0., 1.)); }
`;

// ---------------------------------------------------------------------------------------------
// THE ONE MATERIAL FAMILY. Geometry attributes it reads:
//   uv     (metres on the surface: x across / around, y along)
//   aMark  vec4: x mode, y bundle width (m), z bundle length (m; for modes 0 and 4 the bone length), w seed
//          mode 0 paper bone, a comb bundle under each knuckle     mode 1 solid ink cut by the comb field
//          mode 2 solid ink, uncut                                  mode 3 bare paper
//          mode 4 paper bar with bundles all along it (ribs)        mode 5 paper cut by black bundles (puffs)
//   aAux   vec2: x contour hull width in metres (0 = not a hull vertex), y circumference (m) for modes 0 and 4
//   aBone  float (only with opts.bones): index into uBoneQ / uBoneP
// opts: bones (count, 0 = none), side, vertexPre (GLSL declarations), vertexMove (GLSL acting on
//   `vec3 p, n` in local space before the model matrix, e.g. instancing or pedalling), uniforms (extra).
//   fragPre (GLSL declarations), fragExtra (GLSL for modes 6 and up: sets `ink` from vUv, vMark, fw, seed, vX),
//   fragPost (GLSL after every mode, before the print), vX (a free vec4 varying vertexMove may fill).
// ---------------------------------------------------------------------------------------------
export function inkMaterial(style, opts = {}) {
  const bones = opts.bones | 0;
  const uniforms = { ...style, uStarveLift: { value: opts.starveLift ?? 0 }, ...(opts.uniforms || {}) };
  if (bones) {
    uniforms.uBoneQ = { value: Array.from({ length: bones }, () => new THREE.Vector4(0, 0, 0, 1)) };
    uniforms.uBoneP = { value: Array.from({ length: bones }, () => new THREE.Vector4(0, 0, 0, 1)) };
  }
  const vertexShader = /* glsl */`
    ${STYLE_GLSL}
    attribute vec4 aMark; attribute vec2 aAux;
    ${bones ? `attribute float aBone; uniform vec4 uBoneQ[${bones}]; uniform vec4 uBoneP[${bones}];` : ''}
    ${opts.vertexPre || ''}
    varying vec2 vUv; varying vec4 vMark; varying vec2 vAux; varying vec3 vW; varying float vPx; varying vec4 vX;
    vec3 pbRot(vec4 q, vec3 v){ return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
    void main(){
      vec3 p = position, n = normal; float sc = 1.; vX = vec4(0.);
      ${bones ? `int bi = int(aBone + 0.5); vec4 bq = uBoneQ[bi], bp = uBoneP[bi]; sc = bp.w;
      p = pbRot(bq, p * sc) + bp.xyz; n = pbRot(bq, n);` : ''}
      ${opts.vertexMove || ''}
      vec4 wp = modelMatrix * vec4(p, 1.);
      #ifdef USE_INSTANCING
        wp = modelMatrix * instanceMatrix * vec4(p, 1.); n = mat3(instanceMatrix) * n;
      #endif
      vec3 wn = mat3(modelMatrix) * n; wn = wn / max(length(wn), 1e-5);
      vec4 cp = projectionMatrix * viewMatrix * wp;
      float px = pbPixel(cp.w, projectionMatrix[1][1]);
      if (aAux.x != 0.) {                                    // the contour: an inverted hull, never under 2.5 pixels (aAux.x < 0: a thin ink tube's own skin, never under 0.8)
        float wob = 1. + 0.16 * sin(dot(wp.xyz, vec3(0.37, 0.29, 0.41)) + uTime * 2.3) + 0.10 * sin(dot(wp.xyz, vec3(-1.1, 0.83, 0.6)) - uTime * 3.1);
        float w = max(abs(aAux.x) * sc * wob, (aAux.x > 0. ? 2.5 : 0.8) * px) * step(0.002, sc);
        wp.xyz += wn * w;
        cp = projectionMatrix * viewMatrix * wp;
      }
      if (aMark.w > 3. && aAux.x == 0.) cp.xy += uReg * cp.w;     // the colour block sits a little off the black one
      vUv = uv; vMark = aMark; vAux = aAux; vW = wp.xyz; vPx = px;
      gl_Position = cp;
    }`;
  const fragmentShader = /* glsl */`
    ${STYLE_GLSL}
    ${STYLE_FRAG_GLSL}
    varying vec2 vUv; varying vec4 vMark; varying vec2 vAux; varying vec3 vW; varying float vPx; varying vec4 vX;
    uniform float uStarveLift;
    ${opts.fragPre || ''}
    void main(){
      // an interpolated constant wobbles in its last bits from pixel to pixel: snap it before it feeds any hash
      float acc = vAux.x > 0. ? 0. : step(3., vMark.w);       // the second printing fills this shape where the black block leaves paper
      float mode = floor(vMark.x + 0.5), seed = floor((vMark.w - 4. * step(3., vMark.w)) * 1024. + 0.5) / 1024.;
      vec2 fw = fwidth(vUv) + 1e-5, fwW = fwidth(vW.xz) + 1e-5;
      vec2 q = vUv + seed * 17.3;
      float ink = 0., starveMul = 1., starveAdd = 0.;      // fragExtra may quiet the starving (0) or force it (1: a second, starved impression)
      float clog = pbClog(vW.z);
      if (vAux.x > 0. || (mode > 1.5 && mode < 2.5)) {
        ink = 1.;
      } else if (mode < 0.5 || (mode > 3.5 && mode < 4.5)) {
        float C = max(vAux.y, 0.1), bw = vMark.y, L = vMark.z;
        float cellU = C / 3.;
        float u0 = (fract(vUv.x / C * 3. + seed) - 0.5) * cellU;
        float u1 = (fract(vUv.x / C * 3. + seed + 0.5) - 0.5) * cellU;
        vec2 f2 = vec2(fw.x, fw.y);
        if (mode < 0.5) {
          float bl = min(0.34 * L, 3.6 * bw);
          float inset = min(0.26 * L, bl * 0.5 + bw * 0.55);
          ink = max(pbBundle(vec2(u0, vUv.y - inset), vec2(bw, bl), 5., f2),
                    pbBundle(vec2(u1, vUv.y - (L - inset)), vec2(bw, bl), 5., f2));
        } else {
          float per = max(5.2 * bw, 0.05); float k = floor(vUv.y / per); float y = (fract(vUv.y / per) - 0.5) * per;
          float alt = mod(k, 2.);
          ink = pbBundle(vec2(mix(u0, u1, alt), y), vec2(bw, per * 0.8), 4. + alt, f2) * step(0.5, k) * step(k + 1.5, L / per);
        }
        ink *= 1. - 0.0 * clog;
      } else if (mode < 1.5) {
        ink = 1. - pbComb(vUv, vMark.yz, fw, seed) * (1. - clog);
      } else if (mode < 3.5) {
        ink = 0.;
      } else if (mode < 5.5) {
        ink = pbComb(vUv.yx, vMark.yz, fw.yx, seed);
      } else {
        ${opts.fragExtra || 'ink = 0.;'}
      }
      ${opts.fragPost || ''}
      gl_FragColor = vec4(mix(mix(pbPaper(q), uAccent, acc), mix(uInk, uStarve, max(pbStarvedK(q, vPx, uStarveLift) * starveMul * step(abs(vAux.x), 0.), starveAdd)), clamp(ink, 0., 1.)), 1.);
    }`;
  return new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: opts.side ?? THREE.FrontSide });
}

// ---------------------------------------------------------------------------------------------
// GEOMETRY BUILDER: plain arrays, lofted tubes, and the hull that draws every contour.
// ---------------------------------------------------------------------------------------------
export function makeBuilder() {
  return { pos: [], nor: [], uv: [], mark: [], aux: [], bone: [], idx: [], hullFrom: [] };
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3(), _s = new THREE.Vector3();

// Loft a closed tube through stations [{ p: Vector3, rx, rz, lobe, notch }] (local space of bone `bone`).
// side = direction the two lobes point along. mark = [mode, bundleW, bundleL, seed]; hull = contour width (0 none).
// uv.x runs round the section in metres of a nominal circumference circ, uv.y along the tube in metres.
export function loft(B, stations, nseg, side, mark, opts = {}) {
  const { bone = 0, hull = 0.5, circ = 6, v0 = 0, flip = false } = opts;
  const base = B.pos.length / 3, n = stations.length, cols = nseg + 1;
  let v = v0;
  for (let i = 0; i < n; i++) {
    const s = stations[i], p0 = stations[Math.max(0, i - 1)].p, p1 = stations[Math.min(n - 1, i + 1)].p;
    _t.subVectors(p1, p0); if (_t.lengthSq() < 1e-10) _t.set(0, 1, 0); _t.normalize();
    if (opts.axis) _t.copy(opts.axis);
    _s.copy(s.side || side); _a.copy(_s).addScaledVector(_t, -_t.dot(_s)); if (_a.lengthSq() < 1e-8) _a.set(1, 0, 0); _a.normalize();
    _b.crossVectors(_t, _a);
    if (i > 0) v += s.p.distanceTo(stations[i - 1].p);
    const vv = s.v !== undefined ? s.v : v;
    for (let j = 0; j < cols; j++) {
      const th = (j / nseg) * Math.PI * 2, c2 = Math.cos(2 * th);
      const rad = 1 + (s.lobe || 0) * c2;
      const x = Math.cos(th) * s.rx * rad, z = Math.sin(th) * s.rz * rad, y = (s.notch || 0) * c2;
      B.pos.push(s.p.x + _a.x * x + _b.x * z + _t.x * y, s.p.y + _a.y * x + _b.y * z + _t.y * y, s.p.z + _a.z * x + _b.z * z + _t.z * y);
      B.nor.push(0, 0, 0); B.uv.push((j / nseg) * circ, vv);
      B.mark.push(mark[0], mark[1], mark[2], Math.round(mark[3] * 1024) / 1024); B.aux.push(0, circ); B.bone.push(bone);
    }
  }
  const i0 = B.idx.length;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < nseg; j++) {
    const a = base + i * cols + j, b = a + 1, c = a + cols, d = c + 1;
    if (flip) B.idx.push(a, c, b, b, c, d); else B.idx.push(a, b, c, b, d, c);
  }
  // smooth normals by face accumulation, seam columns merged
  const P = B.pos, N = B.nor;
  for (let k = i0; k < B.idx.length; k += 3) {
    const ia = B.idx[k] * 3, ib = B.idx[k + 1] * 3, ic = B.idx[k + 2] * 3;
    _a.set(P[ib] - P[ia], P[ib + 1] - P[ia + 1], P[ib + 2] - P[ia + 2]); _b.set(P[ic] - P[ia], P[ic + 1] - P[ia + 1], P[ic + 2] - P[ia + 2]);
    _c.crossVectors(_a, _b);
    for (const q of [ia, ib, ic]) { N[q] += _c.x; N[q + 1] += _c.y; N[q + 2] += _c.z; }
  }
  for (let i = 0; i < n; i++) {
    const s0 = (base + i * cols) * 3, s1 = (base + i * cols + nseg) * 3;
    for (let k = 0; k < 3; k++) { const m = N[s0 + k] + N[s1 + k]; N[s0 + k] = m; N[s1 + k] = m; }
    for (let j = 0; j < cols; j++) {
      const q = (base + i * cols + j) * 3; let l = Math.hypot(N[q], N[q + 1], N[q + 2]);
      if (l < 1e-9) { // collapsed cap ring: point along the tube axis
        const s = stations[i], o = stations[i === 0 ? 1 : n - 2]; _c.subVectors(s.p, o.p); l = _c.length() || 1; N[q] = _c.x / l; N[q + 1] = _c.y / l; N[q + 2] = _c.z / l;
      } else { N[q] /= l; N[q + 1] /= l; N[q + 2] /= l; }
    }
  }
  if (hull > 0) B.hullFrom.push([base, base + n * cols, i0, B.idx.length, hull]);
  return base;
}

// Append the contour hulls (flipped copies pushed out along the normal in the vertex shader) and make the geometry.
export function appendHulls(B, max = Infinity) {       // max: how many shapes to do in this call (for short build steps)
  const todo = B.hullFrom.splice(0, max);
  for (const [v0, v1, i0, i1, w] of todo) {
    const off = B.pos.length / 3 - v0;
    for (let v = v0; v < v1; v++) {
      B.pos.push(B.pos[v * 3], B.pos[v * 3 + 1], B.pos[v * 3 + 2]); B.nor.push(B.nor[v * 3], B.nor[v * 3 + 1], B.nor[v * 3 + 2]);
      B.uv.push(B.uv[v * 2], B.uv[v * 2 + 1]); B.mark.push(2, 0, 0, B.mark[v * 4 + 3]); B.aux.push(w, B.aux[v * 2 + 1]); B.bone.push(B.bone[v]);
    }
    for (let k = i0; k < i1; k += 3) B.idx.push(B.idx[k] + off, B.idx[k + 2] + off, B.idx[k + 1] + off);
  }
}
export function finishGeometry(B, withBones = true) {
  appendHulls(B);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setAttribute('aMark', new THREE.Float32BufferAttribute(B.mark, 4));
  g.setAttribute('aAux', new THREE.Float32BufferAttribute(B.aux, 2));
  if (withBones) g.setAttribute('aBone', new THREE.Float32BufferAttribute(B.bone, 1));
  g.setIndex(B.pos.length / 3 > 65000 ? new THREE.Uint32BufferAttribute(B.idx, 1) : new THREE.Uint16BufferAttribute(B.idx, 1));
  return g;
}

// ---------------------------------------------------------------------------------------------
// BONE SHAPES (all in the local space of one skeleton bone; long bones run along +Y from the joint)
// ---------------------------------------------------------------------------------------------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const X_AXIS = V(1, 0, 0), Y_AXIS = V(0, 1, 0), Z_AXIS = V(0, 0, 1);
const st = (x, y, z, rx, rz, lobe = 0, notch = 0, side) => ({ p: V(x, y, z), rx, rz, lobe, notch, side });

// A long bone: a shaft swelling to a two-lobed knuckle at each end (never a stick or a tube).
// L length joint to joint, R shaft radius, K knuckle radius; lobes point along local X.
export function longBone(B, bone, L, R, K, seed, opts = {}) {
  const { bw = 2.7, nseg = 12, hull = 0.5, k0 = 1, k1 = 1, mode = 0, bend = 0 } = opts;
  const S = [];
  const ring = (y) => {
    const d0 = y / (K * k0), d1 = (L - y) / (K * k1);
    const w0 = Math.exp(-d0 * d0 * 0.9), w1 = Math.exp(-d1 * d1 * 0.9), w = Math.max(w0, w1);
    const f = Math.min(1, Math.max(0, y / L));
    let r = R * (0.84 + 0.16 * (2 * f - 1) * (2 * f - 1));
    const s0 = 1 - d0 * d0, s1 = 1 - d1 * d1;
    if (s0 > 0) r = Math.max(r * (y > 0 ? 1 : 0), K * k0 * Math.sqrt(s0));
    if (s1 > 0) r = Math.max(r * (y < L ? 1 : 0), K * k1 * Math.sqrt(s1));
    if (y > 0 && y < L) { const sh = R * (0.84 + 0.16 * (2 * f - 1) * (2 * f - 1)), g = Math.max(Math.exp(-Math.max(0, d0 - 0.75) * 2.6) * (d0 < 2.2 ? 1 : 0), Math.exp(-Math.max(0, d1 - 0.75) * 2.6) * (d1 < 2.2 ? 1 : 0)); r = Math.max(r, sh + (K * Math.min(k0, k1) * 0.62 - sh) * g * 0.55); }
    r = Math.max(r, 0.02);
    const cap = y < 0 ? -1 : y > L ? 1 : 0;
    const x = bend * Math.sin(Math.PI * f) * R;
    S.push(st(0, y, x, r * (1 + 0.42 * w), r * (1 - 0.06 * w), 0.20 * w, cap * 0.30 * K * (cap < 0 ? k0 : k1) * w));
  };
  const e0 = [-1, -0.97, -0.88, -0.72, -0.5, -0.25, 0, 0.28, 0.55, 0.8, 1.0, 1.2, 1.45, 1.8], Ka = K * k0, Kb = K * k1;
  for (const e of e0) ring(e * Ka);
  const m0 = 1.8 * Ka, m1 = L - 1.8 * Kb, nm = Math.max(1, Math.round((m1 - m0) / (R * 3.2)));
  for (let i = 1; i < nm; i++) ring(m0 + (m1 - m0) * (i / nm));
  for (let i = e0.length - 1; i >= 0; i--) ring(L - e0[i] * Kb);
  for (const s of S) s.v = s.p.y;
  loft(B, S, nseg, X_AXIS, [mode, bw, L, seed], { bone, hull, circ: 2 * Math.PI * R * 1.15 });
}

// A blob: a squashed, slightly lumpy ball (knots of the spine, eye sockets, hoof cores, puff lobes).
export function blob(B, bone, c, r, mark, opts = {}) {
  const { nseg = 10, nring = 7, hull = 0.5, axis = Y_AXIS, side = X_AXIS, lump = 0, circ } = opts;
  const S = [], ax = _t.copy(axis).normalize().clone();
  for (let i = 0; i <= nring; i++) {
    const a = (i / nring) * Math.PI, y = -Math.cos(a) * r[1], k = Math.max(0.02, Math.sin(a)) * (1 + lump * Math.sin(i * 2.4 + mark[3] * 9));
    const s = st(c.x + ax.x * y, c.y + ax.y * y, c.z + ax.z * y, r[0] * k, r[2] * k); s.v = y + r[1]; S.push(s);
  }
  loft(B, S, nseg, side, mark, { bone, hull, circ: circ ?? 2 * Math.PI * Math.max(r[0], r[2]) });
}

// A curved bar through points (ribs, tail links, hat plumes, pelvis wings): flattened section rx by rz, tapering to both ends.
export function bar(B, bone, pts, rx, rz, side, mark, opts = {}) {
  const { nseg = 8, hull = 0.5, taper0 = 0.6, taper1 = 0.35, sub = 14, circ, knob = 0 } = opts;
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), S = [];
  curve.arcLengthDivisions = Math.max(24, (sub + 2) * 4);      // the default 200 samples a curve made this the build's hot spot
  const L = curve.getLength();
  for (let i = 0; i <= sub + 2; i++) {
    const f = i === 0 ? 0 : i === sub + 2 ? 1 : (i - 0.5) / (sub + 1), p = curve.getPointAt(f);
    const e = Math.min(f, 1 - f) * L, cap = Math.sqrt(Math.min(1, e / Math.max(rz, 0.01) * 0.9));
    const tp = (taper0 + (1 - taper0) * Math.min(1, f * 3.5)) * (taper1 + (1 - taper1) * Math.min(1, (1 - f) * 2.2));
    const kb = 1 + knob * Math.exp(-(f * L) * (f * L) / (rx * rx * 4)) + knob * 0.7 * Math.exp(-((1 - f) * L) * ((1 - f) * L) / (rx * rx * 3));
    const s = st(p.x, p.y, p.z, Math.max(0.02, rx * tp * kb * cap), Math.max(0.02, rz * tp * kb * cap)); s.v = f * L; S.push(s);
  }
  loft(B, S, nseg, side, [mark[0], mark[1], L, mark[3]], { bone, hull, circ: circ ?? 2.2 * (rx + rz) });
  return L;
}

// ---------------------------------------------------------------------------------------------
// THE BONE HORSE
// ---------------------------------------------------------------------------------------------
const NB = 61;                                     // skeleton bones (uniform arrays of this size)
const THX = 0, LUM = 1, NECK = 2, SKULL = 8, JAW = 9, TAIL = 10, SCAP = 18, LEG = 20, RPEL = 36, RCHEST = 37, RSKULL = 38, RJAW = 39, RHAT = 40,
  RARM = 41, RLEG = 47, PUFF = 53, DASH = 57;
const NECK_N = 6, NECK_L = 4.2, TAIL_N = 8, TAIL_L = 2.9;
const SH = { U: 17, W: 17, C: 13, H: 5.2 }, HI = { U: 18.5, W: 19, C: 14.5, H: 5.2 };   // leg segment lengths, fore and hind

async function buildHorseGeometry(B, rng, v, Y) {
  const sd = () => rng();
  // ---- thorax: the inked barrel, 24 ribs, the knotted spine
  const barrel = [], BL0 = -20, BL1 = 21;
  const bk = (z) => { const f = (z - BL0) / (BL1 - BL0); return Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(f, 0.85))), 0.38) * (0.86 + 0.14 * Math.sin(Math.PI * Math.min(1, f * 1.25))); };
  for (let i = 0; i <= 22; i++) {
    const f = i / 22, z = BL0 + (BL1 - BL0) * f, k = Math.max(0.02, bk(z));
    const s = st(0, -BC, z, BRX * k * v.girth, BRZ * k * v.depth); s.v = z - BL0; barrel.push(s);
  }
  loft(B, barrel, 28, X_AXIS, [1, 2.7, 8.2, sd()], { bone: THX, hull: 0, circ: 72.9, axis: Z_AXIS });
  await Y();
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) await Y();
    const z = 17.6 - i * 3.3, k = bk(z - 1), rx = (BRX * k * v.girth + 0.95), rz = (BRZ * k * v.depth + 0.95);
    const end = (159 + 5 * Math.sin(i * 0.5) - (i > 8 ? (i - 8) * 9 : 0)) * Math.PI / 180;
    for (const sx of [-1, 1]) {
      const pts = [];
      for (let j = 0; j <= 6; j++) {
        const ph = 0.10 + (end - 0.10) * (j / 6);
        pts.push(V(sx * rx * Math.sin(ph), -BC + rz * Math.cos(ph) + (j === 0 ? 0.3 : 0), z - 1.6 * Math.sin(ph * 0.6)));
      }
      bar(B, THX, pts, 0.86, 0.55, Z_AXIS, [4, 0.66, 0, sd()], { nseg: 8, hull: 0.42, taper0: 0.8, taper1: 0.55, sub: 18, knob: 0.5 });
    }
    // vertebra knot and its spine
    blob(B, THX, V(0, 0.9, z), [1.55, 1.35, 1.5], [3, 0, 0, sd()], { nseg: 8, nring: 5, hull: 0.42, lump: 0.08 });
    const ph = i < 5 ? 3.4 * Math.sin((i + 0.6) / 5 * Math.PI) * v.withers + 2.4 : 2.6;
    bar(B, THX, [V(0, 1.6, z), V(0, 1.6 + ph * 0.55, z - 0.9), V(0, 1.6 + ph, z - 2.2)], 0.62, 0.45, Z_AXIS, [3, 0, 0, sd()], { nseg: 6, hull: 0.42, sub: 5, taper0: 1, taper1: 0.6 });
  }
  await Y();
  // ---- lumbar and pelvis (bone origin at horse (0, 62, -20))
  for (let i = 0; i < 4; i++) blob(B, LUM, V(0, 0.8, -1.4 - i * 3.0), [1.7, 1.4, 1.5], [3, 0, 0, sd()], { nseg: 8, nring: 5, hull: 0.42, lump: 0.08 });
  for (const sx of [-1, 1]) {
    bar(B, LUM, [V(sx * 0.8, 1.6, -0.5), V(sx * 5.8, -2.5, -1.0), V(sx * 8.9, -9.5, -1.8), V(sx * 9.3, -16.4, -2)], 3.1, 1.0, Z_AXIS, [4, 1.6, 0, sd()], { nseg: 10, hull: 0.5, taper0: 0.7, taper1: 0.75, sub: 12 });
    bar(B, LUM, [V(sx * 1.2, 1.2, -4.5), V(sx * 4.2, -0.6, -8.5), V(sx * 5.2, -3.8, -12.5)], 1.7, 0.8, Z_AXIS, [3, 0, 0, sd()], { nseg: 8, hull: 0.5, sub: 7, taper0: 0.9, taper1: 0.7 });
    blob(B, LUM, V(sx * 8.6, -15.4, -2), [1.6, 1.8, 2.2], [3, 0, 0, sd()], { nseg: 10, nring: 6, hull: 0.5 });
  }
  blob(B, LUM, V(0, 0.6, -12.5), [2.3, 1.7, 2.6], [3, 0, 0, sd()], { nseg: 8, nring: 5, hull: 0.45, lump: 0.1 });
  await Y();
  // ---- neck: knuckled beads
  for (let i = 0; i < NECK_N; i++) {
    longBone(B, NECK + i, NECK_L, 1.65 - i * 0.07, 2.3 - i * 0.1, sd(), { bw: 1.5, nseg: 10, hull: 0.45 });
    bar(B, NECK + i, [V(0, NECK_L * 0.5, 1.4), V(0, NECK_L * 0.62, 3.6 - i * 0.3)], 0.7, 0.5, Y_AXIS, [3, 0, 0, sd()], { nseg: 6, hull: 0.4, sub: 4, taper0: 1, taper1: 0.6 });
  }
  await Y();
  // ---- skull (local y poll -> nose, local +z = toward the jaw, x lateral)
  const SL = 20 * v.skull, sk = (y, rx, rz, oz) => { const s = st(0, y * v.skull, oz, rx, rz); s.v = y * v.skull + 1; return s; };
  loft(B, [sk(-1.0, 0.02, 0.02, -0.3), sk(-0.9, 1.4, 1.3, -0.3), sk(-0.2, 2.6, 2.4, -0.3), sk(2.0, 3.6, 3.2, -0.2), sk(4.4, 4.1, 3.4, 0), sk(6.4, 4.3, 3.3, 0.2),
    sk(8.3, 3.5, 2.9, 0.4), sk(10.5, 2.7, 2.5, 0.6), sk(13.2, 2.15, 2.1, 0.8), sk(16.2, 1.9, 1.8, 0.9), sk(18.4, 2.1, 1.75, 1.0), sk(19.7, 2.3, 1.7, 1.0), sk(20.5, 1.5, 1.2, 1.0), sk(20.7, 0.02, 0.02, 1.0)],
    16, X_AXIS, [0, 2.2, SL, sd()], { bone: SKULL, hull: 0.5, circ: 24, axis: Y_AXIS });
  for (const sx of [-1, 1]) {
    blob(B, SKULL, V(sx * 3.45, 6.0 * v.skull, -0.7), [1.25, 2.3, 2.0], [2, 0, 0, 0], { nseg: 10, nring: 6, hull: 0, axis: Y_AXIS, side: X_AXIS });      // eye socket
    blob(B, SKULL, V(sx * 1.25, 17.4 * v.skull, -0.35), [0.75, 1.7, 0.9], [2, 0, 0, 0], { nseg: 8, nring: 5, hull: 0, axis: Y_AXIS });                    // nostril
    bar(B, SKULL, [V(sx * 4.3, 3.2 * v.skull, 1.4), V(sx * 4.6, 6.8 * v.skull, 2.3), V(sx * 3.4, 9.6 * v.skull, 2.5)], 0.9, 0.7, Z_AXIS, [3, 0, 0, sd()], { nseg: 6, hull: 0.4, sub: 6, taper0: 0.8, taper1: 0.7 }); // cheek arch
    for (let i = 0; i < 9; i++) {                                                                                                                         // upper teeth
      const y = (i < 6 ? 9.4 + i * 1.08 : 18.5 + (i - 6) * 0.72) * v.skull, x = i < 6 ? 2.6 - i * 0.12 : 2.0 - (i - 6) * 0.75;
      blob(B, SKULL, V(sx * x, y, 3.2 + (i > 5 ? -0.5 : 0) + (y > 13 ? -0.3 : 0)), [0.5, 0.95, 0.5], [3, 0, 0, sd()], { nseg: 6, nring: 4, hull: 0.26, axis: Z_AXIS, side: X_AXIS });
    }
  }
  await Y();
  // ---- jaw (local y joint -> chin, +z down)
  const JL = 14.6 * v.skull;
  for (const sx of [-1, 1]) {
    bar(B, JAW, [V(sx * 3.7, -1.2, -3.4), V(sx * 4.0, 0.2, 0.2), V(sx * 3.6, 2.4, 2.2), V(sx * 2.7, 0.5 * JL, 1.5), V(sx * 1.5, 0.88 * JL, 0.9), V(sx * 0.5, JL, 0.6)],
      1.75, 0.8, Z_AXIS, [4, 1.1, 0, sd()], { nseg: 8, hull: 0.5, taper0: 0.75, taper1: 0.6, sub: 14, knob: 0.3 });
    for (let i = 0; i < 9; i++) {
      const y = (i < 6 ? 4.0 + i * 1.08 : 13.0 + (i - 6) * 0.72) * v.skull, x = i < 6 ? 2.6 - i * 0.12 : 2.0 - (i - 6) * 0.75;
      blob(B, JAW, V(sx * x, y, -0.9 + (i > 5 ? 0.3 : 0)), [0.5, 0.9, 0.5], [3, 0, 0, sd()], { nseg: 6, nring: 4, hull: 0.26, axis: Z_AXIS, side: X_AXIS });
    }
  }
}

async function buildLimbGeometry(B, rng, v, Y) {
  const sd = () => rng();
  // ---- scapulae (bone y from the withers end down to the shoulder joint)
  for (let s = 0; s < 2; s++) {
    bar(B, SCAP + s, [V(0, -0.8, 0), V(0, 4, 0.5), V(0, 9, 0.4), V(0, 13.4, 0)], 3.0, 0.8, Z_AXIS, [4, 1.5, 0, sd()], { nseg: 10, hull: 0.5, taper0: 0.95, taper1: 0.42, sub: 10, knob: 0.0 });
  }
  // ---- four legs: upper, lower, cannon, pastern + hoof
  for (let l = 0; l < 4; l++) {
    await Y();
    const D = l < 2 ? SH : HI, b = LEG + l * 4;
    longBone(B, b, D.U, 1.75 * v.bone, 2.6 * v.bone, sd(), { bw: 2.7, nseg: 18, bend: l < 2 ? 0.5 : -0.6 });
    longBone(B, b + 1, D.W, 1.5 * v.bone, 2.35 * v.bone, sd(), { bw: 2.7, nseg: 18, k1: 0.92 });
    longBone(B, b + 2, D.C, 1.3 * v.bone, 2.05 * v.bone, sd(), { bw: 2.7, nseg: 18, k0: 1.05 });
    longBone(B, b + 3, 2.7, 1.1 * v.bone, 1.6 * v.bone, sd(), { bw: 1.2, nseg: 14, hull: 0.45 });
    // the hoof: solid ink cut with the comb, 7 m across at the ground (local +y = down the leg, -z = toe)
    const hs = (y, r, oz) => { const s = st(0, y, oz, r, r * 1.08); s.v = y; return s; };
    loft(B, [hs(2.0, 0.02, 0), hs(2.05, 1.5, -0.1), hs(2.5, 2.15, -0.2), hs(3.6, 2.75, -0.45), hs(D.H - 0.25, 3.4, -0.75), hs(D.H, 3.5, -0.8), hs(D.H + 0.02, 3.2, -0.8), hs(D.H + 0.03, 0.02, -0.8)],
      20, X_AXIS, [1, 1.25, 2.6, sd()], { bone: b + 3, hull: 0.4, circ: 20, axis: Y_AXIS });
  }
  await Y();
  // ---- tail: eight links that lash
  for (let i = 0; i < TAIL_N; i++) {
    const k = 1 - i / TAIL_N * 0.62;
    longBone(B, TAIL + i, TAIL_L, 0.95 * k, 1.45 * k, sd(), { bw: 0.9, nseg: 8, hull: 0.42 });
  }
}

async function buildRiderGeometry(B, rng, v, Y) {
  const sd = () => rng();
  // pelvis
  blob(B, RPEL, V(0, 0.6, 0), [3.6, 1.7, 2.3], [3, 0, 0, sd()], { nseg: 10, nring: 6, hull: 0.45, lump: 0.06 });
  // chest: spine knots, an inked cage with ten paper ribs, collar bar, neck
  for (let i = 0; i < 4; i++) blob(B, RCHEST, V(0, 1.2 + i * 1.5, -0.2), [1.0, 0.85, 1.0], [3, 0, 0, sd()], { nseg: 8, nring: 4, hull: 0.4 });
  blob(B, RCHEST, V(0, 10.2, 0), [3.7, 3.9, 2.9], [1, 1.1, 4.2, sd()], { nseg: 14, nring: 8, hull: 0, circ: 22 });
  for (let i = 0; i < 5; i++) {
    const y = 12.4 - i * 1.25, k = Math.sin(Math.acos(Math.max(-1, Math.min(1, (y - 10.2) / 4.05))));
    for (const sx of [-1, 1]) {
      const pts = [];
      for (let j = 0; j <= 5; j++) { const ph = (12 + j * 29) * Math.PI / 180; pts.push(V(sx * (3.7 * k + 0.45) * Math.sin(ph), y - j * 0.16, -(2.9 * k + 0.45) * Math.cos(ph))); }
      bar(B, RCHEST, pts, 0.36, 0.3, Y_AXIS, [3, 0, 0, sd()], { nseg: 6, hull: 0.3, sub: 9, taper0: 0.9, taper1: 0.7 });
    }
  }
  bar(B, RCHEST, [V(-5.0, 13.6, 0), V(-2.5, 14.3, 0.5), V(2.5, 14.3, 0.5), V(5.0, 13.6, 0)], 0.6, 0.55, Y_AXIS, [3, 0, 0, sd()], { nseg: 6, hull: 0.36, sub: 8, taper0: 0.9, taper1: 0.9, knob: 0.9 });
  for (let i = 0; i < 2; i++) blob(B, RCHEST, V(0, 15.2 + i * 1.3, 0), [0.9, 0.8, 0.9], [3, 0, 0, sd()], { nseg: 8, nring: 4, hull: 0.36 });
  await Y();
  // skull: the one stamped type (round cranium, two black sockets, a nose notch, two rows of teeth); front = +z
  const cr = (y, r, oz, rz) => { const s = st(0, y, oz, r, rz ?? r * 1.08); s.v = y; return s; };
  loft(B, [cr(-0.6, 0.02, 0.5), cr(-0.5, 1.6, 0.5), cr(0.1, 2.3, 0.6), cr(1.0, 2.75, 0.5), cr(2.4, 3.35, 0.1), cr(3.8, 3.55, 0), cr(5.0, 3.3, 0), cr(6.0, 2.5, 0), cr(6.6, 1.3, 0), cr(6.8, 0.02, 0)],
    14, X_AXIS, [3, 0, 0, sd()], { bone: RSKULL, hull: 0.42, circ: 22, axis: Y_AXIS });
  for (const sx of [-1, 1]) blob(B, RSKULL, V(sx * 1.75, 3.1, 2.8), [1.3, 1.25, 1.05], [2, 0, 0, 0], { nseg: 10, nring: 5, hull: 0, axis: Y_AXIS });
  blob(B, RSKULL, V(0, 1.55, 3.3), [0.5, 0.75, 0.6], [2, 0, 0, 0], { nseg: 8, nring: 4, hull: 0 });
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.26; blob(B, RSKULL, V(Math.sin(a) * 2.75, -0.55, 0.5 + Math.cos(a) * 2.7), [0.36, 0.62, 0.36], [3, 0, 0, sd()], { nseg: 6, nring: 4, hull: 0.2 }); }
  // jaw: dropped open, a U bar with the lower teeth (bone origin at the jaw hinge, y down the chin)
  bar(B, RJAW, [V(-2.9, 0, 0), V(-2.5, 0.6, 2.3), V(-1.3, 0.9, 3.7), V(1.3, 0.9, 3.7), V(2.5, 0.6, 2.3), V(2.9, 0, 0)], 0.75, 0.5, Y_AXIS, [3, 0, 0, sd()], { nseg: 8, hull: 0.36, sub: 12, taper0: 0.9, taper1: 0.9, knob: 0.5 });
  for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.26; blob(B, RJAW, V(Math.sin(a) * 2.6, -0.1, 1.2 + Math.cos(a) * 2.5), [0.34, 0.6, 0.34], [3, 0, 0, sd()], { nseg: 6, nring: 4, hull: 0.2 }); }
  await Y();
  // the charro sombrero, 16 m wide: solid ink cut with radial comb bundles, a paper band and a paper rim
  const W = 8 * v.brim, CH = 8.6 * v.crown, hp = (y, r) => { const s = st(0, y, 0, r, r); return s; };
  const prof = [hp(-0.25, 0.02), hp(-0.3, 0.55 * W), hp(0.1, 0.84 * W), hp(1.0 * v.curl, 0.97 * W), hp(1.7 * v.curl, W), hp(2.0 * v.curl, 0.97 * W), hp(1.5 * v.curl, 0.9 * W), hp(0.6, 0.72 * W), hp(0.25, 0.5 * W), hp(0.3, 3.3)];
  let vv = 0; for (let i = 0; i < prof.length; i++) { if (i) vv += Math.hypot(prof[i].p.y - prof[i - 1].p.y, prof[i].rx - prof[i - 1].rx); prof[i].v = vv; }
  loft(B, prof, 28, X_AXIS, [1, 1.75, 4.4, sd()], { bone: RHAT, hull: 0.45, circ: 49, axis: Y_AXIS });
  const cp = [hp(0.2, 3.2), hp(1.7, 3.15), hp(1.75, 2.95), hp(0.45 * CH, 2.5), hp(0.75 * CH, 2.0), hp(0.93 * CH, 1.3), hp(CH, 0.5), hp(CH + 0.05, 0.02)];
  vv = 0; for (let i = 0; i < cp.length; i++) { if (i) vv += Math.hypot(cp[i].p.y - cp[i - 1].p.y, cp[i].rx - cp[i - 1].rx); cp[i].v = vv; }
  loft(B, cp.slice(2), 18, X_AXIS, [1, 1.1, 3.4, sd()], { bone: RHAT, hull: 0.45, circ: 17.6, axis: Y_AXIS });
  loft(B, [hp(0.25, 3.3), hp(0.3, 3.55), hp(1.6, 3.5), hp(1.75, 3.2), hp(1.8, 2.9)], 18, X_AXIS, [3, 0, 0, sd() + 4], { bone: RHAT, hull: 0.3, circ: 20, axis: Y_AXIS });   // hat band: the second printing (vermilion, a little off register)
  // arms and legs
  for (let s = 0; s < 2; s++) {
    await Y();
    longBone(B, RARM + s * 3, 7.6, 0.62, 1.0, sd(), { bw: 0.95, nseg: 8, hull: 0.36 });
    longBone(B, RARM + s * 3 + 1, 7.2, 0.55, 0.92, sd(), { bw: 0.9, nseg: 8, hull: 0.36 });
    blob(B, RARM + s * 3 + 2, V(0, 1.0, 0), [1.0, 1.2, 0.6], [3, 0, 0, sd()], { nseg: 8, nring: 4, hull: 0.32 });
    for (let f = 0; f < 4; f++) { const a = (f - 1.5) * 0.36; bar(B, RARM + s * 3 + 2, [V(Math.sin(a) * 0.8, 1.6, 0), V(Math.sin(a) * 1.7, 3.0, 0.1), V(Math.sin(a) * 2.2, 4.3, 0.5)], 0.3, 0.28, Z_AXIS, [3, 0, 0, sd()], { nseg: 5, hull: 0.24, sub: 4, taper0: 1, taper1: 0.7, knob: 0.5 }); }
    longBone(B, RLEG + s * 3, 9.6, 0.8, 1.3, sd(), { bw: 1.1, nseg: 8, hull: 0.38 });
    longBone(B, RLEG + s * 3 + 1, 9.2, 0.68, 1.15, sd(), { bw: 1.0, nseg: 8, hull: 0.38 });
    bar(B, RLEG + s * 3 + 2, [V(0, -0.6, 0.8), V(0, 0.5, -0.4), V(0, 0.9, -2.6), V(0, 0.8, -4.4)], 0.95, 0.6, X_AXIS, [3, 0, 0, sd()], { nseg: 6, hull: 0.34, sub: 6, taper0: 0.9, taper1: 0.6, knob: 0.4 });
  }
}

// Dust puffs (paper curls in a black contour, cut by black comb bundles) and the dashes under each hoof.
async function buildPuffGeometry(B, rng, detail, Y) {
  for (let h = 0; h < 4; h++) {
    await Y();
    const n = detail < 0.75 ? 6 : 7;
    for (let i = 0; i < n; i++) {
      // a heap of curls: a wide bottom row, a middle row, a top knot (about 16 m wide, 12 m tall)
      const row = i < 3 ? 0 : i < 5 ? 1 : i < 6 || n < 7 ? 2 : 3, k = row === 0 ? (i - 1) * 0.72 : row === 1 ? (i - 3.5) * 0.9 : row === 2 ? 0.25 : -0.2;
      const r = (row === 0 ? 3.5 : row === 1 ? 3.2 : row === 2 ? 2.8 : 2.2) * (0.85 + rng() * 0.3);
      const c = V(k * 5.4 + (rng() - 0.5) * 1.2, row === 0 ? r * 0.8 : row === 1 ? 5.6 + rng() : row === 2 ? 9.6 : 12.6, (rng() - 0.5) * 3.2 + (row === 0 ? (i % 2 ? 1.6 : -1.6) : 0));
      blob(B, PUFF + h, c, [r, r * 0.8, r * 0.95], [5, 2.3, 5.2 + rng() * 2.4, rng()], { nseg: 12, nring: 7, hull: 0.42, lump: 0.07, axis: V(k * 0.7 + (rng() - 0.5) * 0.8, 1, (rng() - 0.5) * 0.8), side: V(1, 0, 0.4), circ: 6.0 * r });
    }
    for (let i = 0; i < 6; i++) {
      const x = (rng() - 0.5) * 11, z = (rng() - 0.5) * 6.5, len = 2.2 + rng() * 3.6;
      bar(B, DASH + h, [V(x - len / 2, 0.12, z), V(x + len / 2, 0.12, z + (rng() - 0.5) * 0.3)], 0.2, 0.11, Y_AXIS, [2, 0, 0, 0], { nseg: 4, hull: 0, sub: 2, taper0: 0.5, taper1: 0.5 });
    }
  }
}

// ---------------------------------------------------------------------------------------------
// THE GALLOP: every bone posed on the CPU from one stride phase (0..1), written into two vec4 arrays.
// ---------------------------------------------------------------------------------------------
const STANCE = 0.26, REACH = 12.5, RS = 1.45, HS = 1.5, SPINE = 68;
const BC = 13, BRX = 10.4, BRZ = 12.6;       // barrel: depth of its centre under the spine, half width, half height
export const STRIDE_LENGTH = 2 * REACH / STANCE;     // metres the horse must travel per stride for planted hooves (about 96)
const LEG_PHASE = [0.40, 0.50, 0.0, 0.12];           // fore left, fore right, hind left, hind right (transverse gallop)
const TAU = Math.PI * 2;

function makePoser(Q, P, v) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), qT = new THREE.Quaternion(), qL = new THREE.Quaternion(), qR = new THREE.Quaternion(), qS = new THREE.Quaternion(), qX = new THREE.Quaternion();
  const x = V(0, 0, 0), y = V(0, 0, 0), z = V(0, 0, 0), a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0), d = V(0, 0, 0), e = V(0, 0, 0), T = V(0, 0, 0), L = V(0, 0, 0), J = V(0, 0, 0), G = V(0, 0, 0), F = V(0, 0, 0), K = V(0, 0, 0), E = V(0, 0, 0), side = V(1, 0, 0);
  const eu = new THREE.Euler();
  const setQ = (i, quat, pos, s = 1) => { Q[i].set(quat.x, quat.y, quat.z, quat.w); P[i].set(pos.x, pos.y, pos.z, s); };
  // bone i runs from A toward Bp; its lobes (local x) follow `sd`
  const aim = (i, A, Bp, sd = side, s = 1) => {
    y.subVectors(Bp, A); if (y.lengthSq() < 1e-8) y.set(0, 1, 0); y.normalize();
    x.copy(sd).addScaledVector(y, -y.dot(sd)); if (x.lengthSq() < 1e-8) x.set(0, 0, 1); x.normalize();
    z.crossVectors(x, y); m.makeBasis(x, y, z); q.setFromRotationMatrix(m); setQ(i, q, A, s);
  };
  const sm = (t) => t * t * (3 - 2 * t), cl = (t) => Math.min(1, Math.max(0, t));
  const state = { puffSide: 1.12, puffScale: 1, puffYaw: 0, hatTilt: -0.1, hoof: [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)], psi: [0, 0, 0, 0], T: V(0, SPINE, 0), hat: V(0, 104, 0), skull: V(0, 85, 40) };

  function pose(strides, time, leap, groundK, leapPitch, reach = 1) {
    const RCH = REACH * reach;                       // a collected, prancing stride covers less ground: the hooves still plant
    const ph = strides - Math.floor(strides), w = TAU * ph;
    // body: rocks nose-down as the fore legs take the weight, rises in the suspension
    const pitch = 0.085 * Math.sin(w - 1.9) * (1 - leap) - leap * leapPitch;
    const bob = 1.7 * Math.sin(w - 4.2) - 0.6;
    T.set(0, SPINE + bob, 0);
    qT.setFromEuler(eu.set(pitch, 0, 0));
    setQ(THX, qT, T); state.T.copy(T);
    const tl = (out, lx, ly, lz) => out.set(lx, ly, lz).applyQuaternion(qT).add(T);       // thorax-local to horse space
    // lumbar + pelvis: the back flexes, tucking the quarters under in the suspension
    const flex = -0.10 * Math.sin(w - 0.6) - 0.05;
    qL.setFromEuler(eu.set(pitch + flex, 0, 0)); tl(L, 0, 0, -20); setQ(LUM, qL, L);
    const ll = (out, lx, ly, lz) => out.set(lx, ly, lz).applyQuaternion(qL).add(L);
    // legs
    for (let l = 0; l < 4; l++) {
      const fore = l < 2, sx = l % 2 ? 1 : -1, D = fore ? SH : HI, bi = LEG + l * 4;
      if (fore) tl(J, sx * 10.6, -21, 19); else ll(J, sx * 9.6, -16, -2);
      let psi = ph - LEG_PHASE[l]; psi -= Math.floor(psi); state.psi[l] = psi;
      const z0 = fore ? 21 : -25;
      let gz, gy, fold;
      if (psi < STANCE) { const s = psi / STANCE; gz = z0 + RCH * (1 - 2 * s); gy = 0; fold = 0; }
      else { const s = (psi - STANCE) / (1 - STANCE); gz = z0 - RCH * Math.cos(Math.PI * sm(s)); fold = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), 0.8); gy = (fore ? 15 : 11) * fold; }
      if (leap > 0) { const lf = fore ? 0.9 : 0.25, tz = fore ? z0 + 4 : z0 - 22, ty = fore ? 20 : 9; gz += (tz - gz) * leap; gy += (ty - gy) * leap; fold += (lf - fold) * leap; }
      const gx = sx * 10;
      G.set(gx, gy, gz); state.hoof[l].copy(G);
      // hoof and cannon directions: planted and upright in stance, folded back in the swing
      const ah = -0.32 + fold * (fore ? 1.5 : 1.25), ac = fold * (fore ? 1.25 : 0.8) + (fore ? 0.0 : -0.12);
      F.set(gx, gy + Math.cos(ah) * D.H, gz + Math.sin(ah) * D.H);          // fetlock (hoof bone runs from here down to G)
      K.set(F.x, F.y + Math.cos(ac) * D.C, F.z + Math.sin(ac) * D.C * (fore ? 1 : 1));   // knee / hock
      K.x = sx * 10.2;
      // two-bone IK from the joint J to K; elbow bends back, stifle bends forward
      a.subVectors(K, J); let dist = a.length(); const mx = D.U + D.W - 0.05;
      if (dist > mx) { K.copy(J).addScaledVector(a, mx / dist); F.set(K.x, K.y - Math.cos(ac) * D.C, K.z - Math.sin(ac) * D.C); G.set(F.x, F.y - Math.cos(ah) * D.H, F.z - Math.sin(ah) * D.H); a.subVectors(K, J); dist = mx; state.hoof[l].copy(G); }
      a.multiplyScalar(1 / Math.max(dist, 1e-4));
      const ca = cl((D.U * D.U + dist * dist - D.W * D.W) / (2 * D.U * dist)), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
      b.set(0, 0, fore ? -1 : 1); b.addScaledVector(a, -a.dot(b)); if (b.lengthSq() < 1e-8) b.set(0, 0, 1); b.normalize();
      E.copy(J).addScaledVector(a, D.U * ca).addScaledVector(b, D.U * sa);
      aim(bi, J, E); aim(bi + 1, E, K); aim(bi + 2, K, F); aim(bi + 3, F, G);
      if (fore) { tl(c, sx * 8.9, -8.6, 14.4); aim(SCAP + (l % 2), c, J, Z_AXIS); }
      // the dashes under the hoof and the puff it throws
      const down = psi < STANCE && leap < 0.5 ? 1 : 0;
      d.set(gx, 0, gz); q.set(0, 0, 0, 1); setQ(DASH + l, q, d, down);
      const age = psi / 0.62, grow = age < 1 ? 1 - Math.pow(1 - Math.min(1, age / 0.3), 3) : 0, fade = age < 1 ? 1 - sm(cl((age - 0.55) / 0.45)) : 0;
      d.set(gx * state.puffSide, age * 3.5, z0 + RCH - 2 - psi * STRIDE_LENGTH * groundK);
      if (state.puffYaw !== 0) d.applyAxisAngle(Y_AXIS, -state.puffYaw);          // a heap stands where its hoof struck the street: the horse's own turn (puffYaw) does not carry it
      q.setFromEuler(eu.set(0, age * 0.9 * sx, 0)); setQ(PUFF + l, q, d, grow * fade * (1 - leap) * v.puff * state.puffScale);
    }
    // neck: beads reaching forward and carried to one side (so the rider shows over the withers from in front), nodding
    tl(a, 0, 1.2, 21.5);
    let ang = 1.2 + pitch - 0.09 * Math.sin(w - 1.2) + leap * 0.15, yaw = 0;
    const turn = -v.arm * (0.2 - 0.15 * leap + 0.015 * Math.sin(w - 2.0));      // in the leap the neck stretches out ahead
    for (let i = 0; i < NECK_N; i++) {
      ang -= 0.012 + 0.02 * Math.sin(w - 1.2 - i * 0.5); yaw += turn;
      b.set(Math.sin(yaw) * Math.sin(ang) * NECK_L, Math.cos(ang) * NECK_L, Math.cos(yaw) * Math.sin(ang) * NECK_L).add(a); aim(NECK + i, a, b); a.copy(b);
    }
    // skull hangs from the poll, the jaw swings open
    const sa2 = 2.12 + 0.10 * Math.sin(w - 2.4) + pitch - leap * 0.2; yaw += turn;
    side.set(Math.cos(yaw), 0, -Math.sin(yaw));
    b.set(Math.sin(yaw) * Math.sin(sa2), Math.cos(sa2), Math.cos(yaw) * Math.sin(sa2)); c.copy(a).addScaledVector(b, 20); aim(SKULL, a, c); state.skull.copy(a);
    qS.copy(q);
    const gape = 0.17 + 0.09 * Math.sin(w * 2 - 0.7) + 0.03 * Math.sin(time * 5.1);
    d.set(0, 5.3 * v.skull, 3.3).applyQuaternion(qS).add(a);
    e.set(Math.sin(yaw) * Math.sin(sa2 + gape), Math.cos(sa2 + gape), Math.cos(yaw) * Math.sin(sa2 + gape)).add(d); aim(JAW, d, e);
    side.set(1, 0, 0);
    // tail: lashes in a travelling wave, streaming behind
    ll(a, 0, 0.6, -15);
    for (let i = 0; i < TAIL_N; i++) {
      const el = 0.25 - i * 0.26 + (0.16 + i * 0.07) * Math.sin(w - i * 0.75 + 1.0) + pitch + flex, yw = 0.34 * Math.sin(time * 2.6 - i * 0.7) * (0.3 + i * 0.14);
      b.set(Math.sin(yw) * TAIL_L, Math.sin(el) * TAIL_L * Math.cos(yw), -Math.cos(el) * TAIL_L * Math.cos(yw)).add(a); aim(TAIL + i, a, b); a.copy(b);
    }
    // ---- the rider: bounces a beat behind the horse, one arm flung up (all of him scaled by RS, the hat by HS)
    const rb = 0.9 * Math.sin(w - 5.1), lean = -0.10 + 0.12 * Math.sin(w - 2.6) + pitch * 0.5;
    tl(a, 0, 9.5 + rb, -4); qR.setFromEuler(eu.set(lean, 0, -v.arm * (0.2 + 0.05 * Math.sin(w - 1.0)))); setQ(RPEL, qR, a, RS);
    const rl = (out, lx, ly, lz) => out.set(lx, ly, lz).multiplyScalar(RS).applyQuaternion(qR).add(a);
    rl(b, 0, 1.2, 0); setQ(RCHEST, qR, b, RS);
    const nod = 0.10 * Math.sin(w - 3.4);
    q.setFromEuler(eu.set(lean + nod + 0.12, 0.25 * Math.sin(time * 0.7) * v.arm, 0)); rl(c, 0, 18.6, 0.2); setQ(RSKULL, q, c, RS);
    qS.copy(q);
    d.set(0, (5.5 + 0.4 * Math.sin(w - 4.0)) * RS, -0.9 * RS).applyQuaternion(qS).add(c); q.multiply(qX.setFromEuler(eu.set(state.hatTilt, 0, 0.08 * v.arm)));   // the hat's tilt (see setHatTilt)
    setQ(RHAT, q, d, HS); state.hat.copy(d);
    d.set(0, -0.2 * RS, 0.7 * RS).applyQuaternion(qS).add(c); q.copy(qS).multiply(qX.setFromEuler(eu.set(0.42 + 0.14 * Math.sin(w * 2 + 0.4), 0, 0))); setQ(RJAW, q, d, RS);
    for (let s = 0; s < 2; s++) {
      const sx = s ? 1 : -1, up = sx * v.arm > 0;
      rl(d, sx * 5.0, 14.8, 0);
      if (up) {      // flung up and back, whirling a little
        const wv = time * 2.2, r1 = 0.5 + 0.22 * Math.sin(wv), r2 = 0.35 * Math.cos(wv);
        e.set(sx * Math.sin(r1) * 7.6, Math.cos(r1) * 7.6 * Math.cos(r2), -Math.sin(r2) * 7.6 - 1).multiplyScalar(RS).add(d); aim(RARM + s * 3, d, e, Z_AXIS, RS);
        c.set(sx * Math.sin(r1 * 0.2 - 0.35) * 7.2, 7.0, -Math.sin(r2 * 2.2) * 2.6 - 0.8).normalize().multiplyScalar(7.2 * RS).add(e); aim(RARM + s * 3 + 1, e, c, Z_AXIS, RS);
        b.subVectors(c, e).normalize().multiplyScalar(2).add(c); aim(RARM + s * 3 + 2, c, b, X_AXIS, RS);
      } else {       // forward to the reins
        e.set(sx * 1.6, -5.6 + rb * 0.3, 4.6).normalize().multiplyScalar(7.6 * RS).add(d); aim(RARM + s * 3, d, e, Z_AXIS, RS);
        c.set(-sx * 2.2, -0.6, 7.0).normalize().multiplyScalar(7.2 * RS).add(e); aim(RARM + s * 3 + 1, e, c, Z_AXIS, RS);
        b.set(0, -0.5, 2).add(c); aim(RARM + s * 3 + 2, c, b, X_AXIS, RS);
      }
      rl(d, sx * 2.9, 0.2, 0.4);
      e.set(sx * 5.9, -7.6, 1.6).normalize().multiplyScalar(9.6 * RS).add(d); aim(RLEG + s * 3, d, e, Z_AXIS, RS);
      const kick = 0.25 * Math.sin(w - 4.4 + s);
      c.set(sx * 0.9, -Math.cos(kick) * 9.1, -1.2 + Math.sin(kick) * 9.2).normalize().multiplyScalar(9.2 * RS).add(e); aim(RLEG + s * 3 + 1, e, c, Z_AXIS, RS);
      b.set(0, -1, 0.15).add(c); aim(RLEG + s * 3 + 2, c, b, X_AXIS, RS);
    }
  }
  return { pose, state };
}

// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('pedalling-bones-hero');
  const palette = opts.palette || PB_PALETTE, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const style = opts.style || makeStyleUniforms(palette);
  const worn = opts.impression ? opts.impression === 'worn' : rng.chance(0.4);
  style.uWear.value = worn ? rng.range(0.7, 1) : rng.range(0.05, 0.3);
  const v = {
    girth: rng.range(0.95, 1.05), depth: rng.range(0.97, 1.03), withers: rng.range(0.8, 1.25), skull: rng.range(0.94, 1.07), bone: rng.range(0.9, 1.12),
    brim: (opts.brim ?? rng.range(15.2, 16.8)) / 16, crown: rng.range(0.85, 1.25), curl: rng.range(0.7, 1.35), arm: opts.arm ?? rng.sign(), leapPitch: 0.34, puff: opts.puff ?? 1,
  };
  const paperIx = opts.paper ?? 2;
  style.uPaper.value.set(palette[paperIx] || palette[2]);

  const group = new THREE.Group(); group.name = 'pedalling-bones-hero';
  const B = makeBuilder();
  const Y = () => ctx.yield();
  await buildHorseGeometry(B, rng, v, Y);
  await buildLimbGeometry(B, rng, v, Y);
  await buildRiderGeometry(B, rng, v, Y);
  await buildPuffGeometry(B, rng, detail, Y); await Y();
  while (B.hullFrom.length) { appendHulls(B, 48); await Y(); }
  const geo = new THREE.BufferGeometry();                 // finishGeometry(B) in short steps
  for (const [name, arr, n] of [['position', B.pos, 3], ['normal', B.nor, 3], ['uv', B.uv, 2], ['aMark', B.mark, 4], ['aAux', B.aux, 2], ['aBone', B.bone, 1]]) {
    geo.setAttribute(name, new THREE.Float32BufferAttribute(arr, n)); await Y();
  }
  geo.setIndex(new THREE.Uint32BufferAttribute(B.idx, 1)); await Y();
  geo.boundingSphere = new THREE.Sphere(V(0, 50, 0), 140);
  const material = inkMaterial(style, { bones: NB });
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.name = 'bone-horse';
  group.add(mesh);
  const Q = material.uniforms.uBoneQ.value, P = material.uniforms.uBoneP.value;
  const poser = makePoser(Q, P, v);

  // the viewer's own sheet of paper (only in the set-piece viewer, or with opts.backdrop): the world supplies its own
  let backdrop = null;
  const inViewer = !opts.style;        // the set-piece viewer passes no shared style; the world always does
  if (opts.backdrop ?? inViewer) {
    backdrop = new THREE.Mesh(new THREE.SphereGeometry(2400, 24, 12), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: style,
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform vec3 uPaper; void main(){ gl_FragColor = vec4(uPaper, 1.); }' }));
    backdrop.renderOrder = -0.5; backdrop.frustumCulled = false; group.add(backdrop);
  }

  let strides = null, leap = 0, groundK = 1, leapPitch = v.leapPitch, reach = 1;
  // viewer-only aid (?pbcam=1): seats the orbiting viewer camera at the brief's own frames, chosen by orbit angle
  const dbg = !!opts.pbcam;            // viewer-only aid (opts.pbcam)
  const DBG = [[V(0, 1.6, 255), V(0, 30, 0), 0.45], [V(0, 3, 78), V(0, 40, 20), 0.56], [V(0, 34, 19), V(0, 47, -30), 0.3], [V(0, 20, -62), V(0, 2, -140), 0.2], [V(3, 9, -150), V(0, 50, 0), 0.9, 1], [V(70, 30, 100), V(0, 52, 5), 0.52], [V(150, 40, 10), V(0, 52, 5), 0.62]];
  const dM = new THREE.Matrix4(), dE = V(0, 0, 0);
  const dbgCam = (camera) => {
    dE.setFromMatrixPosition(camera.matrixWorld);
    let a = Math.atan2(dE.x, dE.z); if (a < -0.4) a += TAU;
    const k = Math.min(DBG.length - 1, Math.max(0, Math.floor((a + 0.3) / (Math.PI * 1.5) * DBG.length)));
    const d = DBG[k]; strides = d[2]; leap = d[3] || 0;
    dM.lookAt(d[0], d[1], Y_AXIS).setPosition(d[0]).invert();
    group.matrixAutoUpdate = false; group.matrix.copy(camera.matrixWorld).multiply(dM); group.matrixWorldNeedsUpdate = true;
  };
  const size = new THREE.Vector2(), camPos = V(0, 0, 0);
  poser.pose(0.45, 0, 0, 1, 0);

  const anchors = {
    // camera line under the horse, front to back (local: the horse faces +Z, so the camera travels toward -Z)
    flyThrough: [V(0, 1.6, 110), V(0, 1.6, 95), V(0, 34, 20), V(0, 34, -20), V(0, 1.8, -70), V(0, 1.8, -95)],
    underRibs: V(0, 34, 0), ribTipY: 42.4, hoofX: 10,
    viewpoints: { front: V(0, 1.6, 260), below: V(0, 34, 12), behind: V(0, 9, -150), look: V(0, 62, 0) },
    // seat of the 14 m ring while the horse leaps the gate (setLeap(1), object lifted so its origin is 23 m up)
    portalSeat: { position: V(0, -14, 12), facing: V(0, 0, -1) },
    hoofLand: [V(-10, 0, 33.5), V(10, 0, 33.5), V(-10, 0, -12.5), V(10, 0, -12.5)],   // where each hoof comes down (local)
    hoofPhase: LEG_PHASE.slice(),                                                   // stride phase at which it comes down
    strideLength: STRIDE_LENGTH, stanceFraction: STANCE,
    hoofPsi: poser.state.psi,   // live: each hoof's own phase (0..stanceFraction = on the ground)
    riderHat: poser.state.hat, horseSkull: poser.state.skull, hooves: poser.state.hoof,   // live Vector3s (local), refreshed every update
  };

  return {
    object: group, radius: 64, height: 126, center: V(0, 60, 0), anchors, ground: false, groundY: 0,
    style, material, mesh,
    // stride count as a function of the world's u (integer part = strides run, fraction = phase). Until first called the horse gallops on the clock (3.2 s).
    setGallop(s) { strides = s; },
    setProgress(u) { strides = u * 12.5; },
    setLeap(k, pitch) { leap = Math.min(1, Math.max(0, k)); if (pitch !== undefined) leapPitch = pitch; },
    setGroundSpeed(k) { groundK = k; },
    setPuffSide(k) { poser.state.puffSide = k; },
    setPuffScale(k) { poser.state.puffScale = k; },     // the heaps' size over opts.puff (1 unless set)
    setPuffHold(a) { poser.state.puffYaw = a; },         // the horse object's rotation.y, so that each heap keeps its place on the street (0: the heaps turn with the horse)
    setHatTilt(a) { poser.state.hatTilt = a; },                 // radians: + tips the brim down in front (crown shows from in front and below), - tips it back (crown shows from behind and below)               // where a dust heap stands: its centre at x = +-10 k (default 1.12)
    arm: v.arm,                                                 // which arm is flung up (+1: local +x); the horse's head is carried to the other side
    setReach(k) { reach = Math.min(1.3, Math.max(0, k)); },      // share of the full 96 m stride the horse really covers (set it with the speed you move the object at)
    setPaper(hex) { style.uPaper.value.set(hex); },
    update(dt, time, camera) {
      style.uTime.value = time;
      if (ctx.renderer) style.uResY.value = ctx.renderer.getDrawingBufferSize(size).y;
      poser.pose(strides === null ? time / 3.2 : strides, time, leap, groundK, leapPitch, reach);
      if (dbg && camera) dbgCam(camera);
      if (backdrop && camera) { camPos.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(camPos); backdrop.position.copy(camPos); }
    },
    dispose() {},
  };
}
