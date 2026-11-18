// THE UMBRA: a total solar eclipse met at fourteen kilometres, from the fin camera of a white research jet.
//
// MAP OF THIS FILE (in order)
//   1. Constants: HERO_POS (where the set piece stands), A1/A2 (the far anvils), FOG (haze density), U_C2 (second contact).
//   2. Shaders: AC_* (our jet, the chase jets, the airliner and the balloon: one material family lit by the hero's
//      umbra()), TRAIL_* (contrail ribbons that grow behind each aircraft), DECK_* (the undercast ~780 m below),
//      LAMP_* (beacon, position lights and the storm-core glows of the two far anvils), SPRITE_* (the rare red
//      sprites), VAP_* (vapour sheets over the wings), ICE_* (ice streaks and cirrus wisps round the camera).
//   3. Geometry builders: Mesher (lofted rings with part ids), buildResearchJet, buildTwinJet (chase jet / airliner),
//      buildBalloon; cloud bodies: layoutCloudField decides them, writeDome / writeAnvil fill one merged geometry.
//   4. The world module. Inside build(), in order:
//        LOOK        the seeded mood (field + chase jets | squall + balloon | deck + airliner), corona, livery,
//                    palette; sun height from ctx.vary.hour (26, 34 for day, 13 for golden/dawn/night)
//        HERO        buildHero(...) placed at HERO_POS, never rotated; its uniforms drive every shader here; the
//                    returning gold (uGold) and the umbra's cloud colours (uWarm, uCool) are re-tuned there
//        PATH        built from hero.anchors.flyThrough (approach, flankArc, canyonLine) + the level entry
//        CLOUDS      turret field, the skimmed turret, far anvils A1/A2, squall wall (one mesh, hero cloud material);
//                    turrets near the path get a finer mesh, extra round lobes and a soft ceiling under the line
//                    (a crown that would stand above it is lowered whole first, so nothing is planed flat);
//                    bodies wholly behind the entry point are laid out (the seeded stream needs them) but not built
//        DECK        the undercast plane;  CAST  chase jets / airliner / balloon + contrails;  JET  our aircraft
//        FX          ice streaks, cirrus wisps, vapour, far lightning, red sprites (ctx.vary.rare)
//        POIS        the skimmed turret (u 0.25-0.39), the sun (0.34-0.7, held harder 0.58-0.78), the portal (from 0.74)
//        post        exposure, bloom and grade;  scene.fog = FogExp2(hero.haze, FOG) updated every frame
//        update()    everything scripted is keyed to u: hero.setFront(frontAt(u), F - TRAIL) moves the shadow (second
//                    contact at u 0.39, third near 0.685); hero.boltOverride keeps the storm wall breathing in the
//                    turn (u 0.6-0.8, core 0 up to full level) and leaves only a faint breath in the canyon;
//                    hero.seatGlow is the portal's pearl light inside the cloud (from u 0.6);
//                    uOccA.w is widened so the shoulder's shadow keeps the canyon in shade; the aircraft rig is
//                    posed at the camera passed in.
//
// UNIFORMS THAT DRIVE THE SCRIPTED MOMENTS
//   hero.uniforms.uUmbra (front, trail, lean, open)  set by hero.setFront(): the travelling shadow on every surface
//   uCtl (our jet: ailerons, spoilers, wing flex)      from the path's turn rate at u
//   uHead[4] (contrails)                               path distance of each aircraft, from u
//   uSpA.w / uSpB.w (sprites, u 0.542 and 0.565), uVap (vapour, from the turn), aCol of the glow lamps (far storms: time),
//   hero.uniforms.uSeat.w (the portal's light on the canyon mouth and walls: u 0.6 on)
//
// Everything is lit by the hero's shared functions (UMBRA_GLSL + UMBRA_CHUNKS): there are no scene lights at all.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, UMBRA_GLSL, UMBRA_CHUNKS } from '../parts/the-umbra.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const HERO_POS = new THREE.Vector3(395, -300, -1370);
const A1 = { x: -1150, z: -2500 }, A2 = { x: 1500, z: -2300 };
const FOG = 0.00037;
const U_C2 = 0.39;                    // second contact (the brief's 17.2 s)
const { NOISE_GLSL, SKY_GLSL, CLOUD_GLSL, FOG_APPLY } = UMBRA_CHUNKS;
const LIT_GLSL = UMBRA_GLSL + NOISE_GLSL + SKY_GLSL + CLOUD_GLSL;

// ---------------------------------------------------------------------------------------------------------------
// Aircraft family. aPart: 0 wing skin, 1 dark matt, 2 canopy glass, 3 bare metal, 4 fuselage skin (cheat line),
// 5 blue trim, 6 balloon film. aCtl: x hinge z, y control id (1 left aileron, 2 right aileron, 3 spoiler).
const AC_VERT = /* glsl */`
attribute float aPart; attribute vec2 aCtl;
uniform vec4 uCtl;      // left aileron, right aileron, spoilers (radians), wing flex (m at the tip)
uniform float uSpan;
varying vec3 vObj, vW, vN; varying float vPart;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; vec3 n = normal;
  float d = aCtl.y < 0.5 ? 0. : aCtl.y < 1.5 ? uCtl.x : aCtl.y < 2.5 ? uCtl.y : -abs(uCtl.z);
  p.y -= max(p.z - aCtl.x, 0.) * d;                       // control surfaces hinge about a spanwise line
  float sx = abs(p.x) / max(uSpan, 1.);
  p.y += uCtl.w * sx * sx;                                // the long wings flex
  vObj = position;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vN = mat3(modelMatrix) * n; vPart = aPart;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const AC_FRAG = /* glsl */`
uniform vec3 uSkin, uTrim;
uniform vec4 uLiv;      // x gloss 0..1, y panel-line strength, z frost, w fuselage axis height (object y)
uniform vec4 uGrid;     // x rib spacing, y frame spacing, z gores (balloon), w cheat-line half height
varying vec3 vObj, vW, vN; varying float vPart;
#include <fog_pars_fragment>
${LIT_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 Vv = cameraPosition - vW;
  vec3 V = Vv / max(length(Vv), 1e-3);
  float px = max(length(dFdx(vW)), length(dFdy(vW)));
  vec2 um = umbra2(vW);
  float lit = clamp(um.x * (1. + (umbraBands(vW, px) - 1.) * 2.6), 0., 1.2);
  // ---- surface
  vec3 alb = uSkin; float gloss = uLiv.x;
  vec2 g = vec2(vObj.x / uGrid.x + 0.5, vObj.z / uGrid.y);
  vec2 gw = fwidth(g) + 1e-4;
  vec2 gd = abs(fract(g - 0.5) - 0.5);
  float lines = max(1. - smoothstep(0.006, 0.006 + gw.x * 1.5, gd.x), 1. - smoothstep(0.005, 0.005 + gw.y * 1.5, gd.y));
  lines *= (1. - smoothstep(0.15, 0.5, max(gw.x, gw.y))) * uLiv.y;
  float fr0 = vn3(vObj * 0.8) * 0.6 + vn3(vObj * 2.7 + 4.) * 0.4;
  float frost = smoothstep(0.35, 0.8, fr0) * uLiv.z * smoothstep(0.1, 0.7, N.y);
  float isSkin = step(vPart, 0.5) + step(3.5, vPart) * step(vPart, 4.5);
  float ga = atan(vObj.z, vObj.x + 1e-5) * uGrid.z / 6.28318;
  float gaw = min(fwidth(ga), 0.5);
  float cw = fwidth(vObj.y) + 1e-4;
  if (vPart > 0.5 && vPart < 1.5) { alb = vec3(0.035, 0.04, 0.05); gloss = 0.15; }
  else if (vPart > 1.5 && vPart < 2.5) { alb = vec3(0.012, 0.016, 0.024); gloss = 1.; }
  else if (vPart > 2.5 && vPart < 3.5) { alb = vec3(0.56, 0.58, 0.62); gloss = 0.85; }
  else if (vPart > 4.5 && vPart < 5.5) { alb = uTrim; }
  else if (vPart > 5.5) {
    float gdd = abs(fract(ga) - 0.5);
    float gl2 = smoothstep(0.5 - gaw * 1.5 - 0.03, 0.5, gdd) * (1. - smoothstep(0.2, 0.45, gaw));
    float puff = 0.5 + 0.5 * cos(fract(ga) * 6.28318);
    alb = vec3(0.80, 0.79, 0.76) * (0.82 + 0.18 * puff) * (1. - 0.3 * gl2); gloss = 0.5;
  }
  if (vPart > 3.5 && vPart < 4.5) {
    float cy = abs(abs(vObj.y - uLiv.w) - uGrid.w * 3.3);
    alb = mix(alb, uTrim, (1. - smoothstep(uGrid.w - cw, uGrid.w + cw, cy)) * step(uLiv.w, vObj.y));
  }
  alb = mix(alb, alb * 0.55, lines * isSkin);
  alb = mix(alb, vec3(0.78, 0.83, 0.9), frost * isSkin * 0.22);
  gloss *= 1. - 0.5 * frost * isSkin;
  // ---- sunlit: one hard silver key from ahead, cobalt shade, the sky in the gloss
  vec3 key = mix(uKey, uGold, um.y) * sunOcc(vW);
  float ndl = max(dot(N, uSunDir), 0.);
  float up = N.y * 0.5 + 0.5;
  vec3 H = normalize(V + uSunDir + vec3(0., 1e-4, 0.));
  float ndh = max(dot(N, H), 0.);
  float fres = 1. - max(dot(N, V), 0.); float fr2 = fres * fres; float fr4 = fr2 * fr2;
  vec3 R = reflect(-V, N);
  float rel = degrees(asin(clamp(R.y, -1., 1.)));
  float rsz = dot(normalize(R.xz + vec2(1e-5, 0.)), normalize(uSunDir.xz));
  vec3 amb = mix(uShade * 0.75, uSkyA[2] * 0.62 + uSkyA[1] * 0.25, up);
  vec3 cl = alb * (key * 1.5 * ndl + amb * 1.15);
  cl += key * (pow(ndh, mix(14., 120., gloss)) * (0.2 + 1.3 * gloss) + 0.12 * fr4 * max(dot(-V, uSunDir), 0.));
  cl += skyLitC(rel, rsz) * (0.04 + 0.5 * fr4) * (0.25 + 0.75 * gloss);
  cl += vec3(0.9, 0.95, 1.) * frost * isSkin * pow(ndh, 30.) * 0.5;
  float film = step(5.5, vPart);                             // the balloon's film glows where the sun stands behind it
  float back = max(dot(-V, uSunDir), 0.);
  cl += film * key * vec3(1., 0.97, 0.9) * (0.2 + 0.55 * back * back) * (0.55 + 0.45 * fres);
  // ---- in the umbra: a slate silhouette, copper along every edge that faces the ring, a pearl glint from the corona
  float hor = 1. - abs(N.y);
  vec3 cd = (alb * 0.75 + 0.03) * mix(uWarm * 0.8, uCool * 0.85, up) * 0.9;
  cd += (alb * 0.6 + 0.08) * uSkyB[3] * (0.55 * hor * hor * hor + 0.9 * fr4);
  cd += uPearl * (pow(ndh, mix(20., 90., gloss)) * (0.25 + 0.7 * gloss) + 0.06 * ndl);
  cd += skyTotal(max(rel, 0.), rsz) * fr4 * 0.35 * gloss;
  cd *= mix(0.5, 1., uUmbra.w);
  cd = mix((alb * 0.8 + 0.02) * uSkyA[3] * 1.5 * (0.45 + 0.6 * up), cd, uCam.x);
  vec3 col = mix(cd, cl, lit);
  vec3 hz = hazeAt(vW, -Vv, um.x);
  ${FOG_APPLY}
  gl_FragColor = vec4(col, 1.);
}`;

// Contrails: static ribbons along each aircraft's track; only the part behind the aircraft (aD < uHead) is drawn,
// widening, curling and thinning with age. Camera-facing, never thinner than ~2 px.
const TRAIL_VERT = /* glsl */`
attribute vec3 aTan; attribute vec3 aInfo;   // x side -1..1, y track distance, z jet index + seed fraction
uniform float uHead[4]; uniform float uTime;
varying vec3 vW; varying vec3 vT;            // vT: x across, y age (m), z seed
#include <fog_pars_vertex>
void main(){
  int k = int(floor(aInfo.z + 0.01));
  float head = k == 0 ? uHead[0] : k == 1 ? uHead[1] : k == 2 ? uHead[2] : uHead[3];
  float age = head - aInfo.y;
  float sd = fract(aInfo.z) * 10.;
  vec3 c = position;
  float curl = smoothstep(20., 500., age);
  c.x += curl * (3.2 * sin(aInfo.y * 0.021 + sd * 9. + uTime * 0.25) + 1.4 * sin(aInfo.y * 0.057 + sd * 4.));
  c.y += curl * (1.6 * sin(aInfo.y * 0.033 + sd * 5. + uTime * 0.2)) - age * 0.004;
  vec3 toC = cameraPosition - c;
  float dist = max(length(toC), 1e-3);
  vec3 sideV = cross(aTan, toC / dist);
  sideV = sideV / max(length(sideV), 1e-3);
  float w = 0.4 + 0.034 * pow(max(age, 0.), 0.75);
  w = max(min(w, 9.), dist * 0.0016) * step(0., age);
  vec3 wp = c + sideV * aInfo.x * w;
  vW = wp; vT = vec3(aInfo.x, age, sd);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TRAIL_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vT;
#include <fog_pars_fragment>
${LIT_GLSL}
void main(){
  if (vT.y < 0.) discard;
  vec3 Vv = cameraPosition - vW; float dist = length(Vv);
  float prof = 1. - vT.x * vT.x; prof *= prof;
  float n = vn3(vec3(vW.x * 0.11, vW.z * 0.045, vT.z * 7.) + vec3(0., 0., uTime * 0.05));
  float n2 = vn3(vec3(vW.x * 0.4, vW.z * 0.19, vT.z * 3.));
  float a = prof * (0.25 + 0.9 * n) * (0.7 + 0.45 * n2) * 0.8;
  a *= smoothstep(2., 14., vT.y) * (1. - smoothstep(700., 1900., vT.y)) * mix(1., 0.6, smoothstep(40., 500., vT.y));
  a *= smoothstep(5., 30., dist);
  vec2 um = umbra2(vW);
  vec3 key = mix(uKey, uGold, um.y);
  float toSun = max(dot(-Vv / max(dist, 1e-3), uSunDir), 0.);
  vec3 cl = key * (0.6 + 0.5 * toSun * toSun) + uShade * 0.35;
  vec3 cd = mix(uSkyA[3] * 1.7, mix(uCool * 0.7, uSkyB[3] * 0.75, 0.45 + 0.4 * (1. - prof)) * mix(0.5, 1., uUmbra.w), uCam.x);
  vec3 col = mix(cd, cl, um.x);
  vec3 hz = hazeAt(vW, -Vv, um.x);
  ${FOG_APPLY}
  gl_FragColor = vec4(col, clamp(a, 0., 0.78));
}`;

// The undercast: cloud streets over patches of steel-dark sea, 700 m below, under the same shadow.
const DECK_VERT = /* glsl */`
varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DECK_FRAG = /* glsl */`
uniform vec4 uDeck;   // x coverage 0..1, y street angle, z gravity-wave strength, w extra haze
varying vec3 vW;
#include <fog_pars_fragment>
${LIT_GLSL}
float dfbm(vec3 p){ return vn3(p) * 0.5 + vn3(p * 2.03 + 7.1) * 0.27 + vn3(p * 4.1 + 3.3) * 0.15 + vn3(p * 8.3 + 1.7) * 0.08; }
void main(){
  vec3 Vv = cameraPosition - vW; float dist = length(Vv);
  vec3 V = Vv / max(dist, 1e-3);
  float ca = cos(uDeck.y), sa = sin(uDeck.y);
  vec2 q = vec2(ca * vW.x + sa * vW.z, -sa * vW.x + ca * vW.z) + vec2(uTime * 9., uTime * 2.);
  float streets = 0.5 + 0.5 * sin(q.y / 95. + 2.2 * vn3(vec3(q / 520., 3.)) + 1.3 * vn3(vec3(q / 190., 9.)));
  float body = dfbm(vec3(q.x / 640., q.y / 300., uTime * 0.01));
  float big = vn3(vec3(q / 1900., 5.));
  float dens = body * 0.75 + streets * 0.3 + (big - 0.5) * 0.9 + (uDeck.x - 0.5) * 1.1;
  float waves = sin(q.x / 60. + 3. * vn3(vec3(q / 800., 1.))) * uDeck.z;
  float cov = smoothstep(0.42, 0.62, dens + waves * 0.06);
  float relief = dfbm(vec3(q.x / 150., q.y / 120., 4.)) + waves * 0.35;
  vec2 um = umbra2(vW);
  vec3 key = mix(uKey, uGold, um.y);
  float toSun = max(dot(-V, uSunDir), 0.);
  // sea: steel dark with a wide soft glitter path under the sun
  vec3 R = reflect(-V, normalize(vec3((vn3(vec3(q / 9., uTime * 0.3)) - 0.5) * 0.25, 1., (vn3(vec3(q / 11., 4. + uTime * 0.3)) - 0.5) * 0.25)));
  float gl = pow(max(dot(R, uSunDir), 0.), 26.);
  vec3 seaL = vec3(0.022, 0.045, 0.08) + key * gl * 0.55;
  vec3 seaD = mix(uSkyA[3] * 4.3 + uSkyB[1] * 0.36, uSkyB[1] * 0.42, uCam.x) + uSkyB[3] * 0.05 * uCam.x;
  vec3 cldL = (uShade * 0.9 + key * 0.5) * (0.45 + 0.75 * relief) * (0.6 + 0.4 * smoothstep(0.5, 0.9, dens)) + key * 0.25 * toSun * toSun * relief;
  vec3 cldD = mix(uSkyA[3] * 4.1 + uSkyA[2] * 0.036, mix(uWarm * 0.75, uCool * 0.6, relief) * mix(0.5, 1., uUmbra.w), uCam.x) * (0.5 + 0.7 * relief);
  vec3 col = mix(mix(seaD, seaL, um.x), mix(cldD, cldL, um.x), cov);
  vec3 hz = hazeAt(vW, -Vv, um.x);
  col = mix(col, hz, max(uDeck.w, (1. - um.x) * (1. - uCam.x) * 0.5 * (1. - exp(-dist / 1400.))));
  ${FOG_APPLY}
  gl_FragColor = vec4(col, 1.);
}`;

// Lamps on the aircraft: instanced soft discs in the rig's space (beacon, position lights, landing lights).
const LAMP_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aCol; attribute vec3 aBlink;   // aCol.w size (m); aBlink: period, phase, sharpness (0 = steady)
uniform float uTime, uGain;
varying vec2 vUv; varying vec3 vC;
void main(){
  float b = 1.;
  if (aBlink.x > 0.) { float s = 0.5 + 0.5 * sin((uTime / aBlink.x + aBlink.y) * 6.28318); b = pow(s, aBlink.z); }
  vec4 mv = modelViewMatrix * vec4(aPos, 1.);
  float sz = max(aCol.w, -mv.z * 0.004);
  mv.xy += position.xy * sz;
  mv.z += aCol.w * 0.4;
  vUv = position.xy; vC = aCol.rgb * (0.12 + 0.88 * b) * uGain;
  gl_Position = projectionMatrix * mv;
}`;
const LAMP_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vC;
uniform float uCore;
void main(){
  float d = dot(vUv, vUv);
  float g = exp(-d * mix(3.6, 5.5, uCore)) * 0.55 + exp(-d * 40.) * 1.6 * uCore;
  g *= 1. - smoothstep(0.7, 1., d);
  gl_FragColor = vec4(vC * g, 1.);
}`;

// The rare event: red sprites, rose jellyfish 600 m tall, standing above the far anvil for a breath.
const SPRITE_VERT = /* glsl */`
attribute float aK;
uniform vec4 uSpA, uSpB;   // xyz base centre (world), w level
uniform vec2 uSpSize;
varying vec2 vUv; varying float vL, vK;
void main(){
  vec4 s = aK < 0.5 ? uSpA : uSpB;
  vec3 toC = cameraPosition - s.xyz; toC.y = 0.;
  vec3 fw = toC / max(length(toC), 1e-3);
  vec3 rt = vec3(fw.z, 0., -fw.x);
  vec3 wp = s.xyz + rt * position.x * uSpSize.x + vec3(0., 1., 0.) * (position.y * 0.5 + 0.5) * uSpSize.y;
  vUv = position.xy; vL = s.w; vK = aK;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const SPRITE_FRAG = /* glsl */`
uniform vec3 uRose; uniform float uTime;
varying vec2 vUv; varying float vL, vK;
${NOISE_GLSL}
void main(){
  if (vL < 0.003) discard;
  float x = vUv.x, y = vUv.y * 0.5 + 0.5;          // y 0 at the tendril tips, 1 above the crown
  float sd = vK * 7.3 + 1.;
  // a cluster of "carrots": each a bright head, a diffuse plume above it and two tendrils forking below
  float body = 0., low = 0., high = 0.;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float xi = (h31(vec3(fi, sd, 1.)) - 0.5) * 1.05 + (fi - 3.) * 0.06;
    float hi = (0.62 + 0.38 * h31(vec3(fi, sd, 2.))) * (1. - 0.45 * abs(xi));
    float amp = 0.45 + 0.55 * h31(vec3(fi, sd, 3.));
    float yy = y / max(hi, 0.2);
    float dx = x - xi - 0.02 * sin(y * 13. + fi * 2.1);
    float fork = max(0.52 - yy, 0.) * 0.2;
    float dt = abs(dx) - fork;
    float wd = mix(0.008, 0.05, smoothstep(0.3, 0.66, yy)) * (1. + 2.2 * smoothstep(0.68, 1., yy));
    float core = exp(-dt * dt / (wd * wd));
    float headP = exp(-(yy - 0.64) * (yy - 0.64) / 0.012);
    float prof = smoothstep(0.02, 0.3, yy) * (1. - smoothstep(0.7, 1.02, yy));
    body += core * amp * (0.9 * headP + 0.22 * prof);
    low += core * amp * prof * (1. - smoothstep(0.3, 0.6, yy)) * 0.75;
    high += exp(-dx * dx / 0.03) * amp * smoothstep(0.55, 0.8, yy) * (1. - smoothstep(0.8, 1.05, yy)) * 0.16;
  }
  float beads = 0.7 + 0.5 * vn3(vec3(x * 40., y * 22., sd));
  float haze = exp(-x * x * 2.6) * smoothstep(0.15, 0.6, y) * (1. - smoothstep(0.6, 0.97, y)) * 0.1;
  float edge = (1. - smoothstep(0.82, 1., abs(x))) * (1. - smoothstep(0.93, 1., y)) * smoothstep(0., 0.04, y);
  vec3 colHot = mix(uRose, vec3(1., 0.74, 0.66), 0.4);
  vec3 colLow = mix(uRose, vec3(0.5, 0.25, 0.95), 0.55);
  vec3 col = colHot * body * beads * 1.5 + colLow * low * beads * 1.3 + mix(uRose, vec3(1., 0.2, 0.25), 0.4) * (high + haze);
  gl_FragColor = vec4(col * vL * edge, 1.);
}`;

// Vapour sheets that flash off the wings in the hard turn (two soft quads in the rig's space).
const VAP_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vW;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const VAP_FRAG = /* glsl */`
uniform float uVap; uniform vec3 uVapCol;
varying vec2 vUv; varying vec3 vW;
${UMBRA_GLSL}${NOISE_GLSL}
void main(){
  if (uVap < 0.004) discard;
  float n = vn3(vec3(vUv.x * 5., vUv.y * 2.2 - uTime * 3.4, uTime * 0.7)) * 0.6 + vn3(vec3(vUv.x * 13., vUv.y * 5. - uTime * 6., 2.)) * 0.4;
  float env = smoothstep(0., 0.2, vUv.x) * (1. - smoothstep(0.75, 1., vUv.x)) * smoothstep(0., 0.12, vUv.y) * (1. - smoothstep(0.25, 1., vUv.y));
  float a = env * smoothstep(0.35, 0.8, n + uVap * 0.3) * uVap * 0.62;
  gl_FragColor = vec4(uVapCol * a, a);
}`;

// ---------------------------------------------------------------------------------------------------------------
// Mesher: lofted rings into one non-shared-seam triangle soup with a part id and control data per vertex.
function makeMesher() {
  const pos = [], part = [], ctl = [], idx = [];
  const M = {
    pos, part, ctl, idx,
    // rings: array of rings, each an array of [x, y, z]; closed around; capA / capB close the ends with a fan
    loft(rings, pid, opt = {}) {
      const n = rings[0].length, base = pos.length / 3;
      for (const r of rings) for (const p of r) { pos.push(p[0], p[1], p[2]); part.push(p[3] ?? pid); ctl.push(p[4] ?? 0, p[5] ?? 0); }
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) {
        const a = base + i * n + j, b = base + i * n + (j + 1) % n, c = a + n, d = b + n;
        if (opt.flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
      }
      for (const [on, ri] of [[opt.capA, 0], [opt.capB, rings.length - 1]]) {
        if (!on) continue;
        const r = rings[ri], c0 = pos.length / 3; let cx = 0, cy = 0, cz = 0;
        for (const p of r) { cx += p[0] / n; cy += p[1] / n; cz += p[2] / n; }
        pos.push(cx, cy, cz); part.push(pid); ctl.push(0, 0);
        for (let j = 0; j < n; j++) {
          const a = base + ri * n + j, b = base + ri * n + (j + 1) % n;
          if ((ri === 0) !== !!opt.flip) idx.push(c0, a, b); else idx.push(c0, b, a);
        }
      }
    },
    // a tube along z with radius function r(t) and centre function c(t) -> [x, y]; z from z0 (t=0) to z1 (t=1)
    tube(z0, z1, n, m, rf, cf, pid, sq = [1, 1]) {
      const rings = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, r = rf(t), c = cf(t), ring = [];
        for (let j = 0; j < m; j++) { const a = (j / m) * TAU; ring.push([c[0] + Math.cos(a) * r * sq[0], c[1] + Math.sin(a) * r * sq[1], lerp(z0, z1, t), typeof pid === 'function' ? pid(t, a) : pid]); }
        rings.push(ring);
      }
      M.loft(rings, 0, { capA: true, capB: true, flip: z1 > z0 });
    },
    // a lifting surface: sections [{ x, y, zle, chord, thick }], airfoil with m points; ctlFn(sectionIndex) -> [hingeFrac, id] | null
    wing(secs, m, pid, ctlFn, vertical = false) {
      const rings = [];
      secs.forEach((s, si) => {
        const ring = [], cc = ctlFn ? ctlFn(si, s) : null;
        for (let j = 0; j < m; j++) {
          const a = (j / m) * TAU, cx = 0.5 - 0.5 * Math.cos(a);             // 0 leading edge .. 1 trailing edge
          const th = s.thick * s.chord * 0.5 * Math.sin(a) * Math.pow(Math.max(1 - cx, 0), 0.42) * 1.9 * Math.sqrt(Math.max(cx, 0) + 0.02);
          const z = s.zle + cx * s.chord;
          const p = vertical ? [s.y + th, s.x, z] : [s.x, s.y + th, z];
          let pp = typeof pid === 'function' ? pid(si, cx) : pid;
          if (cc && cx >= cc[0]) p.push(pp, s.zle + cc[0] * s.chord, cc[1]); else p.push(pp, 0, 0);
          ring.push(p);
        }
        rings.push(ring);
      });
      const fl = vertical ? secs[secs.length - 1].x < secs[0].x : secs[secs.length - 1].x > secs[0].x;
      M.loft(rings, 0, { capA: true, capB: true, flip: fl });
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
      g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(part), 1));
      g.setAttribute('aCtl', new THREE.BufferAttribute(new Float32Array(ctl), 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    },
  };
  return M;
}

// Our aircraft, in the camera pod's frame: origin = the pod on the fin tip, -Z forward, +Y up. The spine runs from
// bottom centre to the canopy (15 degrees below the nose line), the wings cross 21-26 degrees down.
async function buildResearchJet(ctx) {
  const M = makeMesher(), AX = -5.3;                       // fuselage axis height
  const fr = (t) => {                                      // t 0 nose .. 1 tail
    const nose = Math.pow(clamp(t / 0.2, 0, 1), 0.62), tail = 1 - 0.62 * Math.pow(clamp((t - 0.6) / 0.4, 0, 1), 1.5);
    return Math.max(0.03, 0.74 * nose * tail);
  };
  M.tube(-18.6, 1.9, 56, 26, fr, (t) => [0, AX + 0.25 * Math.pow(clamp((t - 0.55) / 0.45, 0, 1), 2)], (t, a) => (t < 0.028 ? 1 : (t > 0.028 && t < 0.1 && Math.sin(a) > 0.8) ? 1 : 4), [1, 1.08]);
  await ctx.yield();
  // canopy: a glazed blister with a frame, then a dorsal fairing running aft
  M.tube(-16.75, -14.2, 14, 14, (t) => 0.5 * Math.pow(Math.sin(Math.PI * clamp(t, 0.02, 0.98)), 0.55), (t) => [0, AX + 0.47 + 0.1 * Math.sin(Math.PI * t)], (t) => (t > 0.45 && t < 0.52 ? 4 : 2), [0.82, 0.9]);
  M.tube(-14.3, -6.5, 14, 10, (t) => 0.3 * Math.pow(1 - t, 0.5) + 0.02, (t) => [0, AX + 0.58], 4, [1, 0.8]);
  // intakes on the cheeks with dark throats
  for (const s of [-1, 1]) M.tube(-13.9, -10.2, 12, 12, (t) => 0.33 * Math.pow(Math.sin(Math.PI * clamp(t * 0.9 + 0.1, 0, 1)), 0.5), (t) => [s * 0.78, AX + 0.02], (t) => (t < 0.08 ? 1 : 4), [0.75, 1.05]);
  await ctx.yield();
  // wings: 31 m span, high aspect, ailerons outboard and spoilers mid-span
  for (const s of [-1, 1]) {
    const secs = [];
    for (let i = 0; i <= 30; i++) {
      const f = i / 30, x = lerp(0.45, 15.5, f);
      secs.push({ x: s * x, y: AX + 0.2 + 0.012 * x, zle: -13.35 + 0.085 * x, chord: lerp(3.05, 1.05, Math.pow(f, 0.9)) * (f > 0.985 ? 0.6 : 1), thick: lerp(0.12, 0.085, f) });
    }
    await ctx.yield();
    M.wing(secs, 16, (si, cx) => (cx < 0.035 ? 3 : si >= 29 ? 5 : 0), (si) => (si >= 19 && si <= 28 ? [0.74, s < 0 ? 1 : 2] : si >= 9 && si <= 15 ? [0.6, 3] : null));
    await ctx.yield();
    // wing pod, 5 m out, slung on the leading edge, with a blue band
    M.tube(-15.9, -10.4, 20, 14, (t) => 0.4 * Math.pow(Math.sin(Math.PI * clamp(t * 0.93 + 0.035, 0, 1)), 0.45), (t) => [s * 5, AX + 0.2], (t) => (t < 0.07 ? 1 : t > 0.3 && t < 0.36 ? 5 : 0));
    // tip skid
    M.tube(-12.3, -10.6, 6, 8, (t) => 0.13 * Math.sin(Math.PI * clamp(t, 0.05, 0.95)), (t) => [s * 15.5, AX + 0.3], 3);
    // tailplane
    const ts = [];
    for (let i = 0; i <= 6; i++) { const f = i / 6; ts.push({ x: s * lerp(0.2, 3.3, f), y: -4.25, zle: -0.9 + 0.8 * f, chord: lerp(1.9, 1.0, f), thick: 0.09 }); }
    M.wing(ts, 10, 0, null);
  }
  await ctx.yield();
  // fin under the pod, with a trim flash near the top
  const fs = [];
  for (let i = 0; i <= 8; i++) { const f = i / 8; fs.push({ x: lerp(-4.7, -0.55, f), y: 0, zle: -2.6 + 2.3 * f, chord: lerp(3.6, 1.3, f), thick: 0.08 }); }
  M.wing(fs, 12, (si) => (si >= 5 && si <= 6 ? 5 : 0), null, true);
  M.tube(-0.5, 0.45, 6, 8, (t) => 0.1 * Math.sin(Math.PI * clamp(t, 0.1, 0.9)) + 0.02, () => [0, -0.32], 1);        // the pod's mast fairing
  // blade antennae and a dorsal dome
  for (const [z, h] of [[-11.6, 0.42], [-8.9, 0.36], [-5.2, 0.3]]) {
    const bs = [{ x: AX + 0.6, y: 0, zle: z, chord: 0.42, thick: 0.14 }, { x: AX + 0.6 + h, y: 0, zle: z + 0.16, chord: 0.2, thick: 0.12 }];
    M.wing(bs, 6, 1, null, true);
  }
  M.tube(-7.9, -7.0, 6, 10, (t) => 0.3 * Math.sin(Math.PI * clamp(t, 0.04, 0.96)), () => [0, AX + 0.62], 3, [1, 0.7]);
  await ctx.yield();
  const geometry = M.geometry();
  await ctx.yield();
  return { geometry, axis: AX };
}

// A twin (chase WB-57 type) or four-engined (airliner) jet, nose toward -Z, origin at the centre of the wing.
function buildTwinJet(o) {
  const M = makeMesher(), L = o.length, S = o.span / 2, R = o.radius;
  M.tube(-L * 0.52, L * 0.48, 22, 14, (t) => Math.max(0.03, R * Math.pow(clamp(t / 0.16, 0, 1), 0.6) * (1 - 0.7 * Math.pow(clamp((t - 0.62) / 0.38, 0, 1), 1.4))), (t) => [0, 0.3 * R * Math.pow(clamp((t - 0.6) / 0.4, 0, 1), 2)], (t, a) => (t > 0.05 && t < 0.13 && Math.sin(a) > 0.72 ? 2 : 4));
  for (const s of [-1, 1]) {
    const secs = [];
    for (let i = 0; i <= 10; i++) { const f = i / 10, x = lerp(R * 0.5, S, f); secs.push({ x: s * x, y: -0.15 * R + (o.dihedral ?? 0.03) * x, zle: -o.chord * 0.42 + o.sweep * x, chord: lerp(o.chord, o.chord * o.taper, f), thick: 0.11 }); }
    M.wing(secs, 10, (si, cx) => (cx < 0.04 ? 3 : 0), null);
    for (const ex of o.engines) {
      const x = s * ex * S, zc = -o.chord * 0.3 + o.sweep * ex * S;
      M.tube(zc - o.nacelle * 0.62, zc + o.nacelle * 0.38, 10, 10, (t) => o.nacR * Math.pow(Math.sin(Math.PI * clamp(t * 0.8 + 0.14, 0, 1)), 0.4), () => [x, -0.15 * R + (o.dihedral ?? 0.03) * ex * S - (o.nacDrop ?? 0)], (t) => (t < 0.07 ? 1 : t > 0.93 ? 1 : 3));
    }
    const ts = [];
    for (let i = 0; i <= 4; i++) { const f = i / 4; ts.push({ x: s * lerp(0.2, S * 0.36, f), y: o.tailY ?? 0.5 * R, zle: L * 0.36 + o.sweep * 1.6 * S * 0.36 * f, chord: lerp(o.chord * 0.55, o.chord * 0.3, f), thick: 0.09 }); }
    M.wing(ts, 8, 0, null);
  }
  const fs = [];
  for (let i = 0; i <= 5; i++) { const f = i / 5; fs.push({ x: lerp(0.4 * R, 0.4 * R + o.fin, f), y: 0, zle: L * 0.3 + o.fin * 0.5 * f, chord: lerp(o.chord * 0.75, o.chord * 0.36, f), thick: 0.09 }); }
  M.wing(fs, 8, (si) => (si >= 3 ? 5 : 0), null, true);
  return M.geometry();
}

// A stratospheric balloon at float: a pearl teardrop 120 m tall with gores, a load line and a gondola.
function buildBalloon() {
  const M = makeMesher(), rings = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, r = Math.max(0.05, 40 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.55)), 0.72)), y = lerp(-62, 58, t) - 6 * Math.pow(t, 6), ring = [];
    for (let j = 0; j < 48; j++) { const a = (j / 48) * TAU, sc = 1 + 0.035 * Math.cos(a * 24) * Math.sin(Math.PI * t); ring.push([Math.cos(a) * r * sc, y, Math.sin(a) * r * sc, 6]); }
    rings.push(ring);
  }
  M.loft(rings, 6, { capA: true, capB: true });
  const line = [];
  for (let i = 0; i <= 6; i++) { const y = lerp(-61, -118, i / 6), ring = []; for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; ring.push([Math.cos(a) * 0.4, y, Math.sin(a) * 0.4, 1]); } line.push(ring); }
  M.loft(line, 1, {});
  const gon = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6, r = 2.6 * Math.pow(Math.sin(Math.PI * clamp(t, 0.06, 0.94)), 0.3), ring = []; for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU + 0.39; ring.push([Math.cos(a) * r, -118 - 5 * t, Math.sin(a) * r, t > 0.3 && t < 0.7 ? 5 : 3]); } gon.push(ring); }
  M.loft(gon, 3, { capA: true, capB: true });
  return M.geometry();
}

// ---------------------------------------------------------------------------------------------------------------
// Cloud bodies. Every dome and anvil is a wrapped sheet pushed out by three scales of creased noise (round tops,
// sharp creases) and written into one merged geometry for the hero's cloud material (position, normal, aO, aBoil).
const sab = (n) => Math.sqrt(n * n + 0.012) - 0.11;
const domeVerts = (o) => (o.ni + 1) * o.nj;

function writeSheetIndex(B, base, ni, nj) {
  for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
    const a = base + i * nj + j, b = base + i * nj + (j + 1) % nj, c = a + nj, d = b + nj;
    B.idx[B.ni++] = a; B.idx[B.ni++] = c; B.idx[B.ni++] = b; B.idx[B.ni++] = b; B.idx[B.ni++] = c; B.idx[B.ni++] = d;
  }
}

// smooth normals of one wrapped sheet already written at `base` (central differences on the grid; replaces a
// whole-mesh computeVertexNormals, which was one long build step)
function sheetNormals(B, base, ni, nj) {
  const P = B.pos, Q = B.nor;
  for (let i = 0; i <= ni; i++) {
    const ia = Math.max(i - 1, 0), ib = Math.min(i + 1, ni);
    for (let j = 0; j < nj; j++) {
      const a = (base + i * nj + (j + nj - 1) % nj) * 3, b = (base + i * nj + (j + 1) % nj) * 3, c = (base + ia * nj + j) * 3, d = (base + ib * nj + j) * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[d] - P[c], vy = P[d + 1] - P[c + 1], vz = P[d + 2] - P[c + 2];
      let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
      const l = Math.hypot(nx, ny, nz), q = (base + i * nj + j) * 3;
      if (l < 1e-6) { nx = 0; ny = 1; nz = 0; } else { nx /= l; ny /= l; nz /= l; }
      Q[q] = nx; Q[q + 1] = ny; Q[q + 2] = nz;
    }
  }
}

// path.nearestXZ() without its cost: the same 321 samples, the same answer (nearest sample, lowest index on a tie),
// but found through 16-sample blocks with bounding circles, and returned in one reused object (nothing to collect).
function makeNear(path) {
  const NS = 320, BS = 16, NB = Math.ceil((NS + 1) / BS), v = new THREE.Vector3();
  const sx = new Float32Array(NS + 1), sy = new Float32Array(NS + 1), sz = new Float32Array(NS + 1), bx = new Float32Array(NB), bz = new Float32Array(NB), br = new Float32Array(NB), lb = new Float32Array(NB);
  for (let i = 0; i <= NS; i++) { path.curve.getPointAt(i / NS, v); sx[i] = v.x; sy[i] = v.y; sz[i] = v.z; }
  for (let b = 0; b < NB; b++) {
    const i0 = b * BS, i1 = Math.min(i0 + BS, NS + 1); let cx = 0, cz = 0, r = 0;
    for (let i = i0; i < i1; i++) { cx += sx[i]; cz += sz[i]; }
    cx /= i1 - i0; cz /= i1 - i0;
    for (let i = i0; i < i1; i++) r = Math.max(r, Math.hypot(sx[i] - cx, sz[i] - cz));
    bx[b] = cx; bz[b] = cz; br[b] = r + 0.01;
  }
  const res = { dist: 0, u: 0, y: 0 };
  return (x, z) => {
    let b0 = 0, lo = Infinity;
    for (let b = 0; b < NB; b++) { const d = Math.max(Math.hypot(bx[b] - x, bz[b] - z) - br[b], 0); lb[b] = d * d; if (d < lo) { lo = d; b0 = b; } }
    let best = Infinity, bi = 0;
    for (let i = b0 * BS, e = Math.min(i + BS, NS + 1); i < e; i++) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    for (let b = 0; b < NB; b++) {
      if (b === b0 || lb[b] > best) continue;
      for (let i = b * BS, e = Math.min(i + BS, NS + 1); i < e; i++) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best || (d === best && i < bi)) { best = d; bi = i; } }
    }
    res.dist = Math.sqrt(best); res.u = bi / NS; res.y = sy[bi];
    return res;
  };
}

// Under the camera line a dome is never planed off (that left flat facets and straight creases): its smooth body is
// eased under a ceiling that rises away from the line, and its relief (lobes on lobes) is kept on top of that,
// compressed into whatever room is left. Everything stays round; nothing reaches the corridor.
async function writeDome(ctx, B, N, o, clear) {
  const { ni, nj } = o, base = B.nv, q = 1 / o.R, lobes = o.lobes || [];
  const sq = TAU * o.R / nj, fb = clear ? 2.0 : 2.9, fc = clear ? 4.4 : 6.6;
  const wb = clear ? smoothstep(2.0, 3.4, o.R / fb / sq) : 1, wc = clear ? smoothstep(2.0, 3.4, o.R / fc / sq) : 1;
  if (clear && !o.keep) {
    // a first, coarse pass over the crown: how far would its lobes stand above the soft ceiling? The whole crown is
    // lowered by that much (lobes with it), so that the ceiling below never has to plane a patch of it flat.
    const yS0 = o.crown - o.R * o.dome; let worst = -1e9;
    for (let i = Math.ceil(0.42 * ni); i <= ni; i += 3) {
      if ((i & 3) === 3) await ctx.yield();
      const a = ((i / ni - 0.42) / 0.58) * Math.PI / 2, rho = o.R * Math.cos(a), y = yS0 + (o.crown - yS0) * Math.sin(a);
      for (let j = 0; j < nj; j += 3) {
        const th = (j / nj) * TAU, c = Math.cos(th), s = Math.sin(th), wob = 1 + 0.15 * N.n3(c * 1.3 + o.off, s * 1.3, o.off * 0.7);
        let x = o.x + rho * c * wob + (o.lean || 0) * (y - o.base), z = o.z + rho * s * wob;
        let dx = rho * c, dy = y - yS0, dz = rho * s; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
        let d = o.R * (0.3 * sab(N.n3(x * q * 1.15 + o.off, y * q * 1.6, z * q * 1.15)) + 0.2 * wb * sab(N.n3(x * q * fb, y * q * fb * 1.35 + o.off, z * q * fb)));
        for (let k = 0; k < lobes.length; k++) {
          const L = lobes[k], lx = x - L.x, ly = (y - L.y) * 1.2, lz = z - L.z, rr = (lx * lx + ly * ly + lz * lz) / (L.r * L.r);
          if (rr < 1) d += L.r * 0.6 * Math.sqrt(1 - rr);
        }
        x += dx * d; z += dz * d;
        const n = clear.nearestXZ(x, z), cap = n.y - o.clear + n.dist * n.dist / (n.dist * 0.6 + 110);
        worst = Math.max(worst, y + 0.6 * Math.max(dy * d * 0.85, 0) - (cap - 20));
      }
    }
    const drop = clamp(worst + 12, 0, o.R * 0.4);
    if (drop > 0) { o.crown -= drop; for (const L of lobes) L.y -= drop; }
  }
  const yS = o.crown - o.R * o.dome;
  for (let i = 0; i <= ni; i++) {
    if (clear && (i & 1) === 1) await ctx.yield();
    const f = i / ni;
    for (let j = 0; j < nj; j++) {
      const th = (j / nj) * TAU, c = Math.cos(th), s = Math.sin(th);
      let rho, y, cy;
      if (f < 0.42) { const g = f / 0.42; y = lerp(o.base, yS, Math.pow(g, 0.8)); rho = o.R * (1 + 0.95 * Math.pow(1 - g, 1.4)); cy = y; }
      else { const a = ((f - 0.42) / 0.58) * Math.PI / 2; rho = o.R * Math.cos(a); y = yS + (o.crown - yS) * Math.sin(a); cy = yS; }
      const wob = 1 + 0.15 * N.n3(c * 1.3 + o.off, s * 1.3, o.off * 0.7);
      let x = o.x + rho * c * wob + (o.lean || 0) * (y - o.base), z = o.z + rho * s * wob;
      let dx = rho * c, dy = y - cy, dz = rho * s; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      const a1 = sab(N.n3(x * q * 1.15 + o.off, y * q * 1.6, z * q * 1.15)), b1 = wb * sab(N.n3(x * q * fb, y * q * fb * 1.35 + o.off, z * q * fb)), c1 = wc * sab(N.n3(x * q * fc, y * q * fc * 1.25, z * q * fc + o.off));
      const w = 0.4 + 0.6 * smoothstep(0.12, 0.5, f);
      let d = o.R * (0.3 * a1 + 0.2 * b1 + 0.09 * c1) * w, shade = a1 * 0.95 + b1 * 0.62 + c1 * 0.4 + 0.1;
      for (let k = 0; k < lobes.length; k++) {
        const L = lobes[k], lx = x - L.x, ly = (y - L.y) * 1.2, lz = z - L.z, rr = (lx * lx + ly * ly + lz * lz) / (L.r * L.r);
        if (rr < 1) { const h = Math.sqrt(1 - rr); d += L.r * 0.6 * h; shade += 0.28 * h; }
      }
      x += dx * d; z += dz * d;
      let rel = dy * d * 0.85;
      if (clear) {
        const n = clear.nearestXZ(x, z), cap = n.y - o.clear + n.dist * n.dist / (n.dist * 0.6 + 110), h0 = 20, sft = 18;
        const e = (cap - h0 - y) / sft;
        if (e < 30) y = cap - h0 - sft * Math.log(1 + Math.exp(e));
        const room = Math.max(cap - y, 1);
        if (rel > 0) rel = room * (1 - Math.exp(-rel / room));
      }
      y += rel;
      const v = B.nv++;
      B.pos[v * 3] = x; B.pos[v * 3 + 1] = y; B.pos[v * 3 + 2] = z;
      B.ao[v] = 0.3 + 0.7 * Math.pow(clamp(shade, 0, 1), 0.75) * (0.72 + 0.28 * smoothstep(0.1, 0.6, f));
      B.boil[v] = (0.12 + 0.3 * smoothstep(0.35, 0.9, f)) * clamp(o.R / 120, 0.3, 1);
    }
  }
  writeSheetIndex(B, base, ni, nj);
  sheetNormals(B, base, ni, nj);
}

// a far cumulonimbus: flared stalk, anvil plate sheared downwind (+X), rounded rim, domed top
async function writeAnvil(ctx, B, N, o) {
  const { ni, nj } = o, base = B.nv;
  for (let i = 0; i <= ni; i++) {
    if ((i & 7) === 7) await ctx.yield();
    const f = i / ni;
    for (let j = 0; j < nj; j++) {
      const th = (j / nj) * TAU, c = Math.cos(th), s = Math.sin(th), ce = Math.max(c, 0);
      const Rrim = (360 + o.reach * Math.pow(ce, 1.3)) * (1 + 0.13 * N.n3(c * 1.7 + o.off, s * 1.7, o.off)) + 50 * N.n3(c * 5, s * 5, o.off + 9);
      const fil = Math.min(190, Rrim - o.rs - 30), yF = o.under - 150;
      let rho, y, w, boil = 0.3, ux = c, uy = 0, uz = s;
      if (f < 0.5) { const g = f / 0.5; y = lerp(o.base, yF, g); rho = o.rs * (1 + 0.38 * Math.exp(-(y - o.base) / 170)) * (1 + 0.08 * N.n3(c * 1.2 + o.off, y / 200, s * 1.2)); w = 1; boil = 0.3 + 0.5 * g; }
      else if (f < 0.62) { const a = ((f - 0.5) / 0.12) * Math.PI / 2; rho = o.rs + fil * (1 - Math.cos(a)); y = yF + 150 * Math.sin(a); w = lerp(1, 0.35, (f - 0.5) / 0.12); uy = -0.4; }
      else if (f < 0.72) { const g = (f - 0.62) / 0.1; rho = lerp(o.rs + fil, Rrim - 46, g); y = o.under + 30 * g; w = 0.5; ux = 0; uz = 0; uy = -1; }
      else if (f < 0.82) { const a = -Math.PI / 2 + ((f - 0.72) / 0.1) * Math.PI; rho = Rrim - 46 + 46 * Math.cos(a); y = o.under + 76 + 46 * Math.sin(a); w = 0.6; uy = Math.sin(a) * 0.8; }
      else { const g = (f - 0.82) / 0.18; rho = (Rrim - 46) * (1 - g); y = o.under + 122 + 44 * (1 - (rho / Rrim) * (rho / Rrim)) + o.over * Math.exp(-(rho * rho) / (190 * 190)); w = 0.85; ux = 0; uz = 0; uy = 1; }
      const sh = o.shear * Math.pow(clamp((y - o.base) / (o.under - o.base), 0, 1.2), 1.6);
      let x = o.x + sh + rho * c, z = o.z + rho * s;
      const a1 = sab(N.n3(x / 190 + o.off, y / 120, z / 190)), b1 = sab(N.n3(x / 70, y / 48 + o.off, z / 70));
      const d = (a1 * 52 + b1 * 20) * w, ul = Math.hypot(ux, uy, uz) || 1;
      x += (ux / ul) * d; y += (uy / ul) * d; z += (uz / ul) * d;
      const v = B.nv++;
      B.pos[v * 3] = x; B.pos[v * 3 + 1] = y; B.pos[v * 3 + 2] = z;
      B.ao[v] = Math.pow(clamp(a1 * 0.95 + b1 * 0.7 + 0.15, 0, 1), 0.75);
      B.boil[v] = boil;
    }
  }
  writeSheetIndex(B, base, ni, nj);
  sheetNormals(B, base, ni, nj);
}

// lays out the whole cloudscape for a mood: returns the list of bodies and the empty buffers they will be written to
async function layoutCloudField(ctx, look, path) {
  const rng = look.rng, N = ctx.noise, density = look.density, bodies = [], xr = makeRng('umbra-lobes:' + ctx.seed);
  const BASE = -560;
  const lk = Math.sqrt(clamp(ctx.quality?.detail ?? 1, 0.5, 1));     // lower graphics levels get coarser turrets, never fewer
  const lod = (x, z) => { const n = path.nearestXZ(x, z).dist, r = n < 150 ? [28, 40] : n < 330 ? [19, 28] : n < 520 ? [12, 18] : n < 800 ? [10, 15] : n < 1500 ? [7, 10] : [6, 9]; return [Math.round(r[0] * lk), Math.round(r[1] * lk)]; };
  const ceilingAt = (x, z, R) => {                       // highest crown allowed here: the corridor and the cast's tracks stay clear
    let top = 1e9;
    const n = path.nearestXZ(x, z);
    if (n.dist < R * 1.5 + 45) top = Math.min(top, n.y - 44 - R * 0.3 - Math.max(0, 40 - n.dist * 0.3));
    for (const k of look.keepOut) { const d = Math.hypot(x - k.x, z - k.z); if (d < R * 1.45 + k.r) top = Math.min(top, k.top); }
    return top;
  };
  const blocked = (x, z, R) => {
    if (Math.hypot(x - HERO_POS.x - 30, z - HERO_POS.z) < 235 + R * 0.4) return true;                        // inside the exit anvil's stalk
    if (Math.hypot(x - A1.x, z - A1.z) < 250 || Math.hypot(x - A2.x, z - A2.z) < 250) return true;
    if (x > 250 && x < 740 && Math.abs(z + 1705) < 115 + R) return true;                                     // the canyon and its saddle
    if (Math.hypot(x - 512, z + 1948) < 150 + R * 0.6) return true;                                          // the shoulder tower
    return false;
  };
  const add = (x, z, R, crown, o = {}) => {
    const top = ceilingAt(x, z, R);
    if (crown > top) { if (top < -335) return null; crown = top; }
    const [ni, nj] = o.res || lod(x, z);
    const b = { kind: 'dome', x, z, R, crown, base: BASE, dome: o.dome ?? rng.range(0.75, 1.0), off: rng.range(0, 60), ni, nj, lean: o.lean ?? rng.range(-0.02, 0.07), lobes: [], clear: 44, near: path.nearestXZ(x, z).dist < R * 2.1 + 90 };
    const nl = ni >= 13 ? rng.int(2, 5) : 0;
    for (let k = 0; k < nl; k++) { const a = rng.range(0, TAU), h = rng.range(0.25, 0.85); b.lobes.push({ x: x + Math.cos(a) * R * (1 - h * 0.5), y: crown - R * b.dome * (1 - h), z: z + Math.sin(a) * R * (1 - h * 0.5), r: R * rng.range(0.34, 0.55) }); }
    if (b.near && ni >= 18) for (let k = 0; k < 4; k++) { const a = xr.range(0, TAU), h = xr.range(0.35, 0.95); b.lobes.push({ x: x + Math.cos(a) * R * (1 - h * 0.6), y: crown - R * b.dome * (1 - h), z: z + Math.sin(a) * R * (1 - h * 0.6), r: R * xr.range(0.3, 0.46) }); }
    bodies.push(b); return b;
  };
  // ---- the field: a jittered grid, gaps in clusters, heights from a slow noise so towers stand in ranges
  const cell = 212, deck = look.cloudscape === 'deck';
  const gap = deck ? 0.04 : clamp(0.4 - (density - 1) * 0.35, 0.22, 0.5);
  for (let gx = -8; gx < 8; gx++) for (let gz = -14; gz < 3; gz++) {
    if ((gz & 3) === 3) await ctx.yield();
    const x = (gx + 0.5) * cell + rng.range(-70, 70), z = (gz + 0.5) * cell + rng.range(-70, 70);
    const cl = N.n2(x / 760 + 11, z / 760) * 0.5 + 0.5, r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng();
    if (r1 * 0.6 + (1 - cl) * 0.4 < gap * 0.92) continue;
    const tall = Math.pow(clamp(N.n2(x / 520, z / 520 + 7) * 0.6 + 0.5 + (r2 - 0.5) * 0.5, 0, 1), deck ? 3.2 : 1.6);
    const far = smoothstep(650, 1300, path.nearestXZ(x, z).dist);
    const R = deck ? lerp(105, 150, r3) : lerp(52, 118, tall * 0.7 + r3 * 0.3);
    const crown = deck ? lerp(-335, -270, r4) + 150 * tall : lerp(-325, -150, tall) + 120 * far * tall;
    if (blocked(x, z, R)) continue;
    const b = add(x, z, R, crown, deck ? { dome: lerp(0.3, 0.5, r3) + 0.4 * tall } : {});
    if (!b) continue;
    const ns = deck ? (tall > 0.5 ? 1 : 0) : (r4 < 0.15 ? 0 : r4 < 0.5 ? 1 : r4 < 0.85 ? 2 : 3);                              // shoulders: lower domes leaning on the tower
    for (let k = 0; k < ns; k++) {
      const a = rng.range(0, TAU), rr = b.R * rng.range(0.52, 0.8), sx = x + Math.cos(a) * b.R * 0.9, sz = z + Math.sin(a) * b.R * 0.9;
      if (!blocked(sx, sz, rr)) add(sx, sz, rr, b.crown - b.R * rng.range(0.3, 0.75));
    }
  }
  await ctx.yield();
  // ---- the skimmed turret: its boiling crown 30 m below and to the right at u 0.34
  const sk = path.pointAt(0.345), skim = { kind: 'dome', x: sk.x + 78, z: sk.z - 6, R: 84, crown: sk.y - 58, base: BASE, dome: 0.95, off: rng.range(0, 60), ni: 60, nj: 84, lean: 0.03, lobes: [], clear: 34, near: true, keep: true };
  for (let k = 0; k < 14; k++) { const a = rng.range(0, TAU), h = rng.range(0.3, 0.98); skim.lobes.push({ x: skim.x + Math.cos(a) * 74 * (1 - h * 0.7), y: skim.crown - 80 * (1 - h), z: skim.z + Math.sin(a) * 74 * (1 - h * 0.7), r: k < 5 ? rng.range(28, 42) : rng.range(14, 26) }); }
  for (let i = bodies.length - 1; i >= 0; i--) if (Math.hypot(bodies[i].x - skim.x, bodies[i].z - skim.z) < 150) bodies.splice(i, 1);
  bodies.push(skim);
  add(skim.x + 96, skim.z - 70, 58, skim.crown - 62, { res: [16, 24] }); add(skim.x + 40, skim.z + 105, 50, skim.crown - 85, { res: [16, 24] });
  // ---- turrets that bury the saddle's far (east) face and the stalk's foot (kept below the saddle's crest: nothing sunlit behind the portal)
  for (const [x, z, R, c] of [[845, -1640, 105, -18], [905, -1800, 118, -8], [770, -1905, 96, -30], [1010, -1690, 100, -40]]) add(x, z, R, c + rng.range(-12, 12), { res: [13, 20] });
  // ---- the squall line: a wall of towers joining the exit anvil to A2
  if (look.cloudscape === 'squall') for (let k = 0; k < 7; k++) {
    const f = (k + 0.9) / 7.6, x = lerp(HERO_POS.x + 330, A2.x, f) + rng.range(-50, 50), z = lerp(HERO_POS.z - 110, A2.z, f) + rng.range(-60, 60);
    if (blocked(x, z, 150)) continue;
    const R = rng.range(150, 205), b = add(x, z, R, rng.range(40, 240), { res: [16, 24], dome: 1.1 });
    if (b) { add(x + rng.range(-150, 150), z + rng.range(60, 190), R * 0.6, b.crown - R * rng.range(0.7, 1.1), { res: [11, 16] }); add(x + rng.range(-120, 120), z - rng.range(60, 170), R * 0.55, b.crown - R * rng.range(0.6, 1.0), { res: [11, 16] }); }
  }
  // ---- the two far anvils (A1's plate is kept short under a low sun, so that the sun line stays over open horizon)
  const anv = [{ kind: 'anvil', x: A1.x, z: A1.z, base: BASE, under: 196, rs: 235, reach: look.lowSun ? 170 : 420, shear: 105, over: 62, off: rng.range(0, 60), ni: 56, nj: 72 },
    { kind: 'anvil', x: A2.x, z: A2.z, base: BASE, under: 226, rs: 255, reach: 470, shear: 120, over: 70, off: rng.range(0, 60), ni: 56, nj: 72 }];
  for (let i = bodies.length - 1; i >= 0; i--) if (bodies[i] !== skim && bodies[i].z - bodies[i].R * 2 > 70) bodies.splice(i, 1);   // wholly behind the entry: never in any frame
  bodies.sort((a, b) => b.z - a.z);                      // nearest to the entry first, so the depth test spares the far ones' shading
  let nv = 0, nt = 0;
  for (const b of [...bodies, ...anv]) { nv += domeVerts(b); nt += b.ni * b.nj * 2; }
  const B = { pos: new Float32Array(nv * 3), nor: new Float32Array(nv * 3), ao: new Float32Array(nv), boil: new Float32Array(nv), idx: new Uint32Array(nt * 3), nv: 0, ni: 0 };
  return { B, bodies, anv, skim, tris: nt };
}

// Ice crystals and cirrus wisps: instanced streaks in a box that wraps round the camera, aligned with the flight.
const ICE_VERT = /* glsl */`
attribute vec4 aR;      // xyz place in the box 0..1, w seed
uniform vec3 uBox, uDir, uWind; uniform vec4 uShape;   // half width, length, min angular half width, near fade
uniform float uTime;
varying vec2 vUv; varying vec4 vI;   // x alpha, y seed, z toward-sun glitter, w distance
uniform vec3 uSunDir;
void main(){
  vec3 loc = mod(aR.xyz * uBox + uWind * uTime - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5;
  vec3 c = cameraPosition + loc;
  float dist = max(length(loc), 1e-3);
  vec3 toC = -loc / dist;
  vec3 sideV = cross(uDir, toC); sideV = sideV / max(length(sideV), 1e-3);
  float w0 = uShape.x * (0.6 + 0.8 * aR.w), w = max(w0, dist * uShape.z);
  vec3 wp = c + sideV * position.x * w + uDir * position.y * uShape.y * (0.6 + 0.8 * fract(aR.w * 7.3)) * 0.5;
  vec3 e = abs(loc) / (uBox * 0.5);
  float fade = (1. - smoothstep(0.8, 1., e.x)) * (1. - smoothstep(0.8, 1., e.y)) * (1. - smoothstep(0.8, 1., e.z));
  fade *= smoothstep(uShape.w * 0.3, uShape.w, dist) * (w0 / w);
  vUv = position.xy;
  vI = vec4(fade, aR.w, max(dot(-toC, uSunDir), 0.), dist);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const ICE_FRAG = /* glsl */`
uniform vec3 uTint; uniform float uTime, uSoft;
varying vec2 vUv; varying vec4 vI;
${NOISE_GLSL}
void main(){
  float ax = 1. - vUv.x * vUv.x, ay = 1. - vUv.y * vUv.y;
  float a = ax * ax * ay * vI.x;
  if (uSoft > 0.5) {
    float n = vn3(vec3(vUv.x * 2.5 + vI.y * 9., vUv.y * 5. + vI.y * 31., vI.y * 5.)) * 0.6 + vn3(vec3(vUv.x * 7., vUv.y * 13., vI.y * 3.)) * 0.4;
    a *= smoothstep(0.3, 0.85, n);
    gl_FragColor = vec4(uTint * a * (0.6 + 0.9 * vI.z * vI.z), 0.);
  } else {
    float tw = 0.55 + 0.45 * sin(uTime * (7. + vI.y * 9.) + vI.y * 80.);
    float g = vI.z * vI.z; g *= g;
    gl_FragColor = vec4(uTint * a * tw * (0.55 + 2.6 * g), 0.);
  }
}`;

function makeStreaks(rng, count, o) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const r = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) r[i] = rng();
  g.setAttribute('aR', new THREE.InstancedBufferAttribute(r, 4));
  g.instanceCount = count;
  const uniforms = { uBox: { value: new THREE.Vector3(...o.box) }, uDir: { value: new THREE.Vector3(0, 0, -1) }, uWind: { value: new THREE.Vector3(...o.wind) }, uShape: { value: new THREE.Vector4(...o.shape) },
    uTime: o.time, uSunDir: o.sunDir, uTint: { value: new THREE.Color(1, 1, 1) }, uSoft: { value: o.soft ? 1 : 0 } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: ICE_VERT, fragmentShader: ICE_FRAG, uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
  m.frustumCulled = false; m.renderOrder = o.order ?? 6;
  return { object: m, uniforms };
}

function makeLamps(list, time, core = 1, depthTest = true) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const n = list.length, p = new Float32Array(n * 3), c = new Float32Array(n * 4), b = new Float32Array(n * 3);
  list.forEach((l, i) => { p.set(l.p, i * 3); c.set([l.c[0], l.c[1], l.c[2], l.size], i * 4); b.set(l.blink || [0, 0, 1], i * 3); });
  const aCol = new THREE.InstancedBufferAttribute(c, 4);
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(p, 3)); g.setAttribute('aCol', aCol); g.setAttribute('aBlink', new THREE.InstancedBufferAttribute(b, 3));
  g.instanceCount = n;
  const uniforms = { uTime: time, uGain: { value: 1 }, uCore: { value: core } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG, uniforms, transparent: true, depthWrite: false, depthTest, blending: THREE.AdditiveBlending }));
  m.frustumCulled = false; m.renderOrder = depthTest ? 5 : 2;
  return { object: m, uniforms, aCol };
}

// ---------------------------------------------------------------------------------------------------------------
export default {
  id: 'the-umbra',
  name: 'The Umbra',
  category: 'sky',
  weirdness: 0.1,
  media: ['air'],

  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();

    // ---- LOOK: the seeded mood (cloudscape + cast), the corona, the livery; the sun's height follows the hour
    const lr = rng.fork('umbra-look');
    const mood = lr.pick(['deck', 'squall', 'field']);
    const corona = lr.pick(['minimum', 'maximum', 'skewed']);
    const livery = lr.pick(['white', 'metal', 'black']);
    const nProm = lr.int(2, 5);
    const cast = mood === 'field' ? 'chase' : mood === 'deck' ? 'airliner' : 'balloon';
    const hour = vary.hour || 'any';
    const sunElev = hour === 'day' ? 34 : (hour === 'golden' || hour === 'dawn' || hour === 'night') ? 13 : 26;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), moodK = vary.mood ?? 0.5;
    const palette = ['#1B4FA8', '#EEF1F6', '#1A1B3A', '#4A4668', '#F2EEE4', mood === 'squall' ? '#E2733A' : mood === 'deck' ? '#EE9244' : '#E8823A', '#FF5C8A'];

    // ---- HERO: the dome, the sun and the exit anvil. Placed, never rotated or scaled.
    const hero = await buildHero(ctx, { palette, sunElev, sunAz: 8, corona, prominences: nProm, seatGlow: 0 });
    hero.object.position.copy(HERO_POS);
    scene.add(hero.object);
    const HU = hero.uniforms, sunDir = hero.anchors.sunDir.clone(), lean = 1 / Math.tan(sunElev * D2R);
    HU.uGold.value.setRGB(1.08, 0.76, 0.4);                      // the returning light: a deeper gold than the silver it left as
    HU.uWarm.value.multiplyScalar(0.8); HU.uCool.value.multiplyScalar(0.8);   // slate turrets under the corona, so the ring and the sun carry the picture
    scene.fog = new THREE.FogExp2(0x9db4d6, FOG * lerp(0.9, 1.08, moodK));
    await ctx.yield();

    // ---- PATH: level entry heading -Z, a 12 degree descent to the turret tops, then the hero's own line
    const ft = hero.anchors.flyThrough.map((v) => v.clone().add(HERO_POS));
    const path = makePath([[0, 0, 0], [1, 0, -80], [3, 0, -170], [5, -1, -260], [9, -12, -350], [15, -40, -480], [23, -74, -640], ...ft]);
    const L = path.length;
    await ctx.yield();
    const tv = new THREE.Vector3(), tv2 = new THREE.Vector3(), tv3 = new THREE.Vector3();
    path.pointAt(U_C2, tv).sub(HERO_POS);
    const sC2 = tv.z + lean * tv.y;                              // the shadow reaches the camera exactly at u 0.39
    const frontAt = (u) => sC2 + 7700 * (u - U_C2) + 720 * (1 - smoothstep(0, 0.24, u));
    const TRAIL = 2800;                                           // totality lasts until u ~0.685: third contact while the sun is still 30 degrees off the nose
    const portalPos = path.end.clone();

    // ---- CAST TRACKS (decided before the clouds so that turrets keep out of their way)
    const tracks = [];                                           // { path, lead, speed, engines: [lateral offsets], y }
    const keepOut = [];
    const rightAt = (p, d, out) => { p.tangentAtDist(d, out); return out.set(-out.z, 0, out.x).normalize(); };
    if (cast === 'chase') {
      const S = ft[2];                                           // where we break right round the stalk
      for (const [lat, lead, tail] of [[-17, 96, [[-43, -10, -200], [-143, 20, -400], [-363, 75, -540], [-673, 135, -590], [-1033, 195, -570], [-1533, 255, -490]]], [21, 152, [[17, -15, -200], [7, -5, -440], [-13, 15, -740], [-33, 45, -1140], [-53, 75, -1640]]]]) {
        const pts = [];
        for (let d = -520; d <= 1260; d += 110) { path.posAtDist(d, tv); rightAt(path, d, tv2); pts.push([tv.x + tv2.x * lat, tv.y - 15, tv.z + tv2.z * lat]); }
        pts.push([S.x + lat, S.y - 15, S.z]);
        for (const t of tail) pts.push([S.x + t[0], S.y + t[1], S.z + t[2]]);
        tracks.push({ path: makePath(pts), lead: lead + 520, speed: 1, engines: [-5.6, 5.6], kind: 'chase' });
        await ctx.yield();
      }
    } else if (cast === 'airliner') {
      tracks.push({ path: makePath([[-420, -118, 500], [-330, -118, -400], [-230, -118, -1300], [-130, -118, -2200], [-40, -118, -3100]]), lead: 1100, speed: 0.55, engines: [-17, -9, 9, 17], kind: 'airliner' });
    }
    for (const t of tracks) for (let d = 0; d <= t.path.length; d += 120) { t.path.posAtDist(d, tv); keepOut.push({ x: tv.x, z: tv.z, r: 45, top: tv.y - 42 }); }
    const balloonAt = new THREE.Vector3(path.pointAt(0.245, tv).x - 96, tv.y + 42, tv.z);
    if (cast === 'balloon') keepOut.push({ x: balloonAt.x, z: balloonAt.z, r: 60, top: balloonAt.y - 175 });

    // ---- CLOUDS: turret field, skimmed turret, far anvils, squall wall: one geometry, the hero's cloud material
    await ctx.yield();
    const field = await layoutCloudField(ctx, { rng: rng.fork('clouds'), density, cloudscape: mood, keepOut, lowSun: sunElev < 20 }, path);
    {
      const { B, bodies, anv } = field; let work = 0;
      const nearPath = { nearestXZ: makeNear(path) };            // the path's own answer, several times cheaper (see makeNear)
      for (const b of bodies) {
        await writeDome(ctx, B, ctx.noise, b, b.near ? nearPath : null);
        work += domeVerts(b) * (b.near ? 6 : 1); if (work > 3500) { work = 0; await ctx.yield(); }
      }
      for (const a of anv) { await writeAnvil(ctx, B, ctx.noise, a); await ctx.yield(); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(B.pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(B.nor, 3));
      geo.setAttribute('aO', new THREE.BufferAttribute(B.ao, 1));
      geo.setAttribute('aBoil', new THREE.BufferAttribute(B.boil, 1));
      geo.setIndex(new THREE.BufferAttribute(B.idx, 1));
      await ctx.yield();
      const hgt = new THREE.Vector4(-420, 1 / 640, -545, 1);    // base, 1/height, where the bodies melt into haze, haze mix
      const clouds = new THREE.Mesh(geo, hero.makeCloudMaterial({ hgt, lobe3: true, soft: 0.1 }));
      clouds.frustumCulled = false;
      scene.add(clouds);
    }
    await ctx.yield();

    // ---- DECK: the undercast far below (raised and closed in the 'deck' mood, rippled by gravity waves)
    const deckY = mood === 'deck' ? -600 : -780;
    const deckU = { ...hero.cloudUniforms(), uDeck: { value: new THREE.Vector4(mood === 'deck' ? 0.92 : lerp(0.42, 0.6, lr()), lr.range(0.3, 1.2), mood === 'deck' ? 1 : 0.25, mood === 'deck' ? 0.12 : 0.3) } };
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(26000, 26000, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: DECK_VERT, fragmentShader: DECK_FRAG, uniforms: deckU, fog: true }));
    deck.position.set(0, deckY, -1100); deck.frustumCulled = false;
    scene.add(deck);

    // ---- JET: our aircraft, a rig placed at the camera every frame (the camera is the pod on its fin tip)
    const LIV = { white: { skin: [0.76, 0.77, 0.79], trim: '#1B4FA8', gloss: 0.55, frost: 1 }, metal: { skin: [0.5, 0.52, 0.56], trim: '#1B4FA8', gloss: 0.95, frost: 0.7 }, black: { skin: [0.03, 0.032, 0.04], trim: '#B9BECC', gloss: 0.85, frost: 0.5 } };
    const acMaterial = (liv, span, axis, grid) => new THREE.ShaderMaterial({
      vertexShader: AC_VERT, fragmentShader: AC_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: { ...hero.cloudUniforms(), uCtl: { value: new THREE.Vector4(0, 0, 0, 0) }, uSpan: { value: span }, uSkin: { value: new THREE.Color(...liv.skin) }, uTrim: { value: new THREE.Color(liv.trim) },
        uLiv: { value: new THREE.Vector4(liv.gloss, 0.85, liv.frost, axis) }, uGrid: { value: new THREE.Vector4(grid[0], grid[1], 48, grid[2]) } } });
    const rig = new THREE.Group(); rig.name = 'research-jet';
    await ctx.yield();
    const jet = await buildResearchJet(ctx);
    const jetMat = acMaterial(LIV[livery], 15.5, jet.axis, [1.12, 1.36, 0.035]);
    const jetMesh = new THREE.Mesh(jet.geometry, jetMat); jetMesh.frustumCulled = false; rig.add(jetMesh);
    const AX = jet.axis;
    const jetLamps = makeLamps([
      { p: [0, AX + 1.0, -9.6], c: [3.4, 0.9, 1.6], size: 0.62, blink: [1.2, 0, 14] },          // the rose beacon, once every 1.2 s
      { p: [-15.6, AX + 0.52, -11.5], c: [3.2, 0.35, 0.25], size: 0.3 }, { p: [15.6, AX + 0.52, -11.5], c: [0.25, 3.0, 1.0], size: 0.3 },
      { p: [-5, AX + 0.68, -12.6], c: [1.6, 1.7, 2.0], size: 0.2, blink: [2.4, 0.3, 30] }, { p: [5, AX + 0.68, -12.6], c: [1.6, 1.7, 2.0], size: 0.2, blink: [2.4, 0.8, 30] },
    ], HU.uTime);
    rig.add(jetLamps.object);
    const vapU = { uVap: { value: 0 }, uVapCol: { value: new THREE.Color(1, 1, 1) }, uUmbra: HU.uUmbra, uSunDir: HU.uSunDir, uTime: HU.uTime, uOrg: HU.uOrg };
    const vapGeo = new THREE.BufferGeometry(), vp = [], vuv = [], vi = [];
    for (const s of [-1, 1]) { const b = vp.length / 3; vp.push(s * 1.4, AX + 0.75, -13.1, s * 13, AX + 0.95, -12.2, s * 13, AX + 3.0, -6.2, s * 1.4, AX + 2.7, -7); vuv.push(0, 0, 1, 0, 1, 1, 0, 1); vi.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    vapGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vp), 3)); vapGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(vuv), 2)); vapGeo.setIndex(vi);
    const vapour = new THREE.Mesh(vapGeo, new THREE.ShaderMaterial({ vertexShader: VAP_VERT, fragmentShader: VAP_FRAG, uniforms: vapU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
    vapour.frustumCulled = false; vapour.renderOrder = 7; rig.add(vapour);
    scene.add(rig);
    await ctx.yield();

    // ---- CAST: chase jets or the airliner (with contrail ribbons along their tracks), or the balloon
    const castObjs = [], uHead = { value: [0, 0, 0, 0] };
    const Y = new THREE.Vector3(0, 1, 0);
    if (tracks.length) {
      const chase = tracks[0].kind === 'chase';
      const geo = chase ? buildTwinJet({ length: 21, span: 37, radius: 1.05, chord: 5.4, taper: 0.5, sweep: 0.04, engines: [0.3], nacelle: 6.5, nacR: 0.95, fin: 4.2, dihedral: 0.02 })
        : buildTwinJet({ length: 64, span: 60, radius: 3.0, chord: 11, taper: 0.3, sweep: 0.5, engines: [0.3, 0.57], nacelle: 6, nacR: 1.35, nacDrop: 2.4, fin: 9.5, dihedral: 0.09, tailY: 1 });
      await ctx.yield();
      const mat = acMaterial(chase ? LIV.white : LIV.metal, chase ? 18.5 : 30, 0, chase ? [1.7, 1.9, 0.05] : [3.1, 2.6, 0.16]);
      const tp = [], tt = [], ti = [], tix = [];
      tracks.forEach((t, k) => {
        const g = new THREE.Group();
        const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; g.add(m);
        const s = chase ? 1 : 2.2;
        const lamps = makeLamps([{ p: [0, 1.6 * s, 2], c: [3.2, 0.5, 0.4], size: 0.5 * s, blink: [1.1, 0.37 * k, 16] }, { p: [-18.5 * (chase ? 1 : 1.62), 0.5, 1], c: [3.0, 0.3, 0.25], size: 0.3 * s }, { p: [18.5 * (chase ? 1 : 1.62), 0.5, 1], c: [0.25, 2.8, 0.9], size: 0.3 * s }], HU.uTime);
        g.add(lamps.object);
        scene.add(g); castObjs.push({ g, t, k, lamps });
        t.engines.forEach((e, ei) => {
          const base = tp.length / 3, n = Math.floor(t.path.length / 14);
          for (let i = 0; i <= n; i++) {
            const d = i * 14; t.path.posAtDist(d, tv); t.path.tangentAtDist(d, tv2); tv3.set(-tv2.z, 0, tv2.x).normalize();
            for (const sd of [-1, 1]) { tp.push(tv.x + tv3.x * e, tv.y - 0.5, tv.z + tv3.z * e); tt.push(tv2.x, tv2.y, tv2.z); ti.push(sd, d, k + 0.11 * (ei + 1) + 0.03 * k); }
            if (i < n) { const a = base + i * 2; tix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
          }
        });
      });
      await ctx.yield();
      const tg = new THREE.BufferGeometry();
      tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tp), 3)); tg.setAttribute('aTan', new THREE.BufferAttribute(new Float32Array(tt), 3)); tg.setAttribute('aInfo', new THREE.BufferAttribute(new Float32Array(ti), 3));
      tg.setIndex(tix);
      const trails = new THREE.Mesh(tg, new THREE.ShaderMaterial({ vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG, uniforms: { ...hero.cloudUniforms(), uHead }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      trails.frustumCulled = false; trails.renderOrder = 1;
      scene.add(trails);
    }
    let balloon = null;
    if (cast === 'balloon') {
      await ctx.yield();
      balloon = new THREE.Mesh(buildBalloon(), acMaterial({ skin: [0.8, 0.79, 0.76], trim: '#FF5C8A', gloss: 0.5, frost: 0 }, 1e4, 0, [1e4, 1e4, 0.1]));
      balloon.material.uniforms.uLiv.value.y = 0;
      balloon.position.copy(balloonAt); balloon.frustumCulled = false;
      const bl = makeLamps([{ p: [0, -121, 0], c: [3.2, 0.8, 1.5], size: 1.6, blink: [1.6, 0, 12] }], HU.uTime);
      balloon.add(bl.object);
      scene.add(balloon);
    }
    await ctx.yield();

    // ---- FX: ice streaks and cirrus wisps round the camera, lightning cores in the far storms, the rare red sprites
    const ice = makeStreaks(rng.fork('ice'), Math.round(520 * detail * density), { box: [40, 26, 90], wind: [2.5, -0.6, 5], shape: [0.011, 1.3, 0.0023, 5.5], time: HU.uTime, sunDir: HU.uSunDir });
    const wisps = makeStreaks(rng.fork('wisp'), Math.round(44 * detail * density), { box: [460, 120, 900], wind: [3, 0, 9], shape: [10, 170, 0, 45], time: HU.uTime, sunDir: HU.uSunDir, soft: true, order: 3 });
    scene.add(ice.object, wisps.object);
    const glowAt = [], camRef = new THREE.Vector3(33, -60, -1000);
    for (const A of [A1, A2]) {
      const dx = camRef.x - A.x, dz = camRef.z - A.z, dl = Math.hypot(dx, dz);
      glowAt.push({ p: [A.x + (dx / dl) * 250 + 40, 70, A.z + (dz / dl) * 250], c: [0, 0, 0], size: 150 }, { p: [A.x + (dx / dl) * 340 + 90, 150, A.z + (dz / dl) * 340], c: [0, 0, 0], size: 175 });
    }
    const glows = makeLamps(glowAt, HU.uTime, 0);
    scene.add(glows.object);
    const gseed = rng.int(1, 1e9);
    const hashI = (k) => { let h = Math.imul(k ^ gseed, 2654435761); h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
    let sprites = null;
    const spU = { uSpA: { value: new THREE.Vector4(A1.x + 150, 455, A1.z + 60, 0) }, uSpB: { value: new THREE.Vector4(A1.x - 150, 440, A1.z + 150, 0) }, uSpSize: { value: new THREE.Vector2(480, 1000) }, uRose: HU.uRose, uTime: HU.uTime };
    if (vary.rare) {
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
      sg.setAttribute('aK', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 1, 1, 1, 1]), 1));
      sg.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
      sprites = new THREE.Mesh(sg, new THREE.ShaderMaterial({ vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, uniforms: spU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      sprites.frustumCulled = false; sprites.renderOrder = 2;
      scene.add(sprites);
    }

    // ---- POIS: the skimmed turret, the sun through totality, then the portal
    const poiV = new THREE.Vector3();
    const skimAt = new THREE.Vector3(field.skim.x - 20, field.skim.crown, field.skim.z - 40);
    const sunAt = (time, u) => path.pointAt(clamp(u, 0, 1), poiV).addScaledVector(sunDir, 3000);
    const pois = [
      { at: skimAt, from: 0.25, to: 0.39, weight: 0.3 },
      { at: sunAt, from: 0.34, to: 0.7, weight: 0.6 },                    // the reveal
      { at: sunAt, from: 0.58, to: 0.78, weight: 0.8, fade: 0.45 },       // held through third contact (u ~0.685), then let slide out to the left
      { at: portalPos, from: 0.74, to: 1, weight: 0.5 },
    ];

    // ---- per-frame state
    const tan = new THREE.Vector3(), tan2 = new THREE.Vector3(), gaze = new THREE.Vector3(), cr = new THREE.Vector3(), fwd = new THREE.Vector3(), r0 = new THREE.Vector3(), up0 = new THREE.Vector3(), rt = new THREE.Vector3(), up = new THREE.Vector3();
    const m4 = new THREE.Matrix4(), camR = new THREE.Matrix4(), camP = new THREE.Vector3(), ov = [null, null, null];
    const iceLit = new THREE.Color(0.36, 0.42, 0.52), iceDark = new THREE.Color(0.13, 0.11, 0.13), wispLit = new THREE.Color(0.085, 0.095, 0.12), wispDark = new THREE.Color(0.03, 0.022, 0.026);
    const vapLit = new THREE.Color(0.8, 0.84, 0.92), vapDark = new THREE.Color(0.2, 0.16, 0.2), boltC = new THREE.Color('#C9C4FF');
    const orient = (obj, f, roll) => {
      r0.crossVectors(f, Y).normalize(); up0.crossVectors(r0, f);
      rt.copy(r0).multiplyScalar(Math.cos(roll)).addScaledVector(up0, Math.sin(roll)); up.crossVectors(rt, f);
      tan2.copy(f).negate(); m4.makeBasis(rt, up, tan2); obj.quaternion.setFromRotationMatrix(m4);
    };
    const pulse = (t) => (t <= 0 || t >= 0.42 ? 0 : t < 0.1 ? smoothstep(0, 0.1, t) : 1 - smoothstep(0.1, 0.4, t));

    function update(dt, time, camera, u) {
      const uu = clamp(u ?? 0, 0, 1), d = uu * L;
      // the shadow: second contact at u 0.39, the trailing edge 3400 m behind
      const F = frontAt(uu);
      hero.setFront(F, F - TRAIL);
      // the portal's pearl light inside the cloud: on the canyon's mouth from u 0.6, then a soft glow round the seat
      hero.seatGlow = lerp(1.1 * smoothstep(0.6, 0.7, uu), 0.2, smoothstep(0.74, 0.82, uu));
      // the storm wall breathes with light while we round it, and the canyon wall after
      const br = smoothstep(0.6, 0.67, uu);
      if (br > 0) {
        const s1 = 0.5 + 0.5 * Math.sin(time * 2.3), s2 = 0.5 + 0.5 * Math.sin(time * 1.7 + 2);
        const out = 1 - smoothstep(0.745, 0.8, uu);                  // the canyon itself stays a quiet blue trough: only a faint breath there
        ov[0] = br * out * (0.25 + 0.75 * s1 * s1); ov[1] = null; ov[2] = br * (0.12 + 0.4 * s2 * s2) * (0.3 + 0.25 * out);
        hero.boltOverride = ov;
      } else hero.boltOverride = null;
      hero.update(dt, time, camera);
      HU.uOccA.value.w *= 1.55;                                  // the shoulder tower's shadow fills the canyon: its walls stay in shade after third contact
      scene.fog.color.copy(hero.haze);
      const st = hero.state, light = clamp(st.light, 0, 1), open = st.open;

      // our aircraft: at the camera, along the path with a little of the gaze, rolled a touch further than the horizon
      path.tangentAt(uu, tan); path.tangentAtDist(d + 60, tan2);
      const turn = tan.z * tan2.x - tan.x * tan2.z, at = Math.abs(turn);
      camP.setFromMatrixPosition(camera.matrixWorld); camR.extractRotation(camera.matrixWorld);   // the camera behind a portal has only its world matrix set
      gaze.set(0, 0, -1).applyMatrix4(camR);
      cr.set(1, 0, 0).applyMatrix4(camR);
      fwd.copy(tan).multiplyScalar(0.7).addScaledVector(gaze, 0.3).normalize();
      orient(rig, fwd, Math.asin(clamp(cr.y, -1, 1)) * 1.3 + 0.01 * Math.sin(time * 0.9));
      rig.position.copy(camP);
      const ail = clamp(-turn * 0.5, -0.14, 0.14) + 0.02 * Math.sin(time * 3.1) + 0.012 * Math.sin(time * 7.3);
      jetMat.uniforms.uCtl.value.set(ail, -ail, at * 0.5 + 0.03 * Math.max(0, Math.sin(time * 2.7)), 0.3 + at * 2.2 + 0.2 * Math.sin(time * 2.1) + 0.12 * Math.sin(time * 3.7 + 1));
      jetLamps.uniforms.uGain.value = lerp(1.5, 0.7, light);
      vapU.uVap.value = smoothstep(0.07, 0.15, at) * (0.7 + 0.3 * Math.sin(time * 5.1));
      vapU.uVapCol.value.copy(vapDark).multiplyScalar(0.5 + 0.5 * open).lerp(vapLit, light);

      // the cast
      for (const c of castObjs) {
        const jd = Math.min(c.t.lead + d * c.t.speed, c.t.path.length - 2);
        c.t.path.posAtDist(jd, c.g.position); c.t.path.tangentAtDist(jd, tan); c.t.path.tangentAtDist(jd + 50, tan2);
        const tj = tan.z * tan2.x - tan.x * tan2.z;
        c.g.position.y += 0.8 * Math.sin(time * 0.6 + c.k * 2.1);
        orient(c.g, tan, clamp(tj * 5, -1, 1) + 0.06 * Math.sin(time * 0.8 + c.k * 2.4));
        uHead.value[c.k] = jd - (c.t.kind === 'chase' ? 6 : 14);
        c.lamps.uniforms.uGain.value = lerp(1.6, 0.8, light);
      }
      if (balloon) {
        balloon.position.set(balloonAt.x + 1.5 * Math.sin(time * 0.2), balloonAt.y + 0.8 * Math.sin(time * 0.31), balloonAt.z);
        balloon.rotation.set(0.02 * Math.sin(time * 0.4), time * 0.03, 0.02 * Math.sin(time * 0.33 + 1));
      }

      // ice and wisps streak along the flight direction and take the colour of the light
      path.tangentAt(uu, tan);
      ice.uniforms.uDir.value.copy(tan); wisps.uniforms.uDir.value.copy(tan);
      ice.uniforms.uTint.value.copy(iceDark).multiplyScalar(0.45 + 0.55 * open).lerp(iceLit, light);
      wisps.uniforms.uTint.value.copy(wispDark).multiplyScalar(0.4 + 0.6 * open).lerp(wispLit, light);

      // lightning inside the two far storms: at most one eased pulse a second between them
      const k0 = Math.floor(time), fogK = 0.55;
      let l1 = 0, l2 = 0;
      for (let k = k0 - 1; k <= k0; k++) {
        if (hashI(k) > 0.7) continue;
        const e = pulse(time - (k + 0.15 + 0.5 * hashI(k * 13 + 5))) * (0.55 + 0.45 * hashI(k * 3 + 1));
        if (hashI(k * 7 + 3) < 0.5) l1 = Math.max(l1, e); else l2 = Math.max(l2, e);
      }
      const gk = fogK * lerp(1.5, 0.6, light);
      for (let i = 0; i < 4; i++) { const lv = (i < 2 ? l1 : l2) * gk * (i % 2 ? 0.8 : 1); glows.aCol.setXYZ(i, boltC.r * lv, boltC.g * lv, boltC.b * lv); }
      glows.aCol.needsUpdate = true;

      // the rare event: two red sprites above the far anvil, a second apart, deep in totality
      if (sprites) {
        const env = (u0) => smoothstep(u0, u0 + 0.004, uu) * (1 - smoothstep(u0 + 0.011, u0 + 0.026, uu));
        spU.uSpA.value.w = env(0.542) * 1.15; spU.uSpB.value.w = env(0.565);
      }
    }

    return {
      scene, path, duration: 44,
      camera: { fov: 70, near: 0.3, far: 6000, lookAhead: 60, sway: 0.6, bank: 4.5 },
      pois,
      portal: { shape: 'circle', radius: 10, color: '#DCE6FF', glow: 1, revealDistance: 700, tilt: true },
      post: { exposure: 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 1.2 }, grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#000000', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
