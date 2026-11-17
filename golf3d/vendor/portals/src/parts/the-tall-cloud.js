// The Tall Cloud: hero set piece (the cumulonimbus, its travelling shadow, the gust and the rain) and the
// world's STYLE KIT: hand-painted cel animation. Two layers. CELS (out to 700 m): a plum ink line round exactly two flat
// paints and one highlight shape, moving on twos. PAINTED LAYER (sky, cloud, land beyond 700 m): gouache, no line, smooth.
//
// makeStyle(ctx, { palette, side, cloudFoot }) -> one instance for the whole world (pass it to buildHero as opts.style):
//   palette      linear THREE.Colors: cobalt skyMid skyLow | white cream blueGrey violet (the cloud's four values) |
//                petal ochre disc discShade | green greenHi greenShade greenDeep | red wine straw strawShade | ink ringInk |
//                farGreen farBlue river shadowFar shadowNear.   Give every cel thing a lit paint and its shade paint.
//   cel({ lean, inkCap, hiPaint, vertex })  THE cel material (unlit). Geometry needs color (lit), aShade, aHi, aInk, normal:
//                build them with paint(geo, lit, shade, hi) and add the line with inkOf(geo, { card }) then mergeGeometries.
//                Tone = hard step at dot(n, sun) = 0.26. Inside the cast shadow lit -> shade and shade -> bluer(shade): a second
//                colour table, never a multiply. Highlight (aHi > 0.5, lit side only) comes back one drawing late.
//                Line = inverted hull (aInk 1) or card rim (aInk 2), 2.5 px near to 1.5 px far, gone by 700 m, thick on the
//                shade side, boiling 4x a second, registered a hair left of the paint. inkCap (m) is the widest it may get:
//                0.03 for flowers, 0.08 default, more for the railcar. lean: 1 bows instances to the gust and the wind bands.
//                root: GLSL run on `root`/`wp` before the lean (e.g. wrap an instance into a box round the camera; set
//                `keep` 0..1 to shrink it away); vertex: GLSL run on `wp`/`wn` after the lean (poses on uTq).
//   uniforms.uHat (x, z, radius, ceiling y): the hat's own cast shadow, a flat ellipse that repaints whatever lies below it.
//   ground({ rowSpacing, rowNear, field })  the land: dabs then ruled rows then flat gouache, the shadow shape, the gust,
//                dry-brush wind bands, river, the cloud's standing shadow (cloudFoot) and cumulus shadows. field: true reads
//                a vertex attribute aField (1 sunflowers, 0 plain green). rowNear: metres within which you plant real cels.
//                ground uniforms a colourway may repaint: uRule (paint of the far ruling), uEye (radius of a dab's eye),
//                uLine (1: each near row carries a thin line of uDisc, for flowers standing in wheat).
//   makeSky() makeCloud(lobes) makeRain(n, rng, { box, fall, len, near }) makeSplashes(points, rng, size, minH)   the painted dome, gouache lobes, ink rain, splash crowns (minH: least height as a share of the frame).
//   makeRoof() + setRoof(zA, zB, h)   the cloud's underside as a painted lid h metres above the eye whose rim hangs over world
//                z = zB (painted layer, far plane: four ranks of soft pouches, blue-grey at the rim to deep violet overhead);
//                zA = an optional near edge (pass -1e6 for none); buildHero adds it (parts.roof); h = 0 hides it.
//   makeNearCloud(lobes)  the same gouache lobes at arm's length with true depth (the underside passing over, the turrets
//                the flight climbs): [{ x, y, z, r, dark, bias, grow, gx, gy, seed, phase }]; call mesh.userData.sort(camPos)
//                each frame; material uniforms uNearK (0..1 size) and uLid (1: the lobes are pouches of the
//                painted lid and ride inside it, lifted so none hangs below its rim, see setRoof). Lit lobes seen close are
//                drawn as piles of rounds (about 8 m close to, about 20 m further off, each in the cloud's four values) that
//                merge back into flat shapes with distance. curtainMat(): a far rain shaft, a flat blue-grey wash with a
//                ragged fringe of brush ends and darker and paler streaks, on a card (x -1..1, y 0..1; scale.z = how far it is let down). uniforms.uGap0..2 (x, z, half across, half along): pools of sunlight in the shadow.
//   makeNearCloud lobes also take flat (0..1: a shelf or anvil plate, wide and flat); lit lobes are shaded by the world's one
//                sun as the eye sees it, so a turret shows a lit flank and a shade flank and keeps only a rim against the light.
//                Its material also takes uRimK (1: the edge of each lit lobe that faces the sun is drawn as a crescent of the
//                cloud's own cream, the second of its four values; 0: none). The ground takes uFieldSh (0, the default: a cast
//                shadow is one flat violet shape; 1: inside the cloud's shadow the flower field stands on the leaves' shade
//                green). The hat's own ellipse is flat violet either way.
//   uniforms.uTow (x, z, radius of the circle that holds it) and uTowL (14 discs: x, z, radius): the cast shadow of one cloud
//                standing in the plain, its own outline as a union of discs: flat violet on the land and on cels made with
//                cel({ cast: top }) (land-like cels: below the height `top` a cast shape lying on them is flat violet);
//                things that stand in it swap paints like in any cast shadow (default: none).
//   uniforms.uBox, uBoxT (4 each): the short cast shadows of built things, boxes swept down the sun line (see COMMON).
//   uniforms.uHillAt (x, z, radius, 1): where the land is a hill. On it the drawn wind runs the other way: bands that come
//                from behind a +Z flight and overtake it down the slope, the grass leaning downhill as they pass.
//   glsl.COMMON  uniforms + inShadow(xz) shadowDepth bow(xz) windBand(xz) bluer(c) for your own shaders (pass style.uniforms).
//   setShadow(zA, zB) setRain(0..1) update(dt, time, camera)  call update every frame (smooth time, twos, boil, pixel size).
//   SIDE: for a camera flying +Z, screen-right is -X. side = +1 (default) puts the cloud at +X (screen-left) and the sun
//   at -X; so the brief's "x 16" for the railway is x = -16 here (anchors.right). side = -1 mirrors everything.
//
// buildHero(ctx, { style, palette, detail, side, stage, sky, cumulus, rain, ring, weather: 'dry', distance, azimuth,
//                  cloudScale, crossA: [s, z], crossB: [s, z], edgeSpeed })
//   The cloud stands at true scale (14.5 km off, 28 degrees left of +Z, 9 km tall) and is drawn on the far plane, so it
//   needs no camera.far and slides against the land by real parallax. stage: false drops the demo land and flowers (the
//   world brings its own terrain with style.ground()); the sky, cloud, rain and ring stay. Origin = the world origin.
//   returns radius 12 / height 90 (viewer framing only: the piece is the whole sky), center, parts, style, and
//   setClock(s): s = seconds of the brief's 40 s journey. Drives the shadow edges (near edge at z 230 when s = 17, far
//   edge at z 349 when s = 25.5, both moving -Z at 20 m/s) and the rain density. setProgress(u) = setClock(40 u). Until
//   one of them is called the piece runs a demo loop. Or drive setShadow(zA, zB) / setRain(d) yourself.
//   anchors: portalSeat { position (-16 side, 28, 575), facing, radius 7, tilt } | flyThrough (the brief's path, 6 points) |
//   cloudPoi (aim a poi, weight 0.4) | cloudFoot | sun | right | edgeCross, edgeLeave | viewpoints { entry, overFlowers, stage }.
// Cost with the stage: ~79k triangles (76k are the 960 demo sunflowers), 7 draw calls, no lights, no textures, ~80 ms.
// Without the stage: under 3k triangles, 4 draw calls. Assumes post { flat: 1, bloom 0, grade neutral }: colours are exact.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_PALETTE = ['#2757B8', '#F7F3E8', '#F4C21C', '#77B93A', '#2F7044', '#5A4C9C', '#D8362B'];

// ---------------------------------------------------------------- shared GLSL (uniforms + the functions of the style)
// Every material of the world includes this, so the shadow line, the gust and the wind bands agree everywhere.
const COMMON = /* glsl */`
uniform float uTime;    // smooth seconds: camera, sky, cloud (the painted layer)
uniform float uTq;      // time on twos, floor(t*12)/12: every cel pose
uniform float uBoil;    // floor(t*4): outline boil
uniform vec4 uShadow;   // zA, zB = near and far edge of the cloud shadow (world z); zw = the same one drawing late
uniform vec3 uSun;      // toward the sun, world
uniform float uPx;      // world units covered by one pixel at 1 m
uniform float uRain;    // rain density 0..1
uniform float uSide;    // +1: screen-left is +X (true for a +Z course); the wind blows from the cloud side
uniform vec4 uRoof;     // the cloud base overhead: zA, zB (world z of its two edges), its height above the eye, unused
uniform vec4 uHat;      // the hat's own cast shadow: x, z, radius, and the height below which it falls
float h11(float n){ return fract(sin(n*12.9898)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
// scalloped edge offsets (metres, 0..12), "like the cloud that casts it": cusped arcs of three sizes
float scalA(float x){ return 6.5*abs(sin(x*0.031+0.6)) + 3.6*abs(sin(x*0.074+2.1)) + 1.9*abs(sin(x*0.163+4.0)); }
float scalB(float x){ return 6.5*abs(sin(x*0.027+3.3)) + 3.6*abs(sin(x*0.081+0.4)) + 1.9*abs(sin(x*0.149+1.2)); }
// signed depth into the shadow in metres (>0 inside). e = (zA, zB)
// gaps of sunlight inside the shadow: three scalloped ellipses (x, z, half-size across, half-size along), metres inside (>0)
uniform vec4 uGap0, uGap1, uGap2;
float gapOne(vec2 xz, vec4 g){ vec2 q = (xz - g.xy) / max(g.zw, vec2(1e-3)); float r = length(q) * (1. + 0.10*sin(q.x*5.1 + g.x*0.01) + 0.08*sin(q.y*6.3 + 1.7)); return (1. - r) * min(g.z, g.w); }
float gapDepth(vec2 xz){ return max(gapOne(xz, uGap0), max(gapOne(xz, uGap1), gapOne(xz, uGap2))); }
// one more cast shadow, for a cloud that stands by itself in the plain: one flat shape with a cut edge lying where the sun
// throws it, the cloud's own outline: a union of discs, one for each of its rounds (uTowL = x, z, radius of each; uTow =
// x, z, radius of a circle that holds them all; metres inside, >0; far outside it is simply "outside", so take no
// derivative of it)
uniform vec4 uTow; uniform vec3 uTowL[14];
float towDepth(vec2 xz){
  vec2 d0 = xz - uTow.xy; if (dot(d0, d0) > uTow.z*uTow.z) return -1e4;
  float m = -1e4; for (int i = 0; i < 14; i++) m = max(m, uTowL[i].z - length(xz - uTowL[i].xy));
  return m;
}
// the short cast shadows of built things on the land: boxes standing on it, each swept down the sun line as far as its
// height throws it (uBox = x, z of its middle, half-size in x, half-size in z; uBoxT = metres thrown, spacing along z
// when it is one of a row (0: single), first and last z of the row). >0 inside (metres along the sun line). Each
// shadow has its box's own width in metres at every distance.
uniform vec4 uBox[4], uBoxT[4];
float builtDepth(vec3 w){
  vec2 al = normalize(-uSun.xz); float m = -1e4;
  for (int i = 0; i < 4; i++) {
    vec2 q = w.xz - uBox[i].xy, h = uBox[i].zw;
    if (uBoxT[i].y > 0.) q.y -= uBoxT[i].y * floor((clamp(w.z, uBoxT[i].z, uBoxT[i].w) - uBox[i].y) / uBoxT[i].y + 0.5);
    vec2 a = (q - h) / al, b = (q + h) / al, lo = min(a, b), hi = max(a, b);
    m = max(m, min(min(hi.x, hi.y), uBoxT[i].x) - max(max(lo.x, lo.y), 0.));
  }
  return m;
}
float shadowDepth(vec2 xz, vec2 e){ return min(min(xz.y - (e.x - scalA(xz.x)), (e.y + scalB(xz.x)) - xz.y), -gapDepth(xz)); }
float inShadow(vec2 xz){ return step(0., max(shadowDepth(xz, uShadow.xy), towDepth(xz))); }
float inShadowLate(vec2 xz){ return step(0., max(shadowDepth(xz, uShadow.zw), towDepth(xz))); }
// metres inside the hat's shadow (>0 inside), a flat ellipse laid along the sun line; only below the hat
float hatDepth(vec3 w){ vec2 q = (w.xz - uHat.xy) * vec2(1., 0.8); return (uHat.z - length(q)) - 1e3*step(uHat.w, w.y); }
float inShadow3(vec3 w){ return step(0., max(max(shadowDepth(w.xz, uShadow.xy), towDepth(w.xz)), hatDepth(w))); }
float inShadowLate3(vec3 w){ return step(0., max(max(shadowDepth(w.xz, uShadow.zw), towDepth(w.xz)), hatDepth(w))); }
// the gust that runs 30 m ahead of the near edge (and a weaker one behind the far edge): 0..1, in three held poses
float bowRaw(vec2 xz){
  float d = (uShadow.x - scalA(xz.x)) - xz.y;                 // metres ahead of the edge
  float a = sin(3.14159*clamp(d/30., 0., 1.));
  float d2 = xz.y - (uShadow.y + scalB(xz.x));
  return max(a, 0.6*sin(3.14159*clamp(d2/22., 0., 1.)));
}
float bow(vec2 xz){ return floor(bowRaw(xz)*3. + 0.5)/3.; }
// drawn wind: dry-brush bands 6 m wide, 50-120 m long, travelling on twos. returns 0..1 (paint coverage)
// a = metres along the wind (the mark travels as a falls), c = metres across it, sp = lane spacing, p0 + p1 = the gap between marks,
// bw = the width of one bristle in metres (0.29 near; the ground widens it with distance so that a bristle is never under
// two pixels: far off, a band is three or four broad streaks with ragged ends, never a hatching of single pixels)
float brushLane(float a, float c, float k, float sp, float p0, float p1, float bw){
  float lane = floor(c/sp), cl = c - lane*sp - 0.5*sp;
  float per = p0 + p1*h11(lane + 7.3*k);
  float al = a + per*h11(lane*1.7 + k);
  float seg = floor(al/per); al -= seg*per;
  float len = 50. + 70.*h11(seg*3.1 + lane + k);
  cl += 6.*(h11(seg + lane*5.) - 0.5) + 1.5*sin(al*0.05 + lane);
  float w = 1. - abs(cl)/3.;                                   // 6 m wide
  float bristle = h11(floor(cl/bw) + lane*9. + seg);           // dry-brush: bristles run out at different lengths
  float ends = min(al/(8. + 22.*bristle), (len - al)/(6. + 26.*bristle));
  // the brush runs dry at its sides too: the outer bristles skip, leaving dashes of paint, so the mark has no ruled edge
  float wc = clamp(w, 0., 1.), skip = step(fract(al/((4. + 7.*bristle)*bw*3.5) + bristle*5.3), 0.25 + 1.1*wc + 0.3*bristle);
  return step(0.22*bristle*bristle, w)*step(0.35 + 0.5*bristle*(1. - wc), clamp(ends, 0., 1.))*skip*step(0.3, fract(bristle*7.7 + 0.13));   // and some bristles carry no paint at all: streaks, never a pane
}
float windLane(vec2 xz, float k, float bw){
  float ang = 0.5 + 0.07*k;
  vec2 dir = vec2(-uSide*sin(ang), -cos(ang));                 // on the plain it blows from the cloud toward the viewer
  return brushLane(dot(xz, dir) - uTq*(26. + 5.*k) + 131.*k, dot(xz, vec2(dir.y, -dir.x)) + 57.*k, k, 38., 400., 90., bw);
}
// on the hill (uHillAt) the wind that took the hat comes from behind: bands run +Z down the slope, faster than the flight
uniform vec4 uHillAt;     // x, z, radius, 1 (0: no hill)
float onHill(vec2 xz){ return uHillAt.w * step(length(xz - uHillAt.xy), uHillAt.z); }
float hillLane(vec2 xz, float k, float bw){
  vec2 dir = normalize(vec2(uSide*(0.16*k - 0.05), 1.));
  return brushLane(dot(xz, dir) - uTq*(30. + 5.*k) + 43. + 97.*k, dot(xz, vec2(dir.y, -dir.x)) + 11. + 15.*k, k + 4., 30., 150., 60., bw);
}
float windBandW(vec2 xz, float bw){
  float h = onHill(xz);
  return mix(max(windLane(xz, 0., bw), max(windLane(xz, 1., bw), windLane(xz, 2., bw))), max(hillLane(xz, 0., bw), hillLane(xz, 1., bw)), h);
}
float windBand(vec2 xz){ return windBandW(xz, 0.2857); }
// the second colour table: what a paint becomes inside the cast shadow
vec3 bluer(vec3 c){ return vec3(0.60*c.r + 0.05*c.b, 0.50*c.g + 0.20*c.b, 0.90*c.b + 0.40*c.g + 0.027); }   // #2F7044 -> #24566A
`;

// vertex chunk for the inverted-hull ink line. aInk: 0 fill, 1 hull (back faces only), 2 card rim (both faces, pushed back)
const INK_VERT = /* glsl */`
uniform float uInkCap;   // widest the line may get in metres (keeps small things from drowning in ink at distance)
float inkPush(vec3 wpos, vec3 wn, float weight){
  float dist = length(wpos - cameraPosition);
  float px = mix(2.5, 1.5, smoothstep(15., 260., dist)) * (1. - smoothstep(500., 700., dist));
  float thick = mix(1.45, 0.62, smoothstep(-0.3, 0.5, dot(wn, uSun)));            // thin on the lit side, thick in shade
  float boil = 0.82 + 0.36*h11(dot(floor(wpos*1.7), vec3(1., 17., 43.)) + uBoil*7.13); // thick-and-thin, restepped 4x a second
  return min(px * uPx * dist, uInkCap) * smoothstep(0.3, 0.7, uInkCap / max(uPx * dist, 1e-5)) * thick * boil * weight;
}
`;

// ---------------------------------------------------------------- the style kit
export function makeStyle(ctx, opts = {}) {
  const P = opts.palette || DEFAULT_PALETTE, C = (h) => new THREE.Color(h);
  const side = opts.side === -1 ? -1 : 1;
  // paints, named as the brief names them (linear THREE.Color; with post.flat = 1 they reach the screen as written)
  const pal = {
    cobalt: C(P[0]), skyMid: C('#4A7BCB'), skyLow: C('#8FB6E6'),
    white: C(P[1]), cream: C('#F2DDB0'), blueGrey: C('#9FB0D0'), violet: C(P[5]),
    petal: C(P[2]), ochre: C('#B98A2E'), disc: C('#6B4426'), discShade: C('#463247'),
    green: C(P[3]), greenHi: C('#A6D24E'), greenShade: C(P[4]), greenDeep: C('#24566A'),
    red: C(P[6]), wine: C('#7E2440'), straw: C('#E2BE6A'), strawShade: C('#B08B4E'),
    ink: C('#2A1F3D'), ringInk: C('#17121F'),
    farGreen: C('#5FA08A'), farBlue: C('#7FA6CF'), river: C('#CFE3EE'), shadowFar: C('#6A66B4'), shadowNear: C('#5A4C9C'),
  };
  const sun = new THREE.Vector3(-0.55 * side, 0.72, -0.42).normalize();   // high, to screen-right, a little behind us
  const U = {
    uTime: { value: 0 }, uTq: { value: 0 }, uBoil: { value: 0 }, uShadow: { value: new THREE.Vector4(1e6, 1e6 + 300, 1e6, 1e6 + 300) },
    uSun: { value: sun }, uPx: { value: 0.0027 }, uSide: { value: side }, uRes: { value: new THREE.Vector2(800, 450) },
    uInk: { value: pal.ink }, uRain: { value: 0 }, uGap0: { value: new THREE.Vector4(0, -1e6, 1, 1) }, uGap1: { value: new THREE.Vector4(0, -1e6, 1, 1) }, uGap2: { value: new THREE.Vector4(0, -1e6, 1, 1) }, uHillAt: { value: new THREE.Vector4(0, -1e6, 1, 0) }, uTow: { value: new THREE.Vector4(0, -1e7, 0, 0) }, uTowL: { value: Array.from({ length: 14 }, () => new THREE.Vector3(0, -1e7, 0)) }, uBox: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -1e7, 0, 0)) }, uBoxT: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) }, uRoof: { value: new THREE.Vector4(1e6, 1e6 + 300, 0, 0) }, uHat: { value: new THREE.Vector4(0, -1e6, 0.001, -1e6) },
    uCum: { value: [0, 1, 2, 3, 4, 5, 6].map(() => new THREE.Vector4(0, -1e7, 1, 1)) }, uDrift: { value: new THREE.Vector2(-1.7 * side, -3.0) },   // the seven cumulus shadows; the small clouds' drift in metres a second (with the plain's wind: from the cloud, toward us)
  };
  const shared = (extra = {}) => Object.assign({}, U, extra);   // same uniform objects in every material: one update drives all

  // CEL: one unlit material family. Geometry attributes: color (lit paint), aShade (shade paint), aHi (highlight mask 0/1),
  // aInk (0 fill, 1 hull, 2 card rim), normal. o.lean: 1 = plants bow to the gust and the wind bands about their root
  // (instance origin, local y = height). o.vertex: extra GLSL run on `wp` (world pos) before the ink push.
  const cel = (o = {}) => new THREE.ShaderMaterial({
    uniforms: shared({ uHiPaint: { value: o.hiPaint || pal.white }, uLean: { value: o.lean ?? 0 }, uInkCap: { value: o.inkCap ?? 0.08 }, uCastTop: { value: o.cast ?? -1e6 }, uCastPaint: { value: pal.shadowNear } }),
    defines: o.cast !== undefined ? { CAST: 1 } : {},
    side: THREE.DoubleSide, vertexColors: true,
    vertexShader: COMMON + INK_VERT + /* glsl */`
      attribute vec3 aShade; attribute float aHi; attribute float aInk;
      uniform float uLean; uniform vec2 uRes;
      varying vec3 vLit, vShade, vN, vW; varying float vHi, vInk;
      void main(){
        #ifdef USE_INSTANCING
          mat4 mm = modelMatrix * instanceMatrix;
        #else
          mat4 mm = modelMatrix;
        #endif
        vec4 wp = mm * vec4(position, 1.);
        vec3 wn = normalize(mat3(mm) * normal + vec3(0., 1e-5, 0.));
        vec3 root = mm[3].xyz;
        float keep = 1.;
        ${o.root || ''}
        float hgt = wp.y - root.y;
        float wb = 0.4*step(0.5, windBand(root.xz)), hl = onHill(root.xz);
        float lean = uLean * (0.95*bow(root.xz) + wb*(1. - hl)), leanD = uLean * 1.6 * wb * hl;   // held poses, not a simulation; on the hill the band flattens the grass down the slope
        wp.xz += (vec2(-0.25*uSide, -1.) * lean + vec2(0.12*uSide, 1.) * leanD) * hgt * 0.75; wp.y -= (lean*lean + leanD*leanD)*hgt*0.42;
        ${o.vertex || ''}
        wp.xyz = mix(root, wp.xyz, keep);
        if (aInk > 0.5) wp.xyz += wn * inkPush(wp.xyz, wn, 1.) * min(1., keep*4.);   // a plant that is left out leaves no speck of line behind
        if (aInk > 1.5) { vec3 vr = wp.xyz - cameraPosition; wp.xyz += vr / max(length(vr), 1e-3) * 0.05; }   // a card's line lies behind its paint
        vLit = color; vShade = aShade; vN = wn; vW = wp.xyz; vHi = aHi; vInk = aInk;
        gl_Position = projectionMatrix * viewMatrix * wp;
        if (aInk > 0.5) gl_Position.x -= 1.2/uRes.x * gl_Position.w;       // the line sits a hair left of the paint
        if (aInk > 1.5) gl_Position.z += 0.00015 * gl_Position.w;
      }`,
    fragmentShader: COMMON + /* glsl */`
      uniform vec3 uInk, uHiPaint, uCastPaint; uniform float uCastTop;
      varying vec3 vLit, vShade, vN, vW; varying float vHi, vInk;
      void main(){
        if (vInk > 0.5) { if (vInk < 1.5 && gl_FrontFacing) discard; gl_FragColor = vec4(uInk, 1.); return; }
        float d = dot(normalize(vN + vec3(0., 1e-5, 0.)), uSun) - 0.26;
        float lit = smoothstep(-1., 1., d / (fwidth(d) + 1e-4));              // hard edge, 15 degrees past the sun line
        float sh = inShadow3(vW);
        vec3 col = mix(mix(vShade, vLit, lit), mix(bluer(vShade), vShade, lit), sh);   // two paints, two colour tables
        float hm = smoothstep(-1., 1., (vHi - 0.5) / (fwidth(vHi) + 1e-4)) * lit;
        col = mix(col, mix(vLit, uHiPaint, 0.55), hm * (1. - inShadowLate3(vW)));   // the highlight is a drawing late
        #ifdef CAST
          float mC = max(fwidth(vW.x), fwidth(vW.z)) + 1e-4; col = mix(col, uCastPaint, max(step(0., towDepth(vW.xz)), smoothstep(-mC, mC, builtDepth(vW))) * step(vW.y, uCastTop) * (1. - step(0., shadowDepth(vW.xz, uShadow.xy))));   // land-like cels: a cast shadow lying on them is one flat violet shape, its edge cut by the metres a pixel covers as on the land (where the sun reaches: none under the tall cloud)
        #endif
        gl_FragColor = vec4(col, 1.);
      }`,
  });

  // helpers ------------------------------------------------------------------------------------------------------
  // paint(geo, lit, shade, hi): give a geometry its two paints (and a highlight mask: number, or (x,y,z,i)=>0|1)
  const paint = (geo, lit, shade, hi = 0) => {
    const n = geo.attributes.position.count, p = geo.attributes.position;
    const a = new Float32Array(n * 3), b = new Float32Array(n * 3), h = new Float32Array(n), k = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      a[i * 3] = lit.r; a[i * 3 + 1] = lit.g; a[i * 3 + 2] = lit.b; b[i * 3] = shade.r; b[i * 3 + 1] = shade.g; b[i * 3 + 2] = shade.b;
      h[i] = typeof hi === 'function' ? hi(p.getX(i), p.getY(i), p.getZ(i), i) : hi;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.setAttribute('aShade', new THREE.BufferAttribute(b, 3));
    geo.setAttribute('aHi', new THREE.BufferAttribute(h, 1)); geo.setAttribute('aInk', new THREE.BufferAttribute(k, 1));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo.deleteAttribute('uv');
    return geo;
  };
  // inkOf(geo, {card}): the line for a painted geometry, as a second geometry to merge with it. Solids: an inverted hull
  // with normals smoothed across seams. Cards (flat shapes: petals, leaves, sheets): a rim pushed out in the card's plane.
  const inkOf = (geo, o = {}) => {
    const g = geo.clone(), p = g.attributes.position, nrm = g.attributes.normal, n = p.count, ink = g.attributes.aInk;
    if (o.card) {
      const c = new THREE.Vector3(); for (let i = 0; i < n; i++) c.add(new THREE.Vector3().fromBufferAttribute(p, i)); c.multiplyScalar(1 / n);
      for (let i = 0; i < n; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i).sub(c); if (v.lengthSq() < 1e-8) v.set(0, 1, 0); v.normalize(); nrm.setXYZ(i, v.x, v.y, v.z); ink.setX(i, 2); }
    } else {
      const acc = new Map(), key = (i) => Math.round(p.getX(i) * 500) + ',' + Math.round(p.getY(i) * 500) + ',' + Math.round(p.getZ(i) * 500);
      for (let i = 0; i < n; i++) { const k = key(i); let v = acc.get(k); if (!v) acc.set(k, v = new THREE.Vector3()); v.x += nrm.getX(i); v.y += nrm.getY(i); v.z += nrm.getZ(i); }
      for (let i = 0; i < n; i++) { const v = acc.get(key(i)).clone(); if (v.lengthSq() < 1e-8) v.set(0, 1, 0); v.normalize(); nrm.setXYZ(i, v.x, v.y, v.z); ink.setX(i, 1); }
    }
    return g;
  };

  // GROUND: one shader for the whole land. Near (cel layer): ruled sunflower rows (vertex attribute aField = 1) or grass
  // (aField = 0), the shadow as a cut shape that repaints, the gust, the dry-brush wind bands. Beyond 700 m (painted layer):
  // flat gouache going bluer, a river bend, the cloud's own standing shadow and the drifting shadows of the small cumulus.
  // Put it on any terrain mesh; depth is clamped so a 30 km disc survives any camera.far.
  const foot = opts.cloudFoot || new THREE.Vector4(7500 * side, 14100, 7600, 3300);   // x, z, half-size across, half-size along
  const ground = (o = {}) => new THREE.ShaderMaterial({
    uniforms: shared({
      uPetal: { value: pal.petal }, uOchre: { value: pal.ochre }, uGreen: { value: pal.green }, uGreenHi: { value: pal.greenHi },
      uGreenShade: { value: pal.greenShade }, uGreenDeep: { value: pal.greenDeep }, uFarGreen: { value: pal.farGreen }, uFarBlue: { value: pal.farBlue },
      uRiver: { value: pal.river }, uDisc: { value: pal.disc }, uDiscSh: { value: pal.discShade }, uShFar: { value: pal.shadowFar }, uShNear: { value: pal.shadowNear }, uRule: { value: pal.green }, uFieldSh: { value: 0 }, uEye: { value: 0.16 }, uLine: { value: 0 }, uFoot: { value: foot },
      uRow: { value: new THREE.Vector2(o.rowSpacing || 1.5, o.rowNear ?? 0) },   // spacing; distance inside which heads are real cels (stripes fade to leaf green)
    }),
    vertexShader: /* glsl */`
      attribute float aField; varying vec3 vW; varying float vField;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
        #ifdef HAS_FIELD
          vField = aField;
        #else
          vField = 1.;
        #endif
        gl_Position = projectionMatrix * viewMatrix * wp; gl_Position.z = min(gl_Position.z, gl_Position.w * 0.99995); }`,
    defines: o.field ? { HAS_FIELD: 1 } : {},
    fragmentShader: COMMON + /* glsl */`
      uniform vec3 uPetal, uOchre, uGreen, uGreenHi, uGreenShade, uGreenDeep, uFarGreen, uFarBlue, uRiver, uShFar; uniform vec3 uDisc, uDiscSh, uShNear, uRule; uniform float uEye, uLine, uFieldSh; uniform vec4 uFoot; uniform vec2 uRow; uniform vec4 uCum[7]; uniform vec2 uDrift;
      varying vec3 vW; varying float vField;
      void main(){
        vec2 xz = vW.xz; float dist = length(vW - cameraPosition);
        float far = smoothstep(560., 760., dist);
        // shadow: cut edge on the cel layer, soft on the painted layer
        float sdH = hatDepth(vW), sdC = shadowDepth(xz, uShadow.xy), sd = max(sdC, sdH);
        float sh = smoothstep(-1., 1., sd / (fwidth(sd) + 1e-3 + far*14.));
        float inHat = smoothstep(-1., 1., sdH / (fwidth(sdH) + 1e-3));               // the hat's own ellipse: flat violet on any ground
        float mT = max(fwidth(xz.x), fwidth(xz.y)) + 1e-4, inCast = smoothstep(-mT, mT, max(towDepth(xz), builtDepth(vW))) * (1. - step(0., sdC));   // and so are the standing cloud's and the built things' cast shapes (cut by the metres a pixel covers; none under the tall cloud, where no sun reaches)
        sh = max(sh, inCast); inHat = max(inHat, inCast);
        vec2 fq = (xz - uFoot.xy) / uFoot.zw; fq.x += 0.10*sin(xz.y*0.0021) + 0.05*sin(xz.y*0.0067); fq.y += 0.14*abs(sin(xz.x*0.0013 + 1.)) + 0.07*abs(sin(xz.x*0.0041));
        sh = max(sh, 1. - smoothstep(0.94, 1.0, length(fq)));
        // the shadows of the seven small cumulus: one flat violet shape each, scalloped, lying where the sun throws it and
        // drifting with its cloud (uCum = x, z, half-size across, half-size along)
        float cd = -1e4;
        for (int i = 0; i < 7; i++) { vec2 cq = (xz - uCum[i].xy - uDrift*uTime) / uCum[i].zw; float cr = length(cq) * (1. + 0.09*sin(cq.x*5.1 + uCum[i].x*0.01) + 0.07*sin(cq.y*6.3 + 1.7)); cd = max(cd, (1. - cr) * uCum[i].w); }
        float cs = smoothstep(-1., 1., cd / (fwidth(cd) + 1e-3 + far*5.));
        sh = max(sh, cs);
        // rows. Near: hard-edged dabs (a head of petal paint, its eye), each either painted or not, never half there.
        // Then ruled rows of the same two paints; as the rows close up the ruling is redrawn coarser (every 4th, 16th,
        // 64th furrow) so the far plain stays petal paint ruled with thin lines of the same green: never a third colour.
        float rx = xz.x / uRow.x, fw = fwidth(rx) + 1e-4, tri = abs(fract(rx) - 0.5);
        float gust = bow(xz), band = windBandW(xz, max(0.2857, 2.*uPx*dist)) * (1. - smoothstep(480., 700., dist));   // the drawn wind is a mark of the cel layer: it reaches as far as the line does
        float row = floor(rx), rz = xz.y/1.05 + 7.*h11(row), mpp = max(fwidth(xz.x), fwidth(xz.y)) + 1e-4;       // metres per pixel
        vec2 cell = vec2(row, floor(rz)); float hc = h21(cell + 5.3);
        vec2 dc = vec2((fract(rx) - 0.5)*uRow.x, (fract(rz) - 0.5)*1.05) + 0.16*(vec2(h21(cell), h21(cell.yx)) - 0.5);
        float ds = smoothstep(0.11, 0.2, uPx*dist);                                 // a flat dab is never drawn large: under the standing cels it shrinks away (a head lying on the ground with no line would break the cel rule)
        float dl = length(dc), hr = 0.5*(1. - 0.5*gust)*mix(1., 0.8, band)*ds;
        float dk = 1. - smoothstep(0.07, 0.3, mpp);                                  // how many heads are still drawn singly
        float under = smoothstep(uRow.y*0.55, uRow.y*1.25 + 1., dist);               // none beneath the true cels
        float present = step(hc, dk*0.999) * step(fract(hc*7.31), under) * step(0.5, vField);
        float aaD = min(mpp, 0.05);
        float disc = (1. - smoothstep(hr - aaD, hr + aaD, dl)) * present;
        float eye = (1. - smoothstep(uEye*ds - aaD, uEye*ds + aaD, dl)) * present * step(0.5, ds) * step(fract(hc*13.7), 1. - smoothstep(uEye*0.6, uEye*1.5, mpp));   // an eye too small to draw is left out, not blurred
        float duty = 0.27 * (1. - 0.62*gust) * mix(1., 0.86, band) * (1. - dk);      // the stripe widens as the dabs thin out
        float y0 = (1. - smoothstep(duty - fw, duty + fw, tri)) * step(0.004, duty);
        float a1 = smoothstep(0.22, 0.5, fw), a2 = smoothstep(0.22, 0.5, fw/4.), a3 = smoothstep(0.22, 0.5, fw/16.), a4 = smoothstep(0.22, 0.5, fw/64.);
        float t1 = abs(fract(rx/4. + 0.5) - 0.5), t2 = abs(fract(rx/16. + 0.5) - 0.5), t3 = abs(fract(rx/64. + 0.5) - 0.5);
        float g1 = 1. - smoothstep(0.11 - fw/4., 0.11 + fw/4., t1), g2 = 1. - smoothstep(0.085 - fw/16., 0.085 + fw/16., t2), g3 = 1. - smoothstep(0.06 - fw/64., 0.06 + fw/64., t3);
        float coarse = a1*(1. - a2)*g1 + a2*(1. - a3)*g2 + a3*(1. - a4)*g3 + a4*0.1;   // green ruling of the merged plain
        float head = max(disc, (1. - a1)*y0 + a1) * vField; coarse *= vField;
        float headSh = max(disc, (1. - a1)*y0) * vField;                              // in shadow only the near heads keep their ochre
        vec3 leafSun = uGreen, leafSh = mix(uShNear, uGreenShade, vField * uFieldSh * (1. - inHat));                      // a cast shadow is one flat violet shape
        vec3 sunCol = mix(mix(mix(leafSun, uPetal, head), uRule, coarse), uDisc, eye), shCol = mix(mix(mix(leafSh, uGreenDeep, coarse), uOchre, headSh), uDiscSh, eye);
        float line0 = (1. - smoothstep(0.1 - fw, 0.1 + fw, tri)) * (1. - a1) * (1. - dk) * uLine * vField;   // wheat colourways: each row's flowers as one thin line of their paint
        sunCol = mix(sunCol, uDisc, line0); shCol = mix(shCol, uDiscSh, line0);
        sunCol = mix(sunCol, uGreenHi, 0.8*band); shCol = mix(shCol, uShFar, 0.8*band);   // the dry-brush mark itself
        // painted layer: flats in steps, bluer with distance; fields, river
        float dw = dist * (1. + 0.07*sin(xz.x*0.0011 + xz.y*0.0007) + 0.04*sin(xz.x*0.0037 - xz.y*0.0023));
        vec2 pc = floor(xz / vec2(520., 1150.) + vec2(0., 0.31*floor(xz.x/520.)));
        float ptc = h21(pc);
        vec3 f1 = mix(mix(uPetal, uGreen, 0.1), mix(uGreen, uFarGreen, 0.5), step(0.62, ptc));
        f1 = mix(f1, mix(uPetal, uFarGreen, 0.35), step(0.82, ptc));
        vec3 f2 = mix(uFarGreen, mix(uFarGreen, uGreenHi, 0.35), step(0.6, ptc)), f3 = mix(uFarGreen, uFarBlue, 0.6);
        vec3 farSun = mix(f1, f2, smoothstep(1500., 1650., dw)); farSun = mix(farSun, f3, smoothstep(3300., 3600., dw)); farSun = mix(farSun, uFarBlue, smoothstep(6200., 6800., dw));
        float rv = abs(xz.y - (2900. + 520.*sin(xz.x*0.00075 + 0.8) + 0.12*xz.x*uSide)) - (50. + 30.*sin(xz.x*0.002));
        farSun = mix(uRiver, farSun, clamp(smoothstep(-8., 14., rv) + (1. - smoothstep(600., 900., dist)), 0., 1.));
        farSun = clamp(farSun, 0., 1.);
        vec3 farSh = mix(uShFar, uFarBlue, 0.55*smoothstep(3300., 6800., dw));
        float farS = (smoothstep(560., 574., dw) + smoothstep(652., 666., dw) + smoothstep(746., 760., dw)) / 3.;   // seen from the height of the climb a smooth merge is a gradient: three flat steps
        vec3 col = mix(mix(sunCol, farSun, farS), mix(shCol, farSh, (smoothstep(230., 250., dw) + smoothstep(380., 410., dw) + smoothstep(540., 580., dw)) / 3.), sh);   // the far merge in three flat bands, not a gradient
        gl_FragColor = vec4(col, 1.);
      }`,
  });

  // SKY: the painted dome, no line: cobalt overhead, paling in three brushed steps you can just see; far hills. Smooth time.
  const sky = () => new THREE.ShaderMaterial({
    uniforms: shared({ uA: { value: pal.cobalt }, uB: { value: pal.skyMid }, uC: { value: pal.skyLow }, uHill: { value: pal.farBlue } }),
    side: THREE.BackSide, depthWrite: false,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
      if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: COMMON + /* glsl */`
      uniform vec3 uA, uB, uC, uHill; varying vec3 vD;
      void main(){
        vec3 d = normalize(vD + vec3(0., 1e-5, 0.)); float az = atan(d.z, abs(d.x) < 1e-5 ? 1e-5 : d.x);
        float h = d.y + 0.008*sin(az*5. + 1.) + 0.004*sin(az*17.) + 0.003*sin(az*41. + d.y*30.);   // the brush wanders
        vec3 col = mix(uC, uB, smoothstep(0.10, 0.15, h)); col = mix(col, uA, smoothstep(0.29, 0.36, h));
        col = mix(col, mix(uC, vec3(1.), 0.22), 1. - smoothstep(0.022, 0.034, h));                 // palest wash at the horizon
        float hill = 0.012 + 0.006*sin(az*7. + 2.) + 0.004*sin(az*19.) + 0.0025*sin(az*43.);
        col = mix(col, mix(uHill, uC, 0.35), 1. - smoothstep(hill - 0.0015, hill + 0.0015, d.y));
        gl_FragColor = vec4(col, 1.);
      }`,
  });

  // GOUACHE CLOUD: instanced lobes on the far plane, drawn in instance order (back to front). Each lobe is a soft-edged
  // disc shaded as a dome and cut into exactly four values; it swells and rolls in smooth time. No line anywhere.
  const cloudMat = () => new THREE.ShaderMaterial({
    uniforms: shared({ uW: { value: pal.white }, uCr: { value: pal.cream }, uBg: { value: pal.blueGrey }, uVi: { value: pal.violet }, uHz: { value: pal.skyLow } }),
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime; uniform vec2 uDrift;
      attribute vec3 iPos; attribute vec4 iRad; attribute vec4 iAux; attribute vec3 iBase; attribute float iDrift;
      varying vec2 vQ; varying float vY; varying vec4 vAux; varying vec3 vBase; varying float vRoll;
      void main(){
        float br = sin(uTime*1.05 + iRad.z), br2 = sin(uTime*0.61 + iRad.z*1.7);
        float sw = 1. + iRad.w*(0.075*br + 0.05*br2);
        vec3 ip = iPos; ip.xz += iDrift * uDrift * uTime;                               // the small cumulus drift (smooth time)
        vec2 d = ip.xz - cameraPosition.xz; d += vec2(1e-3, 0.);
        vec2 r2 = normalize(vec2(-d.y, d.x));
        vec2 q = position.xy * 1.18;
        vec2 off = q * iRad.xy * sw + iAux.xy * iRad.x * iRad.w * (0.13*br + 0.07*br2 + 0.2);
        vec3 wp = ip + vec3(r2.x, 0., r2.y)*off.x + vec3(0., off.y, 0.);
        vQ = q; vY = wp.y; vAux = iAux; vBase = iBase; vRoll = uTime*0.22*iRad.w + 0.5*br2*iRad.w;
        vec4 p = projectionMatrix * viewMatrix * vec4(wp, 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uW, uCr, uBg, uVi, uHz;
      varying vec2 vQ; varying float vY; varying vec4 vAux; varying vec3 vBase; varying float vRoll;
      void main(){
        vec2 q = vQ; float s = vAux.w;
        float ang = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x);
        float wob = 1. + 0.07*sin(ang*3. + s*6.3 + vRoll) + 0.05*sin(ang*5. - s*11. - vRoll*1.6) + 0.025*sin(ang*9. + s*29.);
        vec2 qn = q / wob; float r = length(qn);
        float a = 1. - smoothstep(0.93, 1.0, r);                                       // soft 3 percent edge
        a *= smoothstep(-0.5, 0.5, (vY - vBase.x) / max(vBase.z*0.06, 1.));            // the flat base
        if (a < 0.004) discard;
        vec3 n = vec3(qn, sqrt(max(0., 1. - r*r*0.92)));
        float t = 0.8*dot(n, vec3(0.56, 0.62, 0.55)) + vAux.z + 0.05*sin(q.x*7. + s*9.)*sin(q.y*6. + s*4.);
        t = max(t, -0.24);                                                             // a lobe's own shade stops at blue-grey
        t -= 1.5 * (1. - smoothstep(0., 1., (vY - vBase.x) / max(vBase.z, 1.)));       // violet under the shelf
        vec3 col = mix(uVi, uBg, smoothstep(-0.36, -0.30, t));
        col = mix(col, uCr, smoothstep(0.13, 0.19, t)); col = mix(col, uW, smoothstep(0.31, 0.37, t));
        gl_FragColor = vec4(mix(col, uHz, vBase.y), a);
      }`,
  });

  // ROOF: the cloud's underside as it closes over us. Painted layer: gouache on the far plane, no line, soft edges. It is
  // painted in the sky's own slope space (q = up / forward, sx = sideways / forward for a +Z course), so on screen it is a
  // lid whose rim hangs at the slope uRoof.z / (uRoof.y - eye z): a row of round-bottomed pouches with blue-grey lower
  // edges, and behind the rim three more ranks of larger pouches, each with a lighter belly and a darker tuck, stepping
  // from blue-grey at the rim to the deepest violet overhead. It drifts in smooth time. uRoof.x is an optional near edge
  // (world z) for a lid that comes on from ahead; uRoof.z = 0 hides it.
  const roofMat = () => new THREE.ShaderMaterial({
    uniforms: shared({ uVi: { value: pal.violet }, uBg: { value: pal.blueGrey } }),
    side: THREE.BackSide, depthWrite: false, transparent: true,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
      if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: COMMON + /* glsl */`
      uniform vec3 uVi, uBg; varying vec3 vD;
      // a rank of pouches: 1 at the cusp between two, down to 0 at the round belly of the deepest; every pouch hangs to its own depth
      float arc(float x, float k){ float i = floor(x), t = 2.*(x - i) - 1.; return 1. - (0.5 + 0.5*h11(i*7.3 + k)) * sqrt(max(0., 1. - t*t)); }
      float st(float x, float w){ return smoothstep(-w, w, x); }
      void main(){
        vec3 d = normalize(vD + vec3(0., 1e-5, 0.));
        float fz = max(d.z, 0.05);
        float q = d.y / fz, sx = clamp(d.x / fz, -6., 6.) * uSide;
        float fw = fwidth(q) + 1e-4, e = 1.5*fw;
        float D = uRoof.y - cameraPosition.z, DA = uRoof.x - cameraPosition.z;
        if (d.y < 0.012 || uRoof.z < 0.5 || D < 1.) discard;
        float q0 = uRoof.z / max(D, 1.);                                                   // the slope the rim hangs at
        float dr = uTime*0.006, sw = sx + 0.07*sin(sx*4.3 + 1.7) + 0.03*sin(sx*9.1 + 0.4);   // the hand's uneven spacing; a slow drift
        float s2 = sx + 0.11*sin(sx*2.6 + 4.1) + 0.04*sin(sx*7.7 + 2.9), s3 = sx + 0.16*sin(sx*1.9 + 0.3);   // each rank spaced by a different hand
        float b0 = q0 - 0.016 + 0.072*arc(sw/0.34 + 0.20 + dr, 1.) + 0.012*arc(sw/0.125 + 0.6 + dr*2., 2.);
        float b1 = q0 + 0.090 + 0.092*arc(s2/0.47 + 0.63 + dr*0.8, 3.) + 0.012*sin(sx*1.7 + 0.8);
        float b2 = q0 + 0.235 + 0.125*arc(s3/0.74 + 0.31 + dr*0.6, 4.) + 0.016*sin(sx*1.3 + 2.4);
        float b3 = q0 + 0.440 + 0.170*arc(sw/1.17 + 0.77 + dr*0.5, 5.);
        float a = st(q - b0, fw);
        if (DA > 1.) a *= 1. - st(q - uRoof.z / max(DA, 1.), 2.*fw);
        if (a < 0.004) discard;
        vec3 mid = mix(uVi, uBg, 0.5), deep = uVi*vec3(0.84, 0.82, 0.9);
        // rank 0 (the rim): a blue-grey lower edge, a middle belly, a violet tuck under the rank behind
        vec3 col = mix(uBg, mid, st(q - b0 - (0.015 + 0.007*sin(sx*9. + 2.)), e));
        col = mix(col, uVi, st(q - mix(b0, b1, 0.62 + 0.12*sin(sx*6.1 + 1.)), e));
        // rank 1: middle belly, violet, deep tuck
        vec3 c1 = mix(mid, uVi, st(q - mix(b1, b2, 0.36 + 0.10*sin(sx*4.7 + 3.)), e));
        c1 = mix(c1, deep, st(q - mix(b1, b2, 0.80 + 0.08*sin(sx*3.3 + 0.5)), e));
        col = mix(col, c1, st(q - b1, e));
        // rank 2: violet belly, deep tuck;  rank 3 (overhead): a thin violet belly, then deep
        vec3 c2 = mix(uVi, deep, st(q - mix(b2, b3, 0.48 + 0.12*sin(sx*2.9 + 2.2)), e));
        col = mix(col, c2, st(q - b2, e));
        vec3 c3 = mix(uVi, deep, st(q - b3 - (0.07 + 0.03*sin(sx*2.1 + 1.3)), e));
        col = mix(col, c3, st(q - b3, e));
        gl_FragColor = vec4(col, a);
      }`,
  });
  const makeRoof = () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), roofMat()); m.frustumCulled = false; m.renderOrder = -0.85; return m; };

  // NEAR CLOUD: the same gouache lobes at arm's length, for the cloud's underside as it passes over and for the turrets the
  // flight climbs. Painted layer (no line), but with true depth so land and cels sit in front of and behind it; every lobe
  // faces the eye, is cut into exactly four values, breathes in smooth time, and is drawn far to near (sort(camPos) each
  // frame). iRad = radius, dark (0 lit turret: violet, blue-grey, cream, white; 1 underside: deep violet, violet, middle,
  // blue-grey belly), phase, grow.  iAux = growth direction x, y, tone bias, seed.
  const nearMat = () => new THREE.ShaderMaterial({
    uniforms: shared({ uW: { value: pal.white }, uCr: { value: pal.cream }, uBg: { value: pal.blueGrey }, uVi: { value: pal.violet }, uNearK: { value: 1 }, uLid: { value: 0 }, uRimK: { value: 0 }, uCells: { value: 1 } }),   // uRimK 1: the sunward edge of each lit lobe is a crescent of the cloud's own cream
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime, uNearK, uLid; uniform vec4 uRoof; uniform vec3 uSun;
      attribute vec3 iPos; attribute vec4 iRad; attribute vec4 iAux; attribute float iFlat;
      varying vec2 vQ; varying vec4 vAux; varying float vRoll, vDark, vRad, vFlat; varying vec3 vSunV;
      void main(){
        // uLid 1 (the underside's pouches): a pouch hangs from the painted lid and is never seen apart from it. While the
        // lid's rim (slope uRoof.z over the distance to it) stands above a pouch's place, the pouch rides up inside the
        // lid, whole and at full size, and comes down with the rim as the base closes over; it leaves the same way.
        vec3 ip = iPos;
        { float dz = max(ip.z - cameraPosition.z, 0.), q0 = uRoof.z / max(uRoof.y - cameraPosition.z, 1.);
          ip.y += uLid * max(0., (q0 + 0.035) * dz - (ip.y - 0.95*iRad.x - cameraPosition.y)); }
        float br = sin(uTime*1.05 + iRad.z), br2 = sin(uTime*0.61 + iRad.z*1.7);
        float sw = 1. + iRad.w*(0.06*br + 0.04*br2);
        vec3 toC = cameraPosition - ip; float dist = max(length(toC), 1e-3); toC /= dist;
        vec3 rt = normalize(cross(vec3(0., 1., 0.), toC) + vec3(1e-4, 0., 0.)); vec3 upv = cross(toC, rt);
        vec2 q = position.xy * 1.12;
        float k = uNearK * smoothstep(iRad.x*1.02, iRad.x*1.3, dist);                    // a lobe never stands across the lens
        vec2 off = (q*sw + iAux.xy*iRad.w*(0.11*br + 0.06*br2)) * iRad.x * k; off.y *= iFlat;   // iFlat < 1: a shelf or an anvil plate, wide and flat
        // the sun as the eye sees it (turned into the lobe's own frame): fly round a turret and its lit flank and its
        // shade flank change places; looking toward the sun a lobe keeps only a lit rim
        vSunV = normalize(vec3(dot(uSun, rt), dot(uSun, upv)*0.86, dot(uSun, toC)) + vec3(0., 1e-4, 0.));
        vec3 wp = ip + rt*off.x + upv*off.y;
        vQ = q; vAux = iAux; vDark = iRad.y; vRad = iRad.x; vFlat = iFlat; vRoll = uTime*0.2*iRad.w + 0.5*br2*iRad.w;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uW, uCr, uBg, uVi; uniform float uRimK, uCells;
      varying vec2 vQ; varying vec4 vAux; varying float vRoll, vDark, vRad, vFlat; varying vec3 vSunV;
      float st(float x, float w){ return smoothstep(-w, w, x); }
      vec2 h22(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))))*43758.5453); }
      // rounds laid like a painter lays them, the lower over the upper: each keeps the clean arc of its top, and the round
      // behind tucks into shade just above that arc. Returns (the round's tone under the light, 0..1 how deep in a tuck).
      vec2 rounds(vec2 p, float bias, vec3 sunP){
        vec2 ci = floor(p), cf = p - ci, nb = vec2(0.); float key = 9., nz = 0., occ = 1.;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 o = vec2(float(i), float(j)), hh = h22(ci + o), d = o + 0.12 + 0.76*hh - cf;
          float rr = 0.56 + 0.44*hh.y, dd = dot(d, d), k2 = d.y + 0.3*hh.x;
          if (dd < rr*rr) { if (k2 < key) { key = k2; nb = -d / rr; nz = sqrt(max(0., 1. - dd / (rr*rr))); } }
          else if (d.y < 0.) occ = min(occ, sqrt(dd) - rr);
        }
        return vec2(key < 8. ? 0.8*dot(vec3(nb, nz), sunP) + bias : bias - 0.3, 1. - smoothstep(0.0, 0.2, occ));
      }
      void main(){
        vec2 q = vQ; float s = vAux.w;
        float ang = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x);
        float wob = 1. + 0.06*sin(ang*3. + s*6.3 + vRoll) + 0.045*sin(ang*5. - s*11. - vRoll*1.6) + 0.03*sin(ang*8. + s*29.) + 0.02*sin(ang*13. - s*17.);
        vec2 qn = q / wob; float r = length(qn);
        float ew = clamp(fwidth(r)*1.5, 0.003, 0.05);
        float a = 1. - smoothstep(1. - ew, 1., r);
        if (a < 0.004) discard;
        vec3 n = vec3(qn, sqrt(max(0., 1. - r*r*0.92)));
        // the brush builds each lobe out of smaller rounds: scallops inside the big shape
        float bump = 0.16*sin(qn.x*9. + s*20. + 2.*sin(qn.y*5. + s*9.)) * sin(qn.y*8. + s*7. + 1.5*sin(qn.x*4. - s*3.)) + 0.05*sin(qn.x*17. - s*13.)*sin(qn.y*15. + s*31.);
        // the painter's light: the world's one sun, on the side of the picture where it stands, but laid across the form
        // (never flat on to it), so that every round turns through all of the cloud's values: white on its sunward side,
        // cream, blue-grey underneath, violet in the tucks
        vec3 sunP = normalize(vec3(vSunV.xy, clamp(vSunV.z, -0.4, 0.24)));
        float tl = 0.8*dot(n, mix(vSunV, sunP, uCells)) + vAux.z + bump;
        float td = 0.8*dot(n, vec3(0.10, -0.80, 0.30)) + vAux.z + bump - 0.14;
        // a lit lobe is a pile of rounds, each lit on its sunward side, turning to the shade paints, with the darkest in
        // the tucks between rounds. Close to, the rounds are small (about 8 m); further off the same lobe is drawn with
        // larger rounds (about 20 m), so that a round is never under about twelve pixels and a tuck is never a hairline;
        // beyond that the lobe is its own flat shapes.
        float cells = clamp(vRad / 8.5, 2.3, 8.5) * (0.72 + 0.6*fract(s*7.31));
        vec2 q2 = qn*vec2(1., vFlat);                                              // (a shelf's rounds are as round on screen as a turret's)
        vec2 pF = q2*cells + vec2(s*37., s*91.); pF += 0.35*sin(pF.yx*1.3 + s*5.);   // the hand's uneven spacing
        vec2 pC = q2*cells*0.42 + vec2(s*53., s*17.); pC += 0.35*sin(pC.yx*1.3 + s*8.);
        float rpx = 2. / (fwidth(vQ.x) + fwidth(vQ.y) + 1e-5);                     // the lobe's radius on the frame, in pixels
        float fwF = fwidth(pF.x) + fwidth(pF.y), wOn = uCells * (1. - vDark) * max(smoothstep(9., 16., vRad), smoothstep(80., 140., rpx));   // a small lobe is one shape, until it stands large in the frame: then it too is a pile of rounds
        float wF = wOn * (1. - smoothstep(0.09, 0.17, fwF)), wC = wOn * (1. - smoothstep(0.09, 0.17, fwF*0.42)) * smoothstep(0.07, 0.15, fwF);
        vec2 rF = wF > 0.002 ? rounds(pF, vAux.z, sunP) : vec2(0.), rC = wC > 0.002 ? rounds(pC, vAux.z, sunP) : vec2(0.);
        float tb = max(tl, -0.24);
        float kr = 0.6 + 0.13*smoothstep(0.05, -0.35, tl - bump);                // on the lobe's shade side a round still turns from a paler cap to its tuck (a shape, never only a line between rounds)
        float kc = 0.07 + 0.29*smoothstep(-0.3, 0.1, tl - bump);                 // the tuck between two rounds is a drawn shape in the light; in the lobe's shade it is left out (never a net of dark lines)
        tb = mix(tb, mix(tl - bump, rC.x, kr) + 0.36*bump - kc*rC.y, wC);        // the big form's own lit side and shade side lead; the rounds are drawn inside them
        tb = mix(tb, mix(tl - bump, rF.x, kr) + 0.36*bump - kc*rF.y, wF);
        float t = mix(tb, td, vDark), e = min(fwidth(t)*1.2 + 0.004, 0.03);   // flat paints at every size: a lobe small on screen keeps four values, never a ramp
        // uRimK: the edge of a lit lobe that faces the sun is drawn as one crescent of the cloud's own cream (the second of
        // its four values, under the world's one sun), so a turret's lit flank reads against the white behind it
        float rimv = dot(qn, vSunV.xy) / max(length(vSunV.xy), 0.2) + 0.06*sin(ang*7. + s*40.) - 0.70;
        float rim = st(rimv, fwidth(rimv)*1.2 + 0.004) * uRimK * (1. - vDark) * st(t - 0.16, e);   // only where the lobe is in its lit paints
        vec3 mid = mix(uVi, uBg, 0.5), deep = uVi*vec3(0.84, 0.82, 0.9);
        vec3 lit = mix(uVi, uBg, st(t + 0.33, e)); lit = mix(lit, uCr, st(t - 0.16, e)); lit = mix(lit, uW, st(t - 0.39, e));
        vec3 dk = mix(deep, uVi, st(t + 0.02, e)); dk = mix(dk, mid, st(t - 0.30, e)); dk = mix(dk, uBg, st(t - 0.52, e));
        lit = mix(lit, uCr, rim);
        gl_FragColor = vec4(mix(lit, dk, vDark), a);
      }`,
  });
  // makeNearCloud(lobes): lobes = [{ x, y, z, r, dark, phase, grow, gx, gy, bias, seed }]. Returns the mesh; call
  // mesh.userData.sort(camPos) each frame it is in view (an insertion sort of a list that is nearly in order already).
  const makeNearCloud = (lobes) => {
    const n = lobes.length, g = quad(), a = new Float32Array(n * 3), b = new Float32Array(n * 4), c = new Float32Array(n * 4), fl = new Float32Array(n);
    const order = lobes.map((l, i) => i), key = new Float32Array(n);
    const fill = () => { for (let k = 0; k < n; k++) { const l = lobes[order[k]]; a[k * 3] = l.x; a[k * 3 + 1] = l.y; a[k * 3 + 2] = l.z;
      b[k * 4] = l.r; b[k * 4 + 1] = l.dark ? 1 : 0; b[k * 4 + 2] = l.phase ?? 0; b[k * 4 + 3] = l.grow ?? 0.5; c[k * 4] = l.gx ?? 0; c[k * 4 + 1] = l.gy ?? 1; c[k * 4 + 2] = l.bias ?? 0; c[k * 4 + 3] = l.seed ?? 0; fl[k] = l.flat ?? 1; } };
    fill();
    const A = new THREE.InstancedBufferAttribute(a, 3), B = new THREE.InstancedBufferAttribute(b, 4), Cc = new THREE.InstancedBufferAttribute(c, 4), Fl = new THREE.InstancedBufferAttribute(fl, 1);
    g.setAttribute('iFlat', Fl); g.setAttribute('iPos', A); g.setAttribute('iRad', B); g.setAttribute('iAux', Cc); g.instanceCount = n;
    const m = new THREE.Mesh(g, nearMat()); m.frustumCulled = false; m.renderOrder = -0.8;
    m.userData.lobes = lobes;
    m.userData.sort = (cp, force = false) => {                                  // force: the lobes themselves were moved or resized this frame
      for (let i = 0; i < n; i++) { const l = lobes[i], dx = l.x - cp.x, dy = l.y - cp.y, dz = l.z - cp.z; key[i] = dx * dx + dy * dy + dz * dz; }
      let moved = false;
      for (let i = 1; i < n; i++) { const o = order[i], kk = key[o]; let j = i - 1; while (j >= 0 && key[order[j]] < kk) { order[j + 1] = order[j]; j--; moved = true; } order[j + 1] = o; }
      if (moved || force) { fill(); A.needsUpdate = true; B.needsUpdate = true; Cc.needsUpdate = true; Fl.needsUpdate = true; }
    };
    return m;
  };

  // RAIN SHAFT (painted layer): far rain hanging from the cloud's base, as the live version has it (the authors' amendment
  // of 17:50: the rain is pale), drawn with a brush, not ruled: one wash of the cloud's blue-grey laid in strokes of
  // uneven width (about three metres), flat and opaque with only its rim softened, whole where it leaves the base and
  // breaking below into a ragged fringe of brush ends, each lifting to a point at its own height, the outer ones soonest
  // (no straight side, no straight foot); and laid into it, darker streaks (the underside's middle value) and paler
  // ones (the rain's own paint). It slants with the gust, the way the near strokes do; the streaks pinch and the pinch
  // slides down, and the feet waver, in smooth time. A vertical card (x across -1..1, y 0 at the ground to 1 at the
  // base). The world draws it before the painted lid, so its head is always inside the base.
  // The card's scale.z carries how far the shaft is let down (1: to the ground; 0: drawn up into the base): the strokes
  // keep their size and their ragged feet as it rises (the card itself is never squashed).
  // Every random number is taken from whole numbers (the lane and a seed rounded in the fragment shader), so a stroke's
  // paint and shape never change from one pixel to the next.
  const curtainMat = () => new THREE.ShaderMaterial({
    uniforms: shared({ uBg: { value: pal.blueGrey }, uVi: { value: pal.violet }, uPale: { value: C('#C9C8E8') } }), side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`uniform float uSide; varying vec2 vUv; varying vec3 vK; void main(){ vUv = position.xy; vec4 wp = modelMatrix * vec4(position.x, position.y, 0., 1.);
      wp.x -= (1. - position.y) * 0.15 * modelMatrix[1].y * uSide;                         // slanting with the gust (the wind blows from the cloud's side)
      vK = vec3(floor(fract(modelMatrix[3].x*0.0137 + modelMatrix[0].x*0.071)*61.), max(6., floor(length(modelMatrix[0].xyz) / 1.5)), 1. - length(modelMatrix[2].xyz));   // seed (a whole number), lanes (about 3 m each), lift
      gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: COMMON + /* glsl */`
      uniform vec3 uBg, uVi, uPale; varying vec2 vUv; varying vec3 vK;
      void main(){
        float y = vUv.y, x = vUv.x, sd = floor(vK.x + 0.5), L = floor(vK.y + 0.5), lift = clamp(vK.z, 0., 1.);
        float xs = (x + 1.) * 0.5 * L; xs += 0.3*sin(xs*1.9 + sd) + 0.22*sin(y*5.3 + sd*1.7) + 0.09*sin(y*12.1 + x*3. + sd*0.9);   // the hand's uneven spacing, and no stroke falls dead straight
        float lane = floor(xs), lx = fract(xs) - 0.5;
        float b = h11(lane*1.31 + sd*7.13), b2 = h11(lane*1.7 + 3. + sd*3.77), b3 = h11(lane*2.3 + 11. + sd*5.21);
        float xc = abs((lane + 0.5) / L * 2. - 1.);                                          // how far out this stroke hangs (0 the middle, 1 the side)
        float foot = lift + 0.02 + 0.2*b*b + 0.5*smoothstep(0.55, 1., xc)*(0.6 + 0.8*b) + 0.02*sin(uTime*0.5 + lane*2.1);   // each stroke runs dry at its own height, the outer ones soonest
        float up = y - foot, cx = lx - 0.14*(b2 - 0.5) - 0.03*sin(y*6. + b*20.), aa = fwidth(xs)*1.3 + 1e-4;
        // the wash: one flat paint (the cloud's blue-grey, the paint of the base's own rim). Each stroke of it lifts to a
        // point at its foot and broadens upward until it lies against its neighbours, so the shaft is a whole shape where
        // it leaves the base and a ragged fringe of brush ends below
        float hb = (0.2 + 0.4*b3) * smoothstep(0., 0.12, up) + 0.5*smoothstep(0.06, 0.3, up);
        float a = smoothstep(0., aa, hb - abs(cx)) * step(0., up);                           // flat and opaque: only the rim is softened
        if (a < 0.004) discard;
        // the streaks laid into it: about half the strokes carry a narrower one, darker (the underside's middle value) or
        // paler (the rain's own paint), which pinches where the brush ran dry; the pinch slides down
        float brk = abs(fract(y*1.1 + b3*5. + uTime*0.16) - 0.5);
        float hs = (0.1 + 0.22*b) * smoothstep(0., 0.2, up) * (1. - 0.8*smoothstep(0.42, 0.48, brk));
        float st = smoothstep(0., aa, hs - abs(cx + 0.12*(b3 - 0.5))) * (1. - step(0.36, b2)*step(b2, 0.64));
        // deeper toward the base: above its own ragged height each stroke of the wash is laid a step deeper (a quarter of
        // the way to the underside's violet: still the pale paint's family, lighter than the dark streaks), so a shaft is
        // deepest where it leaves the base and palest at its fringe
        vec3 wash = mix(uBg, uVi, 0.25 * step(0.56 + 0.26*b + 0.05*sin(lane*3.3 + sd), y));
        vec3 col = mix(wash, b2 < 0.36 ? mix(uVi, uBg, 0.5) : uPale, st);
        gl_FragColor = vec4(col, a);
      }`,
  });

  // RAIN: the near strokes, as the live version draws them (the authors' amendment of 17:50: the rain is pale): short
  // tapered strokes of one pale paint in a box that follows the camera, three alternating drawings; density from U.uRain (0..1).
  // o.box: the box the strokes fill (metres across, high, deep); o.fall: where the first drawing stands above the box's
  // middle and how far a stroke falls from one drawing to the next; o.len: a stroke's least length and how much longer
  // it may be; o.near: none is drawn nearer the eye than this. (Defaults: the box round the camera of the brief.)
  const rainMat = (o = {}) => new THREE.ShaderMaterial({
    uniforms: shared({ uPale: { value: C('#C9C8E8') }, uRBox: { value: new THREE.Vector3(...(o.box || [46, 30, 60])) }, uRFall: { value: new THREE.Vector2(...(o.fall || [7, 7.5])) }, uRLen: { value: new THREE.Vector3(...(o.len || [0.9, 1.1]), o.near ?? 4.5) } }), side: THREE.DoubleSide,
    vertexShader: COMMON + /* glsl */`
      attribute vec4 iSeed; uniform vec3 uRBox, uRLen; uniform vec2 uRFall;
      void main(){
        float fr = floor(uTq*12. + 0.5) + floor(iSeed.w*97.);
        float pose = mod(fr, 3.), cyc = floor(fr/3.);
        vec3 box = uRBox;
        vec3 sp = fract(iSeed.xyz + vec3(h11(cyc + iSeed.x*31.), 0., h11(cyc*1.3 + iSeed.z*17.))) * box;
        vec3 c = mod(sp - cameraPosition, box) - 0.5*box; c.y = (iSeed.y - 0.5)*box.y + uRFall.x - pose*uRFall.y;   // three held drawings, falling
        c += cameraPosition;
        vec3 ax = normalize(vec3(-0.10*uSide, -1., -0.24));                              // slanting with the gust
        float len = uRLen.x + uRLen.y*h11(iSeed.w*13. + pose);
        vec3 toC = cameraPosition - c; vec3 sd = cross(ax, toC); sd = sd / max(length(sd), 1e-4);
        float dist = length(toC);
        float w = max(0.02, 1.5*uPx*dist) * (0.7 + 0.6*h11(fr + iSeed.x*5.));
        vec3 wp = c + ax*position.y*len + sd*position.x*w;
        wp.x += 0.06*sin(position.y*9. + pose*2.)*step(0.5, pose);                       // the hand wobbles the second drawing
        float on = step(iSeed.w, uRain) * step(uRLen.z, dist);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.) * on;
      }`,
    fragmentShader: /* glsl */`uniform vec3 uPale; void main(){ gl_FragColor = vec4(uPale, 1.); }`,   // rain is drawn in a pale paint, not in ink: it reads as falling water against the dark base and the violet field
  });
  // SPLASH: four-drawing ink crowns at given points (instance attribute iSeed = x, y, z, random 0..1). Play only in rain.
  const splashMat = () => new THREE.ShaderMaterial({
    uniforms: shared({ uPale: { value: pal.white }, uSz: { value: 1 }, uMinH: { value: 0 } }), side: THREE.DoubleSide,
    vertexShader: COMMON + /* glsl */`
      attribute vec4 iSeed; varying float vK; uniform float uSz, uMinH; uniform vec2 uRes;
      void main(){
        float fr = floor(uTq*12. + 0.5) + floor(iSeed.w*53.);
        float f = mod(fr, 11.);                                                         // drawings 0..3 show, then it waits
        float on = step(f, 3.5) * step(fract(iSeed.w*7.31 + floor(fr/11.)*0.37), uRain) * step(0.5, inShadow((modelMatrix * vec4(iSeed.xyz, 1.)).xz) + step(0.99, uRain));
        float sc = (0.45 + 0.22*f) * (0.7 + 0.6*h11(iSeed.w*3.)) * uSz;
        vec3 c = (modelMatrix * vec4(iSeed.xyz, 1.)).xyz; vec2 d = c.xz - cameraPosition.xz + vec2(1e-3, 0.); vec2 r2 = normalize(vec2(-d.y, d.x));
        // a crown is drawn large enough to be read as a drawing: never under uMinH of the frame's height (up to three times
        // its true size), and the ones too far to read are left out rather than drawn as specks
        float dist = length(c - cameraPosition);
        sc *= clamp(uMinH * uPx * uRes.y * dist / max(0.5 * (0.7 + 0.6*h11(iSeed.w*3.)) * uSz, 1e-3), 1., 3.);   // (the four drawings keep their growth)
        on *= 1. - step(85. + 45.*h11(iSeed.w*11.), dist) * step(0.001, uMinH);
        vec2 p = position.xy * sc * vec2(1. + 0.25*f, 1. - 0.12*f); p.y += 0.02;
        vec3 wp = c + vec3(r2.x, 0., r2.y)*p.x + vec3(0., p.y, 0.);
        vK = position.z;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.) * on;
      }`,
    fragmentShader: /* glsl */`uniform vec3 uInk, uPale; varying float vK; void main(){ gl_FragColor = vec4(mix(uInk, uPale, step(0.5, vK)), 1.); }`,
  });

  // mesh builders -----------------------------------------------------------------------------------------------
  const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
  // makeCloud(lobes): lobes = [{ x, y, z (world centre, metres), rx, ry, phase, grow 0..1, gx, gy (growth direction),
  // bias (tone offset), seed, base (altitude of the flat base), haze 0..1, shelf (height of the violet underside) }] in draw order.
  const makeCloud = (lobes) => {
    const n = lobes.length, g = quad(), a = new Float32Array(n * 3), b = new Float32Array(n * 4), c = new Float32Array(n * 4), d = new Float32Array(n * 3);
    lobes.forEach((l, i) => { a.set([l.x, l.y, l.z], i * 3); b.set([l.rx, l.ry ?? l.rx, l.phase ?? 0, l.grow ?? 0.5], i * 4); c.set([l.gx ?? 0, l.gy ?? 1, l.bias ?? 0, l.seed ?? 0], i * 4); d.set([l.base ?? 0, l.haze ?? 0, l.shelf ?? 400], i * 3); });
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(a, 3)); g.setAttribute('iRad', new THREE.InstancedBufferAttribute(b, 4));
    g.setAttribute('iAux', new THREE.InstancedBufferAttribute(c, 4)); g.setAttribute('iBase', new THREE.InstancedBufferAttribute(d, 3));
    g.setAttribute('iDrift', new THREE.InstancedBufferAttribute(new Float32Array(lobes.map((l) => l.drift ?? 0)), 1));
    g.instanceCount = n;
    const m = new THREE.Mesh(g, cloudMat()); m.frustumCulled = false; m.renderOrder = -0.9; return m;
  };
  const makeSky = () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), sky()); m.frustumCulled = false; m.renderOrder = -0.95; return m; };
  const makeRain = (count = 600, rng = ctx.rng, o) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, -0.5, 0.5, 0, 0.5, 0.5, 0, -1, 0.86, 0, 1, 0.86, 0, 0, 1, 0]), 3));
    g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]);
    const s = new Float32Array(count * 4); for (let i = 0; i < count * 4; i++) s[i] = rng();
    g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(s, 4)); g.instanceCount = count;
    const m = new THREE.Mesh(g, rainMat(o)); m.frustumCulled = false; return m;
  };
  // makeSplashes(points): points = flat [x,y,z, x,y,z, ...] in world space (car roof, rails, leaves, ground)
  const makeSplashes = (points, rng = ctx.rng, size = 1, minH = 0) => {
    const g = new THREE.InstancedBufferGeometry(), v = [], idx = [];
    const tri = (ax, ay, bx, by, cx, cy, k) => { const o = v.length / 3; v.push(ax, ay, k, bx, by, k, cx, cy, k); idx.push(o, o + 1, o + 2); };
    tri(-0.4, 0, 0.4, 0, 0, 0.17, 1); tri(-0.4, 0, 0, -0.09, 0.4, 0, 1);                           // pale foot
    tri(-0.22, 0.02, 0.0, 0.07, -0.42, 0.47, 0); tri(0.22, 0.02, 0.0, 0.07, 0.42, 0.47, 0);     // two ink prongs
    tri(-0.34, 0.0, -0.14, 0.04, -0.62, 0.23, 0); tri(0.34, 0.0, 0.14, 0.04, 0.62, 0.23, 0);
    tri(-0.1, 0.58, 0.1, 0.58, 0, 0.8, 1); tri(-0.1, 0.58, 0, 0.43, 0.1, 0.58, 1);              // the drop thrown up, pale like the foot
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); g.setIndex(idx);
    const n = points.length / 3, s = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { s[i * 4] = points[i * 3]; s[i * 4 + 1] = points[i * 3 + 1]; s[i * 4 + 2] = points[i * 3 + 2]; s[i * 4 + 3] = rng(); }
    g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(s, 4)); g.instanceCount = n;
    const m = new THREE.Mesh(g, splashMat()); m.material.uniforms.uSz.value = size; m.material.uniforms.uMinH.value = minH; m.frustumCulled = false; return m;
  };

  // per-frame drive ---------------------------------------------------------------------------------------------
  const cur = new THREE.Vector2(1e6, 1e6 + 300), held = cur.clone(), size = new THREE.Vector2();
  let lastTq = -1;
  const setShadow = (zA, zB = zA + 300) => { cur.set(zA, zB); };
  const update = (dt, time, camera) => {
    const tq = Math.floor(time * 12) / 12;
    U.uTime.value = time; U.uTq.value = tq; U.uBoil.value = Math.floor(time * 4) % 64;
    if (Math.abs(cur.x - held.x) > 60 || Math.abs(cur.y - held.y) > 60) held.copy(cur);   // a cut (a jump in the clock) has no late drawing
    if (tq !== lastTq) { U.uShadow.value.z = held.x; U.uShadow.value.w = held.y; held.copy(cur); lastTq = tq; }   // the highlight's late table
    U.uShadow.value.x = cur.x; U.uShadow.value.y = cur.y;
    if (camera) {
      ctx.renderer.getDrawingBufferSize(size);
      const e5 = Math.abs(camera.projectionMatrix.elements[5]) || 1.6;
      U.uPx.value = 2 / (e5 * Math.max(size.y, 1)); U.uRes.value.copy(size);
    }
  };
  return { palette: pal, uniforms: U, sun, side, cloudFoot: foot, glsl: { COMMON, INK_VERT }, cel, ground, sky, cloudMat, rainMat, splashMat,
    paint, inkOf, makeCloud, makeNearCloud, curtainMat, makeSky, makeRoof, makeRain, makeSplashes, setShadow, setRoof: (zA, zB, h) => { U.uRoof.value.set(zA, zB, h, 0); }, setRain: (d) => { U.uRain.value = d; }, update };
}

// ---------------------------------------------------------------- the hero: the cloud, its shadow, the gust, the rain
// Authored cumulonimbus, in km as seen from the origin at the reference distance: U to screen-right (toward the course),
// V up. Returned in draw order (far layer first, high lobes before low, growing caps last).
async function authorCloud(rng, o, ctx) {
  const L = [], km = 1000, D = o.distance, layers = [D * 1.32, D, D * 0.7];
  const cs = Math.cos(o.azimuth), sn = Math.sin(o.azimuth) * o.side, right = [-cs, sn];          // screen-right of (sn, cs)
  const add = (layer, U, V, r, ry, bias, grow, gx = 0.4, gy = 1) => {
    const Dl = layers[layer], k = Dl / D * km * o.scale;
    L.push({ layer, key: layer * 100 - V + (grow > 0.8 ? -0.6 : 0), x: sn * Dl + right[0] * U * k, y: V * k, z: cs * Dl + right[1] * U * k,
      rx: r * k, ry: (ry || r) * k, phase: rng() * 6.283, grow, gx, gy, bias, seed: rng(), base: 0.9 * k, haze: layer === 0 ? 0.06 : 0, shelf: 1.0 * k });
  };
  const lean = rng.range(-0.25, 0.35), topV = 9.0 + rng.range(-0.3, 0.4);
  // far layer: the anvil, spread wide and reaching right across the course, and the neck under it
  const aL = -8.5 - rng.range(0, 2), aR = 10.5 + rng.range(0, 3), nA = 15;
  for (let i = 0; i < nA; i++) {
    const f = i / (nA - 1), U = aL + (aR - aL) * f + rng.range(-0.3, 0.3) + lean * 4, edge = Math.min(f, 1 - f) * 2;
    const ry = (0.45 + 0.75 * Math.sqrt(edge)) * rng.range(0.9, 1.1);
    add(0, U, topV - 0.25 * (1 - edge) + rng.range(-0.12, 0.12), rng.range(1.9, 2.7), ry, 0.06 + 0.1 * f, 0.35, f > 0.5 ? 1 : -1, 0.1);
  }
  for (let i = 0; i < 4; i++) add(0, aR + lean * 4 + 1.5 + i * 1.6 + rng.range(-0.4, 0.4), topV - 0.3 + rng.range(-0.15, 0.15), 1.5 - i * 0.22, 0.3 - i * 0.04, 0.12, 0.3, 1, 0);   // wisps drawn out downwind
  for (let i = 0; i < 12; i++) { const V = 5.6 + (i / 11) * 2.6; add(0, rng.range(-2.6, 2.8) + lean * (V - 1) * 0.45, V, rng.range(1.5, 2.1), 0, rng.range(-0.12, 0.1), 0.5); }
  await ctx.yield();                                                             // (a seam between lobe groups: the far layer is laid)
  // middle layer: the tower, a pile of lobes inside an authored profile; shade paint on the left flank
  const hwL = (V) => -5.6 + 3.0 * Math.min(1, Math.max(0, (V - 2.2) / 4.5)), hwR = (V) => 4.8 - 2.2 * Math.min(1, Math.max(0, (V - 2.2) / 4.5));
  for (let V = 1.5; V < 7.4; V += 0.8) {
    const a = hwL(V), b = hwR(V), n = Math.round((b - a) / 1.5);
    for (let i = 0; i <= n; i++) {
      const f = i / n, U = a + (b - a) * f + rng.range(-0.3, 0.3) + lean * (V - 1) * 0.45, r = ((i === 0 || i === n) ? rng.range(0.75, 1.1) : rng.range(1.25, 1.95)) * (1 - 0.03 * V);
      add(1, U, V + rng.range(-0.25, 0.25), r, 0, -0.38 + 0.62 * f + rng.range(-0.08, 0.08), (i === 0 || i === n) ? 0.9 : 0.5, f > 0.5 ? 0.8 : -0.8, 0.6);
    }
  }
  for (let i = 0; i < 6; i++) { const V = 2.4 + i * 0.95; L.push({ ...L[L.length - 1] }); const b = L[L.length - 1], k = km * o.scale, U = rng.range(-1.3, 1.1) + lean * (V - 1) * 0.45;
    Object.assign(b, { key: 100 - 50 - V, x: sn * D + right[0] * U * k, y: V * k, z: cs * D + right[1] * U * k, rx: (3.3 - 0.22 * i) * k, ry: (2.3 - 0.1 * i) * k, grow: 0.25, bias: 0.16, phase: rng() * 6.283, seed: rng() }); }
  await ctx.yield();                                                             // (the middle layer is laid)
  // near layer: turrets still growing at the foot and on the shoulders, each a stack that shrinks upward to a growing cap
  const turrets = [[-7.2, 3.0, 1.35], [-3.9, 4.6, 1.5], [0.9, 5.3, 1.6], [4.3, 3.9, 1.45], [7.6, 2.7, 1.2], [10.2, 1.9, 0.9]];
  for (const [U0, top0, r0] of turrets) {
    const U = U0 + rng.range(-0.7, 0.7), top = top0 * rng.range(0.85, 1.15), tilt = rng.range(0.05, 0.3);
    let V = 1.3, r = r0 * rng.range(0.95, 1.15), i = 0;
    while (V < top) {
      const w = (i % 2 ? 1 : -1) * r * 0.55;
      add(2, U + w + tilt * (V - 1), V, r, 0, rng.range(-0.1, 0.08) + (U0 < -2 ? -0.12 : 0.04), 0.6, tilt, 1);
      if (i % 2) add(2, U - w * 1.5 + tilt * (V - 1), V - r * 0.3, r * 0.72, 0, -0.18, 0.7, -0.7, 0.5);
      V += r * 0.62; r *= 0.9; i++;
    }
    add(2, U + tilt * (top - 1), top + r * 0.2, r * 0.95, 0, 0.1, 1, tilt, 1);
    add(2, U + tilt * (top - 1) + r * 0.75, top - r * 0.35, r * 0.6, 0, 0.12, 1, 0.9, 0.5);
    add(2, U + tilt * (top - 1) - r * 0.7, top - r * 0.45, r * 0.55, 0, -0.1, 1, -0.9, 0.5);
  }
  await ctx.yield();                                                             // (the near turrets are laid)
  // cauliflower on the tower's two outlines
  for (let i = 0; i < 26; i++) { const V = rng.range(2.2, 7.6), rt = i % 2; add(1, (rt ? hwR(V) + 0.7 : hwL(V) - 0.7) + lean * (V - 1) * 0.45, V, rng.range(0.42, 0.75), 0, rt ? 0.12 : -0.3, 1, rt ? 1 : -1, 0.5); }
  L.sort((p, q) => p.key - q.key);
  return L;
}
// small fair-weather cumulus, in ranks toward the horizon (az measured to screen-right of the course, degrees)
// SEVEN of them, in four ranks (1, 2, 2, 2) over the plain to screen-right of the course, every flat base at one height, so
// the ranks close up toward the horizon as the rows of the field do; the nearest stands in the middle distance (never
// within 700 m of the flight: they are the painted layer). CUMULUS = [metres to screen-right, metres along the course, width].
// Returns each cloud's cast shadow on the plain (x, z, half-size across, half-size along) for the ground shader.
const CUMULUS = [[520, 2050, 350], [150, 2950, 440], [1200, 3150, 470], [780, 4500, 580], [2200, 4900, 620], [260, 7000, 780], [2050, 7500, 840]];
function authorCumulus(rng, o, list, sun) {
  const out = [], shadows = [], base = 285, n = 7;
  for (const [right, along, w0] of CUMULUS) {
    const w = w0 * rng.range(0.94, 1.06), cx = -right * o.side, cz = along, dist = Math.hypot(cx, cz), haze = Math.min(0.3, dist / 30000);
    const fl = Math.hypot(cx, cz - 500), px = -(cz - 500) / fl, pz = cx / fl;          // screen-right as the flight sees the cloud
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1) - 0.5, U = f * w * 0.9 + rng.range(-0.07, 0.07) * w, hump = 1 - 3.4 * f * f, r = w * (0.15 + 0.19 * hump) * rng.range(0.85, 1.15);
      out.push({ key: -dist + i * 0.01 + hump, x: cx + px * U, y: base + r * 0.3 + hump * 0.21 * w * rng.range(0.5, 1.2), z: cz + pz * U, rx: r * 1.15, ry: r,
        phase: rng() * 6.283, grow: 0.7, gx: rng.range(-0.5, 0.5), gy: 1, bias: 0.06 + 0.2 * f, seed: rng(), base, haze, shelf: 0.085 * w, drift: 1 });
    }
    const H = base + 0.2 * w;                                                           // where the sun throws the shadow of a shape that high
    shadows.push([cx - sun.x / sun.y * H, cz - sun.z / sun.y * H, 0.56 * w, 0.38 * w]);
  }
  out.sort((p, q) => p.key - q.key);
  for (const l of out) list.push(l);
  return shadows;
}

// a reference cel sunflower (38 triangles of paint + 38 of line), root at the origin; the world may use it as its near plant
export function makeSunflower(style, rng) {
  const pal = style.palette, parts = [], tmp = new THREE.Object3D();
  const tris = (v) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); g.computeVertexNormals(); return g; };
  const both = (g, card) => { parts.push(g, style.inkOf(g, { card })); };
  const stalk = new THREE.CylinderGeometry(0.045, 0.07, 2.7, 5, 1, true).toNonIndexed(); stalk.translate(0, 1.35, 0);
  both(style.paint(stalk, pal.green, pal.greenShade), false);
  const leaves = [[0.8, 0.4, 1.0], [1.25, 2.3, 0.92], [1.7, 3.9, 0.82], [2.12, 5.5, 0.7]];
  leaves.forEach(([h, a, len], i) => {
    const w = len * 0.3, g = tris([0, 0, 0, len * 0.42, 0.1 * len, w, len, -0.05 * len, 0, 0, 0, 0, len, -0.05 * len, 0, len * 0.42, 0.1 * len, -w]);
    tmp.position.set(0, h, 0); tmp.rotation.set(0, a, -0.72, 'YXZ'); tmp.scale.setScalar(1); tmp.updateMatrix(); g.applyMatrix4(tmp.matrix); g.computeVertexNormals();
    const up = g.attributes.normal; for (let k = 0; k < up.count; k++) { const sg = up.getY(k) < 0 ? -0.7 : 0.7; up.setXYZ(k, sg * up.getX(k), sg * up.getY(k) + 0.45, sg * up.getZ(k)); }   // leaves lie open to the sky: most take the lit paint
    both(style.paint(g, i % 2 ? pal.greenHi : pal.green, pal.greenShade, i === 3 ? (x, y, z, k) => (k === 2 || k === 4 ? 1 : 0) : 0), true);
  });
  const head = [], disc = [], nP = 14, R0 = 0.17, R1 = 0.6;
  for (let i = 0; i < nP; i++) {
    const a0 = (i - 0.42) / nP * 6.2832, a1 = (i + 0.42) / nP * 6.2832, am = i / nP * 6.2832, rt = R1 * (0.9 + 0.2 * rng());
    head.push(Math.cos(a0) * R0 * 0.9, Math.sin(a0) * R0 * 0.9, 0, Math.cos(a1) * R0 * 0.9, Math.sin(a1) * R0 * 0.9, 0, Math.cos(am) * rt, Math.sin(am) * rt, 0);
  }
  { const h = [0, 1, 2, 3, 4, 5].map((i) => [Math.cos(i * 1.0472 + 0.3) * R1 * 0.7, Math.sin(i * 1.0472 + 0.3) * R1 * 0.7, 0.012]); for (const [a, b, c] of [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5]]) head.push(...h[a], ...h[b], ...h[c]); }   // the ring is full: a head reads as petal paint first
  for (let i = 0; i < 6; i++) { const a0 = i / 6 * 6.2832, a1 = (i + 1) / 6 * 6.2832; disc.push(0, 0, 0.03, Math.cos(a0) * R0, Math.sin(a0) * R0, 0.03, Math.cos(a1) * R0, Math.sin(a1) * R0, 0.03); }
  const face = new THREE.Vector3(-0.42 * style.side, 0.34, -0.84).normalize();      // three-quarter face to the sun and to us
  tmp.position.set(0, 2.74, -0.05); tmp.scale.setScalar(1); tmp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face); tmp.updateMatrix();
  const gp = tris(head), gd = tris(disc); gp.applyMatrix4(tmp.matrix); gd.applyMatrix4(tmp.matrix);
  for (const g of [gp, gd]) { const n = g.attributes.normal; for (let k = 0; k < n.count; k++) n.setXYZ(k, face.x, face.y, face.z); }
  both(style.paint(gp, pal.petal, pal.ochre), true); both(style.paint(gd, pal.disc, pal.discShade), true);
  const out = mergeGeometries(parts, false); parts.forEach((g) => g.dispose());
  return out;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const style = opts.style || makeStyle(ctx, opts), side = style.side, pal = style.palette;
  const object = new THREE.Group(); object.name = 'the-tall-cloud';
  const stage = opts.stage !== false;
  const CO = { distance: opts.distance || 14500, azimuth: (opts.azimuth ?? 28) * Math.PI / 180, side, scale: opts.cloudScale || 1 };
  style.cloudFoot.set(Math.sin(CO.azimuth) * side * CO.distance * 1.03, Math.cos(CO.azimuth) * CO.distance * 1.03, 7200 * CO.scale, 3100 * CO.scale);
  await ctx.yield();
  // the painted layer: dome, the tall cloud, the small cumulus
  let sky = null; if (opts.sky !== false) { sky = style.makeSky(); object.add(sky); }
  await ctx.yield();
  const lobes = await authorCloud(rng.fork('cloud'), CO, ctx);
  await ctx.yield();
  if (opts.cumulus !== false) authorCumulus(rng.fork('cumulus'), CO, lobes, style.sun).forEach((s, i) => style.uniforms.uCum.value[i].set(s[0], s[1], s[2], s[3]));
  await ctx.yield();
  const cloud = style.makeCloud(lobes); object.add(cloud);
  await ctx.yield();
  const roof = style.makeRoof(); object.add(roof);
  await ctx.yield();
  // the land (stage): the style's ground on a 30 km disc, and a patch of reference sunflowers to carry the swap of paints
  const C0 = new THREE.Vector3(0, 24, 230);
  let groundMesh = null, plants = null;
  if (stage) {
    const gg = new THREE.CircleGeometry(30000, 96); gg.rotateX(-Math.PI / 2);
    groundMesh = new THREE.Mesh(gg, style.ground({ rowNear: 0 })); groundMesh.frustumCulled = false; object.add(groundMesh);
    await ctx.yield();
    const pr = rng.fork('plants'), pg = makeSunflower(style, pr), rows = 24, per = Math.round(40 * detail), m4 = new THREE.Object3D();
    plants = new THREE.InstancedMesh(pg, style.cel({ lean: 1, inkCap: 0.03 }), rows * per); plants.frustumCulled = false;
    for (let r = 0, i = 0; r < rows; r++) {
      for (let k = 0; k < per; k++, i++) {
        m4.position.set((r - rows / 2 + 0.5) * 1.5 + pr.range(-0.12, 0.12), 0, C0.z - 22 + (k + pr()) * 44 / per);
        m4.rotation.set(0, pr.range(-0.3, 0.3), 0); const s = pr.range(0.85, 1.12); m4.scale.set(s, s * pr.range(0.92, 1.1), s); m4.updateMatrix();
        plants.setMatrixAt(i, m4.matrix);
      }
      if (r % 6 === 5) await ctx.yield();
    }
    object.add(plants);
  }
  await ctx.yield();
  // the drawn weather: ink rain round the camera, splash crowns on the stage
  let rain = null, splashes = null;
  if (opts.rain !== false) {
    const rr = rng.fork('rain');
    rain = style.makeRain(Math.round(1100 * detail), rr); object.add(rain);
    if (stage) {
      const n = Math.round(200 * detail), pts = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const leaf = i % 3 === 0; pts[i * 3] = C0.x + rr.range(-34, 34); pts[i * 3 + 1] = leaf ? rr.range(1.2, 2.9) : 0.04; pts[i * 3 + 2] = C0.z + rr.range(-40, 40); }
      splashes = style.makeSplashes(pts, rr); object.add(splashes);
    }
  }
  await ctx.yield();
  // the exit: a flat ink ring with a ragged dry-brush outer edge, tilted to the 10 degree climb
  const seat = new THREE.Vector3(-16 * side, 28, 575), climb = 10 * Math.PI / 180;
  let ring = null;
  if (opts.ring !== false) {
    ring = new THREE.Mesh(new THREE.RingGeometry(7, 12.2, 96, 1), new THREE.ShaderMaterial({
      uniforms: { uInk: { value: pal.ringInk } }, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform vec3 uInk; varying vec2 vP;
        float h(float n){ return fract(sin(n*12.9898)*43758.5453); }
        void main(){ float r = length(vP), a = atan(vP.y, abs(vP.x) < 1e-5 ? 1e-5 : vP.x);
          float br = h(floor(a*46.)), sweep = fract(a/6.2832 + 0.37);
          float edge = 10.3 + 0.5*sin(a*3. + 1.) + 1.3*br*smoothstep(0.55, 1., sweep) + 0.25*h(floor(a*120.));   // the stroke runs dry toward its end
          if (r > edge || (r > 9.6 && h(floor(a*150.) + floor(r*3.)*7.) < 0.5*smoothstep(0.6, 1., sweep)*smoothstep(9.6, 10.8, r))) discard;
          gl_FragColor = vec4(uInk, 1.); }` }));
    ring.position.copy(seat); ring.rotation.set(climb, 0, 0); object.add(ring);
  }

  // clock: everything keyed to the camera's arrival is driven by setClock(seconds of the brief's 40 s journey)
  const crossA = opts.crossA || [17, 230], crossB = opts.crossB || [25.5, 349], vEdge = opts.edgeSpeed || 20;
  let driven = false;
  const setClock = (s) => {
    driven = true;
    style.setShadow(crossA[1] + (crossA[0] - s) * vEdge, crossB[1] + (crossB[0] - s) * vEdge);
    const k = (a, b) => Math.min(1, Math.max(0, (s - a) / (b - a)));
    const up = k(crossA[0] + 0.8, crossA[0] + 4), dn = 1 - k(crossB[0] - 1.5, crossB[0] + 2);
    style.setRain(opts.weather === 'dry' ? 0 : up * up * (3 - 2 * up) * dn);
  };
  const demo = (time) => { setClock((time + 5) % 40); driven = false; };
  demo(12);
  const cb = new THREE.Vector3(Math.sin(CO.azimuth) * side * CO.distance, 3200 * CO.scale, Math.cos(CO.azimuth) * CO.distance);
  const anchors = {
    portalSeat: { position: seat.clone(), facing: new THREE.Vector3(0, -Math.sin(climb), -Math.cos(climb)), radius: 7, tilt: climb },
    flyThrough: [[0, 38, 0], [0, 38, 60], [0, 9, 140], [0, 9, 330], [-16 * side, 9, 470], [-16 * side, 28, 575]].map((p) => new THREE.Vector3(...p)),
    cloudPoi: cb,                                         // aim a poi here (weight 0.4, 2-16 s)
    cloudFoot: new THREE.Vector3(cb.x, 0, cb.z),
    sun: style.sun.clone(),
    right: new THREE.Vector3(-side, 0, 0),                // screen-right for a camera flying +Z (rail side)
    edgeCross: new THREE.Vector3(0, 9, crossA[1]), edgeLeave: new THREE.Vector3(0, 9, crossB[1]),
    viewpoints: { entry: new THREE.Vector3(0, 38, 0), overFlowers: new THREE.Vector3(0, 9, 200), stage: C0.clone() },
  };
  return {
    object, radius: 12, height: 90, center: C0, anchors, style, ground: !stage, groundY: 0,
    parts: { sky, cloud, roof, groundMesh, plants, rain, splashes, ring },
    setClock, setProgress: (u) => setClock(u * 40), setShadow: (zA, zB) => { driven = true; style.setShadow(zA, zB); }, setRain: style.setRain,
    update(dt, time, camera) {
      if (!driven) demo(time);
      if (!opts.style) style.update(dt, time, camera);     // a shared style is driven once, by the world
    },
    dispose() {},
  };
}
