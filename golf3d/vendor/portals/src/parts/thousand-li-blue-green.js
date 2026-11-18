// A Thousand Li in Blue and Green: the hero (bridge, pavilion, peak, three-step fall, moon gate)
// and the STYLE KIT of the world: qinglü mineral colour on tea-gold silk.
//
// THE LAW (styleNote) AND HOW THE KIT KEEPS IT.  const style = makeStyle(ctx, { palette, glanceDir, creases, weave })
//   style.palette    { silk, ink, malachite, azurite, gold, shell, vermilion }: linear THREE.Colors, already corrected so that
//                    the picture after ACES at exposure 1.0 lands on the brief's hexes. Seven colours and no others: washes are
//                    silk.clone().lerp(ink, k); deep green is malachite.lerp(ink, .5).
//   style.silk(mode) the bare cloth, unlit. 'sky' (use style.sky(radius): a dome that follows the camera), 'lake' (uniforms
//                    uBridge, uShore, uRipple[6]: fish-scale ripples only near things, the bridge mirrored as broken dashes),
//                    'mist' (PlaneGeometry bands, scalloped top, soft alpha; { drift } slides the scallops), 'fall' (threads of
//                    bare silk between running ink strokes; uv.y = 1 at the lip), 'plain'. The weave, the three creases and the
//                    rubbed patches are computed from the VIEW DIRECTION, so every silk surface and every thin coat is one sheet.
//   style.pigment(o) mountains: colour by height alone (o.foot, o.top world y; o.green, o.blue band heights 0..1), deckled band
//                    edges that sag in hollows, coats (material.setCoats(t2, t3): seconds since the 2nd / 3rd coat was begun at
//                    the summit; the front runs down at o.speed m/s, ragged, with a wet bead, drying over 3 s; o.cap 1..3 for
//                    far ranges), grain, flakes, ink creases in valleys, ink texture strokes on steep faces, glints in the glance.
//                    Needs attribute aCoat (run of the front in metres, hollow 0..1, metres above the valley crease):
//                    style.mountain(spec) builds mesh + aCoat from ridge polylines (style.spurs(rng, summit, o) makes them).
//   style.gold()     with style.goldRibbon(lines): eye-facing ribbons 0.5 m wide, never under 1.6 px, dull ochre until the
//                    glance (uGlance) reaches them, then gold x 1.5: the only thing above 1.0.
//   style.flat()     with style.batch(): shell, vermilion, ink and wash boxes/quads, ink outlines and ruled lines in the material.
//   style.stamp()    with style.stamps([[x, y, z, size, kind]]): trees as stamped clusters of five to nine dots.
//   style.wheel()    with style.wheels(list): a pine's needle cluster, a wheel of fourteen strokes (same instance layout as stamps).
//   added by the world builder: makeStyle opts thin / flake / stroke (age and colourway of the painting), pigment uniforms
//                    uThin, uFlake, uStroke, uScar (the bare-silk scar of the rare flake); silk('mist', { scallops, edge, ends, foot });
//                    flat() honours instancing (the cast are InstancedMeshes of batch geometry).
//   style.update(dt, time, camera)  once a frame (time uniform, the glance crossing every 17 s, pixel size, dome position).
//   No light, no fog, no shadow anywhere: every material is an unlit ShaderMaterial that ignores scene lights and fog.
//
// FRAMES. The hero is authored in a "course frame": r = metres to the RIGHT of the flight line as seen when flying the
//   course, y up, s = metres along the course (the brief's z). The module contract wants the front toward +Z, so
//   local = (r, y, S0 - s) with S0 = 480 (the base centre of the peak). In the world:
//     hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, 480);
//   puts every brief z where the brief says, with the crown on the true left of a camera flying +Z (three.js is right handed:
//   that is world +X; the brief's "x -110" assumed +X to the right). The glance default [-1, 0] then runs left to right.
//
// THE HERO.  const hero = await buildHero(ctx, { style, palette, detail, gate, winter })
//   opts.style   the world's shared makeStyle instance (then the world calls style.update; alone, the hero drives its own)
//   opts.detail  0.6..1 thins trees and the terrain grid; opts.gate false leaves the moon gate out; opts.winter: white third coat
//   size         peak 280 m tall, about 420 m in radius about the origin; the bridge runs 500 m to either side at local z 215.
//                radius 210 is only the viewer's framing. Place the object at lake level (pigment bands use world y 0..280).
//   hero.setCoats(t2, t3) / hero.setProgress(u, duration = 42)  the coats of the peak (never wall-clock in a world; alone it loops)
//   hero.heightAt(x, z) local ground height; hero.toWorld(v); hero.parts { peak, gold, trees, lake, built }
//   hero.heightAt0(x, z) the ground as it stood before the balcony (the right-hand wall dies away beside the terrace, s 533 on)
//     and the hut's folded outcrop were cut: every SEEDED decision is still taken on it, so no draw of the seed moved.
//   The fall: uFalls (three unpainted columns), uFoot (the foot of each step: spray scallops), drawn in the GORGE pigment shader as
//     a coarse and a fine set of running ink threads (since the fifth version the main fall also carries running threads of shell white
//     over them); the pools lie at the foot of the fall above them.
//   anchors (local): portalSeat { position, normal, radius 7 } the centre of the moon gate's opening, normal toward the arriving eye;
//     flyThrough: 13 points from the entry eye over the lake, under the centre span, up the three steps 8 m right of the threads
//     and along the terrace to the gate, at least 6 m clear; entryEye; underSpan; pavilion; crown; shoulder; lips[3]; pools[3];
//     hutSeat (first ledge); terracePines[2]; streamSource; bridge { z, halfLength, spacing, deckWidth, deckY(x) }.
//   cost         about 72k triangles, 7 draw calls, about 220 ms of script in yielded steps, no lights, no textures.
import * as THREE from 'three';
import { makeNoise, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeRng } from '../kit/core.js';

export const PALETTE = ['#CDA96A', '#4A3320', '#2E8C6A', '#1D4FA6', '#E9C55A', '#F1EADB', '#C23B22'];
const S0 = 480;

// ---------------------------------------------------------------------------------------------
// GLSL shared by every material of the style
// ---------------------------------------------------------------------------------------------
const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec4 uGlance;      // xz: unit direction of travel in world space, z: position of the band centre along it, w: half width
uniform vec3 uCrease;      // three bearings (radians) of the old creases in the silk
uniform vec3 cSilk, cInk, cMal, cAzu, cGold, cShell, cVerm;
uniform float uWeave;      // weave contrast (0.05)
float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 h22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .3 + vn(p * 4.11 + 3.7) * .2; }
// The weave of the cloth lives on the view direction, so sky, lake, mist, falls and thin pigment are one sheet.
// d: direction from the eye (need not be unit, never zero). Returns (weave -1..1, crease 0..1, rub 0..1).
vec3 silkTex(vec3 d){
  float lxz = max(length(d.xz), 1e-5);
  float az = atan(d.x, d.z + (abs(d.x) + abs(d.z) < 1e-6 ? 1e-5 : 0.));
  float el = atan(d.y, lxz);
  vec3 dn = d / max(length(d), 1e-5);
  float fw = (length(dFdx(dn)) + length(dFdy(dn))) * 200.;        // threads per pixel (thread pitch 1/200 rad)
  float fade = 1. - smoothstep(.22, .55, fw);
  fade *= smoothstep(.02, .2, lxz / max(length(d), 1e-5));         // no moire at the poles
  vec2 w = vec2(az, el) * 200. * 3.14159265;
  float weave = sin(w.x) * sin(w.y) * .7 + sin(w.y * 2.) * .3;     // plain weave, weft a little heavier
  weave += (h21(floor(vec2(az * 200., el * 23.))) - .5) * .5;      // slubs: uneven threads
  float cr = 0.;
  for (int i = 0; i < 3; i++) {
    float a = uCrease[i];
    float da = abs(atan(sin(az - a), cos(az - a))) + el * .004 * sin(el * 9. + float(i) * 2.);
    cr = max(cr, exp(-da * da * 60000.) + .35 * exp(-da * da * 2500.));
  }
  cr *= 1. - smoothstep(.30, .62, abs(el));                         // a crease is an upright seam: it is rubbed out before it can fan toward the zenith
  float rub = smoothstep(.62, .8, fbm(vec2(az * 2.2, el * 3.1) + 4.));
  return vec3(weave * fade, cr, rub);
}
vec3 silkCol(vec3 d){
  vec3 t = silkTex(d);
  return cSilk * (1. + uWeave * t.x + .07 * t.y + .045 * t.z);
}
// the glance: 0..1 inside the gleam band that crosses the world
float glanceAt(vec3 wp){
  float q = dot(wp.xz, uGlance.xy) - uGlance.z;
  float g = 1. - smoothstep(uGlance.w * .35, uGlance.w, abs(q));
  return g;
}
`;

const VERT_WORLD = /* glsl */`
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG_SILK = /* glsl */`
varying vec3 vW;
#ifdef MIST
varying vec2 vUv;
uniform float uDrift;     // scallops slide sideways, in uv per second
uniform float uScal;      // scallops across the sheet (x pi)
uniform vec3 uEdge;       // softness of the scalloped top edge (0.42 soft .. 0.05 drawn), taper of the ends, fade of the foot
#endif
#ifdef FALL
varying vec2 vUv;
uniform vec3 uFall;        // x: thread count, y: fall height in metres, z: scroll speed m/s
#endif
#ifdef LAKE
uniform vec4 uBridge;      // x: world z of the bridge line, y: half length, z: trestle spacing, w: deck height above the lake
uniform vec4 uShore;       // x: world z of the far shore, y: +1/-1 side the land lies on, z: lake y, w: ripple reach (60)
uniform vec4 uRipple[6];   // xz: world centre, z: radius of a ripple patch (boats, pools); w: strength
#endif
${GLSL_COMMON}
#ifdef LAKE
// fish-scale ripples: rows of overlapping arcs, ink-thin, lit row by row so that they step outward.
// k: size of the net (1 = arcs 3.2 m wide in rows 1.5 m apart); q: metres of water under one pixel. The line keeps the
// weight of a brush line at any size: it thins with distance and is never fatter than a couple of pixels.
float scales(vec2 p, float k, float q, float qt){
  vec2 c = p / (vec2(3.2, 1.5) * k);
  float fw = q / (1.5 * k);
  float row = floor(c.y);
  c.x += mod(row, 2.) * .5;
  vec2 f = vec2(fract(c.x) - .5, fract(c.y));
  float d = abs(length(vec2(f.x * 3.2, f.y * 1.5 + .9)) - 1.85);
  float aa = max(qt / k * 1.3, .004);
  float lw = clamp(qt / k * .75, .006, .05);
  float line = 1. - smoothstep(lw, lw + aa, d);
  float stepv = fract(row * .25 - floor(uTime * 2.5) * .25);
  float lit = step(stepv, .3);
  line = max(line, lit * (1. - smoothstep(lw * 1.7, lw * 1.7 + aa, d)));
  line *= .3 + .7 * lit;
  return line;
}
// THE WATER IS DRAWN: the fish-net wave pattern over the whole lake, in four sizes of net chosen by how much water lies
// under a pixel, so that rows stay 5 to 20 pixels apart from the bluff, from the dive and from 4 m up. Near the lens only the
// largest net is drawn (long slow swell lines), so nothing fine flickers under a fast camera.
float waveNet(vec2 p, float q, float qt){
  float r1 = q, r2 = q / 3.3, r3 = q / 11., r4 = q / 36.;
  float n = scales(p, 1., q, qt) * (1. - smoothstep(.22, .33, r1));
  n = max(n, scales(p + 3.7, 3.3, q, qt) * smoothstep(.06, .09, r2) * (1. - smoothstep(.22, .33, r2)));
  n = max(n, scales(p + 9.1, 11., q, qt) * smoothstep(.06, .09, r3) * (1. - smoothstep(.22, .33, r3)));
  n = max(n, scales(p + 21.3, 36., q, qt) * smoothstep(.06, .09, r4) * (1. - smoothstep(.24, .4, r4)));
  return n;
}
#endif
void main(){
  vec3 d = vW - cameraPosition;
  vec3 col = silkCol(d);
  float a = 1.;
#ifdef LAKE
  float m = 0.;
  float dz = abs(vW.z - uBridge.x);
  m = max(m, (1. - smoothstep(14., uShore.w, dz)) * step(abs(vW.x), uBridge.y + 30.));
  float sh = (uShore.x - vW.z) * uShore.y + (fbm(vW.xx * .013) - .5) * 60.;
  m = max(m, 1. - smoothstep(10., uShore.w, abs(sh)));
  for (int i = 0; i < 6; i++) {
    float r = length(vW.xz - uRipple[i].xy);
    m = max(m, uRipple[i].w * (1. - smoothstep(uRipple[i].z * .4, uRipple[i].z, r)));
  }
  m *= .55 + .45 * smoothstep(.35, .6, fbm(vW.xz * .045 + 3.));
  float wq = max(fwidth(vW.x), fwidth(vW.z));
  float hd = length(vW.xz - cameraPosition.xz);
  float wqt = wq;
  wq = max(wq, .9 * (1. - smoothstep(10., 34., hd)));
  float wpat = fbm(vW.xz * vec2(.011, .034) + 9.);          // long runs of drawn waves with quieter water between
  m = max(m, .44 + .46 * smoothstep(.3, .6, wpat));
  float sc = waveNet(vW.xz, wq, wqt);
  col = mix(col, mix(cSilk, cInk, .62), sc * m * .75);
  // the bridge mirrored as broken ink dashes: true planar reflection of posts and deck, drawn as dashes
  vec2 C = cameraPosition.xz; float camH = max(cameraPosition.y - uShore.z, .5);
  float den = vW.z - C.y; den = abs(den) < 1e-3 ? 1e-3 : den;
  float tt = (uBridge.x - C.y) / den;                       // ray from the eye's foot through this point reaches the bridge at tt
  {
    float msk = step(1.0001, tt); tt = max(tt, 1.0001);
    float xb = C.x + (vW.x - C.x) * tt;
    float tq = 1. - 1. / tt;                                // 0 at the eye's foot, 1 at the bridge
    float h = camH * (tt - 1.) + tq * 0.;                    // height of the thing mirrored at this point of the water
    float wob = sin(h * 2.3 + uTime * 1.7 + xb * .2) * .22 + sin(h * .9 - uTime * 1.1) * .15;
    float k = xb / uBridge.z; float dx = abs(k - floor(k + .5)) * uBridge.z + wob * (.3 + h * .06);
    float wpx = fwidth(xb) * 1.2;
    float gap = step(uBridge.z * .5 + .5, abs(xb));        // centre span: no trestle on the axis
    float post = (1. - smoothstep(.5, .5 + wpx + 1e-4, abs(dx - 1.6))) * step(h, uBridge.w) * gap;
    float hpx = fwidth(h) * 1.2;
    float deck = 1. - smoothstep(.7, .7 + hpx + 1e-4, abs(h - uBridge.w - .5 + wob * .8));
    float dash = step(.38, fract(h * .42 - uTime * .35 + h21(vec2(floor(k + .5), 3.)) ));
    float dashd = step(.3, fract(xb * .16 + sin(uTime * .8 + xb * .05) * .3));
    float inb = step(abs(xb), uBridge.y) * msk;
    float refl = max(post * dash, deck * dashd) * inb * (1. - smoothstep(.0, 1., max(wpx * .25, hpx * .4)));
    col = mix(col, mix(cSilk, cInk, .8), refl * .62);
  }
#endif
#ifdef FALL
  // forty threads of bare silk between ink lines: the lines are broken strokes that run down
  float u = vUv.x * uFall.x;
  float fu = fwidth(u);
  float id = floor(u);
  float y = vUv.y * uFall.y + uTime * uFall.z * (.8 + .4 * h11(id + 3.));
  float seg = fract(y / (9. + 8. * h11(id)) + h11(id * 7.1));
  float on = smoothstep(.0, .08, seg) * (1. - smoothstep(.55 + .3 * h11(id + 9.), .9, seg));
  on *= .35 + .65 * smoothstep(.12, .3, fract(y / 2.6 + h11(id * 3.3)));        // the stroke is laid in short running touches
  float lw = .09 + .05 * h11(id + 5.);
  float ln = 1. - smoothstep(lw, lw + max(fu, .02) * 1.3, abs(fract(u) - .5 + .12 * sin(y * .35 + id)));
  float edge = smoothstep(.0, .04, vUv.x) * (1. - smoothstep(.96, 1., vUv.x));
  ln *= on * (1. - smoothstep(.3, .7, fu));
  float u4 = vUv.x * uFall.x * .25, f4 = fu * .25, id4 = floor(u4);
  float y4 = vUv.y * uFall.y + uTime * uFall.z * (.8 + .4 * h11(id4 + 3.));
  float seg4 = fract(y4 / (16. + 9. * h11(id4)) + h11(id4 * 7.1));
  float ln4 = (1. - smoothstep(.1, .1 + max(f4, .02) * 1.3, abs(fract(u4) - .5))) * smoothstep(.0, .08, seg4) * (1. - smoothstep(.6, .9, seg4));
  ln = max(ln, ln4 * smoothstep(.3, .7, fu) * (1. - smoothstep(.5, 1.2, f4)));
  col = mix(col, mix(cSilk, cInk, .85), ln * .8 * edge);
  col = mix(col, cSilk * 1.06, (1. - ln) * .5);           // the unpainted threads: a breath lighter than the worn sheet
#endif
#ifdef MIST
  float mx = vUv.x + uDrift * uTime;
  // MIST IS DRAWN: bare silk below a crisp row of round-topped scallops, the row outlined with one ink line a pixel or two
  // wide and a broken second row of curls under it; no gradient anywhere (uEdge.x: height of a lobe, as a fraction of the sheet)
  float sc2 = abs(sin(mx * uScal + sin(mx * uScal * .325) * 2.));
  float top = .5 - uEdge.x * (1. - sc2);
  float ey = max(fwidth(vUv.y), 1e-5);
  a = 1. - smoothstep(top - ey, top + ey, vUv.y);
  float ln = 1. - smoothstep(ey * .9, ey * 2.2, abs(vUv.y - top));
  float mx2 = mx * uScal * 1.31 + 1.7;
  float sc3 = abs(sin(mx2 + sin(mx2 * .29) * 2.));
  float top2 = .5 - uEdge.x * 1.7 - uEdge.x * .8 * (1. - sc3);
  float ln2 = (1. - smoothstep(ey * .7, ey * 1.8, abs(vUv.y - top2))) * step(.4, fract(mx * uScal * .083));
  col = mix(col, mix(cSilk, cInk, .7), max(ln * .8, ln2 * .5));
  a = max(a, ln) * smoothstep(0., uEdge.y, vUv.x) * (1. - smoothstep(1. - uEdge.y, 1., vUv.x));
#endif
  gl_FragColor = vec4(col, a);
}`;

const VERT_UV = /* glsl */`
varying vec3 vW; varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const VERT_SKY = /* glsl */`
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  vec4 p = projectionMatrix * viewMatrix * w;
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;

// PIGMENT: the one material of every mountain. Colour by height alone, laid in coats.
// attribute aCoat = (metres the coat front must run to reach this point, hollow 0..1, metres above the valley crease)
const VERT_PIG = /* glsl */`
attribute vec3 aCoat;
varying vec3 vW; varying vec3 vCoat;
#ifdef GORGE
attribute vec3 aFold; varying vec3 vFold; varying vec3 vL;
#endif
void main(){
  vCoat = aCoat;
#ifdef GORGE
  vFold = aFold; vL = position;
#endif
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG_PIG = /* glsl */`
varying vec3 vW; varying vec3 vCoat;
uniform vec2 uRange;       // world y of the foot and of the summit of this range
uniform vec2 uBands;       // normalised heights where umber gives way to malachite and malachite to azurite
uniform vec2 uCoatT;       // seconds since the second / third coat was begun at the summit (negative: not yet)
uniform float uSpeed;      // metres per second the coat settles downhill
uniform float uCap;        // highest coat this range may ever wear (far ranges 2.6 .. 1.0)
uniform float uWinter;     // 1: third coat on the crown is shell white
uniform float uThin;       // strength of the first coat (1 = the stain of the brief, 0.15 = underdrawing only)
uniform float uFlake;      // how much more the paint has flaked (0 .. 0.08)
uniform float uStroke;     // strength of the ink texture strokes (1; 1.8 for the light colourway)
uniform vec4 uScar;        // xz: world centre, z: radius, w: 1 = bare silk (a plate has lifted), 0 = healed
uniform float uRun;        // far ranges: metres (of the range's own model) the coat front runs from summit to foot
uniform float uFlat;       // 1: a far range, a flat silhouette banded by height: no tone follows the mesh, folds are drawn lines only
#ifdef GORGE
varying vec3 vL;           // position in the mountain's own frame
varying vec3 vFold;        // x: fold coordinate (valley at whole numbers), y: weight, z: metres above the local foot
uniform vec4 uFalls[3];    // the falls, left unpainted: x: world x of the column, y: half width, z/w: world z where it begins and ends
uniform float uFallRun;    // metres per second the ink touches run down
uniform vec3 uFoot;         // the mountain's own z of the foot of each fall (spray is drawn there)
#endif
${GLSL_COMMON}
#ifdef GORGE
// one set of n falling threads across the column: broken ink strokes, each running at its own speed
float fallThreads(float ux, float n, float run, float f1, float sd, float f0, float fk){
  float u = ux * n, id = floor(u) + sd * 13., fu = f1 * n;
  float y = run + uTime * uFallRun * (.55 + .9 * h11(id + 3.));
  float seg = fract(y / (9. + 12. * h11(id)) + h11(id * 7.1));
  float on = smoothstep(0., .08, seg) * (1. - smoothstep(.5 + .3 * h11(id + 9.), .92, seg));
  float lw = max((.05 + .04 * h11(id + 5.)) * min(1., n / 22.), fu * .55);          // every thread a few centimetres of ink, whatever its set
  float ln = (1. - smoothstep(lw, lw + max(fu, .01) * 1.3, abs(fract(u) - .5 + .16 * min(1., n / 22.) * sin(y * .21 + id)))) * on;
  return ln * (1. - fk * smoothstep(f0, f0 * 2.5, fu)) * clamp(.1 / lw, 0., 1.);
}
#endif
void main(){
  vec3 d = vW - cameraPosition;
  vec3 st = silkTex(d);
  vec3 silk = cSilk * (1. + uWeave * st.x + .07 * st.y + .045 * st.z);
  vec3 vC = vCoat;
#ifdef GORGE
  float gW = clamp(vFold.y, 0., 1.);
  float gF = fract(vFold.x);
  float gT = abs(gF - .5) * 2.;                             // 1 in the valley of a fold, 0 on its ridge
  vC.z = mix(vC.z, (1. - gT) * 26., gW);
  vC.y = mix(vC.y, gT * gT * .9 - .25, gW);
#endif
  float hollow = clamp(vC.y, 0., 1.);      // negative values mark carved floors: they keep to the lower band
  float hN = (vW.y - uRange.x) / max(uRange.y - uRange.x, 1.);
  float n1 = fbm(vW.xz * .021 + 5.), n2 = vn(vW.xz * .23 + vW.y * .11);
  float hd = hN + (n1 - .5) * .14 + (n2 - .5) * .035 + clamp(vC.y, -1., 1.) * .10 * (1. - uFlat);
  float e = clamp(fwidth(hd) * .9, 1e-5, .009);      // a band edge is a deckled EDGE: on a face seen at a grazing angle it must not widen into a soft gradient
#ifdef GORGE
  float bM = smoothstep(uBands.x - e, uBands.x + e, hd + .07 * gW);     // in the gorge every step has its own umber foot (below), so the green comes lower
#else
  float bM = smoothstep(uBands.x - e, uBands.x + e, hd);
#endif
  float bA = smoothstep(uBands.y - e, uBands.y + e, hd);
  vec3 foot = mix(cSilk, cInk, .6);
#ifdef GORGE
  // EVERY BUTTRESS IS A CRAG OF ITS OWN, banded by its own height as the scroll bands its stacked rocks: an umber foot, malachite,
  // a cap of azurite, then the next crag above it; each fold steps its bands against its neighbour's at the ink crease, and
  // every band edge is deckled and sags in the cleft.
  float cgId = floor(vFold.x * 2.);                           // each flank of each fold: the cap steps at the gold ridge and at the ink crease
  float cgQ = gW + (n2 - .5) * .35, cgQe = clamp(fwidth(cgQ), .01, .08);
  float cgW = smoothstep(.5 - cgQe, .5 + cgQe, cgQ);          // where the fold is drawn at all: it ends at a deckled edge, never in a fade
  float cgOq = vFold.y + (n2 - .5) * .08, cgOe = clamp(fwidth(cgOq), .004, .03);
    float cgO = smoothstep(1.27 - cgOe, 1.27 + cgOe, cgOq);                 // the hut's outcrop (weight 1.5): drawn like a lake rock, flat fills and ink creases
  float cgM = cgW * (1. - cgO);
  float cgIq = vFold.y + (n2 - .5) * .05, cgIe = clamp(fwidth(cgIq), .004, .02);
  float cgIn = smoothstep(1.06 - cgIe, 1.06 + cgIe, cgIq);    // weights above 1 mark the gorge proper
  // ONE CAP TO A SPUR: umber foot, malachite body, azurite on its top third and nowhere below; the height is the spur's own
  // (metres above the floor it stands on), the edge deckled and sagging in the cleft
  float cgZ = vFold.z + (n1 - .5) * 10. + (n2 - .5) * 4. - gT * 5.;
  float cgE = clamp(fwidth(cgZ) * .9, .03, .8);
  float cgTop = 31. + 8. * h11(cgId * 3.7 + 1.3);
  // the caps are laid as we come near (every range's coat advances as we approach): patch by patch, each with a crisp edge.
  // From the bluff, and through the portal before we arrive, the heart of the peak is one field of malachite under the blue crown.
  float cgNq = (1. - smoothstep(190., 360., length(d))) + (n1 - .5) * .5;
  float cgCap = smoothstep(cgTop - cgE, cgTop + cgE, cgZ) * cgM * smoothstep(.48, .52, cgNq);
  bA = max(bA, cgCap * cgIn);
  bM = max(bM, cgCap);
#endif
  vec3 pig = mix(foot, cMal, bM);
  pig = mix(pig, cAzu, bA);
#ifdef GORGE
  pig = mix(pig, mix(cMal, cInk, .4), cgCap * (1. - cgIn) * (1. - bA) * .9);      // on the open flank the caps are deep green, malachite over ink: the peak stays green from the bluff
#endif
#ifdef GORGE
  // every step of the gorge has its own foot: the umber wash shows through in the lower part of each cliff, deckled, lower in the folds
  float gz = vFold.z + (n1 - .5) * 12. + (n2 - .5) * 5. + gT * 6.;
  float gze = clamp(fwidth(gz), .04, .7);
  float gFoot = cgW * (1. - smoothstep(7. - gze, 7. + gze, gz));      // the umber foot stops at a deckled edge too
  pig = mix(pig, foot, gFoot);
  bA *= 1. - gFoot;                                                    // the umber foot takes no blue: the third coat lies on the crag above it, never on the wash (umber under azurite is a colour outside the seven)
#endif
  // where two bands meet the upper one ends in a darker bead, as wet pigment does
  float bead = (1. - smoothstep(.004 - e, .004 + e, hd - uBands.x)) * bM + (1. - smoothstep(.004 - e, .004 + e, hd - uBands.y)) * bA;
  // the coats
  vec2 gp = vW.xz + vW.y * vec2(.37, .61);
  float rag = (fbm(gp * .045 + 11.) - .5) * 26. + (vn(gp * .4) - .5) * 5.;
  rag += (fbm(gp * .0035 + 3.) - .5) * 110. * uFlat;         // on a far range the front is ragged at the size it is seen at
  float dist = max(mix(vC.x * (1. - .4 * hollow), (1. - hN) * uRun, uFlat) + rag, 0.);   // a far range takes its coat by height: the front is a ragged level line, no edge of the mesh shows
  float age2 = uCoatT.x - dist / max(uSpeed, .1);
  float age3 = uCoatT.y - dist / max(uSpeed, .1);
  float aw = clamp(fwidth(age2) * 1.2, .012, .22);             // the front of a coat is an edge of wet paint, a pixel or two wide at any distance, never a soft ramp
  float k2 = smoothstep(0., aw, age2) * clamp(uCap - 1., 0., 1.);
  float k3 = smoothstep(0., aw, age3) * clamp(uCap - 2., 0., 1.);
  // wet paint behind the front is a darker FLAT tone that ends at a deckled edge, and a darker lip at the front itself: never a ramp
  float wn = (vn(vW.xz * .23 + vW.y * .11) - .5), we = clamp(aw * 1.5, .02, .3);
  float wet = max(k2 * (1. - smoothstep(1.9 - we, 1.9 + we, age2 + wn * 1.3)), k3 * (1. - smoothstep(1.9 - we, 1.9 + we, age3 + wn * 1.3)));
  float lip = max(k2 * (1. - smoothstep(.45 - we, .45 + we, age2 + wn * .3)), k3 * (1. - smoothstep(.45 - we, .45 + we, age3 + wn * .3)));
  float valley = 1. - smoothstep(0., 16., vC.z);
  float grain = vn(gp * 2.6) * .6 + vn(gp * 6.3 + 3.) * .4;
  // pigment pools in the folds: a darker FLAT tone that ends at a deckled edge part way up each flank, never a ramp across the
  // fold (and never on a far range: there it would follow the mesh)
  float pz = vC.z + (n2 - .5) * 7. + (vn(gp * .19 + 2.) - .5) * 9.;
  float pze = clamp(fwidth(pz) * .9, .03, 1.2);
  float fold = mix(mix(.74, 1.03, smoothstep(8.5 - pze, 8.5 + pze, pz)), 1., uFlat);
  valley = (1. - smoothstep(3.5 - pze, 3.5 + pze, pz)) * (1. - uFlat);
  vec3 c1 = mix(silk, mix(pig, cMal, bA * .92) * mix(1., fold, .6) * (1. + uWeave * st.x), (.45 - .1 * (n2 - .5)) * uThin);
  float gf = fwidth(gp.x) + fwidth(gp.y);
  float speck = (vn(gp * 7.) * .6 + vn(gp * 17.) * .4 - .5) * (1. - smoothstep(.05, .35, gf));     // mineral grain, seen from near
  float tq = (hN + (n1 - .5) * .5) * 16.; float tf = fwidth(tq);
  float tide = (1. - smoothstep(.015, .015 + tf * 1.3 + 1e-4, abs(fract(tq) - .5))) * (1. - smoothstep(.12, .3, tf)) * step(.45, n2);   // drying lines of the wash
  vec3 c2 = pig * fold * (.97 + .06 * grain + .22 * speck) * (1. - .2 * tide);
  vec3 deep = mix(pig, uWinter > .5 ? cShell : cAzu * .8, bA * (uWinter > .5 ? .93 : .55));
  vec3 c3 = deep * mix(.60 + .34 * smoothstep(.25, .75, grain) + .4 * speck, .9 + .1 * smoothstep(.25, .75, grain) + .1 * speck, uWinter * bA) * fold * (1. - .12 * valley);
  c3 = mix(c2, c3, .35 + .65 * bA);                           // the third coat is the blue: lower bands only deepen a little
  vec3 col = mix(c1, c2, k2);
  col = mix(col, mix(cMal, cAzu, .62) * 1.12, bA * 4. * k2 * (1. - k2) * .8);    // a half-laid blue coat on tea silk stays a blue-green of azurite's own hue, never the grey-violet of a plain mix
  col = mix(col, c3, k3);
  col *= 1. - .12 * bead * (k2 * .7 + .3);
  col *= 1. - .16 * wet - .16 * lip;
#ifdef GORGE
  {
    // THE COAT MODELS THE FOLD, in flat tones with deckled edges: beside every gold ridge one flank was laid thin (the stain,
    // weave showing), the paint lies thick and dark in the crease, and the brush's upright strokes show between.
    float gpp = length(fwidth(vW));
    float nb = (vn(vec2(vFold.x * 2.3, vW.y * .13)) - .5) * .22 + (vn(vec2(vW.y * .8, vFold.x * 7.)) - .5) * .07;
    float fg = fwidth(gT) * 1.2 + .012;
    float gq = gW + nb * 1.3, ge = clamp(fwidth(gq), .01, .08);
    float gWe = smoothstep(.5 - ge, .5 + ge, gq);              // where the fold's drawing ends it ends at a deckled edge, never in a fade
    float pale = step(.5, gF) * (1. - smoothstep(.3 + nb, .3 + nb + fg, gT)) * gWe * (1. - cgO);
    vec3 stain = mix(silk, mix(pig, cMal, bA * .8) * (1. + uWeave * st.x), .5 * uThin);     // under the blue the first coat is green
    col = mix(col, stain, pale * .5 * (1. - k2));
    col *= 1. + .06 * pale * k2;
    float pool = smoothstep(.6 + nb, .6 + nb + fg, gT) * gWe * (1. - pale);
    col *= 1. - .17 * pool * k2;
    float q2 = vFold.x * 4. + (vn(vec2(vW.y * .08, vFold.x * .9)) - .5) * .9;
    float f2 = fwidth(q2), id2 = floor(q2);
    float bq2 = vn(vec2(id2 * 5.1, vW.y * .15 + id2 * 2.3)), be2 = clamp(fwidth(bq2) * 1.2, .004, .04);
    float brk2 = smoothstep(.6 - be2, .6 + be2, bq2);            // few, long, crisp: a wash of fine half-seen touches reads as blur
    float hemp = (1. - smoothstep(min(.07, f2 * 4.), min(.07, f2 * 4.) + f2 * 1.2 + 1e-4, abs(fract(q2) - .5))) * brk2 * (1. - smoothstep(.12, .28, f2)) * (1. - smoothstep(.2, .4, gpp)) * cgM;
    col = mix(col, mix(cInk, col, .25), clamp(hemp * (.5 + .25 * pale) * min(uStroke, 1.5), 0., 1.));
  }
#endif
  // flakes: thick paint has let go in patches and the silk shows, with a dark rim
  float fl = fbm(gp * .17 + 31.) + (vn(gp * .9) - .5) * .06 - .1 * (1. - smoothstep(.4, .6, vn(gp * .02 + 9.)));
  fl += uFlake;
  float fle = clamp(fwidth(fl), .0012, .005);
  float fk = smoothstep(.705 - fle, .705 + fle, fl) * k2;        // a flaked patch has a broken edge, sharp at any distance
  col = mix(col, silk * .97, fk * .9);
  col *= 1. - .25 * k2 * smoothstep(.685, .70, fl) * (1. - smoothstep(.705 - fle, .705 + fle, fl));
  // the scar where a plate of pigment lifted: bare silk with a dark rim, until the last coat fills it
  float sr = length(vW.xz - uScar.xy) / max(uScar.z, 1.) + (vn(gp * .12) - .5) * .25;
  float scar = (1. - smoothstep(.92, .96, sr + (1. - uScar.w) * .9)) * step(.001, uScar.w);
  col = mix(col, silk * .98, scar);
  col *= 1. - .3 * uScar.w * smoothstep(.86, .96, sr) * (1. - smoothstep(.96, 1.02, sr));
  // valley creases: an ink-umber line where two slopes meet
  float cw = fwidth(vC.z);
  float cz = vC.z + (n2 - .5) * .35, cze = fwidth(cz) * .9 + 1e-4;
  float cl = (1. - smoothstep(.9 - cze, .9 + cze, cz)) * (1. - uFlat);      // the crease is a drawn line with a deckled edge; a far range has the dry line below instead
  col = mix(col, mix(cInk, col, .25), cl * (.55 + .25 * k2) * (1. - smoothstep(3., 9., cw)) * smoothstep(.002, .008, cw));
  // on a far range the crease is a single dry ink line a pixel wide, broken where the brush lifted
  float clf = (1. - smoothstep(cw * .7, cw * 1.5 + 1e-4, vC.z)) * step(.38, vn(vW.xz * .012 + vW.y * .02)) * uFlat * smoothstep(.01, .05, cw);
  col = mix(col, mix(cInk, col, .3), clf * .6);
  // texture strokes: on steep faces the ink underdrawing shows as broken upright strokes, plainest under a thin coat
  vec3 fn = cross(dFdx(vW), dFdy(vW)); float fnl = length(fn);
  float ny = fnl > 1e-10 ? abs(fn.y) / fnl : 1.;
  float mpp = length(fwidth(vW));                               // metres under one pixel
  float sAx = abs(fn.x) > abs(fn.z) ? vW.z * 1.03 + vW.x * .2 : vW.x * 1.03 + vW.z * .2;      // strokes stand upright ACROSS the face they are on (a face lying along one fixed axis would be inked whole)
  float sc = sAx / 2.3 + (vn(vec2(vW.y * .06, sAx * .02)) - .5) * 1.6;
  float sf = fwidth(sc), sid = floor(sc);
  float bq = vn(vec2(sid * 7.3, vW.y * .085 + sid * 1.7)), be = clamp(fwidth(bq) * 1.2, .004, .04);
  float brk = smoothstep(.5 - be, .5 + be, bq);
  float um = 1. - bM;                                          // the umber foot is all drawing: its strokes are plainer and lie on gentler ground too
  float stroke = (1. - smoothstep(min(.05, sf * 3.), min(.05, sf * 3.) + sf * 1.2 + 1e-4, abs(fract(sc) - .5))) * brk * (1. - smoothstep(.36 + .34 * um, .6 + .34 * um, ny)) * (1. - smoothstep(.13, .3, sf)) * (1. - smoothstep(.3, .6, mpp)) * (1. - uFlat);
#ifdef GORGE
  stroke *= (1. - cgO) * (1. - .5 * cgW);
#endif
  col = mix(col, mix(cInk, col, .2), clamp(stroke * (.5 - .14 * k2 - .2 * k3 + .28 * um) * max(uStroke, um), 0., 1.));
#ifdef GORGE
  {
    // THE FALL'S GROUND IS NOT PAINTED (since the fifth version the main fall carries running threads of shell white, laid in the loop
    // below: a departure from the brief's letter, named in that version's notes). The pigment stops at a deckled edge and the bare silk of the sky shows; the water is drawn the
    // way the painter draws it: many fine broken ink threads running down at different speeds (a coarse set seen from the lake,
    // a fine set that appears as the eye comes near), and at the foot a mound of spray scallops, bare silk outlined in ink.
    float run = vL.y - vL.z * .45, fx = fwidth(vL.x) + 1e-4;
    float fv = fx + fwidth(vFold.z) + fwidth(vL.z);
    float face = smoothstep(2.3, 2.7, vFold.z + (n2 - .5) * 1.5);
    float v = -1e3;                                             // metres above the foot of the nearest fall, along the water
    for (int k = 0; k < 3; k++) { float dz = vL.z - uFoot[k]; if (dz > -18. && dz < 14.) v = vFold.z - max(dz, 0.); }
    for (int i = 0; i < 3; i++) {
      vec4 F = uFalls[i]; float fi = float(i);
      float hw = F.y * (1. + .3 * (vn(vec2(run * .045, fi * 7.3)) - .5));
      float xx = vL.x - F.x - sin(run * .043 + fi * 2.1) * F.y * .22;
      float sd = xx < 0. ? 3.7 : 8.3;
      float dk = (vn(vec2(run * .5, sd + fi)) - .5) * 1.6 + (vn(vec2(run * 2.1, sd * 2.3)) - .5) * .6;
      float ed = abs(xx) - hw - dk * min(1., F.y * .35);
      float inz = smoothstep(F.z - 3., F.z + 1., vL.z + dk * 2.) * (1. - smoothstep(F.w - 1., F.w + 3., vL.z + dk * 2.));
      if (i > 0) inz = step(.5, inz) * face * (1. - cgO) * cgW;                                   // a rill is a thread on the cliff, never a road across the ledge
      float m = (1. - smoothstep(-fx, fx, ed)) * inz;
      float ux = xx / max(hw, .1) * .5 + .5, f1 = fx / max(2. * hw, .2);
      float ln = i == 0 ? max(fallThreads(ux, 7., run, f1, 0., .5, .6) * (.6 + .4 * smoothstep(.2, .5, f1 * 31.)), fallThreads(ux, 31., run, f1, 5., .2, 1.)) : fallThreads(ux, 2., run, f1, 3. + fi, .5, .6);
      ln *= mix(.4, 1., smoothstep(.5, 3., vFold.z));           // on the level ledge the stream is nearly bare: the threads belong to the fall
      float bead = (1. - smoothstep(0., .9, ed)) * (1. - m) * inz;
      col *= 1. - .3 * bead;
      col = mix(col, mix(silk, mix(cSilk, cInk, .82), ln * .68), m);
      if (i == 0) { float wu = ux * 9., wid = floor(wu), wy = run + uTime * uFallRun * (.6 + .8 * h11(wid + 31.)), wsg = fract(wy / (14. + 10. * h11(wid + 7.)) + h11(wid * 3.3)); col = mix(col, cShell, m * .9 * smoothstep(0., .1, wsg) * (1. - smoothstep(.55, .9, wsg)) * (1. - smoothstep(.1, .11 + 1.3 * fwidth(wu), abs(fract(wu) - .5 + .14 * sin(wy * .21 + wid)))) * mix(.4, 1., smoothstep(.5, 3., vFold.z))); }   // over the bare silk and its ink threads (about a sixth of the white lies on an ink thread) the water itself runs in broken threads of shell white, nine to the fall's width, each at its own speed, matte; a thread is a fifth of its ninth wide and a pixel's soft edge more at any distance, so near the lens the threads are thin and far off they close toward a pale band
      if (i == 0) {
        float W = 1.9, cxs = floor(xx / W + .5), lx = xx / W - cxs, ex = cxs * W / max(F.y * 1.7, .1);
        float env = 1. - ex * ex;
        float topv = 5.4 * env + 1.3 * (h11(cxs + 2.) - .5);
        float fe = v - (topv + sqrt(max(.25 - lx * lx, 0.)) * W);
        float inf = step(0., env) * step(-7., v);
        float foam = (1. - smoothstep(-fv, fv, fe)) * inf;
        float rr = floor(v / 1.15), ly = v / 1.15 - rr;
        float lx2 = fract(xx / W + .5 * mod(rr, 2.) + .5) - .5;
        float lwm = max(.075, fv * .8);
        float arcs = (1. - smoothstep(lwm, lwm + fv, abs(length(vec2(lx2 * W, ly * 1.15)) - .5 * W))) * step(v, topv - .2);
        float rim = 1. - smoothstep(lwm, lwm + fv, abs(fe));
        float inkf = max(arcs * .55, rim * .8) * (1. - .7 * smoothstep(.35, 1.1, fv));
        col *= 1. - .3 * (1. - smoothstep(0., .9, fe)) * (1. - foam) * inf * (1. - m);
        col = mix(col, mix(silk, mix(cSilk, cInk, .82), inkf), max(foam, rim * inf));
      }
    }
  }
#endif
  // the glance: coarse azurite grains glint, slowly, inside the band
  float gl = glanceAt(vW);
  vec2 cell = floor(gp * .9); vec2 cf = fract(gp * .9) - .5 - (h22(cell) - .5) * .6;
  float gh = h21(cell + 17.);
  float pulse = sin(uTime * 1.9 + gh * 40.); pulse = max(pulse, 0.); pulse *= pulse;
  float pt = 1. - smoothstep(.0, .18 + fwidth(gp.x) * .9, length(cf));
  col += vec3(.55, .75, 1.) * pt * step(.82, gh) * pulse * gl * bA * max(k2, .0) * 1.1;
  gl_FragColor = vec4(col, 1.);
}`;

// GOLD: every ridge is a real ribbon that turns to the eye, 0.5 m wide and never under 1.5 pixels.
const VERT_GOLD = /* glsl */`
attribute vec3 aDir; attribute vec2 aSide;       // aSide: x = -1/+1 across the ribbon, y = width factor (1 ridge .. 0.5 sub-spur)
uniform vec2 uRes; uniform float uGoldW; uniform vec4 uGlance;
varying vec3 vW; varying vec2 vS;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vec3 t = mat3(modelMatrix) * aDir;
  vec3 v = w.xyz - cameraPosition;
  float dist = max(length(v), .1);
  vec3 sd = cross(t, v);
  float l = length(sd);
  sd = l > 1e-5 ? sd / l : vec3(0., 1., 0.);
  float px = dist * 2. / max(projectionMatrix[1][1] * uRes.y, 1.);     // metres per pixel at this distance
  float want = uGoldW * aSide.y, least = px * 1.6;
  float wd = clamp(want, least, px * 3.);                              // GOLD IS A LINE: a hairline at any distance, never wider than three pixels; the glance lifts its colour, not its width
  w.xyz += sd * aSide.x * wd * .5;
  vW = w.xyz;
  vS = vec2(aSide.x, clamp(want / least, .0, 1.));
  vec3 wb = w.xyz - v / dist * min(1.2 + dist * .012, dist * .5);       // lifted toward the eye by a metre or two of real distance: a ribbon behind a spur stays behind it
  vec4 p = projectionMatrix * viewMatrix * w, pb = projectionMatrix * viewMatrix * vec4(wb, 1.);
  p.z = pb.z * p.w / max(pb.w, 1e-4);
  gl_Position = p;
}`;
const FRAG_GOLD = /* glsl */`
varying vec3 vW; varying vec2 vS;
uniform float uFarFade;    // metres beyond which sub-spur lines (width factor < .7) are dropped
${GLSL_COMMON}
void main(){
  float gl = glanceAt(vW);
  vec3 dull = mix(cGold, cInk, .3) * .78;                               // unlit: a dull ochre, still plainly not the green beside it
  float tw = .86 + .14 * sin(vW.x * .9 + vW.z * .7 + uTime * 2.1);
  vec3 col = mix(dull, cGold * vec3(1.34, 1.1, .72) * tw, gl * gl);      // lit: warm gold, never lemon
  float a = (1. - smoothstep(.7, 1., abs(vS.x))) * mix(.6 + .4 * vS.y, 1., gl);
  gl_FragColor = vec4(col, a);
}`;

// FLAT: shell white, vermilion, ink and wash for everything built, with ink outlines ruled in the material.
// attributes: color (linear rgb), aUV = (u, v, sizeU, sizeV) in metres on the face, aRule = spacing of ruled lines along v (0: none)
const VERT_FLAT = /* glsl */`
attribute vec4 aUV; attribute float aRule;
varying vec3 vW; varying vec3 vC; varying vec4 vUV; varying float vRule;
void main(){
  vC = color; vUV = aUV; vRule = aRule;
#ifdef USE_INSTANCING
  vec4 w = modelMatrix * (instanceMatrix * vec4(position, 1.));
#else
  vec4 w = modelMatrix * vec4(position, 1.);
#endif
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG_FLAT = /* glsl */`
varying vec3 vW; varying vec3 vC; varying vec4 vUV; varying float vRule;
uniform float uLine;       // ink line width in metres
${GLSL_COMMON}
void main(){
  vec2 q = min(vUV.xy, vUV.zw - vUV.xy);
  vec2 fq = fwidth(vUV.xy);
  vec2 lw = max(vec2(uLine), fq * .9);
  vec2 ln2 = 1. - smoothstep(lw, lw + fq * 1.2 + 1e-4, q);
  float ln = max(ln2.x, ln2.y);
  ln *= 1. - smoothstep(.5, 1.6, max(fq.x, fq.y) / max(min(vUV.z, vUV.w), 1e-3) * 3.);    // far away: a face thinner than its own outline keeps its colour
  float sp = max(abs(vRule), 1e-3);
  float rc = vRule >= 0. ? vUV.y : vUV.x;
  float rf = fwidth(rc) / sp;
  float r = abs(fract(rc / sp) - .5);
  float rl = (1. - smoothstep(.035, .035 + rf * 1.2 + 1e-4, .5 - r)) * step(1e-3, abs(vRule)) * (1. - smoothstep(.25, .5, rf));
  vec3 ink = cInk * .9;
  vec3 col = mix(vC, ink, max(ln * .9, rl * .6));
  gl_FragColor = vec4(col, 1.);
}`;

// FLAKE: a plate of thick pigment that has let go of the silk. One curled sheet: the face is deep granular azurite with a
// ragged edge, the back is the bare silk it came off, stained where the colour soaked through.
const FRAG_FLAKE = /* glsl */`
varying vec3 vW; varying vec2 vUv;
${GLSL_COMMON}
void main(){
  vec2 p = vUv * 2. - 1.;
  float r = length(p), a = atan(p.y, p.x + (abs(p.x) + abs(p.y) < 1e-6 ? 1e-5 : 0.));
  float edge = .74 + .2 * sin(a * 3. + 1.3) * sin(a * 2. - .4) + (vn(p * 2.6 + 3.) - .5) * .34 + (vn(p * 9. + 1.) - .5) * .12;
  float crack = abs(vn(p * 3.1 + 17.) - .5);                       // it broke along old drying cracks
  if (r > edge || (crack < .012 && r > .32)) discard;
  vec3 st = silkTex(vW - cameraPosition);
  vec3 silk = cSilk * (1. + uWeave * st.x);
  vec2 gp = p * 15.;
  float grain = vn(gp * 2.6) * .6 + vn(gp * 6.3 + 3.) * .4, speck = vn(gp * 9.) * .6 + vn(gp * 21.) * .4 - .5;
  float rim = smoothstep(edge - .09, edge, r);
  vec3 face = cAzu * (.66 + .26 * smoothstep(.25, .75, grain) + .34 * speck) * (1. - .28 * rim);
  face = mix(face, silk * .97, smoothstep(.73, .74, fbm(p * 4. + 9.)));          // small losses
  float soak = smoothstep(.42, .68, fbm(p * 3.3 + 5.)) * .06 + smoothstep(edge - .04, edge, r) * .5;
  soak = max(soak, smoothstep(.49, .5, fbm(p * 2.7 + 5.) + (vn(p * 11.) - .5) * .08));      // the back: blue has soaked through the silk in deckled patches, so it is plainly the back of a blue leaf
  vec3 back = mix(silk * .9, cAzu * .8, soak);
  back = mix(back, mix(cSilk, cInk, .7), .55 * smoothstep(edge - .075, edge - .045, r) * (1. - smoothstep(edge - .03, edge - .01, r)));   // an ink-umber line inside the broken edge: the back is drawn, not a ghost                     // the back: the silk it came off, blue where the colour soaked through and along the broken edge
  vec3 col = gl_FrontFacing ? face : back;
  float gl = glanceAt(vW);
  vec2 cell = floor(gp * .8); float gh = h21(cell + 17.);
  float pulse = max(sin(uTime * 1.9 + gh * 40.), 0.); pulse *= pulse;
  float pt = 1. - smoothstep(.0, .22, length(fract(gp * .8) - .5));
  if (gl_FrontFacing) col += vec3(.55, .75, 1.) * pt * step(.8, gh) * pulse * gl;
  gl_FragColor = vec4(col, 1.);
}`;

// STAMP: a tree is a stamped cluster of five to nine flat dots; one instanced quad each, turned to the eye.
const VERT_STAMP = /* glsl */`
attribute vec4 iPos;        // xyz local position of the foot, w: size in metres
attribute vec2 iSeed;       // x: seed 0..1, y: kind (0 deep green, 1 vermilion, 2 shell blossom)
varying vec2 vQ; varying vec2 vSeed; varying vec3 vW;
uniform float uTime;
void main(){
  vQ = position.xy; vSeed = iSeed;
  vec4 w = modelMatrix * vec4(iPos.xyz, 1.);
  // every stamp stands a few decimetres nearer or farther along the ray from the eye, by its seed: two prints at the same
  // distance are otherwise in one plane and cut each other into stripes that flicker as the eye moves
  vec3 ray = w.xyz - cameraPosition; float rl = max(length(ray), 1e-3);
  w.xyz += ray / rl * (iSeed.x - .5) * (.7 + .004 * rl);
  vec3 r = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
  float s = iPos.w;
  float nod = sin(uTime * .9 + iSeed.x * 40.) * .05 * s * (position.y + .1);
  w.xyz += r * (position.x * s + nod) + vec3(0., (position.y + .32) * s, 0.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG_STAMP = /* glsl */`
varying vec2 vQ; varying vec2 vSeed; varying vec3 vW;
${GLSL_COMMON}
void main(){
  float n = 5. + floor(vSeed.x * 4.99);
  float dmin = 1.;
  float top = 0.;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    vec2 hsh = h22(vec2(fi * 3.7 + vSeed.x * 91., vSeed.x * 57. + fi));
    float ang = fi * 2.4 + hsh.x * 1.2;
    float rad = sqrt((fi + .3) / 9.) * .34;
    vec2 c = vec2(cos(ang) * rad * 1.15, sin(ang) * rad * .8 - .02);
    float rr = .13 + .05 * hsh.y;
    float dd = length((vQ - c) * vec2(1., 1.25)) - rr;
    if (fi < n && dd < dmin) { dmin = dd; top = hsh.y; }
  }
  if (dmin > 0.) discard;
  vec3 deep = mix(cMal, cInk, .52 + .16 * top);
  vec3 col = vSeed.y < .5 ? deep : (vSeed.y < 1.5 ? cVerm * .92 : cShell * .9);
  col *= 1. - .25 * smoothstep(-.035, 0., dmin);              // the stamp's rim prints darker
  gl_FragColor = vec4(col, 1.);
}`;

// WHEEL: a pine's needle cluster, a wheel of fourteen separate strokes, malachite over ink. Same instanced quad as a stamp.
const FRAG_WHEEL = /* glsl */`
varying vec2 vQ; varying vec2 vSeed; varying vec3 vW;
${GLSL_COMMON}
void main(){
  vec2 q = vQ * 2.;
  float r = length(q);
  float fw = max(fwidth(q.x), fwidth(q.y));
  float a = atan(q.y, q.x + (abs(q.x) + abs(q.y) < 1e-5 ? 1e-5 : 0.)) / 6.2831853 * 14. + vSeed.x * 3.;
  float id = floor(a);
  float dA = abs(fract(a) - .5) * (6.2831853 / 14.) * r;                 // metres across the stroke, in wheel radii
  float len = .72 + .27 * h11(id + vSeed.x * 31.);
  float w = max(.05 * (1. - .55 * r / len), fw * .55);
  float on = (1. - smoothstep(w, w + fw * .8 + 1e-4, dA)) * step(.07, r) * (1. - smoothstep(len - .04, len, r));
  on = max(on, 1. - smoothstep(.06, .09, r));                          // the hub
  on = max(on, (1. - smoothstep(.55, .7, r)) * smoothstep(.12, .3, fw)); // far away the wheel prints as a dot
  if (on < .5) discard;
  vec3 col = mix(cMal, cInk, .5 + .35 * step(.6, h11(id * 3.1 + vSeed.x * 7.)));
  if (vSeed.y > .5) col = mix(cInk, cSilk, .08);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------
// makeStyle: the palette, the five materials, their shared uniforms and the geometry helpers.
// ---------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE;
  // Inputs are corrected so that the picture after ACES matches the brief's hexes (assumes exposure 1.0, no grade).
  const fix = (h, m = [1, 1, 1], sat = 1) => {
    const c = new THREE.Color(h); const l = (c.r + c.g + c.b) / 3;
    c.setRGB((l + (c.r - l) * sat) * m[0], (l + (c.g - l) * sat) * m[1], (l + (c.b - l) * sat) * m[2]); return c;
  };
  const palette = {
    silk: fix(hex[0], [1.02, 0.91, 0.86]), ink: fix(hex[1]), malachite: fix(hex[2], [1, 1, 1], 0.78), azurite: fix(hex[3], [0.95, 1.5, 1.15]),
    gold: fix(hex[4]), shell: fix(hex[5], [1.48, 1.29, 0.975]), vermilion: fix(hex[6], [0.76, 1.12, 1.55], 1),
  };
  const gd = opts.glanceDir || [-1, 0];           // world direction the glance travels (left to right for a camera flying +Z)
  const cb = opts.creases || [-0.62, 0.21, 1.37];
  const U = {
    uTime: { value: 0 }, uGlance: { value: new THREE.Vector4(gd[0], gd[1], -1e4, 80) }, uCrease: { value: new THREE.Vector3(cb[0], cb[1], cb[2]) },
    cSilk: { value: palette.silk }, cInk: { value: palette.ink }, cMal: { value: palette.malachite }, cAzu: { value: palette.azurite },
    cGold: { value: palette.gold }, cShell: { value: palette.shell }, cVerm: { value: palette.vermilion },
    uWeave: { value: opts.weave ?? 0.05 }, uRes: { value: new THREE.Vector2(1600, 900) },
  };
  const glance = { period: 17, speed: 60, start: -510, centre: opts.glanceCentre ?? 0 };
  const mats = [];
  const mk = (o, extra) => { const m = new THREE.ShaderMaterial({ ...o, uniforms: { ...U, ...(extra || {}) } }); mats.push(m); return m; };

  // SILK. mode: 'sky' | 'lake' | 'mist' | 'fall' | 'plain'. Sky, water, mist and waterfall are this one material.
  function silk(mode = 'plain', o = {}) {
    if (mode === 'sky') return mk({ vertexShader: VERT_SKY, fragmentShader: FRAG_SILK, side: THREE.BackSide, depthWrite: false, depthTest: false });
    if (mode === 'lake') return mk({ vertexShader: VERT_WORLD, fragmentShader: FRAG_SILK, defines: { LAKE: 1 } }, {
      uBridge: { value: new THREE.Vector4(1e5, 500, 10, 10) }, uShore: { value: new THREE.Vector4(1e5, 1, 0, 60) },
      uRipple: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 1, 0)) } });
    if (mode === 'mist') return mk({ vertexShader: VERT_UV, fragmentShader: FRAG_SILK, defines: { MIST: 1 }, transparent: true, depthWrite: false, side: THREE.DoubleSide },
      { uDrift: { value: o.drift ?? 0.002 }, uScal: { value: o.scallops ?? 40 }, uEdge: { value: new THREE.Vector3(o.edge ?? 0.42, o.ends ?? 0.05, o.foot ?? 0.2) } });
    if (mode === 'fall') return mk({ vertexShader: VERT_UV, fragmentShader: FRAG_SILK, defines: { FALL: 1 }, side: THREE.DoubleSide },
      { uFall: { value: new THREE.Vector3(o.threads ?? 40, o.height ?? 50, o.speed ?? 9) } });
    return mk({ vertexShader: VERT_WORLD, fragmentShader: FRAG_SILK, side: o.side ?? THREE.FrontSide });
  }
  // the bare silk dome; follows whatever camera update() is given
  let dome = null;
  function sky(radius = 5000) {
    dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 12), silk('sky'));
    dome.renderOrder = -10; dome.frustumCulled = false; return dome;
  }
  // PIGMENT. One material per range (its own coat clock). foot/top: world y of the band scale.
  function pigment(o = {}) {
    const m = mk({ vertexShader: VERT_PIG, fragmentShader: FRAG_PIG, side: o.side ?? THREE.FrontSide, defines: o.gorge ? { GORGE: 1 } : {} }, {
      ...(o.gorge ? { uFalls: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 1e5, 1e5)) }, uFallRun: { value: 10 }, uFoot: { value: new THREE.Vector3(1e5, 1e5, 1e5) } } : {}),
      uRange: { value: new THREE.Vector2(o.foot ?? 0, o.top ?? 280) }, uBands: { value: new THREE.Vector2(o.green ?? 0.2, o.blue ?? 0.6) },
      uCoatT: { value: new THREE.Vector2(-1, -1) }, uSpeed: { value: o.speed ?? 14 }, uCap: { value: o.cap ?? 3 }, uWinter: { value: o.winter ? 1 : 0 },
      uThin: { value: o.thin ?? opts.thin ?? 1 }, uFlake: { value: o.flake ?? opts.flake ?? 0 }, uStroke: { value: o.stroke ?? opts.stroke ?? 1 }, uScar: { value: new THREE.Vector4(0, 0, 1, 0) }, uFlat: { value: o.flat ?? 0 }, uRun: { value: o.run ?? 300 } });
    // seconds since the second and the third coat were begun at the summit (negative: not begun). 1e3 = long dry.
    m.setCoats = (t2, t3) => { m.uniforms.uCoatT.value.set(t2, t3); };
    return m;
  }
  let goldMat = null, flatMat = null, stampMat = null, wheelMat = null;
  const wheel = () => wheelMat || (wheelMat = mk({ vertexShader: VERT_STAMP, fragmentShader: FRAG_WHEEL, side: THREE.DoubleSide }));
  const gold = () => goldMat || (goldMat = mk({ vertexShader: VERT_GOLD, fragmentShader: FRAG_GOLD, transparent: true, depthWrite: false, side: THREE.DoubleSide },
    { uGoldW: { value: opts.goldWidth ?? 0.5 }, uFarFade: { value: 2000 } }));
  const flat = () => flatMat || (flatMat = mk({ vertexShader: VERT_FLAT, fragmentShader: FRAG_FLAT, vertexColors: true, side: THREE.DoubleSide },
    { uLine: { value: opts.inkWidth ?? 0.07 } }));
  const flake = () => mk({ vertexShader: VERT_UV, fragmentShader: FRAG_FLAKE, side: THREE.DoubleSide });
  const stamp = () => stampMat || (stampMat = mk({ vertexShader: VERT_STAMP, fragmentShader: FRAG_STAMP, side: THREE.DoubleSide }));

  const _sz = new THREE.Vector2(), _cp = new THREE.Vector3();
  function update(dt, time, camera) {
    U.uTime.value = time;
    const ph = ((time % glance.period) + glance.period) % glance.period;
    U.uGlance.value.z = glance.centre + glance.start + ph * glance.speed;
    if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(_sz); if (_sz.y > 0) U.uRes.value.copy(_sz); }
    if (dome && camera) { camera.getWorldPosition(_cp); dome.position.copy(_cp); }
  }
  const style = { palette, uniforms: U, glance, silk, sky, pigment, gold, flat, flake, stamp, wheel, update, wheels: (list) => makeStamps(style, list, wheel()),
    goldRibbon: (lines) => goldRibbon(style, lines), batch: () => makeBatch(style), stamps: (list) => makeStamps(style, list),
    mountain: (spec) => buildMountain(ctx, style, spec), spurs };
  return style;
}

// ---------------------------------------------------------------------------------------------
// geometry helpers of the style
// ---------------------------------------------------------------------------------------------
// goldRibbon(lines): lines = [{ pts: [[x,y,z], ...], w: width factor 0.5..1 }] -> one Mesh (one draw) of eye-facing ribbons.
function goldRibbon(style, lines) {
  let nv = 0, ni = 0;
  for (const l of lines) if (l.pts.length > 1) { nv += l.pts.length * 2; ni += (l.pts.length - 1) * 6; }
  const pos = new Float32Array(nv * 3), dir = new Float32Array(nv * 3), side = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let v = 0, k = 0;
  for (const l of lines) {
    const P = l.pts, n = P.length; if (n < 2) continue;
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], p = P[i];
      let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
      const end = (i === 0 || i === n - 1) ? 0.35 : 1;                 // strokes taper at their ends
      for (let s = -1; s <= 1; s += 2) {
        pos[v * 3] = p[0]; pos[v * 3 + 1] = p[1]; pos[v * 3 + 2] = p[2];
        dir[v * 3] = dx; dir[v * 3 + 1] = dy; dir[v * 3 + 2] = dz;
        side[v * 2] = s; side[v * 2 + 1] = (l.w ?? 1) * end; v++;
      }
      if (i < n - 1) { const o = v - 2; idx[k++] = o; idx[k++] = o + 1; idx[k++] = o + 2; idx[k++] = o + 1; idx[k++] = o + 3; idx[k++] = o + 2; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const m = new THREE.Mesh(g, style.gold()); m.frustumCulled = false; m.renderOrder = 3; return m;
}

// makeBatch(): collects flat-coloured quads and boxes with ink-ruled edges into ONE geometry for style.flat().
//   quad(a, b, c, d, col, o)   corners in order; o.rule = spacing of ruled lines (m; negative: ruled the other way);
//                              o.uv = [[u,v] x4] and o.size = [su, sv] in metres to share one outline across many quads; o.bare: no outline
//   box(cx, cy, cz, sx, sy, sz, col, o)   o.rotY, o.rule, o.skip = 'b' | 't' | 'bt' (bottom/top faces left out)
//   tri(a, b, c, col)          no outline
function makeBatch(style) {
  const P = [], C = [], UV = [], R = [], I = [];
  let n = 0;
  const vert = (p, col, u, v, su, sv, rule) => { P.push(p[0], p[1], p[2]); C.push(col.r, col.g, col.b); UV.push(u, v, su, sv); R.push(rule); return n++; };
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const B = {
    count: () => I.length / 3,
    quad(a, b, c, d, col, o = {}) {
      const rule = o.rule || 0;
      let uv = o.uv, su, sv;
      if (uv) { su = o.size[0]; sv = o.size[1]; } else if (o.bare) { uv = [[50, 50], [50, 50], [50, 50], [50, 50]]; su = sv = 100; }
      else { su = Math.max(len(a, b), len(d, c)); sv = Math.max(len(a, d), len(b, c)); uv = [[0, 0], [su, 0], [su, sv], [0, sv]]; }
      const i0 = vert(a, col, uv[0][0], uv[0][1], su, sv, rule), i1 = vert(b, col, uv[1][0], uv[1][1], su, sv, rule);
      const i2 = vert(c, col, uv[2][0], uv[2][1], su, sv, rule), i3 = vert(d, col, uv[3][0], uv[3][1], su, sv, rule);
      I.push(i0, i1, i2, i0, i2, i3);
    },
    tri(a, b, c, col) { const i0 = vert(a, col, 50, 50, 100, 100, 0), i1 = vert(b, col, 50, 50, 100, 100, 0), i2 = vert(c, col, 50, 50, 100, 100, 0); I.push(i0, i1, i2); },
    box(cx, cy, cz, sx, sy, sz, col, o = {}) {
      const cs = Math.cos(o.rotY || 0), sn = Math.sin(o.rotY || 0), hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const c = (x, y, z) => [cx + x * cs + z * sn, cy + y, cz - x * sn + z * cs];
      const skip = o.skip || '';
      const q = (a, b, cc, d) => B.quad(a, b, cc, d, col, o);
      q(c(-hx, -hy, hz), c(hx, -hy, hz), c(hx, hy, hz), c(-hx, hy, hz));
      q(c(hx, -hy, -hz), c(-hx, -hy, -hz), c(-hx, hy, -hz), c(hx, hy, -hz));
      q(c(hx, -hy, hz), c(hx, -hy, -hz), c(hx, hy, -hz), c(hx, hy, hz));
      q(c(-hx, -hy, -hz), c(-hx, -hy, hz), c(-hx, hy, hz), c(-hx, hy, -hz));
      if (!skip.includes('t')) q(c(-hx, hy, hz), c(hx, hy, hz), c(hx, hy, -hz), c(-hx, hy, -hz));
      if (!skip.includes('b')) q(c(-hx, -hy, -hz), c(hx, -hy, -hz), c(hx, -hy, hz), c(-hx, -hy, hz));
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
      g.setAttribute('aUV', new THREE.BufferAttribute(new Float32Array(UV), 4)); g.setAttribute('aRule', new THREE.BufferAttribute(new Float32Array(R), 1));
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(I), 1)); g.computeBoundingSphere(); return g;
    },
    mesh() { return new THREE.Mesh(B.geometry(), style.flat()); },
    // the same geometry made in five short steps (a big batch is tens of thousands of numbers to copy)
    async geometryAsync(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); await ctx.yield();
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); await ctx.yield();
      g.setAttribute('aUV', new THREE.BufferAttribute(new Float32Array(UV), 4)); await ctx.yield();
      g.setAttribute('aRule', new THREE.BufferAttribute(new Float32Array(R), 1)); g.setIndex(new THREE.BufferAttribute(new Uint32Array(I), 1)); await ctx.yield();
      g.computeBoundingSphere(); return g;
    },
  };
  return B;
}

// makeStamps(list): list = [[x, y, z, size, kind], ...] (kind 0 deep green, 1 vermilion, 2 shell blossom) -> one instanced Mesh.
function makeStamps(style, list, mat) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const ip = new Float32Array(list.length * 4), is = new Float32Array(list.length * 2);
  for (let i = 0; i < list.length; i++) {
    const t = list[i]; ip[i * 4] = t[0]; ip[i * 4 + 1] = t[1]; ip[i * 4 + 2] = t[2]; ip[i * 4 + 3] = t[3];
    is[i * 2] = (Math.abs(Math.sin(t[0] * 12.9898 + t[2] * 78.233 + t[1] * 3.1) * 43758.5453)) % 1; is[i * 2 + 1] = t[4] || 0;
  }
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 4)); g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(is, 2));
  g.instanceCount = list.length;
  const m = new THREE.Mesh(g, mat || style.stamp()); m.frustumCulled = false; return m;
}

// spurs(rng, summit, o): the ridge polylines of one mountain. A summit throws o.n spurs, each a descending
// polyline with two orders of sub-spur. Returns [{ pts: [[x,y,z],...], order: 0|1|2, w }] for style.mountain().
//   o.n (6..9), o.foot (y where spurs stop), o.slope (mean descent, 0.8), o.from/o.to (bearing range, radians), o.sub (false: no sub-spurs)
function spurs(rng, summit, o = {}) {
  const out = [], foot = o.foot ?? 0, n = o.n ?? rng.int(6, 9), a0 = o.from ?? 0, a1 = o.to ?? Math.PI * 2;
  const full = Math.abs(a1 - a0) > 6.2;
  const walk = (x, y, z, ang, slope, order, maxLen) => {
    const pts = [[x, y, z]]; const st = order === 0 ? 8 : 6; let len = 0, ph = rng() * 6.28, wob = rng.range(30, 60);
    const branches = [];
    let nextB = rng.range(18, 40), sideB = rng.sign();
    while (y > foot - 4 && len < maxLen) {
      ang += (rng() - 0.5) * (order === 0 ? 0.22 : 0.3);
      const knob = 0.55 + 0.75 * (0.5 + 0.5 * Math.sin(ph + len / wob * 6.28));        // shoulders: the ridge eases, then drops
      const steep = slope * knob * (order === 0 ? 1.75 - 1.15 * Math.min(1, len / 55) + 0.75 * smoothstep(90, 230, len) : 0.7 + 0.9 * Math.min(1, len / 160));
      x += Math.sin(ang) * st; z += Math.cos(ang) * st; y -= st * steep; len += st;
      pts.push([x, y, z]);
      if (order < 2 && o.sub !== false && len > nextB && y > foot + 12) {
        branches.push([x, y, z, ang + sideB * rng.range(0.85, 1.35)]);
        sideB = -sideB; nextB = len + (order === 0 ? rng.range(22, 46) : rng.range(18, 30));
      }
    }
    out.push({ pts, order, w: order === 0 ? 1 : order === 1 ? 0.75 : 0.55 });
    for (const b of branches) walk(b[0], b[1] - 1.5, b[2], b[3], slope * (order === 0 ? 1.5 : 1.9), order + 1, order === 0 ? rng.range(50, 110) : rng.range(18, 40));
  };
  for (let i = 0; i < n; i++) {
    const ang = a0 + (a1 - a0) * ((i + (full ? 0 : 0.5) + (rng() - 0.5) * 0.5) / (full ? n : n));
    walk(summit[0], summit[1], summit[2], ang, (o.slope ?? 0.8) * rng.range(0.8, 1.25), 0, 1e4);
  }
  return out;
}

// buildMountain(ctx, style, spec): heightfield from ridge polylines. height = ridge height minus a creased falloff of the
// distance to the nearest ridge, so every valley between two spurs is a fold. Returns
//   { mesh, material (style.pigment, has setCoats), heightAt(x, z), goldLines(step) -> lines for style.goldRibbon, top, tris }
// spec: { ridges, x0, x1, z0, z1, nx, nz, foot (y of the lake or mist it stands in), top (summit y), slope (1.25),
//         carve(x, z, h) -> h (optional), along (0.3: how much the coat front lags down the ridge line), pigment: {...opts of style.pigment} }
async function buildMountain(ctx, style, spec) {
  const foot = spec.foot ?? 0, slope = spec.slope ?? 1.25;
  // the grid may be uneven (spec.xs / spec.zs: rising coordinate lists), so that a gorge the eye flies through is meshed finely
  const lin = (a, b, n) => { const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = a + (b - a) * i / (n - 1); return o; };
  const xs = spec.xs ? Float32Array.from(spec.xs) : lin(spec.x0, spec.x1, spec.nx), zs = spec.zs ? Float32Array.from(spec.zs) : lin(spec.z0, spec.z1, spec.nz);
  const nx = xs.length, nz = zs.length, x0 = xs[0], x1 = xs[nx - 1], z0 = zs[0], z1 = zs[nz - 1];
  const below = (arr, v) => { let lo = 0, hi = arr.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= v) lo = m; else hi = m - 1; } return lo; };   // last index with arr[i] <= v
  const above = (arr, v) => Math.min(arr.length - 1, below(arr, v) + 1);
  const N = nx * nz, floorY = foot - 8;
  const H = new Float32Array(N).fill(-1e4), H2 = new Float32Array(N).fill(-1e4), RH = new Float32Array(N), D = new Float32Array(N).fill(60);
  const ID = new Int16Array(N), HO = spec.carve0 ? new Float32Array(N) : null;
  let work = 0, top = -1e4;
  for (let r = 0; r < spec.ridges.length; r++) {
    const rg = spec.ridges[r], P = rg.pts, id = r + 1, k = slope * (rg.order === 0 ? 1 : rg.order === 1 ? 1.15 : 1.3);
    const reach = rg.reach ?? (rg.order === 0 ? 1e4 : rg.order === 1 ? 62 : 32);
    for (let s = 0; s < P.length - 1; s++) {
      const a = P[s], b = P[s + 1], hm = Math.max(a[1], b[1]); if (hm > top) top = hm;
      const R = Math.min(reach, 120, (hm - floorY) / k + 2); if (R <= 0) continue;
      if (Math.max(a[0], b[0]) + R < x0 || Math.min(a[0], b[0]) - R > x1 || Math.max(a[2], b[2]) + R < z0 || Math.min(a[2], b[2]) - R > z1) continue;
      const ix0 = below(xs, Math.min(a[0], b[0]) - R), ix1 = above(xs, Math.max(a[0], b[0]) + R);
      const iz0 = below(zs, Math.min(a[2], b[2]) - R), iz1 = above(zs, Math.max(a[2], b[2]) + R);
      const ex = b[0] - a[0], ez = b[2] - a[2], el = ex * ex + ez * ez || 1, R2 = R * R;
      for (let iz = iz0; iz <= iz1; iz++) {
        const pz = zs[iz] - a[2];
        for (let ix = ix0; ix <= ix1; ix++) {
          const px = xs[ix] - a[0];
          let t = (px * ex + pz * ez) / el; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = px - ex * t, qz = pz - ez * t, d2 = qx * qx + qz * qz;
          if (d2 > R2) continue;
          const d = Math.sqrt(d2);
          const c = iz * nx + ix;
          if (hm - k * d < H2[c]) continue;                    // cannot be first or second here
          const hr = a[1] + (b[1] - a[1]) * t, h = hr - k * d * (1 + 0.85 / (1 + 0.04 * d + 0.0022 * d * d));
          if (h > H[c]) { if (ID[c] !== id) H2[c] = H[c]; H[c] = h; ID[c] = id; RH[c] = hr; D[c] = d; }
          else if (ID[c] !== id && h > H2[c]) H2[c] = h;
        }
        work += ix1 - ix0 + 1;
        if (work > 20000) { work = 0; await ctx.yield(); }      // (a yield asked for within a few milliseconds of the last costs nothing)
      }
    }
  }
  top = spec.top ?? top;
  const pos = new Float32Array(N * 3), coat = new Float32Array(N * 3), along = spec.along ?? 0.3, nz2 = ctx.noise;
  const foldA = spec.fold ? new Float32Array(N * 3) : null;      // (fold coordinate q, weight, metres above the local foot): see GORGE in the pigment shader
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const c = iz * nx + ix, x = xs[ix], z = zs[iz];
      let h = H[c], v = Math.min(40, h - H2[c]);
      if (h < -9000) { h = floorY; v = 40; }
      const d = D[c];
      h -= (0.5 + 0.5 * nz2.n2(x * 0.021, z * 0.021)) * Math.min(d, 45) * 0.2 + nz2.n2(x * 0.09 + 9, z * 0.09) * Math.min(d, 9) * 0.3;
      const hc = spec.carve ? spec.carve(x, z, h) : h, h0 = h;
      if (hc < h - 0.5) v = Math.max(v, Math.min(40, (h - hc) * 2));        // carved ground is not a fold
      else if (hc > h + 0.5) v = 40;                                         // nor is ground the carve raised
      if (HO) HO[c] = Math.max(spec.carve0(x, z, h, hc), floorY);
      h = Math.max(hc, floorY); H[c] = h;
      if (foldA) { const f = spec.fold(x, z, h); if (f) { foldA[c * 3] = f[0]; foldA[c * 3 + 1] = f[1] * Math.max(f[3] || 0, clamp((h0 - hc) / 5, 0, 1)); foldA[c * 3 + 2] = f[2]; } }
      pos[c * 3] = x; pos[c * 3 + 1] = h; pos[c * 3 + 2] = z;
      coat[c * 3] = Math.max(0, (top - RH[c]) * along + Math.max(0, RH[c] - h)) * (spec.coatK ? spec.coatK(x, z) : 1); coat[c * 3 + 1] = h0 - hc > 3 ? -0.7 : 1 - smoothstep(0, 14, v); coat[c * 3 + 2] = v;
    }
    work += nx * (foldA ? 6 : 1);                              // a row of the gorge costs six rows of a plain range
    if (work > 1500) { work = 0; await ctx.yield(); }
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let k = 0;
  for (let iz = 0; iz < nz - 1; iz++) { if (iz % 4 === 3) await ctx.yield(); for (let ix = 0; ix < nx - 1; ix++) {
    const a = iz * nx + ix, b = a + 1, c = a + nx, d = c + 1;
    if (Math.max(H[a], H[b], H[c], H[d]) < foot - 0.6) continue;
    if (Math.abs(H[a] - H[d]) < Math.abs(H[b] - H[c])) { idx[k++] = a; idx[k++] = c; idx[k++] = d; idx[k++] = a; idx[k++] = d; idx[k++] = b; }
    else { idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  } }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCoat', new THREE.BufferAttribute(coat, 3));
  g.setIndex(new THREE.BufferAttribute(idx.subarray(0, k), 1));
  if (foldA) g.setAttribute('aFold', new THREE.BufferAttribute(foldA, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (foot + top) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, top - foot, z1 - z0) / 2);
  const material = style.pigment({ foot, top, gorge: !!foldA, ...(spec.pigment || {}) });
  const mesh = new THREE.Mesh(g, material);
  const heightAt = (x, z) => {
    const ix = Math.min(nx - 2, below(xs, x)), iz = Math.min(nz - 2, below(zs, z)), c = iz * nx + ix;
    const tx = clamp((x - xs[ix]) / (xs[ix + 1] - xs[ix]), 0, 1), tz = clamp((z - zs[iz]) / (zs[iz + 1] - zs[iz]), 0, 1);
    return lerp(lerp(H[c], H[c + 1], tx), lerp(H[c + nx], H[c + nx + 1], tx), tz);
  };
  const origAt = !HO ? heightAt : (x, z) => {
    const ix = Math.min(nx - 2, below(xs, x)), iz = Math.min(nz - 2, below(zs, z)), c = iz * nx + ix;
    const tx = clamp((x - xs[ix]) / (xs[ix + 1] - xs[ix]), 0, 1), tz = clamp((z - zs[iz]) / (zs[iz + 1] - zs[iz]), 0, 1);
    return lerp(lerp(HO[c], HO[c + 1], tx), lerp(HO[c + nx], HO[c + nx + 1], tx), tz);
  };
  // every ridge polyline again, laid on the finished ground: feed to style.goldRibbon()
  const goldLines = (step = 5, lift = 0.7, minOrder = 2) => {
    const lines = [];
    for (const rg of spec.ridges) {
      if (rg.order > minOrder || rg.noGold) continue;
      let cur = [];
      for (let s = 0; s < rg.pts.length - 1; s++) {
        const a = rg.pts[s], b = rg.pts[s + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]), m = Math.max(1, Math.round(L / step));
        for (let j = (s === 0 ? 0 : 1); j <= m; j++) {
          const x = lerp(a[0], b[0], j / m), z = lerp(a[2], b[2], j / m), y = heightAt(x, z);
          const ry = lerp(a[1], b[1], j / m);
          if (y < foot + 1.5 || y < ry - 9 || y > ry + 4 || x < x0 || x > x1 || z < z0 || z > z1) { if (cur.length > 1) lines.push({ pts: cur, w: rg.w }); cur = []; continue; }
          cur.push([x, y + lift, z]);
        }
      }
      if (cur.length > 1) lines.push({ pts: cur, w: rg.w });
    }
    return lines;
  };
  return { mesh, material, heightAt, origAt, goldLines, top, tris: k / 3 };
}

// ---------------------------------------------------------------------------------------------
// THE HERO: the bridge beneath the peak
// ---------------------------------------------------------------------------------------------
// the staircase of the fall in the course frame: floor height at s, half width of the gorge at s
const LIPS = [[385, 55], [445, 105], [510, 158]], RUN = 16, RC = -3, FALLR = -8, TERR_END = 638, GATE_S = 625;
function stairFloor(s) {
  let y = 1.2;
  for (const [ls, ly] of LIPS) { const t = smoothstep(ls - RUN, ls, s); y = Math.max(y, lerp(y, ly, t * t * (3 - 2 * t) * 0.35 + t * 0.65)); }
  return y;
}
function stairHalf(s) {
  let w = 17.5;
  for (const [ls] of LIPS) w = Math.max(w, 17.5 + 14.5 * smoothstep(ls, ls + 6, s) * (1 - smoothstep(ls + 24, ls + 36, s)));
  return w + 7 * smoothstep(560, 615, s) + 15 * (1 - smoothstep(343, 371, s));     // the mouth of the gorge flares open to the shore
}

// THE GORGE. The stair faces and the two walls are folded into upright spurs, as the painter folds a cliff: every fold has
// a ridge (gold) and a valley (ink crease), benches where trees are stamped, and the fall runs in the deepest notch.
// gorge(r, s) -> [y, q, w, hRel]: ground height, fold coordinate (valley at whole q, ridge at half), fold weight, metres above the local foot.
const PF = 6.4, PW = 9.5, FALLW = 5.6;
const tri = (q) => Math.abs(q - Math.floor(q) - 0.5) * 2;                  // 1 in the valley, 0 on the ridge
const hsh = (n) => { const x = Math.sin(n * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); };
const faceQ = (r, s) => (r - FALLR) / PF + 0.22 * Math.sin(s * 0.13 + r * 0.05);
const warpS = (s, side) => 5 * Math.sin(s * 0.045 + side * 2) + 3 * Math.sin(s * 0.11 + side);       // no two spurs the same width
const wallQ = (dd, s, side) => (s + warpS(s, side)) / PW + 0.2 * Math.sin(dd * 0.15) + side * 0.37 - dd * 0.028;
const wallH = (d) => d * 2.3 + d * d * 0.02;
function stepOf(s) { for (let i = 0; i < LIPS.length; i++) if (s > LIPS[i][0] - RUN && s < LIPS[i][0] + 6) return i; return -1; }
function gorge(r, s, orig) {
  const sC = Math.min(s, TERR_END), back = Math.max(0, s - TERR_END), side = r > RC ? 1 : -1;
  const dd = Math.abs(r - RC) - stairHalf(sC) - back * 1.3;
  if (dd <= 0) {
    const edge = 1 - smoothstep(-4, -1, dd), af = Math.abs(r - FALLR), fallW = smoothstep(FALLW - 1, FALLW + 2.5, af);
    const q = faceQ(r, sC), ft = tri(q), cell = Math.round(q);
    const dl = (5.4 * ft * Math.sqrt(ft) * fallW + 3.2 * (1 - smoothstep(2.5, FALLW + 2, af))) * edge, s1 = sC - dl, k = stepOf(s1);
    let y = stairFloor(s1), w = 0, hRel = 0;
    if (k >= 0) {
      const base = k ? LIPS[k - 1][1] : 1.2, top = LIPS[k][1], hb = hsh(cell * 3.1 + k * 17.3);
      if (hb > 0.3 && fallW > 0.5 && edge > 0.5) {                           // a bench part way up this fold, where trees stand
        const yb = base + (top - base) * (0.24 + 0.5 * hsh(cell * 7.7 + k * 5.1)) - 4 * ft;
        if (y > yb) y = Math.max(yb, stairFloor(s1 - 3.4));
      }
      w = smoothstep(LIPS[k][0] - RUN - 1, LIPS[k][0] - RUN + 3, s1) * (1 - smoothstep(LIPS[k][0] - 0.5, LIPS[k][0] + 3, s1)) * fallW * edge;
      hRel = y - base;
    }
    return [y - back * 1.9, q, w, hRel, 1, 1];
  }
  const q0 = wallQ(dd, sC, side), ft = tri(q0), cell = Math.round(q0);
  let d = Math.max(0, dd - (5 + 4 * hsh(cell * 2.9 + side * 4.7)) * ft * Math.sqrt(ft) * smoothstep(0, 3, dd));
  const hb = hsh(cell * 5.3 + side * 11.1), db = 4.5 + 7 * hsh(cell * 9.7 + side * 3.3);
  if (hb > 0.25 && d > db) d = Math.max(db, d - 4.2);
  // (the fold is drawn only where the mesh is fine enough to carry it: it fades out before the mouth of the gorge and the coarse grid)
  const fw = smoothstep(1.5, 4, d) * (1 - smoothstep(64, 82, dd)) * smoothstep(338, 347, s) * (1 - smoothstep(104, 120, Math.abs(r - RC)));
  // THE BALCONY. Beside the terrace the right-hand wall dies away (s 533 to 562) and the ground beyond the terrace edge drops
  // 35 m as a folded cliff and goes on falling, so that from the gate the far ranges stand stacked up the picture; 55 m out the
  // cut lets go and the massif's own shoulder (below the eye) takes over.
  const die = orig || side < 0 ? 0 : smoothstep(533, 562, sC);
  const inn = (1 - smoothstep(24, 36, dd)) * (1 - smoothstep(46, 56, Math.abs(r - RC)));      // inside the gorge proper: the crags there are capped in azurite
  const kS = stepOf(sC), lift = kS < 0 ? 0 : (stairFloor(sC) - (kS ? LIPS[kS - 1][1] : 1.2)) * (1 - smoothstep(LIPS[kS][0] - 1, LIPS[kS][0] + 5, sC));   // beside a stair face the wall's foot is the ledge below
  // THE WINDOWS. The right-hand wall is let down twice to a low folded parapet: behind the hut (so the hut and its smoke
  // stand against bare silk and the shoulder beyond) and beside the second ledge (so the third fall is seen with the far
  // country over the shoulder). Between them the wall stands as a pillar.
  const win = orig || side < 0 ? 0 : Math.max(smoothstep(397, 409, sC) * (1 - smoothstep(427, 437, sC)), smoothstep(447, 459, sC) * (1 - smoothstep(486, 498, sC)));
  if (win > 0 && die <= 0) {
    const capY = 62 * (1 - win) + win * (11 + 7 * (1 - ft * Math.sqrt(ft)) - Math.max(0, Math.min(dd, 46) - 12) * 0.45 + Math.max(0, dd - 46) * 2.5), hw = Math.min(wallH(d), capY);      // beyond 46 m the cut lets go
    return [stairFloor(sC) + hw - back * 1.9, q0, fw, hw + lift, 1 - smoothstep(13, 25, dd), inn, lift];
  }
  if (die <= 0) return [stairFloor(sC) + wallH(d) - back * 1.9, q0, fw, wallH(d) + lift, 1 - smoothstep(13, 25, dd), inn, lift];
  const y = stairFloor(sC) + wallH(d) * (1 - die) - die * (35 * smoothstep(1.5, 13, d + 1.5 * smoothstep(0, 3, dd)) + Math.max(0, dd - 8) * 1.0 - Math.max(0, dd - 55) * 7);
  return [y - back * 1.9, q0, fw, lerp(wallH(d), 22, die), Math.max(1 - smoothstep(13, 25, dd), die * (1 - smoothstep(40, 60, dd))), inn];
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const ownStyle = !opts.style;
  const style = opts.style || makeStyle(ctx, { palette: opts.palette, glanceDir: [1, 0] });   // alone, the piece is seen from +Z: left to right is +X
  const pal = style.palette;
  const root = new THREE.Group(); root.name = 'thousand-li-hero';
  const Lc = (r, y, s) => [r, y, S0 - s];                      // course frame -> local

  // ---- ridges of the peak (per seed: summit, shoulder and every spur differ)
  const A = [-110 + rng.range(-8, 8), 280, 600 + rng.range(-8, 8)], B = [105 + rng.range(-12, 12), rng.range(176, 204), 590 + rng.range(-10, 14)];
  const jit = (v, a) => v + rng.range(-a, a);
  const rimL = [[A[0], A[1], A[2]], [jit(-84, 5), jit(252, 5), 560], [jit(-64, 4), jit(222, 5), 522], [jit(-55, 3), jit(184, 5), 482], [jit(-50, 3), jit(146, 4), 442],
    [jit(-47, 3), jit(104, 4), 402], [jit(-44, 2), jit(62, 4), 372], [-41, 22, 352], [-38, -6, 338]];
  const rimR = [[B[0], B[1], B[2]], [jit(80, 5), B[1] - jit(12, 4), 552], [jit(59, 4), jit(186, 4), 516], [jit(47, 3), jit(152, 4), 478], [jit(41, 3), jit(114, 4), 440],
    [jit(37, 2), jit(80, 4), 402], [jit(35, 2), jit(42, 3), 370], [33, 6, 349], [31, -6, 339]];
  const dense = (pl) => { const o = []; for (let i = 0; i < pl.length - 1; i++) for (let j = 0; j < 4; j++) { const t = j / 4; o.push(Lc(lerp(pl[i][0], pl[i + 1][0], t), lerp(pl[i][1], pl[i + 1][1], t), lerp(pl[i][2], pl[i + 1][2], t))); } o.push(Lc(...pl[pl.length - 1])); return o; };
  const ridges = [{ pts: dense(rimL), order: 0, w: 1 }, { pts: dense(rimR), order: 0, w: 1 }];
  const stair = []; for (let s = 352; s <= TERR_END; s += 4) stair.push(Lc(RC, stairFloor(s) + 50, s));
  ridges.push({ pts: stair, order: 0, w: 1, noGold: true });
  const aL = Math.atan2(rimL[2][0] - A[0], -(rimL[2][2] - A[2])), aR = Math.atan2(rimR[2][0] - B[0], -(rimR[2][2] - B[2]));
  for (const r of spurs(rng, Lc(...A), { n: rng.int(6, 8), foot: -4, slope: 1.05, from: aL + 0.55, to: aL + Math.PI * 2 - 0.6 })) ridges.push(r);
  for (const r of spurs(rng, Lc(...B), { n: rng.int(5, 6), foot: -4, slope: 1.08, from: aR + 0.7, to: aR + Math.PI * 2 - 0.55 })) ridges.push(r);
  // sub-spurs off the two authored rims, falling outward (away from the gorge)
  await ctx.yield();
  for (const [rim, sgn] of [[rimL, -1], [rimR, 1]]) for (let i = 1; i < rim.length - 2; i++) {
    const p = Lc(...rim[i]);
    for (const r of spurs(rng, [p[0], p[1] - 2, p[2]], { n: 1, foot: -4, slope: 1.25, from: sgn * rng.range(0.5, 1.1), to: sgn * rng.range(1.2, 1.7) })) { r.order = Math.min(2, r.order + 1); r.w *= 0.8; ridges.push(r); }
  }
  await ctx.yield();
  // lesser pinnacles round the crown and the shoulder: the massif is a cluster of tops, not a cone
  const nA = rng.int(3, 4), nB = rng.int(2, 3);
  for (let i = 0; i < nA + nB; i++) {
    const onA = i < nA, c = onA ? A : B, ang = onA ? rng.range(-2.7, 0.15) - 0.2 : rng.range(0.1, 2.6), dist = rng.range(55, 105);
    const px = c[0] + Math.sin(ang) * dist, ps = c[2] - Math.cos(ang) * dist * (onA ? 1 : 0.9), ph = c[1] * rng.range(0.58, 0.86) - (dist - 55) * 0.5;
    if (Math.abs(px - RC) < 58 && ps < TERR_END + 20) continue;
    for (const r of spurs(rng, Lc(px, ph, ps), { n: rng.int(4, 5), foot: -4, slope: 1.05 })) ridges.push(r);
  }
  await ctx.yield();
  // the hut's shelf: a rock pad in the back corner of the first pool ledge, 12 m above the pool
  const HUT = [21, 67, 422];
  const pad0 = (x, s, y) => { const d = Math.hypot(x - HUT[0], (s - HUT[2]) * 1.15); return d < 14 ? lerp(HUT[1], y, smoothstep(6.2, 14, d)) : y; };
  // the shelf is an outcrop folded into nine upright spurs round the hut (gold on each crest, an ink crease in each cleft, umber at its foot)
  const padQ = (x, s) => Math.atan2((s - HUT[2]) * 1.15, HUT[0] - x) / 6.2832 * 9 + 0.3;      // (the seam of the angle lies in the wall behind the hut, where nothing is drawn)
  const pad = (x, s, y) => {
    const d = Math.hypot(x - HUT[0], (s - HUT[2]) * 1.15); if (d >= 14) return y;
    const ft = tri(padQ(x, s)), de = d + 2.6 * ft * Math.sqrt(ft) * smoothstep(6.2, 8, d);
    return lerp(HUT[1], y, smoothstep(6.5, 12.6, de));
  };
  let gmX = NaN, gmS = NaN, gmV = null;                                  // the carve and the fold ask for the same point one after the other
  const gorgeM = (r, sv) => { if (r !== gmX || sv !== gmS) { gmX = r; gmS = sv; gmV = gorge(r, sv); } return gmV; };
  const carve = (x, z, h) => {
    if (Math.abs(x - RC) > 150 || S0 - z < 330) return h;
    const g = gorgeM(x, S0 - z);
    return pad(x, S0 - z, lerp(Math.min(h, g[0]), g[0], g[4]));          // near the course the gorge is authored outright; further in it only cuts
  };
  // the ground as it stood before the balcony and the outcrop were cut: seeded decisions are still taken on it, so that
  // every later draw of the seed (and with it every pine of the entry) stays what it was
  const carve0 = (x, z, h, hc) => {
    const s = S0 - z;
    if (Math.abs(x - RC) > 150 || s < 330 || !((x > RC && s > 395) || Math.hypot(x - HUT[0], (s - HUT[2]) * 1.15) < 15)) return hc;
    const g = gorge(x, s, true);
    return pad0(x, s, lerp(Math.min(h, g[0]), g[0], g[4]));
  };
  const fold = (x, z, hNow) => {
    if (Math.abs(x - RC) > 150 || S0 - z < 330) return null;
    const s = S0 - z, g = gorgeM(x, s), d = Math.hypot(x - HUT[0], (s - HUT[2]) * 1.15);
    // weight 1.5 marks the outcrop. Its fold coordinate is not the gorge's, so its weight is brought to nothing before either
    // boundary (the foot at d 13, the wall behind): across a jump of the coordinate nothing is drawn
    if (d < 13 && g[0] < HUT[1] + 3) return [padQ(x, s), 1.5 * smoothstep(6.3, 7.4, d) * (1 - smoothstep(11.5, 12.7, d)) * (1 - smoothstep(61, 68, g[0])), Math.max(0, pad(x, s, g[0]) - LIPS[0][1]) * 1.6 * smoothstep(6, 7, d), 1];
    const rel = g[4] >= 1 ? g[3] : Math.min(g[3], Math.max(0, hNow - stairFloor(Math.min(s, TERR_END)) + (g[6] || 0)));       // metres above the floor, of the ground as it finally stands
    return [g[1], g[2] * smoothstep(13, 16, d) * (1 + 0.15 * (g[5] || 0)), rel, 1];      // the fold is DRAWN wherever its weight reaches, on the uncut flank of the massif too
  };
  // the coat runs into the gorge early: seen through the portal before we arrive, the heart of the peak is already solid
  const coatK = (x, z) => { const s = S0 - z; if (s < 330 || s > TERR_END + 30) return 1; return lerp(0.5, 1, smoothstep(26, 60, Math.abs(x - RC) - stairHalf(Math.min(s, TERR_END)))); };
  // the grid: 1.3 m in the gorge the eye flies up, 3.4 m on the rest of the massif
  const gs = detail < 1 ? 1.2 : 1, grid = (a, b, f0, f1, fine, coarse) => { const o = []; let v = a; while (v < b - 0.01) { o.push(v); v += (v >= f0 && v < f1 ? fine : coarse) * gs; } o.push(b); return o; };
  const xs = grid(-400, 380, RC - 62, RC + 62, 1.3, 3.6), zs = grid(S0 - 880, S0 - 644, 0, 0, 1, 3.2).slice(0, -1).concat(grid(S0 - 644, S0 - 524, 0, 0, 1, 1.9).slice(0, -1), grid(S0 - 524, S0 - 322, S0 - 524, S0 - 344, 1.3, 3.2));
  const peak = await buildMountain(ctx, style, { ridges, xs, zs, foot: 0, top: 280, slope: 1.6, carve, carve0, fold, coatK, pigment: { green: 0.055, blue: 0.53, winter: opts.winter } });
  root.add(peak.mesh);
  await ctx.yield();
  const goldLines = peak.goldLines(5, 0.7);
  await ctx.yield();
  {
    const F = peak.material.uniforms.uFalls.value;          // the main fall and two rills: columns left unpainted, in the peak's own frame
    F[0].set(FALLR, FALLW, S0 - 514, S0 - 352); F[1].set(-20.5, 0.6, S0 - 512, S0 - 366); F[2].set(11.5, 0.5, S0 - 511, S0 - 364);
    peak.material.uniforms.uFoot.value.set(S0 - (LIPS[0][0] - RUN + 3.2), S0 - (LIPS[1][0] - RUN + 3.2), S0 - (LIPS[2][0] - RUN + 3.2));
    // gold along the ridge of every fold: up each stair face, and up both walls of the gorge
    LIPS.forEach(([ls], k) => {
      for (let j = -4; j <= 6; j++) {
        const pts = [];
        for (let sv = ls - RUN + 1; sv <= ls + 4; sv += 1.5) {
          let r = FALLR + PF * (j + 0.5); for (let it = 0; it < 3; it++) r = FALLR + PF * (j + 0.5 - 0.22 * Math.sin(sv * 0.13 + r * 0.05));
          const g = gorge(r, sv);
          if (g[2] < 0.35 || Math.abs(r - FALLR) < FALLW + 2.5) { if (pts.length > 1) goldLines.push({ pts: pts.slice(), w: 0.7 }); pts.length = 0; continue; }
          pts.push([r, peak.heightAt(r, S0 - sv) + 0.5, S0 - sv]);
        }
        if (pts.length > 1) goldLines.push({ pts, w: 0.7 });
      }
    });
    await ctx.yield();
    for (const side of [-1, 1]) for (let j = Math.floor(346 / PW); j <= Math.ceil(TERR_END / PW) + 1; j++) {
      const pts = [];
      for (let dd = 2.5; dd <= 76; dd += 2.5) {
        const sq = PW * (j + 0.5 - 0.2 * Math.sin(dd * 0.15) - side * 0.37 + dd * 0.028); let sv = sq; for (let it = 0; it < 5; it++) sv = sq - warpS(sv, side);
        if (sv < 350 || sv > TERR_END) break;
        const r = RC + side * (stairHalf(sv) + dd), g = gorge(r, sv), y = peak.heightAt(r, S0 - sv);
        if (y < g[0] - 2.5 || g[2] < 0.3 || Math.hypot(r - HUT[0], sv - HUT[2]) < 12) break;
        pts.push([r, y + 0.5, S0 - sv]);
      }
      if (pts.length > 2) goldLines.push({ pts, w: 0.7 });
    }
    // one gold line down the crest of every spur of the hut's outcrop
    for (let j = 0; j < 9; j++) {
      const a = (j + 0.3) / 9 * 6.2832, pts = [];
      for (let d = 6.7; d <= 13.2; d += 0.8) {
        const x = HUT[0] + Math.cos(a) * d, sv = HUT[2] + Math.sin(a) * d / 1.15, y = peak.heightAt(x, S0 - sv);
        if (y > HUT[1] + 0.6 || y < LIPS[0][1] + 0.5 || gorge(x, sv)[0] > HUT[1] + 3) { if (pts.length > 1) break; pts.length = 0; continue; }
        pts.push([x, y + 0.45, S0 - sv]);
      }
      if (pts.length > 2) goldLines.push({ pts, w: 0.7 });
    }
  }
  await ctx.yield();

  // ---- trees: stamped dot clusters massed in gullies, along ridges and round the shore
  const trees = [], nTry = Math.round(1500 * detail), verm = opts.vermilion ?? 1 / 12;
  for (let i = 0; i < nTry; i++) {
    const x = rng.range(-390, 370), z = rng.range(S0 - 860, S0 - 330), y = peak.origAt(x, z);      // (decided on the ground as it was: see carve0)
    const mass = ctx.noise.n2(x * 0.013 + 40, z * 0.013) * 0.5 + 0.5;
    const band = y < 8 ? 1 : y < 150 ? 0.75 : y < 215 ? 0.3 : 0.06;
    const go = y > 1.2 && rng() < band * (0.12 + 1.5 * mass * mass), nn = rng.int(3, 9), rad = rng.range(7, 24), ang = rng() * 3.14;
    for (let j = 0; j < nn; j++) {                          // a drift of stamps, longer than it is wide
      const a = rng.range(-rad, rad), c = rng.range(-rad, rad) * 0.35, tx = x + Math.cos(ang) * a - Math.sin(ang) * c, tz = z + Math.sin(ang) * a + Math.cos(ang) * c;
      const kind = rng() < verm ? 1 : 0, size = rng.range(7, 12.5) * (kind ? 0.6 : 1);        // vermilion is always small
      if (!go) continue;
      const ty = peak.heightAt(tx, tz), s = S0 - tz;
      const sl = Math.abs(peak.heightAt(tx + 3, tz) - peak.heightAt(tx - 3, tz)) / 6 + Math.abs(peak.heightAt(tx, tz + 3) - peak.heightAt(tx, tz - 3)) / 6;
      if (ty > 1.2 && sl < 2.6 && !(Math.abs(tx - RC) < stairHalf(s) + 3 && s < TERR_END + 6)) trees.push([tx, ty - 0.5, tz, size, kind]);
    }
    if (i % 25 === 24) await ctx.yield();
  }
  // a pine either side of the stream on the terrace and blossom by the hut ledge are left to the world; here: shore clumps
  for (let i = 0; i < Math.round(140 * detail); i++) {
    const x = rng.range(-330, 330), s = 343 + rng.range(-4, 10) + 40 * Math.abs(ctx.noise.n2(x * 0.01, 3)), y = peak.heightAt(x, S0 - s);
    if (y > 0.8 && y < 14 && Math.abs(x - RC) > 26) trees.push([x, y - 0.3, S0 - s, rng.range(6, 10), rng() < 0.1 ? 1 : 0]);
  }
  // trees stamped on the benches of the gorge: small, because the eye passes within a few metres of them
  for (const [ls] of LIPS) for (let r = RC - 30; r <= RC + 30; r += 2.1) {
    if (Math.abs(r - FALLR) < FALLW + 3 || Math.abs(r) < 4.5 || hsh(r * 3.3 + ls) > 0.75 * detail) continue;
    let prev = gorge(r, ls - RUN)[0];
    for (let sv = ls - RUN + 0.7; sv < ls + 2; sv += 0.7) {
      const g = gorge(r, sv);
      if (g[4] === 1 && g[2] > 0.4 && g[0] - prev < 0.25 && g[3] > 6) { trees.push([r + rng.range(-0.6, 0.6), peak.heightAt(r, S0 - sv - 1) - 0.2, S0 - sv - 1, rng.range(2.6, 4.2), rng() < verm ? 1 : 0]); break; }
      prev = g[0];
    }
  }
  await ctx.yield();
  for (const side of [-1, 1]) for (let sv = 352; sv < TERR_END - 4; sv += 2.6) {
    if (hsh(sv * 1.7 + side) > 0.7 * detail) continue;
    let prev = 0;
    for (let dd = 2; dd < 26; dd += 0.8) {
      const r = RC + side * (stairHalf(sv) + dd), g = gorge(r, sv, true);
      if (dd > 4 && g[3] - prev < 0.3 && Math.hypot(r - HUT[0], sv - HUT[2]) > 11) {
        const x = r + side * 1.2, y0 = peak.origAt(x, S0 - sv), y = peak.heightAt(x, S0 - sv);
        if (y0 > g[0] - 2) { const sz = rng.range(3.2, 5.6), kd = rng() < verm ? 1 : 0; if (Math.abs(y - y0) < 1.5) trees.push([x, y - 0.2, S0 - sv, sz, kd]); }
        break;
      }
      prev = g[3];
    }
  }
  for (let j = 0; j < 9; j++) {
    const a = (j - 0.2) / 9 * 6.2832, d = 11.2 + 2 * hsh(j * 3.7), x = HUT[0] + Math.cos(a) * d, sv = HUT[2] + Math.sin(a) * d / 1.15, y = peak.heightAt(x, S0 - sv);
    if (hsh(j * 9.1) > 0.25 && y < LIPS[0][1] + 6 && y > LIPS[0][1] - 0.5 && x > FALLR + 20) trees.push([x, y - 0.2, S0 - sv, 2.4 + 1.6 * hsh(j * 5.3), hsh(j * 2.3) < verm ? 1 : 0]);
  }
  // ---- TREES BESIDE THE GOLD. Where a tree can stand, no gold crest stands alone on a wall. The place: both walls of the gorge from the second lip
  // to the third, and the crown-side wall of the terrace as far as the gate, from the wall's foot to 76 m out. Every fold of
  // a wall has its crest (the gold lines above follow the same course for as far as the cut rock goes); along each crest's
  // whole course trees are stamped two to four together, their feet 1.5 to 3 m off the line, on either flank in turn and
  // never on it, a clump to every 8 to 14 m of crest; and half as many, single, down the cleft between two crests. Small
  // within 30 m of the wall's foot (the measure of the benches), up to 6 m beyond. A stream of their own.
  // (Fifth version) no clump is laid where the ground is steeper than the massif's own trees stand on (see stampAt): about half the
  // stamps of this stream are not laid, so on the steep walls a crest does stand alone and the clumps are further apart than 14 m.
  {
    const ct = makeRng((ctx.seed ?? 0) + ':thousand-li crest trees'), thinK = Math.min(1, detail + 0.2), CAP = 1500;
    const reach = (side, sv) => sv >= LIPS[1][0] && (sv <= LIPS[2][0] || (side < 0 && sv <= GATE_S));
    const courses = [];                                        // [side, j, points [r, y, z, dd]] of every crest that enters the place
    let total = 0;
    for (const side of [-1, 1]) for (let j = Math.floor(346 / PW); j <= Math.ceil(TERR_END / PW) + 1; j++) {
      const pts = []; let inPlace = false;
      for (let dd = 2.5; dd <= 76; dd += 2.5) {
        const sq = PW * (j + 0.5 - 0.2 * Math.sin(dd * 0.15) - side * 0.37 + dd * 0.028); let sv = sq; for (let it = 0; it < 5; it++) sv = sq - warpS(sv, side);
        if (sv < 350 || sv > TERR_END) break;
        const r = RC + side * (stairHalf(sv) + dd);
        if (Math.hypot(r - HUT[0], sv - HUT[2]) < 12) break;
        pts.push([r, peak.heightAt(r, S0 - sv), S0 - sv, dd]);
        if (reach(side, sv)) inPlace = true;
      }
      if (pts.length > 2 && inPlace) { courses.push([side, j, pts]); for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); }
    }
    await ctx.yield();
    const wide = Math.max(1, (total / 11 * 3.3) / (CAP * 0.9));     // should the crests be long enough to pass the limit, every spacing widens alike
    const sizeAt = (dd) => (dd < 30 ? ct.range(2.6, 4.2) : ct.range(3.4, 6));
    let nSt = 0, turn = 1;
    const stampAt = (x, z, dd) => {
      const kind = ct() < verm ? 1 : 0, sz = sizeAt(dd), y = peak.heightAt(x, z);
      if (Math.abs(peak.heightAt(x + 3, z) - peak.heightAt(x - 3, z)) / 6 + Math.abs(peak.heightAt(x, z + 3) - peak.heightAt(x, z - 3)) / 6 >= 2.6) return;   // no tree where the ground is steeper than the massif's own trees stand on: the same measure (the height differences across 6 m, not the slope under the foot) and the same 2.6 as the massif's drifts above (its dice are drawn all the same, so every other stamp of this stream stands where it stood)
      if (y > 1.2 && nSt < CAP) { trees.push([x, y - 0.2, z, kind ? Math.max(2.6, sz * 0.75) : sz, kind]); nSt++; }
    };
    for (let c = 0; c < courses.length; c++) {
      const [side, j, pts] = courses[c];
      let run = 0, next = ct.range(3, 9);
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const tx = b[0] - a[0], tz = b[2] - a[2], tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl;
        while (next <= run + seg) {
          const f = (next - run) / Math.max(seg, 1e-3), cx = lerp(a[0], b[0], f), cz = lerp(a[2], b[2], f), dd = lerp(a[3], b[3], f);
          next += ct.range(8, 14) * wide / thinK;
          const n = ct.int(2, 4); turn = -turn;
          for (let q = 0; q < n; q++) {
            const off = ct.range(1.5, 3) * turn, al = (q - (n - 1) / 2) * ct.range(1.3, 2.1);
            if (reach(side, S0 - cz)) stampAt(cx - uz * off + ux * al, cz + ux * off + uz * al, dd);
          }
        }
        run += seg;
      }
      // the cleft between this crest and the next one along the same wall
      const nx = courses[c + 1];
      if (nx && nx[0] === side && nx[1] === j + 1) {
        const q = nx[2]; let run2 = 0, next2 = ct.range(6, 18);
        for (let i = 1; i < Math.min(pts.length, q.length); i++) {
          const mx = (pts[i][0] + q[i][0]) / 2, mz = (pts[i][2] + q[i][2]) / 2, px = (pts[i - 1][0] + q[i - 1][0]) / 2, pz = (pts[i - 1][2] + q[i - 1][2]) / 2;
          run2 += Math.hypot(mx - px, (pts[i][1] + q[i][1] - pts[i - 1][1] - q[i - 1][1]) / 2, mz - pz);
          if (run2 < next2) continue;
          next2 = run2 + ct.range(16, 28) * wide / thinK;
          if (reach(side, S0 - mz)) stampAt(mx + ct.range(-0.8, 0.8), mz + ct.range(-0.8, 0.8), pts[i][3]);
        }
      }
      if (c % 6 === 5) await ctx.yield();
    }
  }
  await ctx.yield();
  const treeMesh = style.stamps(trees);
  root.add(treeMesh);
  await ctx.yield();

  // ---- the lake: bare silk, one sheet with the sky. Ripples only near things; the bridge mirrored as broken dashes.
  const BR_S = 265, BZ = S0 - BR_S, DECK = 9;
  const lakeMat = style.silk('lake');
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500, 1, 1), lakeMat);
  lake.rotation.x = -Math.PI / 2; lake.position.set(0, 0, 100); root.add(lake);
  lakeMat.uniforms.uBridge.value.set(BZ, 500, 10, DECK + 1);
  lakeMat.uniforms.uShore.value.set(S0 - 352, -1, 0, 60);
  lakeMat.uniforms.uRipple.value[0].set(FALLR, S0 - 366, 34, 1);

  // ---- the bridge: an ink-ruled deck on a hundred trestles of four red posts
  const b = style.batch();
  const wash = (k) => pal.silk.clone().lerp(pal.ink, k);
  const cDeck = wash(0.55), cInk = pal.ink.clone().multiplyScalar(0.95), cRoof = wash(0.66), cPost = pal.vermilion, cWall = pal.shell;
  const deckY = (x) => DECK + 2 * (1 - Math.min(1, (x / 500) * (x / 500)));
  const DW = 7.6;                                             // deck width
  for (let i = 0; i < 100; i++) {
    const side = i < 50 ? -1 : 1, j = i % 50, x = side * (8 + 10 * j), yd = deckY(x), lean = (rng() - 0.5) * 0.02;
    for (let p = 0; p < 4; p++) {                             // four posts across the deck
      const pz = (p - 1.5) * 2.2;
      b.box(x + lean * 4, (yd - 2) / 2, BZ + pz, 0.5, yd + 2, 0.5, cPost, { skip: 'bt' });
    }
    b.box(x, yd * 0.42, BZ, 0.26, 0.4, DW + 0.6, cInk, { skip: '' });          // tie beam
    b.box(x, yd - 0.55, BZ, 0.6, 0.5, DW + 1.2, cInk, {});                      // cap beam
    // the span from this trestle to the next one outward (and the centre span once)
    const x2 = j < 49 ? x + side * 10 : x + side * 2, xm = (x + x2) / 2, ym = (yd + deckY(x2)) / 2, L = Math.abs(x2 - x);
    b.box(xm, ym - 0.05, BZ, L, 0.5, DW, cDeck, { rule: -0.55 });
    for (const sz of [-1, 1]) {
      b.box(xm, ym + 1.25, BZ + sz * (DW / 2 - 0.15), L, 0.16, 0.16, cPost, { bare: true });
      b.box(xm, ym + 0.75, BZ + sz * (DW / 2 - 0.15), L, 0.1, 0.1, cPost, { bare: true });
      for (const t of [0.25, 0.75]) b.box(lerp(x, x2, t), ym + 0.72, BZ + sz * (DW / 2 - 0.15), 0.2, 1.3, 0.2, cPost, { skip: 'b', bare: true });
    }
    if (i % 10 === 9) await ctx.yield();
  }
  // ---- the pavilion: cross-shaped, two storeys, white panels, vermilion posts, grey ink roofs with upturned eaves
  // hip roof with a concave fall and corners that lift; ridge along x (ax true) or z
  const roof = (cx, y0, cz, hw, hd, rise, ax, up) => {
    const M = (a, y, c) => (ax ? [cx + a, y, cz + c] : [cx + c, y, cz + a]);
    const rl = Math.max(0.4, hw - hd * 0.8), nu = 8, nv = 4, sl = Math.hypot(hd, rise) * 1.08;
    const yy = (u, v) => y0 + rise * (0.3 * v + 0.7 * v * v) + up * Math.abs(u * u * u) * (1 - v) * (1 - v);
    for (const sg of [-1, 1]) {
      const long = (u, v) => M(lerp(u * hw, u * rl, v), yy(u, v), sg * hd * (1 - v));
      const end = (u, v) => M(sg * lerp(hw, rl, v), yy(u, v), u * hd * (1 - v));
      for (const [f, len] of [[long, 2 * hw], [end, 2 * hd]]) for (let iu = 0; iu < nu; iu++) for (let iv = 0; iv < nv; iv++) {
        const u0 = -1 + 2 * iu / nu, u1 = -1 + 2 * (iu + 1) / nu, v0 = iv / nv, v1 = (iv + 1) / nv, U = (u) => (u * 0.5 + 0.5) * len;
        b.quad(f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1), cRoof, { uv: [[U(u0), v0 * sl], [U(u1), v0 * sl], [U(u1), v1 * sl], [U(u0), v1 * sl]], size: [len, sl], rule: -0.75 });
      }
    }
    const rb = M(0, y0 + rise + 0.05, 0);
    b.box(rb[0], rb[1], rb[2], ax ? 2 * rl + 0.8 : 0.5, 0.6, ax ? 0.5 : 2 * rl + 0.8, cInk, { bare: true });
    for (const sg of [-1, 1]) { const e = M(sg * (rl + 0.35), y0 + rise + 0.6, 0); b.box(e[0], e[1], e[2], ax ? 0.5 : 0.6, 1.3, ax ? 0.6 : 0.5, cInk, { bare: true }); }
  };
  const PY = deckY(0) + 0.25, H1 = 5.0;
  b.box(0, PY - 0.2, BZ, 26, 0.5, 10, cDeck, { rule: -0.55 });
  b.box(0, PY - 0.2, BZ, 16, 0.5, 22, cDeck, { rule: 0.55 });
  for (const sx of [-1, 1]) for (const pz of [-10.4, -6.2, 6.2, 10.4]) b.box(sx * 8, (PY - 2) / 2, BZ + pz, 0.5, PY + 1.6, 0.5, cPost, { skip: 'bt' });
  for (const sx of [-1, 1]) for (const pz of [-4.4, 4.4]) b.box(sx * 12.6, (PY - 2) / 2, BZ + pz, 0.5, PY + 1.6, 0.5, cPost, { skip: 'bt' });
  // THE CARPENTRY THAT CARRIES THE FLOOR, all of it within 1.2 m under the planks and nothing lower: a vermilion bracket (a
  // cross of two blocks) at the head of each of the twelve posts; ink girders from post head to post head, down both sides of
  // the centre span and across it; ink joists across the girders, one to every 2 m, lying along the course; and the same
  // joists under the deck's spans as far as the third trestle on either side.
  {
    const yJ = PY - 0.55, yG = PY - 0.95, yB = PY - 1.38, IK = { bare: true };
    for (const sx of [-1, 1]) {
      b.box(sx * 8, yG, BZ, 0.62, 0.5, 21.8, cInk, IK);                                    // down each side of the centre span, over four post heads
      b.box(sx * 12.6, yG, BZ, 0.62, 0.5, 9.8, cInk, IK);                                  // under the end of each arm, over two
      for (const pz of [-10.4, -6.2, 6.2, 10.4]) { b.box(sx * 8, yB, BZ + pz, 0.74, 0.45, 2.3, cPost, IK); b.box(sx * 8, yB, BZ + pz, 2.0, 0.45, 0.74, cPost, IK); }
      for (const pz of [-4.4, 4.4]) { b.box(sx * 12.6, yB, BZ + pz, 0.74, 0.45, 2.3, cPost, IK); b.box(sx * 12.6, yB, BZ + pz, 2.0, 0.45, 0.74, cPost, IK); }
      for (const jx of [9.5, 11.5]) b.box(sx * jx, yJ, BZ, 0.24, 0.4, 9.8, cInk, IK);      // joists under the arms
      for (let jx = 14; jx < 28; jx += 2) if (jx !== 18) b.box(sx * jx, deckY(sx * jx) - 0.4, BZ, 0.24, 0.3, DW + 0.4, cInk, IK);   // and under the deck, between the trestles' cap beams
    }
    for (const pz of [-10.4, -6.2, 6.2, 10.4]) b.box(0, yG, BZ + pz, 16.6, 0.5, 0.62, cInk, IK);    // across the centre span, post head to post head
    for (const pz of [-4.4, 4.4]) b.box(0, yG, BZ + pz, 25.8, 0.5, 0.62, cInk, IK);
    for (let jx = -7; jx <= 7; jx += 2) b.box(jx, yJ, BZ, 0.24, 0.4, 21.8, cInk, IK);       // joists under the floor of the centre span
  }
  // verandah columns round the cross, with a rail between them
  const rects = [[12.6, 4.6], [7.6, 10.6]];
  for (let ri = 0; ri < 2; ri++) {
    const [hw, hd] = rects[ri], [ow, od] = rects[1 - ri], per = [];
    const nx2 = Math.round(hw * 2 / 4.2), nz2 = Math.round(hd * 2 / 4.2);
    for (let i = 0; i <= nx2; i++) { per.push([-hw + 2 * hw * i / nx2, -hd]); per.push([-hw + 2 * hw * i / nx2, hd]); }
    for (let i = 1; i < nz2; i++) { per.push([-hw, -hd + 2 * hd * i / nz2]); per.push([hw, -hd + 2 * hd * i / nz2]); }
    for (const [px, pz] of per) if (!(Math.abs(px) < ow - 0.1 && Math.abs(pz) < od - 0.1)) b.box(px, PY + H1 / 2, BZ + pz, 0.42, H1, 0.42, cPost, { skip: 'bt' });
    for (const sg of [-1, 1]) for (const hh of [0.55, 1.05]) {
      if (ri === 0) b.box(sg * (hw + ow) / 2, PY + hh, BZ - hd, hw - ow, 0.12, 0.12, cPost, { bare: true }), b.box(sg * (hw + ow) / 2, PY + hh, BZ + hd, hw - ow, 0.12, 0.12, cPost, { bare: true });
      else b.box(-hw, PY + hh, BZ + sg * (hd + od) / 2, 0.12, 0.12, hd - od, cPost, { bare: true }), b.box(hw, PY + hh, BZ + sg * (hd + od) / 2, 0.12, 0.12, hd - od, cPost, { bare: true });
    }
    b.box(0, PY + H1 - 0.25, BZ, hw * 2 + 0.3, 0.5, hd * 2 + 0.3, cInk, { skip: 'tb', bare: true });   // lintel band under the eaves
  }
  // the hall: white panels ruled into bays, dark doors on all four sides
  b.box(0, PY + H1 / 2, BZ, 11.4, H1, 7.4, cWall, { rule: -1.9, skip: 'tb' });
  for (const sg of [-1, 1]) {
    b.box(0, PY + 1.7, BZ + sg * 3.72, 2.6, 3.4, 0.1, cInk, { bare: true }); b.box(sg * 5.72, PY + 1.7, BZ, 0.1, 3.4, 2.2, cInk, { bare: true });
    for (const px of [-5.7, -1.9, 1.9, 5.7]) b.box(px, PY + H1 / 2, BZ + sg * 3.7, 0.36, H1, 0.36, cPost, { skip: 'bt' });
  }
  roof(0, PY + H1, BZ, 14.6, 6.6, 3.5, true, 1.25);
  roof(0, PY + H1, BZ, 12.6, 9.6, 3.8, false, 1.25);
  // upper storey: balcony, lattice band, white panels, the great roof
  const Y2 = PY + H1 + 3.3, T = 4.3;
  b.box(0, Y2 + 0.1, BZ, T * 2 + 2.6, 0.3, T * 2 + 2.6, cInk, { bare: true });
  b.box(0, Y2 + 2.0, BZ, T * 2, 3.8, T * 2, cWall, { rule: -1.72, skip: 'tb' });
  b.box(0, Y2 + 2.5, BZ, T * 2 + 0.12, 1.5, T * 2 + 0.12, wash(0.3), { rule: -0.34, skip: 'tb' });
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 0, 1]) if (sx || sz) b.box(sx * T, Y2 + 2.0, BZ + sz * T, 0.4, 3.8, 0.4, cPost, { skip: 'bt' });
  for (const sg of [-1, 1]) for (const hh of [0.75, 1.2]) {
    b.box(0, Y2 + hh, BZ + sg * (T + 1.15), T * 2 + 2.4, 0.11, 0.11, cPost, { bare: true }); b.box(sg * (T + 1.15), Y2 + hh, BZ, 0.11, 0.11, T * 2 + 2.4, cPost, { bare: true });
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(sx * (T + 1.15), Y2 + 0.7, BZ + sz * (T + 1.15), 0.2, 1.2, 0.2, cPost, { skip: 'b', bare: true });
  b.box(0, Y2 + 3.75, BZ, T * 2 + 0.5, 0.5, T * 2 + 0.5, cInk, { skip: 'tb', bare: true });
  roof(0, Y2 + 3.9, BZ, 8.4, 6.9, PY + 19 - 1.4 - (Y2 + 3.9), true, 1.5);
  await ctx.yield();
  // ---- the fall itself is not a thing: it is the place the pigment shader leaves bare of pigment (uFalls, GORGE; the main fall's white threads are drawn there, in the shader)
  // ---- pools on the two ledges and the terrace stream: the same silk, ringed with fish-scale ripples
  const poolMat = style.silk('lake');
  poolMat.uniforms.uShore.value.set(1e5, 1, 0, 60);
  const ripples = [[lakeMat, 0, FALLR, S0 - 366, 34, 1]];            // [material, slot, local x, local z, radius, strength]
  {
    const P = [], I = []; let n = 0;
    LIPS.slice(0, 2).forEach(([ls, ly], pi) => {
      const cx = FALLR + 1, cs = ls + 31, seg = 28, c0 = n; P.push(cx, ly + 0.35, S0 - cs); n++;
      for (let i = 0; i < seg; i++) { const a = i / seg * 6.2832, rr = 1 + 0.12 * Math.sin(a * 3 + pi) + 0.08 * Math.sin(a * 5 + 1.3); P.push(cx + Math.cos(a) * 17 * rr, ly + 0.35, S0 - cs + Math.sin(a) * 13 * rr); n++; }
      for (let i = 0; i < seg; i++) I.push(c0, c0 + 1 + (i + 1) % seg, c0 + 1 + i);
      ripples.push([poolMat, pi, cx, S0 - cs - 9, 30, 1]);
    });
    const N = 22;                                                        // the stream on the terrace, from under the gate to the third lip
    for (let i = 0; i <= N; i++) {
      const t = i / N, s = lerp(GATE_S - 1, 512, t), r = lerp(0, FALLR, smoothstep(0.25, 0.95, t)) + 1.4 * Math.sin(t * 9), w = 2.2 + 1.6 * t + 0.5 * Math.sin(t * 13);
      P.push(r - w, stairFloor(s) + 0.3, S0 - s, r + w, stairFloor(s) + 0.3, S0 - s);
      if (i < N) I.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); n += 2;
      if (i === 1 || i === 8 || i === 15 || i === 21) ripples.push([poolMat, 2 + (i === 1 ? 0 : i === 8 ? 1 : i === 15 ? 2 : 3), r, S0 - s, 12, 0.9]);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
    root.add(new THREE.Mesh(g, poolMat));
  }
  await ctx.yield();
  // ---- the moon gate: a garden wall with a round opening, a vermilion band and one gold line
  const GY = 158, GC = GY + 8, gateZ = S0 - GATE_S;
  if (opts.gate !== false) {
    const hx = 13, up = 9, dn = 8.6, th = 0.7, seg = 56;
    const edge = (a) => { const c = Math.cos(a), s = Math.sin(a), t = Math.min(hx / Math.max(Math.abs(c), 1e-4), (s > 0 ? up : dn) / Math.max(Math.abs(s), 1e-4)); return [c * t, s * t]; };
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * 6.2832, a1 = (i + 1) / seg * 6.2832, e0 = edge(a0), e1 = edge(a1);
      const c0 = [Math.cos(a0), Math.sin(a0)], c1 = [Math.cos(a1), Math.sin(a1)];
      for (const sg of [-1, 1]) {
        const z = gateZ + sg * th;
        b.quad([c0[0] * 7.8, GC + c0[1] * 7.8, z], [e0[0], GC + e0[1], z], [e1[0], GC + e1[1], z], [c1[0] * 7.8, GC + c1[1] * 7.8, z], cWall, { bare: true });
        b.quad([c0[0] * 7, GC + c0[1] * 7, z + sg * 0.06], [c0[0] * 7.8, GC + c0[1] * 7.8, z + sg * 0.06], [c1[0] * 7.8, GC + c1[1] * 7.8, z + sg * 0.06], [c1[0] * 7, GC + c1[1] * 7, z + sg * 0.06], cPost, { bare: true });
      }
      b.quad([c0[0] * 7, GC + c0[1] * 7, gateZ - th], [c0[0] * 7, GC + c0[1] * 7, gateZ + th], [c1[0] * 7, GC + c1[1] * 7, gateZ + th], [c1[0] * 7, GC + c1[1] * 7, gateZ - th], cPost, { bare: true });
    }
    for (const sg of [-1, 1]) b.box(sg * hx, GC + (up - dn) / 2, gateZ, 0.3, up + dn, th * 2 + 0.1, cInk, { bare: true });   // ink edge of the wall
    for (const sg of [-1, 1]) b.box(sg * 8.4, GC - dn + 0.75, gateZ, 9.4, 1.5, th * 2 + 0.3, wash(0.42), { rule: 0.5 });
    // the tile coping: two ruled slopes and a ridge
    const cy = GC + up, cw = 2.1;
    for (const sg of [-1, 1]) b.quad([-hx - 0.7, cy, gateZ + sg * cw], [hx + 0.7, cy, gateZ + sg * cw], [hx + 0.5, cy + 1.3, gateZ], [-hx - 0.5, cy + 1.3, gateZ], cRoof, { rule: -0.6 });
    for (const sg of [-1, 1]) b.box(sg * (hx + 0.9), cy + 0.5, gateZ, 0.5, 1.5, cw * 2 + 0.3, cInk, { bare: true });           // upturned ends of the coping
    b.box(0, cy + 1.4, gateZ, 2 * hx + 1.4, 0.4, 0.45, cInk, { bare: true });
    b.box(0, cy - 0.12, gateZ, 2 * hx + 1.5, 0.24, cw * 2 + 0.1, cInk, { bare: true });
    for (const sg of [-1, 1]) { const ring = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * 6.2832; ring.push([Math.cos(a) * 8.05, GC + Math.sin(a) * 8.05, gateZ + sg * (th + 0.12)]); } goldLines.push({ pts: ring, w: 0.8 }); }
  }
  await ctx.yield();
  const builtGeo = await b.geometryAsync(ctx);
  await ctx.yield();
  const built = new THREE.Mesh(builtGeo, style.flat()); root.add(built);
  await ctx.yield();
  const gold = style.goldRibbon(goldLines); root.add(gold);
  await ctx.yield();

  // ---- anchors (local space; hero.toWorld(v) after the world has placed the object)
  const V = (r, y, s) => new THREE.Vector3(r, y, S0 - s);
  const fly = [V(0, 56, 0), V(0, 56, 60), V(0, 4, 190), V(0, 4, BR_S), V(0, 4.5, 335), V(0, 7, 345), V(0, 63, 379), V(0, 63, 405), V(0, 113, 438), V(0, 113, 470), V(0, 166, 503), V(0, 166, 520), V(0, 166, GATE_S)];
  const anchors = {
    portalSeat: { position: V(0, GC, GATE_S), normal: new THREE.Vector3(0, 0, 1), radius: 7 },
    flyThrough: fly,
    entryEye: V(0, 56, 0), underSpan: V(0, 4, BR_S), pavilion: new THREE.Vector3(0, PY + 9, BZ), crown: V(A[0], A[1], A[2]), shoulder: V(B[0], B[1], B[2]),
    lips: LIPS.map(([s, y]) => V(FALLR, y, s)), pools: [V(FALLR + 1, 0, 366), V(FALLR + 1, 55.35, 416), V(FALLR + 1, 105.35, 476)],
    hutSeat: V(HUT[0], HUT[1], HUT[2]), terracePines: [V(-13, 158, 590), V(11, 158, 596)], streamSource: V(0, 158.3, GATE_S - 1),
    bridge: { z: BZ, halfLength: 500, spacing: 10, deckWidth: DW, deckY },          // deckY(x): top of the deck is deckY(x) + 0.2
  };

  // ---- the coats. The world calls setCoats(t2, t3) (seconds since each coat was begun at the summit) or setProgress(u).
  let driven = false;
  const setCoats = (t2, t3) => { driven = true; peak.material.setCoats(t2, t3); };
  const setProgress = (u, duration = 42) => setCoats(u * duration - 2, u * duration - 27);
  const _a = new THREE.Vector3(), lakeU = lakeMat.uniforms;
  function update(dt, time, camera) {
    if (ownStyle) style.update(dt, time, camera);
    if (!driven) { const c = time % 44; peak.material.setCoats(c - 2, c - 15); }      // alone in the viewer: a 44 s demonstration
    const e = root.matrixWorld.elements, wz = (x, z) => e[2] * x + e[10] * z + e[14], wx = (x, z) => e[0] * x + e[8] * z + e[12];
    const bz = wz(0, BZ), sz = wz(0, S0 - 352);
    lakeU.uBridge.value.x = bz; lakeU.uShore.value.set(sz, Math.sign(sz - bz) || 1, e[13], 60);
    poolMat.uniforms.uShore.value.z = e[13];
    for (const [m, slot, x, z, r, k] of ripples) m.uniforms.uRipple.value[slot].set(wx(x, z), wz(x, z), r, k);
  }
  const toWorld = (v) => _a.copy(v).applyMatrix4(root.matrixWorld).clone();
  return {
    object: root, radius: 210, height: 280, center: new THREE.Vector3(-15, 95, 40), anchors, update, dispose() {},
    ground: false, groundY: 0, style, setCoats, setProgress, toWorld, heightAt: peak.heightAt, heightAt0: peak.origAt,
    parts: { peak: peak.mesh, gold, trees: treeMesh, lake, built }, extent: { peak: 420, bridgeHalf: 500 },
  };
}
