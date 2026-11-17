// FOUR-COLOUR LAUNCH: hero set piece "the row lifting off", and the print process the whole world is shaded with.
//
// WHAT IT IS  Twelve finned silver ships in two files on pads with lattice gantries. On the journey clock each one
//   lights in turn: a bare-paper burst star snaps open, the magenta plate jumps sideways and rings, the gantry arms
//   swing clear, pad-flappers burst off, the ship holds on a growing pile of scalloped smoke, then climbs on a column
//   of concentric bands (paper core, yellow sleeve, magenta dots swelling to solid orange-red, toothed black edge)
//   that pour downward; ships tilt, drift and dwindle, leaving a staircase of leaning columns.
// SIZE / SPACE  Origin: on the rail line at the middle of the row, y = 0 the causeway deck top, +Z the course,
//   port = +X, starboard = -X. Pads at x = +-38 (opts.side), z = -495..495 every 90 m (opts.spacing), the last one
//   starboard. `radius`/`center` are a VIEWING sphere near the far end; the real footprint is anchors.extent
//   (about 1050 x 140 m; columns rise for kilometres). It expects a deck at y 0 at least 60 m wide and open sky.
// COST  about 142k triangles, 9 draw calls, no lights, no textures (hero alone, detail 1); build about 200 ms.
// OPTS  palette (7 hexes: paper, cyan, magenta, yellow, black, orange-red, violet), detail 0.6..1 (smoke puffs),
//   style (a makeStyle() result to share), stage (default true: a stand-in sky, deck strip and desert for judging
//   alone; the world passes stage:false), fleet 'needle'|'teardrop'|'stacked' (seeded), misprint (seeded 8%: plate
//   jumps far at launch 8 and stays until launch 12), count, spacing, side, duration (41), firstIgnition (2.5),
//   ignitionEvery (3), slip (0.016 clip units = 0.8% of the picture width), ignitions (array: the world's own
//   timetable, ship by ship), longLens (how much larger than life a far ship is drawn; 1.1 in a world, 0 alone).
// PROGRESS  hero.setProgress(u) (journey u 0..1; ship k lights at firstIgnition + ignitionEvery*k seconds of
//   `duration`) or hero.setClock(seconds). If neither is ever called a demonstration loop runs on world time.
//   hero.shipPosition(k, v3) = where ship k is now (hero space, for pois); hero.shipAge(k) = seconds since it lit.
//   hero.shipTail(k, v3) = where its fins are (the head of its column). hero.setEscort(x, y, z, tilt) lets the world
//   fly the LAST ship itself (base of the hull, hero space; null hands it back): the world keeps ship twelve beside
//   the sled up the climb. opts.lastIgnition (s) lights the last ship off the regular beat; opts.pitchOver[k] (s after
//   release) is when ship k starts to lean down the row.
// FLIGHT  A slow heavy rise (4.5 m/s2 to 22 m/s) so that several ships are aloft in one frame, then each ship leans
//   down the row (+Z), fans a little outboard and flies away ahead of the sled, dwindling by distance, not by height.
//   Its column is its own wake: a banded tube from the fins back down the way it flew, standing on the pad for the
//   first nine seconds, then lifting off and trailing five seconds behind (uniforms uDrift, uFoot, uFootT).
// ANCHORS (hero space)  pads[] {position, side, height}; extent; rail (level sled line, 3 m over the deck);
//   flyThrough (ordered camera line: level down the middle, >= 20 m from every ship, then the climb beside the last
//   ship ending straight at 55 degrees); portalSeat {position, normal (facing back down the path), radius 7,
//   pitchDeg 55}; viewpoints {entry, staircase, beside, climb}; lastShip; ignition {first, every, duration}.
//
// HOW THE STYLE IS MADE (exports; shade the whole world with these so the hero is not pasted in)
//   exact colour: the world returns post.flat = 1 (no tone map), so every ink is its own hex, written as it stands.
//   POST                the post settings the style needs (bloom off, saturation and contrast 1).
//   makeStyle(palette)  -> { ink, factor, uniforms, paperMaterial(), hullMaterial(), dotMaterial(plate, under),
//                        plateMaterial(plate, under), plateBlend, tick(dt, time, camera, renderer) }
//     paperMaterial   unlit flat colour from the vertex `color` attribute (put style.ink.* values in it), spotted
//                     black by facing to uNoon (aMark.x), one black chrome squiggle (aMark.y).
//     hullMaterial    the same geometry as an inverted hull in key black (BackSide), width aMark.z metres, thick
//                     below, thin on top, wobbling, never under 1.5 px. Needs the aHullN attribute.
//     dotMaterial     instanced discs lying on their surface, radius = tone at the disc centre (+ swell under the
//                     moving shadows uShadow[8] and by flame light), multiply-blended after the opaque pass, magenta
//                     and cyan shifted in clip space by uReg (the plate slip); under ~3 px they become flat tint.
//                     `under` picks the multiply factor: magenta 'yellow' lands on the orange-red exactly.
//     plateMaterial   a whole mesh printed as a solid of one ink with the same blending and slip (fins, nose caps).
//   makeGeo() / makeDots()  builders that emit the attributes those materials need (lathe, beam, plate; add).
//   STYLE_GLSL, RIG_GLSL, SCREEN_GLSL  shared uniforms + noise + shadowAt(); the ship rig; screen() = a dot screen
//                     drawn in a fragment shader with fwidth filtering, for far ground and mesas.
//   buildSky(style, opts)  bare-paper dome, ~9000 cyan discs swelling to the zenith, two knocked-out moons.
//   uShadow slots 0-3 are written by the hero (its four newest smoke lakes, world space); 4-7 are the world's.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const DEFAULT_PALETTE = ['#EDE3C8', '#22A7DB', '#D9338A', '#F6D21C', '#16120E', '#E4562A', '#3F4EA3'];
export const MAX_SHIPS = 12;
/** the post settings this style expects from its world (spread into the world's `post`): no bloom, no grade */
export const POST = { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0, aberration: 0 } };

// ---------------------------------------------------------------- exact colour
// The world returns post.flat = 1: the engine skips its tone map, so the linear colour written IS the colour shown.
// A palette hex is therefore used as it stands (THREE.Color converts it to linear); no inverse, no pre-correction.
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hexLin = (h) => { const s = String(h).replace('#', ''); return [0, 2, 4].map((i) => s2l(parseInt(s.slice(i, i + 2), 16) / 255)); };

// ---------------------------------------------------------------- shared GLSL
// STYLE_GLSL: uniforms every material of the world shares + noise + the rig (how hero vertices move).
// aRig = (ship index or -1, kind): 0 static, 1 ship (lift, tilt, shiver), 2 gantry arm (swings about its mast),
// 3 burst star (scaled about its centre), 4 speed line (ship rig, stretched by speed), 5 pad shadow (shrinks with lift).
export const STYLE_GLSL = /* glsl */`
  uniform float uTime, uPx;            // seconds; world metres per pixel at 1 m distance
  uniform vec2 uReg;                   // plate registration: clip-space x offset of the magenta and of the cyan plate
  uniform vec3 uNoon;                  // unit vector toward the (never drawn) sun
  uniform vec3 uK, uPaperC;            // key black and bare paper, as scene values
  uniform vec4 uShip[${MAX_SHIPS}];    // lift (m), tilt about x, tilt about z, gantry arm angle
  uniform vec4 uShipB[${MAX_SHIPS}];   // burst star scale, flame light 0..1, shiver 0..1, speed 0..1
  uniform vec4 uPad[${MAX_SHIPS}];     // pad centre xyz (hero space), w = signed x offset of the gantry mast
  uniform vec4 uDrift[${MAX_SHIPS}];   // how far the ship has flown from over its pad: x, z (m); w = long-lens gain (ship drawn 1 + w times its size when far)
  uniform vec4 uShadow[8];             // moving blob shadows: xz centre, radius, strength (world space)
  float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
  float h21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
  float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
  float tri(float x){ return abs(fract(x) - 0.5)*2.; }
  mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
  // the brush wobble of a hull line, from where the vertex is on the object
  float wobble(vec3 p){ return 0.72 + 0.56*vn2(vec2(p.x + p.z*0.7, p.y)*0.21 + 3.1) ; }
  // darkening of tone under the moving shadows, 0..1, at a world position (dots swell with it)
  float shadowAt(vec3 w){ float s = 0.;
    for (int i = 0; i < 8; i++){ vec4 b = uShadow[i]; float d = length(w.xz - b.xy)/max(b.z, 1e-3); s = max(s, b.w*(1. - smoothstep(0.55, 1.05, d))); }
    return s; }
`;
export const RIG_GLSL = /* glsl */`
  attribute vec2 aRig;
  // moves a hero-space point p and a direction n by the rig; returns the moved point
  // gZoom: the comic's long lens. A ship far down the row is drawn larger than life (about its own pad, the whole
  // ship, gantry and star together), easing to true size as the sled comes within 320 m, so the row reads from the entry.
  float gZoom = 1.;
  vec3 rig(vec3 p, inout vec3 n){
    if (aRig.x < -0.5) return p;
    int i = int(aRig.x + 0.5); vec4 s = uShip[i], b = uShipB[i], pad = uPad[i];
    float Z = 1. + uDrift[i].w; gZoom = Z;
    if (aRig.y < 0.5) return pad.xyz + (p - pad.xyz)*Z;
    if (aRig.y < 1.5 || (aRig.y > 3.5 && aRig.y < 4.5)){
      vec3 c = pad.xyz + vec3(0., 40., 0.), q = p - c;
      if (aRig.y > 3.5) q.y = -41. + (q.y + 41.)*b.w;                         // speed lines grow out of the tail
      mat2 rx = rot2(s.y), rz = rot2(s.z);
      q.yz = rx*q.yz; n.yz = rx*n.yz; q.xy = rz*q.xy; n.xy = rz*n.xy;
      float sh = b.z*0.22; q.x += sh*sin(uTime*31. + float(i)); q.z += sh*sin(uTime*27. + 1.7);
      return c + q*Z + vec3(uDrift[i].x, s.x + 40.*(Z - 1.), uDrift[i].y);                    // lift, and the flight down the row that leans the column
    }
    if (aRig.y < 2.5){ vec3 c = pad.xyz + vec3(pad.w, 0., 0.), q = p - c; mat2 r = rot2(s.w); q.xz = r*q.xz; n.xz = r*n.xz; return pad.xyz + (c - pad.xyz + q)*Z; }
    if (aRig.y < 3.5){ vec3 c = pad.xyz + vec3(0., 7., 0.); return pad.xyz + (c - pad.xyz + (p - c)*b.x)*Z; }
    vec3 c = pad.xyz; float k = 1./(1. + s.x*0.03); return c + ((p - c)*vec3(k, 1., k) + vec3(-s.x*0.25, 0., s.x*0.35)*k)*vec3(Z, 1., Z);
  }
`;

// ---------------------------------------------------------------- the style: inks, plates, materials
/**
 * makeStyle(palette, opts) -> the whole print process, to shade a world with:
 *   .uniforms        shared uniform objects (spread into your own ShaderMaterials together with STYLE_GLSL)
 *   .ink.{paper,cyan,magenta,yellow,black,orange,violet,green}   THREE.Color scene values that land on the hexes
 *   .factor.{yellow,cyan,magenta,magentaOnYellow,cyanOnYellow}   multiply factors of each plate (see dotMaterial)
 *   .paperMaterial(), .hullMaterial(), .dotMaterial(plate, under), .plateMaterial(plate, under)
 *   .tick(dt, time, camera, renderer)   call every frame if you use the style without the hero
 */
export function makeStyle(palette = DEFAULT_PALETTE, opts = {}) {
  const pal = DEFAULT_PALETTE.map((d, i) => (palette && palette[i]) || d);
  const sc = (h) => new THREE.Color(h);
  const ink = { paper: sc(pal[0]), cyan: sc(pal[1]), magenta: sc(pal[2]), yellow: sc(pal[3]), black: sc(pal[4]), orange: sc(pal[5]), violet: sc(pal[6]) };
  // green exists only as cyan over yellow: the display-space product of the two inks on this paper
  const dl = pal.map(hexLin), gD = [0, 1, 2].map((i) => dl[1][i] * dl[3][i] / Math.max(dl[0][i], 1e-3));
  ink.green = new THREE.Color().setRGB(gD[0], gD[1], gD[2], THREE.LinearSRGBColorSpace);
  // A plate is drawn with multiply blending: frame = frame * factor. factor = ink / what lies under it, so one ink on
  // bare paper lands exactly on its hex, and magenta laid over yellow lands exactly on the orange-red.
  const div = (a, b, fb) => new THREE.Vector3(...['r', 'g', 'b'].map((k) => (b[k] > 0.02 ? Math.min(a[k] / b[k], 4) : fb ? fb[k] : 1)));
  const fM = div(ink.magenta, ink.paper), fMv = { r: fM.x, g: fM.y, b: fM.z };
  const fC = div(ink.cyan, ink.paper), fCv = { r: fC.x, g: fC.y, b: fC.z };
  const factor = { yellow: div(ink.yellow, ink.paper), cyan: fC, magenta: fM,
    magentaOnYellow: div(ink.orange, ink.yellow, fMv), cyanOnYellow: div(ink.green, ink.yellow, fCv) };
  const V4 = (n) => Array.from({ length: n }, () => new THREE.Vector4());
  const uniforms = {
    uTime: { value: 0 }, uPx: { value: 0.002 }, uReg: { value: new THREE.Vector2(0.0012, -0.0003) },
    uNoon: { value: new THREE.Vector3(0.42, 0.86, -0.29).normalize() },
    uK: { value: ink.black }, uPaperC: { value: ink.paper },
    uShip: { value: V4(MAX_SHIPS) }, uShipB: { value: V4(MAX_SHIPS) }, uPad: { value: V4(MAX_SHIPS) }, uDrift: { value: V4(MAX_SHIPS) }, uShadow: { value: V4(8) },
  };
  const mats = [];
  const keep = (m) => { mats.push(m); return m; };

  // (1) PAPER: flat colour from the vertex colour attribute (already a scene value), spotted black where aMark.x asks
  // for it and the surface turns from noon, and one black chrome squiggle where aMark.y asks.
  const paperMaterial = (o = {}) => keep(new THREE.ShaderMaterial({
    uniforms: { ...uniforms }, side: o.side ?? THREE.FrontSide,
    vertexShader: /* glsl */`
      ${STYLE_GLSL} ${RIG_GLSL}
      attribute vec3 color; attribute vec3 aMark;
      varying vec3 vCol, vN, vP, vVN; varying vec2 vMark; varying float vFine;
      void main(){ vec3 n = normal; vec3 p = rig(position, n); vP = position; vCol = color; vMark = aMark.xy;
        vN = mat3(modelMatrix)*n; vVN = normalMatrix*n;
        // fine bracing (aMark.z < 0) loses its spotted black with its outline once a bay is under a few pixels: a far
        // gantry is bare paper with a few strokes (arms, mast head), so the ships beside it stand clear
        vec4 wp = modelMatrix*vec4(p, 1.);
        vFine = aMark.z < 0. ? smoothstep(4., 7., 6./max(uPx*length(cameraPosition - wp.xyz), 1e-5)) : 1.;
        gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vCol, vN, vP, vVN; varying vec2 vMark; varying float vFine;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); vec3 vn = normalize(vVN + vec3(0., 0., 1e-5));
        if (!gl_FrontFacing){ n = -n; vn = -vn; }
        // spotted black: a toothed, noise-feathered threshold on the facing to noon
        float teeth = (tri(dot(vP, vec3(0.37, 0.21, 0.29))) - 0.5)*0.26 + (vn2(vP.xy*0.33 + vP.z*0.19) - 0.5)*0.34;
        float e = dot(n, uNoon) + teeth; float thr = mix(-2.2, -0.08, vMark.x);
        float aa = fwidth(e)*0.75 + 1e-4; float k = (1. - smoothstep(thr - aa, thr + aa, e))*vFine;
        // chrome: one black squiggle riding the view-space normal, broken into dashes along the height
        float c = vn.x*0.92 + vn.y*0.2 + 0.05*sin(vP.y*0.41) + 0.03*sin(vP.y*1.37 + 1.);
        float w = 0.035 + 0.03*vn2(vec2(vP.y*0.11, 7.)); float ca = fwidth(c)*0.75 + 1e-4;
        float sq = (1. - smoothstep(w - ca, w + ca, abs(c + 0.6)))*smoothstep(0.38, 0.42, vn2(vec2(vP.y*0.045, 3.)));
        k = max(k, sq*vMark.y);
        gl_FragColor = vec4(mix(vCol, uK, k), 1.);
      }`,
  }));

  // (2) OUTLINE: the same geometry drawn as an inverted hull in key black. Width (aMark.z, metres) is thick below and in
  // shade, thin on top, wobbles along the object and never falls under 1.5 pixels.
  const hullMaterial = (o = {}) => keep(new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uWidth: { value: o.width ?? 1 } }, side: THREE.BackSide,
    vertexShader: /* glsl */`
      ${STYLE_GLSL} ${RIG_GLSL}
      uniform float uWidth; attribute vec3 aHullN; attribute vec3 aMark;
      void main(){ vec3 n = aHullN; vec3 p = rig(position, n);
        vec4 w = modelMatrix*vec4(p, 1.); vec3 wn = normalize(mat3(modelMatrix)*n + vec3(0., 1e-5, 0.));
        float shade = 0.5 - 0.5*dot(wn, uNoon); float dist = length(cameraPosition - w.xyz);
        float wd = abs(aMark.z)*uWidth*mix(0.5, 1.55, shade)*wobble(position);
        wd = abs(aMark.z) > 0. ? max(wd, 1.5*uPx*dist) : 0.;
        if (aMark.z < 0.) wd *= smoothstep(4., 7., 6./max(uPx*dist, 1e-5));       // fine bracing: dropped when a bay is under a few pixels
        w.xyz += wn*wd; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`uniform vec3 uK; void main(){ gl_FragColor = vec4(uK, 1.); }`,
  }));

  const plateBlend = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };
  const regW = { yellow: [0, 0], magenta: [1, 0], cyan: [0, 1] };
  const fac = (plate, under) => (plate === 'magenta' && under === 'yellow' ? factor.magentaOnYellow : plate === 'cyan' && under === 'yellow' ? factor.cyanOnYellow : factor[plate]);

  // (3) DOTS: instanced discs lying on their surface. Per instance: iPos, iNrm, iTone (base tone 0..1, lattice pitch in
  // metres, gain of the moving-shadow swell, gain of the flame-light swell) and aRig. Radius = tone at the dot centre.
  // Multiply-blended after the opaque pass, no depth write; magenta and cyan take the registration offset in clip space.
  // Where the lattice would fall under ~3 px the discs turn into touching squares of the flat average tint.
  const dotMaterial = (plate = 'cyan', under = 'paper', o = {}) => keep(new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uF: { value: fac(plate, under) }, uRegW: { value: new THREE.Vector2(...regW[plate]) }, uGain: { value: o.gain ?? 1 } },
    ...plateBlend, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: /* glsl */`
      ${STYLE_GLSL} ${RIG_GLSL}
      uniform vec2 uRegW; uniform float uGain;
      attribute vec3 iPos, iNrm; attribute vec4 iTone;
      varying vec2 vUv; varying vec2 vK;
      void main(){ vec3 n = iNrm; vec3 c = rig(iPos, n);
        vec4 w = modelMatrix*vec4(c, 1.); vec3 wn = normalize(mat3(modelMatrix)*n + vec3(0., 1e-5, 0.));
        float light = aRig.x > -0.5 ? uShipB[int(aRig.x + 0.5)].y : 0.;
        float tone = clamp((iTone.x + iTone.z*shadowAt(w.xyz) + iTone.w*light)*uGain, 0., 1.);
        vec3 toCam = cameraPosition - w.xyz; float dist = length(toCam);
        float pitch = iTone.y*gZoom; float px = pitch/max(uPx*dist, 1e-5); float f = smoothstep(2.6, 4.6, px);       // 1 = real discs, 0 = flat tint
        if (aRig.x > -0.5) tone *= mix(0.3, 1., f);                      // a far ship's screen drops out toward bare paper (distance is printed, not fogged)
        float r = pitch*sqrt(tone*0.3183)*1.02; float hs = mix(pitch*0.5, r*1.08, f);
        if (tone < 0.004 || dot(wn, toCam) < 0.) hs = 0.;
        vec3 t = normalize(cross(wn, abs(wn.y) > 0.9 ? vec3(1., 0., 0.) : vec3(0., 1., 0.))), b = cross(wn, t);
        w.xyz += (t*position.x + b*position.y)*hs + wn*(0.03 + dist*0.0006);
        vUv = position.xy*mix(1., 1.08, f); vK = vec2(f, mix(tone, 1., f));
        gl_Position = projectionMatrix*viewMatrix*w; gl_Position.x += dot(uReg, uRegW)*gl_Position.w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uF; varying vec2 vUv; varying vec2 vK;
      void main(){ float d = length(vUv); float aa = fwidth(d)*0.8 + 1e-4;
        float a = mix(1., 1. - smoothstep(1. - aa, 1. + aa, d), vK.x)*vK.y;
        if (a < 0.004) discard;
        gl_FragColor = vec4(mix(vec3(1.), uF, a), 1.); }`,
  }));

  // (4) SOLID PLATE: a mesh printed as a solid area of one ink over what is there (fins: magenta over yellow), with
  // the plate's registration offset. Same rig as paper.
  const plateMaterial = (plate = 'magenta', under = 'yellow') => keep(new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uF: { value: fac(plate, under) }, uRegW: { value: new THREE.Vector2(...regW[plate]) } },
    // (the slope factor must cover the plate's sideways slip in pixels, or a fin that slopes the wrong way loses its ink)
    // and only faces turned to the viewer print, so that slack never lets the far side of a fin print through as well)
    ...plateBlend, polygonOffset: true, polygonOffsetFactor: -12, polygonOffsetUnits: -4, side: THREE.FrontSide,
    vertexShader: /* glsl */`
      ${STYLE_GLSL} ${RIG_GLSL}
      uniform vec2 uRegW;
      void main(){ vec3 n = normal; vec3 p = rig(position, n);
        gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); gl_Position.x += dot(uReg, uRegW)*gl_Position.w; }`,
    fragmentShader: /* glsl */`uniform vec3 uF; void main(){ gl_FragColor = vec4(uF, 1.); }`,
  }));

  const _sz = new THREE.Vector2();
  const tick = (dt, time, camera, renderer) => {
    uniforms.uTime.value = time;
    if (renderer && camera) { renderer.getDrawingBufferSize(_sz); uniforms.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 1e-3) * Math.max(_sz.y, 1)); }
  };
  return { palette: pal, ink, factor, uniforms, plateBlend, paperMaterial, hullMaterial, dotMaterial, plateMaterial, tick, materials: mats };
}

// ---------------------------------------------------------------- geometry builder (paper + hull share one geometry)
// makeGeo() collects merged triangles with everything the paper and hull materials need:
// position, normal (flat shading side), aHullN (smooth direction the outline is pushed along), color (scene value),
// aRig (ship, kind) and aMark (spotted black 0..1, chrome squiggle 0..1, outline width in metres).
// Every add takes o = { m: Matrix4, col: THREE.Color, rig: [ship, kind], mark: [spot, chrome, width] }.
export function makeGeo() {
  const P = [], N = [], H = [], C = [], R = [], K = [], I = [];
  let n = 0; const v = new THREE.Vector3(), d = new THREE.Vector3(), e = new THREE.Vector3();
  const vert = (o, x, y, z, nx, ny, nz, hx, hy, hz, col, wk = 1) => {
    v.set(x, y, z); d.set(nx, ny, nz); e.set(hx, hy, hz);
    if (o.m) { v.applyMatrix4(o.m); d.transformDirection(o.m); e.transformDirection(o.m); }
    const c = col || o.col, r = o.rig || [-1, 0], k = o.mark || [0, 0, 0.25];
    P.push(v.x, v.y, v.z); N.push(d.x, d.y, d.z); H.push(e.x, e.y, e.z); C.push(c.r, c.g, c.b); R.push(r[0], r[1]); K.push(k[0], k[1], k[2] * wk);
    return n++;
  };
  const g = {
    get vertexCount() { return n; }, get triCount() { return I.length / 3; }, vert, tri: (a, b, c) => I.push(a, b, c),
    // surface of revolution about +Y. profile: [r, y, colour?, widthScale?] from bottom to top; repeat a point for a crease.
    lathe(profile, segs, o) {
      const m = profile.length, base = n;
      for (let i = 0; i < m; i++) {
        const a = profile[Math.max(0, i - 1)], b = profile[Math.min(m - 1, i + 1)], p = profile[i];
        let tr = b[0] - a[0], ty = b[1] - a[1];
        if (i > 0 && profile[i - 1][0] === p[0] && profile[i - 1][1] === p[1]) { tr = b[0] - p[0]; ty = b[1] - p[1]; }
        else if (i < m - 1 && profile[i + 1][0] === p[0] && profile[i + 1][1] === p[1]) { tr = p[0] - a[0]; ty = p[1] - a[1]; }
        const l = Math.hypot(tr, ty) || 1, nr = ty / l, ny = -tr / l;
        for (let s = 0; s <= segs; s++) { const t = (s / segs) * Math.PI * 2, cs = Math.cos(t), sn = Math.sin(t);
          vert(o, p[0] * cs, p[1], p[0] * sn, nr * cs, ny, nr * sn, nr * cs, ny, nr * sn, p[2], p[3] ?? 1); }
      }
      for (let i = 0; i < m - 1; i++) for (let s = 0; s < segs; s++) { const a = base + i * (segs + 1) + s, b = a + segs + 1;
        if (profile[i][0] > 1e-4) I.push(a, b, a + 1); if (profile[i + 1][0] > 1e-4) I.push(a + 1, b, b + 1); }
    },
    // a box beam from a to b (arrays), section w (across) by h, flat faces, hull pushed from the corners
    beam(a, b, w, h, o, up = [0, 1, 0]) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), z = B.clone().sub(A), len = z.length() || 1; z.multiplyScalar(1 / len);
      const upv = new THREE.Vector3(...up); if (Math.abs(z.dot(upv)) > 0.95) upv.set(1, 0, 0);
      const x = new THREE.Vector3().crossVectors(upv, z).normalize(), y = new THREE.Vector3().crossVectors(z, x);
      const corner = (sx, sy, sz) => A.clone().addScaledVector(z, sz > 0 ? len : 0).addScaledVector(x, sx * w * 0.5).addScaledVector(y, sy * h * 0.5);
      const faces = [[x, 1, 0, 0], [x, -1, 0, 0], [y, 0, 1, 0], [y, 0, -1, 0], [z, 0, 0, 1], [z, 0, 0, -1]];
      for (const [ax, fx, fy, fz] of faces) {
        const s = fx + fy + fz, nrm = ax.clone().multiplyScalar(s), q = [];
        const uv = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        for (const [u, t] of uv) { const sx = fx ? fx : u, sy = fy ? fy : (fx ? u : t), sz = fz ? fz : t;
          const c = corner(sx, sy, sz), hn = x.clone().multiplyScalar(sx).addScaledVector(y, sy).addScaledVector(z, sz * 0.5).normalize();
          q.push(vert(o, c.x, c.y, c.z, nrm.x, nrm.y, nrm.z, hn.x, hn.y, hn.z)); }
        const flip = (fx ? s : fy ? -s : s) < 0; if (flip) I.push(q[0], q[2], q[1], q[0], q[3], q[2]); else I.push(q[0], q[1], q[2], q[0], q[2], q[3]);
      }
    },
    // a knife-edged plate in the local XY plane (fins, arms, star points): outline [[x,y]..], thick at the ridge,
    // ridge = how far the flat middle is pulled in from the edge (0..1)
    plate(outline, thick, o, ridge = 0.35, colIn) {
      const m = outline.length; let cx = 0, cy = 0; for (const p of outline) { cx += p[0] / m; cy += p[1] / m; }
      let area = 0; for (let i = 0; i < m; i++) { const p = outline[i], q = outline[(i + 1) % m]; area += p[0] * q[1] - q[0] * p[1]; }
      const sg = area > 0 ? 1 : -1, tris = THREE.ShapeUtils.triangulateShape(outline.map((p) => new THREE.Vector2(p[0], p[1])), []);
      const edge = [];
      for (let i = 0; i < m; i++) { const a = outline[(i + m - 1) % m], b = outline[(i + 1) % m], p = outline[i];
        let ex = (b[1] - a[1]) * sg, ey = -(b[0] - a[0]) * sg; const l = Math.hypot(ex, ey) || 1; ex /= l; ey /= l;
        edge.push(vert(o, p[0], p[1], 0, ex, ey, 0, ex, ey, 0)); }
      for (const side of [1, -1]) {
        const inner = outline.map((p) => vert(o, lerp(p[0], cx, ridge), lerp(p[1], cy, ridge), side * thick * 0.5, 0, 0, side, 0, 0, side, colIn));
        for (const t of tris) { const A = outline[t[0]], B = outline[t[1]], Cc = outline[t[2]];
          const ccw = (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]) > 0;
          if (ccw === (side > 0)) I.push(inner[t[0]], inner[t[1]], inner[t[2]]); else I.push(inner[t[0]], inner[t[2]], inner[t[1]]); }
        for (let i = 0; i < m; i++) { const j = (i + 1) % m;
          if (side * sg > 0) I.push(edge[i], edge[j], inner[j], edge[i], inner[j], inner[i]); else I.push(edge[i], inner[j], edge[j], edge[i], inner[i], inner[j]); }
      }
    },
    build() {
      const geo = new THREE.BufferGeometry(), f = (a, s) => new THREE.BufferAttribute(new Float32Array(a), s);
      geo.setAttribute('position', f(P, 3)); geo.setAttribute('normal', f(N, 3)); geo.setAttribute('aHullN', f(H, 3));
      geo.setAttribute('color', f(C, 3)); geo.setAttribute('aRig', f(R, 2)); geo.setAttribute('aMark', f(K, 3));
      geo.setIndex(new THREE.BufferAttribute(new Uint32Array(I), 1)); geo.computeBoundingSphere();
      return geo;
    },
  };
  return g;
}

// makeDots() collects one plate's discs; build(material) returns the instanced mesh (one draw call).
// add(p, n, tone, pitch, shadowGain, flameGain, rig): p and n are THREE.Vector3 (hero space), tone 0..1 is the share
// of the lattice cell the disc covers, pitch is the lattice spacing in metres.
export function makeDots() {
  const P = [], N = [], T = [], R = [];
  return {
    get count() { return P.length / 3; },
    add(p, n, tone, pitch, shadowGain = 0, flameGain = 0, rig = [-1, 0]) { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); T.push(tone, pitch, shadowGain, flameGain); R.push(rig[0], rig[1]); },
    build(material, radius = 1e5) {
      const geo = new THREE.InstancedBufferGeometry(), f = (a, s) => new THREE.InstancedBufferAttribute(new Float32Array(a), s);
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.setAttribute('iPos', f(P, 3)); geo.setAttribute('iNrm', f(N, 3)); geo.setAttribute('iTone', f(T, 4)); geo.setAttribute('aRig', f(R, 2));
      geo.instanceCount = P.length / 3; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
      const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.renderOrder = 5;
      return mesh;
    },
  };
}

// ---------------------------------------------------------------- the ships
// Body radius at height y (0..1 of the hull) for the three fleets.
function hullRadius(fleet, t, R, v) {
  if (fleet === 'teardrop') { const a = Math.pow(Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), 0.62)), 0.8); return R * (0.3 + 1.05 * a) * (1 - 0.72 * smoothstep(0.55, 1, t)); }
  if (fleet === 'stacked') { let r = 0; const balls = [[0.13, 1.3], [0.36, 1.1], [0.56, 0.9], [0.72, 0.7], [0.85, 0.5], [0.94, 0.32]];
    for (const [c, k] of balls) { const h = (t - c) / (k * 0.1 * v.fat); if (Math.abs(h) < 1) r = Math.max(r, R * k * Math.sqrt(1 - h * h)); }
    return Math.max(r, R * 0.3 * (1 - t)); }
  const belly = Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), v.low)) ;                                       // needle
  return R * (0.6 + 0.4 * Math.pow(Math.max(belly, 0), 0.9)) * (1 - smoothstep(0.5, 1.0, t) * 0.93) * v.fat;
}
// One ship standing on pad `id` at (px, 0, pz); sgn = +1 starboard, -1 port. Adds paper/hull triangles to G, the
// magenta solid-plate copy of everything orange-red to GP, and its own dots to the plate collectors D.{y,m,c}.
function addShip(G, GP, D, style, id, px, pz, sgn, V, rng) {
  const ink = style.ink, H = V.height, R = V.radius, y0 = 3.2, rigS = [id, 1];
  const M = new THREE.Matrix4().makeTranslation(px, 0, pz);
  const body = { m: M, col: ink.paper, rig: rigS, mark: [0, 1, 0.42] };
  const rAt = (y) => hullRadius(V.fleet, clamp((y - y0 - 4) / (H - 8), 0, 1), R, V);
  // profile bottom to top: black-throated engine bell, collar, hull with two belts, nose cap, spike and ball
  const prof = [[0, y0 + 3.2, ink.black], [R * 0.36, y0 + 3.2, ink.black], [R * 0.66, y0 + 0.2, ink.black], [R * 0.7, y0 + 0.2], [R * 0.7, y0 + 0.2],
    [R * 0.47, y0 + 3.4], [rAt(y0 + 4) * 0.98, y0 + 4]];
  const rings = 20, belts = [V.belt1, V.belt2], yn = y0 + 4 + (H - 8) * V.noseAt;
  for (let i = 0; i <= rings; i++) {
    const y = y0 + 4 + (H - 8) * (i / rings), r = Math.max(rAt(y), 0.5), nose = y >= yn - 1e-3;
    const beltHere = belts.some((b) => Math.abs((i / rings) - b) < 0.5 / rings);
    if (nose && prof[prof.length - 1][2] !== ink.yellow && i > 0) prof.push([r, y, ink.paper], [r, y, ink.yellow]);
    if (beltHere && !nose) prof.push([r, y - 0.35], [r + 0.3, y - 0.35, ink.black], [r + 0.3, y + 0.35, ink.black], [r, y + 0.35]);
    else prof.push([r, y, nose ? ink.yellow : ink.paper]);
  }
  const top = y0 + H - 4;
  prof.push([0.42, top + 0.3, ink.yellow], [0.2, top + 0.9, ink.paper, 0.7], [0.14, top + 4.6, ink.paper, 0.7], [0.5, top + 5, ink.yellow], [0.62, top + 5.6, ink.yellow], [0.42, top + 6.2, ink.yellow], [0, top + 6.5, ink.yellow]);
  G.lathe(prof, 16, body);
  GP.lathe(prof.filter((p) => p[2] === ink.yellow && p[1] <= top + 0.4), 16, { m: M, col: ink.orange, rig: rigS });        // nose cap: magenta over yellow
  // fins: swept knife-edged plates with a notch, each ending in a bullet pod the ship stands on
  const fr = Math.max(rAt(y0 + 10), R * 0.5) - 0.6, span = V.finSpan, fh = V.finH;
  const outline = [[fr, y0 + fh], [fr + span * 0.42, y0 + fh * 0.56], [fr + span * 0.93, y0 + 5.2], [fr + span, y0 - 2.2], [fr + span * 0.62, y0 + 2.6], [fr + 0.4, y0 + 3.4]];
  for (let k = 0; k < V.fins; k++) {
    const a = V.finPhase + (k / V.fins) * Math.PI * 2;
    const Mf = new THREE.Matrix4().makeTranslation(px, 0, pz).multiply(new THREE.Matrix4().makeRotationY(a));
    const fin = { m: Mf, col: ink.yellow, rig: rigS, mark: [0.55, 0, 0.38] };
    G.plate(outline, 1.5, fin, 0.3); GP.plate(outline, 1.5, { m: Mf, col: ink.orange, rig: rigS }, 0.3);
    const Mp = Mf.clone().multiply(new THREE.Matrix4().makeTranslation(fr + span * 0.97, 0, 0));
    G.lathe([[0, y0 - 2.9, ink.black], [0.75, y0 - 2.9, ink.black], [0.75, y0 - 2.9], [1.15, y0 - 1.2], [1.25, y0 + 2], [1.0, y0 + 4.6], [0.45, y0 + 6.6], [0, y0 + 7.4]], 8,
      { m: Mp, col: ink.paper, rig: rigS, mark: [0, 0, 0.26] });
    // black tapered speed lines trailing under each pod (kind 4: they stretch out of the tail with speed)
    const Ms = Mf.clone().multiply(new THREE.Matrix4().makeTranslation(fr + span * 0.97, 0, 0));
    for (let j = 0; j < 2; j++) { const dx = (j - 0.5) * 1.3, L = 22 + 20 * rng();
      const sl = { m: Ms, col: ink.black, rig: [id, 4], mark: [0, 0, 0] };
      const a0 = G.vert(sl, dx - 0.34, y0 - 3.2, 0, 0, 0, 1, 0, 0, 1), a1 = G.vert(sl, dx + 0.34, y0 - 3.2, 0, 0, 0, 1, 0, 0, 1), a2 = G.vert(sl, dx, y0 - 3.2 - L, 0, 0, 0, 1, 0, 0, 1);
      const b0 = G.vert(sl, dx, y0 - 3.2, -0.34, 1, 0, 0, 1, 0, 0), b1 = G.vert(sl, dx, y0 - 3.2, 0.34, 1, 0, 0, 1, 0, 0);
      G.tri(a0, a1, a2); G.tri(a0, a2, a1); G.tri(b0, b1, a2); G.tri(b0, a2, b1); }
  }
  // the porthole, facing the rail and a little toward the oncoming sled: a fat ring with cyan glass
  const py = y0 + 4 + (H - 8) * V.portAt, pr = rAt(py), pa = Math.atan2(-0.55, -sgn * 0.83);
  const Mh = new THREE.Matrix4().makeTranslation(px, py, pz).multiply(new THREE.Matrix4().makeRotationY(-pa)).multiply(new THREE.Matrix4().makeTranslation(pr - 0.25, 0, 0)).multiply(new THREE.Matrix4().makeRotationZ(-Math.PI / 2));
  const ps = V.portR;
  G.lathe([[0, 0.5, ink.cyan], [ps * 0.72, 0.5, ink.cyan], [ps * 0.72, 0.5], [ps * 0.8, 0.95], [ps, 0.95], [ps * 1.08, 0.5], [ps * 1.08, 0]], 14, { m: Mh, col: ink.paper, rig: rigS, mark: [0, 0, 0.22] });
  // window-shaped gleam on the glass (bare paper)
  G.plate([[-0.12 * ps, 0.1 * ps], [0.2 * ps, 0.42 * ps], [0.34 * ps, 0.3 * ps], [0.02 * ps, -0.04 * ps]], 0.05,
    { m: Mh.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.56, 0)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), col: ink.paper, rig: rigS, mark: [0, 0, 0] }, 0.05);
  // dots the ship carries: one band of cyan up the flank (chrome), and a yellow skirt that swells when a flame is lit
  const P = new THREE.Vector3(), Nn = new THREE.Vector3(), pitch = 1.5, ca = Math.cos(0.26), sa = Math.sin(0.26);
  const bandA = Math.atan2(-0.8, -sgn * 0.6) + V.bandTurn, bandW = R * 1.5;
  for (let i = -8; i < 70; i++) for (let j = -12; j <= 12; j++) {
    const yy = y0 + 9 + (i * ca + j * sa) * pitch, ss = (j * ca - i * sa) * pitch;
    if (yy < y0 + 11 || yy > yn - 2 || Math.abs(ss) > bandW * 0.5) continue;
    const r = rAt(yy); if (r < 1.2) continue;
    const th = bandA + (ss + 1.6 * Math.sin(yy * 0.09 + id)) / r, e = 1 - Math.abs(ss) / (bandW * 0.5);
    const tone = 0.72 * Math.pow(e, 0.8) * (0.55 + 0.45 * smoothstep(y0 + 11, y0 + 30, yy));
    if (tone < 0.03) continue;
    Nn.set(Math.cos(th), 0.12, Math.sin(th)).normalize(); P.set(px + Math.cos(th) * r, yy, pz + Math.sin(th) * r);
    D.c.add(P, Nn, tone, pitch, 0, 0, rigS);
  }
  for (let j = 0; j < 16; j++) { const yy = y0 + 5.5 + j * 1.4, r = rAt(yy), cnt = Math.max(6, Math.round((Math.PI * 2 * r) / 1.5));
    for (let i = 0; i < cnt; i++) { const th = ((i + (j % 2) * 0.5) / cnt) * Math.PI * 2;
      Nn.set(Math.cos(th), -0.15, Math.sin(th)).normalize(); P.set(px + Math.cos(th) * r, yy, pz + Math.sin(th) * r);
      D.y.add(P, Nn, 0, 1.5, 0, 0.85 * (1 - j / 17), rigS); } }
}

// The pad, its gantry, the ship's ground shadow and the burst star for pad `id`.
function addPad(G, style, id, px, pz, sgn, V, rng) {
  const ink = style.ink, M = new THREE.Matrix4().makeTranslation(px, 0, pz), st = { m: M, col: ink.paper, rig: [id, 0], mark: [0.5, 0, 0.3] };
  // plinth with a yellow hazard ring and a black flame pit
  G.lathe([[27, -1.2], [27, -0.1], [27, -0.1], [25.6, 0.3, ink.yellow], [22.6, 0.3, ink.yellow], [22.6, 0.3], [9, 0.3], [9, 0.3, ink.black], [7.6, -0.9, ink.black], [0, -0.9, ink.black]], 20, st);
  // the ship's noon shadow: a solid black blob with a toothed edge, falling ahead and to starboard (kind 5: it shrinks away on lift)
  const sh = { m: M, col: ink.black, rig: [id, 5], mark: [0, 0, 0] }, c0 = G.vert(sh, -5, 0.36, 7, 0, 1, 0, 0, 1, 0), ring = [];
  for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2, tooth = (i % 2 ? 1 : 0.84) * (0.9 + 0.2 * rng()), rx = 12.5 * tooth, rz = 17 * tooth;
    ring.push(G.vert(sh, -5 + Math.cos(a) * rx * 0.8 - Math.sin(a) * rz * 0.25, 0.36, 7 + Math.sin(a) * rz, 0, 1, 0, 0, 1, 0)); }
  for (let i = 0; i < 44; i++) G.tri(c0, ring[(i + 1) % 44], ring[i]);
  // gantry: a lattice mast outboard of the ship, three swing arms (kind 2) and a mast head
  const gx = V.mastOff * sgn, gh = V.mastH, w = 2.6, leg = { m: M, col: ink.paper, rig: [id, 0], mark: [0.9, 0, 0.13] };
  const cor = [[-1, -1], [1, -1], [1, 1], [-1, 1]], brace = { ...leg, mark: [0.9, 0, -0.13] };
  for (const [cx, cz] of cor) G.beam([gx + cx * w * 1.25, 0.3, cz * w * 1.25], [gx + cx * w * 0.8, gh, cz * w * 0.8], 0.7, 0.7, brace, [cx, 0, cz]);
  const bays = 8;
  for (let b = 0; b < bays; b++) { const ya = 0.3 + (gh - 0.3) * (b / bays), yb = 0.3 + (gh - 0.3) * ((b + 1) / bays), ka = lerp(1.25, 0.8, b / bays) * w, kb = lerp(1.25, 0.8, (b + 1) / bays) * w;
    for (let f = 0; f < 4; f++) { const a = cor[f], c = cor[(f + 1) % 4], zig = (b + f) % 2;
      G.beam([gx + a[0] * kb, yb, a[1] * kb], [gx + c[0] * kb, yb, c[1] * kb], 0.34, 0.34, brace);
      const p0 = zig ? a : c, p1 = zig ? c : a;
      G.beam([gx + p0[0] * ka, ya, p0[1] * ka], [gx + p1[0] * kb, yb, p1[1] * kb], 0.3, 0.3, brace); } }
  // mast head: deck, lamp ball, aerial
  G.lathe([[0, gh], [3.4, gh], [3.4, gh], [3.6, gh + 0.8, ink.yellow], [3.6, gh + 0.8], [0.5, gh + 1.2], [0.3, gh + 7], [0.3, gh + 7, ink.orange], [1.0, gh + 7.8, ink.orange], [1.0, gh + 8.6, ink.orange], [0, gh + 9.4, ink.orange]], 8,
    { m: new THREE.Matrix4().makeTranslation(px + gx, 0, pz), col: ink.paper, rig: [id, 0], mark: [0.6, 0, 0.2] });
  // swing arms reach from the mast to the hull: two chords, a web and a yellow clamp pad
  const arm = { m: M, col: ink.yellow, rig: [id, 2], mark: [0.9, 0, 0.14] };
  V.armsAt.forEach((t, k) => { const y = gh * t, reach = sgn * (V.armReach[k] + 0.6);
    G.beam([gx - sgn * w, y, -0.9], [reach, y - 1.2, -0.7], 0.5, 0.6, arm); G.beam([gx - sgn * w, y, 0.9], [reach, y - 1.2, 0.7], 0.5, 0.6, arm);
    G.beam([gx - sgn * w, y + 3.2, 0], [reach + sgn * 2, y - 0.9, 0], 0.36, 0.36, arm);
    G.beam([reach, y - 1.2, -2.2], [reach, y - 1.2, 2.2], 0.8, 1.8, { ...arm, col: ink.paper }); });
  // burst star (kind 3): a 24-point bare-paper star with a heavy outline, facing the oncoming sled
  const nrm = new THREE.Vector3(-sgn * 0.42, 0.12, -0.9).normalize(), pts = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, r = i % 2 ? 16 + 5 * rng() : 30 + 13 * rng(); pts.push([Math.cos(a) * r * 1.15, Math.sin(a) * r]); }
  const Mb = new THREE.Matrix4().lookAt(nrm, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)).setPosition(px + nrm.x * 9, 7 + nrm.y * 9, pz + nrm.z * 9);
  G.plate(pts, 0.5, { m: Mb, col: ink.paper, rig: [id, 3], mark: [0, 0, 0.55] }, 0.08);
}

// ---------------------------------------------------------------- flame columns
// One cylinder per ship: position = (cos, v, sin), v 0 at the nozzle, 1 on the pad; the vertex shader hangs it between
// the two. The bands are cut by facing (so they are concentric from every side) and pour downward:
// paper core, solid yellow sleeve, a black toothed edge; flameMaterial(style, true) is the magenta plate of the same
// column: dots swelling outward to solid, laid on the column's own surface, with the plate's registration offset.
const FLAME_VS = /* glsl */`
  uniform vec2 uRegW; uniform vec4 uFoot[${MAX_SHIPS}], uFootT[${MAX_SHIPS}]; attribute float aShip;
  varying vec3 vW, vAx, vT, vS; varying vec2 vTh; varying float vR, vSeed, vV, vL;
  // the column is the ship's own wake: a cubic from the tail (leaving along the ship's axis) down the way it flew to
  // its foot, which stands on the pad while the ship is young and follows it up the trajectory afterwards
  void main(){ int i = int(aShip + 0.5); vec4 s = uShip[i], b = uShipB[i], pad = uPad[i], ft = uFoot[i], fd = uFootT[i];
    float v = position.y, lift = s.x, on = b.y, det = fd.w;
    vec3 ax = vec3(sin(s.z)*cos(s.y), cos(s.z)*cos(s.y), -sin(s.y));
    float Zm = 1. + uDrift[i].w;
    vec3 B0 = pad.xyz + vec3(uDrift[i].x, 40.*Zm + lift, uDrift[i].y) - ax*36.4*Zm, B3 = pad.xyz + ft.xyz + vec3(0., 0.2, 0.);
    float L = max(length(B0 - B3), 0.5);
    vec3 B1 = B0 - ax*L*0.36, B2 = B3 + fd.xyz*L*0.36;
    float u = 1. - v;
    vec3 c = B0*u*u*u + B1*3.*u*u*v + B2*3.*u*v*v + B3*v*v*v;
    vec3 T = normalize((B1 - B0)*u*u + (B2 - B1)*2.*u*v + (B3 - B2)*v*v + vec3(0., -1e-4, 0.));
    vec3 Bn = normalize(cross(T, vec3(1., 0., 0.)) + vec3(0., 0., 1e-5)), S = cross(Bn, T);
    float r = mix(3.2, 8.4, sqrt(v))*(1. + 0.6*smoothstep(0.75, 1., v)*(1. - det)/(1. + lift*0.02))*on;
    r *= (1. + 0.07*sin(v*40. - uTime*9. + aShip*2.))*mix(Zm, 1., v*v);
    if (on > 0.01) r = max(r, 1.6*uPx*length(cameraPosition - (modelMatrix*vec4(c, 1.)).xyz));      // a far column never thins under 3 px
    r *= 1. - 0.94*det*smoothstep(0.45, 1., v);                                                      // a wake that has left the pad tapers to a point
    vec4 w = modelMatrix*vec4(c + (S*position.x + Bn*position.z)*r, 1.);
    vW = w.xyz; vAx = (modelMatrix*vec4(c, 1.)).xyz; vTh = position.xz; vR = max(r, 0.01); vSeed = aShip*1.7; vV = v;
    vT = T; vS = S; vL = ft.w - v*L;
    gl_Position = projectionMatrix*viewMatrix*w; gl_Position.x += dot(uReg, uRegW)*gl_Position.w; }`;
const FLAME_FS = (plate) => /* glsl */`
  uniform vec3 uYellow, uF; varying vec3 vW, vAx, vT, vS; varying vec2 vTh; varying float vR, vSeed, vV, vL;
  void main(){
    vec3 T = normalize(vT + vec3(0., -1e-5, 0.)), S = normalize(vS - T*dot(vS, T) + vec3(1e-5, 0., 0.)), Bn = cross(T, S);
    vec3 V = normalize(cameraPosition - vAx + vec3(0., 1e-4, 0.)); vec3 Vh = normalize(V - T*dot(V, T) + S*1e-4);
    vec3 N = normalize(S*vTh.x + Bn*vTh.y + S*1e-5);
    float x = sqrt(max(1. - dot(N, Vh)*dot(N, Vh), 0.));                  // 0 on the centre line, 1 at the silhouette
  float pour = vL*0.085 + uTime*2.6 + vSeed;                           // bands pour downward
    float saw = fract(pour), lick = saw*saw*0.16 + 0.05*sin(pour*2.1 + N.x*3.);
    float saw2 = fract(pour*0.63 + 0.4), lick2 = saw2*saw2*0.13;
    float fw = fwidth(x) + 1e-4;
    ${plate ? /* glsl */`
    // magenta plate: discs on a lattice wrapped round the column (angle, height), tone taken at each disc's centre
    float th = atan(vTh.y, abs(vTh.x) + abs(vTh.y) > 1e-4 ? vTh.x : 1.), pitch = 2.3, nA = max(floor(6.2832*vR/pitch + 0.5), 6.);
    vec2 g = vec2(th/6.2832*nA, (vL + uTime*22.)/pitch); g.x += floor(g.y)*0.5;
    vec2 cell = floor(g), f = fract(g) - 0.5;
    float thc = (cell.x + 0.5 - floor(g.y)*0.5)/nA*6.2832; vec3 Nc = S*cos(thc) + Bn*sin(thc);
    float xc = sqrt(max(1. - dot(Nc, Vh)*dot(Nc, Vh), 0.));
    float tone = smoothstep(0.52, 0.86, xc - lick2*0.6);
    float d = length(f*vec2(6.2832*vR/nA, pitch))/pitch, rad = sqrt(tone*0.3183)*1.25, aa = fwidth(d) + 1e-4;
    float a = max(1. - smoothstep(rad - aa, rad + aa, d), smoothstep(0.84 - fw, 0.84 + fw, x - lick2*0.6));
    a *= step(x, 0.999)*smoothstep(0.0, 0.03, vV);
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(vec3(1.), uF, a), 1.);`
  : /* glsl */`
    float core = 1. - smoothstep(0.31 - fw, 0.31 + fw, x + lick - 0.08);
    float edgeW = max(0.06, 1.3*fw); float edge = smoothstep(1. - edgeW - fw, 1. - edgeW + fw, x + lick2*0.35);
    vec3 col = mix(uYellow, uPaperC, core); col = mix(col, uK, edge);
    gl_FragColor = vec4(col, 1.);`}
  }`;
function flameMaterial(style, plate, trail) {
  return new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, ...trail, uYellow: { value: style.ink.yellow }, uF: { value: style.factor.magentaOnYellow }, uRegW: { value: new THREE.Vector2(plate ? 1 : 0, 0) } },
    vertexShader: STYLE_GLSL + FLAME_VS, fragmentShader: STYLE_GLSL + FLAME_FS(plate),
    ...(plate ? { ...style.plateBlend, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 } : {}),
  });
}
function flameGeometry(count, segs, rings) {
  const P = [], S = [], I = [];
  for (let k = 0; k < count; k++) { const base = P.length / 3;
    for (let j = 0; j <= rings; j++) { const v = Math.pow(j / rings, 1.5);
      for (let s = 0; s <= segs; s++) { const t = (s / segs) * Math.PI * 2; P.push(Math.cos(t), v, Math.sin(t)); S.push(k); } }
    for (let j = 0; j < rings; j++) for (let s = 0; s < segs; s++) { const a = base + j * (segs + 1) + s, b = a + segs + 1; I.push(a, a + 1, b, a + 1, b + 1, b); } }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); geo.setAttribute('aShip', new THREE.BufferAttribute(new Float32Array(S), 1));
  geo.setIndex(I); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return geo;
}

// ---------------------------------------------------------------- smoke scallops
// Camera-facing sphere impostors, two quads an instance: the bare-paper ball, and a black disc pushed behind it that
// shows only as the outline of the pile. The underside carries cyan dots laid on the ball itself (stereographic lattice,
// so they foreshorten toward the rim). Each puff runs on its ship's ignition clock uSmoke[i].
function smokeMesh(style, pads, perPad, rng) {
  const A = [], B = [];
  for (let k = 0; k < pads; k++) for (let i = 0; i < perPad; i++) {
    const t = i / perPad, ring = Math.pow(rng(), 0.7);
    A.push(k, rng(), rng() * (0.3 + rng() * 6.5 * ring), lerp(2.6, 8.5, Math.pow(rng(), 1.6)) * (1.15 - 0.4 * ring));
    B.push(rng() * Math.PI * 2, 9 + ring * 46, rng() * rng() * 9 * (1 - ring * 0.7), t * 40);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); geo.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
  geo.instanceCount = pads * perPad; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const uSmoke = { value: new Float32Array(MAX_SHIPS).fill(-1) };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, uSmoke, uCyan: { value: style.ink.cyan } },
    vertexShader: /* glsl */`
      ${STYLE_GLSL}
      uniform float uSmoke[${MAX_SHIPS}]; attribute vec4 iA, iB;
      varying vec2 vUv; varying vec3 vK;       // vK: layer, rim radius in ball radii, dots flat 0..1
      varying float vSize;
      void main(){ int i = int(iA.x + 0.5); float age = uSmoke[i] - iA.z;
        float grow = age > 0. ? 1. - exp(-age*0.9) : 0.; float roll = 1. - exp(-max(age, 0.)*0.3);
        float size = iA.w*grow*(1. + 0.07*sin(uTime*1.1 + iB.w));
        vec3 c = uPad[i].xyz + vec3(cos(iB.x), 0., sin(iB.x))*iB.y*roll;
        c.xz += vec2(0.9, 0.5)*max(age - 6., 0.)*0.35*(0.4 + iA.y);                        // the pile drifts off downwind
        float corr = mix(0.3, 1., smoothstep(5., 15., abs(c.x)));                          // the sled's corridor down the rail stays mostly clear
        size *= corr;
        size = min(size, 0.4 + 0.16*abs(c.x));                                              // near the rail the pile is small scallops: no lobe blanks the frame
        c.y += 0.2 + size*0.5 + iB.z*roll*corr + 0.4*sin(uTime*0.7 + iB.w*1.7)*grow;
        vec4 mv = viewMatrix*modelMatrix*vec4(c, 1.); float dist = max(-mv.z, 0.1);
        float lw = max(min(0.34, size*0.14 + 0.04), 1.6*uPx*dist), R = size + (position.z > 0.5 && size > 0.01 ? lw : 0.);
        mv.xy += position.xy*R;
        // slide the two discs along the view ray (not along z), so the outline stays concentric with its ball
        mv.xyz *= 1. + (position.z > 0.5 ? size*0.5 + 0.2 : -min(size*0.3, dist*0.3))/dist;
        vUv = position.xy*R/max(size, 1e-3); vSize = size;
        vK = vec3(position.z, R/max(size, 1e-3), smoothstep(2.6, 4.6, 1.7/max(uPx*dist, 1e-5)));
        gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      uniform vec3 uCyan; varying vec2 vUv; varying vec3 vK; varying float vSize;
      void main(){ float r = length(vUv);
        if (vK.x > 0.5){ if (r > vK.y) discard; gl_FragColor = vec4(uK, 1.); return; }
        if (r > 1.) discard;
        vec3 nv = vec3(vUv, sqrt(max(1. - r*r, 0.))); vec3 n = nv*mat3(viewMatrix);
        vec2 st = n.xz/max(1. - n.y, 0.05); float cells = max(floor(vSize*2./1.7 + 0.5), 2.);
        vec2 g = rot2(0.26)*st*cells; vec2 cc = floor(g) + 0.5, f = g - cc;
        vec2 sc = (cc*rot2(0.26))/cells; float q = dot(sc, sc), nyc = (q - 1.)/(q + 1.);
        float tone = 0.66*smoothstep(-0.02, -0.62, nyc);
        float d = length(f), rad = sqrt(tone*0.3183)*1.05, aa = fwidth(d) + 1e-4;
        float a = mix(tone, 1. - smoothstep(rad - aa, rad + aa, d), vK.z)*step(n.y, 0.6);
        gl_FragColor = vec4(mix(uPaperC, uCyan, a), 1.); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  return { mesh, uSmoke };
}

// ---------------------------------------------------------------- screens drawn in a fragment shader (far ground, mesas)
// float screen(vec2 p, float pitch, float angle, float tone): coverage 0..1 of one plate's dot screen at surface
// coordinate p (metres); below ~3 px a dot it returns the flat average tone, so nothing shimmers. Fragment shaders only.
export const SCREEN_GLSL = /* glsl */`
  float screen(vec2 p, float pitch, float angle, float tone){
    vec2 g = rot2(angle)*p/pitch; vec2 f = fract(g) - 0.5;
    float px = 1./max(length(fwidth(g)), 1e-5);                       // pixels per cell
    float d = length(f), rad = sqrt(clamp(tone, 0., 1.)*0.3183)*1.02, aa = 0.8/px;
    float disc = 1. - smoothstep(rad - aa, rad + aa, d);
    return mix(clamp(tone, 0., 1.), disc, smoothstep(2.6, 4.6, px));
  }`;

// buildSky(style, opts): the printed sky as one object that must follow the camera each frame (sky.follow(camera)):
// a bare-paper dome and cyan discs on a Fibonacci lattice, none below 8 degrees, swelling to nearly touching at the
// zenith; two moons knocked out as bare paper with a brush outline (the large one with a solid black crescent).
export function buildSky(style, opts = {}) {
  const group = new THREE.Group(), count = Math.round((opts.count ?? 9000) * (opts.detail ?? 1)), Rr = opts.radius ?? 2500;
  const farVS = /* glsl */`
    void main(){ vec4 p = projectionMatrix*viewMatrix*vec4(cameraPosition + position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
  // opts.domeColor: the stock or solid the dome is printed in (default bare paper); opts.factor: the dots' multiply
  // factor (default cyan); opts.tone(el, i): tone of disc i at elevation el (0 skips it); opts.solid: a colour, the discs
  // are then knocked out in it instead of overprinted (night edition: paper stars on key black, twinkling);
  // opts.moonFill: a colour to fill the moons with; opts.breathe: depth of a slow swell that travels over the dots.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(Rr, 24, 12), new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uDome: { value: opts.domeColor || style.ink.paper } }, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: farVS, fragmentShader: 'uniform vec3 uDome; void main(){ gl_FragColor = vec4(uDome, 1.); }' }));
  dome.renderOrder = opts.domeOrder ?? -20; dome.frustumCulled = false; group.add(dome);
  const moons = opts.moons ?? [{ dir: [-0.62, 0.62, 0.48], size: 9, crescent: true }, { dir: [0.55, 0.2, 0.81], size: 3.6, ring: true }];
  const md = moons.map((m) => ({ ...m, d: new THREE.Vector3(...m.dir).normalize(), c: Math.cos(((m.size * 0.5 + 0.5) * Math.PI) / 180) }));
  const P = [], T = [], v = new THREE.Vector3(), ga = Math.PI * (3 - Math.sqrt(5)), n2 = Math.round(count / (1 - Math.sin(8 * Math.PI / 180)));
  const spacing = Math.sqrt((2 * Math.PI) / n2);                       // radians between neighbours
  for (let i = 0; i < n2; i++) { const y = 1 - (i + 0.5) / n2, el = Math.asin(y); if (el < (8 * Math.PI) / 180) break;
    const r = Math.sqrt(1 - y * y), a = i * ga; v.set(Math.cos(a) * r, y, Math.sin(a) * r);
    if (md.some((m) => v.dot(m.d) > m.c)) continue;
    const tone = opts.tone ? opts.tone(el, i) : 0.02 + 0.7 * Math.pow(smoothstep((8 * Math.PI) / 180, 1.45, el), 0.85);
    if (tone <= 0) continue;
    P.push(v.x, v.y, v.z); T.push(spacing * Math.sqrt(tone / Math.PI) * 1.05); }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(P), 3)); geo.setAttribute('iRad', new THREE.InstancedBufferAttribute(new Float32Array(T), 1));
  geo.instanceCount = T.length; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
  const dots = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uF: { value: opts.solid || opts.factor || style.factor.cyan }, uR: { value: Rr }, uSolid: { value: opts.solid ? 1 : 0 }, uBreathe: { value: opts.breathe ?? 0 } }, ...(opts.solid ? { depthWrite: false } : style.plateBlend), depthTest: true, depthFunc: THREE.LessEqualDepth, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${STYLE_GLSL}
      uniform float uR, uSolid, uBreathe; attribute vec3 iPos; attribute float iRad; varying vec2 vUv;
      void main(){ vec3 n = iPos; vec3 t = normalize(cross(n, vec3(0.03, 1., 0.011))), b = cross(n, t);
        float rad = max(iRad*(1. + uSolid*0.35*sin(uTime*(1.3 + 2.*h11(iPos.x*7.)) + iPos.z*40.))*(1. + uBreathe*sin(uTime*1.6 - iPos.y*11. + iPos.x*4. + iPos.z*2.)), 1.1*uPx);                                 // never a sub-pixel pinprick
        vec3 w = cameraPosition + (n + (t*position.x + b*position.y)*rad*1.1)*uR; vUv = position.xy*1.1;
        vec4 p = projectionMatrix*viewMatrix*vec4(w, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; p.x += uReg.y*p.w; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`uniform vec3 uF; uniform float uSolid; varying vec2 vUv;
      void main(){ float d = length(vUv), aa = fwidth(d) + 1e-4, a = 1. - smoothstep(1. - aa, 1. + aa, d);
        if (uSolid > 0.5){ if (a < 0.5) discard; gl_FragColor = vec4(uF, 1.); return; }
        if (a < 0.004) discard; gl_FragColor = vec4(mix(vec3(1.), uF, a), 1.); }` }));
  dots.renderOrder = -10; dots.frustumCulled = false; group.add(dots);
  // moon outlines: ribbons of brush line on the dome (width wobbles), plus crescent / ring
  const MP = [], MI = [], qv = new THREE.Vector3(), tx = new THREE.Vector3(), ty = new THREE.Vector3();
  const ribbon = (m, fn, steps, w0, closed) => { const base = MP.length / 3;
    tx.crossVectors(m.d, new THREE.Vector3(0, 1, 0)).normalize(); ty.crossVectors(tx, m.d);
    for (let i = 0; i <= steps; i++) { const [x, y, wk] = fn(i / steps), w = w0 * wk;
      for (const s of [-1, 1]) { const l = Math.hypot(x, y) || 1, k = 1 + (s * w) / l; qv.copy(m.d).addScaledVector(tx, Math.tan((x * k * Math.PI) / 180)).addScaledVector(ty, Math.tan((y * k * Math.PI) / 180)).normalize().multiplyScalar(Rr * 0.99); MP.push(qv.x, qv.y, qv.z); } }
    for (let i = 0; i < steps; i++) { const a = base + i * 2; MI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
  for (const m of md) { const r = m.size * 0.5;
    ribbon(m, (t) => { const a = t * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r, 0.7 + 0.5 * Math.sin(a * 1 + 2.2) * Math.sin(a * 1 + 2.2)]; }, 64, r * 0.035 + 0.05);
    if (m.crescent) ribbon(m, (t) => { const a = -2.2 + t * 2.5, k = Math.sin(t * Math.PI); return [Math.cos(a) * r * (1 - 0.17 * k), Math.sin(a) * r * (1 - 0.17 * k), 0.02 + k]; }, 40, r * 0.17);
    if (m.ring) ribbon(m, (t) => { const a = 0.55 + t * Math.PI * 1.62 ; return [Math.cos(a) * r * 2.1 * 0.94 + Math.sin(a) * r * 0.3, Math.sin(a) * r * 0.55 - Math.cos(a) * r * 0.5, 0.5 + 0.5 * Math.sin(t * Math.PI)]; }, 48, 0.09); }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MP), 3)); mg.setIndex(MI);
  const moonMesh = new THREE.Mesh(mg, new THREE.ShaderMaterial({ uniforms: { ...style.uniforms }, side: THREE.DoubleSide, depthWrite: false, depthFunc: THREE.LessEqualDepth,
    vertexShader: farVS, fragmentShader: 'uniform vec3 uK; void main(){ gl_FragColor = vec4(uK, 1.); }' }));
  moonMesh.renderOrder = (opts.domeOrder ?? -20) + 0.1; moonMesh.frustumCulled = false; group.add(moonMesh);
  if (opts.moonFill) {                                   // moons knocked out as flat discs (night edition)
    const FP = [], FI = [];
    for (const m of md) { const r = m.size * 0.5, base = FP.length / 3; tx.crossVectors(m.d, new THREE.Vector3(0, 1, 0)).normalize(); ty.crossVectors(tx, m.d);
      qv.copy(m.d).multiplyScalar(Rr * 0.99); FP.push(qv.x, qv.y, qv.z);
      for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; qv.copy(m.d).addScaledVector(tx, Math.tan((Math.cos(a) * r * Math.PI) / 180)).addScaledVector(ty, Math.tan((Math.sin(a) * r * Math.PI) / 180)).normalize().multiplyScalar(Rr * 0.99); FP.push(qv.x, qv.y, qv.z); }
      for (let i = 0; i < 40; i++) FI.push(base, base + 1 + i, base + 2 + i); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FP), 3)); fg.setIndex(FI);
    const fill = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: { uC: { value: opts.moonFill } }, side: THREE.DoubleSide, depthWrite: false, depthFunc: THREE.LessEqualDepth,
      vertexShader: farVS, fragmentShader: 'uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 1.); }' }));
    fill.renderOrder = (opts.domeOrder ?? -20) + 0.05; fill.frustumCulled = false; group.add(fill);
  }
  return { object: group, dots, dome, moons: moonMesh };
}

// A stand-in stage so the piece can be judged alone (opts.stage, default true; the world passes stage: false and
// builds the real causeway and desert): the printed sky, a strip of deck and a desert plane whose two dot screens
// (yellow at 0 degrees, magenta at 75) are drawn in its fragment shader with screen().
function buildStage(style, G, V, detail) {
  const group = new THREE.Group(), ink = style.ink, L = V.length * 0.5 + 80;
  G.beam([0, -0.8, -L], [0, -0.8, L], 60, 1.6, { col: ink.paper, rig: [-1, 0], mark: [0.7, 0, 0.3] });
  for (let z = -L + 20; z < L; z += 45) for (const sx of [-1, 1]) G.beam([sx * 22, -9, z], [sx * 22, -1.6, z], 3, 3, { col: ink.paper, rig: [-1, 0], mark: [0.9, 0, 0.25] });
  G.beam([0, 0.5, -L], [0, 0.5, L], 1.2, 0.6, { col: ink.orange, rig: [-1, 0], mark: [0.4, 0, 0.14] });               // the rail
  const sky = buildSky(style, { detail, domeOrder: -0.5 }); group.add(sky.object);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, uY: { value: ink.yellow }, uM: { value: ink.magenta }, uO: { value: ink.orange }, uC: { value: ink.cyan } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL} ${SCREEN_GLSL}
      uniform vec3 uY, uM, uO, uC; varying vec3 vW;
      void main(){ float dist = length(cameraPosition - vW); vec2 p = vW.xz;
        vec2 pm = p + vec2(viewMatrix[0][0], viewMatrix[2][0])*uReg.x*dist*0.6;                // the magenta plate, slipped
        float sh = shadowAt(vW), far = smoothstep(260., 420., dist), drop = smoothstep(900., 1700., dist);
        float ty = 0.78 + 0.1*sh, tm = (0.5 + 0.4*sh)*(1. - drop);
        float ay = 1. - (1. - screen(p, 3., 0., ty*(1. - far)))*(1. - screen(p, 12., 0., ty*far));
        float am = 1. - (1. - screen(pm, 3., 1.309, tm*(1. - far)))*(1. - screen(pm, 12., 1.309, tm*far));
        float ac = screen(p, 12., 0.2618, 0.3*drop);
        vec3 col = mix(mix(uPaperC, uM, am), mix(uY, uO, am), ay); col = mix(col, uC, ac*(1. - ay));
        gl_FragColor = vec4(col, 1.); }`,
  }));
  ground.position.y = -9; group.add(ground);
  return { group, sky };
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  // (The set-piece viewer aid that read the page address was removed for the world build: worlds must not read it.
  // The optional viewer overrides below are therefore always off.)
  const aid = null;
  const aidNum = (k, d) => (aid && aid.has(k) ? Number(aid.get(k)) : d);
  if (aid && aid.get('stage') === '0') opts = { ...opts, stage: false };
  const style = opts.style || makeStyle(opts.palette || DEFAULT_PALETTE, { exposure: opts.exposure });
  const U = style.uniforms, ink = style.ink;
  const count = Math.min(opts.count ?? 12, MAX_SHIPS), spacing = opts.spacing ?? 90, side = opts.side ?? 38, duration = opts.duration ?? 41;
  const t0 = opts.firstIgnition ?? 2.5, every = opts.ignitionEvery ?? 3;
  const fleetRoll = (() => { const r = rng(); return r < 0.6 ? 'needle' : r < 0.82 ? 'teardrop' : 'stacked'; })(), fleet = (aid && aid.get('fleet')) || opts.fleet || fleetRoll;
  const misprintRoll = rng.chance(0.08), misprint = aid ? aid.get('mis') === '1' : opts.misprint ?? misprintRoll;
  const V0 = { fleet, length: spacing * (count - 1), fins: fleet === 'teardrop' ? 4 : 3, finPhase: rng.range(0, 6.28),
    radius: fleet === 'needle' ? rng.range(5.6, 6.4) : fleet === 'teardrop' ? rng.range(6.6, 7.4) : rng.range(6.4, 7),
    low: rng.range(0.52, 0.7), fat: rng.range(0.94, 1.06), noseAt: rng.range(0.8, 0.88), finSpan: rng.range(10.5, 13.5), finH: rng.range(26, 36),
    belt1: rng.range(0.16, 0.24), belt2: rng.range(0.56, 0.68), portAt: rng.range(0.6, 0.72), portR: rng.range(1.7, 2.3), bandTurn: rng.range(-0.25, 0.25) };
  const G = makeGeo(), GP = makeGeo(), D = { y: makeDots(), c: makeDots() };
  const pads = [], ships = [], perches = [];
  await ctx.yield();
  for (let k = 0; k < count; k++) {
    const sgn = k % 2 ? -1 : 1, px = sgn * side, pz = -V0.length * 0.5 + k * spacing;
    const V = { ...V0, height: 90 * rng.range(0.95, 1.04), mastOff: rng.range(21.5, 23), mastH: rng.range(76, 84), finPhase: 0, armsAt: [0.3, 0.58, 0.84], armReach: [] };
    // keep every fin clear of the mast and one fin roughly toward the oncoming sled
    V.finPhase = (sgn > 0 ? 0 : Math.PI) + Math.PI / V.fins + rng.range(-0.12, 0.12);
    V.armReach = V.armsAt.map((t) => hullRadius(fleet, clamp((V.mastH * t - 7.2) / (V.height - 8), 0, 1), V.radius, V));
    addShip(G, GP, D, style, k, px, pz, sgn, V, rng);
    addPad(G, style, k, px, pz, sgn, V, rng);
    U.uPad.value[k].set(px, 0, pz, V.mastOff * sgn);
    pads.push({ position: [px, 0, pz], side: sgn, height: V.height });
    for (let i = 0; i < 5; i++) { const a = i % 3, y = V.mastH * V.armsAt[a] + 0.9, f = rng.range(0.15, 0.9);
      perches.push({ ship: k, side: sgn, x: px + lerp(sgn * (V.mastOff - 2.6), sgn * (V.armReach[a] + 1.5), f), y: y - 1.2 * f, z: pz + (rng.chance(0.5) ? 0.8 : -0.8) }); }
    ships.push({ lean: rng.range(0.1, 0.22), yaw: rng.range(-0.07, 0.07) + sgn * 0.03, arm: (rng.chance(0.5) ? 1 : -1) * rng.range(1.5, 2.1), slip: k % 2 ? -1 : 1, lift: 0, t: -1, tilt: 0, sgn, a0: (opts.pitchOver && opts.pitchOver[k]) ?? 3.6,
      A: k >= count - 3 ? 4.5 : 3.6, vy: k >= count - 3 ? 22 : 15 });      // the early ships rise slower still, so the staircase over the causeway stays inside the frame
    await ctx.yield();
  }
  const object = new THREE.Group();
  let stage = null;
  if (opts.stage !== false) { stage = buildStage(style, G, V0, detail); object.add(stage.group); await ctx.yield(); }
  const geo = G.build(); await ctx.yield();
  const paper = new THREE.Mesh(geo, style.paperMaterial()), hull = new THREE.Mesh(geo, style.hullMaterial());
  const plate = new THREE.Mesh(GP.build(), style.plateMaterial('magenta', 'yellow')); plate.renderOrder = 4;
  const dotsY = D.y.build(style.dotMaterial('yellow', 'paper')), dotsC = D.c.build(style.dotMaterial('cyan', 'paper'));
  const V4n = (n) => Array.from({ length: n }, () => new THREE.Vector4(0, 0, 0, 0)), trail = { uFoot: { value: V4n(MAX_SHIPS) }, uFootT: { value: V4n(MAX_SHIPS) } };
  for (const v of trail.uFootT.value) v.set(0, 1, 0, 0);
  const fgeo = flameGeometry(count, 12, 22), flame = new THREE.Mesh(fgeo, flameMaterial(style, false, trail)), flameM = new THREE.Mesh(fgeo, flameMaterial(style, true, trail));
  flameM.renderOrder = 4;
  const smoke = smokeMesh(style, count, Math.round(200 * detail), rng);
  for (const m of [paper, hull, plate, flame, flameM]) { m.frustumCulled = false; object.add(m); }
  const flappers = flapperMesh(style, perches, smoke.uSmoke, rng);
  object.add(dotsY, dotsC, smoke.mesh, flappers);
  await ctx.yield();

  // ---- choreography: everything hangs on the journey clock (seconds), set by setProgress(u) or setClock(t)
  let clock = aid && aid.has('tj') ? Number(aid.get('tj')) : null;                      // null: nobody drives us, so run a demonstration loop on world time
  const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  // The flight (a = seconds since release, HOLD after ignition): a slow, heavy rise that keeps a staircase of ships in
  // the frame, then the ship leans down the row (+Z) and flies away ahead of the sled, dwindling by distance. Closed
  // forms of age, so any moment of the journey can be shown directly.
  const HOLD = 1.2, FL = { A: 4.5, Vy1: 22, Vy2: 9, ty: 4, Vz: 115, tz: 5, cap: 0.55, fan: 0.2 };
  const ramp = (x, acc, cap) => { if (x <= 0) return 0; const tv = cap / acc; return x < tv ? 0.5 * acc * x * x : 0.5 * acc * tv * tv + cap * (x - tv); };
  const rampV = (x, acc, cap) => (x <= 0 ? 0 : Math.min(acc * x, cap));
  const soft = (x, tc) => (x <= 0 ? 0 : x - tc * (1 - Math.exp(-x / tc))), softV = (x, tc) => (x <= 0 ? 0 : 1 - Math.exp(-x / tc));
  const flight = (a, s, o) => {
    o.h = ramp(a, s.A, s.vy) - (s.vy - FL.Vy2) * soft(a - s.a0 - 1, FL.ty); o.z = FL.Vz * soft(a - s.a0, FL.tz);
    o.vy = rampV(a, s.A, s.vy) - (s.vy - FL.Vy2) * softV(a - s.a0 - 1, FL.ty); o.vz = FL.Vz * softV(a - s.a0, FL.tz);
    o.x = s.yaw * o.h * 0.5 + s.sgn * FL.fan * o.z; return o; };     // the two files fan a little outboard as they fly, so no wake lies in another ship's lane
  const slipAt = (t) => (t <= 0 || t > 1.3 ? 0 : ease(t / 0.07) * Math.exp(-t * 2.6) * Math.cos(t * Math.PI * 5) * (1 - ease((t - 0.95) / 0.35)));
  const lastIgn = opts.lastIgnition ?? null;
  const ignList = opts.ignitions || null;      // opts.ignitions[k]: the world's own timetable (journey seconds), ship by ship
  const ignitionTime = (k) => (ignList && ignList[k] != null ? ignList[k] : k === count - 1 && lastIgn !== null ? lastIgn : t0 + every * k), byIgnition = (p, q) => ignitionTime(p) - ignitionTime(q);
  const restReg = opts.rest ?? 0.0015, slipAmp = opts.slip ?? 0.016;      // opts.rest: how far off register the magenta plate rests (clip units)
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), latest = [], F = {}, G0 = {};
  const _eye = new THREE.Vector3(0, 0, -1e4), ZOOM = opts.longLens ?? (opts.stage === false ? 1.1 : 0);
  const escort = { on: false, x: 0, y: 0, z: 0, tilt: 0 };              // the last ship may be flown by the world (setEscort)
  const shipPosition = (k, out = new THREE.Vector3()) => { const p = pads[k].position, d = U.uDrift.value[k]; return out.set(p[0] + d.x, 40 + ships[k].lift, p[2] + d.y); };
  /** where ship k's fins are now (hero space): the foot of the hull, where the column begins */
  const shipTail = (k, out = new THREE.Vector3()) => { const th = ships[k].tilt || 0; return shipPosition(k, out).add(_p.set(0, -38 * Math.cos(th), -38 * Math.sin(th))); };
  function update(dt, time, camera) {
    style.tick(dt, time, camera, ctx.renderer);
    const tJ = clock !== null ? clock : (time + 14) % (t0 + every * count + 22);
    let slip = 0; latest.length = 0;
    object.updateWorldMatrix(true, false); if (camera) { camera.getWorldPosition(_eye); object.worldToLocal(_eye); }
    for (let k = 0; k < count; k++) {
      const s = ships[k], t = tJ - ignitionTime(k), a = t - HOLD, pd = pads[k].position; s.t = t;
      const ft = trail.uFoot.value[k], fd = trail.uFootT.value[k];
      let speed = 0;
      if (k === count - 1 && escort.on) {
        // flown by the world: base of the hull at (x, y, z) hero space, leaning `tilt` toward +Z
        const th = escort.tilt; s.tilt = th; s.lift = escort.y - pd[1] - 40 + 40 * Math.cos(th);
        U.uDrift.value[k].set(escort.x - pd[0], escort.z - pd[2] + 40 * Math.sin(th), 0, 0);
        U.uShip.value[k].set(s.lift, -th, 0, s.arm * ease((t - 0.1) / 1.1));
        ft.set(0, 0, 0, Math.hypot(escort.x - pd[0], escort.y - pd[1], escort.z - pd[2]) + 3.4); fd.set(0, 1, 0, 0); speed = ease(a / 1.5) * 60;
      } else {
        flight(a, s, F); s.lift = F.h; speed = Math.hypot(F.vy, F.vz);
        const raw = Math.atan2(F.vz, Math.max(F.vy, 1e-3)), th = F.vz > 0 ? FL.cap * Math.tanh(raw / FL.cap) : 0; s.tilt = th;
        U.uDrift.value[k].set(F.x, F.z, 0, 0);
        U.uShip.value[k].set(F.h, -th, Math.atan(s.yaw * 0.5) * ease(F.h / 60) + s.sgn * 0.16 * (F.vz / FL.Vz), s.arm * ease((t - 0.1) / 1.1));
        // the wake's foot: on the pad for the first nine seconds, then it runs up the way the ship flew and trails 5 s behind
        const af = a <= 9 ? 0 : Math.min((a - 9) * 1.6, a - 5), arc = F.h + F.z + 3.4;
        if (af <= 0) { ft.set(0, 0, 0, arc); fd.set(0, 1, 0, 0); }
        else { flight(af, s, G0); const vl = Math.max(Math.hypot(G0.vy, G0.vz), 1e-3); ft.set(G0.x, 3.6 + G0.h, G0.z, arc); fd.set(s.sgn * FL.fan * G0.vz / vl, G0.vy / vl, G0.vz / vl, ease(af / 1.5)); }
      }
      // the long lens: far ships are drawn up to ZOOM times larger, true size within 320 m of the eye
      { const dv = U.uDrift.value[k], dx = pd[0] + dv.x - _eye.x, dz = pd[2] + dv.y - _eye.z; dv.w = ZOOM * ease((Math.hypot(dx, dz) - 320) / 540); }
      const star = t <= 0 ? 0 : t < 0.15 ? ease(t / 0.15) : 1 - ease((t - 0.15) / 0.6);
      U.uShipB.value[k].set(star, ease(t / 0.45), t > 0 ? 1 - ease((t - 1.0) / 1.6) : 0, clamp(speed / 45, 0, 1));
      smoke.uSmoke.value[k] = t;
      slip += slipAt(t) * s.slip;
      if (t > 0) latest.push(k);
    }
    latest.sort(byIgnition);
    let mis = 0;
    if (misprint && count >= 12) mis = 0.05 * ease((tJ - ignitionTime(7)) / 0.12) * (1 - ease((tJ - ignitionTime(11)) / 0.12));
    U.uReg.value.set(restReg + slip * slipAmp + mis, -restReg * 0.3 - slip * slipAmp * 0.25);
    // slots 0-3 of the shared blob shadows are the four newest smoke lakes (world space); 4-7 are the world's
    object.updateWorldMatrix(true, false); _m.copy(object.matrixWorld);
    for (let i = 0; i < 4; i++) { const k = latest[latest.length - 1 - i], sv = U.uShadow.value[i];
      if (k === undefined) { sv.set(0, 0, 1, 0); continue; }
      const p = pads[k].position; _p.set(p[0], 0, p[2]).applyMatrix4(_m);
      sv.set(_p.x, _p.z, 14 + 44 * (1 - Math.exp(-ships[k].t * 0.3)), 0.75 * ease(ships[k].t / 1.5)); }
  }
  update(0, 0, null);

  const L = V0.length * 0.5, last = pads[count - 1].position;
  const anchors = {
    pads,                                                     // [{ position:[x,0,z], side:+1 port(+X) | -1 starboard(-X), height }]
    extent: { halfLength: L + 30, halfWidth: side + 30, deckY: 0 },
    rail: [[0, 3, -L - 80], [0, 3, L - 70]],                  // the level run of the sled line, 3 m over the deck
    flyThrough: [[0, 3, -L - 80], [0, 3, -L * 0.5], [0, 3, 0], [0, 3, L - 70], [0, 12, L - 15], [0, 45, L + 40], [0, 124, L + 120], [0, 181, L + 160]],
    portalSeat: { position: [0, 181, L + 160], normal: [0, -Math.sin((55 * Math.PI) / 180), -Math.cos((55 * Math.PI) / 180)], radius: 7, pitchDeg: 55 },
    viewpoints: { entry: [0, 3, -L - 600], staircase: [0, 3, -L + 2 * spacing], beside: [0, 3, last[2] - spacing * 1.5], climb: [0, 60, L + 60] },
    lastShip: [last[0], 45, last[2]],
    ignition: { first: t0, every, duration, last: lastIgn, hold: HOLD },
  };
  return {
    object, radius: aidNum('hr', opts.viewRadius ?? 150), height: aidNum('hh', 190), center: new THREE.Vector3(aidNum('hx', 0), aidNum('hy', 60), aidNum('hz', L * 0.5)), anchors, style, fleet, misprint,
    ground: false, groundY: 0, sky: stage ? stage.sky : null,
    /** journey progress 0..1 (the world's u): ignitions are at (first + every*k) seconds of a `duration`-second trip */
    setProgress(u) { clock = u * duration; },
    /** or drive it in journey seconds directly; pass null to fall back to the demonstration loop */
    setClock(t) { clock = t; },
    /** the world may fly the last ship itself: base of its hull at (x, y, z) hero space, leaning tilt (rad) toward +Z; null hands it back */
    setEscort(x, y, z, tilt) { if (x === null) { escort.on = false; return; } escort.on = true; escort.x = x; escort.y = y; escort.z = z; escort.tilt = tilt; },
    ignitionTime, shipPosition, shipTail, shipAge: (k) => ships[k].t,
    update,
    dispose() { for (const m of [plate, dotsY, dotsC, flame, flameM, smoke.mesh, flappers, paper, hull]) { m.geometry.dispose(); m.material.dispose(); } },
  };
}

// ---------------------------------------------------------------- pad-flappers
// Paper-white kite-shaped fliers perched along the gantry arms; they burst off when their ship lights (same ignition
// clock as the smoke), flap away and are gone. One instanced draw; the brush outline is drawn in the fragment shader.
function flapperMesh(style, perches, uSmoke, rng) {
  const A = [], P = [], Dv = [];
  for (const p of perches) { const a = rng() * Math.PI * 2, up = rng.range(0.15, 0.75), h = Math.sqrt(1 - up * up);
    A.push(p.ship, rng(), rng.range(0.0, 0.45), rng.range(0.85, 1.35)); P.push(p.x, p.y, p.z); Dv.push(Math.cos(a) * h * 0.6 - p.side * 0.75 * h, up, Math.sin(a) * h * 0.6 - 0.55 * h); }
  const geo = new THREE.InstancedBufferGeometry();
  // two wings, each nose - tip - tail; position.x is the wing side, aE the barycentric coordinate for the outline
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 1, 0, -0.15, 0, 0, -1.2, 0, 0, 1, -1, 0, -0.15, 0, 0, -1.2]), 3));
  geo.setAttribute('aE', new THREE.BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1]), 3));
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); geo.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('iD', new THREE.InstancedBufferAttribute(new Float32Array(Dv), 3));
  geo.instanceCount = perches.length; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, uSmoke }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${STYLE_GLSL}
      uniform float uSmoke[${MAX_SHIPS}]; attribute vec4 iA; attribute vec3 iP, iD, aE; varying vec3 vE;
      void main(){ int i = int(iA.x + 0.5); float age = uSmoke[i] - iA.z, fly = clamp(age*3., 0., 1.);
        float a = max(age, 0.);
        vec3 d = normalize(iD + vec3(0., 1e-4, 0.));
        vec3 c = iP + d*(34.*(1. - exp(-a*1.3)) + 11.*a) + vec3(sin(a*1.7 + iA.y*40.), 0.6*sin(a*2.3 + iA.y*20.), cos(a*1.3 + iA.y*9.))*2.5*fly;
        vec3 f = normalize(vec3(d.x, d.y*0.35, d.z) + vec3(1e-4, 0., 0.)), r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(0., 0., 1e-4)), u = cross(r, f);
        float flap = mix(1.05 + 0.08*sin(uTime*2. + iA.y*30.), 0.95*sin(uTime*13. + iA.y*50.), fly);
        float s = iA.w*1.3*(1. - smoothstep(9., 14., a));
        vec3 q = vec3(position.x*cos(flap), abs(position.x)*sin(flap), position.z)*s;
        vE = aE; gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(c + r*q.x + u*q.y + f*q.z, 1.); }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vE;
      void main(){ float e = min(vE.x, min(vE.y, vE.z)); float w = max(0.07, 1.2*fwidth(e));
        gl_FragColor = vec4(mix(uK, uPaperC, smoothstep(w, w*1.3 + 1e-4, e)), 1.); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  return mesh;
}
